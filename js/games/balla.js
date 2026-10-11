/* =========================================================
   GIOCO — "La Balla Colossale" (ispirato a Balderdash / Fibbage)
   Un telefono solo, nello studio del game show (js/studio.js). Niente bot.
   Ogni round sul maxischermo esce una notizia VERA ma incredibile, con un pezzo mancante.
   1. A turno ognuno, in segreto, scrive una BALLA credibile per completarla.
   2. Le balle e la risposta vera si mescolano (due balle uguali diventano una sola).
   3. A turno ognuno vota in segreto quella che crede vera (la sua non la può votare).
   4. La rivelazione: +2 a chi trova la verità, +1 all'autore di una balla per ogni voto che prende.
   Le notizie sono in data/balla-domande.js: SG_BALLA = [{ domanda, rispostaVera }].
   La domanda finisce con "..." (il pezzo mancante va in fondo) oppure ha "___" dove va il pezzo.
   ========================================================= */
(function () {
  "use strict";

  var ST = window.SGStudio;
  var MAX_BALLA = 45;   // caratteri al massimo per una balla
  var MANO = "'Segoe Print','Bradley Hand','Chalkboard SE','Marker Felt','Comic Sans MS',cursive";
  var CARTA = "Georgia,'Times New Roman',serif";

  // =========================================================
  //  LE REGOLE (senza grafica: serviranno uguali anche all'online)
  // =========================================================
  function mescola(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = b[i]; b[i] = b[j]; b[j] = x; } return b; }
  // per confrontare due frasi: minuscole, senza accenti, punteggiatura e articoli
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(il|lo|la|i|gli|le|l|un|uno|una)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  function distanza(a, b) {   // quante lettere cambiare per passare da a a b
    var r = [], i, j;
    for (j = 0; j <= b.length; j++) r.push(j);
    for (i = 1; i <= a.length; i++) {
      var prec = r[0]; r[0] = i;
      for (j = 1; j <= b.length; j++) { var tmp = r[j]; r[j] = Math.min(r[j] + 1, r[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1)); prec = tmp; }
    }
    return r[b.length];
  }
  // la balla è (quasi) la risposta vera? (perdona un errore di battitura)
  function eLaVerita(balla, vera) {
    var a = norm(balla), b = norm(vera); if (!a) return false;
    if (a === b) return true;
    return distanza(a, b) <= (b.length >= 12 ? 2 : b.length >= 6 ? 1 : 0);
  }
  function pulisci(s) { return String(s || "").replace(/\s+/g, " ").trim().replace(/[.…]+$/, "").trim().slice(0, MAX_BALLA); }
  // le scelte del round: la verità più le balle (quelle uguali diventano una sola, con tutti i loro autori), mescolate
  function preparaScelte(vera, balle) {
    var scelte = [{ testo: vera, vera: true, autori: [] }];
    balle.forEach(function (b, i) {
      if (!b) return;
      var n = norm(b), gia = scelte.filter(function (x) { return !x.vera && norm(x.testo) === n; })[0];
      if (gia) gia.autori.push(i); else scelte.push({ testo: b, vera: false, autori: [i] });
    });
    return mescola(scelte);
  }
  // i punti del round: voti[i] = la scelta votata da i. Restituisce, per ogni giocatore, i punti presi con la verità e con le balle
  function calcola(scelte, voti, n) {
    var d = []; for (var i = 0; i < n; i++) d.push({ vera: 0, inganni: 0 });
    voti.forEach(function (v, i) {
      if (v == null || !scelte[v]) return;
      if (scelte[v].vera) d[i].vera += 2;
      else scelte[v].autori.forEach(function (a) { if (a !== i) d[a].inganni += 1; });
    });
    return d;
  }
  // la domanda divisa attorno al pezzo mancante
  function pezzi(domanda) {
    var s = String(domanda || "").trim(), m = s.match(/_{3,}/);
    if (m) return { prima: s.slice(0, m.index).trim(), dopo: s.slice(m.index + m[0].length).trim() };
    return { prima: s.replace(/(\.\.\.|…)\s*$/, "").trim(), dopo: "" };
  }

  // ---- quali notizie: mai le stesse finché non le avete viste tutte (ricordate su questo telefono) ----
  var CHIAVE_VISTE = "sg-balla-viste";
  function chiave(d) { return String(d.domanda).slice(0, 60); }
  function scegliDomande(n) {
    var tutte = (window.SG_BALLA || []).filter(function (d) { return d && d.domanda && d.rispostaVera; });
    var viste = {}; try { (JSON.parse(localStorage.getItem(CHIAVE_VISTE) || "[]") || []).forEach(function (k) { viste[k] = 1; }); } catch (e) {}
    var scelte = mescola(tutte.filter(function (d) { return !viste[chiave(d)]; })).slice(0, n);
    if (scelte.length < n) {   // finite le nuove: si ricomincia il giro di tutte
      viste = {};
      scelte = scelte.concat(mescola(tutte.filter(function (d) { return scelte.indexOf(d) < 0; })).slice(0, n - scelte.length));
    }
    scelte.forEach(function (d) { viste[chiave(d)] = 1; });
    try { localStorage.setItem(CHIAVE_VISTE, JSON.stringify(Object.keys(viste).slice(-600))); } catch (e) {}
    return scelte;
  }

  SG.registra({
    id: "balla",
    nome: "La Balla Colossale",
    icona: "🤥",
    descrizione: "Notizie vere ma incredibili, con un pezzo mancante. Inventate una balla credibile e scovate quella vera in mezzo alle vostre!",
    giocatoriMin: 3,
    giocatoriMax: 8,
    difficolta: 2,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono: niente bot", amici: true }],
    regole: [
      "Sul maxischermo esce una <b>notizia vera</b> ma incredibile, con un pezzo mancante.",
      "A turno ognuno, in segreto, scrive una <b>balla</b> per completarla: deve sembrare vera, per ingannare gli altri.",
      "Poi tutte le balle e la risposta vera si mescolano e a turno ognuno <b>vota</b> in segreto quella che crede vera. La propria balla non si può votare.",
      "<b>+2 punti</b> a chi trova la risposta vera. <b>+1 punto</b> a chi ha scritto una balla, per ogni amico che ci è cascato.",
      "Dopo l'ultimo round vince chi ha più punti."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, br = {};
      dove.round = 5;
      box.appendChild(el("div", { class: "etichetta", text: "Quante notizie" }));
      function scegliRound(v) { dove.round = v; [3, 5, 7].forEach(function (x) { br[x].className = "modo-chip" + (v === x ? " attiva" : ""); }); }
      var gR = el("div", { class: "modo-griglia" });
      [3, 5, 7].forEach(function (v) {
        br[v] = el("button", { class: "modo-chip" + (v === 5 ? " attiva" : ""), onclick: function () { scegliRound(v); } }, [
          el("div", {}, [ el("div", { class: "mt", text: v + " round" }), el("div", { class: "ms", text: v === 3 ? "Una partita veloce" : v === 5 ? "Il giusto" : "Serata lunga" }) ]) ]);
        gR.appendChild(br[v]);
      });
      box.appendChild(gR);
      box.appendChild(el("p", { class: "modulo-nota", text: "Ogni round: si scrivono le balle passandosi il telefono, poi si vota, sempre in segreto." }));
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      var domande = scegliDomande(imp.round || 5);
      if (!domande.length) return niente(t);
      assicuraStile();
      var st = { t: t, domande: domande, giri: domande.length, giro: 0,
        g: t.giocatori.map(function (n) { return { nome: n, punti: 0 }; }) };
      st.S = ST.crea(t, st.g.map(function (g) { return { nome: g.nome }; }), { io: -1, esci: t.esci, titolo: "La Balla Colossale", logo: ["LA BALLA", "COLOSSALE"] });
      ST.apertura(st.S).then(function () { round(st); });
    }
  });

  function niente(t) {
    var s = t.schermata({ icona: "🤥", titolo: "Mancano le notizie", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "Le notizie del gioco non sono state caricate." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  NELLO STUDIO: un round
  // =========================================================
  function fac(el, g, faccia) { return el("span", { class: "fac", html: ST.avatarDi(g, faccia) }); }
  // il ritaglio di giornale con la notizia; risposta = il pezzo da mettere al posto del buco (null = il buco giallo)
  function ritaglio(el, st, risposta, grande) {
    var p = pezzi(st.d.domanda), buco = el("span", { class: "bc-buco" + (risposta ? " pieno" : ""), text: risposta || "" });
    return el("div", { class: "bc-ritaglio" + (grande ? " grande" : "") }, [
      el("div", { class: "bc-testata", text: "📰 Notizia vera · round " + (st.giro + 1) + " di " + st.giri }),
      el("p", { class: "bc-notizia" }, [ document.createTextNode(p.prima + " "), buco, document.createTextNode(p.dopo ? " " + p.dopo : "") ])
    ]);
  }

  async function round(st) {
    var S = st.S; if (!S.vivo()) return;
    st.d = st.domande[st.giro];
    st.balle = st.g.map(function () { return ""; });
    st.voti = st.g.map(function () { return null; });
    st.fatti = st.g.map(function () { return false; });
    ST.tutteNormali(S);
    st.g.forEach(function (g, i) { ST.puntiLeggio(S, i, g.punti, 0); });
    // la notizia sul maxischermo, da leggere ad alta voce
    ST.viaBarra(S); ST.accendiSolo(S, -1);
    await ST.suSchermo(S, 800);
    schermoTurno(st, null, "scrive");
    ST.FX.rullo(1);
    await ST.dorme(1100);
    ST.pubblico(S, "piano");
    await ST.aspettaTasto(S, "Letta! Ora le balle ✍️");
    for (var i = 0; i < st.g.length; i++) {
      if (!S.vivo()) return;
      await turnoScrittura(st, i);
    }
    if (!S.vivo()) return;
    st.scelte = preparaScelte(st.d.rispostaVera, st.balle);
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.largo(S, 800);
    ST.terzo(S, null, "Tutte le balle sono pronte!", "Ora si vota: qual è quella vera? 🗳️", "🤥");
    ST.pubblico(S, "applauso");
    await ST.dorme(1700); ST.viaTerzo(S);
    st.fatti = st.g.map(function () { return false; });
    for (i = 0; i < st.g.length; i++) {
      if (!S.vivo()) return;
      await turnoVoto(st, i);
    }
    if (!S.vivo()) return;
    await rivelazione(st);
    if (!S.vivo()) return;
    await punteggi(st);
  }

  // il maxischermo tra un turno e l'altro: la notizia e chi ha già finito
  function schermoTurno(st, i, cosa) {
    var S = st.S, el = st.t.el;
    ST.fermaTimer(S); ST.vuota(S.sch);
    var fatti = el("div", { class: "bc-fatti" });
    st.g.forEach(function (g, k) { fatti.appendChild(el("span", { class: st.fatti[k] ? "ok" : "" }, [ fac(el, g), el("span", { text: (st.fatti[k] ? "✅ " : "") + g.nome }) ])); });
    var chi = i == null ? (cosa === "scrive" ? "✍️ Inventate una balla per completarla!" : "🗳️ Qual è la risposta vera?")
      : (cosa === "scrive" ? "✍️ Scrive " : "🗳️ Vota ") + st.g[i].nome;
    S.sch.appendChild(el("div", { class: "bc-sch" }, [ ritaglio(el, st, null, true), el("div", { class: "bc-chi-sch", text: chi }), fatti ]));
  }

  async function turnoScrittura(st, i) {
    var S = st.S, g = st.g[i];
    schermoTurno(st, i, "scrive");
    await ST.stacco(S, i, "Passa il telefono a " + g.nome);
    await ST.aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶");
    if (!S.vivo()) return;
    ST.accendiSolo(S, i); ST.testoLeggio(S, i, "✍️ scrive");
    await ST.suLeggio(S, i, 400);
    ST.lampo(S);
    st.balle[i] = await apriBiglietto(st, i);
    if (!S.vivo()) return;
    st.fatti[i] = true;
    ST.testoLeggio(S, i, "✅ fatto"); ST.faccia(S, i, "esulta");
    schermoTurno(st, i, "scrive");
    await ST.dorme(650);
    ST.faccia(S, i, null);
  }

  async function turnoVoto(st, i) {
    var S = st.S, g = st.g[i];
    schermoTurno(st, i, "vota");
    await ST.stacco(S, i, "Passa il telefono a " + g.nome);
    await ST.aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶");
    if (!S.vivo()) return;
    ST.accendiSolo(S, i); ST.testoLeggio(S, i, "🗳️ vota");
    await ST.suLeggio(S, i, 400);
    ST.lampo(S);
    st.voti[i] = await apriVoto(st, i);
    if (!S.vivo()) return;
    st.fatti[i] = true;
    ST.testoLeggio(S, i, "✅ votato"); ST.faccia(S, i, "pensa");
    schermoTurno(st, i, "vota");
    await ST.dorme(650);
    ST.faccia(S, i, null);
  }

  // ---- il foglio segreto, sopra lo studio (si chiude da solo: niente resta a vista quando si passa il telefono) ----
  function apriVelo(S, el, nodi, cls) {
    var velo = el("div", { class: "bc-velo" }), carta = el("div", { class: "bc-carta" + (cls ? " " + cls : "") }, nodi);
    velo.appendChild(carta); S.vista.appendChild(velo);
    S.rec.classList.remove("on");
    requestAnimationFrame(function () { velo.classList.add("on"); });
    setTimeout(function () { velo.classList.add("on"); }, 90);
    return { velo: velo, carta: carta, chiudi: function (poi) {
      try { if (document.activeElement) document.activeElement.blur(); } catch (e) {}
      velo.classList.add("via");
      setTimeout(function () { velo.classList.remove("on"); setTimeout(function () { if (velo.parentNode) velo.parentNode.removeChild(velo); poi(); }, 260); }, 300);
    } };
  }
  // tante risposte lunghe su un telefono piccolo: le scritte si stringono quanto basta per stare tutte nello schermo, senza scorrere
  function adatta(v) {
    var spazio = function () { return v.velo.clientHeight - 36; }, fs = 16;
    while (v.carta.offsetHeight > spazio() && fs > 12) { fs--; v.carta.style.setProperty("--fs", fs + "px"); }
    if (v.carta.offsetHeight > spazio()) v.carta.classList.add("piccola");
  }
  function testaSegreta(el, g) { return el("div", { class: "bc-chi" }, [ fac(el, g), el("b", { text: g.nome }), el("small", { text: "🤫 guarda solo tu" }) ]); }

  // scrivere la balla: la notizia col buco, la penna, "Fatto"
  function apriBiglietto(st, i) {
    var S = st.S, el = st.t.el, g = st.g[i];
    return new Promise(function (fine) {
      var chiuso = false;
      var inp = el("textarea", { class: "bc-penna", maxlength: String(MAX_BALLA), rows: "2", autocomplete: "off", autocapitalize: "none", spellcheck: "true", enterkeyhint: "done", placeholder: "scrivi qui la tua balla…" });
      var conta = el("div", { class: "bc-conta", text: "0/" + MAX_BALLA });
      var avviso = el("div", { class: "bc-avviso" });
      var ok = el("button", { class: "btn btn-primario bc-ok", text: "✅ Fatto, nascondi", disabled: "disabled" });
      var anteprima = ritaglio(el, st, null, false), buco = anteprima.querySelector(".bc-buco");
      function aggiorna() {
        var v = pulisci(inp.value);
        conta.textContent = inp.value.length + "/" + MAX_BALLA;
        ok.disabled = !v;
        buco.textContent = v; buco.classList.toggle("pieno", !!v);   // la balla si vede già dentro la notizia
        avviso.classList.remove("on");
      }
      function finito() {
        if (chiuso) return;
        var v = pulisci(inp.value); if (!v) return;
        if (eLaVerita(v, st.d.rispostaVera)) {   // ha scritto proprio la verità: deve inventare un'altra cosa
          avviso.textContent = "😱 Questa è proprio la risposta vera! Ti è andata bene: ora scrivi una balla diversa.";
          avviso.classList.add("on"); inp.value = ""; aggiorna(); avviso.classList.add("on");
          try { inp.focus({ preventScroll: true }); } catch (e) {}
          return;
        }
        chiuso = true; ok.disabled = true;
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
        v0.chiudi(function () { fine(v); });
      }
      inp.addEventListener("input", aggiorna);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); finito(); } });
      ok.addEventListener("click", finito);
      var v0 = apriVelo(S, el, [ testaSegreta(el, g), anteprima,
        el("label", { class: "bc-scrivi" }, [ el("span", { class: "bc-et", text: "✍️ La tua balla: deve sembrare vera!" }), inp, conta ]),
        avviso, ok ]);
      setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 650);
    });
  }

  // votare: tutte le risposte, la propria balla non si può scegliere
  function apriVoto(st, i) {
    var S = st.S, el = st.t.el, g = st.g[i];
    return new Promise(function (fine) {
      var scelto = null, chiuso = false, bottoni = [];
      var ok = el("button", { class: "btn btn-primario bc-ok", text: "🗳️ Voto questa", disabled: "disabled" });
      var lista = el("div", { class: "bc-scelte" + (st.scelte.length > 6 ? " tante" : "") });
      st.scelte.forEach(function (sc, k) {
        var mia = sc.autori.indexOf(i) >= 0;
        var b = el("button", { class: "bc-scelta" + (mia ? " mia" : "") }, [ el("span", { class: "tx", text: sc.testo }), mia ? el("span", { class: "tag", text: "✍️ la tua" }) : null ]);
        if (mia) b.disabled = true;
        else b.addEventListener("click", function () {
          if (chiuso) return;
          scelto = k; bottoni.forEach(function (x, kk) { x.classList.toggle("sel", kk === k); });
          ok.disabled = false;
          try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
        });
        bottoni.push(b); lista.appendChild(b);
      });
      ok.addEventListener("click", function () { if (chiuso || scelto == null) return; chiuso = true; v0.chiudi(function () { fine(scelto); }); });
      var v0 = apriVelo(S, el, [ testaSegreta(el, g), ritaglio(el, st, null, false),
        el("div", { class: "bc-et", text: "🔍 Qual è la risposta VERA?" }), lista, ok ], st.scelte.length > 5 ? "stretta" : "");
      adatta(v0);
    });
  }

  // =========================================================
  //  LA RIVELAZIONE: prima le balle che hanno ingannato qualcuno (dalla meno votata), poi la verità
  // =========================================================
  async function rivelazione(st) {
    var S = st.S;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    st.conta = st.scelte.map(function () { return 0; });
    st.voti.forEach(function (v) { if (v != null) st.conta[v]++; });
    st.esito = calcola(st.scelte, st.voti, st.g.length);
    var ordine = st.scelte.map(function (_, k) { return k; })
      .filter(function (k) { return !st.scelte[k].vera && st.conta[k] > 0; })
      .sort(function (a, b) { return st.conta[a] - st.conta[b]; });
    var kVera = st.scelte.map(function (sc) { return sc.vera; }).indexOf(true);
    await ST.suSchermo(S, 800);
    ST.terzo(S, null, "È il momento della verità!", "Vediamo chi ci è cascato…", "🔍");
    await ST.dorme(1500); ST.viaTerzo(S);
    for (var q = 0; q < ordine.length; q++) { if (!S.vivo()) return; await mostraScelta(st, ordine[q]); }
    if (!S.vivo()) return;
    await mostraScelta(st, kVera);
    var ignorate = st.scelte.map(function (_, k) { return k; }).filter(function (k) { return !st.scelte[k].vera && st.conta[k] === 0; });
    if (ignorate.length && S.vivo()) await schermoIgnorate(st, ignorate);
  }

  function chiHaVotato(st, k) { var l = []; st.voti.forEach(function (v, i) { if (v === k) l.push(i); }); return l; }
  function nomi(st, lista) { var n = lista.map(function (i) { return st.g[i].nome; }); return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " e " + n[n.length - 1]; }

  function mostraScelta(st, k) {
    var S = st.S, el = st.t.el, sc = st.scelte[k], votanti = chiHaVotato(st, k);
    return new Promise(async function (fine) {
      ST.fermaTimer(S); ST.vuota(S.sch);
      var gente = el("div", { class: "bc-gente" });
      var timbro = el("div", { class: "bc-timbro " + (sc.vera ? "vero" : "balla"), text: sc.vera ? "Vero!" : "Balla!" });
      var biglietto = el("div", { class: "bc-big" }, [ el("span", { class: "tx", text: sc.testo }), timbro ]);
      var sotto = el("div", { class: "bc-sotto" });
      S.sch.appendChild(el("div", { class: "bc-sch riv" }, [
        el("div", { class: "bc-giro", text: votanti.length ? (votanti.length === 1 ? "1 voto" : votanti.length + " voti") : "Nessun voto" }),
        biglietto, gente, sotto ]));
      // chi l'ha votata, uno alla volta
      for (var q = 0; q < votanti.length; q++) {
        await ST.dorme(q ? 380 : 650);
        var v = votanti[q];
        gente.appendChild(el("span", { class: "bc-votante" }, [ fac(el, st.g[v]), el("span", { text: st.g[v].nome }) ]));
        try { if (navigator.vibrate) navigator.vibrate(6); } catch (e) {}
      }
      if (!votanti.length) gente.appendChild(el("span", { class: "bc-nessuno", text: "Nessuno l'ha votata…" }));
      await ST.dorme(700);
      ST.FX.rullo(1.1);
      await ST.dorme(1250);
      if (!S.vivo()) return fine();
      timbro.classList.add("on");
      if (sc.vera) {
        sotto.appendChild(el("div", { class: "bc-intera" }, [ el("small", { text: "La notizia vera:" }), ritaglio(el, st, sc.testo, false) ]));
        if (votanti.length) {
          sotto.appendChild(el("div", { class: "bc-premio si", text: "+2 punti a " + nomi(st, votanti) }));
          gente.querySelectorAll(".bc-votante").forEach(function (n) { n.classList.add("giusto"); });
          votanti.forEach(function (v) { ST.faccia(S, v, "evviva"); });
          ST.pubblico(S, "ovazione"); ST.coriandoli();
        } else {
          sotto.appendChild(el("div", { class: "bc-premio no", text: "Nessuno ha trovato la verità! 😱" }));
          ST.pubblico(S, "ohh");
        }
      } else {
        gente.querySelectorAll(".bc-votante").forEach(function (n) { n.classList.add("cascato"); });
        votanti.forEach(function (v) { ST.faccia(S, v, "esploso"); });
        sc.autori.forEach(function (a) { ST.faccia(S, a, "esulta"); });
        var guadagno = sc.autori.map(function (a) { return votanti.filter(function (v) { return v !== a; }).length; });
        sotto.appendChild(el("div", { class: "bc-autore" }, [
          el("small", { text: sc.autori.length > 1 ? "L'hanno scritta in due:" : "L'ha scritta" }),
          el("div", { class: "bc-autori" }, sc.autori.map(function (a, n) { return el("span", { class: "bc-votante autore" }, [ fac(el, st.g[a], "esulta"), el("span", { text: st.g[a].nome + " +" + guadagno[n] }) ]); }))
        ]));
        ST.pubblico(S, "ohh");
      }
      try { if (navigator.vibrate) navigator.vibrate(sc.vera ? [30, 40, 30] : 25); } catch (e) {}
      await ST.dorme(900);
      await ST.aspettaTasto(S, "Avanti ▶");
      fine();
    });
  }

  // le balle a cui non ha creduto nessuno (sul maxischermo, tutte insieme)
  async function schermoIgnorate(st, lista) {
    var S = st.S, el = st.t.el;
    ST.fermaTimer(S); ST.vuota(S.sch);
    var righe = el("div", { class: "bc-ignorate" });
    lista.forEach(function (k, n) {
      var sc = st.scelte[k], r = el("div", { class: "bc-ign" }, [ el("span", { class: "tx", text: sc.testo }), el("span", { class: "di", text: nomi(st, sc.autori) }) ]);
      r.style.animationDelay = (n * 0.12) + "s"; righe.appendChild(r);
    });
    S.sch.appendChild(el("div", { class: "bc-sch" }, [ el("div", { class: "bc-chi-sch", text: "🙄 Balle a cui non ha creduto nessuno" }), righe ]));
    ST.pubblico(S, "piano");
    await ST.aspettaTasto(S, "Vediamo i punti ▶");
  }

  // i punti scorrono sui leggii, poi la classifica sul maxischermo (o il gran finale)
  async function punteggi(st) {
    var S = st.S, t = st.t, el = t.el;
    ST.viaBarra(S); ST.tutteNormali(S);
    await ST.largo(S, 900);
    ST.terzo(S, null, "Fine del round " + (st.giro + 1), "Ecco i punti!", "🏁");
    for (var i = 0; i < st.g.length; i++) {
      var d = st.esito[i], piu = d.vera + d.inganni;
      st.g[i].punti += piu; st.g[i].ultimo = piu;
      ST.puntiLeggio(S, i, st.g[i].punti, piu);
      ST.faccia(S, i, piu > 0 ? "esulta" : "triste");
      await ST.dorme(320);
    }
    ST.pubblico(S, "applauso");
    await ST.dorme(1700); ST.viaTerzo(S); ST.tutteNormali(S);
    var ordine = st.g.slice().sort(function (x, y) { return y.punti - x.punti; });
    if (st.giro + 1 >= st.giri) {
      await ST.finale(S, st.g.indexOf(ordine[0]), ordine[0].punti + " punti");
      return t.fine(ordine.map(function (g) { return { nome: g.nome, punti: g.punti }; }));
    }
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "bc-clas" }, [ el("h2", { text: "🏁 Classifica dopo " + (st.giro + 1) + " round" }) ]);
    ordine.forEach(function (g, k) {
      var r = el("div", { class: "bc-cl" + (k === 0 ? " primo" : "") }, [
        el("span", { class: "pos", text: ["🥇", "🥈", "🥉"][k] || (k + 1) + "°" }), fac(el, g), el("span", { class: "nm", text: g.nome }),
        el("span", { class: "pt", text: String(g.punti) }), el("span", { class: "pi", text: "+" + (g.ultimo || 0) })
      ]);
      r.style.animationDelay = (k * 0.1) + "s";
      box.appendChild(r);
    });
    S.sch.appendChild(box);
    await ST.aspettaTasto(S, "Prossima notizia ▶");
    st.giro += 1;
    round(st);
  }

  // =========================================================
  //  LO STILE (prefisso bc-)
  // =========================================================
  function assicuraStile() {
    if (document.getElementById("sg-balla-css")) return;
    var s = document.createElement("style"); s.id = "sg-balla-css";
    s.textContent = [
      ".bc-sch .fac,.bc-chi .fac,.bc-cl .fac{border-radius:50%;overflow:hidden;background:rgba(255,255,255,.12);flex:0 0 auto}",
      ".bc-sch .fac svg,.bc-chi .fac svg,.bc-cl .fac svg{width:100%;height:100%;display:block}",
      // il maxischermo
      ".bc-sch{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:0 4px}",
      ".bc-chi-sch{font-size:22px;font-weight:900;color:#fff}",
      ".bc-giro{font-size:14px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#cdd6ff}",
      ".bc-fatti{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:96%}",
      ".bc-fatti>span{display:flex;align-items:center;gap:6px;font-size:16px;font-weight:800;background:rgba(255,255,255,.1);border-radius:99px;padding:3px 11px 3px 3px}",
      ".bc-fatti>span.ok{background:rgba(55,212,126,.25)}",
      ".bc-fatti .fac{width:30px;height:30px}",
      // il ritaglio di giornale
      ".bc-ritaglio{position:relative;width:100%;max-width:440px;margin:0 auto;padding:12px 14px 14px;text-align:left;color:#231c12;font-family:" + CARTA + ";",
        "background:linear-gradient(transparent 0 0),repeating-linear-gradient(0deg,rgba(80,60,30,.035) 0 2px,transparent 2px 5px),#f6eedb;",
        "border-radius:3px;box-shadow:0 10px 26px rgba(0,0,0,.4);transform:rotate(-1.2deg)}",
      ".bc-ritaglio:before,.bc-ritaglio:after{content:'';position:absolute;left:0;right:0;height:7px;background:radial-gradient(circle at 5px 0,transparent 4px,#f6eedb 4.5px) 0 0/10px 7px repeat-x}",
      ".bc-ritaglio:before{top:-6px;transform:scaleY(-1)}.bc-ritaglio:after{bottom:-6px}",
      ".bc-testata{font-family:system-ui,sans-serif;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#c92a2a;border-bottom:2px solid #231c12;padding-bottom:5px;margin-bottom:7px}",
      ".bc-notizia{margin:0;font-size:19px;line-height:1.4;font-weight:700}",
      ".bc-ritaglio.grande .bc-notizia{font-size:23px}",
      ".bc-buco{display:inline-block;min-width:5.5em;min-height:1.1em;padding:0 4px;border-bottom:3px solid #c92a2a;background:#ffe066;border-radius:3px 3px 0 0;vertical-align:baseline}",
      ".bc-buco.pieno{min-width:0;font-family:" + MANO + ";color:#1d2a5c;font-weight:700}",
      // il foglio segreto
      ".bc-velo{position:absolute;inset:0;z-index:21;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(12px + env(safe-area-inset-top)) 12px 24px;background:rgba(7,4,26,.72);opacity:0;pointer-events:none;transition:opacity .25s}",
      ".bc-velo.on{opacity:1;pointer-events:auto}",
      ".bc-carta{position:relative;margin:0 auto;max-width:460px;display:flex;flex-direction:column;gap:12px;animation:bcEntra .55s cubic-bezier(.2,1.2,.4,1) both}",
      ".bc-velo.via .bc-carta{animation:bcEsce .3s ease-in forwards}",
      "@keyframes bcEntra{from{transform:translateY(40%) scale(.3) rotate(-6deg);opacity:0}to{transform:none;opacity:1}}",
      "@keyframes bcEsce{to{transform:translateY(55%) scale(.3) rotate(5deg);opacity:0}}",
      ".bc-chi{display:flex;align-items:center;gap:8px;color:#fff;font-size:20px;padding-right:46px}",
      ".bc-chi .fac{width:44px;height:44px}",
      ".bc-chi small{margin-left:auto;font-size:13px;font-weight:800;color:#ffe066}",
      ".bc-scrivi{display:block;background:#fffdf4;border-radius:14px;padding:10px 12px 8px;box-shadow:0 8px 20px rgba(0,0,0,.35)}",
      ".bc-et{display:block;font-size:14px;font-weight:900;color:#5a4a9a;margin-bottom:4px}",
      ".bc-carta>.bc-et{color:#fff;font-size:16px;text-align:center;margin:2px 0 -4px}",
      ".bc-penna{display:block;width:100%;box-sizing:border-box;resize:none;border:0;border-bottom:2px dashed rgba(29,42,92,.3);background:transparent;font-family:" + MANO + ";font-size:24px;line-height:1.3;color:#1d2a5c;padding:2px;outline:none;border-radius:0}",
      ".bc-penna:focus{border-bottom-color:#c92a2a}",
      ".bc-conta{text-align:right;font-size:12px;font-weight:800;color:#8a8fb0;margin-top:3px}",
      ".bc-avviso{display:none;background:#fff3bf;color:#5c3c00;border-radius:12px;padding:9px 12px;font-weight:800;font-size:15px;line-height:1.35}",
      ".bc-avviso.on{display:block;animation:bcScuoti .4s}",
      "@keyframes bcScuoti{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}",
      ".bc-ok{width:100%;margin:0}",
      // le scelte da votare
      ".bc-scelte{display:flex;flex-direction:column;gap:8px}",
      ".bc-scelta{display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:2px solid #e2d8c3;border-radius:14px;background:#fffdf4;color:#1d2a5c;padding:9px 12px;font-family:" + MANO + ";font-size:20px;font-weight:700;line-height:1.25;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s}",
      ".bc-scelta:active{transform:scale(.97)}",
      ".bc-scelta .tx{flex:1;min-width:0;overflow-wrap:anywhere}",
      ".bc-scelta.sel{border-color:#f59f00;background:#fff3bf;box-shadow:0 0 0 3px rgba(245,159,0,.35)}",
      ".bc-scelta.mia{opacity:.55;cursor:default}",
      ".bc-scelta .tag{flex:0 0 auto;font-family:system-ui,sans-serif;font-size:11px;font-weight:900;color:#fff;background:#5a4a9a;border-radius:99px;padding:3px 8px}",
      ".bc-scelte.tante .bc-scelta{font-size:var(--fs,16px);line-height:1.18;padding:6px 10px}",
      ".bc-carta.piccola .bc-notizia{font-size:13px}.bc-carta.piccola .bc-testata{display:none}.bc-carta.piccola .bc-chi small{display:none}",
      ".bc-carta.stretta{gap:8px}.bc-carta.stretta .bc-ritaglio{padding:8px 12px 10px}.bc-carta.stretta .bc-notizia{font-size:15px}.bc-carta.stretta .bc-scelte{gap:6px}.bc-carta.stretta .bc-chi{font-size:17px}.bc-carta.stretta .bc-chi .fac{width:36px;height:36px}",
      // la rivelazione
      ".bc-sch.riv{gap:22px}",
      ".bc-big{position:relative;width:100%;max-width:420px;box-sizing:border-box;padding:22px 16px 30px;border-radius:16px;background:#fffdf4;color:#1d2a5c;box-shadow:0 14px 30px rgba(0,0,0,.45);transform:rotate(-1deg);animation:bcEntra .5s cubic-bezier(.2,1.2,.4,1) both}",
      ".bc-big .tx{font-family:" + MANO + ";font-size:30px;font-weight:700;line-height:1.2;overflow-wrap:anywhere}",
      ".bc-timbro{position:absolute;right:8px;bottom:-26px;padding:2px 14px;border:5px solid currentColor;border-radius:10px;font-family:system-ui,sans-serif;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;background:rgba(255,255,255,.88);transform:rotate(12deg) scale(3);opacity:0;pointer-events:none}",
      ".bc-timbro.balla{color:#e03131}.bc-timbro.vero{color:#2b8a3e}",
      ".bc-timbro.on{animation:bcTimbro .45s cubic-bezier(.3,1.5,.5,1) forwards}",
      "@keyframes bcTimbro{from{transform:rotate(12deg) scale(3);opacity:0}to{transform:rotate(12deg) scale(1);opacity:1}}",
      ".bc-gente,.bc-autori{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}",
      ".bc-votante{display:flex;align-items:center;gap:6px;font-size:17px;font-weight:800;background:rgba(255,255,255,.12);border-radius:99px;padding:3px 12px 3px 3px;animation:bcPop .35s cubic-bezier(.3,1.6,.5,1) both}",
      ".bc-votante .fac{width:34px;height:34px}",
      ".bc-votante.cascato{background:rgba(255,93,108,.28)}",
      ".bc-votante.giusto{background:rgba(55,212,126,.35)}",
      ".bc-votante.autore{background:rgba(255,212,59,.3);font-size:19px}",
      ".bc-votante.autore .fac{width:42px;height:42px}",
      "@keyframes bcPop{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}",
      ".bc-nessuno{font-weight:800;color:#cdd6ff}",
      ".bc-sotto{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}",
      ".bc-autore{display:flex;flex-direction:column;align-items:center;gap:6px;animation:bcPop .4s .1s both}",
      ".bc-autore small,.bc-intera small{font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#cdd6ff}",
      ".bc-intera{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;animation:bcPop .45s .1s both}",
      ".bc-intera .bc-ritaglio{transform:rotate(.8deg)}",
      ".bc-premio{font-size:18px;font-weight:900;padding:6px 14px;border-radius:99px;animation:bcPop .4s .25s both}",
      ".bc-premio.si{background:#37d47e;color:#04321c}.bc-premio.no{background:rgba(255,93,108,.3);color:#ffd0d5}",
      ".bc-ignorate{display:flex;flex-direction:column;gap:8px;width:100%;max-width:420px}",
      ".bc-ign{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);border-radius:12px;padding:8px 12px;text-align:left;animation:bcPop .35s both}",
      ".bc-ign .tx{flex:1;min-width:0;font-family:" + MANO + ";font-size:19px;font-weight:700;overflow-wrap:anywhere}",
      ".bc-ign .di{flex:0 0 auto;max-width:40%;font-size:13px;font-weight:800;color:#ffe066;text-align:right}",
      // la classifica
      ".bc-clas{flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px}",
      ".bc-clas h2{margin:0 0 6px;text-align:center;font-size:24px}",
      ".bc-cl{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;border-radius:14px;background:rgba(255,255,255,.07);animation:bcPop .45s ease both}",
      ".bc-cl.primo{background:rgba(255,212,59,.18);border:1px solid rgba(255,212,59,.5)}",
      ".bc-cl .pos{width:28px;text-align:center;font-weight:900}",
      ".bc-cl .fac{width:40px;height:40px}",
      ".bc-cl .nm{flex:1;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".bc-cl .pt{font-weight:900;color:#ffe066}",
      ".bc-cl .pi{font-size:12px;font-weight:800;color:#6ff0a6;margin-left:4px}",
      "@media (prefers-reduced-motion:reduce){.bc-carta,.bc-big,.bc-votante,.bc-timbro.on,.bc-cl,.bc-ign{animation:none}.bc-timbro.on{transform:rotate(12deg);opacity:1}}"
    ].join("");
    document.head.appendChild(s);
  }

  // per le prove (e per l'online, più avanti): le regole senza grafica
  window.__balla = { norm: norm, eLaVerita: eLaVerita, preparaScelte: preparaScelte, calcola: calcola, pezzi: pezzi, pulisci: pulisci };
})();
