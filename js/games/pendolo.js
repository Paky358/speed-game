/* =========================================================
   GIOCO — "Palla a Pendolo" (ispirato a Wii Party)
   Visuale finto-3D su Canvas 2D (stessa per tutti): di spalle in basso,
   la trave a metà schermo con 3 posti, la palla oscilla IN PROFONDITÀ.
   Il lancio ha FORZA FISSA (arriva sempre alla trave) ed è lento: conta
   MIRARE e il TEMPISMO. Chi sta sulla trave si muove ◀ ▶ e SALTA per
   schivare. Vince il lanciatore se li butta giù tutti entro il tempo,
   altrimenti vince chi resta sulla trave.
   Modi: DA SOLO (tu lanci vs 3 bot) e ONLINE (host-autoritativo: in lobby
   ognuno sceglie se lanciare o stare sulla trave; posti liberi = bot).
   ========================================================= */
(function () {
  "use strict";
  var TH_BEAM = 1.0, SWING = 2.0, AIMK = 1.5, AIMG = 2.4, NSEAT = 3, HZ = 50;
  var PEAKD = 1.28, PBEAM = 1.0;   // la palla va OLTRE la trave (picco profondità 1.28); il piano della trave è a p=1.0
  var BEAM_L = 0.14, BEAM_R = 0.86, AIM_SPAN = 0.40, MOVSP = 0.36, BOTSP = 0.22, HITF = 0.075, JUMP = 0.6;
  var COLSEAT = ["#ff6b6b", "#4dabf7", "#51cf66"];
  function diffP(d) {   // dodge: salto dei bot sulla trave · cd/aimErr: IA del lanciatore · durTrave: quanto devi sopravvivere
    return d === "facile"    ? { dodge: 0.032, dur: 40, durTrave: 18, cdMin: 2.0, cdVar: 1.4, aimErr: 0.16 }
         : d === "difficile" ? { dodge: 0.110, dur: 30, durTrave: 22, cdMin: 1.1, cdVar: 0.8, aimErr: 0.045 }
         :                      { dodge: 0.068, dur: 34, durTrave: 20, cdMin: 1.6, cdVar: 1.1, aimErr: 0.10 };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ballXf(a, p) { return 0.5 + a * AIM_SPAN * (0.45 + 0.55 * (p > 1 ? 1 : p)); }
  function beamXf(a) { return clamp(0.5 + a * AIM_SPAN, BEAM_L, BEAM_R); }

  // ---------- suoni ----------
  function tono(f0, f1, dur, tipo, vol) { var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var tt = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = tipo || "square";
      o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f1, tt + dur);
      g.gain.setValueAtTime(vol || 0.18, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
      o.connect(g); g.connect(c.destination); o.start(tt); o.stop(tt + dur + 0.02); } catch (e) {} }
  function whoosh() { tono(680, 260, 0.22, "sine", 0.12); }
  function colpo() { try { if (navigator.vibrate) navigator.vibrate(16); } catch (e) {} tono(420, 110, 0.13, "square", 0.24); }
  function splash() { tono(220, 60, 0.18, "sine", 0.16); }
  function fanfara() { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tono(f, f, 0.16, "triangle", 0.2); }, i * 110); }); }

  // ---------- simulazione (locale e host) ----------
  function mkChars(assign) {   // assign[seat] = id (umano) | null (bot)
    var base = [0.28, 0.5, 0.72], c = [];
    for (var i = 0; i < NSEAT; i++) c.push({ fx: base[i], dir: i % 2 ? -1 : 1, mov: 0, jt: 0, alive: true, human: !!(assign && assign[i]), ctrl: assign ? assign[i] : null });
    return c;
  }
  function nuovoStato(P, chars, aiLanc) { return { th: 0, swinging: false, tSw: 0, aim: 0, aimLock: 0, aimHold: 0, lanciaFlag: false, chars: chars, time: P.dur, fase: "gioco", aiLanc: !!aiLanc, aiTarget: -1, aiCd: 0.8, aiGoal: 0 }; }
  function pDi(ST) { var p = ST.th / TH_BEAM; return p < 0 ? 0 : p > 1.4 ? 1.4 : p; }
  function passo(ST, dt, P) {
    ST.time -= dt; if (ST.time < 0) ST.time = 0;
    if (ST.aiLanc) {   // il lanciatore è un bot: prende di mira DOVE SEI ORA (mira fissa), poi lancia:
      if (!ST.swinging) {                                       // se ti muovi in tempo lo schivi.
        var tg = ST.chars[ST.aiTarget];
        if (!tg || !tg.alive) { var al = []; for (var a = 0; a < ST.chars.length; a++) if (ST.chars[a].alive) al.push(a);
          ST.aiTarget = al.length ? al[(Math.random() * al.length) | 0] : -1; tg = ST.chars[ST.aiTarget];
          ST.aiGoal = tg ? clamp((tg.fx + (Math.random() * 2 - 1) * P.aimErr - 0.5) / AIM_SPAN, -1, 1) : 0; }   // fissa il punto di mira ORA
        if (tg) { var want = ST.aiGoal;
          ST.aimHold = ST.aim < want - 0.02 ? 1 : ST.aim > want + 0.02 ? -1 : 0; ST.aiCd -= dt;
          if (Math.abs(ST.aim - want) < 0.05 && ST.aiCd <= 0) { ST.lanciaFlag = true; ST.aiCd = P.cdMin + Math.random() * P.cdVar; ST.aiTarget = -1; }
        } else ST.aimHold = 0;
      } else ST.aimHold = 0;
    }
    ST.aim = clamp(ST.aim + ST.aimHold * AIMK * dt, -1, 1);
    var pPrev = pDi(ST);
    if (ST.lanciaFlag && !ST.swinging) { ST.swinging = true; ST.tSw = 0; ST.aimLock = ST.aim; whoosh(); }
    ST.lanciaFlag = false;
    if (ST.swinging) { ST.tSw += dt / SWING; if (ST.tSw >= 1) { ST.swinging = false; ST.tSw = 0; ST.th = 0; } else ST.th = PEAKD * Math.sin(ST.tSw * Math.PI); }
    else ST.th = 0;
    var p = pDi(ST), bxf = beamXf(ST.aimLock);
    var finestra = ST.swinging && ST.tSw < 0.5 && p > 0.68 && p < PBEAM;   // i bot saltano prima dell'andata
    for (var i = 0; i < ST.chars.length; i++) { var c = ST.chars[i]; if (!c.alive) continue;
      if (c.human) c.fx += c.mov * MOVSP * dt;
      else { c.fx += c.dir * BOTSP * dt; if (c.fx < BEAM_L) { c.fx = BEAM_L; c.dir = 1; } if (c.fx > BEAM_R) { c.fx = BEAM_R; c.dir = -1; } }
      c.fx = clamp(c.fx, BEAM_L, BEAM_R);
      if (c.jt > 0) c.jt -= dt;
      if (!c.human && finestra && Math.abs(c.fx - bxf) < 0.16 && c.jt <= 0 && Math.random() < P.dodge) c.jt = JUMP;
    }
    // colpisce ATTRAVERSANDO il piano della trave (p=PBEAM), sia in andata sia in ritorno
    var crossOut = ST.tSw < 0.5 && pPrev < PBEAM && p >= PBEAM;
    var crossBack = ST.tSw >= 0.5 && pPrev > PBEAM && p <= PBEAM;
    if (ST.swinging && (crossOut || crossBack)) {
      for (var j = 0; j < ST.chars.length; j++) { var b = ST.chars[j]; if (!b.alive) continue;
        var aria = b.jt > JUMP * 0.06 && b.jt < JUMP * 0.97;
        if (!aria && Math.abs(b.fx - bxf) < HITF) { b.alive = false; colpo(); }
      }
    }
  }
  function snapDa(ST, ms) {
    return { f: ST.fase, tm: ST.time, ai: ST.aim, ba: ST.swinging ? ST.aimLock : ST.aim, p: +pDi(ST).toFixed(4), sw: ST.swinging ? 1 : 0,
      c: ST.chars.map(function (x) { return { x: +x.fx.toFixed(4), j: +Math.max(0, x.jt).toFixed(3), a: x.alive ? 1 : 0 }; }), ms: (ms == null ? -1 : ms) };
  }
  function vivi(chars) { var n = 0; for (var i = 0; i < chars.length; i++) if (chars[i].a ? chars[i].a : chars[i].alive) n++; return n; }

  // ---------- scena (canvas + controlli, per ruolo) ----------
  function creaScena(t, ruolo, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🎯", titolo: "Palla a Pendolo", sotto: ruolo === "trave" ? "Schiva e resta sulla trave!" : "Mira e butta giù i 3!",
      indietro: function () { if (window.confirm("Uscire dal gioco?")) cb.onEsci(); } });
    var wrap = el("div", { style: "display:flex;justify-content:center" });
    var cv = el("canvas", { style: "touch-action:none;border-radius:14px;display:block;background:#0a3f61" });
    wrap.appendChild(cv); s._contenuto.appendChild(wrap);
    if (ruolo === "trave") {
      var rM = el("div", { style: "display:flex;gap:10px;margin-top:10px" });
      var mSx = el("button", { class: "btn btn-fantasma", style: "flex:1;font-weight:900;font-size:1.2rem", text: "◀" });
      var mDx = el("button", { class: "btn btn-fantasma", style: "flex:1;font-weight:900;font-size:1.2rem", text: "▶" });
      rM.appendChild(mSx); rM.appendChild(mDx); s._piede.appendChild(rM);
      var bSalta = el("button", { class: "btn btn-primario", style: "width:100%;margin-top:8px;font-weight:900", text: "⤴ SALTA" });
      s._piede.appendChild(bSalta);
      s._piede.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Muoviti ◀ ▶ e SALTA quando il mirino punta te!" }));
      hold(mSx, function () { cb.onMov(-1); }, function () { cb.onMov(0); });
      hold(mDx, function () { cb.onMov(1); }, function () { cb.onMov(0); });
      bSalta.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onSalta(); });
    } else {
      var rA = el("div", { style: "display:flex;gap:10px;margin-top:10px" });
      var aSx = el("button", { class: "btn btn-fantasma", style: "flex:1;font-weight:900;font-size:1.2rem", text: "◀" });
      var aDx = el("button", { class: "btn btn-fantasma", style: "flex:1;font-weight:900;font-size:1.2rem", text: "▶" });
      rA.appendChild(aSx); rA.appendChild(aDx); s._piede.appendChild(rA);
      var bLancia = el("button", { class: "btn btn-primario", style: "width:100%;margin-top:8px;font-weight:900", text: "🎯 LANCIA" });
      s._piede.appendChild(bLancia);
      s._piede.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Mira ◀ ▶, poi LANCIA (o tocca il campo). Forza fissa: conta il tempismo." }));
      hold(aSx, function () { cb.onAim(-1); }, function () { cb.onAim(0); });
      hold(aDx, function () { cb.onAim(1); }, function () { cb.onAim(0); });
      bLancia.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onLancia(); });
      var dX = null, mov = 0, tD = 0;
      cv.addEventListener("pointerdown", function (e) { dX = e.clientX; mov = 0; tD = performance.now(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
      cv.addEventListener("pointermove", function (e) { if (dX === null) return; var dx = e.clientX - dX; dX = e.clientX; mov += Math.abs(dx); cb.onAimDrag(dx / (cv.clientWidth || 300)); e.preventDefault(); });
      cv.addEventListener("pointerup", function (e) { if (dX !== null && mov < 14 && performance.now() - tD < 400) cb.onLancia(); dX = null; e.preventDefault(); });
      cv.addEventListener("pointercancel", function () { dX = null; });
    }
    t.mostra(s);
    var ctx = cv.getContext("2d"), ref = { cv: cv, ctx: ctx, W: 0, H: 0, prevA: [], fallers: [], splashes: [], prevSw: 0, ruolo: ruolo };
    function dim() {
      var w = Math.min(460, (window.innerWidth || 360) - 24), rect = cv.getBoundingClientRect();
      var h = clamp((window.innerHeight || 640) - rect.top - 190, 280, 640), dpr = window.devicePixelRatio || 1;
      cv.style.width = w + "px"; cv.style.height = h + "px"; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ref.W = w; ref.H = h;
    }
    dim(); window.addEventListener("resize", dim);
    ref.rimuovi = function () { window.removeEventListener("resize", dim); };
    // tasti (desktop)
    function kd(e) { var k = e.key.toLowerCase();
      if (ruolo === "trave") { if (k === "arrowleft" || k === "a") cb.onMov(-1); else if (k === "arrowright" || k === "d") cb.onMov(1); else if (k === " " || k === "arrowup" || k === "w") { cb.onSalta(); e.preventDefault(); } }
      else { if (k === "arrowleft" || k === "a") cb.onAim(-1); else if (k === "arrowright" || k === "d") cb.onAim(1); else if (k === " " || k === "arrowup" || k === "w") { cb.onLancia(); e.preventDefault(); } } }
    function ku(e) { var k = e.key.toLowerCase();
      if (ruolo === "trave") { if (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d") cb.onMov(0); }
      else { if (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d") cb.onAim(0); } }
    document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
    var rim0 = ref.rimuovi; ref.rimuovi = function () { rim0(); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); };
    return ref;
  }
  function hold(b, giu, su) {
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); giu(); });
    function up(e) { if (e) e.preventDefault(); su(); }
    b.addEventListener("pointerup", up); b.addEventListener("pointerleave", up); b.addEventListener("pointercancel", up);
  }

  // ---------- disegno da snapshot ----------
  function render(ref, S, dt) {
    var W = ref.W, H = ref.H, ctx = ref.ctx;
    var beamY = H * 0.44, waterY = H * 0.56, handsY = H * 0.92, cx = W / 2;
    // morti nuove -> fontanella + splash
    for (var i = 0; i < S.c.length; i++) { var wasA = ref.prevA[i] === undefined ? 1 : ref.prevA[i];
      if (wasA && !S.c[i].a) { ref.fallers.push({ x: S.c[i].x * W, y: beamY, vy: H * 0.15, col: COLSEAT[i], rot: 0 }); }
      ref.prevA[i] = S.c[i].a; }
    if (S.sw && !ref.prevSw) whoosh(); ref.prevSw = S.sw;
    // sfondo
    var g = ctx.createLinearGradient(0, 0, 0, waterY); g.addColorStop(0, "#7cd0ef"); g.addColorStop(1, "#cdeefb");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, waterY);
    var w2 = ctx.createLinearGradient(0, waterY, 0, H); w2.addColorStop(0, "#1f88c2"); w2.addColorStop(1, "#0a3f61");
    ctx.fillStyle = w2; ctx.fillRect(0, waterY, W, H - waterY);
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2;
    for (var k = 0; k < 3; k++) { var yy = waterY + 16 + k * 24; ctx.beginPath();
      for (var x = 0; x <= W; x += 14) ctx.lineTo(x, yy + Math.sin(x * 0.05 + performance.now() * 0.002 + k) * 4); ctx.stroke(); }
    // geometria palla (calcolata prima: serve per lo z-order e per l'ombra)
    var p = S.p, bx = ballXf(S.ba, p) * W, by = handsY + (beamY - handsY) * p, r = H * 0.10 * (1 - 0.5 * (p > 1 ? 1 : p)), sc = 1 - Math.min(1, p) * 0.6;
    function disegnaPalla() {
      ctx.strokeStyle = "rgba(30,20,10,.6)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, handsY); ctx.lineTo(bx, by); ctx.stroke();
      var gg = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.2, bx, by, r); gg.addColorStop(0, "#ff8f6b"); gg.addColorStop(1, "#c0392b");
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.25, 0, 7); ctx.fill();
    }
    // ombra sull'acqua (dietro a tutto)
    ctx.fillStyle = "rgba(0,0,0," + (0.28 * (1 - Math.min(1, p) * 0.6)) + ")"; ctx.beginPath(); ctx.ellipse(bx, waterY + 8, r * 0.9 * sc + 6, r * 0.32 * sc + 3, 0, 0, 7); ctx.fill();
    // trave
    var h = 13, nearW = W * 0.92, farOff = (W - nearW) / 2;
    ctx.fillStyle = "#b5793a"; ctx.beginPath(); ctx.moveTo(farOff, beamY); ctx.lineTo(W - farOff, beamY); ctx.lineTo(W - farOff + 9, beamY + h); ctx.lineTo(farOff - 9, beamY + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#8a5522"; ctx.fillRect(farOff - 9, beamY + h, nearW + 18, 4);
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 7;
    [0.2, 0.8].forEach(function (u) { var px = farOff + nearW * u; ctx.beginPath(); ctx.moveTo(px, beamY + h); ctx.lineTo(px, waterY + 6); ctx.stroke(); });
    // mirino (dove punta il lancio)
    if (S.f === "gioco") { var mx = beamXf(S.ai) * W, my = beamY + 7; ctx.strokeStyle = "rgba(255,70,70,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mx - 9, my); ctx.lineTo(mx + 9, my); ctx.moveTo(mx, my - 9); ctx.lineTo(mx, my + 9); ctx.stroke();
      ctx.fillStyle = "rgba(255,70,70,.22)"; ctx.beginPath(); ctx.arc(mx, my, 6, 0, 7); ctx.fill(); }
    if (p > 1.0) disegnaPalla();   // palla OLTRE la trave: disegnala DIETRO i personaggi
    // personaggi sulla trave
    for (var c = 0; c < S.c.length; c++) { var ch = S.c[c]; if (!ch.a) continue;
      var jy = ch.j > 0 ? -Math.sin((JUMP - ch.j) / JUMP * Math.PI) * H * 0.09 : 0;
      botDis(ctx, ch.x * W, beamY + jy, COLSEAT[c], 1, 0);
      if (c === S.ms) { ctx.fillStyle = "#ffd43b"; ctx.font = "bold 12px system-ui"; ctx.textAlign = "center"; ctx.fillText("TU", ch.x * W, beamY + jy - H * 0.075); ctx.textAlign = "left"; }
    }
    // fontanelle
    for (var f = ref.fallers.length - 1; f >= 0; f--) { var fa = ref.fallers[f]; fa.vy += H * 1.4 * dt; fa.y += fa.vy * dt; fa.rot += dt * 6;
      if (fa.y >= waterY) { splash(); ref.splashes.push({ x: fa.x, y: waterY, r: 6, a: 1 }); ref.fallers.splice(f, 1); } else botDis(ctx, fa.x, fa.y, fa.col, 0.9, fa.rot); }
    for (var q = ref.splashes.length - 1; q >= 0; q--) { var sp = ref.splashes[q]; sp.r += W * 0.20 * dt; sp.a -= dt * 1.6;
      if (sp.a <= 0) ref.splashes.splice(q, 1); else { ctx.strokeStyle = "rgba(255,255,255," + sp.a + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, 7); ctx.stroke(); } }
    if (p <= 1.0) disegnaPalla();   // palla davanti/alla trave: DAVANTI ai personaggi
    // giocatore di spalle (il lanciatore) al centro
    ctx.fillStyle = "#2b2f3a"; ctx.beginPath(); ctx.ellipse(cx, H + H * 0.02, W * 0.16, H * 0.11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#3a4150"; ctx.beginPath(); ctx.arc(cx, H * 0.92, H * 0.05, 0, 7); ctx.fill();
    // HUD
    var nv = vivi(S.c);
    ctx.fillStyle = "#04121c"; ctx.globalAlpha = .5; ctx.fillRect(0, 0, W, 34); ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff"; ctx.font = "bold 18px system-ui"; ctx.textBaseline = "middle";
    ctx.textAlign = "left"; ctx.fillText("⏱️ " + Math.ceil(S.tm) + "s", 12, 17);
    ctx.textAlign = "right"; ctx.fillText((ref.ruolo === "trave" ? "🏃 In piedi: " : "🎯 Bot: ") + nv, W - 12, 17); ctx.textAlign = "left";
  }
  function botDis(ctx, x, y, col, sc, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0, 4, 15, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -13, 14, 17, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffe0c2"; ctx.beginPath(); ctx.arc(0, -32, 9, 0, 7); ctx.fill();
    ctx.fillStyle = "#222"; ctx.fillRect(-5, -34, 3, 3); ctx.fillRect(3, -34, 3, 3);
    ctx.restore();
  }
  function schermataFine(t, ruolo, vinto, testo, cb) {
    if (vinto) fanfara();
    var r = t.schermata({ icona: vinto ? "🏆" : "💦", titolo: vinto ? "Hai vinto!" : "Hai perso", sotto: "Palla a Pendolo" });
    r._contenuto.appendChild(t.el("p", { style: "text-align:center;font-size:1.1rem;line-height:1.5;margin-top:10px", text: testo }));
    if (cb.onRigioca) r._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🔄 Rigioca", onclick: cb.onRigioca }));
    else r._piede.appendChild(t.el("p", { class: "modulo-nota", text: "In attesa dell'host per un'altra partita…" }));
    r._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(r);
  }

  // ========================================================
  //  DA SOLO — tu lanci contro 3 bot
  // ========================================================
  function locale(t, diff, ruolo) {
    ruolo = ruolo === "trave" ? "trave" : "lanciatore";
    var P = diffP(diff), raf = null, vivo = true, last = performance.now(), ST, ref, mySeat;
    if (ruolo === "trave") {   // TU sulla trave (posto 0), un bot lancia, gli altri 2 posti = bot
      ST = nuovoStato(P, mkChars({ 0: "io", 1: null, 2: null }), true); ST.time = P.durTrave; mySeat = 0;
      ref = creaScena(t, "trave", { onAim: function () {}, onAimDrag: function () {}, onLancia: function () {},
        onMov: function (d) { ST.chars[0].mov = d; }, onSalta: function () { if (ST.chars[0].jt <= 0) ST.chars[0].jt = JUMP; },
        onEsci: function () { stop(); t.esci(); } });
    } else {                   // TU lanci contro 3 bot
      ST = nuovoStato(P, mkChars(null), false); mySeat = -1;
      ref = creaScena(t, "lanciatore", { onAim: function (d) { ST.aimHold = d; }, onAimDrag: function (fr) { ST.aim = clamp(ST.aim + fr * AIMG, -1, 1); },
        onLancia: function () { ST.lanciaFlag = true; }, onMov: function () {}, onSalta: function () {},
        onEsci: function () { stop(); t.esci(); } });
    }
    function stop() { vivo = false; if (raf) cancelAnimationFrame(raf); ref.rimuovi(); }
    function loop(now) { if (!vivo) return; var dt = Math.min(0.05, (now - last) / 1000); last = now;
      passo(ST, dt, P); render(ref, snapDa(ST, mySeat), dt);
      if (ruolo === "trave") { if (!ST.chars[0].alive) return fine(false); if (ST.time <= 0) return fine(true); }
      else { var nv = ST.chars.filter(function (x) { return x.alive; }).length; if (nv === 0 || ST.time <= 0) return fine(nv === 0); }
      raf = requestAnimationFrame(loop); }
    function fine(vinto) { stop();
      var testo = ruolo === "trave"
        ? (vinto ? "Sei rimasto sulla trave fino alla fine! 🏆" : "Ti ha beccato: sei finito in acqua! 💦")
        : (vinto ? ("Buttati giù tutti e 3 in " + (P.dur - ST.time).toFixed(1) + "s! 💦") : "Tempo scaduto: non li hai buttati giù tutti. Riprova!");
      schermataFine(t, ruolo, vinto, testo, { onRigioca: function () { locale(t, diff, ruolo); }, onEsci: t.esci }); }
    raf = requestAnimationFrame(loop);
  }

  // ========================================================
  //  ONLINE — host-autoritativo. In lobby ognuno sceglie il ruolo.
  // ========================================================
  function hostPendolo(t, diff, N) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var P = diffP(diff), codice = "…", pronta = false;
    var posti = {}, nomi = { host: (t.giocatori && t.giocatori[0]) || "Host" }, lanc = "host";
    for (var _s = 0; _s < NSEAT; _s++) posti[_s] = null;   // seat -> id | null(bot)
    var fase = "lobby", ST = null, ref = null, raf = null, loop = null, ultimoInvio = 0, last = 0, rete = null;

    function seatDi(id) { for (var s = 0; s < NSEAT; s++) if (posti[s] === id) return s; return -1; }
    function postoLibero() { for (var s = 0; s < NSEAT; s++) if (!posti[s]) return s; return -1; }
    function seggi() { var a = []; for (var s = 0; s < NSEAT; s++) a.push(posti[s] ? { id: posti[s], nome: nomi[posti[s]] } : null); return a; }
    function claim(id) {   // id diventa lanciatore; il vecchio va su un posto libero
      if (lanc === id) return; var vecchio = lanc, sMio = seatDi(id); if (sMio >= 0) posti[sMio] = null;
      lanc = id; var libero = (sMio >= 0) ? sMio : postoLibero(); if (libero >= 0) posti[libero] = vecchio;
    }

    rete = SGNet.ospita("pendolo", {
      onCodice: function (c) { codice = c; lobbyAgg(); },
      onConnesso: function () { pronta = true; lobbyAgg(); },
      onAddio: function (id) { var s = seatDi(id); if (s >= 0) posti[s] = null; if (lanc === id) lanc = "host";
        if (fase === "lobby") { delete nomi[id]; lobbyAgg(); } else if (ST) { var k = seatDi(id); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (fase === "lobby" && seatDi(id) < 0 && lanc !== id) { var p = postoLibero(); if (p >= 0) { posti[p] = id; nomi[id] = String(m.nome || "Amico").slice(0, 16); } } lobbyAgg(); }
        else if (m.t === "vuoiLanciare") { if (fase === "lobby") { nomi[id] = nomi[id] || "Amico"; claim(id); lobbyAgg(); } }
        else if (fase === "gioco" && ST) {
          if (id === lanc) { if (m.t === "aim") ST.aimHold = m.d || 0; else if (m.t === "lancia") ST.lanciaFlag = true; }
          else { var s = seatDi(id); if (s >= 0 && ST.chars[s]) { if (m.t === "mov") ST.chars[s].mov = m.d || 0; else if (m.t === "salta") { if (ST.chars[s].jt <= 0) ST.chars[s].jt = JUMP; } } }
        }
      },
      onErrore: function () { senzaRete(t); }
    });

    function inizia() {
      fase = "gioco"; ST = nuovoStato(P, mkChars(posti));
      rete.invia({ t: "via", lanc: lanc, seggi: seggi(), nomi: nomi });
      for (var s = 0; s < NSEAT; s++) if (posti[s]) rete.invia({ t: "ruolo", to: posti[s], seat: s });
      if (lanc !== "host") rete.invia({ t: "ruolo", to: lanc, seat: -1 });
      var mioRuolo = (lanc === "host") ? "lanciatore" : "trave", mioSeat = seatDi("host");
      ref = creaScena(t, mioRuolo, {
        onAim: function (d) { if (mioRuolo === "lanciatore") ST.aimHold = d; }, onAimDrag: function (fr) { if (mioRuolo === "lanciatore") ST.aim = clamp(ST.aim + fr * AIMG, -1, 1); },
        onLancia: function () { if (mioRuolo === "lanciatore") ST.lanciaFlag = true; },
        onMov: function (d) { if (mioSeat >= 0 && ST.chars[mioSeat]) ST.chars[mioSeat].mov = d; },
        onSalta: function () { if (mioSeat >= 0 && ST.chars[mioSeat] && ST.chars[mioSeat].jt <= 0) ST.chars[mioSeat].jt = JUMP; },
        onEsci: function () { chiudi(); t.esci(); }
      });
      last = performance.now(); loop = requestAnimationFrame(giro);
    }
    function giro(now) {
      if (fase !== "gioco") return; var dt = Math.min(0.05, (now - last) / 1000); last = now;
      passo(ST, dt, P);
      var mioSeat = seatDi("host"), snap = snapDa(ST, mioSeat);
      render(ref, snap, dt);
      if (now - ultimoInvio > HZ) { ultimoInvio = now; rete.inviaVeloce({ t: "g", s: snap, lanc: lanc, seggi: seggi() }); }
      var nv = ST.chars.filter(function (x) { return x.alive; }).length;
      if (nv === 0 || ST.time <= 0) return fineGioco(nv === 0);
      loop = requestAnimationFrame(giro);
    }
    function fineGioco(vintoLanc) {
      fase = "fine"; if (loop) cancelAnimationFrame(loop);
      var survSeat = {}; for (var s = 0; s < NSEAT; s++) survSeat[s] = ST.chars[s].alive ? 1 : 0;
      rete.invia({ t: "fine", vintoLanc: vintoLanc ? 1 : 0, surv: survSeat, seggi: seggi(), lanc: lanc });
      if (ref) { ref.rimuovi(); ref = null; }
      var hostSeat = seatDi("host"), hostVinto = (lanc === "host") ? vintoLanc : !!survSeat[hostSeat];
      var testo = testoFine(lanc === "host" ? "lanciatore" : "trave", hostVinto, vintoLanc, ST.chars.filter(function (x) { return x.alive; }).length, ST, P);
      schermataFine(t, lanc === "host" ? "lanciatore" : "trave", hostVinto, testo, { onRigioca: function () { tornaLobby(); }, onEsci: function () { chiudi(); t.esci(); } });
    }
    function tornaLobby() { fase = "lobby"; ST = null; lobbyAgg(); }
    function chiudi() { if (loop) cancelAnimationFrame(loop); if (ref) ref.rimuovi(); if (rete) rete.chiudi(); }

    function lobbyAgg() { if (fase !== "lobby") return; rete.invia({ t: "lobby", codice: codice, pronta: pronta, lanc: lanc, seggi: seggi(), nomi: nomi }); disegnaLobby(); }
    function disegnaLobby() { if (fase !== "lobby") return;
      renderLobby(t, { codice: codice, pronta: pronta, sonoHost: true, myId: "host", lanc: lanc, seggi: seggi(), nomi: nomi },
        { onComincia: inizia, onClaim: function () { claim("host"); lobbyAgg(); }, onEsci: function () { chiudi(); t.esci(); } }); }
    disegnaLobby();
  }

  function ospitePendolo(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", ruolo: null, seat: -1, ref: null, fase: null, buf: [], raf: null, lastP: {}, delayMs: 120, lanc: null, seggi: null, msg2: null };
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🎯", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" }); s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {} S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega(); } }));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome }); attesa();
          setTimeout(function () { if (!S.ref && S.fase === null && S.msg2) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.t === "lobby") { S.lanc = m.lanc; S.seggi = m.seggi; if (!S.ref) mostraLobby(m); }
          else if (m.t === "ruolo") { if (m.to === S.myId) { S.seat = m.seat; S.ruolo = (m.seat < 0) ? "lanciatore" : "trave"; } }
          else if (m.t === "via") { S.lanc = m.lanc; S.seggi = m.seggi;
            if (S.lanc === S.myId) { S.ruolo = "lanciatore"; S.seat = -1; } else { S.ruolo = "trave"; for (var i = 0; i < m.seggi.length; i++) if (m.seggi[i] && m.seggi[i].id === S.myId) S.seat = i; }
            S.buf = []; S.lastP = {}; build(); S.fase = "gioco"; }
          else if (m.t === "g") { if (!S.ref || S.fase === "fine") { if (S.fase !== "gioco") { S.lanc = m.lanc; setRuoloDaSeggi(m.seggi); build(); } }
            S.fase = "gioco"; var now = performance.now(); S.buf.push({ rt: now, s: m.s }); while (S.buf.length > 8 && S.buf[0].rt < now - 1500) S.buf.shift(); avviaGiro(); }
          else if (m.t === "fine") { fermaGiro(); if (S.ref) { S.ref.rimuovi(); S.ref = null; } S.fase = "fine";
            var mioVinto = (S.lanc === S.myId) ? !!m.vintoLanc : !!(m.surv && m.surv[S.seat]);
            schermataFine(t, S.ruolo || "trave", mioVinto, testoFineOspite(S, m), { onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } }); }
        },
        onChiuso: function () { fermaGiro(); errore(t, "Collegamento perso. L'host ha chiuso la partita."); },
        onErrore: function () { fermaGiro(); errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function setRuoloDaSeggi(sg) { S.seat = -1; S.ruolo = (S.lanc === S.myId) ? "lanciatore" : "trave";
      if (sg) for (var i = 0; i < sg.length; i++) if (sg[i] && sg[i].id === S.myId) { S.seat = i; S.ruolo = "trave"; } }
    function build() {
      if (S.ref) S.ref.rimuovi();
      S.ref = creaScena(t, S.ruolo || "trave", {
        onAim: function (d) { if (S.ruolo === "lanciatore" && S.rete) S.rete.invia({ t: "aim", d: d }); }, onAimDrag: function () {},
        onLancia: function () { if (S.ruolo === "lanciatore" && S.rete) S.rete.invia({ t: "lancia" }); },
        onMov: function (d) { if (S.ruolo === "trave" && S.rete) S.rete.invia({ t: "mov", d: d }); },
        onSalta: function () { if (S.ruolo === "trave" && S.rete) S.rete.invia({ t: "salta" }); },
        onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); }
      });
    }
    function vistaOra(now) {   // interpola gli snapshot (movimento liscio come Horto)
      var b = S.buf, last = b[b.length - 1].s, rt = now - S.delayMs;
      function copia(s) { return { f: s.f, tm: s.tm, ai: s.ai, ba: s.ba, p: s.p, sw: s.sw, ms: S.seat, c: s.c.map(function (x) { return { x: x.x, j: x.j, a: x.a }; }) }; }
      if (b.length < 2 || rt <= b[0].rt) return copia(b[0].s);
      var A, B, f;
      if (rt >= b[b.length - 1].rt) { A = b[b.length - 2].s; B = last; f = 1; }
      else { var i = b.length - 2; while (i > 0 && b[i].rt > rt) i--; A = b[i].s; B = b[i + 1].s; f = (rt - b[i].rt) / Math.max(1, b[i + 1].rt - b[i].rt); }
      var out = copia(B); out.p = A.p + (B.p - A.p) * f; out.ai = A.ai + (B.ai - A.ai) * f; out.ba = A.ba + (B.ba - A.ba) * f;
      for (var k = 0; k < out.c.length; k++) if (A.c[k]) { var nx = A.c[k].x + (B.c[k].x - A.c[k].x) * f;
        if (S.lastP[k] != null && B.c[k].a && out.c[k].a && Math.abs(nx - S.lastP[k]) < 0.5) {} out.c[k].x = nx; S.lastP[k] = nx; }
      return out;
    }
    function giro(now) { S.raf = requestAnimationFrame(giro); if (!S.ref || !S.buf.length || S.fase === "fine") return;
      var dt = Math.min(0.05, (now - (S._last || now)) / 1000); S._last = now; render(S.ref, vistaOra(now), dt); }
    function avviaGiro() { if (!S.raf) { S._last = performance.now(); S.raf = requestAnimationFrame(giro); } }
    function fermaGiro() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = null; }
    function mostraLobby(m) { renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, lanc: m.lanc, seggi: m.seggi, nomi: m.nomi },
      { onClaim: function () { if (S.rete) S.rete.invia({ t: "vuoiLanciare" }); }, onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); } }); }
    function attesa() { if (S.ref) return;
      var s = t.schermata({ icona: "🎯", titolo: "Palla a Pendolo · Sala", sotto: "Stanza " + codice.toUpperCase(), indietro: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" }); s._contenuto.appendChild(S.msg2); t.mostra(s); }
  }

  function testoFine(ruolo, vinto, vintoLanc, rimasti, ST, P) {
    if (ruolo === "lanciatore") return vinto ? ("Buttati giù tutti in " + (P.dur - ST.time).toFixed(1) + "s! 💦") : ("Tempo scaduto: " + rimasti + " ancora in piedi. Riprova!");
    return vinto ? "Sei rimasto sulla trave fino alla fine! 🏆" : "Sei finito in acqua! 💦";
  }
  function testoFineOspite(S, m) {
    if (S.ruolo === "lanciatore") return m.vintoLanc ? "Li hai buttati giù tutti! 💦" : "Tempo scaduto: qualcuno è rimasto in piedi.";
    return (m.surv && m.surv[S.seat]) ? "Sei rimasto sulla trave fino alla fine! 🏆" : "Sei finito in acqua! 💦";
  }

  // lobby con scelta del ruolo
  function renderLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🎯", titolo: "Palla a Pendolo · Sala", sotto: "Ognuno dal suo telefono",
      indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
    if (vm.sonoHost) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
      s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
      if (vm.codice && vm.codice !== "…") { var link = SG.creaLink({ gioco: "pendolo", stanza: vm.codice });
        var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
        s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
          onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
        s._contenuto.appendChild(campo); }
      s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (vm.pronta ? "#69db7c" : "#ffd43b"), text: vm.pronta ? "🟢 Stanza pronta — manda il codice" : "🟡 Sto aprendo la stanza…" }));
    } else {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin-bottom:2px", text: "✅ Sei nella stanza " + (vm.codice || "").toUpperCase() }));
    }
    // lanciatore
    var lNome = (vm.nomi && vm.nomi[vm.lanc]) || (vm.lanc === "host" ? "Host" : "Amico");
    var ioLanc = vm.lanc === vm.myId;
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "🎯 Chi lancia" }));
    s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;margin-bottom:6px;background:" + (ioLanc ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)") + (ioLanc ? ";border:1px solid var(--accento)" : "") }, [
      el("span", { text: "🎯" }), el("span", { style: "flex:1;font-weight:800", text: lNome + (ioLanc ? " (tu)" : "") })]));
    if (!ioLanc) s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", style: "margin-bottom:8px", text: "🎯 Voglio lanciare io", onclick: cb.onClaim }));
    // trave
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "🏃 Sulla trave (posti liberi = bot)" }));
    (vm.seggi || []).forEach(function (sg, i) {
      var mio = sg && sg.id === vm.myId, nome = sg ? ((vm.nomi && vm.nomi[sg.id]) || sg.nome || "Amico") : "🤖 bot";
      s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:" + (mio ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)") + (mio ? ";border:1px solid var(--accento)" : "") }, [
        el("span", { style: "width:16px;height:16px;border-radius:50%;flex:0 0 auto;background:" + COLSEAT[i % COLSEAT.length] }),
        el("span", { style: "flex:1;font-weight:700", text: nome + (mio ? " (tu)" : "") })]));
    });
    if (vm.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: cb.onComincia }));
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "Cominci quando vuoi: i posti vuoti sulla trave diventano bot." }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci la partita…" }));
    }
    t.mostra(s);
  }

  function errore(t, txt) { var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci })); t.mostra(s); }
  function senzaRete(t) { var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "L'online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca da solo contro i bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci })); t.mostra(s); }

  SG.registra({
    id: "pendolo",
    nome: "Palla a Pendolo",
    icona: "🎯",
    descrizione: "Mira e lancia la palla-pendolo (forza fissa) per buttare in acqua chi sta sulla trave. Da solo vs bot, oppure online: uno lancia, gli altri schivano.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 1,
    etichettaGiocatori: "👤 Da solo o 🔗 online",
    regole: [
      "Sei di spalle: davanti una <b>trave sull'acqua</b> con dei personaggi. La palla appesa oscilla <b>in profondità</b>.",
      "<b>Lanciatore</b>: miri di lato (◀ ▶ o trascini) e premi <b>LANCIA</b>. Il lancio è <b>sempre uguale</b> e lento: conta il tempismo. Il <b>mirino rosso</b> mostra dove cadrà.",
      "<b>Sulla trave</b>: ti muovi <b>◀ ▶</b> e <b>SALTI</b> per schivare quando il mirino punta te.",
      "Vince il <b>lanciatore</b> se li butta giù <b>tutti</b> entro il tempo; altrimenti vince <b>chi resta</b> sulla trave.",
      "<b>Online</b>: in sala d'attesa ognuno sceglie se lanciare o stare sulla trave (i posti liberi li giocano i bot)."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el; dove.modo = "bot"; dove.difficolta = "medio"; dove.ruolo = "lanciatore";
      var bBot, bOnl, notaOnline, boxRuolo, bLanc, bTrave;
      function selM(m) { dove.modo = m; bBot.className = "modo-chip" + (m === "bot" ? " attiva" : ""); bOnl.className = "modo-chip" + (m === "online" ? " attiva" : ""); notaOnline.hidden = (m !== "online"); boxRuolo.hidden = (m !== "bot"); }
      function selR(r) { dove.ruolo = r; bLanc.className = "modo-chip" + (r === "lanciatore" ? " attiva" : ""); bTrave.className = "modo-chip" + (r === "trave" ? " attiva" : ""); }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { selM("bot"); } }, [el("span", { class: "mi", text: "🎯" }), el("div", {}, [el("div", { class: "mt", text: "Da solo" }), el("div", { class: "ms", text: "Contro i bot" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { selM("online"); } }, [el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      boxRuolo = el("div", {});
      boxRuolo.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Il tuo ruolo (da solo)" }));
      bLanc = el("button", { class: "modo-chip attiva", onclick: function () { selR("lanciatore"); } }, [el("span", { class: "mi", text: "🎯" }), el("div", {}, [el("div", { class: "mt", text: "Lanci tu" }), el("div", { class: "ms", text: "Butti giù 3 bot" })])]);
      bTrave = el("button", { class: "modo-chip", onclick: function () { selR("trave"); } }, [el("span", { class: "mi", text: "🏃" }), el("div", {}, [el("div", { class: "mt", text: "Sulla trave" }), el("div", { class: "ms", text: "Schivi il bot che lancia" })])]);
      boxRuolo.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bLanc, bTrave]));
      box.appendChild(boxRuolo);
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
      var w = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center",
          onclick: function () { dove.difficolta = d[0]; [].forEach.call(w.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva"; } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; w.appendChild(b);
      });
      box.appendChild(w);
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile()) ? "Apri una stanza e manda il codice: in sala d'attesa scegliete i ruoli." : "Qui il collegamento non è disponibile: funziona dal sito pubblicato online.";
      box.appendChild(notaOnline);
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospitePendolo(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostPendolo(t, imp.difficolta || "medio", NSEAT);
      return locale(t, imp.difficolta || "medio", imp.ruolo || "lanciatore");
    }
  });
})();
