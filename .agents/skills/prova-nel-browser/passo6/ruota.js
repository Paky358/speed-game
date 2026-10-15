// PROVE DELLA RUOTA DEI GIOCHI E DELLA SCHEDA DEL VOTO del Passo 6 (scenari 650-654, pezzo p6-r, js/scegliamo.js).
// SGScegliamo è solo disegno (niente rete): qui si prova direttamente sui telefoni finti, senza Sala.
// 650 la ruota si ferma dove deve, uguale su 3 telefoni con orologi diversi · 651 spicchi pesati e colori
// 652 scheda del voto (aggiorna non rifà le tessere, "3 su 5") · 653 già finito / arrivato tardi · 654 misure 360x640 e 412x915
// Uso (dopo aver caricato copione-prova.js):
//   const r = await (await fetch("/.agents/skills/prova-nel-browser/passo6/ruota.js?" + Date.now())).text(); (0, eval)(r);
//   await COPIONE.prova(650)
(function () {
  var W = window;
  function aggiungi(n, s) { if (W.COPIONE.aggiungi) W.COPIONE.aggiungi(n, s); else W.COPIONE.scenari[n] = s; }
  function no(p) { throw new Error(p); }
  var GIOCHI = [
    { id: "tris", icona: "❌", nome: "Tris", sotto: "⚔️ In 2" },
    { id: "drop4", icona: "🔴", nome: "Forza 4", sotto: "⚔️ In 2" },
    { id: "balla", icona: "🤥", nome: "La Balla Colossale", sotto: "Da 3 a 8" }
  ];
  // l'angolo del disco (gradi) e lo spicchio sotto la freccia in alto
  function angolo(w) { var cv = w.document.querySelector(".sgs-ruota .rg-disco"), m = cv && /rotate\(([-\d.]+)deg\)/.exec(cv.style.transform); return m ? +m[1] : null; }
  function sottoFreccia(ang, n) { var phi = ((360 - ang % 360) % 360 + 360) % 360; return Math.floor(phi / (360 / n)); }
  // un motore audio finto che segna le note (sul computer di prova i suoni sono spenti)
  function audioFinto(w) {
    var note = w.__note = [];
    function par(v) { return { value: v, setValueAtTime: function (x) { this.value = x; return this; }, exponentialRampToValueAtTime: function () { return this; } }; }
    function nodo(o) { o = o || {}; o.connect = function () {}; o.disconnect = function () {}; return o; }
    function Finto() { this.state = "running"; this.destination = nodo(); this.currentTime = 0; }
    Finto.prototype.createOscillator = function () { var o = nodo({ type: "sine", frequency: par(440) }); o.start = function () { note.push(Math.round(o.frequency.value)); }; o.stop = function () {}; return o; };
    Finto.prototype.createGain = function () { return nodo({ gain: par(1) }); };
    Finto.prototype.resume = function () { return Promise.resolve(); };
    w.AudioContext = Finto; w.webkitAudioContext = Finto;
    // e le vibrazioni: non ce ne devono essere
    w.__vibra = 0;
    try { Object.defineProperty(w.navigator, "vibrate", { configurable: true, value: function () { w.__vibra++; return true; } }); } catch (e) {}
  }
  // la scheda del voto dentro una schermata come quelle del core (testa vuota, contenuto, piede)
  function montaScheda(w, o) {
    var d = w.document, app = d.getElementById("app");
    var h = w.SGScegliamo.scheda(o);
    if (!h || !h.nodo) no("SGScegliamo.scheda non restituisce il nodo");
    var s = d.createElement("div"); s.className = "schermata";
    var t = d.createElement("div"); t.className = "testa";
    var c = d.createElement("div"); c.className = "contenuto"; c.appendChild(h.nodo);
    var p = d.createElement("div"); p.className = "piede";
    s.appendChild(t); s.appendChild(c); s.appendChild(p);
    app.innerHTML = ""; app.appendChild(s);
    return h;
  }
  function voti(lista) { var v = {}; lista.forEach(function (x, i) { v["m" + i] = { g: x, nome: "Amico" + i, omino: null }; }); return v; }
  async function misura(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; } .rg-velo, .rg-scheda{ transition:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(400);
  }
  // niente esce dallo schermo: "" = tutto bene, se no il perché
  function dentroSchermo(w, sel, larg, alt) {
    var d = w.document, el = d.querySelectorAll(sel);
    if (!el.length) return "non trovo " + sel;
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px su " + alt + ")";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato";
    for (var i = 0; i < el.length; i++) {
      var r = el[i].getBoundingClientRect();
      if (r.top < -1 || r.left < -1 || r.bottom > alt + 1 || r.right > larg + 1) return sel + " esce dallo schermo (" + Math.round(r.left) + "," + Math.round(r.top) + "→" + Math.round(r.right) + "," + Math.round(r.bottom) + ")";
    }
    return "";
  }

  // ---------- 650 La ruota si ferma dove deve, uguale su tre telefoni ----------
  aggiungi(650, { nome: "La ruota si ferma sullo spicchio deciso, uguale su 3 telefoni (orologi diversi, arrivi a metà giro)", fai: async function () {
    var A = await W.apriTel("Paky", { x: 0, prima: audioFinto }), B = await W.apriTel("Giulia", { x: 185, prima: audioFinto }), C = await W.apriTel("Luca", { x: 370, prima: audioFinto });
    // l'orologio di Giulia è avanti di 3 s, quello di Luca indietro di 2 s: lo scarto rimette tutto a posto
    var dB = 3000, dC = -2000, nowB = B.Date.now, nowC = C.Date.now;
    B.Date.now = function () { return nowB.call(B.Date) + dB; }; C.Date.now = function () { return nowC.call(C.Date) + dC; };
    var tel = [{ w: A, s: 0 }, { w: B, s: -dB }, { w: C, s: -dC }], fatti = 0, metaGiro = 0, tic = 0;
    for (var giro = 0; giro < 20; giro++) {
      var conti = GIOCHI.map(function (g) { return { g: g.id, n: 1 + Math.floor(Math.random() * 5) }; });
      var sp = A.SGScegliamo.spicchi(GIOCHI, conti), n = sp.length, vince = Math.floor(Math.random() * n), theta = Math.random();
      var nuovo = giro < 3, parte = nuovo ? Date.now() + 300 : Date.now() - (2500 + Math.floor(Math.random() * 3500));
      var poi = [];
      A.__note.length = 0;
      tel.forEach(function (t, i) {
        var dopo = false;
        // i telefoni ricevono i conti {g,n} come nel messaggio della Sala e li espandono da soli
        t.v = t.w.SGScegliamo.ruota({ spicchi: conti, giochi: GIOCHI, vince: vince, theta: theta, parte: parte, scarto: t.s, poi: function (g) { poi[i] = { g: g, dopo: dopo }; } });
        dopo = true;
        if (!t.v) no("ruota non restituisce il velo");
      });
      if (nuovo) {
        // a metà giro i tre telefoni mostrano (quasi) lo stesso angolo
        await W.dorme(300 + 2600);
        var an = tel.map(function (t) { return angolo(t.w); });
        if (an.some(function (x) { return x == null; })) no("giro " + giro + ": ruota senza angolo");
        var diff = Math.max.apply(null, an) - Math.min.apply(null, an);
        if (diff > 12) no("giro " + giro + ": a metà giro gli angoli sono diversi " + an.map(Math.round).join(" / "));
        metaGiro = Math.max(metaGiro, diff);
      }
      var ok = await W.aspetta(function () { return tel.every(function (t) { return t.w.document.querySelector(".sgs-ruota .rg-tutto.vinto"); }); }, 8000, 50);
      if (!ok) no("giro " + giro + ": la ruota non si ferma");
      var fin = tel.map(function (t) { return angolo(t.w); });
      if (fin[0] !== fin[1] || fin[1] !== fin[2]) no("giro " + giro + ": angoli finali diversi " + fin.join(" / "));
      if (sottoFreccia(fin[0], n) !== vince) no("giro " + giro + ": la freccia sta sullo spicchio " + sottoFreccia(fin[0], n) + " invece di " + vince + " (angolo " + fin[0] + ")");
      var g = sp[vince].g, scritta = A.document.querySelector(".sgs-ruota .rg-esito").textContent;
      var nomeG = GIOCHI.filter(function (x) { return x.id === g; })[0].nome;
      if (scritta.indexOf("Si gioca a " + nomeG) < 0) no("giro " + giro + ": la scritta dice «" + scritta + "»");
      if (nuovo) tic += A.__note.filter(function (f) { return f === 1900; }).length;
      if (!await W.aspetta(function () { return poi.length === 3 && poi[0] && poi[1] && poi[2]; }, 3500, 50)) no("giro " + giro + ": poi() non arriva su tutti");
      if (poi.some(function (p) { return p.g !== g || !p.dopo; })) no("giro " + giro + ": poi con il gioco sbagliato o dentro la chiamata: " + JSON.stringify(poi));
      await W.dorme(320);
      if (tel.some(function (t) { return t.w.document.querySelector(".sgs-ruota"); })) no("giro " + giro + ": il velo resta dopo poi()");
      fatti++;
    }
    if (tic < 10) no("pochi tic durante il giro: " + tic);
    var vib = A.__vibra + B.__vibra + C.__vibra; if (vib) no("la ruota ha fatto vibrare " + vib + " volte");
    return fatti + " giri giusti su 3 telefoni (3 dall'inizio, 17 arrivati a metà o dopo), scarto massimo a metà giro " + Math.round(metaGiro) + "°, " + tic + " tic, nessuna vibrazione";
  } });

  // ---------- 651 Spicchi pesati ----------
  aggiungi(651, { nome: "Spicchi pesati: voti 3-1-0 → 4, 2, 1 spicchi, colori giusti", fai: async function () {
    var A = await W.apriTel("Paky", { x: 0 }), S = A.SGScegliamo;
    var ids = GIOCHI.map(function (g) { return g.id; });
    var c1 = S.conta(ids, { a: "tris", b: "tris", c: "tris", d: "drop4" });
    var c2 = S.conta(GIOCHI, { a: { g: "tris" }, b: { g: "tris" }, c: { g: "tris" }, d: { g: "drop4" }, e: { g: "scopa" } });   // (un voto per un gioco non proposto non conta)
    var atteso = JSON.stringify([{ g: "tris", n: 4 }, { g: "drop4", n: 2 }, { g: "balla", n: 1 }]);
    if (JSON.stringify(c1) !== atteso || JSON.stringify(c2) !== atteso) no("conta: " + JSON.stringify(c1) + " / " + JSON.stringify(c2));
    var sp = S.spicchi(GIOCHI, c1), quanti = {};
    if (sp.length !== 7) no("spicchi: " + sp.length + " invece di 7");
    sp.forEach(function (p, i) {
      quanti[p.g] = (quanti[p.g] || 0) + 1;
      var col = ids.indexOf(p.g);
      if (p.colore !== col) no("lo spicchio " + i + " (" + p.g + ") ha il colore " + p.colore + " invece di " + col);
      if (p.icona !== GIOCHI[col].icona || p.nome !== GIOCHI[col].nome) no("spicchio " + i + " senza emoji o nome giusti");
    });
    if (quanti.tris !== 4 || quanti.drop4 !== 2 || quanti.balla !== 1) no("spicchi per gioco: " + JSON.stringify(quanti));
    // stesso ordine su un altro telefono, e con 2-2-1 nessuno spicchio vicino a uno dello stesso gioco (anche tra l'ultimo e il primo)
    var B = await W.apriTel("Giulia", { x: 185 });
    if (JSON.stringify(B.SGScegliamo.spicchi(GIOCHI, c1)) !== JSON.stringify(sp)) no("l'ordine degli spicchi cambia da un telefono all'altro");
    var sp2 = S.spicchi(GIOCHI, [{ g: "tris", n: 2 }, { g: "drop4", n: 2 }, { g: "balla", n: 1 }]);
    for (var i = 0; i < sp2.length; i++) if (sp2[i].g === sp2[(i + 1) % sp2.length].g) no("2-2-1: due spicchi uguali vicini " + sp2.map(function (p) { return p.g; }).join(","));
    // il colore disegnato: a un terzo del raggio, in mezzo allo spicchio, c'è il colore del suo gioco (il più vicino dei 6)
    var cv = A.document.createElement("canvas"), lato = 300; A.document.body.appendChild(cv);
    S.disegna(cv, sp, lato);
    var ctx = cv.getContext("2d"), k = cv.width / lato, TAV = S.TAVOLOZZA;
    function rgb(h) { return [1, 3, 5].map(function (j) { return parseInt(h.substr(j, 2), 16); }); }
    sp.forEach(function (p, i) {
      var a = -Math.PI / 2 + (i + 0.5) * 2 * Math.PI / sp.length, rr = lato / 2 * 0.3;
      var px = ctx.getImageData(Math.round((lato / 2 + rr * Math.cos(a)) * k), Math.round((lato / 2 + rr * Math.sin(a)) * k), 1, 1).data;
      var meglio = -1, dmin = 1e9;
      TAV.forEach(function (t, j) {
        var A1 = rgb(t.a), B1 = rgb(t.b), q = (0.3 - 0.15) / 0.85, d = 0;
        for (var z = 0; z < 3; z++) { var e = A1[z] * (1 - q) + B1[z] * q - px[z]; d += e * e; }
        if (d < dmin) { dmin = d; meglio = j; }
      });
      if (meglio !== p.colore) no("lo spicchio " + i + " è disegnato col colore " + meglio + " invece di " + p.colore + " (pixel " + [].slice.call(px, 0, 3) + ")");
    });
    cv.remove();
    return "3-1-0 → 4, 2, 1 spicchi (" + sp.map(function (p) { return p.g; }).join(" ") + "), colori uguali per gioco anche sul disegno, stesso ordine sui telefoni";
  } });

  // ---------- 652 Scheda del voto ----------
  aggiungi(652, { nome: "Scheda del voto: aggiorna 50 volte senza rifare le tessere, tasto «3 su 5», voto che si cambia", fai: async function () {
    var A = await W.apriTel("Paky", { x: 0 }), votati = [], girata = 0;
    var h = montaScheda(A, { giochi: GIOCHI, mio: null, voti: {}, secondi: 20, host: true, membri: 5,
      onVota: function (g) { votati.push(g); }, onChiudi: function () { girata++; } });
    var d = A.document, tasto = d.querySelector(".sgs-gira");
    if (!tasto) no("l'host non ha il tasto della ruota");
    if (!tasto.disabled) no("il tasto è acceso senza voti");
    if (!/\(0 su 5\)/.test(tasto.textContent)) no("tasto senza voti: «" + tasto.textContent + "»");
    var conto = d.querySelector(".sgs-conto").textContent;
    if (!/^(20|19)/.test(conto)) no("il conto parte da «" + conto + "»");
    var tess = [].slice.call(d.querySelectorAll(".sgs-tessera"));
    if (tess.length !== 3) no(tess.length + " tessere invece di 3");
    // conto delle tessere tolte o rimesse (non deve succedere mai)
    var rifatte = 0, mo = new A.MutationObserver(function (l) { l.forEach(function (m) { [].forEach.call(m.removedNodes, function (x) { if (x.classList && (x.classList.contains("sgs-tessera") || x.classList.contains("sgs-foto") || x.classList.contains("sgs-nome"))) rifatte++; }); }); });
    mo.observe(h.nodo, { childList: true, subtree: true });
    var nomi = ["tris", "drop4", "balla"];
    for (var i = 0; i < 50; i++) {
      var lista = [];
      for (var j = 0; j < 3; j++) lista.push(nomi[(i + j * 2) % 3]);
      h.aggiorna(voti(lista), null, 20000 - i * 100);
      await W.dorme(10);
    }
    mo.disconnect();
    var tess2 = [].slice.call(d.querySelectorAll(".sgs-tessera"));
    if (rifatte || tess2.some(function (t, k) { return t !== tess[k]; })) no("aggiorna ha rifatto le tessere (" + rifatte + ")");
    if (!/\(3 su 5\)/.test(tasto.textContent) || tasto.disabled) no("tasto dopo 3 voti: «" + tasto.textContent + "»" + (tasto.disabled ? " spento" : ""));
    var facce = tess.map(function (t) { return t.querySelectorAll(".sgs-faccia").length; }).reduce(function (a, b) { return a + b; }, 0);
    if (facce !== 3) no(facce + " facce sotto le tessere invece di 3");
    // il mio voto: si accende «✅ Il tuo voto», si può cambiare
    tess[1].click();
    if (votati.join() !== "drop4" || !tess[1].classList.contains("mia")) no("il tocco non vota Forza 4: " + votati.join());
    tess[1].click();   // (di nuovo lo stesso: niente)
    tess[2].click();
    if (votati.join() !== "drop4,balla" || tess[1].classList.contains("mia") || !tess[2].classList.contains("mia")) no("il voto non si cambia: " + votati.join());
    // otto voti sulla Balla: 6 facce e "+2"
    h.aggiorna(voti(["balla", "balla", "balla", "balla", "balla", "balla", "balla", "balla"]), "balla", 9000);
    var fb = tess[2].querySelectorAll(".sgs-faccia").length, piu = (tess[2].querySelector(".sgs-piu") || {}).textContent;
    if (fb !== 6 || piu !== "+2") no("con 8 voti: " + fb + " facce e «" + piu + "»");
    if (tess[0].querySelectorAll(".sgs-faccia").length) no("restano facce su Tris");
    if (!/\(8 su 5\)|\(8 su 8\)/.test(tasto.textContent)) { /* (membri lo decide il core) */ }
    h.aggiorna(null, "balla", 9000, 9);
    if (!/\(8 su 9\)/.test(tasto.textContent)) no("tasto con 9 membri: «" + tasto.textContent + "»");
    var c2 = d.querySelector(".sgs-conto span").textContent; if (c2 !== "9") no("il conto dice " + c2 + " invece di 9");
    tasto.click(); tasto.click();
    if (girata !== 1) no("onChiudi chiamato " + girata + " volte");
    h.chiudi();
    tess[0].click(); if (votati.length !== 2) no("dopo chiudi si vota ancora");
    // chi non è l'host: niente tasto della ruota
    var g = montaScheda(A, { giochi: GIOCHI, mio: "tris", voti: { x: "tris" }, persone: { x: { nome: "Bea" } }, secondi: 20, host: false });
    if (A.document.querySelector(".sgs-gira")) no("chi non è l'host ha il tasto della ruota");
    if (!A.document.querySelector(".sgs-tessera.mia[data-g=tris]")) no("il voto di partenza non è acceso");
    if (A.document.querySelector(".sgs-tessera[data-g=tris] .sgs-faccia").textContent !== "B") no("faccia di Bea senza avatar: niente iniziale");
    g.chiudi();
    return "tessere sempre le stesse dopo 50 aggiornamenti, «3 su 5», voto cambiato, 6 facce + «+2», un solo giro, ospite senza tasto";
  } });

  // ---------- 653 Già finito ----------
  aggiungi(653, { nome: "Già finito: chi arriva dopo il giro vede subito il gioco uscito", fai: async function () {
    var A = await W.apriTel("Paky", { x: 0, prima: audioFinto }), S = A.SGScegliamo;
    var conti = S.conta(GIOCHI, { a: "tris", b: "balla" }), sp = S.spicchi(GIOCHI, conti);
    var esiti = [];
    for (var caso = 0; caso < 2; caso++) {
      var vince = caso ? sp.length - 1 : 2, arrivato = null, dentro = true, t0 = Date.now();
      var o = { spicchi: conti, giochi: GIOCHI, vince: vince, theta: 0.3, poi: function (g) { arrivato = { g: g, dentro: dentro, ms: Date.now() - t0 }; } };
      if (caso === 0) o.giaFinito = true; else o.parte = Date.now() - 6000;   // (oppure: l'ora dell'host dice che il giro è finito da 0,8 s)
      A.__note.length = 0;
      S.ruota(o); dentro = false;
      var ang = angolo(A);
      if (!A.document.querySelector(".sgs-ruota .rg-tutto.vinto")) no("caso " + caso + ": la ruota non è subito ferma");
      if (sottoFreccia(ang, sp.length) !== vince) no("caso " + caso + ": ferma sullo spicchio sbagliato");
      if (A.__note.filter(function (f) { return f === 1900; }).length) no("caso " + caso + ": tic senza giro");
      var nomeG = GIOCHI.filter(function (x) { return x.id === sp[vince].g; })[0].nome;
      if (A.document.querySelector(".sgs-ruota .rg-esito").textContent.indexOf("Si gioca a " + nomeG) < 0) no("caso " + caso + ": niente scritta del gioco");
      if (!await W.aspetta(function () { return arrivato; }, 2500, 30)) no("caso " + caso + ": poi non arriva");
      if (arrivato.dentro || arrivato.g !== sp[vince].g) no("caso " + caso + ": poi sbagliato " + JSON.stringify(arrivato));
      esiti.push(nomeG + " dopo " + (Math.round(arrivato.ms / 100) / 10) + " s");
      await W.dorme(300);
    }
    // velo.chiudi(): via subito, poi non arriva
    var chiamato = false, v = S.ruota({ spicchi: conti, giochi: GIOCHI, vince: 0, poi: function () { chiamato = true; } });
    await W.dorme(200); v.chiudi(); await W.dorme(7500);
    if (chiamato || A.document.querySelector(".sgs-ruota")) no("velo.chiudi() non ferma la ruota");
    return "giaFinito e arrivo tardi: subito ferma sul gioco giusto, niente tic, poi dopo (" + esiti.join(", ") + "); chiudi() la toglie";
  } });

  // ---------- 654 Misure ----------
  aggiungi(654, { nome: "Scheda e ruota a 360x640 e 412x915: niente esce dallo schermo", fai: async function () {
    var A = await W.apriTel("Paky", { x: 0 }), S = A.SGScegliamo, esiti = [];
    var lunghi = [
      { id: "nomicoseecitta", icona: "🌍", nome: "Nomi, Cose e Città", sotto: "Da 2 a 10 · tutti insieme" },
      { id: "scarabocchio", icona: "✏️", nome: "Scarabocchio", sotto: "Da 3 a 10" },
      { id: "balla", icona: "🤥", nome: "La Balla Colossale", sotto: "Da 3 a 8" }
    ];
    var M = [[360, 640], [412, 915]];
    for (var i = 0; i < M.length; i++) {
      var L = M[i][0], H = M[i][1];
      var h = montaScheda(A, { giochi: lunghi, mio: "balla", voti: voti(["balla", "balla", "balla", "balla", "balla", "balla", "balla", "balla", "scarabocchio", "nomicoseecitta"]), secondi: 20, host: true, membri: 12 });
      await misura(A, "Paky", L, H);
      var e = dentroSchermo(A, ".sgs-tessera, .sgs-gira, .sgs-conto, .sgs-titolo", L, H); if (e) no(L + "x" + H + " scheda: " + e);
      var tt = A.document.querySelector(".sgs-tessera").getBoundingClientRect().height;
      if (tt < 90) no(L + "x" + H + ": tessere troppo basse (" + Math.round(tt) + " px)");
      h.chiudi();
      // la ruota con tanti spicchi (12 votanti)
      var conti = S.conta(lunghi, voti(["balla", "balla", "balla", "balla", "balla", "balla", "balla", "scarabocchio", "scarabocchio", "nomicoseecitta", "nomicoseecitta", "nomicoseecitta"]));
      var v = S.ruota({ spicchi: conti, giochi: lunghi, vince: 3, theta: 0.5, giaFinito: true });
      await W.dorme(100);
      e = dentroSchermo(A, ".sgs-ruota .rg-scheda, .sgs-ruota .rg-tutto, .sgs-ruota .rg-esito", L, H); if (e) no(L + "x" + H + " ruota: " + e);
      var lato = A.document.querySelector(".sgs-ruota .rg-disco").offsetWidth;
      esiti.push(L + "x" + H + ": tessere " + Math.round(tt) + " px, ruota " + Math.round(lato) + " px");
      v.chiudi();
    }
    return esiti.join(" · ");
  } });
})();
