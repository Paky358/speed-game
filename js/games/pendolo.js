/* =========================================================
   GIOCO — "Palla a Pendolo" (ispirato a Wii Party)
   Da solo, un telefono. Visuale finto-3D su Canvas 2D: sei di spalle
   in basso al centro, la trave a metà schermo con 3 bot che camminano,
   la palla oscilla IN PROFONDITÀ (scala + ombra sull'acqua). Colpisci i
   bot quando la palla raggiunge la profondità della trave; loro saltano
   per schivare. Butta giù tutti e 3 entro il tempo. Controlli touch:
   trascina ↕ sul campo (slancio diretto) o tieni premuto TIRA / SPINGI.
   ========================================================= */
(function () {
  "use strict";
  var K = 7, DAMP = 0.85, PUSH = 10, DRAGG = 5.5, TH_BEAM = 1.0;
  function diffP(d) {
    return d === "facile"    ? { dodge: 0.028, sp: 0.060, dur: 35 }
         : d === "difficile" ? { dodge: 0.078, sp: 0.110, dur: 26 }
         :                      { dodge: 0.050, sp: 0.085, dur: 30 };
  }

  function gioca(t, diff) {
    var el = t.el, P = diffP(diff);
    var s = t.schermata({ icona: "🎯", titolo: "Palla a Pendolo", sotto: "Butta in acqua i 3 bot!",
      indietro: function () { if (window.confirm("Uscire dal gioco?")) { stop(); t.esci(); } } });
    var wrap = el("div", { style: "display:flex;justify-content:center" });
    var cv = el("canvas", { style: "touch-action:none;border-radius:14px;display:block;background:#0a3f61" });
    wrap.appendChild(cv); s._contenuto.appendChild(wrap);
    var riga = el("div", { style: "display:flex;gap:10px;margin-top:10px" });
    var bPull = el("button", { class: "btn btn-fantasma", style: "flex:1;font-weight:800", text: "TIRA ▼" });
    var bPush = el("button", { class: "btn btn-primario", style: "flex:1;font-weight:800", text: "SPINGI ▲" });
    riga.appendChild(bPull); riga.appendChild(bPush); s._piede.appendChild(riga);
    s._piede.appendChild(el("p", { class: "modulo-nota", style: "text-align:center",
      text: "Trascina ↕ sul campo per dare slancio, o tieni premuto TIRA / SPINGI." }));
    t.mostra(s);

    var ctx = cv.getContext("2d"), W = 0, H = 0;
    function dim() {
      var w = Math.min(460, (window.innerWidth || 360) - 24);
      var rect = cv.getBoundingClientRect();
      var h = (window.innerHeight || 640) - rect.top - 150;
      h = h < 300 ? 300 : h > 660 ? 660 : h;
      var dpr = window.devicePixelRatio || 1;
      cv.style.width = w + "px"; cv.style.height = h + "px";
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); W = w; H = h;
    }
    dim();
    function beamY() { return H * 0.44; } function handsY() { return H * 0.92; } function waterY() { return H * 0.56; }
    function cx() { return W / 2; }

    // ---- stato ----
    var th, thv, push, bots, fallers, splashes, time, state, last, raf = null, vivo = true;
    function nuovoBot(fx, dir, col) { return { x: W * fx, dir: dir, sp: W * (P.sp + Math.random() * 0.03), col: col, jt: 0, alive: true }; }
    function reset() {
      th = 0; thv = 0; push = 0; fallers = []; splashes = []; time = P.dur; state = "play"; last = performance.now();
      bots = [nuovoBot(0.30, 1, "#ff6b6b"), nuovoBot(0.55, -1, "#4dabf7"), nuovoBot(0.72, 1, "#51cf66")];
    }
    function pv() { var p = th / TH_BEAM; return p < 0 ? 0 : p > 1.08 ? 1.08 : p; }
    reset();

    // ---- controlli ----
    function setPush(d) { push = d; }
    var dragY = null;
    function pDown(e) { dragY = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); }
    function pMove(e) { if (dragY === null) return; var dy = dragY - e.clientY; dragY = e.clientY;
      if (state === "play") { thv += (dy / H) * DRAGG; if (thv > 6) thv = 6; if (thv < -6) thv = -6; } e.preventDefault(); }
    function pUp() { dragY = null; }
    cv.addEventListener("pointerdown", pDown); cv.addEventListener("pointermove", pMove);
    cv.addEventListener("pointerup", pUp); cv.addEventListener("pointercancel", pUp);
    function bind(b, dir) {
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); setPush(dir); });
      function up(e) { if (e) e.preventDefault(); setPush(0); }
      b.addEventListener("pointerup", up); b.addEventListener("pointerleave", up); b.addEventListener("pointercancel", up);
    }
    bind(bPush, 1); bind(bPull, -1);
    function suTasto(e) { var k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") { setPush(1); e.preventDefault(); }
      else if (k === "arrowdown" || k === "s") { setPush(-1); e.preventDefault(); } }
    function suRilascio(e) { var k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w" || k === "arrowdown" || k === "s") setPush(0); }
    document.addEventListener("keydown", suTasto); document.addEventListener("keyup", suRilascio);
    window.addEventListener("resize", dim);
    function stop() {
      vivo = false; if (raf) cancelAnimationFrame(raf); raf = null;
      document.removeEventListener("keydown", suTasto); document.removeEventListener("keyup", suRilascio);
      window.removeEventListener("resize", dim);
    }

    // ---- passo fisico ----
    function step(dt) {
      time -= dt; if (time < 0) time = 0;
      var pPrev = pv();
      thv += (push * PUSH - K * Math.sin(th) - DAMP * thv) * dt; th += thv * dt;
      if (th < -0.45) { th = -0.45; thv = 0; } if (th > 1.4) { th = 1.4; thv *= -0.3; }
      var p = pv(), incoming = (thv > 0 && p > 0.5 && p < 0.95);
      for (var i = 0; i < bots.length; i++) { var b = bots[i]; if (!b.alive) continue;
        b.x += b.dir * b.sp * dt;
        if (b.x < W * 0.14) { b.x = W * 0.14; b.dir = 1; } if (b.x > W * 0.86) { b.x = W * 0.86; b.dir = -1; }
        if (b.jt > 0) b.jt -= dt;
        if (incoming && Math.abs(b.x - cx()) < W * 0.17 && b.jt <= 0 && Math.random() < P.dodge) b.jt = 0.55;
      }
      if (thv > 0 && pPrev < 0.9 && p >= 0.9) {
        for (var j = 0; j < bots.length; j++) { var bb = bots[j]; if (!bb.alive) continue;
          var aria = bb.jt > 0.12 && bb.jt < 0.5;
          if (!aria && Math.abs(bb.x - cx()) < W * 0.12) { bb.alive = false; frusta();
            fallers.push({ x: bb.x, y: beamY(), vy: H * 0.15, col: bb.col, rot: 0 }); }
        }
      }
      var vivi = bots.filter(function (x) { return x.alive; }).length;
      if (vivi === 0) fine(true); else if (time <= 0) fine(false);
    }
    function particelle(dt) {
      for (var f = fallers.length - 1; f >= 0; f--) { var fa = fallers[f]; fa.vy += H * 1.4 * dt; fa.y += fa.vy * dt; fa.rot += dt * 6;
        if (fa.y >= waterY()) { splash(); splashes.push({ x: fa.x, y: waterY(), r: 6, a: 1 }); fallers.splice(f, 1); } }
      for (var q = splashes.length - 1; q >= 0; q--) { var sp = splashes[q]; sp.r += W * 0.20 * dt; sp.a -= dt * 1.6; if (sp.a <= 0) splashes.splice(q, 1); }
    }

    // ---- suoni ----
    function tono(f0, f1, dur, tipo, vol) { var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
      try { var tt = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = tipo || "square";
        o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f1, tt + dur);
        g.gain.setValueAtTime(vol || 0.18, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
        o.connect(g); g.connect(c.destination); o.start(tt); o.stop(tt + dur + 0.02); } catch (e) {} }
    function frusta() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} tono(420, 120, 0.12, "square", 0.22); }
    function splash() { tono(220, 60, 0.18, "sine", 0.16); }
    function fanfara() { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tono(f, f, 0.16, "triangle", 0.2); }, i * 110); }); }

    // ---- disegno ----
    function bg() {
      var g = ctx.createLinearGradient(0, 0, 0, waterY()); g.addColorStop(0, "#7cd0ef"); g.addColorStop(1, "#cdeefb");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, waterY());
      var w = ctx.createLinearGradient(0, waterY(), 0, H); w.addColorStop(0, "#1f88c2"); w.addColorStop(1, "#0a3f61");
      ctx.fillStyle = w; ctx.fillRect(0, waterY(), W, H - waterY());
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2;
      for (var k = 0; k < 3; k++) { var yy = waterY() + 16 + k * 24; ctx.beginPath();
        for (var x = 0; x <= W; x += 14) ctx.lineTo(x, yy + Math.sin(x * 0.05 + performance.now() * 0.002 + k) * 4); ctx.stroke(); }
    }
    function trave() {
      var by = beamY(), h = 13, nearW = W * 0.92, farOff = (W - nearW) / 2;
      ctx.fillStyle = "#b5793a"; ctx.beginPath();
      ctx.moveTo(farOff, by); ctx.lineTo(W - farOff, by); ctx.lineTo(W - farOff + 9, by + h); ctx.lineTo(farOff - 9, by + h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#8a5522"; ctx.fillRect(farOff - 9, by + h, nearW + 18, 4);
      ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 7;
      [0.2, 0.8].forEach(function (u) { var px = farOff + nearW * u; ctx.beginPath(); ctx.moveTo(px, by + h); ctx.lineTo(px, waterY() + 6); ctx.stroke(); });
    }
    function botDis(x, y, col, sc, rot) {
      ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0, 4, 15, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -13, 14, 17, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#ffe0c2"; ctx.beginPath(); ctx.arc(0, -32, 9, 0, 7); ctx.fill();
      ctx.fillStyle = "#222"; ctx.fillRect(-5, -34, 3, 3); ctx.fillRect(3, -34, 3, 3);
      ctx.restore();
    }
    function draw() {
      bg(); trave();
      for (var i = 0; i < bots.length; i++) { var b = bots[i]; if (!b.alive) continue;
        var jy = b.jt > 0 ? -Math.sin((0.55 - b.jt) / 0.55 * Math.PI) * H * 0.09 : 0;
        botDis(b.x, beamY() + jy, b.col, 1, 0); }
      var p = pv(), bx = cx(), by = handsY() + (beamY() - handsY()) * p, r = H * 0.10 * (1 - 0.5 * (p > 1 ? 1 : p)), sc = 1 - Math.min(1, p) * 0.6;
      ctx.fillStyle = "rgba(0,0,0," + (0.28 * (1 - Math.min(1, p) * 0.6)) + ")";
      ctx.beginPath(); ctx.ellipse(bx, waterY() + 8, r * 0.9 * sc + 6, r * 0.32 * sc + 3, 0, 0, 7); ctx.fill();
      for (var f = 0; f < fallers.length; f++) botDis(fallers[f].x, fallers[f].y, fallers[f].col, 0.9, fallers[f].rot);
      for (var q = 0; q < splashes.length; q++) { var sp = splashes[q]; ctx.strokeStyle = "rgba(255,255,255," + sp.a + ")"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, 7); ctx.stroke(); }
      ctx.strokeStyle = "rgba(30,20,10,.6)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, handsY()); ctx.lineTo(bx, by); ctx.stroke();
      var gg = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.2, bx, by, r); gg.addColorStop(0, "#ff8f6b"); gg.addColorStop(1, "#c0392b");
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.25, 0, 7); ctx.fill();
      ctx.fillStyle = "#2b2f3a"; ctx.beginPath(); ctx.ellipse(bx, H + H * 0.02, W * 0.16, H * 0.11, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#3a4150"; ctx.beginPath(); ctx.arc(bx, H * 0.92, H * 0.05, 0, 7); ctx.fill();
      var vivi = bots.filter(function (x) { return x.alive; }).length;
      ctx.fillStyle = "#04121c"; ctx.globalAlpha = .5; ctx.fillRect(0, 0, W, 34); ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff"; ctx.font = "bold 18px system-ui"; ctx.textBaseline = "middle";
      ctx.textAlign = "left"; ctx.fillText("⏱️ " + Math.ceil(time) + "s", 12, 17);
      ctx.textAlign = "right"; ctx.fillText("🎯 Bot: " + vivi, W - 12, 17); ctx.textAlign = "left";
    }
    function loop(now) { if (!vivo) return; var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (state === "play") step(dt); particelle(dt); draw(); raf = requestAnimationFrame(loop); }

    function fine(vinto) {
      state = vinto ? "win" : "lose";
      if (vinto) fanfara();
      // lascia scorrere l'ultima caduta, poi mostra il risultato
      setTimeout(function () {
        stop();
        var r = t.schermata({ icona: vinto ? "🏆" : "⏱️", titolo: vinto ? "Hai vinto!" : "Tempo scaduto", sotto: "Palla a Pendolo" });
        r._contenuto.appendChild(el("p", { style: "text-align:center;font-size:1.1rem;line-height:1.5;margin-top:10px",
          text: vinto ? ("Hai buttato in acqua tutti e 3 i bot in " + (P.dur - time).toFixed(1) + " secondi! 💦")
                      : ("Sono rimasti " + bots.filter(function (x) { return x.alive; }).length + " bot sulla trave. Riprova!") }));
        r._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rigioca", onclick: function () { gioca(t, diff); } }));
        r._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: t.esci }));
        t.mostra(r);
      }, vinto ? 700 : 500);
    }

    raf = requestAnimationFrame(loop);
  }

  SG.registra({
    id: "pendolo",
    nome: "Palla a Pendolo",
    icona: "🎯",
    descrizione: "Da solo: spingi la palla-pendolo in profondità e butta in acqua i 3 bot sulla trave prima che scada il tempo.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 1,
    etichettaGiocatori: "👤 Da solo · contro 3 bot",
    regole: [
      "Sei di spalle in basso: davanti a te una <b>trave sull'acqua</b> con <b>3 bot</b> che camminano.",
      "La palla appesa oscilla <b>in profondità</b> (avanti e indietro). <b>Trascina ↕</b> col dito o usa <b>TIRA / SPINGI</b> per darle slancio.",
      "Quando la palla arriva <b>alla profondità della trave</b> e centra un bot, lo <b>butta in acqua</b>.",
      "I bot <b>saltano</b> per schivare: cogli il momento giusto!",
      "<b>Vinci</b> se li fai cadere tutti e 3 prima dello scadere del <b>tempo</b>."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el; dove.difficolta = "medio";
      box.appendChild(el("div", { class: "etichetta", text: "Bravura dei bot" }));
      var w = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center",
          onclick: function () { dove.difficolta = d[0]; [].forEach.call(w.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva"; } },
          [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; w.appendChild(b);
      });
      box.appendChild(w);
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:6px", text: "Più i bot sono bravi, più saltano per schivare e meno tempo hai." }));
    },
    avvia: function (t) { var imp = t.impostazioni || {}; gioca(t, imp.difficolta || "medio"); }
  });
})();
