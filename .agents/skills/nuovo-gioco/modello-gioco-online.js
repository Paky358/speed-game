/* =========================================================
   MODELLO DI GIOCO ONLINE per SPeeD GAME — da COPIARE per ogni gioco nuovo.
   È un gioco vero e funzionante ("Il più veloce": quando il tasto diventa
   verde, chi lo tocca per primo prende un punto; chi tocca troppo presto
   ne perde uno). Ha già fatte bene tutte le cose facili da sbagliare:
   - saletta d'attesa comune (t.lobby) con avatar e posti che mancano;
   - chi entra senza profilo scrive il nome, chi ha il profilo entra da solo;
   - gli id dei giocatori nella "foto" (vm): servono a chi entra per sapere che è dentro;
   - segreti a un telefono solo con inviaVeloce + "to" (mai con invia);
   - "⚙️ Regole" in saletta (t.onRegole);
   - chi esce: dalla saletta si toglie senza rimescolare, a partita iniziata resta "via";
   - chi ricarica la pagina o riaccende il telefono rientra col suo posto (stesso id: il "join" rimanda la foto);
   - chi si sta ricollegando ha 📶 accanto al nome (onForse / onTornato);
   - nessuna attesa resta ferma: tra un giro e l'altro l'host ha "Prossimo giro ▶ 4" che va avanti
     da solo (t.contoAvanti), gli altri leggono "Si va avanti tra 4…";
   - la rete che salta NON chiude la partita: ci pensa il core ("📶 Mi ricollego…");
     onErrore arriva solo se il PRIMO collegamento non riesce, e allora si offre "Riprova";
   - "Esci" a partita iniziata chiede conferma con la finestra dell'app (t.conferma, mai window.confirm);
   - fine partita: t.risultato coi NOMI dei giocatori, medaglie a pari merito, le faccine (t.faccine),
     poi "Nuova partita" nella STESSA saletta;
   - chi arriva a partita cominciata la guarda (con le faccine) ed entra alla prossima;
   - schermo intero senza scorrere e senza titolo, aggiornato a pezzi (niente lampeggio);
   - tocchi con pointerdown (su iPhone il click a volte non arriva).
   Come usarlo: copialo in js/games/<id>.js, cambia ID/nome/testi e riscrivi
   solo le parti segnate con "QUI". Il resto lascialo com'è.
   ========================================================= */
(function () {
  "use strict";

  var ID = "modello";            // QUI: l'id del gioco (uguale in GIOCHI_ONLINE e CAT_GIOCO di core.js)
  var MIN = 2, MAX = 10;         // QUI: quanti giocatori
  var PAUSA = 4;                 // QUI: i secondi tra un giro e l'altro (l'host può toccare prima)

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }   // 1.000
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, giri: imp.giri || 5, giro: 0, partita: 0, stato: "attesa", vincitore: null, classifica: null, scadenza: 0, to: null,
      players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0 }] };
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }

    // "⚙️ Regole" nella saletta: l'host cambia le impostazioni quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.giri = im.giri || 5; bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      // la stanza non si è proprio aperta (il primo collegamento non è riuscito in 15 secondi): si riprova da capo.
      // Dopo che la stanza è aperta onErrore non arriva più: la rete che salta la gestisce il core ("📶 Mi ricollego…")
      onErrore: function () {
        if (H.pronta) return;
        ferma(); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      // un amico è sparito senza salutare (schermo bloccato, rete persa): 📶 accanto al nome finché non torna
      onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
      onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
      // uscito apposta, oppure sparito da più di 20 secondi
      onAddio: function (id) {
        var p = pById(id); if (!p) return;
        p.forse = false;
        // nella saletta si toglie e basta (squadre e posti degli altri restano come sono)
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;                                   // a partita iniziata resta in classifica, ma non gioca più
        if (H.fase === "gioco" && presenti().length < MIN) return fine();
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p = pById(id);
          if (!p && H.fase === "lobby" && H.players.length < MAX)
            H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino), punti: 0 });
          // chi rientra (pagina ricaricata, telefono riacceso) ha lo STESSO id: ritrova il suo posto e i suoi punti
          if (p) { p.forse = false; if (p.via && H.fase === "gioco") p.via = false; }
          bd();   // sempre: rimanda la foto a chi è entrato o rientrato (QUI: e i suoi segreti, con privato)
          return;
        }
        if (H.fase !== "gioco" || !pById(id)) return;   // chi guarda soltanto non fa mosse
        if (m.t === "tocco") tocco(id);               // QUI: le mosse degli ospiti
      }
    });
    if (!rete) return senzaRete(t);
    // la "foto" per tutti: SEMPRE con gli id e con "fase" (il core la legge per riaprire la stanza); MAI segreti
    function vm() {
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, giri: H.giri, giro: H.giro, partita: H.partita, stato: H.stato, vincitore: H.vincitore, classifica: H.classifica,
        resta: H.stato === "preso" ? Math.max(1, Math.ceil((H.scadenza - Date.now()) / 1000)) : 0,   // i secondi che mancano (non l'ora: gli orologi dei telefoni sono diversi)
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, forse: !!p.forse, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }) };
    }
    // un messaggio per un telefono solo (carta, ruolo, avviso): inviaVeloce con "to", così non resta in stanza
    function privato(id, m) {
      if (id === "host") { avviso(m.testo); return; }
      m.to = id; rete.inviaVeloce(m);
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); }

    // ----- la partita -----  QUI: la logica del tuo gioco
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.fase = "gioco"; H.giro = 0; H.partita++; H.classifica = null;
      H.players.forEach(function (p) { p.punti = 0; });
      prossimoGiro();
    }
    function prossimoGiro() {
      ferma();
      H.giro++;
      if (H.giro > H.giri) return fine();
      H.stato = "attesa"; H.vincitore = null; bd();
      H.to = setTimeout(function () { H.stato = "via"; bd(); H.to = setTimeout(nessuno, 4000); }, 1500 + Math.random() * 2500);
    }
    function tocco(id) {
      var p = pById(id); if (!p || p.via) return;
      if (H.stato === "attesa") { p.punti -= 1; privato(id, { t: "priv", testo: "Troppo presto! −1" }); bd(); return; }
      if (H.stato !== "via") return;
      p.punti += 1; pausa(p.nome);
    }
    function nessuno() { pausa(null); }
    // fine del giro: si vede chi ha preso il punto. Si va avanti col tasto dell'host o da soli dopo PAUSA secondi
    // (il conto lo fa t.contoAvanti sul tasto dell'host: vedi aggiorna)
    function pausa(vincitore) { ferma(); H.stato = "preso"; H.vincitore = vincitore; H.scadenza = Date.now() + PAUSA * 1000; bd(); }
    function avanti() { if (H.fase === "gioco" && H.stato === "preso") prossimoGiro(); }   // (una volta sola: tocco e conto insieme non saltano un giro)
    function fine() {
      ferma();
      var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      H.classifica = ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
      H.fase = "fine"; bd();
      // torneo online e XP: i NOMI dei giocatori col loro posto (pari merito = stesso posto). Nei giochi a squadre: chi vince al posto 1, gli altri dopo.
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, tutti tornano nella saletta (MAI chiudere e riaprire la stanza)
    function nuova() { ferma(); H.fase = "lobby"; H.stato = "attesa"; H.classifica = null; H.players = presenti(); H.players.forEach(function (p) { p.punti = 0; }); bd(); }

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova, onAvanti: avanti,
      onTocco: function () { tocco("host"); },
      onEsci: function () {
        function via() { ferma(); rete.chiudi(); t.esci(); }
        // (dalla saletta il core ha già chiesto "Chiudere la stanza per tutti?")
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);   // un tocco sbagliato non chiude il gioco a tutti
        via();
      } };
    bd();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null,
      onTocco: function () { if (S.rete) S.rete.invia({ t: "tocco" }); },   // QUI: le tue mosse
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (S.vm && S.vm.fase === "gioco") return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo (o già entrato prima) si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🎲", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });   // (il core ci aggiunge il 🎲 e l'avatar)
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        // il "join" lo ripete il collegamento finché il mio id non compare nella foto dell'host
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
          else if (m.t === "priv") avviso(m.testo);      // QUI: i tuoi messaggi privati
        },
        // la stanza è chiusa: { voluto: true } = l'host l'ha chiusa apposta; { sparito: true } = l'host non è tornato
        // in 2 minuti (lì il core mostra già "La stanza è chiusa"; nella Sala si torna alla Sala da soli)
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        // SOLO se il primo collegamento non è riuscito (15 secondi di tentativi): non c'è nessuna partita da chiudere, si riprova.
        // Dopo, la rete che salta non arriva qui: il core mostra "📶 Mi ricollego…" e il collegamento riprova da solo
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "🎲", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti): saletta, gioco, fine
  // =========================================================
  var UI = null;   // la schermata di gioco si costruisce UNA volta e poi si aggiorna a pezzi
  function disegna(t, vm, cb) {
    if (vm.fase === "lobby") { UI = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") { UI = null; return finale(t, vm, cb); }
    if (!UI || UI.t !== t || !document.body.contains(UI.s)) UI = creaSchermo(t, cb);
    aggiorna(UI, vm, cb);
  }
  function lobby(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),   // solo i posti che mancano per cominciare
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota", text: "Si gioca a " + vm.giri + " giri." })],   // QUI: le info del gioco (o scelte come le squadre)
      spettatore: !cb.sonoHost && !dentro && vm.players.length >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function creaSchermo(t, cb) {
    stile();
    var s = t.schermata({}); s.classList.add("mo-piena");   // schermo intero: niente titolo, niente scorrimento
    var ui = { t: t, s: s, giro: t.el("div", { class: "mo-giro" }), tasto: t.el("button", { class: "mo-tasto" }), avviso: t.el("div", { class: "mo-avviso" }),
      avanti: t.el("div", { class: "mo-avanti" }), punti: t.el("div", { class: "mo-punti" }), chip: {}, kAvanti: null, guardo: false, faccine: null };
    // tocco immediato col pointerdown (su iPhone il click a volte non arriva)
    ui.tasto.addEventListener("pointerdown", function (e) { e.preventDefault(); if (!ui.guardo) cb.onTocco(); });
    var esci = t.el("button", { class: "mo-esci", "aria-label": "Esci", text: "‹", onclick: cb.onEsci });
    s._contenuto.appendChild(t.el("div", { class: "mo-scena" }, [t.el("div", { class: "mo-barra" }, [esci, ui.giro]), ui.tasto, ui.avviso, ui.avanti, ui.punti]));
    t.mostra(s);
    return ui;
  }
  function aggiorna(ui, vm, cb) {   // QUI: aggiorna solo i pezzi che cambiano (testi e classi), mai tutta la schermata
    var io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    ui.guardo = !io || io.via;   // arrivato a partita cominciata (o tolto): guarda soltanto
    ui.giro.textContent = (ui.guardo ? "👀 Guardi · " : "") + "Giro " + vm.giro + " di " + vm.giri;
    var testo = vm.stato === "attesa" ? "Aspetta…" : vm.stato === "via" ? "TOCCA!" : (vm.vincitore ? "Punto a " + vm.vincitore : "Nessuno…");
    if (ui.tasto.textContent !== testo) ui.tasto.textContent = testo;
    ui.tasto.className = "mo-tasto " + vm.stato + (ui.guardo ? " guarda" : "");
    // chi guarda: le faccine (il suo avatar le fa sui telefoni di tutti). t.faccine() è null se la partita non è online
    if (ui.guardo && !ui.faccine) { ui.faccine = ui.t.faccine(); if (ui.faccine) ui.avanti.parentNode.appendChild(ui.faccine); }
    if (ui.faccine) ui.faccine.style.display = ui.guardo ? "" : "none";   // rientrato in partita: si torna a giocare
    // tra un giro e l'altro: l'host ha "Prossimo giro ▶ 4" che va avanti da solo, gli altri leggono "Si va avanti tra 4…".
    // Si fa UNA volta per giro (chiave): le foto che arrivano intanto non ricostruiscono il tasto
    var k = vm.stato === "preso" ? "mo|" + vm.partita + "|" + vm.giro : null;
    if (k !== ui.kAvanti) {
      ui.kAvanti = k;
      while (ui.avanti.firstChild) ui.avanti.removeChild(ui.avanti.firstChild);
      if (k && cb.sonoHost) {
        var b = ui.t.el("button", { class: "btn btn-primario mo-vai", text: vm.giro >= vm.giri ? "Classifica 🏆" : "Prossimo giro ▶", onclick: cb.onAvanti });
        ui.avanti.appendChild(b);
        ui.t.contoAvanti(b, vm.resta || PAUSA, cb.onAvanti, k);   // a zero chiama onAvanti (toccato prima, si ferma da solo)
      } else if (k) {
        var p = ui.t.el("p", { class: "mo-conto" });
        ui.avanti.appendChild(p);
        ui.t.contoAvanti(p, vm.resta || PAUSA, null, k);   // solo il conto: va avanti l'host
      }
    }
    vm.players.forEach(function (p) {
      var c = ui.chip[p.id];
      if (!c) { c = ui.chip[p.id] = ui.t.el("div", { class: "mo-chip" }); ui.punti.appendChild(c); }
      var tx = (p.forse ? "📶 " : "") + (p.id === cb.myId ? "Tu" : p.nome) + " " + fmtN(p.punti);
      if (c.textContent !== tx) c.textContent = tx;
      c.classList.toggle("via", !!p.via || !!p.forse);
    });
  }
  function avviso(testo) {
    if (!UI || !testo) return;
    UI.avviso.textContent = testo; UI.avviso.classList.remove("su"); void UI.avviso.offsetWidth; UI.avviso.classList.add("su");
  }
  // medaglie a pari merito: oro, oro, poi argento (posti 1, 1, 3 → 🥇🥇🥈), come la fine partita del core
  function medaglie(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; });
  }
  function finale(t, vm, cb) {
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale" });
    var cl = vm.classifica || [], fac = t.faccine();   // le faccine: si aspetta l'host, ci si prende in giro
    // tanti giocatori (o schermo basso): righe su due colonne, così i tasti restano a vista senza scorrere
    var fitta = cl.length > 6 || cl.length * 71 + 300 + (fac ? 56 : 0) > (window.innerHeight || 640);
    var ol = t.el("ol", { class: "classifica" + (fitta ? " fitta" : "") }), med = medaglie(cl.map(function (r) { return r.pos; }));
    cl.forEach(function (r, i) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[i] }),
        t.el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        t.el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(s);
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  // il primo collegamento non è riuscito: "Riprova" rifà il collegamento da capo
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Questo gioco si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  var cssFatto = false;
  function stile() {   // QUI: lo stile del gioco, con un prefisso di classe tutto suo
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.mo-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#15123a}",
      ".schermata.mo-piena>.testa,.schermata.mo-piena>.piede{display:none}",
      ".schermata.mo-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".mo-scena{height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:calc(8px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".mo-barra{display:flex;align-items:center;gap:10px;font-weight:800}",
      ".mo-esci{width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".mo-tasto{flex:1 1 auto;min-height:0;border:0;border-radius:28px;font:inherit;font-size:clamp(2rem,10vw,3.4rem);font-weight:900;color:#fff;touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
      ".mo-tasto.attesa{background:#c92a2a}.mo-tasto.via{background:#2f9e44}.mo-tasto.preso{background:#495057}.mo-tasto.guarda{opacity:.75}",
      ".mo-avviso{min-height:1.4em;text-align:center;font-weight:900;color:#ffa94d;opacity:0}.mo-avviso.su{animation:moAvviso 1.6s ease}",
      "@keyframes moAvviso{0%{opacity:0;transform:scale(.8)}15%{opacity:1;transform:scale(1.05)}80%{opacity:1}100%{opacity:0}}",
      // (alta sempre uguale: quando compare il tasto "Prossimo giro" niente sotto si sposta)
      ".mo-avanti{height:48px;display:flex;align-items:center;justify-content:center}",
      ".mo-vai{width:auto;min-width:60%;margin:0}.mo-conto{margin:0;font-weight:800;opacity:.85}",
      ".mo-punti{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}",
      ".mo-chip{padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800;font-size:.85rem}.mo-chip.via{opacity:.4}",
      ".mo-scena>.sl-faccine{align-self:center;flex:none}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Il più veloce", icona: "⚡",   // QUI: nome e icona
    descrizione: "Quando il tasto diventa verde, toccalo per primo! Ognuno dal suo telefono.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,   // difficolta 1-3: pesa i punti nel torneo
    modi: [], soloOnline: true,   // QUI: se c'è anche un modo sullo stesso telefono, mettilo in modi e togli soloOnline
    // postiOnline: 2,            // QUI: solo nei giochi a due (online gioca solo l'avversario, gli altri guardano)
    regole: [
      "Il tasto è <b>rosso</b>: aspetta. Quando diventa <b>verde</b>, toccalo per primo e prendi un punto.",
      "Se lo tocchi quando è ancora rosso perdi un punto. Vince chi ha più punti alla fine dei giri."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.giri = 5;
      // le scelte con bottoni .modo-chip: così l'host le ritrova in "⚙️ Regole" nella saletta
      box.appendChild(el("div", { class: "etichetta", text: "Quanti giri" }));
      var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(3,1fr)" });
      [3, 5, 10].forEach(function (n) {
        var b = el("button", { class: "modo-chip" + (n === 5 ? " attiva" : ""), style: "justify-content:center", onclick: function () {
          dove.giri = n; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: n + " giri" })]);
        g.appendChild(b);
      });
      box.appendChild(g);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
})();
