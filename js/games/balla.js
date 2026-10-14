/* =========================================================
   GIOCO — "La Balla Colossale" (ispirato a Balderdash / Fibbage)
   Nello studio del game show (js/studio.js): su un telefono solo (ce lo si passa) oppure online. Niente bot.
   Ogni round sul maxischermo esce una notizia VERA ma incredibile, con un pezzo mancante.
   1. A turno ognuno, in segreto, scrive una BALLA credibile per completarla.
   2. Le balle e la risposta vera si mescolano (due balle uguali diventano una sola); se le risposte
      sono meno di 5 la "redazione" aggiunge qualche balla sua (balleCasa: chi ci casca non dà punti a nessuno).
   3. A turno ognuno vota in segreto quella che crede vera (la sua non la può votare).
   4. La rivelazione: +2 a chi trova la verità, +1 all'autore di una balla per ogni voto che prende.
      L'ultimo round vale doppio. A fine partita i premi: Re delle balle, Detective, Credulone.
   Le notizie sono in data/balla-domande.js: SG_BALLA = [{ domanda, rispostaVera, balleCasa: [..] }].
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
  // per confrontare due frasi: minuscole, senza accenti, punteggiatura, articoli e preposizioni (1.000 = 1000)
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/(\d)[.,](?=\d)/g, "$1").replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(il|lo|la|i|gli|le|l|un|uno|una|del|dello|della|dell|dei|degli|delle|di|d|con|col)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  // i numeri di una frase (in cifre o in lettere): se cambia un numero è un'altra risposta, mai "la verità"
  var NUMERI = { zero: 0, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12,
    tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20, trenta: 30,
    quaranta: 40, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80, novanta: 90, cento: 100, mille: 1000, mezzo: 0.5, mezza: 0.5,
    milione: 1e6, milioni: 1e6, miliardo: 1e9, miliardi: 1e9, primo: "1o", prima: "1o", secondo: "2o", terzo: "3o" };
  function numeri(n) { return n.split(" ").filter(function (w) { return /^\d+$/.test(w) || NUMERI[w] != null; }).map(function (w) { return /^\d+$/.test(w) ? String(+w) : String(NUMERI[w]); }).join(" "); }
  // la parola senza l'ultima vocale: "cubo" e "cubi", "verde" e "verdi" sono la stessa risposta
  function radice(n) { return n.split(" ").map(function (w) { return w.length > 3 ? w.replace(/[aeiou]$/, "") : w; }).join(" "); }
  function distanza(a, b) {   // quante lettere cambiare per passare da a a b
    var r = [], i, j;
    for (j = 0; j <= b.length; j++) r.push(j);
    for (i = 1; i <= a.length; i++) {
      var prec = r[0]; r[0] = i;
      for (j = 1; j <= b.length; j++) { var tmp = r[j]; r[j] = Math.min(r[j] + 1, r[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1)); prec = tmp; }
    }
    return r[b.length];
  }
  // la balla è (quasi) la risposta vera? (perdona un errore di battitura, al singolare o al plurale; i numeri devono essere uguali)
  function eLaVerita(balla, vera) {
    var a = norm(balla), b = norm(vera); if (!a) return false;
    if (a === b) return true;
    if (numeri(a) !== numeri(b)) return false;   // "39 minuti" non è "38 minuti"
    if (radice(a) === radice(b)) return true;
    var la = a.replace(/[0-9 ]/g, ""), lb = b.replace(/[0-9 ]/g, "");   // gli errori di battitura si contano solo sulle lettere
    return distanza(la, lb) <= (lb.length >= 12 ? 2 : lb.length >= 6 ? 1 : 0);
  }
  function pulisci(s) { return String(s || "").replace(/\s+/g, " ").trim().replace(/[.…]+$/, "").trim().slice(0, MAX_BALLA); }
  // le scelte del round: la verità più le balle (quelle uguali diventano una sola, con tutti i loro autori), mescolate.
  // Se le risposte sono poche (pochi giocatori, chi non ha scritto, balle uguali) la redazione aggiunge le sue balle (casa: true)
  var MIN_SCELTE = 5;
  function preparaScelte(vera, balle, casa) {
    var scelte = [{ testo: vera, vera: true, autori: [] }];
    balle.forEach(function (b, i) {
      if (!b) return;
      var n = norm(b), gia = scelte.filter(function (x) { return !x.vera && norm(x.testo) === n; })[0];
      if (gia) gia.autori.push(i); else scelte.push({ testo: b, vera: false, autori: [i] });
    });
    mescola(casa || []).forEach(function (c) {
      c = pulisci(c);
      if (!c || scelte.length >= MIN_SCELTE || eLaVerita(c, vera)) return;
      if (scelte.some(function (x) { return norm(x.testo) === norm(c); })) return;
      scelte.push({ testo: c, vera: false, autori: [], casa: true });
    });
    return mescola(scelte);
  }
  // l'ultimo round vale doppio
  function moltiplica(giro, giri) { return giri > 1 && giro + 1 >= giri ? 2 : 1; }
  // i punti del round: voti[i] = la scelta votata da i. Restituisce, per ogni giocatore, i punti presi con la verità e con le balle
  // (più i numeri per i premi: verità trovate, amici ingannati, volte che ci è cascato, balla che ha ingannato tutti)
  function calcola(scelte, voti, n, m, presenti) {
    m = m || 1;
    var d = []; for (var i = 0; i < n; i++) d.push({ vera: 0, inganni: 0, trovata: 0, ingannati: 0, cascato: 0, perfetta: 0 });
    voti.forEach(function (v, i) {
      if (v == null || !scelte[v]) return;
      if (scelte[v].vera) { d[i].vera += 2 * m; d[i].trovata = 1; }
      else { d[i].cascato = 1; scelte[v].autori.forEach(function (a) { if (a !== i) { d[a].inganni += m; d[a].ingannati++; } }); }
    });
    // la balla perfetta: l'hanno votata tutti gli altri (almeno 2)
    var altri = (presenti == null ? n : presenti) - 1;
    d.forEach(function (x) { if (altri >= 2 && x.ingannati >= altri) x.perfetta = 1; });
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
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono per scrivere e votare", amici: true }],
    regole: [
      "Sul maxischermo esce una <b>notizia vera</b> ma incredibile, con un pezzo mancante.",
      "A turno ognuno, in segreto, scrive una <b>balla</b> per completarla: deve sembrare vera, per ingannare gli altri.",
      "Poi tutte le balle e la risposta vera si mescolano e a turno ognuno <b>vota</b> in segreto quella che crede vera. La propria balla non si può votare.",
      "Quando le risposte sono poche, anche la <b>redazione</b> aggiunge qualche balla sua: occhio a non cascarci!",
      "<b>+2 punti</b> a chi trova la risposta vera. <b>+1 punto</b> a chi ha scritto una balla, per ogni amico che ci è cascato.",
      "🔥 <b>L'ultimo round vale doppio.</b> Alla fine vince chi ha più punti, e ci sono i premi: Re delle balle, Detective e Credulone.",
      "<b>Online</b> ognuno scrive e vota dal suo telefono, tutti insieme: 75 secondi per la balla e 45 per il voto."
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
      box.appendChild(el("p", { class: "modulo-nota", text: aiuti.modo === "online" ? "Online ognuno scrive e vota dal suo telefono, tutti insieme: 75 secondi per la balla, 45 per il voto." : "Ogni round: si scrivono le balle passandosi il telefono, poi si vota, sempre in segreto." }));
    },

    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteB(t, t.linkParams.stanza);   // entrato da un invito
      if ((t.impostazioni || {}).modo === "online") { assicuraStile(); return hostB(t); }
      var imp = t.impostazioni || {};
      var domande = scegliDomande(imp.round || 5);
      if (!domande.length) return niente(t);
      assicuraStile();
      var st = { t: t, domande: domande, giri: domande.length, giro: 0,
        g: t.giocatori.map(function (n) { return { nome: n, punti: 0, tot: nuoviTot() }; }) };
      st.S = ST.crea(t, st.g.map(function (g) { return { nome: g.nome }; }), { io: -1, esci: t.esci, titolo: "La Balla Colossale", logo: ["LA BALLA", "COLOSSALE"] });
      ST.apertura(st.S).then(function () { round(st); });
    }
  });

  // i numeri della partita di ogni giocatore (per i premi finali e i contatori)
  function nuoviTot() { return { trovate: 0, ingannati: 0, cascato: 0, perfette: 0 }; }
  function sommaTot(tot, d) { tot.trovate += d.trovata; tot.ingannati += d.ingannati; tot.cascato += d.cascato; tot.perfette += d.perfetta; }

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
    if (moltiplica(st.giro, st.giri) > 1) await annunciaDoppio(S);
    await ST.aspettaTasto(S, "Letta! Ora le balle ✍️");
    for (var i = 0; i < st.g.length; i++) {
      if (!S.vivo()) return;
      await turnoScrittura(st, i);
    }
    if (!S.vivo()) return;
    st.scelte = preparaScelte(st.d.rispostaVera, st.balle, st.d.balleCasa);
    await presentaRisposte(st);
    if (!S.vivo()) return;
    await ST.aspettaTasto(S, "Si vota! 🗳️");
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

  // l'ultimo round: punti doppi (lo annuncia lo studio)
  async function annunciaDoppio(S) {
    ST.terzo(S, null, "🔥 Ultimo round!", "Punti doppi: +4 per la verità, +2 per ogni amico ingannato", "🔥");
    ST.pubblico(S, "applauso");
    await ST.dorme(2600); ST.viaTerzo(S);
  }

  // il maxischermo tra un turno e l'altro: la notizia (o, quando si vota, il tabellone) e chi ha già finito
  function schermoTurno(st, i, cosa) {
    var S = st.S, el = st.t.el;
    var fatti = el("div", { class: "bc-fatti" }); st.boxFatti = fatti;
    st.g.forEach(function (g, k) { fatti.appendChild(el("span", { class: st.fatti[k] ? "ok" : "" }, [ fac(el, g), el("span", { text: (st.fatti[k] ? "✅ " : "") + g.nome }) ])); });
    var chi = i == null ? (cosa === "scrive" ? "✍️ Inventate una balla per completarla!" : "🗳️ Qual è la risposta vera?")
      : (cosa === "scrive" ? "✍️ Scrive " : "🗳️ Vota ") + st.g[i].nome;
    if (cosa === "vota") return tabellone(st, { sotto: [ el("div", { class: "bc-chi-sch", text: chi }), fatti ] });
    ST.fermaTimer(S); ST.vuota(S.sch);
    S.sch.appendChild(el("div", { class: "bc-sch" }, [ ritaglio(el, st, null, true), el("div", { class: "bc-chi-sch", text: chi }), fatti ]));
  }

  // ---- il TABELLONE sul maxischermo: tutte le risposte numerate, balle e verità mescolate ----
  // o.entra = le righe compaiono una alla volta (le gira chi chiama); o.voti = accanto a ogni risposta chi l'ha votata; o.sotto = nodi sotto
  function tabellone(st, o) {
    var S = st.S, el = st.t.el; o = o || {};
    ST.fermaTimer(S); ST.vuota(S.sch);
    var righe = st.scelte.map(function (sc, k) {
      var r = el("div", { class: "bc-riga" + (o.entra ? " giu" : "") }, [ el("span", { class: "n", text: String(k + 1) }), el("span", { class: "tx", text: sc.testo }) ]);
      r._voti = el("span", { class: "vv" }); r.appendChild(r._voti);
      if (o.voti) chiHaVotato(st, k).forEach(function (v) { r._voti.appendChild(fac(el, st.g[v])); });
      return r;
    });
    var box = el("div", { class: "bc-sch tab" }, [ ritaglio(el, st, null, false), o.titolo ? el("div", { class: "bc-chi-sch", text: o.titolo }) : null, el("div", { class: "bc-tab" }, righe) ].concat(o.sotto || []));
    S.sch.appendChild(box);
    // tante risposte su un telefono piccolo: le scritte si stringono quanto basta per starci tutte
    // (si tiene già il posto per il tasto in basso, che compare quasi sempre col tabellone)
    stringiTab(box, S.vista.classList.contains("con-barra") ? 0 : 94);
    if (window.ResizeObserver) new ResizeObserver(function () { if (box.isConnected) stringiTab(box, 0); }).observe(box);
    return righe;
  }
  function stringiTab(box, riserva) {
    var fs = parseInt(box.style.getPropertyValue("--fs"), 10) || 18, cs = getComputedStyle(box);
    var troppo = function () {   // quanto è alto il contenuto (dal primo all'ultimo pezzo visibile) rispetto allo spazio
      var k = [].filter.call(box.children, function (c) { return c.offsetHeight > 0; }); if (!k.length || !box.clientHeight) return false;
      var ul = k[k.length - 1], alto = ul.offsetTop + ul.offsetHeight - k[0].offsetTop + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      return alto > box.clientHeight - riserva + 1;
    };
    while (troppo() && fs > 12) { fs--; box.style.setProperty("--fs", fs + "px"); }
    if (troppo()) box.classList.add("soloFacce");   // ancora troppo: chi ha finito si vede solo dall'avatar
    if (troppo()) box.classList.add("corto");       // e poi via la notizia (l'hanno già letta)
    if (troppo()) box.classList.add("minimo");      // e le righe più fitte
  }
  function tic(freq) {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var o = c.createOscillator(), g = c.createGain(), n = c.currentTime; o.type = "square"; o.frequency.setValueAtTime(freq, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.08, n + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.06);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + 0.07); } catch (e) {}
  }
  // finite le balle: sul tabellone compaiono le risposte, una alla volta, col rumore delle palette che girano
  async function presentaRisposte(st) {
    var S = st.S;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.largo(S, 800);
    ST.terzo(S, null, "Tutte le balle sono pronte!", "Guardate il tabellone…", "🤥");
    ST.pubblico(S, "applauso");
    await ST.dorme(1500); ST.viaTerzo(S);
    await ST.suSchermo(S, 800);
    var titolo = st.t.el("div", { class: "bc-chi-sch", text: "📋 Ecco le risposte!" });
    var righe = tabellone(st, { entra: true, sotto: [ titolo ] });
    for (var k = 0; k < righe.length; k++) {
      await ST.dorme(k ? 650 : 400);
      if (!S.vivo()) return;
      righe[k].classList.remove("giu"); tic(520 + k * 40);
    }
    await ST.dorme(600);
    titolo.textContent = "🤫 Una sola è vera… quale?"; titolo.classList.add("pulsa");
    ST.FX.rullo(1.2);
    await ST.dorme(1300);
  }
  // i voti sul tabellone: accanto a ogni risposta compaiono gli avatar di chi l'ha votata
  async function mostraVoti(st) {
    var S = st.S, el = st.t.el;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 800);
    var titolo = el("div", { class: "bc-chi-sch", text: "🗳️ Ecco i voti!" });
    var righe = tabellone(st, { sotto: [ titolo ] });
    for (var k = 0; k < righe.length; k++) {
      var chi = chiHaVotato(st, k);
      for (var q = 0; q < chi.length; q++) {
        await ST.dorme(300);
        if (!S.vivo()) return;
        righe[k]._voti.appendChild(fac(el, st.g[chi[q]])); tic(700 + q * 60);
      }
    }
    await ST.dorme(700);
    titolo.textContent = "🔍 E adesso… la verità!"; titolo.classList.add("pulsa");
    ST.pubblico(S, "piano");
    await ST.dorme(900);
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
  // ms = il tempo (online): una barra che si accorcia; S._chiudiVelo lo chiude da fuori (il tempo è finito per tutti)
  function apriVelo(S, el, nodi, cls, ms) {
    var velo = el("div", { class: "bc-velo" }), carta = el("div", { class: "bc-carta" + (cls ? " " + cls : "") }, nodi);
    var toPoco = null, toSec = null;
    if (ms) {
      // la barra del tempo e, accanto, i secondi che mancano (negli ultimi 5 un tic per secondo)
      var barraT = el("i"), tempo = el("div", { class: "bc-tempo" }, [barraT]), sec = el("b", { class: "bc-sec" });
      carta.insertBefore(el("div", { class: "bc-tempo-riga" }, [tempo, sec]), carta.firstChild);
      var parti = function () { if (barraT._via) return; barraT._via = 1; barraT.style.transition = "transform " + ms + "ms linear"; barraT.style.transform = "scaleX(0)"; };
      requestAnimationFrame(function () { requestAnimationFrame(parti); }); setTimeout(parti, 120);
      toPoco = setTimeout(function () { tempo.classList.add("poco"); sec.classList.add("poco"); }, Math.max(0, ms - 10000));
      var fineT = Date.now() + ms, ultimo = -1;
      var segna = function () {
        var s = Math.max(0, Math.ceil((fineT - Date.now()) / 1000)); if (s === ultimo) return;
        ultimo = s; sec.textContent = s;
        if (s > 0 && s <= 5) tic(980);
      };
      segna(); toSec = setInterval(segna, 250);
    }
    velo.appendChild(carta); S.vista.appendChild(velo);
    S.rec.classList.remove("on");
    requestAnimationFrame(function () { velo.classList.add("on"); });
    setTimeout(function () { velo.classList.add("on"); }, 90);
    return { velo: velo, carta: carta, chiudi: function (poi) {
      clearTimeout(toPoco); clearInterval(toSec); S._chiudiVelo = null;
      try { if (document.activeElement) document.activeElement.blur(); } catch (e) {}
      velo.classList.add("via");
      setTimeout(function () { velo.classList.remove("on"); setTimeout(function () { if (velo.parentNode) velo.parentNode.removeChild(velo); poi(); }, 260); }, 300);
    } };
  }
  // tante risposte lunghe su un telefono piccolo: le scritte si stringono quanto basta per stare tutte nello schermo, senza scorrere
  // (per gradi: scritte più piccole, notizia più piccola, risposte su due colonne, notizia nascosta: è già sul maxischermo)
  // lungo = la risposta più lunga: si misura con quella già dentro la notizia (quando si tocca una risposta la notizia si allunga)
  function adatta(v, tante, buco, lungo) {
    var cs = getComputedStyle(v.velo), pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    var prima = buco ? buco.textContent : "", pieno = buco ? buco.classList.contains("pieno") : false;
    if (buco && lungo) { buco.textContent = lungo; buco.classList.add("pieno"); }
    var troppo = function () { return v.carta.offsetHeight > v.velo.clientHeight - pad; }, fs = 16;
    var stringi = function () { fs = 16; v.carta.style.setProperty("--fs", fs + "px"); while (troppo() && fs > 12) { fs--; v.carta.style.setProperty("--fs", fs + "px"); } };
    (function () {
      stringi(); if (!troppo()) return;
      v.carta.classList.add("piccola"); if (!troppo()) return;
      if (tante) { v.carta.classList.add("due"); stringi(); if (!troppo()) return; }
      v.carta.classList.add("senza"); stringi();   // senza la notizia c'è più posto: le scritte tornano grandi quanto si può
    })();
    if (buco && lungo) { buco.textContent = prima; buco.classList.toggle("pieno", pieno); }
  }
  function testaSegreta(el, g) { return el("div", { class: "bc-chi" }, [ fac(el, g), el("b", { text: g.nome }), el("small", { text: "🤫 guarda solo tu" }) ]); }
  var AVVISO_VERA = "😱 Troppo vicina alla risposta vera! Inventa una balla diversa.";

  // scrivere la balla: la notizia col buco, la penna, "Fatto". Restituisce la balla (o "" se il tempo finisce col foglio vuoto).
  // o.ms = il tempo (online); o.avviso = un avviso subito; o.verita = false quando la verità la sa solo l'host (online)
  function apriBiglietto(st, i, o) {
    var S = st.S, el = st.t.el, g = st.g[i]; o = o || {};
    return new Promise(function (fine) {
      var chiuso = false, toFine = null;
      var inp = el("textarea", { class: "bc-penna", maxlength: String(MAX_BALLA), rows: "2", autocomplete: "off", autocapitalize: "none", spellcheck: "true", enterkeyhint: "done", placeholder: "scrivi qui la tua balla…" });
      var conta = el("div", { class: "bc-conta", text: "0/" + MAX_BALLA });
      var avviso = el("div", { class: "bc-avviso" });
      var ok = el("button", { class: "btn btn-primario bc-ok", text: o.ms ? "✅ Fatto!" : "✅ Fatto, nascondi", disabled: "disabled" });
      var anteprima = ritaglio(el, st, null, false), buco = anteprima.querySelector(".bc-buco");
      function aggiorna() {
        var v = pulisci(inp.value);
        conta.textContent = inp.value.length + "/" + MAX_BALLA;
        ok.disabled = !v;
        buco.textContent = v; buco.classList.toggle("pieno", !!v);   // la balla si vede già dentro la notizia
        avviso.classList.remove("on");
      }
      function chiudi(v) {
        if (chiuso) return; chiuso = true; ok.disabled = true; clearTimeout(toFine);
        if (vv) vv.removeEventListener("resize", tastiera);
        v0.chiudi(function () { fine(v); });
      }
      // con la tastiera aperta lo schermo si abbassa: la notizia si fa piccola, il campo e "Fatto" restano a vista
      var vv = window.visualViewport;
      function tastiera() {
        var giu = vv.height < window.innerHeight * 0.8;
        v0.carta.classList.toggle("tastiera", giu);
        v0.velo.style.paddingBottom = giu ? Math.max(12, window.innerHeight - vv.height - vv.offsetTop + 12) + "px" : "";
        if (giu) try { ok.scrollIntoView({ block: "nearest" }); } catch (e) {}
      }
      function finito() {
        if (chiuso) return;
        var v = pulisci(inp.value); if (!v) return;
        if (o.verita !== false && eLaVerita(v, st.d.rispostaVera)) {   // ha scritto proprio la verità: deve inventare un'altra cosa
          avviso.textContent = AVVISO_VERA; inp.value = ""; aggiorna(); avviso.classList.add("on");
          try { inp.focus({ preventScroll: true }); } catch (e) {}
          return;
        }
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
        chiudi(v);
      }
      inp.addEventListener("input", aggiorna);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); finito(); } });
      ok.addEventListener("click", finito);
      var v0 = apriVelo(S, el, [ testaSegreta(el, g), anteprima,
        el("label", { class: "bc-scrivi" }, [ el("span", { class: "bc-et", text: "✍️ La tua balla: deve sembrare vera!" }), inp, conta ]),
        avviso, ok ], "", o.ms);
      if (o.avviso) { avviso.textContent = o.avviso; avviso.classList.add("on"); }
      if (vv) vv.addEventListener("resize", tastiera);
      S._chiudiVelo = function () { chiudi(pulisci(inp.value)); };   // il tempo è finito: vale quello che c'è scritto
      if (o.ms) toFine = setTimeout(S._chiudiVelo, o.ms);
      setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 650);
    });
  }

  // votare: tutte le risposte, la propria balla non si può scegliere. Restituisce la scelta (o null se il tempo finisce).
  // o.mia(sc) = è la mia balla? (online la riconosco dal testo che ho scritto); o.ms = il tempo; o.avviso = un avviso subito
  function apriVoto(st, i, o) {
    var S = st.S, el = st.t.el, g = st.g[i]; o = o || {};
    var mia = o.mia || function (sc) { return (sc.autori || []).indexOf(i) >= 0; };
    return new Promise(function (fine) {
      var scelto = null, chiuso = false, bottoni = [], toFine = null;
      var ok = el("button", { class: "btn btn-primario bc-ok", text: "🗳️ Voto questa", disabled: "disabled" });
      var tante = st.scelte.length > 6;
      var lista = el("div", { class: "bc-scelte" + (tante ? " tante" : "") });
      var notizia = ritaglio(el, st, null, false), buco = notizia.querySelector(".bc-buco");
      // la mia balla: grigia, con "✍️ la tua", non si tocca (online può arrivare dopo, se ho ricaricato la pagina)
      function segnaMia(b, sc) {
        if (!mia(sc) || b._mia) return;
        b._mia = true; b.disabled = true; b.classList.add("mia"); b.classList.remove("sel");
        b.appendChild(el("span", { class: "tag", text: "✍️ la tua" }));
        if (scelto === bottoni.indexOf(b)) { scelto = null; ok.disabled = true; anteprima(null); }
      }
      // la risposta toccata si legge già dentro la notizia
      function anteprima(testo) { buco.textContent = testo || ""; buco.classList.toggle("pieno", !!testo); }
      st.scelte.forEach(function (sc, k) {
        var b = el("button", { class: "bc-scelta" }, [ el("span", { class: "n", text: String(k + 1) }), el("span", { class: "tx", text: sc.testo }) ]);
        b.addEventListener("click", function () {
          if (chiuso || b._mia) return;
          scelto = k; bottoni.forEach(function (x, kk) { x.classList.toggle("sel", kk === k); });
          ok.disabled = false; anteprima(sc.testo);
          try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
        });
        bottoni.push(b); lista.appendChild(b);
      });
      bottoni.forEach(function (b, k) { segnaMia(b, st.scelte[k]); });
      S._segnaMia = function () { bottoni.forEach(function (b, k) { segnaMia(b, st.scelte[k]); }); };
      function chiudi(k) { if (chiuso) return; chiuso = true; clearTimeout(toFine); S._segnaMia = null; v0.chiudi(function () { fine(k); }); }
      ok.addEventListener("click", function () { if (scelto != null) chiudi(scelto); });
      var avviso = el("div", { class: "bc-avviso" + (o.avviso ? " on" : ""), text: o.avviso || "" });
      var v0 = apriVelo(S, el, [ testaSegreta(el, g), notizia, avviso,
        el("div", { class: "bc-et", text: "🔍 Qual è la risposta VERA?" }), lista, ok ], st.scelte.length > 5 ? "stretta" : "", o.ms);
      adatta(v0, tante, buco, st.scelte.reduce(function (a, sc) { return sc.testo.length > a.length ? sc.testo : a; }, ""));
      S._chiudiVelo = function () { chiudi(null); };   // il tempo è finito: niente voto
      if (o.ms) toFine = setTimeout(S._chiudiVelo, o.ms);
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
    st.esito = calcola(st.scelte, st.voti, st.g.length, moltiplica(st.giro, st.giri));
    var ordine = st.scelte.map(function (_, k) { return k; })
      .filter(function (k) { return !st.scelte[k].vera && st.conta[k] > 0; })
      .sort(function (a, b) { return st.conta[a] - st.conta[b]; });
    var kVera = st.scelte.map(function (sc) { return sc.vera; }).indexOf(true);
    await mostraVoti(st);
    if (!S.vivo()) return;
    await ST.aspettaTasto(S, "Scopriamo la verità 🔍");
    for (var q = 0; q < ordine.length; q++) { if (!S.vivo()) return; await mostraScelta(st, ordine[q]); }
    if (!S.vivo()) return;
    await mostraScelta(st, kVera);
    var ignorate = st.scelte.map(function (_, k) { return k; }).filter(function (k) { return !st.scelte[k].vera && st.conta[k] === 0; });
    if (ignorate.length && S.vivo()) await schermoIgnorate(st, ignorate);
  }

  function chiHaVotato(st, k) { var l = []; st.voti.forEach(function (v, i) { if (v === k) l.push(i); }); return l; }
  function quanti(n) { return ["", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto"][n] || String(n); }
  function nomi(st, lista) { var n = lista.map(function (i) { return st.g[i].nome; }); return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " e " + n[n.length - 1]; }

  function mostraScelta(st, k, online) {
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
      }
      if (!votanti.length) gente.appendChild(el("span", { class: "bc-nessuno", text: "Nessuno l'ha votata…" }));
      await ST.dorme(700);
      ST.FX.rullo(1.1);
      await ST.dorme(1250);
      if (!S.vivo()) return fine();
      timbro.classList.add("on");
      var m = moltiplica(st.giro, st.giri);
      if (sc.vera) {
        sotto.appendChild(el("div", { class: "bc-intera" }, [ el("small", { text: "La notizia vera:" }), ritaglio(el, st, sc.testo, false) ]));
        if (votanti.length) {
          sotto.appendChild(el("div", { class: "bc-premio si", text: "+" + (2 * m) + " punti a " + nomi(st, votanti) }));
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
        if (sc.casa || !sc.autori.length) {   // una balla della redazione: nessuno prende punti
          sotto.appendChild(el("div", { class: "bc-autore" }, [ el("small", { text: "L'ha scritta" }),
            el("div", { class: "bc-redazione", text: "🗞️ la redazione" }) ]));
        } else {
          var guadagno = sc.autori.map(function (a) { return votanti.filter(function (v) { return v !== a; }).length * m; });
          sotto.appendChild(el("div", { class: "bc-autore" }, [
            el("small", { text: sc.autori.length > 1 ? "L'hanno scritta in " + quanti(sc.autori.length) + ":" : "L'ha scritta" }),
            el("div", { class: "bc-autori" }, sc.autori.map(function (a, n) { return el("span", { class: "bc-votante autore" }, [ fac(el, st.g[a], "esulta"), el("span", { text: st.g[a].nome + " +" + guadagno[n] }) ]); }))
          ]));
        }
        ST.pubblico(S, "ohh");
      }
      await ST.dorme(900);
      if (!online) await ST.aspettaTasto(S, "Avanti ▶");
      fine();
    });
  }

  // le balle a cui non ha creduto nessuno (sul maxischermo, tutte insieme)
  async function schermoIgnorate(st, lista, online) {
    var S = st.S, el = st.t.el;
    ST.fermaTimer(S); ST.vuota(S.sch);
    var righe = el("div", { class: "bc-ignorate" });
    lista.forEach(function (k, n) {
      var sc = st.scelte[k], r = el("div", { class: "bc-ign" }, [ el("span", { class: "tx", text: sc.testo }), el("span", { class: "di", text: sc.autori.length ? nomi(st, sc.autori) : "🗞️ redazione" }) ]);
      r.style.animationDelay = (n * 0.12) + "s"; righe.appendChild(r);
    });
    S.sch.appendChild(el("div", { class: "bc-sch" }, [ el("div", { class: "bc-chi-sch", text: "🙄 Balle a cui non ha creduto nessuno" }), righe ]));
    ST.pubblico(S, "piano");
    if (!online) await ST.aspettaTasto(S, "Vediamo i punti ▶");
  }

  // i punti scorrono sui leggii, poi la classifica sul maxischermo (o il gran finale)
  async function punteggi(st) {
    var S = st.S, t = st.t, el = t.el;
    ST.viaBarra(S); ST.tutteNormali(S);
    await ST.largo(S, 900);
    ST.terzo(S, null, "Fine del round " + (st.giro + 1), "Ecco i punti!", "🏁");
    for (var i = 0; i < st.g.length; i++) {
      var d = st.esito[i], piu = d.vera + d.inganni;
      st.g[i].punti += piu; st.g[i].ultimo = piu; sommaTot(st.g[i].tot, d);
      ST.puntiLeggio(S, i, st.g[i].punti, piu);
      ST.faccia(S, i, piu > 0 ? "esulta" : "triste");
      await ST.dorme(320);
    }
    ST.pubblico(S, "applauso");
    await ST.dorme(1700); ST.viaTerzo(S); ST.tutteNormali(S);
    var ordine = st.g.slice().sort(function (x, y) { return y.punti - x.punti; });
    var pos = function (g) { return 1 + st.g.filter(function (q) { return q.punti > g.punti; }).length; };   // a pari punti, stessa posizione
    if (st.giro + 1 >= st.giri) {
      await schermoPremi(S, el, st.g, false);
      if (!S.vivo()) return;
      await granFinale(S, st.g, ordine.filter(function (g) { return pos(g) === 1; }));
      var clas = ordine.map(function (g) { return { nome: g.nome, punti: g.punti, pos: pos(g) }; });
      salvaContatori(st.g.map(function (g) { return { nome: g.nome, pos: pos(g), punti: g.punti, tot: g.tot }; }), null, false);
      return t.fine(clas);
    }
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "bc-clas" }, [ el("h2", { text: "🏁 Classifica dopo " + (st.giro + 1) + " round" }) ]);
    ordine.forEach(function (g, k) {
      var r = el("div", { class: "bc-cl" + (pos(g) === 1 ? " primo" : "") }, [
        el("span", { class: "pos", text: medaglia(pos(g)) }), fac(el, g), el("span", { class: "nm", text: g.nome }),
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
  function medaglia(p) { return ["🥇", "🥈", "🥉"][p - 1] || p + "°"; }

  // ---- fine partita: i premi della serata, poi il vincitore (o il pareggio) ----
  // g = i giocatori con i loro numeri (tot); online = non si aspetta il tasto
  var PREMI = [
    { k: "ingannati", icona: "🤥", nome: "Re delle balle", dice: function (n) { return n === 1 ? "1 amico ingannato" : n + " amici ingannati"; } },
    { k: "trovate", icona: "🔍", nome: "Detective", dice: function (n) { return n === 1 ? "1 verità scovata" : n + " verità scovate"; } },
    { k: "cascato", icona: "🙈", nome: "Credulone", dice: function (n) { return n === 1 ? "ci è cascato 1 volta" : "ci è cascato " + n + " volte"; } }
  ];
  async function schermoPremi(S, el, g, online) {
    var righe = [];
    PREMI.forEach(function (pr) {
      var max = 0; g.forEach(function (x) { if (x.tot && !x.via && x.tot[pr.k] > max) max = x.tot[pr.k]; });
      if (!max) return;
      var chi = g.filter(function (x) { return x.tot && !x.via && x.tot[pr.k] === max; }).slice(0, 3);
      righe.push(el("div", { class: "bc-premio-riga" }, [ el("span", { class: "ic", text: pr.icona }),
        el("div", { class: "cosa" }, [ el("b", { text: pr.nome }), el("small", { text: pr.dice(max) }) ]),
        el("div", { class: "chi" }, chi.map(function (x) { return el("span", { class: "bc-votante" }, [ fac(el, x, "esulta"), el("span", { text: x.nome }) ]); })) ]));
    });
    if (!righe.length || !S.vivo()) return;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "bc-sch bc-premi" }, [ el("div", { class: "bc-chi-sch", text: "🏅 I premi della serata" }) ]);
    S.sch.appendChild(box);
    for (var k = 0; k < righe.length; k++) {
      await ST.dorme(k ? 900 : 500);
      if (!S.vivo()) return;
      box.appendChild(righe[k]); tic(620 + k * 120); ST.pubblico(S, "applauso");
    }
    if (online) await ST.dorme(3200); else await ST.aspettaTasto(S, "E il vincitore è… ▶");
  }
  // il vincitore; a pari punti vincono in tanti
  async function granFinale(S, g, primi) {
    if (primi.length === 1) return ST.finale(S, g.indexOf(primi[0]), primi[0].punti + " punti");
    await ST.finale(S, -1);
    if (!S.vivo()) return;
    primi.forEach(function (p) { ST.faccia(S, g.indexOf(p), "esulta"); });
    ST.terzo(S, null, "Pareggio!", "Vincono " + primi.map(function (p) { return p.nome; }).join(", ").replace(/, ([^,]*)$/, " e $1") + " · " + primi[0].punti + " punti", "🏆");
    ST.pubblico(S, "ovazione"); ST.coriandoli(); if (ST.FX.fanfara) ST.FX.fanfara();
    await ST.dorme(3000); ST.viaTerzo(S);
  }

  // ---- i contatori per i trofei (solo per chi ha il profilo; online ognuno salva i suoi) ----
  // righe = [{ nome, id?, pos, punti, tot }]; mioId = online il mio id, altrimenti si cerca il nome del profilo
  var SALVATE = {};
  function salvaContatori(righe, mioId, online, sessione) {
    try {
      if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var nomeP = String(SGNube.profilo().nome || "").trim().toLowerCase(); if (!nomeP) return;
      var me = righe.filter(function (r) { return online ? r.id === mioId : String(r.nome || "").trim().toLowerCase() === nomeP; })[0];
      if (!me || !me.tot) return;
      if (sessione) {   // online: una volta sola per partita, anche se si ricarica la pagina
        if (SALVATE[sessione]) return; SALVATE[sessione] = 1;
        try { if (localStorage.getItem("sg-balla-salvata") === sessione) return; localStorage.setItem("sg-balla-salvata", sessione); } catch (e) {}
      }
      var incr = [["partite", 1], ["veritaTrovate", me.tot.trovate], ["amiciIngannati", me.tot.ingannati], ["ballePerfette", me.tot.perfette]];
      if (online) incr.push(["partiteOnline", 1]);
      if (me.pos === 1) incr.push(["vinte", 1]);
      SGNube.salvaProgressi(null, "balla", incr.filter(function (x) { return x[1] > 0; }), [["puntiMax", me.punti || 0]]);
    } catch (e) {}
  }

  // =========================================================
  //  ONLINE — ognuno dal suo telefono: si scrive e si vota tutti insieme, col tempo.
  //  L'host tiene la partita (notizie, balle, voti, punti) e manda a tutti la "foto" (vm);
  //  ogni telefono ha il suo studio e la sua regia, e fa vedere gli stessi momenti.
  //  Segreti: le balle e i voti non sono mai nella foto finché non si scoprono.
  // =========================================================
  var MIN_ON = 3, MAX_ON = 8;
  var TEMPO_SCRIVI = 75000, TEMPO_VOTA = 45000;   // quanto tempo c'è per scrivere e per votare
  var ANTICIPO = 1600;                              // la telecamera va sul leggio e si apre il foglio: poi parte il tempo
  var GRAZIA = 2500;                                // finito il tempo, aspetto i fogli che arrivano un po' in ritardo
  var DURATA_NOTIZIA = 6500;
  function durataRisposte(n) { return 2400 + 400 + n * 650 + 1900 + 1600; }   // le risposte che compaiono sul tabellone
  function durataVoti(nv) { return 1600 + nv * 300 + 1600 + 1500; }          // i voti che compaiono sul tabellone
  function durataPasso(nVoti, vera) { return (vera ? 7200 : 5600) + nVoti * 380; }
  function durataPunti(n) { return 4000 + n * 320 + 12000; }                 // i punti sui leggii, poi 12 secondi di classifica

  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online si gioca quando l'app è aperta dal sito pubblicato. Intanto potete giocare \"Su questo telefono\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }

  // ---------------- HOST ----------------
  function hostB(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, giri: imp.round || 5, giro: 0, domande: [], d: null,
      players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0 }],
      balle: {}, fatti: {}, voti: {}, scelte: [], scadenza: 0, passo: 0, ordine: [], ignorate: [], ultimo: {}, classifica: null, to: null };
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function iDi(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return i; return -1; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    function dopo(ms, f) { ferma(); H.to = setTimeout(f, ms); }

    // "⚙️ Regole" nella saletta: quante notizie
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.giri = im.round || 5; bd(); };

    var rete = SGNet.ospita("balla", {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        var p = pById(id); if (!p) return;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;   // a partita iniziata resta in classifica, ma non gioca più
        controlla(); bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p0 = pById(id);
          if (H.fase === "lobby" && !p0 && H.players.length < MAX_ON)
            H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino), punti: 0, tot: nuoviTot() });
          else if (p0 && p0.via) p0.via = false;   // è tornato (stesso id): riprende a giocare coi suoi punti
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          if (p0 && H.balle[id] && H.d && H.fase !== "lobby") privato(id, { t: "priv", k: "mia", testo: H.balle[id], dom: H.d.domanda });   // e la sua balla
          return;
        }
        if (m.t === "balla") balla(id, m.testo);
        else if (m.t === "voto") voto(id, m.k);
      },
      // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
      onErrore: function () { if (!H.pronta) { ferma(); errore(t, "Non riesco ad aprire la stanza. Controlla la connessione e riprova."); } }
    });
    if (!rete) return senzaRete(t);
    // la "foto" per tutti: SEMPRE con gli id; le balle e i voti solo quando si scoprono
    function vm() {
      var f = H.fase, o = { fase: f, codice: H.codice, pronta: H.pronta, giro: H.giro, giri: H.giri, classifica: H.classifica, sessione: H.sessione,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino || null, punti: p.punti, via: !!p.via }; }),
        fatti: Object.keys(H.fatti) };
      if (H.d && f !== "lobby") o.domanda = H.d.domanda;
      if (f === "scrittura" || f === "voto" || f === "punti") o.rimMs = Math.max(0, H.scadenza - Date.now());
      if (f === "risposte" || f === "voto") o.scelte = H.scelte.map(function (sc) { return { testo: sc.testo }; });
      if ((f === "voti" || f === "rivela" || f === "punti" || f === "fine") && H.scelte.length) {
        o.vera = H.d.rispostaVera; o.scelte = H.scelte; o.ordine = H.ordine; o.ignorate = H.ignorate; o.passo = H.passo;
        o.voti = H.players.map(function (p) { return H.voti[p.id] != null ? H.voti[p.id] : null; });
      }
      if (f === "punti" || f === "fine") o.ultimo = H.ultimo;
      return o;
    }
    // un messaggio per un telefono solo: inviaVeloce con "to" (così non resta in stanza)
    function privato(id, m) { if (id === "host") return privatoB(m); m.to = id; rete.inviaVeloce(m); }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegnaVM(t, v, cbHost); }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN_ON) return;
      H.domande = scegliDomande(H.giri); if (!H.domande.length) return;
      H.giri = H.domande.length; H.giro = 0; H.classifica = null;
      H.sessione = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      H.players.forEach(function (p) { p.punti = 0; p.tot = nuoviTot(); });
      H.fase = "apertura"; bd();   // la sigla dello studio, uguale su tutti i telefoni
      dopo(ST.durataApertura(H.players.length), nuovoRound);
    }
    function nuovoRound() {
      H.d = H.domande[H.giro]; H.balle = {}; H.fatti = {}; H.voti = {}; H.scelte = []; H.ordine = []; H.ignorate = []; H.passo = 0; H.ultimo = {};
      H.fase = "notizia"; bd();
      dopo(DURATA_NOTIZIA, scrittura);
    }
    function scrittura() { H.fase = "scrittura"; H.scadenza = Date.now() + TEMPO_SCRIVI + ANTICIPO; bd(); dopo(TEMPO_SCRIVI + ANTICIPO + GRAZIA, fineScrittura); }
    function balla(id, testo) {
      var p = pById(id); if (H.fase !== "scrittura" || !p || p.via || H.fatti[id]) return;
      var v = pulisci(testo); if (!v) return;
      if (eLaVerita(v, H.d.rispostaVera)) return privato(id, { t: "priv", k: "vera" });   // ha scritto la verità: ne deve inventare un'altra
      H.balle[id] = v; H.fatti[id] = 1; controlla(); bd();
      privato(id, { t: "priv", k: "mia", testo: v, dom: H.d.domanda });   // conferma: questa è la tua balla
    }
    function fineScrittura() {
      ferma();
      H.scelte = preparaScelte(H.d.rispostaVera, H.players.map(function (p) { return H.balle[p.id] || ""; }), H.d.balleCasa);   // gli autori sono i posti dei giocatori
      H.fatti = {}; H.fase = "risposte"; bd();
      dopo(durataRisposte(H.scelte.length), votazione);
    }
    function votazione() { H.fase = "voto"; H.scadenza = Date.now() + TEMPO_VOTA + ANTICIPO; bd(); dopo(TEMPO_VOTA + ANTICIPO + GRAZIA, fineVoto); }
    function voto(id, k) {
      var i = iDi(id), p = H.players[i]; k = Number(k);
      if (H.fase !== "voto" || !p || p.via || H.voti[id] != null || !(k >= 0 && k < H.scelte.length)) return;
      if (H.scelte[k].autori.indexOf(i) >= 0) return privato(id, { t: "priv", k: "tua" });   // la propria balla non si vota
      H.voti[id] = k; H.fatti[id] = 1; controlla(); bd();
    }
    function fineVoto() {
      ferma();
      var conta = H.scelte.map(function () { return 0; }), nv = 0;
      H.players.forEach(function (p) { var v = H.voti[p.id]; if (v != null) { conta[v]++; nv++; } });
      var ks = H.scelte.map(function (_, k) { return k; });
      H.ordine = ks.filter(function (k) { return !H.scelte[k].vera && conta[k] > 0; }).sort(function (a, b) { return conta[a] - conta[b]; });
      H.ignorate = ks.filter(function (k) { return !H.scelte[k].vera && conta[k] === 0; });
      H.fatti = {}; H.fase = "voti"; H.passo = 0; bd();
      dopo(durataVoti(nv), function () { H.fase = "rivela"; H.passo = 0; bd(); prossimoPasso(conta); });
    }
    // la rivelazione: un passo alla volta (prima le balle votate, poi la verità, poi quelle che non ha votato nessuno)
    function prossimoPasso(conta) {
      var nL = H.ordine.length, kVera = H.scelte.map(function (sc) { return sc.vera; }).indexOf(true);
      var dur = H.passo < nL ? durataPasso(conta[H.ordine[H.passo]], false) : H.passo === nL ? durataPasso(conta[kVera], true) : 4600;
      dopo(dur, function () {
        H.passo++;
        if (H.passo > nL + (H.ignorate.length ? 1 : 0)) return punti();
        bd(); prossimoPasso(conta);
      });
    }
    function punti() {
      ferma();
      var esito = calcola(H.scelte, H.players.map(function (p) { return H.voti[p.id] != null ? H.voti[p.id] : null; }), H.players.length,
        moltiplica(H.giro, H.giri), presenti().length);
      H.ultimo = {};
      H.players.forEach(function (p, i) { if (p.via) return; var d = esito[i].vera + esito[i].inganni; p.punti += d; H.ultimo[p.id] = d; sommaTot(p.tot || (p.tot = nuoviTot()), esito[i]); });
      if (H.giro + 1 >= H.giri) return fine();
      // la classifica del round: l'host tocca "Prossima notizia ▶" (che conta) oppure si va avanti da soli
      var dur = durataPunti(H.players.length);
      H.fase = "punti"; H.scadenza = Date.now() + dur; bd();
      dopo(dur, prossimo);
    }
    function prossimo() { if (H.fase !== "punti") return; ferma(); H.giro++; nuovoRound(); }
    // chi ha finito di scrivere / di votare: quando ci sono tutti si va avanti senza aspettare il tempo
    function controlla() {
      if (H.fase === "lobby" || H.fase === "fine") return;
      if (presenti().length < 2) return fine();   // è rimasto uno solo: finisce qui
      var tutti = function () { return presenti().every(function (p) { return H.fatti[p.id]; }); };
      if (H.fase === "scrittura" && tutti()) dopo(1200, fineScrittura);
      if (H.fase === "voto" && tutti()) dopo(1200, fineVoto);
    }
    function fine() {
      ferma();
      // chi è uscito resta in classifica, ma in fondo (dopo tutti quelli rimasti): vince sempre il primo della classifica
      var perPunti = function (a, b) { return b.punti - a.punti; };
      var dentro = presenti().sort(perPunti), fuori = H.players.filter(function (p) { return p.via; }).sort(perPunti);
      var riga = function (gruppo, base) { return function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, tot: p.tot || nuoviTot(),
        pos: base + 1 + gruppo.filter(function (q) { return q.punti > p.punti; }).length }; }; };
      H.classifica = dentro.map(riga(dentro, 0)).concat(fuori.map(riga(fuori, dentro.length)));
      H.fase = "fine"; bd();
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici (anche chi era uscito ed è tornato), tutti tornano nella saletta
    function nuova() { ferma(); H.fase = "lobby"; H.classifica = null; H.d = null; H.players = presenti(); H.players.forEach(function (p) { p.punti = 0; p.tot = nuoviTot(); }); bd(); }

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova, onProssimo: prossimo,
      onBalla: function (testo) { balla("host", testo); }, onVoto: function (k) { voto("host", k); },
      onEsci: function (giaChiesto) {   // (dallo studio la domanda "Uscire dalla partita?" l'ha già fatta lui)
        if (giaChiesto !== true && H.fase !== "lobby" && H.fase !== "fine") return t.conferma("Chiudere la partita per tutti?", null, "Esci", function () { cbHost.onEsci(true); });   // un tocco sbagliato non chiude il gioco a tutti
        ferma(); rete.chiudi(); t.esci();
      } };
    bd();
  }

  // ---------------- OSPITE ----------------
  function ospiteB(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var G = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null,
      onBalla: function (testo) { if (G.rete) G.rete.invia({ t: "balla", testo: testo }); },
      onVoto: function (k) { if (G.rete) G.rete.invia({ t: "voto", k: k }); },
      onEsci: function (giaChiesto) {
        if (giaChiesto !== true && G.vm && G.vm.fase !== "lobby" && G.vm.fase !== "fine") return t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(true); });
        if (G.rete) G.rete.chiudi(); t.esci();
      } };
    if (t.nomeProfilo()) { G.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🤥", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        G.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      var s = t.schermata({ icona: "🤥", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
      G.rete = SGNet.entra(codice, {
        onAperto: function (id) { G.myId = id; cb.myId = id; G.rete.invia({ t: "join", nome: G.nome, omino: t.mioOmino(G.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== G.myId) return;   // era per un altro telefono
          if (m.t === "vm") { G.vm = m.vm; disegnaVM(t, m.vm, cb); }
          else if (m.t === "priv") privatoB(m);
        },
        // l'host ha chiuso la stanza apposta (se sparisce e non torna, "La stanza è chiusa" lo dice il core):
        // sulla classifica finale resta la classifica, con la scritta giusta
        onChiuso: function () {
          if (G.vm && G.vm.fase === "fine") { cb.chiusa = true; if (RB && RB.notaFine) RB.notaFine.textContent = NOTA_CHIUSA; return; }
          errore(t, "🚪 L'host ha chiuso la partita.");
        },
        // (solo se il primo collegamento non riesce)
        onErrore: function () { errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  // ---------------- OGNI TELEFONO: la saletta, poi lo studio con la sua regia ----------------
  var RB = null, NOTA_CHIUSA = "🚪 L'host ha chiuso la stanza.";
  function idxDi(vm, id) { for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return i; return -1; }
  // la mia balla del round (online): la tengo fuori dallo studio, così resta anche se la foto arriva dopo
  var MIA = null;   // { dom: la notizia, testo }
  // i messaggi solo per me: ho scritto la verità, ho votato la mia balla, o l'host mi dice qual è la mia balla
  function privatoB(m) {
    if (m.k === "mia") { MIA = { dom: m.dom, testo: String(m.testo || "") }; if (RB && RB.S._segnaMia) RB.S._segnaMia(); return; }
    if (m.k === "vera") MIA = null;   // la verità non era una balla buona: non è "la mia"
    if (!RB) return;
    if (m.k === "vera") RB.vera = true;
    if (m.k === "tua") RB.tua = true;
    regiaTick(RB);
  }
  function disegnaVM(t, vm, cb) {
    assicuraStile();
    if (vm.fase === "lobby") { RB = null; return lobbyB(t, vm, cb); }
    // lo studio si fa una volta per partita (e di nuovo se l'host ricomincia dopo la fine)
    if (!RB || (!RB.S.vivo() && (vm.fase !== "fine" || !RB.fineFatta))) {
      RB = { t: t, cb: cb, usciti: {} };
      RB.S = ST.crea(t, vm.players, { io: idxDi(vm, cb.myId), esci: function () { cb.onEsci(true); }, titolo: "La Balla Colossale", logo: ["LA BALLA", "COLOSSALE"] });
      vm.players.forEach(function (p, i) { ST.puntiLeggio(RB.S, i, p.punti, 0); });
    }
    RB.vm = vm; RB.cb = cb; RB.vmTs = Date.now();
    if (vm.fase !== "scrittura" && vm.fase !== "voto" && RB.S._chiudiVelo) RB.S._chiudiVelo();   // il tempo è finito per tutti: il foglio si chiude
    regiaTick(RB);
  }
  function lobbyB(t, vm, cb) {
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN_ON,
      vuoti: Math.max(0, MIN_ON - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota bc-lobby", text: "Si gioca con " + vm.giri + " notizie. Ognuno scrive la sua balla e vota dal suo telefono, tutti insieme." })],
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  async function regiaTick(R) {
    if (R.corre) { R.ancora = true; return; }
    R.corre = true;
    try {
      for (var giri = 0; giri < 40; giri++) {
        R.ancora = false;
        var fatto = await regiaPasso(R);
        if (!fatto && !R.ancora) break;
      }
    } catch (e) {} finally { R.corre = false; }
  }
  // lo stato del round come lo usano le schermate (uguali a quelle del telefono che passa)
  function statoDa(R, vm) {
    return { S: R.S, t: R.t, g: vm.players, d: { domanda: vm.domanda || "", rispostaVera: vm.vera || "" }, giro: vm.giro, giri: vm.giri,
      scelte: vm.scelte || [], voti: vm.voti || vm.players.map(function () { return null; }),
      fatti: vm.players.map(function (p) { return (vm.fatti || []).indexOf(p.id) >= 0; }) };
  }
  // un passo della regia: true se ha fatto un momento dello spettacolo (poi si guarda lo stato più recente)
  async function regiaPasso(R) {
    var vm = R.vm, S = R.S;
    if (!S.vivo()) return false;
    vm.players.forEach(function (p, i) {
      if (p.via && !R.usciti[p.id]) { R.usciti[p.id] = true; ST.fuori(S, i, true); ST.testoLeggio(S, i, "👋 uscito", true); }
      else if (!p.via && R.usciti[p.id]) { delete R.usciti[p.id]; ST.fuori(S, i, false); ST.puntiLeggio(S, i, p.punti, 0); }   // è tornato
    });
    var kG = vm.giro, st = statoDa(R, vm);
    if (vm.fase === "apertura") {
      if (R.aperturaFatta) return false;
      R.aperturaFatta = true; await ST.apertura(S); return true;
    }
    R.aperturaFatta = true;
    if (vm.fase === "notizia") {
      if (R.kN === kG) return false;
      R.kN = kG; R.vera = false; R.tua = false;
      ST.viaBarra(S); ST.accendiSolo(S, -1); ST.tutteNormali(S);
      vm.players.forEach(function (p, i) { if (!p.via) ST.puntiLeggio(S, i, p.punti, 0); });
      await ST.suSchermo(S, 800);
      schermoTurno(st, null, "scrive"); R.boxFatti = st.boxFatti;
      ST.FX.rullo(1); await ST.dorme(1100); ST.pubblico(S, "piano");
      if (moltiplica(vm.giro, vm.giri) > 1 && R.vm.fase === "notizia") await annunciaDoppio(S);
      return true;
    }
    // (chi rientra mentre si scrive o si vota: la prima foto può dirlo ancora "uscito"; quando torna dentro gli si apre il foglio)
    var dentro = function () { var me = vm.players[idxDi(vm, R.cb.myId)]; return !!me && !me.via; };
    if (vm.fase === "scrittura") {
      if (R.kS !== kG || R.vera || (R.fuoriS === kG && dentro())) { R.kS = R.kN = kG; R.fuoriS = dentro() ? null : kG; await scriviOnline(R, st); return true; }
      aggiornaFatti(R, vm, "scrive"); return false;
    }
    if (vm.fase === "risposte") {
      if (R.kR === kG) return false;
      R.kR = R.kS = R.kN = kG; ST.viaBarra(S);
      await presentaRisposte(st); return true;
    }
    if (vm.fase === "voto") {
      if (R.kV !== kG || R.tua || (R.fuoriV === kG && dentro())) { R.kV = R.kR = R.kS = R.kN = kG; R.fuoriV = dentro() ? null : kG; await votaOnline(R, st); return true; }
      aggiornaFatti(R, vm, "vota"); return false;
    }
    if (vm.fase === "voti") {
      if (R.kVo === kG) return false;
      R.kVo = R.kV = kG; ST.viaBarra(S);
      await mostraVoti(st); return true;
    }
    if (vm.fase === "rivela") {
      var kP = kG + "|" + vm.passo;
      if (R.kP === kP) return false;
      R.kP = kP; R.kVo = kG; ST.viaBarra(S);
      var nL = (vm.ordine || []).length;
      if (vm.passo < nL) await mostraScelta(st, vm.ordine[vm.passo], true);
      else if (vm.passo === nL) await mostraScelta(st, st.scelte.map(function (sc) { return sc.vera; }).indexOf(true), true);
      else await schermoIgnorate(st, vm.ignorate || [], true);
      return true;
    }
    if (vm.fase === "punti" || vm.fase === "fine") {
      if (R.kPunti !== kG && vm.ultimo) { R.kPunti = kG; await puntiOnline(R, vm); return true; }
      if (vm.fase === "fine") {
        if (R.fineFatta) return false;
        R.fineFatta = true; await finaleOnline(R, vm); return true;
      }
      if (R.kClas !== kG) { R.kClas = kG; await classificaOnline(R, vm); return true; }
      return false;
    }
    return false;
  }
  function tempoRimasto(R) { return Math.max(3000, (R.vm.rimMs || 0) - (Date.now() - R.vmTs)); }   // il tempo che resta secondo l'host
  // tutti scrivono insieme: la telecamera va sul mio leggio e si apre il MIO foglio
  async function scriviOnline(R, st) {
    var S = R.S, el = R.t.el, cb = R.cb, vm = R.vm, io = idxDi(vm, cb.myId), me = vm.players[io];
    var riprova = R.vera; R.vera = false;
    schermoTurno(st, null, "scrive"); R.boxFatti = st.boxFatti; aggiornaFatti(R, vm, "scrive", true);
    if (io < 0 || !me || me.via || (!riprova && (vm.fatti || []).indexOf(cb.myId) >= 0)) { await ST.suSchermo(S, 800); attesaOnline(R, io < 0 || !me || me.via); return; }
    ST.accendiSolo(S, io); ST.testoLeggio(S, io, "✍️ scrive");
    if (!riprova) { ST.terzo(S, io, "Scrivete tutti la vostra balla!", "Deve sembrare vera", "✍️"); await ST.suLeggio(S, io, 700); ST.viaTerzo(S); ST.lampo(S); }
    var testo = await apriBiglietto(st, io, { ms: tempoRimasto(R), verita: false, avviso: riprova ? AVVISO_VERA : null });
    if (!S.vivo()) return;
    if (testo && R.vm.fase === "scrittura") { MIA = { dom: vm.domanda, testo: testo }; cb.onBalla(testo); }   // (l'host poi conferma, o dice "è la verità")
    ST.testoLeggio(S, io, testo ? "✅ fatto" : "😶 niente"); ST.faccia(S, io, testo ? "esulta" : "triste");
    await ST.suSchermo(S, 800);
    ST.faccia(S, io, null);
    if (R.vm.fase === "scrittura") ST.barra(S, [ el("p", { class: "bc-attesa", text: "Fatto! Aspettiamo gli altri…" }), R.t.faccine() ]);
  }
  // chi non scrive/vota adesso (guarda, oppure ha già finito): una riga e le faccine, mentre gli altri finiscono
  function attesaOnline(R, guardo) {
    var S = R.S, el = R.t.el, f = R.vm.fase;
    if (!S.vivo() || (f !== "scrittura" && f !== "voto")) return;
    ST.barra(S, [ el("p", { class: "bc-attesa", text: guardo ? "👀 Stai guardando: alla prossima partita giochi anche tu." : "Fatto! Aspettiamo gli altri…" }), R.t.faccine() ]);
  }
  // tutti votano insieme, ognuno dal suo telefono; il tabellone resta sul maxischermo
  async function votaOnline(R, st) {
    var S = R.S, el = R.t.el, cb = R.cb, vm = R.vm, io = idxDi(vm, cb.myId), me = vm.players[io];
    var riprova = R.tua; R.tua = false;
    schermoTurno(st, null, "vota"); R.boxFatti = st.boxFatti; aggiornaFatti(R, vm, "vota", true);
    if (io < 0 || !me || me.via || (!riprova && (vm.fatti || []).indexOf(cb.myId) >= 0)) { await ST.suSchermo(S, 800); attesaOnline(R, io < 0 || !me || me.via); return; }
    ST.accendiSolo(S, io); ST.testoLeggio(S, io, "🗳️ vota");
    if (!riprova) { ST.terzo(S, io, "Tutti al voto!", "Qual è la risposta vera?", "🗳️"); await ST.suLeggio(S, io, 700); ST.viaTerzo(S); ST.lampo(S); }
    var mia = function (sc) { return !!MIA && MIA.dom === R.vm.domanda && norm(sc.testo) === norm(MIA.testo); };
    var k = await apriVoto(st, io, { ms: tempoRimasto(R), mia: mia, avviso: riprova ? "✍️ Quella è la tua balla! Vota un'altra risposta." : null });
    if (!S.vivo()) return;
    if (k != null && R.vm.fase === "voto") cb.onVoto(k);
    ST.testoLeggio(S, io, k != null ? "✅ votato" : "😶 niente"); ST.faccia(S, io, "pensa");
    await ST.suSchermo(S, 800);
    ST.faccia(S, io, null);
    if (R.vm.fase === "voto") ST.barra(S, [ el("p", { class: "bc-attesa", text: k != null ? "Votato! Aspettiamo gli altri…" : "Aspettiamo gli altri…" }), R.t.faccine() ]);
  }
  // chi ha già finito: le spunte sotto il maxischermo e sui leggii (si rifanno solo se cambia qualcosa)
  function aggiornaFatti(R, vm, cosa, forza) {
    var S = R.S, el = R.t.el, fatti = vm.fatti || [], k = cosa + "|" + fatti.join("|");
    if (!forza && R.kFatti === k) return;
    R.kFatti = k;
    if (R.boxFatti) {
      ST.vuota(R.boxFatti);
      vm.players.forEach(function (p) { if (p.via) return; var ok = fatti.indexOf(p.id) >= 0;
        R.boxFatti.appendChild(el("span", { class: ok ? "ok" : "" }, [ fac(el, p), el("span", { text: (ok ? "✅ " : "") + (p.id === R.cb.myId ? "Tu" : p.nome) }) ])); });
    }
    vm.players.forEach(function (p, i) { if (p.via) return; var ok = fatti.indexOf(p.id) >= 0; ST.testoLeggio(S, i, ok ? (cosa === "vota" ? "✅ votato" : "✅ fatto") : (cosa === "vota" ? "🗳️ vota" : "✍️ scrive")); });
  }
  // i punti del round scorrono sui leggii
  async function puntiOnline(R, vm) {
    var S = R.S, tot = vm.ultimo || {};
    ST.viaBarra(S); ST.accendiSolo(S, -1); ST.viaTerzo(S);
    await ST.largo(S, 900);
    ST.terzo(S, null, "Fine del round " + (vm.giro + 1), "Ecco i punti!", "🏁");
    for (var i = 0; i < vm.players.length; i++) {
      var p = vm.players[i]; if (p.via) continue;
      var d = tot[p.id] || 0;
      ST.puntiLeggio(S, i, p.punti, d);
      ST.faccia(S, i, d > 0 ? "esulta" : "triste");
      await ST.dorme(320);
    }
    ST.pubblico(S, "applauso");
    await ST.dorme(1700); ST.viaTerzo(S); ST.tutteNormali(S);
  }
  function ordineB(vm) { return vm.players.filter(function (p) { return !p.via; }).sort(function (x, y) { return y.punti - x.punti; }); }
  async function classificaOnline(R, vm) {
    var S = R.S, el = R.t.el, cb = R.cb, tot = vm.ultimo || {};
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "bc-clas" }, [ el("h2", { text: "🏁 Classifica dopo " + (vm.giro + 1) + " round" }) ]);
    var lista = ordineB(vm);
    lista.forEach(function (p, k) {
      var pos = 1 + lista.filter(function (q) { return q.punti > p.punti; }).length;   // a pari punti, stessa medaglia
      var r = el("div", { class: "bc-cl" + (pos === 1 ? " primo" : "") }, [
        el("span", { class: "pos", text: medaglia(pos) }), fac(el, p), el("span", { class: "nm", text: p.nome + (p.id === cb.myId ? " (tu)" : "") }),
        el("span", { class: "pt", text: String(p.punti) }), el("span", { class: "pi", text: "+" + (tot[p.id] || 0) })
      ]);
      r.style.animationDelay = (k * 0.1) + "s";
      box.appendChild(r);
    });
    S.sch.appendChild(box);
    // l'host: "Prossima notizia ▶ 12" (conta e a zero si va avanti); gli altri: "Si va avanti tra 12…" (il tempo lo tiene l'host)
    var sec = Math.max(1, Math.round(((R.vm.rimMs || 12000) - (Date.now() - R.vmTs)) / 1000)), k = "bc-notizia|" + vm.sessione + "|" + vm.giro;
    var nodo = cb.sonoHost ? el("button", { class: "btn btn-primario", text: "Prossima notizia ▶", onclick: function () { ST.viaBarra(S); cb.onProssimo(); } })
      : el("p", { class: "bc-attesa" });
    ST.barra(S, [ nodo, R.t.faccine() ]);
    R.t.contoAvanti(nodo, sec, cb.sonoHost ? function () { ST.viaBarra(S); cb.onProssimo(); } : null, k);
  }
  async function finaleOnline(R, vm) {
    var S = R.S, t = R.t, el = t.el, cb = R.cb, clas = vm.classifica || [];
    // vince il primo della classifica (chi è uscito sta in fondo); a pari punti vincono in tanti
    var gen = clas.map(function (r) { var p = vm.players[idxDi(vm, r.id)] || {}; return { id: r.id, nome: r.nome, omino: p.omino || null, punti: r.punti, via: r.via, tot: r.tot }; });
    salvaContatori(clas, cb.myId, true, vm.sessione);
    await schermoPremi(S, el, gen, true);
    if (!S.vivo()) return;
    var primi = clas.filter(function (r) { return r.pos === 1; });
    if (primi.length === 1) await ST.finale(S, idxDi(vm, primi[0].id), primi[0].punti + " punti");
    else await granFinale(S, vm.players, primi.map(function (r) { return vm.players[idxDi(vm, r.id)] || r; }));
    var titolo = !primi.length ? "Fine partita" : primi.length === 1 ? "Vince " + primi[0].nome + "!" : "Pareggio!";
    var s = t.schermata({ icona: "🏆", titolo: titolo, sotto: "La Balla Colossale" });
    var box = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    clas.forEach(function (r) {
      var p = vm.players[idxDi(vm, r.id)] || r;
      box.appendChild(el("div", { class: "bc-cl" + (r.pos === 1 ? " primo" : "") }, [
        el("span", { class: "pos", text: medaglia(r.pos) }), fac(el, p), el("span", { class: "nm", text: r.nome + (r.id === cb.myId ? " (tu)" : "") + (r.via ? " (uscito)" : "") }),
        el("span", { class: "pt", text: r.punti + " punti" }) ]));
    });
    s._contenuto.appendChild(box);
    if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(R.notaFine = el("p", { class: "modulo-nota", style: "text-align:center", text: cb.chiusa ? NOTA_CHIUSA : "⏳ Aspetta l'host: se fa un'altra partita, torni da solo nella saletta." }));
    var fa = t.faccine();   // le faccine mentre si guarda la classifica
    if (fa) { fa.style.marginTop = "10px"; s._contenuto.appendChild(fa); }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(s);
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
      // il tabellone delle risposte
      ".bc-sch.tab{justify-content:flex-start;justify-content:safe center;overflow:hidden;gap:10px;padding-top:46px}",
      ".bc-sch.tab .bc-notizia{font-size:calc(var(--fs,18px) + 1px)}.bc-sch.tab .bc-ritaglio{padding:9px 12px 11px}",
      ".bc-sch.tab.soloFacce .bc-fatti{gap:4px}.bc-sch.tab.soloFacce .bc-fatti>span{padding:2px}.bc-sch.tab.soloFacce .bc-fatti>span>span:not(.fac){display:none}.bc-sch.tab.corto .bc-ritaglio{display:none}",
      ".bc-sch.tab.minimo{gap:6px}.bc-sch.tab.minimo .bc-tab{gap:4px}.bc-sch.tab.minimo .bc-riga{padding:3px 8px 3px 4px}.bc-sch.tab.minimo .bc-riga .n{width:22px;height:22px;font-size:12px}.bc-sch.tab.minimo .bc-chi-sch{font-size:18px}",
      ".bc-tab{display:flex;flex-direction:column;gap:7px;width:100%;max-width:440px;perspective:700px}",
      ".bc-riga{display:flex;align-items:center;gap:9px;text-align:left;background:#fffdf4;color:#1d2a5c;border-radius:12px;padding:6px 10px 6px 6px;box-shadow:0 5px 14px rgba(0,0,0,.35);transform-origin:50% 0;transition:transform .4s cubic-bezier(.3,1.4,.5,1),opacity .3s}",
      ".bc-riga.giu{transform:rotateX(-92deg);opacity:0}",
      ".bc-riga .n{flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#5a4a9a;color:#fff;font-weight:900;font-size:14px}",
      ".bc-riga .tx{flex:1;min-width:0;font-family:" + MANO + ";font-size:var(--fs,18px);font-weight:700;line-height:1.2;overflow-wrap:anywhere}",
      ".bc-riga .vv{flex:0 0 auto;display:flex;max-width:45%;flex-wrap:wrap;justify-content:flex-end}",
      ".bc-riga .vv .fac{width:26px;height:26px;margin-left:-6px;border:2px solid #fffdf4;background:#e9e3d2;animation:bcPop .35s cubic-bezier(.3,1.6,.5,1) both}",
      ".bc-chi-sch.pulsa{animation:bcPulsa 1.1s ease-in-out infinite}",
      "@keyframes bcPulsa{50%{transform:scale(1.07)}}",
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
      ".bc-ok{width:100%;margin:0;position:sticky;bottom:0;z-index:2;box-shadow:0 -6px 16px rgba(7,4,26,.55)}",   // il tasto resta sempre a vista
      ".bc-tempo-riga{display:flex;align-items:center;gap:8px}.bc-tempo-riga .bc-tempo{flex:1}",
      ".bc-sec{min-width:30px;text-align:right;font-size:17px;font-weight:900;color:#ffd43b;font-variant-numeric:tabular-nums}.bc-sec.poco{color:#ff5d6c}",
      // con la tastiera aperta: la notizia si fa piccola
      ".bc-carta.tastiera{gap:8px}.bc-carta.tastiera .bc-testata,.bc-carta.tastiera .bc-chi small{display:none}.bc-carta.tastiera .bc-notizia{font-size:14px}.bc-carta.tastiera .bc-chi{font-size:16px}.bc-carta.tastiera .bc-chi .fac{width:30px;height:30px}.bc-carta.tastiera .bc-penna{font-size:20px}",
      // le scelte da votare
      ".bc-scelte{display:flex;flex-direction:column;gap:8px}",
      ".bc-scelta .n{flex:0 0 auto;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#5a4a9a;color:#fff;font-family:system-ui,sans-serif;font-weight:900;font-size:13px}",
      ".bc-tempo{height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden}.bc-tempo i{display:block;height:100%;width:100%;background:#ffd43b;transform-origin:0 50%;will-change:transform}.bc-tempo.poco i{background:#ff5d6c}",
      ".bc-attesa{margin:0;text-align:center;font-weight:800;color:#cdd6ff}",
      ".bc-lobby{margin:0;font-size:14px;line-height:1.45}",
      ".bc-scelta{display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:2px solid #e2d8c3;border-radius:14px;background:#fffdf4;color:#1d2a5c;padding:9px 12px;font-family:" + MANO + ";font-size:20px;font-weight:700;line-height:1.25;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s}",
      ".bc-scelta:active{transform:scale(.97)}",
      ".bc-scelta .tx{flex:1;min-width:0;overflow-wrap:anywhere}",
      ".bc-scelta.sel{border-color:#f59f00;background:#fff3bf;box-shadow:0 0 0 3px rgba(245,159,0,.35)}",
      ".bc-scelta.mia{opacity:.55;cursor:default}",
      ".bc-scelta .tag{flex:0 0 auto;font-family:system-ui,sans-serif;font-size:11px;font-weight:900;color:#fff;background:#5a4a9a;border-radius:99px;padding:3px 8px}",
      ".bc-scelte.tante .bc-scelta{font-size:var(--fs,16px);line-height:1.18;padding:6px 10px}",
      ".bc-carta.piccola .bc-notizia{font-size:13px}.bc-carta.piccola .bc-testata{display:none}.bc-carta.piccola .bc-chi small{display:none}",
      // tantissime risposte: su due colonne e, se non basta, senza la notizia (è già sul maxischermo)
      ".bc-carta.due .bc-scelte{display:grid;grid-template-columns:1fr 1fr;gap:6px}.bc-carta.due .bc-scelta{padding:5px 7px;gap:5px;align-items:flex-start}.bc-carta.due .bc-scelta .n{width:20px;height:20px;font-size:11px}",
      ".bc-carta.due .bc-scelta .tag{position:absolute;right:4px;bottom:-7px;font-size:9px;padding:1px 5px}.bc-carta.due .bc-scelta{position:relative}",
      ".bc-carta.senza .bc-ritaglio{display:none}",
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
      ".bc-redazione{font-size:19px;font-weight:900;background:rgba(205,214,255,.18);border-radius:99px;padding:5px 14px}",
      // i premi della serata
      ".bc-premi{gap:12px}",
      ".bc-premio-riga{display:flex;align-items:center;gap:10px;width:100%;max-width:440px;box-sizing:border-box;background:rgba(255,255,255,.08);border-radius:16px;padding:8px 10px;text-align:left;animation:bcPop .45s cubic-bezier(.3,1.6,.5,1) both}",
      ".bc-premio-riga .ic{font-size:34px;flex:0 0 auto}",
      ".bc-premio-riga .cosa{flex:1;min-width:0;display:flex;flex-direction:column}.bc-premio-riga .cosa b{font-size:18px;color:#ffe066}.bc-premio-riga .cosa small{font-size:13px;font-weight:700;color:#cdd6ff}",
      ".bc-premio-riga .chi{display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex:0 1 auto;min-width:0}.bc-premio-riga .bc-votante{font-size:15px;padding:2px 10px 2px 2px}.bc-premio-riga .bc-votante .fac{width:28px;height:28px}",
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
