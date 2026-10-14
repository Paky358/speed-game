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
    ultimi10: [ "⏳ Ultimi 10 secondi!", "⏳ 10 secondi: ultimo lancio!", "⏳ 10 secondi alla fine: tirate su!" ]
  };
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
  function ordina(l) {   // chi esce apposta finisce in fondo; gli altri dal più chili al meno
    return l.slice().sort(function (a, b) { return (a.uscito ? 1 : 0) - (b.uscito ? 1 : 0) || (b.kg || 0) - (a.kg || 0); });
  }
  function righe(players, mioId) {   // la classifica dal vivo (chi è uscito apposta resta, in fondo, con la porta)
    return ordina(players).map(function (p) { return { nome: p.nome + (p.uscito ? " 🚪" : ""), kg: p.kg || 0, tu: p.id === mioId }; });
  }

  // =========================================================
  //  HOST: tiene la gara vera (tempo e chili) e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, durata: imp.durata || 180, fineT: 0, classifica: null, premi: null, motivo: null, ultimo: null, nUlt: 0, gara: 0, timer: [], tick: null,
      coda: [],   // chi è arrivato a gara iniziata o con la saletta piena: entra appena può
      players: [nuovo("host", nomeHost, t.mioOmino(nomeHost))] };
    function nuovo(id, nome, omino) { return { id: id, nome: nome, omino: omino, kg: 0, n: 0, best: null, visti: {}, specie: {} }; }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via && !p.uscito; }); }
    function inGara() { return H.players.filter(function (p) { return !p.uscito; }); }   // chi è caduto per la rete conta ancora (può tornare)
    function ferma() { H.timer.forEach(clearTimeout); H.timer = []; clearInterval(H.tick); H.tick = null; }
    function riempi() {   // in saletta: chi aspettava entra, finché c'è posto
      while (H.fase === "lobby" && H.coda.length && H.players.length < MAX) { var c = H.coda.shift(); if (!pById(c.id)) H.players.push(nuovo(c.id, c.nome, c.omino)); }
    }
    function avviso(testo, chi) { H.ultimo = { s: ++H.nUlt, chi: chi || null, testo: testo, at: Date.now() }; }

    // "⚙️ Regole" nella saletta: l'host cambia la durata quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.durata = im.durata || 180; bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
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
          else if (H.fase === "lobby" && H.players.length < MAX) H.players.push(nuovo(id, String(m.nome || "Amico").slice(0, 16), avatarValido(m.omino)));
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
    });
    // la "foto" per tutti: SEMPRE con gli id; il tempo come "quanto manca" (gli orologi dei telefoni non sono uguali)
    function vm() {
      var u = H.ultimo;
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, durata: H.durata, gara: H.gara, resta: H.fase === "gioco" ? Math.max(0, H.fineT - Date.now()) : 0,
        classifica: H.classifica, premi: H.fase === "fine" ? H.premi : undefined, motivo: H.motivo, coda: H.coda.map(function (c) { return c.id; }),
        ultimo: u ? { s: u.s, chi: u.chi, testo: u.testo, eta: Date.now() - u.at } : null,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, kg: Math.round((p.kg || 0) * 100) / 100, n: p.n || 0, best: p.best, via: !!p.via, uscito: !!p.uscito, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }) };
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); }

    // ----- la gara -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.players = presenti(); H.players.forEach(function (p) { p.kg = 0; p.n = 0; p.best = null; p.visti = {}; p.specie = {}; p.uscito = false; });
      H.fase = "gioco"; H.gara++; H.classifica = null; H.motivo = null; H.fineT = Date.now() + H.durata * 1000 + 1500;
      avviso(frase("via"));
      H.tick = setInterval(bd, 5000);   // ogni tanto il tempo giusto a tutti
      var tot = H.durata * 1000 + 1500;
      H.timer.push(setTimeout(function () { fine("tempo"); }, tot));
      if (H.durata >= 60) H.timer.push(setTimeout(function () { avviso(frase("ultimi30")); bd(); }, tot - 30000));
      H.timer.push(setTimeout(function () { avviso(frase("ultimi10")); bd(); }, tot - 10000));
      bd();
    }
    function capo() { var c = null; H.players.forEach(function (p) { if ((p.kg || 0) > 0 && (!c || p.kg > c.kg)) c = p; }); return c; }
    function preso(id, m) {   // un pesce preso da qualcuno (anche dall'host): true se conta
      var p = pById(id), sp = window.SGPesca && SGPesca.pesce(String(m.id || ""));
      if (!p || !sp || H.fase !== "gioco" || Date.now() > H.fineT + 1500 || p.n >= H.durata) return false;
      var k = String(m.k || "").slice(0, 24); if (k) { if (p.visti[k]) return false; p.visti[k] = 1; }
      // l'host ricalcola il peso (stessa formula del laghetto), coi cm dentro la misura di quel pesce
      var cm = Math.max(sp.cm[0], Math.min(sp.cm[1], Math.round(+m.cm || 0))), w = SGPesca.pesoKg(sp, cm);
      var prima = capo(), nessuno = !H.players.some(function (q) { return q.n > 0; });
      p.kg = (p.kg || 0) + w; p.n = (p.n || 0) + 1; p.specie[sp.id] = (p.specie[sp.id] || 0) + 1;
      if (!p.best || w > p.best.kg) p.best = { id: sp.id, cm: cm, kg: w };
      var v = { n: p.nome, p: sp.nome, cm: cm, kg: kg(w) }, ora = capo();
      if (sp.r >= 4) avviso(frase("r4", v), id);
      else if (ora === p && prima && prima !== p) avviso(frase("sorpasso", v), id);
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
      if (tanti && tanti.n >= 2) l.push({ ico: "🎣", tit: "Più pesci presi", chi: tanti.nome, cosa: tanti.n + " pesci" });
      if (alb) l.push({ ico: "👑", tit: "Re delle alborelle", chi: alb.p.nome, cosa: alb.a + " alborelle" });
      else if (tanti) { var zero = ord.filter(function (p) { return !p.n && !p.uscito; })[0]; if (zero) l.push({ ico: "🪱", tit: "Lombrico d'oro", chi: zero.nome, cosa: "nessun pesce, ma tanta pazienza" }); }
      return l.slice(0, 3);
    }
    function fine(motivo) {
      if (H.fase !== "gioco") return;
      ferma();
      var ord = ordina(H.players);
      // pari merito = stesso posto; chi è uscito apposta viene dopo tutti quelli rimasti
      H.classifica = ord.map(function (p) {
        return { id: p.id, nome: p.nome, omino: p.omino || null, uscito: !!p.uscito, kg: Math.round((p.kg || 0) * 100) / 100, n: p.n || 0, best: p.best,
          pos: 1 + ord.filter(function (q) { return (q.uscito ? 1 : 0) < (p.uscito ? 1 : 0) || (!!q.uscito === !!p.uscito && (q.kg || 0) > (p.kg || 0)); }).length };
      });
      H.premi = premi(ord);
      H.motivo = motivo || "tempo"; H.fase = "fine"; bd();
      // torneo online e XP: i NOMI dei giocatori col loro posto (pari merito = stesso posto)
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova gara": stessa stanza, stessi amici (più chi aspettava), tutti tornano nella saletta (MAI chiudere e riaprire la stanza)
    function nuova() {
      ferma(); H.fase = "lobby"; H.classifica = null; H.premi = null; H.motivo = null; H.ultimo = null;
      H.players = presenti(); H.players.forEach(function (p) { p.kg = 0; p.n = 0; p.best = null; });
      riempi(); bd();
    }

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova,
      onPreso: function (f) { if (preso("host", { id: f.id, cm: f.cm, k: chiave() })) bd(); },
      onEsci: function () {
        function via() { ferma(); rete.chiudi(); chiudiSchermo(); t.esci(); }
        if (H.fase === "gioco" && UI && UI._gara) return UI._gara.chiedi("Chiudere la gara per tutti?", "Gli amici escono dalla gara.", "🏠 Chiudi ed esci", via);   // un tocco sbagliato non chiude la gara a tutti
        via();
      } };
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
        onChiuso: function () { chiudiSchermo(); errore(t, "La gara è stata chiusa dall'host."); },
        onErrore: function () { chiudiSchermo(); errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function attesa(testo) {
      var s = t.schermata({ icona: "🎣", titolo: "Entro nella gara…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
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
  function chiudiSchermo() { if (UI && UI._chiudi) UI._chiudi(); UI = null; clearTimeout(finale0); finale0 = null; clearInterval(TIC); TIC = null; vista = null; }
  function disegna(t, vm, cb) {
    ultimoVm = vm; ultimoCb = cb;
    var io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    var inCoda = (vm.coda || []).indexOf(cb.myId) >= 0;
    if (vm.fase === "lobby") {
      if (UI || finale0) chiudiSchermo();
      if (!io && !cb.sonoHost) return fuori(t, inCoda ? "pieno" : "entro");
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
    if (!io) return fuori(t, "gara");   // arrivato a gara iniziata: aspetta la prossima (è nella lista dell'host)
    if (!UI) {
      if (!window.SGPesca) return errore(t, "Manca il laghetto: aggiorna l'app.");
      UI = SGPesca.crea({ omino: t.mioOmino(io.nome), audio: audio, indietro: cb.onEsci, gara: { onPreso: cb.onPreso } });
      t.mostra(UI); UI._monta(); vista = "lago";
      TIC = setInterval(ticchetta, 200);
    }
    FINE_AT = Date.now() + (vm.resta || 0);
    statoLago(vm, cb, true);
  }
  function statoLago(vm, cb, conAvviso) {
    var r = righe(vm.players, cb.myId), u = vm.ultimo;
    UI._gara.stato({ fineAt: conAvviso ? FINE_AT : 0, righe: r,
      avviso: conAvviso && u && u.chi !== cb.myId && (u.eta || 0) < 5000 ? u : null });   // un avviso vecchio (chi rientra) non si rivede
    tuInClassifica(r);
  }
  // la classifica in alto mostra 4 righe: se sei più giù, l'ultima diventa la tua (col tuo posto vero)
  function tuInClassifica(r) {
    var box = UI && UI.querySelector && UI.querySelector(".pe-classi"), i = -1;
    r.forEach(function (x, j) { if (x.tu) i = j; });
    if (!box || i < 4 || box.children.length < 4) return;
    var ult = box.children[3]; ult.className = "pe-cl tu"; ult.textContent = (i + 1) + ". Tu · " + kg(r[i].kg);
  }
  var ultimoSec = -1;
  function ticchetta() {   // gli ultimi 5 secondi: un tic a ogni secondo
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
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),   // solo i posti che mancano per cominciare
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota", text: "🎣 Gara di " + minuti(vm.durata) + " nel laghetto: vince chi pesca più chili. Canna e lombrichi uguali per tutti." + (n ? " (Stanza piena: " + n + (n === 1 ? " aspetta" : " aspettano") + " un posto.)" : "") })],
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function fuori(t, tipo) {   // chi non è (ancora) nella gara: un cartello, rifatto solo se cambia
    if (UI || vista === "fuori-" + tipo) return;
    chiudiSchermo(); vista = "fuori-" + tipo;
    var T = { gara: ["Gara in corso", "Aspetta la prossima", "La gara è già cominciata: quando l'host ne fa un'altra, entri da solo nella saletta."],
      pieno: ["Stanza piena", "Al massimo " + MAX + " pescatori", "Ci sono già " + MAX + " pescatori: appena si libera un posto entri da solo."],
      entro: ["Entro nella gara…", "Un attimo", "Collegamento in corso…"] }[tipo];
    var s = t.schermata({ icona: "🎣", titolo: T[0], sotto: T[1] });
    s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: T[2] }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: ultimoCb && ultimoCb.onEsci || t.esci }));
    t.mostra(s);
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
      ".gp-premio canvas{flex:none}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function finale(t, vm, cb) {
    finale0 = null;
    var cl = vm.classifica || [], fuoriGara = !cl.some(function (r) { return r.id === cb.myId; });
    var firma = "fine:" + vm.gara + ":" + fuoriGara;
    if (vista === firma) return;   // la stessa classifica è già sullo schermo: non si rifà
    vista = firma; stile();
    var s = t.schermata({ icona: "🏆", titolo: "Classifica della gara", sotto: vm.motivo === "soli" ? "Gli altri sono usciti" : null });
    var box = t.el("div", { class: "gp-fin" }), med = ["🥇", "🥈", "🥉"];
    function chi(r) { return r.id === cb.myId ? r.nome + " (tu)" : r.nome; }
    // il podio: i primi tre sui gradini (il primo al centro, con le braccia alzate)
    var pod = t.el("div", { class: "gp-podio" }), tre = cl.slice(0, 3);
    [1, 0, 2].forEach(function (i) {
      var r = tre[i]; if (!r) return;
      var av = t.el("span", { class: "gp-av" });
      if (r.omino && window.SGOmino) av.innerHTML = SGOmino.svg(r.omino, { braccia: r.pos === 1 ? "su" : undefined });
      pod.appendChild(t.el("div", { class: "gp-gr p" + Math.min(3, r.pos) }, [ av,
        t.el("span", { class: "gp-nm", text: chi(r) + (r.uscito ? " 🚪" : "") }),
        t.el("span", { class: "gp-kg", text: kg(r.kg) + (r.n ? " · " + r.n + (r.n === 1 ? " pesce" : " pesci") : "") }),
        t.el("div", { class: "gp-gradino", text: med[r.pos - 1] || r.pos + "°" }) ]));
    });
    box.appendChild(pod);
    if (cl.length > 3) {
      var ol = t.el("ol", { class: "gp-resto" + (cl.length > 6 ? " due" : "") });
      cl.slice(3).forEach(function (r) {
        ol.appendChild(t.el("li", null, [ t.el("span", { text: r.pos + "°" }), t.el("b", { text: chi(r) + (r.uscito ? " 🚪 ha lasciato" : "") }), t.el("span", { text: kg(r.kg) }) ]));
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
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova gara (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin:0", text: fuoriGara ? "Sei in lista: alla prossima gara entri anche tu!" : "Se l'host fa un'altra gara, torni da solo nella saletta." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
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
    modi: [], soloOnline: true,
    regole: [
      "Ognuno pesca dal suo telefono nello <b>stesso laghetto</b>, da <b>1 a 10 minuti</b> (lo sceglie l'host).",
      "Si pesca come al laghetto: tieni premuto per <b>lanciare</b>, tocca quando il galleggiante <b>va giù</b>, poi tira e molla il filo nella <b>lotta</b>.",
      "Canna e lombrichi sono <b>uguali per tutti</b> e senza limite. Ogni pesce preso vale il suo <b>peso</b>: i pesci grossi del largo valgono tantissimo!",
      "In alto vedi il tempo e la classifica dal vivo. Allo scadere vince chi ha pescato <b>più chili</b>. Chi esce prima della fine va in fondo alla classifica."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      if (dove.durata == null) dove.durata = 180;
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
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
})();
