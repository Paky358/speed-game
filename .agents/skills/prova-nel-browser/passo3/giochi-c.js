// PROVE DEL PASSO 3, GRUPPO C (carte e feste) col cambio di host della Sala: Black Jack, Poker, L'Asta (Fantacalcio),
// Sì... però, Scarabocchio, Gara di pesca. Pezzo p3-g3.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo3/comune.js"); await COPIONE.carica("passo3/giochi-c.js"); await COPIONE.prova(391)
//
// 391-396, uno per gioco (391 Black Jack, 392 Poker, 393 L'Asta Fantacalcio, 393b L'Asta coi temi, 394 Sì... però in 4,
// 395 Scarabocchio, 396 Gara di pesca). Ogni scenario:
//   1. Compagnia con 3 telefoni (Sì... però con 4: il gioco ne vuole 3 anche dopo): Paky la apre, Giulia e Luca entrano dal
//      link fisso. Paky lancia il gioco dalla Sala, gli amici arrivano nella saletta, si comincia.
//   2. A metà partita (Black Jack: dopo le puntate; Poker: a mano aperta; Asta: con un'offerta in corso…) il telefono di
//      Paky si spegne davvero (rete muta e testamento). Entro 28 s la Sala la tiene Giulia (gen 2), Luca la segue, nella
//      Sala non c'è più il gioco; durante il passaggio nessuno vede «Ops», «Collegamento perso» o «La stanza è chiusa».
//   3. Per 3 secondi nessun pezzo del gioco vecchio torna sopra la Sala: la Sala resta a vista (anche nel punto al centro
//      dello schermo), lo sfondo è quello della Sala (Black Jack: niente tavolo verde), e i tempi del gioco vecchio non
//      girano più (spia dei timer: le chiamate dei timer nati durante la partita e ancora vivi dopo il passaggio).
//   4. Giulia rilancia lo stesso gioco dalla sua Sala, Luca entra da solo, si gioca fino alla fine (regole accorciate solo per
//      la prova: Black Jack 1 mano, Scarabocchio 1 giro, Gara di pesca 12 secondi); alla fine i tasti del core («↻ Rivincita»
//      per Giulia, «👍 Ci sto!» per Luca): Luca «Ci sto», Giulia «Rivincita» → col 3-2-1 si riparte senza altri tocchi
//      (Black Jack: una serie nuova allo stesso tavolo, senza saletta).
//   Black Jack e Poker: ognuno gioca con le SUE monete (finte, per telefono: Paky 900, Giulia 700, Luca 600). Al tavolo di
//   Giulia lei ha il suo saldo di quel momento, Luca il suo; nessun telefono scrive le monete di un altro; Paky non c'è.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, P3 = COPIONE.passo3 || W.P3;
  var aggiungi = (W.COPIONE && W.COPIONE.aggiungi) ? W.COPIONE.aggiungi.bind(W.COPIONE) : function (n, s) { W.COPIONE.scenari[n] = s; };
  function no(p) { throw new Error(p); }
  function vm(c) { return A.vm(c); }
  var T = A.T, GRUPPO = ["blackjack", "poker", "asta", "sipero", "scarabocchio", "garapesca"];
  var NOME_COMP = "Quelli del giovedì";

  // ---- la spia dei giochi del gruppo C (solo con apriTel(nome, { spiaC3: true })) ----
  // w.__imp = { … }: regole cambiate per la prova (le legge solo chi apre la stanza); w.__t = il tavolo del gioco
  if (!W.__prepGruppoC3) {
    W.__prepGruppoC3 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepGruppoC3(w, nome, opz);
      if (!opz || !opz.spiaC3) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GRUPPO.indexOf(g.id) >= 0 && !g.__spiaC3) {
            g.__spiaC3 = true;
            var avvia = g.avvia;
            g.avvia = function (t) {
              w.__t = t;
              if (w.__imp && t.impostazioni && !(t.linkParams && t.linkParams.stanza)) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              return avvia.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  // prima che parta l'app (anche dopo una ricarica): le monete finte di questo telefono e la spia dei timer
  function primaDi(nome) {
    return function (w) {
      // monete: W.__monete[nome] (le fiches del Black Jack e del Poker sono le Speed Coins del profilo); chi salva cosa: W.__salvate
      if (w.SGNube) {
        w.SGNube.fiches = function () { return W.__monete[nome]; };
        w.SGNube.salvaFiches = function (gioco, v) { W.__salvate.push({ tel: nome, di: nome, v: v, ms: Date.now() }); W.__monete[nome] = v; return Promise.resolve(); };
      }
      spiaTimer(w);
    };
  }
  // la spia dei timer: ogni timer si ricorda in che "era" è nato (anche quelli nati dentro un altro timer: prendono l'era di
  // chi li ha fatti partire). w.__spiaT.era = "gioco" mentre si gioca, "dopo" quando la Sala è passata: giri["gioco>dopo"]
  // = quante volte è scattato un timer nato durante la partita dopo il passaggio
  function spiaTimer(w) {
    if (w.__spiaT) return;
    var S = w.__spiaT = { era: "prima", giri: {}, chi: {} }, cor = null;
    ["setTimeout", "setInterval"].forEach(function (k) {
      var o = w[k];
      w[k] = function (fn) {
        if (typeof fn !== "function") return o.apply(w, arguments);
        var era = cor || S.era, a = [].slice.call(arguments), nome = (fn.name || "") + ":" + String(fn).slice(0, 60).replace(/\s+/g, " ");
        a[0] = function () {
          var p = cor; cor = era;
          var kk = era + ">" + S.era; S.giri[kk] = (S.giri[kk] || 0) + 1;
          if (kk === "gioco>dopo") S.chi[nome] = (S.chi[nome] || 0) + 1;
          try { return fn.apply(this, arguments); } finally { cor = p; }
        };
        return o.apply(w, a);
      };
    });
  }
  function era(nomi, e) { nomi.forEach(function (n) { var w = W.finestra(n); if (w && w.__spiaT) { w.__spiaT.era = e; w.__spiaT.giri = {}; w.__spiaT.chi = {}; } }); }

  // ---- aiuti della Sala (come in passo3/compagnia.js) ----
  function nomeHost(m) { var h = ((m && m.membri) || []).filter(function (x) { return x && x.id === "host"; })[0]; return h ? h.nome : ""; }
  function hostDi(c) { return nomeHost(vm(c)); }
  function nomi(c) { return (vm(c).membri || []).map(function (m) { return m.nome; }); }
  function eHost(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-go")); }
  function eOspite(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-attesa") && /Sei dentro/.test(W.testo(w))); }
  function salaDi(w, C) { return eOspite(w) && A.codiceTestata(w) === C; }
  function spentoDavvero(nome) { W.congela(nome); W.spegni(nome); }
  function erroriVuoti() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  // controlla ogni 50 ms che nessun telefono mostri schermate d'errore
  function sentinella(nomiTel, re) {
    var visti = [];
    var t = setInterval(function () { nomiTel.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(re); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 50);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  var ERRORI = /Problema di collegamento|Collegamento perso|Ops\b|La stanza è chiusa|stanza è piena|tavolo è pieno|Tavolo chiuso|chiusa dall'host/;
  // la Sala è davvero a vista: il punto al centro dello schermo e quello in alto sono dentro la saletta (o una pillola del core)
  function salaAVista(w) {
    var d = w.document, iw = w.innerWidth, ih = w.innerHeight, fuori = [];
    [[iw / 2, ih / 2], [iw / 2, ih * 0.25], [iw / 2, ih * 0.8]].forEach(function (p) {
      var e = d.elementFromPoint(p[0], p[1]);
      if (e && !e.closest(".saletta-schermo, .sg-pillola, .sl-velo, .conferma-sfondo")) fuori.push((e.className && e.className.baseVal == null ? e.className : e.tagName) + "");
    });
    return fuori;
  }
  // i pezzi del gioco vecchio rimasti nella pagina (fuori dalla Sala)
  var PEZZI = { blackjack: ".bj-scena, .bj-dlg, .bj-tavolata", poker: ".pk-tavolo, .pk-azioni", asta: ".sa-sala, .st-stadio, .sa-rivela", sipero: ".sp-carta, .sp-timer", scarabocchio: ".sb-chat, canvas.sb-lav", garapesca: ".gp-resto, .gp-guarda-tempo" };

  // ---- i giochi: chi è seduto (dalla foto), un pezzo di partita per arrivare "a metà", la partita intera a copione ----
  function idDi(nome, host) { return nome === host ? "host" : A.mioId(nome); }
  function nomeDiId(id, umani, host) { for (var i = 0; i < umani.length; i++) if (idDi(umani[i], host) === id) return umani[i]; return null; }
  var G = {
    blackjack: { nome: "Black Jack", imp: { mani: 1 }, monete: true,
      seduti: function (v) { return (v.giocatori || []).map(function (g) { return g.nome; }); },
      inGioco: function (v) { return ["punta", "assic", "gioca", "banco", "esito"].indexOf(v.fase) >= 0; },
      dopoRivincita: function (v) { return v.fase === "punta" && v.mano <= 1; },
      // a metà: tutti hanno puntato (la puntata è già tolta dal saldo di ognuno)
      aMeta: async function (C, host, umani) {
        var fino = Date.now() + 20000, fatto = {};
        while (Date.now() < fino) {
          var v = vm(C);
          if (v.fase !== "punta" && (v.giocatori || []).every(function (g) { return g.puntata > 0; })) return "dopo le puntate (fase " + v.fase + ")";
          if (v.fase === "punta") pilotaBJ(C, host, umani, fatto, v, true);
          await W.dorme(250);
        }
        no("il Black Jack non arriva alle puntate (fase " + vm(C).fase + ")");
      },
      gioca: async function (C, host, umani) {
        var fatto = {}, fino = Date.now() + 90000;
        while (Date.now() < fino && vm(C).fase !== "fine") { pilotaBJ(C, host, umani, fatto, vm(C)); await W.dorme(300); }
        if (vm(C).fase !== "fine") no("il Black Jack non arriva alla classifica (fase " + vm(C).fase + ")");
      },
      // al tavolo di chi apre: ognuno con le sue monete di adesso
      fiches: function (v) { var o = {}; (v.giocatori || []).forEach(function (g) { o[g.nome] = g.fiches + (g.puntata || 0); }); return o; } },
    poker: { nome: "Poker", monete: true,
      seduti: function (v) { return (v.players || []).filter(function (p) { return !p.bot; }).map(function (p) { return p.nome; }); },
      inGioco: function (v) { return v.fase === "gioco"; },
      dopoRivincita: function (v) { return v.fase === "lobby" || v.fase === "gioco"; },
      aMeta: async function (C) {
        if (!await W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.n && v.stato !== "attesa" && v.stato !== "finemano"; }, 10000)) no("il Poker non apre la mano (fase " + vm(C).fase + ", stato " + vm(C).stato + ")");
        await W.dorme(800);
        return "a mano aperta (mano " + vm(C).n + ", " + vm(C).stato + ")";
      },
      gioca: async function (C, host, umani) {
        // una mano: gli amici lasciano, chi apre passa o chiama; poi chiude il tavolo (🏁) e c'è la classifica
        var fino = Date.now() + 60000, n0 = null, H = W.finestra(host);
        while (Date.now() < fino) {
          var v = vm(C);
          if (v.fase !== "gioco") { await W.dorme(200); continue; }
          if (n0 == null && v.n) n0 = v.n;
          if (v.stato === "finemano" || (n0 != null && v.n > n0)) break;
          if (v.turno === "host") { var b = H.document.querySelector(".pk-btn.passa"); if (b) b.click(); }
          else umani.forEach(function (n) { if (n !== host && A.mioId(n) === v.turno) W.reteDi(n).invia({ t: "azione", tipo: "lascia", tot: 0, n: v.n, st: v.stato, dc: v.daChiamare }); });
          await W.dorme(400);
        }
        var bF = H.document.querySelector("[aria-label='Fine partita']");
        if (!bF) no(host + " non ha 🏁 per chiudere il tavolo");
        bF.click();
        if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("toccato 🏁 non c'è la classifica del Poker");
      },
      // al tavolo di chi apre: chi si siede porta fino a 1.000 delle sue monete (buyin = quanto ha portato al tavolo)
      fiches: function (v) { var o = {}; (v.players || []).forEach(function (p) { if (!p.bot) o[p.nome] = p.buyin; }); return o; } },
    astaFanta: { nome: "L'Asta", imp: { formato: "fanta" },
      seduti: function (v) { return (v.giocatori || []).map(function (g) { return g.nome; }); },
      inGioco: function (v) { return v.fase === "asta" || v.fase === "esito"; },
      dopoRivincita: function (v) { return v.fase === "lobby" || v.fase === "asta"; },
      aMeta: async function (C, host, umani) {
        var H = W.finestra(host), osp = umani.filter(function (n) { return n !== host; })[0];
        var ok = await W.aspetta(function () {
          var v = vm(C), a = v.asta;
          if (v.fase !== "asta" || !a) return false;
          if (a.leaderId) return true;
          if (!W.clicca(H, /Lo prendo a/)) W.reteDi(osp).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta });
          return false;
        }, 15000);
        if (!ok) no("il Fantacalcio non arriva a un'offerta (fase " + vm(C).fase + ")");
        await W.dorme(600);
        return "con un'offerta in corso (carta " + vm(C).asta.nCarta + ", " + vm(C).asta.offerta + " a " + vm(C).asta.leaderId + ")";
      },
      gioca: async function (C, host, umani) {
        // il primo che può lo prende a 1, l'altro passa; alla fine "Salta ⏭" fino al podio
        var fino = Date.now() + 150000, H = W.finestra(host), osp = umani.filter(function (n) { return n !== host; })[0], fatto = {};
        while (Date.now() < fino && vm(C).fase !== "fine") {
          var v = vm(C), a = v.asta;
          if (v.fase === "asta" && a) {
            var k = a.nCarta + "|" + a.leaderId;
            if (!a.leaderId && !W.clicca(H, /Lo prendo a/) && !fatto[k]) { fatto[k] = 1; W.reteDi(osp).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta }); }
            else if (a.leaderId === "host" && !fatto[k]) { fatto[k] = 1; W.reteDi(osp).invia({ t: "passa", n: a.nCarta }); }
            else if (a.leaderId && a.leaderId !== "host") W.clicca(H, /^Passo$/);
          }
          await W.dorme(300);
        }
        if (vm(C).fase !== "fine") no("il Fantacalcio non arriva alla classifica (fase " + vm(C).fase + ")");
        await W.dorme(600);
        for (var i = 0; i < 6; i++) { umani.forEach(function (n) { W.clicca(W.finestra(n), /Salta/); }); await W.dorme(300); }
      } },
    asta: { nome: "L'Asta",
      seduti: function (v) { return (v.giocatori || []).map(function (g) { return g.nome; }); },
      inGioco: function (v) { return v.fase && v.fase !== "lobby" && v.fase !== "fine"; },
      dopoRivincita: function (v) { return v.fase && v.fase !== "fine"; },
      aMeta: async function (C) {
        if (!await W.aspetta(function () { var f = vm(C).fase; return f === "scelta" || f === "asta"; }, 15000)) no("l'Asta non arriva alla prima carta (fase " + vm(C).fase + ")");
        await W.dorme(1200);
        return "alla prima carta (fase " + vm(C).fase + ")";
      },
      gioca: async function (C, host, umani) {
        // chi sceglie prende la prima carta, tutti passano; poi il voto
        var fino = Date.now() + 200000, H = W.finestra(host);
        while (Date.now() < fino && vm(C).fase !== "voto" && vm(C).fase !== "fine") {
          var v = vm(C);
          umani.forEach(function (n) {
            if (n === host) return;
            var h = W.reteDi(n), id = A.mioId(n); if (!h) return;
            if (v.fase === "scelta" && v.sceglieId === id) h.invia({ t: "scegli", idx: 0 });
            if (v.fase === "asta") h.invia({ t: "passa" });
          });
          if (v.fase === "scelta" && v.sceglieId === "host") { var carta = H.document.querySelector(".as-carta:not([disabled])"); if (carta) carta.click(); }
          if (v.fase === "asta") W.clicca(H, /^\s*Passo\s*$/);
          W.clicca(H, /Vedi le carte|Avanti|Si vota/);
          await W.dorme(500);
        }
        if (vm(C).fase !== "voto") no("l'Asta non arriva al voto (fase " + vm(C).fase + ")");
        umani.forEach(function (n) { if (n !== host) W.reteDi(n).invia({ t: "voto", voti: {}, s: vm(C).sessione }); });
        if (!await W.aspetta(function () { return vm(C).fase === "fine" || W.clicca(H, /Chiudi il voto/); }, 8000)) no("il voto dell'Asta non si chiude");
        if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("dopo il voto non c'è la classifica dell'Asta");
      } },
    sipero: { nome: "Sì... però", quattro: true,
      seduti: function (v) { return (v.giocatori || []).map(function (g) { return g.nome; }); },
      inGioco: function (v) { return v.fase && v.fase !== "lobby" && v.fase !== "fine"; },
      dopoRivincita: function (v) { return v.fase && v.fase !== "fine"; },
      aMeta: async function (C) {
        if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).step; }, 12000)) no("Sì... però non comincia il round (fase " + vm(C).fase + ")");
        await W.dorme(1000);
        return "al round " + (vm(C).round || 1) + " (fase " + vm(C).fase + ")";
      },
      gioca: async function (C, host, umani) {
        // coi tocchi veri su ogni telefono: chi tocca gioca le prime carte, poi arringa, verdetto, prossimo round
        var fino = Date.now() + 180000;
        while (Date.now() < fino && vm(C).fase !== "fine") {
          var v = vm(C);
          umani.forEach(function (n) {
            var w = W.finestra(n), d = w.document;
            if (v.fase === "gioco" && v.step) {
              var bOk = [].find.call(d.querySelectorAll("button"), function (b) { return /^Gioca ▶/.test(b.textContent); });
              if (bOk && bOk.disabled) { var cc = d.querySelectorAll(".sp-carta[role=button]"); for (var i = 0; i < v.step.n && i < cc.length; i++) if (!cc[i].classList.contains("su")) cc[i].click(); }
              if (bOk && !bOk.disabled) bOk.click();
            } else if (v.fase === "arringa") W.clicca(w, /Tocca alla|Al verdetto/);
            else if (v.fase === "giudizio") { var b = d.querySelector(".sp-vota:not([disabled])"); if (b) b.click(); }
            else if (v.fase === "esito" && n === host) W.clicca(w, /Prossimo round|Classifica finale/);
          });
          await W.dorme(400);
        }
        if (vm(C).fase !== "fine") no("Sì... però non arriva alla classifica (fase " + vm(C).fase + ", round " + vm(C).round + ")");
      } },
    scarabocchio: { nome: "Scarabocchio", imp: { giri: 1 },
      seduti: function (v) { return (v.players || []).filter(function (p) { return !p.via; }).map(function (p) { return p.nome; }); },
      inGioco: function (v) { return ["scelta", "disegno", "punti"].indexOf(v.fase) >= 0; },
      dopoRivincita: function (v) { return v.fase === "lobby" || ["scelta", "disegno", "punti"].indexOf(v.fase) >= 0; },
      aMeta: async function (C, host, umani) {
        var ok = await W.aspetta(function () {
          var v = vm(C);
          if (v.fase === "disegno") return true;
          var chi = nomeDiId(v.disegnatore, umani, host);
          if (v.fase === "scelta" && chi) { var b = W.finestra(chi).document.querySelector(".sb-scelte button"); if (b) b.click(); }
          return false;
        }, 15000);
        if (!ok) no("lo Scarabocchio non arriva al disegno (fase " + vm(C).fase + ")");
        await W.dorme(1500);
        return "mentre si disegna (turno " + vm(C).turno + ")";
      },
      gioca: async function (C, host, umani) {
        // chi disegna sceglie la prima parola; gli altri la scrivono (chi apre nella sua chat, gli amici col messaggio)
        var fino = Date.now() + 150000, parola = {}, detto = {};
        while (Date.now() < fino && vm(C).fase !== "fine") {
          var v = vm(C), chi = nomeDiId(v.disegnatore, umani, host);
          if (v.fase === "scelta" && chi) { var b = W.finestra(chi).document.querySelector(".sb-scelte button"); if (b && !parola[v.turno]) { parola[v.turno] = b.textContent; b.click(); } }
          if (v.fase === "disegno" && parola[v.turno]) umani.forEach(function (n) {
            if (n === chi || detto[v.turno + n]) return;
            detto[v.turno + n] = 1;
            if (n === host) { var w = W.finestra(n), inp = w.document.querySelector(".sb-inp"), f = w.document.querySelector(".sb-scrivi"); if (inp && f) { inp.value = parola[v.turno]; f.dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true })); } }
            else W.reteDi(n).invia({ t: "prova", x: parola[v.turno] });
          });
          await W.dorme(300);
        }
        if (vm(C).fase !== "fine") no("lo Scarabocchio non arriva alla classifica (fase " + vm(C).fase + ")");
      } },
    garapesca: { nome: "Gara di pesca", imp: { durata: 12 },
      seduti: function (v) { return (v.players || []).map(function (p) { return p.nome; }); },
      inGioco: function (v) { return v.fase === "gioco"; },
      dopoRivincita: function (v) { return v.fase === "lobby" || v.fase === "gioco"; },
      aMeta: async function (C) {
        if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 10000)) no("la Gara di pesca non comincia");
        await W.dorme(2500);
        return "a gara cominciata";
      },
      gioca: async function (C) {
        if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 35000)) no("la Gara di pesca non finisce (fase " + vm(C).fase + ")");
      } }
  };
  function pilotaBJ(C, host, umani, fatto, v, soloPunta) {
    var H = W.finestra(host), k = v.mano + "|" + v.fase + "|" + v.turno;
    var seat = function (n) { return (v.giocatori || []).findIndex(function (g) { return g.nome === n; }); };
    if (v.fase === "punta") {
      umani.forEach(function (n) { if (n === host) return; var g = v.giocatori[seat(n)]; if (g && !g.puntata && !fatto[k + n]) { W.reteDi(n).invia({ t: "mossa", kind: "punta", val: 10 }); fatto[k + n] = 1; } });
      if (v.giocatori[0] && !v.giocatori[0].puntata) W.clicca(H, /^Punta /);
      return;
    }
    if (soloPunta) return;
    if (v.fase === "assic") {
      umani.forEach(function (n) { if (n !== host && !fatto[k + n]) { W.reteDi(n).invia({ t: "mossa", kind: "assic", si: false }); fatto[k + n] = 1; } });
      W.clicca(H, /^No$/);
    } else if (v.fase === "gioca") {
      if (v.turno === 0) W.clicca(H, /^Stai$/);
      else umani.forEach(function (n) { var g = v.giocatori[v.turno]; if (n !== host && seat(n) === v.turno && !fatto[k + n + g.attiva]) { W.reteDi(n).invia({ t: "mossa", kind: "azione", mossa: "stai" }); fatto[k + n + g.attiva] = 1; } });
    } else if (v.fase === "esito") W.clicca(H, /Classifica ▶|Basta così/);
  }

  // ---- uno scenario ----
  async function cambioHost(gid, CMP) {
    var g = G[gid], note = [], gioco = gid === "astaFanta" ? "asta" : gid;
    var tutti = g.quattro ? ["Paky", "Giulia", "Luca", "Marco"] : ["Paky", "Giulia", "Luca"], dopo = tutti.slice(1);
    W.__monete = { Paky: 900, Giulia: 700, Luca: 600, Marco: 500 }; W.__salvate = [];
    var opz = function (nome, x) { return { x: x, emoji: "🍻", spiaC3: true, prima: primaDi(nome) }; };
    // 1. la Compagnia: Paky la apre, gli amici entrano dal link fisso
    var P = await P3.apriCompagnia("Paky", CMP, NOME_COMP, opz("Paky", 0));
    if (!await W.aspetta(function () { return eHost(P) && hostDi(CMP) === "Paky" && (W.statoStanza(CMP) || {}).t === "sala"; }, 6000)) no("Paky non apre la Sala della Compagnia («" + T(P).slice(0, 80) + "»)");
    for (var i = 0; i < dopo.length; i++) {
      var n = dopo[i];
      await P3.apriCompagnia(n, CMP, NOME_COMP, opz(n, 185 * (i + 1)));
      if (!await W.aspetta(function () { return nomi(CMP).indexOf(n) >= 0 && eOspite(W.finestra(n)); }, 8000)) no(n + " non entra nella Sala della Compagnia (" + nomi(CMP).join(", ") + ")");
    }
    if (!await W.aspetta(function () { var vc = vm(CMP).vice || []; return vc.length === Math.min(2, dopo.length) && vc[0] === A.idInSala(CMP, "Giulia") && hostDi(CMP) === "Paky"; }, 4000)) no("vice: " + JSON.stringify(vm(CMP).vice));
    var Gw = W.finestra("Giulia"), L = W.finestra("Luca");
    var sfondoSala = Gw.getComputedStyle(Gw.document.body).backgroundColor;
    // Paky lancia il gioco: tutti nella saletta, si comincia
    if (g.imp && gid === "astaFanta") P.__imp = { formato: "fanta" };
    var C1 = await A.lanciaDallaSala("Paky", CMP, g.nome);
    if (!await W.aspetta(function () { return dopo.every(function (x) { return g.seduti(vm(C1)).indexOf(x) >= 0; }); }, 10000)) no("gli amici non si siedono nel " + g.nome + " di Paky (" + g.seduti(vm(C1)).join(", ") + ")");
    era(dopo, "gioco");   // (da qui i timer degli amici sono "della partita": anche quelli che nascono appena arriva la prima foto)
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 4000)) no("Paky non ha «Comincia»");
    if (!await W.aspetta(function () { return g.inGioco(vm(C1)); }, 10000)) no("il " + g.nome + " di Paky non comincia (fase " + vm(C1).fase + ")");
    if (g.monete) {
      var f1 = g.fiches(vm(C1));
      if (f1.Paky !== 900 || f1.Giulia !== 700 || f1.Luca !== 600) no("al tavolo di Paky le monete non sono quelle di ognuno: " + JSON.stringify(f1));
    }
    note.push(g.nome + " di Paky " + await g.aMeta(C1, "Paky", tutti));
    // 2. il telefono di Paky si spegne a metà partita
    var nSalvPaky = W.__salvate.filter(function (s) { return s.tel === "Paky"; }).length;
    var passa = sentinella(dopo, ERRORI), t0 = Date.now();
    spentoDavvero("Paky");
    var Lfin = W.finestra(dopo[dopo.length - 1]);
    if (!await W.aspetta(function () { return hostDi(CMP) === "Giulia" && vm(CMP).gen === 2 && eHost(Gw) && dopo.slice(1).every(function (x) { return salaDi(W.finestra(x), CMP); }); }, 28000, 250))
      no("la Sala non passa a Giulia (host " + hostDi(CMP) + ", gen " + vm(CMP).gen + ", Giulia «" + T(Gw).slice(0, 50) + "», " + dopo[1] + " «" + T(W.finestra(dopo[1])).slice(0, 50) + "»)");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    era(dopo, "dopo");
    var visti = passa.stop(); if (visti.length) no("durante il passaggio: " + visti.join("; "));
    if (vm(CMP).gioco || vm(CMP).stanza) no("la Sala di Giulia ha ancora il gioco " + vm(CMP).gioco + " (" + vm(CMP).stanza + ")");
    if (nomi(CMP).sort().join(",") !== dopo.slice().sort().join(",")) no("nella Sala di Giulia ci sono " + nomi(CMP).join(", "));
    note.push("Paky spento: Sala a Giulia dopo " + dt + " s");
    // 3. per 3 secondi niente del gioco vecchio sopra la Sala
    var resta = sentinella(dopo, ERRORI);
    await W.dorme(3000);
    var vv = resta.stop(); if (vv.length) no("dopo il passaggio: " + vv.join("; "));
    var timer = [];
    dopo.forEach(function (x) {
      var w = W.finestra(x);
      if (x === "Giulia" ? !eHost(w) : !salaDi(w, CMP)) no(x + " non è più nella Sala («" + T(w).slice(0, 60) + "»)");
      var f = salaAVista(w); if (f.length) no(x + ": sopra la Sala c'è qualcos'altro (" + f.join(", ") + ")");
      var pz = w.document.querySelector(PEZZI[gioco]); if (pz && pz.offsetParent) no(x + ": si vede ancora un pezzo del gioco vecchio (" + pz.className + ")");
      if (w.document.body.classList.contains("bj-verde")) no(x + ": sotto la Sala è rimasto il tavolo verde del Black Jack");
      var bg = w.getComputedStyle(w.document.body).backgroundColor; if (bg !== sfondoSala) no(x + ": lo sfondo della Sala è " + bg + " (prima " + sfondoSala + ")");
      var gd = (w.__spiaT && w.__spiaT.giri["gioco>dopo"]) || 0;
      timer.push(x + " " + gd);
      if (gd > 8) no(x + ": i tempi del gioco vecchio girano ancora (" + gd + " in 3 s: " + Object.keys(w.__spiaT.chi).map(function (k) { return w.__spiaT.chi[k] + "× " + k; }).slice(0, 3).join(" | ") + ")");
    });
    note.push("3 s dopo tutti nella Sala, niente gioco vecchio (timer vecchi scattati: " + timer.join(", ") + ")");
    // le monete: nessun telefono ha scritto quelle di un altro
    if (W.__salvate.some(function (s) { return s.tel !== s.di; })) no("un telefono ha scritto le monete di un altro");
    // 4. Giulia rilancia lo stesso gioco dalla sua Sala
    if (g.imp) Gw.__imp = Object.assign({}, g.imp);
    var saldoLancio = Object.assign({}, W.__monete);   // (le monete di ognuno quando Giulia apre il tavolo: poi i bui e le puntate le cambiano)
    var C2 = await A.lanciaDallaSala("Giulia", CMP, g.nome);
    if (C2 === C1) no("Giulia ha riaperto la stanza di Paky (" + C1 + ")");
    if (!await W.aspetta(function () { return dopo.every(function (x) { return g.seduti(vm(C2)).indexOf(x) >= 0; }); }, 10000)) no("gli amici non si siedono nel " + g.nome + " di Giulia (" + g.seduti(vm(C2)).join(", ") + ")");
    if (g.seduti(vm(C2)).indexOf("Paky") >= 0) no("al " + g.nome + " di Giulia c'è ancora Paky");
    if (!await W.aspetta(function () { return W.clicca(Gw, /Comincia/, ".sl-go"); }, 4000)) no("Giulia non ha «Comincia»");
    if (!await W.aspetta(function () { return g.inGioco(vm(C2)); }, 10000)) no("il " + g.nome + " di Giulia non comincia (fase " + vm(C2).fase + ")");
    if (g.monete) {
      var f2 = g.fiches(vm(C2)), atteso = {};
      // (Black Jack: il saldo di adesso; Poker: si porta al tavolo fino a 1.000 del saldo)
      dopo.forEach(function (x) { atteso[x] = gid === "poker" ? Math.min(1000, saldoLancio[x]) : saldoLancio[x]; });
      dopo.forEach(function (x) { if (f2[x] !== atteso[x]) no("al tavolo di Giulia " + x + " ha " + f2[x] + " invece delle sue monete (" + atteso[x] + "); tavolo " + JSON.stringify(f2)); });
      note.push("monete al tavolo di Giulia: " + dopo.map(function (x) { return x + " " + f2[x]; }).join(", ") + " (le loro monete: " + dopo.map(function (x) { return x + " " + saldoLancio[x]; }).join(", ") + "; all'inizio 700 e 600)");
    }
    await g.gioca(C2, "Giulia", dopo);
    await W.dorme(2500);   // (la Gara di pesca mostra ancora un attimo il lago, l'Asta il podio)
    var fineG = await W.aspetta(function () { var t = A.tastiFineDi(Gw); return t && /Rivincita/.test(t[0]) ? t : null; }, 8000);
    if (!fineG) no("alla fine Giulia non ha «↻ Rivincita» (" + T(Gw).slice(-80) + ")");
    for (var j = 1; j < dopo.length; j++) { var wj = W.finestra(dopo[j]); if (!await W.aspetta(function () { var t = A.tastiFineDi(wj); return t && /Ci sto/.test(t[0]); }, 6000)) no("alla fine " + dopo[j] + " non ha «👍 Ci sto!» (" + T(wj).slice(-80) + ")"); }
    note.push("fine: Giulia «" + fineG.join(" | ") + "»");
    // la Rivincita col 3-2-1 (gli amici ci stanno già)
    var via = { visto: false }, tv = setInterval(function () { dopo.forEach(function (x) { var w = W.finestra(x); if (w && w.document.querySelector(".sl-via")) via.visto = true; }); }, 40);
    dopo.slice(1).forEach(function (x) { W.clicca(W.finestra(x), /Ci sto/, ".fine-tasti button"); });
    await W.dorme(500);
    if (!W.clicca(Gw, /Rivincita/, ".fine-tasti button")) { clearInterval(tv); no("Giulia non trova «↻ Rivincita»"); }
    var ripartito = await W.aspetta(function () { var v = vm(C2); return g.inGioco(v) && v.fase !== "fine" && (gid !== "blackjack" || g.dopoRivincita(v)) ? v : null; }, 20000);
    if (!ripartito) {
      // (se il gioco torna nella saletta e non parte da solo è NO)
      var stanza = A.codiceSaletta(Gw), vv2 = vm(stanza || C2);
      clearInterval(tv);
      no("dopo «Rivincita» non si riparte da soli (fase " + vv2.fase + ", Giulia «" + T(Gw).slice(0, 60) + "»)");
    }
    await W.dorme(300); clearInterval(tv);
    if (gid !== "blackjack" && !via.visto) no("la Rivincita è partita senza il 3-2-1");
    note.push("Rivincita: " + (gid === "blackjack" ? "serie nuova allo stesso tavolo" : "3-2-1 e si riparte senza toccare «Comincia»"));
    if (W.__salvate.some(function (s) { return s.tel !== s.di; })) no("un telefono ha scritto le monete di un altro");
    if (g.monete) {
      var nP = W.__salvate.filter(function (s) { return s.tel === "Paky"; }).length - nSalvPaky;
      note.push("monete di Paky: " + W.__monete.Paky + " (dal suo telefono spento " + nP + " salvataggi)");
    }
    await P3.unSoloHost(CMP, 1500);
    erroriVuoti();
    return note.join(" · ");
  }
  aggiungi(391, { nome: "Black Jack nella Compagnia: Paky sparisce dopo le puntate, la Sala a Giulia, lei riapre il tavolo con le sue monete, Rivincita", fai: function () { return cambioHost("blackjack", "GCBJKQ"); } });
  aggiungi(392, { nome: "Poker nella Compagnia: Paky sparisce a mano aperta, la Sala a Giulia, lei riapre il tavolo con le sue monete, Rivincita col 3-2-1", fai: function () { return cambioHost("poker", "GCPKRQ"); } });
  aggiungi(393, { nome: "L'Asta Fantacalcio nella Compagnia: Paky sparisce con un'offerta in corso, niente si ferma, Giulia la rifà fino al podio, Rivincita col 3-2-1", fai: function () { return cambioHost("astaFanta", "GCFNTQ"); } });
  aggiungi("393b", { nome: "L'Asta coi temi nella Compagnia: Paky sparisce alla prima carta, Giulia la rifà fino al voto, Rivincita col 3-2-1", fai: function () { return cambioHost("asta", "GCASTQ"); } });
  aggiungi(394, { nome: "Sì... però nella Compagnia (in 4): Paky sparisce a metà round, la Sala a Giulia, si rifà in 3, Rivincita col 3-2-1", fai: function () { return cambioHost("sipero", "GCSPRQ"); } });
  aggiungi(395, { nome: "Scarabocchio nella Compagnia: Paky sparisce mentre si disegna, la Sala a Giulia, si rifà, Rivincita col 3-2-1", fai: function () { return cambioHost("scarabocchio", "GCSCRQ"); } });
  aggiungi(396, { nome: "Gara di pesca nella Compagnia: Paky sparisce a gara cominciata, la Sala a Giulia, si rifà, Rivincita col 3-2-1", fai: function () { return cambioHost("garapesca", "GCPSCQ"); } });
})();
