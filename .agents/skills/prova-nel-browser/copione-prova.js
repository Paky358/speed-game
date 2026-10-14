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
// 24-34: la saletta viva (Passo 4): chi arriva e chi esce, "Sono pronto", faccine, chi si ricollega, "Fai uscire" e porta
// chiusa, 3-2-1 per tutti, si parte da soli, musichetta 🎵/🔇, nomi buffi col 🎲, sei telefoni in uno schermo; 34: lo
// stesso nella Sala (faccine, "Fai uscire", porta chiusa che resta chiusa se l'host ricarica).
// I suoni sul computer di prova sono spenti: "pling", bip e musichetta si provano a codice (audioFinto registra le note).
(function () {
  "use strict";
  var W = window;
  async function carica() {
    if (W.BR && W.apriTel) return;
    var src = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text();
    (0, eval)(src.split("// ===== ESEMPIO =====")[0]);
  }
  // si riparte da zero: via i telefoni, broker vuoto, memorie vuote
  function pulisci() {
    Object.keys(W.BR.tel).forEach(function (n) { (W.BR.perNome[n] || []).forEach(function (c) { c.morto = true; c.connected = false; }); var f = document.getElementById("tel-" + n); if (f) f.remove(); });
    W.BR.clients = []; W.BR.retained = {}; W.BR.log = []; W.BR.perNome = {}; W.BR.mem = {}; W.BR.tel = {};
  }
  var T = function (w) { return W.testo(w).replace(/\s+/g, " "); };
  var pill = function (w) { return [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | "); };
  var dentro = function (w) { return /Sei dentro/.test(W.testo(w)); };
  function vm(cod) { return W.vmDi(cod) || {}; }
  function ids(cod, campo) { return ((vm(cod)[campo || "posti"]) || []).map(function (p) { return p.id; }); }
  function mioId(nome) { var h = W.reteDi(nome); return h && h.stato ? h.stato().id : null; }
  function codiceSaletta(w) { var b = w.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }
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
    if (torneo) { W.clicca(w, /Torneo \(più giochi/); await W.dorme(250); W.clicca(w, /Online/, ".modo-grande"); }
    else W.clicca(w, /Sala online/);
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
  async function controllaSchermo(w, nome, larg, alt) {
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
    if (targhe.length < 6) return "nella saletta ci sono " + targhe.length + " nomi invece di 6";
    for (var i = 0; i < targhe.length; i++) {
      var a = targhe[i].r;
      if (a.left < stz.left - 1 || a.right > stz.right + 1 || a.bottom > stz.bottom + 1) return "il nome «" + targhe[i].n + "» esce dalla stanza";
      for (var j = i + 1; j < targhe.length; j++) { var b = targhe[j].r; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) return "i nomi «" + targhe[i].n + "» e «" + targhe[j].n + "» si coprono"; }
    }
    var avs = d.querySelectorAll(".sl-av:not(.va)");
    for (var k = 0; k < avs.length; k++) { var r = avs[k].getBoundingClientRect(), m = r.width * 0.2; if (r.left < stz.left - m || r.right > stz.right + m || r.top < stz.top - 1) return "un avatar esce dalla stanza"; }
    return "";
  }

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
      if (!G.document.querySelector(".sl-cod")) no("Giulia non è host della sua stanza");
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
        var t0 = Date.now();
        P = await W.ricarica("Paky");
        var ok = await W.aspetta(function () {
          var w = W.finestra("Paky");
          return codiceSaletta(w) === C && vm(C).fase === "lobby" && ids(C).length === 3 && dentro(W.finestra("Giulia")) && dentro(W.finestra("Luca"));
        }, 10000);
        if (!ok) no((giro ? "a metà partita" : "in saletta") + ": dopo 10 s non sono tutti in saletta (" + ids(C).join(",") + ", Paky: " + codiceSaletta(W.finestra("Paky")) + ")");
        tempi.push(((Date.now() - t0) / 1000).toFixed(1) + " s");
      }
      var pg = pill(W.finestra("Giulia"));
      return "tutti di nuovo in saletta in " + tempi.join(" e ") + " · Giulia legge: " + (pg || "(niente)");
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
      if (vm(C).turno === "X") { var c0 = [].filter.call(W.finestra("Paky").document.querySelectorAll(".schermata button"), function (b) { return b.style && b.style.aspectRatio; })[4]; if (c0) c0.click(); }
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
      var p = await W.aspetta(function () { return /entri alla prossima/.test(pill(M)); }, 8000);
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
      await W.aspetta(function () { return W.clicca(Lw, /‹/, ".testa button"); }, 3000);
      if (!await W.aspetta(function () { return Lw.document.querySelector(".sl-incorso"); }, 4000)) no("Luca non vede 'Stanno giocando… Rientra' nella Sala (" + T(Lw).slice(0, 80) + ")");
      // entra Sara nella Sala: Luca non deve essere riportato nel gioco
      await W.apriTel("Sara", { hash: "sala=" + S, x: 555 });
      await W.aspetta(function () { return ((vm(S).membri) || []).length === 4; }, 6000);
      await W.dorme(1500);
      if (!Lw.document.querySelector(".sl-incorso")) no("Luca è stato risucchiato nel gioco");
      // l'host chiude il gioco: Giulia non deve vedere "Collegamento perso"
      var Gw = W.finestra("Giulia"), visto = "";
      var guarda = setInterval(function () { var tx = W.testo(Gw); if (/Collegamento perso|Ops/.test(tx)) visto = tx.slice(0, 60); }, 30);
      W.clicca(W.finestra("Paky"), /‹/, ".testa button");
      var inSala = await W.aspetta(function () { return /Sala online/.test(W.testo(Gw)) && Gw.document.querySelector(".saletta-schermo"); }, 6000);
      await W.dorme(1200); clearInterval(guarda);
      if (visto) no("Giulia ha visto «" + visto + "»");
      if (!inSala) no("Giulia non è tornata nella Sala");
      var Pw = W.finestra("Paky");
      if (!(/Sala online/.test(W.testo(Pw)) && Pw.document.querySelector(".saletta-schermo"))) no("l'host non è nella Sala: " + T(Pw).slice(0, 60));
      return "Luca resta nella Sala con 'Rientra'; a fine gioco Giulia torna nella Sala (" + (pill(Gw) || "") + ")";
    } },

    // 9. Due "Luca" diventano "Luca" e "Luca 2", con punti separati
    9: { nome: "Due 'Luca': 'Luca' e 'Luca 2', punti separati", fai: async function () {
      await W.apriTel("Paky", { x: 0 });
      var S = await apriSala("Paky", true);
      for (var i = 0; i < 2; i++) {
        var n = i ? "Luca-bis" : "Luca", w = await W.apriTel(n, { hash: "sala=" + S, x: 185 * (i + 1), profilo: false });
        var inp = await W.aspetta(function () { return w.document.querySelector("input.link-campo"); }, 4000);
        if (!inp) no("niente campo del nome per chi non ha il profilo");
        inp.value = "Luca"; W.clicca(w, /Entra/);
        await W.aspetta(function () { return ((vm(S).membri) || []).length === 2 + i; }, 6000);
      }
      var nomi = (vm(S).membri || []).map(function (m) { return m.nome; });
      if (nomi.join("|") !== "Paky|Luca|Luca 2") no("nella Sala: " + nomi.join(", "));
      var L = await salaLanciaGioco("Paky", "La Scalinata"), C = L.cod;
      if (!await W.aspetta(function () { return ids(C).length === 3; }, 8000)) no("i due Luca non entrano nel gioco");
      var nomiG = (vm(C).posti || []).map(function (p) { return p.nome; });
      if (nomiG.join("|") !== "Paky|Luca|Luca 2") no("nel gioco: " + nomiG.join(", "));
      W.clicca(W.finestra("Paky"), /Comincia/);
      if (!await scalinataFinoAllaFine(C, ["Luca", "Luca-bis"], "Paky")) no("la Scalinata non è finita");
      await W.dorme(600);
      W.clicca(W.finestra("Paky"), /Chiudi/);
      var T9 = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 && t; }, 6000);
      if (!T9) no("il torneo non ha contato la partita");
      if (T9.punti.Luca == null || T9.punti["Luca 2"] == null) no("punti del torneo: " + JSON.stringify(T9.punti));
      return "Sala: " + nomi.join(", ") + " · punti: " + Object.keys(T9.punti).map(function (k) { return k + " " + T9.punti[k]; }).join(", ");
    } },

    // 10. Con un errore finto a metà partita il gioco continua
    10: { nome: "Errore di rete a metà partita: si continua", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var G = await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return vm(C).avvId; }, 6000)) no("Giulia non entra");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 4000)) no("il Tris non comincia");
      var cella = function (w, i) { return [].filter.call(w.document.querySelectorAll(".schermata button"), function (b) { return b.style && b.style.aspectRatio; })[i]; };
      var chi = vm(C).turno === "X" ? P : G;
      cella(chi, 4).click();
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

    // 12. (in più) Senza profilo il nome si scrive una volta: ricaricando si rientra col nome di prima
    12: { nome: "Senza profilo: ricaricando si rientra col nome di prima", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
      var L = await W.apriTel("Luca", { hash: "gioco=tris&stanza=" + C, x: 185, profilo: false });
      var inp = await W.aspetta(function () { return L.document.querySelector("input.link-campo"); }, 4000);
      if (!inp) no("niente campo del nome");
      inp.value = "Lucone"; W.clicca(L, /Entra/);
      if (!await W.aspetta(function () { return dentro(L) && vm(C).nomi && vm(C).nomi.O === "Lucone"; }, 6000)) no("Luca non entra");
      L = await W.ricarica("Luca");
      var ok = await W.aspetta(function () { return dentro(L); }, 6000);
      if (!ok) no("dopo la ricarica Luca non è rientrato da solo (" + T(L).slice(0, 80) + ")");
      if (vm(C).nomi.O !== "Lucone") no("nome dopo la ricarica: " + vm(C).nomi.O);
      return "Luca è rientrato da solo come «Lucone»";
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
      var cella = function (w, i) { return [].filter.call(w.document.querySelectorAll(".schermata button"), function (b) { return b.style && b.style.aspectRatio; })[i]; };
      // X fa la riga in alto (0, 1, 2), O mette 3 e 4
      var mosse = [[P, 0], [G, 3], [P, 1], [G, 4], [P, 2]];
      for (var i = 0; i < mosse.length; i++) {
        var w = mosse[i][0], k = mosse[i][1], n = i + 1;
        if (!await W.aspetta(function () { var c = cella(w, k); if (c && c.style.cursor === "pointer") { c.click(); return true; } return false; }, 4000)) no("mossa " + n + ": la casella non si tocca");
        if (!await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length === n; }, 4000)) no("mossa " + n + " non arrivata");
      }
      if (!await W.aspetta(function () { return vm(C).fase === "fine" && vm(C).fine && vm(C).fine.vincitore === "X"; }, 4000)) no("la partita non finisce con la vittoria di X");
      if (!await W.aspetta(function () { return /hai vinto|vince|Hai perso|perso/i.test(W.testo(G)); }, 3000)) no("Giulia non vede com'è finita (" + T(G).slice(0, 60) + ")");
      if (!await W.aspetta(function () { return W.clicca(P, /Rivincita/); }, 3000)) no("l'host non ha «Rivincita»");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco" && (vm(C).board || []).filter(Boolean).length === 0; }, 4000)) no("la rivincita non comincia");
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
      var vinc = vm(C).vincitore;
      if (!await W.aspetta(function () { return /Vince/.test(W.testo(W.finestra("Giulia"))); }, 3000)) no("Giulia non vede il podio");
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
      W.clicca(P, /‹/, ".testa button");   // esce subito: i 3 bot stanno ancora scegliendo
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
      var c = W.viviDi("Paky")[0]; if (!c) no("l'host non ha un collegamento");
      c.connected = false; c.frozen = true; W.BR.clients = W.BR.clients.filter(function (x) { return x !== c; });   // muto, senza testamento
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
      var cella = function (w, i) { return [].filter.call(w.document.querySelectorAll(".schermata button"), function (b) { return b.style && b.style.aspectRatio; })[i]; };
      var mosse = vm(C).turno === "X" ? [[A, 0], [B, 3], [A, 1], [B, 4], [A, 2]] : [[B, 3], [A, 0], [B, 4], [A, 1], [B, 6], [A, 2]];
      for (var i = 0; i < mosse.length; i++) {
        var w = mosse[i][0], k = mosse[i][1], n = i + 1;
        if (!await W.aspetta(function () { var c = cella(w, k); if (c && c.style.cursor === "pointer") { c.click(); return true; } return false; }, 4000)) no("mossa " + n + ": la casella non si tocca");
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

    // 32. Senza profilo: il benvenuto con l'avatar che avrai, il 🎲 propone un nome buffo (cambia anche l'avatar) e
    //     l'host lo vede entrare con quel nome
    32: { nome: "Senza profilo: 🎲 nomi buffi e avatar in anteprima", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
      var L = await W.apriTel("Luca", { hash: "gioco=scalinata&stanza=" + C, x: 185, profilo: false });
      var dado = await W.aspetta(function () { return L.document.querySelector(".sl-dado"); }, 4000);
      if (!dado) no("accanto al nome non c'è il 🎲");
      var input = L.document.querySelector(".sl-nome-campo input"), ant = L.document.querySelector(".sl-anteprima");
      if (!ant) no("manca l'avatar in anteprima");
      var visti = {}, svg0 = ant.innerHTML;
      for (var i = 0; i < 6; i++) { dado.click(); var n = input.value; if (!/^[A-Z][a-zà]+ [A-Z][a-zà]+$/.test(n) || n.length > 16) no("nome buffo strano: «" + n + "»"); visti[n] = 1; }
      if (Object.keys(visti).length < 4) no("il 🎲 propone sempre gli stessi nomi: " + Object.keys(visti).join(", "));
      if (ant.innerHTML === svg0) no("col 🎲 l'avatar in anteprima non cambia");
      var nome = input.value;
      W.clicca(L, /Entra/);
      if (!await W.aspetta(function () { return JSON.stringify(vm(C)).indexOf("\"" + nome + "\"") >= 0; }, 6000)) no("l'host non vede entrare «" + nome + "»");
      if (!await W.aspetta(function () { return avatarDi(P, nome); }, 3000)) no("nella saletta dell'host non c'è «" + nome + "»");
      var gio = [].concat(vm(C).posti || [], vm(C).giocatori || [], vm(C).players || []).filter(function (g) { return g && g.nome === nome; })[0];
      if (!gio || JSON.stringify(gio.omino) !== JSON.stringify(L.SGOmino.casuale(nome))) no("l'avatar che vede l'host non è quello dell'anteprima");
      return "nomi proposti: " + Object.keys(visti).join(", ") + "; è entrato «" + nome + "» con l'avatar dell'anteprima";
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
    } }
  };

  W.COPIONE = {
    esiti: [], scenari: SCENARI,
    prova: async function (n) {
      await carica(); pulisci();
      var s = SCENARI[n], t0 = Date.now(), r;
      try { r = n + " OK · " + s.nome + " · " + (await s.fai()); }
      catch (e) { r = n + " NO · " + s.nome + " · " + (e && e.message || e); }
      var err = W.erroriTel(); if (err.length) r += " · errori: " + err.slice(0, 3).join(" / ");
      r += " (" + Math.round((Date.now() - t0) / 1000) + " s)";
      this.esiti = this.esiti.filter(function (x) { return x.indexOf(n + " ") !== 0; }); this.esiti.push(r);
      return r;
    },
    tutti: async function () { for (var k in SCENARI) await this.prova(+k); return this.esiti; }
  };
})();
