// PROVE DEI TROFEI DELLA MINI ASTA (24 nov 2026, la lista del proprietario: righe «astafanta» in js/cuore/trofei.js, conti in asta.js
// contaTrofeiFanta / salvaTrofeiFanta). REGOLA ANTI-SPOILER: la giornata è già decisa prima di vederla, quindi nessun salvataggio dei
// contatori e nessun «🏆 Trofeo sbloccato!» prima del podio (prima la vecchia Mini Asta online salvava all'inizio della giornata).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-trofei.js"); await COPIONE.prova("tf1")
// Con Edge invisibile: prova.js --porta 8995 --carica preferiti/asta.js,preferiti/asta-trofei.js --prova tf1,tf2,tf3
//
// tf1 Online in 3 (Paky tiene la partita, Giulia, Luca) + Bea che guarda col link: asta veloce, la giornata intera col ⏩ (pochi momenti,
//     due gol messi apposta: SG_PROVA_SERIEA). Su NESSUN telefono un salvataggio dei contatori o un «Trofeo sbloccato!» prima che quel
//     telefono sia sul podio; sul podio UN salvataggio «astafanta» e uno «asta» per ognuno dei 3 (Bea niente), coi conti giusti (una
//     partita, la vittoria solo a chi vince, i gol di Paky); poi l'avviso; Giulia ricarica sul podio e non conta di nuovo.
// tf2 Sullo stesso telefono in 2 (profilo di Paky): la giornata col ⏩, i trofei solo sul podio, una volta sola e solo per Paky.
// tf3 La pagina dei trofei della Mini Asta come quella degli altri giochi (25 nov 2026, il proprietario: «divisi tra bronzo, argento, oro,
//     diamante, non per categorie»): sezioni per livello, un trofeo per riga col suo contatore (234 righe), niente schede a famiglie né
//     chip; il Platino «Leggenda della Mini Asta» col primo livello dei 👑 (39); coi contatori finti le righe giuste prese.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function vm(C) { return W.vmDi(C) || {}; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }
  // la spia dei salvataggi (telefoni-finti.js chiama W.__spiaProgressi e W.__statFinte: resta anche quando un telefono ricarica)
  function spia() {
    var S = { log: [], stat: {} };
    W.__statFinte = function (nome, g) { return (S.stat[nome] || {})[g] || {}; };
    W.__spiaProgressi = function (nome, a, w) {
      var gioco = a[1], st = (S.stat[nome] = S.stat[nome] || {}), s = (st[gioco] = st[gioco] || {});
      [].slice.call(a[2] || []).forEach(function (kv) { s[kv[0]] = (s[kv[0]] || 0) + kv[1]; });
      [].slice.call(a[3] || []).forEach(function (kv) { if (kv[1] > (s[kv[0]] || 0)) s[kv[0]] = kv[1]; });
      [].slice.call(a[4] || []).forEach(function (kv) { s[kv[0]] = kv[1]; });
      S.log.push({ nome: nome, gioco: gioco, podio: !!(w && w.document && w.document.querySelector(".st-gradini")), inc: JSON.stringify(a[2] || []) });
    };
    return S;
  }
  function via() { W.__spiaProgressi = null; W.__statFinte = null; }
  // la giornata corta: pochi momenti, più un gol dell'attaccante di Paky e uno di un centrocampista di Giulia
  function giornataCorta(w) {
    w.SG_PROVA_SERIEA = function (Aq, h) {
      Aq.partite.forEach(function (Pq) { Pq.ev = Pq.ev.filter(function (e) { return e.m >= 40 && e.m <= 70 && (e.t === "gol" || e.t === "occ"); }).slice(0, 1); h.rifai(Pq); });
      [["Paky", "A", 62], ["Giulia", "C", 71]].forEach(function (x) {
        var r = h.righe.filter(function (y) { return y.nome === x[0]; })[0], c = r && r.kit.filter(function (y) { return y.ruolo === x[1]; })[0]; if (!c) return;
        var Pq = Aq.partite.filter(function (y) { return y.c === c.squadra || y.f === c.squadra; })[0]; if (!Pq) return;
        Pq.ev.push({ m: x[2], t: "gol", s: Pq.c === c.squadra ? "c" : "f", chi: h.chiave(c), ass: null, v: "fuori" }); Pq.ev.sort(function (a, b) { return a.m - b.m; }); h.rifai(Pq);
      });
    };
  }
  async function telefoniOnline(nomi) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "fanta" }; giornataCorta(w); } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  async function astaVeloce(P, C) {   // (come in asta-esiti.js) se nessuno ha offerto lo prende il primo che può, poi passano gli altri
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
  // guarda i telefoni finché sono tutti sul podio: un salvataggio o un avviso prima del podio = spoiler
  async function finoAlPodio(tutti, S, guida, ms) {
    var spoiler = [], fino = Date.now() + ms;
    while (Date.now() < fino) {
      tutti.forEach(function (n) {
        var w = W.finestra(n); if (!w) return;
        if (!q(w, ".st-gradini") && q(w, ".avviso-trofeo")) spoiler.push(n + ": «" + q(w, ".avviso-trofeo").textContent.replace(/\s+/g, " ").slice(0, 60) + "» prima del podio");
      });
      S.log.forEach(function (x) { if (!x.podio && !x.visto) { x.visto = 1; spoiler.push(x.nome + ": salvati i contatori «" + x.gioco + "» prima del podio " + x.inc.slice(0, 80)); } });
      if (guida) guida();
      if (tutti.every(function (n) { var w = W.finestra(n); return w && q(w, ".st-gradini"); })) break;
      await W.dorme(150);
    }
    return spoiler;
  }
  function conta(S, nome, gioco) { return S.log.filter(function (x) { return x.nome === nome && x.gioco === gioco; }).length; }

  COPIONE.aggiungi("tf1", { nome: "Mini Asta online in 3 + Bea che guarda: i trofei solo sul podio, una volta sola, mai prima (anche ricaricando)", fai: async function () {
    var S = spia(), x = [];
    try {
      var NOMI = ["Paky", "Giulia", "Luca"], o = await telefoniOnline(NOMI), P = o.P, C = o.C;
      await W.apriTel("Bea", { hash: "gioco=astafanta&stanza=" + o.C + "&guarda=1", x: 555 });
      await astaVeloce(P, C);
      for (var i = 0; i < NOMI.length; i++) { var w = W.finestra(NOMI[i]); if (!await W.aspetta(function () { return q(w, ".st-rivela"); }, 15000)) no(NOMI[i] + ": niente classifica delle rose"); W.clicca(w, /Salta/); }
      if (!await W.aspetta(function () { return q(P, ".st-bar-vel"); }, 10000)) no("la giornata non parte");
      var bv = q(P, ".st-bar-vel"); if (bv && !bv.classList.contains("on")) bv.click();
      var sp = await finoAlPodio(NOMI.concat(["Bea"]), S, function () { var av = bott(P, ".st-pag-av", /Avanti|Mostra tutta/); if (av && !av.disabled) av.click(); }, 420000);
      if (sp.length) no("SPOILER: " + sp.slice(0, 4).join(" / "));
      if (!NOMI.every(function (n) { return q(W.finestra(n), ".st-gradini"); })) no("non sono tutti sul podio");
      x.push("fino al podio nessun salvataggio e nessun avviso su 4 telefoni");
      await W.dorme(3500);
      var cl = vm(C).classifica || [], vince = cl.filter(function (r) { return r.pos === 1; }).map(function (r) { return r.nome; });
      NOMI.forEach(function (n) {
        var a = conta(S, n, "astafanta"), b = conta(S, n, "asta"), st = (S.stat[n] || {}).astafanta || {};
        if (a !== 1) no(n + ": i trofei della Mini Asta salvati " + a + " volte (voluto 1)");
        if (b !== 1) no(n + ": le coppe dell'Asta salvate " + b + " volte (voluto 1)");
        if (st.partite !== 1) no(n + ": partite " + st.partite);
        if ((st.vinte || 0) !== (vince.indexOf(n) >= 0 ? 1 : 0)) no(n + ": vinte " + st.vinte + " (vince " + vince.join(", ") + ")");
      });
      if ((((S.stat.Paky || {}).astafanta || {}).golA || 0) < 1) no("il gol dell'attaccante di Paky non conta («Bomber di Razza»)");
      if (conta(S, "Bea", "astafanta") || conta(S, "Bea", "asta")) no("Bea guarda e prende i trofei");
      // 🦅 (tappa 2) i contatori che tiene chi tiene la partita arrivano a tutti: i d'ufficio (l'ultimo di ogni ruolo va da solo) e gli affari a 1
      var uff = 0, aff = 0; NOMI.forEach(function (n) { var st2 = (S.stat[n] || {}).astafanta || {}; uff += st2.ufficio || 0; aff += st2.affari || 0; });
      if (uff < 3) no("d'ufficio contati " + uff + " (almeno uno per ruolo)");
      x.push("d'ufficio " + uff + ", affari a 1 credito " + aff);
      x.push("sul podio un salvataggio a testa (Bea niente); vince " + vince.join(", ") + "; Paky: " + JSON.stringify((S.stat.Paky || {}).astafanta).slice(0, 160));
      var avvisi = NOMI.filter(function (n) { return q(W.finestra(n), ".avviso-trofeo"); });
      if (!await W.aspetta(function () { return NOMI.some(function (n) { return q(W.finestra(n), ".avviso-trofeo"); }); }, 6000)) no("sul podio non arriva nessun «Trofeo sbloccato!»");
      x.push("avviso sul podio: «" + q(W.finestra(NOMI.filter(function (n) { return q(W.finestra(n), ".avviso-trofeo"); })[0]), ".avviso-trofeo").textContent.replace(/\s+/g, " ").slice(0, 70) + "»");
      // Giulia ricarica sul podio: niente conti doppi
      await W.ricarica("Giulia");
      if (!await W.aspetta(function () { var g = W.finestra("Giulia"); return g && q(g, ".st-gradini"); }, 30000)) no("Giulia ricaricata non torna al podio");
      await W.dorme(3000);
      if (conta(S, "Giulia", "astafanta") !== 1) no("Giulia ricarica e i trofei si contano di nuovo (" + conta(S, "Giulia", "astafanta") + ")");
      x.push("Giulia ricarica sul podio: contati una volta sola");
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    } finally { via(); }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("tf2", { nome: "Mini Asta sullo stesso telefono in 2: i trofei solo sul podio, una volta sola, solo per chi ha il profilo", fai: async function () {
    var S = spia(), x = [];
    try {
      var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "fanta" }; giornataCorta(w); } });
      var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000); if (!tess) no("non trovo la tessera");
      tess.click(); await W.dorme(400);
      if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
      await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
      while (qa(P, ".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
      qa(P, ".sala-riga input").forEach(function (c, k) { c.value = ["Paky", "Giulia"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
      for (var k = 0; k < 10 && !q(P, ".st-stadio .sa-pers"); k++) { await W.dorme(300); var b = qa(P, ".schermata .piede button").filter(function (y) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(y.textContent) && !y.disabled; })[0]; if (b) b.click(); W.clicca(P, /Comincia l'asta/); }
      var fino = Date.now() + 200000;
      while (Date.now() < fino && !q(P, ".st-rivela")) {
        if (q(P, ".st-stadio .sa-pers") && !q(P, ".sa-aggiudicato")) {
          var capo = qa(P, ".sa-pers.guida")[0], c = capo ? capo.querySelector("b").textContent : null;
          if (!c) { var pu = q(P, ".sa-pers.puo"); if (pu) pu.click(); }
          else qa(P, ".sa-pers").forEach(function (p) { var bb = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (bb !== c && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); });
        }
        W.clicca(P, /^(Si gioca|Fatto|✅ Scambiate|Avanti)/);
        await W.dorme(250);
      }
      if (!q(P, ".st-rivela")) no("non si arriva alla classifica delle rose");
      if (S.log.length) no("salvati i contatori prima della giornata: " + JSON.stringify(S.log).slice(0, 160));
      await W.dorme(600); W.clicca(P, /Salta/);   // (le rose; nella giornata niente «Salta»)
      if (!await W.aspetta(function () { return q(P, ".st-bar-vel"); }, 10000)) no("la giornata non parte");
      var bv = q(P, ".st-bar-vel"); if (bv && !bv.classList.contains("on")) bv.click();
      var sp = await finoAlPodio(["Paky"], S, function () { var av = bott(P, ".st-pag-av", /Avanti|Mostra tutta/); if (av && !av.disabled) av.click(); }, 420000);
      if (sp.length) no("SPOILER: " + sp.slice(0, 4).join(" / "));
      if (!q(P, ".st-gradini")) no("non si arriva al podio");
      await W.dorme(3000);
      if (conta(S, "Paky", "astafanta") !== 1) no("i trofei della Mini Asta salvati " + conta(S, "Paky", "astafanta") + " volte (voluto 1)");
      var st = (S.stat.Paky || {}).astafanta || {};
      if (st.partite !== 1) no("partite " + st.partite);
      x.push("sul podio un salvataggio solo (" + JSON.stringify(st).slice(0, 140) + ")");
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    } finally { via(); }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("tf3", { nome: "La pagina dei trofei della Mini Asta come gli altri giochi: per livello, un trofeo per riga col contatore, il Platino col primo livello dei 👑", fai: async function () {
    var S = spia(), x = [];
    try {
      var P = await W.apriTel("Paky", { x: 0 });
      S.stat.Paky = { astafanta: { partite: 1, vinte: 6, golA: 3, legni: 12, fvMax: 12.5, golSqInter: 1, squadreDiverse: 5 } };
      var C = P.SGCuore; if (!C || !C.schermataSfideGioco) no("non trovo la pagina dei trofei");
      C.schermataSfideGioco("astafanta"); await W.dorme(400);
      if (qa(P, ".tr-scheda, .tr-chip, .tr-chips").length) no("ci sono ancora le schede a famiglie o i chip dei livelli");
      var righe = C.trofeiDi("astafanta"), file = qa(P, ".trofeo:not(.tl-platino)"), sez = qa(P, ".etichetta").map(function (e) { return e.textContent; });
      if (file.length !== righe.length) no("righe nella pagina " + file.length + ", trofei " + righe.length);
      if (sez.length !== 4 || !/Bronzo/.test(sez[0]) || !/Argento/.test(sez[1]) || !/Oro/.test(sez[2]) || !/Diamante/.test(sez[3])) no("le sezioni non sono i 4 livelli: " + sez.join(" | "));
      var nomi = {}; righe.forEach(function (t) { if (nomi[t.nome]) no("due righe col nome «" + t.nome + "»: l'avviso e i premi le confonderebbero"); nomi[t.nome] = 1; });
      var plat = q(P, ".trofeo.tl-platino"); if (!plat || !/Leggenda della Mini Asta/.test(plat.textContent) || !/👑/.test(plat.textContent)) no("il Platino non dice «Leggenda della Mini Asta» col 👑");
      var nPlat = righe.filter(function (t) { return t.plat; }).length, corone = file.filter(function (f) { return /👑/.test(f.querySelector(".tr-nome").textContent); }).length;
      if (corone !== nPlat) no("righe col 👑 " + corone + ", trofei del Platino " + nPlat);
      function riga(nome) { return file.filter(function (f) { return f.querySelector(".tr-nome").textContent.replace(/[👑✓]/g, "").trim() === nome; })[0] || null; }
      function num(nome) { var r = riga(nome); return r ? r.querySelector(".tr-num").textContent : "(non c'è)"; }
      if (!riga("Re della Serata II") || !riga("Re della Serata II").classList.contains("fatto") || num("Re della Serata II") !== "5 / 5") no("«Re della Serata II» con 6 vittorie: " + num("Re della Serata II"));
      if (num("Re della Serata III") !== "6 / 15" || riga("Re della Serata III").classList.contains("fatto")) no("«Re della Serata III»: " + num("Re della Serata III"));
      if (!/Vinci 15 Mini Aste/.test(riga("Re della Serata III").textContent)) no("la descrizione di «Re della Serata III» non dice la soglia");
      if (num("Fantavoto Alieno III") !== "12,5 / 14") no("«Fantavoto Alieno III» col record 12,5: " + num("Fantavoto Alieno III"));
      var bisc = riga("Il Morso del Biscione"); if (!bisc || !bisc.classList.contains("fatto") || !/🐍/.test(bisc.querySelector(".tr-ico").textContent)) no("«Il Morso del Biscione» (gol con l'Inter) non è preso con la sua icona");
      if (!/🔒/.test(riga("Il Toro Carica").querySelector(".tr-ico").textContent)) no("un trofeo non preso non ha il lucchetto");
      var tagli = file.filter(function (s) { return s.scrollWidth > s.clientWidth + 2; }).length; if (tagli) no(tagli + " righe escono di lato");
      x.push(file.length + " trofei in " + sez.join(", ") + " · 👑 " + corone + " · Platino " + q(P, ".trofeo.tl-platino .tr-num").textContent);
    } finally { via(); }
    return x.join(" · ");
  } });
})();
