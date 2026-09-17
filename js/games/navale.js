/* =========================================================
   GIOCO — "Battaglia Navale" (regole classiche)
   Griglia 10×10, flotta: Portaerei(5), Corazzata(4), Incrociatore(3),
   Sommergibile(3), Cacciatorpediniere(2). A turno si spara una cella:
   acqua / colpito / colpito e affondato. Vince chi affonda tutta la
   flotta avversaria. Un colpo per turno, poi passa (come l'originale).
   Modalità: contro il computer, oppure online (ognuno dal suo telefono,
   PEER-TO-PEER: le navi non viaggiano mai in rete, si scambiano solo i
   colpi e gli esiti — nessuno può barare).
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

  // ---------- utilità griglia ----------
  function matrice(v) { var m = []; for (var y = 0; y < N; y++) { m[y] = []; for (var x = 0; x < N; x++) m[y][x] = v; } return m; }
  function dentro(x, y) { return x >= 0 && x < N && y >= 0 && y < N; }
  function liberoPer(mappa, x, y, len, oriz) {
    for (var k = 0; k < len; k++) { var cx = x + (oriz ? k : 0), cy = y + (oriz ? 0 : k); if (!dentro(cx, cy) || mappa[cy][cx] >= 0) return false; }
    return true;
  }
  function poni(stato, idx, f, x, y, oriz) {
    var celle = [];
    for (var k = 0; k < f.len; k++) { var cx = x + (oriz ? k : 0), cy = y + (oriz ? 0 : k); stato.mappa[cy][cx] = idx; celle.push({ x: cx, y: cy }); }
    stato.navi[idx] = { nome: f.nome, len: f.len, celle: celle, colpite: celle.map(function () { return false; }), affondata: false };
  }
  function statoVuoto() { return { mappa: matrice(-1), navi: [], sparato: matrice(false) }; }
  function flottaCasuale() {
    var st = statoVuoto();
    FLOTTA.forEach(function (f, idx) {
      var ok = false, tent = 0;
      while (!ok && tent < 800) {
        tent++;
        var oriz = Math.random() < 0.5;
        var x = Math.floor(Math.random() * (oriz ? N - f.len + 1 : N));
        var y = Math.floor(Math.random() * (oriz ? N : N - f.len + 1));
        if (liberoPer(st.mappa, x, y, f.len, oriz)) { poni(st, idx, f, x, y, oriz); ok = true; }
      }
    });
    return st;
  }
  // applica un colpo alla flotta "st"; ritorna { e:"acqua|colpito|affondato|gia", celle?, nome?, persa }
  function applicaColpo(st, x, y) {
    if (st.sparato[y][x]) return { e: "gia" };
    st.sparato[y][x] = true;
    var idx = st.mappa[y][x];
    if (idx < 0) return { e: "acqua", persa: false };
    var nave = st.navi[idx];
    for (var k = 0; k < nave.celle.length; k++) if (nave.celle[k].x === x && nave.celle[k].y === y) nave.colpite[k] = true;
    var aff = nave.colpite.every(Boolean);
    if (aff) {
      nave.affondata = true;
      var persa = st.navi.every(function (nn) { return nn.affondata; });
      return { e: "affondato", celle: nave.celle, nome: nave.nome, persa: persa };
    }
    return { e: "colpito", persa: false };
  }

  // ---------- bot ----------
  function celleLibere(st) { var o = []; for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (!st.sparato[y][x]) o.push({ x: x, y: y }); return o; }
  function botSceglie(mio, mem, liv) {
    if (liv !== "facile" && mem.coda.length) {
      while (mem.coda.length) { var c = mem.coda.shift(); if (dentro(c.x, c.y) && !mio.sparato[c.y][c.x]) return c; }
    }
    var libere = celleLibere(mio);
    if (liv === "difficile") { var par = libere.filter(function (c) { return (c.x + c.y) % 2 === 0; }); if (par.length) libere = par; }
    return libere[Math.floor(Math.random() * libere.length)];
  }
  function botDopo(mem, x, y, esito, liv) {
    if (liv === "facile") return;
    if (esito.e === "colpito") { [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { mem.coda.push({ x: x + d[0], y: y + d[1] }); }); }
    else if (esito.e === "affondato") { mem.coda = []; }
  }

  // ---------- suoni ----------
  function suono(e) {
    try { if (navigator.vibrate) navigator.vibrate(e === "affondato" ? [0, 30, 40, 40] : e === "colpito" ? 25 : 8); } catch (x) {}
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
      ".nav-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;width:min(94vw,340px);margin:0 auto}",
      ".nav-mini{width:min(72vw,250px)}",
      ".nav-c{aspect-ratio:1;border-radius:4px;background:#123a54;display:flex;align-items:center;justify-content:center;font-size:.82rem;line-height:1;-webkit-tap-highlight-color:transparent;border:1px solid rgba(255,255,255,.05);box-sizing:border-box}",
      ".nav-c.mare{background:radial-gradient(120% 120% at 30% 20%,#1b5b7e,#0e3a52)}",
      ".nav-c.sparabile{cursor:pointer;background:radial-gradient(120% 120% at 30% 20%,#2a7bad,#0f4f73);box-shadow:inset 0 0 0 1px rgba(143,208,255,.28)}",
      ".nav-c.sparabile:active{transform:scale(.9)}",
      ".nav-c.acqua{background:#0c3247;color:#8fd0ff}",
      ".nav-c.colpito{background:radial-gradient(circle at 50% 38%,#ff7a7a,#e03131);color:#fff;font-weight:900}",
      ".nav-c.affondato{background:#6e0f14;color:#fff;font-weight:900}",
      // navi come SCAFI: acciaio + estremità arrotondate (prua/poppa); l'ombra colma i 2px tra le celle così lo scafo è continuo
      ".nav-c.sh{border:0;position:relative;z-index:1;background:linear-gradient(180deg,#c6d0dc,#7a8796 52%,#515b6a);box-shadow:0 0 0 2px #6d7887,inset 0 1px 0 rgba(255,255,255,.45)}",
      ".nav-c.sh.shx{background:linear-gradient(180deg,#ffa3a3,#e03131);box-shadow:0 0 0 2px #c92a2a,inset 0 1px 0 rgba(255,255,255,.3)}",
      ".sh-h.sh-a{border-top-left-radius:48%;border-bottom-left-radius:48%}",
      ".sh-h.sh-b{border-top-right-radius:48%;border-bottom-right-radius:48%}",
      ".sh-v.sh-a{border-top-left-radius:48%;border-top-right-radius:48%}",
      ".sh-v.sh-b{border-bottom-left-radius:48%;border-bottom-right-radius:48%}",
      ".nav-c.ok{outline:2px solid #69db7c;outline-offset:-2px}",
      ".nav-c.bad{outline:2px solid #ff6b6b;outline-offset:-2px}",
      ".nav-c.ante{background:#2f9e57;outline:2px solid #8ce99a;outline-offset:-2px}",
      ".nav-c.antebad{background:#7a2020;outline:2px solid #ff8787;outline-offset:-2px}",
      // tabellone con lettere (in alto) e numeri (a sinistra)
      ".nav-board{display:grid;grid-template-columns:18px repeat(10,1fr);gap:2px;width:min(94vw,346px);margin:0 auto;padding:6px;box-sizing:border-box;border-radius:12px;background:rgba(4,20,34,.45);box-shadow:inset 0 0 0 1px rgba(143,208,255,.12)}",
      ".nav-board.nav-mini{width:min(80vw,280px);grid-template-columns:15px repeat(10,1fr)}",
      ".nav-lab{display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:800;color:rgba(180,214,240,.72)}",
      // scritta grande tipo \"colpito e affondato\"
      ".nav-avviso{text-align:center;font-weight:800;font-size:1.02rem;padding:8px 10px;border-radius:12px;margin:2px 0 8px;background:linear-gradient(90deg,#e8590c,#f59f00);color:#fff;box-shadow:0 3px 12px rgba(240,140,0,.45);animation:navPop .28s ease-out}",
      "@keyframes navPop{0%{transform:scale(.82);opacity:0}100%{transform:scale(1);opacity:1}}",
      ".nav-flotta{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0}",
      ".nav-nave{display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.06);font-size:.78rem}",
      ".nav-nave.fatta{background:rgba(105,219,124,.16);color:#8ce99a}",
      ".nav-nave.corr{background:rgba(255,212,59,.18);outline:1px solid #ffd43b}",
      ".nav-nave.giu{opacity:.5;text-decoration:line-through}",
      ".nav-boat{display:inline-block;height:10px;border-radius:5px;background:linear-gradient(180deg,#c6d0dc,#6d7887);box-shadow:inset 0 1px 0 rgba(255,255,255,.45)}",
      ".nav-boat.giu{background:#e03131}",
      ".nav-tit{text-align:center;font-weight:800;font-size:1rem;margin:4px 0 6px;min-height:1.3em}",
      ".nav-sub{text-align:center;font-size:.74rem;color:rgba(255,255,255,.65);margin:2px 0 8px}",
      ".nav-conta{display:flex;justify-content:center;gap:14px;font-size:.78rem;margin:6px 0}"
    ].join("");
    document.head.appendChild(s);
  }

  // quadratini che rappresentano la lunghezza di una nave
  function quadretti(el, len, giu) { return el("span", { class: "nav-boat" + (giu ? " giu" : ""), style: "width:" + (len * 8 + 2) + "px" }); }

  SG.registra({
    id: "navale",
    nome: "Battaglia Navale",
    icona: "🚢",
    descrizione: "La battaglia navale classica: sistemi la tua flotta e affondi quella dell'avversario. Contro il computer o online, uno contro uno.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 2,
    regole: [
      "Ognuno ha una griglia <b>10×10</b> e una <b>flotta</b>: Portaerei (5), Corazzata (4), Incrociatore (3), Sommergibile (3), Cacciatorpediniere (2).",
      "Prima <b>sistemi le tue navi</b> (le giri in orizzontale o verticale, o premi <b>Disponi a caso</b>). Non si possono sovrapporre.",
      "Poi a turno <b>spari</b> una casella della griglia avversaria: <b>acqua</b>, <b>colpito</b> oppure <b>colpito e affondato</b> quando becchi tutta la nave.",
      "Un colpo per turno, poi tocca all'altro. <b>Vince chi affonda tutta la flotta</b> avversaria.",
      "Modalità: <b>contro il computer</b> oppure <b>online</b> (ognuno dal suo telefono). Online le tue navi non escono mai dal tuo telefono: nessuno può sbirciare."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio";
      var bBot, bOnl, boxDiff, notaOnline;
      function sel(m) {
        dove.modo = m;
        bBot.className = "modo-chip" + (m === "bot" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        boxDiff.hidden = (m !== "bot");
        notaOnline.hidden = (m !== "online");
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { sel("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro il computer" }), el("div", { class: "ms", text: "Da solo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));

      boxDiff = el("div", {});
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura del computer" }));
      var dg = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; dg.appendChild(b);
      });
      boxDiff.appendChild(dg); box.appendChild(boxDiff);

      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri una stanza e manda il codice: l'altro entra dal suo telefono."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
    },

    avvia: function (t) {
      stile();
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteNavale(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostNavale(t);
      return controBot(t, imp.difficolta || "medio");
    }
  });

  // =========================================================
  //  MOTORE DI PARTITA (condiviso da bot e online)
  //  canale.manda(msg): { t:"colpo",x,y } oppure { t:"esito",x,y,e,celle,nome,persa }
  //  Il "ricevi" gestisce i colpi in arrivo e gli esiti dei miei colpi.
  // =========================================================
  var navMount = null;
  function nuovoGioco(t, opt) {
    // opt = { titolo, sotto, nomeAvv, sonoHost|null, onEsci, invia(msg)|null (online), rivincita|null, indietro }
    var el = t.el;
    var io = statoVuoto();          // la MIA flotta (+ colpi ricevuti)
    var attacco = matrice(0);       // 0 non sparato, 1 acqua, 2 colpito, 3 affondato
    var affAvv = 0;                 // navi avversarie affondate
    var fase = "piazza";            // piazza | attesaAvv | battaglia | fine
    var esitoFine = null;           // true=vinto, false=perso
    var turno = "mio";              // mio | attesa (in battaglia)
    var oriz = true;                // orientamento in piazzamento
    var prossima = 0;               // indice nave da piazzare
    var ante = null;                // anteprima di dove sto per mettere la nave: {x,y} o null
    var avviso = null, avvisoT = null; // scritta temporanea (es. "colpito e affondato")
    var ioPronto = false, avvPronto = false;
    var canale = null;              // impostato da bot/online

    // ---- piazzamento (con ANTEPRIMA: prima proietto dove va la nave, poi confermo) ----
    function celleAnte() { // celle e validità dell'anteprima corrente (o null)
      if (ante == null || prossima >= NTOT) return null;
      var f = FLOTTA[prossima], celle = [], ok = liberoPer(io.mappa, ante.x, ante.y, f.len, oriz), set = {};
      for (var k = 0; k < f.len; k++) { var cx = ante.x + (oriz ? k : 0), cy = ante.y + (oriz ? 0 : k); if (dentro(cx, cy)) set[cy * N + cx] = true; }
      return { set: set, ok: ok };
    }
    function toccaCella(x, y) {               // tocco una cella in fase piazzamento
      if (prossima >= NTOT) return;
      if (ante && ante.x === x && ante.y === y) { confermaAnte(); return; } // ritocco la stessa cella = conferma
      ante = { x: x, y: y }; render();        // altrimenti sposto qui l'anteprima
    }
    function confermaAnte() {
      if (ante == null || prossima >= NTOT) return;
      var f = FLOTTA[prossima];
      if (!liberoPer(io.mappa, ante.x, ante.y, f.len, oriz)) return; // non ci sta: non faccio nulla
      poni(io, prossima, f, ante.x, ante.y, oriz); prossima++; ante = null; suono("colpito"); render();
    }
    function ruota() { oriz = !oriz; render(); }
    function togliUltima() { if (prossima === 0) return; prossima--; var nave = io.navi[prossima]; nave.celle.forEach(function (c) { io.mappa[c.y][c.x] = -1; }); io.navi[prossima] = undefined; io.navi.length = prossima; ante = null; render(); }
    function disponiCaso() { var f = flottaCasuale(); io.mappa = f.mappa; io.navi = f.navi; io.sparato = matrice(false); prossima = NTOT; ante = null; render(); }
    // scritta temporanea (es. "colpito e affondato")
    function mostraAvviso(txt) { avviso = txt; clearTimeout(avvisoT); avvisoT = setTimeout(function () { avviso = null; render(); }, 1900); }

    function pronto() {
      if (prossima < NTOT) return;
      ioPronto = true;
      if (opt.invia) { opt.invia({ t: "pronto" }); fase = "attesaAvv"; provaVia(); render(); }
      else { fase = "battaglia"; opt.startBot(); render(); } // bot: parte subito
    }

    // ---- sparo (mio) ----
    function sparoIo(x, y) {
      if (fase !== "battaglia" || turno !== "mio" || attacco[y][x] !== 0) return;
      turno = "attesa"; render();
      canale.manda({ t: "colpo", x: x, y: y });
    }
    function registraEsito(m) {
      if (m.e === "affondato" && m.celle) { m.celle.forEach(function (c) { attacco[c.y][c.x] = 3; }); affAvv++; }
      else if (m.e === "colpito") attacco[m.y][m.x] = 2;
      else attacco[m.y][m.x] = 1;
      suono(m.e);
    }
    // dispatcher dei messaggi (in arrivo dall'avversario o dal bot)
    function ricevi(m) {
      if (!m || !m.t) return;
      if (m.t === "colpo") {                     // l'avversario spara su di me
        var e = applicaColpo(io, m.x, m.y);
        if (e.e === "gia") return;
        if (opt.invia) opt.invia({ t: "esito", x: m.x, y: m.y, e: e.e, celle: e.celle || null, nome: e.nome || null, persa: !!e.persa });
        else if (canale.esitoBot) canale.esitoBot({ x: m.x, y: m.y, e: e.e });
        suono(e.e);
        if (e.e === "affondato" && !e.persa) mostraAvviso("☠️ Ti hanno affondato: " + e.nome);
        if (e.persa) { fase = "fine"; esitoFine = false; render(); return; }
        turno = "mio"; render();
      } else if (m.t === "esito") {              // esito del MIO colpo
        registraEsito(m);
        if (m.e === "affondato" && !m.persa) mostraAvviso("💥 Colpito e affondato!" + (m.nome ? " " + m.nome : ""));
        if (m.persa) { fase = "fine"; esitoFine = true; render(); return; }
        turno = "attesa"; render();              // ho sparato, ora tocca all'altro
      }
    }

    // ---- sincronizzazione online ----
    function provaVia() { // solo host: quando entrambi pronti, decide chi inizia
      if (opt.sonoHost && ioPronto && avvPronto) {
        var primoAvv = Math.random() < 0.5;
        opt.invia({ t: "via", primoAvv: primoAvv });
        fase = "battaglia"; turno = primoAvv ? "attesa" : "mio"; render();
      }
    }
    function daRete(m) { // messaggi che arrivano dall'avversario in rete (online)
      if (!m || !m.t) return;
      if (m.t === "pronto") { avvPronto = true; if (opt.sonoHost) provaVia(); }
      else if (m.t === "via") { avvPronto = true; fase = "battaglia"; turno = m.primoAvv ? "mio" : "attesa"; render(); } // ospite: primoAvv=true → tocca a me
      else if (m.t === "rivincita") { rifaiPiazza(); }
      else ricevi(m); // colpo / esito
    }
    function rifaiPiazza() {
      io = statoVuoto(); attacco = matrice(0); affAvv = 0; prossima = 0; oriz = true; ante = null;
      clearTimeout(avvisoT); avviso = null;
      ioPronto = false; avvPronto = false; esitoFine = null; fase = "piazza"; turno = "mio"; render();
    }

    // ---- disegno ----
    function cellaAttacco(x, y) {
      var v = attacco[y][x];
      var cls = "nav-c " + (v === 0 ? (turno === "mio" && fase === "battaglia" ? "sparabile" : "mare") : v === 1 ? "acqua" : v === 3 ? "affondato" : "colpito");
      var txt = v === 1 ? "•" : v === 2 ? "✕" : v === 3 ? "✕" : "";
      var puoi = (v === 0 && fase === "battaglia" && turno === "mio");
      return el("div", { class: cls, onclick: puoi ? function () { sparoIo(x, y); } : null, text: txt });
    }
    function cellaMia(x, y, piazzando) {
      var idx = io.mappa[y][x], colp = io.sparato[y][x];
      var cls = "nav-c ", txt = "";
      if (idx >= 0) {
        var nave = io.navi[idx];
        var orizN = nave.celle.length > 1 && nave.celle[0].y === nave.celle[1].y;
        var pos = 0; for (var k = 0; k < nave.celle.length; k++) if (nave.celle[k].x === x && nave.celle[k].y === y) pos = k;
        var ruolo = pos === 0 ? "a" : (pos === nave.celle.length - 1 ? "b" : "m");
        cls += "sh " + (orizN ? "sh-h " : "sh-v ") + "sh-" + ruolo + (colp ? " shx" : "");
        if (colp) txt = "✕";
      }
      else { cls += colp ? "acqua" : "mare"; if (colp) txt = "•"; }
      if (piazzando) { var a = celleAnte(); if (a && a.set[y * N + x]) { cls = "nav-c " + (a.ok ? "ante" : "antebad"); txt = ""; } }
      var puoi = piazzando && prossima < NTOT;
      return el("div", { class: cls, onclick: puoi ? function () { toccaCella(x, y); } : null, text: txt });
    }
    function tabellone(celleFn, mini) {
      var g = el("div", { class: "nav-board" + (mini ? " nav-mini" : "") });
      g.appendChild(el("div", { class: "nav-lab" }));                                                 // angolo vuoto
      for (var c = 0; c < N; c++) g.appendChild(el("div", { class: "nav-lab", text: String(c + 1) })); // numeri in alto (colonne)
      for (var y = 0; y < N; y++) {
        g.appendChild(el("div", { class: "nav-lab", text: LET[y] }));                                 // lettere a sinistra (righe)
        for (var x = 0; x < N; x++) g.appendChild(celleFn(x, y));
      }
      return g;
    }
    function grigliaAttacco() { return tabellone(cellaAttacco, false); }
    function grigliaMia(piazzando) { return tabellone(function (x, y) { return cellaMia(x, y, piazzando); }, !piazzando); }
    function listaFlotta(mostraStato) {
      var w = el("div", { class: "nav-flotta" });
      FLOTTA.forEach(function (f, i) {
        var giu = mostraStato && io.navi[i] && io.navi[i].affondata;
        var fatta = i < prossima, corr = (i === prossima);
        var cls = "nav-nave" + (mostraStato ? (giu ? " giu" : "") : (fatta ? " fatta" : corr ? " corr" : ""));
        w.appendChild(el("div", { class: cls }, [quadretti(el, f.len, giu), el("span", { text: f.nome })]));
      });
      return w;
    }

    function render() {
      if (fase === "fine") return renderFine();
      if (fase === "piazza") return renderPiazza();
      if (fase === "attesaAvv") return renderAttesa();
      return renderBattaglia();
    }
    function renderPiazza() {
      var box = el("div", {});
      var a = celleAnte();
      box.appendChild(el("div", { class: "nav-tit", text: prossima < NTOT ? "Sistema le tue navi" : "Flotta pronta!" }));
      var sub;
      if (prossima >= NTOT) sub = "Puoi ancora aggiustare, poi premi Pronto.";
      else if (ante && a) sub = a.ok ? ("Anteprima " + FLOTTA[prossima].nome + ": ritocca per confermare, o sposta/ruota.") : "Qui non ci sta: sposta o ruota la nave.";
      else sub = "Tocca dove mettere la " + FLOTTA[prossima].nome + " (" + FLOTTA[prossima].len + " caselle).";
      box.appendChild(el("div", { class: "nav-sub", text: sub }));
      box.appendChild(grigliaMia(true));
      box.appendChild(listaFlotta(false));
      var barra = el("div", { style: "display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px" });
      barra.appendChild(el("button", { class: "btn btn-fantasma", style: "flex:0 1 auto", text: oriz ? "↔️ Orizzontale" : "↕️ Verticale", onclick: ruota }));
      barra.appendChild(el("button", { class: "btn btn-fantasma", style: "flex:0 1 auto", text: "🎲 A caso", onclick: disponiCaso }));
      if (prossima > 0) barra.appendChild(el("button", { class: "btn btn-fantasma", style: "flex:0 1 auto", text: "↩️ Togli", onclick: togliUltima }));
      box.appendChild(barra);
      var piede = [];
      if (prossima >= NTOT) piede.push(el("button", { class: "btn btn-primario", text: "✅ Pronto, si combatte!", onclick: pronto }));
      else if (ante && a && a.ok) piede.push(el("button", { class: "btn btn-primario", text: "✅ Metti qui", onclick: confermaAnte }));
      else piede.push(el("p", { class: "modulo-nota", style: "text-align:center", text: "Tocca il tabellone per posizionare la nave." }));
      monta("piazza", box, piede);
    }
    function renderAttesa() {
      var box = el("div", {});
      box.appendChild(el("div", { class: "nav-tit", text: "Flotta pronta! ⚓" }));
      box.appendChild(el("div", { class: "nav-sub", text: "Aspetto che " + opt.nomeAvv() + " finisca di sistemare le navi…" }));
      box.appendChild(grigliaMia(false));
      box.appendChild(listaFlotta(false));
      monta("attesa", box, []);
    }
    function renderBattaglia() {
      var box = el("div", {});
      if (avviso) box.appendChild(el("div", { class: "nav-avviso", text: avviso }));
      var mieRimaste = io.navi.filter(function (n) { return n && !n.affondata; }).length;
      box.appendChild(el("div", { class: "nav-tit", html: fase === "battaglia" && turno === "mio" ? "🎯 Tocca a te — <b>spara!</b>" : (opt.sonoHost === null ? "🤖 Spara il computer…" : "⏳ Spara " + opt.nomeAvv() + "…") }));
      box.appendChild(el("div", { class: "nav-conta" }, [
        el("div", { html: "Nemico affondate: <b>" + affAvv + "/" + NTOT + "</b>" }),
        el("div", { html: "Tue rimaste: <b>" + mieRimaste + "/" + NTOT + "</b>" })
      ]));
      box.appendChild(grigliaAttacco());
      box.appendChild(el("div", { class: "nav-sub", style: "margin-top:10px", text: "La tua flotta" }));
      box.appendChild(grigliaMia(false));
      monta("battaglia", box, []);
    }
    function renderFine() {
      var box = el("div", {});
      box.appendChild(el("div", { style: "text-align:center;font-size:2.4rem;margin:6px 0", text: esitoFine ? "🏆" : "💥" }));
      box.appendChild(el("div", { class: "nav-tit", text: esitoFine ? "Hai vinto!" : "Hai perso" }));
      box.appendChild(el("div", { class: "nav-sub", text: esitoFine ? "Hai affondato tutta la flotta nemica." : "La tua flotta è stata affondata." }));
      box.appendChild(el("div", { class: "nav-sub", style: "margin-top:8px", text: "La tua griglia" }));
      box.appendChild(grigliaMia(false));
      var piede = [];
      if (opt.rivincita) piede.push(el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: function () { opt.rivincita(rifaiPiazza); } }));
      else if (opt.sonoHost === false) piede.push(el("p", { class: "modulo-nota", text: "In attesa dell'host per la rivincita…" }));
      piede.push(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: opt.onEsci }));
      monta("fine", box, piede);
    }

    function monta(chiave, box, piedeNodi) {
      if (navMount && navMount.chiave === chiave && navMount.cont && document.body.contains(navMount.box)) {
        navMount.cont.replaceChild(box, navMount.box); navMount.box = box;
        navMount.piede.innerHTML = ""; piedeNodi.forEach(function (n) { navMount.piede.appendChild(n); });
      } else {
        var s = t.schermata({ icona: "🚢", titolo: opt.titolo, sotto: opt.sotto(), indietro: function () { if (window.confirm("Uscire dalla partita?")) opt.onEsci(); } });
        s._contenuto.appendChild(box); piedeNodi.forEach(function (n) { s._piede.appendChild(n); }); t.mostra(s);
        navMount = { chiave: chiave, cont: s._contenuto, box: box, piede: s._piede };
      }
    }

    // aggancio esterno (bot/online) → oggetto di controllo
    return {
      setCanale: function (c) { canale = c; },
      setTurno: function (v) { turno = v; },
      ricevi: ricevi, daRete: daRete, rifaiPiazza: rifaiPiazza,
      startRender: render,
      statoIo: function () { return io; }
    };
  }

  // =========================================================
  //  CONTRO IL COMPUTER
  // =========================================================
  function controBot(t, liv) {
    navMount = null;
    var bot = flottaCasuale();      // la flotta del bot (segreta)
    var mem = { coda: [] };
    var ioPrimo = Math.random() < 0.5;
    var G;                          // assegnato sotto (il canale/botTurno lo usano solo a runtime)
    function botTurno() { var c = botSceglie(G.statoIo(), mem, liv); if (c) G.ricevi({ t: "colpo", x: c.x, y: c.y }); }
    // canale verso il "bot": risponde ai miei colpi e ogni tanto spara
    var canale = {
      manda: function (msg) {
        if (msg.t !== "colpo") return;            // io sparo al bot
        setTimeout(function () {
          var e = applicaColpo(bot, msg.x, msg.y);
          G.ricevi({ t: "esito", x: msg.x, y: msg.y, e: e.e, celle: e.celle || null, nome: e.nome || null, persa: !!e.persa });
          if (!e.persa) setTimeout(botTurno, 650);
        }, 420);
      },
      esitoBot: function (info) { botDopo(mem, info.x, info.y, info, liv); } // il bot registra l'esito del suo colpo su di me
    };
    G = nuovoGioco(t, {
      titolo: "Battaglia Navale", sotto: function () { return "Tu contro il computer"; },
      nomeAvv: function () { return "il computer"; },
      sonoHost: null, invia: null,
      onEsci: function () { t.esci(); },
      rivincita: function (reset) { bot = flottaCasuale(); mem = { coda: [] }; ioPrimo = Math.random() < 0.5; reset(); },
      startBot: function () { if (ioPrimo) { G.setTurno("mio"); } else { G.setTurno("attesa"); setTimeout(botTurno, 750); } }
    });
    G.setCanale(canale);
    G.startRender();
  }

  // =========================================================
  //  ONLINE — host apre la stanza, ospite entra (peer-to-peer)
  // =========================================================
  function hostNavale(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    navMount = null;
    var el = t.el;
    var L = { fase: "lobby", codice: "…", pronta: false, avvId: null, nomiIo: (t.giocatori && t.giocatori[0]) || "Host", nomiAvv: null };
    var G = null, rete = null;
    rete = SGNet.ospita("navale", {
      onCodice: function (c) { L.codice = c; if (L.fase === "lobby") lobby(); mandaSala(); },
      onConnesso: function () { L.pronta = true; if (L.fase === "lobby") lobby(); },
      onAddio: function (id) { if (id === L.avvId) { L.avvId = null; L.nomiAvv = null; if (L.fase === "lobby") lobby(); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!L.avvId) { L.avvId = id; L.nomiAvv = String(m.nome || "Avversario").slice(0, 16); } mandaSala(); if (L.fase === "lobby") lobby(); }
        else if (G) G.daRete(m);
      },
      onErrore: function () { senzaRete(t); }
    });
    function mandaSala() { rete.invia({ t: "sala", nomiHost: L.nomiIo, nomiAvv: L.nomiAvv, ci: !!L.avvId }); }
    function lobby() { lobbyNavale(t, { sonoHost: true, codice: L.codice, pronta: L.pronta, avversario: !!L.avvId, nomiIo: L.nomiIo, nomiAvv: L.nomiAvv,
      onComincia: comincia, onEsci: function () { rete.chiudi(); t.esci(); } }); }
    function comincia() {
      if (!L.avvId) return;
      rete.inviaVeloce({ t: "piazza" });
      avviaMotore(true);
    }
    function avviaMotore(sonoHost) {
      L.fase = "gioco";
      G = nuovoGioco(t, {
        titolo: "Battaglia Navale", sotto: function () { return "Online · " + L.nomiIo + " vs " + (L.nomiAvv || "Avversario"); },
        nomeAvv: function () { return L.nomiAvv || "l'avversario"; },
        sonoHost: sonoHost,
        invia: function (msg) { rete.inviaVeloce(msg); },
        onEsci: function () { rete.chiudi(); t.esci(); },
        rivincita: function (reset) { rete.inviaVeloce({ t: "rivincita" }); reset(); }
      });
      G.setCanale({ manda: function (msg) { rete.inviaVeloce(msg); } });
      G.startRender();
    }
    lobby();
  }

  function ospiteNavale(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    navMount = null;
    var el = t.el, S = { myId: null, rete: null, nome: "", msg: null, nomiHost: null, avviato: false };
    var G = null;
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🚢", titolo: "Entra nella Battaglia", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome });
          setTimeout(function () { if (!S.avviato && S.msg) S.msg.textContent = "Non trovo la partita: controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.t === "sala") { S.nomiHost = m.nomiHost; if (!S.avviato) lobby(m); }
          else if (m.t === "piazza") { if (!S.avviato) avviaMotore(); }
          else if (G) G.daRete(m);
        },
        onChiuso: function () { erroreNav(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { erroreNav(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
    function lobby(sala) {
      lobbyNavale(t, { sonoHost: false, nomiIo: S.nome, nomiAvv: (sala && sala.nomiHost) || "Host",
        onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
    }
    function avviaMotore() {
      S.avviato = true;
      G = nuovoGioco(t, {
        titolo: "Battaglia Navale", sotto: function () { return "Online · " + S.nome + " vs " + (S.nomiHost || "Host"); },
        nomeAvv: function () { return S.nomiHost || "l'host"; },
        sonoHost: false,
        invia: function (msg) { S.rete.invia(msg); },
        onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); },
        rivincita: null
      });
      G.setCanale({ manda: function (msg) { S.rete.invia(msg); } });
      G.startRender();
    }
  }

  // lobby comune (host e ospite) — l'ospite vede la sala con i partecipanti
  function lobbyNavale(t, o) {
    var el = t.el;
    var s = t.schermata({ icona: "🚢", titolo: "Battaglia Navale · Lobby", sotto: "Uno contro uno, ognuno dal suo",
      indietro: function () { if (window.confirm("Uscire?")) o.onEsci(); } });
    if (o.sonoHost) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
      s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (o.codice || "…").toUpperCase() }));
      if (o.codice && o.codice !== "…") {
        var link = SG.creaLink({ gioco: "navale", stanza: o.codice });
        var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
        s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
          onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
        s._contenuto.appendChild(campo);
      }
      s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (o.pronta ? "#69db7c" : "#ffd43b"),
        text: o.pronta ? "🟢 Stanza pronta — manda il codice" : "🟡 Sto aprendo la stanza…" }));
    } else {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin:6px 0 2px", text: "✅ Sei nella stanza" }));
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Chi c'è" }));
    var chi = [{ nome: o.sonoHost ? o.nomiIo : o.nomiAvv, tu: o.sonoHost }, { nome: o.sonoHost ? (o.nomiAvv || null) : o.nomiIo, tu: !o.sonoHost }];
    chi.forEach(function (p) {
      var pres = !!p.nome;
      s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:" + (p.tu ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)") }, [
        el("span", { text: pres ? "🚢" : "…", style: "font-size:1.1rem" }),
        el("span", { style: "flex:1;font-weight:700", text: pres ? (p.nome + (p.tu ? " (tu)" : "")) : "In attesa dell'avversario…" })
      ]));
    });
    if (o.sonoHost) {
      var b = el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: o.onComincia });
      if (!o.avversario) b.setAttribute("disabled", "disabled");
      s._piede.appendChild(b);
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci…" }));
    }
    t.mostra(s);
  }

  function erroreNav(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca contro il computer." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
})();
