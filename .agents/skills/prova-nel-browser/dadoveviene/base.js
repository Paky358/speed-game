// PROVE DI «🍹 DA DOVE VIENE?» (js/games/dadoveviene.js, data/dadoveviene-carte.js, data/dadoveviene-paesi.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("dadoveviene/base.js"); await COPIONE.prova("dv1")
// Con Edge invisibile: prova.js --porta 8972 --carica dadoveviene/base.js --prova dv1,dv2 --rifai --timeout 900
// Wikipedia è FINTA in tutte le prove (fintoWiki): la foto di ogni piatto è un'immagine del sito (carte/giochi/tris.jpg#c=id),
// quelle «rotte» puntano a un file che non c'è (404). Così le prove non dipendono dalla rete.
//
// dv1: le regole senza grafica (distanze e direzioni su coppie note, Roma→Oslo ~2.000 km ⬆️; i gradi; i sinonimi dei
//      paesi; più paesi giusti; i punti 3/2/1; l'indirizzo della foto a 500 px), le schede (≥160, tutti i campi, paesi
//      che esistono, almeno 40 per mazzo), il «📜 Si gioca così» e le impostazioni col box fuori dalla pagina.
// dv2: online nella Sala in 4, 🤝 tutti in squadra, 5 portate: giusto al 1° (scelto dal ventaglio dei paesi), giusto al 3°
//      (gli indizi arrivano uno alla volta, i km e la freccia), mai giusto, Marco arriva a metà e tocca «▶ Entra» (entra alla
//      portata dopo), Giulia ricarica; il capitano cambia a ogni piatto e i compagni vedono cosa scrive; classifica (tutti
//      primi) coi tasti del core; misure 360x640 e 412x915 durante il gioco e sulla scheda; mai un'emoji al posto della foto.
// dv3: online in 4, ⚔️ due squadre (2 contro 2): nella foto per tutti i tentativi non ci sono finché non si svela, i segreti
//      sempre con «to»; i Rossi al 1°, i Blu al 3°; classifica: chi vince 1°, chi perde 2°; misure.
// dv4: la ripresa: l'host ricarica a metà piatto (il tentativo resta, nessuno in saletta) e sulla scheda (niente punti
//      doppi); poi l'host si spegne e la partita la porta avanti un amico fino alla classifica.
// dv5: sullo stesso telefono, 🤝 in squadra, 5 portate fino alla classifica del core.
// dv6: sullo stesso telefono, ⚔️ due squadre in 3: a turno (🔴, 🔵, 🔴…), 6 piatti per 5 portate, classifica.
// dv8: il tempo del tentativo (accorciato a 4 s): a tempo scaduto vale il paese scelto dal capitano; senza scelta il tentativo è perso (⏱).
// dv7: le foto che non si caricano: un piatto con la foto rotta si salta (un altro dello stesso mazzo, senza che nessuno
//      lo veda); se non arriva nessuna foto «📶 Le foto non arrivano» con «↻ Riprova» (online e sullo stesso telefono).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var NOME = "Da dove viene?";
  var LONTANI = ["NO", "AU", "IS", "NZ", "JP", "ZA", "CA", "AR", "MN", "FJ"];
  function vm(C) { return W.vmDi(C) || {}; }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }

  // ---- Wikipedia finta (in ogni telefono, prima che parta l'app; anche dopo una ricarica) ----
  function fintoWiki(w, opz) {
    opz = opz || {};
    var orig = w.fetch.bind(w), mappa = null;
    w.__ddvRotte = (opz.rotte || []).slice(); w.__ddvTutteRotte = !!opz.tutteRotte; w.__ddvChieste = [];
    w.fetch = function (u, o) {
      var s = String(u && u.url || u), m = /wikipedia\.org\/api\/rest_v1\/page\/summary\/(.+)$/.exec(s);
      if (!m) return orig(u, o);
      if (w.__ddvNoRete) return Promise.reject(new TypeError("rete giù"));
      if (!mappa) { mappa = {}; (w.SG_DDV_CARTE || []).forEach(function (c) { var x = /^([a-z\-]+):(.+)$/.exec(c.w); mappa[x[1] + "|" + encodeURIComponent(x[2])] = c.id; }); }
      var lang = /^https:\/\/([a-z\-]+)\./.exec(s)[1], id = mappa[lang + "|" + m[1]] || "?";
      w.__ddvChieste.push(id);
      var rotta = w.__ddvTutteRotte || w.__ddvRotte.indexOf(id) >= 0;
      var src = rotta ? "/manca/foto-" + id + ".jpg" : "/carte/giochi/tris.jpg#c=" + id;
      var j = { type: "standard", title: id, thumbnail: { source: src, width: 330, height: 330 }, originalimage: { source: src, width: 400, height: 400 } };
      return new Promise(function (r) { setTimeout(function () { r(new w.Response(JSON.stringify(j), { status: 200, headers: { "Content-Type": "application/json" } })); }, 40); });
    };
  }
  function prima(regole, opz) {
    return function (w) {
      fintoWiki(w, opz);
      try { if (regole) w.localStorage.setItem("sg-ddv-regole", JSON.stringify(regole)); w.localStorage.removeItem("sg-ddv-usate"); } catch (e) {}
    };
  }
  // ---- la spia dei messaggi del broker finto ----
  if (!W.__ccDv) {
    var cc = W.__ccDv = W.creaClient;
    W.creaClient = function (nome, opts) {
      var c = cc.apply(this, arguments), pub = c.publish;
      c.publish = function (topic, payload) { if (W.__spiaDv) W.__spiaDv.push({ da: nome, topic: String(topic), p: String(payload) }); return pub.apply(this, arguments); };
      return c;
    };
  }
  function msgSpia() {
    var l = [];
    (W.__spiaDv || []).forEach(function (m) { if (!/\/stato$/.test(m.topic) || !m.p) return; var x; try { x = JSON.parse(m.p); } catch (e) { return; } var d = x && (x.data || x); if (d && d.t) l.push({ da: m.da, d: d }); });
    return l;
  }

  async function sala(amici, regole, opz) {
    W.__spiaDv = [];
    var w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true, prima: prima(regole, opz) }) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, prima: prima(null, opz) });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 15000)) no("nella Sala non sono entrati in " + (amici.length + 1));
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return (vm(C).players || []).length === amici.length + 1; }, 15000)) no("nella saletta non arrivano in " + (amici.length + 1));
    var regoleTx = await W.aspetta(function () { return A.regoleDi(W.finestra(amici[0])) || null; }, 5000) || "";
    return { S: S, C: C, w: w, regole: regoleTx };
  }
  async function comincia(C) {
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).passo === "gioca"; }, 15000)) no("la partita non comincia (" + vm(C).fase + " " + vm(C).passo + ")");
  }
  function nomeDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function nomi(C) { return (vm(C).players || []).filter(function (p) { return !p.via; }).map(function (p) { return p.nome; }); }
  // chi tiene la partita (l'host o il vice): la sua finestra e la scheda del piatto
  function chiTieneW(C) {
    var tiene = vm(C).tiene || "host", tutti = Object.keys(W.BR.tel || {});
    for (var i = 0; i < tutti.length; i++) { var w = W.finestra(tutti[i]); if (w && w.__ddvHost && w.__ddvHost.io === tiene) return w; }
    return W.finestra("Paky");
  }
  function cartaOra(C) { var w = chiTieneW(C), H = w.__ddvHost.H(); return H.carta ? w.__dadoveviene.carta(H.carta) : null; }
  function sbagliato(c, gia) { return LONTANI.filter(function (x) { return c.p.indexOf(x) < 0 && (gia || []).indexOf(x) < 0; })[0]; }
  // il capitano risponde: scrive il nome del paese (o tocca il ventaglio) e tocca «Rispondi»
  async function rispondi(w, codice, colVentaglio) {
    var inp = await W.aspetta(function () { var i = w.document.querySelector(".dd-campo .dd-input"); return i && !i.disabled ? i : null; }, 8000);
    if (!inp) no("il capitano non ha il campo libero («" + T(w).slice(0, 100) + "»)");
    var nome = w.__dadoveviene.paese(codice).n;
    if (colVentaglio) {
      inp.value = nome.slice(0, 3); inp.dispatchEvent(new w.Event("input", { bubbles: true }));
      var chip = await W.aspetta(function () { return w.document.querySelector('.dd-chip[data-c="' + codice + '"]'); }, 3000);
      if (!chip) no("scrivendo «" + nome.slice(0, 3) + "» nel ventaglio non c'è " + nome + " (" + [].map.call(w.document.querySelectorAll(".dd-chip"), function (c) { return c.textContent; }).join(", ") + ")");
      chip.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    } else { inp.value = nome; inp.dispatchEvent(new w.Event("input", { bubbles: true })); }
    var ok = await W.aspetta(function () { var b = w.document.querySelector(".dd-campo .dd-ok"); return b && !b.disabled ? b : null; }, 3000);
    if (!ok) no("«Rispondi» non si accende per " + nome);
    ok.click();
  }
  // un piatto intero di una squadra: piano = ["no", "no", "si"] (dopo l'ultimo si aspetta la fine della squadra)
  async function giocaSq(C, i, piano, durante) {
    var c = await W.aspetta(function () { return vm(C).passo === "gioca" && cartaOra(C); }, 15000); if (!c) no("non parte il piatto");
    var gia = [];
    for (var k = 0; k < piano.length; k++) {
      var v = await W.aspetta(function () { var x = vm(C); return x.passo === "gioca" && x.sq[i] && x.sq[i].n === k && x.sq[i].cap ? x : null; }, 10000);
      if (!v) no("la squadra " + i + " non arriva al tentativo " + (k + 1) + " (" + vm(C).passo + ")");
      var cap = nomeDi(C, v.sq[i].cap), wc = W.finestra(cap), cod = piano[k] === "si" ? c.p[c.p.length - 1] : sbagliato(c, gia);
      gia.push(cod);
      if (durante) await durante("prima", { k: k, cap: cap, c: c, v: v });
      await rispondi(wc, cod, k === 0);
      if (!await W.aspetta(function () { var x = vm(C); return x.passo !== "gioca" || (x.sq[i] && x.sq[i].n === k + 1); }, 8000)) no("il tentativo " + (k + 1) + " di " + cap + " non arriva");
      if (durante) await durante("dopo", { k: k, cap: cap, c: c, cod: cod });
    }
    return c;
  }
  async function aspettaSvela(C) { var v = await W.aspetta(function () { return vm(C).passo === "svela" ? vm(C) : null; }, 12000); if (!v) no("non si arriva alla scheda (" + vm(C).passo + ")"); return v; }
  async function avanti(C, nPrima) {
    var w = chiTieneW(C), b = await W.aspetta(function () { return w.document.querySelector(".dd-avanti"); }, 5000);
    if (!b) no("chi tiene la partita non ha «Prossima portata ▶»");
    b.click();
    if (!await W.aspetta(function () { var x = vm(C); return x.fase === "fine" || (x.n > nPrima && x.passo === "gioca"); }, 15000)) no("dopo «Prossima portata» non arriva il piatto dopo (" + vm(C).passo + " " + vm(C).n + ")");
  }
  // la foto sul telefono: l'immagine vera (si vede), mai un'emoji al posto della foto
  function controllaFoto(w, v) {
    var img = w.document.querySelector(".dd-foto .dd-img"), msg = w.document.querySelector(".dd-foto .dd-fmsg");
    if (!img) return "non c'è la foto";
    if (!v.foto || img.getAttribute("src").indexOf(v.foto.split("?")[0]) < 0) return "la foto non è quella del piatto (" + img.getAttribute("src") + " / " + v.foto + ")";
    if (!img.complete || !img.naturalWidth) return "la foto non si è caricata";
    if (msg && msg.style.display !== "none" && /^\W{1,3}$/.test(msg.textContent.trim())) return "al posto della foto c'è «" + msg.textContent + "»";
    return "";
  }
  // misure: lo schermo a quella grandezza non scorre e niente esce in basso. "" = tutto bene
  async function misura(nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize")); await W.dorme(450);
    var r = "", sc = d.querySelector(".dd-scena");
    if (!sc) r = "non c'è la scena";
    else if (d.documentElement.scrollHeight > alt + 1) r = "la pagina scorre (" + d.documentElement.scrollHeight + ")";
    else if (sc.scrollHeight > sc.clientHeight + 1) r = "la scena scorre (" + sc.scrollHeight + " su " + sc.clientHeight + ")";
    else {
      [].forEach.call(sc.children, function (x) { if (!r && x.offsetParent && !x.classList.contains("dd-avviso") && x.getBoundingClientRect().bottom > alt + 1) r = "«" + x.className + "» esce in basso"; });
      [].forEach.call(d.querySelectorAll(".dd-corpo button, .dd-corpo input, .dd-scheda, .dd-slot"), function (b) { var q = b.getBoundingClientRect(); if (!r && (q.bottom > alt + 1 || q.right > larg + 1)) r = "«" + (b.textContent || b.className).slice(0, 30) + "» esce"; });
      var fo = d.querySelector(".dd-foto"); if (!r && fo && fo.getBoundingClientRect().height < 80) r = "la foto è troppo piccola (" + Math.round(fo.getBoundingClientRect().height) + " px)";
    }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return r ? nome + " " + larg + "x" + alt + ": " + r : "";
  }
  async function misure(nomiL) {
    for (var i = 0; i < nomiL.length; i++) { var a = await misura(nomiL[i], 360, 640); if (a) return a; var b = await misura(nomiL[i], 412, 915); if (b) return b; }
    return "";
  }
  function rigaInCorso(w) {
    var n = w && w.document.querySelector(".saletta-schermo .sl-incorso:not(.sl-duello)"); if (!n) return null;
    return { testo: n.innerText.replace(/\s+/g, " ").trim(), tasti: [].map.call(n.querySelectorAll("button"), function (b) { return b.textContent; }) };
  }

  // ===================== dv1: le regole =====================
  COPIONE.aggiungi("dv1", { nome: "Da dove viene?: regole senza grafica, paesi, schede, riassunto, impostazioni fuori pagina", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, prima: prima(null) }), D = w.__dadoveviene;
    if (!D) no("non vedo le regole (window.__dadoveviene)");
    var ok = function (c, m) { if (!c) no(m); };
    // distanze e direzioni su coppie note
    var ro = D.km("IT", "NO"); ok(ro > 1900 && ro < 2200, "Italia→Norvegia " + Math.round(ro) + " km (circa 2.000)"); ok(D.direzione("IT", "NO") === "⬆️", "Italia→Norvegia verso nord: " + D.direzione("IT", "NO"));
    ok(D.direzione("NO", "IT") === "⬇️", "Norvegia→Italia verso sud");
    var fe = D.km("FR", "ES"); ok(fe > 700 && fe < 950, "Francia→Spagna " + Math.round(fe)); ok(D.direzione("FR", "ES") === "↙️", "Francia→Spagna ↙️: " + D.direzione("FR", "ES"));
    var nu = D.km("NO", "US"); ok(nu > 6000 && nu < 7500, "Norvegia→USA " + Math.round(nu)); ok(D.direzione("NO", "US") === "⬅️", "Norvegia→USA ⬅️: " + D.direzione("NO", "US"));
    ok(D.direzione("JP", "US") === "➡️", "Giappone→USA passando per il Pacifico ➡️: " + D.direzione("JP", "US"));
    ok(D.direzione("BR", "PT") === "↗️", "Brasile→Portogallo ↗️: " + D.direzione("BR", "PT"));
    ok(D.direzione("CN", "IN") === "↙️", "Cina→India ↙️: " + D.direzione("CN", "IN"));
    ok(D.direzione("AU", "ID") === "↖️", "Australia→Indonesia ↖️: " + D.direzione("AU", "ID"));
    ok(D.direzione("PE", "BR") === "➡️", "Perù→Brasile ➡️: " + D.direzione("PE", "BR"));
    ok(D.km("IT", "IT") === 0, "stesso paese 0 km");
    // i gradi
    ok(D.grado(300).t === "Fuoco!" && D.grado(499).e === "🔥", "sotto i 500 Fuoco"); ok(D.grado(500).t === "Caldo" && D.grado(1499).t === "Caldo", "500-1.499 Caldo");
    ok(D.grado(2999).t === "Tiepido", "Tiepido"); ok(D.grado(5999).t === "Freddo" && D.grado(6000).t === "Lontanissimo", "Freddo / Lontanissimo");
    ok(D.fmtKm(6234) === "6.200 km" && D.fmtKm(487) === "490 km" && D.fmtKm(12345) === "12.300 km", "km scritti: " + D.fmtKm(6234) + " " + D.fmtKm(487));
    // i sinonimi
    var primo = function (q) { return D.cerca(q)[0]; };
    ok(primo("USA") === "US" && primo("stati uniti") === "US" && primo("America") === "US" && primo("hawaii") === "US", "USA / Stati Uniti / America / Hawaii");
    ok(primo("Inghilterra") === "GB" && primo("scozia") === "GB" && primo("uk") === "GB", "Inghilterra/Scozia/UK → Regno Unito");
    ok(primo("Olanda") === "NL" && primo("persia") === "IR" && primo("birmania") === "MM" && primo("corea") === "KR", "Olanda, Persia, Birmania, Corea");
    ok(primo("nor") === "NO" && primo("zelanda") === "NZ" && primo("perù") === "PE" && primo("peru") === "PE" && primo("Città del Vaticano") === "VA", "nor, zelanda, perù");
    ok(D.esatto("olanda") === "NL" && D.esatto("Messico") === "MX" && D.esatto("ger") === null, "esatto");
    ok(D.cerca("ita", ["IT"]).indexOf("IT") < 0, "i paesi già provati non si propongono");
    ok(D.bandiera("IT") === "🇮🇹" && D.bandiera("NO") === "🇳🇴", "bandiere");
    // più paesi giusti, valutazione e punti
    var ps = D.carta("pisco-sour"); ok(ps && ps.p.join() === "PE,CL", "il Pisco Sour ha Perù e Cile");
    ok(D.valuta("PE", ps).ok && D.valuta("CL", ps).ok, "Perù e Cile tutti e due giusti");
    var ar = D.valuta("AR", ps); ok(!ar.ok && ar.km < 1500 && ar.gr <= 1, "Argentina per il Pisco Sour: vicino al Cile (" + ar.km + " km)");
    var no1 = D.valuta("NO", ps); ok(!no1.ok && no1.km > 9000 && no1.d === "↙️" && no1.gr === 4, "Norvegia per il Pisco Sour: " + no1.km + " " + no1.d);
    ok(D.puntiPer(1) === 3 && D.puntiPer(2) === 2 && D.puntiPer(3) === 1 && D.puntiPer(4) === 0, "punti 3/2/1");
    ok(/Perfetti/.test(D.frase(24, 24)) && /pizzeria/.test(D.frase(0, 24)), "frasi di fine");
    // l'indirizzo della foto: misura standard 500 px (640 non esiste su Wikimedia)
    var u = D.urlFoto({ thumbnail: { source: "https://thumb.wikimedia.org/a/b/X.jpg/330px-X.jpg?utm=1", width: 330 }, originalimage: { source: "https://upload.wikimedia.org/a/b/X.jpg", width: 2000 } });
    ok(u[0] === "https://thumb.wikimedia.org/a/b/X.jpg/500px-X.jpg" && u[1] === "https://thumb.wikimedia.org/a/b/X.jpg/330px-X.jpg", "foto 500 px poi 330: " + u.join(" "));
    var u2 = D.urlFoto({ thumbnail: { source: "https://t/a/Y.jpg/330px-Y.jpg", width: 330 }, originalimage: { source: "https://u/a/Y.jpg", width: 400 } });
    ok(u2[0] === "https://u/a/Y.jpg", "originale piccola: si usa quella");
    ok(!D.urlFoto({ type: "standard" }).length, "pagina senza foto: niente indirizzo");
    // le schede
    var tutte = w.SG_DDV_CARTE || [], per = {}, visti = {};
    ok(tutte.length >= 160, "solo " + tutte.length + " schede");
    tutte.forEach(function (c) {
      ["id", "m", "n", "e", "w", "i", "s", "d", "c"].forEach(function (k) { if (!c[k] || typeof c[k] !== "string") no(c.id + ": manca " + k); });
      if (visti[c.id]) no("scheda doppia " + c.id); visti[c.id] = 1;
      if (!/^[a-z\-]+:\S+$/.test(c.w)) no(c.id + ": pagina strana " + c.w);
      (c.p || []).forEach(function (p) { if (!D.paese(p)) no(c.id + ": paese che non c'è " + p); });
      per[c.m] = (per[c.m] || 0) + 1;
    });
    D.mazzi().forEach(function (m) { ok((per[m.id] || 0) >= 40, "il mazzo " + m.nome + " ha solo " + (per[m.id] || 0) + " schede"); });
    ok(D.paesi().length >= 195, "paesi: " + D.paesi().length);
    // la pesca: mai due volte lo stesso in una partita, sempre del mazzo giusto
    var us = [];
    for (var i = 0; i < 40; i++) { var id = D.pesca("dolci", us, {}); if (us.indexOf(id) >= 0) no("il piatto " + id + " è uscito due volte"); if (D.carta(id).m !== "dolci") no(id + " non è un dolce"); us.push(id); }
    ok(D.mazzoPer(["drink", "dolci"], 1) === "drink" && D.mazzoPer(["drink", "dolci"], 2) === "dolci" && D.mazzoPer(["drink", "dolci"], 3) === "drink", "i mazzi a turno");
    ok(D.mazzoPer(["drink", "dolci"], 2, 2) === "drink" && D.mazzoPer(["drink", "dolci"], 3, 2) === "dolci", "a due squadre sullo stesso telefono lo stesso mazzo per tutte e due");
    // riassunto e impostazioni col box fuori dalla pagina
    var reg = null, reg0 = w.SG.registra;
    var src = await (await fetch("/js/games/dadoveviene.js?" + Date.now())).text();
    w.SG.registra = function (x) { reg = x; }; w.eval(src); w.SG.registra = reg0;
    if (!reg) no("non riesco a leggere il gioco");
    var r0 = reg.riassunto({}); ok(r0 === "🤝 Tutti in squadra · 8 portate · 🍹🍜🍰🌮", "riassunto di partenza: " + r0);
    var r1 = reg.riassunto({ stile: "due", portate: 5, mazzi: ["dolci"] }); ok(r1 === "⚔️ Due squadre · 5 portate · 🍰", "riassunto due squadre: " + r1);
    try { w.localStorage.removeItem("sg-ddv-regole"); } catch (e) {}
    var box = w.document.createElement("div"), dove = {};
    reg.impostazioni(box, dove, { el: w.SG._util.el, sala: true, modo: "online", giocatori: ["Paky", "Luca"] });
    ok(dove.stile === "squadra" && dove.portate === 8 && dove.mazzi.join() === "drink,piatti,dolci,street", "di partenza: " + JSON.stringify(dove));
    var bott = function (re) { return [].filter.call(box.querySelectorAll("button"), function (b) { return re.test(b.textContent); })[0]; };
    bott(/Due squadre/).click(); bott(/^10 portate/).click(); bott(/Drink/).click(); bott(/Piatti/).click(); bott(/Street/).click();
    ok(dove.stile === "due" && dove.portate === 10 && dove.mazzi.join() === "dolci", "scelte: " + JSON.stringify(dove));
    bott(/Dolci/).click(); ok(dove.mazzi.join() === "dolci", "almeno un mazzo resta");
    ok(/Dolci \(\d+\)/.test(box.textContent), "il numero di schede del mazzo");
    var salv = JSON.parse(w.localStorage.getItem("sg-ddv-regole") || "{}"); ok(salv.portate === 10 && salv.stile === "due", "le scelte non si salvano");
    try { w.localStorage.removeItem("sg-ddv-regole"); } catch (e) {}
    errori();
    return "distanze e frecce, gradi, sinonimi, più paesi giusti, punti, foto a 500 px, " + tutte.length + " schede (" + JSON.stringify(per) + "), " + D.paesi().length + " paesi, riassunti e impostazioni ok";
  } });

  // ===================== dv2: online nella Sala in 4, tutti in squadra =====================
  COPIONE.aggiungi("dv2", { nome: "Da dove viene? online in 4 nella Sala, tutti in squadra: 1°, 3°, mai, chi arriva tardi, chi ricarica, classifica, misure", fai: async function () {
    var Z = await sala(["Giulia", "Luca", "Sara"], { stile: "squadra", portate: 5, mazzi: ["drink", "piatti", "dolci", "street"] }), C = Z.C, S = Z.S, note = [], mis = "", caps = [];
    if (!/Tutti in squadra · 5 portate/.test(Z.regole)) no("Giulia non legge le regole («" + Z.regole + "»)");
    await comincia(C);
    // 1: giusto al primo tentativo, scelto dal ventaglio; i compagni vedono cosa scrive il capitano
    var v1 = vm(C); caps.push(nomeDi(C, v1.sq[0].cap));
    var fo = controllaFoto(W.finestra("Giulia"), v1) || controllaFoto(W.finestra("Paky"), v1);
    if (fo && /non si è caricata/.test(fo)) { await W.dorme(800); fo = controllaFoto(W.finestra("Giulia"), v1); }
    if (fo) no("foto: " + fo);
    if (!/🧂/.test(T(W.finestra("Sara")))) no("Sara non vede gli ingredienti");
    var c1 = await giocaSq(C, 0, ["si"], async function (f, o) {
      if (f !== "prima") return;
      var altro = nomi(C).filter(function (n) { return n !== o.cap; })[0], wc = W.finestra(o.cap);
      var inp = await W.aspetta(function () { return wc.document.querySelector(".dd-campo .dd-input"); }, 5000); if (!inp) no(o.cap + " (capitano) non ha il campo");
      inp.value = "Nor"; inp.dispatchEvent(new wc.Event("input", { bubbles: true }));
      if (!await W.aspetta(function () { return /scrive «Nor»/.test(T(W.finestra(altro))); }, 4000)) no(altro + " non vede cosa scrive il capitano («" + (W.finestra(altro).document.querySelector(".dd-bozza") || {}).textContent + "»)");
      wc.document.querySelector('.dd-chip[data-c="NO"]').dispatchEvent(new wc.PointerEvent("pointerdown", { bubbles: true }));
      if (!await W.aspetta(function () { return /propone 🇳🇴 Norvegia/.test(T(W.finestra(altro))); }, 4000)) no(altro + " non vede la proposta del capitano");
      if (W.finestra(altro).document.querySelector(".dd-campo")) no(altro + " (non capitano) ha il campo della risposta");
      mis = mis || await misure([o.cap, altro]);
      note.push("i compagni vedono cosa scrive il capitano");
    });
    var s1 = await aspettaSvela(C);
    if (s1.sq[0].pz !== 3 || !s1.sq[0].giusto) no("giusto al primo: punti " + s1.sq[0].pz);
    if (!await W.aspetta(function () { return /💡/.test(T(W.finestra("Luca"))) && T(W.finestra("Luca")).indexOf(W.finestra("Luca").__dadoveviene.paese(c1.p[0]).n) >= 0; }, 4000)) no("Luca non vede la scheda col paese");
    mis = mis || await misure(["Luca"]);
    note.push("1° " + c1.id + " +3");
    // 2: giusto al terzo: gli indizi arrivano uno alla volta, km e freccia; intanto Marco arriva e tocca «▶ Entra»
    await avanti(C, 1);
    var idM = null;
    caps.push(nomeDi(C, vm(C).sq[0].cap));
    var c2 = await giocaSq(C, 0, ["no", "no", "si"], async function (f, o) {
      var wL = W.finestra("Luca");
      if (f === "prima" && o.k === 0) {
        if (wL.document.querySelector(".dd-ind.p.su")) no("la preparazione si vede prima del primo errore");
        var M = await W.apriTel("Marco", { hash: "sala=" + S, x: 740, salaSempre: true, prima: prima(null) });
        var r = await W.aspetta(function () { var x = rigaInCorso(M); return x && x.tasti.length ? x : null; }, 10000);
        if (!r || !/Entra · giochi dal prossimo turno/.test(r.tasti[0] || "")) no("Marco non ha «▶ Entra · giochi dal prossimo turno» (" + JSON.stringify(r) + ")");
        W.clicca(M, /Entra · giochi/, ".sl-incorso button");
        idM = A.idInSala(S, "Marco");
        if (!await W.aspetta(function () { return (vm(C).prossimi || []).some(function (x) { return x.id === idM; }); }, 8000)) no("Marco non è tra i prossimi");
        if ((vm(C).players || []).some(function (x) { return x.id === idM; })) no("Marco è entrato a metà piatto");
      }
      if (f === "dopo" && o.k === 0) {
        if (!await W.aspetta(function () { var p = wL.document.querySelector(".dd-ind.p.su"); return p && p.textContent.indexOf(o.c.s.slice(0, 20)) >= 0; }, 4000)) no("dopo il primo errore Luca non vede come si prepara");
        if (wL.document.querySelector(".dd-ind.n.su")) no("il nome si vede già dopo un errore");
        var sl = wL.document.querySelector(".dd-tent .dd-slot.no"); if (!sl || !/km [⬆↗➡↘⬇↙⬅↖]/.test(sl.textContent)) no("il tentativo sbagliato non ha km e freccia («" + (sl && sl.textContent) + "»)");
        var dato = wL.__dadoveviene.valuta(o.cod, o.c);
        if (sl.textContent.indexOf(wL.__dadoveviene.fmtKm(dato.km)) < 0 || sl.textContent.indexOf(dato.d) < 0) no("km o freccia sbagliati: «" + sl.textContent + "» invece di " + wL.__dadoveviene.fmtKm(dato.km) + " " + dato.d);
        mis = mis || await misure(["Luca"]);
      }
      if (f === "dopo" && o.k === 1) {
        if (!await W.aspetta(function () { var p = wL.document.querySelector(".dd-ind.n.su"); return p && p.textContent.indexOf(o.c.n) >= 0; }, 4000)) no("dopo il secondo errore Luca non vede il nome «" + o.c.n + "»");
        await W.ricarica("Giulia");
        if (!await W.aspetta(function () { var g = W.finestra("Giulia"); return g.document.querySelector(".dd-scena") && /Si chiama/.test(T(g)); }, 12000)) no("Giulia ricarica e non torna al piatto con gli indizi («" + T(W.finestra("Giulia")).slice(0, 80) + "»)");
        note.push("Giulia ricarica e ritrova il piatto");
      }
    });
    var s2 = await aspettaSvela(C);
    if (s2.sq[0].pz !== 1 || s2.sq[0].tent.length !== 3) no("giusto al terzo: punti " + s2.sq[0].pz);
    note.push("3° " + c2.id + " +1");
    // 3: mai giusto (entra Marco)
    await avanti(C, 2);
    var pM = (vm(C).players || []).filter(function (x) { return x.id === idM; })[0];
    if (!pM || pM.via) no("al piatto 3 Marco non è entrato");
    caps.push(nomeDi(C, vm(C).sq[0].cap));
    await giocaSq(C, 0, ["no", "no", "no"]);
    var s3 = await aspettaSvela(C);
    if (s3.sq[0].pz !== 0 || s3.sq[0].giusto) no("mai giusto: punti " + s3.sq[0].pz);
    if (!await W.aspetta(function () { return /era l'ultimo|💡/.test(T(W.finestra("Sara"))); }, 3000)) no("dopo il terzo errore non si vede la scheda");
    note.push("mai giusto 0, Marco dentro");
    // 4 e 5: giusto al secondo, giusto al primo
    await avanti(C, 3); caps.push(nomeDi(C, vm(C).sq[0].cap)); await giocaSq(C, 0, ["no", "si"]); await aspettaSvela(C);
    await avanti(C, 4); caps.push(nomeDi(C, vm(C).sq[0].cap)); await giocaSq(C, 0, ["si"]); await aspettaSvela(C);
    var dist = caps.filter(function (x, i) { return caps.indexOf(x) === i; }).length;
    if (dist < 4) no("i capitani non girano: " + caps.join(", "));
    await avanti(C, 5);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 10000)) no("dopo 5 portate la partita non finisce");
    var cl = vm(C).classifica || [];
    if (cl.length !== 5 || cl.some(function (r) { return r.pos !== 1 || r.punti !== 9; })) no("classifica: " + JSON.stringify(cl));
    if (!await W.aspetta(function () { return A.tastiFineDi(W.finestra("Paky")) && A.tastiFineDi(W.finestra("Giulia")); }, 6000)) no("a fine partita mancano i tasti del core");
    if (A.tastiFineDi(W.finestra("Paky")).join(" | ") !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + A.tastiFineDi(W.finestra("Paky")).join(" | ") + "»");
    if (!/9 punti su 15/.test(T(W.finestra("Sara")))) no("la fine non dice «9 punti su 15» («" + T(W.finestra("Sara")).slice(0, 80) + "»)");
    if (W.finestra("Sara").document.querySelectorAll(".dd-fila .dd-pt").length !== 5) no("manca la fila delle 5 portate");
    if (mis) no("misure: " + mis);
    errori();
    return note.join(" · ") + " · capitani " + caps.join(", ") + " · classifica 9 su 15 tutti primi · misure ok";
  } });

  // ===================== dv3: online in 4, due squadre =====================
  COPIONE.aggiungi("dv3", { nome: "Da dove viene? online in 4, due squadre: tentativi segreti fino alla scheda, punti, classifica", fai: async function () {
    var Z = await sala(["Giulia", "Luca", "Sara"], { stile: "due", portate: 5, mazzi: ["drink", "piatti", "dolci", "street"] }), C = Z.C, mis = "", note = [];
    if (!/Due squadre · 5 portate/.test(Z.regole)) no("le regole dicono «" + Z.regole + "»");
    var pl = vm(C).players || [], a = pl.filter(function (p) { return p.sq === "A"; }).length, b = pl.filter(function (p) { return p.sq === "B"; }).length;
    if (a !== 2 || b !== 2) no("in saletta le squadre non sono 2 e 2 (" + a + "/" + b + ")");
    if (!/🔴 Rossi/.test(T(W.finestra("Luca"))) || !/🔵 Blu/.test(T(W.finestra("Luca")))) no("Luca non vede le squadre in saletta");
    await comincia(C);
    var piani = [[["si"], ["no", "no", "si"]], [["no", "si"], ["si"]], [["no", "no", "no"], ["no", "si"]], [["si"], ["si"]], [["no", "si"], ["no", "no", "no"]]];
    var attesi = [0, 0];
    for (var n = 1; n <= 5; n++) {
      var P = piani[n - 1];
      // le due squadre giocano insieme: un tentativo alla volta per squadra
      var c = await W.aspetta(function () { return vm(C).passo === "gioca" && vm(C).n === n && cartaOra(C); }, 15000); if (!c) no("non parte il piatto " + n);
      var gia = [[], []];
      for (var k = 0; k < 3; k++) for (var i = 0; i < 2; i++) {
        if (k >= P[i].length) continue;
        var v = await W.aspetta(function () { var x = vm(C); return x.passo === "gioca" && x.sq[i].n === k ? x : null; }, 10000);
        if (!v) no("piatto " + n + ": la squadra " + i + " non arriva al tentativo " + (k + 1) + " (" + vm(C).passo + ")");
        var cap = nomeDi(C, v.sq[i].cap), cod = P[i][k] === "si" ? c.p[0] : (function () { var x = sbagliato(c, gia[i]); gia[i].push(x); return x; })();
        if (n === 1 && k === 0 && i === 0) {
          mis = mis || await misure([cap]);
          var comp = nomi(C).filter(function (m) { var p = pl.filter(function (q) { return q.nome === m; })[0]; return m !== cap && p && p.sq === (pl.filter(function (q) { return q.nome === cap; })[0] || {}).sq; })[0];
          if (comp) mis = mis || await misure([comp]);
        }
        await rispondi(W.finestra(cap), cod, k === 0);
        if (!await W.aspetta(function () { var x = vm(C); return x.passo !== "gioca" || x.sq[i].n === k + 1; }, 8000)) no("piatto " + n + ": il tentativo di " + cap + " non arriva");
        // i compagni di squadra vedono il loro tentativo (arriva a parte), l'altra squadra no
        if (n === 2 && k === 0 && i === 0 && vm(C).passo === "gioca") {
          var capPl = pl.filter(function (q) { return q.nome === cap; })[0], amicoSq = pl.filter(function (q) { return q.sq === capPl.sq && q.nome !== cap; })[0], altroSq = pl.filter(function (q) { return q.sq !== capPl.sq; })[0];
          var wA = W.finestra(amicoSq.nome), wB = W.finestra(altroSq.nome), nomeP = wA.__dadoveviene.paese(cod).n;
          if (!await W.aspetta(function () { return [].some.call(wA.document.querySelectorAll(".dd-tent .dd-slot"), function (s) { return s.textContent.indexOf(nomeP) >= 0; }); }, 4000)) no(amicoSq.nome + " non vede il tentativo della sua squadra (" + nomeP + ")");
          if ([].some.call(wB.document.querySelectorAll(".dd-tent .dd-slot"), function (s) { return s.textContent.indexOf(nomeP) >= 0; })) no(altroSq.nome + " vede il tentativo dell'altra squadra");
          if (!/1 tentativo/.test((wB.document.querySelector(".dd-altre") || {}).textContent || "")) no(altroSq.nome + " non vede quanti tentativi ha fatto l'altra squadra");
          note.push("tentativi visibili solo alla propria squadra");
        }
      }
      var sv = await aspettaSvela(C);
      [0, 1].forEach(function (i) { var giu = P[i].indexOf("si"); attesi[i] += giu >= 0 ? 3 - giu : 0; if (sv.sq[i].punti !== attesi[i]) no("piatto " + n + ": la squadra " + i + " ha " + sv.sq[i].punti + " punti invece di " + attesi[i]); });
      if (n === 1) { if (!await W.aspetta(function () { return W.finestra("Sara").document.querySelectorAll(".dd-tent.con-nome").length === 2; }, 4000)) no("sulla scheda non ci sono i tentativi delle due squadre"); mis = mis || await misure(["Sara"]); }
      await avanti(C, n);
    }
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 10000)) no("la partita non finisce");
    var cl = vm(C).classifica || [], vince = attesi[0] > attesi[1] ? "A" : "B";
    cl.forEach(function (r) { var att = attesi[0] === attesi[1] ? 1 : r.sq === vince ? 1 : 2; if (r.pos !== att) no(r.nome + " (" + r.sq + ") al posto " + r.pos + " invece di " + att); });
    if (!await W.aspetta(function () { return /Vincono i (Rossi|Blu)!|Pareggio!/.test(T(W.finestra("Luca"))); }, 6000)) no("la fine non dice chi vince («" + T(W.finestra("Luca")).slice(0, 100) + "»)");
    // i segreti: nella foto per tutti mai i tentativi mentre si gioca, i messaggi «sq» e «bz» sempre con «to»
    var male = [];
    msgSpia().forEach(function (m) {
      var d = m.d;
      if ((d.t === "sq" || d.t === "bz") && !d.to) male.push(d.t + " senza «to»");
      if (d.t === "vm" && d.vm && d.vm.fase === "gioco" && d.vm.passo === "gioca") (d.vm.sq || []).forEach(function (s) { if (s.tent || s.prep || s.nome) male.push("nella foto per tutti i tentativi o gli indizi di una squadra"); });
    });
    if (male.length) no(male.slice(0, 3).join(" | "));
    if (mis) no("misure: " + mis);
    errori();
    return note.join(" · ") + " · punti 🔴 " + attesi[0] + " – 🔵 " + attesi[1] + " · classifica giusta · segreti con «to» · misure ok";
  } });

  // ===================== dv4: la ripresa e la riserva =====================
  COPIONE.aggiungi("dv4", { nome: "Da dove viene?: l'host ricarica (a metà piatto, sulla scheda), poi si spegne e un amico porta avanti la partita", fai: async function () {
    var Z = await sala(["Giulia", "Luca", "Sara"], { stile: "squadra", portate: 5, mazzi: ["drink", "dolci"] }), C = Z.C, note = [];
    await comincia(C);
    // piatto 1: un errore, poi l'host ricarica: il tentativo resta, nessuno torna in saletta
    var c1 = await giocaSq(C, 0, ["no"]);
    var rip0 = vm(C).rip || 0;
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" && (x.rip || 0) > rip0 && x.passo === "gioca"; }, 15000)) no("dopo la ricarica dell'host il piatto non riprende (" + vm(C).fase + " " + vm(C).passo + ")");
    if (vm(C).sq[0].n !== 1 || cartaOra(C).id !== c1.id) no("dopo la ricarica il tentativo o il piatto sono cambiati");
    if (["Giulia", "Luca", "Sara"].some(function (n) { return W.finestra(n).document.querySelector(".saletta-schermo"); })) no("qualcuno è tornato in saletta");
    if (!await W.aspetta(function () { return W.finestra("Paky").document.querySelector(".dd-scena .dd-img.su"); }, 8000)) no("l'host ricaricato non vede la foto");
    note.push("ricarica a metà piatto: tentativo tenuto");
    // si finisce il piatto (il capitano può essere chiunque): giusto al secondo
    var v = await W.aspetta(function () { var x = vm(C); return x.sq[0].cap && x.passo === "gioca" ? x : null; }, 15000);
    await rispondi(W.finestra(nomeDi(C, v.sq[0].cap)), c1.p[0], false);
    var s1 = await aspettaSvela(C); var p1 = s1.sq[0].punti;
    if (p1 !== 2) no("giusto al secondo dopo la ricarica: " + p1 + " punti");
    // sulla scheda l'host ricarica: niente punti doppi
    rip0 = vm(C).rip || 0;
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var x = vm(C); return (x.rip || 0) > rip0 && x.passo === "svela"; }, 15000)) no("la ricarica sulla scheda non riprende sulla scheda (" + vm(C).passo + ")");
    if (vm(C).sq[0].punti !== p1) no("dopo la ricarica sulla scheda i punti cambiano: " + p1 + " → " + vm(C).sq[0].punti);
    note.push("ricarica sulla scheda: punti uguali");
    await avanti(C, 1);
    // piatto 2: l'host si spegne mentre si gioca → un amico porta avanti la partita
    await W.aspetta(function () { return vm(C).passo === "gioca" && vm(C).n === 2; }, 15000);
    var punti0 = vm(C).sq[0].punti;
    W.congela("Paky"); W.spegni("Paky");
    var tiene = await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._h && s._h !== "host" ? s._h : null; }, 25000);
    if (!tiene) no("dopo che l'host si spegne nessun amico tiene la partita");
    var chi = ["Giulia", "Luca", "Sara"].filter(function (n) { return A.mioId(n) === tiene; })[0] || tiene;
    note.push("l'host si spegne: la tiene " + chi);
    var fino = Date.now() + 150000, piatti = 0;
    while (Date.now() < fino && vm(C).fase === "gioco") {
      var x = vm(C);
      if (x.passo === "gioca" && x.sq[0].cap && !x.sq[0].fatto) {
        var nm = nomeDi(C, x.sq[0].cap);
        if (nm === "Paky") { await W.dorme(500); continue; }
        var cc = cartaOra(C); if (cc) { try { await rispondi(W.finestra(nm), cc.p[0], false); } catch (e) {} }
        await W.aspetta(function () { return vm(C).passo !== "gioca"; }, 6000);
      } else if (x.passo === "svela") { piatti++; var wv = chiTieneW(C), bt = wv.document.querySelector(".dd-avanti"); if (bt) bt.click(); await W.aspetta(function () { return vm(C).passo !== "svela"; }, 6000); }
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("la partita tenuta dall'amico non arriva alla classifica (" + vm(C).passo + " " + vm(C).n + ")");
    var cl = vm(C).classifica || [];
    if (!cl.length || cl[0].punti < punti0) no("col cambio di host si sono persi punti (" + punti0 + " → " + (cl[0] && cl[0].punti) + ")");
    errori();
    return note.join(" · ") + " · classifica " + (cl[0] && cl[0].punti) + " punti";
  } });

  // ===================== sullo stesso telefono =====================
  async function locale(regole, nomiL, opz, tel) {
    var P = await W.apriTel(tel || "Paky", { x: tel ? 560 : 0, prima: prima(regole, opz) });
    var tess = await W.aspetta(function () { return A.tessera(P, NOME); }, 5000); if (!tess) no("in home non c'è «" + NOME + "»");
    tess.click();
    if (!await W.aspetta(function () { return W.clicca(P, /Su questo telefono/, ".modo-grande"); }, 3000)) no("in «Come giocate?» non c'è «Su questo telefono»");
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sala-riga input").length; }, 3000)) no("non c'è la lista di chi gioca");
    while (P.document.querySelectorAll(".sala-riga input").length < nomiL.length) { if (!W.clicca(P, /Aggiungi giocatore/)) no("non c'è «＋ Aggiungi giocatore»"); await W.dorme(100); }
    var c = P.document.querySelectorAll(".sala-riga input");
    nomiL.forEach(function (n, i) { c[i].value = n; c[i].dispatchEvent(new P.Event("input", { bubbles: true })); });
    while (P.document.querySelectorAll(".sala-riga input").length > nomiL.length) { P.document.querySelectorAll(".sala-riga .togli")[nomiL.length].click(); await W.dorme(100); }
    if (!W.clicca(P, /Avanti/, ".piede button")) no("non c'è «Avanti ▶»");
    if (!await W.aspetta(function () { return W.clicca(P, /^Comincia/, ".piede button"); }, 3000)) no("non c'è «Comincia ▶»");
    return P;
  }
  // un piatto sullo stesso telefono: la scheda di questo piatto si legge dalla foto (?c=id)
  function cartaLoc(P) { var img = P.document.querySelector(".dd-foto .dd-img"), m = img && /[#?&]c=([^&]+)/.exec(img.getAttribute("src") || ""); return m ? P.__dadoveviene.carta(decodeURIComponent(m[1])) : null; }
  async function piattoLoc(P, piano) {
    var c = await W.aspetta(function () { return P.document.querySelector(".dd-campo .dd-input") && cartaLoc(P); }, 12000); if (!c) no("non parte il piatto («" + T(P).slice(0, 80) + "»)");
    var gia = [];
    for (var k = 0; k < piano.length; k++) {
      var cod = piano[k] === "si" ? c.p[0] : sbagliato(c, gia); gia.push(cod);
      await rispondi(P, cod, k === 0);
      await W.dorme(250);
    }
    var b = await W.aspetta(function () { return P.document.querySelector(".dd-avanti"); }, 6000);
    if (!b) no("dopo il piatto non c'è la scheda con «Prossima portata»");
    return c;
  }
  // ===================== dv5: stesso telefono, in squadra =====================
  COPIONE.aggiungi("dv5", { nome: "Da dove viene? sullo stesso telefono, tutti in squadra: 5 portate fino alla classifica", fai: async function () {
    var P = await locale({ stile: "squadra", portate: 5, mazzi: ["piatti", "street"] }, ["Paky", "Giulia", "Luca"]), mis = "", pt = 0;
    var piani = [["si"], ["no", "si"], ["no", "no", "si"], ["no", "no", "no"], ["si"]];
    for (var n = 0; n < 5; n++) {
      var c = await piattoLoc(P, piani[n]);
      var giu = piani[n].indexOf("si"); pt += giu >= 0 ? 3 - giu : 0;
      if (!/💡/.test(T(P))) no("sulla scheda manca la curiosità");
      if ((P.document.querySelector(".dd-tab") || {}).textContent !== "⭐ " + pt) no("dopo il piatto " + (n + 1) + " i punti sono «" + (P.document.querySelector(".dd-tab") || {}).textContent + "» invece di ⭐ " + pt);
      if (n === 1) mis = mis || await misura("Paky", 360, 640) || await misura("Paky", 412, 915);
      W.clicca(P, /Prossima portata|Classifica/, ".dd-avanti");
      await W.dorme(300);
    }
    if (!await W.aspetta(function () { return /9 punti su 15/.test(T(P)); }, 6000)) no("alla fine non c'è «9 punti su 15» («" + T(P).slice(0, 100) + "»)");
    if (P.document.querySelectorAll(".dd-fila .dd-pt").length !== 5) no("manca la fila delle portate");
    if (!W.clicca(P, /Fine partita/)) no("non c'è «Fine partita ▶»");
    if (!await W.aspetta(function () { return P.document.querySelector(".classifica"); }, 4000)) no("non c'è la classifica del core");
    if (mis) no("misure: " + mis);
    errori();
    return "5 portate (1°, 2°, 3°, mai, 1°) = 9 su 15, punti in alto giusti, classifica del core, misure ok";
  } });
  // ===================== dv6: stesso telefono, due squadre a turno =====================
  COPIONE.aggiungi("dv6", { nome: "Da dove viene? sullo stesso telefono, due squadre in 3: a turno, 6 piatti per 5 portate", fai: async function () {
    var P = await locale({ stile: "due", portate: 5, mazzi: ["dolci", "drink"] }, ["Paky", "Giulia", "Luca"]), turni = [], mis = "";
    var piani = [["si"], ["no", "si"], ["si"], ["no", "no", "no"], ["no", "no", "si"], ["si"]];
    for (var n = 0; n < 6; n++) {
      await W.aspetta(function () { return P.document.querySelector(".dd-campo .dd-input"); }, 12000);
      var info = (P.document.querySelector(".dd-info") || {}).textContent || "";
      turni.push(/Rossi/.test(info) ? "🔴" : /Blu/.test(info) ? "🔵" : "?");
      await piattoLoc(P, piani[n]);
      if (n === 0) mis = await misura("Paky", 360, 640) || await misura("Paky", 412, 915);
      W.clicca(P, /Prossima portata|Classifica/, ".dd-avanti");
      await W.dorme(300);
    }
    if (turni.join("") !== "🔴🔵🔴🔵🔴🔵") no("i turni delle squadre: " + turni.join(""));
    // 🔴: 3 + 3 + 1 = 7, 🔵: 2 + 0 + 3 = 5
    if (!await W.aspetta(function () { return /Vincono i Rossi!/.test(T(P)) && /🔴 7 – 🔵 5/.test(T(P)); }, 6000)) no("la fine non dice «Vincono i Rossi! 🔴 7 – 🔵 5» («" + T(P).slice(0, 120) + "»)");
    W.clicca(P, /Fine partita/);
    if (!await W.aspetta(function () { return P.document.querySelector(".classifica"); }, 4000)) no("non c'è la classifica del core");
    var righe = [].map.call(P.document.querySelectorAll(".classifica li"), function (li) { return li.textContent.replace(/\s+/g, " "); }), cl = righe.join(" | ");
    if (righe.length !== 3 || !/Giulia/.test(righe[2]) || /Giulia/.test(righe[0] + righe[1])) no("classifica: " + cl);
    if (mis) no("misure: " + mis);
    errori();
    return "turni " + turni.join("") + ", 🔴 7 – 🔵 5 (Paky e Luca contro Giulia), classifica del core, misure ok";
  } });

  // ===================== dv7: le foto che non si caricano =====================
  COPIONE.aggiungi("dv7", { nome: "Da dove viene?: foto rotta → altro piatto dello stesso mazzo; nessuna foto → «📶 Le foto non arrivano» e «Riprova»", fai: async function () {
    // metà dei drink con la foto rotta: l'host li salta senza farli vedere
    var tutte = (await (async function () { var w0 = await W.apriTel("Prova", { x: 0, prima: prima(null) }); var l = w0.SG_DDV_CARTE.filter(function (c) { return c.m === "drink"; }).map(function (c) { return c.id; }); document.getElementById("tel-Prova").remove(); return l; })());
    var rotte = tutte.filter(function (x, i) { return i % 2 === 0; });
    var Z = await sala(["Giulia", "Luca"], { stile: "squadra", portate: 5, mazzi: ["drink"] }, { rotte: rotte }), C = Z.C, note = [];
    await comincia(C);
    var visti = [];
    var P = W.finestra("Paky");
    for (var n = 1; n <= 2; n++) {
      // (dal secondo piatto non arriva più nessuna foto: la portata dopo non si potrà caricare)
      if (n === 2) { await W.aspetta(function () { return vm(C).passo === "gioca" && vm(C).n === 2; }, 15000); P.__ddvTutteRotte = true; }
      var c = await giocaSq(C, 0, ["si"]);
      if (rotte.indexOf(c.id) >= 0) no("è uscito un piatto con la foto rotta: " + c.id);
      if (c.m !== "drink") no("il piatto non è del mazzo giusto");
      visti.push(c.id);
      await aspettaSvela(C);
      if (n < 2) await avanti(C, n);
    }
    var fotoPer = msgSpia().filter(function (m) { return m.d.t === "vm" && m.d.vm && m.d.vm.foto; }).map(function (m) { return m.d.vm.foto; });
    if (fotoPer.some(function (u) { return /\/manca\//.test(u); })) no("una foto rotta è arrivata agli amici");
    var chieste = (W.finestra("Paky").__ddvChieste || []).filter(function (id) { return rotte.indexOf(id) >= 0; });
    note.push("saltati " + chieste.length + " drink con la foto rotta, giocati " + visti.join(", "));
    // ora non arriva più nessuna foto: «📶 Le foto non arrivano», poi la rete torna e «↻ Riprova» riparte
    var bAv = await W.aspetta(function () { return P.document.querySelector(".dd-avanti"); }, 5000); if (!bAv) no("non c'è «Prossima portata»");
    bAv.click();
    if (!await W.aspetta(function () { return vm(C).passo === "nofoto"; }, 20000)) no("senza foto non si arriva a «Le foto non arrivano» (" + vm(C).passo + ")");
    if (!/Le foto non arrivano/.test(T(W.finestra("Giulia")))) no("Giulia non legge «📶 Le foto non arrivano»");
    if (!P.document.querySelector(".dd-riprova")) no("l'host non ha «↻ Riprova»");
    if (/🍹|🍜|🍰|🌮/.test((W.finestra("Giulia").document.querySelector(".dd-foto") || {}).textContent || "")) no("al posto della foto c'è un'emoji");
    var mis = await misure(["Giulia"]); if (mis) no("misure: " + mis);
    P.__ddvTutteRotte = false; P.__ddvRotte = [];
    P.document.querySelector(".dd-riprova").click();
    if (!await W.aspetta(function () { return vm(C).passo === "gioca" && vm(C).n === 3 && vm(C).foto && !/manca/.test(vm(C).foto); }, 15000)) no("dopo «Riprova» il piatto non arriva (" + vm(C).passo + ")");
    note.push("«📶 Le foto non arrivano» + «Riprova» ok");
    // sullo stesso telefono: tutte rotte → la scritta e «Riprova»
    var L = await locale({ stile: "squadra", portate: 5, mazzi: ["dolci"] }, ["Nina"], { tutteRotte: true }, "Nina");
    if (!await W.aspetta(function () { return /Le foto dei piatti non arrivano/.test(T(L)) && L.document.querySelector(".dd-riprova"); }, 20000)) no("sullo stesso telefono senza foto non c'è «📶 Le foto non arrivano» con «Riprova» («" + T(L).slice(0, 100) + "»)");
    L.__ddvTutteRotte = false;
    L.document.querySelector(".dd-riprova").click();
    if (!await W.aspetta(function () { return L.document.querySelector(".dd-campo .dd-input") && cartaLoc(L); }, 12000)) no("sullo stesso telefono dopo «Riprova» non parte il piatto");
    note.push("stesso telefono: «Riprova» ok");
    errori();
    return note.join(" · ");
  } });
  // ===================== dv8: il tempo del tentativo =====================
  COPIONE.aggiungi("dv8", { nome: "Da dove viene?: a tempo scaduto vale il paese scelto dal capitano, se no il tentativo è perso", fai: async function () {
    W.__spiaDv = [];
    var corto = function (w) { prima({ stile: "squadra", portate: 5, mazzi: ["piatti"] })(w); w.__ddvTempi = { primo: 4, altri: 4 }; };
    await W.apriTel("Paky", { x: 0, salaSempre: true, prima: corto });
    var S = await A.apriSalaNuova("Paky");
    await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true, prima: prima(null) });
    await W.apriTel("Luca", { hash: "sala=" + S, x: 370, salaSempre: true, prima: prima(null) });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 3; }, 15000)) no("nella Sala non sono in 3");
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 15000)) no("nella saletta non sono in 3");
    await comincia(C);
    var c = cartaOra(C), v = vm(C), cap = nomeDi(C, v.sq[0].cap), wc = W.finestra(cap), sb = sbagliato(c, []), nome = wc.__dadoveviene.paese(sb).n;
    // il capitano sceglie dal ventaglio ma non tocca «Rispondi»: a tempo scaduto vale lui
    var inp = await W.aspetta(function () { return wc.document.querySelector(".dd-campo .dd-input"); }, 5000); if (!inp) no(cap + " non ha il campo");
    inp.value = nome.slice(0, 3); inp.dispatchEvent(new wc.Event("input", { bubbles: true }));
    var chip = await W.aspetta(function () { return wc.document.querySelector('.dd-chip[data-c="' + sb + '"]'); }, 3000); if (!chip) no("non c'è " + nome + " nel ventaglio");
    chip.dispatchEvent(new wc.PointerEvent("pointerdown", { bubbles: true }));
    if (!await W.aspetta(function () { return vm(C).sq[0].n === 1; }, 12000)) no("a tempo scaduto il tentativo non parte");
    var t1 = (vm(C).sq[0].tent || [])[0] || {};
    if (t1.c !== sb || t1.tempo) no("a tempo scaduto non vale il paese scelto (" + JSON.stringify(t1) + ")");
    // poi nessuno sceglie niente: il tentativo è perso
    if (!await W.aspetta(function () { return vm(C).sq[0].n === 2; }, 10000)) no("il secondo tentativo non scade");
    var t2 = (vm(C).sq[0].tent || [])[1] || {};
    if (!t2.tempo || t2.c) no("senza scelta il tentativo non è «tempo scaduto» (" + JSON.stringify(t2) + ")");
    if (!await W.aspetta(function () { return /⏱ Tempo!/.test(T(W.finestra("Giulia"))); }, 4000)) no("Giulia non vede «⏱ Tempo!»");
    if (!await W.aspetta(function () { var p = W.finestra("Luca").document.querySelector(".dd-ind.n.su"); return p && p.textContent.indexOf(c.n) >= 0; }, 4000)) no("dopo due tentativi persi non si vede il nome");
    var cap3 = nomeDi(C, vm(C).sq[0].cap);
    await rispondi(W.finestra(cap3), c.p[0], false);
    var s1 = await aspettaSvela(C);
    if (s1.sq[0].pz !== 1) no("giusto al terzo: " + s1.sq[0].pz + " punti");
    errori();
    return "scelto e non confermato: vale (" + nome + ") · niente scelto: ⏱ tentativo perso · poi il nome · giusto al 3° +1";
  } });
  // (gli aiuti, per altri file di prova o per le foto dello schermo)
  COPIONE.ddv = { prima: prima, fintoWiki: fintoWiki, sala: sala, comincia: comincia, rispondi: rispondi, cartaOra: cartaOra, giocaSq: giocaSq, misura: misura, avanti: avanti };
})();
