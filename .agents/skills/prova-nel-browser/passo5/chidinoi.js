// PROVE DEL PASSO 5 per «Chi di Noi?» (id chidinoi): la partita riprende quando l'host ricarica, e con l'host di riserva
// un amico la porta avanti se l'host sparisce. Usa gli aiuti di passo2/chidinoi.js (COPIONE.cn: Sala con le foto vere finte).
// Uso (dopo copione-prova.js): await COPIONE.carica("passo2/chidinoi.js"); await COPIONE.carica("passo5/chidinoi.js");
//   await COPIONE.prova("5cn1")      (Edge invisibile: prova.js --carica passo2/chidinoi.js,passo5/chidinoi.js --prova 5cn1)
// 5cn1 Sala, 3 telefoni coi selfie: l'host ricarica IN QUATTRO MOMENTI e la partita riprende ogni volta (stesso codice,
//      nessuno passa dalla Sala o dalla saletta, «🔁 … la partita riprende da dove era», «🔁 Partita ripresa!»):
//      A) a metà Immagini (Giulia ha già scelto: la sua scelta resta e conta), B) a metà Disegna (Giulia ha finito: il suo
//      disegno resta; Luca sta disegnando: la sua tavola non si ricostruisce e non perde niente), C) sullo svelamento (i punti
//      non si danno due volte), D) sulla classifica finale (resta lì, un solo "__esito"; poi «↻ Rivincita»).
//      Punti ricontati a parte in ogni svelamento; le foto tornano tutte; la chiave mai in rete, le foto mai trattenute né
//      in chiaro, e nella memoria della ripresa (sg-ripresa) mai foto né chiave.
// 5cn2 Sala, 4 telefoni coi selfie: l'host si spegne a metà Scrivi; un amico (vice) porta avanti la partita
//      («👑 … la porti avanti tu» / «👑 Ora la partita la tiene …»), le battute già scritte restano; poi l'host torna (la Sala
//      intanto è passata a un amico: lui torna nella Sala da amico, mai due host), si arriva alla classifica con un "__esito" solo. Le copie per il vice (__ris)
//      sotto i 60 KB, mai foto, mai pezzi né chiave; le foto tra gli amici restano.
// 5cn3 Sala, 3 telefoni coi selfie: l'host CHIUDE l'app (perde la chiave delle foto) a metà Immagini: la partita riprende,
//      l'impronta della chiave resta quella di prima e l'host fa da postino (le foto tra Giulia e Luca restano e passano).
// 5cn4 Stanza di un gioco solo (link con la chiave), 4 telefoni coi selfie: l'host si spegne a metà Disegna; Giulia porta
//      avanti (il suo disegno e quello di Luca a metà restano, la galleria la vede anche lei), Paky torna e legge «👋 Bentornato!
//      … rientri come giocatore», rientra col suo posto, mai due host; classifica, un __esito, «Nuova partita» di Giulia con la corona.
// Profili finti, mai account veri; la fotocamera è finta (un canvas).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, vm = A.vm;
  function no(p) { throw new Error(p); }
  function cn() { if (!COPIONE.cn || !COPIONE.cn.salaFoto) no("carica prima passo2/chidinoi.js"); return COPIONE.cn; }
  function pill(w) { return w ? [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | ") : ""; }
  function punti(v) { var o = {}; ((v && v.players) || []).forEach(function (p) { o[p.nome] = p.punti; }); return JSON.stringify(o); }
  function idDi(C, n) { return cn().idDi(C, n); }
  function ripresaDi(nome) { try { return W.BR.mem[nome].l["sg-ripresa"] || ""; } catch (e) { return ""; } }
  // chi passa dalla saletta o dalla Sala mentre si aspetta (ogni 100 ms)
  function spia(nomi) {
    var visti = {}, t = setInterval(function () { nomi.forEach(function (n) { var f = W.finestra(n); if (f && f.document.querySelector(".saletta-schermo, .sala-sommario")) visti[n] = 1; }); }, 100);
    return { fine: function () { clearInterval(t); return Object.keys(visti); } };
  }
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Problema di collegamento|Collegamento perso|La stanza è chiusa|stata chiusa|ha chiuso la|Ops/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 150);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  // Immagini / Chi di noi: tocca una carta e «Lancia»
  async function scegli(C, nome) {
    var w = W.finestra(nome);
    var c = await W.aspetta(function () { var l = w.document.querySelectorAll(".cn-carta, .cn-volto"); return l.length ? l : null; }, 6000);
    if (!c) no(nome + " non vede le carte");
    cn().tocca(w, c[0]); W.clicca(w, /Lancia/, ".cn-btn.vai");
    if (!await W.aspetta(function () { return (vm(C).risposto || []).indexOf(idDi(C, nome)) >= 0; }, 6000)) no("la scelta di " + nome + " non arriva all'host");
  }
  async function disegna(C, nome, fatto) {
    var w = W.finestra(nome);
    if (!await W.aspetta(function () { return w.document.querySelector(".cn-tav-foglio"); }, 6000)) no(nome + " non ha la tavola");
    await cn().disegnaUn(w); await W.dorme(60);
    if (fatto) {
      W.clicca(w, /Fatto/, ".cn-btn.vai");
      if (!await W.aspetta(function () { return (vm(C).risposto || []).indexOf(idDi(C, nome)) >= 0; }, 6000)) no("il disegno di " + nome + " non arriva all'host");
    }
  }
  // l'host ricarica (o chiude l'app): la foto nuova con _r, nessuno passa dalla Sala o dalla saletta, le pillole, controlla(vm)
  async function ricaricaHost(C, amici, controlla, come) {
    var sPrima = (W.statoStanza(C) || {})._s, sp = spia(amici), pa = {}, ph = "", perche = "", t0 = Date.now();
    var tPill = setInterval(function () { amici.forEach(function (n) { var p = pill(W.finestra(n)); if (/tornato/.test(p)) pa[n] = p; }); }, 100);
    if (come === "chiudiApp") await W.chiudiApp("Paky"); else await W.ricarica("Paky");
    var ok = await W.aspetta(function () {
      var p0 = pill(W.finestra("Paky")); if (/ripresa/i.test(p0)) ph = p0;
      var s = W.statoStanza(C) || {}, v = vm(C);
      if (!s._s || s._s === sPrima) { perche = "nessuna foto nuova dell'host"; return false; }
      if (!s._r) { perche = "la foto nuova non dice che la partita riprende (_r)"; return false; }
      if (!v.fase || v.fase === "lobby") { perche = "la partita è tornata in saletta"; return false; }
      var c = controlla ? controlla(v) : true;
      if (c !== true) { perche = typeof c === "string" ? c : "la partita non è quella di prima"; return false; }
      if (!amici.every(function (n) { return pa[n]; })) { perche = "non tutti gli amici leggono «… tornato»"; return false; }
      return !!ph;
    }, 15000);
    clearInterval(tPill);
    var sv = sp.fine();
    if (!ok) no("dopo la ricarica dell'host: " + (perche || "l'host non legge «🔁 Partita ripresa!»") + " (fase " + vm(C).fase + "/" + vm(C).passo + ")");
    if (sv.length) no(sv.join(", ") + " è passato dalla Sala o dalla saletta");
    amici.forEach(function (n) { if (!/riprende da dove era/.test(pa[n])) no(n + " legge «" + pa[n] + "»"); });
    return ((Date.now() - t0) / 1000).toFixed(1) + " s";
  }
  // nella memoria della ripresa e nelle copie per il vice: mai foto, pezzi, chiave
  function senzaFoto(testo, k, dove) {
    if (!testo) return;
    if (k && testo.indexOf(k) >= 0) no(dove + ": c'è la chiave delle foto!");
    if (/data:image|base64,|"pz":|"iv":"/.test(testo)) no(dove + ": c'è un pezzo di foto");
  }
  async function salaCon(amici, filtri) {
    var Z = await cn().salaFoto(amici), nomi = ["Paky"].concat(amici);
    for (var i = 0; i < nomi.length; i++) await cn().selfie(nomi[i], filtri[i]);
    await cn().vedonoTutti(Z.C, nomi, nomi, 20000);
    await cn().regole(W.finestra("Paky"), 3, 3, "⚡ Veloci");
    await cn().comincia(Z.C);
    return Z;
  }

  COPIONE.aggiungi("5cn1", { nome: "Chi di Noi?: l'host ricarica a metà Immagini, a metà Disegna, sullo svelamento e sulla classifica: la partita riprende", fai: async function () {
    var L = [], am = ["Giulia", "Luca"], nomi = ["Paky"].concat(am);
    var Z = await salaCon(am, ["Testa Schiacciata", "Sdoppiamento", "Faccia Liquida"]), C = Z.C;
    var S = cn().spiaPunti(C), sent = sentinella(am);
    // ---- A) a metà Immagini: Giulia ha scelto, gli altri no ----
    if (!await cn().finoA(C, function (v) { return v.passo === "scegli"; }, 60000, { veloce: true })) no("non arriva la prima Immagini");
    await scegli(C, "Giulia");
    await W.dorme(900);
    var kA = vm(C).k, pA = punti(vm(C)), gA = idDi(C, "Giulia");
    var dt = await ricaricaHost(C, am, function (v) {
      if (v.passo !== "scegli" || v.k !== kA) return "il passo è cambiato (" + v.passo + ")";
      if ((v.risposto || []).indexOf(gA) < 0) return "la scelta di Giulia è sparita";
      if (punti(v) !== pA) return "i punti sono cambiati";
      return A.contaDentro(v) === 3 || "non sono tutti dentro (" + A.contaDentro(v) + ")";
    });
    L.push("A) Immagini a metà: ripresa in " + dt + ", la scelta di Giulia resta");
    if (!await W.aspetta(function () { return W.finestra("Paky").document.querySelector(".cn-carta, .cn-volto"); }, 8000)) no("Paky dopo la ricarica non vede le carte");
    await scegli(C, "Luca"); await scegli(C, "Paky");
    if (!await W.aspetta(function () { return vm(C).passo === "svela"; }, 8000)) no("dopo la ripresa le Immagini non si svelano (" + vm(C).passo + ")");
    if (!((vm(C).esito || {}).scelte || {}).hasOwnProperty(gA)) no("la scelta di Giulia data prima della ricarica non conta");
    await cn().vedonoTutti(C, nomi, nomi, 20000);
    L.push("le 3 foto tornano");
    // ---- B) a metà Disegna: Giulia ha finito, Luca sta disegnando ----
    if (!await cn().finoA(C, function (v) { return v.passo === "disegna"; }, 150000, { veloce: true })) no("non arriva il Disegna");
    await disegna(C, "Giulia", true);
    await disegna(C, "Luca", false);
    await W.dorme(900);
    var fL = W.finestra("Luca").document.querySelector(".cn-tav-foglio"), kB = vm(C).k;
    var dtB = await ricaricaHost(C, am, function (v) {
      if (v.passo !== "disegna" || v.k !== kB) return "il passo è cambiato (" + v.passo + ")";
      return (v.risposto || []).indexOf(gA) >= 0 || "il disegno di Giulia è sparito";
    });
    if (!W.finestra("Luca").document.body.contains(fL)) no("la tavola di Luca si è ricostruita durante la ripresa");
    if (!W.finestra("Luca").document.querySelector(".cn-ad")) no("Luca ha perso il suo adesivo");
    L.push("B) Disegna a metà: ripresa in " + dtB + ", il disegno di Giulia resta, la tavola di Luca non si tocca");
    W.clicca(W.finestra("Luca"), /Fatto/, ".cn-btn.vai");
    await disegna(C, "Paky", true);
    if (!await W.aspetta(function () { return vm(C).passo === "vota"; }, 10000)) no("dopo la ripresa non si vota la galleria (" + vm(C).passo + ")");
    if (vm(C).nGal !== 3) no("nella galleria ci sono " + vm(C).nGal + " disegni invece di 3");
    if (!await W.aspetta(function () { return [].filter.call(W.finestra("Paky").document.querySelectorAll(".cn-cella"), function (x) { return !x.classList.contains("vuota"); }).length === 3; }, 10000)) no("Paky non vede i 3 disegni");
    // ---- C) sullo svelamento: i punti non si danno due volte ----
    await cn().giocaPasso(C, { veloce: true });
    if (!await W.aspetta(function () { return vm(C).passo === "svela"; }, 10000)) no("non arriva lo svelamento del Disegna (" + vm(C).passo + ")");
    await W.dorme(900);
    var pC = punti(vm(C)), kC = vm(C).k;
    var dtC = await ricaricaHost(C, am, function (v) { return punti(v) === pC || "i punti sono cambiati: " + punti(v) + " invece di " + pC; });
    if (!await W.aspetta(function () { return vm(C).k !== kC; }, 25000)) no("dopo la ripresa lo svelamento non va avanti");
    if (punti(vm(C)) !== pC) no("dopo lo svelamento ripreso i punti sono cambiati: " + punti(vm(C)) + " invece di " + pC);
    L.push("C) svelamento: ripresa in " + dtC + ", punti uguali (" + pC + ")");
    // ---- fino alla classifica ----
    if (!await cn().finoAllaFine(C, 500000, { veloce: true, jolly: true })) no("la partita non finisce (" + vm(C).fase + "/" + vm(C).passo + ")");
    L.push(cn().esitoPunti(S, { i: 2, s: 2, d: 1 }));
    // ---- D) sulla classifica: si resta lì, nessun esito doppio ----
    await W.dorme(1500);
    var nE = A.contaStoria(C, '"__esito"'), pD = punti(vm(C));
    var dtD = await ricaricaHost(C, am, function (v) { return v.fase === "fine" || "fase " + v.fase; });
    await W.dorme(2500);
    if (A.contaStoria(C, '"__esito"') !== nE) no("sulla classifica ripresa c'è un __esito in più");
    if (punti(vm(C)) !== pD) no("sulla classifica ripresa i punti sono cambiati");
    if (!await W.aspetta(function () { return W.finestra("Paky").document.querySelector(".cn-podio"); }, 8000)) no("Paky dopo la ricarica non ha il podio");
    L.push("D) classifica: ripresa in " + dtD + ", un __esito solo");
    // ---- la memoria della ripresa: mai foto né chiave ----
    senzaFoto(ripresaDi("Paky"), Z.k, "la memoria della ripresa");
    // ---- Rivincita ----
    if (!await W.aspetta(function () { return A.tastiFineDi(W.finestra("Paky")); }, 8000)) no("Paky non ha i tasti di fine");
    W.clicca(W.finestra("Paky"), /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 20000)) no("la Rivincita non riparte (" + vm(C).fase + ")");
    if (!/"tiene":"host"/.test(JSON.stringify(vm(C)))) no("nella foto manca chi tiene la partita");
    var R = await cn().controllaRete(Z.k);
    cn().fineSpia();
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    cn().senzaErrori();
    L.push("Rivincita ok; in rete " + R.nFoto + " foto cifrate, mai la chiave");
    return L.join(" · ");
  } });

  COPIONE.aggiungi("5cn2", { nome: "Chi di Noi?: l'host si spegne a metà Scrivi, un amico porta avanti la partita; l'host torna da giocatore", fai: async function () {
    var L = [], am = ["Giulia", "Luca", "Sara"], nomi = ["Paky"].concat(am);
    var Z = await salaCon(am, ["Testa Schiacciata", "Sdoppiamento", "Faccia Liquida", "Occhioni Anime"]), C = Z.C;
    var ids = {}; nomi.forEach(function (n) { ids[n] = idDi(C, n); });
    function nomeDi(id) { var r = null; Object.keys(ids).forEach(function (n) { if (ids[n] === id) r = n; }); return r; }
    if (!await cn().finoA(C, function (v) { return v.passo === "scrivi"; }, 120000, { veloce: true })) no("non arriva lo Scrivi");
    var batt = ["Giulia", "Luca"];
    for (var i = 0; i < batt.length; i++) {
      var w = W.finestra(batt[i]), ta = await W.aspetta(function () { return w.document.querySelector(".cn-campo"); }, 5000);
      if (!ta) no(batt[i] + " non ha il campo");
      ta.value = "Battuta di " + batt[i]; ta.dispatchEvent(new w.Event("input", { bubbles: true }));
      W.clicca(w, /Manda/, ".cn-btn.vai");
    }
    if (!await W.aspetta(function () { return ["Giulia", "Luca"].every(function (n) { return (vm(C).risposto || []).indexOf(ids[n]) >= 0; }); }, 6000)) no("le battute non arrivano");
    await W.dorme(1800);   // (la copia ai vice: al massimo una al secondo)
    var p0 = punti(vm(C)), kS = vm(C).k, sent = sentinella(am), t0 = Date.now();
    // (il diario della partita dopo lo spegnimento: chi la tiene, il passo, chi è fuori; per capire se finisce prima del tempo)
    var diario = [], ultD = "", tD = setInterval(function () { var v = vm(C), c = A.chiTiene(C), r = [c.g, nomeDi(c.h) || c.h, v.fase, v.passo, v.iP, v.iD, (v.players || []).filter(function (p) { return p.via; }).map(function (p) { return p.nome; }).join("+"), "forse:" + (v.players || []).filter(function (p) { return p.forse; }).map(function (p) { return p.nome; }).join("+"), "L:" + (pill(W.finestra("Luca")) || "").slice(0, 40) + "|" + (W.finestra("Luca").document.querySelector(".cn") ? "gioco" : "fuori")].join(" "); if (r !== ultD) { ultD = r; diario.push(((Date.now() - t0) / 1000).toFixed(1) + "s " + r); } }, 200);
    var iPub = (W.__pub || []).length;
    function joinDopo() { return (W.__pub || []).slice(iPub).filter(function (x) { return x.topic.indexOf(C) >= 0 && /"t":"(join|__leave|__esco|__ciao)"|"t":"__[a-z]*"/.test(x.p) && !/"t":"(__ci|__ris)"/.test(x.p); }).map(function (x) { var t0m = /"t":"([^"]+)"/.exec(x.p); return x.n + ":" + (t0m ? t0m[1] : "?"); }).join(", "); }
    A.muore("Paky");
    var V = null;
    if (!await W.aspetta(function () { var c = A.chiTiene(C); V = c.g === 2 ? nomeDi(c.h) : null; return !!V && V !== "Paky"; }, 12000)) no("dopo 12 s la partita non la tiene un amico (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1), altri = am.filter(function (n) { return n !== V; });
    var pg = await A.pilloleDi([V], /porti avanti tu/, 4000), pa = await A.pilloleDi(altri, new RegExp("Ora la partita la tiene " + V), 5000);
    if (!pg[V]) no(V + " non legge «… la porti avanti tu» («" + pill(W.finestra(V)) + "»)");
    if (!altri.every(function (n) { return pa[n]; })) no(altri.join(" e ") + " non leggono «Ora la partita la tiene " + V + "»");
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && (v.risposto || []).indexOf(ids.Giulia) >= 0 && (v.risposto || []).indexOf(ids.Luca) >= 0; }, 8000)) no("dopo il subentro le battute già scritte non ci sono più (" + vm(C).passo + ")");
    if (vm(C).k !== kS) no("dopo il subentro il passo è cambiato (" + vm(C).passo + ")");
    if (punti(vm(C)) !== p0) no("dopo il subentro i punti sono cambiati");
    L.push(V + " tiene la partita in " + dt + " s, battute e punti uguali");
    await cn().vedonoTutti(C, am, am, 25000);
    L.push("le foto tra gli amici restano");
    // ---- si gioca un po', poi Paky torna e rientra da giocatore ----
    var fino = Date.now() + 12000; while (Date.now() < fino && vm(C).fase === "gioco") await cn().giocaPasso(C, { veloce: true });
    var t1 = Date.now();
    A.torna("Paky");
    // (nella Sala Paky teneva anche la Sala, che intanto è passata a un amico: Paky torna nella Sala da amico, lo decide il
    // core; per il gioco conta che non riprenda la partita e che non ci siano mai due host. Il ritorno nel gioco col suo
    // posto si prova fuori dalla Sala, in 5cn4)
    var visto = [], tP = setInterval(function () { var p = pill(W.finestra("Paky")); if (p && visto.indexOf(p) < 0) visto.push(p); }, 150);
    if (!await W.aspetta(function () { return /Bentornato/.test(visto.join(" ")); }, 20000)) no("Paky tornato non legge «👋 Bentornato…» («" + visto.join(" / ") + "»)");
    clearInterval(tP);
    L.push("Paky torna: «" + visto.join(" / ") + "»");
    if (!await cn().finoAllaFine(C, 500000, { veloce: true })) no("la partita tenuta da " + V + " non finisce (" + vm(C).fase + "/" + vm(C).passo + ")");
    clearInterval(tD);
    if (!diario.some(function (r) { return / fintro /.test(r); })) no("la partita è finita prima del gran finale: " + diario.slice(-14).join(" · ") + " · join dopo lo spegnimento: " + joinDopo());
    await W.dorme(3000);
    var altre = A.fotoDa(C, t1 + 3000).filter(function (x) { return x.h !== ids[V]; });
    if (altre.length) no("dopo il ritorno di Paky ci sono foto di un altro host: " + JSON.stringify(altre.slice(0, 3)));
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== ids[V]) no("alla fine la partita non la tiene più " + V + " (" + JSON.stringify(c) + ")");
    var f = vm(C).fine; if (!f || f.classifica.length !== 4) no("la classifica non ha 4 giocatori (c'è anche Paky, coi punti di quando c'era)");
    var es = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/stato") >= 0 && x.p.indexOf('"__esito"') >= 0; });
    if (es.length !== 1 || es[0].da !== V) no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di " + V);
    if (!await W.aspetta(function () { return /Rivincita|Nuova partita/.test(T(W.finestra(V))); }, 20000)) no(V + " non vede la classifica coi suoi tasti");
    // le copie per il vice: sotto i 60 KB, mai foto né chiave
    var ris = (W.__pub || []).filter(function (x) { return x.p.indexOf('"__ris"') >= 0; }), maxR = 0;
    ris.forEach(function (x) { if (x.p.length > maxR) maxR = x.p.length; senzaFoto(x.p, Z.k, "una copia per il vice"); });
    if (!ris.length) no("nessuna copia per il vice è passata");
    if (maxR > 60000) no("una copia per il vice pesa " + maxR + " caratteri");
    var R = await cn().controllaRete(Z.k);
    cn().fineSpia();
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    cn().senzaErrori();
    L.push("classifica (" + f.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + "), un __esito di " + V + "; " + ris.length + " copie per il vice, al massimo " + Math.round(maxR / 1000) + " KB, senza foto; " + R.nFoto + " foto cifrate in rete");
    return L.join(" · ");
  } });

  COPIONE.aggiungi("5cn3", { nome: "Chi di Noi?: l'host chiude l'app (perde la chiave delle foto): la partita riprende e le foto tra gli amici restano", fai: async function () {
    var L = [], am = ["Giulia", "Luca"];
    var Z = await salaCon(am, ["Testa Schiacciata", "Sdoppiamento", "Faccia Liquida"]), C = Z.C;
    if (!await cn().finoA(C, function (v) { return v.passo === "scegli"; }, 60000, { veloce: true })) no("non arriva la prima Immagini");
    await scegli(C, "Giulia");
    await W.dorme(900);
    var kf = vm(C).kf, fL = cn().foDi(C, "Luca");
    var dt = await ricaricaHost(C, am, function (v) { return v.passo === "scegli" || "passo " + v.passo; }, "chiudiApp");
    if (vm(C).kf !== kf) no("dopo la riapertura l'impronta della chiave è cambiata (le foto si romperebbero a tutti)");
    // Luca rimanda i suoi pezzi a Paky (che non ha la chiave: li passa e basta)
    if (!await W.aspetta(function () { var f = cn().foDi(C, "Luca"); return f && f.f === fL.f && f.h; }, 20000)) no("la foto di Luca non torna a Paky (h)");
    if (!cn().vede(C, "Giulia", "Luca") || !cn().vede(C, "Luca", "Giulia")) no("Giulia e Luca non si vedono più in foto");
    if (W.finestra("Paky").SG_CDN_FOTO.ha(cn().idDi(C, "Luca"))) no("Paky senza chiave vede la foto di Luca?!");
    L.push("riaperta in " + dt + ", stessa impronta, Paky fa da postino, Giulia e Luca si vedono in foto");
    senzaFoto(ripresaDi("Paky"), Z.k, "la memoria della ripresa");
    await scegli(C, "Luca");
    if (!await W.aspetta(function () { return W.finestra("Paky").document.querySelector(".cn-carta"); }, 6000)) no("Paky non vede le carte");
    await scegli(C, "Paky");
    if (!await W.aspetta(function () { return vm(C).passo === "svela"; }, 8000)) no("non si svela");
    cn().fineSpia(); cn().senzaErrori();
    L.push("si va avanti");
    return L.join(" · ");
  } });

  COPIONE.aggiungi("5cn4", { nome: "Chi di Noi? (stanza di un gioco solo): l'host si spegne a metà Disegna, Giulia porta avanti; l'host torna e rientra da giocatore", fai: async function () {
    var L = [], am = ["Giulia", "Luca", "Sara"], nomi = ["Paky"].concat(am), pelli = ["#e9b48f", "#c98d6a", "#f2c9a8", "#8d5a3b"], ids = { Paky: "host" };
    var P = await W.apriTel("Paky", { x: 0, prima: cn().camFinta(pelli[0]) });
    cn().spiaBroker();
    var C = await W.apriStanza(P, "Chi di Noi?");
    if (!await W.aspetta(function () { return vm(C).kf; }, 10000)) no("la stanza non ha la chiave delle foto");
    var hash = (P.SG.creaLink({ gioco: "chidinoi", stanza: C }).split("#")[1] || ""), k = (/(?:^|&)k=([A-Za-z0-9_-]{22})/.exec(hash) || [])[1];
    if (!k) no("il link della stanza non ha la chiave («" + hash + "»)");
    // gli amici entrano uno alla volta: così i vice sono Giulia e Luca (i primi due arrivati)
    for (var i = 0; i < am.length; i++) {
      var q = i + 2;
      await W.apriTel(am[i], { hash: hash, x: 185 * (i + 1), prima: cn().camFinta(pelli[i + 1]) });
      if (!await W.aspetta(function () { return A.contaDentro(vm(C)) >= q; }, 10000)) no(am[i] + " non entra");
      ids[am[i]] = idDi(C, am[i]);
      await W.dorme(300);
    }
    var fil = ["Testa Schiacciata", "Sdoppiamento", "Faccia Liquida", "Occhioni Anime"];
    for (var j = 0; j < nomi.length; j++) await cn().selfie(nomi[j], fil[j]);
    await cn().vedonoTutti(C, nomi, nomi, 20000);
    await cn().regole(P, 3, 3, "⚡ Veloci");
    await cn().comincia(C);
    // ---- a metà Disegna: Giulia e Paky hanno finito, Luca sta disegnando ----
    if (!await cn().finoA(C, function (v) { return v.passo === "disegna"; }, 150000, { veloce: true })) no("non arriva il Disegna");
    await disegna(C, "Giulia", true); await disegna(C, "Paky", true); await disegna(C, "Luca", false);
    await W.dorme(1800);   // (la copia ai vice: al massimo una al secondo)
    var kD = vm(C).k, p0 = punti(vm(C)), fL = W.finestra("Luca").document.querySelector(".cn-tav-foglio"), sent = sentinella(am), t0 = Date.now();
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === ids.Giulia; }, 10000)) no("dopo 10 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    var pg = await A.pilloleDi(["Giulia"], /porti avanti tu/, 4000), pa = await A.pilloleDi(["Luca", "Sara"], /Ora la partita la tiene Giulia/, 5000);
    if (!pg.Giulia) no("Giulia non legge «… la porti avanti tu»");
    if (!pa.Luca || !pa.Sara) no("Luca e Sara non leggono «Ora la partita la tiene Giulia»");
    // il disegno di Giulia (lei stessa) torna da solo nella partita che tiene lei; Luca non perde la tavola
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "disegna" && v.k === kD && (v.risposto || []).indexOf(ids.Giulia) >= 0; }, 12000)) no("dopo il subentro il disegno di Giulia non c'è (" + vm(C).passo + ", risposto " + JSON.stringify(vm(C).risposto) + ")");
    if (!W.finestra("Luca").document.body.contains(fL)) no("la tavola di Luca si è ricostruita durante il subentro");
    if (punti(vm(C)) !== p0) no("dopo il subentro i punti sono cambiati");
    L.push("Giulia tiene la partita in " + dt + " s, il suo disegno resta, la tavola di Luca non si tocca");
    W.clicca(W.finestra("Luca"), /Fatto/, ".cn-btn.vai");
    await disegna(C, "Sara", true);
    if (!await W.aspetta(function () { return vm(C).passo === "vota"; }, 20000)) no("dopo il subentro non si vota la galleria (" + vm(C).passo + ")");
    if (vm(C).nGal !== 3) no("nella galleria ci sono " + vm(C).nGal + " disegni (dovevano essere 3: Paky è uscito)");
    if (!await W.aspetta(function () { return [].filter.call(W.finestra("Giulia").document.querySelectorAll(".cn-cella"), function (x) { return !x.classList.contains("vuota"); }).length === 3; }, 10000)) no("Giulia (che tiene la partita) non vede i 3 disegni");
    await cn().vedonoTutti(C, am, am, 25000);
    // ---- Paky torna: rientra da giocatore col suo posto ----
    var fino = Date.now() + 8000; while (Date.now() < fino && vm(C).fase === "gioco") await cn().giocaPasso(C, { veloce: true });
    var t1 = Date.now();
    A.torna("Paky");
    var pp = await A.pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 10000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Giulia: rientri come giocatore» («" + pill(W.finestra("Paky")) + "»)");
    if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.id === "host" && !p.via; }); }, 30000)) no("Paky non rientra al suo posto");
    if (W.finestra("Paky").document.querySelector(".saletta-schermo")) no("Paky è finito in saletta");
    L.push("Paky torna e rientra da giocatore");
    if (!await cn().finoAllaFine(C, 500000, { veloce: true })) no("la partita tenuta da Giulia non finisce (" + vm(C).fase + "/" + vm(C).passo + ")");
    await W.dorme(3000);
    var altre = A.fotoDa(C, t1 + 3000).filter(function (x) { return x.h !== ids.Giulia; });
    if (altre.length) no("dopo il ritorno di Paky ci sono foto di un altro host: " + JSON.stringify(altre.slice(0, 3)));
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== ids.Giulia) no("alla fine la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    var f = vm(C).fine; if (!f || f.classifica.length !== 4) no("la classifica non ha 4 giocatori");
    var es = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/stato") >= 0 && x.p.indexOf('"__esito"') >= 0; });
    if (es.length !== 1 || es[0].da !== "Giulia") no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di Giulia");
    var wG = W.finestra("Giulia");
    if (!await W.aspetta(function () { return /Nuova partita/.test(T(wG)); }, 20000)) no("Giulia non ha «Nuova partita» («" + T(wG).slice(0, 90) + "»)");
    // la Nuova partita di Giulia: tutti nella saletta, la corona a Giulia (prima della fila)
    W.clicca(wG, /Nuova partita/);
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "lobby" && v.tiene === ids.Giulia && (v.players || [])[0] && v.players[0].id === ids.Giulia && v.players.length === 4; }, 10000)) no("alla Nuova partita la saletta non è di Giulia coi 4 (" + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome; })) + ", tiene " + vm(C).tiene + ")");
    var ris = (W.__pub || []).filter(function (x) { return x.p.indexOf('"__ris"') >= 0; }), maxR = 0;
    ris.forEach(function (x) { if (x.p.length > maxR) maxR = x.p.length; senzaFoto(x.p, k, "una copia per il vice"); });
    if (!ris.length) no("nessuna copia per il vice è passata");
    if (maxR > 60000) no("una copia per il vice pesa " + maxR + " caratteri");
    var R = await cn().controllaRete(k);
    cn().fineSpia();
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    cn().senzaErrori();
    L.push("classifica (" + f.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + "), un __esito di Giulia, Nuova partita con la corona a Giulia; copie per il vice al massimo " + Math.round(maxR / 1000) + " KB senza foto; " + R.nFoto + " foto cifrate");
    return L.join(" · ");
  } });
})();
