// PROVE DEL PASSO 5, pezzo p5-m: il MODELLO dei giochi nuovi (.agents/skills/nuovo-gioco/modello-gioco-online.js) con la
// ripresa (riprende: true) e l'host di riserva (riserva: true). Come in passo2/modello.js il modello si registra al posto di
// un gioco online vero ("garapesca", che su quei telefoni non si registra) e si chiama «Il più veloce».
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo5/modello.js"); await COPIONE.prova("5m1")
//
// 5m1: stanza di un gioco solo (percorso di prima), Paky + Giulia + Luca. Paky ricarica in ogni fase: a metà giro (il giro
//      si rifà da capo, punti uguali), a giro deciso (si passa al prossimo, il punto non si dà due volte), sulla classifica
//      (resta la classifica, nessun esito doppio); poi «Nuova partita» → la ripresa si scorda e una ricarica in saletta
//      riporta tutti in saletta. Mai nessuno in saletta durante la partita, pillole «🔁 …», nessun errore.
// 5m2: Paky si spegne e non torna (4 telefoni, entrati uno alla volta): Giulia porta avanti la partita (_g 2, punti uguali,
//      «👑 … la porti avanti tu» / «👑 Ora la partita la tiene Giulia»), ha lei «Prossimo giro», si finisce in tre e la
//      classifica ha anche Paky; poi Paky torna e rientra da giocatore alla Nuova partita di Giulia (corona a Giulia).
// 5m3: nella Sala: Paky ricarica a metà (Sala e gioco riprendono, nessuno passa dalla Sala o dalla saletta), poi si spegne
//      e non torna: Giulia porta avanti il gioco e poi prende la Sala, si finisce, la partita conta UNA volta nella
//      Classifica della serata, «↻ Rivincita» di Giulia col 3-2-1. Più le misure dello schermo nel respiro (360x640, 412x915).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm, pill = A.pill;
  var COME = "garapesca";

  // i telefoni con opz.comeGioco non registrano quel gioco vero (il modello prende il suo posto). Uguale a passo2/modello.js
  if (!W.__pfModello) {
    var pf = W.__pfModello = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      pf.apply(this, arguments);
      if (!opz || !opz.comeGioco) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && g.id === opz.comeGioco && !g.__modello) return; return reg.apply(v, arguments); };
      } });
    };
  }
  async function testoModello() {
    var src = await (await fetch("/.agents/skills/nuovo-gioco/modello-gioco-online.js?" + Date.now())).text();
    src = src.replace('var ID = "modello";', 'var ID = "' + COME + '";').replace("SG.registra({", "SG.registra({ __modello: true,");
    if (src.indexOf("__modello") < 0 || src.indexOf('"' + COME + '"') < 0) no("non riesco a preparare il modello per la prova");
    if (!/riprende: true/.test(src) || !/riserva: true/.test(src)) no("il modello non ha riprende e riserva");
    return src;
  }
  function opzModello(src, extra) { return Object.assign({ comeGioco: COME, prima: function (w) { w.eval(src); } }, extra || {}); }
  function tocca(w) { var b = w && w.document.querySelector(".mo-tasto"); if (b) b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true })); return !!b; }
  function punti(v) { var o = {}; ((v && v.players) || []).forEach(function (p) { o[p.nome] = p.punti; }); return o; }
  function dentro(v) { return ((v && v.players) || []).filter(function (p) { return !p.via; }).length; }
  function idDi(v, nome) { var p = ((v && v.players) || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  // chi tiene il tasto «Prossimo giro»: lo tocca (true se c'era)
  function avanti(w) { var b = w && w.document.querySelector(".mo-vai"); if (b) { b.click(); return true; } return false; }
  // si gioca fino a uno stato (cond(vm) vera): quando il tasto è verde tocca chi deve (a turno), chi tiene va avanti
  async function giocaFino(C, chiTiene, chi, cond, ms) {
    var fino = Date.now() + (ms || 90000), k = 0;
    while (Date.now() < fino) {
      var v = vm(C);
      if (cond(v)) return v;
      if (v.fase === "gioco" && v.stato === "via") { tocca(chi[k++ % chi.length]); await W.aspetta(function () { return vm(C).stato !== "via" || cond(vm(C)); }, 3000); continue; }
      if (v.fase === "gioco" && v.stato === "preso" && !cond(v)) { if (avanti(chiTiene())) { await W.aspetta(function () { return vm(C).stato !== "preso"; }, 3000); continue; } }
      await W.dorme(80);
    }
    return null;
  }
  // chi passa dalla saletta (o dalla Sala) mentre si aspetta: spia ogni 100 ms. fine() → [nomi]
  function spia(nomi, sel) {
    var visti = {}, t = setInterval(function () { nomi.forEach(function (n) { var f = W.finestra(n); if (f && f.document.querySelector(sel)) visti[n] = 1; }); }, 100);
    return { fine: function () { clearInterval(t); return Object.keys(visti); } };
  }
  // Paky ricarica: aspetta la foto nuova con _r, la fase giusta e tutti dentro; controlla pillole e saletta
  async function ricaricaHost(C, amici, controlla, come) {
    var sPrima = (W.statoStanza(C) || {})._s, sp = spia(amici, ".saletta-schermo"), pa = {}, visti = {}, ph = "", perche = "", t0 = Date.now();
    function guardaPill() { amici.forEach(function (n) { var p = pill(W.finestra(n)); if (p) { visti[n] = visti[n] || []; if (visti[n].indexOf(p) < 0) visti[n].push(p); } if (/tornato/.test(p)) pa[n] = p; }); }
    var tPill = setInterval(guardaPill, 100);   // (le pillole durano poco: si guardano anche mentre la pagina di Paky si ricarica)
    if (come === "chiudiApp") await W.chiudiApp("Paky"); else await W.ricarica("Paky");
    var ok = await W.aspetta(function () {
      guardaPill();
      var p0 = pill(W.finestra("Paky")); if (/ripresa/i.test(p0)) ph = p0;
      var s = W.statoStanza(C) || {}, v = vm(C);
      if (!s._s || s._s === sPrima) { perche = "nessuna foto nuova di Paky"; return false; }
      if (!s._r) { perche = "la foto nuova non dice che la partita riprende (_r)"; return false; }
      if (!v.fase || v.fase === "lobby") { perche = "la partita è tornata in saletta"; return false; }
      if (dentro(v) < amici.length + 1) { perche = "non sono tutti di nuovo dentro (" + dentro(v) + ")"; return false; }
      var c = controlla ? controlla(v) : true;
      if (c !== true) { perche = c || "la partita non è quella di prima"; return false; }
      if (!amici.every(function (n) { return pa[n]; })) { perche = "non tutti gli amici leggono la pillola (viste: " + JSON.stringify(visti) + ")"; return false; }
      return !!ph;
    }, 12000);
    var sal = sp.fine(); clearInterval(tPill);
    if (!ok) no("dopo la ricarica di Paky: " + (perche || "Paky non legge «🔁 Partita ripresa!»") + " (fase " + vm(C).fase + ", stato " + vm(C).stato + ")");
    if (sal.length) no(sal.join(", ") + " è passato dalla saletta");
    amici.forEach(function (n) { if (!/riprende da dove era/.test(pa[n])) no(n + " legge «" + pa[n] + "»"); });
    return { dt: ((Date.now() - t0) / 1000).toFixed(1), pAmici: pa[amici[0]], pHost: ph };
  }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  // l'host apre il modello col percorso di prima (gioco=garapesca): il codice
  async function apriStanzaModello(P) {
    await W.aspetta(function () { return W.clicca(P, /apro io/) || W.clicca(P, /Apri la stanza/); }, 6000);
    await W.dorme(200); W.clicca(P, /Apri la stanza/);
    var C = await W.aspetta(function () { return A.codiceSaletta(P); }, 6000);
    if (!C) no("la stanza del modello non si apre («" + T(P).slice(0, 80) + "»)");
    return C;
  }
  // Paky apre, gli amici entrano UNO ALLA VOLTA (così i vice sono i primi due), si comincia
  async function apriModello(src, amici) {
    var w = { Paky: await W.apriTel("Paky", opzModello(src, { x: 0, hash: "gioco=" + COME })) };
    var C = await apriStanzaModello(w.Paky);
    for (var i = 0; i < amici.length; i++) {
      var quanti = i + 2;
      w[amici[i]] = await W.apriTel(amici[i], opzModello(src, { hash: "gioco=" + COME + "&stanza=" + C, x: 185 * (i + 1) }));
      if (!await W.aspetta(function () { return dentro(vm(C)) >= quanti; }, 9000)) no(amici[i] + " non entra (" + dentro(vm(C)) + ")");
    }
    if (!await W.aspetta(function () { return W.clicca(w.Paky, /Comincia/); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    return { C: C, w: w };
  }

  COPIONE.aggiungi("5m1", { nome: "Il modello: l'host ricarica a metà giro, a giro deciso, sulla classifica e in saletta", fai: async function () {
    var src = await testoModello(), Z = await apriModello(src, ["Giulia", "Luca"]), C = Z.C, am = ["Giulia", "Luca"];
    var P = function () { return W.finestra("Paky"); }, G = Z.w.Giulia, L = Z.w.Luca, fatti = [];
    // 1) a metà giro (giro 2, tasto rosso o verde): il giro si rifà da capo, punti uguali
    if (!await giocaFino(C, P, [G], function (v) { return v.giro === 2 && (v.stato === "attesa" || v.stato === "via"); }, 30000)) no("non si arriva a metà del giro 2");
    await W.dorme(700);
    var v1 = vm(C), p1 = punti(v1);
    if (v1.giro !== 2 || v1.stato === "preso") { if (!await giocaFino(C, P, [], function (v) { return v.giro === 3 && v.stato === "attesa"; }, 20000)) no("il giro non si ferma a metà"); v1 = vm(C); p1 = punti(v1); }
    var r1 = await ricaricaHost(C, am, function (v) { return v.stato === "ripresa" ? true : "stato " + v.stato; });
    var vr = vm(C);
    if (JSON.stringify(punti(vr)) !== JSON.stringify(p1)) no("dopo la ricarica i punti sono " + JSON.stringify(punti(vr)) + " invece di " + JSON.stringify(p1));
    if (!/Si va avanti tra/.test(T(G))) no("nel respiro Giulia non legge «Si va avanti tra…» («" + T(G).slice(0, 80) + "»)");
    if (!/Si riprende/.test(T(G)) || !/Si riprende/.test(T(P()))) no("nel respiro il tasto non dice «🔁 Si riprende…»");
    tocca(G); await W.dorme(300);
    if (JSON.stringify(punti(vm(C))) !== JSON.stringify(p1)) no("nel respiro un tocco ha cambiato i punti");
    if (!await W.aspetta(function () { var v = vm(C); return v.stato === "attesa" || v.stato === "via"; }, 9000)) no("dopo il respiro il gioco non riparte (stato " + vm(C).stato + ")");
    if (vm(C).giro !== v1.giro) no("il giro a metà non si è rifatto (era il " + v1.giro + ", ora il " + vm(C).giro + ")");
    fatti.push("metà giro " + v1.giro + " → rifatto, ripresa in " + r1.dt + " s");
    // 2) a giro deciso (Giulia ha preso il punto): dopo il respiro il prossimo giro, il punto non si dà due volte
    var g2 = vm(C).giro;
    if (!await giocaFino(C, P, [G], function (v) { return v.stato === "preso" && v.giro === g2; }, 15000)) no("Giulia non prende il punto del giro " + g2);
    await W.dorme(700);
    var p2 = punti(vm(C));
    await ricaricaHost(C, am, function (v) { return v.stato === "ripresa" ? true : "stato " + v.stato; });
    if (JSON.stringify(punti(vm(C))) !== JSON.stringify(p2)) no("dopo la ricarica a giro deciso i punti sono " + JSON.stringify(punti(vm(C))) + " invece di " + JSON.stringify(p2));
    if (!await W.aspetta(function () { return vm(C).giro === g2 + 1; }, 10000)) no("dopo il respiro non si passa al giro " + (g2 + 1) + " (giro " + vm(C).giro + ", stato " + vm(C).stato + ")");
    if (JSON.stringify(punti(vm(C))) !== JSON.stringify(p2)) no("il punto del giro " + g2 + " è stato dato due volte");
    fatti.push("giro " + g2 + " deciso → si passa al " + (g2 + 1) + ", punti uguali");
    // 3) sulla classifica: resta la classifica, nessun esito in più
    if (!await giocaFino(C, P, [L, G], function (v) { return v.fase === "fine"; }, 60000)) no("la partita non finisce");
    await W.dorme(900);
    var cl = JSON.stringify(vm(C).classifica), es = A.contaStoria(C, '"__esito"');
    await ricaricaHost(C, am, function (v) { return v.fase === "fine" ? true : "fase " + v.fase; });
    if (JSON.stringify(vm(C).classifica) !== cl) no("dopo la ricarica la classifica è cambiata");
    if (!await W.aspetta(function () { return /Classifica finale/.test(T(P())) && A.tastiFineDi(P()); }, 5000)) no("Paky non ritrova la classifica coi tasti («" + T(P()).slice(0, 80) + "»)");
    await W.dorme(1500);
    if (A.contaStoria(C, '"__esito"') !== es) no("dopo la ricarica sulla classifica c'è un esito in più");
    fatti.push("classifica ripresa, esiti " + es);
    // 4) «Nuova partita»: tutti in saletta, la ripresa si scorda; una ricarica in saletta → saletta come sempre
    if (!W.clicca(P(), /Nuova partita/)) no("Paky non trova «Nuova partita» («" + (A.tastiFineDi(P()) || []).join(" | ") + "»)");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" && dentro(vm(C)) === 3; }, 6000)) no("dopo «Nuova partita» non sono tutti e 3 in saletta");
    if (!await W.aspetta(function () { return !W.BR.mem.Paky.l["sg-ripresa"]; }, 3000)) no("in saletta Paky ha ancora sg-ripresa");
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "lobby" && dentro(v) === 3 && P().document.querySelector(".saletta-schermo"); }, 12000)) no("ricaricando in saletta non si torna tutti in saletta");
    errori();
    return fatti.join("; ") + "; Nuova partita → saletta senza ripresa, ricarica in saletta → saletta";
  } });

  COPIONE.aggiungi("5m2", { nome: "Il modello: l'host si spegne e non torna, Giulia porta avanti la partita", fai: async function () {
    var src = await testoModello(), am = ["Giulia", "Luca", "Sara"], Z = await apriModello(src, am), C = Z.C;
    var G = Z.w.Giulia, L = Z.w.Luca, S = Z.w.Sara, P = Z.w.Paky, idG = idDi(vm(C), "Giulia");
    if (!await giocaFino(C, function () { return P; }, [G, L], function (v) { return v.giro === 3 && v.stato === "attesa"; }, 30000)) no("non si arriva al giro 3");
    await W.dorme(1500);   // (la copia ai vice: al massimo una al secondo)
    var p0 = punti(vm(C)), t0 = Date.now();
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idG; }, 15000)) no("dopo 15 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    var pg = await A.pilloleDi(["Giulia"], /porti avanti tu/, 2500), pa = await A.pilloleDi(["Luca", "Sara"], /Ora la partita la tiene Giulia/, 3000);
    if (!pg.Giulia) no("Giulia non legge «… la porti avanti tu»");
    if (!pa.Luca || !pa.Sara) no("Luca e Sara non leggono «Ora la partita la tiene Giulia» (" + JSON.stringify(pa) + ")");
    var v = vm(C);
    if (v.tiene !== idG) no("nella foto la partita non la tiene Giulia (tiene " + v.tiene + ")");
    if (JSON.stringify(punti(v)) !== JSON.stringify(p0)) no("i punti sono " + JSON.stringify(punti(v)) + " invece di " + JSON.stringify(p0));
    if (!await W.aspetta(function () { return dentro(vm(C)) === 3; }, 8000)) no("Giulia, Luca e Sara non sono di nuovo dentro (" + dentro(vm(C)) + ")");
    var pk = (vm(C).players || []).filter(function (p) { return p.id === "host"; })[0];
    if (!pk || !pk.via) no("Paky non è «via» nella partita di Giulia (" + JSON.stringify(pk) + ")");
    // Giulia ha «Prossimo giro», gli altri il conto; si finisce in tre
    if (!await W.aspetta(function () { return vm(C).stato === "via"; }, 12000)) no("con Giulia il gioco non riparte (stato " + vm(C).stato + ")");
    tocca(L);
    if (!await W.aspetta(function () { return vm(C).stato === "preso" && G.document.querySelector(".mo-vai"); }, 4000)) no("Giulia non ha «Prossimo giro»");
    if (!await W.aspetta(function () { return !L.document.querySelector(".mo-vai") && /Si va avanti tra/.test(T(L)); }, 3000)) no("Luca ha il tasto o non legge il conto");
    if (!await giocaFino(C, function () { return G; }, [S, L, G], function (v) { return v.fase === "fine"; }, 60000)) no("con Giulia la partita non finisce");
    var cl = vm(C).classifica || [];
    if (cl.length !== 4 || !cl.some(function (r) { return r.nome === "Paky"; })) no("la classifica non ha tutti e 4 (" + JSON.stringify(cl).slice(0, 120) + ")");
    if (!await W.aspetta(function () { return A.tastiFineDi(G) && A.tastiFineDi(L); }, 5000)) no("a fine partita mancano i tasti");
    var tG = A.tastiFineDi(G).join(" | ");
    if (!/Nuova partita/.test(tG)) no("Giulia (che tiene la partita) ha «" + tG + "»");
    var ch = (["Giulia", "Luca", "Sara"]).filter(function (n) { return /La stanza è chiusa/.test(T(W.finestra(n))); });
    if (ch.length) no(ch.join(", ") + " legge «La stanza è chiusa»");
    // Paky torna: rientra da giocatore; alla Nuova partita di Giulia la corona è di Giulia
    A.torna("Paky");
    if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.id === "host" && !p.via; }); }, 10000)) no("Paky tornato non rientra al suo posto");
    W.clicca(G, /Nuova partita/);
    if (!await W.aspetta(function () { var v2 = vm(C); return v2.fase === "lobby" && dentro(v2) === 4; }, 8000)) no("alla Nuova partita di Giulia non sono in 4 in saletta (" + dentro(vm(C)) + ")");
    // la corona 👑 in saletta: a Giulia (chi tiene la partita), non a Paky che è il primo della lista
    var corona = "";
    await W.aspetta(function () { corona = [].filter.call(L.document.querySelectorAll(".sl-nome"), function (x) { return x.querySelector(".sl-cor"); }).map(function (x) { return x.textContent.replace("👑", "").trim(); }).join(","); return corona; }, 4000);
    if (corona !== "Giulia") no("in saletta la corona è di «" + corona + "» invece che di Giulia");
    errori();
    return "Giulia tiene la partita in " + dt + " s (_g 2, punti uguali), «" + pg.Giulia + "» / «" + pa.Luca + "»; si finisce in tre con Paky in classifica; Giulia ha «" + tG + "»; Paky torna e rientra; Nuova partita in 4 con la corona a Giulia";
  } });

  COPIONE.aggiungi("5m3", { nome: "Il modello nella Sala: l'host ricarica, poi si spegne; Giulia porta avanti partita e Sala", fai: async function () {
    var src = await testoModello(), am = ["Giulia", "Luca"], w = {};
    w.Paky = await W.apriTel("Paky", opzModello(src, { x: 0, salaSempre: true }));
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < am.length; i++) {
      var quanti = i + 2;
      w[am[i]] = await W.apriTel(am[i], opzModello(src, { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true }));
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === quanti; }, 10000)) no(am[i] + " non entra nella Sala");
    }
    var C = await A.lanciaDallaSala("Paky", S, "Il più veloce");
    if (!await W.aspetta(function () { return dentro(vm(C)) === 3 && A.dentro(w.Giulia) && A.dentro(w.Luca); }, 10000)) no("nel gioco della Sala non sono in 3");
    var idG = A.idInSala(S, "Giulia"), G = w.Giulia, L = w.Luca, P = function () { return W.finestra("Paky"); };
    if (!await W.aspetta(function () { return W.clicca(P(), /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    if (!await giocaFino(C, P, [G], function (v) { return v.giro === 2 && v.stato === "attesa"; }, 30000)) no("non si arriva al giro 2");
    await W.dorme(900);
    var p0 = punti(vm(C)), t0 = Date.now(), salaVista = spia(am, ".saletta-schermo, .sala-sommario");
    var r = await ricaricaHost(C, am, function (v) { return v.stato === "ripresa" ? true : "stato " + v.stato; });
    var sv = salaVista.fine();
    if (sv.length) no(sv.join(", ") + " è passato dalla Sala");
    if ((W.statoStanza(S) || {}).stanza !== C) no("dopo la ricarica la Sala non dice più il gioco (" + (W.statoStanza(S) || {}).stanza + ")");
    if (JSON.stringify(punti(vm(C))) !== JSON.stringify(p0)) no("dopo la ricarica i punti sono cambiati");
    // le misure dello schermo nel respiro
    var mis = [];
    for (var k = 0, M = [[360, 640], [412, 915]]; k < M.length; k++) {
      var f = document.getElementById("tel-Giulia"); f.style.width = M[k][0] + "px"; f.style.height = M[k][1] + "px";
      G.dispatchEvent(new G.Event("resize")); await W.dorme(300);
      var d = G.document.documentElement;
      if (d.scrollHeight > M[k][1] + 1 || d.scrollWidth > M[k][0] + 1) no("a " + M[k].join("x") + " lo schermo di Giulia scorre (" + d.scrollWidth + "x" + d.scrollHeight + ")");
      var tb = G.document.querySelector(".mo-tasto").getBoundingClientRect(); if (tb.height < 80) no("a " + M[k].join("x") + " il tasto è alto " + tb.height);
      mis.push(M[k].join("x"));
    }
    var f0 = document.getElementById("tel-Giulia"); f0.style.width = "360px"; f0.style.height = "740px"; G.dispatchEvent(new G.Event("resize"));
    if (!await W.aspetta(function () { return vm(C).stato === "attesa" || vm(C).stato === "via"; }, 10000)) no("dopo la ripresa il gioco non riparte");
    if (!await giocaFino(C, P, [L], function (v) { return v.giro === 3 && v.stato === "attesa"; }, 20000)) no("non si arriva al giro 3");
    await W.dorme(1500);
    var p1 = punti(vm(C)), punti0 = ((W.statoStanza(S) || {}).torneo || {}).n || 0;
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idG; }, 15000)) no("Giulia non prende il gioco (" + JSON.stringify(A.chiTiene(C)) + ")");
    if (JSON.stringify(punti(vm(C))) !== JSON.stringify(p1)) no("con Giulia i punti sono cambiati");
    if (!await W.aspetta(function () { return (W.statoStanza(S) || {}).gen === 2; }, 35000)) no("la Sala non passa a Giulia (gen " + (W.statoStanza(S) || {}).gen + ")");
    if ((W.statoStanza(S) || {}).stanza !== C) no("la Sala di Giulia ha perso il gioco");
    if (!G.document.querySelector(".mo-scena") || !L.document.querySelector(".mo-scena")) no("Giulia o Luca non sono più nel gioco");
    if (!await giocaFino(C, function () { return G; }, [L, G], function (v) { return v.fase === "fine"; }, 60000)) no("con Giulia la partita non finisce");
    if (!await W.aspetta(function () { return (((W.statoStanza(S) || {}).torneo || {}).n || 0) === punti0 + 1; }, 6000))
      no("la partita non conta UNA volta nella serata (" + JSON.stringify((W.statoStanza(S) || {}).torneo || null).slice(0, 120) + ")");
    if (!await W.aspetta(function () { return A.tastiFineDi(G) && A.tastiFineDi(L); }, 5000)) no("a fine partita mancano i tasti del core");
    var tG = A.tastiFineDi(G).join(" | ");
    if (!/Rivincita/.test(tG) || !/Cambia gioco/.test(tG)) no("Giulia (host della Sala ora) ha «" + tG + "»");
    W.clicca(G, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.partita === 2; }, 12000)) no("la Rivincita di Giulia non riparte da sola (fase " + vm(C).fase + ")");
    await W.dorme(1000);
    if (((W.statoStanza(S) || {}).torneo || {}).n !== punti0 + 1) no("dopo la Rivincita la serata conta " + ((W.statoStanza(S) || {}).torneo || {}).n + " partite");
    errori();
    return "ripresa nella Sala in " + r.dt + " s (nessuno dalla Sala o dalla saletta), misure " + mis.join(", ") + "; Paky spento → Giulia tiene il gioco e poi la Sala (gen 2), si finisce, la serata conta 1, Rivincita col 3-2-1";
  } });
})();
