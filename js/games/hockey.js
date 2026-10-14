/* =========================================================
   GIOCO — "Glow Hockey"  (air hockey al neon: contro il Bot o in due sullo stesso telefono)
   Online (spento per ora) host-autoritativo: l'host calcola la fisica del disco a
   ~60fps ed è la "fonte di verità"; l'ospite NON simula il disco
   (divergerebbe → teletrasporti), ma lo INTERPOLA fra gli ultimi
   stati ricevuti con un piccolo ritardo (liscio). Coordinate NORM.
   (indipendenti dallo schermo): campo largo 1, alto ASPETTO.
   ========================================================= */
(function () {
  "use strict";

  var ASP = 1.7;                 // altezza campo in unità (larghezza = 1)
  var RP = 0.055;                // raggio disco (+10% il 26 set: il campo ora è più alto, a tutto schermo)
  var RPAD = 0.10;               // raggio racchetta (+10%)
  var GOALW = 0.46;              // larghezza porta (in x, centrata): un filo più larga col disco più grande
  var REST = 0.94;              // rimbalzo pareti
  var MAXV = 3.4;                // velocità massima disco (unità/sec)
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
  // Proporzioni del campo: contro il Bot si adattano allo schermo (niente spazio vuoto
  // sotto). L'online (spento) userebbe 1.7 fisso, uguale per i due telefoni.
  function impostaASP(a) { ASP = a; KH = (1 - 2 * BORDO) * ASP + 2 * BORDO; campoCache = null; }
  // altezza VERA dello schermo (misurata da core.js in --alt): il campo va da bordo a bordo, fino in fondo
  function altezzaSchermo() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alt")) || window.innerHeight || 640; }
  function aspSchermo() {
    var w = Math.min(600, window.innerWidth || 360), h = altezzaSchermo();
    return clamp(((h / w) - 2 * BORDO) / (1 - 2 * BORDO), 1.4, 2.5);
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
      else if (tipo === "atterra") { nota(120, t0, 0.12, 0.3, "sine"); nota(240, t0, 0.05, 0.12, "triangle"); }   // "tump" del disco che tocca terra
    } catch (e) {}
  }
  // (niente vibrazioni: per regola il telefono vibra solo quando si tocca per scegliere)

  // ---------- musica gasante (stile Geometry Dash), generata: niente file ----------
  // 140 battiti: cassa dritta, clap sul 2 e 4, charleston, basso "pompato" in levare, arpeggio brillante
  // su La- · Fa · Do · Sol, e dopo l'intro una melodia. Tasto 🎵/🔇 (scelta ricordata).
  var MusicaHK = (function () {
    var on = true, ctx = null, master = null, timer = null, nextT = 0, step = 0, rumore = null;
    try { on = localStorage.getItem("sg-musica-hockey") !== "off"; } catch (e) {}
    var S = 60 / 140 / 4;
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    var GIRO = [
      { b: 45, a: [69, 72, 76, 81], m: [81, 79, 76, 79] },   // La-
      { b: 41, a: [65, 69, 72, 77], m: [77, 76, 72, 76] },   // Fa
      { b: 48, a: [67, 72, 76, 79], m: [79, 76, 72, 84] },   // Do
      { b: 43, a: [67, 71, 74, 79], m: [79, 83, 86, 83] }    // Sol
    ];
    function osc(tipo, f, t0, dur, vol, filtroHz) {
      var o = ctx.createOscillator(), g = ctx.createGain(), dest = master;
      o.type = tipo; o.frequency.value = f;
      if (filtroHz) { var fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = filtroHz; g.connect(fl); fl.connect(master); dest = null; }
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); if (dest) g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.03);
    }
    function cassa(t0) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(160, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.11);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.8, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.25);
    }
    function suonoRumore(t0, dur, vol, tipoF, fHz) {
      if (!rumore) { rumore = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.2), ctx.sampleRate); var d = rumore.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = rumore; f.type = tipoF; f.frequency.value = fHz;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
    }
    function passo(t0) {
      var i = step % 16, battuta = Math.floor(step / 16), c = GIRO[battuta % 4], intro = battuta < 2;
      if (i % 4 === 0) cassa(t0);
      if (!intro && (i === 4 || i === 12)) suonoRumore(t0, 0.13, 0.35, "bandpass", 1600);        // clap
      suonoRumore(t0, 0.03, i % 2 ? 0.05 : (i % 4 === 2 ? 0.1 : 0.03), "highpass", 8000);       // charleston
      if (i % 4 === 2) { osc("sawtooth", hz(c.b), t0, S * 1.7, 0.22, 700); osc("sine", hz(c.b - 12), t0, S * 1.7, 0.3); }   // basso in levare
      osc("square", hz(c.a[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]]), t0, S * 0.9, intro ? 0.035 : 0.05, 3200);                    // arpeggio
      if (battuta >= 4 && i % 4 === 0) osc("sawtooth", hz(c.m[i / 4]), t0, S * 3.4, 0.07, 4200);                          // melodia
      step++;
    }
    function loop() {
      if (!ctx) return;
      if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;   // rimasto indietro (timer rallentati): salta avanti, niente raffiche di note
      while (nextT < ctx.currentTime + 0.25) { var s0 = step; try { passo(nextT); } catch (e) { if (step === s0) step++; } nextT += S; }   // (un errore audio non deve mai fermare il gioco)
    }
    function parti() {
      ctx = SG.audioCtx && SG.audioCtx(); if (!ctx || timer) return;
      if (!master) {
        master = ctx.createGain();
        var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 10; comp.attack.value = 0.003; comp.release.value = 0.15;
        master.connect(comp); comp.connect(ctx.destination);
      }
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime); master.gain.exponentialRampToValueAtTime(0.38, ctx.currentTime + 0.8);
      nextT = ctx.currentTime + 0.08; step = 0; timer = setInterval(loop, 80); loop();
    }
    function ferma() {
      if (timer) { clearInterval(timer); timer = null; }
      if (ctx && master) { try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime); master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4); } catch (e) {} }
    }
    var giocando = false;
    // app in sottofondo (WhatsApp, schermo spento): la musica si ferma e riparte al ritorno
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (timer) ferma(); }
      else if (giocando && on) parti();
    });
    return {
      avvia: function () { giocando = true; if (on) parti(); },
      ferma: function () { giocando = false; ferma(); },
      bottone: function (el) {   // tasto 🎵/🔇 in alto a destra sul campo
        var b = el("button", { title: "Musica", text: on ? "🎵" : "🔇", style: "position:absolute;top:calc(6px + env(safe-area-inset-top));right:8px;z-index:31;width:40px;height:40px;border-radius:12px;border:0;background:rgba(0,0,0,.35);font-size:1.2rem;cursor:pointer" });
        b.addEventListener("click", function () {
          on = !on; try { localStorage.setItem("sg-musica-hockey", on ? "on" : "off"); } catch (e) {}
          b.textContent = on ? "🎵" : "🔇"; if (giocando) { if (on) parti(); else ferma(); }
        });
        return b;
      }
    };
  })();
  // i tocchi li conta la fisica (st.colpi / st.sponde): chi disegna suona quando i contatori salgono
  function suonaEventi(s, mem) {
    if ((s.colpi || 0) > (mem.colpi || 0)) suono("colpo", s.forzaColpo || 1);
    if ((s.sponde || 0) > (mem.sponde || 0)) suono("sponda");
    if ((s.atterra || 0) > (mem.atterra || 0)) suono("atterra");
    mem.colpi = s.colpi || 0; mem.sponde = s.sponde || 0; mem.atterra = s.atterra || 0;
  }
  function suonoGol(fatto) { suono(fatto ? "gol" : "golSubito"); }
  // scelte ricordate su questo telefono (ultima difficoltà, gol per vincere)
  function ricorda(k, def) { try { var v = localStorage.getItem("sg-hockey-" + k); return v == null ? def : v; } catch (e) { return def; } }
  function memorizza(k, v) { try { localStorage.setItem("sg-hockey-" + k, String(v)); } catch (e) {} }
  function livOk(l) { return DIFF[l] ? l : "medio"; }
  function vinciOk(n) { n = +n; return n === 3 || n === 5 || n === 7 ? n : VINCI; }

  SG.registra({
    id: "hockey",
    nome: "Glow Hockey",
    icona: "🏒",
    descrizione: "Air hockey al neon: sfida il Bot (Facile, Medio o Difficile) o un amico sullo stesso telefono. Colpisci il disco col dito e segna nella porta di fronte.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 2, etichettaGiocatori: "🤖 Contro il Bot · 👥 in due",
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il Bot", sotto: "Facile, Medio o Difficile" },
      { modo: "due", icona: "👥", nome: "In due su questo telefono", sotto: "Uno da una parte, uno dall'altra: si gioca insieme", amici: true }],
    regole: [
      "Muovi la <b>racchetta</b> col dito nella tua metà campo (non puoi passare la linea di centrocampo) e colpisci il <b>disco</b>.",
      "Segna nella porta di fronte a te. Vince chi arriva per primo ai <b>gol scelti</b> (3, 5 o 7).",
      "Dopo un gol il disco cade dall'alto nella metà di chi l'ha subito.",
      "Il disco non può restare più di <b>7 secondi</b> nella tua metà: negli ultimi 3 vedi il conto, poi scivola dall'altra parte.",
      "<b>Contro il Bot</b>: scegli Facile, Medio o Difficile. I trofei delle vittorie contano nelle partite a 7.",
      "<b>In due</b>: mettete il telefono in mezzo, sul tavolo. Chi sta sotto gioca col blu, chi sta sopra col giallo.",
      "Un gol dopo una sponda è un <b>gol di sponda</b>!"
    ],
    // L'online (hostHK / ospiteHK più sotto) per ora è SPENTO: il codice resta per riprovarci in futuro.
    impostazioni: function (box, dove, aiuti) {
      dove.torneo = !!aiuti.torneo;
      dove.modo = aiuti.torneo ? "due" : (aiuti.modo || "bot");
      dove.botLiv = livOk(ricorda("liv", "medio")); dove.vinci = vinciOk(ricorda("vinci", VINCI));
      if (aiuti.torneo) { dove.vinci = 5; return; }   // nel torneo: in due, a 5 gol
      var el = aiuti.el;
      // una fila di scelte (si accende quella scelta)
      function scelte(titolo, voci, attuale, onSel) {
        var box2 = el("div", { style: "margin-bottom:14px" });
        box2.appendChild(el("div", { class: "etichetta", text: titolo }));
        var chips = el("div", { class: "modo-griglia", style: "display:grid;grid-template-columns:repeat(" + voci.length + ",1fr);gap:8px" });   // le scelte in fila, una accanto all'altra
        voci.forEach(function (x) {
          var c = el("button", { class: "modo-chip" + (x[0] === attuale ? " attiva" : ""), style: "flex-direction:column;justify-content:center;gap:2px;text-align:center;padding:10px 4px", onclick: function () {
            onSel(x[0]); [].forEach.call(chips.children, function (k) { k.className = "modo-chip"; }); c.className = "modo-chip attiva";
          } }, [ el("span", { class: "mi", text: x[2] }), el("div", { class: "mt", text: x[1] }) ]);
          chips.appendChild(c);
        });
        box2.appendChild(chips);
        box.appendChild(box2);
      }
      if (dove.modo === "bot") scelte("Difficoltà del Bot", [["facile", "Facile", "🙂"], ["medio", "Medio", "😎"], ["difficile", "Difficile", "🔥"]], dove.botLiv,
        function (v) { dove.botLiv = v; memorizza("liv", v); });
      scelte("Gol per vincere", [[3, "Veloce", "3"], [5, "Normale", "5"], [7, "Lunga", "7"]], dove.vinci,
        function (v) { dove.vinci = v; memorizza("vinci", v); });
    },
    avvia: function (t) {
      var lp = t.linkParams || {};
      if (ONLINE_ATTIVO && lp.stanza) return ospiteHK(t, lp.stanza);
      // online spento: un vecchio link a una stanza apre la partita contro il Bot, e la stanza
      // si dimentica subito (niente "Rientra nella partita" per una stanza che non c'è)
      if (lp.stanza && !lp.guarda) try {
        var u = JSON.parse(localStorage.getItem("sg-ultima-stanza") || "null");
        if (u && u.gioco === "hockey") localStorage.removeItem("sg-ultima-stanza");
      } catch (e) {}
      var imp = t.impostazioni || {}, g = t.giocatori || [];
      if (ONLINE_ATTIVO && imp.modo === "online") return hostHK(t);
      var vinci = vinciOk(imp.vinci);
      if (imp.modo === "due" && !(imp.torneo && g.length < 2))
        return partitaHK(t, { nomi: [g[0] || "Giocatore 1", g[1] || "Giocatore 2"], vinci: vinci, torneo: !!imp.torneo });
      return partitaHK(t, { liv: imp.torneo ? "medio" : livOk(imp.botLiv), nomi: [g[0] || "Tu", "Bot"], vinci: vinci, torneo: !!imp.torneo });
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
  function collide(st, prevx, prevy, padx, pady, pvx, pvy, chi) {
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
    st.tocco = chi; st.spDopo = 0;   // chi l'ha toccato per ultimo (per il "gol di sponda")
    var vn = st.pvx * nx + st.pvy * ny;
    if (vn < 0) { st.pvx -= 2 * vn * nx; st.pvy -= 2 * vn * ny; }
    st.pvx += pvx * PADK; st.pvy += pvy * PADK;
    var sp = Math.hypot(st.pvx, st.pvy); if (sp > MAXV) { st.pvx *= MAXV / sp; st.pvy *= MAXV / sp; }
    // un tocco vero (non la racchetta ferma appoggiata al disco): conta per il suono
    // (conta solo se il disco arrivava contro la racchetta o la racchetta andava VERSO il disco: strisciarci accanto non è un colpo)
    var ridosso = aRidosso(st);   // (disco contro la sponda: serve un colpo deciso)
    if (vn < -0.25 || pvx * nx + pvy * ny > (ridosso ? 0.8 : 0.3)) { st.colpi = (st.colpi || 0) + 1; st.forzaColpo = Math.hypot(st.pvx, st.pvy); }
  }
  // sponda vera: conta per il suono e segna DOVE ha toccato (il bordo lì si illumina)
  function sponda(st, v) { if (Math.abs(v) > 0.25) { st.sponde = (st.sponde || 0) + 1; st.spDopo = (st.spDopo || 0) + 1; st.spX = st.px; st.spY = st.py; } }
  // disco a ridosso di una sponda (o di un angolo)
  function aRidosso(st) { return st.px < RP + 0.004 || st.px > 1 - RP - 0.004 || st.py < RP + 0.004 || st.py > ASP - RP - 0.004; }
  // dove può andare il dito: se il disco è fermo contro una sponda, la racchetta non può entrarci
  // dentro piano piano (si ferma appena prima): niente colpi finti a raffica e niente disco "sparato" dopo.
  // Un colpo deciso invece passa: la racchetta arriva veloce e il disco parte davvero.
  function fuoriDalDisco(st, x, y, basso, cx, cy) {   // cx, cy = dov'era la racchetta a inizio fotogramma
    if (!aRidosso(st) || st.cade > 0) return [x, y];
    var md = RP + RPAD, dOra = Math.hypot(cx - st.px, cy - st.py), dDopo = Math.hypot(x - st.px, y - st.py);
    if (dDopo >= md) return [x, y];
    if (dOra > md + 0.004 && dOra - dDopo > 0.02) return [x, y];   // colpo deciso, partendo da staccata (non appoggiata al disco)
    return spingiFuori(st, x, y, basso, cx, cy, md + 0.001);   // dito sul disco: la racchetta resta dal lato da cui arriva
  }
  // porta il punto (x, y) appena fuori dal disco, restando nella metà giusta (anche in un angolo)
  function spingiFuori(st, x, y, basso, rx, ry, dist) {   // dist = distanza fra i centri da tenere
    var md = dist - 0.0005, md2 = dist;
    for (var i = 0; i < 4; i++) {
      var dx = x - st.px, dy = y - st.py, d = Math.hypot(dx, dy);
      if (d >= md) break;
      if (d < 1e-6) {
        dx = rx - st.px; dy = ry - st.py; d = Math.hypot(dx, dy);
        if (d < 1e-6) { dx = 0.5 - st.px; dy = (basso ? ASP - 0.2 : 0.2) - st.py; d = Math.hypot(dx, dy) || 1; }
      }
      x = clamp(st.px + dx / d * md2, RPAD, 1 - RPAD);
      y = basso ? clamp(st.py + dy / d * md2, ASP / 2 + RPAD, ASP - RPAD) : clamp(st.py + dy / d * md2, RPAD, ASP / 2 - RPAD);
    }
    return [x, y];
  }
  // disco chiuso fra la sponda e una racchetta che si muove appena: i rimbalzi a vuoto non devono
  // caricarlo di velocità finta (si smorza). Un colpo vero (racchetta veloce) non viene toccato.
  function incastrato(st, k, vx, vy) {
    return aRidosso(st) && Math.hypot(st[k + "x"] - st.px, st[k + "y"] - st.py) < RP + RPAD + 0.006 && Math.hypot(vx || 0, vy || 0) < 1.2;
  }
  // a fine fotogramma: la racchetta non può stare SOPRA il disco (succede quando lo schiacci contro la sponda).
  // k = "h" (racchetta di sotto) o "g" (di sopra)
  function staccaDalDisco(st, k) {
    var x = st[k + "x"], y = st[k + "y"];
    if (Math.hypot(x - st.px, y - st.py) >= RP + RPAD) return;
    var p = spingiFuori(st, x, y, k === "h", x, y, RP + RPAD + 0.001);   // (un millimetro di aria)
    st[k + "x"] = p[0]; st[k + "y"] = p[1];
  }
  // dopo un gol (e a inizio partita) il disco CADE DALL'ALTO: finché è in aria non si muove e non si colpisce,
  // ma le racchette sono libere. Appena tocca terra si gioca.
  var CADUTA = 0.9;
  var SETTE = 7;   // secondi massimi col disco nella stessa metà
  function faiCadere(st) { st.cade = CADUTA; }
  // un sotto-passo di fisica (dt fisso). Le velocità racchetta arrivano da fuori (st._hvx…)
  // palo della porta: uno spigolo contro cui il disco rimbalza (come nel biliardino)
  function palo(st, x, y) {
    var dx = st.px - x, dy = st.py - y, d = Math.hypot(dx, dy);
    if (d >= RP || d < 1e-9) return;
    var nx = dx / d, ny = dy / d;
    st.px = x + nx * RP; st.py = y + ny * RP;
    var vn = st.pvx * nx + st.pvy * ny;
    if (vn < 0) { var sd = st.spDopo; sponda(st, vn); st.spDopo = sd; st.pvx -= (1 + REST) * vn * nx; st.pvy -= (1 + REST) * vn * ny; }   // (il palo suona e si illumina, ma un gol "palo e dentro" non è di sponda)
  }
  function passo(st, dt, onGol) {
    if (st.fase !== "gioco") return;
    if (st.cade > 0) { st.cade -= dt; if (st.cade <= 0) { st.cade = 0; st.atterra = (st.atterra || 0) + 1; } return; }   // disco ancora in aria
    var prevx = st.px, prevy = st.py;
    st.px += st.pvx * dt; st.py += st.pvy * dt;
    var f = Math.exp(-ATTRITO * dt); st.pvx *= f; st.pvy *= f;
    collide(st, prevx, prevy, st.hx, st.hy, st._hvx || 0, st._hvy || 0, 1);
    collide(st, prevx, prevy, st.gx, st.gy, st._gvx || 0, st._gvy || 0, 2);
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
    if (!document.getElementById("sg-hockey-css")) { var stc = document.createElement("style"); stc.id = "sg-hockey-css";
      stc.textContent = ".schermata.hk-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:" + TEMA.sfondo + "}"; document.head.appendChild(stc); }
    s.classList.add("hk-piena");   // campo a tutto schermo: niente margini, niente bordi arrotondati
    var wrap = el("div", { style: "display:flex;justify-content:center;margin:0" });
    var cv = el("canvas", { style: "touch-action:none;display:block;background:" + TEMA.sfondo });
    wrap.appendChild(cv); s._contenuto.appendChild(wrap);
    // il campo deve ENTRARE TUTTO nello schermo (tutte e due le porte visibili senza scorrere):
    // si adatta sia alla larghezza sia all'altezza disponibile, mantenendo le proporzioni (ASP).
    var vw = window.innerWidth || 360;
    var maxW = Math.min(600, Math.floor(vw));
    var maxH = Math.max(240, Math.floor(altezzaSchermo()));
    var cssW, cssH;
    if (maxW * KH <= maxH) { cssW = maxW; cssH = Math.round(maxW * KH); }     // limita la larghezza
    else { cssH = maxH; cssW = Math.round(maxH / KH); }                         // limita l'altezza
    var dpr = window.devicePixelRatio || 1;
    cv.style.width = cssW + "px"; cv.style.height = cssH + "px";
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    // alpha:false = più veloce. NIENTE "desynchronized": su molti telefoni provoca tearing
    // (l'immagine si spezza e disco/racchette sembrano scomporsi).
    var ctx = null;
    try { ctx = cv.getContext("2d", { alpha: false }); } catch (e) {}
    if (!ctx) ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    return { cv: cv, ctx: ctx, cssW: cssW, cssH: cssH };
  }
  // dopo che la schermata è a video, MISURA lo spazio davvero rimasto sotto al campo
  // e lo ridimensiona per farci stare tutto il campo (niente scorrimento). Robusto su ogni telefono.
  function adattaCanvas(C) {
    var rect = C.cv.getBoundingClientRect();
    var sch = C.cv.closest(".schermata"), topRel = sch ? rect.top - sch.getBoundingClientRect().top : rect.top;   // (misurato rispetto alla schermata: l'animazione d'entrata non conta)
    var disp = altezzaSchermo() - Math.max(0, topRel);          // spazio dall'alto del campo al fondo schermo
    var maxW = Math.min(600, Math.floor(window.innerWidth || 360));
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
  var luci = [], luciN = null;   // punti del bordo illuminati (dai contatori delle sponde)
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
    // linee: metà campo, cerchio centrale, lunette davanti alle porte (con un filo di luce)
    ctx.strokeStyle = T.linee; ctx.lineWidth = 2; ctx.shadowColor = "rgba(140,190,255,.55)"; ctx.shadowBlur = B * 0.5;
    ctx.beginPath(); ctx.moveTo(B, H / 2); ctx.lineTo(W - B, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, F * 0.16, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, B, GOALW / 2 * F, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H - B, GOALW / 2 * F, Math.PI, 2 * Math.PI); ctx.stroke();
    // bordi al neon (fuori dall'area di gioco): sopra gialli, sotto blu. La porta è un BUCO nel bordo.
    // Il bagliore si disegna qui UNA volta sola (il campo è in cache): nessun costo a ogni frame.
    ctx.lineWidth = B; ctx.lineCap = "butt"; ctx.lineJoin = "round"; ctx.shadowBlur = B * 1.4;
    function lato(xPorta, yBordo, xLato, yFine, col) {   // dal palo, giro l'angolo, fino a metà campo
      var dx = xLato < W / 2 ? 1 : -1, dy = yBordo < H / 2 ? 1 : -1;
      ctx.strokeStyle = col; ctx.shadowColor = col; ctx.beginPath();
      ctx.moveTo(xPorta, yBordo); ctx.lineTo(xLato + dx * rr, yBordo);
      ctx.arcTo(xLato, yBordo, xLato, yBordo + dy * rr, rr);
      ctx.lineTo(xLato, yFine); ctx.stroke();
      cerchio(ctx, xLato, yFine, m, col);              // punta arrotondata verso il centrocampo
    }
    lato(gx0, m, m, H / 2 - gc, T.bordoAlto);         lato(gx1, m, W - m, H / 2 - gc, T.bordoAlto);
    lato(gx0, H - m, m, H / 2 + gc, T.bordoBasso);    lato(gx1, H - m, W - m, H / 2 + gc, T.bordoBasso);
    ctx.shadowBlur = 0;
  }
  // racchette e disco al neon: disegnati UNA volta (col bagliore) su piccoli canvas, poi solo copiati
  var sprCache = {};
  function sprite(nome, R, dpr, disegnaIn) {
    var k = nome + "|" + Math.round(R * 10) + "|" + dpr;
    if (sprCache[k]) return sprCache[k];
    var gl = R * 0.7, s = 2 * (R + gl), cv = document.createElement("canvas");
    cv.width = Math.ceil(s * dpr); cv.height = Math.ceil(s * dpr);
    var c = cv.getContext("2d"); c.scale(dpr, dpr);
    disegnaIn(c, s / 2, R, gl);
    return (sprCache[k] = { cv: cv, s: s });
  }
  function spriteRacchetta(c, R, dpr) {
    return sprite("r" + c.fuori, R, dpr, function (x, m, R, gl) {
      x.shadowColor = c.fuori; x.shadowBlur = gl; cerchio(x, m, m, R, c.fuori); x.shadowBlur = 0;
      cerchio(x, m, m, R * 0.84, "#ffffff"); cerchio(x, m, m, R * 0.52, c.scuro); cerchio(x, m, m, R * 0.24, c.fuori);
    });
  }
  function spriteDisco(T, R, dpr) {
    return sprite("d" + T.disco, R, dpr, function (x, m, R, gl) {
      x.shadowColor = "rgba(190,230,255,.95)"; x.shadowBlur = gl; cerchio(x, m, m, R, T.discoBordo); x.shadowBlur = 0;
      cerchio(x, m, m, R * 0.8, T.disco);
    });
  }
  function metti(ctx, spr, x, y, sc) { var s = spr.s * (sc || 1); ctx.drawImage(spr.cv, x - s / 2, y - s / 2, s, s); }
  var scia = [], sciaU = null;   // ultime posizioni del disco veloce (la scia luminosa)
  function disegnaSopra(ctx, W, H, B, F, T, P, o, flip) {
    var dpr = window.devicePixelRatio || 1, ora = performance.now();
    // gol appena fatto: la porta di chi l'ha subito si accende del colore di chi ha segnato
    var golA = o.golVis && o.golA > 0 ? o.golA : 0, segnaSotto = o.golChi === (flip ? 2 : 1);   // segnaSotto = ha segnato chi sta in basso
    var colGol = segnaSotto ? T.io.fuori : T.avv.fuori;
    if (golA) {
      var gy = segnaSotto ? B : H - B, rg = GOALW * F * 0.75;
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = golA;
      var gg = ctx.createRadialGradient(W / 2, gy, 0, W / 2, gy, rg); gg.addColorStop(0, "#ffffff"); gg.addColorStop(0.2, colGol); gg.addColorStop(1, colGol + "00");
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(W / 2, gy, rg, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    // punteggio grande sul lato destro, a metà campo: sopra l'avversario, sotto il tuo (pulsa al gol).
    // In due sullo stesso telefono il numero di sopra è girato verso chi sta sopra.
    var mio = flip ? o.s2 : o.s1, suo = flip ? o.s1 : o.s2, fs = Math.round(F * 0.12);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    function numero(txt, x, y, col, sc, giro) {
      ctx.save(); ctx.translate(x, y); if (giro) ctx.rotate(Math.PI); if (sc !== 1) ctx.scale(sc, sc);
      ctx.font = "800 " + fs + "px system-ui,sans-serif"; ctx.fillStyle = col; ctx.globalAlpha = 0.9; ctx.fillText(txt, 0, 0); ctx.restore();
    }
    var puls = 1 + 0.5 * golA;
    if (o.due) numero(String(suo), B + F * 0.1, H / 2 - F * 0.1, T.bordoAlto, segnaSotto ? 1 : puls, true);
    else numero(String(suo), B + F * 0.9, H / 2 - F * 0.1, T.bordoAlto, segnaSotto ? 1 : puls, false);
    numero(String(mio), B + F * 0.9, H / 2 + F * 0.1, T.bordoBasso, segnaSotto ? puls : 1, false);
    // racchette
    var R = RPAD * F, rH = P(o.hx, o.hy), rG = P(o.gx, o.gy);
    metti(ctx, spriteRacchetta(flip ? T.avv : T.io, R, dpr), rH[0], rH[1]);   // racchetta dell'host / di chi sta sotto
    metti(ctx, spriteRacchetta(flip ? T.io : T.avv, R, dpr), rG[0], rG[1]);   // racchetta dell'ospite / del Bot / di chi sta sopra
    // bordi che si illuminano dove il disco li tocca (si spengono in mezzo secondo)
    var spN = o.spN != null ? o.spN : o.sponde;
    if (spN != null && spN !== luciN) { if (luciN != null && o.spX != null) luci.push({ x: o.spX, y: o.spY, t: ora }); luciN = spN; }
    for (var li = luci.length - 1; li >= 0; li--) {
      var L = luci[li], a = 1 - (ora - L.t) / 550; if (a <= 0) { luci.splice(li, 1); continue; }
      var lp = P(L.x, L.y), bx = lp[0], by = lp[1], dmin = Math.min(bx - B, W - B - bx, by - B, H - B - by);   // il punto del bordo più vicino
      if (dmin === bx - B) bx = B / 2; else if (dmin === W - B - bx) bx = W - B / 2; else if (dmin === by - B) by = B / 2; else by = H - B / 2;
      var colL = by < H / 2 ? T.bordoAlto : T.bordoBasso, rL = F * 0.2;
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
      var gl = ctx.createRadialGradient(bx, by, 0, bx, by, rL); gl.addColorStop(0, "#ffffff"); gl.addColorStop(0.25, colL); gl.addColorStop(1, colL + "00");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(bx, by, rL, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    var pk = P(o.px, o.py), RD = RP * F, spD = spriteDisco(T, RD, dpr);
    if (o.cade > 0) {   // disco che cade dall'alto: parte grande e sfumato, si rimpicciolisce fino a toccare terra
      scia.length = 0; sciaU = null;
      var k = Math.min(1, o.cade / CADUTA), sc = 1 + 2.6 * k * k;
      ctx.save(); ctx.globalAlpha = 0.25 + 0.35 * (1 - k); ctx.fillStyle = "#000";   // l'ombra: piccola e chiara in alto, piena appena prima di toccare
      ctx.beginPath(); ctx.ellipse(pk[0], pk[1], RD * (0.5 + 0.5 * (1 - k)), RD * (0.5 + 0.5 * (1 - k)), 0, 0, 6.2832); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * (1 - k);
      metti(ctx, spD, pk[0], pk[1] - RD * 1.2 * k, sc);
      ctx.restore();
    } else {
      // scia: quando il disco corre lascia dietro di sé qualche cerchio sempre più tenue
      var veloce = sciaU && Math.hypot(pk[0] - sciaU[0], pk[1] - sciaU[1]) > F * 0.018;
      if (veloce) { scia.push(sciaU); if (scia.length > 6) scia.shift(); } else if (scia.length) scia.shift();
      sciaU = pk;
      for (var si = 0; si < scia.length; si++) {
        var fr = (si + 1) / (scia.length + 1);
        ctx.globalAlpha = 0.28 * fr; cerchio(ctx, scia[si][0], scia[si][1], RD * (0.45 + 0.5 * fr), "#bfe6ff");
      }
      ctx.globalAlpha = 1;
      metti(ctx, spD, pk[0], pk[1]);
    }
    // regola dei 7 secondi: conto alla rovescia (3, 2, 1) in mezzo alla metà dove sta il disco
    if (o.metaT > SETTE - 3 && o.fase === "gioco") {
      var nC = Math.ceil(SETTE - o.metaT), sotto7 = o.metaChi === 1, pc = P(0.5, sotto7 ? ASP * 0.75 : ASP * 0.25);
      ctx.save(); ctx.translate(pc[0], pc[1]); if (!sotto7 && o.due) ctx.rotate(Math.PI);
      ctx.globalAlpha = 0.35 + 0.25 * (o.metaT % 1); ctx.font = "800 " + Math.round(F * 0.2) + "px system-ui,sans-serif";
      ctx.fillStyle = sotto7 ? T.bordoBasso : T.bordoAlto; ctx.fillText(String(nC), 0, 0);
      ctx.font = "700 " + Math.round(F * 0.045) + "px system-ui,sans-serif"; ctx.fillText("tira!", 0, F * 0.13);
      ctx.restore();
    }
    // scritta gol (per un attimo dopo il gol, mentre il disco cade), del colore di chi ha segnato
    if (o.fase === "gol" || o.golVis) {
      var sG = 1 + 0.25 * golA;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sG, sG);
      ctx.font = "800 " + Math.round(F * 0.13) + "px system-ui,sans-serif"; ctx.fillStyle = o.golChi ? colGol : "#ffd43b";
      ctx.fillText("GOL!", 0, o.golTxt ? -F * 0.035 : 0);
      if (o.golTxt) { ctx.font = "800 " + Math.round(F * 0.055) + "px system-ui,sans-serif"; ctx.fillStyle = "#ffffff"; ctx.fillText(o.golTxt, 0, F * 0.06); }
      ctx.restore();
    }
  }

  // ---------- controllo racchetta (input locale) ----------
  // meta = "basso" / "alto": una racchetta sola (l'ospite online vede la sua in basso grazie al flip);
  // meta = "due": due giocatori sullo stesso telefono, chi tocca sotto muove la racchetta di sotto, chi tocca sopra quella di sopra.
  // Ogni racchetta segue UN dito solo (il primo che l'ha presa): le altre dita non la fanno saltare.
  // onMove(x, y, quale, nuovo): nuovo = il dito si è appena appoggiato (la racchetta arriva lì senza "sparare" il disco)
  function collegaInput(C, flip, meta, onMove) {
    var cv = C.cv, dita = {};   // racchetta ("basso"/"alto") -> pointerId del dito che la muove
    function coord(e) {
      var r = cv.getBoundingClientRect(), G = geo(C.cssW);   // dimensione aggiornata (dopo adattaCanvas); il campo inizia dopo il bordo
      var fx = (e.clientX - r.left - G.B) / G.F, fy = (e.clientY - r.top - G.B) / G.F;
      return flip ? [1 - fx, ASP - fy] : [fx, fy];
    }
    function muovi(q, p, nuovo) {
      var x = clamp(p[0], RPAD, 1 - RPAD);
      var y = q === "basso" ? clamp(p[1], ASP / 2 + RPAD, ASP - RPAD) : clamp(p[1], RPAD, ASP / 2 - RPAD);
      onMove(x, y, q, nuovo);
    }
    cv.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var p = coord(e), q = meta === "due" ? (p[1] > ASP / 2 ? "basso" : "alto") : meta;
      if (dita[q] != null && dita[q] !== e.pointerId) return;   // quella racchetta ha già il suo dito
      dita[q] = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      muovi(q, p, true);
    });
    cv.addEventListener("pointermove", function (e) {
      for (var q in dita) if (dita[q] === e.pointerId) { e.preventDefault(); muovi(q, coord(e), false); }
    });
    function su(e) { for (var q in dita) if (dita[q] === e.pointerId) delete dita[q]; }
    cv.addEventListener("pointerup", su); cv.addEventListener("pointercancel", su);
    // anche sulla finestra: un dito alzato fuori dal campo non deve lasciare la racchetta "presa" per sempre
    function suFuori(e) {
      if (!cv.isConnected) { window.removeEventListener("pointerup", suFuori); window.removeEventListener("pointercancel", suFuori); return; }
      su(e);
    }
    window.addEventListener("pointerup", suFuori); window.addEventListener("pointercancel", suFuori);
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

  // ---------- IL BOT (tutto in locale, nessuna rete) ----------
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
  //  furbo  = quanto spesso, se la tua racchetta copre il tiro, cerca un punto libero (anche di sponda)
  var DIFF = {
    // (tarati con la fisica "vera": hitbox interpolate + pali. Tiri che entrano: ~47% / 23% / 12%)
    facile:    { nome: "Facile",    vel: 0.60, scatto: 1.5, tiro: 2.0, reaz: 0.35, err: 0.55, track: 0.25, prev: 0.0, soglia: 0.5, mira: 0.5, cool: 0.50, dy: 0.22, furbo: 0.6 },
    medio:     { nome: "Medio",     vel: 0.85, scatto: 1.7, tiro: 2.6, reaz: 0.28, err: 0.40, track: 0.30, prev: 0.3, soglia: 0.7, mira: 0.8, cool: 0.40, dy: 0.21, furbo: 0.65 },
    difficile: { nome: "Difficile", vel: 1.00, scatto: 1.9, tiro: 3.2, reaz: 0.18, err: 0.30, track: 0.40, prev: 0.6, soglia: 0.9, mira: 1.0, cool: 0.35, dy: 0.20, furbo: 0.9 }
  };
  // dove sarà il disco (in x) quando arriva all'altezza yLinea, contando i rimbalzi sulle sponde
  function prevediX(st, yLinea) {
    if (st.pvy >= -0.05 || st.py <= yLinea) return st.px;
    var t = (st.py - yLinea) / -st.pvy, L = 1 - 2 * RP;
    var u = st.px + st.pvx * t - RP;
    u = ((u % (2 * L)) + 2 * L) % (2 * L); if (u > L) u = 2 * L - u;
    return u + RP;
  }
  // la strada del tiro (dal disco al punto mira, sulla linea della tua porta) passa dalla tua racchetta?
  // mira fuori da 0..1 = tiro di sponda: il campo si "specchia" oltre la sponda, e con lui la racchetta
  function tiroCoperto(st, mira) {
    var ax = st.px, ay = st.py, bx = mira - ax, by = ASP - ay, l2 = bx * bx + by * by || 1, md = RP + RPAD + 0.012;
    var hx = st.hx;
    if (mira < 0) hx = 2 * RP - st.hx; else if (mira > 1) hx = 2 * (1 - RP) - st.hx;
    var k = clamp(((hx - ax) * bx + (st.hy - ay) * by) / l2, 0, 1);
    return Math.hypot(ax + bx * k - hx, ay + by * k - st.hy) < md;
  }
  // dove tira il Bot: un angolo della tua porta; se la tua racchetta lo copre, cerca un punto libero
  // (anche di sponda). Più il Bot è bravo (furbo), più spesso ci pensa.
  function sceltaMira(st, D) {
    var base = 0.5 + (Math.random() < 0.5 ? -1 : 1) * (0.08 + Math.random() * 0.1) * D.mira;
    if (!tiroCoperto(st, base) || Math.random() > D.furbo) return base;
    var dirette = [], sponda = [];
    for (var i = 0; i <= 6; i++) {
      var gx = XL + RP + (XR - XL - 2 * RP) * i / 6;
      if (!tiroCoperto(st, gx)) dirette.push(gx);
      var sx = 2 * RP - gx, dx2 = 2 * (1 - RP) - gx;   // di sponda a sinistra / a destra
      if (!tiroCoperto(st, sx)) sponda.push(sx);
      if (!tiroCoperto(st, dx2)) sponda.push(dx2);
    }
    var lista = dirette.length ? dirette : sponda;
    return lista.length ? lista[Math.floor(Math.random() * lista.length)] : base;
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
    // disco quasi fermo nella metà del Bot da un po' (contro il bordo alto, in un angolo, contro una
    // sponda…): scivola fuori verso il centro (cuscino d'aria), così la partita non si blocca mai
    b.lento = (st.py < ASP / 2 && !(st.cade > 0) && Math.hypot(st.pvx, st.pvy) < 0.12) ? b.lento + dt : 0;
    if (b.lento > (raggiungibile ? 2.2 : 1.2)) { st.pvx = (0.5 - st.px) * 0.9; st.pvy = raggiungibile ? 0.35 : 0.55; b.lento = 0; }
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
        b.mira = sceltaMira(st, D);   // angolo della tua porta (o un punto che la tua racchetta non copre)
      } else if (modo === "attacca" && !b.colpo && tiroCoperto(st, b.mira) && Math.random() < D.furbo) b.mira = sceltaMira(st, D);   // ti sei messo davanti: cambia mira
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
      // disco attaccato a una sponda: il punto di rincorsa finirebbe fuori campo (il Bot non ci arriva
      // e resterebbe fermo). Allora tira di sponda, arrivando dal lato interno.
      var rinc = md * 1.6, rx = st.px - vx * rinc, rMin = RPAD + 0.006, rMax = 1 - RPAD - 0.006;
      if (rx < RPAD - md * 0.4 || rx > 1 - RPAD + md * 0.4) { vx = clamp((st.px - clamp(rx, rMin, rMax)) / rinc, -0.9, 0.9); vy = Math.sqrt(1 - vx * vx); }   // (solo se proprio non ci arriva: altrimenti tira come sempre)
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
  // trofei: contatori per livello del bot (liv = facile/medio/difficile).
  // Vittorie, cappotti, serie e record contano solo nelle partite a 7 gol (le più corte non valgono per i trofei).
  function salvaHockey(st, liv, vinci) {
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var vinto = st.vincitore === 1, zero = vinto && st.s2 === 0, pieno = vinci === VINCI;
    var incrs = [["partite", 1], ["golFatti", st.s1], ["golSponda", st.golSponda || 0]], sets = [], recs = [];
    if (pieno) {
      recs.push(["scartoMax", vinto ? (st.s1 - st.s2) : 0]);
      if (vinto) {
        incrs.push(["vittorie", 1], ["vinte_" + liv, 1]);
        if (zero) incrs.push(["cappotti", 1], ["cappotti_" + liv, 1]);
        if (st.s2 === VINCI - 1) incrs.push(["fotofinish", 1]);
        if ((st.maxSotto || 0) >= 3) incrs.push(["rimonte", 1]);
      }
      if (liv === "difficile") {
        var s0 = (SGNube.statGioco && SGNube.statGioco("hockey")) || {}, serie = vinto ? (s0.serieDiffOra || 0) + 1 : 0;
        recs.push(["serieDiffMax", serie]); sets.push(["serieDiffOra", serie]);
      }
    }
    SGNube.salvaProgressi(null, "hockey", incrs, recs, sets);
  }
  // uscita a metà partita: i gol fatti contano lo stesso, e contro il Difficile la serie di vittorie si azzera
  // (altrimenti basterebbe uscire quando si sta perdendo)
  function salvaUscita(st, liv, vinci) {
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    if (st.s1 + st.s2 === 0) return;   // uscito subito (livello sbagliato…): non conta niente
    var sets = (liv === "difficile" && vinci === VINCI) ? [["serieDiffOra", 0]] : [];
    SGNube.salvaProgressi(null, "hockey", [["golFatti", st.s1], ["golSponda", st.golSponda || 0]], [], sets);
  }
  var LIVELLI = ["facile", "medio", "difficile"];

  // ---------- PARTITA SU QUESTO TELEFONO: contro il Bot, oppure in due (uno sotto e uno sopra) ----------
  // o = { liv: "facile"/"medio"/"difficile" (senza liv = in due), nomi: [chi sta sotto, chi sta sopra], vinci, torneo }
  function partitaHK(t, o) {
    var due = !o.liv, liv = due ? null : livOk(o.liv), D = due ? null : DIFF[liv], vinci = vinciOk(o.vinci);
    impostaASP(aspSchermo());          // il campo riempie lo schermo del telefono
    var st = statoNuovo(); st.fase = "gioco"; st.due = due;
    var C = null, raf = null, ultimoT = 0, acc = 0, dtRacc = 0, vista = null, salvato = false, memSuoni = {}, tRes = null, confEsci = 0;
    // racchette al loro posto di partenza (a inizio partita e alla rivincita)
    function rimettiRacchette() {
      st.hx = st.hpx = 0.5; st.hy = st.hpy = ASP - 0.18;
      st.gx = st.gpx = 0.5; st.gy = st.gpy = 0.18;
      st._snap = st._snapG = true;   // quando rimetti il dito, la racchetta ti raggiunge senza "sparare" il disco
    }
    function nomeDi(chi) { return o.nomi[chi === 1 ? 0 : 1]; }
    function classifica() {
      var a = { nome: nomeDi(1), pos: st.vincitore === 1 ? 1 : 2 }, b = { nome: nomeDi(2), pos: st.vincitore === 2 ? 1 : 2 };
      return st.vincitore === 1 ? [a, b] : [b, a];
    }
    function gol(chi) {
      if (chi === 1) st.s1++; else st.s2++;
      st.maxSotto = Math.max(st.maxSotto || 0, st.s2 - st.s1);
      // gol di sponda: l'ha toccato per ultimo chi ha segnato, e poi il disco ha preso almeno una sponda
      var diSponda = st.tocco === chi && (st.spDopo || 0) > 0;
      if (diSponda && chi === 1) st.golSponda = (st.golSponda || 0) + 1;
      suonoGol(due || chi === 1);
      st.golChi = chi;
      st.golTxt = diSponda ? "di sponda!" : (Math.max(st.s1, st.s2) === vinci - 1 ? "Punto decisivo!" : "");
      if (st.s1 >= vinci || st.s2 >= vinci) {
        st.fase = "fine"; st.vincitore = st.s1 > st.s2 ? 1 : 2;
        if (!salvato) {
          salvato = true;
          if (!due) salvaHockey(st, liv, vinci);
          if (o.torneo) { stop(); return t.fine(classifica()); }   // torneo sullo stesso telefono: i punti li dà il torneo
          if (t.risultato) t.risultato(classifica());               // com'è finita (dà gli XP)
        }
        render();
      } else {
        // niente pausa: le racchette restano libere, il disco CADE DALL'ALTO nella metà di chi ha subito
        st.golT = performance.now(); servi(st, chi === 1 ? -1 : 1); st._bot = null; st.tocco = 0; st.spDopo = 0; faiCadere(st);
      }
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (C && !C.cv.isConnected) return stop();   // la schermata non c'è più (uscito da un'altra parte): si ferma tutto
      // (se l'app torna dallo sfondo non recupera di colpo mezzo secondo di fisica)
      var dt = ultimoT ? (now - ultimoT) / 1000 : 1 / 60; ultimoT = now; if (dt > 0.05) dt = 0.05;
      st.golVis = st.golT && now - st.golT < 1100;   // scritta GOL! per un attimo
      st.golA = st.golVis ? 1 - (now - st.golT) / 1100 : 0;
      if (st.fase === "gioco" && !due) botMuovi(st, dt, D);
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
      if (st.fase === "gioco") {
        st.hx = h1x; st.hy = h1y; st.gx = g1x; st.gy = g1y;
        if (!(st.cade > 0)) {
          // mai una racchetta (mossa da un dito) sopra il disco. Il Bot no: ha già le sue regole e così tira come prima
          staccaDalDisco(st, "h"); if (due) staccaDalDisco(st, "g");
          var spinta = st.setteT && now - st.setteT < 700;   // (il disco che sta passando per i 7 secondi non si frena)
          if (!spinta && (incastrato(st, "h", st._hvx, st._hvy) || (due && incastrato(st, "g", st._gvx, st._gvy)))) { st.pvx *= 0.4; st.pvy *= 0.4; }
        }
      }
      if (n > 0 || st.fase !== "gioco") { st.hpx = st.hx; st.hpy = st.hy; st.gpx = st.gx; st.gpy = st.gy; dtRacc = 0; }
      if (st.fase === "gioco") setteSecondi(st, dt);
      suonaEventi(st, memSuoni);
      if (st.fase === "fine") return;   // la schermata è cambiata
      if (C) disegna(C.ctx, C.cssW, st, false);
    }
    // regola dei 7 secondi: il disco non può restare per sempre nella stessa metà (si potrebbe tenerlo
    // fermo e bloccare la partita). Negli ultimi 3 secondi si vede il conto; allo zero scivola dall'altra parte.
    // Contro il Bot vale solo per la tua metà (nella sua c'è già il "cuscino d'aria").
    function setteSecondi(st, dt) {
      if (st.cade > 0) { st.metaT = 0; st.metaChi = 0; return; }
      var meta = st.py > ASP / 2 ? 1 : 2;   // 1 = metà di sotto
      if (meta !== st.metaChi) { st.metaChi = meta; st.metaT = 0; return; }
      if (meta === 2 && !due) return;
      st.metaT = (st.metaT || 0) + dt;
      if (st.metaT >= SETTE) {
        // velocità giusta per fermarsi poco oltre la metà campo (con l'attrito fa strada = velocità / ATTRITO)
        var strada = Math.abs(st.py - ASP / 2) + 0.3;
        st.pvx = (0.5 - st.px) * ATTRITO * 0.9; st.pvy = (meta === 1 ? -1 : 1) * strada * ATTRITO; st.metaT = 0; st.setteT = performance.now();
        st.tocco = 0; st.spDopo = 0;   // (un disco passato così non vale come tiro di nessuno)
      }
    }
    // schermo che cambia misura durante la partita (barra del browser, telefono girato): il campo si riadatta
    function suResize() { clearTimeout(tRes); tRes = setTimeout(function () { if (C && C.cv.isConnected) adattaCanvas(C); }, 150); }
    function ascoltaResize(si) {
      var f = si ? "addEventListener" : "removeEventListener";
      window[f]("resize", suResize); if (window.visualViewport) window.visualViewport[f]("resize", suResize);
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; MusicaHK.ferma(); ascoltaResize(false); clearTimeout(tRes); }
    function esci() {
      if (!due && st.fase === "gioco" && !salvato) salvaUscita(st, liv, vinci);
      stop(); t.esci();
    }
    function riparti() {
      st.s1 = 0; st.s2 = 0; st.maxSotto = 0; st.vincitore = null; st.golSponda = 0; salvato = false; st._bot = null;
      impostaASP(aspSchermo());   // (se nel frattempo lo schermo ha cambiato misura, il nuovo campo lo riempie di nuovo tutto)
      servi(st); rimettiRacchette(); faiCadere(st); st.golT = 0; st.golChi = 0; st.tocco = 0; st.spDopo = 0;
      st.fase = "gioco"; vista = null; render();
    }
    // un avviso che compare per un attimo sul campo (senza ridisegnare la schermata)
    function avviso(sg, txt) {
      var a = t.el("div", { text: txt, style: "position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);z-index:32;padding:10px 16px;border-radius:12px;background:rgba(0,0,0,.78);color:#fff;font-weight:700;pointer-events:none;transition:opacity .4s;white-space:nowrap" });
      sg.appendChild(a);
      setTimeout(function () { a.style.opacity = "0"; }, 1900);
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 2400);
    }
    function render() {
      var tipo = st.fase === "fine" ? "fine" : "gioco";
      if (tipo === vista && tipo !== "fine") return;
      vista = tipo; stop();
      var el = t.el;
      if (tipo === "fine") {
        var vinto = st.vincitore === 1;
        var sf = t.schermata({ icona: (due || vinto) ? "🏆" : "🤖", titolo: due ? ("Vince " + nomeDi(st.vincitore) + "!") : (vinto ? "Hai vinto!" : "Ha vinto Bot"),
          sotto: "Glow Hockey · " + (due ? "in due" : "Bot " + D.nome) });
        // punteggio grande, coi colori delle due racchette
        var lato = function (nome, gol, col) {
          return el("div", { style: "text-align:center;min-width:96px" }, [
            el("div", { style: "font-size:3.2rem;font-weight:800;line-height:1;color:" + col + ";text-shadow:0 0 16px " + col, text: String(gol) }),
            el("div", { style: "font-size:.92rem;font-weight:700;opacity:.85;margin-top:6px", text: nome }) ]);
        };
        sf._contenuto.appendChild(el("div", { style: "display:flex;justify-content:center;align-items:center;gap:14px;margin:16px 0 8px" }, [
          lato(due ? nomeDi(1) : "Tu", st.s1, TEMA.io.fuori), el("div", { style: "font-size:1.6rem;opacity:.5", text: "—" }), lato(nomeDi(2), st.s2, TEMA.avv.fuori) ]));
        if (!due && st.golSponda) sf._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "🎱 Gol di sponda: " + st.golSponda }));
        if (!due && vinci !== VINCI) sf._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Partita a " + vinci + " gol: per i trofei delle vittorie servono le partite a 7." }));
        sf._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: riparti }));
        // dopo una vittoria si propone il livello sopra; dopo una sconfitta pesante quello sotto
        var i = due ? -1 : LIVELLI.indexOf(liv), altro = null;
        if (i >= 0 && vinto && i < 2) altro = LIVELLI[i + 1];
        else if (i > 0 && !vinto && st.s2 - st.s1 >= 4) altro = LIVELLI[i - 1];
        if (altro) sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: (vinto ? "🔥 Prova il " : "🙂 Prova il ") + DIFF[altro].nome + " ▶", onclick: function () {
          memorizza("liv", altro); stop(); partitaHK(t, Object.assign({}, o, { liv: altro }));
        } }));
        sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: function () { stop(); t.esci(); } }));
        t.mostra(sf);
      } else {
        // niente titolo: solo il tasto indietro, così il campo prende tutto lo spazio
        var sg = t.schermata({ sotto: due ? "👥 In due" : "🤖 Bot " + D.nome, indietro: function () {
          // in due il tasto ‹ sta nel campo di chi gioca sopra: per uscire va toccato due volte
          if (due && performance.now() - confEsci > 2500) { confEsci = performance.now(); avviso(sg, "Tocca di nuovo ‹ per uscire"); return; }
          esci();
        } });
        sg.firstChild.style.marginBottom = "4px";
        C = creaCanvas(t, sg);
        collegaInput(C, false, due ? "due" : "basso", function (x, y, q, nuovo) {
          if (st.fase !== "gioco") return;
          var p = fuoriDalDisco(st, x, y, q !== "alto", q === "alto" ? st.gpx : st.hpx, q === "alto" ? st.gpy : st.hpy); x = p[0]; y = p[1];   // (rispetto a dov'era a inizio fotogramma)
          if (q === "alto") {   // (solo in due) la racchetta di sopra
            if (nuovo || st._snapG) { st._snapG = false; st.gpx = x; st.gpy = y; }
            st.gx = x; st.gy = y; return;
          }
          if (nuovo || st._snap) { st._snap = false; st.hpx = x; st.hpy = y; }   // dito appena appoggiato: la racchetta arriva lì senza spazzare il campo
          st.hx = x; st.hy = y;
        });
        t.mostra(sg);
        adattaCanvas(C);
        ascoltaResize(true);
        ultimoT = 0; raf = requestAnimationFrame(loop);
        sg.appendChild(MusicaHK.bottone(el)); MusicaHK.avvia();   // musica gasante durante la partita
      }
    }
    rimettiRacchette(); faiCadere(st);   // anche a inizio partita il disco arriva dall'alto
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
      colpi: st.colpi || 0, sponde: st.sponde || 0, forzaColpo: st.forzaColpo || 0,
      cade: st.cade || 0, atterra: st.atterra || 0, golVis: !!st.golVis, spN: st.sponde || 0, spX: st.spX, spY: st.spY }; }   // disco in aria, bordo illuminato, scritta GOL   // contatori: l'ospite suona quando salgono
    function bcast(ret) { if (ret) rete.invia(vm()); else rete.inviaVeloce(vm()); }
    var memSuoni = {};
    function gol(chi) { if (chi === 1) st.s1++; else st.s2++; suonoGol(chi === 1); if (st.s1 >= VINCI || st.s2 >= VINCI) { st.fase = "fine"; st.vincitore = st.s1 > st.s2 ? 1 : 2; premiaHost(); } else { st.golT = performance.now(); servi(st, chi === 1 ? -1 : 1); faiCadere(st); } bcast(true); }   // niente pausa: il disco cade dall'alto
    function loop(now) {
      raf = requestAnimationFrame(loop);
      var dt = ultimoT ? (now - ultimoT) / 1000 : 0.016; ultimoT = now;
      if (dt > 0.1) dt = 0.1;
      st.golVis = st.golT && now - st.golT < 1100;   // scritta GOL! per un attimo
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
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; MusicaHK.ferma(); }
    // com'è finita (dà gli XP all'host; l'avversario se li dà da solo quando vede la fine)
    function premiaHost() {
      var v = st.vincitore === 1, io = { nome: (t.nomeProfilo && t.nomeProfilo()) || "Tu", pos: v ? 1 : 2 }, lui = { nome: "Avversario", pos: v ? 2 : 1 };
      if (t.risultato) t.risultato(v ? [io, lui] : [lui, io]);
    }
    function comincia() { if (st.fase === "lobby" && st.avvId) { st.s1 = 0; st.s2 = 0; st.vincitore = null; st.fase = "gioco"; servi(st); faiCadere(st); st.golT = 0; bcast(true); render(); } }

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
        sg.appendChild(MusicaHK.bottone(el)); MusicaHK.avvia();   // musica gasante durante la partita
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
          if (m.cade > 0) { var fino = now + m.cade * 1000; if (!S.cadeFino || S.cadeFino < now || Math.abs(fino - S.cadeFino) > 150) S.cadeFino = fino; } else S.cadeFino = 0;   // caduta liscia fra un pacchetto e l'altro
          if (m.fase === "gioco") { S.buf.push({ rt: now, px: m.px, py: m.py, pvx: m.pvx, pvy: m.pvy, hx: m.hx, hy: m.hy }); while (S.buf.length > 2 && S.buf[0].rt < now - 1000) S.buf.shift(); }
          else { S.buf.length = 0; }   // gol/attesa: svuota, alla ripresa riparte pulito
          if (m.fase !== S.fase) { S.fase = m.fase; render(); }
        } },
        onChiuso: function () { stop(); erroreHK(t, "Collegamento perso. L'host ha chiuso la partita."); },
        onErrore: function () { stop(); erroreHK(t, "Problema di collegamento. Riprova."); }
      });
    }
    function stop() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = null; MusicaHK.ferma(); }
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
      var o = { fase: vm.fase, px: px, py: py, hx: hx, hy: hy, gx: S.me.x, gy: S.me.y, s1: vm.s1, s2: vm.s2,
        cade: S.cadeFino ? Math.max(0, (S.cadeFino - now) / 1000) : 0, golVis: vm.golVis, spN: vm.spN, spX: vm.spX, spY: vm.spY };
      disegna(S.C.ctx, S.C.cssW, o, true);
      if (now - S.ultimoInvio > HZ) { S.ultimoInvio = now; S.rete.invia({ t: "p", x: S.me.x, y: S.me.y }); }
    }
    function render() {
      var f = S.fase;
      var tipo = (f === "gioco" || f === "gol") ? "gioco" : f === "fine" ? "fine" : "attesa";
      if (tipo === S.vista && tipo === "gioco") return;
      S.vista = tipo; stop();
      if (tipo === "gioco") S.premiato = false;
      if (tipo === "fine" && !S.premiato && t.risultato && S.vm) {   // com'è finita: gli XP me li do da solo, una volta
        S.premiato = true;
        var vintoIo = S.vm.vincitore === 2, io = { nome: "Tu", pos: vintoIo ? 1 : 2 }, lui = { nome: "Avversario", pos: vintoIo ? 2 : 1 };
        t.risultato(vintoIo ? [io, lui] : [lui, io]);
      }
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
        sg.appendChild(MusicaHK.bottone(el)); MusicaHK.avvia();   // musica gasante durante la partita
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
