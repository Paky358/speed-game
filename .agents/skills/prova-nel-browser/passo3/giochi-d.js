// PROVE DEL PASSO 3, GRUPPO D (parole e quiz) col cambio di host della Sala: La linea del tempo, Nomi Cose e Città,
// La Balla Colossale, Taboo, Parola d'ordine, La Patata Bollente. Pezzo p3-g4.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo3/comune.js"); await COPIONE.carica("passo3/giochi-d.js"); await COPIONE.prova(401)
//   (tutte in fila: await COPIONE.gruppoD3())
//
// 401-404 e 406, uno per gioco (401 Linea del tempo, 402 Nomi Cose e Città, 403 Balla, 404 Taboo, 406 Patata):
//   1. Compagnia (3 telefoni; Balla 4, Taboo 5: il gioco ne vuole 3 o 4 anche dopo): Paky la apre, gli amici entrano dal
//      link fisso. Paky lancia il gioco dalla Sala, gli amici arrivano nella saletta, si comincia e si gioca un pezzo.
//   2. A metà partita il telefono di Paky si spegne davvero (rete muta e testamento). Entro 28 s la Sala la tiene Giulia
//      (gen 2), gli altri la seguono, nella Sala non c'è più il gioco; durante il passaggio nessuno vede «Ops»,
//      «Collegamento perso» o «La stanza è chiusa».
//   3. Per 3 secondi nessun pezzo del gioco vecchio torna sopra la Sala (punti dello schermo, pezzi attaccati alla pagina,
//      spia dei timer nati durante la partita), nessuno resta collegato alla stanza vecchia, nessuno la ripubblica.
//   4. Giulia rilancia lo stesso gioco dalla sua Sala (regole corte solo per la prova), si gioca fino alla fine, tasti del
//      core («↻ Rivincita» per Giulia, «👍 Ci sto!» per gli altri), Rivincita col 3-2-1 senza altri tocchi.
//   401 in più: Paky (che aveva la Linea del tempo salvata sul telefono, riprende: true) si riaccende e ricarica la pagina:
//   entra da amico nella Sala di Giulia e la sua partita vecchia non riparte («si riprende» mai).
// 405 Parola d'ordine (host di riserva, 5 telefoni): Paky sparisce a metà partita → il vice DEL GIOCO la porta avanti
//   (dopo 6 s), la Sala passa a Giulia (20 s) e NON chiude il gioco: nessuno torna nella Sala, la partita va avanti fino
//   alla fine. A fine partita «🏠 Torna in Sala» porta tutti nella Sala di Giulia; lei rilancia e si arriva alla Rivincita.
//   405  il vice del gioco è Giulia (lo stesso telefono del vice della Sala)
//   405b il vice del gioco è Luca (Giulia entra nella partita per ultima): host della Sala e host del gioco su due telefoni
//   405c come 405b, ma Paky era uscito un attimo dall'app (pausa): la Sala passa dopo 90 s, il gioco dopo 6 s
// Le mosse: quelle degli amici partono dai loro telefoni (reteDi(nome).invia), quelle di chi tiene la stanza entrano nella
// sua stanza col suo id (come i suoi tocchi). Taboo: l'orologio di taboo.js di chi tiene la stanza va avanti di un turno.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, P3 = COPIONE.passo3 || W.P3;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  function vm(c) { return A.vm(c); }
  var T = A.T, GRUPPO = ["timeline", "nomicose", "balla", "taboo", "ordine", "patata"];
  var NOME_COMP = "Quelli del giovedì", BASE = "seratagiochi/v1/";

  // ---- la spia dei giochi del gruppo D (solo con apriTel(nome, { spiaD4: true })) ----
  // w.__imp = { … }: regole cambiate per la prova (le legge solo chi apre la stanza); w.__t = il tavolo del gioco
  if (!W.__prepGruppoD4) {
    W.__prepGruppoD4 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepGruppoD4(w, nome, opz);
      if (!opz || !opz.spiaD4) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GRUPPO.indexOf(g.id) >= 0 && !g.__spiaD4) {
            g.__spiaD4 = true;
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
  // prima che parta l'app: la spia dei timer e la spia delle stanze aperte da questo telefono
  function primaDi() { return function (w) { spiaTimer(w); spiaHost(w); }; }
  // chi apre una stanza (anche il vice di Parola d'ordine che prende il posto): w.__cbH[gioco] = i suoi callback (per le sue
  // mosse), w.__chiave = la chiave di Parola d'ordine mandata ai capi; Taboo: l'orologio di taboo.js va avanti di w.__salto
  function spiaHost(w) {
    if (w.__spiaHostD4 || !w.SGNet) return;
    w.__spiaHostD4 = true; w.__cbH = {}; w.__salto = 0;
    var osp = w.SGNet.ospita;
    w.SGNet.ospita = function (gid, cb) {
      var h = osp.apply(this, arguments);
      w.__cbH[gid] = cb;
      if (h && h.inviaVeloce) { var iv = h.inviaVeloce; h.inviaVeloce = function (m) { if (m && m.t === "chiave" && m.col) w.__chiave = { bid: m.bid, col: m.col }; return iv.apply(this, arguments); }; }
      return h;
    };
    var ora = w.Date.now.bind(w.Date);
    w.Date.now = function () { if (w.__salto && /taboo\.js/.test(new Error().stack || "")) return ora() + w.__salto; return ora(); };
  }
  // la spia dei timer (come in giochi-c.js): w.__spiaT.era = "gioco" mentre si gioca, "dopo" quando la Sala è passata;
  // giri["gioco>dopo"] = quante volte è scattato un timer nato durante la partita dopo il passaggio
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

  // ---- aiuti della Sala (come in giochi-c.js) ----
  function nomeHost(m) { var h = ((m && m.membri) || []).filter(function (x) { return x && x.id === "host"; })[0]; return h ? h.nome : ""; }
  function hostDi(c) { return nomeHost(vm(c)); }
  function nomi(c) { return (vm(c).membri || []).map(function (m) { return m.nome; }); }
  function eHost(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-go")); }
  function eOspite(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-attesa") && /Sei dentro/.test(W.testo(w))); }
  function salaDi(w, C) { return eOspite(w) && A.codiceTestata(w) === C; }
  function inSalaHost(w) { return eHost(w) && /Scegli (un|il primo) gioco|Prossimo gioco/.test(W.testo(w)); }
  function spentoDavvero(nome) { W.congela(nome); W.spegni(nome); }
  function erroriVuoti() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function sentinella(nomiTel, re) {
    var visti = [];
    var t = setInterval(function () { nomiTel.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(re); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 50);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  var ERRORI = /Problema di collegamento|Collegamento perso|Ops\b|La stanza è chiusa|stanza è piena|chiusa dall'host|Non riesco ad aprire/;
  function salaAVista(w) {
    var d = w.document, iw = w.innerWidth, ih = w.innerHeight, fuori = [];
    [[iw / 2, ih / 2], [iw / 2, ih * 0.25], [iw / 2, ih * 0.8]].forEach(function (p) {
      var e = d.elementFromPoint(p[0], p[1]);
      if (e && !e.closest(".saletta-schermo, .sg-pillola, .sl-velo, .conferma-sfondo")) fuori.push((e.className && e.className.baseVal == null ? e.className : e.tagName) + "");
    });
    return fuori;
  }
  // i pezzi attaccati alla pagina (fuori dalla schermata) che si vedono: quelli nuovi rispetto a "prima" sono del gioco
  function pezziPagina(w) {
    return [].filter.call(w.document.body.children, function (n) {
      if (/^(SCRIPT|STYLE|LINK|AUDIO|TEMPLATE)$/.test(n.tagName)) return false;
      var cs = w.getComputedStyle(n);
      return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0 && n.getBoundingClientRect().width > 0;
    });
  }
  // chi (tranne quelli spenti) è ancora collegato alla stanza C del gioco vecchio
  function ancoraInStanza(C, tranne) {
    var pre = BASE + C + "/";
    return Object.keys(W.BR.perNome || {}).filter(function (n) {
      if ((tranne || []).indexOf(n) >= 0) return false;
      return (W.BR.perNome[n] || []).some(function (c) { return c.connected && !c.morto && !c.frozen && [].some.call(Array.from(c.subs || []), function (t) { return t.indexOf(pre) === 0; }); });
    });
  }

  // ---- le partite a copione: X = { gid, C, apre (chi ha aperto la stanza), id: { nome: id }, nomeDi: { id: nome } } ----
  // gli id di chi è nella partita (presi quando tutti sono seduti: dopo il subentro di Parola d'ordine restano quelli)
  function partita(gid, C, apre, umani) {
    var X = { gid: gid, C: C, apre: apre, id: {}, nomeDi: {} };
    umani.forEach(function (n) { var i = n === apre ? "host" : A.mioId(n); X.id[n] = i; if (i) X.nomeDi[i] = n; });
    return X;
  }
  // chi tiene la stanza adesso (Parola d'ordine: dopo il subentro è il vice)
  function chiTiene(X) {
    var v = vm(X.C);
    if (X.gid === "ordine" && v.hostId && v.hostId !== "host") return X.nomeDi[v.hostId] || X.apre;
    return X.apre;
  }
  // una mossa di id: di chi tiene la stanza (entra nella sua stanza col suo id) o di un amico (dal suo telefono)
  function manda(X, id, m) {
    var n = X.nomeDi[id]; if (!n) return;
    if (n === chiTiene(X)) {
      var w = W.finestra(n), cb = w && w.__cbH && w.__cbH[X.gid];
      if (!cb) no("non trovo la stanza di " + n);
      cb.onMsg(id, m); return;
    }
    var h = W.reteDi(n); if (h) h.invia(m);
  }
  function seduti(gid, v) { return ((gid === "timeline" || gid === "taboo" ? v.giocatori : v.players) || []).filter(function (p) { return !p.via; }).map(function (p) { return p.nome; }); }
  function inGioco(v) { return !!v.fase && v.fase !== "lobby" && v.fase !== "fine"; }
  // un giro del copione (si chiama ogni 300 ms): F = quello che è già stato fatto
  var MOSSA = {
    timeline: function (X, v, F) {
      var k = v.fase + "|" + v.n, chi = v.turnoId;
      if (F.k === k || !chi) return;
      if (v.fase === "turno") { manda(X, chi, { t: "scelta", gap: 0 }); F.k = k; }
      else if (v.fase === "votazione") { (v.giocatori || []).forEach(function (g) { if (g.id !== chi && !g.via) manda(X, g.id, { t: "voto", d: true }); }); F.k = k; }
      else if (v.fase === "esito") { manda(X, chi, { t: "avanti" }); F.k = k; }
    },
    nomicose: function (X, v, F) {
      (v.players || []).forEach(function (p) {
        if (p.via) return;
        var k = v.fase + "|" + v.giro + "|" + v.ci + "|" + p.id;
        if (F[k]) return;
        if (v.fase === "scrittura" && (v.fatti || []).indexOf(p.id) < 0) { manda(X, p.id, { t: "risposte", r: [] }); F[k] = 1; }
        if (v.fase === "tabellone" && (v.pronti || []).indexOf(p.id) < 0) { manda(X, p.id, { t: "pronto", ci: v.ci }); F[k] = 1; }
      });
    },
    balla: function (X, v, F) {
      F.prova = F.prova || {};
      (v.players || []).forEach(function (p) {
        if (p.via || (v.fatti || []).indexOf(p.id) >= 0) return;
        if (v.fase === "scrittura") { var k = "s|" + v.giro + "|" + p.id; if (!F[k]) { F[k] = 1; manda(X, p.id, { t: "balla", testo: "una balla inventata da " + p.nome }); } }
        if (v.fase === "voto" && v.scelte && v.scelte.length) { F.prova[p.id] = (F.prova[p.id] || 0) + 1; manda(X, p.id, { t: "voto", k: F.prova[p.id] % v.scelte.length }); }
      });
    },
    taboo: function (X, v, F) {
      var k = v.fase + "|" + v.turno + "|" + v.attivo;
      if (F.k === k || !v.attivo) return;
      if (v.fase === "pronto" && !v.avviso && !v.pausa) { manda(X, v.attivo, { t: "pronto" }); F.k = k; }
      else if (v.fase === "turno" && v.carta) {
        manda(X, v.attivo, { t: "indovinata", chiave: v.chiaveCarta });
        F.k = k;
        var w = W.finestra(chiTiene(X)), salto = ((v.durata || 60) + 2) * 1000;
        setTimeout(function () { if (w) w.__salto += salto; }, 600);   // il turno finisce adesso (solo l'orologio di Taboo di chi tiene la stanza)
      }
    },
    ordine: function (X, v, F) {
      if (v.fase !== "gioco" || v.sospeso || v.attesa) return;
      var k = v.passo + "|" + v.turno + "|" + (v.storia || []).length, capo = v.capo[v.turno];
      if (F.k === k) return;
      if (v.passo === "indizio" && capo && !(v.players.filter(function (p) { return p.id === capo; })[0] || {}).via) { manda(X, capo, { t: "indizio", parola: "ZIGOMAR", n: 1 }); F.k = k; return; }
      if (v.passo === "indovina" && !F.soloIndizio) {
        // la parola nera (dalla chiave mandata ai capi di questo tabellone): chi la gira chiude la partita
        var ch = null; X.umani.forEach(function (n) { var c = (W.finestra(n) || {}).__chiave; if (!ch && c && c.bid === v.bid) ch = c.col; });
        var chi = (v.players || []).filter(function (p) { return p.team === v.turno && p.id !== capo && !p.via; })[0];
        if (!ch || !chi) return;
        manda(X, chi.id, { t: "gira", i: ch.indexOf("x") }); F.k = k;
      }
    },
    patata: function (X, v) {
      if (v.fase === "voto") W.clicca(W.finestra(chiTiene(X)), /Via! ▶/);
    }
  };
  // il copione gira finché basta(v) o per ms millisecondi
  async function pilota(X, basta, ms, F) {
    var fino = Date.now() + ms; F = F || {};
    while (Date.now() < fino) {
      var v = vm(X.C);
      if (basta(v)) return v;
      try { MOSSA[X.gid](X, v, F); } catch (e) { if (/non trovo/.test(e.message)) throw e; }
      await W.dorme(300);
    }
    return null;
  }
  async function finoAllaFine(X, ms) {
    if (!await pilota(X, function (v) { return v.fase === "fine"; }, ms || 150000)) no("la partita di " + chiTiene(X) + " non arriva alla fine (fase " + vm(X.C).fase + ")");
  }

  // i giochi: quanti telefoni, regole corte (1 = la partita di Paky, 2 = quella di Giulia), un pezzo di partita "a metà"
  var G = {
    timeline: { nome: "La linea del tempo", tel: 3, imp1: { carte: 3 }, imp2: { carte: 1 },
      aMeta: function (X) { var n = 0; return pilota(X, function (v) { if (v.fase === "esito") n = 1; return n && v.fase === "turno"; }, 20000); } },
    nomicose: { nome: "Nomi, Cose e Città", tel: 3, imp1: { round: 3 }, imp2: { round: 1 },
      aMeta: function (X) { return pilota(X, function (v) { return v.fase === "scrittura"; }, 40000); } },
    balla: { nome: "La Balla Colossale", tel: 4, imp1: { round: 3 }, imp2: { round: 1 },
      aMeta: function (X) { return pilota(X, function (v) { return v.fase === "voto"; }, 60000); } },
    taboo: { nome: "Taboo", tel: 5, imp1: { tempo: 60, giri: 3 }, imp2: { tempo: 60, giri: 1 },
      aMeta: function (X) { return pilota(X, function (v) { return v.fase === "turno" && v.carta; }, 20000); } },
    ordine: { nome: "Parola d'ordine", tel: 5,
      aMeta: function (X) { return pilota(X, function (v) { return v.fase === "gioco" && v.passo === "indovina"; }, 15000, { soloIndizio: true }); } },
    patata: { nome: "La Patata Bollente", tel: 3, imp1: { tempo: 30 }, imp2: { tempo: 10 },
      aMeta: async function (X) { var v = await pilota(X, function (v) { return v.fase === "gioco"; }, 15000); await W.dorme(2500); return v && vm(X.C); } }
  };
  var TUTTI = ["Paky", "Giulia", "Luca", "Marco", "Bea"];

  // ---- l'inizio comune: la Compagnia, Paky lancia il gioco, si comincia, si gioca un pezzo ----
  async function inizio(gid, CMP, o) {
    o = o || {};
    var g = G[gid], tutti = TUTTI.slice(0, g.tel), dopo = tutti.slice(1);
    var opz = function (x) { return { x: x, emoji: "🍻", spiaD4: true, prima: primaDi() }; };
    var P = await P3.apriCompagnia("Paky", CMP, NOME_COMP, opz(0));
    if (!await W.aspetta(function () { return eHost(P) && hostDi(CMP) === "Paky" && (W.statoStanza(CMP) || {}).t === "sala"; }, 6000)) no("Paky non apre la Sala della Compagnia («" + T(P).slice(0, 80) + "»)");
    for (var i = 0; i < dopo.length; i++) {
      var n = dopo[i];
      await P3.apriCompagnia(n, CMP, NOME_COMP, opz(185 * (i + 1)));
      if (!await W.aspetta(function () { return nomi(CMP).indexOf(n) >= 0 && eOspite(W.finestra(n)); }, 8000)) no(n + " non entra nella Sala della Compagnia (" + nomi(CMP).join(", ") + ")");
    }
    tutti.forEach(function (x) { spiaHost(W.finestra(x)); });
    if (!await W.aspetta(function () { var vc = vm(CMP).vice || []; return vc.length === 2 && vc[0] === A.idInSala(CMP, "Giulia") && hostDi(CMP) === "Paky"; }, 4000)) no("vice della Sala: " + JSON.stringify(vm(CMP).vice));
    var Gw = W.finestra("Giulia");
    var sfondo = Gw.getComputedStyle(Gw.document.body).backgroundColor;
    var pagina0 = {}; dopo.forEach(function (x) { pagina0[x] = pezziPagina(W.finestra(x)); });
    P.__imp = g.imp1 ? Object.assign({}, g.imp1) : null;
    if (o.lenta) o.lenta();
    var C1 = await A.lanciaDallaSala("Paky", CMP, g.nome);
    if (!await W.aspetta(function () { return dopo.every(function (x) { return seduti(gid, vm(C1)).indexOf(x) >= 0; }); }, 12000)) no("gli amici non si siedono nel gioco di Paky (" + seduti(gid, vm(C1)).join(", ") + ")");
    era(dopo, "gioco");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia|Via ▶|Continua ▶/, ".sl-go, .piede button, button"); }, 6000)) no("Paky non ha «Comincia»");
    if (!await W.aspetta(function () { return inGioco(vm(C1)); }, 10000)) no("il gioco di Paky non comincia (fase " + vm(C1).fase + ")");
    var X = partita(gid, C1, "Paky", tutti); X.umani = tutti;
    var vMeta = await g.aMeta(X);
    if (!vMeta || !inGioco(vm(C1))) no("la partita di Paky non arriva a metà (fase " + vm(C1).fase + ")");
    return { g: g, tutti: tutti, dopo: dopo, P: P, Gw: Gw, C1: C1, X: X, sfondo: sfondo, pagina0: pagina0, meta: "fase " + vm(C1).fase };
  }

  // ---- 401-404, 406: la Sala passa a Giulia e il gioco di Paky finisce per tutti ----
  async function cambioHost(gid, CMP) {
    var I = await inizio(gid, CMP), g = I.g, dopo = I.dopo, Gw = I.Gw, C1 = I.C1, note = [];
    note.push(g.nome + " di Paky a metà (" + I.meta + ")");
    var fotoPrima = P3.passati(C1).length;
    var passa = sentinella(dopo, ERRORI), t0 = Date.now();
    spentoDavvero("Paky");
    if (!await W.aspetta(function () { return hostDi(CMP) === "Giulia" && vm(CMP).gen === 2 && inSalaHost(Gw) && dopo.slice(1).every(function (x) { return salaDi(W.finestra(x), CMP); }); }, 28000, 250))
      no("la Sala non passa a Giulia (host " + hostDi(CMP) + ", gen " + vm(CMP).gen + ", " + dopo.map(function (x) { return x + " «" + T(W.finestra(x)).slice(0, 40) + "»"; }).join(" · ") + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    era(dopo, "dopo");
    var visti = passa.stop(); if (visti.length) no("durante il passaggio: " + visti.join("; "));
    if (vm(CMP).gioco || vm(CMP).stanza) no("la Sala di Giulia ha ancora il gioco " + vm(CMP).gioco + " (" + vm(CMP).stanza + ")");
    if (nomi(CMP).sort().join(",") !== dopo.slice().sort().join(",")) no("nella Sala di Giulia ci sono " + nomi(CMP).join(", "));
    note.push("Paky spento: Sala a Giulia dopo " + dt + " s");
    // per 3 secondi niente del gioco vecchio sopra la Sala
    // (la musica dello studio si spegne da sola 1,5 s dopo che lo studio non c'è più: i timer si contano dopo)
    var resta = sentinella(dopo, ERRORI);
    await W.dorme(1500);
    dopo.forEach(function (x) { var w = W.finestra(x); if (w && w.__spiaT) { w.__spiaT.giri = {}; w.__spiaT.chi = {}; } });
    await W.dorme(3000);
    var vv = resta.stop(); if (vv.length) no("dopo il passaggio: " + vv.join("; "));
    var timer = [];
    dopo.forEach(function (x) {
      var w = W.finestra(x);
      if (x === "Giulia" ? !inSalaHost(w) : !salaDi(w, CMP)) no(x + " non è più nella Sala («" + T(w).slice(0, 60) + "»)");
      var f = salaAVista(w); if (f.length) no(x + ": sopra la Sala c'è qualcos'altro (" + f.join(", ") + ")");
      var nuovi = pezziPagina(w).filter(function (n) { return I.pagina0[x].indexOf(n) < 0 && !/(^| )(sg-pillol|conferma-sfondo|sl-velo)/.test(n.className); });
      if (nuovi.length) no(x + ": attaccati alla pagina restano pezzi del gioco vecchio (" + nuovi.map(function (n) { return n.tagName + (n.id ? "#" + n.id : "") + "." + n.className; }).join(", ") + ")");
      var bg = w.getComputedStyle(w.document.body).backgroundColor; if (bg !== I.sfondo) no(x + ": lo sfondo della Sala è " + bg + " (prima " + I.sfondo + ")");
      var gd = (w.__spiaT && w.__spiaT.giri["gioco>dopo"]) || 0;
      timer.push(x + " " + gd);
      if (gd > 8) no(x + ": i tempi del gioco vecchio girano ancora (" + gd + " in 3 s: " + Object.keys(w.__spiaT.chi).map(function (k) { return w.__spiaT.chi[k] + "× " + k; }).slice(0, 3).join(" | ") + ")");
    });
    var resti = ancoraInStanza(C1, ["Paky"]); if (resti.length) no("restano collegati alla stanza vecchia " + C1 + ": " + resti.join(", "));
    var nuove = P3.passati(C1).slice(fotoPrima).filter(function (x) { return x.da !== "Paky" && x.m && x.m.t === "vm"; });
    if (nuove.length) no("qualcuno ha ripubblicato la stanza vecchia (" + nuove.map(function (x) { return x.da; }).join(", ") + ")");
    note.push("3 s dopo tutti nella Sala, niente gioco vecchio (timer vecchi scattati: " + timer.join(", ") + ")");
    var R = await rilancia(gid, CMP, I, "Giulia", dopo);
    note.push(R);
    if (gid === "timeline") note.push(await pakyTorna(CMP, C1));
    await P3.unSoloHost(CMP, 1500);
    erroriVuoti();
    return note.join(" · ");
  }

  // Giulia (host della Sala) rilancia lo stesso gioco, si gioca fino alla fine, Rivincita col 3-2-1
  async function rilancia(gid, CMP, I, host, chi) {
    var g = I.g, H = W.finestra(host), altri = chi.filter(function (x) { return x !== host; });
    chi.forEach(function (x) { var w = W.finestra(x); w.__chiave = null; w.__salto = 0; });
    H.__imp = g.imp2 ? Object.assign({}, g.imp2) : null;
    var C2 = await A.lanciaDallaSala(host, CMP, g.nome);
    if (C2 === I.C1) no(host + " ha riaperto la stanza di Paky (" + I.C1 + ")");
    if (!await W.aspetta(function () { return altri.every(function (x) { return seduti(gid, vm(C2)).indexOf(x) >= 0; }); }, 12000)) no("gli amici non si siedono nel gioco di " + host + " (" + seduti(gid, vm(C2)).join(", ") + ")");
    if (seduti(gid, vm(C2)).indexOf("Paky") >= 0) no("nel gioco di " + host + " c'è ancora Paky");
    if (gid === "timeline" && /si riprende/i.test(A.pill(H))) no(host + " legge «si riprende»");
    if (!await W.aspetta(function () { return W.clicca(H, /Comincia|Via ▶|Continua ▶/, ".sl-go, .piede button, button"); }, 6000)) no(host + " non ha «Comincia»");
    if (!await W.aspetta(function () { return inGioco(vm(C2)); }, 10000)) no("il gioco di " + host + " non comincia (fase " + vm(C2).fase + ")");
    if (gid === "timeline" && (vm(C2).giocatori || []).some(function (p) { return p.punti > 0; })) no("la Linea del tempo di " + host + " parte coi punti della partita di Paky");
    var X = partita(gid, C2, host, chi); X.umani = chi;
    await finoAllaFine(X);
    await W.dorme(2500);   // (lo studio mostra ancora un attimo la classifica)
    var fineH = await W.aspetta(function () { var t = A.tastiFineDi(H); return t && /Rivincita/.test(t[0]) ? t : null; }, 40000);
    if (!fineH) no("alla fine " + host + " non ha «↻ Rivincita» (" + T(H).slice(-80) + ")");
    for (var j = 0; j < altri.length; j++) { var wj = W.finestra(altri[j]); if (!await W.aspetta(function () { var t = A.tastiFineDi(wj); return t && /Ci sto/.test(t[0]); }, 15000)) no("alla fine " + altri[j] + " non ha «👍 Ci sto!» (" + T(wj).slice(-80) + ")"); }
    var via = { visto: false }, tv = setInterval(function () { chi.forEach(function (x) { var w = W.finestra(x); if (w && w.document.querySelector(".sl-via")) via.visto = true; }); }, 40);
    altri.forEach(function (x) { W.clicca(W.finestra(x), /Ci sto/, ".fine-tasti button"); });
    await W.dorme(500);
    if (!W.clicca(H, /Rivincita/, ".fine-tasti button")) { clearInterval(tv); no(host + " non trova «↻ Rivincita»"); }
    var ok = await W.aspetta(function () { var v = vm(C2); return v.fase && v.fase !== "fine" && via.visto && !H.document.querySelector(".fine-tasti") && !H.document.querySelector(".saletta-schermo") ? v : null; }, 20000);
    clearInterval(tv);
    if (!ok) no("dopo «↻ Rivincita» non si riparte da soli col 3-2-1 (fase " + vm(C2).fase + ", 3-2-1 " + (via.visto ? "visto" : "mai visto") + ", " + host + " «" + T(H).slice(0, 60) + "»)");
    return host + " rilancia (" + C2 + ") fino alla fine («" + fineH.join(" | ") + "») e alla Rivincita col 3-2-1";
  }

  // 401, in fondo: Paky (che aveva la Linea del tempo salvata) si riaccende e poi ricarica la pagina: entra da amico nella
  // Sala di Giulia e non riapre né ripubblica la sua partita vecchia
  async function pakyTorna(S, C) {
    var t0 = Date.now(), P = W.finestra("Paky");
    var sv = JSON.parse(P.localStorage.getItem("sg-tl-host") || "null");
    var salvata = !!(sv && sv.codice === C);
    W.scongela("Paky"); W.riaccendi("Paky");
    if (!await W.aspetta(function () { return (vm(S).membri || []).some(function (m) { return m.nome === "Paky" && m.id !== "host"; }) && hostDi(S) === "Giulia"; }, 15000))
      no("Paky riacceso non entra da amico nella Sala di Giulia (membri " + nomi(S).join(", ") + "; «" + T(P).slice(0, 60) + "»)");
    await W.dorme(2000);
    var sue = P3.passati(C, t0).filter(function (x) { return x.da === "Paky" && x.m && x.m.t === "vm"; });
    if (sue.length && sue[sue.length - 1].ms - sue[0].ms > 300) no("Paky tornando ha ripubblicato la partita vecchia per " + (sue[sue.length - 1].ms - sue[0].ms) + " ms (" + sue.length + " foto su " + C + ")");
    if ((W.statoStanza(C) || {}).t) no("la stanza vecchia " + C + " è ancora aperta (foto " + W.statoStanza(C).t + ")");
    var dentro = ancoraInStanza(C); if (dentro.length) no("sono collegati alla stanza vecchia: " + dentro.join(", "));
    P = await W.ricarica("Paky");
    var t1 = Date.now();
    await W.dorme(4000);
    sue = P3.passati(C, t1).filter(function (x) { return x.da === "Paky" && x.m && x.m._s; });
    if (sue.length) no("Paky ricaricando ha riaperto la Linea del tempo vecchia (" + sue.length + " foto su " + C + ")");
    if (/si riprende/i.test(A.pill(P)) || /si riprende/i.test(W.testo(P))) no("Paky legge «si riprende»");
    if (hostDi(S) !== "Giulia") no("dopo la ricarica di Paky la Sala la tiene " + hostDi(S));
    return "Paky torna da amico" + (salvata ? " (aveva la partita salvata)" : "") + (sue.length ? "" : ", la partita vecchia non riparte nemmeno ricaricando") + " («" + T(P).slice(0, 40) + "»)";
  }

  // ---- 405: Parola d'ordine, la partita resta (host di riserva) ----
  async function ordineResta(CMP, o) {
    o = o || {};
    var lenta = null;
    // (405b, c) il telefono di Giulia entra nella partita per ultimo: il suo "join" parte 3 secondi dopo
    var lentaFn = o.viceLuca ? function () {
      var Gw = W.finestra("Giulia"), ent = Gw.SGNet.entra;
      lenta = { prima: ent };
      Gw.SGNet.entra = function (cod, cb) {
        if (cb && cb.onAperto && String(cod).toUpperCase() !== CMP) { var oa = cb.onAperto; cb.onAperto = function () { var a = arguments, t = this; setTimeout(function () { oa.apply(t, a); }, 3000); }; }
        return ent.apply(this, arguments);
      };
    } : null;
    var I = await inizio("ordine", CMP, { lenta: lentaFn }), dopo = I.dopo, Gw = I.Gw, C = I.C1, X = I.X, note = [];
    if (lenta) Gw.SGNet.entra = lenta.prima;
    var v0 = vm(C), vici = (v0.vici || []).map(function (id) { return X.nomeDi[id]; });
    var atteso = o.viceLuca ? "Luca" : "Giulia";
    if (vici[0] !== atteso) no("il primo vice del gioco è " + vici[0] + " invece di " + atteso + " (vici " + vici.join(", ") + ")");
    var VG = vici[0], idVG = X.id[VG];
    note.push("Parola d'ordine di Paky (" + I.meta + ", passo " + v0.passo + "), vice del gioco " + vici.join(" e ") + ", vice della Sala Giulia");
    if (o.pausa) {
      nascondi(I.P, true);
      if (!await W.aspetta(function () { return vm(CMP).pausa; }, 3000)) no("nella foto della Sala non c'è la pausa");
    }
    var nGen = v0.gen;
    var passa = sentinella(dopo, ERRORI), t0 = Date.now();
    spentoDavvero("Paky");
    // il vice del gioco porta avanti la partita dopo 6 s; nessuno esce dal gioco
    if (!await W.aspetta(function () { var v = vm(C); return v.hostId === idVG && v.gen > nGen; }, 15000, 200)) no("il vice del gioco (" + VG + ") non prende la partita (hostId " + vm(C).hostId + ", gen " + vm(C).gen + ")");
    var dtG = ((Date.now() - t0) / 1000).toFixed(1);
    if (vm(C).fase !== "gioco") no("dopo il subentro del gioco la partita non è in corso (fase " + vm(C).fase + ")");
    // (chi NON è nella partita: ha davanti la Sala o una saletta, o non ha più i pezzi di Parola d'ordine)
    var nelGioco = function () { return dopo.filter(function (x) { var w = W.finestra(x); return !!w.document.querySelector(".saletta-schermo") || !w.document.querySelector("[class^='or-'], [class*=' or-']"); }); };
    var fuori = nelGioco(); if (fuori.length) no("dopo il subentro del gioco non sono nella partita: " + fuori.map(function (x) { return x + " «" + T(W.finestra(x)).slice(0, 40) + "»"; }).join(" · "));
    note.push("il gioco passa a " + VG + " dopo " + dtG + " s");
    // la Sala passa a Giulia (20 s, 90 s con la pausa) e il gioco resta
    var attesaSala = o.pausa ? 110000 : 32000;
    if (o.pausa) {
      await W.dorme(60000);
      // (la foto trattenuta adesso è il testamento di Paky: la Sala è passata solo se c'è una foto della Sala di gen 2)
      if (vm(CMP).t === "sala" && (+vm(CMP).gen || 1) >= 2) no("con la pausa la Sala è passata prima di 60 s (a " + hostDi(CMP) + ")");
      if (eHost(Gw) || eHost(W.finestra("Luca"))) no("con la pausa un vice ha preso la Sala prima di 60 s");
      // intanto si gioca
      await pilota(X, function () { return false; }, 2000, { soloIndizio: true });
    }
    if (!await W.aspetta(function () { return hostDi(CMP) === "Giulia" && vm(CMP).gen === 2; }, attesaSala, 250)) no("la Sala non passa a Giulia (host " + hostDi(CMP) + ", gen " + vm(CMP).gen + ")");
    var dtS = ((Date.now() - t0) / 1000).toFixed(1);
    await W.dorme(1500);
    var vs = vm(CMP);
    if (vs.gioco !== "ordine" || vs.stanza !== C) no("la Sala di Giulia ha chiuso il gioco (gioco " + vs.gioco + ", stanza " + vs.stanza + ")");
    if (vm(C).fase !== "gioco" || vm(C).hostId !== idVG) no("con la Sala nuova la partita non va più avanti (fase " + vm(C).fase + ", hostId " + vm(C).hostId + ")");
    fuori = nelGioco(); if (fuori.length) no("con la Sala nuova non sono più nella partita: " + fuori.map(function (x) { return x + " «" + T(W.finestra(x)).slice(0, 40) + "»"; }).join(" · "));
    if (inSalaHost(Gw)) no("Giulia è nella Sala invece che nella partita");
    var visti = passa.stop(); if (visti.length) no("durante i passaggi: " + visti.join("; "));
    note.push("Sala a Giulia dopo " + dtS + " s" + (o.pausa ? " (pausa)" : "") + " col gioco ancora aperto (" + vs.stanza + ", fase " + vs.fase + "), tutti ancora nella partita");
    // si gioca fino alla fine con l'host nuovo del gioco
    var punti0 = JSON.stringify(((vs.torneo || {}).punti) || {});
    await finoAllaFine(X, 120000);
    await W.dorme(2500);
    var tasti = {};
    for (var i = 0; i < dopo.length; i++) {
      var w = W.finestra(dopo[i]);
      var t = await W.aspetta(function () { return A.tastiFineDi(w); }, 15000);
      if (!t) no("alla fine " + dopo[i] + " non ha i tasti di fine («" + T(w).slice(-80) + "»)");
      tasti[dopo[i]] = t.join(" | ");
    }
    if (!/Rivincita/.test(tasti[VG])) no("alla fine " + VG + " (host del gioco) non ha «↻ Rivincita» (" + tasti[VG] + ")");
    note.push("fine: " + dopo.map(function (x) { return x + " «" + tasti[x] + "»"; }).join(", "));
    await W.dorme(1500);
    var punti1 = JSON.stringify(((vm(CMP).torneo || {}).punti) || {});
    note.push("Classifica della serata " + (punti1 !== punti0 ? "aggiornata (" + punti1 + ")" : "NON aggiornata (" + punti1 + ")"));
    if (punti1 === punti0) no("la Classifica della serata nella Sala di Giulia non conta la partita finita dall'host del gioco " + VG + " (" + punti1 + ")");
    // tutti nella Sala di Giulia: lei tocca «🏠 Torna in Sala», gli altri ci arrivano
    var tSala = Date.now();
    // (se nel gioco Giulia ha i tasti dell'host della Sala tocca «🎮 Cambia gioco» e va in «Quale gioco?»: con ‹ torna nella Sala)
    var tocco = W.clicca(Gw, /Torna in Sala/, ".fine-tasti button") ? "Torna in Sala" : W.clicca(Gw, /Cambia gioco/, ".fine-tasti button") ? "Cambia gioco" : null;
    if (!tocco) no("Giulia non ha «🏠 Torna in Sala» né «🎮 Cambia gioco» (" + tasti.Giulia + ")");
    if (tocco === "Cambia gioco") {
      if (!await W.aspetta(function () { return /Quale gioco/.test(T(Gw)) && !vm(CMP).gioco; }, 8000)) no("con «Cambia gioco» Giulia non va in «Quale gioco?» (gioco " + vm(CMP).gioco + ", «" + T(Gw).slice(0, 60) + "»)");
      await W.dorme(500);
      W.clicca(Gw, /^‹$/);
    }
    if (!await W.aspetta(function () { return inSalaHost(Gw) && !vm(CMP).gioco; }, 8000)) no("Giulia non torna nella sua Sala (gioco " + vm(CMP).gioco + ", «" + T(Gw).slice(0, 60) + "»)");
    var daSoli = await W.aspetta(function () { return dopo.slice(1).every(function (x) { return salaDi(W.finestra(x), CMP); }); }, 8000);
    if (!daSoli) {
      var restati = dopo.slice(1).filter(function (x) { return !salaDi(W.finestra(x), CMP); });
      no("Giulia è tornata nella Sala ma " + restati.join(", ") + " non ci arrivano da soli (" + restati.map(function (x) { return x + " «" + T(W.finestra(x)).slice(0, 50) + "»"; }).join(" · ") + ")");
    }
    note.push("Giulia «" + tocco + "» → tutti nella sua Sala in " + ((Date.now() - tSala) / 1000).toFixed(1) + " s");
    era(dopo, "dopo");
    await W.dorme(2000);
    var resti = ancoraInStanza(C, ["Paky"]); if (resti.length) no("restano collegati alla stanza del gioco " + C + ": " + resti.join(", "));
    note.push(await rilancia("ordine", CMP, I, "Giulia", dopo));
    await P3.unSoloHost(CMP, 1500);
    erroriVuoti();
    return note.join(" · ");
  }
  function nascondi(w, si) {
    Object.defineProperty(w.document, "hidden", { configurable: true, get: function () { return !!si; } });
    Object.defineProperty(w.document, "visibilityState", { configurable: true, get: function () { return si ? "hidden" : "visible"; } });
    w.document.dispatchEvent(new w.Event("visibilitychange"));
  }

  aggiungi(401, { nome: "Linea del tempo nella Compagnia: Paky sparisce a metà, la Sala a Giulia, lei la rifà fino alla Rivincita; Paky torna e ricarica: niente ripresa della partita vecchia", fai: function () { return cambioHost("timeline", "GDTLNQ"); } });
  aggiungi(402, { nome: "Nomi, Cose e Città nella Compagnia: Paky sparisce mentre si scrive, la Sala a Giulia, si rifà fino alla Rivincita col 3-2-1", fai: function () { return cambioHost("nomicose", "GDNCCQ"); } });
  aggiungi(403, { nome: "La Balla Colossale nella Compagnia (in 4): Paky sparisce durante il voto, la Sala a Giulia, si rifà in 3 fino alla Rivincita col 3-2-1", fai: function () { return cambioHost("balla", "GDBLLQ"); } });
  aggiungi(404, { nome: "Taboo nella Compagnia (in 5): Paky sparisce a turno in corso, la Sala a Giulia, si rifà in 4 fino alla Rivincita col 3-2-1", fai: function () { return cambioHost("taboo", "GDTBBQ"); } });
  aggiungi(405, { nome: "Parola d'ordine nella Compagnia (in 5): Paky sparisce, Giulia porta avanti il gioco e tiene la Sala senza chiuderlo; a fine partita tutti nella sua Sala, Rivincita", fai: function () { return ordineResta("GDRDNQ"); } });
  aggiungi("405b", { nome: "Parola d'ordine: il gioco lo porta avanti Luca, la Sala la prende Giulia (due telefoni diversi); a fine partita tutti nella Sala di Giulia, Rivincita", fai: function () { return ordineResta("GDRDBQ", { viceLuca: true }); } });
  aggiungi("405c", { nome: "Parola d'ordine con la pausa: Paky era uscito un attimo dall'app e poi sparisce: il gioco passa a Luca dopo 6 s, la Sala a Giulia dopo 90 s senza chiuderlo", fai: function () { return ordineResta("GDRDCQ", { viceLuca: true, pausa: true }); } });
  aggiungi(406, { nome: "La Patata Bollente nella Compagnia: Paky sparisce a bomba accesa, la Sala a Giulia, si rifà fino alla Rivincita col 3-2-1", fai: function () { return cambioHost("patata", "GDPTTQ"); } });

  // tutte in fila: await COPIONE.gruppoD3()
  COPIONE.gruppoD3 = async function () {
    var r = [];
    for (var k of [401, 402, 403, 404, 405, "405b", "405c", 406]) r.push(await COPIONE.prova(k));
    return r;
  };
  if (P3) P3.giochiD = { G: G, MOSSA: MOSSA, pilota: pilota, partita: partita, inizio: inizio, cambioHost: cambioHost, ordineResta: ordineResta, rilancia: rilancia };
})();
