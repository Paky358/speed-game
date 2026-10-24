/* =========================================================
   «IL PREZZO È GIUSTO!» — giochi a premi (file e, 23 ott 2026): «✅ La Prova del 5» e «🧹 Togli la cifra», tutti insieme
   ognuno dal suo telefono. L'interfaccia dei giochi a premi è spiegata in js/games/prezzo-premi-piu.js; il modello seguito è
   js/games/prezzo-premi-c.js. I punti sono scelti con la simulazione
   (.agents/skills/prova-nel-browser/prezzo/simulazione/premi-e-sim.js, che usa QUESTO file: stessi prodotti, stessi cartellini,
   stessi punti): in media circa 300 a testa come gli altri giochi a premi, chi conosce i prezzi fa di più, chi tira a caso
   sta molto sotto (regole dell'equilibrio in AGENTS.md).

   ✅ LA PROVA DEL 5 (della versione italiana): 5 prodotti da 0,50 a 300 €, ognuno col suo cartellino. Alcuni cartellini hanno
      il prezzo vero, gli altri sono sbagliati del 25-45% in più o in meno, e finiscono come il prezzo vero (stessi centesimi o
      stesse ultime cifre: 7,49 € → 9,49 €, 399 € → 299 €), così non si scoprono dalla fine. Quanti sono giusti (da 1 a 4) cambia
      a ogni partita, è uguale per tutti e non si dice. Ognuno, in segreto, segna ogni cartellino ✓ giusto o ✗ sbagliato.
      35 secondi; valgono le scelte che si vedono allo scadere (un cartellino non segnato è un errore). Punti per quante ne
      azzecchi: 0-2 → 0, 3 → 200, 4 → 400, 5 → 700 (chi le azzecca tutte si porta a casa i 5 prodotti).
      Rivelazione: i cartellini si girano uno alla volta (verde se era giusto, rosso col prezzo vero se era sbagliato) e
      intanto si colorano le scelte di tutti.
   🧹 TOGLI LA CIFRA (lo «Squeeze Play» della versione americana): 3 prodotti con un prezzo intero di 3, 4 e 5 cifre (dal più
      facile). Ogni prezzo si vede con UNA cifra in più infilata in mezzo, mai la prima né l'ultima (che quindi non si toccano):
      si tocca la cifra da togliere e accanto compare il prezzo che viene. La cifra in più è sempre diversa dalle due vicine,
      così una sola scelta dà il prezzo giusto; tra le cifre possibili si preferiscono quelle che fanno venire prezzi credibili
      (che finiscono come i prezzi veri) e lontani almeno il 10% da quello vero. 35 secondi; valgono le scelte allo scadere.
      Punti: 120 per ogni prezzo giusto, +300 se li indovini tutti e tre (= 660; chi li indovina tutti si porta a casa i 3 premi).
      Rivelazione: un prodotto alla volta la cifra di troppo vola via e compare il prezzo vero; si colorano le scelte di tutti.

   LA SIMULAZIONE (premi-e-sim.js, 40.000 partite per tipo di giocatore; il modello di errore di premi-nuovi.js: il prezzo
   pensato è quello vero × e^(N(0,1)·s), bravo s = 0,15, medio 0,30, scarso 0,45; media = (bravo + 2 × medio + scarso) / 4):
     Prova del 5    media 296 · bravo 456 · medio 263 · scarso 203 · a caso 146 (giuste in media 4,1 / 3,2 / 2,9 / 2,5 su 5;
                    tutte e 5: 36% / 11% / 6% / 3%; a zero: 4% / 25% / 37% / 50%)
     Togli la cifra media 307 · bravo 343 · medio 300 · scarso 286 · a caso 142 (giusti in media 2,1 / 1,9 / 1,8 / 1,1 su 3;
                    tutti e 3: 32% / 25% / 22% / 4%)
   Chi tira a caso fa circa metà di un giocatore medio. In Togli la cifra la bravura conta meno tra bravo e scarso: quando due
   prezzi possibili sono vicini (24.950 o 24.990?) decide il buon senso su come finiscono i prezzi, che hanno tutti; conta
   molto invece rispetto a chi tira a caso. Scartati (simulazione con «tabelle»): Prova del 5 con 150/400/800 (media 296 ma
   800 è troppo) e 0/100/300/700 (media 235), cartellini sbagliati del 20-45% (la bravura contava meno); Togli la cifra
   100 +200 (media 241) e 120 +250 (293). Il colpo più alto (700 e 660) è come la Cassaforte aperta: chi tira a caso lo
   prende il 3-4% delle volte.
   Stile: classi col prefisso pze- (più quelle pz- di prezzo-scena.js).
   ========================================================= */
(function () {
  "use strict";
  var PREMI = window.SG_PREZZO_PREMI = window.SG_PREZZO_PREMI || {};
  var ERR = { facile: 0.45, medio: 0.25, difficile: 0.12 };

  function Z() { return window.SGPrezzoScena || {}; }
  function tondo2(v) { return Math.round((+v || 0) * 100) / 100; }
  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function gauss(rnd) { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  // il Bot sa il prezzo vero e sbaglia apposta (facile ±45%, medio ±25%, difficile ±12%), come negli altri giochi
  function stima(P, prezzo, liv) { var g = Math.max(-2.5, Math.min(2.5, gauss(P.rnd))); return prezzo * Math.exp(g * (ERR[liv] || 0.25) * 0.85); }
  function pubProd(p) { p = p || {}; return { e: p.e, f: p.f || null, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat }; }
  // tocco subito col pointerdown (su iPhone il click a volte non arriva); il click resta per mouse e tastiera
  function premi(b, fn) {
    var ultimo = 0;
    b.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" && e.button) return; e.preventDefault(); ultimo = Date.now(); fn(); });
    b.addEventListener("click", function () { if (ultimo) { ultimo = 0; return; } fn(); });   // (il click dopo un tocco non conta)
  }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function eTu(A, id) { return A.nome(id) === "Tu"; }
  // («Tutte giuste per te e Luca», mai «per Tu e Luca»)
  function elenco(A, ids) { var n = ids.map(function (id) { var x = A.nome(id); return x === "Tu" && ids.length > 1 ? "te" : x; }); return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " e " + n[n.length - 1]; }
  // le chip di chi ha finito, sotto il maxischermo (si aggiorna solo il segno che cambia: niente lampeggio)
  function chips(A, box, fatti) {
    svuota(box); box.className = "pz-tab" + (A.giocatori.length > 4 ? " fitto" : "");
    A.giocatori.forEach(function (g) {
      var ok = fatti.indexOf(g.id) >= 0;
      box.appendChild(A.el("span", { class: "pz-och" + (ok ? " ok" : " aspetta") }, [ A.fac(g.id), A.el("span", { text: A.nome(g.id) }), A.el("span", { class: "v", text: ok ? "✅" : "…" }) ]));
    });
  }
  function aggChips(A, box, fatti) {
    A.giocatori.forEach(function (g, i) {
      var c = box.children[i], v = c && c.querySelector(".v"), ok = fatti.indexOf(g.id) >= 0, tx = ok ? "✅" : "…";
      if (v && v.textContent !== tx) { v.textContent = tx; c.classList.toggle("ok", ok); c.classList.toggle("aspetta", !ok); }
    });
  }
  // i messaggi provvisori partono un secondo dopo l'ultimo tocco (o subito negli ultimi 4 secondi)
  function invioCalmo(A, manda) {
    var to = null;
    return {
      dopo: function () { clearTimeout(to); var resta = (A.fine || 0) - Date.now(); if (resta > 0 && resta < 4000) manda(false); else to = setTimeout(function () { manda(false); }, 1000); },
      ferma: function () { clearTimeout(to); to = null; }
    };
  }
  function testoOk(manca) { return !manca ? "✅ Fatto!" : manca === 1 ? "Ne manca 1" : "Ne mancano " + manca; }
  // la riga di un giocatore nella rivelazione: faccina, nome, un segno per prodotto, i punti (già al loro posto ma nascosti:
  // così quando compaiono non si sposta niente)
  function rigaGente(A, x, segni) {
    var el = A.el, mk = el("span", { class: "pze-mk" }), m = segni.map(function (tx) { var i = el("i", { text: tx }); mk.appendChild(i); return i; });
    var pt = el("span", { class: "pt nasc", text: "+0" }), r = el("div", { class: "pze-g" }, [ A.fac(x.id), el("span", { class: "nm", text: A.nome(x.id) }), mk, pt ]);
    return { x: x, r: r, m: m, pt: pt };
  }
  function puntiRiga(A, q, tutte) {
    var pt = (A.punti || {})[q.x.id] != null ? A.punti[q.x.id] : q.x.pt;
    q.pt.textContent = "+" + fmtN(pt); q.pt.classList.remove("nasc"); q.pt.classList.toggle("zero", !pt);
    q.r.classList.add(tutte ? "tutte" : pt ? "bene" : "male");
    var f = q.r.querySelector(".fac"); if (f) f.parentNode.replaceChild(A.fac(q.x.id, tutte ? "evviva" : pt ? "esulta" : "triste"), f);
    return pt;
  }

  // =====================================================================
  // ✅ LA PROVA DEL 5
  // =====================================================================
  var P5 = { n: 5, sec: 35, min: 0.5, max: 300, quanti: [1, 2, 3, 4], off: [0.25, 0.45], punti: [0, 0, 0, 200, 400, 700] };
  var SOGLIA = { facile: 0.4, medio: 0.27, difficile: 0.18 };   // il Bot dice «giusto» se il cartellino è entro questo dal prezzo che crede
  var TP = { prima: 1100, giro: 1000, esito: 1300, fine: 2300 };
  // la «grana» del cartellino falso: cambia la parte grossa e tiene la coda del prezzo vero (centesimi o ultime cifre),
  // così 7,49 € diventa 9,49 € e non 9,70 € (un prezzo falso tondo si scoprirebbe dalla fine)
  function grana(p) { return p < 3 ? 10 : p < 30 ? 100 : p < 300 ? 1000 : 10000; }   // in centesimi
  function cartellinoFalso(p, rnd) {
    var c = Math.round(p * 100), G = grana(p), coda = c % G, a = P5.off[0], b = P5.off[1];
    for (var t = 0; t < 60; t++) {
      var su = rnd() < 0.5, m = a + rnd() * (b - a), mira = su ? p * (1 + m) : p * (1 - m);
      var k = Math.round((mira * 100 - coda) / G), v = (k * G + coda) / 100, r = v / p;
      if (v > 0 && (su ? r >= 1 + a - 0.04 && r <= 1 + b + 0.04 : r <= 1 - a + 0.04 && r >= 1 - b - 0.04)) return tondo2(v);
    }
    return tondo2(Math.max(0.1, Math.round(p * 1.35 * 10) / 10));   // (non succede: per sicurezza)
  }
  function scelte(s, n) {
    if (!Array.isArray(s) || s.length !== n) return null;
    for (var i = 0; i < n; i++) if (!(s[i] === 1 || s[i] === 0 || s[i] == null)) return null;
    return s.map(function (x) { return x == null ? null : x; });
  }
  function giuste5(s, ok) { var n = 0; if (!s) return 0; ok.forEach(function (g, i) { if (s[i] != null && (s[i] === 1) === !!g) n++; }); return n; }
  function durata5(riv) { return TP.prima + ((riv && riv.prod) || []).length * TP.giro + TP.esito + TP.fine + 300; }

  PREMI.prova5 = {
    nome: "La Prova del 5", icona: "✅", ordine: 10,
    regola: "Cinque cartellini: per ognuno, il prezzo è giusto o sbagliato? Quanti sono giusti non si sa!",
    min: 1, max: 8, locale: true,
    _P5: P5, _falso: cartellinoFalso,   // (per la simulazione e le prove)

    // ---------------- host ----------------
    prepara: function (P) {
      var dentro = function (x) { return x.prezzo >= P5.min && x.prezzo <= P5.max; };
      var prod = P.pesca(dentro, P5.n);
      if (prod.length < P5.n) prod = prod.concat(P.pesca(null, P5.n - prod.length));
      var n = prod.length, quanti = Math.min(n - 1, P5.quanti[Math.floor(P.rnd() * P5.quanti.length)]);
      var giusti = P.mescola(prod.map(function (p, i) { return i; })).slice(0, Math.max(1, quanti));
      var ok = prod.map(function (p, i) { return giusti.indexOf(i) >= 0; });
      var tag = prod.map(function (p, i) { return ok[i] ? tondo2(p.prezzo) : cartellinoFalso(+p.prezzo, P.rnd); });
      return { prod: prod, tag: tag, ok: ok, s: {}, f: {}, ms: {} };
    },
    tempo: function () { return P5.sec; },
    pubblico: function (st) { return { prod: st.prod.map(pubProd), tag: st.tag.slice(), fatti: Object.keys(st.f) }; },
    mossa: function (st, id, m, P) {
      var s = scelte(m.s, st.prod.length); if (!s || st.f[id]) return;
      st.s[id] = s; st.ms[id] = Math.max(0, Math.round(+m.ms || 0));
      if (m.fine) { st.f[id] = 1; P.fatto(id); }
    },
    privatoDi: function (st, id) { return st.s[id] ? { s: st.s[id], f: !!st.f[id] } : null; },
    fine: function (st, P) {
      var punti = {}, g = [], carrello = {}, n = st.prod.length;
      P.ids.forEach(function (id) {
        var s = st.s[id] || null, k = giuste5(s, st.ok), pt = P5.punti[Math.min(k, P5.punti.length - 1)] || 0;
        punti[id] = pt;
        g.push({ id: id, s: s, n: k, pt: pt, ms: st.ms[id] || 0 });
        if (k === n) carrello[id] = st.prod.slice();   // tutte giuste: a casa i 5 prodotti
      });
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, tag: st.tag, ok: st.ok, g: g } };
    },
    durata: function (riv) { return durata5(riv); },
    // il Bot guarda ogni cartellino e lo dice giusto se è vicino al prezzo che crede
    bot: function (st, bot, P) {
      var sg = SOGLIA[bot.livello] || SOGLIA.medio;
      var s = st.prod.map(function (p, i) { var e = stima(P, +p.prezzo, bot.livello); return Math.abs(Math.log(st.tag[i] / e)) < sg ? 1 : 0; });
      var ms = (bot.livello === "difficile" ? 9000 : bot.livello === "medio" ? 13000 : 17000) + P.rnd() * 12000;
      var meta = s.map(function (x, i) { return i < 2 ? x : null; });
      return [ { ms: Math.round(ms * 0.5), m: { s: meta } }, { ms: Math.round(Math.min(P5.sec * 1000 - 1500, ms)), m: { s: s, fine: 1 } } ];
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [], tag = pub.tag || [];
      var fila = A.tessere(prod, { tcls: "pze-c5", extra: function (p, i) { return cartello(A, tag[i]); } }), ch = el("div", { "data-sacr": "2" });
      A.sch.appendChild(el("div", { class: "pz-testa", text: "✅ La Prova del 5" }));
      A.sch.appendChild(fila);
      A.sch.appendChild(el("div", { class: "pz-sotto", text: "Il cartellino è giusto o sbagliato? Quanti sono giusti non si sa!", "data-sacr": "1" }));
      A.sch.appendChild(ch);
      chips(A, ch, pub.fatti || []);
      fila.adatta();
      return { aggiorna: function (p) { A.pub = p; aggChips(A, ch, (p && p.fatti) || []); } };
    },
    pannello: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [], tag = pub.tag || [], n = prod.length, s = prod.map(function () { return null; }), chiuso = false, mosso = false;
      var lista = el("div", { class: "pze-lista" }), righe = [];
      prod.forEach(function (p, i) {
        var si = el("button", { class: "pze-gs si", type: "button", text: "✓", "aria-label": "Giusto" }), no = el("button", { class: "pze-gs no", type: "button", text: "✗", "aria-label": "Sbagliato" });
        premi(si, function () { segna(i, 1); }); premi(no, function () { segna(i, 0); });
        var r = el("div", { class: "pze-r5" }, [ Z().figura(el, p, "e"), el("span", { class: "n", text: p.nome || "" }), cartello(A, tag[i]), si, no ]);
        righe.push({ r: r, si: si, no: no }); lista.appendChild(r);
      });
      var ok = el("button", { class: "pz-ok pze-fatto", type: "button" });
      premi(ok, function () { if (chiuso || manca()) return; A.vibra(12); manda(true); blocca("✅ Fatto!"); });
      A.pan.appendChild(el("div", { class: "pz-nota forte pze-nota", text: "Il cartellino è ✓ giusto o ✗ sbagliato?" }));
      A.pan.appendChild(lista);
      A.pan.appendChild(ok);
      var calmo = invioCalmo(A, manda);
      function manca() { return s.filter(function (x) { return x == null; }).length; }
      function disegna() {
        righe.forEach(function (x, i) {
          x.si.classList.toggle("on", s[i] === 1); x.no.classList.toggle("on", s[i] === 0);
          x.r.classList.toggle("si", s[i] === 1); x.r.classList.toggle("no", s[i] === 0);
          x.si.disabled = x.no.disabled = chiuso;
        });
        if (!chiuso) { ok.textContent = testoOk(manca()); ok.disabled = !!manca(); }
      }
      function segna(i, v) {
        if (chiuso) return;
        s[i] = s[i] === v ? null : v; mosso = true; disegna();
        A.vibra(8); A.FX.toc(v ? 820 + i * 30 : 440 + i * 20);
        calmo.dopo();
      }
      function manda(fine) {
        calmo.ferma();
        if (!fine && !mosso) return;
        A.invia(fine ? { s: s.slice(), fine: 1 } : { s: s.slice() });
      }
      function blocca(tx) { chiuso = true; ok.disabled = true; ok.textContent = tx; lista.classList.add("chiuso"); disegna(); }
      disegna();
      return {
        privato: function (m) {
          if (!m || chiuso) return;
          var ns = scelte(m.s, n); if (!ns) return;
          s = ns; mosso = true; disegna();
          if (m.f) blocca("✅ Fatto!");
        },
        // il tempo è finito: valgono le scelte che si vedono (se hai toccato qualcosa)
        tempo: function () { if (chiuso) return; if (mosso) manda(false); blocca("⏰ Tempo scaduto"); }
      };
    },
    rivela: async function (A) {
      stile();
      var el = A.el, riv = A.riv || {}, prod = riv.prod || [], tag = riv.tag || [], ok = riv.ok || [], g = riv.g || [], n = prod.length;
      var fila = A.tessere(prod, { tcls: "pze-c5", extra: function (p, i) { return [ cartello(A, tag[i]), el("span", { class: "pze-es", text: ok[i] ? "✓ giusto" : "era " + A.fmtE(p.prezzo || 0) }) ]; } }), gente = el("div", { class: "pze-gente" + (g.length > 5 ? " fitto" : "") });
      var banner = el("div", { class: "pz-sotto pze-bn", text: "Giriamo i cartellini…" });
      A.sch.classList.add("pze-fitto");
      A.sch.appendChild(el("div", { class: "pz-testa", text: "✅ La Prova del 5" }));
      A.sch.appendChild(fila); A.sch.appendChild(gente); A.sch.appendChild(banner);
      var carte = fila.tessere;
      var righe = g.map(function (x) {
        var q = rigaGente(A, x, prod.map(function (p, i) { var v = x.s ? x.s[i] : null; return v === 1 ? "✓" : v === 0 ? "✗" : "·"; }));
        gente.appendChild(q.r); return q;
      });
      fila.adatta();
      A.ST.FX.rullo(0.9);
      await A.dorme(TP.prima); if (!A.vivo()) return;
      for (var i = 0; i < n; i++) {
        carte[i].classList.add(ok[i] ? "giusto" : "falso");
        A.FX.toc(ok[i] ? 880 : 300);
        righe.forEach(function (q) { var v = q.x.s ? q.x.s[i] : null; q.m[i].classList.add(v != null && (v === 1) === !!ok[i] ? "si" : "no"); });
        await A.dorme(TP.giro); if (!A.vivo()) return;
      }
      var tutte = [], meglio = null;
      righe.forEach(function (q) {
        puntiRiga(A, q, q.x.n === n);
        if (q.x.n === n) tutte.push(q.x);
        if (!meglio || q.x.n > meglio.n || (q.x.n === meglio.n && q.x.ms < meglio.ms)) meglio = q.x;
      });
      var pari = meglio ? righe.filter(function (q) { return q.x.n === meglio.n; }).map(function (q) { return q.x.id; }) : [];
      if (tutte.length) {
        if (tutte.some(function (x) { return A.locale === "telefono" || x.id === A.io; })) A.vibra([30, 40, 70]);
        A.FX.din(); A.ST.coriandoli(); A.ST.pubblico(A.S, "ovazione");
        banner.className = "pz-banner oro pze-bn";
        banner.textContent = tutte.length === 1 ? (eTu(A, tutte[0].id) ? "🏆 Tutti e 5 giusti!" : "🏆 Tutti e 5 per " + A.nome(tutte[0].id) + "!") : "🏆 Tutti e 5 per " + elenco(A, tutte.map(function (x) { return x.id; })) + "!";
      } else if (meglio && meglio.n >= 3) {
        banner.className = "pz-banner pze-bn";
        banner.textContent = "👏 " + (pari.length > 1 ? "I migliori: " + elenco(A, pari) : eTu(A, meglio.id) ? "Il migliore sei tu" : "Il migliore è " + A.nome(meglio.id)) + ": " + meglio.n + " su " + n;
        A.ST.pubblico(A.S, "applauso");
      } else {
        banner.className = "pz-banner no pze-bn"; banner.textContent = "😱 Cartellini difficili!";
        A.FX.trombone(); A.ST.pubblico(A.S, "ohh");
      }
      await A.dorme(TP.esito + TP.fine);
    }
  };
  function cartello(A, v) { var tx = A.fmtE(v || 0); return A.Z.cartellino(A.el, tx, tx.length > 7 ? "lungo" : ""); }

  // =====================================================================
  // 🧹 TOGLI LA CIFRA
  // =====================================================================
  var TG = { cifre: [3, 4, 5], sec: 35, aPrezzo: 120, tutti: 300, alfa: 0.5, vicino: 0.1, pesoVicino: 0.2 };
  var TT = { prima: 1100, luce: 350, vola: 700, prezzo: 750, esito: 1300, fine: 2300 };
  // come finiscono i prezzi interi veri (le ultime due cifre, contate sui prodotti del gioco il 23 ott 2026): serve a scegliere
  // una cifra in più che faccia venire prezzi credibili, e al Bot per ragionare come una persona
  var FINALI = { "00": 100, "50": 47, "99": 34, "90": 21, "20": 11, "30": 10, "49": 10, "80": 10, "29": 8, "10": 6, "60": 6, "79": 5, "05": 5, "59": 4, "70": 4,
    "39": 3, "40": 3, "69": 3, "09": 3, "95": 2, "19": 2, "15": 2, "35": 2, "55": 2, "75": 2, "89": 2, "25": 2, "45": 2, "65": 2, "85": 2 };
  function verosimile(s) { return ((FINALI[String(s).slice(-2)] || 0) + 0.3) / 100.3; }
  function intero(p) { return +p.prezzo > 0 && Math.abs(p.prezzo - Math.round(p.prezzo)) < 1e-9; }
  function cifreDi(p) { return String(Math.round(+p.prezzo)); }
  // niente cifre uguali vicine dove si tocca (24.990: i due 9 darebbero lo stesso prezzo)
  function senzaDoppie(s) { for (var k = 1; k <= s.length - 3; k++) if (s[k] === s[k + 1]) return false; return true; }
  function togliA(S, i) { return S.slice(0, i) + S.slice(i + 1); }
  function alternative(S, T) { var o = []; for (var i = 1; i < S.length - 1; i++) { var a = togliA(S, i); if (a !== T && o.indexOf(a) < 0) o.push(a); } return o; }
  // la cifra in più: posto a caso (mai il primo né l'ultimo); cifra diversa dalle due vicine (così togliendone un'altra viene
  // sempre un prezzo diverso da quello vero), scelta a caso ma pesata: meglio se i prezzi sbagliati che vengono finiscono come i
  // prezzi veri e sono lontani almeno il 10% da quello giusto
  function strizza(T, rnd) {
    var n = T.length, j = 1 + Math.floor(rnd() * (n - 1)), cand = [], tot = 0;
    for (var d = 0; d <= 9; d++) {
      var c = String(d); if (c === T[j - 1] || c === T[j]) continue;
      var S = T.slice(0, j) + c + T.slice(j), alt = alternative(S, T), lw = 0, vic = 0;
      alt.forEach(function (a) { lw += Math.log(verosimile(a)); if (Math.abs(Math.log(+a / +T)) < TG.vicino) vic++; });
      var w = Math.exp(lw / Math.max(1, alt.length) * TG.alfa) * Math.pow(TG.pesoVicino, vic);
      cand.push({ S: S, w: w }); tot += w;
    }
    var r = rnd() * tot, scelto = cand[cand.length - 1];
    for (var q = 0; q < cand.length; q++) { r -= cand[q].w; if (r <= 0) { scelto = cand[q]; break; } }
    return { S: scelto.S, j: j };
  }
  function posti(c, S) {
    if (!Array.isArray(c) || c.length !== S.length) return null;
    for (var k = 0; k < S.length; k++) { var x = c[k]; if (x == null) continue; if (!(x >= 1 && x <= S[k].length - 2) || x !== Math.floor(x)) return null; }
    return c.map(function (x) { return x == null ? null : x; });
  }
  function giustiT(c, S, vero) { return S.map(function (s, k) { return !!c && c[k] != null && togliA(s, c[k]) === vero[k]; }); }
  function durataT(riv) { return TT.prima + ((riv && riv.prod) || []).length * (TT.luce + TT.vola + TT.prezzo) + TT.esito + TT.fine + 300; }

  PREMI.togli = {
    nome: "Togli la cifra", icona: "🧹", ordine: 11,
    regola: "In ogni prezzo c'è una cifra di troppo (mai la prima né l'ultima): toccala e toglila!",
    min: 1, max: 8, locale: true,
    _TG: TG, _strizza: strizza, _togliA: togliA, _verosimile: verosimile,   // (per la simulazione e le prove)

    // ---------------- host ----------------
    prepara: function (P) {
      var prod = [], vero = [], S = [], j = [];
      TG.cifre.forEach(function (n, k) {
        var lung = function (x) { return intero(x) && cifreDi(x).length === n; };
        var p = P.pesca(function (x) { return lung(x) && senzaDoppie(cifreDi(x)); }, 1)[0] || P.pesca(lung, 1)[0]
          || P.pesca(function (x) { return intero(x) && x.prezzo >= 100 && x.prezzo < 100000; }, 1)[0];
        if (!p) p = { id: "x" + k, e: "💰", nome: "Il tesoretto", desc: "", dove: "", cat: "curiosita", prezzo: [129, 1590, 15950][k % 3] };
        var T = cifreDi(p), x = strizza(T, P.rnd);
        prod.push(p); vero.push(T); S.push(x.S); j.push(x.j);
      });
      // dal più corto al più lungo (dal più facile)
      var ord = prod.map(function (p, i) { return i; }).sort(function (a, b) { return vero[a].length - vero[b].length; });
      return { prod: ord.map(function (i) { return prod[i]; }), vero: ord.map(function (i) { return vero[i]; }), S: ord.map(function (i) { return S[i]; }), j: ord.map(function (i) { return j[i]; }), c: {}, f: {}, ms: {} };
    },
    tempo: function () { return TG.sec; },
    pubblico: function (st) { return { prod: st.prod.map(pubProd), S: st.S.slice(), fatti: Object.keys(st.f) }; },
    mossa: function (st, id, m, P) {
      var c = posti(m.c, st.S); if (!c || st.f[id]) return;
      st.c[id] = c; st.ms[id] = Math.max(0, Math.round(+m.ms || 0));
      if (m.fine) { st.f[id] = 1; P.fatto(id); }
    },
    privatoDi: function (st, id) { return st.c[id] ? { c: st.c[id], f: !!st.f[id] } : null; },
    fine: function (st, P) {
      var punti = {}, g = [], carrello = {}, n = st.S.length;
      P.ids.forEach(function (id) {
        var c = st.c[id] || null, gi = giustiT(c, st.S, st.vero), k = gi.filter(Boolean).length, pt = k * TG.aPrezzo + (k === n ? TG.tutti : 0);
        punti[id] = pt;
        g.push({ id: id, c: c, gi: gi, n: k, pt: pt, ms: st.ms[id] || 0 });
        if (k === n) carrello[id] = st.prod.slice();   // tutti e tre giusti: a casa i 3 premi
      });
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, vero: st.vero, S: st.S, j: st.j, g: g } };
    },
    durata: function (riv) { return durataT(riv); },
    // il Bot ragiona come una persona: il prezzo che crede, e come finiscono di solito i prezzi
    bot: function (st, bot, P) {
      var sd = (ERR[bot.livello] || 0.25) * 0.85;
      var c = st.S.map(function (S, k) {
        var e = stima(P, +st.vero[k], bot.livello), best = 1, bv = -Infinity;
        for (var i = 1; i < S.length - 1; i++) { var a = togliA(S, i), l = Math.log(+a / e), v = -l * l / (2 * sd * sd) + Math.log(verosimile(a)); if (v > bv) { bv = v; best = i; } }
        return best;
      });
      var ms = (bot.livello === "difficile" ? 8000 : bot.livello === "medio" ? 12000 : 16000) + P.rnd() * 12000;
      return [ { ms: Math.round(ms * 0.5), m: { c: [c[0], null, null] } }, { ms: Math.round(Math.min(TG.sec * 1000 - 1500, ms)), m: { c: c, fine: 1 } } ];
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [], S = pub.S || [];
      var fila = A.tessere(prod, { tcls: "pze-c3", extra: function (p, k) { return numero(A, S[k] || ""); } }), ch = el("div", { "data-sacr": "2" });
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🧹 Togli la cifra" }));
      A.sch.appendChild(fila);
      A.sch.appendChild(el("div", { class: "pz-sotto", text: "In ogni prezzo c'è una cifra di troppo: quale?", "data-sacr": "1" }));
      A.sch.appendChild(ch);
      chips(A, ch, pub.fatti || []);
      fila.adatta();
      return { aggiorna: function (p) { A.pub = p; aggChips(A, ch, (p && p.fatti) || []); } };
    },
    pannello: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [], S = pub.S || [], c = S.map(function () { return null; }), chiuso = false, mosso = false;
      var lista = el("div", { class: "pze-lista" }), righe = [];
      prod.forEach(function (p, k) {
        var s = S[k] || "", fila = el("span", { class: "pze-tiles" }), tasti = [];
        s.split("").forEach(function (ch, i) {
          if (i === 0 || i === s.length - 1) { fila.appendChild(el("span", { class: "pze-t fisso", text: ch })); return; }
          var b = el("button", { class: "pze-t", type: "button", text: ch });
          premi(b, function () { tocca(k, i); });
          tasti[i] = b; fila.appendChild(b);
        });
        var ant = el("b", { class: "pze-ant", text: "" });
        var r = el("div", { class: "pze-r3" }, [ Z().figura(el, p, "e"), fila, ant ]);
        righe.push({ r: r, tasti: tasti, ant: ant, s: s }); lista.appendChild(r);
      });
      var ok = el("button", { class: "pz-ok pze-fatto", type: "button" });
      premi(ok, function () { if (chiuso || manca()) return; A.vibra(12); manda(true); blocca("✅ Fatto!"); });
      A.pan.appendChild(el("div", { class: "pz-nota forte pze-nota", text: "👆 Tocca la cifra di troppo" }));
      A.pan.appendChild(lista);
      A.pan.appendChild(ok);
      var calmo = invioCalmo(A, manda);
      function manca() { return c.filter(function (x) { return x == null; }).length; }
      function disegna() {
        righe.forEach(function (x, k) {
          x.tasti.forEach(function (b, i) { if (!b) return; b.classList.toggle("via", c[k] === i); b.disabled = chiuso; });
          x.r.classList.toggle("preso", c[k] != null);
          var tx = c[k] != null ? A.fmtE(+togliA(x.s, c[k])) : "? €";
          if (x.ant.textContent !== tx) x.ant.textContent = tx;
        });
        if (!chiuso) { ok.textContent = testoOk(manca()); ok.disabled = !!manca(); }
      }
      function tocca(k, i) {
        if (chiuso) return;
        c[k] = c[k] === i ? null : i; mosso = true; disegna();
        A.vibra(8); A.FX.toc(c[k] != null ? 700 + i * 40 : 480);
        calmo.dopo();
      }
      function manda(fine) {
        calmo.ferma();
        if (!fine && !mosso) return;
        A.invia(fine ? { c: c.slice(), fine: 1 } : { c: c.slice() });
      }
      function blocca(tx) { chiuso = true; ok.disabled = true; ok.textContent = tx; lista.classList.add("chiuso"); disegna(); }
      disegna();
      return {
        privato: function (m) {
          if (!m || chiuso) return;
          var nc = posti(m.c, S); if (!nc) return;
          c = nc; mosso = true; disegna();
          if (m.f) blocca("✅ Fatto!");
        },
        tempo: function () { if (chiuso) return; if (mosso) manda(false); blocca("⏰ Tempo scaduto"); }
      };
    },
    rivela: async function (A) {
      stile();
      var el = A.el, riv = A.riv || {}, prod = riv.prod || [], vero = riv.vero || [], S = riv.S || [], J = riv.j || [], g = riv.g || [];
      var sovs = [], fila = A.tessere(prod, { tcls: "pze-c3", extra: function (p, k) {
        var num = numero(A, S[k] || ""), tag = A.Z.cartellino(el, A.fmtE(+vero[k] || 0)); sovs[k] = { num: num, sov: el("span", { class: "pze-sov" }, [ num, tag ]) }; return sovs[k].sov;
      } }), gente = el("div", { class: "pze-gente" + (g.length > 5 ? " fitto" : "") });
      var banner = el("div", { class: "pz-sotto pze-bn", text: "Via le cifre di troppo…" });
      A.sch.classList.add("pze-fitto");
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🧹 Togli la cifra" }));
      A.sch.appendChild(fila); A.sch.appendChild(gente); A.sch.appendChild(banner);
      // il numero con la cifra in più e, sotto (nello stesso posto, ancora nascosto), il cartellino col prezzo vero
      var carte = fila.tessere.map(function (t, k) { return { c: t, num: sovs[k].num, sov: sovs[k].sov }; });
      var righe = g.map(function (x) { var q = rigaGente(A, x, prod.map(function (p, k) { return x.c && x.c[k] != null ? "?" : "·"; })); gente.appendChild(q.r); return q; });
      fila.adatta();
      A.ST.FX.rullo(0.9);
      await A.dorme(TT.prima); if (!A.vivo()) return;
      for (var k = 0; k < carte.length; k++) {
        var C = carte[k];
        C.c.classList.add("luce"); A.FX.toc(600 + k * 80);
        await A.dorme(TT.luce); if (!A.vivo()) return;
        var via = C.num.children[J[k]]; if (via) via.classList.add("vola");
        A.FX.whoosh();
        await A.dorme(TT.vola); if (!A.vivo()) return;
        C.sov.classList.add("fatto"); A.FX.toc(990);
        righe.forEach(function (q) { var gi = q.x.gi && q.x.gi[k]; q.m[k].textContent = gi ? "✓" : "✗"; q.m[k].classList.add(gi ? "si" : "no"); });
        await A.dorme(TT.prezzo); if (!A.vivo()) return;
        C.c.classList.remove("luce");
      }
      var tutti = [], meglio = null, n = carte.length;
      righe.forEach(function (q) {
        puntiRiga(A, q, q.x.n === n);
        if (q.x.n === n) tutti.push(q.x);
        if (!meglio || q.x.n > meglio.n || (q.x.n === meglio.n && q.x.ms < meglio.ms)) meglio = q.x;
      });
      var pari = meglio ? righe.filter(function (q) { return q.x.n === meglio.n; }).map(function (q) { return q.x.id; }) : [];
      if (tutti.length) {
        if (tutti.some(function (x) { return A.locale === "telefono" || x.id === A.io; })) A.vibra([30, 40, 70]);
        A.FX.din(); A.ST.coriandoli(); A.ST.pubblico(A.S, "ovazione");
        banner.className = "pz-banner oro pze-bn";
        banner.textContent = tutti.length === 1 ? (eTu(A, tutti[0].id) ? "🏆 Tutti e tre giusti!" : "🏆 Tutti e tre per " + A.nome(tutti[0].id) + "!") : "🏆 Tutti e tre per " + elenco(A, tutti.map(function (x) { return x.id; })) + "!";
      } else if (meglio && meglio.n) {
        banner.className = "pz-banner pze-bn";
        banner.textContent = "👏 " + (pari.length > 1 ? "I migliori: " + elenco(A, pari) : eTu(A, meglio.id) ? "Il migliore sei tu" : "Il migliore è " + A.nome(meglio.id)) + ": " + meglio.n + " su " + n;
        A.ST.pubblico(A.S, "applauso");
      } else {
        banner.className = "pz-banner no pze-bn"; banner.textContent = "😱 Nessun prezzo giusto!";
        A.FX.trombone(); A.ST.pubblico(A.S, "ohh");
      }
      await A.dorme(TT.esito + TT.fine);
    }
  };
  // il numero a caselle (senza il punto delle migliaia: con la cifra in più il punto starebbe nel posto sbagliato)
  function numero(A, s) {
    var el = A.el;
    return el("span", { class: "pze-num" }, s.split("").map(function (ch, i) { return el("i", { class: i === 0 || i === s.length - 1 ? "fisso" : null, text: ch }); }).concat([ el("b", { text: "€" }) ]));
  }

  // ---------------- lo stile (una volta) ----------------
  function stile() {
    if (document.getElementById("sg-pze-css")) return;
    var s = document.createElement("style"); s.id = "sg-pze-css";
    s.textContent = [
      ".pz-sch.pze-fitto{gap:6px}",
      // i riquadri dei prodotti sul maxischermo (5 della Prova, 3 di Togli la cifra): il cartellino si vede subito
      ".pz-te.pze-c5 .pz-tag{font-size:14px;padding:3px 9px 3px 16px;opacity:1;transform:none;transition:background .3s}",
      // la Prova del 5: girati, verde o rosso col prezzo vero (già al suo posto, nascosto)
      ".pze-es{font-size:12px;font-weight:900;line-height:1.1;white-space:nowrap;opacity:0;transform:scale(.5);transition:opacity .25s,transform .35s cubic-bezier(.3,1.6,.5,1)}",
      ".pze-c5.giusto .pz-tag{background:linear-gradient(#b2f2bb,#51cf66);color:#06361a}.pze-c5.giusto .pze-es{opacity:1;transform:none;color:#2b8a3e}",
      ".pze-c5.falso .pz-tag{background:linear-gradient(#ffc9c9,#ff6b6b);color:#5c0011;text-decoration:line-through}.pze-c5.falso .pze-es{opacity:1;transform:none;color:#c92a2a}",
      ".pze-c5.giusto,.pze-c5.falso{animation:pzeGira .45s ease-out}@keyframes pzeGira{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:none}}",
      // il pannello: le righe dei prodotti
      ".pze-nota{margin-bottom:2px}",
      ".pze-lista{display:flex;flex-direction:column;gap:4px}",
      ".pze-lista.chiuso{opacity:.75}",
      ".pze-r5{display:flex;align-items:center;gap:6px;height:clamp(38px,calc(var(--alt,640px) * .06),48px);padding:0 4px 0 4px;border-radius:12px;background:linear-gradient(#fff,#ece6ff);color:#1d1b3a;box-shadow:inset 0 -3px 0 rgba(90,74,154,.25)}",
      ".pze-r5.si{background:linear-gradient(#ebfbee,#b2f2bb)}.pze-r5.no{background:linear-gradient(#fff5f5,#ffc9c9)}",
      ".pze-r5 .e,.pze-r3 .e{flex:0 0 auto;font-size:24px;line-height:1}",
      ".pze-r5 .n{flex:1;min-width:0;font-weight:800;font-size:12.5px;line-height:1.15;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
      ".pze-r5 .pz-tag{flex:0 0 auto;font-size:13px;padding:2px 7px 2px 13px;box-shadow:0 2px 5px rgba(0,0,0,.25)}.pze-r5 .pz-tag:before{left:5px;width:4px;height:4px;margin-top:-2px}",
      ".pze-gs{flex:0 0 auto;width:38px;height:32px;border:0;border-radius:10px;font:900 20px/1 system-ui,sans-serif;color:#5a4a9a;background:#ddd6fb;box-shadow:inset 0 -3px 0 rgba(0,0,0,.15);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
      ".pze-gs.si.on{background:#2f9e44;color:#fff}.pze-gs.no.on{background:#e03131;color:#fff}.pze-gs:disabled{cursor:default}",
      ".pze-fatto{display:block;width:100%;margin-top:4px}",
      // Togli la cifra: le caselle
      ".pze-num{display:flex;align-items:flex-end;justify-content:center;gap:1px;font-weight:900;max-width:100%}",
      ".pze-num i{font-style:normal;min-width:13px;padding:2px 1px;text-align:center;font-size:clamp(13px,calc(var(--alt,640px) * .022),18px);border-radius:4px;background:#05030f;color:#ffd43b;font-variant-numeric:tabular-nums;transition:transform .6s cubic-bezier(.4,0,.8,.4),opacity .6s}",
      ".pze-num i.fisso{color:#cdd6ff}.pze-num b{font-size:12px;color:#ffd43b;margin-left:2px}",
      ".pze-num i.vola{transform:translateY(-46px) rotate(28deg) scale(.6);opacity:0}",
      ".pze-sov{display:grid;place-items:center;max-width:100%}.pze-sov>*{grid-area:1/1}",
      ".pze-sov .pz-tag{font-size:13px;padding:2px 8px 2px 14px;opacity:0;transform:scale(.4);transition:transform .4s cubic-bezier(.3,1.6,.5,1),opacity .2s}.pze-sov .pz-tag:before{left:5px;width:4px;height:4px;margin-top:-2px}",
      ".pze-sov.fatto .pze-num{opacity:0;transition:opacity .25s}.pze-sov.fatto .pz-tag{opacity:1;transform:none}",
      ".pze-c3.luce{box-shadow:0 0 0 3px #ffd43b,0 0 18px rgba(255,212,59,.5)}",
      ".pze-r3{display:flex;align-items:center;gap:6px;padding:4px 6px 4px 4px;border-radius:12px;background:linear-gradient(#fff,#ece6ff);color:#1d1b3a;box-shadow:inset 0 -3px 0 rgba(90,74,154,.25)}",
      ".pze-r3.preso{background:linear-gradient(#fff6c7,#ffe98a)}",
      ".pze-tiles{display:flex;gap:3px;flex:0 0 auto}",
      ".pze-t{flex:0 0 auto;width:clamp(28px,8.4vw,40px);height:clamp(36px,calc(var(--alt,640px) * .064),50px);box-sizing:border-box;border:0;border-radius:9px;padding:0;display:inline-flex;align-items:center;justify-content:center;font:900 clamp(20px,calc(var(--alt,640px) * .036),28px)/1 system-ui,sans-serif;color:#ffd43b;background:linear-gradient(#2a1f66,#0b0724);box-shadow:inset 0 -3px 0 rgba(0,0,0,.4),0 0 0 2px #ffd43b66;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;font-variant-numeric:tabular-nums}",
      ".pze-t.fisso{color:#9aa3d6;background:#3b3566;box-shadow:inset 0 -3px 0 rgba(0,0,0,.3);cursor:default}",
      ".pze-t.via{background:linear-gradient(#ff8787,#e03131);color:#fff;text-decoration:line-through;box-shadow:0 0 0 3px #fff}",
      ".pze-t:disabled{cursor:default}",
      ".pze-ant{flex:1;min-width:0;text-align:right;font-size:14px;font-weight:900;white-space:nowrap;color:#5a4a9a;font-variant-numeric:tabular-nums}.pze-r3.preso .pze-ant{color:#1d1b3a}",
      // la rivelazione: chi gioca, coi segni
      ".pze-gente{display:flex;flex-direction:column;gap:4px;width:100%;max-width:440px}",
      ".pze-g{display:flex;align-items:center;gap:6px;padding:3px 8px 3px 3px;border-radius:12px;background:rgba(255,255,255,.08);animation:pzSu .35s both}",
      ".pze-g .fac{width:26px;height:26px;flex:0 0 auto;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.14)}.pze-g .fac svg{width:100%;height:100%;display:block}",
      ".pze-g .nm{flex:1;min-width:0;font-size:12px;font-weight:800;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pze-mk{display:flex;gap:3px;flex:0 0 auto}.pze-mk i{font-style:normal;width:19px;height:19px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;background:rgba(255,255,255,.16);color:#e8ebff;transition:background .3s,color .3s}",
      ".pze-mk i.si{background:#2f9e44;color:#fff}.pze-mk i.no{background:#c92a2a;color:#fff}",
      ".pze-g .pt{flex:0 0 auto;min-width:40px;text-align:center;font-weight:900;font-size:12px;color:#04321c;background:#69f0ae;border-radius:99px;padding:1px 7px}",
      ".pze-g .pt.zero{background:rgba(255,255,255,.2);color:#e8ebff}.pze-g .pt.nasc{visibility:hidden}",
      ".pze-g.tutte{background:rgba(105,240,174,.22);box-shadow:0 0 0 2px #69f0ae}.pze-g.bene{background:rgba(255,212,59,.16)}.pze-g.male{opacity:.8}",
      ".pze-gente.fitto .pze-g{padding:1px 6px 1px 2px}.pze-gente.fitto .fac{width:22px;height:22px}.pze-gente.fitto .pze-mk i{width:17px;height:17px;font-size:12px}",
      ".pze-bn{margin-top:2px}",
      "@media (prefers-reduced-motion:reduce){.pze-c5,.pze-g{animation:none}.pze-num i,.pze-es,.pze-sov .pz-tag{transition:none}}"
    ].join("\n");
    document.head.appendChild(s);
  }
})();
