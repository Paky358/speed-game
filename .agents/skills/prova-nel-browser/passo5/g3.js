// PROVE DEL PASSO 5, pezzo p5-g3: la partita riprende quando l'host ricarica, nei giochi di squadra e di spettacolo
// (Taboo, Sì… però, L'Asta coi temi e col Fantacalcio, La Ruota della Fortuna).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo5/g3.js"); await COPIONE.prova(550)
//
// 550 Taboo: l'host ricarica in saletta (→ saletta), tra un turno e l'altro (stesso turno, stessi punti), a metà turno (il
//     turno si rifà da capo: punti di inizio turno, «🔁 … si rifà da capo», tempo intero e una carta nuova) e sulla classifica.
// 551 Sì… però: in saletta, mentre una squadra gioca le carte (stessa fase e le carte tornano alle squadre), all'arringa,
//     al verdetto e sulla classifica.
// 552 L'Asta (temi): in saletta, all'inizio del round, mentre si sceglie, durante l'asta (il lotto riparte da capo), sull'esito,
//     sui kit, al voto (i voti dati restano, i secondi continuano) e sulla classifica.
// 552b L'Asta (Fantacalcio): durante l'asta di un calciatore (riparte da capo), sull'esito e sulla classifica: rose e crediti restano.
// 553 La Ruota della Fortuna: in saletta, durante la frase lampo, quando tocca a uno (tocca ancora a lui, stessa frase), mentre
//     la ruota gira (non gira da sola: la rigira chi l'aveva girata), sulla fine della manche e sulla classifica.
// 554 L'Asta: l'host ricarica mentre due amici si rilanciano un lotto → il lotto riparte da 1 da chi l'aveva scelto e i crediti
//     di tutti sono quelli di prima (nessuno ha pagato niente); poi l'asta si chiude e paga solo chi la vince.
// 555 Sì… però: l'host ricarica mentre il giudice sta decidendo → il giudice ha ancora i tasti, coi secondi che restavano
//     (non di nuovo 90), e il suo verdetto vale.
// Ogni volta: stesso codice, la foto dice che la partita riprende (_r), gli amici non passano dalla saletta e leggono
// «🔁 Paky è tornato: la partita riprende da dove era», l'host «🔁 Partita ripresa!», nessun errore; sulla classifica niente
// partita (XP) data di nuovo né "__esito" doppio. Le regole si accorciano con w.__imp (solo l'host le legge).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, pill = A.pill, mioId = A.mioId, contaDentro = A.contaDentro;
  var GIOCHI = ["taboo", "sipero", "asta", "ruota"];
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- la spia (solo con apriTel(nome, { spiaG3: true })): w.__imp = regole per la prova, w.__cbH[gid] = la stanza
  //      dell'host (per mandare le sue mosse senza toccare lo schermo) ----
  if (!W.__prepG3) {
    W.__prepG3 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG3(w, nome, opz);
      if (!opz || !opz.spiaG3) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GIOCHI.indexOf(g.id) >= 0 && !g.__spiaG3) {
            g.__spiaG3 = true; var av = g.avvia;
            g.avvia = function (t) {
              if (w.__imp && t.impostazioni && !t.linkParams.stanza) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              w.__t = t;
              if (!w.__cbH) {
                w.__cbH = {};
                var osp = w.SGNet.ospita;
                w.SGNet.ospita = function (gid, cb) { w.__cbH[gid] = cb; return osp.apply(this, arguments); };
              }
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- aiuti ----
  function N() { var l = []; l.nota = function (x) { l.push(x); }; return l; }
  function nomeDi(v, id) { var p = ((v.giocatori || []).filter(function (x) { return x.id === id; }))[0]; return p ? p.nome : null; }
  function idDi(v, nome) { var p = ((v.giocatori || []).filter(function (x) { return x.nome === nome; }))[0]; return p ? p.id : null; }
  function punti(v) { return (v.giocatori || []).map(function (p) { return p.nome + ":" + (p.punti != null ? p.punti : p.totale != null ? p.totale : p.crediti); }).join(",") + (v.punti && v.punti.length === 2 ? " [" + v.punti.join("-") + "]" : ""); }
  function stessiPunti(a, b) { return punti(a) === punti(b) ? true : "punti cambiati: " + punti(a) + " → " + punti(b); }
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Problema di collegamento|Collegamento perso|Ops|La stanza è chiusa|non risponde|è ferma|stata chiusa/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 80);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  // un tocco vero (pointerdown + pointerup: i tasti di Taboo ascoltano quelli) sul primo tasto attivo con quel testo
  function tocca(w, re) {
    if (!w) return false;
    var b = [].filter.call(w.document.querySelectorAll("button"), function (x) { return re.test(x.textContent) && !x.disabled; })[0];
    if (!b) return false;
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tp) { b.dispatchEvent(new Ev(tp, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    return true;
  }
  // apre la stanza col percorso di prima e fa entrare gli amici; tutti col contatore delle partite date (XP)
  async function stanza(nomeTessera, gid, imp, amici) {
    W.__partite = {};
    var P = await W.apriTel("Paky", { x: 0, spiaG3: true, prima: function (w) { w.__imp = imp || null; A.contaPartite("Paky")(w); } });
    var C = await W.apriStanza(P, nomeTessera);
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i];
      await W.apriTel(n, { hash: "gioco=" + gid + "&stanza=" + C, x: 185 * (i + 1), spiaG3: true, prima: A.contaPartite(n) });
    }
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === amici.length + 1; }, 10000)) no("nella saletta non ci sono in " + (amici.length + 1) + " (" + punti(vm(C)) + ")");
    return { P: P, C: C };
  }
  function cbHost(gid) { var w = W.finestra("Paky"); return w && w.__cbH && w.__cbH[gid]; }
  // una mossa mandata come la manderebbe quel telefono (l'host: come se arrivasse da "host")
  function manda(gid, nome, msg) {
    if (nome === "Paky") { var cb = cbHost(gid); if (cb) cb.onMsg("host", msg); }
    else { var h = W.reteDi(nome); if (h) h.invia(msg); }
  }
  // gira finché fino(vm) è vero, facendo passo(vm) ogni 300 ms
  async function finche(C, fino, passo, ms, perche) {
    var t = Date.now() + (ms || 60000);
    while (Date.now() < t) {
      var v = vm(C);
      if (fino(v)) return v;
      try { if (passo) await passo(v); } catch (e) { if (/^NO:/.test(e.message)) throw e; }
      await W.dorme(300);
    }
    no((perche || "non si arriva al punto della prova") + " (fase " + vm(C).fase + ")");
  }
  // L'HOST RICARICA e la partita riprende (come in passo5/g2.js): o = { controlla(prima, dopo): true o il perché,
  // lobby: true (in saletta: si torna in saletta), salva: ms prima di ricaricare, attesa }. Restituisce { prima, dopo, dt }
  async function ricaricaHost(C, amici, o) {
    o = o || {};
    await W.aspetta(function () { return amici.every(function (n) { return !/tornato/.test(pill(W.finestra(n))); }) && !/ripresa/i.test(pill(W.finestra("Paky"))); }, 6000);
    await W.dorme(o.salva || 900);   // (la ripresa si salva al massimo ogni mezzo secondo)
    var prima = JSON.parse(JSON.stringify(vm(C))), sPrima = (W.statoStanza(C) || {})._s, t0 = Date.now();
    await W.ricarica("Paky");
    var pillAmici = {}, pillHost = "", saletta = {}, perche = "";
    var ok = await W.aspetta(function () {
      amici.forEach(function (n) {
        var f = W.finestra(n); if (!f) return;
        var p = pill(f); if (/tornato/.test(p)) pillAmici[n] = p;
        if (!o.lobby && f.document.querySelector(".saletta-schermo")) saletta[n] = 1;
      });
      var ph = pill(W.finestra("Paky")); if (/ripresa/i.test(ph)) pillHost = ph;
      var s = W.statoStanza(C) || {}, v = vm(C);
      if (!s._s || s._s === sPrima) { perche = "nessuna foto nuova dell'host sul codice " + C; return false; }
      if (o.lobby) {
        if (v.fase !== "lobby") { perche = "dalla saletta la stanza riapre in fase " + v.fase; return false; }
        if (s._r) { perche = "dalla saletta la foto dice _r"; return false; }
        if (contaDentro(v) < amici.length + 1) { perche = "in saletta non sono tutti di nuovo dentro (" + contaDentro(v) + ")"; return false; }
        return true;
      }
      if (!s._r) { perche = "la foto nuova non dice che la partita riprende (_r)"; return false; }
      if (!v.fase || v.fase === "lobby") { perche = "la partita è tornata in saletta"; return false; }
      if (contaDentro(v) < amici.length + 1) { perche = "non sono tutti di nuovo dentro (" + contaDentro(v) + ")"; return false; }
      var c = o.controlla ? o.controlla(prima, v) : true;
      if (c !== true) { perche = typeof c === "string" ? c : "la partita non è quella di prima"; return false; }
      if (!amici.every(function (n) { return pillAmici[n]; })) { perche = "non tutti gli amici leggono la pillola «è tornato»"; return false; }
      if (!pillHost) { perche = "l'host non legge «🔁 Partita ripresa!»"; return false; }
      return true;
    }, o.attesa || 12000);
    if (!ok) no("ricarica dell'host in " + prima.fase + ": " + perche + " (fase " + vm(C).fase + ")");
    var ns = Object.keys(saletta); if (ns.length) no("ricarica dell'host in " + prima.fase + ": " + ns.join(", ") + " è passato dalla saletta");
    if (!o.lobby) amici.forEach(function (n) { if (!/riprende da dove era/.test(pillAmici[n])) no(n + " legge «" + pillAmici[n] + "» invece di «… la partita riprende da dove era»"); });
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return { prima: prima, dopo: JSON.parse(JSON.stringify(vm(C))), dt: ((Date.now() - t0) / 1000).toFixed(1) };
  }
  // sulla classifica finale: niente partita (XP) data di nuovo, un solo "__esito"
  async function fineSenzaDoppi(C, nomi, nE) {
    await W.dorme(2500);
    nomi.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite date dopo la ricarica sulla classifica: " + JSON.stringify(W.__partite)); });
    var e = A.contaStoria(C, '"__esito"'); if (e !== nE) no("dopo la ricarica sulla classifica gli __esito sono " + e + " (prima " + nE + ")");
  }
  function ripresaDi(nome) { try { return JSON.parse(W.BR.mem[nome].l["sg-ripresa"]); } catch (e) { return null; } }
  // la schermata del gioco sta in uno schermo da telefono (niente scorrimento, i tasti dentro)
  async function misura(nome, larg, alt, sel) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document;
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(500);
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px a " + larg + "x" + alt + ")";
    var fuori = [].filter.call(d.querySelectorAll(sel || "button"), function (b) { var r = b.getBoundingClientRect(); return r.height && r.bottom > alt + 1; });
    if (fuori.length) return "«" + fuori[0].textContent.trim().slice(0, 30) + "» esce dallo schermo a " + larg + "x" + alt;
    return "";
  }

  // =====================================================================
  //  550 TABOO
  // =====================================================================
  var OFF = 0;   // quanto è avanti l'orologio dell'host (per finire un turno senza aspettare 60 secondi)
  function avanti(ms) { OFF += ms; W.spostaOrologio("Paky", OFF); }
  COPIONE.aggiungi(550, { nome: "Taboo: l'host ricarica in saletta, tra un turno e l'altro, a metà turno (turno da capo, carta nuova) e sulla classifica", fai: async function () {
    var L = N(), amici = ["Giulia", "Luca", "Sara"], nomi = ["Paky"].concat(amici), sent = sentinella(nomi);
    OFF = 0;
    var X = await stanza("Taboo", "taboo", { tempo: 60, giri: 1, carte: 2 }, amici), C = X.C;
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    var v0 = await finche(C, function (v) { return v.fase === "pronto" && v.attivo; }, null, 10000, "non comincia");
    // tra un turno e l'altro: stesso turno, stesso chi spiega, stessi punti
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "pronto" ? "fase " + b.fase : b.attivo !== a.attivo ? "chi spiega è cambiato" : b.turno !== a.turno ? "turno " + a.turno + " → " + b.turno : stessiPunti(a, b); } });
    if (!(r.dopo.restano > 15000)) no("tra un turno e l'altro chi spiega non ha di nuovo il suo tempo (" + r.dopo.restano + " ms)");
    L.nota("pronto → stesso turno (" + r.dt + " s)");
    // a metà turno: due carte indovinate, poi l'host ricarica → si torna a «Pronti?» con i punti di inizio turno
    var chi = nomeDi(vm(C), vm(C).attivo), wChi = W.finestra(chi), puntiPrima = vm(C).punti.slice(), turno = vm(C).turno;
    if (!await W.aspetta(function () { return tocca(wChi, /Pronti, via/); }, 5000)) no(chi + " non ha «Pronti, via!»");
    await finche(C, function (v) { return v.fase === "turno" && v.carta; }, null, 6000, "il turno non parte");
    await W.dorme(600);   // (dopo un tocco i tasti di Taboo si fermano 400 ms)
    for (var k = 0; k < 2; k++) {
      var c0 = vm(C).chiaveCarta;
      if (!tocca(wChi, /Indovinata/)) no(chi + " non ha «✅ Indovinata»");
      await finche(C, function (v) { return v.chiaveCarta !== c0; }, null, 4000, "la carta indovinata non conta");
      await W.dorme(450);
    }
    var cartaPrima = vm(C).carta.p, sq = vm(C).team;
    if (vm(C).punti[sq] !== puntiPrima[sq] + 2) no("le due carte indovinate non contano (" + vm(C).punti.join("-") + ")");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "pronto") return "fase " + b.fase + " (il turno non si rifà da capo)";
      if (b.attivo !== a.attivo) return "chi spiega è cambiato";
      if (b.turno !== turno) return "turno " + turno + " → " + b.turno;
      if (b.punti.join("-") !== puntiPrima.join("-")) return "i punti non sono quelli di inizio turno (" + puntiPrima.join("-") + " → " + b.punti.join("-") + ")";
      return b.rifatto ? true : "la foto non dice che il turno si rifà (rifatto)";
    } });
    if (!await W.aspetta(function () { return /si rifà da capo/.test(T(W.finestra("Giulia"))) && /si rifà da capo/.test(T(W.finestra("Paky"))); }, 5000)) no("Giulia e Paky non leggono «… il turno si rifà da capo»");
    var m1 = await misura(chi, 360, 640, ".tb-tasti button"); if (m1) no("la scritta del turno rifatto: " + m1);
    var m2 = await misura(chi, 412, 915, ".tb-tasti button"); if (m2) no("la scritta del turno rifatto: " + m2);
    wChi = W.finestra(chi);
    if (!await W.aspetta(function () { return tocca(wChi, /Pronti, via/); }, 5000)) no(chi + " non ha di nuovo «Pronti, via!»");
    var vT = await finche(C, function (v) { return v.fase === "turno" && v.carta; }, null, 6000, "il turno rifatto non parte");
    if (vT.carta.p === cartaPrima) no("il turno rifatto ha la stessa carta di prima («" + cartaPrima + "»)");
    if (!(vT.restano > 55000)) no("il turno rifatto non ha il tempo intero (" + vT.restano + " ms)");
    L.nota("turno a metà → turno " + turno + " da capo coi punti " + puntiPrima.join("-") + ", carta nuova «" + vT.carta.p + "» (" + r.dt + " s)");
    // fino alla fine (il tempo dei turni lo fa passare l'orologio dell'host)
    var visti = {};
    await finche(C, function (v) { return v.fase === "fine"; }, function (v) {
      var k2 = v.fase + "|" + v.turno;
      if (v.fase === "turno" && !visti[k2]) { visti[k2] = 1; avanti(61000); }
      else if (v.fase === "pronto" && v.attivo && !visti[k2]) { visti[k2] = 1; avanti(21000); }
    }, 90000, "la partita non finisce");
    await W.dorme(1500);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : stessiPunti(a, b); } });
    if (!await W.aspetta(function () { return /vince|Pareggio/.test(T(W.finestra("Paky"))); }, 8000)) no("l'host ricaricato non vede la classifica");
    await fineSenzaDoppi(C, nomi, nE);
    L.nota("classifica → classifica, niente XP doppi (" + r.dt + " s)");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    W.spostaOrologio("Paky", 0);
    return L.join(" · ");
  } });

  // =====================================================================
  //  551 SÌ… PERÒ (e 555)
  // =====================================================================
  // la squadra di turno gioca le sue carte dal telefono (tocca le prime n carte e «Gioca ▶»); il giudice va avanti
  function passoS(fatti, fino) {
    return function (v) {
      var st = v.step;
      if (v.fase === "gioco" && st && (!fino || fino(v) !== false)) {
        var k = "g|" + v.round + "|" + st.i; if (fatti[k]) return;
        (v.giocatori || []).forEach(function (p) {
          if (fatti[k] || v.assegna[p.id] !== st.sq) return;
          var w = W.finestra(p.nome); if (!w) return;
          var cc = w.document.querySelectorAll(".sp-carta"); if (cc.length < st.n) return;
          [].slice.call(cc, 0, st.n).forEach(function (c) { if (!c.classList.contains("su")) c.click(); });
          if (W.clicca(w, /Gioca ▶/)) fatti[k] = 1;
        });
      }
      var g = nomeDi(v, v.giudiceId), wg = g && W.finestra(g);
      if (v.fase === "arringa" && wg && !fatti["a|" + v.round + "|" + v.parla]) { if (W.clicca(wg, /Tocca alla Squadra|Al verdetto/)) fatti["a|" + v.round + "|" + v.parla] = 1; }
      if (v.fase === "giudizio" && wg && !fatti["d|" + v.round]) { var b = wg.document.querySelector(".sp-vota"); if (b) { b.click(); b.click(); fatti["d|" + v.round] = 1; } }   // (30 ott 2026: il secondo tocco conferma)
      if (v.fase === "esito" && !fatti["e|" + v.round]) { if (W.clicca(W.finestra("Paky"), /Prossimo round|Classifica finale/)) fatti["e|" + v.round] = 1; }
    };
  }
  function scen(v) { return JSON.stringify(v.scen); }
  COPIONE.aggiungi(551, { nome: "Sì… però: l'host ricarica in saletta, mentre si giocano le carte, all'arringa, al verdetto e sulla classifica", fai: async function () {
    var L = N(), amici = ["Giulia", "Luca"], nomi = ["Paky"].concat(amici), sent = sentinella(nomi), fatti = {};
    var X = await stanza("Sì... però", "sipero", { giri: 1, arringa: 0, modalita: "classica" }, amici), C = X.C;
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // mentre si giocano le carte: dopo la prima mossa, la seconda squadra deve ancora giocare
    await finche(C, function (v) { return v.fase === "gioco" && v.step && v.step.i === 1; }, passoS(fatti, function (v) { return v.step.i < 1; }), 30000, "la prima squadra non gioca le carte");
    var sq = vm(C).step.sq, chiGioca = (vm(C).giocatori || []).filter(function (p) { return vm(C).assegna[p.id] === sq; }).map(function (p) { return p.nome; });
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "gioco" || !b.step) return "fase " + b.fase;
      if (b.step.i !== a.step.i || b.step.sq !== a.step.sq) return "il passo è cambiato (" + a.step.i + " → " + b.step.i + ")";
      if (scen(a) !== scen(b)) return "il tavolo è cambiato";
      return b.resta >= 8 && b.resta <= 120 ? stessiPunti(a, b) : "il tempo per giocare è " + b.resta + " s";
    } });
    // le carte tornano alla squadra di turno (sul telefono di chi deve giocare)
    for (var i = 0; i < chiGioca.length; i++) {
      var n = chiGioca[i];
      if (!await W.aspetta(function () { return W.finestra(n).document.querySelectorAll(".sp-carta").length > 0 && /Gioca ▶|Decide /.test(T(W.finestra(n))); }, 8000)) no(n + " non ha di nuovo le sue carte e «Gioca ▶» (o «👑 Decide …»)");   // (30 ott 2026: gioca il capo)
    }
    L.nota("carte → stessa fase, le carte tornano a " + chiGioca.join(", ") + " (" + r.dt + " s)");
    // all'arringa
    await finche(C, function (v) { return v.fase === "arringa"; }, passoS(fatti), 60000, "non si arriva all'arringa");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "arringa" ? "fase " + b.fase : b.parla !== a.parla ? "parla un'altra squadra" : scen(a) !== scen(b) ? "il tavolo è cambiato" : true; } });
    L.nota("arringa → arringa della stessa squadra (" + r.dt + " s)");
    // al verdetto
    await finche(C, function (v) { return v.fase === "giudizio"; }, function (v) { if (v.fase === "arringa") passoS(fatti)(v); }, 20000, "non si arriva al verdetto");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "giudizio" ? "fase " + b.fase : scen(a) !== scen(b) ? "il tavolo è cambiato" : stessiPunti(a, b); } });
    L.nota("verdetto → verdetto (" + r.dt + " s)");
    // sull'esito
    await finche(C, function (v) { return v.fase === "esito"; }, function (v) { if (v.fase === "giudizio") passoS(fatti)(v); }, 20000, "il giudice non decide");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "esito" ? "fase " + b.fase : b.vincitore !== a.vincitore ? "ha vinto un'altra squadra" : stessiPunti(a, b); } });
    L.nota("esito → esito (" + r.dt + " s)");
    // fino alla classifica
    await finche(C, function (v) { return v.fase === "fine"; }, passoS(fatti), 180000, "la partita non finisce");
    await W.dorme(1500);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : JSON.stringify(a.classifica) === JSON.stringify(b.classifica) ? true : "classifica cambiata"; } });
    await fineSenzaDoppi(C, nomi, nE);
    L.nota("classifica → classifica, niente XP doppi (" + r.dt + " s)");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return L.join(" · ");
  } });

  COPIONE.aggiungi(555, { nome: "Sì… però: l'host ricarica mentre il giudice sta decidendo → tasti e secondi che restavano, il verdetto vale", fai: async function () {
    var amici = ["Giulia", "Luca"], fatti = {};
    var X = await stanza("Sì... però", "sipero", { giri: 1, arringa: 0, modalita: "classica" }, amici), C = X.C;
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    await finche(C, function (v) { return v.fase === "giudizio"; }, passoS(fatti, function () {}), 60000, "non si arriva al verdetto");
    var g = nomeDi(vm(C), vm(C).giudiceId);
    await W.dorme(7000);   // il giudice ci pensa un po'
    var r = await ricaricaHost(C, amici.concat([]), { controlla: function (a, b) { return b.fase !== "giudizio" ? "fase " + b.fase : b.giudiceId !== a.giudiceId ? "il giudice è cambiato" : true; } });
    var resta = r.dopo.resta;
    if (!(resta >= 8 && resta <= 84)) no("dopo la ripresa il giudice ha " + resta + " s (dovevano essere quelli che restavano, meno di 84)");
    var wg = W.finestra(g);
    var b = await W.aspetta(function () { return wg.document.querySelectorAll(".sp-vota").length === 2 ? wg.document.querySelectorAll(".sp-vota") : null; }, 6000);
    if (!b) no(g + " (giudice) non ha più i due tasti per decidere");
    var vPrima = vm(C);
    b[1].click(); b[1].click();   // (30 ott 2026: un tocco sceglie, il secondo conferma)
    var v = await finche(C, function (x) { return x.fase === "esito"; }, null, 6000, "il verdetto dopo la ripresa non vale");
    if (v.vincitore !== 1 || v.sorte) no("ha vinto la squadra " + v.vincitore + (v.sorte ? " (a sorte)" : "") + " invece della 2 scelta dal giudice");
    var vinti = (v.giocatori || []).filter(function (p) { return v.assegna[p.id] === 1; }).map(function (p) { return p.nome + ":" + p.punti; });
    if (!(v.giocatori || []).filter(function (p) { return v.assegna[p.id] === 1; }).every(function (p) { var q = (vPrima.giocatori || []).filter(function (x) { return x.id === p.id; })[0]; return q && p.punti === q.punti + 1; })) no("la squadra vincente non prende il punto (" + vinti.join(", ") + ")");
    return "il giudice " + g + " aveva " + resta + " s dopo la ripresa (" + r.dt + " s), il suo verdetto vale (" + vinti.join(", ") + ")";
  } });

  // =====================================================================
  //  552 L'ASTA (temi), 552b (Fantacalcio), 554 (offerte in corso)
  // =====================================================================
  function crediti(v) { return (v.giocatori || []).map(function (g) { return g.nome + ":" + g.crediti + "/" + (g.kit || []).length; }).join(","); }
  // le mosse dell'asta coi temi: chi sceglie mette all'asta la prima carta, gli altri passano (la carta va a 1); al voto 4 stelle a tutti
  function passoA(fatti, chiPassa) {
    return function (v) {
      if (v.fase === "scelta" && v.sceglieId && v.tavolo && v.tavolo.length && !fatti["s" + v.nScelta]) {
        fatti["s" + v.nScelta] = 1; manda("asta", nomeDi(v, v.sceglieId), { t: "scegli", idx: 0, n: v.nScelta, nome: v.tavolo[0].nome });
      }
      if (v.fase === "asta" && v.asta) (v.giocatori || []).forEach(function (g) {
        var k = "p" + v.asta.n + g.id;
        if (fatti[k] || g.haCarta || g.id === v.asta.leaderId || (chiPassa && chiPassa.indexOf(g.nome) < 0)) return;
        fatti[k] = 1; manda("asta", g.nome, { t: "passa", n: v.asta.n });
      });
      if (v.fase === "voto") (v.giocatori || []).forEach(function (g) {
        if (fatti["v" + g.id] || (v.hannoVotato || []).indexOf(g.id) >= 0) return;
        var voti = {}; v.giocatori.forEach(function (x) { if (x.id !== g.id) voti[x.id] = 4; });
        fatti["v" + g.id] = 1; manda("asta", g.nome, { t: "voto", voti: voti, s: v.sessione });
      });
    };
  }
  COPIONE.aggiungi(552, { nome: "L'Asta (temi): l'host ricarica in saletta, al round, mentre si sceglie, durante l'asta, sull'esito, sui kit, al voto e sulla classifica", fai: async function () {
    var L = N(), amici = ["Giulia", "Luca"], nomi = ["Paky"].concat(amici), sent = sentinella(nomi), fatti = {};
    var X = await stanza("L'Asta", "asta", { formato: "temi", crediti: 15 }, amici), C = X.C;
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // all'inizio del round (va avanti da solo dopo 4,5 s: dopo la ripresa round o scelta, stesso round)
    await finche(C, function (v) { return v.fase === "round"; }, null, 8000, "il primo round non comincia");
    r = await ricaricaHost(C, amici, { salva: 600, controlla: function (a, b) { return (b.fase !== "round" && b.fase !== "scelta") ? "fase " + b.fase : b.roundIdx !== a.roundIdx ? "round " + a.roundIdx + " → " + b.roundIdx : JSON.stringify(a.tavolo) !== JSON.stringify(b.tavolo) ? "le carte del round sono cambiate" : true; } });
    L.nota("round → stesso round, stesse carte (" + r.dt + " s)");
    // mentre si sceglie: tocca ancora a chi toccava
    await finche(C, function (v) { return v.fase === "scelta"; }, null, 10000, "non si arriva alla scelta");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "scelta" ? "fase " + b.fase : b.sceglieId !== a.sceglieId ? "sceglie un altro" : b.restaScelta < 7000 ? "chi sceglie ha solo " + b.restaScelta + " ms" : crediti(a) === crediti(b) ? true : "crediti cambiati"; } });
    L.nota("scelta → sceglie ancora " + nomeDi(r.dopo, r.dopo.sceglieId) + " (" + r.dt + " s)");
    // durante l'asta: il lotto riparte da capo
    await finche(C, function (v) { return v.fase === "asta"; }, passoA(fatti, []), 10000, "non parte l'asta");
    var nA = vm(C).asta.n;
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "asta" || !b.asta ? "fase " + b.fase : b.asta.n === nA ? "l'asta non riparte (stessa n)" : b.asta.carta.nome !== a.asta.carta.nome ? "all'asta c'è un'altra carta" : b.asta.offerta !== 1 ? "l'asta riparte da " + b.asta.offerta : crediti(a) === crediti(b) ? true : "crediti cambiati"; } });
    L.nota("asta → stesso lotto da 1 (" + r.dt + " s)");
    // sull'esito (4 s, poi va avanti da solo)
    await finche(C, function (v) { return v.fase === "esito"; }, passoA(fatti), 15000, "l'asta non si chiude");
    r = await ricaricaHost(C, amici, { salva: 500, controlla: function (a, b) { return crediti(a) === crediti(b) ? true : "crediti o carte cambiati: " + crediti(a) + " → " + crediti(b); } });
    L.nota("esito → si va avanti, crediti uguali (" + r.dt + " s)");
    // al voto (dal 17 ott niente più fase «kit»: alla fine la carta-scenario e il voto a un tocco, vedi preferiti/asta.js paP)
    await finche(C, function (v) { return v.fase === "voto"; }, passoA(fatti), 150000, "non si arriva al voto");
    await W.dorme(2000);
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "voto" ? "fase " + b.fase : crediti(a) === crediti(b) ? true : "kit cambiati"; } });
    L.nota("voto → voto, stessi kit (" + r.dt + " s)");
    // si chiude il voto: tutti danno la ⭐ al primo kit che non è il loro
    await finche(C, function (v) { return v.fase === "fine"; }, function (v) {
      if (v.fase !== "voto") return;
      (v.giocatori || []).forEach(function (g) {
        if (fatti["v" + g.id]) return;
        var altro = (v.giocatori || []).filter(function (x) { return x.id !== g.id; })[0]; if (!altro) return;
        var w = W.finestra(g.nome); if (!w) return;
        var b2 = w.document.querySelector("[data-kit='" + altro.id + "'], [data-id='" + altro.id + "']");
        if (b2) { b2.click(); fatti["v" + g.id] = 1; }
      });
    }, 90000, "il voto non si chiude");
    await W.dorme(1500);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : JSON.stringify(a.classifica) === JSON.stringify(b.classifica) ? true : "classifica cambiata"; } });
    await fineSenzaDoppi(C, nomi, nE);
    L.nota("classifica → classifica, niente XP doppi (" + r.dt + " s)");
    var vs = sent.stop(); if (vs.length) no("schermate viste: " + vs.join("; "));
    return L.join(" · ");
  } });

  var SLOT = { P: 1, D: 1, C: 2, A: 1 };
  // il Fantacalcio: il primo che ha posto per quel ruolo offre, gli altri passano
  function passoF(fatti) {
    return function (v) {
      var a = v.asta; if (v.fase !== "asta" || !a) return;
      var ok = (v.giocatori || []).filter(function (g) { return (g.conta[a.ruolo] || 0) < SLOT[a.ruolo]; });
      if (!a.leaderId && ok[0] && !fatti["o" + a.nCarta]) { fatti["o" + a.nCarta] = 1; manda("asta", ok[0].nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta }); }
      if (a.leaderId) ok.forEach(function (g) { if (g.id !== a.leaderId && !fatti["p" + a.nCarta + g.id]) { fatti["p" + a.nCarta + g.id] = 1; manda("asta", g.nome, { t: "passa", n: a.nCarta }); } });
    };
  }
  COPIONE.aggiungi("552b", { nome: "L'Asta (Fantacalcio): l'host ricarica durante l'asta di un calciatore, sull'esito e sulla classifica", fai: async function () {
    var L = N(), amici = ["Giulia"], nomi = ["Paky"].concat(amici), sent = sentinella(nomi), fatti = {};
    var X = await stanza("L'Asta", "asta", { formato: "fanta" }, amici), C = X.C;
    var r;
    if (vm(C).formato !== "fanta") no("la stanza non è del Fantacalcio (" + vm(C).formato + ")");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // un paio di calciatori, poi durante l'asta del terzo (con un'offerta): riparte da capo
    await finche(C, function (v) { return v.fase === "asta" && v.asta && v.asta.nCarta >= 3; }, passoF(fatti), 40000, "non si arriva al terzo calciatore");
    var a0 = vm(C).asta; manda("asta", "Giulia", { t: "rilancia", n: a0.nCarta, prezzo: a0.offerta });
    await W.aspetta(function () { return vm(C).asta && vm(C).asta.leaderId; }, 3000);
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "asta" || !b.asta ? "fase " + b.fase : b.asta.carta.nome !== a.asta.carta.nome ? "all'asta c'è un altro calciatore" : b.asta.nCarta === a.asta.nCarta ? "l'asta non riparte" : b.asta.leaderId || b.asta.offerta !== 1 ? "l'offerta di prima vale ancora" : crediti(a) === crediti(b) ? true : "rose o crediti cambiati: " + crediti(a) + " → " + crediti(b); } });
    L.nota("asta → stesso calciatore da capo, rose e crediti uguali (" + r.dt + " s)");
    await finche(C, function (v) { return v.fase === "esito"; }, passoF(fatti), 15000, "l'asta non si chiude");
    r = await ricaricaHost(C, amici, { salva: 500, controlla: function (a, b) { return crediti(a) === crediti(b) ? true : "rose o crediti cambiati: " + crediti(a) + " → " + crediti(b); } });
    L.nota("esito → si va avanti, rose uguali (" + r.dt + " s)");
    await finche(C, function (v) { return v.fase === "fine"; }, passoF(fatti), 120000, "il Fantacalcio non finisce");
    await W.dorme(2000);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : JSON.stringify(a.classifica) === JSON.stringify(b.classifica) ? true : "classifica cambiata"; } });
    await fineSenzaDoppi(C, nomi, nE);
    L.nota("classifica → classifica, niente XP doppi (" + r.dt + " s)");
    var vs = sent.stop(); if (vs.length) no("schermate viste: " + vs.join("; "));
    return L.join(" · ");
  } });

  COPIONE.aggiungi(554, { nome: "L'Asta: l'host ricarica mentre due amici si rilanciano un lotto → riparte da 1, i crediti sono quelli di prima", fai: async function () {
    var amici = ["Giulia", "Luca"], fatti = {};
    var X = await stanza("L'Asta", "asta", { formato: "temi", crediti: 15 }, amici), C = X.C;
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    var v = await finche(C, function (x) { return x.fase === "asta"; }, passoA(fatti, []), 15000, "non parte l'asta");
    var sceglie = v.asta.leaderId, altri = v.giocatori.filter(function (g) { return g.id !== sceglie; }).map(function (g) { return g.nome; });
    var cPrima = crediti(v);
    // i due che non hanno scelto si rilanciano: 2, 3, 4
    var prezzo = 2;
    for (var i = 0; i < 3; i++) {
      var chi = altri[i % 2], n = vm(C).asta.n;
      manda("asta", chi, { t: "rilancia", n: n, prezzo: prezzo });
      var p0 = prezzo;
      if (!await W.aspetta(function () { return vm(C).asta && vm(C).asta.offerta === p0; }, 3000)) no("il rilancio a " + p0 + " di " + chi + " non arriva");
      prezzo++;
    }
    var vA = vm(C), lead = nomeDi(vA, vA.asta.leaderId);
    var r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "asta" || !b.asta ? "fase " + b.fase : b.asta.offerta !== 1 ? "l'asta riparte da " + b.asta.offerta : b.asta.leaderId !== sceglie ? "in testa c'è " + nomeDi(b, b.asta.leaderId) + " invece di chi aveva scelto" : true; } });
    if (crediti(r.dopo) !== cPrima) no("crediti cambiati dopo la ripresa: " + cPrima + " → " + crediti(r.dopo));
    // tutti passano: il lotto va a chi l'aveva scelto per 1 credito (e paga solo lui)
    var vE = await finche(C, function (x) { return x.fase === "esito"; }, passoA(fatti), 10000, "dopo la ripresa l'asta non si chiude");
    if (vE.esito.chiId !== sceglie || vE.esito.prezzo !== 1) no("il lotto va a " + vE.esito.chiNome + " per " + vE.esito.prezzo + " (doveva andare a chi l'aveva scelto per 1)");
    var pagato = (vE.giocatori || []).map(function (g) { var q = v.giocatori.filter(function (x) { return x.id === g.id; })[0]; return g.id === sceglie ? g.crediti === q.crediti - 1 : g.crediti === q.crediti; });
    if (pagato.indexOf(false) >= 0) no("i crediti dopo l'asta non tornano: " + crediti(v) + " → " + crediti(vE));
    return "prima della ricarica " + lead + " guidava a " + (prezzo - 1) + "; dopo la ripresa il lotto riparte da 1 (" + r.dt + " s) e va a " + vE.esito.chiNome + " per 1: " + crediti(vE);
  } });

  // =====================================================================
  //  553 LA RUOTA DELLA FORTUNA
  // =====================================================================
  function frase(nome) { var r = ripresaDi(nome || "Paky"); return r && r.stato && r.stato.P ? r.stato.P : null; }
  function azR(nome, a, x) { manda("ruota", nome, { t: "azione", a: a, x: x }); }
  // chi è di turno risolve con la frase vera (la legge dalla partita ricordata dell'host)
  function passoR(fatti) {
    return function (v) {
      var P = frase(); if (!P) return;
      var k = v.fase + "|" + v.manche + "|" + v.turno + "|" + (v.lampo ? v.lampo.n + "." + v.lampo.prove + "." + (v.lampo.chi || "") : "") + "|" + v.giroN;
      if (fatti[k]) return;
      var chi = nomeDi(v, v.turno);
      if (v.fase === "lampo" && v.lampo && !v.lampo.chi && v.lampo.n >= 2) { fatti[k] = 1; azR("Giulia", "prenoto", { n: v.lampo.n, ms: 300 }); }
      else if (v.fase === "lampo" && v.lampo && v.lampo.chi && P.lampo) { fatti[k] = 1; azR(nomeDi(v, v.lampo.chi), "soluzione", P.lampo.frase); }
      else if (v.fase === "gira" && chi) { fatti[k] = 1; azR(chi, "risolvi"); }
      else if (v.fase === "risolvi" && chi) { fatti[k] = 1; azR(chi, "soluzione", P.frase); }
    };
  }
  COPIONE.aggiungi(553, { nome: "Ruota della Fortuna: l'host ricarica in saletta, alla frase lampo, quando tocca a uno, mentre la ruota gira, a fine manche e sulla classifica", fai: async function () {
    var L = N(), amici = ["Giulia"], nomi = ["Paky"].concat(amici), sent = sentinella(nomi), fatti = {};
    var X = await stanza("La Ruota della Fortuna", "ruota", { manche: 2, prenota: true, express: false, veloce: false, finale: false }, amici), C = X.C;
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // la frase lampo (dopo la sigla): stessa frase, le lettere già uscite restano
    await finche(C, function (v) { return v.fase === "lampo" && v.lampo && v.lampo.n >= 1 && !v.sigla; }, null, 40000, "non arriva la frase lampo");
    r = await ricaricaHost(C, amici, { salva: 500, controlla: function (a, b) { return b.fase !== "lampo" ? "fase " + b.fase : b.cat !== a.cat ? "la frase lampo è cambiata" : b.lampo.n < a.lampo.n ? "le lettere uscite sono sparite" : true; } });
    L.nota("frase lampo → stessa frase, " + r.dopo.lampo.n + " lettere (" + r.dt + " s)");
    // Giulia prenota e la indovina: comincia lei la manche
    await finche(C, function (v) { return v.fase === "gira"; }, passoR(fatti), 40000, "dopo la frase lampo non si gira");
    // quando tocca a uno: tocca ancora a lui, stessa frase
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "gira" ? "fase " + b.fase : b.turno !== a.turno ? "tocca a " + nomeDi(b, b.turno) + " invece di " + nomeDi(a, a.turno) : b.tab !== a.tab ? "il tabellone è cambiato" : b.resta < 12000 ? "chi tocca non ha il tempo intero (" + b.resta + " ms)" : stessiPunti(a, b); } });
    L.nota("turno → tocca ancora a " + nomeDi(r.dopo, r.dopo.turno) + " (" + r.dt + " s)");
    // mentre la ruota gira: non gira da sola, la rigira chi l'aveva girata
    var chi = nomeDi(vm(C), vm(C).turno), g0 = vm(C).giroN;
    await W.aspetta(function () { return !/ripresa/i.test(pill(W.finestra("Paky"))) && !/tornato/.test(pill(W.finestra("Giulia"))); }, 6000);
    azR(chi, "gira");
    await finche(C, function (v) { return v.fase === "girando"; }, null, 4000, "la ruota non gira");
    r = await ricaricaHost(C, amici, { salva: 600, controlla: function (a, b) { return b.fase !== "gira" ? "fase " + b.fase + " (la ruota è andata avanti da sola?)" : b.turno !== a.turno ? "tocca a un altro" : b.tab !== a.tab ? "il tabellone è cambiato" : true; } });
    if (r.prima.fase !== "girando") L.nota("(la ruota si era già fermata: " + r.prima.fase + ")");
    if (!/gira di nuovo la ruota/.test(r.dopo.msg || "")) no("dopo la ripresa la scritta non dice di rigirare («" + r.dopo.msg + "»)");
    await W.dorme(4000);
    if (vm(C).fase !== "gira" || vm(C).giroN !== r.dopo.giroN) no("dopo la ripresa la ruota gira da sola (fase " + vm(C).fase + ")");
    L.nota("la ruota girava → la rigira " + chi + ", da sola resta ferma (" + r.dt + " s)");
    // chi tocca risolve: fine della manche
    await finche(C, function (v) { return v.fase === "finemanche"; }, passoR(fatti), 20000, "la manche non finisce");
    r = await ricaricaHost(C, amici, { salva: 500, controlla: function (a, b) { return (b.fase === "finemanche" || b.fase === "lampo") ? stessiPunti(a, b) : "fase " + b.fase; } });
    L.nota("fine manche → si va avanti, stessi totali (" + r.dt + " s)");
    // fino alla classifica
    await finche(C, function (v) { return v.fase === "fine"; }, passoR(fatti), 90000, "la partita non finisce");
    await W.dorme(4000);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : JSON.stringify(a.classifica) === JSON.stringify(b.classifica) ? true : "classifica cambiata"; } });
    await fineSenzaDoppi(C, nomi, nE);
    L.nota("classifica → classifica, niente XP doppi (" + r.dt + " s)");
    var vs = sent.stop(); if (vs.length) no("schermate viste: " + vs.join("; "));
    return L.join(" · ");
  } });

  // tutte in fila
  COPIONE.gruppo5g3 = async function () {
    var esiti = {};
    for (var n of [550, 551, 552, "552b", 553, 554, 555]) { esiti[n] = await COPIONE.prova(n); }
    return esiti;
  };
})();
