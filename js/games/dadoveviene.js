/* =========================================================
   🍹 DA DOVE VIENE? — il nostro FoodGuessr, fatto dal modello dei giochi online.
   Esce la foto VERA di un piatto o di un drink (da Wikipedia): la squadra discute e dà UNA risposta, un paese.
   3 tentativi: dopo ogni errore il gioco dice quanto si è lontani e in che direzione (🔥 Fuoco! … ❄️ Lontanissimo)
   e scopre un indizio in più: all'inizio gli ingredienti, dopo il 1° errore come si prepara, dopo il 2° il nome.
   Alla fine la scheda: paese con bandiera, cos'è e una curiosità. Punti: 3 al primo tentativo, 2 al secondo, 1 al terzo.
   - 🤝 Tutti in squadra: una squadra sola, un capitano a turno scrive la risposta (gli altri vedono cosa scrive).
   - ⚔️ Due squadre: lo stesso piatto per tutte e due, ognuna coi suoi 3 tentativi (segreti: arrivano solo ai
     telefoni della squadra); alla rivelazione si vede tutto. Sullo stesso telefono si gioca a turno, un piatto a testa.
   Le foto: l'host chiede l'immagine principale della pagina di Wikipedia (mai il testo) e la PRECARICA prima di
   mostrare il piatto; se non si carica prende un altro piatto dello stesso mazzo; se non arriva niente
   «📶 Le foto non arrivano» con «Riprova». Mai un'emoji al posto della foto.
   ========================================================= */
(function () {
  "use strict";

  var ID = "dadoveviene";
  var MIN = 2, MAX = 10;
  var RESPIRO = 5;               // i secondi di respiro quando la partita riprende
  var RITARDATARI = "turno";     // chi arriva a partita cominciata entra dalla portata dopo
  var T_PRIMO = 90, T_ALTRI = 60, T_SVELA = 22, T_NOFOTO = 20, INTRO = 2.5;   // secondi
  var TENTATIVI = 3, FALLITI_MAX = 5;
  var CHIAVE_REGOLE = "sg-ddv-regole", CHIAVE_USATE = "sg-ddv-usate";
  var SQUADRE = { A: { nome: "Rossi", em: "🔴" }, B: { nome: "Blu", em: "🔵" } };

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function leggi(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p || 25); } catch (e) {} }
  function setTx(n, tx) { if (n && n.textContent !== tx) n.textContent = tx; }

  // ---- suoni (piccoli, col motore audio comune) ----
  function nota(f, dur, dopo, tipo, vol) {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), n = c.currentTime + (dopo || 0);
      o.type = tipo || "triangle"; o.frequency.setValueAtTime(f, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(vol || 0.1, n + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + dur + 0.02);
    } catch (e) {}
  }
  function tic() { nota(760, 0.05, 0, "square", 0.035); }
  function suonoGiusto() { [523, 659, 784, 1047].forEach(function (f, k) { nota(f, 0.22, k * 0.11, "triangle", 0.12); }); }
  function suonoNo() { nota(220, 0.25, 0, "sawtooth", 0.06); nota(165, 0.3, 0.12, "square", 0.04); }
  function suonoPiatto() { nota(880, 0.12, 0, "sine", 0.08); nota(1320, 0.18, 0.1, "sine", 0.07); }

  // =========================================================
  //  LE REGOLE (senza grafica: si provano da sole, window.__dadoveviene)
  // =========================================================
  function norma(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  var PAESI = null, PAESE = {};
  function paesi() {
    if (PAESI) return PAESI;
    PAESI = (window.SG_DDV_PAESI || []).map(function (r) {
      var x = String(r).split("|"), p = { c: x[0], n: x[1], s: (x[2] || "").split(",").filter(Boolean), la: +x[3], lo: +x[4] };
      p.k = norma(p.n); p.ks = p.s.map(norma); p.parole = p.k.split(" ");
      return p;
    }).filter(function (p) { return p.c && p.n && isFinite(p.la) && isFinite(p.lo); });
    PAESI.forEach(function (p) { PAESE[p.c] = p; });
    return PAESI;
  }
  function paese(c) { paesi(); return PAESE[c] || null; }
  function nomePaese(c) { var p = paese(c); return p ? p.n : c; }
  // la bandiera dal codice (🇳🇴 = le due lettere «regionali»)
  function bandiera(c) {
    if (!/^[A-Z]{2}$/.test(c || "")) return "🏳️";
    return String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65, 0x1F1E6 + c.charCodeAt(1) - 65);
  }
  // la ricerca mentre si scrive: nomi italiani e altri nomi (USA, Olanda, Inghilterra…). Torna i codici, i migliori prima
  function cerca(q, escludi) {
    var k = norma(q); if (!k) return [];
    var no = escludi || [], l = [];
    paesi().forEach(function (p) {
      if (no.indexOf(p.c) >= 0) return;
      var r = 99;
      if (p.k === k) r = 0; else if (p.ks.indexOf(k) >= 0) r = 1;
      else if (p.k.indexOf(k) === 0) r = 2;
      else if (p.ks.some(function (s) { return s.indexOf(k) === 0; })) r = 3;
      else if (p.parole.some(function (w) { return w.indexOf(k) === 0; })) r = 4;
      else if (k.length >= 3 && p.ks.some(function (s) { return s.split(" ").some(function (w) { return w.indexOf(k) === 0; }); })) r = 5;
      else if (k.length >= 4 && p.k.indexOf(k) >= 0) r = 6;
      if (r < 99) l.push({ c: p.c, r: r, n: p.n });
    });
    l.sort(function (a, b) { return a.r - b.r || a.n.length - b.n.length || (a.n < b.n ? -1 : 1); });
    return l.map(function (x) { return x.c; });
  }
  // il paese scritto per intero (nome o altro nome): uno solo, se no null
  function esatto(q) {
    var k = norma(q); if (!k) return null;
    var l = paesi().filter(function (p) { return p.k === k || p.ks.indexOf(k) >= 0; });
    if (l.length === 1) return l[0].c;
    var x = l.filter(function (p) { return p.k === k; });
    return x.length === 1 ? x[0].c : null;
  }
  var RAD = Math.PI / 180;
  // la distanza tra i centri di due paesi (sulla sfera), in km
  function km(a, b) {
    var A = paese(a), B = paese(b); if (!A || !B) return 0;
    var f1 = A.la * RAD, f2 = B.la * RAD, df = (B.la - A.la) * RAD, dl = (B.lo - A.lo) * RAD;
    var h = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  var FRECCE = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];
  // in che direzione andare da a per arrivare a b, come sulla cartina (rotta costante), con frecce a 8 punte
  function direzione(a, b) {
    var A = paese(a), B = paese(b); if (!A || !B) return "";
    var dl = B.lo - A.lo; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
    var f1 = A.la * RAD, f2 = B.la * RAD;
    var dpsi = Math.log(Math.tan(Math.PI / 4 + f2 / 2) / Math.tan(Math.PI / 4 + f1 / 2));
    var th = Math.atan2(dl * RAD, dpsi) / RAD; if (th < 0) th += 360;
    return FRECCE[Math.round(th / 45) % 8];
  }
  var GRADI = [[500, "🔥", "Fuoco!"], [1500, "🌡️", "Caldo"], [3000, "🙂", "Tiepido"], [6000, "🥶", "Freddo"], [Infinity, "❄️", "Lontanissimo"]];
  function grado(k) { for (var i = 0; i < GRADI.length; i++) if (k < GRADI[i][0]) return { i: i, e: GRADI[i][1], t: GRADI[i][2] }; return { i: 4, e: "❄️", t: "Lontanissimo" }; }
  // 6.200 km (sotto i 1.000 a decine, sopra a centinaia)
  function fmtKm(k) { var r = k < 1000 ? Math.max(10, Math.round(k / 10) * 10) : Math.round(k / 100) * 100; return fmtN(r) + " km"; }
  // un tentativo: giusto? se no quanto lontano e dove (dal paese giusto più vicino)
  function valuta(c, carta) {
    var giusti = (carta && carta.p) || [];
    if (giusti.indexOf(c) >= 0) return { c: c, ok: true };
    var best = null;
    giusti.forEach(function (g) { var d = km(c, g); if (!best || d < best.km) best = { g: g, km: d }; });
    if (!best) return { c: c, ok: false, km: 0, d: "", gr: 4 };
    return { c: c, ok: false, km: Math.round(best.km), d: direzione(c, best.g), gr: grado(best.km).i };
  }
  function puntiPer(n) { return [3, 2, 1][n - 1] || 0; }
  // i secondi di un tentativo (le prove li accorciano con window.__ddvTempi = { primo, altri })
  function tempo(q) { var x = window.__ddvTempi && +window.__ddvTempi[q]; return x > 0 ? x : q === "primo" ? T_PRIMO : T_ALTRI; }
  function errori(tent) { return (tent || []).filter(function (x) { return !x.ok; }).length; }
  function mazzi() { return (window.SG_DDV_MAZZI || []).filter(function (m) { return m && m.id; }); }
  function mazzoDi(id) { return mazzi().filter(function (m) { return m.id === id; })[0] || null; }
  var CARTA = null;
  function tutte() { return (window.SG_DDV_CARTE || []).filter(function (c) { return c && c.id && c.w && c.p && c.p.length; }); }
  function carta(id) { if (!CARTA) { CARTA = {}; tutte().forEach(function (c) { CARTA[c.id] = c; }); } return CARTA[id] || null; }
  function carteDi(m) { return tutte().filter(function (c) { return c.m === m; }); }
  function regoleDa(imp) {
    imp = imp || {};
    var mz = Array.isArray(imp.mazzi) ? imp.mazzi.filter(function (id) { return mazzoDi(id); }) : null;
    return { stile: imp.stile === "due" ? "due" : "squadra", portate: [5, 8, 10].indexOf(+imp.portate) >= 0 ? +imp.portate : 8,
      mazzi: mz && mz.length ? mz : mazzi().map(function (m) { return m.id; }) };
  }
  // pesca un piatto del mazzo: mai uno già uscito in questa partita, né uno con la foto rotta; quelli usciti di
  // recente su questo telefono solo se non c'è altro
  function pesca(mazzo, usate, guaste) {
    var pool = carteDi(mazzo); if (!pool.length) pool = tutte();
    var rec = leggi(CHIAVE_USATE); if (!Array.isArray(rec)) rec = [];
    function libera(c) { return usate.indexOf(c.id) < 0 && !(guaste && guaste[c.id]); }
    var l = pool.filter(function (c) { return libera(c) && rec.indexOf(c.id) < 0; });
    if (!l.length) l = pool.filter(libera);
    if (!l.length) return null;
    return l[rnd(l.length)].id;
  }
  function segnaUsata(id) {
    var rec = leggi(CHIAVE_USATE); if (!Array.isArray(rec)) rec = [];
    rec = rec.filter(function (x) { return x !== id; }); rec.push(id);
    scrivi(CHIAVE_USATE, rec.slice(-Math.max(20, Math.floor(tutte().length * 0.6))));
  }
  function mazzoPer(ordine, n, passo) { var o = ordine && ordine.length ? ordine : mazzi().map(function (m) { return m.id; }); return o[Math.floor((n - 1) / (passo || 1)) % o.length]; }
  function frase(p, max) {
    var r = max ? p / max : 0;
    if (r >= 1) return "Perfetti! 🏆 Palato da giramondo!";
    if (r >= 0.75) return "Fantastici! Veri giramondo 🌍";
    if (r >= 0.5) return "Bravi! Buona forchetta 🍴";
    if (r >= 0.25) return "Niente male, ma ripassate la geografia 🗺️";
    return "Ahia… meglio la pizzeria sotto casa! 🍕";
  }
  // ---- le foto (Wikipedia): l'indirizzo dell'immagine principale, in misura standard (500 px; 640 non esiste) ----
  function urlFoto(j) {
    var th = j && j.thumbnail, or = j && j.originalimage, l = [];
    function pulito(u) { return String(u || "").split("?")[0]; }
    if (!th && !or) return l;
    if (or && or.source && or.width && or.width <= 560) l.push(pulito(or.source));
    if (th && th.source) {
      var u = pulito(th.source);
      if (/\/\d+px-/.test(u) && !(or && or.width && or.width <= 560)) l.push(u.replace(/\/\d+px-/, "/500px-"));
      l.push(u);
    } else if (or && or.source) l.push(pulito(or.source));
    return l.filter(function (u, i) { return u && l.indexOf(u) === i; });
  }
  var FOTO = {};     // id → l'indirizzo che si è caricato (in questa pagina)
  // chiede a Wikipedia la foto del piatto e la PRECARICA: cb(indirizzo) solo se l'immagine si vede davvero, se no cb(null)
  function caricaFoto(c, cb) {
    var fatto = false, to = setTimeout(function () { fine(null); }, 14000);
    function fine(u) { if (fatto) return; fatto = true; clearTimeout(to); if (u) FOTO[c.id] = u; cb(u); }
    function prova(l, i) {
      if (fatto) return;
      if (!l || i >= l.length) return fine(null);
      var im = new Image(), t2 = setTimeout(function () { im.onload = im.onerror = null; prova(l, i + 1); }, 9000);
      im.onload = function () { clearTimeout(t2); if (im.naturalWidth > 0) fine(l[i]); else prova(l, i + 1); };
      im.onerror = function () { clearTimeout(t2); prova(l, i + 1); };
      im.src = l[i];
    }
    if (FOTO[c.id]) return prova([FOTO[c.id]], 0);
    var m = /^([a-z\-]+):(.+)$/.exec(c.w || ""); if (!m) return fine(null);
    var url = "https://" + m[1] + ".wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(m[2]);
    try {
      window.fetch(url).then(function (r) { return r && r.ok ? r.json() : null; })
        .then(function (j) { prova(urlFoto(j), 0); }, function () { fine(null); });
    } catch (e) { fine(null); }
  }
  // per le prove (.agents/skills/prova-nel-browser/dadoveviene/base.js)
  window.__dadoveviene = { norma: norma, paesi: paesi, paese: paese, bandiera: bandiera, cerca: cerca, esatto: esatto, km: km, direzione: direzione,
    grado: grado, fmtKm: fmtKm, valuta: valuta, puntiPer: puntiPer, regoleDa: regoleDa, pesca: pesca, carta: carta, tutte: tutte, mazzi: mazzi,
    frase: frase, urlFoto: urlFoto, caricaFoto: caricaFoto, mazzoPer: mazzoPer };

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    // io che tengo la partita: "host", oppure (host di riserva) l'id da amico di chi ha preso il posto. MAI "host" fisso
    var IO = t.mioId || "host";
    var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, rip: 0, R: regoleDa(t.impostazioni),
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), sq: "A" }],
      guarda: [],     // nella Sala: chi non è stato scelto (guarda, col suo id nella foto)
      prossimi: [],   // arrivati a partita cominciata: entrano alla portata dopo
      n: 0, passo: null, carta: null, foto: null, ordine: [], usate: [], guaste: {}, sq: [], storia: [], pross: null, dato: 0,
      scadenza: 0, falliti: 0, classifica: null, to: null };
    var R0 = t.ripresa, riprendo = !!(R0 && R0.stato && R0.stato.fase && R0.stato.fase !== "lobby" && R0.stato.players), attesi = {}, tAttesi = null, uscito = false, tok = 0;
    if (riprendo) {
      H = R0.stato;
      H.to = null; H.pronta = false; H.rip = H.rip || 0; H.guarda = H.guarda || []; H.prossimi = []; H.usate = H.usate || []; H.guaste = H.guaste || {};
      H.R = regoleDa(H.R); H.sq = H.sq || []; H.storia = H.storia || [];
      H.players.forEach(function (p) {
        p.forse = false;
        if (p.id === IO) { p.via = false; p.omino = t.mioOmino(p.nome); return; }
        if (R0.daRiserva && p.id === R0.vecchioHost) { p.via = true; return; }
        if (!p.via) attesi[p.id] = 1;
        p.via = true;   // rientra col suo join (stesso id)
      });
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function nomeDi(id) { var p = pById(id); return p ? p.nome : "?"; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function guardaId(id) { return H.guarda.some(function (x) { return x.id === id; }); }
    function inProssimi(id) { return H.prossimi.some(function (x) { return x.id === id; }); }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    function dopo(ms, fn) { ferma(); H.to = setTimeout(function () { H.to = null; if (!uscito) fn(); }, Math.max(0, ms)); }
    function due() { return H.R.stile === "due"; }
    function idsSq() { return due() ? ["A", "B"] : ["A"]; }
    function membri(sq) { return presenti().filter(function (p) { return p.sq === sq; }); }
    function sqDi(id) { var p = pById(id); if (!p || p.via) return null; for (var i = 0; i < H.sq.length; i++) if (H.sq[i].id === p.sq) return H.sq[i]; return null; }
    // la squadra per chi arriva: la più piccola (tutti in squadra: la A)
    function assegna() { if (!due()) return "A"; var a = membri("A").length, b = membri("B").length; return b < a ? "B" : "A"; }
    function riequilibra() {
      if (!due()) { H.players.forEach(function (p) { p.sq = "A"; }); return; }
      var pr = presenti();
      if (pr.some(function (p) { return p.sq !== "A" && p.sq !== "B"; }) || !membri("A").length || !membri("B").length) pr.forEach(function (p, i) { p.sq = i % 2 ? "B" : "A"; });
    }
    function entrano() {
      H.prossimi.forEach(function (x) { if (!pById(x.id) && presenti().length < MAX) H.players.push({ id: x.id, nome: x.nome, omino: x.omino, sq: assegna() }); });
      H.prossimi = [];
    }

    // "⚙️ Regole" nella saletta
    t.onRegole = function (im) { if (H.fase !== "lobby") return; var era = H.R.stile; H.R = regoleDa(im); if (era !== H.R.stile) { H.players.forEach(function (p) { p.sq = null; }); riequilibra(); } bd(); };

    function addio(id) {
      delete attesi[id];
      if (guardaId(id)) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
      if (inProssimi(id)) { H.prossimi = H.prossimi.filter(function (x) { return x.id !== id; }); bd(); return; }
      var p = pById(id); if (!p || (p.via && H.fase !== "lobby")) return;
      p.forse = false;
      if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
      p.via = true;   // a partita iniziata resta in classifica, ma non gioca più (se torna riprende il suo posto)
      if (H.fase === "gioco") {
        if (presenti().length < MIN) return fine();
        if (H.passo === "gioca") {
          H.sq.forEach(function (s) {
            if (s.fatto) return;
            if (!membri(s.id).length) { s.fatto = true; s.vuota = true; return; }
            if (s.cap === id) s.cap = capitano(s, false);
          });
          if (H.sq.every(function (s) { return s.fatto; })) return svela();
          mandaSegreti(); pianifica();
        }
      }
      bd();
    }
    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onErrore: function () {
        if (H.pronta) return;
        ferma(); clearTimeout(tAttesi); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      onForse: function (id) {
        var p = pById(id); if (!p || p.forse) return;
        p.forse = true;
        // il capitano sparito un attimo: la risposta passa a un compagno che c'è
        if (H.fase === "gioco" && H.passo === "gioca") H.sq.forEach(function (s) { if (!s.fatto && s.cap === id) { var n = capitano(s, false); if (n) { s.cap = n; s.bz = null; } } });
        bd(); mandaSegreti();
      },
      onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
      onAddio: addio,
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          delete attesi[id];
          var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
          if (!p && (guardaId(id) || !t.puoSedersi(id, nome))) {
            if (!guardaId(id)) H.guarda.push({ id: id, nome: nome });
            bd(); return;
          }
          if (!p && H.fase === "gioco") {
            if (!inProssimi(id)) {
              if (presenti().length + H.prossimi.length < MAX) H.prossimi.push({ id: id, nome: nome, omino: avatarValido(m.omino) });
              else if (!guardaId(id)) H.guarda.push({ id: id, nome: nome });
            }
            bd(); return;
          }
          if (!p && H.fase === "lobby") {
            if (H.players.length < MAX) H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino), sq: assegna() });
            else if (!guardaId(id)) H.guarda.push({ id: id, nome: nome });
          }
          // chi rientra ha lo STESSO id: ritrova posto, squadra e punti
          if (p) {
            p.forse = false; if (!p.omino) p.omino = avatarValido(m.omino);
            if (p.via && H.fase === "gioco") {
              p.via = false;
              if (H.passo === "gioca") H.sq.forEach(function (s) { if (s.id === p.sq && !s.fatto && !s.cap) s.cap = id; });
            }
          }
          bd();
          if (p && H.fase === "gioco") privato(id, segretoDi(id));
          return;
        }
        if (H.fase !== "gioco") return;
        if (m.t === "chiedi") { privato(id, segretoDi(id)); return; }
        var q = pById(id); if (!q || q.via) return;   // chi guarda soltanto non fa mosse
        if (m.t === "risp") risposta(id, m.c, m.n);
        else if (m.t === "bz") bozza(id, m.q, m.sel, m.n);
      }
    }, { ripresa: riprendo });
    if (!rete) return senzaRete(t);
    if (riprendo && rete.codice) H.codice = rete.codice;

    // ----- i segreti (solo a due squadre, mentre si gioca): i tentativi e gli indizi della MIA squadra -----
    function chiaveSq(s) { return H.partita + "|" + H.n + "|" + s.id + "|" + s.tent.length + "|" + H.rip; }
    function segretoDi(id) {
      if (!due() || H.fase !== "gioco" || H.passo !== "gioca") return null;
      var s = sqDi(id); if (!s) return null;
      var c = carta(H.carta), e = errori(s.tent), m = { t: "sq", k: chiaveSq(s), sq: s.id, tent: s.tent };
      if (c && e >= 1) m.prep = c.s;
      if (c && e >= 2) m.nome = c.n;
      return m;
    }
    function privato(id, m) {
      if (!m) return;
      if (id === IO) { if (m.t === "bz") riceviBozza(cbHost, m); else riceviPrivato(cbHost, m); return; }
      m.to = id; rete.inviaVeloce(m);   // (con "to": non resta in stanza e gli altri telefoni lo ignorano)
    }
    function mandaSegreti(solo) {
      if (!due() || H.passo !== "gioca") return;
      presenti().forEach(function (p) { if (!solo || p.sq === solo) privato(p.id, segretoDi(p.id)); });
    }
    function secondi(ora) { return ora ? Math.max(0, Math.ceil((ora - Date.now()) / 1000)) : 0; }
    // la "foto" per tutti: SEMPRE con gli id e con "fase"; a due squadre i tentativi solo alla rivelazione
    function vm() {
      var gioca = H.passo === "gioca", sv = H.passo === "svela", c = H.carta ? carta(H.carta) : null, d2 = due();
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, rip: H.rip, tiene: IO,
        stile: H.R.stile, tot: H.R.portate, n: H.n, passo: H.passo, k: H.partita + "|" + H.n,
        mazzo: c ? c.m : null, foto: (gioca || sv) ? H.foto : null, ingr: (gioca || sv) && c ? c.i : null,
        pre: sv && H.pross ? H.pross.url : null,
        resta: H.fase === "gioco" && (sv || H.passo === "nofoto") ? secondi(H.scadenza) : 0,   // i secondi che mancano (non l'ora)
        sq: H.sq.map(function (s) {
          var o = { id: s.id, cap: s.cap, n: s.tent.length, fatto: s.fatto, punti: s.punti, resta: gioca && !s.fatto ? secondi(s.scad) : 0 };
          if (!d2 || sv) { o.tent = s.tent; o.giusto = s.giusto; o.pz = s.pz; }
          if (!d2 && gioca && c) { var e = errori(s.tent); if (e >= 1) o.prep = c.s; if (e >= 2) o.nome = c.n; }
          return o;
        }),
        carta: sv && c ? { n: c.n, p: c.p, e: c.e, d: c.d, c: c.c, s: c.s } : null,
        classifica: H.classifica, storia: H.fase === "fine" ? H.storia : null, max: H.R.portate * TENTATIVI,
        players: H.players.map(function (q) { return { id: q.id, nome: q.nome, sq: q.sq, via: !!q.via, forse: !!q.forse, omino: H.fase === "lobby" ? (q.omino || null) : undefined }; }),
        guarda: H.guarda, prossimi: H.prossimi.map(function (x) { return { id: x.id, nome: x.nome }; }) };
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); ricorda(); disegna(t, v, cbHost); vici(); }
    // la partita da ricordare: tutto H tranne il timer, senza avatar, con le scadenze come ORE
    function ricorda() {
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {};
      Object.keys(H).forEach(function (k) { if (k !== "to" && k !== "prossimi") s[k] = H[k]; });
      s.players = H.players.map(function (p) { return { id: p.id, nome: p.nome, sq: p.sq, via: !!p.via }; });
      t.ricorda(s);
    }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda e chi aspetta la portata dopo
    var viciK = "";
    function vici() {
      if (!t.vici) return;
      var l = H.guarda.map(function (x) { return x.id; }).concat(H.prossimi.map(function (x) { return x.id; })).filter(function (id, i, a) { return id !== IO && a.indexOf(id) === i; });
      var k = l.join(","); if (k === viciK) return;
      viciK = k; t.vici(l.length ? l : null);
    }
    function aCheSiamo() {
      var m = mazzoDi((carta(H.carta) || {}).m);
      t.aCheSiamo("Portata " + H.n + " di " + H.R.portate + (due() ? " · 🔴 " + H.sq[0].punti + " – 🔵 " + H.sq[1].punti : " · ⭐ " + (H.sq[0] ? H.sq[0].punti : 0)) + (m ? " · " + m.icona : ""));
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.fase = "gioco"; H.partita++; H.n = 0; H.classifica = null; H.usate = []; H.storia = []; H.pross = null; H.dato = 0; H.guaste = {};
      H.ordine = t.mischia(H.R.mazzi.slice());
      riequilibra();
      H.sq = idsSq().map(function (id) { return { id: id, punti: 0, capI: -1, cap: null, tent: [], fatto: false, giusto: false, pz: 0, scad: 0, bz: null }; });
      nuovoPiatto();
    }
    // il capitano di turno: a rotazione fra i compagni presenti (mai chi si sta ricollegando, se c'è altro)
    function capitano(s, avanza) {
      var l = membri(s.id), ok = l.filter(function (p) { return !p.forse; });
      if (ok.length) l = ok;
      if (!l.length) return null;
      if (avanza) s.capI = (s.capI + 1) % 1000;
      var i = ((s.capI % l.length) + l.length) % l.length;
      if (!avanza) { var cur = l.map(function (p) { return p.id; }).indexOf(s.cap); i = cur >= 0 ? (cur + 1) % l.length : i; }
      return l[i].id;
    }
    function nuovoPiatto() {
      ferma(); tok++;
      entrano();
      if (presenti().length < MIN) return fine();
      H.n++;
      if (H.n > H.R.portate) { H.n = H.R.portate; return fine(); }
      H.passo = "carica"; H.carta = null; H.foto = null; H.falliti = 0; H.scadenza = 0;
      bd();
      preparaCarta();
    }
    // la foto del piatto si precarica PRIMA di mostrarlo; se non si carica, un altro piatto dello stesso mazzo
    function preparaCarta() {
      if (H.fase !== "gioco" || (H.passo !== "carica" && H.passo !== "nofoto")) return;
      var mio = ++tok, mz = mazzoPer(H.ordine, H.n);
      if (H.pross && H.pross.id && !H.guaste[H.pross.id] && H.usate.indexOf(H.pross.id) < 0) {
        var pr = H.pross; H.pross = null;
        if (FOTO[pr.id] === pr.url) return usa(pr.id, pr.url);
        return caricaFoto(carta(pr.id), function (u) { if (mio !== tok || uscito) return; if (u) usa(pr.id, u); else { H.guaste[pr.id] = 1; fallito(); } });
      }
      var id = pesca(mz, H.usate, H.guaste);
      if (!id) { H.guaste = {}; id = pesca(mz, H.usate, H.guaste); }
      if (!id) return fine();
      caricaFoto(carta(id), function (u) { if (mio !== tok || uscito) return; if (u) usa(id, u); else { H.guaste[id] = 1; fallito(); } });
    }
    function fallito() {
      H.falliti++;
      if (H.falliti >= FALLITI_MAX) { H.passo = "nofoto"; H.scadenza = Date.now() + T_NOFOTO * 1000; bd(); return; }   // («↻ Riprova» col conto: a zero riprova da solo)
      preparaCarta();
    }
    function riprova() { if (H.fase !== "gioco" || H.passo !== "nofoto") return; ferma(); H.falliti = 0; H.guaste = {}; H.passo = "carica"; bd(); preparaCarta(); }
    function usa(id, url) {
      ferma();
      H.carta = id; H.foto = url; H.falliti = 0; H.pross = null;
      if (H.usate.indexOf(id) < 0) H.usate.push(id);
      segnaUsata(id);
      H.passo = "gioca";
      var ora = Date.now();
      H.sq.forEach(function (s) {
        s.tent = []; s.giusto = false; s.pz = 0; s.bz = null; s.vuota = false;
        s.cap = capitano(s, true);
        s.fatto = !s.cap; if (!s.cap) s.vuota = true;
        s.scad = ora + (tempo("primo") + INTRO) * 1000;
      });
      aCheSiamo();
      if (H.sq.every(function (s) { return s.fatto; })) return svela();
      bd(); mandaSegreti(); pianifica();
    }
    function tentato(s, c) { return s.tent.some(function (x) { return x.c === c; }); }
    function risposta(id, c, n) {
      if (H.fase !== "gioco" || H.passo !== "gioca") return;
      var s = sqDi(id); if (!s || s.fatto || s.cap !== id) return;
      if (+n !== s.tent.length || !paese(c) || tentato(s, c)) return;
      registra(s, c);
    }
    function registra(s, c) {
      var v = c ? valuta(c, carta(H.carta)) : { c: null, ok: false, tempo: true };
      s.tent.push(v); s.bz = null;
      if (v.ok) { s.giusto = true; s.pz = puntiPer(s.tent.length); s.fatto = true; }
      else if (s.tent.length >= TENTATIVI) s.fatto = true;
      else s.scad = Date.now() + tempo("altri") * 1000;
      if (H.sq.every(function (x) { return x.fatto; })) return svela();
      bd(); mandaSegreti(s.id); pianifica();
    }
    // il tempo del tentativo è finito: vale il paese scelto dal capitano, se no il tentativo è perso
    function scaduto() {
      if (H.fase !== "gioco" || H.passo !== "gioca") return;
      var ora = Date.now() + 200, l = H.sq.filter(function (s) { return !s.fatto && s.scad <= ora; });
      if (!l.length) return pianifica();
      l.forEach(function (s) {
        if (H.passo !== "gioca" || s.fatto) return;
        var sel = s.bz && s.bz.n === s.tent.length && paese(s.bz.sel) && !tentato(s, s.bz.sel) ? s.bz.sel : null;
        registra(s, sel);
      });
    }
    function pianifica() {
      if (H.fase !== "gioco" || H.passo !== "gioca") return;
      var l = H.sq.filter(function (s) { return !s.fatto; }).map(function (s) { return s.scad; });
      if (!l.length) return;
      dopo(Math.min.apply(null, l) - Date.now() + 60, scaduto);
    }
    // quello che il capitano sta scrivendo: lo vedono i compagni (a due squadre solo la sua squadra)
    function bozza(id, q, sel, n) {
      if (H.passo !== "gioca") return;
      var s = sqDi(id); if (!s || s.fatto || s.cap !== id || +n !== s.tent.length) return;
      s.bz = { q: String(q == null ? "" : q).slice(0, 30), sel: paese(sel) ? sel : null, n: s.tent.length };
      var m = { t: "bz", sq: s.id, q: s.bz.q, sel: s.bz.sel, k: H.partita + "|" + H.n + "|" + s.id + "|" + s.tent.length };
      if (!due()) { rete.inviaVeloce(m); if (id !== IO) riceviBozza(cbHost, m); return; }
      membri(s.id).forEach(function (p) { if (p.id !== id) privato(p.id, Object.assign({}, m)); });
    }
    // i punti si danno SOLO qui (una volta per portata): dopo una ripresa sulla scheda non si ridanno
    function svela() {
      ferma(); tok++;
      if (H.dato !== H.n) {
        H.sq.forEach(function (s) { s.punti += s.pz; });
        H.dato = H.n;
        var c = carta(H.carta);
        H.storia.push({ id: H.carta, e: c ? c.e : "", p: c ? c.p[0] : "", pt: H.sq.map(function (s) { return s.pz; }) });
      }
      H.passo = "svela"; H.scadenza = Date.now() + T_SVELA * 1000;
      aCheSiamo();
      bd();   // («Prossima portata ▶» col conto sul tasto di chi tiene la partita: a zero va avanti da solo)
      precarica();
    }
    // durante la scheda si precarica la foto della portata dopo (così parte subito)
    function precarica() {
      if (H.n >= H.R.portate || (H.pross && H.pross.id)) return;
      var mio = tok, part = H.partita, prove = 0;
      (function una() {
        var id = pesca(mazzoPer(H.ordine, H.n + 1), H.usate, H.guaste); if (!id) return;
        caricaFoto(carta(id), function (u) {
          if (uscito || part !== H.partita || mio !== tok || H.passo !== "svela") return;
          if (u) { H.pross = { id: id, url: u }; bd(); return; }
          H.guaste[id] = 1; if (++prove < 3) una();
        });
      })();
    }
    function avanti() { if (H.fase === "gioco" && H.passo === "svela") nuovoPiatto(); }
    function fine() {
      ferma(); tok++;
      var tot = H.sq.map(function (s) { return s.punti; }), cl;
      if (!due()) cl = H.players.map(function (p) { return { id: p.id, nome: p.nome, sq: "A", punti: tot[0] || 0, pos: 1 }; });
      else {
        var a = tot[0] || 0, b = tot[1] || 0, vince = a === b ? null : a > b ? "A" : "B";
        cl = H.players.map(function (p) { var pt = p.sq === "B" ? b : a; return { id: p.id, nome: p.nome, sq: p.sq, punti: pt, pos: !vince || p.sq === vince ? 1 : 2 }; });
        cl.sort(function (x, y) { return x.pos - y.pos || (x.sq < y.sq ? -1 : x.sq > y.sq ? 1 : 0); });
      }
      H.classifica = cl;
      H.fase = "fine"; H.passo = null; H.scadenza = 0; bd();
      // classifica della serata e XP: i NOMI col loro posto (tutti in squadra: tutti primi; a due squadre chi vince 1°)
      if (t.risultato) t.risultato(cl.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, tutti nella saletta
    function nuova() {
      if (H.fase !== "fine") return;
      ferma(); tok++;
      H.fase = "lobby"; H.passo = null; H.classifica = null; H.n = 0; H.carta = null; H.foto = null; H.sq = []; H.storia = []; H.scadenza = 0; H.pross = null;
      H.players = presenti(); entrano();
      if (!pById(IO)) {
        var g0 = H.guarda.filter(function (x) { return x.id === IO; })[0];
        H.guarda = H.guarda.filter(function (x) { return x.id !== IO; });
        var nm = (g0 && g0.nome) || t.nomeProfilo() || nomeHost;
        H.players.push({ id: IO, nome: nm, omino: t.mioOmino(nm), sq: assegna() });
      }
      H.players.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });
      riequilibra();
      bd();
    }
    t.onRivincita = nuova;
    // in saletta (a due squadre) l'host sposta un amico nell'altra squadra o le mischia
    function cambiaSq(id) { if (H.fase !== "lobby" || !due()) return; var p = pById(id); if (!p) return; p.sq = p.sq === "B" ? "A" : "B"; bd(); }
    function mischiaSq() { if (H.fase !== "lobby" || !due()) return; t.mischia(presenti()).forEach(function (p, i) { p.sq = i % 2 ? "B" : "A"; }); bd(); }

    // ----- la ripresa: ogni momento continua col tempo che restava (mai troppo poco). I punti si danno solo in svela()
    function riprendi() {
      tAttesi = setTimeout(function () { tAttesi = null; if (!uscito) Object.keys(attesi).forEach(addio); }, 15000);
      if (H.fase !== "gioco") { H.scadenza = 0; return bd(); }
      H.rip++;
      var ora = Date.now();
      if (H.passo === "gioca") {
        H.sq.forEach(function (s) {
          if (s.fatto) return;
          s.scad = Math.max(R0.ora(s.scad), ora + 20000);
          if (R0.daRiserva && s.cap === R0.vecchioHost) { s.cap = capitano(s, false); s.bz = null; }
          if (!s.cap) s.cap = capitano(s, false);
        });
        bd(); mandaSegreti(); pianifica();
      } else if (H.passo === "svela") {
        H.scadenza = Math.max(R0.ora(H.scadenza), ora + 8000);
        bd(); precarica();
      } else {   // la foto si stava caricando: si ricomincia a caricare
        H.passo = "carica"; H.scadenza = 0; H.falliti = 0; bd(); dopo(RESPIRO * 1000, preparaCarta);
      }
    }

    var cbHost = { sonoHost: true, myId: IO, seg: null, bz: null, vm: null,
      onComincia: comincia, onNuova: nuova, onAvanti: avanti, onRiprova: riprova, onCambiaSq: cambiaSq, onMischia: mischiaSq,
      onRisposta: function (c, n) { risposta(IO, c, n); },
      onBozza: function (q, sel, n) { bozza(IO, q, sel, n); },
      chiedi: function () {},
      onEsci: function () {
        function via() { uscito = true; ferma(); tok++; clearTimeout(tAttesi); t.ricorda(null); rete.chiudi(); t.esci(); }
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);
        via();
      } };
    window.__ddvHost = { H: function () { return H; }, io: IO };   // (per le prove)
    if (riprendo) riprendi(); else bd();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, nome: "", chiesto: 0, bzT: 0, bzTo: null, bzUlt: null };
    function invia(m) { if (S.rete) S.rete.invia(m); }
    var cb = { sonoHost: false, myId: null, seg: null, bz: null, vm: null,
      onRisposta: function (c, n) { invia({ t: "risp", c: c, n: n }); },
      // la bozza al massimo ogni 300 ms (l'ultima arriva sempre)
      onBozza: function (q, sel, n) {
        S.bzUlt = { t: "bz", q: q, sel: sel, n: n };
        if (S.bzTo) return;
        var att = 300 - (Date.now() - S.bzT);
        S.bzTo = setTimeout(function () { S.bzTo = null; S.bzT = Date.now(); if (S.bzUlt) invia(S.bzUlt); S.bzUlt = null; }, Math.max(0, att));
      },
      chiedi: function () { if (!S.rete || Date.now() - S.chiesto < 2500) return; S.chiesto = Date.now(); invia({ t: "chiedi" }); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (t.guarda) return t.conferma("Smetti di guardare?", null, "Esci", via);
        if (cb.vm && cb.vm.fase === "gioco" && trova(cb.vm, cb.myId)) return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();
    function chiediNome() {
      var s = t.schermata({ icona: "🍹", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
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
        onAperto: function (id) { cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== cb.myId) return;   // era per un altro telefono
          if (m.t === "vm") { disegna(t, m.vm, cb); if (serveSeg(m.vm, cb)) cb.chiedi(); }
          else if (m.t === "sq") riceviPrivato(cb, m);
          else if (m.t === "bz") riceviBozza(cb, m);
        },
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "🍹", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }
  function trova(vm, id) { var l = vm.players || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function nomeVm(vm, id, cb) { var p = trova(vm, id); return p ? (cb && p.id === cb.myId ? "Tu" : p.nome) : "?"; }
  // la mia squadra in questa portata (null = guardo)
  function miaSq(vm, cb) { var me = trova(vm, cb.myId); if (!me || me.via) return null; return (vm.sq || []).filter(function (s) { return s.id === me.sq; })[0] || null; }
  function chiaveSeg(vm, s) { return vm.partita + "|" + vm.n + "|" + s.id + "|" + s.n + "|" + (vm.rip || 0); }
  // a due squadre mi servono i tentativi della mia squadra (arrivano a parte)
  function serveSeg(vm, cb) {
    if (vm.stile !== "due" || vm.fase !== "gioco" || vm.passo !== "gioca") return false;
    var s = miaSq(vm, cb); if (!s) return false;
    return !cb.seg || cb.seg.k !== chiaveSeg(vm, s);
  }
  function riceviPrivato(cb, m) {
    if (m.t !== "sq") return;
    cb.seg = m;
    if (UI && UI.cb === cb && UI.cur && UI.cur.agg && cb.vm) UI.cur.agg(cb.vm);
  }
  function riceviBozza(cb, m) {
    cb.bz = m;
    if (UI && UI.cb === cb && UI.cur && UI.cur.bozza) UI.cur.bozza(m);
  }

  // =========================================================
  //  DISEGNO (uguale per host, ospiti e stesso telefono): saletta, gioco, fine
  // =========================================================
  var UI = null;   // la schermata di gioco si costruisce UNA volta e poi si aggiorna a pezzi
  var FIN = null;  // la classifica finale già a schermo: le foto dopo non la ridisegnano
  function disegna(t, vm, cb) {
    cb.vm = vm;
    if (vm.fase === "lobby") { UI = FIN = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      UI = null;
      var kf = "fine|" + vm.partita;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: finale(t, vm, cb) };
      return;
    }
    FIN = null;
    if (!UI || UI.t !== t || UI.cb !== cb || !document.body.contains(UI.s)) { UI = scena(t, { esci: cb.onEsci, targa: !!t.guarda && !t.eliminazione }); UI.cb = cb; }
    aggiorna(UI, vm, cb);
  }
  function lobby(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    var extra = [];
    if (vm.stile === "due") {
      stile();
      var box = t.el("div", { class: "dd-squadre" });
      ["A", "B"].forEach(function (id) {
        var riga = t.el("div", { class: "dd-sqriga sq" + id }, [t.el("span", { class: "dd-sqnome", text: SQUADRE[id].em + " " + SQUADRE[id].nome })]);
        vm.players.filter(function (p) { return p.sq === id && !p.via; }).forEach(function (p) {
          var b = t.el(cb.sonoHost ? "button" : "span", { class: "dd-sqchip" + (p.id === cb.myId ? " io" : ""), type: cb.sonoHost ? "button" : null, text: p.id === cb.myId ? "Tu" : p.nome });
          if (cb.sonoHost) b.addEventListener("click", function () { cb.onCambiaSq(p.id); });
          riga.appendChild(b);
        });
        box.appendChild(riga);
      });
      extra.push(box);
      if (cb.sonoHost) extra.push(t.el("div", { class: "dd-sqtasti" }, [
        t.el("span", { class: "modulo-nota", text: "Tocca un nome per cambiargli squadra" }),
        t.el("button", { class: "btn btn-fantasma dd-mischia", type: "button", text: "🔀 Mischia", onclick: function () { cb.onMischia(); } })]));
    }
    if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
      extra: extra,
      spettatore: t.guarda ? "👀 Guardi soltanto" : guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  // ---- la scena a tutto schermo: barra, foto grande, corpo (cambia col momento), faccine, avvisi ----
  function scena(t, opz) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("dd-piena");
    var ui = { t: t, s: s, info: el("div", { class: "dd-info" }), tab: el("div", { class: "dd-tab" }),
      foto: el("div", { class: "dd-foto" }), img: el("img", { class: "dd-img", alt: "" }), fmsg: el("div", { class: "dd-fmsg" }),
      banner: el("div", { class: "dd-banner" }), festa: el("div", { class: "dd-festa" }),
      corpo: el("div", { class: "dd-corpo" }), fac: el("div", { class: "dd-fac" }), avviso: el("div", { class: "dd-avviso" }),
      timers: [], faccine: null, targa: !!opz.targa, fotoUrl: undefined, fotoTok: 0, kFase: null, kPiatto: null, cur: null };
    ui.img.setAttribute("draggable", "false");
    ui.foto.appendChild(ui.img); ui.foto.appendChild(ui.fmsg); ui.foto.appendChild(ui.banner); ui.foto.appendChild(ui.festa);
    var esci = el("button", { class: "dd-esci", type: "button", "aria-label": "Esci", text: "‹", onclick: opz.esci });
    ui.fac.style.display = "none";
    ui.sc = el("div", { class: "dd-scena" + (ui.targa ? " dd-con-targa" : "") }, [el("div", { class: "dd-barra" }, [esci, ui.info, ui.tab]), ui.foto, ui.corpo, ui.fac, ui.avviso]);
    s._contenuto.appendChild(ui.sc);
    t.mostra(s);
    return ui;
  }
  function dopoUi(ui, ms, fn) {
    var k = ui.kFase, tm = setTimeout(function () { if (ui.kFase === k && document.body.contains(ui.s)) fn(); }, ms);
    ui.timers.push(tm);
  }
  function pulisciTimer(ui) { (ui.timers || []).forEach(clearTimeout); ui.timers = []; }
  function avviso(ui, testo, classe) {
    if (!ui || !testo) return;
    ui.avviso.textContent = testo; ui.avviso.className = "dd-avviso" + (classe ? " " + classe : ""); void ui.avviso.offsetWidth; ui.avviso.classList.add("su");
  }
  // la foto: si cambia solo quando cambia l'indirizzo (niente lampeggio). Se sul mio telefono non arriva riprovo
  function mettiFoto(ui, url, msg) {
    if (!url) { if (ui.fotoUrl) { ui.fotoUrl = null; ui.img.classList.remove("su"); ui.img.removeAttribute("src"); } setTx(ui.fmsg, msg || ""); ui.fmsg.style.display = msg ? "" : "none"; return; }
    if (url === ui.fotoUrl) return;
    ui.fotoUrl = url;
    var tok = ++ui.fotoTok, tent = 0;
    ui.img.classList.remove("su");
    setTx(ui.fmsg, "📷 Arriva la foto…"); ui.fmsg.style.display = "";
    ui.img.onload = function () { if (tok !== ui.fotoTok) return; ui.fmsg.style.display = "none"; ui.img.classList.add("su"); };
    ui.img.onerror = function () {
      if (tok !== ui.fotoTok) return;
      if (++tent <= 2) { setTimeout(function () { if (tok === ui.fotoTok) ui.img.src = url + (url.indexOf("?") < 0 ? "?" : "&") + "r=" + tent; }, 1500); return; }
      setTx(ui.fmsg, "📶 La foto non arriva sul tuo telefono: controlla la rete"); ui.fmsg.style.display = "";
    };
    ui.img.src = url;
  }
  function coriandoli(ui) {
    var el = ui.t.el, col = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#da77f2", "#ffa94d"];
    ui.t.svuota(ui.festa);
    for (var i = 0; i < 28; i++) {
      var c = el("i", { class: "dd-cor" });
      c.style.left = (4 + Math.random() * 92) + "%"; c.style.background = col[i % col.length];
      c.style.animationDelay = (Math.random() * 0.35) + "s"; c.style.setProperty("--dx", (Math.random() * 80 - 40) + "px"); c.style.setProperty("--rz", (Math.random() * 720 - 360) + "deg");
      ui.festa.appendChild(c);
    }
    dopoUi(ui, 2600, function () { ui.t.svuota(ui.festa); });
  }
  function faccineSe(ui, serve) {
    serve = serve && !ui.targa;
    if (serve && !ui.faccine) { ui.faccine = ui.t.faccine(); if (ui.faccine) ui.fac.appendChild(ui.faccine); }
    ui.fac.style.display = serve && ui.faccine ? "" : "none";
  }
  function nomeSq(id) { return SQUADRE[id] ? SQUADRE[id].em + " " + SQUADRE[id].nome : ""; }
  function testoTab(vm) {
    var l = vm.tab || vm.sq || [];
    if (vm.stile === "due") return l.map(function (s) { return SQUADRE[s.id].em + " " + fmtN(s.punti); }).join(" · ");
    return "⭐ " + fmtN(l[0] ? l[0].punti : 0);
  }
  // un tentativo in una casellina: bandiera e nome, poi grado, km e freccia (o ✅ / ⏱)
  function slot(t, x, i, pz) {
    var el = t.el;
    if (!x) return el("div", { class: "dd-slot vuoto" }, [el("b", { text: (i + 1) + "°" }), el("span", { text: puntiPer(i + 1) + (puntiPer(i + 1) === 1 ? " punto" : " punti") })]);
    if (x.tempo) return el("div", { class: "dd-slot no" }, [el("b", { text: "⏱ Tempo!" }), el("span", { text: "tentativo perso" })]);
    if (x.ok) return el("div", { class: "dd-slot si" }, [el("b", { text: bandiera(x.c) + " " + nomePaese(x.c) }), el("span", { text: "✅ Giusto! +" + (pz || puntiPer(i + 1)) })]);
    var g = GRADI[x.gr] || GRADI[4];
    return el("div", { class: "dd-slot no g" + x.gr }, [el("b", { text: bandiera(x.c) + " " + nomePaese(x.c) }), el("span", { text: g[1] + " " + fmtKm(x.km) + " " + x.d })]);
  }
  function righeSlot(t, nodo, tent, pz) {
    t.svuota(nodo);
    for (var i = 0; i < TENTATIVI; i++) nodo.appendChild(slot(t, (tent || [])[i], i, pz));
  }
  function testoTentativo(x) {
    if (!x) return "";
    if (x.tempo) return "⏱ Tempo scaduto!";
    if (x.ok) return "✅ Giusto!";
    var g = GRADI[x.gr] || GRADI[4];
    return g[1] + " " + g[2] + " · " + fmtKm(x.km) + " " + x.d;
  }
  function aggiorna(ui, vm, cb) {
    var me = trova(vm, cb.myId), mia = miaSq(vm, cb), m = mazzoDi(vm.mazzo);
    var aspetto = (vm.prossimi || []).some(function (p) { return p.id === cb.myId; });
    var info = (aspetto ? "✋ Entri alla prossima · " : !me && !cb.locale ? "👀 Guardi · " : "") + "🍽️ " + Math.max(1, vm.n) + " di " + vm.tot + (m ? " · " + m.icona + " " + m.nome : "");
    if (vm.turnoSq) info = nomeSq(vm.turnoSq) + " · " + info;
    setTx(ui.info, info);
    setTx(ui.tab, testoTab(vm));
    if (vm.pre && vm.pre !== ui.preUrl) { ui.preUrl = vm.pre; try { (new Image()).src = vm.pre; } catch (e) {} }
    // la foto: si vede durante il gioco e la scheda; mentre arriva, la scritta (mai un'emoji al posto della foto)
    if (vm.passo === "gioca" || vm.passo === "svela") mettiFoto(ui, vm.foto, "📷 Arriva la foto…");
    else if (vm.passo === "nofoto") mettiFoto(ui, null, "📶 Le foto non arrivano: controlla la rete");
    else mettiFoto(ui, null, "🍽️ Arriva la portata…");
    var ruolo = !mia ? "guarda" : mia.cap === cb.myId ? "cap" : "sq";
    var k = vm.k + "|" + vm.passo + "|" + (vm.rip || 0) + "|" + ruolo + "|" + (mia ? mia.id : "");
    if (k !== ui.kFase) {
      ui.kFase = k; pulisciTimer(ui);
      ui.t.svuota(ui.corpo); ui.corpo.className = "dd-corpo"; ui.sc.classList.remove("dd-svela", "dd-scrivo");
      var f = FASI[vm.passo];
      ui.cur = f ? f(ui, vm, cb, ruolo, mia) : null;
    } else if (ui.cur && ui.cur.agg) ui.cur.agg(vm);
    // il cartello «Portata 3 di 8» quando arriva un piatto nuovo
    if (vm.passo === "gioca" && ui.kPiatto !== vm.k) {
      ui.kPiatto = vm.k;
      if ((vm.sq || []).every(function (s) { return !s.n; })) {
        setTx(ui.banner, (vm.turnoSq ? nomeSq(vm.turnoSq) + " · " : "") + "🍽️ Portata " + vm.n + " di " + vm.tot);
        ui.banner.classList.remove("su"); void ui.banner.offsetWidth; ui.banner.classList.add("su");
        suonoPiatto();
      }
    }
  }
  var FASI = {};
  // 🍽️ la foto si sta caricando (sul telefono dell'host)
  FASI.carica = function (ui, vm) {
    ui.corpo.appendChild(ui.t.el("p", { class: "dd-attesa", text: vm.n ? "🍽️ Sta arrivando la portata " + vm.n + " di " + vm.tot + "…" : "🍽️ Si apparecchia…" }));
    faccineSe(ui, true);
    return null;
  };
  // 📶 nessuna foto si carica: «Riprova» (l'host; da solo dopo 20 secondi)
  FASI.nofoto = function (ui, vm, cb) {
    var el = ui.t.el;
    ui.corpo.appendChild(el("p", { class: "dd-attesa", text: cb.sonoHost ? "📶 Le foto dei piatti non arrivano: controlla la rete." : "📶 Le foto non arrivano al telefono di chi tiene la partita." }));
    if (cb.sonoHost) {
      var b = el("button", { class: "btn btn-primario dd-riprova", type: "button", text: "↻ Riprova", onclick: function () { cb.onRiprova(); } });
      ui.corpo.appendChild(b);
      if (!cb.locale) ui.t.contoAvanti(b, vm.resta || T_NOFOTO, cb.onRiprova, "ddnf|" + vm.k + "|" + (vm.rip || 0));
    } else {
      var p = el("p", { class: "dd-conto" }); ui.corpo.appendChild(p);
      ui.t.contoAvanti(p, vm.resta || T_NOFOTO, null, "ddnf|" + vm.k + "|" + (vm.rip || 0), "📶 Si riprova tra ");
    }
    faccineSe(ui, !cb.locale);
    return null;
  };
  // 🤔 si gioca: indizi, tentativi, e il campo della risposta per il capitano
  FASI.gioca = function (ui, vm, cb, ruolo, mia) {
    var el = ui.t.el, t = ui.t, due = vm.stile === "due";
    var ind = el("div", { class: "dd-indizi" }), iI = el("div", { class: "dd-ind i" }), iP = el("div", { class: "dd-ind p" }), iN = el("div", { class: "dd-ind n" });
    ind.appendChild(iI); ind.appendChild(iP); ind.appendChild(iN);
    var riga = el("div", { class: "dd-tent" }), altre = el("div", { class: "dd-altre" }), az = el("div", { class: "dd-azione" });
    var conto = el("p", { class: "dd-conto" }), boz = el("p", { class: "dd-bozza" }), campo = null, kConto = null, nVisti = mia ? mia.n : (!due && (vm.sq || [])[0] ? vm.sq[0].n : 0), contoS = null;
    ui.corpo.appendChild(ind); ui.corpo.appendChild(riga); if (due) ui.corpo.appendChild(altre); ui.corpo.appendChild(az);
    if (ruolo === "cap") {
      campo = campoPaese(t, { escludi: [],
        onScegli: function (c, q) { cb.onBozza(q, c, cb.vm && miaSq(cb.vm, cb) ? miaSq(cb.vm, cb).n : 0); },
        onInvia: function (c) {
          var s = miaSq(cb.vm, cb); if (!s || s.fatto) return;
          cb.inviato = { k: vm.k, n: s.n, c: c, quando: Date.now() };
          campo.blocca(true); tic(); cb.onRisposta(c, s.n);
        },
        onFuoco: function (si) { ui.sc.classList.toggle("dd-scrivo", !!si); } });
      az.appendChild(campo.nodo);
    } else az.appendChild(boz);
    az.appendChild(conto);
    function datiMiei(v) {   // i miei tentativi e indizi (a due squadre arrivano a parte)
      var s = miaSq(v, cb); if (!s) return null;
      if (!due) return { tent: s.tent || [], prep: s.prep, nome: s.nome, s: s };
      var sg = cb.seg && cb.seg.k === chiaveSeg(v, s) ? cb.seg : null;
      if (sg) return { tent: sg.tent || [], prep: sg.prep, nome: sg.nome, s: s };
      if (!s.n) return { tent: [], s: s };
      // (il tentativo nuovo sta arrivando: intanto restano quelli di prima, niente lampeggio)
      var pre = v.partita + "|" + v.n + "|" + s.id + "|";
      if (cb.seg && String(cb.seg.k).indexOf(pre) === 0) return { tent: cb.seg.tent || [], prep: cb.seg.prep, nome: cb.seg.nome, s: s };
      return { tent: null, s: s };
    }
    function agg(v) {
      vm = v;
      var d = datiMiei(v), squadra = !due ? (v.sq || [])[0] : null;
      if (!d && squadra) d = { tent: squadra.tent || [], prep: squadra.prep, nome: squadra.nome, s: squadra };   // (chi guarda, tutti in squadra)
      setTx(iI, "🧂 " + (v.ingr || ""));
      setTx(iP, d && d.prep ? "🍳 " + d.prep : ""); iP.classList.toggle("su", !!(d && d.prep));
      setTx(iN, d && d.nome ? "🏷️ Si chiama: " + d.nome : ""); iN.classList.toggle("su", !!(d && d.nome));
      // i tentativi (si ridisegnano solo quando ne arriva uno nuovo)
      var tl = d && d.tent, kr = !d ? "-" : tl ? tl.length + "|" + JSON.stringify(tl) : "?";
      riga.style.display = d ? "" : "none";   // (chi guarda, a due squadre: solo quanti tentativi, nella riga sotto)
      if (riga._k !== kr) {
        riga._k = kr;
        if (tl) righeSlot(t, riga, tl, d.s.pz);
        else { t.svuota(riga); riga.appendChild(el("div", { class: "dd-slot vuoto largo" }, [el("b", { text: "🔒 I vostri tentativi" }), el("span", { text: "arrivano…" })])); }
        if (tl && tl.length > nVisti) {
          var x = tl[tl.length - 1]; nVisti = tl.length;
          var ult = !x.ok && tl.length >= TENTATIVI;
          avviso(ui, testoTentativo(x) + (ult ? " · era l'ultimo!" : !x.ok ? " · nuovo indizio!" : ""), x.ok ? "si" : "no");
          if (x.ok) { suonoGiusto(); vibra(40); } else { suonoNo(); if (ult) vibra([40, 60, 40]); }
          if (x.ok || ult) ui.festa_k = v.k;   // (sulla scheda non si rifà)
          var cell = riga.children[tl.length - 1]; if (cell) cell.classList.add("nuovo");
        }
      }
      // l'altra squadra (a due squadre): quanti tentativi, mai quali
      if (due) {
        var tx = (v.sq || []).filter(function (s) { return !mia || s.id !== mia.id; }).map(function (s) {
          return nomeSq(s.id) + ": " + (s.fatto ? "✋ ha finito" : s.n ? s.n + (s.n === 1 ? " tentativo" : " tentativi") + " · ci pensano…" : "ci pensano…");
        }).join("  ·  ");
        setTx(altre, tx);
      }
      // il conto del tentativo (la scadenza la tiene l'host)
      var s0 = d ? d.s : squadra, kc = s0 && !s0.fatto && !cb.locale ? "dd|" + v.k + "|" + s0.id + "|" + s0.n + "|" + (v.rip || 0) : null;
      if (kc !== kConto) {
        kConto = kc; if (contoS) contoS.ferma(); contoS = null;
        if (kc) contoS = t.contoAvanti(conto, s0.resta || T_ALTRI, null, kc, "⏱ ");
        else setTx(conto, s0 && s0.fatto ? (due && !cb.locale ? "⏳ Aspettiamo l'altra squadra…" : "") : "");
      }
      if (campo) {
        var s = miaSq(v, cb);
        campo.escludi((tl || []).map(function (x) { return x.c; }).filter(Boolean));
        if (s && cb.inviato && cb.inviato.k === v.k && cb.inviato.n < s.n) cb.inviato = null;
        var aspetto = !!(cb.inviato && cb.inviato.k === v.k && cb.inviato.n === (s && s.n));
        campo.blocca(!s || s.fatto || aspetto);
        if (!aspetto && campo.bloccato === false && campo.nTent !== (s && s.n)) { campo.nTent = s && s.n; campo.reset(); }
        // la risposta non è arrivata (rete saltata): la rimando
        if (aspetto && Date.now() - cb.inviato.quando > 3500) { cb.inviato.quando = Date.now(); cb.onRisposta(cb.inviato.c, cb.inviato.n); }
      } else bozzaTx();
      faccineSe(ui, ruolo !== "cap" && !cb.locale);
    }
    function bozzaTx(m) {
      var s = mia || (!due ? (vm.sq || [])[0] : null); if (!s) { setTx(boz, due ? "👀 Le squadre stanno pensando…" : ""); return; }
      if (s.fatto) { setTx(boz, ""); return; }
      var b = m || cb.bz, nc = nomeVm(vm, s.cap, cb), ok = b && b.k === vm.k + "|" + s.id + "|" + s.n;
      var tx = ok && b.sel ? "👉 " + nc + " propone " + bandiera(b.sel) + " " + nomePaese(b.sel) + "…" : ok && b.q ? "✍️ " + nc + " scrive «" + b.q + "»" : "🗣️ Discutete a voce: risponde " + nc;
      setTx(boz, tx);
    }
    if (campo) campo.nTent = mia ? mia.n : 0;
    agg(vm);
    return { agg: agg, bozza: function (m) { if (!campo) bozzaTx(m); } };
  };
  // 🎉 la scheda: il paese giusto con la bandiera, cos'è, la curiosità, i tentativi di tutti e i punti
  FASI.svela = function (ui, vm, cb, ruolo, mia) {
    var el = ui.t.el, t = ui.t, c = vm.carta || {}, due = vm.stile === "due";
    ui.sc.classList.add("dd-svela");
    var p = c.p || [];
    var sch = el("div", { class: "dd-scheda" }, [
      el("div", { class: "dd-paese" }, [el("span", { class: "dd-band", text: p.map(bandiera).join(" ") }), el("b", { text: p.map(nomePaese).join(" · ") })]),
      el("div", { class: "dd-nome", text: (c.e ? c.e + " " : "") + (c.n || "") }),
      el("div", { class: "dd-cose", text: c.d || "" }),
      el("div", { class: "dd-curio", text: "💡 " + (c.c || "") })]);
    ui.corpo.appendChild(sch);
    (vm.sq || []).forEach(function (s) {
      var r = el("div", { class: "dd-tent" + (due ? " con-nome" : "") });
      if (due) r.appendChild(el("div", { class: "dd-chi", text: SQUADRE[s.id].em + (s.giusto ? " +" + s.pz : " 0") }));
      if (due) { var box = el("div", { class: "dd-slots" }); righeSlot(t, box, s.tent || [], s.pz); r.appendChild(box); }
      else righeSlot(t, r, s.tent || [], s.pz);
      ui.corpo.appendChild(r);
    });
    var az = el("div", { class: "dd-azione" }), ultimo = vm.n >= vm.tot;
    if (cb.sonoHost) {
      var b = el("button", { class: "btn btn-primario dd-avanti", type: "button", text: ultimo ? "Classifica 🏆" : "Prossima portata ▶", onclick: function () { cb.onAvanti(); } });
      az.appendChild(b);
      if (!cb.locale) t.contoAvanti(b, vm.resta || T_SVELA, cb.onAvanti, "ddsv|" + vm.k + "|" + (vm.rip || 0));
    } else {
      var pc = el("p", { class: "dd-conto" }); az.appendChild(pc);
      t.contoAvanti(pc, vm.resta || T_SVELA, null, "ddsv|" + vm.k + "|" + (vm.rip || 0), ultimo ? "🏆 Classifica tra " : "🍽️ Prossima portata tra ");
    }
    ui.corpo.appendChild(az);
    // festa: coriandoli e vibrazione a chi ha indovinato (tutti in squadra: a tutti)
    var miaS = mia || (!due ? (vm.sq || [])[0] : null);
    // (tutti in squadra la scheda arriva subito dopo la risposta: qui il suono e la vibrazione, una volta sola per piatto)
    if (miaS && miaS.giusto) coriandoli(ui);
    if (miaS && ui.festa_k !== vm.k && (miaS.giusto || (miaS.tent || []).length >= TENTATIVI)) {
      ui.festa_k = vm.k;
      if (miaS.giusto) { suonoGiusto(); if (mia) vibra(40); } else { suonoNo(); if (mia) vibra([40, 60, 40]); }
    }
    faccineSe(ui, !cb.locale && (window.innerHeight || 640) >= 720);
    return null;
  };

  // ---- il campo della risposta: si scrive, compaiono i paesi (con la bandiera), se ne tocca uno e si risponde ----
  function campoPaese(t, opz) {
    var el = t.el, sel = null, no = [], bloccato = false;
    var chips = el("div", { class: "dd-chips" });
    var inp = el("input", { type: "text", class: "dd-input", placeholder: "Scrivi il paese…", autocomplete: "off", autocapitalize: "words", spellcheck: "false", enterkeyhint: "go", maxlength: "30" });
    var ok = el("button", { class: "btn btn-primario dd-ok", type: "button", text: "Rispondi" });
    var nodo = el("div", { class: "dd-campo" }, [chips, el("div", { class: "dd-riga" }, [inp, ok])]);
    function stato() { ok.disabled = !sel || bloccato; setTx(ok, sel ? bandiera(sel) + " Rispondi" : "Rispondi"); inp.disabled = bloccato; }
    function disegnaChips() {
      t.svuota(chips);
      var q = inp.value.trim(), l = q ? cerca(q, no).slice(0, 6) : [];
      if (!q) { chips.appendChild(el("span", { class: "dd-hint", text: "🌍 Scrivi le prime lettere: Messico, USA, Olanda…" })); return; }
      if (!l.length) { chips.appendChild(el("span", { class: "dd-hint", text: no.indexOf(esatto(q)) >= 0 ? "Questo l'avete già provato!" : "Nessun paese con questo nome" })); return; }
      l.forEach(function (c) {
        var b = el("button", { class: "dd-chip" + (c === sel ? " sel" : ""), type: "button", "data-c": c, text: bandiera(c) + " " + nomePaese(c) });
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); if (!bloccato) scegli(c); });
        chips.appendChild(b);
      });
    }
    function scegli(c) { sel = c; inp.value = nomePaese(c); vibra(12); tic(); stato(); disegnaChips(); opz.onScegli(c, inp.value); }
    inp.addEventListener("input", function () { var e = esatto(inp.value); sel = e && no.indexOf(e) < 0 ? e : null; stato(); disegnaChips(); opz.onScegli(sel, inp.value.trim()); });
    inp.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return; e.preventDefault();
      if (sel) return manda();
      var l = cerca(inp.value, no); if (l.length) scegli(l[0]);
    });
    inp.addEventListener("focus", function () { if (opz.onFuoco) opz.onFuoco(true); });
    inp.addEventListener("blur", function () { if (opz.onFuoco) opz.onFuoco(false); });
    function manda() { if (!sel || bloccato) return; var c = sel; try { inp.blur(); } catch (e) {} opz.onInvia(c); }
    ok.addEventListener("click", manda);
    stato(); disegnaChips();
    var api = { nodo: nodo, input: inp, bloccato: false,
      escludi: function (l) { var k = l.join(","); if (k === no.join(",")) return; no = l.slice(); if (sel && no.indexOf(sel) >= 0) sel = null; stato(); disegnaChips(); },
      blocca: function (b) { b = !!b; if (b === bloccato) return; bloccato = b; api.bloccato = b; stato(); },
      reset: function () { sel = null; inp.value = ""; stato(); disegnaChips(); },
      scegli: scegli };
    return api;
  }

  // medaglie a pari merito: oro, oro, poi argento
  function medaglie(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; });
  }
  // la fila delle portate di stasera: bandiera e ✓ / ✗
  function filaPortate(t, storia, quale) {
    var fila = t.el("div", { class: "dd-fila" });
    (storia || []).forEach(function (h) {
      var pt = (h.pt || [])[quale || 0] || 0;
      fila.appendChild(t.el("span", { class: "dd-pt" + (pt ? " si" : ""), title: h.id, text: bandiera(h.p) + (pt ? "+" + pt : "✗") }));
    });
    return fila;
  }
  function finale(t, vm, cb) {
    stile();
    var cl = vm.classifica || [], due = vm.stile === "due", s;
    if (!due) {
      var pt = cl[0] ? cl[0].punti : 0;
      s = t.schermata({ icona: "🌍", titolo: fmtN(pt) + " punti su " + fmtN(vm.max || 0), sotto: frase(pt, vm.max) });
    } else {
      var a = (vm.sq[0] || {}).punti || 0, b = (vm.sq[1] || {}).punti || 0;
      s = t.schermata({ icona: "🏆", titolo: a === b ? "Pareggio!" : "Vincono i " + SQUADRE[a > b ? "A" : "B"].nome + "!", sotto: "🔴 " + fmtN(a) + " – 🔵 " + fmtN(b) });
    }
    var targa = !!t.guarda && !t.eliminazione, fac = targa ? null : t.faccine();
    if (targa) s.classList.add("dd-fine-targa");
    if (vm.storia && vm.storia.length) {
      if (!due) s._contenuto.appendChild(filaPortate(t, vm.storia, 0));
      else ["A", "B"].forEach(function (id, i) { var f = filaPortate(t, vm.storia, i); f.insertBefore(t.el("span", { class: "dd-pt chi", text: SQUADRE[id].em }), f.firstChild); s._contenuto.appendChild(f); });
    }
    var fitta = cl.length > 6 || cl.length * 71 + 340 + (fac ? 56 : 0) > (window.innerHeight || 640);
    var ol = t.el("ol", { class: "classifica" + (fitta ? " fitta" : "") }), med = medaglie(cl.map(function (r) { return r.pos; }));
    cl.forEach(function (r, i) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: due ? med[i] : "🤝" }),
        t.el("span", { class: "nome", text: (due ? SQUADRE[r.sq] ? SQUADRE[r.sq].em + " " : "" : "") + (r.id === cb.myId ? r.nome + " (tu)" : r.nome) }),
        due ? t.el("span", { class: "punti", text: fmtN(r.punti) }) : null ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    var io = cl.filter(function (r) { return r.id === cb.myId; })[0];
    if (!io) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
    else if (io.pos === 1 && (due || (vm.max && io.punti >= vm.max / 2))) { vibra(60); suonoGiusto(); }
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: targa ? "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." : "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      if (!targa) s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
    return s;
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  SULLO STESSO TELEFONO: un telefono in mezzo al tavolo, si discute e si risponde insieme
  //  (a due squadre si gioca a turno: un piatto a una squadra e uno all'altra, metà portate a testa)
  // =========================================================
  function locale(t) {
    var R = regoleDa(t.impostazioni), nomi = (t.giocatori || []).slice(), D2 = R.stile === "due" && nomi.length >= 2;
    if (!nomi.length) nomi = [t.nomeProfilo() || "Giocatore 1"];
    var sq = D2 ? [{ id: "A", punti: 0 }, { id: "B", punti: 0 }] : [{ id: "A", punti: 0 }];
    var giro = D2 ? 2 : 1, tot = D2 ? 2 * Math.ceil(R.portate / 2) : R.portate;
    var st = { n: 0, ordine: t.mischia(R.mazzi.slice()), usate: [], guaste: {}, storia: [], tent: [], pross: null, tok: 0 };
    var finito = false, ui = null;
    var cb = { sonoHost: true, myId: "loc", locale: true, seg: null, bz: null, vm: null,
      onRisposta: function (c, n) { rispostaL(c, n); }, onBozza: function () {}, onAvanti: function () { prossimo(); }, onRiprova: function () { st.falliti = 0; st.guaste = {}; carica(); },
      onEsci: function () { t.conferma("Uscire dalla partita?", "I punti di questa partita si perdono.", "Esci", function () { finito = true; st.tok++; t.esci(); }); } };
    function sqOra() { return sq[(st.n - 1) % giro]; }
    function vmL(passo) {
      var s = sqOra(), c = st.carta ? carta(st.carta) : null, e = errori(st.tent);
      var vs = { id: s.id, cap: "loc", n: st.tent.length, fatto: !!st.fatto, punti: s.punti, resta: 0, tent: st.tent, giusto: !!st.giusto, pz: st.pz || 0 };
      if (c && e >= 1) vs.prep = c.s; if (c && e >= 2) vs.nome = c.n;
      return { fase: "gioco", stile: D2 ? "due" : "squadra", tot: tot, n: st.n, passo: passo, k: "loc|" + st.n, rip: 0, mazzo: c ? c.m : null,
        foto: st.foto || null, ingr: c ? c.i : null, sq: [vs], tab: sq.map(function (x) { return { id: x.id, punti: x.punti }; }),
        carta: passo === "svela" && c ? { n: c.n, p: c.p, e: c.e, d: c.d, c: c.c, s: c.s } : null, turnoSq: D2 ? s.id : null,
        players: [{ id: "loc", nome: "", sq: s.id }], guarda: [], prossimi: [], resta: 0 };
    }
    function mostra(passo) {
      if (finito) return;
      var v = vmL(passo); cb.vm = v;
      if (!ui || !document.body.contains(ui.s)) { ui = scena(t, { esci: cb.onEsci, targa: false }); ui.cb = cb; UI = ui; }
      aggiorna(ui, v, cb);
      // (sullo stesso telefono: la stessa scena, aggiornata a pezzi)
    }
    function prossimo() {
      if (finito) return;
      st.n++;
      if (st.n > tot) return fineL();
      st.carta = null; st.foto = null; st.tent = []; st.fatto = false; st.giusto = false; st.pz = 0; st.falliti = 0;
      carica();
    }
    function carica() {
      mostra("carica");
      var mio = ++st.tok, mz = mazzoPer(st.ordine, st.n, giro);
      if (st.pross && !st.guaste[st.pross.id] && st.usate.indexOf(st.pross.id) < 0 && FOTO[st.pross.id] === st.pross.url) { var pr = st.pross; st.pross = null; return usaL(pr.id, pr.url); }
      st.pross = null;
      var id = pesca(mz, st.usate, st.guaste);
      if (!id) { st.guaste = {}; id = pesca(mz, st.usate, st.guaste); }
      if (!id) return fineL();
      caricaFoto(carta(id), function (u) {
        if (finito || mio !== st.tok) return;
        if (u) return usaL(id, u);
        st.guaste[id] = 1;
        if (++st.falliti >= FALLITI_MAX) return mostra("nofoto");
        carica();
      });
    }
    function usaL(id, url) { st.carta = id; st.foto = url; st.usate.push(id); segnaUsata(id); mostra("gioca"); }
    function rispostaL(c, n) {
      if (finito || st.fatto || +n !== st.tent.length || !paese(c) || st.tent.some(function (x) { return x.c === c; })) return;
      var v = valuta(c, carta(st.carta));
      st.tent.push(v);
      if (v.ok) { st.giusto = true; st.pz = puntiPer(st.tent.length); st.fatto = true; }
      else if (st.tent.length >= TENTATIVI) st.fatto = true;
      mostra("gioca");
      if (st.fatto) setTimeout(function () { if (!finito && cb.vm && cb.vm.k === "loc|" + st.n) svelaL(); }, 1300);
    }
    function svelaL() {
      var s = sqOra(); s.punti += st.pz || 0;
      var c = carta(st.carta);
      st.storia.push({ id: st.carta, e: c.e, p: c.p[0], sq: s.id, pt: D2 ? (s.id === "A" ? [st.pz, 0] : [0, st.pz]) : [st.pz] });
      mostra("svela");
      // durante la scheda si precarica la foto dopo
      if (st.n < tot) {
        var mio = st.tok, id = pesca(mazzoPer(st.ordine, st.n + 1, giro), st.usate, st.guaste);
        if (id) caricaFoto(carta(id), function (u) { if (!finito && mio === st.tok && u) st.pross = { id: id, url: u }; else if (!u) st.guaste[id] = 1; });
      }
    }
    function fineL() {
      finito = true; st.tok++;
      var a = sq[0].punti, b = sq[1] ? sq[1].punti : 0, s = t.schermata(D2 ? { icona: "🏆", titolo: a === b ? "Pareggio!" : "Vincono i " + SQUADRE[a > b ? "A" : "B"].nome + "!", sotto: "🔴 " + fmtN(a) + " – 🔵 " + fmtN(b) }
        : { icona: "🌍", titolo: fmtN(a) + " punti su " + fmtN(tot * TENTATIVI), sotto: frase(a, tot * TENTATIVI) });
      stile();
      if (D2) ["A", "B"].forEach(function (id, i) {
        var f = filaPortate(t, st.storia.filter(function (h) { return h.sq === id; }), i);
        f.insertBefore(t.el("span", { class: "dd-pt chi", text: SQUADRE[id].em }), f.firstChild); s._contenuto.appendChild(f);
        s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center", text: SQUADRE[id].em + " " + nomi.filter(function (n, k) { return k % 2 === i; }).join(", ") }));
      });
      else { s._contenuto.appendChild(filaPortate(t, st.storia, 0)); s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center", text: "🤝 " + nomi.join(", ") })); }
      if (D2 ? a !== b : a >= tot * TENTATIVI / 2) { vibra(60); suonoGiusto(); }
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Fine partita ▶", onclick: function () {
        var cl = nomi.map(function (nm, k) {
          var id = D2 ? (k % 2 ? "B" : "A") : "A", pt = id === "B" ? b : a, vince = !D2 || a === b || (a > b ? "A" : "B") === id;
          return { nome: nm, punti: pt, pos: vince ? 1 : 2 };
        });
        cl.sort(function (x, y) { return x.pos - y.pos; });
        t.fine(cl);
      } }));
      t.mostra(s);
    }
    prossimo();
  }

  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.dd-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:radial-gradient(120% 80% at 50% 0%,#2f6f62 0%,#163a3a 55%,#0d2326 100%);color:#fff}",
      ".schermata.dd-piena>.testa,.schermata.dd-piena>.piede{display:none}",
      ".schermata.dd-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".dd-scena{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:7px;padding:calc(8px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".dd-barra{display:flex;align-items:center;gap:8px;font-weight:800;font-size:.84rem;flex:none}",
      ".dd-esci{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".dd-info{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.92}",
      ".dd-tab{flex:none;background:rgba(0,0,0,.25);border-radius:999px;padding:4px 10px;font-weight:900}",
      // la foto: grande, si restringe quando serve spazio (scheda, tastiera aperta)
      ".dd-foto{position:relative;flex:1 1 auto;min-height:120px;border-radius:18px;overflow:hidden;background:rgba(0,0,0,.28);box-shadow:0 6px 20px rgba(0,0,0,.35)}",
      ".dd-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity .45s ease,transform .7s ease;-webkit-user-drag:none}",
      ".dd-img.su{opacity:1;transform:scale(1)}",
      ".dd-fmsg{position:absolute;left:12px;right:12px;top:50%;transform:translateY(-50%);text-align:center;font-weight:800;font-size:.95rem;opacity:.9}",
      ".dd-banner{position:absolute;left:50%;top:14px;transform:translateX(-50%);background:rgba(0,0,0,.6);border-radius:999px;padding:7px 16px;font-weight:900;font-size:1rem;white-space:nowrap;opacity:0;pointer-events:none}",
      ".dd-banner.su{animation:ddBanner 2.6s ease forwards}",
      "@keyframes ddBanner{0%{opacity:0;transform:translate(-50%,-14px) scale(.9)}14%{opacity:1;transform:translate(-50%,0) scale(1.04)}80%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-6px)}}",
      ".dd-festa{position:absolute;inset:0;pointer-events:none;overflow:hidden}",
      ".dd-cor{position:absolute;top:-12px;width:8px;height:12px;border-radius:2px;opacity:0;animation:ddCor 2.2s ease-in forwards}",
      "@keyframes ddCor{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--dx),330px) rotate(var(--rz))}}",
      ".dd-corpo{flex:none;display:flex;flex-direction:column;gap:6px}",
      ".dd-indizi{display:flex;flex-direction:column;gap:3px;background:rgba(0,0,0,.22);border-radius:14px;padding:7px 10px;font-size:.8rem;font-weight:700;line-height:1.3}",
      ".dd-ind{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".dd-ind.p,.dd-ind.n{display:none}.dd-ind.p.su,.dd-ind.n.su{display:-webkit-box;animation:ddPop .4s ease}.dd-ind.n{color:#ffe066}",
      ".dd-tent{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}",
      ".dd-tent.con-nome{grid-template-columns:auto minmax(0,1fr);align-items:center}.dd-tent .dd-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}",
      ".dd-chi{font-weight:900;font-size:.85rem;white-space:nowrap}",
      ".dd-slot{min-width:0;box-sizing:border-box;height:48px;border-radius:12px;padding:5px 6px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:rgba(255,255,255,.1)}",
      ".dd-slot b{max-width:100%;font-size:.78rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".dd-slot span{max-width:100%;font-size:.7rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9}",
      ".dd-slot.vuoto{opacity:.55;border:2px dashed rgba(255,255,255,.25);background:none}.dd-slot.largo{grid-column:1/-1}",
      ".dd-slot.si{background:linear-gradient(135deg,#2f9e44,#237a34)}.dd-slot.no{background:rgba(0,0,0,.3)}",
      ".dd-slot.g0{box-shadow:inset 0 0 0 2px #ff6b6b}.dd-slot.g1{box-shadow:inset 0 0 0 2px #ffa94d}.dd-slot.g2{box-shadow:inset 0 0 0 2px #ffe066}.dd-slot.g3{box-shadow:inset 0 0 0 2px #74c0fc}.dd-slot.g4{box-shadow:inset 0 0 0 2px #d0ebff}",
      ".dd-slot.nuovo{animation:ddPop .45s ease}",
      ".dd-altre{font-size:.76rem;font-weight:800;opacity:.85;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".dd-azione{display:flex;flex-direction:column;gap:5px}",
      ".dd-campo{display:flex;flex-direction:column;gap:6px}",
      ".dd-chips{display:flex;flex-wrap:wrap;gap:5px;height:66px;overflow:hidden;align-content:flex-start}",
      ".dd-chip{border:0;border-radius:999px;padding:6px 11px;background:rgba(255,255,255,.16);color:#fff;font:inherit;font-size:.86rem;font-weight:800;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".dd-chip.sel{background:#ffd43b;color:#2b2140}",
      ".dd-hint{font-size:.8rem;font-weight:700;opacity:.75;padding:6px 2px}",
      ".dd-riga{display:flex;gap:8px;align-items:center}",
      ".dd-input{flex:1;min-width:0;height:46px;box-sizing:border-box;border-radius:14px;border:2px solid rgba(255,255,255,.25);background:rgba(0,0,0,.25);color:#fff;font:inherit;font-size:1.05rem;font-weight:800;padding:0 12px}",
      ".dd-input:focus{outline:none;border-color:#ffd43b}.dd-input:disabled{opacity:.5}",
      ".dd-ok{width:auto;margin:0;flex:none;min-width:104px}",
      ".dd-bozza{margin:0;min-height:2.4em;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;font-size:.9rem;background:rgba(0,0,0,.2);border-radius:12px;padding:6px 10px}",
      ".dd-conto{margin:0;text-align:center;font-weight:800;opacity:.85;font-size:.84rem;min-height:1.2em}",
      ".dd-attesa{margin:0;text-align:center;font-weight:800;font-size:.95rem;opacity:.9;padding:8px 0}",
      ".dd-riprova{margin:0}",
      // la scheda della rivelazione
      ".dd-scena.dd-svela .dd-foto{flex:1 1 0;min-height:90px}",
      ".dd-scheda{background:linear-gradient(180deg,#fff8e1,#ffeeba);color:#3b2a00;border-radius:16px;padding:9px 12px;box-shadow:0 5px 0 #c9a042;animation:ddPop .45s ease;display:flex;flex-direction:column;gap:3px}",
      ".dd-paese{display:flex;align-items:center;gap:8px;font-size:1.08rem;line-height:1.15}.dd-paese b{font-weight:900;overflow-wrap:anywhere}.dd-band{font-size:1.9rem;line-height:1;flex:none}",
      ".dd-nome{font-weight:900;font-size:.95rem}",
      ".dd-cose{font-size:.8rem;font-weight:700;line-height:1.3}",
      ".dd-curio{font-size:.78rem;font-weight:700;line-height:1.3;opacity:.92}",
      ".dd-avanti{margin:0}",
      ".dd-scena.dd-scrivo .dd-foto{flex:0 0 76px;min-height:76px}.dd-scena.dd-scrivo .dd-ind{-webkit-line-clamp:1}",
      ".dd-fac{flex:none;display:flex;justify-content:center}",
      ".dd-avviso{position:absolute;left:12px;right:12px;top:24%;text-align:center;font-weight:900;font-size:1.25rem;color:#ffd43b;text-shadow:0 2px 10px rgba(0,0,0,.7);opacity:0;pointer-events:none}",
      ".dd-avviso.si{color:#8ce99a}.dd-avviso.no{color:#ffe3e3}",
      ".dd-avviso.su{animation:ddAvviso 2.2s ease}",
      "@keyframes ddAvviso{0%{opacity:0;transform:scale(.8)}12%{opacity:1;transform:scale(1.06)}80%{opacity:1}100%{opacity:0}}",
      "@keyframes ddPop{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.05);opacity:1}100%{transform:scale(1)}}",
      ".dd-scena.dd-con-targa{padding-bottom:calc(62px + env(safe-area-inset-bottom))}",
      ".schermata.dd-fine-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
      // saletta: le due squadre
      ".dd-squadre{display:flex;flex-direction:column;gap:6px;margin:4px 0}",
      ".dd-sqriga{display:flex;flex-wrap:wrap;align-items:center;gap:5px;border-radius:12px;padding:6px 8px}.dd-sqriga.sqA{background:rgba(255,107,107,.18)}.dd-sqriga.sqB{background:rgba(77,171,247,.18)}",
      ".dd-sqnome{font-weight:900;margin-right:4px}",
      ".dd-sqchip{border:0;border-radius:999px;padding:4px 10px;background:rgba(255,255,255,.18);color:inherit;font:inherit;font-weight:800;font-size:.85rem}.dd-sqchip.io{outline:2px solid #ffd43b}",
      "button.dd-sqchip{cursor:pointer}",
      ".dd-sqtasti{display:flex;align-items:center;justify-content:space-between;gap:8px}.dd-mischia{width:auto;margin:0;padding:6px 12px}",
      // fine partita: la fila delle portate
      ".dd-fila{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:2px 0 8px}",
      ".dd-pt{font-size:.85rem;font-weight:900;background:rgba(0,0,0,.08);border-radius:999px;padding:3px 8px}.dd-pt.si{background:rgba(47,158,68,.22)}.dd-pt.chi{background:none}",
      "@media (max-height:680px){.dd-indizi{font-size:.76rem;padding:6px 9px}.dd-slot{height:44px}.dd-chips{height:62px}.dd-input{height:42px}.dd-cose,.dd-curio{font-size:.76rem}.dd-band{font-size:1.6rem}}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Da dove viene?", icona: "🍹",
    descrizione: "Esce la foto di un piatto o di un drink da tutto il mondo: da che paese viene? Tre tentativi, con distanza e direzione.",
    giocatoriMin: 1, giocatoriMax: MAX, difficolta: 2,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Un telefono in mezzo al tavolo: si discute e si risponde insieme", amici: true, min: 1 }],
    postiOnline: MAX,
    ritardatari: RITARDATARI,
    riprende: true,
    riserva: true,
    riassunto: function (imp) {
      var r = regoleDa(imp), mz = r.mazzi.map(function (id) { var m = mazzoDi(id); return m ? m.icona : ""; }).join("");
      return (r.stile === "due" ? "⚔️ Due squadre" : "🤝 Tutti in squadra") + " · " + r.portate + " portate · " + mz;
    },
    regole: [
      "Esce la <b>foto vera</b> di un piatto o di un drink, spesso da paesi lontani. Discutete e date <b>una risposta</b>: da che <b>paese</b> viene?",
      "Avete <b>3 tentativi</b>. Dopo ogni errore il gioco dice <b>quanto siete lontani e in che direzione</b>: 🔥 Fuoco! (meno di 500 km), 🌡️ Caldo, 🙂 Tiepido, 🥶 Freddo, ❄️ Lontanissimo, con la freccia ⬆️↗️➡️ per dove andare.",
      "Gli <b>indizi</b> arrivano a poco a poco: all'inizio la foto e gli <b>ingredienti</b>, dopo il primo errore <b>come si prepara</b>, dopo il secondo <b>il nome</b>. Alla fine la scheda con il paese, cos'è e una curiosità.",
      "<b>Punti</b>: 3 al primo tentativo, 2 al secondo, 1 al terzo. Alcuni piatti hanno <b>più paesi giusti</b> (il Pisco Sour è del Perù e del Cile!).",
      "<b>🤝 Tutti in squadra</b>: giocate insieme, quanti punti fate? <b>⚔️ Due squadre</b>: stesso piatto per tutte e due, i tentativi dell'altra squadra si vedono solo alla fine; vince chi fa più punti.",
      "Online, a ogni piatto un <b>capitano</b> a turno scrive la risposta e gli altri vedono cosa scrive: la discussione resta a voce. Sullo stesso telefono lo mettete in mezzo al tavolo (a due squadre si gioca a turno, un piatto a testa)."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, r = regoleDa(Object.assign({}, leggi(CHIAVE_REGOLE) || {}, dove));
      dove.stile = r.stile; dove.portate = r.portate; dove.mazzi = r.mazzi.slice();
      function salva() { scrivi(CHIAVE_REGOLE, { stile: dove.stile, portate: dove.portate, mazzi: dove.mazzi }); }
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var gs = el("div", { class: "modo-griglia" }), bs = {};
      [["squadra", "🤝", "Tutti in squadra", "Una squadra sola: quanti punti fate?"], ["due", "⚔️", "Due squadre", "Stesso piatto, vince chi fa più punti"]].forEach(function (o) {
        var b = bs[o[0]] = el("button", { class: "modo-chip", type: "button", onclick: function () { dove.stile = o[0]; aggiorna(); salva(); } },
          [el("span", { class: "mi", text: o[1] }), el("div", {}, [el("div", { class: "mt", text: o[2] }), el("div", { class: "ms", text: o[3] })])]);
        gs.appendChild(b);
      });
      box.appendChild(gs);
      box.appendChild(el("div", { class: "etichetta", text: "Quante portate" }));
      var gp = el("div", { class: "modo-griglia", style: "display:grid;grid-template-columns:repeat(3,1fr)" }), bp = {};
      [5, 8, 10].forEach(function (n) {
        var b = bp[n] = el("button", { class: "modo-chip", type: "button", style: "justify-content:center", onclick: function () { dove.portate = n; aggiorna(); salva(); } },
          [el("div", { class: "mt", text: n + " portate" })]);
        gp.appendChild(b);
      });
      box.appendChild(gp);
      box.appendChild(el("div", { class: "etichetta", text: "Il menù" }));
      var gm = el("div", { style: "display:flex;flex-wrap:wrap;gap:8px" }), bm = {};
      mazzi().forEach(function (m) {
        var n = carteDi(m.id).length;
        var b = bm[m.id] = el("button", { class: "cat-chip", type: "button", onclick: function () {
          var i = dove.mazzi.indexOf(m.id);
          if (i >= 0) { if (dove.mazzi.length > 1) dove.mazzi.splice(i, 1); } else dove.mazzi.push(m.id);
          aggiorna(); salva();
        } }, [el("span", { text: m.icona }), el("span", { text: m.nome + " (" + fmtN(n) + ")" })]);
        gm.appendChild(b);
      });
      box.appendChild(gm);
      function aggiorna() {
        Object.keys(bs).forEach(function (k) { bs[k].className = "modo-chip" + (dove.stile === k ? " attiva" : ""); });
        Object.keys(bp).forEach(function (k) { bp[k].className = "modo-chip" + (dove.portate === +k ? " attiva" : ""); });
        Object.keys(bm).forEach(function (k) { bm[k].className = "cat-chip" + (dove.mazzi.indexOf(k) >= 0 ? " attiva" : ""); });
      }
      aggiorna();
    },
    avvia: function (t) {
      if (!tutte().length || !paesi().length) {
        var s = t.schermata({ icona: "🍹", titolo: "Manca il menù", indietro: t.esci });
        s._contenuto.appendChild(t.el("p", { text: "Le schede dei piatti non sono state caricate." }));
        s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
        return t.mostra(s);
      }
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito (o dalla Sala)
      if (t.impostazioni && t.impostazioni.modo === "online") return host(t);
      locale(t);
    }
  });
})();
