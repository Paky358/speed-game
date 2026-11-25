// PROVA «LE LETTERE CHE SCENDONO SOTTO LA RIGA NON SI TAGLIANO» NELLA MINI ASTA (25 nov 2026, il proprietario: la «g» di Rigoni tagliata).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-lettere.js"); await COPIONE.prova("lg1")
// Con Edge invisibile: prova.js --porta 8995 --carica preferiti/asta.js,preferiti/asta-lettere.js --prova lg1
//
// lg1 Online in 3 con gli scambi accesi (Paky tiene la partita, Giulia, Luca; Luca su un telefono più grande, 412x915): l'asta, il mercato,
//     le rose, la giornata (quadretti, scheda dei calciatori, pagelle) e il podio. Ogni 250 ms, su ogni telefono, OGNI scritta che si vede:
//     dove finirebbe la coda di g, j, p, q, y nel suo carattere (misurata con la tela: actualBoundingBoxDescent) e se un contenitore che taglia
//     (overflow non visibile) la taglia. Una scritta che esce tutta da un elenco che scorre non conta (si scorre). Dice dove e di quanti pixel.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  function vm(C) { return W.vmDi(C) || {}; }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return [].slice.call(w.document.querySelectorAll(sel)).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }
  function nomeEl(e) { var s = e.tagName.toLowerCase(); if (e.className && typeof e.className === "string") s += "." + e.className.trim().split(/\s+/).slice(0, 2).join("."); return s; }
  function strada(e, d) { var l = []; for (var a = e; a && a !== d.body && l.length < 4; a = a.parentElement) l.unshift(nomeEl(a)); return l.join(" > "); }
  function muove(a) {   // sta entrando o uscendo con un movimento (es. la riga gialla che scorre): non è ferma, non si guarda
    if (!a.getAnimations) return false;
    return a.getAnimations().some(function (an) { if (an.playState !== "running" || !an.effect || !an.effect.getKeyframes) return false; return an.effect.getKeyframes().some(function (k) { return k.transform && k.transform !== "none" || k.translate || k.top != null; }); });
  }
  // le scritte tagliate sotto la riga in questo momento: [{ dove, px, testo }]
  W.lettereTagliate = function (w) {
    var d = w.document, cv = (W.__cvLettere = W.__cvLettere || d.createElement("canvas")).getContext("2d"), out = [], mis = {};
    [].forEach.call(d.querySelectorAll("body *"), function (e) {
      if (e.tagName === "SCRIPT" || e.tagName === "STYLE" || !e.getClientRects().length || e.classList.contains("emo")) return;   // (.emo: il testo nascosto apposta dietro il simbolo)
      var nodi = [].filter.call(e.childNodes, function (n) { return n.nodeType === 3 && /[A-Za-zÀ-ɏ0-9]/.test(n.textContent); });   // (solo lettere e cifre: le emoji hanno il loro disegno)
      if (!nodi.length) return;
      var cs = w.getComputedStyle(e); if (cs.visibility === "hidden" || +cs.opacity === 0) return;
      var clip = null, cb = Infinity, scorre = false;
      for (var a = e; a && a !== d.documentElement; a = a.parentElement) {
        var s = a === e ? cs : w.getComputedStyle(a);
        if (+s.opacity === 0 || s.visibility === "hidden" || muove(a)) return;
        if (s.overflowY !== "visible" || s.overflowX !== "visible") { var r = a.getBoundingClientRect(), b = r.bottom - (parseFloat(s.borderBottomWidth) || 0); if (b < cb) { cb = b; clip = a; scorre = /auto|scroll/.test(s.overflowY); } }
      }
      if (!clip) return;
      var font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily, m = mis[font];
      if (!m) { cv.font = font; var t = cv.measureText("Rgjpqy"); m = mis[font] = { asc: t.fontBoundingBoxAscent, disc: t.actualBoundingBoxDescent }; }
      nodi.forEach(function (n) {
        var rg = d.createRange(); rg.selectNodeContents(n);
        [].forEach.call(rg.getClientRects(), function (rr) {
          if (rr.width < 2 || rr.top >= cb) return;   // (tutta fuori: un elenco che scorre, si vede scorrendo)
          var giu = rr.top + m.asc + m.disc, px = giu - cb;
          var piu = scorre && clip !== e && clip.scrollTop + clip.clientHeight < clip.scrollHeight - 1;   // (un elenco che scorre e non è ancora in fondo: scorrendo si vede)
          if (px > 0.6 && !piu && !(scorre && rr.bottom > cb + 2 && clip !== e)) out.push({ dove: strada(e, d), taglia: clip === e ? "lei" : nomeEl(clip), px: Math.round(px * 10) / 10, testo: n.textContent.trim().slice(0, 24), fs: cs.fontSize });
        });
      });
    });
    return out;
  };
  async function telefoni(nomi) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "fanta", scambi: true }; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    var fL = document.getElementById("tel-Luca"); if (fL) { fL.style.width = "412px"; fL.style.height = "915px"; fL.contentWindow.dispatchEvent(new Event("resize")); }
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  COPIONE.aggiungi("lg1", { nome: "Mini Asta: le lettere che scendono sotto la riga (g, j, p, q, y) non si tagliano mai, dall'asta al podio", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], o = await telefoni(NOMI), P = o.P, C = o.C, trovati = {}, fasi = {}, fino = Date.now() + 600000, visti = {};
    function guarda() {
      var f = vm(C).fase || "?"; fasi[f] = 1;
      NOMI.forEach(function (n) { var w = W.finestra(n); if (!w) return; W.lettereTagliate(w).forEach(function (t) { var k = t.dove + " · " + t.fs + " · taglia " + t.taglia, x = trovati[k] = trovati[k] || { volte: 0, pxs: {} }; x.volte++; x.pxs[t.px] = (x.pxs[t.px] || 0) + 1; if (!x.px || x.px < t.px) { x.px = t.px; x.testo = t.testo; x.fase = f; x.chi = n; } }); });
    }
    while (Date.now() < fino && !NOMI.every(function (n) { return q(W.finestra(n), ".st-gradini"); })) {
      guarda();
      var v = vm(C), a = v.asta;
      if (v.fase === "asta" && a && !visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) {
        visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
        var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
        if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else manda(pr.nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta, vl: "", tk: 1 }); } }
        else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: a.nCarta }); });
      }
      if (v.fase === "scambi" && !fasi.__merc) { fasi.__merc = Date.now(); }
      if (v.fase === "scambi" && Date.now() - fasi.__merc > 3500) { var fi = bott(P, "button", /Inizia la giornata|Si gioca/); if (fi) fi.click(); var ok = bott(P, "button", /Iniziamo/); if (ok) ok.click(); }
      if (v.fase === "fine") {
        NOMI.forEach(function (n) { var w = W.finestra(n); if (q(w, ".st-rivela") && !q(w, ".st-bar-vel")) W.clicca(w, /Salta/); });
        var bv = q(P, ".st-bar-vel"); if (bv && !bv.classList.contains("on")) bv.click();
        var av = bott(P, ".st-pag-av", /Avanti|Mostra tutta/); if (av && !av.disabled) av.click();
        if (!fasi.__scheda) { var qd = q(W.finestra("Giulia"), ".st-gio-riga"); if (qd && q(W.finestra("Giulia"), ".st-bar-vel")) { fasi.__scheda = 1; qd.click(); await W.dorme(700); guarda(); var ch = bott(W.finestra("Giulia"), "button", /Chiudi|✕/); if (ch) ch.click(); } }
      }
      await W.dorme(250);
    }
    guarda();
    var l = Object.keys(trovati).filter(function (k) { var t = trovati[k]; return Object.keys(t.pxs).some(function (p) { return t.pxs[p] >= 3; }); }).map(function (k) { var t = trovati[k], fermo = Object.keys(t.pxs).filter(function (p) { return t.pxs[p] >= 3; }).map(Number).sort(function (a, b) { return b - a; })[0]; return k + " → " + fermo + " px («" + t.testo + "», " + t.fase + ", " + t.chi + ")"; });   // (solo le scritte ferme: tagliate allo stesso modo almeno 3 volte, non quelle che entrano con un movimento)
    W.__lettere = l;
    if (!NOMI.every(function (n) { return q(W.finestra(n), ".st-gradini"); })) l.push("(la partita non arriva al podio)");
    if (l.length) no(l.length + " scritte tagliate sotto la riga: " + l.join(" | "));
    return "fasi guardate: " + Object.keys(fasi).filter(function (f) { return f.indexOf("__") !== 0; }).join(", ") + (fasi.__scheda ? ", scheda dei calciatori" : "") + " · nessuna scritta tagliata sotto la riga su 3 telefoni (360x740 e 412x915)";
  } });
  // lg2 Il mercato degli scambi in 2, 3, 4, 6, 8 e 10 su tre telefoni (360x640, 360x697, 412x915: col telefono alto sotto il nome c'è la squadra,
  //     es. «Bologna», «Empoli», «Spezia»), con le squadre che hanno le lettere che scendono: nessuna scritta tagliata sotto la riga.
  COPIONE.aggiungi("lg2", { nome: "Mini Asta, il mercato degli scambi: le lettere che scendono sotto la riga non si tagliano (in 2-10, tre telefoni)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), ko = [], giro = 0, viste = 0;
    P.SGCuore.precarica("astafanta");
    if (!await W.aspetta(function () { return P.SG_FANTA_CALCIATORI && P.SG_FANTA_SQUADRE && P.SG_FANTA_QUOTAZIONI; }, 20000)) no("i dati del fanta non arrivano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "  var MERC = null;";
    if (src.indexOf(ag) < 0) no("non trovo il mercato nel file del gioco");
    new P.Function("SG", "FUORI", src.replace(ag, "FUORI.mercatoVM = mercatoVM; FUORI.sorteggio = sorteggioCoppie;" + ag))({ registra: function () {}, bot: P.SG && P.SG.bot }, F);
    var el = P.SGCuore.el, app = P.document.getElementById("app"), CA = P.SG_FANTA_CALCIATORI;
    var t = { el: el, guarda: false, conferma: function () {},
      schermata: function () { var s = el("div", { class: "schermata oro senza-testa g-astafanta" }, [ el("div", { class: "testa" }), el("div", { class: "contenuto" }), el("div", { class: "piede" }) ]); s._contenuto = s.children[1]; s._piede = s.children[2]; return s; },
      mostra: function (s) { while (app.firstChild) app.removeChild(app.firstChild); app.appendChild(s); } };
    var NOMI = ["Paky", "Giulia", "Luca", "Peppe", "Gigi", "Pasquale", "Giuseppe", "Gianfrancesco", "Jago", "Yuri"];
    function rose(n, seme) {   // prima i calciatori con g, j, p, q, y nel nome o nella squadra
      var usati = {}; function rnd() { seme = (seme * 9301 + 49297) % 233280; return seme / 233280; }
      function tutti(r) { var l = []; Object.keys(CA[r]).forEach(function (f) { if (f !== "X") l = l.concat(CA[r][f]); }); var g = l.filter(function (s) { return /[gjpqy]/.test(s); }); return g.length > 10 ? g : l; }
      function prendi(r) { var l = tutti(r); for (var i = 0; i < 999; i++) { var s = l[Math.floor(rnd() * l.length)]; if (usati[s]) continue; usati[s] = 1; var m = /^(.*) \((.*)\)$/.exec(s); return { nome: m[1], squadra: m[2], ruolo: r, prezzo: 1 + Math.floor(rnd() * 20) }; } }
      return NOMI.slice(0, n).map(function (nm, i) { return { id: i ? "g" + i : "host", nome: nm, omino: null, crediti: 3, kit: ["P", "D", "C", "C", "A"].map(prendi) }; });
    }
    var fr = document.getElementById("tel-Paky");
    for (var ti = 0; ti < 3; ti++) {
      var wh = [[360, 640], [360, 697], [412, 915]][ti];
      fr.style.cssText = "position:absolute;top:0;left:0;width:" + wh[0] + "px;height:" + wh[1] + "px;border:0;background:#000;transform:none;z-index:9";
      P.dispatchEvent(new P.Event("resize")); await W.dorme(300);
      for (var ni = 0; ni < 6; ni++) {
        var n = [2, 3, 4, 6, 8, 10][ni]; giro++;
        F.mercatoVM(t, { codice: "LG2" + giro, sessione: giro, fase: "scambi", giocatori: rose(n, 5 + n * 3 + ti), scambi: { resta: 170000, prop: [], esiti: [], nf: 0, coppie: [F.sorteggio()] } }, { myId: "host", sonoHost: true, onScambio: function () {} });
        await W.dorme(450); viste++;
        W.lettereTagliate(P).forEach(function (x) { ko.push(wh.join("x") + " in " + n + ": " + x.dove + " (" + x.fs + ", taglia " + x.taglia + ") " + x.px + " px «" + x.testo + "»"); });
        var sc = P.document.querySelector(".mc-rose.scorre");
        if (sc) {   // si scorre: in fondo l'ultima rosa si vede intera, anche le code delle lettere
          sc.scrollTop = 99999; sc.dispatchEvent(new P.Event("scroll")); await W.dorme(200);
          W.lettereTagliate(P).forEach(function (x) { ko.push(wh.join("x") + " in " + n + " (in fondo): " + x.dove + " (" + x.fs + ", taglia " + x.taglia + ") " + x.px + " px «" + x.testo + "»"); });
        }
      }
    }
    var visti = {}; ko = ko.filter(function (k) { var c = k.replace(/^\S+ in \d+: /, "").replace(/ [\d.]+ px «.*»$/, ""); if (visti[c]) return false; visti[c] = 1; return true; });
    if (ko.length) no(ko.length + " scritte tagliate: " + ko.slice(0, 8).join(" | "));
    return viste + " mercati guardati (2-10 rose, 360x640, 360x697, 412x915): nessuna scritta tagliata sotto la riga";
  } });
})();
