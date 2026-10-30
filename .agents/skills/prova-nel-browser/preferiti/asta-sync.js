// PROVE DELLA GIORNATA SINCRONIZZATA (29 ott 2026, il proprietario: «ero host dal mio Android e gli amici sugli iPhone vedevano la
// giornata in ritardo rispetto a me… ogni momento deve comparire su tutti i telefoni nello stesso istante, host compreso»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-sync.js"); await COPIONE.prova("gs1")
//
// Si misura quando la STESSA scritta (annuncio, esito, fischio, titolo delle pagelle) compare su ogni telefono, col tempo vero della
// pagina delle prove (i telefoni hanno l'orologio spostato apposta). Il risultato dice lo scarto più grande e quello tipico.
// gs0 Solo guardare (vale anche per la versione di prima): host + 2 amici, rete a 300 ms, orologi sfasati; nessun tocco
//     (le rose e la giornata scorrono da sole, le pagelle vanno avanti da sole). Dice gli scarti; non dice NO.
// gs1 Come gs0 ma con tutto: Paky tocca ⏩ a metà primo tempo, «Avanti ▶» alle pagelle e «Mostra tutta ▶»; Luca blocca il
//     telefono 8 secondi a metà giornata; Giulia ricarica la pagina dopo l'intervallo. NO se lo scarto supera 150 ms
//     (fuori dai 3 secondi dopo che un telefono è tornato) o se un telefono non arriva al podio.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }
  var OROLOGI = { Paky: 0, Giulia: 3200, Luca: -1800 };   // (ms: Giulia avanti, Luca indietro)

  // ⏱️ la spia: ogni scritta nuova (sul campo o in cima alle pagelle) col tempo vero della pagina delle prove
  function spia(nome, LOG) {
    var w = W.finestra(nome); if (!w || !w.document || !w.document.body) return;
    if (w.__spiaSync) w.__spiaSync.disconnect();
    var conta = {}, ultimo = { m: "", p: "" };
    function guarda() {
      var m = q(w, ".st-msg.on"), p = q(w, ".st-pag.on:not(.live) .st-pag-tit"), mt = m ? m.textContent : "", pt = p ? p.textContent.replace(/ · \d+\/\d+$/, "") : "";
      var min = q(w, ".st-bar-min"), mm = min ? min.textContent : "";   // (col minuto: due ammonizioni uguali in minuti diversi sono due scritte diverse, anche per chi ha ricaricato e non ha visto le prime)
      [["m", mt], ["p", pt]].forEach(function (x) {
        if (x[1] === ultimo[x[0]]) return; ultimo[x[0]] = x[1]; if (!x[1]) return;
        var k = x[0] + ":" + x[1] + "@" + mm; conta[k] = (conta[k] || 0) + 1;
        LOG.push({ nome: nome, k: k + "#" + conta[k], t: performance.now() });
      });
    }
    w.__spiaSync = new w.MutationObserver(guarda);
    w.__spiaSync.observe(w.document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"], characterData: true });
  }
  function scarti(LOG, nomi, fuori) {   // per ogni scritta vista da tutti: quanto dopo (o prima) degli altri telefoni
    var per = {};
    LOG.forEach(function (e) { (per[e.k] = per[e.k] || {})[e.nome] = e.t; });
    var d = [], peggio = null;
    Object.keys(per).forEach(function (k) {
      var x = per[k]; if (!nomi.every(function (n) { return x[n] != null; })) return;
      if (fuori && nomi.some(function (n) { return fuori(n, x[n]); })) return;
      var ts = nomi.map(function (n) { return x[n]; }), s = Math.max.apply(null, ts) - Math.min.apply(null, ts);
      d.push(s); if (!peggio || s > peggio.s) peggio = { k: k, s: s, t: nomi.map(function (n) { return n + " " + Math.round(x[n] - x[nomi[0]]); }).join(", ") };
    });
    d.sort(function (a, b) { return a - b; });
    return { n: d.length, max: d.length ? Math.round(d[d.length - 1]) : 0, mediana: d.length ? Math.round(d[Math.floor(d.length / 2)]) : 0, p90: d.length ? Math.round(d[Math.floor(d.length * 0.9)]) : 0, peggio: peggio };
  }
  async function telefoni(imp, nomi) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    nomi.forEach(function (n) { if (OROLOGI[n]) W.spostaOrologio(n, OROLOGI[n]); });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  async function astaVeloce(P, C) {   // se nessuno ha offerto lo prende il primo che può, poi passano gli altri
    var fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(250); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else manda(pr.nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta, vl: "", tk: 1 }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: a.nCarta }); });
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("il fanta online non finisce");
  }
  async function serata(tocchi) {
    var NOMI = ["Paky", "Giulia", "Luca"], vecchio = W.BR.ritardo, LOG = [], tornati = {};
    try {
      W.BR.ritardo = 300;   // 📶 rete lenta: ogni messaggio ci mette 300 ms (in tutte e due le direzioni)
      var o = await telefoni({ formato: "fanta" }, NOMI), P = o.P, C = o.C;
      await astaVeloce(P, C);
      NOMI.forEach(function (n) { spia(n, LOG); });
      var fino = Date.now() + 360000, fatto = {};
      while (Date.now() < fino) {
        var tuttiPodio = NOMI.every(function (n) { var w = W.finestra(n); return w && q(w, ".st-gradini"); });
        if (tuttiPodio) break;
        var prossimi = LOG.filter(function (e) { return e.nome === "Paky"; }).length;
        if (tocchi) {
          var bv = q(P, ".st-bar-vel");
          if (!fatto.vel && prossimi > 8 && bv && visibile(bv)) { fatto.vel = 1; bv.click(); }   // ⏩ di chi tiene la partita, a metà primo tempo
          if (!fatto.spento && prossimi > 14) { fatto.spento = 1; W.spegni("Luca"); setTimeout(function () { W.riaccendi("Luca"); tornati.Luca = performance.now(); }, 8000); }
          var av = bott(P, ".st-pag-av", /Avanti|Mostra tutta/); if (av && !av.disabled && Math.random() < 0.25) av.click();   // (gli «Avanti ▶» e «Mostra tutta ▶» di Paky, dopo un po')
          if (!fatto.ric && LOG.some(function (e) { return e.nome === "Paky" && /SI RIPARTE/.test(e.k); }) && prossimi > 0) {
            fatto.ric = 1; await W.ricarica("Giulia"); tornati.Giulia = performance.now();
            await W.aspetta(function () { var w = W.finestra("Giulia"); return w && q(w, ".st-rivela"); }, 15000); spia("Giulia", LOG);
          }
        }
        await W.dorme(200);
      }
      var mancano = NOMI.filter(function (n) { var w = W.finestra(n); return !(w && q(w, ".st-gradini")); });
      var fuori = function (n, t) { return tornati[n] != null && t > tornati[n] - 500 && t < tornati[n] + 3000; };   // (i 3 secondi dopo che un telefono è tornato: sta recuperando)
      return { s: scarti(LOG, NOMI, fuori), a2: scarti(LOG, ["Paky", "Luca"], fuori), mancano: mancano, LOG: LOG };
    } finally { W.BR.ritardo = vecchio; }
  }
  function testo(r) { return "scritte viste da tutti " + r.s.n + ": scarto tipico " + r.s.mediana + " ms, 9 su 10 entro " + r.s.p90 + " ms, il più grande " + r.s.max + " ms" + (r.s.peggio ? " (" + r.s.peggio.k + ": " + r.s.peggio.t + ")" : ""); }

  // gs2: Paky (chi tiene la partita) si spegne a metà giornata e non torna: entro 8 s la tiene Giulia, la giornata va avanti dallo
  // stesso punto e Giulia e Luca restano allineati (scarti misurati da 4 s dopo il cambio), fino al podio di tutti e due.
  async function serataVice() {
    var NOMI = ["Paky", "Giulia", "Luca"], vecchio = W.BR.ritardo, LOG = [], LOG2 = [], note = [];
    try {
      W.BR.ritardo = 300;
      var o = await telefoni({ formato: "fanta" }, NOMI), P = o.P, C = o.C, idG = A.mioId("Giulia");
      await astaVeloce(P, C);
      NOMI.forEach(function (n) { spia(n, LOG); });
      if (!await W.aspetta(function () { return LOG.filter(function (e) { return e.nome === "Paky"; }).length > 10; }, 180000)) no("la giornata non arriva al decimo momento su Paky");
      await W.dorme(1600);   // (la copia ai vice: al massimo una al secondo)
      var t0 = Date.now(); A.muore("Paky");
      if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idG; }, 8000)) no("dopo 8 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
      note.push("Giulia tiene la partita in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
      await W.dorme(4000);
      ["Giulia", "Luca"].forEach(function (n) { spia(n, LOG2); });   // (da qui si conta da capo, su tutti e due)
      var PIANO = {};   // (cosa crede ogni telefono: il tempo della partita a ogni momento e la misura dell'orologio)
      ["Giulia", "Luca"].forEach(function (n) { var w = W.finestra(n); PIANO[n] = []; w.SG_PROVA_PIANO = function (cosa, g, o) { PIANO[n].push({ cosa: cosa, g: Math.round(g), t: performance.now(), o: o }); }; });
      note.push = note.push;
      W.__pianoVice = PIANO;
      var G = W.finestra("Giulia"), fino = Date.now() + 300000;
      while (Date.now() < fino && !["Giulia", "Luca"].every(function (n) { var w = W.finestra(n); return w && q(w, ".st-gradini"); })) {
        var av = bott(G, ".st-pag-av", /Avanti|Mostra tutta/); if (av && !av.disabled && Math.random() < 0.25) av.click();   // (ora guida Giulia)
        await W.dorme(200);
      }
      var mancano = ["Giulia", "Luca"].filter(function (n) { var w = W.finestra(n); return !(w && q(w, ".st-gradini")); });
      ["Giulia", "Luca"].forEach(function (n) {   // (l'orologio di Giulia è 3.200 ms avanti, quello di Luca 1.800 indietro: Luca dovrebbe misurare +5.000)
        var l = PIANO[n], x = l[l.length - 1], y = l[Math.floor(l.length / 2)];
        if (x) note.push(n + ": " + l.length + " momenti, a metà orologio " + JSON.stringify(y && y.o) + ", alla fine " + JSON.stringify(x.o));
      });
      var gG = {}, dd = []; PIANO.Giulia.forEach(function (e) { gG[e.cosa] = e; });
      PIANO.Luca.forEach(function (e) { var g = gG[e.cosa]; if (g) dd.push(Math.round(e.t - g.t) + "/" + (e.g - g.g)); });
      note.push("Luca meno Giulia (ms vero / tempo della partita): " + dd.slice(0, 12).join(" "));
      return { s: scarti(LOG2, ["Giulia", "Luca"]), mancano: mancano, note: note };
    } finally { W.BR.ritardo = vecchio; }
  }
  COPIONE.aggiungi("gs2", { nome: "Giornata del fanta online: chi la tiene si spegne a metà, Giulia la porta avanti e resta allineata con Luca fino al podio (rete 300 ms, orologi sfasati)", fai: async function () {
    var r = await serataVice();
    if (r.mancano.length) no("non arrivano al podio: " + r.mancano.join(", ") + " · " + testo(r));
    if (r.s.n < 8) no("troppe poche scritte viste da tutti e due dopo il cambio (" + r.s.n + ")");
    if (r.s.max > 150) no("Giulia e Luca sfasati: " + testo(r));
    return r.note.join("; ") + " · " + testo(r);
  } });

  // gs3 (30 ott 2026): Giulia ha il telefono più basso di quello di Paky (360x560 contro 360x900): le pagelle del primo tempo a lei
  // servono più pagine. Quando Paky va avanti (o il conto finisce) le pagelle si chiudono anche per lei, e nel secondo tempo il campo si vede
  // (prima l'ultima pagina si chiudeva e si riaccendeva subito, e restava aperta sopra il campo fino alla fine)
  COPIONE.aggiungi("gs3", { nome: "Giornata del fanta online: un amico col telefono più basso dell'host ha più pagine di pagelle, ma nel secondo tempo il campo si vede", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marco"], vecchio = W.BR.ritardo;
    try {
      W.BR.ritardo = 300;
      var o = await telefoni({ formato: "fanta" }, NOMI), P = o.P, C = o.C;
      function misura(nome, w, h) { var f = document.getElementById("tel-" + nome), win = W.finestra(nome); f.style.width = w + "px"; f.style.height = h + "px"; win.dispatchEvent(new win.Event("resize")); }
      misura("Paky", 360, 900); misura("Giulia", 360, 560);
      await astaVeloce(P, C);
      var G = W.finestra("Giulia"), pagG = 0, pagP = 0, fino = Date.now() + 240000;
      while (Date.now() < fino) {
        var tg = q(G, ".st-pag.on:not(.live) .st-pag-tit"), tp = q(P, ".st-pag.on:not(.live) .st-pag-tit");
        if (tg && /primo tempo · (\d+)\/(\d+)/.test(tg.textContent)) pagG = Math.max(pagG, +RegExp.$2);
        if (tp && /primo tempo/.test(tp.textContent)) pagP = Math.max(pagP, /· \d+\/(\d+)/.test(tp.textContent) ? +RegExp.$1 : 1);
        if (/SI RIPARTE/.test((q(G, ".st-msg.on") || {}).textContent || "")) break;
        await W.dorme(150);
      }
      if (!pagG) no("Giulia non ha visto le pagelle del primo tempo");
      if (pagG <= pagP) no("le pagelle non hanno più pagine su Giulia (" + pagG + ") che su Paky (" + pagP + "): la prova non prova niente");
      // il secondo tempo: per 8 secondi le pagelle di Giulia devono restare chiuse
      for (var k = 0; k < 40; k++) { var aperte = q(G, ".st-pag.on:not(.live)"); if (aperte) no("nel secondo tempo le pagelle di Giulia sono ancora aperte: «" + (q(G, ".st-pag-tit") || {}).textContent + "»"); await W.dorme(200); }
      return "Giulia " + pagG + " pagine di pagelle, Paky " + pagP + ": nel secondo tempo il campo si vede su tutti e due";
    } finally { W.BR.ritardo = vecchio; }
  } });

  COPIONE.aggiungi("gs0", { nome: "Giornata del fanta online, solo guardare: quanto sono sfasati i telefoni (rete 300 ms, orologi sfasati)", fai: async function () {
    var r = await serata(false);
    W.__ultimaSync = r;
    return testo(r) + (r.mancano.length ? " · senza podio: " + r.mancano.join(", ") : "");
  } });
  COPIONE.aggiungi("gs1", { nome: "Giornata del fanta online sincronizzata: ⏩, Avanti ▶, telefono bloccato, pagina ricaricata (rete 300 ms, orologi sfasati)", fai: async function () {
    var r = await serata(true);
    W.__ultimaSync = r;
    if (r.mancano.length) no("non arrivano al podio: " + r.mancano.join(", ") + " · " + testo(r));
    if (r.s.n < 20) no("troppe poche scritte viste da tutti (" + r.s.n + ")");
    if (r.s.max > 150) no("telefoni sfasati: " + testo(r));
    return testo(r);
  } });
})();
