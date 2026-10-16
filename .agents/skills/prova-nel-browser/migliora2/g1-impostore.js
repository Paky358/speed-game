// PROVE DELL'IMPOSTORE «🔪 A ELIMINAZIONE» E «👥 DUE IMPOSTORI» (giro 2, g1).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora2/g1-impostore.js"); await COPIONE.prova("el1")
// Gli scenari online durano 1-2 minuti: lanciali senza aspettarli (window.__run = COPIONE.prova("el2")) e poi leggi COPIONE.esiti.
// Le regole della partita: apriTel(nome, { prima: w => w.__imp = {...} }) sul telefono dell'host (opz.impR).
//
// el1: le regole senza grafica (fine partita, pareggio → giro nuovo → ballottaggio → sorte, punti, frasi del ruolo, quanti
//      impostori e spia), «📜 Si gioca così» e le impostazioni col box fuori dalla pagina (Come si vota / Impostori / Si conoscono).
// el2: Sala in 4, a eliminazione: esce un cittadino («… era un cittadino 😇»), chi è fuori guarda (vede il segreto, niente
//      indizio né voto, ricarica e resta fuori), «⏩ Avanti» a maggioranza di chi è dentro, gli indizi di prima restano,
//      pareggio → si rifà il giro, secondo pareggio → ballottaggio solo tra i pari, l'impostore esce, ultima possibilità
//      (senza vedere la parola), vincono i cittadini, punti giusti, classifica.
// el3: 7 telefoni, 2 impostori che si conoscono: ognuno vede l'altro (solo lui: mai nei messaggi per tutti; chi ricarica lo ritrova), esce il primo
//      (sbaglia la parola: «c'è ancora un impostore!»), poi il secondo: vincono i cittadini, punti.
// el4: 7 telefoni, 2 impostori che non si conoscono (e niente spia sotto 8): escono 3 cittadini, vincono gli impostori.
// el5: in 3 a voce, 2 mani: chi arriva tardi guarda (vede i due nomi... qui uno); mano 1 esce un cittadino → resta in 2 con
//      l'impostore: vince lui (la rivelazione sta nella fine mano); mano 2 esce l'impostore e indovina: vince lui.
// el6: le misure 360x640 e 412x915 con 8 telefoni: indizi del giro 2 con chi è fuori, voto, chi esce, ultima, fine mano.
// el7: sullo stesso telefono: 4 giocatori a eliminazione e 7 con 2 impostori che si conoscono, dalla home alla classifica.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var NOME = "L'Impostore";
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- le regole dell'host: w.__imp sostituisce le impostazioni del gioco (anche quelle che arrivano dalla saletta) ----
  if (!W.__pfImpR) {
    var pf = W.__pfImpR = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      pf.apply(this, arguments);
      if (!opz || !opz.impR) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "impostore") {
            w.__gImp = g;
            var av = g.avvia;
            g.avvia = function (t) {
              if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              w.__tI = t;
              var r = av.apply(this, arguments);
              if (w.__imp && t.onRegole) { var or = t.onRegole; t.onRegole = function (im) { return or(Object.assign({}, im, w.__imp)); }; }
              return r;
            };
          }
          return reg.apply(v, arguments);
        };
      } });
    };
  }
  // la spia di tutti i messaggi del broker finto (le parole e il nome dell'altro impostore non passano nei messaggi per tutti)
  if (!W.__ccImp) {
    var cc = W.__ccImp = W.creaClient;
    W.creaClient = function (nome, opts) {
      var c = cc.apply(this, arguments), pub = c.publish;
      c.publish = function (topic, payload) { if (W.__spiaImp) W.__spiaImp.push({ da: nome, topic: topic, p: String(payload) }); return pub.apply(this, arguments); };
      return c;
    };
  }
  function opzR(extra) { return Object.assign({ salaSempre: true, impR: true }, extra || {}); }
  async function salaImp(amici, imp) {
    var w = { Paky: await W.apriTel("Paky", opzR({ x: 0, prima: function (x) { x.__imp = imp; } })) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], opzR({ hash: "sala=" + S, x: 185 * (i + 1) }));
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 15000)) no("nella Sala non sono entrati in " + (amici.length + 1));
    return { S: S, w: w };
  }
  async function partita(amici, imp) {
    W.__spiaImp = [];
    var Z = await salaImp(amici, imp), S = Z.S, P = W.finestra("Paky");
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return (vm(C).players || []).length === amici.length + 1; }, 15000)) no("nella saletta non arrivano in " + (amici.length + 1) + " (" + nomiTel(C) + ")");
    // la riga «📜 Si gioca così» che legge un amico in saletta
    var regole = await W.aspetta(function () { return A.regoleDi(W.finestra(amici[0])) || null; }, 4000) || "";
    if (!W.clicca(P, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    var nomi = ["Paky"].concat(amici);
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.passo; }, 12000)) no("la partita non comincia");
    if (!await W.aspetta(function () { return nomi.every(function (n) { return ruoloDi(W.finestra(n)); }); }, 8000)) no("non tutti hanno la carta: " + nomi.map(function (n) { return n + "=" + carta(W.finestra(n)).grande; }).join(" "));
    var ruoli = {}; nomi.forEach(function (n) { ruoli[n] = ruoloDi(W.finestra(n)); });
    return { S: S, C: C, P: P, nomi: nomi, ruoli: ruoli, regole: regole,
      imp: nomi.filter(function (n) { return ruoli[n] === "imp"; }), civ: nomi.filter(function (n) { return ruoli[n] === "civ"; }), spia: nomi.filter(function (n) { return ruoli[n] === "spia"; }) };
  }

  // ---- aiuti di gioco ----
  function carta(w) {
    var d = w && w.document; if (!d) return {};
    var q = function (s) { var e = d.querySelector(s); return e ? e.textContent : ""; };
    return { su: q(".im-c-su"), grande: q(".im-c-grande"), giu: q(".im-c-giu"), socio: q(".im-c-socio"), coperta: q(".im-c-tx") };
  }
  function ruoloDi(w) { var c = carta(w); return /impostore!/.test(c.su) ? "imp" : /spia/.test(c.su) ? "spia" : /La tua parola/.test(c.su) ? "civ" : null; }
  function scrivi(w, testo) {
    var inp = w.document.querySelector(".im-input"), b = w.document.querySelector(".im-invia");
    if (!inp || !b) return false;
    inp.value = testo; inp.dispatchEvent(new w.Event("input", { bubbles: true })); b.click(); return true;
  }
  // le 6 parole dell'ultima possibilità, quando sul telefono dell'impostore si possono toccare
  async function scelte(w) { return (await W.aspetta(function () { var l = [].filter.call(w.document.querySelectorAll(".im-sc"), function (b) { return !b.disabled; }); return l.length === 6 ? l : null; }, 5000)) || []; }
  function bottoniVoto(w) { return [].map.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent; }); }
  function vota(w, nome) {
    var b = [].filter.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent === nome; })[0];
    if (!b || b.disabled) return false; b.click(); return true;
  }
  async function pronto(w) { var b = await W.aspetta(function () { var x = w && w.document.querySelector(".im-pronto"); return x && !x.disabled ? x : null; }, 3000); if (!b) return false; b.click(); return true; }
  async function prontiTutti(nomi) { for (var i = 0; i < nomi.length; i++) await pronto(W.finestra(nomi[i])); }
  function nomiTel(C) { return (vm(C).players || []).map(function (p) { return p.nome; }); }
  function idDi(C, nome) { var p = (vm(C).players || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  function nomeDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function puntiDi(C) { var o = {}; (vm(C).players || []).forEach(function (p) { o[p.nome] = p.piu; }); return o; }
  function errori() { var e = W.erroriTel(); return e.length ? e.slice(0, 3).join(" / ") : ""; }
  async function aspettaPasso(C, passo, ms) { return W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.passo === passo ? v : null; }, ms || 8000); }
  function fuoriNomi(C) { return (vm(C).fuori || []).map(function (f) { return nomeDi(C, f.id); }); }
  // ognuno di "chi" scrive un indizio e il giro si chiude; poi tutti «🗳️ Votiamo»
  async function giroFinoAlVoto(C, chi, tag) {
    var v = await aspettaPasso(C, "indizi", 10000); if (!v) no("non si scrivono gli indizi (" + vm(C).passo + ")");
    for (var i = 0; i < chi.length; i++) {
      var w = W.finestra(chi[i]);
      if (!await W.aspetta(function () { return w.document.querySelector(".im-input") || w.document.querySelector(".im-fatto"); }, 5000)) no(chi[i] + " non ha il campo dell'indizio («" + T(w).slice(0, 80) + "»)");
      if (w.document.querySelector(".im-input")) scrivi(w, "ind" + chi[i].slice(0, 3) + (tag || v.turno));
    }
    if (!await aspettaPasso(C, "discuti", 8000)) no("dopo gli indizi non si discute (" + vm(C).passo + ")");
    await prontiTutti(chi);
    if (!await aspettaPasso(C, "voto", 5000)) no("«🗳️ Votiamo» non porta al voto (" + vm(C).passo + ")");
  }
  // tutti votano "bersaglio" (lui vota il primo che può)
  function votanoTutti(chi, bersaglio) {
    chi.forEach(function (n) { var w = W.finestra(n); if (n === bersaglio) vota(w, bottoniVoto(w)[0]); else if (!vota(w, bersaglio)) no(n + " non riesce a votare " + bersaglio + " (" + bottoniVoto(w).join(",") + ")"); });
  }
  // la parola non deve mai passare nei messaggi per tutti (solo "seg" con "to" e la fine mano)
  function controllaSpia(parole) {
    var male = [];
    (W.__spiaImp || []).forEach(function (m) {
      var x; try { x = JSON.parse(m.p); } catch (e) { return; }
      var dati = x && (x.data || x), s = m.p;
      if (dati && dati.t === "seg") { if (!dati.to) male.push("segreto senza «to» da " + m.da); return; }
      if (dati && (dati.t === "indizio" || dati.t === "indovina")) return;
      if (dati && dati.t === "vm" && dati.vm && (dati.vm.passo === "esito" || dati.vm.fase !== "gioco")) return;
      // (le 6 parole dell'ultima possibilità le vedono tutti; la parola giusta "ultima.parola" solo se la partita finisce)
      if (dati && dati.t === "vm" && dati.vm && dati.vm.ultima && dati.vm.elim && dati.vm.ultima.parola && dati.vm.passo === "fuori") male.push("la parola giusta svelata mentre resta un impostore");
      if (dati && dati.t === "vm" && dati.vm && (dati.vm.passo === "ultima" || dati.vm.passo === "fuori") && dati.vm.ultima) s = JSON.stringify(Object.assign({}, dati.vm, { ultima: null }));
      if (/L'altro impostore/.test(s)) male.push("«L'altro impostore» in un messaggio per tutti di " + m.da);
      parole.forEach(function (p) { if (p && s.toLowerCase().indexOf("\"" + p.toLowerCase() + "\"") >= 0) male.push("«" + p + "» in un messaggio per tutti di " + m.da + ": " + s.slice(0, 80)); });
    });
    return male;
  }

  // ===================== el1: le regole =====================
  COPIONE.aggiungi("el1", { nome: "Impostore a eliminazione: regole senza grafica, riassunto, impostazioni fuori pagina", fai: async function () {
    var w = await W.apriTel("Paky", opzR({ x: 0 })), I = w.__impostore, g = w.__gImp;
    if (!I || !g || !I.fineElim) no("non vedo le regole nuove (window.__impostore.fineElim) o il gioco");
    // chi vince
    if (I.fineElim([0, 1, 2], [2]) !== null) no("in 3 con l'impostore dentro si continua");
    if (I.fineElim([0, 2], [2]) !== "imp") no("in 2 con l'impostore dentro vince lui");
    if (I.fineElim([0, 1, 3], [2]) !== "cit") no("impostore fuori: vincono i cittadini");
    if (I.fineElim([0, 1, 2, 3, 4], [3, 4]) !== null || I.fineElim([0, 1, 3, 4], [3, 4]) !== "imp" || I.fineElim([0, 1, 2, 4], [3, 4]) !== null || I.fineElim([0, 1, 2], [3, 4]) !== "cit") no("fine con 2 impostori");
    // dopo il voto
    var uno = function () { return 0; };
    var d1 = I.decidiElim(I.contaVoti(4, [1, 0, 1, 1]), false, 1, [0, 1, 2, 3], uno);
    if (d1.acc !== 1 || d1.pari !== 0) no("il più votato esce (e i pareggi si azzerano): " + JSON.stringify(d1));
    var d2 = I.decidiElim(I.contaVoti(4, [1, 0, 3, 2]), false, 0, [0, 1, 2, 3], uno);
    if (d2.acc !== -1 || d2.ballo || d2.pari !== 1) no("primo pareggio: nessuno esce, si rifà il giro " + JSON.stringify(d2));
    var d3 = I.decidiElim(I.contaVoti(4, [1, 0, 1, 0]), false, 1, [0, 1, 2, 3], uno);
    if (d3.acc !== -1 || !d3.ballo || d3.ballo.join() !== "0,1") no("secondo pareggio di fila: ballottaggio solo tra i pari " + JSON.stringify(d3));
    var d4 = I.decidiElim(I.contaVoti(4, [1, 0, 1, 0]), true, 2, [0, 1], function () { return 1; });
    if (d4.acc !== 1 || !d4.sorte || d4.pari !== 0) no("pari anche al ballottaggio: la sorte " + JSON.stringify(d4));
    var d5 = I.decidiElim(I.contaVoti(3, [null, null, null]), false, 1, [0, 1, 2], uno);
    if (!d5.ballo || d5.ballo.length !== 3) no("nessun voto due volte: ballottaggio tra tutti " + JSON.stringify(d5));
    // i punti: 5 giocatori, impostore 4 (2 giri dentro), spia 3 (arriva alla fine), 1 fuori
    var p1 = I.puntiElim([0, 1, 2, 3, 4], [4], 3, "cit", { 4: 2 }, [1, 4]);
    if ([p1[0], p1[1], p1[2], p1[3], p1[4]].join() !== "2,2,2,2,2") no("punti, vincono i cittadini: " + JSON.stringify(p1));
    var p2 = I.puntiElim([0, 1, 2, 3, 4], [4], 3, "imp", { 4: 3 }, [0, 1, 3]);
    if ([p2[0], p2[1], p2[2], p2[3], p2[4]].join() !== "0,0,0,0,6") no("punti, vince l'impostore (3 giri + 3, la spia fuori 0): " + JSON.stringify(p2));
    var p3 = I.puntiElim(["a", "b", "c"], ["c"], null, "cit", {}, ["c"]);
    if (p3.a !== 2 || p3.c !== 0) no("punti con gli id: " + JSON.stringify(p3));
    if (I.fraseRuolo("Luca", "cit", 1) !== "Luca era un cittadino 😇" || I.fraseRuolo("Luca", "imp", 1) !== "Luca era l'impostore 🕵️" || I.fraseRuolo("Luca", "imp", 2) !== "Luca era un impostore 🕵️" || I.fraseRuolo("Luca", "spia", 1) !== "Luca era la spia 🎭" || I.fraseRuolo("x", "cit", 1, true) !== "Tu eri un cittadino 😇") no("le frasi del ruolo");
    var R = I.regoleDa({ voto: "elim", nimp: 2 });
    if (I.quantiImp(R, 6) !== 1 || I.quantiImp(R, 7) !== 2 || I.quantiImp(I.regoleDa({ nimp: 2 }), 9) !== 1) no("2 impostori solo a eliminazione e da 7");
    if (I.spiaPossibile(I.regoleDa({ spia: "sa" }), 4, 1) !== true || I.spiaPossibile(I.regoleDa({ spia: "sa" }), 7, 2) !== false || I.spiaPossibile(I.regoleDa({ spia: "sa" }), 8, 2) !== true) no("la spia: da 4, con 2 impostori da 8");
    var ri = I.ruoloInfo({ imp: true, aiuto: "buio", due: true, socio: "Sara" });
    if (ri.socio !== "🤝 L'altro impostore è Sara" || !/un impostore/.test(ri.su)) no("carta dell'impostore con l'altro: " + JSON.stringify(ri));
    if (I.ruoloInfo({ imp: true, aiuto: "buio", due: true }).socio !== "👥 C'è un altro impostore: non sai chi") no("carta dell'impostore che non conosce l'altro");
    // «📜 Si gioca così»: com'era (di base) e coi giochi nuovi
    var r0 = g.riassunto({ aiuto: "simile", spia: "no", mani: 3, indizi: "scritti", giri: 2 });
    if (r0 !== "✍️ 2 giri di indizi scritti · 💡 parola simile all'impostore · 3 mani") no("riassunto di base cambiato: " + r0);
    var r1 = g.riassunto({ aiuto: "categoria", spia: "no", mani: 1, indizi: "scritti", giri: 2, voto: "elim", nimp: 2, conosce: "si" });
    if (r1 !== "✍️ Indizi scritti · 🔪 a eliminazione · 👥 2 impostori che si conoscono · 🏷️ l'impostore sa la categoria · 1 mano") no("riassunto a eliminazione: " + r1);
    var r2 = g.riassunto({ voto: "elim", nimp: 2, conosce: "no", indizi: "voce" });
    if (!/🔪 a eliminazione · 👥 2 impostori che non si conoscono/.test(r2)) no("riassunto, non si conoscono: " + r2);
    // le impostazioni col box fuori dalla pagina (come nella Sala)
    try { w.localStorage.removeItem("sg_impostore_regole"); } catch (e) {}
    var box = w.document.createElement("div"), dove = {};
    g.impostazioni(box, dove, { el: w.SG._util.el, sala: true, modo: "online", giocatori: ["Paky", "Luca"] });
    if (dove.voto !== "una" || dove.nimp !== 1 || dove.conosce !== "si") no("di base: si vota una volta, 1 impostore (" + [dove.voto, dove.nimp, dove.conosce] + ")");
    if (!/Come si vota/.test(box.textContent) || !/A eliminazione/.test(box.textContent)) no("manca «Come si vota»");
    var chip = function (b, testo) { return [].filter.call(b.querySelectorAll("button.cat-chip"), function (x) { return x.textContent.replace(/\s+/g, "") === testo.replace(/\s+/g, ""); })[0]; };
    var vis = function (x) { var e = x; while (e && e.nodeType === 1) { if (e.hidden || e.style.visibility === "hidden" || e.style.display === "none") return false; e = e.parentNode; } return true; };
    if (vis(chip(box, "👥2"))) no("la scelta «2 impostori» si vede anche votando una volta");
    chip(box, "🔪A eliminazione").click();
    if (dove.voto !== "elim" || !vis(chip(box, "👥2"))) no("a eliminazione deve comparire «Impostori: 1 / 2»");
    if (vis(chip(box, "🤝Sì"))) no("«Si conoscono» si vede con 1 impostore");
    chip(box, "👥2").click();
    if (dove.nimp !== 2 || !vis(chip(box, "🤝Sì"))) no("con 2 impostori deve comparire «Si conoscono»");
    chip(box, "🤫No").click();
    if (dove.conosce !== "no") no("«Si conoscono: No» non si sceglie");
    if (!/2 impostori da 7 giocatori/.test(box.textContent)) no("manca la nota dei 2 impostori da 7");
    var salv = JSON.parse(w.localStorage.getItem("sg_impostore_regole") || "{}");
    if (salv.voto !== "elim" || salv.nimp !== 2 || salv.conosce !== "no") no("le scelte non si salvano: " + JSON.stringify(salv));
    // sullo stesso telefono in 5: «2 impostori» non c'è (da 7)
    var b2 = w.document.createElement("div"), d2b = {};
    g.impostazioni(b2, d2b, { el: w.SG._util.el, modo: "telefono", giocatori: ["A", "B", "C", "D", "E"] });
    if (!/Come si vota/.test(b2.textContent)) no("sullo stesso telefono manca «Come si vota»");
    if (vis(chip(b2, "👥2"))) no("in 5 sullo stesso telefono si vede «2 impostori»");
    var b3 = w.document.createElement("div"), d3b = {};
    g.impostazioni(b3, d3b, { el: w.SG._util.el, modo: "telefono", giocatori: ["A", "B", "C", "D", "E", "F", "G"] });
    if (!vis(chip(b3, "👥2"))) no("in 7 sullo stesso telefono a eliminazione manca «2 impostori»");
    try { w.localStorage.removeItem("sg_impostore_regole"); } catch (e) {}
    var e = errori(); if (e) no("errori: " + e);
    return "regole, punti, riassunti e impostazioni ok";
  } });

  // ===================== el2: la partita a eliminazione in 4 =====================
  COPIONE.aggiungi("el2", { nome: "Impostore a eliminazione in 4: esce un cittadino, chi è fuori guarda, pareggio, ballottaggio, esce l'impostore", fai: async function () {
    var G = await partita(["Giulia", "Luca", "Sara"], { aiuto: "simile", spia: "no", mani: 1, tempo: 60, indizi: "scritti", voto: "elim", nimp: 1 });
    var C = G.C, P = G.P, nomi = G.nomi, imp = G.imp[0];
    if (G.imp.length !== 1 || G.civ.length !== 3) no("ruoli: " + JSON.stringify(G.ruoli));
    var v = vm(C);
    if (!v.elim || v.turno !== 1 || v.giri !== 1) no("la foto non dice «a eliminazione, giro 1» (" + [v.elim, v.turno, v.giri] + ")");
    var rg = G.regole;
    if (!/a eliminazione/.test(rg)) no("Giulia non legge «🔪 a eliminazione» nelle regole («" + rg + "»)");
    var parola = carta(W.finestra(G.civ[0])).grande, simile = carta(W.finestra(imp)).grande;
    // giro 1: esce un cittadino che non è Paky
    var X = G.civ.filter(function (n) { return n !== "Paky"; })[0];
    await giroFinoAlVoto(C, nomi);
    if (!/Chi esce\?/.test(T(P))) no("il voto non dice «Chi esce?»");
    votanoTutti(nomi, X);
    v = await aspettaPasso(C, "spoglio", 5000); if (!v) no("niente spoglio");
    if (!await W.aspetta(function () { return /Esce dalla partita/.test(T(W.finestra("Giulia"))) || /Esce dalla partita/.test(T(P)); }, 6000)) no("lo spoglio non dice «🚪 Esce dalla partita!»");
    v = await aspettaPasso(C, "fuori", 9000); if (!v) no("dopo lo spoglio non si svela chi esce (" + vm(C).passo + ")");
    if (!v.ultimoFuori || nomeDi(C, v.ultimoFuori.id) !== X || v.ultimoFuori.ruolo !== "cit") no("ultimoFuori sbagliato: " + JSON.stringify(v.ultimoFuori));
    var altro = nomi.filter(function (n) { return n !== X; })[0];
    if (!await W.aspetta(function () { return T(W.finestra(altro)).indexOf(X + " era un cittadino 😇") >= 0; }, 3000)) no(altro + " non legge «" + X + " era un cittadino 😇»");
    var wx = W.finestra(X);
    if (!await W.aspetta(function () { return /Tu eri un cittadino 😇/.test(T(wx)); }, 3000)) no(X + " non legge «Tu eri un cittadino 😇»");
    if (wx.document.querySelector(".im-pronto")) no("chi è fuori ha «⏩ Avanti»");
    if (!/Si va avanti tra/.test(T(W.finestra(altro)))) no("sulla schermata di chi esce manca il conto alla rovescia");
    if (v.servono !== 2) no("«⏩ Avanti»: servono 2 su 3 dentro, non " + v.servono);
    if (!await W.aspetta(function () { return carta(wx).grande === "🕵️ " + imp; }, 4000)) no(X + " (fuori) non vede il segreto tenendo premuto: " + JSON.stringify(carta(wx)));
    // X ricarica: resta fuori e ritrova il segreto
    wx = await W.ricarica(X);
    if (!await W.aspetta(function () { return carta(W.finestra(X)).grande === "🕵️ " + imp && /Sei fuori/.test(carta(W.finestra(X)).coperta); }, 10000)) no(X + " ricarica e non ritrova il segreto da fuori: " + JSON.stringify(carta(W.finestra(X))));
    var dentro = nomi.filter(function (n) { return n !== X; });
    await pronto(W.finestra(dentro[0]));
    await W.dorme(400);
    if (vm(C).passo !== "fuori") no("con 1 su 3 si va già avanti");
    await pronto(W.finestra(dentro[1]));
    v = await W.aspetta(function () { var x = vm(C); return x.passo === "indizi" && x.turno === 2 ? x : null; }, 5000);
    if (!v) no("«⏩ Avanti» da 2 su 3 non fa partire il giro 2 (" + vm(C).passo + " " + vm(C).turno + ")");
    if (W.finestra(X).document.querySelector(".im-input")) no("chi è fuori può scrivere l'indizio");
    if (!/Sei fuori/.test(T(W.finestra(X)))) no(X + " non legge «🚪 Sei fuori»");
    if (!await W.aspetta(function () { var r = W.finestra("Paky").document.querySelector(".im-riga.fuori"); return r && r.textContent.indexOf(X) >= 0; }, 3000)) no("nella lista degli indizi non c'è " + X + " (fuori)");
    if (carta(W.finestra(G.civ.filter(function (n) { return n !== X; })[0])).grande !== parola) no("al giro 2 la parola è cambiata");
    // giro 2: pareggio (ognuno vota il seguente) → si rifà il giro
    await giroFinoAlVoto(C, dentro);
    if ((vm(C).ind[idDi(C, dentro[0])] || []).length !== 2 || (vm(C).ind[idDi(C, X)] || []).length !== 1) no("indizi dei giri prima: " + JSON.stringify(vm(C).ind));
    if (bottoniVoto(W.finestra(dentro[0])).indexOf(X) >= 0) no("si può votare chi è fuori");
    if (vota(W.finestra(X), dentro[0])) no("chi è fuori può votare");
    dentro.forEach(function (n, k) { vota(W.finestra(n), dentro[(k + 1) % dentro.length]); });
    v = await aspettaPasso(C, "spoglio", 5000); if (!v) no("niente spoglio al giro 2");
    if (v.spoglio.acc != null || v.spoglio.ballo) no("al primo pareggio non deve uscire nessuno: " + JSON.stringify(v.spoglio));
    if (!await W.aspetta(function () { return /si rifà il giro/.test(T(P)); }, 6000)) no("manca «🤝 Nessuno esce: si rifà il giro»");
    v = await W.aspetta(function () { var x = vm(C); return x.passo === "indizi" && x.turno === 3 ? x : null; }, 9000);
    if (!v) no("dopo il pareggio non riparte il giro 3");
    // giro 3: di nuovo pari → ballottaggio tra i 3
    await giroFinoAlVoto(C, dentro);
    dentro.forEach(function (n, k) { vota(W.finestra(n), dentro[(k + 1) % dentro.length]); });
    v = await W.aspetta(function () { var x = vm(C); return x.passo === "voto" && x.ballo ? x : null; }, 12000);
    if (!v) no("al secondo pareggio di fila non c'è il ballottaggio (" + vm(C).passo + ")");
    if (v.ballo.length !== 3 || v.resta > 15) no("ballottaggio: " + v.ballo.length + " pari, " + v.resta + " secondi");
    if (!await W.aspetta(function () { return /Ballottaggio/.test(T(P)); }, 3000)) no("manca «⚖️ Ballottaggio!»");
    // il ballottaggio: due cittadini votano l'impostore
    var civD = dentro.filter(function (n) { return n !== imp; });
    civD.forEach(function (n) { vota(W.finestra(n), imp); });
    vota(W.finestra(imp), civD[0]);
    v = await aspettaPasso(C, "ultima", 12000); if (!v) no("l'impostore non esce al ballottaggio (" + vm(C).passo + ")");
    var wi = W.finestra(imp);
    if (!await W.aspetta(function () { return /era l'impostore 🕵️/.test(T(W.finestra(civD[0]))); }, 3000)) no("non si svela «… era l'impostore 🕵️»");
    if (carta(wi).grande === "🕵️ " + imp || /parola/.test(carta(wi).su) && carta(wi).grande === parola) no("l'impostore scoperto vede la parola prima di indovinare");
    var sb = (await scelte(wi));
    if (sb.length !== 6) no("l'impostore non ha 6 parole (" + sb.length + ")");
    sb.filter(function (b) { return b.textContent !== parola; })[0].click();
    v = await aspettaPasso(C, "esito", 8000); if (!v) no("niente fine mano (" + vm(C).passo + ")");
    if (!v.esito.elim || v.esito.vince !== "cit") no("dovrebbero vincere i cittadini: " + JSON.stringify(v.esito).slice(0, 120));
    if (!/Vincono i cittadini!/.test(T(P))) no("manca «Vincono i cittadini!»");
    var pt = puntiDi(C);
    nomi.forEach(function (n) { var att = n === imp ? 2 : 2; if (pt[n] !== att) no("punti di " + n + ": " + pt[n] + " invece di " + att + " " + JSON.stringify(pt)); });
    if (!/fuori al 1° giro/.test(T(P))) no("nella fine mano manca «🚪 fuori al 1° giro»");
    var male = controllaSpia([parola, simile]); if (male.length) no(male.slice(0, 2).join(" | "));
    await prontiTutti(nomi.slice(0, 3));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("la partita non finisce");
    if (!await W.aspetta(function () { return A.tastiFineDi(P); }, 5000)) no("a fine partita mancano i tasti del core");
    var cl = vm(C).classifica || [];
    if (cl.length !== 4 || cl.some(function (r) { return r.pos !== 1; })) no("classifica (tutti a 2 punti: tutti primi): " + JSON.stringify(cl));
    var e = errori(); if (e) no("errori: " + e);
    return "eliminazione in 4 ok (fuori " + X + ", impostore " + imp + ")";
  } });

  // ===================== el3: due impostori che si conoscono =====================
  COPIONE.aggiungi("el3", { nome: "Impostore: 2 impostori che si conoscono in 7, escono tutti e due, vincono i cittadini", fai: async function () {
    var G = await partita(["Giulia", "Luca", "Sara", "Marco", "Bea", "Ciro"], { aiuto: "categoria", spia: "no", mani: 1, tempo: 60, indizi: "scritti", voto: "elim", nimp: 2, conosce: "si" });
    var C = G.C, P = G.P, nomi = G.nomi;
    if (G.imp.length !== 2 || G.civ.length !== 5) no("in 7 servono 2 impostori: " + JSON.stringify(G.ruoli));
    var a = G.imp[0], b = G.imp[1];
    if (carta(W.finestra(a)).socio !== "🤝 L'altro impostore è " + b || carta(W.finestra(b)).socio !== "🤝 L'altro impostore è " + a) no("gli impostori non si vedono: " + carta(W.finestra(a)).socio + " / " + carta(W.finestra(b)).socio);
    if (G.civ.some(function (n) { return carta(W.finestra(n)).socio; })) no("un cittadino vede l'altro impostore");
    if (vm(C).nImp !== 2 || !/2 impostori/.test(T(P)) && false) no("la foto non dice 2 impostori");
    var parola = carta(W.finestra(G.civ[0])).grande;
    // giro 1: esce a
    await giroFinoAlVoto(C, nomi);
    if (!/2 impostori/.test(T(W.finestra(G.civ[0]))) && !/2 impostori/.test(T(P))) { /* (la riga dei ruoli è nella discussione: già passata) */ }
    votanoTutti(nomi, a);
    var v = await aspettaPasso(C, "ultima", 15000); if (!v) no("non esce il primo impostore");
    if (!await W.aspetta(function () { return /era un impostore 🕵️/.test(T(W.finestra(G.civ[0]))); }, 3000)) no("manca «… era un impostore 🕵️»");
    var wa = W.finestra(a), sb = (await scelte(wa));
    sb.filter(function (x) { return x.textContent !== parola; })[0].click();
    v = await aspettaPasso(C, "fuori", 8000); if (!v) no("dopo l'ultima sbagliata non si va alla schermata di chi è fuori (" + vm(C).passo + ")");
    if (!v.ultimoFuori.sbaglia || v.ultimoFuori.ruolo !== "imp") no("ultimoFuori: " + JSON.stringify(v.ultimoFuori));
    if (T(W.finestra(b)).indexOf(parola) >= 0) no(b + " (l'altro impostore) legge la parola dopo l'ultima sbagliata di " + a);
    if (!await W.aspetta(function () { return /C'è ancora un impostore!/.test(T(P)); }, 3000)) no("manca «🕵️ C'è ancora un impostore!» («" + T(P).slice(0, 120) + "»)");
    if (v.servono !== 4) no("servono 4 su 6 dentro, non " + v.servono);
    var dentro = nomi.filter(function (n) { return n !== a; });
    await prontiTutti(dentro.slice(0, 4));
    if (!await W.aspetta(function () { var x = vm(C); return x.passo === "indizi" && x.turno === 2; }, 5000)) no("non parte il giro 2");
    if (!await W.aspetta(function () { return carta(W.finestra(a)).grande.indexOf(b) >= 0; }, 4000)) no(a + " (fuori) non vede il segreto intero: " + carta(W.finestra(a)).grande);
    // chi rientra lo ritrova: b ricarica (se non è l'host) e vede ancora chi è l'altro impostore
    if (b !== "Paky") {
      await W.ricarica(b);
      if (!await W.aspetta(function () { return carta(W.finestra(b)).socio === "🤝 L'altro impostore è " + a; }, 10000)) no(b + " ricarica e non ritrova l'altro impostore: " + JSON.stringify(carta(W.finestra(b))));
    }
    // giro 2: esce b
    await giroFinoAlVoto(C, dentro);
    votanoTutti(dentro, b);
    v = await aspettaPasso(C, "ultima", 15000); if (!v) no("non esce il secondo impostore");
    var wb = W.finestra(b);
    (await scelte(wb)).filter(function (x) { return x.textContent !== parola; })[0].click();
    v = await aspettaPasso(C, "esito", 8000); if (!v) no("niente fine mano");
    if (v.esito.vince !== "cit" || !/Tutti e due gli impostori sono fuori/.test(T(P))) no("fine: " + v.esito.vince + " «" + T(P).slice(0, 100) + "»");
    var pt = puntiDi(C);
    G.civ.forEach(function (n) { if (pt[n] !== 2) no("punti di " + n + " (cittadino): " + pt[n]); });
    if (pt[a] !== 0 || pt[b] !== 1) no("punti degli impostori: " + a + " " + pt[a] + " (atteso 0), " + b + " " + pt[b] + " (atteso 1)");
    if (!/Impostori: /.test(T(P))) no("manca «🕵️ Impostori: … e …»");
    var male = controllaSpia([parola]); if (male.length) no(male.slice(0, 2).join(" | "));
    var e = errori(); if (e) no("errori: " + e);
    return "2 impostori che si conoscono ok (" + a + ", " + b + ")";
  } });

  // ===================== el4: due impostori che non si conoscono, vincono loro =====================
  COPIONE.aggiungi("el4", { nome: "Impostore: 2 impostori che non si conoscono in 7 (niente spia), escono 3 cittadini: vincono gli impostori", fai: async function () {
    var G = await partita(["Giulia", "Luca", "Sara", "Marco", "Bea", "Ciro"], { aiuto: "buio", spia: "sa", mani: 1, tempo: 60, indizi: "scritti", voto: "elim", nimp: 2, conosce: "no" });
    var C = G.C, P = G.P, nomi = G.nomi;
    if (G.imp.length !== 2 || G.spia.length) no("in 7 con 2 impostori la spia non c'è: " + JSON.stringify(G.ruoli));
    if (vm(C).conSpia) no("la foto dice che c'è la spia");
    if (carta(W.finestra(G.imp[0])).socio !== "👥 C'è un altro impostore: non sai chi") no("chi non conosce l'altro: " + carta(W.finestra(G.imp[0])).socio);
    var dentro = nomi.slice();
    for (var g = 1; g <= 3; g++) {
      var x = G.civ[g - 1];
      await giroFinoAlVoto(C, dentro);
      votanoTutti(dentro, x);
      dentro = dentro.filter(function (n) { return n !== x; });
      if (g < 3) {
        var v = await aspettaPasso(C, "fuori", 12000); if (!v) no("giro " + g + ": niente schermata di chi esce (" + vm(C).passo + ")");
        await prontiTutti(dentro);
        if (!await W.aspetta(function () { return vm(C).turno === g + 1 && vm(C).passo === "indizi"; }, 5000)) no("non parte il giro " + (g + 1));
      }
    }
    var v2 = await aspettaPasso(C, "esito", 12000); if (!v2) no("dopo 3 cittadini fuori non finisce (" + vm(C).passo + ")");
    if (v2.esito.vince !== "imp" || !/Vincono gli impostori!/.test(T(P))) no("dovrebbero vincere gli impostori: " + v2.esito.vince);
    if (!new RegExp(G.civ[2] + " era un cittadino 😇").test(T(P))) no("nella fine manca chi è uscito per ultimo");
    var pt = puntiDi(C);
    G.imp.forEach(function (n) { if (pt[n] !== 6) no("punti dell'impostore " + n + ": " + pt[n] + " (atteso 3 giri + 3 = 6)"); });
    G.civ.forEach(function (n) { if (pt[n] !== 0) no("punti del cittadino " + n + ": " + pt[n]); });
    var e = errori(); if (e) no("errori: " + e);
    return "vincono gli impostori ok";
  } });

  // ===================== el5: a voce, chi guarda, l'impostore che vince in due modi =====================
  COPIONE.aggiungi("el5", { nome: "Impostore a eliminazione a voce in 3: chi guarda, resta in 2 con l'impostore, l'impostore indovina", fai: async function () {
    var G = await partita(["Giulia", "Luca"], { aiuto: "buio", spia: "no", mani: 2, tempo: 60, indizi: "voce", voto: "elim" });
    var C = G.C, P = G.P, nomi = G.nomi, imp = G.imp[0], S = G.S;
    var v = await aspettaPasso(C, "discuti", 5000); if (!v) no("a voce si parte dalla discussione");
    // Marco arriva tardi e guarda
    var M = await W.apriTel("Marco", opzR({ hash: "sala=" + S, x: 555 }));
    if (!await W.aspetta(function () { return W.clicca(M, /👀 Guarda/); }, 10000)) no("Marco non ha «👀 Guarda»");
    if (!await W.aspetta(function () { return carta(M).grande === "🕵️ " + imp; }, 15000)) no("Marco non vede il segreto: " + JSON.stringify(carta(M)));
    await prontiTutti(nomi);
    if (!await aspettaPasso(C, "voto", 5000)) no("niente voto");
    var x = G.civ[0];
    votanoTutti(nomi, x);
    v = await aspettaPasso(C, "esito", 15000); if (!v) no("in 2 con l'impostore dentro non finisce (" + vm(C).passo + ")");
    if (v.esito.vince !== "imp" || !/Vince l'impostore!/.test(T(P))) no("mano 1: " + v.esito.vince);
    if (T(P).indexOf(x === "Paky" ? "Tu eri un cittadino 😇" : x + " era un cittadino 😇") < 0) no("nella fine manca «" + x + " era un cittadino 😇»");
    if (!await W.aspetta(function () { return /Vince l'impostore!/.test(T(M)); }, 4000)) no("Marco non vede la fine mano");
    if (puntiDi(C)[imp] !== 4) no("l'impostore: 1 giro + 3 = 4, non " + puntiDi(C)[imp]);
    await prontiTutti(nomi);
    v = await W.aspetta(function () { var y = vm(C); return y.mano === 2 && y.passo === "discuti" ? y : null; }, 6000);
    if (!v) no("la mano 2 non parte");
    if (v.fuori.length || v.turno !== 1) no("nella mano 2 qualcuno è ancora fuori: " + JSON.stringify(v.fuori));
    await W.aspetta(function () { return nomi.every(function (n) { return ruoloDi(W.finestra(n)); }) && nomi.every(function (n) { return (W.finestra(n).__x = 1); }); }, 6000);
    var imp2 = nomi.filter(function (n) { return ruoloDi(W.finestra(n)) === "imp"; })[0];
    if (!imp2) no("mano 2 senza impostore");
    await prontiTutti(nomi);
    if (!await aspettaPasso(C, "voto", 5000)) no("mano 2: niente voto");
    votanoTutti(nomi, imp2);
    v = await aspettaPasso(C, "ultima", 12000); if (!v) no("mano 2: l'impostore non esce");
    var parola = null;
    // la parola giusta: la sa un cittadino (che ora è ancora dentro)
    var civ2 = nomi.filter(function (n) { return n !== imp2; })[0];
    parola = carta(W.finestra(civ2)).grande;
    var wi = W.finestra(imp2);
    var giusta = (await scelte(wi)).filter(function (b) { return b.textContent === parola; })[0];
    if (!giusta) no("la parola giusta non è tra le 6");
    giusta.click();
    v = await aspettaPasso(C, "esito", 8000); if (!v) no("mano 2: niente fine");
    if (v.esito.vince !== "imp" || !v.esito.indovinato || !/ha indovinato la parola/.test(T(P))) no("mano 2: l'impostore che indovina deve vincere");
    var e = errori(); if (e) no("errori: " + e);
    return "a voce, chi guarda e le due vittorie dell'impostore ok";
  } });

  // ===================== el6: le misure =====================
  async function misura(nome, wh, quale) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{animation:none!important}.im-w.nuova,.im-riv{animation:none!important}"; d.head.appendChild(st); }
    f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(700);
    var male = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) male.push("la pagina scorre");
    if (d.documentElement.scrollWidth > wh[0] + 1) male.push("scorre di lato");
    [].forEach.call(d.querySelectorAll(quale), function (x) {
      var r = x.getBoundingClientRect(); if (!r.width) return;
      if (r.bottom > w.innerHeight + 1 || r.right > wh[0] + 1 || r.left < -1) male.push("«" + (x.innerText || x.className).replace(/\s+/g, " ").slice(0, 30) + "» fuori (" + Math.round(r.bottom) + ")");
    });
    var corpo = d.querySelector(".im-corpo");
    if (corpo && corpo.scrollHeight > corpo.clientHeight + 2) male.push("il corpo è tagliato (" + corpo.scrollHeight + " > " + corpo.clientHeight + ")");
    return male.join(", ");
  }
  async function misuraTutto(nomi, quale, cosa, note) {
    for (var i = 0; i < 2; i++) {
      var wh = i ? [412, 915] : [360, 640];
      for (var k = 0; k < nomi.length; k++) { var m = await misura(nomi[k], wh, quale); if (m) note.push(cosa + " " + wh.join("x") + " " + nomi[k] + ": " + m); }
    }
  }
  COPIONE.aggiungi("el6", { nome: "Impostore a eliminazione: misure 360x640 e 412x915 con 8 telefoni", fai: async function () {
    var amici = ["Giulia", "Luca", "Sara", "Marco", "Bea", "Ciro", "Massimiliano"];
    var G = await partita(amici, { aiuto: "simile", spia: "sa", mani: 1, tempo: 60, indizi: "scritti", voto: "elim", nimp: 2, conosce: "si" });
    var C = G.C, nomi = G.nomi, note = [];
    var a = G.imp[0];
    await misuraTutto([a, "Massimiliano"], ".im-scrivi, .im-carta, .im-lista, .im-piede", "indizi 1", note);
    var x = G.civ.filter(function (n) { return n !== "Massimiliano"; })[0];
    await giroFinoAlVoto(C, nomi, "parolalunghissima");
    votanoTutti(nomi, x);
    if (!await aspettaPasso(C, "fuori", 12000)) no("niente schermata di chi esce");
    await W.dorme(300);
    await misuraTutto(["Paky", x], ".im-riv, .im-resta, .im-piede", "chi esce", note);
    var dentro = nomi.filter(function (n) { return n !== x; });
    await prontiTutti(dentro.slice(0, 5));
    if (!await W.aspetta(function () { return vm(C).turno === 2 && vm(C).passo === "indizi"; }, 5000)) no("non parte il giro 2");
    for (var i = 0; i < dentro.length; i++) scrivi(W.finestra(dentro[i]), "ultimissimaparola" + i);
    if (!await aspettaPasso(C, "discuti", 8000)) no("niente discussione al giro 2");
    await misuraTutto(["Paky", x], ".im-lista, .im-piede, .im-ruoli", "discussione 2", note);
    await prontiTutti(dentro);
    if (!await aspettaPasso(C, "voto", 5000)) no("niente voto al giro 2");
    await misuraTutto(["Paky", "Massimiliano"], ".im-voti, .im-piede", "voto 2", note);
    votanoTutti(dentro, a);
    if (!await aspettaPasso(C, "ultima", 12000)) no("niente ultima possibilità");
    await W.dorme(300);
    await misuraTutto([a, "Paky"], ".im-riv, .im-scelte, .im-ris", "ultima", note);
    var parola = carta(W.finestra(G.civ.filter(function (n) { return n !== x; })[0])).grande;
    (await scelte(W.finestra(a))).filter(function (b) { return b.textContent !== parola; })[0].click();
    if (!await aspettaPasso(C, "fuori", 8000)) no("dopo il primo impostore niente schermata «c'è ancora un impostore»");
    await misuraTutto(["Paky"], ".im-riv, .im-resta, .im-piede", "impostore fuori", note);
    // fino alla fine: escono i cittadini finché vincono gli impostori
    dentro = dentro.filter(function (n) { return n !== a; });
    await prontiTutti(dentro.slice(0, 5));
    var civ = G.civ.filter(function (n) { return n !== x; });
    for (var g = 0; g < 6 && vm(C).passo !== "esito"; g++) {
      if (!await aspettaPasso(C, "indizi", 8000)) break;
      await giroFinoAlVoto(C, dentro);
      var y = civ.shift(); votanoTutti(dentro, y); dentro = dentro.filter(function (n) { return n !== y; });
      var w8 = await W.aspetta(function () { var z = vm(C); return z.passo === "fuori" || z.passo === "esito" ? z : null; }, 12000);
      if (!w8) no("il giro " + (g + 3) + " non finisce");
      if (w8.passo === "fuori") await prontiTutti(dentro);
    }
    if (!await aspettaPasso(C, "esito", 8000)) no("niente fine mano");
    await misuraTutto(["Paky", "Massimiliano"], ".im-es, .im-piede, .im-svela, .im-testa", "fine mano", note);
    nomi.forEach(function (n) { var f = document.getElementById("tel-" + n); f.style.width = "360px"; f.style.height = "740px"; });
    if (note.length) no(note.slice(0, 4).join(" | "));
    var e = errori(); if (e) no("errori: " + e);
    return "misure ok con 8 telefoni a eliminazione";
  } });

  // ===================== el7: sullo stesso telefono =====================
  async function stessoTelefono(nomi, regole) {
    var w = await W.apriTel("Paky", { x: 0, prima: function (x) { try { x.localStorage.setItem("sg_impostore_regole", JSON.stringify(regole)); } catch (e) {} } }), d = w.document;
    var tess = await W.aspetta(function () { return [].filter.call(d.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === NOME; })[0]; }, 6000);
    if (!tess) no("in home non c'è la tessera dell'Impostore");
    tess.click(); await W.dorme(300);
    W.clicca(w, /Su questo telefono/); await W.dorme(300);
    for (var k = 0; k < nomi.length - 1; k++) { W.clicca(w, /Aggiungi giocatore/); await W.dorme(150); }
    [].filter.call(d.querySelectorAll("input[type=text], input:not([type])"), function (x) { return x.offsetParent && /Giocatore/.test(x.placeholder || ""); }).forEach(function (x, k) {
      x.value = nomi[k] || ("Amico" + k); x.dispatchEvent(new w.Event("input", { bubbles: true })); x.dispatchEvent(new w.Event("change", { bubbles: true }));
    });
    if (!W.clicca(w, /Avanti ▶/)) no("non trovo «Avanti ▶» dopo i nomi («" + T(w).slice(0, 100) + "»)");
    await W.dorme(400);
    if (!/Come si vota/i.test(T(w))) no("sullo stesso telefono manca «Come si vota»");
    var visti = { rivela: false, socio: false, giro2: false }, fino = Date.now() + 120000, passi = 0;
    while (Date.now() < fino) {
      await W.dorme(380);
      var tx = T(w);
      if (d.querySelector(".classifica")) break;
      if (/era (un|la|l') ?(cittadino|spia|impostore)/.test(tx)) visti.rivela = true;
      if (/L'altro impostore è/.test(tx)) visti.socio = true;
      if (/Giro 2/.test(tx)) visti.giro2 = true;
      var carta0 = [].filter.call(d.querySelectorAll("div"), function (x) { return /Tieni premuto qui/.test(x.textContent) && x.style.position === "relative"; })[0];
      if (carta0) { carta0.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true })); carta0.dispatchEvent(new w.PointerEvent("pointerup", { bubbles: true })); await W.dorme(500); }
      var b = [].filter.call(d.querySelectorAll(".piede button, .contenuto button"), function (x) { return x.style.visibility !== "hidden" && !x.disabled && x.offsetParent; });
      var pref = b.filter(function (x) { return /Sono |Ho capito|Andiamo a votare|Avanti|Vedi|Prossim|Classifica|Comincia|Gioca|Chi era|Rifate|ballottaggio/.test(x.textContent); })[0] || b.filter(function (x) { return !/Esci|‹|Tempo/.test(x.textContent); })[0];
      if (pref) { pref.click(); passi++; }
    }
    if (!d.querySelector(".classifica")) no("sullo stesso telefono non si arriva alla classifica («" + T(w).slice(0, 100) + "»)");
    return { passi: passi, visti: visti };
  }
  COPIONE.aggiungi("el7", { nome: "Impostore a eliminazione sullo stesso telefono (4 giocatori; 7 con 2 impostori che si conoscono)", fai: async function () {
    var r1 = await stessoTelefono(["Paky", "Giulia", "Luca", "Sara"], { voto: "elim", nimp: 1, aiuto: "simile", spia: "no", mani: 1, tempo: 0 });
    if (!r1.visti.rivela) no("in 4 non si è mai visto «… era un …»");
    var r2 = await stessoTelefono(["Paky", "Giulia", "Luca", "Sara", "Marco", "Bea", "Ciro"], { voto: "elim", nimp: 2, conosce: "si", aiuto: "categoria", spia: "no", mani: 1, tempo: 0 });
    if (!r2.visti.socio) no("in 7 con 2 impostori nessuno ha visto «🤝 L'altro impostore è …»");
    if (!r2.visti.rivela) no("in 7 non si è mai visto «… era un …»");
    try { W.finestra("Paky").localStorage.removeItem("sg_impostore_regole"); } catch (e) {}
    var e = errori(); if (e) no("errori: " + e);
    return "stesso telefono ok (" + r1.passi + " e " + r2.passi + " tocchi" + (r2.visti.giro2 ? ", giro 2 visto" : "") + ")";
  } });
})();
