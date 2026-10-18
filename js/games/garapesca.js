/* =========================================================
   SPeeD GAME — GARA DI PESCA (online, ognuno dal suo telefono)
   Tutti pescano nello stesso laghetto per 1, 2, 3, 5 o 10 minuti: vince chi pesca più chili.
   Si pesca con lo schermo della pesca (js/pesca.js, modo gara): canna e lombrichi uguali
   per tutti e senza limite, niente album né cesto. Ogni pesce preso va all'host, che tiene
   la classifica e il tempo e manda a tutti la "foto" (vm). Fatto dal modello dei giochi online.
   ========================================================= */
(function () {
  "use strict";

  var ID = "garapesca";
  var MIN = 2, MAX = 8;
  var DURATE = [[60, "1 min"], [120, "2 min"], [180, "3 min"], [300, "5 min"], [600, "10 min"]];

  // ---- il cronista della gara: {n} = chi, {p} = il pesce, {cm} = quanto è lungo, {kg} = quanto pesa ----
  var CRONACA = {
    via: [
      "🎣 Via! Lenze in acqua!", "🎣 Si comincia: buona pesca a tutti!", "🎣 Pronti, lancio… via!", "🎣 La gara è aperta: che vinca il pescatore migliore!",
      "🎣 Il laghetto è tutto vostro: via!", "🎣 Cronometro partito: lanciate!", "🎣 Silenzio, i pesci ascoltano… via!", "🎣 Ami pronti? Gara cominciata!"
    ],
    primo: [
      "🐟 Primo pesce della gara: {n} prende {p}!", "🐟 Rompe il ghiaccio {n}: {p} da {cm} cm!", "🐟 {n} apre le danze con {p}!",
      "🐟 Il primo è di {n}: {p}!", "🐟 {n} non perde tempo: subito {p}!", "🐟 Si sblocca la gara: {p} per {n}!"
    ],
    sorpasso: [
      "🔝 Sorpasso! {n} va in testa!", "👑 {n} si prende il primo posto!", "🔝 Cambio al comando: ora guida {n}!", "👑 {n} sale in vetta alla classifica!",
      "🔝 {n} passa davanti a tutti con {p}!", "👑 Nuovo capolista: {n}!", "🔝 Colpo di scena: {n} è primo!", "👑 {n} comanda la gara!",
      "🔝 {n} mette la freccia e sorpassa!", "👑 Occhio a {n}: adesso è davanti!"
    ],
    r2: [
      "{n} ha preso: {p} da {cm} cm!", "Bel colpo di {n}: {p} da {cm} cm!", "{n} tira su {p} da {cm} cm!", "Che bestia! {n} prende {p} da {cm} cm!",
      "{n} non scherza: {p} da {cm} cm!", "Bella presa di {n}: {p}!", "{p} da {cm} cm nel secchio di {n}!", "{n} fa sul serio: {p} da {cm} cm!",
      "Applausi per {n}: {p} da {cm} cm!", "{n} ci sa fare: {p}!"
    ],
    r3: [
      "🤩 Che colpo! {n} prende {p} da {cm} cm!", "🤩 Pesce raro per {n}: {p}!", "🤩 Incredibile: {n} ha preso {p}!", "🤩 {n} fa il colpaccio: {p} da {cm} cm!",
      "🤩 Tutti a guardare {n}: {p}!", "🤩 Rarissimo! {p} per {n}!", "🤩 {n} pesca un {p} da {cm} cm, che fortuna!", "🤩 Roba da fotografia: {p} di {n}!"
    ],
    r4: [
      "🌟 LEGGENDARIO! {n} ha preso {p}!", "🌟 Non ci posso credere: {p} per {n}!", "🌟 {n} entra nella leggenda: {p} da {cm} cm!",
      "🌟 Il laghetto trema: {n} prende {p}!", "🌟 Pesce leggendario per {n}: {p}, {kg}!", "🌟 Storico! {n} tira su {p}!"
    ],
    ultimi30: [
      "⏳ Ultimi 30 secondi: ogni pesce conta!", "⏳ Mancano 30 secondi: ancora un lancio!", "⏳ 30 secondi alla fine: tutto può cambiare!",
      "⏳ Ultimi 30 secondi: i pesci grossi sono lì!", "⏳ Mezzo minuto: forza, ancora uno!"
    ],
    ultimi10: [ "⏳ Ultimi 10 secondi!", "⏳ 10 secondi: ultimo lancio!", "⏳ 10 secondi alla fine: tirate su!" ],
    // chi passa in testa quando l'obiettivo non è «più chili» ({s} = quante specie, {c} = quanti pesci)
    sorpassoLungo: [
      "📏 {n} ha il pesce più lungo: {p} da {cm} cm!", "📏 Nuovo record di lunghezza: {cm} cm per {n}!", "📏 {n} passa in testa con {p} da {cm} cm!",
      "📏 Metro alla mano: ora comanda {n} ({cm} cm)!", "📏 Che bestione! {n} va in testa con {cm} cm!"
    ],
    sorpassoSpecie: [
      "🐠 {n} passa in testa: {s} specie diverse!", "🐠 Che collezione! {n} è primo con {s} specie!", "🐠 {n} aggiunge {p} e va in testa ({s} specie)!",
      "🐠 Nuovo capolista: {n}, {s} specie diverse!", "🐠 {n} conosce tutto il laghetto: {s} specie, primo posto!"
    ],
    sorpassoPesci: [
      "🔢 {n} va in testa: {c} pesci!", "🔢 {n} non si ferma più: {c} pesci, è primo!", "🔢 Sorpasso a colpi di pesci: {n} a quota {c}!",
      "🔢 {n} è il più veloce: {c} pesci e primo posto!", "🔢 Un pesce dopo l'altro: {n} comanda con {c}!"
    ]
  };
  // 🎯 l'obiettivo della gara (lo sceglie l'host); a parità vince sempre chi ha più chili
  var OBIETTIVI = {
    kg: { ico: "⚖️", nome: "Più chili", frase: "vince chi pesca più chili", cronaca: "sorpasso" },
    lungo: { ico: "📏", nome: "Il pesce più lungo", frase: "vince il pesce più lungo", cronaca: "sorpassoLungo" },
    specie: { ico: "🐠", nome: "Più specie diverse", frase: "vince chi prende più specie diverse", cronaca: "sorpassoSpecie" },
    pesci: { ico: "🔢", nome: "Più pesci", frase: "vince chi prende più pesci", cronaca: "sorpassoPesci" }
  };
  function ob(id) { return OBIETTIVI[id] ? id : "kg"; }
  // il valore che conta per l'obiettivo (p: un giocatore della foto o della classifica: kg, n, lungo { cm }, sp = quante specie)
  function valore(p, o) {
    if (!p) return 0;
    if (o === "lungo") return p.lungo ? p.lungo.cm || 0 : 0;
    if (o === "specie") return p.sp || 0;
    if (o === "pesci") return p.n || 0;
    return p.kg || 0;
  }
  function testoVal(p, o) {   // «📏 64 cm», «🐠 5 specie», «🔢 7 pesci» (più chili: «3,25 kg» come sempre)
    if (o === "lungo") return "📏 " + (p && p.lungo ? fmtN(p.lungo.cm) + " cm" : "—");
    if (o === "specie") return "🐠 " + (p && p.sp || 0) + " specie";
    if (o === "pesci") { var c = p && p.n || 0; return "🔢 " + fmtN(c) + (c === 1 ? " pesce" : " pesci"); }
    return kg(p && p.kg);
  }
  function confronta(a, b, o) { return (a.uscito ? 1 : 0) - (b.uscito ? 1 : 0) || valore(b, o) - valore(a, o) || (b.kg || 0) - (a.kg || 0); }
  function frase(tipo, v) {
    var l = CRONACA[tipo] || [""], s = l[Math.floor(Math.random() * l.length)];
    v = v || {}; return s.replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ""; });
  }

  function fmtN(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }   // 1.000
  function kg(n) { return window.SGPesca ? SGPesca.kg(n) : fmtN(n) + " kg"; }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function audio() { try { return (window.SG && SG.audioCtx && SG.audioCtx()) || null; } catch (e) { return null; } }
  function nomePesce(id) { var sp = window.SGPesca && SGPesca.pesce(id); return sp ? sp.nome : "pesce"; }
  function minuti(sec) { var m = Math.round(sec / 60); return m === 1 ? "1 minuto" : m + " minuti"; }
  function chiave() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }   // ogni pesce ha la sua: mai contato due volte
  function ordina(l, o) {   // chi esce apposta finisce in fondo; gli altri secondo l'obiettivo (a parità, chi ha più chili)
    return l.slice().sort(function (a, b) { return confronta(a, b, ob(o)); });
  }
  function righe(players, mioId, o) {   // la classifica dal vivo (chi è uscito apposta resta, in fondo, con la porta)
    return ordina(players, o).map(function (p) { return { nome: p.nome + (p.uscito ? " 🚪" : ""), kg: p.kg || 0, n: p.n || 0, sp: p.sp || 0, lungo: p.lungo || null, tu: p.id === mioId }; });
  }

  // =========================================================
  //  HOST: tiene la gara vera (tempo e chili) e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, durata: imp.durata || 180, obiettivo: ob(imp.obiettivo), fineT: 0, classifica: null, premi: null, motivo: null, ultimo: null, nUlt: 0, gara: 0, timer: [], tick: null,
      coda: [],   // chi è arrivato a gara iniziata o con la saletta piena: entra appena può
      players: [nuovo("host", nomeHost, t.mioOmino(nomeHost))] };
    function nuovo(id, nome, omino) { return { id: id, nome: nome, omino: omino, kg: 0, n: 0, best: null, lungo: null, sp: 0, visti: {}, specie: {} }; }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via && !p.uscito; }); }
    function inGara() { return H.players.filter(function (p) { return !p.uscito; }); }   // chi è caduto per la rete conta ancora (può tornare)
    function ferma() { H.timer.forEach(clearTimeout); H.timer = []; clearInterval(H.tick); H.tick = null; }
    // chi può prendere un posto (nella Sala, se l'host ha scelto chi gioca, gli altri guardano)
    function siede(id, nome) { return !t.puoSedersi || t.puoSedersi(id, nome); }
    function riempi() {   // in saletta: chi aspettava entra, finché c'è posto (chi non è tra chi gioca resta a guardare)
      if (H.fase !== "lobby") return;
      H.coda = H.coda.filter(function (c) {
        if (pById(c.id)) return false;
        if (H.players.length >= MAX || !siede(c.id, c.nome)) return true;
        H.players.push(nuovo(c.id, c.nome, c.omino)); return false;
      });
    }
    function avviso(testo, chi) { H.ultimo = { s: ++H.nUlt, chi: chi || null, testo: testo, at: Date.now() }; }

    // ---- la ripresa (l'host ha ricaricato la pagina o l'app si è chiusa): la gara riprende col tempo che restava + 5 s,
    // stessi chili e stessi pesci, stesso 🎯 obiettivo. Gli amici rientrano da soli (stesso id): nessuno è messo "via"
    var CAMPI = ["fase", "durata", "obiettivo", "fineT", "classifica", "premi", "motivo", "gara", "nUlt", "coda", "players"];
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.garapesca, ricordata = !!RIP;
    if (RIP) {
      CAMPI.forEach(function (k) { if (RIP[k] !== undefined) H[k] = RIP[k]; });
      H.players.forEach(function (p) { p.visti = p.visti || {}; p.specie = p.specie || {}; });
      if (H.fase === "gioco") {
        var resta = Math.max(0, (t.ripresa.ora(H.fineT) || 0) - Date.now());
        H.fineT = Date.now() + resta + 5000;
        avviso("🔁 Gara ripresa: lenze di nuovo in acqua!");
      }
    }
    function ricorda() {   // a ogni foto (il core salva al massimo ogni mezzo secondo); in saletta non c'è niente da riprendere
      if (!t.ricorda) return;
      if (H.fase === "lobby") { if (ricordata) { ricordata = false; t.ricorda(null); } return; }
      var o = {}; CAMPI.forEach(function (k) { o[k] = H[k]; });
      ricordata = true; t.ricorda({ garapesca: JSON.parse(JSON.stringify(o)) });   // (una copia: i chili cambiano prima che il core salvi)
    }

    // "⚙️ Regole" nella saletta: l'host cambia la durata e l'obiettivo quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.durata = im.durata || 180; H.obiettivo = ob(im.obiettivo); bd(); };
    t.onRivincita = function () { if (H.fase === "fine") nuova(); };   // la Rivincita: tutti di nuovo nella saletta

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onErrore: function () { ferma(); chiudiSchermo(); errore(t, "Problema di collegamento: la stanza non si apre. Riprova."); },   // (solo se il primo collegamento non riesce)
      onAddio: function (id) {
        var p = pById(id);
        if (!p) { var n0 = H.coda.length; H.coda = H.coda.filter(function (c) { return c.id !== id; }); if (H.coda.length !== n0) bd(); return; }
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); riempi(); bd(); return; }
        p.via = true;   // a gara iniziata resta in classifica coi suoi chili
        if (H.fase === "gioco" && inGara().length < MIN) return fine("soli");   // tutti gli altri sono usciti apposta
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        var p = pById(id);
        if (m.t === "join") {
          if (p) { p.via = false; p.uscito = false; }   // è tornato (stesso id): riprende, anche se si guarda la classifica
          else if (H.fase === "lobby" && H.players.length < MAX && siede(id, m.nome)) H.players.push(nuovo(id, String(m.nome || "Amico").slice(0, 16), avatarValido(m.omino)));
          else if (!H.coda.some(function (c) { return c.id === id; })) H.coda.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino) });
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          return;
        }
        if (!p) return;
        if (m.t === "esco") { if (H.fase !== "lobby") p.uscito = true; return; }   // esce apposta (poi arriva l'addio)
        if (H.fase !== "gioco") return;
        if (m.t === "preso" && preso(id, m)) bd();
        if (m.t === "prese" && Array.isArray(m.lista)) {   // le prese che l'host non aveva ricevuto (era senza rete)
          var ok = false; m.lista.slice(0, 300).forEach(function (f) { if (preso(id, f || {})) ok = true; });
          if (ok) bd();
        }
      }
    }, { ripresa: !!RIP });   // (ripresa: gli amici restano nel laghetto, non tornano in saletta)
    // la "foto" per tutti: SEMPRE con gli id; il tempo come "quanto manca" (gli orologi dei telefoni non sono uguali)
    function vm() {
      var u = H.ultimo;
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, durata: H.durata, obiettivo: H.obiettivo, gara: H.gara, resta: H.fase === "gioco" ? Math.max(0, H.fineT - Date.now()) : 0,
        classifica: H.classifica, premi: H.fase === "fine" ? H.premi : undefined, motivo: H.motivo, coda: H.coda.map(function (c) { return c.id; }),
        guardano: H.coda.filter(function (c) { return !siede(c.id, c.nome); }).map(function (c) { return c.id; }),   // (di questi: chi non è tra chi pesca, guarda)
        ultimo: u ? { s: u.s, chi: u.chi, testo: u.testo, eta: Date.now() - u.at } : null,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, kg: Math.round((p.kg || 0) * 100) / 100, n: p.n || 0, best: p.best, lungo: p.lungo || null, sp: p.sp || 0, via: !!p.via, uscito: !!p.uscito, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }) };
    }
    function bd() { ricorda(); var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); }

    // ----- la gara -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.players = presenti(); H.players.forEach(function (p) { p.kg = 0; p.n = 0; p.best = null; p.lungo = null; p.sp = 0; p.visti = {}; p.specie = {}; p.uscito = false; });
      H.fase = "gioco"; H.gara++; H.classifica = null; H.motivo = null; H.fineT = Date.now() + H.durata * 1000 + 1500;
      avviso(frase("via") + " 🎯 Oggi " + OBIETTIVI[H.obiettivo].frase + "!");   // l'obiettivo della gara, detto a tutti all'inizio
      orologi();
      bd();
    }
    // il tempo della gara: la fine e gli avvisi degli ultimi secondi (da H.fineT: vale anche per la gara ripresa)
    function orologi() {
      ferma();
      H.tick = setInterval(bd, 5000);   // ogni tanto il tempo giusto a tutti
      var tot = Math.max(0, H.fineT - Date.now());
      H.timer.push(setTimeout(function () { fine("tempo"); }, tot));
      if (H.durata >= 60 && tot > 30000) H.timer.push(setTimeout(function () { avviso(frase("ultimi30")); bd(); }, tot - 30000));
      if (tot > 10000) H.timer.push(setTimeout(function () { avviso(frase("ultimi10")); bd(); }, tot - 10000));
    }
    // chi è in testa per l'obiettivo della gara (a parità, chi ha più chili)
    function capo() { var c = null; H.players.forEach(function (p) { if (valore(p, H.obiettivo) > 0 && (!c || confronta(p, c, H.obiettivo) < 0)) c = p; }); return c; }
    function preso(id, m) {   // un pesce preso da qualcuno (anche dall'host): true se conta
      var p = pById(id), sp = window.SGPesca && SGPesca.pesce(String(m.id || ""));
      if (!p || !sp || H.fase !== "gioco" || Date.now() > H.fineT + 1500 || p.n >= H.durata) return false;
      var k = String(m.k || "").slice(0, 24); if (k) { if (p.visti[k]) return false; p.visti[k] = 1; }
      // l'host ricalcola il peso (stessa formula del laghetto), coi cm dentro la misura di quel pesce
      var cm = Math.max(sp.cm[0], Math.min(sp.cm[1], Math.round(+m.cm || 0))), w = SGPesca.pesoKg(sp, cm);
      var prima = capo(), nessuno = !H.players.some(function (q) { return q.n > 0; });
      p.kg = (p.kg || 0) + w; p.n = (p.n || 0) + 1; p.specie[sp.id] = (p.specie[sp.id] || 0) + 1; p.sp = Object.keys(p.specie).length;
      if (!p.best || w > p.best.kg) p.best = { id: sp.id, cm: cm, kg: w };
      if (!p.lungo || cm > p.lungo.cm) p.lungo = { id: sp.id, cm: cm };   // il pesce più lungo (non sempre è il più pesante)
      var v = { n: p.nome, p: sp.nome, cm: cm, kg: kg(w), s: p.sp, c: p.n }, ora = capo();
      if (sp.r >= 4) avviso(frase("r4", v), id);
      else if (ora === p && prima && prima !== p) avviso(frase(OBIETTIVI[H.obiettivo].cronaca, v), id);   // il cronista: passa in testa per l'obiettivo della gara
      else if (nessuno) avviso(frase("primo", v), id);
      else if (sp.r >= 2) avviso(frase(sp.r >= 3 ? "r3" : "r2", v), id);
      return true;
    }
    function premi(ord) {   // i premi simpatici della fine
      var l = [], piu = null, tanti = null, alb = null;
      ord.filter(function (p) { return !p.uscito; }).forEach(function (p) {   // i premi vanno a chi è rimasto fino alla fine
        if (p.best && (!piu || p.best.kg > piu.best.kg)) piu = p;
        if (p.n && (!tanti || p.n > tanti.n)) tanti = p;
        var a = (p.specie && p.specie.alborella) || 0; if (a >= 3 && (!alb || a > alb.a)) alb = { p: p, a: a };
      });
      if (piu) l.push({ ico: "🐋", tit: "Pesce più grosso", chi: piu.nome, cosa: nomePesce(piu.best.id) + " · " + piu.best.cm + " cm · " + kg(piu.best.kg), pesce: piu.best.id });
      if (tanti && tanti.n >= 2 && H.obiettivo !== "pesci") l.push({ ico: "🎣", tit: "Più pesci presi", chi: tanti.nome, cosa: tanti.n + " pesci" });   // (con «più pesci» lo dice già il podio)
      if (alb) l.push({ ico: "👑", tit: "Re delle alborelle", chi: alb.p.nome, cosa: alb.a + " alborelle" });
      else if (tanti) { var zero = ord.filter(function (p) { return !p.n && !p.uscito; })[0]; if (zero) l.push({ ico: "🪱", tit: "Lombrico d'oro", chi: zero.nome, cosa: "nessun pesce, ma tanta pazienza" }); }
      return l.slice(0, 3);
    }
    function fine(motivo) {
      if (H.fase !== "gioco") return;
      ferma();
      var ord = ordina(H.players, H.obiettivo);
      // secondo l'obiettivo della gara (a parità, chi ha più chili); pari merito = stesso posto; chi è uscito apposta viene dopo tutti quelli rimasti
      H.classifica = ord.map(function (p) {
        return { id: p.id, nome: p.nome, omino: p.omino || null, uscito: !!p.uscito, kg: Math.round((p.kg || 0) * 100) / 100, n: p.n || 0, best: p.best, lungo: p.lungo || null, sp: p.sp || 0,
          pos: 1 + ord.filter(function (q) { return confronta(q, p, H.obiettivo) < 0; }).length };
      });
      H.premi = premi(ord);
      H.motivo = motivo || "tempo"; H.fase = "fine"; bd();
      // torneo online e XP: i NOMI dei giocatori col loro posto (pari merito = stesso posto)
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova gara": stessa stanza, stessi amici (più chi aspettava), tutti tornano nella saletta (MAI chiudere e riaprire la stanza)
    function nuova() {
      ferma(); H.fase = "lobby"; H.classifica = null; H.premi = null; H.motivo = null; H.ultimo = null;
      H.players = presenti(); H.players.forEach(function (p) { p.kg = 0; p.n = 0; p.best = null; p.lungo = null; p.sp = 0; });
      riempi(); bd();
    }

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova,
      onPreso: function (f) { if (preso("host", { id: f.id, cm: f.cm, k: chiave() })) bd(); },
      onEsci: function () {
        function via() { ferma(); rete.chiudi(); chiudiSchermo(); t.esci(); }
        if (H.fase === "gioco" && UI && UI._gara) return UI._gara.chiedi("Chiudere la gara per tutti?", "Gli amici escono dalla gara.", "🏠 Chiudi ed esci", via);   // un tocco sbagliato non chiude la gara a tutti
        via();
      } };
    if (RIP && H.fase === "gioco") orologi();   // la gara ripresa: il tempo che restava (+ 5 s)
    bd();
  }

  // =========================================================
  //  OSPITE: pesca sul suo telefono, manda all'host i pesci presi
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null, gara: null, prese: [], base: null, inviato: 0 };
    var cb = { sonoHost: false, myId: null,
      onPreso: function (f) {   // ogni pesce ha la sua chiave: se l'host non l'ha avuto, si rimanda (e non si conta due volte)
        var x = { id: f.id, cm: f.cm, k: chiave() }; S.prese.push(x); S.inviato = Date.now();
        if (S.rete) S.rete.invia({ t: "preso", id: x.id, cm: x.cm, k: x.k });
      },
      onEsci: function () {
        function via() { if (S.rete) { S.rete.invia({ t: "esco" }); S.rete.chiudi(); } chiudiSchermo(); t.esci(); }
        if (S.vm && S.vm.fase === "gioco" && UI && UI._gara) return UI._gara.chiedi("Uscire dalla gara?", "Gli altri continuano a pescare senza di te.", "🏠 Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🎣", titolo: "Entra nella gara", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function controllaPrese(vm) {   // l'host ha meno pesci di quelli che ho mandato? (era senza rete) li rimando tutti
      if (vm.gara !== S.gara) { S.gara = vm.gara; S.prese = []; S.base = null; }
      if (vm.fase !== "gioco") return;
      var io = null; vm.players.forEach(function (p) { if (p.id === S.myId) io = p; });
      if (!io) return;
      if (S.base == null) S.base = Math.max(0, io.n - S.prese.length);
      if (io.n < S.base + S.prese.length && Date.now() - S.inviato > 4000 && S.rete) { S.inviato = Date.now(); S.rete.invia({ t: "prese", lista: S.prese.slice(-300) }); }
    }
    function collega() {
      vista = null; attesa("Collegamento in corso…");
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; controllaPrese(m.vm); disegna(t, m.vm, cb); }
        },
        onChiuso: function () {
          if (S.vm && S.vm.fase === "fine" && (finale0 || String(vista).indexOf("fine:") === 0)) {   // sulla classifica finale la classifica resta: cambia solo la scritta
            [].forEach.call(document.querySelectorAll(".modulo-nota"), function (p) { if (/Se l'host fa un'altra gara/.test(p.textContent)) p.textContent = "🚪 L'host ha chiuso la gara."; });
            return;
          }
          chiudiSchermo(); errore(t, "La gara è stata chiusa dall'host.");
        },   // (chiusa apposta: se l'host sparisce, "La stanza è chiusa" lo dice il core)
        onErrore: function () { chiudiSchermo(); errore(t, "Problema di collegamento. Riprova."); }   // (solo se il primo collegamento non riesce)
      });
    }
    function attesa(testo) {
      var s = t.schermata({ icona: "🎣", titolo: "⏳ Sto entrando…", sotto: "Gara di pesca · stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: testo }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti): saletta, il laghetto della gara, la classifica finale
  // =========================================================
  // lo schermo della pesca si crea UNA volta e poi si aggiorna (tempo, classifica, avvisi);
  // "vista" ricorda cosa c'è sullo schermo, così le foto uguali non rifanno niente (niente lampeggio)
  var UI = null, finale0 = null, vista = null, ultimoVm = null, ultimoCb = null, FINE_AT = 0, TIC = null;
  function chiudiSchermo() { if (UI && UI._chiudi) UI._chiudi(); UI = null; clearTimeout(finale0); finale0 = null; clearInterval(TIC); TIC = null; vista = null; FU = null; }
  function disegna(t, vm, cb) {
    ultimoVm = vm; ultimoCb = cb;
    var io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    var inCoda = (vm.coda || []).indexOf(cb.myId) >= 0, guardo = (vm.guardano || []).indexOf(cb.myId) >= 0;   // guardo: non sono tra chi pesca (Sala)
    if (vm.fase === "lobby") {
      if (UI || finale0 || FU) chiudiSchermo();
      if (!io && !cb.sonoHost && !guardo && !t.guarda) return fuori(t, inCoda ? "pieno" : "entro", vm, cb);   // (chi guarda sta nella saletta con gli altri)
      vista = "lobby"; return lobby(t, vm, cb);
    }
    if (vm.fase === "fine") {
      if (UI && UI._gara) {   // si vede ancora un attimo il lago, poi la classifica
        if (finale0) return;
        UI._gara.ferma(vm.motivo === "soli" ? "🏁 Gli altri sono usciti: gara finita!" : "⏱️ Tempo scaduto!");
        statoLago(vm, cb);
        finale0 = setTimeout(function () { chiudiSchermo(); finale(t, ultimoVm, ultimoCb); }, 1800);
        return;
      }
      if (finale0) return;
      return finale(t, vm, cb);
    }
    if (!io) return fuori(t, t.guarda ? "link" : guardo ? "garaS" : "gara", vm, cb);   // arrivato a gara iniziata (o non è tra chi pesca): aspetta la prossima (è nella lista dell'host)
    if (!UI) {
      if (!window.SGPesca) return errore(t, "Manca il laghetto: aggiorna l'app.");
      UI = SGPesca.crea({ omino: t.mioOmino(io.nome), audio: audio, indietro: cb.onEsci, gara: { onPreso: function (f) {
        segnaMio(f); cb.onPreso(f);
        // (il laghetto riscrive in alto i miei chili subito dopo: con un altro obiettivo ci rimetto il valore giusto prima che si veda)
        if (window.Promise) Promise.resolve().then(sistemaTesta);
      } } });
      t.mostra(UI); UI._monta(); vista = "lago";
      var ai = UI.querySelector(".pe-aiuto"), o0 = ob(vm.obiettivo);   // il primo aiuto dice l'obiettivo della gara
      if (ai && o0 !== "kg") ai.textContent = "Tieni premuto per lanciare: " + OBIETTIVI[o0].frase + "!";
      TIC = setInterval(ticchetta, 200);
    }
    FINE_AT = Date.now() + (vm.resta || 0);
    statoLago(vm, cb, true);
  }
  function statoLago(vm, cb, conAvviso) {
    var o = ob(vm.obiettivo), r = righe(vm.players, cb.myId, o), u = vm.ultimo;
    if (vm.gara !== MIO.gara) MIO = { gara: vm.gara, lungo: null, specie: {}, n: 0 };   // gara nuova: i miei pesci ripartono da zero
    UI._gara.stato({ fineAt: conAvviso ? FINE_AT : 0, righe: r,
      avviso: conAvviso && u && u.chi !== cb.myId && (u.eta || 0) < 5000 ? u : null });   // un avviso vecchio (chi rientra) non si rivede
    tuInClassifica(r, o);
    sistemaTesta();
  }
  // la classifica in alto mostra 4 righe: se sei più giù, l'ultima diventa la tua (col tuo posto vero).
  // Il laghetto le scrive in chili: con un altro obiettivo ci scrivo il valore giusto («📏 64 cm», «🐠 5 specie», «🔢 7 pesci»)
  function tuInClassifica(r, o) {
    var box = UI && UI.querySelector && UI.querySelector(".pe-classi"), i = -1;
    if (!box) return;
    r.forEach(function (x, j) { if (x.tu) i = j; });
    if (o !== "kg") [].forEach.call(box.children, function (riga, j) {
      var x = r[j]; if (!x || j > 3) return;
      var tx = (j + 1) + ". " + (x.tu ? "Tu" : x.nome) + " · " + testoVal(x, o);
      if (riga.textContent !== tx) riga.textContent = tx;
    });
    if (i < 4 || box.children.length < 4) return;
    var ult = box.children[3]; ult.className = "pe-cl tu"; ult.textContent = (i + 1) + ". Tu · " + testoVal(r[i], o);
  }
  // i miei pesci di questa gara, contati anche qui: così il numero in alto cambia subito, senza aspettare la foto dell'host
  var MIO = { gara: null, lungo: null, specie: {}, n: 0 };
  function segnaMio(f) {
    if (!f) return;
    MIO.n++; MIO.specie[f.id] = 1;
    if (!MIO.lungo || f.cm > MIO.lungo.cm) MIO.lungo = { id: f.id, cm: f.cm };
  }
  // in alto (accanto al tempo) il laghetto scrive i miei chili: con un altro obiettivo ci va il mio valore per quell'obiettivo
  function sistemaTesta() {
    var vm = ultimoVm, cb = ultimoCb; if (!UI || !vm || !cb) return;
    var o = ob(vm.obiettivo); if (o === "kg") return;
    var chip = UI.querySelector(".pe-testa .pe-chip"); if (!chip) return;
    var io = null; (vm.players || []).forEach(function (p) { if (p.id === cb.myId) io = p; });
    var mio = { n: Math.max(io ? io.n || 0 : 0, MIO.n), sp: Math.max(io ? io.sp || 0 : 0, Object.keys(MIO.specie).length),
      lungo: (io && io.lungo && (!MIO.lungo || io.lungo.cm >= MIO.lungo.cm)) ? io.lungo : MIO.lungo };
    var tx = "🏆 " + testoVal(mio, o);
    if (chip.textContent !== tx) chip.textContent = tx;
  }
  var ultimoSec = -1;
  function ticchetta() {   // gli ultimi 5 secondi: un tic a ogni secondo
    if (UI && !document.body.contains(UI)) return chiudiSchermo();   // il core ci ha portati via (la Sala passata a un amico, «Cambia gioco»): via il lago e i tic
    var r = Math.ceil((FINE_AT - Date.now()) / 1000);
    if (r === ultimoSec) return; ultimoSec = r;
    if (r < 1 || r > 5 || !UI) return;
    try { if (localStorage.getItem("sg-pe-suoni") === "0") return; } catch (e) {}
    var c = audio(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), a = c.currentTime;
      o.type = "triangle"; o.frequency.setValueAtTime(r === 1 ? 1320 : 990, a);
      g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(0.08, a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + 0.12);
      o.connect(g); g.connect(c.destination); o.start(a); o.stop(a + 0.15);
    } catch (e) {}
  }
  function lobby(t, vm, cb) {
    var n = (vm.coda || []).length;
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN, spettatore: t.guarda ? "👀 Guardi soltanto" : false,   // (chi guarda col link)
      vuoti: Math.max(0, MIN - vm.players.length),   // solo i posti che mancano per cominciare
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota", text: "🎣 Gara di " + minuti(vm.durata) + " nel laghetto: 🎯 " + OBIETTIVI[ob(vm.obiettivo)].frase + (ob(vm.obiettivo) !== "kg" ? " (a parità, chi ha più chili)" : "") + ". Canna e lombrichi uguali per tutti." + (n ? " (Stanza piena: " + n + (n === 1 ? " aspetta" : " aspettano") + " un posto.)" : "") })],
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  // chi non è (ancora) nella gara: un cartello, rifatto solo se cambia. Le parole sono quelle della saletta del core
  // ("⏳ Sto entrando…", "👀 … la guardi ed entri alla prossima"). Chi arriva a gara cominciata la guarda:
  // tempo e classifica dal vivo (si aggiorna solo il testo) e la fila delle faccine
  var FU = null;   // il cartello "gara in corso": { tempo, lista }
  function fuori(t, tipo, vm, cb) {
    if (UI) return;
    if (vista === "fuori-" + tipo) return aggFuori(vm, cb);
    chiudiSchermo(); vista = "fuori-" + tipo; FU = null;
    var T = { gara: ["👀 Gara in corso", "La guardi ed entri alla prossima", "Quando l'host fa un'altra gara entri da solo nella saletta."],
      garaS: ["👀 Gara in corso", "Questa volta pescano gli altri", "Intanto guardi la classifica e fai il tifo!"],
      link: ["👀 Gara in corso", "Guardi la gara", "Quando l'host fa un'altra gara entri anche tu nella saletta."],   // (chi guarda col link)
      pieno: ["Stanza piena", "Al massimo " + MAX + " pescatori", "Ci sono già " + MAX + " pescatori: appena si libera un posto entri da solo."],
      entro: ["⏳ Sto entrando…", "Gara di pesca", "Un attimo: l'host ti sta facendo entrare."] }[tipo];
    var s = t.schermata({ icona: "🎣", titolo: T[0], sotto: T[1] });
    var link = tipo === "link";   // chi guarda col link: faccine e uscita nella targhetta del core (la schermata le lascia il posto)
    if (link) { stile(); s.classList.add("gp-targa"); }
    if (tipo === "gara" || tipo === "garaS" || link) {
      stile();
      FU = { tempo: t.el("div", { class: "gp-guarda-tempo" }), lista: t.el("ol", { class: "gp-resto gp-guarda" }) };
      s._contenuto.appendChild(FU.tempo); s._contenuto.appendChild(FU.lista);
      TIC = setInterval(function () { if (FU && !document.body.contains(FU.tempo)) return chiudiSchermo(); if (FU) scriviTempo(); }, 1000);
    }
    s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:" + (tipo === "gara" || link ? "10px" : "24px"), text: T[2] }));
    if (tipo !== "entro" && !link) { var f = t.faccine && t.faccine(); if (f) { f.style.margin = "12px auto 0"; f.style.maxWidth = "320px"; s._contenuto.appendChild(f); } }   // si aspetta a lungo: le faccine
    if (!link) s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: ultimoCb && ultimoCb.onEsci || t.esci }));
    t.mostra(s);
    aggFuori(vm, cb);
  }
  function scriviTempo() {
    var r = Math.max(0, Math.ceil((FINE_AT - Date.now()) / 1000)), tx = "⏱️ " + Math.floor(r / 60) + ":" + ("0" + r % 60).slice(-2);
    if (FU.tempo.textContent !== tx) FU.tempo.textContent = tx;
  }
  function aggFuori(vm, cb) {   // chi guarda: solo i testi che cambiano (niente lampeggio)
    if (!FU || !vm || !cb) return;
    FINE_AT = Date.now() + (vm.resta || 0); scriviTempo();
    var o = ob(vm.obiettivo), r = righe(vm.players, cb.myId, o).slice(0, 8), li = FU.lista.children;
    while (li.length > r.length) FU.lista.removeChild(FU.lista.lastChild);
    r.forEach(function (x, i) {
      var riga = li[i];
      if (!riga) { riga = document.createElement("li"); riga.appendChild(document.createElement("span")); riga.appendChild(document.createElement("b")); riga.appendChild(document.createElement("span")); FU.lista.appendChild(riga); }
      var c = riga.children, a = (i + 1) + "°", k = testoVal(x, o);
      if (c[0].textContent !== a) c[0].textContent = a;
      if (c[1].textContent !== x.nome) c[1].textContent = x.nome;
      if (c[2].textContent !== k) c[2].textContent = k;
    });
  }
  function stile() {
    if (document.getElementById("gp-stile")) return;
    var st = document.createElement("style"); st.id = "gp-stile";
    st.textContent = [
      ".gp-fin{display:flex;flex-direction:column;gap:10px}",
      ".gp-podio{display:flex;align-items:flex-end;justify-content:center;gap:6px;margin-top:4px}",
      ".gp-gr{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;min-width:0}",
      ".gp-av{display:block;width:50px;height:66px}.gp-av svg{width:100%;height:100%;display:block}",
      ".gp-gr.p1 .gp-av{width:62px;height:80px}",
      ".gp-nm{font-weight:800;font-size:.85rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".gp-kg{font-size:.78rem;opacity:.85;font-weight:700}",
      ".gp-gradino{width:100%;margin-top:4px;border-radius:10px 10px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;font-size:1.3rem;background:var(--carta)}",
      ".gp-gr.p1 .gp-gradino{height:54px;background:linear-gradient(135deg,var(--accento),var(--accento-scuro))}.gp-gr.p2 .gp-gradino{height:38px}.gp-gr.p3 .gp-gradino{height:26px}",
      ".gp-resto{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}",
      ".gp-resto li{display:flex;gap:6px;align-items:center;background:var(--carta);border-radius:10px;padding:5px 9px;font-size:.85rem;min-width:0}",
      ".gp-resto.due{display:grid;grid-template-columns:1fr 1fr}",   // tanti giocatori: due colonne, così la classifica sta nello schermo
      ".gp-resto li b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".gp-premi{display:flex;flex-direction:column;gap:4px}",
      ".gp-premio{display:flex;align-items:center;gap:8px;background:var(--carta);border-radius:12px;padding:4px 10px;font-size:.85rem;line-height:1.2}",
      ".gp-premio .ico{font-size:1.3rem}.gp-premio .tx{flex:1;min-width:0}.gp-premio small{display:block;opacity:.8}",
      ".gp-premio canvas{flex:none}",
      ".gp-guarda-tempo{text-align:center;font-weight:900;font-size:1.6rem;margin:6px 0 10px;font-variant-numeric:tabular-nums}",
      ".gp-guarda li span:last-child{font-weight:800}",
      ".schermata.gp-targa{padding-bottom:calc(60px + env(safe-area-inset-bottom))}",   // (chi guarda col link: il posto della targhetta del core)
      ".gp-piede2{display:flex;gap:8px}.gp-piede2>.btn{flex:1;min-width:0}",
      ".gp-fin.tanti .gp-av{width:40px;height:52px}.gp-fin.tanti .gp-gr.p1 .gp-av{width:50px;height:64px}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function finale(t, vm, cb) {
    finale0 = null;
    var cl = vm.classifica || [], fuoriGara = !cl.some(function (r) { return r.id === cb.myId; }), guardoF = (vm.guardano || []).indexOf(cb.myId) >= 0;
    var firma = "fine:" + vm.gara + ":" + fuoriGara;
    if (vista === firma) return;   // la stessa classifica è già sullo schermo: non si rifà
    clearInterval(TIC); TIC = null; FU = null;   // (chi guardava la gara: il suo orologio si ferma)
    vista = firma; stile();
    var o = ob(vm.obiettivo), OB = OBIETTIVI[o];
    var s = t.schermata({ icona: "🏆", titolo: "Classifica della gara", sotto: (vm.motivo === "soli" ? "Gli altri sono usciti · " : "") + "🎯 " + OB.nome });
    // il valore che conta per l'obiettivo (e, se non sono i chili, i chili sotto: a parità vincono loro)
    function quanto(r, conPesci) { return o === "kg" ? kg(r.kg) + (conPesci && r.n ? " · " + r.n + (r.n === 1 ? " pesce" : " pesci") : "") : testoVal(r, o) + " · " + kg(r.kg); }
    var box = t.el("div", { class: "gp-fin" + (cl.length > 6 ? " tanti" : "") }), med = ["🥇", "🥈", "🥉"];
    function chi(r) { return r.id === cb.myId ? r.nome + " (tu)" : r.nome; }
    // il podio: i primi tre sui gradini (il primo al centro, con le braccia alzate)
    var pod = t.el("div", { class: "gp-podio" }), tre = cl.slice(0, 3);
    [1, 0, 2].forEach(function (i) {
      var r = tre[i]; if (!r) return;
      var av = t.el("span", { class: "gp-av" });
      if (r.omino && window.SGOmino) av.innerHTML = SGOmino.svg(r.omino, { braccia: r.pos === 1 ? "su" : undefined });
      pod.appendChild(t.el("div", { class: "gp-gr p" + Math.min(3, r.pos) }, [ av,
        t.el("span", { class: "gp-nm", text: chi(r) + (r.uscito ? " 🚪" : "") }),
        t.el("span", { class: "gp-kg", text: quanto(r, true) }),
        t.el("div", { class: "gp-gradino", text: med[r.pos - 1] || r.pos + "°" }) ]));
    });
    box.appendChild(pod);
    if (cl.length > 3) {
      var ol = t.el("ol", { class: "gp-resto" + (cl.length > 6 ? " due" : "") });
      cl.slice(3).forEach(function (r) {
        ol.appendChild(t.el("li", null, [ t.el("span", { text: r.pos + "°" }), t.el("b", { text: chi(r) + (r.uscito ? " 🚪 ha lasciato" : "") }), t.el("span", { text: o === "kg" ? kg(r.kg) : testoVal(r, o) }) ]));
      });
      box.appendChild(ol);
    }
    var pr = t.el("div", { class: "gp-premi" });
    (vm.premi || []).forEach(function (p) {
      var riga = t.el("div", { class: "gp-premio" }, [ t.el("span", { class: "ico", text: p.ico }),
        t.el("span", { class: "tx" }, [ t.el("b", { text: p.tit + ": " + p.chi }), t.el("small", { text: p.cosa }) ]) ]);
      var sp = p.pesce && window.SGPesca && SGPesca.pesce(p.pesce);
      if (sp && SGPesca.immaginePesce) { try { riga.appendChild(SGPesca.immaginePesce(sp, 44, 30)); } catch (e) {} }
      pr.appendChild(riga);
    });
    if (pr.children.length) box.appendChild(pr);
    s._contenuto.appendChild(box);
    if (t.guarda) {   // chi guarda col link: faccine e uscita nella targhetta del core; alla gara dopo entra da solo
      s.classList.add("gp-targa");
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin:0", text: "👀 Quando l'host fa un'altra gara entri anche tu nella saletta." }));
      t.mostra(s); return;
    }
    var fac = t.faccine && t.faccine(); if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }   // le faccine anche sulla classifica
    var esci = t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci });
    // i tasti di fine uguali per tutti (Rivincita, Cambia gioco, Ci sto…) li mette il core; se no quelli di sempre
    if (t.tastiFine && t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (!cb.sonoHost && fuoriGara) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin:0", text: guardoF ? "Questa gara l'hai guardata 👀" : "Sei in lista: alla prossima gara entri anche tu!" }));
    }
    else if (cb.sonoHost) s._piede.appendChild(t.el("div", { class: "gp-piede2" }, [t.el("button", { class: "btn btn-primario", text: "↻ Nuova gara", onclick: cb.onNuova }), esci]));   // in una riga: con 8 pescatori la classifica sta nello schermo
    else { s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin:0", text: fuoriGara ? (guardoF ? "Questa gara l'hai guardata 👀" : "Sei in lista: alla prossima gara entri anche tu!") : "Se l'host fa un'altra gara, torni da solo nella saletta." })); s._piede.appendChild(esci); }
    t.mostra(s);
  }
  function errore(t, testo) {
    vista = "errore";
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "La gara di pesca si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  SG.registra({
    id: ID, nome: "Gara di pesca", icona: "🎣",
    descrizione: "Tutti nello stesso laghetto, ognuno dal suo telefono: in pochi minuti vince chi pesca più chili!",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    postiOnline: MAX,   // posti online (8 pescatori)
    ritardatari: "partita",   // chi arriva a gara cominciata la guarda ed entra alla gara dopo
    riprende: true,   // se l'host ricarica la pagina, la gara riprende col tempo che restava (t.ripresa)
    modi: [], soloOnline: true,
    regole: [
      "Ognuno pesca dal suo telefono nello <b>stesso laghetto</b>, da <b>1 a 10 minuti</b> (lo sceglie l'host).",
      "Si pesca come al laghetto: tieni premuto per <b>lanciare</b>, tocca quando il galleggiante <b>va giù</b>, poi tira e molla il filo nella <b>lotta</b>.",
      "Canna e lombrichi sono <b>uguali per tutti</b> e senza limite. Ogni pesce preso vale il suo <b>peso</b>: i pesci grossi del largo valgono tantissimo!",
      "In alto vedi il tempo e la classifica dal vivo. Allo scadere vince chi è primo per l'<b>obiettivo della gara</b> (di solito <b>più chili</b>). Chi esce prima della fine va in fondo alla classifica.",
      "<b>🎯 L'obiettivo della gara</b> lo sceglie l'host: <b>⚖️ più chili</b> (di solito), <b>📏 il pesce più lungo</b>, <b>🐠 più specie diverse</b> o <b>🔢 più pesci</b>. La classifica in alto mostra quello che conta, e <b>a parità vince chi ha più chili</b>."
    ],
    // le regole in una riga, per la saletta: «🎯 vince il pesce più lungo · 3 minuti»
    riassunto: function (imp) { imp = imp || {}; return "🎯 " + OBIETTIVI[ob(imp.obiettivo)].frase + " · " + minuti(imp.durata || 180); },
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      if (dove.durata == null) dove.durata = 180;
      dove.obiettivo = ob(dove.obiettivo);
      // le scelte con bottoni .modo-chip: così l'host le ritrova in "⚙️ Regole" nella saletta
      box.appendChild(el("div", { class: "etichetta", text: "Quanto dura la gara" }));
      var g = el("div", { class: "modo-griglia", style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px" });
      DURATE.forEach(function (x) {
        var b = el("button", { class: "modo-chip" + (dove.durata === x[0] ? " attiva" : ""), style: "justify-content:center;padding:12px 6px", onclick: function () {
          dove.durata = x[0]; [].forEach.call(g.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
        } }, [el("div", { class: "mt", text: x[1] })]);
        g.appendChild(b);
      });
      box.appendChild(g);
      // 🎯 l'obiettivo: chi vince (a parità, sempre chi ha più chili)
      box.appendChild(el("div", { class: "etichetta", text: "🎯 Obiettivo: vince chi ha" }));
      var g2 = el("div", { class: "modo-griglia", style: "display:grid;grid-template-columns:1fr 1fr;gap:8px" });
      Object.keys(OBIETTIVI).forEach(function (k) {
        var O = OBIETTIVI[k];
        var b = el("button", { class: "modo-chip" + (dove.obiettivo === k ? " attiva" : ""), style: "padding:10px 8px", onclick: function () {
          dove.obiettivo = k; [].forEach.call(g2.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
        } }, [ el("span", { class: "mi", text: O.ico }), el("div", {}, [ el("div", { class: "mt", text: O.nome }) ]) ]);
        g2.appendChild(b);
      });
      box.appendChild(g2);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
})();
