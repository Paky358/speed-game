// PROVE DEI GIOCHI A PREMI DEL FILE D: «🎲 Il Gioco dei Dadi» e «🎯 Il Mirino» (js/games/prezzo-premi-d.js, 23 ott 2026).
// Uso: await COPIONE.carica("prezzo/base.js"); await COPIONE.carica("prezzo/premi-d.js"); await COPIONE.prova("pd1")
// (con Edge invisibile: prova.js --carica prezzo/base.js,…,prezzo/premi-d.js --prova pd1,pd2)
// In tutte le partite restano registrati SOLO questi due giochi a premi (così escono di sicuro).
// Il giocatore automatico di questi due è W.PZD.agisciD (come W.PZN.agisciN del file c).
//
// pd1: le regole senza grafica (Dadi: prezzi di 4 cifre, dadi da 1 a 6 uguali per tutti, la scelta spenta, i punti 200 + 60 a
//      cifra + 150 tutte, le mosse cattive, i segreti per chi ricarica, i Bot; Mirino: la scala con numeri tondi e il prezzo
//      sparso tra il 10% e il 90% (non sempre a metà né sempre in basso), i punti 600/350/200/75/0, chi non tocca resta in
//      cima, una mossa sola, i Bot; il prezzo mai nella foto pubblica; le durate delle rivelazioni).
// pd2: «🤖 Contro il Bot», 📺 Puntata: escono tutti e due, i Bot giocano, 4 righe nei Dadi e 4 finestrelle nel Mirino; il
//      giocatore bravo fa il massimo (530 e 600).
// pd3: sullo stesso telefono in 3, 📺 ⚡ Veloce: i due giochi a turno («📱 Sono Luca, tocca a me»), ognuno con la sua salita.
// pd4: online nella Sala in 3, 📺 ⚡ Veloce: Luca ricarica a metà Dadi (ritrova le sue scelte), Sara ricarica mentre la
//      finestrella sale (la ritrova alla stessa altezza, non da capo) e poi la ferma; partita fino alla fine e tasti del core.
// pd5: le misure a 360x640, 412x915 e 360x780 (Galaxy S25) mentre si gioca e nella rivelazione (Bot in 6).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, PZ = W.PZ;
  if (!PZ) throw new Error("prima carica prezzo/base.js");
  var MIEI = ["dadi", "mirino"];
  function vm(C) { return W.vmDi(C) || {}; }
  function soloMiei(w) { var R = w && w.SG_PREZZO_PREMI; if (!R) return false; Object.keys(R).forEach(function (k) { if (MIEI.indexOf(k) < 0) delete R[k]; }); return !!(R.dadi && R.mirino); }
  function Hdi(nome) { var w = W.finestra(nome || "Paky"); return w && w.__prezzoH; }
  function idDi(H, nome) { var p = (H.players || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  function tocca(w, b) { if (!b || b.disabled) return false; b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" })); return true; }
  function errori() { var e = W.erroriTel(); return e.length ? " · ERRORI: " + e.slice(0, 3).join(" / ") : ""; }
  function giusta(c, d) { return c > d ? "su" : c === d ? "ug" : "giu"; }
  // dove sta la finestrella nel pannello (0 = in fondo, 0,9 = in cima): dal transform del pezzo che sale
  function altezza(pan) { var m = pan && pan.querySelector(".pzd-mov"), r = m && /translateY\((-?[\d.]+)%\)/.exec(m.style.transform || ""); return r ? -(+r[1]) / 100 : null; }

  // ---------------- il giocatore automatico dei due giochi ----------------
  // opz.bravo (o opz.precisi[nome]): tutte le cifre giuste e il prezzo a metà finestrella; se no l'ultima cifra sbagliata e la
  // finestrella ferma più su del prezzo (fuori)
  var STATO = {};
  async function agisciD(nome, opz) {
    opz = opz || {};
    if (opz.salta && opz.salta(nome)) return false;
    var w = W.finestra(nome); if (!w || !w.document) return false;
    var d = w.document, H = Hdi(opz.host), pan = d.querySelector(".pz-pan.su");
    if (!(pan && H && H.premio && H.premio.st && H.fase === "premio" && H.sotto === "gioca" && MIEI.indexOf(H.premio.tipo) >= 0)) return false;
    var st = H.premio.st, k = STATO[nome] = STATO[nome] || {}, bravo = opz.bravo || (opz.precisi && opz.precisi[nome]);
    if (H.premio.tipo === "dadi") {
      var fatto = pan.querySelector(".pzd-fatto"), cols = [].slice.call(pan.querySelectorAll(".pzd-col"));
      if (!fatto || cols.length !== st.dadi.length || /Tempo|Fatto/.test(fatto.textContent) && fatto.disabled) return false;
      if (k.ultimo && Date.now() - k.ultimo < ((opz.ritmo && opz.ritmo[nome]) || 250)) return false;
      k.ultimo = Date.now();
      for (var i = 0; i < cols.length; i++) {
        var meta = giusta(+st.vero[i], st.dadi[i]);
        if (!bravo && i === cols.length - 1) meta = meta === "su" ? "giu" : "su";
        var b = cols[i].querySelector(".pzd-sc." + meta);
        if (b && !b.classList.contains("sel")) return tocca(w, b);
      }
      return tocca(w, fatto);
    }
    // il Mirino: si tocca «Stop!» quando la finestrella arriva dove serve
    var stop = pan.querySelector(".pzd-stop"); if (!stop || stop.disabled) return false;
    var sp = st.b - st.a, f = (st.prod.prezzo - st.a) / sp, q = bravo ? Math.max(0, f - 0.05) : (f + 0.16 <= 0.9 ? f + 0.16 : Math.max(0, f - 0.36));
    if (opz.mira && opz.mira[nome] != null) q = opz.mira[nome];
    var p = altezza(pan); if (p == null || p < q - 0.004) return false;
    return tocca(w, stop);
  }
  async function agisci(nome, opz) { return (await agisciD(nome, opz)) || PZ.agisci(nome, opz); }
  async function giocaTutti(nomi, finito, opz) {
    opz = opz || {};
    var fino = Date.now() + (opz.ms || 420000), giri = 0;
    while (Date.now() < fino) {
      if (finito()) return true;
      for (var i = 0; i < nomi.length; i++) { try { await agisci(nomi[i], opz); } catch (e) {} }
      if (opz.ognuno) await opz.ognuno(++giri);
      await W.dorme(opz.passo || 150);
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
      Object.keys(v.punti).forEach(function (id) { var p = v.punti[id]; if (!(p >= 0 && p <= 600)) no(k + ": punti strani per " + id + ": " + p); });
    });
    return Object.keys(t).map(function (x) { return x + "×" + t[x]; }).join(", ");
  }
  // chi ha giocato davvero (nei dati della rivelazione): i Dadi hanno le scelte, nel Mirino la finestrella si è fermata
  function giocato(v) { return (v.riv.g || []).map(function (x) { return v.tipo === "dadi" ? !!(x.s && x.s.every(function (c) { return !!c; })) : !!x.fermo; }); }

  // ===================== pd1: le regole =====================
  COPIONE.aggiungi("pd1", { nome: "Premi D: le regole dei Dadi e del Mirino, senza grafica", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return w.SG_PREZZO_PREMI && w.SG_PREZZO_PREMI.dadi && w.SG_PREZZO_PREMI.mirino; }, 6000)) no("i due giochi a premi non sono registrati");
    var R = w.SG_PREZZO_PREMI, tutti = w.SG_PREZZO.prodotti;
    if (R.dadi.ordine !== 8 || R.mirino.ordine !== 9) no("ordine: " + R.dadi.ordine + " / " + R.mirino.ordine);
    [R.dadi, R.mirino].forEach(function (g) { if (!g.regola || g.regola.length > 110 || /omino/i.test(g.regola)) no("la regola di «" + g.nome + "»: " + g.regola); });
    function Pfinto(ids) {
      var usati = {}, fatti = {}, privati = [];
      return { ids: ids, n: ids.length, modo: "online", locale: false, nome: function (id) { return id; }, rnd: Math.random,
        mescola: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
        pesca: function (f, n) { var l = this.mescola(tutti.filter(function (p) { return !usati[p.id] && (!f || f(p)); })).slice(0, n || 1); l.forEach(function (p) { usati[p.id] = 1; }); return l.map(function (p) { return JSON.parse(JSON.stringify(p)); }); },
        passo: w.SGPrezzoScena.passo, arrotonda: w.SGPrezzoScena.arrotonda, tondo2: function (v) { return Math.round(v * 100) / 100; },
        privato: function (id, m) { privati.push([id, m]); }, fatto: function (id) { fatti[id] = 1; }, _fatti: fatti };
    }
    // --- I Dadi ---
    var dg = R.dadi, facce = {}, quattro = 0, unoPrima = 0;
    for (var t = 0; t < 150; t++) {
      var Pd = Pfinto(["a"]), sd = dg.prepara(Pd);
      if (/^\d{4}$/.test(sd.vero)) quattro++;
      if (String(Math.round(sd.prod.prezzo)) !== sd.vero) no("Dadi: il prezzo vero non è quello del prodotto: " + sd.vero + " / " + sd.prod.prezzo);
      if (sd.dadi.length !== sd.vero.length) no("Dadi: un dado per cifra: " + sd.dadi + " / " + sd.vero);
      sd.dadi.forEach(function (x) { if (!(x >= 1 && x <= 6 && x === Math.floor(x))) no("Dadi: dado strano " + x); facce[x] = 1; });
      if (sd.dadi[0] === 1) unoPrima++;
    }
    if (quattro < 150) no("Dadi: prezzi non da 4 cifre " + (150 - quattro) + " volte su 150");
    if (Object.keys(facce).length !== 6) no("Dadi: non escono tutte le facce: " + Object.keys(facce));
    var P = Pfinto(["a", "b", "c", "d", "e", "f"]), st = dg.prepara(P);
    st.vero = "2590"; st.dadi = [1, 5, 6, 3]; st.prod.prezzo = 2590;   // (un caso fisso: 2 > 1, 5 = 5, 9 > 6, 0 < 3)
    var pub = JSON.stringify(dg.pubblico(st, P));
    if (/prezzo|2590/.test(pub)) no("Dadi: il prezzo è nella foto pubblica: " + pub.slice(0, 200));
    if (JSON.stringify(dg.pubblico(st, P).dadi) !== "[1,5,6,3]") no("Dadi: i dadi non sono nella foto pubblica");
    dg.mossa(st, "a", { s: ["su", "ug", "su", "giu"], fine: 1, ms: 8000 }, P);       // tutte giuste: 200 + 3×60 + 150 = 530
    dg.mossa(st, "b", { s: ["ug", "ug", "su", "giu"] }, P);                           // la prima sbagliata: 180 (vale allo scadere)
    dg.mossa(st, "c", { s: ["su", "su", "giu", "su"], fine: 1 }, P);                  // solo la prima: 200
    dg.mossa(st, "d", { s: ["giu", "ug", "su", "giu"], fine: 1 }, P);                 // ⬇️ sulla prima col dado a 1 non si può: vale come non scelta → 180
    dg.mossa(st, "e", { s: ["su", "ug"] }, P); dg.mossa(st, "e", { s: ["su", "x", "su", "giu", "su"] }, P);   // mosse cattive
    dg.mossa(st, "a", { s: ["ug", "su", "giu", "su"] }, P);                           // dopo «Fatto» non si cambia più
    if (!P._fatti.a || P._fatti.b || !P._fatti.c || !P._fatti.d || P._fatti.e) no("Dadi: «fatto» solo con «✅ Fatto!»: " + JSON.stringify(P._fatti));
    if (st.s.d[0] !== null) no("Dadi: la scelta spenta è passata: " + JSON.stringify(st.s.d));
    if (st.s.e) no("Dadi: una mossa cattiva è passata: " + JSON.stringify(st.s.e));
    var f = dg.fine(st, P), pt = f.punti;
    if (pt.a !== 530 || pt.b !== 180 || pt.c !== 200 || pt.d !== 180 || pt.e !== 0 || pt.f !== 0) no("Dadi: punti 530/180/200/180/0/0, invece " + JSON.stringify(pt));
    if (!f.carrello.a || f.carrello.b || f.carrello.c) no("Dadi: a casa il premio solo chi le indovina tutte");
    var ps = dg.privatoDi(st, "b", P);
    if (!ps || ps.f || ps.s.join(",") !== "ug,ug,su,giu" || !dg.privatoDi(st, "a", P).f || dg.privatoDi(st, "f", P)) no("Dadi: i segreti per chi ricarica: " + JSON.stringify(ps));
    var dur = dg.durata(f.riv, P); if (!(dur > 7000 && dur < 14000)) no("Dadi: durata della rivelazione " + dur);
    // i Bot: mosse valide entro i 25 secondi, il difficile prende più punti del facile
    function puntiBot(liv) { var s = 0; for (var q = 0; q < 300; q++) { var Pq = Pfinto(["x"]), sq = dg.prepara(Pq), m = dg.bot(sq, { id: "x", livello: liv }, Pq); if (m.some(function (x) { return !(x.ms > 0 && x.ms < 25000); })) no("Dadi: mossa del Bot fuori tempo"); m.forEach(function (x) { dg.mossa(sq, "x", x.m, Pq); }); if (!Pq._fatti.x) no("Dadi: il Bot non finisce"); s += dg.fine(sq, Pq).punti.x; } return Math.round(s / 300); }
    var bd = puntiBot("difficile"), bf = puntiBot("facile");
    if (!(bd > bf)) no("Dadi: il Bot difficile non fa più punti del facile (" + bd + " / " + bf + ")");
    // --- Il Mirino ---
    var mi = R.mirino, ff = [], larghe = [], zeri = 0, tondi = 0, N = 400;
    for (var u = 0; u < N; u++) {
      var Pm = Pfinto(["a"]), sm = mi.prepara(Pm), pr = sm.prod.prezzo, spm = sm.b - sm.a, fr = (pr - sm.a) / spm;
      if (!(pr >= 30 && pr <= 30000)) no("Mirino: prezzo fuori fascia " + pr);
      if (!(sm.a > 0) || !(sm.b > sm.a)) zeri++;
      if (!(fr >= 0.1 - 1e-9 && fr <= 0.9 + 1e-9)) no("Mirino: prezzo fuori dal 10-90% della scala: " + pr + " su " + sm.a + "-" + sm.b);
      var k10 = Math.pow(10, Math.floor(Math.log(spm) / Math.LN10 + 1e-9)), m10 = Math.round(spm / k10 * 100) / 100;
      if ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].indexOf(m10) >= 0) tondi++;
      ff.push(fr); larghe.push(spm / pr);
    }
    if (zeri) no("Mirino: scale che partono da 0 o sbagliate: " + zeri);
    if (tondi < N) no("Mirino: larghezze non tonde " + (N - tondi) + " su " + N);
    var media = ff.reduce(function (s, x) { return s + x; }, 0) / N, alti = ff.filter(function (x) { return x > 0.6; }).length / N, bassi = ff.filter(function (x) { return x < 0.4; }).length / N, metà = ff.filter(function (x) { return x > 0.45 && x < 0.55; }).length / N;
    if (!(media > 0.42 && media < 0.58) || alti < 0.25 || bassi < 0.25 || metà > 0.25) no("Mirino: dove sta il prezzo sulla scala: media " + media.toFixed(2) + ", sopra il 60% " + alti.toFixed(2) + ", sotto il 40% " + bassi.toFixed(2) + ", a metà " + metà.toFixed(2));
    larghe.sort(function (x, y) { return x - y; });
    var P2 = Pfinto(["a", "b", "c", "d", "e", "f", "g"]), s2 = mi.prepara(P2);
    s2.prod.prezzo = 1500; s2.a = 1000; s2.b = 3000;   // (un caso fisso: il prezzo al 25% della scala; finestrella = 200 €)
    var pub2 = JSON.stringify(mi.pubblico(s2, P2));
    if (/prezzo|1500/.test(pub2)) no("Mirino: il prezzo è nella foto pubblica: " + pub2.slice(0, 200));
    mi.mossa(s2, "a", { p: 0.2, ms: 9000 }, P2);    // 1.400-1.600: dentro → 600
    mi.mossa(s2, "b", { p: 0.27 }, P2);             // 1.540-1.740: fuori di 40 € (0,02 della scala) → 350
    mi.mossa(s2, "c", { p: 0.33 }, P2);             // 1.660-1.860: fuori di 0,08 → 200
    mi.mossa(s2, "d", { p: 0.4 }, P2);              // 1.800-2.000: fuori di 0,15 → 75
    mi.mossa(s2, "e", { p: 0.6 }, P2);              // 2.200-2.400: fuori di 0,35 → 0
    mi.mossa(s2, "g", { p: 1.4 }, P2); mi.mossa(s2, "g", { p: "x" }, P2); mi.mossa(s2, "g", { p: -0.3 }, P2);   // mosse cattive
    mi.mossa(s2, "a", { p: 0.7 }, P2);              // una volta sola
    if (!P2._fatti.a || !P2._fatti.e || P2._fatti.f || P2._fatti.g) no("Mirino: «fatto» con lo Stop, una volta: " + JSON.stringify(P2._fatti));
    var f2 = mi.fine(s2, P2), p2 = f2.punti;
    if (p2.a !== 600 || p2.b !== 350 || p2.c !== 200 || p2.d !== 75 || p2.e !== 0) no("Mirino: punti 600/350/200/75/0, invece " + JSON.stringify(p2));
    var gf = f2.riv.g.filter(function (x) { return x.id === "f"; })[0];
    if (!gf || gf.fermo || Math.abs(gf.p - 0.9) > 1e-9 || p2.f !== 0) no("Mirino: chi non tocca resta in cima (0 punti): " + JSON.stringify(gf));
    if (!f2.carrello.a || f2.carrello.b) no("Mirino: a casa il premio solo chi ha il prezzo dentro");
    if (!mi.privatoDi(s2, "c", P2) || Math.abs(mi.privatoDi(s2, "c", P2).p - 0.33) > 1e-9 || mi.privatoDi(s2, "f", P2)) no("Mirino: i segreti per chi ricarica");
    var dur2 = mi.durata(f2.riv, P2); if (!(dur2 > 6000 && dur2 < 14000)) no("Mirino: durata della rivelazione " + dur2);
    function distBot(liv) { var s = 0, dentro = 0; for (var q = 0; q < 300; q++) { var Pq = Pfinto(["x"]), sq = mi.prepara(Pq), m = mi.bot(sq, { id: "x", livello: liv }, Pq); if (m.length !== 1 || !(m[0].ms > 2000 && m[0].ms < 20000)) no("Mirino: mossa del Bot fuori tempo: " + JSON.stringify(m)); mi.mossa(sq, "x", m[0].m, Pq); var g0 = mi.fine(sq, Pq).riv.g[0]; s += g0.d; if (!g0.d) dentro++; } return { d: s / 300, dentro: dentro }; }
    var md = distBot("difficile"), mf = distBot("facile");
    if (!(md.d < mf.d) || !(md.dentro > mf.dentro)) no("Mirino: il Bot difficile non va più vicino del facile (" + JSON.stringify(md) + " / " + JSON.stringify(mf) + ")");
    return "Dadi: 2.590 coi dadi 1·5·6·3 = 530/180/200/180, Bot difficile " + bd + " facile " + bf + " punti in media · Mirino: scala larga " + larghe[N * 0.1 | 0].toFixed(2) + "-" + larghe[N * 0.9 | 0].toFixed(2) + " volte il prezzo, il prezzo in media al " + Math.round(media * 100) + "% (sopra il 60%: " + Math.round(alti * 100) + "%, sotto il 40%: " + Math.round(bassi * 100) + "%), punti 600/350/200/75/0, Bot dentro difficile " + md.dentro + "/300 facile " + mf.dentro + "/300" + errori();
  } });

  // ===================== pd2: col Bot =====================
  COPIONE.aggiungi("pd2", { nome: "Premi D: 🤖 Contro il Bot, 📺 Puntata: i Dadi e il Mirino", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "puntata", offerte: "vista", liv: "medio", nBot: 3 }; } });
    if (!await W.aspetta(function () { return soloMiei(w); }, 6000)) no("i due giochi a premi non sono registrati");
    var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 5000);
    tess.click(); await W.dorme(300);
    if (!W.clicca(w, /Contro il Bot/)) no("niente «🤖 Contro il Bot»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita col Bot non parte al secondo tocco");
    var sp = spiaPremi("Paky"), viste = PZ.spiaFasi("Paky"), righe = 0, fin = 0, pan = {}, freccia = false, girate = 0;
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH && w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000, bravo: true,
      ognuno: function () {
        var d = w.document;
        if (d.querySelector(".pzd-rg")) righe = Math.max(righe, d.querySelectorAll(".pzd-rg").length);
        if (d.querySelector(".pzd-rw.su")) fin = Math.max(fin, d.querySelectorAll(".pzd-rw").length);
        if (d.querySelector(".pzd-frec .pzd-tag.su")) freccia = true;
        girate = Math.max(girate, d.querySelectorAll(".pzd-fila.riv .pzd-cf.su").length);
        if (d.querySelector(".pz-pan.su .pzd-sc")) pan.dadi = 1;
        if (d.querySelector(".pz-pan.su .pzd-stop")) pan.mirino = 1;
      } });
    sp.ferma(); viste.ferma();
    if (!ok) no("la partita col Bot non finisce (" + viste.viste.join(" → ") + ")");
    var tipi = controllaPremi(sp);
    if (righe !== 4) no("nei Dadi dovevano esserci 4 righe: " + righe);
    if (girate !== 4) no("nei Dadi dovevano girarsi 4 cifre: " + girate);
    if (fin !== 4) no("nel Mirino dovevano esserci 4 finestrelle: " + fin);
    if (!freccia) no("nel Mirino non si è vista la freccia col prezzo");
    if (!pan.dadi || !pan.mirino) no("non si è visto il pannello di tutti e due: " + JSON.stringify(pan));
    var mie = [];
    Object.keys(sp.visti).forEach(function (k) {
      var v = sp.visti[k]; if (!v.riv) return;
      var gi = giocato(v); if (gi.some(function (x) { return !x; })) no(v.tipo + ": qualcuno non ha giocato: " + JSON.stringify(v.riv.g));
      var io = (v.riv.g || []).filter(function (x) { return x.id === "host"; })[0], max = v.tipo === "dadi" ? 530 : 600;
      if (io) mie.push(v.tipo + " " + v.punti.host + (v.tipo === "dadi" ? " (" + io.n + " su 4)" : " (" + (io.d ? "fuori" : "dentro") + ")"));
      if (io && v.punti.host !== max) no(v.tipo + ": il giocatore bravo doveva fare " + max + ": " + v.punti.host + " " + JSON.stringify(io));
    });
    return "giochi " + tipi + " · i miei: " + mie.join(", ") + " · classifica " + (w.__prezzoH.classifica || []).map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + errori();
  } });

  // ===================== pd3: sullo stesso telefono =====================
  COPIONE.aggiungi("pd3", { nome: "Premi D: 📱 sullo stesso telefono in 3, i Dadi e il Mirino a turno", fai: async function () {
    var w = await PZ.stessoTelefono(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "segrete" });
    soloMiei(w);
    if (!await W.aspetta(function () { return W.clicca(w, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita non comincia");
    soloMiei(w);
    var sp = spiaPremi("Paky"), turni = {}, partenze = [], ultimo = null;
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000,
      ognuno: function () {
        var H = w.__prezzoH, pan = w.document.querySelector(".pz-pan.su"), t = pan && pan.querySelector(".pz-pan-testa .tx");
        if (H.fase === "premio" && H.sotto === "gioca" && t) {
          var m = /^(\S+) · /.exec(t.textContent); if (m) (turni[H.premio.tipo] = turni[H.premio.tipo] || {})[m[1]] = 1;
          // nel Mirino ognuno ha la sua salita: quando cambia chi gioca, la finestrella riparte dal fondo
          if (H.premio.tipo === "mirino" && m && m[1] !== ultimo) { ultimo = m[1]; partenze.push(altezza(pan)); }
        }
      } });
    sp.ferma();
    if (!ok) no("sullo stesso telefono la partita non finisce (fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + ")");
    var tipi = controllaPremi(sp);
    MIEI.forEach(function (x) { if (Object.keys(turni[x] || {}).length !== 3) no("«" + x + "»: il telefono non è passato a tutti e tre: " + JSON.stringify(turni[x])); });
    if (partenze.length < 3 || partenze.some(function (p) { return !(p != null && p < 0.06); })) no("nel Mirino a turno la finestrella non riparte dal fondo per ognuno: " + JSON.stringify(partenze));
    Object.keys(sp.visti).forEach(function (k) { var v = sp.visti[k]; if (v.riv && giocato(v).some(function (x) { return !x; })) no(v.tipo + " a turno: qualcuno non ha giocato " + JSON.stringify(v.riv.g)); });
    return "giochi " + tipi + " · turni " + JSON.stringify(turni) + " · partenze della finestrella " + JSON.stringify(partenze) + errori();
  } });

  // ===================== pd4: online nella Sala, chi ricarica =====================
  COPIONE.aggiungi("pd4", { nome: "Premi D online nella Sala in 3: chi ricarica a metà Dadi e mentre la finestrella sale", fai: async function () {
    PZ.conSpia();
    try {
      var X = await PZ.salaPrezzo(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [];
      ["Paky", "Luca", "Sara"].forEach(function (n) { soloMiei(W.finestra(n)); });
      var sp = spiaPremi("Paky"), sLuca = null, okLuca = null, saraFatta = false, okSara = null, okStop = null, altPrima = null, altDopo = null, attesa = null;
      var ok = await giocaTutti(["Paky", "Luca", "Sara"], function () { return vm(C).fase === "fine"; }, { ms: 480000, ritmo: { Luca: 2500 },
        // Sara aspetta a fermare la finestrella finché non ha ricaricato (poi la ferma in cima alla sua idea)
        salta: function (n) { var H = P.__prezzoH; return n === "Sara" && !saraFatta && H.premio && H.premio.tipo === "mirino"; },
        ognuno: async function () {
          var H = P.__prezzoH; if (!H.premio || H.fase !== "premio" || H.sotto !== "gioca") return;
          var st = H.premio.st;
          if (H.premio.tipo === "dadi" && !sLuca) {
            var id = idDi(H, "Luca"), s = st.s[id];
            if (s && !st.f[id] && s.some(function (x) { return !!x; })) {
              sLuca = s.slice();
              var w = await W.ricarica("Luca");
              okLuca = !!await W.aspetta(function () {
                var cols = [].slice.call(w.document.querySelectorAll(".pz-pan.su .pzd-col")), ora = P.__prezzoH.premio && P.__prezzoH.premio.st.s && P.__prezzoH.premio.st.s[id];
                if (cols.length !== 4 || !ora) return false;
                return cols.every(function (c, i) { var sel = c.querySelector(".pzd-sc.sel"); return ora[i] ? !!sel && sel.classList.contains(ora[i]) : !sel; });
              }, 15000);
              if (!okLuca) note.push("Luca dopo la ricarica non ritrova le sue scelte (" + JSON.stringify(sLuca) + ")");
            }
          }
          if (H.premio.tipo === "mirino" && !saraFatta) {
            var w2 = W.finestra("Sara"), pan = w2 && w2.document.querySelector(".pz-pan.su .pzd-stop") && w2.document.querySelector(".pz-pan.su");
            var a = altezza(pan);
            if (a != null && a > 0.15) {
              altPrima = a;
              w2 = await W.ricarica("Sara");
              var trovata = await W.aspetta(function () { var p2 = w2.document.querySelector(".pz-pan.su"); return p2 && p2.querySelector(".pzd-stop") && altezza(p2); }, 15000);
              // (la prima foto che arriva è quella vecchia rimasta nella stanza: si guarda dopo che è arrivata quella nuova)
              if (trovata) await W.dorme(1500);
              altDopo = trovata ? altezza(w2.document.querySelector(".pz-pan.su")) : null;
              // dove dovrebbe essere adesso: la salita finisce 1,5 s prima della fine del tempo dell'host
              var inizio = P.__prezzoH.scadenza - 1500 - 16500; attesa = 0.9 * Math.max(0, Math.min(1, (Date.now() - inizio) / 16500));
              okSara = altDopo != null && altDopo > 0.1 && Math.abs(altDopo - attesa) < 0.03;
              if (!okSara) note.push("Sara dopo la ricarica ritrova la finestrella a " + altDopo + " invece di " + attesa.toFixed(3) + " (prima era a " + altPrima.toFixed(3) + ")");
              saraFatta = true;
              // e adesso la ferma: l'host deve avere la stessa altezza che vede lei
              var sid = idDi(P.__prezzoH, "Sara");
              if (await W.aspetta(function () { var p3 = w2.document.querySelector(".pz-pan.su .pzd-stop"); return p3 && !p3.disabled && tocca(w2, p3); }, 3000)) {
                var visto = altezza(w2.document.querySelector(".pz-pan.su"));
                okStop = !!await W.aspetta(function () { var st2 = P.__prezzoH.premio && P.__prezzoH.premio.st; return st2 && st2.p && st2.p[sid] != null && Math.abs(st2.p[sid] - visto) < 0.003; }, 5000);
                if (!okStop) note.push("Sara ferma a " + visto + " ma l'host ha " + JSON.stringify(P.__prezzoH.premio && P.__prezzoH.premio.st.p));
              } else note.push("(Sara non ha trovato «Stop!» dopo la ricarica)");
            }
          }
        } });
      sp.ferma();
      if (!ok) no("la partita online in 3 non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var tipi = controllaPremi(sp);
      if (!sLuca) note.push("(Luca non ha ricaricato: i Dadi non sono usciti?)");
      if (!saraFatta) note.push("(Sara non ha ricaricato: il Mirino non è uscito?)");
      if (okLuca === false || okSara === false || okStop === false || !sLuca || !saraFatta) no(note.join(" · "));
      await W.dorme(9000);
      await W.aspetta(function () { var x = A.tastiFineDi(P); return x && x.some(function (y) { return /Rivincita/.test(y); }); }, 40000);   // (i tasti di fine arrivano dopo qualche secondo)
      var tf = A.tastiFineDi(P);
      if (!tf || !tf.some(function (x) { return /Rivincita/.test(x); })) no("a fine partita l'host non ha «↻ Rivincita» (" + JSON.stringify(tf) + ")");
      var cl = vm(C).classifica || [];
      if (cl.length !== 3) no("classifica: " + JSON.stringify(cl));
      return "giochi " + tipi + " · Luca ricarica ok " + okLuca + " · Sara: finestrella a " + (altPrima || 0).toFixed(3) + " → dopo la ricarica " + (altDopo || 0).toFixed(3) + " (doveva essere " + (attesa || 0).toFixed(3) + "), Stop ok " + okStop + " · classifica " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + (note.length ? " · " + note.join(" ") : "") + errori();
    } finally { PZ.senzaSpia(); }
  } });

  // ===================== pd5: le misure =====================
  function guaiMiei(w) {
    var d = w.document, h = w.innerHeight, ww = w.innerWidth, guai = PZ.controllaVista(w);
    var pan = d.querySelector(".pz-pan.su"), basso = h - (pan ? pan.offsetHeight : 0), sch = d.querySelector(".st-sch-in .pz-sch");
    if (sch && d.querySelector(".st-mondo.st-quieto")) [].forEach.call(sch.querySelectorAll(".pzd-fila,.pzd-dc,.pzd-righe,.pzd-rg,.pzd-tra,.pzd-rv,.pzd-rfw,.pzd-fc,.pzd-bn,.pzd-sotto,.pz-tab,.pz-miniprod"), function (e) {
      var r = e.getBoundingClientRect(); if (!r.height) return;
      if (r.bottom > basso + 2) guai.push(e.className.split(" ")[0] + " sotto il pannello (" + Math.round(r.bottom) + ">" + Math.round(basso) + ")");
      var sr = sch.getBoundingClientRect(); if (r.top < sr.top - 1) guai.push(e.className.split(" ")[0] + " tagliato in alto");
      if (r.left < -1 || r.right > ww + 1) guai.push(e.className.split(" ")[0] + " esce di lato");
    });
    if (pan) [].forEach.call(pan.querySelectorAll(".pzd-sc,.pzd-fatto,.pzd-tav,.pzd-stop,.pzd-scala,.pzd-rng"), function (e) { var r = e.getBoundingClientRect(); if (r.height && (r.bottom > h + 1 || r.right > ww + 1 || r.left < -1)) guai.push(e.className.split(" ")[0] + " fuori dallo schermo"); });
    if (pan) [].forEach.call(pan.querySelectorAll(".pzd-sc small"), function (e) { if (e.scrollWidth > e.parentNode.clientWidth + 1) guai.push("la scritta «" + e.textContent + "» non ci sta nel tasto"); });
    if (pan && (pan.querySelector(".pzd-sc") || pan.querySelector(".pzd-stop")) && pan.offsetHeight > h * 0.62) guai.push("pannello alto " + pan.offsetHeight + " su " + h);
    return guai;
  }
  COPIONE.aggiungi("pd5", { nome: "Premi D: le misure a 360x640, 412x915 e 360x780 (Bot in 6) nei Dadi e nel Mirino", fai: async function () {
    var esiti = [], misure = W.__pd5misure || [[360, 640], [412, 915], [360, 780]];
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
      await giocaTutti(["Paky"], function () { var H = w.__prezzoH; return H && (H.fase === "fine" || H.fase === "ruota"); }, { ms: 300000, passo: 300, ritmo: { Paky: 900 }, ognuno: async function () {
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

  W.PZD = { agisciD: agisciD, agisci: agisci, giocaTutti: giocaTutti, soloMiei: soloMiei, guaiMiei: guaiMiei };
})();
