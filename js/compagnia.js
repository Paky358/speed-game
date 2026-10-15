/* =========================================================
   LA COMPAGNIA — "SGCompagnia"
   La "Compagnia" è il gruppo fisso degli amici (es. 🍻 Quelli del giovedì):
   un codice di 6 lettere e un link che valgono per sempre. Qui ci sono:
   - la memoria delle compagnie (su questo telefono e nel profilo, così ti
     seguono anche su un altro telefono; chi ne toglie una lascia una
     "lapide" per 60 giorni, così non ricompare dall'altro telefono);
   - il link fisso e il messaggio da mandare nel gruppo;
   - la "sbirciata": chi c'è già dentro, senza entrare (al massimo una ogni
     30 secondi, solo con l'app in vista);
   - le tessere della home, la schermata "Le tue compagnie", il foglio
     "nome ed emoji" e la memoria "Giocato di recente".
   Il core gli passa i suoi aiuti con SGCompagnia.collega(api).
   Al caricamento non usa SG né SGNet: solo dentro le sue funzioni.
   ========================================================= */
(function () {
  "use strict";

  var K_COMP = "sg-compagnie", K_REC = "sg-recenti";
  var MAX_COMP = 8, MAX_REC = 20;
  var LAPIDE_MS = 60 * 24 * 3600 * 1000;   // una compagnia tolta resta "tolta" 60 giorni
  var OGNI = 30000;                         // una sbirciata al massimo ogni 30 secondi
  var EMOJI = ["🍻", "🎲", "🍕", "⚽", "🎉", "🃏", "🏠", "🔥", "🎮", "🌙", "👑", "🦄"];
  var api = {};
  var CACHE = { t: 0, esito: {} };          // l'ultima sbirciata: esito[C] = { stato, msg, gen }
  var GIRO = null;                          // la sbirciata in corso: { codici, attesa: [...] }
  var TESSERE = [];                         // le tessere a vista (si aggiornano al loro posto)
  var collegato = false, ultimoProfilo = null;

  // ------- piccoli aiuti -------
  function el(tag, attrs, figli) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null) continue;
      if (k === "class") e.className = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (figli) figli.forEach(function (f) { if (f != null) e.appendChild(typeof f === "string" ? document.createTextNode(f) : f); });
    return e;
  }
  function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function leggiL(k) { try { var v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function scriviL(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function norm(C) { return String(C == null ? "" : C).toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function testo(n, t) { if (n.textContent !== t) n.textContent = t; }   // cambia solo se serve (niente lampeggio)
  function pill(t, colore) { if (api.pillola) try { api.pillola("sala", t, colore || null, 2600); } catch (e) {} }
  function conProfilo() {
    try { if (api.profilo) return !!api.profilo(); } catch (e) {}
    try { return !!(window.SGNube && SGNube.disponibile() && SGNube.profilo()); } catch (e) { return false; }
  }

  // =========================================================
  //  MEMORIA DELLE COMPAGNIE
  //  voce = { c: codice, n: nome, e: emoji, rv: quando è stato deciso il nome, t: creata, u: ultima volta usata }
  //  lapide = { c, via: 1, u: quando è stata tolta }
  // =========================================================
  function pulita(v) {
    if (!v || typeof v !== "object") return null;
    var c = norm(v.c); if (c.length < 4 || c.length > 8) return null;
    var u = +v.u || 0;
    if (v.via) return { c: c, via: 1, u: u };
    return { c: c, n: String(v.n || "La compagnia").slice(0, 24), e: String(v.e || "🍻").slice(0, 8), rv: +v.rv || 0, t: +v.t || u, u: u };
  }
  function pulisciLista(l) { var out = []; (Array.isArray(l) ? l : []).forEach(function (v) { v = pulita(v); if (v) out.push(v); }); return out; }
  function perUso(a, b) { return (b.u || 0) - (a.u || 0) || (a.c < b.c ? -1 : 1); }
  // unisce due liste per codice: nome ed emoji dal rv più nuovo; tra voce e lapide vince la più recente
  function unisci(a, b) {
    var m = {}, ora = Date.now();
    a.concat(b).forEach(function (v) {
      var x = m[v.c];
      if (!x) { m[v.c] = v; return; }
      if (x.via || v.via) { m[v.c] = (v.u || 0) > (x.u || 0) ? v : x; return; }
      var nomeDa = (v.rv || 0) > (x.rv || 0) ? v : x;
      m[v.c] = { c: v.c, n: nomeDa.n, e: nomeDa.e, rv: nomeDa.rv, t: Math.min(x.t || x.u || ora, v.t || v.u || ora), u: Math.max(x.u || 0, v.u || 0) };
    });
    var vive = [], lapidi = [];
    Object.keys(m).forEach(function (c) {
      var v = m[c];
      if (v.via) { if (ora - (v.u || 0) < LAPIDE_MS) lapidi.push(v); }   // lapidi troppo vecchie: si buttano
      else vive.push(v);
    });
    vive.sort(perUso); lapidi.sort(perUso);
    return vive.slice(0, MAX_COMP).concat(lapidi);
  }
  function firma(l) { return JSON.stringify(l.slice().sort(function (a, b) { return a.c < b.c ? -1 : a.c > b.c ? 1 : 0; })); }
  function locale() { return pulisciLista(leggiL(K_COMP)); }
  function delProfilo() {   // null = niente profilo (si lavora solo su questo telefono)
    if (!conProfilo() || !window.SG || !SG.listaProfilo) return null;
    try { return pulisciLista(SG.listaProfilo("compagnie")); } catch (e) { return null; }
  }
  // unisce questo telefono e il profilo; salva tutti e due se cambiano
  function sincronizza() {
    var loc = locale(), prof = delProfilo();
    var tutta = unisci(loc, prof || []), f = firma(tutta);
    if (f !== firma(loc)) scriviL(K_COMP, tutta);
    if (prof && f !== firma(prof)) try { SG.salvaListaProfilo("compagnie", tutta); } catch (e) {}
    return tutta;
  }
  function scriviTutto(lista) { scriviL(K_COMP, unisci(lista, [])); return sincronizza(); }
  function elenco() { return locale().filter(function (v) { return !v.via; }).sort(perUso); }
  function trova(C) { C = norm(C); return elenco().filter(function (v) { return v.c === C; })[0] || null; }
  // aggiunge o aggiorna (o.rv: il nome passa solo se è più nuovo); null se ce ne sono già 8
  function salva(o) {
    o = o || {}; var C = norm(o.c); if (C.length < 4) return null;
    var ora = Date.now(), lista = locale(), x = lista.filter(function (v) { return v.c === C; })[0];
    if (x && !x.via) {
      x.u = ora;
      if (o.n && (o.rv || 0) > (x.rv || 0)) { x.n = String(o.n).slice(0, 24); x.e = String(o.e || x.e).slice(0, 8); x.rv = +o.rv; }
    } else {
      if (lista.filter(function (v) { return !v.via; }).length >= MAX_COMP) { pill("📌 Hai già 8 compagnie: togline una", "rosso"); return null; }
      if (x) lista.splice(lista.indexOf(x), 1);   // era stata tolta: torna
      x = pulita({ c: C, n: o.n, e: o.e, rv: o.rv || 0, t: ora, u: ora });
      lista.push(x);
    }
    scriviTutto(lista);
    return trova(C);
  }
  function usata(C) {   // solo su questo telefono (l'ordine arriva al profilo col prossimo salvataggio)
    C = norm(C); var lista = locale(), x = lista.filter(function (v) { return v.c === C && !v.via; })[0];
    if (!x) return false;
    x.u = Date.now(); scriviL(K_COMP, lista); return true;
  }
  function togli(C) {
    C = norm(C); var lista = locale().filter(function (v) { return v.c !== C; });
    lista.push({ c: C, via: 1, u: Date.now() });
    scriviTutto(lista); return true;
  }
  // nome ed emoji nuovi arrivati da un amico (o decisi qui): si adottano solo se comp.rv è più nuovo
  function aggiorna(C, comp) {
    C = norm(C); if (!comp) return false;
    var n = comp.nome != null ? comp.nome : comp.n, e = comp.emoji != null ? comp.emoji : comp.e, rv = +comp.rv || 0;
    var lista = locale(), x = lista.filter(function (v) { return v.c === C && !v.via; })[0];
    if (!x || !n || rv <= (x.rv || 0)) return false;
    x.n = String(n).slice(0, 24); x.e = String(e || x.e).slice(0, 8); x.rv = rv;
    scriviTutto(lista);
    aggiornaTessere();
    return true;
  }

  // =========================================================
  //  LINK E MESSAGGIO
  // =========================================================
  function link(C) {
    C = norm(C); var v = trova(C);
    var base = window.SG && SG.creaLink ? SG.creaLink({ gruppo: C }) : location.origin + location.pathname + "#gruppo=" + C;
    return v ? base + "&n=" + encodeURIComponent(v.n) + "&e=" + encodeURIComponent(v.e) : base;
  }
  function titolo(v) { return v ? v.e + " " + v.n : ""; }
  function messaggio(C) {
    C = norm(C); var v = trova(C);
    return "È il link fisso della nostra compagnia" + (v ? " «" + titolo(v) + "»" : "") + ": fissatelo nel gruppo, vale sempre.\n" +
      "Hai l'app? Tocca «🔑 Ho un codice» e scrivi " + C + ".";
  }
  function condividi(C, bottone) {
    C = norm(C); var v = trova(C), url = link(C), txt = messaggio(C);
    var fatto = function () {
      if (!bottone) return;
      if (bottone.__t0 == null) bottone.__t0 = bottone.innerHTML;
      bottone.innerHTML = "✅ Link copiato!";
      clearTimeout(bottone.__tc);
      bottone.__tc = setTimeout(function () { bottone.innerHTML = bottone.__t0; bottone.__t0 = null; }, 1800);
    };
    if (navigator.share) { navigator.share({ title: v ? titolo(v) : "La compagnia", text: txt, url: url }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(txt + "\n" + url).then(fatto, fatto); } catch (e) { fatto(); }
  }

  // =========================================================
  //  SBIRCIATA: chi c'è dentro, senza entrare (con la cache di 30 s)
  // =========================================================
  function stato(C) { return CACHE.esito[norm(C)] || null; }
  function rispondi(attesa) { attesa.forEach(function (a) { try { if (a) a(CACHE.esito); } catch (e) {} }); }
  // fatto(esito) arriva sempre: subito dopo il giro, o con la cache se il giro non si fa (30 s, pagina nascosta, niente rete)
  function sbircia(codici, fatto, forza) {
    var lista = [];
    (codici || []).forEach(function (c) { c = norm(c); if (c && lista.indexOf(c) < 0) lista.push(c); });
    lista = lista.slice(0, 12);
    if (GIRO) {   // un giro alla volta: si aspetta quello in corso (se non copre tutti i codici, dopo se ne fa un altro)
      GIRO.attesa.push(function () {
        var manca = lista.some(function (c) { return GIRO_FATTO.indexOf(c) < 0; });
        if (manca && forza) sbircia(lista, fatto, true); else if (fatto) fatto(CACHE.esito);
      });
      return true;
    }
    var ora = Date.now();
    var no = !lista.length || !(window.SGNet && SGNet.sbircia) || (!forza && (document.hidden || ora - CACHE.t < OGNI - 1500));
    if (no) { if (fatto) setTimeout(function () { fatto(CACHE.esito); }, 0); return false; }
    CACHE.t = ora;
    var giro = GIRO = { codici: lista, attesa: [fatto] }, chiuso = false;
    function fine(esito) {
      if (chiuso) return; chiuso = true; clearTimeout(tGuardia);
      lista.forEach(function (c) {
        var r = esito && esito[c];
        CACHE.esito[c] = r && r.stato ? { stato: r.stato, msg: r.msg || null, gen: r.gen || 0 } : { stato: "boh", msg: null, gen: 0 };
      });
      GIRO_FATTO = lista;
      GIRO = null;
      aggiornaTessere();
      rispondi(giro.attesa);
    }
    var tGuardia = setTimeout(function () { fine(null); }, 8000);   // (la rete risponde al massimo in 6 s)
    try { SGNet.sbircia(lista, fine); } catch (e) { fine(null); }
    return true;
  }
  var GIRO_FATTO = [];

  // =========================================================
  //  TESSERE DELLA HOME
  // =========================================================
  function nomeGioco(gid) {
    if (!gid || !api.nomeGioco) return "";
    try { var g = api.nomeGioco(gid); return g ? (typeof g === "string" ? g : g.nome || "") : ""; } catch (e) { return ""; }
  }
  function svgDi(m) {
    if (m && m.omino && (api.omino || window.SGOmino)) {
      try { return api.omino ? api.omino(m.omino, { busto: true }) : SGOmino.svg(m.omino, { busto: true }); } catch (e) {}
    }
    return "<span>" + ((m && m.emoji) || "🙂").replace(/[<>&"]/g, "") + "</span>";
  }
  function elencoNomi(nomi) {
    if (nomi.length === 1) return nomi[0] + " è dentro";
    if (nomi.length === 2) return nomi[0] + " e " + nomi[1] + " sono dentro";
    if (nomi.length === 3) return nomi[0] + ", " + nomi[1] + " e " + nomi[2] + " sono dentro";
    return nomi[0] + ", " + nomi[1] + " e altri " + (nomi.length - 2) + " sono dentro";
  }
  // cosa dire sulla tessera: { s: stato, a: azione, m: membri da mostrare, viva }
  function cosaDire(C) {
    var mia = null;
    try { mia = api.mia ? api.mia(C) : null; } catch (e) {}
    if (mia) {
      var mm = mia.membri || [];
      if (mia.host) {
        var n = Math.max(0, mm.length - 1);
        return { s: "👑 La Sala è aperta · " + (n === 0 ? "aspetti gli amici" : n === 1 ? "c'è 1 amico" : "ci sono " + n + " amici"), a: "Torna ›", m: mm, viva: true };
      }
      return { s: "🟢 Sei dentro", a: "Torna ›", m: mm, viva: true };
    }
    var r = stato(C);
    if (!r || r.stato === "boh") return { s: "…", a: "Entra ›", m: [] };
    if (r.stato === "viva") {
      var msg = r.msg || {}, membri = (Array.isArray(msg.membri) ? msg.membri : []).filter(function (m) { return m && m.nome && !m.fuori; });
      var s = membri.length ? "🟢 " + elencoNomi(membri.map(function (m) { return m.nome; })) : "🟢 La serata è aperta";
      var gn = msg.gioco ? nomeGioco(msg.gioco) : "";
      if (gn) s += " · giocano a " + gn;
      return { s: s, a: "Entra ›", m: membri, viva: true };
    }
    return conProfilo() ? { s: "Nessuno ancora", a: "Apri la serata ›", m: [] } : { s: "Nessuno ancora", a: "Entra e aspetta ›", m: [] };
  }
  function tessera(v) {
    var C = v.c;
    var nodi = {
      em: el("span", { class: "cmp-em", text: v.e }),
      nome: el("b", { class: "cmp-nome", text: v.n }),
      stato: el("span", { class: "cmp-stato", text: "…" }),
      av: el("span", { class: "cmp-avatar" }),
      entra: el("span", { class: "cmp-entra", text: "Entra ›" }),
      slot: []
    };
    for (var i = 0; i < 4; i++) { var sl = el("span", { class: "cmp-av" }); sl.hidden = true; nodi.slot.push(sl); nodi.av.appendChild(sl); }
    nodi.b = el("button", { class: "cmp-tessera", "data-codice": C, onclick: function () { usata(C); if (api.apri) api.apri(C); } }, [
      nodi.em,
      el("span", { class: "cmp-mezzo" }, [nodi.nome, nodi.stato]),
      el("span", { class: "cmp-dx" }, [nodi.av, nodi.entra])
    ]);
    nodi.c = C;
    return nodi;
  }
  // aggiorna una tessera al suo posto: solo testi e avatar che cambiano
  function rinfresca(nodi) {
    var v = trova(nodi.c);
    if (v) { testo(nodi.em, v.e); testo(nodi.nome, v.n); }
    var d = cosaDire(nodi.c);
    testo(nodi.stato, d.s); testo(nodi.entra, d.a);
    nodi.b.classList.toggle("viva", !!d.viva);
    nodi.slot.forEach(function (sl, i) {
      var m = d.m[i], k = m ? (m.id || m.nome) + "|" + JSON.stringify(m.omino || m.emoji || "") : "";
      if (sl.__k === k) return;
      sl.__k = k; sl.hidden = !m; sl.innerHTML = m ? svgDi(m) : "";
    });
  }
  function aggiornaTessere() {
    TESSERE = TESSERE.filter(function (T) { return document.body && document.body.contains(T.box); });
    TESSERE.forEach(function (T) { T.nodi.forEach(rinfresca); if (T.riga) testo(T.riga, "📌 Le tue compagnie (" + elenco().length + ") ›"); });
  }
  function codiciAVista() {
    var out = [];
    TESSERE.forEach(function (T) { T.nodi.forEach(function (n) { if (out.indexOf(n.c) < 0) out.push(n.c); }); });
    return out;
  }
  // disegna fino a 2 tessere e la riga "📌 Le tue compagnie (N) ›"; restituisce quante compagnie ci sono
  function tessere(box) {
    if (!box) return 0;
    metteStile();
    TESSERE = TESSERE.filter(function (T) { if (T.box === box) { clearInterval(T.timer); return false; } return true; });
    svuota(box);
    var tutte = elenco();
    if (!tutte.length) return 0;
    var cont = el("div", { class: "cmp-tessere" });
    var T = { box: box, nodi: [], riga: null, timer: null };
    tutte.slice(0, 2).forEach(function (v) { var n = tessera(v); T.nodi.push(n); cont.appendChild(n.b); rinfresca(n); });
    // la riga c'è sempre: da lì si rinomina, si ricondivide e si toglie
    T.riga = el("button", { class: "cmp-tutte", onclick: gestione, text: "📌 Le tue compagnie (" + tutte.length + ") ›" });
    cont.appendChild(T.riga);
    box.appendChild(cont);
    TESSERE.push(T);
    T.timer = setInterval(function () {
      if (!document.body.contains(box)) { clearInterval(T.timer); TESSERE = TESSERE.filter(function (x) { return x !== T; }); return; }
      if (!document.hidden) sbircia(codiciAVista());
    }, OGNI);
    sbircia(codiciAVista());   // (se l'ultima è di meno di 30 s fa, resta quella)
    return tutte.length;
  }
  // al ritorno nell'app si guarda di nuovo (se sono passati 30 s)
  function alRitorno() {
    if (document.hidden) return;
    TESSERE = TESSERE.filter(function (T) { return document.body.contains(T.box); });
    if (TESSERE.length) sbircia(codiciAVista());
  }

  // =========================================================
  //  "📌 LE TUE COMPAGNIE"
  // =========================================================
  function gestione() {
    metteStile();
    var s = api.schermata ? api.schermata({ titolo: "📌 Le tue compagnie", indietro: function () { if (api.home) api.home(); } })
      : el("div", { class: "schermata" });
    var corpo = s._contenuto || s;
    var lista = el("div", { class: "cmp-g-lista" });
    var vuota = el("p", { class: "cmp-g-vuota", text: "Non hai ancora una compagnia. Si crea nella Sala: ⚙️ → «📌 Fanne la nostra Compagnia»." });
    function riga(v) {
      var C = v.c;
      var em = el("span", { class: "cmp-em", text: v.e }), nome = el("b", { class: "cmp-nome", text: v.n });
      var r = el("div", { class: "cmp-g-voce", "data-codice": C }, [
        el("div", { class: "cmp-g-testa" }, [em, el("span", { class: "cmp-mezzo" }, [nome, el("span", { class: "cmp-g-cod" }, ["codice ", el("b", { class: "cmp-cod", text: C })])])]),
        el("div", { class: "cmp-g-tasti" }, [
          el("button", { class: "btn btn-piccolo cmp-g-ricond", text: "📤 Ricondividi", onclick: function () { condividi(C, this); } }),
          el("button", { class: "btn btn-piccolo cmp-g-nome", text: "✏️ Nome", onclick: function () {
            var x = trova(C); if (!x) return;
            foglioNome({ titolo: "✏️ Nome della compagnia", nome: x.n, emoji: x.e, ok: function (n2, e2) {
              var comp = { nome: n2, emoji: e2, rv: Date.now() };
              if (aggiorna(C, comp)) { testo(nome, n2); testo(em, e2); if (api.rinominata) try { api.rinominata(C, comp); } catch (e) {} }
            } });
          } }),
          el("button", { class: "btn btn-piccolo btn-fantasma cmp-g-togli", text: "✕ Togli", onclick: function () {
            var x = trova(C); if (!x) return;
            var via = function () { togli(C); if (r.parentNode) r.parentNode.removeChild(r); vuota.hidden = !!lista.firstChild; };
            if (api.conferma) api.conferma("Togliere «" + titolo(x) + "» dalla lista?", "Il link resta valido: se lo riapri torna qui.", "✕ Togli", via);
            else via();
          } })
        ])
      ]);
      return r;
    }
    var tutte = elenco();
    tutte.forEach(function (v) { lista.appendChild(riga(v)); });
    vuota.hidden = !!tutte.length;
    corpo.appendChild(lista);
    corpo.appendChild(vuota);
    corpo.appendChild(el("p", { class: "cmp-g-nota", text: "Il link fisso vale sempre: fissatelo nel gruppo. Con il profilo le compagnie ti seguono anche su un altro telefono." }));
    if (api.mostra) api.mostra(s);
    return s;
  }

  // =========================================================
  //  FOGLIO "NOME ED EMOJI" (in alto: resta visibile con la tastiera aperta)
  // =========================================================
  function foglioNome(o) {
    o = o || {}; metteStile();
    var vecchio = document.querySelector(".cmp-velo"); if (vecchio && vecchio.parentNode) vecchio.parentNode.removeChild(vecchio);
    var scelta = EMOJI.indexOf(o.emoji) >= 0 ? o.emoji : (o.emoji || EMOJI[0]);
    var campo = el("input", { class: "cmp-campo", type: "text", maxlength: "24", enterkeyhint: "done", autocomplete: "off", placeholder: "Es. Quelli del giovedì", "aria-label": "Nome della compagnia" });
    campo.value = String(o.nome || "").slice(0, 24);
    var fila = el("div", { class: "cmp-emoji" });
    var tasti = EMOJI.map(function (e) {
      var b = el("button", { class: "cmp-e" + (e === scelta ? " su" : ""), type: "button", text: e, "aria-label": e, onclick: function () {
        scelta = e; tasti.forEach(function (x) { x.classList.toggle("su", x === b); });
      } });
      fila.appendChild(b); return b;
    });
    var ok = el("button", { class: "btn btn-primario cmp-ok", text: o.tasto || "📌 Fatto", onclick: conferma });
    function giusto() { ok.disabled = !campo.value.trim(); }
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); }
    function conferma() {
      var n = campo.value.replace(/\s+/g, " ").trim().slice(0, 24);
      if (!n) { campo.focus(); return; }
      chiudi();
      if (o.ok) o.ok(n, scelta);
    }
    campo.addEventListener("input", giusto);
    campo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); conferma(); } });
    var velo = el("div", { class: "sl-velo cmp-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio cmp-foglio", role: "dialog" }, [
        el("div", { class: "sl-foglio-testa cmp-f-testa" }, [ el("b", { text: o.titolo || "📌 La vostra compagnia" }), el("button", { class: "sl-foglio-x cmp-f-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        campo, fila, ok
      ])
    ]);
    giusto();
    document.body.appendChild(velo);
    setTimeout(function () { try { campo.focus(); } catch (e) {} }, 60);
    return { chiudi: chiudi, velo: velo };
  }

  // =========================================================
  //  GIOCATO DI RECENTE (solo su questo telefono)
  //  voce = { n: nome, u: uid (se ha il profilo online), g: gioco, t: quando }
  // =========================================================
  function mioUid() {
    try { var p = api.profilo ? api.profilo() : null; if (p && (p.uid || p.id)) return p.uid || p.id; } catch (e) {}
    try { var q = window.SGNube && SGNube.profilo && SGNube.profilo(); if (q && q.uid) return q.uid; } catch (e) {}
    try { var u = window.SGNube && SGNube.utente && SGNube.utente(); return (u && u.uid) || null; } catch (e) { return null; }
  }
  function recenti() {
    return leggiL(K_REC).filter(function (r) { return r && r.n; });
  }
  function segnaRecenti(persone, gioco) {
    var lista = recenti(), ora = Date.now(), io = mioUid();
    (persone || []).slice().reverse().forEach(function (p) {
      if (!p || !p.nome) return;
      var n = String(p.nome).slice(0, 24), u = p.uid || null;
      if (u && u === io) return;   // io no
      lista = lista.filter(function (r) { return u ? !(r.u === u || (!r.u && r.n === n)) : !(!r.u && r.n === n); });
      lista.unshift({ n: n, u: u, g: gioco || null, t: ora });
    });
    lista = lista.slice(0, MAX_REC);
    scriviL(K_REC, lista);
    return lista;
  }
  function rapportoDi(u) { try { return api.rapporto ? api.rapporto(u) : null; } catch (e) { return null; } }
  var SEGNO = { amico: "✓", inviata: "⏳" };
  // il tasto ➕ (o il segno ✓ / ⏳) accanto a un nome
  function piuDi(r) {
    var rap = rapportoDi(r.u);
    if (!rap || rap === "io") return null;
    if (SEGNO[rap]) return el("span", { class: "cmp-segno", text: SEGNO[rap] });
    var b = el("button", { class: "cmp-piu", type: "button", "aria-label": "Chiedi l'amicizia a " + r.n, text: "➕", onclick: function (ev) {
      ev.stopPropagation(); if (b.disabled) return;
      b.disabled = true; b.textContent = "⏳";
      var fatto = function (msg) { if (msg) pill(msg); var r2 = rapportoDi(r.u); if (SEGNO[r2]) b.textContent = SEGNO[r2]; };
      try { var p = api.chiedi ? api.chiedi(r.u, r.n, fatto) : null; if (p && p.catch) p.catch(function () { b.disabled = false; b.textContent = "➕"; }); }
      catch (e) { b.disabled = false; b.textContent = "➕"; }
    } });
    return b;
  }
  function etichettaGioco(gid) {
    if (!gid || !api.nomeGioco) return "";
    try { var g = api.nomeGioco(gid); if (!g) return ""; return typeof g === "string" ? g : ((g.icona ? g.icona + " " : "") + (g.nome || "")); } catch (e) { return ""; }
  }
  // la riga della home: "👥 Giocato di recente" e i chip che scorrono di lato
  function rigaRecenti(box, opz) {
    if (!box) return 0;
    metteStile(); svuota(box);
    var conPiu = !!(opz && opz.conPiu), lista = recenti();
    if (!lista.length) return 0;
    var fila = el("div", { class: "cmp-rec-fila" });
    lista.forEach(function (r) {
      var g = etichettaGioco(r.g);
      fila.appendChild(el("span", { class: "cmp-chip" }, [
        el("span", { class: "cmp-chip-t", text: r.n + (g ? " · " + g : "") }),
        conPiu && r.u ? piuDi(r) : null
      ]));
    });
    box.appendChild(el("div", { class: "cmp-rec" }, [ el("div", { class: "cmp-rec-titolo", text: "👥 Giocato di recente" }), fila ]));
    return lista.length;
  }
  // la riga a fine partita: "👥 Avete giocato con: Luca ➕ · Sara ⏳" (solo chi ha il profilo online e non è già amico)
  function rigaFine(box, persone) {
    if (!box) return 0;
    metteStile(); svuota(box);
    if (!api.rapporto) return 0;
    var io = mioUid();
    var chi = (persone || []).filter(function (p) {
      if (!p || !p.uid || !p.nome || p.uid === io) return false;
      var rap = rapportoDi(p.uid);
      return rap && rap !== "amico" && rap !== "io";
    }).slice(0, 3);
    if (!chi.length) return 0;
    var riga = el("div", { class: "cmp-fine" }, [ el("span", { class: "cmp-fine-t", text: "👥 Avete giocato con:" }) ]);
    chi.forEach(function (p, i) {
      if (i) riga.appendChild(el("span", { class: "cmp-fine-sep", text: "·" }));
      riga.appendChild(el("span", { class: "cmp-fine-p" }, [ el("span", { class: "cmp-fine-n", text: String(p.nome).slice(0, 24) }), piuDi({ n: p.nome, u: p.uid }) ]));
    });
    box.appendChild(riga);
    return chi.length;
  }

  // =========================================================
  //  STILE (una volta sola, con i colori di styles.css)
  // =========================================================
  function metteStile() {
    if (document.getElementById("sg-cmp-stile")) return;
    var css = [
      ".cmp-tessere{display:flex;flex-direction:column;gap:8px;margin:0 0 12px}",
      ".cmp-tessera{appearance:none;-webkit-appearance:none;border:0;cursor:pointer;font:inherit;color:var(--testo,#fff);width:100%;display:flex;align-items:center;gap:10px;min-height:56px;max-height:64px;padding:7px 10px 7px 8px;border-radius:16px;background:linear-gradient(135deg,var(--carta-2,#4055b0),var(--carta,#34479a));box-shadow:var(--ombra,0 6px 18px rgba(0,0,0,.35));text-align:left;touch-action:manipulation;-webkit-user-select:none;user-select:none;transition:transform .06s ease;overflow:hidden}",
      ".cmp-tessera:active{transform:scale(.98)}",
      ".cmp-tessera.viva{box-shadow:inset 0 0 0 2px rgba(55,212,126,.75),var(--ombra,0 6px 18px rgba(0,0,0,.35))}",
      ".cmp-em{flex:0 0 40px;width:40px;height:40px;border-radius:12px;background:rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;font-size:1.55rem;line-height:1}",
      ".cmp-mezzo{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px}",
      ".cmp-nome{font-weight:900;font-size:.98rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cmp-stato{font-size:.76rem;font-weight:700;color:var(--testo-tenue,#cdd6ff);line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}",
      ".cmp-dx{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end;gap:3px}",
      ".cmp-avatar{display:flex;height:26px;padding-left:9px}",
      ".cmp-av{flex:0 0 26px;width:26px;height:26px;border-radius:50%;overflow:hidden;background:var(--sfondo-2,#2c3d80);box-shadow:0 0 0 2px var(--carta,#34479a);margin-left:-9px;display:flex;align-items:center;justify-content:center;font-size:.85rem}",
      ".cmp-av[hidden]{display:none}",
      ".cmp-av svg{width:100%;height:100%;display:block}",
      ".cmp-entra{font-size:.78rem;font-weight:900;color:var(--accento,#ffca3a);white-space:nowrap}",
      ".cmp-tutte{appearance:none;-webkit-appearance:none;border:0;cursor:pointer;font:inherit;font-size:.84rem;font-weight:800;color:var(--testo-tenue,#cdd6ff);background:rgba(255,255,255,.07);border-radius:12px;min-height:36px;padding:6px 12px;text-align:left;touch-action:manipulation}",
      ".cmp-g-lista{display:flex;flex-direction:column;gap:10px}",
      ".cmp-g-voce{background:var(--carta,#34479a);border-radius:16px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;box-shadow:var(--ombra,0 6px 18px rgba(0,0,0,.35))}",
      ".cmp-g-testa{display:flex;align-items:center;gap:10px;min-width:0}",
      ".cmp-g-cod{font-size:.78rem;color:var(--testo-tenue,#cdd6ff);font-weight:700}",
      ".cmp-cod{letter-spacing:.18em;color:var(--testo,#fff)}",
      ".cmp-g-tasti{display:flex;gap:6px}",
      ".cmp-g-tasti .btn{flex:1 1 0;min-width:0;width:auto;margin:0;padding:8px 4px;font-size:.8rem;min-height:40px;white-space:nowrap;box-shadow:none}",
      ".cmp-g-tasti .cmp-g-ricond{flex-grow:1.35}",
      ".cmp-g-vuota,.cmp-g-nota{color:var(--testo-tenue,#cdd6ff);font-size:.85rem;line-height:1.35;margin:12px 2px 0}",
      ".cmp-velo{position:fixed;inset:0;z-index:9998;background:rgba(8,12,34,.72);display:flex;align-items:flex-start;justify-content:center}",
      ".sl-velo.cmp-velo{align-items:flex-start}",
      ".cmp-foglio{width:100%;max-width:520px;display:flex;flex-direction:column;gap:10px;background:var(--sfondo,#223066);padding:calc(12px + env(safe-area-inset-top)) 16px 14px;box-shadow:0 12px 40px rgba(0,0,0,.5)}",
      ".sl-foglio.cmp-foglio{border-radius:0 0 22px 22px;padding:calc(12px + env(safe-area-inset-top)) 16px 14px;max-height:var(--alt,100vh);overflow-y:auto}",
      ".cmp-f-testa{display:flex;align-items:center;justify-content:space-between;font-size:1.05rem;gap:8px}",
      ".cmp-f-x{border:0;background:var(--carta,#34479a);color:inherit;width:36px;height:36px;flex:0 0 36px;border-radius:50%;font-size:1rem;font-weight:900;cursor:pointer}",
      ".cmp-campo{width:100%;font:inherit;font-size:1.05rem;font-weight:700;color:#1b1b2e;background:#fff;border:0;border-radius:12px;padding:11px 12px;min-height:46px}",
      ".cmp-emoji{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}",
      ".cmp-e{appearance:none;-webkit-appearance:none;font-size:1.35rem;line-height:1;height:42px;border-radius:12px;border:2px solid transparent;background:rgba(255,255,255,.1);cursor:pointer;padding:0;touch-action:manipulation}",
      ".cmp-e.su{border-color:var(--accento,#ffca3a);background:rgba(255,202,58,.18)}",
      ".cmp-foglio .cmp-ok{margin:0}",
      ".cmp-rec{margin:0 0 12px;min-width:0}",
      ".cmp-rec-titolo{font-size:.78rem;font-weight:800;color:var(--testo-tenue,#cdd6ff);margin:0 2px 6px}",
      ".cmp-rec-fila{display:flex;gap:6px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;padding-bottom:2px}",
      ".cmp-rec-fila::-webkit-scrollbar{display:none}",
      ".cmp-chip{flex:0 0 auto;display:flex;align-items:center;gap:6px;background:var(--carta,#34479a);border-radius:999px;padding:4px 6px 4px 12px;min-height:34px;font-size:.82rem;font-weight:800;white-space:nowrap}",
      ".cmp-piu{appearance:none;-webkit-appearance:none;border:0;cursor:pointer;width:28px;height:28px;flex:0 0 28px;border-radius:50%;background:rgba(255,255,255,.14);color:inherit;font-size:.8rem;padding:0;line-height:1;touch-action:manipulation}",
      ".cmp-piu:disabled{opacity:1}",
      ".cmp-segno{width:28px;text-align:center;font-size:.85rem;color:var(--verde,#37d47e)}",
      ".cmp-fine{display:flex;align-items:center;gap:5px;height:30px;max-height:30px;overflow:hidden;white-space:nowrap;font-size:.82rem;font-weight:700;color:var(--testo-tenue,#cdd6ff);min-width:0}",
      ".cmp-fine-t{flex:0 0 auto}",
      ".cmp-fine-p{display:flex;align-items:center;gap:3px;min-width:0;color:var(--testo,#fff)}",
      ".cmp-fine-n{overflow:hidden;text-overflow:ellipsis;max-width:90px}",
      ".cmp-fine .cmp-piu,.cmp-fine .cmp-segno{width:24px;height:24px;flex:0 0 24px;font-size:.72rem}"
    ].join("\n");
    var st = el("style", { id: "sg-cmp-stile" });
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  // =========================================================
  //  COLLEGAMENTO COL CORE
  // =========================================================
  function collega(a) {
    api = a || {};
    sincronizza();
    if (collegato) return;
    collegato = true;
    document.addEventListener("visibilitychange", alRitorno);
    // quando il profilo è pronto (o cambia) si uniscono le compagnie del profilo con quelle del telefono
    try {
      if (window.SGNube && SGNube.onCambio) SGNube.onCambio(function (p) {
        var k = p ? (p.uid || p.nome || "?") : null;
        if (k && k !== ultimoProfilo) { ultimoProfilo = k; sincronizza(); aggiornaTessere(); }
        if (!k) ultimoProfilo = null;
      });
    } catch (e) {}
  }

  window.SGCompagnia = {
    collega: collega,
    // memoria
    elenco: elenco, trova: trova, salva: salva, usata: usata, togli: togli, aggiorna: aggiorna, sincronizza: sincronizza,
    // link
    link: link, messaggio: messaggio, condividi: condividi,
    // sbirciata
    stato: stato, sbircia: sbircia,
    // home
    tessere: tessere, aggiornaTessere: aggiornaTessere, gestione: gestione, foglioNome: foglioNome,
    // giocato di recente
    segnaRecenti: segnaRecenti, recenti: recenti, rigaRecenti: rigaRecenti, rigaFine: rigaFine,
    EMOJI: EMOJI.slice(),
    // per le prove: la cache della sbirciata si può svuotare
    _azzera: function () { CACHE.t = 0; CACHE.esito = {}; GIRO = null; GIRO_FATTO = []; }
  };
})();
