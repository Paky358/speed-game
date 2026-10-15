/* =========================================================
   AMICI ONLINE E INVITI — "SGAmiciOnline"
   Il pallino verde degli amici che hanno l'app aperta e gli inviti nella
   Sala ("➕ Invita" → "Paky ti chiama nella Sala"). Solo col profilo.
   Passa sul broker (SGNet.presenza, pezzo p6-n), non su Firebase:
     seratagiochi/v1/u/<H>/on   trattenuto  { on: 1, s: "app"|"gioco"|"sala", t } (testamento { on: 0 })
     seratagiochi/v1/u/<H>/inv  trattenuto  { id, da, nome, om, sala, gioco, t } (vale 10 minuti)
     seratagiochi/v1/u/<H>/msg  veloce      { t: "risposta", id, si, nome }
   H = impronta di 12 caratteri dell'uid (mai l'uid in chiaro).
   Si accettano solo inviti di chi è nella propria lista amici.
   Un invito trattenuto per persona: il secondo sostituisce il primo.
   Al caricamento non usa SG, SGNet né SGNube: solo dentro le sue funzioni.
   Stile in un <style> di questo file con prefisso "ao-".
   Memoria del telefono: sg-presenza ("0" = non farti vedere online),
   sg-amici-cache ({ di: mio uid, firma, agg, amici: { uid: { nome, omino, H } } },
   rinfrescata con SGNube.schede al massimo una volta al giorno o quando la
   lista degli amici cambia), sg-inviti-visti (id degli inviti già risposti).

   INTERFACCIA

   SGAmiciOnline.avvia()
     Dopo il profilo pronto (solo se SGNube.utente() e SGNube.profilo()):
     apre la presenza e segue gli amici. Con sg-presenza = "0" non si fa
     vedere ma riceve gli inviti. App in secondo piano → nascosto.
     Chiamata di nuovo con lo stesso profilo: rilegge solo la lista amici;
     con un altro profilo: ferma quello di prima e riparte. → true se va.
   SGAmiciOnline.ferma()
     All'uscita dal profilo: per gli amici non ci sono più.
   SGAmiciOnline.online()
     → [{ uid, nome, omino, s: "app"|"gioco"|"sala" }] degli amici online
     (scritto da meno di 2 ore), per nome. Quando cambia: evento
     "sg-amici-online" su window (detail { n, lista }), al massimo una volta
     al secondo.
   SGAmiciOnline.stato(s, sala)
     Il core dice dove sono: "app", "gioco" o "sala" (sala = codice della
     Sala in cui sono, se ci sono: l'invito per quella Sala non si mostra).
     Rilegge anche sg-presenza.
   SGAmiciOnline.visibile(si)
     L'interruttore "🟢 Fatti vedere online": scrive sg-presenza e lo applica
     subito. Senza argomento → com'è adesso (true/false).
   SGAmiciOnline.badge()
     → <span class="ao-badge">🟢 2</span> che si aggiorna da solo (sparisce
     con 0), null se nessuno è online o non c'è il profilo.
   SGAmiciOnline.foglioInvita({ codice, nomeSala, gioco, condividi, qr })
     Il foglio "➕ Invita" (aspetto sl-velo/sl-foglio): amici online in alto,
     gli altri in grigio, "📨 Chiama" → "✅ Chiamato" → "👍 Arriva!"/"🙅 Non ora"
     (si richiama dopo 30 s); in fondo "📤 Manda il link" (o.condividi(tasto))
     e, se c'è, "▦ QR" (o.qr). → { nodo, chiudi() } (null se è già aperto
     un altro foglio).
   SGAmiciOnline.onInvito(fn)
     Il core registra fn(codice, invito) che porta nella Sala dell'invito
     ("Entra ▶"). Senza fn (o se nessuno la registra) "Entra" apre
     #sala=CODICE come un link (la pagina si ricarica).
   Evento "sg-amici-risposta" su window (detail { uid, nome, si }) quando un
   amico chiamato risponde.
   ========================================================= */
(function () {
  "use strict";

  var DUE_ORE = 2 * 3600 * 1000, DIECI_MIN = 10 * 60 * 1000, UN_GIORNO = 24 * 3600 * 1000;
  var RICHIAMA = 30000, PICCOLO = 20000, RIPROVA_SCHEDE = 5 * 60 * 1000, MAX_VISTI = 40;

  var A = {
    p: null, uid: null, h: null,
    perH: {},          // impronta → uid dei miei amici
    on: {},            // impronta → ultimo { on, s, t } ricevuto
    stato: "app", sala: null,
    firmaAmici: "",
    tentato: 0, inCorso: false,
    agganciato: false
  };
  var chiamate = {};   // uid amico → { id, t, sala, esito: null | true | false }
  var badges = [];
  var foglio = null;   // il foglio aperto: { righe: { uid: {...} }, o, aggiorna(), chiudi() }
  var invito = null;   // l'avviso in alto: { d, nodo, mini, tPiccolo, tScade }
  var vaiFn = null;
  var ev = { ultimo: 0, t: null, firma: "" };

  // ---- piccoli aiuti ----
  function crea(tag, cls, testo) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (testo != null) n.textContent = testo;
    return n;
  }
  function leggi(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function nascosto() { try { return localStorage.getItem("sg-presenza") === "0"; } catch (e) { return false; } }
  function inSecondoPiano() { try { return document.visibilityState === "hidden"; } catch (e) { return false; } }
  function evento(nome, d) { try { window.dispatchEvent(new CustomEvent(nome, { detail: d })); } catch (e) {} }
  function idACaso() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function faccia(omino, nome, cls) {
    var f = crea("span", cls || "ao-av");
    if (omino && window.SGOmino) { try { f.innerHTML = SGOmino.svg(omino, { busto: true }); } catch (e) { f.textContent = ""; } }
    if (!f.firstChild) f.textContent = (Array.from(nome || "?")[0] || "?").toUpperCase();
    return f;
  }
  function mioProfilo() { try { return (window.SGNube && SGNube.profilo && SGNube.profilo()) || null; } catch (e) { return null; } }
  function codiceOk(c) { return typeof c === "string" && /^[A-Za-z0-9]{4,8}$/.test(c); }

  function stile() {
    if (document.getElementById("ao-stile")) return;
    var s = crea("style"); s.id = "ao-stile";
    s.textContent = [
      // il pallino nel tasto "➕ Invita"
      ".ao-badge{ display:inline-flex; align-items:center; gap:2px; padding:1px 7px; border-radius:999px; background:rgba(47,158,68,.95); color:#fff;",
      "  font-size:.78rem; font-weight:900; line-height:1.4; white-space:nowrap; font-variant-numeric:tabular-nums; }",
      ".ao-badge.zero{ display:none; }",
      // l'avviso dell'invito in alto (al massimo 72 px: il gioco sotto resta visibile e usabile)
      ".ao-invito{ position:fixed; z-index:10000; left:8px; right:8px; top:calc(6px + env(safe-area-inset-top)); max-width:520px; margin:0 auto;",
      "  box-sizing:border-box; max-height:72px; overflow:hidden; display:flex; align-items:center; gap:10px; padding:8px 8px 8px 10px;",
      "  border-radius:18px; background:linear-gradient(135deg, #2b3c8f, #1b2560); color:#fff; box-shadow:0 10px 26px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,212,59,.75);",
      "  animation:aoGiu .32s cubic-bezier(.2,.9,.3,1.2); }",
      ".ao-invito.via{ opacity:0; transform:translateY(-24px); transition:opacity .2s ease, transform .2s ease; }",
      "@keyframes aoGiu{ from{ opacity:0; transform:translateY(-30px); } to{ opacity:1; transform:none; } }",
      ".ao-invito .ao-av{ width:44px; height:44px; }",
      ".ao-testo{ flex:1; min-width:0; line-height:1.2; }",
      ".ao-r1{ font-size:.9rem; font-weight:700; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }",
      ".ao-r1 b{ font-weight:900; color:#ffe066; }",
      ".ao-r2{ font-size:.76rem; font-weight:700; opacity:.82; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }",
      ".ao-tasti{ flex:0 0 auto; display:flex; gap:6px; }",
      ".ao-tasti button{ appearance:none; border:0; border-radius:14px; height:44px; padding:0 10px; font:inherit; font-size:.86rem; font-weight:900;",
      "  cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; transition:transform .06s ease; }",
      ".ao-tasti button:active{ transform:scale(.95); }",
      ".ao-entra{ background:var(--verde, #37d47e); color:#04321c; }",
      ".ao-no{ background:rgba(255,255,255,.14); color:#fff; }",
      // l'invito fatto piccolo: 📨 nell'angolo in alto a destra
      ".ao-mini{ position:fixed; z-index:10000; right:10px; top:calc(8px + env(safe-area-inset-top)); width:46px; height:46px; border:0; border-radius:50%;",
      "  background:#ffd43b; color:#3a2200; font-size:1.35rem; cursor:pointer; box-shadow:0 6px 16px rgba(0,0,0,.45), 0 0 0 3px rgba(255,255,255,.85);",
      "  display:flex; align-items:center; justify-content:center; animation:aoMini .3s ease-out; touch-action:manipulation; }",
      "@keyframes aoMini{ from{ opacity:0; transform:scale(.4); } to{ opacity:1; transform:none; } }",
      // con l'avviso grande le pillole della rete scendono sotto
      "body.ao-su .sg-pillole{ top:calc(84px + env(safe-area-inset-top)); }",
      // avatar
      ".ao-av{ flex:0 0 auto; width:42px; height:42px; border-radius:50%; overflow:hidden; background:#fff3bf; color:#3a2200; box-sizing:border-box;",
      "  border:2px solid rgba(255,255,255,.9); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.05rem; }",
      ".ao-av svg{ width:100%; height:100%; display:block; }",
      // il foglio "➕ Invita"
      ".ao-sotto{ font-size:.85rem; font-weight:700; opacity:.8; margin-top:-4px; }",
      ".ao-lista{ display:flex; flex-direction:column; gap:8px; }",
      ".ao-gruppo{ font-size:.8rem; font-weight:800; opacity:.75; margin:6px 2px 0; }",
      ".ao-riga{ display:flex; align-items:center; gap:10px; padding:8px 8px 8px 10px; border-radius:16px; background:var(--carta, #34479a); }",
      ".ao-riga.via{ background:rgba(255,255,255,.06); }",
      ".ao-riga.via .ao-av{ filter:grayscale(1); opacity:.6; }",
      ".ao-chi{ flex:1; min-width:0; }",
      ".ao-nome{ font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }",
      ".ao-dove{ font-size:.78rem; font-weight:700; opacity:.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }",
      ".ao-riga.via .ao-nome{ opacity:.7; }",
      ".ao-chiama{ flex:0 0 auto; min-width:112px; }",
      ".ao-chiama.si{ background:var(--verde, #37d47e); color:#04321c; opacity:1; }",
      ".ao-vuoto{ text-align:center; font-weight:700; opacity:.85; padding:18px 8px; line-height:1.35; }",
      ".ao-piede{ display:flex; gap:8px; }",
      ".ao-piede .btn{ margin:0; }"
    ].join("\n");
    document.head.appendChild(s);
  }

  // ---- gli amici: impronte, nomi e avatar (dalla memoria del telefono) ----
  function cache() { var c = leggi("sg-amici-cache"); return c && c.di === A.uid && c.amici ? c : { di: A.uid, firma: "", agg: 0, amici: {} }; }
  function chiDi(uid) { var a = cache().amici[uid] || {}; return { nome: a.nome || "Amico", omino: a.omino || null }; }
  // nomi e avatar nuovi da Firebase: al massimo una volta al giorno, o quando la lista è cambiata
  function rinfresca(uids) {
    if (!uids.length || A.inCorso || !window.SGNube || !SGNube.schede) return;
    var c = cache(), firma = uids.slice().sort().join(",");
    if (c.firma === firma && Date.now() - (c.agg || 0) < UN_GIORNO) return;
    if (Date.now() - A.tentato < RIPROVA_SCHEDE) return;   // (senza rete: non si riprova a ogni giro)
    A.tentato = Date.now(); A.inCorso = true;
    var di = A.uid, p;
    try { p = SGNube.schede(uids); } catch (e) { A.inCorso = false; return; }
    Promise.resolve(p).then(function (lista) {
      A.inCorso = false;
      if (di !== A.uid) return;
      var c2 = cache(), amici = {};
      uids.forEach(function (u) { if (c2.amici[u]) amici[u] = c2.amici[u]; });   // (chi non si trova resta com'era)
      (lista || []).forEach(function (s) {
        if (!s || !s.uid || uids.indexOf(s.uid) < 0) return;
        amici[s.uid] = { nome: String(s.nome || "Amico").slice(0, 24), omino: s.omino || null, H: SGNet.impronta(s.uid) };
      });
      scrivi("sg-amici-cache", { di: di, firma: firma, agg: Date.now(), amici: amici });
      A.tentato = 0;
      avvisa(true);
      if (foglio) foglio.aggiorna(true);
    }, function () { A.inCorso = false; });
  }
  // rilegge la lista degli amici del profilo e la passa alla presenza (solo se è cambiata)
  function sincronizza() {
    if (!A.p) return;
    var uids = [];
    try { uids = (SGNube.amici() || []).filter(function (u) { return typeof u === "string" && u && u !== A.uid; }); } catch (e) {}
    var firma = uids.join(",");
    if (firma !== A.firmaAmici) {
      A.firmaAmici = firma;
      var perH = {};
      uids.forEach(function (u) { perH[SGNet.impronta(u)] = u; });
      A.perH = perH;
      Object.keys(A.on).forEach(function (h) { if (!perH[h]) delete A.on[h]; });
      A.p.segui(Object.keys(perH));
      avvisa();
    }
    rinfresca(uids);
  }

  // ---- chi è online ----
  function online() {
    if (!A.p) return [];
    var ora = Date.now(), l = [];
    Object.keys(A.on).forEach(function (h) {
      var d = A.on[h], uid = A.perH[h];
      if (!uid || !d || d.on !== 1 || !(ora - (+d.t || 0) < DUE_ORE)) return;
      var c = chiDi(uid);
      l.push({ uid: uid, nome: c.nome, omino: c.omino, s: d.s === "gioco" || d.s === "sala" ? d.s : "app" });
    });
    return l.sort(function (a, b) { return a.nome.localeCompare(b.nome); });
  }
  function emetti() {
    ev.t = null;
    var l = online();
    aggiornaBadge(l.length);
    if (foglio) foglio.aggiorna();
    var f = l.map(function (x) { return x.uid + ":" + x.s + ":" + x.nome; }).join("|");
    if (f === ev.firma) return;
    ev.firma = f; ev.ultimo = Date.now();
    evento("sg-amici-online", { n: l.length, lista: l });
  }
  // l'evento al massimo una volta al secondo (i messaggi in fila diventano uno)
  function avvisa(forza) {
    if (forza) ev.firma = null;
    if (ev.t) return;
    var d = 1000 - (Date.now() - ev.ultimo);
    if (d <= 0) emetti(); else ev.t = setTimeout(emetti, d);
  }
  function aggiornaBadge(n) {
    var ora = Date.now();
    badges = badges.filter(function (b) { return b.isConnected || (!b.__visto && ora - b.__t < 60000); });   // (via quelli tolti dalla pagina o mai messi)
    badges.forEach(function (b) {
      if (b.isConnected) b.__visto = true;
      var t = "🟢 " + n;
      if (b.textContent !== t) b.textContent = t;
      b.classList.toggle("zero", !n);
    });
  }

  // ---- gli inviti che arrivano ----
  function visti() { var v = leggi("sg-inviti-visti"); return Array.isArray(v) ? v : []; }
  function segnaVisto(id) { var v = visti().filter(function (x) { return x !== id; }); v.push(id); scrivi("sg-inviti-visti", v.slice(-MAX_VISTI)); }
  function suonoInvito() {
    try {
      var ctx = window.SG && SG.audioCtx && SG.audioCtx(); if (!ctx) return;
      [[784, 0], [1175, 0.13]].forEach(function (x) {
        var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + x[1];
        o.type = "sine"; o.frequency.setValueAtTime(x[0], t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.24);
      });
    } catch (e) {}
  }
  function arrivaInvito(d) {
    if (!A.p || !d || typeof d !== "object") return;
    var ora = Date.now(), t = +d.t || 0;
    if (!(ora - t < DIECI_MIN) || t - ora > DIECI_MIN) return;    // vecchio (o con un'ora impossibile)
    if (!A.perH[d.da]) return;                                     // non è un mio amico
    if (typeof d.id !== "string" || !d.id || visti().indexOf(d.id) >= 0) return;
    if (!codiceOk(d.sala)) return;
    if (A.sala && String(d.sala).toUpperCase() === String(A.sala).toUpperCase()) return;   // ci sono già
    if (invito && invito.d.id === d.id) return;
    mostraInvito(d);
  }
  function togliAvviso() {
    if (!invito) return;
    var I = invito; invito = null;
    clearTimeout(I.tPiccolo); clearTimeout(I.tScade);
    document.body.classList.remove("ao-su");
    if (I.mini && I.mini.parentNode) I.mini.parentNode.removeChild(I.mini);
    var n = I.nodo;
    if (n && n.parentNode) { n.classList.add("via"); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 220); }
  }
  function mostraInvito(d) {
    stile();
    togliAvviso();   // (un invito nuovo prende il posto di quello di prima)
    var amico = chiDi(A.perH[d.da]);
    var nome = String(d.nome || amico.nome || "Un amico").slice(0, 24);
    var I = invito = { d: d, nodo: null, mini: null, tPiccolo: null, tScade: null };
    var nodo = I.nodo = crea("div", "ao-invito");
    nodo.setAttribute("role", "alert");
    nodo.appendChild(faccia(d.om || amico.omino, nome));
    var tx = crea("div", "ao-testo"), r1 = crea("div", "ao-r1");
    r1.appendChild(crea("b", null, nome)); r1.appendChild(document.createTextNode(" ti chiama nella Sala"));
    tx.appendChild(r1);
    if (d.gioco) tx.appendChild(crea("div", "ao-r2", "si gioca a " + String(d.gioco).slice(0, 30)));
    nodo.appendChild(tx);
    var tasti = crea("div", "ao-tasti"), si = crea("button", "ao-entra", "Entra ▶"), no = crea("button", "ao-no", "Non ora");
    si.type = no.type = "button";
    si.addEventListener("click", function () { rispondi(I, true); });
    no.addEventListener("click", function () { rispondi(I, false); });
    tasti.appendChild(si); tasti.appendChild(no); nodo.appendChild(tasti);
    tx.addEventListener("click", function () { grande(I); });   // (toccando la scritta resta grande altri 20 secondi)
    document.body.appendChild(nodo);
    document.body.classList.add("ao-su");
    suonoInvito();   // (nessuna vibrazione: non l'ha toccato nessuno)
    I.tPiccolo = setTimeout(function () { piccolo(I); }, PICCOLO);
    I.tScade = setTimeout(function () { if (invito === I) { togliAvviso(); try { A.p.togliInvito(); } catch (e) {} } }, Math.max(1000, (+d.t || 0) + DIECI_MIN - Date.now()));
  }
  // dopo 20 secondi l'avviso si fa piccolo: 📨 nell'angolo (un tocco lo riapre)
  function piccolo(I) {
    if (invito !== I || !I.nodo || !I.nodo.parentNode) return;
    I.nodo.parentNode.removeChild(I.nodo);
    document.body.classList.remove("ao-su");
    var m = I.mini = crea("button", "ao-mini", "📨");
    m.type = "button"; m.setAttribute("aria-label", "Un amico ti chiama nella Sala");
    m.addEventListener("click", function () { grande(I); });
    document.body.appendChild(m);
  }
  function grande(I) {
    if (invito !== I) return;
    clearTimeout(I.tPiccolo);
    if (I.mini && I.mini.parentNode) I.mini.parentNode.removeChild(I.mini);
    I.mini = null;
    if (!I.nodo.parentNode) { document.body.appendChild(I.nodo); document.body.classList.add("ao-su"); }
    I.tPiccolo = setTimeout(function () { piccolo(I); }, PICCOLO);
  }
  function rispondi(I, si) {
    if (invito !== I) return;
    var d = I.d, p = mioProfilo();
    try { A.p.rispondi(d.da, { t: "risposta", id: d.id, si: !!si, nome: (p && p.nome) || "" }); } catch (e) {}
    try { A.p.togliInvito(); } catch (e) {}
    segnaVisto(d.id);
    togliAvviso();
    if (!si) return;
    var codice = String(d.sala).toUpperCase();
    if (vaiFn) { try { vaiFn(codice, d); } catch (e) { setTimeout(function () { throw e; }); } return; }
    // nessuno ha detto come si entra: come un link (la pagina si ricarica e l'app apre la Sala)
    try { location.replace(location.pathname + location.search + "#sala=" + codice); location.reload(); } catch (e) {}
  }
  // le risposte agli inviti che ho mandato io
  function arrivaMsg(d) {
    if (!d || d.t !== "risposta" || typeof d.id !== "string") return;
    Object.keys(chiamate).forEach(function (uid) {
      var c = chiamate[uid];
      if (c.id !== d.id || c.esito != null) return;
      c.esito = !!d.si;
      if (foglio) foglio.aggiorna();
      evento("sg-amici-risposta", { uid: uid, nome: d.nome || chiDi(uid).nome, si: !!d.si });
    });
  }

  // ---- il foglio "➕ Invita" ----
  var DOVE = { app: "🟢 nell'app", gioco: "🎮 sta giocando", sala: "👥 è in una Sala" };
  function chiamataDi(uid, codice) {
    var c = chiamate[uid];
    return c && c.sala === codice && Date.now() - c.t < DIECI_MIN ? c : null;
  }
  function chiama(uid, o) {
    if (!A.p) return false;
    var c = chiamataDi(uid, o.codice);
    if (c && (c.esito === true || Date.now() - c.t < RICHIAMA)) return false;   // (arriva già, o chiamato da meno di 30 secondi)
    var p = mioProfilo() || {}, h = SGNet.impronta(uid);
    var inv = { id: idACaso(), da: A.h, nome: String(p.nome || "").slice(0, 24), om: p.omino || null, sala: o.codice, gioco: o.gioco || "", t: Date.now() };
    A.p.invita(h, inv);   // (con la rete giù parte appena torna)
    chiamate[uid] = { id: inv.id, t: inv.t, sala: o.codice, esito: null };
    return true;
  }
  function apriFoglio(o) {
    o = o || {};
    if (!codiceOk(o.codice) || document.querySelector(".sl-velo")) return null;
    stile();
    if (A.p) sincronizza();
    var F = { righe: {}, o: o, t: null };
    var corpo = crea("div", "sl-foglio-corpo"), lista = crea("div", "ao-lista");
    var gOn = crea("div", "ao-gruppo", "Sono nell'app"), gVia = crea("div", "ao-gruppo", "Non sono nell'app: se la aprono entro 10 minuti trovano l'invito");
    var vuoto = crea("div", "ao-vuoto", "Non hai ancora amici nell'app: aggiungili da 👥 Classifica");
    corpo.appendChild(lista);
    var testa = crea("div", "sl-foglio-testa"), x = crea("button", "sl-foglio-x", "✕");
    testa.appendChild(crea("b", null, "➕ Invita gli amici"));
    x.type = "button"; x.setAttribute("aria-label", "Chiudi"); x.addEventListener("click", chiudi);
    testa.appendChild(x);
    var sotto = crea("div", "ao-sotto", (o.nomeSala || "La Sala") + (o.gioco ? " · si gioca a " + o.gioco : ""));
    var piede = crea("div", "ao-piede");
    if (o.condividi) {
      var bl = crea("button", "btn btn-primario", "📤 Manda il link"); bl.type = "button";
      bl.addEventListener("click", function () { try { o.condividi(bl); } catch (e) {} });
      piede.appendChild(bl);
    }
    if (o.qr) {
      var bq = crea("button", "btn", "▦ QR"); bq.type = "button"; bq.style.flex = "0 0 auto"; bq.style.width = "auto";
      bq.addEventListener("click", function () { try { o.qr(bq); } catch (e) {} });
      piede.appendChild(bq);
    }
    var sheet = crea("div", "sl-foglio ao-foglio");
    sheet.appendChild(testa); sheet.appendChild(sotto); sheet.appendChild(corpo);
    if (piede.firstChild) sheet.appendChild(piede);
    var velo = crea("div", "sl-velo ao-velo");
    velo.addEventListener("click", function (e) { if (e.target === velo) chiudi(); });
    velo.appendChild(sheet);

    function riga(uid) {
      var c = chiDi(uid), R = { uid: uid, nodo: crea("div", "ao-riga"), av: null, nome: crea("div", "ao-nome", c.nome), dove: crea("div", "ao-dove"), b: crea("button", "btn btn-piccolo ao-chiama"), firmaAv: "" };
      var chi = crea("div", "ao-chi");
      R.av = faccia(c.omino, c.nome); R.firmaAv = JSON.stringify(c.omino || null);
      chi.appendChild(R.nome); chi.appendChild(R.dove);
      R.b.type = "button";
      R.b.addEventListener("click", function () { if (chiama(uid, o)) aggiorna(); });
      R.nodo.appendChild(R.av); R.nodo.appendChild(chi); R.nodo.appendChild(R.b);
      return R;
    }
    function testoTasto(R) {
      var c = chiamataDi(R.uid, o.codice), ora = Date.now();
      if (!c) return { t: "📨 Chiama", ok: true };
      if (c.esito === true) return { t: "👍 Arriva!", ok: false, si: true };
      var dopo = ora - c.t >= RICHIAMA;
      if (c.esito === false) return dopo ? { t: "📨 Richiama", ok: true } : { t: "🙅 Non ora", ok: false };
      return dopo ? { t: "📨 Richiama", ok: true } : { t: "✅ Chiamato", ok: false };
    }
    // aggiorna solo quello che cambia (niente lampeggio): scritte, tasti, ordine
    function aggiorna(nomi) {
      if (!velo.isConnected && F.montato) return;
      var on = {}, uids = [];
      online().forEach(function (x) { on[x.uid] = x.s; });
      Object.keys(A.perH).forEach(function (h) { uids.push(A.perH[h]); });
      uids.sort(function (a, b) { return chiDi(a).nome.localeCompare(chiDi(b).nome); });
      var su = uids.filter(function (u) { return on[u]; }), giu = uids.filter(function (u) { return !on[u]; });
      var voluti = [];
      if (su.length && giu.length) voluti.push(gOn);
      su.forEach(function (u) { voluti.push(u); });
      if (giu.length) voluti.push(gVia);
      giu.forEach(function (u) { voluti.push(u); });
      if (!uids.length) voluti = [vuoto];
      var prossimo = 0, presto = Infinity;
      voluti.forEach(function (v) {
        var n;
        if (typeof v === "string") {
          var R = F.righe[v] || (F.righe[v] = riga(v)), c = chiDi(v);
          if (nomi) {
            if (R.nome.textContent !== c.nome) R.nome.textContent = c.nome;
            var fa = JSON.stringify(c.omino || null);
            if (fa !== R.firmaAv) { var nuovo = faccia(c.omino, c.nome); R.nodo.replaceChild(nuovo, R.av); R.av = nuovo; R.firmaAv = fa; }
          }
          var dove = on[v] ? DOVE[on[v]] : "non è nell'app";
          if (R.dove.textContent !== dove) R.dove.textContent = dove;
          R.nodo.classList.toggle("via", !on[v]);
          var tt = testoTasto(R);
          if (R.b.textContent !== tt.t) R.b.textContent = tt.t;
          R.b.disabled = !tt.ok || !A.p;
          R.b.classList.toggle("si", !!tt.si);
          R.b.classList.toggle("btn-verde", tt.ok && !!on[v]);
          var ch = chiamataDi(v, o.codice);
          if (ch && !tt.ok && !tt.si) presto = Math.min(presto, ch.t + RICHIAMA - Date.now());
          n = R.nodo;
        } else n = v;
        if (lista.children[prossimo] !== n) lista.insertBefore(n, lista.children[prossimo] || null);
        prossimo++;
      });
      while (lista.children.length > prossimo) lista.removeChild(lista.lastChild);
      Object.keys(F.righe).forEach(function (u) { if (uids.indexOf(u) < 0) delete F.righe[u]; });
      // il tasto torna "📨 Richiama" dopo 30 secondi
      clearTimeout(F.t);
      if (presto < Infinity) F.t = setTimeout(function () { aggiorna(); }, Math.max(250, presto + 50));
    }
    function chiudi() {
      clearTimeout(F.t);
      if (foglio === F) foglio = null;
      if (velo.parentNode) velo.parentNode.removeChild(velo);
    }
    F.aggiorna = aggiorna; F.chiudi = chiudi;
    if (foglio) foglio.chiudi();
    foglio = F;
    aggiorna(true);
    document.body.appendChild(velo);
    F.montato = true;
    return { nodo: velo, chiudi: chiudi };
  }

  // ---- avvio e fine ----
  function aggancia() {
    if (A.agganciato) return;
    A.agganciato = true;
    // in secondo piano per gli amici non ci sono (gli inviti arrivano lo stesso)
    try { document.addEventListener("visibilitychange", function () { if (A.p) { A.p.nascondi(inSecondoPiano() || nascosto()); if (!inSecondoPiano()) sincronizza(); } }); } catch (e) {}
    // il profilo cambia (un amico in più, un altro profilo, uscita)
    try {
      if (window.SGNube && SGNube.onCambio) SGNube.onCambio(function () {
        if (!A.p) return;
        var u = null; try { u = SGNube.utente(); } catch (e) {}
        if (!u || !mioProfilo()) return ferma();
        if (u.uid !== A.uid) { ferma(); avvia(); return; }
        sincronizza();
      });
    } catch (e) {}
  }
  function avvia() {
    var u = null;
    try { u = window.SGNube && SGNube.utente && SGNube.utente(); } catch (e) {}
    if (!u || !u.uid || !mioProfilo() || !window.SGNet || !SGNet.presenza || !SGNet.impronta) return false;
    if (A.p && A.uid === u.uid) { sincronizza(); return true; }
    if (A.p) ferma();
    A.uid = u.uid; A.h = SGNet.impronta(u.uid);
    A.on = {}; A.perH = {}; A.firmaAmici = null; A.tentato = 0;
    A.p = SGNet.presenza({ h: A.h, stato: A.stato, nascosto: nascosto() || inSecondoPiano() }, {
      onAmico: function (h, d) { if (!A.perH[h]) return; A.on[h] = d; avvisa(); },
      onInvito: arrivaInvito,
      onMsg: arrivaMsg
    });
    if (!A.p) { A.uid = A.h = null; return false; }
    aggancia();
    sincronizza();
    return true;
  }
  function ferma() {
    if (A.p) { try { A.p.chiudi(); } catch (e) {} }
    A.p = null; A.uid = A.h = null; A.on = {}; A.perH = {}; A.firmaAmici = ""; A.sala = null;
    chiamate = {};
    togliAvviso();
    if (foglio) foglio.chiudi();
    clearTimeout(ev.t); ev.t = null;
    aggiornaBadge(0);
    if (ev.firma !== "") { ev.firma = ""; ev.ultimo = Date.now(); evento("sg-amici-online", { n: 0, lista: [] }); }
  }

  window.SGAmiciOnline = {
    avvia: avvia,
    ferma: ferma,
    online: online,
    stato: function (s, sala) {
      A.stato = s === "gioco" || s === "sala" ? s : "app";
      A.sala = A.stato === "sala" && codiceOk(sala) ? String(sala).toUpperCase() : (A.stato === "sala" ? A.sala : null);
      if (!A.p) return;
      A.p.stato(A.stato);
      A.p.nascondi(nascosto() || inSecondoPiano());
      if (invito && A.sala && String(invito.d.sala).toUpperCase() === A.sala) {   // ci sono già arrivato (da un link o da solo)
        segnaVisto(invito.d.id); togliAvviso();
        try { A.p.togliInvito(); } catch (e) {}
      }
    },
    visibile: function (si) {
      if (si === undefined) return !nascosto();
      try { if (si) localStorage.removeItem("sg-presenza"); else localStorage.setItem("sg-presenza", "0"); } catch (e) {}
      if (A.p) A.p.nascondi(!si || inSecondoPiano());
      return !!si;
    },
    badge: function () {
      if (!A.p) return null;
      var n = online().length;
      if (!n) return null;
      stile();
      var b = crea("span", "ao-badge", "🟢 " + n);
      b.__t = Date.now();
      badges.push(b);
      return b;
    },
    foglioInvita: apriFoglio,
    onInvito: function (fn) { vaiFn = typeof fn === "function" ? fn : null; }
  };
})();
