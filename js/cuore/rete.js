/* =========================================================
   PEZZO DEL CUORE — 📶 LA RETE (Passi 1, 5 e 6)
   Il rientro da ospite (pagina ricaricata, app riaperta), la memoria delle stanze, della Sala
   e della «Sala di ieri», la ripresa della partita dell'host (sg-ripresa), lo schermo sempre
   acceso, lo strato comune della rete (agganciaRete: avvolge SGNet.ospita/entra per tutti i
   giochi, nomi doppi, XP, host che torna), l'host di riserva (il vice, la copia __ris, il
   subentro), chi guarda soltanto (__guardo, la targhetta «👀 Guardi») e il controllo della rete.
   Restano nel cuore gli ascoltatori di quando l'app va in secondo piano (per tenere l'ordine di
   prima), salvaRipresaSubito e HOST_DI_RISERVA. Messaggi «__…»: vedi AGENTS.md.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var el = cuore.el, schermata = cuore.schermata, mostra = cuore.mostra, pillola = cuore.pillola, togliFerma = cuore.togliFerma,
      tornaHome = cuore.tornaHome, schermataHome = cuore.schermataHome, profiloAttivo = cuore.profiloAttivo, giocoDa = cuore.giocoDa,
      stessoNome = cuore.stessoNome, premiaPartita = cuore.premiaPartita, mioUidOnline = cuore.mioUidOnline, inviaChi = cuore.inviaChi,
      chiDa = cuore.chiDa, segnaRecentiDa = cuore.segnaRecentiDa, hostDiRiserva = cuore.hostDiRiserva, lasciaPartita = cuore.lasciaPartita,
      avviaPartita = cuore.avviaPartita;

  // ---- rientrare in una partita da ospite: se la pagina si ricarica o l'app si riapre, l'ultima stanza
  //      resta ricordata per un po' e in home compare "🔁 Rientra nella partita" (si torna la stessa persona: vedi SGNet.entra) ----
  var DURATA_RIENTRO = 3 * 3600 * 1000;
  function ricordaStanza(o) { try { o.t = Date.now(); localStorage.setItem("sg-ultima-stanza", JSON.stringify(o)); } catch (e) {} }
  function dimenticaStanza() { try { localStorage.removeItem("sg-ultima-stanza"); } catch (e) {} dimenticaLinkSessione(); }
  function stanzaRecente() {
    try {
      var o = JSON.parse(localStorage.getItem("sg-ultima-stanza") || "null");
      if (o && Date.now() - o.t < DURATA_RIENTRO && (o.sala || (o.gioco && o.stanza))) return o;
    } catch (e) {}
    return null;
  }
  // si rientra subito, senza ricaricare la pagina (come fa la Sala quando lancia un gioco)
  function rientraStanza(o) {
    if (o.sala) return cuore.salaOspite(o.sala);
    var g = giocoDa(o.gioco);
    if (!g) { dimenticaStanza(); return schermataHome(); }
    cuore.linkParams = { gioco: g.id, stanza: String(o.stanza).toUpperCase() };
    avviaPartita(g, [], {});
  }

  // ---- memoria delle stanze online (per non perdersi quando la pagina si ricarica) ----
  function leggiM(st, k) { try { return JSON.parse(st.getItem(k) || "null"); } catch (e) { return null; } }
  function scriviM(st, k, v) { try { if (v == null) st.removeItem(k); else st.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function sessione() { try { return window.sessionStorage; } catch (e) { return null; } }
  // il link con cui sono entrato (o la stanza in cui sono entrato col codice): resta solo in questa scheda,
  // così se la pagina si ricarica si torna da soli al proprio posto (il link non resta nell'indirizzo)
  function segnaLinkSessione(o) {
    var s = sessione(); if (!s) return;
    // (guarda: 1 = guardavo soltanto: ricaricando torno a guardare, non a giocare)
    scriviM(s, "sg-link", o.sala ? { sala: String(o.sala).toUpperCase(), t: Date.now() } : { gioco: o.gioco, stanza: String(o.stanza).toUpperCase(), guarda: o.guarda ? 1 : undefined, t: Date.now() });
  }
  function dimenticaLinkSessione() { var s = sessione(); if (s) scriviM(s, "sg-link", null); }
  // (finché si è dentro la stanza resta "recente": vedi agganciaRete; un link di ieri in una scheda riaperta non vale più)
  function linkSessione() { var s = sessione(), o = s && leggiM(s, "sg-link"); return o && (o.sala || (o.gioco && o.stanza)) && Date.now() - (o.t || 0) < DURATA_RIENTRO ? o : null; }
  // 🔑 la chiave segreta di una Sala o di una stanza (le foto cifrate di «Chi di Noi?»): la crea l'host e viaggia SOLO nel link,
  // dopo il # (mai al server, mai nei messaggi). Resta solo in questa scheda. crea: true = l'host la fa se non c'è; k = quella arrivata dal link
  var CHIAVI = {};
  function chiaveDi(codice, crea, k) {
    var c = String(codice || "").toUpperCase(); if (!/^[A-Z0-9]{4,8}$/.test(c)) return null;
    var s = sessione(), m = (s && leggiM(s, "sg-chiavi")) || CHIAVI;
    if (k && /^[A-Za-z0-9_-]{22}$/.test(k)) m[c] = k;
    else if (m[c] || !crea) return m[c] || null;
    else { try { var b = new Uint8Array(16); crypto.getRandomValues(b); m[c] = btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); } catch (e) { return null; } }
    CHIAVI = m; if (s) scriviM(s, "sg-chiavi", m);
    return m[c];
  }
  // la stanza che ho aperto io (gioco, codice, regole, nomi): se la pagina si ricarica o l'app si chiude, entro 20 minuti la riapro
  // con lo stesso codice e gli amici rientrano da soli. Si dimentica quando la chiudo apposta.
  var DURATA_MIA = 20 * 60 * 1000;
  function ricordaMiaStanza(o) { o.t = Date.now(); scriviM(localStorage, "sg-mia-stanza", o); }
  function dimenticaMiaStanza(codice) { var o = leggiM(localStorage, "sg-mia-stanza"); if (o && (!codice || o.codice === codice)) scriviM(localStorage, "sg-mia-stanza", null); scordaRipresa(codice); }
  function miaStanzaRecente() { var o = leggiM(localStorage, "sg-mia-stanza"); return o && o.gioco && o.codice && Date.now() - o.t < DURATA_MIA ? o : null; }
  // ---- La ripresa (Passo 5): la partita dell'host com'era, per riprenderla da dove era se la pagina si ricarica o l'app
  // si chiude (t.ricorda / t.ripresa). Una sola alla volta, vale 20 minuti come la stanza:
  // { gioco, codice, t, io, gen, stato, soloQui, nomeHost, ultimoRisultato }
  var DURATA_RIPRESA = DURATA_MIA;
  function leggiRipresa() { var o = leggiM(localStorage, "sg-ripresa"); return o && o.gioco && o.codice && o.stato != null && Date.now() - (+o.t || 0) < DURATA_RIPRESA ? o : null; }
  // quella di questo gioco e di questa stanza (null se non c'è o è vecchia)
  function ripresaDi(gioco, codice) { var o = leggiRipresa(); return o && codice && o.codice === String(codice).toUpperCase() && (!gioco || o.gioco === gioco) ? o : null; }
  function scordaRipresa(codice) { var o = leggiM(localStorage, "sg-ripresa"); if (o && (!codice || o.codice === String(codice).toUpperCase())) scriviM(localStorage, "sg-ripresa", null); }
  function scriviRipresa(o) {
    try {
      var tx = JSON.stringify(o);
      if (tx.length > 1500000) { console.warn("Ripresa di " + o.gioco + " troppo grande (" + tx.length + " caratteri): non la salvo"); return false; }
      localStorage.setItem("sg-ripresa", tx); return true;
    } catch (e) { console.warn("Ripresa non salvata: " + (e && e.message)); return false; }
  }
  // c'è una partita da riprendere per questa stanza ricordata (anche senza profilo: c'è il nome dell'host)
  function ripresaValida(mt) { var g = mt && giocoDa(mt.gioco); return !!(g && g.riprende && ripresaDi(g.id, mt.codice)); }
  // la Sala che ho aperto io: si salva a ogni invio a tutti e si riapre con lo stesso codice
  function ricordaMiaSala(o) { o.t = Date.now(); scriviM(localStorage, "sg-mia-sala", o); }
  function dimenticaMiaSala() { scriviM(localStorage, "sg-mia-sala", null); }
  function miaSalaRecente() { var o = leggiM(localStorage, "sg-mia-sala"); return o && o.codice && o.membri && Date.now() - o.t < DURATA_MIA ? o : null; }
  // "🔁 Riapri la Sala di ieri sera" (Passo 3): la mia ultima Sala normale (4 lettere, non Compagnia, non torneo a eliminazione)
  // con almeno un amico: codice e nomi degli amici (massimo 6). Vale 24 ore e NON si cancella chiudendo la Sala.
  // Nella stessa serata (meno di 12 ore) i nomi si sommano; il ✕ in home la cancella
  var DURATA_IERI = 24 * 3600 * 1000, SERA_IERI = 12 * 3600 * 1000;
  function ricordaSalaIeri(S) {
    if (!S || S.comp || S.elim || S.trasloco || !/^[A-HJ-NP-Z2-9]{4}$/.test(String(S.codice || ""))) return;
    var nomi = (S.membri || []).filter(function (m) { return m && m.id !== "host" && !m.ex && m.nome; }).map(function (m) { return String(m.nome).slice(0, 16); });
    if (!nomi.length) return;
    var o = leggiM(localStorage, "sg-sala-ieri"), ora = Date.now();
    if (o && o.codice === S.codice && Array.isArray(o.nomi) && ora - (+o.t || 0) < SERA_IERI) o.nomi.forEach(function (n) { if (n && !nomi.some(function (x) { return stessoNome(x, n); })) nomi.push(String(n).slice(0, 16)); });
    scriviM(localStorage, "sg-sala-ieri", { codice: S.codice, nomi: nomi.slice(0, 6), t: ora });
  }
  // la Sala di ieri da riaprire (o null): meno di 24 ore, almeno un nome, non è la Sala aperta adesso
  function salaDiIeri() {
    var o = leggiM(localStorage, "sg-sala-ieri");
    if (!o || !/^[A-HJ-NP-Z2-9]{4}$/.test(String(o.codice || "")) || !Array.isArray(o.nomi) || !o.nomi.length) return null;
    if (Date.now() - (+o.t || 0) > DURATA_IERI) return null;
    if ((cuore.sala && cuore.sala.codice === o.codice) || (cuore.salaG && cuore.salaG.codice === o.codice)) return null;
    return o;
  }
  function dimenticaSalaIeri(codice) { var o = leggiM(localStorage, "sg-sala-ieri"); if (o && (!codice || o.codice === codice)) scriviM(localStorage, "sg-sala-ieri", null); }
  // il nome usato in ogni stanza (chi non ha il profilo non lo riscrive ricaricando) e il nome dell'host
  function nomiStanze() { var o = leggiM(localStorage, "sg-nomi-stanze"); return o && typeof o === "object" ? o : {}; }
  function ricordaNomeStanza(codice, nome, host) {
    nome = String(nome || "").trim().slice(0, 16); if (!codice || !nome) return;
    var o = nomiStanze(), C = String(codice).toUpperCase(), ora = Date.now(), r = o[C] || {};
    if (host) r.h = nome; else r.n = nome;
    r.t = ora; o[C] = r;
    Object.keys(o).forEach(function (k) { if (!o[k] || ora - o[k].t > DURATA_RIENTRO * 4) delete o[k]; });   // si tiene solo l'ultima mezza giornata
    scriviM(localStorage, "sg-nomi-stanze", o);
  }
  function nomeStanza(codice, host) { var r = codice && nomiStanze()[String(codice).toUpperCase()]; return (r && (host ? r.h : r.n)) || ""; }

  // ---- schermo sempre acceso nelle partite online e nella Sala: se il telefono si blocca, il collegamento si ferma ----
  var schermoLock = null, schermoVoluto = false;
  function tieniAcceso(si) {
    schermoVoluto = !!si;
    if (!navigator.wakeLock) return;
    if (si && !schermoLock) navigator.wakeLock.request("screen").then(function (x) {
      if (!schermoVoluto) { x.release(); return; }
      schermoLock = x; x.addEventListener("release", function () { if (schermoLock === x) schermoLock = null; });
    }).catch(function () {});
    else if (!si && schermoLock) { try { schermoLock.release(); } catch (e) {} schermoLock = null; }
  }
  // cambiando app il telefono lo toglie da solo: tornando, lo rimettiamo

  // =========================================================
  //  STRATO COMUNE DELLA RETE — avvolge SGNet.ospita e SGNet.entra per tutti i giochi,
  //  così i giochi non devono fare niente di nuovo:
  //  - host: ricorda la stanza aperta (se la pagina si ricarica la riapre con lo stesso codice), cambia i nomi
  //    doppi ("Luca" e "Luca 2"; chi ha il profilo tiene il suo), manda "__esito" per gli XP;
  //  - ospite: ricorda il nome usato nella stanza, dice all'host se ha il profilo (pr:1), prende gli XP;
  //    nella Sala, se il gioco chiude la sua stanza, torna alla Sala senza schermata d'errore;
  //    se l'host riapre la stanza (pagina ricaricata) il gioco riparte pulito e rientra da solo nella saletta.
  //  I messaggi del core ("__…") non arrivano mai ai giochi.
  // =========================================================
  var reteOsp = null;     // la stanza di un gioco in cui sono entrato da ospite: { h, codice, P, guarda, sala }
  var NOMI_SEME = null;   // stanza riaperta: i nomi già dati (id -> nome), così ognuno ritrova il suo
  var PORTA_SEME = false; // stanza riaperta con la porta chiusa
  var RIPRESA_SEME = null; // (Passo 5, host di riserva) la partita che questo telefono prende in mano: la usa la prossima avviaPartita
  var PORTA_SALA_SEME = false;   // (lo stesso per la Sala)
  function delCore(m) { return !!(m && typeof m.t === "string" && m.t.slice(0, 2) === "__"); }
  // a che punto è la partita, da una foto che l'host manda a tutti: "lobby" (saletta), "fine" (classifica), "gioco" (il resto).
  // null = questa foto non lo dice (messaggio per uno solo, del core, o senza fase)
  function faseDaFoto(m) {
    if (!m || typeof m.t !== "string" || delCore(m) || m.to != null) return null;
    var v = m.vm && typeof m.vm.fase === "string" ? m.vm.fase : null;
    if (v) return v === "lobby" ? "lobby" : (v === "fine" ? "fine" : "gioco");
    if (m.t === "lobby") return "lobby";   // (i giochi che mandano la saletta a parte: Scopa, Pendolo, Horto…)
    if (m.t === "fine") return "fine";
    if (m.t === "via" || m.t === "inCorso") return "gioco";
    return null;
  }
  function impSalvabili(imp) { try { return JSON.parse(JSON.stringify(imp || {})); } catch (e) { return {}; } }
  // due con lo stesso nome nella stessa stanza: il secondo diventa "Luca 2". Lo stesso telefono tiene il nome che ha avuto;
  // due profili con lo stesso nome sono la stessa persona (niente numero). true = nome nuovo da ricordare
  function nomeUnico(nomi, conPr, id, m) {
    var n = String(m.nome || "").trim().slice(0, 16);
    if (!n) return false;
    if (nomi[id]) { m.nome = nomi[id]; return false; }
    function preso(x) { for (var k in nomi) if (k !== id && stessoNome(nomi[k], x)) return k; return null; }
    var k = preso(n);
    if (k && !(m.pr && conPr[k])) {
      var base = n.slice(0, 13), i = 2;
      while (preso(base + " " + i) && i < 99) i++;
      n = base + " " + i; m.nome = n;
    }
    nomi[id] = n; if (m.pr) conPr[id] = 1;
    return true;
  }
  // =========================================================
  //  L'HOST DI RISERVA (Passo 5, p5-b): nei giochi con riprende e riserva, se l'host sparisce del tutto (telefono
  //  spento, batteria) un amico porta avanti la partita da dove era. Fuori dai tornei (eliminazione e serata a punti
  //  sullo stesso telefono). Le regole, uguali su tutti i telefoni:
  //  - l'host scrive in ogni foto _g (il numero del cambio di host: 1, 2, 3…) e _h (l'id di chi tiene la partita);
  //    vince sempre il _g più alto, a pari _g l'id più piccolo (vinceSu). Gli ospiti scartano le foto "perdenti";
  //  - l'host manda una copia della partita (__ris, al massimo una al secondo, al massimo 60 KB, mai soloQui) ai due
  //    vice: i primi due amici arrivati e presenti (o quelli scelti dal gioco con t.vici);
  //  - quando l'host sparisce (testamento), il vice n° k aspetta 6 s × (k + 1) (60 s se l'host era appena uscito
  //    dall'app: pausa) e poi apre la stanza con lo stesso codice da host, con la copia (t.ripresa.daRiserva);
  //  - prima guardo, poi parlo (net.js): chi riapre o subentra legge la foto trattenuta e, se la tiene già un altro
  //    che vince, non pubblica niente e rientra da giocatore (cediPosto). Anche chi tiene la partita, se vede una foto
  //    che vince (onStato), cede il posto.
  // =========================================================
  var SUBENTRO_MS = 6000, SUBENTRO_PAUSA = 60000, RIS_MAX = 60000, RIS_OGNI = 1000;
  var RIS_HOST = null;   // la partita che tengo io con la riserva accesa (per la pausa: app in secondo piano)
  function riservaPer(P) {
    return !!(P && P.g && P.g.riprende && P.g.riserva && !(P.salaCtx && P.salaCtx.tabellone) && !(P.opts && P.opts.torneo));
  }
  // (g1, h1) vince su (g2, h2)? _g più alto; a pari _g l'id più piccolo
  function vinceSu(g1, h1, g2, h2) {
    g1 = +g1 || 0; g2 = +g2 || 0;
    if (g1 !== g2) return g1 > g2;
    return !!h1 && h1 !== h2 && (!h2 || String(h1) < String(h2));
  }
  // (solo per le prove: window.__sgSubentroMs = lo stesso tempo per tutti i vice)
  function attesaVice(k, pausa) {
    if (typeof window.__sgSubentroMs === "number") return window.__sgSubentroMs;
    return pausa ? SUBENTRO_PAUSA + SUBENTRO_MS * k : SUBENTRO_MS * (k + 1);
  }

  // ---- HOST ----
  // i nomi della stanza per la copia: id -> nome, col mio id (niente "__io")
  function nomiRiserva(RS) {
    var SV = RS.h && RS.h._sv, n = {};
    Object.keys((SV && SV.nomi) || {}).forEach(function (k) { if (k !== "__io") n[k] = SV.nomi[k]; });
    n[RS.hid] = RS.nome;
    return n;
  }
  // i vice: i primi due presenti (dentro, non 📶, non fatti uscire), prima quelli scelti dal gioco, poi in ordine d'arrivo
  function viciDi(RS) {
    var SV = RS.h && RS.h._sv; if (!SV) return [];
    function ok(id) { return !!id && id !== RS.hid && SV.dentro[id] && !SV.forse[id] && !SV.fuori[id] && !SV.andati[id] && RS.arrivi.indexOf(id) >= 0; }
    var l = [];
    (RS.P.viciScelti || []).concat(RS.arrivi).forEach(function (id) { if (l.length < 2 && ok(id) && l.indexOf(id) < 0) l.push(id); });
    return l;
  }
  // la copia della partita ai vice (stato = quello di t.ricorda; null = niente da portare avanti)
  function copiaRiserva(RS, stato) {
    if (RS.ceduto) return;
    if (stato == null) {
      RS.ult = null; clearTimeout(RS.tCopia); RS.tCopia = null; RS.faseCopia = null;
      if (RS.mandata && RS.h && !RS.h._chiusa) { RS.mandata = false; try { RS.h.inviaVeloce({ t: "__ris", g: RS.gen, vici: RS.vici, s: null }); } catch (e) {} }
      return;
    }
    RS.ult = stato;
    if ((stato && stato.fase) !== RS.faseCopia) return mandaCopia(RS);   // cambia la fase: subito
    if (RS.tCopia) return;
    RS.tCopia = setTimeout(function () { mandaCopia(RS); }, Math.max(0, RIS_OGNI - (Date.now() - RS.quando)));
  }
  function mandaCopia(RS) {
    clearTimeout(RS.tCopia); RS.tCopia = null;
    var h = RS.h;
    if (RS.ceduto || !h || h._chiusa || !RS.ult || !RS.P.viva()) return;
    RS.vici = viciDi(RS); RS.quando = Date.now();
    if (!RS.vici.length) return;
    var tx; try { tx = JSON.stringify(RS.ult); } catch (e) { return; }
    if (tx.length > RIS_MAX) {   // troppo grande: il gioco deve mettere i pezzi grossi in soloQui
      if (!RS.avvisato) { RS.avvisato = true; console.warn("Host di riserva: la copia di " + RS.P.g.id + " è troppo grande (" + tx.length + " caratteri): non la mando ai vice"); }
      return;
    }
    RS.faseCopia = RS.ult.fase; RS.mandata = true;
    try {
      h.inviaVeloce({ t: "__ris", g: RS.gen, ora: Date.now(), io: RS.hid, vici: RS.vici, n: nomiRiserva(RS),
        imp: impSalvabili(RS.P.tavolo ? RS.P.tavolo.impostazioni : RS.P.impostazioni), s: JSON.parse(tx) });
    } catch (e) {}
  }
  // i vice sono cambiati (uno è arrivato, uno se n'è andato): la copia subito ai nuovi
  function controllaVici(RS) {
    if (!RS.h) return;
    if (RS.ceduto || RS.h._chiusa || !RS.P.viva()) return fermaRiserva(RS);
    var v = viciDi(RS);
    if (v.join("|") !== (RS.vici || []).join("|") && RS.ult) mandaCopia(RS);
    else if (!RS.ult) RS.vici = v;
  }
  function fermaRiserva(RS) {
    clearTimeout(RS.tCopia); RS.tCopia = null; clearInterval(RS.tVici); RS.tVici = null;
    if (RIS_HOST === RS) RIS_HOST = null;
  }
  // le foto della mia stanza (anche le mie: ascoltaStato): una che vince → cedo il posto; una che perde (il vecchio host
  // tornato senza accorgersi, o l'altro vice partito insieme a me) → rimetto la mia ultima foto
  function statoRiserva(RS, s) {
    if (RS.ceduto || !s || typeof s !== "object" || s.t === "__hostgone" || s._g == null || !RS.h || RS.h._chiusa) return;
    if (s._s && s._s === RS.h.sessione) return;   // (la mia)
    if (vinceSu(s._g, s._h, RS.gen, RS.hid)) return cediPosto(RS, s);
    if (s._h !== RS.hid && RS.ultFoto && Date.now() - (RS.rimessa || 0) > 1000) { RS.rimessa = Date.now(); try { RS.h.invia(RS.ultFoto); } catch (e) {} }
  }
  // la stanza la tiene già un altro (guardaPrima o guardaRitorno: la foto trattenuta di un'altra sessione).
  // true = parlo io (copro la sua foto); false = non pubblico niente e cedo il posto
  function occupataRiserva(RS, m) {
    if (RS.ceduto) return false;
    if (!m || m._g == null) return true;   // (non è una partita con la riserva: la copro)
    var cedo = vinceSu(m._g, m._h, RS.gen, RS.hid);
    // (sto prendendo il posto dell'host sparito: se intanto la stanza è tornata viva con la partita che ho copiato,
    // tenuta da lui che ha riaperto o da un altro, non la prendo)
    if (!cedo && RS.P.ripresa && RS.P.ripresa.daRiserva && +m._g >= RS.gen - 1 && m._h !== RS.hid) cedo = true;
    if (!cedo) return true;
    setTimeout(function () { cediPosto(RS, m); }, 0);
    return false;
  }
  // cedo il posto: esco dalla stanza in silenzio (senza testamento e senza toccare la sua foto) e rientro da giocatore,
  // con lo stesso id di prima (l'host ritrova il suo posto). Dentro una Sala resto nel gioco con un ctx da amico
  function cediPosto(RS, s) {
    if (RS.ceduto) return;
    RS.ceduto = true; fermaRiserva(RS);
    var P = RS.P, h = RS.h, C = h.codice;
    var nome = (s && s._hn) || (h._sv && h._sv.nomi && s && h._sv.nomi[s._h]) || "un amico";
    try { h.lascia(); } catch (e) {}
    SGNet.ricordaId(C, RS.hid); scordaRipresa(C); dimenticaMiaStanza(C);
    if (!P.viva()) return;
    pillola("riapro", null); pillola("ripresa", null);
    pillola("riserva", P.ripresa && P.ripresa.daRiserva ? "👑 Ora la partita la tiene " + nome
      : "👋 Bentornato! Ora la partita la tiene " + nome + ": rientri come giocatore", "blu", 4000);
    var ctx = ctxDopoCeduto(P, C);
    lasciaPartita();
    cuore.linkParams = { gioco: P.g.id, stanza: C };
    avviaPartita(P.g, [], {}, null, ctx);
  }
  // il ctx di chi cede il posto dentro una Sala: un amico della Sala tiene il suo (esce senza chiudere niente);
  // l'host della Sala ne ha uno da amico: esce dal gioco senza chiuderlo agli altri, la Sala segue la fase e conta i punti
  function ctxDopoCeduto(P, code) {
    var ctx0 = P.salaCtx;
    if (!ctx0 || !cuore.sala || cuore.sala.ctx !== ctx0) return ctx0 || null;
    return ctxGiocoAmico(code);
  }
  // (anche per "Rientra ▶" dalla Sala: il gioco lo tiene un amico, io ci gioco da amico)
  function ctxGiocoAmico(code) {
    var contati = {};
    function mia() { return cuore.sala && cuore.sala.stanza === code; }
    function conta(g2, cl) {
      if (!mia() || cuore.sala.duello || !g2 || !cl || !cl.length) return;
      var k = JSON.stringify(cl.map(function (r) { return [r.nome, r.pos]; }));
      if (contati[k]) return;
      contati[k] = 1; cuore.salaRisultato(g2, cl);
    }
    var ctx = {
      stanza: code,
      esci: function () {
        lasciaPartita(); SGNet.chiudiGiochi();
        if (!cuore.sala) return schermataHome();
        if (cuore.sala.ctx === ctx) cuore.sala.ctx = null;
        cuore.sala.inGioco = false;
        if (mia()) { cuore.sala.fuori = cuore.sala.fuori || {}; cuore.sala.fuori.host = code; cuore.sala._bcast(); }   // (gli altri continuano)
        cuore.disegnaSalaHost();
      },
      cambia: function () { cuore.salaCambiaGioco(); },
      risultato: function (g2, cl) { conta(g2, cl); },
      // la classifica che manda chi tiene la partita (__esito): la Sala la conta una volta
      esito: function (g2, cl) { conta(g2, cl); },
      // a che punto è la partita (dalle foto di chi la tiene): la Sala lo dice a tutti
      fase: function (f) { if (mia() && cuore.sala.fase !== f) { cuore.sala.fase = f; if (cuore.sala._bcast) cuore.sala._bcast(); } },
      fine: function (g2, cl) {
        conta(g2, cl);
        var P2 = cuore.partitaCorrente && cuore.partitaCorrente.viva() && cuore.partitaCorrente.salaCtx === ctx ? cuore.partitaCorrente : null;
        if (!P2 || !g2 || !cl || !cl.length) return ctx.esci();
        cuore.fineSalaAmico(g2, cl, P2, ctx, false, function () { ctx.esci(); });
      },
      chiusa: function () { ctx.esci(); pillola("sala", "🏁 Partita finita: si torna in Sala", "verde", 2600); }
    };
    cuore.sala.ctx = ctx; cuore.sala.inGioco = true;
    return ctx;
  }
  // l'host di riserva sulla stanza appena aperta (dal wrapper di SGNet.ospita): opzioni di rete e cb
  function preparaRiserva(P, cb, opz) {
    var t = P.tavolo, pr = profiloAttivo();
    var RS = { P: P, gen: (P.ripresa && P.ripresa.gen) || 1, hid: (t && t.mioId) || "host", h: null, arrivi: [], vici: [],
      nome: (P.giocatori && P.giocatori[0]) || (pr && pr.nome) || "", ult: null, ultFoto: null, tCopia: null, quando: 0,
      faseCopia: null, mandata: false, ceduto: false, pausa: 0, tVici: null };
    opz = Object.assign({}, opz || {});
    opz.ascoltaStato = true;
    opz.testamento = Object.assign({}, opz.testamento || {}, { g: RS.gen });
    if (!opz.guardaRitorno) opz.guardaRitorno = 1200;
    // riapro dopo una ricarica, o prendo il posto dell'host sparito: prima guardo chi tiene la stanza
    if (P.ripresa) { if (!opz.guardaPrima) opz.guardaPrima = 1500; if (P.ripSopra && !opz.sopra) opz.sopra = P.ripSopra; }
    var onStatoG = cb.onStato, onOccG = cb.onOccupata;
    cb.onStato = function (s) { statoRiserva(RS, s); if (onStatoG && !RS.ceduto) return onStatoG.apply(this, arguments); };
    cb.onOccupata = function (m) { var si = occupataRiserva(RS, m); if (si && onOccG) return onOccG.apply(this, arguments); return si; };
    // riapro (ripresa) o mi ricollego dopo un buco e la stanza è vuota davvero (nemmeno il mio testamento): chi la teneva
    // dopo di me l'ha chiusa apposta, la partita è finita senza di me. Non la riapro da solo: torno in home
    // (solo se avevo già mandato una foto: prima della prima foto la stanza vuota l'ho pulita io)
    cb.onVuota = function () {
      if (P.salaCtx || RS.ceduto || !(P.ripresa || RS.ultFoto)) return true;
      RS.ceduto = true; fermaRiserva(RS);
      setTimeout(function () {
        var h = RS.h, C = h && h.codice;
        try { if (h) h.lascia(); } catch (e) {}
        if (C) { scordaRipresa(C); dimenticaMiaStanza(C); }
        if (!P.viva()) return;
        pillola("riapro", null); pillola("ripresa", null);
        lasciaPartita(); tornaHome();
        pillola("riserva", "🏁 La partita è finita mentre eri via", "blu", 4500);
      }, 0);
      return false;
    };
    return { RS: RS, opz: opz };
  }
  // le foto e i messaggi della stanza dicono chi tiene la partita (_g, _h, _hn; _p = l'host è uscito un attimo dall'app)
  function decoraRiserva(RS, h) {
    function dec(msg) {
      if (!msg || typeof msg !== "object" || Array.isArray(msg) || delCore(msg)) return msg;
      var o = Object.assign({}, msg); o._g = RS.gen; o._h = RS.hid; if (RS.nome) o._hn = RS.nome; if (RS.pausa) o._p = 1;
      return o;
    }
    var iv = h.invia, vv = h.inviaVeloce, ia = h.inviaA;
    h.invia = function (msg) { if (msg && typeof msg === "object" && !delCore(msg)) RS.ultFoto = msg; return iv.call(h, dec(msg)); };
    if (vv) h.inviaVeloce = function (msg) { return vv.call(h, dec(msg)); };
    if (ia) h.inviaA = function (id, msg) { return ia.call(h, id, dec(msg)); };
  }
  // l'host esce un attimo dall'app (WhatsApp per mandare il link): i vice aspettano 60 s invece di 6 se poi sparisce

  // ---- OSPITE ----
  // la copia della partita per i vice
  function prendiCopia(R, m) {
    var RR = R.ris, io = R.h && R.h.mioId;
    if (!RR || !m || !Array.isArray(m.vici) || +m.g < RR.gen) return;
    if (m.vici.indexOf(io) < 0 || m.s == null) { RR.copia = null; return; }   // (non sono più vice, o niente da portare avanti)
    RR.copia = { g: +m.g || 0, ora: +m.ora || Date.now(), arrivo: Date.now(), io: m.io, vici: m.vici.slice(), n: m.n && typeof m.n === "object" ? m.n : {},
      imp: m.imp && typeof m.imp === "object" ? m.imp : {}, s: m.s };
  }
  // una foto con _g: false = è di chi ha perso (il gioco non la vede). Se tiene la partita un altro (_g più alto, o a pari
  // _g l'id più piccolo) seguo lui (seguiHost: anche se ha l'orologio indietro) e lo dico: "👑 Ora la partita la tiene Luca"
  function fotoRiserva(R, m) {
    var RR = R.ris, g = +m._g || 0;
    if (m._p) { if (!RR.pausaVista) RR.pausaVista = Date.now(); } else if (m._s) RR.pausaVista = 0;
    if (RR.gen && (g < RR.gen || (g === RR.gen && m._h !== RR.hid && !vinceSu(g, m._h, RR.gen, RR.hid)))) return false;
    if (g === RR.gen && m._h === RR.hid) {   // lo stesso di prima (anche tornato dopo una ricarica)
      if (m._s) RR.sess = m._s;
      if (RR.hq) { var f = RR.hq; RR.hq = null; f(); }
      return true;
    }
    var primo = !RR.gen, prima = RR.hid;
    RR.gen = g; RR.hid = m._h || null; if (m._hn) RR.nome = m._hn;
    clearTimeout(RR.tVice); RR.tVice = null;
    var st = R.h && R.h.stato ? R.h.stato() : null;
    if (m._s) { RR.sess = m._s; if (!primo && st && !st.chiusa && st.sessione !== m._s) try { R.h.seguiHost(m._s); } catch (e) {} }
    if (RR.hq) { clearTimeout(RR.hqT); RR.hq = null; }
    if (!primo && prima !== RR.hid && R.P && R.P.viva()) {
      pillola("tornato", null); pillola("host", null);
      pillola("riserva", "👑 Ora la partita la tiene " + (m._hn || (R.h._sv && R.h._sv.nomi && R.h._sv.nomi[m._h]) || "un amico"), "blu", 4000);
    }
    return true;
  }
  // l'host è sparito (via) o tornato: il vice aspetta il suo turno e poi prende il posto
  function viceVia(R, via) {
    var RR = R.ris; if (!RR) return;
    clearTimeout(RR.tVice); RR.tVice = null;
    if (!via) return;
    var c = RR.copia, io = R.h && R.h.mioId;
    if (!c || !c.s || c.g !== RR.gen || !R.P || !R.P.viva()) return;
    var k = c.vici.indexOf(io); if (k < 0) return;
    var pausa = (!!RR.pausaVista && Date.now() - RR.pausaVista < cuore.VICE_PAUSA) ||
      (RR.hid === "host" && R.P.salaCtx && cuore.salaG && !!cuore.salaG.pausaVista && Date.now() - cuore.salaG.pausaVista < cuore.VICE_PAUSA);   // (l'host della Sala è uscito un attimo)
    RR.tVice = setTimeout(function () { RR.tVice = null; subentraGioco(R); }, attesaVice(k, pausa));
  }
  // prendo il posto dell'host sparito: lascio la stanza da ospite e la riapro da host con lo stesso codice e la copia
  // (il gioco parte da host con t.ripresa.daRiserva: nessun codice nuovo nei giochi)
  function subentraGioco(R) {
    var RR = R.ris, P = R.P, c = RR && RR.copia;
    if (!RR || RR.fatto || !P || !P.viva() || !R.h || !c || !c.s || c.g !== RR.gen) return;
    var st = R.h.stato ? R.h.stato() : null; if (!st || st.chiusa) return;
    RR.fatto = true;
    var io = R.h.mioId, n = c.n || {};
    var mioNome = n[io] || nomeStanza(R.codice) || ((profiloAttivo() || {}).nome) || "Io";
    var vecchio = n[c.io] || RR.nome || "L'host";
    var seme = {}; Object.keys(n).forEach(function (k) { if (k !== "__io" && k !== io) seme[k] = n[k]; });
    try { R.h.lascia(); } catch (e) {}
    RIPRESA_SEME = { stato: c.s, io: io, gen: c.g + 1, daRiserva: true, vecchioHost: c.io, t: c.arrivo, scarto: c.arrivo - c.ora, sopra: st.sessione || null };
    NOMI_SEME = seme; SGNet._forza = R.codice; cuore.linkParams = {};
    pillola("host", null); pillola("tornato", null);
    pillola("riserva", "👑 " + vecchio + " è sparito: la partita la porti avanti tu", "blu", 4000);
    avviaPartita(P.g, [mioNome], Object.assign({}, c.imp || {}, { modo: "online" }), { modo: "online" }, P.salaCtx);
  }

  function agganciaRete() {
    if (!window.SGNet || SGNet.__strato) return;
    SGNet.__strato = true;
    var ospita = SGNet.ospita, entra = SGNet.entra;
    SGNet.ospita = function (giocoId, cb, opz) {
      cb = cb || {};
      var sala = giocoId === "__sala", P = cuore.partitaCorrente && cuore.partitaCorrente.viva() ? cuore.partitaCorrente : null;
      // i nomi già dati e il codice imposto valgono per la stanza a cui erano destinati: la Sala riaperta,
      // oppure la partita appena avviata (stanza riaperta dopo una ricarica, gioco lanciato dalla Sala)
      var seme = sala ? NOMI_SEME : (P && P.nomiSeme), portaSeme = sala ? PORTA_SALA_SEME : !!(P && P.portaSeme);
      if (sala) { NOMI_SEME = null; PORTA_SALA_SEME = false; } else if (P) { P.nomiSeme = null; P.portaSeme = null; }
      if (!sala && P && P.forza) { if (!(opz && opz.codice)) opz = Object.assign({}, opz || {}, { codice: P.forza }); P.forza = null; }
      // l'host di riserva (Passo 5): solo i giochi con riprende e riserva, fuori dai tornei
      var RIS = !sala && P && P.g.id === giocoId && riservaPer(P) ? preparaRiserva(P, cb, opz) : null;
      if (RIS) opz = RIS.opz;
      var nomi = seme || {}, conPr = {}, salva = null;
      var io = profiloAttivo(); if (io && io.nome) { nomi.__io = String(io.nome).trim().slice(0, 16); conPr.__io = 1; }   // il nome dell'host è suo
      // la saletta viva di questa stanza: chi è dentro, chi è pronto, chi si ricollega, chi è stato fatto uscire, la porta
      var SV = cuore.nuovoSV(true, "", sala); SV.nomi = nomi; SV.porta = portaSeme;
      if (!sala && cb.onGuarda) SV.onGuardo = function (id, n) { cb.onGuarda(id, n); };   // (chi guarda soltanto: vedi svGuardo)
      Object.keys(nomi).forEach(function (k) { if (k !== "__io") SV.dentro[k] = 1; });   // stanza riaperta: chi c'era rientra anche con la porta chiusa
      var onMsg = cb.onMsg, onAddio = cb.onAddio;
      SV.addio = function (id) { if (onAddio) onAddio.call(cb, id); };
      cb.onAddio = function (id) { cuore.svAddio(SV, id); };   // (una volta sola per ognuno: uscito, sparito o fatto uscire)
      cb.onMsg = function (id, m) {
        if (m && m.t === "__guardo") { cuore.svGuardo(SV, id, m); return; }   // chi guarda soltanto (il gioco non lo vede)
        if (m && m.t === "join") {
          if (cuore.svRifiuta(SV, id)) return;   // fatto uscire, o nuovo con la porta chiusa: il gioco non lo vede
          if (nomeUnico(nomi, conPr, id, m) && salva) salva();
          var nuovo = !SV.dentro[id];
          SV.dentro[id] = 1; delete SV.andati[id];
          if (SV.pubblico[id]) { delete SV.pubblico[id]; cuore.fermaPubblico(SV); }   // guardava e adesso gioca
          if (RIS) { if (RIS.RS.arrivi.indexOf(id) < 0) RIS.RS.arrivi.push(id); controllaVici(RIS.RS); }   // (i vice: in ordine d'arrivo)
          cuore.svRiassunto(SV);   // (chi entra riceve subito chi è pronto e chi si ricollega)
          if (nuovo && SV.onDentro) SV.onDentro();
          // "Giocato di recente": l'uid di chi ha il profilo online (i join si ripetono: __chi solo se cambia qualcosa)
          if (!sala) { var uJ = typeof m.uid === "string" && m.uid ? m.uid.slice(0, 64) : null; if (nuovo || SV.uid[id] !== uJ) { SV.uid[id] = uJ; inviaChi(SV); } }
        }
        else if (SV.fuori[id]) return;   // chi è stato fatto uscire non conta più
        else if (m && (m.t === "__pronto" || m.t === "__faccina" || m.t === "__cisto")) cuore.svDaOspite(SV, id, m);
        if (delCore(m)) return;
        return onMsg ? onMsg.apply(this, arguments) : undefined;
      };
      var h = ospita.call(SGNet, giocoId, cb, opz);
      if (!h) return h;
      if (RIS) {   // (per prima: ogni foto e messaggio del gioco dice chi tiene la partita)
        var RS = RIS.RS; RS.h = h; P.riserva = RS; RIS_HOST = RS; decoraRiserva(RS, h);
        RS.tVici = setInterval(function () { controllaVici(RS); }, 2000);
      }
      SV.h = h; SV.codice = h.codice; h._sv = SV; h._P = sala ? null : P; cuore.SVH[SV.codice] = SV;
      var chiudiSV = h.chiudi, lasciaSV = h.lascia;
      // (stanza di un gioco chiusa o lasciata apposta: la sua partita non si riprende più)
      function viaSV() { clearTimeout(SV.tSl); clearTimeout(SV.tChi); clearInterval(SV.tPub); SV.tPub = null; if (cuore.SVH[SV.codice] === SV) delete cuore.SVH[SV.codice]; if (!sala) { h._chiusa = true; scordaRipresa(SV.codice); } }
      h.chiudi = function () { viaSV(); return chiudiSV.apply(h, arguments); };
      h.lascia = function () { viaSV(); return lasciaSV.apply(h, arguments); };
      if (!sala) cuore.reteXp = h;
      // la partita riprende da dove era (il gioco ha aperto con { ripresa: true }, vedi t.ripresa): gli amici non tornano
      // in saletta (net.js lo dice a tutti con r: 1 / _r: 1)
      // (il vice che prende il posto dell'host legge già «👑 … la porti avanti tu»)
      if (!sala && opz && opz.ripresa && !(P && P.ripresa && P.ripresa.daRiserva)) { pillola("riapro", null); pillola("ripresa", "🔁 Partita ripresa! Si continua da dove eravate", "verde", 3500); }
      // t.ricorda chiamato prima che la stanza ci fosse: si salva adesso che c'è il codice
      if (!sala && P && P.ripAperta) P.ripAperta();
      // la fase della partita di ogni stanza di gioco aperta da qui ("lobby" / "gioco" / "fine"), letta dalle foto che
      // l'host manda a tutti: SV.fase. Chi vuole saperlo quando cambia si mette in SV.suFase (SV.onFase la dice a tutti):
      // la stanza che si ricorda (qui sotto), la Sala (gioco in corso o saletta), poi il salvataggio e "__fase"
      if (!sala) {
        SV.fase = ""; SV.suFase = [];
        SV.onFase = function (f) { SV.suFase.forEach(function (fn) { try { fn(f); } catch (e) { setTimeout(function () { throw e; }, 0); } }); };
        // (Passo 6) a tutti, subito, quando cambia: "__fase" (chi guarda soltanto torna giocatore quando si torna in saletta)
        SV.suFase.push(function (f) { try { h.inviaVeloce({ t: "__fase", f: f }); } catch (e) {} cuore.svRiassunto(SV); });
        var inviaF = h.invia;
        h.invia = function (msg) {
          var f = faseDaFoto(msg);
          if (f && f !== SV.fase) {
            // dalla saletta si comincia a giocare: i "Ci sto" della partita prima non valgono più
            if (f !== "lobby" && (SV.fase === "lobby" || !SV.fase)) SV.cisto = {};
            SV.fase = f; SV.onFase(f);
          }
          return inviaF.apply(h, arguments);
        };
        // il gioco della mia Sala: la Sala dice a tutti a che punto è (chi arriva a partita in corso resta nella Sala)
        var SA = cuore.salaDiQui();
        if (SA && P && P.salaCtx && P.salaCtx === SA.ctx && SA.stanza === h.codice) cuore.salaSegueGioco(SA, SV);
        // il duello che ho aperto io (amico della Sala): la Sala deve sapere a che punto è
        else if (P && P.salaCtx && P.salaCtx.suStanza && P.salaCtx.duello === h.codice) P.salaCtx.suStanza(SV);
      }
      // la stanza che ho aperto io (non dalla Sala, non la partita col bot trasmessa a chi guarda):
      // la ricordo (gioco, codice, regole, nomi, fase) finché non la chiudo apposta
      if (!sala && P && !P.salaCtx && P.g.id === giocoId && (P.impostazioni || {}).modo === "online") {
        var C = h.codice, tVivo = null, salvata = 0;
        P.miaStanza = C;
        // (nomeHost: il mio nome nella partita, per riaprire e riprendere anche senza profilo)
        salva = function () { salvata = Date.now(); ricordaMiaStanza({ gioco: giocoId, codice: C, imp: impSalvabili(P.tavolo ? P.tavolo.impostazioni : P.impostazioni), nomi: nomi, fase: SV.fase, porta: SV.porta ? 1 : 0, nomeHost: (P.giocatori && P.giocatori[0]) || nomi.__io || "" }); };
        SV.salva = salva;
        SV.suFase.push(salva);   // (subito quando cambia la fase)
        salva();
        tVivo = setInterval(salva, 60000);   // "è ancora aperta" (vale 20 minuti dall'ultima volta)
        var invia = h.invia, chiudi = h.chiudi, lascia = h.lascia;
        h.invia = function (msg) {   // a ogni foto, al massimo ogni 3 secondi: regole aggiornate
          if (Date.now() - salvata > 3000) salva();
          return invia.apply(h, arguments);
        };
        h.chiudi = function () { clearInterval(tVivo); dimenticaMiaStanza(C); return chiudi.apply(h, arguments); };
        h.lascia = function () { clearInterval(tVivo); dimenticaMiaStanza(C); return lascia.apply(h, arguments); };
      }
      return h;
    };
    SGNet.entra = function (codice, cb, opz) {
      cb = cb || {};
      var C = String(codice).toUpperCase(), sala = !!(opz && opz.tieni);
      var P = !sala && cuore.partitaCorrente && cuore.partitaCorrente.viva() ? cuore.partitaCorrente : null;
      var guarda = !!(P && P.tavolo && P.tavolo.linkParams && P.tavolo.linkParams.guarda);
      var R = { codice: C, P: P, sala: sala, guarda: guarda, h: null,
        // (chi arriva tardi: ero già stato in questa stanza? Chi ricarica a metà partita non legge «🎉 Sei dentro!»)
        giaQui: !sala && !!nomeStanza(C) };
      // l'host di riserva (Passo 5): chi tiene la partita (_g, _h), la copia per i vice, la pausa dell'host
      var RR = R.ris = !sala && !guarda && riservaPer(P) ? { gen: 0, hid: null, nome: "", sess: null, copia: null, tVice: null, pausaVista: 0, fatto: false, hq: null, hqT: null } : null;
      var SV = cuore.nuovoSV(false, C, sala);   // la saletta viva vista da qui: chi è pronto, chi si ricollega, i nomi, la porta
      var onMsg = cb.onMsg;
      cb.onMsg = function (m) {
        if (RR && m && typeof m === "object") {
          if (m.t === "__ris") { prendiCopia(R, m); return; }
          if (m.t === "__rp") { RR.pausaVista = m.p ? Date.now() : 0; return; }
          if (m._g != null && !delCore(m) && !fotoRiserva(R, m)) return;   // (di chi ha perso il posto: il gioco non la vede)
        }
        if (m && m.t === "__esito") {
          if (!sala && !guarda && P && P.viva() && P.salaCtx && P.salaCtx.esito) try { P.salaCtx.esito(P.g, m.c); } catch (e) {}   // (l'host della Sala che gioca da amico: la Sala conta)
          if (!sala && !guarda && P && P.viva()) try { segnaRecentiDa(m.c, SV, P); } catch (e) {}   // "Giocato di recente"
          premiaPartita(m.c, true, C); return;   // gli XP: ognuno si dà i suoi
        }
        if (m && m.t === "__chi") { if (!sala) SV.chi = chiDa(m.l); return; }   // chi ha il profilo online in questa stanza (nome -> uid)
        if (delCore(m)) {
          if (m.t === "__sl") cuore.svArrivato(SV, m);
          else if (m.t === "__fa") { if (R.h && m.id !== R.h.mioId && cuore.FACCINE_SL.indexOf(m.f) >= 0) cuore.mostraFaccina(SV, m.id, String(m.n || "").slice(0, 16), m.f); }
          else if (m.t === "__via") { if (!guarda) cuore.contoVia(SV, m); }
          else if (m.t === "__fuori") { if (R.h && m.to === R.h.mioId && !guarda) cuore.fuoriDallaStanza(R, m.perche); }
          else if (m.t === "__torneino" && !sala) cuore.vaiAlTorneino(R, m);   // l'host ha fatto della stanza un torneino: si passa nella sua Sala
          else if (m.t === "__fase" && (m.f === "lobby" || m.f === "gioco" || m.f === "fine")) SV.fase = m.f;   // (Passo 6) a che punto è la partita
          // chi guarda soltanto: si torna in saletta → entra anche lui (fuori dalla Sala; vedi guardoFase)
          if (guarda && (m.t === "__fase" || m.t === "__sl")) guardoFase(R, m.t === "__fase" ? m.f : m.fa);
          return;
        }
        var fz = faseDaFoto(m); if (fz) SV.fase = fz;   // (a che punto è: sulla classifica una chiusura apposta non è "Collegamento perso")
        if (fz && guarda && guardoFase(R, fz)) return;   // (chi guardava entra a giocare: la partita vecchia non disegna più)
        if (fz && P && P.salaCtx && P.salaCtx.fase && P.viva()) try { P.salaCtx.fase(fz); } catch (e) {}   // (host della Sala che gioca da amico)
        return onMsg ? onMsg.apply(this, arguments) : undefined;
      };
      // nella Sala: se il gioco chiude la sua stanza (partita finita) si torna nella Sala, senza "Collegamento perso"
      var onChiuso = cb.onChiuso;
      if (P && P.salaCtx && P.salaCtx.chiusa) {
        cb.onChiuso = function () { if (P.viva()) return P.salaCtx.chiusa(); return onChiuso ? onChiuso.apply(this, arguments) : undefined; };
      }
      // fuori dalla Sala (e dal torneo): l'host non è tornato per 2 minuti → "La stanza è chiusa", uguale in tutti i giochi
      // (chi ha il suo host di riserva e chi guarda restano come sono)
      else if (P && !P.salaCtx && !guarda && !hostDiRiserva(P.g)) {
        cb.onChiuso = function (perche) {
          if (perche && perche.sparito && P.viva()) return stanzaChiusa(C);
          // chiusa apposta dall'host: ricaricando la pagina non si prova a rientrare, e in home niente "Rientra"
          if (perche && perche.voluto) {
            R.finita = true;
            var ls = linkSessione(), rs = stanzaRecente();
            if (ls && ls.stanza === C) dimenticaLinkSessione();
            if (rs && rs.stanza === C) try { localStorage.removeItem("sg-ultima-stanza"); } catch (e) {}
            // dalla classifica (l'host ha detto "fine: 1", o la partita era finita): il gioco non lo sa, la classifica resta
            // e resta "🏠 Esci"; solo la pillola "🚪 Paky ha chiuso la stanza" (2-14)
            if (P.viva() && (SV.chiusaFine || SV.fase === "fine")) {
              SV.chiusaFine = true; cuore.aggiornaFine(SV); cuore.togliVia();
              var chi = (SV.nomi && SV.nomi.host) || nomeStanza(C, true) || "L'host";
              pillola("chiusa", "🚪 " + chi + " ha chiuso la stanza", "grigia", 4000);
              return;
            }
          }
          return onChiuso ? onChiuso.apply(this, arguments) : undefined;
        };
      }
      var onHN = cb.onHostNuovo;
      // (msg = il messaggio dell'host nuovo: con r / _r la partita riprende da dove era, Passo 5)
      cb.onHostNuovo = function (eraDentro, eraVivo, msg) {
        if (onHN) try { onHN.apply(this, arguments); } catch (e) {}
        if (guarda) mandaGuardo(R, true);   // (l'host ha riaperto la stanza: gli dico subito che guardo)
        var info = { ripresa: !!(msg && (msg.r || msg._r)) };
        if (RR && msg && msg._g != null) {
          var gPrima = RR.gen, hPrima = RR.hid;
          // una sessione "più nuova" che però perde (es. il vecchio host tornato): resto con chi tiene la partita
          if (!fotoRiserva(R, msg)) { if (RR.sess) try { R.h.seguiHost(RR.sess); } catch (e) {} return; }
          if (gPrima && hPrima !== RR.hid) return;   // (la tiene un altro: "👑 Ora la partita la tiene…", già detto)
        } else if (RR && msg && msg.t === "__hostqui") {
          // "ci sono" non dice chi tiene la partita: la pillola giusta quando arriva la sua foto (al massimo 1,5 s)
          var fatto = false, fn = function () { if (fatto) return; fatto = true; clearTimeout(RR.hqT); RR.hq = null; hostTornato(R, eraDentro, eraVivo, info); };
          clearTimeout(RR.hqT); RR.hq = fn; RR.hqT = setTimeout(fn, 1500);
          return;
        }
        hostTornato(R, eraDentro, eraVivo, info);
      };
      // l'host è sparito (testamento) o tornato: il vice aspetta il suo turno e prende il posto
      var onHV = cb.onHostVia;
      if (RR) cb.onHostVia = function (via) { var r; if (onHV) try { r = onHV.apply(this, arguments); } catch (e) {} viceVia(R, via); return r; };
      // chi guarda soltanto: appena aperto (e poi ogni 20 s) dice all'host che guarda (i giochi a due in modo "guarda" non mandano join)
      if (guarda) {
        var onAp = cb.onAperto;
        cb.onAperto = function () {
          var r; if (onAp) r = onAp.apply(this, arguments);   // (il join del gioco diventa "__guardo": vedi qui sotto)
          mandaGuardo(R, false);
          if (!R.tGuardo) R.tGuardo = setInterval(function () { mandaGuardo(R, true); }, 20000);
          return r;
        };
      }
      var h = entra.call(SGNet, codice, cb, guarda ? Object.assign({}, opz || {}, { guarda: true }) : opz);
      if (!h) return h;
      R.h = h; SV.h = h; h._sv = SV;
      var invia = h.invia;
      h.invia = function (msg) {
        if (msg && msg.t === "join") {
          if (!sala && msg.nome) ricordaNomeStanza(C, msg.nome);   // ricaricando si rientra con lo stesso nome
          if (profiloAttivo()) msg.pr = 1;   // chi ha il profilo tiene il suo nome
          else if (msg.nome && msg.nome !== "Amico") try { localStorage.setItem("sg-nome-ospite", String(msg.nome).slice(0, 16)); } catch (e) {}   // la prossima volta è già scritto
          if (!sala) { var uM = mioUidOnline(); if (uM) msg.uid = uM; }   // "Giocato di recente": chi ha il profilo online si fa riconoscere
        }
        return invia.apply(h, arguments);
      };
      // chi guarda soltanto: il suo "join" diventa "__guardo" (l'host non lo vede mai come giocatore) e ogni altra mossa
      // che non è del core si butta (anche se il gioco disegna un tasto per sbaglio). Le faccine passano
      if (guarda) {
        R.inviaG = h.invia;
        h.invia = function (msg) {
          if (msg && msg.t === "join") { if (msg.nome) R.nomeG = String(msg.nome).slice(0, 16); return mandaGuardo(R, false); }
          if (!delCore(msg)) return;
          return R.inviaG.apply(h, arguments);
        };
        var chiudiG = h.chiudi, lasciaG = h.lascia;
        h.chiudi = function () { clearInterval(R.tGuardo); R.tGuardo = null; return chiudiG.apply(h, arguments); };
        h.lascia = function () { clearInterval(R.tGuardo); R.tGuardo = null; return lasciaG.apply(h, arguments); };
      }
      // finché sono dentro la stanza resta "recente" (se la pagina si ricarica rientro da solo, in home c'è "Rientra"),
      // anche in una serata lunga
      var marca = sala ? { sala: C } : (P && !P.salaCtx && !guarda ? { gioco: P.g.id, stanza: C } : null);
      if (marca) var tMarca = setInterval(function () {
        var st = h.stato ? h.stato() : null;
        if (!st || st.chiusa || R.finita) return clearInterval(tMarca);
        if (st.dentro) { ricordaStanza(Object.assign({}, marca)); segnaLinkSessione(marca); }
      }, 60000);
      if (!sala) { reteOsp = R; avviaControlloRete(); }
      return h;
    };
  }
  // ---- chi guarda soltanto (Passo 6) ----
  // "__guardo" { n: nome } all'host: all'apertura e poi ogni 20 s (dopo 50 s di silenzio l'host non lo conta più).
  // ripeti = è il giro dei 20 s (o l'host è nuovo): parte sempre; se no al massimo uno al secondo
  function mandaGuardo(R, ripeti) {
    var h = R && R.h, st = h && h.stato ? h.stato() : null;
    if (!h || !st || st.chiusa || R.finita || !R.P || !R.P.viva()) { if (R) { clearInterval(R.tGuardo); R.tGuardo = null; } return; }
    var ora = Date.now(); if (!ripeti && ora - (R.ultGuardo || 0) < 1000) return;
    if (!R.nomeG) try { R.nomeG = String(R.P.tavolo.nomeProfilo() || "").slice(0, 16); } catch (e) {}
    R.ultGuardo = ora;
    if (h._sv) h._sv.nomeGuardo = R.nomeG || "";   // (le mie faccine col mio nome)
    try { (R.inviaG || h.invia).call(h, { t: "__guardo", n: R.nomeG || "Pubblico" }); } catch (e) {}
  }
  // chi guarda soltanto e la partita torna in saletta (dopo averla vista giocare): entra anche lui, da solo.
  // Non nei giochi a due (lì si guarda e basta), non nel torneo a eliminazione e non nella Sala (lì lo fa la Sala).
  // true = si riparte da giocatore (la partita vecchia non disegna più)
  function guardoFase(R, f) {
    if (!R || !R.guarda || R.finita || R.torna || !f) return false;
    if (f !== "lobby") { R.vistoGioco = true; return false; }
    var P = R.P;
    if (!R.vistoGioco || !P || !P.viva() || P.salaCtx || cuore.aDue(P.g)) return false;
    R.torna = true;
    pillola("guardo", "✋ Si ricomincia: entri anche tu!", "verde", 2500);
    togliGuardo();
    lasciaPartita();
    try { R.h.chiudi(); } catch (e) {}   // (l'host mi toglie subito dal pubblico; poi entro con lo stesso id)
    cuore.linkParams = { gioco: P.g.id, stanza: R.codice };
    setTimeout(function () { avviaPartita(P.g, [], {}); }, 0);
    return true;
  }
  // la targhetta di chi guarda: in basso al centro "👀 Guardi · 😂 · ✕" (alta al massimo 44 px). Una per pagina, la stessa a
  // ogni schermata della partita (niente lampeggio); se ne va da sola quando la partita non c'è più.
  // 😂 apre (e chiude) sopra la targhetta la fila delle faccine; ✕ chiede "Smetti di guardare?" e si esce.
  // P.testoGuardo (facoltativo, p6-d): il testo al posto di "Guardi" (es. "Guardi · in coda: sei 2°")
  var GUARDO = null;   // { nodo, P, testo, fila, timer }
  function chipGuardo(P) {
    if (GUARDO && GUARDO.P !== P) togliGuardo();
    if (!GUARDO) {
      var G = GUARDO = { P: P, fila: null, timer: null };
      G.testo = el("span", { class: "sg-guardo-tx" });
      var bFa = el("button", { class: "sg-guardo-fa", type: "button", text: "😂", "aria-label": "Faccine", "aria-expanded": "false" });
      var bX = el("button", { class: "sg-guardo-x", type: "button", text: "✕", "aria-label": "Smetti di guardare" });
      G.nodo = el("div", { class: "sg-guardo", role: "group", "aria-label": "Stai guardando la partita" }, [ G.testo, bFa, bX ]);
      bFa.addEventListener("click", function () {
        if (G.fila) { cuore.togliNodo(G.fila); G.fila = null; bFa.setAttribute("aria-expanded", "false"); return; }
        var f = null; try { f = P.tavolo && P.tavolo.faccine(); } catch (e) {}
        if (!f) return;
        G.fila = el("div", { class: "sg-guardo-fila" }, [ f ]);
        document.body.appendChild(G.fila); bFa.setAttribute("aria-expanded", "true");
      });
      bX.addEventListener("click", function () {
        if (!P.viva() || !P.tavolo) return togliGuardo();
        P.tavolo.conferma("Smetti di guardare?", "Torni dove eri prima.", "Esci", function () { togliGuardo(); P.tavolo.esci(); });
      });
      document.body.appendChild(G.nodo);
      // la partita non c'è più (uscito, finita, si è tornati nella Sala o in home): via la targhetta
      G.timer = setInterval(function () { if (!P.viva() || !cuore.app || !cuore.app.querySelector(".schermata")) togliGuardo(); }, 1000);
    }
    var tx = "👀 " + (P.testoGuardo || "Guardi");
    if (GUARDO.testo.textContent !== tx) GUARDO.testo.textContent = tx;
  }
  function togliGuardo() {
    var G = GUARDO; if (!G) return;
    GUARDO = null; clearInterval(G.timer);
    cuore.togliNodo(G.nodo); if (G.fila) cuore.togliNodo(G.fila);
  }

  // l'host non è tornato in tempo (2 minuti): la stanza è chiusa. In home resta "Rientra": se la riapre, si torna dentro
  function stanzaChiusa(codice) {
    lasciaPartita(); SGNet.chiudiGiochi(); togliFerma(); dimenticaLinkSessione(); tieniAcceso(false);
    var s = schermata({ icona: "🚪", titolo: "La stanza è chiusa", sotto: "Stanza " + codice });
    s._contenuto.appendChild(el("p", { text: "Chi l'ha aperta non è tornato in tempo.", style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: tornaHome }));
    mostra(s);
  }
  // l'host ha riaperto la stanza (la sua pagina si è ricaricata, l'app si è riaperta): chi era dentro riparte pulito
  // dalla saletta, con lo stesso posto (stesso id). Il gioco vecchio non disegna più (partitaN).
  // info.ripresa (Passo 5): la partita riprende da dove era (t.ripresa dell'host): niente riavvio, solo la pillola; il
  // collegamento ripete già "sono entrato" e l'host rimette ognuno al suo posto
  function hostTornato(R, eraDentro, eraVivo, info) {
    // (la Sala si rimette a posto da sola; chi non aveva ancora chiesto di entrare rientra col join)
    // Anche chi per il collegamento non era "dentro" ma stava già giocando riparte: es. ricaricato a metà partita
    // in un gioco che nelle foto non mette gli id (l'host non l'ha riconosciuto), altrimenti resterebbe sul tavolo vecchio
    var st = R.h && R.h.stato ? R.h.stato() : null;
    if (R.sala || R.guarda || !(eraDentro || (eraVivo && st && st.entrato))) return;
    var P = R.P;
    if (!P || !P.viva() || hostDiRiserva(P.g)) return;
    var U = cuore.SL.ultimo, inSaletta = !!(U && !U.host && U.o && U.o._rete === R.h && document.body.contains(U.s));
    var nh = nomeStanza(R.codice, true);
    if (info && info.ripresa) {
      if (eraDentro || !inSaletta) pillola("tornato", "🔁 " + (nh || "L'host") + " è tornato: la partita riprende da dove era", "verde", 3500);
      return;
    }
    // (la partita non riprende: il gioco non lo sa fare, o la ripresa dell'host era scaduta → si riparte dalla saletta)
    if (eraDentro || !inSaletta) pillola("tornato", "🎉 " + (nh || "L'host") + " è tornato: si riparte dalla saletta", "verde", 3500);
    // ero già in saletta: basta rientrare (il collegamento ha già ripetuto "sono entrato"), niente da rifare sullo schermo
    if (inSaletta) return;
    try { R.h.lascia(); } catch (e) {}
    cuore.linkParams = Object.assign({}, P.tavolo.linkParams);
    avviaPartita(P.g, P.giocatori, P.impostazioni, P.opts, P.salaCtx);
  }
  // "👀 Partita in corso: la guardi ed entri alla prossima": chi è arrivato a partita cominciata (l'host non l'ha messo dentro).
  // Si toglie da sola quando compare la saletta (lì si entra) o quando l'host lo mette dentro.
  // Nei giochi a due (Tris…) chi è in più guarda: "👀 Giocano in due: tu guardi".
  // Ogni secondo ricontrolla anche il titolo della saletta ("Sto entrando…" → "tu guardi" anche senza foto nuove).
  var tControlloRete = null;
  function avviaControlloRete() { if (!tControlloRete) tControlloRete = setInterval(controllaRete, 1000); controllaRete(); }
  function controllaRete() {
    var R = reteOsp, st = R && R.h && R.h.stato ? R.h.stato() : null;
    if (!st || st.chiusa || !R.P || !R.P.viva()) {
      if (tControlloRete) { clearInterval(tControlloRete); tControlloRete = null; }
      pillola("prossima", null); return;
    }
    var U = cuore.SL.ultimo, inSaletta = !!(U && !U.host && document.body.contains(U.s));
    var guardi = inSaletta && U.o && U.o._rete === R.h && cuore.titoloSaletta(U, cuore.senzaTuFalso(U.o.giocatori || [], st), st) === false && (U.statoTit === "guardi" || U.statoTit === "spett");
    var fuori = !R.guarda && st.entrato && Date.now() - st.entrato > 2500 && !st.dentro && st.vivo && !st.ferma && !inSaletta;
    // chi arriva tardi: la pillola dice la verità secondo il gioco (g.ritardatari): "turno"/"mano" = entra dal prossimo
    // turno o dalla prossima mano; "subito" = gioca già da adesso (Parola d'ordine: entra nella squadra più piccola);
    // "partita" (di partenza) = guarda ed entra alla prossima partita
    var rit = R.P.g.ritardatari, dal = rit === "turno" ? "dal prossimo turno" : (rit === "mano" ? "dalla prossima mano" : (rit === "subito" ? "già da adesso" : null));
    var txF = cuore.aDue(R.P.g) ? "👀 Giocano in due: tu guardi" : (dal ? "✋ Partita in corso: giochi " + dal : "👀 Partita in corso: la guardi ed entri alla prossima");
    pillola("prossima", fuori ? txF : null, "grigia");
    if (fuori) R.tardi = true;
    // l'host mi ha messo nella partita in corso (non ci ero già stato: chi ricarica non lo legge): una volta "🎉 Sei dentro!"
    if (dal && !R.guarda && !R.dentroDetto && st.dentro) {
      var SVr = R.h._sv, faseR = SVr && SVr.fase;
      if (faseR === "gioco" && !inSaletta && (R.tardi || !R.giaQui)) pillola("dentro", "🎉 Sei dentro! Giochi " + dal, "verde", 3000);
      if (faseR) R.dentroDetto = true;
    }
    if ((guardi || (fuori && cuore.aDue(R.P.g))) && R.h.calma) R.h.calma();   // gioco a due già pieno: chiedo di entrare solo ogni tanto
  }

  // ---- un tasto che va avanti da solo: "Avanti ▶ 8" conta e a zero chiama fn (così nessuna schermata resta ferma) ----
  // nodo: un <button> (il numero si aggiunge al suo testo) oppure una scritta ("Si va avanti tra 8…" per chi aspetta).
  // fn = null: si vede solo il conto (gli ospiti; va avanti l'host). chiave: se il tasto viene ridisegnato con la
  // stessa chiave il conto continua da dov'era, invece di ripartire. Toccare il tasto ferma il conto (fa il tasto).

  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.agganciaRete = agganciaRete; cuore.chiaveDi = chiaveDi; cuore.chipGuardo = chipGuardo; cuore.controllaVici = controllaVici;
  cuore.copiaRiserva = copiaRiserva; cuore.ctxGiocoAmico = ctxGiocoAmico; cuore.dimenticaLinkSessione = dimenticaLinkSessione;
  cuore.dimenticaMiaSala = dimenticaMiaSala; cuore.dimenticaMiaStanza = dimenticaMiaStanza; cuore.dimenticaSalaIeri = dimenticaSalaIeri;
  cuore.dimenticaStanza = dimenticaStanza; cuore.fermaRiserva = fermaRiserva; cuore.impSalvabili = impSalvabili; cuore.linkSessione = linkSessione;
  cuore.miaSalaRecente = miaSalaRecente; cuore.miaStanzaRecente = miaStanzaRecente; cuore.nomeStanza = nomeStanza;
  cuore.ricordaMiaSala = ricordaMiaSala; cuore.ricordaNomeStanza = ricordaNomeStanza; cuore.ricordaSalaIeri = ricordaSalaIeri;
  cuore.ricordaStanza = ricordaStanza; cuore.rientraStanza = rientraStanza; cuore.ripresaDi = ripresaDi; cuore.ripresaValida = ripresaValida;
  cuore.riservaPer = riservaPer; cuore.salaDiIeri = salaDiIeri; cuore.scordaRipresa = scordaRipresa; cuore.scriviRipresa = scriviRipresa;
  cuore.segnaLinkSessione = segnaLinkSessione; cuore.stanzaRecente = stanzaRecente; cuore.tieniAcceso = tieniAcceso; cuore.togliGuardo = togliGuardo;
  Object.defineProperty(cuore, "GUARDO", { get: function () { return GUARDO; }, configurable: true });
  Object.defineProperty(cuore, "NOMI_SEME", { get: function () { return NOMI_SEME; }, set: function (v) { NOMI_SEME = v; }, configurable: true });
  Object.defineProperty(cuore, "PORTA_SALA_SEME", { get: function () { return PORTA_SALA_SEME; }, set: function (v) { PORTA_SALA_SEME = v; }, configurable: true });
  Object.defineProperty(cuore, "PORTA_SEME", { get: function () { return PORTA_SEME; }, set: function (v) { PORTA_SEME = v; }, configurable: true });
  Object.defineProperty(cuore, "RIPRESA_SEME", { get: function () { return RIPRESA_SEME; }, set: function (v) { RIPRESA_SEME = v; }, configurable: true });
  Object.defineProperty(cuore, "RIS_HOST", { get: function () { return RIS_HOST; }, configurable: true });
  Object.defineProperty(cuore, "SERA_IERI", { get: function () { return SERA_IERI; }, configurable: true });
  Object.defineProperty(cuore, "reteOsp", { get: function () { return reteOsp; }, configurable: true });
  Object.defineProperty(cuore, "schermoLock", { get: function () { return schermoLock; }, configurable: true });
  Object.defineProperty(cuore, "schermoVoluto", { get: function () { return schermoVoluto; }, configurable: true });
})();
