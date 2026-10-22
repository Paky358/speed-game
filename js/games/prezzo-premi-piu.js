/* =========================================================
   «IL PREZZO È GIUSTO!» — gioco a premi «🔼🔽 Più o meno» (il Clock Game della TV), tutti insieme.
   È il PRIMO ESEMPIO dei giochi a premi: gli altri si fanno uguali, in un file loro (js/games/prezzo-premi-a.js, -b.js),
   senza toccare index.html né il gioco. Interfaccia completa (con esempi) anche in
   scratchpad/giochi-nuovi/prezzo/interfaccia-premi.md.

   COME SI REGISTRA UN GIOCO A PREMI
     window.SG_PREZZO_PREMI = window.SG_PREZZO_PREMI || {};
     window.SG_PREZZO_PREMI.<tipo> = { ...l'oggetto qui sotto... };
   Il gioco li legge quando comincia una partita (i file si possono caricare in qualsiasi ordine).

   L'OGGETTO
     nome, icona, regola     testi (regola: una riga, si legge nella presentazione e nella scelta)
     min, max                quanti giocatori (facoltativi)
     locale                  false = non si gioca sullo stesso telefono (di partenza sì: lì si passa il telefono a turno)
   --- sul telefono che tiene la partita (l'host; col Bot e sullo stesso telefono questo telefono). Niente grafica ---
     prepara(P) → st         lo stato del gioco, anche coi segreti (solo dati: niente funzioni)
     tempo(st, P) → secondi  quanto si gioca (online tutti insieme; sullo stesso telefono: a testa)
     pubblico(st, P) → {}    quello che vedono tutti mentre si gioca (MAI i segreti). Va nella foto a ogni mossa
     mossa(st, id, m, P)     una mossa del giocatore id (m è quello che ha mandato A.invia, con m.ms = millisecondi
                             da quando gli si è aperto il pannello). Si risponde a lui solo con P.privato(id, msg);
                             P.fatto(id) = ha finito (quando hanno finito tutti si va avanti senza aspettare il tempo)
     privatoDi(st, id, P)    (facoltativo) i segreti di id, per chi ricarica la pagina: arrivano al suo pannello.privato
     fine(st, P) → { punti: { id: n }, riv: {…dati della rivelazione, ora anche i segreti…}, carrello: { id: [prodotti] } }
     durata(riv, P) → ms     quanto dura la rivelazione (l'host aspetta tanto così)
     bot(st, bot, P) → [ { ms, m } ]   le mosse di un Bot ({ id, nome, livello: "facile"|"medio"|"difficile" }):
                             il Bot sa il prezzo vero e sbaglia apposta; le mosse arrivano alla mossa() a quei millisecondi
   --- su ogni telefono (grafica). A = gli aiuti del telefono ---
     schermo(A) → { aggiorna(pub) }      il maxischermo mentre si gioca (A.sch, già vuoto)
     pannello(A) → { aggiorna(pub), privato(msg), tempo() }   il pannello in basso del giocatore A.io (in A.pan).
                             privato(msg) = quello che gli ha mandato P.privato; tempo() = il tempo è finito
     rivela(A) → Promise     la rivelazione sul maxischermo (A.riv, A.punti); deve durare circa durata(riv)
   P (host): ids, n, modo, locale, nome(id), rnd(), mescola(a), pesca(filtro, n) → prodotti COL prezzo (mai due volte nella
             partita, dalle categorie scelte), passo(p), margine(p, pct), arrotonda(v, p), fmtE(v), tondo2(v), privato(id, msg), fatto(id)
   A (telefono): el, ST (lo studio), S, Z (window.SGPrezzoScena: scheda, tastierino, contachilometri, FX…), sch, pan, pub, riv, punti,
             io, locale, fine (ora della fine del tempo), giocatori [{ id, nome, omino }], nome(id), fac(id, faccia), invia(m),
             dorme(ms), vivo(), fmtE, fmtN, FX, vibra, scheda(prod, opz), contachilometri(v, opz), tastierino(opz)
   ========================================================= */
(function () {
  "use strict";
  var PREMI = window.SG_PREZZO_PREMI = window.SG_PREZZO_PREMI || {};
  var ZONA = 0.03;                    // «🎯 Preso!» entro il 3% (o un passo del prezzo)
  var SCALA = [400, 300, 250], DOPO = 200;
  function preso(v, prezzo, P) { return Math.abs(v - prezzo) <= Math.max(prezzo * ZONA, P.passo(prezzo)) + 1e-9; }
  function sec(ms) { return (Math.round((+ms || 0) / 100) / 10).toFixed(1).replace(".", ",") + " s"; }

  PREMI.piuomeno = {
    nome: "Più o meno", icona: "🔼🔽", ordine: 1,
    regola: "Scrivi un prezzo: il telefono ti dice ⬆️ più su o ⬇️ più giù. Chi lo trova per primo vince!",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var prod = P.pesca(function (x) { return x.prezzo >= 20 && x.prezzo <= 2000; }, 1)[0] || P.pesca(null, 1)[0];
      return { prod: prod, trovati: {}, prove: {}, storia: {} };
    },
    tempo: function () { return 30; },
    pubblico: function (st) {
      var p = st.prod || {};
      return { prod: { e: p.e, f: p.f || null, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat },
        arrivi: Object.keys(st.trovati).sort(function (a, b) { return st.trovati[a] - st.trovati[b]; }).map(function (id) { return { id: id, ms: st.trovati[id] }; }),
        prove: st.prove };
    },
    mossa: function (st, id, m, P) {
      var v = P.tondo2(+m.v); if (!(v > 0) || st.trovati[id] != null) return;
      st.prove[id] = (st.prove[id] || 0) + 1;
      var h = st.storia[id] || (st.storia[id] = []);
      if (preso(v, st.prod.prezzo, P)) {
        st.trovati[id] = Math.max(0, Math.round(+m.ms || 0));
        h.push({ v: v, e: "si" });
        P.privato(id, { e: "si", v: v, ms: st.trovati[id] });
        P.fatto(id);
      } else {
        var e = v < st.prod.prezzo ? "su" : "giu";
        h.push({ v: v, e: e });
        P.privato(id, { e: e, v: v });
      }
    },
    privatoDi: function (st, id) { return { storia: st.storia[id] || [], trovato: st.trovati[id] != null ? st.trovati[id] : null }; },
    fine: function (st, P) {
      var ord = Object.keys(st.trovati).sort(function (a, b) { return st.trovati[a] - st.trovati[b]; });
      var punti = {}, carrello = {};
      ord.forEach(function (id, i) { punti[id] = i < SCALA.length ? SCALA[i] : DOPO; });
      if (ord.length) carrello[ord[0]] = [st.prod];   // chi lo trova per primo se lo porta a casa
      var ultimo = function (id) { var h = st.storia[id] || []; return h.length ? h[h.length - 1] : null; };
      return { punti: punti, carrello: carrello,
        riv: { prod: st.prod, arrivi: ord.map(function (id) { return { id: id, ms: st.trovati[id], prove: st.prove[id] || 0, punti: punti[id] }; }),
          altri: P.ids.filter(function (id) { return st.trovati[id] == null; }).map(function (id) { var u = ultimo(id); return { id: id, prove: st.prove[id] || 0, v: u ? u.v : null, e: u ? u.e : null }; }) } };
    },
    durata: function (riv) { return 1300 + 2700 + ((riv.arrivi || []).length + (riv.altri || []).length) * 550 + 2300; },
    // il Bot cerca come una persona: prima una stima, poi più su / più giù dimezzando (sbaglia di più se è facile)
    bot: function (st, bot, P) {
      var prezzo = st.prod.prezzo, err = { facile: 0.45, medio: 0.25, difficile: 0.12 }[bot.livello] || 0.25;
      var passo = bot.livello === "difficile" ? 1700 : bot.livello === "medio" ? 2400 : 3200;
      var t = 2000 + P.rnd() * 2500, lo = 0, hi = Infinity, v = prezzo * Math.exp((P.rnd() * 2 - 1) * err * 1.4), mosse = [];
      for (var i = 0; i < 14 && t < 29000; i++) {
        v = Math.max(P.passo(prezzo), P.arrotonda(v, prezzo));
        mosse.push({ ms: Math.round(t), m: { v: v } });
        if (preso(v, prezzo, P)) break;
        if (v < prezzo) lo = Math.max(lo, v); else hi = Math.min(hi, v);
        if (hi === Infinity) v = v * (1.35 + P.rnd() * 0.5);
        else if (!lo) v = v * (0.45 + P.rnd() * 0.25);
        else v = (lo + hi) / 2 * (1 + (P.rnd() - 0.5) * err * 0.5);
        t += passo + P.rnd() * 1400;
      }
      return mosse;
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      var el = A.el, pub = A.pub || {};
      var lista = el("div", { class: "pz-righe" + (A.giocatori.length > 4 ? " due" : "") });
      var titolo = el("div", { class: "pz-sotto", text: "🏁 Chi l'ha trovato" });
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🔼🔽 Più o meno" }));
      A.sch.appendChild(A.scheda(pub.prod || {}, { cls: "media" }));
      A.sch.appendChild(titolo);
      A.sch.appendChild(lista);
      var visti = {};
      function aggiorna(p) {
        (p.arrivi || []).forEach(function (a, i) {
          if (visti[a.id]) return; visti[a.id] = 1;
          var r = el("div", { class: "pz-riga su giusto" }, [ el("span", { class: "nm", style: "flex:0 0 auto", text: (i + 1) + "°" }), A.fac(a.id), el("span", { class: "nm", text: A.nome(a.id) }), el("span", { class: "v", text: sec(a.ms) }) ]);
          lista.appendChild(r); A.FX.din();
        });
        titolo.textContent = (p.arrivi || []).length ? "🏁 Chi l'ha trovato" : "🏁 Nessuno l'ha ancora trovato…";
      }
      aggiorna(pub);
      return { aggiorna: aggiorna };
    },
    pannello: function (A) {
      var el = A.el, finito = false;
      var esito = el("div", { class: "pz-nota forte", text: "Scrivi un prezzo e tocca «Prova!»" });
      var storia = el("div", { class: "pz-offrow" });
      var tast = A.tastierino({ cent: false, continuo: true, testoOk: "🔍 Prova!", onOk: function (v) { A.invia({ v: v }); } });
      A.pan.appendChild(esito); A.pan.appendChild(storia); A.pan.appendChild(tast.el);
      function segna(x) {
        var c = el("span", { class: "pz-offch" + (x.e === "si" ? " mia" : "") }, [ el("span", { text: A.fmtE(x.v) }), el("b", { text: x.e === "su" ? "⬆️" : x.e === "giu" ? "⬇️" : "🎯" }) ]);
        storia.insertBefore(c, storia.firstChild);
        while (storia.children.length > 4) storia.removeChild(storia.lastChild);
      }
      function risposta(m) {
        if (finito) return;
        if (m.storia) { m.storia.forEach(segna); if (m.trovato != null) { finito = true; esito.textContent = "🎯 Preso in " + sec(m.trovato) + "!"; tast.blocca("🎯 Preso!"); } else tast.riapri(); return; }
        segna(m);
        if (m.e === "si") {
          finito = true; esito.textContent = "🎯 PRESO! in " + sec(m.ms); tast.blocca("🎯 Preso!");
          A.FX.din(); A.vibra([30, 40, 70]);
        } else {
          esito.textContent = m.e === "su" ? "⬆️ PIÙ SU!" : "⬇️ PIÙ GIÙ!";
          esito.classList.remove("pz-scuoti"); void esito.offsetWidth; esito.classList.add("pz-scuoti");
          A.FX.toc(m.e === "su" ? 880 : 440);
          tast.svuota(); tast.riapri();   // si riscrive da capo (il prezzo provato resta nelle chip qui sopra)
        }
      }
      return { privato: risposta, tempo: function () { if (!finito) { esito.textContent = "⏰ Tempo scaduto"; tast.blocca("⏰ Tempo scaduto"); } } };
    },
    rivela: async function (A) {
      var el = A.el, riv = A.riv || {}, prod = riv.prod || {};
      var conta = A.contachilometri(prod.prezzo || 0, { grande: true });
      var righe = el("div", { class: "pz-righe" + (((riv.arrivi || []).length + (riv.altri || []).length) > 4 ? " due" : "") }), banner = el("div", { class: "pz-sotto" });
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🔼🔽 Più o meno" }));
      A.sch.appendChild(el("div", { class: "pz-miniprod" }, [ A.Z.figura(el, prod, "e"), el("span", { class: "n", text: prod.nome || "" }) ]));
      A.sch.appendChild(conta.el); A.sch.appendChild(righe); A.sch.appendChild(banner);
      A.ST.FX.rullo(1.1); await A.dorme(1300); if (!A.vivo()) return;
      await conta.via(260); if (!A.vivo()) return;
      (riv.arrivi || []).forEach(function () {});
      var lista = (riv.arrivi || []).map(function (a, i) { return { id: a.id, tx: sec(a.ms) + " · " + a.prove + (a.prove === 1 ? " prova" : " prove"), bd: (i + 1) + "°", cls: "giusto", punti: a.punti }; })
        .concat((riv.altri || []).map(function (a) { return { id: a.id, tx: a.v != null ? A.fmtE(a.v) + (a.e === "su" ? " ⬆️" : " ⬇️") : "nessuna prova", bd: "non trovato", cls: "sopra", punti: 0 }; }));
      for (var i = 0; i < lista.length; i++) {
        if (!A.vivo()) return;
        var x = lista[i], r = el("div", { class: "pz-riga su " + x.cls }, [ A.fac(x.id, x.punti ? "esulta" : "triste"), el("span", { class: "nm", text: A.nome(x.id) }), el("span", { class: "v", text: x.tx }), el("span", { class: "bd", text: x.bd }) ]);
        if (x.punti) r.appendChild(el("span", { class: "pt", text: "+" + A.fmtN(x.punti) }));
        righe.appendChild(r); A.FX.toc(520 + i * 60);
        await A.dorme(550);
      }
      var primi = riv.arrivi || [];
      banner.className = primi.length ? "pz-banner" : "pz-banner no";
      banner.textContent = primi.length ? (A.nome(primi[0].id) === "Tu" ? "🏆 L'hai trovato per primo!" : "🏆 " + A.nome(primi[0].id) + " l'ha trovato per primo!") : "😱 Nessuno l'ha trovato!";
      A.ST.pubblico(A.S, primi.length ? "applauso" : "ohh");
      await A.dorme(2300);
    }
  };
})();
