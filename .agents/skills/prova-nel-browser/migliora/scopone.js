// PROVE "SCOPONE ONLINE IN 4" (miglioramenti dai confronti con gli originali, 15 ott 2026).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/scopone.js"); await COPIONE.prova("sp1")
//
// Lo Scopone non è ancora in GIOCHI_ONLINE (core.js): per l'online i telefoni finti con opz.scoponeOnline registrano
// lo Scopone al posto della Scopa 2 vs 2 (id "scopa2v2", nome «Scopone (prova)»), come passo2/modello.js fa col modello.
// Quando chi unisce aggiunge `scopone: 1` a GIOCHI_ONLINE, le stesse prove valgono con COME = "scopone" e NOME = "Scopone".
//
// sp1 Contro i Bot (stesso telefono): «Contro i Bot», ⚙️ una mano e Napola accesa, mano intera fino al riepilogo con la
//     riga della Napola, «🔄 Nuova partita»; misure 360x640 e 412x915 senza scorrere.
// sp2 Online (stanza di un gioco solo): Paky apre, Giulia e Luca entrano dal link; saletta con le coppie («🟢 tu + …»),
//     «🔀 Cambia compagno»; ognuno vede SOLO le sue carte; Luca ricarica a metà e ritrova le sue carte; Marco arriva a
//     partita cominciata e guarda (le carte di un giocatore, 🔄 per cambiare; niente «Tocca a te»); riepilogo con
//     «⏩ Avanti»: 2 su 3 = si riparte subito; Giulia spegne il telefono più di 20 s: gioca un Bot, poi torna al suo posto.
// sp3 La Sala con 5: «Chi gioca?» (4 posti), Bea guarda; ⚙️ «Una mano», partita intera; fine coi tasti del core
//     (Paky «↻ Rivincita | 🎮 Cambia gioco», Giulia «👍 Ci sto! | 🏠 Torna in Sala»), storico delle coppie;
//     «↻ Rivincita» col 3-2-1 e si rigioca, Bea guarda ancora.
// sp4 Misure online: tavolo dell'ospite, di chi guarda e riepilogo a 360x640 e 412x915 senza scorrere.
// sp5 Il motore: 300 mani simulate (tutte le varianti), viste "girate" coerenti, Napola, scopa all'ultima carta.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  var COME = "scopa2v2", NOME = "Scopone (prova)";

  // i telefoni con opz.scoponeOnline non registrano la Scopa 2 vs 2 vera: al suo posto c'è lo Scopone
  if (!W.__pfScopone) {
    var pf = W.__pfScopone = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      pf.apply(this, arguments);
      if (!opz || !opz.scoponeOnline) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && g.id === COME && !g.__scopone) return; return reg.apply(v, arguments); };
      } });
    };
  }
  var SRC = null;
  async function sorgente() {
    var s = await (await fetch("/js/games/scopone.js?" + Date.now())).text();
    s = s.replace('var ID = "scopone";', 'var ID = "' + COME + '";').replace("SG.registra({", "SG.registra({ __scopone: true,").replace('nome: "Scopone",', 'nome: "' + NOME + '",');
    if (s.indexOf("__scopone: true") < 0 || s.indexOf('var ID = "' + COME + '"') < 0 || s.indexOf(NOME) < 0) no("non riesco a preparare lo Scopone per la prova");
    SRC = s; return s;
  }
  function opzOn(extra) { return Object.assign({ scoponeOnline: true, prima: function (w) { w.eval(SRC); } }, extra || {}); }

  // ---- aiuti ----
  function hostSt(P) { return P.__SCOPONEhost && P.__SCOPONEhost.st(); }
  function stato(w) {   // "gioco" | "mano" (riepilogo) | "fine" | "lobby" | "?"
    var d = w.document;
    if (d.querySelector(".sc-mensola")) return "gioco";
    if (d.querySelector(".sp-tab")) return /Fine mano/.test(T(w)) ? "mano" : "fine";
    if (d.querySelector(".saletta-schermo")) return "lobby";
    return "?";
  }
  function toccaAMe(w) { var p = w.document.querySelector(".sc-prese"); return !!w.document.querySelector(".sp-tocca") || !!(p && /tocca a te/.test(p.textContent)); }
  function manoDi(w) { return [].map.call(w.document.querySelectorAll(".sc-mano-riga .sc-carta img"), function (i) { return (i.getAttribute("src") || "").replace(/^.*\//, "").replace(".jpg", ""); }).sort().join(","); }
  function ids(carte) { return carte.map(function (c) { return c.id; }).sort().join(","); }
  // gioca una carta: la prima della mano; se c'è da scegliere la presa, tocca le carte verdi
  async function giocaUna(w) {
    var c = w.document.querySelector(".sc-mano-riga .sc-carta"); if (!c) return false;
    c.click(); await W.dorme(120);
    for (var i = 0; i < 6; i++) {
      if (!w.document.querySelector(".sc-mano-riga .sc-carta.sel")) break;
      var cap = w.document.querySelector(".sc-terra .sc-carta.cap"); if (!cap) break;
      cap.click(); await W.dorme(90);
    }
    return true;
  }
  // tutti i telefoni che giocano giocano quando tocca a loro, finché ferma() non dice basta (o scade il tempo)
  async function giocaFinche(tels, ferma, ms) {
    var fino = Date.now() + (ms || 120000);
    while (Date.now() < fino) {
      if (ferma()) return true;
      for (var i = 0; i < tels.length; i++) if (stato(tels[i]) === "gioco" && toccaAMe(tels[i])) { await giocaUna(tels[i]); await W.dorme(150); }
      await W.dorme(120);
    }
    return !!ferma();
  }
  async function regola(w, scelta) {   // ⚙️ Regole della saletta: tocca la scelta e «✅ Fatto»
    var b = w.document.querySelector("button.sl-regole"); if (!b) no("nella saletta non c'è ⚙️ Regole");
    b.click();
    var f = await W.aspetta(function () { return w.document.querySelector(".sl-foglio"); }, 2000); if (!f) no("il foglio ⚙️ non si apre");
    var c = [].find.call(f.querySelectorAll("button"), function (x) { return scelta.test(x.textContent); });
    if (!c) no("nel ⚙️ non c'è " + scelta);
    c.click(); await W.dorme(150);
    var ok = [].find.call(f.querySelectorAll("button"), function (x) { return /Fatto/.test(x.textContent); }); if (ok) ok.click();
    await W.dorme(300);
  }
  // l'host apre la stanza dello Scopone (percorso di prima: "Online: apro io la stanza"), con scelte facoltative prima
  async function apriStanzaScopone(P, prepara) {
    var tess = await W.aspetta(function () { return A.tessera(P, NOME); }, 6000); if (!tess) no("non trovo la tessera " + NOME);
    tess.click(); await W.dorme(300);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza» (" + A.modiVisti(P).join(" / ") + ")");
    await W.dorme(300);
    if (prepara) { prepara(P); await W.dorme(150); }
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P); }, 6000); if (!C) no("la stanza non ha il codice");
    return C;
  }
  function chip(w, re) { var b = [].find.call(w.document.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); }); if (!b) no("non trovo la scelta " + re); b.click(); }
  function chipDopo(w, etichetta, re) {   // la scelta re nella riga sotto l'etichetta
    var et = [].find.call(w.document.querySelectorAll(".etichetta"), function (x) { return etichetta.test(x.textContent); }); if (!et) no("non trovo «" + etichetta + "»");
    var riga = et.nextElementSibling, b = riga && [].find.call(riga.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); });
    if (!b) no("sotto «" + et.textContent + "» non c'è " + re); b.click();
  }
  function errori() { return W.erroriTel().filter(function (e) { return !/\.jpg|favicon/.test(e); }); }
  async function misura(w, nome, larg, alt, fondo) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(900);
    if (d.documentElement.scrollHeight > alt + 1) return larg + "x" + alt + ": la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return larg + "x" + alt + ": la pagina scorre di lato";
    var n = fondo ? d.querySelector(fondo) : null;
    if (fondo && !n) return larg + "x" + alt + ": non trovo " + fondo;
    if (n && n.getBoundingClientRect().bottom > alt + 1) return larg + "x" + alt + ": " + fondo + " esce dallo schermo (" + Math.round(n.getBoundingClientRect().bottom) + ")";
    return "";
  }
  function rimetti(nome) { var f = document.getElementById("tel-" + nome); if (f) { f.style.width = "360px"; f.style.height = "740px"; } }

  // ===== sp1: contro i Bot sullo stesso telefono =====
  COPIONE.aggiungi("sp1", { nome: "Scopone contro i Bot: una mano con la Napola, riepilogo, Nuova partita, misure", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopone"); }, 6000); if (!tess) no("non trovo la tessera Scopone");
    tess.click(); await W.dorme(400);
    // (finché lo Scopone non è in GIOCHI_ONLINE c'è un modo solo e «Come giocate?» si salta)
    if (A.modiVisti(P).length) {
      if (!W.clicca(P, /Contro i Bot/, ".modo-grande")) no("in «Come giocate?» non c'è «Contro i Bot» (" + A.modiVisti(P).join(" / ") + ")");
      await W.dorme(400);
    }
    if (/Coppie/.test(T(P))) no("contro i Bot c'è la scelta delle coppie");
    chip(P, /^Una mano$/); chipDopo(P, /Napola/, /^Sì$/);
    if (!W.clicca(P, /Comincia|Gioca/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return stato(P) === "gioco"; }, 6000)) no("non si arriva al tavolo («" + T(P).slice(0, 80) + "»)");
    var m1 = await misura(P, "Paky", 360, 640, ".sc-mensola"), m2 = await misura(P, "Paky", 412, 915, ".sc-mensola"); rimetti("Paky");
    if (m1 || m2) no("tavolo: " + (m1 || m2));
    if (!await giocaFinche([P], function () { return stato(P) === "fine"; }, 150000)) no("la mano non finisce («" + T(P).slice(0, 80) + "»)");
    if (!/Napola/.test(T(P))) no("nel riepilogo non c'è la riga della Napola");
    var m3 = await misura(P, "Paky", 360, 640, ".piede .btn"); rimetti("Paky");
    if (m3) no("riepilogo: " + m3);
    if (!W.clicca(P, /Nuova partita/)) no("a fine partita non c'è «🔄 Nuova partita»");
    if (!await W.aspetta(function () { return stato(P) === "gioco" && P.document.querySelectorAll(".sc-mano-riga .sc-carta").length === 10; }, 6000)) no("la nuova partita non riparte con 10 carte");
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "contro i Bot: una mano con la Napola fino al riepilogo, Nuova partita con 10 carte, misure ok";
  } });

  // ===== sp2: online, stanza di un gioco solo =====
  COPIONE.aggiungi("sp2", { nome: "Scopone online in 4: coppie, carte segrete, ricarica, chi guarda, ⏩ Avanti, telefono spento", fai: async function () {
    await sorgente();
    var P = await W.apriTel("Paky", opzOn({ x: 0 }));
    var C = await apriStanzaScopone(P, function (w) { chipDopo(w, /Bravura/, /Facile/); });
    var G = await W.apriTel("Giulia", opzOn({ hash: "gioco=" + COME + "&stanza=" + C, x: 185 }));
    var L = await W.apriTel("Luca", opzOn({ hash: "gioco=" + COME + "&stanza=" + C, x: 370 }));
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 3; }, 10000)) no("in saletta non sono in 3 (" + JSON.stringify(A.vm(C).seggi || null).slice(0, 80) + ")");
    if (!await W.aspetta(function () { return /🟢 tu \+ 🤖 Bot 🆚 🔴 Luca \+ Paky/.test(T(G)); }, 4000)) no("Giulia non vede le coppie giuste («" + T(G).slice(0, 160) + "»)");
    if (!W.clicca(P, /Cambia compagno/)) no("Paky non ha «🔀 Cambia compagno»");
    if (!await W.aspetta(function () { return /🟢 tu \+ Giulia/.test(T(P)) && /🟢 tu \+ Paky/.test(T(G)); }, 4000)) no("dopo «Cambia compagno» Paky non gioca con Giulia («" + T(P).slice(0, 120) + "»)");
    if (!W.clicca(P, /Comincia/, ".sl-go") && !W.clicca(P, /Comincia/)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return hostSt(P) && stato(P) === "gioco" && stato(G) === "gioco" && stato(L) === "gioco"; }, 10000)) no("non tutti arrivano al tavolo");
    var st = hostSt(P), sG = 2, sL = 3;   // dopo il cambio: Giulia di fronte a Paky, Luca a destra
    if (st.nomi[2] !== "Giulia" || st.nomi[3] !== "Luca") no("i posti non sono quelli della saletta (" + JSON.stringify(st.nomi) + ")");
    if (!await W.aspetta(function () { return manoDi(G) === ids(hostSt(P).mani[sG]) && manoDi(L) === ids(hostSt(P).mani[sL]) && manoDi(P) === ids(hostSt(P).mani[0]); }, 6000)) no("le carte in mano non sono quelle giuste");
    // nessuna foto per Giulia porta le carte degli altri: la vista di Giulia ha solo le sue
    var v = P.__SCOPONE.vistaDa(st, sG); if (v.mani[1].some(Boolean) || v.mani[2].some(Boolean) || v.mani[3].some(Boolean)) no("nella vista di Giulia ci sono carte degli altri");
    // si gioca un po'
    if (!await giocaFinche([P, G, L], function () { return hostSt(P).giocate >= 10; }, 60000)) no("la partita non va avanti (giocate " + hostSt(P).giocate + ")");
    // Luca ricarica la pagina: ritrova le sue carte
    var L2 = await W.ricarica("Luca");
    if (!await W.aspetta(function () { return stato(L2) === "gioco" && manoDi(L2) === ids(hostSt(P).mani[sL]); }, 10000)) no("Luca dopo la ricarica non ritrova le sue carte («" + T(L2).slice(0, 80) + "»)");
    // Marco arriva a partita cominciata: guarda
    var M = await W.apriTel("Marco", opzOn({ hash: "gioco=" + COME + "&stanza=" + C, x: 555 }));
    if (!await W.aspetta(function () { return /Guardi le carte di Paky/.test(T(M)) && manoDi(M) === ids(hostSt(P).mani[0]); }, 10000)) no("Marco non guarda la partita («" + T(M).slice(0, 100) + "»)");
    M.document.querySelector(".sc-prese").click();
    if (!await W.aspetta(function () { var n = hostSt(P).nomi[1]; return new RegExp("Guardi le carte di " + n).test(T(M)) && manoDi(M) === ids(hostSt(P).mani[1]); }, 4000)) no("🔄 non cambia le carte che guarda Marco");
    if (/Tocca a te/.test(T(M))) no("Marco (che guarda) legge «Tocca a te»");
    // fino al riepilogo della mano
    if (!await giocaFinche([P, G, L2], function () { return stato(P) !== "gioco" && stato(G) !== "gioco"; }, 150000)) no("la prima mano non finisce");
    if (hostSt(P).fase === "fine") return "(la prima mano ha già chiuso la partita: rifai la prova) " + hostSt(P).punti.noi + "-" + hostSt(P).punti.loro;
    if (!await W.aspetta(function () { return stato(P) === "mano" && stato(G) === "mano" && stato(L2) === "mano" && stato(M) === "mano"; }, 6000)) no("non tutti vedono il riepilogo della mano");
    if (/Avanti/.test(((M.document.querySelector(".sp-avanti button") || {}).textContent) || "")) no("Marco (che guarda) ha «⏩ Avanti»");
    var mR = await misura(G, "Giulia", 360, 640, ".sp-avanti"); rimetti("Giulia");
    if (mR) no("riepilogo della mano: " + mR);
    var bG = G.document.querySelector(".sp-avanti button"); if (!bG || !/Avanti/.test(bG.textContent)) no("Giulia non ha «⏩ Avanti»");
    bG.click();
    if (!await W.aspetta(function () { return /1 su 3 vogliono/.test(T(P)); }, 4000)) no("Paky non legge «⏩ 1 su 3 vogliono andare avanti»");
    if (stato(P) !== "mano") no("con 1 su 3 si è già ripartiti");
    L2.document.querySelector(".sp-avanti button").click();
    if (!await W.aspetta(function () { return hostSt(P).manoN === 2 && stato(P) === "gioco" && stato(G) === "gioco"; }, 5000)) no("con 2 su 3 non si riparte subito");
    // Giulia spegne il telefono più di 20 secondi: gioca un Bot al suo posto; poi torna
    W.spegni("Giulia");
    if (!await W.aspetta(function () { return hostSt(P).nomi[sG] !== "Giulia"; }, 40000)) no("dopo 20 secondi al posto di Giulia non gioca un Bot");
    var bot = hostSt(P).nomi[sG];
    if (!await giocaFinche([P, L2], function () { return hostSt(P).giocate >= 6 || hostSt(P).fase !== "gioco"; }, 40000)) no("senza Giulia la partita non va avanti");
    W.riaccendi("Giulia");
    if (!await W.aspetta(function () { return hostSt(P).nomi[sG] === "Giulia" && stato(G) === "gioco" && manoDi(G) === ids(hostSt(P).mani[sG]); }, 15000)) no("Giulia riaccesa non torna al suo posto («" + T(G).slice(0, 80) + "»)");
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "coppie e 🔀, carte solo proprie, Luca ricarica e ritrova le carte, Marco guarda (🔄), ⏩ 2 su 3 riparte subito, Giulia spenta → Bot " + bot + " → torna";
  } });

  // ===== sp3: la Sala con 5 =====
  COPIONE.aggiungi("sp3", { nome: "Scopone nella Sala con 5: Chi gioca, Bea guarda, una mano, tasti del core, storico coppie, Rivincita", fai: async function () {
    await sorgente();
    var w = { Paky: await W.apriTel("Paky", opzOn({ x: 0, salaSempre: true })) };
    var S = await A.apriSalaNuova("Paky"), amici = ["Giulia", "Luca", "Marco", "Bea"];
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], opzOn({ hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true }));
    if (!await W.aspetta(function () { return ((A.vm(S).membri) || []).length === 5; }, 10000)) no("nella Sala non sono in 5");
    var P = w.Paky, G = w.Giulia, B = w.Bea;
    var dove = await A.toccaGiocoSala(P, NOME);
    if (dove.dove !== "chi") no("con 5 nella Sala e 4 posti non si apre «Chi gioca?» (" + dove.dove + ")");
    var scelti = A.chiGioca(P) || [];
    if (scelti.length !== 4) no("in «Chi gioca?» non ne sono scelti 4 (" + scelti.join(",") + ")");
    var fuori = ["Paky"].concat(amici).filter(function (n) { return scelti.indexOf(n) < 0; })[0];
    var F = w[fuori];
    if (!W.clicca(P, /Si gioca/, ".piede button")) no("in «Chi gioca?» non c'è «▶ Si gioca»");
    var C = await W.aspetta(function () { var c = A.codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 6000);
    if (!C) no("Paky non arriva nella saletta dello Scopone");
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 4 && (A.vm(C).guarda || []).some(function (g) { return g.nome === fuori; }); }, 10000)) no("nella saletta non ci sono 4 seduti e " + fuori + " che guarda");
    if (!await W.aspetta(function () { return /Questa volta guardi/.test(T(F)); }, 5000)) no(fuori + " non legge «👀 Questa volta guardi»");
    await regola(P, /^Una mano$/);
    if (!await W.aspetta(function () { return /una mano sola/.test(A.regoleDi(G) || A.regoleDi(w.Luca)); }, 4000)) no("gli amici non leggono «una mano sola» nelle regole («" + A.regoleDi(G) + "»)");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var seduti = scelti.map(function (n) { return w[n]; });
    if (!await W.aspetta(function () { return seduti.every(function (x) { return stato(x) === "gioco"; }) && stato(F) === "gioco"; }, 12000)) no("non tutti al tavolo (e chi guarda non vede la partita)");
    if (!/Guardi le carte di/.test(T(F))) no(fuori + " al tavolo non è tra chi guarda");
    if (!await giocaFinche(seduti, function () { return seduti.every(function (x) { return stato(x) === "fine"; }); }, 150000)) no("la mano non finisce per tutti");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(G); }, 5000)) no("a fine partita mancano i tasti del core");
    var tP = A.tastiFineDi(P).join(" | "), tG = A.tastiFineDi(G).join(" | ");
    if (tP !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
    if (tG !== "👍 Ci sto! | 🏠 Torna in Sala") no("Giulia ha «" + tG + "»");
    if (!/👫 .* e .*: [01] vint/.test(T(P))) no("a fine partita non c'è lo storico delle coppie");   // (dal giro 2: «👫 Paky e Luca: 1 vinta, 0 perse»)
    if (!await W.aspetta(function () { return stato(F) === "fine" && /l'hai guardata/.test(T(F)); }, 4000)) no(fuori + " non legge «Questa partita l'hai guardata»");
    var clG = G.document.querySelector(".sp-tab");
    W.clicca(G, /Ci sto/, ".fine-tasti button");
    if (!await W.aspetta(function () { return (A.tastiFineDi(P) || [])[0] === "↻ Rivincita · 👍 1"; }, 3000)) no("dopo «Ci sto» Paky non ha «· 👍 1»");
    if (G.document.querySelector(".sp-tab") !== clG) no("il riepilogo di Giulia è stato ridisegnato");
    var vP = A.spiaVia(P);
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    var ok = await W.aspetta(function () { var s = hostSt(P); return s && s.fase === "gioco" && seduti.every(function (x) { return stato(x) === "gioco"; }); }, 15000);
    var via = vP.stop();
    if (!ok) no("dopo «Rivincita» la partita non riparte per tutti («" + T(G).slice(0, 80) + "»)");
    if (!via) no("il 3-2-1 non si è visto");
    if (!await W.aspetta(function () { return /Guardi le carte di/.test(T(F)); }, 6000)) no("alla Rivincita " + fuori + " non guarda più");
    if (!/📊/.test(JSON.stringify(A.vm(C)))) { /* (lo storico in saletta si vede solo tra una partita e l'altra) */ }
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Sala con 5: «Chi gioca?» → " + scelti.join(", ") + "; " + fuori + " guarda; una mano intera; Paky «" + tP + "», Giulia «" + tG + "»; storico coppie; Ci sto → 👍 1; Rivincita col 3-2-1, " + fuori + " guarda ancora";
  } });

  // ===== sp4: misure online =====
  COPIONE.aggiungi("sp4", { nome: "Scopone online: misure a 360x640 e 412x915 (ospite, chi guarda, riepilogo)", fai: async function () {
    await sorgente();
    var P = await W.apriTel("Paky", opzOn({ x: 0 }));
    var C = await apriStanzaScopone(P, function (w) { chip(w, /^Una mano$/); });
    var G = await W.apriTel("Giulia", opzOn({ hash: "gioco=" + COME + "&stanza=" + C, x: 185 }));
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 2; }, 8000)) no("Giulia non entra");
    var m0 = await misura(G, "Giulia", 360, 640, ".sl-go, .piede"); rimetti("Giulia");
    if (!W.clicca(P, /Comincia/, ".sl-go") && !W.clicca(P, /Comincia/)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return stato(G) === "gioco"; }, 8000)) no("Giulia non arriva al tavolo");
    var M = await W.apriTel("Marco", opzOn({ hash: "gioco=" + COME + "&stanza=" + C, x: 370 }));
    if (!await W.aspetta(function () { return /Guardi le carte di/.test(T(M)); }, 8000)) no("Marco non guarda");
    var r = [];
    [[360, 640], [412, 915]].forEach(function () {});
    for (var k = 0; k < 2; k++) {
      var dim = k ? [412, 915] : [360, 640];
      r.push(await misura(G, "Giulia", dim[0], dim[1], ".sc-mensola"));
      r.push(await misura(M, "Marco", dim[0], dim[1], ".sc-mensola"));
    }
    rimetti("Giulia"); rimetti("Marco");
    if (!await giocaFinche([P, G], function () { return stato(G) === "fine"; }, 150000)) no("la mano non finisce");
    for (k = 0; k < 2; k++) {
      var d2 = k ? [412, 915] : [360, 640];
      r.push(await misura(G, "Giulia", d2[0], d2[1], ".fine-tasti, .piede .btn"));
      if (!await W.aspetta(function () { return stato(M) === "fine"; }, 4000)) no("Marco non vede la fine");
      var mm = await misura(M, "Marco", d2[0], d2[1], ".fine-tasti, .piede .btn"); if (mm) r.push("chi guarda: " + mm);
    }
    rimetti("Giulia"); rimetti("Marco");
    r = r.filter(Boolean); if (m0) r.unshift("saletta: " + m0);
    if (r.length) no(r.join(" / "));
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "saletta, tavolo dell'ospite e di chi guarda, fine partita: niente scorre a 360x640 e 412x915";
  } });

  // ===== sp6: chi si distrae e l'host che ricarica =====
  // (il tempo del turno qui è 8 secondi invece di 60, così la prova non aspetta un minuto)
  COPIONE.aggiungi("sp6", { nome: "Scopone online: chi non gioca per troppo (gioca il Bot per lui), l'host ricarica (la partita riprende, stesso codice)", fai: async function () {
    await sorgente(); SRC = SRC.replace("var TEMPO_TURNO = 60;", "var TEMPO_TURNO = 8;");
    var P = await W.apriTel("Paky", opzOn({ x: 0 }));
    var C = await apriStanzaScopone(P);
    var G = await W.apriTel("Giulia", opzOn({ hash: "gioco=" + COME + "&stanza=" + C, x: 185 }));
    var L = await W.apriTel("Luca", opzOn({ hash: "gioco=" + COME + "&stanza=" + C, x: 370 }));
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 3; }, 10000)) no("in saletta non sono in 3");
    if (!W.clicca(P, /Comincia/, ".sl-go") && !W.clicca(P, /Comincia/)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return hostSt(P) && stato(L) === "gioco"; }, 10000)) no("non si arriva al tavolo");
    var sL = 2;   // Luca: il secondo arrivato, di fronte a Paky
    if (hostSt(P).nomi[sL] !== "Luca") no("Luca non è al posto 2 (" + JSON.stringify(hostSt(P).nomi) + ")");
    // giocano tutti tranne Luca: quando tocca a lui, si aspetta
    if (!await giocaFinche([P, G], function () { var s = hostSt(P); return s.turno === sL && !s.presa && s.fase === "gioco"; }, 30000)) no("non arriva il turno di Luca");
    var g0 = hostSt(P).giocate, visto = A.spiaTesto(P, /ci pensava troppo/);
    if (!await W.aspetta(function () { return hostSt(P).giocate > g0; }, 14000)) no("dopo il tempo del turno il Bot non gioca per Luca");
    await W.dorme(600);
    var v = visto.stop(); if (!v) no("Paky non legge «… ci pensava troppo: ha giocato il Bot per lui»");
    if (hostSt(P).nomi[sL] !== "Luca") no("il posto di Luca è passato al Bot per sempre");
    // l'host ricarica la pagina: dal 18 ott (Passo 5) la partita RIPRENDE da dove era (stesso codice, stessa mano, niente
    // saletta per nessuno), e Luca ritrova le sue carte e il suo posto
    var prima = hostSt(P), sl = false;
    var P2 = await W.ricarica("Paky");
    var ok = await W.aspetta(function () {
      if (stato(G) === "lobby" || stato(L) === "lobby") sl = true;
      var s = hostSt(W.finestra("Paky"));
      return s && s.fase === "gioco" && stato(W.finestra("Paky")) === "gioco" && stato(G) === "gioco" && stato(L) === "gioco" && s.manoN === prima.manoN;
    }, 20000);
    if (!ok) no("dopo la ricarica dell'host la partita non riprende (Paky «" + T(W.finestra("Paky")).slice(0, 60) + "», Giulia «" + T(G).slice(0, 60) + "»)");
    if (sl) no("dopo la ricarica dell'host qualcuno è passato dalla saletta");
    var s2 = hostSt(W.finestra("Paky"));
    if (s2.nomi[sL] !== "Luca") no("dopo la ricarica il posto di Luca non è suo (" + JSON.stringify(s2.nomi) + ")");
    if (!await W.aspetta(function () { return manoDi(L) === ids(hostSt(W.finestra("Paky")).mani[sL]); }, 8000)) no("dopo la ricarica Luca non ha le sue carte");
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Luca distratto: avviso e il Bot gioca una carta per lui (il posto resta suo); Paky ricarica: la partita riprende (stesso codice " + C + ", stessa mano, Luca al suo posto con le sue carte)";
  } });

  // ===== sp5: il motore =====
  COPIONE.aggiungi("sp5", { nome: "Scopone: il motore (300 mani simulate, viste girate, Napola, scopa all'ultima)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var S = P.__SCOPONE; if (!S) no("manca il motore dello Scopone");
    var err = [], ultime = 0, napole = 0;
    for (var g = 0; g < 300; g++) {
      var reg = { napola: g % 2 === 0, ultima: g % 3 === 0 };
      var st = S.creaStato(g % 4 === 0 ? "classico" : "scientifico", 11, reg); st.nomi = { 0: "A", 1: "B", 2: "C", 3: "D" }; st.omini = {};
      st.primo = g % 4; S.distribuisci(st);
      var n = 0, ultScopa = false;
      while (!S.maniVuote(st)) {
        var m = S.mossaBot(st, st.turno, ["facile", "medio", "difficile"][g % 3]);
        var ev = S.applica(st, st.turno, m.carta, m.presa); if (ev.errore) { err.push("mossa rifiutata"); break; }
        st.presa = null; n++;
        if (S.maniVuote(st) && ev.scopa) { ultScopa = true; ultime++; }
        if (n === 7) for (var io = 0; io < 4; io++) { var v = S.vistaDa(st, io); if (v.mani[0].length !== st.mani[io].length || v.turno !== (st.turno - io + 4) % 4) err.push("vista girata"); }
      }
      if (ultScopa && !reg.ultima) err.push("scopa all'ultima carta senza la regola");
      S.fineMano(st);
      var r = st.ultimoRound, tot = 0; st.prese.forEach(function (p) { tot += p.length; });
      if (tot !== 40) err.push("carte prese " + tot);
      if (!reg.napola && (r.napA || r.napB)) err.push("Napola senza la regola");
      if (r.napA || r.napB) napole++;
      for (io = 0; io < 4; io++) { var u = S.vistaDa(st, io).ultimoRound; if (u.puntiNoi !== (io % 2 === 0 ? r.puntiNoi : r.puntiLoro)) err.push("punti girati"); }
    }
    if (S.napola([{ s: "D", v: 1 }, { s: "D", v: 2 }, { s: "D", v: 3 }, { s: "D", v: 4 }, { s: "D", v: 6 }]) !== 4) err.push("Napola A-2-3-4 non vale 4");
    if (S.napola([{ s: "D", v: 1 }, { s: "D", v: 3 }]) !== 0) err.push("Napola senza il 2");
    if (err.length) no(err.slice(0, 4).join(" / ") + " (" + err.length + ")");
    return "300 mani: 40 carte sempre prese, viste girate giuste, Napola uscita " + napole + " volte, scopa all'ultima " + ultime + " volte (solo con la regola)";
  } });
})();
