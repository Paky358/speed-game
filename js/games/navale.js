/* =========================================================
   GIOCO — "Battaglia Navale" (regole classiche)
   Griglia 10×10, flotta: Portaerei(5), Corazzata(4), Incrociatore(3),
   Sommergibile(3), Cacciatorpediniere(2). A turno si spara una cella:
   acqua / colpito / colpito e affondato. Vince chi affonda tutta la
   flotta avversaria. Un colpo per turno, poi passa (come l'originale).
   Regola facoltativa "all'italiana": le navi non si toccano, nemmeno in
   diagonale (e intorno a una nave affondata il mare si scopre da solo).
   Modi: contro il Bot, oppure online (ognuno dal suo telefono).
   Online l'HOST tiene la partita vera (tutte e due le flotte) e manda a
   tutti una "foto" trattenuta coi soli colpi: chi si ricollega o ricarica
   la pagina si rimette in pari da solo; la flotta dell'ospite torna solo a lui.
   ========================================================= */
(function () {
  "use strict";
  var N = 10;
  var FLOTTA = [
    { nome: "Portaerei", len: 5 },
    { nome: "Corazzata", len: 4 },
    { nome: "Incrociatore", len: 3 },
    { nome: "Sommergibile", len: 3 },
    { nome: "Cacciatorpediniere", len: 2 }
  ];
  var NTOT = FLOTTA.length;
  var LET = "ABCDEFGHIJ".split(""); // lettere per le RIGHE (a sinistra); numeri 1-10 per le COLONNE (in alto)
  var VUOTO = new Array(N * N + 1).join("0");

  // ---------- utilità griglia ----------
  function matrice(v) { var m = []; for (var y = 0; y < N; y++) { m[y] = []; for (var x = 0; x < N; x++) m[y][x] = v; } return m; }
  function dentro(x, y) { return x >= 0 && x < N && y >= 0 && y < N; }
  // la nave ci sta? (staccate = le navi non si toccano, nemmeno in diagonale)
  function liberoPer(mappa, x, y, len, oriz, staccate) {
    for (var k = 0; k < len; k++) {
      var cx = x + (oriz ? k : 0), cy = y + (oriz ? 0 : k);
      if (!dentro(cx, cy) || mappa[cy][cx] >= 0) return false;
      if (staccate) for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) if (dentro(cx + dx, cy + dy) && mappa[cy + dy][cx + dx] >= 0) return false;
    }
    return true;
  }
  function poni(stato, idx, f, x, y, oriz) {
    var celle = [];
    for (var k = 0; k < f.len; k++) { var cx = x + (oriz ? k : 0), cy = y + (oriz ? 0 : k); stato.mappa[cy][cx] = idx; celle.push({ x: cx, y: cy }); }
    stato.navi[idx] = { nome: f.nome, len: f.len, oriz: !!oriz, celle: celle, colpite: celle.map(function () { return false; }), affondata: false };
  }
  function statoVuoto() { return { mappa: matrice(-1), navi: [], sparato: matrice(false), intorno: matrice(false) }; }
  function flottaCasuale(staccate) {
    for (var giro = 0; giro < 60; giro++) {
      var st = statoVuoto(), tutte = true;
      FLOTTA.forEach(function (f, idx) {
        var ok = false, tent = 0;
        while (!ok && tent < 400) {
          tent++;
          var oriz = Math.random() < 0.5;
          var x = Math.floor(Math.random() * (oriz ? N - f.len + 1 : N));
          var y = Math.floor(Math.random() * (oriz ? N : N - f.len + 1));
          if (liberoPer(st.mappa, x, y, f.len, oriz, staccate)) { poni(st, idx, f, x, y, oriz); ok = true; }
        }
        if (!ok) tutte = false;
      });
      if (tutte) return st;
    }
    return flottaCasuale(false);
  }
  // la flotta come "posizioni" (per mandarla in rete) e ritorno
  function posa(st) { return st ? st.navi.map(function (n) { return { x: n.celle[0].x, y: n.celle[0].y, o: n.oriz ? 1 : 0 }; }) : null; }
  function dallaPosa(p, staccate) {
    if (!Array.isArray(p) || p.length !== NTOT) return null;
    var st = statoVuoto();
    for (var i = 0; i < NTOT; i++) {
      var q = p[i] || {}, x = +q.x, y = +q.y, o = !!q.o;
      if (x !== Math.floor(x) || y !== Math.floor(y) || !liberoPer(st.mappa, x, y, FLOTTA[i].len, o, staccate)) return null;
      poni(st, i, FLOTTA[i], x, y, o);
    }
    return st;
  }
  // applica un colpo alla flotta "st"; ritorna { e:"acqua|colpito|affondato|gia", nome?, persa }
  function applicaColpo(st, x, y, staccate) {
    if (st.sparato[y][x]) return { e: "gia" };
    st.sparato[y][x] = true;
    var idx = st.mappa[y][x];
    if (idx < 0) return { e: "acqua", persa: false };
    var nave = st.navi[idx];
    for (var k = 0; k < nave.celle.length; k++) if (nave.celle[k].x === x && nave.celle[k].y === y) nave.colpite[k] = true;
    if (!nave.colpite.every(Boolean)) return { e: "colpito", persa: false };
    nave.affondata = true;
    if (staccate) nave.celle.forEach(function (c) {   // all'italiana: intorno alla nave affondata è tutto mare
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var cx = c.x + dx, cy = c.y + dy;
        if (dentro(cx, cy) && st.mappa[cy][cx] < 0 && !st.sparato[cy][cx]) { st.sparato[cy][cx] = true; st.intorno[cy][cx] = true; }
      }
    });
    return { e: "affondato", nome: nave.nome, persa: st.navi.every(function (nn) { return nn.affondata; }) };
  }
  // quello che si vede di una flotta: 0 da scoprire, 1 acqua, 2 colpito, 3 affondato, 4 mare scoperto da solo
  function campoStr(st) {
    if (!st) return VUOTO;
    var s = "";
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if (!st.sparato[y][x]) s += "0";
      else if (st.intorno[y][x]) s += "4";
      else { var k = st.mappa[y][x]; s += k < 0 ? "1" : (st.navi[k].affondata ? "3" : "2"); }
    }
    return s;
  }
  function affondate(st) { return FLOTTA.map(function (f, i) { return st && st.navi[i] && st.navi[i].affondata ? 1 : 0; }); }
  function contaGiu(a) { return (a || []).filter(Boolean).length; }
  // per disegnare le navi come scafi: per ogni casella "sh sh-h sh-a" (prua), "sh-m" (in mezzo), "sh-b" (poppa)
  function scafi(st) {
    var o = []; for (var i = 0; i < N * N; i++) o.push("");
    if (st) st.navi.forEach(function (n) {
      n.celle.forEach(function (c, k) { o[c.y * N + c.x] = "sh " + (n.oriz ? "sh-h" : "sh-v") + " sh-" + (k === 0 ? "a" : k === n.celle.length - 1 ? "b" : "m"); });
    });
    return o;
  }
  function fmtN(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  // ---------- la partita (la tiene chi gioca col Bot, o l'host online) ----------
  var gSeq = 0;
  function statVuota() { return { colpi: 0, colpiAsegno: 0, colpiAcqua: 0, naviAffondate: 0, serie: 0, serieColpiMax: 0, primoColpoAsegno: false }; }
  function nuovaPartita(regole) {
    return { g: (Date.now() % 1000000) * 10 + (++gSeq % 10), fase: "piazza", regole: regole, flotte: [null, null], tocca: 0, n: 0, vince: -1,
      ultimo: null, avviso: null, tavolino: null, stat: [statVuota(), statVuota()] };
  }
  // "chi" (0 o 1) spara in x,y: ritorna l'esito, o null se il colpo non vale
  function sparaP(P, chi, x, y) {
    if (P.fase !== "battaglia" || P.tocca !== chi || !dentro(x, y)) return null;
    var st = P.flotte[1 - chi]; if (!st || st.sparato[y][x]) return null;
    var e = applicaColpo(st, x, y, P.regole.staccate);
    var s = P.stat[chi];
    s.colpi++;
    if (e.e === "acqua") { s.colpiAcqua++; s.serie = 0; }
    else { s.colpiAsegno++; s.serie++; if (s.serie > s.serieColpiMax) s.serieColpiMax = s.serie; if (s.colpi === 1) s.primoColpoAsegno = true; if (e.e === "affondato") s.naviAffondate++; }
    P.n++;
    P.ultimo = { chi: chi, x: x, y: y, e: e.e };
    if (e.e === "affondato") P.avviso = { n: P.n, chi: chi, nome: e.nome };
    if (e.persa) { P.fase = "fine"; P.vince = chi; }
    else P.tocca = 1 - chi;
    return e;
  }
  function tiroACaso(P, chi) {
    var st = P.flotte[1 - chi], l = [];
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (!st.sparato[y][x]) l.push({ x: x, y: y });
    return l[Math.floor(Math.random() * l.length)];
  }
  // la "foto" della partita: solo i colpi, MAI dove sono le navi (si svelano solo a partita finita)
  function vmPartita(P) {
    var f = P.flotte, fine = P.fase === "fine";
    return { g: P.g, fase: P.fase, regole: P.regole, tocca: P.tocca, n: P.n, vince: P.vince, ultimo: P.ultimo, avviso: P.avviso, tavolino: P.tavolino,
      campi: [campoStr(f[0]), campoStr(f[1])], aff: [affondate(f[0]), affondate(f[1])], pronti: [!!f[0], !!f[1]],
      stat: fine ? P.stat : null, svela: fine ? [posa(f[0]), posa(f[1])] : null };
  }
  // dalla foto, quello che vede il giocatore "me" (0 o 1) col suo schermo
  function vista(vm, me, mio, nomeAvv, botto) {
    var avv = 1 - me;
    var V = { mio: vm.fase === "battaglia" && vm.tocca === me, suAvv: vm.campi[avv], suMe: vm.campi[me], mieNavi: mio,
      affAvv: vm.aff[avv], affMie: vm.aff[me], ultimo: null, avviso: null, tempo: null, mira: null };
    if (vm.ultimo) V.ultimo = { mio: vm.ultimo.chi === me, i: vm.ultimo.y * N + vm.ultimo.x };
    if (vm.avviso && vm.avviso.n === vm.n) V.avviso = { key: vm.g + "-" + vm.n, txt: vm.avviso.chi === me ? "💥 Colpito e affondato! " + vm.avviso.nome : "☠️ Ti hanno affondato: " + vm.avviso.nome };
    if (vm.fase === "battaglia" && vm.regole && vm.regole.tempo) V.tempo = { key: vm.g + "-" + vm.n, sec: vm.regole.tempo };
    V.testo = V.mio ? "🎯 Tocca a te — <b>spara!</b>" : (botto ? "🤖 Spara " + esc(nomeAvv) + "…" : "⏳ Spara " + esc(nomeAvv) + "…");
    return V;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // il Bot di questa partita: quello deciso dal core (torneo a eliminazione) o uno dei bot fissi, scelto dal livello
  // (nei tasti si dice "Bot"; in partita ha il suo nome). escludi = i nomi di chi gioca
  function botDi(imp, liv, escludi) {
    if (imp && imp.bot && imp.bot.nome) return imp.bot;
    var b = SG.bot && SG.bot.prendi ? SG.bot.prendi(1, { livello: liv, escludi: escludi })[0] : null;
    return b || { nome: "Bot", omino: null, bot: true };
  }

  // ---------- bot ----------
  // campo: quello che il Bot vede della tua flotta (stringa come campoStr); restanti: lunghezze delle navi ancora a galla
  function botSceglie(campo, restanti, liv) {
    function v(x, y) { return dentro(x, y) ? campo.charAt(y * N + x) : "x"; }
    function caso(a) { return a[Math.floor(Math.random() * a.length)]; }
    var ignote = [], feriti = [], i;
    for (i = 0; i < N * N; i++) { var c = campo.charAt(i); if (c === "0") ignote.push(i); else if (c === "2") feriti.push(i); }
    if (!ignote.length) return null;
    var scelta;
    if (liv === "facile") scelta = caso(ignote);
    else if (liv === "medio") {
      // segue la nave colpita: prima lungo la linea dei colpi (due in fila), poi le caselle accanto
      var linea = [], vicini = [];
      feriti.forEach(function (j) {
        var x = j % N, y = Math.floor(j / N);
        [[1, 0], [0, 1]].forEach(function (d) {
          if (v(x - d[0], y - d[1]) !== "2" && v(x + d[0], y + d[1]) !== "2") return;
          [-1, 1].forEach(function (s) {
            var k = 1; while (v(x + s * k * d[0], y + s * k * d[1]) === "2") k++;
            var cx = x + s * k * d[0], cy = y + s * k * d[1];
            if (v(cx, cy) === "0") linea.push(cy * N + cx);
          });
        });
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { if (v(x + d[0], y + d[1]) === "0") vicini.push((y + d[1]) * N + x + d[0]); });
      });
      scelta = linea.length ? caso(linea) : vicini.length ? caso(vicini) : caso(ignote);
    } else {
      // difficile: per ogni casella conta in quanti modi ci starebbero le navi rimaste (e preferisce quelle vicino ai colpi)
      var peso = []; for (i = 0; i < N * N; i++) peso.push(0);
      restanti.forEach(function (len) {
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) [true, false].forEach(function (oriz) {
          var cop = 0, celle = [];
          for (var k = 0; k < len; k++) {
            var cx = x + (oriz ? k : 0), cy = y + (oriz ? 0 : k), q = v(cx, cy);
            if (q !== "0" && q !== "2") return;
            if (q === "2") cop++;
            celle.push(cy * N + cx);
          }
          if (feriti.length && !cop) return;
          var w = feriti.length ? Math.pow(10, cop) : 1;
          celle.forEach(function (q2) { if (campo.charAt(q2) === "0") peso[q2] += w; });
        });
      });
      var max = 0, migliori = [];
      ignote.forEach(function (q) { if (peso[q] > max) { max = peso[q]; migliori = [q]; } else if (peso[q] === max && max > 0) migliori.push(q); });
      scelta = migliori.length ? caso(migliori) : caso(ignote);
    }
    return { x: scelta % N, y: Math.floor(scelta / N) };
  }

  // I progressi si registrano una volta alla fine di ogni partita, solo sul profilo di questo telefono.
  var navaleSalvate = {};
  function salvaStatNavale(t, esito, dati, modo, liv, chiave) {
    try {
      if (t.prova || (t.linkParams && t.linkParams.prova)) return;
      if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      if (!dati || !chiave || navaleSalvate[chiave]) return;
      navaleSalvate[chiave] = true;
      var st = SGNube.statGioco ? (SGNube.statGioco("navale") || {}) : {};
      var x = { partite: 1, colpi: dati.colpi, colpiAsegno: dati.colpiAsegno, colpiAcqua: dati.colpiAcqua,
        naviAffondate: dati.naviAffondate, primiColpiAsegno: dati.primoColpoAsegno ? 1 : 0 };
      if (esito) {
        x.vittorie = 1;
        if (modo === "bot") x["vittorie" + (liv === "difficile" ? "Difficile" : liv === "medio" ? "Medio" : "Facile")] = 1;
        if (modo === "online") x.vittorieOnline = 1;
      } else x.sconfitte = 1;
      if (modo === "online") x.partiteOnline = 1;
      var incr = []; Object.keys(x).forEach(function (k) { if (x[k]) incr.push([k, x[k]]); });
      // le serie "di fila" si toccano solo nel loro modo: giocare in un altro modo non le azzera
      var massimi = [["serieColpiMax", dati.serieColpiMax || 0]], ora = [];
      if (modo === "bot" && liv === "difficile") { var sd = esito ? (st.serieDifOra || 0) + 1 : 0; massimi.push(["serieDifficileMax", sd]); ora.push(["serieDifOra", sd]); }
      if (modo === "online") { var so = esito ? (st.serieOnlineOra || 0) + 1 : 0; massimi.push(["serieOnlineMax", so]); ora.push(["serieOnlineOra", so]); }
      SGNube.salvaProgressi(null, "navale", incr, massimi, ora);
    } catch (e) {}
  }

  // ---------- suoni ----------
  // vibra = true solo quando è la risposta a un tuo tocco (il tuo tiro); i colpi che ricevi non fanno vibrare
  function suono(e, vibra) {
    if (vibra) try { if (navigator.vibrate) navigator.vibrate(e === "affondato" ? [0, 30, 40, 40] : e === "colpito" ? 25 : 8); } catch (x) {}
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime;
      if (e === "acqua" || e === "gia") { // splash: rumore breve filtrato
        var dur = 0.22, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), d = buf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        var src = ctx.createBufferSource(); src.buffer = buf;
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
        var g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t + dur);
      } else { // boom
        var o = ctx.createOscillator(), gg = ctx.createGain();
        o.type = "square"; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(e === "affondato" ? 40 : 70, t + (e === "affondato" ? 0.5 : 0.28));
        gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(0.4, t + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + (e === "affondato" ? 0.55 : 0.3));
        o.connect(gg); gg.connect(ctx.destination); o.start(t); o.stop(t + 0.6);
      }
    } catch (x) {}
  }

  // ---------- stile ----------
  function stile() {
    if (document.getElementById("sg-navale-css")) return;
    var s = document.createElement("style"); s.id = "sg-navale-css";
    s.textContent = [
      // schermo intero, niente scorrimento: le misure seguono l'altezza vera del telefono (--alt)
      ".schermata.nav-piena{height:var(--alt,100dvh);min-height:0;overflow:hidden;padding-bottom:calc(10px + env(safe-area-inset-bottom));" +
        "--navW:min(calc(100vw - 32px),380px,calc(var(--alt,100dvh) * .52));--navM:min(calc(100vw - 168px),240px,calc(var(--alt,100dvh) * .31))}",
      ".schermata.nav-piena>.contenuto{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}",
      ".schermata.nav-piena>.piede{margin-top:8px}",
      ".schermata.nav-piena>.piede:empty{display:none}",
      ".nav-scena{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}",
      ".nav-stato{width:100%;box-sizing:border-box;padding:2px 46px;text-align:center;font-weight:800;font-size:1rem;line-height:1.25;min-height:1.3em}",
      ".nav-rete{font-size:.74rem;color:#ffd43b;text-align:center;min-height:0}",
      ".nav-rete:empty{display:none}",
      ".nav-tempo{width:var(--navW);height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;visibility:hidden}",
      ".nav-tempo.on{visibility:visible}",
      ".nav-tempo>i{display:block;height:100%;background:linear-gradient(90deg,#ff6b6b,#ffd43b);transform-origin:left center}",
      ".nav-wrap{position:relative}",
      ".nav-board{display:grid;grid-template-columns:14px repeat(10,1fr);gap:2px;width:var(--navW);padding:5px;box-sizing:border-box;border-radius:12px;background:rgba(4,20,34,.45);box-shadow:inset 0 0 0 1px rgba(143,208,255,.12)}",
      ".nav-board.nav-mini{width:var(--navM);grid-template-columns:11px repeat(10,1fr);gap:1px;padding:4px}",
      ".nav-mini .nav-c{font-size:.55rem;border-radius:3px}",
      ".nav-mini .nav-lab{font-size:.5rem}",
      ".nav-lab{display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:800;color:rgba(180,214,240,.72);line-height:1.2}",
      ".nav-c{position:relative;aspect-ratio:1;border-radius:4px;background:#123a54;display:flex;align-items:center;justify-content:center;font-size:.82rem;line-height:1;-webkit-tap-highlight-color:transparent;border:1px solid rgba(255,255,255,.05);box-sizing:border-box;user-select:none;-webkit-user-select:none}",
      ".nav-c.mare{background:radial-gradient(120% 120% at 30% 20%,#1b5b7e,#0e3a52)}",
      ".nav-c.sparabile{cursor:pointer;background:radial-gradient(120% 120% at 30% 20%,#2a7bad,#0f4f73);box-shadow:inset 0 0 0 1px rgba(143,208,255,.28)}",
      ".nav-c.sparabile:active{transform:scale(.88)}",
      ".nav-c.acqua{background:#0c3247;color:#8fd0ff}",
      ".nav-c.intorno{background:#0a2c3f;border-color:transparent}",
      ".nav-c.colpito{background:radial-gradient(circle at 50% 38%,#ff7a7a,#e03131);color:#fff;font-weight:900}",
      ".nav-c.affondato{background:#6e0f14;color:#fff;font-weight:900}",
      ".nav-c.mira{background:#e8a90c;box-shadow:inset 0 0 0 2px #ffe066}",
      ".nav-c.svela{background:linear-gradient(180deg,rgba(198,208,220,.55),rgba(109,120,135,.55));border:1px dashed rgba(255,255,255,.5)}",
      // navi come SCAFI: acciaio + estremità arrotondate (prua/poppa); l'ombra colma lo spazio tra le celle così lo scafo è continuo
      ".nav-c.sh{border:0;z-index:1;background:linear-gradient(180deg,#c6d0dc,#7a8796 52%,#515b6a);box-shadow:0 0 0 2px #6d7887,inset 0 1px 0 rgba(255,255,255,.45)}",
      ".nav-mini .nav-c.sh{box-shadow:0 0 0 1px #6d7887,inset 0 1px 0 rgba(255,255,255,.45)}",
      ".nav-c.sh.shx{background:linear-gradient(180deg,#ffa3a3,#e03131);box-shadow:0 0 0 2px #c92a2a,inset 0 1px 0 rgba(255,255,255,.3);color:#fff;font-weight:900}",
      ".nav-c.sh.shg{background:linear-gradient(180deg,#8a2a2e,#4a0c10);box-shadow:0 0 0 2px #4a0c10;color:#ffb3b3;font-weight:900}",
      ".sh-h.sh-a{border-top-left-radius:48%;border-bottom-left-radius:48%}",
      ".sh-h.sh-b{border-top-right-radius:48%;border-bottom-right-radius:48%}",
      ".sh-v.sh-a{border-top-left-radius:48%;border-top-right-radius:48%}",
      ".sh-v.sh-b{border-bottom-left-radius:48%;border-bottom-right-radius:48%}",
      ".nav-c.ante{background:#2f9e57;outline:2px solid #8ce99a;outline-offset:-2px;z-index:2}",
      ".nav-c.antebad{background:#7a2020;outline:2px solid #ff8787;outline-offset:-2px;z-index:2}",
      // l'ultimo colpo: un anello che si allarga e sparisce (solo transform/opacity)
      ".nav-c.ult{z-index:3}",
      ".nav-c.ult::after{content:'';position:absolute;inset:-3px;border:2px solid #ffe066;border-radius:6px;pointer-events:none;animation:navUlt 1.1s ease-out 2 forwards}",
      "@keyframes navUlt{0%{transform:scale(1.6);opacity:0}30%{transform:scale(1);opacity:1}100%{transform:scale(1);opacity:.85}}",
      ".nav-c.botta{animation:navBotta .32s ease-out}",
      "@keyframes navBotta{0%{transform:scale(1.35)}100%{transform:scale(1)}}",
      // scritta grande "colpito e affondato": sta sopra il campo, non sposta niente
      ".nav-avviso{position:absolute;left:50%;top:42%;z-index:6;max-width:94%;box-sizing:border-box;text-align:center;font-weight:800;font-size:1rem;padding:9px 14px;border-radius:14px;" +
        "background:linear-gradient(90deg,#e8590c,#f59f00);color:#fff;box-shadow:0 6px 22px rgba(0,0,0,.45);pointer-events:none;opacity:0;transform:translate(-50%,-50%) scale(.8);transition:opacity .2s,transform .22s}",
      ".nav-avviso.on{opacity:1;transform:translate(-50%,-50%) scale(1)}",
      ".nav-avviso.contro{background:linear-gradient(90deg,#862e9c,#c2255c)}",
      // in basso: la tua flotta piccola e, di fianco, le navi nemiche
      ".nav-basso{display:flex;gap:10px;align-items:center;width:var(--navW)}",
      ".nav-pann{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:.74rem}",
      ".nav-pt{font-weight:800;color:rgba(255,255,255,.75);font-size:.72rem}",
      ".nav-pn{display:flex;align-items:center;gap:5px;height:12px}",
      ".nav-pn.giu{opacity:.45}",
      ".nav-boat{display:inline-block;height:9px;border-radius:5px;background:linear-gradient(180deg,#c6d0dc,#6d7887);box-shadow:inset 0 1px 0 rgba(255,255,255,.45)}",
      ".nav-boat.giu{background:#e03131}",
      ".nav-pc{font-weight:800}",
      // piazzamento
      ".nav-tit{text-align:center;font-weight:800;font-size:1rem;min-height:1.3em;padding:0 42px}",
      ".nav-sub{text-align:center;font-size:.76rem;color:rgba(255,255,255,.7);min-height:2.4em;max-width:var(--navW);line-height:1.2}",
      ".nav-flotta{display:flex;gap:8px;justify-content:center;align-items:center;min-height:22px}",
      ".nav-nave{display:flex;align-items:center;padding:5px 7px;border-radius:999px;background:rgba(255,255,255,.06)}",
      ".nav-nave.fatta{background:rgba(105,219,124,.18)}",
      ".nav-nave.corr{background:rgba(255,212,59,.2);box-shadow:inset 0 0 0 1px #ffd43b}",
      ".nav-tasti{display:flex;gap:6px;justify-content:center;width:var(--navW)}",
      ".nav-tasti .btn{flex:1 1 0;min-width:0;min-height:42px;padding:8px 4px;font-size:.82rem;margin:0}",
      ".nav-tasti.via{visibility:hidden}",
      // fine partita
      ".nav-esito{display:flex;align-items:center;justify-content:center;gap:10px;font-weight:900;font-size:1.3rem}",
      ".nav-esito span{font-size:1.9rem}",
      ".nav-leg{font-size:.72rem;color:rgba(255,255,255,.65);text-align:center}",
      // chi guarda: i due campi affiancati, piccoli
      ".nav-guarda{display:flex;gap:6px;justify-content:center;align-items:flex-start;width:100%}",
      ".nav-guarda-lato{flex:1 1 0;min-width:0;max-width:260px;border-radius:12px;padding:3px;transition:box-shadow .2s}",
      ".nav-guarda-lato.bersaglio{box-shadow:0 0 0 2px #ffd43b}",
      ".nav-guarda-lato .nav-sub{min-height:0;margin:2px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".nav-board.nav-g{width:100%;grid-template-columns:9px repeat(10,1fr);gap:1px;padding:3px}",
      ".nav-g .nav-c{font-size:.55rem;border-radius:2px}",
      ".nav-g .nav-lab{font-size:.45rem}"
    ].join("");
    document.head.appendChild(s);
  }

  // quadratini che rappresentano la lunghezza di una nave
  function quadretti(el, len, giu) { return el("span", { class: "nav-boat" + (giu ? " giu" : ""), style: "width:" + (len * 8 + 2) + "px" }); }

  // un tabellone 10×10 costruito UNA volta: poi si cambiano solo le caselle che cambiano (niente lampeggio)
  function Griglia(el, tipo, onTap) {
    var g = el("div", { class: "nav-board" + (tipo ? " " + tipo : "") }), celle = [];
    g.appendChild(el("div", { class: "nav-lab" }));                                                 // angolo vuoto
    for (var c = 0; c < N; c++) g.appendChild(el("div", { class: "nav-lab", text: String(c + 1) })); // numeri in alto (colonne)
    for (var y = 0; y < N; y++) {
      g.appendChild(el("div", { class: "nav-lab", text: LET[y] }));                                 // lettere a sinistra (righe)
      for (var x = 0; x < N; x++) { var d = el("div", { class: "nav-c mare" }); d._i = y * N + x; d._cls = "nav-c mare"; d._txt = ""; celle.push(d); g.appendChild(d); }
    }
    if (onTap) g.addEventListener("click", function (e) {
      var d = e.target; while (d && d !== g && d._i == null) d = d.parentNode;
      if (d && d._i != null) onTap(d._i % N, Math.floor(d._i / N));
    });
    return { nodo: g, set: function (i, cls, txt) { var d = celle[i]; if (d._cls !== cls) { d.className = cls; d._cls = cls; } if (d._txt !== txt) { d.textContent = txt; d._txt = txt; } } };
  }
  // una casella del campo avversario (cosa ho scoperto)
  function clsColpo(v) { return v === "1" ? "acqua" : v === "2" ? "colpito" : v === "3" ? "affondato" : v === "4" ? "intorno" : "mare"; }
  function txtColpo(v) { return v === "1" ? "•" : (v === "2" || v === "3") ? "✕" : ""; }
  // una casella della mia flotta (navi + colpi ricevuti)
  function clsMia(sc, v) {
    if (sc) return "nav-c " + sc + (v === "3" ? " shg" : v === "2" ? " shx" : "");
    return "nav-c " + (v === "1" ? "acqua" : v === "4" ? "intorno" : "mare");
  }

  // finestra di conferma al centro dello schermo (come il resto dell'app); il "sì" si attiva dopo un attimo
  function conferma(t, domanda, siTesto, siFn) {
    if (document.querySelector(".conferma-sfondo")) return;
    var el = t.el, sfondo = null;
    function chiudi() { if (sfondo && sfondo.parentNode) sfondo.parentNode.removeChild(sfondo); }
    var si = el("button", { class: "btn btn-rosso", text: siTesto, disabled: "disabled", onclick: function () { chiudi(); siFn(); } });
    sfondo = el("div", { class: "conferma-sfondo", onclick: function (e) { if (e.target === sfondo) chiudi(); } }, [
      el("div", { class: "conferma-box", role: "dialog" }, [
        el("div", { class: "conferma-domanda", text: domanda }),
        el("div", { class: "conferma-tasti" }, [el("button", { class: "btn btn-primario", text: "Resta", onclick: chiudi }), si])
      ])
    ]);
    document.body.appendChild(sfondo);
    setTimeout(function () { si.removeAttribute("disabled"); }, 600);
  }

  // regole della partita dalle impostazioni
  function regoleDa(imp, online) {
    imp = imp || {};
    return { staccate: imp.staccate === true, tempo: online ? (imp.tempo == null ? 40 : (+imp.tempo || 0)) : 0 };
  }
  function testoRegole(r) {
    return (r && r.staccate ? "🇮🇹 Le navi non si toccano" : "Le navi si possono toccare") + " · " + (r && r.tempo ? "⏱️ " + r.tempo + " secondi per sparare" : "tempo libero per sparare");
  }

  SG.registra({
    id: "navale",
    nome: "Battaglia Navale",
    icona: "🚢",
    descrizione: "La battaglia navale classica: sistemi la tua flotta e affondi quella dell'avversario. Contro il Bot o online, uno contro uno.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 2, etichettaGiocatori: "👥 1–2 giocatori",   // (sullo stesso telefono: contro il Bot; online in due)
    postiOnline: 2,   // online si gioca in due: gli altri guardano
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il Bot", sotto: "Giochi da solo contro il Bot" }],
    regole: [
      "Ognuno ha una griglia <b>10×10</b> e una <b>flotta</b>: Portaerei (5), Corazzata (4), Incrociatore (3), Sommergibile (3), Cacciatorpediniere (2).",
      "Prima <b>sistemi le tue navi</b>: tocchi il mare per vedere dove va la nave, la giri, poi la confermi (o premi <b>A caso</b>). Non si possono sovrapporre.",
      "Poi a turno <b>spari</b> una casella della griglia avversaria: <b>acqua</b>, <b>colpito</b> oppure <b>colpito e affondato</b> quando becchi tutta la nave.",
      "Un colpo per turno, poi tocca all'altro. <b>Vince chi affonda tutta la flotta</b> avversaria. Alla fine vedi dove erano le navi che non hai trovato.",
      "Con la regola <b>all'italiana</b> le navi non si toccano, nemmeno in diagonale: quando ne affondi una, il mare intorno si scopre da solo.",
      "Modi: <b>contro il Bot</b> oppure <b>online</b> (ognuno dal suo telefono). Online ognuno vede solo le sue navi."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio"; dove.staccate = false; dove.tempo = 40;
      var bBot, bOnl, boxDiff, boxTempo, notaOnline;
      function sel(m) {
        dove.modo = m;
        bBot.className = "modo-chip" + (m === "bot" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        boxDiff.hidden = (m !== "bot");
        boxTempo.hidden = (m !== "online");
        notaOnline.hidden = (m !== "online");
      }
      // una riga di scelte (chip): la prima volta segna quella di partenza
      function scelte(titolo, voci, chiave) {
        var w = el("div", {});
        w.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var riga = el("div", { style: "display:flex;gap:8px" });
        voci.forEach(function (d) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === d[0] ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
            dove[chiave] = d[0]; [].forEach.call(riga.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [el("div", { class: "mt", text: d[1] })]);
          riga.appendChild(b);
        });
        w.appendChild(riga);
        return w;
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { sel("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro il Bot" }), el("div", { class: "ms", text: "Da solo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      if (!aiuti.modo) {   // (se "come giocare" l'avete già scelto prima, qui non si sceglie)
        box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
        box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      }
      boxDiff = scelte("Bravura del Bot", [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]], "difficolta");
      box.appendChild(boxDiff);
      box.appendChild(scelte("Le navi si possono toccare?", [[false, "Sì"], [true, "No, all'italiana"]], "staccate"));
      boxTempo = scelte("Tempo per sparare", [[0, "Libero"], [20, "20 s"], [40, "40 s"]], "tempo");
      box.appendChild(boxTempo);

      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri la stanza e invita l'altro col tasto 📤: entra dal suo telefono (gli altri guardano)."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
      sel(aiuti.modo || "bot");
      if (aiuti.modo) notaOnline.hidden = true;
    },

    avvia: function (t) {
      stile();
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return t.linkParams.guarda ? guardaNavale(t, t.linkParams.stanza) : ospiteNavale(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostNavale(t);
      return controBot(t, imp.difficolta || "medio", regoleDa(imp, false));
    }
  });

  // =========================================================
  //  LA SCHERMATA DI GIOCO (una sola, aggiornata a pezzi)
  //  opt: { onEsci(), nomeAvv(), bot (true = l'avversario è il Bot) }
  //  piazza(o) → sistemare le navi; battaglia(V) → i due campi; fine(F) → com'è finita
  // =========================================================
  function Plancia(t, opt) {
    var el = t.el, s = null, mostrata = false, spento = false, fase = null, U = {}, timers = [];
    // la schermata non c'è più (si è usciti, o il core ha mostrato altro): da qui in poi non si disegna più niente
    function vivo() {
      if (spento) return false;
      if (mostrata && s && !document.body.contains(s)) { spegni(); return false; }
      return true;
    }
    function spegni() { spento = true; timers.forEach(clearTimeout); timers = []; }
    function dopo(fn, ms) { var id = setTimeout(function () { timers = timers.filter(function (x) { return x !== id; }); if (vivo()) fn(); }, ms); timers.push(id); return id; }
    function schermo(nuova) {   // cambio di fase: si cambia solo il contenuto, la schermata resta
      if (!s) { s = t.schermata({ titolo: "Battaglia Navale", indietro: function () { opt.onEsci(); } }); s.classList.add("nav-piena"); }
      timers.forEach(clearTimeout); timers = [];
      fase = nuova; U = {};
      t.svuota(s._contenuto); t.svuota(s._piede);
      if (!mostrata) { t.mostra(s); mostrata = true; if (!document.body.contains(s)) spegni(); }
    }

    // ---------- piazzamento (con ANTEPRIMA: prima vedi dove va la nave, poi confermi) ----------
    // o: { staccate, onPronto(stato), stato (già pronta: si aspetta solo l'altro), attesa (testo d'attesa) }
    function piazza(o) {
      if (!vivo()) return;
      schermo("piazza");
      var pz = U.pz = { st: o.stato || statoVuoto(), prossima: o.stato ? NTOT : 0, oriz: true, ante: null, fatto: !!o.stato, o: o };
      U.tit = el("div", { class: "nav-tit" });
      U.sub = el("div", { class: "nav-sub" });
      U.gr = Griglia(el, "", toccaCella);
      U.navi = FLOTTA.map(function (f) { return el("div", { class: "nav-nave" }, [quadretti(el, f.len, false)]); });
      U.bRuota = el("button", { class: "btn btn-fantasma", onclick: ruota });
      U.bCaso = el("button", { class: "btn btn-fantasma", text: "🎲 A caso", onclick: aCaso });
      U.bTogli = el("button", { class: "btn btn-fantasma", text: "↩️ Togli", onclick: togli });
      U.tasti = el("div", { class: "nav-tasti" }, [U.bRuota, U.bCaso, U.bTogli]);
      U.bVai = el("button", { class: "btn btn-primario", onclick: vai });
      U.rete = el("div", { class: "nav-rete" });
      s._contenuto.appendChild(el("div", { class: "nav-scena" }, [U.tit, U.sub, U.gr.nodo, el("div", { class: "nav-flotta" }, U.navi), U.tasti, U.rete]));
      s._piede.appendChild(U.bVai);
      aggPiazza();
    }
    function anteCelle() {   // le caselle dell'anteprima e se la nave ci sta
      var pz = U.pz; if (!pz || !pz.ante || pz.prossima >= NTOT) return null;
      var f = FLOTTA[pz.prossima], set = {};
      for (var k = 0; k < f.len; k++) set[(pz.ante.y + (pz.oriz ? 0 : k)) * N + pz.ante.x + (pz.oriz ? k : 0)] = true;
      return { set: set, ok: liberoPer(pz.st.mappa, pz.ante.x, pz.ante.y, f.len, pz.oriz, pz.o.staccate) };
    }
    function aggancia() {   // se la nave uscirebbe dal mare, l'anteprima si sposta indietro da sola
      var pz = U.pz, f = FLOTTA[pz.prossima]; if (!pz.ante || !f) return;
      if (pz.oriz) pz.ante.x = Math.min(pz.ante.x, N - f.len); else pz.ante.y = Math.min(pz.ante.y, N - f.len);
    }
    function toccaCella(x, y) {
      var pz = U.pz; if (fase !== "piazza" || !pz || pz.fatto || pz.prossima >= NTOT) return;
      var a = anteCelle();
      if (a && a.ok && a.set[y * N + x]) return metti();   // ritocco la nave in anteprima = la metto lì
      pz.ante = { x: x, y: y }; aggancia(); aggPiazza();
    }
    function metti() {
      var pz = U.pz, a = anteCelle(); if (!a || !a.ok) return;
      poni(pz.st, pz.prossima, FLOTTA[pz.prossima], pz.ante.x, pz.ante.y, pz.oriz); pz.prossima++; pz.ante = null;
      suono("colpito", true); aggPiazza();
    }
    function ruota() { var pz = U.pz; if (!pz || pz.fatto) return; pz.oriz = !pz.oriz; aggancia(); aggPiazza(); }
    function aCaso() { var pz = U.pz; if (!pz || pz.fatto) return; pz.st = flottaCasuale(pz.o.staccate); pz.prossima = NTOT; pz.ante = null; aggPiazza(); }
    function togli() {
      var pz = U.pz; if (!pz || pz.fatto || pz.prossima === 0) return;
      pz.prossima--; pz.st.navi[pz.prossima].celle.forEach(function (c) { pz.st.mappa[c.y][c.x] = -1; });
      pz.st.navi.length = pz.prossima; pz.ante = null; aggPiazza();
    }
    function vai() {
      var pz = U.pz; if (!pz || pz.fatto) return;
      if (pz.prossima < NTOT) { metti(); return; }
      pz.fatto = true; aggPiazza();
      pz.o.onPronto(pz.st);
    }
    function aggPiazza() {
      if (!vivo() || fase !== "piazza") return;
      var pz = U.pz, a = anteCelle(), sc = scafi(pz.st), f = FLOTTA[pz.prossima];
      for (var i = 0; i < N * N; i++) {
        var cls = sc[i] ? "nav-c " + sc[i] : "nav-c mare";
        if (a && a.set[i]) cls = "nav-c " + (a.ok ? "ante" : "antebad");
        U.gr.set(i, cls, "");
      }
      U.navi.forEach(function (n, k) { var c = "nav-nave" + (k < pz.prossima ? " fatta" : k === pz.prossima ? " corr" : ""); if (n.className !== c) n.className = c; });
      if (pz.fatto) {
        U.tit.textContent = "Flotta pronta! ⚓";
        U.sub.textContent = pz.o.attesa || ("Aspetto che " + opt.nomeAvv() + " finisca di sistemare le navi…");
      } else if (pz.prossima >= NTOT) {
        U.tit.textContent = "Flotta pronta!";
        U.sub.textContent = "Puoi ancora cambiare (Togli, A caso), poi premi Pronto.";
      } else {
        U.tit.textContent = "Sistema le tue navi";
        U.sub.textContent = !a ? "Tocca il mare dove mettere la " + f.nome + " (" + f.len + " caselle)."
          : a.ok ? f.nome + ": ritocca la nave verde (o premi Metti qui) per metterla lì."
          : "Qui la " + f.nome + " non ci sta" + (pz.o.staccate ? " (le navi non si toccano)" : "") + ": sposta o gira la nave.";
      }
      U.tasti.className = "nav-tasti" + (pz.fatto ? " via" : "");
      U.bRuota.textContent = pz.oriz ? "↕️ Gira in verticale" : "↔️ Gira in orizzontale";
      U.bRuota.disabled = pz.prossima >= NTOT;
      U.bTogli.disabled = pz.prossima === 0;
      if (pz.fatto) { U.bVai.textContent = "⏳ Aspetto " + opt.nomeAvv() + "…"; U.bVai.disabled = true; }
      else if (pz.prossima >= NTOT) { U.bVai.textContent = "✅ Pronto, si combatte!"; U.bVai.disabled = false; }
      else if (a && a.ok) { U.bVai.textContent = "✅ Metti qui la " + f.nome; U.bVai.disabled = false; }
      else { U.bVai.textContent = "Tocca il mare per mettere la nave"; U.bVai.disabled = true; }
    }
    function staPiazzando() { return fase === "piazza" && U.pz && !U.pz.fatto; }

    // ---------- battaglia ----------
    function costruisciBattaglia(onSpara) {
      schermo("battaglia");
      U.onSpara = onSpara;
      U.stato = el("div", { class: "nav-stato" });
      U.rete = el("div", { class: "nav-rete" });
      U.barra = el("i", {});
      U.tempo = el("div", { class: "nav-tempo" }, [U.barra]);
      U.att = Griglia(el, "", function (x, y) { if (U.V && U.V.mio && U.V.suAvv.charAt(y * N + x) === "0" && U.onSpara) U.onSpara(x, y); });
      U.avviso = el("div", { class: "nav-avviso" });
      U.mia = Griglia(el, "nav-mini", null);
      U.nemiche = FLOTTA.map(function (f) { var b = quadretti(el, f.len, false); return { riga: el("div", { class: "nav-pn" }, [b]), b: b }; });
      U.conta = el("div", { class: "nav-pc" });
      var pann = el("div", { class: "nav-pann" }, [el("div", { class: "nav-pt", text: "Navi nemiche" })]
        .concat(U.nemiche.map(function (q) { return q.riga; }))
        .concat([el("div", { class: "nav-pt", style: "margin-top:6px", text: "◀ La tua flotta" }), U.conta]));
      s._contenuto.appendChild(el("div", { class: "nav-scena" }, [U.stato, U.rete, U.tempo, el("div", { class: "nav-wrap" }, [U.att.nodo, U.avviso]), el("div", { class: "nav-basso" }, [U.mia.nodo, pann])]));
      U.prevA = null; U.prevM = null;
    }
    // V: vedi vista() (+ mira: casella del mio colpo appena partito)
    function battaglia(V, onSpara) {
      if (!vivo()) return;
      if (fase !== "battaglia") costruisciBattaglia(onSpara);
      if (onSpara) U.onSpara = onSpara;
      U.V = V;
      U.stato.innerHTML = V.mira != null ? "🎯 Fuoco!…" : V.testo;
      var sc = scafi(V.mieNavi), i, v, cls;
      for (i = 0; i < N * N; i++) {
        v = V.suAvv.charAt(i);
        cls = "nav-c " + (v === "0" ? (V.mira === i ? "mira" : V.mio ? "sparabile" : "mare") : clsColpo(v));
        if (V.ultimo && V.ultimo.mio && V.ultimo.i === i) cls += " ult";
        if (U.prevA && U.prevA.charAt(i) !== v) cls += " botta";
        U.att.set(i, cls, txtColpo(v));
        v = V.suMe.charAt(i);
        cls = clsMia(sc[i], v);
        if (V.ultimo && !V.ultimo.mio && V.ultimo.i === i) cls += " ult";
        if (U.prevM && U.prevM.charAt(i) !== v) cls += " botta";
        U.mia.set(i, cls, sc[i] ? (v === "2" || v === "3" ? "✕" : "") : (v === "1" ? "•" : ""));
      }
      U.prevA = V.suAvv; U.prevM = V.suMe;
      U.nemiche.forEach(function (q, k) { var giu = !!(V.affAvv && V.affAvv[k]); var c = "nav-pn" + (giu ? " giu" : ""); if (q.riga.className !== c) { q.riga.className = c; q.b.className = "nav-boat" + (giu ? " giu" : ""); } });
      U.conta.textContent = (NTOT - contaGiu(V.affMie)) + "/" + NTOT + " a galla";
      // la scritta "affondato": compare solo quando cambia, poi sparisce da sola
      if (V.avviso && V.avviso.key !== U.avvKey) {
        U.avvKey = V.avviso.key; U.avviso.textContent = V.avviso.txt;
        U.avviso.className = "nav-avviso on" + (V.avviso.txt.indexOf("☠️") === 0 ? " contro" : "");
        clearTimeout(U.avvT); U.avvT = dopo(function () { U.avviso.className = U.avviso.className.replace(" on", ""); }, 1900);
      }
      // la barra del tempo per sparare (solo transform)
      if (!V.tempo) { U.tempo.className = "nav-tempo"; U.tempoKey = null; }
      else if (V.tempo.key !== U.tempoKey) {
        U.tempoKey = V.tempo.key; U.tempo.className = "nav-tempo on";
        U.barra.style.transition = "none"; U.barra.style.transform = "scaleX(1)";
        void U.barra.offsetWidth;
        U.barra.style.transition = "transform " + V.tempo.sec + "s linear"; U.barra.style.transform = "scaleX(0)";
      }
    }

    // ---------- fine ----------
    // F: { key, vinto, sotto, suAvv, naviAvv (posizioni), statTxt, tasti: [nodi], nomeAvv }
    function fine(F) {
      if (!vivo()) return;
      if (fase === "fine" && U.fineKey === F.key) return;
      schermo("fine");
      U.fineKey = F.key;
      var gr = Griglia(el, "", null), navi = dallaPosa(F.naviAvv, false), sc = scafi(navi), mancate = 0;
      for (var i = 0; i < N * N; i++) {
        var v = F.suAvv.charAt(i);
        if (v === "0" && sc[i]) mancate++;
        gr.set(i, "nav-c " + (v === "0" && sc[i] ? "svela " + sc[i] : clsColpo(v)), txtColpo(v));
      }
      s._contenuto.appendChild(el("div", { class: "nav-scena" }, [
        el("div", { class: "nav-esito" }, [el("span", { text: F.vinto ? "🏆" : "💥" }), el("div", { text: F.vinto ? "Hai vinto!" : "Hai perso" })]),
        el("div", { class: "nav-sub", style: "min-height:0", text: F.sotto }),
        el("div", { class: "nav-leg", text: !navi ? "Il campo di " + F.nomeAvv : mancate ? "La flotta di " + F.nomeAvv + ": in grigio le navi che non hai trovato" : "La flotta di " + F.nomeAvv + ": tutta affondata ⚓" }),
        gr.nodo,
        el("div", { class: "nav-leg", text: F.statTxt })
      ]));
      // online: i tasti di fine uguali per tutti, se li disegna il core (F.comuni); sopra, le faccine
      if (F.comuni && F.comuni(s._piede)) { if (F.fa) s._piede.insertBefore(F.fa, s._piede.firstChild); }
      else F.tasti.forEach(function (n) { s._piede.appendChild(n); });
    }
    function reteAvviso(txt) { if (U.rete) U.rete.textContent = txt || ""; }

    return { piazza: piazza, aggPiazza: aggPiazza, staPiazzando: staPiazzando, battaglia: battaglia, fine: fine, reteAvviso: reteAvviso,
      dopo: dopo, spegni: spegni, vivo: vivo, fase: function () { return fase; } };
  }
  function testoStat(s) {
    if (!s || !s.colpi) return "";
    return "Colpi sparati: " + fmtN(s.colpi) + " · a segno: " + fmtN(s.colpiAsegno) + " (" + Math.round(s.colpiAsegno * 100 / s.colpi) + "%)";
  }

  // =========================================================
  //  CONTRO IL BOT
  // =========================================================
  function controBot(t, liv, regole) {
    var io = (t.giocatori && t.giocatori[0]) || "Tu";
    var nomeBot = botDi(t.impostazioni, liv, [io, t.nomeProfilo && t.nomeProfilo()]).nome;   // il nome del Bot di questa partita
    var P, ui, chiaveFine = null;
    function esci() { ui.spegni(); t.esci(); }
    ui = Plancia(t, {
      nomeAvv: function () { return nomeBot; }, bot: true,
      onEsci: function () {
        if (P && P.fase !== "fine") conferma(t, "Uscire dalla partita?", "Esci", esci); else esci();
      }
    });
    function nuova() {
      P = nuovaPartita(regole); chiaveFine = null;
      trasmetti();
      ui.piazza({ staccate: regole.staccate, onPronto: function (st) {
        P.flotte[0] = st; P.flotte[1] = flottaCasuale(regole.staccate);
        P.fase = "battaglia"; P.tocca = Math.random() < 0.5 ? 0 : 1;
        disegna();
        if (P.tocca === 1) ui.dopo(turnoBot, 900);
      } });
    }
    function trasmetti(v) {   // torneo a eliminazione: gli altri guardano la partita col Bot
      if (!t.trasmetti) return;
      v = v || vmPartita(P); v.nomi = [io, "🤖 " + nomeBot];
      t.trasmetti({ t: "vm", vm: v });
    }
    function disegna() {
      var v = vmPartita(P);
      trasmetti(v);
      if (P.fase === "fine") return finePartita(v);
      ui.battaglia(vista(v, 0, P.flotte[0], nomeBot, true), sparoIo);
    }
    function sparoIo(x, y) {
      var e = sparaP(P, 0, x, y); if (!e) return;
      suono(e.e, true); disegna();
      if (P.fase === "battaglia") ui.dopo(turnoBot, 950);
    }
    function turnoBot() {
      if (P.fase !== "battaglia" || P.tocca !== 1) return;
      var restanti = FLOTTA.filter(function (f, i) { return !P.flotte[0].navi[i].affondata; }).map(function (f) { return f.len; });
      var c = botSceglie(campoStr(P.flotte[0]), restanti, liv);
      if (!c) return;
      var e = sparaP(P, 1, c.x, c.y); if (!e) return;
      suono(e.e, false); disegna();
    }
    function finePartita(v) {
      var vinto = P.vince === 0;
      if (chiaveFine == null) {
        chiaveFine = "navale-" + P.g + "-" + Math.random().toString(36).slice(2);
        salvaStatNavale(t, vinto, P.stat[0], "bot", liv, chiaveFine);
        // torneo a eliminazione: chi ha vinto
        if (t.risultato) t.risultato(vinto ? [{ nome: io, pos: 1 }, { nome: nomeBot, pos: 2, bot: true }] : [{ nome: nomeBot, pos: 1, bot: true }, { nome: io, pos: 2 }]);
      }
      ui.fine({ key: P.g, vinto: vinto, nomeAvv: nomeBot, suAvv: v.campi[1], naviAvv: v.svela[1], statTxt: testoStat(P.stat[0]),
        sotto: vinto ? "Hai affondato tutta la flotta di " + nomeBot + "." : nomeBot + " ha affondato la tua flotta.",
        tasti: [t.el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: nuova }), t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: esci })] });
    }
    nuova();
  }

  // =========================================================
  //  ONLINE — l'host tiene la partita, l'ospite manda solo le sue mosse
  //  messaggi: host → "vm" (la foto, trattenuta), "flotta" (solo all'ospite: le sue navi, se ha ricaricato)
  //            ospite → "join", "pronto" {navi}, "colpo" {x,y,n}, "flotta?"
  // =========================================================
  function hostNavale(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el;
    var nomeIo = (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Host";
    var L = { fase: "lobby", codice: "…", pronta: false, avvId: null, nomeAvv: null, ominoIo: t.mioOmino ? t.mioOmino(nomeIo) : null, ominoAvv: null };
    var P = null, ui = null, rete = null, ultimoVm = null, chiaveFine = null, tTurno = null, chiaveTurno = null;
    function nomeAvv() { return L.nomeAvv || "l'avversario"; }
    function regole() { return regoleDa(t.impostazioni, true); }

    // "⚙️ Regole" nella saletta: si vedono subito anche dall'altro
    t.onRegole = function () { if (L.fase === "lobby") { lobby(); mandaVm(); } };

    rete = SGNet.ospita("navale", {
      onCodice: function (c) { L.codice = c; L.riserva = riservaAvv("navale", c); if (L.fase === "lobby") lobby(); mandaVm(); },
      onConnesso: function () { L.pronta = true; if (L.fase === "lobby") lobby(); },
      onAddio: function (id) {
        if (id !== L.avvId) return;
        var chi = L.nomeAvv || "L'avversario";
        // a metà partita (telefono spento, app chiusa): il posto resta suo per un altro minuto; se torna (stesso id) si
        // riprende da dove era rimasta, se no vinci a tavolino
        if (L.fase !== "lobby" && P && P.fase !== "fine") {
          if (L.assente) return;
          L.assente = setTimeout(function () {
            L.assente = null;
            if (L.avvId !== id) return;
            L.avvId = null; L.ominoAvv = null;
            if (P && P.fase !== "fine") { P.fase = "fine"; P.vince = 0; P.tavolino = chi; }   // non è tornato: vinci a tavolino
            if (P && ui) aggiorna(true); else mandaVm(true);
          }, 60000);
          if (ui) ui.reteAvviso("📶 " + chi + " ha perso il collegamento: se non torna entro un minuto, vinci a tavolino.");
          return;
        }
        L.avvId = null; L.ominoAvv = null;
        if (L.fase === "lobby") { L.nomeAvv = null; lobby(); mandaVm(); return; }
        aggiorna(true);
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (L.assente && id === L.avvId) {   // è tornato in tempo
          clearTimeout(L.assente); L.assente = null;
          if (ui && P && P.fase === "piazza") ui.reteAvviso(P.flotte[1] ? "✅ " + nomeAvv() + " ha già sistemato le navi" : "");
          else if (ui) ui.reteAvviso("");
        }
        if (m.t === "esco") {   // l'avversario è uscito apposta (tasto Esci): niente minuto di attesa
          if (id !== L.avvId) return;
          clearTimeout(L.assente); L.assente = null;
          var chiE = L.nomeAvv || "L'avversario";
          L.avvId = null; L.ominoAvv = null;
          if (L.fase === "lobby") { L.nomeAvv = null; lobby(); mandaVm(); return; }
          if (P && P.fase !== "fine") { P.fase = "fine"; P.vince = 0; P.tavolino = chiE; }
          if (P && ui) aggiorna(true);
          return;
        }
        if (m.t === "join") {
          // (nella Sala gioca solo chi è stato scelto: gli altri guardano)
          if (!L.avvId && L.fase === "lobby" && !postoRiservato(L.riserva, id) && (!t.puoSedersi || t.puoSedersi(id, String(m.nome || "").slice(0, 16)))) { L.avvId = id; L.nomeAvv = String(m.nome || "Avversario").slice(0, 16); L.ominoAvv = avatarOk(m.omino); if (L.fase === "lobby") lobby(); }
          if (id === L.avvId) { mandaVm(true); mandaFlotta(); }   // anche se c'era già (si è ricollegato o ha ricaricato): rimando foto e navi
          else mandaVm();
          return;
        }
        if (id !== L.avvId || !P) return;   // solo il mio avversario gioca (un terzo telefono può solo guardare)
        if (m.t === "pronto") {
          if (P.fase === "piazza" && !P.flotte[1]) { var st = dallaPosa(m.navi, P.regole.staccate); if (st) { P.flotte[1] = st; provaVia(); } }
          aggiorna(true);
        } else if (m.t === "colpo") {
          if (m.n === P.n && P.fase === "battaglia" && P.tocca === 1) { var e = sparaP(P, 1, +m.x, +m.y); if (e) { suono(e.e, false); aggiorna(); return; } }
          mandaVm(true);   // colpo vecchio o doppio: gli rimando com'è la partita
        } else if (m.t === "flotta?") mandaFlotta();
      },
      // (arriva solo se il primo collegamento non riesce: a partita iniziata la rete si ricollega da sola)
      onErrore: function () { if (L.fase === "lobby" && !L.pronta) erroreNav(t, "Problema di collegamento. Controlla la connessione e riprova."); }
    });
    function vmPub() {
      var v = P && L.fase === "gioco" ? vmPartita(P) : { fase: "lobby", regole: regole() };
      v.ids = { host: "host", avv: L.avvId };
      v.nomi = [nomeIo, L.nomeAvv || "Avversario"];
      if (L.fase === "lobby") { v.omini = [L.ominoIo, L.ominoAvv]; v.codice = L.codice; }
      return v;
    }
    function mandaVm(forza) {
      ricordaAvv("navale", L.codice, L.avvId || (L.riserva && Date.now() < L.riserva.fino ? L.riserva.id : null));
      var v = vmPub(), j = JSON.stringify(v);
      if (!forza && j === ultimoVm) return;
      ultimoVm = j; rete.invia({ t: "vm", vm: v });
    }
    function mandaFlotta() { if (P && P.flotte[1] && L.avvId) rete.inviaVeloce({ t: "flotta", to: L.avvId, g: P.g, navi: posa(P.flotte[1]) }); }
    function lobby() {
      L.fase = "lobby";
      var gio = [{ id: "host", nome: nomeIo, omino: L.ominoIo || null, host: true, tu: true }];
      if (L.avvId) gio.push({ id: L.avvId, nome: L.nomeAvv, omino: L.ominoAvv || null });
      t.lobby({ host: true, codice: L.codice, pronta: L.pronta, min: 2, vuoti: L.avvId ? 0 : 1, giocatori: gio,
        nota: L.avvId ? "✅ Avversario collegato! Quando vuoi, comincia." : "Invita il tuo avversario col tasto 📤.",
        extra: [el("p", { class: "modulo-nota", style: "text-align:center", text: testoRegole(regole()) })],
        onComincia: comincia, onEsci: function () { chiudi(); } });
    }
    function chiudi() { if (ui) ui.spegni(); clearTimeout(tTurno); clearTimeout(L.assente); L.assente = null; rete.chiudi(); t.esci(); }
    function comincia() {
      if (!L.avvId) return;
      L.fase = "gioco"; P = nuovaPartita(regole()); chiaveFine = null;
      if (ui) ui.spegni();
      ui = Plancia(t, { nomeAvv: nomeAvv, onEsci: function () {
        if (P && P.fase !== "fine") conferma(t, "Chiudere la partita per tutti?", "Chiudi", chiudi); else chiudi();
      } });
      piazzaIo();
      mandaVm();
    }
    function piazzaIo() {
      ui.piazza({ staccate: P.regole.staccate, onPronto: function (st) { if (P.fase !== "piazza") return; P.flotte[0] = st; provaVia(); aggiorna(); } });
    }
    function provaVia() {   // tutti e due pronti: si comincia (a caso chi spara per primo)
      if (P.fase !== "piazza" || !P.flotte[0] || !P.flotte[1]) return;
      P.fase = "battaglia"; P.tocca = Math.random() < 0.5 ? 0 : 1;
    }
    function aggiorna(forza) {
      mandaVm(forza);
      if (!ui || !P) return;
      if (P.fase === "piazza") { ui.reteAvviso(P.flotte[1] ? "✅ " + nomeAvv() + " ha già sistemato le navi" : ""); if (!ui.staPiazzando()) ui.aggPiazza(); return; }
      if (P.fase === "battaglia") { ui.battaglia(vista(vmPartita(P), 0, P.flotte[0], nomeAvv()), sparoIo); tempoTurno(); return; }
      clearTimeout(tTurno);
      finePartita();
    }
    function sparoIo(x, y) { var e = sparaP(P, 0, x, y); if (!e) return; suono(e.e, true); aggiorna(); }
    // tempo per sparare: allo scadere spara a caso per chi doveva tirare
    function tempoTurno() {
      var k = P.g + "-" + P.n;
      if (!P.regole.tempo || k === chiaveTurno) return;
      chiaveTurno = k; clearTimeout(tTurno);
      tTurno = setTimeout(function () {
        if (!P || !ui || !ui.vivo() || P.fase !== "battaglia" || P.g + "-" + P.n !== k) return;
        var chi = P.tocca, c = tiroACaso(P, chi), e = c && sparaP(P, chi, c.x, c.y);
        if (e) { P.ultimo.auto = true; suono(e.e, false); aggiorna(); }   // auto = tiro a tempo scaduto (non fa vibrare nessuno)
      }, P.regole.tempo * 1000 + 700);
    }
    function finePartita() {
      var v = vmPartita(P), vinto = P.vince === 0;
      if (chiaveFine == null) {
        chiaveFine = "navale-" + P.g + "-" + Math.random().toString(36).slice(2);
        if (!P.tavolino) salvaStatNavale(t, vinto, P.stat[0], "online", null, chiaveFine);
        // per il torneo online: chi ha vinto
        if (t.risultato) t.risultato(vinto ? [{ nome: nomeIo, pos: 1 }, { nome: L.nomeAvv || "Avversario", pos: 2 }] : [{ nome: L.nomeAvv || "Avversario", pos: 1 }, { nome: nomeIo, pos: 2 }]);
      }
      var tasti = [], fa = t.faccine ? t.faccine() : null;   // la fila delle faccine (il mio avatar le fa sui telefoni di tutti)
      if (fa) { fa.style.margin = "0 0 8px"; tasti.push(fa); }
      if (L.avvId) tasti.push(el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: rivincita }));
      else tasti.push(el("button", { class: "btn btn-primario", text: "👥 Torna alla saletta", onclick: allaSaletta }));
      tasti.push(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: chiudi }));
      var chi = L.nomeAvv || "l'avversario";
      // (senza avversario resta "👥 Torna alla saletta" del gioco)
      var comuni = L.avvId && t.tastiFine ? function (piede) { return t.tastiFine(piede, { host: true, nuova: allaRivincita, esci: chiudi }); } : null;
      ui.fine({ key: P.g + (L.avvId ? "" : "-via"), vinto: vinto, nomeAvv: chi, suAvv: v.campi[1], naviAvv: P.tavolino ? null : v.svela[1], statTxt: testoStat(P.stat[0]),
        sotto: P.tavolino ? P.tavolino + " è uscito dalla partita: vinci a tavolino." : (vinto ? "Hai affondato tutta la flotta di " + chi + "." : chi + " ha affondato la tua flotta.") + (L.avvId ? "" : " (" + chi + " è uscito)"),
        tasti: tasti, comuni: comuni, fa: fa });
    }
    // la rivincita dei tasti di fine comuni: si torna nella saletta con lo stesso avversario (il core fa il 3-2-1)
    function allaRivincita() { if (P && P.fase === "fine") allaSaletta(); }
    t.onRivincita = allaRivincita;
    function rivincita() {   // stessa stanza, stesso avversario: si risistemano le navi
      if (!L.avvId || L.assente) return allaSaletta();   // (l'avversario è uscito e non è ancora tornato: si torna in saletta)
      P = nuovaPartita(regole()); chiaveFine = null; clearTimeout(tTurno);
      piazzaIo(); mandaVm();
    }
    function allaSaletta() {
      if (L.assente) { clearTimeout(L.assente); L.assente = null; L.avvId = null; L.ominoAvv = null; }   // chi era uscito un attimo e non è tornato: il posto si libera
      if (ui) ui.spegni(); ui = null; P = null; clearTimeout(tTurno); L.nomeAvv = L.avvId ? L.nomeAvv : null; lobby(); mandaVm(); }
    lobby();
  }

  function ospiteNavale(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el;
    var S = { myId: null, rete: null, nome: "", vm: null, g: null, stato: null, prontoMandato: false, pend: null, lastN: null, salvata: {}, spett: null, msg: null };
    var ui = null, tRipeti = null;
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else schermaNome();   // col profilo si entra da soli
    function schermaNome() {
      var s = t.schermata({ icona: "🚢", titolo: "Entra nella Battaglia", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function attesa(txt) {
      var s = t.schermata({ icona: "🚢", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: esci });
      S.msg = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: txt });
      s._contenuto.appendChild(S.msg);
      t.mostra(s);
    }
    function esci() { if (ui) ui.spegni(); clearInterval(tRipeti); if (S.rete) { try { if (!S.spett) S.rete.invia({ t: "esco" }); } catch (e) {} S.rete.chiudi(); } t.esci(); }   // (l'host sa che sono uscito apposta)
    function join() { if (S.rete) S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null }); }
    function collega() {
      attesa("Collegamento in corso…");
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) {
          S.myId = id; join();
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita: controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000);
        },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;   // era per un altro telefono
          if (m.t === "vm" && m.vm) foto(m.vm);
          else if (m.t === "flotta") { if (S.vm && m.g === S.vm.g) { S.stato = dallaPosa(m.navi, false); if (S.vm) foto(S.vm); } }
        },
        onHostVia: function (via) { if (ui) ui.reteAvviso(via ? "📡 " + ((S.vm && S.vm.nomi && S.vm.nomi[0]) || "L'host") + " si è disconnesso: aspettiamo che torni…" : ""); },
        onChiuso: function () { if (ui) ui.spegni(); clearInterval(tRipeti); erroreNav(t, "La partita è stata chiusa dall'host."); },
        onErrore: function () { if (!S.vm) erroreNav(t, "Problema di collegamento. Controlla la connessione e riprova."); }   // a partita iniziata: si riprende da solo
      });
      // ogni 2,5 s: rimando quello che è rimasto senza risposta (il "pronto", il colpo) e chiedo le mie navi se mi mancano
      tRipeti = setInterval(function () {
        var vm = S.vm; if (!vm || !S.rete || S.spett) return;
        if (vm.fase === "piazza" && S.prontoMandato && S.stato && !vm.pronti[1]) S.rete.invia({ t: "pronto", navi: posa(S.stato) });
        if (S.pend && vm.fase === "battaglia" && vm.n === S.pend.n) S.rete.invia({ t: "colpo", x: S.pend.x, y: S.pend.y, n: S.pend.n });
        if (!S.stato && vm.fase !== "lobby" && vm.pronti && vm.pronti[1]) S.rete.invia({ t: "flotta?" });
      }, 2500);
    }
    function foto(vm) {
      S.vm = vm;
      var ids = vm.ids || {};
      // la stanza è di un altro avversario: questo telefono può solo guardare
      if (ids.avv && ids.avv !== S.myId && vm.fase === "lobby") {   // in saletta: si gioca in due, io guardo (niente "Tu")
        if (ui) { ui.spegni(); ui = null; }
        if (S.spett) { S.spett.spegni(); S.spett = null; }
        t.lobby({ host: false, codice: codice, pronta: true, min: 2, giocatori: [{ id: "host", nome: vm.nomi[0], omino: (vm.omini && vm.omini[0]) || null, host: true },
          { id: ids.avv, nome: vm.nomi[1], omino: (vm.omini && vm.omini[1]) || null }],
          extra: [el("p", { class: "modulo-nota", style: "text-align:center", text: testoRegole(vm.regole) })],
          attesa: "👀 Giocano " + vm.nomi[0] + " e " + vm.nomi[1] + ": tu guardi.", onEsci: esci });
        return;
      }
      if (ids.avv !== S.myId && (ids.avv || vm.fase !== "lobby")) {
        if (ui) { ui.spegni(); ui = null; }
        if (!S.spett) S.spett = Spettatore(t, esci, "👀 Si gioca in due: tu guardi la partita.");
        S.spett.disegna(vm);
        return;
      }
      if (S.spett) { S.spett.spegni(); S.spett = null; }
      if (vm.fase === "lobby") {
        if (ui) { ui.spegni(); ui = null; }
        if (!ids.avv) { join(); attesa("Entro nella stanza…"); return; }   // non sono (più) dentro: richiedo di entrare
        var gio = [{ id: "host", nome: vm.nomi[0], omino: (vm.omini && vm.omini[0]) || null, host: true }, { id: ids.avv, nome: vm.nomi[1], omino: (vm.omini && vm.omini[1]) || null, tu: true }];
        t.lobby({ host: false, codice: codice, pronta: true, min: 2, giocatori: gio,
          extra: [el("p", { class: "modulo-nota", style: "text-align:center", text: testoRegole(vm.regole) })],
          attesa: "Aspetta che l'host cominci: poi sistemate le navi. 🚢", onEsci: esci });
        return;
      }
      // una partita nuova (anche la rivincita): si ricomincia a sistemare le navi
      if (vm.g !== S.g) { S.g = vm.g; S.stato = null; S.prontoMandato = false; S.pend = null; S.lastN = null; S.pzKey = null; }
      if (!ui) ui = Plancia(t, { nomeAvv: function () { return (S.vm && S.vm.nomi && S.vm.nomi[0]) || "l'host"; }, onEsci: function () {
        if (S.vm && S.vm.fase !== "fine") conferma(t, "Uscire dalla partita?", "Esci", esci); else esci();
      } });
      var nomeHost = vm.nomi[0];
      if (vm.fase === "piazza" || (vm.fase === "battaglia" && !S.stato)) {
        // libera = sto sistemando le navi; pronta = le ho mandate, aspetto l'altro; recupero = ho ricaricato, l'host mi rimanda le mie navi
        var key = S.stato && (S.prontoMandato || vm.pronti[1]) ? "pronta" : (vm.pronti[1] || vm.fase !== "piazza") ? "recupero" : "libera";
        if (ui.fase() !== "piazza" || S.pzKey !== key) {
          S.pzKey = key;
          if (key === "libera") ui.piazza({ staccate: vm.regole.staccate, onPronto: function (st) {
            S.stato = st; S.prontoMandato = true; S.pzKey = "pronta"; S.rete.invia({ t: "pronto", navi: posa(st) });
          } });
          else if (key === "pronta") ui.piazza({ staccate: vm.regole.staccate, stato: S.stato, onPronto: function () {} });
          else { ui.piazza({ staccate: false, stato: statoVuoto(), attesa: "Recupero le tue navi…", onPronto: function () {} }); S.rete.invia({ t: "flotta?" }); }
        }
        S.lastN = vm.n;
        if (vm.fase === "piazza") ui.reteAvviso(vm.pronti[0] && key === "libera" ? "✅ " + nomeHost + " ha già sistemato le navi" : "");
        if (vm.fase === "piazza" || !S.stato) return;
      }
      // i suoni del colpo appena arrivato (vibra solo se era il mio tiro: è la risposta al mio tocco)
      if (S.lastN != null && vm.n > S.lastN && vm.ultimo) suono(vm.ultimo.e, vm.ultimo.chi === 1 && !vm.ultimo.auto);
      S.lastN = vm.n;
      if (S.pend && (vm.n !== S.pend.n || vm.fase !== "battaglia")) S.pend = null;
      if (vm.fase === "battaglia") return disegnaBattaglia();
      // fine
      var vinto = vm.vince === 1, k = "navale-" + vm.g + "-" + S.myId;
      if (!S.salvata[vm.g]) { S.salvata[vm.g] = true; if (vm.stat) salvaStatNavale(t, vinto, vm.stat[1], "online", null, k); }
      var fa = t.faccine ? t.faccine() : null;   // la fila delle faccine (se la schermata c'è già, non si usa)
      if (fa) fa.style.margin = "0 0 8px";
      ui.fine({ key: vm.g, vinto: vinto, nomeAvv: nomeHost, suAvv: vm.campi[0], naviAvv: vm.svela && vm.svela[0], statTxt: testoStat(vm.stat && vm.stat[1]),
        sotto: vinto ? "Hai affondato tutta la flotta di " + nomeHost + "." : nomeHost + " ha affondato la tua flotta.",
        tasti: [el("p", { class: "modulo-nota", style: "text-align:center;margin:0 0 6px", text: "In attesa dell'host per la rivincita…" }), fa, el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: esci })].filter(Boolean),
        comuni: t.tastiFine ? function (piede) { return t.tastiFine(piede, { host: false, esci: esci }); } : null, fa: fa });
    }
    function disegnaBattaglia() {
      var vm = S.vm, V = vista(vm, 1, S.stato, vm.nomi[0]);
      if (S.pend) { V.mira = S.pend.y * N + S.pend.x; V.mio = false; }
      ui.battaglia(V, sparo);
    }
    function sparo(x, y) {
      var vm = S.vm; if (!vm || vm.fase !== "battaglia" || vm.tocca !== 1 || S.pend) return;
      S.pend = { x: x, y: y, n: vm.n };
      S.rete.invia({ t: "colpo", x: x, y: y, n: vm.n });
      disegnaBattaglia();
    }
  }

  // chi guarda (torneo a eliminazione, o un terzo telefono): i due campi coi colpi, senza mai vedere dove sono le navi
  // (si svelano solo a partita finita). Niente suoni: farebbero vibrare il telefono.
  function Spettatore(t, esci, testoLobby) {
    var el = t.el, scritta = null, mont = null, spento = false;
    function attesa(txt) {
      if (spento || scritta === txt) return; scritta = txt; mont = null;
      var s = t.schermata({ indietro: esci });
      s._contenuto.appendChild(el("p", { class: "modulo-nota guarda-attesa", text: txt }));
      var fa = t.faccine ? t.faccine() : null;   // (stanza online: intanto le faccine)
      if (fa) s._piede.appendChild(fa);
      t.mostra(s);
    }
    function costruisci() {
      scritta = null;
      var s = t.schermata({ indietro: esci }); s.classList.add("nav-piena");
      mont = { s: s, riga: el("div", { class: "guarda-riga" }), tit: el("div", { class: "nav-stato" }), lati: [] };
      var due = el("div", { class: "nav-guarda" });
      for (var k = 0; k < 2; k++) {
        var lato = { sub: el("div", { class: "nav-sub" }), gr: Griglia(el, "nav-g", null) };
        lato.nodo = el("div", { class: "nav-guarda-lato" }, [lato.sub, lato.gr.nodo]);
        mont.lati.push(lato); due.appendChild(lato.nodo);
      }
      mont.nota = el("p", { class: "modulo-nota", style: "text-align:center" });
      // in una stanza online (non nel torneo): la fila delle faccine, il mio avatar le fa sui telefoni di tutti
      var fa = t.faccine ? t.faccine() : null;
      if (fa) fa.style.cssText += ";width:100%;max-width:380px;box-sizing:border-box";
      s._contenuto.appendChild(el("div", { class: "nav-scena" }, [mont.riga, mont.tit, due, mont.nota, fa].filter(Boolean)));
      t.mostra(s);
    }
    function disegna(vm) {
      if (spento || !vm) return;
      var n = vm.nomi || ["?", "?"];
      if (vm.fase === "lobby") return attesa(testoLobby || "👀 La partita sta per cominciare…");
      if (vm.fase === "piazza") return attesa("👀 " + n[0] + " e " + n[1] + " stanno sistemando le navi… ⚓");
      if (!mont || !document.body.contains(mont.s)) costruisci();
      mont.riga.textContent = "👀 " + n[0] + " 🆚 " + n[1];
      mont.tit.textContent = vm.fase === "fine" ? "🏆 Vince " + n[vm.vince] + "!" + (vm.tavolino ? " (" + vm.tavolino + " è uscito)" : "") : "🎯 Spara " + n[vm.tocca] + "…";
      mont.nota.textContent = vm.fase === "fine" ? (testoLobby ? "" : "Tra poco si torna al tabellone…") : "";
      [0, 1].forEach(function (k) {
        var lato = mont.lati[k], campo = vm.campi[k], sc = scafi(vm.svela ? dallaPosa(vm.svela[k], false) : null);
        lato.sub.textContent = "🚢 Flotta di " + n[k] + " · " + (NTOT - contaGiu(vm.aff[k])) + "/" + NTOT + " a galla";
        var c = "nav-guarda-lato" + (vm.fase === "battaglia" && vm.tocca === 1 - k ? " bersaglio" : "");
        if (lato.nodo.className !== c) lato.nodo.className = c;
        for (var i = 0; i < N * N; i++) {
          var v = campo.charAt(i), cls = "nav-c " + (v === "0" && sc[i] ? "svela " + sc[i] : clsColpo(v));
          if (vm.ultimo && vm.ultimo.chi === 1 - k && vm.ultimo.y * N + vm.ultimo.x === i) cls += " ult";
          lato.gr.set(i, cls, txtColpo(v));
        }
      });
    }
    return { disegna: disegna, spegni: function () { spento = true; } };
  }
  function guardaNavale(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var rete = null;
    function esci() { sp.spegni(); if (rete) rete.chiudi(); t.esci(); }
    var sp = Spettatore(t, esci, null);
    t.mostra((function () { var s = t.schermata({ indietro: esci }); s._contenuto.appendChild(t.el("p", { class: "modulo-nota guarda-attesa", text: "👀 Mi collego alla partita…" })); return s; })());
    rete = SGNet.entra(codice, {
      onMsg: function (m) { if (m && m.t === "vm" && m.vm) sp.disegna(m.vm); },
      onChiuso: esci,   // partita finita e chiusa: si torna al tabellone
      onErrore: function () {}
    });
  }

  function avatarOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // l'avversario di questa stanza, ricordato sul telefono dell'host: se la pagina dell'host si ricarica (la stanza si
  // riapre con lo stesso codice), per 15 secondi il posto resta a chi giocava, non a chi guardava ed è stato più svelto
  function ricordaAvv(gioco, codice, id) { try { if (codice && codice !== "…") localStorage.setItem("sg-avv-" + gioco, JSON.stringify({ c: codice, id: id || null, t: Date.now() })); } catch (e) {} }
  function riservaAvv(gioco, codice) {
    try { var x = JSON.parse(localStorage.getItem("sg-avv-" + gioco) || "null"); if (x && x.c === codice && x.id && Date.now() - x.t < 20 * 60000) return { id: x.id, fino: Date.now() + 15000 }; } catch (e) {}
    return null;
  }
  function postoRiservato(r, id) { return !!(r && r.id !== id && Date.now() < r.fino); }   // true = questo posto non è (ancora) per lui

  function erroreNav(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca contro il Bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
})();
