// PROVE DEI GIOCHI A PREMI DEL FILE A: «🧗 L'Alpinista» e «📊 Mettili in ordine» (js/games/prezzo-premi-a.js).
// Uso: await COPIONE.carica("prezzo/base.js"); await COPIONE.carica("prezzo/premi-a.js"); await COPIONE.prova("pa1")
// In tutte le partite restano registrati SOLO questi due giochi a premi (così escono di sicuro: chi vince l'Offerta sceglie tra i due).
//
// pa1: le regole senza grafica (passi dell'Alpinista, caduta, vetta, punti; i 5 prodotti di Mettili in ordine distanti almeno il 15%,
//      punti a posto, mosse cattive, chi non tocca niente; il Bot facile sbaglia più del difficile; le durate delle rivelazioni).
// pa2: «🤖 Contro il Bot», 📺 Come in TV 📺 Puntata (3 giochi a premi: escono tutti e due, scelti da chi vince l'Offerta).
// pa3: sullo stesso telefono in 3, 📺 ⚡ Veloce: i due giochi a premi a turno («📱 Sono Luca, tocca a me»).
// pa4: online nella Sala in 3, 📺 ⚡ Veloce: Luca ricarica a metà Alpinista (ritrova i prezzi già scritti), Sara ricarica a metà
//      Mettili in ordine (ritrova il suo ordine), partita fino alla fine e tasti del core.
// pa5: online nella Sala in 8, 📺 ⚡ Veloce: tutti e due i giochi a premi in 8 (8 avatar sulla montagna, 8 palline).
// pa6: online in 2 + chi arriva tardi durante un gioco a premi: guarda (niente pannello, niente errori) ed entra alla prossima Offerta.
// pa7: le misure a 360x640 e 412x915 mentre si gioca e nella rivelazione dei due giochi (Bot in 6: 6 avatar, 6 palline).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, PZ = W.PZ;
  if (!PZ) throw new Error("prima carica prezzo/base.js");
  var MIEI = ["alpinista", "ordine"];
  function vm(C) { return W.vmDi(C) || {}; }
  function soloMiei(w) { var R = w && w.SG_PREZZO_PREMI; if (!R) return false; Object.keys(R).forEach(function (k) { if (MIEI.indexOf(k) < 0) delete R[k]; }); return !!(R.alpinista && R.ordine); }
  function Hdi(nome) { var w = W.finestra(nome || "Paky"); return w && w.__prezzoH; }
  function idDi(H, nome) { var p = (H.players || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  function tocca(w, b) { if (!b) return false; b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" })); return true; }
  function tasto(w, tx) { return [].filter.call(w.document.querySelectorAll(".pz-pan.su .pz-k"), function (x) { return x.textContent.trim() === tx; })[0]; }
  function scrivi(w, v) {
    var conV = !!tasto(w, ","), s;
    if (conV && Math.round(v * 100) % 100) s = String(Math.floor(v)) + "," + String(Math.round(v * 100) % 100).padStart(2, "0").replace(/0$/, "");
    else s = String(Math.max(1, Math.round(v)));
    for (var i = 0; i < 9; i++) tocca(w, tasto(w, "⌫"));
    s.split("").forEach(function (c) { tocca(w, tasto(w, c)); });
    var ok = w.document.querySelector(".pz-pan.su .pz-ok");
    if (!ok || ok.disabled) return false;
    return tocca(w, ok);
  }
  function errori() { var e = W.erroriTel(); return e.length ? " · ERRORI: " + e.slice(0, 3).join(" / ") : ""; }

  // ---------------- il giocatore automatico dei due giochi (poi quello di base.js) ----------------
  var STATO = {};
  // opz.bravo: prezzi precisi e ordine giusto; opz.ritmo[nome]: ms tra due scambi (di partenza 450)
  async function agisci(nome, opz) {
    opz = opz || {};
    var w = W.finestra(nome); if (!w || !w.document) return false;
    var d = w.document, H = Hdi(opz.host), pan = d.querySelector(".pz-pan.su");
    if (pan && H && H.premio && H.premio.st && H.fase === "premio" && H.sotto === "gioca") {
      var st = H.premio.st, k = STATO[nome] = STATO[nome] || {};
      if (H.premio.tipo === "alpinista") {
        var ok = pan.querySelector(".pz-ok"), m = ok && /(\d) di (\d)/.exec(ok.textContent);
        if (ok && m && !ok.closest(".chiuso") && !/Tempo/.test(ok.textContent)) {
          var p = st.prod[+m[1] - 1].prezzo, f = opz.bravo ? 1 : (opz.sbaglia && opz.sbaglia[nome]) || (0.82 + Math.random() * 0.32);
          var v = p * f; v = p < 20 ? Math.max(0.1, Math.round(v * 10) / 10) : Math.max(1, Math.round(v));
          return scrivi(w, v);
        }
        return false;
      }
      if (H.premio.tipo === "ordine") {
        var righe = [].slice.call(pan.querySelectorAll(".pza-or")), fatto = pan.querySelector(".pza-fatto");
        if (!righe.length || !fatto || fatto.disabled) return false;
        var ritmo = (opz.ritmo && opz.ritmo[nome]) || 450;
        if (k.ultimo && Date.now() - k.ultimo < ritmo) return false;
        k.ultimo = Date.now();
        var nomi = righe.map(function (r) { return r.querySelector(".n").textContent; });
        var giusto = st.prod.slice().sort(function (a, b) { return a.prezzo - b.prezzo; }).map(function (x) { return x.nome; });
        if (!opz.bravo && !(opz.precisi && opz.precisi[nome])) { var t = giusto[1]; giusto[1] = giusto[2]; giusto[2] = t; }   // sbaglia due posti
        var i = 0; while (i < nomi.length && nomi[i] === giusto[i]) i++;
        if (i >= nomi.length) return tocca(w, fatto);
        var j = nomi.indexOf(giusto[i]);
        tocca(w, righe[i]); tocca(w, righe[j]);
        return true;
      }
    }
    return PZ.agisci(nome, opz);
  }
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
  // i giochi a premi visti dall'host: tipo, chi ha giocato, i punti
  function spiaPremi(nomeHost) {
    var visti = {}, scelte = [], w = W.finestra(nomeHost || "Paky"), prima = null;
    var id = setInterval(function () {
      var H = w && w.__prezzoH; if (!H) return;
      if (H.fase === "scegli" && H.scelta && H.scelta.opz) { var s = H.scelta.opz.join("+"); if (scelte[scelte.length - 1] !== s) scelte.push(s); }
      if (H.premio && H.fase === "premio") {
        var k = H.premio.tipo + "#" + H.iPremio;
        if (!visti[k]) visti[k] = { tipo: H.premio.tipo, sotto: {} };
        visti[k].sotto[H.sotto] = 1;
        if (H.premio.punti) visti[k].punti = H.premio.punti;
        if (H.premio.riv) visti[k].riv = H.premio.riv;
      }
    }, 120);
    return { visti: visti, scelte: scelte, ferma: function () { clearInterval(id); },
      tipi: function () { var t = {}; Object.keys(visti).forEach(function (k) { if (visti[k].sotto.riv) t[visti[k].tipo] = (t[visti[k].tipo] || 0) + 1; }); return t; } };
  }
  function controllaPremi(sp, attesi) {
    var t = sp.tipi();
    attesi.forEach(function (x) { if (!t[x]) no("il gioco a premi «" + x + "» non è arrivato alla rivelazione (" + JSON.stringify(t) + ")"); });
    Object.keys(sp.visti).forEach(function (k) {
      var v = sp.visti[k]; if (!v.sotto.riv) return;
      if (!v.punti) no(k + ": niente punti alla fine");
      Object.keys(v.punti).forEach(function (id) { var p = v.punti[id]; if (!(p >= 0 && p <= 700)) no(k + ": punti strani per " + id + ": " + p); });
    });
    return Object.keys(t).map(function (x) { return x + "×" + t[x]; }).join(", ");
  }

  // ===================== pa1: le regole =====================
  COPIONE.aggiungi("pa1", { nome: "Premi A: le regole dell'Alpinista e di Mettili in ordine, senza grafica", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), R = w.SG_PREZZO_PREMI, Z = w.SGPrezzoScena;
    if (!R || !R.alpinista || !R.ordine) no("i due giochi a premi non sono registrati");
    var tutti = (w.SG_PREZZO.prodotti || []);
    // un P finto (come quello dell'host): pesca dai prodotti veri, mai due volte
    function Pfinto(ids) {
      var usati = {}, privati = [], fatti = {};
      return { ids: ids, n: ids.length, modo: "bot", locale: true, nome: function (id) { return id; }, rnd: Math.random,
        mescola: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
        pesca: function (f, n) { var l = this.mescola(tutti.filter(function (p) { return !usati[p.id] && (!f || f(p)); })).slice(0, n || 1); l.forEach(function (p) { usati[p.id] = 1; }); return JSON.parse(JSON.stringify(l)); },
        passo: Z.passo, margine: Z.margine, arrotonda: Z.arrotonda, fmtE: Z.fmtE, tondo2: Z.tondo2,
        privato: function (id, m) { privati.push([id, m]); }, fatto: function (id) { fatti[id] = 1; }, _fatti: fatti };
    }
    var al = R.alpinista, P = Pfinto(["a", "b", "c", "d"]), st = al.prepara(P);
    if (st.prod.length !== 3 || st.prod.some(function (p) { return !(p.prezzo < 100); })) no("Alpinista: servono 3 prodotti sotto i 100 €: " + JSON.stringify(st.prod.map(function (p) { return p.prezzo; })));
    var cats = {}; st.prod.forEach(function (p) { cats[p.cat] = 1; });
    if (Object.keys(cats).length < 3) no("Alpinista: i 3 prodotti dovrebbero essere di categorie diverse");
    var pub = JSON.stringify(al.pubblico(st, P));
    if (/prezzo/.test(pub)) no("Alpinista: il prezzo è nella foto pubblica: " + pub.slice(0, 200));
    // a: preciso (in vetta), b: +12% su tutti (3 passi a prodotto = 9), c: un prezzo doppio (25 passi) + uno sbagliato = cade, d: solo un prezzo e poi niente
    st.prod.forEach(function (p, i) {
      al.mossa(st, "a", { i: i, v: p.prezzo, ms: 1000 }, P);
      al.mossa(st, "b", { i: i, v: Z.tondo2(p.prezzo * 1.125), ms: 2000 }, P);
      al.mossa(st, "c", { i: i, v: i === 0 ? p.prezzo * 2 : Z.tondo2(p.prezzo * 1.2), ms: 3000 }, P);
    });
    al.mossa(st, "d", { i: 1, v: st.prod[1].prezzo, ms: 500 }, P);
    al.mossa(st, "a", { i: 0, v: 1, ms: 5000 }, P);   // un secondo prezzo sullo stesso prodotto non vale
    al.mossa(st, "b", { i: 7, v: 5 }, P); al.mossa(st, "b", { i: 0, v: -3 }, P);   // mosse cattive
    if (!P._fatti.a || !P._fatti.b || !P._fatti.c || P._fatti.d) no("Alpinista: «fatto» solo per chi ha scritto i 3 prezzi: " + JSON.stringify(P._fatti));
    var r = al.fine(st, P), g = {}; r.riv.g.forEach(function (x) { g[x.id] = x; });
    if (g.a.tot !== 0 || r.punti.a !== 750) no("Alpinista: tutto preciso = 0 passi e 550 + 200: " + JSON.stringify(g.a) + " " + r.punti.a);
    if (g.b.giu || g.b.tot < 6 || g.b.tot > 12 || r.punti.b !== 550 - 15 * g.b.tot) no("Alpinista: +12,5% = circa 3 passi a prodotto: " + JSON.stringify(g.b) + " punti " + r.punti.b);
    if (!g.c.giu || r.punti.c !== 0 || g.c.p[0] !== 25) no("Alpinista: prezzo doppio = 25 passi e giù dal burrone: " + JSON.stringify(g.c));
    if (!g.d.giu || r.punti.d !== 0) no("Alpinista: chi non scrive i prezzi cade: " + JSON.stringify(g.d));
    if (!r.carrello.a || r.carrello.a.length !== 3) no("Alpinista: chi resta più in basso si porta a casa i 3 premi");
    if (JSON.stringify(al.privatoDi(st, "d", P).mie) !== JSON.stringify([null, st.prod[1].prezzo, null])) no("Alpinista: i segreti di chi ricarica: " + JSON.stringify(al.privatoDi(st, "d", P)));
    // un passo di prezzo di differenza non conta; un errore del 100% o più vale 25
    var stP = { prod: [{ prezzo: 1.25 }, { prezzo: 50 }, { prezzo: 9.9 }], r: {}, ms: {} }, P2 = Pfinto(["x"]);
    [1.3, 51, 30].forEach(function (v, i) { al.mossa(stP, "x", { i: i, v: v }, P2); });
    var rx = al.fine(stP, P2).riv.g[0];
    if (rx.p[0] !== 0 || rx.p[1] !== 0 || rx.p[2] !== 25) no("Alpinista: passi con un passo di prezzo / errore oltre il 100%: " + JSON.stringify(rx.p));
    var dur = al.durata(r.riv, P);
    if (!(dur > 6000 && dur <= 30000)) no("Alpinista: durata della rivelazione " + dur);
    // il Bot difficile sbaglia meno del facile (e cade di meno)
    function cadute(liv) { var c = 0; for (var q = 0; q < 200; q++) { var Pq = Pfinto(["bot"]), s = al.prepara(Pq); al.bot(s, { id: "bot", livello: liv }, Pq).forEach(function (x) { al.mossa(s, "bot", Object.assign({ ms: x.ms }, x.m), Pq); }); if (al.fine(s, Pq).riv.g[0].giu) c++; } return c / 200; }
    var cf = cadute("facile"), cd = cadute("difficile");
    if (!(cf > cd)) no("Alpinista: il Bot facile dovrebbe cadere più del difficile (" + cf + " / " + cd + ")");
    // ----- Mettili in ordine -----
    var or = R.ordine, lontani = 0, stessaCat = 0, giri = 60;
    for (var q = 0; q < giri; q++) {
      var Po = Pfinto(["a"]), so = or.prepara(Po), pr = so.prod.map(function (p) { return p.prezzo; }).sort(function (x, y) { return x - y; });
      if (so.prod.length !== 5) no("Ordine: servono 5 prodotti: " + so.prod.length);
      var ok15 = true; for (var i = 1; i < pr.length; i++) if (pr[i] / pr[i - 1] < 1.15 - 1e-9) ok15 = false;
      if (ok15) lontani++;
      if (so.prod.every(function (p) { return p.cat === so.prod[0].cat; })) stessaCat++;
      var giu0 = so.prod.map(function (p, i) { return i; }).sort(function (x, y) { return so.prod[x].prezzo - so.prod[y].prezzo; });
      if (so.start.filter(function (x, i) { return x === giu0[i]; }).length > 1) no("Ordine: la colonna di partenza ha più di un posto già giusto");
    }
    if (lontani < giri) no("Ordine: prezzi troppo vicini (meno del 15%) in " + (giri - lontani) + " partite su " + giri);
    if (stessaCat < giri * 0.8) no("Ordine: della stessa categoria solo " + stessaCat + " su " + giri);
    var Po2 = Pfinto(["a", "b", "c", "d"]), s2 = or.prepara(Po2), giusto = s2.prod.map(function (p, i) { return i; }).sort(function (x, y) { return s2.prod[x].prezzo - s2.prod[y].prezzo; });
    if (/prezzo/.test(JSON.stringify(or.pubblico(s2, Po2)))) no("Ordine: il prezzo è nella foto pubblica");
    var sbagliato = giusto.slice(); var t = sbagliato[0]; sbagliato[0] = sbagliato[1]; sbagliato[1] = t;
    or.mossa(s2, "a", { l: giusto, fine: 1, ms: 9000 }, Po2);
    or.mossa(s2, "b", { l: sbagliato, ms: 4000 }, Po2);            // provvisorio: vale allo scadere
    or.mossa(s2, "c", { l: [0, 0, 1, 2, 3], fine: 1 }, Po2);         // mossa cattiva
    or.mossa(s2, "c", { l: [0, 1, 2, 3, 9], fine: 1 }, Po2);
    if (!Po2._fatti.a || Po2._fatti.b || Po2._fatti.c) no("Ordine: «fatto» solo con «✅ Fatto!» e un ordine valido: " + JSON.stringify(Po2._fatti));
    var r2 = or.fine(s2, Po2);
    if (r2.punti.a !== 450 || r2.punti.b !== 210 || r2.punti.c !== 0 || r2.punti.d !== 0) no("Ordine: punti (450, 210, 0, 0): " + JSON.stringify(r2.punti));
    if (!r2.carrello.a || r2.carrello.a[0].prezzo !== s2.prod[giusto[4]].prezzo) no("Ordine: chi fa buca in uno si porta a casa il più caro");
    if (!or.privatoDi(s2, "b", Po2) || or.privatoDi(s2, "b", Po2).f || or.privatoDi(s2, "d", Po2)) no("Ordine: segreti per chi ricarica");
    var dur2 = or.durata(r2.riv, Po2);
    if (!(dur2 > 6000 && dur2 <= 30000)) no("Ordine: durata " + dur2);
    function bravura(liv) { var s = 0; for (var q2 = 0; q2 < 150; q2++) { var Pb = Pfinto(["bot"]), sb = or.prepara(Pb); or.bot(sb, { id: "bot", livello: liv }, Pb).forEach(function (x) { or.mossa(sb, "bot", x.m, Pb); }); s += or.fine(sb, Pb).riv.g[0].n; } return s / 150; }
    var bf = bravura("facile"), bd = bravura("difficile");
    if (!(bd > bf)) no("Ordine: il Bot difficile dovrebbe mettere più posti giusti del facile (" + bf.toFixed(2) + " / " + bd.toFixed(2) + ")");
    return "Alpinista: Bot facile cade " + Math.round(cf * 100) + "%, difficile " + Math.round(cd * 100) + "% · Ordine: Bot facile " + bf.toFixed(1) + "/5, difficile " + bd.toFixed(1) + "/5, stessa categoria " + stessaCat + "/" + giri + " · durate " + dur + " / " + dur2 + " ms";
  } });

  // ===================== pa2: Contro il Bot =====================
  COPIONE.aggiungi("pa2", { nome: "Premi A: 🤖 Contro il Bot, 📺 Puntata: l'Alpinista e Mettili in ordine", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "puntata", offerte: "vista", liv: "medio", nBot: 3 }; } });
    if (!await W.aspetta(function () { return soloMiei(w); }, 6000)) no("i due giochi a premi non sono registrati");
    var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 5000);
    tess.click(); await W.dorme(300);
    if (!W.clicca(w, /Contro il Bot/)) no("niente «🤖 Contro il Bot»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita col Bot non parte al secondo tocco");
    var sp = spiaPremi("Paky"), viste = PZ.spiaFasi("Paky"), vistoMonte = 0, vistePalle = 0, vistoPan = {};
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH && w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000,
      offerta: function (pr, H) { return H.iOff === 1 ? pr * 0.99 : pr * (0.6 + Math.random() * 0.35); },
      ognuno: function () {
        var d = w.document;
        if (d.querySelector(".pza-monte .pza-alp")) vistoMonte = Math.max(vistoMonte, d.querySelectorAll(".pza-monte .pza-alp").length);
        if (d.querySelector(".pza-golf.su")) vistePalle = Math.max(vistePalle, d.querySelectorAll(".pza-palla").length);
        if (d.querySelector(".pz-pan.su .pza-or")) vistoPan.ordine = 1;
        if (d.querySelector(".pz-pan.su .pza-alp-pan")) vistoPan.alpinista = 1;
      } });
    sp.ferma(); viste.ferma();
    if (!ok) no("la partita col Bot non finisce (" + viste.viste.join(" → ") + ")");
    var tipi = controllaPremi(sp, MIEI);
    if (vistoMonte !== 4) no("sulla montagna dovevano esserci 4 avatar: " + vistoMonte);
    if (vistePalle !== 4) no("sul minigolf dovevano esserci 4 palline: " + vistePalle);
    if (!vistoPan.ordine || !vistoPan.alpinista) no("non si è visto il pannello di tutti e due: " + JSON.stringify(vistoPan));
    if (!sp.scelte.length || sp.scelte.some(function (s) { return s.split("+").some(function (x) { return MIEI.indexOf(x) < 0; }); })) no("la scelta del gioco a premi non era tra i due: " + JSON.stringify(sp.scelte));
    // i Bot hanno giocato davvero (risposte nei due giochi)
    Object.keys(sp.visti).forEach(function (k) {
      var v = sp.visti[k]; if (!v.riv) return;
      var g = v.riv.g || [], bot = g.filter(function (x) { return x.id !== "host"; });
      if (v.tipo === "alpinista" && bot.some(function (x) { return x.v.some(function (y) { return y == null; }); })) no("Alpinista: un Bot non ha scritto i 3 prezzi: " + JSON.stringify(bot));
      if (v.tipo === "ordine" && bot.some(function (x) { return !x.l; })) no("Ordine: un Bot non ha messo in ordine");
    });
    return "giochi a premi " + tipi + " · scelte " + sp.scelte.join(" | ") + " · classifica " + (w.__prezzoH.classifica || []).map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + errori();
  } });

  // ===================== pa3: sullo stesso telefono =====================
  COPIONE.aggiungi("pa3", { nome: "Premi A: 📱 sullo stesso telefono in 3, i due giochi a premi a turno", fai: async function () {
    var w = await PZ.stessoTelefono(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "segrete" });
    soloMiei(w);
    if (!await W.aspetta(function () { return W.clicca(w, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita non comincia");
    soloMiei(w);
    var sp = spiaPremi("Paky"), turni = {};
    W.__pzTurni = [];
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000,
      ognuno: function () {
        var H = w.__prezzoH, t = w.document.querySelector(".pz-pan.su .pz-pan-testa .tx");
        if (H.fase === "premio" && H.sotto === "gioca" && t) { var m = /^(\S+) · /.exec(t.textContent); if (m) (turni[H.premio.tipo] = turni[H.premio.tipo] || {})[m[1]] = 1; }
      } });
    sp.ferma();
    if (!ok) no("sullo stesso telefono la partita non finisce (fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + ")");
    var tipi = controllaPremi(sp, MIEI);
    MIEI.forEach(function (x) { if (Object.keys(turni[x] || {}).length !== 3) no("«" + x + "»: il telefono non è passato a tutti e tre: " + JSON.stringify(turni[x])); });
    // tutti e tre hanno davvero giocato (risposte nei dati della rivelazione)
    Object.keys(sp.visti).forEach(function (k) {
      var v = sp.visti[k]; if (!v.riv) return;
      if (v.tipo === "alpinista" && v.riv.g.some(function (x) { return x.v.filter(function (y) { return y != null; }).length !== 3; })) no("Alpinista a turno: qualcuno senza i 3 prezzi: " + JSON.stringify(v.riv.g));
      if (v.tipo === "ordine" && v.riv.g.some(function (x) { return !x.l; })) no("Ordine a turno: qualcuno senza ordine");
    });
    return "giochi " + tipi + " · turni " + JSON.stringify(turni) + errori();
  } });

  // ===================== online nella Sala =====================
  async function sala(amici, imp) {
    PZ.conSpia();
    var X = await PZ.salaPrezzo(amici, imp);
    ["Paky"].concat(amici).forEach(function (n) { soloMiei(W.finestra(n)); });
    return X;
  }

  COPIONE.aggiungi("pa4", { nome: "Premi A online nella Sala in 3: chi ricarica a metà Alpinista e a metà Mettili in ordine", fai: async function () {
    try {
      var X = await sala(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [];
      var sp = spiaPremi("Paky"), rLuca = null, rSara = null, okLuca = null, okSara = null;
      var ok = await giocaTutti(["Paky", "Luca", "Sara"], function () { return vm(C).fase === "fine"; }, { ms: 480000, ritmo: { Sara: 1700 },
        ognuno: async function () {
          var H = P.__prezzoH; if (!H.premio || H.fase !== "premio" || H.sotto !== "gioca") return;
          var st = H.premio.st;
          if (H.premio.tipo === "alpinista" && !rLuca) {
            var r = st.r[idDi(H, "Luca")] || [], n = r.filter(function (v) { return v != null; }).length;
            if (n === 1) {
              rLuca = r.slice();
              var w = await W.ricarica("Luca");
              okLuca = !!await W.aspetta(function () { var b = w.document.querySelector(".pz-pan.su .pz-ok"); return b && /2 di 3/.test(b.textContent); }, 15000);
              if (!okLuca) note.push("Luca dopo la ricarica non riparte dal 2° prezzo (" + ((w.document.querySelector(".pz-pan.su .pz-ok") || {}).textContent || "niente pannello") + ")");
            }
          }
          if (H.premio.tipo === "ordine" && !rSara) {
            var id = idDi(H, "Sara"), l = st.l[id];
            if (l && !st.f[id]) {
              rSara = l.slice();
              var w2 = await W.ricarica("Sara");
              okSara = !!await W.aspetta(function () {
                var righe = [].slice.call(w2.document.querySelectorAll(".pz-pan.su .pza-or .n")).map(function (x) { return x.textContent; });
                var H2 = P.__prezzoH; if (!H2.premio || !H2.premio.st.l) return false;
                var vero = (H2.premio.st.l[id] || rSara).map(function (j) { return H2.premio.st.prod[j].nome; });
                return righe.length === 5 && righe.join("|") === vero.join("|");
              }, 15000);
              if (!okSara) note.push("Sara dopo la ricarica non ritrova il suo ordine");
            }
          }
        } });
      sp.ferma();
      if (!ok) no("la partita online in 3 non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var tipi = controllaPremi(sp, MIEI);
      if (!rLuca) note.push("(Luca non ha ricaricato: l'Alpinista non è uscito?)");
      if (!rSara) note.push("(Sara non ha ricaricato: Mettili in ordine non è uscito?)");
      if (okLuca === false || okSara === false) no(note.join(" · "));
      // le risposte di Luca prima della ricarica sono rimaste
      Object.keys(sp.visti).forEach(function (k) {
        var v = sp.visti[k]; if (!v.riv) return;
        var H = P.__prezzoH, gL = v.riv.g.filter(function (x) { return x.id === idDi(H, "Luca"); })[0];
        if (v.tipo === "alpinista" && rLuca && gL && gL.v[0] !== rLuca[0]) no("Alpinista: il primo prezzo di Luca è cambiato dopo la ricarica");
        if (v.tipo === "alpinista" && gL && gL.v.some(function (y) { return y == null; })) no("Alpinista: Luca dopo la ricarica non ha finito i prezzi: " + JSON.stringify(gL.v));
      });
      await W.dorme(9000);
      var tf = A.tastiFineDi(P);
      if (!tf || !tf.some(function (x) { return /Rivincita/.test(x); })) no("a fine partita l'host non ha «↻ Rivincita» (" + JSON.stringify(tf) + ")");
      var cl = vm(C).classifica || [];
      if (cl.length !== 3) no("classifica: " + JSON.stringify(cl));
      return "giochi " + tipi + " · Luca ricarica ok " + okLuca + " · Sara ricarica ok " + okSara + " · classifica " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + (note.length ? " · " + note.join(" ") : "") + errori();
    } finally { PZ.senzaSpia(); }
  } });

  COPIONE.aggiungi("pa5", { nome: "Premi A online nella Sala in 8: la montagna e il minigolf in 8", fai: async function () {
    try {
      var amici = ["Luca", "Sara", "Giulia", "Marco", "Bea", "Toni", "Ada"];
      var X = await sala(amici, { formato: "tv", durata: "veloce", offerte: "segrete" }), C = X.C, P = X.P;
      var sp = spiaPremi("Paky"), monte = {}, palle = {}, chiTu = 0;
      var tutti = ["Paky"].concat(amici);
      var ok = await giocaTutti(tutti, function () { return vm(C).fase === "fine"; }, { ms: 480000, precisi: { Giulia: 1 }, sbaglia: { Marco: 2.2 },
        ognuno: function () {
          tutti.forEach(function (n) {
            var d = W.finestra(n).document;
            var a = d.querySelectorAll(".pza-monte .pza-alp").length; if (a) monte[n] = Math.max(monte[n] || 0, a);
            var b = d.querySelectorAll(".pza-golf .pza-palla").length; if (b) palle[n] = Math.max(palle[n] || 0, b);
            if (n === "Luca" && [].some.call(d.querySelectorAll(".pza-lane .nm,.pz-riga .nm"), function (x) { return x.textContent === "Tu"; })) chiTu = 1;
          });
        } });
      sp.ferma();
      if (!ok) no("la partita in 8 non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var tipi = controllaPremi(sp, MIEI);
      var male = tutti.filter(function (n) { return monte[n] !== 8 || palle[n] !== 8; });
      if (male.length) no("in 8: avatar sulla montagna / palline non sono 8 su tutti i telefoni: " + JSON.stringify({ monte: monte, palle: palle }));
      if (!chiTu) no("sul telefono di Luca la sua riga non dice «Tu»");
      // Marco (prezzi più che doppi) cade dal burrone; Giulia (ordine giusto) fa buca in uno
      Object.keys(sp.visti).forEach(function (k) {
        var v = sp.visti[k]; if (!v.riv) return; var H = P.__prezzoH;
        var gi = function (n) { return v.riv.g.filter(function (x) { return x.id === idDi(H, n); })[0] || {}; };
        if (v.tipo === "alpinista" && !gi("Marco").giu) no("Alpinista: Marco coi prezzi più che doppi doveva cadere: " + JSON.stringify(gi("Marco")));
        if (v.tipo === "ordine" && gi("Giulia").n !== 5) no("Ordine: Giulia doveva fare buca in uno: " + JSON.stringify(gi("Giulia")));
      });
      var cl = vm(C).classifica || [];
      if (cl.length !== 8) no("classifica in 8: " + cl.length);
      return "giochi " + tipi + " · classifica " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + errori();
    } finally { PZ.senzaSpia(); }
  } });

  COPIONE.aggiungi("pa6", { nome: "Premi A online: chi arriva tardi durante un gioco a premi guarda ed entra alla prossima Offerta", fai: async function () {
    PZ.conSpia();
    try {
      var P = await W.apriTel("Paky", { x: 0, prima: function (w) { w.__imp = { formato: "tv", durata: "puntata", offerte: "vista" }; } });
      var C = await W.apriStanza(P, "Il Prezzo è Giusto!");
      await W.apriTel("Luca", { hash: "gioco=prezzo&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return (vm(C).players || []).length === 2; }, 10000)) no("Luca non entra in saletta");
      soloMiei(P); soloMiei(W.finestra("Luca"));
      if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
      var Sw = null, viste = {}, entrata = false;
      var ok = await giocaTutti(["Paky", "Luca"], function () { return entrata; }, { ms: 300000,
        ognuno: async function () {
          var H = P.__prezzoH;
          if (!Sw && H.fase === "premio" && H.sotto === "gioca") { Sw = await W.apriTel("Sara", { hash: "gioco=prezzo&stanza=" + C, x: 370 }); soloMiei(Sw); }
          if (Sw && Sw.document) {
            var d = Sw.document;
            if (H.fase === "premio" && H.sotto === "gioca" && d.querySelector(".pza-cur")) viste.schermo = 1;
            if (H.fase === "premio" && H.sotto === "gioca" && d.querySelector(".pz-pan.su .pza-or,.pz-pan.su .pza-alp-pan")) viste.pannello = 1;
            if (H.fase === "premio" && H.sotto === "riv" && d.querySelector(".pza-monte,.pza-golf")) viste.riv = 1;
            if ((H.players || []).some(function (p) { return p.nome === "Sara"; }) && H.fase === "offerta") entrata = true;
          }
        } });
      if (!Sw) no("il gioco a premi non è arrivato");
      if (!viste.schermo) no("Sara arrivata durante il gioco a premi non vede il maxischermo del gioco");
      if (viste.pannello) no("Sara arrivata tardi ha il pannello per giocare (doveva guardare)");
      if (!viste.riv) no("Sara non vede la rivelazione del gioco a premi");
      if (!ok) no("Sara non entra alla prossima Offerta");
      return "Sara guarda il gioco a premi ed entra alla prossima Offerta" + errori();
    } finally { PZ.senzaSpia(); }
  } });

  // ===================== pa7: le misure =====================
  function guaiMiei(w) {
    var d = w.document, h = w.innerHeight, ww = w.innerWidth, guai = PZ.controllaVista(w);
    var pan = d.querySelector(".pz-pan.su"), basso = h - (pan ? pan.offsetHeight : 0);
    var sch = d.querySelector(".st-sch-in .pz-sch");
    if (sch && d.querySelector(".st-mondo.st-quieto")) [].forEach.call(sch.querySelectorAll(".pza-monte,.pz-te,.pza-lane,.pza-cinque,.pza-dot,.pza-bn,.pz-tab"), function (e) {
      var r = e.getBoundingClientRect(); if (!r.height) return;
      if (r.bottom > basso + 2) guai.push(e.className.split(" ")[0] + " sotto il pannello (" + Math.round(r.bottom) + ">" + Math.round(basso) + ")");
      var sr = sch.getBoundingClientRect(); if (r.top < sr.top - 1) guai.push(e.className.split(" ")[0] + " tagliato in alto");
      if (r.left < -1 || r.right > ww + 1) guai.push(e.className.split(" ")[0] + " esce di lato");
    });
    if (pan) [].forEach.call(pan.querySelectorAll(".pza-or,.pza-fatto,.pz-ok"), function (e) { var r = e.getBoundingClientRect(); if (r.height && r.bottom > h + 1) guai.push(e.className.split(" ")[0] + " fuori dallo schermo in basso"); });
    if (pan && pan.querySelector(".pza-or") && pan.offsetHeight > h * 0.6) guai.push("pannello di Mettili in ordine alto " + pan.offsetHeight + " su " + h);
    return guai;
  }
  COPIONE.aggiungi("pa7", { nome: "Premi A: le misure a 360x640 e 412x915 (Bot in 6) nei due giochi a premi", fai: async function () {
    var esiti = [], misure = W.__pa7misure || [[360, 640], [412, 915]];
    for (var m = 0; m < misure.length; m++) {
      var wh = misure[m];
      var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 5 }; } });
      await W.aspetta(function () { return soloMiei(w); }, 6000);
      // (con la scheda del browser nascosta transizioni e animazioni restano al primo fotogramma: per misurare si tolgono)
      var na = w.document.createElement("style"); na.textContent = "*{animation:none!important;transition:none!important}"; w.document.head.appendChild(na);
      var f = document.getElementById("tel-Paky"); f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize"));
      var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 5000);
      tess.click(); await W.dorme(300);
      W.clicca(w, /Contro il Bot/); await W.dorme(300);   // (diretto: parte da solo, niente «Comincia»)
      var visti = {}, guai = {}, fatti = {};
      await giocaTutti(["Paky"], function () { var H = w.__prezzoH; return H && (H.fase === "fine" || H.fase === "ruota"); }, { ms: 300000, passo: 500, ognuno: async function () {
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

  W.PZA = { agisci: agisci, giocaTutti: giocaTutti, soloMiei: soloMiei, spiaPremi: spiaPremi, guaiMiei: guaiMiei };
})();
