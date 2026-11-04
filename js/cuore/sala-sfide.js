/* =========================================================
   PEZZO DEL CUORE — 👑 LE SFIDE NELLA SALA
   I giochi a due (o con pochi posti) dentro la Sala della serata: il torneino (un gioco a due
   con 3 o più persone, giocano tutti), «Chi gioca a Tris?» quando siamo più dei posti, il duello
   tra due amici con l'host che guarda, e «👑 Chi vince resta» (Passo 6: la coda, il campione,
   il pareggio che lascia il campione, «⏹ Basta così»). Messaggi e campi: vedi AGENTS.md.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var el = cuore.el, schermata = cuore.schermata, mostra = cuore.mostra, dimenticaLinkSessione = cuore.dimenticaLinkSessione,
      pillola = cuore.pillola, schermataHome = cuore.schermataHome, postiDi = cuore.postiDi, salaRisultato = cuore.salaRisultato,
      rigaPuntiFine = cuore.rigaPuntiFine, creaSala = cuore.creaSala, chiudiSala = cuore.chiudiSala, membroSala = cuore.membroSala,
      disegnaSalaHost = cuore.disegnaSalaHost, hostSceglie = cuore.hostSceglie, salaScegliGioco = cuore.salaScegliGioco,
      salaPreparaGioco = cuore.salaPreparaGioco, restaOpz = cuore.restaOpz, salaParti = cuore.salaParti, aGioco = cuore.aGioco,
      salaLancia = cuore.salaLancia, salaCambiaGioco = cuore.salaCambiaGioco, salaOspite = cuore.salaOspite, mioIdSala = cuore.mioIdSala,
      GIOCHI_ELIMINAZIONE = cuore.GIOCHI_ELIMINAZIONE, MAX_ELIM = cuore.MAX_ELIM, giocoDa = cuore.giocoDa, SL = cuore.SL, haRegole = cuore.haRegole,
      togliNodo = cuore.togliNodo, SVH = cuore.SVH, medaglieAPari = cuore.medaglieAPari, cifre = cuore.cifre, stessoNome = cuore.stessoNome,
      impSalvabili = cuore.impSalvabili, chipGuardo = cuore.chipGuardo, togliGuardo = cuore.togliGuardo, contoAvanti = cuore.contoAvanti,
      lasciaPartita = cuore.lasciaPartita, avviaPartita = cuore.avviaPartita;

  // ---------- IL TORNEINO: un gioco a due con 3 o più persone, giocano tutti ----------
  // È il torneo a eliminazione dentro la Sala della serata (stessi id, nessun link nuovo): coppie a sorte, tutte le partite
  // insieme, chi vince va avanti fino alla finale; alla fine "👥 Torna in Sala" (e i punti, se "Contiamo i punti" è acceso).
  // T = { resto: "bot" (chi resta in più gioca col Bot, che è un partecipante vero) o "passa", livello del Bot }
  function nuovoTorneino(gid, imp, T, attesi) {
    T = T || {};
    var E = { gioco: gid, torneino: true, iniziato: false, finito: false, turni: [], nomi: {}, campione: null, gironi: {}, imp: imp || {},
      resto: T.resto === "passa" ? "passa" : "bot", livello: cuore.livelloElim(T), coppie: T.coppie === "scelte" ? "scelte" : "caso" };
    if (attesi) E.attesi = attesi;
    return E;
  }
  // si parte: "🎲 A caso" = le coppie a sorte subito; "✋ Scegliete voi" = prima ognuno si siede dove e con chi vuole
  // (Partita 1: [ ] contro [ ]…), l'host vede "Seduti 5 su 6" e parte quando vuole; dopo TEMPO_COPPIE si parte da soli
  // (chi non si è seduto va a caso nei posti rimasti: gironiElim)
  var TEMPO_COPPIE = 45000;
  function partiTorneino(E) {
    if (!cuore.sala || cuore.sala.elim !== E) return;
    if (E.coppie !== "scelte") return cuore.avviaElim();
    E.iniziato = false; E.finito = false; E.turni = []; E.campione = null; E.gironi = {}; delete E.attesi;
    E.scade = Date.now() + TEMPO_COPPIE;
    clearTimeout(cuore.sala.tCoppie);
    cuore.sala.tCoppie = setTimeout(function () { if (cuore.sala && cuore.sala.elim === E && !E.iniziato) cuore.avviaElim(); }, TEMPO_COPPIE);
    cuore.lasciaTorneo(cuore.sala);
    cuore.sala._bcast(); cuore.seguiHost();
  }
  // in quante partite ci si siede (torneino: quante ne servono; torneo a eliminazione di sempre: 5 gironi)
  function partiteCoppie(E, n) { return E.torneino ? Math.max(1, Math.min(cuore.N_GIRONI, Math.ceil(Math.min(n, MAX_ELIM) / 2))) : cuore.N_GIRONI; }
  // il conto alla rovescia delle coppie: si cambia solo la scritta (due volte al secondo), mai il tabellone
  var tContoCoppie = null;
  function contoCoppie() {
    if (tContoCoppie) return;
    tContoCoppie = setInterval(function () {
      var l = document.querySelectorAll(".tb-conto[data-scade]");
      if (!l.length) { clearInterval(tContoCoppie); tContoCoppie = null; return; }
      [].forEach.call(l, function (x) { var sec = Math.max(0, Math.ceil((+x.getAttribute("data-scade") - Date.now()) / 1000)), tx = "⏱️ Si parte da soli tra " + sec + " s"; if (x.textContent !== tx) x.textContent = tx; });
    }, 500);
  }
  // in quanti giocano davvero (al massimo 10: gli altri guardano)
  function quantiTorneino(n) { return Math.min(n, MAX_ELIM); }
  // "Tris in 5": 🏆 Torneino (già scelto) o ⚔️ Una sfida. Se si è dispari, sotto: chi resta in più (Bot o passa il turno)
  // e la bravura del Bot. In uno schermo senza scorrere; un tocco sceglie, "▶" parte
  function schermataTorneino(g, R) {
    if (!cuore.sala) return schermataHome();
    var n = cuore.sala.membri.length, T = cuore.sala.optTorneino = cuore.sala.optTorneino || { resto: "bot", livello: "medio" }, scelta = "torneino";
    var s = schermata({ icona: g.icona || "🎲", titolo: g.nome + " in " + n, sotto: "Si gioca in 2: come fate?", indietro: function () { salaScegliGioco(); } });
    s.classList.add("torneino-sc");
    function carta(id, ico, tit, sotto) {
      var b = el("button", { class: "tn-scelta", type: "button", "aria-pressed": "false", onclick: function () { scelta = id; rifai(); } }, [
        el("span", { class: "tn-ico", text: ico }),
        el("span", { class: "tn-testo" }, [ el("b", { text: tit }), el("small", { text: sotto }) ]),
        el("span", { class: "tn-spunta", "aria-hidden": "true", text: "✓" }) ]);
      b._id = id;
      return b;
    }
    var m = quantiTorneino(n), dispari = m % 2 === 1;
    var cT = carta("torneino", "⚔️", "Torneo: giocate tutti", (n > MAX_ELIM ? "Giocano in " + MAX_ELIM + ", gli altri guardano. " : "") + "Tutte le partite insieme: chi vince va avanti fino alla finale");
    // (Passo 6) da qui anche "👑 Chi vince resta": in «Chi gioca?» (una carta in più farebbe scorrere lo schermo)
    var cS = carta("sfida", "🤺", "Una sfida: scegli chi gioca", restaOpz(g, R) ? "In 2, gli altri guardano · anche 👑 Chi vince resta" : "Giocano in 2, gli altri guardano in diretta");
    // un gioco che si fa anche in tre (la Scopa: g.inTre e il riquadro delle regole sa passare a tre): in tre la prima scelta
    // è «In tre: giocate tutti», tutti allo stesso tavolo
    var tre = n === 3 && g.inTre && R && R.box && typeof R.box._inTre === "function";
    var cTre = tre ? carta("tre", "👥", "In tre: giocate tutti", "Tutti e tre allo stesso tavolo, ognuno per sé") : null;
    if (tre) scelta = "tre";
    var opz = cuore.opzioniTorneino(T, function () { rifai(); }, false, dispari);
    var nota = el("p", { class: "modulo-nota tn-nota" });
    s._contenuto.appendChild(el("div", { class: "tn-scelte" }, [cTre, cT, cS].filter(Boolean)));
    if (opz) s._contenuto.appendChild(opz);
    s._contenuto.appendChild(nota);
    var via = el("button", { class: "btn btn-primario", type: "button", onclick: function () {
      if (!cuore.sala) return schermataHome();
      if (tre) try { R.box._inTre(scelta === "tre"); } catch (e) {}   // (in due per la sfida e il torneo)
      if (scelta === "tre") return salaParti(g, R, cuore.sala.membri.map(function (x) { return { id: x.id, nome: x.nome }; }));
      if (scelta === "sfida") return schermataChiGioca(g, function (scelti) { salaParti(g, R, scelti); }, restaOpz(g, R));
      salaTorneino(g, R, T);
    } });
    // le regole del gioco (le stesse per tutte le partite): nel ⚙️, come nella saletta
    var bReg = R && haRegole(R.box) ? el("button", { class: "btn btn-fantasma sl-regole", type: "button", text: "⚙️ Regole", onclick: function () { foglioBox("⚙️ Regole della partita", R.box); } }) : null;
    s._piede.appendChild(bReg ? el("div", { class: "sl-tasti" }, [bReg, via]) : via);
    // si cambiano solo le classi e le scritte: niente lampeggio
    function rifai() {
      [cTre, cT, cS].filter(Boolean).forEach(function (c) { var si = c._id === scelta; c.classList.toggle("scelta", si); c.setAttribute("aria-pressed", si ? "true" : "false"); });
      if (opz) opz.hidden = scelta !== "torneino";
      var tx = scelta === "tre" ? "Una partita sola, tutti e tre allo stesso tavolo." : scelta === "sfida" ? "Poi scegli i due che giocano." : T.coppie === "scelte" ? "Ognuno si siede dove e con chi vuole: poi parti tu." : (dispari ? (T.resto === "passa" ? "Siete dispari: uno a sorte passa il turno." : "Siete dispari: chi resta gioca col Bot. Se lo batte va avanti, se no va avanti il Bot!") : "Siete pari: giocano tutti subito.");
      if (nota.textContent !== tx) nota.textContent = tx;
      var tv = scelta === "tre" ? "▶ Si gioca in tre" : scelta === "sfida" ? "🤺 Scegli chi gioca" : "⚔️ Via al torneo";
      if (via.textContent !== tv) via.textContent = tv;
    }
    rifai();
    mostra(s);
  }
  // un foglio con dentro un riquadro di regole (lo stesso nodo: le scelte restano come le avevi lasciate)
  function foglioBox(titolo, box) {
    if (document.querySelector(".sl-velo")) return;
    var velo;
    function chiudi() { if (box.parentNode) box.parentNode.removeChild(box); if (velo.parentNode) velo.parentNode.removeChild(velo); }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: titolo }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [box]),
        el("button", { class: "btn btn-primario", text: "✅ Fatto", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }
  // si parte: la Sala diventa il tabellone del torneino (per tutti, da sola), le coppie si sorteggiano e le partite si aprono
  function salaTorneino(g, R, T) {
    if (!cuore.sala || !g) return schermataHome();
    restaFerma(true);   // (👑 "Chi vince resta" finisce: il record resta)
    lasciaPartita(); cuore.FINE = null; cuore.RIV = null;
    cuore.lasciaTorneo(cuore.sala);
    cuore.sala.gioco = null; cuore.sala.stanza = null; cuore.sala.inGioco = false; cuore.sala.fase = null; cuore.sala.fuori = {}; cuore.sala.ctx = null; cuore.sala.duello = null; cuore.sala.fineDuello = null; cuore.sala.sceglie = false;
    var imp = R && R.imp ? R.imp : {};
    delete imp.scelti; imp.modo = "online";
    cuore.sala.elim = nuovoTorneino(g.id, imp, T || cuore.sala.optTorneino);
    cuore.sala.regoleElim = null; cuore.sala._regoleBox = R ? R.box : null;
    SGNet.chiudiGiochi(1500);   // (la stanza del gioco di prima, se c'era: prima gli amici passano al torneino)
    partiTorneino(cuore.sala.elim);
  }
  // "🏆 Fate il torneino in 5" nella saletta di un gioco a due (host), quando nella stanza (o nella Sala) si è almeno in 3.
  // N = in quanti (0 = niente tasto)
  function torneinoPossibile(U) {
    var SV = U && U.rete && U.rete._sv, P = U && U.rete && U.rete._P;
    if (!U || !U.host || !GIOCHI_ELIMINAZIONE[U.gid] || !SV || !SV.host || !P || !P.viva() || U.via) return 0;
    var C = P.salaCtx;
    if (C) return C.tabellone || C.duello || !cuore.sala || cuore.sala.elim || cuore.sala.ctx !== C ? 0 : cuore.sala.membri.length;   // un gioco della Sala: tutta la Sala
    return 1 + Object.keys(SV.dentro).filter(function (id) { return id !== "host" && id !== "__io" && !SV.fuori[id]; }).length;
  }
  function tastoTorneino(U) {
    if (!U || !U.bTorneino) return;
    var n = torneinoPossibile(U), si = n >= 3, tx = "⚔️ Fate il torneo in " + n;
    if (U.bTorneino.hidden === si) U.bTorneino.hidden = !si;
    if (si && U.bTorneino.textContent !== tx) U.bTorneino.textContent = tx;
  }
  // un tocco: la stanza diventa il torneino con tutti dentro, senza rimandare link.
  // Gioco della Sala → il torneino della Sala. Stanza fuori dalla Sala → si apre una Sala col torneino e chi era nella stanza
  // ci passa da solo (messaggio "__torneino" col codice della Sala, ripetuto per qualche secondo; stesso id di prima)
  function torneinoDaSaletta(U) {
    if (torneinoPossibile(U) < 3) return;
    var g = giocoDa(U.gid), P = U.rete._P, SV = U.rete._sv; if (!g) return;
    var T = (cuore.sala && cuore.sala.optTorneino) || { resto: "bot", livello: "medio" };
    if (P.salaCtx) {
      var R = cuore.sala.regole && cuore.sala.regole[g.id];
      if (!R) R = cuore.sala.regole[g.id] = { box: U.R ? U.R.box : null, imp: P.tavolo ? P.tavolo.impostazioni : {} };
      SL.ultimo = null;
      return salaTorneino(g, R, T);
    }
    var C = SGNet.nuovoCodice(), h = SV.h, attesi = Object.keys(SV.dentro).filter(function (id) { return id !== "host" && id !== "__io" && !SV.fuori[id]; });
    var imp = {}; try { imp = JSON.parse(JSON.stringify((U.R && U.R.imp) || (P.tavolo && P.tavolo.impostazioni) || {})); } catch (e) {}
    var box = U.R && U.R.box && U.R.imp ? U.R.box : null;
    if (box) imp = U.R.imp;   // (il riquadro delle regole scrive lì: si tiene insieme)
    var msg = { t: "__torneino", sala: C }, volte = 0;
    try { h.invia(msg); } catch (e) {}
    var tRip = setInterval(function () { if (++volte > 6) return clearInterval(tRip); try { h.inviaVeloce(msg); } catch (e) {} }, 700);
    lasciaPartita(); SL.ultimo = null;
    SGNet.chiudiGiochi(5000);   // (la stanza del gioco si chiude quando sono passati tutti)
    if (cuore.sala) chiudiSala();
    creaSala({ codice: C, torneino: { gioco: g.id, imp: imp, box: box, resto: T.resto, livello: T.livello, coppie: T.coppie, attesi: attesi } });
  }
  // chi era nella stanza riceve "__torneino": passa nella Sala del torneino (con lo stesso id della stanza)
  function vaiAlTorneino(R, m) {
    var C = String((m && m.sala) || "").toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(C) || R.torneino || !R.P || !R.P.viva() || R.P.salaCtx) return;
    R.torneino = C;
    var id = R.h && R.h.mioId;
    if (id) SGNet.ricordaId(C, id);
    lasciaPartita(); SGNet.chiudiGiochi();
    dimenticaLinkSessione();
    pillola("torneino", "⚔️ Si fa il torneo!", "verde", 3000);
    salaOspite(C);
  }

  // ---------- "CHI GIOCA A TRIS?" (siamo più dei posti) ----------
  // chi gioca, già scelto: prima chi ha giocato meno stasera (a pari merito chi è arrivato prima nella Sala);
  // nei giochi da 3 posti in su l'host è sempre dentro
  function sceltiDiPartenza(posti, conHost) {
    var G = cuore.sala.giocate || {}, ordine = cuore.sala.membri.map(function (m, i) { return { m: m, i: i, n: G[m.nome] || 0 }; });
    var sc = conHost ? [cuore.sala.membri[0]] : [];
    ordine.filter(function (x) { return !(conHost && x.m.id === "host"); })
      .sort(function (a, b) { return a.n - b.n || a.i - b.i; })
      .slice(0, posti - sc.length).forEach(function (x) { sc.push(x.m); });
    return sc;
  }
  // la schermata, senza scorrere: gli avatar della Sala (5 per riga), chi gioca evidenziato, sotto chi guarda e "▶ Si gioca".
  // Un tocco aggiunge o toglie; da pieni, chi si tocca prende il posto del più vecchio scelto (l'host no). poi(scelti)
  // o (facoltativo, giochi a due) = { resta(scelti): "👑 Chi vince resta" con i due scelti }
  function schermataChiGioca(g, poi, o) {
    if (!cuore.sala) return schermataHome();
    o = o && typeof o.resta === "function" ? o : null;
    var posti = postiDi(g), conHost = posti >= 3, membri = cuore.sala.membri.slice();
    var sc = sceltiDiPartenza(posti, conHost).map(function (m) { return m.id; });
    var s = schermata({ icona: g.icona || "🎲", titolo: "Chi gioca " + aGioco(g.nome) + "?",
      sotto: posti === 2 ? "Giocano in 2: gli altri guardano" : "Giocano in " + posti + ": gli altri guardano",
      indietro: function () { salaScegliGioco(); } });
    s.classList.add("chi-gioca-sc");
    var griglia = el("div", { class: "chi-gioca" + (membri.length > 10 ? " tanti" : "") });
    var celle = {};
    membri.forEach(function (m) {
      var fisso = conHost && m.id === "host";
      var b = el("button", { class: "cg-chi" + (fisso ? " fisso" : ""), type: "button", "aria-pressed": "false", onclick: function () { tocca(m.id); } }, [
        el("span", { class: "cg-av", html: window.SGOmino ? SGOmino.svg(m.omino || SGOmino.casuale(m.nome), { busto: true }) : "<span class='cg-emo'>🙂</span>" }),
        el("span", { class: "cg-segno", "aria-hidden": "true", text: "✓" }),
        el("span", { class: "cg-nome", text: m.id === "host" ? m.nome + " (tu)" : m.nome })
      ]);
      celle[m.id] = b;
      griglia.appendChild(b);
    });
    var guardano = el("p", { class: "cg-guardano" });
    var nota = el("p", { class: "modulo-nota cg-nota", text: conHost ? "Tu giochi sempre. Tocca un amico per farlo giocare al posto di un altro."
      : (o ? "Tocca chi gioca. Con «👑 Chi vince resta» chi vince resta al tavolo e gli altri fanno la coda." : "Tocca chi gioca: se non giochi tu, li guardi in diretta.") });
    s._contenuto.appendChild(griglia);
    s._contenuto.appendChild(guardano);
    s._contenuto.appendChild(nota);
    function chi() { return sc.map(function (id) { var m = membri.filter(function (x) { return x.id === id; })[0]; return { id: id, nome: m ? m.nome : "" }; }); }
    var via = el("button", { class: "btn btn-primario", type: "button", onclick: function () {
      if (sc.length !== posti || !cuore.sala) return;
      poi(chi());
    } });
    // "👑 Chi vince resta" (sotto "▶ Si gioca", con gli stessi due scelti: sono i primi)
    var bResta = o ? el("button", { class: "btn btn-fantasma cg-resta", type: "button", text: "👑 Chi vince resta", onclick: function () {
      if (sc.length !== posti || !cuore.sala) return;
      o.resta(chi());
    } }) : null;
    s._piede.appendChild(via);
    if (bResta) s._piede.appendChild(bResta);
    function tocca(id) {
      if (conHost && id === "host") return;   // (nei giochi da 3 posti in su l'host gioca sempre)
      var k = sc.indexOf(id);
      if (k >= 0) sc.splice(k, 1);
      else {
        sc.push(id);
        if (sc.length > posti) { var j = sc.findIndex(function (x) { return x !== "host"; }); sc.splice(j < 0 ? 0 : j, 1); }
      }
      rifai();
    }
    // si cambiano solo le classi e le scritte: niente lampeggio
    function rifai() {
      membri.forEach(function (m) {
        var si = sc.indexOf(m.id) >= 0, b = celle[m.id];
        b.classList.toggle("scelto", si); b.setAttribute("aria-pressed", si ? "true" : "false");
      });
      var altri = membri.filter(function (m) { return sc.indexOf(m.id) < 0; }).map(function (m) { return m.id === "host" ? "tu" : m.nome; });
      guardano.textContent = altri.length ? "👀 Gli altri guardano: " + altri.join(", ") : "";
      var manca = posti - sc.length;
      via.textContent = manca > 0 ? "Scegli ancora " + manca : "▶ Si gioca";
      via.disabled = manca !== 0;
      if (bResta) bResta.disabled = manca !== 0;
    }
    rifai();
    mostra(s);
  }

  // ---------- IL DUELLO: un gioco a due tra due amici, l'host della Sala guarda ----------
  // Come una partita del torneo a eliminazione: la stanza la apre il telefono del primo (a), il secondo (b) entra da solo,
  // tutti gli altri (host compreso) guardano in diretta. a dice alla Sala com'è finita (salaEsito) e a che punto è (duelloFase)
  // (stanza: il codice già deciso, "Chi vince resta")
  function salaDuello(g, R, scelti, stanza) {
    if (!cuore.sala) return schermataHome();
    lasciaPartita(); cuore.FINE = null; cuore.RIV = null;
    SGNet.chiudiGiochi(1500);   // (la stanza del gioco di prima, se c'era)
    var imp = {};
    try { imp = JSON.parse(JSON.stringify(R.imp || {})); } catch (e) {}
    delete imp.scelti; imp.modo = "online";
    var D = cuore.sala.duello = { a: scelti[0].id, b: scelti[1].id, na: scelti[0].nome, nb: scelti[1].nome, stanza: stanza || SGNet.nuovoCodice(), gioco: g.id, imp: imp, n: 0, fine: null, visti: {} };
    cuore.sala.gioco = g.id; cuore.sala.stanza = D.stanza; cuore.sala.inGioco = true; cuore.sala.sceglie = false; cuore.sala.fase = "lobby"; cuore.sala.fuori = {};
    cuore.sala._bcast();
    guardaDuelloHost(D);
  }
  // l'host guarda il duello (anche quando ci torna da "👀 Guarda" nella Sala): in alto a destra "👥 Sala" per tornare nella Sala
  function guardaDuelloHost(D) {
    var g = giocoDa(D.gioco); if (!cuore.sala || cuore.sala.duello !== D || !g) return disegnaSalaHost();
    SGNet.chiudiGiochi();
    cuore.sala.inGioco = true; cuore.sala.fineDuello = null;   // (la Sala non si ridisegna sopra la partita)
    var ctx = cuore.sala.ctx = {
      duello: D.stanza,
      esci: function () { tornaDalDuello(); }, fine: function () { tornaDalDuello(); }, risultato: function () {},
      angolo: function (s) { tastoSala(s, function () { tornaDalDuello(); }); },
      cambia: function () { salaCambiaGioco(); }
    };
    function tornaDalDuello() {
      if (!cuore.sala || cuore.sala.ctx !== ctx) return;
      lasciaPartita(); SGNet.chiudiGiochi(); cuore.sala.inGioco = false; cuore.sala.ctx = null;
      disegnaSalaHost();
    }
    cuore.linkParams = { gioco: g.id, stanza: D.stanza, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
    restaTarga();   // ("👀 Guardi · in coda: sei 2°")
  }
  // "👥 Sala" (o "🏠 Sala" per chi guarda soltanto) nell'angolo in alto a destra di chi guarda un duello
  function tastoSala(s, fn) {
    if (!s || s.querySelector(".tab-elim")) return;
    var b = el("button", { class: "tab-elim tab-sala", "aria-label": "Torna nella Sala", text: "👥 Sala", onclick: fn });
    var testa = s.querySelector(".testa");
    if (testa && !s.classList.contains("senza-testa")) { b.classList.add("in-testa"); testa.appendChild(b); }
    else s.appendChild(b);
  }
  // l'host della Sala riceve dal telefono di a com'è finito il duello o a che punto è
  function msgDuello(id, m) {
    var D = cuore.sala && cuore.sala.duello;
    if (!D || id !== D.a || m.stanza !== D.stanza || cuore.sala.stanza !== D.stanza) return;
    var g = giocoDa(D.gioco); if (!g) return;
    if (cuore.sala.resta && cuore.sala.resta.sfida && cuore.sala.resta.sfida.stanza === D.stanza) cuore.sala.resta.aperta = D.stanza;   // (a ha aperto la sfida: se manca qualcuno è l'altro)
    if (m.t === "duelloFase") {
      var f = m.fase === "lobby" || m.fase === "gioco" || m.fase === "fine" ? m.fase : null;
      if (!f || f === cuore.sala.fase) return;
      var prima = cuore.sala.fase; cuore.sala.fase = f; cuore.sala._bcast(); if (!cuore.sala.inGioco) disegnaSalaHost();   // (sono nella Sala: il riquadro del duello)
      // la rivincita del duello comincia: se sono sulla classifica, torno a guardare da solo
      if (prima === "fine" && f !== "fine" && cuore.sala.fineDuello === D) { cuore.sala.fineDuello = null; guardaDuelloHost(D); }
      return;
    }
    // la classifica (dal telefono di un amico: solo nomi e posti, controllati)
    var cl = (Array.isArray(m.cl) ? m.cl : []).slice(0, 10).filter(function (r) { return r && typeof r.nome === "string"; })
      .map(function (r) { var x = { nome: r.nome.slice(0, 16), pos: Math.max(1, Math.min(10, (+r.pos | 0) || 1)) }; if (typeof r.punti === "number" && isFinite(r.punti)) x.punti = r.punti; if (r.bot) x.bot = true; return x; });
    if (!cl.length) return;
    var k = String(m.giro | 0);
    if (D.visti[k]) return;   // (la stessa partita detta due volte)
    D.visti[k] = 1;
    D.n += 1; D.fine = { n: D.n, cl: cl, giro: m.giro | 0 };
    salaRisultato(g, cl, { stanza: D.stanza, giro: m.giro | 0 });   // (giocate e punti del torneo; manda la Sala a tutti)
    cuore.sala._bcast(); if (!cuore.sala.inGioco) disegnaSalaHost();
    // se sto guardando il duello: dopo un attimo (si vede la mossa finale) la classifica con "⚔️ Altra sfida" e "🎮 Cambia gioco"
    var P = cuore.partitaCorrente;
    if (P && P.viva() && P.salaCtx && P.salaCtx.duello === D.stanza && !P.salaCtx.gioca) setTimeout(function () {
      if (cuore.partitaCorrente === P && P.viva() && cuore.sala && cuore.sala.duello === D && D.fine && D.fine.n === D.n) fineDuelloHost(D, g, k);
    }, 1600);
  }
  // la fine del duello per l'host della Sala, che guardava
  function fineDuelloHost(D, g, giro) {
    // ("👑 Chi vince resta": la fine della sfida è già sullo schermo, disegnata dal gioco che guardavo: resta quella)
    if (restaFineDi(D.stanza) && document.querySelector(".fine-resta")) return;
    lasciaPartita(); SGNet.chiudiGiochi();
    cuore.sala.fineDuello = D;
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g.nome + " · " + D.na + " contro " + D.nb });
    s._contenuto.appendChild(classificaDuello(D.fine.cl));
    cuore.sala.ctx = null;
    if (restaFineDi(D.stanza)) {
      bloccoResta(s._piede, D.stanza, true, { SV: { codice: D.stanza, giro: +giro || 0 }, salaHost: true, host: true });
      tastoSala(s, function () { if (!cuore.sala) return schermataHome(); cuore.sala.fineDuello = null; cuore.sala.inGioco = false; cuore.sala.ctx = null; disegnaSalaHost(); });
      return mostra(s);
    }
    var box = el("div", { class: "fine-tasti" });
    rigaPuntiFine(box, { codice: D.stanza, giro: +giro || 0 }, true, true);   // (la Classifica della serata: "🏆 Serata: Giulia 1° · Luca 2°")
    box.appendChild(el("button", { class: "btn btn-primario ft-primo", type: "button", text: "⚔️ Altra sfida", onclick: function () { salaAltraSfida(g); } }));
    box.appendChild(el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🎮 Cambia gioco", onclick: function () { salaCambiaGioco(); } }));
    s._piede.appendChild(box);
    tastoSala(s, function () {
      if (!cuore.sala) return schermataHome();
      cuore.sala.fineDuello = null; cuore.sala.inGioco = false; cuore.sala.ctx = null; disegnaSalaHost();
    });
    mostra(s);
  }
  function classificaDuello(cl) {
    var ol = el("ol", { class: "classifica" }), med = medaglieAPari(cl.map(function (r, i) { return r.pos || i + 1; }));
    cl.forEach(function (r, i) {
      ol.appendChild(el("li", { class: (r.pos || i + 1) === 1 ? "vincitore" : "" }, [ el("span", { class: "pos", text: med[i] }), el("span", { class: "nome", text: r.nome }),
        r.punti != null ? el("span", { class: "punti", text: typeof r.punti === "number" && r.punti % 1 === 0 ? cifre(r.punti) : r.punti }) : null ]));
    });
    return ol;
  }
  // il duello è finito per tutti (chi l'aveva aperto è tornato nella Sala o è uscito): tutti nella Sala
  function fineDuelloSala() {
    if (!cuore.sala) return;
    var guardavo = cuore.sala.inGioco;
    cuore.sala.gioco = null; cuore.sala.stanza = null; cuore.sala.inGioco = false; cuore.sala.fase = null; cuore.sala.fuori = {}; cuore.sala.ctx = null; cuore.sala.duello = null; cuore.sala.fineDuello = null;
    cuore.sala._bcast();
    if (guardavo) { lasciaPartita(); SGNet.chiudiGiochi(); pillola("sala", "🏁 La sfida è finita: si torna in Sala", "verde", 2600); }
    disegnaSalaHost();
  }
  // "⚔️ Altra sfida": tutti nella Sala ("Paky sceglie chi gioca… ⚔️") e l'host è già su "Chi gioca?" con chi ha giocato meno
  function salaAltraSfida(g) {
    if (!cuore.sala) return schermataHome();
    lasciaPartita(); cuore.FINE = null; cuore.RIV = null;
    cuore.sala.gioco = null; cuore.sala.stanza = null; cuore.sala.inGioco = false; cuore.sala.fase = null; cuore.sala.fuori = {}; cuore.sala.ctx = null; cuore.sala.duello = null; cuore.sala.fineDuello = null;
    cuore.sala.sceglie = "sfida"; cuore.sala._bcast();
    SGNet.chiudiGiochi(1500);
    salaPreparaGioco(g, { sfida: true });
  }

  // ---------- "👑 CHI VINCE RESTA" (Passo 6): un gioco a due nella Sala, chi vince resta al tavolo, gli altri in coda ----------
  // sala.resta = { gioco, imp, coda: [id], campione, serie, record: { id, nome, n }, sfida: { a, b, stanza }, n (la sfida),
  //   esito: { stanza, n, vince, perde, pari } (com'è finita l'ultima), parte (ora dell'host: quando parte la sfida n),
  //   l (l'ultima sfida lanciata), aperta (la stanza del duello che a ha già aperto) }. Va nel messaggio della Sala (con ora).
  // Ogni sfida è una partita della Sala: se l'host è uno dei due, la sua stanza (salaLancia col codice già deciso); se no il
  // duello aperto dal telefono di a, che è sempre il campione. Gli altri guardano da soli. Pareggio: resta il campione (alla
  // prima sfida a). Chi perde va in fondo alla coda; tra una sfida e l'altra RESTA_PAUSA, poi si parte da soli (3-2-1)
  var RESTA_PAUSA = 8000, RESTA_SALTA = 20000;
  function nomeMembro(S, id) { var m = ((S && S.membri) || []).filter(function (x) { return x && x.id === id; })[0]; return m ? m.nome : ""; }
  // la coda di partenza: tutti gli altri, prima chi ha giocato meno stasera (a pari merito chi è arrivato prima)
  function codaDiPartenza(tranne) {
    var G = cuore.sala.giocate || {};
    return cuore.sala.membri.map(function (m, i) { return { id: m.id, i: i, n: G[m.nome] || 0, ex: m.ex }; })
      .filter(function (x) { return !x.ex && tranne.indexOf(x.id) < 0; })
      .sort(function (a, b) { return a.n - b.n || a.i - b.i; }).map(function (x) { return x.id; });
  }
  // "👑 Chi vince resta" con i primi due scelti in "Chi gioca?": si parte subito
  function restaInizia(g, R, scelti) {
    if (!cuore.sala || !g || !scelti || scelti.length !== 2) return;
    restaFerma(true);
    var imp = impSalvabili(R && R.imp); delete imp.scelti; imp.modo = "online";
    var ids = scelti.map(function (x) { return x.id; });
    cuore.sala.resta = { gioco: g.id, imp: imp, coda: codaDiPartenza(ids), campione: null, serie: 0, record: null,
      sfida: { a: ids[0], b: ids[1], stanza: SGNet.nuovoCodice() }, n: 1, esito: null, parte: Date.now(), l: 0 };
    restaTimer();
    restaProssima(1);
  }
  // si apre la sfida n (una volta sola): l'host gioca → la sua stanza; se no il duello. Il 3-2-1 parte da solo quando
  // l'avversario è arrivato (RIV: come la Rivincita), così tra una sfida e l'altra nessuno deve toccare niente
  function restaProssima(n) {
    var Rr = cuore.sala && cuore.sala.resta; if (!Rr || Rr.n !== n || Rr.l === n || !Rr.sfida || !Rr.sfida.b) return;
    var g = giocoDa(Rr.gioco); if (!g) return restaBasta();
    var a = Rr.sfida.a, b = Rr.sfida.b;
    Rr.l = n; Rr.lanciata = Date.now(); Rr.aperta = null;
    Rr.sfida.na = nomeMembro(cuore.sala, a); Rr.sfida.nb = nomeMembro(cuore.sala, b);   // (i nomi restano anche se uno se ne va)
    cuore.sala.regole = cuore.sala.regole || {};
    var R = cuore.sala.regole[g.id] || (cuore.sala.regole[g.id] = { box: null, imp: impSalvabili(Rr.imp) });
    var sc = [{ id: a, nome: nomeMembro(cuore.sala, a) }, { id: b, nome: nomeMembro(cuore.sala, b) }];
    lasciaPartita(); cuore.FINE = null; RESTA_FINE = null;
    SGNet.chiudiGiochi(1500);   // (la stanza della sfida di prima: un attimo dopo, prima gli amici passano alla nuova)
    if (a === "host" || b === "host") {
      var altro = a === "host" ? b : a, nomi = {}; nomi[altro] = nomeMembro(cuore.sala, altro);
      cuore.RIV = { codice: Rr.sfida.stanza, attesi: [altro], nomi: nomi, quando: Date.now() + 10000, auto: true, pronti: {}, daSala: true, U: null };
      R.imp.modo = "online"; R.imp.scelti = sc;
      SL.ultimo = null;   // (una stanza nuova: la saletta si rifà, anche se ero ancora nella saletta di prima, es. "⏭ Salta")
      return salaLancia(g, R.imp, R.box, { codice: Rr.sfida.stanza });
    }
    cuore.RIV = null;
    salaDuello(g, R, sc, Rr.sfida.stanza);
  }
  // com'è finita la sfida (dalla classifica, o forza = chi vince perché l'altro se n'è andato). true = contata adesso
  function restaEsito(cl, st, forza) {
    var Rr = cuore.sala && cuore.sala.resta, sf = Rr && Rr.sfida;
    if (!sf || !st || sf.stanza !== st || Rr.l !== Rr.n || (Rr.esito && Rr.esito.stanza === st)) return false;
    var a = sf.a, b = sf.b, vince = forza || null;
    if (!vince && cl) {
      var primi = cl.filter(function (r) { return r && !r.bot && (r.pos || 1) === 1; });
      if (primi.length === 1) vince = stessoNome(primi[0].nome, nomeMembro(cuore.sala, a)) ? a : (stessoNome(primi[0].nome, nomeMembro(cuore.sala, b)) ? b : null);
    }
    var pari = !vince; if (!vince) vince = a;   // (pareggio: resta il campione, che è sempre a)
    var perde = vince === a ? b : a;
    var nv = (vince === a ? sf.na : sf.nb) || nomeMembro(cuore.sala, vince), np = (perde === a ? sf.na : sf.nb) || nomeMembro(cuore.sala, perde);
    Rr.serie = Rr.campione === vince ? (Rr.serie || 0) + 1 : 1; Rr.campione = vince;
    if (!Rr.record || Rr.serie > Rr.record.n) Rr.record = { id: vince, nome: nomeMembro(cuore.sala, vince), n: Rr.serie };
    Rr.coda = Rr.coda.filter(function (x) { return x !== vince && x !== perde && membroSala(x); });
    if (perde && membroSala(perde)) Rr.coda.push(perde);
    var dopo = membroSala(vince) ? (Rr.coda.shift() || null) : null;
    Rr.esito = { stanza: st, n: Rr.n, vince: vince, perde: perde, pari: pari ? 1 : 0, nv: nv, np: np, via: forza ? 1 : 0 };
    Rr.sfida = { a: vince, b: dopo, stanza: dopo ? SGNet.nuovoCodice() : null };   // (nessuno dopo: rimasti in pochi, si chiude)
    Rr.n += 1; Rr.parte = Date.now() + RESTA_PAUSA;
    restaSaltaTasto(null);
    // uno dei due se n'è andato: la sfida finisce per tutti, si aspetta la prossima nella Sala (la riga della coda col conto)
    if (forza) {
      var dentro = cuore.sala.inGioco;
      cuore.sala.gioco = null; cuore.sala.stanza = null; cuore.sala.inGioco = false; cuore.sala.fase = null; cuore.sala.fuori = {}; cuore.sala.ctx = null; cuore.sala.duello = null; cuore.sala.fineDuello = null; cuore.sala.scelti = null;
      if (dentro) { lasciaPartita(); togliGuardo(); cuore.FINE = null; }
      SGNet.chiudiGiochi(1500);
      if (cuore.sala._bcast) cuore.sala._bcast();
      if (cuore.sala.pronta) pillola("sala", "🚪 " + (np || "L'avversario") + " non c'è più: resta " + (nv || "l'altro"), "verde", 3000);
      if (cuore.sala.pronta && !hostSceglie()) disegnaSalaHost();
      return true;
    }
    if (cuore.sala._bcast) cuore.sala._bcast();
    return true;
  }
  // il timer dell'host: a `parte` lancia la sfida; dopo 20 s di sfida senza uno dei due, "⏭ Salta Luca"
  function restaTimer() {
    var S0 = cuore.sala; if (!S0) return;
    clearInterval(S0.tResta);
    S0.tResta = setInterval(function () {
      if (cuore.sala !== S0 || !S0.resta) { clearInterval(S0.tResta); S0.tResta = null; restaSaltaTasto(null); return; }
      var Rr = S0.resta;
      if (Rr.l !== Rr.n) { if (Date.now() >= (Rr.parte || 0)) { if (Rr.sfida && Rr.sfida.b) restaProssima(Rr.n); else restaBasta("pochi"); } return; }
      restaSaltaTasto(restaChiManca());
    }, 500);
  }
  // chi manca alla sfida aperta da più di 20 s (ancora in saletta): l'avversario che la stanza non vede, o nel duello chi doveva aprirla
  function restaChiManca() {
    var Rr = cuore.sala.resta, sf = Rr.sfida;
    if (!sf || !sf.stanza || cuore.sala.stanza !== sf.stanza || (Rr.esito && Rr.esito.stanza === sf.stanza)) return null;
    if (Date.now() - (Rr.lanciata || 0) < RESTA_SALTA || (cuore.sala.fase && cuore.sala.fase !== "lobby")) return null;
    if (sf.a === "host" || sf.b === "host") {
      var altro = sf.a === "host" ? sf.b : sf.a, SV = SVH[sf.stanza];
      return SV && !SV.dentro[altro] ? altro : null;
    }
    return Rr.aperta === sf.stanza ? sf.b : sf.a;
  }
  // "⏭ Salta Luca" (solo l'host della Sala, in alto, sopra qualunque schermata): un nodo solo, cambia solo la scritta
  var SALTA_R = null;
  function restaSaltaTasto(id) {
    if (!id || !cuore.sala) { if (SALTA_R) { togliNodo(SALTA_R.nodo); SALTA_R = null; } return; }
    var tx = "⏭ Salta " + (nomeMembro(cuore.sala, id) || "…");
    if (!SALTA_R) {
      var b = el("button", { class: "sl-resta-salta", type: "button", onclick: function () { if (SALTA_R) restaSalta(SALTA_R.id); } });
      document.body.appendChild(b);
      SALTA_R = { nodo: b };
    }
    SALTA_R.id = id;
    if (SALTA_R.nodo.textContent !== tx) SALTA_R.nodo.textContent = tx;
  }
  // chi non arriva va in fondo alla coda e al suo posto entra il primo della coda (se era il campione, il titolo passa all'altro)
  function restaSalta(id) {
    var Rr = cuore.sala && cuore.sala.resta, sf = Rr && Rr.sfida;
    restaSaltaTasto(null);
    if (!sf || (id !== sf.a && id !== sf.b) || Rr.l !== Rr.n) return;
    var resta = id === sf.a ? sf.b : sf.a;
    Rr.coda = Rr.coda.filter(function (x) { return x !== id && x !== resta && membroSala(x); });
    if (membroSala(id)) Rr.coda.push(id);
    if (Rr.campione === id) { Rr.campione = null; Rr.serie = 0; }
    var dopo = Rr.coda[0] !== id ? Rr.coda.shift() : null;
    if (!dopo) return restaBasta("pochi");
    pillola("sala", "⏭ " + (nomeMembro(cuore.sala, id) || "Chi mancava") + " va in fondo alla coda", "blu", 3000);
    Rr.sfida = { a: resta, b: dopo, stanza: SGNet.nuovoCodice() };
    Rr.n += 1; Rr.parte = Date.now();
    restaProssima(Rr.n);
  }
  // chi esce dalla Sala sparisce dalla coda; se giocava la sfida vince l'altro; se doveva giocare la prossima entra il primo della coda
  function restaVia(id) {
    var Rr = cuore.sala && cuore.sala.resta; if (!Rr) return;
    Rr.coda = Rr.coda.filter(function (x) { return x !== id; });
    var sf = Rr.sfida; if (!sf || (sf.a !== id && sf.b !== id)) return;
    var altro = sf.a === id ? sf.b : sf.a;
    if (Rr.l === Rr.n && sf.stanza && !(Rr.esito && Rr.esito.stanza === sf.stanza)) { restaEsito(null, sf.stanza, altro); return; }
    if (Rr.campione === id) { Rr.campione = null; Rr.serie = 0; }
    var dopo = altro ? Rr.coda.shift() || null : null;
    Rr.sfida = { a: altro, b: dopo, stanza: dopo ? SGNet.nuovoCodice() : null };
  }
  // uno dei due esce apposta dalla sfida in corso (‹ dal gioco): vince l'altro
  function restaEsce(id, st) {
    var Rr = cuore.sala && cuore.sala.resta, sf = Rr && Rr.sfida;
    if (!sf || !st || sf.stanza !== st || (id !== sf.a && id !== sf.b)) return false;
    return restaEsito(null, st, id === sf.a ? sf.b : sf.a);
  }
  // un amico nuovo nella Sala: in fondo alla coda (chi rientra col suo id nuovo al posto di un "ex" prende il suo posto)
  function restaEntra(id, vecchio) {
    var Rr = cuore.sala && cuore.sala.resta; if (!Rr || !id) return;
    if (vecchio) {
      Rr.coda = Rr.coda.map(function (x) { return x === vecchio ? id : x; });
      if (Rr.sfida) { if (Rr.sfida.a === vecchio) Rr.sfida.a = id; if (Rr.sfida.b === vecchio) Rr.sfida.b = id; }
      if (Rr.campione === vecchio) Rr.campione = id;
    }
    if (Rr.coda.indexOf(id) < 0 && !(Rr.sfida && (Rr.sfida.a === id || Rr.sfida.b === id))) Rr.coda.push(id);
  }
  // finisce "Chi vince resta" (senza cambiare schermata): il record della serata resta scritto nella Sala
  function restaFerma(muto) {
    var Rr = cuore.sala && cuore.sala.resta;
    if (cuore.sala) { clearInterval(cuore.sala.tResta); cuore.sala.tResta = null; }
    restaSaltaTasto(null); RESTA_FINE = null;
    if (!Rr) return;
    if (Rr.record && Rr.record.n >= 2 && (!cuore.sala.restaRec || Rr.record.n >= cuore.sala.restaRec.n)) cuore.sala.restaRec = { nome: Rr.record.nome, n: Rr.record.n };
    cuore.sala.resta = null;
    if (!muto && cuore.sala._bcast) cuore.sala._bcast();
  }
  // "⏹ Basta così": tutti nella Sala
  function restaBasta(perche) {
    if (!cuore.sala) return;
    restaFerma(true);
    lasciaPartita(); cuore.FINE = null; cuore.RIV = null; togliGuardo();
    cuore.sala.gioco = null; cuore.sala.stanza = null; cuore.sala.inGioco = false; cuore.sala.fase = null; cuore.sala.fuori = {}; cuore.sala.ctx = null; cuore.sala.duello = null; cuore.sala.fineDuello = null; cuore.sala.scelti = null; cuore.sala.sceglie = false;
    cuore.sala._bcast();
    SGNet.chiudiGiochi(1500);
    if (perche === "pochi") pillola("sala", "👑 Siete rimasti in pochi: «Chi vince resta» finisce qui", "blu", 3500);
    disegnaSalaHost();
  }
  // (la Sala si riapre: pagina ricaricata, subentro del vice, trasloco nella Compagnia) la serie riprende da dov'era.
  // Se la sfida in corso è rimasta (il duello di due amici, o la partita che riprende) si aspetta il suo esito; se si è persa:
  // chi non c'è più ha perso, o si rigioca la stessa sfida in una stanza nuova. Poi la pausa e si riparte da soli
  function restaRiprendi() {
    var Rr = cuore.sala && cuore.sala.resta; if (!Rr) return;
    restaTimer();
    var sf = Rr.sfida || {};
    if (cuore.sala.gioco && cuore.sala.stanza && sf.stanza === cuore.sala.stanza) return;
    if (Rr.l === Rr.n && sf.stanza && !(Rr.esito && Rr.esito.stanza === sf.stanza)) {
      var ca = !!sf.a && !!membroSala(sf.a), cb = !!sf.b && !!membroSala(sf.b);
      if (ca !== cb) { restaEsito(null, sf.stanza, ca ? sf.a : sf.b); return; }
      if (!ca) return restaBasta("pochi");
      Rr.sfida = { a: sf.a, b: sf.b, stanza: SGNet.nuovoCodice() }; Rr.n += 1;
    } else if (Rr.l !== Rr.n) {
      if (!sf.a || !membroSala(sf.a)) { Rr.campione = null; Rr.serie = 0; sf.a = sf.b && membroSala(sf.b) ? sf.b : (Rr.coda.shift() || null); sf.b = null; }
      if (!sf.b || !membroSala(sf.b) || sf.b === sf.a) sf.b = Rr.coda.shift() || null;
      if (sf.b && !sf.stanza) sf.stanza = SGNet.nuovoCodice();
      Rr.sfida = sf;
    }
    Rr.parte = Math.max(Rr.parte || 0, Date.now() + RESTA_PAUSA);
    if (cuore.sala._bcast) cuore.sala._bcast();
  }
  // (Passo 3) la Sala passa al vice: gli id della serie si rimappano (il mio id di prima → "host"; chi la teneva se n'è andato)
  function restaEredita(r, vecchio) {
    if (!r || typeof r !== "object" || !r.sfida || !giocoDa(r.gioco)) return null;
    function id2(x) { return x === vecchio ? "host" : (x === "host" ? "__via" : x); }
    var R = { gioco: r.gioco, imp: r.imp && typeof r.imp === "object" ? r.imp : {}, coda: (Array.isArray(r.coda) ? r.coda : []).map(id2).filter(function (x) { return x && x !== "__via"; }),
      campione: r.campione && id2(r.campione) !== "__via" ? id2(r.campione) : null, serie: 0, record: null,
      sfida: { a: id2(r.sfida.a), b: id2(r.sfida.b), stanza: r.sfida.stanza || null, na: r.sfida.na, nb: r.sfida.nb }, n: +r.n || 1, l: +r.l || 0, parte: 0,
      esito: r.esito ? { stanza: r.esito.stanza, n: r.esito.n, vince: id2(r.esito.vince), perde: id2(r.esito.perde), pari: r.esito.pari ? 1 : 0, nv: r.esito.nv, np: r.esito.np, via: r.esito.via ? 1 : 0 } : null };
    R.serie = R.campione ? +r.serie || 0 : 0;
    if (r.record && r.record.nome) R.record = { id: id2(r.record.id), nome: String(r.record.nome).slice(0, 16), n: +r.record.n || 0 };
    return R;
  }
  // la serie (o il record) della Sala riaperta (R0: la mia salvata) o ereditata (EZ: subentro, trasloco)
  function restaDaPrima(R0, EZ, k) {
    var v = (R0 && R0[k]) || (EZ && EZ[k]) || null;
    if (!v || typeof v !== "object") return null;
    if (k === "resta" && (!v.sfida || !giocoDa(v.gioco) || !Array.isArray(v.coda))) return null;
    return v;
  }
  // la serie per la foto della Sala (con l'ora dell'host: chi la riceve fa il conto alla rovescia giusto)
  function restaFoto(r) {
    if (!r) return undefined;
    return { gioco: r.gioco, imp: r.imp, coda: r.coda, campione: r.campione, serie: r.serie, record: r.record, sfida: r.sfida, n: r.n,
      esito: r.esito, parte: r.parte, l: r.l, ora: Date.now() };
  }
  // la serie vista da questo telefono: { R, S (la Sala: membri), io (il mio id), host (la Sala è mia) }
  function restaMia() {
    if (cuore.sala && cuore.sala.resta) return { R: cuore.sala.resta, S: cuore.sala, io: "host", host: true };
    if (cuore.salaG && cuore.salaG.resta && !cuore.salaG.elim) return { R: cuore.salaG.resta, S: cuore.salaG, io: mioIdSala(cuore.salaG), host: false };
    return null;
  }
  // questa stanza è una sfida della serie (quella in corso o quella appena finita)?
  function restaFineDi(st) {
    var M = restaMia(); if (!M || !st) return null;
    return (M.R.sfida && M.R.sfida.stanza === st) || (M.R.esito && M.R.esito.stanza === st) ? M : null;
  }
  // i secondi che mancano alla prossima sfida (l'host con la sua ora; gli amici dall'ora dell'host nella foto)
  function restaSecondi(R, host) {
    var ms = host ? (R.parte || 0) - Date.now() : (R.parte || 0) - (R.ora || R.parte || 0) - (Date.now() - (R._ric || Date.now()));
    return Math.max(1, Math.ceil(ms / 1000));
  }
  // la fine di una sfida, uguale su tutti i telefoni, in una striscia sola (sta nel posto dei tasti di fine dei giochi):
  // [avatar di chi tocca] "👑 Resta Paky · 🔥 2 di fila" / "Ora tocca a Luca · si parte tra 8…". Sotto, l'host della Sala
  // ha "⏹ Basta così" e "🎮 Cambia gioco" (niente Rivincita né "Ci sto"); gli altri la riga della Classifica della serata.
  // Le scritte si cambiano quando arriva la Sala, senza ridisegnare. rp = { SV, salaHost, host } per la riga dei punti
  var RESTA_FINE = null;   // { nodo, tit, av, nome, conto, stanza, n, avId, c }
  function bloccoResta(piede, st, hostSala, rp) {
    var F = { stanza: st, n: 0 };
    F.tit = el("b", { class: "fr-tit" });
    F.av = el("span", { class: "fr-av", "aria-hidden": "true", hidden: "hidden" });
    F.nome = el("span", { class: "fr-ora-tx" });
    F.conto = el("span", { class: "fr-conto" });
    F.nodo = el("div", { class: "fine-resta", role: "status" }, [ F.av, el("span", { class: "fr-testi" }, [ F.tit, el("span", { class: "fr-sotto" }, [ F.nome, F.conto ]) ]) ]);
    piede.appendChild(F.nodo);
    var box = el("div", { class: "fine-tasti" });
    if (hostSala) {
      box.appendChild(el("button", { class: "btn btn-fantasma ft-primo", type: "button", text: "⏹ Basta così", onclick: function () { restaBasta(); } }));
      box.appendChild(el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🎮 Cambia gioco", onclick: function () { restaFerma(true); salaCambiaGioco(); } }));
    } else if (rp && rp.SV) rigaPuntiFine(box, rp.SV, !!rp.salaHost, !!rp.host);   // (la Classifica della serata: l'host la ha nella Sala)
    if (box.firstChild) piede.appendChild(box);
    cuore.FINE = null;
    RESTA_FINE = F;
    restaAggiornaFine();
    return true;
  }
  function restaAggiornaFine() {
    var F = RESTA_FINE; if (!F) return;
    if (F.nodo.isConnected) F.visto = true;
    else if (F.visto) { RESTA_FINE = null; return; }
    var M = restaMia(), R = M && M.R, E = R && R.esito && R.esito.stanza === F.stanza ? R.esito : null;
    var tit = "🏁 Fine sfida", chi = null, txOra = "";
    if (E) {
      tit = (E.pari ? "🤝 Pari: resta " : "👑 Resta ") + (nomeMembro(M.S, E.vince) || E.nv || "…") + (R.campione === E.vince && R.serie >= 2 ? " · 🔥 " + R.serie + " di fila" : "");
      chi = R.sfida && R.sfida.b ? R.sfida.b : null;
      txOra = chi ? (chi === M.io ? "Ora tocca a te!" : "Ora tocca a " + (nomeMembro(M.S, chi) || "…")) : (R.l !== R.n ? "Si torna nella Sala…" : "");
    }
    if (F.tit.textContent !== tit) F.tit.textContent = tit;
    if (F.nome.textContent !== txOra) F.nome.textContent = txOra;
    if (F.av.hidden === !!chi) F.av.hidden = !chi;
    if (chi && F.avId !== chi) {
      F.avId = chi;
      var mm = (M.S.membri || []).filter(function (x) { return x && x.id === chi; })[0];
      F.av.innerHTML = window.SGOmino && mm ? SGOmino.svg(mm.omino || SGOmino.casuale(mm.nome), { busto: true }) : "";
    }
    // il conto ("· si parte tra 8…"): solo quando c'è una sfida dopo
    if (E && chi && R.l !== R.n) {
      if (F.n !== R.n || !F.c || !F.c.vivo()) { F.n = R.n; if (F.c) F.c.ferma(); F.c = contoAvanti(F.conto, restaSecondi(R, M.host), null, "resta|" + R.n, " · si parte tra "); }
    } else { if (F.c) { F.c.ferma(); F.c = null; } if (F.conto.textContent) F.conto.textContent = ""; }
  }
  // la targhetta di chi guarda una sfida: "👀 Guardi · in coda: sei 2°"
  function restaTarga() {
    var P = cuore.partitaCorrente; if (!P || !P.viva() || !P.tavolo || !P.tavolo.linkParams || !P.tavolo.linkParams.guarda) return;
    var st = P.tavolo.linkParams.stanza, M = restaFineDi(st), tx = null;
    if (M) {
      var k = M.R.coda.indexOf(M.io);
      if (k >= 0) tx = "Guardi · in coda: sei " + (k + 1) + "°";
      else if (M.R.esito && M.R.esito.stanza === st && M.R.sfida && M.R.sfida.b === M.io) tx = "Guardi · ora tocca a te!";
    }
    if ((P.testoGuardo || null) === tx) return;
    P.testoGuardo = tx;
    if (cuore.GUARDO && cuore.GUARDO.P === P) chipGuardo(P);
  }
  // qualcosa è cambiato nella serie (foto della Sala, esito): si aggiornano solo le scritte sullo schermo
  function restaAggiorna() {
    restaAggiornaFine(); restaTarga();
    var M = restaMia(), S = M ? M.S : (cuore.sala || cuore.salaG);
    if (S && S._coda && S._coda.nodo.isConnected) riquadroCoda(S, !!(M ? M.host : cuore.sala === S));
  }
  // nella Sala: "👑 Paky 🔥2 · in coda: Luca, Marco, Bea" (+ "Prossima sfida tra 8…" e, per l'host, "⏹ Basta").
  // Senza la serie, dopo "Basta così": "👑 Record di stasera: Luca, 5 di fila". Sempre lo stesso nodo (cambiano le scritte)
  function riquadroCoda(S, host) {
    var R = S && S.resta;
    if (!R) {
      var rec = S && S.restaRec;
      if (!rec || !rec.nome || (+rec.n || 0) < 2) return null;
      var txr = "👑 Record di stasera: " + rec.nome + ", " + rec.n + " di fila";
      if (!S._rec || S._rec.tx !== txr) S._rec = { tx: txr, nodo: el("div", { class: "sl-coda sl-coda-rec" }, [ el("span", { class: "sl-coda-testi" }, [ el("span", { class: "sl-coda-tx", text: txr }) ]) ]) };
      return S._rec.nodo;
    }
    var io = host ? "host" : mioIdSala(S);
    function nm(id) { return id === io ? "tu" : (nomeMembro(S, id) || "…"); }
    var tx = (R.campione ? "👑 " + nm(R.campione) + (R.serie >= 2 ? " 🔥" + R.serie : "") : "👑 Chi vince resta") + (R.coda.length ? " · in coda: " + R.coda.map(nm).join(", ") : "");
    var C = S._coda;
    if (!C || C.host !== host) {
      C = S._coda = { host: host, tx: el("span", { class: "sl-coda-tx" }), conto: el("small", { class: "sl-coda-conto", hidden: "hidden" }) };
      var kids = [ el("span", { class: "sl-coda-testi" }, [ C.tx, C.conto ]) ];
      if (host) kids.push(el("button", { class: "btn btn-fantasma btn-piccolo", type: "button", text: "⏹ Basta", onclick: function () { restaBasta(); } }));
      C.nodo = el("div", { class: "sl-coda" }, kids);
    }
    if (C.tx.textContent !== tx) C.tx.textContent = tx;
    var attesa = R.l !== R.n && !!(R.sfida && R.sfida.b);
    if (C.conto.hidden === attesa) C.conto.hidden = !attesa;
    if (attesa && (C.n !== R.n || !C.c || !C.c.vivo())) { C.n = R.n; if (C.c) C.c.ferma(); C.c = contoAvanti(C.conto, restaSecondi(R, host), null, "resta|" + R.n, "Prossima sfida tra "); }
    else if (!attesa && C.c) { C.c.ferma(); C.c = null; C.n = null; }
    return C.nodo;
  }

  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.bloccoResta = bloccoResta; cuore.classificaDuello = classificaDuello; cuore.contoCoppie = contoCoppie; cuore.fineDuelloSala = fineDuelloSala;
  cuore.guardaDuelloHost = guardaDuelloHost; cuore.msgDuello = msgDuello; cuore.nuovoTorneino = nuovoTorneino; cuore.partiTorneino = partiTorneino;
  cuore.partiteCoppie = partiteCoppie; cuore.restaAggiorna = restaAggiorna; cuore.restaDaPrima = restaDaPrima; cuore.restaEntra = restaEntra;
  cuore.restaEredita = restaEredita; cuore.restaEsce = restaEsce; cuore.restaEsito = restaEsito; cuore.restaFerma = restaFerma;
  cuore.restaFineDi = restaFineDi; cuore.restaFoto = restaFoto; cuore.restaInizia = restaInizia; cuore.restaRiprendi = restaRiprendi;
  cuore.restaTarga = restaTarga; cuore.restaVia = restaVia; cuore.riquadroCoda = riquadroCoda; cuore.salaAltraSfida = salaAltraSfida;
  cuore.salaDuello = salaDuello; cuore.schermataChiGioca = schermataChiGioca; cuore.schermataTorneino = schermataTorneino;
  cuore.tastoSala = tastoSala; cuore.tastoTorneino = tastoTorneino; cuore.torneinoDaSaletta = torneinoDaSaletta; cuore.vaiAlTorneino = vaiAlTorneino;
  Object.defineProperty(cuore, "RESTA_FINE", { get: function () { return RESTA_FINE; }, configurable: true });
})();
