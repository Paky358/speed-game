/* =========================================================
   GIOCO — "Glow Hockey"  (air hockey, ognuno dal suo telefono)
   Online host-autoritativo: l'host calcola la fisica del disco a
   ~60fps ed è la "fonte di verità"; l'ospite NON simula il disco
   (divergerebbe → teletrasporti), ma lo INTERPOLA fra gli ultimi
   stati ricevuti con un piccolo ritardo (liscio). Coordinate NORM.
   (indipendenti dallo schermo): campo largo 1, alto ASPETTO.
   NB: grafica volutamente minimale — prima la sostanza.
   ========================================================= */
(function () {
  "use strict";

  var ASP = 1.7;                 // altezza campo in unità (larghezza = 1)
  var RP = 0.05;                 // raggio disco
  var RPAD = 0.09;               // raggio racchetta
  var GOALW = 0.44;              // larghezza porta (in x, centrata)
  var REST = 0.94;              // rimbalzo pareti
  var MAXV = 3.2;                // velocità massima disco (unità/sec)
  var PADK = 0.8;                // quanto la racchetta spinge il disco
  var ATTRITO = 0.28;            // quanto rallenta il disco da solo (più basso = scivola di più)
  var VINCI = 7;                 // gol per vincere
  var ONLINE_ATTIVO = false;     // online (due telefoni) nascosto per ora: il codice resta, basta rimettere true e il tasto
  var HZ = 16;                   // intervallo minimo fra invii (ms) ~60/sec (dati più freschi)
  var HSTEP = 1 / 240;           // passo fisso della fisica (sotto-step): collisioni solide anche a disco veloce
  var DELAY = 0.05;              // ritardo di interpolazione lato ospite (s): ~50ms, vicino al minimo prima che torni a scattare

  var XL = 0.5 - GOALW / 2, XR = 0.5 + GOALW / 2;   // i due pali della porta (in x)
  // Il bordo colorato è disegnato FUORI dall'area di gioco: così il disco rimbalza
  // esattamente contro la riga che vedi, e la luce della porta è esattamente il buco.
  var BORDO = 0.04;                                 // spessore bordo (frazione della larghezza del canvas)
  var KH = (1 - 2 * BORDO) * ASP + 2 * BORDO;       // altezza/larghezza del canvas (campo + bordi)
  // Proporzioni del campo: contro il computer si adattano allo schermo (niente spazio vuoto
  // sotto). L'online (spento) userebbe 1.7 fisso, uguale per i due telefoni.
  function impostaASP(a) { ASP = a; KH = (1 - 2 * BORDO) * ASP + 2 * BORDO; campoCache = null; }
  function aspSchermo() {
    var vw = window.innerWidth || 360, vh = window.innerHeight || 640;
    var w = Math.min(440, vw - 16), h = vh - 80;           // 80 = tasto indietro + margini
    return clamp(((h / w) - 2 * BORDO) / (1 - 2 * BORDO), 1.5, 2.2);
  }
  function geo(cssW) { var B = cssW * BORDO, F = cssW - 2 * B; return { B: B, F: F, H: F * ASP + 2 * B }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function inPorta(x) { return x > XL && x < XR; }

  // ---------- aspetto del campo: tutto qui, così in futuro si cambiano skin e campi ----------
  // "io" = la racchetta di chi guarda (sempre in basso), "avv" = l'avversario (in alto)
  var TEMA = {
    sfondo: "#05070d", linee: "rgba(255,255,255,.22)",
    bordoAlto: "#ffd23b", bordoBasso: "#3d8bff",
    io:  { fuori: "#3d8bff", scuro: "#0f2f6b" },
    avv: { fuori: "#ffd23b", scuro: "#6b4f00" },
    disco: "#ffffff", discoBordo: "#b9c3d6"
  };

  // ---------- suoni: tocco di racchetta, sponda, gol ----------
  var ultimoSuono = {};
  function suono(tipo, forza) {
    var ora = performance.now();
    if (ultimoSuono[tipo] && ora - ultimoSuono[tipo] < 70) return;   // niente raffiche
    ultimoSuono[tipo] = ora;
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime, k = Math.min(1, 0.35 + (forza || 0) / 2.4);   // colpo più forte = suono più forte
      var nota = function (f, t, dur, vol, forma) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = forma; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
      };
      if (tipo === "colpo") { nota(620 + 260 * k, t0, 0.07, 0.3 * k, "triangle"); nota(170, t0, 0.05, 0.18 * k, "sine"); }
      else if (tipo === "sponda") nota(330, t0, 0.05, 0.12, "triangle");
      else if (tipo === "gol") [523, 659, 784, 1046].forEach(function (f, i) { nota(f, t0 + i * 0.09, 0.16, 0.22, "triangle"); });
      else if (tipo === "golSubito") [392, 330, 262].forEach(function (f, i) { nota(f, t0 + i * 0.11, 0.18, 0.2, "sine"); });
    } catch (e) {}
  }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  // i tocchi li conta la fisica (st.colpi / st.sponde): chi disegna suona quando i contatori salgono
  function suonaEventi(s, mem) {
    if ((s.colpi || 0) > (mem.colpi || 0)) suono("colpo", s.forzaColpo || 1);
    if ((s.sponde || 0) > (mem.sponde || 0)) suono("sponda");
    mem.colpi = s.colpi || 0; mem.sponde = s.sponde || 0;
  }
  function suonoGol(fatto) { suono(fatto ? "gol" : "golSubito"); vibra(fatto ? [40, 50, 40] : 60); }

  SG.registra({
    id: "hockey",
    nome: "Glow Hockey",
    icona: "🏒",
    descrizione: "Air hockey contro il computer, con 3 difficoltà. Colpisci il disco col dito e segna nella porta avversaria.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 2, etichettaGiocatori: "🤖 Contro il computer",
    regole: [
      "Si gioca <b>contro il computer</b>: scegli Facile, Medio o Difficile.",
      "Muovi la <b>racchetta</b> col dito nella tua metà campo (non puoi passare la linea di centrocampo) e colpisci il <b>disco</b>.",
      "Segna nella porta avversaria. Primo a <b>" + VINCI + "</b> gol vince.",
      "Dopo un gol il disco riparte nella metà di chi l'ha subito."
    ],
    // L'online (hostHK / ospiteHK più sotto) per ora è SPENTO: il codice resta per riprovarci in futuro.
    impostazioni: function (box, dove, aiuti) {
      dove.modo = "bot"; dove.botLiv = "medio";
      if (aiuti.torneo) return;
      var el = aiuti.el, liv;
      // scelta difficoltà
      liv = el("div", {});
      liv.appendChild(el("div", { class: "etichetta", text: "Difficoltà" }));
      var chips = el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr 1fr" });
      [["facile", "Facile", "🙂"], ["medio", "Medio", "😎"], ["difficile", "Difficile", "🔥"]].forEach(function (x) {
        var c = el("button", { class: "modo-chip" + (x[0] === dove.botLiv ? " attiva" : ""), style: "flex-direction:column;gap:4px;text-align:center", onclick: function () {
          dove.botLiv = x[0]; [].forEach.call(chips.children, function (k) { k.className = "modo-chip"; k.style.flexDirection = "column"; }); c.className = "modo-chip attiva";
        } }, [ el("span", { class: "mi", text: x[2] }), el("div", { class: "mt", text: x[1] }) ]);
        chips.appendChild(c);
      });
      liv.appendChild(chips);
      box.appendChild(liv);
    },
    avvia: function (t) {
      // online spento: un vecchio link a una stanza apre la partita contro il computer
      if (ONLINE_ATTIVO && t.linkParams && t.linkParams.stanza) return ospiteHK(t, t.linkParams.stanza);
      var imp = t.impostazioni || {};
      if (ONLINE_ATTIVO && imp.modo === "online") return hostHK(t);
      return botHK(t, imp.botLiv || "medio");
    }
  });

  // ---------- fisica (solo host) ----------
  function statoNuovo() {
    return { fase: "lobby", codice: "…", pronta: false, avvId: null, canale: "server",
      s1: 0, s2: 0, vincitore: null, golT: 0,
      px: 0.5, py: ASP / 2, pvx: 0, pvy: 0,
      hx: 0.5, hy: ASP - 0.18, hpx: 0.5, hpy: ASP - 0.18,   // racchetta host (basso)
      gx: 0.5, gy: 0.18, gpx: 0.5, gpy: 0.18,               // racchetta ospite (alto), mostrata
      gtx: 0.5, gty: 0.18 };                                  // …e il suo "bersaglio" (ultima ricevuta)
  }
  // rimette il disco FERMO (parte solo quando qualcuno lo colpisce).
  // lato: +1 = nella metà di sotto, -1 = in quella di sopra (chi ha subito il gol), niente = al centro
  function servi(st, lato) {
    st.px = 0.5; st.py = lato ? ASP / 2 + lato * 0.2 : ASP / 2;
    st.pvx = 0; st.pvy = 0;
  }
  // collisione CONTINUA (swept): controlla tutto il tratto percorso dal disco nel
  // passo, così non attraversa la racchetta anche a velocità alta (hitbox solide).
  function collide(st, prevx, prevy, padx, pady, pvx, pvy) {
    var md = RP + RPAD;
    var dx = st.px - prevx, dy = st.py - prevy;
    var fx = prevx - padx, fy = prevy - pady;
    var a = dx * dx + dy * dy, hit = false, cxp = st.px, cyp = st.py;
    if (a > 1e-9) {
      var b = 2 * (fx * dx + fy * dy);
      var c = fx * fx + fy * fy - md * md;
      var disc = b * b - 4 * a * c;
      if (disc >= 0) { var tt = (-b - Math.sqrt(disc)) / (2 * a); if (tt >= 0 && tt <= 1) { hit = true; cxp = prevx + dx * tt; cyp = prevy + dy * tt; } }
    }
    if (!hit) {   // già sovrapposti (es. la racchetta è entrata nel disco): spingi fuori
      var ex = st.px - padx, ey = st.py - pady, ed = Math.hypot(ex, ey);
      if (ed > 0 && ed < md) { hit = true; cxp = padx + ex / ed * md; cyp = pady + ey / ed * md; }
    }
    if (!hit) return;
    var nx = (cxp - padx) / md, ny = (cyp - pady) / md;
    st.px = cxp; st.py = cyp;
    var vn = st.pvx * nx + st.pvy * ny;
    if (vn < 0) { st.pvx -= 2 * vn * nx; st.pvy -= 2 * vn * ny; }
    st.pvx += pvx * PADK; st.pvy += pvy * PADK;
    var sp = Math.hypot(st.pvx, st.pvy); if (sp > MAXV) { st.pvx *= MAXV / sp; st.pvy *= MAXV / sp; }
    // un tocco vero (non la racchetta ferma appoggiata al disco): conta per il suono
    if (vn < -0.05 || Math.hypot(pvx, pvy) > 0.3) { st.colpi = (st.colpi || 0) + 1; st.forzaColpo = Math.hypot(st.pvx, st.pvy); }
  }
  function sponda(st, v) { if (Math.abs(v) > 0.25) st.sponde = (st.sponde || 0) + 1; }
  // un sotto-passo di fisica (dt fisso). Le velocità racchetta arrivano da fuori (st._hvx…)
  // palo della porta: uno spigolo contro cui il disco rimbalza (come nel biliardino)
  function palo(st, x, y) {
    var dx = st.px - x, dy = st.py - y, d = Math.hypot(dx, dy);
    if (d >= RP || d < 1e-9) return;
    var nx = dx / d, ny = dy / d;
    st.px = x + nx * RP; st.py = y + ny * RP;
    var vn = st.pvx * nx + st.pvy * ny;
    if (vn < 0) { sponda(st, vn); st.pvx -= (1 + REST) * vn * nx; st.pvy -= (1 + REST) * vn * ny; }
  }
  function passo(st, dt, onGol) {
    if (st.fase !== "gioco") return;
    var prevx = st.px, prevy = st.py;
    st.px += st.pvx * dt; st.py += st.pvy * dt;
    var f = Math.exp(-ATTRITO * dt); st.pvx *= f; st.pvy *= f;
    collide(st, prevx, prevy, st.hx, st.hy, st._hvx || 0, st._hvy || 0);
    collide(st, prevx, prevy, st.gx, st.gy, st._gvx || 0, st._gvy || 0);
    if (st.px < RP) { sponda(st, st.pvx); st.px = RP; st.pvx = Math.abs(st.pvx) * REST; }
    if (st.px > 1 - RP) { sponda(st, st.pvx); st.px = 1 - RP; st.pvx = -Math.abs(st.pvx) * REST; }
    // bordo di fondo: rimbalza, TRANNE nella luce della porta (fra i due pali)
    var luce = inPorta(st.px);
    if (st.py < RP && !luce) { sponda(st, st.pvy); st.py = RP; st.pvy = Math.abs(st.pvy) * REST; }
    if (st.py > ASP - RP && !luce) { sponda(st, st.pvy); st.py = ASP - RP; st.pvy = -Math.abs(st.pvy) * REST; }
    palo(st, XL, 0); palo(st, XR, 0); palo(st, XL, ASP); palo(st, XR, ASP);
    // gol: solo quando il centro del disco ha passato la linea di porta
    if (st.py < 0) return onGol(1);
    if (st.py > ASP) return onGol(2);
    var sp = Math.hypot(st.pvx, st.pvy); if (sp > MAXV) { st.pvx *= MAXV / sp; st.pvy *= MAXV / sp; }
  }

  // ---------- disegno (host e ospite) ----------
  function creaCanvas(t, s) {
    var el = t.el;
    var wrap = el("div", { style: "display:flex;justify-content:center;margin-top:0" });
    var cv = el("canvas", { style: "touch-action:none;border-radius:14px;background:" + TEMA.sfondo + ";box-shadow:0 0 0 1px rgba(255,255,255,.08)" });
    wrap.appendChild(cv); s._contenuto.appendChild(wrap);
    // il campo deve ENTRARE TUTTO nello schermo (tutte e due le porte visibili senza scorrere):
    // si adatta sia alla larghezza sia all'altezza disponibile, mantenendo le proporzioni (ASP).
    var vw = window.innerWidth || 360, vh = window.innerHeight || 640;
    var maxW = Math.min(440, Math.floor(vw - 16));
    var riserva = 80;                                    // solo il tasto indietro + margini
    var maxH = Math.max(240, Math.floor(vh - riserva));
    var cssW, cssH;
    if (maxW * KH <= maxH) { cssW = maxW; cssH = Math.round(maxW * KH); }     // limita la larghezza
    else { cssH = maxH; cssW = Math.round(maxH / KH); }                         // limita l'altezza
    var dpr = window.devicePixelRatio || 1;
    cv.style.width = cssW + "px"; cv.style.height = cssH + "px";
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    // "desynchronized" = meno ritardo fra il dito e lo schermo (Android/Chrome); alpha:false = più veloce
    var ctx = null;
    try { ctx = cv.getContext("2d", { alpha: false, desynchronized: true }); } catch (e) {}
    if (!ctx) ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    return { cv: cv, ctx: ctx, cssW: cssW, cssH: cssH };
  }
  // dopo che la schermata è a video, MISURA lo spazio davvero rimasto sotto al campo
  // e lo ridimensiona per farci stare tutto il campo (niente scorrimento). Robusto su ogni telefono.
  function adattaCanvas(C) {
    var rect = C.cv.getBoundingClientRect();
    var disp = (window.innerHeight || 640) - rect.top - 8;       // spazio dall'alto del campo al fondo schermo
    var maxW = Math.min(440, Math.floor((window.innerWidth || 360) - 16));
    var maxH = Math.max(200, Math.floor(disp));
    var cssW, cssH;
    if (maxW * KH <= maxH) { cssW = maxW; cssH = Math.round(maxW * KH); }
    else { cssH = maxH; cssW = Math.round(maxH / KH); }
    if (cssW === C.cssW && cssH === C.cssH) return;
    var dpr = window.devicePixelRatio || 1;
    C.cv.style.width = cssW + "px"; C.cv.style.height = cssH + "px";
    C.cv.width = Math.round(cssW * dpr); C.cv.height = Math.round(cssH * dpr);
    C.ctx.setTransform(1, 0, 0, 1, 0, 0); C.ctx.scale(dpr, dpr);
    C.cssW = cssW; C.cssH = cssH;
  }
  function cerchio(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
  // Il campo (sfondo, bordi, linee) non cambia mai: lo disegno UNA volta su un canvas
  // nascosto e a ogni frame lo copio. Poi sopra solo punteggio, racchette e disco.
  var campoCache = null;
  function disegna(ctx, cssW, o, flip) {
    var G = geo(cssW), B = G.B, F = G.F, W = cssW, H = G.H, T = TEMA;
    var dpr = window.devicePixelRatio || 1;
    // coordinate di gioco (0..1 x 0..ASP) -> pixel dentro il bordo
    function P(x, y) { return flip ? [B + (1 - x) * F, B + (ASP - y) * F] : [B + x * F, B + y * F]; }
    if (!campoCache || campoCache.W !== W || campoCache.dpr !== dpr || campoCache.tema !== T) {
      var cc = document.createElement("canvas");
      cc.width = Math.round(W * dpr); cc.height = Math.round(H * dpr);
      var c2 = cc.getContext("2d"); c2.scale(dpr, dpr);
      disegnaCampo(c2, W, H, B, F, T);
      campoCache = { cv: cc, W: W, dpr: dpr, tema: T };
    }
    ctx.drawImage(campoCache.cv, 0, 0, W, H);
    disegnaSopra(ctx, W, H, B, F, T, P, o, flip);
  }
  function disegnaCampo(ctx, W, H, B, F, T) {
    ctx.fillStyle = T.sfondo; ctx.fillRect(0, 0, W, H);
    var m = B / 2, rr = B * 1.3, gc = B * 1.2;              // centro del bordo, raggio angoli, stacco a metà campo
    var gx0 = B + XL * F, gx1 = B + XR * F;                // pali: esattamente dove sono nella fisica
    // linee: metà campo, cerchio centrale, lunette davanti alle porte
    ctx.strokeStyle = T.linee; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(B, H / 2); ctx.lineTo(W - B, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, F * 0.16, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, B, GOALW / 2 * F, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H - B, GOALW / 2 * F, Math.PI, 2 * Math.PI); ctx.stroke();
    // bordi (fuori dall'area di gioco): sopra gialli, sotto blu. La porta è un BUCO nel bordo.
    ctx.lineWidth = B; ctx.lineCap = "butt"; ctx.lineJoin = "round";
    function lato(xPorta, yBordo, xLato, yFine, col) {   // dal palo, giro l'angolo, fino a metà campo
      var dx = xLato < W / 2 ? 1 : -1, dy = yBordo < H / 2 ? 1 : -1;
      ctx.strokeStyle = col; ctx.beginPath();
      ctx.moveTo(xPorta, yBordo); ctx.lineTo(xLato + dx * rr, yBordo);
      ctx.arcTo(xLato, yBordo, xLato, yBordo + dy * rr, rr);
      ctx.lineTo(xLato, yFine); ctx.stroke();
      cerchio(ctx, xLato, yFine, m, col);              // punta arrotondata verso il centrocampo
    }
    lato(gx0, m, m, H / 2 - gc, T.bordoAlto);         lato(gx1, m, W - m, H / 2 - gc, T.bordoAlto);
    lato(gx0, H - m, m, H / 2 + gc, T.bordoBasso);    lato(gx1, H - m, W - m, H / 2 + gc, T.bordoBasso);
  }
  function disegnaSopra(ctx, W, H, B, F, T, P, o, flip) {
    // punteggio sul lato destro, a metà campo: sopra l'avversario, sotto il tuo
    var mio = flip ? o.s2 : o.s1, suo = flip ? o.s1 : o.s2;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "800 " + Math.round(F * 0.085) + "px system-ui,sans-serif";
    ctx.fillStyle = T.bordoAlto; ctx.fillText(String(suo), B + F * 0.9, H / 2 - F * 0.09);
    ctx.fillStyle = T.bordoBasso; ctx.fillText(String(mio), B + F * 0.9, H / 2 + F * 0.09);
    // racchette (anello bianco con centro colorato) + disco
    function racchetta(x, y, c) {
      var p = P(x, y), R = RPAD * F;
      cerchio(ctx, p[0], p[1], R, c.fuori);
      cerchio(ctx, p[0], p[1], R * 0.84, "#ffffff");
      cerchio(ctx, p[0], p[1], R * 0.52, c.scuro);
      cerchio(ctx, p[0], p[1], R * 0.24, c.fuori);
    }
    racchetta(o.hx, o.hy, flip ? T.avv : T.io);   // racchetta dell'host
    racchetta(o.gx, o.gy, flip ? T.io : T.avv);   // racchetta dell'ospite / del computer
    var pk = P(o.px, o.py);
    cerchio(ctx, pk[0], pk[1], RP * F, T.discoBordo);
    cerchio(ctx, pk[0], pk[1], RP * F * 0.8, T.disco);
    // scritta gol
    if (o.fase === "gol") { ctx.fillStyle = "#ffd43b"; ctx.font = "800 " + Math.round(F * 0.11) + "px system-ui,sans-serif"; ctx.fillText("GOL!", W / 2, H / 2); }
  }

  // ---------- controllo racchetta (input locale) ----------
  function collegaInput(C, flip, meta, onMove) {
    // meta = "basso" (host, metà bassa) o "alto" (ospite, che però vede la sua racchetta in basso grazie al flip)
    var cv = C.cv;
    function pos(e) {
      var r = cv.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      var G = geo(C.cssW);   // dimensione aggiornata (dopo adattaCanvas); il campo inizia dopo il bordo
      var fx = (cx - G.B) / G.F, fy = (cy - G.B) / G.F, x, y;
      if (flip) { x = 1 - fx; y = ASP - fy; } else { x = fx; y = fy; }
      x = clamp(x, RPAD, 1 - RPAD);
      if (meta === "basso") y = clamp(y, ASP / 2 + RPAD, ASP - RPAD);
      else y = clamp(y, RPAD, ASP / 2 - RPAD);
      onMove(x, y);
    }
    var giu = false;
    cv.addEventListener("pointerdown", function (e) { giu = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} pos(e); e.preventDefault(); });
    cv.addEventListener("pointermove", function (e) { if (giu) { pos(e); e.preventDefault(); } });
    cv.addEventListener("pointerup", function (e) { giu = false; e.preventDefault(); });
    cv.addEventListener("pointercancel", function () { giu = false; });
  }

  // sceglie il collegamento, dal più veloce al più compatibile:
  //  1) P2P diretto telefono-a-telefono (usa Ably solo per presentarsi, poi va diretto)
  //  2) Ably (relay a bassa latenza)   3) MQTT (relay condiviso)
  function scegliNet() {
    if (window.SGNetP2P && SGNetP2P.disponibile()) return SGNetP2P;
    if (window.SGNetA && SGNetA.disponibile()) return SGNetA;
    if (window.SGNet && SGNet.disponibile()) return SGNet;
    return null;
  }
  // testo dell'indicatore di collegamento (mostrato durante la partita)
  function testoCanale(c) {
    return c === "diretto" ? "⚡ Collegamento diretto (stessa rete) — velocissimo"
                           : "🌐 Collegamento via internet";
  }

  // ---------- CONTRO IL COMPUTER (tutto in locale, nessuna rete) ----------
  // Difficoltà:
  //  vel    = velocità della racchetta (unità/s);  scatto = moltiplicatore quando respinge
  //  tiro   = velocità della racchetta quando tira (potenza del tiro)
  //  reaz   = tempo di reazione: ogni quanto "guarda" il disco e decide la mossa (s)
  //  err    = imprecisione (scelta UNA volta per azione, non a ogni frame: niente tremolio)
  //  track  = quanto segue il disco in difesa (sotto 1 lascia scoperti gli angoli)
  //  prev   = quanto sa prevedere dove arriverà un tiro (0 = per niente, 1 = perfetto)
  //  soglia = tiri in arrivo più lenti di così li attacca invece di limitarsi a parare
  //  mira   = quanto mira agli angoli della tua porta (0 = sempre al centro)
  //  cool   = dopo un tocco si ritira per questo tempo (non schiaccia il disco sul bordo)
  //  dy     = quanto sta avanti rispetto alla porta quando difende
  var DIFF = {
    // (tarati con la fisica "vera": hitbox interpolate + pali. Tiri che entrano: ~47% / 23% / 12%)
    facile:    { nome: "Facile",    vel: 0.60, scatto: 1.5, tiro: 2.0, reaz: 0.35, err: 0.55, track: 0.25, prev: 0.0, soglia: 0.5, mira: 0.5, cool: 0.50, dy: 0.22 },
    medio:     { nome: "Medio",     vel: 0.85, scatto: 1.7, tiro: 2.6, reaz: 0.28, err: 0.40, track: 0.30, prev: 0.3, soglia: 0.7, mira: 0.8, cool: 0.40, dy: 0.21 },
    difficile: { nome: "Difficile", vel: 1.00, scatto: 1.9, tiro: 3.2, reaz: 0.18, err: 0.30, track: 0.40, prev: 0.6, soglia: 0.9, mira: 1.0, cool: 0.35, dy: 0.20 }
  };
  // dove sarà il disco (in x) quando arriva all'altezza yLinea, contando i rimbalzi sulle sponde
  function prevediX(st, yLinea) {
    if (st.pvy >= -0.05 || st.py <= yLinea) return st.px;
    var t = (st.py - yLinea) / -st.pvy, L = 1 - 2 * RP;
    var u = st.px + st.pvx * t - RP;
    u = ((u % (2 * L)) + 2 * L) % (2 * L); if (u > L) u = 2 * L - u;
    return u + RP;
  }
  // muove la racchetta del bot (in alto: gx,gy)
  function botMuovi(st, dt, D) {
    var b = st._bot || (st._bot = { piano: 0, tx: 0.5, ty: 0.2, ex: 0, cool: 0, lento: 0, modo: "", mira: 0.5, colpo: false });
    var md = RP + RPAD;
    // appena tocca il disco si ritira un attimo: così non lo incastra contro il bordo
    if (b.cool <= 0 && Math.hypot(st.px - st.gx, st.py - st.gy) < md + 0.004) { b.cool = D.cool; b.piano = 0; b.colpo = false; }
    if (b.cool > 0) b.cool -= dt;
    // troppo attaccato al bordo alto il bot non può mettersi "dietro" il disco
    var raggiungibile = st.py >= RPAD + md * 0.85;
    // disco fermo contro il bordo alto da un po': scivola fuori verso il centro (cuscino d'aria)
    b.lento = (!raggiungibile && Math.hypot(st.pvx, st.pvy) < 0.1) ? b.lento + dt : 0;
    if (b.lento > 1.2) { st.pvx = (0.5 - st.px) * 0.9; st.pvy = 0.55; b.lento = 0; }
    b.piano -= dt;
    if (b.piano <= 0) {                                  // decide solo ogni "tempo di reazione"
      b.piano = D.reaz;
      var mia = st.py <= ASP / 2 + 0.001, modo;   // anche il disco sulla linea di centro (prima palla) è suo
      if (!raggiungibile || !mia) modo = "difendi";
      else if (st.py < st.gy + md * 0.3) modo = (st.pvy > 0.2 || b.cool > 0) ? "scansa" : "attacca";   // disco alle sue spalle
      else if (b.cool > 0) modo = "difendi";
      else if (st.pvy < -D.soglia) modo = (st.py - st.gy < 0.35) ? "respingi" : "difendi";   // tiro veloce in arrivo
      else modo = "attacca";                             // disco nella sua metà: va a prenderlo
      if (modo !== b.modo) {
        b.modo = modo; b.colpo = false; b.ex = (Math.random() - 0.5) * D.err;
        b.mira = 0.5 + (Math.random() < 0.5 ? -1 : 1) * (0.08 + Math.random() * 0.1) * D.mira;   // angolo della tua porta
      }
      if (modo === "respingi") {                         // va incontro al disco e lo rimanda indietro
        b.tx = prevediX(st, st.gy) + b.ex * 0.5; b.ty = st.gy + 0.06;
      } else if (modo === "difendi") {
        if (!raggiungibile) { b.tx = st.px < 0.5 ? st.px + 0.32 : st.px - 0.32; b.ty = 0.32; }  // disco sul bordo: si toglie di mezzo
        else {
          // si mette dove il disco ARRIVERÀ (più o meno bene a seconda del livello)
          var segue = 0.5 + (st.px - 0.5) * D.track;
          var tx = st.pvy < -0.2 ? segue + (prevediX(st, D.dy) - segue) * D.prev : segue;
          b.tx = tx + b.ex; b.ty = D.dy;
        }
      }
    }
    // il disco è alle sue spalle e torna verso di te: si sposta di lato e lo lascia passare
    // (se rientrasse in porta ci sbatterebbe contro e se lo tirerebbe dentro da solo)
    var dietro = st.py < st.gy + md * 0.3 && st.py < ASP / 2;
    if (dietro && st.pvy > 0.2 && b.modo !== "scansa") { b.modo = "scansa"; b.colpo = false; }
    if (b.modo === "scansa") {
      if (!dietro) { b.modo = "difendi"; b.piano = 0; }
      else { b.tx = st.px < st.gx ? st.px + md * 1.8 : st.px - md * 1.8; b.ty = st.gy; }
    }
    if (b.modo === "attacca") {
      // in due tempi: rincorsa DIETRO al disco (sulla linea verso la tua porta), poi tiro.
      // Controllato a ogni frame: appena è in posizione parte il colpo.
      var vx = b.mira - st.px, vy = ASP - st.py, vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
      var ax = st.px - st.gx, ay = st.py - st.gy;
      var avanti = ax * vx + ay * vy, lato = Math.abs(ax * vy - ay * vx);
      if (b.colpo && avanti < md * 0.3) b.colpo = false;   // il disco si è spostato: niente colpo storto
      if (b.colpo || (avanti > md * 0.8 && avanti < md * 2.2 && lato < md * 0.55)) {   // tira solo da vicino
        b.colpo = true; b.tx = st.px + vx * md * 0.6; b.ty = st.py + vy * md * 0.6;      // 3) tiro
      } else if (avanti < md * 0.5 && Math.hypot(ax, ay) < md * 2.2) {
        // 1) è davanti o di fianco al disco: passa DI LATO senza toccarlo (niente autogol)
        var qx = -vy, qy = vx;
        if (-(ax * qx + ay * qy) < 0) { qx = -qx; qy = -qy; }   // dal lato dove si trova già
        b.tx = st.px + qx * md * 1.3 - vx * md * 1.4; b.ty = st.py + qy * md * 1.3 - vy * md * 1.4;
      } else { b.tx = st.px - vx * md * 1.6; b.ty = st.py - vy * md * 1.6; }             // 2) rincorsa dietro
    }
    b.tx = clamp(b.tx, RPAD, 1 - RPAD); b.ty = clamp(b.ty, RPAD, ASP / 2 - RPAD);
    var vv = b.colpo ? D.tiro : (b.modo === "respingi" ? D.vel * D.scatto : D.vel);   // il tiro ha la sua potenza
    var dx = b.tx - st.gx, dy = b.ty - st.gy, dist = Math.hypot(dx, dy), step = vv * dt;
    if (dist < 0.003) return;                            // arrivato: sta fermo
    if (dist > step) { st.gx += dx / dist * step; st.gy += dy / dist * step; }
    else { st.gx = b.tx; st.gy = b.ty; }
    st.gx = clamp(st.gx, RPAD, 1 - RPAD); st.gy = clamp(st.gy, RPAD, ASP / 2 - RPAD);
  }
  function salvaHockey(st) {
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var vinto = st.vincitore === 1;
    SGNube.salvaProgressi(null, "hockey",
      [["partite", 1], ["vittorie", vinto ? 1 : 0], ["golFatti", st.s1]],
      [["scartoMax", vinto ? (st.s1 - st.s2) : 0]]);
  }
  function botHK(t, liv) {
    var D = DIFF[liv] || DIFF.medio;
    impostaASP(aspSchermo());          // il campo riempie lo schermo del telefono
    var st = statoNuovo(); st.fase = "gioco";
    var C = null, raf = null, ultimoT = 0, acc = 0, dtRacc = 0, vista = null, salvato = false, memSuoni = {};
    // racchette al loro posto di partenza (a inizio partita e dopo ogni gol)
    function rimettiRacchette() {
      st.hx = st.hpx = 0.5; st.hy = st.hpy = ASP - 0.18;
      st.gx = st.gpx = 0.5; st.gy = st.gpy = 0.18;
      st._snap = true;   // quando rimetti il dito, la racchetta ti raggiunge senza "sparare" il disco
    }
    function gol(chi) {
      if (chi === 1) st.s1++; else st.s2++;
      suonoGol(chi === 1);
      if (st.s1 >= VINCI || st.s2 >= VINCI) {
        st.fase = "fine"; st.vincitore = st.s1 > st.s2 ? 1 : 2;
        if (!salvato) { salvato = true; salvaHockey(st); }
        render();
      } else {
        // pausa GOL: tutto fermo, il disco riparte nella metà di chi ha subito
        st.fase = "gol"; st.golT = performance.now(); servi(st, chi === 1 ? -1 : 1); st._bot = null; rimettiRacchette();
      }
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      // (se l'app torna dallo sfondo non recupera di colpo mezzo secondo di fisica)
      var dt = ultimoT ? (now - ultimoT) / 1000 : 1 / 60; ultimoT = now; if (dt > 0.05) dt = 0.05;
      if (st.fase === "gol" && now - st.golT > 1200) st.fase = "gioco";
      if (st.fase === "gioco") botMuovi(st, dt, D);
      // posizioni delle racchette a inizio e fine frame + loro velocità (per la spinta sul disco)
      dtRacc += dt;
      var h0x = st.hpx, h0y = st.hpy, g0x = st.gpx, g0y = st.gpy, h1x = st.hx, h1y = st.hy, g1x = st.gx, g1y = st.gy;
      var fdt = Math.max(0.004, dtRacc);
      st._hvx = (h1x - h0x) / fdt; st._hvy = (h1y - h0y) / fdt;
      st._gvx = (g1x - g0x) / fdt; st._gvy = (g1y - g0y) / fdt;
      // fisica a 240 passi al secondo; in ogni passo le racchette sono nel punto giusto del loro
      // percorso: una strisciata veloce non "salta" più il disco
      acc += dt;
      var n = Math.min(Math.floor(acc / HSTEP), 24);
      for (var k = 1; k <= n; k++) {
        var f = k / n;
        st.hx = h0x + (h1x - h0x) * f; st.hy = h0y + (h1y - h0y) * f;
        st.gx = g0x + (g1x - g0x) * f; st.gy = g0y + (g1y - g0y) * f;
        passo(st, HSTEP, gol);
        if (st.fase !== "gioco") break;
      }
      acc = st.fase === "gioco" ? acc - n * HSTEP : 0;
      if (st.fase === "gioco") { st.hx = h1x; st.hy = h1y; st.gx = g1x; st.gy = g1y; }   // (dopo un gol restano rimesse a posto)
      if (n > 0 || st.fase !== "gioco") { st.hpx = st.hx; st.hpy = st.hy; st.gpx = st.gx; st.gpy = st.gy; dtRacc = 0; }
      suonaEventi(st, memSuoni);
      if (st.fase === "fine") return;   // la schermata è cambiata
      if (C) disegna(C.ctx, C.cssW, st, false);
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
    function render() {
      var tipo = st.fase === "fine" ? "fine" : "gioco";
      if (tipo === vista && tipo !== "fine") return;
      vista = tipo; stop();
      var el = t.el;
      if (tipo === "fine") {
        var vinto = st.vincitore === 1;
        var sf = t.schermata({ icona: vinto ? "🏆" : "🤖", titolo: vinto ? "Hai vinto!" : "Ha vinto il computer", sotto: "Glow Hockey · " + D.nome });
        sf._contenuto.appendChild(el("div", { style: "text-align:center;font-size:2rem;font-weight:800;margin:10px 0", text: st.s1 + " — " + st.s2 }));
        sf._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: function () { st.s1 = 0; st.s2 = 0; st.vincitore = null; salvato = false; st._bot = null; servi(st); rimettiRacchette(); st.fase = "gioco"; vista = null; render(); } }));
        sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: function () { stop(); t.esci(); } }));
        t.mostra(sf);
      } else {
        // niente titolo: solo il tasto indietro, così il campo prende tutto lo spazio
        var sg = t.schermata({ sotto: "🤖 " + D.nome, indietro: function () { stop(); t.esci(); } });
        sg.firstChild.style.marginBottom = "4px";
        C = creaCanvas(t, sg);
        collegaInput(C, false, "basso", function (x, y) {
          if (st.fase !== "gioco") { st._snap = true; return; }            // pausa del gol: la racchetta resta ferma
          if (st._snap) { st._snap = false; st.hpx = x; st.hpy = y; }       // rientro: nessuno scatto che spara il disco
          st.hx = x; st.hy = y;
        });
        t.mostra(sg);
        adattaCanvas(C);
        ultimoT = 0; raf = requestAnimationFrame(loop);
      }
    }
    rimettiRacchette();
    render();
  }

  // ---------- HOST ----------
  function hostHK(t) {
    impostaASP(1.7);                   // online: stesse proporzioni sui due telefoni
    var NET = scegliNet();
    if (!NET) return senzaReteHK(t);
    var st = statoNuovo();
    var vista = null, C = null, raf = null, ultimoInvio = 0, ultimoT = 0, acc = 0;
    var rete = NET.ospita("hockey", {
      onCodice: function (c) { st.codice = c; render(); },
      onConnesso: function () { st.pronta = true; render(); },
      onCanale: function (tipo) { st.canale = tipo; if (st._badge) st._badge.textContent = testoCanale(tipo); },
      onAddio: function (id) { if (id === st.avvId) { st.avvId = null; if (st.fase !== "lobby") { st.fase = "lobby"; stop(); } render(); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!st.avvId) st.avvId = id; render(); bcast(true); }
        else if (m.t === "p" && id === st.avvId) { st.gtx = clamp(m.x, RPAD, 1 - RPAD); st.gty = clamp(m.y, RPAD, ASP / 2 - RPAD); }
      },
      onErrore: function () { senzaReteHK(t); }
    });
    function vm() { return { t: "g", fase: st.fase, px: st.px, py: st.py, pvx: st.pvx, pvy: st.pvy, hx: st.hx, hy: st.hy, gx: st.gx, gy: st.gy, s1: st.s1, s2: st.s2, vincitore: st.vincitore, codice: st.codice, pronta: st.pronta,
      colpi: st.colpi || 0, sponde: st.sponde || 0, forzaColpo: st.forzaColpo || 0 }; }   // contatori: l'ospite suona quando salgono
    function bcast(ret) { if (ret) rete.invia(vm()); else rete.inviaVeloce(vm()); }
    var memSuoni = {};
    function gol(chi) { if (chi === 1) st.s1++; else st.s2++; suonoGol(chi === 1); if (st.s1 >= VINCI || st.s2 >= VINCI) { st.fase = "fine"; st.vincitore = st.s1 > st.s2 ? 1 : 2; } else { st.fase = "gol"; st.golT = performance.now(); servi(st, chi === 1 ? -1 : 1); } bcast(true); }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      var dt = ultimoT ? (now - ultimoT) / 1000 : 0.016; ultimoT = now;
      if (dt > 0.1) dt = 0.1;
      if (st.fase === "gol" && now - st.golT > 1200) { st.fase = "gioco"; }
      // ammorbidisci la racchetta AVVERSARIA: scivola verso l'ultima posizione ricevuta
      // (toglie i micro-scatti sul mio schermo e gli spintoni anomali sul disco). Se il collegamento
      // è DIRETTO (bassa latenza) uso un ritardo minimo (~12ms) così i colpi dell'ospite arrivano
      // subito sul disco; su internet un filo di più (~30ms) per calmare la rete irregolare.
      var tcG = (st.canale === "diretto") ? 0.012 : 0.03;
      var kg = 1 - Math.exp(-dt / tcG); // indipendente dal frame-rate
      st.gx += (st.gtx - st.gx) * kg; st.gy += (st.gty - st.gy) * kg;
      // velocità racchette (una volta per frame), per la spinta sul disco
      var fdt = Math.max(0.004, dt);
      st._hvx = (st.hx - st.hpx) / fdt; st._hvy = (st.hy - st.hpy) / fdt;
      st._gvx = (st.gx - st.gpx) / fdt; st._gvy = (st.gy - st.gpy) / fdt;
      st.hpx = st.hx; st.hpy = st.hy; st.gpx = st.gx; st.gpy = st.gy;
      // fisica a passo fisso (sotto-step) per collisioni solide
      acc += dt; var guard = 0;
      while (acc >= HSTEP && guard++ < 12) { passo(st, HSTEP, gol); acc -= HSTEP; if (st.fase !== "gioco") { acc = 0; break; } }
      suonaEventi(st, memSuoni);
      if (C) disegna(C.ctx, C.cssW, st, false);
      if (now - ultimoInvio > HZ) { ultimoInvio = now; bcast(false); }
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
    function comincia() { if (st.fase === "lobby" && st.avvId) { st.s1 = 0; st.s2 = 0; st.vincitore = null; st.fase = "gioco"; servi(st); bcast(true); render(); } }

    function render() {
      var tipo = st.fase === "lobby" ? "lobby" : st.fase === "fine" ? "fine" : "gioco";
      if (tipo === vista && tipo !== "lobby" && tipo !== "fine") return; // il gioco si ridisegna nel loop
      vista = tipo; stop();
      var el = t.el;
      if (tipo === "lobby") {
        var s = t.schermata({ icona: "🏒", titolo: "Glow Hockey · Lobby", sotto: "Ognuno dal suo telefono", indietro: function () { rete.chiudi(); t.esci(); } });
        s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
        s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (st.codice || "…").toUpperCase() }));
        if (st.codice && st.codice !== "…") {
          var link = SG.creaLink({ gioco: "hockey", stanza: st.codice });
          var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
          s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare", onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
          s._contenuto.appendChild(campo);
        }
        s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (st.pronta ? "#69db7c" : "#ffd43b"), text: st.pronta ? "🟢 Stanza pronta — manda il codice" : "🟡 Sto aprendo la stanza…" }));
        s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin-top:10px", text: st.avvId ? "✅ Avversario collegato!" : "In attesa dell'avversario…" }));
        var b = el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: comincia }); if (!st.avvId) b.setAttribute("disabled", "disabled");
        s._piede.appendChild(b);
        t.mostra(s);
      } else if (tipo === "fine") {
        var sf = t.schermata({ icona: "🏆", titolo: st.vincitore === 1 ? "Hai vinto!" : "Ha vinto l'avversario", sotto: "Glow Hockey" });
        sf._contenuto.appendChild(el("div", { style: "text-align:center;font-size:2rem;font-weight:800;margin:10px 0", text: st.s1 + " — " + st.s2 }));
        sf._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: function () { st.fase = "lobby"; render(); } }));
        sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Chiudi", onclick: function () { rete.chiudi(); t.esci(); } }));
        t.mostra(sf);
      } else {
        var sg = t.schermata({ icona: "🏒", titolo: "Glow Hockey", sotto: "Tu (blu) in basso · segna in alto", indietro: function () { stop(); rete.chiudi(); t.esci(); } });
        st._badge = el("div", { class: "modulo-nota", style: "text-align:center;margin:2px 0 4px;font-size:.78rem", text: testoCanale(st.canale) });
        sg._contenuto.appendChild(st._badge);
        C = creaCanvas(t, sg);
        collegaInput(C, false, "basso", function (x, y) { st.hx = x; st.hy = y; });
        t.mostra(sg);
        adattaCanvas(C);
        ultimoT = 0; raf = requestAnimationFrame(loop);
      }
    }
    render();
  }

  // ---------- OSPITE ----------
  function ospiteHK(t, codice) {
    impostaASP(1.7);
    var NET = scegliNet();
    if (!NET) return senzaReteHK(t);
    var el = t.el;
    var S = { rete: null, vm: null, buf: [], me: { x: 0.5, y: 0.18 }, fase: "collega", vista: null, C: null, raf: null, ultimoInvio: 0, canale: "server", _badge: null, collegato: false };
    collega();
    function collega() {
      S.rete = NET.entra(codice, {
        onAperto: function (id) { S.collegato = true; S.rete.invia({ t: "join" }); render(); },
        onCanale: function (tipo) { S.canale = tipo; if (S._badge) S._badge.textContent = testoCanale(tipo); },
        onMsg: function (m) { if (m && m.t === "g") {
          // suoni: tocchi e sponde dai contatori dell'host; al gol, contento se hai segnato tu (s2)
          if (S.vm) { if (m.s2 > S.vm.s2) suonoGol(true); else if (m.s1 > S.vm.s1) suonoGol(false); }
          suonaEventi(m, S.memSuoni || (S.memSuoni = { colpi: m.colpi, sponde: m.sponde }));
          S.vm = m; var now = performance.now();
          if (m.fase === "gioco") { S.buf.push({ rt: now, px: m.px, py: m.py, pvx: m.pvx, pvy: m.pvy, hx: m.hx, hy: m.hy }); while (S.buf.length > 2 && S.buf[0].rt < now - 1000) S.buf.shift(); }
          else { S.buf.length = 0; }   // gol/attesa: svuota, alla ripresa riparte pulito
          if (m.fase !== S.fase) { S.fase = m.fase; render(); }
        } },
        onChiuso: function () { stop(); erroreHK(t, "Collegamento perso. L'host ha chiuso la partita."); },
        onErrore: function () { stop(); erroreHK(t, "Problema di collegamento. Riprova."); }
      });
    }
    function stop() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = null; }
    function loop(now) {
      S.raf = requestAnimationFrame(loop);
      var vm = S.vm; if (!vm || !S.C) return;
      // INTERPOLAZIONE: disegno disco e racchetta avversaria fra i due stati reali attorno a
      // "adesso - DELAY". Movimento liscio (niente scatti, niente teletrasporti, niente disco
      // che si muove da solo), con solo un piccolo ritardo costante.
      var b = S.buf, px, py, hx, hy;
      if (vm.fase !== "gioco" || b.length === 0) { px = vm.px; py = vm.py; hx = vm.hx; hy = vm.hy; }
      else {
        // cuscinetto piccolo se il collegamento è diretto (poca rete da assorbire), più grande su internet
        var delayS = (S.canale === "diretto") ? 0.02 : DELAY;
        var rt = now - delayS * 1000;
        if (rt <= b[0].rt) { px = b[0].px; py = b[0].py; hx = b[0].hx; hy = b[0].hy; }
        else if (rt >= b[b.length - 1].rt) {
          // pacchetto in ritardo/perso: invece di congelare (scatto), faccio proseguire il disco
          // col suo movimento per un breve tratto (max 70ms). Appena arriva il dato vero, riparte liscio.
          var Z = b[b.length - 1], ex = Math.min((rt - Z.rt) / 1000, 0.07);
          px = clamp(Z.px + (Z.pvx || 0) * ex, RP, 1 - RP);
          py = clamp(Z.py + (Z.pvy || 0) * ex, RP, ASP - RP);
          hx = Z.hx; hy = Z.hy;
        }
        else {
          var i = b.length - 2; while (i > 0 && b[i].rt > rt) i--;
          var A = b[i], B = b[i + 1], f = (rt - A.rt) / Math.max(1, B.rt - A.rt);
          px = A.px + (B.px - A.px) * f; py = A.py + (B.py - A.py) * f;
          hx = A.hx + (B.hx - A.hx) * f; hy = A.hy + (B.hy - A.hy) * f;
        }
      }
      var o = { fase: vm.fase, px: px, py: py, hx: hx, hy: hy, gx: S.me.x, gy: S.me.y, s1: vm.s1, s2: vm.s2 };
      disegna(S.C.ctx, S.C.cssW, o, true);
      if (now - S.ultimoInvio > HZ) { S.ultimoInvio = now; S.rete.invia({ t: "p", x: S.me.x, y: S.me.y }); }
    }
    function render() {
      var f = S.fase;
      var tipo = (f === "gioco" || f === "gol") ? "gioco" : f === "fine" ? "fine" : "attesa";
      if (tipo === S.vista && tipo === "gioco") return;
      S.vista = tipo; stop();
      if (tipo === "attesa") {
        var s = t.schermata({ icona: "🏒", titolo: "Glow Hockey · Sala", sotto: "Stanza " + codice.toUpperCase(), indietro: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
        var dentro = (S.collegato || S.vm);
        if (dentro) {
          s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin-bottom:2px", text: "✅ Sei nella stanza" }));
          s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Chi c'è" }));
          [["🟡", "Avversario (host)", false], ["🔵", "Tu", true]].forEach(function (p) {
            s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:" + (p[2] ? "rgba(255,202,58,.16)" : "rgba(255,255,255,.06)") }, [
              el("span", { text: p[0] }), el("span", { style: "flex:1;font-weight:700", text: p[1] })
            ]));
          });
          s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:8px", text: "In attesa che l'host cominci…" }));
        } else {
          s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:20px", text: "Collegamento in corso…" }));
        }
        t.mostra(s);
      } else if (tipo === "fine") {
        var vinto = S.vm && S.vm.vincitore === 2;
        var sf = t.schermata({ icona: "🏆", titolo: vinto ? "Hai vinto!" : "Ha vinto l'avversario", sotto: "Glow Hockey" });
        sf._contenuto.appendChild(el("div", { style: "text-align:center;font-size:2rem;font-weight:800;margin:10px 0", text: (S.vm ? S.vm.s2 : 0) + " — " + (S.vm ? S.vm.s1 : 0) }));
        sf._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per la rivincita…" }));
        t.mostra(sf);
      } else {
        var sg = t.schermata({ icona: "🏒", titolo: "Glow Hockey", sotto: "Tu (blu) in basso · segna in alto", indietro: function () { stop(); if (S.rete) S.rete.chiudi(); t.esci(); } });
        S._badge = el("div", { class: "modulo-nota", style: "text-align:center;margin:2px 0 4px;font-size:.78rem", text: testoCanale(S.canale) });
        sg._contenuto.appendChild(S._badge);
        S.C = creaCanvas(t, sg);
        collegaInput(S.C, true, "alto", function (x, y) { S.me.x = x; S.me.y = y; });
        t.mostra(sg);
        adattaCanvas(S.C);
        S.buf = []; S.raf = requestAnimationFrame(loop);
      }
    }
  }

  function erroreHK(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaReteHK(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Glow Hockey si gioca online, ognuno dal suo telefono: funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
})();
