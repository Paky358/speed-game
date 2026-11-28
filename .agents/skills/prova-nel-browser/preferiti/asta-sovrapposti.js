// 👀 PROVE «MAI UN CALCIATORE NASCOSTO DIETRO UN ALTRO» NELLA GIORNATA DELLA MINI ASTA (28 nov 2026, il proprietario provando da solo:
// «il mio calciatore sembra la passi all'avversario e che l'avversario faccia gol, e solo dopo il gol, grazie all'esultanza, si vede che in
// realtà c'è il nostro compagno di squadra proprio dietro all'altro giocatore… Molto vicino sì, anche che uno copre un po' di parte del corpo
// dell'altro va bene, ma non completamente»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-sovrapposti.js"); await COPIONE.prova("sv1")
// Con Edge invisibile: prova.js --porta 8997 --carica preferiti/asta.js,preferiti/asta-sovrapposti.js --prova sv0,sv1,sv2
//
// Come si misura: come si DISEGNANO. Il campo vero del gioco (360x640, in prospettiva come oggi), le azioni vere delle giornate (oggi e 3
// stagioni passate, in 2, 4 e 8: chi tira, chi passa, i vostri con l'etichetta, gli altri posti, l'arbitro, i guardalinee). Ogni azione si
// guarda 100 volte (ogni centesimo); per ogni omino si prendono 21 punti della sua sagoma sullo schermo (gambe, pantaloncini, maglia, testa,
// con la sua posa: in salto, a terra, in tuffo) e si conta quanti sono coperti dagli omini disegnati DOPO di lui (quelli davanti). Coperto =
// si vede meno di metà corpo (fino al gol: dopo, gli abbracci). Conta quando dura almeno 4 centesimi di fila (un attimo che si incrociano correndo non conta). Non conta
// chi è fuori dallo schermo, né quando tutti e due sono sul pallone (un contrasto: lì si toccano) e chi è coperto da un arbitro o un guardalinee conta lo stesso.
// sv1 Col gioco di adesso: nessun vostro calciatore, nessuno col pallone e nessuno di chi fa l'azione resta coperto; gli altri posti quasi mai.
// sv0 La stessa misura col gioco di prima (senza il passetto di lato): deve trovare i calciatori coperti, se no la prova non guarda.
// sv2 ANTI-SPOILER: 42 azioni × 3 semi × verso in su e in giù × 7 esiti, disegnate come nel gioco: fino a quando il pallone prende strade
//     diverse (il tiro) TUTTI gli omini sono nello stesso punto dello schermo in ogni esito (entro un centesimo di pixel), spostamenti compresi.
//     Se qualcosa è già diverso di un filo anche senza il passetto (c’era già prima), da quel momento quella coppia di esiti non si guarda.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w, prima) {   // il file del gioco con le funzioni di dentro portate fuori (solo per la prova)
    w.SGCuore.precarica("astafanta");
    if (!await W.aspetta(function () { return w.SG_FANTA_CALCIATORI && w.SG_FANTA_SQUADRE && w.SG_FANTA_STATISTICHE && w.SG_FANTA_RUOLI; }, 20000)) no("i dati del fanta non arrivano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "  function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    if (src.indexOf("A.figureCb(") < 0) no("nel gioco manca il gancio delle prove (A.figureCb)");
    if (prima) { if (src.indexOf("var SEPARA = true") < 0) no("sv0: non trovo l'interruttore SEPARA"); src = src.replace("var SEPARA = true", "var SEPARA = false"); }   // (sv0: come prima del 28 nov 2026)
    src = src.replace(ag, "FUORI.cl = classificaFanta; FUORI.lista = listaMomenti; FUORI.momento = momentoSerieA; FUORI.campo = campoAzioni; FUORI.usa = usaStagione; FUORI.carica = caricaStagione; FUORI.pronta = stagionePronta; FUORI.ELENCO = ELENCO_STAGIONI; FUORI.scena = scena; FUORI.lungo = lungo; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    F.w = w; return F;
  }
  function rose(w, n) {   // n rose da 5 senza doppioni, un portiere per squadra (dalla stagione in uso)
    var L = w.SG_FANTA_CALCIATORI, Q = (w.SG_FANTA_QUOTAZIONI || {}).valori || {}, pool = {};
    "PDCA".split("").forEach(function (r) { pool[r] = []; ["A", "B", "C"].forEach(function (t) { ((L[r] || {})[t] || []).forEach(function (k) { var m = /^(.*) \((.*)\)$/.exec(k); if (m) pool[r].push({ nome: m[1], squadra: m[2], ruolo: r, q: Q[k] || 1 }); }); }); });
    var usati = {}, sqP = {}, out = [];
    for (var i = 0; i < n; i++) {
      var kit = [];
      ["P", "D", "C", "C", "A"].forEach(function (r) { var c, g = 0; do { c = pool[r][Math.floor(Math.random() * pool[r].length)]; g++; } while ((usati[c.nome + c.squadra] || (r === "P" && sqP[c.squadra])) && g < 500); usati[c.nome + c.squadra] = 1; if (r === "P") sqP[c.squadra] = 1; kit.push(c); });
      out.push({ id: "g" + i, nome: "G" + i, crediti: 0, kit: kit });
    }
    return out;
  }
  function campo(F, w) {
    var d = w.document, box = d.createElement("div"); box.style.cssText = "position:fixed;left:0;top:0;width:360px;height:640px;z-index:99999"; d.body.appendChild(box);
    var el = function (tag, a) { var e = d.createElement(tag); if (a && a.class) e.className = a.class; return e; };
    var az = F.campo(el, box); az.ps = true; az.debugSep = !!W.__svDebug; az.misura(); az.soloFigure = true; W.__svAz = az; return az;
  }
  // ---- la sagoma sullo schermo (come la disegna omino(): i piedi, il salto, a terra, la rotazione)
  function posa(f, zl) {
    var o = f.o || {}, h = o.salto || 0, gi = o.giu || 0, rt = o.ruota || 0;
    return { h: h, lift: h * 2.4 * zl - (o.ginocchia || 0) * 0.5 - (o.piega || 0) * 0.3, anca: 1.15 * (1 - 0.68 * gi * (1 - Math.min(1, h * 3))), kk: 1 + h * 0.25, c: Math.cos(rt), s: Math.sin(rt) };
  }
  function aSchermo(f, q, lx, ly) { var vx = q.kk * lx, vy = q.kk * (ly + 1.15), rx = vx * q.c - vy * q.s, ry = vx * q.s + vy * q.c; return [f.x + f.un * rx, f.y + f.un * (ry - q.lift - q.anca)]; }
  function daSchermo(f, q, X, Y) { var rx = (X - f.x) / f.un, ry = (Y - f.y) / f.un + q.lift + q.anca, vx = rx * q.c + ry * q.s, vy = -rx * q.s + ry * q.c; return [vx / q.kk, vy / q.kk - 1.15]; }
  function guarda(az, sc, cosa) {   // tutti i fotogrammi di un'azione: chi resta coperto (più di metà corpo) e per quanto
    var S = az.sagoma, PT = S.punti, fr = [], meta = null;
    az.figureCb = function (l, m) { fr.push(l); meta = m; };
    for (var k = 0; k <= 100; k++) { var p = k / 100; if (p < (sc.parti || 0)) continue; meta = null; az.foto(sc, p); if (!meta) continue; fr[fr.length - 1].meta = meta; }
    az.figureCb = null;
    if (sc.rete != null) fr = fr.filter(function (l) { return l.meta.p <= sc.rete + 0.02; });   // (dopo il gol si abbracciano: lì stare addosso è voluto)
    var serie = {}, out = [];
    fr.forEach(function (l, kf) {
      var m = l.meta, Q = l.map(function (f) { return posa(f, m.zl); }), bb = l.map(function (f, i) { var q = Q[i]; return [f.x - f.un * 2.8, f.y - f.un * (3.3 + Math.max(0, q.lift)), f.x + f.un * 2.8, f.y + f.un * 1.6]; });
      var vicinoPalla = function (f) { return Math.abs(f.x - m.palla[0]) < f.un * 0.9 && Math.abs(f.y - m.palla[1]) < f.un * 0.7 && m.palla[2] < 2; };
      l.forEach(function (f, i) {
        var a = f.ai != null ? sc.attori[f.ai] : null, sq = a ? a.sq : "folla"; if (sq === "arb" || sq === "gl") return;
        if (f.x < 0 || f.x > 360 || f.y - f.un * 1.2 < 0 || f.y - f.un * 1.2 > 640) return;   // (fuori dallo schermo: non si vede comunque)
        var tipo = f.chi ? "vostri" : vicinoPalla(f) ? "palla" : a && a.chi && a.chi.vero ? "azione" : a ? "azione" : "altri";
        var cop = 0, chi = null;
        PT.forEach(function (pt) {
          var s = aSchermo(f, Q[i], pt[0], pt[1]);
          for (var j = i + 1; j < l.length; j++) {
            var b = bb[j]; if (s[0] < b[0] || s[0] > b[2] || s[1] < b[1] || s[1] > b[3]) continue;
            var lq = daSchermo(l[j], Q[j], s[0], s[1]); if (S.dentro(lq[0], lq[1])) { cop++; chi = j; break; }
          }
        });
        var vis = 1 - cop / PT.length, key = f.id;
        if (vis < 0.5) {
          var fj = l[chi], aj = fj.ai != null ? sc.attori[fj.ai] : null, contrasto = vicinoPalla(f) && vicinoPalla(fj) || (a && aj && Math.hypot(f.x - fj.x, f.y - fj.y) < f.un * 0.5 && (vicinoPalla(f) || vicinoPalla(fj)));
          if (!contrasto) { var z = serie[key] || (serie[key] = { n: 0, max: 0, tipo: tipo, p: m.p, vis: 1, da: aj ? aj.sq : "folla" }); z.n++; if (z.n > z.max) { z.max = z.n; } if (vis < z.vis) { z.vis = vis; z.p = m.p; z.da = aj ? aj.sq : "folla"; z.tipo = tipo; z.daId = fj.id; z.dxy = [+((fj.x - f.x) / f.un).toFixed(2), +((fj.y - f.y) / f.un).toFixed(2)]; } return; }
        }
        var z2 = serie[key]; if (z2 && z2.n) { if (z2.max >= 4) out.push({ id: key, tipo: z2.tipo, lungo: z2.max, p: z2.p, vis: z2.vis, da: z2.da, daId: z2.daId, dxy: z2.dxy, cosa: cosa, sc: sc }); delete serie[key]; }
      });
    });
    Object.keys(serie).forEach(function (k) { var z = serie[k]; if (z.max >= 4) out.push({ id: +k, tipo: z.tipo, lungo: z.max, p: z.p, vis: z.vis, da: z.da, daId: z.daId, dxy: z.dxy, cosa: cosa, sc: sc }); });
    return { fotogrammi: fr.length, coperti: out };
  }
  async function giro(prima, opz) {
    opz = opz || {};
    var w = await W.apriTel("Paky", { x: 0 }), F = await motore(w, prima), az = campo(F, w);
    var stag = [null].concat(F.ELENCO.slice(0, opz.stagioni != null ? opz.stagioni : 3)), conti = { scene: 0, fotogrammi: 0, giornate: 0 }, tutti = [], ko = [];
    for (var si = 0; si < stag.length; si++) {
      var s = stag[si];
      if (s && !F.pronta(s)) await new Promise(function (ok) { F.carica(s, function () { ok(); }); });
      if (s && !F.pronta(s)) { ko.push(s + ": la stagione non si carica"); continue; }
      F.usa(s);
      var cfgs = [[2, 1], [4, 1], [8, 1]];
      for (var ci = 0; ci < cfgs.length; ci++) {
        var cfg = cfgs[ci];
        for (var g = 0; g < (opz.quante || 3); g++) {
          var gl = rose(w, cfg[0]), SA = {}, righe = F.cl(gl, SA, cfg[1], null); conti.giornate++;
          var lista = F.lista(SA, righe, function (r) { return r.gio; }, false), facce = {}, colP = {}; righe.forEach(function (r) { facce[r.id] = null; colP[r.id] = "#e0225a"; });
          var scene = [];
          lista.forEach(function (x) {
            if (!x || !x.e || x.sp) return;
            var R = { righe: righe, fuori: {}, facce: facce, colP: colP, gk: null, opz: {}, az: az, gioVel: 1, gufi: {}, soloScene: function (sc, scF) { scene.push([sc, (s || "oggi") + " " + x.e.t + "/" + (sc.v || "")]); if (scF) scene.push([scF, (s || "oggi") + " " + x.e.t + "/frig"]); } };
            try { F.momento(R, x, 0, null); } catch (er) { ko.push((s || "oggi") + " · errore: " + (er && er.message) + " in " + x.e.t + "/" + (x.e.v || "")); }
          });
          scene.forEach(function (q) { var r; try { r = guarda(az, q[0], q[1]); } catch (er) { ko.push(q[1] + ": " + (er && er.stack || er).toString().slice(0, 600)); return; } conti.scene++; conti.fotogrammi += r.fotogrammi; tutti = tutti.concat(r.coperti); });
          await W.dorme(0);
        }
      }
    }
    var per = {}; tutti.forEach(function (c) { per[c.tipo] = (per[c.tipo] || 0) + 1; });
    var testo = conti.giornate + " giornate, " + conti.scene + " azioni, " + conti.fotogrammi + " fotogrammi; coperti più di metà per almeno 4 centesimi: " + (["vostri", "palla", "azione", "altri"].map(function (t) { return t + " " + (per[t] || 0); }).join(", "));
    W.__svCoperti = tutti.map(function (c) { return { tipo: c.tipo, cosa: c.cosa, p: c.p, lungo: c.lungo, vis: +c.vis.toFixed(2), da: c.da, id: c.id }; });
    return { conti: conti, tutti: tutti, per: per, testo: testo, ko: ko };
  }
  COPIONE.aggiungi("sv1", { nome: "👀 Mini Asta: mai un calciatore nascosto dietro un altro (si vede sempre più di metà corpo)", fai: async function (opz) {
    var r = await giro(false, opz);
    if (r.ko.length) no(r.ko.slice(0, 4).join(" / "));
    var gravi = r.tutti.filter(function (c) { return c.tipo !== "altri"; }), altri = r.per.altri || 0;
    if (gravi.length) no(gravi.length + " coperti: " + gravi.slice(0, 6).map(function (c) { return c.tipo + " " + c.cosa + " a " + c.p.toFixed(2) + " per " + c.lungo + " (si vede il " + Math.round(c.vis * 100) + "%, davanti " + c.da + ")"; }).join(" / ") + " · " + r.testo);
    if (altri > r.conti.scene * 0.01) no("troppi degli altri posti coperti (" + altri + " su " + r.conti.scene + " azioni) · " + r.testo);
    return r.testo;
  } });
  COPIONE.aggiungi("sv0", { nome: "👀 Mini Asta, la prova dei calciatori coperti guarda davvero: col gioco di prima li trova", fai: async function (opz) {
    var r = await giro(true, opz);
    var gravi = r.tutti.filter(function (c) { return c.tipo !== "altri"; });
    if (!gravi.length) no("col gioco di prima non trova nessun calciatore coperto: la prova non guarda · " + r.testo);
    return "col gioco di prima: " + r.testo;
  } });
  // svf (solo per le foto: D:/SG-asta-prove/sovrapposti/foto.js) giornate fisse (il caso col seme), i calciatori coperti col gioco di prima,
  // e per ognuno lo stesso istante PRIMA (senza il passetto di lato) e DOPO, affiancati, col cerchio su chi era coperto: in W.__svFoto
  function semeCaso(n) { return function () { n |= 0; n = n + 0x6D2B79F5 | 0; var t = Math.imul(n ^ n >>> 15, 1 | n); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  COPIONE.aggiungi("svf", { nome: "👀 Mini Asta, le foto prima e dopo dei calciatori coperti", fai: async function (opz) {
    opz = opz || {};
    var w = await W.apriTel("Paky", { x: 0 }), F = await motore(w, false), az = campo(F, w), d = w.document, casi = [], visti = {};
    var vecchio = [Math.random, w.Math.random]; Math.random = semeCaso(opz.seme || 7); w.Math.random = semeCaso((opz.seme || 7) * 31);
    try {
      for (var g = 0; g < (opz.giornate || 6) && casi.length < (opz.quante || 10); g++) {
        var gl = rose(w, [2, 4, 8][g % 3]), SA = {}, righe = F.cl(gl, SA, 1, null), lista = F.lista(SA, righe, function (r) { return r.gio; }, false), facce = {}, colP = {}, scene = [];
        righe.forEach(function (r, i) { facce[r.id] = null; colP[r.id] = ["#e0225a", "#ffd24a", "#4fd8ff", "#3ee0a8", "#b39bff", "#ff9a4a", "#ff5c8a", "#9be15d"][i % 8]; });
        lista.forEach(function (x) { if (!x || !x.e || x.sp) return; var R = { righe: righe, fuori: {}, facce: facce, colP: colP, gk: null, opz: {}, az: az, gioVel: 1, gufi: {}, soloScene: function (sc) { scene.push([sc, x.e.t + "/" + (sc.v || "")]); } }; try { F.momento(R, x, 0, null); } catch (er) {} });
        az.separa = false;
        scene.forEach(function (q) { guarda(az, q[0], q[1]).coperti.forEach(function (c) { if (c.tipo === "altri" || visti[q[1] + c.tipo] > 1) return; visti[q[1] + c.tipo] = (visti[q[1] + c.tipo] || 0) + 1; if (casi.length < (opz.quante || 10)) casi.push(c); }); });
        await W.dorme(0);
      }
    } finally { Math.random = vecchio[0]; w.Math.random = vecchio[1]; }
    var cv = az.__cv || d.querySelector("canvas.st-az"), out = [];
    az.soloFigure = false;
    casi.forEach(function (c) {
      var foto = [], dove = [];
      [false, true].forEach(function (sep) {
        az.separa = sep; c.sc.__sep = null; var fig = null; az.figureCb = function (l) { fig = l; };
        for (var k = 0; k <= 100 && k / 100 < c.p; k++) { az.foto(c.sc, k / 100); }   // (in avanti fino all'istante: lo spostamento si calcola un passo alla volta)
        az.foto(c.sc, c.p); az.figureCb = null;
        foto.push(cv.toDataURL("image/png")); var f = (fig || []).filter(function (x) { return x.id === c.id; })[0]; dove.push(f ? [f.x, f.y - f.un * 1.2, f.un * 1.9] : null);
      });
      c.sc.__sep = null; az.separa = true; var ora = guarda(az, c.sc, c.cosa).coperti.filter(function (x) { return x.id === c.id; })[0];
      out.push({ nome: c.tipo + " · " + c.cosa + " · a " + c.p.toFixed(2) + " · prima si vedeva il " + Math.round(c.vis * 100) + "%" + (ora ? " · DOPO ANCORA COPERTO (" + Math.round(ora.vis * 100) + "%)" : " · dopo mai sotto metà") + (dove[0] ? "" : " · (non trovato " + c.id + ")"), foto: foto, dove: dove, w: cv.width, h: cv.height, dpr: cv.width / 360 });
    });
    az.separa = true; az.soloFigure = true;
    W.__svFoto = out;
    return out.length + " foto prima/dopo pronte (" + casi.map(function (c) { return c.tipo + " " + c.cosa; }).join(", ") + ")";
  } });
  COPIONE.aggiungi("svd", { nome: "👀 (per capire) i calciatori ancora coperti, uno per uno", fai: async function (opz) {
    W.__svDebug = true; var r; try { r = await giro(false, opz); } finally { W.__svDebug = false; }
    var righe = r.tutti.filter(function (c) { return c.tipo !== "altri" || (opz && opz.altri); }).slice(0, (opz && opz.n) || 40).map(function (c) {
      var sc = c.sc, nF = (sc.folla || []).length, k = Math.round(c.p * 240), S = sc.__sep, off = S && S.off[k], mob = S && S.mob && S.mob[k];
      var desc = function (id) { if (id < nF) { var o = sc.folla[id]; return "folla(" + o.sq + (o.nome ? ",vostro" : "") + ")"; } var a = sc.attori[id - nF]; return "att(" + a.sq + (a.chi && a.chi.nome ? ",vostro" : a.chi && a.chi.vero ? ",vero" : "") + ")"; };
      var ball = function (id) { if (id < nF) return "-"; var a = sc.attori[id - nF], q = dove(a.pts, c.p), b = dove(sc.palla, c.p); return (Math.hypot((q[0] - b[0]) * 68, (q[1] - b[1]) * 52)).toFixed(1) + "m"; };
      return c.cosa + " p" + c.p.toFixed(2) + " tiro" + (sc.tiroDa != null ? sc.tiroDa.toFixed(2) : "-") + " rete" + (sc.rete != null ? sc.rete.toFixed(2) : "-") + " n" + c.lungo + " vis" + Math.round(c.vis * 100) + " | " + desc(c.id) + " " + ball(c.id) + " off" + (off ? off[c.id].toFixed(2) : "?") + " mob" + (mob ? JSON.stringify(mob[c.id]) : "?") + " <- " + desc(c.daId) + " " + ball(c.daId) + " off" + (off ? off[c.daId].toFixed(2) : "?") + " mob" + (mob ? JSON.stringify(mob[c.daId]) : "?") + " dxy" + JSON.stringify(c.dxy);
    });
    var az = W.__svAz, cfr = r.tutti.filter(function (c) { return c.tipo !== "altri"; }).slice(0, 4).map(function (c) {
      var l = null; az.figureCb = function (x) { l = x; }; az.foto(c.sc, c.p); az.figureCb = null;
      var F = az.sagoma.schermo(c.sc, c.p), S = c.sc.__sep, x = c.p * 240, k0 = Math.floor(x), fr = x - k0, off = S.off[k0].map(function (v, i) { return v + ((S.off[Math.min(240, k0 + 1)] || S.off[k0])[i] - v) * fr; });
      var fa = l.filter(function (f) { return f.id === c.id; })[0], fb = l.filter(function (f) { return f.id === c.daId; })[0], A1 = F[c.id], B1 = F[c.daId];
      A1.X = A1.sx + off[c.id] * A1.un; B1.X = B1.sx + off[c.daId] * B1.un;
      return "CFR " + c.cosa + " p" + c.p + ": disegno A " + [fa.x, fa.y, fa.un].map(function (v) { return v.toFixed(1); }) + " B " + [fb.x, fb.y, fb.un].map(function (v) { return v.toFixed(1); }) + " | gioco A " + [A1.X, A1.sy, A1.un].map(function (v) { return v.toFixed(1); }) + " B " + [B1.X, B1.sy, B1.un].map(function (v) { return v.toFixed(1); }) + " visGioco " + az.sagoma.vis(A1, [B1], null, 0).toFixed(2) + " pose A " + JSON.stringify([fa.o.salto, fa.o.giu, fa.o.ruota].map(function (v) { return +(v || 0).toFixed(2); })) + " B " + JSON.stringify([fb.o.salto, fb.o.giu, fb.o.ruota].map(function (v) { return +(v || 0).toFixed(2); })) + " gioco " + JSON.stringify([A1.salto, A1.rt, B1.salto, B1.rt].map(function (v) { return +v.toFixed(2); }));
    });
    return r.testo + " ## " + cfr.concat(righe).join(" ## ");
  } });
  // svt Quanto costa e quanto è morbido: per le azioni vere di 6 giornate, il tempo per calcolare gli spostamenti di un'azione intera (sul
  //     telefono si calcolano man mano, circa un passo ogni fotogramma) e il passetto più grande da un passo all'altro (in omini).
  COPIONE.aggiungi("svt", { nome: "👀 Mini Asta, il passetto di lato: quanto costa e quanto è morbido", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), F = await motore(w, false), az = campo(F, w), scene = [], ms = 0, maxP = 0, maxSalto = 0, quanti = 0;
    for (var g = 0; g < 6; g++) {
      var gl = rose(w, [2, 4, 8][g % 3]), SA = {}, righe = F.cl(gl, SA, 1, null), lista = F.lista(SA, righe, function (r) { return r.gio; }, false), facce = {}, colP = {};
      righe.forEach(function (r) { facce[r.id] = null; colP[r.id] = "#e0225a"; });
      lista.forEach(function (x) { if (!x || !x.e || x.sp) return; var R = { righe: righe, fuori: {}, facce: facce, colP: colP, gk: null, opz: {}, az: az, gioVel: 1, gufi: {}, soloScene: function (sc) { scene.push(sc); } }; try { F.momento(R, x, 0, null); } catch (er) {} });
    }
    scene.forEach(function (sc) {
      az.foto(sc, 0); var t0 = performance.now(); az.foto(sc, 1); ms += performance.now() - t0;
      var S = sc.__sep; if (!S) return; quanti++;
      for (var k = 1; k < S.off.length; k++) S.off[k].forEach(function (v, i) { var d = Math.abs(v - S.off[k - 1][i]); if (d > maxP) maxP = d; if (Math.abs(v) > maxSalto) maxSalto = Math.abs(v); });
    });
    if (!quanti) no("nessuna azione calcolata");
    if (maxP > 0.31) no("un passetto troppo brusco: " + maxP.toFixed(2) + " omini da un passo all'altro");
    return quanti + " azioni: " + (ms / quanti).toFixed(1) + " ms per un'azione intera (" + (ms / quanti / 240 * 1000).toFixed(0) + " µs a passo, sul telefono un passo a fotogramma); il passetto più grande da un passo all'altro " + maxP.toFixed(2) + " omini, lo spostamento più grande " + maxSalto.toFixed(2) + " omini";
  } });
  var SCENE = ["cross", "angolo", "unodue", "contro", "pallonetto", "fuori", "slalom", "punizione", "tapin", "centrocampo", "mischia", "testa", "incrocio", "miracolo", "assedio", "ultimo",
    "secondopalo", "presa", "tuffo", "vuota", "tre", "filtrante", "rasoterra", "giro", "muro", "corta", "volee", "pressing", "laterale", "papera", "glt", "ribattuta", "fuga", "rimessa", "rimessalunga", "cambio", "fascia", "adue", "tikitaka", "sponda", "centrovuota", "lampo"];
  var ESITI = ["gol", "parata", "palo", "traversa", "fuori", "alto", "linea"];
  function dove(pts, t) { if (t <= pts[0][0]) return pts[0].slice(1, 4); for (var i = 1; i < pts.length; i++) if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return a.slice(1, 4).map(function (v, j) { return v + (b[j + 1] - v) * k; }); } return pts[pts.length - 1].slice(1, 4); }
  function diversi(a, b) { for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-6) return true; return false; }
  COPIONE.aggiungi("sv2", { nome: "👀 Mini Asta, il passetto di lato non svela niente: fino al tiro tutti gli omini nello stesso punto in ogni esito", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), F = await motore(w, false), az = campo(F, w), ko = [], prove = 0, spostati = 0, diverse = 0;
    var KIT = { a: "#e0225a", b: "#ffffff" }, KIT2 = { a: "#1c7ed6", b: "#ffffff" }, POR = { a: "#2b8a3e", b: "#ffffff" };
    function nuova(es, v, seme, verso) {
      var sc = F.scena(es === "gol" ? "gol" : "occ", v, es, null, { tira: null, passa: null, para: null }, { verso: verso, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true });
      sc.kA = KIT; sc.kD = KIT2; sc.pA = POR; sc.pD = POR; sc.noti = []; return sc;
    }
    var giaDiversi = 0;
    function confronta(a, b, i) { var bad = null; Object.keys(a).forEach(function (id) { var x = a[id], y = b[id]; if (bad) return; if (!y) { bad = "l'omino " + id + " c'è solo col gol"; return; } if (Math.abs(x.x - y.x) > 0.01 || Math.abs(x.y - y.y) > 0.01) bad = "l'omino " + id + " col gol in " + x.x.toFixed(2) + "," + x.y.toFixed(2) + " e con " + ESITI[i] + " in " + y.x.toFixed(2) + "," + y.y.toFixed(2); }); return bad; }
    function figure(sc, p) { var l = null; az.figureCb = function (x) { l = x; }; az.foto(sc, p); az.figureCb = null; var m = {}; (l || []).forEach(function (f) { m[f.id] = f; }); return m; }
    for (var vi = 0; vi < SCENE.length; vi++) {
      var v = SCENE[vi];
      for (var seme = 1; seme <= 3; seme++) for (var vv = 0; vv < 2; vv++) {
        var verso = vv ? -1 : 1, sc = ESITI.map(function (es) { return nuova(es, v, seme, verso); }), qui = v + " seme " + seme + (verso < 0 ? " (verso l'altra porta)" : "");
        for (var i = 1; i < sc.length; i++) {
          if (sc[i].attori.length !== sc[0].attori.length) { diverse++; continue; }   // (una rarità che ha un calciatore in più: è già un'altra azione)
          var tPalla = 1; for (var t = 0; t <= 1; t += 0.0025) if (diversi(dove(sc[0].palla, t), dove(sc[i].palla, t))) { tPalla = t; break; }
          for (var p = 0; p < tPalla - 0.005; p += 0.01) {
            prove++;
            az.separa = false; var bad = confronta(figure(sc[0], p), figure(sc[i], p), i); az.separa = true;   // (senza il passetto di lato: se qualcosa era già diverso prima, da lì in poi non si guarda)
            if (bad) { giaDiversi++; break; }
            bad = confronta(figure(sc[0], p), figure(sc[i], p), i);
            if (bad) { ko.push(qui + " a " + p.toFixed(2) + " (il pallone uguale fino a " + tPalla.toFixed(3) + "): " + bad); break; }
          }
        }
        var S0 = sc[0].__sep; if (S0) S0.off.forEach(function (o) { if (o.some(function (x) { return Math.abs(x) > 0.05; })) spostati++; });
        if (ko.length > 10) break;
      }
      await W.dorme(0);
    }
    if (ko.length) no(ko.length + " differenze prima del tiro: " + ko.slice(0, 5).join(" / "));
    if (!spostati) no("nessun omino si è spostato: la prova non guarda il passetto di lato");
    return SCENE.length + " azioni × 3 semi × 2 versi × 7 esiti (" + prove + " fotogrammi confrontati, " + spostati + " passi con qualcuno spostato" + (diverse ? ", " + diverse + " esiti rari con un calciatore in più saltati" : "") + (giaDiversi ? ", " + giaDiversi + " coppie di esiti già diverse di un filo anche senza il passetto, guardate fino a lì" : "") + "): dove senza il passetto tutto è uguale, col passetto tutti gli omini restano nello stesso punto in ogni esito";
  } });
})();
