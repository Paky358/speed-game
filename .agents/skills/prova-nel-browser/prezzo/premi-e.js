// PROVE DEI GIOCHI A PREMI DEL FILE E: «✅ La Prova del 5» e «🧹 Togli la cifra» (js/games/prezzo-premi-e.js, 23 ott 2026).
// Uso: await COPIONE.carica("prezzo/base.js"); await COPIONE.carica("prezzo/premi-e.js"); await COPIONE.prova("pe1")
// In tutte le partite restano registrati SOLO questi due giochi a premi (così escono di sicuro).
// Il giocatore automatico di questi due è W.PZE.agisciE (per gli altri controlli).
//
// pe1: le regole senza grafica (Prova del 5: 5 prodotti tra 0,50 e 300 €, da 1 a 4 cartellini giusti, i falsi sbagliati del
//      25-45% e con la stessa fine del prezzo vero, punti 0/200/400/700, il segreto mai nella foto pubblica; Togli la cifra:
//      prezzi di 3, 4 e 5 cifre, la cifra in più mai prima né ultima e diversa dalle vicine, una sola scelta giusta, posti a
//      caso, 120 a prezzo +300; mosse cattive scartate, «fatto» solo col tasto, i segreti per chi ricarica, le durate; i Bot
//      fanno mosse valide e il difficile è più bravo del facile).
// pe2: «🤖 Contro il Bot», 📺 Puntata: escono tutti e due, i Bot giocano, 4 righe nella rivelazione, il bravo fa 700 e 660.
// pe3: sullo stesso telefono in 3, 📺 ⚡ Veloce: i due giochi a turno («📱 Sono Luca, tocca a me»).
// pe4: online nella Sala in 3, 📺 ⚡ Veloce: Luca ricarica a metà Prova del 5 (ritrova i suoi segni), Sara ricarica a metà
//      Togli la cifra (ritrova le sue cifre), partita fino alla fine e tasti del core.
// pe5: le misure a 360x640, 412x915 e 360x780 (Galaxy S25) mentre si gioca e nella rivelazione (Bot in 6).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, PZ = W.PZ;
  if (!PZ) throw new Error("prima carica prezzo/base.js");
  var MIEI = ["prova5", "togli"];
  function vm(C) { return W.vmDi(C) || {}; }
  function soloMiei(w) { var R = w && w.SG_PREZZO_PREMI; if (!R) return false; Object.keys(R).forEach(function (k) { if (MIEI.indexOf(k) < 0) delete R[k]; }); return !!(R.prova5 && R.togli); }
  function Hdi(nome) { var w = W.finestra(nome || "Paky"); return w && w.__prezzoH; }
  function idDi(H, nome) { var p = (H.players || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  function tocca(w, b) { if (!b || b.disabled) return false; b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" })); return true; }
  function errori() { var e = W.erroriTel(); return e.length ? " · ERRORI: " + e.slice(0, 3).join(" / ") : ""; }

  // ---------------- il giocatore automatico dei due giochi ----------------
  // opz.bravo (o opz.precisi[nome]): tutto giusto; se no due cartellini sbagliati e il primo prezzo sbagliato. Un tocco a ogni
  // chiamata (così chi ricarica si trova a metà).
  var STATO = {};
  function segniVisti(pan) { return [].map.call(pan.querySelectorAll(".pze-r5"), function (r) { return r.classList.contains("si") ? 1 : r.classList.contains("no") ? 0 : null; }); }
  function cifreViste(pan) { return [].map.call(pan.querySelectorAll(".pze-r3"), function (r) { var b = [].slice.call(r.querySelectorAll("button.pze-t")), i = b.findIndex(function (x) { return x.classList.contains("via"); }); return i < 0 ? null : i + 1; }); }
  async function agisciE(nome, opz) {
    opz = opz || {};
    var w = W.finestra(nome); if (!w || !w.document) return false;
    var d = w.document, H = Hdi(opz.host), pan = d.querySelector(".pz-pan.su");
    if (!(pan && H && H.premio && H.premio.st && H.fase === "premio" && H.sotto === "gioca" && MIEI.indexOf(H.premio.tipo) >= 0)) return false;
    var st = H.premio.st, k = STATO[nome] = STATO[nome] || {}, bravo = opz.bravo || (opz.precisi && opz.precisi[nome]);
    var fatto = pan.querySelector(".pze-fatto"); if (!fatto || pan.querySelector(".pze-lista.chiuso")) return false;
    if (opz.guarda) opz.guarda(w, pan, H);   // (una prova guarda il pannello prima che il giocatore automatico tocchi)
    if (k.ultimo && Date.now() - k.ultimo < ((opz.ritmo && opz.ritmo[nome]) || 250)) return false;
    k.ultimo = Date.now();
    if (H.premio.tipo === "prova5") {
      var righe = [].slice.call(pan.querySelectorAll(".pze-r5")); if (righe.length !== st.prod.length) return false;
      var ora = segniVisti(pan), meta = st.ok.map(function (o, i) { var v = o ? 1 : 0; return !bravo && i < 2 ? 1 - v : v; });
      for (var i = 0; i < righe.length; i++) if (ora[i] !== meta[i]) return tocca(w, righe[i].querySelector(meta[i] ? ".pze-gs.si" : ".pze-gs.no"));
      return tocca(w, fatto);
    }
    var rr = [].slice.call(pan.querySelectorAll(".pze-r3")); if (rr.length !== st.S.length) return false;
    var vis = cifreViste(pan), meta2 = st.j.map(function (j, q) { return !bravo && q === 0 ? (j === 1 ? 2 : 1) : j; });
    for (var q = 0; q < rr.length; q++) if (vis[q] !== meta2[q]) return tocca(w, rr[q].querySelectorAll("button.pze-t")[meta2[q] - 1]);
    return tocca(w, fatto);
  }
  async function agisci(nome, opz) { return (await agisciE(nome, opz)) || PZ.agisci(nome, opz); }
  async function giocaTutti(nomi, finito, opz) {
    opz = opz || {};
    var fino = Date.now() + (opz.ms || 420000), giri = 0;
    while (Date.now() < fino) {
      if (finito()) return true;
      for (var i = 0; i < nomi.length; i++) { try { await agisci(nomi[i], opz); } catch (e) {} }
      if (opz.ognuno) await opz.ognuno(++giri);
      await W.dorme(opz.passo || 400);
    }
    return finito();
  }
  function spiaPremi(nomeHost) {
    var visti = {}, w = W.finestra(nomeHost || "Paky");
    var id = setInterval(function () {
      var H = w && w.__prezzoH; if (!H || !H.premio || H.fase !== "premio") return;
      var k = H.premio.tipo + "#" + H.iPremio;
      if (!visti[k]) visti[k] = { tipo: H.premio.tipo, sotto: {} };
      visti[k].sotto[H.sotto] = 1;
      if (H.premio.punti) visti[k].punti = H.premio.punti;
      if (H.premio.riv) visti[k].riv = H.premio.riv;
    }, 120);
    return { visti: visti, ferma: function () { clearInterval(id); },
      tipi: function () { var t = {}; Object.keys(visti).forEach(function (k) { if (visti[k].sotto.riv) t[visti[k].tipo] = (t[visti[k].tipo] || 0) + 1; }); return t; } };
  }
  function controllaPremi(sp) {
    var t = sp.tipi();
    MIEI.forEach(function (x) { if (!t[x]) no("il gioco a premi «" + x + "» non è arrivato alla rivelazione (" + JSON.stringify(t) + ")"); });
    Object.keys(sp.visti).forEach(function (k) {
      var v = sp.visti[k]; if (!v.sotto.riv) return;
      if (!v.punti) no(k + ": niente punti alla fine");
      Object.keys(v.punti).forEach(function (id) { var p = v.punti[id]; if (!(p >= 0 && p <= 700)) no(k + ": punti strani per " + id + ": " + p); });
    });
    return Object.keys(t).map(function (x) { return x + "×" + t[x]; }).join(", ");
  }
  // chi ha giocato davvero (nei dati della rivelazione)
  function giocato(v) { return (v.riv.g || []).map(function (x) { return v.tipo === "prova5" ? !!(x.s && x.s.some(function (n) { return n != null; })) : !!(x.c && x.c.some(function (n) { return n != null; })); }); }

  // ===================== pe1: le regole =====================
  COPIONE.aggiungi("pe1", { nome: "Premi E: le regole della Prova del 5 e di Togli la cifra, senza grafica", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return w.SG_PREZZO_PREMI && w.SG_PREZZO_PREMI.prova5 && w.SG_PREZZO_PREMI.togli; }, 6000)) no("i due giochi a premi non sono registrati");
    var R = w.SG_PREZZO_PREMI, tutti = w.SG_PREZZO.prodotti;
    function Pfinto(ids) {
      var usati = {}, fatti = {}, privati = [];
      return { ids: ids, n: ids.length, modo: "online", locale: false, nome: function (id) { return id; }, rnd: Math.random,
        mescola: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
        pesca: function (f, n) { var l = this.mescola(tutti.filter(function (p) { return !usati[p.id] && (!f || f(p)); })).slice(0, n || 1); l.forEach(function (p) { usati[p.id] = 1; }); return l.map(function (p) { return JSON.parse(JSON.stringify(p)); }); },
        passo: w.SGPrezzoScena.passo, arrotonda: w.SGPrezzoScena.arrotonda, tondo2: function (v) { return Math.round(v * 100) / 100; },
        privato: function (id, m) { privati.push([id, m]); }, fatto: function (id) { fatti[id] = 1; }, _fatti: fatti };
    }
    if (R.prova5.ordine !== 10 || R.togli.ordine !== 11) no("ordine: " + R.prova5.ordine + " / " + R.togli.ordine);
    if (!R.prova5.regola || R.prova5.regola.length > 110 || !R.togli.regola || R.togli.regola.length > 110) no("la regola deve essere una frase corta");
    // --- La Prova del 5 ---
    var p5 = R.prova5, quanti = {}, codaMale = [], fuori = [], scarti = [];
    function grana(p) { return p < 3 ? 10 : p < 30 ? 100 : p < 300 ? 1000 : 10000; }
    for (var t = 0; t < 300; t++) {
      var P = Pfinto(["a"]), st = p5.prepara(P);
      if (st.prod.length !== 5) no("Prova del 5: servono 5 prodotti, invece " + st.prod.length);
      st.prod.forEach(function (p) { if (!(p.prezzo >= 0.5 && p.prezzo <= 300)) fuori.push(p.prezzo); });
      var ng = st.ok.filter(Boolean).length; quanti[ng] = (quanti[ng] || 0) + 1;
      st.prod.forEach(function (p, i) {
        if (st.ok[i]) { if (Math.abs(st.tag[i] - p.prezzo) > 1e-9) no("Prova del 5: cartellino giusto con un prezzo diverso: " + p.prezzo + " / " + st.tag[i]); return; }
        var r = st.tag[i] / p.prezzo, sc = Math.abs(r - 1); scarti.push(sc);
        if (sc < 0.2 || sc > 0.5) no("Prova del 5: cartellino falso troppo vicino o troppo lontano: " + p.prezzo + " → " + st.tag[i]);
        var G = grana(p.prezzo); if (Math.round(st.tag[i] * 100) % G !== Math.round(p.prezzo * 100) % G) codaMale.push(p.prezzo + "→" + st.tag[i]);
      });
    }
    if (fuori.length) no("Prova del 5: prodotti fuori da 0,50-300 €: " + fuori.slice(0, 5).join(", "));
    if ([1, 2, 3, 4].some(function (k) { return !quanti[k]; }) || quanti[0] || quanti[5]) no("Prova del 5: i cartellini giusti devono essere da 1 a 4, tutti possibili: " + JSON.stringify(quanti));
    if (codaMale.length) no("Prova del 5: cartellini falsi che finiscono diversi dal prezzo vero: " + codaMale.slice(0, 5).join(", "));
    var P1 = Pfinto(["a", "b", "c", "d", "e", "f"]), s1 = p5.prepara(P1), pub = JSON.stringify(p5.pubblico(s1, P1));
    if (/prezzo|"ok"/.test(pub)) no("Prova del 5: il segreto è nella foto pubblica: " + pub.slice(0, 160));
    if (JSON.stringify(p5.pubblico(s1, P1).tag) !== JSON.stringify(s1.tag)) no("Prova del 5: i cartellini devono essere nella foto pubblica");
    var giusto = s1.ok.map(function (o) { return o ? 1 : 0; }), con = function (k) { return giusto.map(function (v, i) { return i < 5 - k ? 1 - v : v; }); };
    p5.mossa(s1, "a", { s: giusto, fine: 1, ms: 9000 }, P1);
    p5.mossa(s1, "b", { s: con(4) }, P1);                      // provvisorio: vale allo scadere
    p5.mossa(s1, "c", { s: con(3), fine: 1 }, P1);
    p5.mossa(s1, "d", { s: con(2), fine: 1 }, P1);
    p5.mossa(s1, "e", { s: [1, 0, 1] }, P1); p5.mossa(s1, "e", { s: [1, 0, 2, 0, 1] }, P1); p5.mossa(s1, "e", { s: "11111" }, P1);   // mosse cattive
    var mezzo = giusto.map(function (v, i) { return i < 3 ? v : null; });
    p5.mossa(s1, "f", { s: mezzo }, P1);                       // solo 3 segnati, tutti giusti: 3 su 5
    p5.mossa(s1, "a", { s: giusto.map(function (v) { return 1 - v; }) }, P1);   // dopo «Fatto» non si cambia più
    if (!P1._fatti.a || P1._fatti.b || !P1._fatti.c || P1._fatti.e || P1._fatti.f) no("Prova del 5: «fatto» solo con «✅ Fatto!»: " + JSON.stringify(P1._fatti));
    var f1 = p5.fine(s1, P1), pt = f1.punti;
    if (pt.a !== 700 || pt.b !== 400 || pt.c !== 200 || pt.d !== 0 || pt.e !== 0 || pt.f !== 200) no("Prova del 5: punti 5 = 700, 4 = 400, 3 = 200, 2 = 0, niente = 0, 3 segnati giusti = 200: " + JSON.stringify(pt));
    if (!f1.carrello.a || f1.carrello.a.length !== 5 || f1.carrello.b) no("Prova del 5: a casa i 5 prodotti solo chi le azzecca tutte");
    if (!p5.privatoDi(s1, "b", P1) || p5.privatoDi(s1, "b", P1).f || !p5.privatoDi(s1, "a", P1).f || p5.privatoDi(s1, "e", P1)) no("Prova del 5: i segreti per chi ricarica");
    if (f1.riv.ok.length !== 5 || f1.riv.prod[0].prezzo == null) no("Prova del 5: nella rivelazione servono i prezzi veri e quali erano giusti");
    var dur = p5.durata(f1.riv, P1); if (!(dur > 7000 && dur < 16000)) no("Prova del 5: durata della rivelazione " + dur);
    function bravi5(liv) { var n = 0; for (var q = 0; q < 200; q++) { var Pq = Pfinto(["x"]), s = p5.prepara(Pq), m = p5.bot(s, { id: "x", livello: liv }, Pq); if (m.some(function (x) { return x.ms > 35000; })) no("Prova del 5: mossa del Bot dopo il tempo"); m.forEach(function (x) { p5.mossa(s, "x", x.m, Pq); }); n += p5.fine(s, Pq).riv.g[0].n; } return n / 200; }
    var bd = bravi5("difficile"), bf = bravi5("facile");
    if (!(bd > bf)) no("Prova del 5: il Bot difficile non è più bravo del facile (" + bd + " / " + bf + ")");
    // --- Togli la cifra ---
    var tg = R.togli, posti = {}, doppie = 0, lun = [];
    for (var t2 = 0; t2 < 300; t2++) {
      var Pt = Pfinto(["a"]), sc2 = tg.prepara(Pt);
      lun.push(sc2.vero.map(function (v) { return v.length; }).join(""));
      sc2.vero.forEach(function (T, k) {
        var S = sc2.S[k], j = sc2.j[k];
        if (S.length !== T.length + 1) no("Togli: il numero non ha una cifra in più: " + T + " / " + S);
        if (String(Math.round(sc2.prod[k].prezzo)) !== T) no("Togli: il prezzo vero non è quello del prodotto");
        if (S[0] !== T[0] || S[S.length - 1] !== T[T.length - 1]) no("Togli: la prima o l'ultima cifra sono cambiate: " + T + " / " + S);
        if (!(j >= 1 && j <= S.length - 2)) no("Togli: la cifra in più è al posto " + j + " in " + S);
        if (S.slice(0, j) + S.slice(j + 1) !== T) no("Togli: togliendo la cifra in più non viene il prezzo vero: " + T + " / " + S + " @" + j);
        if (S[j] === S[j - 1] || S[j] === S[j + 1]) no("Togli: la cifra in più è uguale a una vicina: " + S + " @" + j);
        for (var i = 1; i < S.length - 1; i++) if (i !== j && S.slice(0, i) + S.slice(i + 1) === T) no("Togli: due scelte danno il prezzo vero: " + S);
        for (var i2 = 1; i2 < S.length - 2; i2++) if (S[i2] === S[i2 + 1]) { doppie++; break; }
        posti[T.length + "@" + j] = (posti[T.length + "@" + j] || 0) + 1;
      });
    }
    if (lun.some(function (x) { return x !== "345"; })) no("Togli: i prezzi devono essere di 3, 4 e 5 cifre in quest'ordine: " + lun.filter(function (x) { return x !== "345"; }).slice(0, 5));
    ["3@1", "3@2", "4@1", "4@2", "4@3", "5@1", "5@2", "5@3", "5@4"].forEach(function (k) { if (!(posti[k] > 300 / 10)) no("Togli: la cifra in più non è a caso tra i posti possibili: " + JSON.stringify(posti)); });
    var P2 = Pfinto(["a", "b", "c", "d"]), s2 = tg.prepara(P2), pub2 = tg.pubblico(s2, P2), pj = JSON.stringify(pub2);
    if (/prezzo|vero|"j"/.test(pj) || s2.vero.some(function (v) { return pj.indexOf('"' + v + '"') >= 0; })) no("Togli: il prezzo vero è nella foto pubblica: " + pj.slice(0, 200));
    if (JSON.stringify(pub2.S) !== JSON.stringify(s2.S)) no("Togli: i numeri con la cifra in più devono essere nella foto pubblica");
    var sb = s2.j.map(function (j, k) { return k === 0 ? (j === 1 ? 2 : 1) : j; });
    tg.mossa(s2, "a", { c: s2.j.slice(), fine: 1 }, P2);
    tg.mossa(s2, "b", { c: sb }, P2);
    tg.mossa(s2, "c", { c: [0, 1, 1], fine: 1 }, P2); tg.mossa(s2, "c", { c: [1, 1] }, P2); tg.mossa(s2, "c", { c: [s2.S[0].length - 1, 1, 1] }, P2); tg.mossa(s2, "c", { c: [1.5, 1, 1] }, P2);   // mosse cattive
    tg.mossa(s2, "d", { c: [s2.j[0], null, null] }, P2);
    if (!P2._fatti.a || P2._fatti.b || P2._fatti.c || P2._fatti.d) no("Togli: «fatto» solo con «✅ Fatto!» e una scelta valida: " + JSON.stringify(P2._fatti));
    var f2 = tg.fine(s2, P2);
    if (f2.punti.a !== 660 || f2.punti.b !== 240 || f2.punti.c !== 0 || f2.punti.d !== 120) no("Togli: tutti e tre = 660, due = 240, mosse cattive = 0, uno = 120: " + JSON.stringify(f2.punti));
    if (!f2.carrello.a || f2.carrello.a.length !== 3 || f2.carrello.b) no("Togli: a casa i 3 premi solo chi li indovina tutti");
    if (!tg.privatoDi(s2, "b", P2) || tg.privatoDi(s2, "b", P2).f || !tg.privatoDi(s2, "a", P2).f || tg.privatoDi(s2, "c", P2)) no("Togli: i segreti per chi ricarica");
    var dur2 = tg.durata(f2.riv, P2); if (!(dur2 > 7000 && dur2 < 16000)) no("Togli: durata della rivelazione " + dur2);
    function bravi(liv) { var n = 0; for (var q = 0; q < 200; q++) { var Pq = Pfinto(["x"]), s = tg.prepara(Pq), m = tg.bot(s, { id: "x", livello: liv }, Pq); if (m.some(function (x) { return x.ms > 35000; })) no("Togli: mossa del Bot dopo il tempo"); m.forEach(function (x) { tg.mossa(s, "x", x.m, Pq); }); n += tg.fine(s, Pq).riv.g[0].n; } return n / 200; }
    var td = bravi("difficile"), tf = bravi("facile");
    if (!(td > tf)) no("Togli: il Bot difficile non è più bravo del facile (" + td + " / " + tf + ")");
    var sm = scarti.reduce(function (a, x) { return a + x; }, 0) / scarti.length;
    return "Prova del 5: giusti " + JSON.stringify(quanti) + ", falsi sbagliati in media del " + Math.round(100 * sm) + "%, Bot difficile " + bd.toFixed(1) + "/5 facile " + bf.toFixed(1) + "/5 · Togli: posti " + JSON.stringify(posti) + ", numeri con due cifre uguali vicine " + doppie + "/900, Bot difficile " + td.toFixed(2) + "/3 facile " + tf.toFixed(2) + "/3" + errori();
  } });

  // ===================== pe2: col Bot =====================
  COPIONE.aggiungi("pe2", { nome: "Premi E: 🤖 Contro il Bot, 📺 Puntata: la Prova del 5 e Togli la cifra", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "puntata", offerte: "vista", liv: "medio", nBot: 3 }; } });
    if (!await W.aspetta(function () { return soloMiei(w); }, 6000)) no("i due giochi a premi non sono registrati");
    var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 5000);
    tess.click(); await W.dorme(300);
    if (!W.clicca(w, /Contro il Bot/)) no("niente «🤖 Contro il Bot»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita col Bot non parte al secondo tocco");
    var sp = spiaPremi("Paky"), viste = PZ.spiaFasi("Paky"), righe = {}, pan = {}, girati = {};
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH && w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000, bravo: true,
      ognuno: function () {
        var d = w.document, H = w.__prezzoH, tipo = H.premio && H.premio.tipo;
        if (tipo && H.sotto === "riv" && d.querySelector(".pze-g")) righe[tipo] = Math.max(righe[tipo] || 0, d.querySelectorAll(".pze-g").length);
        if (d.querySelector(".pz-pan.su .pze-r5")) pan.prova5 = 1;
        if (d.querySelector(".pz-pan.su .pze-r3")) pan.togli = 1;
        girati.prova5 = Math.max(girati.prova5 || 0, d.querySelectorAll(".pze-c5.giusto,.pze-c5.falso").length);
        girati.togli = Math.max(girati.togli || 0, d.querySelectorAll(".pze-sov.fatto").length);
      } });
    sp.ferma(); viste.ferma();
    if (!ok) no("la partita col Bot non finisce (" + viste.viste.join(" → ") + ")");
    var tipi = controllaPremi(sp);
    MIEI.forEach(function (x) { if (righe[x] !== 4) no("«" + x + "»: nella rivelazione dovevano esserci 4 righe: " + righe[x]); });
    if (!pan.prova5 || !pan.togli) no("non si è visto il pannello di tutti e due: " + JSON.stringify(pan));
    if (girati.prova5 !== 5 || girati.togli !== 3) no("nella rivelazione non si sono girati tutti i cartellini o i prezzi: " + JSON.stringify(girati));
    var mie = [];
    Object.keys(sp.visti).forEach(function (k) {
      var v = sp.visti[k]; if (!v.riv) return;
      var gi = giocato(v); if (gi.some(function (x) { return !x; })) no(v.tipo + ": qualcuno non ha giocato: " + JSON.stringify(v.riv.g));
      var io = (v.riv.g || []).filter(function (x) { return x.id === "host"; })[0];
      if (io) mie.push(v.tipo + " " + v.punti.host + " (" + io.n + (v.tipo === "prova5" ? "/5)" : "/3)"));
      var atteso = v.tipo === "prova5" ? 700 : 660;
      if (io && v.punti.host !== atteso) no(v.tipo + ": il giocatore bravo doveva fare " + atteso + ": " + v.punti.host);
      (v.riv.g || []).filter(function (x) { return x.id !== "host"; }).forEach(function (x) { mie.push("Bot " + x.n); });
    });
    return "giochi " + tipi + " · " + mie.join(", ") + " · classifica " + (w.__prezzoH.classifica || []).map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + errori();
  } });

  // ===================== pe3: sullo stesso telefono =====================
  COPIONE.aggiungi("pe3", { nome: "Premi E: 📱 sullo stesso telefono in 3, la Prova del 5 e Togli la cifra a turno", fai: async function () {
    var w = await PZ.stessoTelefono(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "segrete" });
    soloMiei(w);
    if (!await W.aspetta(function () { return W.clicca(w, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita non comincia");
    soloMiei(w);
    var sp = spiaPremi("Paky"), turni = {}, puliti = true;
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000,
      // prima che il giocatore automatico tocchi: chi prende il telefono trova il pannello pulito (non vede le scelte di chi c'era prima)
      guarda: function (w2, pan, H) {
        var t = pan.querySelector(".pz-pan-testa .tx"), m = t && /^(\S+) · /.exec(t.textContent); if (!m || H.sotto !== "gioca") return;
        var tt = (turni[H.premio.tipo] = turni[H.premio.tipo] || {});
        if (!tt[m[1]] && pan.querySelector(".pze-r5.si,.pze-r5.no,.pze-t.via")) puliti = false;
        tt[m[1]] = 1;
      } });
    sp.ferma();
    if (!ok) no("sullo stesso telefono la partita non finisce (fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + ")");
    var tipi = controllaPremi(sp);
    MIEI.forEach(function (x) { if (Object.keys(turni[x] || {}).length !== 3) no("«" + x + "»: il telefono non è passato a tutti e tre: " + JSON.stringify(turni[x])); });
    if (!puliti) no("chi prende il telefono vede già delle scelte segnate");
    Object.keys(sp.visti).forEach(function (k) { var v = sp.visti[k]; if (v.riv && giocato(v).some(function (x) { return !x; })) no(v.tipo + " a turno: qualcuno non ha giocato"); });
    return "giochi " + tipi + " · turni " + JSON.stringify(turni) + errori();
  } });

  // ===================== pe4: online nella Sala, chi ricarica =====================
  COPIONE.aggiungi("pe4", { nome: "Premi E online nella Sala in 3: chi ricarica a metà Prova del 5 e a metà Togli la cifra", fai: async function () {
    PZ.conSpia();
    try {
      var X = await PZ.salaPrezzo(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [];
      ["Paky", "Luca", "Sara"].forEach(function (n) { soloMiei(W.finestra(n)); });
      var sp = spiaPremi("Paky"), sLuca = null, cSara = null, okLuca = null, okSara = null;
      var ok = await giocaTutti(["Paky", "Luca", "Sara"], function () { return vm(C).fase === "fine"; }, { ms: 480000, ritmo: { Luca: 2500, Sara: 2500 },
        ognuno: async function () {
          var H = P.__prezzoH; if (!H.premio || H.fase !== "premio" || H.sotto !== "gioca") return;
          var st = H.premio.st;
          if (H.premio.tipo === "prova5" && !sLuca) {
            var id = idDi(H, "Luca"), s = st.s[id];
            if (s && !st.f[id] && s.some(function (x) { return x != null; })) {
              sLuca = s.slice();
              var w = await W.ricarica("Luca");
              okLuca = !!await W.aspetta(function () { var pan = w.document.querySelector(".pz-pan.su"), ora = P.__prezzoH.premio && P.__prezzoH.premio.st.s && P.__prezzoH.premio.st.s[id]; return pan && ora && segniVisti(pan).length === 5 && JSON.stringify(segniVisti(pan)) === JSON.stringify(ora); }, 15000);
              if (!okLuca) note.push("Luca dopo la ricarica non ritrova i suoi segni");
            }
          }
          if (H.premio.tipo === "togli" && !cSara) {
            var id2 = idDi(H, "Sara"), c = st.c[id2];
            if (c && !st.f[id2] && c.some(function (x) { return x != null; })) {
              cSara = c.slice();
              var w2 = await W.ricarica("Sara");
              okSara = !!await W.aspetta(function () {
                var pan = w2.document.querySelector(".pz-pan.su"), H2 = P.__prezzoH; if (!pan || !H2.premio || !H2.premio.st.c) return false;
                var ora = H2.premio.st.c[id2]; return ora && cifreViste(pan).length === 3 && JSON.stringify(cifreViste(pan)) === JSON.stringify(ora);
              }, 15000);
              if (!okSara) note.push("Sara dopo la ricarica non ritrova le sue cifre");
            }
          }
        } });
      sp.ferma();
      if (!ok) no("la partita online in 3 non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var tipi = controllaPremi(sp);
      if (!sLuca) note.push("(Luca non ha ricaricato: la Prova del 5 non è uscita?)");
      if (!cSara) note.push("(Sara non ha ricaricato: Togli la cifra non è uscito?)");
      if (okLuca === false || okSara === false) no(note.join(" · "));
      if (!sLuca || !cSara) no(note.join(" · "));
      Object.keys(sp.visti).forEach(function (k) { var v = sp.visti[k]; if (v.riv && giocato(v).some(function (x) { return !x; })) no(v.tipo + " online: qualcuno non ha giocato: " + JSON.stringify(v.riv.g)); });
      await W.dorme(9000);
      await W.aspetta(function () { var x = A.tastiFineDi(P); return x && x.some(function (y) { return /Rivincita/.test(y); }); }, 40000);   // (i tasti di fine arrivano dopo qualche secondo)
      var tf = A.tastiFineDi(P);
      if (!tf || !tf.some(function (x) { return /Rivincita/.test(x); })) no("a fine partita l'host non ha «↻ Rivincita» (" + JSON.stringify(tf) + ")");
      var cl = vm(C).classifica || [];
      if (cl.length !== 3) no("classifica: " + JSON.stringify(cl));
      return "giochi " + tipi + " · Luca ricarica ok " + okLuca + " · Sara ricarica ok " + okSara + " · classifica " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + (note.length ? " · " + note.join(" ") : "") + errori();
    } finally { PZ.senzaSpia(); }
  } });

  // ===================== pe5: le misure =====================
  function guaiMiei(w) {
    var d = w.document, h = w.innerHeight, ww = w.innerWidth, guai = PZ.controllaVista(w);
    var pan = d.querySelector(".pz-pan.su"), basso = h - (pan ? pan.offsetHeight : 0), sch = d.querySelector(".st-sch-in .pz-sch");
    if (sch && d.querySelector(".st-mondo.st-quieto")) [].forEach.call(sch.querySelectorAll(".pze-cinque,.pze-tre,.pze-c5,.pze-c3,.pze-num,.pze-gente,.pze-g,.pze-bn,.pz-tab,.pz-tag"), function (e) {
      var r = e.getBoundingClientRect(); if (!r.height) return;
      if (r.bottom > basso + 2) guai.push(e.className.split(" ")[0] + " sotto il pannello (" + Math.round(r.bottom) + ">" + Math.round(basso) + ")");
      var sr = sch.getBoundingClientRect(); if (r.top < sr.top - 1) guai.push(e.className.split(" ")[0] + " tagliato in alto");
      if (r.left < -1 || r.right > ww + 1) guai.push(e.className.split(" ")[0] + " esce di lato");
    });
    // i cartellini e i numeri non escono dalla loro carta
    if (sch) [].forEach.call(sch.querySelectorAll(".pze-c5 .pz-tag,.pze-c3 .pze-num,.pze-c3 .pz-tag"), function (e) {
      var c = e.closest(".pze-c5,.pze-c3").getBoundingClientRect(), r = e.getBoundingClientRect();
      if (r.width && (r.left < c.left - 1 || r.right > c.right + 1)) guai.push("«" + e.textContent + "» esce dalla carta");
    });
    if (pan) [].forEach.call(pan.querySelectorAll(".pze-r5,.pze-r3,.pze-fatto,.pze-t,.pze-gs,.pze-ant"), function (e) { var r = e.getBoundingClientRect(); if (r.height && (r.bottom > h + 1 || r.right > ww + 1 || r.left < -1)) guai.push(e.className.split(" ")[0] + " fuori dallo schermo"); });
    if (pan) [].forEach.call(pan.querySelectorAll(".pze-r5,.pze-r3"), function (e) { if (e.scrollWidth > e.clientWidth + 1) guai.push(e.className.split(" ")[0] + " troppo stretta (" + e.scrollWidth + ">" + e.clientWidth + ")"); });
    if (pan && (pan.querySelector(".pze-r5") || pan.querySelector(".pze-r3")) && pan.offsetHeight > h * 0.62) guai.push("pannello alto " + pan.offsetHeight + " su " + h);
    return guai;
  }
  COPIONE.aggiungi("pe5", { nome: "Premi E: le misure a 360x640, 412x915 e 360x780 (Bot in 6) nella Prova del 5 e in Togli la cifra", fai: async function () {
    var esiti = [], misure = W.__pe5misure || [[360, 640], [412, 915], [360, 780]];
    for (var m = 0; m < misure.length; m++) {
      var wh = misure[m];
      var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 5 }; } });
      await W.aspetta(function () { return soloMiei(w); }, 6000);
      var na = w.document.createElement("style"); na.textContent = "*{animation:none!important;transition:none!important}"; w.document.head.appendChild(na);
      var f = document.getElementById("tel-Paky"); f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize"));
      var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 5000);
      tess.click(); await W.dorme(300);
      W.clicca(w, /Contro il Bot/); await W.dorme(300);
      var visti = {}, guai = {}, fatti = {};
      await giocaTutti(["Paky"], function () { var H = w.__prezzoH; return H && (H.fase === "fine" || H.fase === "ruota"); }, { ms: 300000, passo: 500, ritmo: { Paky: 900 }, ognuno: async function () {
        var H = w.__prezzoH; if (!H || H.fase !== "premio" || !H.premio) return;
        var k = H.premio.tipo + "." + H.sotto;
        if ((visti[k] || 0) > 4) return;
        await W.dorme(H.sotto === "riv" ? 1700 : 900);
        visti[k] = (visti[k] || 0) + 1;
        guaiMiei(w).forEach(function (g) { guai[k + ": " + g] = 1; });
        fatti[k] = 1;
      } });
      MIEI.forEach(function (x) { if (!fatti[x + ".gioca"] || !fatti[x + ".riv"]) guai["«" + x + "» non visto (" + Object.keys(fatti) + ")"] = 1; });
      esiti.push(wh.join("x") + ": " + (Object.keys(guai).length ? Object.keys(guai).slice(0, 8).join(" | ") : "ok") + " (" + Object.keys(visti).map(function (k) { return k + "×" + visti[k]; }).join(" ") + ")");
      A.pulisci();
    }
    var male = esiti.filter(function (e) { return !/: ok/.test(e); });
    if (male.length) no(esiti.join(" ‖ "));
    return esiti.join(" ‖ ") + errori();
  } });

  W.PZE = { agisciE: agisciE, agisci: agisci, giocaTutti: giocaTutti, soloMiei: soloMiei, guaiMiei: guaiMiei };
})();
