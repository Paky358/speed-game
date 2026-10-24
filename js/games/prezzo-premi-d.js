/* =========================================================
   «IL PREZZO È GIUSTO!» — giochi a premi (file d, 23 ott 2026): «🎲 Il Gioco dei Dadi» e «🎯 Il Mirino», tutti insieme
   ognuno dal suo telefono. L'interfaccia dei giochi a premi è spiegata in js/games/prezzo-premi-piu.js (modello: il file c).
   I punti sono scelti con la simulazione (.agents/skills/prova-nel-browser/prezzo/simulazione/premi-d-sim.js, 20.000 partite
   per giocatore; regole dell'equilibrio in AGENTS.md: in media circa 300 a testa, chi conosce i prezzi fa di più, chi tira
   a caso sta sotto). Nella simulazione due modi di giocare: «ingenuo»/«mira» (usa la sua idea del prezzo così com'è) e
   «ragiona» (sa di non essere sicuro e si regola); bravo sbaglia i prezzi del 15%, medio del 30%, scarso del 45%.

   🎲 IL GIOCO DEI DADI (dalla versione italiana; il Dice Game americano): il prezzo di una cosa, un intero di 4 cifre
      (1.000-9.999 €). Per ogni cifra si tira un dado, uguale per tutti; ognuno in segreto dice per ogni cifra se quella vera è
      ⬆️ più alta, = uguale o ⬇️ più bassa del dado. 25 secondi; vale quello che si vede allo scadere.
      VARIANTE (decisa il 23 ott): nei dati non c'è NESSUN prezzo di 4 cifre tutte tra 1 e 6, quindi le cifre vere vanno da 0
      a 9 coi dadi normali (1-6): col 6 si può dire «più alta» (7, 8, 9) e con l'1 «più bassa» (0). L'unica scelta impossibile
      è ⬇️ sulla PRIMA cifra col dado a 1 (un prezzo non comincia con lo 0): quella è spenta. Senza prezzi di 4 cifre liberi:
      3 o 5 cifre, stesse regole.
      Punti: prima cifra giusta 200, ognuna delle altre 60, tutte giuste +150 (massimo 530). La prima cifra vale di più perché
      è l'unica dove conta davvero sapere i prezzi: la seconda serve saperla al 4% (va bene per tutti circa una volta su due),
      la terza e la quarta le decidono le abitudini dei prezzi (finiscono quasi sempre con 0 o 9).
      Simulazione (ingenuo / ragiona): media 290 / 308 · bravo 309 / 325 · medio 288 / 306 · scarso 274 / 294 · a caso 135;
      tutte e 4 giuste: bravo 16-20%, scarso 12-16%, a caso 1,5%. Il bravo fa poco più dello scarso (la fortuna dei dadi
      conta tanto, come in Più o meno e nel Plinko), ma chi tocca a caso prende meno della metà.
      Rivelazione: le cifre vere girano una alla volta sotto i dadi, col segno giusto, e le scelte di tutti diventano verdi o rosse.
   🎯 IL MIRINO (dalla versione americana, il Range Game): una cosa da 30 a 30.000 €, una scala da A a B (numeri tondi) col
      prezzo da qualche parte tra il 10% e il 90%. Una finestrella larga il 10% della scala sale dal basso in 16,5 secondi,
      uguale per tutti (la posizione si calcola dal tempo che manca alla fine, che arriva dall'host); ognuno tocca «🎯 Stop!»
      una volta sola e la sua finestrella si ferma lì; chi non tocca resta in cima. 20 secondi in tutto.
      La scala: dove sta il prezzo (f, tra 0,1 e 0,9) e dove comincia la scala (A = t × larghezza, t tra 0,15 e 0,5) si
      scelgono a caso e NON dipendono l'uno dall'altro, così dalla scala non si capisce dove sta il prezzo (con una larghezza
      fissa, per esempio 1,6 volte il prezzo, la larghezza diceva il prezzo e il prezzo stava sempre in basso). La larghezza
      è un numero tondo vicino a prezzo / (t + f): di solito tra 0,9 e 2,2 volte il prezzo.
      Punti: prezzo dentro la finestrella 600; fuori di mezza finestrella (5% della scala) 350; di una finestrella 200; di due 75;
      più lontano 0. Simulazione (mira / ragiona): media 255 / 303 · bravo 365 / 384 · medio 237 / 290 · scarso 181 / 247 ·
      chi ferma a caso 142 · chi ferma sempre a metà scala 182; dentro: bravo 37-40%, medio 20-27%, a caso 12%.
      Rivelazione: le finestrelle di tutti sulla scala, poi la freccia del prezzo vero sale dal basso e si ferma al suo posto.
   Stile: classi col prefisso pzd- (più quelle pz- di prezzo-scena.js).
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
  function intero(p) { return +p.prezzo > 0 && Math.abs(p.prezzo - Math.round(p.prezzo)) < 1e-9; }
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
  // i messaggi provvisori partono un secondo dopo l'ultimo tocco (o subito negli ultimi 4 secondi)
  function invioCalmo(A, manda) {
    var to = null;
    return {
      dopo: function () { clearTimeout(to); var resta = (A.fine || 0) - Date.now(); if (resta > 0 && resta < 4000) manda(false); else to = setTimeout(function () { manda(false); }, 1000); },
      ferma: function () { clearTimeout(to); to = null; }
    };
  }
  function cambiaFaccia(A, riga, id, faccia) { var f = riga.querySelector(".fac"); if (f) f.parentNode.replaceChild(A.fac(id, faccia), f); }

  // =====================================================================
  // 🎲 IL GIOCO DEI DADI
  // =====================================================================
  var DD = { sec: 25, prima: 200, altre: 60, tutte: 150 };
  var TD = { prima: 1100, cifra: 1150, esito: 1300, fine: 2300 };
  var SCELTE = ["su", "ug", "giu"], SIMB = { su: "⬆️", ug: "=", giu: "⬇️" }, PAROLA = { su: "più alta", ug: "uguale", giu: "più bassa" };
  // i puntini del dado (caselle 1-9 di una griglia 3×3, a righe)
  var PUNTINI = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  function dado(el, v, cls) { var d = el("span", { class: "pzd-dado" + (cls ? " " + cls : "") }); for (var i = 1; i <= 9; i++) d.appendChild(el("i")); faccia(d, v); return d; }
  function faccia(d, v) { var on = PUNTINI[v] || []; [].forEach.call(d.children, function (c, i) { var si = on.indexOf(i + 1) >= 0; if (c.classList.contains("on") !== si) c.classList.toggle("on", si); }); d.setAttribute("aria-label", "dado " + v); }
  function giusta(c, d) { return c > d ? "su" : c === d ? "ug" : "giu"; }
  // l'unica scelta che non si può fare: ⬇️ sulla prima cifra col dado a 1 (un prezzo non comincia con lo 0)
  function possibile(i, d, x) { return !(i === 0 && d === 1 && x === "giu"); }
  function adattoD(p) { return intero(p) && p.prezzo >= 1000 && p.prezzo <= 9999; }
  // le scelte mandate da un telefono: una per cifra ("su", "ug", "giu" o null = non ancora scelta)
  function scelteDadi(s, dd) {
    if (!Array.isArray(s) || s.length !== dd.length) return null;
    return s.map(function (x, i) { return SCELTE.indexOf(x) >= 0 && possibile(i, dd[i], x) ? x : null; });
  }
  function esitoDadi(s, vero, dd) {
    var ok = dd.map(function (d, i) { return !!(s && s[i] && s[i] === giusta(+vero[i], d)); }), n = 0, pt = 0;
    ok.forEach(function (x, i) { if (x) { n++; pt += i === 0 ? DD.prima : DD.altre; } });
    if (n === dd.length) pt += DD.tutte;
    return { ok: ok, n: n, pt: s ? pt : 0 };
  }
  function durataDadi(riv) { return TD.prima + (((riv && riv.dadi) || []).length || 4) * TD.cifra + TD.esito + TD.fine + 400; }
  // la fila dei dadi, col punto delle migliaia: sotto ogni dado la cifra vera («?» finché non si scopre)
  function rigaDadi(el, dd, riv) {
    var fila = el("div", { class: "pzd-fila" + (riv ? " riv" : "") }), dadi = [], cifre = [], segni = [], n = dd.length;
    dd.forEach(function (v, i) {
      if (i && (n - i) % 3 === 0) fila.appendChild(el("span", { class: "pzd-fp", text: "." }));
      var d = dado(el, v), cf = el("span", { class: "pzd-cf", text: "?" }), sg = riv ? el("span", { class: "pzd-sg", text: "·" }) : null;
      fila.appendChild(el("div", { class: "pzd-dc" }, [ d, sg, cf ]));
      dadi.push(d); cifre.push(cf); segni.push(sg);
    });
    fila.appendChild(el("span", { class: "pzd-fp eu", text: "€" }));
    return { el: fila, dadi: dadi, cifre: cifre, segni: segni };
  }
  // i dadi rotolano una volta, quando compaiono (poi restano fermi: niente lampeggio)
  function rotola(A, nodi, vals) {
    nodi.forEach(function (d) { d.classList.add("rolla"); });
    var k = 0;
    (function giro() {
      if (!A.vivo() || !nodi.length || !nodi[0].isConnected) return;
      if (++k < 8) { nodi.forEach(function (d) { faccia(d, 1 + Math.floor(Math.random() * 6)); }); if (k % 2) A.FX.clic(0.7); setTimeout(giro, 85); return; }
      nodi.forEach(function (d, i) { faccia(d, vals[i]); d.classList.remove("rolla"); });
      A.FX.toc(700);
    })();
  }

  PREMI.dadi = {
    nome: "Il Gioco dei Dadi", icona: "🎲", ordine: 8,
    regola: "Un dado per ogni cifra del prezzo: la cifra vera è più alta, uguale o più bassa?",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var prod = P.pesca(adattoD, 1)[0] || P.pesca(function (p) { return intero(p) && p.prezzo >= 100 && p.prezzo < 100000; }, 1)[0];
      if (!prod) prod = { id: "x", e: "🛵", nome: "Uno scooter", desc: "", dove: "", cat: "motori", prezzo: 2590 };
      var vero = String(Math.round(prod.prezzo)), dadi = vero.split("").map(function () { return 1 + Math.floor(P.rnd() * 6); });
      return { prod: prod, vero: vero, dadi: dadi, s: {}, f: {}, ms: {} };
    },
    tempo: function () { return DD.sec; },
    pubblico: function (st) { return { prod: pubProd(st.prod), dadi: st.dadi.slice(), fatti: Object.keys(st.f) }; },
    mossa: function (st, id, m, P) {
      var s = scelteDadi(m.s, st.dadi); if (!s || st.f[id]) return;
      st.s[id] = s; st.ms[id] = Math.max(0, Math.round(+m.ms || 0));
      if (m.fine) { st.f[id] = 1; P.fatto(id); }
    },
    privatoDi: function (st, id) { return st.s[id] ? { s: st.s[id], f: !!st.f[id] } : null; },
    fine: function (st, P) {
      var punti = {}, g = [], carrello = {};
      P.ids.forEach(function (id) {
        var s = st.s[id] || null, e = esitoDadi(s, st.vero, st.dadi);
        punti[id] = e.pt;
        g.push({ id: id, s: s, ok: e.ok, n: e.n, pt: e.pt, ms: st.ms[id] || 0 });
        if (s && e.n === st.dadi.length) carrello[id] = [st.prod];   // chi le indovina tutte se lo porta a casa
      });
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, vero: st.vero, dadi: st.dadi, g: g } };
    },
    durata: function (riv) { return durataDadi(riv); },
    // il Bot pensa a un prezzo (arrotondato a 10, come quelli veri) e lo confronta coi dadi
    bot: function (st, bot, P) {
      var n = st.vero.length, lo = Math.pow(10, n - 1), hi = Math.pow(10, n) - 1;
      var e = Math.max(lo, Math.min(hi, Math.round(stima(P, +st.vero, bot.livello) / 10) * 10)), c = String(e).split("").map(Number);
      var s = st.dadi.map(function (d, i) { var x = giusta(c[i], d); return possibile(i, d, x) ? x : "ug"; });
      var ms = (bot.livello === "difficile" ? 6000 : bot.livello === "medio" ? 9000 : 12000) + P.rnd() * 8000;
      return [ { ms: Math.round(ms * 0.5), m: { s: s.map(function (x, i) { return i < 2 ? x : null; }) } }, { ms: Math.round(Math.min(DD.sec * 1000 - 1500, ms)), m: { s: s, fine: 1 } } ];
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, dd = pub.dadi || [], ch = el("div"), fila = rigaDadi(el, dd, false);
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🎲 Il Gioco dei Dadi" }));
      A.sch.appendChild(A.scheda(pub.prod || {}, { cls: "media" }));
      A.sch.appendChild(fila.el);
      A.sch.appendChild(el("div", { class: "pz-sotto pzd-sotto pzd-sd", text: "Ogni cifra del prezzo: ⬆️ più alta, = uguale o ⬇️ più bassa del suo dado?" }));
      A.sch.appendChild(ch);
      chips(A, ch, pub.fatti || []);
      rotola(A, fila.dadi, dd);
      return { aggiorna: function (p) { A.pub = p; aggChips(A, ch, (p && p.fatti) || []); } };
    },
    pannello: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, dd = pub.dadi || [], n = dd.length, s = dd.map(function () { return null; }), chiuso = false, mosso = false;
      var tav = el("div", { class: "pzd-tav" }), col = [];
      dd.forEach(function (d, i) {
        if (i && (n - i) % 3 === 0) tav.appendChild(el("span", { class: "pzd-tp", text: "." }));
        var c = el("div", { class: "pzd-col" }), bt = {};
        c.appendChild(dado(el, d, "pic"));
        SCELTE.forEach(function (x) {
          var b = el("button", { class: "pzd-sc " + x, type: "button", "aria-label": PAROLA[x] }, [ el("b", { text: SIMB[x] }), el("small", { text: PAROLA[x] }) ]);
          if (!possibile(i, d, x)) { b.disabled = true; b.classList.add("no"); }
          premi(b, function () { scegli(i, x); });
          bt[x] = b; c.appendChild(b);
        });
        col.push(bt); tav.appendChild(c);
      });
      var ok = el("button", { class: "pz-ok pzd-fatto", type: "button", text: "✅ Fatto!" });
      premi(ok, function () { if (chiuso || s.some(function (x) { return !x; })) return; A.vibra(12); manda(true); blocca("✅ Fatto!"); });
      A.pan.appendChild(el("div", { class: "pz-nota forte pzd-nota", text: "La cifra vera è più alta, uguale o più bassa del dado?" }));
      A.pan.appendChild(tav); A.pan.appendChild(ok);
      var calmo = invioCalmo(A, manda);
      function disegna() {
        col.forEach(function (bt, i) { SCELTE.forEach(function (x) { var si = s[i] === x; if (bt[x].classList.contains("sel") !== si) bt[x].classList.toggle("sel", si); }); });
        if (chiuso) return;
        var manca = s.filter(function (x) { return !x; }).length, tx = manca ? (manca === 1 ? "Manca una cifra" : "Mancano " + manca + " cifre") : "✅ Fatto!";
        ok.disabled = manca > 0; if (ok.textContent !== tx) ok.textContent = tx;
      }
      function scegli(i, x) {
        if (chiuso || !possibile(i, dd[i], x) || s[i] === x) return;
        s[i] = x; mosso = true; disegna();
        A.vibra(8); A.FX.toc(x === "su" ? 880 : x === "ug" ? 700 : 520);
        calmo.dopo();
      }
      function manda(fine) {
        calmo.ferma();
        if (!fine && !mosso) return;
        A.invia(fine ? { s: s.slice(), fine: 1 } : { s: s.slice() });
      }
      function blocca(tx) { chiuso = true; ok.disabled = true; ok.textContent = tx; tav.classList.add("chiuso"); disegna(); }
      disegna();
      return {
        privato: function (m) {
          if (!m || chiuso) return;
          var v = scelteDadi(m.s, dd); if (!v) return;
          s = v; mosso = true; disegna();
          if (m.f) blocca("✅ Fatto!");
        },
        // il tempo è finito: valgono le scelte che si vedono (se hai toccato qualcosa)
        tempo: function () { if (chiuso) return; if (mosso) manda(false); blocca("⏰ Tempo scaduto"); }
      };
    },
    rivela: async function (A) {
      stile();
      var el = A.el, riv = A.riv || {}, prod = riv.prod || {}, vero = String(riv.vero || ""), dd = riv.dadi || [], g = riv.g || [];
      var fila = rigaDadi(el, dd, true), righe = el("div", { class: "pzd-righe" + (g.length > 5 ? " fitto" : "") }), banner = el("div", { class: "pz-sotto pzd-bn", text: "Le cifre vere…" });
      A.sch.classList.add("pzb-fitto");
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🎲 Il Gioco dei Dadi" }));
      A.sch.appendChild(el("div", { class: "pz-miniprod" }, [ Z().figura(el, prod, "e"), el("span", { class: "n", text: prod.nome || "" }) ]));
      A.sch.appendChild(fila.el); A.sch.appendChild(righe); A.sch.appendChild(banner);
      var rr = g.map(function (x) {
        var chs = dd.map(function (d, i) { var c = x.s && x.s[i]; return el("span", { class: "pzd-ch " + (c || "vuota"), text: c ? SIMB[c] : "–" }); });
        var r = el("div", { class: "pzd-rg" }, [ A.fac(x.id), el("span", { class: "nm", text: A.nome(x.id) }), el("span", { class: "pzd-chs" }, chs) ]);
        righe.appendChild(r);
        return { x: x, r: r, chs: chs };
      });
      A.ST.FX.rullo(0.9);
      await A.dorme(TD.prima); if (!A.vivo()) return;
      // una cifra alla volta: si gira la cifra vera, compare il segno giusto, le scelte di tutti diventano verdi o rosse
      for (var i = 0; i < dd.length; i++) {
        var sg = giusta(+vero[i], dd[i]);
        fila.cifre[i].textContent = vero[i] || "?"; fila.cifre[i].classList.add("su");
        fila.segni[i].textContent = SIMB[sg]; fila.segni[i].classList.add("su");
        rr.forEach(function (o) { o.chs[i].classList.add(o.x.ok && o.x.ok[i] ? "si" : "no"); });
        A.FX.toc(560 + i * 90);
        await A.dorme(TD.cifra); if (!A.vivo()) return;
      }
      var tutte = [];
      rr.forEach(function (o) {
        var x = o.x, pt = (A.punti || {})[x.id] != null ? A.punti[x.id] : x.pt, piene = !!x.s && x.n === dd.length;
        if (pt) o.r.appendChild(el("span", { class: "pt", text: "+" + A.fmtN(pt) }));
        if (piene) { tutte.push(x); o.r.classList.add("tutte"); }
        cambiaFaccia(A, o.r, x.id, piene ? "evviva" : pt ? "esulta" : "triste");
      });
      A.FX.toc(880);
      if (tutte.length) {
        A.FX.din(); A.ST.coriandoli(); A.ST.pubblico(A.S, "ovazione");
        if (tutte.some(function (x) { return mioTelefono(A, x.id); })) A.vibra([30, 40, 70]);
        banner.className = "pz-banner oro pzd-bn";
        banner.textContent = tutte.length === 1 ? (eTu(A, tutte[0].id) ? "🎲 Le hai indovinate tutte!" : "🎲 Tutte giuste per " + A.nome(tutte[0].id) + "!") : "🎲 Tutte giuste per " + elenco(A, tutte.map(function (x) { return x.id; })) + "!";
      } else {
        // i più bravi: chi ha preso più cifre (a pari cifre, più punti: la prima vale di più); a pari merito tutti
        var best = g.filter(function (x) { return x.s; }).sort(function (a, b) { return b.n - a.n || b.pt - a.pt; })[0];
        var pari = best ? g.filter(function (x) { return x.s && x.n === best.n && x.pt === best.pt; }) : [];
        banner.className = best && best.n ? "pz-banner pzd-bn" : "pz-banner no pzd-bn";
        banner.textContent = !(best && best.n) ? "🎲 Nessuna cifra giusta!" : pari.length > 1 ? "🎲 I più bravi: " + elenco(A, pari.map(function (x) { return x.id; })) + " (" + best.n + " su " + dd.length + ")"
          : "🎲 Il più bravo: " + (eTu(A, best.id) ? "tu" : A.nome(best.id)) + " (" + best.n + " su " + dd.length + ")";
        A.ST.pubblico(A.S, best && best.n ? "applauso" : "ohh"); if (!(best && best.n)) A.FX.trombone();
      }
      await A.dorme(TD.esito + TD.fine);
    }
  };

  // =====================================================================
  // 🎯 IL MIRINO
  // =====================================================================
  var MI = { sec: 20, salita: 16500, coda: 1500, largo: 0.1, passo: 0.005, fMin: 0.1, fMax: 0.9, tMin: 0.15, tMax: 0.5, min: 30, max: 30000,
    dentro: 600, fuori: [[0.05, 350], [0.1, 200], [0.2, 75]] };
  var TM = { prima: 900, fin: 170, sale: 2400, esito: 1400, fine: 2300 };
  var CIMA = Math.round((1 - MI.largo) * 1000) / 1000;
  // online e col Bot il tempo dell'host è sec × 1000 + 800 ms (prezzo.js, giocaPremio): la salita comincia PRIMA ms dopo
  var PRIMA = MI.sec * 1000 + 800 - MI.coda - MI.salita;
  // il numero tondo più vicino (1; 1,2; 1,5; 2; 2,5; 3; 4; 5; 6; 8 per una potenza di 10)
  var TONDI = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  function tondo(x) {
    var k = Math.pow(10, Math.floor(Math.log(x) / Math.LN10 + 1e-9)), m = x / k, best = 1;
    TONDI.forEach(function (v) { if (Math.abs(Math.log(m / v)) < Math.abs(Math.log(m / best))) best = v; });
    return best * k;
  }
  // la scala da A a B: larghezza tonda, A multiplo di u (un decimo della potenza di 10 della larghezza) e mai 0; dove sta il
  // prezzo (f) e dove comincia la scala (t = A / larghezza) si scelgono a caso, l'uno senza guardare l'altro
  function scala(prezzo, rnd) {
    for (var k = 0; k < 80; k++) {
      var f = MI.fMin + rnd() * (MI.fMax - MI.fMin), t = MI.tMin * Math.pow(MI.tMax / MI.tMin, rnd()), sp = tondo(prezzo / (t + f));
      var u = Math.pow(10, Math.floor(Math.log(sp) / Math.LN10 + 1e-9) - 1), a = Math.round(t * sp / u) * u, ff = (prezzo - a) / sp;
      if (a >= u - 1e-9 && ff >= MI.fMin - 1e-9 && ff <= MI.fMax + 1e-9) return { a: tondo2(a), b: tondo2(a + sp) };
    }
    var sp2 = tondo(prezzo * 1.25), u2 = Math.pow(10, Math.floor(Math.log(sp2) / Math.LN10 + 1e-9) - 1), a2 = Math.max(u2, Math.round((prezzo - sp2 / 2) / u2) * u2);
    return { a: tondo2(a2), b: tondo2(a2 + sp2) };
  }
  // dove si ferma la finestrella (il suo bordo basso, da 0 a 0,9 della scala), a passi di mezzo centesimo della scala
  function fermaP(p) { return Math.max(0, Math.min(CIMA, Math.round(Math.round((+p || 0) / MI.passo) * MI.passo * 1000) / 1000)); }
  function finestra(a, b, p) { var sp = b - a; return [tondo2(a + p * sp), tondo2(a + (p + MI.largo) * sp)]; }
  // quanto il prezzo sta fuori dalla finestrella, in parti della scala (0 = dentro)
  function distanzaM(prezzo, a, b, p) { var w = finestra(a, b, p), sp = b - a; return prezzo >= w[0] - 1e-9 && prezzo <= w[1] + 1e-9 ? 0 : Math.min(Math.abs(prezzo - w[0]), Math.abs(prezzo - w[1])) / sp; }
  function puntiM(d) { if (d === 0) return MI.dentro; for (var i = 0; i < MI.fuori.length; i++) if (d <= MI.fuori[i][0] + 1e-9) return MI.fuori[i][1]; return 0; }
  function durataMirino(riv) { return TM.prima + (((riv && riv.g) || []).length) * TM.fin + TM.sale + TM.esito + TM.fine + 400; }
  // le scritte della scala: in cima B, a metà, in fondo A
  function etichette(A, a, b) { var el = A.el; return el("div", { class: "pzd-lab" }, [ el("span", { text: A.fmtE(b) }), el("span", { text: A.fmtE(tondo2(a + (b - a) / 2)) }), el("span", { text: A.fmtE(a) }) ]); }

  PREMI.mirino = {
    nome: "Il Mirino", icona: "🎯", ordine: 9,
    regola: "La finestrella sale sulla scala dei prezzi: fermala quando c'è dentro il prezzo giusto!",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var prod = P.pesca(function (x) { return x.prezzo >= MI.min && x.prezzo <= MI.max; }, 1)[0] || P.pesca(null, 1)[0];
      if (!prod) prod = { id: "x", e: "📺", nome: "Un televisore", desc: "", dove: "", cat: "tech", prezzo: 799 };
      var sc = scala(+prod.prezzo, P.rnd);
      return { prod: prod, a: sc.a, b: sc.b, p: {}, f: {}, ms: {} };
    },
    // (tempo() la chiama prezzo.js proprio quando si comincia: lì si segna l'ora dell'host, per chi ricarica la pagina)
    tempo: function (st) { st.t0 = Date.now(); return MI.sec; },
    // ms = da quanto si gioca, sul telefono dell'host: serve a chi ricarica la pagina, perché la prima foto che riceve è
    // quella vecchia rimasta nella stanza e con la sua ora di fine la finestrella starebbe più in basso del vero
    pubblico: function (st) { return { prod: pubProd(st.prod), a: st.a, b: st.b, fatti: Object.keys(st.f), ms: st.t0 ? Math.max(0, Date.now() - st.t0) : 0 }; },
    // una mossa sola: dove si è fermata la finestrella. («ora»: un telefono ha appena aperto il pannello e chiede l'ora: non
    // si fa niente, ma dopo ogni mossa prezzo.js manda a tutti una foto nuova, che gli dice da quanto si gioca)
    mossa: function (st, id, m, P) {
      if (m.ora) return;
      var p = +m.p; if (st.f[id] || !(p >= -1e-9 && p <= CIMA + 1e-9)) return;
      st.p[id] = fermaP(p); st.ms[id] = Math.max(0, Math.round(+m.ms || 0));
      st.f[id] = 1; P.fatto(id);
    },
    privatoDi: function (st, id) { return st.p[id] != null ? { p: st.p[id] } : null; },
    fine: function (st, P) {
      var punti = {}, g = [], carrello = {}, prezzo = +st.prod.prezzo;
      P.ids.forEach(function (id) {
        var fermo = st.p[id] != null, p = fermo ? st.p[id] : CIMA, d = distanzaM(prezzo, st.a, st.b, p), pt = puntiM(d);
        punti[id] = pt;
        g.push({ id: id, p: p, fermo: fermo, d: d, pt: pt, ms: st.ms[id] || 0 });
        if (d === 0) carrello[id] = [st.prod];   // chi ha il prezzo dentro la finestrella se lo porta a casa
      });
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, a: st.a, b: st.b, g: g } };
    },
    durata: function (riv) { return durataMirino(riv); },
    // il Bot mette il prezzo che crede a metà della sua finestrella e tocca quando ci arriva (col Bot la salita comincia
    // 2,8 s dopo l'inizio: il tempo dell'host è di 20 s + 0,8)
    bot: function (st, bot, P) {
      var sp = st.b - st.a, e = stima(P, +st.prod.prezzo, bot.livello), q = fermaP((e - st.a) / sp - MI.largo / 2 + gauss(P.rnd) * 0.01);
      var ms = PRIMA + q / CIMA * MI.salita + 150 + P.rnd() * 300;
      return [ { ms: Math.round(Math.min(MI.sec * 1000 - 300, ms)), m: { p: q } } ];
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, ch = el("div");
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🎯 Il Mirino" }));
      A.sch.appendChild(A.scheda(pub.prod || {}, { cls: "media" }));
      A.sch.appendChild(el("div", { class: "pzd-tra" }, [ el("span", { text: "📏 Il prezzo è tra" }), el("b", { text: A.fmtE(pub.a || 0) + " e " + A.fmtE(pub.b || 0) }) ]));
      A.sch.appendChild(el("div", { class: "pz-sotto pzd-sotto", text: "🎯 La finestrella sale: fermala quando c'è dentro il prezzo!" }));
      A.sch.appendChild(ch);
      chips(A, ch, pub.fatti || []);
      return { aggiorna: function (p) { A.pub = p; aggChips(A, ch, (p && p.fatti) || []); } };
    },
    pannello: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, a = +pub.a || 0, b = +pub.b || 1, fermo = null, finito = false, raf = 0, txR = "", txN = "";
      // la salita finisce un secondo e mezzo prima della fine del tempo (così il tocco in cima arriva in tempo)
      var inizio = (A.fine || Date.now() + MI.sec * 1000) - MI.coda - MI.salita;
      // online: ogni foto nuova dice da quanto si gioca; si tiene la partenza più presto (una foto vecchia la sposta in là).
      // Chi ha appena aperto il pannello (anche dopo una ricarica, quando la prima foto è quella vecchia rimasta nella stanza)
      // chiede l'ora all'host: la foto nuova che arriva subito dopo rimette la finestrella alla stessa altezza degli altri
      function risincronizza(p) { if (A.locale || !p || !(+p.ms >= 0) || !p.ms) return; var x = Date.now() - p.ms + PRIMA; if (x < inizio - 30) inizio = x; }
      risincronizza(pub);
      if (!A.locale) A.invia({ ora: 1 });
      var win = el("div", { class: "pzd-win" }), mov = el("div", { class: "pzd-mov" }, [ win ]), trk = el("div", { class: "pzd-trk" }, [ mov ]);
      var rng = el("b", { class: "pzd-rng" }), nota = el("span", { class: "pzd-nt" });
      var stop = el("button", { class: "pz-ok pzd-stop", type: "button", text: "🎯 Stop!" });
      premi(stop, function () { if (fermo != null || finito) return; ferma(pos(Date.now()), true); });
      A.pan.appendChild(el("div", { class: "pzd-mp" }, [
        el("div", { class: "pzd-scala" }, [ etichette(A, a, b), trk ]),
        el("div", { class: "pzd-lato" }, [ el("span", { class: "pzd-tu", text: "La tua finestrella" }), rng, nota, stop ])
      ]));
      function pos(t) { return CIMA * Math.max(0, Math.min(1, (t - inizio) / MI.salita)); }
      function scrivi(n, tx, k) { if (k === "r") { if (tx !== txR) { txR = tx; n.textContent = tx; } } else if (tx !== txN) { txN = tx; n.textContent = tx; } }
      function metti(p) {
        mov.style.transform = "translateY(" + (-p * 100).toFixed(2) + "%)";
        var w = finestra(a, b, fermaP(p)); scrivi(rng, A.fmtE(w[0]) + " – " + A.fmtE(w[1]), "r");
      }
      // la finestrella sale da sola, calcolata dall'ora (solo il suo transform e la scritta che cambia)
      function giro() {
        raf = 0; if (fermo != null || finito || !trk.isConnected || !A.vivo()) return;   // (finito il gioco o usciti: si ferma)
        var t = Date.now(), p = pos(t); metti(p);
        scrivi(nota, t < inizio ? "⏳ Pronti… sta per salire" : p >= CIMA - 1e-9 ? "⬆️ È arrivata in cima" : "⬆️ Sale… tocca Stop!", "n");
        raf = requestAnimationFrame(giro);
      }
      function ferma(p, mio) {
        fermo = fermaP(p); if (raf) cancelAnimationFrame(raf); raf = 0;
        metti(fermo); win.classList.add("ferma"); stop.disabled = true; stop.textContent = "🎯 Ferma!"; scrivi(nota, "🎯 Si ferma qui", "n");
        if (mio) { A.vibra(14); A.FX.toc(990); A.invia({ p: fermo, fine: 1 }); }
      }
      metti(pos(Date.now())); giro();
      return {
        aggiorna: function (p) { if (fermo == null && !finito) risincronizza(p); },
        privato: function (m) { if (m && m.p != null && fermo == null && !finito) ferma(+m.p, false); },
        // il tempo è finito senza «Stop!»: la finestrella resta in cima
        tempo: function () { if (fermo != null || finito) return; finito = true; if (raf) cancelAnimationFrame(raf); raf = 0; metti(CIMA); stop.disabled = true; stop.textContent = "⏰ Tempo scaduto"; scrivi(nota, "Resta in cima", "n"); }
      };
    },
    rivela: async function (A) {
      stile();
      var el = A.el, riv = A.riv || {}, prod = riv.prod || {}, a = +riv.a || 0, b = +riv.b || 1, sp = (b - a) || 1, prezzo = +prod.prezzo || 0, g = riv.g || [];
      var fr = Math.max(0, Math.min(1, (prezzo - a) / sp));
      var cols = el("div", { class: "pzd-cols" }), facce = el("div", { class: "pzd-rf" }), tag = A.Z.cartellino(el, "?", "pzd-tag");
      var frec = el("div", { class: "pzd-frec" }, [ el("i", { class: "ln" }), tag ]);
      var banner = el("div", { class: "pz-sotto pzd-bn", text: "Le finestrelle di tutti…" });
      A.sch.classList.add("pzb-fitto");
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🎯 Il Mirino" }));
      A.sch.appendChild(el("div", { class: "pz-miniprod" }, [ Z().figura(el, prod, "e"), el("span", { class: "n", text: prod.nome || "" }) ]));
      A.sch.appendChild(el("div", { class: "pzd-rv" + (g.length > 5 ? " fitto" : "") }, [ etichette(A, a, b), el("div", { class: "pzd-rtrk" }, [ cols, frec ]) ]));
      A.sch.appendChild(el("div", { class: "pzd-rfw" + (g.length > 5 ? " fitto" : "") }, [ el("span"), facce ]));
      A.sch.appendChild(banner);
      var cc = g.map(function (x, j) {
        var w = el("div", { class: "pzd-rw" }), c = el("div", { class: "pzd-c" }, [ w ]), fc = el("div", { class: "pzd-fc" }, [ A.fac(x.id), el("span", { class: "nm", text: A.nome(x.id) }), el("span", { class: "pt zero", text: "·" }) ]);
        w.style.bottom = (x.p * 100).toFixed(2) + "%"; w.style.setProperty("--col", COLORI[j % COLORI.length]); fc.style.setProperty("--col", COLORI[j % COLORI.length]);
        cols.appendChild(c); facce.appendChild(fc);
        return { x: x, w: w, fc: fc };
      });
      A.ST.FX.rullo(0.9);
      await A.dorme(TM.prima); if (!A.vivo()) return;
      for (var i = 0; i < cc.length; i++) { cc[i].w.classList.add("su"); A.FX.toc(520 + i * 60); await A.dorme(TM.fin); if (!A.vivo()) return; }
      // la freccia del prezzo vero sale dal basso e si ferma al suo posto
      banner.textContent = "E il prezzo è…";
      A.ST.FX.rullo(1.6);
      frec.classList.add("va"); frec.style.transform = "translateY(" + (-fr * 100).toFixed(2) + "%)";
      await A.dorme(TM.sale); if (!A.vivo()) return;
      tag.textContent = A.fmtE(prezzo); tag.classList.add("su"); A.FX.toc(990);
      var dentro = [];
      cc.forEach(function (o) {
        var x = o.x, pt = (A.punti || {})[x.id] != null ? A.punti[x.id] : x.pt, ptn = o.fc.querySelector(".pt");
        o.w.classList.add(x.d === 0 ? "dentro" : pt ? "vicino" : "lontano");
        ptn.textContent = pt ? "+" + A.fmtN(pt) : "0"; ptn.className = "pt" + (pt ? "" : " zero") + (x.d === 0 ? " oro" : "");
        if (x.d === 0) dentro.push(x);
        cambiaFaccia(A, o.fc, x.id, x.d === 0 ? "evviva" : pt ? "esulta" : "triste");
      });
      if (dentro.length) {
        A.FX.din(); A.ST.coriandoli(); A.ST.pubblico(A.S, "ovazione");
        if (dentro.some(function (x) { return mioTelefono(A, x.id); })) A.vibra([30, 40, 70]);
        banner.className = "pz-banner oro pzd-bn";
        banner.textContent = dentro.length === 1 ? (eTu(A, dentro[0].id) ? "🎯 Preso! Il prezzo è nella tua finestrella" : "🎯 Preso da " + A.nome(dentro[0].id) + "!") : "🎯 Preso da " + elenco(A, dentro.map(function (x) { return x.id; })) + "!";
      } else {
        var vic = g.slice().sort(function (x, y) { return x.d - y.d; })[0], vicini = vic ? g.filter(function (x) { return Math.abs(x.d - vic.d) < 1e-9; }) : [];
        banner.className = "pz-banner pzd-bn";
        banner.textContent = !vic ? "😅 Nessuno l'ha preso!" : vicini.length > 1 ? "😅 Nessuno l'ha preso: i più vicini sono " + elenco(A, vicini.map(function (x) { return x.id; }))
          : "😅 Nessuno l'ha preso: " + (eTu(A, vic.id) ? "il più vicino sei tu" : "il più vicino è " + A.nome(vic.id));
        A.ST.pubblico(A.S, vic && vic.pt ? "applauso" : "ohh"); if (!(vic && vic.pt)) A.FX.trombone();
      }
      await A.dorme(TM.esito + TM.fine);
    }
  };

  // ---------------- lo stile (una volta) ----------------
  function stile() {
    if (document.getElementById("sg-pzd-css")) return;
    var s = document.createElement("style"); s.id = "sg-pzd-css";
    s.textContent = [
      ".pz-sch.pzb-fitto{gap:6px}",   // (anche se nessun gioco del file b è ancora partito)
      ".pzd-sotto{font-size:13px;max-width:360px}",
      // i dadi: una griglia 3×3 di puntini
      ".pzd-dado{--dd:clamp(34px,calc(var(--alt,640px) * .058),50px);display:inline-grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);width:var(--dd);height:var(--dd);padding:calc(var(--dd) * .12);box-sizing:border-box;border-radius:24%;background:linear-gradient(145deg,#ffffff,#e2dbff);box-shadow:inset 0 -3px 0 rgba(60,40,140,.25),0 3px 8px rgba(0,0,0,.35);flex:0 0 auto}",
      ".pzd-dado i{display:block;width:72%;height:72%;margin:auto;border-radius:50%}.pzd-dado i.on{background:radial-gradient(circle at 35% 35%,#4a3f8a,#14102e)}",
      ".pzd-dado.rolla{animation:pzdRolla .75s cubic-bezier(.3,1.3,.5,1)}",
      "@keyframes pzdRolla{0%{transform:translateY(-16px) rotate(-220deg) scale(.55)}60%{transform:translateY(3px) rotate(14deg) scale(1.06)}100%{transform:none}}",
      ".pzd-fila{display:flex;align-items:flex-end;justify-content:center;gap:6px}",
      ".pzd-dc{display:flex;flex-direction:column;align-items:center;gap:4px}",
      ".pzd-cf{min-width:calc(var(--dd,40px) * .8);padding:2px 0;text-align:center;font:900 22px/1.1 system-ui,sans-serif;border-radius:8px;background:#05030f;color:#ffd43b;box-shadow:0 0 0 2px #ffd43b55;font-variant-numeric:tabular-nums}",
      ".pzd-dc .pzd-cf{--dd:clamp(34px,calc(var(--alt,640px) * .058),50px)}",
      ".pzd-cf.su{animation:pzdGira .45s ease-out;background:#2a1f66;color:#fff;box-shadow:0 0 0 2px #ffd43b}@keyframes pzdGira{from{transform:rotateX(90deg)}to{transform:none}}",
      ".pzd-sg{min-height:18px;font-size:15px;line-height:18px;font-weight:900;color:#fff;opacity:.25;transition:opacity .25s}.pzd-sg.su{opacity:1}",
      ".pzd-fp{font-size:24px;font-weight:900;color:#ffd43b;padding-bottom:3px;line-height:1}.pzd-fp.eu{color:#fff;font-size:20px;padding-bottom:5px}",
      // il pannello dei Dadi: per ogni cifra il suo dado e i tre tasti
      ".pz-nota.pzd-nota{margin-bottom:2px;font-size:14px;line-height:1.25}",
      ".pzd-tav{display:flex;align-items:stretch;justify-content:center;gap:5px}",
      ".pzd-col{flex:1 1 0;min-width:0;max-width:96px;display:flex;flex-direction:column;align-items:stretch;gap:3px}",
      ".pzd-col .pzd-dado{--dd:clamp(26px,calc(var(--alt,640px) * .045),40px);align-self:center}",
      ".pzd-tp{flex:0 0 auto;font-size:24px;font-weight:900;color:#ffd43b;line-height:1;padding-top:8px}",
      ".pzd-sc{height:clamp(32px,calc(var(--alt,640px) * .052),46px);padding:0;border:0;border-radius:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;font:inherit;color:#1d1b3a;background:linear-gradient(#fff,#ece6ff);box-shadow:inset 0 -3px 0 rgba(90,74,154,.25);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .08s}",
      ".pzd-sc:active{transform:scale(.95)}.pzd-sc b{font-size:16px;line-height:1.05;font-weight:900}.pzd-sc small{font-size:10px;font-weight:800;line-height:1.1;color:#5a4a9a;white-space:nowrap}",
      ".pzd-sc.sel{background:linear-gradient(#ffe98a,#fcc419);box-shadow:0 0 0 3px #fff,inset 0 -3px 0 rgba(0,0,0,.18)}.pzd-sc.sel small{color:#3b2a00}",
      ".pzd-sc.no{opacity:.22;cursor:default}",
      ".pzd-tav.chiuso .pzd-sc{pointer-events:none}.pzd-tav.chiuso .pzd-sc:not(.sel):not(.no){opacity:.45}",
      ".pzd-fatto{margin-top:2px;width:100%;height:clamp(38px,calc(var(--alt,640px) * .062),54px)}",
      // sui telefoni bassi, col pannello su, il maxischermo dei Dadi lascia giù la frase (c'è già nel pannello) e i «?»
      "@media (max-height:700px){.st-vista.pz-con-pan .pzd-sd{display:none}.st-vista.pz-con-pan .pzd-fila:not(.riv) .pzd-cf{display:none}}",
      // la rivelazione dei Dadi
      ".pzd-righe{display:flex;flex-direction:column;gap:5px;width:100%;max-width:440px}",
      ".pzd-rg{position:relative;display:flex;align-items:center;gap:6px;padding:3px 8px 3px 3px;border-radius:12px;background:rgba(255,255,255,.08);animation:pzSu .35s both}",
      ".pzd-rg .fac,.pzd-fc .fac{border-radius:50%;overflow:hidden;background:rgba(255,255,255,.14);flex:0 0 auto}.pzd-rg .fac svg,.pzd-fc .fac svg,.pzd-rg .fac img,.pzd-fc .fac img{width:100%;height:100%;display:block}",
      ".pzd-rg .fac{width:26px;height:26px}.pzd-rg .nm{flex:1;min-width:0;font-size:12px;font-weight:800;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pzd-chs{display:flex;gap:3px;flex:0 0 auto}",
      ".pzd-ch{min-width:25px;height:22px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;border-radius:6px;background:#05030f;color:#fff;transition:background .3s}",
      ".pzd-ch.ug{font-size:19px;font-weight:700}.pzd-ch.si{background:#2f9e44}.pzd-ch.no{background:#c92a2a}.pzd-ch.vuota{color:#8c88b0}",
      ".pzd-rg .pt{flex:0 0 auto;font-weight:900;font-size:12px;color:#04321c;background:#69f0ae;border-radius:99px;padding:1px 7px}",
      ".pzd-rg.tutte{background:rgba(105,240,174,.22);box-shadow:0 0 0 2px #69f0ae}",
      ".pzd-righe.fitto{gap:3px}.pzd-righe.fitto .pzd-rg{padding:1px 6px 1px 2px}.pzd-righe.fitto .fac{width:22px;height:22px}.pzd-righe.fitto .pzd-ch{height:19px;min-width:22px;font-size:13px}",
      ".pzd-bn{margin-top:2px}",
      // il Mirino: «il prezzo è tra…» sul maxischermo
      ".pzd-tra{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:4px 8px;font-weight:800;color:#cdd6ff;font-size:14px}.pzd-tra b{font-size:21px;font-weight:900;color:#69f0ae}",
      // il pannello del Mirino: la scala con la finestrella che sale, e accanto «Stop!»
      ".pzd-mp{display:flex;gap:12px;align-items:stretch}",
      ".pzd-scala{flex:0 0 54%;display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px;height:clamp(150px,calc(var(--alt,640px) * .3),270px)}",
      ".pzd-lab{display:flex;flex-direction:column;justify-content:space-between;font-size:11px;font-weight:900;color:#cdd6ff;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;line-height:1}",
      ".pzd-trk,.pzd-rtrk{position:relative;border-radius:10px;background:repeating-linear-gradient(to top,rgba(255,255,255,0) 0,rgba(255,255,255,0) calc(25% - 1px),rgba(255,255,255,.22) calc(25% - 1px),rgba(255,255,255,.22) 25%),linear-gradient(rgba(255,255,255,.16),rgba(255,255,255,.06));box-shadow:inset 0 0 0 2px rgba(255,255,255,.18)}",
      ".pzd-trk{overflow:hidden}",
      ".pzd-mov{position:absolute;left:0;right:0;bottom:0;height:100%;will-change:transform}",
      ".pzd-win{position:absolute;left:4px;right:4px;bottom:0;height:10%;box-sizing:border-box;border-radius:6px;border:2px solid #ffd43b;background:rgba(255,212,59,.35);box-shadow:0 0 10px rgba(255,212,59,.6)}",
      ".pzd-win:after{content:'';position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:#ffd43b;opacity:.75}",
      ".pzd-win.ferma{border-color:#69f0ae;background:rgba(105,240,174,.42);box-shadow:0 0 14px rgba(105,240,174,.75)}.pzd-win.ferma:after{background:#69f0ae}",
      ".pzd-lato{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:6px;text-align:center}",
      ".pzd-tu{font-size:12px;font-weight:800;color:#cdd6ff}",
      ".pzd-rng{font-size:16px;font-weight:900;color:#ffe066;font-variant-numeric:tabular-nums;line-height:1.2;min-height:2.4em;display:flex;align-items:center;justify-content:center}",
      ".pzd-nt{font-size:12.5px;font-weight:800;color:#cdd6ff;min-height:1.3em}",
      ".pzd-stop{height:clamp(52px,calc(var(--alt,640px) * .09),70px);font-size:22px;border-radius:16px;margin:0;width:100%}",
      // la rivelazione del Mirino: le finestrelle di tutti, la freccia del prezzo, le facce sotto
      ".pzd-rv{display:grid;grid-template-columns:80px minmax(0,1fr);gap:6px;width:100%;max-width:440px;height:clamp(140px,calc(var(--alt,640px) * .32),320px);flex:0 0 auto}",
      ".pzd-rv .pzd-lab{font-size:11.5px}",
      ".pzd-cols{position:absolute;inset:0;display:flex;justify-content:center;gap:3px;padding:0 4px;overflow:hidden;border-radius:10px}",
      ".pzd-c,.pzd-fc{position:relative;flex:0 1 50px;min-width:0}",
      ".pzd-rw{position:absolute;left:0;right:0;height:10%;box-sizing:border-box;border-radius:6px;border:2px solid #fff;background:var(--col,#ffd43b);opacity:0;transform:scaleY(.2);transition:opacity .25s,transform .35s cubic-bezier(.3,1.6,.5,1),box-shadow .3s}",
      ".pzd-rw.su{opacity:.92;transform:none}.pzd-rw.dentro{box-shadow:0 0 0 3px #69f0ae,0 0 16px #69f0ae;opacity:1}.pzd-rw.lontano{opacity:.4}",
      ".pzd-frec{position:absolute;left:0;right:0;bottom:0;height:100%;pointer-events:none;z-index:2}",
      ".pzd-frec.va{transition:transform 2.2s cubic-bezier(.25,.8,.3,1)}",
      ".pzd-frec .ln{position:absolute;left:-6px;right:-4px;bottom:0;height:3px;margin-bottom:-1.5px;background:#ff3ea5;box-shadow:0 0 8px #ff3ea5;border-radius:2px}",
      ".pzd-frec .ln:before{content:'';position:absolute;left:-2px;top:50%;margin-top:-7px;border:7px solid transparent;border-left:10px solid #ff3ea5;border-right:0}",
      ".pzd-frec .pzd-tag{position:absolute;right:100%;bottom:0;margin-right:4px;transform:translateY(50%);max-width:80px;box-sizing:border-box;font-size:12.5px;padding:2px 5px 2px 11px}.pzd-frec .pzd-tag:before{left:4px;width:4px;height:4px;margin-top:-2px}",
      ".pzd-frec .pzd-tag.su{animation:pzPop .35s cubic-bezier(.3,1.6,.5,1) both}",
      ".pzd-rfw{display:grid;grid-template-columns:80px minmax(0,1fr);gap:6px;width:100%;max-width:440px}",
      ".pzd-rf{display:flex;justify-content:center;gap:3px;padding:0 4px}",
      ".pzd-fc{display:flex;flex-direction:column;align-items:center;gap:1px}",
      ".pzd-fc .fac{width:26px;height:26px;box-shadow:0 0 0 2px var(--col,#fff)}",
      ".pzd-fc .nm{max-width:100%;font-size:10px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pzd-fc .pt{font-weight:900;font-size:11px;color:#04321c;background:#69f0ae;border-radius:99px;padding:0 5px;white-space:nowrap}.pzd-fc .pt.zero{background:rgba(255,255,255,.15);color:#cdd6ff}.pzd-fc .pt.oro{background:#ffd43b;color:#3b2a00}",
      ".pzd-rfw.fitto .pzd-fc .fac{width:22px;height:22px}.pzd-rfw.fitto .pzd-fc .nm{font-size:9px}.pzd-rfw.fitto .pzd-fc .pt{font-size:10px;padding:0 3px}",
      "@media (prefers-reduced-motion:reduce){.pzd-dado.rolla,.pzd-cf.su,.pzd-rg{animation:none}.pzd-frec.va,.pzd-rw{transition:none}}"
    ].join("\n");
    document.head.appendChild(s);
  }
})();
