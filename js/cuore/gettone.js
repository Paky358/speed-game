/* =========================================================
   PEZZO DEL CUORE — 😀 LA SCELTA DEL GETTONE (13 nov 2026)
   Al posto degli avatar ognuno sceglie (per forza, mai a caso) la sua emoji 3D e 3 colori del contorno in ordine:
   in una stanza, se due hanno lo stesso 1° colore, lo tiene chi è entrato prima e l'altro prende il 2°, poi il 3°
   (lo decide chi tiene la Sala o la partita: vedi js/cuore/rete.js e SGGettone.assegna).
   schermataGettone(dopo, indietro, o): o.benvenuto (primo ingresso: niente «indietro»), o.bozza (i Bot: { gettone, nome })
   Il disegno del gettone e la lista delle emoji: js/gettone.js e data/emoji-gettone.js.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore ----
  var el = cuore.el, schermata = cuore.schermata, mostra = cuore.mostra, pillola = cuore.pillola, leggiL = cuore.leggiL, scriviL = cuore.scriviL;

  var K_GETTONE = "sg-gettone";   // il gettone su questo telefono (vale anche senza rete; con il profilo online si salva anche lì)
  var GRUPPI = [["facce", "😀 Facce"], ["animali", "🐶 Animali"], ["cibo", "🍕 Cibo"], ["sport", "⚽ Sport e giochi"], ["cose", "🎸 Cose"], ["natura", "🌈 Natura e spazio"]];

  // il mio gettone: dal profilo online, se no da questo telefono (null = non l'ho ancora scelto)
  function mioGettone() {
    var G = window.SGGettone; if (!G) return null;
    try { var p = window.SGNube && SGNube.profilo && SGNube.profilo(); if (p && G.eGettone(p.gettone)) return G.norm(p.gettone); } catch (e) {}
    var l = (leggiL(K_GETTONE, null) || {})[chiaveNome()];
    return G.eGettone(l) && (l.c || []).length ? G.norm(l) : null;
  }
  // (sul telefono uno per profilo: due profili sullo stesso telefono non si scambiano il gettone)
  function chiaveNome() { var p = cuore.profiloAttivo && cuore.profiloAttivo(); return String((p && p.nome) || "").trim().toLowerCase() || "?"; }
  function haScelto() { var g = mioGettone(); return !!(g && g.c && g.c.length >= 1); }
  function salvaMio(g) {
    var G = window.SGGettone; g = G.norm(g); delete g.k; delete g.r;
    var tutti = leggiL(K_GETTONE, null); if (!tutti || typeof tutti !== "object" || G.eGettone(tutti)) tutti = {};
    tutti[chiaveNome()] = g; scriviL(K_GETTONE, tutti);
    try { if (window.SGNube && SGNube.salvaGettone && SGNube.profilo && SGNube.profilo()) SGNube.salvaGettone(g); } catch (e) {}
    try { cuore.ricordaProfilo && cuore.ricordaProfilo(); } catch (e) {}
  }

  // «Scegli la tua emoji»: in alto il gettone come lo vedranno gli altri e i colori (1° 2° 3°), sotto le emoji per gruppi
  function schermataGettone(dopo, indietro, o) {
    o = o || {};
    var G = window.SGGettone; if (!G) return dopo();
    var bozzaBot = o.bozza || null;
    var parti = bozzaBot ? G.daQualsiasi(bozzaBot.gettone, bozzaBot.nome) : mioGettone();
    var scelta = { e: parti && !parti.r ? parti.e : null, c: parti && !parti.r ? (parti.c || []).slice(0, 3) : [] };
    var s = schermata({ icona: "😀", titolo: bozzaBot ? "Emoji di " + bozzaBot.nome : o.benvenuto ? "Scegli la tua emoji" : "La tua emoji",
      sotto: bozzaBot ? "La vedono tutti, in tutti i giochi" : "Al posto dell'avatar: la vedono gli amici in tutti i giochi",
      indietro: o.benvenuto ? null : indietro });
    s.classList.add("gt-scelta");
    // in alto, fermo: l'anteprima e i colori
    var anteprima = el("div", { class: "gt-anteprima", "aria-hidden": "true" });
    var aiuto = el("div", { class: "gt-aiuto" });
    var colori = el("div", { class: "gt-colori", role: "group", "aria-label": "I tuoi colori, in ordine" });
    var bColori = G.COLORI.map(function (x) {
      var b = el("button", { class: "gt-col", type: "button", style: "--c:" + x.c, "aria-label": x.n, onclick: function () { toccaColore(x.k); } }, [ el("b", { class: "gt-n" }) ]);
      colori.appendChild(b); return b;
    });
    var testa = el("div", { class: "gt-testa" }, [ anteprima, el("div", { class: "gt-testa-dx" }, [ aiuto, colori ]) ]);
    s._contenuto.appendChild(testa);
    // le emoji
    var bEmoji = {};
    var l = G.lista();
    GRUPPI.forEach(function (gr) {
      var queste = l.filter(function (x) { return (x.g || "cose") === gr[0]; }); if (!queste.length) return;
      s._contenuto.appendChild(el("div", { class: "etichetta gt-gruppo", text: gr[1] }));
      var gg = el("div", { class: "gt-griglia" });
      queste.forEach(function (x) {
        var b = el("button", { class: "gt-em", type: "button", "aria-label": x.e, onclick: function () { scelta.e = x.e; aggiorna(); try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} } }, [
          el("img", { src: G.url(x.e), alt: x.e, loading: "lazy", decoding: "async", draggable: "false", onerror: function () { this.replaceWith(document.createTextNode(this.alt)); } }) ]);
        bEmoji[x.e] = b; gg.appendChild(b);
      });
      s._contenuto.appendChild(gg);
    });
    s._contenuto.appendChild(el("p", { class: "modulo-nota gt-licenza", html: "Emoji 3D: <a href='https://github.com/microsoft/fluentui-emoji' target='_blank' rel='noopener'>Fluent Emoji</a> di Microsoft (licenza MIT)." }));
    var bFatto = el("button", { class: "btn btn-primario", type: "button", text: "▶ Fatto", onclick: fatto });
    s._piede.appendChild(bFatto);

    function toccaColore(k) {
      var i = scelta.c.indexOf(k);
      if (i >= 0) scelta.c.splice(i, 1);   // toccato di nuovo: si toglie (quelli dopo salgono di un posto)
      else if (scelta.c.length < 3) scelta.c.push(k);
      else { scelta.c[2] = k; }   // già 3: cambia il 3°
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
      aggiorna();
    }
    var ultimo = "";
    function aggiorna() {
      var g = { g: 1, e: scelta.e || "❔", c: scelta.c.length ? scelta.c.slice() : ["bianco"] }, sig = JSON.stringify(g);
      if (sig !== ultimo) { ultimo = sig; anteprima.innerHTML = scelta.e ? G.svg(g, { quadrato: true }) : "<div class='gt-vuoto' style='--c:" + G.coloreDi(scelta.c[0] || "bianco") + "'>?</div>"; }
      G.COLORI.forEach(function (x, n) {
        var i = scelta.c.indexOf(x.k), b = bColori[n];
        b.classList.toggle("on", i >= 0); b.firstChild.textContent = i >= 0 ? String(i + 1) : "";
      });
      Object.keys(bEmoji).forEach(function (e) { bEmoji[e].classList.toggle("on", e === scelta.e); });
      var manca = !scelta.e ? "Tocca la tua emoji qui sotto" : scelta.c.length < 3 ? "Ora tocca 3 colori, in ordine: " + ["il 1°", "il 2°", "il 3°"][scelta.c.length] : "Fatto! Se un amico ha il tuo 1° colore, prendi il 2°";
      aiuto.textContent = manca;
      bFatto.disabled = !(scelta.e && scelta.c.length === 3);
    }
    function fatto() {
      if (!(scelta.e && scelta.c.length === 3)) return;
      var g = { g: 1, e: scelta.e, c: scelta.c.slice() };
      if (bozzaBot) { bozzaBot.gettone = G.norm(g); return dopo(); }
      salvaMio(g);
      try { if (navigator.vibrate) navigator.vibrate([12, 40, 12]); } catch (e) {}
      if (o.benvenuto) pillola("gettone", "✨ Ecco il tuo gettone!", "verde", 2200);
      dopo();
    }
    mostra(s); aggiorna();
    // le immagini della griglia arrivano da sole (lazy); intanto si preparano anche quelle per i gettoni
    try { G.preparaTutte(); } catch (e) {}
  }

  // il profilo online arriva dopo (o era stato scelto senza rete): il gettone scelto qui va anche nel profilo
  try {
    if (window.SGNube && SGNube.onCambio) SGNube.onCambio(function () {
      try {
        var G = window.SGGettone, p = SGNube.profilo && SGNube.profilo(); if (!G || !p || G.eGettone(p.gettone)) return;
        var l = (leggiL(K_GETTONE, null) || {})[String(p.nome || "").trim().toLowerCase()];
        if (G.eGettone(l) && (l.c || []).length) SGNube.salvaGettone(l);
      } catch (e) {}
    });
  } catch (e) {}

  // ---- al cuore ----
  cuore.schermataGettone = schermataGettone; cuore.mioGettone = mioGettone; cuore.haGettone = haScelto;
})();
