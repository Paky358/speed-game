/* =========================================================
   📞✏️ TELEFONO DISEGNATO — la catena di frasi e disegni (27 nov 2026, chat «📞✏️ Telefono Disegnato»).
   Fatto dal modello dei giochi online. Il proprietario ha scelto la proposta A «Per ridere» con i premi della C
   (studio, foto e scelte in D:/SG-telefono-prove).
   - Ognuno scrive una frase strana; il telefono dopo la DISEGNA; quello dopo vede solo il disegno e scrive cosa ci
     vede; poi si disegna di nuovo, e così via. Tutti lavorano INSIEME, ognuno su un libretto diverso.
   - I libretti (uno a testa): la prima pagina è scritta, poi disegno e scritta a turno, l'ultima è scritta.
     In N dispari N pagine; in N pari (fino a 6) chi ha scritto la frase la disegna anche (come in Telestrations), così
     N+1 pagine; mai più di 7 pagine (da 8 in su ogni libretto salta qualcuno). Nessuno vede due volte lo stesso libretto.
   - Non si aspetta il più lento: appena hanno finito tutti si va avanti (il tempo c'è, ma non si deve aspettarlo).
   - Chi esce non rompe niente: la sua pagina si salta e il libretto continua dall'ultima pagina buona.
   - Alla fine si sfogliano i libretti uno alla volta (va avanti chi tiene la partita, col conto che va avanti da solo):
     ogni disegno si ridisegna tratto per tratto, volano le reazioni di tutti, alla fine di ogni libretto «era partita
     così… ed è arrivata così» e la ⭐ al disegno più bello. Chi ha disegnato si scopre solo nella rivelazione.
   - Niente punti: a fine partita i premi (🎨 Picasso, 😂 il libretto più bello, 🔨 il Sabotatore, 🔍 il Detective,
     🐢 Con calma), calcolati dalle ⭐, dalle reazioni e da quanto le frasi somigliano a quelle di prima.
   - Solo online. Le pagine (frasi e disegni) NON passano mai nella foto prima della rivelazione: ognuno riceve solo la
     pagina che deve guardare, col messaggio per lui solo. I disegni viaggiano interi, come lista di tratti, quando si
     tocca «Fatto» (o allo scadere): così nella rivelazione si possono ridisegnare.
   La lavagna è quella di Disegna e Indovina (js/games/scarabocchio.js, creaVista), copiata qui senza la rete dal vivo.
   ========================================================= */
(function () {
  "use strict";

  var ID = "telefono";
  var MIN = 4, MAX = 12, MAXP = 7;          // giocatori; pagine al massimo per libretto
  var RESPIRO = 5;                          // i secondi di respiro quando la partita riprende
  var RITARDATARI = "partita";              // chi arriva a partita cominciata guarda la rivelazione ed entra alla prossima
  var PROVA = window.__TD_PROVA || {};      // (solo per le prove: { ritmo: { s0, d, s }, riv: { s, d, f } in secondi })
  var RITMI = { svelto: { s0: 35, d: 60, s: 30 }, normale: { s0: 45, d: 80, s: 40 }, calmo: { s0: 60, d: 120, s: 55 } };
  var GRAZIA = 1500;                        // ms in più dopo la fine del tempo: la pagina dell'ultimo istante arriva in tempo
  var ANTICIPO = 900;                       // il telefono manda da solo quello che c'è un attimo prima della fine
  var LUNGO = 70;                           // lettere massime di una frase
  var REAZ = ["😂", "😮", "👏", "❤️", "💩"];
  var LW = 1000, LH = 1200;                 // la lavagna "logica" (come Disegna e Indovina)
  var PUNTI_MAX = 2600;                     // punti al massimo in un disegno (si semplifica prima di partire)
  var MEM_IDEE = "sg-telefono-idee";        // le idee già date su questo telefono

  // i tempi della rivelazione (secondi): una frase, un disegno (si ridisegna in RIDISEGNO), la fine del libretto
  var RIV = { s: 3.6, d: 5.6, f: 9 }, RIDISEGNO = 2600;
  if (PROVA.riv) Object.keys(PROVA.riv).forEach(function (k) { RIV[k] = PROVA.riv[k]; });
  if (PROVA.ridisegno != null) RIDISEGNO = PROVA.ridisegno;

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function piccolo(o) { return o && typeof o === "object" && JSON.stringify(o).length <= 400 ? o : null; }   // (i gettoni: nella foto sempre)
  function leggi(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function leggiS(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }
  function scriviS(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p || 20); } catch (e) {} }
  function setTx(n, s) { if (n && n.textContent !== s) n.textContent = s; }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function elenco(l) { return l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " e " + l[l.length - 1]; }
  function pulisci(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, LUNGO); }
  function intIn(v, max) { v = Math.round(+v || 0); return v < 0 ? 0 : (v > max ? max : v); }

  // ---- suoni piccoli, col motore audio comune ----
  function nota(f, dur, dopo, tipo, vol) {
    var c = window.SG && SG.audioCtx && SG.audioCtx(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), n = c.currentTime + (dopo || 0);
      o.type = tipo || "triangle"; o.frequency.setValueAtTime(f, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(vol || 0.1, n + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + dur + 0.02);
    } catch (e) {}
  }
  var FX = {
    via: function () { nota(523, 0.1, 0, "sine", 0.08); nota(784, 0.14, 0.08, "sine", 0.08); },
    invio: function () { nota(660, 0.07, 0, "sine", 0.07); nota(990, 0.09, 0.05, "sine", 0.06); },
    pagina: function () { nota(880, 0.06, 0, "triangle", 0.05); nota(1175, 0.08, 0.04, "triangle", 0.04); },
    rullo: function () { for (var i = 0; i < 8; i++) nota(140 + i * 10, 0.05, i * 0.07, "square", 0.03); },
    arrivo: function () { [523, 659, 784].forEach(function (f, i) { nota(f, 0.16, 0.56 + i * 0.09, "triangle", 0.08); }); },
    tic: function () { nota(900, 0.05, 0, "square", 0.035); },
    festa: function () { [523, 659, 784, 1046].forEach(function (f, i) { nota(f, 0.18, i * 0.11, "triangle", 0.09); }); }
  };

  // =========================================================
  //  LE REGOLE (senza grafica): pagine, chi fa cosa, quanto somigliano le frasi, i premi
  // =========================================================
  // lo schema dei libretti con N giocatori: pari = chi scrive la frase la disegna anche (N pari fino a 6)
  function schema(N) {
    var pari = N % 2 === 0 && N + 1 <= MAXP;
    return { pari: pari, L: pari ? N + 1 : Math.max(1, Math.min(N, MAXP)) };
  }
  // chi (il posto, da 0 a N-1) fa la pagina r del libretto b
  function chiFa(b, r, N, pari) { return pari ? (r === 0 ? b : (b + r - 1) % N) : (b + r) % N; }
  // il libretto su cui lavora il posto i al passo r
  function libroDi(i, r, N, pari) { return pari ? (r === 0 ? i : ((i - r + 1) % N + N) % N) : ((i - r) % N + N) % N; }

  // ---- quanto due frasi si somigliano (per il Detective e il Sabotatore): le parole che contano in comune ----
  var VUOTE = {}; ("un uno una il lo la i gli le l di del della dei degli delle dello a al alla ai agli alle allo da dal dalla dai dagli dalle in nel nella nei negli nelle " +
    "con col su sul sulla sui sugli sulle per tra fra che e ed o non si sta stanno fa fanno ha hanno mentre come sopra sotto dentro fuori molto tanto suo sua suoi sue " +
    "c ci ce cè e è sono era essere questo questa quello quella qualcuno qualcosa tipo cosa").split(" ").forEach(function (w) { VUOTE[w] = 1; });
  function norma(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function radici(s) {
    var o = [];
    norma(s).split(" ").forEach(function (w) {
      if (w.length < 3 || VUOTE[w]) return;
      var r = w.length > 5 ? w.slice(0, 5) : w.replace(/[aeiou]$/, "");
      if (o.indexOf(r) < 0) o.push(r);
    });
    return o;
  }
  function somiglia(fonte, frase) {
    var a = radici(fonte), b = radici(frase);
    if (!a.length || !b.length) return 0;
    var n = a.filter(function (x) { return b.indexOf(x) >= 0; }).length;
    return n / a.length;
  }

  // ---- i disegni in viaggio: una stringa sola. Ogni tratto «colore.spessore.riempi.punti», tratti separati da «|»;
  // i punti sono 4 lettere ciascuno (x e y da 2 lettere, da 0 a 4095) ----
  var ALF = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", ALF_I = {};
  for (var ai = 0; ai < ALF.length; ai++) ALF_I[ALF[ai]] = ai;
  function n2(v) { v = intIn(v, 4095); return ALF[v >> 6] + ALF[v & 63]; }
  function codifica(tratti) {
    return (tratti || []).filter(function (tr) { return tr && tr.p && tr.p.length >= 2; }).map(function (tr) {
      var s = (tr.c | 0) + "." + (tr.w | 0) + "." + (tr.f ? 1 : 0) + ".";
      for (var k = 0; k + 1 < tr.p.length; k += 2) s += n2(tr.p[k]) + n2(tr.p[k + 1]);
      return s;
    }).join("|");
  }
  function decodifica(s) {
    if (!s || typeof s !== "string") return [];
    var out = [];
    s.split("|").forEach(function (pz) {
      var m = /^(\d+)\.(\d+)\.([01])\.([A-Za-z0-9_-]*)$/.exec(pz); if (!m) return;
      var p = [], q = m[4];
      for (var k = 0; k + 3 < q.length; k += 4) {
        var x = ALF_I[q[k]] * 64 + ALF_I[q[k + 1]], y = ALF_I[q[k + 2]] * 64 + ALF_I[q[k + 3]];
        if (isNaN(x) || isNaN(y)) return;
        p.push(Math.min(x, LW), Math.min(y, LH));
      }
      if (p.length) out.push({ c: Math.min(+m[1], COLORI.length - 1), w: Math.min(+m[2], SPESSORI.length - 1), f: +m[3], p: p });
    });
    return out;
  }
  // meno punti, stessa forma (Ramer-Douglas-Peucker), finché il disegno sta sotto PUNTI_MAX
  function semplifica(tratti) {
    function conta(l) { var n = 0; l.forEach(function (tr) { n += tr.p.length / 2; }); return n; }
    function rdp(p, eps) {
      var n = p.length / 2; if (n <= 2) return p.slice();
      var tieni = new Uint8Array(n); tieni[0] = tieni[n - 1] = 1;
      var pila = [[0, n - 1]];
      while (pila.length) {
        var seg = pila.pop(), a = seg[0], b = seg[1], ax = p[a * 2], ay = p[a * 2 + 1], bx = p[b * 2], by = p[b * 2 + 1];
        var dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy) || 1, max = -1, qi = -1;
        for (var i = a + 1; i < b; i++) {
          var d = Math.abs(dy * p[i * 2] - dx * p[i * 2 + 1] + bx * ay - by * ax) / L;
          if (d > max) { max = d; qi = i; }
        }
        if (max > eps && qi > 0) { tieni[qi] = 1; pila.push([a, qi], [qi, b]); }
      }
      var o = []; for (var j = 0; j < n; j++) if (tieni[j]) o.push(p[j * 2], p[j * 2 + 1]);
      return o;
    }
    var l = tratti.map(function (tr) { return { c: tr.c, w: tr.w, f: tr.f ? 1 : 0, p: tr.p.slice() }; }), eps = 0.8;
    while (conta(l) > PUNTI_MAX && eps < 40) {
      l = l.map(function (tr) { return tr.f ? tr : { c: tr.c, w: tr.w, f: 0, p: rdp(tr.p, eps) }; });
      eps *= 1.6;
    }
    return l;
  }

  // ---- i premi di fine partita (li calcola chi tiene la partita) ----
  // libri: [{ a, pag: [{ t, chi, x, s, auto, pk }] }]; rea: { pk: [😂, 😮, 👏, ❤️, 💩] }; stelle: { b: { chi vota: j } };
  // lenti: { id: volte ultimo }; nomi: { id: nome }
  function calcolaPremi(libri, rea, stelle, lenti, nomi) {
    var premi = [];
    function R(pk, i) { return ((rea || {})[pk] || [])[i] || 0; }
    // 🎨 Picasso: più ⭐ sui suoi disegni (a pari, più reazioni sui disegni)
    var st = {}, rd = {};
    libri.forEach(function (lb, b) {
      var v = (stelle || {})[b] || {};
      Object.keys(v).forEach(function (chi) { var pg = lb.pag[v[chi]]; if (pg && pg.t === "d" && !pg.s && pg.chi !== chi) st[pg.chi] = (st[pg.chi] || 0) + 1; });
      lb.pag.forEach(function (pg) { if (pg.t === "d" && !pg.s) rd[pg.chi] = (rd[pg.chi] || 0) + R(pg.pk, 0) + R(pg.pk, 2) + R(pg.pk, 3); });
    });
    var pic = Object.keys(st).sort(function (a, b) { return st[b] - st[a] || (rd[b] || 0) - (rd[a] || 0); })[0];
    if (pic && st[pic] > 0) premi.push({ ic: "🎨", tit: "Il Picasso", id: pic, tx: st[pic] === 1 ? "una ⭐ sui suoi disegni" : st[pic] + " ⭐ sui suoi disegni" });
    // 😂 il libretto più bello: più 😂 su tutte le sue pagine (se nessuno ha riso: quello che è cambiato di più)
    var best = -1, bScore = -1;
    libri.forEach(function (lb, b) {
      var r = 0; lb.pag.forEach(function (pg) { r += R(pg.pk, 0); });
      if (r > bScore) { bScore = r; best = b; }
    });
    if (bScore <= 0) {
      var minS = 2;
      libri.forEach(function (lb, b) { var pr = primaE(lb), ul = ultimaS(lb); if (pr && ul && pr !== ul) { var s = somiglia(pr.x, ul.x); if (s < minS) { minS = s; best = b; } } });
    }
    if (best >= 0 && libri[best]) {
      var a1 = primaE(libri[best]), a2 = ultimaS(libri[best]);
      if (a1 && a2 && a1 !== a2) premi.push({ ic: "😂", tit: "Il libretto più bello", id: libri[best].a, tx: "«" + corta(a1.x) + "» → «" + corta(a2.x) + "»", b: best });
    }
    // per ogni frase indovinata (una scritta dopo un disegno): la frase che il disegno voleva dire
    var ind = [];
    libri.forEach(function (lb) {
      for (var j = 1; j < lb.pag.length; j++) {
        var pg = lb.pag[j]; if (pg.t !== "s" || pg.s || !pg.x) continue;
        var dis = null, fonte = null;
        for (var k = j - 1; k >= 0; k--) { var q = lb.pag[k]; if (q.s) continue; if (!dis) { if (q.t === "d") dis = q; else break; } else if (q.t === "s") { fonte = q; break; } }
        if (dis && fonte && fonte.x) ind.push({ chi: pg.chi, x: pg.x, fonte: fonte.x, sim: somiglia(fonte.x, pg.x), ride: R(pg.pk, 0) });
      }
    });
    // 🔨 il Sabotatore: la frase che ha cambiato tutto (lontana da quella di prima), meglio se ha fatto ridere
    var sab = null, sabV = -1;
    ind.forEach(function (x) { if (x.sim >= 0.5) return; var v = (1 - x.sim) * (1 + x.ride); if (v > sabV) { sabV = v; sab = x; } });
    if (sab) premi.push({ ic: "🔨", tit: "Il Sabotatore", id: sab.chi, tx: "«" + corta(sab.x) + "»: da lì è cambiato tutto" });
    // 🔍 il Detective: chi ha capito più disegni (la frase somiglia almeno per metà a quella di prima)
    var det = {}, tot = {};
    ind.forEach(function (x) { tot[x.chi] = (tot[x.chi] || 0) + 1; if (x.sim >= 0.5) det[x.chi] = (det[x.chi] || 0) + 1; });
    var dk = Object.keys(det).sort(function (a, b) { return det[b] - det[a] || tot[a] - tot[b]; })[0];
    if (dk && det[dk] > 0) premi.push({ ic: "🔍", tit: "Il Detective", id: dk, tx: "ha capito " + (det[dk] === 1 ? "un disegno" : det[dk] + " disegni") + " su " + tot[dk] });
    // 🐢 Con calma: l'ultimo a finire più volte (almeno 2)
    var lk = Object.keys(lenti || {}).sort(function (a, b) { return lenti[b] - lenti[a]; })[0];
    if (lk && lenti[lk] >= 2) premi.push({ ic: "🐢", tit: "Con calma", id: lk, tx: "l'ultimo a finire " + lenti[lk] + " volte" });
    premi.forEach(function (p) { p.nome = (nomi || {})[p.id] || "?"; });
    return premi;
  }
  function corta(x) { x = String(x || ""); return x.length > 30 ? x.slice(0, 28).replace(/\s+\S*$/, "") + "…" : x; }
  function primaE(lb) { var p = lb.pag[0]; return p && p.t === "s" && p.x ? p : null; }
  function ultimaS(lb) { for (var j = lb.pag.length - 1; j > 0; j--) { var p = lb.pag[j]; if (!p.s && p.t === "s" && p.x) return p; } return null; }

  // =========================================================
  //  LA LAVAGNA (la stessa di Disegna e Indovina: 16 colori + gomma, 5 grandezze, matita, linea, tondo, secchiello,
  //  annulla, ripeti, cestino). Il disegno "vero" sta su una tela fissa 1000x1200; sullo schermo se ne vede una copia
  // =========================================================
  var COLORI = ["#1d1d27", "#868e96", "#8b5a2b", "#e03131", "#fd7e14", "#fcc419", "#2f9e44", "#3bc9db", "#1971c2", "#7048e8", "#f06595", "#f5c6a0",
    "#a5d8ff", "#b2f2bb", "#fcc2d7", "#fff3bf", "#ffffff"];
  var NOMI_COL = ["Nero", "Grigio", "Marrone", "Rosso", "Arancione", "Giallo", "Verde", "Azzurro", "Blu", "Viola", "Rosa", "Pelle", "Cielo", "Erba", "Rosa chiaro", "Crema", "Gomma"];
  var GOMMA = COLORI.length - 1;
  var SPESSORI = [4, 10, 18, 32, 56];
  var NOMI_SP = ["Finissimo", "Sottile", "Medio", "Grosso", "Grossissimo"];
  var ICONE = {
    matita: "<svg viewBox='0 0 24 24' width='22' height='22' aria-hidden='true'><path d='M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/><path d='M5.2 15.4l3.4 3.4' stroke='currentColor' stroke-width='2'/><circle cx='5' cy='19' r='1.6' fill='var(--c,#fcc419)'/></svg>",
    linea: "<svg viewBox='0 0 24 24' width='22' height='22' aria-hidden='true'><path d='M4.5 19.5 19.5 4.5' stroke='var(--c,#fcc419)' stroke-width='3' stroke-linecap='round'/><circle cx='4.5' cy='19.5' r='2' fill='currentColor'/><circle cx='19.5' cy='4.5' r='2' fill='currentColor'/></svg>",
    tondo: "<svg viewBox='0 0 24 24' width='22' height='22' aria-hidden='true'><ellipse cx='12' cy='12' rx='8.5' ry='7' fill='none' stroke='var(--c,#fcc419)' stroke-width='3'/></svg>",
    secchio: "<svg viewBox='0 0 24 24' width='22' height='22' aria-hidden='true'><path d='M10 3 17 10 10 17 3 10Z' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/>" +
      "<path d='M4.2 10.8h11.6L10 16.6z' fill='var(--c,#fcc419)'/><path d='M19.5 12.6c1.2 1.8 1.9 3 1.9 3.9a1.9 1.9 0 0 1-3.8 0c0-.9.7-2.1 1.9-3.9z' fill='var(--c,#fcc419)' stroke='currentColor' stroke-width='.8'/></svg>"
  };
  var NOMI_MODO = { matita: "Matita", linea: "Linea dritta", tondo: "Tondo (cerchio o ovale)", secchio: "Secchiello: riempi una zona" };

  // il disegno sulla tela: una linea morbida (curve che passano per i punti di mezzo)
  function trattoSu(c, tr) {
    var p = tr.p; if (!p.length) return;
    var lw = SPESSORI[tr.w] || SPESSORI[0], n = p.length / 2;
    c.strokeStyle = c.fillStyle = COLORI[tr.c] || COLORI[0];
    c.lineWidth = lw; c.lineCap = "round"; c.lineJoin = "round";
    if (n === 1) { c.beginPath(); c.arc(p[0], p[1], lw / 2, 0, Math.PI * 2); c.fill(); return; }
    c.beginPath(); c.moveTo(p[0], p[1]);
    for (var k = 1; k < n; k++) {
      var x = p[k * 2], y = p[k * 2 + 1];
      if (k < n - 1) c.quadraticCurveTo(x, y, (x + p[k * 2 + 2]) / 2, (y + p[k * 2 + 3]) / 2);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  // il secchiello: riempie la zona toccata (i pixel simili attaccati), più un pixel di bordo sulla sfumatura delle linee
  function riempiSu(tctx, x, y, colore) {
    x = intIn(x, LW - 1); y = intIn(y, LH - 1);
    var img = tctx.getImageData(0, 0, LW, LH), d = img.data, W = LW, H = LH;
    var r = parseInt(colore.slice(1, 3), 16), g = parseInt(colore.slice(3, 5), 16), b = parseInt(colore.slice(5, 7), 16);
    var s0 = (y * W + x) * 4, r0 = d[s0], g0 = d[s0 + 1], b0 = d[s0 + 2];
    if (Math.abs(r0 - r) + Math.abs(g0 - g) + Math.abs(b0 - b) < 16) return null;
    var TOL = 100, zona = new Uint8Array(W * H), pila = [x, y], minX = x, maxX = x, minY = y, maxY = y;
    function simile(q) { var j = q * 4; return Math.abs(d[j] - r0) + Math.abs(d[j + 1] - g0) + Math.abs(d[j + 2] - b0) <= TOL; }
    while (pila.length) {
      var py = pila.pop(), px = pila.pop(), q = py * W + px;
      while (px > 0 && !zona[q - 1] && simile(q - 1)) { px--; q--; }
      var su = false, giu = false;
      for (; px < W && !zona[q] && simile(q); px++, q++) {
        zona[q] = 1;
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (py > 0) { var u = q - W; if (!zona[u] && simile(u)) { if (!su) { pila.push(px, py - 1); su = true; } } else su = false; }
        if (py < H - 1) { var v = q + W; if (!zona[v] && simile(v)) { if (!giu) { pila.push(px, py + 1); giu = true; } } else giu = false; }
      }
      if (py < minY) minY = py; if (py > maxY) maxY = py;
    }
    var ax = Math.max(0, minX - 1), bx = Math.min(W - 1, maxX + 1), ay = Math.max(0, minY - 1), by = Math.min(H - 1, maxY + 1);
    for (var yy = ay; yy <= by; yy++) for (var xx = ax; xx <= bx; xx++) {
      var kk = yy * W + xx;
      if (zona[kk] || (xx > 0 && zona[kk - 1]) || (xx < W - 1 && zona[kk + 1]) || (yy > 0 && zona[kk - W]) || (yy < H - 1 && zona[kk + W])) {
        var j = kk * 4; d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
      }
    }
    tctx.putImageData(img, 0, 0, ax, ay, bx - ax + 1, by - ay + 1);
    return [ax, ay, bx + 1, by + 1];
  }
  function telaNuova() { var c = document.createElement("canvas"); c.width = LW; c.height = LH; return c; }
  var RENDER = null;   // una tela sola per i disegni fermi (miniature, foto): si disegna lì e si copia
  function rendi(tratti, dest, w, h) {
    if (!RENDER) RENDER = telaNuova();
    var c = RENDER.getContext("2d", { willReadFrequently: true });
    c.fillStyle = "#fff"; c.fillRect(0, 0, LW, LH);
    (tratti || []).forEach(function (tr) { if (tr.f) riempiSu(c, tr.p[0], tr.p[1], COLORI[tr.c] || COLORI[0]); else trattoSu(c, tr); });
    var dc = dest.getContext("2d");
    dc.imageSmoothingEnabled = true; dc.imageSmoothingQuality = "high";
    dc.drawImage(RENDER, 0, 0, LW, LH, 0, 0, w || dest.width, h || dest.height);
  }
  // un disegno fermo su una tela della pagina, alla misura (in px) che si vede
  function disegnoFermo(cv, tratti, cw) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), ch = Math.round(cw * LH / LW);
    cv.style.width = cw + "px"; cv.style.height = ch + "px";
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    rendi(tratti, cv);
  }

  // la lavagna: opz.modifica = si disegna (con gli strumenti); se no si guarda (e si può ridisegnare con anima)
  function Lavagna(t, opz) {
    opz = opz || {};
    var el = t.el, cv = el("canvas", { class: "td-cv" + (opz.modifica ? " matita" : "") }), box = el("div", { class: "td-lav" }, [cv]);
    var ctx = cv.getContext("2d"), tela = telaNuova(), tctx = tela.getContext("2d", { willReadFrequently: true });
    var tratti = [], mio = null, forma = null, rifare = [], cestinati = null, foto = [], puoi = !!opz.modifica, raf = null;
    var scelta = { c: 0, w: 2, modo: "matita" };
    tctx.fillStyle = "#fff"; tctx.fillRect(0, 0, LW, LH);
    function cambiato() { if (opz.cambia) opz.cambia(tratti); }
    function copia(x0, y0, x1, y1) {
      x0 = Math.max(0, Math.floor(x0) - 2); y0 = Math.max(0, Math.floor(y0) - 2); x1 = Math.min(LW, Math.ceil(x1) + 2); y1 = Math.min(LH, Math.ceil(y1) + 2);
      if (x1 <= x0 || y1 <= y0 || !cv.width) return;
      var s = cv.width / LW;
      ctx.drawImage(tela, x0, y0, x1 - x0, y1 - y0, x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s);
    }
    function mostraTutto() { if (!cv.width) return; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(tela, 0, 0, cv.width, cv.height); }
    function disegnaDa(tr, da, fermo) {
      var p = tr.p; if (!p.length) return;
      if (tr.f) { var z = riempiSu(tctx, p[0], p[1], COLORI[tr.c] || COLORI[0]); if (z && !fermo) copia(z[0], z[1], z[2], z[3]); return; }
      var lw = SPESSORI[tr.w] || SPESSORI[0], n = p.length / 2, s = Math.max(0, Math.floor(da / 2) - 1);
      var x0 = p[s * 2], y0 = p[s * 2 + 1], x1 = x0, y1 = y0;
      tctx.strokeStyle = tctx.fillStyle = COLORI[tr.c] || COLORI[0];
      tctx.lineWidth = lw; tctx.lineCap = "round"; tctx.lineJoin = "round";
      if (n === 1) { tctx.beginPath(); tctx.arc(p[0], p[1], lw / 2, 0, Math.PI * 2); tctx.fill(); }
      else {
        tctx.beginPath();
        if (s === 0) tctx.moveTo(p[0], p[1]); else tctx.moveTo((p[s * 2] + p[s * 2 + 2]) / 2, (p[s * 2 + 1] + p[s * 2 + 3]) / 2);
        for (var k = s + 1; k < n; k++) {
          var x = p[k * 2], y = p[k * 2 + 1];
          if (k < n - 1) tctx.quadraticCurveTo(x, y, (x + p[k * 2 + 2]) / 2, (y + p[k * 2 + 3]) / 2);
          else tctx.lineTo(x, y);
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        tctx.stroke();
      }
      if (!fermo) copia(x0 - lw, y0 - lw, x1 + lw, y1 + lw);
    }
    function scatta(j) { try { foto.push({ pre: tratti.slice(0, j + 1), img: tctx.getImageData(0, 0, LW, LH) }); } catch (e) { return; } if (foto.length > 3) foto.shift(); }
    function fotoBuona(f) { if (f.pre.length > tratti.length) return false; for (var k = 0; k < f.pre.length; k++) if (tratti[k] !== f.pre[k]) return false; return true; }
    function ridisegna() {
      var f = null, da = 0;
      for (var i = foto.length - 1; i >= 0; i--) if (fotoBuona(foto[i])) { f = foto[i]; break; }
      foto = f ? foto.slice(0, foto.indexOf(f) + 1) : [];
      if (f) { tctx.putImageData(f.img, 0, 0); da = f.pre.length; }
      else { tctx.fillStyle = "#fff"; tctx.fillRect(0, 0, LW, LH); }
      for (var j = da; j < tratti.length; j++) { disegnaDa(tratti[j], 0, true); if (tratti[j].f) scatta(j); }
      mostraTutto();
    }
    function coord(e) { var r = cv.getBoundingClientRect(); return [intIn((e.clientX - r.left) / r.width * LW, LW), intIn((e.clientY - r.top) / r.height * LH, LH)]; }
    function aggiungi(pt) {
      var p = mio.p, n = p.length;
      if (n && Math.abs(p[n - 2] - pt[0]) + Math.abs(p[n - 1] - pt[1]) < 3) return;
      p.push(pt[0], pt[1]);
      disegnaDa(mio, Math.max(0, p.length - 4));
    }
    function stacca() { if (!mio) return; mio = null; cambiato(); }
    function nuovoSegno() { cestinati = null; if (rifare.length) { rifare = []; aggStrumenti(); } }
    function puntiForma(f) {
      if (scelta.modo === "linea") return [f.x0, f.y0, f.x1, f.y1];
      var cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2, rx = Math.abs(f.x1 - f.x0) / 2, ry = Math.abs(f.y1 - f.y0) / 2;
      var n = Math.max(24, Math.min(90, Math.round((rx + ry) * Math.PI / 14))), p = [];
      for (var k = 0; k <= n; k++) { var a = k / n * Math.PI * 2; p.push(intIn(cx + rx * Math.cos(a), LW), intIn(cy + ry * Math.sin(a), LH)); }
      return p;
    }
    function mostraForma() {
      mostraTutto();
      var p = puntiForma(forma), s = cv.width / LW;
      ctx.save(); ctx.scale(s, s);
      ctx.strokeStyle = COLORI[scelta.c]; ctx.lineWidth = SPESSORI[scelta.w]; ctx.lineCap = ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (var k = 2; k < p.length; k += 2) ctx.lineTo(p[k], p[k + 1]); ctx.stroke();
      ctx.restore();
    }
    function chiudiForma(ok) {
      if (!forma) return;
      var f = forma; forma = null;
      if (!ok || !puoi) return mostraTutto();
      var tr = { c: scelta.c, w: scelta.w, p: Math.abs(f.x1 - f.x0) + Math.abs(f.y1 - f.y0) < 8 ? [f.x0, f.y0] : puntiForma(f) };
      tratti.push(tr); disegnaDa(tr, 0); mostraTutto(); cambiato();
    }
    if (opz.modifica) {
      cv.addEventListener("pointerdown", function (e) {
        if (!puoi) return;
        e.preventDefault(); nuovoSegno();
        if (scelta.modo === "secchio") {
          var pt = coord(e), op = { c: scelta.c, w: 0, f: 1, p: [Math.min(pt[0], LW - 1), Math.min(pt[1], LH - 1)] };
          tratti.push(op); disegnaDa(op, 0); scatta(tratti.length - 1); cambiato();
          return;
        }
        try { cv.setPointerCapture(e.pointerId); } catch (x) {}
        if (scelta.modo === "linea" || scelta.modo === "tondo") { var q = coord(e); forma = { x0: q[0], y0: q[1], x1: q[0], y1: q[1] }; mostraForma(); return; }
        mio = { c: scelta.c, w: scelta.w, p: [] }; tratti.push(mio);
        aggiungi(coord(e));
      });
      cv.addEventListener("pointermove", function (e) {
        if (forma) { e.preventDefault(); var q = coord(e); forma.x1 = q[0]; forma.y1 = q[1]; mostraForma(); return; }
        if (!mio) return;
        e.preventDefault();
        var ev = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
        if (!ev.length) ev = [e];
        ev.forEach(function (x) { aggiungi(coord(x)); });
      });
      cv.addEventListener("pointerup", function () { chiudiForma(true); stacca(); });
      cv.addEventListener("pointercancel", function () { chiudiForma(false); stacca(); });
      cv.addEventListener("lostpointercapture", function () { chiudiForma(true); stacca(); });
    }
    function annulla() {
      if (!puoi) return;
      stacca(); chiudiForma(false);
      if (!tratti.length && cestinati) { tratti = cestinati; cestinati = null; ridisegna(); cambiato(); aggStrumenti(); return; }
      if (!tratti.length) return;
      var tr = tratti.pop(); ridisegna(); rifare.push(tr); if (rifare.length > 30) rifare.shift();
      aggStrumenti(); cambiato();
    }
    function ripeti() {
      if (!puoi || !rifare.length) return;
      stacca(); chiudiForma(false);
      var tr = rifare.pop(); tratti.push(tr); disegnaDa(tr, 0); if (tr.f) scatta(tratti.length - 1); mostraTutto();
      aggStrumenti(); cambiato();
    }
    function cestino() { if (!puoi || !tratti.length) return; stacca(); chiudiForma(false); cestinati = tratti; tratti = []; rifare = []; aggStrumenti(); ridisegna(); cambiato(); }

    // gli strumenti (solo chi disegna)
    var strumenti = null, bCol = [], bGomma = null, bSp = [], bModi = [], bRip = null;
    function aggStrumenti() {
      if (!strumenti) return;
      var col = scelta.c === GOMMA ? "#fff" : COLORI[scelta.c];
      bCol.forEach(function (b, i) { b.classList.toggle("on", i === scelta.c); });
      bGomma.classList.toggle("on", scelta.c === GOMMA);
      bModi.forEach(function (b, i) { b.classList.toggle("on", ["matita", "linea", "tondo", "secchio"][i] === scelta.modo); b.style.setProperty("--c", col); });
      bSp.forEach(function (b, i) { b.classList.toggle("on", scelta.modo !== "secchio" && i === scelta.w); b.style.setProperty("--c", col); });
      cv.classList.toggle("secchio", scelta.modo === "secchio");
      bRip.disabled = !rifare.length;
    }
    if (opz.modifica) {
      var tavolozza = el("div", { class: "td-tavolozza" }), attrezzi = el("div", { class: "td-attrezzi" });
      bCol = COLORI.slice(0, GOMMA).map(function (c, i) {
        return el("button", { class: "td-col", style: "--c:" + c, "aria-label": NOMI_COL[i], onclick: function () { scelta.c = i; aggStrumenti(); } });
      });
      bGomma = el("button", { class: "td-str td-gomma", "aria-label": "Gomma", text: "🧽", onclick: function () { scelta.c = GOMMA; if (scelta.modo === "secchio") scelta.modo = "matita"; aggStrumenti(); } });
      bSp = SPESSORI.map(function (_, i) {
        return el("button", { class: "td-spess s" + i, "aria-label": NOMI_SP[i], onclick: function () { scelta.w = i; if (scelta.modo === "secchio") scelta.modo = "matita"; aggStrumenti(); } }, [el("i")]);
      });
      bModi = ["matita", "linea", "tondo", "secchio"].map(function (k) {
        return el("button", { class: "td-str td-modo", "aria-label": NOMI_MODO[k], html: ICONE[k], onclick: function () { scelta.modo = k; aggStrumenti(); } });
      });
      var bAnn = el("button", { class: "td-str", "aria-label": "Annulla", text: "↶", onclick: annulla });
      bRip = el("button", { class: "td-str", "aria-label": "Ripeti", text: "↷", onclick: ripeti });
      var bPul = el("button", { class: "td-str", "aria-label": "Cancella tutto", text: "🗑️", onclick: cestino });
      bCol.slice(0, 8).forEach(function (b) { tavolozza.appendChild(b); }); tavolozza.appendChild(bAnn); tavolozza.appendChild(bRip);
      bCol.slice(8).forEach(function (b) { tavolozza.appendChild(b); }); tavolozza.appendChild(bGomma); tavolozza.appendChild(bPul);
      bSp.forEach(function (b) { attrezzi.appendChild(b); }); attrezzi.appendChild(el("span", { class: "td-sep" }));
      bModi.forEach(function (b) { attrezzi.appendChild(b); });
      strumenti = el("div", { class: "td-strumenti" }, [tavolozza, attrezzi]);
      aggStrumenti();
    }

    // il ridisegno della rivelazione: i tratti tornano in ordine, come li ha fatti chi ha disegnato, in ms millisecondi
    function ferma() { if (raf) cancelAnimationFrame(raf); raf = null; }
    function anima(lista, ms, fine) {
      ferma(); tratti = lista || []; foto = [];
      tctx.fillStyle = "#fff"; tctx.fillRect(0, 0, LW, LH); mostraTutto();
      var tot = 0; tratti.forEach(function (tr) { tot += tr.f ? 40 : Math.max(1, tr.p.length / 2); });
      if (!tot) { if (fine) fine(); return; }
      var t0 = null, si = 0, pi = 0, fatti = 0;
      function linea(tr, da, a) {
        var p = tr.p, lw = SPESSORI[tr.w] || SPESSORI[0], n = p.length / 2;
        tctx.strokeStyle = tctx.fillStyle = COLORI[tr.c] || COLORI[0]; tctx.lineWidth = lw; tctx.lineCap = "round"; tctx.lineJoin = "round";
        if (n === 1) { tctx.beginPath(); tctx.arc(p[0], p[1], lw / 2, 0, Math.PI * 2); tctx.fill(); return; }
        var s = Math.max(0, da - 1); if (a - 1 <= s) return;
        tctx.beginPath(); tctx.moveTo(p[s * 2], p[s * 2 + 1]);
        for (var k = s + 1; k < a; k++) tctx.lineTo(p[k * 2], p[k * 2 + 1]);
        tctx.stroke();
      }
      function passo(ora) {
        if (!document.body.contains(cv)) { raf = null; return; }
        if (t0 === null) t0 = ora;
        var target = Math.min(tot, tot * (ora - t0) / Math.max(1, ms));
        while (si < tratti.length && fatti < target) {
          var tr = tratti[si];
          if (tr.f) { riempiSu(tctx, tr.p[0], tr.p[1], COLORI[tr.c] || COLORI[0]); fatti += 40; si++; pi = 0; continue; }
          var n = tr.p.length / 2, fino = Math.min(n, pi + Math.max(1, Math.ceil(target - fatti)));
          linea(tr, pi, fino); fatti += fino - pi; pi = fino; if (pi >= n) { si++; pi = 0; }
        }
        mostraTutto();
        if (si < tratti.length) raf = requestAnimationFrame(passo);
        else { raf = null; ridisegna(); if (fine) fine(); }
      }
      raf = requestAnimationFrame(passo);
    }
    // la misura: la lavagna più grande che sta in w x h (sempre 1000:1200)
    function dimensiona(w, h) {
      if (!w || !h) return;
      var cw = Math.floor(Math.min(w, h * LW / LH)), ch = Math.round(cw * LH / LW);
      if (cw < 40) return;
      var dpr = Math.min(2.5, window.devicePixelRatio || 1);
      cv.style.width = cw + "px"; cv.style.height = ch + "px";
      if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(cw * dpr * LH / LW); }
      mostraTutto();
    }
    return {
      box: box, cv: cv, strumenti: strumenti, dimensiona: dimensiona, anima: anima, ferma: ferma,
      carica: function (lista) { ferma(); tratti = (lista || []).map(function (tr) { return { c: tr.c, w: tr.w, f: tr.f ? 1 : 0, p: tr.p.slice() }; }); foto = []; rifare = []; cestinati = null; ridisegna(); aggStrumenti(); },
      tratti: function () { return tratti; },
      attiva: function (b) { puoi = !!b && !!opz.modifica; if (!puoi) { stacca(); chiudiForma(false); } }
    };
  }

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var IO = t.mioId || "host";   // io che tengo la partita (dopo un subentro: l'id da amico del vice). MAI "host" fisso
    // il proprietario (IL PAPPONE) può far partire la partita anche in pochi, per vedere com'è
    var PROVA_PROP = String(t.nomeProfilo() || "").trim().toUpperCase() === "IL PAPPONE";
    var MINIMO = PROVA_PROP ? 2 : (PROVA.minimo || MIN);
    var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, passo: "giro", ritmo: RITMI[imp.ritmo] ? imp.ritmo : "normale",
      giro: 0, L: 0, pari: false, ordine: [], libri: [], fatti: {}, ordFine: [], lenti: {}, scade: 0, chiedi: 0,
      riv: null, ordLib: [], rea: {}, stelle: {}, premi: null, classifica: null, prima: null, to: null, rip: 0,
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost) }], guarda: [], prossimi: [] };
    var DIS = {};   // i disegni: "b.j" → stringa dei tratti. Pesano: restano su questo telefono (soloQui), MAI nella copia per il vice
    var R = t.ripresa, riprendo = !!(R && R.stato && R.stato.fase && R.stato.fase !== "lobby" && R.stato.players), attesi = [];
    if (riprendo) {
      H = R.stato;
      H.to = null; H.pronta = false; H.rip = H.rip || 0; H.prossimi = H.prossimi || []; H.guarda = H.guarda || [];
      DIS = (R.soloQui && R.soloQui.dis) || {};
      H.players.forEach(function (p) {
        if (p.id !== IO && !p.via && p.id !== (R.daRiserva && R.vecchioHost)) attesi.push(p.id);
        p.forse = false; p.via = p.id !== IO; if (p.id === IO) p.omino = t.mioOmino(p.nome);
      });
      if (R.daRiserva) H.chiedi = (H.chiedi || 0) + 1;   // il vice non ha i disegni: chiede a ognuno di rimandare i suoi
      // (e i miei, quelli che ho fatto io su questo telefono, li ho già)
      var miei = memoria({ codice: H.codice }).miei(H.partita);
      Object.keys(miei).forEach(function (pk) { if (!DIS[pk] && typeof miei[pk] === "string") DIS[pk] = miei[pk]; });
      if (H.fase === "gioco") {
        if (H.passo !== "ripresa") H.prima = H.passo;
        if (H.prima === "giro" && H.scade) H.scade = R.ora(H.scade);
        H.passo = "ripresa";
      }
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function vivo(id) { var p = pById(id); return !!p && !p.via; }
    function inProssimi(id) { return H.prossimi.some(function (x) { return x.id === id; }); }
    function entrano() {
      H.prossimi.forEach(function (x) { if (!pById(x.id) && H.players.length < MAX) H.players.push({ id: x.id, nome: x.nome, omino: x.omino }); });
      H.prossimi = [];
    }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } if (chiusura) { clearTimeout(chiusura); chiusura = null; } }
    function kGiro() { return H.partita + "|" + H.giro; }
    function T() { var r = PROVA.ritmo || RITMI[H.ritmo] || RITMI.normale; return r; }
    function N() { return H.ordine.length; }
    function nomeId(id) { var p = pById(id); return p ? p.nome : "?"; }

    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.ritmo = RITMI[im.ritmo] ? im.ritmo : "normale"; bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onErrore: function () {
        if (H.pronta) return;
        ferma(); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
      onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
      onAddio: function (id) {
        if (H.guarda.some(function (x) { return x.id === id; })) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
        if (inProssimi(id)) { H.prossimi = H.prossimi.filter(function (x) { return x.id !== id; }); bd(); return; }
        var p = pById(id); if (!p) return;
        p.forse = false;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;
        if (H.fase === "gioco" && H.passo !== "ripresa" && presenti().length < 1) return fine();
        if (H.fase === "gioco" && H.passo === "giro") controllaTutti();   // (la sua pagina si salta: si va avanti senza di lui)
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
          if (!p && !t.puoSedersi(id, nome)) {
            if (!H.guarda.some(function (x) { return x.id === id; })) H.guarda.push({ id: id, nome: nome });
            bd(); return;
          }
          // chi arriva a partita cominciata guarda la rivelazione ed entra alla prossima (i libretti hanno già i loro passaggi)
          if (!p && H.fase !== "lobby") {
            if (!inProssimi(id) && H.players.length + H.prossimi.length < MAX) H.prossimi.push({ id: id, nome: nome, omino: avatarValido(m.omino) });
            else if (!inProssimi(id) && !H.guarda.some(function (x) { return x.id === id; })) H.guarda.push({ id: id, nome: nome });
            bd(); return;
          }
          if (!p && H.fase === "lobby" && H.players.length < MAX) H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino) });
          if (p) { p.forse = false; if (p.via && H.fase !== "lobby") p.via = false; if (!p.omino) p.omino = avatarValido(m.omino); }
          bd();
          if (p && H.fase === "gioco" && H.passo === "giro") { manda(id); controllaTutti(); }   // chi rientra ritrova la sua pagina (e quella da guardare)
          return;
        }
        var q = pById(id);
        // i disegni rimandati al vice: anche da chi risulta ancora «via» (il suo join può arrivare dopo)
        if (m.t === "rimando") { if (q) rimando(m.d); return; }
        if (!q || q.via) return;   // chi guarda soltanto non fa mosse (e chi aspetta la prossima nemmeno)
        if (m.t === "chiedi") { chiesti(id, m.k); return; }
        if (H.fase !== "gioco") return;
        if (m.t === "pag") pagina(id, m);
        else if (m.t === "riapri") riapri(id, m.k);
        else if (m.t === "comp?") { if (H.passo === "giro") manda(id); }
        else if (m.t === "rea") reazione(id, m.pk, m.e);
        else if (m.t === "stella") stella(id, m.b, m.j);
      }
    }, { ripresa: riprendo });
    if (!rete) return senzaRete(t);
    if (riprendo && rete.codice) H.codice = rete.codice;

    // ---- la foto per tutti: SEMPRE con gli id e con "fase"; MAI le pagine prima della rivelazione ----
    function vm() {
      var adesso = Date.now(), o = { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, passo: H.passo, ritmo: H.ritmo,
        giro: H.giro, L: H.L, n: N(), k: kGiro(), tiene: IO, rip: H.rip, chiedi: H.chiedi, minimo: MINIMO,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, via: !!p.via, forse: !!p.forse, omino: H.fase === "lobby" ? (p.omino || null) : piccolo(p.omino) }; }),
        guarda: H.guarda, prossimi: H.prossimi.map(function (x) { return { id: x.id, nome: x.nome }; }) };
      if (H.fase === "gioco" && (H.passo === "giro" || H.passo === "ripresa")) {
        // chi fa cosa in questo passo (scrive o disegna) e chi ha finito: niente di quello che c'è scritto o disegnato
        var st = {};
        H.ordine.forEach(function (id, i) { var b = libroDi(i, H.giro, N(), H.pari), pg = H.libri[b] && H.libri[b].pag[H.giro]; if (pg) st[id] = { t: pg.t, f: H.fatti[id] ? 1 : 0 }; });
        o.stato = st;
        o.restaMs = H.scade ? Math.max(0, H.scade - adesso) : 0;
      }
      if (H.passo === "ripresa") o.restaMs = Math.max(1000, H.scade - adesso);
      if (H.fase === "gioco" && H.passo === "rivela" && H.riv) o.riv = vmRiv(adesso);
      if (H.fase === "fine") { o.premi = H.premi; o.libri = riassuntoLibri(); }
      return o;
    }
    function vmRiv(adesso) {
      var rv = H.riv, b = H.ordLib[rv.i], lb = H.libri[b], fin = rv.p >= lb.pag.length, fino = fin ? lb.pag.length - 1 : rv.p;
      var pag = [], dis = {}, rea = {};
      for (var j = 0; j <= fino; j++) {
        var pg = lb.pag[j], x = { t: pg.t, chi: pg.chi, pk: pg.pk };
        if (pg.s) x.s = 1; else if (pg.t === "s") x.x = pg.x; else if (DIS[pg.pk]) dis[pg.pk] = DIS[pg.pk]; else x.perso = 1;
        if (pg.auto) x.auto = 1;
        pag.push(x);
        if (H.rea[pg.pk]) rea[pg.pk] = H.rea[pg.pk];
      }
      var o = { i: rv.i, nb: H.ordLib.length, b: b, a: lb.a, p: rv.p, L: lb.pag.length, fin: fin, pag: pag, dis: dis, rea: rea, fermo: !!rv.fermo, n: rv.n,
        resta: rv.fermo ? 0 : Math.max(1, Math.ceil((rv.scade - adesso) / 1000)) };
      if (fin) { var cs = {}, v = H.stelle[b] || {}; Object.keys(v).forEach(function (chi) { cs[v[chi]] = (cs[v[chi]] || 0) + 1; }); o.stelle = cs; o.mie = v; }
      return o;
    }
    // a fine partita: i libretti interi senza i disegni (le frasi pesano poco; i disegni ognuno li ha già visti, o li chiede)
    function riassuntoLibri() {
      return H.ordLib.map(function (b) { var lb = H.libri[b]; return { a: lb.a, pag: lb.pag.map(function (pg) { var x = { t: pg.t, chi: pg.chi, pk: pg.pk }; if (pg.s) x.s = 1; else if (pg.t === "s") x.x = pg.x; if (pg.auto) x.auto = 1; return x; }) }; });
    }
    function privato(id, m) {
      if (id === IO) { privatoArrivato(t, cbHost, m); return; }
      m.to = id; rete.inviaVeloce(m);
    }
    // la partita da ricordare: un oggetto semplice, coi disegni a parte (soloQui)
    function ricorda() {
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {};
      Object.keys(H).forEach(function (x) { if (x !== "to" && x !== "prossimi") s[x] = H[x]; });
      s.players = H.players.map(function (p) { return { id: p.id, nome: p.nome, via: !!p.via, omino: piccolo(p.omino) }; });
      t.ricorda(s, { dis: DIS });
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); ricorda(); disegna(t, v, cbHost); }

    // ----- la ripresa: qualche secondo di respiro (gli amici rientrano e, col vice, rimandano i loro disegni) -----
    function riprendi() {
      if (H.fase !== "gioco") return bd();
      respiro(RESPIRO * 1000);
    }
    var nRespiri = 0;
    function respiro(ms) { ferma(); H.rip++; H.passo = "ripresa"; H.scadeR = Date.now() + ms; H.scade = H.scadeR; bd(); H.to = setTimeout(dopoRespiro, ms); }
    function dopoRespiro() {
      H.to = null;
      var tutti = attesi.every(function (id) { var p = pById(id); return !p || !p.via; });
      if (!tutti && ++nRespiri < 4) return respiro(RESPIRO * 1000);
      if (!presenti().length) return fine();
      if (H.prima === "rivela" && H.riv) { H.passo = "rivela"; H.riv.scade = Date.now() + durataPasso() * 1000; t.aCheSiamo("Libretto " + (H.riv.i + 1) + " di " + H.ordLib.length); return bd(); }
      apriGiro(true);   // il passo a metà: si riprende con tutto il tempo (le pagine già fatte restano)
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MINIMO) return;
      H.fase = "gioco"; H.partita++; H.giro = 0; H.premi = null; H.classifica = null; H.riv = null; H.rea = {}; H.stelle = {}; H.lenti = {}; H.chiedi = 0; H.reaChi = {};
      DIS = {};
      H.ordine = presenti().map(function (p) { return p.id; });
      var sc = schema(N()); H.pari = sc.pari; H.L = sc.L;
      H.libri = H.ordine.map(function (id) { return { a: id, pag: [] }; });
      // l'ordine in cui si sfogliano: a caso (uguale per tutti: è nella foto quando serve)
      H.ordLib = H.ordine.map(function (_, i) { return i; });
      for (var i = H.ordLib.length - 1; i > 0; i--) { var j = rnd(i + 1), x = H.ordLib[i]; H.ordLib[i] = H.ordLib[j]; H.ordLib[j] = x; }
      apriGiro(false);
    }
    // l'ultima pagina buona prima della r (una frase scritta, o un disegno che c'è davvero)
    function ingresso(lb, r) {
      for (var j = r - 1; j >= 0; j--) { var pg = lb.pag[j]; if (!pg || pg.s) continue; if (pg.t === "s" ? !!pg.x : !!DIS[pg.pk]) return pg; }
      return null;
    }
    // apre il passo H.giro: ogni libretto riceve la sua pagina nuova (frase o disegno), ognuno la sua da fare
    function apriGiro(ripreso) {
      ferma();
      H.passo = "giro";
      if (!ripreso) {
        H.fatti = {}; H.ordFine = [];
        H.libri.forEach(function (lb, b) {
          var i = chiFa(b, H.giro, N(), H.pari), chi = H.ordine[i], ins = H.giro ? ingresso(lb, H.giro) : null;
          lb.pag[H.giro] = { t: H.giro === 0 ? "s" : (ins && ins.t === "s" ? "d" : "s"), chi: chi, pk: b + "." + H.giro };
        });
      }
      var tt = T(), tipi = {};
      H.libri.forEach(function (lb) { var pg = lb.pag[H.giro]; if (pg && !H.fatti[pg.chi]) tipi[pg.t] = 1; });
      var sec = H.giro === 0 ? tt.s0 : (tipi.d ? tt.d : tt.s);
      H.scade = Date.now() + sec * 1000;
      t.aCheSiamo("Passo " + (H.giro + 1) + " di " + H.L);
      bd();
      H.ordine.forEach(function (id) { if (vivo(id)) manda(id); });
      H.to = setTimeout(chiudiGiro, sec * 1000 + GRAZIA);
      controllaTutti();
    }
    // la pagina da fare a un telefono solo: cosa deve fare e cosa deve guardare (MAI nella foto)
    function manda(id) {
      var i = H.ordine.indexOf(id); if (i < 0) return;
      var b = libroDi(i, H.giro, N(), H.pari), lb = H.libri[b], pg = lb && lb.pag[H.giro]; if (!pg) return;
      var ins = H.giro ? ingresso(lb, H.giro) : null, m = { t: "comp", k: kGiro(), pk: pg.pk, r: H.giro, L: H.L, tipo: pg.t };
      if (ins) m.ins = ins.t === "s" ? { t: "s", x: ins.x } : { t: "d", d: DIS[ins.pk] };
      if (ins && ins.chi === id) m.tua = 1;   // (in pari chi ha scritto la frase la disegna anche)
      if (H.fatti[id]) m.tuo = pg.t === "s" ? { x: pg.x || "" } : { d: DIS[pg.pk] || "" };
      privato(id, m);
    }
    function pagina(id, m) {
      if (H.passo !== "giro" || m.k !== kGiro()) return;
      var i = H.ordine.indexOf(id); if (i < 0) return;
      var b = libroDi(i, H.giro, N(), H.pari), pg = H.libri[b].pag[H.giro];
      if (!pg || pg.pk !== m.pk || pg.chi !== id) return;
      if (pg.t === "s") pg.x = pulisci(m.x);
      else if (typeof m.d === "string" && m.d.length < 200000) { if (m.d) DIS[pg.pk] = m.d; else delete DIS[pg.pk]; }
      if (!H.fatti[id]) H.ordFine.push(id);
      H.fatti[id] = 1;
      bd(); controllaTutti();
    }
    function riapri(id, k) {
      if (H.passo !== "giro" || k !== kGiro() || !H.fatti[id]) return;
      delete H.fatti[id]; H.ordFine = H.ordFine.filter(function (x) { return x !== id; });
      if (chiusura) { clearTimeout(chiusura); chiusura = null; }
      bd();
    }
    var chiusura = null;
    // hanno finito tutti quelli che ci sono: un attimo (si vede l'ultima ✅) e si passa il libretto
    function controllaTutti() {
      if (H.passo !== "giro") return;
      var manca = H.ordine.some(function (id) { return vivo(id) && !H.fatti[id]; });
      if (manca || !presenti().length) { if (chiusura) { clearTimeout(chiusura); chiusura = null; } return; }
      if (chiusura) return;
      chiusura = setTimeout(function () { chiusura = null; if (H.passo === "giro" && !H.ordine.some(function (id) { return vivo(id) && !H.fatti[id]; })) chiudiGiro(); }, 800);
    }
    function chiudiGiro() {
      if (H.passo !== "giro") return;
      ferma();
      var idee = window.SG_TELEFONO_IDEE || [], tutti = !H.ordine.some(function (id) { return vivo(id) && !H.fatti[id]; });
      // 🐢 chi è stato l'ultimo: se hanno finito tutti l'ultimo a finire, se no chi non ha finito in tempo
      if (H.ordine.filter(vivo).length >= 3) {
        if (tutti && H.ordFine.length) { var u = H.ordFine[H.ordFine.length - 1]; H.lenti[u] = (H.lenti[u] || 0) + 1; }
        else H.ordine.forEach(function (id) { if (vivo(id) && !H.fatti[id]) H.lenti[id] = (H.lenti[id] || 0) + 1; });
      }
      H.libri.forEach(function (lb) {
        var pg = lb.pag[H.giro]; if (!pg) return;
        var vuota = pg.t === "s" ? !pg.x : !DIS[pg.pk];
        if (!vuota) return;
        // la prima frase non resta mai vuota: la mette il gioco con un'idea; le altre pagine vuote si saltano
        if (H.giro === 0) { pg.x = idee.length ? idee[rnd(idee.length)] : "Un gatto che fa surf su una pizza"; pg.auto = 1; }
        else pg.s = 1;
      });
      H.giro++;
      if (H.giro >= H.L) return apriRivela();
      apriGiro(false);
    }

    // ----- la rivelazione: si sfogliano i libretti, una pagina alla volta; va avanti chi tiene la partita -----
    function durataPasso() {
      var rv = H.riv, lb = H.libri[H.ordLib[rv.i]];
      if (rv.p >= lb.pag.length) return RIV.f;
      var pg = lb.pag[rv.p];
      if (pg.s) return 1.6;
      if (pg.t === "d") return RIV.d;
      return RIV.s + Math.min(2, (pg.x || "").length / 30);
    }
    function apriRivela() {
      ferma();
      H.passo = "rivela"; H.riv = { i: 0, p: 0, n: 0, fermo: false, scade: 0 };
      H.riv.scade = Date.now() + durataPasso() * 1000;
      t.aCheSiamo("Libretto 1 di " + H.ordLib.length);
      bd();
    }
    function avantiRiv(n) {
      if (H.fase !== "gioco" || H.passo !== "rivela" || !H.riv) return;
      if (n != null && n !== H.riv.n) return;   // (il tocco e il conto insieme non saltano una pagina)
      var rv = H.riv, lb = H.libri[H.ordLib[rv.i]];
      rv.n++;
      if (rv.p >= lb.pag.length) {
        if (rv.i + 1 >= H.ordLib.length) return fine();
        rv.i++; rv.p = 0;
        t.aCheSiamo("Libretto " + (rv.i + 1) + " di " + H.ordLib.length);
      } else rv.p++;
      rv.fermo = false; rv.scade = Date.now() + durataPasso() * 1000;
      bd();
    }
    function pausa() {
      if (H.passo !== "rivela" || !H.riv) return;
      H.riv.fermo = !H.riv.fermo;
      if (!H.riv.fermo) { H.riv.n++; H.riv.scade = Date.now() + durataPasso() * 1000; }   // (il conto riparte da capo)
      bd();
    }
    var ultimaRea = {};
    function reazione(id, pk, e) {
      if (H.passo !== "rivela" || !H.riv) return;
      e = +e; if (!(e >= 0 && e < REAZ.length)) return;
      var lb = H.libri[H.ordLib[H.riv.i]], ok = lb.pag.some(function (pg, j) { return pg.pk === pk && j <= H.riv.p; });
      if (!ok) return;
      var ora = Date.now(); if (ora - (ultimaRea[id] || 0) < 180) return; ultimaRea[id] = ora;
      var c = H.rea[pk] || (H.rea[pk] = [0, 0, 0, 0, 0]), kk = pk + "|" + id + "|" + e;
      // per i premi conta al massimo 3 volte la stessa faccina della stessa persona sulla stessa pagina
      H.reaChi = H.reaChi || {};
      if ((H.reaChi[kk] || 0) < 3) { H.reaChi[kk] = (H.reaChi[kk] || 0) + 1; c[e]++; }
      var m = { t: "vola", pk: pk, e: e, c: c[e], id: id };
      rete.inviaVeloce(m); volaArrivato(m);
      ricorda();
    }
    function stella(id, b, j) {
      if (H.passo !== "rivela" || !H.riv) return;
      b = +b; j = +j;
      var lb = H.libri[H.ordLib[H.riv.i]];
      if (H.ordLib[H.riv.i] !== b || H.riv.p < lb.pag.length) return;
      var v = H.stelle[b] || (H.stelle[b] = {}), pg = lb.pag[j];
      if (v[id] === j) delete v[id];
      else if (pg && pg.t === "d" && !pg.s && pg.chi !== id) v[id] = j;
      bd();
    }
    // il vice (o chi ha ricaricato) riceve i disegni da chi li aveva fatti
    function rimando(d) {
      if (!d || typeof d !== "object") return;
      var nuovi = 0;
      Object.keys(d).forEach(function (pk) {
        if (!/^\d+\.\d+$/.test(pk) || DIS[pk] || typeof d[pk] !== "string" || d[pk].length > 200000) return;
        var b = +pk.split(".")[0], j = +pk.split(".")[1], pg = H.libri[b] && H.libri[b].pag[j];
        if (pg && pg.t === "d") { DIS[pk] = d[pk]; if (pg.s && H.giro > j) pg.s = 0; nuovi++; }
      });
      if (nuovi) { ricorda(); if (H.passo === "rivela") bd(); }
    }
    // chi non ha un disegno della rivelazione (ha ricaricato) lo chiede: glielo mando solo se è già stato sfogliato
    function chiesti(id, ks) {
      if (!Array.isArray(ks)) return;
      var d = {}, n = 0, visto = function (pk) {
        if (H.fase === "fine") return true;
        if (H.passo !== "rivela" || !H.riv) return false;
        var b = +String(pk).split(".")[0], j = +String(pk).split(".")[1], pos = H.ordLib.indexOf(b);
        return pos < H.riv.i || (pos === H.riv.i && j <= H.riv.p);
      };
      ks.slice(0, 40).forEach(function (pk) { if (DIS[pk] && visto(pk) && n < 12) { d[pk] = DIS[pk]; n++; } });
      if (n) privato(id, { t: "disegni", d: d });
    }
    function fine() {
      ferma();
      var nomi = {}; H.players.forEach(function (p) { nomi[p.id] = p.nome; });
      H.premi = H.libri.length ? calcolaPremi(H.libri, H.rea, H.stelle, H.lenti, nomi) : [];
      // niente punti («per ridere»): tutti allo stesso posto
      H.classifica = H.players.map(function (p) { return { id: p.id, nome: p.nome, pos: 1 }; });
      H.fase = "fine"; H.passo = "fine";
      bd();
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    function nuova() {
      if (H.fase !== "fine") return;
      ferma(); H.fase = "lobby"; H.passo = "giro"; H.classifica = null; H.premi = null; H.riv = null; H.libri = []; H.ordine = []; DIS = {};
      H.players = presenti(); entrano(); bd();
    }
    t.onRivincita = nuova;

    var cbHost = { sonoHost: true, myId: IO, minimo: MINIMO, onComincia: comincia, onNuova: nuova,
      onPagina: function (m) { pagina(IO, m); },
      onRiapri: function (k) { riapri(IO, k); },
      onChiediComp: function () { if (H.passo === "giro") manda(IO); },
      onRea: function (pk, e) { reazione(IO, pk, e); },
      onStella: function (b, j) { stella(IO, b, j); },
      onAvanti: function (n) { avantiRiv(n); },
      onPausa: pausa,
      onRimando: function (d) { rimando(d); },
      onChiedi: function () {},
      onEsci: function () {
        function via() { ferma(); t.ricorda(null); rete.chiudi(); t.esci(); }
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);
        via();
      } };
    if (riprendo) riprendi(); else bd();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null };
    function manda(m) { if (S.rete) S.rete.invia(m); }
    var cb = { sonoHost: false, myId: null,
      onPagina: function (m) { manda(m); },
      onRiapri: function (k) { manda({ t: "riapri", k: k }); },
      onChiediComp: function () { manda({ t: "comp?" }); },
      onRea: function (pk, e) { manda({ t: "rea", pk: pk, e: e }); },
      onStella: function (b, j) { manda({ t: "stella", b: b, j: j }); },
      onRimando: function (d) { manda({ t: "rimando", d: d }); },
      onChiedi: function (ks) { manda({ t: "chiedi", k: ks }); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (t.guarda) return t.conferma("Smetti di guardare?", null, "Esci", via);
        if (S.vm && S.vm.fase === "gioco") return t.conferma("Uscire dalla partita?", "Il tuo libretto continua anche senza di te.", "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();
    function chiediNome() {
      var s = t.schermata({ icona: "📞", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
          else if (m.t === "comp" || m.t === "disegni") privatoArrivato(t, cb, m);
          else if (m.t === "vola") volaArrivato(m);
        },
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "📞", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  LA MEMORIA DEL TELEFONO: la mia pagina che sto facendo (se ricarico), i miei disegni (per il vice),
  //  i disegni della rivelazione già visti (per la galleria di fine partita)
  // =========================================================
  function Memoria(codice) {
    var kB = "sg-td-bozza-" + codice, kM = "sg-td-miei-" + codice, kC = "sg-td-visti-" + codice;
    var visti = leggiS(kC) || { p: null, d: {} };
    return {
      bozza: function (k) { var b = leggiS(kB); return b && b.k === k ? b : null; },
      salvaBozza: function (k, v) { v.k = k; scriviS(kB, v); },
      miei: function (partita) { var m = leggiS(kM); return m && m.p === partita ? m.d : {}; },
      mio: function (partita, pk, d) { var m = leggiS(kM); if (!m || m.p !== partita) m = { p: partita, d: {} }; if (d) m.d[pk] = d; else delete m.d[pk]; scriviS(kM, m); },
      visto: function (partita, pk) { return visti.p === partita ? visti.d[pk] || null : null; },
      vedi: function (partita, d) {
        if (visti.p !== partita) visti = { p: partita, d: {} };
        var nuovi = false; Object.keys(d || {}).forEach(function (pk) { if (!visti.d[pk] && typeof d[pk] === "string") { visti.d[pk] = d[pk]; nuovi = true; } });
        if (nuovi) scriviS(kC, visti);
        return nuovi;
      }
    };
  }
  var MEMO = {};
  function memoria(vm) { var c = vm && vm.codice || "?"; return MEMO[c] || (MEMO[c] = Memoria(c)); }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti): saletta, partita, fine
  // =========================================================
  var UI = null, FIN = null;
  function lasciaUI() { if (UI) { fermaTimer(UI); if (UI.lav) UI.lav.ferma(); } UI = null; }
  function disegna(t, vm, cb) {
    cb.vm = vm; cb.vmTs = Date.now();
    // il vice ha chiesto i disegni: ognuno rimanda i suoi (una volta per richiesta)
    if (vm.fase === "gioco" && vm.chiedi && cb.chiesto !== vm.chiedi + "|" + vm.partita && !cb.sonoHost && (vm.players || []).some(function (p) { return p.id === cb.myId; })) {
      cb.chiesto = vm.chiedi + "|" + vm.partita;
      var mi = memoria(vm).miei(vm.partita);
      if (Object.keys(mi).length) cb.onRimando(mi);
    }
    if (vm.fase === "lobby") { lasciaUI(); FIN = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      lasciaUI();
      var kf = "fine|" + vm.partita;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: finale(t, vm, cb) };
      return;
    }
    FIN = null;
    if (!UI || UI.t !== t || !document.body.contains(UI.s)) { lasciaUI(); UI = creaSchermo(t, cb); }
    aggiorna(UI, vm, cb);
  }
  function lobby(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    var extra = [], n = Math.max(MIN, vm.players.length), sc = schema(n);
    extra.push(t.el("p", { class: "modulo-nota", style: "text-align:center", text: "📖 In " + n + ": un libretto a testa, " + sc.L + " pagine ciascuno" }));
    if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    var min = vm.minimo || MIN;
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: min,
      vuoti: Math.max(0, min - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
      extra: extra,
      spettatore: t.guarda ? "👀 Guardi soltanto" : guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function pDi(vm, id) { var o = null; (vm.players || []).forEach(function (p) { if (p.id === id) o = p; }); return o; }
  function nomeDi(vm, id, cb, minuscolo) { var p = pDi(vm, id); if (!p) return "Qualcuno"; return id === cb.myId ? (minuscolo || "Tu") : p.nome; }
  var FIG = {};
  function figura(p) {
    var cfg = p && (p.omino || (window.SGOmino ? SGOmino.casuale(p.nome || "?") : null));
    if (!cfg || !window.SGOmino) return "";
    var kk = JSON.stringify(cfg);
    if (!FIG[kk]) { try { FIG[kk] = SGOmino.svg(cfg, { quadrato: true }); } catch (e) { FIG[kk] = ""; } }
    return FIG[kk];
  }
  function gettone(t, p, cl) { return t.el("span", { class: "td-gt " + (cl || ""), html: figura(p) }); }

  function creaSchermo(t, cb) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("td-piena");
    var ui = { t: t, s: s, cb: cb, timer: [], kCorpo: null, fase: null, lav: null };
    ui.esci = el("button", { class: "td-esci", "aria-label": "Esci", text: "‹", onclick: cb.onEsci });
    ui.centro = el("div", { class: "td-centro" }, [el("b"), el("small")]);
    ui.destra = el("div", { class: "td-destra" });
    ui.corpo = el("div", { class: "td-corpo" });
    ui.targa = !!t.guarda && !t.eliminazione;
    ui.scena = el("div", { class: "td-scena" + (ui.targa ? " td-con-targa" : "") }, [el("div", { class: "td-barra" }, [ui.esci, ui.centro, ui.destra]), ui.corpo]);
    s._contenuto.appendChild(ui.scena);
    t.mostra(s);
    return ui;
  }
  // i messaggi per questo telefono solo: la pagina da fare (comp) e i disegni chiesti; le reazioni che volano
  function privatoArrivato(t, cb, m) {
    if (m.t === "comp") { cb.comp = m; if (cb.vm) disegna(t, cb.vm, cb); }
    else if (m.t === "disegni" && cb.vm) { if (memoria(cb.vm).vedi(cb.vm.partita, m.d) && UI && UI.cb === cb && UI.fase && UI.fase.disegni) UI.fase.disegni(); }
  }
  function volaArrivato(m) { if (UI && UI.fase && UI.fase.vola) UI.fase.vola(m); }
  function fermaTimer(ui) { ui.timer.forEach(function (x) { if (x && x.ro) x.ro.disconnect(); else { clearTimeout(x); clearInterval(x); } }); ui.timer = []; }
  function testa(ui, tit, sotto) { setTx(ui.centro.firstChild, tit); setTx(ui.centro.lastChild, sotto || ""); }

  function aggiorna(ui, vm, cb) {
    var io = pDi(vm, cb.myId);
    var modo;
    if (vm.passo === "ripresa") modo = "ripresa";
    else if (vm.passo === "rivela") modo = "rivela";
    else {
      var st = (vm.stato || {})[cb.myId], comp = cb.comp && cb.comp.k === vm.k ? cb.comp : null;
      if (!io || io.via || !st) modo = "guarda";
      else if (!comp) modo = "arriva";
      else if (st.f && !ui.ritocco) modo = "fatto";
      else modo = "fai";
      if (modo === "fai" && !st.f) ui.ritocco = false;
      if (modo !== "fai" && modo !== "fatto") ui.ritocco = false;
    }
    var kc = modo + "|" + vm.partita + "|" + (modo === "rivela" ? (vm.riv && vm.riv.i) : vm.k) + "|" + (modo === "ripresa" ? vm.rip : "") + "|" + (modo === "fai" || modo === "fatto" ? (cb.comp && cb.comp.pk) : "");
    if (kc !== ui.kCorpo) {
      ui.kCorpo = kc; fermaTimer(ui); if (ui.lav) { ui.lav.ferma(); ui.lav = null; }
      svuota(ui.corpo); svuota(ui.destra);
      ui.scena.setAttribute("data-modo", modo);
      ui.fase = FASI[modo](ui, vm, cb);
    } else if (ui.fase && ui.fase.agg) ui.fase.agg(vm);
  }

  // ---- il tempo nella barra: «0:42», rosso negli ultimi 10 secondi; a fine tempo il telefono manda quello che c'è ----
  function orologio(ui, vm, cb, alla) {
    var el = ui.t.el, n = el("span", { class: "td-tempo" }), ultimo = -1;
    ui.destra.appendChild(n);
    var T = { fine: Date.now() + (vm.restaMs || 0), mandato: false };
    function tic() {
      if (!document.body.contains(n)) return;
      var ms = Math.max(0, T.fine - Date.now()), s = Math.ceil(ms / 1000);
      setTx(n, Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2));
      n.classList.toggle("poco", s <= 10);
      if (s <= 5 && s > 0 && s !== ultimo && alla) { ultimo = s; FX.tic(); }
      if (alla && !T.mandato && ms <= ANTICIPO) { T.mandato = true; alla(); }
    }
    tic(); ui.timer.push(setInterval(tic, 250));
    return { rifai: function (v) { var f = Date.now() + (v.restaMs || 0); if (f < T.fine - 300 || f > T.fine + 1500) T.fine = f; } };
  }
  // la fila dei passi: ●●○○○
  function passi(ui, vm) {
    var el = ui.t.el, d = el("div", { class: "td-passi" });
    for (var i = 0; i < (vm.L || 0); i++) d.appendChild(el("i", { class: i < vm.giro ? "f" : i === vm.giro ? "o" : "" }));
    return d;
  }
  // «Pronti 5 su 8» con i gettoni
  function pronti(ui, vm) {
    var el = ui.t.el, b = el("b"), fila = el("div", { class: "td-fila" }), box = el("div", { class: "td-pronti" }, [b, fila]), chip = {};
    function agg(v) {
      var st = v.stato || {}, ids = Object.keys(st), fatti = ids.filter(function (id) { return st[id].f; }).length;
      setTx(b, "Pronti " + fatti + " su " + ids.length);
      ids.forEach(function (id, i) {
        var p = pDi(v, id); if (!p) return;
        var c = chip[id]; if (!c) { c = chip[id] = gettone(ui.t, p, "p"); c.appendChild(el("i", { class: "ok", text: "✓" })); }
        if (fila.children[i] !== c) fila.insertBefore(c, fila.children[i] || null);
        c.classList.toggle("spento", !st[id].f);
        c.classList.toggle("via", !!p.via);
      });
    }
    agg(vm);
    return { box: box, agg: agg };
  }

  var FASI = {};
  // ----- la ripresa -----
  FASI.ripresa = function (ui, vm, cb) {
    var el = ui.t.el; testa(ui, "🔁 Si riprende…", "La partita continua da dov'era");
    var p = el("p", { class: "td-sotto" }); ui.corpo.appendChild(el("div", { class: "td-mezzo" }, [el("div", { class: "td-icona", text: "🔁" }), el("p", { class: "td-tit", text: "Si riprende…" }), p]));
    ui.t.contoAvanti(p, Math.ceil((vm.restaMs || 5000) / 1000), null, "tdr|" + vm.partita + "|" + vm.rip);
    return {};
  };
  // ----- il libretto sta per arrivare (la mia pagina non è ancora arrivata) -----
  FASI.arriva = function (ui, vm, cb) {
    var el = ui.t.el; testa(ui, "📖 Arriva il libretto…", "Passo " + (vm.giro + 1) + " di " + vm.L);
    ui.corpo.appendChild(el("div", { class: "td-mezzo" }, [el("div", { class: "td-icona", text: "📖" }), el("p", { class: "td-tit", text: "Arriva il libretto…" })]));
    // se il messaggio si è perso lo richiedo (ogni 3 secondi)
    ui.timer.push(setInterval(function () { cb.onChiediComp(); }, 3000));
    return { agg: function () {} };
  };
  // ----- guardo (arrivato tardi, chi guarda soltanto, chi è uscito) -----
  FASI.guarda = function (ui, vm, cb) {
    var el = ui.t.el;
    function tit(v) { var aspetto = (v.prossimi || []).some(function (p) { return p.id === cb.myId; }); testa(ui, aspetto ? "✋ Entri alla prossima partita" : "👀 Guardi", "Passo " + (v.giro + 1) + " di " + v.L); }
    tit(vm);
    var gr = griglia(ui, vm, cb);
    ui.corpo.appendChild(el("div", { class: "td-mezzo" }, [passi(ui, vm), el("p", { class: "td-tit", text: "Si stanno facendo i libretti" }),
      el("p", { class: "td-sotto", text: "Alla fine si sfogliano tutti insieme: lì vedi tutto anche tu." }), gr.box]));
    if (!ui.targa) faccineIn(ui, ui.corpo);
    var oro = orologio(ui, vm, cb, null);
    return { agg: function (v) { tit(v); gr.agg(v); oro.rifai(v); } };
  };
  // la griglia di chi gioca: gettone, nome, cosa fa
  function griglia(ui, vm, cb) {
    var el = ui.t.el, g = el("div", { class: "td-griglia" }), box = el("div", { class: "td-vetro td-gbox" }, [g]), c = {};
    function agg(v) {
      var st = v.stato || {}, ids = Object.keys(st);
      g.classList.toggle("tanti", ids.length > 8);
      ids.forEach(function (id, i) {
        var p = pDi(v, id); if (!p) return;
        var x = c[id];
        if (!x) { x = c[id] = { n: el("div", { class: "td-persona" }), g: gettone(ui.t, p, "g"), nm: el("span"), s: el("small") }; x.g.appendChild(el("i", { class: "ok", text: "✓" })); x.n.appendChild(x.g); x.n.appendChild(x.nm); x.n.appendChild(x.s); }
        if (g.children[i] !== x.n) g.insertBefore(x.n, g.children[i] || null);
        setTx(x.nm, (p.forse ? "📶 " : "") + (id === cb.myId ? "Tu" : p.nome));
        var f = !!st[id].f, tx = p.via ? "uscito" : f ? "fatto" : st[id].t === "d" ? "✏️ disegna" : "✍️ scrive";
        setTx(x.s, tx); x.s.className = p.via ? "" : f ? "verde" : "ambra";
        x.g.classList.toggle("spento", !f); x.n.classList.toggle("via", !!p.via);
      });
    }
    agg(vm);
    return { box: box, agg: agg };
  }
  function faccineIn(ui, dove) { var f = ui.t.faccine && ui.t.faccine(); if (f) { f.classList.add("td-faccine"); dove.appendChild(f); } return f; }

  // ----- la mia pagina: scrivo la frase, disegno, o scrivo cosa vedo -----
  FASI.fai = function (ui, vm, cb) {
    var el = ui.t.el, comp = cb.comp, mem = memoria(vm), bz = mem.bozza(comp.k + "|" + comp.pk) || {}, tuo = comp.tuo || {};
    var primo = comp.r === 0, disegno = comp.tipo === "d", mandato = false;
    ui.prontiF = null;
    testa(ui, primo ? "Si comincia!" : disegno ? "Disegna!" : "Cosa vedi?", "Passo " + (comp.r + 1) + " di " + comp.L);
    function invia(auto) {
      if (mandato) return;
      var m = { t: "pag", k: comp.k, pk: comp.pk };
      if (disegno) {
        var tr = ui.lav ? ui.lav.tratti() : [];
        m.d = tr.length ? codifica(semplifica(tr)) : "";
        mem.mio(vm.partita, comp.pk, m.d || null);
        comp.tuo = { d: m.d };
      } else { m.x = pulisci(campo.value); comp.tuo = { x: m.x }; }
      if (!auto) { FX.invio(); vibra(15); }
      mandato = true; ui.ritocco = false;
      if (window.__TD_PROVA) (window.__TD_FATTE = window.__TD_FATTE || []).push({ id: cb.myId, pk: comp.pk, d: disegno ? 1 : 0 });   // (solo nelle prove: chi ha fatto quale pagina)
      cb.onPagina(m);
    }
    var campo = null, piede = el("div", { class: "td-piede" }), fatto = el("button", { class: "td-tasto", text: "✓ Fatto", onclick: function () { invia(false); } });
    if (disegno) {
      // la frase da disegnare in alto, la lavagna più grande possibile, gli strumenti, «Fatto»
      var fr = el("div", { class: "td-foglietto td-daf" }, [el("small", { text: comp.tua ? "Disegna la tua frase" : "Disegna questa frase" }), el("span", { text: comp.ins ? comp.ins.x : "" })]);
      ui.lav = Lavagna(ui.t, { modifica: true, cambia: function (tr) { mem.salvaBozza(comp.k + "|" + comp.pk, { d: codifica(tr) }); } });
      var spazio = el("div", { class: "td-spazio" }, [ui.lav.box]);
      ui.corpo.appendChild(fr); ui.corpo.appendChild(spazio); ui.corpo.appendChild(ui.lav.strumenti);
      piede.appendChild(fatto); ui.corpo.appendChild(piede);
      var parti = bz.d || tuo.d; if (parti) ui.lav.carica(decodifica(parti));
      misuraLav(ui, spazio);
    } else {
      var ins = comp.ins;
      if (primo) {
        ui.corpo.appendChild(passi(ui, { L: comp.L, giro: comp.r }));
        ui.corpo.appendChild(el("p", { class: "td-tit", html: "Scrivi una frase<br>da far disegnare" }));
        ui.corpo.appendChild(el("p", { class: "td-sotto", text: "Più è strana, più si ride. La vede solo chi disegna dopo di te." }));
      } else if (ins && ins.t === "d") {
        ui.corpo.appendChild(el("p", { class: "td-tit td-tit-p", text: "Scrivi cosa c'è nel disegno" }));
        var sp = el("div", { class: "td-spazio" }), lav = Lavagna(ui.t, {});
        sp.appendChild(lav.box); ui.corpo.appendChild(sp); ui.lav = lav;
        lav.carica(decodifica(ins.d)); misuraLav(ui, sp);
      } else if (ins) {
        // (il disegno di prima è andato perso: si riscrive la frase con parole proprie)
        ui.corpo.appendChild(el("p", { class: "td-tit td-tit-p", text: "Il disegno si è perso: riscrivi questa frase con parole tue" }));
        ui.corpo.appendChild(el("div", { class: "td-foglietto" }, [el("span", { text: ins.x })]));
      }
      campo = el(primo ? "textarea" : "input", { class: "td-campo", maxlength: String(LUNGO), autocomplete: "off", autocorrect: "off", spellcheck: "false", enterkeyhint: "done",
        placeholder: primo ? "Un gatto che fa surf su una pizza…" : "Un… " });
      if (!primo) campo.type = "text";
      campo.value = bz.x != null ? bz.x : (tuo.x || "");
      var conta = el("div", { class: "td-conta" });
      function aggCampo() { setTx(conta, campo.value.length + " / " + LUNGO); fatto.disabled = !pulisci(campo.value); mem.salvaBozza(comp.k + "|" + comp.pk, { x: campo.value }); }
      campo.addEventListener("input", aggCampo);
      campo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); if (pulisci(campo.value)) invia(false); } });
      campo.addEventListener("focus", function () { setTimeout(function () { window.scrollTo(0, 0); }, 80); });
      var fog = el("div", { class: "td-foglietto td-scrivo" }, [el("small", { text: primo ? "La tua frase" : "Cosa vedi" }), campo, conta]);
      ui.corpo.appendChild(fog);
      if (primo) ui.corpo.appendChild(el("button", { class: "td-tasto v", text: "🎲 Non mi viene niente: dammi un'idea", onclick: function () { campo.value = idea(); aggCampo(); vibra(10); } }));
      var pr = pronti(ui, vm); ui.prontiF = pr;
      if (primo) ui.corpo.appendChild(pr.box);
      piede.appendChild(fatto); ui.corpo.appendChild(piede);
      aggCampo();
      if (primo) ui.corpo.classList.add("td-centrato");
    }
    var oro = orologio(ui, vm, cb, function () { invia(true); });
    FX.via();
    return { agg: function (v) { oro.rifai(v); if (ui.prontiF) ui.prontiF.agg(v); } };
  };
  // le idee: a caso, mai due volte di fila la stessa (le ultime 150 si ricordano su questo telefono)
  function idea() {
    var l = window.SG_TELEFONO_IDEE || ["Un gatto che fa surf su una pizza"], usate = leggi(MEM_IDEE, []);
    var libere = l.filter(function (x) { return usate.indexOf(x) < 0; }); if (!libere.length) { libere = l.slice(); usate = []; }
    var x = libere[rnd(libere.length)]; usate.push(x); if (usate.length > 150) usate = usate.slice(-150); scrivi(MEM_IDEE, usate);
    return x;
  }
  // la lavagna più grande che sta nello spazio (si rimisura quando cambia: tastiera, rotazione)
  function misuraLav(ui, spazio) {
    function m() { if (ui.lav && document.body.contains(spazio)) ui.lav.dimensiona(spazio.clientWidth, spazio.clientHeight); }
    if (window.ResizeObserver) { var ro = new ResizeObserver(m); ro.observe(spazio); ui.timer.push({ ro: ro }); }
    requestAnimationFrame(m); ui.timer.push(setTimeout(m, 300));
  }
  // ----- ho finito: aspetto gli altri (e posso ritoccare) -----
  FASI.fatto = function (ui, vm, cb) {
    var el = ui.t.el, comp = cb.comp, disegno = comp.tipo === "d";
    testa(ui, "Fatto!", "Passo " + (comp.r + 1) + " di " + comp.L);
    var chi = el("p", { class: "td-sotto" }), gr = griglia(ui, vm, cb);
    var rit = el("button", { class: "td-tasto v", text: disegno ? "✏️ Ritocca il mio disegno" : "✏️ Cambia la mia frase", onclick: function () {
      ui.ritocco = true; cb.onRiapri(comp.k); ui.kCorpo = null; aggiorna(ui, cb.vm, cb);
    } });
    ui.corpo.appendChild(el("div", { class: "td-mezzo" }, [passi(ui, { L: comp.L, giro: comp.r }), el("div", { class: "td-icona", text: "✅" }),
      el("p", { class: "td-tit", text: disegno ? "Il tuo disegno è partito" : comp.r === 0 ? "La tua frase è partita" : "La tua frase è partita" }), chi, gr.box, rit]));
    if (!ui.targa) faccineIn(ui, ui.corpo);
    function agg(v) {
      gr.agg(v);
      var st = v.stato || {}, mancano = Object.keys(st).filter(function (id) { var p = pDi(v, id); return !st[id].f && p && !p.via; }).map(function (id) { return nomeDi(v, id, cb, "te"); });
      setTx(chi, mancano.length ? "Aspettiamo " + elenco(mancano) + ". Appena finiscono tutti si va avanti, senza aspettare il tempo." : "Ci siete tutti: si passa il libretto!");
      rit.disabled = !mancano.length;
    }
    agg(vm);
    var oro = orologio(ui, vm, cb, null);
    return { agg: function (v) { oro.rifai(v); agg(v); } };
  };

  // ----- la rivelazione: il libretto si sfoglia pagina per pagina -----
  FASI.rivela = function (ui, vm, cb) {
    var el = ui.t.el, rv = vm.riv, mem = memoria(vm), io = pDi(vm, cb.myId), gioco = !!io && !io.via;
    var feed = el("div", { class: "td-feed" }), dentro = el("div", { class: "td-feed-in" });
    feed.appendChild(dentro);
    var fine = el("div", { class: "td-finelib", hidden: "hidden" });
    var reaz = el("div", { class: "td-reaz" }), bRea = [];
    var conto = el("div", { class: "td-avanti" });
    var pausa = cb.sonoHost ? el("button", { class: "td-pausa", "aria-label": "Pausa", text: "⏸", onclick: function () { cb.onPausa(); } }) : null;
    if (pausa) ui.destra.appendChild(pausa);
    ui.corpo.appendChild(feed); ui.corpo.appendChild(fine);
    if (gioco) ui.corpo.appendChild(reaz);
    ui.corpo.appendChild(conto);
    var voli = el("div", { class: "td-voli" }); ui.corpo.appendChild(voli);
    REAZ.forEach(function (e, i) {
      var b = el("button", { class: "td-r", onclick: function () {
        var cur = rv && rv.pag && rv.pag[Math.min(rv.p, rv.pag.length - 1)]; if (!cur) return;
        var ora = Date.now(); if (ora - (ui.ultimaR || 0) < 200) return; ui.ultimaR = ora;
        vibra(8); vola(i, true); cb.onRea(cur.pk, i);
      } }, [el("span", { text: e }), el("b")]);
      bRea.push(b); reaz.appendChild(b);
    });
    var voci = [], kStep = null, kConto = null, contoRea = {};
    function vola(e, mio) {
      var n = el("span", { class: "td-vola" + (mio ? " mio" : ""), text: REAZ[e] });
      n.style.left = (12 + Math.random() * 70) + "%"; n.style.setProperty("--dx", (Math.random() * 60 - 30) + "px");
      voli.appendChild(n); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1700);
    }
    function aggRea() {
      var cur = rv.pag[Math.min(rv.p, rv.pag.length - 1)], c = (cur && (contoRea[cur.pk] || (rv.rea || {})[cur.pk])) || [];
      bRea.forEach(function (b, i) { setTx(b.lastChild, c[i] ? String(c[i]) : ""); });
    }
    // una pagina del libretto nel feed: chi l'ha fatta e cosa (la frase o il disegno che si ridisegna)
    function voce(pg, j, anima) {
      var p = pDi(vm, pg.chi) || { nome: "?" }, nm = pg.chi === cb.myId ? "Tu" : p.nome;
      var v = el("div", { class: "td-voce" }), dx = el("div", { class: "td-voce-dx" });
      v.appendChild(gettone(ui.t, p)); v.appendChild(dx);
      if (pg.s) { dx.appendChild(el("div", { class: "td-chi", text: nm + (pg.t === "d" ? " non ha disegnato niente" : " non ha scritto niente") })); dx.appendChild(el("div", { class: "td-copre", text: "🤷 questa pagina si salta" })); return v; }
      if (pg.t === "s") {
        dx.appendChild(el("div", { class: "td-chi", text: j === 0 ? (pg.auto ? "🎲 " + nm + " non ha scritto: l'idea l'ha data il gioco" : nm + (pg.chi === cb.myId ? " hai scritto" : " ha scritto")) : nm + (pg.chi === cb.myId ? " hai capito" : " ha capito") }));
        dx.appendChild(el("div", { class: "td-foglietto td-fr", text: pg.x || "" }));
        return v;
      }
      dx.appendChild(el("div", { class: "td-chi", text: nm + (pg.chi === cb.myId ? " hai disegnato" : " ha disegnato") }));
      var d = (rv.dis || {})[pg.pk] || mem.visto(vm.partita, pg.pk);
      if (!d) { dx.appendChild(el("div", { class: "td-copre", text: pg.perso ? "🖼️ Questo disegno è andato perso" : "🖼️ Arriva il disegno…" })); v._pk = pg.pk; return v; }
      var lav = Lavagna(ui.t, {}); lav.box.classList.add("td-lav-feed"); dx.appendChild(lav.box);
      v._lav = lav; v._d = d;
      return v;
    }
    function misuraFeed() {
      var w = Math.min(250, Math.max(120, feed.clientWidth - 60)), h = Math.max(110, Math.min(Math.round(w * LH / LW), feed.clientHeight - 70));
      voci.forEach(function (v, i) { if (v._lav) { var vecchia = i < voci.length - 1; v._lav.dimensiona(vecchia ? Math.round(w * 0.62) : w, vecchia ? Math.round(h * 0.62) : h); } });
    }
    function step(v) {
      rv = v.riv;
      mem.vedi(vm.partita, rv.dis);
      var lb = rv.pag, fin = rv.fin, a = pDi(v, rv.a) || { nome: "?" };
      testa(ui, "📖 " + (rv.a === cb.myId ? "Il tuo libretto" : "Il libretto di " + a.nome), (rv.i + 1) + " di " + rv.nb + (fin ? " · finito" : ""));
      var ks = v.partita + "|" + rv.i + "|" + rv.p;
      if (ks !== kStep) {
        kStep = ks;
        if (!fin) {
          feed.hidden = false; fine.hidden = true; reaz.classList.remove("su");
          // le pagine che mancano nel feed (chi arriva a metà libretto le vede tutte, ferme)
          for (var j = voci.length; j < lb.length; j++) {
            var nuova = j === lb.length - 1, vc = voce(lb[j], j, nuova);
            voci.push(vc); dentro.appendChild(vc);
            if (vc._lav) {
              if (nuova && !ui.primoStep) vc._lav.anima(decodifica(vc._d), RIDISEGNO);
              else vc._lav.carica(decodifica(vc._d));
            }
            if (nuova) { vc.classList.add("nuova"); FX.pagina(); }
          }
          voci.forEach(function (x, i) { x.classList.toggle("vecchia", i < voci.length - 1); });
          requestAnimationFrame(misuraFeed);
        } else mostraFine(v);
        ui.primoStep = false;
        aggRea();
      }
      if (fin && ui.fineAgg) ui.fineAgg(v);
      // «Avanti ▶ 6» per chi tiene la partita (a zero va avanti da solo); gli altri «Pagina dopo tra 6…»
      var kc = ks + "|" + (rv.fermo ? "f" : "c" + rv.n) + "|" + v.rip;
      if (kc !== kConto) {
        kConto = kc; svuota(conto);
        if (pausa) setTx(pausa, rv.fermo ? "▶" : "⏸");
        var ultimo = fin && rv.i + 1 >= rv.nb, tx = ultimo ? "🏅 I premi ▶" : fin ? "Il prossimo ▶" : "Avanti ▶";
        if (cb.sonoHost) {
          var nn = rv.n, b = el("button", { class: "td-tasto", text: tx, onclick: function () { cb.onAvanti(nn); } });
          if (fin) conto.appendChild(el("button", { class: "td-tasto v td-foto", text: "📸 Foto", onclick: function () { fotoLibretto(ui.t, v, cb, rv.b); } }));
          conto.appendChild(b);
          if (!rv.fermo) ui.t.contoAvanti(b, rv.resta, function () { cb.onAvanti(nn); }, "tdv|" + kc);
        } else {
          if (fin) conto.appendChild(el("button", { class: "td-tasto v td-foto", text: "📸 Foto", onclick: function () { fotoLibretto(ui.t, v, cb, rv.b); } }));
          var p = el("p", { class: "td-conto" }); conto.appendChild(p);
          if (rv.fermo) setTx(p, "⏸ " + nomeDi(v, v.tiene, cb) + " ha messo in pausa");
          else ui.t.contoAvanti(p, rv.resta, null, "tdv|" + kc, ultimo ? "I premi tra " : fin ? "Il prossimo libretto tra " : "Pagina dopo tra ");
        }
      }
    }
    // la fine del libretto: «era partita così… ed è arrivata così», e la ⭐ al disegno più bello
    function mostraFine(v) {
      feed.hidden = true; fine.hidden = false; svuota(fine); reaz.classList.add("su");
      var lb = rv.pag, primo = lb[0], ult = null, pa = pDi(v, primo.chi) || { nome: "?" };
      for (var j = lb.length - 1; j > 0; j--) if (!lb[j].s) { ult = lb[j]; break; }
      var pu = ult ? pDi(v, ult.chi) || { nome: "?" } : null;
      fine.appendChild(el("div", { class: "td-etich" }, [gettone(ui.t, pa, "p"), document.createTextNode("Era partita così")]));
      fine.appendChild(el("div", { class: "td-foglietto td-fr", text: primo.x || "" }));
      var giri = lb.length - 1;
      fine.appendChild(el("div", { class: "td-freccia", text: "⬇ " + (giri === 1 ? "un passaggio" : giri + " passaggi") + " dopo ⬇" }));
      if (ult) {
        fine.appendChild(el("div", { class: "td-etich" }, [gettone(ui.t, pu, "p"), document.createTextNode("…ed è arrivata così")]));
        if (ult.t === "s") fine.appendChild(el("div", { class: "td-foglietto td-fr td-grande", text: ult.x || "" }));
        else { var dd = (rv.dis || {})[ult.pk] || mem.visto(v.partita, ult.pk); var cvu = el("canvas", { class: "td-cv td-ult" }); fine.appendChild(cvu); if (dd) requestAnimationFrame(function () { disegnoFermo(cvu, decodifica(dd), 150); }); }
      }
      FX.rullo(); FX.arrivo();
      // i disegni del libretto, piccoli: si tocca quello più bello (non il proprio)
      var dis = []; lb.forEach(function (pg, j) { if (pg.t === "d" && !pg.s && ((rv.dis || {})[pg.pk] || mem.visto(v.partita, pg.pk))) dis.push({ pg: pg, j: j }); });
      if (!dis.length) { ui.fineAgg = null; return; }
      var tit = el("p", { class: "td-sotto td-st-tit", text: gioco ? "⭐ Il disegno più bello? Tocca" : "⭐ Il disegno più bello" });
      var mini = el("div", { class: "td-mini" }), m = {};
      dis.forEach(function (x) {
        var cv = el("canvas", { class: "td-cv" }), s = el("span", { class: "td-stelle" }), mio = x.pg.chi === cb.myId;
        var bx = el("button", { class: "td-m" + (mio ? " mio" : ""), disabled: !gioco || mio ? "disabled" : null, onclick: function () { vibra(12); cb.onStella(rv.b, x.j); } }, [cv, s]);
        mini.appendChild(bx); m[x.j] = { b: bx, s: s, pg: x.pg };
        var d = (rv.dis || {})[x.pg.pk] || mem.visto(v.partita, x.pg.pk);
        requestAnimationFrame(function () { disegnoFermo(cv, decodifica(d), dis.length > 3 ? 70 : 88); });
      });
      fine.appendChild(tit); fine.appendChild(mini);
      ui.fineAgg = function (v2) {
        var r2 = v2.riv, cs = r2.stelle || {}, mie = (r2.mie || {})[cb.myId];
        Object.keys(m).forEach(function (j) {
          var p = pDi(v2, m[j].pg.chi) || { nome: "?" };
          setTx(m[j].s, (cs[j] ? "⭐ " + cs[j] + " · " : "") + (m[j].pg.chi === cb.myId ? "tu" : p.nome));
          m[j].b.classList.toggle("su", +j === mie);
        });
      };
    }
    ui.primoStep = true; ui.fineAgg = null;
    step(vm);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { misuraFeed(); }) : null; if (ro) { ro.observe(feed); ui.timer.push({ ro: ro }); }
    // i disegni che mi mancano (ho ricaricato): li chiedo a chi tiene la partita
    function chiediMancanti() {
      var ks = []; voci.forEach(function (x) { if (x._pk && !mem.visto(vm.partita, x._pk)) ks.push(x._pk); });
      if (ks.length && !cb.sonoHost && gioco) cb.onChiedi(ks);
    }
    ui.timer.push(setTimeout(chiediMancanti, 1200));
    return {
      agg: function (v) { vm = v; step(v); },
      vola: function (m) {
        var cur = rv.pag[Math.min(rv.p, rv.pag.length - 1)];
        var c = contoRea[m.pk] || ((rv.rea || {})[m.pk] || [0, 0, 0, 0, 0]).slice(); c[m.e] = m.c; contoRea[m.pk] = c;
        if (m.id !== cb.myId) vola(m.e, false);
        if (cur && cur.pk === m.pk) aggRea();
      },
      disegni: function () {
        // i disegni arrivati: al posto di «Arriva il disegno…»
        voci.forEach(function (x, i) {
          if (!x._pk) return; var d = mem.visto(vm.partita, x._pk); if (!d) return;
          var pg = rv.pag[i], nv = voce(pg, i, false); x.parentNode.replaceChild(nv, x); voci[i] = nv;
          if (nv._lav) nv._lav.carica(decodifica(nv._d));
        });
        voci.forEach(function (x, i) { x.classList.toggle("vecchia", i < voci.length - 1); });
        requestAnimationFrame(misuraFeed);
      }
    };
  };

  // =========================================================
  //  LA FOTO PER WHATSAPP: un libretto intero in un'immagine alta
  // =========================================================
  var SITO = "revelhouse.it";
  function fotoLibretto(t, vm, cb, b) {
    var lb = null, mem = memoria(vm);
    if (b && typeof b === "object") lb = b;
    else if (vm.riv && vm.riv.b === b) lb = { a: vm.riv.a, pag: vm.riv.pag };
    if (!lb) return;
    var W = 720, pad = 32, dw = 430, dh = Math.round(dw * LH / LW), cv = document.createElement("canvas"), c = cv.getContext("2d");
    function nomeP(id) { var p = pDi(vm, id); return p ? p.nome : "?"; }
    var font = '"SG Testo",system-ui,sans-serif';
    function righe(testo, max, f) {
      c.font = f; var w = String(testo || "").split(" "), r = [], cur = "";
      w.forEach(function (x) { var prova = cur ? cur + " " + x : x; if (c.measureText(prova).width > max && cur) { r.push(cur); cur = x; } else cur = prova; });
      if (cur) r.push(cur); return r;
    }
    var pezzi = [], y = 0;
    if (window.__TD_PROVA) window.__TD_WA = lb.pag.filter(function (pg) { return !pg.s; }).map(function (pg, j) { return { pk: pg.pk, nome: nomeP(pg.chi) }; });
    lb.pag.forEach(function (pg, j) {
      if (pg.s) return;
      if (pg.t === "s") { var rr = righe(pg.x, W - pad * 2 - 40, "800 34px " + font); pezzi.push({ pg: pg, j: j, h: 44 + rr.length * 44 + 36, rr: rr }); }
      else { var d = (vm.riv && vm.riv.dis || {})[pg.pk] || mem.visto(vm.partita, pg.pk); pezzi.push({ pg: pg, j: j, h: 44 + (d ? dh : 80) + 20, d: d }); }
    });
    var H = 110 + pezzi.reduce(function (s, x) { return s + x.h + 18; }, 0) + 70;
    cv.width = W; cv.height = H;
    var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#151a2e"); gr.addColorStop(1, "#0d1020"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = "#f4f5fb"; c.font = "800 38px " + font; c.textBaseline = "top";
    c.fillText("📖 Il libretto di " + nomeP(lb.a), pad, 36);
    c.fillStyle = "#ff6d97"; c.font = "800 24px " + font; c.textAlign = "right"; c.fillText("Revel House", W - pad, 46); c.textAlign = "left";
    y = 110;
    pezzi.forEach(function (x) {
      var pg = x.pg;
      c.fillStyle = "#a6acc8"; c.font = "800 24px " + font;
      c.fillText(nomeP(pg.chi) + (pg.t === "d" ? " ha disegnato" : x.j === 0 ? " ha scritto" : " ha capito"), pad, y);
      y += 40;
      if (pg.t === "s") {
        var hh = x.rr.length * 44 + 28;
        c.fillStyle = "#fff8ea"; tondo(c, pad, y, W - pad * 2, hh, 18); c.fill();
        if (x.j === lb.pag.length - 1) { c.strokeStyle = "#ff4f86"; c.lineWidth = 5; c.stroke(); }
        c.fillStyle = "#1b1d2e"; c.font = "800 34px " + font;
        x.rr.forEach(function (r, i) { c.fillText(r, pad + 20, y + 16 + i * 44); });
        y += hh + 18 + 8;
      } else {
        var x0 = Math.round((W - dw) / 2);
        if (x.d) { var tmp = document.createElement("canvas"); tmp.width = dw; tmp.height = dh; rendi(decodifica(x.d), tmp, dw, dh); c.save(); tondo(c, x0, y, dw, dh, 18); c.clip(); c.drawImage(tmp, x0, y); c.restore(); y += dh + 20 + 18; }
        else { c.fillStyle = "#a6acc8"; c.fillText("🖼️ (disegno non arrivato)", x0, y + 20); y += 80 + 18; }
      }
    });
    c.fillStyle = "#a6acc8"; c.font = "700 22px " + font; c.textAlign = "center";
    c.fillText(SITO + " · Telefono Disegnato", W / 2, H - 50);
    condividi(cv.toDataURL("image/png"), "libretto-" + nomeP(lb.a).replace(/[^A-Za-z0-9]+/g, "-").toLowerCase() + ".png", "📖 Il libretto di " + nomeP(lb.a) + " · Telefono Disegnato");
  }
  function tondo(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function condividi(url, nomeFile, testo) {
    try {
      var bin = atob(url.split(",")[1]), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var file = typeof File === "function" ? new File([arr], nomeFile, { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: testo + " · " + SITO }).catch(function () {}); return; }
    } catch (e) {}
    try { var a = document.createElement("a"); a.href = url; a.download = nomeFile; document.body.appendChild(a); a.click(); a.parentNode.removeChild(a); } catch (e2) {}
  }

  // =========================================================
  //  LA FINE: i premi, i libretti da rivedere e mandare, i tasti di fine del core
  // =========================================================
  function finale(t, vm, cb) {
    stile();
    // (niente punti: si gioca per ridere. La schermata sta tutta nel telefono piccolo, senza scorrere)
    var el = t.el, s = t.schermata({ icona: "🏅", titolo: "I premi" });
    s.classList.add("td-fine");
    var targa = !!t.guarda && !t.eliminazione, fac = targa ? null : t.faccine();
    if (targa) s.classList.add("td-fine-targa");
    var lista = el("div", { class: "td-premi" });
    (vm.premi || []).forEach(function (p) {
      var pp = pDi(vm, p.id) || { nome: p.nome };
      lista.appendChild(el("div", { class: "td-premio" + (p.id === cb.myId ? " tu" : "") }, [el("span", { class: "ic", text: p.ic }), gettone(t, pp),
        el("div", { class: "tx" }, [el("b", { text: p.tit + " · " + (p.id === cb.myId ? "tu" : pp.nome) }), el("small", { text: p.tx })])]));
    });
    if (!(vm.premi || []).length) lista.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Partita finita prima dei libretti: niente premi questa volta." }));
    s._contenuto.appendChild(lista);
    // i libretti da rivedere e mandare, sulla stessa riga delle faccine
    var riga = el("div", { class: "td-fine-riga" });
    if ((vm.libri || []).length) riga.appendChild(el("button", { class: "td-tasto v td-libri-btn", text: "📖 Rivedi i libretti", onclick: function () { galleria(t, vm, cb, s); } }));
    if (fac) { fac.classList.add("fine-faccine"); riga.appendChild(fac); }
    if (riga.firstChild) s._contenuto.appendChild(riga);
    if ((vm.premi || []).some(function (p) { return p.id === cb.myId; })) { FX.festa(); vibra([40, 60, 40]); }
    if (!(vm.players || []).some(function (p) { return p.id === cb.myId; })) s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: targa ? "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." : "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      if (!targa) s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
    // i disegni che mi mancano per la galleria (ho ricaricato durante la rivelazione): li chiedo
    var mem = memoria(vm), manca = [];
    (vm.libri || []).forEach(function (lb) { lb.pag.forEach(function (pg) { if (pg.t === "d" && !pg.s && !mem.visto(vm.partita, pg.pk)) manca.push(pg.pk); }); });
    if (manca.length && !cb.sonoHost && !t.guarda) { var i = 0; (function giro() { if (i >= manca.length) return; cb.onChiedi(manca.slice(i, i + 12)); i += 12; setTimeout(giro, 700); })(); }
    return s;
  }
  // tutti i libretti: si apre uno e lo si sfoglia fermo, col tasto per mandarlo
  function galleria(t, vm, cb, sFine) {
    stile();
    var el = t.el, mem = memoria(vm), o = el("div", { class: "td-gal oro g-telefono" }), sc = el("div", { class: "td-gal-in" });
    function chiudi() { clearInterval(tv); if (o.parentNode) o.parentNode.removeChild(o); }
    // la schermata dei premi non c'è più (Rivincita, Cambia gioco, Torna in Sala): la galleria si chiude da sola
    var tv = setInterval(function () { if (!sFine || !document.body.contains(sFine)) chiudi(); }, 500);
    var testa = el("div", { class: "td-gal-testa" }, [el("button", { class: "td-esci", text: "‹", "aria-label": "Chiudi", onclick: function () { if (aperto) { aperto = null; lista(); } else chiudi(); } }), el("b", { text: "📖 I libretti" })]);
    o.appendChild(testa); o.appendChild(sc);
    var aperto = null;
    function lista() {
      svuota(sc); sc.scrollTop = 0;
      (vm.libri || []).forEach(function (lb) {
        var p = pDi(vm, lb.a) || { nome: "?" }, pr = primaE(lb), ul = ultimaS(lb);
        sc.appendChild(el("button", { class: "td-gal-lib", onclick: function () { aperto = lb; libro(lb); } }, [gettone(t, p, "g"),
          el("div", { class: "tx" }, [el("b", { text: lb.a === cb.myId ? "Il tuo libretto" : "Il libretto di " + p.nome }), el("small", { text: (pr ? "«" + pr.x + "»" : "") + (ul && ul !== pr ? " → «" + ul.x + "»" : "") })]), el("span", { class: "fr", text: "›" })]));
      });
    }
    function libro(lb) {
      svuota(sc); sc.scrollTop = 0;
      lb.pag.forEach(function (pg, j) {
        var p = pDi(vm, pg.chi) || { nome: "?" }, nm = pg.chi === cb.myId ? "Tu" : p.nome, v = el("div", { class: "td-voce" }), dx = el("div", { class: "td-voce-dx" });
        v.appendChild(gettone(t, p)); v.appendChild(dx);
        if (pg.s) { dx.appendChild(el("div", { class: "td-chi", text: nm + " ha saltato" })); }
        else if (pg.t === "s") { dx.appendChild(el("div", { class: "td-chi", text: nm + (j ? " ha capito" : " ha scritto") })); dx.appendChild(el("div", { class: "td-foglietto td-fr", text: pg.x })); }
        else {
          dx.appendChild(el("div", { class: "td-chi", text: nm + " ha disegnato" }));
          var d = mem.visto(vm.partita, pg.pk);
          if (d) { var cv = el("canvas", { class: "td-cv" }); dx.appendChild(cv); requestAnimationFrame(function () { disegnoFermo(cv, decodifica(d), 220); }); }
          else dx.appendChild(el("div", { class: "td-copre", text: "🖼️ Arriva il disegno…" }));
        }
        sc.appendChild(v);
      });
      sc.appendChild(el("button", { class: "btn btn-primario", style: "margin:14px 0 8px", text: "📸 Manda su WhatsApp", onclick: function () { fotoLibretto(t, vm, cb, lb); } }));
    }
    lista();
    document.body.appendChild(o);
  }

  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Questo gioco si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.td-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:var(--o-fondo,#0d1020)}",
      ".schermata.td-piena>.testa,.schermata.td-piena>.piede{display:none}",
      ".schermata.td-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".td-scena{position:relative;height:var(--alt,100dvh);max-width:720px;margin:0 auto;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;color:var(--o-testo,#f4f5fb);user-select:none;-webkit-user-select:none;",
        "padding:calc(6px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));",
        "background:radial-gradient(90% 45% at 15% 0%,rgba(224,34,90,.18),transparent 70%),radial-gradient(80% 40% at 100% 18%,rgba(112,72,232,.18),transparent 70%),radial-gradient(90% 40% at 50% 105%,rgba(72,200,255,.10),transparent 70%)}",
      ".td-scena[data-modo=fatto] .td-corpo,.td-scena[data-modo=guarda] .td-corpo{padding-bottom:4px}",
      ".td-scena.td-con-targa{padding-bottom:calc(62px + env(safe-area-inset-bottom))}",
      ".schermata.td-fine-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
      ".td-barra{flex:none;display:flex;align-items:center;gap:8px;padding:2px 0 6px}",
      ".td-esci{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:var(--o-carta,rgba(30,36,62,.58));box-shadow:inset 0 0 0 1px var(--o-filo-oro,rgba(255,255,255,.16));color:inherit;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer;padding:0 0 3px}",
      ".td-centro{flex:1;min-width:0;text-align:center;line-height:1.2}",
      ".td-centro b{display:block;font-size:.9rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".td-centro small{display:block;color:var(--o-tenue,#a6acc8);font-weight:700;font-size:.72rem;margin-top:1px}",
      ".td-destra{flex:none;min-width:36px;display:flex;justify-content:flex-end}",
      ".td-tempo{min-width:60px;text-align:center;font-weight:800;font-size:.95rem;padding:7px 10px;border-radius:999px;background:var(--o-carta,rgba(30,36,62,.58));box-shadow:inset 0 0 0 1px var(--o-filo-oro,rgba(255,255,255,.16));font-variant-numeric:tabular-nums}",
      ".td-tempo.poco{background:var(--o-rosso,#d63c4a);box-shadow:none;color:#fff}",
      ".td-pausa{width:40px;height:36px;border-radius:999px;border:0;background:var(--o-carta,rgba(30,36,62,.58));box-shadow:inset 0 0 0 1px var(--o-filo-oro,rgba(255,255,255,.16));color:inherit;font:inherit;font-size:1rem;cursor:pointer}",
      ".td-corpo{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:9px;position:relative;overflow:hidden}",
      ".td-corpo.td-centrato{justify-content:center}",
      ".td-mezzo{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:12px;overflow:hidden}",
      ".td-icona{text-align:center;font-size:2.6rem;line-height:1}",
      ".td-tit{font-size:1.4rem;font-weight:800;line-height:1.15;text-align:center;margin:0}",
      ".td-tit-p{font-size:1.15rem}",
      ".td-sotto{font-size:.88rem;color:var(--o-tenue,#a6acc8);text-align:center;line-height:1.4;margin:0}",
      ".td-passi{display:flex;gap:4px;justify-content:center;flex:none}.td-passi i{width:20px;height:5px;border-radius:3px;background:rgba(255,255,255,.14)}.td-passi i.f{background:var(--o-oro,#ff4f86)}.td-passi i.o{background:#fff}",
      ".td-vetro{background:var(--o-carta,rgba(30,36,62,.58));border-radius:18px;box-shadow:var(--o-ombra),inset 0 0 0 1px var(--o-filo,rgba(255,255,255,.09))}",
      ".td-tasto{flex:none;width:100%;border:0;border-radius:16px;min-height:52px;display:flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:800;font-size:1.1rem;cursor:pointer;",
        "background:var(--o-tasto,linear-gradient(180deg,#e0225a,#c8174f));color:#fff;box-shadow:0 10px 24px -10px rgba(224,34,90,.75),inset 0 1px 0 rgba(255,255,255,.22);touch-action:manipulation}",
      ".td-tasto:disabled{opacity:.45}",
      ".td-tasto.v{background:var(--o-carta,rgba(30,36,62,.58));box-shadow:var(--o-ombra),inset 0 0 0 1px var(--o-filo-oro,rgba(255,255,255,.16));color:var(--o-testo,#f4f5fb);font-size:.95rem;min-height:46px}",
      ".td-tasto .conto-avanti{opacity:.85;font-weight:700;font-variant-numeric:tabular-nums}",
      ".td-piede{flex:none;display:flex;gap:8px}",
      ".td-foglietto{background:#fff8ea;color:#1b1d2e;border-radius:14px;padding:12px 14px;font-weight:800;font-size:1.2rem;line-height:1.3;box-shadow:0 12px 28px -12px rgba(0,0,0,.9),inset 0 -3px 0 rgba(0,0,0,.06);overflow-wrap:anywhere;user-select:text;-webkit-user-select:text}",
      ".td-foglietto small{display:block;font-size:.68rem;font-weight:800;letter-spacing:.08em;color:#8a7d64;margin-bottom:4px;text-transform:uppercase}",
      ".td-daf{flex:none;font-size:1.02rem;padding:8px 12px}",
      ".td-campo{display:block;width:100%;box-sizing:border-box;border:0;outline:none;background:transparent;color:#1b1d2e;font:inherit;font-weight:800;font-size:1.15rem;line-height:1.3;padding:2px 0;resize:none}",
      "textarea.td-campo{height:3.9em}",
      ".oro .td-foglietto .td-campo,.oro .td-foglietto .td-campo:focus{background:transparent;border:0;box-shadow:none;color:#1b1d2e;outline:none}",
      ".oro .td-foglietto .td-campo::placeholder{color:#b9ae96}",
      // ⌨️ la tastiera aperta (schermo basso): restano il foglietto, l'idea e «Fatto»
      "@media (max-height:520px){.td-scena[data-modo=fai] .td-passi,.td-scena[data-modo=fai] .td-sotto,.td-scena[data-modo=fai] .td-pronti{display:none}.td-scena[data-modo=fai] .td-tit{font-size:1.05rem}.td-scena[data-modo=fai] .td-tasto.v{min-height:38px}.td-scena[data-modo=fai] .td-tasto{min-height:44px}.td-corpo{gap:6px}}",
      "@media (max-height:400px){.td-scena[data-modo=fai] .td-tit,.td-scena[data-modo=fai] .td-tasto.v{display:none}}",
      ".td-campo::placeholder{color:#b9ae96}",
      ".td-conta{font-size:.72rem;color:#8a7d64;text-align:right;font-weight:700;margin-top:4px}",
      ".td-pronti{flex:none;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:18px;background:var(--o-carta,rgba(30,36,62,.58));box-shadow:inset 0 0 0 1px var(--o-filo,rgba(255,255,255,.09))}",
      ".td-pronti b{font-size:.84rem;white-space:nowrap}",
      ".td-fila{display:flex;gap:3px;flex-wrap:wrap;min-width:0}",
      ".td-gt{flex:none;position:relative;display:inline-block;width:34px;height:34px}",
      ".td-gt svg{display:block;width:100%;height:100%}",
      ".td-gt.p{width:24px;height:24px}.td-gt.g{width:50px;height:50px}",
      ".td-gt .ok{display:none;position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;border-radius:50%;background:var(--o-verde,#34d17a);color:#06210f;font-size:10px;font-style:normal;font-weight:900;place-items:center;box-shadow:0 0 0 2px var(--o-fondo,#0d1020)}",
      ".td-gt.p .ok{width:12px;height:12px;font-size:8px}",
      ".td-gt:not(.spento) .ok{display:grid}.td-gt.spento svg{opacity:.45}",
      ".td-gbox{padding:14px 8px;flex:none}",
      ".td-griglia{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 4px}",
      ".td-griglia.tanti .td-gt.g{width:40px;height:40px}",
      ".td-persona{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:.78rem;font-weight:800;min-width:0}",
      ".td-persona>span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".td-persona small{font-size:.68rem;color:var(--o-tenue,#a6acc8);font-weight:700}.td-persona small.verde{color:var(--o-verde,#34d17a)}.td-persona small.ambra{color:var(--o-ambra,#ffb547)}",
      ".td-persona.via{opacity:.45}",
      ".td-faccine{align-self:center;flex:none}",
      // la lavagna
      ".td-spazio{flex:1 1 auto;min-height:90px;display:flex;align-items:center;justify-content:center;overflow:hidden}",
      ".td-lav{position:relative;display:flex;justify-content:center}",
      ".td-cv{display:block;background:#fff;border-radius:14px;box-shadow:0 10px 26px rgba(0,0,0,.5);touch-action:none}",
      ".td-cv.matita{cursor:crosshair}.td-cv.matita.secchio{cursor:cell}",
      ".td-strumenti{flex:none;display:flex;flex-direction:column;gap:6px}",
      ".td-tavolozza{display:grid;grid-template-columns:repeat(8,minmax(0,1fr)) 40px 40px;gap:4px;align-items:center;width:100%;max-width:440px;margin:0 auto}",
      ".td-col{display:block;width:100%;max-width:28px;aspect-ratio:1/1;justify-self:center;border-radius:50%;border:2px solid rgba(255,255,255,.3);background:var(--c);cursor:pointer;padding:0;transition:transform .12s}",
      ".td-col.on{border-color:var(--o-oro,#ff4f86);transform:scale(1.22);box-shadow:0 0 0 2px var(--o-carta-piena,#151a2e),0 0 0 3.5px var(--o-oro,#ff4f86)}",
      ".td-attrezzi{display:flex;gap:4px;justify-content:center;align-items:center;max-width:440px;margin:0 auto;width:100%}",
      ".td-sep{flex:0 0 6px}",
      ".td-spess,.td-str{width:40px;height:30px;border-radius:12px;border:0;background:var(--o-carta,rgba(30,36,62,.58));box-shadow:inset 0 0 0 1px var(--o-filo-oro,rgba(255,255,255,.16));color:var(--o-testo,#fff);font-size:1rem;cursor:pointer;flex:0 0 auto;display:flex;align-items:center;justify-content:center;padding:0}",
      ".td-attrezzi .td-spess,.td-attrezzi .td-str{flex:1 1 0;min-width:0;max-width:42px;height:34px}",
      ".td-str:disabled{opacity:.35}",
      ".td-spess.on,.td-gomma.on,.td-modo.on{background:var(--o-carta-viva,rgba(224,34,90,.16));box-shadow:inset 0 0 0 2px var(--o-oro,#ff4f86)}",
      ".td-spess i{display:block;border-radius:50%;background:var(--c,#1d1d27);box-shadow:0 0 0 1px var(--o-tenue,#a6acc8)}",
      ".td-spess.s0 i{width:3px;height:3px}.td-spess.s1 i{width:6px;height:6px}.td-spess.s2 i{width:10px;height:10px}.td-spess.s3 i{width:15px;height:15px}.td-spess.s4 i{width:22px;height:22px}",
      // la rivelazione
      ".td-feed{flex:1 1 auto;min-height:0;overflow:hidden;position:relative;-webkit-mask-image:linear-gradient(transparent,#000 60px);mask-image:linear-gradient(transparent,#000 60px)}",
      ".td-feed[hidden],.td-finelib[hidden]{display:none}",
      ".td-feed-in{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:10px}",
      ".td-voce{display:flex;gap:9px;align-items:flex-start;transition:opacity .4s,transform .4s;transform-origin:left bottom}",
      ".td-voce.vecchia{opacity:.55}",
      ".td-voce.nuova{animation:tdEntra .45s ease}",
      "@keyframes tdEntra{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}",
      ".td-voce-dx{flex:1;min-width:0}",
      ".td-chi{font-size:.72rem;font-weight:800;color:var(--o-tenue,#a6acc8);margin:0 0 3px 2px}",
      ".td-fr{font-size:1.05rem;padding:9px 13px;border-radius:4px 14px 14px 14px}",
      ".td-voce:not(.vecchia) .td-fr{font-size:1.18rem}",
      ".td-copre{border-radius:4px 14px 14px 14px;padding:12px 14px;background:repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 10px,rgba(255,255,255,.03) 10px 20px);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.2);font-weight:800;font-size:.92rem;color:var(--o-tenue,#a6acc8)}",
      ".td-lav-feed{justify-content:flex-start}",
      ".td-reaz{flex:none;display:flex;gap:6px}",
      ".td-r{flex:1;height:44px;border-radius:14px;border:0;background:var(--o-carta,rgba(30,36,62,.58));box-shadow:inset 0 0 0 1px var(--o-filo-oro,rgba(255,255,255,.16));display:flex;align-items:center;justify-content:center;gap:3px;font:inherit;font-size:1.35rem;cursor:pointer;touch-action:manipulation;color:inherit}",
      ".td-r:active{transform:scale(.92)}.td-r b{font-size:.72rem;color:var(--o-tenue,#a6acc8);font-weight:800}",
      ".td-avanti{flex:none;display:flex;gap:8px;align-items:center;justify-content:center;min-height:52px}",
      ".td-avanti .td-foto{flex:0 0 auto;width:110px;min-height:52px}",
      ".td-conto{margin:0;font-weight:800;font-size:.86rem;color:var(--o-tenue,#a6acc8);flex:1;text-align:center}",
      ".td-voli{position:absolute;left:0;right:0;bottom:110px;height:0;pointer-events:none;z-index:5}",
      ".td-vola{position:absolute;bottom:0;font-size:2rem;animation:tdVola 1.6s ease-out forwards;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))}",
      ".td-vola.mio{font-size:2.3rem}",
      "@keyframes tdVola{0%{opacity:0;transform:translate(0,0) scale(.6)}12%{opacity:1;transform:translate(0,-30px) scale(1.1)}100%{opacity:0;transform:translate(var(--dx,0),-260px) scale(1)}}",
      ".td-finelib{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:8px;overflow:hidden}",
      ".td-etich{display:flex;align-items:center;gap:7px;font-size:.74rem;font-weight:800;color:var(--o-tenue,#a6acc8);letter-spacing:.06em;text-transform:uppercase}",
      ".td-freccia{align-self:center;font-weight:800;color:var(--o-oro-testo,#ff6d97);font-size:.8rem}",
      ".td-grande{font-size:1.5rem!important;padding:14px 16px!important;box-shadow:0 0 0 3px var(--o-oro,#ff4f86),0 16px 40px -10px rgba(224,34,90,.7)!important;animation:tdArriva .6s .5s both}",
      "@keyframes tdArriva{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}",
      ".td-ult{align-self:center;animation:tdArriva .6s .5s both}",
      ".td-st-tit{color:var(--o-testo,#f4f5fb);font-weight:800;margin-top:4px}",
      ".td-mini{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}",
      ".td-m{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:none;padding:0;color:inherit;font:inherit;cursor:pointer}",
      ".td-m .td-cv{border-radius:10px;box-shadow:0 6px 16px rgba(0,0,0,.45)}",
      ".td-m.su .td-cv{box-shadow:0 0 0 3px #ffc247,0 8px 20px rgba(0,0,0,.5)}",
      ".td-m:disabled{cursor:default}.td-m.mio .td-cv{opacity:.8}",
      ".td-stelle{font-size:.72rem;font-weight:800;color:#ffc247;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      // la fine
      ".td-premi{display:flex;flex-direction:column;gap:6px}",
      ".td-premio{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:18px;background:var(--o-carta,rgba(30,36,62,.58));box-shadow:var(--o-ombra),inset 0 0 0 1px var(--o-filo-oro,rgba(255,255,255,.16))}",
      ".td-premio.tu{box-shadow:inset 0 0 0 1.5px rgba(255,194,71,.6),var(--o-ombra)}",
      ".td-premio .ic{font-size:1.5rem;width:30px;text-align:center;flex:none}",
      ".td-premio .tx{flex:1;min-width:0}.td-premio .tx b{display:block;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.td-premio .tx small{display:block;color:var(--o-tenue,#a6acc8);font-size:.76rem;font-weight:700;line-height:1.25;overflow-wrap:anywhere}",
      ".schermata.td-fine>.contenuto{padding-bottom:6px}",   // (il cerchietto delle faccine sporge di 3 px: senza, i premi scorrerebbero)
      ".td-fine-riga{display:flex;align-items:center;gap:8px;margin-top:10px}",
      ".td-fine-riga .td-libri-btn{flex:1 1 auto;width:auto;min-height:46px}",
      ".td-fine-riga .fine-faccine{flex:none;margin:0}",
      ".td-gal{position:fixed;inset:0;z-index:60;background:var(--o-fondo,#0d1020);display:flex;flex-direction:column;color:var(--o-testo,#f4f5fb)}",
      ".td-gal-testa{flex:none;display:flex;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;font-size:1.05rem}",
      ".td-gal-in{flex:1;min-height:0;overflow-y:auto;padding:4px 12px calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}",
      ".td-gal-lib{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;border:0;text-align:left;color:inherit;font:inherit;cursor:pointer;background:var(--o-carta,rgba(30,36,62,.58));box-shadow:var(--o-ombra),inset 0 0 0 1px var(--o-filo-oro,rgba(255,255,255,.16))}",
      ".td-gal-lib .tx{flex:1;min-width:0}.td-gal-lib b{display:block}.td-gal-lib small{display:block;color:var(--o-tenue,#a6acc8);font-size:.8rem;font-weight:700;line-height:1.3}",
      ".td-gal-lib .fr{font-size:1.5rem;opacity:.6}",
      ".td-gal .td-voce{align-items:flex-start}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Telefono Disegnato", icona: "📞", tema: "oro",
    descrizione: "Scrivi una frase strana, il prossimo la disegna, quello dopo indovina cosa vede… e alla fine si ride di com'è arrivata.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    modi: [], soloOnline: true,
    postiOnline: MAX,
    ritardatari: RITARDATARI,
    riprende: true,
    riserva: true,
    riassunto: function (imp) { var r = RITMI[imp.ritmo] || RITMI.normale; return "Ritmo " + ({ svelto: "svelto", normale: "normale", calmo: "con calma" }[imp.ritmo] || "normale") + " · " + r.d + " secondi per disegnare"; },
    regole: [
      "Ognuno scrive una <b>frase strana</b>. Il libretto passa al prossimo, che la <b>disegna</b>. Quello dopo vede <b>solo il disegno</b> e scrive cosa ci vede. Poi si disegna di nuovo, e così via.",
      "Si gioca <b>tutti insieme</b>, ognuno su un libretto diverso: appena hanno finito tutti si va avanti, senza aspettare il tempo. Non sai cosa scrivere? <b>🎲 Dammi un'idea</b>.",
      "Alla fine si <b>sfogliano i libretti</b> pagina per pagina: i disegni si ridisegnano da soli, e si scopre chi li ha fatti. Ridete, reagite 😂 e date la <b>⭐ al disegno più bello</b>.",
      "Niente punti: a fine partita i <b>premi</b> (🎨 Picasso, 😂 il libretto più bello, 🔨 il Sabotatore, 🔍 il Detective) e le foto dei libretti da mandare su WhatsApp."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, pr = leggi("sg-telefono-regole", {}) || {};
      dove.ritmo = RITMI[pr.ritmo] ? pr.ritmo : "normale";
      box.appendChild(el("div", { class: "etichetta", text: "Ritmo" }));
      var g = el("div", { class: "modo-griglia", style: "display:grid;gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))" });
      [["svelto", "⚡ Svelto", "1 minuto per disegnare"], ["normale", "Normale", "80 secondi per disegnare"], ["calmo", "🐢 Con calma", "2 minuti per disegnare"]].forEach(function (x) {
        var b = el("button", { class: "modo-chip" + (x[0] === dove.ritmo ? " attiva" : ""), style: "justify-content:center;flex-direction:column", onclick: function () {
          dove.ritmo = x[0]; scrivi("sg-telefono-regole", { ritmo: x[0] }); [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: x[1] }), el("div", { class: "ms", text: x[2] })]);
        g.appendChild(b);
      });
      box.appendChild(g);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);
      return host(t);
    }
  });
  // per le prove: le regole senza grafica
  window.SG_TD_PROVA = { schema: schema, chiFa: chiFa, libroDi: libroDi, codifica: codifica, decodifica: decodifica, semplifica: semplifica, somiglia: somiglia, calcolaPremi: calcolaPremi, MAXP: MAXP };
})();
