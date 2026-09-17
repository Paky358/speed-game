/* =========================================================
   GIOCO — "Horto Muso" (corsa di cavalli, tipo Derby Dash)
   Corsie DRITTE (niente pista ovale: stessa distanza per tutti).
   Meccanica: velocità di base costante; tasto FRUSTA = boost per un
   istante ma consuma energia; se non frusti si ricarica; a 0 =
   SFINIMENTO (rallenta e frusta bloccata 3s). Vince il primo al traguardo.
   Modalità: contro i bot (1–3) oppure ONLINE (host-autoritativo: l'host
   simula tutto e trasmette le posizioni ~15 volte al secondo; gli ospiti
   mandano solo le frustate). I posti liberi online li giocano i bot.
   Grafica semplice (div + emoji), aggiornata senza rifare la schermata.
   ========================================================= */
(function () {
  "use strict";

  var COLORI = ["#ffd43b", "#ff6b6b", "#4dabf7", "#51cf66", "#cc5de8", "#ff922b", "#20c997", "#f783ac"];
  var MAXN = 8;                          // massimo cavalli al via
  var NOMI_CAV = ["Furia", "Saetta", "Tornado", "Fulmine", "Freccia", "Vento", "Lampo"];
  function altezze(N) {                  // corsie/righe adattive: più cavalli = più basse
    if (N <= 4) return { lane: 56, cav: 1.7, ff: 54, ffcav: 2.7 };
    if (N <= 6) return { lane: 46, cav: 1.45, ff: 44, ffcav: 2.05 };
    return { lane: 38, cav: 1.2, ff: 34, ffcav: 1.6 };
  }
  var V_BASE = 0.055, V_BOOST = 0.165, V_SFIN = 0.018;
  var BOOST_MS = 280, COST = 13, REGEN = 16, REGEN_SFIN = 22, SFIN_MS = 3000, STAM_MAX = 100;
  function botParam(diff) { return { S: diff === "facile" ? 42 : diff === "difficile" ? 18 : 28, I: diff === "facile" ? 520 : diff === "difficile" ? 290 : 350 }; }
  function nomeBot(i) { return "🤖 Bot " + i; }

  function assicuraStile() {
    if (document.getElementById("sg-horto-css")) return;
    var s = document.createElement("style"); s.id = "sg-horto-css";
    s.textContent = [
      ".ho-pista{display:flex;flex-direction:column;gap:8px;margin:6px 0 12px;}",
      ".ho-lane{position:relative;height:56px;border-radius:12px;background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.09));",
        "border:1px solid rgba(255,255,255,.10);overflow:hidden;}",
      ".ho-lane.mia{border-color:var(--accento);box-shadow:0 0 0 1px var(--accento) inset;}",
      ".ho-tragu{position:absolute;top:0;bottom:0;right:8px;width:6px;border-radius:3px;",
        "background:repeating-linear-gradient(45deg,#fff 0 5px,#111 5px 10px);opacity:.85;}",
      ".ho-num{position:absolute;left:7px;top:7px;width:20px;height:20px;border-radius:50%;font-size:.72rem;font-weight:900;",
        "display:flex;align-items:center;justify-content:center;color:#111;z-index:1;}",
      ".ho-nome{position:absolute;left:32px;top:8px;font-size:.72rem;font-weight:800;color:var(--testo-tenue);z-index:1;",
        "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%;}",
      ".ho-cav{position:absolute;bottom:4px;left:1%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px;",
        "transition:left .09s linear;will-change:left;}",
      ".ho-cav .em{font-size:1.7rem;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5));transform:scaleX(-1);}",
      ".ho-cav.sfin .em{opacity:.5;}",
      ".ho-stam{width:46px;height:7px;border-radius:4px;background:rgba(0,0,0,.45);overflow:hidden;border:1px solid rgba(255,255,255,.25);}",
      ".ho-stam .fill{height:100%;width:100%;border-radius:4px;transition:width .1s linear;}",
      ".ho-frusta{width:100%;min-height:76px;border:0;border-radius:18px;cursor:pointer;font-family:inherit;font-weight:900;",
        "font-size:1.5rem;color:#241f00;background:linear-gradient(135deg,#ffe58a,var(--accento) 60%,var(--accento-scuro));",
        "box-shadow:0 8px 22px rgba(224,169,10,.35);-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;}",
      ".ho-frusta:active{transform:scale(.98);}",
      ".ho-frusta:disabled{filter:grayscale(.6);opacity:.7;}",
      ".ho-frusta.sfin{background:linear-gradient(135deg,#ff8787,#c92a2a);color:#fff;}",
      ".ho-info{text-align:center;font-weight:800;min-height:1.4em;margin:2px 0 8px;}",
      // photo-finish (replay zoomato del traguardo prima della classifica)
      ".ho-ff{position:relative;height:236px;border-radius:16px;overflow:hidden;margin:8px 0 4px;",
        "background:radial-gradient(circle at 86% 50%,rgba(255,220,120,.22),rgba(255,255,255,.05));}",
      ".ho-ff-line{position:absolute;top:0;bottom:0;left:86%;width:9px;z-index:1;opacity:.95;",
        "background:repeating-linear-gradient(45deg,#fff 0 6px,#111 6px 12px);}",
      ".ho-ff-lane{position:absolute;left:0;right:0;height:46px;}",
      ".ho-ff-label{position:absolute;left:6px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:6px;z-index:2;max-width:52%;}",
      ".ho-ff-num{width:20px;height:20px;border-radius:50%;font-size:.72rem;font-weight:900;color:#111;",
        "display:flex;align-items:center;justify-content:center;flex:0 0 auto;}",
      ".ho-ff-nome{font-size:.86rem;font-weight:800;color:var(--testo);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".ho-ff-cav{position:absolute;top:50%;left:-15%;transform:translate(-50%,-50%) scaleX(-1);z-index:3;",
        "font-size:2.7rem;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));",
        "transition:left 2.6s cubic-bezier(.3,.55,.35,1);will-change:left;}",
      ".ho-ff-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:6;transition:opacity .55s ease-out;}",
      ".ho-ff-flash.on{opacity:.92;transition:opacity .05s;}",
      ".ho-ff-big{text-align:center;font-size:1.5rem;font-weight:900;min-height:1.6em;margin-top:4px;",
        "opacity:0;transform:scale(.8);transition:opacity .3s,transform .3s;}",
      ".ho-ff-big.show{opacity:1;transform:scale(1);color:var(--accento);}"
    ].join("");
    document.head.appendChild(s);
  }

  function frustaFX() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = "square"; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.07); } catch (e) {} }
  function traguardoFX() { try { if (navigator.vibrate) navigator.vibrate([0, 40, 60, 40]); } catch (e) {}
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { [523, 659, 784, 1046].forEach(function (f, i) { var t = c.currentTime + i * 0.1, o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.2); }); } catch (e) {} }
  function scattoFoto() {   // "clack" dell'otturatore (due click ravvicinati)
    try { if (navigator.vibrate) navigator.vibrate(35); } catch (e) {}
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try {
      function click(at, dur, vol) {
        var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        var src = c.createBufferSource(); src.buffer = b;
        var hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1900;
        var g = c.createGain(); g.gain.value = vol;
        src.connect(hp); hp.connect(g); g.connect(c.destination); src.start(at); src.stop(at + dur + 0.01);
      }
      var t = c.currentTime; click(t, 0.035, 0.55); click(t + 0.075, 0.05, 0.4);
    } catch (e) {}
  }

  // ---------- fisica pura ----------
  function nuovoCav(umano, id) { return { pos: 0, stam: STAM_MAX, boostU: 0, sfin: false, sfinU: 0, umano: !!umano, id: id || null, nextClick: 0, arr: false }; }
  function frusta(h, now) { if (h.sfin || h.arr) return false; h.stam -= COST; h.boostU = now + BOOST_MS; if (h.stam <= 0) { h.stam = 0; h.sfin = true; h.sfinU = now + SFIN_MS; h.boostU = 0; } return true; }
  function botPensa(h, now, S, I) { if (h.sfin || h.arr || now < h.nextClick) return; if (h.stam <= S + Math.random() * 8) return; frusta(h, now); h.nextClick = now + I + Math.random() * 120; }
  function passoTutti(cav, now, dt, S, I, arrivi) {
    for (var k = 0; k < cav.length; k++) {
      var h = cav[k]; if (h.arr) continue;
      if (!h.umano) botPensa(h, now, S, I);
      if (h.sfin && now >= h.sfinU) h.sfin = false;
      var v = h.sfin ? V_SFIN : (now < h.boostU ? V_BOOST : V_BASE);
      h.pos += v * dt;
      if (h.sfin) h.stam = Math.min(STAM_MAX, h.stam + REGEN_SFIN * dt);
      else if (now >= h.boostU) h.stam = Math.min(STAM_MAX, h.stam + REGEN * dt);
      if (h.pos >= 1) { h.pos = 1; h.arr = true; arrivi.push(k); }
    }
  }
  function snap(cav, fase, conto, nomi) {
    return { t: "snap", fase: fase, conto: conto, N: cav.length, nomi: nomi,
      cav: cav.map(function (h) { return { p: +h.pos.toFixed(4), s: Math.round(h.stam), f: h.sfin ? 1 : 0, a: h.arr ? 1 : 0 }; }) };
  }
  function snapFermo(nomi, N, conto, fase) {   // cavalli fermi al via (per il countdown locale)
    var cv = []; for (var k = 0; k < N; k++) cv.push({ p: 0, s: 100, f: 0, a: 0 });
    return { fase: fase, conto: conto, N: N, nomi: nomi, cav: cv };
  }

  // ---------- schermo condiviso (montato una volta; poi aggiorno solo posizioni/barra) ----------
  function costruisci(t, N, nomi, io, cb) {
    assicuraStile(); var el = t.el;
    var s = t.schermata({ icona: "🐎", titolo: "Horto Muso", sotto: "Corsa al galoppo",
      indietro: function () { if (window.confirm("Uscire dalla corsa?")) cb.onEsci(); } });
    var info = el("div", { class: "ho-info", text: "Pronti…" }); s._contenuto.appendChild(info);
    var dim = altezze(N);
    var pista = el("div", { class: "ho-pista" }); var cavEl = [], fillEl = null;
    for (var i = 0; i < N; i++) {
      var lane = el("div", { class: "ho-lane" + (i === io ? " mia" : ""), style: "height:" + dim.lane + "px" });
      lane.appendChild(el("div", { class: "ho-num", style: "background:" + COLORI[i % COLORI.length], text: String(i + 1) }));
      lane.appendChild(el("div", { class: "ho-nome", text: nomi[i] + (i === io ? " (tu)" : "") }));
      lane.appendChild(el("div", { class: "ho-tragu" }));
      var c = el("div", { class: "ho-cav" });
      if (i === io) { var bar = el("div", { class: "ho-stam" }); var f = el("div", { class: "fill", style: "background:#51cf66" }); bar.appendChild(f); c.appendChild(bar); fillEl = f; }
      c.appendChild(el("span", { class: "em", style: "font-size:" + dim.cav + "rem", text: "🐎" }));
      lane.appendChild(c); cavEl[i] = c; pista.appendChild(lane);
    }
    s._contenuto.appendChild(pista);
    var bFr = el("button", { class: "ho-frusta", text: "🚦 Pronti…", disabled: "disabled" });
    bFr.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onFrusta(); });
    s._piede.appendChild(bFr);
    function suTasto(e) { if (e.code === "Space" || e.key === " ") { e.preventDefault(); cb.onFrusta(); } }
    document.addEventListener("keydown", suTasto);
    t.mostra(s);
    return { info: info, cavEl: cavEl, fillEl: fillEl, frusta: bFr, io: io, rimuovi: function () { document.removeEventListener("keydown", suTasto); } };
  }
  function disegna(ref, sn) {
    for (var k = 0; k < sn.N; k++) { var c = sn.cav[k]; if (ref.cavEl[k]) { ref.cavEl[k].style.left = (1 + c.p * 92).toFixed(2) + "%"; ref.cavEl[k].classList.toggle("sfin", !!c.f); } }
    var me = sn.cav[ref.io] || sn.cav[0], b = ref.frusta;
    if (ref.fillEl) { ref.fillEl.style.width = me.s + "%"; ref.fillEl.style.background = me.f ? "#ff6b6b" : (me.s > 40 ? "#51cf66" : me.s > 18 ? "#ffd43b" : "#ff922b"); }
    if (sn.fase === "via") { b.disabled = true; b.className = "ho-frusta"; b.textContent = sn.conto > 0 ? "🚦 " + sn.conto : "VIA! 🏁"; ref.info.textContent = sn.conto > 0 ? String(sn.conto) : "VIA! 🏁"; }
    else if (sn.fase === "corsa") {
      if (me.a) { b.disabled = true; b.className = "ho-frusta"; b.textContent = "🏁 Arrivato!"; }
      else if (me.f) { b.disabled = true; b.className = "ho-frusta sfin"; b.textContent = "😵 SFINITO!"; }
      else { b.disabled = false; b.className = "ho-frusta"; b.textContent = "🏇 FRUSTA! (" + me.s + "%)"; }
      var mx = 0; for (k = 0; k < sn.N; k++) if (sn.cav[k].p > mx) mx = sn.cav[k].p;
      ref.info.textContent = me.p >= mx ? "🥇 Sei in testa!" : "Dai, frusta! 🏇";
    }
  }

  function classificaDa(cav, arrivi) {
    var resto = []; for (var k = 0; k < cav.length; k++) if (arrivi.indexOf(k) < 0) resto.push(k);
    resto.sort(function (a, b) { return cav[b].pos - cav[a].pos; });
    return arrivi.concat(resto);
  }
  // "filmatino" zoomato del traguardo: i primi arrivati scivolano oltre la linea,
  // il vincitore in evidenza; poi si passa alla classifica.
  function fotoFinish(t, ord, nomi, io, foto, poi) {
    var el = t.el, fatto = false, scattato = false, tos = [], rafId = 0;
    var N = foto.length, vincitore = ord[0];
    var dim = altezze(N), rowH = dim.ff;
    var s = t.schermata({ icona: "📸", titolo: "Foto-finish", sotto: "Chi ha tagliato per primo" });
    var strip = el("div", { class: "ho-ff", style: "height:" + (10 + N * rowH + 6) + "px" });
    var lineEl = el("div", { class: "ho-ff-line" }); strip.appendChild(lineEl);
    var flash = el("div", { class: "ho-ff-flash" }); strip.appendChild(flash);
    var cavs = [], targetX = [];
    for (var k = 0; k < N; k++) {
      var vinc = (k === vincitore), mio = (k === io);
      // ZOOM sul traguardo: il vincitore finisce col centro sulla linea (86%), gli altri al DISTACCO REALE
      targetX[k] = Math.max(6, 86 - (1 - Math.min(1, foto[k])) * 240);
      var lane = el("div", { class: "ho-ff-lane" + (vinc ? " win" : ""), style: "top:" + (10 + k * rowH) + "px;height:" + rowH + "px" }, [
        el("div", { class: "ho-ff-label" }, [
          el("span", { class: "ho-ff-num", style: "background:" + COLORI[k % COLORI.length], text: String(k + 1) }),
          el("span", { class: "ho-ff-nome", text: nomi[k] + (mio ? " (tu)" : "") })
        ])
      ]);
      var cav = el("span", { class: "ho-ff-cav", style: "font-size:" + dim.ffcav + "rem", text: "🐎" });
      lane.appendChild(cav); strip.appendChild(lane); cavs.push(cav);
    }
    s._contenuto.appendChild(strip);
    var big = el("div", { class: "ho-ff-big" }); s._contenuto.appendChild(big);
    function vai() { if (fatto) return; fatto = true; if (rafId) cancelAnimationFrame(rafId); tos.forEach(clearTimeout); poi(); }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "Vedi la classifica ▶", onclick: vai }));
    t.mostra(s);
    var winCav = cavs[vincitore];
    // Tutti partono affiancati e vanno alla STESSA velocità: il distacco che si vede è quello VERO
    // (in una gara tirata restano testa a testa e il musetto del vincitore emerge solo sulla linea).
    // Durata lunga = replay lento; ease-out = l'ultimo tratto rallenta (hype).
    tos.push(setTimeout(function () {
      for (var k = 0; k < N; k++) {
        cavs[k].style.transition = "left 4.0s cubic-bezier(.2,.62,.3,1)";
        cavs[k].style.left = targetX[k] + "%";
      }
      controlla();
    }, 90));
    // sicurezza: se rAF non gira (pannello nascosto), scatta quando il vincitore è arrivato alla linea
    tos.push(setTimeout(function () { if (!scattato) congela(); }, 4300));

    function controlla() {                 // rileva il tocco REALE: anche 1px del cavallo oltre la linea
      if (scattato || fatto) return;
      var lr = lineEl.getBoundingClientRect(), hr = winCav.getBoundingClientRect();
      if (hr.width && hr.right >= lr.left + 1) { congela(); return; }
      rafId = requestAnimationFrame(controlla);
    }
    function congela() {                    // FERMA l'immagine dove sono, poi la foto
      if (scattato || fatto) return; scattato = true;
      if (rafId) cancelAnimationFrame(rafId);
      cavs.forEach(function (c) { var L = getComputedStyle(c).left; c.style.transition = "none"; c.style.left = L; });
      void strip.offsetWidth;
      scattoFoto(); flash.classList.add("on"); big.textContent = "📸"; big.classList.add("show");
      setTimeout(function () { flash.classList.remove("on"); }, 70);
      tos.push(setTimeout(riprendi, 1500)); // fermo immagine ~1,5s
      tos.push(setTimeout(vai, 7000));      // dallo scatto: max 7s di replay lento, poi la classifica
    }
    function riprendi() {                   // finisce il replay: TUTTI tagliano il traguardo (nell'ordine)
      var FINISH = 88, sr = strip.getBoundingClientRect();
      cavs.forEach(function (c) {
        var hr = c.getBoundingClientRect();
        var cur = sr.width ? ((hr.left + hr.width / 2) - sr.left) / sr.width * 100 : 80;
        var dur = Math.min(4.8, Math.max(0.6, (FINISH - cur) * 0.09));  // più lento; stessa velocità: tagliano nell'ordine
        c.style.transition = "left " + dur.toFixed(2) + "s linear";
        c.style.left = FINISH + "%";
      });
      tos.push(setTimeout(function () { big.textContent = "🏆 " + nomi[vincitore] + (vincitore === io ? " (tu)" : "") + " vince!"; traguardoFX(); }, 900));
    }
  }
  function finale(t, ord, nomi, io, foto, cb) {
    if (!foto || !foto.length) { foto = []; for (var k = 0; k < nomi.length; k++) foto[k] = (ord.indexOf(k) === 0 ? 1 : 0.9); }
    fotoFinish(t, ord, nomi, io, foto, function () { renderFine(t, ord, nomi, io, cb); });
  }

  function renderFine(t, ord, nomi, io, cb) {
    var el = t.el, mioPosto = ord.indexOf(io) + 1, vinto = mioPosto === 1;
    var s = t.schermata({ icona: vinto ? "🏆" : "🏁", titolo: vinto ? "Hai vinto!" : "Arrivato " + mioPosto + "°", sotto: "Horto Muso" });
    var med = ["🥇", "🥈", "🥉", "4️⃣"];
    var box = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:6px" });
    ord.forEach(function (idx, p) {
      box.appendChild(el("div", { style: "display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:" + (idx === io ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.05)") + (idx === io ? ";border:1px solid var(--accento)" : "") }, [
        el("span", { style: "font-size:1.4rem", text: med[p] || (p + 1 + "°") }),
        el("span", { style: "font-size:1.4rem", text: "🐎" }),
        el("span", { style: "flex:1;font-weight:800", text: nomi[idx] + (idx === io ? " (tu)" : "") })
      ]));
    });
    s._contenuto.appendChild(box);
    if (cb.sonoHost || cb.locale) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rigioca", onclick: cb.onRigioca }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per un'altra corsa…" }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
  }

  // ========================================================
  //  LOCALE — tu (corsia 0) contro 1–3 bot
  // ========================================================
  function corsa(t, nRivali, diff) {
    var N = Math.min(MAXN, 1 + Math.max(1, nRivali));
    var bp = botParam(diff), nomi = [(t.giocatori && t.giocatori[0]) || "Tu"], cav = [nuovoCav(true, "io")];
    for (var i = 1; i < N; i++) { cav.push(nuovoCav(false)); nomi.push("🤖 " + (NOMI_CAV[i - 1] || ("Bot " + i))); }
    var fase = "via", conto = 3, raf = null, toC = null, ultimo = 0, primoArr = 0, finito = false, arrivi = [], foto = null;
    var ref = costruisci(t, N, nomi, 0, {
      onFrusta: function () { if (fase === "corsa" && frusta(cav[0], performance.now())) frustaFX(); },
      onEsci: function () { stop(); t.esci(); }
    });
    function stop() { finito = true; if (raf) cancelAnimationFrame(raf); if (toC) clearInterval(toC); ref.rimuovi(); }
    function frame(ts) {
      if (finito) return;
      if (!ultimo) ultimo = ts;
      var dt = Math.min(0.05, (ts - ultimo) / 1000); ultimo = ts; var now = performance.now();
      passoTutti(cav, now, dt, bp.S, bp.I, arrivi);
      if (arrivi.length && !primoArr) { primoArr = now; foto = cav.map(function (h) { return Math.min(1, h.pos); }); }
      disegna(ref, snap(cav, "corsa", 0, nomi));
      var tutti = cav.every(function (h) { return h.arr; });
      if (tutti || (cav[0].arr && now - primoArr > 4000)) return fine();
      raf = requestAnimationFrame(frame);
    }
    function fine() {
      stop();
      var ord = classificaDa(cav, arrivi);
      finale(t, ord, nomi, 0, foto, { locale: true, onRigioca: function () { corsa(t, nRivali, diff); }, onEsci: t.esci });
    }
    disegna(ref, snap(cav, "via", 3, nomi));
    toC = setInterval(function () {
      if (finito) { clearInterval(toC); return; }
      conto--;
      disegna(ref, snap(cav, "via", Math.max(0, conto), nomi));
      if (conto < 0) { clearInterval(toC); toC = null; fase = "corsa"; ultimo = 0; raf = requestAnimationFrame(frame); }
    }, 700);
  }

  // ========================================================
  //  ONLINE — host = corsia 0; gli ospiti prendono 1..3; i posti
  //  liberi li giocano i bot. Host-autoritativo: simula e trasmette.
  // ========================================================
  function hostHorto(t, diff, N) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    N = Math.max(2, Math.min(MAXN, N || 4));
    var bp = botParam(diff), codice = "…", pronta = false;
    var posti = {}, nomiU = {};
    for (var _s = 1; _s < N; _s++) { posti[_s] = null; nomiU[_s] = null; }
    var cav = null, nomi = null, ref = null, fase = "lobby", conto = 3, loop = null, toC = null, ultimo = 0, primoArr = 0, arrivi = [], ord = null, foto = null, rete = null;

    function seatDi(id) { for (var s = 1; s < N; s++) if (posti[s] === id) return s; return -1; }
    function postoLibero() { for (var s = 1; s < N; s++) if (!posti[s]) return s; return 0; }
    function quanti() { var n = 0; for (var s = 1; s < N; s++) if (posti[s]) n++; return n; }

    rete = SGNet.ospita("horto", {
      onCodice: function (c) { codice = c; aggiornaLobby(); },
      onConnesso: function () { pronta = true; aggiornaLobby(); },
      onAddio: function (id) {
        var s = seatDi(id); if (s < 0) return;
        posti[s] = null;
        if (fase === "lobby") { nomiU[s] = null; aggiornaLobby(); }
        else if (cav) { cav[s].umano = false; nomi[s] = nomeBot(s); }   // il posto passa al bot
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (fase === "lobby" && seatDi(id) < 0) { var p = postoLibero(); if (p > 0) { posti[p] = id; nomiU[p] = String(m.nome || "Amico").slice(0, 16); } }
          aggiornaLobby();   // trasmette la lobby aggiornata a TUTTI (host + ospiti)
        } else if (m.t === "frusta" && fase === "corsa") {
          var sm = seatDi(id); if (sm > 0 && cav[sm] && cav[sm].umano) frusta(cav[sm], performance.now());
        }
      },
      onErrore: function () { senzaRete(t); }
    });

    function inizia() {
      fase = "via"; conto = 3; arrivi = []; primoArr = 0; ord = null; foto = null;
      nomi = [(t.giocatori && t.giocatori[0]) || "Host"]; cav = [nuovoCav(true, "host")];
      for (var s = 1; s < N; s++) {
        if (posti[s]) { cav.push(nuovoCav(true, posti[s])); nomi.push(nomiU[s] || ("Amico " + s)); rete.invia({ t: "seat", to: posti[s], seat: s }); }
        else { cav.push(nuovoCav(false)); nomi.push(nomeBot(s)); }
      }
      rete.invia({ t: "via", nomi: nomi, n: N });   // ogni telefono costruisce la corsa e fa il proprio countdown
      ref = costruisci(t, N, nomi, 0, {
        onFrusta: function () { if (fase === "corsa" && frusta(cav[0], performance.now())) frustaFX(); },
        onEsci: function () { chiudi(); t.esci(); }
      });
      conto = 3; disegna(ref, snap(cav, "via", 3, nomi));
      toC = setInterval(function () {
        conto--; disegna(ref, snap(cav, "via", Math.max(0, conto), nomi));
        if (conto < 0) { clearInterval(toC); toC = null; fase = "corsa"; ultimo = performance.now(); loop = setInterval(tick, 66); }
      }, 800);
    }
    function tick() {
      var now = performance.now(), dt = Math.min(0.1, (now - ultimo) / 1000); ultimo = now;
      passoTutti(cav, now, dt, bp.S, bp.I, arrivi);
      if (arrivi.length && !primoArr) { primoArr = now; foto = cav.map(function (h) { return Math.min(1, h.pos); }); }
      bcast();
      var tutti = cav.every(function (h) { return h.arr; });
      if (tutti || (primoArr && now - primoArr > 5000)) { clearInterval(loop); loop = null; fineCorsa(); }
    }
    function bcast() { var sn = snap(cav, fase, Math.max(0, conto), nomi); rete.inviaVeloce(sn); if (ref) disegna(ref, sn); }
    function fineCorsa() {
      fase = "fine"; ord = classificaDa(cav, arrivi);
      if (!foto) foto = cav.map(function (h) { return Math.min(1, h.pos); });
      rete.invia({ t: "fine", ord: ord, nomi: nomi, foto: foto });
      if (ref) { ref.rimuovi(); ref = null; }
      finale(t, ord, nomi, 0, foto, { sonoHost: true, onRigioca: function () { inizia(); }, onEsci: function () { chiudi(); t.esci(); } });
    }
    function chiudi() { if (loop) clearInterval(loop); if (toC) clearInterval(toC); if (ref) ref.rimuovi(); if (rete) rete.chiudi(); }

    function seggi() {
      var a = [{ nome: (t.giocatori && t.giocatori[0]) || "Host", id: "host" }];
      for (var s = 1; s < N; s++) a.push(posti[s] ? { nome: nomiU[s], id: posti[s] } : null);
      return a;
    }
    function aggiornaLobby() {
      if (fase !== "lobby") return;
      rete.invia({ t: "lobby", codice: codice, pronta: pronta, seggi: seggi() }); // a tutti gli ospiti
      disegnaLobby();
    }
    function disegnaLobby() {
      if (fase !== "lobby") return;
      renderLobby(t, { codice: codice, pronta: pronta, sonoHost: true, myId: "host", seggi: seggi() },
        { onComincia: inizia, onEsci: function () { chiudi(); t.esci(); } });
    }
    disegnaLobby();
  }

  function ospiteHorto(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", mySeat: 0, ref: null, fase: null, nomi: null, N: 0, msg: null,
      buf: [], raf: null, lastP: [], delayMs: 120 };   // buffer per interpolare le posizioni (movimento liscio)
    schermaNome();

    // Calcola la vista da disegnare "adesso - delay" interpolando fra gli snapshot ricevuti.
    // Così, anche se i pacchetti arrivano a intervalli irregolari, il cavallo scorre liscio
    // invece di fermarsi e scattare. Se un pacchetto tarda, prosegue col suo passo (estrapola).
    function vistaOra(now) {
      var b = S.buf, last = b[b.length - 1];
      var out = { fase: last.fase, conto: last.conto, N: last.N, nomi: last.nomi, cav: [] };
      var rt = now - S.delayMs, k;
      if (b.length < 2 || rt <= b[0].rt) {
        for (k = 0; k < b[0].cav.length; k++) { var c0 = b[0].cav[k]; out.cav[k] = { p: c0.p, s: c0.s, f: c0.f, a: c0.a }; }
      } else if (rt >= last.rt) {                 // pacchetto in ritardo: prosegui col passo attuale (max 100ms)
        var P = b[b.length - 2], span = Math.max(1, last.rt - P.rt), ex = Math.min(rt - last.rt, 100);
        for (k = 0; k < last.cav.length; k++) { var cl = last.cav[k], vp = (cl.p - P.cav[k].p) / span; out.cav[k] = { p: Math.min(1, cl.p + vp * ex), s: cl.s, f: cl.f, a: cl.a }; }
      } else {                                    // caso normale: interpola fra i due snapshot che circondano rt
        var i = b.length - 2; while (i > 0 && b[i].rt > rt) i--;
        var A = b[i], B = b[i + 1], f = (rt - A.rt) / Math.max(1, B.rt - A.rt);
        for (k = 0; k < B.cav.length; k++) { var cb = B.cav[k]; out.cav[k] = { p: A.cav[k].p + (cb.p - A.cav[k].p) * f, s: cb.s, f: cb.f, a: cb.a }; }
      }
      for (k = 0; k < out.cav.length; k++) {      // mai indietro: l'estrapolazione non deve far "rinculare" il cavallo
        if (S.lastP[k] != null && out.cav[k].p < S.lastP[k]) out.cav[k].p = S.lastP[k];
        S.lastP[k] = out.cav[k].p;
      }
      return out;
    }
    function giro(now) {
      S.raf = requestAnimationFrame(giro);
      if (!S.ref || !S.buf.length || S.fase === "fine") return;
      disegna(S.ref, vistaOra(now));
    }
    function avviaGiro() { if (!S.raf) S.raf = requestAnimationFrame(giro); }
    function fermaGiro() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = null; }
    function schermaNome() {
      var s = t.schermata({ icona: "🐎", titolo: "Entra nella corsa", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
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
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome }); attesa();
          setTimeout(function () { if (!S.ref && S.fase === null && S.msg2) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.t === "seat") { if (m.to === S.myId) { S.mySeat = m.seat; if (S.ref && S.ref.io !== m.seat) rebuild(); } }
          else if (m.t === "lobby") {
            for (var i = 0; i < (m.seggi || []).length; i++) if (m.seggi[i] && m.seggi[i].id === S.myId) S.mySeat = i;
            if (!S.ref) mostraLobby(m);   // l'ospite vede la stanza come l'host
          }
          else if (m.t === "via") {       // parte la corsa: costruisci e fai il countdown LOCALE (come l'host)
            S.nomi = m.nomi; S.N = m.n || (m.nomi ? m.nomi.length : 4);
            fermaGiro(); S.buf = []; S.lastP = [];   // corsa nuova (anche rivincita): riparto pulito
            build({ nomi: S.nomi, N: S.N }); S.fase = "via"; contoOspite();
          }
          else if (m.t === "snap") {
            if (S.contoTimer) { clearInterval(S.contoTimer); S.contoTimer = null; }
            if (!S.ref || S.fase === "fine") { build(m); S.buf = []; S.lastP = []; }
            S.fase = m.fase;
            var now = performance.now();
            S.buf.push({ rt: now, fase: m.fase, conto: m.conto, N: m.N, nomi: m.nomi, cav: m.cav });
            while (S.buf.length > 8 && S.buf[0].rt < now - 1500) S.buf.shift();
            avviaGiro();
          } else if (m.t === "fine") {
            if (S.contoTimer) { clearInterval(S.contoTimer); S.contoTimer = null; }
            fermaGiro(); S.buf = [];
            if (S.ref) { S.ref.rimuovi(); S.ref = null; } S.fase = "fine";
            finale(t, m.ord, m.nomi, S.mySeat, m.foto, { sonoHost: false, onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
          }
        },
        onChiuso: function () { fermaGiro(); errore(t, "Collegamento perso. L'host potrebbe aver chiuso la corsa."); },
        onErrore: function () { fermaGiro(); errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function build(sn) {
      if (S.ref) S.ref.rimuovi();
      S.nomi = sn.nomi; S.N = sn.N;
      S.ref = costruisci(t, sn.N, sn.nomi, S.mySeat || 0, {
        onFrusta: function () { if (S.fase === "corsa" && S.rete) S.rete.invia({ t: "frusta" }); },
        onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); }
      });
      // l'ospite guida il movimento a 60fps con l'interpolazione: niente transizione CSS
      // (si sommerebbe al ritardo e rifarebbe scattare). L'host invece la tiene, per smussare i suoi 15Hz.
      S.ref.cavEl.forEach(function (c) { c.style.transition = "none"; });
    }
    function rebuild() { if (S.nomi) build({ nomi: S.nomi, N: S.N }); }
    function contoOspite() {   // countdown locale dell'ospite (3-2-1-VIA), poi arrivano le posizioni
      if (S.contoTimer) clearInterval(S.contoTimer);
      var c = 3; disegna(S.ref, snapFermo(S.nomi, S.N, 3, "via"));
      S.contoTimer = setInterval(function () {
        if (!S.ref || S.fase !== "via") { clearInterval(S.contoTimer); S.contoTimer = null; return; }
        c--; disegna(S.ref, snapFermo(S.nomi, S.N, Math.max(0, c), "via"));
        if (c < 0) { clearInterval(S.contoTimer); S.contoTimer = null; }
      }, 800);
    }
    function mostraLobby(m) {
      renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, seggi: m.seggi },
        { onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); } });
    }
    function attesa() {   // placeholder finché non arriva la lobby dall'host
      if (S.ref) return;
      var s = t.schermata({ icona: "🐎", titolo: "Horto Muso · Sala", sotto: "Stanza " + codice.toUpperCase(),
        indietro: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg2); t.mostra(s);
    }
  }

  // lobby uguale per host e ospite: mostra tutti i posti (bot inclusi), evidenzia il proprio.
  function renderLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🐎", titolo: "Horto Muso · Sala", sotto: "Ognuno dal suo telefono",
      indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
    if (vm.sonoHost) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
      s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
      if (vm.codice && vm.codice !== "…") {
        var link = SG.creaLink({ gioco: "horto", stanza: vm.codice });
        var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
        s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
          onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
        s._contenuto.appendChild(campo);
      }
      s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (vm.pronta ? "#69db7c" : "#ffd43b"),
        text: vm.pronta ? "🟢 Stanza pronta — manda il codice" : "🟡 Sto aprendo la stanza…" }));
    } else {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin-bottom:2px", text: "✅ Sei nella stanza " + (vm.codice || "").toUpperCase() }));
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "Cavalli (i posti liberi li giocano i bot)" }));
    (vm.seggi || []).forEach(function (sg, i) {
      var mio = sg && sg.id && sg.id === vm.myId;
      var testo = sg ? ((i === 0 ? "👑 " : "") + sg.nome + (mio ? " (tu)" : "")) : "🤖 bot";
      s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:" + (mio ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)") + (mio ? ";border:1px solid var(--accento)" : "") }, [
        el("span", { style: "width:16px;height:16px;border-radius:50%;flex:0 0 auto;background:" + COLORI[i % COLORI.length] }),
        el("span", { style: "flex:1;font-weight:700", text: "🐎 " + testo })
      ]));
    });
    if (vm.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Comincia la corsa ▶", onclick: cb.onComincia }));
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "Puoi cominciare quando vuoi: i posti vuoti diventano bot." }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci la corsa…" }));
    }
    t.mostra(s);
  }

  function errore(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto corri contro i bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  SG.registra({
    id: "horto",
    nome: "Horto Muso",
    icona: "🐎",
    descrizione: "Corsa di cavalli: frusta per accelerare, ma occhio all'energia! Contro i bot o online, ognuno dal suo telefono.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 1,
    etichettaGiocatori: "👥 1–8 giocatori",   // 1 da solo vs bot, fino a 8 online (i cavalli in gara)
    regole: [
      "Corsie <b>dritte</b>, stessa distanza per tutti: vince davvero il più bravo (niente pista ovale).",
      "I cavalli corrono già da soli a una <b>velocità minima</b>. Tu hai il tasto <b>FRUSTA</b>: ogni click dà una spinta.",
      "Ogni frustata consuma <b>energia</b> (la barra sopra il tuo cavallo). Se non frusti, l'energia si <b>ricarica</b>.",
      "Se l'energia arriva a <b>zero</b> vai in <b>sfinimento</b>: rallenti e per <b>3 secondi</b> non puoi frustare.",
      "Vince il <b>primo</b> che taglia il traguardo. Dosa le frustate!",
      "Da <b>2 a 8 cavalli</b>: <b>contro i bot</b> oppure <b>online</b> (ognuno dal suo telefono; i posti liberi li giocano i bot)."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.cavalli = 4; dove.difficolta = "medio";
      var bBot, bOnl, notaOnline;
      function selM(m) { dove.modo = m; bBot.className = "modo-chip" + (m === "bot" ? " attiva" : ""); bOnl.className = "modo-chip" + (m === "online" ? " attiva" : ""); notaOnline.hidden = (m !== "online"); }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { selM("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro i bot" }), el("div", { class: "ms", text: "Da solo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { selM("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Quanti cavalli in gara" }));
      var wR = el("div", { style: "display:flex;gap:8px" });
      [2, 4, 6, 8].forEach(function (n) {
        var b = el("button", { class: "modo-chip" + (n === 4 ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.cavalli = n; [].forEach.call(wR.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: String(n) })]);
        b.style.flex = "1"; wR.appendChild(b);
      });
      box.appendChild(wR);
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:6px", text: "Online: i posti liberi li riempiono i bot fino a questo numero." }));
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
      var wD = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(wD.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; wD.appendChild(b);
      });
      box.appendChild(wD);
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri una stanza e manda il codice: gli altri corrono dal loro telefono. I posti liberi li giocano i bot."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteHorto(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostHorto(t, imp.difficolta || "medio", imp.cavalli || 4);
      return corsa(t, (imp.cavalli || 4) - 1, imp.difficolta || "medio");
    }
  });
})();
