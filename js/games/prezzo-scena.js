/* =========================================================
   «IL PREZZO È GIUSTO!» — i pezzi da vedere e da sentire (window.SGPrezzoScena)
   Li usano il gioco (js/games/prezzo.js) e i giochi a premi (js/games/prezzo-premi-*.js):
   - i prezzi all'italiana: fmtE(1129) = "1.129 €", fmtE(6.99) = "6,99 €"; passo e margine dei prezzi;
   - la scheda del prodotto, il cartellino del prezzo, il sipario «Apriti, sesamo!»;
   - il contachilometri del prezzo che compare cifra per cifra;
   - il pannello che sale dal basso, il tastierino dell'offerta (mai la tastiera del telefono), la barra del tempo;
   - la Ruota del 100 (striscia di numeri che si spinge col dito in giù);
   - i suoni (sipario, campanello del PREZZO GIUSTO, trombone triste, fischi, clic della ruota, «Cento!», cassa) e la vibrazione.
   Regola d'oro dello studio: le animazioni muovono solo transform e opacity. Prefisso delle classi: pz-.
   ========================================================= */
(function () {
  "use strict";

  // ---------------- i numeri e i prezzi ----------------
  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function tondo2(v) { return Math.round((+v || 0) * 100) / 100; }
  // 1129 → "1.129 €", 6.99 → "6,99 €", 0.3 → "0,30 €" (i centesimi solo se ci sono)
  function fmtE(v, senzaEuro) {
    v = tondo2(v);
    var intero = Math.floor(Math.abs(v) + 1e-9), cent = Math.round((Math.abs(v) - intero) * 100);
    var s = fmtN(intero) + (cent ? "," + (cent < 10 ? "0" : "") + cent : "");
    return (v < 0 ? "−" : "") + s + (senzaEuro ? "" : " €");
  }
  // il "passo" di arrotondamento di un prezzo (per il PREZZO GIUSTO e per i prezzi che fa il gioco)
  function passo(p) { p = +p || 0; return p < 2 ? 0.05 : p < 20 ? 0.1 : p < 100 ? 1 : p < 1000 ? 5 : p < 10000 ? 50 : 500; }
  // quanto si può superare il prezzo e valere ancora (i prezzi cambiano da città a città): 2% o un passo, il più grande
  function margine(p, pct) { return Math.max((+p || 0) * (pct == null ? 0.02 : pct), passo(p)); }
  function arrotonda(v, p) { var s = passo(p == null ? v : p); return tondo2(Math.round(v / s) * s); }
  // i prezzi coi centesimi: il tastierino ha la virgola solo sotto i 20 €
  function conCent(p) { return (+p || 0) < 20; }

  // ---------------- le categorie (nome, icona, colore) ----------------
  var CAT = {
    spesa: { nome: "Spesa al supermercato", corto: "Spesa", ic: "🛒", col: "#2f9e44" },
    bar: { nome: "Bar, pizzeria e ristoranti", corto: "Bar e ristoranti", ic: "☕", col: "#e8590c" },
    casa: { nome: "Casa ed elettrodomestici", corto: "Casa", ic: "🏠", col: "#1971c2" },
    tech: { nome: "Tecnologia", corto: "Tecnologia", ic: "📱", col: "#5f3dc4" },
    motori: { nome: "Auto, moto e bici", corto: "Auto e moto", ic: "🛵", col: "#c92a2a" },
    viaggi: { nome: "Viaggi e vacanze", corto: "Viaggi", ic: "🏖️", col: "#0c8599" },
    vestiti: { nome: "Vestiti e accessori", corto: "Vestiti", ic: "👟", col: "#c2255c" },
    servizi: { nome: "Servizi e bollette", corto: "Servizi", ic: "🧾", col: "#5c940d" },
    svago: { nome: "Sport, svago e spettacoli", corto: "Sport e spettacoli", ic: "🎟️", col: "#d6336c" },
    curiosita: { nome: "Curiosità italiane", corto: "Curiosità", ic: "🇮🇹", col: "#0b7285" }
  };
  var ORDINE_CAT = ["spesa", "bar", "casa", "tech", "motori", "viaggi", "vestiti", "servizi", "svago", "curiosita"];

  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  // ---------------- i suoni (WebAudio, niente file) ----------------
  function ac() { try { return window.SG && SG.audioCtx ? SG.audioCtx() : null; } catch (e) { return null; } }
  function nota(c, f, t, dur, tipo, vol, scivola) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = tipo || "sine"; o.frequency.setValueAtTime(f, t);
    if (scivola) o.frequency.exponentialRampToValueAtTime(scivola, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    return o;
  }
  function ottone(c, f, t, dur, vol) {   // una nota di tromba: dente di sega filtrato che si apre
    var o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
    o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = f; o2.frequency.value = f * 1.005;
    lp.type = "lowpass"; lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(2600, t + 0.08); lp.frequency.linearRampToValueAtTime(1500, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.03); g.gain.setValueAtTime(vol || 0.08, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(c.destination);
    o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
  }
  var FX = {
    // il sipario si apre: «ta-da-daaa»
    tada: function () { var c = ac(); if (!c) return; try { var t = c.currentTime; ottone(c, 523, t, 0.14, 0.07); ottone(c, 659, t + 0.13, 0.14, 0.07); ottone(c, 784, t + 0.26, 0.6, 0.08); ottone(c, 1046, t + 0.26, 0.6, 0.05); } catch (e) {} },
    // il campanello del PREZZO GIUSTO: din-din-din
    din: function () { var c = ac(); if (!c) return; try { var t = c.currentTime; [0, 0.16, 0.32].forEach(function (d) { nota(c, 2093, t + d, 0.5, "sine", 0.16); nota(c, 4186, t + d, 0.25, "sine", 0.04); }); } catch (e) {} },
    // il trombone triste: wah-wah-wah-waaah
    trombone: function () {
      var c = ac(); if (!c) return;
      try {
        var t = c.currentTime;
        [[311, 0, 0.32], [294, 0.36, 0.32], [277, 0.72, 0.32], [262, 1.08, 1.0]].forEach(function (n) {
          var o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
          o.type = "sawtooth"; o.frequency.setValueAtTime(n[0], t + n[1]);
          if (n[2] > 0.5) { o.frequency.setValueAtTime(n[0], t + n[1] + 0.3); o.frequency.linearRampToValueAtTime(n[0] * 0.94, t + n[1] + n[2]); }
          lp.type = "lowpass"; lp.frequency.setValueAtTime(380, t + n[1]); lp.frequency.linearRampToValueAtTime(1100, t + n[1] + 0.12); lp.frequency.linearRampToValueAtTime(420, t + n[1] + n[2]);
          if (n[2] > 0.5) { lfo.frequency.value = 6; lg.gain.value = 260; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t + n[1]); lfo.stop(t + n[1] + n[2]); }
          g.gain.setValueAtTime(0.0001, t + n[1]); g.gain.exponentialRampToValueAtTime(0.11, t + n[1] + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + n[2]);
          o.connect(lp); lp.connect(g); g.connect(c.destination); o.start(t + n[1]); o.stop(t + n[1] + n[2] + 0.02);
        });
      } catch (e) {}
    },
    // il pubblico fischia il «+1 €»: «buuuu» (voci basse) e qualche fischio
    buu: function () {
      var c = ac(); if (!c) return;
      try {
        var t = c.currentTime;
        for (var v = 0; v < 9; v++) {
          var f0 = 95 + Math.random() * 90, t0 = t + Math.random() * 0.15, o = c.createOscillator(), b = c.createBiquadFilter(), g = c.createGain();
          o.type = "sawtooth"; o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f0 * 0.9, t0 + 1.3);
          b.type = "bandpass"; b.frequency.value = 300 + Math.random() * 60; b.Q.value = 4;
          g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.25); g.gain.setValueAtTime(0.09, t0 + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
          o.connect(b); b.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 1.45);
        }
        [0.2, 0.7].forEach(function (d) { nota(c, 2600, t + d, 0.35, "sine", 0.035, 1500); });
      } catch (e) {}
    },
    // il clic della ruota (vol 0..1)
    clic: function (vol) { var c = ac(); if (!c) return; try { nota(c, 1700 + Math.random() * 200, c.currentTime, 0.035, "square", 0.05 * (vol == null ? 1 : vol)); } catch (e) {} },
    // il tic degli ultimi secondi
    tic: function (f) { var c = ac(); if (!c) return; try { nota(c, f || 980, c.currentTime, 0.06, "square", 0.07); } catch (e) {} },
    // un tocco leggero (una cifra che si ferma, una riga che compare)
    toc: function (f) { var c = ac(); if (!c) return; try { nota(c, f || 660, c.currentTime, 0.08, "triangle", 0.09); } catch (e) {} },
    // «CENTO! CENTO! CENTO!»: tre grida della folla
    cento: function () {
      var c = ac(); if (!c) return;
      try {
        var t = c.currentTime;
        [0, 0.42, 0.84].forEach(function (d) {
          for (var v = 0; v < 6; v++) {
            var f0 = 180 + Math.random() * 160, o = c.createOscillator(), b = c.createBiquadFilter(), g = c.createGain(), t0 = t + d + Math.random() * 0.04;
            o.type = "sawtooth"; o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f0 * 1.25, t0 + 0.1); o.frequency.linearRampToValueAtTime(f0 * 0.9, t0 + 0.32);
            b.type = "bandpass"; b.frequency.value = 700 + Math.random() * 300; b.Q.value = 2.5;
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
            o.connect(b); b.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 0.36);
          }
        });
      } catch (e) {}
    },
    // la cassa del supermercato: «ka-ching» (il carrello dei premi)
    cassa: function () { var c = ac(); if (!c) return; try { var t = c.currentTime; nota(c, 1318, t, 0.12, "square", 0.05); nota(c, 2637, t + 0.09, 0.5, "sine", 0.12); nota(c, 3520, t + 0.09, 0.35, "sine", 0.05); } catch (e) {} },
    // «whoosh» del sipario
    whoosh: function () {
      var c = ac(); if (!c) return;
      try {
        var t = c.currentTime, n = Math.floor(c.sampleRate * 0.7), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
        var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        s.buffer = b; f.type = "bandpass"; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.6); f.Q.value = 0.8; g.gain.value = 0.25;
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
      } catch (e) {}
    }
  };

  // ---------------- la foto vera del prodotto (Wikimedia Commons) ----------------
  // p.f = "percorso su Commons|larghezza dell'originale" (es. "9/9b/Nutella_ak.jpg|1514"): lo mette prezzo.js da
  // data/prezzo-foto.js (foto scelte e controllate a occhio il 22-23 ott 2026). Le misure di Wikimedia sono fisse (330 e 500
  // vanno bene, 480 no): se l'originale è più stretto si prende l'originale.
  var COMMONS = "https://upload.wikimedia.org/wikipedia/commons/";
  function urlFoto(f, px) {
    if (!f) return null;
    // le foto fatte dal proprietario stanno nel sito: "loc:carte/prezzo/<id>.jpg" (piccole, già della misura giusta; per i pezzi
    // delle vetrine il # dell'id diventa - nel nome del file, se no l'indirizzo si spezza)
    if (/^loc:carte\/prezzo\/[\w.\-]+\.(jpg|jpeg|png|webp)$/i.test(f)) return String(f).slice(4);
    var s = String(f).split("|"), path = s[0], w = +s[1] || 0, nome = path.split("/").pop();
    if (!/^[0-9a-f]\/[0-9a-f]{2}\/./.test(path)) return null;
    var enc = path.split("/").map(encodeURIComponent).join("/");
    return w && w <= px ? COMMONS + enc : COMMONS + "thumb/" + enc + "/" + px + "px-" + encodeURIComponent(nome);
  }
  var CARICATE = {};
  // si scarica prima (sotto il sipario), così quando si apre la foto c'è già
  function precarica(p, px) { var u = p && urlFoto(p.f, px || 500); if (u && !CARICATE[u]) { CARICATE[u] = new Image(); CARICATE[u].src = u; } }
  // la foto dentro un contenitore con la classe cls; se non c'è o non si carica, l'emoji (col contenitore clsEmo)
  function figura(el, p, cls, px, clsEmo) {
    p = p || {};
    var u = urlFoto(p.f, px || 330), box = el("span", { class: cls || "" });
    function emoji() { box.className = clsEmo || cls || ""; box.textContent = p.e || "🎁"; }
    if (!u) { emoji(); return box; }
    var im = document.createElement("img");
    im.alt = ""; im.draggable = false; im.decoding = "async";
    im.onerror = emoji;
    im.src = u;
    box.classList.add("pz-conf"); box.appendChild(im);
    return box;
  }

  // ---------------- la scheda del prodotto ----------------
  // prod = { e, f, nome, desc, dove, cat, prezzo? }; opz = { piccola, conPrezzo, cur, senzaCat }
  function scheda(el, prod, opz) {
    opz = opz || {}; prod = prod || {};
    var c = CAT[prod.cat] || null;
    var box = el("div", { class: "pz-scheda" + (opz.piccola ? " piccola" : "") + (opz.cls ? " " + opz.cls : "") });
    if (c && !opz.senzaCat) { var ch = el("span", { class: "pz-cat", text: c.ic + " " + (opz.piccola ? c.corto : c.nome) }); ch.style.setProperty("--cc", c.col); box.appendChild(ch); }
    box.appendChild(figura(el, prod, "pz-foto", 500, "pz-emo"));
    box.appendChild(el("div", { class: "pz-nome", text: prod.nome || "" }));
    if (prod.desc && !opz.senzaDesc) box.appendChild(el("div", { class: "pz-desc", text: prod.desc }));
    if (prod.dove) box.appendChild(el("div", { class: "pz-dove", text: "📍 " + prod.dove }));
    if (opz.conPrezzo && prod.prezzo != null) box.appendChild(cartellino(el, fmtE(prod.prezzo)));
    if (opz.cur && prod.cur) box.appendChild(el("div", { class: "pz-cur", text: "💡 " + prod.cur }));
    return box;
  }
  function cartellino(el, testo, cls) { return el("span", { class: "pz-tag" + (cls ? " " + cls : ""), text: testo }); }

  // ---------------- il sipario «Apriti, sesamo!» ----------------
  function sipario(el, dentro) {
    var w = el("div", { class: "pz-sip" }, [ el("div", { class: "dentro" }, [dentro]), el("div", { class: "tela sx" }), el("div", { class: "tela dx" }) ]);
    return { el: w, apri: function () { FX.whoosh(); w.classList.add("aperto"); }, aperto: function () { w.classList.add("aperto", "subito"); } };
  }

  // ---------------- il contachilometri: il prezzo compare cifra per cifra ----------------
  // valore in euro; opz = { grande }. Restituisce { el, via(msTraUnaCifraEaltra) } (via restituisce una Promise)
  function contachilometri(el, valore, opz) {
    opz = opz || {};
    var testo = fmtE(valore, true), box = el("div", { class: "pz-conta" + (opz.grande ? " grande" : "") }), cifre = [];
    testo.split("").forEach(function (ch) {
      if (/\d/.test(ch)) {
        var str = el("div", { class: "str" }); for (var k = 0; k < 20; k++) str.appendChild(el("span", { text: String(k % 10) }));
        var cel = el("div", { class: "cif gira" }, [str]); cel._d = +ch; cel._str = str;
        str.style.animationDelay = (-Math.random() * 0.3).toFixed(2) + "s";
        cifre.push(cel); box.appendChild(cel);
      } else box.appendChild(el("div", { class: "sep", text: ch }));
    });
    box.appendChild(el("div", { class: "eur", text: "€" }));
    function ferma(c) { c.classList.remove("gira"); c._str.style.transform = "translateY(" + (-c._d * 5) + "%)"; c.classList.add("ferma"); }
    return { el: box, subito: function () { cifre.forEach(ferma); },
      via: function (ms) {
        ms = ms || 320;
        return new Promise(function (ok) {
          cifre.forEach(function (c, i) { setTimeout(function () { ferma(c); FX.toc(520 + i * 70); }, (i + 1) * ms); });
          setTimeout(ok, (cifre.length + 1) * ms + 200);
        });
      } };
  }
  function durataConta(valore, ms) { return ((fmtE(valore, true).replace(/\D/g, "").length) + 1) * (ms || 320) + 200; }

  // ---------------- la barra del tempo (secondi che mancano, tic negli ultimi 5) ----------------
  // fine = Date.now() + ms; onFine() a zero. Restituisce { el, ferma(), allunga(nuovaFine) }
  function barraTempo(el, fine, onFine, opz) {
    opz = opz || {};
    var bar = el("i"), riga = el("div", { class: "pz-tempo" + (opz.cls ? " " + opz.cls : "") }, [ el("div", { class: "b" }, [bar]), el("b", { class: "s" }) ]);
    var sec = riga.querySelector(".s"), tot = Math.max(1, fine - Date.now()), ultimo = -1, finito = false, id = null;
    function segna() {
      if (!riga.isConnected && ultimo >= 0) { clearInterval(id); return; }
      var resta = fine - Date.now(), s = Math.max(0, Math.ceil(resta / 1000));
      bar.style.transform = "scaleX(" + Math.max(0, Math.min(1, resta / tot)).toFixed(3) + ")";
      if (s !== ultimo) { ultimo = s; sec.textContent = s; riga.classList.toggle("poco", s <= 5); if (s > 0 && s <= 5 && !opz.muto) FX.tic(); }
      if (resta <= 0 && !finito) { finito = true; clearInterval(id); if (onFine) onFine(); }
    }
    segna(); id = setInterval(segna, 200);
    return { el: riga, ferma: function () { finito = true; clearInterval(id); }, allunga: function (f) { fine = f; tot = Math.max(tot, fine - Date.now()); finito = false; clearInterval(id); id = setInterval(segna, 200); segna(); } };
  }

  // ---------------- il pannello che sale dal basso (sopra lo studio) ----------------
  function pannello(S) {
    var el = S.t.el, p = el("div", { class: "pz-pan" }), toAlto = null;
    S.vista.appendChild(p);
    function misura() { if (!p.isConnected) return; S.vista.style.setProperty("--pz-pan", p.offsetHeight + "px"); }
    var P = {
      el: p,
      metti: function (nodi) { while (p.firstChild) p.removeChild(p.firstChild); (nodi || []).forEach(function (n) { if (n) p.appendChild(n); }); misura(); return P; },
      su: function () { misura(); S.vista.classList.add("pz-con-pan"); p.classList.add("su"); clearTimeout(toAlto); toAlto = setTimeout(misura, 60); return P; },
      giu: function () { p.classList.remove("su"); S.vista.classList.remove("pz-con-pan"); return P; },
      misura: misura,
      aperto: function () { return p.classList.contains("su"); }
    };
    if (window.ResizeObserver) try { new ResizeObserver(misura).observe(p); } catch (e) {}
    return P;
  }

  // ---------------- il tastierino dell'offerta ----------------
  // opz = { cent (la virgola), limite (deve stare sotto), testoOk ("🏷️ Offro!"), preso(v) → nome di chi l'ha già detto o null,
  //         offerte: [{ nome, v }] (a vista: si toccano per fare «+1 €»), onOk(v), sopra: [nodi sopra il display] }
  // Restituisce { el, valore(), fatto(v), blocca(testo), offerte(lista), aggiorna() }
  function tastierino(el, opz) {
    opz = opz || {};
    var buf = "", fatto = false, chiuso = false, attende = false;
    var val = el("span", { class: "v" }), canc = el("button", { class: "pz-canc", type: "button", "aria-label": "Cancella", text: "⌫" });
    var disp = el("div", { class: "pz-disp" }, [ val, canc ]);
    var riga = el("div", { class: "pz-offrow" });
    var ok = el("button", { class: "pz-ok", type: "button" });
    var tasti = el("div", { class: "pz-tasti" });
    function tasto(tx, cls, fn) { var b = el("button", { class: "pz-k" + (cls ? " " + cls : ""), type: "button", text: tx }); premi(b, fn); tasti.appendChild(b); return b; }
    // tocco subito col pointerdown (su iPhone il click a volte non arriva); il click resta per mouse e tastiera
    function premi(b, fn) {
      var ultimo = 0;
      b.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" && e.button) return; e.preventDefault(); ultimo = Date.now(); fn(); });
      b.addEventListener("click", function () { if (ultimo && Date.now() - ultimo < 5000) { ultimo = 0; return; } fn(); });   // (il click dopo un tocco non conta, anche se il dito è restato giù a lungo)
    }
    function intero() { return buf.split(",")[0]; }
    function aggiungi(ch) {
      if (fatto || chiuso) return;
      if (ch === ",") { if (!opz.cent || buf.indexOf(",") >= 0) return; buf = (buf || "0") + ","; return mostra(); }
      if (buf.indexOf(",") >= 0) { if (buf.split(",")[1].length >= 2) return; buf += ch; return mostra(); }
      if (ch === "000") { if (!buf || buf === "0" || intero().length + 3 > 7) return; buf += "000"; return mostra(); }
      if (buf === "0") buf = "";
      if (intero().length >= 7) return;
      buf += ch; mostra();
    }
    // un valore in euro → quello che si vede scritto sul tastierino ("1250", "6,9")
    function aBuf(v) {
      v = tondo2(v); var i = Math.floor(v + 1e-9), c = Math.round((v - i) * 100);
      if (!opz.cent || !c) return String(i);
      return i + "," + (c < 10 ? "0" : "") + c;   // sempre coi due centesimi: «11,10 €»
    }
    function togli() { if (fatto || chiuso) return; buf = buf.slice(0, -1); if (buf === "0") buf = ""; mostra(); }
    function valore() { if (!buf) return 0; var p = buf.split(","); return tondo2(+(p[0] || 0) + (p[1] ? +("0." + p[1]) : 0)); }
    function testoBuf() {
      if (!buf) return "";
      var p = buf.split(","), s = fmtN(+(p[0] || 0));
      return s + (buf.indexOf(",") >= 0 ? "," + p[1] : "") + " €";
    }
    function mostra() {
      var v = valore();
      if (fatto) { val.textContent = "✅ " + fmtE(fatto); ok.textContent = opz.testoFatto || "✅ Fatto!"; ok.disabled = true; disp.classList.add("fatto"); return; }
      val.textContent = testoBuf() || (opz.cent ? "0,00 €" : "0 €"); val.classList.toggle("vuoto", !buf);
      var chi = v && opz.preso ? opz.preso(v) : null, sotto = v && opz.limite != null && v >= opz.limite;
      ok.disabled = !v || !!chi || sotto || chiuso || attende;
      ok.textContent = attende ? "…" : chi ? "Già preso da " + chi : sotto ? "Sotto i " + fmtE(opz.limite) + "!" : (opz.testoOk || "🏷️ Offro!");
      ok.classList.toggle("no", !!chi || sotto);
      canc.disabled = !buf;
    }
    ["1", "2", "3"].forEach(function (d) { tasto(d, "", function () { aggiungi(d); }); });
    tasto("⌫", "fn", togli).setAttribute("aria-label", "Cancella");
    ["4", "5", "6"].forEach(function (d) { tasto(d, "", function () { aggiungi(d); }); });
    tasto(opz.cent ? "," : "000", opz.cent ? "fn virgola" : "fn", function () { aggiungi(opz.cent ? "," : "000"); });
    ["7", "8", "9", "0"].forEach(function (d) { tasto(d, "", function () { aggiungi(d); }); });
    tasti.appendChild(ok);
    premi(canc, togli);
    premi(ok, function () {
      if (fatto || chiuso || ok.disabled || attende) return;
      var v = valore(); if (!v) return;
      vibra(12);
      // (es. Più o meno: si aspetta la risposta, poi si riprova; la risposta può arrivare subito, dentro onOk)
      if (opz.continuo) { attende = true; mostra(); if (opz.onOk && opz.onOk(v) === false) { attende = false; mostra(); } return; }
      if (opz.onOk && opz.onOk(v) === false) return;
      fatto = v; mostra();
    });
    // a vista: le offerte già date, da toccare per fare «+1 €» (o +0,10 € sui prodotti coi centesimi)
    function offerte(lista) {
      while (riga.firstChild) riga.removeChild(riga.firstChild);
      lista = (lista || []).slice().sort(function (a, b) { return a.v - b.v; });
      riga.hidden = !lista.length;
      riga.classList.toggle("tante", lista.length > 3);   // tante offerte: chip piccole su due righe, si vedono tutte
      lista.forEach(function (o) {
        var b = el("button", { class: "pz-offch" + (o.mia ? " mia" : ""), type: "button" }, [ el("b", { text: o.nome }), el("span", { text: fmtE(o.v) }) ]);
        if (!o.mia) premi(b, function () {
          if (fatto || chiuso) return;
          var piu = tondo2(o.v + (opz.cent ? 0.1 : 1));
          buf = aBuf(piu);
          mostra(); b.classList.remove("piu"); void b.offsetWidth; b.classList.add("piu");
        });
        riga.appendChild(b);
      });
    }
    var box = el("div", { class: "pz-tast" }, (opz.sopra || []).concat([ riga, disp, tasti ]));
    offerte(opz.offerte || []); mostra();
    return { el: box, valore: valore, offerte: offerte, aggiorna: mostra,
      fatto: function (v) { fatto = v; mostra(); },
      riapri: function () { fatto = false; attende = false; mostra(); },
      svuota: function () { buf = ""; mostra(); },
      blocca: function (testo) { chiuso = true; ok.disabled = true; if (testo) ok.textContent = testo; tasti.classList.add("chiuso"); } };
  }

  // ---------------- la Ruota del 100 ----------------
  var SPICCHI = [5, 100, 15, 80, 35, 60, 20, 40, 75, 55, 95, 50, 85, 30, 65, 10, 45, 70, 25, 90];
  var GIRI_STRISCIA = 12;
  function coloreSpicchio(v) { return v === 100 ? "rosso" : (v === 5 || v === 15) ? "verde" : (SPICCHI.indexOf(v) % 2 ? "arg" : "oro"); }
  // opz = { alt (altezza di una casella), onSpinta(forza 0..1) → false per rifiutare, onCambio(valore) }
  // La ruota si spinge trascinando il dito IN GIÙ o IN SU (gira dalla parte della spinta).
  // Restituisce { el, attiva(si), gira(forza, v, verso), arriva(valore) → Promise, mostra(valore) }
  function ruota(el, opz) {
    opz = opz || {};
    var H = opz.alt || 62, N = SPICCHI.length * GIRI_STRISCIA;
    var str = el("div", { class: "pz-rstr" });
    for (var i = 0; i < N; i++) { var v = SPICCHI[i % SPICCHI.length]; str.appendChild(el("div", { class: "pz-rcel " + coloreSpicchio(v), text: String(v) })); }
    // opz.mini: la ruota piccola di un amico sul maxischermo (senza clic, gira più a lungo prima di fermarsi)
    var fin = el("div", { class: "pz-ruota" + (opz.mini ? " mini" : "") }, [ str, el("div", { class: "luce" }), el("div", { class: "freccia" }) ]);
    fin.style.setProperty("--h", H + "px");
    var pos = SPICCHI.length * (GIRI_STRISCIA - 2), attiva = false, stato = "fermo", vel = 0, verso = -1, target = null, piano = null, ultimoInt = Math.round(pos), ultimoClic = 0, raf = null, fineCb = null;
    // pos = quale casella sta davanti alla freccia (con la virgola): pos più piccolo = la striscia scende (verso -1), più grande = sale (+1)
    function disegna() {
      var y = -(pos * H) + H;   // la freccia sta sulla seconda casella dall'alto (si vedono 3 caselle)
      str.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
      var k = Math.round(pos);
      if (k !== ultimoInt) { ultimoInt = k; var ora = performance.now(); if (!opz.mini && ora - ultimoClic > 40) { ultimoClic = ora; FX.clic(Math.min(1, Math.abs(vel) / 14 + 0.25)); } }
    }
    function valoreA(p) { var k = ((Math.round(p) % SPICCHI.length) + SPICCHI.length) % SPICCHI.length; return SPICCHI[k]; }
    // (la striscia si ripete ogni 20 caselle: si salta avanti o indietro di giri interi, la ruota resta uguale.
    //  Per girare in giù si parte dalla fine della striscia, per girare in su dall'inizio)
    function normalizza(su) { var k = ((pos % SPICCHI.length) + SPICCHI.length) % SPICCHI.length; pos = k + SPICCHI.length * (su ? 2 : GIRI_STRISCIA - 2); }
    disegna();
    // ---- spinta col dito, in giù o in su ----
    var giu = null, punti = [];
    fin.addEventListener("pointerdown", function (e) {
      if (!attiva || stato !== "fermo") return;
      e.preventDefault(); try { fin.setPointerCapture(e.pointerId); } catch (x) {}
      giu = { y: e.clientY, p: pos, id: e.pointerId }; punti = [{ y: e.clientY, t: performance.now() }];
    });
    fin.addEventListener("pointermove", function (e) {
      if (!giu || e.pointerId !== giu.id) return;
      var dy = Math.max(-4 * H, Math.min(4 * H, e.clientY - giu.y));
      pos = giu.p - dy / H; disegna();
      punti.push({ y: e.clientY, t: performance.now() }); if (punti.length > 8) punti.shift();
    });
    function lascia(e) {
      if (!giu || (e && e.pointerId !== giu.id)) return;
      var tot = (e ? e.clientY : giu.y) - giu.y, a = punti[0], b = punti[punti.length - 1], dt = Math.max(16, b.t - a.t), vs = (b.y - a.y) / dt;   // px/ms (+ giù, − su)
      if (performance.now() - b.t > 120) vs = 0;   // dito fermo prima di lasciare
      giu = null;
      var dir = vs < 0 ? 1 : -1, v = Math.abs(vs);   // dito in su → la striscia sale (pos cresce)
      var forza = Math.max(0, Math.min(1, (v - 0.45) / 1.6));
      if (Math.abs(tot) < H * 0.7 || v < 0.45 || (tot < 0) !== (vs < 0)) {   // spinta debole: «Più forte!»
        fin.classList.remove("debole"); void fin.offsetWidth; fin.classList.add("debole");
        var da = pos, fine = Math.round(pos), t0 = performance.now();
        (function torna() { var u = Math.min(1, (performance.now() - t0) / 250); pos = da + (fine - da) * u; disegna(); if (u < 1) requestAnimationFrame(torna); })();
        if (opz.debole) opz.debole();
        return;
      }
      // (col Bot o sullo stesso telefono il numero arriva subito, dentro onSpinta: arriva() deve girare con QUESTA spinta)
      spintaOra = { f: Math.max(0.15, forza), v: v, dir: dir };
      if (opz.onSpinta && opz.onSpinta(spintaOra.f) === false) { spintaOra = null; return; }
      var sp = spintaOra; spintaOra = null;
      if (sp) gira(sp.f, sp.v, sp.dir);
    }
    var spintaOra = null;
    fin.addEventListener("pointerup", lascia);
    fin.addEventListener("pointercancel", function () { giu = null; });
    // ---- il giro: veloce finché non si sa il numero, poi frena e si ferma lì (dalla parte della spinta) ----
    function gira(forza, v0, dir) {
      if (stato !== "fermo") return;
      stato = "gira"; target = null; piano = null; verso = dir > 0 ? 1 : -1;
      vel = Math.max(9, Math.min(34, (v0 ? v0 * 1000 / H : 0) || (12 + forza * 18)));   // caselle al secondo
      var prima = performance.now();
      normalizza(verso > 0);   // (sempre: così c'è striscia per tutto il giro, da tutte e due le parti)
      cancelAnimationFrame(raf);
      (function passo() {
        var ora = performance.now(), dt = Math.min(0.05, (ora - prima) / 1000); prima = ora;
        if (piano) {
          var u = Math.min(1, (ora - piano.t0) / piano.T), e = 1 - Math.pow(1 - u, 2);
          pos = piano.p0 + verso * piano.L * e; vel = piano.L / piano.T * 2 * (1 - u) * 1000;
          disegna();
          if (u >= 1) { pos = piano.p0 + verso * piano.L; disegna(); stato = "fermo"; vel = 0; var cb = fineCb; fineCb = null; if (cb) cb(target); return; }
        } else {
          pos += verso * vel * dt; disegna();
          if (target != null && !piano) pianifica();
        }
        raf = requestAnimationFrame(passo);
      })();
      if (opz.onCambio) opz.onCambio(null);
    }
    function pianifica() {
      var j = SPICCHI.indexOf(target); if (j < 0) j = 0;
      var minimo = vel * (0.9 + Math.random() * 0.5) / 2 + 2 + (opz.mini ? 14 : 0);   // almeno un bel pezzo di giro prima di fermarsi (la piccola un po' di più: si guarda)
      var p0 = pos, fine = verso < 0 ? Math.floor(p0 - minimo) : Math.ceil(p0 + minimo);
      while ((((fine % SPICCHI.length) + SPICCHI.length) % SPICCHI.length) !== j) fine += verso;
      var L = Math.abs(fine - p0), T = Math.max(700, Math.min(opz.mini ? 3600 : 5200, 2 * L / vel * 1000));
      if (verso < 0 ? fine < 2 : fine > N - 3) { normalizza(verso > 0); return pianifica(); }
      piano = { t0: performance.now(), p0: p0, L: L, T: T };
    }
    // il numero dell'host è arrivato: la ruota frena e si ferma lì (Promise quando è ferma)
    function arriva(valore) {
      return new Promise(function (ok) {
        if (stato === "fermo") { var sp = spintaOra; spintaOra = null; if (sp) gira(sp.f, sp.v, sp.dir); else gira(0.5); }
        target = valore; fineCb = ok;
      });
    }
    return { el: fin, attiva: function (si) { attiva = !!si; fin.classList.toggle("attiva", attiva); }, gira: gira, arriva: arriva,
      mostra: function (valore) { cancelAnimationFrame(raf); stato = "fermo"; var j = SPICCHI.indexOf(valore); if (j < 0) return; normalizza(); pos = pos - (((pos % 20) + 20) % 20) + j; disegna(); },
      ferma: function () { cancelAnimationFrame(raf); stato = "fermo"; },
      valore: function () { return valoreA(pos); } };
  }

  // ---------------- lo stile ----------------
  function stile() {
    if (document.getElementById("sg-prezzo-css")) return;
    var s = document.createElement("style"); s.id = "sg-prezzo-css";
    s.textContent = [
      // il maxischermo con il pannello aperto: il contenuto sta nella parte che si vede
      ".st-vista.pz-con-pan .st-sch-in{padding-bottom:calc(var(--pz-pan,300px) + 4px)}",
      ".st-vista.pz-con-pan .st-terzo{bottom:calc(var(--pz-pan,300px) + 10px)}",
      ".st-vista.pz-con-pan .st-barra{display:none}",
      // (telefoni bassi col pannello su: il prodotto un po' più piccolo, così il tabellone delle offerte resta sopra il pannello)
      ".st-vista.pz-con-pan .pz-sch{gap:6px}",
      ".st-vista.pz-con-pan .pz-tab.fitto .pz-och .nm{display:none}.st-vista.pz-con-pan .pz-tab.fitto .pz-och{padding-right:8px}",
      "@media (max-height:700px){.st-vista.pz-con-pan .pz-sip .pz-emo{font-size:36px;height:1.15em}}",
      ".pz-sch{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;justify-content:safe center;gap:10px;text-align:center;padding:2px 2px 0;overflow:hidden}",
      ".pz-testa{display:flex;align-items:center;justify-content:center;gap:8px;min-height:30px;margin:0 40px;font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#ffe066}",
      ".pz-testa .x2{background:#ff3ea5;color:#fff;border-radius:99px;padding:2px 9px;letter-spacing:.04em;animation:pzPulsa 1s ease-in-out infinite}",
      ".pz-titolo{font-size:22px;font-weight:900;color:#fff;line-height:1.15}",
      ".pz-sotto{font-size:14px;font-weight:800;color:#cdd6ff;line-height:1.3}",
      "@keyframes pzPulsa{50%{transform:scale(1.08)}}",
      "@keyframes pzPop{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}",
      "@keyframes pzSu{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}",
      // la scheda del prodotto
      ".pz-scheda{position:relative;width:min(340px,94%);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 14px 12px;border-radius:18px;background:linear-gradient(#ffffff,#f3efff);color:#1d1b3a;box-shadow:0 10px 26px rgba(0,0,0,.45),inset 0 -4px 0 rgba(90,74,154,.18)}",
      ".pz-cat{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:var(--cc,#5a4a9a);border-radius:99px;padding:3px 10px}",
      ".pz-emo{font-size:clamp(40px,calc(var(--alt,640px) * .085),66px);line-height:1.15;width:1.6em;height:1.3em;display:flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle,rgba(255,212,59,.55),rgba(255,212,59,0) 66%)}",
      ".pz-nome{font-size:19px;font-weight:900;line-height:1.15}",
      ".pz-desc{font-size:13.5px;font-weight:600;color:#4c4a66;line-height:1.28}",
      ".pz-dove{font-size:12.5px;font-weight:800;color:#7048e8}",
      ".pz-cur{margin-top:4px;font-size:12.5px;font-weight:700;color:#5c3c00;background:#fff3bf;border-radius:10px;padding:4px 8px;line-height:1.3}",
      ".pz-scheda .pz-tag{margin-top:4px}",
      ".pz-scheda.piccola{flex-direction:row;flex-wrap:wrap;justify-content:center;gap:2px 8px;padding:6px 10px;border-radius:14px;width:min(360px,96%)}",
      ".pz-scheda.piccola .pz-emo{font-size:30px;width:auto;height:auto;background:none}.pz-scheda.piccola .pz-nome{font-size:16px}.pz-scheda.piccola .pz-cat{display:none}",
      ".pz-scheda.piccola .pz-desc{display:none}.pz-scheda.piccola .pz-dove{width:100%;font-size:11.5px}",
      ".pz-scheda.media .pz-emo{font-size:40px}.pz-scheda.media .pz-desc{font-size:12.5px}.pz-scheda.media .pz-nome{font-size:17px}",
      // la foto vera: nella scheda alta quanto lo schermo permette, nelle righe grande come l'emoji che c'era (1,3 em)
      ".pz-foto{height:clamp(62px,calc(var(--alt,640px) * .15),140px);max-width:100%;display:flex;align-items:center;justify-content:center}",
      ".pz-foto img{max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,.28);background:#fff}",
      ".pz-scheda.piccola .pz-foto{height:46px}.pz-scheda.media .pz-foto{height:clamp(54px,calc(var(--alt,640px) * .1),90px)}",
      "@media (max-height:700px){.st-vista.pz-con-pan .pz-sip .pz-foto{height:66px}}",
      ".pz-conf:not(.pz-foto){display:inline-flex;align-items:center;justify-content:center;width:1.3em;height:1.3em;flex:0 0 auto;vertical-align:middle}",
      ".pz-conf:not(.pz-foto) img{width:100%;height:100%;object-fit:cover;border-radius:22%;background:#fff}",
      // il cartellino del prezzo
      ".pz-tag{position:relative;display:inline-flex;align-items:center;gap:6px;padding:4px 12px 4px 20px;border-radius:5px 14px 14px 5px;background:linear-gradient(#ffe98a,#fcc419);color:#3b2a00;font-weight:900;font-size:17px;box-shadow:0 3px 10px rgba(0,0,0,.35);white-space:nowrap}",
      ".pz-tag:before{content:'';position:absolute;left:7px;top:50%;width:7px;height:7px;margin-top:-3.5px;border-radius:50%;background:#2a1d6e}",
      ".pz-tag.rosso{background:linear-gradient(#ffa8a8,#fa5252);color:#fff}.pz-tag.verde{background:linear-gradient(#b2f2bb,#37b24d);color:#05310f}",
      // il sipario
      ".pz-sip{position:relative;display:flex;justify-content:center;width:100%}",
      ".pz-sip>.dentro{display:flex;justify-content:center;width:100%;transform:scale(.82);opacity:0;transition:transform .7s cubic-bezier(.3,1.4,.5,1) .35s,opacity .3s .3s}",
      ".pz-sip.aperto>.dentro{transform:none;opacity:1}",
      ".pz-sip>.tela{position:absolute;top:-14px;bottom:-14px;width:54%;z-index:3;will-change:transform;transition:transform 1s cubic-bezier(.6,.05,.3,1);",
        "background:linear-gradient(90deg,rgba(0,0,0,.25),rgba(255,255,255,.08) 30%,rgba(0,0,0,.3)) 0 0/26px 100%,linear-gradient(#a3122a,#7a0a1d);box-shadow:inset 0 -9px 0 #ffd43b,inset 0 -12px 0 #b8860b,0 6px 14px rgba(0,0,0,.4)}",
      ".pz-sip>.tela.sx{left:-3%;border-radius:0 0 28% 0}.pz-sip>.tela.dx{right:-3%;border-radius:0 0 0 28%}",
      ".pz-sip.aperto>.tela.sx{transform:translateX(-106%)}.pz-sip.aperto>.tela.dx{transform:translateX(106%)}",
      ".pz-sip.subito>.tela,.pz-sip.subito>.dentro{transition:none}",
      // il contachilometri del prezzo
      ".pz-conta{display:inline-flex;align-items:center;gap:2px;padding:6px 10px;border-radius:14px;background:#05030f;box-shadow:0 0 0 3px #ffd43b,0 0 24px rgba(255,212,59,.45);font-family:'Courier New',ui-monospace,monospace;font-weight:900;color:#ffe066;font-size:34px;line-height:1}",
      ".pz-conta.grande{font-size:44px;padding:8px 12px}",
      ".pz-conta .cif{position:relative;width:.66em;height:1.1em;overflow:hidden;border-radius:5px;background:linear-gradient(#1b1440,#05030f 45%,#05030f 55%,#1b1440)}",
      ".pz-conta .str{position:absolute;left:0;top:0;width:100%;display:flex;flex-direction:column;will-change:transform;transition:transform .45s cubic-bezier(.2,1.5,.4,1)}",
      ".pz-conta .str span{height:1.1em;display:flex;align-items:center;justify-content:center}",
      ".pz-conta .cif.gira .str{animation:pzRotola .28s linear infinite}",
      "@keyframes pzRotola{from{transform:translateY(0)}to{transform:translateY(-50%)}}",
      ".pz-conta .cif.ferma{background:linear-gradient(#2a1f66,#0b0724 45%,#0b0724 55%,#2a1f66)}",
      ".pz-conta .sep{width:.32em;text-align:center}.pz-conta .eur{margin-left:.18em;color:#fff}",
      // la barra del tempo
      ".pz-tempo{display:flex;align-items:center;gap:8px}.pz-tempo .b{flex:1;height:7px;border-radius:4px;background:rgba(255,255,255,.18);overflow:hidden}",
      ".pz-tempo .b i{display:block;height:100%;width:100%;background:#ffd43b;transform-origin:0 50%;will-change:transform;transition:transform .2s linear}",
      ".pz-tempo .s{min-width:26px;text-align:right;font-size:17px;font-weight:900;color:#ffd43b;font-variant-numeric:tabular-nums}",
      ".pz-tempo.poco .b i{background:#ff5d6c}.pz-tempo.poco .s{color:#ff5d6c}",
      ".pz-tempo.mini{width:min(220px,70%);margin:4px auto 0}.pz-tempo.mini .b{height:5px}.pz-tempo.mini .s{font-size:14px;min-width:20px}",
      // il pannello in basso
      ".pz-pan{position:absolute;left:0;right:0;bottom:0;z-index:23;box-sizing:border-box;display:flex;flex-direction:column;gap:7px;padding:9px 12px calc(10px + env(safe-area-inset-bottom));",
        "border-radius:22px 22px 0 0;background:linear-gradient(#2b1a78f2,#120a3cf7 40%);box-shadow:0 -10px 30px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.25);color:#fff;",
        "transform:translateY(105%);transition:transform .32s cubic-bezier(.3,1.2,.5,1);user-select:none;-webkit-user-select:none;touch-action:manipulation}",
      ".pz-pan.su{transform:none}",
      ".pz-pan-testa{display:flex;align-items:center;gap:8px;font-weight:900;font-size:15px;min-height:26px}",
      ".pz-pan-testa .fac{width:28px;height:28px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.15);flex:0 0 auto}.pz-pan-testa .fac svg{width:100%;height:100%;display:block}",
      ".pz-pan-testa .tx{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pz-pan-testa .pz-tempo{flex:0 0 42%}",
      ".pz-nota{margin:0;text-align:center;font-weight:800;color:#cdd6ff;font-size:14px;line-height:1.35}",
      ".pz-nota.forte{color:#ffe066;font-size:16px}",
      // il tastierino
      ".pz-tast{display:flex;flex-direction:column;gap:7px}",
      ".pz-offrow{display:flex;gap:6px;overflow:hidden;flex-wrap:nowrap;min-height:30px}",
      ".pz-offrow[hidden]{display:none}",
      ".pz-offrow.tante{flex-wrap:wrap;gap:4px;max-height:72px}",
      ".pz-offrow.tante .pz-offch{flex-direction:column;align-items:center;gap:0;padding:2px 8px;line-height:1.12}",
      ".pz-offrow.tante .pz-offch b{font-size:10.5px;max-width:56px}.pz-offrow.tante .pz-offch span{font-size:12.5px}",
      // (le offerte stanno tutte nel pannello: il tabellone del maxischermo si toglie per fare spazio)
      ".st-vista.pz-con-pan:has(.pz-offrow.tante) .pz-sch .pz-tab{display:none}",
      ".pz-offch{flex:0 0 auto;display:flex;align-items:center;gap:5px;border:0;border-radius:99px;padding:4px 10px;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:13px;cursor:pointer;-webkit-tap-highlight-color:transparent}",
      ".pz-offch b{font-weight:800;color:#cdd6ff;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pz-offch span{font-weight:900;color:#ffe066}",
      ".pz-offch.mia{background:rgba(55,212,126,.3)}.pz-offch.piu{animation:pzPop .3s}",
      ".pz-disp{position:relative;display:flex;align-items:center;justify-content:center;height:clamp(42px,calc(var(--alt,640px) * .07),58px);border-radius:14px;background:#05030f;box-shadow:inset 0 0 0 2px rgba(255,224,102,.35)}",
      ".pz-disp .v{font-family:'Courier New',ui-monospace,monospace;font-weight:900;font-size:clamp(26px,calc(var(--alt,640px) * .048),36px);color:#ffe066;letter-spacing:.02em}",
      ".pz-disp .v.vuoto{color:rgba(255,224,102,.3)}.pz-disp.fatto .v{color:#6ff0a6;font-family:inherit;font-size:24px}",
      ".pz-canc{display:none}",
      ".pz-tasti{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}",
      ".pz-tasti.chiuso{opacity:.55}",
      ".pz-k,.pz-ok{height:clamp(40px,calc(var(--alt,640px) * .07),56px);border:0;border-radius:13px;font:inherit;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .08s}",
      ".pz-k{font-size:23px;color:#fff;background:linear-gradient(#5b46c4,#3a2a96);box-shadow:inset 0 -3px 0 rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.25)}",
      ".pz-k.fn{font-size:19px;background:linear-gradient(#3d3570,#272152)}",
      ".pz-k.virgola{font-size:34px;line-height:.6;padding-bottom:10px}",
      ".pz-k:active,.pz-ok:active{transform:scale(.95)}",
      ".pz-ok{grid-column:span 4;font-size:19px;color:#3b2a00;background:linear-gradient(#ffe98a,#fcc419);box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),0 4px 14px rgba(252,196,25,.35)}",
      ".pz-ok:disabled{opacity:.5;cursor:default;box-shadow:none}.pz-ok.no{background:linear-gradient(#ffc9c9,#ff8787);color:#5c0011;opacity:.9}",
      // le offerte sul maxischermo (tabellone)
      ".pz-tab{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:100%}",
      ".pz-och{display:flex;align-items:center;gap:5px;border-radius:99px;padding:2px 10px 2px 2px;background:rgba(255,255,255,.12);font-weight:900;font-size:14px;animation:pzPop .35s cubic-bezier(.3,1.6,.5,1) both}",
      ".pz-och .fac,.pz-riga .fac,.pz-cl .fac,.pz-rg .fac,.pz-car .fac{border-radius:50%;overflow:hidden;background:rgba(255,255,255,.14);flex:0 0 auto}",
      ".pz-och .fac svg,.pz-riga .fac svg,.pz-cl .fac svg,.pz-rg .fac svg,.pz-car .fac svg{width:100%;height:100%;display:block}",
      ".pz-och .fac{width:24px;height:24px}.pz-och .v{color:#ffe066}.pz-och.ok{background:rgba(55,212,126,.28)}.pz-och.aspetta{opacity:.55}",
      ".pz-tab.fitto .pz-och{font-size:12.5px;padding-right:7px}.pz-tab.fitto .pz-och .fac{width:20px;height:20px}",
      // la rivelazione: le righe delle offerte
      ".pz-righe{display:flex;flex-direction:column;gap:5px;width:100%;max-width:420px}",
      ".pz-righe.due{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5px}",
      ".pz-riga{position:relative;display:flex;align-items:center;gap:7px;padding:3px 8px 3px 3px;border-radius:12px;background:rgba(255,255,255,.09);text-align:left;opacity:0;transform:translateY(10px);transition:opacity .25s,transform .35s cubic-bezier(.3,1.5,.5,1)}",
      ".pz-riga.su{opacity:1;transform:none}",
      ".pz-riga .fac{width:28px;height:28px}.pz-riga .nm{flex:1;min-width:0;font-weight:800;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pz-riga .v{font-weight:900;font-size:15px;color:#ffe066;white-space:nowrap}",
      ".pz-riga .bd{flex:0 0 auto;font-size:11px;font-weight:900;border-radius:99px;padding:2px 7px;white-space:nowrap}",
      ".pz-riga .bd:empty{display:none}",
      ".pz-riga.sotto .bd{background:#37d47e;color:#04321c}.pz-riga.sopra{background:rgba(255,93,108,.18)}.pz-riga.sopra .v{color:#ffb3bb;text-decoration:line-through}",
      ".pz-riga.sopra .bd{background:#e03131;color:#fff;transform:rotate(-6deg)}",
      ".pz-riga.giusto{background:rgba(255,212,59,.3);box-shadow:0 0 0 2px #ffd43b}.pz-riga.giusto .bd{background:#ffd43b;color:#3b2a00}",
      ".pz-riga.vince{background:rgba(55,212,126,.3);box-shadow:0 0 0 2px #37d47e}",
      ".pz-riga .pt{position:absolute;right:6px;top:-9px;font-size:12px;font-weight:900;color:#04321c;background:#6ff0a6;border-radius:99px;padding:0 6px;animation:pzPop .35s both}",
      ".pz-righe.due .pz-riga .nm{font-size:12.5px}.pz-righe.due .pz-riga .v{font-size:13px}.pz-righe.due .pz-riga .fac{width:22px;height:22px}.pz-righe.due .pz-riga .bd{font-size:9.5px;padding:1px 5px}",
      ".pz-banner{font-size:24px;font-weight:900;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.4);animation:pzPop .45s cubic-bezier(.3,1.6,.5,1) both}",
      ".pz-banner.oro{color:#ffe066;font-size:30px}.pz-banner.no{color:#ffb3bb}",
      ".pz-miniprod{display:flex;align-items:center;justify-content:center;gap:8px;max-width:100%;font-weight:900;font-size:16px;color:#fff}",
      ".pz-miniprod .e{font-size:28px}.pz-miniprod .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pz-curiosita{max-width:420px;font-size:13px;font-weight:700;color:#3b2a00;background:#fff3bf;border-radius:12px;padding:5px 10px;line-height:1.3;animation:pzSu .4s both}",
      ".pz-anno{font-size:11px;font-weight:700;color:#9aa5d8;letter-spacing:.04em}",
      // la classifica (riepilogo) e il carrello
      ".pz-clas{display:flex;flex-direction:column;gap:6px;width:100%;max-width:420px}",
      ".pz-clas.due{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5px}",
      ".pz-cl{display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;border-radius:14px;background:rgba(255,255,255,.08);text-align:left;animation:pzSu .4s both}",
      ".pz-cl.primo{background:rgba(255,212,59,.2);box-shadow:inset 0 0 0 1px rgba(255,212,59,.6)}",
      ".pz-cl .pos{width:26px;text-align:center;font-weight:900;flex:0 0 auto}.pz-cl .fac{width:34px;height:34px}",
      ".pz-cl .nm{flex:1;min-width:0;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pz-cl .pt{font-weight:900;color:#ffe066}.pz-cl .pi{font-size:12px;font-weight:900;color:#6ff0a6;min-width:38px;text-align:right}",
      ".pz-clas.due .pz-cl{padding:3px 6px 3px 3px;gap:5px}.pz-clas.due .pz-cl .fac{width:26px;height:26px}.pz-clas.due .pz-cl .nm{font-size:13px}.pz-clas.due .pz-cl .pt{font-size:13px}.pz-clas.due .pz-cl .pi{min-width:0;font-size:11px}.pz-clas.due .pz-cl .pos{width:20px}",
      ".pz-car{display:flex;align-items:center;gap:8px;padding:5px 10px 5px 4px;border-radius:14px;background:rgba(255,255,255,.08);text-align:left;animation:pzSu .45s both;width:100%;max-width:420px;box-sizing:border-box}",
      ".pz-car .fac{width:34px;height:34px}.pz-car .cosa{flex:1;min-width:0;display:flex;flex-direction:column}",
      ".pz-car .cosa b{font-size:14px}.pz-car .cosa span{font-size:20px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pz-car .cosa small{font-size:11.5px;color:#cdd6ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pz-car .tot{font-weight:900;color:#ffe066;font-size:15px;white-space:nowrap}",
      ".pz-cars{display:flex;flex-direction:column;gap:6px;width:100%;align-items:center}.pz-cars.due{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5px}",
      ".pz-cars.due .pz-car{padding:3px 6px 3px 3px;gap:5px}.pz-cars.due .pz-car .fac{width:26px;height:26px}.pz-cars.due .pz-car .cosa span{font-size:16px}.pz-cars.due .pz-car .tot{font-size:12px}",
      // le scelte grandi (il gioco a premi, giro ancora / mi fermo)
      ".pz-scelte{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}",
      ".pz-sc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:96px;border:0;border-radius:16px;padding:8px;font:inherit;color:#1d1b3a;background:linear-gradient(#fff,#ece6ff);box-shadow:inset 0 -4px 0 rgba(90,74,154,.25);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .1s}",
      ".pz-sc:active{transform:scale(.96)}.pz-sc .i{font-size:30px;line-height:1}.pz-sc b{font-size:16px}.pz-sc small{font-size:11.5px;font-weight:700;color:#4c4a66;line-height:1.25}",
      ".pz-sc.sel{background:linear-gradient(#ffe98a,#fcc419);box-shadow:0 0 0 3px #fff}.pz-sc:disabled{opacity:.55}",
      ".pz-giochi{display:flex;gap:10px;justify-content:center;width:100%}",
      ".pz-gioco{flex:1;max-width:170px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border-radius:16px;background:rgba(255,255,255,.1);animation:pzPop .45s both}",
      ".pz-gioco .i{font-size:34px}.pz-gioco b{font-size:16px}.pz-gioco small{font-size:12px;color:#cdd6ff;line-height:1.25}",
      ".pz-gioco.sel{background:rgba(255,212,59,.25);box-shadow:0 0 0 2px #ffd43b}.pz-gioco.via{opacity:.35}",
      ".pz-intro{display:flex;flex-direction:column;align-items:center;gap:8px;animation:pzPop .5s cubic-bezier(.3,1.6,.5,1) both}",
      ".pz-intro .i{font-size:64px;line-height:1}.pz-intro b{font-size:28px;color:#ffe066}.pz-intro p{margin:0;max-width:330px;font-size:16px;font-weight:700;color:#e8ebff;line-height:1.35}",
      // la ruota del 100
      ".pz-ruota{position:relative;height:calc(var(--h) * 3);border-radius:18px;overflow:hidden;background:#140d3a;box-shadow:inset 0 0 0 3px #ffd43b,0 6px 20px rgba(0,0,0,.45);touch-action:none;cursor:grab}",
      ".pz-ruota .pz-rstr{position:absolute;left:0;right:0;top:0;will-change:transform}",
      ".pz-rcel{height:var(--h);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:calc(var(--h) * .55);border-bottom:2px solid rgba(0,0,0,.35);box-sizing:border-box}",
      ".pz-rcel.oro{background:linear-gradient(90deg,#b8860b,#ffe066 40%,#fff3bf 50%,#ffe066 60%,#b8860b);color:#3b2a00}",
      ".pz-rcel.arg{background:linear-gradient(90deg,#868e96,#e9ecef 40%,#fff 50%,#e9ecef 60%,#868e96);color:#212529}",
      ".pz-rcel.rosso{background:linear-gradient(90deg,#a61e4d,#ff6b6b 40%,#ffc9c9 50%,#ff6b6b 60%,#a61e4d);color:#fff}",
      ".pz-rcel.verde{background:linear-gradient(90deg,#2b8a3e,#69db7c 40%,#d3f9d8 50%,#69db7c 60%,#2b8a3e);color:#05310f}",
      ".pz-ruota .luce{position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(10,6,40,.75),rgba(10,6,40,0) 30%,rgba(10,6,40,0) 70%,rgba(10,6,40,.75))}",
      ".pz-ruota .freccia{position:absolute;right:-2px;top:50%;width:0;height:0;margin-top:-14px;border:14px solid transparent;border-right:22px solid #ff3ea5;pointer-events:none}",
      ".pz-ruota.attiva{box-shadow:inset 0 0 0 3px #6ff0a6,0 0 0 4px rgba(111,240,166,.35),0 6px 20px rgba(0,0,0,.45)}",
      ".pz-ruota.debole,.pz-scuoti{animation:pzScuoti .4s}",
      "@keyframes pzScuoti{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}",
      ".pz-rgriglia{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;width:100%;max-width:420px}",
      // le ruote di tutti, dal vivo (4 per schermata): la ruota piccola a sinistra, chi è e il suo numero a destra
      ".pz-ruota.mini{flex:0 0 auto;width:calc(var(--h) * 2);border-radius:10px;box-shadow:inset 0 0 0 2px #ffd43b;cursor:default}",
      ".pz-ruota.mini .pz-rcel{border-bottom-width:1px}.pz-ruota.mini .freccia{margin-top:-7px;border-width:7px;border-right-width:11px}",
      ".pz-rcard{display:flex;align-items:center;gap:6px;padding:4px;border-radius:12px;background:rgba(255,255,255,.09);text-align:left;min-width:0}",
      ".pz-rcard.nuova .pz-ruota.mini .pz-rstr{opacity:.15}.pz-rcard.nuova .pz-ruota.mini::after{content:\"?\";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 calc(var(--h) * 1.1)/1 system-ui,sans-serif;color:#ffe066;pointer-events:none}",
      ".pz-rcard[hidden]{display:none}.pz-rcard .info{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}",
      ".pz-rcard .chi{display:flex;align-items:center;gap:4px;min-width:0}.pz-rcard .fac{width:22px;height:22px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.14);flex:0 0 auto}.pz-rcard .fac svg{width:100%;height:100%;display:block}",
      ".pz-rcard .nm{min-width:0;font-size:12.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pz-rcard .val{font-weight:900;font-size:17px;color:#ffe066;white-space:nowrap;font-variant-numeric:tabular-nums}.pz-rcard .st{font-size:11px;font-weight:800;color:#cdd6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".pz-rcard.gira{box-shadow:0 0 0 2px #6ff0a6}.pz-rcard.fuori{background:rgba(255,93,108,.2)}.pz-rcard.fuori .val{color:#ffb3bb}.pz-rcard.cento{background:rgba(255,212,59,.3);box-shadow:0 0 0 2px #ffd43b}",
      ".pz-rpag{display:flex;align-items:center;justify-content:center;gap:10px;font-size:12px;font-weight:800;color:#cdd6ff}.pz-rpag[hidden]{display:none}",
      ".pz-rpag button{border:0;border-radius:99px;width:30px;height:26px;font:900 14px/1 system-ui,sans-serif;color:#fff;background:rgba(255,255,255,.16);cursor:pointer;touch-action:manipulation}",
      ".pz-rg{display:flex;align-items:center;gap:6px;padding:4px 8px 4px 4px;border-radius:12px;background:rgba(255,255,255,.09);text-align:left;font-weight:800;min-width:0}",
      ".pz-rg .fac{width:28px;height:28px}.pz-rg .nm{flex:1;min-width:0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pz-rg .val{font-weight:900;font-size:16px;color:#ffe066;white-space:nowrap}.pz-rg.fuori{background:rgba(255,93,108,.2)}.pz-rg.fuori .val{color:#ffb3bb}",
      ".pz-rg.cento{background:rgba(255,212,59,.3);box-shadow:0 0 0 2px #ffd43b}.pz-rg.vince{box-shadow:0 0 0 2px #37d47e;background:rgba(55,212,126,.25)}",
      ".pz-big100{font-size:44px;font-weight:900;color:#ff3ea5;text-shadow:0 0 18px rgba(255,62,165,.7),0 3px 0 #000;animation:pzPulsa .45s ease-in-out 3}",
      // la vetrina
      ".pz-vet{display:flex;flex-direction:column;gap:6px;width:100%;max-width:420px}",
      ".pz-vp{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:14px;background:linear-gradient(#ffffff,#f3efff);color:#1d1b3a;text-align:left;animation:pzPop .45s cubic-bezier(.3,1.6,.5,1) both}",
      ".pz-vp .e{font-size:30px;flex:0 0 auto}.pz-vp .t{flex:1;min-width:0;display:flex;flex-direction:column}.pz-vp .t b{font-size:15px;line-height:1.15}.pz-vp .t small{font-size:11.5px;color:#4c4a66;font-weight:600;line-height:1.2}",
      ".pz-vp .pz-tag{font-size:14px;padding:3px 9px 3px 16px;opacity:0;transform:scale(.4);transition:transform .4s cubic-bezier(.3,1.6,.5,1),opacity .2s}.pz-vp .pz-tag.su{opacity:1;transform:none}",
      ".pz-vet.fitta .pz-vp{padding:3px 8px}.pz-vet.fitta .pz-vp .e{font-size:22px}.pz-vet.fitta .pz-vp .t small{display:none}",
      ".pz-vtit{font-size:22px;font-weight:900;color:#ffe066}",
      ".pz-tot{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:900;color:#fff}",
      ".pz-indizio{font-size:14px;font-weight:800;color:#3b2a00;background:#ffe066;border-radius:12px;padding:5px 10px;line-height:1.3}",
      ".pz-tutto{font-size:32px;font-weight:900;color:#ffe066;text-shadow:0 0 22px rgba(255,212,59,.8),0 3px 0 #a85c00;animation:pzPulsa .5s ease-in-out 4}",
      // ⏩ Avanti
      ".pz-avanti{display:flex;align-items:center;justify-content:center;gap:10px}.pz-avanti .quanti{font-size:14px;font-weight:800;background:rgba(255,255,255,.22);border-radius:99px;padding:2px 10px}",
      ".pz-attesa{margin:0;text-align:center;font-weight:800;color:#cdd6ff}",
      "@media (prefers-reduced-motion:reduce){.pz-och,.pz-cl,.pz-car,.pz-vp,.pz-gioco,.pz-intro,.pz-banner{animation:none}}"
    ].join("");
    document.head.appendChild(s);
  }

  window.SGPrezzoScena = {
    fmtN: fmtN, fmtE: fmtE, tondo2: tondo2, passo: passo, margine: margine, arrotonda: arrotonda, conCent: conCent,
    CAT: CAT, ORDINE_CAT: ORDINE_CAT, FX: FX, vibra: vibra,
    scheda: scheda, cartellino: cartellino, sipario: sipario, contachilometri: contachilometri, durataConta: durataConta,
    urlFoto: urlFoto, precarica: precarica, figura: figura,
    barraTempo: barraTempo, pannello: pannello, tastierino: tastierino,
    SPICCHI: SPICCHI, ruota: ruota, coloreSpicchio: coloreSpicchio,
    stile: stile
  };
})();
