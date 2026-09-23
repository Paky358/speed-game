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
  var MAXV = 2.4;                // velocità massima disco (unità/sec)
  var PADK = 0.7;                // quanto la racchetta spinge il disco
  var VINCI = 7;                 // gol per vincere
  var HZ = 16;                   // intervallo minimo fra invii (ms) ~60/sec (dati più freschi)
  var HSTEP = 1 / 120;           // passo fisso della fisica (sotto-step): collisioni solide
  var DELAY = 0.05;              // ritardo di interpolazione lato ospite (s): ~50ms, vicino al minimo prima che torni a scattare

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function inPorta(x) { return x > 0.5 - GOALW / 2 && x < 0.5 + GOALW / 2; }

  SG.registra({
    id: "hockey",
    nome: "Glow Hockey",
    icona: "🏒",
    descrizione: "Air hockey: sfida il computer (3 difficoltà) o un amico dal suo telefono. Colpisci il disco col dito e segna nella porta avversaria.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 2,
    regole: [
      "Da soli si gioca <b>contro il computer</b> (Facile, Medio o Difficile); in due <b>ognuno dal suo telefono</b> (uno apre la stanza, l'altro entra col codice).",
      "Muovi la <b>racchetta</b> col dito nella tua metà campo (non puoi passare la linea di centrocampo) e colpisci il <b>disco</b>.",
      "Segna nella porta avversaria. Primo a <b>" + VINCI + "</b> gol vince.",
      "Contro il computer è tutto sul tuo telefono: nessun ritardo. Online il disco lo calcola chi apre la stanza."
    ],
    impostazioni: function (box, dove, aiuti) {
      dove.modo = "bot"; dove.botLiv = "medio";
      if (aiuti.torneo) { dove.modo = "bot"; return; }
      var el = aiuti.el, bBot, bOnl, liv, notaOnl;
      function selModo(m) {
        dove.modo = m;
        bBot.className = "modo-chip" + (m === "bot" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        liv.hidden = (m !== "bot"); notaOnl.hidden = (m !== "online");
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { selModo("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro il computer" }), el("div", { class: "ms", text: "Da solo, sul tuo telefono" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { selModo("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online (in due)" }), el("div", { class: "ms", text: "Ognuno dal suo telefono" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      // scelta difficoltà (solo contro il computer)
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
      notaOnl = el("div", { class: "link-avviso", hidden: "hidden", text: (window.SGNet && SGNet.disponibile())
        ? "Premi Comincia per aprire la stanza e manda il codice all'avversario."
        : "L'online serve il sito pubblicato: da un file locale non è disponibile." });
      box.appendChild(notaOnl);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteHK(t, t.linkParams.stanza);
      var imp = t.impostazioni || {};
      if (imp.modo === "online") return hostHK(t);
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
  function servi(st) {
    st.px = 0.5; st.py = ASP / 2;   // esatto centro
    st.pvx = 0; st.pvy = 0;          // FERMO: parte solo quando qualcuno lo colpisce
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
  }
  // un sotto-passo di fisica (dt fisso). Le velocità racchetta arrivano da fuori (st._hvx…)
  function passo(st, dt, onGol) {
    if (st.fase !== "gioco") return;
    var prevx = st.px, prevy = st.py;
    st.px += st.pvx * dt; st.py += st.pvy * dt;
    var f = Math.exp(-0.45 * dt); st.pvx *= f; st.pvy *= f;
    collide(st, prevx, prevy, st.hx, st.hy, st._hvx || 0, st._hvy || 0);
    collide(st, prevx, prevy, st.gx, st.gy, st._gvx || 0, st._gvy || 0);
    if (st.px < RP) { st.px = RP; st.pvx = Math.abs(st.pvx) * REST; }
    if (st.px > 1 - RP) { st.px = 1 - RP; st.pvx = -Math.abs(st.pvx) * REST; }
    if (st.py < RP) { if (inPorta(st.px)) return onGol(1); st.py = RP; st.pvy = Math.abs(st.pvy) * REST; }
    if (st.py > ASP - RP) { if (inPorta(st.px)) return onGol(2); st.py = ASP - RP; st.pvy = -Math.abs(st.pvy) * REST; }
    var sp = Math.hypot(st.pvx, st.pvy); if (sp > MAXV) { st.pvx *= MAXV / sp; st.pvy *= MAXV / sp; }
  }

  // ---------- disegno (host e ospite) ----------
  function creaCanvas(t, s) {
    var el = t.el;
    var wrap = el("div", { style: "display:flex;justify-content:center;margin-top:6px" });
    var cv = el("canvas", { style: "touch-action:none;border-radius:14px;background:#0b1020;box-shadow:0 0 0 1px rgba(255,255,255,.08)" });
    wrap.appendChild(cv); s._contenuto.appendChild(wrap);
    // il campo deve ENTRARE TUTTO nello schermo (tutte e due le porte visibili senza scorrere):
    // si adatta sia alla larghezza sia all'altezza disponibile, mantenendo le proporzioni (ASP).
    var vw = window.innerWidth || 360, vh = window.innerHeight || 640;
    var maxW = Math.min(420, Math.floor(vw - 20));
    var riserva = 160;                                   // intestazione + indicatore + margini
    var maxH = Math.max(240, Math.floor(vh - riserva));
    var cssW, cssH;
    if (maxW * ASP <= maxH) { cssW = maxW; cssH = Math.round(maxW * ASP); }   // limita la larghezza
    else { cssH = maxH; cssW = Math.round(maxH / ASP); }                       // limita l'altezza
    var dpr = window.devicePixelRatio || 1;
    cv.style.width = cssW + "px"; cv.style.height = cssH + "px";
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    return { cv: cv, ctx: ctx, cssW: cssW, cssH: cssH };
  }
  // dopo che la schermata è a video, MISURA lo spazio davvero rimasto sotto al campo
  // e lo ridimensiona per farci stare tutto il campo (niente scorrimento). Robusto su ogni telefono.
  function adattaCanvas(C) {
    var rect = C.cv.getBoundingClientRect();
    var disp = (window.innerHeight || 640) - rect.top - 12;      // spazio dall'alto del campo al fondo schermo
    var maxW = Math.min(420, Math.floor((window.innerWidth || 360) - 20));
    var maxH = Math.max(200, Math.floor(disp));
    var cssW, cssH;
    if (maxW * ASP <= maxH) { cssW = maxW; cssH = Math.round(maxW * ASP); }
    else { cssH = maxH; cssW = Math.round(maxH / ASP); }
    if (cssW === C.cssW && cssH === C.cssH) return;
    var dpr = window.devicePixelRatio || 1;
    C.cv.style.width = cssW + "px"; C.cv.style.height = cssH + "px";
    C.cv.width = Math.round(cssW * dpr); C.cv.height = Math.round(cssH * dpr);
    C.ctx.setTransform(1, 0, 0, 1, 0, 0); C.ctx.scale(dpr, dpr);
    C.cssW = cssW; C.cssH = cssH;
  }
  function cerchio(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
  function disegna(ctx, cssW, o, flip) {
    var H = cssW * ASP, W = cssW;
    function P(x, y) { return flip ? [(1 - x) * W, (ASP - y) * W] : [x * W, y * W]; }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H);
    // linea di metà campo + cerchio
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W * 0.14, 0, 6.2832); ctx.stroke();
    // porte
    var gx0 = (0.5 - GOALW / 2) * W, gx1 = (0.5 + GOALW / 2) * W;
    ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.strokeStyle = flip ? "#4dabf7" : "#ff6b6b"; ctx.beginPath(); ctx.moveTo(gx0, 3); ctx.lineTo(gx1, 3); ctx.stroke();
    ctx.strokeStyle = flip ? "#ff6b6b" : "#4dabf7"; ctx.beginPath(); ctx.moveTo(gx0, H - 3); ctx.lineTo(gx1, H - 3); ctx.stroke();
    // punteggi (grandi e tenui, ognuno vicino alla propria porta)
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "700 " + Math.round(W * 0.16) + "px system-ui,sans-serif";
    var pH = P(0.5, ASP * 0.74), pG = P(0.5, ASP * 0.26);
    ctx.fillStyle = "rgba(77,171,247,.18)"; ctx.fillText(String(o.s1), pH[0], pH[1]);
    ctx.fillStyle = "rgba(255,107,107,.18)"; ctx.fillText(String(o.s2), pG[0], pG[1]);
    // disco + racchette
    var pk = P(o.px, o.py), hp = P(o.hx, o.hy), gp = P(o.gx, o.gy);
    cerchio(ctx, hp[0], hp[1], RPAD * W, "#4dabf7");
    cerchio(ctx, gp[0], gp[1], RPAD * W, "#ff6b6b");
    cerchio(ctx, pk[0], pk[1], RP * W, "#ffffff");
    // scritta gol
    if (o.fase === "gol") { ctx.fillStyle = "#ffd43b"; ctx.font = "800 " + Math.round(W * 0.11) + "px system-ui,sans-serif"; ctx.fillText("GOL!", W / 2, H / 2); }
  }

  // ---------- controllo racchetta (input locale) ----------
  function collegaInput(C, flip, meta, onMove) {
    // meta = "basso" (host, metà bassa) o "alto" (ospite, che però vede la sua racchetta in basso grazie al flip)
    var cv = C.cv;
    function pos(e) {
      var r = cv.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      var cssW = C.cssW;   // dimensione aggiornata (dopo adattaCanvas)
      var x, y;
      if (flip) { x = 1 - cx / cssW; y = ASP - cy / cssW; } else { x = cx / cssW; y = cy / cssW; }
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
  // Difficoltà: quanto è veloce la racchetta del bot, quanto è precisa (errore)
  // e quanto mira alla porta (aggressività).
  var DIFF = {
    facile:    { nome: "Facile",    vel: 0.95, err: 0.11, mira: 0.4 },
    medio:     { nome: "Medio",     vel: 1.55, err: 0.05, mira: 0.9 },
    difficile: { nome: "Difficile", vel: 2.35, err: 0.015, mira: 1.3 }
  };
  // muove la racchetta del bot (in alto: gx,gy) verso il suo bersaglio del momento
  function botMuovi(st, dt, D) {
    var tx, ty, attacca = st.py < ASP * 0.5;   // il disco è nella metà del bot
    if (attacca) {
      tx = st.px + st.pvx * 0.06;              // anticipa un po' il disco
      ty = st.py - (RP + RPAD) * 0.85;         // mettiti SOPRA il disco per spingerlo giù
      tx += (0.5 - st.px) * 0.15 * D.mira;     // punta un filo verso il centro (porta avversaria)
    } else {
      tx = 0.5 + (st.px - 0.5) * 0.7;          // difendi: davanti alla tua porta, segui la x del disco
      ty = 0.16;
    }
    tx += (Math.random() - 0.5) * D.err;
    ty += (Math.random() - 0.5) * D.err * 0.5;
    tx = clamp(tx, RPAD, 1 - RPAD);
    ty = clamp(ty, RPAD, ASP / 2 - RPAD);
    var dx = tx - st.gx, dy = ty - st.gy, dist = Math.hypot(dx, dy), step = D.vel * dt;
    if (dist > step && dist > 1e-6) { st.gx += dx / dist * step; st.gy += dy / dist * step; }
    else { st.gx = tx; st.gy = ty; }
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
    var st = statoNuovo(); st.fase = "gioco";
    var C = null, raf = null, ultimoT = 0, acc = 0, vista = null, salvato = false;
    function gol(chi) {
      if (chi === 1) st.s1++; else st.s2++;
      if (st.s1 >= VINCI || st.s2 >= VINCI) {
        st.fase = "fine"; st.vincitore = st.s1 > st.s2 ? 1 : 2;
        if (!salvato) { salvato = true; salvaHockey(st); }
        render();
      } else { st.fase = "gol"; st.golT = performance.now(); servi(st); }
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      var dt = ultimoT ? (now - ultimoT) / 1000 : 0.016; ultimoT = now; if (dt > 0.1) dt = 0.1;
      if (st.fase === "gol" && now - st.golT > 1200) st.fase = "gioco";
      if (st.fase === "gioco") botMuovi(st, dt, D);
      var fdt = Math.max(0.004, dt);
      st._hvx = (st.hx - st.hpx) / fdt; st._hvy = (st.hy - st.hpy) / fdt;
      st._gvx = (st.gx - st.gpx) / fdt; st._gvy = (st.gy - st.gpy) / fdt;
      st.hpx = st.hx; st.hpy = st.hy; st.gpx = st.gx; st.gpy = st.gy;
      acc += dt; var guard = 0;
      while (acc >= HSTEP && guard++ < 12) { passo(st, HSTEP, gol); acc -= HSTEP; if (st.fase !== "gioco") { acc = 0; break; } }
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
        sf._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: function () { st.s1 = 0; st.s2 = 0; st.vincitore = null; salvato = false; servi(st); st.fase = "gioco"; vista = null; render(); } }));
        sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: function () { stop(); t.esci(); } }));
        t.mostra(sf);
      } else {
        var sg = t.schermata({ icona: "🏒", titolo: "Glow Hockey", sotto: "Tu (blu) in basso · 🤖 " + D.nome, indietro: function () { stop(); t.esci(); } });
        C = creaCanvas(t, sg);
        collegaInput(C, false, "basso", function (x, y) { st.hx = x; st.hy = y; });
        t.mostra(sg);
        adattaCanvas(C);
        ultimoT = 0; raf = requestAnimationFrame(loop);
      }
    }
    render();
  }

  // ---------- HOST ----------
  function hostHK(t) {
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
    function vm() { return { t: "g", fase: st.fase, px: st.px, py: st.py, pvx: st.pvx, pvy: st.pvy, hx: st.hx, hy: st.hy, gx: st.gx, gy: st.gy, s1: st.s1, s2: st.s2, vincitore: st.vincitore, codice: st.codice, pronta: st.pronta }; }
    function bcast(ret) { if (ret) rete.invia(vm()); else rete.inviaVeloce(vm()); }
    function gol(chi) { if (chi === 1) st.s1++; else st.s2++; if (st.s1 >= VINCI || st.s2 >= VINCI) { st.fase = "fine"; st.vincitore = st.s1 > st.s2 ? 1 : 2; } else { st.fase = "gol"; st.golT = performance.now(); servi(st, chi === 1 ? -1 : 1); } bcast(true); }
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
          [["🔴", "Avversario (host)", false], ["🔵", "Tu", true]].forEach(function (p) {
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
        var sg = t.schermata({ icona: "🏒", titolo: "Glow Hockey", sotto: "Tu (rosso) in basso · segna in alto", indietro: function () { stop(); if (S.rete) S.rete.chiudi(); t.esci(); } });
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
