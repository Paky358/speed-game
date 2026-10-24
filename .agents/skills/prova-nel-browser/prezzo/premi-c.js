// PROVE DEI GIOCHI A PREMI DEL FILE C: «🛒 La Spesa» e «🔐 La Cassaforte» (js/games/prezzo-premi-c.js, 23 ott 2026).
// Uso: await COPIONE.carica("prezzo/base.js"); await COPIONE.carica("prezzo/premi-c.js"); await COPIONE.prova("pn1")
// In tutte le partite restano registrati SOLO questi due giochi a premi (così escono di sicuro).
// Il giocatore automatico di questi due (W.PZN.agisciN) lo usa anche prezzo/controllo.js, se caricato prima.
//
// pn1: le regole senza grafica (punti della Spesa nella fascia, vicino, lontano, carrello vuoto, mosse cattive; la Cassaforte:
//      prezzi adatti, cifre mescolate senza 0 davanti e senza cifre già a posto, 60 a cifra + 400 aperta; il prezzo mai nella
//      foto pubblica; i Bot fanno mosse valide e il difficile è più bravo del facile; le durate delle rivelazioni).
// pn2: «🤖 Contro il Bot», 📺 Puntata: escono tutti e due, i Bot giocano, 4 corsie e 4 casseforti nella rivelazione.
// pn3: sullo stesso telefono in 3, 📺 ⚡ Veloce: i due giochi a turno («📱 Sono Luca, tocca a me»).
// pn4: online nella Sala in 3, 📺 ⚡ Veloce: Luca ricarica a metà Spesa (ritrova il carrello), Sara ricarica a metà Cassaforte
//      (ritrova la sua combinazione), partita fino alla fine e tasti del core.
// pn5: le misure a 360x640, 412x915 e 360x780 (Galaxy S25) mentre si gioca e nella rivelazione (Bot in 6).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, PZ = W.PZ;
  if (!PZ) throw new Error("prima carica prezzo/base.js");
  var MIEI = ["spesa", "cassaforte"];
  function vm(C) { return W.vmDi(C) || {}; }
  function soloMiei(w) { var R = w && w.SG_PREZZO_PREMI; if (!R) return false; Object.keys(R).forEach(function (k) { if (MIEI.indexOf(k) < 0) delete R[k]; }); return !!(R.spesa && R.cassaforte); }
  function Hdi(nome) { var w = W.finestra(nome || "Paky"); return w && w.__prezzoH; }
  function idDi(H, nome) { var p = (H.players || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  function tocca(w, b) { if (!b || b.disabled) return false; b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" })); return true; }
  function errori() { var e = W.erroriTel(); return e.length ? " · ERRORI: " + e.slice(0, 3).join(" / ") : ""; }

  // ---------------- il giocatore automatico dei due giochi ----------------
  // opz.bravo (o opz.precisi[nome]): la spesa nella fascia e la cassaforte aperta; se no un carrello troppo pieno e due cifre scambiate
  var STATO = {};
  function carrelloGiusto(prod) {
    var q = prod.map(function () { return 0; }), t = 0;
    for (var giro = 0; giro < 200 && t < 20; giro++) { var i = giro % prod.length; if (q[i] < 9 && t + prod[i].prezzo <= 21.9) { q[i]++; t += prod[i].prezzo; } }
    return q;
  }
  async function agisciN(nome, opz) {
    opz = opz || {};
    var w = W.finestra(nome); if (!w || !w.document) return false;
    var d = w.document, H = Hdi(opz.host), pan = d.querySelector(".pz-pan.su");
    if (!(pan && H && H.premio && H.premio.st && H.fase === "premio" && H.sotto === "gioca" && MIEI.indexOf(H.premio.tipo) >= 0)) return false;
    var st = H.premio.st, k = STATO[nome] = STATO[nome] || {}, bravo = opz.bravo || (opz.precisi && opz.precisi[nome]);
    var fatto = pan.querySelector(".pzc-fatto"); if (!fatto || fatto.disabled) return false;
    if (k.ultimo && Date.now() - k.ultimo < ((opz.ritmo && opz.ritmo[nome]) || 250)) return false;
    k.ultimo = Date.now();
    if (H.premio.tipo === "spesa") {
      var righe = [].slice.call(pan.querySelectorAll(".pzc-sr")); if (righe.length !== st.prod.length) return false;
      var meta = carrelloGiusto(st.prod); if (!bravo) meta = meta.map(function (x) { return Math.min(9, x + 2); });
      for (var i = 0; i < righe.length; i++) {
        var q = +righe[i].querySelector(".pzc-q").textContent;
        if (q < meta[i]) return tocca(w, righe[i].querySelector(".pzc-pm.piu"));
        if (q > meta[i]) return tocca(w, righe[i].querySelector(".pzc-pm:not(.piu)"));
      }
      return tocca(w, fatto);
    }
    var cas = [].slice.call(pan.querySelectorAll(".pzc-cifra")); if (cas.length !== st.vero.length) return false;
    var ora = cas.map(function (b) { return b.textContent; }), meta2 = st.vero.split("");
    if (!bravo) { for (var a = meta2.length - 1; a > 0; a--) if (meta2[a] !== meta2[a - 1]) { var t2 = meta2[a]; meta2[a] = meta2[a - 1]; meta2[a - 1] = t2; break; } }
    for (var p = 0; p < ora.length; p++) {
      if (ora[p] === meta2[p]) continue;
      for (var j = p + 1; j < ora.length; j++) if (ora[j] === meta2[p]) { tocca(w, cas[p]); tocca(w, cas[j]); return true; }
    }
    return tocca(w, fatto);
  }
  async function agisci(nome, opz) { return (await agisciN(nome, opz)) || PZ.agisci(nome, opz); }
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
  // chi ha giocato davvero (nei dati della rivelazione): la Spesa ha un carrello, la Cassaforte una combinazione
  function giocato(v) { return (v.riv.g || []).map(function (x) { return v.tipo === "spesa" ? !!(x.q && x.q.some(function (n) { return n > 0; })) : !!x.c; }); }

  // ===================== pn1: le regole =====================
  COPIONE.aggiungi("pn1", { nome: "Premi C: le regole della Spesa e della Cassaforte, senza grafica", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return w.SG_PREZZO_PREMI && w.SG_PREZZO_PREMI.spesa && w.SG_PREZZO_PREMI.cassaforte; }, 6000)) no("i due giochi a premi non sono registrati");
    var R = w.SG_PREZZO_PREMI, tutti = w.SG_PREZZO.prodotti;
    function Pfinto(ids) {
      var usati = {}, fatti = {}, privati = [];
      return { ids: ids, n: ids.length, modo: "online", locale: false, nome: function (id) { return id; }, rnd: Math.random,
        mescola: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
        pesca: function (f, n) { var l = this.mescola(tutti.filter(function (p) { return !usati[p.id] && (!f || f(p)); })).slice(0, n || 1); l.forEach(function (p) { usati[p.id] = 1; }); return l.map(function (p) { return JSON.parse(JSON.stringify(p)); }); },
        passo: w.SGPrezzoScena.passo, arrotonda: w.SGPrezzoScena.arrotonda, tondo2: function (v) { return Math.round(v * 100) / 100; },
        privato: function (id, m) { privati.push([id, m]); }, fatto: function (id) { fatti[id] = 1; }, _fatti: fatti };
    }
    // --- La Spesa ---
    var sp = R.spesa, P = Pfinto(["a", "b", "c", "d", "e"]), st = sp.prepara(P);
    if (st.prod.length !== 5 || st.prod.some(function (p) { return !(p.prezzo >= 0.5 && p.prezzo <= 8); })) no("Spesa: servono 5 prodotti tra 0,50 e 8 €: " + JSON.stringify(st.prod.map(function (p) { return p.prezzo; })));
    if (/prezzo/.test(JSON.stringify(sp.pubblico(st, P)))) no("Spesa: il prezzo è nella foto pubblica");
    var giusto = carrelloGiusto(st.prod), tot = function (q) { return Math.round(st.prod.reduce(function (s, p, i) { return s + p.prezzo * q[i]; }, 0) * 100) / 100; };
    sp.mossa(st, "a", { q: giusto, fine: 1, ms: 9000 }, P);
    // b: 1 € sopra la fascia (si aggiunge il prodotto più economico finché si sfora di poco)
    var qb = giusto.slice(), ord = st.prod.map(function (p, i) { return i; }).sort(function (x, y) { return st.prod[x].prezzo - st.prod[y].prezzo; });
    for (var g = 0; g < 40 && tot(qb) <= 22; g++) qb[ord[0]]++;
    sp.mossa(st, "b", { q: qb }, P);   // provvisorio: vale allo scadere
    sp.mossa(st, "c", { q: [9, 9, 9, 9, 9], fine: 1 }, P);
    sp.mossa(st, "d", { q: [1, 2, 3] }, P); sp.mossa(st, "d", { q: [1, 2, 3, 4, 10] }, P); sp.mossa(st, "d", { q: [1, 2, -1, 0, 0] }, P);   // mosse cattive
    sp.mossa(st, "a", { q: [9, 9, 9, 9, 9] }, P);   // dopo «Fatto» non si cambia più
    if (!P._fatti.a || P._fatti.b || !P._fatti.c || P._fatti.d) no("Spesa: «fatto» solo con «✅ Fatto!»: " + JSON.stringify(P._fatti));
    var f = sp.fine(st, P), pt = f.punti, Tb = tot(qb), atteso = Tb - 22 <= 1.5 ? 350 : Tb - 22 <= 4 ? 200 : 75;
    if (pt.a !== 600) no("Spesa: carrello nella fascia (" + tot(giusto) + " €) = 600, invece " + pt.a);
    if (pt.b !== atteso) no("Spesa: carrello a " + Tb + " € = " + atteso + ", invece " + pt.b);
    if (pt.c !== 0 || pt.d !== 0 || pt.e !== 0) no("Spesa: carrello enorme, mosse cattive e carrello vuoto = 0: " + JSON.stringify(pt));
    if (!f.carrello.a || f.carrello.a.length !== giusto.filter(function (x) { return x > 0; }).length || f.carrello.c) no("Spesa: a casa la sua spesa solo chi sta nella fascia");
    if (!sp.privatoDi(st, "b", P) || sp.privatoDi(st, "b", P).f || !sp.privatoDi(st, "a", P).f || sp.privatoDi(st, "e", P)) no("Spesa: i segreti per chi ricarica");
    var dur = sp.durata(f.riv, P); if (!(dur > 8000 && dur < 16000)) no("Spesa: durata della rivelazione " + dur);
    // il Bot: mosse valide entro i 40 secondi, il difficile nella fascia più spesso del facile
    function bravi(liv) { var n = 0; for (var q = 0; q < 200; q++) { var Pq = Pfinto(["x"]), s = sp.prepara(Pq), m = sp.bot(s, { id: "x", livello: liv }, Pq); if (m.some(function (x) { return x.ms > 40000; })) no("Spesa: mossa del Bot dopo il tempo"); m.forEach(function (x) { sp.mossa(s, "x", x.m, Pq); }); var T2 = Math.round(s.prod.reduce(function (a, p, i) { return a + p.prezzo * ((s.q.x || [])[i] || 0); }, 0) * 100) / 100; if (T2 >= 20 && T2 <= 22) n++; } return n; }
    var bd = bravi("difficile"), bf = bravi("facile");
    if (!(bd > bf)) no("Spesa: il Bot difficile non è più bravo del facile (" + bd + " / " + bf + ")");
    // --- La Cassaforte ---
    var cf = R.cassaforte, zero = 0, apposto = 0, adatti = 0;
    for (var t = 0; t < 120; t++) {
      var Pc = Pfinto(["a"]), sc = cf.prepara(Pc), v = sc.vero, mix = sc.mix.join("");
      if (sc.mix.slice().sort().join("") !== v.split("").sort().join("")) no("Cassaforte: le cifre mescolate non sono quelle del prezzo: " + v + " / " + mix);
      if (mix === v) no("Cassaforte: le cifre sono già nell'ordine giusto: " + v);
      if (sc.mix[0] === "0") zero++;
      for (var i2 = 0; i2 < v.length; i2++) if (mix[i2] === v[i2]) apposto++;
      if (/^\d{4,5}$/.test(v)) adatti++;
    }
    if (zero) no("Cassaforte: cifre mescolate con lo 0 davanti " + zero + " volte su 120");
    if (adatti < 120) no("Cassaforte: prezzi non da 4-5 cifre " + (120 - adatti) + " volte su 120");
    var P2 = Pfinto(["a", "b", "c", "d"]), s2 = cf.prepara(P2), pub = JSON.stringify(cf.pubblico(s2, P2));
    if (/prezzo/.test(pub) || pub.indexOf('"' + s2.vero + '"') >= 0) no("Cassaforte: il prezzo è nella foto pubblica: " + pub.slice(0, 200));
    var presi = {}, lGiusta = s2.vero.split("").map(function (c) { for (var j = 0; j < s2.mix.length; j++) if (!presi[j] && s2.mix[j] === c) { presi[j] = 1; return j; } });
    var lStart = s2.mix.map(function (c, j) { return j; });
    cf.mossa(s2, "a", { l: lGiusta, fine: 1 }, P2);
    cf.mossa(s2, "b", { l: lStart }, P2);
    cf.mossa(s2, "c", { l: [0, 0, 1, 2], fine: 1 }, P2); cf.mossa(s2, "c", { l: [0, 1, 2, 3, 9] }, P2);   // mosse cattive
    if (!P2._fatti.a || P2._fatti.b || P2._fatti.c) no("Cassaforte: «fatto» solo con «🔓 Apri!» e una combinazione valida");
    var f2 = cf.fine(s2, P2), n = s2.vero.length;
    if (f2.punti.a !== 60 * n + 400) no("Cassaforte aperta = " + (60 * n + 400) + ", invece " + f2.punti.a);
    if (f2.punti.b !== 0 || f2.punti.c !== 0 || f2.punti.d !== 0) no("Cassaforte: combinazione di partenza (nessuna cifra a posto), mosse cattive e chi non tocca = 0: " + JSON.stringify(f2.punti));
    if (!f2.carrello.a || f2.carrello.b) no("Cassaforte: a casa il premio solo chi apre");
    var dur2 = cf.durata(f2.riv, P2); if (!(dur2 > 6000 && dur2 < 16000)) no("Cassaforte: durata della rivelazione " + dur2);
    function aperte(liv) { var c = 0; for (var q = 0; q < 200; q++) { var Pq = Pfinto(["x"]), s = cf.prepara(Pq), m = cf.bot(s, { id: "x", livello: liv }, Pq); if (m.some(function (x) { return x.ms > 30000; })) no("Cassaforte: mossa del Bot dopo il tempo"); m.forEach(function (x) { cf.mossa(s, "x", x.m, Pq); }); var fin = cf.fine(s, Pq); if (fin.riv.g[0].aperta) c++; } return c; }
    var ad = aperte("difficile"), af = aperte("facile");
    if (!(ad > af)) no("Cassaforte: il Bot difficile non apre più del facile (" + ad + " / " + af + ")");
    return "Spesa: nella fascia 600, a " + Tb + " € " + pt.b + ", Bot nella fascia difficile " + bd + "/200 facile " + bf + "/200 · Cassaforte: aperta " + f2.punti.a + ", " + (apposto / 120).toFixed(2) + " cifre già a posto, Bot aperte difficile " + ad + "/200 facile " + af + "/200" + errori();
  } });

  // ===================== pn2: col Bot =====================
  COPIONE.aggiungi("pn2", { nome: "Premi C: 🤖 Contro il Bot, 📺 Puntata: la Spesa e la Cassaforte", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "puntata", offerte: "vista", liv: "medio", nBot: 3 }; } });
    if (!await W.aspetta(function () { return soloMiei(w); }, 6000)) no("i due giochi a premi non sono registrati");
    var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 5000);
    tess.click(); await W.dorme(300);
    if (!W.clicca(w, /Contro il Bot/)) no("niente «🤖 Contro il Bot»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita col Bot non parte al secondo tocco");
    var sp = spiaPremi("Paky"), viste = PZ.spiaFasi("Paky"), corsie = 0, casse = 0, pan = {};
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH && w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000, bravo: true,
      ognuno: function () {
        var d = w.document;
        if (d.querySelector(".pzc-corsie.su")) corsie = Math.max(corsie, d.querySelectorAll(".pzc-lane").length);
        if (d.querySelector(".pzc-cassa")) casse = Math.max(casse, d.querySelectorAll(".pzc-cassa").length);
        if (d.querySelector(".pz-pan.su .pzc-sr")) pan.spesa = 1;
        if (d.querySelector(".pz-pan.su .pzc-cifra")) pan.cassaforte = 1;
      } });
    sp.ferma(); viste.ferma();
    if (!ok) no("la partita col Bot non finisce (" + viste.viste.join(" → ") + ")");
    var tipi = controllaPremi(sp);
    if (corsie !== 4) no("nella Spesa dovevano esserci 4 corsie: " + corsie);
    if (casse !== 4) no("nella Cassaforte dovevano esserci 4 combinazioni: " + casse);
    if (!pan.spesa || !pan.cassaforte) no("non si è visto il pannello di tutti e due: " + JSON.stringify(pan));
    var mie = [];
    Object.keys(sp.visti).forEach(function (k) {
      var v = sp.visti[k]; if (!v.riv) return;
      var gi = giocato(v); if (gi.some(function (x) { return !x; })) no(v.tipo + ": qualcuno non ha giocato: " + JSON.stringify(v.riv.g));
      var io = (v.riv.g || []).filter(function (x) { return x.id === "host"; })[0];
      if (io) mie.push(v.tipo + " " + v.punti.host + (v.tipo === "spesa" ? " (" + io.T + " €)" : " (" + io.c + ")"));
      if (io && v.punti.host < 600) no(v.tipo + ": il giocatore bravo doveva fare almeno 600: " + v.punti.host);
    });
    return "giochi " + tipi + " · i miei: " + mie.join(", ") + " · classifica " + (w.__prezzoH.classifica || []).map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + errori();
  } });

  // ===================== pn3: sullo stesso telefono =====================
  COPIONE.aggiungi("pn3", { nome: "Premi C: 📱 sullo stesso telefono in 3, la Spesa e la Cassaforte a turno", fai: async function () {
    var w = await PZ.stessoTelefono(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "segrete" });
    soloMiei(w);
    if (!await W.aspetta(function () { return W.clicca(w, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita non comincia");
    soloMiei(w);
    var sp = spiaPremi("Paky"), turni = {};
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000,
      ognuno: function () {
        var H = w.__prezzoH, t = w.document.querySelector(".pz-pan.su .pz-pan-testa .tx");
        if (H.fase === "premio" && H.sotto === "gioca" && t) { var m = /^(\S+) · /.exec(t.textContent); if (m) (turni[H.premio.tipo] = turni[H.premio.tipo] || {})[m[1]] = 1; }
      } });
    sp.ferma();
    if (!ok) no("sullo stesso telefono la partita non finisce (fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + ")");
    var tipi = controllaPremi(sp);
    MIEI.forEach(function (x) { if (Object.keys(turni[x] || {}).length !== 3) no("«" + x + "»: il telefono non è passato a tutti e tre: " + JSON.stringify(turni[x])); });
    Object.keys(sp.visti).forEach(function (k) { var v = sp.visti[k]; if (v.riv && giocato(v).some(function (x) { return !x; })) no(v.tipo + " a turno: qualcuno non ha giocato"); });
    return "giochi " + tipi + " · turni " + JSON.stringify(turni) + errori();
  } });

  // ===================== pn4: online nella Sala, chi ricarica =====================
  COPIONE.aggiungi("pn4", { nome: "Premi C online nella Sala in 3: chi ricarica a metà Spesa e a metà Cassaforte", fai: async function () {
    PZ.conSpia();
    try {
      var X = await PZ.salaPrezzo(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [];
      ["Paky", "Luca", "Sara"].forEach(function (n) { soloMiei(W.finestra(n)); });
      var sp = spiaPremi("Paky"), qLuca = null, lSara = null, okLuca = null, okSara = null;
      var ok = await giocaTutti(["Paky", "Luca", "Sara"], function () { return vm(C).fase === "fine"; }, { ms: 480000, ritmo: { Luca: 2500, Sara: 2500 },
        ognuno: async function () {
          var H = P.__prezzoH; if (!H.premio || H.fase !== "premio" || H.sotto !== "gioca") return;
          var st = H.premio.st;
          if (H.premio.tipo === "spesa" && !qLuca) {
            var id = idDi(H, "Luca"), q = st.q[id];
            if (q && !st.f[id] && q.some(function (x) { return x > 0; })) {
              qLuca = q.slice();
              var w = await W.ricarica("Luca");
              okLuca = !!await W.aspetta(function () { var v = [].map.call(w.document.querySelectorAll(".pz-pan.su .pzc-q"), function (x) { return +x.textContent; }); var ora = P.__prezzoH.premio && P.__prezzoH.premio.st.q && P.__prezzoH.premio.st.q[id]; return v.length === 5 && ora && v.join(",") === ora.join(","); }, 15000);
              if (!okLuca) note.push("Luca dopo la ricarica non ritrova il suo carrello");
            }
          }
          if (H.premio.tipo === "cassaforte" && !lSara) {
            var id2 = idDi(H, "Sara"), l = st.l[id2];
            if (l && !st.f[id2]) {
              lSara = l.slice();
              var w2 = await W.ricarica("Sara");
              okSara = !!await W.aspetta(function () {
                var v = [].map.call(w2.document.querySelectorAll(".pz-pan.su .pzc-cifra"), function (x) { return x.textContent; }).join("");
                var H2 = P.__prezzoH; if (!H2.premio || !H2.premio.st.l) return false;
                return v && v === (H2.premio.st.l[id2] || lSara).map(function (j) { return H2.premio.st.mix[j]; }).join("");
              }, 15000);
              if (!okSara) note.push("Sara dopo la ricarica non ritrova la sua combinazione");
            }
          }
        } });
      sp.ferma();
      if (!ok) no("la partita online in 3 non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var tipi = controllaPremi(sp);
      if (!qLuca) note.push("(Luca non ha ricaricato: la Spesa non è uscita?)");
      if (!lSara) note.push("(Sara non ha ricaricato: la Cassaforte non è uscita?)");
      if (okLuca === false || okSara === false) no(note.join(" · "));
      await W.dorme(9000);
      await W.aspetta(function () { var x = A.tastiFineDi(P); return x && x.some(function (y) { return /Rivincita/.test(y); }); }, 40000);   // (i tasti di fine arrivano dopo qualche secondo)
      var tf = A.tastiFineDi(P);
      if (!tf || !tf.some(function (x) { return /Rivincita/.test(x); })) no("a fine partita l'host non ha «↻ Rivincita» (" + JSON.stringify(tf) + ")");
      var cl = vm(C).classifica || [];
      if (cl.length !== 3) no("classifica: " + JSON.stringify(cl));
      return "giochi " + tipi + " · Luca ricarica ok " + okLuca + " · Sara ricarica ok " + okSara + " · classifica " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + (note.length ? " · " + note.join(" ") : "") + errori();
    } finally { PZ.senzaSpia(); }
  } });

  // ===================== pn5: le misure =====================
  function guaiMiei(w) {
    var d = w.document, h = w.innerHeight, ww = w.innerWidth, guai = PZ.controllaVista(w);
    var pan = d.querySelector(".pz-pan.su"), basso = h - (pan ? pan.offsetHeight : 0), sch = d.querySelector(".st-sch-in .pz-sch");
    if (sch && d.querySelector(".st-mondo.st-quieto")) [].forEach.call(sch.querySelectorAll(".pzc-fascia,.pz-te,.pzc-lane,.pzc-casse,.pzc-cassa,.pzc-mix,.pzc-bn,.pz-tab"), function (e) {
      var r = e.getBoundingClientRect(); if (!r.height) return;
      if (r.bottom > basso + 2) guai.push(e.className.split(" ")[0] + " sotto il pannello (" + Math.round(r.bottom) + ">" + Math.round(basso) + ")");
      var sr = sch.getBoundingClientRect(); if (r.top < sr.top - 1) guai.push(e.className.split(" ")[0] + " tagliato in alto");
      if (r.left < -1 || r.right > ww + 1) guai.push(e.className.split(" ")[0] + " esce di lato");
    });
    if (pan) [].forEach.call(pan.querySelectorAll(".pzc-sr,.pzc-fatto,.pzc-cifra,.pzc-dial"), function (e) { var r = e.getBoundingClientRect(); if (r.height && (r.bottom > h + 1 || r.right > ww + 1 || r.left < -1)) guai.push(e.className.split(" ")[0] + " fuori dallo schermo"); });
    // (24 ott 2026: nella Spesa i prodotti stanno solo nel pannello, col più e il meno; sopra restano «Spendi tra» e chi ha
    //  finito: il pannello può essere alto fino all'80%, purché «Spendi tra» si veda sopra)
    if (pan && pan.querySelector(".pzc-sr")) {
      guai = guai.filter(function (g) { return !/^pannello alto/.test(g); });
      // (25 ott: mentre si gioca il pannello sale fin sotto il titolo e «Spendi tra» sta nel pannello)
      if (pan.getBoundingClientRect().top < 50) guai.push("il pannello della Spesa copre i tasti in alto (" + Math.round(pan.getBoundingClientRect().top) + ")");
      var no2 = pan.querySelector(".pzc-nota"); if (!no2 || !no2.getBoundingClientRect().height) guai.push("«Spendi tra» non si vede nel pannello");
      if (sch && [].some.call(sch.querySelectorAll(".pzc-lista .pz-te"), function (t) { return t.getBoundingClientRect().height > 0; })) guai.push("i prodotti si vedono due volte (sopra e nel pannello)");
    }
    if (pan && pan.querySelector(".pzc-cifra") && pan.offsetHeight > h * 0.62) guai.push("pannello alto " + pan.offsetHeight + " su " + h);
    return guai;
  }
  COPIONE.aggiungi("pn5", { nome: "Premi C: le misure a 360x640, 412x915 e 360x780 (Bot in 6) nella Spesa e nella Cassaforte", fai: async function () {
    var esiti = [], misure = W.__pn5misure || [[360, 640], [412, 915], [360, 780]];
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

  W.PZN = { agisciN: agisciN, agisci: agisci, giocaTutti: giocaTutti, soloMiei: soloMiei, guaiMiei: guaiMiei };
})();
