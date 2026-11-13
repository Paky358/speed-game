/* =========================================================
   PEZZO DEL CUORE — 😀 LA SCELTA DEL GETTONE (13 nov 2026)
   Al posto degli avatar ognuno sceglie (per forza, mai a caso) la sua emoji 3D e 3 colori del contorno in ordine:
   in una stanza, se due hanno lo stesso 1° colore, lo tiene chi è entrato prima e l'altro prende il 2°, poi il 3°
   (lo decide chi tiene la Sala o la partita: vedi js/cuore/rete.js e SGGettone.assegna).
   Le emoji sono quasi tutte quelle di Fluent Emoji 3D (circa 1.500): l'elenco con le parole italiane per cercarle
   (data/emoji-tutte.js, pezzo «emoji») si scarica SOLO quando si apre la scelta; le immagini solo quando si vedono nella griglia.
   schermataGettone(dopo, indietro, o): o.benvenuto (primo ingresso: niente «indietro»), o.bozza (i Bot: { gettone, nome })
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore ----
  var el = cuore.el, schermata = cuore.schermata, mostra = cuore.mostra, pillola = cuore.pillola, leggiL = cuore.leggiL, scriviL = cuore.scriviL;

  var K_GETTONE = "sg-gettone";   // il gettone su questo telefono, uno per profilo (vale anche senza rete; col profilo online si salva anche lì)
  var GRUPPI = [["belle", "⭐ Le più belle"], ["facce", "😀 Facce e persone"], ["animali", "🐶 Animali"], ["cibo", "🍕 Cibo"], ["sport", "⚽ Sport e giochi"],
    ["viaggi", "🚗 Viaggi e posti"], ["oggetti", "🎸 Oggetti"], ["natura", "🌈 Natura"], ["simboli", "❤️ Simboli"]];
  var PROPOSTE = ["cane", "pizza", "calcio", "cuore", "razzo", "festa", "gatto", "fuoco"];

  // il mio gettone: dal profilo online, se no da questo telefono (null = non l'ho ancora scelto)
  function chiaveNome() { var p = cuore.profiloAttivo && cuore.profiloAttivo(); return String((p && p.nome) || "").trim().toLowerCase() || "?"; }
  function mioGettone() {
    var G = window.SGGettone; if (!G) return null;
    try { var p = window.SGNube && SGNube.profilo && SGNube.profilo(); if (p && G.eGettone(p.gettone)) return G.norm(p.gettone); } catch (e) {}
    var l = (leggiL(K_GETTONE, null) || {})[chiaveNome()];
    return G.eGettone(l) && (l.c || []).length ? G.norm(l) : null;
  }
  function haScelto() { var g = mioGettone(); return !!(g && g.c && g.c.length >= 1); }
  function salvaMio(g) {
    var G = window.SGGettone; g = G.norm(g); delete g.k; delete g.r;
    var tutti = leggiL(K_GETTONE, null); if (!tutti || typeof tutti !== "object" || G.eGettone(tutti)) tutti = {};
    tutti[chiaveNome()] = g; scriviL(K_GETTONE, tutti);
    try { if (window.SGNube && SGNube.salvaGettone && SGNube.profilo && SGNube.profilo()) SGNube.salvaGettone(g); } catch (e) {}
    try { cuore.ricordaProfilo && cuore.ricordaProfilo(); } catch (e) {}
  }

  // ---- la ricerca: minuscole, senza accenti, anche un pezzo di parola e con un piccolo errore di battitura ----
  function norma(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function distanza(a, b, max) {   // quante lettere cambiare (Levenshtein), fermandosi oltre max
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var p = [], q, i, j;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      q = [i]; var min = i;
      for (j = 1; j <= b.length; j++) { q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); if (q[j] < min) min = q[j]; }
      if (min > max) return max + 1;
      p = q;
    }
    return p[b.length];
  }
  // l'indice: per ogni emoji le sue parole (nome + parole chiave), già normalizzate
  function indice(E) {
    var belle = {}; (E.belle || []).forEach(function (e, i) { belle[e] = i + 1; });
    return (E.tutte || []).map(function (v, i) {
      var w = {}, n = norma(v[2]);
      [v[2]].concat(v[3] || []).forEach(function (x) { norma(x).split(" ").forEach(function (t) { if (t) w[t] = 1; }); });
      return { e: v[0], g: v[1], n: n, w: Object.keys(w), b: belle[v[0]] || 0, i: i };
    });
  }
  function cercaIn(IX, q) {
    var toks = norma(q).split(" ").filter(Boolean); if (!toks.length) return [];
    var out = [];
    IX.forEach(function (v) {
      var tot = 0;
      for (var k = 0; k < toks.length; k++) {
        var t = toks[k], best = 0;
        for (var j = 0; j < v.w.length && best < 100; j++) {
          var w = v.w[j];
          if (w === t) best = 100;
          else if (w.indexOf(t) === 0) best = Math.max(best, 70 - Math.min(20, w.length - t.length));
          else if (t.length >= 3 && w.indexOf(t) > 0) best = Math.max(best, 35);
          else if (best < 30 && t.length >= 4) {
            var max = t.length >= 7 ? 2 : 1, d = Math.min(distanza(t, w, max), w.length > t.length ? distanza(t, w.slice(0, t.length), max) : max + 1);
            if (d <= max) best = Math.max(best, 30 - d * 6);
          }
        }
        if (!best) return;
        tot += best;
      }
      if (v.n === norma(q)) tot += 40; else if (v.n.indexOf(norma(q)) === 0) tot += 15;
      if (v.b) tot += 10;
      out.push({ v: v, p: tot });
    });
    out.sort(function (a, b) { return b.p - a.p || (b.v.b ? 1 : 0) - (a.v.b ? 1 : 0) || a.v.i - b.v.i; });
    return out.slice(0, 160).map(function (x) { return x.v.e; });
  }

  // «Scegli la tua emoji»: in alto (fermo) il gettone come lo vedranno gli altri, i colori (1° 2° 3°) e la ricerca; sotto le emoji
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
    var anteprima = el("div", { class: "gt-anteprima", "aria-hidden": "true" });
    var aiuto = el("div", { class: "gt-aiuto" });
    var colori = el("div", { class: "gt-colori", role: "group", "aria-label": "I tuoi colori, in ordine" });
    var bColori = G.COLORI.map(function (x) {
      var b = el("button", { class: "gt-col", type: "button", style: "--c:" + x.c, "aria-label": x.n, onclick: function () { toccaColore(x.k); } }, [ el("b", { class: "gt-n" }) ]);
      colori.appendChild(b); return b;
    });
    var cerca = el("input", { class: "link-campo gt-cerca", type: "search", placeholder: "Cerca: razzo, cane, pizza…", autocomplete: "off", autocorrect: "off",
      autocapitalize: "none", spellcheck: "false", enterkeyhint: "search", "aria-label": "Cerca un'emoji", disabled: "disabled" });
    var bVia = el("button", { class: "gt-cerca-via", type: "button", "aria-label": "Cancella la ricerca", text: "✕", hidden: "hidden", onclick: function () { cerca.value = ""; aggCerca(); try { cerca.focus(); } catch (e) {} } });
    var testa = el("div", { class: "gt-testa" }, [
      el("div", { class: "gt-testa-sopra" }, [ anteprima, el("div", { class: "gt-testa-dx" }, [ aiuto, colori ]) ]),
      el("div", { class: "gt-cerca-riga" }, [ el("span", { class: "gt-lente", "aria-hidden": "true", text: "🔍" }), cerca, bVia ]) ]);
    s._contenuto.appendChild(testa);
    var risultati = el("div", { class: "gt-risultati", hidden: "hidden" });
    var zona = el("div", { class: "gt-zona" }, [ el("p", { class: "modulo-nota gt-carica", text: "⏳ Arrivano le emoji…" }) ]);
    s._contenuto.appendChild(risultati); s._contenuto.appendChild(zona);
    s._contenuto.appendChild(el("p", { class: "modulo-nota gt-licenza", html: "Emoji 3D: <a href='https://github.com/microsoft/fluentui-emoji' target='_blank' rel='noopener'>Fluent Emoji</a> di Microsoft (licenza MIT). Parole: Unicode CLDR." }));
    var bFatto = el("button", { class: "btn btn-primario", type: "button", text: "▶ Fatto", onclick: fatto });
    s._piede.appendChild(bFatto);

    // un'emoji della griglia: l'immagine arriva solo quando si vede (lazy); se non arriva resta l'emoji del telefono
    function bottone(e) {
      return el("button", { class: "gt-em" + (e === scelta.e ? " on" : ""), type: "button", "data-e": e, "aria-label": e, onclick: function () { scegli(e); } }, [
        el("img", { src: G.url(e), alt: e, loading: "lazy", decoding: "async", draggable: "false", onerror: function () { this.replaceWith(document.createTextNode(this.alt)); } }) ]);
    }
    function scegli(e) {
      scelta.e = e;
      [].forEach.call(s.querySelectorAll(".gt-em.on"), function (b) { b.classList.remove("on"); });
      [].forEach.call(s.querySelectorAll(".gt-em"), function (b) { if (b.getAttribute("data-e") === e) b.classList.add("on"); });
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) {}
      aggiorna();
    }
    // le sezioni, un pezzo alla volta (niente schermata ferma mentre si costruiscono 1.500 tasti)
    var IX = null;
    function disegnaTutte(E) {
      zona.innerHTML = "";
      var per = {}; (E.tutte || []).forEach(function (v) { (per[v[1]] = per[v[1]] || []).push(v[0]); });
      per.belle = (E.belle || []).slice();
      var code = GRUPPI.filter(function (gr) { return (per[gr[0]] || []).length; });
      (function una() {
        if (!s.isConnected || !code.length) return;
        var gr = code.shift(), gg = el("div", { class: "gt-griglia" }), f = document.createDocumentFragment();
        per[gr[0]].forEach(function (e) { f.appendChild(bottone(e)); });
        gg.appendChild(f);
        zona.appendChild(el("div", { class: "etichetta gt-gruppo", text: gr[1] })); zona.appendChild(gg);
        setTimeout(una, 30);
      })();
    }
    function arrivato() {
      var E = window.SG_EMOJI_TUTTE;
      if (!E || !(E.tutte || []).length) E = { belle: G.lista().map(function (x) { return x.e; }), tutte: [] };   // (senza rete: le poche di riserva)
      IX = indice(E);
      disegnaTutte(E);
      cerca.disabled = !IX.length;
      if (cerca.value) aggCerca();
    }
    if (window.SG_EMOJI_TUTTE) arrivato();
    else if (cuore.caricaPezzo) cuore.caricaPezzo("emoji").then(function () { if (s.isConnected) arrivato(); }, function () { if (s.isConnected) arrivato(); });
    else arrivato();

    // la ricerca: si aggiorna mentre si scrive (al massimo una volta per fotogramma)
    var rafC = 0;
    cerca.addEventListener("input", function () { if (rafC) return; rafC = requestAnimationFrame(function () { rafC = 0; aggCerca(); }); });
    cerca.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); try { cerca.blur(); } catch (x) {} } });
    function aggCerca() {
      var q = cerca.value.trim();
      bVia.hidden = !q;
      if (!q || !IX) { risultati.hidden = true; zona.hidden = false; return; }
      var l = cercaIn(IX, q);
      risultati.innerHTML = "";
      if (!l.length) {
        risultati.appendChild(el("p", { class: "gt-niente", text: "Nessuna emoji per «" + q + "»" }));
        var pr = el("div", { class: "gt-proposte" }, [ el("span", { text: "Prova con:" }) ]);
        PROPOSTE.forEach(function (p) { pr.appendChild(el("button", { class: "gt-prop", type: "button", text: p, onclick: function () { cerca.value = p; aggCerca(); } })); });
        risultati.appendChild(pr);
      } else {
        var gg = el("div", { class: "gt-griglia" }), f = document.createDocumentFragment();
        l.forEach(function (e) { f.appendChild(bottone(e)); });
        gg.appendChild(f); risultati.appendChild(gg);
      }
      risultati.hidden = false; zona.hidden = true;
    }

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
      aiuto.textContent = !scelta.e ? "Tocca la tua emoji qui sotto (o cercala)" : scelta.c.length < 3 ? "Ora tocca 3 colori, in ordine: " + ["il 1°", "il 2°", "il 3°"][scelta.c.length] : "Fatto! Se un amico ha il tuo 1° colore, prendi il 2°";
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
  cuore.cercaEmoji = function (q) { var E = window.SG_EMOJI_TUTTE; return E ? cercaIn(indice(E), q) : []; };   // (per le prove)
})();
