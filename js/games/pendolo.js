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
  var TH_BEAM = 1.0, SWING = 2.0, AIMK = 1.5, AIMG = 2.4, NSEAT = 3, HZ = 40;   // invii host ~25/s (più fluido per gli ospiti)
  var PEAKD = 1.28, PBEAM = 1.0;   // la palla va OLTRE la trave (picco profondità 1.28); il piano della trave è a p=1.0
  var BEAM_L = 0.14, BEAM_R = 0.86, AIM_SPAN = 0.40, MOVSP = 0.36, BOTSP = 0.22, HITF = 0.075, JUMP = 0.6, JCD = 2.0, MINSEP = 0.11;
  function vuoiMirino() { try { return localStorage.getItem("sg-pendolo-mirino") !== "0"; } catch (e) { return true; } }
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
    for (var i = 0; i < NSEAT; i++) c.push({ fx: base[i], dir: i % 2 ? -1 : 1, mov: 0, jt: 0, jcd: 0, alive: true, human: !!(assign && assign[i]), ctrl: assign ? assign[i] : null });
    return c;
  }
  function nuovoStato(P, chars, aiLanc) { return { th: 0, swinging: false, tSw: 0, aim: 0, aimLock: 0, aimHold: 0, lanciaFlag: false, chars: chars, time: P.dur, fase: "gioco", aiLanc: !!aiLanc, aiTarget: -1, aiCd: 0.8, aiGoal: 0, collis: false }; }
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
      if (c.jt > 0) c.jt -= dt; if (c.jcd > 0) c.jcd -= dt;   // jcd = ricarica del salto (una volta ogni JCD secondi)
      if (!c.human && finestra && Math.abs(c.fx - bxf) < 0.16 && c.jt <= 0 && c.jcd <= 0 && Math.random() < P.dodge) { c.jt = JUMP; c.jcd = JCD; }
    }
    if (ST.collis) {   // i personaggi non si attraversano: separali di almeno MINSEP
      var idx = []; for (var z = 0; z < ST.chars.length; z++) if (ST.chars[z].alive) idx.push(z);
      idx.sort(function (a, b) { return ST.chars[a].fx - ST.chars[b].fx; });
      for (var m = 1; m < idx.length; m++) { var A = ST.chars[idx[m - 1]], B = ST.chars[idx[m]], gap = B.fx - A.fx;
        if (gap < MINSEP) { var push = (MINSEP - gap) / 2;
          A.fx = clamp(A.fx - push, BEAM_L, BEAM_R); B.fx = clamp(B.fx + push, BEAM_L, BEAM_R);
          if (!A.human) A.dir = -1; if (!B.human) B.dir = 1;   // i bot rimbalzano al contatto
        }
      }
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
      c: ST.chars.map(function (x) { return { x: +x.fx.toFixed(4), j: +Math.max(0, x.jt).toFixed(3), cd: +Math.max(0, x.jcd).toFixed(2), a: x.alive ? 1 : 0 }; }), ms: (ms == null ? -1 : ms) };
  }
  function vivi(chars) { var n = 0; for (var i = 0; i < chars.length; i++) if (chars[i].a ? chars[i].a : chars[i].alive) n++; return n; }

  // ---------- avatar: sulla trave si vedono di faccia, chi lancia lo vediamo di spalle ----------
  var MATT = { forma: "uomo", corpo: "medio", pelle: 2, capelli: "ciuffo", colCap: 1, barba: "corta", capo: "felpa", maglia: 1,
    cappello: "cappellino", colAcc: 0, sopracc: "decise", occhi: "furbi", bocca: "ghigno" };   // il bot Matt ha sempre la sua faccia
  var BOT_NOMI = ["Matt", "Sara", "Leo", "Nina"];
  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  var BOT_DONNA = { Sara: "lunghi", Nina: "caschetto" }, BOT_UOMO = { Leo: "corti" };
  function facciaDi(nome, cfg) {
    if (avatarValido(cfg)) return cfg;
    if (nome === "Matt") return MATT;
    if (!window.SGOmino) return null;
    var c = SGOmino.casuale(nome);   // i bot: faccia fissa dal nome, donna o uomo come il nome
    if (BOT_DONNA[nome]) { c.forma = "donna"; c.barba = "no"; c.capelli = BOT_DONNA[nome]; }
    if (BOT_UOMO[nome]) { c.forma = "uomo"; c.capelli = BOT_UOMO[nome]; c.orecchini = "nessuno"; c.cappello = "nessuno"; c.ombretto = c.eyeliner = c.mascara = c.rossetto = c.blush = "nessuno"; if (/gonna/.test(c.sotto)) c.sotto = "jeans"; }
    return c;
  }
  function immagine(cfg) {   // l'avatar come immagine da disegnare sul canvas (pronta dopo un attimo)
    if (!cfg || !window.SGOmino) return null;
    var img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg)); return img;
  }
  function colore(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }
  function scurisci(h, k) {
    var n = parseInt(String(h).slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(v * k))); }
    return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
  }
  // chi lancia, visto DA DIETRO: spalle con la sua maglia, collo, orecchie, nuca coi suoi capelli (corti, medi o lunghi), cappello
  function schiena(ctx, cx, hy, r, cfg) {
    var O = SGOmino.OPZ, pelle = colore(O.pelle, cfg.pelle), cap = colore(O.colCap, cfg.colCap), mag = colore(O.maglia, cfg.maglia);
    var acc = colore(O.colAcc, cfg.colAcc != null ? cfg.colAcc : cfg.maglia);
    var i = O.capelli.indexOf(cfg.capelli), G = SGOmino.GRUPPI_CAPELLI, lung = i >= G[2][1] ? 2 : (i >= G[1][1] ? 1 : 0);
    var calvo = /^(calvo|rasato|chierica)$/.test(cfg.capelli);
    ctx.save();
    // spalle e schiena
    var gm = ctx.createLinearGradient(cx - r * 2.6, 0, cx + r * 2.6, 0);
    gm.addColorStop(0, scurisci(mag, 0.7)); gm.addColorStop(0.45, mag); gm.addColorStop(1, scurisci(mag, 0.6));
    ctx.fillStyle = gm; ctx.strokeStyle = scurisci(mag, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - r * 2.9, hy + r * 5); ctx.quadraticCurveTo(cx - r * 2.8, hy + r * 1.5, cx, hy + r * 1.25);
    ctx.quadraticCurveTo(cx + r * 2.8, hy + r * 1.5, cx + r * 2.9, hy + r * 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.moveTo(cx, hy + r * 1.6); ctx.lineTo(cx, hy + r * 4.5); ctx.stroke();   // piega della schiena
    // collo
    ctx.fillStyle = scurisci(pelle, 0.85); ctx.fillRect(cx - r * 0.42, hy + r * 0.55, r * 0.84, r * 0.85);
    // capelli lunghi che scendono sulla schiena
    if (!calvo && lung === 2) {
      ctx.fillStyle = cap; ctx.beginPath(); ctx.moveTo(cx - r * 1.02, hy); ctx.quadraticCurveTo(cx - r * 1.25, hy + r * 2.2, cx - r * 0.9, hy + r * 3.1);
      ctx.quadraticCurveTo(cx, hy + r * 3.4, cx + r * 0.9, hy + r * 3.1); ctx.quadraticCurveTo(cx + r * 1.25, hy + r * 2.2, cx + r * 1.02, hy); ctx.closePath(); ctx.fill();
    }
    // orecchie e testa
    ctx.fillStyle = pelle;
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(cx + s * r * 0.98, hy + r * 0.08, r * 0.2, r * 0.3, 0, 0, 7); ctx.fill(); });
    var gp = ctx.createRadialGradient(cx - r * 0.3, hy - r * 0.3, r * 0.2, cx, hy, r * 1.05);
    gp.addColorStop(0, pelle); gp.addColorStop(1, scurisci(pelle, 0.8));
    ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(cx, hy, r, 0, 7); ctx.fill();
    // nuca coi capelli
    if (!calvo) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, hy, r * 1.05, 0, 7); ctx.clip();
      var gc = ctx.createRadialGradient(cx - r * 0.35, hy - r * 0.5, r * 0.1, cx, hy, r * 1.2);
      gc.addColorStop(0, cap); gc.addColorStop(1, scurisci(cap, 0.6));
      ctx.fillStyle = gc; ctx.fillRect(cx - r * 1.2, hy - r * 1.2, r * 2.4, r * (lung ? 2.4 : 1.55));
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - r * 0.1, hy - r * 0.2, r * 0.6, 3.5, 4.6); ctx.stroke();
      ctx.restore();
      if (lung === 1) {
        ctx.fillStyle = cap; ctx.beginPath(); ctx.moveTo(cx - r * 1.03, hy); ctx.quadraticCurveTo(cx - r * 1.08, hy + r * 1.1, cx - r * 0.5, hy + r * 1.25);
        ctx.lineTo(cx + r * 0.5, hy + r * 1.25); ctx.quadraticCurveTo(cx + r * 1.08, hy + r * 1.1, cx + r * 1.03, hy); ctx.closePath(); ctx.fill();
      }
    }
    // cappello (visto da dietro: la calotta col colore scelto)
    if (cfg.cappello && cfg.cappello !== "nessuno") {
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(cx, hy - r * 0.05, r * 1.08, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
      ctx.fillStyle = scurisci(acc, 0.7); ctx.fillRect(cx - r * 1.08, hy - r * 0.12, r * 2.16, r * 0.2);
    }
    ctx.restore();
  }

  // ---------- scena (canvas a tutto schermo + comandi sopra l'acqua, per ruolo) ----------
  function assicuraStilePendolo() {
    if (document.getElementById("sg-pendolo-css")) return;
    var st = document.createElement("style"); st.id = "sg-pendolo-css";
    st.textContent = ".schermata.pd-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden}" +
      ".pd-campo{position:relative;width:100%;height:var(--alt,100dvh);overflow:hidden;background:#0a3f61}" +
      ".pd-campo canvas{position:absolute;inset:0;display:block;touch-action:none}" +
      ".pd-comandi{position:absolute;left:0;right:0;bottom:calc(10px + env(safe-area-inset-bottom));display:flex;justify-content:space-between;align-items:flex-end;padding:0 10px;pointer-events:none}" +
      ".pd-comandi > div{display:flex;gap:8px;pointer-events:auto}" +
      ".pd-tasto{width:64px;height:64px;border-radius:18px;border:2px solid rgba(255,255,255,.35);background:rgba(8,20,48,.55);color:#fff;font:inherit;font-size:1.5rem;font-weight:900;touch-action:none;cursor:pointer;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}" +
      ".pd-tasto:active{transform:scale(.94)}" +
      ".pd-tasto.grande{width:auto;min-width:118px;padding:0 16px;font-size:1.05rem;background:linear-gradient(180deg,#ffe57e,#f4b011);color:#3a2500;border-color:#fff2b0}" +
      ".pd-tasto:disabled{opacity:.4}";
    document.head.appendChild(st);
  }
  // av = { posti: [{ cfg, nome } x3], lanc: { cfg, nome } }
  function creaScena(t, ruolo, cb, av) {
    var el = t.el;
    assicuraStilePendolo();
    var s = t.schermata({ indietro: function () { if (window.confirm("Uscire dal gioco?")) cb.onEsci(); } });
    s.classList.add("pd-piena");   // a tutto schermo: niente titolo, niente bordi
    var campo = el("div", { class: "pd-campo" });
    var cv = el("canvas");
    campo.appendChild(cv); s._contenuto.appendChild(campo);
    var comandi = el("div", { class: "pd-comandi" }), sx = el("div"), dx = el("div");
    comandi.appendChild(sx); comandi.appendChild(dx); campo.appendChild(comandi);
    var bSx = el("button", { class: "pd-tasto", text: "◀", "aria-label": ruolo === "trave" ? "Sinistra" : "Mira a sinistra" });
    var bDx = el("button", { class: "pd-tasto", text: "▶", "aria-label": ruolo === "trave" ? "Destra" : "Mira a destra" });
    sx.appendChild(bSx); sx.appendChild(bDx);
    var bSalta = null;
    if (ruolo === "trave") {
      bSalta = el("button", { class: "pd-tasto grande", text: "⤴ SALTA" }); dx.appendChild(bSalta);
      hold(bSx, function () { cb.onMov(-1); }, function () { cb.onMov(0); });
      hold(bDx, function () { cb.onMov(1); }, function () { cb.onMov(0); });
      bSalta.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onSalta(); });
    } else {
      var bLancia = el("button", { class: "pd-tasto grande", text: "🎯 LANCIA" }); dx.appendChild(bLancia);
      hold(bSx, function () { cb.onAim(-1); }, function () { cb.onAim(0); });
      hold(bDx, function () { cb.onAim(1); }, function () { cb.onAim(0); });
      bLancia.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onLancia(); });
      var dX = null, mov = 0, tD = 0;
      cv.addEventListener("pointerdown", function (e) { dX = e.clientX; mov = 0; tD = performance.now(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
      cv.addEventListener("pointermove", function (e) { if (dX === null) return; var ddx = e.clientX - dX; dX = e.clientX; mov += Math.abs(ddx); cb.onAimDrag(ddx / (cv.clientWidth || 300)); e.preventDefault(); });
      cv.addEventListener("pointerup", function (e) { if (dX !== null && mov < 14 && performance.now() - tD < 400) cb.onLancia(); dX = null; e.preventDefault(); });
      cv.addEventListener("pointercancel", function () { dX = null; });
    }
    t.mostra(s);
    av = av || {};
    var posti = [];
    for (var i = 0; i < NSEAT; i++) {
      var p = (av.posti && av.posti[i]) || {}, nome = p.nome || BOT_NOMI[i + 1] || "Bot", cfg = facciaDi(nome, p.cfg);
      posti.push({ nome: nome, cfg: cfg, img: immagine(cfg) });
    }
    var lanc = av.lanc || {};
    var ctx = cv.getContext("2d"), ref = { cv: cv, ctx: ctx, W: 0, H: 0, prevA: [], fallers: [], splashes: [], prevSw: 0, ruolo: ruolo, mirino: vuoiMirino(),
      bSalta: bSalta, posti: posti, lancCfg: facciaDi(lanc.nome || "Matt", lanc.cfg), lancNome: lanc.nome || "Matt", t0: performance.now(),
      aiuto: ruolo === "trave" ? "Muoviti ◀ ▶ e SALTA quando il mirino punta te!" : "Mira ◀ ▶ (o trascina) e LANCIA: conta il tempismo!" };
    function dim() {
      var w = campo.clientWidth || Math.min(window.innerWidth || 360, 600), h = campo.clientHeight || (window.innerHeight || 640), dpr = window.devicePixelRatio || 1;
      cv.style.width = w + "px"; cv.style.height = h + "px"; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ref.W = w; ref.H = h;
    }
    dim(); setTimeout(dim, 120); window.addEventListener("resize", dim);
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
      if (wasA && !S.c[i].a) { ref.fallers.push({ x: S.c[i].x * W, y: beamY, vy: H * 0.15, col: COLSEAT[i], rot: 0, seat: i }); }
      ref.prevA[i] = S.c[i].a; }
    if (S.sw && !ref.prevSw) whoosh(); ref.prevSw = S.sw;
    if (ref.bSalta && S.ms >= 0 && S.c[S.ms]) { var giu = S.c[S.ms].cd > 0; if (ref.bSalta.disabled !== giu) ref.bSalta.disabled = giu; }   // tasto SALTA spento in ricarica
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
    // mirino (dove punta il lancio) — si può nascondere dalle impostazioni
    if (S.f === "gioco" && ref.mirino) { var mx = beamXf(S.ai) * W, my = beamY + 7; ctx.strokeStyle = "rgba(255,70,70,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mx - 9, my); ctx.lineTo(mx + 9, my); ctx.moveTo(mx, my - 9); ctx.lineTo(mx, my + 9); ctx.stroke();
      ctx.fillStyle = "rgba(255,70,70,.22)"; ctx.beginPath(); ctx.arc(mx, my, 6, 0, 7); ctx.fill(); }
    if (p > 1.0) disegnaPalla();   // palla OLTRE la trave: disegnala DIETRO i personaggi
    // personaggi sulla trave
    for (var c = 0; c < S.c.length; c++) { var ch = S.c[c]; if (!ch.a) continue;
      var jy = ch.j > 0 ? -Math.sin((JUMP - ch.j) / JUMP * Math.PI) * H * 0.09 : 0;
      var hA = avH(W, H);
      if (!disegnaAvatar(ctx, ref.posti[c], ch.x * W, beamY + jy, hA, 0)) botDis(ctx, ch.x * W, beamY + jy, COLSEAT[c], 1, 0);
      targhetta(ctx, ch.x * W, beamY + jy - hA * 1.02, c === S.ms ? "TU" : ref.posti[c].nome, COLSEAT[c], c === S.ms);
      if (c === S.ms) { var mxc = ch.x * W;
        if (ch.cd > 0) {   // barretta di ricarica del salto (sopra la testa)
          var bw = W * 0.12, byy = beamY + jy - avH(W, H) * 1.02 - 26, pr = clamp(1 - ch.cd / JCD, 0, 1);
          ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(mxc - bw / 2, byy, bw, 5);
          ctx.fillStyle = "#ffd43b"; ctx.fillRect(mxc - bw / 2, byy, bw * pr, 5);
        }
      }
    }
    // fontanelle
    for (var f = ref.fallers.length - 1; f >= 0; f--) { var fa = ref.fallers[f]; fa.vy += H * 1.4 * dt; fa.y += fa.vy * dt; fa.rot += dt * 6;
      if (fa.y >= waterY) { splash(); ref.splashes.push({ x: fa.x, y: waterY, r: 6, a: 1 }); ref.fallers.splice(f, 1); }
      else if (!disegnaAvatar(ctx, ref.posti[fa.seat], fa.x, fa.y, avH(W, H) * 0.9, fa.rot)) botDis(ctx, fa.x, fa.y, fa.col, 0.9, fa.rot); }
    for (var q = ref.splashes.length - 1; q >= 0; q--) { var sp = ref.splashes[q]; sp.r += W * 0.20 * dt; sp.a -= dt * 1.6;
      if (sp.a <= 0) ref.splashes.splice(q, 1); else { ctx.strokeStyle = "rgba(255,255,255," + sp.a + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, 7); ctx.stroke(); } }
    if (p <= 1.0) disegnaPalla();   // palla davanti/alla trave: DAVANTI ai personaggi
    // chi lancia, visto di spalle in basso al centro (col suo avatar: capelli, pelle, maglia, cappello)
    var rT = Math.min(W * 0.075, H * 0.05);
    if (ref.lancCfg && window.SGOmino) schiena(ctx, cx, H * 0.84, rT, ref.lancCfg);
    else { ctx.fillStyle = "#3a4150"; ctx.beginPath(); ctx.arc(cx, H * 0.92, H * 0.05, 0, 7); ctx.fill(); }
    targhetta(ctx, cx, H * 0.84 - rT * 1.6, ref.ruolo === "lanciatore" ? "TU" : (ref.lancNome || "Matt"), "#ffd43b", ref.ruolo === "lanciatore");
    // aiuto nei primi secondi
    var tA = (performance.now() - ref.t0) / 1000;
    if (tA < 4.5) { ctx.save(); ctx.globalAlpha = Math.min(1, (4.5 - tA) / 0.6); ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var lw = ctx.measureText(ref.aiuto).width + 24; ctx.fillStyle = "rgba(4,18,28,.72)";
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(W / 2 - lw / 2, 44, lw, 28, 14); else ctx.rect(W / 2 - lw / 2, 44, lw, 28); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(ref.aiuto, W / 2, 58.5); ctx.restore(); }
    // HUD
    var nv = vivi(S.c);
    ctx.fillStyle = "#04121c"; ctx.globalAlpha = .5; ctx.fillRect(0, 0, W, 34); ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff"; ctx.font = "bold 18px system-ui"; ctx.textBaseline = "middle";
    ctx.textAlign = "left"; ctx.fillText("⏱️ " + Math.ceil(S.tm) + "s", 58, 17);   // a sinistra c'è il tasto indietro
    ctx.textAlign = "right"; ctx.fillText((ref.ruolo === "trave" ? "🏃 In piedi: " : "🎯 Bot: ") + nv, W - 12, 17); ctx.textAlign = "left";
  }
  function avH(W, H) { return Math.min(H * 0.15, W * 0.3); }   // altezza dell'avatar sulla trave
  // l'avatar vero (immagine SVG) coi piedi sul punto x,y; se ruota (cade) gira attorno al centro
  function disegnaAvatar(ctx, posto, x, y, h, rot) {
    var img = posto && posto.img;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var w = h * 200 / 264;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.2)"; if (!rot) { ctx.beginPath(); ctx.ellipse(x, y + 2, w * 0.3, h * 0.035, 0, 0, 7); ctx.fill(); }
    ctx.translate(x, y - h / 2); if (rot) ctx.rotate(rot);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }
  // targhetta col nome sopra la testa (bordo del colore del posto; "TU" dorato)
  function targhetta(ctx, x, y, testo, col, mio) {
    ctx.save(); ctx.font = "bold 12px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var w = ctx.measureText(testo).width + 16, h = 20;
    ctx.fillStyle = mio ? "#ffd43b" : "rgba(10,18,50,.82)"; ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 10); else ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = mio ? "#3a2500" : "#fff"; ctx.fillText(testo, x, y + 0.5);
    ctx.restore();
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
  function locale(t, diff, ruolo, collis) {
    ruolo = ruolo === "trave" ? "trave" : "lanciatore";
    var P = diffP(diff), raf = null, vivo = true, last = performance.now(), ST, ref, mySeat;
    var io = (t.giocatori && t.giocatori[0]) || "Tu";
    if (ruolo === "trave") {   // TU sulla trave (posto 0), un bot lancia, gli altri 2 posti = bot
      ST = nuovoStato(P, mkChars({ 0: "io", 1: null, 2: null }), true); ST.time = P.durTrave; mySeat = 0;
      ref = creaScena(t, "trave", { onAim: function () {}, onAimDrag: function () {}, onLancia: function () {},
        onMov: function (d) { ST.chars[0].mov = d; }, onSalta: function () { if (ST.chars[0].jt <= 0 && ST.chars[0].jcd <= 0) { ST.chars[0].jt = JUMP; ST.chars[0].jcd = JCD; } },
        onEsci: function () { stop(); t.esci(); } }, { posti: [{ nome: io, cfg: mioAvatar(io) }, { nome: "Sara" }, { nome: "Leo" }], lanc: { nome: "Matt" } });
    } else {                   // TU lanci contro 3 bot
      ST = nuovoStato(P, mkChars(null), false); mySeat = -1;
      ref = creaScena(t, "lanciatore", { onAim: function (d) { ST.aimHold = d; }, onAimDrag: function (fr) { ST.aim = clamp(ST.aim + fr * AIMG, -1, 1); },
        onLancia: function () { ST.lanciaFlag = true; }, onMov: function () {}, onSalta: function () {},
        onEsci: function () { stop(); t.esci(); } }, { posti: [{ nome: "Matt" }, { nome: "Sara" }, { nome: "Leo" }], lanc: { nome: io, cfg: mioAvatar(io) } });
    }
    ST.collis = !!collis;
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
      schermataFine(t, ruolo, vinto, testo, { onRigioca: function () { locale(t, diff, ruolo, collis); }, onEsci: t.esci }); }
    raf = requestAnimationFrame(loop);
  }

  // ========================================================
  //  ONLINE — host-autoritativo. In lobby ognuno sceglie il ruolo.
  // ========================================================
  function hostPendolo(t, diff, N, collis) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var P = diffP(diff), codice = "…", pronta = false;
    var posti = {}, nomi = { host: (t.giocatori && t.giocatori[0]) || "Host" }, lanc = "host";
    var omini = { host: mioAvatar(nomi.host) };   // avatar di chi gioca (id -> cfg)
    for (var _s = 0; _s < NSEAT; _s++) posti[_s] = null;   // seat -> id | null(bot)
    var fase = "lobby", ST = null, ref = null, raf = null, loop = null, ultimoInvio = 0, last = 0, rete = null;

    function seatDi(id) { for (var s = 0; s < NSEAT; s++) if (posti[s] === id) return s; return -1; }
    function postoLibero() { for (var s = 0; s < NSEAT; s++) if (!posti[s]) return s; return -1; }
    function seggi() { var a = []; for (var s = 0; s < NSEAT; s++) a.push(posti[s] ? { id: posti[s], nome: nomi[posti[s]] } : null); return a; }
    function claim(id) {   // id diventa lanciatore; il vecchio va su un posto libero
      if (lanc === id) return; var vecchio = lanc, sMio = seatDi(id); if (sMio >= 0) posti[sMio] = null;
      lanc = id; var libero = (sMio >= 0) ? sMio : postoLibero(); if (libero >= 0) posti[libero] = vecchio;
    }
    // l'host sceglie il proprio ruolo: va nello slot T ("L" = lanciatore, 0..2 = posto sulla trave);
    // chi c'era (bot o giocatore) prende il vecchio posto dell'host. Cosi ci si scambia con bot o giocatori.
    function occSlot(T) { return T === "L" ? lanc : posti[T]; }
    function mettiSlot(T, v) { if (T === "L") lanc = v; else posti[T] = v; }
    function slotDi(id) { if (lanc === id) return "L"; var s = seatDi(id); return s >= 0 ? s : null; }
    function hostVaA(T) {
      var H = slotDi("host"); if (H === T) return;
      var O = occSlot(T);
      mettiSlot(T, "host");
      if (H !== null) mettiSlot(H, O);
      else if (O && O !== "host") { var lib = postoLibero(); if (lib >= 0) posti[lib] = O; }  // di sicurezza
    }

    rete = SGNet.ospita("pendolo", {
      onCodice: function (c) { codice = c; lobbyAgg(); },
      onConnesso: function () { pronta = true; lobbyAgg(); },
      onAddio: function (id) { var s = seatDi(id); if (s >= 0) posti[s] = null;
        if (lanc === id) lanc = (seatDi("host") >= 0) ? null : "host";   // se l'host è sulla trave, lancia un bot
        if (fase === "lobby") { delete nomi[id]; lobbyAgg(); } else if (ST) { var k = seatDi(id); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (fase === "lobby" && seatDi(id) < 0 && lanc !== id) { var p = postoLibero(); if (p >= 0) { posti[p] = id; nomi[id] = String(m.nome || "Amico").slice(0, 16); omini[id] = avatarValido(m.omino); } } lobbyAgg(); }
        else if (m.t === "vuoiLanciare") { if (fase === "lobby") { nomi[id] = nomi[id] || "Amico"; claim(id); lobbyAgg(); } }
        else if (fase === "gioco" && ST) {
          if (id === lanc) { if (m.t === "aim") ST.aimHold = m.d || 0; else if (m.t === "lancia") ST.lanciaFlag = true; }
          else { var s = seatDi(id); if (s >= 0 && ST.chars[s]) { if (m.t === "mov") ST.chars[s].mov = m.d || 0; else if (m.t === "salta") { if (ST.chars[s].jt <= 0 && ST.chars[s].jcd <= 0) { ST.chars[s].jt = JUMP; ST.chars[s].jcd = JCD; } } } }
        }
      },
      onErrore: function () { senzaRete(t); }
    });

    function inizia() {
      fase = "gioco"; ST = nuovoStato(P, mkChars(posti), lanc === null); ST.collis = !!collis;
      var BOT_TRAVE = ["Sara", "Leo", "Nina"], av = { posti: [], lanc: lanc ? { nome: nomi[lanc], cfg: omini[lanc] || null } : { nome: "Matt" } };
      for (var sb = 0; sb < NSEAT; sb++) av.posti.push(posti[sb] ? { nome: nomi[posti[sb]], cfg: omini[posti[sb]] || null } : { nome: (lanc && sb === 0) ? "Matt" : BOT_TRAVE[sb] });   // se lancia un umano, Matt sta sulla trave
      rete.invia({ t: "via", lanc: lanc, seggi: seggi(), nomi: nomi, av: av });
      for (var s = 0; s < NSEAT; s++) if (posti[s] && posti[s] !== "host") rete.invia({ t: "ruolo", to: posti[s], seat: s });
      if (lanc && lanc !== "host") rete.invia({ t: "ruolo", to: lanc, seat: -1 });
      var mioRuolo = (lanc === "host") ? "lanciatore" : "trave", mioSeat = seatDi("host");
      ref = creaScena(t, mioRuolo, {
        onAim: function (d) { if (mioRuolo === "lanciatore") ST.aimHold = d; }, onAimDrag: function (fr) { if (mioRuolo === "lanciatore") ST.aim = clamp(ST.aim + fr * AIMG, -1, 1); },
        onLancia: function () { if (mioRuolo === "lanciatore") ST.lanciaFlag = true; },
        onMov: function (d) { if (mioSeat >= 0 && ST.chars[mioSeat]) ST.chars[mioSeat].mov = d; },
        onSalta: function () { if (mioSeat >= 0 && ST.chars[mioSeat] && ST.chars[mioSeat].jt <= 0 && ST.chars[mioSeat].jcd <= 0) { ST.chars[mioSeat].jt = JUMP; ST.chars[mioSeat].jcd = JCD; } },
        onEsci: function () { chiudi(); t.esci(); }
      }, av);
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
        { onComincia: inizia,
          onHostLanc: function () { hostVaA("L"); lobbyAgg(); },
          onHostSeat: function (i) { hostVaA(i); lobbyAgg(); },
          onEsci: function () { chiudi(); t.esci(); } }); }
    disegnaLobby();
  }

  function ospitePendolo(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", ruolo: null, seat: -1, ref: null, fase: null, buf: [], raf: null, lastP: {}, delayMs: 120, lanc: null, seggi: null, msg2: null, mov: 0, predX: null };
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
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: mioAvatar(S.nome) }); attesa();
          setTimeout(function () { if (!S.ref && S.fase === null && S.msg2) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.t === "lobby") { S.lanc = m.lanc; S.seggi = m.seggi; if (!S.ref) mostraLobby(m); }
          else if (m.t === "ruolo") { if (m.to === S.myId) { S.seat = m.seat; S.ruolo = (m.seat < 0) ? "lanciatore" : "trave"; } }
          else if (m.t === "via") { S.lanc = m.lanc; S.seggi = m.seggi; S.av = m.av || null;
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
      S.predX = null; S.mov = 0;
      if (S.ref) S.ref.rimuovi();
      S.ref = creaScena(t, S.ruolo || "trave", {
        onAim: function (d) { if (S.ruolo === "lanciatore" && S.rete) S.rete.invia({ t: "aim", d: d }); }, onAimDrag: function () {},
        onLancia: function () { if (S.ruolo === "lanciatore" && S.rete) S.rete.invia({ t: "lancia" }); },
        onMov: function (d) { S.mov = d || 0; if (S.ruolo === "trave" && S.rete) S.rete.invia({ t: "mov", d: d }); },
        onSalta: function () { if (S.ruolo === "trave" && S.rete) S.rete.invia({ t: "salta" }); },
        onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); }
      }, S.av);
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
      var dt = Math.min(0.05, (now - (S._last || now)) / 1000); S._last = now;
      var vista = vistaOra(now); prediciMio(vista, dt); render(S.ref, vista, dt); }
    // Predizione locale del MIO personaggio sulla trave: mi muovo subito col mio
    // input (niente attesa del giro di rete) e riconcilio piano verso la posizione
    // autoritativa più fresca dell'host. Salto e cadute restano dell'host.
    function prediciMio(vista, dt) {
      if (!(S.ruolo === "trave" && S.seat >= 0) || !vista || !vista.c) return;
      var c = vista.c[S.seat]; if (!c) return;
      var newest = S.buf.length ? S.buf[S.buf.length - 1].s : null;
      var hc = newest && newest.c ? newest.c[S.seat] : null;
      if (!c.a || !hc || !hc.a) { S.predX = null; return; }   // caduto o dati assenti: nessuna predizione
      if (S.predX == null) S.predX = hc.x;
      S.predX += (S.mov || 0) * MOVSP * dt;
      if (S.predX < BEAM_L) S.predX = BEAM_L; else if (S.predX > BEAM_R) S.predX = BEAM_R;
      S.predX += (hc.x - S.predX) * Math.min(1, 8 * dt);       // riconciliazione morbida
      c.x = S.predX;
    }
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
    // riga di un ruolo (con evidenza se è il mio e, per l'host, tocco per spostarmi lì)
    function rigaRuolo(sinistra, testo, mio, tap, azione) {
      var bg = mio ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)";
      var brd = mio ? ";border:1px solid var(--accento)" : "";
      var cur = tap ? ";cursor:pointer" : "";
      return el("div", { style: "display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;margin-bottom:6px;background:" + bg + brd + cur, onclick: tap ? azione : null }, [
        sinistra,
        el("span", { style: "flex:1;font-weight:800", text: testo }),
        tap ? el("span", { style: "font-size:.82rem;font-weight:800;color:var(--accento)", text: azione._et || "vai qui ▶" }) : null
      ]);
    }
    // lanciatore
    var lBot = !vm.lanc;
    var lNome = lBot ? "🤖 bot" : ((vm.nomi && vm.nomi[vm.lanc]) || (vm.lanc === "host" ? "Host" : "Amico"));
    var ioLanc = vm.lanc === vm.myId;
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "🎯 Chi lancia" }));
    var tapL = (vm.sonoHost && !ioLanc && cb.onHostLanc) ? function () { cb.onHostLanc(); } : null;
    if (tapL) tapL._et = "lancio io ▶";
    s._contenuto.appendChild(rigaRuolo(el("span", { text: "🎯" }), lNome + (ioLanc ? " (tu)" : ""), ioLanc, tapL, tapL));
    if (!vm.sonoHost && !ioLanc) s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", style: "margin-bottom:8px", text: "🎯 Voglio lanciare io", onclick: cb.onClaim }));
    // trave
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "🏃 Sulla trave (posti liberi = bot)" }));
    (vm.seggi || []).forEach(function (sg, i) {
      var mio = sg && sg.id === vm.myId, nome = sg ? ((vm.nomi && vm.nomi[sg.id]) || sg.nome || "Amico") : "🤖 bot";
      var tapS = (vm.sonoHost && !mio && cb.onHostSeat) ? function () { cb.onHostSeat(i); } : null;
      if (tapS) tapS._et = "siediti ▶";
      s._contenuto.appendChild(rigaRuolo(
        el("span", { style: "width:16px;height:16px;border-radius:50%;flex:0 0 auto;background:" + COLSEAT[i % COLSEAT.length] }),
        nome + (mio ? " (tu)" : ""), mio, tapS, tapS));
    });
    if (vm.sonoHost) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin-top:4px", text: "Tocca il lanciatore o un posto sulla trave per metterti lì: chi c'era prende il tuo posto (bot o giocatore)." }));
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
      var el = aiuti.el; dove.modo = "bot"; dove.difficolta = "medio"; dove.ruolo = "lanciatore"; dove.collisioni = false;
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
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Regole" }));
      var bColl = el("button", { class: "btn btn-fantasma", style: "width:100%" });
      function aggColl() { bColl.textContent = dove.collisioni ? "🧱 Collisioni tra giocatori: SÌ" : "👻 Collisioni tra giocatori: no"; }
      aggColl();
      bColl.addEventListener("click", function () { dove.collisioni = !dove.collisioni; aggColl(); });
      box.appendChild(bColl);
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:4px", text: "Con le collisioni i personaggi non si attraversano: si spingono e non passano l'uno dentro l'altro." }));
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Aiuto visivo" }));
      var mir = vuoiMirino(), bMir = el("button", { class: "btn btn-fantasma", style: "width:100%" });
      function aggMir() { bMir.textContent = mir ? "🎯 Mirino rosso: mostrato" : "🚫 Mirino rosso: nascosto"; }
      aggMir();
      bMir.addEventListener("click", function () { mir = !mir; try { localStorage.setItem("sg-pendolo-mirino", mir ? "1" : "0"); } catch (e) {} aggMir(); });
      box.appendChild(bMir);
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile()) ? "Apri una stanza e manda il codice: in sala d'attesa scegliete i ruoli." : "Qui il collegamento non è disponibile: funziona dal sito pubblicato online.";
      box.appendChild(notaOnline);
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospitePendolo(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostPendolo(t, imp.difficolta || "medio", NSEAT, imp.collisioni);
      return locale(t, imp.difficolta || "medio", imp.ruolo || "lanciatore", imp.collisioni);
    }
  });
})();
