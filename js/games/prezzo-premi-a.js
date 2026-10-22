/* =========================================================
   «IL PREZZO È GIUSTO!» — giochi a premi (file a): «🧗 L'Alpinista» e «📊 Mettili in ordine», tutti insieme.
   L'interfaccia dei giochi a premi è spiegata in testa a js/games/prezzo-premi-piu.js («🔼🔽 Più o meno»)
   e in scratchpad/giochi-nuovi/prezzo/interfaccia-premi.md. Questo file è già caricato da index.html e messo
   nella versione online: qui non serve toccare nient'altro.

   🧗 L'ALPINISTA (Cliff Hangers): 3 prodotti piccoli (sotto i 100 €), uno dopo l'altro, 45 secondi in tutto.
      L'errore di ogni prezzo in percentuale diventa passi: 1 passo ogni 4% (massimo 25 a prodotto; un passo di
      prezzo di differenza non conta). La montagna ha 25 passi: oltre, giù dal burrone!
      Punti: 550 − 15 × passi (minimo 100), in vetta senza un passo +200, caduto 0 (22 ott 2026: da 500 a 550, così
      i 5 giochi a premi valgono in media uguale, circa 300 a testa; simulazioni in .agents/skills/prova-nel-browser/prezzo/simulazione).
      Rivelazione: tutti gli avatar salgono insieme, prodotto per prodotto, con la musichetta tirolese.
   📊 METTILI IN ORDINE (Hole in One): 5 prodotti (della stessa categoria se si può, prezzi distanti almeno il 15%),
      in colonna: si tocca un prodotto e poi un altro per scambiarli, dal meno caro (in alto) al più caro. 30 secondi.
      L'ordine che si vede quando scade il tempo vale (chi non ha toccato niente: 0). Punti: 70 a posto giusto, tutti
      giusti +100 (22 ott 2026: da 80 a 70, per la stessa media degli altri giochi a premi). Rivelazione: la fila giusta coi prezzi e una pallina da minigolf per ognuno, più vicina alla buca
      quanti più posti giusti. Tutti e 5: «⛳ Buca in uno!».
   Classi col prefisso pza- (stile in fondo al file).
   ========================================================= */
(function () {
  "use strict";
  var PREMI = window.SG_PREZZO_PREMI = window.SG_PREZZO_PREMI || {};
  var ERR = { facile: 0.45, medio: 0.25, difficile: 0.12 };
  var COLORI = ["#ff6b6b", "#4dabf7", "#ffd43b", "#69db7c", "#da77f2", "#ff922b", "#3bc9db", "#f783ac"];
  // lo schermo e il pannello dello stesso telefono si parlano da qui (es. il prodotto che stai prezzando)
  var LEGAMI = {};

  function Z() { return window.SGPrezzoScena || {}; }
  function gauss(rnd) { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  // il Bot sa il prezzo vero e sbaglia apposta (facile ±45%, medio ±25%, difficile ±12%), come nelle offerte
  function stima(P, prezzo, liv, molt) {
    var e = ERR[liv] || 0.25, g = Math.max(-2.5, Math.min(2.5, gauss(P.rnd)));
    return Math.max(P.passo(prezzo), P.arrotonda(prezzo * Math.exp(g * e * 0.85 * (molt || 1)), prezzo));
  }
  function pubProd(p) { p = p || {}; return { e: p.e, f: p.f || null, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat, cent: (+p.prezzo || 0) < 20 }; }
  // tocco subito col pointerdown (su iPhone il click a volte non arriva); il click resta per mouse e tastiera
  function premi(b, fn) {
    var ultimo = 0;
    b.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" && e.button) return; e.preventDefault(); ultimo = Date.now(); fn(); });
    b.addEventListener("click", function () { if (Date.now() - ultimo > 500) fn(); });
  }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function eTu(A, id) { return A.nome(id) === "Tu"; }
  // «Luca è …» / «Sei …»
  function frase(A, id, tu, lui) { return eTu(A, id) ? tu : A.nome(id) + " " + lui; }
  function mioTelefono(A, id) { return A.locale === "telefono" || id === A.io; }
  function chips(A, box, pub, testo) {
    svuota(box);
    box.className = "pz-tab" + (A.giocatori.length > 4 ? " fitto" : "");
    A.giocatori.forEach(function (g) {
      var t = testo(g.id);
      box.appendChild(A.el("span", { class: "pz-och" + (t.ok ? " ok" : " aspetta") }, [ A.fac(g.id), A.el("span", { text: A.nome(g.id) }), A.el("span", { class: "v", text: t.tx }) ]));
    });
  }
  function aggChips(A, box, testo) {
    var ch = box.children;
    A.giocatori.forEach(function (g, i) {
      var c = ch[i]; if (!c) return; var t = testo(g.id), v = c.querySelector(".v");
      if (v && v.textContent !== t.tx) { v.textContent = t.tx; c.classList.toggle("ok", !!t.ok); c.classList.toggle("aspetta", !t.ok); if (t.ok) { c.classList.remove("pza-pop"); void c.offsetWidth; c.classList.add("pza-pop"); } }
    });
  }

  // ---------------- la musichetta tirolese (oom-pa-pà a tre tempi), solo mentre si sale ----------------
  function ac() { try { return window.SG && window.SG.audioCtx ? window.SG.audioCtx() : null; } catch (e) { return null; } }
  function tirolese(ms) {
    var nulla = { ferma: function () {} }, c = ac(); if (!c) return nulla;
    var out; try { out = c.createGain(); out.gain.value = 0.55; out.connect(c.destination); } catch (e) { return nulla; }
    var BEAT = 0.19, t0 = c.currentTime + 0.03, n = Math.max(3, Math.ceil(ms / 1000 / BEAT));
    var BASSI = [[131, 98], [98, 123]], ACC = [[262, 330, 392], [247, 294, 349]];
    var MEL = [523, 659, 784, 784, 659, 523, 587, 698, 784, 698, 587, 494, 523, 659, 784, 1047, 784, 659, 587, 698, 988, 784, 587, 523];
    function suona(f, t, d, tipo, vol) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = tipo; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.03);
    }
    try {
      for (var b = 0; b < n; b++) {
        var t = t0 + b * BEAT, bar = Math.floor(b / 3) % 2, pos = b % 3;
        if (pos === 0) suona(BASSI[bar][Math.floor(b / 6) % 2], t, 0.24, "triangle", 0.26);
        else ACC[bar].forEach(function (f) { suona(f, t, 0.08, "square", 0.022); });
        suona(MEL[b % MEL.length], t, 0.15, "triangle", 0.07);
      }
    } catch (e) {}
    return { ferma: function () { try { out.gain.cancelScheduledValues(c.currentTime); out.gain.setValueAtTime(0.0001, c.currentTime); setTimeout(function () { try { out.disconnect(); } catch (e) {} }, 60); } catch (e) {} } };
  }
  function aah(A, box, x, y, testo) {
    var b = A.el("span", { class: "pza-aah", text: testo || "Aaaah!" });
    b.style.left = Math.round(x) + "px"; b.style.top = Math.round(y) + "px";
    box.appendChild(b); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1600);
  }

  // =====================================================================
  // 🧗 L'ALPINISTA
  // =====================================================================
  var ALP = { vetta: 25, pct: 4, sec: 45, passoMs: 140, quadro: 2000, riga: 230, tabella: 2300, base: 550, perPasso: 15, min: 100, vettaPiena: 200 };
  function passiAlp(v, prezzo, passo) {
    if (v == null || !(v > 0)) return ALP.vetta;
    var d = Math.abs(v - prezzo);
    if (d <= passo + 1e-9) return 0;
    return Math.min(ALP.vetta, Math.floor(Math.min(1, d / prezzo) * 100 / ALP.pct + 1e-9));
  }
  // quanto dura la rivelazione (la stessa scaletta di rivela: l'host aspetta tanto così)
  function tempiAlp(riv) {
    var t = 900, pos = {}, giu = {}, prod = riv.prod || [], g = riv.g || [];
    g.forEach(function (x) { pos[x.id] = 0; });
    prod.forEach(function (p, i) {
      t += 500 + (Z().durataConta ? Z().durataConta(p.prezzo, 220) : 1500) + 700;
      var mx = 0, cade = false;
      g.forEach(function (x) {
        if (giu[x.id]) return;
        var add = (x.p || [])[i] || 0, sale = Math.min(add, ALP.vetta + 1 - pos[x.id]);
        mx = Math.max(mx, sale); pos[x.id] += sale;
        if (pos[x.id] > ALP.vetta) { giu[x.id] = 1; cade = true; }
      });
      t += mx * ALP.passoMs + (cade ? 1500 : 0) + 600;
    });
    return t + ALP.quadro + g.length * ALP.riga + ALP.tabella;
  }

  PREMI.alpinista = {
    nome: "L'Alpinista", icona: "🧗", ordine: 2,
    regola: "Scrivi 3 prezzi: più sbagli, più sali. Oltre la vetta cadi dal burrone!",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var prod = [], cats = [];
      for (var i = 0; i < 3; i++) {
        var x = P.pesca(function (p) { return p.prezzo >= 1 && p.prezzo < 100 && cats.indexOf(p.cat) < 0; }, 1)[0]
          || P.pesca(function (p) { return p.prezzo < 100; }, 1)[0] || P.pesca(null, 1)[0];
        if (x) { prod.push(x); cats.push(x.cat); }
      }
      return { prod: prod, r: {}, ms: {} };
    },
    tempo: function () { return ALP.sec; },
    pubblico: function (st) {
      var n = {}; Object.keys(st.r).forEach(function (id) { n[id] = st.r[id].filter(function (v) { return v != null; }).length; });
      return { prod: st.prod.map(pubProd), n: n };
    },
    mossa: function (st, id, m, P) {
      var i = Math.floor(+m.i), v = P.tondo2(+m.v);
      if (!(i >= 0 && i < st.prod.length) || !(v > 0) || v > 9999999) return;
      var r = st.r[id] || (st.r[id] = []);
      while (r.length < st.prod.length) r.push(null);
      if (r[i] != null) return;
      r[i] = v; st.ms[id] = Math.max(0, Math.round(+m.ms || 0));
      if (r.every(function (x) { return x != null; })) P.fatto(id);
    },
    privatoDi: function (st, id) { return { mie: st.r[id] || [] }; },
    fine: function (st, P) {
      var punti = {}, g = [];
      P.ids.forEach(function (id) {
        var r = st.r[id] || [], p = st.prod.map(function (x, i) { return passiAlp(r[i], x.prezzo, P.passo(x.prezzo)); });
        var tot = p.reduce(function (a, b) { return a + b; }, 0), giu = tot > ALP.vetta;
        var pt = giu ? 0 : Math.max(ALP.min, ALP.base - ALP.perPasso * tot) + (tot === 0 ? ALP.vettaPiena : 0);
        punti[id] = pt;
        g.push({ id: id, v: st.prod.map(function (x, i) { return r[i] != null ? r[i] : null; }), p: p, tot: tot, giu: giu, pt: pt, ms: st.ms[id] || 0 });
      });
      // chi resta su coi passi più bassi si porta a casa i 3 premi
      var su = g.filter(function (x) { return !x.giu; }).sort(function (a, b) { return a.tot - b.tot || a.ms - b.ms; }), carrello = {};
      if (su.length) carrello[su[0].id] = st.prod.slice();
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, g: g } };
    },
    durata: function (riv) { return tempiAlp(riv); },
    bot: function (st, bot, P) {
      var t = 2500 + P.rnd() * 3500, lento = bot.livello === "facile" ? 1.4 : bot.livello === "difficile" ? 0.8 : 1;
      return st.prod.map(function (p, i) {
        var m = { ms: Math.round(Math.min(42000, t)), m: { i: i, v: stima(P, p.prezzo, bot.livello) } };
        t += (4500 + P.rnd() * 6000) * lento;
        return m;
      });
    },

    // ---------------- ogni telefono ----------------
    // il maxischermo mentre si gioca: il prodotto che stai prezzando (chi guarda: tutti e 3) e chi è a che punto
    schermo: function (A) {
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [];
      var testa = el("div", { class: "pz-testa", text: "🧗 L'Alpinista" });
      var cur = el("div", { class: "pza-cur" }), tre = el("div", { class: "pza-tre" }), ch = el("div");
      A.sch.appendChild(testa); A.sch.appendChild(cur); A.sch.appendChild(tre); A.sch.appendChild(ch);
      var dots = prod.map(function (p, i) { var d = el("span", { class: "pza-dot" }, [ el("b", { text: String(i + 1) }), Z().figura(el, p, "") ]); tre.appendChild(d); return d; });
      function stato(id) { var n = ((A.pub || {}).n || {})[id] || 0; return { tx: n >= prod.length ? "✅" : n + "/" + prod.length, ok: n >= prod.length }; }
      chips(A, ch, pub, stato);
      function tutti() {
        svuota(cur); testa.textContent = "🧗 L'Alpinista";
        var g = el("div", { class: "pza-tutti" });
        prod.forEach(function (p) { g.appendChild(A.scheda(p, { piccola: true })); });
        cur.appendChild(g); tre.hidden = true;
      }
      function mostra(i, mie) {
        i = Math.max(0, Math.min(prod.length - 1, i));
        testa.textContent = "🧗 L'Alpinista · " + (i + 1) + " di " + prod.length;
        svuota(cur); var s = A.scheda(prod[i], { cls: "media" }); s.classList.add("pza-entra"); cur.appendChild(s);
        tre.hidden = false;
        dots.forEach(function (d, j) { d.classList.toggle("ok", !!(mie && mie[j] != null)); d.classList.toggle("ora", j === i); });
      }
      var gioca = A.io != null && A.giocatori.some(function (g) { return g.id === A.io; }) && A.locale !== "telefono";
      if (gioca) mostra(0, []); else tutti();
      LEGAMI.alp = { vivo: function () { return testa.isConnected; }, mostra: mostra, tutti: tutti };
      return { aggiorna: function (p) { A.pub = p; aggChips(A, ch, stato); } };
    },
    pannello: function (A) {
      var el = A.el, prod = (A.pub || {}).prod || [], i = 0, mie = [], chiuso = false, tast = null;
      var box = el("div", { class: "pza-alp-pan" });
      A.pan.appendChild(box);
      function legame() { var L = LEGAMI.alp; return L && L.vivo() ? L : null; }
      function apri() {
        while (i < prod.length && mie[i] != null) i++;
        var L = legame(); if (L) L.mostra(Math.min(i, prod.length - 1), mie);
        if (i >= prod.length) { chiudi("✅ Fatto!"); return; }
        var p = prod[i], k = i, ultimo = i === prod.length - 1;
        tast = A.tastierino({ cent: !!p.cent, testoFatto: ultimo ? "✅ Fatto!" : "⏭️ Il prossimo…",
          testoOk: (ultimo ? "✅ L'ultimo!" : "🏷️ Questo!") + " · " + (k + 1) + " di " + prod.length,
          onOk: function (v) {
            if (chiuso || mie[k] != null) return false;
            mie[k] = v; A.invia({ i: k, v: v });
            setTimeout(function () { if (!chiuso && box.isConnected) { i = k + 1; apri(); } }, ultimo ? 0 : 420);
          } });
        svuota(box); box.appendChild(tast.el);
      }
      function chiudi(tx) {
        chiuso = true;
        if (tast) tast.blocca(tx);
        else { svuota(box); box.appendChild(el("p", { class: "pz-nota forte", text: tx })); }
      }
      apri();
      return {
        privato: function (m) {
          if (!m || !m.mie || chiuso) return;
          var nuovo = false; m.mie.forEach(function (v, j) { if (v != null && mie[j] == null) { mie[j] = v; nuovo = true; } });
          if (nuovo) { i = 0; apri(); }
        },
        tempo: function () { if (!chiuso) chiudi("⏰ Tempo scaduto"); }
      };
    },
    rivela: async function (A) {
      var el = A.el, riv = A.riv || {}, prod = riv.prod || [], g = riv.g || [];
      var testa = el("div", { class: "pz-testa", text: "🧗 L'Alpinista" });
      var alto = el("div", { class: "pza-alto" }), monte = el("div", { class: "pza-monte" }), banner = el("div", { class: "pz-sotto pza-bn", text: "Tutti ai piedi della montagna…" });
      monte.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs><linearGradient id="pzaRoccia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a1887f"/><stop offset="1" stop-color="#4e342e"/></linearGradient></defs>' +
        '<polygon points="0,100 10,62 22,78 38,40 52,70 66,46 78,74 90,52 100,70 100,100" fill="rgba(255,255,255,.07)"/>' +
        '<polygon points="0,100 0,93 6,90 76,14 80,14 81,100" fill="url(#pzaRoccia)"/>' +
        '<polygon points="62,29.2 76,14 80,14 80.2,22 76,20 72,25 68,23.5 65,28" fill="#f1f3f5"/>' +
        '<polygon points="91,100 91.5,58 100,56 100,100" fill="url(#pzaRoccia)"/>' +
        '<line x1="6" y1="90" x2="76" y2="14" stroke="rgba(255,255,255,.5)" stroke-width="1.4" stroke-dasharray="1 1.8" vector-effect="non-scaling-stroke"/>' +
        '</svg>';
      var bandiera = el("span", { class: "pza-flag", text: "🚩" }), cartello = el("span", { class: "pza-cart", text: "⚠️" });
      monte.appendChild(bandiera); monte.appendChild(cartello);
      A.sch.appendChild(testa); A.sch.appendChild(alto); A.sch.appendChild(monte); A.sch.appendChild(banner);
      // sopra la montagna: il prodotto col prezzo e le risposte di tutti (già al loro posto, così la montagna non cambia misura)
      var rv = el("div", { class: "pza-prow" }), chipsBox = el("div", { class: "pz-tab fitto pza-voci" }), voci = {};
      alto.appendChild(rv); alto.appendChild(chipsBox);
      function prodotto(i) {
        var p = prod[i] || {}, conta = A.contachilometri(p.prezzo || 0, {});
        svuota(rv);
        rv.appendChild(el("div", { class: "pz-miniprod" }, [ Z().figura(el, p, "e"), el("span", { class: "n", text: p.nome || "" }) ]));
        rv.appendChild(conta.el);
        return conta;
      }
      var conta0 = prodotto(0);
      g.forEach(function (x) {
        var v = el("span", { class: "v", text: "…" }), ps = el("b", { class: "pza-ps" }), c = el("span", { class: "pz-och aspetta" }, [ A.fac(x.id), v, ps ]);
        voci[x.id] = { c: c, v: v, ps: ps }; chipsBox.appendChild(c);
        // per misurare: la risposta più lunga di ognuno (così dopo le righe non crescono e la montagna resta al suo posto)
        var lunga = "", pl = "";
        prod.forEach(function (p, i) { var t = x.v[i] != null ? A.fmtE(x.v[i]) : "—", q = x.p[i] === 0 ? "🎯" : "+" + x.p[i]; if ((t + q).length > (lunga + pl).length) { lunga = t; pl = q; } });
        v.textContent = lunga; ps.textContent = pl;
      });
      await A.dorme(60); if (!A.vivo()) return;
      g.forEach(function (x) { voci[x.id].v.textContent = "…"; voci[x.id].ps.textContent = ""; });
      // le misure della montagna (fisse per tutta la rivelazione)
      // (una riga di risposte di riserva: con le risposte vere le righe possono andare a capo una volta in più)
      var W = monte.clientWidth || 300, H = Math.max(110, (monte.clientHeight || 160) - (g.length > 2 ? 30 : 0));
      monte.style.height = H + "px"; monte.style.flex = "0 0 auto";
      var B = { x: 0.06 * W, y: 0.90 * H }, S = { x: 0.76 * W, y: 0.14 * H };
      bandiera.style.transform = "translate(" + Math.round(S.x - 4) + "px," + Math.round(S.y - 30) + "px)";
      cartello.style.transform = "translate(" + Math.round(0.80 * W + 2) + "px," + Math.round(S.y - 24) + "px)";
      var dx = S.x - B.x, dy = S.y - B.y, len = Math.sqrt(dx * dx + dy * dy) || 1, nx = dy / len, ny = -dx / len;
      var FAC = Math.max(20, Math.min(30, Math.round(H * 0.13))), n = g.length;
      var av = {}, pos = {}, giu = {}, detti = {};
      g.forEach(function (x, j) {
        var c = el("span", { class: "pza-alp" }, [ A.fac(x.id) ]);
        c.style.width = c.style.height = FAC + "px"; c.style.zIndex = String(10 + j);
        c.style.setProperty("--col", COLORI[j % COLORI.length]);
        var off = (j - (n - 1) / 2) * Math.min(7, 40 / Math.max(1, n));
        av[x.id] = { el: c, ox: nx * off, oy: ny * off }; pos[x.id] = 0;
        monte.appendChild(c); metti(x.id, 0);
      });
      function metti(id, s) {
        var a = av[id], u = Math.min(s, ALP.vetta) / ALP.vetta;
        var x = B.x + dx * u + a.ox - FAC / 2, y = B.y + dy * u + a.oy - FAC;
        a.el.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      }
      function cade(id) {
        var a = av[id]; giu[id] = 1;
        a.el.classList.add("salta");
        a.el.style.transform = "translate(" + Math.round(0.84 * W) + "px," + Math.round(S.y - FAC - 14) + "px)";
        setTimeout(function () {
          if (!A.vivo()) return;
          var f = A.fac(id, "triste"); svuota(a.el); a.el.appendChild(f);
          a.el.classList.remove("salta"); a.el.classList.add("cade");
          a.el.style.transform = "translate(" + Math.round(0.855 * W) + "px," + Math.round(H - FAC * 0.7) + "px) rotate(380deg)";
        }, 260);
        aah(A, monte, 0.70 * W, S.y + 6, eTu(A, id) ? "Aaaah! 😱" : "Aaaah!");
        A.FX.whoosh(); A.ST.pubblico(A.S, "ohh");
        if (mioTelefono(A, id)) A.vibra([60, 40, 120]);
      }
      await A.dorme(840); if (!A.vivo()) return;
      for (var i = 0; i < prod.length; i++) {
        testa.textContent = "🧗 L'Alpinista · " + (i + 1) + " di " + prod.length;
        var conta = i ? prodotto(i) : conta0;
        g.forEach(function (x) { var o = voci[x.id]; o.v.textContent = giu[x.id] ? "💥" : "…"; o.ps.textContent = ""; o.c.className = "pz-och aspetta"; });
        banner.textContent = "Quanto costa?";
        A.ST.FX.rullo(1.0);
        await A.dorme(500); if (!A.vivo()) return;
        await conta.via(220); if (!A.vivo()) return;
        // le risposte di tutti, coi passi che valgono
        g.forEach(function (x) {
          var v = x.v[i], ps = x.p[i], o = voci[x.id];
          o.v.textContent = v != null ? A.fmtE(v) : "—"; o.ps.textContent = ps === 0 ? "🎯" : "+" + ps;
          o.c.className = "pz-och pza-pop" + (ps === 0 ? " ok" : "");
        });
        banner.textContent = g.some(function (x) { return x.p[i] === 0; }) ? "🎯 Preso preciso: non si muove!" : "Si sale!";
        await A.dorme(700); if (!A.vivo()) return;
        // si sale tutti insieme, un passo alla volta
        var add = {}, mx = 0, cadeQui = false;
        g.forEach(function (x) { if (giu[x.id]) return; add[x.id] = Math.min(x.p[i] || 0, ALP.vetta + 1 - pos[x.id]); mx = Math.max(mx, add[x.id]); });
        var musica = mx ? tirolese(mx * ALP.passoMs) : null;
        for (var s = 0; s < mx; s++) {
          if (!A.vivo()) { if (musica) musica.ferma(); return; }
          g.forEach(function (x) {
            if (giu[x.id] || !(add[x.id] > s)) return;
            pos[x.id]++;
            if (pos[x.id] > ALP.vetta) { cadeQui = true; cade(x.id); } else metti(x.id, pos[x.id]);
          });
          await A.dorme(ALP.passoMs);
        }
        if (musica) musica.ferma();
        if (cadeQui) {
          var caduti = g.filter(function (x) { return giu[x.id] && add[x.id] && !detti[x.id]; });
          caduti.forEach(function (x) { detti[x.id] = 1; });
          banner.textContent = caduti.length === 1 ? "💥 " + frase(A, caduti[0].id, "Sei caduto dal burrone!", "è caduto dal burrone!") : "💥 Giù dal burrone: " + caduti.map(function (x) { return A.nome(x.id); }).join(", ") + "!";
          banner.classList.remove("pza-scuoti"); void banner.offsetWidth; banner.classList.add("pza-scuoti");
          await A.dorme(1500); if (!A.vivo()) return;
        }
        await A.dorme(600); if (!A.vivo()) return;
      }
      // com'è finita: in vetta, ancora su o giù
      g.forEach(function (x) {
        if (giu[x.id]) return;
        var a = av[x.id]; svuota(a.el); a.el.appendChild(A.fac(x.id, x.tot === 0 ? "evviva" : "esulta"));
      });
      testa.textContent = "🧗 L'Alpinista";
      var ord = g.slice().sort(function (a, b) { return (a.giu - b.giu) || (a.tot - b.tot) || (a.ms - b.ms); });
      var vetta = ord.filter(function (x) { return !x.giu && x.tot === 0; }), primo = ord[0];
      banner.classList.remove("pza-scuoti");
      if (vetta.length) {
        banner.className = "pz-banner oro pza-bn";
        banner.textContent = vetta.length === 1 ? "🏔️ " + frase(A, vetta[0].id, "Sei in vetta senza un passo!", "in vetta senza un passo!") : "🏔️ In vetta senza un passo!";
        A.FX.din(); A.ST.pubblico(A.S, "ovazione"); A.ST.coriandoli();
        if (vetta.some(function (x) { return mioTelefono(A, x.id); })) A.vibra([30, 40, 70]);
      } else if (primo && !primo.giu) {
        banner.className = "pz-banner pza-bn";
        banner.textContent = "🧗 " + frase(A, primo.id, "Sei il re della montagna!", "è il re della montagna!");
        A.ST.pubblico(A.S, "applauso");
      } else {
        banner.className = "pz-banner no pza-bn";
        banner.textContent = "😱 Tutti giù dal burrone!";
        A.FX.trombone(); A.ST.pubblico(A.S, "ohh");
      }
      await A.dorme(ALP.quadro); if (!A.vivo()) return;
      // poi la tabella: passi e punti di tutti (al posto della montagna)
      monte.style.display = "none"; svuota(alto);
      var due = ord.length > 4, righe = el("div", { class: "pz-righe" + (due ? " due" : "") });
      alto.appendChild(righe);
      for (var q = 0; q < ord.length; q++) {
        var x = ord[q], pt = (A.punti || {})[x.id] != null ? A.punti[x.id] : x.pt;
        var r = el("div", { class: "pz-riga " + (x.giu ? "sopra" : x.tot === 0 ? "giusto" : "sotto") }, [ A.fac(x.id, x.giu ? "triste" : "esulta"), el("span", { class: "nm", text: A.nome(x.id) }),
          el("span", { class: "v", text: (x.giu ? "💥 " : "") + x.tot + (due ? "" : x.tot === 1 ? " passo" : " passi") }), el("span", { class: "bd", text: x.giu ? (due ? "" : "giù") : x.tot === 0 ? "🏔️" : "" }) ]);
        if (pt) r.appendChild(el("span", { class: "pt", text: "+" + A.fmtN(pt) }));
        righe.appendChild(r); void r.offsetWidth; r.classList.add("su"); A.FX.toc(520 + q * 60);
        await A.dorme(ALP.riga); if (!A.vivo()) return;
      }
      await A.dorme(ALP.tabella);
    }
  };

  // =====================================================================
  // 📊 METTILI IN ORDINE
  // =====================================================================
  var ORD = { n: 5, sec: 30, aPosto: 70, tutti: 100, distanza: 1.15, ventaglio: 12 };
  function giustoOrd(prod) { return prod.map(function (p, i) { return i; }).sort(function (a, b) { return prod[a].prezzo - prod[b].prezzo; }); }
  function contaGiusti(l, giusto) { var n = 0; for (var i = 0; i < giusto.length; i++) if (l && l[i] === giusto[i]) n++; return n; }
  function permutazione(l, n) {
    if (!Array.isArray(l) || l.length !== n) return false;
    var visti = {}; for (var i = 0; i < n; i++) { var x = l[i]; if (!(x >= 0 && x < n) || x !== Math.floor(x) || visti[x]) return false; visti[x] = 1; }
    return true;
  }
  var TORD = { prima: 900, prezzo: 620, pausa: 500, corsa: 2100, esito: 1300, fine: 2300 };
  function tempiOrd(riv) { return TORD.prima + ORD.n * TORD.prezzo + TORD.pausa + 300 + TORD.corsa + TORD.esito + TORD.fine; }

  PREMI.ordine = {
    nome: "Mettili in ordine", icona: "📊", ordine: 3,
    regola: "Tocca due prodotti per scambiarli: dal meno caro in alto al più caro in basso.",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var scelti = [];
      function lontano(x) { return scelti.every(function (s) { var r = x.prezzo / s.prezzo; return r >= ORD.distanza || r <= 1 / ORD.distanza; }); }
      function stretto(x) { var l = scelti.map(function (s) { return s.prezzo; }).concat([x.prezzo]); return Math.max.apply(null, l) / Math.min.apply(null, l) <= ORD.ventaglio; }
      var p1 = P.pesca(function (x) { return x.prezzo >= 1; }, 1)[0] || P.pesca(null, 1)[0];
      if (p1) scelti.push(p1);
      var cat = p1 ? p1.cat : null;
      var prove = [
        function (x) { return x.cat === cat && lontano(x) && stretto(x); },
        function (x) { return x.cat === cat && lontano(x); },
        function (x) { return lontano(x) && stretto(x); },
        function (x) { return lontano(x); }
      ];
      while (scelti.length < ORD.n) {
        var y = null;
        for (var q = 0; q < prove.length && !y; q++) y = P.pesca(prove[q], 1)[0] || null;
        if (!y) break;
        scelti.push(y);
      }
      var prod = P.mescola(scelti), giusto = giustoOrd(prod), start = null;
      // la colonna di partenza: in disordine (al massimo un posto già giusto)
      for (var t = 0; t < 40; t++) { start = P.mescola(prod.map(function (p, i) { return i; })); if (contaGiusti(start, giusto) <= 1) break; }
      return { prod: prod, start: start, l: {}, f: {}, ms: {} };
    },
    tempo: function () { return ORD.sec; },
    pubblico: function (st) { return { prod: st.prod.map(pubProd), start: st.start, fatti: Object.keys(st.f) }; },
    mossa: function (st, id, m, P) {
      if (!permutazione(m.l, st.prod.length)) return;
      st.l[id] = m.l.slice(); st.ms[id] = Math.max(0, Math.round(+m.ms || 0));
      if (m.fine) { st.f[id] = 1; P.fatto(id); }
    },
    privatoDi: function (st, id) { return st.l[id] ? { l: st.l[id], f: !!st.f[id] } : null; },
    fine: function (st, P) {
      var giusto = giustoOrd(st.prod), punti = {}, g = [];
      P.ids.forEach(function (id) {
        var l = st.l[id] || null, n = l ? contaGiusti(l, giusto) : 0;
        var pt = n * ORD.aPosto + (n === st.prod.length ? ORD.tutti : 0);
        punti[id] = pt;
        g.push({ id: id, l: l, n: n, pt: pt, ms: st.ms[id] || 0, f: !!st.f[id] });
      });
      // il più bravo (con almeno 3 posti giusti) si porta a casa il più caro dei cinque
      var best = g.filter(function (x) { return x.n >= 3; }).sort(function (a, b) { return b.n - a.n || a.ms - b.ms; })[0], carrello = {};
      if (best) carrello[best.id] = [st.prod[giusto[giusto.length - 1]]];
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, giusto: giusto, g: g } };
    },
    durata: function (riv) { return tempiOrd(riv); },
    bot: function (st, bot, P) {
      // (mettere in ordine prezzi vicini è più difficile di quanto sembri: il Bot ci mette più dubbio)
      var st2 = st.prod.map(function (p) { return stima(P, p.prezzo, bot.livello, 1.7); });
      var l = st.prod.map(function (p, i) { return i; }).sort(function (a, b) { return st2[a] - st2[b]; });
      var ms = (bot.livello === "difficile" ? 7000 : bot.livello === "medio" ? 10000 : 13000) + P.rnd() * 9000;
      return [ { ms: Math.round(ms * 0.55), m: { l: P.mescola(l.slice()) } }, { ms: Math.round(Math.min(28500, ms)), m: { l: l, fine: 1 } } ];
    },

    // ---------------- ogni telefono ----------------
    // il maxischermo: il prodotto che hai toccato (con la descrizione), oppure tutti e 5; sotto chi ha finito
    schermo: function (A) {
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [];
      var testa = el("div", { class: "pz-testa", text: "📊 Mettili in ordine" }), cur = el("div", { class: "pza-cur" }), ch = el("div");
      A.sch.appendChild(testa); A.sch.appendChild(cur); A.sch.appendChild(ch);
      function stato(id) { var f = ((A.pub || {}).fatti || []).indexOf(id) >= 0; return { tx: f ? "✅" : "…", ok: f }; }
      chips(A, ch, pub, stato);
      function tutti(l) {
        svuota(cur);
        var g = el("div", { class: "pza-cinque" });
        (l || pub.start || []).forEach(function (j) { var p = prod[j] || {}; g.appendChild(el("div", { class: "pza-c5" }, [ Z().figura(el, p, "e"), el("span", { class: "n", text: p.nome || "" }) ])); });
        cur.appendChild(g);
        cur.appendChild(el("div", { class: "pz-sotto", text: "👆 Tocca un prodotto e poi un altro per scambiarli" }));
      }
      function mostra(j) {
        if (!prod[j]) return tutti();
        svuota(cur); var s = A.scheda(prod[j], { cls: "media" }); s.classList.add("pza-entra"); cur.appendChild(s);
      }
      tutti();
      LEGAMI.ord = { vivo: function () { return testa.isConnected; }, mostra: mostra, tutti: tutti };
      return { aggiorna: function (p) { A.pub = p; aggChips(A, ch, stato); } };
    },
    pannello: function (A) {
      var el = A.el, pub = A.pub || {}, prod = pub.prod || [], l = (pub.start || prod.map(function (p, i) { return i; })).slice();
      var sel = -1, chiuso = false, toInvio = null, mosso = false;
      var lista = el("div", { class: "pza-ord" }), righe = [], figs = [];
      function legame() { var L = LEGAMI.ord; return L && L.vivo() ? L : null; }
      l.forEach(function (j, pos) {
        var nb = el("span", { class: "nb" }, [ el("b", { text: String(pos + 1) }), pos === 0 ? el("small", { text: "meno caro" }) : pos === l.length - 1 ? el("small", { text: "più caro" }) : null ]);
        var b = el("button", { class: "pza-or", type: "button" }, [ nb, el("span", { class: "fs", style: "display:contents" }), el("span", { class: "n" }) ]);
        premi(b, function () { tocca(pos); });
        righe.push(b); lista.appendChild(b); disegna(pos);
      });
      var ok = el("button", { class: "pz-ok pza-fatto", type: "button", text: "✅ Fatto!" });
      premi(ok, function () { if (chiuso) return; A.vibra(12); manda(true); blocca("✅ Fatto!"); });
      A.pan.appendChild(lista); A.pan.appendChild(ok);
      var L0 = legame(); if (L0) L0.tutti(l);   // (sullo stesso telefono: si riparte dai 5 prodotti, non da quello toccato da chi c'era prima)
      // la foto di ogni prodotto si fa una volta sola e si sposta da una riga all'altra (niente foto che si ricaricano)
      function disegna(pos) {
        var p = prod[l[pos]] || {}, r = righe[pos], posto = r.querySelector(".fs"), f = figs[l[pos]] || (figs[l[pos]] = Z().figura(el, p, "e"));
        if (posto.firstChild !== f) { posto.textContent = ""; posto.appendChild(f); }
        r.querySelector(".n").textContent = p.nome || "";
      }
      function scivola(r, d) { r.style.transition = "none"; r.style.transform = "translateY(" + d + "px)"; void r.offsetWidth; r.style.transition = ""; r.style.transform = ""; }
      function tocca(pos) {
        if (chiuso) return;
        if (sel < 0) { sel = pos; righe[pos].classList.add("sel"); A.vibra(8); A.FX.toc(700); var L = legame(); if (L) L.mostra(l[pos]); return; }
        if (sel === pos) { righe[pos].classList.remove("sel"); sel = -1; return; }
        var a = sel; sel = -1; righe[a].classList.remove("sel");
        var ya = righe[a].offsetTop, yb = righe[pos].offsetTop;
        var x = l[a]; l[a] = l[pos]; l[pos] = x; disegna(a); disegna(pos);
        scivola(righe[a], yb - ya); scivola(righe[pos], ya - yb);
        A.vibra(10); A.FX.toc(990); mosso = true;
        var L2 = legame(); if (L2) L2.mostra(l[pos]);
        clearTimeout(toInvio);
        var resta = (A.fine || 0) - Date.now();
        if (resta > 0 && resta < 4000) manda(false); else toInvio = setTimeout(function () { manda(false); }, 1000);
      }
      function manda(fine) {
        clearTimeout(toInvio); toInvio = null;
        if (!fine && !mosso) return;
        A.invia(fine ? { l: l.slice(), fine: 1 } : { l: l.slice() });
      }
      function blocca(tx) {
        chiuso = true; ok.disabled = true; ok.textContent = tx; lista.classList.add("chiuso");
        if (sel >= 0) { righe[sel].classList.remove("sel"); sel = -1; }
      }
      return {
        privato: function (m) {
          if (!m || !permutazione(m.l, prod.length) || chiuso) return;
          l = m.l.slice(); mosso = true; righe.forEach(function (r, pos) { disegna(pos); });
          if (m.f) blocca("✅ Fatto!");
        },
        // il tempo è finito: vale l'ordine che si vede (se hai toccato qualcosa)
        tempo: function () { if (chiuso) return; if (mosso) manda(false); blocca("⏰ Tempo scaduto"); }
      };
    },
    rivela: async function (A) {
      var el = A.el, riv = A.riv || {}, prod = riv.prod || [], giusto = riv.giusto || [], g = riv.g || [];
      var testa = el("div", { class: "pz-testa", text: "📊 Mettili in ordine" });
      var fila = el("div", { class: "pza-fila" }), golf = el("div", { class: "pza-golf" }), banner = el("div", { class: "pz-sotto pza-bn", text: "Dal meno caro al più caro…" });
      A.sch.appendChild(testa); A.sch.appendChild(fila); A.sch.appendChild(golf); A.sch.appendChild(banner);
      var tags = giusto.map(function (j, pos) {
        var p = prod[j] || {}, tag = A.Z.cartellino(el, A.fmtE(p.prezzo || 0));
        var c = el("div", { class: "pza-fc" }, [ el("b", { class: "nb", text: String(pos + 1) }), Z().figura(el, p, "e"), el("span", { class: "n", text: p.nome || "" }), tag ]);
        c.style.animationDelay = (pos * 0.07) + "s"; fila.appendChild(c); return tag;
      });
      // le corsie del minigolf (una per giocatore)
      var corsie = g.map(function (x, j) {
        var palla = el("span", { class: "pza-palla" }), lab = el("span", { class: "pza-lab" });
        palla.style.setProperty("--col", COLORI[j % COLORI.length]);
        var trk = el("span", { class: "pza-trk" }, [ el("span", { class: "pza-buca" }), palla ]);
        var r = el("div", { class: "pza-lane" }, [ A.fac(x.id), el("span", { class: "nm", text: A.nome(x.id) }), trk, lab ]);
        golf.appendChild(r);
        return { x: x, r: r, palla: palla, trk: trk, lab: lab };
      });
      golf.classList.toggle("fitto", g.length > 5);
      A.ST.FX.rullo(0.9);
      await A.dorme(TORD.prima); if (!A.vivo()) return;
      for (var i = 0; i < tags.length; i++) {
        tags[i].classList.add("su"); A.FX.toc(560 + i * 90);
        await A.dorme(TORD.prezzo); if (!A.vivo()) return;
      }
      banner.textContent = "⛳ Più posti giusti, più vicino alla buca!";
      await A.dorme(TORD.pausa); if (!A.vivo()) return;
      golf.classList.add("su");
      await A.dorme(300); if (!A.vivo()) return;
      // tutte le palline rotolano insieme
      A.ST.FX.rullo(1.6);
      corsie.forEach(function (c) {
        var w = c.trk.clientWidth - c.palla.offsetWidth - 2, fr = c.x.n / ORD.n;
        if (c.x.n === ORD.n) fr = 1;
        c.palla.style.transitionDelay = (Math.random() * 0.25).toFixed(2) + "s";
        c.palla.style.transform = "translateX(" + Math.max(0, Math.round(w * fr)) + "px)";
      });
      await A.dorme(TORD.corsa); if (!A.vivo()) return;
      var buche = [];
      corsie.forEach(function (c, q) {
        var x = c.x, pt = (A.punti || {})[x.id] != null ? A.punti[x.id] : x.pt;
        c.lab.textContent = x.l ? x.n + "/" + ORD.n : "—";
        if (pt) c.r.appendChild(el("span", { class: "pt", text: "+" + A.fmtN(pt) }));
        c.r.classList.add(x.n === ORD.n ? "buca" : x.n >= 3 ? "bene" : "male");
        if (x.n === ORD.n) { c.palla.classList.add("dentro"); buche.push(x); }
        var f = c.r.querySelector(".fac"); if (f) { var nf = A.fac(x.id, x.n === ORD.n ? "evviva" : x.n >= 3 ? "esulta" : "triste"); f.parentNode.replaceChild(nf, f); }
      });
      A.FX.toc(880);
      if (buche.length) { A.FX.din(); A.ST.coriandoli(); A.ST.pubblico(A.S, "ovazione"); if (buche.some(function (x) { return mioTelefono(A, x.id); })) A.vibra([30, 40, 70]); }
      await A.dorme(TORD.esito); if (!A.vivo()) return;
      var best = g.slice().sort(function (a, b) { return b.n - a.n || a.ms - b.ms; })[0];
      if (buche.length) {
        banner.className = "pz-banner oro pza-bn";
        banner.textContent = buche.length === 1 ? "⛳ Buca in uno! " + (eTu(A, buche[0].id) ? "Bravissimo!" : A.nome(buche[0].id) + "!") : "⛳ Buca in uno per " + buche.length + "!";
      } else if (best && best.n >= 3) {
        banner.className = "pz-banner pza-bn";
        banner.textContent = "🏌️ " + frase(A, best.id, "Ci sei andato più vicino: " + best.n + " su 5!", "ci va più vicino: " + best.n + " su 5!");
        A.ST.pubblico(A.S, "applauso");
      } else {
        banner.className = "pz-banner no pza-bn";
        banner.textContent = "😅 Che confusione coi prezzi!";
        A.FX.trombone(); A.ST.pubblico(A.S, "ohh");
      }
      await A.dorme(TORD.fine);
    }
  };

  // ---------------- lo stile (una volta) ----------------
  function stile() {
    if (document.getElementById("sg-pza-css")) return;
    var s = document.createElement("style"); s.id = "sg-pza-css";
    s.textContent = [
      ".pza-pop{animation:pzPop .35s cubic-bezier(.3,1.6,.5,1)}",
      ".pza-entra{animation:pzaEntra .35s cubic-bezier(.3,1.4,.5,1) both}@keyframes pzaEntra{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}",
      ".pza-cur{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;min-height:0}",
      ".pza-tutti{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%}",
      ".pza-tre{display:flex;gap:8px;justify-content:center}.pza-tre[hidden]{display:none}",
      ".pza-dot{display:flex;align-items:center;gap:4px;padding:2px 9px 2px 3px;border-radius:99px;background:rgba(255,255,255,.12);font-size:18px;transition:transform .2s}",
      ".pza-dot b{width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.2);font-size:12px;display:flex;align-items:center;justify-content:center}",
      ".pza-dot.ora{background:rgba(255,212,59,.3);box-shadow:0 0 0 2px #ffd43b;transform:scale(1.08)}.pza-dot.ok b{background:#37d47e;color:#04321c}",
      ".pza-alp-pan{display:flex;flex-direction:column}",
      // la montagna
      ".pza-alto{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}",
      ".pza-prow{display:flex;align-items:center;justify-content:center;gap:10px;max-width:100%}.pza-prow .pz-miniprod{min-width:0}.pza-prow .pz-conta{font-size:26px;padding:4px 8px;flex:0 0 auto}",
      ".pza-voci .pza-ps{font-size:11px;color:#ffb3bb}.pza-voci .pz-och.ok .pza-ps{color:#6ff0a6}",
      ".pza-monte{position:relative;flex:1 1 0;min-height:110px;width:100%;max-width:460px;overflow:hidden;border-radius:14px;background:linear-gradient(#3b5bdb33,#0b072400)}",
      ".pza-monte svg{position:absolute;inset:0;width:100%;height:100%;display:block}",
      ".pza-flag,.pza-cart{position:absolute;left:0;top:0;font-size:22px;line-height:1;pointer-events:none}.pza-cart{font-size:16px}",
      ".pza-alp{position:absolute;left:0;top:0;border-radius:50%;box-shadow:0 0 0 2px var(--col,#fff),0 2px 5px rgba(0,0,0,.5);background:rgba(20,12,60,.6);will-change:transform;transition:transform .13s linear}",
      ".pza-alp .fac{display:block;width:100%;height:100%;border-radius:50%;overflow:hidden}.pza-alp .fac svg{width:100%;height:100%;display:block}",
      ".pza-alp.salta{transition:transform .25s cubic-bezier(.2,1.6,.5,1)}",
      ".pza-alp.cade{transition:transform 1.05s cubic-bezier(.55,0,1,.6),opacity 1s;opacity:.8}",
      ".pza-aah{position:absolute;z-index:40;padding:3px 9px;border-radius:12px;background:#fff;color:#c92a2a;font-weight:900;font-size:15px;white-space:nowrap;pointer-events:none;animation:pzaAah 1.5s ease-out forwards}",
      "@keyframes pzaAah{0%{transform:scale(.3);opacity:0}15%{transform:scale(1.1);opacity:1}70%{transform:translateY(-10px);opacity:1}100%{transform:translateY(-22px);opacity:0}}",
      ".pza-bn{flex:0 0 auto;width:100%;max-width:440px;text-align:center;height:46px;display:flex;align-items:center;justify-content:center;line-height:1.15;overflow:hidden}.pz-banner.pza-bn{font-size:20px}.pz-banner.oro.pza-bn{font-size:22px}",
      ".pza-scuoti{animation:pzScuoti .4s}",
      // mettili in ordine: il pannello
      ".pza-ord{display:flex;flex-direction:column;gap:5px}",
      ".pza-or{position:relative;display:flex;align-items:center;gap:8px;height:clamp(36px,calc(var(--alt,640px) * .06),50px);padding:0 10px 0 4px;border:0;border-radius:12px;font:inherit;text-align:left;color:#1d1b3a;background:linear-gradient(#fff,#ece6ff);box-shadow:inset 0 -3px 0 rgba(90,74,154,.25);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .28s cubic-bezier(.3,1.3,.5,1),box-shadow .15s;will-change:transform}",
      ".pza-or .nb{flex:0 0 46px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;color:#5a4a9a}.pza-or .nb b{font-size:17px}.pza-or .nb small{font-size:8.5px;font-weight:900;text-transform:uppercase;letter-spacing:.02em;margin-top:2px}",
      ".pza-or .e{flex:0 0 auto;font-size:24px;line-height:1}",
      ".pza-or .n{flex:1;min-width:0;font-weight:800;font-size:14px;line-height:1.15;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
      ".pza-or.sel{background:linear-gradient(#ffe98a,#fcc419);box-shadow:0 0 0 3px #fff,0 4px 14px rgba(252,196,25,.5);z-index:2}",
      ".pza-ord.chiuso .pza-or{opacity:.6;cursor:default}",
      ".pza-fatto{width:100%;height:clamp(40px,calc(var(--alt,640px) * .066),52px)}",
      // mettili in ordine: il maxischermo
      ".pza-cinque{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;width:100%;max-width:420px}",
      ".pza-c5{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 3px;border-radius:12px;background:rgba(255,255,255,.1)}",
      ".pza-c5 .e{font-size:28px;line-height:1.1}.pza-c5 .n{font-size:10.5px;font-weight:800;line-height:1.15;color:#e8ebff;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}",
      // la rivelazione: la fila giusta
      ".pza-fila{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;width:100%;max-width:440px}",
      ".pza-fc{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px 5px;border-radius:12px;background:linear-gradient(#ffffff,#f3efff);color:#1d1b3a;animation:pzPop .4s cubic-bezier(.3,1.6,.5,1) both}",
      ".pza-fc .nb{position:absolute;left:3px;top:2px;font-size:10px;color:#7048e8}",
      ".pza-fc .e{font-size:clamp(24px,calc(var(--alt,640px) * .05),42px);line-height:1.15}",
      ".pza-fc .n{font-size:10px;font-weight:800;line-height:1.1;text-align:center;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.2em;word-break:break-word}",
      ".pza-fc .pz-tag{font-size:11px;padding:2px 5px 2px 11px;max-width:100%;box-sizing:border-box;opacity:0;transform:scale(.4);transition:transform .4s cubic-bezier(.3,1.6,.5,1),opacity .2s}.pza-fc .pz-tag:before{left:4px;width:4px;height:4px;margin-top:-2px}",
      ".pza-fc .pz-tag.su{opacity:1;transform:none}",
      // il minigolf
      ".pza-golf{display:flex;flex-direction:column;gap:4px;width:100%;max-width:440px;opacity:0;transform:translateY(12px);transition:opacity .3s,transform .35s}.pza-golf.su{opacity:1;transform:none}",
      ".pza-lane{position:relative;display:flex;align-items:center;gap:6px;height:clamp(26px,calc(var(--alt,640px) * .05),40px);padding:0 6px 0 2px;border-radius:12px;background:rgba(255,255,255,.08)}",
      ".pza-lane .fac{width:24px;height:24px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.14);flex:0 0 auto}.pza-lane .fac svg{width:100%;height:100%;display:block}",
      ".pza-lane .nm{flex:0 0 64px;min-width:0;font-weight:800;font-size:12.5px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pza-trk{position:relative;flex:1;height:68%;border-radius:99px;background:repeating-linear-gradient(90deg,#2f9e44 0 14px,#37b24d 14px 28px);box-shadow:inset 0 2px 4px rgba(0,0,0,.35)}",
      ".pza-buca{position:absolute;right:4px;top:50%;width:13px;height:9px;margin-top:-4.5px;border-radius:50%;background:#05030f;box-shadow:0 0 0 2px rgba(255,255,255,.35)}",
      ".pza-buca:after{content:'⛳';position:absolute;left:3px;bottom:2px;font-size:13px;line-height:1}",
      ".pza-palla{position:absolute;left:1px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#dee2e6 70%);box-shadow:0 0 0 2px var(--col,#fff),0 2px 3px rgba(0,0,0,.45);will-change:transform;transition:transform 1.8s cubic-bezier(.15,.75,.3,1)}",
      ".pza-palla.dentro{opacity:.35;box-shadow:0 0 0 2px var(--col,#fff),0 0 12px #ffd43b}",
      ".pza-lab{flex:0 0 30px;text-align:right;font-weight:900;font-size:13px;color:#ffe066}",
      ".pza-lane.buca{background:rgba(255,212,59,.3);box-shadow:0 0 0 2px #ffd43b}.pza-lane.bene{background:rgba(55,212,126,.2)}.pza-lane.male .pza-lab{color:#ffb3bb}",
      ".pza-lane .pt{flex:0 0 auto;font-size:11px;font-weight:900;color:#04321c;background:#6ff0a6;border-radius:99px;padding:0 6px;animation:pzPop .35s both}",
      ".pza-golf.fitto{gap:3px}.pza-golf.fitto .pza-lane{height:clamp(22px,calc(var(--alt,640px) * .04),34px)}.pza-golf.fitto .pza-lane .fac{width:18px;height:18px}.pza-golf.fitto .pza-lane .nm{font-size:11.5px;flex-basis:56px}",
      "@media (prefers-reduced-motion:reduce){.pza-entra,.pza-fc,.pza-aah{animation:none}}"
    ].join("");
    document.head.appendChild(s);
  }
  // lo stile si aggiunge appena c'è la pagina (il file si carica prima del gioco)
  if (document.head) stile(); else document.addEventListener("DOMContentLoaded", stile);
})();
