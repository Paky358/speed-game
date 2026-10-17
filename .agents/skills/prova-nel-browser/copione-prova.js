// COPIONE DI PROVA della saletta e dell'online (Passo 1: "niente più partite bloccate né porte sbagliate").
// Ripete da solo gli scenari con i telefoni finti (telefoni-finti.js, qui accanto) e scrive OK o NO.
// Servirà anche per i passi successivi: aggiungi gli scenari nuovi in fondo a SCENARI.
//
// Uso: servi la cartella (es. http://localhost:8973), apri una pagina qualsiasi del sito (es. /sw.js) e nello
// strumento javascript del browser:
//   const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
//   await COPIONE.prova(3)      // uno scenario (ognuno parte da zero: telefoni nuovi, broker vuoto)
//   await COPIONE.tutti()       // tutti, uno dopo l'altro (qualche minuto)
//   COPIONE.esiti               // ["3 OK · …", "1 NO · …"]
// Profili finti, mai account veri. Gli scenari 1, 2 e 6 dipendono anche dai giochi (Linea del tempo, Asta, Tris):
// finché i giochi non hanno le loro correzioni, rispondono NO e dicono perché.
// 1-10: gli scenari del progetto (Passo 1); 11-23: in più (Sala che si riapre, nome senza profilo, testamento in ritardo,
// host che non torna, partite intere di Tris, Scalinata e Linea del tempo, gioco che non ricopre la Sala, "Ho un codice",
// t.contoAvanti, Parola d'ordine, stanza che non risponde, torneo a eliminazione).
// 90-97: profilo e avatar obbligatori (p0): benvenuto, link, Sala, entrata senza domande, «Entra», «Bentornato», senza rete.
// 24-34: la saletta viva (Passo 4): chi arriva e chi esce, "Sono pronto", faccine, chi si ricollega, "Fai uscire" e porta
// chiusa, 3-2-1 per tutti, si parte da soli, musichetta 🎵/🔇, nomi buffi col 🎲, sei telefoni in uno schermo; 34: lo
// stesso nella Sala (faccine, "Fai uscire", porta chiusa che resta chiusa se l'host ricarica).
// I suoni sul computer di prova sono spenti: "pling", bip e musichetta si provano a codice (audioFinto registra le note).
// Passo 2 (una Sala per la serata): 35-37b "Online" = Sala (telefoni con salaSempre: true; gli scenari vecchi restano sul
// percorso di prima: i telefoni finti partono con sg-sala-sempre = "0"). Per i file di prova dei passi: COPIONE.aiuti (gli
// aiuti di qui), COPIONE.aggiungi(n, scenario), await COPIONE.carica("passo2/gruppo-a.js").
// 40-41 (p2-c): la home con «🔗 Gioca online» e «🔑 Ho un codice» in alto (aiuto apriSalaNuova; apriSala resta per il
// percorso vecchio) e «Ho un codice» a 4 caselle (aiuti batti, incolla, caselle).
// 42-44b (p2-d): chi arriva nei giochi della Sala: «Arrivano: 3 su 4», le sagome di chi manca, «▶ Comincia senza Marco»,
// chi arriva a partita in corso resta nella Sala («entri alla prossima · 👀 Guarda»), chi esce apposta non conta, chi
// ricarica torna al suo posto; 42b: sei nella Sala e due che mancano in uno schermo (aiuti salaConAmici, lanciaDallaSala, contaSl, sagome).
// 45 (p2-e): le regole visibili agli amici («📜 Si gioca così», «✨ Regole cambiate», chi arriva dopo; aiuto regoleDi).
// 46-49 (p2-f): la fine partita uguale per tutti: «↻ Rivincita · 👍 1» col 3-2-1 da solo, «🎮 Cambia gioco» che porta tutti,
// «👍 Ci sto!», chi è uscito («Comincia senza Luca»), fuori dalla Sala «Nuova partita (stessi amici)» ed «Esci» senza errori;
// 46b: la fine con 6 a misura (aiuti trisFinoAllaFine, tastiFineDi, misuraFine, misureFine, spiaVia, spiaTavolo).
// 50 (p2-g): il torneo dentro la Sala: ⚙️ «🏆 Contiamo i punti», la riga corta, i punti sopra i tasti di fine, «🏁 Chiudi e
// premia» e «↻ Nuovo torneo» che resta nella Sala.
// 51-53 (p2-h): «Chi gioca a Tris?» (siamo più dei posti: già scelti chi ha giocato meno, un tocco cambia), il duello senza
// l'host (lo apre un amico, gli altri guardano con «👥 Sala», l'esito va alla Sala, «⚔️ Altra sfida»), 4 posti con l'host
// sempre dentro (aiuti chiGioca, toccaChi, passaChiGioca, misuraChi, misureChi, toccaGiocoSala; lanciaDallaSala passa da
// «Chi gioca?» con chi è già scelto).
// 70-76 (p2-t): il torneino nei giochi a due con 3 o più persone: «Tris in N» (🏆 Torneino già scelto / ⚔️ Una sfida), chi resta
// in più (🤖 Bot partecipante vero / ⏭️ passa il turno), punti della serata, ricarica e uscita a metà, «🏆 Fate il torneino in N»
// dalla saletta (anche fuori dalla Sala), il tabellone in 10 senza scorrere (aiuti tn, viaTn, decidiTn, trisTn, finoAllaFineTn, misureTab…).
// 501-506 (p5-a, Passo 5): la ripresa comune col gioco finto «Contatore» (aiuti contatore, apriContatore, provaRipresa: l'host
// ricarica o chiude l'app e la partita riprende da dove era; esce apposta; ricarica sulla classifica; senza profilo; gioco che non riprende).
// 507-514 e "513b" (p5-b): l'host di riserva col Contatore { riserva: true } e 4 telefoni (aiuti apriRiserva, chiTiene, fotoDa,
// pilloleDi): l'host si spegne e un vice porta avanti la partita, il secondo vice, l'host che torna o riapre e rientra da
// giocatore, ricarica veloce e rete giù 4 s (nessun subentro), due vice insieme, vice con l'orologio indietro, gioco senza riserva;
// "514b"/"514c" nella Sala (Contatore { online: true }: l'host della Sala rientra da giocatore; il vice tiene gioco e poi Sala),
// "514d" la pausa (host uscito un attimo dall'app: il vice aspetta 60 s). Aiuti muore/torna: il telefono spento resta spento.
// 515-517 (p5-c): la ripresa nella Sala (l'host della Sala ricarica a metà gioco: Sala e gioco con gli stessi codici, la
// partita conta una volta), nel torneo a eliminazione (chi apre la partita ricarica) e nel duello (chi l'ha aperto ricarica,
// poi ricarica l'host della Sala: il duello continua). Aiuto mossaTris.
(function () {
  "use strict";
  var W = window;
  async function carica() {
    if (W.BR && W.apriTel) return;
    var src = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text();
    (0, eval)(src.split("// ===== ESEMPIO =====")[0]);
  }
  // i telefoni finti dicono "sì" da soli alle conferme dell'app (telefoni-finti.js): per provare "Resta" si ferma un attimo
  function fermaSiDaSolo() { clearInterval(W.__autoConferma); W.__autoConferma = null; W.__siFermo = true; }
  function riprendiSiDaSolo() {
    if (!W.__siFermo) return;
    W.__siFermo = false;
    W.__autoConferma = setInterval(function () { document.querySelectorAll("iframe").forEach(function (fr) { try { var b = fr.contentWindow.document.querySelector(".conferma-sfondo .btn-rosso:not([disabled])"); if (b) b.click(); } catch (e) {} }); }, 100);
  }
  // si riparte da zero: via i telefoni, broker vuoto, memorie vuote
  function pulisci() {
    Object.keys(W.BR.tel).forEach(function (n) { (W.BR.perNome[n] || []).forEach(function (c) { c.morto = true; c.connected = false; }); var f = document.getElementById("tel-" + n); if (f) f.remove(); });
    W.BR.clients = []; W.BR.retained = {}; W.BR.log = []; W.BR.perNome = {}; W.BR.mem = {}; W.BR.tel = {}; W.BR.conti = {}; W.BR.pubblici = {};
    W.BR.nube = {}; W.BR.amicizie = []; W.BR.storia = []; W.BR.congelati = {}; W.BR.spenti = {};   // (liste del profilo, amicizie, foto passate, telefoni fermi o spenti)
    riprendiSiDaSolo();   // (lo scenario 50 ferma per un attimo il "sì" da solo delle conferme)
    if (W.__cliccaVero) W.clicca = W.__cliccaVero;   // (lo scenario 48 conta i tocchi: se si è fermato a metà, si rimette com'era)
  }
  var T = function (w) { return W.testo(w).replace(/\s+/g, " "); };
  var pill = function (w) { return [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | "); };
  var dentro = function (w) { return /Sei dentro/.test(W.testo(w)); };
  function vm(cod) { return W.vmDi(cod) || {}; }
  function ids(cod, campo) { return ((vm(cod)[campo || "posti"]) || []).map(function (p) { return p.id; }); }
  function mioId(nome) { var h = W.reteDi(nome); return h && h.stato ? h.stato().id : null; }
  // il codice della stanza di questa saletta (nei giochi della Sala la testata mostra quello della Sala: la stanza sta in data-stanza)
  // (finché la stanza non ha il suo codice data-stanza non c'è: null, anche se la testata mostra già quello della Sala)
  // (4 lettere, o 6 per la Sala di una Compagnia; anche scritto spaziato "K F R T")
  function soloCodice(x) { x = String(x == null ? "" : x).replace(/\s+/g, ""); return /^([A-Z0-9]{4}|[A-Z0-9]{6})$/.test(x) ? x : null; }
  function codiceSaletta(w) { var c = w.document.querySelector(".sl-cod"); return c ? soloCodice(c.getAttribute("data-stanza")) : null; }
  // il codice scritto nella testata (quello da dare agli amici)
  function codiceTestata(w) { var b = w.document.querySelector(".sl-cod b"); return b ? soloCodice(b.textContent) : null; }
  function no(perche) { throw new Error(perche); }
  // la Scalinata va avanti da sola fino alla fine (gli umani scelgono a caso, l'host tocca "Prossimo round")
  async function scalinataFinoAllaFine(cod, umani, host) {
    var fine = Date.now() + 150000;
    while (Date.now() < fine) {
      var v = vm(cod);
      if (v.fase === "fine") return true;
      if (v.fase === "scelta") umani.forEach(function (n) { var w = W.finestra(n); if (w) W.clicca(w, new RegExp("^\\s*" + [1, 3, 5][Math.floor(Math.random() * 3)] + "\\s*gradin")); });
      if (v.fase === "rivela") W.clicca(W.finestra(host), /Prossimo round|Vedi il podio/);
      await W.dorme(400);
    }
    return false;
  }
  // una Sala online: l'host la apre dalla home, gli altri entrano dal link. torneo = "Torneo" → "Online"
  async function apriSala(host, torneo) {
    var w = W.finestra(host);
    if (torneo) { W.clicca(w, /Serata a punti \(più giochi|Torneo \(più giochi/); await W.dorme(250); W.clicca(w, /Online/, ".modo-grande"); }
    else if (!W.clicca(w, /Sala online/)) W.clicca(w, /Gioca online/, ".home-online button");   // (Sala sempre accesa: la home ha «🔗 Gioca online», p2-c)
    var cod = await W.aspetta(function () { return codiceSaletta(w); }, 5000);
    if (!cod) no("la Sala non ha il codice");
    return cod;
  }
  async function salaLanciaGioco(host, nomeGioco) {
    var w = W.finestra(host);
    if (!W.clicca(w, /Scegli (un|il primo) gioco|Prossimo gioco/)) no("non trovo 'Scegli un gioco' nella Sala");
    var tess = await W.aspetta(function () { return [].find.call(w.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === nomeGioco; }); }, 4000);
    if (!tess) no("non trovo " + nomeGioco + " tra i giochi della Sala");
    var etichetta = tess.innerText;
    tess.click(); await W.dorme(250);
    if (!W.clicca(w, /Comincia per tutti/)) no("non trovo 'Comincia per tutti'");
    var cod = await W.aspetta(function () { return codiceSaletta(w); }, 5000);
    return { cod: cod, etichetta: etichetta };
  }

  // ---- aiuti per la saletta viva (Passo 4) ----
  // un motore audio finto (sul computer di prova i suoni sono spenti): registra le note che partono, così il "pling", i bip
  // del 3-2-1 e la musichetta si provano a codice. Si mette con apriTel(nome, { prima: audioFinto }). w.__note = [{ f: Hz, t }]
  function audioFinto(w) {
    var t0 = Date.now(), note = w.__note = [];
    function par(v) { return { value: v, setValueAtTime: function (x) { this.value = x; return this; }, exponentialRampToValueAtTime: function () { return this; }, linearRampToValueAtTime: function () { return this; }, cancelScheduledValues: function () { return this; } }; }
    function nodo(o) { o = o || {}; o.connect = function () {}; o.disconnect = function () {}; return o; }
    function Finto() { this.state = "running"; this.sampleRate = 44100; this.destination = nodo(); Object.defineProperty(this, "currentTime", { get: function () { return (Date.now() - t0) / 1000; } }); }
    Finto.prototype.createOscillator = function () { var o = nodo({ type: "sine", frequency: par(440), detune: par(0) }); o.start = function (t) { note.push({ f: Math.round(o.frequency.value), t: t }); }; o.stop = function () {}; return o; };
    Finto.prototype.createGain = function () { return nodo({ gain: par(1) }); };
    Finto.prototype.createBiquadFilter = function () { return nodo({ type: "lowpass", frequency: par(1000), Q: par(1), gain: par(0) }); };
    Finto.prototype.createDynamicsCompressor = function () { return nodo({ threshold: par(0), ratio: par(1), knee: par(0), attack: par(0), release: par(0) }); };
    Finto.prototype.createBuffer = function (c, n) { return { getChannelData: function () { return new Float32Array(n); } }; };
    Finto.prototype.createBufferSource = function () { return nodo({ buffer: null, start: function () {}, stop: function () {} }); };
    Finto.prototype.resume = function () { return Promise.resolve(); };
    Finto.prototype.suspend = function () { return Promise.resolve(); };
    Finto.prototype.addEventListener = function () {};
    w.AudioContext = Finto; w.webkitAudioContext = Finto;
  }
  // la targa col nome e l'avatar di qualcuno nella saletta di un telefono ("Tu" per il proprio)
  // (il nome senza "si ricollega…", che sta nella targa sopra il nome)
  function nomeTarga(x) { var r = x.querySelector(".sl-ricollega"); return x.textContent.replace(r ? r.textContent : "", "").replace("👑", "").replace("🤖", "").trim(); }
  function targaDi(w, nome) { return [].find.call(w.document.querySelectorAll(".sl-targhe .sl-nome"), function (x) { return nomeTarga(x) === nome && !x.classList.contains("esce"); }) || null; }
  function avatarDi(w, nome) { var t = targaDi(w, nome); return t ? ([].find.call(w.document.querySelectorAll(".sl-av:not(.sl-vuoto)"), function (a) { return a._targa === t; }) || null) : null; }
  function pronto(w, nome) { var t = targaDi(w, nome); return !!(t && t.classList.contains("pronto")); }
  // lo stato della stanza scritto sotto il titolo della saletta dell'host ("🟡 Sto aprendo…", "🔒 Porta chiusa…")
  function statoHost(w) { var s = w.document.querySelector(".saletta-schermo > .testa .sotto"); return s ? s.textContent : ""; }
  // conta le faccine che compaiono sopra gli avatar di ogni telefono: c.n[i] (si azzera a mano), c.ultima[i]
  function contaFaccine(tel) {
    var c = { n: tel.map(function () { return 0; }), ultima: [] };
    tel.forEach(function (w, i) {
      new w.MutationObserver(function (lista) { lista.forEach(function (m) { [].forEach.call(m.addedNodes, function (x) { if (x.classList && x.classList.contains("sl-faccia")) { c.n[i]++; c.ultima[i] = x.textContent; } }); }); })
        .observe(w.document.querySelector(".sl-bolle"), { childList: true });
    });
    return c;
  }
  // un telefono a misura (larg x alt): niente scorre, i tasti in fondo si vedono, i nomi non si coprono e stanno nella stanza,
  // gli avatar pure. "" = tutto bene, se no il perché
  async function controllaSchermo(w, nome, larg, alt, nNomi) {   // nNomi: quanti nomi ci devono essere (di solito 6)
    nNomi = nNomi || 6;
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; } .sl-av, .sl-nome{ transition:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));   // (con la finestra nascosta il "resize" arriva tardi)
    await W.dorme(500);
    var sc = d.querySelector(".saletta-schermo"); if (!sc) return "non è nella saletta";
    var c = sc.querySelector(".contenuto"), stz = sc.querySelector(".sl-stanza").getBoundingClientRect();
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (c.scrollHeight > c.clientHeight + 1) return "il centro scorre (" + c.scrollHeight + " su " + c.clientHeight + ")";
    if (sc.querySelector(".piede").getBoundingClientRect().bottom > alt + 1) return "i tasti in fondo escono dallo schermo";
    var targhe = [].filter.call(d.querySelectorAll(".sl-targhe .sl-nome"), function (t) { return !t.classList.contains("esce"); }).map(function (t) { return { n: nomeTarga(t), r: t.getBoundingClientRect() }; });
    if (targhe.length < nNomi) return "nella saletta ci sono " + targhe.length + " nomi invece di " + nNomi;
    for (var i = 0; i < targhe.length; i++) {
      var a = targhe[i].r;
      if (a.left < stz.left - 1 || a.right > stz.right + 1 || a.bottom > stz.bottom + 1) return "il nome «" + targhe[i].n + "» esce dalla stanza";
      for (var j = i + 1; j < targhe.length; j++) { var b = targhe[j].r; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) return "i nomi «" + targhe[i].n + "» e «" + targhe[j].n + "» si coprono"; }
    }
    var avs = d.querySelectorAll(".sl-av:not(.va)");
    for (var k = 0; k < avs.length; k++) { var r = avs[k].getBoundingClientRect(), m = r.width * 0.2; if (r.left < stz.left - m || r.right > stz.right + m || r.top < stz.top - 1) return "un avatar esce dalla stanza"; }
    return "";
  }

  // ---- aiuti per il profilo obbligatorio (p0, 15 ott) ----
  // spiaProfilo: da mettere in apriTel(nome, { prima: spiaProfilo }): w.__visto segna le schermate del profilo comparse
  // (benvenuto, entra, bentornato, senza rete, editor dell'avatar), anche se sono durate un attimo
  function spiaProfilo(w) {
    w.__visto = [];
    new w.MutationObserver(function () {
      var d = w.document, segna = function (sel, nome) { if (d.querySelector(sel) && w.__visto.indexOf(nome) < 0) w.__visto.push(nome); };
      segna(".benvenuto-profilo", "profilo"); segna(".editor-avatar", "editor"); segna(".primo-avatar", "avatar");
    }).observe(w.document.documentElement, { childList: true, subtree: true });
  }
  // nel benvenuto: scrive nome (se dato) e password, tocca Avanti e poi "✅ Fatto" nell'editor. Restituisce il nome usato
  async function creaProfilo(w, nome, pwd) {
    var b = await W.aspetta(function () { return w.document.querySelector(".benvenuto-profilo:not(.bp-entra):not(.bp-bentornato):not(.bp-rete)"); }, 5000);
    if (!b) no("non c'è il benvenuto del profilo («" + T(w).slice(0, 60) + "»)");
    var campi = b.querySelectorAll("input.link-campo");
    if (nome != null) { campi[0].value = nome; campi[0].dispatchEvent(new w.Event("input", { bubbles: true })); }
    campi[1].value = pwd; var usato = campi[0].value.trim();
    if (!W.clicca(w, /^Avanti/)) no("nel benvenuto non c'è «Avanti»");
    await primoAvatar(w, 0, 0);
    return usato;
  }
  // il primo avatar (dal 15 ott, p2-z): "Sei lui o lei?" → "Scegli il tuo look" → "✅ Fatto" acceso solo dopo il look.
  // forma: 0 = lui, 1 = lei; look: il numero del look (0-7). Controlla che Fatto sia spento prima della scelta.
  async function primoAvatar(w, forma, look) {
    var d = w.document;
    var pa = await W.aspetta(function () { return d.querySelector(".primo-avatar .pa-forma"); }, 4000);
    if (!pa) no("dopo «Avanti» non si apre «Sei lui o lei?» (" + T(w).slice(0, 80) + ")");
    if (d.querySelector(".editor-avatar")) no("nel benvenuto si apre ancora l'editor intero");
    var fatto = d.querySelector(".primo-avatar .pa-fatto");
    if (!fatto || !fatto.disabled) no("«✅ Fatto» acceso prima di scegliere lui o lei");
    d.querySelectorAll(".primo-avatar .pa-forma")[forma].click();
    var lk = await W.aspetta(function () { return d.querySelectorAll(".primo-avatar .pa-look")[look]; }, 2000);
    if (!lk) no("dopo lui/lei non compaiono i look");
    if (d.querySelectorAll(".primo-avatar .pa-look").length < 6) no("meno di 6 look pronti");
    if (!fatto.disabled) no("«✅ Fatto» acceso prima di scegliere il look");
    lk.click();
    if (fatto.disabled) no("scelto il look, «✅ Fatto» resta spento");
    fatto.click();
    if (!await W.aspetta(function () { return !d.querySelector(".primo-avatar"); }, 4000)) no("toccato «Fatto», l'avatar resta aperto");
  }
  // la schermata del profilo a misura (larg x alt; alt piccola = tastiera aperta): niente scorre, il tasto e i campi si
  // vedono tutti. "" = tutto bene, se no il perché
  async function misuraProfilo(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; } .bp-logo, .om-benv{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(400);
    var sc = d.querySelector(".benvenuto-profilo, .editor-avatar"); if (!sc) return "non c'è la schermata del profilo";
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    var c = sc.querySelector(".contenuto"); if (c.scrollHeight > c.clientHeight + 1 && !sc.classList.contains("editor-avatar")) return "il centro scorre (" + c.scrollHeight + " su " + c.clientHeight + ")";
    var tasti = [].slice.call(sc.querySelectorAll(".piede .btn-primario, .om-azione.salva, input.link-campo"));
    for (var i = 0; i < tasti.length; i++) { var r = tasti[i].getBoundingClientRect(); if (r.height && (r.top < -1 || r.bottom > alt + 1 || r.right > larg + 1)) return "«" + (tasti[i].placeholder || tasti[i].textContent) + "» esce dallo schermo"; }
    return "";
  }
  async function misureProfilo(w, nome, tastiera) {
    var M = [[360, 640], [412, 915]].concat(tastiera ? [[360, 330], [412, 420]] : []), esiti = [];
    for (var k = 0; k < M.length; k++) { var e = await misuraProfilo(w, nome, M[k][0], M[k][1]); if (e) no(M[k][0] + "x" + M[k][1] + ": " + e); esiti.push(M[k][0] + "x" + M[k][1]); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return esiti.join(", ");
  }
  var home = function (w) { return !!w.document.querySelector(".schermata.home"); };

  // ---- aiuti per "Online = Sala" (Passo 2, p2-a) ----
  // il codice della Sala aperta (dalla foto trattenuta nel broker: { t: "sala", … }); null se non c'è
  function codiceSala() { return W.codici().filter(function (c) { return (W.statoStanza(c) || {}).t === "sala"; }).pop() || null; }
  // la tessera di un gioco nella home (o nella scelta dei giochi della Sala), col nome come nel titolo
  function tessera(w, nomeGioco) { return [].find.call(w.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === nomeGioco; }) || null; }
  // i testi dei modi di "Come giocate?" (uno per riga)
  function modiVisti(w) { return [].map.call(w.document.querySelectorAll(".modo-grande"), function (b) { return b.innerText.replace(/\s+/g, " ").trim(); }); }
  // segna se una scritta compare sul telefono, anche per un attimo: var s = spiaTesto(w, /…/); … s.stop() → il testo visto o ""
  function spiaTesto(w, re) {
    var visto = "", t = setInterval(function () { var tx = W.testo(w); var m = tx && tx.match(re); if (m && !visto) visto = m[0]; }, 25);
    return { stop: function () { clearInterval(t); return visto; } };
  }
  // l'host tocca la tessera del gioco e poi "Online con gli amici": è nella saletta del gioco dentro la Sala nuova.
  // Restituisce { S: codice della Sala, C: codice della stanza del gioco, tocchi }
  async function salaDaGioco(host, nomeGioco) {
    var w = W.finestra(host);
    var tess = await W.aspetta(function () { return tessera(w, nomeGioco); }, 5000);
    if (!tess) no("non trovo la tessera " + nomeGioco);
    tess.click(); await W.dorme(200);
    if (!W.clicca(w, /Online con gli amici/, ".modo-grande")) no("in «Come giocate?» non c'è «Online con gli amici» (" + modiVisti(w).join(" / ") + ")");
    var C = await W.aspetta(function () { return w.document.querySelector(".saletta-schermo") && codiceSaletta(w); }, 5000);
    if (!C) no("dopo «Online con gli amici» non si arriva nella saletta di " + nomeGioco + " («" + T(w).slice(0, 80) + "»)");
    var S = await W.aspetta(codiceSala, 3000);
    if (!S) no("nel broker non c'è la Sala");
    return { S: S, C: C, tocchi: 2 };
  }
  // l'id di qualcuno nella Sala (dai membri della foto della Sala)
  function idInSala(S, nome) { var m = (vm(S).membri || []).filter(function (x) { return x.nome === nome; })[0]; return m ? m.id : null; }

  // ---- aiuti per la home con la riga online (Passo 2, p2-c) ----
  // la Sala nuova: l'host tocca "🔗 Gioca online" in home ed è nella Sala (senza gioco). Restituisce il codice della Sala.
  // (apriSala resta per il percorso vecchio: "👥 Sala online" nel piede, con l'interruttore spento)
  async function apriSalaNuova(host) {
    var w = W.finestra(host);
    if (!await W.aspetta(function () { return w.document.querySelector(".home-online"); }, 5000)) no("in home non c'è la riga online («" + T(w).slice(0, 80) + "»)");
    if (!W.clicca(w, /Gioca online/, ".home-online button")) no("in home non c'è «🔗 Gioca online»");
    var S = await W.aspetta(function () { return w.document.querySelector(".saletta-schermo") && codiceSala(); }, 5000);
    if (!S) no("dopo «🔗 Gioca online» non si arriva nella Sala («" + T(w).slice(0, 80) + "»)");
    return S;
  }
  // la home a misura (larg x alt): i due tasti della riga online si vedono senza scorrere, niente esce di lato.
  // "" = tutto bene, se no il perché
  async function misuraHome(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(400); w.scrollTo(0, 0);
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato (" + d.documentElement.scrollWidth + " px)";
    var tasti = d.querySelectorAll(".home-online .btn");
    if (tasti.length !== 2) return "nella riga online ci sono " + tasti.length + " tasti";
    for (var i = 0; i < 2; i++) {
      var r = tasti[i].getBoundingClientRect();
      if (r.top < 0 || r.bottom > alt + 1 || r.left < 0 || r.right > larg + 1) return "«" + tasti[i].innerText.replace(/\s+/g, " ") + "» non si vede senza scorrere (" + Math.round(r.top) + "-" + Math.round(r.bottom) + ")";
      var sp = [].slice.call(tasti[i].children);
      for (var k = 0; k < sp.length; k++) if (sp[k].scrollWidth > sp[k].clientWidth + 1) return "la scritta «" + sp[k].textContent + "» è tagliata";
    }
    return "";
  }
  // "🔑 Ho un codice": scrive una lettera come la tastiera (il campo è uno solo, sopra le 4 caselle)
  function batti(w, ch) {
    var inp = w.document.querySelector("input.codice4-campo"); if (!inp) no("non c'è il campo del codice");
    if (inp.value.length >= 4) return;   // (maxlength 4: la tastiera non scrive la quinta)
    inp.value += ch; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
  }
  // incolla un testo nel campo del codice (come "Incolla" del telefono)
  function incolla(w, testo) {
    var inp = w.document.querySelector("input.codice4-campo"); if (!inp) no("non c'è il campo del codice");
    var dt = new w.DataTransfer(); dt.setData("text/plain", testo);
    var e = new w.ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
    if (inp.dispatchEvent(e)) { inp.value = String(testo).slice(0, 4); inp.dispatchEvent(new w.Event("input", { bubbles: true })); }   // (se nessuno l'ha fermato: il campo tiene 4 caratteri)
  }
  function caselle(w) { return [].map.call(w.document.querySelectorAll(".codice4-caselle span"), function (s) { return s.textContent; }).join(""); }

  // ---- aiuti per "chi arriva" (Passo 2, p2-d) ----
  // Paky apre la Sala nuova («🔗 Gioca online») e gli amici entrano dal link: { S: codice della Sala, w: { nome: finestra } }
  async function salaConAmici(amici) {
    var w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true }) };
    var S = await apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 10000)) no("nella Sala non sono entrati in " + (amici.length + 1) + " (" + ((vm(S).membri) || []).length + ")");
    return { S: S, w: w };
  }
  // dalla Sala (Sala sempre accesa) l'host sceglie un gioco: dritto nella saletta. Restituisce il codice della stanza del gioco
  async function lanciaDallaSala(host, S, nomeGioco) {
    var w = W.finestra(host);
    if (!await W.aspetta(function () { return W.clicca(w, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco» nella Sala");
    var tess = await W.aspetta(function () { return tessera(w, nomeGioco); }, 4000);
    if (!tess) no("non trovo " + nomeGioco + " tra i giochi della Sala");
    tess.click();
    await passaChiGioca(w);   // (siamo più dei posti: «Chi gioca?», si gioca con chi è già scelto)
    var C = await W.aspetta(function () { var c = codiceSaletta(w); return w.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 6000);
    if (!C) no("dopo " + nomeGioco + " l'host non è nella saletta del gioco («" + T(w).slice(0, 80) + "»)");
    return C;
  }
  // il contatore della saletta ("4 in sala", "Arrivano: 3 su 4") e i nomi sulle sagome di chi manca ("Marco…")
  function contaSl(w) { var c = w.document.querySelector(".sl-conta"); return c ? c.textContent : ""; }
  function sagome(w) { return [].filter.call(w.document.querySelectorAll(".sl-targhe .sl-nome.atteso"), function (t) { return !t.classList.contains("esce"); }).map(function (t) { return t.textContent; }).join(" | "); }
  // ---- aiuti per le regole visibili (p2-e) ----
  // il testo della riga "📜 Si gioca così: …" della saletta ("" se non c'è o è nascosta)
  function regoleDi(w) { var r = w && w.document.querySelector(".sl-regole-riga"); return r && !r.hidden ? r.querySelector(".sl-rr-testo").textContent : ""; }

  // ---- aiuti per la fine partita uguale per tutti (p2-f) ----
  // il Tris fino alla fine: host (X) e avversario (O) toccano la prima casella libera
  async function trisFinoAllaFine(C, host, avv) {
    var fino = Date.now() + 30000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), w = W.finestra(v.turno === "X" ? host : avv);
      if (v.fase === "gioco" && w) {
        var celle = w.document.querySelectorAll(".tr-cella"), k = (v.board || []).indexOf(null), n0 = (v.board || []).filter(Boolean).length;
        if (k >= 0 && celle[k] && !celle[k].disabled) { celle[k].click(); await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length > n0 || vm(C).fase === "fine"; }, 3000); continue; }
      }
      await W.dorme(120);
    }
    return vm(C).fase === "fine";
  }
  // i tasti di fine del core su un telefono (le scritte, nell'ordine; quelli nascosti e la riga dei punti no) o null se non ci sono
  function tastiFineDi(w) { var b = w && w.document.querySelector(".fine-tasti"); return b ? [].filter.call(b.querySelectorAll("button"), function (x) { return !x.hidden && !x.classList.contains("ft-punti"); }).map(function (x) { return x.textContent; }) : null; }
  // la schermata di fine a misura (larg x alt): niente scorre, i tasti si vedono interi, la riga dei tasti è alta al massimo
  // 120 px e nessuna scritta è tagliata. "" = tutto bene, se no il perché
  async function misuraFine(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(400); w.scrollTo(0, 0);
    var box = d.querySelector(".fine-tasti"); if (!box) return "non ci sono i tasti di fine";
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato (" + d.documentElement.scrollWidth + " px)";
    var r = box.getBoundingClientRect();
    if (r.bottom > alt + 1) return "i tasti escono dallo schermo (" + Math.round(r.bottom) + ")";
    if (r.height > 120) return "la riga dei tasti è alta " + Math.round(r.height) + " px";
    var tasti = box.querySelectorAll("button");
    for (var i = 0; i < tasti.length; i++) if (tasti[i].scrollWidth > tasti[i].clientWidth + 1) return "la scritta «" + tasti[i].textContent + "» è tagliata";
    var righe = d.querySelectorAll(".classifica li");
    for (var k = 0; k < righe.length; k++) { var rr = righe[k].getBoundingClientRect(); if (rr.bottom > r.top + 1 || rr.right > larg + 1) return "la riga «" + righe[k].textContent + "» va sotto i tasti o esce di lato"; }
    return "";
  }
  async function misureFine(w, nome) {
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) { var e = await misuraFine(w, nome, M[k][0], M[k][1]); if (e) no(nome + " a " + M[k].join("x") + ": " + e); fatte.push(M[k].join("x")); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return fatte.join(", ");
  }
  // segna su un telefono se compare il 3-2-1 (anche per poco): s.stop() → true/false
  function spiaVia(w) { var visto = false, t = setInterval(function () { if (w.document.querySelector(".sl-via")) visto = true; }, 25); return { stop: function () { clearInterval(t); return visto; } }; }
  // telefoni con la spia del tavolo (solo per le prove): opz.spiaTav = ["timeline"] → w.__tav = il tavolo dato al gioco
  // (si mette una volta, dopo che i telefoni finti sono caricati)
  function spiaTavolo() {
    if (W.__prepP2f || !W.preparaFinestra) return;
    W.__prepP2f = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepP2f(w, nome, opz);
      if (!opz || !opz.spiaTav) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id) { w.__reg = w.__reg || {}; w.__reg[g.id] = g; }   // (i giochi registrati, per nome e impostazioni)
          if (g && opz.spiaTav.indexOf(g.id) >= 0) { var av = g.avvia; g.avvia = function (t) { w.__tav = t; return av.apply(this, arguments); }; }
          return reg.apply(this, arguments);
        };
      } });
    };
  }


  // ---- aiuti per "Chi gioca a Tris?" e il duello (p2-h) ----
  // chi è scelto in "Chi gioca?" (i nomi, nell'ordine della griglia; l'host senza "(tu)"); null se la schermata non c'è
  function chiGioca(w) {
    var g = w && w.document.querySelector(".chi-gioca"); if (!g) return null;
    return [].filter.call(g.querySelectorAll(".cg-chi.scelto"), function () { return true; }).map(function (b) { return b.querySelector(".cg-nome").textContent.replace(/ \(tu\)$/, ""); });
  }
  // tocca qualcuno in "Chi gioca?"
  function toccaChi(w, nome) {
    var b = [].find.call(w.document.querySelectorAll(".chi-gioca .cg-chi"), function (x) { return x.querySelector(".cg-nome").textContent.replace(/ \(tu\)$/, "") === nome; });
    if (!b) no("in «Chi gioca?» non c'è " + nome);
    b.click();
  }
  // un gioco a due con 3 o più nella Sala apre prima «Tris in N» (p2-t): qui si sceglie «⚔️ Una sfida» e si va a «Chi gioca?». true = c'era
  async function sfidaDaTorneino(w) {
    var t = await W.aspetta(function () { return w.document.querySelector(".torneino-sc, .chi-gioca, .saletta-schermo"); }, 4000);
    if (!t || !t.classList.contains("torneino-sc")) return false;
    if (!W.clicca(w, /Una sfida/, ".tn-scelta")) no("in «Tris in N» non c'è «⚔️ Una sfida»");
    if (!W.clicca(w, /Scegli chi gioca/, ".piede button")) no("in «Tris in N» non c'è «Scegli chi gioca»");
    return true;
  }
  // se c'è "Chi gioca?" (siamo più dei posti), si gioca con quelli già scelti (dopo «⚔️ Una sfida», se c'è la scelta del torneino)
  async function passaChiGioca(w) {
    await sfidaDaTorneino(w);
    var c = await W.aspetta(function () { return w.document.querySelector(".chi-gioca") || w.document.querySelector(".saletta-schermo"); }, 4000);
    if (c && c.classList.contains("chi-gioca") && !W.clicca(w, /Si gioca/, ".piede button")) no("in «Chi gioca?» non si può toccare «▶ Si gioca»");
  }
  // "Chi gioca?" a misura (larg x alt): niente scorre, gli avatar e «Si gioca» si vedono. "" = tutto bene, se no il perché
  async function misuraChi(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(400); w.scrollTo(0, 0);
    var sc = d.querySelector(".chi-gioca-sc"); if (!sc) return "non c'è «Chi gioca?»";
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato";
    var c = sc.querySelector(".contenuto"); if (c.scrollHeight > c.clientHeight + 1) return "il centro scorre (" + c.scrollHeight + " su " + c.clientHeight + ")";
    var cose = [].slice.call(sc.querySelectorAll(".cg-chi, .piede .btn"));
    for (var i = 0; i < cose.length; i++) { var r = cose[i].getBoundingClientRect(); if (r.top < -1 || r.bottom > alt + 1 || r.left < -1 || r.right > larg + 1) return "«" + cose[i].textContent + "» esce dallo schermo"; }
    return "";
  }
  async function misureChi(w, nome) {
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) { var e = await misuraChi(w, nome, M[k][0], M[k][1]); if (e) no(nome + " a " + M[k].join("x") + ": " + e); fatte.push(M[k].join("x")); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return fatte.join(", ");
  }
  // l'host tocca "Scegli un gioco" e la tessera: dove arriva ("chi" = Chi gioca?, "saletta")
  async function toccaGiocoSala(w, nomeGioco) {
    if (!await W.aspetta(function () { return W.clicca(w, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco» nella Sala");
    var tess = await W.aspetta(function () { return tessera(w, nomeGioco); }, 4000);
    if (!tess) no("non trovo " + nomeGioco + " tra i giochi della Sala");
    var et = (tess.querySelector(".tess-adue") || {}).textContent || "";
    var tutte = [].map.call(w.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent + ": " + ((t.querySelector(".tess-adue") || {}).textContent || ""); });
    tess.click();
    var tn0 = await sfidaDaTorneino(w);   // (p2-t: prima «Tris in N», si sceglie la sfida)
    var dove = await W.aspetta(function () { return w.document.querySelector(".chi-gioca") ? "chi" : (w.document.querySelector(".saletta-schermo") && codiceSaletta(w) ? "saletta" : null); }, 4000);
    return { dove: dove, etichetta: et, tutte: tutte, torneino: tn0 };
  }
  // il Tris di un duello fino alla fine: muovono i due telefoni (chi apre è X)
  async function duelloTrisFinoAllaFine(C, a, b) { return trisFinoAllaFine(C, a, b); }

  var SCENARI = {
    // 1. Linea del tempo: chi è di turno non tocca "Avanti" e il gioco va avanti lo stesso in meno di 25 secondi
    1: { nome: "Linea del tempo: nessuno tocca 'Avanti', si va avanti da soli", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
      await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 8000)) no("non sono entrati in 3");
      W.clicca(P, /Comincia/);
      // turno di Paky (il primo): tocca uno spazio della linea e conferma
      var slot = await W.aspetta(function () { return vm(C).fase === "turno" && P.document.querySelector(".tl-slot"); }, 30000);
      if (!slot) no("il primo turno non è arrivato");
      slot.click(); await W.dorme(200);
      var conf = P.document.querySelector(".tl-conferma"); if (conf) conf.click();
      // votano Giulia e Luca
      if (!await W.aspetta(function () { return vm(C).fase === "votazione"; }, 8000)) no("niente votazione");
      for (var i = 0; i < 2; i++) { var n = ["Giulia", "Luca"][i]; var w = W.finestra(n); await W.aspetta(function () { return W.clicca(w, /Giusto/); }, 15000); }
      if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 12000)) no("niente risultato dopo il voto");
      var t0 = Date.now();
      // nessuno tocca "Avanti"
      var via = await W.aspetta(function () { return vm(C).fase !== "esito"; }, 25000, 250);
      if (!via) no("dopo 25 secondi la partita è ancora ferma sul risultato (serve il conto 'Avanti ▶' in timeline.js)");
      return "si va avanti da soli dopo " + Math.round((Date.now() - t0) / 1000) + " s";
    } },

    // 2. Asta coi temi: uno non vota e il voto si chiude a 60 secondi (oppure col tasto dell'host)
    2: { nome: "Asta coi temi: uno non vota, il voto si chiude lo stesso", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "L'Asta");
      await W.apriTel("Giulia", { hash: "gioco=asta&stanza=" + C, x: 185 });
      await W.apriTel("Luca", { hash: "gioco=asta&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 8000)) no("non sono entrati in 3");
      W.clicca(P, /Comincia/);
      // il pilota automatico fino al voto: gli ospiti scelgono la prima carta e passano, l'host va avanti
      var fine = Date.now() + 240000;
      while (Date.now() < fine && vm(C).fase !== "voto") {
        var v = vm(C);
        ["Giulia", "Luca"].forEach(function (n) {
          var h = W.reteDi(n), id = mioId(n); if (!h) return;
          if (v.fase === "scelta" && v.sceglieId === id) h.invia({ t: "scegli", idx: 0 });
          if (v.fase === "asta") h.invia({ t: "passa" });
        });
        if (v.fase === "scelta" && v.sceglieId === "host") { var carta = P.document.querySelector(".as-carta:not([disabled])"); if (carta) carta.click(); }
        if (v.fase === "asta") W.clicca(P, /^\s*Passo\s*$/);
        W.clicca(P, /Vedi le carte|Avanti|Si vota/);
        await W.dorme(500);
      }
      if (vm(C).fase !== "voto") no("non si è arrivati al voto (pilota automatico fermo in fase " + vm(C).fase + ")");
      // vota solo Giulia: Luca è distratto (e l'host non vota)
      W.reteDi("Giulia").invia({ t: "voto", voti: {} });
      var t0 = Date.now();
      var chiuso = await W.aspetta(function () { return vm(C).fase !== "voto" || W.clicca(P, /Chiudi il voto/); }, 65000, 500);
      if (!chiuso) no("dopo 65 secondi il voto è ancora aperto e l'host non ha 'Chiudi il voto' (serve il tempo nel voto di asta.js)");
      return "voto chiuso dopo " + Math.round((Date.now() - t0) / 1000) + " s";
    } },

    // 3. Giulia entra dal link, esce, apre una stanza sua: codice nuovo, e Paky non vede fantasmi
    3: { nome: "Il link non resta attaccato", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      var G = await W.apriTel("Giulia", { hash: "gioco=scalinata&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return dentro(G); }, 6000)) no("Giulia non entra dal link");
      if (G.location.hash) no("il link è rimasto nell'indirizzo: " + G.location.hash);
      W.clicca(G, /‹/, ".testa button");   // esce dalla saletta
      if (!await W.aspetta(function () { return G.document.querySelector(".home"); }, 4000)) no("Giulia non torna in home");
      if (!await W.aspetta(function () { return ids(C).length === 1; }, 4000)) no("Paky vede ancora Giulia in saletta");
      var C2 = await W.apriStanza(G, "Tris");
      if (C2 === C) no("aprendo la sua stanza Giulia è finita in quella di Paky (" + C + ")");
      await W.dorme(800);
      if (ids(C).length !== 1) no("Paky vede un fantasma: " + ids(C).join(","));
      if (!G.document.querySelector(".sl-cod:not(.ospite)")) no("Giulia non è host della sua stanza");
      return "Giulia ha aperto " + C2 + " (Paky resta in " + C + " da solo)";
    } },

    // 4. L'host ricarica in saletta e a metà partita: tutti di nuovo in saletta, con lo stesso codice
    4: { nome: "L'host ricarica: tutti di nuovo in saletta, stesso codice", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      await W.apriTel("Giulia", { hash: "gioco=scalinata&stanza=" + C, x: 185 });
      await W.apriTel("Luca", { hash: "gioco=scalinata&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("non sono entrati in 3");
      var tempi = [];
      for (var giro = 0; giro < 2; giro++) {
        if (giro === 1) {   // a metà partita
          W.clicca(W.finestra("Paky"), /Comincia/);
          if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 5000)) no("la partita non comincia");
        }
        var t0 = Date.now(), idG = mioId("Giulia"), idL = mioId("Luca"), pg = "";
        P = await W.ricarica("Paky");
        // in saletta: tutti di nuovo in saletta. A metà partita la Scalinata (riprende: true) riprende la partita da dove era:
        // tutti e 3 di nuovo al loro posto e Giulia legge "la partita riprende da dove era" (Passo 5)
        var ok = await W.aspetta(function () {
          var w = W.finestra("Paky"), p = pill(W.finestra("Giulia"));
          if (/tornato/.test(p)) pg = p;
          if (giro) return (vm(C).fase === "scelta" || vm(C).fase === "rivela") && ids(C).indexOf(idG) >= 0 && ids(C).indexOf(idL) >= 0 && /riprende da dove era/.test(pg);
          return codiceSaletta(w) === C && vm(C).fase === "lobby" && ids(C).length === 3 && dentro(W.finestra("Giulia")) && dentro(W.finestra("Luca"));
        }, 10000);
        if (!ok) no((giro ? "a metà partita: dopo 10 s la partita non è ripresa con tutti dentro" : "in saletta: dopo 10 s non sono tutti in saletta") + " (fase " + vm(C).fase + ", " + ids(C).join(",") + ", Paky: " + codiceSaletta(W.finestra("Paky")) + ", Giulia legge: " + (pg || pill(W.finestra("Giulia")) || "niente") + ")");
        tempi.push(((Date.now() - t0) / 1000).toFixed(1) + " s");
      }
      return "in saletta tutti di nuovo in saletta in " + tempi[0] + "; a metà partita la partita riprende con tutti dentro in " + tempi[1] + " · Giulia legge: " + pg;
    } },

    // 5. Un nuovo arrivato su una stanza morta legge "stanza ferma" in meno di 2 secondi (e se l'host torna entra da solo)
    5: { nome: "Stanza morta: 'stanza ferma' subito", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      W.spegni("Paky");   // l'app dell'host si chiude all'improvviso
      await W.dorme(200);
      var t0 = Date.now();
      var M = await W.apriTel("Marco", { hash: "gioco=scalinata&stanza=" + C, x: 185 });
      var ferma = await W.aspetta(function () { return M.document.querySelector(".sg-ferma"); }, 4000, 50);
      var dt = (Date.now() - t0) / 1000;
      if (!ferma) no("Marco non legge 'stanza ferma' (" + T(M).slice(0, 80) + ")");
      if (dt > 2) no("'stanza ferma' dopo " + dt.toFixed(1) + " s (più di 2)");
      var scritta = ferma.innerText.replace(/\s+/g, " ");
      // l'host riapre l'app: la stanza riparte e Marco entra da solo
      await W.chiudiApp("Paky");
      var entra = await W.aspetta(function () { return !M.document.querySelector(".sg-ferma") && dentro(M); }, 10000);
      if (!entra) no("l'host è tornato ma Marco non è entrato da solo (" + T(M).slice(0, 80) + ")");
      return "dopo " + dt.toFixed(1) + " s: «" + scritta.slice(0, 70) + "…»; tornato l'host, Marco è entrato da solo";
    } },

    // 6. Sala con 4 persone e Tris: due giocano, due guardano, nessun "Tu" sbagliato
    6: { nome: "Sala con 4 e Tris: nessun 'Tu' sbagliato", fai: async function () {
      await W.apriTel("Paky", { x: 0 });
      var S = await apriSala("Paky");
      var amici = ["Giulia", "Luca", "Sara"];
      for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1) });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 4; }, 8000)) no("non sono entrati in 4 nella Sala");
      var L = await salaLanciaGioco("Paky", "Tris");
      if (!/In 2/.test(L.etichetta)) no("nell'elenco della Sala il Tris non dice 'In 2: gli altri guardano'");
      var C = L.cod;
      await W.aspetta(function () { return amici.every(function (n) { return W.finestra(n).document.querySelector(".saletta-schermo"); }) && vm(C).avvId; }, 8000);
      var avv = vm(C).avvId, sbagli = [];
      amici.forEach(function (n) {
        if (mioId(n) === avv) return;
        var w = W.finestra(n);
        if (dentro(w)) sbagli.push(n + " legge 'Sei dentro'");
        if (w.document.querySelector(".sl-nome.tu")) sbagli.push(n + " si vede 'Tu' in saletta");
      });
      W.clicca(W.finestra("Paky"), /Comincia/);
      await W.aspetta(function () { return vm(C).fase === "gioco"; }, 4000);
      // Paky fa la prima mossa (se tocca a lui): ora tocca al cerchio
      if (vm(C).turno === "X") { var c0 = W.finestra("Paky").document.querySelectorAll(".tr-cella")[4]; if (c0) c0.click(); }
      await W.aspetta(function () { return vm(C).turno === "O"; }, 3000);
      await W.dorme(600);
      amici.forEach(function (n) {
        var w = W.finestra(n), tx = W.testo(w);
        if (mioId(n) !== avv && /Tocca a te/.test(tx)) sbagli.push(n + " (non gioca) legge «Tocca a te»");
      });
      if (sbagli.length) no(sbagli.join("; ") + " (serve in tris.js: chi non è l'avversario guarda)");
      return "giocano Paky e " + amici.filter(function (n) { return mioId(n) === avv; })[0] + ", gli altri guardano";
    } },

    // 7. Chi arriva tardi legge "entri alla prossima" ed è dentro alla "Nuova partita"
    7: { nome: "Chi arriva tardi: 'entri alla prossima', poi dentro", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      await W.apriTel("Giulia", { hash: "gioco=scalinata&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return ids(C).length === 2; }, 6000)) no("Giulia non entra");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 5000)) no("la partita non comincia");
      var M = await W.apriTel("Marco", { hash: "gioco=scalinata&stanza=" + C, x: 370 });
      // la Scalinata tiene da sé chi guarda (nella foto, "👀 Stai guardando · La scala ha 4 posti: entri alla prossima
      // partita", al round dopo): vale come la scritta comune "entri alla prossima"
      var p = await W.aspetta(function () { return /entri alla prossima/.test(pill(M)) || /Stai guardando[\s\S]*entri alla prossima/.test(W.testo(M)); }, 20000);
      if (!p) no("Marco non legge 'entri alla prossima' (" + (pill(M) || T(M).slice(0, 60)) + ")");
      if (dentro(M)) no("Marco legge 'Sei dentro' a partita in corso");
      if (!await scalinataFinoAllaFine(C, ["Giulia"], "Paky")) no("la Scalinata non è finita");
      await W.dorme(500);
      W.clicca(W.finestra("Paky"), /Nuova partita/);
      var id = mioId("Marco");
      var ok = await W.aspetta(function () { return ids(C).indexOf(id) >= 0 && dentro(M); }, 8000);
      if (!ok) no("alla 'Nuova partita' Marco non è dentro (" + ids(C).join(",") + ")");
      if (/entri alla prossima/.test(pill(M))) no("la scritta 'entri alla prossima' è rimasta");
      return "Marco ha letto «👀 entri alla prossima» ed è entrato alla Nuova partita";
    } },

    // 8. Chi esce da un gioco della Sala non viene risucchiato; a fine gioco nessun "Collegamento perso"
    8: { nome: "Sala: chi esce non è risucchiato, niente 'Collegamento perso'", fai: async function () {
      await W.apriTel("Paky", { x: 0 });
      var S = await apriSala("Paky");
      await W.apriTel("Giulia", { hash: "sala=" + S, x: 185 });
      await W.apriTel("Luca", { hash: "sala=" + S, x: 370 });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 3; }, 8000)) no("non sono entrati in 3 nella Sala");
      var L = await salaLanciaGioco("Paky", "La Scalinata"), C = L.cod;
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("gli amici non sono entrati nel gioco");
      W.clicca(W.finestra("Paky"), /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 5000)) no("la partita non comincia");
      // Luca esce dal gioco
      var Lw = W.finestra("Luca");
      await W.aspetta(function () { return W.clicca(Lw, /‹/, ".testa button, .sc-esci"); }, 3000);
      if (!await W.aspetta(function () { return Lw.document.querySelector(".sl-incorso"); }, 4000)) no("Luca non vede 'Stanno giocando… Rientra' nella Sala (" + T(Lw).slice(0, 80) + ")");
      // entra Sara nella Sala: Luca non deve essere riportato nel gioco
      await W.apriTel("Sara", { hash: "sala=" + S, x: 555 });
      await W.aspetta(function () { return ((vm(S).membri) || []).length === 4; }, 6000);
      await W.dorme(1500);
      if (!Lw.document.querySelector(".sl-incorso")) no("Luca è stato risucchiato nel gioco");
      // l'host chiude il gioco: Giulia non deve vedere "Collegamento perso"
      var Gw = W.finestra("Giulia"), visto = "";
      var guarda = setInterval(function () { var tx = W.testo(Gw); if (/Collegamento perso|Ops/.test(tx)) visto = tx.slice(0, 60); }, 30);
      W.clicca(W.finestra("Paky"), /‹/, ".testa button, .sc-esci");
      var inSala = await W.aspetta(function () { return /Sala online/.test(W.testo(Gw)) && Gw.document.querySelector(".saletta-schermo"); }, 6000);
      await W.dorme(1200); clearInterval(guarda);
      if (visto) no("Giulia ha visto «" + visto + "»");
      if (!inSala) no("Giulia non è tornata nella Sala");
      var Pw = W.finestra("Paky");
      if (!(/Sala online/.test(W.testo(Pw)) && Pw.document.querySelector(".saletta-schermo"))) no("l'host non è nella Sala: " + T(Pw).slice(0, 60));
      return "Luca resta nella Sala con 'Rientra'; a fine gioco Giulia torna nella Sala (" + (pill(Gw) || "") + ")";
    } },

    // 9. Due "Luca" nello stesso torneo, punti separati. (Fino al 14 ott: due ospiti SENZA profilo che si chiamavano
    //    tutti e due "Luca" diventavano "Luca" e "Luca 2". Dal 15 ott il profilo è obbligatorio e i nomi dei profili sono
    //    unici: due persone diverse sono per forza "Luca" e, per esempio, "Luca B"; due telefoni con lo STESSO profilo sono
    //    la stessa persona e niente numero, come prima)
    9: { nome: "Due 'Luca' (Luca e Luca B): nomi giusti e punti separati", fai: async function () {
      await W.apriTel("Paky", { x: 0 });
      var S = await apriSala("Paky", true);
      for (var i = 0; i < 2; i++) {
        var n = i ? "Luca-bis" : "Luca";
        await W.apriTel(n, { hash: "sala=" + S, x: 185 * (i + 1), profilo: { nome: i ? "Luca B" : "Luca" } });
        await W.aspetta(function () { return ((vm(S).membri) || []).length === 2 + i; }, 6000);
      }
      var nomi = (vm(S).membri || []).map(function (m) { return m.nome; });
      if (nomi.join("|") !== "Paky|Luca|Luca B") no("nella Sala: " + nomi.join(", "));
      var L = await salaLanciaGioco("Paky", "La Scalinata"), C = L.cod;
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("i due Luca non entrano nel gioco");
      var nomiG = (vm(C).posti || []).map(function (p) { return p.nome; });
      if (nomiG.join("|") !== "Paky|Luca|Luca B") no("nel gioco: " + nomiG.join(", "));
      W.clicca(W.finestra("Paky"), /Comincia/);
      if (!await scalinataFinoAllaFine(C, ["Luca", "Luca-bis"], "Paky")) no("la Scalinata non è finita");
      await W.dorme(600);
      W.clicca(W.finestra("Paky"), /Chiudi/);
      var T9 = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 && t; }, 6000);
      if (!T9) no("il torneo non ha contato la partita");
      if (T9.punti.Luca == null || T9.punti["Luca B"] == null) no("punti del torneo: " + JSON.stringify(T9.punti));
      return "Sala: " + nomi.join(", ") + " · punti: " + Object.keys(T9.punti).map(function (k) { return k + " " + T9.punti[k]; }).join(", ");
    } },

    // 10. Con un errore finto a metà partita il gioco continua
    10: { nome: "Errore di rete a metà partita: si continua", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var G = await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return vm(C).avvId; }, 6000)) no("Giulia non entra");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 4000)) no("il Tris non comincia");
      var cella = function (w, i) { return w.document.querySelectorAll(".tr-cella")[i]; };
      var chi = vm(C).turno === "X" ? P : G;
      if (!await W.aspetta(function () { var c = cella(chi, 4); if (c && !c.disabled) { c.click(); return true; } return false; }, 4000)) no("la prima casella non si tocca");
      await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length === 1; }, 3000);
      // la rete salta a tutti e due
      var visto = "", guarda = setInterval(function () { [P, G].forEach(function (w) { var tx = W.testo(w); if (/Problema di collegamento|Collegamento perso|Ops/.test(tx)) visto = tx.slice(0, 60); }); }, 50);
      W.inciampa("Giulia", 2500); W.inciampa("Paky", 3000);
      var pillola = await W.aspetta(function () { return /Mi ricollego/.test(pill(G) + pill(P)) && (pill(G) + " " + pill(P)); }, 3000);
      await W.dorme(3500);
      chi = vm(C).turno === "X" ? P : G;
      var c = cella(chi, 0); if (c) c.click();
      var mossa = await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length === 2; }, 5000);
      await W.dorme(300); clearInterval(guarda);
      if (visto) no("si è vista la schermata «" + visto + "»");
      if (!mossa) no("dopo il buco di rete la mossa non arriva");
      return "la partita continua" + (pillola ? " (si è visto «📶 Mi ricollego…»)" : "");
    } },

    // 11. (in più) La Sala: l'host ricarica a gioco in corso. Si riapre con lo stesso codice, chi c'era torna da solo,
    //     chi non torna entro 30 secondi viene tolto
    11: { nome: "Sala: l'host ricarica, stessa Sala, chi non torna viene tolto", fai: async function () {
      await W.apriTel("Paky", { x: 0 });
      var S = await apriSala("Paky");
      await W.apriTel("Giulia", { hash: "sala=" + S, x: 185 });
      await W.apriTel("Luca", { hash: "sala=" + S, x: 370 });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 3; }, 8000)) no("non sono entrati in 3 nella Sala");
      var L = await salaLanciaGioco("Paky", "La Scalinata");
      if (!await W.aspetta(function () { return ids(L.cod).length === 3; }, 8000)) no("gli amici non sono entrati nel gioco");
      W.spegni("Luca");   // Luca ha il telefono spento e non torna
      var t0 = Date.now();
      var P = await W.ricarica("Paky");
      var ok = await W.aspetta(function () { return codiceSaletta(P) === S && /Sala online/.test(W.testo(P)) && /Sala online/.test(W.testo(W.finestra("Giulia"))) && W.finestra("Giulia").document.querySelector(".saletta-schermo"); }, 10000);
      if (!ok) no("dopo 10 s la Sala non è di nuovo in piedi (" + T(P).slice(0, 80) + ")");
      var dt = ((Date.now() - t0) / 1000).toFixed(1);
      if (((vm(S).membri) || []).length !== 3) no("subito dopo dovrebbero esserci ancora tutti e 3 (Luca ha 30 s): " + (vm(S).membri || []).length);
      var tolto = await W.aspetta(function () { return ((vm(S).membri) || []).length === 2; }, 36000, 500);
      if (!tolto) no("Luca non è stato tolto dopo 30 s");
      return "Sala " + S + " di nuovo in piedi in " + dt + " s; Luca (spento) tolto dopo circa 30 s";
    } },

    // 12. (in più) Col profilo (dal 15 ott obbligatorio) si entra dal link senza domande e, ricaricando, si rientra da soli
    //     col nome del profilo (prima: "senza profilo il nome si scrive una volta")
    12: { nome: "Col profilo: dal link dentro senza domande, ricaricando si rientra da soli", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var L = await W.apriTel("Luca", { hash: "gioco=tris&stanza=" + C, x: 185, profilo: { nome: "Lucone" }, prima: spiaProfilo });
      if (!await W.aspetta(function () { return dentro(L) && vm(C).nomi && vm(C).nomi.O === "Lucone"; }, 6000)) no("Luca non entra");
      if (L.__visto.length) no("dal link ha visto: " + L.__visto.join(", "));
      L = await W.ricarica("Luca");
      var ok = await W.aspetta(function () { return dentro(L); }, 6000);
      if (!ok) no("dopo la ricarica Luca non è rientrato da solo (" + T(L).slice(0, 80) + ")");
      if (vm(C).nomi.O !== "Lucone") no("nome dopo la ricarica: " + vm(C).nomi.O);
      if (L.__visto.length) no("ricaricando ha visto: " + L.__visto.join(", "));
      return "Luca è entrato e rientrato da solo come «Lucone», senza schermate del profilo";
    } },

    // 13. (in più) Il "testamento" di un collegamento vecchio dell'host arriva in ritardo (rete cambiata: il broker se ne
    //     accorge anche 30 secondi dopo) e copre la foto: l'host la rimette da solo, nessuno resta ad "aspettare l'host"
    13: { nome: "Testamento in ritardo: la foto torna da sola", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      var G = await W.apriTel("Giulia", { hash: "gioco=scalinata&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return ids(C).length === 2 && dentro(G); }, 6000)) no("Giulia non entra");
      var c = W.viviDi("Paky")[0]; if (!c) no("l'host non ha un collegamento");
      c.testamento();   // il broker pubblica il testamento (trattenuto) mentre l'host è ancora collegato
      var t0 = Date.now();
      var ok = await W.aspetta(function () { var s = W.statoStanza(C); return s && s.t === "vm" && s._s; }, 3000, 50);
      if (!ok) no("la foto della stanza resta coperta da «host sparito»: " + JSON.stringify(W.statoStanza(C)).slice(0, 60));
      var dt = ((Date.now() - t0) / 1000).toFixed(1);
      await W.dorme(600);
      if (/Aspettiamo l'host/.test(pill(G))) no("Giulia legge ancora «Aspettiamo l'host»");
      var M = await W.apriTel("Marco", { hash: "gioco=scalinata&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return dentro(M); }, 5000)) no("Marco non entra (" + T(M).slice(0, 60) + ")");
      if (M.document.querySelector(".sg-ferma")) no("Marco vede «stanza ferma»");
      return "foto rimessa dall'host in " + dt + " s; Giulia non aspetta nessuno, Marco entra normalmente";
    } },

    // 14. (in più) L'host non torna più: chi era dentro lo aspetta (2 minuti, qui accorciati a 2 secondi) e poi legge
    //     "La stanza è chiusa"; in home c'è "Rientra" (se l'host riapre la stanza, si torna dentro)
    14: { nome: "L'host non torna: «La stanza è chiusa»", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var G = await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return vm(C).avvId && dentro(G); }, 6000)) no("Giulia non entra");
      var st0 = G.setTimeout; G.setTimeout = function (f, ms) { var a = [].slice.call(arguments); if (ms === 120000) a[1] = 2000; return st0.apply(G, a); };
      W.spegni("Paky");   // il telefono dell'host si spegne e non torna più
      var asp = await W.aspetta(function () { return /Aspettiamo l'host/.test(pill(G)); }, 3000);
      if (!asp) no("Giulia non legge «Aspettiamo l'host»");
      var chiusa = await W.aspetta(function () { return /La stanza è chiusa/.test(W.testo(G)); }, 5000);
      if (!chiusa) no("dopo l'attesa Giulia non legge «La stanza è chiusa» (" + T(G).slice(0, 80) + ")");
      if (/Aspettiamo l'host/.test(pill(G))) no("la pillola «Aspettiamo l'host» è rimasta");
      W.clicca(G, /Torna alla home/);
      if (!await W.aspetta(function () { return /Rientra nella partita/.test(W.testo(G)); }, 3000)) no("in home non c'è «Rientra nella partita»");
      return "Giulia ha letto «Aspettiamo l'host…», poi «La stanza è chiusa»; in home trova «Rientra»";
    } },

    // 15. (in più) Tris online dall'inizio alla fine, con la rivincita
    15: { nome: "Tris online: partita intera e rivincita", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var G = await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return vm(C).avvId; }, 6000)) no("Giulia non entra");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 4000)) no("il Tris non comincia");
      var cella = function (w, i) { return w.document.querySelectorAll(".tr-cella")[i]; };
      // X fa la riga in alto (0, 1, 2), O mette 3 e 4
      var mosse = [[P, 0], [G, 3], [P, 1], [G, 4], [P, 2]];
      for (var i = 0; i < mosse.length; i++) {
        var w = mosse[i][0], k = mosse[i][1], n = i + 1;
        if (!await W.aspetta(function () { var c = cella(w, k); if (c && !c.disabled) { c.click(); return true; } return false; }, 4000)) no("mossa " + n + ": la casella non si tocca");
        if (!await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length === n; }, 4000)) no("mossa " + n + " non arrivata");
      }
      if (!await W.aspetta(function () { return vm(C).fase === "fine" && vm(C).fine && vm(C).fine.vincitore === "X"; }, 4000)) no("la partita non finisce con la vittoria di X");
      if (!await W.aspetta(function () { return /hai vinto|vince|Hai perso|perso/i.test(W.testo(G)); }, 3000)) no("Giulia non vede com'è finita (" + T(G).slice(0, 60) + ")");
      // (dal p2-f la fine online è quella del core: "↻ Nuova partita (stessi amici)" → saletta → 3-2-1 da solo con tutti dentro)
      if (!await W.aspetta(function () { return W.clicca(P, /Rivincita|Nuova partita/); }, 3000)) no("l'host non ha «Nuova partita»");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco" && (vm(C).board || []).filter(Boolean).length === 0; }, 8000)) no("la rivincita non comincia");
      return "vince X (Paky) con la riga in alto; rivincita partita (comincia " + vm(C).turno + ")";
    } },

    // 16. (in più) Scalinata online dall'inizio alla fine con due amici, poi "Nuova partita" con gli stessi
    16: { nome: "Scalinata online: partita intera e nuova partita", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      await W.apriTel("Giulia", { hash: "gioco=scalinata&stanza=" + C, x: 185 });
      await W.apriTel("Luca", { hash: "gioco=scalinata&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("non sono entrati in 3");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 5000)) no("la partita non comincia");
      // anche l'host sceglie (così i round non aspettano il tempo)
      var fine = Date.now() + 150000;
      while (Date.now() < fine && vm(C).fase !== "fine") {
        var v = vm(C);
        if (v.fase === "scelta") ["Paky", "Giulia", "Luca"].forEach(function (n) { W.clicca(W.finestra(n), new RegExp("^\\s*" + [1, 3, 5][Math.floor(Math.random() * 3)] + "\\s*gradin")); });
        if (v.fase === "rivela") W.clicca(P, /Prossimo round|Vedi il podio/);
        await W.dorme(400);
      }
      if (vm(C).fase !== "fine") no("la Scalinata non è finita (fase " + vm(C).fase + ")");
      var vinc = (vm(C).posti || []).filter(function (p) { return p.passi >= 15; }).map(function (p) { return p.nome; }).join(" e ");
      if (!await W.aspetta(function () { return /Vince|Hai vinto/.test(W.testo(W.finestra("Giulia"))); }, 3000)) no("Giulia non vede il podio");
      W.clicca(P, /Nuova partita/);
      if (!await W.aspetta(function () { return vm(C).fase === "lobby" && ids(C).length === 3 && dentro(W.finestra("Giulia")) && dentro(W.finestra("Luca")); }, 6000)) no("alla «Nuova partita» non sono tutti in saletta (" + ids(C).join(",") + ")");
      return "vince " + vinc + "; con «Nuova partita» tutti e tre di nuovo in saletta";
    } },

    // 17. (in più) Linea del tempo online dall'inizio alla fine (2 giocatori, 3 carte a testa scelte con "⚙️ Regole"):
    //     chi è di turno tocca "Avanti"
    17: { nome: "Linea del tempo online: partita intera", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 8000)) no("Giulia non entra");
      // le regole dalla saletta: 3 carte a testa (il minimo)
      if (!W.clicca(P, /Regole/)) no("l'host non ha «⚙️ Regole» in saletta");
      await W.dorme(200);
      var meno = P.document.querySelector(".sl-foglio .stepper button");
      if (!meno) no("nel foglio delle regole non c'è il numero di carte");
      meno.click(); meno.click(); W.clicca(P, /Fatto/, ".sl-foglio button");
      if (!await W.aspetta(function () { return vm(C).carte === 3; }, 3000)) no("le regole nuove non arrivano nella partita (carte " + vm(C).carte + ")");
      W.clicca(P, /Comincia/);
      // (con la finestra del browser nascosta lo spettacolo dello studio va più piano: si aspetta fino a 8 minuti)
      var G = W.reteDi("Giulia"), idG = mioId("Giulia"), turni = 0, fine = Date.now() + 480000, ultimoK = "";
      while (Date.now() < fine && vm(C).fase !== "fine") {
        var v = vm(C), k = v.fase + "|" + v.turnoId + "|" + (v.carta ? v.carta.titolo : "");
        if (v.fase === "turno" && v.turnoId === "host") {
          var slot = P.document.querySelector(".tl-slot");
          if (slot) { slot.click(); await W.dorme(150); var conf = P.document.querySelector(".tl-conferma"); if (conf && !conf.disabled) conf.click(); }
        } else if (v.fase === "turno" && v.turnoId === idG && k !== ultimoK) G.invia({ t: "scelta", gap: 0 });
        else if (v.fase === "votazione" && v.turnoId === "host" && k !== ultimoK) G.invia({ t: "voto", d: true });
        else if (v.fase === "votazione" && v.turnoId === idG) W.clicca(P, /Giusto/);
        else if (v.fase === "esito" && v.turnoId === idG && k !== ultimoK) G.invia({ t: "avanti" });
        else if (v.fase === "esito" && v.turnoId === "host") W.clicca(P, /Avanti/);
        if (k !== ultimoK && v.fase === "esito") turni++;
        ultimoK = k;
        await W.dorme(300);
      }
      if (vm(C).fase !== "fine") no("la partita non è finita dopo 8 minuti (fase " + vm(C).fase + ", turni " + turni + ")");
      var cl = (vm(C).classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ");
      if (!await W.aspetta(function () { return /Classifica finale/.test(W.testo(W.finestra("Giulia"))); }, 20000)) no("Giulia non vede la classifica finale");
      return turni + " turni, classifica: " + cl;
    } },

    // 18. (in più) Nella Sala l'host esce dal gioco appena cominciato: i timer del gioco (i bot che scelgono) non ricoprono la Sala
    18: { nome: "Sala: uscito dal gioco, il gioco non ricopre la Sala", fai: async function () {
      await W.apriTel("Paky", { x: 0 });
      var S = await apriSala("Paky");
      var L = await salaLanciaGioco("Paky", "La Scalinata"), C = L.cod, P = W.finestra("Paky");
      if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 5000)) no("la saletta del gioco non arriva");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 4000)) no("la partita non comincia");
      W.clicca(P, /‹/, ".testa button, .sc-esci");   // esce subito: i 3 bot stanno ancora scegliendo
      await W.dorme(3500);
      if (!(/Sala online/.test(W.testo(P)) && P.document.querySelector(".saletta-schermo"))) no("l'host non vede più la Sala: " + T(P).slice(0, 60));
      return "l'host resta nella Sala " + S;
    } },

    // 19. (in più) "Ho un codice": un codice sbagliato risponde subito (meno di 3 secondi), quello giusto fa entrare
    //     senza ricaricare l'app
    19: { nome: "«Ho un codice»: risposta veloce, si entra senza ricaricare", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var M = await W.apriTel("Marco", { x: 185 });
      M.__segno = 1;   // se l'app si ricarica, il segno sparisce
      async function scrivi(cod) {
        if (!W.clicca(M, /Ho un codice/)) no("in home non c'è «Ho un codice»");
        var inp = await W.aspetta(function () { return M.document.querySelector("input.codice-campo"); }, 3000);
        if (!inp) no("niente casella del codice");
        inp.value = cod; W.clicca(M, /Entra/);
      }
      await scrivi("ZZZZ");
      var t0 = Date.now();
      var nonc = await W.aspetta(function () { return /Non trovo una partita/.test(W.testo(M)); }, 6000, 50);
      if (!nonc) no("il codice sbagliato non risponde («" + T(M).slice(0, 60) + "»)");
      var dt = (Date.now() - t0) / 1000;
      if (dt > 3) no("il codice sbagliato risponde dopo " + dt.toFixed(1) + " s");
      W.clicca(M, /Torna alla home/);
      await W.dorme(300);
      await scrivi(C);
      if (!await W.aspetta(function () { return dentro(M) && vm(C).avvId === mioId("Marco"); }, 6000)) no("con il codice giusto Marco non entra (" + T(M).slice(0, 60) + ")");
      if (!M.__segno) no("l'app si è ricaricata");
      return "codice sbagliato: risposta in " + dt.toFixed(1) + " s; codice giusto: dentro senza ricaricare";
    } },

    // 20. (in più) L'aiuto t.contoAvanti dei giochi: il tasto conta e a zero va avanti da solo; ridisegnato con la stessa
    //     chiave continua da dov'era; toccato, si ferma (fa il tasto); per chi aspetta: "Si va avanti tra N…"
    20: { nome: "t.contoAvanti: il tasto che va avanti da solo", fai: async function () {
      // un gioco finto (si gioca da soli), aperto dal link: "Comincia" e il gioco riceve il suo tavolo (t)
      var P = await W.apriTel("Paky", { x: 0, hash: "gioco=provaconto", prima: function (w) {
        w.SG.registra({ id: "provaconto", nome: "Prova del conto", icona: "⏱️", modi: [{ modo: "solo", icona: "⏱️", nome: "Da solo" }], avvia: function (t) { w.__T = t; } });
      } });
      await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 3000);
      var T = await W.aspetta(function () { return P.__T; }, 3000); if (!T || !T.contoAvanti) no("t.contoAvanti non c'è");
      var el = T.el, s = T.schermata({}), fatto = 0;
      var b1 = el("button", { class: "btn btn-primario", text: "Avanti ▶" }), p1 = el("p", {});
      s._piede.appendChild(b1); s._piede.appendChild(p1); T.mostra(s);
      T.contoAvanti(b1, 3, function () { fatto++; }, "prova|1");
      T.contoAvanti(p1, 3, null, "prova|1");
      await W.dorme(1200);
      var num = b1.querySelector(".conto-avanti"), n1 = num && num.textContent, t1 = p1.textContent;
      if (!/^[12]$/.test(n1 || "")) no("il numero nel tasto non conta: «" + n1 + "»");
      if (!/Si va avanti tra [12]/.test(t1)) no("la scritta per chi aspetta: «" + t1 + "»");
      // ridisegnato (stessa chiave): continua da dov'era, non riparte da 3
      var b2 = el("button", { class: "btn btn-primario", text: "Avanti ▶" }); s._piede.replaceChild(b2, b1);
      T.contoAvanti(b2, 3, function () { fatto++; }, "prova|1");
      var n2 = b2.querySelector(".conto-avanti").textContent;
      if (+n2 > +n1) no("ridisegnato, il conto è ripartito (" + n1 + " → " + n2 + ")");
      if (!await W.aspetta(function () { return fatto === 1; }, 4000)) no("a zero non è andato avanti da solo");
      await W.dorme(600);
      if (fatto !== 1) no("è andato avanti " + fatto + " volte");
      // toccato prima della fine: il conto si ferma (fa il tasto)
      var b3 = el("button", { class: "btn btn-primario", text: "Avanti ▶" }); s._piede.appendChild(b3);
      T.contoAvanti(b3, 2, function () { fatto += 10; }, "prova|2");
      b3.click(); await W.dorme(2600);
      if (fatto !== 1) no("toccato il tasto, il conto è andato avanti lo stesso");
      return "conta (" + n1 + " → " + n2 + " dopo il ridisegno), a zero va avanti una volta sola, toccato si ferma; «" + t1 + "»";
    } },

    // 21. (in più) Parola d'ordine (ha il suo host di riserva): l'host ricarica in saletta, la stanza si riapre con lo stesso
    //     codice e tutti e quattro sono di nuovo dentro (rientrano col "sono entrato" che si ripete)
    21: { nome: "Parola d'ordine: l'host ricarica in saletta", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Parola d'ordine");
      var amici = ["Giulia", "Luca", "Sara"];
      for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1) });
      var quattro = function () { return ((vm(C).players) || []).length === 4; };
      if (!await W.aspetta(quattro, 8000)) no("non sono entrati in 4 (" + ((vm(C).players) || []).length + ")");
      var t0 = Date.now();
      P = await W.ricarica("Paky");
      var ok = await W.aspetta(function () { return codiceSaletta(W.finestra("Paky")) === C && quattro() && amici.every(function (n) { return dentro(W.finestra(n)); }); }, 12000);
      if (!ok) no("dopo la ricarica non sono tutti dentro (" + ((vm(C).players) || []).map(function (p) { return p.nome; }).join(",") + "; Paky: " + codiceSaletta(W.finestra("Paky")) + ")");
      return "stanza " + C + " riaperta, tutti e quattro dentro in " + ((Date.now() - t0) / 1000).toFixed(1) + " s";
    } },

    // 22. (in più) L'host è appena sparito ma il broker non lo sa ancora (niente testamento): chi arriva, dopo 8 secondi
    //     legge "La stanza non risponde"; quando l'host si riprende entra da solo
    22: { nome: "Host appena sparito: «La stanza non risponde»", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      // muto, senza testamento, su TUTTI gli uffici postali (Passo 5: con l'ufficio di riserva l'host parla su tutti e due)
      var cc = W.viviDi("Paky"); if (!cc.length) no("l'host non ha un collegamento");
      cc.forEach(function (c) { c.connected = false; c.frozen = true; var u = W.ufficio(c.u); u.clients = u.clients.filter(function (x) { return x !== c; }); });
      var c = { torna: function () { cc.forEach(function (x) { x.torna(); }); } };
      var t0 = Date.now(), M = await W.apriTel("Marco", { hash: "gioco=tris&stanza=" + C, x: 185 });
      var muta = await W.aspetta(function () { var f = M.document.querySelector(".sg-ferma"); return f && /non risponde/.test(f.innerText); }, 12000, 100);
      if (!muta) no("Marco non legge «non risponde» (" + T(M).slice(0, 60) + ")");
      var dt = ((Date.now() - t0) / 1000).toFixed(1);
      if (dentro(M)) no("Marco legge «Sei dentro» in una stanza che non risponde");
      c.torna();   // l'host si riprende
      if (!await W.aspetta(function () { return !M.document.querySelector(".sg-ferma") && dentro(M); }, 8000)) no("tornato l'host, Marco non entra da solo");
      return "«non risponde» dopo " + dt + " s; tornato l'host, Marco è entrato da solo";
    } },

    // 23. (in più) Torneo a eliminazione a Tris con 2: la partita si apre da sola sui due telefoni, si gioca,
    //     e il torneo ha il suo campione
    23: { nome: "Torneo a eliminazione (Tris, in 2): partita e campione", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 });
      var tess = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === "Tris"; }); }, 5000);
      if (!tess) no("non trovo il Tris"); tess.click(); await W.dorme(200);
      if (!W.clicca(P, /Torneo a eliminazione/)) no("non trovo «Torneo a eliminazione»");
      var S = await W.aspetta(function () { return codiceSaletta(P); }, 5000); if (!S) no("il torneo non ha il codice");
      await W.apriTel("Giulia", { hash: "sala=" + S, x: 185 });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 2; }, 8000)) no("Giulia non entra nel torneo");
      if (!W.clicca(P, /Comincia il torneo/)) no("non trovo «Comincia il torneo»");
      var p0 = await W.aspetta(function () { var e = vm(S).elim; return e && e.turni && e.turni[0] && e.turni[0][0]; }, 5000);
      if (!p0) no("il torneo non comincia");
      var C = p0.stanza, chiA = p0.a === "host" ? "Paky" : "Giulia", chiB = chiA === "Paky" ? "Giulia" : "Paky";
      if (!await W.aspetta(function () { return vm(C).avvId; }, 8000)) no("la partita " + C + " non si apre con tutti e due");
      var A = W.finestra(chiA), B = W.finestra(chiB);
      await W.aspetta(function () { return W.clicca(A, /Comincia/); }, 4000);
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 4000)) no("la partita non comincia");
      var cella = function (w, i) { return w.document.querySelectorAll(".tr-cella")[i]; };
      var mosse = vm(C).turno === "X" ? [[A, 0], [B, 3], [A, 1], [B, 4], [A, 2]] : [[B, 3], [A, 0], [B, 4], [A, 1], [B, 6], [A, 2]];
      for (var i = 0; i < mosse.length; i++) {
        var w = mosse[i][0], k = mosse[i][1], n = i + 1;
        if (!await W.aspetta(function () { var c = cella(w, k); if (c && !c.disabled) { c.click(); return true; } return false; }, 4000)) no("mossa " + n + ": la casella non si tocca");
        if (!await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length === n; }, 4000)) no("mossa " + n + " non arrivata");
      }
      var camp = await W.aspetta(function () { var e = vm(S).elim; return e && e.finito && e.campione; }, 8000);
      if (!camp) no("il torneo non ha il campione");
      var nomeC = (vm(S).elim.nomi || {})[camp];
      if (nomeC !== chiA) no("campione sbagliato: " + nomeC + " (doveva vincere " + chiA + ")");
      return "partita " + C + " tra " + chiA + " e " + chiB + ": vince " + nomeC + ", campione del torneo";
    } },

    // ===== PASSO 4: la saletta viva =====
    // 24. Chi arriva fa "pling" (a codice: le note del motore audio finto), "Ciao Giulia! 👋" sopra la testa e il contatore
    //     fa un saltello; chi esce saluta ("Ciao ciao! 👋") e sfuma
    24: { nome: "Saletta viva: chi arriva fa «pling» e «Ciao Giulia! 👋», chi esce saluta", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, prima: audioFinto }), C = await W.apriStanza(P, "La Scalinata");
      var n0 = P.__note.length;
      var G = await W.apriTel("Giulia", { hash: "gioco=scalinata&stanza=" + C, x: 185 });
      var fum = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".sl-bolle .sl-fumetto"), function (b) { return /Ciao Giulia! 👋/.test(b.textContent); }); }, 5000);
      if (!fum) no("l'host non vede il fumetto «Ciao Giulia! 👋»");
      var note = P.__note.slice(n0).map(function (x) { return x.f; });
      if (note.indexOf(1319) < 0 || note.indexOf(1976) < 0) no("niente «pling» (note dopo l'arrivo: " + note.slice(0, 12).join(",") + ")");
      var conta = P.document.querySelector(".sl-conta");
      if (!/^2 in sala$/.test(conta.textContent)) no("il contatore dice «" + conta.textContent + "»");
      if (!conta.classList.contains("salta")) no("il contatore non fa il saltello");
      // il fumetto è sopra la testa di Giulia (dentro la stanza)
      var st = P.document.querySelector(".sl-stanza").getBoundingClientRect(), rf = fum.getBoundingClientRect();
      if (rf.left < st.left - 1 || rf.right > st.right + 1 || rf.top < st.top - 1) no("il fumetto esce dalla stanza");
      // Giulia esce con ‹: sull'host saluta e sfuma
      W.clicca(G, /‹/);
      var ciao = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".sl-bolle .sl-fumetto"), function (b) { return /Ciao ciao! 👋/.test(b.textContent); }); }, 5000);
      if (!ciao) no("chi esce non saluta");
      if (!await W.aspetta(function () { return /^1 in sala$/.test(P.document.querySelector(".sl-conta").textContent) && !P.document.querySelector(".sl-av.va"); }, 4000)) no("chi esce non sparisce");
      return "pling (" + [1319, 1976].join(" + ") + " Hz), «Ciao Giulia! 👋» sopra la testa, contatore 1 → 2 col saltello; uscita con «Ciao ciao! 👋»";
    } },

    // 25. "✋ Sono pronto!": la spunta (nome verde, ✓, mano alzata) arriva su tutti i telefoni, l'host legge "Pronti 1 su 2";
    //     ritoccato torna "non pronto"; le regole cambiate dopo i "pronto" non tolgono le spunte
    25: { nome: "«✋ Sono pronto!»: spunta su tutti i telefoni e «Pronti 1 su 2»", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
      var L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3 && dentro(G) && dentro(L); }, 8000)) no("non sono entrati in 3");
      var b = await W.aspetta(function () { var x = G.document.querySelector(".sl-pronto"); return x && !x.disabled && !x.hidden ? x : null; }, 4000);
      if (!b) no("Giulia non ha «✋ Sono pronto!»");
      b.click();
      if (!await W.aspetta(function () { return pronto(P, "Giulia") && pronto(L, "Giulia") && pronto(G, "Tu"); }, 4000)) no("la spunta di Giulia non arriva su tutti i telefoni");
      var avG = avatarDi(P, "Giulia");
      if (!avG || (avG.querySelector(".sl-bollo") || {}).textContent !== "✓") no("sull'avatar di Giulia manca la ✓");
      if (!/Pronti 1 su 2/.test(P.document.querySelector(".sl-chip").textContent)) no("l'host legge «" + P.document.querySelector(".sl-chip").textContent + "»");
      if (!/Sei pronto/.test(G.document.querySelector(".sl-pronto").textContent)) no("Giulia non legge «✅ Sei pronto!»");
      // ritocca: non è più pronta
      G.document.querySelector(".sl-pronto").click();
      if (!await W.aspetta(function () { return !pronto(P, "Giulia") && /Pronti 0 su 2/.test(P.document.querySelector(".sl-chip").textContent); }, 4000)) no("tornata «non pronta», l'host non lo vede");
      // di nuovo pronta, poi l'host cambia le regole: la spunta resta
      G.document.querySelector(".sl-pronto").click();
      if (!await W.aspetta(function () { return pronto(P, "Giulia"); }, 4000)) no("la seconda volta la spunta non arriva");
      if (!W.clicca(P, /Regole/)) no("l'host non ha «⚙️ Regole»");
      await W.dorme(300);
      var chip = P.document.querySelector(".sl-velo .cat-chip, .sl-velo .modo-chip"); if (chip) chip.click();
      W.clicca(P, /Fatto/); await W.dorme(800);
      if (!pronto(P, "Giulia") || !pronto(L, "Giulia")) no("cambiate le regole, la spunta di Giulia è sparita");
      return "spunta su tutti e tre i telefoni, «Pronti 1 su 2», ritoccato «Pronti 0 su 2», con le regole cambiate la spunta resta";
    } },

    // 26. Le faccine: il mio avatar le fa su tutti i telefoni; a raffica ne passa al massimo una al secondo (anche se un
    //     telefono le manda di nascosto più in fretta, l'host le scarta); con la rete giù si perdono (non restano in coda)
    26: { nome: "Faccine: su tutti i telefoni, al massimo una al secondo", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
      var L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3 && dentro(G) && dentro(L); }, 8000)) no("non sono entrati in 3");
      var conta = contaFaccine([P, G, L]);
      // una: 😂 di Luca, sopra il suo avatar su tutti i telefoni
      L.document.querySelectorAll(".sl-fa")[1].click();
      if (!await W.aspetta(function () { return conta.n[0] >= 1 && conta.n[1] >= 1 && conta.n[2] >= 1; }, 3000)) no("la faccina di Luca non arriva a tutti (" + conta.n.join("/") + ")");
      if (conta.ultima[0] !== "😂") no("all'host arriva «" + conta.ultima[0] + "» invece di 😂");
      await W.dorme(1200);
      // a raffica dai tasti: 2,5 secondi di tocchi (i tasti si spengono un secondo dopo ogni faccina)
      conta.n = [0, 0, 0];
      var t0 = Date.now(), tocchi = 0, fa = L.document.querySelectorAll(".sl-fa");
      while (Date.now() - t0 < 2500) { fa[tocchi % 6].click(); tocchi++; await W.dorme(120); }
      await W.dorme(600);
      var raffica = conta.n[0];
      if (raffica > 3 || raffica < 2) no("in 2,5 secondi di tocchi all'host ne arrivano " + raffica + " (giusto: 2 o 3)");
      // di nascosto, 10 in mezzo secondo: l'host ne fa passare al massimo una
      await W.dorme(1100); conta.n = [0, 0, 0];
      var h = W.reteDi("Luca"); for (var i = 0; i < 10; i++) { h.invia({ t: "__faccina", f: "🔥" }); await W.dorme(50); }
      await W.dorme(800);
      var nascoste = conta.n[1];
      if (nascoste > 1) no("10 faccine mandate di nascosto: a Giulia ne arrivano " + nascoste);
      // con la rete giù si perde
      await W.dorme(1100); conta.n = [0, 0, 0];
      W.spegni("Luca"); await W.dorme(100);
      L.document.querySelectorAll(".sl-fa")[3].click();
      W.riaccendi("Luca"); await W.dorme(1500);
      if (conta.n[0] > 0) no("la faccina mandata con la rete giù arriva dopo (doveva perdersi)");
      return "una faccina arriva a tutti (😂), " + tocchi + " tocchi in 2,5 s → " + raffica + " faccine, 10 di nascosto in mezzo secondo → " + nascoste + ", con la rete giù si perde";
    } },

    // 27. La rete di Luca salta: il suo avatar diventa grigio con 📶 "si ricollega…" su tutti i telefoni (anche sul suo,
    //     con "📶 Mi ricollego…"); quando torna, torna a colori
    27: { nome: "Chi si ricollega è grigio con 📶 su tutti i telefoni", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
      var L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3 && dentro(G) && dentro(L); }, 8000)) no("non sono entrati in 3");
      W.spegni("Luca");
      var grigio = function (w, nome) { var a = avatarDi(w, nome); return !!(a && a.classList.contains("forse") && (a.querySelector(".sl-bollo") || {}).textContent === "📶" && /si ricollega/.test((a._targa.querySelector(".sl-ricollega") || {}).textContent)); };
      if (!await W.aspetta(function () { return grigio(P, "Luca") && grigio(G, "Luca"); }, 4000)) no("l'avatar di Luca non diventa grigio con 📶 sui telefoni degli altri");
      if (!await W.aspetta(function () { return grigio(L, "Tu") && /Mi ricollego/.test(pill(L)); }, 4000)) no("sul telefono di Luca il suo avatar non è grigio (o manca «📶 Mi ricollego…»)");
      W.riaccendi("Luca");
      if (!await W.aspetta(function () { return !grigio(P, "Luca") && !grigio(G, "Luca") && !grigio(L, "Tu"); }, 5000)) no("tornata la rete, Luca resta grigio");
      return "grigio con 📶 «si ricollega…» su tutti e tre i telefoni, poi di nuovo a colori";
    } },

    // 28. L'host fa uscire Luca (tocco lungo sull'avatar → "🚪 Fai uscire Luca") e chiude la porta (🔒): Luca legge
    //     "Sei fuori dalla stanza" e non rientra nemmeno dal link; chi è nuovo legge "La stanza è chiusa"; con la porta
    //     riaperta il nuovo entra (Luca, fatto uscire da meno di un minuto, no). La porta resta chiusa anche se l'host ricarica
    28: { nome: "«Fai uscire» e «🔒 Chiudi la porta»", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
      var L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3 && dentro(G) && dentro(L); }, 8000)) no("non sono entrati in 3");
      // tocco lungo sull'avatar di Luca
      var av = avatarDi(P, "Luca"), r = av.getBoundingClientRect();
      var ev = function (t) { av.dispatchEvent(new P.PointerEvent(t, { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 3, pointerId: 1, pointerType: "touch" })); };
      ev("pointerdown"); await W.dorme(700); ev("pointerup"); av.click();
      var bFuori = await W.aspetta(function () { return P.document.querySelector(".sl-menu .sl-menu-fuori"); }, 2000);
      if (!bFuori || !/Fai uscire Luca/.test(bFuori.textContent)) no("tenendo premuto su Luca non compare «🚪 Fai uscire Luca»");
      bFuori.click();
      if (!await W.aspetta(function () { return /Sei fuori dalla stanza/.test(T(L)); }, 4000)) no("Luca non legge «Sei fuori dalla stanza»");
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2 && !avatarDi(G, "Luca"); }, 4000)) no("Luca è ancora nella partita o nella saletta di Giulia");
      // la porta
      var porta = P.document.querySelector(".sl-porta");
      if (!porta || porta.hidden || !/Chiudi/.test(porta.textContent)) no("l'host non ha «🔒 Chiudi» (la porta)");
      porta.click();
      if (!await W.aspetta(function () { return /Porta chiusa/.test(statoHost(P)); }, 2000)) no("chiusa la porta, la saletta non lo dice");
      // Luca riapre il link; Marco è nuovo
      L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
      var M = await W.apriTel("Marco", { hash: "gioco=timeline&stanza=" + C, x: 555 });
      if (!await W.aspetta(function () { return /Sei fuori dalla stanza/.test(T(L)) && /La stanza è chiusa/.test(T(M)); }, 6000)) no("con la porta chiusa: Luca «" + T(L).slice(0, 60) + "», Marco «" + T(M).slice(0, 60) + "»");
      if ((vm(C).giocatori || []).length !== 2) no("con la porta chiusa qualcuno è entrato");
      // l'host ricarica: la porta resta chiusa
      P = await W.ricarica("Paky");
      if (!await W.aspetta(function () { return /Porta chiusa/.test(statoHost(P)) && (vm(C).giocatori || []).length === 2; }, 8000)) no("dopo la ricarica dell'host la porta non è più chiusa (o Giulia non è rientrata)");
      // riaperta: Marco ritocca "Riprova" ed entra; Luca no
      P.document.querySelector(".sl-porta").click();
      W.clicca(M, /Riprova/); W.clicca(L, /Riprova/);
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (g) { return g.nome === "Marco"; }); }, 6000)) no("con la porta riaperta Marco non entra");
      await W.dorme(1500);
      if ((vm(C).giocatori || []).some(function (g) { return g.nome === "Luca"; })) no("Luca, fatto uscire da poco, è rientrato");
      return "«Fai uscire Luca» col tocco lungo, porta chiusa: Luca fuori e Marco «La stanza è chiusa» (anche dopo la ricarica dell'host); riaperta: entra Marco, Luca no";
    } },

    // 29. "Comincia": 3-2-1-Via! su tutti i telefoni (col nome del gioco), con i bip che salgono, poi parte la partita
    29: { nome: "3-2-1-Via! uguale su tutti i telefoni", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185, prima: audioFinto });
      var L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3 && dentro(G) && dentro(L); }, 8000)) no("non sono entrati in 3");
      var visti = [[], [], []], tel = [P, G, L], n0 = G.__note.length;
      var iv = setInterval(function () { tel.forEach(function (w, i) { var x = w.document.querySelector(".sl-via-num"), v = x ? x.textContent : ""; if (v && visti[i][visti[i].length - 1] !== v) visti[i].push(v); }); }, 40);
      W.clicca(P, /Comincia/);
      var tit = await W.aspetta(function () { var t = G.document.querySelector(".sl-via-tit"); return t && t.textContent; }, 2000);
      await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000);
      await W.dorme(600); clearInterval(iv);
      for (var i = 0; i < 3; i++) if (visti[i].join(",") !== "3,2,1,Via!") no(["Paky", "Giulia", "Luca"][i] + " vede «" + visti[i].join(",") + "» invece di 3,2,1,Via!");
      if (!/linea del tempo/i.test(tit || "")) no("sopra i numeri non c'è il gioco («" + tit + "»)");
      var bip = G.__note.slice(n0).map(function (x) { return x.f; }).filter(function (f) { return f === 587 || f === 659 || f === 784; });
      if (bip.join(",") !== "587,659,784") no("i bip del 3-2-1 sul telefono di Giulia: " + bip.join(","));
      if (!vm(C).fase || vm(C).fase === "lobby") no("dopo il Via! la partita non comincia");
      return "Paky, Giulia e Luca: 3, 2, 1, Via! (" + tit + "), bip 587-659-784 Hz, poi la partita (" + vm(C).fase + ")";
    } },

    // 30. Tutti pronti e, nel ⚙️ dell'host, "Parti da solo quando tutti sono pronti": si parte da soli col 3-2-1
    30: { nome: "Tutti pronti: si parte da soli", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
      var L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3 && dentro(G) && dentro(L); }, 8000)) no("non sono entrati in 3");
      if (!W.clicca(P, /Regole|⚙️/)) no("l'host non ha il ⚙️");
      var chk = await W.aspetta(function () { return P.document.querySelector(".sl-velo .sl-interruttore input"); }, 2000);
      if (!chk) no("nel ⚙️ non c'è «Parti da solo quando tutti sono pronti»");
      chk.click(); W.clicca(P, /Fatto/);
      await W.aspetta(function () { return W.clicca(G, /Sono pronto/); }, 3000);
      await W.dorme(1500);
      if (vm(C).fase !== "lobby" || P.document.querySelector(".sl-via")) no("con uno solo pronto si è partiti");
      await W.aspetta(function () { return W.clicca(L, /Sono pronto/); }, 3000);
      if (!await W.aspetta(function () { return P.document.querySelector(".sl-via") || (vm(C).fase && vm(C).fase !== "lobby"); }, 3000)) no("tutti pronti, ma non parte il 3-2-1");
      if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("dopo il 3-2-1 la partita non comincia");
      return "con «Parti da solo» acceso: Giulia pronta → si aspetta, anche Luca pronto → 3-2-1 e via (" + vm(C).fase + ")";
    } },

    // 31. La musichetta (solo sul telefono dell'host, a codice: le note del motore audio finto) e il tasto 🎵/🔇:
    //     suona in saletta, si ferma col 🔇 (scelta ricordata anche dopo una ricarica), riparte col 🎵, tace nel 3-2-1
    31: { nome: "Musichetta della saletta e 🎵/🔇", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, prima: audioFinto }), C = await W.apriStanza(P, "La linea del tempo");
      var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185, prima: audioFinto });
      if (!await W.aspetta(function () { return dentro(G); }, 8000)) no("Giulia non entra");
      var bassi = function (w, da) { return w.__note.slice(da).filter(function (x) { return x.f < 130; }).length; };   // il basso della musichetta
      var n0 = P.__note.length; await W.dorme(1500);
      if (bassi(P, n0) < 2) no("sul telefono dell'host la musichetta non suona");
      if (bassi(G, 0) > 0) no("la musichetta suona anche sul telefono di chi entra");
      var b = P.document.querySelector(".sl-suono");
      if (!b || b.textContent !== "🎵") no("manca il tasto 🎵");
      b.click(); await W.dorme(600);
      var n1 = P.__note.length; await W.dorme(1500);
      if (bassi(P, n1) > 0) no("col 🔇 la musichetta continua");
      if (b.textContent !== "🔇") no("il tasto non diventa 🔇");
      P = await W.ricarica("Paky");
      await W.aspetta(function () { return P.document.querySelector(".sl-suono"); }, 6000);
      if (P.document.querySelector(".sl-suono").textContent !== "🔇") no("dopo la ricarica il 🔇 non è ricordato");
      var n2 = P.__note.length; await W.dorme(1200);
      if (bassi(P, n2) > 0) no("dopo la ricarica (🔇) la musichetta suona");
      P.document.querySelector(".sl-suono").click(); var n3 = P.__note.length; await W.dorme(1500);
      if (bassi(P, n3) < 2) no("col 🎵 la musichetta non riparte");
      await W.aspetta(function () { return dentro(G); }, 8000);
      W.clicca(P, /Comincia/); await W.dorme(700); var n4 = P.__note.length; await W.dorme(1200);
      if (bassi(P, n4) > 0) no("durante il 3-2-1 la musichetta continua");
      return "suona solo dall'host, 🔇 la ferma (ricordato dopo la ricarica), 🎵 la riaccende, tace nel 3-2-1";
    } },

    // 32. Senza profilo (dal 15 ott): il benvenuto del profilo con l'avatar che avrai, il 🎲 propone un nome buffo (cambia
    //     anche l'avatar); creato il profilo e toccato "Fatto", l'host lo vede entrare con quel nome e quell'avatar
    32: { nome: "Senza profilo: benvenuto col 🎲 (nomi buffi e avatar in anteprima), poi dentro", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      var L = await W.apriTel("Luca", { hash: "gioco=scalinata&stanza=" + C, x: 185, profilo: false });
      var dado = await W.aspetta(function () { return L.document.querySelector(".benvenuto-profilo .sl-dado"); }, 4000);
      if (!dado) no("nel benvenuto, accanto al nome non c'è il 🎲");
      var input = L.document.querySelector(".sl-nome-campo input"), ant = L.document.querySelector(".sl-anteprima");
      if (!ant) no("manca l'avatar in anteprima");
      var visti = {}, svg0 = ant.innerHTML;
      for (var i = 0; i < 6; i++) { dado.click(); var n = input.value; if (!/^[A-Z][a-zà]+ [A-Z][a-zà]+$/.test(n) || n.length > 16) no("nome buffo strano: «" + n + "»"); visti[n] = 1; }
      if (Object.keys(visti).length < 4) no("il 🎲 propone sempre gli stessi nomi: " + Object.keys(visti).join(", "));
      if (ant.innerHTML === svg0) no("col 🎲 l'avatar in anteprima non cambia");
      var nome = input.value;
      await creaProfilo(L, null, "segreto1");
      if (!await W.aspetta(function () { return JSON.stringify(vm(C)).indexOf("\"" + nome + "\"") >= 0; }, 6000)) no("l'host non vede entrare «" + nome + "»");
      if (!await W.aspetta(function () { return avatarDi(P, nome); }, 3000)) no("nella saletta dell'host non c'è «" + nome + "»");
      var gio = [].concat(vm(C).posti || [], vm(C).giocatori || [], vm(C).players || []).filter(function (g) { return g && g.nome === nome; })[0];
      if (!L.__fp.omino || L.__fp.omino.forma !== "uomo" || L.__fp.omino.capo !== "maglietta") no("l'avatar del profilo non è quello scelto (lui, look Casual)");   // (dal 15 ott: lui/lei e il look, primoAvatar)
      if (!gio || JSON.stringify(gio.omino) !== JSON.stringify(L.__fp.omino)) no("l'avatar che vede l'host non è quello del profilo");
      return "nomi proposti: " + Object.keys(visti).join(", ") + "; è entrato «" + nome + "» col profilo e l'avatar scelto (lui, Casual)";
    } },

    // 33. Sei telefoni: tutto in uno schermo da 360x640 e da 412x915 (niente scorre), i nomi non si coprono, gli avatar
    //     stanno nella stanza; per l'host e per chi entra
    33: { nome: "Sei telefoni: tutto in uno schermo (360x640 e 412x915)", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
      var nomi = ["Giulia", "Luca", "Sara", "Marco", "Anna"];
      for (var i = 0; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=timeline&stanza=" + C, x: 185 * (i + 1) });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 6; }, 12000)) no("non sono entrati in 6");
      await W.dorme(1500);
      var esiti = [];
      for (var k = 0; k < 2; k++) {
        var M = k ? [412, 915] : [360, 640];
        for (var j = 0; j < 2; j++) {
          var nome = j ? "Giulia" : "Paky", e = await controllaSchermo(W.finestra(nome), nome, M[0], M[1]);
          if (e) no(nome + " a " + M[0] + "x" + M[1] + ": " + e);
          esiti.push(nome + " " + M[0] + "x" + M[1] + " ok");
        }
      }
      return esiti.join(", ");
    } },

    // 34. Nella Sala: le faccine arrivano a tutti, l'host fa uscire (tenendo premuto) e chiude la porta: chi è fatto uscire
    //     legge "Sei fuori dalla Sala", chi è nuovo "La Sala è chiusa"; se l'host ricarica, la Sala riapre con la porta chiusa
    34: { nome: "Sala: faccine, «Fai uscire» e porta chiusa", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), S = await apriSala("Paky");
      var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185 });
      var L = await W.apriTel("Luca", { hash: "sala=" + S, x: 370 });
      if (!await W.aspetta(function () { return (vm(S).membri || []).length === 3 && avatarDi(P, "Luca") && avatarDi(G, "Luca"); }, 8000)) no("non sono entrati in 3 nella Sala");
      var conta = contaFaccine([P, L]);
      if (!await W.aspetta(function () { var b = G.document.querySelectorAll(".sl-fa")[0]; if (b && !b.disabled && !b.closest("[hidden]")) { b.click(); return true; } return false; }, 3000)) no("nella Sala Giulia non ha le faccine");
      if (!await W.aspetta(function () { return conta.n[0] >= 1 && conta.n[1] >= 1; }, 3000)) no("nella Sala la faccina di Giulia non arriva a tutti");
      var av = avatarDi(P, "Luca"), r = av.getBoundingClientRect();
      var ev = function (t) { av.dispatchEvent(new P.PointerEvent(t, { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 3, pointerId: 1, pointerType: "touch" })); };
      ev("pointerdown"); await W.dorme(700); ev("pointerup"); av.click();
      var b = await W.aspetta(function () { return P.document.querySelector(".sl-menu .sl-menu-fuori"); }, 2000);
      if (!b) no("nella Sala, tenendo premuto su Luca, non compare «Fai uscire»");
      b.click();
      if (!await W.aspetta(function () { return /Sei fuori dalla Sala/.test(T(L)); }, 4000)) no("Luca non legge «Sei fuori dalla Sala» («" + T(L).slice(0, 60) + "»)");
      if (!await W.aspetta(function () { return (vm(S).membri || []).length === 2; }, 4000)) no("Luca è ancora tra i membri della Sala");
      P.document.querySelector(".sl-porta").click();
      var M = await W.apriTel("Marco", { hash: "sala=" + S, x: 555 });
      if (!await W.aspetta(function () { return /La Sala è chiusa/.test(T(M)); }, 6000)) no("con la porta chiusa Marco legge «" + T(M).slice(0, 80) + "»");
      P = await W.ricarica("Paky");
      if (!await W.aspetta(function () { return /Porta chiusa/.test(statoHost(P)) && (vm(S).membri || []).length === 2; }, 9000)) no("riaperta la Sala, la porta non è più chiusa (o Giulia non è rientrata)");
      return "faccina di Giulia a tutti, Luca «Sei fuori dalla Sala», Marco «La Sala è chiusa», la Sala riaperta dall'host ha ancora la porta chiusa";
    } },

    // ===== 90-96: PROFILO E AVATAR OBBLIGATORI (p0, 15 ott 2026) =====
    // 90. Primo avvio senza profilo: benvenuto (prima della home) → nome e password → avatar già pronto → "Fatto" → home.
    //     Tutto in uno schermo (anche con la tastiera aperta); ricaricando si entra da soli
    90: { nome: "Primo avvio: benvenuto → profilo → avatar → home", fai: async function () {
      var N = await W.apriTel("Nina", { x: 0, profilo: false, prima: spiaProfilo });
      if (!await W.aspetta(function () { return /Benvenuto in SPeeD GAME/.test(T(N)); }, 4000)) no("niente benvenuto all'avvio («" + T(N).slice(0, 60) + "»)");
      if (home(N)) no("la home si vede senza profilo");
      var mis = await misureProfilo(N, "Nina", true);
      var campi = N.document.querySelectorAll(".benvenuto-profilo input.link-campo");
      campi[0].value = "N"; W.clicca(N, /^Avanti/);
      if (!/almeno 2 lettere/.test(T(N))) no("nome di una lettera: nessun avviso");
      campi[0].value = "Nina"; campi[0].dispatchEvent(new N.Event("input", { bubbles: true })); campi[1].value = "abc"; W.clicca(N, /^Avanti/);
      if (!/almeno 6 caratteri/.test(T(N))) no("password corta: nessun avviso");
      campi[1].value = "segreto1"; W.clicca(N, /^Avanti/);
      var ed = await W.aspetta(function () { return N.document.querySelector(".primo-avatar .pa-forma"); }, 4000);
      if (!ed) no("dopo «Avanti» non si apre «Sei lui o lei?»");
      if (!W.BR.conti.nina) no("il profilo non è stato creato");
      if (!N.__fp.omino || JSON.stringify(N.__fp.omino) !== JSON.stringify(N.SGOmino.norm(N.SGOmino.casuale("Nina")))) no("l'avatar di riserva non è salvato subito");
      if (!/Sei lui o lei/.test(T(N))) no("manca «Sei lui o lei?»");
      var misE = await misuraProfilo(N, "Nina", 360, 640); if (misE) no("lui/lei a 360x640: " + misE);
      misE = await misuraProfilo(N, "Nina", 412, 915); if (misE) no("lui/lei a 412x915: " + misE);
      N.document.querySelectorAll(".primo-avatar .pa-forma")[1].click(); await W.dorme(100);
      if (!/Scegli il tuo look/.test(T(N))) no("dopo «Lei» non c'è «Scegli il tuo look»");
      misE = await misuraProfilo(N, "Nina", 360, 640); if (misE) no("i look a 360x640: " + misE);
      misE = await misuraProfilo(N, "Nina", 412, 915); if (misE) no("i look a 412x915: " + misE);
      var f = document.getElementById("tel-Nina"); f.style.width = "360px"; f.style.height = "740px";
      var fatto = N.document.querySelector(".primo-avatar .pa-fatto");
      if (!fatto.disabled) no("«Fatto» acceso prima del look");
      N.document.querySelectorAll(".primo-avatar .pa-look")[1].click();
      if (fatto.disabled) no("scelto il look, «Fatto» resta spento");
      fatto.click();
      if (!await W.aspetta(function () { return home(N); }, 4000)) no("toccato «Fatto», non si arriva alla home");
      if (!N.__fp.omino || N.__fp.omino.forma !== "donna" || N.__fp.omino.capo !== "vestitolungo") no("l'avatar salvato non è «Lei, Elegante» (" + JSON.stringify(N.__fp.omino || {}).slice(0, 80) + ")");
      if (!/Nina/.test(T(N))) no("nella home non c'è il nome del profilo");
      var ric = JSON.parse(N.localStorage.getItem("sg-ultimo-profilo") || "null");
      if (!ric || ric.nome !== "Nina") no("il telefono non ricorda il profilo");
      N = await W.ricarica("Nina");
      if (!await W.aspetta(function () { return home(N); }, 3000)) no("ricaricando non si torna alla home");
      if (N.__visto.length) no("ricaricando ha visto: " + N.__visto.join(", "));
      N = await W.chiudiApp("Nina");
      if (!await W.aspetta(function () { return home(N); }, 3000) || N.__visto.length) no("riaprendo l'app non si entra da soli");
      return "benvenuto ok (" + mis + "), lui o lei → look → Fatto (360x640 e 412x915), home; ricarica e app riaperta: home senza domande";
    } },

    // 91. Primo avvio da un link di una stanza: il benvenuto dice chi ti aspetta, poi profilo → avatar → dentro la stanza giusta
    91: { nome: "Primo avvio da un link: profilo → avatar → dentro la stanza", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var G = await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185, profilo: false });
      var inv = await W.aspetta(function () { var x = G.document.querySelector(".bp-invito"); return x && x.textContent; }, 4000);
      if (!inv || !/Tris/.test(inv)) no("nel benvenuto non c'è l'invito al Tris («" + inv + "»)");
      if (G.location.hash) no("il link resta nell'indirizzo");
      if (vm(C).avvId) no("Giulia è entrata nella stanza prima di fare il profilo");
      await creaProfilo(G, "Giulia", "segreto1");
      if (!await W.aspetta(function () { return vm(C).avvId && dentro(G); }, 6000)) no("fatto il profilo, Giulia non entra nel Tris (" + T(G).slice(0, 80) + ")");
      var gio = [].concat(vm(C).posti || [], vm(C).giocatori || [], vm(C).players || []).filter(function (g) { return g && g.nome === "Giulia"; })[0];
      if (gio && gio.omino && JSON.stringify(gio.omino) !== JSON.stringify(G.__fp.omino)) no("nella stanza Giulia non ha l'avatar del profilo");
      if (!/Giulia/.test(JSON.stringify(vm(C)))) no("nella stanza non c'è il nome del profilo");
      return "invito «" + inv + "» → profilo → avatar → dentro il Tris " + C;
    } },

    // 92. Primo avvio dal link di una Sala: profilo → avatar → dentro la Sala, col nome e l'avatar del profilo
    92: { nome: "Primo avvio dal link di una Sala: profilo → avatar → nella Sala", fai: async function () {
      await W.apriTel("Paky", { x: 0 });
      var S = await apriSala("Paky");
      var R = await W.apriTel("Sara", { hash: "sala=" + S, x: 185, profilo: false });
      var inv = await W.aspetta(function () { var x = R.document.querySelector(".bp-invito"); return x && x.textContent; }, 4000);
      if (!inv || inv.indexOf(S) < 0) no("nel benvenuto non c'è l'invito alla Sala («" + inv + "»)");
      if ((vm(S).membri || []).length !== 1) no("Sara è nella Sala prima di fare il profilo");
      await creaProfilo(R, "Sara", "segreto1");
      var m = await W.aspetta(function () { return (vm(S).membri || []).filter(function (x) { return x.nome === "Sara"; })[0]; }, 6000);
      if (!m) no("fatto il profilo, Sara non entra nella Sala");
      if (JSON.stringify(m.omino) !== JSON.stringify(R.__fp.omino)) no("nella Sala Sara non ha l'avatar del profilo");
      if (!await W.aspetta(function () { return R.document.querySelector(".saletta-schermo"); }, 3000)) no("Sara non vede la Sala");
      return "invito «" + inv + "» → profilo → avatar → nella Sala " + S;
    } },

    // 93. Telefono col profilo che apre un link: dentro subito, nessuna schermata del profilo nemmeno per un attimo
    93: { nome: "Col profilo, dal link: dentro subito senza domande", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      var t0 = Date.now();
      var L = await W.apriTel("Luca", { hash: "gioco=scalinata&stanza=" + C, x: 185, prima: spiaProfilo });
      if (!await W.aspetta(function () { return ids(C).length === 2 && dentro(L); }, 5000)) no("Luca non entra");
      var dt = ((Date.now() - t0) / 1000).toFixed(1);
      if (L.__visto.length) no("ha visto: " + L.__visto.join(", "));
      if (L.document.querySelector("input.link-campo")) no("gli chiede il nome");
      return "dentro in " + dt + " s, nessuna domanda";
    } },

    // 94. "Hai già un profilo? Entra" (telefono nuovo): password sbagliata → avviso; giusta → dritto nella stanza del link
    94: { nome: "«Hai già un profilo? Entra»: dritto nella stanza", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      W.contoFinto("Marco", "segreto9");
      var M = await W.apriTel("Marco", { hash: "gioco=tris&stanza=" + C, x: 185, profilo: false, prima: spiaProfilo });
      if (!await W.aspetta(function () { return M.document.querySelector(".bp-gia"); }, 4000)) no("niente «Hai già un profilo? Entra»");
      W.clicca(M, /Hai già un profilo/);
      var e = await W.aspetta(function () { return M.document.querySelector(".bp-entra"); }, 2000);
      if (!e) no("non si apre «Entra col tuo profilo»");
      var mis = await misureProfilo(M, "Marco", true);
      var campi = e.querySelectorAll("input.link-campo");
      campi[0].value = "Marco"; campi[1].value = "sbagliata"; W.clicca(M, /^Entra/);
      if (!await W.aspetta(function () { return /sbagliat/.test(T(M)); }, 2000)) no("password sbagliata: nessun avviso");
      campi[1].value = "segreto9"; W.clicca(M, /^Entra/);
      if (!await W.aspetta(function () { return vm(C).avvId && dentro(M); }, 6000)) no("entrato col profilo, Marco non è nel Tris (" + T(M).slice(0, 80) + ")");
      if (M.__visto.indexOf("editor") >= 0) no("entrando col profilo gli ha aperto l'editor dell'avatar");
      return "entra (" + mis + "): password sbagliata avvisata, poi dritto nel Tris " + C;
    } },

    // 95. La sessione è sparita ma il telefono ricorda il profilo: "Bentornato, Anna!" chiede SOLO la password, poi la home;
    //     dopo, ricaricando, si entra da soli
    95: { nome: "Sessione scaduta: «Bentornato» chiede solo la password", fai: async function () {
      W.contoFinto("Anna", "segreto7");
      var ricordo = function (w) { if (!w.localStorage.getItem("sg-ultimo-profilo")) w.localStorage.setItem("sg-ultimo-profilo", JSON.stringify({ nome: "Anna", omino: w.SGOmino.casuale("Anna") })); };
      var A = await W.apriTel("Anna", { x: 0, profilo: false, prima: function (w) { ricordo(w); spiaProfilo(w); } });
      var b = await W.aspetta(function () { return A.document.querySelector(".bp-bentornato"); }, 4000);
      if (!b) no("niente «Bentornato» («" + T(A).slice(0, 60) + "»)");
      if (!/Bentornato, Anna/.test(T(A))) no("il nome non è già scritto");
      if (b.querySelectorAll("input.link-campo").length !== 1) no("chiede più della password");
      var mis = await misureProfilo(A, "Anna", true);
      b.querySelector("input.link-campo").value = "segreto7"; W.clicca(A, /^Entra/);
      if (!await W.aspetta(function () { return home(A); }, 4000)) no("con la password giusta non si arriva alla home");
      A = await W.ricarica("Anna", { prima: spiaProfilo });
      if (!await W.aspetta(function () { return home(A); }, 3000) || A.__visto.length) no("ricaricando richiede qualcosa: " + (A.__visto || []).join(", "));
      return "bentornato (" + mis + ") → password → home; ricaricando, home senza domande";
    } },

    // 96. Niente internet alla prima apertura: "Serve internet per creare il profilo" + Riprova; tornata la rete, il benvenuto.
    //     Rete che cade mentre si crea: avviso chiaro. Chi ha già il profilo, senza rete, entra lo stesso
    96: { nome: "Senza internet: «Serve internet», Riprova; chi ha il profilo entra lo stesso", fai: async function () {
      var X = await W.apriTel("Pino", { x: 0, profilo: false, offline: true });
      if (!await W.aspetta(function () { return /Serve internet per creare il profilo/.test(T(X)); }, 4000)) no("senza rete non dice «Serve internet» («" + T(X).slice(0, 60) + "»)");
      if (home(X)) no("senza profilo si vede la home");
      var mis = await misureProfilo(X, "Pino", false);
      W.clicca(X, /Riprova/); await W.dorme(300);
      if (!/Serve internet/.test(T(X))) no("Riprova senza rete: è sparito l'avviso");
      X.__offline = false; W.clicca(X, /Riprova/);
      if (!await W.aspetta(function () { return /Benvenuto in SPeeD GAME/.test(T(X)); }, 3000)) no("tornata la rete, Riprova non apre il benvenuto");
      X.__reteGiu = true;
      var campi = X.document.querySelectorAll(".benvenuto-profilo input.link-campo");
      campi[0].value = "Pino"; campi[1].value = "segreto1"; W.clicca(X, /^Avanti/);
      if (!await W.aspetta(function () { return /Serve internet/.test(T(X)); }, 2000)) no("rete giù mentre crea: nessun avviso chiaro");
      X.__reteGiu = false; W.clicca(X, /^Avanti/);
      if (!await W.aspetta(function () { return X.document.querySelector(".primo-avatar, .editor-avatar"); }, 3000)) no("tornata la rete, Avanti non crea il profilo");
      // chi ha già il profilo (il telefono lo ricorda), senza rete: entra lo stesso, col suo nome
      var R = await W.apriTel("Rita", { x: 185, profilo: false, offline: true, prima: function (w) { w.localStorage.setItem("sg-ultimo-profilo", JSON.stringify({ nome: "Rita", omino: null })); } });
      if (!await W.aspetta(function () { return home(R); }, 3000)) no("chi ha il profilo, senza rete, non entra («" + T(R).slice(0, 60) + "»)");
      if (!/Rita/.test(T(R))) no("senza rete nella home non c'è il suo nome");
      return "«Serve internet» (" + mis + "), Riprova, avviso se la rete cade; Rita senza rete entra lo stesso";
    } },

    // 97. (controllo del passo 0) Sessione sparita e niente rete, ma il telefono ricorda il profilo: si entra col nome
    //     ricordato e i giochi si aprono (prima "Gioca lo stesso" riportava sempre a «Bentornato»)
    97: { nome: "Sessione sparita e senza rete: si gioca col profilo ricordato", fai: async function () {
      var O = await W.apriTel("Olga", { x: 0, profilo: false, prima: function (w) { w.localStorage.setItem("sg-ultimo-profilo", JSON.stringify({ nome: "Olga", omino: null })); w.__reteGiu = true; } });
      if (!await W.aspetta(function () { return home(O) && /Olga/.test(T(O)); }, 3000)) no("senza rete non entra col nome ricordato («" + T(O).slice(0, 60) + "»)");
      W.clicca(O, /Tris/);
      if (!await W.aspetta(function () { return /Come giocate/.test(T(O)); }, 2000)) no("senza rete il Tris chiede il profilo («" + T(O).slice(0, 60) + "»)");
      W.contoFinto("Pia", "segreto1");
      var Q = await W.apriTel("Pia", { x: 185, profilo: false, prima: function (w) { w.localStorage.setItem("sg-ultimo-profilo", JSON.stringify({ nome: "Pia", omino: null })); } });
      var b = await W.aspetta(function () { return Q.document.querySelector(".bp-bentornato input.link-campo"); }, 3000);
      if (!b) no("niente «Bentornato»");
      Q.__reteGiu = true; b.value = "segreto1"; W.clicca(Q, /^Entra/);
      if (!await W.aspetta(function () { return W.clicca(Q, /Gioca lo stesso/); }, 2000)) no("rete giù: niente «Gioca lo stesso»");
      if (!await W.aspetta(function () { return home(Q); }, 2000)) no("«Gioca lo stesso» non porta alla home");
      W.clicca(Q, /Tris/);
      if (!await W.aspetta(function () { return /Come giocate/.test(T(Q)); }, 2000)) no("dopo «Gioca lo stesso» il Tris riporta a «Bentornato»");
      return "Olga entra senza rete e apre il Tris; Pia «Gioca lo stesso» → home → Tris";
    } },

    // ===== PASSO 2: una Sala per tutta la serata (p2-a: "Online" = Sala). Telefoni con salaSempre: true =====
    // 35. Tessera del Tris → "Online con gli amici": l'host è nella saletta del Tris in 2 tocchi (dentro una Sala nuova,
    //     "ho un codice" subito sotto "Online", nessuna schermata delle impostazioni); Giulia dal link della Sala è nella
    //     saletta del Tris da sola, con lo stesso id nella Sala e nel gioco
    35: { nome: "Online da un gioco apre la Sala: saletta in 2 tocchi, Giulia dal link della Sala", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
      var tess = await W.aspetta(function () { return tessera(P, "Tris"); }, 5000); if (!tess) no("non trovo il Tris");
      tess.click(); await W.dorme(200);
      var mg = modiVisti(P), iO = -1;
      mg.forEach(function (t, k) { if (/Online con gli amici/.test(t)) iO = k; });
      if (iO < 0) no("in «Come giocate?» non c'è «Online con gli amici» (" + mg.join(" / ") + ")");
      if (!/Si apre la Sala: un codice per tutta la serata/.test(mg[iO])) no("sotto «Online con gli amici»: «" + mg[iO] + "»");
      if (!/ho un codice/.test(mg[iO + 1] || "")) no("«Online: ho un codice» non è subito sotto «Online» (" + mg.join(" / ") + ")");
      if (mg.some(function (t) { return /apro io la stanza/.test(t); })) no("c'è ancora «Online: apro io la stanza»");
      var spia = spiaTesto(P, /Apri la stanza|Comincia per tutti|impostazioni/);
      var A = await (async function () { W.clicca(P, /Online con gli amici/, ".modo-grande"); var C = await W.aspetta(function () { return P.document.querySelector(".saletta-schermo") && codiceSaletta(P); }, 5000); return C; })();
      var visto = spia.stop();
      if (!A) no("dopo «Online con gli amici» l'host non è nella saletta («" + T(P).slice(0, 80) + "»)");
      if (visto) no("tra la tessera e la saletta si è vista «" + visto + "»");
      var S = await W.aspetta(codiceSala, 3000); if (!S) no("nel broker non c'è la Sala");
      if (S === A) no("la Sala e il Tris hanno lo stesso codice");
      if (vm(S).gioco !== "tris" || vm(S).stanza !== A) no("la Sala non dice che si gioca a Tris nella stanza " + A + " (" + vm(S).gioco + ", " + vm(S).stanza + ")");
      if (!/Tris/.test(T(P))) no("la saletta non è quella del Tris");
      // Giulia apre il link della Sala
      var t0 = Date.now();
      var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
      var t1 = Date.now();
      if (!await W.aspetta(function () { return dentro(G) && G.document.querySelector(".saletta-schermo") && vm(A).avvId; }, 6000)) no("Giulia non arriva nella saletta del Tris («" + T(G).slice(0, 80) + "»)");
      var dt = (Date.now() - t0) / 1000, dtDopo = (Date.now() - t1) / 1000;
      if (dt > 2) no("Giulia è nella saletta " + dt.toFixed(1) + " s dopo aver aperto il link (più di 2)");
      var idS = idInSala(S, "Giulia"), idG = vm(A).avvId;
      if (!idS) no("Giulia non è tra i membri della Sala");
      if (idS !== idG || mioId("Giulia") !== idG) no("Giulia ha un id nella Sala (" + idS + ") e un altro nel Tris (" + idG + ")");
      if (W.statoStanza(A) && G.document.querySelector(".sl-nome.tu") == null) no("Giulia non si vede «Tu» nella saletta");
      return "Paky nella saletta del Tris in 2 tocchi (Sala " + S + ", Tris " + A + "); Giulia dentro in " + dt.toFixed(1) + " s dal link (caricamento compreso), stesso id " + idG;
    } },

    // 36. Sala già aperta: l'host esce dal Tris (torna nella Sala), sceglie La Scalinata e va dritto nella saletta (niente
    //     schermata delle impostazioni, le regole stanno nel ⚙️); Giulia ci arriva da sola, con lo stesso id
    36: { nome: "Dalla Sala un altro gioco: niente schermata delle impostazioni, gli amici seguono da soli", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
      var A = await salaDaGioco("Paky", "Tris"), S = A.S;
      var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
      if (!await W.aspetta(function () { return dentro(G) && vm(A.C).avvId; }, 6000)) no("Giulia non entra nel Tris");
      var idS = idInSala(S, "Giulia");
      // l'host esce dal Tris: tutti e due nella Sala
      W.clicca(P, /‹/, ".testa button, .sc-esci");
      var inSala = function (w) { return /Sala online/.test(W.testo(w)) && w.document.querySelector(".saletta-schermo"); };
      if (!await W.aspetta(function () { return inSala(P) && !vm(S).gioco && inSala(G); }, 6000)) no("uscito dal Tris, non sono tutti e due nella Sala (Paky «" + T(P).slice(0, 50) + "», Giulia «" + T(G).slice(0, 50) + "»)");
      var spia = spiaTesto(P, /Comincia per tutti|Sala · impostazioni/), spiaG = spiaTesto(G, /Ops|Collegamento perso/);
      if (!W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/)) no("nella Sala non c'è «Scegli un gioco»");
      var tess = await W.aspetta(function () { return tessera(P, "La Scalinata"); }, 4000); if (!tess) no("non trovo La Scalinata tra i giochi della Sala");
      tess.click();
      var C2 = await W.aspetta(function () { var c = codiceSaletta(P); return c && c !== A.C && vm(S).gioco === "scalinata" && vm(S).stanza === c ? c : null; }, 5000);
      var visto = spia.stop();
      if (!C2) no("toccata La Scalinata, l'host non è nella sua saletta («" + T(P).slice(0, 80) + "»)");
      if (visto) no("si è vista la schermata delle impostazioni («" + visto + "»)");
      if (!await W.aspetta(function () { return ids(C2).indexOf(idS) >= 0 && dentro(G); }, 6000)) no("Giulia non arriva da sola nella Scalinata (" + ids(C2).join(",") + ")");
      var erroriG = spiaG.stop(); if (erroriG) no("Giulia ha visto «" + erroriG + "»");
      var reg = [].some.call(P.document.querySelectorAll("button"), function (b) { return /Regole|⚙️/.test(b.textContent); });
      // di nuovo il Tris: stessa Sala, le regole della serata restano
      W.clicca(P, /‹/, ".testa button, .sc-esci");
      if (!await W.aspetta(function () { return inSala(P) && !vm(S).gioco; }, 5000)) no("uscito dalla Scalinata, l'host non è nella Sala");
      W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/);
      var t2 = await W.aspetta(function () { return tessera(P, "Tris"); }, 4000); t2.click();
      var C3 = await W.aspetta(function () { var c = codiceSaletta(P); return c && c !== C2 && vm(S).gioco === "tris" ? c : null; }, 5000);
      if (!C3) no("la seconda volta il Tris non parte");
      if (!await W.aspetta(function () { return vm(C3).avvId === idS && dentro(G); }, 6000)) no("la seconda volta Giulia non entra nel Tris");
      if (codiceSala() !== S) no("la Sala è cambiata");
      return "Sala " + S + ": Tris → Scalinata (" + C2 + ") → Tris (" + C3 + ") senza impostazioni, Giulia sempre dentro da sola con l'id " + idS + (reg ? "; nella saletta c'è il ⚙️" : "");
    } },

    // 37. Interruttore spento (sg-sala-sempre = "0", come i telefoni degli scenari vecchi): "Online: apro io la stanza" →
    //     impostazioni → "🔗 Apri la stanza", nessuna Sala; e lo si spegne anche su un telefono acceso, senza ricaricare
    37: { nome: "Interruttore spento: il percorso di prima", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 });
      if (P.localStorage.getItem("sg-sala-sempre") !== "0") no("il telefono finto non parte con sg-sala-sempre = 0");
      var tess = await W.aspetta(function () { return tessera(P, "Tris"); }, 5000); tess.click(); await W.dorme(200);
      var mg = modiVisti(P), iO = -1; mg.forEach(function (t, k) { if (/apro io la stanza/.test(t)) iO = k; });
      if (iO < 0 || mg.some(function (t) { return /Online con gli amici/.test(t); })) no("spento, «Come giocate?» dice: " + mg.join(" / "));
      if (!/ho un codice/.test(mg[iO + 1] || "")) no("«ho un codice» non è subito sotto «Online»");
      W.clicca(P, /apro io/); await W.dorme(250);
      if (!/Apri la stanza/.test(T(P))) no("niente schermata delle impostazioni con «Apri la stanza» («" + T(P).slice(0, 60) + "»)");
      W.clicca(P, /Apri la stanza/);
      var C = await W.aspetta(function () { return codiceSaletta(P); }, 5000); if (!C) no("la stanza non ha il codice");
      if (codiceSala()) no("si è aperta anche una Sala");
      await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return vm(C).avvId; }, 6000)) no("Giulia non entra dal link del gioco");
      // un telefono con la Sala accesa: spento a mano (senza ricaricare) torna il percorso di prima
      var M = await W.apriTel("Marco", { x: 370, salaSempre: true });
      var tm = await W.aspetta(function () { return tessera(M, "Tris"); }, 5000); tm.click(); await W.dorme(200);
      if (!modiVisti(M).some(function (t) { return /Online con gli amici/.test(t); })) no("acceso, Marco non vede «Online con gli amici»");
      W.clicca(M, /‹/, ".testa button"); await W.dorme(250);
      M.localStorage.setItem("sg-sala-sempre", "0");
      tm = await W.aspetta(function () { return tessera(M, "Tris"); }, 3000); tm.click(); await W.dorme(200);
      if (!modiVisti(M).some(function (t) { return /apro io la stanza/.test(t); })) no("spento a mano, Marco non vede «Online: apro io la stanza» (" + modiVisti(M).join(" / ") + ")");
      return "spento: «apro io la stanza» → impostazioni → stanza " + C + " (nessuna Sala), Giulia entra dal link; acceso e poi spento a mano: torna il percorso di prima";
    } },

    // 37b. Senza profilo (dentro, ma il profilo non arriva: oggi l'unico caso): la Sala si apre lo stesso, il nome si scrive
    //      una volta ("Come ti chiami?" col 🎲); ricaricando la Sala si riapre da sola (stesso codice, Giulia di nuovo dentro);
    //      con il nome dell'ultima volta non chiede niente
    "37b": { nome: "Host senza profilo: apre la Sala e ricaricando la ritrova", fai: async function () {
      var senza = function (w) { w.SGNube.utente = function () { return { uid: "finto-senza" }; }; };
      var N = await W.apriTel("Nino", { x: 0, profilo: false, salaSempre: true, prima: senza });
      if (!await W.aspetta(function () { return home(N); }, 4000)) no("senza profilo non si arriva alla home («" + T(N).slice(0, 60) + "»)");
      if (!/Crea il tuo profilo/.test(T(N))) no("questo telefono ha un profilo");
      if (!W.clicca(N, /Gioca online/, ".home-online button")) no("in home non c'è «🔗 Gioca online»");   // (p2-c: la Sala si apre dalla riga online)
      var inp = await W.aspetta(function () { return N.document.querySelector("input.link-campo"); }, 3000);
      if (!inp || !/Come ti chiami/.test(inp.placeholder)) no("non chiede «Come ti chiami?» («" + T(N).slice(0, 60) + "»)");
      if (!N.document.querySelector(".sl-dado")) no("accanto al nome non c'è il 🎲");
      if (/password|profilo/i.test(T(N))) no("chiede il profilo: «" + T(N).slice(0, 80) + "»");
      inp.value = "Nino"; W.clicca(N, /Apri la Sala/);
      var S = await W.aspetta(function () { return codiceSaletta(N); }, 5000); if (!S) no("la Sala non si apre");
      if (((vm(S).membri || [])[0] || {}).nome !== "Nino") no("nella Sala l'host si chiama «" + ((vm(S).membri || [])[0] || {}).nome + "»");
      var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
      if (!await W.aspetta(function () { return (vm(S).membri || []).length === 2 && G.document.querySelector(".saletta-schermo"); }, 6000)) no("Giulia non entra nella Sala di Nino");
      N = await W.ricarica("Nino");
      var ok = await W.aspetta(function () { return codiceSaletta(N) === S && /Sala online/.test(W.testo(N)) && (vm(S).membri || []).length === 2 && W.finestra("Giulia").document.querySelector(".saletta-schermo"); }, 10000);
      if (!ok) no("ricaricando la Sala non si riapre («" + T(N).slice(0, 80) + "»)");
      if (N.document.querySelector("input.link-campo")) no("ricaricando richiede il nome");
      if (((vm(S).membri || [])[0] || {}).nome !== "Nino") no("dopo la ricarica l'host si chiama «" + ((vm(S).membri || [])[0] || {}).nome + "»");
      // un altro telefono senza profilo che ha già scritto il suo nome una volta: niente domande
      var Q = await W.apriTel("Pino", { x: 370, profilo: false, salaSempre: true, prima: function (w) { senza(w); w.localStorage.setItem("sg-nome-ospite", "Pino"); } });
      await W.aspetta(function () { return home(Q); }, 4000);
      W.clicca(Q, /Gioca online/, ".home-online button");
      var S2 = await W.aspetta(function () { return codiceSaletta(Q); }, 5000);
      if (!S2) no("col nome dell'ultima volta la Sala non si apre («" + T(Q).slice(0, 60) + "»)");
      if (((vm(S2).membri || [])[0] || {}).nome !== "Pino") no("la Sala di Pino ha l'host «" + ((vm(S2).membri || [])[0] || {}).nome + "»");
      return "Nino (senza profilo) scrive il nome una volta e apre la Sala " + S + "; ricaricando la ritrova con Giulia dentro; Pino (nome già scritto) la apre senza domande";
    } },

    // 38. La testata della Sala (p2-b): nella saletta del Tris, per Paky e per Giulia, il codice della Sala (il testo resta
    //     "KFRT": lo spazio tra le lettere è solo CSS), "📤 Invita gli amici" col link della Sala (sala=, non stanza=) e il
    //     messaggio "Stasera siamo nella Sala…"; sottotitolo "Sala · la stanza è tua" / "Sala di Paky"; testata alta al
    //     massimo 52 px e niente che scorre a 360x640 e 412x915. Poi la stessa testata nella Sala di Giulia
    38: { nome: "Testata della Sala in ogni saletta: codice, Invita, misure", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
      var A = await salaDaGioco("Paky", "Tris"), S = A.S, C = A.C;
      var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
      if (!await W.aspetta(function () { return dentro(G) && G.document.querySelector(".saletta-schermo") && vm(C).avvId; }, 6000)) no("Giulia non arriva nella saletta del Tris («" + T(G).slice(0, 80) + "»)");
      async function testata(nome, w, sotto, stanza, misure) {
        if (!await W.aspetta(function () { return codiceTestata(w) === S; }, 3000)) no(nome + ": nella testata c'è «" + ((w.document.querySelector(".sl-cod b") || {}).textContent) + "» invece del codice della Sala " + S);
        var b = w.document.querySelector(".sl-cod b");
        if (!(parseFloat(w.getComputedStyle(b).letterSpacing) > 0)) no(nome + ": il codice non è spaziato");
        if (stanza && codiceSaletta(w) !== stanza) no(nome + ": la stanza della saletta è " + codiceSaletta(w) + " invece di " + stanza);
        var et = w.document.querySelector(".sl-cod small").textContent; if (et !== "Sala") no(nome + ": sopra il codice c'è «" + et + "»");
        var st = await W.aspetta(function () { var x = w.document.querySelector(".saletta-schermo > .testa .sotto"); return x && x.textContent === sotto ? x : null; }, 2000);
        if (!st) no(nome + ": sotto il titolo «" + ((w.document.querySelector(".saletta-schermo > .testa .sotto") || {}).textContent) + "» invece di «" + sotto + "»");
        var inv = w.document.querySelector(".sl-invito .sl-link");
        if (!inv || !/📤 Invita/.test(inv.textContent) || inv.disabled) no(nome + ": niente «📤 Invita»");
        var mandato = null;
        Object.defineProperty(w.navigator, "share", { configurable: true, value: function (d) { mandato = d; return Promise.resolve(); } });
        inv.click();
        if (!mandato) no(nome + ": «Invita» non manda niente");
        if (mandato.url.indexOf("sala=" + S) < 0 || /stanza=/.test(mandato.url)) no(nome + ": il link di Invita è " + mandato.url);
        if (mandato.text.indexOf("Stasera siamo nella Sala " + S + ".") < 0 || mandato.text.indexOf("«🔑 Ho un codice» e scrivi: " + S) < 0) no(nome + ": il messaggio di Invita è «" + mandato.text + "»");
        for (var i = 0; i < misure.length; i++) {
          var r = await controllaSchermo(w, nome.split(" ")[0], misure[i][0], misure[i][1], 2); if (r) no(nome + " a " + misure[i].join("x") + ": " + r);
          var h = w.document.querySelector(".sl-invito").getBoundingClientRect().height;
          if (h > 52.5) no(nome + " a " + misure[i].join("x") + ": la testata è alta " + Math.round(h) + " px");
        }
        return mandato.text.split("\n")[0];
      }
      var mis = [[360, 640], [412, 915]];
      var msg = await testata("Paky", P, "Sala · la stanza è tua", C, mis);
      await testata("Giulia", G, "Sala di Paky", C, mis);
      // tutti e due tornano nella Sala: la stessa testata (codice della Sala, Invita) anche per Giulia
      // (larghezza di prima: con la finestra nascosta la stanza non si rimette a misura da sola)
      ["Paky", "Giulia"].forEach(function (n) { var f = document.getElementById("tel-" + n); f.style.width = "360px"; f.style.height = "740px"; });
      W.clicca(P, /‹/, ".testa button, .sc-esci");
      var inSala = function (w) { return /Sala online/.test(W.testo(w)) && w.document.querySelector(".saletta-schermo"); };
      if (!await W.aspetta(function () { return inSala(P) && inSala(G) && !vm(S).gioco; }, 6000)) no("uscito dal Tris, non sono tutti e due nella Sala");
      await testata("Giulia nella Sala", G, "Sala di Paky", S, [[360, 640]]);
      return "Paky e Giulia vedono la Sala " + S + " (stanza del Tris " + C + "), Invita col link della Sala («" + msg + "»), testata ≤ 52 px, niente scorre";
    } },

    // 39. La porta della Sala (p2-b): nella saletta della Scalinata Paky tocca "🔒 Chiudi" → Marco, nuovo, dal link della
    //     Sala legge "La Sala è chiusa"; Giulia (già nella Sala) esce dal gioco e rientra lo stesso; Paky riapre, Marco tocca
    //     "↻ Riprova" e finisce nella saletta della Scalinata
    39: { nome: "La porta della Sala si chiude dalla saletta del gioco", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
      var A = await salaDaGioco("Paky", "La Scalinata"), S = A.S, C = A.C;
      var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
      if (!await W.aspetta(function () { return dentro(G) && ids(C).length === 2; }, 6000)) no("Giulia non entra nella Scalinata (" + ids(C).join(",") + ")");
      var idG = mioId("Giulia");
      if (!W.clicca(P, /Chiudi/, ".sl-porta")) no("nella saletta non c'è «🔒 Chiudi»");
      if (!await W.aspetta(function () { return /Porta chiusa/.test(statoHost(P)); }, 2000)) no("sotto il titolo non c'è «🔒 Porta chiusa» («" + statoHost(P) + "»)");
      await W.dorme(400);
      var M = await W.apriTel("Marco", { hash: "sala=" + S, x: 370, salaSempre: true });
      if (!await W.aspetta(function () { return /La Sala è chiusa/.test(W.testo(M)); }, 8000)) no("Marco non legge «La Sala è chiusa» («" + T(M).slice(0, 80) + "»)");
      if ((vm(S).membri || []).some(function (m) { return m.nome === "Marco"; })) no("Marco è entrato nella Sala chiusa");
      if (ids(C).length !== 2) no("nella Scalinata ci sono " + ids(C).length + " giocatori");
      // Giulia è nella Sala: esce dal gioco e rientra anche con la porta chiusa
      W.clicca(G, /‹/, ".testa button, .sc-esci");
      if (!await W.aspetta(function () { return W.clicca(G, /Rientra/); }, 5000)) no("nella Sala Giulia non ha «Rientra» («" + T(G).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { return dentro(G) && ids(C).indexOf(idG) >= 0 && G.document.querySelector(".saletta-schermo"); }, 6000)) no("con la porta chiusa Giulia (che è nella Sala) non rientra nel gioco («" + T(G).slice(0, 80) + "»)");
      // Paky riapre: Marco riprova ed entra
      if (!W.clicca(P, /Riapri/, ".sl-porta")) no("non c'è «🔓 Riapri»");
      await W.dorme(500);
      if (!W.clicca(M, /Riprova/)) no("Marco non ha «↻ Riprova»");
      if (!await W.aspetta(function () { return dentro(M) && M.document.querySelector(".saletta-schermo") && ids(C).length === 3; }, 8000)) no("riaperta, Marco non arriva nella saletta della Scalinata («" + T(M).slice(0, 80) + "», " + ids(C).length + " giocatori)");
      return "porta chiusa dalla saletta del gioco: Marco legge «La Sala è chiusa», Giulia rientra lo stesso; riaperta, Marco è nella Scalinata (Sala " + S + ", stanza " + C + ")";
    } },

    // 40. La home (p2-c): in alto, sotto il profilo, "🔗 Gioca online" e "🔑 Ho un codice" (a 360x640 e 412x915 si vedono
    //     senza scorrere); nel piede niente più Sala e codice, "🏆 Torneo" è un tasto piccolo e porta al torneo; "Gioca online"
    //     apre la Sala; tornati in home c'è "👥 Torna nella Sala" col codice (e per Giulia "di Paky"), che riporta nella Sala
    40: { nome: "Home: «🔗 Gioca online» e «🔑 Ho un codice» in alto, Torneo piccolo, «Torna nella Sala»", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
      if (!await W.aspetta(function () { return home(P) && P.document.querySelector(".home-online"); }, 6000)) no("in home non c'è la riga online («" + T(P).slice(0, 80) + "»)");
      var riga = P.document.querySelector(".home-online");
      if (!/🔗 Gioca online/.test(riga.innerText) || !/🔑 Ho un codice/.test(riga.innerText)) no("nella riga online: «" + riga.innerText.replace(/\s+/g, " ") + "»");
      if (!(P.document.querySelector(".home-hero").compareDocumentPosition(riga) & 4) || (riga.compareDocumentPosition(P.document.querySelector(".cat-barra")) & 4) === 0) no("la riga online non sta tra il profilo e i giochi");
      var mis = [[360, 640], [412, 915]];
      for (var i = 0; i < mis.length; i++) { var r = await misuraHome(P, "Paky", mis[i][0], mis[i][1]); if (r) no(mis[i].join("x") + ": " + r); }
      var piede = P.document.querySelector(".home .piede");
      if (/Sala online|Ho un codice/.test(piede.innerText)) no("nel piede ci sono ancora Sala o codice («" + piede.innerText.replace(/\s+/g, " ") + "»)");
      if (piede.querySelector(".btn")) no("nel piede c'è ancora un tasto grande («" + piede.querySelector(".btn").innerText + "»)");
      if (!W.clicca(P, /🏆 Serata a punti/, ".home-azioni .azione")) no("nella riga di Proposte e Bug non c'è «🏆 Serata a punti»");
      if (!await W.aspetta(function () { return /Su questo telefono/.test(W.testo(P)); }, 3000)) no("«🏆 Serata a punti» non porta alla serata («" + T(P).slice(0, 80) + "»)");
      W.clicca(P, /‹/, ".testa button");
      if (!await W.aspetta(function () { return home(P); }, 3000)) no("dal torneo ‹ non torna in home");
      // "Gioca online": la Sala (senza gioco); poi in home (da una fine partita: «👥 La sala» → ‹) c'è "Torna nella Sala"
      var S = await apriSalaNuova("Paky");
      if (vm(S).gioco) no("la Sala parte con un gioco (" + vm(S).gioco + ")");
      var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
      if (!await W.aspetta(function () { return idInSala(S, "Giulia") && G.document.querySelector(".saletta-schermo"); }, 6000)) no("Giulia non entra nella Sala");
      async function aHome(w, chi) {
        w.SG.sala(); await W.dorme(200);
        W.clicca(w, /‹/, ".testa button");
        if (!await W.aspetta(function () { return home(w) && w.document.querySelector(".home-online"); }, 3000)) no(chi + " non torna in home («" + T(w).slice(0, 60) + "»)");
        return w.document.querySelector(".home-online .btn").innerText.replace(/\s+/g, " ").trim();
      }
      var tP = await aHome(P, "Paky");
      if (!/👥 Torna nella Sala/.test(tP) || tP.indexOf(S) < 0) no("Paky in home vede «" + tP + "» invece di «👥 Torna nella Sala · " + S + "»");
      var rS = await misuraHome(P, "Paky", 360, 640); if (rS) no("360x640 con la Sala aperta: " + rS);
      var tG = await aHome(G, "Giulia");
      if (!/👥 Torna nella Sala/.test(tG) || !/di Paky/.test(tG)) no("Giulia in home vede «" + tG + "» invece di «👥 Torna nella Sala di Paky»");
      W.clicca(P, /Torna nella Sala/, ".home-online button"); W.clicca(G, /Torna nella Sala/, ".home-online button");
      var inSala = function (w) { return /Sala online/.test(W.testo(w)) && w.document.querySelector(".saletta-schermo"); };
      if (!await W.aspetta(function () { return inSala(P) && inSala(G); }, 3000)) no("«Torna nella Sala» non riporta tutti e due nella Sala");
      if (!idInSala(S, "Giulia") || codiceSala() !== S) no("tornati nella Sala, la Sala non è più la " + S);
      // l'interruttore spento: la home di prima (Sala, codice e Torneo grandi nel piede)
      var V = await W.apriTel("Vito", { x: 370 });
      if (!await W.aspetta(function () { return home(V); }, 6000)) no("Vito non arriva in home");
      if (V.document.querySelector(".home-online")) no("con l'interruttore spento c'è la riga online");
      if (!/Sala online/.test(V.document.querySelector(".home .piede").innerText)) no("con l'interruttore spento nel piede manca «👥 Sala online»");
      return "riga online in alto (" + mis.map(function (m) { return m.join("x"); }).join(", ") + " senza scorrere), piede con «🏆 Serata a punti» piccolo; Paky «" + tP + "», Giulia «" + tG + "», tutti e due di nuovo nella Sala " + S + "; interruttore spento = home di prima";
    } },

    // 41. "🔑 Ho un codice" a 4 caselle (p2-c): Giulia scrive le prime tre lettere (nessuna partenza), una "o" (non entra,
    //     avviso), la quarta → entra da sola nella Sala di Paky e nella saletta del Tris; Marco incolla il link della Sala ed
    //     entra uguale; Luca scrive ZZZZ → "Non trovo…" in circa 2 s, "✏️ Riscrivi il codice" → caselle vuote
    41: { nome: "«Ho un codice» a 4 caselle: si entra alla quarta lettera, link incollato, codice sbagliato", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
      var A = await salaDaGioco("Paky", "Tris"), S = A.S, C = A.C;
      var G = await W.apriTel("Giulia", { x: 185, salaSempre: true });
      if (!await W.aspetta(function () { return home(G) && G.document.querySelector(".home-online"); }, 6000)) no("Giulia non è in home");
      G.__segno = 1;   // se l'app si ricarica, il segno sparisce
      async function apriCodice(w, chi) {
        if (!W.clicca(w, /Ho un codice/, ".home-online button")) no(chi + ": in home non c'è «🔑 Ho un codice»");
        var inp = await W.aspetta(function () { return w.document.querySelector("input.codice4-campo"); }, 3000);
        if (!inp) no(chi + ": niente campo del codice");
        return inp;
      }
      var inp = await apriCodice(G, "Giulia");
      var att = { maxlength: "4", autocapitalize: "characters", autocomplete: "off", autocorrect: "off", spellcheck: "false", enterkeyhint: "go" };
      Object.keys(att).forEach(function (k) { if (inp.getAttribute(k) !== att[k]) no("il campo ha " + k + "=" + inp.getAttribute(k)); });
      if (G.document.querySelectorAll(".codice4-caselle span").length !== 4) no("le caselle non sono 4");
      var cs = G.document.querySelector(".codice4-caselle span");
      if (cs.offsetWidth !== 60 || cs.offsetHeight !== 72) no("le caselle sono " + cs.offsetWidth + "x" + cs.offsetHeight);   // (offset: senza l'animazione di entrata)
      if (!await W.aspetta(function () { return G.document.activeElement === inp; }, 1500)) no("il campo non ha il tocco appena si apre");
      // misure (niente scorre, "Entra ▶" a vista)
      var fG = document.getElementById("tel-Giulia");
      for (var mi = 0, MS = [[360, 640], [412, 915]]; mi < MS.length; mi++) {
        fG.style.width = MS[mi][0] + "px"; fG.style.height = MS[mi][1] + "px"; G.dispatchEvent(new G.Event("resize")); await W.dorme(300);
        if (G.document.documentElement.scrollHeight > MS[mi][1] + 1 || G.document.documentElement.scrollWidth > MS[mi][0] + 1) no(MS[mi].join("x") + ": la schermata del codice scorre");
        var be = [].find.call(G.document.querySelectorAll(".piede .btn"), function (b) { return /Entra/.test(b.textContent); });
        if (!be || be.getBoundingClientRect().bottom > MS[mi][1] + 1) no(MS[mi].join("x") + ": «Entra ▶» non si vede");
      }
      fG.style.width = "360px"; fG.style.height = "740px"; G.dispatchEvent(new G.Event("resize"));
      // tre lettere (minuscole: diventano maiuscole) e nessuna partenza
      for (var k = 0; k < 3; k++) { batti(G, S[k].toLowerCase()); await W.dorme(150); }
      if (inp.value !== S.slice(0, 3) || caselle(G) !== S.slice(0, 3)) no("dopo tre lettere il campo è «" + inp.value + "» e le caselle «" + caselle(G) + "»");
      if (!G.document.querySelector(".codice4-caselle span:nth-child(4).attiva")) no("il cursore non è sulla quarta casella");
      await W.dorme(400);
      if (!G.document.querySelector("input.codice4-campo") || /Entro nella stanza/.test(W.testo(G))) no("con tre lettere è già partito");
      // una "o": non entra, c'è l'avviso
      batti(G, "o"); await W.dorme(100);
      var av = G.document.querySelector(".codice4-avviso");
      if (inp.value !== S.slice(0, 3)) no("la O è entrata («" + inp.value + "»)");
      if (!av || av.textContent !== "Nei codici non ci sono O, I, 0 e 1" || !av.classList.contains("si")) no("dopo la «o» l'avviso è «" + (av && av.textContent) + "»");
      // la quarta: si entra da soli, nella Sala e nella saletta del Tris
      var t0 = Date.now();
      batti(G, S[3].toLowerCase());
      if (!await W.aspetta(function () { return dentro(G) && G.document.querySelector(".saletta-schermo") && vm(C).avvId === mioId("Giulia"); }, 6000)) no("alla quarta lettera Giulia non arriva nella saletta del Tris («" + T(G).slice(0, 80) + "»)");
      var dtG = (Date.now() - t0) / 1000;
      if (!idInSala(S, "Giulia")) no("Giulia non è tra i membri della Sala");
      if (!G.__segno) no("l'app di Giulia si è ricaricata");
      // Marco incolla il link della Sala
      var M = await W.apriTel("Marco", { x: 370, salaSempre: true });
      if (!await W.aspetta(function () { return home(M) && M.document.querySelector(".home-online"); }, 6000)) no("Marco non è in home");
      await apriCodice(M, "Marco");
      incolla(M, "https://paky358.github.io/speed-game/#sala=" + S);
      if (!await W.aspetta(function () { return idInSala(S, "Marco") && M.document.querySelector(".saletta-schermo"); }, 6000)) no("col link incollato Marco non entra nella Sala («" + T(M).slice(0, 80) + "»)");
      // Luca scrive ZZZZ
      var L = await W.apriTel("Luca", { x: 555, salaSempre: true });
      if (!await W.aspetta(function () { return home(L) && L.document.querySelector(".home-online"); }, 6000)) no("Luca non è in home");
      await apriCodice(L, "Luca");
      for (var z = 0; z < 3; z++) batti(L, "z");
      var t1 = Date.now(); batti(L, "z");
      var nonc = await W.aspetta(function () { return /Non trovo una partita con il codice ZZZZ/.test(W.testo(L)); }, 6000, 50);
      if (!nonc) no("ZZZZ non risponde («" + T(L).slice(0, 80) + "»)");
      var dt = (Date.now() - t1) / 1000;
      if (dt > 3) no("ZZZZ risponde dopo " + dt.toFixed(1) + " s");
      if (!W.clicca(L, /✏️ Riscrivi il codice/)) no("dopo «Non trovo…» non c'è «✏️ Riscrivi il codice»");
      var inpL = await W.aspetta(function () { return L.document.querySelector("input.codice4-campo"); }, 2000);
      if (!inpL || inpL.value !== "" || caselle(L) !== "") no("«Riscrivi il codice» non torna con le caselle vuote");
      return "Giulia: 3 lettere ferme, «o» → avviso, alla quarta dentro la saletta del Tris in " + dtG.toFixed(1) + " s (Sala " + S + "); Marco dentro col link incollato; ZZZZ → «Non trovo…» in " + dt.toFixed(1) + " s, «Riscrivi» con le caselle vuote";
    } },

    // ---- Passo 2, p2-d: chi arriva ----
    // 42. "Arrivano 3 su 4": nella Sala Paky, Giulia, Luca e Marco; Marco ha il telefono spento quando Paky lancia la
    //     Scalinata: Paky e Giulia leggono "Arrivano: 3 su 4", c'è la sagoma grigia con "Marco…", il tasto dice
    //     "▶ Comincia senza Marco"; Marco riaccende → entra da solo, "4 in sala", il tasto torna "Comincia ▶"
    42: { nome: "«Arrivano: 3 su 4»: la sagoma di Marco, «▶ Comincia senza Marco», poi Marco entra da solo", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco"]), S = A.S, P = A.w.Paky, G = A.w.Giulia;
      W.spegni("Marco"); await W.dorme(300);
      var C = await lanciaDallaSala("Paky", S, "La Scalinata");
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("Giulia e Luca non arrivano nella Scalinata (" + ids(C).join(",") + ")");
      var go = function () { var b = P.document.querySelector(".sl-go"); return b ? b.textContent + (b.disabled ? " (spento)" : "") : ""; };
      if (!await W.aspetta(function () { return contaSl(P) === "Arrivano: 3 su 4" && contaSl(G) === "Arrivano: 3 su 4"; }, 4000)) no("il contatore dice «" + contaSl(P) + "» (Paky) e «" + contaSl(G) + "» (Giulia)");
      if (!/Marco…/.test(sagome(P)) || !/Marco…/.test(sagome(G))) no("la sagoma di Marco: «" + sagome(P) + "» (Paky), «" + sagome(G) + "» (Giulia)");
      if (P.document.querySelectorAll(".sl-av.sl-atteso:not(.esce)").length !== 1) no("le sagome sono " + P.document.querySelectorAll(".sl-av.sl-atteso:not(.esce)").length);
      if (go() !== "▶ Comincia senza Marco") no("il tasto di Paky dice «" + go() + "»");
      var conRete = /📶/.test(sagome(P)) ? " (con 📶)" : "";
      W.riaccendi("Marco");
      if (!await W.aspetta(function () { return ids(C).length === 4 && dentro(W.finestra("Marco")); }, 8000)) no("Marco riacceso non entra da solo nella Scalinata («" + T(W.finestra("Marco")).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { return contaSl(P) === "4 in sala" && contaSl(G) === "4 in sala" && !sagome(P) && !sagome(G) && go() === "Comincia ▶"; }, 4000)) no("dopo l'arrivo di Marco: «" + contaSl(P) + "», sagome «" + sagome(P) + "», tasto «" + go() + "»");
      if (!P.document.querySelector(".sl-go.invita")) no("arrivati tutti, il tasto non si accende");
      return "«Arrivano: 3 su 4», sagoma «Marco…»" + conRete + ", «▶ Comincia senza Marco»; riacceso, Marco entra da solo: «4 in sala», «Comincia ▶» acceso";
    } },

    // 42b. Misure: sei nella Sala, due hanno il telefono spento quando parte Nomi, Cose e Città: quattro avatar e due sagome
    //      stanno in uno schermo da 360x640 e 412x915 (host e ospite), niente scorre
    "42b": { nome: "Sei nella Sala e due che mancano: tutto in uno schermo (360x640 e 412x915)", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco", "Sara", "Bea"]), S = A.S, P = A.w.Paky, G = A.w.Giulia;
      W.spegni("Sara"); W.spegni("Bea"); await W.dorme(300);
      await lanciaDallaSala("Paky", S, "Nomi, Cose e Città");
      if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-av:not(.sl-atteso):not(.va)").length === 4 && P.document.querySelectorAll(".sl-av.sl-atteso:not(.esce)").length === 2; }, 9000))
        no("in saletta non ci sono 4 avatar e 2 sagome (" + P.document.querySelectorAll(".sl-av:not(.sl-atteso)").length + " e " + P.document.querySelectorAll(".sl-av.sl-atteso").length + ")");
      if (!await W.aspetta(function () { return G.document.querySelectorAll(".sl-av.sl-atteso:not(.esce)").length === 2 && dentro(G); }, 4000)) no("Giulia non vede le 2 sagome");
      var go = P.document.querySelector(".sl-go").textContent;
      if (go !== "▶ Comincia senza 2") no("il tasto dice «" + go + "»");
      if (contaSl(P) !== "Arrivano: 4 su 6") no("il contatore dice «" + contaSl(P) + "»");
      var mis = [[360, 640], [412, 915]];
      // (con la finestra del browser nascosta la stanza non si rimette a misura da sola quando si stringe il telefono: dopo aver
      // cambiato misura, un cambio nella Sala (qui: "chi si ricollega", a vuoto) fa ridisporre la saletta di tutti e due)
      async function aMisura(larg, alt) {
        ["Paky", "Giulia"].forEach(function (n) { var f = document.getElementById("tel-" + n); var d = W.finestra(n).document;
          if (!d.getElementById("senza-entrata")) { var x = d.createElement("style"); x.id = "senza-entrata"; x.textContent = ".schermata{ animation:none !important; } .sl-av, .sl-nome{ transition:none !important; }"; d.head.appendChild(x); }   // (come controllaSchermo)
          f.style.width = larg + "px"; f.style.height = alt + "px"; void d.documentElement.offsetHeight; W.finestra(n).dispatchEvent(new (W.finestra(n).Event)("resize")); });
        await W.dorme(400);
        P.dispatchEvent(new P.CustomEvent("sg-forse", { detail: { stanza: S, id: "nessuno", forse: false } }));
        await W.dorme(600);
      }
      for (var i = 0; i < mis.length; i++) {
        await aMisura(mis[i][0], mis[i][1]);
        var r = await controllaSchermo(P, "Paky", mis[i][0], mis[i][1], 6); if (r) no("Paky a " + mis[i].join("x") + ": " + r);
        r = await controllaSchermo(G, "Giulia", mis[i][0], mis[i][1], 6); if (r) no("Giulia a " + mis[i].join("x") + ": " + r);
      }
      W.riaccendi("Sara"); W.riaccendi("Bea");
      return "4 avatar + 2 sagome, «Arrivano: 4 su 6», «▶ Comincia senza 2»; niente scorre a 360x640 e 412x915 (Paky e Giulia)";
    } },

    // 43. Arriva a partita in corso: la Scalinata è cominciata in 3; Bea apre il link della Sala: resta nella Sala con
    //     "🎮 Si gioca a La Scalinata · entri alla prossima" e "👀 Guarda" (non viene buttata dentro); alla "Nuova partita"
    //     Bea è nella saletta senza toccare niente
    43: { nome: "Arriva a partita in corso: «entri alla prossima» nella Sala, poi dentro da sola alla nuova partita", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca"]), S = A.S, P = A.w.Paky;
      var C = await lanciaDallaSala("Paky", S, "La Scalinata");
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("non arrivano in 3 nella Scalinata");
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "scelta" && vm(S).fase === "gioco"; }, 6000)) no("la partita non comincia (Scalinata «" + vm(C).fase + "», Sala «" + vm(S).fase + "»)");
      var B = await W.apriTel("Bea", { hash: "sala=" + S, x: 555, salaSempre: true });
      if (!await W.aspetta(function () { return idInSala(S, "Bea") && B.document.querySelector(".sl-incorso.prossima"); }, 8000)) no("Bea non vede «entri alla prossima» nella Sala («" + T(B).slice(0, 100) + "»)");
      var box = B.document.querySelector(".sl-incorso.prossima").innerText.replace(/\s+/g, " ");
      if (!/Si gioca a La Scalinata/.test(box) || !/entri alla prossima/.test(box) || !/👀 Guarda/.test(box)) no("il riquadro di Bea dice «" + box + "»");
      await W.dorme(2500);
      if (ids(C).indexOf(idInSala(S, "Bea")) >= 0 || W.reteDi("Bea")) no("Bea è stata buttata dentro la partita");
      if (!/Sala online/.test(W.testo(B)) || !B.document.querySelector(".sl-incorso.prossima")) no("Bea non è più nella Sala («" + T(B).slice(0, 80) + "»)");
      if (!await scalinataFinoAllaFine(C, ["Giulia", "Luca"], "Paky")) no("la Scalinata non finisce");
      if (!await W.aspetta(function () { return vm(S).fase === "fine"; }, 4000)) no("la Sala non dice «fine» («" + vm(S).fase + "»)");
      await W.dorme(600);
      if (!B.document.querySelector(".sl-incorso.prossima")) no("a partita finita Bea non è più in attesa nella Sala («" + T(B).slice(0, 80) + "»)");
      // (dal p2-f nella Sala la «Nuova partita» è «↻ Rivincita» dei tasti di fine del core)
      if (!await W.aspetta(function () { return W.clicca(P, /Rivincita|Nuova partita/); }, 6000)) no("Paky non trova «↻ Rivincita»");
      if (!await W.aspetta(function () { return dentro(B) && B.document.querySelector(".saletta-schermo") && ids(C).indexOf(idInSala(S, "Bea")) >= 0; }, 8000)) no("alla nuova partita Bea non è nella saletta («" + T(B).slice(0, 80) + "»)");
      return "Bea nella Sala con «" + box + "»; alla «Nuova partita» è nella saletta della Scalinata senza toccare niente";
    } },

    // 44. Esce e non conta: Giulia esce dalla saletta della Scalinata (‹ → Sala): per Paky non è tra chi manca (niente
    //     sagoma, "2 in sala"); "Rientra ▶" → la Sala la aspetta di nuovo ed è di nuovo nella saletta
    44: { nome: "Chi esce apposta non conta tra chi manca; «Rientra ▶» lo rimette dentro", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca"]), S = A.S, P = A.w.Paky, G = A.w.Giulia;
      var C = await lanciaDallaSala("Paky", S, "La Scalinata");
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("non arrivano in 3 nella Scalinata");
      var idG = idInSala(S, "Giulia");
      await W.aspetta(function () { return W.clicca(G, /‹/, ".testa button"); }, 3000);
      if (!await W.aspetta(function () { return G.document.querySelector(".sl-incorso:not(.prossima)"); }, 5000)) no("Giulia non vede «Rientra ▶» nella Sala («" + T(G).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { return (vm(S).fuori || []).indexOf(idG) >= 0 && ids(C).length === 2; }, 5000)) no("la Sala non sa che Giulia è uscita (fuori: " + JSON.stringify(vm(S).fuori) + ", nel gioco " + ids(C).length + ")");
      await W.dorme(500);
      var sag = P.document.querySelectorAll(".sl-av.sl-atteso:not(.esce)").length, go = P.document.querySelector(".sl-go").textContent;
      if (sag || contaSl(P) !== "2 in sala" || go !== "Comincia ▶") no("per Paky: " + sag + " sagome, «" + contaSl(P) + "», tasto «" + go + "»");
      if (!W.clicca(G, /Rientra/, ".sl-incorso button")) no("non c'è «Rientra ▶»");
      if (!await W.aspetta(function () { return (vm(S).fuori || []).indexOf(idG) < 0; }, 4000)) no("dopo «Rientra» la Sala la considera ancora fuori");
      if (!await W.aspetta(function () { return ids(C).length === 3 && dentro(G); }, 8000)) no("dopo «Rientra» Giulia non torna nella saletta («" + T(G).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { return contaSl(P) === "3 in sala"; }, 3000)) no("per Paky il contatore dice «" + contaSl(P) + "»");
      return "Giulia esce: per Paky niente sagoma, «2 in sala», «Comincia ▶»; «Rientra ▶» → la Sala la aspetta di nuovo, «3 in sala»";
    } },

    // 44b. Giulia ricarica la pagina a metà Scalinata della Sala: torna al suo posto nella partita (non resta nella Sala con
    //      "entri alla prossima"): la Sala dice chi è dentro la stanza del gioco (nel)
    "44b": { nome: "Giulia ricarica a metà Scalinata della Sala: torna al suo posto", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca"]), S = A.S, P = A.w.Paky;
      var C = await lanciaDallaSala("Paky", S, "La Scalinata");
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("non arrivano in 3 nella Scalinata");
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "scelta" && vm(S).fase === "gioco"; }, 6000)) no("la partita non comincia");
      var idG = idInSala(S, "Giulia");
      if (ids(C).indexOf(idG) < 0) no("Giulia ha un id nella Sala e un altro nel gioco");
      if (!await W.aspetta(function () { return (vm(S).nel || []).indexOf(idG) >= 0; }, 3000)) no("la Sala non dice che Giulia è dentro il gioco (nel: " + JSON.stringify(vm(S).nel) + ")");
      var vista = "";
      var G = await W.ricarica("Giulia");
      var spia = setInterval(function () { if (G.document.querySelector(".sl-incorso.prossima")) vista = "entri alla prossima"; }, 30);
      var ok = await W.aspetta(function () { return /gradin/i.test(W.testo(G)) && !G.document.querySelector(".saletta-schermo") && mioId("Giulia") === idG; }, 10000);
      clearInterval(spia);
      if (!ok) no("dopo la ricarica Giulia non è nella partita («" + T(G).slice(0, 100) + "»)");
      if (vista) no("dopo la ricarica Giulia ha visto «" + vista + "»");
      if (ids(C).indexOf(idG) < 0) no("Giulia non ha più il suo posto (" + ids(C).join(",") + ")");
      return "Giulia ricarica a metà Scalinata: torna nella partita col suo posto (id " + idG + ")";
    } },

    // 45. Regole visibili (p2-e): Linea del tempo dalla Sala con Giulia dentro: Giulia legge "📜 Si gioca così:" con le
    //     categorie e le carte; Paky cambia le carte in ⚙️ → in meno di 1 s la riga di Giulia cambia e compare
    //     "✨ Regole cambiate"; Marco che arriva dopo legge già le regole nuove (senza "cambiate"). Il tocco di Giulia apre il
    //     foglio col riassunto e "📖 Come si gioca"; quello di Paky apre ⚙️ (con "📖 Come si gioca" in fondo).
    //     Niente scorre a 360x640 e 412x915 (Paky e Giulia)
    45: { nome: "Regole visibili: «📜 Si gioca così» per tutti, «✨ Regole cambiate», chi arriva dopo le legge già", fai: async function () {
      var A = await salaConAmici(["Giulia"]), S = A.S, P = A.w.Paky, G = A.w.Giulia;
      var C = await lanciaDallaSala("Paky", S, "La linea del tempo");
      if (!await W.aspetta(function () { return ids(C, "giocatori").length === 2 && dentro(G); }, 8000)) no("Giulia non è nella saletta della Linea del tempo");
      if (!await W.aspetta(function () { return regoleDi(G); }, 3000)) no("Giulia non vede la riga «📜 Si gioca così» («" + T(G).slice(0, 100) + "»)");
      var r0 = regoleDi(G), rP = regoleDi(P);
      if (!/5 carte/.test(r0) || !/categori/i.test(r0)) no("la riga di Giulia dice «" + r0 + "»");
      if (rP !== r0) no("Paky legge «" + rP + "», Giulia «" + r0 + "»");
      var rigaG = G.document.querySelector(".sl-regole-riga");
      if (!/Si gioca così/.test(rigaG.textContent)) no("la riga di Giulia non dice «📜 Si gioca così»");
      if (rigaG.compareDocumentPosition(G.document.querySelector(".sl-attesa")) !== 4) no("la riga di Giulia non sta sopra «Sei dentro»");
      if (P.document.querySelector(".sl-nota").textContent) no("per Paky resta la nota «" + P.document.querySelector(".sl-nota").textContent + "» con la riga delle regole");
      // Paky tocca la riga: si apre ⚙️, con "📖 Come si gioca" in fondo; + una carta, ✅ Fatto
      P.document.querySelector(".sl-regole-riga").click(); await W.dorme(200);
      var fo = P.document.querySelector(".sl-foglio");
      if (!fo || !/Regole della partita/.test(fo.textContent)) no("il tocco di Paky sulla riga non apre ⚙️");
      if (!W.clicca(P, /Come si gioca/, ".sl-foglio button")) no("nel ⚙️ non c'è «📖 Come si gioca»");
      await W.dorme(100);
      var come = fo.querySelector(".sl-come");
      if (!come || come.hidden || come.textContent.length < 40) no("«📖 Come si gioca» non mostra le regole");
      var bott = fo.querySelectorAll(".stepper button"); if (bott.length < 2) no("nel ⚙️ non c'è il numero di carte");
      bott[1].click();
      var t0 = Date.now();
      W.clicca(P, /Fatto/, ".sl-foglio button");
      if (!await W.aspetta(function () { return /6 carte/.test(regoleDi(G)) && rigaG.classList.contains("cambiate"); }, 3000)) no("la riga di Giulia non cambia («" + regoleDi(G) + "»)");
      var ms = Date.now() - t0;
      if (ms > 1000) no("le regole nuove arrivano a Giulia dopo " + ms + " ms");
      if (!/6 carte/.test(regoleDi(P))) no("la riga di Paky dice «" + regoleDi(P) + "»");
      if (!await W.aspetta(function () { return vm(C).carte === 6; }, 3000)) no("le regole nuove non arrivano nella partita (carte " + vm(C).carte + ")");
      // dopo 2,5 s "✨ Regole cambiate" se ne va
      await W.dorme(2700);
      if (rigaG.classList.contains("cambiate")) no("«✨ Regole cambiate» resta più di 2,5 s");
      // Marco arriva dopo: legge già le regole nuove, senza "cambiate"
      var M = await W.apriTel("Marco", { hash: "sala=" + S, x: 370, salaSempre: true });
      if (!await W.aspetta(function () { return dentro(M) && /6 carte/.test(regoleDi(M)); }, 9000)) no("Marco non legge le regole nuove («" + regoleDi(M) + "» · «" + T(M).slice(0, 80) + "»)");
      if (M.document.querySelector(".sl-regole-riga").classList.contains("cambiate")) no("per Marco «✨ Regole cambiate» anche se è appena arrivato");
      // Giulia tocca la riga: il foglio col riassunto intero e "📖 Come si gioca"
      rigaG.click(); await W.dorme(200);
      var fg = G.document.querySelector(".sl-foglio");
      if (!fg || fg.querySelector(".sl-reg-tutto").textContent !== regoleDi(G)) no("il tocco di Giulia non apre il foglio col riassunto");
      if (fg.querySelector(".stepper")) no("nel foglio di Giulia si possono cambiare le regole");
      if (!W.clicca(G, /Come si gioca/, ".sl-foglio button")) no("nel foglio di Giulia non c'è «📖 Come si gioca»");
      await W.dorme(100);
      if (fg.querySelector(".sl-come").hidden) no("«📖 Come si gioca» di Giulia non si apre");
      W.clicca(G, /Ho capito/, ".sl-foglio button"); await W.dorme(150);
      if (G.document.querySelector(".sl-velo")) no("il foglio di Giulia non si chiude");
      // le misure: niente scorre a 360x640 e 412x915 (Paky e Giulia, con la riga delle regole)
      var mis = [[360, 640], [412, 915]];
      for (var i = 0; i < mis.length; i++) {
        ["Paky", "Giulia"].forEach(function (n) { var f = document.getElementById("tel-" + n), d = W.finestra(n).document;
          if (!d.getElementById("senza-entrata")) { var x = d.createElement("style"); x.id = "senza-entrata"; x.textContent = ".schermata{ animation:none !important; } .sl-av, .sl-nome{ transition:none !important; }"; d.head.appendChild(x); }
          f.style.width = mis[i][0] + "px"; f.style.height = mis[i][1] + "px"; void d.documentElement.offsetHeight; W.finestra(n).dispatchEvent(new (W.finestra(n).Event)("resize")); });
        await W.dorme(400);
        P.dispatchEvent(new P.CustomEvent("sg-forse", { detail: { stanza: S, id: "nessuno", forse: false } }));
        await W.dorme(600);
        var r = await controllaSchermo(P, "Paky", mis[i][0], mis[i][1], 3); if (r) no("Paky a " + mis[i].join("x") + ": " + r);
        r = await controllaSchermo(G, "Giulia", mis[i][0], mis[i][1], 3); if (r) no("Giulia a " + mis[i].join("x") + ": " + r);
        [[P, "Paky"], [G, "Giulia"]].forEach(function (x) { var rr = x[0].document.querySelector(".sl-regole-riga").getBoundingClientRect(); if (rr.height > 44 || rr.right > mis[i][0] + 1) no("la riga delle regole di " + x[1] + " a " + mis[i].join("x") + " è alta " + Math.round(rr.height) + " px"); });
      }
      return "«" + r0 + "» per Giulia e Paky; + una carta → Giulia in " + ms + " ms «" + regoleDi(G) + "» con «✨ Regole cambiate» (2,5 s); Marco arriva e legge già «6 carte»; fogli ok; niente scorre a 360x640 e 412x915";
    } },

    // 46. Fine uguale (p2-f): Tris nella Sala, Paky contro Giulia fino alla fine. Paky ha "↻ Rivincita" e "🎮 Cambia gioco",
    //     Giulia "👍 Ci sto!" e "🏠 Torna in Sala"; Giulia tocca "Ci sto" → "✅ Ci stai!" e Paky legge "↻ Rivincita · 👍 1";
    //     Rivincita → su tutti e due i telefoni il 3-2-1 senza altri tocchi (Giulia è già pronta) e la partita ricomincia
    46: { nome: "Fine uguale (Tris nella Sala): Rivincita · 👍 1, 3-2-1 da solo", fai: async function () {
      var A = await salaConAmici(["Giulia"]), S = A.S, P = A.w.Paky, G = A.w.Giulia;
      var C = await lanciaDallaSala("Paky", S, "Tris");
      if (!await W.aspetta(function () { return vm(C).avvId && dentro(G); }, 8000)) no("Giulia non entra nella saletta del Tris");
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il Tris non comincia");
      if (!await trisFinoAllaFine(C, "Paky", "Giulia")) no("il Tris non finisce");
      if (!await W.aspetta(function () { return tastiFineDi(P) && tastiFineDi(G); }, 5000)) no("a fine partita mancano i tasti del core (Paky " + !!tastiFineDi(P) + ", Giulia " + !!tastiFineDi(G) + ")");
      var tP = tastiFineDi(P).join(" | "), tG = tastiFineDi(G).join(" | ");
      if (tP !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
      if (tG !== "👍 Ci sto! | 🏠 Torna in Sala") no("Giulia ha «" + tG + "»");
      if (/Esci|Aspetta: la rivincita/.test(T(G))) no("Giulia ha anche i tasti di sempre («" + T(G).slice(-100) + "»)");
      W.clicca(G, /Ci sto/, ".fine-tasti button");
      if (!await W.aspetta(function () { return (tastiFineDi(G) || [])[0] === "✅ Ci stai!" && (tastiFineDi(P) || [])[0] === "↻ Rivincita · 👍 1"; }, 3000))
        no("dopo «Ci sto»: Giulia «" + (tastiFineDi(G) || []).join(" | ") + "», Paky «" + (tastiFineDi(P) || []).join(" | ") + "»");
      var vP = spiaVia(P), vG = spiaVia(G), prG = false, sp = setInterval(function () { if (G.document.querySelector(".sl-pronto.fatto")) prG = true; }, 25);
      var t0 = Date.now();
      W.clicca(P, /Rivincita/, ".fine-tasti button");
      var ok = await W.aspetta(function () { return vm(C).fase === "gioco" && !(vm(C).board || []).filter(Boolean).length; }, 8000);
      clearInterval(sp);
      var viP = vP.stop(), viG = vG.stop();
      if (!ok) no("dopo «Rivincita» la partita non ricomincia da sola («" + T(P).slice(0, 80) + "»)");
      if (!viP || !viG) no("il 3-2-1 non si è visto (Paky " + viP + ", Giulia " + viG + ")");
      if (!prG) no("nella saletta della rivincita Giulia non era già pronta");
      if (vm(C).avvId !== idInSala(S, "Giulia")) no("nella rivincita l'avversario non è Giulia");
      return "Paky «" + tP + "», Giulia «" + tG + "»; Ci sto → «👍 1»; Rivincita → Giulia già pronta, 3-2-1 su tutti e due e si gioca in " + ((Date.now() - t0) / 1000).toFixed(1) + " s, zero tocchi in più";
    } },

    // 46b. La fine con 6 nella Sala a misura (360x640 e 412x915): classifica di 6 (fitta da sola), faccine e i due tasti,
    //      per Paky (Rivincita · Cambia gioco) e per Giulia (Ci sto · Torna in Sala). (La classifica la dà la spia del tavolo:
    //      t.fine della Linea del tempo, con le schermate di fine del core)
    "46b": { nome: "Fine con 6 nella Sala: niente scorre, i due tasti in vista", fai: async function () {
      spiaTavolo();
      var amici = ["Giulia", "Luca", "Marco", "Bea", "Sara"], w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true, spiaTav: ["timeline"] }) };
      var S = await apriSalaNuova("Paky");
      for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 120 * (i + 1), salaSempre: true, spiaTav: ["timeline"] });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 6; }, 12000)) no("nella Sala non sono entrati in 6");
      var C = await lanciaDallaSala("Paky", S, "La linea del tempo");
      if (!await W.aspetta(function () { return ids(C, "giocatori").length === 6 && dentro(w.Giulia); }, 12000)) no("non sono in 6 nella saletta (" + ids(C, "giocatori").length + ")");
      var cl = ["Paky", "Giulia", "Luca", "Marco", "Bea", "Sara"].map(function (n, k) { return { nome: n, punti: 12 - k * 2, pos: k + 1 }; });
      if (!w.Paky.__tav || !w.Giulia.__tav) no("la spia del tavolo non c'è");
      // (la Linea del tempo è ancora nella saletta: le sue foto non devono ridisegnarla sopra la classifica)
      w.Paky.__tav.lobby = w.Giulia.__tav.lobby = function () { return null; };
      w.Paky.__tav.fine(cl); w.Giulia.__tav.fine(cl);
      if (!await W.aspetta(function () { return tastiFineDi(w.Paky) && tastiFineDi(w.Giulia); }, 4000)) no("niente tasti di fine (Paky «" + T(w.Paky).slice(0, 60) + "», Giulia «" + T(w.Giulia).slice(0, 60) + "»)");
      var tP = tastiFineDi(w.Paky).join(" | "), tG = tastiFineDi(w.Giulia).join(" | ");
      if (tP !== "↻ Rivincita | 🎮 Cambia gioco" || tG !== "👍 Ci sto! | 🏠 Torna in Sala") no("Paky «" + tP + "», Giulia «" + tG + "»");
      if (!w.Paky.document.querySelector(".classifica.fitta") || !w.Giulia.document.querySelector(".classifica.fitta")) no("con 6 a 360x740 la classifica non è fitta");
      if (!w.Paky.document.querySelector(".fine-faccine") || !w.Giulia.document.querySelector(".fine-faccine")) no("mancano le faccine sulla classifica");
      var mP = await misureFine(w.Paky, "Paky"), mG = await misureFine(w.Giulia, "Giulia");
      // Giulia ci sta: il conto arriva sul tasto di Paky senza ridisegnare la schermata
      var nodo = w.Paky.document.querySelector(".fine-tasti .ft-primo");
      W.clicca(w.Giulia, /Ci sto/, ".fine-tasti button");
      if (!await W.aspetta(function () { return nodo.textContent === "↻ Rivincita · 👍 1"; }, 3000)) no("il tasto di Paky dice «" + nodo.textContent + "»");
      if (!w.Paky.document.body.contains(nodo)) no("per il conto la schermata di Paky si è ridisegnata");
      // la partita è finita col t.fine del gioco: "↻ Rivincita" rilancia lo stesso gioco (stesse regole) in una stanza nuova,
      // tutti seguono la Sala, Giulia (ci sta) è già pronta, e quando ci sono tutti parte da solo il 3-2-1
      var prG = false, sp = setInterval(function () { if (w.Giulia.document.querySelector(".sl-pronto.fatto")) prG = true; }, 25), vP = spiaVia(w.Paky);
      W.clicca(w.Paky, /Rivincita/, ".fine-tasti button");
      var C2 = await W.aspetta(function () { var c = vm(S).stanza; return c && c !== C ? c : null; }, 4000);
      if (!C2) no("la Rivincita non apre la stanza nuova");
      var ok = await W.aspetta(function () { return vm(C2).fase && vm(C2).fase !== "lobby"; }, 15000);
      clearInterval(sp);
      if (!ok) no("la rivincita non parte da sola (in saletta " + ids(C2, "giocatori").length + ", tasto «" + ((w.Paky.document.querySelector(".sl-go") || {}).textContent || "") + "»)");
      if (!vP.stop()) no("niente 3-2-1 per Paky");
      if (!prG) no("Giulia non era già pronta nella saletta nuova");
      if (ids(C2, "giocatori").length !== 6) no("nella rivincita sono in " + ids(C2, "giocatori").length);
      return "Paky «" + tP + "» e Giulia «" + tG + "», classifica di 6 fitta con le faccine: ok a " + mP + " (Paky) e " + mG + " (Giulia); «👍 1» sullo stesso tasto; Rivincita → stessa Linea del tempo in una stanza nuova, Giulia già pronta, 3-2-1 da solo in 6";
    } },

    // 47. Rivincita con uno uscito: Scalinata in 3 nella Sala fino alla fine, Luca tocca "🏠 Torna in Sala"; Paky "Rivincita" →
    //     saletta con Giulia, niente 3-2-1 da solo, il tasto dice "▶ Comincia senza Luca"
    47: { nome: "Rivincita con uno uscito: niente 3-2-1, «▶ Comincia senza Luca»", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca"]), S = A.S, P = A.w.Paky, G = A.w.Giulia, L = A.w.Luca;
      var C = await lanciaDallaSala("Paky", S, "La Scalinata");
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("non arrivano in 3 nella Scalinata");
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await scalinataFinoAllaFine(C, ["Giulia", "Luca"], "Paky")) no("la Scalinata non finisce");
      if (!await W.aspetta(function () { return tastiFineDi(P) && tastiFineDi(L) && tastiFineDi(G); }, 6000)) no("mancano i tasti di fine (" + [P, G, L].map(function (x) { return !!tastiFineDi(x); }).join(",") + ")");
      if (tastiFineDi(L).join(" | ") !== "👍 Ci sto! | 🏠 Torna in Sala") no("Luca ha «" + tastiFineDi(L).join(" | ") + "»");
      var idL = idInSala(S, "Luca");
      W.clicca(L, /Torna in Sala/, ".fine-tasti button");
      if (!await W.aspetta(function () { return (vm(S).fuori || []).indexOf(idL) >= 0 && L.document.querySelector(".sl-incorso"); }, 5000)) no("Luca non è tornato nella Sala («" + T(L).slice(0, 80) + "»)");
      var vP = spiaVia(P);
      W.clicca(P, /Rivincita/, ".fine-tasti button");
      if (!await W.aspetta(function () { return P.document.querySelector(".saletta-schermo") && dentro(G); }, 6000)) no("dopo «Rivincita» Paky e Giulia non sono nella saletta");
      await W.dorme(2500);
      if (vP.stop()) no("è partito il 3-2-1 anche se Luca è uscito");
      var go = P.document.querySelector(".sl-go").textContent;
      if (go !== "▶ Comincia senza Luca") no("il tasto di Paky dice «" + go + "»");
      if (!L.document.querySelector(".sl-incorso") || ids(C).indexOf(idL) >= 0) no("Luca è stato riportato nella saletta («" + T(L).slice(0, 80) + "»)");
      W.clicca(P, /Comincia senza Luca/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 6000)) no("«Comincia senza Luca» non fa partire");
      return "Luca torna in Sala; Rivincita → saletta con Giulia, niente 3-2-1, «" + go + "» → si gioca in 2";
    } },

    // 48. Cambia gioco porta tutti: fine della Scalinata (Giulia resta sulla classifica); Paky "🎮 Cambia gioco" → Giulia legge
    //     "🎮 Si cambia gioco!" e nella Sala "Paky sceglie il prossimo gioco… 🎲"; Paky tocca la Linea del tempo e "Comincia":
    //     Giulia e Luca sono in partita con zero tocchi. Tocchi dell'host tra un gioco e l'altro: 3
    48: { nome: "Cambia gioco porta tutti: 3 tocchi dell'host, 0 degli amici", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca"]), S = A.S, P = A.w.Paky, G = A.w.Giulia, L = A.w.Luca;
      var C = await lanciaDallaSala("Paky", S, "La Scalinata");
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("non arrivano in 3 nella Scalinata");
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await scalinataFinoAllaFine(C, ["Giulia", "Luca"], "Paky")) no("la Scalinata non finisce");
      if (!await W.aspetta(function () { return tastiFineDi(P) && tastiFineDi(G); }, 6000)) no("mancano i tasti di fine");
      var pill = spiaTesto(G, /🎮 Si cambia gioco!/), sceglie = spiaTesto(G, /Paky sceglie il prossimo gioco… 🎲/), tocchi = 0;
      // (gli amici non toccano niente da qui: si conta ogni tocco sui loro telefoni)
      // (il copione non tocca mai i loro telefoni: si contano i tocchi a copione e quelli veri, non i click che fa l'app da sola)
      var toccatiAmici = 0, cliccaVero = W.__cliccaVero || (W.__cliccaVero = W.clicca);
      W.clicca = function (w) { if (w === G || w === L) toccatiAmici++; return cliccaVero.apply(this, arguments); };
      [G, L].forEach(function (x) { x.document.addEventListener("pointerdown", function () { toccatiAmici++; }, true); });
      if (W.clicca(P, /Cambia gioco/, ".fine-tasti button")) tocchi++;
      if (!await W.aspetta(function () { return !vm(S).gioco && vm(S).sceglie; }, 4000)) no("la Sala non dice che Paky sta scegliendo (" + JSON.stringify({ gioco: vm(S).gioco, sceglie: vm(S).sceglie }) + ")");
      if (!await W.aspetta(function () { return /sceglie il prossimo gioco/.test(T(G)) && /sceglie il prossimo gioco/.test(T(L)); }, 5000)) no("Giulia e Luca non leggono «Paky sceglie il prossimo gioco…» («" + T(G).slice(0, 80) + "»)");
      var tess = await W.aspetta(function () { return tessera(P, "La linea del tempo"); }, 3000);
      if (!tess) no("Paky non è nell'elenco dei giochi («" + T(P).slice(0, 80) + "»)");
      tess.click(); tocchi++;
      var C2 = await W.aspetta(function () { var c = codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S && c !== C ? c : null; }, 6000);
      if (!C2) no("dopo la tessera Paky non è nella saletta della Linea del tempo");
      if (!await W.aspetta(function () { return ids(C2, "giocatori").length === 3 && dentro(G) && dentro(L); }, 9000)) no("Giulia e Luca non arrivano da soli nella saletta (" + ids(C2, "giocatori").length + ")");
      if (!await W.aspetta(function () { return W.clicca(P, /^Comincia/, ".sl-go"); }, 4000)) no("Paky non trova «Comincia» («" + P.document.querySelector(".sl-go").textContent + "»)");
      tocchi++;
      if (!await W.aspetta(function () { return vm(C2).fase && vm(C2).fase !== "lobby" && !G.document.querySelector(".saletta-schermo") && !L.document.querySelector(".saletta-schermo"); }, 9000)) no("la Linea del tempo non comincia per tutti (fase " + vm(C2).fase + ")");
      var vp = pill.stop(), vs = sceglie.stop();
      if (!vp) no("Giulia non ha visto «🎮 Si cambia gioco!»");
      if (!vs) no("Giulia non ha visto «Paky sceglie il prossimo gioco… 🎲»");
      W.clicca = cliccaVero;
      if (toccatiAmici) no("gli amici hanno toccato " + toccatiAmici + " volte");
      if (tocchi !== 3) no("l'host ha toccato " + tocchi + " volte");
      return "Cambia gioco → Giulia «" + vp + "» e «" + vs + "»; Linea del tempo e Comincia: tutti in partita; host 3 tocchi, amici 0";
    } },

    // 49. Fuori dalla Sala (sg-sala-sempre = "0"): fine di un Tris online: Paky "↻ Nuova partita (stessi amici)" e "🏠 Esci",
    //     Giulia "👍 Ci sto!" e "🏠 Esci"; Nuova partita con tutti → 3-2-1 da solo. Alla fine dopo, Paky "🏠 Esci": Giulia resta
    //     sulla classifica con "🚪 Paky ha chiuso la stanza" (niente "Collegamento perso") e "🏠 Esci" la porta a casa
    49: { nome: "Fuori dalla Sala: Nuova partita (stessi amici) col 3-2-1, Esci che chiude senza errori", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var G = await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return vm(C).avvId && dentro(G); }, 6000)) no("Giulia non entra");
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 5000)) no("il Tris non comincia");
      if (!await trisFinoAllaFine(C, "Paky", "Giulia")) no("il Tris non finisce");
      if (!await W.aspetta(function () { return tastiFineDi(P) && tastiFineDi(G); }, 5000)) no("mancano i tasti di fine (Paky " + !!tastiFineDi(P) + ", Giulia " + !!tastiFineDi(G) + ")");
      var tP = tastiFineDi(P).join(" | "), tG = tastiFineDi(G).join(" | ");
      if (tP !== "↻ Nuova partita (stessi amici) | 🏠 Esci") no("Paky ha «" + tP + "»");
      if (tG !== "👍 Ci sto! | 🏠 Esci") no("Giulia ha «" + tG + "»");
      var mP = await misureFine(P, "Paky"), mG = await misureFine(G, "Giulia");
      W.clicca(G, /Ci sto/, ".fine-tasti button");
      if (!await W.aspetta(function () { return (tastiFineDi(P) || [])[0] === "↻ Nuova partita (stessi amici) · 👍 1"; }, 3000)) no("il tasto di Paky dice «" + (tastiFineDi(P) || []).join(" | ") + "»");
      var vP = spiaVia(P), vG = spiaVia(G);
      W.clicca(P, /Nuova partita/, ".fine-tasti button");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco" && !(vm(C).board || []).filter(Boolean).length; }, 8000)) no("la nuova partita non comincia da sola");
      if (!vP.stop() || !vG.stop()) no("il 3-2-1 non si è visto su tutti e due");
      if (!await trisFinoAllaFine(C, "Paky", "Giulia")) no("la seconda partita non finisce");
      if (!await W.aspetta(function () { return tastiFineDi(P) && tastiFineDi(G); }, 5000)) no("alla seconda fine mancano i tasti");
      var errore = spiaTesto(G, /Collegamento perso|La stanza è chiusa|Problema di collegamento/);
      W.clicca(P, /Esci/, ".fine-tasti button");
      if (!await W.aspetta(function () { return /Paky ha chiuso la stanza/.test(pill(G)); }, 5000)) no("Giulia non legge «🚪 Paky ha chiuso la stanza» (pillole: «" + pill(G) + "»)");
      await W.dorme(800);
      var e = errore.stop();
      if (e) no("Giulia ha visto «" + e + "»");
      var tG2 = (tastiFineDi(G) || []).join(" | ");
      if (tG2 !== "🏠 Esci") no("dopo la chiusura Giulia ha «" + tG2 + "»");
      if (!G.document.querySelector(".tr-cella")) no("la classifica di Giulia è stata coperta («" + T(G).slice(0, 80) + "»)");
      W.clicca(G, /Esci/, ".fine-tasti button");
      if (!await W.aspetta(function () { return home(G); }, 4000)) no("«🏠 Esci» non porta Giulia a casa");
      return "Paky «" + tP + "», Giulia «" + tG + "» (misure " + mP + "); 👍 1 → Nuova partita col 3-2-1 da solo; Esci → Giulia «🚪 Paky ha chiuso la stanza», classifica e «🏠 Esci» restano";
    } },

    // 50. Il torneo dentro la Sala (p2-g): Sala con 3 (Sala nuova), ⚙️ → "🏆 Contiamo i punti" → la riga corta su tutti i
    //     telefoni. Scalinata fino alla fine e poi Tris: i punti di ogni gioco sono quelli dei posti (100, 78, 62… per il peso
    //     del gioco: Scalinata 2, Tris 1); a fine partita "🏆 Paky +… · …" sopra i tasti di chi ha giocato; la riga corta coi
    //     primi tre; spegnere coi punti chiede conferma ("Resta" = resta acceso); il foglio → "🏁 Chiudi e premia" → podio su
    //     tutti; "↻ Nuovo torneo" → punti a 0, stessa Sala e stesso codice, gli amici di nuovo nella Sala. Misure a 360x640 e 412x915
    // (p2-z, 15 ott: la Classifica della serata è accesa da sola; nel ⚙️ solo «🔄 Azzera» e «🏁 Chiudi e premia»)
    50: { nome: "Classifica della serata nella Sala: accesa da sola, riga corta, punti a fine partita, azzera, premia e Nuova classifica", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca"]), S = A.S, P = A.w.Paky, G = A.w.Giulia, L = A.w.Luca, tel = [P, G, L];
      var corto = function (w) { var b = w.document.querySelector(".sl-torneo-corto"); return b ? b.querySelector(".sl-tc-testo").textContent : ""; };
      var rigaPt = function (w) { var b = w && w.document.querySelector(".fine-tasti .ft-punti"); return b && !b.hidden ? b.textContent : ""; };
      // la riga della Classifica della serata a fine partita: "🏆 Serata: Paky 1° · Luca 2° · Giulia 3° · …" (a pari punti lo stesso posto)
      var rigaSerata = function (t) { var cl = t.nomi.map(function (n) { return { nome: n, punti: t.punti[n] || 0 }; }).sort(function (a, b) { return b.punti - a.punti; }), po = [];
        cl.forEach(function (r, i) { po.push(i && r.punti === cl[i - 1].punti ? po[i - 1] : i + 1); });
        return "🏆 Serata: " + cl.slice(0, 3).map(function (r, i) { return r.nome + " " + po[i] + "°"; }).join(" · ") + (cl.length > 3 ? " · …" : ""); };
      var CURVA = [100, 78, 62, 50, 40, 32, 25, 19, 14, 10];
      // i punti di una partita: per posto, peso del gioco compreso
      function controllaPunti(ass, peso, gioco) {
        if (!ass || !ass.length) no(gioco + ": nessun punto assegnato");
        ass.forEach(function (a) { var giusto = Math.round(CURVA[a.pos - 1] * peso); if (a.punti !== giusto) no(gioco + ": " + a.nome + " " + a.pos + "° prende " + a.punti + " invece di " + giusto); });
        if (!ass.some(function (a) { return a.pos === 1 && a.punti === 100 * peso; })) no(gioco + ": il primo non prende " + 100 * peso);
      }
      // 1) la Classifica della serata è già accesa (riga corta su tutti); nel ⚙️ niente interruttore, «🔄 Azzera» spento
      if (!await W.aspetta(function () { return vm(S).torneo && tel.every(function (w) { return /Classifica della serata: ancora nessuna partita/.test(corto(w)); }); }, 5000))
        no("la Classifica della serata non è accesa da sola su tutti («" + tel.map(corto).join(" / ") + "»)");
      var bReg = P.document.querySelector(".saletta-schermo .sl-regole");
      if (!bReg) no("nella Sala non c'è il ⚙️");
      bReg.click();
      var fog = await W.aspetta(function () { var f = P.document.querySelector(".sl-velo"); return f && /Classifica della serata/.test(f.textContent) && f; }, 2000);
      if (!fog) no("nel ⚙️ della Sala non c'è «🏆 Classifica della serata»");
      if (fog.querySelector(".sl-interruttore input")) no("nel ⚙️ c'è ancora l'interruttore (la classifica si spegne)");
      var bAzz = [].find.call(fog.querySelectorAll("button"), function (b) { return /Azzera/.test(b.textContent); });
      if (!bAzz || !bAzz.disabled) no("«🔄 Azzera» manca o è acceso senza partite");
      if (!/Per far uscire qualcuno/.test(fog.textContent)) no("nel ⚙️ della Sala manca «Per far uscire qualcuno…»");
      if (fog.querySelectorAll("[data-posto]").length !== 2 || [].some.call(fog.querySelectorAll("[data-posto]"), function (x) { return !x.hidden; })) no("i posti nascosti per Scegliamo insieme e la Compagnia non ci sono (o si vedono)");
      W.clicca(P, /Fatto/, ".sl-velo button"); await W.dorme(200);
      if (!/Sala online/.test(T(P))) no("col torneo il titolo non è più «Sala online»");
      var misure = [];
      for (var mi = 0; mi < 2; mi++) { var MS = [[360, 640], [412, 915]][mi]; for (var ti = 0; ti < 2; ti++) { var nm = ["Paky", "Giulia"][ti]; var e = await controllaSchermo(tel[ti], nm, MS[0], MS[1], 3); if (e) no(nm + " nella Sala a " + MS.join("x") + ": " + e); } misure.push(MS.join("x")); }
      tel.forEach(function (w, i) { var f = document.getElementById("tel-" + ["Paky", "Giulia", "Luca"][i]); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); });
      // 2) la Scalinata fino alla fine
      var C = await lanciaDallaSala("Paky", S, "La Scalinata");
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("non arrivano in 3 nella Scalinata");
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await scalinataFinoAllaFine(C, ["Giulia", "Luca"], "Paky")) no("la Scalinata non finisce");
      var T1 = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 && t; }, 6000);
      if (!T1) no("il torneo non ha contato la Scalinata");
      if (T1.ultima.stanza !== C) no("ultima.stanza è " + T1.ultima.stanza + " invece di " + C);
      controllaPunti(T1.ultima.assegnati, 2, "Scalinata");
      var attesaS = rigaSerata(T1);
      if (!await W.aspetta(function () { return tel.every(function (w) { return rigaPt(w) === attesaS; }); }, 6000))
        no("a fine Scalinata la riga della serata sopra i tasti non è «" + attesaS + "» su tutti («" + tel.map(rigaPt).join(" / ") + "»)");
      var mf = await misureFine(P, "Paky") + " / " + await misureFine(G, "Giulia");
      // 3) Cambia gioco → Tris (giocano Paky e chi arriva prima; il terzo guarda)
      W.clicca(P, /Cambia gioco/, ".fine-tasti button");
      var tess = await W.aspetta(function () { return tessera(P, "Tris"); }, 4000);
      if (!tess) no("dopo «Cambia gioco» Paky non è nell'elenco dei giochi");
      tess.click();
      await passaChiGioca(P);   // (in 3 il Tris apre «Chi gioca?»: si gioca con chi è già scelto, p2-h)
      var C2 = await W.aspetta(function () { var c = codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S && c !== C ? c : null; }, 6000);
      if (!C2) no("Paky non è nella saletta del Tris");
      var avvId = await W.aspetta(function () { return vm(C2).avvId; }, 8000);
      if (!avvId) no("nessun avversario nel Tris");
      var avv = (vm(S).membri || []).filter(function (m) { return m.id === avvId; })[0];
      if (!avv) no("l'avversario del Tris non è uno della Sala");
      var Aw = W.finestra(avv.nome === "Giulia" ? "Giulia" : "Luca");
      await W.dorme(600);
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C2).fase === "gioco"; }, 6000)) no("il Tris non comincia");
      if (!await trisFinoAllaFine(C2, "Paky", avv.nome === "Giulia" ? "Giulia" : "Luca")) no("il Tris non finisce");
      var T2 = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 2 && t; }, 6000);
      if (!T2) no("il torneo non ha contato il Tris");
      if (T2.ultima.stanza !== C2) no("ultima.stanza del Tris è " + T2.ultima.stanza);
      controllaPunti(T2.ultima.assegnati, 1, "Tris");
      var attesaT = rigaSerata(T2);
      if (!await W.aspetta(function () { return rigaPt(P) === attesaT && rigaPt(Aw) === attesaT; }, 6000))
        no("a fine Tris la riga non è «" + attesaT + "» (Paky «" + rigaPt(P) + "», " + avv.nome + " «" + rigaPt(Aw) + "»)");
      // i totali sono la somma delle due partite
      var somma = {};
      T1.ultima.assegnati.concat(T2.ultima.assegnati).forEach(function (a) { if (T2.nomi.indexOf(a.nome) < 0) return; somma[a.nome] = (somma[a.nome] || 0) + a.punti; });
      Object.keys(somma).forEach(function (n) { if (T2.punti[n] !== somma[n]) no("i punti di " + n + " sono " + T2.punti[n] + " invece di " + somma[n]); });
      // 4) di nuovo nella Sala: la riga corta coi primi tre
      W.clicca(P, /Cambia gioco/, ".fine-tasti button");
      await W.aspetta(function () { return tessera(P, "Tris"); }, 4000);
      W.clicca(P, /‹/, ".testa button");
      var primi = T2.nomi.map(function (n) { return { n: n, p: somma[n] || 0 }; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 3);
      var attesaC = "🏆 " + primi.map(function (r) { return r.n + " " + r.p; }).join(" · ");
      if (!await W.aspetta(function () { return tel.every(function (w) { return corto(w) === attesaC; }); }, 6000)) no("nella Sala la riga corta non è «" + attesaC + "» («" + tel.map(corto).join(" / ") + "»)");
      // la riga corta si aggiorna senza rifarsi: lo stesso nodo
      var nodoG = G.document.querySelector(".sl-torneo-corto");
      // 5) «🔄 Azzera» coi punti chiede conferma: "Resta" = i punti restano (i telefoni finti dicono sì da soli: qui si ferma un attimo)
      fermaSiDaSolo();
      P.document.querySelector(".saletta-schermo .sl-regole").click();
      var bAz = await W.aspetta(function () { var f = P.document.querySelector(".sl-velo"); return f && [].find.call(f.querySelectorAll("button"), function (b) { return /Azzera/.test(b.textContent) && !b.disabled; }); }, 2000);
      if (!bAz) no("nel ⚙️ «🔄 Azzera» non si accende dopo le partite");
      bAz.click();
      var conf = await W.aspetta(function () { var c = P.document.querySelector(".conferma-sfondo"); return c && /Azzerare la classifica/.test(c.textContent) && c; }, 2000);
      if (!conf) no("«Azzera» non chiede conferma");
      await W.dorme(900); W.clicca(P, /^Resta$/, ".conferma-sfondo button"); await W.dorme(300);
      riprendiSiDaSolo();
      if (!vm(S).torneo || vm(S).torneo.n !== 2) no("dopo «Resta» la classifica si è azzerata");
      W.clicca(P, /Fatto/, ".sl-velo button"); await W.dorme(300);
      // 6) il foglio della classifica: per chi entra niente «Chiudi e premia»; per l'host sì → podio su tutti
      G.document.querySelector(".sl-torneo-corto").click();
      var fG = await W.aspetta(function () { return G.document.querySelector(".sl-velo"); }, 2000);
      if (!fG || G.document.querySelectorAll(".sl-velo .classifica li").length !== 3) no("il foglio di Giulia non ha la classifica intera");
      if (/Chiudi e premia/.test(fG.textContent)) no("Giulia ha «Chiudi e premia»");
      if (!/Ultima partita: .*Tris/.test(fG.textContent)) no("nel foglio manca «Ultima partita: Tris…»");
      W.clicca(G, /Ok/, ".sl-velo button");
      P.document.querySelector(".sl-torneo-corto").click();
      var chiede = spiaTesto(P, /Chiudere la serata e premiare?/);
      if (!await W.aspetta(function () { return W.clicca(P, /Chiudi e premia/, ".sl-velo button"); }, 2000)) no("l'host non ha «🏁 Chiudi e premia»");
      // (la conferma la tocca il telefono finto: «🏁 Premia» appena si accende)
      if (!await W.aspetta(function () { return tel.every(function (w) { return /Fine della serata!/.test(T(w)); }); }, 6000)) no("il podio non arriva su tutti («" + tel.map(function (w) { return T(w).slice(0, 30); }).join(" / ") + "»)");
      if (!chiede.stop()) no("«Chiudi e premia» non ha chiesto «Chiudere la serata e premiare?»");
      if (!new RegExp("👑 " + primi[0].n).test(T(G).replace(/\s+/g, " ")) && T(G).indexOf(primi[0].n) < 0) no("sul podio di Giulia non c'è il campione " + primi[0].n);
      // 7) "↻ Nuova classifica": punti a 0, stessa Sala e stesso codice, tutti di nuovo nella Sala
      if (!W.clicca(P, /Nuova classifica/)) no("l'host non ha «↻ Nuova classifica»");
      if (!await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 0 && !t.finito && !Object.keys(t.punti).length; }, 4000)) no("la classifica nuova non riparte da 0");
      if (!await W.aspetta(function () { return tel.every(function (w) { return /ancora nessuna partita/.test(corto(w)) && w.document.querySelector(".saletta-schermo"); }); }, 6000))
        no("dopo «Nuova classifica» non sono tutti nella Sala con la riga a 0 («" + tel.map(corto).join(" / ") + "»)");
      if (codiceTestata(P) !== S || codiceSala() !== S) no("dopo «Nuovo torneo» il codice è cambiato");
      if ((vm(S).membri || []).length !== 3) no("dopo «Nuovo torneo» nella Sala sono in " + (vm(S).membri || []).length);
      if (G.document.querySelector(".sl-torneo-corto") !== nodoG) no("la riga corta di Giulia si è rifatta (non è più lo stesso pezzo)");
      return "accesa da sola, riga corta su tutti (Sala a " + misure.join(", ") + "); Scalinata «" + attesaS + "», Tris (Paky-" + avv.nome + ") «" + attesaT + "» sopra i tasti (fine a " + mf + "); Sala «" + attesaC + "»; Azzera chiede conferma; premia → podio su tutti; Nuova classifica → 0, stessa Sala " + S;
    } },

    // ===== p2-h: "Chi gioca a Tris?" e i giochi coi posti contati =====
    // 51. Sala con 5, Tris: "Chi gioca a Tris?" con già scelti Paky e Giulia; un tocco su Luca → giocano Paky e Luca, gli altri
    //     tre guardano (nessun "Tu" né "Tocca a te"); a fine partita "⚔️ Altra sfida" propone Giulia e Marco
    51: { nome: "Chi gioca a Tris con 5: si sceglie con un tocco, gli altri guardano, Altra sfida propone chi non ha giocato", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco", "Bea"]), S = A.S, P = A.w.Paky, w = A.w;
      var r = await toccaGiocoSala(P, "Tris");
      if (!/In 2/.test(r.etichetta)) no("nell'elenco il Tris dice «" + r.etichetta + "»");
      var etS = r.tutte || [];
      // (la Scalinata dal 16 ott ha la scala grande fino a 8: con 5 i posti contati li ha Palla a Pendolo)
      if (!etS.some(function (x) { return /^Palla a Pendolo: Max 4: gioca chi scegli$/.test(x); })) no("con 5 Palla a Pendolo non dice «Max 4: gioca chi scegli» (" + etS.join(" · ") + ")");
      if (!etS.some(function (x) { return /^La Scalinata: Fino a 8$/.test(x); })) no("con 5 la Scalinata non dice «Fino a 8» (" + etS.join(" · ") + ")");
      if (!etS.some(function (x) { return /: Fino a (8|10)$/.test(x); })) no("nessun gioco dice «Fino a 8» o «Fino a 10»");
      if (r.dove !== "chi") no("toccato il Tris con 5 nella Sala, non si apre «Chi gioca?» («" + T(P).slice(0, 80) + "»)");
      if (!/Chi gioca a Tris\?/.test(T(P))) no("il titolo non è «Chi gioca a Tris?»");
      var sc = chiGioca(P).join(",");
      if (sc !== "Paky,Giulia") no("già scelti: «" + sc + "» invece di Paky e Giulia");
      if (!/Gli altri guardano: Luca, Marco, Bea/.test(T(P))) no("sotto non c'è «👀 Gli altri guardano: Luca, Marco, Bea» («" + T(P).slice(-120) + "»)");
      var mis = await misureChi(P, "Paky");
      var nodo = P.document.querySelector(".chi-gioca");
      toccaChi(P, "Luca");
      sc = chiGioca(P).join(",");
      if (sc !== "Paky,Luca") no("toccato Luca, scelti «" + sc + "» (doveva prendere il posto di Giulia)");
      if (P.document.querySelector(".chi-gioca") !== nodo) no("al tocco la schermata si è rifatta (lampeggio)");
      if (!W.clicca(P, /Si gioca/, ".piede button")) no("non c'è «▶ Si gioca»");
      var C = await W.aspetta(function () { var c = codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 6000);
      if (!C) no("dopo «Si gioca» Paky non è nella saletta del Tris");
      var idL = idInSala(S, "Luca");
      if (!await W.aspetta(function () { return vm(C).avvId === idL && dentro(w.Luca); }, 10000)) no("l'avversario non è Luca (avvId " + vm(C).avvId + ", Luca " + idL + ")");
      await W.aspetta(function () { return ["Giulia", "Marco", "Bea"].every(function (n) { return w[n].document.querySelector(".saletta-schermo"); }); }, 6000);
      var sbagli = [];
      ["Giulia", "Marco", "Bea"].forEach(function (n) {
        if (dentro(w[n])) sbagli.push(n + " legge «Sei dentro»");
        if (w[n].document.querySelector(".sl-nome.tu")) sbagli.push(n + " si vede «Tu»");
      });
      if (/Arrivano/.test(contaSl(P))) sbagli.push("Paky legge «" + contaSl(P) + "» (chi guarda non è chi manca)");
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il Tris non comincia");
      if (vm(C).turno === "X") { var c0 = P.document.querySelectorAll(".tr-cella")[4]; if (c0) c0.click(); }
      await W.aspetta(function () { return vm(C).turno === "O"; }, 3000); await W.dorme(600);
      ["Giulia", "Marco", "Bea"].forEach(function (n) { if (/Tocca a te/.test(W.testo(w[n]))) sbagli.push(n + " (guarda) legge «Tocca a te»"); });
      if (sbagli.length) no(sbagli.join("; "));
      if (!await trisFinoAllaFine(C, "Paky", "Luca")) no("il Tris non finisce");
      if (!await W.aspetta(function () { return (tastiFineDi(P) || []).length === 3; }, 5000)) no("a fine Tris Paky ha «" + (tastiFineDi(P) || []).join(" | ") + "»");
      var tP = tastiFineDi(P).join(" | ");
      if (tP !== "↻ Rivincita | ⚔️ Altra sfida | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
      var mf = await misureFine(P, "Paky");
      var gi = vm(S).giocate || {};
      if (gi.Paky !== 1 || gi.Luca !== 1 || gi.Giulia) no("partite giocate nella Sala: " + JSON.stringify(gi));
      W.clicca(P, /Altra sfida/, ".fine-tasti button");
      if (!await W.aspetta(function () { return chiGioca(P); }, 4000)) no("«Altra sfida» non apre «Chi gioca?» («" + T(P).slice(0, 80) + "»)");
      var sc2 = chiGioca(P).join(",");
      if (sc2 !== "Giulia,Marco") no("«Altra sfida» propone «" + sc2 + "» invece di Giulia e Marco");
      if (!await W.aspetta(function () { return !vm(S).gioco && /sceglie chi gioca/.test(W.testo(w.Giulia)) && w.Luca.document.querySelector(".saletta-schermo") && /Sala/.test(W.testo(w.Luca)); }, 6000))
        no("dopo «Altra sfida» gli amici non sono nella Sala con «Paky sceglie chi gioca…» (Giulia «" + T(w.Giulia).slice(0, 80) + "»)");
      return "«Chi gioca a Tris?» con Paky e Giulia già scelti (" + mis + "); un tocco su Luca → Paky-Luca, Giulia, Marco e Bea guardano; fine «" + tP + "» (" + mf + "); Altra sfida → Giulia e Marco; etichette: " + etS.filter(function (x) { return /Max|Fino|Servono|In 2/.test(x); }).slice(0, 4).join(" · ");
    } },

    // 52. Duello senza host: Paky sceglie Giulia e Luca. La partita la apre il telefono di Giulia, Luca gioca, Paky e Marco
    //     guardano (Paky con "👥 Sala" in alto); a fine partita l'esito arriva alla Sala (torneo acceso: punti a Giulia e Luca),
    //     Paky ha "⚔️ Altra sfida" e "🎮 Cambia gioco", Marco "🏠 Torna in Sala"; "Cambia gioco" porta via tutti
    52: { nome: "Duello senza host: lo apre Giulia, Luca gioca, Paky e Marco guardano; esito alla Sala, Altra sfida e Cambia gioco", fai: async function () {
      var tasti52 = function (w) { var t = tastiFineDi(w); return t ? t.filter(function (x) { return !/^🏆/.test(x); }) : null; };   // (senza la riga dei punti)
      var A = await salaConAmici(["Giulia", "Luca", "Marco"]), S = A.S, P = A.w.Paky, G = A.w.Giulia, L = A.w.Luca, M = A.w.Marco;
      // la Classifica della serata è accesa da sola (p2-z)
      if (!await W.aspetta(function () { return vm(S).torneo; }, 3000)) no("la Classifica della serata non è accesa");
      var r = await toccaGiocoSala(P, "Tris");
      if (r.dove !== "chi") no("non si apre «Chi gioca?»");
      toccaChi(P, "Paky"); toccaChi(P, "Luca");
      var sc = chiGioca(P).join(",");
      if (sc !== "Giulia,Luca") no("scelti «" + sc + "» invece di Giulia e Luca");
      if (!/Gli altri guardano: tu, Marco/.test(T(P))) no("sotto non c'è «Gli altri guardano: tu, Marco»");
      W.clicca(P, /Si gioca/, ".piede button");
      var D = await W.aspetta(function () { return vm(S).duello; }, 4000);
      if (!D) no("nella Sala non c'è il duello");
      var C = D.stanza;
      if (D.a !== idInSala(S, "Giulia") || D.b !== idInSala(S, "Luca")) no("il duello è " + D.na + "-" + D.nb);
      // la stanza la apre Giulia (host del gioco), Luca entra con l'id della Sala
      if (!await W.aspetta(function () { return vm(C).avvId === D.b; }, 10000)) no("nel duello Luca non è l'avversario (avvId " + vm(C).avvId + ")");
      if (!await W.aspetta(function () { return G.document.querySelector(".saletta-schermo .sl-go"); }, 6000)) no("Giulia non ha la saletta da host del duello");
      if (!await W.aspetta(function () { return P.document.querySelector(".tab-sala") && M.document.querySelector(".tab-sala"); }, 6000)) no("Paky e Marco non hanno «👥 Sala» in alto (Paky «" + T(P).slice(0, 60) + "»)");
      W.clicca(G, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il duello non comincia");
      // chi guarda vede la partita e non può toccare
      if (!await W.aspetta(function () { return P.document.querySelectorAll(".tr-cella").length === 9 && M.document.querySelectorAll(".tr-cella").length === 9; }, 6000)) no("Paky e Marco non vedono il campo del Tris");
      if (/Tocca a te/.test(W.testo(P) + W.testo(M))) no("chi guarda legge «Tocca a te»");
      // "👥 Sala": Paky torna nella Sala senza fermare il duello, poi «👀 Guarda» lo riporta a guardare
      P.document.querySelector(".tab-sala").click();
      if (!await W.aspetta(function () { return P.document.querySelector(".sl-duello"); }, 4000)) no("dopo «👥 Sala» Paky non vede «⚔️ Giulia e Luca giocano a Tris»");
      if (vm(C).fase !== "gioco" || !vm(S).duello) no("tornato nella Sala, il duello si è fermato");
      W.clicca(P, /Guarda/, ".sl-duello button");
      if (!await W.aspetta(function () { return P.document.querySelectorAll(".tr-cella").length === 9; }, 6000)) no("«👀 Guarda» non riporta Paky a guardare");
      if (!await trisFinoAllaFine(C, "Giulia", "Luca")) no("il duello non finisce");
      var T1 = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 && t; }, 6000);
      if (!T1) no("l'esito del duello non arriva al torneo della Sala");
      var nomi = T1.ultima.assegnati.map(function (a) { return a.nome + " +" + a.punti; }).join(" · ");
      if (!/Giulia \+/.test(nomi) || !/Luca \+/.test(nomi) || /Paky|Marco/.test(nomi)) no("punti del duello: «" + nomi + "»");
      if (T1.ultima.stanza !== C) no("ultima.stanza " + T1.ultima.stanza + " invece di " + C);
      var gi = vm(S).giocate || {};
      if (gi.Giulia !== 1 || gi.Luca !== 1 || gi.Paky || gi.Marco) no("giocate: " + JSON.stringify(gi));
      if (!await W.aspetta(function () { return (tasti52(P) || []).join(" | ") === "⚔️ Altra sfida | 🎮 Cambia gioco"; }, 6000)) no("a fine duello Paky ha «" + (tasti52(P) || []).join(" | ") + "» («" + T(P).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { return (tasti52(M) || []).join(" | ") === "🏠 Torna in Sala"; }, 6000)) no("a fine duello Marco ha «" + (tasti52(M) || []).join(" | ") + "»");
      if (!await W.aspetta(function () { return (tasti52(G) || []).join(" | ") === "↻ Rivincita | 🏠 Torna in Sala" && (tasti52(L) || []).join(" | ") === "👍 Ci sto! | 🏠 Torna in Sala"; }, 6000))
        no("fine duello: Giulia «" + (tasti52(G) || []).join(" | ") + "», Luca «" + (tasti52(L) || []).join(" | ") + "»");
      var rigaP = await W.aspetta(function () { var b = P.document.querySelector(".fine-tasti .ft-punti"); return b && !b.hidden ? b.textContent : ""; }, 4000);
      if (!rigaP) no("sopra i tasti di Paky non c'è la riga dei punti");
      var mf = await misureFine(P, "Paky") + " / " + await misureFine(M, "Marco");
      // la rivincita del duello: Paky e Marco tornano a guardare da soli
      W.clicca(L, /Ci sto/, ".fine-tasti button");
      await W.dorme(300);
      W.clicca(G, /Rivincita/, ".fine-tasti button");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco" && !(vm(C).board || []).filter(Boolean).length; }, 10000)) no("la rivincita del duello non riparte col 3-2-1");
      if (!await W.aspetta(function () { return P.document.querySelectorAll(".tr-cella").length === 9 && M.document.querySelectorAll(".tr-cella").length === 9; }, 6000)) no("con la rivincita Paky e Marco non tornano a guardare");
      if (!await trisFinoAllaFine(C, "Giulia", "Luca")) no("la rivincita non finisce");
      if (!await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 2; }, 6000)) no("la rivincita non conta nel torneo");
      if (!await W.aspetta(function () { return (tasti52(P) || [])[1] === "🎮 Cambia gioco"; }, 6000)) no("dopo la rivincita Paky non ha i tasti di fine");
      // "Cambia gioco" porta via tutti
      W.clicca(P, /Cambia gioco/, ".fine-tasti button");
      var inSala = function (w) { return w.document.querySelector(".saletta-schermo") && /Sala/.test(W.testo(w)) && !w.document.querySelector(".tr-cella"); };
      if (!await W.aspetta(function () { return tessera(P, "Tris") && !vm(S).gioco && !vm(S).duello && inSala(G) && inSala(L) && inSala(M); }, 8000))
        no("«Cambia gioco» non porta tutti nella Sala (Giulia «" + T(G).slice(0, 50) + "», Luca «" + T(L).slice(0, 50) + "», Marco «" + T(M).slice(0, 50) + "»)");
      return "duello " + C + " aperto da Giulia, Luca avversario, Paky e Marco guardano («👥 Sala» e ritorno ok); esito alla Sala «" + nomi + "», riga «" + rigaP + "»; fine Paky «⚔️ Altra sfida | 🎮 Cambia gioco», Marco «🏠 Torna in Sala» (" + mf + "); rivincita: si torna a guardare da soli; Cambia gioco porta via tutti";
    } },

    // 52b. Duello: Marco (guarda) torna nella Sala con «👥 Sala» e rientra con «👀 Guarda»; a fine partita chi l'ha aperto
    //      (Giulia) tocca «🏠 Torna in Sala»: il duello finisce per tutti, tutti nella Sala, niente «Collegamento perso»
    "52b": { nome: "Duello: chi guarda va e torna, chi l'ha aperto torna in Sala e porta via tutti", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco"]), S = A.S, P = A.w.Paky, G = A.w.Giulia, L = A.w.Luca, M = A.w.Marco;
      var r = await toccaGiocoSala(P, "Tris");
      if (r.dove !== "chi") no("non si apre «Chi gioca?»");
      toccaChi(P, "Paky"); toccaChi(P, "Luca"); W.clicca(P, /Si gioca/, ".piede button");
      var D = await W.aspetta(function () { return vm(S).duello; }, 4000); if (!D) no("niente duello");
      var C = D.stanza, errori = [spiaTesto(L, /Collegamento perso|Ops/), spiaTesto(M, /Collegamento perso|Ops/), spiaTesto(P, /Collegamento perso|Ops/)];
      if (!await W.aspetta(function () { return vm(C).avvId === D.b && M.document.querySelector(".tab-sala"); }, 10000)) no("il duello non si apre (Marco «" + T(M).slice(0, 60) + "»)");
      M.document.querySelector(".tab-sala").click();
      var box = await W.aspetta(function () { return M.document.querySelector(".sl-duello"); }, 4000);
      if (!box || !/Giulia e Luca giocano a Tris/.test(box.textContent)) no("Marco nella Sala non vede «⚔️ Giulia e Luca giocano a Tris» («" + T(M).slice(0, 100) + "»)");
      W.clicca(M, /Guarda/, ".sl-duello button");
      if (!await W.aspetta(function () { return M.document.querySelector(".tab-sala"); }, 6000)) no("«👀 Guarda» non riporta Marco al duello");
      W.clicca(G, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il duello non comincia");
      if (!await trisFinoAllaFine(C, "Giulia", "Luca")) no("il duello non finisce");
      if (!await W.aspetta(function () { return (tastiFineDi(G) || []).indexOf("🏠 Torna in Sala") >= 0; }, 6000)) no("Giulia non ha «🏠 Torna in Sala»");
      W.clicca(G, /Torna in Sala/, ".fine-tasti button");
      var inSala = function (w) { return w.document.querySelector(".saletta-schermo") && /Sala/.test(W.testo(w)) && !w.document.querySelector(".tr-cella") && !w.document.querySelector(".fine-tasti"); };
      if (!await W.aspetta(function () { return !vm(S).duello && !vm(S).gioco && inSala(P) && inSala(G) && inSala(L) && inSala(M); }, 8000))
        no("Giulia è tornata in Sala ma non tutti sono nella Sala (Paky «" + T(P).slice(0, 50) + "», Luca «" + T(L).slice(0, 50) + "», Marco «" + T(M).slice(0, 50) + "»)");
      await W.dorme(2000);
      var visti = errori.map(function (s) { return s.stop(); }).filter(Boolean);
      if (visti.length) no("qualcuno ha visto «" + visti[0] + "»");
      if (!/Scegli un gioco|Prossimo gioco/.test(T(P))) no("Paky nella Sala non ha «Scegli un gioco»");
      return "Marco: «👥 Sala» → «⚔️ Giulia e Luca giocano a Tris · 👀 Guarda» → di nuovo a guardare; Giulia «🏠 Torna in Sala» → duello chiuso, tutti nella Sala senza errori";
    } },

    // 53. 4 posti: Ruota con 6 nella Sala → "Chi gioca alla Ruota…?" con l'host già dentro e 3 scelti; i 2 non scelti nella
    //     saletta del gioco leggono "👀 Questa volta guardi" e non hanno "Sono pronto"
    53: { nome: "4 posti: Ruota con 6, l'host sempre dentro, i 2 non scelti guardano", fai: async function () {
      var conPronto = function (x) { var b = x.document.querySelector(".sl-pronto"); return !!(b && !b.hidden); };
      var A = await salaConAmici(["Giulia", "Luca", "Marco", "Bea", "Sara"]), S = A.S, P = A.w.Paky, w = A.w;
      var nomeR = "";
      if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco»");
      var tess = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".tessera"), function (t) { return /Ruota/.test((t.querySelector("h2") || {}).textContent); }); }, 4000);
      if (!tess) no("non trovo la Ruota tra i giochi della Sala");
      nomeR = tess.querySelector("h2").textContent;
      var et = (tess.querySelector(".tess-adue") || {}).textContent || "";
      if (et !== "Max 4: gioca chi scegli") no("nell'elenco la Ruota dice «" + et + "»");
      tess.click();
      if (!await W.aspetta(function () { return chiGioca(P); }, 4000)) no("non si apre «Chi gioca?» («" + T(P).slice(0, 80) + "»)");
      if (!/Chi gioca alla Ruota/.test(T(P))) no("il titolo è «" + T(P).slice(0, 40) + "»");
      var sc = chiGioca(P);
      if (sc.length !== 4 || sc[0] !== "Paky" || sc.join(",") !== "Paky,Giulia,Luca,Marco") no("già scelti «" + sc.join(",") + "»");
      toccaChi(P, "Paky");
      if (chiGioca(P).join(",") !== sc.join(",")) no("l'host si è potuto togliere");
      toccaChi(P, "Sara");   // al posto del più vecchio scelto (non l'host): Giulia
      var sc2 = chiGioca(P).join(",");
      if (sc2 !== "Paky,Luca,Marco,Sara") no("toccata Sara, scelti «" + sc2 + "»");
      var mis = await misureChi(P, "Paky");
      W.clicca(P, /Si gioca/, ".piede button");
      var C = await W.aspetta(function () { var c = codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 6000);
      if (!C) no("dopo «Si gioca» Paky non è nella saletta della Ruota");
      var fuori = ["Giulia", "Bea"], dentroN = ["Luca", "Marco", "Sara"];
      if (!await W.aspetta(function () { return fuori.concat(dentroN).every(function (n) { return w[n].document.querySelector(".saletta-schermo"); }); }, 10000)) no("non arrivano tutti nella saletta della Ruota");
      var ok = await W.aspetta(function () { return fuori.every(function (n) { return /Questa volta guardi/.test(W.testo(w[n])) && !conPronto(w[n]); }); }, 8000);
      if (!ok) no(fuori.map(function (n) { return n + " «" + T(w[n]).slice(0, 90) + "» pronto:" + !!conPronto(w[n]); }).join("; "));
      var senzaPronto = dentroN.filter(function (n) { return !conPronto(w[n]); });
      if (senzaPronto.length) no(senzaPronto.join(", ") + " (scelti) non hanno «Sono pronto»");
      return "«Chi gioca " + (nomeR ? "alla " + nomeR.replace(/^La /, "") : "") + "?» con Paky fisso e Giulia, Luca, Marco; Sara al posto di Giulia (" + mis + "); Giulia e Bea: «👀 Questa volta guardi», niente «Sono pronto»";
    } },

    // 60. I bot fissi (p2-bot): di partenza 8 (Matt compreso), sempre gli stessi nello stesso ordine, mai due uguali,
    //     niente bot che si chiama come chi gioca; "🤖 I Bot" nel profilo solo per IL PAPPONE; senza rete quelli di partenza
    60: { nome: "I bot fissi: gli 8 di partenza, SG.bot.prendi, «🤖 I Bot» solo per il proprietario", fai: async function () {
      var L = await W.apriTel("Luca", { x: 0, prima: botFinti }), B = L.SG.bot;
      if (!B || !B.tutti) no("non c'è SG.bot");
      var tutti = B.tutti(), nomi = tutti.map(function (b) { return b.nome; });
      if (tutti.length !== 8) no("i bot sono " + tutti.length);
      ["Matt", "Angela", "Rosa", "Peppe"].forEach(function (n) { if (nomi.indexOf(n) < 0) no("manca " + n + " (" + nomi.join(", ") + ")"); });
      var ids0 = {}; tutti.forEach(function (b) { if (ids0[b.id]) no("due bot con l'id " + b.id); ids0[b.id] = 1; if (!b.omino || !b.omino.forma || !b.frase || L.SG.bot.livelli.indexOf(b.livello) < 0 || !b.bot) no(b.nome + " è incompleto"); });
      var visi = {}; tutti.forEach(function (b) { var k = L.SGOmino.svg(b.omino); if (visi[k]) no(b.nome + " e " + visi[k] + " hanno lo stesso avatar"); visi[k] = b.nome; });
      if (B.daId("matt").livello !== "difficile") no("Matt non è difficile");
      var a = B.prendi(3, { livello: "medio" }).map(function (b) { return b.nome; }).join(","), a2 = B.prendi(3, { livello: "medio" }).map(function (b) { return b.nome; }).join(",");
      if (a !== a2) no("prendi non dà sempre gli stessi: " + a + " / " + a2);
      var d = B.prendi(2, { livello: "difficile" }).map(function (b) { return b.nome; });
      if (d[0] !== "Matt") no("col livello difficile il primo è " + d[0] + " e non Matt");
      var e = B.prendi(8, { escludi: ["Matt", "rosa"] }).map(function (b) { return b.nome; });
      if (e.indexOf("Matt") >= 0 || e.indexOf("Rosa") >= 0) no("escludi non toglie Matt e Rosa: " + e.join(","));
      if (e.length !== 8 || new Set(e).size !== 8) no("prendi(8) con 2 esclusi: " + e.join(","));
      for (var i = 0; i < 20; i++) { var c = B.prendi(4, { caso: true, livello: "facile" }).map(function (b) { return b.id; }); if (new Set(c).size !== 4) no("a sorte due bot uguali: " + c.join(",")); }
      var m = B.prendi(1)[0]; m.nome = "Pippo"; m.omino.forma = "x";
      if (B.daId(m.id).nome === "Pippo" || B.daId(m.id).omino.forma === "x") no("un gioco può cambiare il gruppo dei bot");
      await apriProfilo(L);
      if (/I Bot/.test(T(L))) no("Luca vede «🤖 I Bot» nel suo profilo");
      var P = await W.apriTel("IL PAPPONE", { x: 185, prima: botFinti });
      await apriProfilo(P);
      if (!W.clicca(P, /I Bot/, ".st-tasto")) no("IL PAPPONE non ha «🤖 I Bot» nel profilo");
      if (!await W.aspetta(function () { return P.document.querySelectorAll(".bc-bot").length === 8; }, 3000)) no("«I Bot» non mostra gli 8 bot («" + T(P).slice(0, 80) + "»)");
      var mis = await misureSchermata(P, "IL PAPPONE"); if (mis) no("«I Bot»: " + mis);
      var S = await W.apriTel("Sara", { x: 370, offline: true, prima: botFinti });
      if (S.SG.bot.tutti().map(function (b) { return b.nome; }).join(",") !== nomi.join(",")) no("senza rete Sara non ha i bot di partenza");
      return nomi.join(", ") + "; medio → " + a + "; difficile → " + d.join(", ") + "; «🤖 I Bot» solo per IL PAPPONE, 4x2 senza scorrere; senza rete quelli di partenza";
    } },

    // 61. L'editor del proprietario: IL PAPPONE cambia Rosa (nome, livello, avatar col camerino) e salva; Luca ricarica e la vede
    //     uguale; "↺ Tutti come all'inizio" li rimette per tutti
    61: { nome: "«🤖 I Bot»: il proprietario cambia un bot e gli altri lo vedono uguale", fai: async function () {
      var P = await W.apriTel("IL PAPPONE", { x: 0, prima: botFinti }), L = await W.apriTel("Luca", { x: 185, prima: botFinti });
      var prima = JSON.stringify(L.SG.bot.daId("rosa").omino);
      await apriProfilo(P);
      W.clicca(P, /I Bot/, ".st-tasto");
      var rosa = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".bc-bot"), function (b) { return /Rosa/.test(b.textContent); }); }, 3000);
      if (!rosa) no("non trovo Rosa tra i bot");
      rosa.click();
      if (!await W.aspetta(function () { return P.document.querySelector(".bot-scheda"); }, 3000)) no("non si apre la scheda di Rosa");
      var mis = await misureSchermata(P, "IL PAPPONE"); if (mis) no("la scheda di un bot: " + mis);
      var campi = P.document.querySelectorAll(".bot-scheda .bc-campo");
      campi[0].value = "Matt"; W.clicca(P, /Salva/, ".piede button"); await W.dorme(200);
      if (!/già un bot/.test(T(P))) no("si può chiamare Rosa come Matt");
      campi[0].value = "Bot"; W.clicca(P, /Salva/, ".piede button"); await W.dorme(200);
      if (!/resta per i tasti/.test(T(P))) no("si può chiamare un bot «Bot»");
      campi[0].value = "Rosetta"; campi[1].value = "La nuova campionessa";
      W.clicca(P, /Difficile/, ".bc-liv");
      if (!W.clicca(P, /Cambia avatar/)) no("non c'è «✏️ Cambia avatar»");
      if (!await W.aspetta(function () { return P.document.querySelector(".editor-avatar .om-azione.caso"); }, 3000)) no("non si apre l'editor dell'avatar");
      P.document.querySelector(".editor-avatar .om-azione.caso").click(); await W.dorme(100);
      P.document.querySelector(".editor-avatar .om-azione.salva").click();
      if (!await W.aspetta(function () { return P.document.querySelector(".bot-scheda"); }, 4000)) no("dopo l'avatar non si torna alla scheda di Rosa");
      campi = P.document.querySelectorAll(".bot-scheda .bc-campo");
      if (campi[0].value !== "Rosetta" || !P.document.querySelector(".bc-liv.liv-difficile.on")) no("tornando dall'avatar nome o livello si sono persi («" + campi[0].value + "»)");
      W.clicca(P, /Salva/, ".piede button");
      if (!await W.aspetta(function () { return P.document.querySelector(".bot-cast") && /Rosetta/.test(T(P)); }, 3000)) no("dopo «Salva» la griglia non mostra Rosetta");
      var pub = (W.BR.pubblici["IL PAPPONE"] || {}).bot;
      if (!pub || pub.length !== 8) no("i bot non sono nella scheda pubblica del proprietario");
      var r = pub.filter(function (b) { return b.id === "rosa"; })[0];
      if (!r || r.nome !== "Rosetta" || r.livello !== "difficile" || r.frase !== "La nuova campionessa" || JSON.stringify(r.omino) === prima) no("nella scheda pubblica Rosa è " + JSON.stringify(r).slice(0, 80));
      L = await W.ricarica("Luca");
      var vista = await W.aspetta(function () { var b = L.SG.bot.daId("rosa"); return b && b.nome === "Rosetta" ? b : null; }, 4000);
      if (!vista) no("Luca dopo aver ricaricato vede ancora " + L.SG.bot.daId("rosa").nome);
      if (JSON.stringify(vista.omino) !== JSON.stringify(L.SGOmino.norm(r.omino)) || vista.livello !== "difficile") no("Luca vede Rosetta diversa");
      if (L.SG.bot.prendi(1, { livello: "difficile" })[0].nome !== "Matt") no("col difficile il primo non è più Matt");
      var p2 = L.SG.bot.prendi(3, { livello: "difficile" }).map(function (b) { return b.nome; }).join(",");
      if (p2 !== "Matt,Angela,Rosetta") no("col difficile: " + p2);
      L.__offline = true; L = await W.ricarica("Luca", { offline: true });   // senza rete: gli ultimi visti
      if (L.SG.bot.daId("rosa").nome !== "Rosetta") no("senza rete Luca non ricorda Rosetta");
      L.__offline = false;
      if (!W.clicca(P, /Tutti come all'inizio/)) no("non c'è «↺ Tutti come all'inizio»");
      if (!await W.aspetta(function () { return !/Rosetta/.test(T(P)) && /Rosa/.test(T(P)); }, 3000)) no("«Tutti come all'inizio» non rimette Rosa");
      L = await W.ricarica("Luca", { offline: false });
      if (!await W.aspetta(function () { return L.SG.bot.daId("rosa").nome === "Rosa"; }, 4000)) no("Luca non vede Rosa tornata come prima");
      return "Rosetta (difficile, avatar nuovo) salvata nella scheda del proprietario; Luca la vede uguale dopo aver ricaricato (anche senza rete); nomi doppi e «Bot» rifiutati; «↺ Tutti come all'inizio» per tutti";
    } },

    // 62. Torneo a eliminazione in 3 (Tris): chi resta solo gioca col Bot, che è uno dei bot fissi (medio) e si chiama
    //     così nel tabellone di tutti
    62: { nome: "Torneo a eliminazione in 3: il Bot è uno dei bot fissi, uguale per tutti", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 });
      var tess = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === "Tris"; }); }, 5000);
      if (!tess) no("non trovo il Tris"); tess.click(); await W.dorme(200);
      if (!W.clicca(P, /Torneo a eliminazione/)) no("non trovo «Torneo a eliminazione»");
      var S = await W.aspetta(function () { return codiceSaletta(P); }, 5000); if (!S) no("il torneo non ha il codice");
      await W.apriTel("Giulia", { hash: "sala=" + S, x: 185 });
      await W.apriTel("Luca", { hash: "sala=" + S, x: 370 });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 3; }, 8000)) no("non entrano tutti nel torneo");
      if (!W.clicca(P, /Comincia il torneo/)) no("non trovo «Comincia il torneo»");
      var E = await W.aspetta(function () { var e = vm(S).elim; return e && e.iniziato && e.turni && e.turni[0] ? e : null; }, 5000);
      if (!E) no("il torneo non comincia");
      var pb = E.turni[0].filter(function (p) { return p.b === "bot"; })[0];
      if (!pb) no("nessuno gioca col Bot");
      if (!E.bot || !E.bot.nome) no("il torneo non ha il suo Bot");
      var fisso = P.SG.bot.daId(E.bot.id);
      if (!fisso || fisso.nome !== E.bot.nome || fisso.livello !== "medio") no("il Bot del torneo (" + JSON.stringify(E.bot) + ") non è un bot fisso medio");
      var chi = (E.nomi || {})[pb.a], nb = "🤖 " + E.bot.nome;
      // tutti sono nella loro partita: il tabellone si apre col 🏆 in alto
      var tutti3 = ["Paky", "Giulia", "Luca"], letto = {};
      var visto = await W.aspetta(function () {
        tutti3.forEach(function (n) {
          var w = W.finestra(n), f = w.document.querySelector(".sl-foglio");
          if (!f) { var b = w.document.querySelector(".tab-elim"); if (b) b.click(); f = w.document.querySelector(".sl-foglio"); }
          letto[n] = f ? f.textContent.replace(/\s+/g, " ") : "";
        });
        return tutti3.every(function (n) { return letto[n].indexOf(nb) >= 0 && !/Bot \(medio\)/.test(letto[n]); });
      }, 8000);
      if (!visto) no("nel tabellone non si legge «" + nb + "» (" + tutti3.map(function (n) { return n + ": «" + (letto[n] || T(W.finestra(n))).slice(0, 80) + "»"; }).join("; ") + ")");
      return chi + " gioca contro " + nb + " (bot fisso, medio), scritto così nel tabellone di tutti";
    } },
    // ===== IL TORNEINO (p2-t): giochi a due con 3 o più persone =====
    // 70. In 3 dalla Sala: toccato il Tris si apre «Tris in 3» col Torneino già scelto (a misura, niente lampeggio); «Passa il
    //     turno»: una partita vera e uno che passa (legge «Passi al turno dopo» e può guardare), poi la finale (decisa dall'host
    //     col «⋯»), «Ha vinto…» per tutti e «👥 Torna in Sala» che riporta tutti nella Sala
    70: { nome: "Torneino in 3 dalla Sala: Torneino già scelto, uno passa il turno, partita vera, finale e Torna in Sala", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca"]), S = A.S, P = A.w.Paky;
      await apriSceltaTn(P);
      if (!/Tris in 3/.test(T(P))) no("il titolo non è «Tris in 3» («" + T(P).slice(0, 60) + "»)");
      var sc = P.document.querySelector(".tn-scelta.scelta");
      if (!sc || !/Torneo: giocate tutti/.test(sc.textContent)) no("«Torneo: giocate tutti» non è già scelto");
      var opz = P.document.querySelector(".tn-opz");
      if (!opz || opz.hidden || opzVisibili(P).indexOf("Chi resta in più") < 0) no("siete in 3 e non c'è «Chi resta in più»");
      var mis = await misureSchermata(P, "Paky"); if (mis) no("«Tris in 3»: " + mis);
      var nodo = P.document.querySelector(".torneino-sc");
      W.clicca(P, /Una sfida/, ".tn-scelta");
      if (!/Scegli chi gioca/.test(P.document.querySelector(".torneino-sc .piede").textContent)) no("con «Una sfida» il tasto non dice «Scegli chi gioca»");
      if (!opz.hidden) no("con «Una sfida» si vedono ancora le scelte del torneino");
      W.clicca(P, /Torneo: giocate tutti/, ".tn-scelta");
      if (P.document.querySelector(".torneino-sc") !== nodo) no("a ogni tocco la schermata si rifà (lampeggio)");
      chipTn(P, "Passa il turno");
      if (!/uno a sorte passa il turno/.test(T(P))) no("scelto «Passa il turno», la nota non lo dice");
      var E = await viaTn(P, S);
      if (E.bot) no("con «Passa il turno» il torneino ha un Bot (" + JSON.stringify(E.bot) + ")");
      var t0 = E.turni[0], gioca = t0.filter(function (p) { return p.b; }), passa = t0.filter(function (p) { return !p.b; });
      if (t0.length !== 2 || gioca.length !== 1 || passa.length !== 1 || passa[0].vince !== passa[0].a) no("primo turno sbagliato: " + JSON.stringify(t0));
      var chiPassa = nomeTn(E, passa[0].a), wP = W.finestra(chiPassa);
      if (!await W.aspetta(function () { return /Passi al turno dopo/.test(T(wP)) && wP.document.querySelector(".tb-guarda"); }, 8000)) no(chiPassa + " (passa) legge «" + T(wP).slice(0, 120) + "»");
      var etG = wP.document.querySelector(".tb-guarda").getAttribute("aria-label");
      var v1 = await trisTn(S, gioca[0]);
      var fin = await W.aspetta(function () { var e = tn(S); return e && e.turni.length === 2 ? e.turni[1][0] : null; }, 8000);
      if (!fin || !fin.b) no("non c'è la finale (" + JSON.stringify(tn(S) && tn(S).turni) + ")");
      if ([fin.a, fin.b].sort().join() !== [v1, passa[0].a].sort().join()) no("la finale non è tra chi ha vinto (" + v1 + ") e chi è passato (" + passa[0].a + ")");
      await decidiTn(P, S, fin.k, fin.a);
      var Ef = await W.aspetta(function () { var e = tn(S); return e && e.finito ? e : null; }, 6000);
      if (!Ef || Ef.campione !== fin.a) no("il torneino non finisce col campione giusto");
      var camp = nomeTn(Ef, Ef.campione), letti = {};
      if (!await W.aspetta(function () { return ["Paky", "Giulia", "Luca"].every(function (n) { letti[n] = T(A.w[n]); return n === camp ? /Hai vinto tu/.test(letti[n]) : letti[n].indexOf("Ha vinto " + camp + "!") >= 0; }); }, 9000))
        no("non tutti leggono chi ha vinto (" + Object.keys(letti).map(function (n) { return n + ": «" + letti[n].slice(0, 90) + "»"; }).join("; ") + ")");
      if (!await W.aspetta(function () { return W.clicca(P, /Prossimo gioco/, ".sl-go"); }, 6000)) no("Paky non ha «🎮 Prossimo gioco»");
      if (!await W.aspetta(function () { return !vm(S).elim; }, 4000)) no("la Sala ha ancora il torneino");
      if (!await W.aspetta(function () { return ["Giulia", "Luca"].every(function (n) { return /Sala di Paky/.test(T(A.w[n])) && !A.w[n].document.querySelector(".sl-tab"); }); }, 6000))
        no("gli amici non tornano nella Sala (Giulia «" + T(A.w.Giulia).slice(0, 80) + "»)");
      if (!P.document.querySelector(".tessera") || P.document.querySelector(".sl-tab")) no("Paky non è nell'elenco dei giochi («" + T(P).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { return ["Giulia", "Luca"].every(function (n) { return /sceglie il prossimo gioco/.test(T(A.w[n])); }); }, 4000)) no("gli amici non leggono «Paky sceglie il prossimo gioco…»");
      return "«Tris in 3» (" + "misure ok" + "), " + chiPassa + " passa e può «" + etG + "», finale " + nomeTn(Ef, fin.a) + "–" + nomeTn(Ef, fin.b) + ": «Ha vinto " + camp + "!» per tutti, poi tutti nella Sala";
    } },

    // 71. In 4 coi punti: niente «Chi resta in più» (si è pari), due semifinali vere insieme, finale vera, i punti nella
    //     classifica della serata (campione > finalista > semifinalisti) e le partite giocate contate una volta
    71: { nome: "Torneino in 4 coi punti: semifinali insieme, finale, punti della serata", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco"]), S = A.S, P = A.w.Paky;
      if (!await W.aspetta(function () { return vm(S).torneo; }, 3000)) no("la Classifica della serata non è accesa da sola");
      await apriSceltaTn(P);
      if (opzVisibili(P).indexOf("Chi resta in più") >= 0) no("in 4 c'è «Chi resta in più»");
      if (!/Siete pari/.test(T(P))) no("in 4 la nota non dice «Siete pari»");
      var E = await viaTn(P, S);
      var t0 = E.turni[0];
      if (t0.length !== 2 || t0.some(function (p) { return !p.b || p.b === "bot"; })) no("semifinali sbagliate: " + JSON.stringify(t0));
      if (!await W.aspetta(function () { return ["Paky", "Giulia", "Luca", "Marco"].every(function (n) { return /Semifinali/.test(T(A.w[n])) || A.w[n].document.querySelector(".tr-cella, .saletta-schermo"); }); }, 8000)) no("non tutti sono nella loro partita");
      var vinti = await Promise.all(t0.map(function (p) { return trisTn(S, p); }));
      var fin = await W.aspetta(function () { var e = tn(S); return e && e.turni.length === 2 ? e.turni[1][0] : null; }, 8000);
      if (!fin || [fin.a, fin.b].sort().join() !== vinti.slice().sort().join()) no("la finale non è tra chi ha vinto le semifinali");
      var vf = await trisTn(S, fin);
      var Ef = await W.aspetta(function () { var e = tn(S); return e && e.finito ? e : null; }, 6000);
      if (!Ef || Ef.campione !== vf) no("il torneino non finisce col campione giusto");
      var Tq = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 ? t : null; }, 4000);
      if (!Tq) no("i punti del torneino non arrivano nella classifica della serata (" + JSON.stringify(vm(S).torneo) + ")");
      var nC = nomeTn(Ef, vf), nF = nomeTn(Ef, fin.a === vf ? fin.b : fin.a), semi = Ef.turni[0].map(function (p) { return nomeTn(Ef, p.vince === p.a ? p.b : p.a); });
      var pt = Tq.punti;
      if (!(pt[nC] > pt[nF] && pt[nF] > pt[semi[0]] && pt[semi[0]] === pt[semi[1]])) no("punti sbagliati: " + JSON.stringify(pt));
      var gi = vm(S).giocate || {};
      if (["Paky", "Giulia", "Luca", "Marco"].some(function (n) { return gi[n] !== 1; })) no("partite giocate contate male: " + JSON.stringify(gi));
      if (!await W.aspetta(function () { return W.clicca(P, /Prossimo gioco/, ".sl-go"); }, 6000)) no("Paky non ha «🎮 Prossimo gioco»");
      if (!await W.aspetta(function () { return !vm(S).elim && A.w.Giulia.document.querySelector(".sl-torneo-corto"); }, 4000)) no("nella Sala di Giulia non c'è la classifica corta");
      return "semifinali insieme, finale " + nC + "–" + nF + "; punti: " + Object.keys(pt).map(function (n) { return n + " " + pt[n]; }).join(", ");
    } },

    // 72. In 5 col Bot difficile: il Bot è un bot fisso difficile, la sua partita la gioca il telefono di chi gli sta davanti
    //     (e la trasmette), se vince va avanti (sempre come secondo della carta, mai due bot), arriva in fondo e vince:
    //     «Ha vinto Matt! 🤖» per tutti
    72: { nome: "Torneino in 5 col Bot difficile: il Bot vince, va avanti e vince il torneino", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco", "Bea"]), S = A.S, P = A.w.Paky;
      await apriSceltaTn(P);
      chipTn(P, "Gioca col Bot"); chipTn(P, "Difficile");
      if (!/chi resta gioca col Bot/.test(T(P))) no("la nota non dice che chi resta gioca col Bot");
      var E = await viaTn(P, S);
      if (!E.bot || E.livello !== "difficile") no("il torneino non ha il Bot difficile (" + JSON.stringify(E.bot) + ", " + E.livello + ")");
      var fisso = P.SG.bot.daId(E.bot.id);
      if (!fisso || fisso.nome !== E.bot.nome || fisso.livello !== "difficile") no("il Bot (" + E.bot.nome + ") non è un bot fisso difficile");
      var pb = E.turni[0].filter(function (p) { return p.b === "bot"; })[0];
      if (!pb || E.turni[0].length !== 3) no("primo turno sbagliato: " + JSON.stringify(E.turni[0]));
      var chi = nomeTn(E, pb.a), wC = W.finestra(chi);
      if (!await W.aspetta(function () { return wC.document.querySelectorAll(".tr-cella").length === 9; }, 8000)) no(chi + " non ha la partita col Bot («" + T(wC).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { var v = vm(pb.stanza); return v && v.board; }, 8000)) no("la partita col Bot non si trasmette a chi guarda");
      var bot2 = 0;
      var Ef = await finoAllaFineTn(P, S, function (e) {
        e.turni.forEach(function (tu) { tu.forEach(function (p) { if (p.a === "bot" && p.b) no("il Bot è il primo di una carta (" + p.k + ")"); if (p.a === p.b) no("due uguali nella stessa partita"); }); });
        bot2 = Math.max(bot2, e.turni.length);
      });
      if (Ef.campione !== "bot") no("il campione non è il Bot (" + Ef.campione + ")");
      if (Ef.turni.length < 3) no("il torneino in 5 ha solo " + Ef.turni.length + " turni");
      var frase = "Ha vinto " + Ef.bot.nome + "! 🤖", letti = {};
      if (!await W.aspetta(function () { return ["Paky", "Giulia", "Luca", "Marco", "Bea"].every(function (n) { letti[n] = T(A.w[n]); return letti[n].indexOf(frase) >= 0; }); }, 10000))
        no("non tutti leggono «" + frase + "» (" + Object.keys(letti).filter(function (n) { return letti[n].indexOf(frase) < 0; }).map(function (n) { return n + ": «" + letti[n].slice(0, 80) + "»"; }).join("; ") + ")");
      var turni = Ef.turni.map(function (tu) { return tu.map(function (p) { return etTn(Ef, p.a) + (p.b ? "–" + etTn(Ef, p.b) : " passa"); }).join(", "); }).join(" | ");
      return chi + " gioca col Bot " + Ef.bot.nome + " (difficile, trasmessa); turni: " + turni + "; «" + frase + "» per tutti";
    } },

    // 73. In 5 con «Passa il turno»: niente Bot; al primo turno uno passa, al secondo passa un altro (mai lo stesso due volte)
    73: { nome: "Torneino in 5 con «Passa il turno»: niente Bot, chi passa non passa due volte", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco", "Bea"]), S = A.S, P = A.w.Paky;
      await apriSceltaTn(P);
      chipTn(P, "Passa il turno");
      var E = await viaTn(P, S);
      if (E.bot) no("con «Passa il turno» c'è un Bot");
      var p0 = E.turni[0].filter(function (p) { return !p.b; });
      if (E.turni[0].length !== 3 || p0.length !== 1) no("primo turno sbagliato: " + JSON.stringify(E.turni[0]));
      var Ef = await finoAllaFineTn(P, S, function (e) {
        e.turni.forEach(function (tu) { tu.forEach(function (p) { if (p.a === "bot" || p.b === "bot") no("c'è il Bot in una partita"); }); });
      });
      var passati = []; Ef.turni.forEach(function (tu) { tu.forEach(function (p) { if (!p.b) passati.push(p.a); }); });
      if (passati.length !== 2 || passati[0] === passati[1]) no("chi passa il turno: " + JSON.stringify(passati.map(function (id) { return nomeTn(Ef, id); })));
      if (!Ef.campione || Ef.campione === "bot") no("campione sbagliato");
      return "passano " + passati.map(function (id) { return nomeTn(Ef, id); }).join(" e poi ") + "; vince " + nomeTn(Ef, Ef.campione);
    } },

    // 74. In 4: chi apre una semifinale ricarica la pagina a metà e ritrova la sua partita (che si chiude con l'esito giusto);
    //     uno dell'altra semifinale esce dalla Sala: vince il suo avversario. Poi la finale e la fine
    74: { nome: "Torneino in 4: uno ricarica a metà e ritrova la partita, uno esce e vince l'altro", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco"]), S = A.S, P = A.w.Paky;
      await apriSceltaTn(P);
      var E = await viaTn(P, S);
      // la semifinale tra due amici (Paky non c'è) e l'altra
      var m1 = E.turni[0].filter(function (p) { return p.a !== "host" && p.b !== "host"; })[0], m2 = E.turni[0].filter(function (p) { return p !== m1; })[0];
      if (!m1) no("non c'è una semifinale senza Paky");
      var nA = nomeTn(E, m1.a);
      if (!await W.aspetta(function () { return vm(m1.stanza).avvId; }, 12000)) no("la partita di " + nA + " non si apre");
      await W.ricarica(nA);
      if (!await W.aspetta(function () { var v = vm(m1.stanza); return W.finestra(nA).document.querySelector(".saletta-schermo .sl-go") && v && v.avvId; }, 15000))
        no(nA + " ha ricaricato e non ritrova la sua partita («" + T(W.finestra(nA)).slice(0, 80) + "»)");
      if (partitaTn(S, m1.k).vince) no("chi ha ricaricato ha perso la partita a tavolino");
      // l'altra semifinale: esce chi non è Paky
      var esce = m2.a === "host" ? m2.b : m2.a, resta = esce === m2.a ? m2.b : m2.a, nE = nomeTn(E, esce);
      W.finestra(nE).__reti.filter(function (h) { return h.__sala; }).forEach(function (h) { h.chiudi(); });   // (come «‹» nella Sala: esce)
      if (!await W.aspetta(function () { var q = partitaTn(S, m2.k); return q && q.vince === resta; }, 8000)) no(nE + " è uscito e la sua partita non va a " + nomeTn(E, resta));
      var v1 = await trisTn(S, partitaTn(S, m1.k));
      var fin = await W.aspetta(function () { var e = tn(S); return e && e.turni.length === 2 ? e.turni[1][0] : null; }, 8000);
      if (!fin || [fin.a, fin.b].sort().join() !== [v1, resta].sort().join()) no("la finale non è tra " + nomeTn(E, v1) + " e " + nomeTn(E, resta));
      await decidiTn(P, S, fin.k, fin.b);
      if (!await W.aspetta(function () { var e = tn(S); return e && e.finito; }, 6000)) no("il torneino non finisce");
      return nA + " ricarica e ritrova la sua semifinale (poi la vince " + nomeTn(E, v1) + "); " + nE + " esce e passa " + nomeTn(E, resta) + "; finale decisa";
    } },

    // 75. Fuori dalla Sala (percorso di prima): nella saletta del Tris entrano in 3, Paky vede «⚔️ Fate il torneo in 3»:
    //     un tocco e tutti passano nel torneino da soli (stesso id della stanza), che parte appena ci sono tutti
    75: { nome: "Saletta del Tris con 3 (fuori dalla Sala): «Fate il torneino in 3», tutti dentro da soli", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var G = await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return vm(C).avvId && dentro(G); }, 8000)) no("Giulia non entra nel Tris");
      var L = await W.apriTel("Luca", { hash: "gioco=tris&stanza=" + C, x: 370 });
      var b = await W.aspetta(function () { var x = P.document.querySelector(".sl-torneino"); return x && !x.hidden ? x : null; }, 8000);
      if (!b) no("Paky non vede «⚔️ Fate il torneo in 3»");
      if (b.textContent !== "⚔️ Fate il torneo in 3") no("il tasto dice «" + b.textContent + "»");
      var idG = mioId("Giulia"), idL = mioId("Luca");
      b.click();
      var S = await W.aspetta(function () { return codiceSala(); }, 5000); if (!S) no("non si apre la Sala del torneino");
      var E = await W.aspetta(function () { var e = tn(S); return e && e.iniziato ? e : null; }, 9000);
      if (!E) no("il torneino non parte («" + T(P).slice(0, 80) + "»)");
      if (((vm(S).membri) || []).length !== 3) no("nel torneino non ci sono tutti e 3");
      if (idInSala(S, "Giulia") !== idG || idInSala(S, "Luca") !== idL) no("nel torneino gli id sono cambiati");
      if (!await W.aspetta(function () { return [P, G, L].every(function (w) { return w.document.querySelector(".tr-cella, .sl-tab, .tab-elim"); }); }, 9000)) no("non tutti sono nel torneino");
      if ([G, L].some(function (w) { return /Collegamento perso|La stanza è chiusa/.test(T(w)); })) no("qualcuno legge «Collegamento perso»");
      return "stanza " + C + " → torneino nella Sala " + S + " con Paky, Giulia e Luca (stessi id), primo turno: " + E.turni[0].map(function (p) { return etTn(E, p.a) + (p.b ? "–" + etTn(E, p.b) : " passa"); }).join(", ");
    } },

    // 75b. Nella Sala in 2 si comincia il Tris; arriva Luca: nella saletta Paky vede «⚔️ Fate il torneo in 3» e la Sala diventa il torneino
    "75b": { nome: "Sala: Tris in 2, arriva il terzo, «Fate il torneino in 3» dalla saletta", fai: async function () {
      var A = await salaConAmici(["Giulia"]), S = A.S, P = A.w.Paky;
      var C = await lanciaDallaSala("Paky", S, "Tris");
      if (P.document.querySelector(".sl-torneino:not([hidden])")) no("in 2 c'è già il tasto del torneino");
      var L = await W.apriTel("Luca", { hash: "sala=" + S, x: 370, salaSempre: true });
      var b = await W.aspetta(function () { var x = P.document.querySelector(".sl-torneino"); return x && !x.hidden ? x : null; }, 10000);
      if (!b) no("arrivato Luca, Paky non vede «⚔️ Fate il torneo in 3»");
      b.click();
      var E = await W.aspetta(function () { var e = tn(S); return e && e.iniziato ? e : null; }, 6000);
      if (!E) no("la Sala non diventa il torneino");
      if (Object.keys(E.nomi).length !== 3) no("nel torneino non ci sono tutti e 3");
      if (!await W.aspetta(function () { return [P, A.w.Giulia, L].every(function (w) { return w.document.querySelector(".tr-cella, .sl-tab, .tab-elim"); }); }, 9000)) no("non tutti sono nel torneino");
      return "Tris " + C + " nella Sala " + S + " → torneino in 3: " + E.turni[0].map(function (p) { return etTn(E, p.a) + (p.b ? "–" + etTn(E, p.b) : " passa"); }).join(", ");
    } },

    // 76. In 10: il tabellone nella Sala sta in uno schermo (360x640 e 412x915) per l'host (primo turno, 5 partite col «⋯»)
    //     e per chi è fuori (secondo turno, coi turni di prima)
    76: { nome: "Torneino in 10: il tabellone in uno schermo, senza scorrere", fai: async function () {
      var amici = ["Giulia", "Luca", "Marco", "Bea", "Nina", "Ciro", "Sara", "Ugo", "Pia"];
      var A = await salaConAmici(amici), S = A.S, P = A.w.Paky;
      await apriSceltaTn(P);
      var m0 = await misureSchermata(P, "Paky"); if (m0) no("«Tris in 10»: " + m0);
      var E = await viaTn(P, S);
      if (E.turni[0].length !== 5) no("in 10 il primo turno ha " + E.turni[0].length + " partite");
      // Paky perde la sua: vede la Sala col tabellone del primo turno
      var mia = E.turni[0].filter(function (p) { return p.a === "host" || p.b === "host"; })[0];
      await decidiTn(P, S, mia.k, mia.a === "host" ? mia.b : mia.a);
      if (!await W.aspetta(function () { return P.document.querySelectorAll(".saletta-schermo .sl-tab .tb-p").length === 5; }, 8000)) no("Paky non vede le 5 partite nel tabellone («" + T(P).slice(0, 80) + "»)");
      var mH = await misureTab(P, "Paky");
      // il resto del primo turno: vince il primo della carta
      var fino = Date.now() + 30000;
      while (Date.now() < fino) {
        var e = tn(S); if (e.turni.length > 1) break;
        var p = e.turni[0].filter(function (x) { return !x.vince; })[0]; if (p) await decidiTn(P, S, p.k, p.a); else await W.dorme(150);
      }
      var E1 = tn(S); if (E1.turni.length < 2) no("non parte il secondo turno");
      var fuori = Object.keys(E1.nomi).filter(function (id) { return id !== "host" && E1.turni[0].some(function (p) { return p.b && p.vince && p.vince !== id && (p.a === id || p.b === id); }); })[0];
      var nF = nomeTn(E1, fuori), wF = W.finestra(nF);
      if (!await W.aspetta(function () { return wF.document.querySelector(".saletta-schermo .sl-tab .tb-prima"); }, 8000)) no(nF + " (fuori) non vede il tabellone coi turni di prima");
      var mF = await misureTab(wF, nF);
      return "Paky al primo turno (" + mH + "), " + nF + " al secondo (" + mF + ")";
    } },

    // 54 (p2-z). LA SERATA INTERA: 5 telefoni, un link solo (la Sala), la Classifica della serata accesa da sola.
    //   1) Scalinata in 4 (Paky, Giulia, Luca, Bea), partita vera: a metà arriva Marco (resta nella Sala: «entri alla
    //      prossima»), Luca spegne il telefono 25 s e torna al suo posto;
    //   2) Cambia gioco → Tris → «⚔️ Via al torneo»: Torneo a eliminazione in 5 (col Bot), fino al campione;
    //   3) «↻ Rifacciamo il torneo» (la rivincita del torneo), fino al campione;
    //   4) «🎮 Prossimo gioco» → Linea del tempo in 5 (Giulia ricarica la pagina a metà e torna dentro);
    //   5) Cambia gioco → La Balla Colossale in 5;
    //   6) Cambia gioco, poi l'host ricarica nella Sala (la Sala si riapre, gli amici restano) → Black Jack in 5.
    //   Tra la fine di un gioco e l'inizio del prossimo: l'host al massimo 3 tocchi, gli amici 0 (contati). Linea del tempo e
    //   Balla non si giocano fino in fondo: la fine si chiama dal tavolo (spiaTavolo) su tutti i telefoni, come quando il
    //   gioco finisce davvero. Alla fine: tutti e 5 nella stessa Sala, la classifica ha contato le partite, nessun errore
    54: { nome: "Serata intera: 5 telefoni, un link, 6 giochi di fila, classifica, chi arriva, chi si spegne, chi ricarica", fai: async function () {
      spiaTavolo();
      var TAV = ["timeline", "balla", "blackjack"], nomi = ["Paky", "Giulia", "Luca", "Bea", "Marco"], w = {}, note = [];
      w.Paky = await W.apriTel("Paky", { x: 0, salaSempre: true, spiaTav: TAV });
      var S = await apriSalaNuova("Paky");
      for (var i = 1; i < 4; i++) w[nomi[i]] = await W.apriTel(nomi[i], { hash: "sala=" + S, x: 185 * i, salaSempre: true, spiaTav: TAV });
      if (!await W.aspetta(function () { return (vm(S).membri || []).length === 4; }, 10000)) no("nella Sala non sono in 4");
      if (!vm(S).torneo) no("la Classifica della serata non è accesa da sola");
      var P = function () { return W.finestra("Paky"); }, F = function (n) { return W.finestra(n); };
      // i tocchi tra un gioco e l'altro: host al massimo 3, amici 0 (W.clicca e i tocchi veri sui telefoni degli amici)
      var conta = null, cliccaVero = W.__cliccaVero || (W.__cliccaVero = W.clicca), tocchi = [];
      W.clicca = function (x) { var r = cliccaVero.apply(this, arguments); if (conta && r) { if (x === P()) conta.h++; else conta.a++; } return r; };
      function via() { conta = { h: 0, a: 0 }; }
      function fatto(nome, max) {
        var c = conta; conta = null;
        if (c.a) no(nome + ": gli amici hanno toccato " + c.a + " volte");
        if (c.h > (max || 3)) no(nome + ": l'host ha toccato " + c.h + " volte");
        tocchi.push(nome + " " + c.h);
      }
      function tocca(x) { if (conta) conta.h++; x.click(); }
      async function tessera2(nome) { var t = await W.aspetta(function () { return tessera(P(), nome); }, 5000); if (!t) no("non trovo la tessera " + nome + " («" + T(P()).slice(0, 80) + "»)"); tocca(t); }
      async function saletta(nomeG, chi) {   // la saletta del gioco: arrivano tutti da soli, poi «Comincia»
        var C = await W.aspetta(function () { var c = codiceSaletta(P()); return P().document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 8000);
        if (!C) no("Paky non è nella saletta di " + nomeG + " («" + T(P()).slice(0, 80) + "»)");
        if (!await W.aspetta(function () { return chi.every(function (n) { return n === "Paky" || dentro(F(n)); }); }, 12000))
          no(nomeG + ": non arrivano tutti da soli (" + chi.filter(function (n) { return n !== "Paky" && !dentro(F(n)); }).join(", ") + " fuori)");
        if (!await W.aspetta(function () { return W.clicca(P(), /^\s*(▶\s*)?Comincia/, ".sl-go"); }, 5000)) no(nomeG + ": Paky non trova «Comincia»");
        if (!await W.aspetta(function () { return chi.every(function (n) { return !F(n).document.querySelector(".saletta-schermo"); }); }, 10000)) no(nomeG + ": la partita non comincia per tutti");
        return C;
      }
      function fineFinta(classifica) {   // la fine dal tavolo, su tutti i telefoni del gioco
        nomi.forEach(function (n) { var x = F(n); if (x && x.__tav && x.__tav.fine) try { x.__tav.fine(classifica); } catch (e) {} });
      }
      async function cambiaGioco(nome) {
        if (!await W.aspetta(function () { return W.clicca(P(), /Cambia gioco/, ".fine-tasti button"); }, 8000)) no(nome + ": a fine partita Paky non ha «🎮 Cambia gioco»");
      }
      // 1) Scalinata in 4, partita vera (tocchi: Scegli un gioco, la tessera, Comincia)
      via();
      if (!await W.aspetta(function () { return W.clicca(P(), /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("nella Sala non c'è «Scegli un gioco»");
      await tessera2("La Scalinata");
      var C1 = await saletta("Scalinata", ["Paky", "Giulia", "Luca", "Bea"]);
      fatto("Sala → Scalinata");
      w.Marco = await W.apriTel("Marco", { hash: "sala=" + S, x: 740, salaSempre: true, spiaTav: TAV });
      if (!await W.aspetta(function () { return /prossima/.test(T(F("Marco"))); }, 10000)) no("Marco arriva a partita in corso ma non legge «entri alla prossima» («" + T(F("Marco")).slice(0, 80) + "»)");
      W.spegni("Luca"); await W.dorme(25000); W.riaccendi("Luca");
      if (!await scalinataFinoAllaFine(C1, ["Giulia", "Luca", "Bea"], "Paky")) no("la Scalinata non finisce");
      if (!await W.aspetta(function () { return F("Luca").document.querySelector(".fine-tasti"); }, 10000)) no("Luca (spento 25 s) non arriva alla fine della Scalinata («" + T(F("Luca")).slice(0, 80) + "»)");
      note.push("Scalinata: Marco arriva («entri alla prossima»), Luca spento 25 s e di nuovo dentro");
      // 2) Torneo a eliminazione in 5 (tocchi: Cambia gioco, Tris, Via al torneo)
      via();
      await cambiaGioco("Scalinata");
      await tessera2("Tris");
      if (!await W.aspetta(function () { return W.clicca(P(), /Via al torneo/, ".piede button"); }, 5000)) no("in «Tris in 5» non c'è «⚔️ Via al torneo»");
      var E1 = await W.aspetta(function () { var e = tn(S); return e && e.iniziato ? e : null; }, 6000);
      if (!E1) no("il torneo non parte");
      fatto("Scalinata → Torneo");
      if (Object.keys(E1.nomi).length !== 5) no("nel torneo non giocano tutti e 5");
      await finoAllaFineTn(P(), S);
      // 3) la rivincita del torneo (1 tocco)
      via();
      if (!await W.aspetta(function () { var b = P().document.querySelector(".tb-rifai"); if (b) { b.click(); conta.h++; } return b; }, 8000)) no("a torneo finito Paky non ha «↻ Rifacciamo il torneo»");
      var E2 = await W.aspetta(function () { var e = tn(S); return e && e.iniziato && !e.finito && e.k !== E1.k ? e : null; }, 6000);
      if (!E2) no("«Rifacciamo il torneo» non fa ripartire il torneo");
      fatto("Torneo → di nuovo il torneo");
      await finoAllaFineTn(P(), S);
      // 4) Linea del tempo in 5 (tocchi: Prossimo gioco, la tessera, Comincia); Giulia ricarica a metà
      via();
      if (!await W.aspetta(function () { return W.clicca(P(), /Prossimo gioco/, ".sl-go"); }, 8000)) no("a torneo finito Paky non ha «🎮 Prossimo gioco»");
      await tessera2("La linea del tempo");
      var C4 = await saletta("Linea del tempo", nomi);
      fatto("Torneo → Linea del tempo");
      await W.dorme(1500);
      w.Giulia = await W.ricarica("Giulia", { spiaTav: TAV });
      if (!await W.aspetta(function () { return !F("Giulia").document.querySelector(".saletta-schermo") && F("Giulia").__tav && ids(C4, "giocatori").indexOf(idInSala(S, "Giulia")) >= 0; }, 12000))
        no("Giulia ricarica dentro la Linea del tempo e non torna in partita («" + T(F("Giulia")).slice(0, 80) + "»)");
      note.push("Linea del tempo: Giulia ricarica e torna in partita");
      fineFinta([{ nome: "Bea", pos: 1 }, { nome: "Marco", pos: 2 }, { nome: "Paky", pos: 3 }, { nome: "Giulia", pos: 4 }, { nome: "Luca", pos: 5 }]);
      // 5) La Balla Colossale in 5 (tocchi: Cambia gioco, la tessera, Comincia)
      via();
      await cambiaGioco("Linea del tempo");
      await tessera2("La Balla Colossale");
      await saletta("Balla", nomi);
      fatto("Linea del tempo → Balla");
      await W.dorme(1500);
      fineFinta([{ nome: "Luca", pos: 1 }, { nome: "Giulia", pos: 2 }, { nome: "Bea", pos: 3 }, { nome: "Paky", pos: 4 }, { nome: "Marco", pos: 5 }]);
      // 6) Cambia gioco, l'host ricarica nella Sala (stesso codice, gli amici restano), poi Black Jack in 5
      await cambiaGioco("Balla");
      await W.dorme(800);
      w.Paky = await W.ricarica("Paky", { salaSempre: true, spiaTav: TAV });
      if (!await W.aspetta(function () { return P().document.querySelector(".saletta-schermo") && codiceTestata(P()) === S; }, 12000)) no("ricaricata la pagina, la Sala di Paky non si riapre con lo stesso codice («" + T(P()).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { return (vm(S).membri || []).length === 5; }, 15000)) no("dopo la ricarica dell'host nella Sala non sono in 5 (" + (vm(S).membri || []).length + ")");
      via();
      if (!await W.aspetta(function () { return W.clicca(P(), /Scegli (un|il primo) gioco|Prossimo gioco/); }, 6000)) no("dopo la ricarica non c'è «Scegli un gioco»");
      await tessera2("Black Jack");
      await saletta("Black Jack", nomi);
      fatto("(host ricaricato) Sala → Black Jack");
      var Tn = vm(S).torneo || {};
      if (!Tn.n || Tn.n < 3) no("la Classifica della serata ha contato " + (Tn.n || 0) + " partite");
      if ((vm(S).membri || []).length !== 5) no("alla fine nella Sala non sono in 5");
      W.clicca = cliccaVero;
      return note.join("; ") + "; tocchi dell'host: " + tocchi.join(", ") + " (amici 0); classifica: " + Tn.n + " partite";
    } },

    // 55 (p2-z). LE MISURE delle schermate nuove del Passo 2, a 360x640 e 412x915: la Sala con 6 e la classifica corta (host e
    //   amico), «Tris in 6» (le scelte del torneo), le coppie da scegliere in 10, «Chi gioca a …?» con 10, il primo avatar
    //   (lui/lei e i look). Le altre (home, 4 caselle, chi manca, regole, fine con la classifica, tabellone in 10) le misurano
    //   già 40-46b, 50, 76, 90: qui si ricordano solo
    55: { nome: "Misure delle schermate nuove del Passo 2 (360x640 e 412x915)", fai: async function () {
      var esiti = [], amici = ["Giulia", "Luca", "Marco", "Bea", "Nino", "Ugo", "Rita", "Sara", "Tino"];
      var A = await salaConAmici(amici), S = A.S, P = A.w.Paky;
      // la Sala con la classifica corta (host e amico); controllaSchermo misura con 6 nomi a vista
      for (var mi = 0, MS = [[360, 640], [412, 915]]; mi < MS.length; mi++) {
        var e1 = await controllaSchermo(P, "Paky", MS[mi][0], MS[mi][1], 6), e2 = await controllaSchermo(A.w.Giulia, "Giulia", MS[mi][0], MS[mi][1], 6);
        if (e1) no("Sala di Paky (10) a " + MS[mi].join("x") + ": " + e1);
        if (e2) no("Sala di Giulia (10) a " + MS[mi].join("x") + ": " + e2);
      }
      [P, A.w.Giulia].forEach(function (x, k) { var f = document.getElementById("tel-" + ["Paky", "Giulia"][k]); f.style.width = "360px"; f.style.height = "740px"; x.dispatchEvent(new x.Event("resize")); });
      if (!P.document.querySelector(".sl-torneo-corto")) no("nella Sala non c'è la classifica corta");
      esiti.push("Sala con 10 e classifica corta");
      // «Tris in 10»: le scelte del torneo
      await apriSceltaTn(P);
      chipTn(P, "Scegliete voi");
      var m1 = await misureSchermata(P, "Paky"); if (m1) no("«Tris in 10»: " + m1);
      esiti.push("Tris in 10");
      // la scelta delle coppie in 10 (host e amico)
      if (!W.clicca(P, /Via al torneo/, ".piede button")) no("non c'è «⚔️ Via al torneo»");
      if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-tab .tb-posto").length === 10 && A.w.Bea.document.querySelectorAll(".sl-tab .tb-posto").length === 10; }, 6000)) no("le coppie in 10 non hanno 5 partite coi posti");
      esiti.push("coppie in 10: Paky " + await misureTab(P, "Paky") + ", Bea " + await misureTab(A.w.Bea, "Bea"));
      // di nuovo nella Sala (‹ ferma il torneo) e «Chi gioca a Tris?» con 10 (dopo «🤺 Una sfida»)
      W.clicca(P, /‹/, ".testa button"); await W.dorme(600);
      if (!await W.aspetta(function () { return !vm(S).elim; }, 6000)) no("il torneo non si ferma");
      await apriSceltaTn(P);
      W.clicca(P, /Una sfida/, ".tn-scelta"); W.clicca(P, /Scegli chi gioca/, ".piede button");
      if (!await W.aspetta(function () { return P.document.querySelector(".chi-gioca-sc"); }, 4000)) no("non si apre «Chi gioca a Tris?»");
      esiti.push("Chi gioca con 10: " + await misureChi(P, "Paky"));
      // il primo avatar (lui/lei, i look) su un telefono nuovo senza profilo
      var N = await W.apriTel("Nina", { x: 0, profilo: false });
      var b = await W.aspetta(function () { return N.document.querySelector(".benvenuto-profilo:not(.bp-entra):not(.bp-bentornato):not(.bp-rete)"); }, 5000);
      if (!b) no("Nina non vede il benvenuto");
      var campi = b.querySelectorAll("input.link-campo"); campi[0].value = "Nina"; campi[1].value = "segreto1"; W.clicca(N, /^Avanti/);
      if (!await W.aspetta(function () { return N.document.querySelector(".primo-avatar .pa-forma"); }, 4000)) no("non si apre «Sei lui o lei?»");
      var m2 = await misuraProfilo(N, "Nina", 360, 640) || await misuraProfilo(N, "Nina", 412, 915); if (m2) no("«Sei lui o lei?»: " + m2);
      N.document.querySelectorAll(".primo-avatar .pa-forma")[0].click(); await W.dorme(100);
      var m3 = await misuraProfilo(N, "Nina", 360, 640) || await misuraProfilo(N, "Nina", 412, 915); if (m3) no("«Scegli il tuo look»: " + m3);
      esiti.push("primo avatar (lui/lei, look)");
      return esiti.join(" · ") + " — tutto a 360x640 e 412x915 senza scorrere (home, 4 caselle, chi manca, regole, fine con la classifica e tabellone in 10: scenari 40-46b, 50, 76, 90)";
    } },

    // 56 (p2-z). LA LISTA DEI 23 GIOCHI, tutti nella stessa Sala con 5 telefoni (Paky, Giulia, Luca, Marco, Bea), uno dopo
    //   l'altro: entra (dalla Sala, con «🤺 Una sfida»/«Chi gioca?» dove i posti sono pochi; gli amici arrivano da soli),
    //   gioca (la partita parte per tutti), ↻ Rivincita (si riparte senza toccare niente sui telefoni degli amici),
    //   🎮 Cambia gioco (tutti di nuovo nella Sala), ⚙️ impostazioni col box fuori dalla pagina (Sala, online, stesso
    //   telefono, serata a punti). La fine si chiama dal tavolo su tutti i telefoni (spiaTavolo): le partite intere vere
    //   sono nei file dei gruppi (passo2/gruppo-*.js). opz.solo = ["tris", …] per provarne solo alcuni
    56: { nome: "Lista dei 23 giochi nella Sala: entra, gioca, Rivincita, Cambia gioco, impostazioni fuori pagina", fai: async function (opz) {
      spiaTavolo();
      var LISTA = ["tris", "drop4", "navale", "scopa", "calciobiliardo", "scalinata", "pallamatta", "ruota", "scopa2v2", "pendolo", "horto",
        "blackjack", "poker", "asta", "sipero", "scarabocchio", "garapesca", "timeline", "nomicose", "balla", "taboo", "ordine", "patata",
        "scopone", "impostore", "chidinoi"];   // (dal 16 ott anche lo Scopone e L'Impostore online e «Chi di Noi?»)
      if (opz && opz.solo) LISTA = LISTA.filter(function (g) { return opz.solo.indexOf(g) >= 0; });
      var nomi = ["Paky", "Giulia", "Luca", "Marco", "Bea"], prof = { fiches: { blackjack: 5000 } };
      await W.apriTel("Paky", { x: 0, salaSempre: true, spiaTav: LISTA, profilo: prof });
      var S = await apriSalaNuova("Paky");
      for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "sala=" + S, x: 185 * i, salaSempre: true, spiaTav: LISTA, profilo: prof });
      if (!await W.aspetta(function () { return (vm(S).membri || []).length === 5; }, 12000)) no("nella Sala non sono in 5");
      var P = W.finestra("Paky"), F = W.finestra, tab = [], rotti = [];
      // i giochi (nome, posti, impostazioni): si ricaricano i loro file in una copia, come nel 227
      var REG = {}, FILE = { nomicose: "nomicoseecitta", scopa2v2: "scopa2" }, reg0 = P.SG.registra;
      P.SG.registra = function (x) { REG[x.id] = x; };
      try { for (var fi = 0; fi < LISTA.length; fi++) P.eval(await (await fetch("/js/games/" + (FILE[LISTA[fi]] || LISTA[fi]) + ".js?" + Date.now())).text()); }
      finally { P.SG.registra = reg0; }
      P.__reg = REG;
      var fineTasti = function () { return P.document.querySelector(".fine-tasti"); };
      function fineFinta() { nomi.forEach(function (n, k) { var x = F(n); if (x && x.__tav && x.__tav.fine) try { x.__tav.fine(nomi.map(function (m, j) { return { nome: m, pos: j + 1 }; })); } catch (e) {} }); }
      for (var gi = 0; gi < LISTA.length; gi++) {
        var gid = LISTA[gi], g = (P.__reg || {})[gid], riga = { id: gid, entra: "✗", gioca: "✗", riv: "✗", cambia: "✗", box: "✗" };
        tab.push(riga);
        try {
          if (!g) throw new Error("gioco non registrato");
          nomi.forEach(function (n) { F(n).__tav = null; });
          // entra: dalla Sala (o dalla fine del gioco di prima: «Cambia gioco» l'ha già fatto)
          if (!P.document.querySelector(".tessera")) { if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 6000)) throw new Error("non c'è «Scegli un gioco»"); }
          var tess = await W.aspetta(function () { return tessera(P, g.nome); }, 5000); if (!tess) throw new Error("niente tessera «" + g.nome + "»");
          tess.click();
          var dove = await W.aspetta(function () { return P.document.querySelector(".torneino-sc, .chi-gioca-sc, .saletta-schermo"); }, 5000);
          if (dove && dove.classList.contains("torneino-sc")) { W.clicca(P, /Una sfida/, ".tn-scelta"); W.clicca(P, /Scegli chi gioca/, ".piede button"); dove = await W.aspetta(function () { return P.document.querySelector(".chi-gioca-sc"); }, 4000); }
          if (dove && dove.classList.contains("chi-gioca-sc")) W.clicca(P, /Si gioca/, ".piede button");
          var C = await W.aspetta(function () { var c = codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 8000);
          if (!C) throw new Error("l'host non arriva nella saletta");
          var posti = Math.min(g.postiOnline || 10, 5);
          if (!await W.aspetta(function () { return nomi.slice(1).filter(function (n) { return dentro(F(n)); }).length >= posti - 1; }, 12000)) throw new Error("gli amici non arrivano da soli (dentro: " + nomi.slice(1).filter(function (n) { return dentro(F(n)); }).join(", ") + ")");
          riga.entra = "✓";
          // gioca: «Comincia» e la partita parte per l'host e per chi gioca
          await W.dorme(600);
          if (!await W.aspetta(function () { W.clicca(P, /^\s*(▶\s*)?(Comincia|Via ▶|Continua ▶)/, ".sl-go, .piede button"); return P.__tav && !P.document.querySelector(".saletta-schermo"); }, 12000)) throw new Error("la partita non parte per l'host");
          riga.gioca = "✓";
          await W.dorme(1200);
          fineFinta();
          if (!await W.aspetta(function () { var b = fineTasti(); return b && /Rivincita/.test(b.textContent); }, 8000)) throw new Error("a fine partita l'host non ha «↻ Rivincita»");
          // ↻ Rivincita: l'host lascia la fine e si riparte (nella stessa stanza o in una nuova), gli amici senza toccare
          var tav0 = P.__tav;
          W.clicca(P, /Rivincita/, ".fine-tasti button");
          if (await W.aspetta(function () { return !fineTasti() && (P.__tav !== tav0 || P.document.querySelector(".saletta-schermo") || vm(C).fase !== "fine"); }, 12000)) riga.riv = "✓";
          else riga.riv = "✗ (resta la fine)";
          // di nuovo la fine, poi 🎮 Cambia gioco: tutti nella Sala
          if (P.document.querySelector(".saletta-schermo") && !P.__tav) { await W.aspetta(function () { W.clicca(P, /^\s*(▶\s*)?(Comincia|Via ▶|Continua ▶)/, ".sl-go"); return P.__tav; }, 10000); }
          await W.dorme(1000);
          fineFinta();
          if (!await W.aspetta(function () { return W.clicca(P, /Cambia gioco/, ".fine-tasti button"); }, 8000)) throw new Error("alla fine non c'è «🎮 Cambia gioco»");
          if (!await W.aspetta(function () { return !vm(S).gioco && P.document.querySelector(".tessera") && nomi.slice(1).every(function (n) { return F(n).document.querySelector(".saletta-schermo") && /Sala/.test(T(F(n))); }); }, 10000))
            throw new Error("«Cambia gioco» non porta tutti nella Sala");
          riga.cambia = "✓";
        } catch (e) { rotti.push(gid + ": " + e.message); }
        // ⚙️ le impostazioni col box fuori dalla pagina
        try {
          if (g && typeof g.impostazioni === "function") {
            [{ sala: true, modo: "online" }, { modo: "online" }, { modo: (g.modi && g.modi[0] && g.modi[0].modo) || "locale" }, { torneo: true }].forEach(function (a) {
              var box = P.document.createElement("div"), imp = {};
              g.impostazioni(box, imp, Object.assign({ el: function (t, at, fi) { var n = P.document.createElement(t); if (at) Object.keys(at).forEach(function (k) { var v = at[k]; if (v == null) return; if (k === "text") n.textContent = v; else if (k === "html") n.innerHTML = v; else if (k === "class") n.className = v; else if (k.slice(0, 2) === "on" && typeof v === "function") n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); }); [].concat(fi || []).forEach(function (f) { if (f != null) n.appendChild(typeof f === "string" ? P.document.createTextNode(f) : f); }); return n; }, giocatori: nomi.slice(0, 3) }, a));
              if (g.riassunto) g.riassunto(imp);
            });
          }
          riga.box = "✓";
        } catch (e2) { rotti.push(gid + " (impostazioni): " + e2.message); }
        if (!P.document.querySelector(".tessera") && (vm(S).gioco || !P.document.querySelector(".saletta-schermo"))) {   // (rimettersi nella Sala per il prossimo)
          if (!W.clicca(P, /Cambia gioco|Torna in Sala/, ".fine-tasti button")) W.clicca(P, /‹/, ".testa button");
          await W.dorme(1500);
        }
      }
      var testo = tab.map(function (r) { return r.id + " " + [r.entra, r.gioca, r.riv.charAt(0), r.cambia, r.box].join(""); }).join(" · ");
      W.__lista23 = tab;
      if (rotti.length || tab.some(function (r) { return r.riv !== "✓"; })) no("lista (entra gioca rivincita cambia box): " + testo + (rotti.length ? " — " + rotti.join(" | ") : ""));
      return "lista (entra gioca rivincita cambia box): " + testo;
    } },

    // 78 (p2-z). Sullo stesso telefono, senza aprire la «Serata a punti»: due partite di fila col gruppo (Paky e Giulia)
    //     sommano i punti da sole nella Classifica della serata: a fine partita la riga «🏆 Classifica della serata: …», un
    //     tocco apre la classifica («2 partite giocate»), in home «🏆 Riprendi la serata a punti». La fine si chiama a mano
    //     dal tavolo del gioco (spiaTavolo), così la prova non dipende dalle mosse della Patata
    78: { nome: "Stesso telefono: la Classifica della serata si somma da sola gioco dopo gioco", fai: async function () {
      spiaTavolo();
      var P = await W.apriTel("Paky", { x: 0, spiaTav: ["patata"] });
      var tess = await W.aspetta(function () { return tessera(P, "La Patata Bollente"); }, 5000);
      if (!tess) no("non trovo la Patata Bollente");
      tess.click();
      if (!await W.aspetta(function () { return W.clicca(P, /Su questo telefono/, ".modo-grande"); }, 3000)) no("in «Come giocate?» non c'è «Su questo telefono»");
      var campi = await W.aspetta(function () { var c = P.document.querySelectorAll(".sala-riga input"); return c.length ? c : null; }, 3000);
      if (!campi) no("non c'è la lista di chi gioca");
      while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) no("non c'è «＋ Aggiungi giocatore»"); await W.dorme(100); }
      var c2 = P.document.querySelectorAll(".sala-riga input");
      [["Paky", 0], ["Giulia", 1]].forEach(function (x) { c2[x[1]].value = x[0]; c2[x[1]].dispatchEvent(new P.Event("input", { bubbles: true })); });
      while (P.document.querySelectorAll(".sala-riga input").length > 2) { P.document.querySelectorAll(".sala-riga .togli")[2].click(); await W.dorme(100); }
      if (!W.clicca(P, /Avanti/, ".piede button")) no("non c'è «Avanti ▶»");
      if (!await W.aspetta(function () { return W.clicca(P, /^Comincia/, ".piede button"); }, 3000)) no("non c'è «Comincia ▶»");
      var t1 = await W.aspetta(function () { return P.__tav; }, 4000); if (!t1) no("la Patata non parte");
      t1.fine([{ nome: "Paky", pos: 1 }, { nome: "Giulia", pos: 2 }]);
      var riga = function () { var b = P.document.querySelector(".fine-serata"); return b ? b.textContent : ""; };
      if (!await W.aspetta(function () { return /Classifica della serata: Paky 1° · Giulia 2°/.test(riga()); }, 3000)) no("a fine partita non c'è «🏆 Classifica della serata: Paky 1° · Giulia 2°» («" + riga() + "»)");
      var mis = await misureSchermata(P, "Paky"); if (mis) no("la fine con la riga della serata: " + mis);
      if (!W.clicca(P, /Rigioca/)) no("non c'è «↻ Rigioca»");
      var t2 = await W.aspetta(function () { return P.__tav !== t1 && P.__tav; }, 4000); if (!t2) no("«Rigioca» non fa ripartire la Patata");
      t2.fine([{ nome: "Giulia", pos: 1 }, { nome: "Paky", pos: 2 }]);
      if (!await W.aspetta(function () { return riga(); }, 3000)) no("alla 2ª fine non c'è la riga della serata");
      var r1 = riga();
      P.document.querySelector(".fine-serata").click();
      if (!await W.aspetta(function () { return /Classifica della serata/.test(T(P)) && /2 partite giocate/.test(T(P)); }, 3000)) no("toccata la riga, la classifica non dice «2 partite giocate» («" + T(P).slice(0, 100) + "»)");
      W.clicca(P, /Home/);
      if (!await W.aspetta(function () { return /Riprendi la serata a punti/.test(T(P)); }, 3000)) no("in home non c'è «🏆 Riprendi la serata a punti»");
      return "2 partite col gruppo → riga «" + r1 + "» a fine partita (360x640 e 412x915 ok), classifica con 2 partite, home «Riprendi la serata a punti»";
    } },

    // 77 (p2-z). In 6, coppie «✋ Scegliete voi»: si apre il tabellone delle coppie («Partita 1: posto libero contro posto
    //     libero», 3 partite), ognuno tocca un posto e lo vedono tutti; un posto preso non si tocca; «Seduti 3 su 6» e il conto
    //     alla rovescia; Paky «⚔️ Via al torneo»: chi si è seduto gioca con chi ha scelto, chi era in piedi va nei posti rimasti.
    //     Misure del tabellone delle coppie a 360x640 e 412x915 (host e amico)
    77: { nome: "Torneo in 6 con le coppie scelte: posti da toccare, Seduti N su 6, conto alla rovescia, Via", fai: async function () {
      var A = await salaConAmici(["Giulia", "Luca", "Marco", "Bea", "Nino"]), S = A.S, P = A.w.Paky;
      await apriSceltaTn(P);
      if (opzVisibili(P).indexOf("Le coppie") < 0) no("in «Tris in 6» non c'è «Le coppie»");
      chipTn(P, "Scegliete voi");
      if (!/si siede dove e con chi vuole/.test(T(P))) no("scelto «Scegliete voi», la nota non lo dice");
      if (!W.clicca(P, /Via al torneo/, ".piede button")) no("non c'è «⚔️ Via al torneo»");
      var E = await W.aspetta(function () { var e = tn(S); return e && e.scade && !e.iniziato ? e : null; }, 5000);
      if (!E || E.coppie !== "scelte") no("non si apre la scelta delle coppie (" + JSON.stringify(tn(S) || {}).slice(0, 120) + ")");
      var nomi = ["Paky", "Giulia", "Luca", "Marco", "Bea", "Nino"];
      if (!await W.aspetta(function () { return nomi.every(function (n) { return A.w[n].document.querySelectorAll(".sl-tab .tb-posto").length === 6; }); }, 6000))
        no("non tutti vedono 3 partite coi posti («" + T(A.w.Bea).slice(0, 100) + "»)");
      if (!/Partita 1/.test(T(A.w.Giulia)) || !/＋ libero/.test(T(A.w.Giulia))) no("Giulia non legge «Partita 1 … ＋ libero»");
      if (!A.w.Paky.document.querySelector(".tb-conto")) no("manca il conto alla rovescia");
      function posto(w, n, i) { return w.document.querySelectorAll(".sl-tab .tb-posti")[n - 1].querySelectorAll(".tb-posto")[i]; }
      posto(A.w.Giulia, 1, 0).click(); await W.aspetta(function () { return (tn(S).gironi || {})[idInSala(S, "Giulia")] === 1; }, 3000);
      posto(A.w.Luca, 1, 1).click(); await W.aspetta(function () { return (tn(S).gironi || {})[idInSala(S, "Luca")] === 1; }, 3000);
      if (!await W.aspetta(function () { var b = posto(A.w.Marco, 1, 0); return b && b.disabled && /Giulia/.test(b.textContent); }, 4000)) no("Marco non vede Giulia seduta (o può prenderle il posto)");
      posto(A.w.Marco, 2, 1).click();
      if (!await W.aspetta(function () { return /Seduti 3 su 6/.test(T(P)); }, 4000)) no("Paky non legge «Seduti 3 su 6» («" + T(P).slice(0, 120) + "»)");
      if (!/Sei seduto nella Partita 1/.test(T(A.w.Giulia))) no("Giulia non legge «Sei seduto nella Partita 1»");
      var mH = await misureTab(P, "Paky"), mG = await misureTab(A.w.Bea, "Bea");
      if (!W.clicca(P, /Via al torneo/, ".sl-go")) no("Paky non ha «⚔️ Via al torneo» nella saletta");
      var E1 = await W.aspetta(function () { var e = tn(S); return e && e.iniziato ? e : null; }, 5000);
      if (!E1) no("toccato «Via», il torneo non parte");
      var t0 = E1.turni[0], g = idInSala(S, "Giulia"), l = idInSala(S, "Luca");
      if (t0.length !== 3) no("il primo turno ha " + t0.length + " partite");
      if (!t0.some(function (p) { return (p.a === g && p.b === l) || (p.a === l && p.b === g); })) no("Giulia e Luca non giocano insieme come avevano scelto");
      var tutti = {}; t0.forEach(function (p) { tutti[p.a] = 1; if (p.b) tutti[p.b] = 1; });
      if (Object.keys(tutti).length !== 6) no("non giocano tutti e 6 al primo turno: " + JSON.stringify(t0));
      if (P.document.querySelector(".tb-conto")) no("partito il torneo, il conto alla rovescia è ancora lì");
      return "3 partite coi posti per tutti, Seduti 3 su 6, coppie scelte rispettate (" + t0.map(function (p) { return nomeTn(E1, p.a) + "–" + nomeTn(E1, p.b); }).join(", ") + "); misure " + mH + " / " + mG;
    } },

  };

  // =========================================================
  //  PASSO 5 (p5-a): la ripresa comune (t.ricorda / t.ripresa / t.mioId)
  // =========================================================
  // Il gioco finto «Contatore» (solo per le prove: nessun file del gioco). Tutti toccano «+1»; l'host ha «🏁 Fine».
  // Host: { fase: lobby|gioco|ripresa|fine, n, giocatori: [{ id, nome, via, punti }], scade, classifica }, t.ricorda a ogni
  // foto (null in saletta), ripresa con 3 s di «ripresa» e gli altri "via" finché non rientrano. OPZ: { riprende: false }
  // (un gioco che non riprende), { riserva: true } (per p5-b), { online: true } (si lancia anche dalla Sala: provaOnline). Si mette nei telefoni con apriTel(nome, { prima: contatore() })
  // e si apre col percorso di prima: hash "gioco=contatore" → «🔗 Apri la stanza» (aiuto apriContatore).
  function contatoreGioco(OPZ) {
    OPZ = OPZ || {};
    var ID = "contatore";
    function stile() {
      if (document.getElementById("ct-stile")) return;
      var s = document.createElement("style"); s.id = "ct-stile";
      s.textContent = ".ct-scena{display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px}.ct-n{font-size:4rem;font-weight:900}" +
        ".ct-chi{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.ct-chip{padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800}.ct-chip.via{opacity:.4}";
      document.head.appendChild(s);
    }
    // il disegno, uguale per host e ospiti: saletta (t.lobby), gioco (costruito una volta, poi solo i numeri), classifica
    function disegnatore(t, cb) {
      var UI = null, FIN = null;
      return function (v) {
        if (v.fase === "lobby") {
          UI = FIN = null;
          return t.lobby({ host: cb.host, codice: v.codice, pronta: v.pronta, min: 1, attesa: "Aspetta che l'host cominci!",
            giocatori: v.giocatori.filter(function (p) { return !p.via; }).map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.mio() }; }),
            onComincia: cb.comincia, onEsci: cb.esci });
        }
        if (v.fase === "fine") {
          UI = null;
          var kf = JSON.stringify(v.classifica || []);
          if (FIN && FIN.k === kf && document.body.contains(FIN.s)) return;
          var s = t.schermata({ icona: "🏆", titolo: "Classifica" });
          var ol = t.el("ol", { class: "classifica ct-classifica" });
          (v.classifica || []).forEach(function (r) { ol.appendChild(t.el("li", {}, [t.el("span", { class: "nome", text: r.nome }), t.el("span", { class: "punti", text: String(r.punti) })])); });
          s._contenuto.appendChild(ol);
          if (!t.tastiFine(s._piede, { host: cb.host, nuova: cb.host ? cb.nuova : null, esci: cb.esci }))
            s._piede.appendChild(t.el("button", { class: "btn btn-fantasma ct-esci", text: "🏠 Esci", onclick: cb.esci }));
          t.mostra(s); FIN = { k: kf, s: s };
          return;
        }
        FIN = null;
        if (!UI || !document.body.contains(UI.s)) {
          stile();
          var sc = t.schermata({});
          UI = { s: sc, n: t.el("div", { class: "ct-n", text: "0" }), stato: t.el("p", { class: "ct-stato" }), chi: t.el("div", { class: "ct-chi" }), chip: {} };
          sc._contenuto.appendChild(t.el("div", { class: "ct-scena" }, [UI.stato, UI.n, UI.chi,
            t.el("button", { class: "btn btn-primario ct-piu", text: "+1", onclick: cb.piu })]));
          if (cb.host) sc._piede.appendChild(t.el("button", { class: "btn btn-primario ct-fine", text: "🏁 Fine", onclick: cb.fine }));
          sc._piede.appendChild(t.el("button", { class: "btn btn-fantasma ct-esci", text: "‹ Esci", onclick: cb.esci }));
          t.mostra(sc);
        }
        var tx = v.fase === "ripresa" ? "🔁 Si riprende…" : "Tocca +1!";
        if (UI.stato.textContent !== tx) UI.stato.textContent = tx;
        if (UI.n.textContent !== String(v.n)) UI.n.textContent = String(v.n);
        v.giocatori.forEach(function (p) {
          var c = UI.chip[p.id]; if (!c) { c = UI.chip[p.id] = t.el("span", { class: "ct-chip" }); UI.chi.appendChild(c); }
          var x = (p.id === cb.mio() ? "Tu" : p.nome) + " " + p.punti; if (c.textContent !== x) c.textContent = x;
          c.classList.toggle("via", !!p.via);
        });
      };
    }
    function host(t) {
      var R = t.ripresa, io = t.mioId, nome = t.giocatori[0] || "Host", codice = null, pronta = false, timer = null;
      var st = { fase: "lobby", n: 0, giocatori: [{ id: io, nome: nome, via: false, punti: 0, omino: t.mioOmino(nome) }], scade: null, riprende: null, classifica: null };
      if (R && R.stato && R.stato.giocatori) {
        st = R.stato;
        // la partita di prima: gli altri sono "via" finché il loro join non li rimette al posto (stesso id)
        st.giocatori.forEach(function (p) { p.via = p.id !== io; });
        if (st.fase === "gioco" || st.fase === "ripresa") { st.fase = "ripresa"; st.riprende = Date.now() + 3000; if (st.scade) st.scade = R.ora(st.scade) + 3000; }
      }
      function pDi(id) { return st.giocatori.filter(function (p) { return p.id === id; })[0] || null; }
      var cb = { host: true, mio: function () { return io; },
        comincia: function () { if (st.fase !== "lobby") return; st.fase = "gioco"; st.scade = Date.now() + 300000; bd(); },
        piu: function () { piu(io); },
        fine: function () { fine(); },
        nuova: function () { st.fase = "lobby"; st.n = 0; st.classifica = null; st.scade = null; st.giocatori = st.giocatori.filter(function (p) { return !p.via; }); st.giocatori.forEach(function (p) { p.punti = 0; }); bd(); },
        esci: function () { clearInterval(timer); rete.chiudi(); t.esci(); } };
      var disegna = disegnatore(t, cb);
      function vm() { return { fase: st.fase, n: st.n, codice: codice, pronta: pronta, ripresa: st.fase === "ripresa", classifica: st.classifica,
        giocatori: st.giocatori.map(function (p) { return { id: p.id, nome: p.nome, via: !!p.via, punti: p.punti, omino: st.fase === "lobby" ? (p.omino || null) : undefined }; }) }; }
      function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); t.ricorda(st.fase === "lobby" ? null : st); disegna(v); }
      function piu(id) { var p = pDi(id); if (st.fase !== "gioco" || !p || p.via) return; p.punti++; st.n++; bd(); }
      function fine() {
        if (st.fase !== "gioco" && st.fase !== "ripresa") return;
        var ord = st.giocatori.slice().sort(function (a, b) { return b.punti - a.punti; });
        st.classifica = ord.map(function (p) { return { nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
        st.fase = "fine";
        t.risultato(st.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
        bd();
      }
      var rete = SGNet.ospita(ID, {
        onCodice: function (c) { codice = c; bd(); },
        onConnesso: function () { pronta = true; bd(); },
        onErrore: function () {},
        onAddio: function (id) { var p = pDi(id); if (!p) return; if (st.fase === "lobby") st.giocatori = st.giocatori.filter(function (x) { return x !== p; }); else p.via = true; bd(); },
        onMsg: function (id, m) {
          if (!m) return;
          if (m.t === "join") {
            var p = pDi(id);
            if (p) p.via = false;
            else st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), via: false, punti: 0, omino: m.omino || null });
            return bd();
          }
          if (m.t === "piu") piu(id);
        }
      }, { ripresa: !!R });
      // ripresa sulla classifica: il gioco ridice com'è finita (il core non ridà XP né punti)
      if (R && st.fase === "fine" && st.classifica) setTimeout(function () { t.risultato(st.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; })); }, 300);
      timer = setInterval(function () {
        if (st.fase === "ripresa" && Date.now() > st.riprende) { st.fase = "gioco"; bd(); }
        else if (st.fase === "gioco" && st.scade && Date.now() > st.scade) fine();
      }, 300);
      bd();
    }
    function ospite(t, codice) {
      var myId = null, nome = t.nomeProfilo() || "Amico";
      var cb = { host: false, mio: function () { return myId; },
        piu: function () { if (rete) rete.invia({ t: "piu" }); },
        esci: function () { if (rete) rete.chiudi(); t.esci(); } };
      var disegna = disegnatore(t, cb);
      var s = t.schermata({ icona: "🔢", titolo: "Entro…", sotto: "Stanza " + codice }); t.mostra(s);
      var rete = SGNet.entra(codice, {
        onAperto: function (id) { myId = id; rete.invia({ t: "join", nome: nome, omino: t.mioOmino(nome) }); },
        onMsg: function (m) { if (m && m.t === "vm" && m.vm) disegna(m.vm); },
        onChiuso: function () { t.esci(); },
        onErrore: function () {}
      });
    }
    SG.registra({ id: ID, nome: "Contatore", icona: "🔢", descrizione: "Gioco di prova: tutti toccano +1.", giocatoriMin: 1, giocatoriMax: 10,
      modi: [{ modo: "online", icona: "🔗", nome: "Online (prova)", sotto: "Apro io la stanza" }],
      riprende: OPZ.riprende !== false, riserva: !!OPZ.riserva, provaOnline: !!OPZ.online,   // (online: si lancia anche dalla Sala)
      regole: ["Gioco di prova: tutti toccano +1, l'host tocca 🏁 Fine."],
      avvia: function (t) { if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza); return host(t); } });
  }
  // il Contatore da mettere in un telefono (prima che parta l'app, anche dopo le ricariche): apriTel(n, { prima: contatore() })
  function contatore(opz, dopo) {
    var src = "(" + contatoreGioco.toString() + ")(" + JSON.stringify(opz || {}) + ");";
    return function (w) { w.eval(src); if (dopo) dopo(w); };
  }
  // l'host apre il Contatore online col percorso di prima (gioco=contatore → «🔗 Apri la stanza»): il codice
  async function apriContatore(w) {
    if (!await W.aspetta(function () { return W.clicca(w, /Apri la stanza/); }, 5000)) no("non trovo «🔗 Apri la stanza» del Contatore («" + T(w).slice(0, 80) + "»)");
    var C = await W.aspetta(function () { return codiceSaletta(w) || codiceTestata(w); }, 5000);
    if (!C) no("la stanza del Contatore non ha il codice");
    return C;
  }
  function tocca(w, sel) { var b = w && w.document.querySelector(sel); if (b) b.click(); return !!b; }
  // quante persone (non bot, non "via") sono nella foto
  function contaDentro(v) { return ((v && (v.giocatori || v.players || v.posti)) || []).filter(function (p) { return p && !p.via && !p.bot; }).length; }
  // i messaggi passati sullo "stato" di un codice (BR.storia) che contengono un testo (es. '"__esito"')
  function contaStoria(C, testo) { return (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/stato") >= 0 && x.p.indexOf(testo) >= 0; }).length; }
  // conta le partite date a un telefono (premiaPartita → SGNube.contaPartita): W.__partite[nome]
  function contaPartite(nome) {
    return function (w) {
      W.__partite = W.__partite || {};
      var c = w.SGNube && w.SGNube.contaPartita;
      if (c) w.SGNube.contaPartita = function () { W.__partite[nome] = (W.__partite[nome] || 0) + 1; return c.apply(this, arguments); };
    };
  }
  // ---- provaRipresa: l'host ricarica (o chiude l'app) a metà partita e la partita riprende da dove era ----
  // o = { gioco: "contatore" (id per il link), nomeTessera (percorso di prima: W.apriStanza) o apri: async w => codice,
  //       amici: ["Giulia", …], prima: fn(w) per tutti i telefoni (es. contatore()), arriva(vm): tutti dentro (di partenza:
  //       le persone nella foto = amici + 1), comincia: async (C, P) (di partenza «Comincia»), fase: "gioco" o fn(vm) = il
  //       punto in cui ricaricare, prepara: async (C, P) (le mosse prima della ricarica), come: "ricarica" | "chiudiApp",
  //       pausa: ms da spento prima di riaprire, controlla(vmPrima, vmDopo): true (o il motivo del NO), attesa: 10000 }
  // Controlla in 10 s: stesso codice (foto della sessione nuova con _r), fase non "lobby", controlla(...) vero, nessun amico
  // passato dalla saletta, la pillola «🔁 Paky è tornato: la partita riprende da dove era» sugli amici, «🔁 Partita ripresa!»
  // sull'host, nessun errore. Restituisce { C, P, w, prima, dopo, dt, pillAmici, pillHost }
  async function provaRipresa(o) {
    o = o || {};
    var amici = o.amici || ["Giulia"], w = {};
    var P = w.Paky = await W.apriTel("Paky", { x: 0, prima: o.prima || null, hash: o.hash !== undefined ? o.hash : (o.apri ? "gioco=" + o.gioco : null) });
    var C = o.apri ? await o.apri(P) : await W.apriStanza(P, o.nomeTessera);
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "gioco=" + o.gioco + "&stanza=" + C, x: 185 * (i + 1), prima: o.prima || null });
    var arriva = o.arriva || function (v) { return contaDentro(v) >= amici.length + 1; };
    if (!await W.aspetta(function () { return arriva(vm(C)); }, 10000)) no("non sono entrati in " + (amici.length + 1) + " (" + JSON.stringify(vm(C)).slice(0, 120) + ")");
    if (o.comincia) await o.comincia(C, P); else if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("l'host non ha «Comincia»");
    var faseOk = typeof o.fase === "function" ? o.fase : function (v) { return o.fase ? v.fase === o.fase : !!v.fase && v.fase !== "lobby"; };
    if (!await W.aspetta(function () { return faseOk(vm(C)); }, o.attesaFase || 20000)) no("non si arriva al punto della prova (fase " + vm(C).fase + ")");
    if (o.prepara) await o.prepara(C, P, w);
    await W.dorme(o.salva || 900);   // (la ripresa si salva al massimo ogni mezzo secondo)
    var prima = JSON.parse(JSON.stringify(vm(C))), sPrima = (W.statoStanza(C) || {})._s, t0 = Date.now();
    if (o.pausa) { W.spegni("Paky"); await W.dorme(o.pausa); }
    P = w.Paky = o.come === "chiudiApp" ? await W.chiudiApp("Paky", o.riapri || {}) : await W.ricarica("Paky", o.riapri || {});
    var pillAmici = {}, pillHost = "", saletta = {}, perche = "";
    var ok = await W.aspetta(function () {
      amici.forEach(function (n) {
        var f = W.finestra(n); if (!f) return;
        var p = pill(f); if (/tornato/.test(p)) pillAmici[n] = p;
        if (f.document.querySelector(".saletta-schermo")) saletta[n] = 1;
      });
      var ph = pill(W.finestra("Paky")); if (/ripresa/i.test(ph)) pillHost = ph;
      var s = W.statoStanza(C) || {}, v = vm(C);
      if (!s._s || s._s === sPrima) { perche = "nessuna foto nuova dell'host sul codice " + C; return false; }
      if (!s._r) { perche = "la foto nuova non dice che la partita riprende (_r)"; return false; }
      if (!v.fase || v.fase === "lobby") { perche = "la partita è tornata in saletta"; return false; }
      if (!arriva(v)) { perche = "non sono tutti di nuovo dentro (" + contaDentro(v) + ")"; return false; }
      var c = o.controlla ? o.controlla(prima, v) : true;
      if (c !== true) { perche = typeof c === "string" ? c : "la partita non è quella di prima"; return false; }
      if (!amici.every(function (n) { return pillAmici[n]; })) { perche = "non tutti gli amici leggono la pillola"; return false; }
      return !!pillHost;
    }, o.attesa || 10000);
    if (!ok) no("dopo la ricarica dell'host: " + (perche || "l'host non legge «🔁 Partita ripresa!»") + " (fase " + vm(C).fase + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    var ns = Object.keys(saletta); if (ns.length) no(ns.join(", ") + " è passato dalla saletta");
    amici.forEach(function (n) { if (!/riprende da dove era/.test(pillAmici[n])) no(n + " legge «" + pillAmici[n] + "» invece di «… la partita riprende da dove era»"); });
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return { C: C, P: P, w: w, prima: prima, dopo: vm(C), dt: dt, pillAmici: pillAmici, pillHost: pillHost };
  }

  // 501. Contatore: l'host ricarica a metà partita → stesso codice, stesso numero, gli amici non passano dalla saletta e
  //      leggono «🔁 Paky è tornato: la partita riprende da dove era»; poi si continua a giocare (Giulia +1)
  SCENARI[501] = { nome: "Contatore: l'host ricarica a metà, la partita riprende da dove era", fai: async function () {
    var r = await provaRipresa({ gioco: "contatore", prima: contatore(), apri: async function (P) { return apriContatore(P); },
      amici: ["Giulia", "Luca"], fase: "gioco",
      prepara: async function (C, P, w) {
        tocca(w.Giulia, ".ct-piu"); await W.aspetta(function () { return vm(C).n === 1; }, 3000);
        tocca(w.Luca, ".ct-piu"); await W.aspetta(function () { return vm(C).n === 2; }, 3000);
        tocca(P, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === 3; }, 3000)) no("i +1 non arrivano (n = " + vm(C).n + ")");
      },
      controlla: function (a, b) { return b.n === a.n ? true : "il numero era " + a.n + " e ora è " + b.n; } });
    var C = r.C, G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("dopo la ripresa non si torna a giocare (fase " + vm(C).fase + ")");
    tocca(G, ".ct-piu");
    if (!await W.aspetta(function () { return vm(C).n === 4; }, 4000)) no("dopo la ripresa il +1 di Giulia non arriva (n = " + vm(C).n + ")");
    var g = (vm(C).giocatori || []).filter(function (p) { return p.nome === "Giulia"; })[0];
    if (!g || g.punti !== 2) no("Giulia non ha ritrovato i suoi punti (" + JSON.stringify(g) + ")");
    return "ripresa in " + r.dt + " s con n = " + r.prima.n + " e tutti dentro; gli amici leggono «" + r.pillAmici.Giulia + "», l'host «" + r.pillHost + "»; si continua (n = 4)";
  } };

  // 502. Contatore: l'host chiude l'app, resta spento 10 s e la riapre → la partita riprende. Poi la ripresa «vecchia di
  //      21 minuti» (spostata a mano in sg-ripresa): ricaricando si torna in saletta come prima
  SCENARI[502] = { nome: "Contatore: app chiusa 10 s e riaperta → riprende; ripresa di 21 minuti fa → saletta", fai: async function () {
    var r = await provaRipresa({ gioco: "contatore", prima: contatore(), apri: async function (P) { return apriContatore(P); },
      amici: ["Giulia"], fase: "gioco", come: "chiudiApp", pausa: 10000, attesa: 12000,
      prepara: async function (C, P, w) { tocca(w.Giulia, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === 1; }, 3000)) no("il +1 non arriva"); },
      controlla: function (a, b) { return b.n === a.n ? true : "il numero era " + a.n + " e ora è " + b.n; } });
    var C = r.C;
    await W.dorme(900);
    // la ripresa diventa vecchia di 21 minuti: ricaricando la stanza si riapre (stesso codice) ma dalla saletta.
    // (si invecchia nel telefono nuovo, prima che parta l'app: la pagina che se ne va la risalva da sola, e fa bene)
    var mem = W.BR.mem.Paky.l, o = JSON.parse(mem["sg-ripresa"] || "null");
    if (!o || o.codice !== C) no("dopo la ripresa sg-ripresa non c'è (" + mem["sg-ripresa"] + ")");
    var s0 = (W.statoStanza(C) || {})._s;
    await W.ricarica("Paky", { prima: contatore(null, function () { var x = JSON.parse(mem["sg-ripresa"] || "null"); if (x) { x.t -= 21 * 60 * 1000; mem["sg-ripresa"] = JSON.stringify(x); } }) });
    var ok = await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._s && s._s !== s0 && vm(C).fase === "lobby" && W.finestra("Giulia").document.querySelector(".saletta-schermo") && contaDentro(vm(C)) === 2; }, 10000);
    if (!ok) no("con la ripresa vecchia non si torna in saletta con tutti (fase " + vm(C).fase + ", _r " + (W.statoStanza(C) || {})._r + ")");
    if ((W.statoStanza(C) || {})._r) no("con la ripresa vecchia la foto dice ancora _r");
    return "app chiusa 10 s: ripresa in " + r.dt + " s (n = " + r.prima.n + "); con la ripresa di 21 minuti fa tutti in saletta, stesso codice " + C;
  } };

  // 503. Contatore: l'host esce apposta (‹ Esci) → sg-ripresa e sg-mia-stanza sparite; ricaricando niente stanza (home)
  SCENARI[503] = { nome: "Contatore: l'host esce apposta, la ripresa si scorda", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, hash: "gioco=contatore", prima: contatore() }), C = await apriContatore(P);
    var G = await W.apriTel("Giulia", { hash: "gioco=contatore&stanza=" + C, x: 185, prima: contatore() });
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === 2; }, 8000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 5000)) no("non comincia");
    tocca(G, ".ct-piu"); await W.dorme(900);
    var mem = W.BR.mem.Paky.l;
    if (!mem["sg-ripresa"]) no("a metà partita sg-ripresa non c'è");
    tocca(P, ".ct-esci");
    if (!await W.aspetta(function () { return P.document.querySelector(".home"); }, 4000)) no("uscito, Paky non torna in home");
    await W.dorme(700);
    if (mem["sg-ripresa"]) no("uscito apposta, sg-ripresa c'è ancora");
    if (mem["sg-mia-stanza"]) no("uscito apposta, sg-mia-stanza c'è ancora");
    P = await W.ricarica("Paky");
    await W.dorme(1500);
    if (codiceSaletta(P) || P.document.querySelector(".ct-scena")) no("ricaricando la stanza si riapre");
    if (!P.document.querySelector(".home")) no("ricaricando Paky non è in home («" + T(P).slice(0, 60) + "»)");
    return "uscito apposta: niente ripresa né stanza; ricaricando, home";
  } };

  // 504. Contatore: l'host ricarica sulla classifica → la classifica resta, nessuna partita (XP) data di nuovo né
  //      "__esito" doppio (il gioco ridice il risultato dopo la ripresa: il core lo riconosce)
  SCENARI[504] = { nome: "Contatore: l'host ricarica sulla classifica, niente XP né esito doppi", fai: async function () {
    W.__partite = {};
    var conta = function (n) { var c = contaPartite(n); return contatore(null, c); };
    var P = await W.apriTel("Paky", { x: 0, hash: "gioco=contatore", prima: conta("Paky") }), C = await apriContatore(P);
    var G = await W.apriTel("Giulia", { hash: "gioco=contatore&stanza=" + C, x: 185, prima: conta("Giulia") });
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === 2; }, 8000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 5000)) no("non comincia");
    tocca(G, ".ct-piu"); await W.aspetta(function () { return vm(C).n === 1; }, 3000);
    tocca(P, ".ct-fine");
    if (!await W.aspetta(function () { return vm(C).fase === "fine" && W.__partite.Paky === 1 && W.__partite.Giulia === 1; }, 5000))
      no("a fine partita le partite date non sono 1 e 1 (" + JSON.stringify(W.__partite) + ", fase " + vm(C).fase + ")");
    var e1 = contaStoria(C, '"__esito"');
    if (e1 !== 1) no("a fine partita gli __esito sono " + e1);
    await W.dorme(900);
    var s0 = (W.statoStanza(C) || {})._s;
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._s && s._s !== s0 && s._r && vm(C).fase === "fine" && P.document.querySelector(".ct-classifica"); }, 10000))
      no("ricaricando sulla classifica la classifica non torna (fase " + vm(C).fase + ")");
    await W.dorme(2500);
    if (W.__partite.Paky !== 1 || W.__partite.Giulia !== 1) no("dopo la ricarica partite date di nuovo: " + JSON.stringify(W.__partite));
    var e2 = contaStoria(C, '"__esito"'); if (e2 !== 1) no("dopo la ricarica gli __esito sono " + e2);
    if (W.finestra("Giulia").document.querySelector(".saletta-schermo")) no("Giulia è tornata in saletta");
    return "classifica ripresa, partite date 1 e 1, un solo __esito";
  } };

  // 505. Contatore con l'host SENZA profilo (la sessione c'è ma il profilo no, come in 37b): ricarica a metà → la stanza si
  //      riapre col nome di prima (Paky) e la partita riprende
  SCENARI[505] = { nome: "Contatore: host senza profilo che ricarica, la partita riprende col suo nome", fai: async function () {
    var senza = function (w) { w.SGNube.utente = function () { return { uid: "finto-senza" }; }; };
    var r = await provaRipresa({ gioco: "contatore", prima: contatore(), apri: async function (P) { return apriContatore(P); },
      amici: ["Giulia"], fase: "gioco",
      prepara: async function (C, P, w) {
        tocca(w.Giulia, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === 1; }, 3000)) no("il +1 non arriva");
        // da qui il telefono di Paky non ha più il profilo (né quello ricordato)
        W.BR.mem.Paky.fp = null; delete W.BR.mem.Paky.l["sg-ultimo-profilo"];
      },
      riapri: { prima: contatore(null, senza) },
      controlla: function (a, b) {
        if (b.n !== a.n) return "il numero era " + a.n + " e ora è " + b.n;
        var h = (b.giocatori || [])[0]; return h && h.nome === "Paky" ? true : "l'host si chiama «" + (h && h.nome) + "»";
      } });
    if (W.finestra("Paky").SGNube.profilo()) no("il telefono di Paky ha ancora il profilo");
    return "senza profilo: stanza " + r.C + " riaperta e partita ripresa in " + r.dt + " s, host «Paky»";
  } };

  // 506. Un gioco che NON riprende (Contatore con riprende: false): l'host ricarica a metà → tutti in saletta come prima
  //      (stesso codice, la foto non dice _r, gli amici rientrano da soli)
  SCENARI[506] = { nome: "Gioco che non riprende: l'host ricarica a metà, tutti in saletta", fai: async function () {
    var pr = contatore({ riprende: false });
    var P = await W.apriTel("Paky", { x: 0, hash: "gioco=contatore", prima: pr }), C = await apriContatore(P);
    var G = await W.apriTel("Giulia", { hash: "gioco=contatore&stanza=" + C, x: 185, prima: pr });
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === 2; }, 8000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 5000)) no("non comincia");
    tocca(G, ".ct-piu"); await W.dorme(900);
    if (W.BR.mem.Paky.l["sg-ripresa"]) no("un gioco che non riprende ha salvato sg-ripresa");
    var s0 = (W.statoStanza(C) || {})._s, pg = "";
    P = await W.ricarica("Paky");
    var ok = await W.aspetta(function () {
      var p = pill(W.finestra("Giulia")); if (/tornato/.test(p)) pg = p;
      var s = W.statoStanza(C) || {};
      return s._s && s._s !== s0 && vm(C).fase === "lobby" && contaDentro(vm(C)) === 2 && W.finestra("Giulia").document.querySelector(".saletta-schermo") && dentro(W.finestra("Giulia"));
    }, 10000);
    if (!ok) no("dopo la ricarica non sono tutti in saletta (fase " + vm(C).fase + ", dentro " + contaDentro(vm(C)) + ")");
    if ((W.statoStanza(C) || {})._r) no("la foto dice _r (riprende) in un gioco che non riprende");
    if (!/saletta/.test(pg)) no("Giulia legge «" + pg + "» invece di «… si riparte dalla saletta»");
    return "stesso codice " + C + ", tutti in saletta; Giulia legge «" + pg + "»";
  } };

  // =========================================================
  //  PASSO 5 (p5-b): l'host di riserva nel core (Contatore con riserva: true, 4 telefoni)
  // =========================================================
  // Paky apre il Contatore, gli amici entrano UNO ALLA VOLTA (così i vice sono sicuri: i primi due arrivati), si comincia,
  // due +1 e un attimo per la copia ai vice. o = { amici, gioco: opzioni del Contatore (di partenza { riserva: true }),
  // opz: { Giulia: { orologio: -120000 } } (opzioni di apriTel per uno) }. Restituisce { C, w, ids, amici, n0 }
  async function apriRiserva(o) {
    o = o || {};
    var amici = o.amici || ["Giulia", "Luca", "Sara"], pr = contatore(o.gioco || { riserva: true }), w = {}, ids = {};
    w.Paky = await W.apriTel("Paky", { x: 0, hash: "gioco=contatore", prima: pr });
    var C = await apriContatore(w.Paky);
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i], quanti = i + 2;
      w[n] = await W.apriTel(n, Object.assign({ hash: "gioco=contatore&stanza=" + C, x: 185 * (i + 1), prima: pr }, (o.opz && o.opz[n]) || {}));
      if (!await W.aspetta(function () { return contaDentro(vm(C)) >= quanti; }, 8000)) no(n + " non entra");
      ids[n] = mioId(n);
    }
    W.clicca(w.Paky, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 5000)) no("non comincia");
    tocca(w[amici[0]], ".ct-piu");
    if (!await W.aspetta(function () { return vm(C).n === 1; }, 3000)) no("il +1 non arriva");
    tocca(w[amici[1] || amici[0]], ".ct-piu");
    if (!await W.aspetta(function () { return vm(C).n === 2; }, 3000)) no("il secondo +1 non arriva");
    await W.dorme(1500);   // (la copia ai vice: al massimo una al secondo)
    return { C: C, w: w, ids: ids, amici: amici, n0: vm(C).n };
  }
  // il telefono si spegne davvero (batteria): il broker manda il testamento e anche i collegamenti che il telefono prova ad
  // aprire dopo (l'altro ufficio postale) restano fermi. torna(nome) = si riaccende (l'app era solo in secondo piano)
  function muore(nome) { W.congela(nome); W.spegni(nome); }
  function torna(nome) { W.scongela(nome); W.riaccendi(nome); }
  // chi tiene la partita adesso (dalla foto trattenuta): { g, h }
  function chiTiene(C) { var s = W.statoStanza(C) || {}; return { g: s._g, h: s._h }; }
  // le foto della partita passate dal momento t0 (non i testamenti): [{ da, g, h }]
  function fotoDa(C, t0) {
    return (W.BR.storia || []).filter(function (x) { return x.ms >= t0 && x.topic.indexOf("/" + C + "/stato") >= 0 && x.da.indexOf("✝") < 0 && x.p.indexOf('"_h"') >= 0; })
      .map(function (x) { var m = {}; try { m = JSON.parse(x.p); } catch (e) {} return { da: x.da, g: m._g, h: m._h }; });
  }
  // qualcuno legge una pillola (es. 👑) mentre si aspetta ms? "" = nessuno, se no "chi: «pillola»"
  async function senza(nomi, re, ms) {
    var visto = "", fine = Date.now() + ms;
    while (Date.now() < fine) {
      nomi.forEach(function (n) { var f = W.finestra(n); var p = f ? pill(f) : ""; if (re.test(p)) visto = n + ": «" + p + "»"; });
      if (visto) return visto;
      await W.dorme(200);
    }
    return "";
  }
  // aspetta (al massimo ms) che ognuno legga la pillola giusta: { nome: testo }
  async function pilloleDi(nomi, re, ms) {
    var visti = {};
    await W.aspetta(function () { nomi.forEach(function (n) { var f = W.finestra(n); var p = f ? pill(f) : ""; if (re.test(p)) visti[n] = p; }); return nomi.every(function (n) { return visti[n]; }); }, ms);
    return visti;
  }
  function chiusaDa(nomi) { return nomi.filter(function (n) { var f = W.finestra(n); return f && /La stanza è chiusa/.test(T(f)); }); }

  // 507. L'host si spegne e non torna: entro 8 s Giulia (prima vice) tiene la partita col numero di prima (_g 2), legge
  //      «👑 Paky è sparito: la partita la porti avanti tu»; Luca e Sara leggono «👑 Ora la partita la tiene Giulia» e
  //      continuano a giocare; nessuna «stanza chiusa»
  SCENARI[507] = { nome: "Riserva: l'host si spegne, Giulia porta avanti la partita", fai: async function () {
    var r = await apriRiserva(), C = r.C, t0 = Date.now();
    muore("Paky");
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 8000))
      no("dopo 8 s la partita non la tiene Giulia (" + JSON.stringify(chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (vm(C).n !== r.n0) no("il numero era " + r.n0 + " e ora è " + vm(C).n);
    var pg = await pilloleDi(["Giulia"], /porti avanti tu/, 2000), pa = await pilloleDi(["Luca", "Sara"], /Ora la partita la tiene Giulia/, 3000);
    if (!pg.Giulia) no("Giulia non legge «… la porti avanti tu» («" + pill(r.w.Giulia) + "»)");
    if (!pa.Luca || !pa.Sara) no("Luca e Sara non leggono «Ora la partita la tiene Giulia» (" + JSON.stringify(pa) + ")");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && contaDentro(vm(C)) === 3; }, 8000)) no("non si torna a giocare in tre (fase " + vm(C).fase + ", dentro " + contaDentro(vm(C)) + ")");
    tocca(r.w.Luca, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === r.n0 + 1; }, 3000)) no("il +1 di Luca non arriva");
    tocca(r.w.Sara, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === r.n0 + 2; }, 3000)) no("il +1 di Sara non arriva");
    var ch = chiusaDa(r.amici); if (ch.length) no(ch.join(", ") + " legge «La stanza è chiusa»");
    return "Giulia tiene la partita in " + dt + " s (_g 2, n = " + r.n0 + "); «" + pg.Giulia + "» / «" + pa.Luca + "»; Luca e Sara giocano (n = " + vm(C).n + ")";
  } };

  // 508. L'host si spegne e anche Giulia (prima vice) sparisce subito: la partita la prende Luca (secondo vice) entro 14 s
  SCENARI[508] = { nome: "Riserva: spariscono l'host e la prima vice, la prende il secondo", fai: async function () {
    var r = await apriRiserva(), C = r.C, t0 = Date.now();
    muore("Paky"); muore("Giulia");
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 2 && c.h === r.ids.Luca; }, 14000))
      no("dopo 14 s la partita non la tiene Luca (" + JSON.stringify(chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (vm(C).n !== r.n0) no("il numero era " + r.n0 + " e ora è " + vm(C).n);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && contaDentro(vm(C)) === 2; }, 8000)) no("Luca e Sara non tornano a giocare (fase " + vm(C).fase + ")");
    tocca(r.w.Sara, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === r.n0 + 1; }, 3000)) no("il +1 di Sara non arriva");
    return "Luca tiene la partita in " + dt + " s (_g 2, n = " + r.n0 + "), Sara gioca";
  } };

  // 509. L'host torna dopo il subentro (l'app era solo in secondo piano: riaccendi): legge «👋 Bentornato! Ora la partita la
  //      tiene Giulia: rientri come giocatore», rientra al suo posto e non ci sono mai due host (dopo 3 s tutte le foto
  //      sono di Giulia)
  SCENARI[509] = { nome: "Riserva: l'host torna dopo il subentro e rientra come giocatore", fai: async function () {
    var r = await apriRiserva(), C = r.C;
    muore("Paky");
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 8000)) no("Giulia non prende la partita");
    await W.dorme(1500);
    torna("Paky");
    var pp = await pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 6000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Giulia…» («" + pill(W.finestra("Paky")) + "»)");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (p) { return p.id === "host" && !p.via; }); }, 8000)) no("Paky non rientra al suo posto");
    var t1 = Date.now(); await W.dorme(3000);
    var f = fotoDa(C, t1), altri = f.filter(function (x) { return x.da !== "Giulia" || x.h !== r.ids.Giulia; });
    if (altri.length) no("dopo il rientro ci sono foto di altri: " + JSON.stringify(altri.slice(0, 3)));
    var c = chiTiene(C); if (c.g !== 2 || c.h !== r.ids.Giulia) no("la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    tocca(W.finestra("Paky"), ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === r.n0 + 1; }, 4000)) no("il +1 di Paky (da giocatore) non arriva");
    return "Paky legge «" + pp.Paky + "», gioca da giocatore; " + f.length + " foto in 3 s, tutte di Giulia";
  } };

  // 510. L'host ricarica la pagina dopo il subentro (chiude e riapre l'app): guarda prima di riaprire, trova la partita di
  //      Giulia e rientra come giocatore (niente seconda stanza sullo stesso codice)
  SCENARI[510] = { nome: "Riserva: l'host riapre l'app dopo il subentro e rientra come giocatore", fai: async function () {
    var r = await apriRiserva(), C = r.C;
    muore("Paky");
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 8000)) no("Giulia non prende la partita");
    await W.dorme(1000);
    var t1 = Date.now();
    var P = await W.chiudiApp("Paky");
    var pp = await pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 8000);
    if (!pp.Paky) no("riaprendo Paky non legge «👋 Bentornato…» («" + pill(W.finestra("Paky")) + "», «" + T(W.finestra("Paky")).slice(0, 60) + "»)");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (p) { return p.id === "host" && !p.via; }); }, 8000)) no("Paky non rientra al suo posto");
    var mie = fotoDa(C, t1).filter(function (x) { return x.da === "Paky"; });
    if (mie.length) no("riaprendo Paky ha pubblicato " + mie.length + " foto sulla stanza di Giulia");
    var c = chiTiene(C); if (c.g !== 2 || c.h !== r.ids.Giulia) no("la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    if (W.BR.mem.Paky.l["sg-ripresa"]) no("Paky ha ancora sg-ripresa");
    return "Paky legge «" + pp.Paky + "», nessuna foto sua sulla stanza, gioca da giocatore";
  } };

  // 511. L'host ricarica PRIMA dei 6 s: la riprende lui (p5-a), Giulia non subentra (_g resta 1, nessuna pillola 👑)
  SCENARI[511] = { nome: "Riserva: l'host ricarica subito, nessun subentro", fai: async function () {
    var r = await apriRiserva(), C = r.C, t0 = Date.now();
    await W.ricarica("Paky");
    var visto = await senza(["Paky"].concat(r.amici), /👑/, 10000);
    if (visto) no("pillola 👑: " + visto);
    var c = chiTiene(C); if (c.g !== 1 || c.h !== "host") no("dopo la ricarica la partita la tiene " + JSON.stringify(c));
    var altri = fotoDa(C, t0).filter(function (x) { return x.da !== "Paky"; });
    if (altri.length) no("foto di altri dopo la ricarica: " + JSON.stringify(altri.slice(0, 3)));
    if (vm(C).n !== r.n0 || vm(C).fase !== "gioco") no("la partita non è quella di prima (n " + vm(C).n + ", fase " + vm(C).fase + ")");
    return "ripresa dall'host, _g 1, nessun 👑 in 10 s";
  } };

  // 512. La rete dell'host salta per 4 s (inciampa): nessun subentro
  SCENARI[512] = { nome: "Riserva: rete dell'host giù 4 s, nessun subentro", fai: async function () {
    var r = await apriRiserva(), C = r.C, t0 = Date.now();
    W.inciampa("Paky", 4000);
    var visto = await senza(["Paky"].concat(r.amici), /👑/, 11000);
    if (visto) no("pillola 👑: " + visto);
    var c = chiTiene(C); if (c.g !== 1 || c.h !== "host") no("la partita la tiene " + JSON.stringify(c));
    var altri = fotoDa(C, t0).filter(function (x) { return x.da !== "Paky"; });
    if (altri.length) no("foto di altri: " + JSON.stringify(altri.slice(0, 3)));
    tocca(r.w.Sara, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === r.n0 + 1; }, 4000)) no("dopo il buco il +1 di Sara non arriva");
    return "4 s di rete giù: _g 1, nessun 👑, si gioca";
  } };

  // 513. I due vice partono insieme (stesso tempo d'attesa): dopo 3 s resta un host solo (a pari _g l'id più piccolo)
  SCENARI[513] = { nome: "Riserva: due vice insieme, resta un host solo", fai: async function () {
    var r = await apriRiserva(), C = r.C;
    W.finestra("Giulia").__sgSubentroMs = 6000; W.finestra("Luca").__sgSubentroMs = 6000;
    var vince = r.ids.Giulia < r.ids.Luca ? "Giulia" : "Luca", perde = vince === "Giulia" ? "Luca" : "Giulia", t0 = Date.now();
    muore("Paky");
    if (!await W.aspetta(function () { return chiTiene(C).g === 2; }, 9000)) no("nessuno prende la partita");
    await W.dorme(2000);
    // (la gara c'è stata davvero: tutti e due hanno pubblicato la loro foto con _g 2)
    var gara = {}; fotoDa(C, t0).forEach(function (x) { if (x.g === 2) gara[x.da] = 1; });
    if (!gara.Giulia || !gara.Luca) no("non c'è stata la gara: foto con _g 2 solo di " + Object.keys(gara).join(", "));
    var t1 = Date.now(); await W.dorme(3000);
    var f = fotoDa(C, t1), da = {}; f.forEach(function (x) { da[x.da + "/" + x.h] = 1; });
    if (Object.keys(da).length > 1) no("dopo 3 s ci sono due host: " + Object.keys(da).join(", "));
    var c = chiTiene(C); if (c.g !== 2 || c.h !== r.ids[vince]) no("la partita la tiene " + JSON.stringify(c) + " invece di " + vince);
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === 3 && vm(C).fase === "gioco"; }, 8000)) no(perde + " e Sara non tornano a giocare");
    tocca(r.w[perde], ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === r.n0 + 1; }, 4000)) no("il +1 di " + perde + " non arriva");
    return "partiti insieme: resta " + vince + " (id più piccolo), " + perde + " gioca; " + f.length + " foto in 3 s da un host solo";
  } };

  // 513b. La prima vice ha l'orologio 2 minuti indietro (la sua sessione è "più piccola"): subentra lo stesso, gli altri la
  //       seguono (seguiHost) e quando sparisce anche lei il suo testamento fa partire il secondo subentro (_g 3)
  SCENARI["513b"] = { nome: "Riserva: vice con l'orologio indietro, poi sparisce anche lei", fai: async function () {
    var r = await apriRiserva({ opz: { Giulia: { orologio: -120000 } } }), C = r.C;
    muore("Paky");
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 9000)) no("Giulia (orologio indietro) non prende la partita (" + JSON.stringify(chiTiene(C)) + ")");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && contaDentro(vm(C)) === 3; }, 8000)) no("Luca e Sara non tornano a giocare con Giulia");
    // (la sessione di Giulia è "più piccola" di quella di Paky: Luca e Sara la seguono lo stesso)
    var sG = (W.statoStanza(C) || {})._s;
    ["Luca", "Sara"].forEach(function (n) { var st = W.reteDi(n) && W.reteDi(n).stato(); if (!st || st.sessione !== sG) no(n + " non segue la sessione di Giulia (" + (st && st.sessione) + " invece di " + sG + ")"); });
    tocca(r.w.Luca, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === r.n0 + 1; }, 4000)) no("il +1 di Luca non arriva a Giulia");
    await W.dorme(2000);   // (la copia di Giulia ai suoi vice)
    var t0 = Date.now();
    muore("Giulia");
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 3 && (c.h === r.ids.Luca || c.h === r.ids.Sara); }, 14000))
      no("sparita Giulia, nessuno prende la partita (" + JSON.stringify(chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1), chi = chiTiene(C).h === r.ids.Luca ? "Luca" : "Sara";
    if (vm(C).n !== r.n0 + 1) no("il numero era " + (r.n0 + 1) + " e ora è " + vm(C).n);
    return "Giulia (2 minuti indietro) subentra; sparita lei, " + chi + " tiene la partita in " + dt + " s (_g 3, n = " + vm(C).n + ")";
  } };

  // 514. Un gioco SENZA riserva (Contatore con riprende ma senza riserva): l'host si spegne → nessun subentro, gli amici
  //      aspettano come oggi (nessuna foto di altri, nessun 👑, niente «stanza chiusa» prima dei 2 minuti)
  SCENARI[514] = { nome: "Senza riserva: l'host si spegne, nessuno subentra", fai: async function () {
    var r = await apriRiserva({ gioco: { riserva: false } }), C = r.C, t0 = Date.now();
    muore("Paky");
    var visto = await senza(r.amici, /👑/, 14000);
    if (visto) no("pillola 👑: " + visto);
    var altri = fotoDa(C, t0); if (altri.length) no("foto nuove dopo lo spegnimento: " + JSON.stringify(altri.slice(0, 3)));
    var c = chiTiene(C); if (c.g != null) no("la stanza ha _g " + c.g);
    if (W.statoStanza(C).t !== "__hostgone") no("la stanza non dice «host sparito»");
    var ch = chiusaDa(r.amici); if (ch.length) no(ch.join(", ") + " legge già «La stanza è chiusa»");
    if (!r.amici.every(function (n) { return W.finestra(n).document.querySelector(".ct-scena"); })) no("qualcuno non è più sul tavolo");
    return "nessun subentro in 14 s, la stanza dice «host sparito», gli amici aspettano sul tavolo";
  } };

  // 514b. Dentro la Sala (5-4): Paky (host della Sala e del Contatore) sparisce per 10 s → Giulia porta avanti il gioco dopo
  //       6 s; Paky torna prima che la Sala passi a un altro: tiene la Sala, rientra nel gioco da giocatore («👋 Bentornato…»)
  //       senza chiuderlo agli altri, gioca, e quando Giulia chiude con 🏁 la Classifica della serata di Paky conta la partita
  SCENARI["514b"] = { nome: "Riserva nella Sala: l'host della Sala torna e rientra nel gioco da giocatore", fai: async function () {
    var pr = contatore({ riserva: true, online: true }), w = {};
    w.Paky = await W.apriTel("Paky", { x: 0, salaSempre: true, prima: pr });
    var S = await apriSalaNuova("Paky");
    for (var i = 0, am = ["Giulia", "Luca"]; i < am.length; i++) {
      var quanti = i + 2;
      w[am[i]] = await W.apriTel(am[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, prima: pr });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === quanti; }, 10000)) no(am[i] + " non entra nella Sala");
    }
    var C = await lanciaDallaSala("Paky", S, "Contatore");
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === 3; }, 10000)) no("nel Contatore della Sala non sono in 3 (" + contaDentro(vm(C)) + ")");
    var ids = { Giulia: mioId("Giulia"), Luca: mioId("Luca") };
    W.clicca(w.Paky, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il Contatore non comincia");
    tocca(w.Giulia, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === 1; }, 3000)) no("il +1 non arriva");
    await W.dorme(1500);
    var n0 = vm(C).n, punti0 = ((W.statoStanza(S) || {}).torneo || {}).n || 0;
    muore("Paky");
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 2 && c.h === ids.Giulia; }, 9000)) no("Giulia non prende il gioco (" + JSON.stringify(chiTiene(C)) + ")");
    await W.dorme(2500);
    torna("Paky");
    var pp = await pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 6000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato…» («" + pill(W.finestra("Paky")) + "»)");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (p) { return p.id === "host" && !p.via; }); }, 8000)) no("Paky non rientra nel gioco");
    if ((W.statoStanza(S) || {}).gen > 1) no("la Sala è passata a un altro (gen " + (W.statoStanza(S) || {}).gen + ")");
    if ((W.statoStanza(S) || {}).stanza !== C) no("la Sala non dice più il gioco in corso (" + (W.statoStanza(S) || {}).stanza + ")");
    if (vm(C).n !== n0) no("il numero era " + n0 + " e ora è " + vm(C).n);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("non si torna a giocare");
    tocca(W.finestra("Paky"), ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === n0 + 1; }, 4000)) no("il +1 di Paky da giocatore non arriva");
    tocca(w.Luca, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === n0 + 2; }, 4000)) no("il +1 di Luca non arriva");
    tocca(w.Giulia, ".ct-fine");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("Giulia non chiude la partita");
    if (!await W.aspetta(function () { return (((W.statoStanza(S) || {}).torneo || {}).n || 0) === punti0 + 1; }, 5000))
      no("la Classifica della serata non conta la partita (" + JSON.stringify((W.statoStanza(S) || {}).torneo || null).slice(0, 120) + ")");
    var ch = chiusaDa(["Paky", "Giulia", "Luca"]); if (ch.length) no(ch.join(", ") + " legge «La stanza è chiusa»");
    return "Giulia porta avanti il gioco della Sala, Paky torna (Sala sua, gen 1) e gioca da giocatore; la partita conta nella serata";
  } };

  // 514c. Dentro la Sala, Paky sparisce e non torna: dopo 6 s Giulia porta avanti il gioco, dopo 20 s prende anche la Sala
  //       (gen 2) SENZA buttare il gioco (haRiserva: il gioco non era più sul telefono che se n'è andato); Luca resta nel
  //       gioco, e quando Giulia chiude con 🏁 la partita conta nella Classifica della serata di Giulia
  SCENARI["514c"] = { nome: "Riserva nella Sala: l'host sparisce, Giulia tiene il gioco e poi la Sala", fai: async function () {
    var pr = contatore({ riserva: true, online: true }), w = {};
    w.Paky = await W.apriTel("Paky", { x: 0, salaSempre: true, prima: pr });
    var S = await apriSalaNuova("Paky");
    for (var i = 0, am = ["Giulia", "Luca"]; i < am.length; i++) {
      var quanti = i + 2;
      w[am[i]] = await W.apriTel(am[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, prima: pr });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === quanti; }, 10000)) no(am[i] + " non entra nella Sala");
    }
    var C = await lanciaDallaSala("Paky", S, "Contatore");
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === 3; }, 10000)) no("nel Contatore della Sala non sono in 3");
    var idG = mioId("Giulia");
    W.clicca(w.Paky, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il Contatore non comincia");
    tocca(w.Luca, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === 1; }, 3000)) no("il +1 non arriva");
    await W.dorme(1500);
    muore("Paky");
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 2 && c.h === idG; }, 9000)) no("Giulia non prende il gioco");
    if (!await W.aspetta(function () { var s = W.statoStanza(S) || {}; return s.gen === 2; }, 30000)) no("la Sala non passa a Giulia (gen " + (W.statoStanza(S) || {}).gen + ")");
    var s2 = W.statoStanza(S) || {};
    if (s2.stanza !== C || s2.gioco !== "contatore") no("la Sala di Giulia ha perso il gioco (stanza " + s2.stanza + ")");
    if (!w.Giulia.document.querySelector(".ct-scena") || !w.Luca.document.querySelector(".ct-scena")) no("Giulia o Luca non sono più nel gioco");
    var c2 = chiTiene(C); if (c2.g !== 2 || c2.h !== idG) no("il gioco non lo tiene più Giulia (" + JSON.stringify(c2) + ")");
    tocca(w.Luca, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === 2; }, 4000)) no("dopo il cambio della Sala il +1 di Luca non arriva");
    var p0 = (s2.torneo || {}).n || 0;
    tocca(w.Giulia, ".ct-fine");
    if (!await W.aspetta(function () { return (((W.statoStanza(S) || {}).torneo || {}).n || 0) === p0 + 1; }, 6000)) no("la partita non conta nella serata di Giulia");
    return "Giulia tiene il gioco (6 s) e poi la Sala (gen 2) col gioco dentro; Luca gioca; la partita conta nella serata";
  } };

  // 514d. La pausa (5-4): Paky esce un attimo dall'app (pagina nascosta: «__rp») e poi il telefono sparisce → i vice aspettano
  //       60 s invece di 6 (era andato a mandare il link): a 15 s nessun subentro, entro 64 s Giulia porta avanti la partita
  SCENARI["514d"] = { nome: "Riserva: l'host era uscito un attimo dall'app, il vice aspetta 60 s", fai: async function () {
    var r = await apriRiserva(), C = r.C, P = r.w.Paky;
    Object.defineProperty(P.document, "hidden", { configurable: true, get: function () { return true; } });
    P.document.dispatchEvent(new P.Event("visibilitychange"));
    await W.dorme(500);
    var t0 = Date.now();
    muore("Paky");
    var visto = await senza(r.amici, /👑/, 15000);
    if (visto) no("subentro prima dei 60 s: " + visto);
    if (chiTiene(C).g != null) no("a 15 s la stanza la tiene " + JSON.stringify(chiTiene(C)));
    if (!await W.aspetta(function () { var c = chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 50000)) no("dopo 64 s Giulia non prende la partita");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (+dt < 59) no("Giulia ha preso la partita dopo " + dt + " s (meno di 60)");
    return "host in pausa: nessun subentro a 15 s, Giulia porta avanti la partita dopo " + dt + " s";
  } };

  // =========================================================
  //  PASSO 5 (p5-c): la ripresa nella Sala, nel torneo a eliminazione e nel duello
  // =========================================================
  // una mossa a Tris di chi è di turno (nomi: chi ha X e chi ha O); true se la mossa è arrivata
  async function mossaTris(C, x, o) {
    var v = vm(C), w = W.finestra(v.turno === "X" ? x : o), n0 = (v.board || []).filter(Boolean).length;
    if (v.fase !== "gioco" || !w) return false;
    var k = (v.board || []).indexOf(null);
    var ok = await W.aspetta(function () { var c = w.document.querySelectorAll(".tr-cella")[k]; if (c && !c.disabled) { c.click(); return true; } return false; }, 4000);
    return ok && !!await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length > n0; }, 4000);
  }
  // chi è passato da una schermata (es. la Sala o la saletta) mentre si aspetta: spia accesa ogni 100 ms. fine() → [nomi]
  function spiaSchermo(nomi, sel) {
    var visti = {}, t = setInterval(function () { nomi.forEach(function (n) { var f = W.finestra(n); if (f && f.document.querySelector(sel)) visti[n] = 1; }); }, 100);
    return { fine: function () { clearInterval(t); return Object.keys(visti); } };
  }
  // le foto della Sala S passate da t0 con un'altra sessione che NON dicono il gioco (la Sala riaperta "senza gioco")
  function salaSenzaGioco(S, t0, sPrima) {
    return (W.BR.storia || []).filter(function (x) {
      if (x.ms < t0 || x.topic.indexOf("/" + S + "/stato") < 0 || x.da.indexOf("✝") >= 0) return false;
      var m = {}; try { m = JSON.parse(x.p); } catch (e) {}
      return m.t === "sala" && m._s && m._s !== sPrima && !m.gioco;
    }).length;
  }

  // 515. Nella Sala con 3 amici, il Contatore lanciato dalla Sala: Paky (host della Sala e del gioco) ricarica a metà → la
  //      Sala si riapre con lo stesso codice e già col gioco (mai una foto «senza gioco»), il gioco riprende nella stessa
  //      stanza col numero di prima; gli amici non passano né dalla Sala né dalla saletta e leggono «riprende da dove era».
  //      Si finisce: la partita conta UNA volta nella Classifica della serata, anche se Paky ricarica sulla classifica.
  //      «🎮 Cambia gioco» porta tutti nella Sala
  SCENARI[515] = { nome: "Sala: l'host ricarica a metà gioco, Sala e gioco riprendono con gli stessi codici", fai: async function () {
    var pr = contatore({ online: true }), w = {}, am = ["Giulia", "Luca", "Sara"];
    w.Paky = await W.apriTel("Paky", { x: 0, salaSempre: true, prima: pr });
    var S = await apriSalaNuova("Paky");
    for (var i = 0; i < am.length; i++) {
      var quanti = i + 2;
      w[am[i]] = await W.apriTel(am[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, prima: pr });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === quanti; }, 10000)) no(am[i] + " non entra nella Sala");
    }
    var C = await lanciaDallaSala("Paky", S, "Contatore");
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === 4; }, 10000)) no("nel Contatore della Sala non sono in 4 (" + contaDentro(vm(C)) + ")");
    W.clicca(w.Paky, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il Contatore non comincia");
    for (var j = 0; j < am.length; j++) { var nn = j + 1; tocca(w[am[j]], ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === nn; }, 3000)) no("il +1 di " + am[j] + " non arriva"); }
    await W.dorme(1200);   // (la ripresa si salva al massimo ogni mezzo secondo)
    var sS0 = (W.statoStanza(S) || {})._s, sC0 = (W.statoStanza(C) || {})._s, n0 = vm(C).n, t0 = Date.now(), p0 = ((vm(S).torneo) || {}).n || 0;
    var spia = spiaSchermo(am, ".saletta-schermo");
    w.Paky = await W.ricarica("Paky");
    var perche = "";
    var ok = await W.aspetta(function () {
      var s = W.statoStanza(S) || {}, c = W.statoStanza(C) || {}, v = vm(C);
      if (!s._s || s._s === sS0) { perche = "la Sala non si è riaperta"; return false; }
      if (s.stanza !== C || s.gioco !== "contatore") { perche = "la Sala riaperta non dice il gioco (" + s.gioco + " " + s.stanza + ")"; return false; }
      if (!c._s || c._s === sC0 || !c._r) { perche = "il gioco non si è riaperto con la ripresa (_r)"; return false; }
      if (!v.fase || v.fase === "lobby") { perche = "il gioco è tornato in saletta"; return false; }
      if (contaDentro(v) !== 4) { perche = "nel gioco non sono di nuovo in 4 (" + contaDentro(v) + ")"; return false; }
      return true;
    }, 12000);
    if (!ok) no("dopo la ricarica di Paky: " + perche);
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (vm(C).n !== n0) no("il numero era " + n0 + " e ora è " + vm(C).n);
    var pa = await pilloleDi(am, /riprende da dove era/, 5000);
    var manca = am.filter(function (n) { return !pa[n]; });
    if (manca.length) no(manca.join(", ") + " non legge «riprende da dove era» («" + pill(W.finestra(manca[0])) + "»)");
    var ph = await pilloleDi(["Paky"], /Partita ripresa/, 3000); if (!ph.Paky) no("Paky non legge «🔁 Partita ripresa!» («" + pill(W.finestra("Paky")) + "»)");
    await W.dorme(800);
    var passati = spia.fine(); if (passati.length) no(passati.join(", ") + " è passato dalla Sala o dalla saletta");
    var vuote = salaSenzaGioco(S, t0, sS0); if (vuote) no("la Sala riaperta ha mandato " + vuote + " foto senza il gioco");
    if (/si riparte dalla Sala/.test(am.map(function (n) { return pill(W.finestra(n)); }).join(" "))) no("un amico legge «si riparte dalla Sala»");
    // si continua a giocare, poi si chiude: la partita conta una volta
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("dopo la ripresa non si torna a giocare");
    tocca(w.Giulia, ".ct-piu"); if (!await W.aspetta(function () { return vm(C).n === n0 + 1; }, 4000)) no("dopo la ripresa il +1 di Giulia non arriva");
    tocca(W.finestra("Paky"), ".ct-fine");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("Paky non chiude la partita");
    if (!await W.aspetta(function () { return (((vm(S).torneo) || {}).n || 0) === p0 + 1; }, 5000)) no("la partita non conta nella Classifica della serata");
    // Paky ricarica sulla classifica: la classifica resta, niente punti doppi
    await W.dorme(1200);
    var sS1 = (W.statoStanza(S) || {})._s, sC1 = (W.statoStanza(C) || {})._s;
    w.Paky = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(S) || {}, c = W.statoStanza(C) || {}; return s._s && s._s !== sS1 && s.stanza === C && c._s && c._s !== sC1 && vm(C).fase === "fine"; }, 12000))
      no("ricaricando sulla classifica la Sala e il gioco non tornano sulla classifica (fase " + vm(C).fase + ", Sala " + (W.statoStanza(S) || {}).stanza + ")");
    await W.dorme(3000);
    var pn = ((vm(S).torneo) || {}).n || 0; if (pn !== p0 + 1) no("dopo la ricarica sulla classifica la partita conta " + (pn - p0) + " volte");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Cambia gioco/, ".fine-tasti button"); }, 6000)) no("Paky non ha «🎮 Cambia gioco» («" + T(W.finestra("Paky")).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return !vm(S).gioco && am.every(function (n) { var f = W.finestra(n); return f.document.querySelector(".saletta-schermo") && !f.document.querySelector(".ct-scena"); }); }, 8000))
      no("«Cambia gioco» non porta tutti nella Sala");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "ripresa in " + dt + " s: Sala " + S + " e gioco " + C + " con gli stessi codici, n = " + n0 + ", nessuno dalla Sala o dalla saletta; «" + pa.Giulia + "»; la partita conta una volta (anche ricaricando sulla classifica); Cambia gioco porta tutti nella Sala";
  } };

  // 516. Torneo a eliminazione a Tris in 2 (percorso di prima, come la 23): chi apre la partita ricarica dopo 2 mosse → la
  //      partita riprende nella stessa stanza con le stesse mosse, lo stesso tabellone; si finisce e il campione è giusto.
  //      Due volte: quando la partita la apre Giulia (amica) e quando la apre Paky (che tiene anche la Sala del torneo: si
  //      riaprono tutte e due). Chi apre la partita lo decide il sorteggio: si rifà finché non tocca a chi serve
  // (vuole: "Paky" o "Giulia" = chi deve aprire la partita; null se il sorteggio ha scelto l'altro)
  async function elimRicarica(vuole) {
    var P = await W.apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === "Tris"; }); }, 5000);
    if (!tess) no("non trovo il Tris"); tess.click(); await W.dorme(200);
    if (!W.clicca(P, /Torneo a eliminazione/)) no("non trovo «Torneo a eliminazione»");
    var S = await W.aspetta(function () { return codiceSaletta(P); }, 5000); if (!S) no("il torneo non ha il codice");
    await W.apriTel("Giulia", { hash: "sala=" + S, x: 185 });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 2; }, 8000)) no("Giulia non entra nel torneo");
    if (!W.clicca(P, /Comincia il torneo/)) no("non trovo «Comincia il torneo»");
    var p0 = await W.aspetta(function () { var e = vm(S).elim; return e && e.turni && e.turni[0] && e.turni[0][0]; }, 5000);
    if (!p0) no("il torneo non comincia");
    var C = p0.stanza, chiA = p0.a === "host" ? "Paky" : "Giulia", chiB = chiA === "Paky" ? "Giulia" : "Paky";
    if (chiA !== vuole) return null;
    if (!await W.aspetta(function () { return vm(C).avvId; }, 8000)) no("la partita " + C + " non si apre con tutti e due");
    await W.aspetta(function () { return W.clicca(W.finestra(chiA), /Comincia/); }, 4000);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 4000)) no("la partita non comincia");
    var x = chiA, o = chiB, vince = vm(C).turno === "X" ? chiA : chiB;   // (chi apre ha X; muovendo sempre nella prima casella libera vince chi comincia)
    for (var i = 0; i < 2; i++) if (!await mossaTris(C, chiA, chiB)) no("mossa " + (i + 1) + " non arrivata");
    await W.dorme(1200);
    var board0 = JSON.stringify(vm(C).board), turno0 = vm(C).turno, sC0 = (W.statoStanza(C) || {})._s, tab0 = JSON.stringify(vm(S).elim.turni), sS0 = (W.statoStanza(S) || {})._s;
    var spia = spiaSchermo([chiB], ".saletta-schermo");
    await W.ricarica(chiA);
    var perche = "";
    var ok = await W.aspetta(function () {
      var c = W.statoStanza(C) || {}, v = vm(C);
      if (!c._s || c._s === sC0 || !c._r) { perche = "la partita non si è riaperta con la ripresa (_r)"; return false; }
      if (v.fase !== "gioco") { perche = "la partita è in fase " + v.fase; return false; }
      if (JSON.stringify(v.board) !== board0) { perche = "le mosse non sono quelle di prima (" + JSON.stringify(v.board) + ")"; return false; }
      if (!v.avvId) { perche = "l'avversario non è rientrato"; return false; }
      return true;
    }, 12000);
    if (!ok) no("dopo la ricarica di " + chiA + ": " + perche);
    if (vm(C).turno !== turno0) no("tocca a " + vm(C).turno + " invece di " + turno0);
    if (JSON.stringify(vm(S).elim.turni) !== tab0) no("il tabellone è cambiato");
    if (chiA === "Paky" && ((W.statoStanza(S) || {})._s === sS0)) no("la Sala del torneo non si è riaperta");
    var pb = await pilloleDi([chiB], /riprende da dove era/, 5000); if (!pb[chiB]) no(chiB + " non legge «riprende da dove era» («" + pill(W.finestra(chiB)) + "»)");
    var passati = spia.fine(); if (passati.length) no(chiB + " è passato dalla saletta");
    if (!await trisFinoAllaFine(C, x, o)) no("dopo la ripresa la partita non finisce");
    var camp = await W.aspetta(function () { var e = vm(S).elim; return e && e.finito && e.campione; }, 8000);
    if (!camp) no("il torneo non ha il campione");
    var nomeC = (vm(S).elim.nomi || {})[camp];
    if (nomeC !== vince) no("campione sbagliato: " + nomeC + " (doveva vincere " + vince + ", che ha cominciato)");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "ricarica di " + chiA + " (apre la partita" + (chiA === "Paky" ? " e tiene la Sala del torneo" : "") + ") dopo 2 mosse: stesse mosse, stesso turno, stesso tabellone; " + chiB + " legge «" + pb[chiB] + "»; campione " + nomeC;
  }
  SCENARI[516] = { nome: "Torneo a eliminazione: chi apre la partita ricarica, la partita riprende", fai: async function () {
    var esiti = [];
    for (var v = 0, chi = ["Giulia", "Paky"]; v < chi.length; v++) {
      var r = null;
      for (var k = 0; k < 8 && !r; k++) { pulisci(); r = await elimRicarica(chi[v]); }
      if (!r) no("in 8 sorteggi la partita non l'ha mai aperta " + chi[v]);
      esiti.push(r);
    }
    return esiti.join(" / ");
  } };

  // 517. Il duello nella Sala (5-6): Giulia (l'ha aperto) ricarica a metà → il duello riprende nella stessa stanza, Luca
  //      legge «riprende da dove era», Paky e Marco continuano a guardare. Poi ricarica Paky (host della Sala): la Sala si
  //      riapre col duello dentro e nessuno viene portato via. Si finisce: l'esito arriva alla Sala una volta
  SCENARI[517] = { nome: "Duello: chi l'ha aperto ricarica e la partita riprende; poi ricarica l'host della Sala", fai: async function () {
    var A = await salaConAmici(["Giulia", "Luca", "Marco"]), S = A.S, P = A.w.Paky, L = A.w.Luca, M = A.w.Marco;
    var r = await toccaGiocoSala(P, "Tris");
    if (r.dove !== "chi") no("non si apre «Chi gioca?»");
    toccaChi(P, "Paky"); toccaChi(P, "Luca"); W.clicca(P, /Si gioca/, ".piede button");
    var D = await W.aspetta(function () { return vm(S).duello; }, 4000); if (!D) no("nella Sala non c'è il duello");
    var C = D.stanza;
    if (!await W.aspetta(function () { return vm(C).avvId === D.b; }, 10000)) no("nel duello Luca non è l'avversario");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Giulia"), /Comincia/, ".sl-go"); }, 6000)) no("Giulia non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il duello non comincia");
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".tr-cella").length === 9 && M.document.querySelectorAll(".tr-cella").length === 9; }, 6000)) no("Paky e Marco non guardano");
    var x = "Giulia", o = "Luca";   // (chi apre il duello ha X)
    for (var i = 0; i < 2; i++) if (!await mossaTris(C, "Giulia", "Luca")) no("mossa " + (i + 1) + " non arrivata");
    await W.dorme(1200);
    var board0 = JSON.stringify(vm(C).board), sC0 = (W.statoStanza(C) || {})._s;
    var errori = [spiaTesto(L, /Collegamento perso|Ops/), spiaTesto(M, /Collegamento perso|Ops/), spiaTesto(P, /Collegamento perso|Ops/)];
    var spia = spiaSchermo(["Luca", "Marco"], ".saletta-schermo");
    await W.ricarica("Giulia");
    var perche = "";
    var ok = await W.aspetta(function () {
      var c = W.statoStanza(C) || {}, v = vm(C);
      if (!c._s || c._s === sC0 || !c._r) { perche = "il duello non si è riaperto con la ripresa (_r)"; return false; }
      if (v.fase !== "gioco" || JSON.stringify(v.board) !== board0) { perche = "la partita non è quella di prima (fase " + v.fase + ")"; return false; }
      if (v.avvId !== D.b) { perche = "Luca non è rientrato"; return false; }
      return true;
    }, 12000);
    if (!ok) no("dopo la ricarica di Giulia: " + perche);
    if (!vm(S).duello || vm(S).duello.stanza !== C) no("la Sala ha perso il duello");
    var pl = await pilloleDi(["Luca"], /riprende da dove era/, 5000); if (!pl.Luca) no("Luca non legge «riprende da dove era» («" + pill(L) + "»)");
    if (!P.document.querySelector(".tr-cella") || !M.document.querySelector(".tr-cella")) no("Paky o Marco non guardano più");
    // ricarica anche Paky (host della Sala): la Sala si riapre col duello dentro, nessuno viene portato via
    if (!await mossaTris(C, "Giulia", "Luca")) no("dopo la ripresa la mossa non arriva");
    var sS0 = (W.statoStanza(S) || {})._s, t1 = Date.now();
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(S) || {}; return s._s && s._s !== sS0 && s.duello && s.duello.stanza === C && s.stanza === C; }, 12000))
      no("la Sala riaperta non tiene il duello (" + JSON.stringify(W.statoStanza(S) || {}).slice(0, 160) + ")");
    if (salaSenzaGioco(S, t1, sS0)) no("la Sala riaperta ha mandato una foto senza il duello");
    if (!await W.aspetta(function () { return P.document.querySelector(".sl-duello"); }, 6000)) no("Paky non vede «⚔️ Giulia e Luca giocano a Tris» nella Sala");
    await W.dorme(1500);
    if (!W.finestra("Giulia").document.querySelector(".tr-cella") || !L.document.querySelector(".tr-cella") || !M.document.querySelector(".tr-cella")) no("dopo la ricarica di Paky qualcuno non è più nel duello");
    var passati = spia.fine(); if (passati.length) no(passati.join(", ") + " è passato dalla Sala o dalla saletta");
    if (!await trisFinoAllaFine(C, x, o)) no("il duello non finisce");
    if (!await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1; }, 6000)) no("l'esito del duello non arriva alla Sala");
    await W.dorme(1500);
    if (((vm(S).torneo) || {}).n !== 1) no("l'esito del duello conta " + vm(S).torneo.n + " volte");
    var e = errori.map(function (f) { return f.stop(); }).filter(Boolean); if (e.length) no("qualcuno legge «" + e[0] + "»");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "Giulia ricarica: duello " + C + " ripreso (stesse mosse, Luca «" + pl.Luca + "», Paky e Marco guardano); Paky ricarica: Sala " + S + " col duello dentro, nessuno portato via; esito una volta";
  } };

  // ---- aiuti per i bot fissi (p2-bot) ----
  // botFinti: da mettere in apriTel(nome, { prima: botFinti }): la scheda pubblica finta (BR.pubblici[nome]) per
  // SGNube.pubblica e SGNube.cercaNome (senza rete, w.__offline, cercaNome non risponde)
  function botFinti(w) {
    W.BR.pubblici = W.BR.pubblici || {};
    var nome = w.__fp && w.__fp.nome;
    w.SGNube.pubblica = function (d) {
      if (w.__offline || !nome) return Promise.resolve();
      var s = W.BR.pubblici[nome] = W.BR.pubblici[nome] || { nome: nome };
      for (var k in d) s[k] = JSON.parse(JSON.stringify(d[k]));
      return Promise.resolve();
    };
    w.SGNube.cercaNome = function (n) {
      if (w.__offline) return Promise.reject(new Error("offline"));
      var k = Object.keys(W.BR.pubblici).filter(function (x) { return x.trim().toUpperCase() === String(n).trim().toUpperCase(); })[0];
      return Promise.resolve(k ? JSON.parse(JSON.stringify(W.BR.pubblici[k])) : null);
    };
  }
  // una schermata qualsiasi (non la saletta) a misura: niente scorre e il piede si vede. "" = tutto bene
  async function misuraSchermata(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(400);
    var c = d.querySelector(".schermata .contenuto"), p = d.querySelector(".schermata .piede");
    if (d.documentElement.scrollHeight > alt + 1) return "a " + larg + "x" + alt + " la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (c && c.scrollHeight > c.clientHeight + 1) return "a " + larg + "x" + alt + " il centro scorre (" + c.scrollHeight + " su " + c.clientHeight + ")";
    if (p && p.getBoundingClientRect().bottom > alt + 1) return "a " + larg + "x" + alt + " i tasti in fondo escono";
    return "";
  }
  async function misureSchermata(w, nome) {
    var a = await misuraSchermata(w, nome, 360, 640), b = await misuraSchermata(w, nome, 412, 915);
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return a || b;
  }
  // dalla home al profilo
  async function apriProfilo(w) {
    var ch = await W.aspetta(function () { return w.document.querySelector(".profilo-chip, .citta-io"); }, 4000);
    if (!ch) no("non trovo il profilo nella home («" + T(w).slice(0, 60) + "»)");
    ch.click();
    if (!await W.aspetta(function () { return /Il tuo profilo/.test(T(w)) && /Esci dal profilo/.test(T(w)); }, 4000)) no("non si apre il profilo («" + T(w).slice(0, 60) + "»)");
  }

  // ---- aiuti per il torneino (p2-t) ----
  // il torneino di adesso (dalla foto della Sala) o null; una sua partita; il nome di un partecipante (il Bot col suo nome)
  function tn(S) { var e = vm(S).elim; return e && e.torneino ? e : null; }
  function partitaTn(S, k) { var e = tn(S); if (!e) return null; for (var r = 0; r < e.turni.length; r++) for (var j = 0; j < e.turni[r].length; j++) if (e.turni[r][j].k === k) return e.turni[r][j]; return null; }
  function nomeTn(E, id) { return id === "bot" ? ((E.bot && E.bot.nome) || "Bot") : (E.nomi || {})[id]; }
  // come lo scrive il tabellone ("🤖 Matt" per il Bot)
  function etTn(E, id) { return id === "bot" ? "🤖 " + nomeTn(E, id) : nomeTn(E, id); }
  // dalla Sala l'host tocca un gioco a due: si apre "Tris in N" (🏆 Torneino / ⚔️ Una sfida)
  async function apriSceltaTn(P, nomeGioco) {
    if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco» nella Sala");
    var tess = await W.aspetta(function () { return tessera(P, nomeGioco || "Tris"); }, 4000);
    if (!tess) no("non trovo " + (nomeGioco || "Tris") + " tra i giochi della Sala");
    tess.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".torneino-sc"); }, 4000)) no("toccato " + (nomeGioco || "Tris") + ", non si apre «Torneino / Una sfida» («" + T(P).slice(0, 80) + "»)");
  }
  // le righe delle scelte del torneo che si vedono ("Le coppie · Chi resta in più · Bravura del Bot")
  function opzVisibili(P) {
    var o = P.document.querySelector(".tn-opz"); if (!o || o.hidden) return "";
    return [].filter.call(o.children, function (r) { return !r.hidden; }).map(function (r) { var e = r.querySelector(".etichetta"); return e ? e.textContent : ""; }).join(" · ");
  }
  // tocca una scelta del torneino ("Passa il turno", "Difficile"…)
  function chipTn(P, testo) {
    var b = [].find.call(P.document.querySelectorAll(".tn-opz .modo-chip"), function (x) { return x.textContent.indexOf(testo) >= 0; });
    if (!b) no("tra le scelte del torneino non c'è «" + testo + "»");
    b.click();
  }
  // "🏆 Via al torneino": restituisce il torneino partito
  async function viaTn(P, S) {
    if (!W.clicca(P, /Via al torneo/, ".piede button")) no("non c'è «⚔️ Via al torneo»");
    var E = await W.aspetta(function () { var e = tn(S); return e && e.iniziato ? e : null; }, 5000);
    if (!E) no("il torneino non parte");
    return E;
  }
  // l'host decide una partita dal tabellone: "⋯" sulla carta → "✅ Passa Luca" (se sta giocando, dal 🏆 sopra la sua partita)
  async function decidiTn(P, S, k, id) {
    var carta = await W.aspetta(function () {
      var c = P.document.querySelector('.tb-p[data-k="' + k + '"]');
      if (!c && !P.document.querySelector(".sl-foglio")) { var b = P.document.querySelector(".tab-elim"); if (b) b.click(); }
      return c && c.querySelector(".tb-decidi") ? c : null;
    }, 6000);
    if (!carta) no("Paky non trova la partita " + k + " nel tabellone («" + T(P).slice(0, 80) + "»)");
    carta.querySelector(".tb-decidi").click();
    var E = tn(S), tx = "✅ Passa " + etTn(E, id);
    var b = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".tb-velo button"), function (x) { return x.textContent === tx; }); }, 2000);
    if (!b) no("nel foglio «Partita bloccata?» non c'è «" + tx + "»");
    b.click();
    if (!await W.aspetta(function () { var p = partitaTn(S, k); return p && p.vince === id; }, 4000)) no("decisa la partita " + k + ", non passa " + nomeTn(E, id));
    var f = P.document.querySelector(".sl-velo:not(.tb-velo)"); if (f) { var x = f.querySelector(".sl-foglio-x"); if (x) x.click(); }   // (il 🏆 sopra la partita si chiude)
  }
  // una partita di Tris vera del torneino: chi l'ha aperta (a) fa Comincia; vince a (X, prima casella libera)
  async function trisTn(S, p) {
    var E = tn(S), nA = nomeTn(E, p.a), nB = nomeTn(E, p.b), A = W.finestra(nA);
    if (!await W.aspetta(function () { return vm(p.stanza).avvId; }, 12000)) no("la partita " + nA + "–" + nB + " non si apre con tutti e due");
    await W.aspetta(function () { return W.clicca(A, /Comincia/, ".sl-go"); }, 8000);
    if (!await W.aspetta(function () { return vm(p.stanza).fase === "gioco"; }, 8000)) no("la partita " + nA + "–" + nB + " non comincia");
    if (!await trisFinoAllaFine(p.stanza, nA, nB)) no("la partita " + nA + "–" + nB + " non finisce");
    var v = await W.aspetta(function () { var q = partitaTn(S, p.k); return q && q.vince; }, 8000);
    if (!v) no("finita la partita " + nA + "–" + nB + ", il tabellone non sa chi ha vinto");
    return v;
  }
  // il torneino fino alla fine deciso dall'host: col Bot vince sempre il Bot, se no il primo della carta. Restituisce il torneino finito
  async function finoAllaFineTn(P, S, controlla) {
    var fino = Date.now() + 90000;
    while (Date.now() < fino) {
      var E = tn(S); if (!E) no("il torneino è sparito");
      if (E.finito) return E;
      if (controlla) controlla(E);
      var tu = E.turni[E.turni.length - 1], p = tu.filter(function (x) { return !x.vince; })[0];
      if (p) await decidiTn(P, S, p.k, p.b === "bot" ? "bot" : p.a);
      else await W.dorme(150);
    }
    no("il torneino non finisce");
  }
  // la Sala col tabellone a misura: niente scorre, carte e tasti dentro lo schermo. "" = tutto bene, se no il perché
  async function misuraTab(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; } .sl-av,.sl-nome{transition:none!important}"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(450); w.scrollTo(0, 0);
    var tab = d.querySelector(".saletta-schermo .sl-tab"); if (!tab) return "non c'è il tabellone nella Sala";
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato";
    var c = d.querySelector(".saletta-schermo > .contenuto"); if (c && c.scrollHeight > c.clientHeight + 1) return "il centro scorre (" + c.scrollHeight + " su " + c.clientHeight + ")";
    var cose = [].slice.call(d.querySelectorAll(".sl-tab .tb-p, .sl-tab .tb-prima, .saletta-schermo > .piede .btn:not([hidden])"));
    for (var i = 0; i < cose.length; i++) { var r = cose[i].getBoundingClientRect(); if (r.width && (r.bottom > alt + 1 || r.right > larg + 1 || r.left < -1)) return "«" + cose[i].textContent.slice(0, 30) + "» esce dallo schermo"; }
    var nomi = d.querySelectorAll(".sl-tab .tb-n");
    for (var k = 0; k < nomi.length; k++) if (nomi[k].getBoundingClientRect().right > nomi[k].parentNode.getBoundingClientRect().right + 1) return "il nome «" + nomi[k].textContent + "» esce dalla carta";
    return "";
  }
  async function misureTab(w, nome) {
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) { var e = await misuraTab(w, nome, M[k][0], M[k][1]); if (e) no(nome + " a " + M[k].join("x") + ": " + e); fatte.push(M[k].join("x")); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return fatte.join(", ");
  }

  W.COPIONE = {
    esiti: [], scenari: SCENARI,
    // gli aiuti di questo file, per i file di prova dei passi (passo2/…): var A = COPIONE.aiuti; A.vm(C), A.no("perché")…
    aiuti: { T: T, pill: pill, dentro: dentro, vm: vm, ids: ids, mioId: mioId, codiceSaletta: codiceSaletta, codiceTestata: codiceTestata, soloCodice: soloCodice, no: no, home: home,
      apriSala: apriSala, salaLanciaGioco: salaLanciaGioco, scalinataFinoAllaFine: scalinataFinoAllaFine,
      audioFinto: audioFinto, nomeTarga: nomeTarga, targaDi: targaDi, avatarDi: avatarDi, pronto: pronto, statoHost: statoHost,
      contaFaccine: contaFaccine, controllaSchermo: controllaSchermo,
      spiaProfilo: spiaProfilo, creaProfilo: creaProfilo, primoAvatar: primoAvatar, misuraProfilo: misuraProfilo, misureProfilo: misureProfilo,
      codiceSala: codiceSala, tessera: tessera, modiVisti: modiVisti, spiaTesto: spiaTesto, salaDaGioco: salaDaGioco, idInSala: idInSala,
      apriSalaNuova: apriSalaNuova, misuraHome: misuraHome, batti: batti, incolla: incolla, caselle: caselle,
      salaConAmici: salaConAmici, lanciaDallaSala: lanciaDallaSala, contaSl: contaSl, sagome: sagome, regoleDi: regoleDi,
      trisFinoAllaFine: trisFinoAllaFine, tastiFineDi: tastiFineDi, misuraFine: misuraFine, misureFine: misureFine, spiaVia: spiaVia, spiaTavolo: spiaTavolo,
      chiGioca: chiGioca, toccaChi: toccaChi, passaChiGioca: passaChiGioca, misuraChi: misuraChi, misureChi: misureChi, toccaGiocoSala: toccaGiocoSala,
      botFinti: botFinti, misuraSchermata: misuraSchermata, misureSchermata: misureSchermata, apriProfilo: apriProfilo,
      tn: tn, partitaTn: partitaTn, nomeTn: nomeTn, etTn: etTn, apriSceltaTn: apriSceltaTn, chipTn: chipTn, opzVisibili: opzVisibili, viaTn: viaTn, decidiTn: decidiTn, trisTn: trisTn,
      finoAllaFineTn: finoAllaFineTn, misuraTab: misuraTab, misureTab: misureTab,
      contatore: contatore, apriContatore: apriContatore, provaRipresa: provaRipresa, contaDentro: contaDentro, contaStoria: contaStoria, contaPartite: contaPartite, tocca: tocca,
      apriRiserva: apriRiserva, chiTiene: chiTiene, fotoDa: fotoDa, pilloleDi: pilloleDi, muore: muore, torna: torna,
      pulisci: pulisci, carica: carica },
    // uno scenario nuovo (da un file di prova): COPIONE.aggiungi(201, { nome: "…", fai: async function () { … return "…"; } })
    aggiungi: function (n, s) { SCENARI[n] = s; return n; },
    // carica un file di prova della cartella prova-nel-browser (es. "passo2/gruppo-a.js"): i suoi scenari si aggiungono
    carica: async function (percorso) {
      await carica();
      var src = await (await fetch("/.agents/skills/prova-nel-browser/" + String(percorso).replace(/^\/+/, "") + "?" + Date.now())).text();
      (0, eval)(src);
      return percorso;
    },
    prova: async function (n, opz) {   // (opz: per gli scenari che le leggono, es. 56 { solo: ["tris"] })
      await carica(); pulisci();
      var s = SCENARI[n], t0 = Date.now(), r;
      try { r = n + " OK · " + s.nome + " · " + (await s.fai(opz)); }
      catch (e) { r = n + " NO · " + s.nome + " · " + (e && e.message || e); }
      var err = W.erroriTel(); if (err.length) r += " · errori: " + err.slice(0, 3).join(" / ");
      r += " (" + Math.round((Date.now() - t0) / 1000) + " s)";
      this.esiti = this.esiti.filter(function (x) { return x.indexOf(n + " ") !== 0; }); this.esiti.push(r);
      return r;
    },
    tutti: async function () { for (var k in SCENARI) await this.prova(isNaN(+k) ? k : +k); return this.esiti; }
  };
})();
