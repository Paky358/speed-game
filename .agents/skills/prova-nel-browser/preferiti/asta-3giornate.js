// PROVE DELLE «🏆 3 GIORNATE» DELLA MINI ASTA FANTACALCIO (30 ott 2026, deciso dal proprietario): le stesse rose giocano tre giornate
// di Serie A finta di fila; le prime due veloci (gli highlights, poi la classifica coi punti sommati e «Avanti ▶» di chi tiene la
// partita), la terza intera coi quadretti che partono dai punti delle prime due; vince chi fa più fantapunti sommati.
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-3giornate.js");
// await COPIONE.prova("tg1")   (preferiti/asta.js serve per la spia che mette le regole della partita: w.__imp)
// Con Edge invisibile: prova.js --porta 8984 --carica preferiti/asta.js,preferiti/asta-3giornate.js --prova tg1,tg2,tg3 --timeout 1500
//
// tg0 Senza telefoni: nel ⚙️ «🏆 Quante giornate» (di base 1, si ricorda riaprendo, sparisce col «No» alla giornata), il riassunto e le regole.
// tg1 Online in 3 (Paky tiene la partita, Giulia e Luca), rete a 300 ms, orologi sfasati, 3 giornate fino al podio: Paky tocca ⏩ e,
//     ogni tanto, «Avanti ▶» e «Mostra tutta ▶». Nella foto 2 giornate veloci + la terza; il totale di ognuno è la somma delle tre,
//     la classifica va per totale e il primo ha il totale più alto; su tutti i telefoni le due classifiche («dopo 1 giornata», «dopo
//     2 giornate»), all'inizio della 3ª i quadretti con i punti delle prime due (+ 6 a calciatore), sul podio il totale del vincitore,
//     il «💥 ribaltone» alla fine solo se il primo è cambiato. Scarto tra i telefoni sotto i 150 ms. Dice quanto dura ogni giornata.
// tg2 Stesso telefono in 3 con 3 giornate fino al podio (Paky tocca ⏩ e gli «Avanti ▶»): le due classifiche, la riga
//     «1ª … + 2ª … + 3ª … = …» sotto le pagelle finali, il podio, i titoli e la classifica finale coi totali giusti e in ordine;
//     la classifica dopo una giornata e le pagelle stanno nello schermo a 360x640.
// tg3 Online in 3, rete a 300 ms: Giulia ricarica la pagina a metà della seconda giornata; torna allo stesso punto, resta
//     allineata con gli altri (scarto sotto i 150 ms, fuori dai 3 secondi dopo il ritorno) e arriva al podio con tutti.
// tg4 Online in 3, rete a 300 ms: Paky (chi tiene la partita) si spegne a metà della seconda giornata e non torna: Giulia la porta
//     avanti (la 2ª, la classifica, la 3ª) e lei e Luca restano allineati fino al podio.
// tg5 Online in 3, rete a 300 ms: Paky (chi tiene la partita) ricarica la pagina a metà della seconda giornata; la partita riprende
//     dallo stesso punto e tutti arrivano al podio allineati.
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
  function num(x) { return String(Math.round(x * 2) / 2).replace(".", ","); }
  var OROLOGI = { Paky: 0, Giulia: 3200, Luca: -1800 };
  var IMP = { formato: "fanta", giornate: 3 };

  // ⏱️ la spia (come in asta-sync.js): ogni scritta nuova sul campo o in cima alle pagelle, col tempo vero della pagina delle prove
  function spia(nome, LOG) {
    var w = W.finestra(nome); if (!w || !w.document || !w.document.body) return;
    if (w.__spiaSync) w.__spiaSync.disconnect();
    var conta = {}, ultimo = { m: "", p: "" };
    LOG.forEach(function (e) { if (e.nome === nome) { var b = e.k.replace(/#d+$/, ""); conta[b] = (conta[b] || 0) + 1; } });   // (dopo una ricarica si continua a contare: la stessa scritta vista prima resta la «#1»)
    function guarda() {
      var m = q(w, ".st-msg.on"), p = q(w, ".st-pag.on:not(.live) .st-pag-tit"), mt = m ? m.textContent : "", pt = p ? p.textContent.replace(/ · \d+\/\d+$/, "") : "";
      var min = q(w, ".st-bar-min"), inf = q(w, ".sa-info"), mm = (min ? min.textContent : "") + "|" + (inf ? inf.textContent : "");   // (col minuto e la giornata: la stessa scritta in giornate diverse sono due scritte)
      [["m", mt], ["p", pt]].forEach(function (x) {
        if (x[1] === ultimo[x[0]]) return; ultimo[x[0]] = x[1]; if (!x[1]) return;
        var k = x[0] + ":" + x[1] + "@" + mm; conta[k] = (conta[k] || 0) + 1;
        LOG.push({ nome: nome, k: k + "#" + conta[k], t: performance.now() });
      });
    }
    w.__spiaSync = new w.MutationObserver(guarda);
    w.__spiaSync.observe(w.document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"], characterData: true });
  }
  function scarti(LOG, nomi, fuori) {
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
  function testo(s) { return "scritte viste da tutti " + s.n + ": scarto tipico " + s.mediana + " ms, 9 su 10 entro " + s.p90 + " ms, il più grande " + s.max + " ms" + (s.peggio ? " (" + s.peggio.k + ": " + s.peggio.t + ")" : ""); }
  async function telefoni(nomi) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = IMP; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
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
  // i conti della foto: 2 giornate veloci + la terza, il totale = la somma, la classifica per totale
  function contiFoto(F) {
    var S = F.serieA || {}, cl = F.classifica || [];
    if (!S.prima || S.prima.length !== 2 || !S.partite) no("nella foto non ci sono 3 giornate (prima: " + (S.prima ? S.prima.length : "niente") + ")");
    if (S.prima.some(function (g) { return !g.partite || g.partite.length !== 10; })) no("le giornate veloci non hanno 10 partite");
    var sq = function (A) { return A.partite.map(function (P) { return P.c + "-" + P.f; }).join(","); };
    if (sq(S.prima[0]) === sq(S.prima[1]) && sq(S.prima[1]) === sq(S)) no("le tre giornate hanno le stesse partite: niente sorteggio nuovo");
    cl.forEach(function (r) {
      if (!r.prima || r.prima.length !== 2) no("la rosa di " + r.nome + " non ha le prime due giornate");
      var s = r.prima[0].punti + r.prima[1].punti + r.gio.punti;
      if (Math.abs(s - r.tot) > 1e-9) no(r.nome + ": totale " + r.tot + " ma le giornate fanno " + s);
    });
    for (var i = 1; i < cl.length; i++) if (cl[i - 1].tot < cl[i].tot) no("la classifica non va per totale: " + cl.map(function (r) { return r.nome + " " + r.tot; }).join(", "));
    var max = Math.max.apply(null, cl.map(function (r) { return r.tot; }));
    if (cl[0].pos !== 1 || cl[0].tot !== max) no("il primo non ha il totale più alto");
    var dopo2 = cl.slice().sort(function (a, b) { return (b.prima[0].punti + b.prima[1].punti - a.prima[0].punti - a.prima[1].punti) || (b.totale - a.totale) || (b.crediti - a.crediti); });
    var p2 = dopo2[0], solo2 = dopo2.length < 2 || (dopo2[1].prima[0].punti + dopo2[1].prima[1].punti !== p2.prima[0].punti + p2.prima[1].punti || dopo2[1].totale !== p2.totale || dopo2[1].crediti !== p2.crediti);
    var soloW = cl.length < 2 || cl[1].pos > 1;
    return { cl: cl, primoDopo2: solo2 ? p2 : null, vince: cl[0], ribaltone: !!(solo2 && soloW && p2.id !== cl[0].id),
      riga: cl.map(function (r) { return r.pos + "° " + r.nome + " " + num(r.tot) + " (" + [r.prima[0].punti, r.prima[1].punti, r.gio.punti].map(num).join("+") + ")"; }).join(", ") };
  }
  // la partita dopo l'asta, guardata da tutti: Paky tocca ⏩ e gli «Avanti ▶»; opz.durante(stato) per la ricarica o lo spegnimento
  async function finoAlPodio(nomi, LOG, capo, opz) {
    opz = opz || {};
    var fino = Date.now() + 900000, fatto = {}, stato = { tornati: {} };
    while (Date.now() < fino) {
      var vivi = nomi.filter(function (n) { return !(opz.morti || {})[n]; });
      if (vivi.every(function (n) { var w = W.finestra(n); return w && q(w, ".st-gradini"); })) break;
      var guida = W.finestra(stato.capo || capo);
      if (guida) {
        var bv = q(guida, ".st-bar-vel");
        if (!fatto.vel && bv && visibile(bv) && !bv.classList.contains("on") && !opz.lento) { fatto.vel = 1; bv.click(); }
        var av = bott(guida, ".st-pag-av", /Avanti|Mostra tutta/); if (av && !av.disabled && Math.random() < 0.3) av.click();
      }
      if (opz.durante) await opz.durante(stato);
      await W.dorme(200);
    }
    return stato;
  }
  // le scritte delle 3 giornate viste da un telefono: inizio, fine e classifiche, coi tempi
  function tappe(LOG, nome) {
    var t = {}, l = LOG.filter(function (e) { return e.nome === nome; });
    function primo(re) { var x = l.filter(function (e) { return re.test(e.k); })[0]; return x ? x.t : null; }
    t.g1 = primo(/1ª GIORNATA · HIGHLIGHTS/); t.f1 = primo(/FINE DELLA 1ª GIORNATA/); t.c1 = primo(/classifica dopo 1 giornata/);
    t.g2 = primo(/2ª GIORNATA · HIGHLIGHTS/); t.f2 = primo(/FINE DELLA 2ª GIORNATA/); t.c2 = primo(/classifica dopo 2 giornate/);
    t.g3 = primo(/3ª GIORNATA: SI DECIDE/); t.fis = primo(/FISCHIO FINALE|RIBALTONE!/); t.vince = primo(/VINCE!|PARI MERITO/);
    t.rose = l.length ? l[0].t : null;
    return t;
  }
  function durate(t) {
    function s(a, b) { return a != null && b != null ? Math.round((b - a) / 1000) + " s" : "?"; }
    return "1ª giornata " + s(t.g1, t.f1) + ", classifica " + s(t.c1, t.g2) + ", 2ª " + s(t.g2, t.f2) + ", classifica " + s(t.c2, t.g3) + ", 3ª fino al fischio " + s(t.g3, t.fis) + ", pagelle fino al vincitore " + s(t.fis, t.vince);
  }
  // all'inizio della 3ª: i quadretti con i punti delle prime due + 6 a calciatore
  function quadrettiG3(w, cl) {
    var x = qa(w, ".st-gio-riga").map(function (n) { return { nome: n.querySelector(".st-gio-nome").textContent, pt: n.querySelector(".st-gio-pt").textContent }; });
    var male = [];
    cl.forEach(function (r) { var y = x.filter(function (z) { return z.nome === r.nome; })[0], atteso = num(r.prima[0].punti + r.prima[1].punti + 6 * r.kit.length); if (!y || y.pt !== atteso) male.push(r.nome + " «" + (y && y.pt) + "» invece di «" + atteso + "»"); });
    return male;
  }

  async function serataTre(o) {
    var NOMI = ["Paky", "Giulia", "Luca"], vecchio = W.BR.ritardo, LOG = [], x = [];
    try {
      W.BR.ritardo = 300;
      var tt = await telefoni(NOMI), P = tt.P, C = tt.C;
      await astaVeloce(P, C);
      NOMI.forEach(function (n) { spia(n, LOG); });
      var F = vm(C), conti = contiFoto(F), g3visto = {};
      x.push("classifica: " + conti.riga);
      var st = await finoAlPodio(NOMI, LOG, "Paky", { morti: o.morti, durante: async function (s) {
        // i quadretti all'inizio della 3ª (appena compare l'annuncio, su ogni telefono)
        NOMI.forEach(function (n) { var w = W.finestra(n); if (!w || g3visto[n] || (o.morti || {})[n]) return; var m = q(w, ".st-msg.on"); if (m && /3ª GIORNATA: SI DECIDE/.test(m.textContent)) { g3visto[n] = quadrettiG3(w, conti.cl); } });
        if (o.durante) await o.durante(s, P, C, LOG);
      } });
      return { LOG: LOG, x: x, conti: conti, g3visto: g3visto, st: st, C: C, NOMI: NOMI };
    } finally { W.BR.ritardo = vecchio; }
  }
  function controllaFine(r, nomi) {
    var cl = r.conti.cl, w0 = r.conti.vince, primi = cl.filter(function (z) { return z.pos === 1; });
    nomi.forEach(function (n) {
      var w = W.finestra(n); if (!w || !q(w, ".st-gradini")) no(n + " non arriva al podio");
      var pr = (q(w, ".st-prezzo b") || {}).textContent;
      if (pr !== num(w0.tot)) no("sul podio di " + n + " il punteggio del vincitore è «" + pr + "» invece del totale " + num(w0.tot));
      var g1 = q(w, ".st-gradino.p1 small"); if (!g1 || g1.textContent !== num(w0.tot) + " punti") no("sul gradino del primo di " + n + ": «" + (g1 && g1.textContent) + "»");
      var g3 = q(w, ".st-gradino.p1 small.g3"); if (!g3 || g3.textContent !== [w0.prima[0].punti, w0.prima[1].punti, w0.gio.punti].map(num).join(" · ")) no("sul gradino del primo di " + n + " mancano le 3 giornate: «" + (g3 && g3.textContent) + "»");
      var l = r.LOG.filter(function (e) { return e.nome === n; });
      ["classifica dopo 1 giornata", "classifica dopo 2 giornate"].forEach(function (s) { if (!l.some(function (e) { return e.k.indexOf(s) >= 0; })) no(n + " non ha visto «" + s + "»"); });
      var fin = l.filter(function (e) { return /VINCE!|PARI MERITO/.test(e.k); })[0];
      if (fin) {
        if (primi.length === 1 && fin.k.indexOf(w0.nome.toUpperCase() + " VINCE!") < 0) no(n + ": alla fine «" + fin.k + "» ma vince " + w0.nome);
        if (fin.k.indexOf(num(w0.tot) + " fantapunti in 3 giornate") < 0) no(n + ": alla fine «" + fin.k + "» senza il totale " + num(w0.tot));
        if (r.conti.ribaltone !== /ribaltone: dopo 2 giornate comandava/.test(fin.k)) no(n + ": il ribaltone finale " + (r.conti.ribaltone ? "manca" : "c'è ma non doveva") + " («" + fin.k + "»)");
      }
    });
  }

  COPIONE.aggiungi("tg1", { nome: "Mini Asta Fantacalcio online in 3 con 🏆 3 giornate: totali, classifiche dopo 1 e 2 giornate, quadretti della 3ª, podio, telefoni allineati (rete 300 ms, orologi sfasati)", fai: async function () {
    var r = await serataTre({});
    controllaFine(r, r.NOMI);
    Object.keys(r.g3visto).forEach(function (n) { if (r.g3visto[n].length) no("all'inizio della 3ª su " + n + ": " + r.g3visto[n].join(", ")); });
    if (Object.keys(r.g3visto).length < 3) no("l'inizio della 3ª giornata non si è visto su tutti (" + Object.keys(r.g3visto).join(", ") + ")");
    var s = scarti(r.LOG, r.NOMI);
    W.__ultima3g = r;
    if (s.n < 30) no("troppe poche scritte viste da tutti (" + s.n + ")");
    if (s.max > 150) no("telefoni sfasati: " + testo(s));
    var rb = r.LOG.filter(function (e) { return e.nome === "Paky" && /RIBALTONE!/.test(e.k); }).length;
    return r.x.concat(["Paky: " + durate(tappe(r.LOG, "Paky")) + " (col ⏩)", "ribaltone al fischio: " + (rb ? "sì" : "no") + ", alla fine: " + (r.conti.ribaltone ? "sì" : "no"), testo(s)]).join(" · ");
  } });

  COPIONE.aggiungi("tg3", { nome: "Mini Asta Fantacalcio online in 3 con 🏆 3 giornate: Giulia ricarica a metà della 2ª giornata, torna allo stesso punto e resta allineata fino al podio", fai: async function () {
    var ric = null;
    var r = await serataTre({ durante: async function (s, P, C, LOG) {
      if (s.ric) return;
      var l = LOG.filter(function (e) { return e.nome === "Paky"; }), i2 = -1;
      l.forEach(function (e, i) { if (i2 < 0 && /2ª GIORNATA · HIGHLIGHTS/.test(e.k)) i2 = i; });
      if (i2 < 0 || l.length - i2 < 6) return;   // (qualche momento dentro la 2ª)
      s.ric = 1; var prima = l[l.length - 1].k;
      await W.ricarica("Giulia"); s.tornati.Giulia = performance.now();
      await W.aspetta(function () { var w = W.finestra("Giulia"); return w && q(w, ".st-rivela"); }, 15000); spia("Giulia", LOG);
      // torna allo stesso punto: entro 6 s Giulia mostra la scritta che Paky mostra adesso (o la prossima)
      var ok = await W.aspetta(function () { var w = W.finestra("Giulia"), m = w && q(w, ".st-msg.on"), mp = q(P, ".st-msg.on"); return m && mp && m.textContent && m.textContent === mp.textContent && m.textContent; }, 12000);
      ric = { prima: prima, dopo: ok };
    } });
    if (!ric) no("Giulia non ha ricaricato a metà della 2ª giornata");
    if (!ric.dopo) no("dopo la ricarica Giulia non torna alla stessa scritta di Paky");
    controllaFine(r, r.NOMI);
    var t0 = r.st.tornati.Giulia, fuori = function (n, t) { return n === "Giulia" && t > t0 - 500 && t < t0 + 3000; };
    var s = scarti(r.LOG, r.NOMI, fuori), dopoRic = scarti(r.LOG.filter(function (e) { return e.t > t0 + 3000; }), r.NOMI);
    if (dopoRic.n < 10) no("troppe poche scritte viste da tutti dopo la ricarica (" + dopoRic.n + ")");
    if (s.max > 150) no("telefoni sfasati: " + testo(s));
    return "Giulia ricarica su «" + ric.prima.replace(/#\d+$/, "") + "» e ritrova «" + ric.dopo + "» · " + r.x.join(" · ") + " · dopo la ricarica: " + testo(dopoRic) + " · tutta la serata: " + testo(s);
  } });

  // tg5: chi tiene la partita (Paky) ricarica la pagina a metà della 2ª giornata: la partita riprende dallo stesso punto (anche le
  // classifiche già passate restano passate) e tutti restano allineati fino al podio
  COPIONE.aggiungi("tg5", { nome: "Mini Asta Fantacalcio online in 3 con 🏆 3 giornate: chi tiene la partita ricarica a metà della 2ª, riprende dallo stesso punto e tutti arrivano al podio allineati", fai: async function () {
    var ric = null;
    var r = await serataTre({ durante: async function (s, P, C, LOG) {
      if (s.ric) return;
      var l = LOG.filter(function (e) { return e.nome === "Luca"; }), i2 = -1;
      l.forEach(function (e, i) { if (i2 < 0 && /2ª GIORNATA · HIGHLIGHTS/.test(e.k)) i2 = i; });
      if (i2 < 0 || l.length - i2 < 5) return;
      s.ric = 1; var prima = l[l.length - 1].k;
      await W.ricarica("Paky"); s.tornati.Paky = performance.now();
      if (!await W.aspetta(function () { var w = W.finestra("Paky"); return w && q(w, ".st-rivela"); }, 20000)) no("dopo la ricarica Paky non torna alla giornata");
      spia("Paky", LOG);
      var L = W.finestra("Luca");
      var ok = await W.aspetta(function () { var w = W.finestra("Paky"), m = w && q(w, ".st-msg.on"), ml = q(L, ".st-msg.on"); return m && ml && m.textContent && m.textContent === ml.textContent && m.textContent; }, 15000);
      ric = { prima: prima, dopo: ok };
    } });
    if (!ric) no("Paky non ha ricaricato a metà della 2ª giornata");
    if (!ric.dopo) no("dopo la ricarica Paky non torna alla stessa scritta di Luca");
    controllaFine(r, r.NOMI);
    var t0 = r.st.tornati.Paky, fuori = function (n, t) { return t > t0 - 500 && t < t0 + 3000; };
    var s = scarti(r.LOG, r.NOMI, fuori), dopoRic = scarti(r.LOG.filter(function (e) { return e.t > t0 + 3000; }), r.NOMI);
    if (dopoRic.n < 10) no("troppe poche scritte viste da tutti dopo la ricarica (" + dopoRic.n + ")");
    if (s.max > 150) no("telefoni sfasati: " + testo(s));
    return "Paky ricarica su «" + ric.prima.replace(/#\d+$/, "") + "» e ritrova «" + ric.dopo + "» · " + r.x.join(" · ") + " · dopo la ricarica: " + testo(dopoRic) + " · tutta la serata: " + testo(s);
  } });

  COPIONE.aggiungi("tg4", { nome: "Mini Asta Fantacalcio online in 3 con 🏆 3 giornate: chi la tiene si spegne a metà della 2ª, Giulia la porta avanti fino al podio con Luca allineato", fai: async function () {
    var morti = {}, note = [], t0 = null, tDopo = null;
    var r = await serataTre({ morti: morti, durante: async function (s, P, C, LOG) {
      if (s.morto) return;
      var l = LOG.filter(function (e) { return e.nome === "Paky"; }), i2 = -1;
      l.forEach(function (e, i) { if (i2 < 0 && /2ª GIORNATA · HIGHLIGHTS/.test(e.k)) i2 = i; });
      if (i2 < 0 || l.length - i2 < 5) return;
      s.morto = 1; await W.dorme(1600);   // (la copia ai vice: al massimo una al secondo)
      morti.Paky = 1; t0 = Date.now(); A.muore("Paky");
      var idG = A.mioId("Giulia");
      if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idG; }, 10000)) no("dopo 10 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
      note.push("Giulia tiene la partita in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
      s.capo = "Giulia";
      tDopo = performance.now() + 4000;   // (da 4 s dopo il cambio si contano gli scarti tra Giulia e Luca)
    } });
    if (!t0) no("Paky non si è spento a metà della 2ª giornata");
    controllaFine(r, ["Giulia", "Luca"]);
    var s = scarti(r.LOG.filter(function (e) { return e.t > tDopo; }), ["Giulia", "Luca"]);
    if (s.n < 8) no("troppe poche scritte viste da Giulia e Luca dopo il cambio (" + s.n + ")");
    if (s.max > 150) no("Giulia e Luca sfasati: " + testo(s));
    return note.join("; ") + " · " + r.x.join(" · ") + " · dopo il cambio: " + testo(s);
  } });

  // ===================================================================== tg0 (senza telefoni): ⚙️, riassunto e regole
  var mk = function (tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k === "class") e.className = a[k]; else if (k === "style") e.style.cssText = a[k]; else if (k === "onclick") e.onclick = a[k]; else if (k === "hidden") e.hidden = true; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (f) { if (f) e.appendChild(f); }); return e; };
  function chipBox(box, re) { return [].find.call(box.querySelectorAll(".modo-chip"), function (b) { return re.test(b.textContent); }); }
  function nascosto(e) { for (; e; e = e.parentNode) if (e.hidden) return true; return false; }
  COPIONE.aggiungi("tg0", { nome: "Mini Asta Fantacalcio, ⚙️ «🏆 Quante giornate»: di base 1, si ricorda, sparisce senza la giornata; riassunto e regole", fai: async function () {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), g = {};
    new Function("SG", src)({ registra: function (x) { if (x.id === "astafanta") Object.assign(g, x); }, bot: W.SG && SG.bot });
    var r1 = g.riassunto({ formato: "fanta" }), r3 = g.riassunto({ formato: "fanta", giornate: 3 }), rNo = g.riassunto({ formato: "fanta", giornata: false, giornate: 3 });
    if (!/poi la giornata ⚽$/.test(r1) || !/poi 🏆 3 giornate ⚽$/.test(r3) || !/vince la rosa che vale di più$/.test(rNo)) no("riassunti: «" + r1 + "» / «" + r3 + "» / «" + rNo + "»");
    if (!/🏆 3 giornate<\/b> \(si sceglie nel ⚙️\)/.test(g.regole.join(" "))) no("le regole non parlano delle 3 giornate");
    var box = document.createElement("div"), dove = {};
    g.impostazioni(box, dove, { el: mk, modo: "online" });
    if (dove.giornate !== 1 || !/attiva/.test(chipBox(box, /1 giornata/).className) || /attiva/.test(chipBox(box, /3 giornate/).className)) no("di base non è «1 giornata»: " + dove.giornate);
    if (nascosto(chipBox(box, /3 giornate/))) no("con la giornata accesa «🏆 Quante giornate» non si vede");
    chipBox(box, /3 giornate/).click(); if (dove.giornate !== 3 || !/attiva/.test(chipBox(box, /3 giornate/).className)) no("«🏆 3 giornate» non si accende");
    var bNo = [].find.call(box.querySelectorAll(".modo-chip"), function (b) { return /Vince la rosa che vale di più/.test(b.textContent); });
    bNo.click(); if (!nascosto(chipBox(box, /3 giornate/))) no("senza la giornata «🏆 Quante giornate» si vede ancora");
    var bSi = [].find.call(box.querySelectorAll(".modo-chip"), function (b) { return /Vince chi fa più fantapunti/.test(b.textContent); }); bSi.click();
    var box2 = document.createElement("div"); g.impostazioni(box2, dove, { el: mk, modo: "online" });
    if (dove.giornate !== 3 || !/attiva/.test(chipBox(box2, /3 giornate/).className)) no("riaprendo il ⚙️ torna «1 giornata»");
    return "«" + r3 + "» · di base 1 giornata, «🏆 3 giornate» si accende e si ricorda, sparisce col «No»";
  } });

  // ===================================================================== tg2 (stesso telefono)
  function dentroSchermo(w, sels) {
    var d = w.document, x = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) x.push("la pagina scorre (" + d.scrollingElement.scrollHeight + ")");
    sels.forEach(function (s) {
      var e = d.querySelector(s); if (!e) { x.push("manca " + s); return; }
      var r = e.getBoundingClientRect();
      if (r.width <= 0 || r.left < -1 || r.top < -1 || r.right > w.innerWidth + 1 || r.bottom > w.innerHeight + 1) x.push(s + " fuori schermo (" + Math.round(r.top) + "-" + Math.round(r.bottom) + " su " + w.innerHeight + ")");
    });
    return x.join(", ");
  }
  function righeTaglate(w, sel) {   // le righe della classifica (o della pagella) devono avere la loro altezza minima, e stare dentro il riquadro
    var box = q(w, ".st-pag.on"); if (!box) return "niente riquadro";
    var rb = box.getBoundingClientRect(), out = [];
    qa(w, sel).forEach(function (r) { var b = r.getBoundingClientRect(); if (b.height < 20 || b.bottom > rb.bottom + 1) out.push(Math.round(b.height) + "px fino a " + Math.round(b.bottom) + " (riquadro fino a " + Math.round(rb.bottom) + ")"); });
    return out.join(", ");
  }
  COPIONE.aggiungi("tg2", { nome: "Mini Asta Fantacalcio sullo stesso telefono in 3 con 🏆 3 giornate fino al podio: classifiche, riga delle 3 giornate sotto le pagelle, totali, schermo 360x640", fai: async function (opz) {
    var NOMI = ["Paky", "Giulia", "Luca"], x = [], misure = [], lento = !!(opz && opz.lento), pAv = lento ? 0.06 : 0.3;   // (lento: niente ⏩ e «Avanti ▶» dopo qualche secondo, per misurare quanto dura davvero)
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = IMP; } });
    var f = document.getElementById("tel-Paky"); f.style.width = "360px"; f.style.height = "640px"; P.dispatchEvent(new P.Event("resize"));
    var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000);
    if (!tess) no("non trovo la tessera della Mini Asta Fantacalcio");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < NOMI.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = NOMI[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 8 && !P.__t; k++) {
      await W.dorme(300); if (P.__t) break;
      var b0 = qa(P, ".schermata .piede button").filter(function (y) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(y.textContent) && !y.disabled; })[0]; if (b0) b0.click();
    }
    if (!await W.aspetta(function () { return P.__t; }, 3000)) no("la Mini Asta non parte");
    if (!await W.aspetta(function () { return /3 giornate/.test(A.T(P)) || q(P, ".st-stadio .sa-pers"); }, 5000)) no("nella presentazione non si parla delle 3 giornate");
    if (!/si giocano 3 giornate/.test(A.T(P))) no("la presentazione non dice delle 3 giornate («" + A.T(P).slice(0, 120) + "»)");
    var ok0 = await W.aspetta(function () { if (q(P, ".st-stadio .sa-pers")) return true; W.clicca(P, /Comincia l'asta/); return false; }, 8000);
    if (!ok0) no("non arrivo allo stadio");
    var fino = Date.now() + 240000;
    while (Date.now() < fino && !q(P, ".st-rivela")) {
      if (q(P, ".st-stadio .sa-pers") && !q(P, ".sa-aggiudicato")) {
        var pg = qa(P, ".sa-pers.guida")[0], capo = pg && pg.querySelector("b") ? pg.querySelector("b").textContent : null;
        if (!capo) { var pu = q(P, ".sa-pers.puo"); if (pu) pu.click(); }
        else qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== capo && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); });
      }
      await W.dorme(250);
    }
    if (!q(P, ".st-rivela")) no("il fanta non arriva alla classifica delle rose");
    var LOG = []; spia("Paky", LOG);
    var t0 = performance.now(), fatto = {}, righeG3 = [], fino2 = Date.now() + 900000;
    while (Date.now() < fino2 && !q(P, ".st-gradini")) {
      var bv = q(P, ".st-bar-vel"); if (!lento && !fatto.vel && bv && visibile(bv)) { fatto.vel = 1; if (!bv.classList.contains("on")) bv.click(); }
      var cl3 = q(P, ".st-pag.on.st-cl3");
      if (cl3 && !fatto["cl" + cl3.textContent.slice(0, 40)]) {
        fatto["cl" + cl3.textContent.slice(0, 40)] = 1;
        var e1 = dentroSchermo(P, [".st-pag.on.st-cl3", ".st-pag.on .st-pag-av"]), e2 = righeTaglate(P, ".st-cl3-r");
        if (e1 || e2) misure.push("classifica: " + e1 + " " + e2);
        x.push((cl3.querySelector(".st-pag-tit") || {}).textContent + ": " + [].slice.call(cl3.querySelectorAll(".st-cl3-r")).map(function (r) { return r.textContent.replace(/\s+/g, " ").trim(); }).join(" | "));
      }
      var g3 = q(P, ".st-pag.on .st-pag-g3");
      if (g3 && righeG3.indexOf(g3.textContent) < 0) {
        righeG3.push(g3.textContent);
        var nome = (q(P, ".st-pag.on .st-pf-testa span") || {}).textContent, parti = g3.textContent.match(/1ª ([\d,]+) \+ 2ª ([\d,]+) \+ 3ª ([\d,]+)= ([\d,]+)/);
        if (!parti) no("la riga delle 3 giornate sotto la pagella di " + nome + " è strana: «" + g3.textContent + "»");
        var somma = [1, 2, 3].reduce(function (s, i) { return s + parseFloat(parti[i].replace(",", ".")); }, 0);
        if (Math.abs(somma - parseFloat(parti[4].replace(",", "."))) > 1e-9) no("sotto la pagella di " + nome + " la somma non torna: «" + g3.textContent + "»");
        var tot3 = (q(P, ".st-pag.on .st-pf-tot") || {}).textContent;
        if (tot3 !== parti[3]) no("la pagella di " + nome + " dice " + tot3 + " ma la 3ª giornata nella riga è " + parti[3]);
        var e3 = dentroSchermo(P, [".st-pag.on .st-pag-g3", ".st-pag.on .st-pag-av"]); if (e3) misure.push("pagella: " + e3);
      }
      var av = bott(P, ".st-pag-av", /Avanti|Mostra tutta/); if (av && !av.disabled && Math.random() < pAv) av.click();
      await W.dorme(200);
    }
    if (!q(P, ".st-gradini")) no("non arriva al podio");
    var tutto = Math.round((performance.now() - t0) / 1000);
    if (misure.length) no("misure a 360x640: " + misure.join(" / "));
    if (righeG3.length !== 3) no("le righe delle 3 giornate sotto le pagelle sono " + righeG3.length + " (volute 3)");
    if (x.filter(function (s) { return /classifica dopo/.test(s); }).length !== 2) no("le classifiche dopo le giornate veloci sono " + x.length + ": " + x.join(" / "));
    var dur = durate(tappe(LOG, "Paky"));
    // il podio, poi i titoli (coi totali e le giornate) e la classifica finale
    var tot1 = (q(P, ".st-prezzo b") || {}).textContent, nome1 = (q(P, ".st-gradino.p1 b") || {}).textContent;
    var dm = dentroSchermo(P, [".st-gradini", ".st-piede .btn"]); if (dm) no("il podio a 360x640: " + dm);
    var avP = bott(P, ".st-piede .btn", /Avanti/); if (!avP) no("sul podio non c'è «Avanti ▶»"); avP.click(); await W.dorme(400);
    if (!/I titoli della serata/.test(A.T(P))) no("dopo il podio non ci sono i titoli");
    var kit = qa(P, ".as-kits .nm, .as-kits b").map(function (b) { return b.textContent; }).filter(function (t) { return /fantapunti/.test(t); });
    if (kit.length !== 3) kit = (A.T(P).match(/\d° [^·]+ · [\d,]+ fantapunti \([^)]*\)/g) || []);
    if (kit.length !== 3) no("nei titoli le rose coi totali sono " + kit.length + ": «" + A.T(P).slice(0, 200) + "»");
    var tots = kit.map(function (s) { var m = s.match(/([\d,]+) fantapunti \(([\d,]+) \+ ([\d,]+) \+ ([\d,]+)\)/); if (!m) no("riga dei titoli strana: «" + s + "»"); var v = m.slice(1).map(function (z) { return parseFloat(z.replace(",", ".")); }); if (Math.abs(v[1] + v[2] + v[3] - v[0]) > 1e-9) no("nei titoli la somma non torna: «" + s + "»"); return v[0]; });
    for (var i = 1; i < tots.length; i++) if (tots[i - 1] < tots[i]) no("nei titoli le rose non sono in ordine di totale: " + kit.join(" | "));
    if (num(tots[0]) !== tot1) no("sul podio il vincitore ha " + tot1 + " ma nei titoli il primo ha " + num(tots[0]));
    W.clicca(P, /Classifica finale/); await W.dorme(400);
    var li = qa(P, ".classifica li").map(function (l) { return l.textContent.replace(/\s+/g, " ").trim(); });
    if (li.length !== 3 || !li.every(function (l) { return /fantapunti in 3 giornate/.test(l); })) no("la classifica finale: " + JSON.stringify(li));
    return "Paky (" + (lento ? "senza ⏩, «Avanti ▶» dopo qualche secondo" : "col ⏩") + ", dalle rose al podio " + tutto + " s): " + dur + " · " + x.join(" · ") + " · sotto le pagelle: " + righeG3.join(" | ") + " · podio: " + nome1 + " " + tot1 + " · classifica: " + li.join(" | ");
  } });
})();
