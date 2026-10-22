// SIMULAZIONE DEI PUNTI di «Il Prezzo è Giusto!» (📺 Come in TV): migliaia di puntate finte con giocatori bravi, medi e scarsi
// e i prodotti veri, per decidere i numeri dei punti (22 ott 2026). Le regole sono COPIATE da js/games/prezzo.js e prezzo-premi-*.js:
// se cambiano là, vanno cambiate anche qui. OGGI = i numeri di prima del 22 ott; quelli nuovi sono PROP in confronto.js.
// Si lancia con Node (c'è solo sul PC fisso; il gioco resta senza npm):
//   node sim-prezzo.js [puntate]   ·   node confronto.js [puntate]   ·   node cerca.js [puntate]   ·   node premi-giusti.js [volte] ['{...}']
var fs = require("fs"), path = require("path");
var SG = path.resolve(__dirname, "../../../../..");   // la cartella del progetto
global.window = {};
["data/prezzo-1.js", "data/prezzo-2.js", "data/prezzo-3.js", "data/prezzo-4.js"].forEach(function (f) { eval(fs.readFileSync(path.join(SG, f), "utf8")); });
var PROD = window.SG_PREZZO.prodotti.filter(function (p) { return p && +p.prezzo > 0; });
var VET = window.SG_PREZZO.vetrine.filter(function (v) { return v.pezzi && v.pezzi.length >= 2; });

// ---------------- aiuti copiati dal gioco ----------------
function tondo2(v) { return Math.round((+v || 0) * 100) / 100; }
function passo(p) { p = +p || 0; return p < 2 ? 0.05 : p < 20 ? 0.1 : p < 100 ? 1 : p < 1000 ? 5 : p < 10000 ? 50 : 500; }
function margine(p, pct) { return Math.max((+p || 0) * (pct == null ? 0.02 : pct), passo(p)); }
function arrotonda(v, p) { var s = passo(p == null ? v : p); return tondo2(Math.round(v / s) * s); }
function posizioni(lista) { var out = {}; lista.forEach(function (x) { out[x.id] = 1 + lista.filter(function (y) { return y.d < x.d - 1e-9; }).length; }); return out; }
function puntiPos(pos, n, scala) { return pos === 1 ? scala[0] : pos === 2 ? scala[1] : (pos === 3 && n >= 4) ? scala[2] : 0; }
function rnd() { return Math.random(); }
function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function mescola(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = b[i]; b[i] = b[j]; b[j] = x; } return b; }
function pesca(filtro, usati) {
  var l = PROD.filter(function (p) { return !usati[p.id] && (!filtro || filtro(p)); });
  if (!l.length) l = PROD.filter(function (p) { return !filtro || filtro(p); });
  var p = l[Math.floor(Math.random() * l.length)]; usati[p.id] = 1; return p;
}

// L'Offerta e la Vetrina (come esitoOfferta)
function esitoOfferta(prezzo, off, o) {
  var mg = margine(prezzo, o.pct), ids = Object.keys(off), n = o.n || ids.length;
  var righe = ids.map(function (id) { var v = tondo2(off[id]); return { id: id, v: v, d: Math.abs(v - prezzo), sopra: v > prezzo + mg + 1e-9, giusto: Math.abs(v - prezzo) <= mg + 1e-9 }; });
  var cand = righe.filter(function (r) { return !(o.senzaSforare && r.sopra); }), pos = posizioni(cand);
  righe.forEach(function (r) { r.pos = pos[r.id] || 0; r.punti = r.pos ? puntiPos(r.pos, n, o.scala) : 0; if (r.giusto && r.pos) r.punti += o.bonus; });
  return { righe: righe, tuttiSopra: !!(o.senzaSforare && righe.length && !cand.length) };
}

// ---------------- i giocatori ----------------
// s = quanto sbaglia i prezzi (errore tipico: 0,15 = di solito entro il 15%, bravo; 0,30 medio; 0,45 scarso)
function stima(p, s) { return p * Math.exp(gauss() * s); }

// ---------------- le parti della puntata (C = i numeri dei punti) ----------------
function offerta(G, C, giro) {
  var caro = giro % 2 === 0, prec = G.catPrec;
  var p = pesca(function (x) { return (caro ? x.prezzo >= 100 : x.prezzo < 100) && x.cat !== prec; }, G.usati); G.catPrec = p.cat;
  var off = {}, limite = null;
  for (var volta = 0; volta < 2; volta++) {
    off = {};
    G.pl.forEach(function (g) {
      // senza superare: chi è meno sicuro sta più basso
      var v = stima(p.prezzo, g.s) * Math.exp(-0.6 * g.s);
      if (limite != null && v >= limite) v = limite * (0.62 + Math.random() * 0.3);
      v = Math.max(passo(p.prezzo), arrotonda(v, p.prezzo));
      while (Object.keys(off).some(function (k) { return Math.abs(off[k] - v) < 1e-9; })) v = tondo2(v + passo(p.prezzo) * (Math.random() < 0.5 ? 1 : -1));
      off[g.id] = Math.max(passo(p.prezzo), v);
    });
    var e = esitoOfferta(p.prezzo, off, { senzaSforare: true, scala: C.SCALA, bonus: C.BONUS_GIUSTO, n: G.pl.length });
    if (e.tuttiSopra && volta === 0) { limite = Math.min.apply(null, Object.keys(off).map(function (k) { return off[k]; })); continue; }
    e.righe.forEach(function (r) { G.add(r.id, "offerte", r.punti); });
    return;
  }
}

var PREMI = {
  piuomeno: function (G, C) {
    var p = pesca(function (x) { return x.prezzo >= 20 && x.prezzo <= 2000; }, G.usati), zona = Math.max(p.prezzo * 0.03, passo(p.prezzo));
    var arrivi = [];
    G.pl.forEach(function (g) {
      var t = 2000 + Math.random() * 1500, v = stima(p.prezzo, g.s), lo = 0, hi = Infinity, prove = 0;
      while (t <= 30000) {
        prove++;
        if (Math.abs(v - p.prezzo) <= zona) { arrivi.push({ id: g.id, t: t }); return; }
        if (v < p.prezzo) lo = v; else hi = v;
        v = hi === Infinity ? v * 1.6 : lo === 0 ? v / 1.6 : Math.sqrt(lo * hi);
        v = Math.max(passo(p.prezzo), arrotonda(v, p.prezzo));
        t += 2000 + Math.random() * 1400;
      }
    });
    arrivi.sort(function (a, b) { return a.t - b.t; });
    arrivi.forEach(function (a, i) { G.add(a.id, "premi", i < C.PIU.length ? C.PIU[i] : C.PIU_DOPO); });
  },
  alpinista: function (G, C) {
    var prod = [], cats = [];
    for (var i = 0; i < 3; i++) { var x = pesca(function (p) { return p.prezzo >= 1 && p.prezzo < 100 && cats.indexOf(p.cat) < 0; }, G.usati); prod.push(x); cats.push(x.cat); }
    G.pl.forEach(function (g) {
      var tot = prod.reduce(function (a, x) {
        var v = arrotonda(stima(x.prezzo, g.s), x.prezzo), d = Math.abs(v - x.prezzo);
        return a + (d <= passo(x.prezzo) + 1e-9 ? 0 : Math.min(25, Math.floor(Math.min(1, d / x.prezzo) * 100 / 4 + 1e-9)));
      }, 0);
      G.add(g.id, "premi", tot > 25 ? 0 : (C.ALP_BASE ? Math.max(C.ALP_MIN, C.ALP_BASE - C.ALP_PASSO * tot) + (tot === 0 ? 200 : 0) : C.ALP_FN(tot)));
    });
  },
  ordine: function (G, C) {
    var sc = [], p1 = pesca(function (x) { return x.prezzo >= 1; }, G.usati); sc.push(p1);
    function lontano(x) { return sc.every(function (s) { var r = x.prezzo / s.prezzo; return r >= 1.15 || r <= 1 / 1.15; }); }
    function stretto(x) { var l = sc.map(function (s) { return s.prezzo; }).concat([x.prezzo]); return Math.max.apply(null, l) / Math.min.apply(null, l) <= 12; }
    var prove = [function (x) { return x.cat === p1.cat && lontano(x) && stretto(x); }, function (x) { return x.cat === p1.cat && lontano(x); }, function (x) { return lontano(x) && stretto(x); }, function (x) { return lontano(x); }];
    while (sc.length < 5) { var y = null; for (var q = 0; q < prove.length && !y; q++) { var l = PROD.filter(function (z) { return !G.usati[z.id] && prove[q](z); }); if (l.length) { y = l[Math.floor(Math.random() * l.length)]; G.usati[y.id] = 1; } } if (!y) break; sc.push(y); }
    var giusto = sc.map(function (x, i) { return i; }).sort(function (a, b) { return sc[a].prezzo - sc[b].prezzo; });
    G.pl.forEach(function (g) {
      var st = sc.map(function (x) { return stima(x.prezzo, g.s); }), mio = sc.map(function (x, i) { return i; }).sort(function (a, b) { return st[a] - st[b]; });
      var n = 0; for (var i = 0; i < giusto.length; i++) if (mio[i] === giusto[i]) n++;
      G.add(g.id, "premi", n * C.ORD_POSTO + (n === sc.length ? C.ORD_TUTTI : 0));
    });
  },
  troppo: function (G, C) {
    var p = pesca(function (x) { return x.prezzo >= 2000; }, G.usati), sc = scalaTroppo(p.prezzo);
    G.pl.forEach(function (g) {
      var e = stima(p.prezzo, g.s) * Math.exp((C.TR_ATTESA == null ? 0.3 : C.TR_ATTESA) * g.s), i = -1;
      for (var k = 0; k < sc.scala.length; k++) if (sc.scala[k] > e) { i = k; break; }
      var pt = 0; if (i >= 0 && i >= sc.j) { var d = i - sc.j; pt = d < C.TROPPO.length ? C.TROPPO[d] : C.TROPPO_DOPO; } else if (i >= 0 && C.TROPPO_PRIMA && sc.j - i <= C.TROPPO_PRIMA.length) pt = C.TROPPO_PRIMA[sc.j - i - 1];
      G.add(g.id, "premi", pt);
    });
  },
  plinko: function (G, C) {
    var dom = [];
    for (var q = 0; q < 3; q++) { var p = pesca(function (x) { return x.prezzo >= 1 && x.prezzo < 100; }, G.usati); dom.push({ p: p.prezzo, f: finto(p.prezzo) }); }
    G.pl.forEach(function (g) {
      var gett = 1;
      dom.forEach(function (d) { var e = stima(d.p, g.s); if (Math.abs(Math.log(e / d.p)) < Math.abs(Math.log(e / d.f))) { gett++; if (C.PL_GIUSTA) G.add(g.id, "premi", C.PL_GIUSTA); } });
      var tot = 0;
      for (var k = 0; k < gett; k++) { var b = cade(4); tot += C.PLINKO[b]; }
      G.add(g.id, "plinko", tot);
      G.plMedia[g.id] = (G.plMedia[g.id] || 0) + gett * mediaPlinko(C.PLINKO);   // quanto avrebbe fatto «in media» coi suoi gettoni
    });
  }
};
function passoTondo(v) { var t = Math.max(1, v), m = Math.pow(10, Math.floor(Math.log(t) / Math.LN10)), best = m; [1, 2, 2.5, 5, 10].forEach(function (x) { if (x * m <= t * 1.15) best = x * m; }); return best; }
function scalaTroppo(prezzo) {
  for (var giro = 0; giro < 30; giro++) {
    var d = passoTondo(prezzo * (0.08 + rnd() * 0.045)), unita = /^25/.test(String(d)) ? [d, d / 5] : [d, d / 2, d / 5];
    var da = prezzo * 1.025, a = prezzo * 0.985 + d, cand = [];
    for (var u = 0; u < unita.length && !cand.length; u++) for (var x = Math.ceil(da / unita[u] - 1e-9) * unita[u]; x <= a + 1e-9; x += unita[u]) cand.push(x);
    if (!cand.length) continue;
    var v = cand[Math.floor(rnd() * cand.length)], js = [2, 3, 4, 5, 6, 7].filter(function (j) { return v - j * d >= prezzo * 0.3; });
    if (!js.length) continue;
    var j = js[Math.floor(rnd() * js.length)], r = [];
    for (var i = 0; i < 10; i++) r.push(tondo2(v + (i - j) * d));
    return { scala: r, j: j };
  }
  return { scala: [0.55, 0.65, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25, 1.35, 1.45].map(function (f) { return tondo2(prezzo * f); }), j: 5 };
}
function comeIlVero(v, p) {
  if (p >= 10 && Math.abs(p - Math.round(p)) < 1e-9) { if (p % 10 === 9) return Math.max(9, Math.round((v + 1) / 10) * 10 - 1); if (p % 5 === 0) return Math.max(5, Math.round(v / 5) * 5); return Math.max(1, Math.round(v)); }
  if (p >= 2) return tondo2(Math.max(1, Math.floor(v)) + (Math.round(p * 100) % 100) / 100);
  return tondo2(Math.max(0.05, Math.round(v * 20) / 20));
}
function finto(p) {
  for (var k = 0; k < 14; k++) { var f = 0.25 + rnd() * 0.35, v = comeIlVero(rnd() < 0.5 ? p * (1 + f) : p * (1 - f), p); if (v > 0 && Math.abs(v - p) / p >= 0.18 && Math.abs(v - p) / p <= 0.75) return v; }
  return comeIlVero(p * 1.45, p);
}
var MEDIE = {};
function mediaPlinko(caselle) {
  var k = caselle.join(","); if (MEDIE[k] != null) return MEDIE[k];
  var s = 0; for (var i = 0; i < 200000; i++) s += caselle[cade(4)];
  return (MEDIE[k] = s / 200000);
}
function cade(x) { var p = 2 * x; for (var r = 0; r < 12; r++) { var d = rnd() < 0.5 ? -1 : 1; p += d; if (p < 0) p = 1; if (p > 16) p = 15; } return p / 2; }

var SPICCHI = [5, 100, 15, 80, 35, 60, 20, 40, 75, 55, 95, 50, 85, 30, 65, 10, 45, 70, 25, 90];
function tira() { return SPICCHI[Math.floor(Math.random() * 20)]; }
function ruota(G, C) {
  var g = {};
  G.pl.forEach(function (p) { g[p.id] = { v1: tira(), v2: 0 }; });
  G.pl.forEach(function (p) {
    var x = g[p.id]; if (x.v1 >= 100) return;
    var meglio = G.pl.filter(function (q) { return q.id !== p.id && g[q.id].v1 <= 100 && g[q.id].v1 > x.v1; }).length;
    var soglia = 50 + Math.random() * 15;   // le persone: «sotto il 50-65 giro ancora», di più se gli altri sono avanti
    if (x.v1 <= soglia || (meglio && x.v1 <= 70)) x.v2 = tira();
  });
  var righe = G.pl.map(function (p) { var tot = g[p.id].v1 + g[p.id].v2; return { id: p.id, tot: tot, out: tot > 100, cento: tot === 100 }; });
  var cand = righe.filter(function (r) { return !r.out; }).map(function (r) { return { id: r.id, d: 100 - r.tot }; }), pos = posizioni(cand);
  var vince = null;
  righe.forEach(function (r) {
    var pt = pos[r.id] ? puntiPos(pos[r.id], G.pl.length, C.RUOTA) : 0;
    if (pos[r.id] === 1 && !vince) vince = r.id;
    G.add(r.id, "ruota", pt);
    if (r.cento) { G.add(r.id, "fortuna", C.BONUS_CENTO); var b = tira(); G.add(r.id, "fortuna", b === 100 ? C.SPIN_100 : (b === 5 || b === 15) ? C.SPIN_5 : 0); G.cento++; }
  });
  G.indizio = vince;
}
function vetrina(G, C) {
  var v = VET[Math.floor(Math.random() * VET.length)], tot = tondo2(v.pezzi.reduce(function (a, x) { return a + x.prezzo; }, 0));
  var cari = v.pezzi.map(function (x, i) { return i; }).sort(function (a, b) { return v.pezzi[b].prezzo - v.pezzi[a].prezzo; }), ind = cari[Math.floor(Math.random() * Math.min(2, cari.length))];
  var off = {};
  G.pl.forEach(function (g) {
    var bias = Math.exp(gauss() * g.s * 0.6), t = 0;
    v.pezzi.forEach(function (x, i) { t += (G.indizio === g.id && i === ind) ? x.prezzo : stima(x.prezzo, g.s) * bias; });
    off[g.id] = Math.max(1, Math.round(t * Math.exp(-0.35 * g.s)));
  });
  var e = esitoOfferta(tot, off, { senzaSforare: true, pct: 0.03, scala: C.SCALA_V, bonus: 0, n: G.pl.length });
  e.righe.forEach(function (r) { G.add(r.id, "vetrina", r.punti); if (!r.sopra && r.v >= tot * (1 - C.TUTTO_PCT)) { G.add(r.id, "tutto", C.BONUS_TUTTO); G.tutto++; } });
}

// ---------------- una puntata ----------------
function nuovaPuntata(skills) {
  var G = { usati: {}, catPrec: null, cento: 0, tutto: 0, indizio: null, plMedia: {} };
  G.pl = skills.map(function (s, i) { return { id: "g" + i, s: s }; });
  G.pt = {}; G.pl.forEach(function (p) { G.pt[p.id] = { offerte: 0, premi: 0, plinko: 0, ruota: 0, fortuna: 0, vetrina: 0, tutto: 0 }; });
  G.add = function (id, voce, n) { G.pt[id][voce] += n; };
  return G;
}
function puntata(skills, C) {
  var G = nuovaPuntata(skills), usati = [];
  for (var giro = 1; giro <= C.GIRI; giro++) {
    offerta(G, C, giro);
    var disp = Object.keys(PREMI).filter(function (k) { return usati.indexOf(k) < 0; }); if (!disp.length) { usati = []; disp = Object.keys(PREMI); }
    var k = disp[Math.floor(Math.random() * disp.length)]; usati.push(k); PREMI[k](G, C);
    if (C.GIRI === 4 && giro === 2) ruota(G, C);   // in Serata lunga la Ruota anche a metà
  }
  var prima = tot(G, ["offerte", "premi", "plinko"]);
  ruota(G, C);
  vetrina(G, C);
  return { G: G, prima: prima, fine: tot(G, null) };
}
function tot(G, voci) { var o = {}; G.pl.forEach(function (p) { var x = G.pt[p.id]; o[p.id] = Object.keys(x).filter(function (k) { return !voci || voci.indexOf(k) >= 0; }).reduce(function (a, k) { return a + x[k]; }, 0); }); return o; }
function primo(o) { var ids = Object.keys(o), mx = Math.max.apply(null, ids.map(function (k) { return o[k]; })), l = ids.filter(function (k) { return o[k] === mx; }); return l[Math.floor(Math.random() * l.length)]; }

// ---------------- i numeri da provare ----------------
function alpOggi(tot) { return Math.max(100, 500 - 15 * tot) + (tot === 0 ? 200 : 0); }
var OGGI = { GIRI: 3, SCALA: [300, 150, 75], BONUS_GIUSTO: 500, PIU: [400, 300, 250], PIU_DOPO: 200, ALP_FN: alpOggi, ORD_POSTO: 80, ORD_TUTTI: 100,
  TROPPO: [400, 250, 150], TROPPO_DOPO: 50, PLINKO: [10, 50, 100, 0, 500, 0, 100, 50, 10],
  RUOTA: [300, 150, 75], BONUS_CENTO: 1000, SPIN_100: 1000, SPIN_5: 500, SCALA_V: [900, 450, 225], BONUS_TUTTO: 1500, TUTTO_PCT: 0.05 };
function variante(cambi) { var c = {}; Object.keys(OGGI).forEach(function (k) { c[k] = OGGI[k]; }); Object.keys(cambi).forEach(function (k) { c[k] = cambi[k]; }); return c; }

function prova(nome, C, skills, N, zitto) {
  var vinte = skills.map(function () { return 0; }), primoDopo = 0, ultimoVince = 0, decideRuota = 0, decidePlinko = 0, decideFort = 0, decideVet = 0, cento = 0, tutto = 0, conCento = 0, centoDecide = 0;
  var voci = { offerte: 0, premi: 0, plinko: 0, ruota: 0, fortuna: 0, vetrina: 0, tutto: 0 }, totale = 0;
  function cambia(r, w, f) { var o = {}; Object.keys(r.fine).forEach(function (id) { o[id] = f(id, r.G.pt[id], r.fine[id]); }); return primo(o) !== w; }
  for (var i = 0; i < N; i++) {
    var r = puntata(skills, C), w = primo(r.fine);
    vinte[+w.slice(1)]++;
    if (primo(r.prima) === w) primoDopo++;
    var pr = r.prima, ids = Object.keys(pr), mn = Math.min.apply(null, ids.map(function (k) { return pr[k]; }));
    if (pr[w] === mn) ultimoVince++;
    // senza i punti di fortuna avrebbe vinto un altro?
    if (cambia(r, w, function (id, x, t) { return t - x.fortuna; })) { decideRuota++; centoDecide++; }
    if (cambia(r, w, function (id, x, t) { return t - x.plinko + (r.G.plMedia[id] || 0); })) decidePlinko++;
    // tutta la fortuna: Ruota (anche i posti: girare è quasi tutta fortuna), CENTO e giro bonus, caselle del Plinko
    if (cambia(r, w, function (id, x, t) { return t - x.fortuna - x.ruota - x.plinko + (r.G.plMedia[id] || 0); })) decideFort++;
    if (cambia(r, w, function (id, x, t) { return t - x.vetrina - x.tutto; })) decideVet++;
    if (r.G.cento) conCento++;
    cento += r.G.cento; tutto += r.G.tutto;
    r.G.pl.forEach(function (p) { Object.keys(voci).forEach(function (k) { voci[k] += r.G.pt[p.id][k]; totale += r.G.pt[p.id][k]; }); });
  }
  var pc = function (x) { return (100 * x / N).toFixed(0) + "%"; };
  var out = { vinte: vinte.map(function (v) { return v / N; }), primoDopo: primoDopo / N, ultimoVince: ultimoVince / N, decideRuota: decideRuota / N, decidePlinko: decidePlinko / N,
    decideFort: decideFort / N, decideVet: decideVet / N, centoSeCe: conCento ? centoDecide / conCento : 0, cento: cento / N, tutto: tutto / N, mediaTesta: totale / N / skills.length, quotaFinale: (voci.ruota + voci.fortuna + voci.vetrina + voci.tutto) / totale };
  if (zitto) return out;
  console.log("\n== " + nome + " · " + skills.length + " giocatori (errore tipico " + skills.join(" / ") + ") · " + N + " puntate");
  console.log("   vince: " + skills.map(function (s, i) { return "g" + (i + 1) + "(" + s + ") " + pc(vinte[i]); }).join(" · "));
  console.log("   primo dopo le 3 manche vince " + pc(primoDopo) + " · ultimo dopo le 3 manche vince " + pc(ultimoVince));
  console.log("   cambia il vincitore → CENTO+giro bonus " + pc(decideRuota) + " (quando c'è un CENTO: " + (100 * out.centoSeCe).toFixed(0) + "%) · caselle del Plinko " + pc(decidePlinko) + " · TUTTA la fortuna " + pc(decideFort) + " · la Vetrina " + pc(decideVet));
  console.log("   CENTO a puntata " + out.cento.toFixed(2) + " · VINCI TUTTO a puntata " + out.tutto.toFixed(2));
  console.log("   punti: " + Object.keys(voci).map(function (k) { return k + " " + (100 * voci[k] / totale).toFixed(0) + "%"; }).join(" · ") + " · media a testa " + Math.round(out.mediaTesta));
  return out;
}
module.exports = { prova: prova, OGGI: OGGI, variante: variante, alpOggi: alpOggi, nuovaPuntata: nuovaPuntata, offerta: offerta, PREMI: PREMI, ruota: ruota, vetrina: vetrina, mediaPlinko: mediaPlinko };

if (require.main === module) {
  var N = +process.argv[2] || 20000;
  prova("OGGI", OGGI, [0.15, 0.3, 0.3, 0.45], N);
  prova("OGGI", OGGI, [0.3, 0.3, 0.3, 0.3], N);
  prova("OGGI", OGGI, [0.2, 0.3, 0.3, 0.3, 0.4, 0.45], N);
  prova("OGGI", OGGI, [0.3, 0.3], N);
}
