// PROVE DEI GIOCHI A PREMI «✋ È troppo!» e «🟡 Plinko» (js/games/prezzo-premi-b.js) di «Il Prezzo è Giusto!».
// Uso (dopo copione-prova.js): await COPIONE.carica("prezzo/base.js"); await COPIONE.carica("prezzo/premi-b.js"); await COPIONE.prova("pzb2")
// In ogni partita escono SOLO questi due giochi a premi (gli altri si tolgono dal telefono che tiene la partita), quindi
// in 📺 ⚡ Veloce (2 Offerte) chi vince la prima Offerta sceglie tra i due e la seconda volta esce l'altro.
//
// pzb1: le regole senza grafica (i 10 prezzi sempre dello stesso salto, il primo sopra fuori dal margine, i punti 600/450/350/250/150 e un gradino prima 200, due 100,
//       i prezzi sbagliati dell'«Occhio al prezzo», la caduta del Plinko, fine() con gettoni non lasciati, il Bot).
// pzb2: «🤖 Contro il Bot» (3 Bot), 📺 ⚡ Veloce: partita intera; i Bot si fermano e lasciano i gettoni.
// pzb3: sullo stesso telefono in 3: «È troppo!» tutti insieme (un bottone a testa), Plinko a turno con domande diverse.
// pzb4: sullo stesso telefono in 5: «È troppo!» a turno (ognuno vede scorrere i prezzi da capo).
// pzb5: online nella Sala in 3: partita intera; Luca ricarica a metà Plinko (ritrova risposte e gettoni), Sara ricarica mentre
//       scorrono i prezzi (il pannello riparte al prezzo giusto), Ada arriva tardi e guarda.
// pzb6: online nella Sala in 8: partita intera, tutti giocano insieme.
// pzb7: le misure a 360x640 e 412x915 (Bot in 6) mentre si gioca e nella rivelazione.
// pzb8: Plinko col Bot: a ogni domanda si tocca il prezzo sbagliato e, dopo l'esito, anche l'altro → non conta, le 3 domande
//       vanno avanti e si lasciano i gettoni (20 ott: prima la domanda dopo restava bloccata).
// pzb9: «Più o meno» col Bot: la regola resta circa 10 s con «Si comincia tra…» se nessuno tocca «Avanti»; dopo un prezzo sbagliato il tastierino è vuoto
//       (il prezzo provato resta nelle chip) e si riscrive da capo; poi il prezzo giusto viene preso.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function PZ() { if (!W.PZ) no("carica prima prezzo/base.js"); return W.PZ; }

  // ---- solo i nostri giochi a premi, sul telefono che tiene la partita ----
  function soloNostri(w) {
    var L = w.SG_PREZZO_PREMI || {};
    if (!L.troppo || !L.plinko) no("«È troppo!» o «Plinko» non sono registrati");
    Object.keys(L).forEach(function (k) { if (k !== "troppo" && k !== "plinko") delete L[k]; });
  }
  // spia: cosa è successo in ogni gioco a premi (dal telefono che tiene la partita)
  function spiaPremi(w) {
    var visti = {}, id = setInterval(function () {
      var H = w.__prezzoH; if (!H || !H.premio) return;
      var t = H.premio.tipo, v = visti[t] || (visti[t] = { gioca: false, riv: false });
      if (H.fase === "premio" && H.sotto === "gioca") v.gioca = true;
      if (H.fase === "premio" && H.sotto === "riv" && !v.riv) { v.riv = true; v.st = JSON.parse(JSON.stringify(H.premio.st)); v.punti = H.premio.punti; v.riv0 = H.premio.riv; v.n = H.players.filter(function (p) { return !p.via; }).length; }
    }, 100);
    return { visti: visti, ferma: function () { clearInterval(id); } };
  }

  // ---------------- il giocatore automatico dei nostri pannelli ----------------
  function tocca(w, b) { if (!b) return false; b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "touch" })); return true; }
  var MEM = {};
  function mem(nome, H) { var k = nome + "|" + H.k + "|" + ((H.premio && H.premio.st && H.premio.st.s) || ""); return MEM[k] || (MEM[k] = { bersaglio: {} }); }   // (st.s: le chiavi dei passi ricominciano a ogni partita)
  function fmtE(w, v) { return w.SGPrezzoScena.fmtE(v); }
  // opz.troppo(nome, j) → a quale prezzo fermarsi (di partenza: al primo sopra, a volte uno dopo o troppo presto)
  async function agisciB(nome, opz) {
    opz = opz || {};
    var w = W.finestra(nome); if (!w || !w.document) return false;
    var d = w.document, H = (W.finestra(opz.host || "Paky") || {}).__prezzoH, pan = d.querySelector(".pz-pan.su");
    if (!pan || !H || !H.premio || H.fase !== "premio" || H.sotto !== "gioca") return false;
    var st = H.premio.st, m = mem(nome, H);
    // ✋ È troppo!
    var disp = pan.querySelector(".pzb-tr-disp .n");
    if (disp) {
      var mt = /Prezzo (\d+) di/.exec(disp.textContent), i = mt ? +mt[1] - 1 : -1;
      if (i < 0) return false;
      var scegli = function (chi) { if (m.bersaglio[chi] == null) m.bersaglio[chi] = opz.troppo ? opz.troppo(chi, st.j) : st.j + [0, 0, 0, 1, -1, 2][Math.floor(Math.random() * 6)]; return m.bersaglio[chi]; };
      var btn = pan.querySelector(".pzb-tr-btn.vivo");
      var turno = ((pan.querySelector(".pz-pan-testa .tx") || {}).textContent || "").split(" · ")[0];   // (a turno: chi gioca adesso)
      if (btn) { if (i >= scegli(nome + ":" + turno)) { (W.__pzbTocchi = W.__pzbTocchi || []).push(turno + "@" + i); return tocca(w, btn); } return false; }
      var fatto = false;
      [].forEach.call(pan.querySelectorAll(".pzb-tr-bt:not(.fatto):not(.niente):not(.attesa)"), function (b) {
        var chi = ((b.querySelector(".chi span:last-child") || {}).textContent || "").trim();
        if (i >= scegli("tel:" + chi)) { (W.__pzbTocchi = W.__pzbTocchi || []).push("tel:" + chi + "@" + i); tocca(w, b); fatto = true; }
      });
      return fatto;
    }
    // 🟡 Plinko: l'occhio al prezzo
    var ops = [].slice.call(pan.querySelectorAll(".pzb-op"));
    if (ops.length === 2 && !ops[0].disabled) {
      if (m.ultimaQ && Date.now() - m.ultimaQ < 900) return false;
      var testi = ops.map(function (b) { return b.textContent.trim(); });
      var tutte = (st.comuni || []).slice(); if (st.dom) Object.keys(st.dom).forEach(function (k) { tutte = tutte.concat(st.dom[k]); });
      var q = tutte.filter(function (x) { return fmtE(w, x.opz[0]) === testi[0] && fmtE(w, x.opz[1]) === testi[1]; })[0];
      if (!q) return false;
      var giusto = Math.random() < (opz.bravura == null ? 0.75 : opz.bravura);
      m.ultimaQ = Date.now();
      return tocca(w, ops[giusto ? q.ok : 1 - q.ok]);
    }
    // 🟡 Plinko: dove lasciare i gettoni
    var zs = pan.querySelectorAll(".pzb-z"), ok = pan.querySelector(".pz-ok");
    if (zs.length === 9 && ok && !zs[0].disabled) {
      if (!ok.disabled && pan.querySelector(".pzb-z.sel")) { if (m.ultimoL && Date.now() - m.ultimoL < 500) return false; m.ultimoL = Date.now(); return tocca(w, ok); }
      var x = opz.zona != null ? opz.zona : 2 + Math.floor(Math.random() * 5);
      return tocca(w, zs[x]);
    }
    return false;
  }
  async function giocaTuttiB(nomi, finito, opz) {
    opz = opz || {};
    var fino = Date.now() + (opz.ms || 420000), giri = 0;
    while (Date.now() < fino) {
      if (finito()) return true;
      for (var i = 0; i < nomi.length; i++) {
        var fatto = false;
        try { fatto = await agisciB(nomi[i], opz); } catch (e) { (W.__pzbErr = W.__pzbErr || []).push(String(e && e.message || e)); }
        if (!fatto) try { await PZ().agisci(nomi[i], opz); } catch (e) {}
      }
      if (opz.ognuno) await opz.ognuno(++giri);
      await W.dorme(opz.passo || 250);
    }
    return finito();
  }
  // i controlli su com'è andato un gioco a premi
  function controllaTroppo(v, quanti) {
    if (!v || !v.riv) no("«È troppo!» non è uscito (o non è arrivato alla rivelazione)");
    var st = v.st, s = st.scala, salto = s[1] - s[0];
    for (var i = 1; i < s.length; i++) if (Math.abs((s[i] - s[i - 1]) - salto) > 0.01) no("i prezzi non salgono sempre dello stesso salto: " + s.join(", "));
    if (!(s[st.j] > st.prod.prezzo && s[st.j - 1] < st.prod.prezzo)) no("il vero non sta prima del gradino " + (st.j + 1) + ": " + st.prod.prezzo + " in " + s.join(", "));
    var ids = Object.keys(v.riv0.tocchi || {});
    if (quanti && ids.length !== quanti) no("«È troppo!»: tocchi di " + ids.length + " giocatori invece di " + quanti + " (" + JSON.stringify(v.riv0.tocchi) + ")");
    var fermi = ids.filter(function (id) { return v.riv0.tocchi[id] >= 0; });
    if (!fermi.length) no("«È troppo!»: non si è fermato nessuno (" + JSON.stringify(v.riv0.tocchi) + ")");
    ids.forEach(function (id) {
      var i2 = v.riv0.tocchi[id], atteso = i2 < 0 ? 0 : i2 < st.j ? [200, 100][st.j - i2 - 1] || 0 : [600, 450, 350, 250][i2 - st.j] || 150;
      if ((v.punti[id] || 0) !== atteso) no("«È troppo!»: " + id + " fermo al " + (i2 + 1) + "° (giusto il " + (st.j + 1) + "°) ha " + v.punti[id] + " punti invece di " + atteso);
    });
    return "✋ fermi " + fermi.length + "/" + ids.length + " (giusto il " + (st.j + 1) + "°: " + ids.map(function (id) { return v.riv0.tocchi[id] + 1; }).join(",") + ")";
  }
  function controllaPlinko(v, quanti) {
    if (!v || !v.riv) no("«Plinko» non è uscito (o non è arrivato alla rivelazione)");
    var riv = v.riv0, ids = riv.ids || [], CASE = [10, 25, 50, 0, 200, 0, 50, 25, 10];
    if (quanti && ids.length !== quanti) no("Plinko: " + ids.length + " giocatori invece di " + quanti);
    var tot = {}, auto = 0;
    (riv.gett || []).forEach(function (x) { tot[x.id] = (tot[x.id] || 0) + CASE[x.b]; if (x.auto) auto++; if (x.s.length !== 12) no("Plinko: percorso di " + x.s.length + " file"); });
    ids.forEach(function (id) {
      var n = (riv.gett || []).filter(function (x) { return x.id === id; }).length;
      if (n !== riv.gettoni[id] || n !== 1 + ((v.st.giusti || {})[id] || 0)) no("Plinko: " + id + " ha " + n + " gettoni (ne aveva vinti " + riv.gettoni[id] + ")");
      tot[id] = (tot[id] || 0) + 50 * ((v.st.giusti || {})[id] || 0);   // +50 per ogni prezzo indovinato
      if ((v.punti[id] || 0) !== (tot[id] || 0)) no("Plinko: punti di " + id + " " + v.punti[id] + " invece di " + tot[id]);
    });
    var risposte = ids.filter(function (id) { return ((v.st.risp || {})[id] || []).length === 3; }).length;
    return "🟡 gettoni " + (riv.gett || []).length + " (lasciati dal caso " + auto + "), risposte complete " + risposte + "/" + ids.length + ", punti " + ids.map(function (id) { return v.punti[id]; }).join(",");
  }
  function errori() { var e = W.erroriTel(); return e.length ? " · ERRORI: " + e.slice(0, 3).join(" / ") : ""; }

  // ===================== pzb1: le regole =====================
  COPIONE.aggiungi("pzb1", { nome: "Prezzo, giochi a premi b: le regole di «È troppo!» e «Plinko»", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), B = w.__prezzoPremiB, L = w.SG_PREZZO_PREMI, SP = w.SG_PREZZO, F = w.SGPrezzoScena.fmtE;
    if (!B || !L.troppo || !L.plinko) no("il file b non è caricato");
    var prods = SP.prodotti, cari = prods.filter(function (p) { return p.prezzo >= 2000; });
    if (cari.length < 60) no("pochi prodotti sopra i 2.000 €: " + cari.length);
    var js = {};
    prods.filter(function (p) { return p.prezzo >= 300; }).forEach(function (p) {
      for (var k = 0; k < 15; k++) {
        var r = B.scalaTroppo(p.prezzo, Math.random), s = r.scala, salto = s[1] - s[0]; js[r.j] = 1;
        for (var i = 1; i < 10; i++) if (Math.abs(s[i] - s[i - 1] - salto) > 0.01) no("salti diversi: " + s);
        if (!(s[0] > 0 && s[r.j] >= p.prezzo * 1.025 && s[r.j - 1] <= p.prezzo * 0.985)) no("gradini attorno al vero (" + p.prezzo + "): " + s);
        if (r.j < 2 || r.j > 7) no("il primo sopra deve stare tra il 3° e l'8°: " + r.j);
        if (/,/.test(F(s[0])) || /,/.test(F(s[9]))) no("prezzi coi centesimi sulla scala: " + s);
      }
    });
    if (Object.keys(js).length < 6) no("il primo sopra non cambia posto: " + Object.keys(js));
    if (B.puntiTroppo(3, 3) !== 600 || B.puntiTroppo(4, 3) !== 450 || B.puntiTroppo(5, 3) !== 350 || B.puntiTroppo(6, 3) !== 250 || B.puntiTroppo(9, 3) !== 150 || B.puntiTroppo(2, 3) !== 200 || B.puntiTroppo(1, 3) !== 100 || B.puntiTroppo(0, 3) || B.puntiTroppo(-1, 3)) no("punti di «È troppo!»");
    prods.filter(function (p) { return p.prezzo >= 1 && p.prezzo < 100; }).forEach(function (p) {
      for (var k = 0; k < 8; k++) { var f = B.finto(p.prezzo, Math.random), dd = Math.abs(f - p.prezzo) / p.prezzo; if (!(f > 0) || dd < 0.17 || dd > 0.8) no("prezzo sbagliato poco credibile: " + p.prezzo + " → " + f); }
    });
    // la caduta: dal centro il 200 (la casella di mezzo) esce più o meno una volta su quattro, dai lati poche volte (3%)
    var c = 0, l = 0; for (var i = 0; i < 4000; i++) { if (B.cade(4, Math.random).b === 4) c++; if (B.cade(0, Math.random).b === 4) l++; }
    if (c < 700 || c > 1150 || l > 250) no("la caduta del Plinko: casella di mezzo dal centro " + c + "/4000, dal lato " + l);
    var p = B.cade(8, Math.random), q = B.percorso(8, p.s); if (q[12] / 2 !== p.b || q.some(function (x) { return x < 0 || x > 16; })) no("percorso e casella non tornano");
    // il gioco a premi da solo, con un P finto (host)
    var fP = function (ids) { var priv = [], fatti = {}; return { ids: ids, n: ids.length, modo: "online", locale: false, rnd: Math.random, nome: function (x) { return x; },
      pesca: function (f, n) { return prods.filter(f || function () { return true; }).slice(0, n).map(function (x) { return Object.assign({}, x); }); },
      passo: w.SGPrezzoScena.passo, arrotonda: w.SGPrezzoScena.arrotonda, fmtE: F, tondo2: function (v) { return Math.round(v * 100) / 100; },
      privato: function (id, m) { priv.push([id, m]); }, fatto: function (id) { fatti[id] = 1; }, _priv: priv, _fatti: fatti }; };
    var P = fP(["a", "b", "c"]), g = L.plinko, st = g.prepara(P);
    g.mossa(st, "a", { q: 0, s: st.comuni[0].ok }, P); g.mossa(st, "a", { q: 0, s: st.comuni[0].ok }, P);   // la seconda non vale
    g.mossa(st, "a", { q: 1, s: 1 - st.comuni[1].ok }, P); g.mossa(st, "a", { q: 2, s: -1 }, P);
    g.mossa(st, "a", { x: 4 }, P); g.mossa(st, "a", { x: 2 }, P); g.mossa(st, "a", { x: 4 }, P);
    if (!P._fatti.a || st.lanci.a.length !== 2) no("Plinko: 1 giusta = 2 gettoni, poi ha finito: " + JSON.stringify(st.lanci));
    g.mossa(st, "b", { x: 4 }, P);   // senza risposte non si lascia niente
    if ((st.lanci.b || []).length) no("Plinko: si lascia un gettone senza aver risposto");
    var pv = g.privatoDi(st, "a", P).storia; if (pv.r.length !== 3 || pv.g !== 2 || pv.l.length !== 2) no("Plinko: i segreti per chi ricarica: " + JSON.stringify(pv));
    var pub = JSON.stringify(g.pubblico(st, P)); if (pub.indexOf('"ok"') >= 0 || pub.indexOf("prezzo") >= 0) no("Plinko: nella foto c'è la risposta giusta: " + pub.slice(0, 200));
    var fi = g.fine(st, P); if (fi.riv.gett.length !== 4 || fi.riv.gett.filter(function (x) { return x.auto; }).length !== 2) no("Plinko: i gettoni non lasciati li lascia il caso: " + JSON.stringify(fi.riv.gett.map(function (x) { return x.id + x.auto; })));
    var gt = L.troppo, P2 = fP(["a", "b", "c", "d"]), s2 = gt.prepara(P2);
    if (JSON.stringify(gt.pubblico(s2, P2)).indexOf('"prezzo"') >= 0) no("«È troppo!»: nella foto c'è il prezzo vero");
    gt.mossa(s2, "a", { i: s2.j }, P2); gt.mossa(s2, "a", { i: 0 }, P2); gt.mossa(s2, "b", { i: s2.j - 1 }, P2); gt.mossa(s2, "c", { i: 99 }, P2);
    var f2 = gt.fine(s2, P2);
    if (f2.punti.a !== 600 || f2.punti.b !== 200 || f2.punti.c || f2.punti.d || !f2.carrello.a || f2.carrello.b) no("«È troppo!»: punti " + JSON.stringify(f2.punti));
    // stesso telefono, tutti insieme: un messaggio coi tocchi di tutti
    var P3 = fP(["a", "b", "c"]); P3.modo = "telefono"; P3.locale = true; var s3 = gt.prepara(P3);
    if (!s3.insieme) no("«È troppo!» sullo stesso telefono in 3: non è «tutti insieme»");
    gt.mossa(s3, "a", { tutti: { a: s3.j, b: s3.j + 1, c: -1 }, ord: ["b", "a"] }, P3);
    if (!P3._fatti.a || !P3._fatti.b || !P3._fatti.c || s3.tocchi.b !== s3.j + 1 || s3.tocchi.c !== -1) no("tutti insieme: " + JSON.stringify(s3.tocchi));
    var P5 = fP(["a", "b", "c", "d", "e"]); P5.modo = "telefono"; if (gt.prepara(P5).insieme) no("in 5 sullo stesso telefono deve essere a turno");
    // il Bot: più è bravo, più si ferma al momento giusto
    var bravo = function (liv) { var ok = 0; for (var k = 0; k < 300; k++) { var s = gt.prepara(P2), m = gt.bot(s, { id: "x", livello: liv }, P2); if (m.length && m[0].m.i === s.j) ok++; } return ok; };
    var bf = bravo("facile"), bd = bravo("difficile");
    if (!(bd > bf)) no("il Bot difficile non è più bravo del facile: " + bd + " / " + bf);
    var mb = L.plinko.bot(st, { id: "c", livello: "medio" }, P);
    if (mb.some(function (x) { return x.ms > 32000; }) || mb.filter(function (x) { return x.m.x != null; }).length < 1) no("Plinko, mosse del Bot: " + JSON.stringify(mb));
    return cari.length + " cose sopra i 2.000 € · Bot al momento giusto: difficile " + bd + "/300, facile " + bf + "/300 · casella di mezzo dal centro " + Math.round(c / 40) + "%";
  } });

  // ===================== pzb2: contro il Bot =====================
  COPIONE.aggiungi("pzb2", { nome: "Prezzo: 🤖 Contro il Bot (3), 📺 ⚡ Veloce con «È troppo!» e «Plinko»", fai: async function () {
    var w = await PZ().contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 3 });
    soloNostri(w);
    var sp = spiaPremi(w), fasi = PZ().spiaFasi("Paky");
    var ok = await giocaTuttiB(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 420000 });
    sp.ferma(); fasi.ferma();
    if (!ok) no("la partita col Bot non finisce (" + fasi.viste.join(" → ") + ")");
    var a = controllaTroppo(sp.visti.troppo, 4), b = controllaPlinko(sp.visti.plinko, 4);
    var bots = w.__prezzoH.players.filter(function (p) { return p.bot; }).map(function (p) { return p.id; });
    var st = sp.visti.plinko.st; if (!bots.every(function (id) { return (st.lanci[id] || []).length; })) no("i Bot non hanno lasciato i gettoni: " + JSON.stringify(st.lanci));
    if (fasi.viste.indexOf("scegli") < 0) no("chi ha vinto l'Offerta non ha scelto il gioco a premi (" + fasi.viste.join(" → ") + ")");
    return a + " · " + b + errori();
  } });

  // ===================== pzb3 / pzb4: sullo stesso telefono =====================
  async function telefono(amici) {
    var w = await PZ().stessoTelefono(amici, { formato: "tv", durata: "veloce", offerte: "vista" });
    soloNostri(w);
    if (!await W.aspetta(function () { return W.clicca(w, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita non comincia");
    var sp = spiaPremi(w), fasi = PZ().spiaFasi("Paky"), insiemeVisto = false, turniTroppo = 0, chiTroppo = {};
    W.__pzbTocchi = [];
    var ok = await giocaTuttiB(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 600000, ognuno: function () {
      if (w.document.querySelector(".pz-pan.su .pzb-tr-griglia")) insiemeVisto = true;
      var H = w.__prezzoH, tx = (w.document.querySelector(".pz-pan.su .pz-pan-testa .tx") || {}).textContent || "";
      if (H.premio && H.premio.tipo === "troppo" && H.sotto === "gioca" && /✋/.test(tx) && !chiTroppo[tx]) { chiTroppo[tx] = 1; turniTroppo++; }
    } });
    sp.ferma(); fasi.ferma();
    if (!ok) no("la partita sullo stesso telefono non finisce (" + fasi.viste.join(" → ") + ", fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + ")");
    return { w: w, sp: sp, insieme: insiemeVisto, turni: turniTroppo };
  }
  COPIONE.aggiungi("pzb3", { nome: "Prezzo: 📱 sullo stesso telefono in 3, «È troppo!» tutti insieme e Plinko a turno", fai: async function () {
    var X = await telefono(["Luca", "Sara"]);
    if (!X.insieme) no("«È troppo!» in 3 sullo stesso telefono: non c'erano i bottoni per tutti");
    var a = controllaTroppo(X.sp.visti.troppo, 3), b = controllaPlinko(X.sp.visti.plinko, 3);
    var st = X.sp.visti.plinko.st, ds = Object.keys(st.dom || {}).map(function (id) { return st.dom[id].map(function (q) { return q.p.id; }).join(","); });
    if (ds.length !== 3 || ds[0] === ds[1] || ds[1] === ds[2]) no("Plinko sullo stesso telefono: le domande non sono diverse per ognuno (" + ds.join(" | ") + ")");
    if (X.turni > 1) no("«È troppo!» tutti insieme si è aperto " + X.turni + " volte");
    return a + " · " + b + " · tocchi " + (W.__pzbTocchi || []).join(" ") + errori();
  } });
  COPIONE.aggiungi("pzb4", { nome: "Prezzo: 📱 sullo stesso telefono in 5, «È troppo!» a turno", fai: async function () {
    var X = await telefono(["Luca", "Sara", "Giulia", "Marco"]);
    if (X.insieme) no("in 5 «È troppo!» doveva essere a turno, non tutti insieme");
    var a = controllaTroppo(X.sp.visti.troppo, 5), b = controllaPlinko(X.sp.visti.plinko, 5);
    if (X.turni < 5) no("«È troppo!» a turno: si è aperto per " + X.turni + " giocatori invece di 5");
    return a + " · " + b + " · turni ✋ " + X.turni + errori();
  } });

  // ===================== online nella Sala =====================
  async function online(amici) {
    PZ().conSpia();
    var X = await PZ().salaPrezzo(amici, { formato: "tv", durata: "veloce", offerte: "vista" });
    soloNostri(X.P);
    return X;
  }
  COPIONE.aggiungi("pzb5", { nome: "Prezzo online nella Sala in 3: «È troppo!» e «Plinko», chi ricarica e chi arriva tardi", fai: async function () {
    try {
      var X = await online(["Luca", "Sara"]), C = X.C, P = X.P, note = [];
      var sp = spiaPremi(P), fasi = PZ().spiaFasi("Paky"), nomi = ["Paky", "Luca", "Sara"];
      var ricL = false, ricS = false, tardi = false, lucaOk = null, saraOk = null, adaOk = null, prom = [];   // (le prove lente non fermano chi gioca)
      var ok = await giocaTuttiB(nomi, function () { return vm(C).fase === "fine"; }, { ms: 480000, ognuno: async function () {
        var H = P.__prezzoH; if (!H.premio || H.fase !== "premio" || H.sotto !== "gioca") return;
        var lid = (H.players.filter(function (p) { return p.nome === "Luca"; })[0] || {}).id, sid = (H.players.filter(function (p) { return p.nome === "Sara"; })[0] || {}).id;
        // Luca ricarica a metà Plinko: dopo aver lasciato il primo gettone (o risposto a tutte)
        if (H.premio.tipo === "plinko" && !ricL && ((H.premio.st.lanci[lid] || []).length >= 1 || (H.premio.st.risp[lid] || []).length >= 2) && !H.premio.fatti[lid]) {
          ricL = true; prom.push((async function () { var prima = { r: (H.premio.st.risp[lid] || []).length, l: (H.premio.st.lanci[lid] || []).length };
          var wl = await W.ricarica("Luca");
          lucaOk = await W.aspetta(function () {
            var pan = wl.document.querySelector(".pz-pan.su"); if (!pan) return false;
            if (prima.r >= 3) { var k = pan.querySelectorAll(".pzb-z .k"); var n = 0; [].forEach.call(k, function (e) { n += +e.textContent; }); return n >= prima.l && pan.querySelector(".pzb-z"); }
            var t = (pan.querySelector(".pzb-qtesta") || {}).textContent || ""; return new RegExp((prima.r + 1) + " di 3").test(t);
          }, 15000);
          if (!lucaOk) note.push("Luca dopo la ricarica non ritrova il Plinko a metà (" + JSON.stringify(prima) + " · " + T(wl).slice(-160) + ")");
          })());
        }
        // Sara ricarica mentre scorrono i prezzi: il pannello riparte dal prezzo giusto (lo stesso dell'host, ±1)
        if (H.premio.tipo === "troppo" && !ricS && H.premio.st.tocchi[sid] == null) {
          var wsv = W.finestra("Sara"), dn = wsv.document.querySelector(".pz-pan.su .pzb-tr-disp .n"), mm = dn && /Prezzo (\d+)/.exec(dn.textContent);
          if (mm && +mm[1] >= 2 && +mm[1] <= 4) {
            ricS = true; prom.push((async function () { var ws = await W.ricarica("Sara");
            saraOk = await W.aspetta(function () {
              var d2 = ws.document.querySelector(".pz-pan.su .pzb-tr-disp .n"), m2 = d2 && /Prezzo (\d+)/.exec(d2.textContent), dp = P.document.querySelector(".pzb-tr-p"), hp = P.document.querySelector(".pz-pan .pzb-tr-disp .n"), mh = hp && /Prezzo (\d+)/.exec(hp.textContent);
              return m2 && mh && Math.abs(+m2[1] - +mh[1]) <= 1 ? m2[1] + "≈" + mh[1] : false;
            }, 12000);
            if (!saraOk) note.push("Sara dopo la ricarica non torna sui prezzi che scorrono insieme agli altri");
            })());
          }
        }
        // Ada arriva a partita cominciata, durante il Plinko: guarda (senza pannello), niente errori
        if (!tardi && H.premio.tipo === "plinko") {
          tardi = true; prom.push((async function () {
          var wa = await W.apriTel("Ada", { hash: "sala=" + X.S, x: 555, salaSempre: true });
          await W.dorme(9000);
          adaOk = await W.aspetta(function () { var f = W.finestra("Ada"); if (!f || !f.document.body || f.document.querySelector(".pz-pan.su .pzb-tr-btn, .pz-pan.su .pzb-op, .pz-pan.su .pzb-z")) return false; return f.document.querySelector(".st-vista") ? "guarda lo studio" : "aspetta («" + T(f).slice(0, 70) + "»)"; }, 15000);
          if (!adaOk) note.push("Ada arrivata tardi non guarda lo studio (" + T(wa).slice(-140) + ")");
          })());
        }
      } });
      sp.ferma(); fasi.ferma(); await Promise.all(typeof prom !== "undefined" ? prom : []);
      if (!ok) no("la partita online non finisce (" + vm(C).fase + "." + vm(C).sotto + " · " + fasi.viste.join(" → ") + ")");
      var a = controllaTroppo(sp.visti.troppo, null), b = controllaPlinko(sp.visti.plinko, null);
      if (!ricL) note.push("(Luca non ha ricaricato: il Plinko è andato troppo veloce)");
      if (!ricS) note.push("(Sara non ha ricaricato durante i prezzi)");
      if (note.some(function (n) { return !/^\(/.test(n); })) no(note.join(" · "));
      return a + " · " + b + " · Luca " + lucaOk + " · Sara " + saraOk + " · Ada " + adaOk + " " + note.join(" ") + errori();
    } finally { PZ().senzaSpia(); }
  } });
  COPIONE.aggiungi("pzb6", { nome: "Prezzo online nella Sala in 8: «È troppo!» e «Plinko» tutti insieme", fai: async function () {
    try {
      var amici = ["Luca", "Sara", "Giulia", "Marco", "Bea", "Toni", "Ada"];
      var X = await online(amici), C = X.C, P = X.P;
      var sp = spiaPremi(P), fasi = PZ().spiaFasi("Paky"), fermiSch = 0;
      var ok = await giocaTuttiB(["Paky"].concat(amici), function () { return vm(C).fase === "fine"; }, { ms: 540000, passo: 150, ognuno: function () {
        var n = W.finestra("Bea").document.querySelectorAll(".pz-sch .pz-och").length; if (n > fermiSch) fermiSch = n;
      } });
      sp.ferma(); fasi.ferma(); await Promise.all(typeof prom !== "undefined" ? prom : []);
      if (!ok) no("la partita in 8 non finisce (" + vm(C).fase + "." + vm(C).sotto + ")");
      var a = controllaTroppo(sp.visti.troppo, 8), b = controllaPlinko(sp.visti.plinko, 8);
      if (fermiSch < 3) no("sul maxischermo di Bea non si vedono gli amici che si fermano («✋ Luca»): " + fermiSch);
      return a + " · " + b + " · ✋ sul maxischermo " + fermiSch + errori();
    } finally { PZ().senzaSpia(); }
  } });

  // ===================== pzb7: le misure =====================
  COPIONE.aggiungi("pzb7", { nome: "Prezzo, «È troppo!» e «Plinko»: le misure a 360x640 e 412x915 (Bot in 6)", fai: async function () {
    var esiti = [], misure = W.__pzb7misure || [[360, 640], [412, 915]];
    for (var mi = 0; mi < misure.length; mi++) {
      var wh = misure[mi];
      var w = await PZ().contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 5 });
      soloNostri(w);
      var f = document.getElementById("tel-Paky"); f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize"));
      var guai = {}, visti = {};
      await giocaTuttiB(["Paky"], function () { return w.__prezzoH.fase === "fine"; }, { ms: 420000, passo: 200, ognuno: async function () {
        var H = w.__prezzoH; if (H.fase !== "premio" || H.sotto === "intro") return;
        var k = H.premio.tipo + "." + H.sotto + "." + (w.document.querySelector(".pz-pan.su .pzb-z") ? "lancio" : w.document.querySelector(".pz-pan.su .pzb-op") ? "occhio" : "");
        if ((visti[k] || 0) > 4) return; visti[k] = (visti[k] || 0) + 1;
        PZ().controllaVista(w).forEach(function (g) { guai[k + ": " + g] = 1; });
        // le cose nostre: la parete, la scala, il bottone, le chip
        var h = w.innerHeight, pan = w.document.querySelector(".pz-pan.su"), basso = h - (pan ? pan.offsetHeight : 0);
        [].forEach.call(w.document.querySelectorAll(".st-sch-in .pzb-pl-in, .st-sch-in .pzb-rg, .st-sch-in .pzb-tr-p, .st-sch-in .pzb-pl-ch, .st-sch-in .pzb-tr-tacche, .st-sch-in .pzb-mai"), function (e) {
          var r = e.getBoundingClientRect(); if (!r.height || !w.document.querySelector(".st-mondo.st-quieto")) return;
          if (r.bottom > basso + 2) guai[k + ": " + e.className.split(" ")[0] + " sotto il pannello (" + Math.round(r.bottom) + ">" + Math.round(basso) + ")"] = 1;
          if (r.left < -1 || r.right > w.innerWidth + 1) guai[k + ": " + e.className.split(" ")[0] + " esce di lato"] = 1;
        });
        if (pan) [].forEach.call(pan.querySelectorAll(".pzb-tr-btn, .pzb-op, .pzb-z, .pz-ok, .pzb-mini-tav, .pzb-tr-bt"), function (e) { var r = e.getBoundingClientRect(), pr = pan.getBoundingClientRect(); if (r.height && (r.bottom > pr.bottom + 1 || r.right > w.innerWidth + 1)) guai[k + ": " + e.className.split(" ")[0] + " fuori dallo schermo"] = 1; });
      } });
      esiti.push(wh.join("x") + ": " + (Object.keys(guai).length ? Object.keys(guai).slice(0, 8).join(" | ") : "ok") + " (visti " + Object.keys(visti).join(", ") + ")");
      A.pulisci();
    }
    if (esiti.some(function (e) { return !/: ok/.test(e); })) no(esiti.join(" ‖ "));
    return esiti.join(" ‖ ") + errori();
  } });

  // ===================== pzb8: Plinko, dopo l'esito si tocca anche l'altro prezzo =====================
  // (20 ott: il secondo tocco lasciava la domanda dopo bloccata: i tasti c'erano ma non rispondevano più)
  COPIONE.aggiungi("pzb8", { nome: "Prezzo: Plinko, dopo l'esito si tocca anche l'altro prezzo: non conta e le domande vanno avanti", fai: async function () {
    var w = await PZ().contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 1 });
    var L = w.SG_PREZZO_PREMI || {}; if (!L.plinko) no("«Plinko» non è registrato");
    Object.keys(L).forEach(function (k) { if (k !== "plinko") delete L[k]; });
    var H = function () { return w.__prezzoH; };
    if (!await giocaTuttiB(["Paky"], function () { var h = H(); return h.fase === "premio" && h.premio && h.premio.tipo === "plinko"; }, { ms: 240000 })) no("non si arriva a Plinko");
    var io = H().players.filter(function (p) { return !p.bot; })[0].id;
    for (var q = 0; q < 3; q++) {
      var ops = await W.aspetta(function () {
        var l = [].slice.call(w.document.querySelectorAll(".pz-pan.su .pzb-op")), t = (w.document.querySelector(".pz-pan.su .pzb-qtesta span") || {}).textContent || "";
        return l.length === 2 && !l[0].disabled && !l[1].disabled && t.indexOf((q + 1) + " di 3") >= 0 ? l : null;
      }, 15000);
      if (!ops) no("la domanda " + (q + 1) + " di Plinko non arriva («" + ((w.document.querySelector(".pz-pan.su") || {}).textContent || "").slice(0, 120) + "»)");
      var d = H().premio.st.comuni[q], sb = ops[1 - d.ok], gi = ops[d.ok];
      tocca(w, sb);
      if (!await W.aspetta(function () { return sb.classList.contains("sbagliato"); }, 4000)) no("alla domanda " + (q + 1) + " il tocco sul prezzo sbagliato non dà l'esito (i tasti non rispondono)");
      tocca(w, gi);   // il secondo tocco, sull'altro prezzo: non deve contare
      await W.dorme(100);
    }
    if (!await W.aspetta(function () { return w.document.querySelectorAll(".pz-pan.su .pzb-z").length === 9; }, 5000)) no("dopo le 3 domande non si lasciano i gettoni");
    var risp = (H().premio.st.risp || {})[io] || [], giusti = (H().premio.st.giusti || {})[io] || 0;
    if (risp.length !== 3 || giusti !== 0) no("risposte arrivate: " + JSON.stringify(risp) + ", giuste " + giusti + " (dovevano essere 3 sbagliate: il secondo tocco non conta)");
    if (!await giocaTuttiB(["Paky"], function () { return H().fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 300000 })) no("la partita non finisce (fase " + H().fase + "." + H().sotto + ")");
    return "3 domande col doppio tocco: risposte " + JSON.stringify(risp) + ", 1 gettone, partita finita" + errori();
  } });

  // ===================== pzb9: Più o meno, il tastierino riparte vuoto; la regola resta ~10 s =====================
  COPIONE.aggiungi("pzb9", { nome: "Prezzo: Più o meno, dopo un prezzo sbagliato il tastierino riparte vuoto; la regola resta ~10 s con «Si comincia tra…»", fai: async function () {
    var w = await PZ().contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 1 });
    var L = w.SG_PREZZO_PREMI || {}; if (!L.piuomeno) no("«Più o meno» non è registrato");
    Object.keys(L).forEach(function (k) { if (k !== "piuomeno") delete L[k]; });
    var H = function () { return w.__prezzoH; }, intro = null;
    var ok = await PZ().giocaTutti(["Paky"], function () {
      var h = H();
      if (h.fase === "premio" && h.sotto === "intro") { if (!intro) intro = { t0: Date.now(), conto: false }; if (/Si comincia tra/.test(T(w))) intro.conto = true; }
      return h.fase === "premio" && h.sotto === "gioca" && w.document.querySelector(".pz-pan.su .pz-ok");
    }, { ms: 240000, passo: 200, avanti: false });
    if (!ok) no("non si arriva a «Più o meno»");
    if (!intro) no("la regola del gioco a premi non si è vista");
    var durIntro = Date.now() - intro.t0;
    if (durIntro < 8000) no("la regola è restata solo " + durIntro + " ms (deve essere circa 10 s)");
    if (!intro.conto) no("sulla regola manca «Si comincia tra…»");
    function tasto(tx) { return [].filter.call(w.document.querySelectorAll(".pz-pan.su .pz-k"), function (x) { return x.textContent.trim() === tx; })[0]; }
    function disp() { return ((w.document.querySelector(".pz-pan.su .pz-disp .v") || {}).textContent || "").trim(); }
    var p = H().premio.st.prod.prezzo, sbagliato = Math.max(1, Math.round(p * 0.5));
    String(sbagliato).split("").forEach(function (c) { tocca(w, tasto(c)); });
    if (disp().replace(/\D/g, "") !== String(sbagliato)) no("sul tastierino non c'è " + sbagliato + " («" + disp() + "»)");
    tocca(w, w.document.querySelector(".pz-pan.su .pz-ok"));
    if (!await W.aspetta(function () { return /PIÙ SU|PIÙ GIÙ/.test(T(w)); }, 4000)) no("dopo «Prova!» non arriva «più su / più giù»");
    await W.dorme(150);
    var v = w.document.querySelector(".pz-pan.su .pz-disp .v");
    if (!v || !v.classList.contains("vuoto")) no("dopo il prezzo sbagliato il tastierino non è vuoto («" + disp() + "»)");
    var chip = [].map.call(w.document.querySelectorAll(".pz-pan.su .pz-offrow .pz-offch"), function (c) { return c.textContent; }).join(" | ");
    if (chip.replace(/\./g, "").indexOf(String(sbagliato)) < 0) no("il prezzo provato non resta nelle chip qui sopra («" + chip + "»)");
    tocca(w, tasto("7"));
    if (disp().replace(/\D/g, "") !== "7") no("riscrivendo, il tastierino non riparte da capo («" + disp() + "»)");
    for (var i = 0; i < 3; i++) tocca(w, tasto("⌫"));
    String(Math.round(p)).split("").forEach(function (c) { tocca(w, tasto(c)); });
    tocca(w, w.document.querySelector(".pz-pan.su .pz-ok"));
    if (!await W.aspetta(function () { return /PRESO/.test(T(w)); }, 4000)) no("il prezzo giusto (" + Math.round(p) + ") non viene preso");
    if (!await PZ().giocaTutti(["Paky"], function () { return H().fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 300000 })) no("la partita non finisce (fase " + H().fase + "." + H().sotto + ")");
    return "regola " + (durIntro / 1000).toFixed(1).replace(".", ",") + " s con «Si comincia tra…» · sbagliato " + sbagliato + " → tastierino vuoto, chip «" + chip + "», riscritto da capo · preso " + Math.round(p) + errori();
  } });

  W.PZB = { agisciB: agisciB, giocaTuttiB: giocaTuttiB, soloNostri: soloNostri, spiaPremi: spiaPremi, controllaTroppo: controllaTroppo, controllaPlinko: controllaPlinko };
})();
