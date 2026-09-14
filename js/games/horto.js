/* =========================================================
   GIOCO — "Horto Muso" (corsa di cavalli, tipo Derby Dash)
   Corsie DRITTE (niente pista ovale: stessa distanza per tutti,
   nessun vantaggio a chi sta all'interno). Ogni cavallo ha la
   sua riga. Tu (🐎) contro 1–3 cavalli del computer.
   Meccanica:
   - i cavalli avanzano sempre a una velocità minima di base;
   - tasto FRUSTA: ogni click dà un boost di velocità per un istante;
   - ogni click consuma energia (stamina); se non clicchi si ricarica;
   - se la stamina arriva a 0 -> SFINIMENTO: il cavallo rallenta e non
     puoi cliccare per 3 secondi (intanto la barra si ricarica);
   - vince il primo che taglia il traguardo.
   Grafica semplice: div + emoji, aggiornata in tempo reale (niente
   ricostruzione della schermata a ogni frame).
   ========================================================= */
(function () {
  "use strict";

  var NOMI_BOT = { 1: "🤖 Furia", 2: "🤖 Saetta", 3: "🤖 Tornado" };
  var COLORI = ["#ffd43b", "#ff6b6b", "#4dabf7", "#51cf66"]; // giocatore = giallo

  // costanti (posizione 0..1; velocità in frazioni di pista al secondo)
  var V_BASE = 0.055, V_BOOST = 0.165, V_SFIN = 0.018;
  var BOOST_MS = 280, COST = 13, REGEN = 16, REGEN_SFIN = 22, SFIN_MS = 3000, STAM_MAX = 100;

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
        "transition:left .06s linear;will-change:left;}",
      ".ho-cav .em{font-size:1.7rem;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5));}",
      ".ho-cav.sfin .em{opacity:.5;}",
      ".ho-stam{width:46px;height:7px;border-radius:4px;background:rgba(0,0,0,.45);overflow:hidden;border:1px solid rgba(255,255,255,.25);}",
      ".ho-stam .fill{height:100%;width:100%;border-radius:4px;transition:width .08s linear;}",
      ".ho-frusta{width:100%;min-height:76px;border:0;border-radius:18px;cursor:pointer;font-family:inherit;font-weight:900;",
        "font-size:1.5rem;color:#241f00;background:linear-gradient(135deg,#ffe58a,var(--accento) 60%,var(--accento-scuro));",
        "box-shadow:0 8px 22px rgba(224,169,10,.35);-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;}",
      ".ho-frusta:active{transform:scale(.98);}",
      ".ho-frusta:disabled{filter:grayscale(.6);opacity:.7;}",
      ".ho-frusta.sfin{background:linear-gradient(135deg,#ff8787,#c92a2a);color:#fff;}",
      ".ho-info{text-align:center;font-weight:800;min-height:1.4em;margin:2px 0 8px;}"
    ].join("");
    document.head.appendChild(s);
  }

  // suoni/vibrazione leggeri
  function frustaFX() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = "square"; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.07);
    } catch (e) {} }
  function traguardoFX() { try { if (navigator.vibrate) navigator.vibrate([0, 40, 60, 40]); } catch (e) {}
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { [523, 659, 784, 1046].forEach(function (f, i) { var t = c.currentTime + i * 0.1, o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.2); }); } catch (e) {} }

  function corsa(t, nRivali, diff) {
    assicuraStile();
    var el = t.el;
    var N = Math.min(4, 1 + Math.max(1, nRivali));
    var nomi = []; nomi[0] = (t.giocatori && t.giocatori[0]) || "Tu";
    for (var i = 1; i < N; i++) nomi[i] = NOMI_BOT[i];
    // parametri bot per difficoltà
    var SOGLIA = diff === "facile" ? 42 : diff === "difficile" ? 18 : 28;
    var INTER = diff === "facile" ? 520 : diff === "difficile" ? 290 : 350;

    var cav = [];
    for (i = 0; i < N; i++) cav.push({ pos: 0, stam: STAM_MAX, boostU: 0, sfin: false, sfinU: 0, umano: i === 0, nextClick: 0, arr: false });

    var arrivi = [];         // ordine di arrivo (indici)
    var stato = "via";       // "via" (countdown) | "corsa" | "fine"
    var partenza = 0, finito = false, raf = null, ultimo = 0;

    // ---- schermata (montata una volta; poi aggiorno solo posizioni/stamina) ----
    var s = t.schermata({ icona: "🐎", titolo: "Horto Muso", sotto: "Corsa al galoppo",
      indietro: function () { if (window.confirm("Uscire dalla corsa?")) { stop(); t.esci(); } } });
    var info = el("div", { class: "ho-info", text: "Pronti…" });
    s._contenuto.appendChild(info);
    var pista = el("div", { class: "ho-pista" });
    var cavEl = [], fillEl = [];
    for (i = 0; i < N; i++) {
      var lane = el("div", { class: "ho-lane" + (i === 0 ? " mia" : "") });
      lane.appendChild(el("div", { class: "ho-num", style: "background:" + COLORI[i], text: String(i + 1) }));
      lane.appendChild(el("div", { class: "ho-nome", text: nomi[i] }));
      lane.appendChild(el("div", { class: "ho-tragu" }));
      var c = el("div", { class: "ho-cav" });
      if (i === 0) { // barra stamina SOPRA il cavallo del giocatore
        var bar = el("div", { class: "ho-stam" });
        var fill = el("div", { class: "fill", style: "background:#51cf66" });
        bar.appendChild(fill); c.appendChild(bar); fillEl[i] = fill;
      }
      c.appendChild(el("span", { class: "em", text: "🐎" }));
      lane.appendChild(c); cavEl[i] = c;
      pista.appendChild(lane);
    }
    s._contenuto.appendChild(pista);

    var frusta = el("button", { class: "ho-frusta", text: "🇮 Pronti…", disabled: "disabled" });
    frusta.addEventListener("pointerdown", function (e) { e.preventDefault(); frustata(); });
    s._piede.appendChild(frusta);
    function suTasto(e) { if (e.code === "Space" || e.key === " ") { e.preventDefault(); frustata(); } }
    document.addEventListener("keydown", suTasto);
    t.mostra(s);

    function stop() { finito = true; if (raf) cancelAnimationFrame(raf); raf = null; document.removeEventListener("keydown", suTasto); }

    function frustata() {
      if (stato !== "corsa") return;
      var me = cav[0];
      if (me.sfin || me.arr) return;
      var now = performance.now();
      me.stam -= COST; me.boostU = now + BOOST_MS;
      if (me.stam <= 0) { me.stam = 0; me.sfin = true; me.sfinU = now + SFIN_MS; me.boostU = 0; }
      frustaFX();
    }

    function botPensa(h, now) {
      if (h.sfin || h.arr) return;
      if (now < h.nextClick) return;
      if (h.stam <= SOGLIA + Math.random() * 8) return;         // risparmia energia
      h.stam -= COST; h.boostU = now + BOOST_MS;
      if (h.stam <= 0) { h.stam = 0; h.sfin = true; h.sfinU = now + SFIN_MS; h.boostU = 0; }
      h.nextClick = now + INTER + Math.random() * 120;
    }

    function passo(now, dt) {
      for (var k = 0; k < N; k++) {
        var h = cav[k]; if (h.arr) continue;
        if (!h.umano) botPensa(h, now);
        // sfinimento finito?
        if (h.sfin && now >= h.sfinU) h.sfin = false;
        // velocità
        var v = h.sfin ? V_SFIN : (now < h.boostU ? V_BOOST : V_BASE);
        h.pos += v * dt;
        // energia: si ricarica solo se non sta "spingendo"
        if (h.sfin) h.stam = Math.min(STAM_MAX, h.stam + REGEN_SFIN * dt);
        else if (now >= h.boostU) h.stam = Math.min(STAM_MAX, h.stam + REGEN * dt);
        // arrivo
        if (h.pos >= 1) { h.pos = 1; h.arr = true; arrivi.push(k); }
      }
    }

    function vista() {
      for (var k = 0; k < N; k++) {
        var h = cav[k];
        cavEl[k].style.left = (1 + h.pos * 92).toFixed(2) + "%";
        cavEl[k].classList.toggle("sfin", h.sfin);
      }
      var me = cav[0], f = fillEl[0];
      f.style.width = me.stam.toFixed(0) + "%";
      f.style.background = me.sfin ? "#ff6b6b" : (me.stam > 40 ? "#51cf66" : me.stam > 18 ? "#ffd43b" : "#ff922b");
      if (me.sfin) { frusta.className = "ho-frusta sfin"; frusta.textContent = "😵 SFINITO!"; frusta.disabled = true; }
      else { frusta.className = "ho-frusta"; frusta.textContent = "🏇 FRUSTA! (" + me.stam.toFixed(0) + "%)"; frusta.disabled = false; }
    }

    function giro(ts) {
      if (finito) return;
      if (!ultimo) ultimo = ts;
      var dt = Math.min(0.05, (ts - ultimo) / 1000); ultimo = ts;
      var now = performance.now();
      if (stato === "corsa") {
        passo(now, dt);
        vista();
        if (cav[0].arr) return fineCorsa();               // finisco quando arrivo IO (vedo il mio piazzamento)
        var pos = cav[0].pos, primo = Math.max.apply(null, cav.map(function (x) { return x.pos; }));
        info.textContent = cav[0].pos >= primo ? "🥇 Sei in testa!" : "Dai, frusta! 🏇";
      }
      raf = requestAnimationFrame(giro);
    }

    function fineCorsa() {
      stato = "fine"; stop();
      // classifica: prima gli arrivati (in ordine), poi gli altri per posizione
      var resto = []; for (var k = 0; k < N; k++) if (arrivi.indexOf(k) < 0) resto.push(k);
      resto.sort(function (a, b) { return cav[b].pos - cav[a].pos; });
      var ord = arrivi.concat(resto);
      var mioPosto = ord.indexOf(0) + 1;
      traguardoFX();
      renderFine(t, ord, nomi, mioPosto, {
        onRigioca: function () { corsa(t, nRivali, diff); },
        onEsci: t.esci
      });
    }

    // ---- countdown 3-2-1-VIA ----
    var conto = 3;
    info.textContent = "3"; frusta.textContent = "🚦 Pronti…";
    var toC = setInterval(function () {
      if (finito) { clearInterval(toC); return; }
      conto--;
      if (conto > 0) { info.textContent = String(conto); }
      else if (conto === 0) { info.textContent = "VIA! 🏁"; }
      else {
        clearInterval(toC);
        stato = "corsa"; ultimo = 0; partenza = performance.now();
        vista(); raf = requestAnimationFrame(giro);
      }
    }, 700);
  }

  function renderFine(t, ord, nomi, mioPosto, cb) {
    var el = t.el;
    var vinto = mioPosto === 1;
    var s = t.schermata({ icona: vinto ? "🏆" : "🏁", titolo: vinto ? "Hai vinto!" : "Arrivato " + mioPosto + "°", sotto: "Horto Muso" });
    var medaglie = ["🥇", "🥈", "🥉", "4️⃣"];
    var ol = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:6px" });
    ord.forEach(function (idx, p) {
      ol.appendChild(el("div", { style: "display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:" + (idx === 0 ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.05)") + (idx === 0 ? ";border:1px solid var(--accento)" : "") }, [
        el("span", { style: "font-size:1.4rem", text: medaglie[p] || (p + 1 + "°") }),
        el("span", { style: "font-size:1.4rem", text: "🐎" }),
        el("span", { style: "flex:1;font-weight:800", text: nomi[idx] + (idx === 0 ? " (tu)" : "") })
      ]));
    });
    s._contenuto.appendChild(ol);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rigioca", onclick: cb.onRigioca }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(s);
  }

  SG.registra({
    id: "horto",
    nome: "Horto Muso",
    icona: "🐎",
    descrizione: "Corsa di cavalli: frusta per accelerare, ma occhio all'energia! Se ti sfinisci il cavallo si pianta. Batti i cavalli del computer.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 1,
    regole: [
      "Corsie <b>dritte</b>, stessa distanza per tutti: vince davvero il più bravo (niente pista ovale).",
      "I cavalli corrono già da soli a una <b>velocità minima</b>. Tu hai il tasto <b>FRUSTA</b>: ogni click dà una spinta.",
      "Ogni frustata consuma <b>energia</b> (la barra sopra il tuo cavallo). Se non frusti, l'energia si <b>ricarica</b> da sola.",
      "Se l'energia arriva a <b>zero</b> vai in <b>sfinimento</b>: il cavallo rallenta e per <b>3 secondi</b> non puoi frustare (intanto recuperi).",
      "Vince il <b>primo</b> che taglia il traguardo. Dosa le frustate!"
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.rivali = 3; dove.difficolta = "medio";
      box.appendChild(el("div", { class: "etichetta", text: "Quanti avversari (bot)" }));
      var wR = el("div", { style: "display:flex;gap:8px" });
      [1, 2, 3].forEach(function (n) {
        var b = el("button", { class: "modo-chip" + (n === 3 ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.rivali = n; [].forEach.call(wR.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: String(n) })]);
        b.style.flex = "1"; wR.appendChild(b);
      });
      box.appendChild(wR);
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
      var wD = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(wD.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; wD.appendChild(b);
      });
      box.appendChild(wD);
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:10px", text: "Da solo contro il computer. Tieni premuto il ritmo giusto: frusta, ma non finire l'energia!" }));
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      corsa(t, imp.rivali || 3, imp.difficolta || "medio");
    }
  });
})();
