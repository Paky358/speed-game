/* =========================================================
   PEZZO DEL CUORE — 📦 I GIOCHI SI SCARICANO QUANDO SERVONO (#31, parte 2, 4 nov 2026)
   L'app si apre col cuore e con l'ELENCO DEI GIOCHI (js/elenco-giochi.js): per ogni gioco la sua
   SCHEDA (nome, icona, giocatori, modi, posti online… tutto quello che non è codice) e il PEZZO da
   scaricare (i suoi file, nell'ordine). La home, «Come giocate?», la Sala e la saletta si disegnano
   dalla scheda; il codice del gioco arriva al primo tocco e poi resta sul telefono (il service worker
   tiene i file con l'impronta). Quando il gioco arriva, la scheda prende tutto il resto (SG.registra
   del gioco: si copia nella STESSA scheda, così chi l'aveva già in mano vede il gioco intero).
   Chi ha bisogno del codice del gioco (avviaPartita, le impostazioni, «Come si gioca», la Sala che
   prepara le regole…) chiede cuore.aspettaGioco(g, fn): se il gioco c'è torna false e si va avanti
   come sempre; se no torna true, mostra «⏳ Arriva il gioco…» e chiama fn quando è arrivato.
   Versione online: window.SG_PEZZI_URL = { pezzo: "giochi/<pezzo>.<impronta>.js" } (lo scrive
   costruisci-versione-online.sh); senza, si caricano i file uno per uno (si prova la cartella).
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var el = cuore.el, schermata = cuore.schermata, mostra = cuore.mostra;

  var PEZZI = {};     // nome → { nome, file: [...], dopo: [pezzi che servono prima], p: la promessa mentre arriva, pronto }
  var SCHEDE = {};    // id del gioco → { g: la scheda (lo stesso oggetto che sta nella lista dei giochi), pezzo, pronto }
  var FATTI = {};     // i file già arrivati ed eseguiti (un file non si esegue mai due volte)
  var VECCHIE = [];   // (per le prove) le schede che non sono uguali al gioco vero: l'elenco va rifatto

  function lista(x) { return Array.isArray(x) ? x.slice() : String(x || "").split(/\s+/).filter(Boolean); }

  // ---- l'elenco (js/elenco-giochi.js) ----
  // pezzo("asta", "data/asta-carte.js … js/games/asta.js", "studio"): i file del pezzo e i pezzi che arrivano prima
  function pezzo(nome, file, dopo) { PEZZI[nome] = { nome: nome, file: lista(file), dopo: lista(dopo), p: null, pronto: false }; }
  // scheda("tris", "tris", { nome, icona, … }): la scheda del gioco, nella lista dei giochi al suo posto di sempre
  function scheda(id, nomePezzo, dati) {
    if (SCHEDE[id]) return;
    var g = {}; Object.keys(dati || {}).forEach(function (k) { g[k] = dati[k]; }); g.id = id;
    SCHEDE[id] = { g: g, pezzo: nomePezzo, pronto: false };
    SG.registra(g);
  }
  // il gioco vero si registra (SG.registra dal suo file): se ha la scheda si copia dentro la scheda (true = fatto qui)
  function unisciScheda(gioco) {
    var S = gioco && SCHEDE[gioco.id];
    if (!S || S.g === gioco) return false;
    var g = S.g;
    // (per le prove) la scheda dell'elenco deve dire le stesse cose del gioco: se no l'elenco va rifatto
    Object.keys(g).forEach(function (k) {
      if (k === "id" || !Object.prototype.hasOwnProperty.call(gioco, k)) return;
      var a, b; try { a = JSON.stringify(g[k]); b = JSON.stringify(gioco[k]); } catch (e) { return; }
      if (a !== b) { VECCHIE.push(gioco.id + "." + k); try { console.warn("📦 L'elenco dei giochi è vecchio (" + gioco.id + "." + k + "): rifallo con .agents/skills/nuovo-gioco/elenco-giochi.js"); } catch (e) {} }
    });
    Object.keys(g).forEach(function (k) {
      if (k === "id" || Object.prototype.hasOwnProperty.call(gioco, k)) return;
      VECCHIE.push(gioco.id + "." + k + " (non c'è più)"); delete g[k];
    });
    Object.keys(gioco).forEach(function (k) { g[k] = gioco[k]; });
    S.pronto = true;
    return true;
  }

  // ---- lo scaricamento ----
  function giaQui(src) {
    if (FATTI[src]) return true;
    var l = document.getElementsByTagName("script");   // (in prova un file può essere già in index.html)
    for (var i = 0; i < l.length; i++) if (l[i].getAttribute("src") === src && !l[i]._sgPezzo) return true;
    return false;
  }
  var IN_VOLO = {};   // i file chiesti e non ancora arrivati (un file chiesto due volte si aspetta, non si richiede)
  function caricaFile(src) {
    if (IN_VOLO[src]) return IN_VOLO[src];
    var p = IN_VOLO[src] = new Promise(function (ok, no) {
      var s = document.createElement("script");
      s._sgPezzo = true; s.src = src; s.async = false;
      s.onload = function () { FATTI[src] = 1; ok(); };
      s.onerror = function () { if (s.parentNode) s.parentNode.removeChild(s); var e = new Error("non arriva: " + src); e.src = src; no(e); };
      (document.head || document.documentElement).appendChild(s);
    });
    p.then(function () { delete IN_VOLO[src]; }, function () { delete IN_VOLO[src]; });
    return p;
  }
  function urlOnline(nome) { var U = window.SG_PEZZI_URL; return U && Object.prototype.hasOwnProperty.call(U, nome) ? U[nome] : null; }
  function caricaPezzo(nome) {
    var P = PEZZI[nome];
    if (!P) return Promise.reject(new Error("pezzo che non c'è: " + nome));
    if (P.pronto) return Promise.resolve();
    if (P.p) return P.p;
    P.p = P.dopo.reduce(function (pr, d) { return pr.then(function () { return caricaPezzo(d); }); }, Promise.resolve()).then(function () {
      var u = urlOnline(nome);
      if (u) return giaQui(u) ? null : caricaFile(u);
      // (nella cartella: i file del pezzo si chiedono tutti insieme e si eseguono nell'ordine, async = false)
      return Promise.all(P.file.filter(function (f) { return !giaQui(f); }).map(caricaFile));
    }).then(function () { P.pronto = true; P.p = null; }, function (e) { P.p = null; throw e; });
    return P.p;
  }
  // il gioco c'è? (un gioco senza scheda c'è sempre: è nel file principale)
  function giocoPronto(g) { var S = g && SCHEDE[g.id]; return !S || (S.pronto && !!(PEZZI[S.pezzo] && PEZZI[S.pezzo].pronto)); }
  function scaricaGioco(g) {
    var S = g && SCHEDE[g.id];
    if (!S || giocoPronto(g)) return Promise.resolve(g);
    return caricaPezzo(S.pezzo).then(function () {
      if (!S.pronto) { var e = new Error("il gioco «" + g.nome + "» non si è registrato"); e.rotto = true; throw e; }   // (il file è arrivato ma ha un errore)
      return g;
    });
  }
  // comincia a scaricarlo senza far vedere niente (il tocco sulla tessera, la Sala che ha scelto un gioco, il voto…)
  function precarica(x) {
    var g = typeof x === "string" ? cuore.giocoDa(x) : x;
    if (g && !giocoPronto(g)) scaricaGioco(g).catch(function () {});   // (se non arriva ci si riprova quando serve davvero: mai ricaricare la pagina da qui)
  }

  // ---- una versione nuova pubblicata mentre l'app era aperta: il pezzo con l'impronta vecchia non c'è più (404).
  //      Si ricarica la pagina una volta (la Sala, la stanza e la partita si riprendono da sole); mai due volte in un minuto ----
  var RIC_K = "sg-ricarica-pezzi", RICARICATA = false;
  function ricaricaSeNuova(e) {
    if (RICARICATA || !e || !e.src || !window.SG_PEZZI_URL || !window.fetch) return Promise.resolve(false);
    return fetch(e.src, { method: "HEAD", cache: "no-store" }).then(function (r) {
      if (r.status !== 404 || RICARICATA) return false;
      var prima = null; try { prima = JSON.parse(sessionStorage.getItem(RIC_K) || "null"); } catch (x) {}
      if (prima && (prima.src === e.src || Date.now() - prima.t < 60000)) return false;   // (lo stesso file mancava già prima di ricaricare: non serve)
      try { sessionStorage.setItem(RIC_K, JSON.stringify({ t: Date.now(), src: e.src })); if (!sessionStorage.getItem(RIC_K)) return false; } catch (x) { return false; }
      RICARICATA = true;
      if (cuore.pillola) cuore.pillola("versione", "🔄 C'è una versione nuova dell'app: la ricarico…", "blu", 3000);
      setTimeout(function () { location.reload(); }, 900);
      return true;
    }, function () { return false; });
  }

  // ---- aspettare il gioco: false = c'è già (si va avanti subito, come sempre); true = fn() quando arriva.
  //      opz.viva() = vale ancora? (es. la partita è ancora questa). Senza: vale finché non c'è un'altra schermata al posto
  //      di quella di prima (o di «Arriva il gioco»). Un'attesa nuova chiude sempre quella di prima (si aspetta una cosa sola)
  //      opz.indietro = il tasto ‹ della schermata d'attesa (di partenza la home) ----
  var ATTESA = null;
  function aspettaGioco(g, fn, opz) {
    if (!g || giocoPronto(g)) return false;
    opz = opz || {};
    if (ATTESA) ATTESA.chiudi();
    var app = document.getElementById("app"), prima = app ? app.firstChild : null, sch = null, finito = false, tMostra = null, ascolto = false;
    var questa = ATTESA = { chiudi: chiudi };
    function vale() {
      if (finito) return false;
      if (opz.viva) return !!opz.viva();
      return !!(app && app.firstChild === (sch || prima));
    }
    function chiudi() { finito = true; clearTimeout(tMostra); if (ascolto) window.removeEventListener("online", tornaLaRete); if (ATTESA === questa) ATTESA = null; }
    function indietro() { chiudi(); (opz.indietro || cuore.tornaHome)(); }
    function attesa(errore) {
      var s = schermata({ icona: g.icona || "🎲", titolo: g.nome, sotto: errore ? "Il gioco non arriva" : "Arriva il gioco…", indietro: indietro });
      s.classList.add("arriva-gioco");
      var c = s._contenuto;
      c.appendChild(el("div", { class: "ag-ico" + (errore ? " ferma" : ""), "aria-hidden": "true", text: errore ? "📶" : (g.icona || "🎲") }));
      if (errore === "rotto") c.appendChild(el("p", { class: "ag-tx", text: "Il gioco è arrivato ma qualcosa non va. Riprova tra poco: se continua, dillo a chi fa l'app." }));
      else if (errore) c.appendChild(el("p", { class: "ag-tx", text: "Controlla la rete: riprovo da solo appena torna." }));
      else {
        c.appendChild(el("p", { class: "ag-tx", text: "⏳ Un attimo: la prima volta il gioco si scarica, poi resta sul telefono." }));
        c.appendChild(el("div", { class: "ag-barra", "aria-hidden": "true" }, [ el("i") ]));
      }
      if (errore) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: function () { riprova(true); } }));
      s._errore = errore || null; sch = s; mostra(s);
    }
    // (il tocco su «↻ Riprova» e la rete che torna: di nuovo «Arriva il gioco…»; i tentativi da soli ogni 8 s non cambiano la schermata)
    function riprova(vista) {
      if (!vale()) return chiudi();
      clearTimeout(tMostra);
      if (vista !== false && sch && aVista() && sch.querySelector(".ag-ico.ferma")) attesa(null);
      vai();
    }
    function tornaLaRete() { riprova(true); }
    // (si può disegnare qui? la schermata di prima, o quella d'attesa, è ancora a vista)
    function aVista() { return !!(app && (sch ? app.firstChild === sch : app.firstChild === prima)); }
    function vai() {
      var appeso = null;
      Promise.race([scaricaGioco(g), new Promise(function (ok, no) { appeso = setTimeout(function () { no(new Error("la rete è lenta")); }, 40000); })]).then(function (x) { clearTimeout(appeso); return x; }, function (e) { clearTimeout(appeso); throw e; }).then(function () {
        if (!vale()) return chiudi();
        chiudi(); fn();
      }, function (e) {
        if (!vale()) return chiudi();
        ricaricaSeNuova(e).then(function (si) {
          if (si || !vale()) return;
          var tipo = e && e.rotto ? "rotto" : "rete";
          if (aVista() && !(sch && sch._errore === tipo)) attesa(tipo);   // (già lì: non si ridisegna; mai sopra un'altra schermata)
          if (!ascolto && !(e && e.rotto)) { ascolto = true; window.addEventListener("online", tornaLaRete); }
          clearTimeout(tMostra); if (!(e && e.rotto)) tMostra = setTimeout(function () { if (vale()) riprova(false); }, 8000);   // (e ogni 8 s da solo)
        });
      });
    }
    tMostra = setTimeout(function () { if (vale() && !sch && aVista()) attesa(null); }, opz.subito ? 0 : 120);   // (dalla copia del telefono arriva subito: niente lampo)
    vai();
    return true;
  }

  // ---- (per le prove) tutti i giochi, uno dopo l'altro: SG.scaricaTutti().then(…) ----
  function scaricaTutti() {
    return Object.keys(SCHEDE).reduce(function (pr, id) { return pr.then(function () { return scaricaGioco(SCHEDE[id].g); }); }, Promise.resolve())
      .then(function () { return VECCHIE.slice(); });
  }

  SG.pezzo = pezzo; SG.scheda = scheda; SG.scaricaGioco = function (id) { return scaricaGioco(cuore.giocoDa(id)); }; SG.scaricaTutti = scaricaTutti;
  SG.giocoPronto = function (id) { return giocoPronto(cuore.giocoDa(id)); };

  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.aspettaGioco = aspettaGioco; cuore.giocoPronto = giocoPronto; cuore.precarica = precarica; cuore.scaricaGioco = scaricaGioco;
  cuore.unisciScheda = unisciScheda; cuore.schedeVecchie = VECCHIE;
})();
