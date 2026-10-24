/* =========================================================
   «IL PREZZO È GIUSTO!» — giochi a premi (file c, 23 ott 2026): «🛒 La Spesa» e «🔐 La Cassaforte», tutti insieme ognuno
   dal suo telefono. L'interfaccia dei giochi a premi è spiegata in js/games/prezzo-premi-piu.js. I punti sono scelti con la
   simulazione (.agents/skills/prova-nel-browser/prezzo/simulazione/premi-nuovi.js): in media circa 300 a testa come gli altri
   giochi a premi, e chi conosce i prezzi fa di più (regole dell'equilibrio in AGENTS.md).

   🛒 LA SPESA (il Grocery Game della TV): 5 prodotti del supermercato. Senza vedere i prezzi ognuno sceglie quanti pezzi
      comprarne (da 0 a 9 l'uno, coi tasti − e +) per spendere TRA 20 E 22 €. 40 secondi; vale il carrello che si vede allo
      scadere. Punti: dentro 600; fuori al massimo di 1,5 € 350; entro 4 € 200; entro 7 € 75; più lontano (o carrello vuoto) 0.
      Rivelazione: i prezzi dei 5 prodotti, poi il carrello di ognuno corre sulla sua corsia fino al totale, con la fascia verde.
   🔐 LA CASSAFORTE (della versione italiana): il prezzo di una cosa (4 o 5 cifre, almeno 3 diverse) con le cifre mescolate:
      si toccano due cifre per scambiarle, fino alla combinazione giusta. 30 secondi; vale la combinazione che si vede allo
      scadere (chi non tocca niente: 0). Punti: 60 per ogni cifra al posto giusto, +400 se la cassaforte si apre.
      Rivelazione: le combinazioni di tutti, poi il prezzo vero cifra per cifra e le casseforti che si aprono.
   Stile: classi col prefisso pzc- (più quelle pz- di prezzo-scena.js).
   ========================================================= */
(function () {
  "use strict";
  var PREMI = window.SG_PREZZO_PREMI = window.SG_PREZZO_PREMI || {};
  var ERR = { facile: 0.45, medio: 0.25, difficile: 0.12 };
  var COLORI = ["#ff6b6b", "#4dabf7", "#ffd43b", "#69db7c", "#da77f2", "#ff922b", "#3bc9db", "#f783ac"];

  function Z() { return window.SGPrezzoScena || {}; }
  function tondo2(v) { return Math.round((+v || 0) * 100) / 100; }
  function gauss(rnd) { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  // il Bot sa il prezzo vero e sbaglia apposta (facile ±45%, medio ±25%, difficile ±12%), come negli altri giochi
  function stima(P, prezzo, liv) { var g = Math.max(-2.5, Math.min(2.5, gauss(P.rnd))); return prezzo * Math.exp(g * (ERR[liv] || 0.25) * 0.85); }
  function pubProd(p) { p = p || {}; return { e: p.e, f: p.f || null, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat }; }
  // tocco subito col pointerdown (su iPhone il click a volte non arriva); il click resta per mouse e tastiera
  function premi(b, fn) {
    var ultimo = 0;
    b.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" && e.button) return; e.preventDefault(); ultimo = Date.now(); fn(); });
    b.addEventListener("click", function () { if (ultimo) { ultimo = 0; return; } fn(); });   // (il click dopo un tocco non conta, anche se il dito è restato giù a lungo)
  }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function eTu(A, id) { return A.nome(id) === "Tu"; }
  function mioTelefono(A, id) { return A.locale === "telefono" || id === A.io; }
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
  // una permutazione valida di 0..n-1
  function permutazione(l, n) {
    if (!Array.isArray(l) || l.length !== n) return false;
    var visti = {}; for (var i = 0; i < n; i++) { var x = l[i]; if (!(x >= 0 && x < n) || x !== Math.floor(x) || visti[x]) return false; visti[x] = 1; }
    return true;
  }
  // i messaggi provvisori partono un secondo dopo l'ultimo tocco (o subito negli ultimi 4 secondi)
  function invioCalmo(A, manda) {
    var to = null;
    return {
      dopo: function () { clearTimeout(to); var resta = (A.fine || 0) - Date.now(); if (resta > 0 && resta < 4000) manda(false); else to = setTimeout(function () { manda(false); }, 1000); },
      ferma: function () { clearTimeout(to); to = null; }
    };
  }

  // =====================================================================
  // 🛒 LA SPESA
  // =====================================================================
  var SP = { n: 5, sec: 40, min: 20, max: 22, maxQ: 9, punti: [[0, 600], [1.5, 350], [4, 200], [7, 75]] };
  var TS = { prima: 900, prezzo: 650, pausa: 500, corsa: 2400, esito: 1300, fine: 2300 };
  function totale(prod, q) { var t = 0; prod.forEach(function (p, i) { t += (+p.prezzo || 0) * ((q && q[i]) || 0); }); return tondo2(t); }
  function fuori(T) { return tondo2(T < SP.min ? SP.min - T : T > SP.max ? T - SP.max : 0); }
  function pezzi(q) { return (q || []).reduce(function (a, x) { return a + (x || 0); }, 0); }
  function puntiSpesa(T, q) {
    if (!pezzi(q)) return 0;
    var d = fuori(T);
    for (var i = 0; i < SP.punti.length; i++) if (d <= SP.punti[i][0] + 1e-9) return SP.punti[i][1];
    return 0;
  }
  function quantita(q, n) {
    if (!Array.isArray(q) || q.length !== n) return null;
    for (var i = 0; i < n; i++) { var x = q[i]; if (!(x >= 0 && x <= SP.maxQ) || x !== Math.floor(x)) return null; }
    return q.slice();
  }
  function durataSpesa(riv) { return TS.prima + ((riv && riv.prod) || []).length * TS.prezzo + TS.pausa + TS.corsa + TS.esito + TS.fine; }

  PREMI.spesa = {
    nome: "La Spesa", icona: "🛒", ordine: 6,
    regola: "Senza vedere i prezzi, riempi il carrello per spendere tra 20 e 22 €!",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var prod = P.pesca(function (x) { return x.cat === "spesa" && x.prezzo >= 0.5 && x.prezzo <= 8; }, SP.n);
      if (prod.length < SP.n) prod = prod.concat(P.pesca(function (x) { return x.prezzo >= 0.5 && x.prezzo <= 8; }, SP.n - prod.length));
      return { prod: prod, q: {}, f: {}, ms: {} };
    },
    tempo: function () { return SP.sec; },
    pubblico: function (st) { return { prod: st.prod.map(pubProd), fatti: Object.keys(st.f), min: SP.min, max: SP.max }; },
    mossa: function (st, id, m, P) {
      var q = quantita(m.q, st.prod.length); if (!q || st.f[id]) return;
      st.q[id] = q; st.ms[id] = Math.max(0, Math.round(+m.ms || 0));
      if (m.fine) { st.f[id] = 1; P.fatto(id); }
    },
    privatoDi: function (st, id) { return st.q[id] ? { q: st.q[id], f: !!st.f[id] } : null; },
    fine: function (st, P) {
      var punti = {}, g = [], carrello = {};
      P.ids.forEach(function (id) {
        var q = st.q[id] || null, T = q ? totale(st.prod, q) : 0, pt = puntiSpesa(T, q);
        punti[id] = pt;
        g.push({ id: id, q: q, T: T, d: fuori(T), pt: pt, ms: st.ms[id] || 0 });
      });
      // chi sta nella fascia si porta a casa la sua spesa (un pezzo per ogni prodotto comprato)
      g.forEach(function (x) { if (pezzi(x.q) && x.d === 0) carrello[x.id] = st.prod.filter(function (p, i) { return x.q[i] > 0; }); });
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, g: g, min: SP.min, max: SP.max } };
    },
    durata: function (riv) { return durataSpesa(riv); },
    // il Bot aggiunge un pezzo alla volta finché, coi prezzi che crede, arriva nella fascia
    bot: function (st, bot, P) {
      var est = st.prod.map(function (p) { return stima(P, p.prezzo, bot.livello); }), q = st.prod.map(function () { return 0; }), tot = 0, mira = (SP.min + SP.max) / 2;
      for (var giri = 0; giri < 80; giri++) {
        var i = Math.floor(P.rnd() * q.length);
        if (q[i] < SP.maxQ && tot + est[i] <= mira + 0.5) { q[i]++; tot += est[i]; }
        if (tot >= SP.min + 0.3) break;
      }
      var ms = (bot.livello === "difficile" ? 9000 : bot.livello === "medio" ? 13000 : 17000) + P.rnd() * 12000;
      return [ { ms: Math.round(ms * 0.5), m: { q: q.map(function (x) { return Math.max(0, x - 1); }) } }, { ms: Math.round(Math.min(38500, ms)), m: { q: q, fine: 1 } } ];
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [];
      var fila = el("div", { class: "pzc-cinque" }), ch = el("div");
      prod.forEach(function (p) { fila.appendChild(el("div", { class: "pzc-c5" }, [ Z().figura(el, p, "e"), el("span", { class: "n", text: p.nome || "" }) ])); });
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🛒 La Spesa" }));
      A.sch.appendChild(el("div", { class: "pzc-fascia" }, [ el("span", { text: "Spendi tra" }), el("b", { text: A.fmtE(pub.min || SP.min) + " e " + A.fmtE(pub.max || SP.max) }) ]));
      A.sch.appendChild(fila);
      A.sch.appendChild(el("div", { class: "pz-sotto", text: "🙈 I prezzi non si vedono: chi li conosce meglio?" }));
      A.sch.appendChild(ch);
      chips(A, ch, pub.fatti || []);
      return { aggiorna: function (p) { A.pub = p; aggChips(A, ch, (p && p.fatti) || []); } };
    },
    pannello: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [], q = prod.map(function () { return 0; }), chiuso = false, mosso = false;
      var conta = el("span", { class: "pzc-pezzi", text: "🛒 Carrello vuoto" });
      var lista = el("div", { class: "pzc-spesa" }), righe = [];
      prod.forEach(function (p, i) {
        var n = el("b", { class: "pzc-q", text: "0" });
        var meno = el("button", { class: "pzc-pm", type: "button", text: "−" }), piu = el("button", { class: "pzc-pm piu", type: "button", text: "+" });
        premi(meno, function () { cambia(i, -1); }); premi(piu, function () { cambia(i, +1); });
        var r = el("div", { class: "pzc-sr" }, [ Z().figura(el, p, "e"), el("span", { class: "n", text: p.nome || "" }), meno, n, piu ]);
        righe.push({ r: r, n: n, meno: meno, piu: piu }); lista.appendChild(r);
      });
      var ok = el("button", { class: "pz-ok pzc-fatto", type: "button", text: "✅ Fatto!" });
      premi(ok, function () { if (chiuso) return; A.vibra(12); manda(true); blocca("✅ Fatto!"); });
      A.pan.appendChild(el("div", { class: "pz-nota forte pzc-nota", text: "🛒 Spendi tra " + A.fmtE(pub.min || SP.min) + " e " + A.fmtE(pub.max || SP.max) }));
      A.pan.appendChild(lista);
      A.pan.appendChild(el("div", { class: "pzc-piede" }, [ conta, ok ]));
      var calmo = invioCalmo(A, manda);
      function disegna() {
        righe.forEach(function (x, i) { x.n.textContent = String(q[i]); x.r.classList.toggle("preso", q[i] > 0); x.meno.disabled = chiuso || !q[i]; x.piu.disabled = chiuso || q[i] >= SP.maxQ; });
        var t = pezzi(q); conta.textContent = t ? "🛒 " + t + (t === 1 ? " pezzo" : " pezzi") : "🛒 Carrello vuoto";
      }
      function cambia(i, d) {
        if (chiuso) return;
        var v = q[i] + d; if (v < 0 || v > SP.maxQ) return;
        q[i] = v; mosso = true; disegna();
        A.vibra(8); A.FX.toc(d > 0 ? 760 + i * 40 : 520);
        calmo.dopo();
      }
      function manda(fine) {
        calmo.ferma();
        if (!fine && !mosso) return;
        A.invia(fine ? { q: q.slice(), fine: 1 } : { q: q.slice() });
      }
      function blocca(tx) { chiuso = true; ok.disabled = true; ok.textContent = tx; lista.classList.add("chiuso"); disegna(); }
      disegna();
      return {
        privato: function (m) {
          if (!m || chiuso) return;
          var nq = quantita(m.q, prod.length); if (!nq) return;
          q = nq; mosso = true; disegna();
          if (m.f) blocca("✅ Fatto!");
        },
        // il tempo è finito: vale il carrello che si vede (se hai toccato qualcosa)
        tempo: function () { if (chiuso) return; if (mosso) manda(false); blocca("⏰ Tempo scaduto"); }
      };
    },
    rivela: async function (A) {
      stile();
      var el = A.el, riv = A.riv || {}, prod = riv.prod || [], g = riv.g || [], min = riv.min || SP.min, max = riv.max || SP.max;
      var fila = el("div", { class: "pzc-cinque riv" }), corsie = el("div", { class: "pzc-corsie" + (g.length > 5 ? " fitto" : "") });
      var banner = el("div", { class: "pz-sotto pzc-bn", text: "I prezzi veri…" });
      A.sch.classList.add("pzb-fitto");
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🛒 La Spesa" }));
      A.sch.appendChild(fila); A.sch.appendChild(corsie); A.sch.appendChild(banner);
      var tags = prod.map(function (p) {
        var tag = A.Z.cartellino(el, A.fmtE(p.prezzo || 0));
        fila.appendChild(el("div", { class: "pzc-c5" }, [ Z().figura(el, p, "e"), el("span", { class: "n", text: p.nome || "" }), tag ]));
        return tag;
      });
      // le corsie: da 0 € a un po' più del carrello più caro (almeno 30 €), con la fascia verde
      var alto = Math.min(60, Math.max(30, Math.ceil(Math.max.apply(null, g.map(function (x) { return x.T; }).concat([0])) * 1.08)));
      var righe = g.map(function (x, j) {
        var carr = el("span", { class: "pzc-carr", text: "🛒" }), lab = el("span", { class: "pzc-lab" }), banda = el("span", { class: "pzc-banda" });
        banda.style.left = (100 * min / alto) + "%"; banda.style.width = (100 * (max - min) / alto) + "%";
        carr.style.setProperty("--col", COLORI[j % COLORI.length]);
        var trk = el("span", { class: "pzc-trk" }, [ banda, carr ]);
        var r = el("div", { class: "pzc-lane" }, [ A.fac(x.id), el("span", { class: "nm", text: A.nome(x.id) }), trk, lab ]);
        corsie.appendChild(r);
        return { x: x, r: r, carr: carr, trk: trk, lab: lab };
      });
      A.ST.FX.rullo(0.9);
      await A.dorme(TS.prima); if (!A.vivo()) return;
      for (var i = 0; i < tags.length; i++) { tags[i].classList.add("su"); A.FX.toc(560 + i * 90); await A.dorme(TS.prezzo); if (!A.vivo()) return; }
      banner.textContent = "🧾 Il conto di ognuno: tra " + A.fmtE(min) + " e " + A.fmtE(max) + "!";
      await A.dorme(TS.pausa); if (!A.vivo()) return;
      corsie.classList.add("su");
      A.ST.FX.rullo(1.6);
      righe.forEach(function (c) {
        var w = c.trk.clientWidth - c.carr.offsetWidth;
        c.carr.style.transitionDelay = (Math.random() * 0.25).toFixed(2) + "s";
        c.carr.style.transform = "translateX(" + Math.max(0, Math.round(w * Math.min(1, c.x.T / alto))) + "px)";
      });
      await A.dorme(TS.corsa); if (!A.vivo()) return;
      var dentro = [];
      righe.forEach(function (c) {
        var x = c.x, pt = (A.punti || {})[x.id] != null ? A.punti[x.id] : x.pt;
        c.lab.textContent = pezzi(x.q) ? A.fmtE(x.T) : "—";
        c.r.classList.add(!pezzi(x.q) ? "male" : x.d === 0 ? "dentro" : pt ? "bene" : "male");
        if (pt) c.r.appendChild(el("span", { class: "pt", text: "+" + A.fmtN(pt) }));
        if (pezzi(x.q) && x.d === 0) dentro.push(x);
        var f = c.r.querySelector(".fac"); if (f) f.parentNode.replaceChild(A.fac(x.id, x.d === 0 && pezzi(x.q) ? "evviva" : pt ? "esulta" : "triste"), f);
      });
      A.FX.toc(880);
      if (dentro.length) { A.FX.din(); A.ST.coriandoli(); A.ST.pubblico(A.S, "ovazione"); if (dentro.some(function (x) { return mioTelefono(A, x.id); })) A.vibra([30, 40, 70]); }
      await A.dorme(TS.esito); if (!A.vivo()) return;
      var vicino = g.filter(function (x) { return pezzi(x.q); }).sort(function (a, b) { return a.d - b.d || a.ms - b.ms; })[0];
      if (dentro.length) {
        banner.className = "pz-banner oro pzc-bn";
        banner.textContent = dentro.length === 1 ? (eTu(A, dentro[0].id) ? "🛒 Spesa perfetta!" : "🛒 Spesa perfetta per " + A.nome(dentro[0].id) + "!") : "🛒 Spesa perfetta per " + elenco(A, dentro.map(function (x) { return x.id; })) + "!";
      } else if (vicino) {
        banner.className = "pz-banner pzc-bn";
        banner.textContent = "😅 Nessuno nella fascia: " + (eTu(A, vicino.id) ? "il più vicino sei tu" : "il più vicino è " + A.nome(vicino.id)) + " (" + A.fmtE(vicino.T) + ")";
        A.ST.pubblico(A.S, "applauso");
      } else {
        banner.className = "pz-banner no pzc-bn"; banner.textContent = "🛒 Carrelli vuoti!";
        A.FX.trombone(); A.ST.pubblico(A.S, "ohh");
      }
      await A.dorme(TS.fine);
    }
  };

  // =====================================================================
  // 🔐 LA CASSAFORTE
  // =====================================================================
  var CF = { sec: 30, aCifra: 60, aperta: 400 };
  var TC = { prima: 1200, riga: 380, rullo: 1300, cifra: 260, colora: 700, esito: 1300, fine: 2300 };
  function intero(p) { return +p.prezzo > 0 && Math.abs(p.prezzo - Math.round(p.prezzo)) < 1e-9; }
  function diverse(s) { var o = {}; s.split("").forEach(function (c) { o[c] = 1; }); return Object.keys(o).length; }
  function ripetuta(s) { var o = {}, m = 0; s.split("").forEach(function (c) { o[c] = (o[c] || 0) + 1; m = Math.max(m, o[c]); }); return m; }
  // 4 o 5 cifre, almeno 3 diverse e nessuna più di 2 volte (con 26.000 o 62.000 ci sarebbe un modo solo sensato di metterle)
  function adatto(p) { var s = String(Math.round(p.prezzo)); return intero(p) && /^\d{4,5}$/.test(s) && diverse(s) >= 3 && ripetuta(s) <= 2; }
  function giusteCF(c, vero) { var n = 0; if (!c) return 0; for (var i = 0; i < vero.length; i++) if (c[i] === vero[i]) n++; return n; }
  function puntiCF(c, vero) { if (!c) return 0; var n = giusteCF(c, vero); return n * CF.aCifra + (n === vero.length ? CF.aperta : 0); }
  // il numero col punto delle migliaia, una cifra per casella: "15950" → ["1","5",".","9","5","0"]
  function conPunto(c) { var a = c.split(""), out = []; a.forEach(function (x, i) { if (i && (a.length - i) % 3 === 0) out.push("."); out.push(x); }); return out; }
  function durataCF(riv) { return TC.prima + ((riv && riv.g) || []).length * TC.riga + TC.rullo + String((riv && riv.vero) || "00000").length * TC.cifra + TC.colora + TC.esito + TC.fine + 400; }

  PREMI.cassaforte = {
    nome: "La Cassaforte", icona: "🔐", ordine: 7,
    regola: "Le cifre del prezzo sono mescolate: rimettile in ordine e la cassaforte si apre!",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var prod = P.pesca(adatto, 1)[0]
        || P.pesca(function (p) { return intero(p) && p.prezzo >= 100 && p.prezzo < 100000 && diverse(String(p.prezzo)) >= 2; }, 1)[0]
        || P.pesca(function (p) { return intero(p) && p.prezzo >= 10 && p.prezzo < 100000; }, 1)[0];
      if (!prod) prod = { id: "x", e: "💰", nome: "Il tesoretto", desc: "", dove: "", cat: "curiosita", prezzo: 15950 };
      var vero = String(Math.round(prod.prezzo)), idx = vero.split("").map(function (c, i) { return i; }), mix = null, peggio = Infinity;
      // mescolate: mai la combinazione giusta; meglio senza lo 0 davanti e con meno cifre possibile già al loro posto
      for (var t = 0; t < 120 && peggio > 0; t++) {
        var m = P.mescola(idx).map(function (i) { return vero[i]; }), s = m.join("");
        if (s === vero) continue;
        var pen = (m[0] === "0" ? 10 : 0) + giusteCF(s, vero);
        if (pen < peggio) { peggio = pen; mix = m; }
      }
      if (!mix) mix = vero.split("");   // (tutte le cifre uguali: non si può mescolare)
      return { prod: prod, vero: vero, mix: mix, l: {}, f: {}, ms: {} };
    },
    tempo: function () { return CF.sec; },
    pubblico: function (st) { return { prod: pubProd(st.prod), mix: st.mix.slice(), fatti: Object.keys(st.f) }; },
    mossa: function (st, id, m, P) {
      if (!permutazione(m.l, st.mix.length) || st.f[id]) return;
      st.l[id] = m.l.slice(); st.ms[id] = Math.max(0, Math.round(+m.ms || 0));
      if (m.fine) { st.f[id] = 1; P.fatto(id); }
    },
    privatoDi: function (st, id) { return st.l[id] ? { l: st.l[id], f: !!st.f[id] } : null; },
    fine: function (st, P) {
      var punti = {}, g = [], carrello = {};
      P.ids.forEach(function (id) {
        var l = st.l[id] || null, c = l ? l.map(function (j) { return st.mix[j]; }).join("") : null, n = giusteCF(c, st.vero), pt = puntiCF(c, st.vero);
        punti[id] = pt;
        g.push({ id: id, c: c, n: n, pt: pt, ms: st.ms[id] || 0, aperta: !!c && n === st.vero.length });
        if (c && n === st.vero.length) carrello[id] = [st.prod];   // chi apre la cassaforte se la porta a casa
      });
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, vero: st.vero, mix: st.mix, g: g } };
    },
    durata: function (riv) { return durataCF(riv); },
    // il Bot sceglie la combinazione più vicina al prezzo che crede (meglio se finisce con 0, come quasi tutti i prezzi)
    bot: function (st, bot, P) {
      var e = stima(P, +st.vero, bot.livello), cand = {};
      (function giro(pref, resto) {
        if (!resto.length) { if (pref[0] !== "0") cand[pref.join("")] = 1; return; }
        for (var i = 0; i < resto.length; i++) { if (resto.indexOf(resto[i]) < i) continue; giro(pref.concat([resto[i]]), resto.slice(0, i).concat(resto.slice(i + 1))); }
      })([], st.mix.slice());
      var lista = Object.keys(cand).sort(function (a, b) { return Math.abs(+a - e) * (/0$/.test(a) ? 0.9 : 1) - Math.abs(+b - e) * (/0$/.test(b) ? 0.9 : 1); });
      var scelta = lista[0] || st.mix.join(""), presi = {}, l = scelta.split("").map(function (c) { for (var j = 0; j < st.mix.length; j++) if (!presi[j] && st.mix[j] === c) { presi[j] = 1; return j; } return -1; });
      if (!permutazione(l, st.mix.length)) l = st.mix.map(function (c, j) { return j; });
      var ms = (bot.livello === "difficile" ? 7000 : bot.livello === "medio" ? 10000 : 14000) + P.rnd() * 9000;
      return [ { ms: Math.round(ms * 0.55), m: { l: P.mescola(l.slice()) } }, { ms: Math.round(Math.min(28500, ms)), m: { l: l, fine: 1 } } ];
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, ch = el("div");
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🔐 La Cassaforte" }));
      A.sch.appendChild(A.scheda(pub.prod || {}, { cls: "media" }));
      A.sch.appendChild(el("div", { class: "pzc-mix" }, conPunto((pub.mix || []).join("")).map(function (c) { return el("span", { class: c === "." ? "pt" : "c", text: c }); }).concat([ el("span", { class: "eu", text: "€" }) ])));
      A.sch.appendChild(el("div", { class: "pz-sotto", text: "🔢 Le cifre del prezzo sono mescolate: rimettile in ordine!" }));
      A.sch.appendChild(ch);
      chips(A, ch, pub.fatti || []);
      return { aggiorna: function (p) { A.pub = p; aggChips(A, ch, (p && p.fatti) || []); } };
    },
    pannello: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, mix = pub.mix || [], l = mix.map(function (c, j) { return j; }), sel = -1, chiuso = false, mosso = false;
      var fila = el("div", { class: "pzc-dial" }), caselle = [];
      // le caselle delle cifre (col punto delle migliaia in mezzo, che non si tocca)
      var n = mix.length;
      for (var pos = 0; pos < n; pos++) {
        if (pos && (n - pos) % 3 === 0) fila.appendChild(el("span", { class: "pzc-punto", text: "." }));
        (function (p) {
          var b = el("button", { class: "pzc-cifra", type: "button" });
          premi(b, function () { tocca(p); });
          caselle.push(b); fila.appendChild(b);
        })(pos);
      }
      fila.appendChild(el("span", { class: "pzc-eu", text: "€" }));
      var ok = el("button", { class: "pz-ok pzc-fatto", type: "button", text: "🔓 Apri!" });
      premi(ok, function () { if (chiuso) return; A.vibra(12); manda(true); blocca("🔐 Combinazione data"); });
      A.pan.appendChild(el("div", { class: "pz-nota forte pzc-nota", text: "👆 Tocca una cifra e poi un'altra per scambiarle" }));
      A.pan.appendChild(fila); A.pan.appendChild(ok);
      var calmo = invioCalmo(A, manda);
      function disegna() { caselle.forEach(function (b, p) { b.textContent = mix[l[p]]; }); }
      function tocca(p) {
        if (chiuso) return;
        if (sel < 0) { sel = p; caselle[p].classList.add("sel"); A.vibra(8); A.FX.toc(700); return; }
        if (sel === p) { caselle[p].classList.remove("sel"); sel = -1; return; }
        var a = sel; sel = -1; caselle[a].classList.remove("sel");
        var x = l[a]; l[a] = l[p]; l[p] = x; disegna();
        [a, p].forEach(function (q) { var c = caselle[q]; c.classList.remove("giro"); void c.offsetWidth; c.classList.add("giro"); });
        A.vibra(10); A.FX.toc(990); mosso = true;
        calmo.dopo();
      }
      function manda(fine) {
        calmo.ferma();
        if (!fine && !mosso) return;
        A.invia(fine ? { l: l.slice(), fine: 1 } : { l: l.slice() });
      }
      function blocca(tx) { chiuso = true; ok.disabled = true; ok.textContent = tx; fila.classList.add("chiuso"); if (sel >= 0) { caselle[sel].classList.remove("sel"); sel = -1; } }
      disegna();
      return {
        privato: function (m) {
          if (!m || chiuso || !permutazione(m.l, n)) return;
          l = m.l.slice(); mosso = true; disegna();
          if (m.f) blocca("🔐 Combinazione data");
        },
        // il tempo è finito: vale la combinazione che si vede (se hai toccato qualcosa)
        tempo: function () { if (chiuso) return; if (mosso) manda(false); blocca("⏰ Tempo scaduto"); }
      };
    },
    rivela: async function (A) {
      stile();
      var el = A.el, riv = A.riv || {}, prod = riv.prod || {}, vero = String(riv.vero || ""), g = riv.g || [];
      var conta = A.contachilometri(+vero || 0, {}), righe = el("div", { class: "pzc-casse" + (g.length > 5 ? " fitto" : "") }), banner = el("div", { class: "pz-sotto pzc-bn", text: "Le combinazioni…" });
      A.sch.classList.add("pzb-fitto");
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🔐 La Cassaforte" }));
      A.sch.appendChild(el("div", { class: "pz-miniprod" }, [ Z().figura(el, prod, "e"), el("span", { class: "n", text: prod.nome || "" }) ]));
      var cbox = el("div", { style: "min-height:44px;display:flex;align-items:center" }, [ conta.el ]); conta.el.style.visibility = "hidden";
      A.sch.appendChild(cbox); A.sch.appendChild(righe); A.sch.appendChild(banner);
      var rr = g.map(function (x) {
        var cif = el("span", { class: "pzc-comb" }), testo = x.c ? conPunto(x.c) : null;
        if (testo) testo.forEach(function (c) { cif.appendChild(el("span", { class: c === "." ? "pt" : "c", text: c })); });
        else cif.appendChild(el("span", { class: "vuota", text: "non l'ha toccata" }));
        var r = el("div", { class: "pzc-cassa" }, [ A.fac(x.id), el("span", { class: "nm", text: A.nome(x.id) }), cif, el("span", { class: "lucc", text: "🔒" }) ]);
        return { x: x, r: r, cif: cif };
      });
      A.ST.FX.rullo(0.9);
      await A.dorme(TC.prima); if (!A.vivo()) return;
      for (var i = 0; i < rr.length; i++) { righe.appendChild(rr[i].r); A.FX.toc(560 + i * 70); await A.dorme(TC.riga); if (!A.vivo()) return; }
      banner.textContent = "La combinazione giusta è…";
      conta.el.style.visibility = "";
      A.ST.FX.rullo(1.2); await A.dorme(TC.rullo); if (!A.vivo()) return;
      await conta.via(TC.cifra); if (!A.vivo()) return;
      // le cifre al posto giusto diventano verdi, le casseforti tutte giuste si aprono
      var aperte = [];
      rr.forEach(function (c) {
        var x = c.x, pt = (A.punti || {})[x.id] != null ? A.punti[x.id] : x.pt, k = 0;
        [].forEach.call(c.cif.querySelectorAll(".c"), function (s) { var giusta = x.c && x.c[k] === vero[k]; s.classList.add(giusta ? "si" : "no"); k++; });
        if (x.aperta) { aperte.push(x); c.r.classList.add("aperta"); c.r.querySelector(".lucc").textContent = "🔓"; }
        if (pt) c.r.appendChild(el("span", { class: "pt", text: "+" + A.fmtN(pt) }));
        var f = c.r.querySelector(".fac"); if (f) f.parentNode.replaceChild(A.fac(x.id, x.aperta ? "evviva" : pt ? "esulta" : "triste"), f);
      });
      A.FX.toc(880);
      await A.dorme(TC.colora); if (!A.vivo()) return;
      if (aperte.length) {
        A.FX.din(); A.ST.coriandoli(); A.ST.pubblico(A.S, "ovazione");
        if (aperte.some(function (x) { return mioTelefono(A, x.id); })) A.vibra([30, 40, 70]);
        banner.className = "pz-banner oro pzc-bn";
        banner.textContent = aperte.length === 1 ? (eTu(A, aperte[0].id) ? "🔓 Hai aperto la cassaforte!" : "🔓 " + A.nome(aperte[0].id) + " apre la cassaforte!") : "🔓 Cassaforte aperta da " + elenco(A, aperte.map(function (x) { return x.id; })) + "!";
      } else {
        var best = g.filter(function (x) { return x.c; }).sort(function (a, b) { return b.n - a.n || a.ms - b.ms; })[0];
        banner.className = best && best.n ? "pz-banner pzc-bn" : "pz-banner no pzc-bn";
        banner.textContent = best && best.n ? "🔒 Resta chiusa: " + (eTu(A, best.id) ? "ci sei andato più vicino tu" : "il più vicino è " + A.nome(best.id)) + " (" + best.n + " cifre su " + vero.length + ")" : "🔒 Resta chiusa per tutti!";
        A.ST.pubblico(A.S, best && best.n ? "applauso" : "ohh"); if (!(best && best.n)) A.FX.trombone();
      }
      await A.dorme(TC.esito + TC.fine);
    }
  };

  // ---------------- lo stile (una volta) ----------------
  function stile() {
    if (document.getElementById("sg-pzc-css")) return;
    var s = document.createElement("style"); s.id = "sg-pzc-css";
    s.textContent = [
      // La Spesa: la fascia, i 5 prodotti, le righe coi − e +, le corsie della rivelazione
      ".pz-sch.pzb-fitto{gap:6px}",
      ".pzc-fatto{display:block;width:100%;margin-top:4px}",   // (il tasto «Fatto» / «Apri!» a tutta larghezza, come nei giochi a premi d ed e)   // (anche se nessun gioco del file b è ancora partito)
      ".pzc-fascia{display:flex;align-items:baseline;gap:8px;font-weight:800;color:#cdd6ff;font-size:14px}.pzc-fascia b{font-size:22px;font-weight:900;color:#69f0ae}",
      ".pzc-cinque{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;width:100%;max-width:440px}",
      ".pzc-c5{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 2px;border-radius:12px;background:rgba(255,255,255,.1)}",
      ".pzc-c5 .e{font-size:clamp(24px,calc(var(--alt,640px) * .045),36px);line-height:1.1}",
      ".pzc-c5 .n{font-size:10px;font-weight:800;line-height:1.12;color:#e8ebff;text-align:center;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}",
      ".pzc-cinque.riv .pzc-c5{background:linear-gradient(#ffffff,#f3efff)}.pzc-cinque.riv .pzc-c5 .n{color:#1d1b3a}",
      ".pzc-c5 .pz-tag{font-size:11px;padding:2px 5px 2px 11px;max-width:100%;box-sizing:border-box;opacity:0;transform:scale(.4);transition:transform .4s cubic-bezier(.3,1.6,.5,1),opacity .2s}.pzc-c5 .pz-tag:before{left:4px;width:4px;height:4px;margin-top:-2px}.pzc-c5 .pz-tag.su{opacity:1;transform:none}",
      ".pzc-nota{margin-bottom:4px}",
      ".pzc-spesa{display:flex;flex-direction:column;gap:4px}",
      ".pzc-sr{display:flex;align-items:center;gap:8px;height:clamp(36px,calc(var(--alt,640px) * .058),46px);padding:0 6px 0 4px;border-radius:12px;background:linear-gradient(#fff,#ece6ff);color:#1d1b3a;box-shadow:inset 0 -3px 0 rgba(90,74,154,.25)}",
      ".pzc-sr.preso{background:linear-gradient(#fff6c7,#ffe98a)}",
      ".pzc-sr .e{flex:0 0 auto;font-size:24px;line-height:1}.pzc-sr .n{flex:1;min-width:0;font-weight:800;font-size:13px;line-height:1.15;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
      ".pzc-pm{flex:0 0 auto;width:36px;height:32px;border:0;border-radius:10px;font:900 20px/1 system-ui,sans-serif;color:#fff;background:#7048e8;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
      ".pzc-pm.piu{background:#2f9e44}.pzc-pm:disabled{opacity:.35}",
      ".pzc-q{flex:0 0 22px;text-align:center;font-size:19px;font-weight:900;font-variant-numeric:tabular-nums}",
      ".pzc-spesa.chiuso .pzc-sr{opacity:.7}",
      ".pzc-piede{display:flex;align-items:center;gap:10px;margin-top:6px}.pzc-piede .pzc-pezzi{flex:0 0 auto;font-weight:900;color:#ffe066;font-size:14px}.pzc-piede .pz-ok{flex:1;margin:0}",
      ".pzc-corsie{display:flex;flex-direction:column;gap:5px;width:100%;max-width:460px;opacity:0;transform:translateY(10px);transition:opacity .3s,transform .3s}.pzc-corsie.su{opacity:1;transform:none}",
      ".pzc-lane{display:flex;align-items:center;gap:6px;padding:3px 8px 3px 3px;border-radius:12px;background:rgba(255,255,255,.08)}",
      ".pzc-lane .fac{width:26px;height:26px;flex:0 0 auto}.pzc-lane .nm{flex:0 0 62px;font-size:12px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pzc-trk{position:relative;flex:1;min-width:60px;height:24px;border-radius:12px;background:rgba(255,255,255,.12);overflow:hidden}",
      ".pzc-banda{position:absolute;top:0;bottom:0;background:rgba(105,240,174,.45);box-shadow:inset 0 0 0 2px #69f0ae}",
      ".pzc-carr{position:absolute;left:0;top:1px;font-size:18px;line-height:22px;filter:drop-shadow(0 0 3px var(--col,#fff));transition:transform 2.1s cubic-bezier(.25,.8,.3,1)}",
      ".pzc-lab{flex:0 0 58px;text-align:right;font-weight:900;font-size:13px;color:#fff;font-variant-numeric:tabular-nums}",
      ".pzc-lane .pt,.pzc-cassa .pt{flex:0 0 auto;font-weight:900;font-size:12px;color:#04321c;background:#69f0ae;border-radius:99px;padding:1px 7px}",
      ".pzc-lane.dentro{background:rgba(105,240,174,.22);box-shadow:0 0 0 2px #69f0ae}.pzc-lane.bene{background:rgba(255,212,59,.16)}.pzc-lane.male{opacity:.75}",
      ".pzc-corsie.fitto .pzc-lane{padding:1px 6px 1px 2px}.pzc-corsie.fitto .fac{width:22px;height:22px}.pzc-corsie.fitto .pzc-trk{height:20px}.pzc-corsie.fitto .pzc-carr{font-size:15px;line-height:18px}",
      ".pzc-bn{margin-top:2px}",
      // La Cassaforte: le cifre mescolate sul maxischermo, la combinazione nel pannello, le casseforti della rivelazione
      ".pzc-mix{display:flex;align-items:flex-end;gap:4px;font-weight:900}.pzc-mix .c{min-width:30px;padding:4px 0;text-align:center;font-size:24px;border-radius:8px;background:#05030f;color:#ffd43b;box-shadow:0 0 0 2px #ffd43b55}",
      ".pzc-mix .pt,.pzc-mix .eu{font-size:22px;color:#ffd43b}",
      ".pzc-dial{display:flex;align-items:flex-end;justify-content:center;gap:5px;margin:6px 0 10px}",
      ".pzc-cifra{width:clamp(44px,15vw,58px);height:clamp(58px,calc(var(--alt,640px) * .1),74px);border:0;border-radius:12px;font:900 34px/1 system-ui,sans-serif;color:#ffd43b;background:linear-gradient(#2a1f66,#0b0724);box-shadow:inset 0 -4px 0 rgba(0,0,0,.4),0 0 0 2px #ffd43b66;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;font-variant-numeric:tabular-nums}",
      ".pzc-cifra.sel{background:linear-gradient(#ffe98a,#fcc419);color:#3b2a00;box-shadow:0 0 0 3px #fff,0 4px 14px rgba(252,196,25,.5)}",
      ".pzc-cifra.giro{animation:pzcGiro .3s ease-out}@keyframes pzcGiro{from{transform:rotateX(80deg)}to{transform:none}}",
      ".pzc-punto,.pzc-eu{font-size:30px;font-weight:900;color:#ffd43b;padding-bottom:6px}",
      ".pzc-dial.chiuso .pzc-cifra{opacity:.75}",
      ".pzc-casse{display:flex;flex-direction:column;gap:5px;width:100%;max-width:440px}",
      ".pzc-cassa{display:flex;align-items:center;gap:6px;padding:3px 8px 3px 3px;border-radius:12px;background:rgba(255,255,255,.08);animation:pzSu .35s both}",
      ".pzc-cassa .fac{width:26px;height:26px;flex:0 0 auto}.pzc-cassa .nm{flex:1;min-width:0;font-size:12px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pzc-comb{display:flex;gap:2px;flex:0 0 auto}.pzc-comb .c{min-width:17px;text-align:center;font-weight:900;font-size:15px;border-radius:5px;background:#05030f;color:#ffd43b;padding:1px 0;transition:background .3s,color .3s}",
      ".pzc-comb .c.si{background:#2f9e44;color:#fff}.pzc-comb .c.no{background:#c92a2a;color:#fff}.pzc-comb .pt{font-weight:900;color:#ffd43b}.pzc-comb .vuota{font-size:11px;color:#cdd6ff}",
      ".pzc-cassa .lucc{flex:0 0 auto;font-size:18px}.pzc-cassa.aperta{background:rgba(105,240,174,.22);box-shadow:0 0 0 2px #69f0ae}",
      ".pzc-casse.fitto .pzc-cassa{padding:1px 6px 1px 2px}.pzc-casse.fitto .fac{width:22px;height:22px}.pzc-casse.fitto .pzc-comb .c{font-size:13px;min-width:15px}",
      "@media (prefers-reduced-motion:reduce){.pzc-carr,.pzc-corsie{transition:none}.pzc-cifra.giro,.pzc-cassa{animation:none}}"
    ].join("\n");
    document.head.appendChild(s);
  }
})();
