/* =========================================================
   COLLEGAMENTO TRA TELEFONI — "SGNet"
   Fa parlare i telefoni tra loro per la modalità
   "ognuno dal suo telefono", senza server né account.

   I messaggi passano da un "ufficio postale" pubblico e
   gratuito (un broker MQTT): ogni telefono si collega a
   quello, quindi funziona su qualsiasi rete (niente
   collegamento diretto che sul cellulare spesso fallisce).

   Un telefono "ospita" la stanza (è il cervello della
   partita); gli altri "entrano" con il codice.

   Sui telefoni veri il collegamento va e viene (schermo
   bloccato, cambio app per mandare il link, rete che salta),
   quindi:
   - chi entra ripete "sono entrato" finché l'host non lo vede
     dentro (il primo può perdersi se la stanza non è ancora pronta);
   - chi sparisce all'improvviso non viene tolto subito: ha un po'
     di tempo per tornare, e quando torna ripete che c'è (intanto
     l'app lo mostra grigio con 📶: evento "sg-forse");
   - se sparisce l'host, gli altri lo aspettano prima di arrendersi;
     chi arriva DOPO trova scritto "host sparito" (il testamento
     resta nella stanza) e lo sa subito, invece di vedere una partita ferma;
   - ogni apertura della stanza ha la sua "sessione": se l'host
     ricarica la pagina e riapre la stessa stanza, chi era dentro
     se ne accorge e rientra da solo;
   - un errore di rete dopo il collegamento non chiude niente:
     l'app mostra "📶 Mi ricollego…" e mqtt riprova da solo.
   Chi esce apposta (tasto Esci) esce subito.

   Regole in più per la Compagnia (stesso codice ogni sera):
   - "PRIMA GUARDO, POI PARLO": chi apre una stanza con un codice
     fisso (o si ricollega dopo un buco) prima legge cosa c'è
     scritto nella stanza; se c'è la Sala viva di un altro non
     pubblica niente e chiede all'app cosa fare (di solito entra
     da amico). Così un telefono rimasto addormentato non copre
     la Sala di stasera;
   - "SBIRCIARE": per sapere se nelle Compagnie c'è qualcuno basta
     un collegamento solo, che legge e chiude subito (niente
     "Mi ricollego…" sullo schermo);
   - SEGUIRE UN HOST NUOVO: quando la Sala passa a un altro amico
     l'app dice quale sessione seguire (seguiHost); quella di prima
     da lì in poi non conta più, nemmeno il suo "host sparito".
     Un "host sparito" non cambia mai la sessione che si segue.

   L'UFFICIO POSTALE DI RISERVA (Passo 5): gli uffici pubblici sono
   due (BROKERS). Chi apre la stanza parla su tutti e due (stessa
   sessione, stessa foto, stesso testamento); chi entra ne usa uno:
   - prova prima l'ultimo che ha funzionato (sg-broker, per un'ora),
     e se non risponde in 2,5 secondi apre anche l'altro;
   - se l'host non si sente (4 secondi, o arriva "host sparito") guarda
     in silenzio nell'altro ufficio: se lì l'host risponde, passa lì;
   - a partita in corso, se il suo ufficio è giù da 12 secondi passa
     all'altro da solo ("📶 La rete è lenta: passo al collegamento di
     riserva…") e rimanda le ultime mosse: l'host scarta i doppioni
     (ogni mossa ha la sua istanza i e il suo numero k).
   RISERVA = false (o sg-riserva = "0" su un telefono): un ufficio solo, come prima.

   La presenza degli amici (SGNet.presenza, fuori dalle stanze):
   ognuno ha un "indirizzo" fatto con l'impronta del suo profilo
   (SGNet.impronta) e lì lascia scritto se è nell'app; gli amici
   lo leggono. Gli inviti restano scritti finché chi li riceve non
   li toglie: chi ha l'app chiusa li trova riaprendola.
   ========================================================= */
(function () {
  "use strict";

  // gli uffici postali: il primo è quello di sempre, il secondo è la riserva (sbirciate e "Ho un codice" li guardano tutti e due)
  var BROKERS = ["wss://broker.hivemq.com:8884/mqtt", "wss://broker.emqx.io:8084/mqtt"];
  var RISERVA = true;          // false = un ufficio solo (il primo), come prima
  var BROKER = BROKERS[0];
  var DURATA_BROKER = 3600000; // l'ultimo ufficio che ha funzionato (sg-broker) vale un'ora
  var ALTRO_DOPO = 2500;       // chi entra: se il suo ufficio non risponde in 2,5 secondi apre anche l'altro
  var SONDA = 4000;            // chi entra: l'host non si sente da 4 secondi → guarda in silenzio nell'altro ufficio
  var CAMBIO = 12000;          // a partita in corso: l'ufficio è giù da 12 secondi → si passa all'altro
  var RIPROVA_UFFICIO = 30000; // l'host: un ufficio che non ha mai risposto si riprova ogni 30 secondi
  var DOPPI = 60000;           // l'host: le mosse già viste negli ultimi 60 secondi si scartano
  var BASE = "seratagiochi/v1/";
  var ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // niente caratteri ambigui
  var ATTESA_OSPITE = 20000;   // chi sparisce all'improvviso: tanto tempo per tornare prima di toglierlo
  var ATTESA_HOST = 120000;    // se sparisce l'host (es. è andato a mandare il link su WhatsApp), gli altri lo aspettano 2 minuti
  var RIPETI_ENTRATA = 2000, MAX_RIPETI = 45, RIPETI_LENTO = 10000;   // "sono entrato" ogni 2 secondi per un minuto e mezzo, poi ogni 10 finché non si è dentro
  var CI_SONO = 15000;         // chi è dentro lo ripete ogni tanto (se è stato zitto): così un "sparito" in ritardo non lo toglie
  var DURATA_ID = 6 * 3600 * 1000;
  var MUTA = 8000;             // chi entra e per 8 secondi non sente l'host: "la stanza non risponde"
  var ATTESA_PRIMO = 15000;    // il primo collegamento non riesce: il gioco lo sa solo dopo 15 secondi di tentativi
  var LENTO = 3000;            // il primo collegamento tarda: si mostra "📶 Mi ricollego…"

  // chi rientra nella stessa stanza (pagina ricaricata, app riaperta) torna con lo STESSO codice:
  // l'host lo riconosce e gli ridà il suo posto, invece di prenderlo per uno nuovo
  function idPerStanza(codice) {
    var k = "sg-id-" + String(codice).toUpperCase(), id = null;
    try { var v = JSON.parse(localStorage.getItem(k) || "null"); if (v && v.id && Date.now() - v.t < DURATA_ID) id = v.id; } catch (e) {}
    if (!id) id = "g" + Math.random().toString(36).slice(2, 9);
    try { localStorage.setItem(k, JSON.stringify({ id: id, t: Date.now() })); } catch (e) {}
    return id;
  }

  // avvisi per l'app (li mostra core.js): l'host è sparito o è tornato ("⏳ Aspettiamo l'host…"),
  // la rete è giù ("📶 Mi ricollego…"), la stanza è ferma ("😴 La stanza è ferma")
  function evento(nome, dettagli) { try { window.dispatchEvent(new CustomEvent(nome, { detail: dettagli })); } catch (e) {} }
  function avvisaHost(stanza, via) { evento("sg-host", { stanza: stanza, via: !!via }); }
  // le cose che valgono solo adesso (una faccina, il 3-2-1): con la rete giù si perdono, non aspettano in coda
  function effimero(msg) { return !!(msg && (msg.t === "__faccina" || msg.t === "__fa" || msg.t === "__via")); }

  function codiceACaso(n) {
    var s = "";
    for (var i = 0; i < (n || 4); i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
    return s;
  }
  // (cresce col tempo: tra due sessioni dello stesso host, la più nuova è la "più grande")
  function nuovaSessione() { return ("000000000" + Date.now().toString(36)).slice(-9) + Math.random().toString(36).slice(2, 5); }
  function topics(codice) {
    codice = String(codice).toUpperCase();
    return { stato: BASE + codice + "/stato", azioni: BASE + codice + "/azioni" };
  }
  function delCore(m) { return !!(m && typeof m.t === "string" && m.t.slice(0, 2) === "__"); }   // i messaggi del collegamento e dell'app (non dei giochi)

  // le stanze dei giochi aperte da questo telefono (non la sala): quando si passa a un altro
  // gioco o si torna alla home si chiudono tutte, così non restano collegamenti vecchi
  var aperte = [];
  function segna(h, tieni) { if (!tieni) aperte.push(h); return h; }
  function togli(h) { aperte = aperte.filter(function (x) { return x !== h; }); }

  // ---- gli uffici postali ----
  // c'è la riserva? (sg-riserva = "0" la spegne su questo telefono)
  function riserva() { if (!RISERVA) return false; try { return localStorage.getItem("sg-riserva") !== "0"; } catch (e) { return true; } }
  // gli uffici da usare, in ordine: prima l'ultimo che ha funzionato (sg-broker, un'ora)
  function uffici() {
    if (!riserva()) return [BROKERS[0]];
    var l = BROKERS.slice();
    try {
      var v = JSON.parse(localStorage.getItem("sg-broker") || "null"), i = v && v.url ? l.indexOf(v.url) : -1;
      if (i > 0 && Date.now() - v.t < DURATA_BROKER) { l.splice(i, 1); l.unshift(v.url); }
    } catch (e) {}
    return l;
  }
  function altroUfficio(url) { var l = uffici(); for (var i = 0; i < l.length; i++) if (l[i] !== url) return l[i]; return null; }
  function ricordaUfficio(url) { try { localStorage.setItem("sg-broker", JSON.stringify({ url: url, t: Date.now() })); } catch (e) {} }
  var usato = null;   // l'ufficio che questo telefono sta usando adesso (SGNet.broker)
  // "📶 La rete è lenta: passo al collegamento di riserva…": una volta per stanza, nelle pillole in alto dell'app
  var avvisati = {};
  function avvisoRiserva(codice) {
    if (avvisati[codice]) return;
    avvisati[codice] = 1;
    evento("sg-riserva", { stanza: codice });
    try {
      var box = document.querySelector(".sg-pillole"), mio = !box;
      if (mio) { box = document.createElement("div"); box.className = "sg-pillole"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
      var n = document.createElement("div");
      n.className = "sg-pillola grigia sg-pillola-riserva"; n.textContent = "📶 La rete è lenta: passo al collegamento di riserva…";
      box.appendChild(n);
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); if (mio && box.parentNode && !box.children.length) box.parentNode.removeChild(box); }, 3000);
    } catch (e) {}
  }

  // ---- il collegamento al broker ----
  // Il broker pubblico a volte tarda (circa 1 volta su 4 ci mette 7 secondi invece di 0,15): se dopo un secondo e mezzo
  // non ha ancora risposto si apre un secondo collegamento e si tiene il primo che risponde (l'altro si chiude).
  // pronto(client, url) arriva una volta sola, al primo collegamento; poi i ricollegamenti li fa mqtt da solo.
  // errore(e) solo se il primo collegamento non arriva entro 15 secondi (mqtt intanto riprova da solo);
  // dopo, la rete che salta è solo un avviso ("sg-rete": "📶 Mi ricollego…").
  // errore = null: collegamento "muto" (la sbirciata): nessun avviso sullo schermo
  // altro (facoltativo): { url: un altro ufficio postale, urls: una lista di uffici (il primo subito e di nuovo dopo
  //   1,5 secondi, il secondo dopo 2,5: vince il primo che risponde), muto: true = nessun avviso anche se c'è la funzione errore }
  // Restituisce { chiudi(), sveglia() }: sveglia toglie il muto (una sonda che diventa il collegamento vero)
  var GARA = 1500, nCol = 0;
  function collega(opzioni, pronto, errore, altro) {
    altro = altro || {};
    var tutti = [], vinto = null, finito = false, ultimoErr = null, id = ++nCol, giu = false;
    var muto = !errore || !!altro.muto, lista = (altro.urls && altro.urls.length) ? altro.urls : [altro.url || BROKER];
    function rete(stato) { if (muto || stato === giu) return; giu = stato; evento("sg-rete", { id: id, giu: stato }); }
    function apri(url) {
      var c = mqtt.connect(url, opzioni); tutti.push(c);
      try { c.sgUrl = url; } catch (e) {}
      c.on("error", function (e) { if (!vinto && !finito) ultimoErr = e; });
      c.on("connect", function () {
        if (finito) return;
        if (vinto && c !== vinto) return;
        rete(false);
        if (vinto) return;   // ricollegato dopo un buco: ci pensa chi usa il collegamento
        vinto = c; tGara.forEach(clearTimeout); clearTimeout(tErr); clearTimeout(tLento);
        tutti.forEach(function (x) { if (x !== c) try { x.end(); } catch (e) {} });   // (uscita educata: il broker non manda il "testamento")
        pronto(c, url);
      });
      // la rete è saltata dopo il collegamento: niente errori al gioco, solo l'avviso "Mi ricollego…" (mqtt riprova da solo)
      function caduto() { if (!finito && vinto === c) rete(true); }
      c.on("close", caduto); c.on("offline", caduto);
      return c;
    }
    // la gara: il primo ufficio subito e di nuovo dopo 1,5 secondi (a volte tarda), gli altri dopo 2,5 secondi
    apri(lista[0]);
    var tGara = [setTimeout(function () { if (!vinto && !finito) apri(lista[0]); }, GARA)];
    lista.slice(1).forEach(function (u, i) { tGara.push(setTimeout(function () { if (!vinto && !finito) apri(u); }, ALTRO_DOPO * (i + 1))); });
    var tLento = setTimeout(function () { if (!vinto && !finito && errore) rete(true); }, LENTO);
    // il primo collegamento non arriva proprio: smetto di provare e lo dico al gioco ("Problema di collegamento", si riprova da capo)
    var tErr = setTimeout(function () {
      if (vinto || finito) return;
      finito = true; tGara.forEach(clearTimeout); clearTimeout(tLento); rete(false);
      tutti.forEach(function (x) { try { x.end(true); } catch (e) {} });
      if (errore) errore(ultimoErr || { message: "nessuna risposta" });
    }, ATTESA_PRIMO);
    return {
      chiudi: function () {
        finito = true; tGara.forEach(clearTimeout); clearTimeout(tErr); clearTimeout(tLento); rete(false);
        tutti.forEach(function (x) { if (x !== vinto) try { x.end(true); } catch (e) {} });
      },
      sveglia: function () { if (!muto || !errore) return; muto = false; if (vinto && !vinto.connected && !finito) rete(true); }
    };
  }
  // tornando nell'app (schermo sbloccato, di nuovo in rete) chi ha perso il collegamento si ricollega subito,
  // senza aspettare il prossimo tentativo
  var vivi = [];
  function ravviva() { vivi.forEach(function (c) { try { if (!c.connected && !c.disconnecting && typeof c.reconnect === "function") c.reconnect(); } catch (e) {} }); }
  try {
    document.addEventListener("visibilitychange", function () { if (!document.hidden) ravviva(); });
    window.addEventListener("online", ravviva); window.addEventListener("pageshow", ravviva);
  } catch (e) {}
  var KEEPALIVE = 20;   // ogni quanti secondi si dice al broker "ci sono": un collegamento morto si scopre in 20-40 secondi (non 2 minuti)
  var CODA_MAX = 40, CODA_VITA = 30000;   // quello che si manda mentre la rete è giù: parte appena torna (al massimo 40 messaggi, di non più di 30 secondi fa)

  // ---- la presenza degli amici (fuori dalle stanze: pallino verde e inviti) ----
  // Sta SEMPRE sul primo ufficio postale (con quello di riserva: il primo di BROKERS), mai su quello scelto da
  // questo telefono: due amici devono stare sullo stesso per vedersi. Se il primo è giù, niente pallini verdi.
  function primoUfficio() { return (typeof BROKERS !== "undefined" && BROKERS && BROKERS[0]) || BROKER; }
  var PRES_KEEPALIVE = 60;            // un collegamento solo e "ci sono" ogni minuto: meno batteria
  var PRES_RIPROVA = 30000;           // l'ufficio non risponde proprio: riprovo con calma ogni 30 secondi
  var PRES_RINFRESCA = 3600000;       // chi resta nell'app ripete "ci sono" ogni ora (un "on" vecchio di ore non conta)
  var PRES_MAX = 200;                 // al massimo 200 amici seguiti
  var TESTAMENTO_ON = '{"on":0}';     // (senza ora: così si riconosce da un "non mi vedete" detto apposta)
  function topicU(h, cosa) { return BASE + "u/" + h + "/" + cosa; }
  function impOk(h) { return typeof h === "string" && /^[0-9a-z]{4,24}$/.test(h); }   // (niente caratteri strani nei topic)
  // FNV-1a a 64 bit, fatto a pezzi da 16 bit (i numeri di JavaScript non tengono 64 bit interi).
  // Restituisce le due metà da 32 bit [alta, bassa]
  function fnv64(s) {
    var b = unescape(encodeURIComponent(String(s)));   // i byte UTF-8
    var h0 = 0x2325, h1 = 0x8422, h2 = 0x9ce4, h3 = 0xcbf2;   // 0xcbf29ce484222325
    for (var i = 0; i < b.length; i++) {
      h0 ^= b.charCodeAt(i);
      // × 0x100000001b3 = × 0x1b3 + × 2^40 (2^40 = due pezzi più su e × 256)
      var t0 = h0 * 0x1b3, t1 = h1 * 0x1b3, t2 = h2 * 0x1b3, t3 = h3 * 0x1b3;
      t2 += h0 << 8; t3 += h1 << 8;
      t1 += t0 >>> 16; h0 = t0 & 0xffff;
      t2 += t1 >>> 16; h1 = t1 & 0xffff;
      h3 = (t3 + (t2 >>> 16)) & 0xffff; h2 = t2 & 0xffff;
    }
    return [((h3 << 16) | h2) >>> 0, ((h1 << 16) | h0) >>> 0];
  }
  function sei36(x) { return ("000000" + (x % 2176782336).toString(36)).slice(-6); }   // 36^6: 6 caratteri per metà

  window.SGNet = {
    disponibile: function () { return typeof mqtt !== "undefined"; },

    // Genera un codice stanza (usato dalla "sala" per preparare il codice
    // di un gioco prima ancora di aprirlo). nuovoCodice(6) = 6 lettere (le Compagnie), se no 4.
    nuovoCodice: function (n) { return codiceACaso(n === 6 ? 6 : 4); },

    // Chiude le stanze dei giochi rimaste aperte (la sala no). ritardo (ms): le chiude un po' dopo,
    // ma solo quelle aperte adesso (serve all'host: prima gli altri tornano in sala, poi si chiude).
    chiudiGiochi: function (ritardo) {
      var a = aperte.slice(); aperte = [];
      function via() { a.forEach(function (h) { try { h.chiudi(); } catch (e) {} }); }
      if (ritardo) setTimeout(via, ritardo); else via();
    },
    // Come chiudiGiochi, ma dalle stanze che ospito esco come se fossi sparito (senza "chiusa apposta"): serve quando la partita
    // l'ha già presa un amico (host di riserva) e io torno solo da amico. Le stanze dove sono ospite si chiudono come sempre
    lasciaGiochi: function () {
      var a = aperte.slice(); aperte = [];
      a.forEach(function (h) { try { if (h.ospito && h.sparisci) h.sparisci(); else h.chiudi(); } catch (e) {} });
    },

    // Ricorda con quale codice-giocatore questo telefono sta in una stanza (es. "host"):
    // se poi ci rientra come ospite (host di riserva, app riaperta) torna la stessa persona.
    ricordaId: function (codice, id) {
      try { localStorage.setItem("sg-id-" + String(codice).toUpperCase(), JSON.stringify({ id: id, t: Date.now() })); } catch (e) {}
    },

    // Quale ufficio postale sta usando questo telefono (l'indirizzo): per le prove e per sapere com'è andata
    broker: function () { return usato || uffici()[0]; },
    // gli uffici in uso, in ordine (con la riserva spenta: uno solo)
    uffici: function () { return uffici(); },

    // L'host apre una stanza. cb: { onCodice, onConnesso, onAddio(id), onMsg(id,msg), onErrore(e), onStato(msg),
    //   onForse(id) / onTornato(id) (facoltativi: un ospite sparito senza salutare, e tornato in tempo) }
    // opz (facoltative): codice = la stanza ha già il suo codice (host di riserva, stanza riaperta dopo una ricarica);
    // ascoltaStato = riceve anche quello che mandano gli host (onStato), così si accorge se un altro ha preso il posto;
    // keepalive = ogni quanti secondi dice al broker "ci sono" (più basso = se sparisce ce ne si accorge prima)
    // "Prima guardo, poi parlo" (la Sala con un codice fisso, o che si ricollega dopo un buco):
    // guardaPrima = ms (es. 1200): a ogni collegamento, anche il primo, prima di pubblicare qualcosa legge la foto
    //   trattenuta nella stanza (decide appena arriva, o 400 ms dopo l'iscrizione, al massimo dopo guardaPrima ms).
    //   Se è la foto viva di un'altra sessione: cb.onOccupata(msg); se torna true si va avanti, se no non si pubblica
    //   niente (l'app farà lascia()). Intanto invia mette in coda, e cb.onConnesso arriva solo dopo la decisione;
    //   con due uffici decide il primo che risponde (l'altro aspetta e fa come lui);
    //   se la stanza è vuota davvero (niente di trattenuto: chiusa apposta) chiede cb.onVuota(): false = non pubblico niente;
    // guardaRitorno = ms: lo stesso, ma solo quando si ricollega (non al primo collegamento);
    // sopra = la sessione di una Sala morta che sto riaprendo: la sua foto non conta come "occupata";
    // testamento = campi in più nel "host sparito" (es. { g: 3 } → { t: "__hostgone", s, g: 3 })
    // ripresa = la stanza si riapre e la partita RIPRENDE da dove era (Passo 5): "ci sono" dice r: 1 e le foto _r: 1, così chi
    //   era dentro non riparte dalla saletta (il terzo argomento di onHostNuovo è il messaggio: ripresa = msg.r || msg._r)
    // Con la riserva l'host sta su TUTTI gli uffici (stessa sessione, foto, testamento e "meta" su ognuno; quello che
    // si manda con un ufficio giù aspetta in una coda sua). onConnesso arriva quando il primo ufficio è pronto;
    // onErrore solo se nessun ufficio risponde in 15 secondi.
    ospita: function (giocoId, cb, opz) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      opz = opz || {};
      // La "sala" può imporre il codice della stanza (così lo conosce in anticipo
      // e lo manda agli altri per farli entrare in automatico).
      var codice = String(opz.codice || SGNet._forza || codiceACaso(4)).toUpperCase();
      SGNet._forza = null;
      var T = topics(codice);
      var META = BASE + codice + "/meta";
      // ogni apertura ha la sua sessione: va nelle foto trattenute (_s) e in "__hostqui"; chi è dentro capisce
      // così se l'host ha riaperto la stanza (pagina ricaricata) e rientra da solo
      var sid = nuovaSessione();
      var chiusa = false, ceduto = false, errorato = false, collegatoMai = false, t0 = Date.now();
      var inForse = {};   // chi è sparito all'improvviso: id -> timer (se si rifà vivo in tempo, resta dentro)
      var ultimo = null;  // l'ultima foto della partita
      // prima guardo, poi parlo: guardo = la decisione in corso { U: l'ufficio che guarda, attesa: gli altri che aspettano };
      // ceduto = c'era la Sala di un altro e non pubblico più niente (l'app chiude)
      var guardo = null, giro = 0;
      // le mosse già viste (from|i|k → ora): chi cambia ufficio rimanda le ultime, qui passano una volta sola;
      // da quale ufficio parla ognuno (un "sparito" che arriva da un ufficio che non usa più non conta)
      var visti = {}, nVisti = 0, ufficioDi = {}, statiVisti = [], entrataDi = {};   // entrataDi: l'ultima "entrata" (i) sentita da ognuno
      // un "ufficio" per indirizzo: il suo collegamento, la sua coda (quello mandato mentre era giù), ecc.
      var U = uffici().map(function (url, n) {
        return { n: n, url: url, client: null, col: null, coda: [], passato: false, guardando: false, pronto: false,
          fallito: false, tRiprova: null, rimesso: 0, risposto: 0 };
      });
      // Il codice si conosce SUBITO (non dipende dal collegamento): mostralo subito,
      // così la stanza dà sempre il codice anche se la rete è lenta a collegarsi.
      // (un tick dopo, così chi ci chiama ha già ricevuto l'oggetto "rete")
      setTimeout(function () { if (!chiusa) cb.onCodice && cb.onCodice(codice); }, 0);
      function conSessione(msg) {
        if (!msg || typeof msg !== "object") return msg;
        var o = {}; for (var k in msg) if (Object.prototype.hasOwnProperty.call(msg, k)) o[k] = msg[k];
        o._s = sid; if (opz.ripresa) o._r = 1;   // (_r: la partita riprende da dove era, vedi opz.ripresa)
        return o;
      }
      function testamento() {
        var o = { t: "__hostgone", s: sid }, x = opz.testamento;
        if (x && typeof x === "object") for (var k in x) if (Object.prototype.hasOwnProperty.call(x, k) && k !== "t" && k !== "s" && k !== "voluto") o[k] = x[k];
        return o;
      }
      function su(u) { return !!(u.client && u.client.connected); }
      function puoParlare(u) { return su(u) && !u.guardando && !ceduto; }
      // "📶 Mi ricollego…" dell'host: solo quando non c'è NESSUN ufficio (al primo collegamento dopo 3 secondi)
      var idRete = ++nCol, reteGiuOra = false;
      function segnaRete(g) { if (g === reteGiuOra) return; reteGiuOra = g; evento("sg-rete", { id: idRete, giu: g }); }
      function reteHost() {
        if (chiusa || errorato || U.some(su)) return segnaRete(false);
        if (collegatoMai || Date.now() - t0 >= LENTO - 50) segnaRete(true);
      }
      var tLento = setTimeout(reteHost, LENTO);
      // manda su tutti gli uffici (il testo si prepara una volta sola); chi è giù lo mette nella sua coda
      function manda(msg, trattieni) {
        var tx = null;
        U.forEach(function (u) {
          if (puoParlare(u)) {
            try { if (tx === null) tx = JSON.stringify(trattieni ? conSessione(msg) : msg); u.client.publish(T.stato, tx, { retain: !!trattieni }); return; } catch (e) {}
          }
          inCoda(u, msg, trattieni);
        });
      }
      function mandaSu(u, msg, trattieni) {
        if (puoParlare(u)) { try { u.client.publish(T.stato, JSON.stringify(trattieni ? conSessione(msg) : msg), { retain: !!trattieni }); return; } catch (e) {} }
        inCoda(u, msg, trattieni);
      }
      function inCoda(u, msg, trattieni) {
        if (!trattieni && effimero(msg)) return;
        u.coda.push({ m: msg, r: !!trattieni, t: Date.now() }); if (u.coda.length > CODA_MAX) u.coda.shift();   // la rete è giù: la mossa non si perde
      }
      // chi è sparito all'improvviso e ha ancora tempo per tornare: l'app lo mostra grigio con 📶 ("si sta ricollegando…")
      // Anche il gioco lo sa subito, se vuole: cb.onForse(id) quando sparisce senza salutare, cb.onTornato(id) quando
      // si rifà vivo in tempo (es. "📶…" sulla sua targa). Se non torna, dopo 20 secondi arriva onAddio(id) come sempre
      function forse(id, si, tornato) {
        evento("sg-forse", { stanza: codice, id: id, forse: !!si });
        try { if (si) { if (cb.onForse) cb.onForse(id); } else if (tornato && cb.onTornato) cb.onTornato(id); } catch (e) {}
      }
      function svuota(u) { var ora = Date.now(), l = u.coda; u.coda = []; l.forEach(function (x) { if (x.r || ora - x.t < CODA_VITA) mandaSu(u, x.m, x.r); }); }
      function ciSono(u) { if (!puoParlare(u)) return; try { u.client.publish(T.stato, JSON.stringify(opz.ripresa ? { t: "__hostqui", s: sid, r: 1 } : { t: "__hostqui", s: sid }), { retain: false }); } catch (e) {} }
      // il testamento di un mio collegamento di prima arriva in ritardo (rete cambiata, telefono che si riprende:
      // il broker se ne accorge anche 30 secondi dopo) e copre la mia foto: dico che ci sono e la rimetto (su quell'ufficio)
      function rimetti(u) {
        if (chiusa || !puoParlare(u) || Date.now() - u.rimesso < 1000) return;
        u.rimesso = Date.now(); ciSono(u);
        if (ultimo) mandaSu(u, ultimo, true); else try { u.client.publish(T.stato, "", { retain: true }); } catch (e) {}
      }
      function collegato(u) {
        if (chiusa || ceduto) return;
        var g = opz.guardaPrima || (u.passato ? opz.guardaRitorno : 0);
        u.passato = true;
        if (!g) return parla(u, false);
        u.guardando = true;
        // un altro ufficio sta già guardando: aspetto la sua decisione
        if (guardo && guardo.U !== u) { if (guardo.attesa.indexOf(u) < 0) guardo.attesa.push(u); return; }
        guarda(u, g);
      }
      // prima guardo: leggo la foto trattenuta della stanza e poi decido se parlare (su questo ufficio e su quelli che aspettano)
      function guarda(u, g) {
        var mioGiro = ++giro, fatto = false, t400 = null, tMax = null, c = u.client;
        var G = guardo = { U: u, attesa: guardo ? guardo.attesa : [], decidi: null };
        G.decidi = function (m, vuota) {
          if (fatto || mioGiro !== giro || chiusa) return;
          fatto = true; clearTimeout(t400); clearTimeout(tMax);
          var tutti = [u].concat(G.attesa.filter(function (x) { return x !== u; }));
          if (guardo === G) guardo = null;
          tutti.forEach(function (x) { x.guardando = false; });
          // la Sala viva di un altro (non un "host sparito", non una mia foto, non la Sala morta che sto riaprendo)
          if (m && typeof m === "object" && m._s && m._s !== sid && m._s !== opz.sopra && m.t !== "__hostgone") {
            var avanti = false;
            try { avanti = !!(cb.onOccupata && cb.onOccupata(m) === true); } catch (e) {}
            if (!avanti) { ceduto = true; return; }   // non pubblico niente: l'app esce (lascia) ed entra da amico
          }
          // (stanza vuota davvero: né foto né "host sparito" trattenuti = qualcuno l'ha chiusa apposta. Chi riprende una
          // partita lo sa con cb.onVuota: se torna false non pubblico niente, la partita è finita senza di me)
          if (vuota && cb.onVuota) { var va = true; try { va = cb.onVuota() !== false; } catch (e) {} if (!va) { ceduto = true; return; } }
          if (chiusa) return;
          tutti.forEach(function (x) { if (su(x)) parla(x, x === u && x.client === c); });
        };
        c.subscribe(T.stato, function () { if (!fatto && mioGiro === giro) t400 = setTimeout(function () { G.decidi(null, true); }, 400); });
        tMax = setTimeout(function () { G.decidi(null); }, g);
      }
      // parlo: la stanza è mia (giaStato = sono già iscritto allo stato: guardando)
      function parla(u, giaStato) {
        if (chiusa || ceduto || !u.client) return;
        var c = u.client;
        // quando è davvero collegato la stanza è "pronta": lo comunichiamo al gioco (al primo ufficio pronto)
        c.subscribe(T.azioni, function () {
          if (chiusa || u.client !== c || !c.connected) return;
          var primo = !U.some(function (x) { return x !== u && x.pronto; });
          u.pronto = true;
          if (primo) cb.onConnesso && cb.onConnesso();
        });
        if (!giaStato) c.subscribe(T.stato);   // anche la mia stanza: così mi accorgo di un "host sparito" che non è vero (vedi rimetti)
        // annuncia QUALE gioco è questa stanza, così chi entra col codice apre quello giusto
        try { c.publish(META, JSON.stringify({ g: giocoId || "" }), { retain: true }); } catch (e) {}
        // "ci sono", con la mia sessione: a ogni collegamento, anche il primo (chi aspettava sa che sono tornato,
        // e se la sessione è nuova, cioè ho riaperto la stanza, rientra da solo)
        ciSono(u);
        var inCodaR = u.coda.some(function (x) { return x.r; });
        if (ultimo && !inCodaR) mandaSu(u, ultimo, true);   // rimetto l'ultima foto (il testamento "host sparito" l'aveva coperta)
        else if (!ultimo && !inCodaR) try { c.publish(T.stato, "", { retain: true }); } catch (e) {}   // nessuna foto ancora: tolgo un vecchio "host sparito"
        svuota(u);   // quello che ho fatto mentre la rete era giù
      }
      // lo stesso messaggio sullo stato arrivato da due uffici (le mie foto, quelle di un altro host): una volta sola
      function giaVisto(u, tx) {
        if (U.length < 2) return false;
        var ora = Date.now();
        statiVisti = statiVisti.filter(function (x) { return ora - x.t < 5000; });
        for (var i = 0; i < statiVisti.length; i++) if (statiVisti[i].tx === tx && statiVisti[i].n !== u.n) { statiVisti.splice(i, 1); return true; }
        statiVisti.push({ tx: tx, n: u.n, t: ora }); if (statiVisti.length > 30) statiVisti.shift();
        return false;
      }
      function messaggio(u, topic, payload, pacchetto) {
        if (chiusa) return;
        if (topic === T.stato) {
          var tx = payload.toString(), trat = !!(pacchetto && pacchetto.retain);
          // sto guardando: la foto trattenuta decide se parlo (vedi guarda)
          if (u.guardando && trat) {
            if (guardo && guardo.U === u) { var mt = null; try { mt = JSON.parse(tx || "null"); } catch (e) {} guardo.decidi(mt); }
            return;
          }
          // dal vivo, mentre io ci sono: un "host sparito" (non voluto) è di un mio collegamento vecchio
          // (quello trattenuto che trovo collegandomi l'ho già sistemato in collegato())
          if (!trat && tx.indexOf('"__hostgone"') >= 0 && tx.indexOf('"voluto"') < 0) rimetti(u);
          if (!opz.ascoltaStato || giaVisto(u, tx)) return;
          // (con ascoltaStato) quello che mandano gli host: anche uno che ha preso il nostro posto
          var s; try { s = JSON.parse(tx || "null"); } catch (e) { return; }
          if (s && cb.onStato) cb.onStato(s, trat);
          return;
        }
        var m; try { m = JSON.parse(payload.toString()); } catch (e) { return; }
        if (!m || !m.from) return;
        // la stessa mossa due volte (chi è passato all'altro ufficio rimanda le ultime): la prima vale, la seconda no
        if (m.i != null && m.k != null) {
          var kk = m.from + "|" + m.i + "|" + m.k, ora = Date.now();
          if (visti[kk]) return;
          visti[kk] = ora;
          if (++nVisti > 500) { nVisti = 0; for (var q in visti) { if (ora - visti[q] > DOPPI) delete visti[q]; else nVisti++; } }
        }
        var lascio = m.data && m.data.t === "__leave";
        // "sparito" da un ufficio che quell'amico non usa più (è passato all'altro): è il testamento del collegamento vecchio
        if (lascio && !m.data.voluto && ufficioDi[m.from] != null && ufficioDi[m.from] !== u.n) return;
        // "sparito" di una sua entrata di prima (ha ricaricato la pagina e il broker se ne accorge solo adesso, anche 30 s
        // dopo): lui è già rientrato con l'entrata nuova, quindi non conta (18 ott: con Palla Matta restava "via" pur essendoci)
        if (lascio && !m.data.voluto && m.i != null && entrataDi[m.from] != null && entrataDi[m.from] !== m.i) return;
        if (!lascio && m.i != null) entrataDi[m.from] = m.i;
        if (!lascio) ufficioDi[m.from] = u.n;
        if (inForse[m.from]) { clearTimeout(inForse[m.from]); delete inForse[m.from]; forse(m.from, false, true); }   // si è rifatto vivo in tempo
        if (lascio) {
          if (m.data.voluto) { cb.onAddio && cb.onAddio(m.from); return; }   // è uscito apposta
          // sparito all'improvviso: lo aspetto un po' prima di toglierlo dalla partita
          var chi = m.from;
          inForse[chi] = setTimeout(function () { delete inForse[chi]; if (!chiusa) cb.onAddio && cb.onAddio(chi); forse(chi, false); }, ATTESA_OSPITE);
          forse(chi, true);
          return;
        }
        if (m.data && m.data.t === "__ci") return;   // "ci sono": serve solo a non toglierlo (qui sopra), il gioco non lo vede
        // chi bussa sa subito che ci sono (sull'ufficio da cui bussa), anche se il gioco non gli risponde (al massimo una volta al secondo)
        if (m.data && m.data.t === "join" && Date.now() - u.risposto > 1000) { u.risposto = Date.now(); ciSono(u); }
        cb.onMsg && cb.onMsg(m.from, m.data);
      }
      // apre (o riapre) un ufficio: il collegamento resta, i ricollegamenti li fa mqtt da solo
      function apriUfficio(u) {
        if (chiusa || errorato) return;
        u.fallito = false;
        u.col = collega({
          clean: true, reconnectPeriod: 2000, keepalive: opz.keepalive || KEEPALIVE,
          // Se l'host sparisce all'improvviso il broker lo dice a tutti e lo LASCIA nella stanza (trattenuto):
          // chi arriva dopo trova "host sparito" invece della foto ferma di una partita che non va avanti
          // (opz.testamento: campi in più, es. la generazione della Sala { g: 3 })
          will: { topic: T.stato, payload: JSON.stringify(testamento()), retain: true }
        }, function (c) {
          if (chiusa) { try { c.end(); } catch (e) {} return; }
          u.client = c; vivi.push(c); collegatoMai = true;
          if (!usato) usato = u.url;
          function giu() { if (u.client !== c) return; u.pronto = false; reteHost(); }
          c.on("connect", function () { if (u.client !== c || chiusa) return; reteHost(); collegato(u); });
          c.on("close", giu); c.on("offline", giu);
          c.on("message", function (t, p, k) { if (u.client === c) messaggio(u, t, p, k); });
          reteHost();
          collegato(u);
        }, function (e) {
          u.col = null; u.fallito = true;
          if (chiusa) return;
          // nessun ufficio ha mai risposto: lo dico al gioco (come prima, "Problema di collegamento")
          if (!collegatoMai && U.every(function (x) { return x.fallito; })) {
            errorato = true; clearTimeout(tLento); reteHost();
            U.forEach(function (x) { clearTimeout(x.tRiprova); });
            cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message });
            return;
          }
          // un ufficio solo non risponde (gli altri sì, o ci stanno ancora provando): lo riprovo con calma
          u.tRiprova = setTimeout(function () { u.tRiprova = null; apriUfficio(u); }, RIPROVA_UFFICIO);
        }, { url: u.url, muto: true });   // ("Mi ricollego…" lo decide reteHost: solo se non c'è nessun ufficio)
      }
      U.forEach(apriUfficio);
      function fine() {
        chiusa = true; togli(h); clearTimeout(tLento);
        U.forEach(function (u) { clearTimeout(u.tRiprova); if (u.col) u.col.chiudi(); u.coda = []; });
        vivi = vivi.filter(function (x) { return !U.some(function (u) { return u.client === x; }); });
        Object.keys(inForse).forEach(function (k) { clearTimeout(inForse[k]); }); inForse = {};
        segnaRete(false);
      }

      var h = {
        codice: codice, sessione: sid, ospito: true,
        // la partita (vm) viene mandata a tutti e "trattenuta" (retain) così
        // chi entra dopo riceve subito lo stato attuale
        invia: function (msg) { if (chiusa) return; ultimo = msg; manda(msg, true); },
        // invio ad alta frequenza (streaming di gioco): NON trattenuto, per non intasare il broker
        inviaVeloce: function (msg) { if (!chiusa) manda(msg, false); },
        // un messaggio per uno solo (il gioco ci mette dentro a chi va): NON trattenuto, così non prende il posto
        // dell'ultima foto della partita (chi arriva dopo deve trovare la foto, non il messaggio privato di un altro)
        inviaA: function (id, msg) { if (!chiusa) manda(msg, false); },
        // gli uffici di questa stanza (per le prove): [{ url, su, pronto }]
        uffici: function () { return U.map(function (u) { return { url: u.url, su: su(u), pronto: u.pronto }; }); },
        // se ne va in silenzio SENZA chiudere la stanza: un altro telefono ha preso il posto di host
        lascia: function () {
          if (chiusa) return;
          fine();
          U.forEach(function (u) { try { if (u.client) u.client.end(); } catch (e) {} });   // uscita "educata": il broker non manda l'avviso "host sparito"
        },
        // esco come se fossi sparito: dal vivo il mio "host sparito" (non trattenuto, non "apposta"), poi esco in silenzio.
        // Chi segue già un altro host (il vice) lo scarta; chi seguiva me lo aspetta, o il vice prende il mio posto
        sparisci: function () {
          if (chiusa) return;
          U.forEach(function (u) { try { if (su(u)) u.client.publish(T.stato, JSON.stringify(testamento()), { retain: false }); } catch (e) {} });
          h.lascia();
        },
        chiudi: function () {
          if (chiusa) return;
          fine();
          U.forEach(function (u) {
            var c = u.client;
            try {
              if (!c) return;
              c.publish(T.stato, JSON.stringify({ t: "__hostgone", voluto: 1, s: sid }), { retain: false });   // chiusa apposta: gli altri escono subito
              c.publish(T.stato, "", { retain: true }); // pulisce lo stato trattenuto
              c.publish(META, "", { retain: true });    // pulisce l'annuncio del gioco
              c.end();
            } catch (e) {}
          });
        }
      };
      return segna(h, giocoId === "__sala");   // la sala resta aperta tra un gioco e l'altro
    },

    // Un ospite entra con il codice. cb: { onAperto(id), onMsg(msg), onChiuso(perché: { voluto } o { sparito }), onErrore(e), onHostVia(sparito),
    //   onHostNuovo(eraDentro, eraVivo, msg) } (msg = il messaggio dell'host nuovo: "Paky è tornato" o "ora la tiene Luca";
    //   con msg.r o msg._r la partita riprende da dove era: l'app non riparte dalla saletta)
    // opz.tieni = non chiuderla quando si cambia gioco (è la connessione della sala);
    // opz.guarda = guarda soltanto (non entra: niente "stanza ferma", aspetta l'host come chi è dentro);
    // opz.decideApp = (la Sala) la rete non passa da sola a una sessione nuova: la foto di un'altra sessione arriva a
    //   cb.onMsg (col suo _s) e l'app decide; se lì chiama h.seguiHost(quella sessione), subito dopo arriva
    //   cb.onHostNuovo(eraDentro, eraVivo, msg). Un "host sparito" conta solo se è della sessione che seguo.
    // h.seguiHost(s): da ora seguo la sessione s (anche se "più piccola": orologi diversi), quella di prima non conta più
    // Con la riserva chi entra usa UN ufficio (vedi in cima): cambia da solo se l'host non si sente lì o se l'ufficio è giù;
    // per il gioco non cambia niente (stesso id, stesse foto). Ogni mossa porta i (istanza) e k (numero): l'host scarta i doppioni.
    entra: function (codice, cb, opz) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      opz = opz || {};
      codice = String(codice).toUpperCase();
      var myId = idPerStanza(codice);   // rientrando nella stessa stanza si torna "la stessa persona"
      var T = topics(codice), client = null, coda = [], ufficio = null, collegamento = null;
      var aperto = false, chiusa = false, entrata = null, dentro = false, tRipeti = null, tAddio = null, tCi = null, ultimoInvio = 0;
      var ultimoJoin = 0, primoJoin = 0, nRipeti = 0;
      var sessione = null;     // la sessione dell'host che conosco: se cambia, l'host ha riaperto la stanza
      var scartate = {};       // sessioni lasciate apposta (seguiHost): foto, "ci sono" e "host sparito" di quelle non contano più
      var vivo = false;        // ho sentito l'host dal vivo (non solo la foto trattenuta)
      var ferma = false;       // l'host non c'è: "la stanza è ferma" (o "non risponde")
      var tMuta = null;
      var foto = false, presente = false;   // l'ultima foto dell'host (messaggio trattenuto, con _s) ha il mio id?
      var fotoViva = false;    // ho visto una foto dell'host (trattenuta, con _s, non "sparito")
      // le mosse: i = questa entrata, k = il numero della mossa; recenti = le ultime mandate (30 s), da rimandare se cambio ufficio
      var istanza = Math.random().toString(36).slice(2, 8), nMossa = 0, recenti = [];
      // la riserva: sonda = sto guardando in silenzio nell'altro ufficio; cambio = sto passando all'altro perché il mio è giù
      var sonda = null, ultimaSonda = 0, cambio = null, giuDa = 0, tGiu = null, tSonda = null;
      function opzioni() {
        return { clean: true, reconnectPeriod: 2000, keepalive: KEEPALIVE,
          will: { topic: T.azioni, payload: JSON.stringify({ from: myId, i: istanza, data: { t: "__leave" } }), retain: false } };   // (i: di quale entrata è il testamento)
      }
      function busta(msg) { return { from: myId, data: msg, i: istanza, k: ++nMossa }; }
      function pubblicaBusta(b, c) {
        c = c || client;
        if (!c || !c.connected) return false;
        try { c.publish(T.azioni, JSON.stringify(b), { retain: false }); return true; } catch (e) { return false; }
      }
      function tagliaRecenti() { var ora = Date.now(); recenti = recenti.filter(function (x) { return ora - x.t < CODA_VITA; }); if (recenti.length > CODA_MAX) recenti.splice(0, recenti.length - CODA_MAX); }
      function pubblica(msg) {
        var b = busta(msg);
        if (pubblicaBusta(b)) {
          ultimoInvio = Date.now();
          if (msg && msg.t === "join") ultimoJoin = ultimoInvio;
          else if (msg && msg.t !== "__ci" && !effimero(msg)) { recenti.push({ b: b, t: ultimoInvio }); tagliaRecenti(); }
          return;
        }
        if (!msg || msg.t === "join" || msg.t === "__ci" || effimero(msg)) return;   // ("sono entrato" e "ci sono" li ripeto comunque appena torna la rete; una faccina vale solo adesso)
        coda.push({ b: b, t: Date.now() }); if (coda.length > CODA_MAX) coda.shift();   // la rete è giù: la mossa parte appena torna
      }
      function svuota() {
        var ora = Date.now(), l = coda; coda = [];
        l.forEach(function (x) {
          if (ora - x.t >= CODA_VITA) return;
          if (pubblicaBusta(x.b)) { ultimoInvio = ora; recenti.push({ b: x.b, t: ora }); }
          else coda.push(x);
        });
        tagliaRecenti();
      }
      function smetti() { if (tRipeti) { clearTimeout(tRipeti); tRipeti = null; } }
      // "sono entrato" può perdersi (stanza non ancora pronta, host via un attimo):
      // lo ripeto finché l'host non mi mette dentro (il mio codice compare nei suoi messaggi).
      // Dopo un minuto e mezzo non smetto: rallento (uno ogni 10 secondi), così alla "Nuova partita" entro anch'io
      function insisti() {
        smetti(); nRipeti = 0;
        (function giro() {
          tRipeti = setTimeout(function () {
            tRipeti = null;
            if (dentro || chiusa || !entrata) return;
            pubblica(entrata); nRipeti++;
            giro();
          }, nRipeti < MAX_RIPETI ? RIPETI_ENTRATA : RIPETI_LENTO);
        })();
      }
      function fermaStanza(muta) {   // l'host non c'è: lo dico subito (l'app mostra "la stanza è ferma"); se torna, si entra da soli
        if (ferma) return;
        ferma = true; clearTimeout(tMuta); tMuta = null;
        evento("sg-stanza-ferma", { stanza: codice, ferma: true, muta: !!muta });
      }
      function collegato() {
        if (chiusa) return;
        var c = client;
        c.subscribe(T.stato, function () {
          if (chiusa || c !== client) return;
          if (!aperto) {
            aperto = true; cb.onAperto && cb.onAperto(myId);
            // l'host non si sente da 4 secondi (né dal vivo né, per chi guarda, con una foto): guardo nell'altro ufficio
            if (riserva()) tSonda = setTimeout(function () { tSonda = null; if (!chiusa && !vivo && !(opz.guarda && fotoViva)) sondaAltro(null); }, SONDA);
          }
          else if (entrata) pubblica(entrata);   // ricollegato dopo un buco: ripeto che ci sono (l'host non mi toglie)
          svuota();   // e mando le mosse fatte mentre la rete era giù
        });
      }
      // ---- la riserva ----
      // un collegamento che uso (o che potrei usare): i suoi avvisi contano solo se è quello di adesso
      function ascolta(c) {
        c.on("connect", function () { if (c !== client || chiusa) return; reteSu(); collegato(); });
        c.on("message", function (t, p, k) { if (c === client) messaggio(t, p, k); else if (c.sgSonda) c.sgSonda(t, p, k); });
        function caduto() { if (c === client && !chiusa) reteGiu(); }
        c.on("close", caduto); c.on("offline", caduto);
      }
      // il mio ufficio è giù: se resta giù 12 secondi (app in vista e telefono in rete) passo all'altro
      function reteGiu() {
        if (giuDa || !riserva() || !altroUfficio(ufficio)) return;
        giuDa = Date.now(); clearTimeout(tGiu); tGiu = setTimeout(controllaGiu, CAMBIO);
      }
      function reteSu() {
        giuDa = 0; clearTimeout(tGiu); tGiu = null;
        if (cambio) { var C = cambio; cambio = null; C.col.chiudi(); }   // il mio ufficio è tornato: resto qui
      }
      function controllaGiu() {
        tGiu = null;
        if (chiusa || !giuDa || (client && client.connected)) return;
        var visibile = true, inRete = true;
        try { visibile = !document.hidden; inRete = navigator.onLine !== false; } catch (e) {}
        // (in secondo piano o senza rete: non è colpa dell'ufficio; ricontrollo tra poco)
        if (!visibile || !inRete || !(entrata || opz.guarda) || cambio || sonda) { tGiu = setTimeout(controllaGiu, 2000); return; }
        passaAllAltro();
      }
      function passaAllAltro() {
        var url = altroUfficio(ufficio);
        if (!url || cambio) return;
        var C = cambio = { col: null };
        avvisoRiserva(codice);
        C.col = collega(opzioni(), function (c, u2) {
          if (chiusa || cambio !== C) { try { c.end(); } catch (e) {} return; }
          cambio = null;
          ascolta(c);
          prendi(c, C.col, u2, false);
        }, function () {
          if (cambio !== C) return;
          cambio = null;
          if (giuDa && !chiusa) tGiu = setTimeout(controllaGiu, CAMBIO);   // neanche l'altro risponde: riprovo più tardi
        }, { url: url });
      }
      // da ora uso il collegamento c (sull'ufficio url): chiudo quello di prima, rimando "sono entrato", le ultime mosse
      // (l'host scarta quelle che ha già) e la coda. iscritto = è già iscritto allo stato (la sonda)
      function prendi(c, col, url, iscritto) {
        var vecchio = client, vCol = collegamento;
        vivi = vivi.filter(function (x) { return x !== vecchio; });
        client = c; collegamento = col; ufficio = url; usato = url; vivi.push(c);
        if (col && col.sveglia) col.sveglia();
        giuDa = 0; clearTimeout(tGiu); tGiu = null;
        try { if (vecchio && vecchio !== c) vecchio.end(); } catch (e) {}   // (uscita educata: niente "sparito")
        if (vCol && vCol !== col) vCol.chiudi();
        function rimanda() {
          if (chiusa || c !== client) return;
          if (!aperto) { aperto = true; cb.onAperto && cb.onAperto(myId); }
          if (entrata) { pubblica(entrata); if (!dentro) insisti(); }
          tagliaRecenti(); recenti.forEach(function (x) { pubblicaBusta(x.b); });
          svuota();
        }
        if (iscritto) rimanda(); else c.subscribe(T.stato, rimanda);
        if (dentro) ricordaUfficio(url);
      }
      // guardo in silenzio nell'altro ufficio: se lì l'host risponde DAL VIVO (al mio "sono entrato") passo lì.
      // Se lì c'è il suo testamento, o in 1,5 secondi non risponde, resto dove sono. poi(passato) quando ho deciso.
      function sondaAltro(poi) {
        var url = altroUfficio(ufficio);
        if (!url || !riserva() || chiusa || sonda || cambio || Date.now() - ultimaSonda < 10000) { if (poi) poi(false); return; }
        ultimaSonda = Date.now();
        var S = sonda = { c: null, col: null, finita: false }, tFine = null;
        function basta(passato) {
          if (S.finita) return;
          S.finita = true; if (sonda === S) sonda = null; clearTimeout(tFine); clearTimeout(tTot);
          if (!passato) { S.col.chiudi(); try { if (S.c) { S.c.sgSonda = null; S.c.end(); } } catch (e) {} }
          if (poi) poi(passato);
        }
        var tTot = setTimeout(function () { basta(false); }, SONDA);
        S.col = collega(opzioni(), function (c, u2) {
          S.c = c;
          if (S.finita || chiusa) { try { c.end(); } catch (e) {} return; }
          ascolta(c);
          c.sgSonda = function (t, p, k) {
            if (S.finita) return;
            var tx = p.toString(), m = null; try { m = JSON.parse(tx || "null"); } catch (e) {}
            if (!m || typeof m !== "object") return;
            var trat = !!(k && k.retain), s = m._s || ((m.t === "__hostqui" || m.t === "__hostgone") ? m.s : null);
            if (s && scartate[s]) return;
            if (opz.decideApp && sessione && s && s !== sessione) return;
            if (m.t === "__hostgone") { if (!m.voluto && (!sessione || !s || s === sessione)) basta(false); return; }   // anche lì è sparito
            if (trat && !(opz.guarda && m._s)) return;   // una foto trattenuta non basta (potrebbe essere vecchia): serve l'host dal vivo
            c.sgSonda = null;
            basta(true);
            prendi(c, S.col, u2, true);
            messaggio(t, p, k);
          };
          c.subscribe(T.stato, function () {
            if (S.finita) return;
            if (entrata) pubblicaBusta(busta(entrata), c);   // "sono entrato" anche qui: l'host risponde "ci sono"
            tFine = setTimeout(function () { basta(false); }, 1500);
          });
        }, function () { basta(false); }, { url: url, muto: true });
      }
      function messaggio(_t, payload, pacchetto) {
        if (chiusa) return;
        var testo = payload.toString(); if (!testo) return;
        var m; try { m = JSON.parse(testo); } catch (e) { return; }
        if (!m) return;
        var trattenuto = !!(pacchetto && pacchetto.retain), sparito = m.t === "__hostgone", eraVivo = vivo;   // (eraVivo: avevo già sentito l'host dal vivo)
        var s = m._s || ((m.t === "__hostqui" || sparito) ? m.s : null);
        // una sessione lasciata apposta (seguiHost): niente di quello che manda conta più
        if (s && scartate[s]) return;
        // un "host sparito" di una sessione vecchia (il broker se n'è accorto tardi e l'host intanto ha riaperto): non conta.
        // Con decideApp conta solo quello della sessione che seguo (anche quando l'host chiude apposta)
        if (sparito && s && sessione && (opz.decideApp ? s !== sessione : (!m.voluto && s < sessione))) return;
        // "host sparito" su questo ufficio: forse l'host ha perso solo questo. Intanto che lo aspetto guardo nell'altro:
        // se lì risponde passo lì (e la sua risposta dal vivo toglie l'attesa, come quando l'host torna)
        if (sparito && !m.voluto && riserva() && (!opz.decideApp || !sessione || s === sessione)) sondaAltro(null);
        var seguita = false;   // (decideApp) l'app ha appena scelto di seguire questa sessione: il messaggio l'ha già visto
        if (opz.decideApp && s && sessione && s !== sessione) {
          // la foto di un'altra Sala sullo stesso codice: decide l'app (regola della Sala) e, se vuole, chiama seguiHost
          if (m.t === "__hostqui" || sparito) return;
          var eraDentroA = dentro;
          if (cb.onMsg) cb.onMsg(m);
          if (chiusa || sessione !== s) return;   // l'app non la segue: per me non esiste
          if (cb.onHostNuovo) cb.onHostNuovo(eraDentroA, eraVivo, m);
          if (chiusa) return;
          seguita = true;
        }
        if (!trattenuto && !sparito) {   // l'host c'è, dal vivo
          vivo = true; clearTimeout(tMuta); tMuta = null;
          if (ferma) { ferma = false; evento("sg-stanza-ferma", { stanza: codice, ferma: false }); }
          if (tAddio) { clearTimeout(tAddio); tAddio = null; avvisaHost(T.stato, false); cb.onHostVia && cb.onHostVia(false); }
        }
        if (m._s && !sparito) fotoViva = true;
        // (un "host sparito" non cambia mai la sessione che conosco: uno di una sessione più nuova non deve far scartare
        // come "vecchio" il testamento vero del mio host)
        if (s && !sparito && (!sessione || (!opz.decideApp && s > sessione))) {
          var prima = sessione; sessione = s;
          if (prima) {   // l'host ha riaperto la stanza (pagina ricaricata, app riaperta): si rientra da capo
            var eraDentro = dentro;
            dentro = false; foto = false; presente = false;
            if (entrata) { pubblica(entrata); insisti(); }
            if (cb.onHostNuovo) cb.onHostNuovo(eraDentro, eraVivo, m);
            if (chiusa) return;   // (l'app ha riavviato il gioco con un collegamento nuovo)
          }
        }
        var mio = !delCore(m) && testo.indexOf('"' + myId + '"') >= 0;
        if (entrata && !dentro && mio) { dentro = true; smetti(); clearTimeout(tMuta); tMuta = null; if (riserva() && ufficio) ricordaUfficio(ufficio); }   // l'host mi ha messo nella partita
        if (m._s) { foto = true; presente = mio; }
        if (m.t === "__hostqui" || seguita) return;
        if (sparito) {
          if (m.voluto) { cb.onChiuso && cb.onChiuso({ voluto: true }); return; }   // chiusa apposta
          // non ero ancora dentro (sono appena arrivato): la stanza è ferma, lo dico subito e aspetto che torni
          // (chi aveva già sentito l'host dal vivo, anche se non è ancora "dentro", lo aspetta come gli altri)
          if (!dentro && !eraVivo && !opz.guarda) return fermaStanza(false);
          // ero dentro, sparito all'improvviso (schermo bloccato, cambio app): gli do tempo di tornare (e lo dico sullo schermo)
          if (!tAddio) { avvisaHost(T.stato, true); tAddio = setTimeout(function () { tAddio = null; avvisaHost(T.stato, false); if (!chiusa) cb.onChiuso && cb.onChiuso({ sparito: true }); }, ATTESA_HOST); }
          cb.onHostVia && cb.onHostVia(true);   // un gioco con l'host di riserva può prendere il suo posto
          return;
        }
        cb.onMsg && cb.onMsg(m);
      }
      collegamento = collega(opzioni(), function (c, url) {
        client = c; ufficio = url; usato = url; vivi.push(c);
        ascolta(c);
        collegato();
      }, function (e) { if (!chiusa) cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); }, { urls: uffici() });
      function fine() {
        chiusa = true; togli(h); smetti(); collegamento.chiudi(); vivi = vivi.filter(function (x) { return x !== client; }); coda = []; recenti = [];
        clearTimeout(tMuta); tMuta = null; clearTimeout(tSonda); tSonda = null; clearTimeout(tGiu); tGiu = null;
        if (cambio) { cambio.col.chiudi(); cambio = null; }
        if (sonda) { var S = sonda; sonda = null; S.finita = true; S.col.chiudi(); try { if (S.c) S.c.end(); } catch (e) {} }
        if (tAddio) { clearTimeout(tAddio); tAddio = null; avvisaHost(T.stato, false); }
        if (tCi) { clearInterval(tCi); tCi = null; }
        if (ferma) { ferma = false; evento("sg-stanza-ferma", { stanza: codice, ferma: false }); }
      }

      var h = {
        codice: codice, mioId: myId,
        invia: function (msg) {
          if (chiusa) return;
          pubblica(msg);
          if (msg && msg.t === "join") {
            if (!entrata) {   // il primo "sono entrato": se per 8 secondi l'host non si fa sentire, la stanza non risponde
              primoJoin = Date.now();
              if (!dentro && !vivo && !ferma) tMuta = setTimeout(function () { tMuta = null; if (!chiusa && !vivo && !dentro) fermaStanza(true); }, MUTA);
            }
            entrata = msg; if (!dentro) insisti();
            // "ci sono", ogni tanto, solo se nel frattempo non ho mandato niente (meno messaggi = meno batteria)
            if (!tCi) tCi = setInterval(function () { if (!chiusa && Date.now() - ultimoInvio >= CI_SONO - 1000) pubblica({ t: "__ci" }); }, CI_SONO);
          }
        },
        // come sta il collegamento (per l'app: "Sei dentro", "Sto entrando…", "entri alla prossima"); ufficio = l'indirizzo che uso
        stato: function () {
          return { id: myId, aperto: aperto, chiusa: chiusa, dentro: dentro, presente: foto ? presente : dentro, foto: foto,
            vivo: vivo, ferma: ferma, entrato: primoJoin, sessione: sessione, ufficio: ufficio };
        },
        // l'app mi vede in saletta ma l'ultima foto dell'host non ha il mio id: chiedo di nuovo di entrare
        // (ero dentro e l'host mi ha tolto, oppure è cominciata una partita nuova e io aspettavo)
        riprova: function () {
          if (chiusa || !entrata) return;
          if (dentro) { dentro = false; pubblica(entrata); insisti(); return; }
          if (Date.now() - ultimoJoin > 3000) pubblica(entrata);
          if (!tRipeti) insisti();
        },
        // l'app ha deciso di seguire un host nuovo (la Sala è passata a un altro, o ha vinto un'altra Sala): da ora la sua
        // sessione è s, anche se è "più piccola" (orologi diversi). Quella di prima non conta più (nemmeno il suo
        // "host sparito"); si ripete "sono entrato" finché il nuovo host non mi mette dentro
        seguiHost: function (s) {
          if (chiusa) return;
          if (s) { s = String(s); if (sessione && sessione !== s) scartate[sessione] = 1; delete scartate[s]; sessione = s; }
          dentro = false; foto = false; presente = false;
          if (ferma) { ferma = false; evento("sg-stanza-ferma", { stanza: codice, ferma: false }); }
          if (entrata) { pubblica(entrata); insisti(); }
        },
        // l'app sa che per ora non entro (gioco a due già pieno: guardo): "sono entrato" solo ogni tanto, per non disturbare
        calma: function () { if (nRipeti < MAX_RIPETI) nRipeti = MAX_RIPETI; },
        // se ne va in silenzio (senza dire "esco"): serve all'host di riserva che sta per prendere il posto dell'host
        lascia: function () {
          if (chiusa) return;
          var c = client;
          fine();
          try { if (c) c.end(); } catch (e) {}
        },
        chiudi: function () {
          if (chiusa) return;
          var c = client;
          fine();
          try { if (c) { c.publish(T.azioni, JSON.stringify({ from: myId, data: { t: "__leave", voluto: 1 } }), { retain: false }); c.end(); } } catch (e) {}
        }
      };
      return segna(h, opz.tieni);
    },

    // Scopre QUALE gioco si sta giocando in una stanza, dal solo codice.
    // Così chi entra digitando il codice apre il gioco giusto e non un altro.
    // cb(idGioco, { ferma }) : idGioco = null se non c'è nessuna stanza con quel codice;
    // ferma = l'host è sparito (chi entra lo saprà subito). Risponde 2 secondi dopo l'iscrizione (non 10).
    // Con la riserva chiede a tutti e due gli uffici insieme: vince il primo che ha il gioco con l'host vivo
    // (se un ufficio è giù non si aspetta: risponde quello che c'è).
    scopriGioco: function (codice, cb) {
      if (!this.disponibile()) { cb(null, {}); return; }
      var C = String(codice).toUpperCase(), META = BASE + C + "/meta", STATO = BASE + C + "/stato";
      var fatto = false, tMax = null, tResto = null;
      var L = uffici().map(function (url, n) { return { url: url, n: n, client: null, col: null, g: null, ferma: false, statoVisto: false, finito: false, tFine: null }; });
      function fine(x) {
        if (fatto) return; fatto = true; clearTimeout(tMax); clearTimeout(tResto);
        L.forEach(function (y) { clearTimeout(y.tFine); if (y.col) y.col.chiudi(); try { if (y.client) y.client.end(true); } catch (e) {} });
        // (nessuno ha deciso da solo: il gioco con l'host vivo, se no quello di un ufficio qualsiasi)
        if (!x) x = L.filter(function (y) { return y.g && !y.ferma; })[0] || L.filter(function (y) { return y.g; })[0] || null;
        cb((x && x.g) || null, { ferma: !!(x && x.ferma) });
      }
      // un ufficio ha detto la sua: col gioco e l'host vivo basta questo; se no aspetto gli altri (al massimo 1,5 secondi in più)
      function detto(x) {
        if (fatto || x.finito) return;
        x.finito = true; clearTimeout(x.tFine);
        if (x.g && !x.ferma) return fine(x);
        if (L.every(function (y) { return y.finito; })) return fine(null);
        if (!tResto) tResto = setTimeout(function () { fine(null); }, 1500);
      }
      L.forEach(function (x) {
        x.col = collega({ clean: true, reconnectPeriod: 0 }, function (c) {
          x.client = c;
          if (fatto) { try { c.end(true); } catch (e) {} return; }
          c.on("message", function (topic, payload) {
            if (fatto || x.finito) return;
            var m = null; try { m = JSON.parse(payload.toString() || "null"); } catch (e) {}
            if (topic === META) {
              x.g = m && m.g;
              clearTimeout(x.tFine); x.tFine = setTimeout(function () { detto(x); }, x.statoVisto ? 0 : 400);   // (lo stato di solito arriva subito dopo)
            } else {
              x.statoVisto = true; x.ferma = !!(m && m.t === "__hostgone" && !m.voluto);
              if (x.g) detto(x);
            }
          });
          c.subscribe([META, STATO], function () { if (!fatto && !x.finito && !x.g) x.tFine = setTimeout(function () { detto(x); }, 2000); });
        }, function () { detto(x); }, { url: x.url, muto: x.n > 0 });   // (l'avviso di rete lento solo per il primo, come prima)
      });
      tMax = setTimeout(function () { fine(null); }, 10000);   // il collegamento non arriva proprio
    },

    // Sbircia in più stanze (le Compagnie della home) con UN collegamento solo, che legge e chiude subito:
    // niente "📶 Mi ricollego…" sullo schermo. codici: al massimo 12 (maiuscole, senza doppioni).
    // cb(esito) una volta sola: esito[C] = { stato, msg, gen }
    //   stato "viva" = c'è la foto di una Sala (o di una partita) con l'host; "ferma" = l'host è sparito (testamento);
    //   "vuota" = non c'è niente; "boh" = il collegamento non è arrivato. msg = il messaggio letto (o null);
    //   gen = msg.gen o msg.g (la generazione della Sala) o 0.
    // Risponde 400 ms dopo l'iscrizione (o subito, se hanno già risposto tutte), al massimo dopo 6 secondi.
    // Con la riserva: un collegamento per ufficio; "viva" se un ufficio la dice viva (subito appena sono tutte vive), se
    // no "ferma" se uno la dice ferma; un ufficio giù non si aspetta più di 1,5 secondi dopo che l'altro ha risposto.
    sbircia: function (codici, cb) {
      var lista = [], visti = {};
      (Array.isArray(codici) ? codici : [codici]).forEach(function (c) {
        c = String(c == null ? "" : c).trim().toUpperCase();
        if (c && !visti[c] && lista.length < 12) { visti[c] = 1; lista.push(c); }
      });
      var esito = {}, fatto = false, tMax = null, tResto = null, perTopic = {};
      lista.forEach(function (c) { perTopic[topics(c).stato] = c; });
      var L = uffici().map(function (url) { return { url: url, client: null, col: null, arrivato: false, finito: false, es: {}, n: 0, tFine: null }; });
      // il migliore dei due: viva batte ferma e vuota; a parità la generazione più alta
      function meglio(a, b) { if (!a) return b; if (!b) return a; if ((a.stato === "viva") !== (b.stato === "viva")) return a.stato === "viva" ? a : b; return b.gen > a.gen ? b : a; }
      function fine() {
        if (fatto) return; fatto = true; clearTimeout(tMax); clearTimeout(tResto);
        L.forEach(function (x) { clearTimeout(x.tFine); try { if (x.col) x.col.chiudi(); } catch (e) {} try { if (x.client) x.client.end(true); } catch (e) {} });
        var arrivato = L.some(function (x) { return x.arrivato; });
        lista.forEach(function (c) {
          var e = null; L.forEach(function (x) { e = meglio(e, x.es[c] || null); });
          esito[c] = e || { stato: arrivato ? "vuota" : "boh", msg: null, gen: 0 };
        });
        try { if (cb) cb(esito); } catch (e) {}
      }
      function tutteVive() { return lista.every(function (c) { return L.some(function (x) { return x.es[c] && x.es[c].stato === "viva"; }); }); }
      function finito(x) {
        if (fatto || x.finito) return;
        x.finito = true; clearTimeout(x.tFine);
        if (L.every(function (y) { return y.finito; })) return fine();
        if (!tResto) tResto = setTimeout(fine, 1500);
      }
      if (!lista.length || !window.SGNet.disponibile()) { setTimeout(fine, 0); return; }
      L.forEach(function (x) {
        x.col = collega({ clean: true, reconnectPeriod: 0 }, function (c) {
          x.client = c;
          if (fatto) { try { c.end(true); } catch (e) {} return; }
          x.arrivato = true;
          c.on("message", function (topic, payload) {
            var C = perTopic[topic];
            if (fatto || !C || x.es[C]) return;
            var m = null; try { m = JSON.parse(payload.toString() || "null"); } catch (e) { return; }
            if (!m || typeof m !== "object") return;
            var st = null;
            if (m.t === "__hostgone") { if (!m.voluto) st = "ferma"; }   // (chiusa apposta: tra poco è vuota)
            else if (m._s || m.t === "sala" || m.t === "__hostqui") st = "viva";
            if (!st) return;
            x.es[C] = { stato: st, msg: m, gen: +(m.gen || m.g) || 0 };
            if (tutteVive()) return fine();   // sono già tutte vive: non serve aspettare
            if (++x.n >= lista.length) finito(x);   // su questo ufficio hanno già risposto tutte
          });
          c.subscribe(Object.keys(perTopic), function () { if (!fatto && !x.finito) x.tFine = setTimeout(function () { finito(x); }, 400); });
        }, null, { url: x.url });   // (null = collegamento muto: niente avvisi sullo schermo)
      });
      tMax = setTimeout(fine, 6000);
    },

    // L'impronta di un profilo (uid): 12 caratteri (cifre e lettere minuscole), sempre uguale per lo stesso uid,
    // e dall'impronta non si torna all'uid. È l'"indirizzo" della presenza: seratagiochi/v1/u/<impronta>/…
    impronta: function (uid) { var x = fnv64(uid == null ? "" : uid); return sei36(x[0]) + sei36(x[1]); },

    // La presenza degli amici e gli inviti, su un collegamento suo (non è una stanza: chiudiGiochi non la chiude,
    // e la sua rete che salta non mostra "📶 Mi ricollego…").
    // io = { h: la mia impronta, stato: "app" | "gioco" | "sala", nascosto: true = parte senza farsi vedere }
    // cb = { onAmico(h, dati): un amico seguito è nell'app ({ on: 1, s, t }) o no ({ on: 0 });
    //        onInvito(dati): un invito per me (anche quello trattenuto trovato collegandosi);
    //        onMsg(dati): una risposta per me }
    // Topic: u/<h>/on (trattenuto; testamento trattenuto { on: 0 }), u/<h>/inv (trattenuto), u/<h>/msg (non trattenuto).
    // Lo stesso messaggio ripetuto (ricollegandosi torna quello trattenuto) arriva una volta sola.
    // Restituisce null se l'impronta non va o la rete non c'è.
    presenza: function (io, cb) {
      io = io || {}; cb = cb || {};
      var mio = String(io.h || "");
      if (!impOk(mio) || !this.disponibile()) return null;
      var stato = String(io.stato || "app"), nascosto = !!io.nascosto, chiusa = false, client = null, collegamento = null;
      var amici = [], ultimi = {}, attesa = [], togli = false, rimesso = 0, tRiprova = null;
      var T = { on: topicU(mio, "on"), inv: topicU(mio, "inv"), msg: topicU(mio, "msg") };
      function su() { return !!(client && client.connected && !chiusa); }
      function pubblica(topic, tx, trattieni) {
        if (!su()) return false;
        try { client.publish(topic, tx, { retain: !!trattieni }); return true; } catch (e) { return false; }
      }
      // (con la rete giù: parte appena torna; un invito per amico, l'ultimo; le risposte solo se di meno di 30 secondi fa)
      function oPoi(topic, tx, trattieni) {
        if (pubblica(topic, tx, trattieni)) return true;
        if (trattieni) attesa = attesa.filter(function (x) { return x.topic !== topic; });
        attesa.push({ topic: topic, tx: tx, r: !!trattieni, t: Date.now() }); if (attesa.length > CODA_MAX) attesa.shift();
        return false;
      }
      function svuota() { var ora = Date.now(), l = attesa; attesa = []; l.forEach(function (x) { if (x.r || ora - x.t < CODA_VITA) oPoi(x.topic, x.tx, x.r); }); }
      // il mio "on" (trattenuto): l'ora serve a chi lo legge per non credere a un "on" rimasto lì da ieri
      function dico() { pubblica(T.on, JSON.stringify(nascosto ? { on: 0, t: Date.now() } : { on: 1, s: stato, t: Date.now() }), true); }
      function iscrivi(lista) { if (su() && lista.length) try { client.subscribe(lista); } catch (e) {} }
      function onDi(h) { return topicU(h, "on"); }
      // a ogni collegamento, anche dopo un buco: dico se ci sono, mi iscrivo a inviti, risposte e amici
      function collegato() {
        if (chiusa || !client) return;
        if (togli && pubblica(T.inv, "", true)) togli = false;   // (prima di iscrivermi: l'invito già risposto non torna)
        dico();
        iscrivi([T.on, T.inv, T.msg].concat(amici.map(onDi)));
        svuota();
      }
      function messaggio(topic, payload, pacchetto) {
        if (chiusa) return;
        var tx = payload.toString(), trat = !!(pacchetto && pacchetto.retain);
        if (topic === T.on) {
          // il testamento di un mio collegamento di prima arriva in ritardo (il broker se ne accorge anche 30 secondi
          // dopo) e copre il mio "on": lo rimetto (al massimo una volta al secondo)
          if (!trat && tx === TESTAMENTO_ON && !nascosto && Date.now() - rimesso > 1000) { rimesso = Date.now(); dico(); }
          return;
        }
        if (ultimi[topic] === tx) return;
        ultimi[topic] = tx;
        if (!tx) return;   // (invito tolto)
        var d; try { d = JSON.parse(tx); } catch (e) { return; }
        if (!d || typeof d !== "object") return;
        if (topic === T.inv) { if (cb.onInvito) cb.onInvito(d); return; }
        if (topic === T.msg) { if (cb.onMsg) cb.onMsg(d); return; }
        var p = topic.split("/");   // seratagiochi/v1/u/<h>/on
        if (p.length === 5 && p[4] === "on" && amici.indexOf(p[3]) >= 0 && cb.onAmico) cb.onAmico(p[3], d);
      }
      function avvia() {
        if (chiusa) return;
        collegamento = collega({
          clean: true, reconnectPeriod: 5000, keepalive: PRES_KEEPALIVE,
          will: { topic: T.on, payload: TESTAMENTO_ON, retain: true }   // sparisco all'improvviso: per gli amici non ci sono più
        }, function (c) {
          client = c; vivi.push(c);
          c.on("connect", collegato); c.on("message", messaggio);
          collegato();
        }, function () { if (!chiusa) tRiprova = setTimeout(avvia, PRES_RIPROVA); },   // l'ufficio non risponde: niente pallini, riprovo con calma
        { url: primoUfficio(), muto: true });
      }
      avvia();
      var tRinfresca = setInterval(function () { if (!nascosto) dico(); }, PRES_RINFRESCA);

      return {
        h: mio,
        collegata: function () { return su(); },
        // gli amici da seguire (impronte; al massimo 200): una lista nuova toglie quelli che non ci sono più
        segui: function (lista) {
          if (chiusa) return;
          var nuovi = [], visto = {};
          (Array.isArray(lista) ? lista : []).forEach(function (h) {
            h = String(h == null ? "" : h);
            if (impOk(h) && h !== mio && !visto[h] && nuovi.length < PRES_MAX) { visto[h] = 1; nuovi.push(h); }
          });
          var via = amici.filter(function (h) { return !visto[h]; }).map(onDi);
          var piu = nuovi.filter(function (h) { return amici.indexOf(h) < 0; }).map(onDi);
          amici = nuovi;
          via.forEach(function (t) { delete ultimi[t]; });
          if (su() && via.length) try { client.unsubscribe(via); } catch (e) {}
          iscrivi(piu);
        },
        // dove sono ("app", "gioco", "sala"): lo ripubblica solo se è cambiato
        stato: function (s) {
          s = String(s || "app");
          if (chiusa || s === stato) return;
          stato = s; if (!nascosto) dico();
        },
        // true = per gli amici non ci sono (app in secondo piano, "non farti vedere"), ma inviti e risposte arrivano lo stesso
        nascondi: function (si) {
          si = !!si;
          if (chiusa || si === nascosto) return;
          nascosto = si; dico();
        },
        // un invito a un amico: resta trattenuto finché lui non lo toglie (o ne arriva un altro). true = partito adesso
        invita: function (hAmico, invito) {
          if (chiusa || !impOk(String(hAmico || "")) || !invito) return false;
          return oPoi(topicU(hAmico, "inv"), JSON.stringify(invito), true);
        },
        // una risposta (non trattenuta: vale solo adesso)
        rispondi: function (hDi, msg) {
          if (chiusa || !impOk(String(hDi || "")) || !msg) return false;
          return oPoi(topicU(hDi, "msg"), JSON.stringify(msg), false);
        },
        // toglie l'invito trattenuto per me (già risposto): chi si collega dopo non lo trova più
        togliInvito: function () {
          if (chiusa) return;
          if (!pubblica(T.inv, "", true)) togli = true;
        },
        // esco (profilo chiuso): per gli amici non ci sono più, poi uscita educata
        chiudi: function () {
          if (chiusa) return;
          pubblica(T.on, JSON.stringify({ on: 0, t: Date.now() }), true);
          chiusa = true; clearTimeout(tRiprova); clearInterval(tRinfresca); attesa = [];
          if (collegamento) collegamento.chiudi();
          vivi = vivi.filter(function (x) { return x !== client; });
          try { if (client) client.end(); } catch (e) {}
        }
      };
    }
  };
})();
