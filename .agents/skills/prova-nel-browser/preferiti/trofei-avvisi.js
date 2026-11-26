// PROVE DEGLI AVVISI DEI TROFEI (26 nov 2026, il proprietario dopo la prima Mini Asta vinta: «sono stato almeno 20 secondi a toglierli
// tutti»). Regola per TUTTI i giochi (js/cuore/trofei.js, accodaTrofei): al massimo 3 avvisi «🏆 Trofeo … sbloccato!» di fila, i più
// importanti (prima il livello più alto; il Platino per ultimo), poi UN avviso «Hai sbloccato altri trofei» col «+N»; i premi per tutti.
// Il «+N» toccato apre la pagina dei trofei solo fuori dalle partite (schermate col menu sotto), a partita in corso si chiude e basta.
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/trofei-avvisi.js"); await COPIONE.prova("ta1")
// Con Edge invisibile: prova.js --porta 8995 --carica preferiti/trofei-avvisi.js --prova ta1,ta2,ta3,ta4,ta5,ta6
//
// ta1 1, 3, 4 e 12 trofei della Mini Asta insieme: 1, 3, 4 e 4 avvisi; il quarto «+1» e «+9»; con 12 i primi 3 sono i più alti
//     (Diamante, Oro, Argento); i premi (XP e monete) di TUTTI i trofei, niente «🎁 Premi dei tuoi…».
// ta2 Il Platino di un gioco (tutti i suoi trofei insieme): il Platino tra i 3 e per ultimo, il «+N» col resto.
// ta3 Trofei che arrivano in due salvataggi (2, poi 7 mentre si vede il primo avviso): sempre 3 + «+6»; altri 2 mentre si vede il «+N»:
//     il numero diventa «+8» nello stesso riquadro, mai un quinto avviso. Gli avvisi di XP e livelli non contano tra i 3.
// ta4 Il «+N» toccato in home apre la pagina dei trofei del gioco; con trofei di due giochi la pagina di tutti i trofei.
// ta5 Il «+N» toccato a partita in corso (una schermata senza menu sotto): si chiude e basta, la schermata resta quella.
// ta6 Le misure del quarto avviso su 360x640 e 412x915 (dentro lo schermo, niente scritte tagliate) e una foto (W.__fotoAvviso).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  var PESO = { platino: 5, diamante: 4, oro: 3, argento: 2, bronzo: 1 };

  // un telefono col profilo di Paky, i contatori finti (S.stat) e i premi finti (S.premi)
  async function prepara(opz) {
    var S = { stat: {}, premi: [] };
    W.__statFinte = function (nome, g) { return S.stat[g] || {}; };
    var P = await W.apriTel("Paky", Object.assign({ x: 0 }, opz || {})), C = P.SGCuore;
    if (!C || !C.controllaTrofei) no("non trovo i trofei del cuore");
    // (come quella vera di nube.js: segna i trofei premiati nel profilo, così ogni trofeo si premia una volta sola)
    P.SGNube.premiaTrofei = function (chiavi, xp, mon) {
      var pr = P.SGNube.profilo(); pr.premiTrofei = pr.premiTrofei || {}; chiavi.forEach(function (c) { pr.premiTrofei[c] = 1; });
      S.premi.push({ n: chiavi.length, xp: xp, mon: mon }); return { eventi: [] };
    };
    C.controllaTrofei();   // il punto di partenza: niente trofei
    await W.dorme(200);
    S.P = P; S.C = C;
    // tutti gli avvisi che compaiono (testo, classi); toccati dopo 250 ms se S.tocca (di partenza sì)
    S.avvisi = []; S.tocca = true;
    new P.MutationObserver(function (ml) {
      ml.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) {
        if (!n.classList || !n.classList.contains("avviso-trofeo")) return;
        var a = { box: n, cls: n.className, su: (n.querySelector(".at-su") || {}).textContent, nome: (n.querySelector(".at-nome") || {}).textContent,
          piu: (n.querySelector(".at-piu") || {}).textContent || "" };
        S.avvisi.push(a);
        if (S.tocca) setTimeout(function () { a.piu = (n.querySelector(".at-piu") || {}).textContent || a.piu; n.click(); }, 250);
      }); });
    }).observe(P.document.body, { childList: true });
    return S;
  }
  function via() { W.__statFinte = null; }
  function prof(S) { return S.P.SGNube.profilo(); }
  function sbloccati(S) { return S.C.trofeiSbloccati(prof(S)); }
  function quanti(S) { return Object.keys(sbloccati(S)).length; }
  // accende i contatori finché i trofei presi del gioco sono n (dai più facili; prima, se serve, una statistica fino al Diamante)
  function accendi(S, gioco, n, diamante) {
    var st = S.stat[gioco] = S.stat[gioco] || {}, base = quanti(S);
    var lista = S.C.trofeiDi(gioco).filter(function (t) { return t.stat !== "recordFiches"; });
    if (diamante) {
      var d = lista.filter(function (t) { return t.livello === "diamante"; })[0];
      if (d) { var prima = st[d.stat]; st[d.stat] = d.meta; if (quanti(S) - base > n) st[d.stat] = prima; }
    }
    lista.slice().sort(function (a, b) { return a.meta - b.meta; }).forEach(function (t) {
      if (quanti(S) - base >= n || (st[t.stat] || 0) >= t.meta) return;
      var prima = st[t.stat]; st[t.stat] = t.meta;
      if (quanti(S) - base > n) { if (prima == null) delete st[t.stat]; else st[t.stat] = prima; }
    });
    if (quanti(S) - base !== n) no(gioco + ": non riesco ad accendere " + n + " trofei (" + (quanti(S) - base) + ")");
  }
  async function fineAvvisi(S, ms) {
    var t0 = Date.now(), quiete = 0;
    while (Date.now() - t0 < (ms || 30000)) {
      await W.dorme(150);
      if (!q(S.P, ".avviso-trofeo") && !S.C.codaTrofei.length) { if ((quiete += 150) >= 1200) return; } else quiete = 0;
    }
    no("gli avvisi non finiscono");
  }
  function trofeiVisti(S) { return S.avvisi.filter(function (a) { return /sbloccato!/.test(a.su || ""); }); }
  function riassunti(S) { return S.avvisi.filter(function (a) { return /tl-altri/.test(a.cls); }); }
  function riga(S) { return S.avvisi.map(function (a) { return /tl-altri/.test(a.cls) ? a.piu : (a.nome || "?"); }).join(", "); }
  // un giro: accende n trofei, controlla quanti avvisi, il «+N», i premi; torna i trofei nuovi (in ordine di lista)
  async function giro(S, gioco, n, diamante) {
    var prima = sbloccati(S); S.avvisi.length = 0; S.premi.length = 0;
    accendi(S, gioco, n, diamante);
    var dopo = sbloccati(S), nuovi = Object.keys(dopo).filter(function (k) { return !prima[k]; }).map(function (k) { return dopo[k]; });
    S.C.controllaTrofei();
    await fineAvvisi(S);
    var tv = trofeiVisti(S), rs = riassunti(S), voluti = Math.min(n, 3);
    if (tv.length !== voluti) no(n + " trofei: " + tv.length + " avvisi di trofei (voluti " + voluti + "): " + riga(S));
    if (n > 3) { if (rs.length !== 1 || rs[0].piu !== "+" + (n - 3)) no(n + " trofei: il quarto avviso è «" + (rs[0] && rs[0].piu) + "» (voluto «+" + (n - 3) + "»)"); }
    else if (rs.length) no(n + " trofei: c'è un «+N» che non serve");
    if (S.avvisi.length > 4) no(n + " trofei: " + S.avvisi.length + " avvisi di fila");
    if (S.avvisi.some(function (a) { return /Premi dei tuoi|Premio di un trofeo/.test(a.su || ""); })) no(n + " trofei: c'è il regalo «🎁 Premi dei tuoi…»");
    var tot = S.premi.reduce(function (s, p) { return s + p.n; }, 0); if (tot !== n) no(n + " trofei: premi per " + tot);
    // i 3 visti sono i più importanti
    var minVisto = Math.min.apply(null, tv.map(function (a) { var t = nuovi.filter(function (x) { return x.nome === a.nome; })[0]; return t ? PESO[t.livello] : 9; }));
    var nomiVisti = tv.map(function (a) { return a.nome; });
    var maxFuori = Math.max.apply(null, [0].concat(nuovi.filter(function (t) { return nomiVisti.indexOf(t.nome) < 0; }).map(function (t) { return PESO[t.livello]; })));
    if (maxFuori > minVisto) no(n + " trofei: nel «+N» c'è un trofeo più importante di uno visto (" + riga(S) + ")");
    return { nuovi: nuovi, visti: nomiVisti, testo: riga(S) };
  }

  COPIONE.aggiungi("ta1", { nome: "1, 3, 4 e 12 trofei insieme: 1, 3, 4 e 4 avvisi («+1», «+9»), i 3 più importanti, i premi di tutti", fai: async function () {
    var S = await prepara(), x = [];
    try {
      x.push("1 → " + (await giro(S, "astafanta", 1)).testo);
      x.push("3 → " + (await giro(S, "astafanta", 3)).testo);
      x.push("4 → " + (await giro(S, "astafanta", 4)).testo);
      var r = await giro(S, "astafanta", 12, true);
      var liv = r.visti.map(function (nm) { return r.nuovi.filter(function (t) { return t.nome === nm; })[0].livello; });
      if (liv.indexOf("diamante") < 0 || liv.indexOf("oro") < 0) no("con 12 i primi 3 non sono i più alti: " + liv.join(", "));
      x.push("12 → " + r.testo + " (" + liv.join(", ") + ")");
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    } finally { via(); }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("ta2", { nome: "Il Platino di un gioco tra i 3 avvisi e per ultimo, il resto nel «+N»", fai: async function () {
    var S = await prepara(), x = [];
    try {
      // il gioco coi meno trofei (senza 👑) che arriva al Platino
      var ids = {}; S.C.TROFEI.forEach(function (t) { if (!t.plat && t.stat !== "recordFiches") ids[t.gioco] = (ids[t.gioco] || 0) + 1; });
      var g = Object.keys(ids).filter(function (k) { return S.C.trofeiDi(k).every(function (t) { return t.stat !== "recordFiches" && !t.plat; }); })
        .sort(function (a, b) { return ids[a] - ids[b]; }).filter(function (k) { return ids[k] >= 4; })[0];
      if (!g) no("non trovo un gioco per il Platino");
      S.avvisi.length = 0; S.premi.length = 0;
      var st = S.stat[g] = {}; S.C.trofeiDi(g).forEach(function (t) { st[t.stat] = Math.max(st[t.stat] || 0, t.meta); });
      var n = quanti(S);
      S.C.controllaTrofei(); await fineAvvisi(S);
      var tv = trofeiVisti(S), rs = riassunti(S);
      if (tv.length !== 3) no(g + ": " + tv.length + " avvisi di trofei");
      if (!tv.length || !/Platino/.test(tv[tv.length - 1].su)) no(g + ": il Platino non è l'ultimo dei 3: " + riga(S));
      if (rs.length !== 1 || rs[0].piu !== "+" + (n - 3)) no(g + ": il «+N» è «" + (rs[0] && rs[0].piu) + "» (voluto +" + (n - 3) + ")");
      var tot = S.premi.reduce(function (s, p) { return s + p.n; }, 0); if (tot !== n) no("premi per " + tot + " su " + n);
      x.push(g + ": " + n + " trofei → " + riga(S));
    } finally { via(); }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("ta3", { nome: "Trofei in due salvataggi: sempre 3 + «+N», il «+N» già in vista cambia numero, XP e livelli non contano", fai: async function () {
    var S = await prepara(), x = [];
    try {
      S.tocca = false;   // qui si lasciano andare da soli (3,6 s l'uno)
      S.C.codaTrofei.push({ tipo: "xp", cls: "tl-xp", icona: "⭐", su: "Prova", nome: "Livello 2", sotto: "XP" });
      accendi(S, "astafanta", 2); S.C.controllaTrofei();
      if (!await W.aspetta(function () { return S.avvisi.length >= 1; }, 3000)) no("non parte il primo avviso");
      accendi(S, "astafanta", 7); S.C.controllaTrofei();
      if (!await W.aspetta(function () { return riassunti(S).length; }, 30000)) no("non arriva il «+N»: " + riga(S));
      await W.dorme(600);
      var piu = q(S.P, ".avviso-trofeo .at-piu"); if (!piu || piu.textContent !== "+6") no("il «+N» dice «" + (piu && piu.textContent) + "» (voluto +6)");
      accendi(S, "astafanta", 2); S.C.controllaTrofei(); await W.dorme(300);
      piu = q(S.P, ".avviso-trofeo .at-piu"); if (!piu || piu.textContent !== "+8") no("con altri 2 il «+N» dice «" + (piu && piu.textContent) + "» (voluto +8)");
      await fineAvvisi(S, 20000);
      var tv = trofeiVisti(S), xp = S.avvisi.filter(function (a) { return /tl-xp/.test(a.cls); });
      if (tv.length !== 3) no(tv.length + " avvisi di trofei: " + riga(S));
      if (xp.length !== 1) no("l'avviso di XP " + xp.length + " volte");
      if (riassunti(S).length !== 1) no(riassunti(S).length + " avvisi «+N»");
      x.push(riga(S));
      // dopo la fila se ne riparte un'altra da 3
      S.avvisi.length = 0; S.tocca = true; accendi(S, "astafanta", 2); S.C.controllaTrofei(); await fineAvvisi(S);
      if (trofeiVisti(S).length !== 2) no("la fila dopo non riparte: " + riga(S));
      x.push("dopo: " + riga(S));
    } finally { via(); }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("ta4", { nome: "Il «+N» toccato in home apre la pagina dei trofei del gioco (o di tutti, con giochi diversi)", fai: async function () {
    var S = await prepara(), x = [];
    try {
      S.tocca = false;
      accendi(S, "astafanta", 6); S.C.controllaTrofei();
      for (var i = 0; i < 3; i++) { if (!await W.aspetta(function () { return S.avvisi.length > i; }, 6000)) no("manca l'avviso " + (i + 1)); S.avvisi[i].box.click(); }
      if (!await W.aspetta(function () { return riassunti(S).length; }, 6000)) no("non arriva il «+N»");
      await W.dorme(400); riassunti(S)[0].box.click(); await W.dorme(600);
      var tit = q(S.P, ".schermata h1"), tt = tit ? tit.textContent : "";
      if (!/Mini Asta/.test(tt) || !q(S.P, ".trofeo")) no("il tocco non apre la pagina della Mini Asta: «" + tt + "»");
      x.push("un gioco → «" + tt.trim() + "»");
      S.C.tornaHome(); await W.dorme(400); S.avvisi.length = 0;
      accendi(S, "astafanta", 1); var altro = S.C.TROFEI.filter(function (t) { return t.gioco !== "astafanta" && t.gioco !== "asta" && t.stat !== "recordFiches"; })[0].gioco;
      accendi(S, altro, 4); S.C.controllaTrofei();
      for (i = 0; i < 3; i++) { if (!await W.aspetta(function () { return S.avvisi.length > i; }, 6000)) no("manca l'avviso " + (i + 1)); S.avvisi[i].box.click(); }
      if (!await W.aspetta(function () { return riassunti(S).length; }, 6000)) no("non arriva il «+N»");
      await W.dorme(400); riassunti(S)[0].box.click(); await W.dorme(600);
      tit = q(S.P, ".schermata h1"); tt = tit ? tit.textContent : "";
      var cur = S.P.SGCuore.app.firstElementChild;
      if (!cur || cur._menu !== "trofei") no("con due giochi non si apre la pagina di tutti i trofei: «" + tt + "»");
      x.push("due giochi (" + altro + ") → «" + tt.trim() + "»");
    } finally { via(); }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("ta5", { nome: "Il «+N» toccato a partita in corso si chiude e basta", fai: async function () {
    var S = await prepara(), x = [];
    try {
      S.tocca = false;
      var s = S.C.schermata({ icona: "🎮", titolo: "Partita finta" }); s.classList.add("partita-finta"); S.C.mostra(s); await W.dorme(200);
      accendi(S, "astafanta", 5); S.C.controllaTrofei();
      for (var i = 0; i < 3; i++) { if (!await W.aspetta(function () { return S.avvisi.length > i; }, 6000)) no("manca l'avviso " + (i + 1)); S.avvisi[i].box.click(); }
      if (!await W.aspetta(function () { return riassunti(S).length; }, 6000)) no("non arriva il «+N»");
      await W.dorme(400); riassunti(S)[0].box.click(); await W.dorme(700);
      if (!q(S.P, ".partita-finta")) no("a partita in corso il tocco ha cambiato schermata");
      if (q(S.P, ".avviso-trofeo")) no("l'avviso non si chiude");
      x.push("resta sulla partita, «" + riassunti(S)[0].piu + "» chiuso");
    } finally { via(); }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("ta6", { nome: "Il quarto avviso su 360x640 e 412x915: dentro lo schermo, niente tagliato", fai: async function () {
    var x = [];
    try {
      var misure = [[360, 640], [412, 915]];
      for (var m = 0; m < misure.length; m++) {
        var S = await prepara(); var fr = document.getElementById("tel-Paky"); fr.style.width = misure[m][0] + "px"; fr.style.height = misure[m][1] + "px"; S.P.dispatchEvent(new S.P.Event("resize")); await W.dorme(300);
        S.tocca = false;
        accendi(S, "astafanta", 12, true); S.C.controllaTrofei();
        for (var i = 0; i < 3; i++) { if (!await W.aspetta(function () { return S.avvisi.length > i; }, 6000)) no("manca l'avviso " + (i + 1)); S.avvisi[i].box.click(); }
        if (!await W.aspetta(function () { return riassunti(S).length; }, 6000)) no("non arriva il «+N»");
        await W.dorme(900);
        var b = riassunti(S)[0].box, r = b.getBoundingClientRect(), vw = S.P.innerWidth;
        if (r.left < 0 || r.right > vw || r.top < 0) no(misure[m].join("x") + ": l'avviso esce dallo schermo " + JSON.stringify([r.left, r.right, r.top]));
        [".at-su", ".at-nome", ".at-gioco", ".at-piu"].forEach(function (sel) { var e = b.querySelector(sel); if (e && e.scrollWidth > e.clientWidth + 1) no(misure[m].join("x") + ": «" + sel + "» tagliato"); });
        x.push(misure[m].join("x") + ": «" + b.textContent.replace(/\s+/g, " ").trim() + "» " + Math.round(r.width) + "x" + Math.round(r.height));
        if (W.__fotoAvviso) await W.__fotoAvviso(S.P, misure[m]);
        b.click(); await fineAvvisi(S);
        via();
      }
    } finally { via(); }
    return x.join(" · ");
  } });
})();
