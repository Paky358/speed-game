/* =========================================================
   PEZZO DEL CUORE — 🏙️ IL MONDO (il contorno: oggi spento con CITTA_VISIBILE = false)
   La ruota del giorno, la città giocattolo e la città a piedi, la casa e il negozio (con la
   commessa del proprietario), la pesca, gli scavi e il giardino salvati nel profilo, le sfide
   del giorno, gli edifici della città e gli interni del Casinò e del Circolo.
   Restano nel cuore: CITTA_VISIBILE (la guarda costruisci-versione-online.sh) ed extra.js.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var giochi = cuore.giochi, catDi = cuore.catDi, giocoOnline = cuore.giocoOnline, el = cuore.el, svuota = cuore.svuota, schermata = cuore.schermata,
      mostra = cuore.mostra, tesseraGioco = cuore.tesseraGioco, entraConCodice = cuore.entraConCodice, schermataHome = cuore.schermataHome,
      tempoBreve = cuore.tempoBreve, serveExtra = cuore.serveExtra, caricaExtra = cuore.caricaExtra, giardinoPronto = cuore.giardinoPronto,
      PROPRIETARIO = cuore.PROPRIETARIO, eProprietario = cuore.eProprietario, novitaTutteViste = cuore.novitaTutteViste,
      schermataNovita = cuore.schermataNovita, profiloAttivo = cuore.profiloAttivo, listaProfilo = cuore.listaProfilo,
      salvaListaProfilo = cuore.salvaListaProfilo, giocoDa = cuore.giocoDa, modiDi = cuore.modiDi, conCodice = cuore.conCodice,
      sceltoModo = cuore.sceltoModo, schermataRegole = cuore.schermataRegole, oggiStr = cuore.oggiStr, cifre = cuore.cifre, audioCtx = cuore.audioCtx;

  // ---- La ruota del giorno (al posto del regalo fisso): un giro al giorno, torna a mezzanotte.
  //      Spicchi di monete (oro) e di XP (viola); le regole e i premi stanno in nube.js (SGNube.ruota).
  //      dopo(esito) = facoltativo: chi l'ha aperta aggiorna le sue monete / il suo livello ----
  function testoPremioRuota(p) { return p.xp ? cifre(p.xp) + " XP" : cifre(p.monete); }
  function disegnaRuotaGiorno(cv, R, lato) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), r = lato / 2, n = R.length, passo = Math.PI * 2 / n;
    cv.width = cv.height = Math.round(lato * dpr); cv.style.width = cv.style.height = lato + "px";
    var c = cv.getContext("2d"); c.scale(dpr, dpr); c.translate(r, r);
    R.forEach(function (p, i) {
      var a0 = -Math.PI / 2 + i * passo, a1 = a0 + passo, g = c.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
      if (p.top && p.xp) { g.addColorStop(0, "#5ff0d0"); g.addColorStop(1, "#0b8f78"); }
      else if (p.top) { g.addColorStop(0, "#ff7a6b"); g.addColorStop(1, "#c3171f"); }
      else if (p.xp) { g.addColorStop(0, i % 4 === 1 ? "#a58bff" : "#8f7bff"); g.addColorStop(1, i % 4 === 1 ? "#5a33d6" : "#4a2fb8"); }
      else { g.addColorStop(0, "#ffe9a0"); g.addColorStop(1, i % 4 === 2 ? "#f0a400" : "#e39300"); }
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r - 2, a0, a1); c.closePath();
      c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2; c.stroke();
      // la scritta lungo il raggio, verso il bordo
      c.save(); c.rotate(a0 + passo / 2); c.textAlign = "right"; c.textBaseline = "middle";
      var scuro = !p.xp && !p.top, testo = p.xp ? cifre(p.xp) : cifre(p.monete);
      c.fillStyle = scuro ? "#4a2a00" : "#fff"; c.font = "900 " + Math.round(lato * (testo.length > 4 ? 0.068 : 0.078)) + "px system-ui, sans-serif";
      if (!scuro) { c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 3; }
      c.fillText(testo, r - lato * 0.115, 0);
      c.shadowBlur = 0;
      // dopo il numero: la moneta o la scritta XP
      if (p.xp) { c.font = "900 " + Math.round(lato * 0.04) + "px system-ui, sans-serif"; c.fillStyle = "rgba(255,255,255,.9)"; c.fillText("XP", r - lato * 0.05, 0); }
      else {
        c.beginPath(); c.arc(r - lato * 0.072, 0, lato * 0.026, 0, Math.PI * 2);
        c.fillStyle = p.top ? "#ffd43b" : "#fff3bf"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = "#b7791f"; c.stroke();
      }
      c.restore();
    });
  }
  function suonoRuota(tipo) {
    var ctx = audioCtx(); if (!ctx) return;
    try {
      var note = tipo === "tic" ? [[1900, 0, 0.035, 0.05]] : tipo === "top" ? [[784, 0, .3, .2], [988, .1, .3, .2], [1175, .2, .3, .2], [1568, .3, .6, .22], [2093, .45, .7, .18]]
        : [[880, 0, .25, .18], [1175, .1, .25, .18], [1568, .2, .5, .18]];
      note.forEach(function (n) {
        var t0 = ctx.currentTime + n[1], o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = tipo === "tic" ? "triangle" : "sine"; o.frequency.setValueAtTime(n[0], t0);
        gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(n[3], t0 + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + n[2]);
        o.connect(gn); gn.connect(ctx.destination); o.start(t0); o.stop(t0 + n[2] + 0.05);
      });
    } catch (e) {}
  }
  function ruotaDelGiorno(dopo) {
    var N = window.SGNube, R = N && N.ruota;
    if (!R || !(N.profilo && N.profilo())) return;
    var n = R.length, passo = 360 / n, lato = Math.max(220, Math.min(330, Math.round(window.innerWidth - 90), Math.round((window.innerHeight || 640) * 0.48)));
    var pronta = N.puoRitirareBonus(), ang = 0, girando = false, finita = false;
    var cv = el("canvas", { class: "rg-disco" });
    disegnaRuotaGiorno(cv, R, lato);
    // le lampadine sul bordo (ferme: gira solo il disco)
    var luci = "";
    for (var k = 0; k < 24; k++) {
      var a = k * Math.PI * 2 / 24, x = 50 + 48.3 * Math.sin(a), y = 50 - 48.3 * Math.cos(a);
      luci += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="1.35" class="' + (k % 2 ? "rg-l2" : "rg-l1") + '"/>';
    }
    var bordo = el("div", { class: "rg-bordo", html: '<svg viewBox="0 0 100 100">' + luci + "</svg>" });
    var freccia = el("div", { class: "rg-freccia" });
    var gira = el("button", { class: "rg-gira", text: pronta ? "GIRA" : "⏳" });
    var sotto = el("div", { class: "rg-sotto", text: pronta ? "Un giro al giorno: monete o XP. Tocca GIRA!" : "Hai già girato oggi: il prossimo giro tra " + tempoBreve(N.prossimoBonusMs()) + " (a mezzanotte)" });
    var esito = el("div", { class: "rg-esito" });
    var chiudiB = el("button", { class: "btn " + (pronta ? "btn-fantasma" : "btn-primario") + " rg-chiudi", text: pronta ? "Più tardi" : "Chiudi" });
    var tutto = el("div", { class: "rg-tutto", style: "width:" + (lato + 22) + "px;height:" + (lato + 22) + "px" }, [ bordo, cv, freccia, gira ]);
    var velo = el("div", { class: "rg-velo" }, [ el("div", { class: "rg-scheda" }, [
      el("div", { class: "rg-titolo", text: "🎡 Ruota del giorno" }), sotto, tutto, esito, chiudiB ]) ]);
    if (!pronta) velo.classList.add("ferma");
    function chiudi() {
      if (girando) return;
      velo.classList.remove("su");
      setTimeout(function () { if (velo.parentNode) velo.parentNode.removeChild(velo); }, 260);
    }
    chiudiB.onclick = chiudi;
    velo.addEventListener("click", function (e) { if (e.target === velo) chiudi(); });
    gira.onclick = function () {
      if (girando || finita) return;
      var res = N.giraRuota();
      if (!res) { sotto.textContent = "Hai già girato oggi: torna dopo mezzanotte 🌙"; gira.textContent = "⏳"; velo.classList.add("ferma"); return; }
      girando = true; gira.disabled = true; chiudiB.style.visibility = "hidden";
      sotto.textContent = "Gira, gira…";
      // dove deve fermarsi: lo spicchio vinto sotto la freccia (in alto), non sempre nel centro dello spicchio
      var theta = (res.i + 0.5) * passo + (Math.random() - 0.5) * passo * 0.7;
      var meta = Math.ceil(ang / 360) * 360 + 360 * 6 + ((360 - theta) % 360);
      var a0 = ang, t0 = 0, durata = 5200, tacca = Math.floor(ang / passo);
      function passo1(ora) {
        if (!t0) t0 = ora;
        var k = Math.min(1, (ora - t0) / durata), e = 1 - Math.pow(1 - k, 4);
        ang = a0 + (meta - a0) * e;
        cv.style.transform = "rotate(" + ang.toFixed(2) + "deg)";
        var tq = Math.floor(ang / passo);
        if (tq !== tacca) { tacca = tq; suonoRuota("tic"); freccia.classList.remove("tic"); void freccia.offsetWidth; freccia.classList.add("tic"); }
        if (k < 1) requestAnimationFrame(passo1); else fermata();
      }
      requestAnimationFrame(passo1);
      function fermata() {
        girando = false; finita = true;
        var p = res.premio;
        tutto.classList.add("vinto"); if (p.top) velo.classList.add("top");
        suonoRuota(p.top ? "top" : "vinto");
        try { if (navigator.vibrate) navigator.vibrate(p.top ? [40, 60, 40, 60, 90] : [30, 40, 30]); } catch (e) {}
        esito.innerHTML = "";
        esito.appendChild(el("b", { text: "+" + testoPremioRuota(p) + (p.xp ? "" : " 🪙") }));
        esito.appendChild(el("span", { text: p.top ? "Premio grosso! ⭐" : (p.xp ? "Punti esperienza per salire di livello" : "Speed Coins") }));
        esito.classList.add("su");
        sotto.textContent = "Il prossimo giro a mezzanotte 🌙";
        gira.textContent = "✓";
        chiudiB.textContent = "Ritira"; chiudiB.className = "btn btn-primario rg-chiudi"; chiudiB.style.visibility = "";
        // livelli saliti con gli XP della ruota (ognuno regala monete)
        var lv = 0, pr = 0, m2 = 0;
        (res.eventi || []).forEach(function (e) { m2 += e.monete; if (e.tipo === "livello") lv = e.livello; if (e.tipo === "prestigio") pr = e.prestigio; });
        if (pr) cuore.codaTrofei.push({ tipo: "xp", cls: "tl-platino", icona: "🌟", su: "PRESTIGIO " + pr + "!", nome: "Si riparte dal livello 1", sotto: "+" + cifre(m2) + " Speed Coins 🪙" });
        else if (lv) cuore.codaTrofei.push({ tipo: "xp", cls: "tl-oro", icona: "🆙", su: "Con la ruota del giorno", nome: "Livello " + lv + "!", sotto: "+" + cifre(m2) + " Speed Coins 🪙" });
        if (res.avvisa) res.avvisa();   // ora i trofei (es. "Ritira il regalo del giorno 10 volte")
        cuore.prossimoAvviso();
        if (dopo) dopo(res);
      }
    };
    document.body.appendChild(velo);
    requestAnimationFrame(function () { requestAnimationFrame(function () { velo.classList.add("su"); }); });
  }
  // ---- La città: si tocca un edificio, la città fa zoom e si entra.
  //      In alto chi sei (avatar, nome, livello con la barra degli XP) e le Speed Coins;
  //      in basso Casa, Clan e Negozio (in arrivo) e la Ruota del giorno ----
  // ---- La casa (js/casa.js) e il negozio: per tutti quelli col profilo. Si paga con le Speed Coins vere;
  //      la casa si salva nel profilo (Firebase) e anche su questo telefono, così non si perde niente ----
  var casaInUso = null, tCasaNube = null;   // la casa aperta adesso (casa e negozio lavorano sulla stessa)
  function chiaveCasa() { var N = window.SGNube, u = N && N.utente && N.utente(); return u ? "sg-casa|" + u.uid : null; }
  function datiCasa() {
    var N = window.SGNube, k = chiaveCasa(); if (!k) return null;
    if (casaInUso && casaInUso._chiave === k) return casaInUso;
    var nube = N.casa && N.casa(), qui = null;
    try { qui = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    var c = nube && (!qui || (nube.agg || 0) >= (qui.agg || 0)) ? JSON.parse(JSON.stringify(nube)) : qui;   // la più recente
    if (!c || !c.v) { c = SGCasa.casaIniziale(); delete c.monete; }   // si parte dalla casa scadente, uguale per tutti
    c._chiave = k; casaInUso = c; return c;
  }
  function salvaCasa(c) {
    var k = chiaveCasa(); if (!k || !c) return;
    c.agg = Date.now(); casaInUso = c;
    var pulita = JSON.parse(JSON.stringify(c)); delete pulita._chiave;
    try { localStorage.setItem(k, JSON.stringify(pulita)); } catch (e) {}
    clearTimeout(tCasaNube); tCasaNube = setTimeout(function () {   // nel profilo: un attimo dopo (non a ogni spostamento), e la copia che vedono gli amici
      if (window.SGNube && SGNube.salvaCasa) SGNube.salvaCasa(pulita);
      if (window.SGNube && SGNube.salvaVetrinaCasa) { SGNube.salvaVetrinaCasa(SGCasa.vetrina(pulita)); casaPubblicata = true; }
    }, 1500);
  }
  var casaPubblicata = false;   // la copia per gli amici si rinfresca una volta all'avvio (per chi ha arredato prima che ci fossero le visite)
  function pubblicaCasa() {
    var N = window.SGNube; if (casaPubblicata || !window.SGCasa || !N || !N.salvaVetrinaCasa || !N.casa || !N.casa()) return;
    casaPubblicata = true; N.salvaVetrinaCasa(SGCasa.vetrina(N.casa()));
  }
  // a casa di un amico: la sua casa com'è adesso, col suo avatar che ci gira dentro (si guarda, non si tocca niente)
  function schermataCasaAmico(x, torna) {
    if (!window.SGCasa || !(window.SGNube && SGNube.casaDi)) return;
    var s0 = schermata({ icona: "🏠", titolo: x.nome, sotto: "Vado a casa sua…", indietro: function () { cuore.schermataTrofeiAmico(x, torna); } }); mostra(s0);
    SGNube.casaDi(x.uid).catch(function () { return null; }).then(function (c) {
      if (!s0.parentNode) return;   // è già tornato indietro
      var s = SGCasa.crea({ visita: true, vuota: !c, dati: c, avatar: x.omino || null, nome: x.nome, audio: audioCtx, stanza: "soggiorno",
        indietro: function () { cuore.schermataTrofeiAmico(x, torna); } });
      mostra(s); s._monta();
    });
  }
  function soldiCasa() { return { monete: function () { return SGNube.monete(); }, spendi: function (n) { SGNube.cambiaMonete(-n); }, guadagna: function (n) { SGNube.cambiaMonete(n); } }; }
  // ---- la pesca al laghetto (js/pesca.js): album, cesto ed esche nel profilo e su questo telefono (come la casa) ----
  var tPescaNube = null;
  function chiavePesca() { var N = window.SGNube, u = N && N.utente && N.utente(); return u ? "sg-pesca|" + u.uid : null; }
  function datiPesca() {
    var N = window.SGNube, k = chiavePesca(); if (!k) return null;
    var nube = N.pesca && N.pesca(), qui = null;
    try { qui = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    var d = nube && (!qui || (nube.agg || 0) >= (qui.agg || 0)) ? JSON.parse(JSON.stringify(nube)) : qui;   // la più recente
    return d && d.v ? d : null;
  }
  function salvaPesca(d) {
    var k = chiavePesca(); if (!k || !d) return;
    d.agg = Date.now();
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {}
    clearTimeout(tPescaNube); tPescaNube = setTimeout(function () { if (window.SGNube && SGNube.salvaPesca) SGNube.salvaPesca(JSON.parse(JSON.stringify(d))); }, 1200);
  }
  function schermataPesca() {
    if (!window.SGPesca) return schermataCitta();
    if (serveProfilo()) return;
    var io = profiloAttivo();
    var s = SGPesca.crea({ omino: io && io.omino, dati: datiPesca(), salva: salvaPesca, audio: audioCtx,
      monete: function () { return SGNube.monete(); }, cambia: function (n) { SGNube.cambiaMonete(n); },
      apriGara: giocoDa("garapesca") ? function () { cuore.rientro = schermataPesca; cuore.apriGioco(giocoDa("garapesca")); } : null,   // la gara di pesca con gli amici, online
      indietro: function () { schermataCitta(); } });
    mostra(s); s._monta();
  }
  // ---- gli scavi antichi (js/scavi.js): museo, zaino e colpi nel profilo e su questo telefono (come la pesca) ----
  var tScaviNube = null;
  function chiaveScavi() { var N = window.SGNube, u = N && N.utente && N.utente(); return u ? "sg-scavi|" + u.uid : null; }
  function datiScavi() {
    var N = window.SGNube, k = chiaveScavi(); if (!k) return null;
    var nube = N.scavi && N.scavi(), qui = null;
    try { qui = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    var d = nube && (!qui || (nube.agg || 0) >= (qui.agg || 0)) ? JSON.parse(JSON.stringify(nube)) : qui;   // la più recente
    return d && d.v ? d : null;
  }
  function salvaScavi(d) {
    var k = chiaveScavi(); if (!k || !d) return;
    d.agg = Date.now();
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {}
    clearTimeout(tScaviNube); tScaviNube = setTimeout(function () { if (window.SGNube && SGNube.salvaScavi) SGNube.salvaScavi(JSON.parse(JSON.stringify(d))); }, 1200);
  }
  function schermataScavi() {
    if (!window.SGScavi) return schermataCitta();
    if (serveProfilo()) return;
    var io = profiloAttivo(), u = window.SGNube && SGNube.utente && SGNube.utente();
    var s = SGScavi.crea({ omino: io && io.omino, dati: datiScavi(), salva: salvaScavi, audio: audioCtx, seme: u ? u.uid : "", illimitati: eProprietario(),   // il proprietario (IL PAPPONE) ha i colpi illimitati, per provare
      monete: function () { return SGNube.monete(); }, cambia: function (n) { SGNube.cambiaMonete(n); },
      indietro: function () { schermataCitta(); } });
    mostra(s); s._monta();
  }
  var tGiardinoNube = null;
  function chiaveGiardino() { var N = window.SGNube, u = N && N.utente && N.utente(); return u ? "sg-giardino|" + u.uid : null; }
  function datiGiardino() {
    var N = window.SGNube, k = chiaveGiardino(); if (!k) return null;
    var nube = N.giardino && N.giardino(), qui = null;
    try { qui = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    var d = nube && (!qui || (nube.agg || 0) >= (qui.agg || 0)) ? JSON.parse(JSON.stringify(nube)) : qui;   // la più recente
    return d && d.v ? d : null;
  }
  function salvaGiardino(d) {
    var k = chiaveGiardino(); if (!k || !d) return;
    d.agg = Date.now();
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {}
    clearTimeout(tGiardinoNube); tGiardinoNube = setTimeout(function () { if (window.SGNube && SGNube.salvaGiardino) SGNube.salvaGiardino(JSON.parse(JSON.stringify(d))); }, 1200);
  }
  function schermataGiardino(daCasa, apri) {   // dalla città si arriva qui, davanti a casa: la porta porta dentro
    if (serveExtra()) return caricaExtra(function () { schermataGiardino(daCasa, apri); }, "🏡");
    if (!giardinoPronto()) return schermataCasa();
    if (serveProfilo()) return;
    var io = profiloAttivo(), m = soldiCasa();
    var s = SGGiardino.crea({ omino: io && io.omino, nome: io && io.nome, dati: datiGiardino(), daCasa: !!daCasa, apri: apri || null, salva: salvaGiardino, audio: audioCtx,
      monete: m.monete, spendi: m.spendi, guadagna: m.guadagna,
      entraInCasa: function () { schermataCasa(); }, indietro: function () { schermataCitta(); } });
    mostra(s); s._monta();
  }
  function serveProfilo() {   // casa e negozio vogliono il profilo (le monete e i mobili sono tuoi)
    var N = window.SGNube; if (N && N.profilo && N.profilo()) return false;
    cuore.schermataAccesso(schermataCitta); return true;
  }
  function schermataCasa(stanza) {
    if (!window.SGCasa) return schermataCitta();
    if (serveProfilo()) return;
    var io = profiloAttivo(), m = soldiCasa();
    var s = SGCasa.crea({ avatar: io && io.omino, nome: io && io.nome, dati: datiCasa(), audio: audioCtx, stanza: stanza, monete: m.monete, spendi: m.spendi, guadagna: m.guadagna, salva: salvaCasa,
      vestiti: function () { cuore.schermataOmino(function () { schermataCasa("camera"); }); },   // dall'armadio aperto: si cambia il look e si torna in camera
      pesca: { dati: function () { return datiPesca() || (window.SGPesca ? { v: 1, album: {}, cesto: [], esche: {}, extra: 0, tot: 0 } : null); }, salva: salvaPesca },   // gli acquari prendono i pesci dal cesto della pesca
      negozio: function (st) { schermataNegozio(st); },   // dal cassetto dell'Arreda
      indietro: function () { if (giardinoPronto()) schermataGiardino(true); else schermataCitta(); } });   // uscendo di casa si va in giardino
    mostra(s); s._monta();
  }
  function schermataNegozio(daStanza) {   // daStanza: si arriva dalla casa (e indietro si torna lì), altrimenti dalla città
    if (!window.SGCasa) return schermataCitta();
    if (serveProfilo()) return;
    var m = soldiCasa(), cm = commessaSalvata();
    var s = SGCasa.negozio({ dati: datiCasa(), salva: salvaCasa, monete: m.monete, spendi: m.spendi, audio: audioCtx, reparto: daStanza || null,
      indietro: function () { if (daStanza) schermataCasa(daStanza); else schermataCitta(); },
      aCasa: daStanza ? null : function () { schermataCasa(); },
      commessa: cm, modificaCommessa: eProprietario() ? function (cfg) { modificaCommessa(cfg, daStanza); } : null });
    mostra(s); s._monta();
    // la commessa vera la prende dalla scheda del proprietario (la prossima volta si vede subito)
    if (window.SGNube && SGNube.commessa) SGNube.commessa(PROPRIETARIO).then(function (c) {
      if (!c || JSON.stringify(c) === JSON.stringify(cm)) return;
      try { localStorage.setItem("sg-commessa", JSON.stringify(c)); } catch (e) {}
      if (document.body.contains(s) && s._commessa) s._commessa(c);
    }).catch(function () {});
  }
  // la commessa del negozio: la disegna il proprietario con l'editor degli avatar, e la vedono tutti uguale
  function commessaSalvata() { try { return JSON.parse(localStorage.getItem("sg-commessa") || "null"); } catch (e) { return null; } }
  function modificaCommessa(cfg, daStanza) {
    var bozza = { nome: "Commessa", omino: cfg, omini: null }, prima = JSON.stringify(cfg);
    cuore.schermataOmino(function () {
      if (bozza.omino && JSON.stringify(bozza.omino) !== prima) {
        try { localStorage.setItem("sg-commessa", JSON.stringify(bozza.omino)); } catch (e) {}
        if (window.SGNube && SGNube.salvaCommessa) SGNube.salvaCommessa(bozza.omino);
      }
      schermataNegozio(daStanza);
    }, bozza);
  }

  var scrollCitta = 0;   // fin dove avevi scorso la città: uscendo da un edificio si torna lì (dalla home si riparte dall'alto)
  var CITTA_A_PIEDI = true, ultimoEdificio = null;   // (dal 13 ott 2026 per tutti)
  var fotoCitta = null;   // la città com'era quando hai toccato la bacheca (fa da sfondo sfocato alle novità)   // la città dove si cammina (come la casa): finché è false la vede solo il proprietario; ultimoEdificio: da dove si esce tornando in città
  function cittaAPiedi() { return !!(window.SGGiardino && window.SGCitta && SGCitta.arte) && (CITTA_A_PIEDI || eProprietario()); }
  // ---- 🎯 le sfide del giorno: 3 al giorno (una tra pesca e scavi, due tra i giochi che si fanno anche contro il computer),
  //      uguali per tutti e diverse ogni giorno. Si misurano coi contatori che i giochi tengono già (quelli dei trofei):
  //      la prima volta che le guardi oggi si segna da dove parti, e il progresso è quanto sei salito da lì ----
  var SFIDE_VITA = [
    { id: "pesca3", icona: "🎣", testo: "Pesca 3 pesci al laghetto", fonte: "pesca", meta: 3, monete: 300, xp: 60 },
    { id: "pesca6", icona: "🎣", testo: "Pesca 6 pesci al laghetto", fonte: "pesca", meta: 6, monete: 500, xp: 100 },
    { id: "scavi1", icona: "🏺", testo: "Trova un reperto agli scavi", fonte: "scavi", meta: 1, monete: 300, xp: 60 },
    { id: "scavi2", icona: "🏺", testo: "Trova 2 reperti agli scavi", fonte: "scavi", meta: 2, monete: 500, xp: 100 }
  ];
  var SFIDE_GIOCHI = [
    { id: "bj-mani", icona: "🃏", testo: "Vinci 3 mani a Black Jack", gioco: "blackjack", stat: "maniVinte", meta: 3, monete: 300, xp: 60 },
    { id: "bj-21", icona: "🃏", testo: "Fai un Black Jack", gioco: "blackjack", stat: "blackjackFatti", meta: 1, monete: 400, xp: 80 },
    { id: "scopa-v", icona: "🂡", testo: "Vinci una partita a Scopa", gioco: "scopa", stat: "vinte", meta: 1, monete: 400, xp: 100 },
    { id: "scopa-s", icona: "🧹", testo: "Fai 3 scope a Scopa", gioco: "scopa", stat: "scope", meta: 3, monete: 400, xp: 80 },
    { id: "scopa-7", icona: "7️⃣", testo: "Prendi il Settebello a Scopa", gioco: "scopa", stat: "settebello", meta: 1, monete: 300, xp: 60 },
    { id: "hockey-v", icona: "🏒", testo: "Vinci una partita a Glow Hockey", gioco: "hockey", stat: "vittorie", meta: 1, monete: 400, xp: 100 },
    { id: "hockey-g", icona: "🏒", testo: "Segna 10 gol a Glow Hockey", gioco: "hockey", stat: "golFatti", meta: 10, monete: 300, xp: 60 },
    { id: "calcio-v", icona: "⚽", testo: "Vinci una partita a Calcio Biliardo", gioco: "calciobiliardo", stat: "vittorie", meta: 1, monete: 400, xp: 100 },
    { id: "calcio-g", icona: "⚽", testo: "Segna 5 gol a Calcio Biliardo", gioco: "calciobiliardo", stat: "golFatti", meta: 5, monete: 300, xp: 60 },
    { id: "drop4-v", icona: "🟡", testo: "Vinci una partita a Drop 4", gioco: "drop4", stat: "vinte", meta: 1, monete: 300, xp: 60 },
    { id: "navale-n", icona: "🚢", testo: "Affonda 3 navi a Battaglia Navale", gioco: "navale", stat: "naviAffondate", meta: 3, monete: 300, xp: 60 },
    { id: "navale-v", icona: "🚢", testo: "Vinci a Battaglia Navale", gioco: "navale", stat: "vittorie", meta: 1, monete: 400, xp: 100 },
    { id: "poker-v", icona: "♠️", testo: "Vinci una mano di Texas Hold'em", gioco: "poker", stat: "vittorieTexas", meta: 1, monete: 300, xp: 60 },
    { id: "ruota-p", icona: "🎡", testo: "Gioca alla Ruota della Fortuna", gioco: "ruota", stat: "partite", meta: 1, monete: 250, xp: 50 },
    { id: "pendolo-p", icona: "🎯", testo: "Gioca 2 partite a Palla a Pendolo", gioco: "pendolo", stat: "partite", meta: 2, monete: 250, xp: 50 }
  ];
  var BONUS_SFIDE = { monete: 1000, xp: 200 };   // tutte e 3 fatte: il forziere
  function sfideDiOggi() {   // scelte dal giorno: oggi le stesse per tutti, domani altre
    var g = oggiStr(), h = 2166136261, i; for (i = 0; i < g.length; i++) { h ^= g.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    function rnd() { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }
    var vita = SFIDE_VITA.filter(function (s) { return s.fonte === "pesca" ? !!window.SGPesca : !!window.SGScavi; }), giochiOk = SFIDE_GIOCHI.filter(function (s) { return !!giocoDa(s.gioco); });
    var l = vita.length ? [vita[Math.floor(rnd() * vita.length)]] : [], usati = {}, prove = 0;
    while (l.length < 3 && prove++ < 200) { var s = giochiOk[Math.floor(rnd() * giochiOk.length)]; if (!s || usati[s.gioco]) continue; usati[s.gioco] = 1; l.push(s); }
    return l;
  }
  function valoreSfida(s) {   // il contatore che sale giocando
    if (s.fonte === "pesca") { var p = datiPesca(); return (p && p.tot) || 0; }
    if (s.fonte === "scavi") { var d = datiScavi(); return (d && d.tot) || 0; }
    var prof = window.SGNube && SGNube.profilo && SGNube.profilo(); return prof ? cuore.valoreStat(prof, s.gioco, s.stat) || 0 : 0;
  }
  function statoSfide() {   // { g, base: { id: da dove parti }, presi: { id: true }, bonus }: si segna la prima volta che le guardi oggi
    if (!profiloAttivo()) return null;
    var st = listaProfilo("sfide")[0];
    if (!st || st.g !== oggiStr() || !st.base) {
      st = { g: oggiStr(), base: {}, presi: {}, bonus: false };
      sfideDiOggi().forEach(function (s) { st.base[s.id] = valoreSfida(s); });
      salvaListaProfilo("sfide", [st]);
    }
    return st;
  }
  function progressoSfida(s, st) { return Math.max(0, Math.min(s.meta, valoreSfida(s) - ((st && st.base[s.id]) || 0))); }
  function riassuntoSfide() {   // per l'avviso in città: quante fatte, quante da ritirare
    var st = statoSfide(); if (!st) return null;
    var l = sfideDiOggi(), fatte = 0, ritira = 0;
    l.forEach(function (s) { if (st.presi[s.id]) fatte++; else if (progressoSfida(s, st) >= s.meta) ritira++; });
    if (fatte === l.length && !st.bonus) ritira++;
    return { tot: l.length, fatte: fatte, ritira: ritira };
  }
  function premia(monete, xp) { try { if (monete && window.SGNube && SGNube.cambiaMonete) SGNube.cambiaMonete(monete); if (xp && SGNube.aggiungiXp) SGNube.aggiungiXp(xp); } catch (e) {} }
  // il pannello delle sfide (sopra la città): le 3 sfide con la barra, "Vai" per andarci, "Ritira!" quando è fatta, e il forziere se le fai tutte
  function pannelloSfide(vai, poi) {
    var st = statoSfide(); if (!st) return;
    var velo = el("div", { class: "sf-velo" }), foglio = el("div", { class: "sf-foglio" }), lista = el("div", {}), tempo = el("div", { class: "sf-tempo" });
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); if (poi) poi(); }
    velo.addEventListener("click", function (e) { if (e.target === velo) chiudi(); });
    var tFesta = null;
    function festa(msg) { clearTimeout(tFesta); tempo.textContent = msg; tempo.classList.add("festa"); tFesta = setTimeout(function () { tempo.classList.remove("festa"); if (velo.parentNode) disegna(); }, 2600); }   // il premio, scritto in grande per un attimo
    function finoMezzanotte() { var d = new Date(); d.setHours(24, 0, 0, 0); return d - Date.now(); }
    function disegna() {
      svuota(lista); tempo.textContent = "⏳ Nuove sfide tra " + tempoBreve(finoMezzanotte());
      var l = sfideDiOggi(), fatte = 0;
      l.forEach(function (s) {
        var p = progressoSfida(s, st), preso = !!st.presi[s.id], pronta = !preso && p >= s.meta; if (preso) fatte++;
        var tasto = el("button", { class: "sf-tasto" + (pronta ? " ritira" : preso ? " fatto" : ""), text: pronta ? "Ritira!" : preso ? "✔" : "Vai" });
        tasto.onclick = function () {
          if (preso) return;
          if (pronta) { st.presi[s.id] = true; salvaListaProfilo("sfide", [st]); premia(s.monete, s.xp); disegna(); festa("🎉 +" + cifre(s.monete) + " monete e +" + s.xp + " XP"); return; }
          chiudi(); vai(s);
        };
        lista.appendChild(el("div", { class: "sf-carta" + (preso ? " fatta" : "") }, [
          el("div", { class: "sf-ico", text: s.icona }),
          el("div", { class: "sf-corpo" }, [
            el("div", { class: "sf-testo", text: s.testo }),
            el("div", { class: "sf-barra" }, [ el("i", { style: "width:" + Math.round(p * 100 / s.meta) + "%" }) ]),
            el("div", { class: "sf-premio", text: p + "/" + s.meta + "  ·  🪙 " + cifre(s.monete) + "  ·  ⭐ " + s.xp + " XP" })
          ]),
          tasto
        ]));
      });
      var tutte = fatte === l.length, bTasto = el("button", { class: "sf-tasto" + (tutte && !st.bonus ? " ritira" : st.bonus ? " fatto" : ""), text: st.bonus ? "✔" : tutte ? "Apri!" : fatte + "/" + l.length });
      bTasto.onclick = function () { if (!tutte || st.bonus) return; st.bonus = true; salvaListaProfilo("sfide", [st]); premia(BONUS_SFIDE.monete, BONUS_SFIDE.xp); disegna(); festa("🎁 Forziere: +" + cifre(BONUS_SFIDE.monete) + " monete e +" + BONUS_SFIDE.xp + " XP!"); };
      lista.appendChild(el("div", { class: "sf-bonus" + (st.bonus ? " fatta" : "") }, [
        el("div", { class: "sf-ico", text: "🎁" }),
        el("div", { class: "sf-corpo" }, [ el("div", { class: "sf-testo", text: "Fai tutte e 3 le sfide" }), el("div", { class: "sf-premio", text: "Il forziere: 🪙 " + cifre(BONUS_SFIDE.monete) + "  ·  ⭐ " + BONUS_SFIDE.xp + " XP" }) ]),
        bTasto
      ]));
    }
    var x = el("button", { class: "sf-x", text: "✕", "aria-label": "Chiudi", onclick: chiudi });
    foglio.appendChild(el("div", { class: "sf-testa" }, [ el("b", { text: "🎯 Sfide del giorno" }), x ]));
    foglio.appendChild(tempo); foglio.appendChild(lista); velo.appendChild(foglio);
    disegna();
    return velo;
  }
  function schermataCitta() {
    if (serveExtra()) return caricaExtra(schermataCitta, "🏙️");
    cuore.controllaGiorno();   // (se l'app è rimasta aperta da ieri)
    var io = profiloAttivo(), N = window.SGNube, fase = SGCitta.fase(new Date()), via = false;
    var cloud = !!(N && N.profilo && N.profilo()), prog = window.SGLivelli && cloud && N.progressione ? N.progressione() : null;
    var vista = cittaAPiedi() ? SGGiardino.crea({ luogo: "citta", incassata: true, omino: io && io.omino, nome: io && io.nome, audio: audioCtx, da: ultimoEdificio,   // la città a piedi (per ora solo per il proprietario)
      entra: function (k, punto, tela) {
        if (via) return; via = true; ultimoEdificio = k; suonoEdificio(k);
        if (k === "piazza") { var foto = null; try { foto = document.createElement("canvas"); foto.width = tela.width; foto.height = tela.height; foto.getContext("2d").drawImage(tela, 0, 0); } catch (e) { foto = null; } fotoCitta = { tela: foto, punto: punto, t: Date.now() }; return entraEdificio(k); }   // (una copia al volo della città: niente immagine da comprimere)   // la bacheca delle novità: la si legge da vicino, con la città dietro
        try { vista.style.transition = "opacity .2s ease-in"; vista.style.opacity = "0"; } catch (e) {}   // (la città sfuma, poi si entra: niente cambio secco)
        setTimeout(function () { entraEdificio(k); }, 200); } }) : null;
    var mappa = vista || el("div", { class: "citta-mappa", html: SGCitta.svg({ fase: fase, io: io && io.omino, sopra: 80 }) });
    // in alto: tu (tocca per il profilo) e le monete
    var testoIo = el("span", { class: "citta-io-testo" }, [ el("b", { text: io ? io.nome : "Entra" }) ]);
    if (prog) {
      var serve = SGLivelli.xpPerSalire(prog.level), pct = Math.max(3, Math.min(100, Math.floor(prog.xp * 100 / serve)));
      testoIo.appendChild(el("small", { text: (prog.prestige ? "★" + prog.prestige + " · " : "") + "Livello " + prog.level + cuore.fuocoGiorni() }));
      testoIo.appendChild(el("i", { class: "citta-xp" }, [ el("i", { style: "width:" + pct + "%" }) ]));
    } else testoIo.appendChild(el("small", { text: io ? "Il tuo profilo" : "Crea il tuo profilo" }));
    var faccia = el("span", { class: "citta-faccia" });
    if (io && io.omino && window.SGOmino) faccia.innerHTML = SGOmino.svg(io.omino, { busto: true }); else faccia.textContent = (io && io.emoji) || "👤";
    var monete = el("b", { text: prog ? cifre(prog.coins) : "—" });
    // in basso: le cose in arrivo (spente) e la ruota del giorno
    var avviso = el("div", { class: "citta-presto" });
    function presto(testo) { avviso.textContent = testo; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function tastoPresto(icona, nome, frase) {
      return el("button", { class: "citta-tasto spento", onclick: function () { presto(frase); } }, [ el("span", { class: "ct-ico", text: icona }), el("span", { text: nome }), el("small", { text: "🔒 presto" }) ]);
    }
    var regalo = el("button", { class: "citta-tasto" });
    function aggRegalo() {
      var pronto = cloud && N.puoRitirareBonus && N.puoRitirareBonus();
      regalo.className = "citta-tasto regalo" + (pronto ? " pronto" : " spento");
      svuota(regalo);
      regalo.appendChild(el("span", { class: "ct-ico", text: "🎡" }));
      regalo.appendChild(el("span", { text: "Ruota" }));
      regalo.appendChild(el("small", { text: !cloud ? "col profilo" : (pronto ? "gira!" : "tra " + tempoBreve(N.prossimoBonusMs())) }));
    }
    // dopo il giro: monete, livello e barra degli XP si aggiornano lì dove sono (niente ridisegno della città)
    function aggTesta() {
      var p = N.progressione(); monete.textContent = cifre(p.coins);
      var sm = testoIo.querySelector("small"), bar = testoIo.querySelector(".citta-xp > i");
      if (sm) sm.textContent = (p.prestige ? "★" + p.prestige + " · " : "") + "Livello " + p.level + cuore.fuocoGiorni();
      if (bar) bar.style.width = Math.max(3, Math.min(100, Math.floor(p.xp * 100 / SGLivelli.xpPerSalire(p.level)))) + "%";
      aggRegalo();
    }
    regalo.onclick = function () {
      if (!cloud) return presto("Crea il tuo profilo per girare la ruota del giorno");
      ruotaDelGiorno(aggTesta);
    };
    aggRegalo();
    // ---- a sinistra, come nei giochi che vanno forte: le cose da fare oggi, con l'avviso che salta e il conto alla rovescia ----
    var colonna = el("div", { class: "citta-avvisi" }), ultimaColonna = "";
    function finoMezzanotte() { var d = new Date(); d.setHours(24, 0, 0, 0); return d - Date.now(); }
    function portaA(k, altrimenti) { if (vista && vista._vai && vista._vai(k)) return; altrimenti(); }   // in città a piedi l'avatar ci corre; se no si entra subito
    function trofeoVicino() {   // il trofeo che ti manca di meno (non quelli che premiano le sconfitte)
      var prof = cloud && N.profilo && N.profilo(), vic = null; if (!prof) return null;
      cuore.TROFEI.forEach(function (t) {
        if (/sconfitt|sball|perse/i.test(t.stat) || cuore.trofeoFatto(prof, t)) return;
        var v = cuore.valoreStat(prof, t.gioco, t.stat), q = v / t.meta; if (!v) return;
        if (q >= .6 && (!vic || q > vic.q)) vic = { q: q, t: t, manca: t.meta - v };
      });
      return vic;
    }
    function vociAvvisi() {
      var l = [], ps, sc, gs, tv;
      var sf = cloud ? riassuntoSfide() : null;   // 🎯 per prime le sfide del giorno
      if (sf && sf.tot) l.push({ id: "sfide", icona: "🎯", col: "#e8590c", acceso: sf.ritira > 0 || sf.fatte < sf.tot, badge: sf.ritira > 0 ? String(sf.ritira) : sf.fatte < sf.tot ? String(sf.tot - sf.fatte) : "", sotto: sf.ritira > 0 ? "Ritira!" : sf.fatte + "/" + sf.tot + " sfide", tocca: apriSfide });
      if (cloud && window.SGPesca && SGPesca.stato) { ps = SGPesca.stato(datiPesca());
        l.push({ id: "pesca", icona: "🎣", col: "#1c7ed6", acceso: ps.gratis > 0, badge: ps.gratis > 0 ? String(ps.gratis) : "", sotto: ps.gratis > 0 ? ps.gratis + " esche" : "tra " + tempoBreve(finoMezzanotte()), tocca: function () { portaA("pesca", schermataPesca); } }); }
      if (cloud && window.SGScavi && SGScavi.stato) { sc = SGScavi.stato(datiScavi()); var inf = eProprietario();
        l.push({ id: "scavi", icona: "🏺", col: "#c0702f", acceso: inf || sc.gratis > 0, badge: inf ? "∞" : sc.gratis > 0 ? String(sc.gratis) : "", sotto: inf ? "scava!" : sc.gratis > 0 ? sc.gratis + " colpi" : "tra " + tempoBreve(finoMezzanotte()), tocca: function () { portaA("scavi", schermataScavi); } }); }
      if (cloud && giardinoPronto() && SGGiardino.stato) { gs = SGGiardino.stato(datiGiardino()); var da = gs.pronte + gs.sete;
        l.push({ id: "orto", icona: gs.pronte ? "🧺" : gs.sete ? "💧" : "🌱", col: "#2f9e44", acceso: da > 0, badge: da > 0 ? String(da) : "", sotto: gs.pronte ? "raccogli" : gs.sete ? "ha sete" : gs.tra != null ? "tra " + tempoBreve(gs.tra) : "pianta!", tocca: function () { schermataGiardino(); } }); }
      if (!novitaTutteViste()) l.push({ id: "novita", icona: "📰", col: "#4c6ef5", acceso: true, badge: "!", sotto: "Novità", tocca: function () { portaA("piazza", function () { cuore.rientro = schermataCitta; schermataNovita(); }); } });
      if (prog && N.progressione().xpGiorno !== oggiStr()) l.push({ id: "xp", icona: "⭐", col: "#f59f00", acceso: true, badge: "!", sotto: "+" + SGLivelli.BONUS_GIORNO + " XP", tocca: function () { scrollCitta = 0; ultimoEdificio = null; schermataHome(); } });
      if ((tv = trofeoVicino())) l.push({ id: "trofeo", icona: tv.t.icona || "🏆", col: "#7048e8", acceso: tv.q >= .9, badge: tv.q >= .9 ? "!" : "", sotto: "ne mancano " + cifre(tv.manca), tocca: function () { cuore.schermataSfideGioco(tv.t.gioco); } });
      return l.slice(0, window.innerHeight < 700 ? 5 : 6);
    }
    function apriSfide() {   // il pannello delle sfide: "Vai" porta al gioco (o al laghetto, agli scavi), chiudendo si aggiornano monete e avvisi
      var v = pannelloSfide(function (sfida) {
        if (sfida.fonte === "pesca") return portaA("pesca", schermataPesca);
        if (sfida.fonte === "scavi") return portaA("scavi", schermataScavi);
        var g = giocoDa(sfida.gioco); if (g) { cuore.rientro = schermataCitta; cuore.apriGioco(g); }
      }, function () { ultimaColonna = ""; aggiornaAvvisi(); if (prog) aggTesta(); });
      if (v) s.appendChild(v);
    }
    function aggiornaAvvisi() {   // si rifà solo la colonna, e solo se è cambiato qualcosa (niente lampeggio)
      var l = vociAvvisi(), chiave = JSON.stringify(l.map(function (v) { return [v.id, v.icona, v.acceso, v.badge, v.sotto]; }));
      if (chiave === ultimaColonna) return; ultimaColonna = chiave; svuota(colonna);
      l.forEach(function (v) {
        var tondo = el("span", { class: "ca-tondo", style: "background-color:" + v.col }, [ el("span", { class: "ca-ico", text: v.icona }) ]);
        if (v.badge) tondo.appendChild(el("span", { class: "ca-badge", text: v.badge }));
        colonna.appendChild(el("button", { class: "citta-av " + (v.acceso ? "acceso" : "spento"), "aria-label": v.sotto, onclick: function () { if (!via) v.tocca(); } }, [ tondo, el("span", { class: "ca-nome", text: v.sotto }) ]));
      });
    }
    var s = el("div", { class: "schermata citta-vista" + (fase === "notte" ? " notte" : ""), style: "background:" + SGCitta.colorePrato(fase) }, [
      mappa, colonna,
      el("div", { class: "citta-testa" }, [
        el("button", { class: "citta-indietro", text: "‹", "aria-label": "Indietro", onclick: function () { scrollCitta = 0; ultimoEdificio = null; schermataHome(); } }),
        el("button", { class: "citta-io", "aria-label": "Il tuo profilo", onclick: function () { cuore.schermataAccesso(schermataCitta); } }, [ faccia, testoIo ]),
        el("div", { class: "citta-monete", "aria-label": "Speed Coins" }, [ el("span", { class: "citta-moneta" }), monete ])
      ]),
      avviso,
      el("div", { class: "citta-giu" }, [
        el("button", { class: "citta-tasto", onclick: function () { if (!cloud) return presto("Crea il tuo profilo per avere la tua casa 🏠"); schermataGiardino(); } }, [ el("span", { class: "ct-ico", text: "🏠" }), el("span", { text: "Casa" }), el("small", { text: cloud ? "arreda" : "col profilo" }) ]),
        tastoPresto("🛡️", "Clan", "I quartieri-clan arrivano presto 🛡️"),
        el("button", { class: "citta-tasto", onclick: function () { if (!cloud) return presto("Crea il tuo profilo per fare acquisti 🛍️"); if (giardinoPronto() || serveExtra()) return schermataGiardino(false, "compra"); schermataNegozio(); } }, [ el("span", { class: "ct-ico", text: "🛍️" }), el("span", { text: "Negozio" }), el("small", { text: cloud ? "compra" : "col profilo" }) ]),
        regalo
      ])
    ]);
    if (!vista) mappa.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest("[data-vai]");
      if (!t || via) return;
      via = true;
      var k = t.getAttribute("data-vai"), r = t.getBoundingClientRect(), R = mappa.getBoundingClientRect();
      if (k === "piazza") fotoCitta = { src: null, punto: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, t: Date.now() };   // (le novità partono dalla bacheca toccata)
      scrollCitta = mappa.scrollTop;
      // zoom verso l'edificio toccato e dissolvenza (solo transform e opacity: niente scatti)
      mappa.style.transformOrigin = Math.round(r.left + r.width / 2 - R.left) + "px " + Math.round(r.top + r.height / 2 - R.top) + "px";
      mappa.style.transition = "transform .42s cubic-bezier(.55,0,.8,.3), opacity .42s ease-in";
      requestAnimationFrame(function () { mappa.style.transform = "scale(2.6)"; mappa.style.opacity = "0"; });
      suonoEdificio(k);
      setTimeout(function () { entraEdificio(k); }, 400);
    });
    aggiornaAvvisi();
    mostra(s);
    if (vista) vista._monta(); else if (scrollCitta) mappa.scrollTop = scrollCitta;
    var tAvvisi = setInterval(function () { if (!document.body.contains(s)) return clearInterval(tAvvisi); aggiornaAvvisi(); }, 30000);   // (a mezzanotte tornano esche e colpi, le piante maturano)
  }

  // ---- Dentro gli edifici della città: le sale coi giochi della categoria (stesso modello per tutti) ----
  // cat = categoria dei giochi (CAT_GIOCO); azioni = tasti al posto dei giochi; deco = cose sparse sullo sfondo
  var EDIFICI_CITTA = {
    casino: { nome: "Casinò",      sotto: "Black Jack e Poker",           cat: "carte",  deco: ["🃏", "♠️", "🪙", "♦️", "🎲", "♣️"] },
    circolo: { nome: "Il Circolo", sotto: "Carte e giochi da tavolo",     cat: "carte",  deco: ["🂡", "⭕", "🟡", "🚢", "☕", "🃏"] },
    studio: { nome: "Studio TV",   sotto: "Quiz & parole",                cat: "parole", deco: ["❓", "🎤", "💡", "🔤", "⭐", "📺"] },
    giochi: { nome: "Sala giochi", sotto: "I minigiochi",                 cat: "mini",   deco: ["🕹️", "👾", "⭐", "🎯", "💥", "🔺"] },
    arena:  { nome: "Arena",       sotto: "Sport e sfide 1 contro 1",     cat: "sfida",  deco: ["⚔️", "🛡️", "🏁", "⚡", "🥊", "🎯"],
      fuori: { tris: 1, drop4: 1, navale: 1 } },   // Tris, Drop 4 e Battaglia Navale stanno al Circolo
    locale: { nome: "Locale",      sotto: "Giochi da fare in gruppo",     cat: "festa",  deco: ["🎉", "🪩", "🎈", "🍹", "🎶", "✨"] },
    trofei: { nome: "Sala Trofei", sotto: "Trofei e classifiche",         deco: ["🏆", "🥇", "⭐", "🎖️", "👑", "🥈"],
      azioni: function () { return [
        { icona: "🏆", nome: "I tuoi trofei", sotto: "Tutti i trofei, gioco per gioco", fai: cuore.schermataSfide },
        { icona: "👥", nome: "Classifica e amici", sotto: "Chi ha più trofei, tra gli amici e tra tutti", fai: function () { cuore.schermataAmici(); } } ]; } },
    bar:    { nome: "Bar",         sotto: "Ci si trova con gli amici",    deco: ["☕", "🥐", "🍹", "💬", "🎲", "🧁"],
      azioni: function () { return [
        { icona: "👥", nome: "Sala online", sotto: "Porta il gruppo da un gioco all'altro, ognuno dal suo telefono", fai: cuore.creaSala },
        { icona: "🏆", nome: "Serata a punti", sotto: "Più giochi di fila: i punti si sommano", fai: cuore.apriTorneo },
        { icona: "🔑", nome: "Ho un codice", sotto: "Entra nella stanza di un amico", fai: function () { entraConCodice(); } } ]; } }
  };
  function entraEdificio(k) {
    if (k === "piazza") { cuore.rientro = schermataCitta; return schermataNovita(); }   // la piazza: le novità
    if (k === "pesca") return schermataPesca();   // il laghetto col pontile: si pesca
    if (k === "scavi") return schermataScavi();   // gli scavi antichi fuori città: si scava
    if (INTERNI[k]) percorsoInterno[k] = [];   // entrando dalla città si comincia dall'ingresso
    schermataEdificio(k);
  }

  // ---- Gli interni in prima persona: il Casinò e il Circolo (i disegni sono in casino.js).
  //      Si entra in una scena (il salone, l'atrio con le porte). Toccando un tavolo o una porta la vista
  //      "cammina" fin lì (solo transform) e compare la scena dopo (una sala del Circolo) o la sala del gioco,
  //      dove si tocca il tavolo per scegliere come giocare. Con ‹ si torna indietro un passo alla volta.
  //      In basso i nomi di tutti i giochi dell'edificio, per andare dritti al tavolo ----
  var INTERNI = {
    casino:  { titolo: "CASINÒ",     scena: "salone" },
    circolo: { titolo: "IL CIRCOLO", scena: "circolo" }
  };
  var percorsoInterno = {};   // dove sei in ogni edificio: i punti toccati (es. ["carte", "scopa"]); finita la partita si torna lì
  function schermataInterno(k) {
    var I = INTERNI[k];
    if (!I || !window.SGCasino) return schermataCitta();
    cuore.rientro = function () { schermataInterno(k); };   // finita la partita (o "indietro") si torna allo stesso tavolo
    var N = window.SGNube, prog = window.SGLivelli && N && N.progressione && N.profilo() ? N.progressione() : null;
    function pc(v, tot) { return (v * 100 / tot).toFixed(2) + "%"; }
    // tutti i giochi dell'edificio con la strada per arrivarci (porte e tavoli da toccare)
    var strade = [];
    (function cerca(idScena, strada) {
      (SGCasino.punti(idScena) || { punti: [] }).punti.forEach(function (p) {
        if (p.va.gioco && giocoDa(p.va.gioco)) strade.push({ id: p.va.gioco, nome: giocoDa(p.va.gioco).nome, strada: strada.concat(p.id) });
        else if (p.va.scena) cerca(p.va.scena, strada.concat(p.id));
      });
    })(I.scena, []);
    if (!strade.length) return schermataCitta();
    var vista = el("div", { class: "cs-vista" }), strati = [], percorso = [], cammina = false, geo = null;
    var invito = el("div", { class: "cs-tocca cs-invito" }), avviso = el("div", { class: "cs-presto" });
    var titolo = el("div", { class: "cs-titolo", text: I.titolo });
    vista.appendChild(invito); vista.appendChild(avviso);

    // una scena: il disegno 360×640 steso come "copertina", con sopra le insegne, i luccichii e le zone da toccare
    function stratoScena(idScena, nome) {
      var S = SGCasino.scena(idScena);
      var mov = el("div", { class: "cs-salone" });
      var dentro = el("div", { class: "cs-salone-in" }, [ el("img", { class: "cs-scena-salone", alt: "", draggable: "false", src: S.img }) ]);
      S.luci.forEach(function (l, i) {
        for (var q = 0; q < 5; q++) {
          var a = q * 1.3 + i * 0.6, x = l[0] + Math.cos(a) * l[2] * 0.5, y = l[1] + l[2] * 0.12 + Math.sin(a) * l[2] * 0.26;
          dentro.appendChild(el("i", { class: "cs-luccica", style: "left:" + pc(x, 360) + ";top:" + pc(y, 640) + ";animation-delay:" + (q * 0.55 + i * 0.3).toFixed(2) + "s" }));
        }
      });
      S.punti.forEach(function (p) {
        if (p.va.gioco && !giocoDa(p.va.gioco)) return;
        var b = p.box;
        if (p.cartello) dentro.appendChild(el("div", { class: "cs-cartello cs-" + p.stile + (p.muro ? " cs-muro" : ""), style: "left:" + pc(p.cartello[0], 360) + ";top:" + pc(p.cartello[1], 640) },
          [ el("b", { text: p.insegna }), p.va.presto ? el("i", { class: "cs-lucchetto", text: "🔒 Prossimamente" }) : null ]));
        dentro.appendChild(el("button", { class: "cs-zona", "aria-label": p.nome, onclick: function () { tocca(p); },
          style: "left:" + pc(b[0], 360) + ";top:" + pc(b[1], 640) + ";width:" + pc(b[2] - b[0], 360) + ";height:" + pc(b[3] - b[1], 640) }));
      });
      mov.appendChild(dentro);
      var porte = S.punti.some(function (p) { return p.va.scena; });
      return { tipo: "scena", el: mov, dentro: dentro, punti: S.punti, nome: nome, invito: porte ? "👆 Scegli una porta" : "👆 Scegli un tavolo" };
    }
    // la sala di un gioco (il primo piano del tavolo): si tocca e si sceglie come giocare
    function stratoSala(id, nome) {
      var x = SGCasino.SALE.filter(function (q) { return q.id === id; })[0] || { nome: id, insegna: id, stile: "bj" };
      var d = el("div", { class: "cs-sala cs-primo cs-" + x.stile, role: "button", "aria-label": x.nome + ": tocca per giocare" }, [
        el("img", { class: "cs-scena", alt: "", draggable: "false", src: SGCasino.immagine(id) }),
        el("div", { class: "cs-insegna" }, [ el("b", { text: x.insegna }) ]),
        el("div", { class: "cs-tocca", text: "👆 Tocca il tavolo per giocare" })
      ]);
      d.addEventListener("click", function () { var g = !cammina && giocoDa(id); if (g) scegliModoEdificio(g, k); });
      return { tipo: "sala", el: d, id: id, nome: nome };
    }
    function stendi(s) {
      if (s.tipo !== "scena" || !geo) return;
      s.dentro.style.cssText = "width:" + (360 * geo.s).toFixed(1) + "px;height:" + (640 * geo.s).toFixed(1) + "px;left:" + geo.ox.toFixed(1) + "px;top:" + geo.oy.toFixed(1) + "px;--s:" + geo.s.toFixed(3);
    }
    function misura() {
      var cw = vista.clientWidth, ch = vista.clientHeight; if (!cw || !ch) return false;
      var s = Math.max(cw / 360, ch / 640);
      geo = { s: s, ox: (cw - 360 * s) / 2, oy: (ch - 640 * s) * 0.45, cw: cw, ch: ch };
      strati.forEach(stendi);
      return true;
    }
    function cima() { return strati[strati.length - 1]; }
    function zoomSu(s, p) {   // la vista che porta il punto p della scena s al centro, da vicino
      var fx = geo.ox + p.fuoco[0] * geo.s, fy = geo.oy + p.fuoco[1] * geo.s;
      s.el.style.transformOrigin = fx.toFixed(1) + "px " + fy.toFixed(1) + "px";
      return "translate(" + (geo.cw / 2 - fx).toFixed(1) + "px," + (geo.ch * 0.52 - fy).toFixed(1) + "px) scale(" + (p.va.scena ? 2.3 : 2.6) + ")";
    }
    function aggiorna() {   // il titolo, il "tocca qui", il gioco acceso nei tasti in basso; si ricorda dove sei
      var c = cima(), nome = I.titolo;
      strati.forEach(function (s) { if (s.tipo === "scena" && s.nome) nome = s.nome; });
      titolo.textContent = nome;
      invito.textContent = c && c.invito || "";
      vista.classList.toggle("in-sala", !!c && c.tipo === "sala");
      tasti.forEach(function (b) { b.el.classList.toggle("on", c && c.tipo === "sala" && c.id === b.id); });
      percorsoInterno[k] = percorso.slice();
    }
    function presto(testo) { avviso.textContent = testo; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function tocca(p) {
      if (cammina) return;
      if (p.va.presto) return presto(p.va.presto);
      avanti(p);
    }
    // un passo avanti: la vista si avvicina al punto e compare quello che c'è dietro
    function avanti(p, subito, poi) {
      var sotto = cima();
      if (cammina || !geo || !sotto || sotto.tipo !== "scena") return;
      var nuovo = p.va.scena ? stratoScena(p.va.scena, p.nome.toUpperCase()) : stratoSala(p.va.gioco);
      if (nuovo.tipo === "scena") nuovo.el.classList.add("cs-primo");
      vista.insertBefore(nuovo.el, invito);
      strati.push(nuovo); percorso.push(p.id); sotto.verso = p;
      stendi(nuovo); aggiorna();
      if (subito) {
        sotto.el.style.transition = nuovo.el.style.transition = "none";
        sotto.el.style.transform = zoomSu(sotto, p); sotto.el.style.visibility = "hidden";
        nuovo.el.classList.add("su"); void nuovo.el.offsetWidth; nuovo.el.style.transition = "";
        if (poi) poi();
        return;
      }
      cammina = true;
      sotto.el.style.transition = "transform .85s cubic-bezier(.45,0,.25,1)";
      sotto.el.style.transform = zoomSu(sotto, p);
      sotto.el.classList.add("passi");
      setTimeout(function () { nuovo.el.classList.add("su"); suonoEdificio(nuovo.tipo === "sala" && k === "casino" ? "casino" : k); }, 560);
      setTimeout(function () { cammina = false; sotto.el.classList.remove("passi"); sotto.el.style.visibility = "hidden"; if (poi) poi(); }, 950);
      if (nuovo.tipo === "scena") prepara(nuovo.punti, 1100);
    }
    // un passo indietro: quello di sopra sparisce e la vista si allontana
    function indietro(poi) {
      if (cammina || strati.length < 2) return;
      cammina = true;
      var su = strati.pop(), sotto = cima();
      percorso.pop(); sotto.verso = null; aggiorna();
      sotto.el.style.visibility = "";
      su.el.style.transform = ""; su.el.classList.remove("su");
      sotto.el.style.transition = "transform .7s cubic-bezier(.3,0,.2,1)";
      requestAnimationFrame(function () { sotto.el.style.transform = "none"; });
      setTimeout(function () { if (su.el.parentNode) su.el.parentNode.removeChild(su.el); cammina = false; if (poi) poi(); }, 730);
    }
    function punto(s, id) { return (s.punti || []).filter(function (p) { return p.id === id; })[0]; }
    // dai tasti in basso: dritti al tavolo di quel gioco (le porte di mezzo si passano subito, l'ultimo passo si cammina)
    function vaiA(strada) {
      if (cammina) return;
      var com = 0;
      while (com < percorso.length && com < strada.length && percorso[com] === strada[com]) com++;
      if (com === strada.length && percorso.length === strada.length) return;
      if (strati.length - 1 > com) {   // torno dove la strada si divide
        if (strati.length - 2 === com) return indietro(function () { vaiA(strada); });
        while (strati.length - 1 > com) { var s = strati.pop(); if (s.el.parentNode) s.el.parentNode.removeChild(s.el); percorso.pop(); }
        var base = cima(); base.verso = null; base.el.style.transition = "none"; base.el.style.transform = "none"; base.el.style.visibility = "";
        aggiorna();
      }
      (function passo(i) {
        var p = punto(cima(), strada[i]); if (!p) return;
        if (i < strada.length - 1) avanti(p, true, function () { passo(i + 1); });
        else avanti(p);
      })(com);
    }
    // i disegni dietro le porte e le sale dei tavoli si preparano dopo, uno alla volta (così si entra subito)
    function prepara(lista, dopo) {
      lista.forEach(function (p, i) {
        setTimeout(function () {
          if (!document.body.contains(vista)) return;
          if (p.va.scena) SGCasino.scena(p.va.scena); else if (p.va.gioco) { var im = new Image(); im.src = SGCasino.immagine(p.va.gioco); }
        }, dopo + i * 250);
      });
    }
    var links = el("div", { class: "cs-giochi" });
    var tasti = strade.map(function (r) {
      var b = el("button", { class: "cs-link", text: r.nome, onclick: function () { vaiA(r.strada); } });
      links.appendChild(b);
      return { el: b, id: r.id };
    });
    var s = el("div", { class: "schermata casino-sale interno-" + k }, [
      vista,
      el("div", { class: "cs-testa" }, [
        el("button", { class: "ed-indietro", text: "‹", "aria-label": "Indietro", onclick: function () {
          if (strati.length > 1) indietro(); else if (!cammina) { cuore.rientro = null; schermataCitta(); }
        } }),
        titolo,
        prog ? el("div", { class: "ed-monete", text: "🪙 " + cifre(prog.coins) }) : el("div", { class: "ed-monete vuoto" })
      ]),
      links
    ]);
    mostra(s);
    var radice = stratoScena(I.scena, null), ritorno = (percorsoInterno[k] || []).slice();
    vista.insertBefore(radice.el, invito); strati.push(radice);
    (function parti() {
      if (!misura()) return requestAnimationFrame(parti);
      aggiorna();
      // tornando da una partita: di nuovo dov'eri, senza camminare
      (function passo(i) { var p = i < ritorno.length && punto(cima(), ritorno[i]); if (p) avanti(p, true, function () { passo(i + 1); }); })(0);
      prepara(radice.punti, 450);
    })();
    // telefono girato o finestra cambiata: si ristende tutto (e la vista resta dov'era)
    function ridim() {
      if (!document.body.contains(vista)) return window.removeEventListener("resize", ridim);
      if (!misura()) return;
      strati.forEach(function (st) { if (st.verso) { st.el.style.transition = "none"; st.el.style.transform = zoomSu(st, st.verso); } });
    }
    window.addEventListener("resize", ridim);
  }
  function schermataEdificio(k) {
    if (k === "casino") { if (serveExtra()) return caricaExtra(function () { schermataEdificio(k); }, "🎰"); if (window.SGGiardino) return schermataCasinoSala(); }   // il Casinò nuovo, visto dall'alto (per ora solo per il proprietario)
    if (k === "circolo" && (CIRCOLO_PRONTO || eProprietario())) { if (serveExtra()) return caricaExtra(function () { schermataEdificio(k); }, "🎲"); if (window.SGGiardino) return schermataCircoloSala(); }   // il Circolo visto dall'alto
    if (INTERNI[k] && window.SGCasino) return schermataInterno(k);   // Casinò e Circolo: gli interni in prima persona
    var E = EDIFICI_CITTA[k]; if (!E) return schermataCitta();
    cuore.rientro = function () { schermataEdificio(k); };   // finita la partita (o "indietro") si torna qui
    var N = window.SGNube, prog = window.SGLivelli && N && N.progressione && N.profilo() ? N.progressione() : null;
    var s = el("div", { class: "schermata edificio ed-" + k });
    var deco = el("div", { class: "ed-deco", "aria-hidden": "true" });
    E.deco.forEach(function (d, i) { deco.appendChild(el("span", { class: "d" + i, text: d })); });
    s.appendChild(deco);
    s.appendChild(el("div", { class: "ed-testa" }, [
      el("button", { class: "ed-indietro", text: "‹", "aria-label": "Torna in città", onclick: function () { cuore.rientro = null; schermataCitta(); } }),
      el("div", { class: "ed-titolo" }, [ el("b", { text: E.nome.toUpperCase() }), el("span", { text: E.sotto }) ]),
      prog ? el("div", { class: "ed-monete", text: "🪙 " + cifre(prog.coins) }) : el("div", { class: "ed-monete vuoto" })
    ]));
    var griglia = el("div", { class: "griglia-giochi ed-sale" });
    if (E.cat) giochi.forEach(function (g) { if (catDi(g) === E.cat && !(E.fuori && E.fuori[g.id])) griglia.appendChild(tesseraGioco(g, function () { scegliModoEdificio(g, k); })); });
    else E.azioni().forEach(function (a) {
      griglia.appendChild(el("button", { class: "tessera ed-azione", onclick: a.fai }, [
        el("span", { class: "icona" }, [ el("span", { class: "emoji", text: a.icona }) ]),
        el("div", { class: "info" }, [ el("h2", { text: a.nome }), el("p", { text: a.sotto }) ])
      ]));
    });
    s.appendChild(griglia);
    mostra(s);
  }
  var posCasino = null;   // dove eri nel casinò quando hai cominciato una partita: finita, si torna lì
  function schermataCasinoSala(pos) {   // il salone del Casinò visto dall'alto, come la casa: si cammina tra i tavoli e ci si siede a giocare
    cuore.rientro = function () { schermataCasinoSala(posCasino); };   // finita la partita si torna nel salone, dove eri
    var io = profiloAttivo(), m = soldiCasa();
    var s = SGGiardino.crea({ luogo: "casino", pos: pos || null, omino: io && io.omino, nome: io && io.nome, audio: audioCtx, monete: m.monete, spendi: m.spendi, guadagna: m.guadagna,
      gioca: function (id, dove) { posCasino = dove || null; var g = giocoDa(id); if (g) scegliModoEdificio(g, "casino"); },
      indietro: function () { cuore.rientro = null; schermataCitta(); } });
    mostra(s); s._monta();
  }
  // il Circolo visto dall'alto: si cammina tra i tavoli, ci si siede e si gioca (carte, giochi a due, biliardo); fuori il cortile con le bocce
  var CIRCOLO_PRONTO = false;   // false = per ora lo vede solo il proprietario (gli altri hanno il Circolo di prima)
  var posCircolo = null;
  function schermataCircoloSala(pos) {
    cuore.rientro = function () { schermataCircoloSala(posCircolo); };   // finita la partita si torna nel Circolo, dove eri
    var io = profiloAttivo(), m = soldiCasa();
    var s = SGGiardino.crea({ luogo: "circolo", pos: pos || null, omino: io && io.omino, nome: io && io.nome, audio: audioCtx, monete: m.monete, spendi: m.spendi, guadagna: m.guadagna,
      gioca: function (id, dove) { posCircolo = dove || null; var g = giocoDa(id); if (g) scegliModoEdificio(g, "circolo"); },
      indietro: function () { cuore.rientro = null; schermataCitta(); } });
    mostra(s); s._monta();
  }
  // toccato un gioco: "Come giocate?" in una finestra sopra la sala, coi modi veri del gioco
  function scegliModoEdificio(g, k) {
    if (!profiloAttivo()) return cuore.schermataAccesso(function () { schermataEdificio(k); });
    var modi = modiDi(g).slice();
    if (giocoOnline(g)) conCodice(modi);
    if (modi.length <= 1) return cuore.apriGioco(g);   // un modo solo: si parte subito, come dalla home
    var chiudi = function () { if (sfondo.parentNode) sfondo.parentNode.removeChild(sfondo); };
    var lista = el("div", { class: "modo-scelta" });
    modi.forEach(function (m) {
      lista.appendChild(el("button", { class: "modo-grande" + (m.modo === "online" ? " online" : ""), onclick: function () { chiudi(); sceltoModo(g, m); } }, [
        el("div", { class: "mg-ico", text: m.icona }),
        el("div", { class: "mg-testo" }, [ el("div", { class: "mg-tit", text: m.nome }), el("div", { class: "mg-sotto", text: m.sotto || "" }) ]),
        el("div", { class: "mg-freccia", text: "›" })
      ]));
    });
    var sfondo = el("div", { class: "ed-modale-sfondo ed-" + k, onclick: function (e) { if (e.target === sfondo) chiudi(); } }, [
      el("div", { class: "ed-modale", role: "dialog" }, [
        el("div", { class: "edm-testa" }, [ el("span", { class: "edm-ico", text: g.icona || "🎲" }), el("div", {}, [ el("b", { text: g.nome }), el("span", { text: "Come giocate?" }) ]) ]),
        lista,
        el("div", { class: "edm-piede" }, [
          el("button", { class: "btn btn-fantasma", text: "📖 Come si gioca", onclick: function () { chiudi(); schermataRegole(g, function () { schermataEdificio(k); }); } }),
          el("button", { class: "btn btn-fantasma", text: "✕ Chiudi", onclick: chiudi })
        ])
      ])
    ]);
    document.body.appendChild(sfondo);
  }
  // un suono corto entrando (le fiches al Casinò, un "din" altrove): niente musica di sottofondo
  function suonoEdificio(k) {
    var ctx = audioCtx(); if (!ctx) return;
    try {
      var note = k === "casino" ? [[2400, 0], [2900, .07], [2600, .13]] : [[660, 0], [990, .09]];
      note.forEach(function (n) {
        var t0 = ctx.currentTime + n[1], o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = k === "casino" ? "triangle" : "sine"; o.frequency.setValueAtTime(n[0], t0);
        gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(k === "casino" ? 0.08 : 0.1, t0 + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + (k === "casino" ? 0.12 : 0.3));
        o.connect(gn); gn.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.35);
      });
    } catch (e) {}
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.pubblicaCasa = pubblicaCasa; cuore.ruotaDelGiorno = ruotaDelGiorno; cuore.schermataCasaAmico = schermataCasaAmico;
  cuore.schermataCitta = schermataCitta; cuore.statoSfide = statoSfide;
  Object.defineProperty(cuore, "CITTA_A_PIEDI", { get: function () { return CITTA_A_PIEDI; }, configurable: true });
  Object.defineProperty(cuore, "fotoCitta", { get: function () { return fotoCitta; }, set: function (v) { fotoCitta = v; }, configurable: true });
})();
