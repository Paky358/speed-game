// I giochi a premi del file e (23 ott 2026): «✅ La Prova del 5» e «🧹 Togli la cifra», simulati per decidere i punti.
// Usa il gioco VERO (js/games/prezzo-premi-e.js: stessi prodotti, stessi cartellini falsi, stessa cifra in più, stessi punti)
// e i giocatori finti di premi-nuovi.js: il prezzo pensato è quello vero × e^(N(0,1)·s), bravo s = 0,15, medio 0,30, scarso 0,45,
// più uno che tira a caso. Media = (bravo + 2 × medio + scarso) / 4, come premi-nuovi.js.
//   node premi-e-sim.js [volte] [tabelle]     (con «tabelle» prova anche altri punti, per confronto)
// Come ragionano i giocatori finti:
//   Prova del 5: «giusto» se il cartellino è entro una soglia dal prezzo che pensano (la soglia migliore per la loro bravura,
//               cercata qui sotto: sanno più o meno quanto si sbagliano). Chi tira a caso: testa o croce.
//   Togli la cifra: tra i prezzi che vengono togliendo una cifra scelgono il più probabile, mettendo insieme quanto è vicino a
//               quello che pensano e come finiscono di solito i prezzi veri (0, 00, 50, 99…). Chi tira a caso: una cifra a caso.
var fs = require("fs"), path = require("path"), SG = path.resolve(__dirname, "../../../../..");
global.window = {};
fs.readdirSync(path.join(SG, "data")).filter(function (f) { return /^prezzo-\d+\.js$/.test(f); }).forEach(function (f) { eval(fs.readFileSync(path.join(SG, "data", f), "utf8")); });
eval(fs.readFileSync(path.join(SG, "js/games/prezzo-premi-e.js"), "utf8"));
var PROD = window.SG_PREZZO.prodotti, R = window.SG_PREZZO_PREMI, N = +process.argv[2] || 20000, TABELLE = process.argv[3] === "tabelle";
var P5 = R.prova5._P5, TG = R.togli._TG;
function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function stima(p, s) { return p * Math.exp(gauss() * s); }
function mescola(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = b[i]; b[i] = b[j]; b[j] = x; } return b; }
// gli aiuti dell'host (come apiPremio in prezzo.js), con tutti i prodotti e mai due volte nella stessa partita
function Pfinto(ids) {
  var usati = {};
  return { ids: ids, n: ids.length, modo: "online", locale: false, nome: function (id) { return id; }, rnd: Math.random, mescola: mescola,
    pesca: function (f, n) { var l = mescola(PROD.filter(function (p) { return !usati[p.id] && (!f || f(p)); })).slice(0, n || 1); l.forEach(function (p) { usati[p.id] = 1; }); return l.map(function (p) { return JSON.parse(JSON.stringify(p)); }); },
    passo: function () { return 1; }, arrotonda: function (v) { return v; }, fmtE: String, tondo2: function (v) { return Math.round(v * 100) / 100; },
    privato: function () {}, fatto: function () {} };
}
var SK = [0.15, 0.3, 0.45], NOMI = ["bravo", "medio", "scarso", "a caso"], IDS = ["b", "m", "s", "c"];

// ---------------- ✅ La Prova del 5 ----------------
function sceltaP5(st, s, t) { return st.prod.map(function (p, i) { if (s == null) return Math.random() < 0.5 ? 1 : 0; return Math.abs(Math.log(st.tag[i] / stima(p.prezzo, s))) < t ? 1 : 0; }); }
function soglia(s) {
  var best = 0, bt = 0.2;
  for (var t = 0.08; t <= 0.6; t += 0.02) {
    var g = 0; for (var q = 0; q < 2500; q++) { var P = Pfinto(["x"]), st = R.prova5.prepara(P), sc = sceltaP5(st, s, t); st.ok.forEach(function (o, i) { if ((sc[i] === 1) === o) g++; }); }
    if (g > best) { best = g; bt = t; }
  }
  return bt;
}
var SOGLIE = SK.map(soglia);
function giocaP5(M) {
  var som = [0, 0, 0, 0], giuste = [0, 0, 0, 0], tutte = [0, 0, 0, 0], zero = [0, 0, 0, 0], per = [[], [], [], []];
  for (var i = 0; i < M; i++) {
    var P = Pfinto(IDS), st = R.prova5.prepara(P);
    IDS.forEach(function (id, j) { R.prova5.mossa(st, id, { s: sceltaP5(st, j < 3 ? SK[j] : null, SOGLIE[j]), fine: 1 }, P); });
    var f = R.prova5.fine(st, P);
    f.riv.g.forEach(function (x, j) { som[j] += x.pt; giuste[j] += x.n; if (x.n === 5) tutte[j]++; if (!x.pt) zero[j]++; per[j][x.n] = (per[j][x.n] || 0) + 1; });
  }
  return { m: som.map(function (x) { return Math.round(x / M); }), giuste: giuste.map(function (x) { return x / M; }), tutte: tutte.map(function (x) { return x / M; }), zero: zero.map(function (x) { return x / M; }), per: per };
}
// ---------------- 🧹 Togli la cifra ----------------
function sceltaT(st, s) {
  return st.S.map(function (S, k) {
    if (s == null) return 1 + Math.floor(Math.random() * (S.length - 2));
    var e = stima(+st.vero[k], s), best = 1, bv = -Infinity;
    for (var i = 1; i < S.length - 1; i++) { var a = R.togli._togliA(S, i), l = Math.log(+a / e), v = -l * l / (2 * s * s) + Math.log(R.togli._verosimile(a)); if (v > bv) { bv = v; best = i; } }
    return best;
  });
}
function giocaT(M) {
  var som = [0, 0, 0, 0], giusti = [0, 0, 0, 0], tutti = [0, 0, 0, 0], zero = [0, 0, 0, 0], perCifre = [{}, {}, {}, {}], lun = {};
  for (var i = 0; i < M; i++) {
    var P = Pfinto(IDS), st = R.togli.prepara(P);
    st.vero.forEach(function (v) { lun[v.length] = (lun[v.length] || 0) + 1; });
    IDS.forEach(function (id, j) { R.togli.mossa(st, id, { c: sceltaT(st, j < 3 ? SK[j] : null), fine: 1 }, P); });
    var f = R.togli.fine(st, P);
    f.riv.g.forEach(function (x, j) {
      som[j] += x.pt; giusti[j] += x.n; if (x.n === 3) tutti[j]++; if (!x.pt) zero[j]++;
      x.gi.forEach(function (ok, k) { var n = st.vero[k].length, q = perCifre[j][n] = perCifre[j][n] || [0, 0]; q[1]++; if (ok) q[0]++; });
    });
  }
  return { m: som.map(function (x) { return Math.round(x / M); }), giusti: giusti.map(function (x) { return x / M; }), tutti: tutti.map(function (x) { return x / M; }), zero: zero.map(function (x) { return x / M; }), perCifre: perCifre, lun: lun };
}
function riga(nome, r, chiave) {
  var m = r.m, media = Math.round((m[0] + 2 * m[1] + m[2]) / 4);
  console.log(nome.padEnd(44) + " media " + String(media).padStart(4) + " · " + NOMI.map(function (x, j) { return x + " " + m[j]; }).join(" · ") +
    " · " + chiave + " " + r[chiave].map(function (x) { return x.toFixed(2); }).join("/") + " · tutto giusto " + r[chiave === "giuste" ? "tutte" : "tutti"].map(function (x) { return Math.round(100 * x) + "%"; }).join("/") +
    " · a zero " + r.zero.map(function (x) { return Math.round(100 * x) + "%"; }).join("/"));
  return media;
}

console.log("✅ LA PROVA DEL 5 · prodotti da " + P5.min + " a " + P5.max + " € · cartellini falsi " + P5.off.map(function (x) { return Math.round(100 * x) + "%"; }).join("-") + " · giusti " + P5.quanti.join("/") + " · soglie dei giocatori " + SOGLIE.map(function (t) { return t.toFixed(2); }).join("/"));
if (TABELLE) {
  var vecchi = P5.punti.slice();
  [[0, 0, 0, 100, 300, 700], [0, 0, 0, 150, 400, 800], [0, 0, 50, 150, 350, 650], [0, 0, 0, 120, 300, 600]].forEach(function (t) { P5.punti = t; riga("  punti " + t.slice(2).join("/"), giocaP5(N), "giuste"); });
  P5.punti = vecchi;
}
var r5 = giocaP5(N);
riga("  NEL GIOCO: punti 0-2 → 0, " + P5.punti.slice(3).join("/"), r5, "giuste");
console.log("    quante giuste su 5 (" + NOMI.join(" / ") + "): " + r5.per.map(function (p) { return [0, 1, 2, 3, 4, 5].map(function (k) { return Math.round(100 * (p[k] || 0) / N) + "%"; }).join(" "); }).join(" | "));

console.log("\n🧹 TOGLI LA CIFRA · cifre " + TG.cifre.join("/") + " · alfa " + TG.alfa + " · vicino " + TG.vicino + " (peso " + TG.pesoVicino + ")");
if (TABELLE) {
  var va = TG.aPrezzo, vt = TG.tutti;
  [[100, 200], [120, 250], [100, 300], [90, 300]].forEach(function (t) { TG.aPrezzo = t[0]; TG.tutti = t[1]; riga("  " + t[0] + " a prezzo, +" + t[1] + " tutti e tre", giocaT(N), "giusti"); });
  TG.aPrezzo = va; TG.tutti = vt;
}
var rt = giocaT(N);
riga("  NEL GIOCO: " + TG.aPrezzo + " a prezzo, +" + TG.tutti + " tutti e tre", rt, "giusti");
console.log("    giusti per numero di cifre (" + NOMI.join(" / ") + "): " + rt.perCifre.map(function (p) { return Object.keys(p).map(function (n) { return n + ": " + (p[n][0] / p[n][1]).toFixed(2); }).join(" "); }).join(" | ") + " · prezzi usati per cifre " + JSON.stringify(rt.lun));

// ULTIMA PROVA (23 ott 2026, node premi-e-sim.js 40000):
//   Prova del 5 (0-2 → 0, 200/400/700; soglie dei giocatori 0,24/0,34/0,48): media 296 · bravo 456 · medio 263 · scarso 203 ·
//     a caso 146 · giuste 4,09/3,20/2,86/2,50 · tutte e 5 36%/11%/6%/3%
//   Togli la cifra (120 a prezzo, +300 tutti e tre): media 307 · bravo 343 · medio 300 · scarso 286 · a caso 142 ·
//     giusti 2,06/1,89/1,83/1,08 · tutti e 3 32%/25%/22%/4% · per cifre (3/4/5): bravo 0,76/0,69/0,60, a caso 0,50/0,33/0,25
