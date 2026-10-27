// PROVE DELL'IMPOSTORE ONLINE (ognuno dal suo telefono, dalla Sala): indizi scritti di nascosto e svelati tutti insieme,
// discussione, voto segreto, spoglio, ultima possibilità, chi rientra ritrova la sua parola, chi guarda.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/impostore.js"); await COPIONE.prova("imp1")
// Gli scenari online durano più di 45 s: lanciali senza aspettarli (window.__run = COPIONE.prova("imp2")) e poi leggi COPIONE.esiti.
//
// L'Impostore non è ancora in GIOCHI_ONLINE (core.js): per la prova i telefoni lo registrano al posto della Gara di pesca
// (id "garapesca", che è online), col suo nome «L'Impostore». Le regole della partita: w.__imp sul telefono dell'host.
//
// imp1: le regole senza grafica (voti, pareggio, punti, parola nell'indizio, 6 parole dell'ultima possibilità), la riga
//       «📜 Si gioca così» e le impostazioni col box fuori dalla pagina (online: «Gli indizi», «Giri di indizi»).
// imp2: Sala con Paky, Giulia, Luca e Sara; 2 mani, spia che sa, 2 giri di indizi. Ognuno vede la SUA parola (tenendo premuto),
//       la parola non passa mai nella foto per tutti; l'indizio con la propria parola è rifiutato; gli indizi si svelano
//       tutti insieme al giro dopo; Luca ricarica mentre si scrive (ritrova parola e «✅ Hai scritto»); «🗳️ Votiamo» da 3 su 4;
//       voto segreto (cambiabile); spoglio; ultima possibilità (solo l'impostore tocca); fine mano coi punti giusti;
//       «⏩ Avanti» da 3 su 4; seconda mano con Sara spenta più di 20 s (si va avanti senza di lei, poi torna al suo posto);
//       classifica coi tasti del core; «↻ Rivincita» col 3-2-1 e si rigioca.
// imp3: chi arriva a partita cominciata (Marco) guarda: niente tasti, «👀 Guardi», tenendo premuto vede la parola e chi è
//       l'impostore; alla Rivincita entra a giocare. Indizi «🗣️ A voce» (3 giocatori): «Inizia …» e il giro.
// imp4: l'host ricarica a metà partita: (dal 18 ott, riprende) la partita riprende dalla Sala col suo codice, stesse parole.
// imp5: le misure 360x640 e 412x915 con 8 telefoni: indizi, voto, spoglio, fine mano, classifica senza scorrere.
// imp6: sullo stesso telefono (3 giocatori) dalla home alla classifica, solo coi tasti: niente rotto.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var COME = "garapesca", NOME = "L'Impostore";
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- i telefoni registrano l'Impostore al posto della Gara di pesca (opz.comeImp); w.__imp = le regole dell'host ----
  if (!W.__pfImp) {
    var pf = W.__pfImp = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      pf.apply(this, arguments);
      if (!opz || !opz.comeImp) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === COME) return;                       // la Gara di pesca vera no
          if (g && g.id === "impostore") {
            g.id = COME; w.__gImp = g;
            var av = g.avvia;
            g.avvia = function (t) {
              if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              w.__tI = t;
              return av.apply(this, arguments);
            };
          }
          return reg.apply(v, arguments);
        };
      } });
    };
  }
  // la spia di tutti i messaggi del broker finto (per controllare che le parole non passino nella foto per tutti)
  if (!W.__ccImp) {
    var cc = W.__ccImp = W.creaClient;
    W.creaClient = function (nome, opts) {
      var c = cc.apply(this, arguments), pub = c.publish;
      c.publish = function (topic, payload) { if (W.__spiaImp) W.__spiaImp.push({ da: nome, topic: topic, p: String(payload) }); return pub.apply(this, arguments); };
      return c;
    };
  }
  function opzImp(extra) { return Object.assign({ salaSempre: true, comeImp: true }, extra || {}); }
  async function salaImp(amici, imp) {
    var w = { Paky: await W.apriTel("Paky", opzImp({ x: 0, prima: function (x) { x.__imp = imp; } })) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], opzImp({ hash: "sala=" + S, x: 185 * (i + 1) }));
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 12000)) no("nella Sala non sono entrati in " + (amici.length + 1));
    return { S: S, w: w };
  }

  // ---- aiuti di gioco ----
  function carta(w) {
    var d = w && w.document; if (!d) return {};
    var q = function (s) { var e = d.querySelector(s); return e ? e.textContent : ""; };
    return { su: q(".im-c-su"), grande: q(".im-c-grande"), giu: q(".im-c-giu"), coperta: q(".im-c-tx") };
  }
  function ruoloDi(w) { var c = carta(w); return /impostore/.test(c.su) ? "imp" : /spia/.test(c.su) ? "spia" : /La tua parola/.test(c.su) ? "civ" : null; }
  function scrivi(w, testo) {
    var inp = w.document.querySelector(".im-input"), b = w.document.querySelector(".im-invia");
    if (!inp || !b) return false;
    inp.value = testo; inp.dispatchEvent(new w.Event("input", { bubbles: true })); b.click(); return true;
  }
  function vota(w, nome) {
    var b = [].filter.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent === nome; })[0];
    if (!b || b.disabled) return false; b.click(); return true;
  }
  async function pronto(w) { var b = await W.aspetta(function () { var x = w && w.document.querySelector(".im-pronto"); return x && !x.disabled ? x : null; }, 3000); if (!b) return false; b.click(); return true; }
  async function prontiTutti(nomi) { for (var i = 0; i < nomi.length; i++) await pronto(W.finestra(nomi[i])); }
  function nomiTel(C) { return (vm(C).players || []).map(function (p) { return p.nome; }); }
  function telDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? W.finestra(p.nome) : null; }
  function nomeDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function errori() { var e = W.erroriTel(); return e.length ? e.slice(0, 3).join(" / ") : ""; }
  async function aspettaPasso(C, passo, ms) { return W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.passo === passo ? v : null; }, ms || 8000); }
  // la parola non deve mai passare nei messaggi per tutti (solo nei messaggi "seg" con "to", e nell'esito a mano finita)
  function controllaSpia(parole) {
    var male = [];
    (W.__spiaImp || []).forEach(function (m) {
      var x; try { x = JSON.parse(m.p); } catch (e) { return; }
      var dati = x && (x.data || x), s = m.p;
      if (dati && dati.t === "seg") { if (!dati.to) male.push("segreto senza «to» da " + m.da); return; }
      if (dati && dati.t === "__ris") { if (!(dati.vici || []).length) male.push("copia per i vice senza vice da " + m.da); return; }   // (dal 18 ott: la copia della partita per i vice, come i segreti «to»)
      if (dati && (dati.t === "indizio" || dati.t === "indovina")) return;   // (le mosse di chi gioca vanno solo all host: l indizio rifiutato lo manda la prova apposta)
      if (dati && dati.t === "vm" && dati.vm && (dati.vm.passo === "esito" || dati.vm.fase !== "gioco")) return;   // a mano finita le parole sono svelate
      if (dati && dati.t === "vm" && dati.vm && dati.vm.passo === "ultima" && dati.vm.ultima) s = JSON.stringify(Object.assign({}, dati.vm, { ultima: null }));
      parole.forEach(function (p) { if (p && s.toLowerCase().indexOf("\"" + p.toLowerCase() + "\"") >= 0) male.push("«" + p + "» in un messaggio per tutti di " + m.da + ": " + s.slice(0, 80)); });
    });
    return male;
  }

  // ===================== imp1: le regole =====================
  COPIONE.aggiungi("imp1", { nome: "Impostore: regole senza grafica, riassunto e impostazioni fuori pagina", fai: async function () {
    var w = await W.apriTel("Paky", opzImp({ x: 0 })), I = w.__impostore, g = w.__gImp;
    if (!I || !g) no("non vedo le regole dell'Impostore (window.__impostore) o il gioco registrato");
    var V = I.contaVoti(4, [1, 0, 1, null]);
    if (V.accusato !== 1 || V.conte.join() !== "1,2,0,0") no("conta dei voti: " + JSON.stringify(V));
    var P = I.contaVoti(4, [1, 0, null, null]);
    if (P.accusato !== -1 || P.piu.join() !== "0,1") no("pareggio: nessuno accusato " + JSON.stringify(P));
    // 4 giocatori: impostore 3, spia 2; voti: 0→3, 1→2, 2→3, 3→0; accusato 3 (impostore), non indovina
    var p1 = I.puntiMano(4, [3, 2, 3, 0], 3, 2, 3, false);
    if (p1.join() !== "2,1,4,0") no("punti (impostore preso, spia salva): " + p1.join());
    var p2 = I.puntiMano(4, [3, 2, 3, 0], 3, 2, 3, true);
    if (p2[3] !== 2) no("impostore che indovina: +2, non " + p2[3]);
    var p3 = I.puntiMano(3, [1, 0, 0], 2, -1, 0, false);
    if (p3.join() !== "0,0,3") no("innocente accusato: l'impostore +3 " + p3.join());
    if (I.testiEsito(-1, 2, -1, false).titolo !== "Pareggio nei voti!") no("titolo del pareggio");
    // l'indizio con la propria parola
    var casi = [["mare", "Mare", true], ["MARÉ", "mare", true], ["pizze", "Pizza", true], ["patatine", "Patatine fritte", true], ["onde", "Mare", false],
      ["marea", "Mare", false], ["olio", "Sole", false], ["la pizza", "Pizza", true], ["crocchetta", "Crocchette", true]];
    var sb = casi.filter(function (c) { return I.svelaParola(c[0], c[1]) !== c[2]; });
    if (sb.length) no("indizio con la parola: " + sb.map(function (c) { return c[0] + "/" + c[1]; }).join(", "));
    if (I.pulisciIndizio("  ciao    mondo  ") !== "ciao mondo" || I.pulisciIndizio("x".repeat(40)).length !== 24) no("pulizia dell'indizio");
    var cats = (w.SG_IMPOSTORE || []).map(function (c) { return { id: c.id, coppie: c.coppie.split("|").map(function (s) { var p = s.split("/"); return { a: p[0].trim(), b: p[1].trim(), cat: c.id }; }) }; });
    for (var i = 0; i < 30; i++) {
      var c = cats[i % cats.length], cp = c.coppie[i % c.coppie.length], sc = I.scelteUltima(cats, c.id, cp.a, cp.b);
      if (sc.length !== 6 || sc.indexOf(cp.a) < 0 || sc.indexOf(cp.b) < 0 || sc.filter(function (x, k) { return sc.indexOf(x) !== k; }).length) no("6 parole dell'ultima possibilità: " + sc.join(","));
    }
    // la riga «📜 Si gioca così»
    var r1 = g.riassunto({ aiuto: "simile", spia: "no", mani: 3, indizi: "scritti", giri: 2 }), r2 = g.riassunto({ aiuto: "simile", spia: "nonsa", mani: 1, indizi: "voce", giri: 2 });
    if (r1 !== "✍️ 2 giri di indizi scritti · 💡 parola simile all'impostore · 3 mani") no("riassunto 1: " + r1);
    if (r2 !== "🗣️ Indizi a voce · 🏷️ l'impostore sa la categoria · 🤫 con la spia (che non lo sa) · 1 mano") no("riassunto 2: " + r2);
    // le impostazioni col box fuori dalla pagina (come nella Sala), online e sullo stesso telefono
    var box = w.document.createElement("div"), dove = {};
    g.impostazioni(box, dove, { el: w.SG._util.el, sala: true, modo: "online", giocatori: ["Paky"] });
    if (dove.indizi !== "scritti" || dove.giri !== 2) no("di partenza online: indizi scritti e 2 giri (" + dove.indizi + ", " + dove.giri + ")");
    if (!/Gli indizi/.test(box.textContent) || !/Giri di indizi/.test(box.textContent) || !/Tempo per discutere/.test(box.textContent)) no("online mancano le scelte degli indizi («" + box.textContent.slice(0, 120) + "»)");
    var b2 = w.document.createElement("div"); g.impostazioni(b2, {}, { el: w.SG._util.el, modo: "telefono", giocatori: ["A", "B", "C"] });
    if (/Gli indizi|Giri di indizi/.test(b2.textContent)) no("sullo stesso telefono non servono le scelte degli indizi");
    return "regole ok, riassunti ok, impostazioni ok " + errori();
  } });

  // gioca un giro di indizi: ognuno scrive "<nome> <giro>" (tranne chi è in salta). Restituisce la foto dopo
  async function giroIndizi(C, nomi, salta) {
    var v = await aspettaPasso(C, "indizi"); if (!v) no("non si scrivono gli indizi (" + vm(C).passo + ")");
    var g = v.giro;
    for (var i = 0; i < nomi.length; i++) {
      if (salta && salta.indexOf(nomi[i]) >= 0) continue;
      var w = W.finestra(nomi[i]);
      if (!await W.aspetta(function () { return w.document.querySelector(".im-input") || w.document.querySelector(".im-fatto"); }, 4000)) no(nomi[i] + " non ha il campo dell'indizio («" + T(w).slice(0, 80) + "»)");
      if (w.document.querySelector(".im-input")) scrivi(w, "indizio" + nomi[i].slice(0, 3) + g);
    }
    if (!await W.aspetta(function () { var x = vm(C); return x.passo !== "indizi" || x.giro !== g; }, 8000)) no("il giro di indizi non si chiude da solo quando hanno scritto tutti");
    return vm(C);
  }

  // ===================== imp2: la partita intera =====================
  COPIONE.aggiungi("imp2", { nome: "Impostore online dalla Sala in 4: segreti, indizi svelati insieme, ricarica, voto, ultima possibilità, spento, Rivincita", fai: async function () {
    W.__spiaImp = [];
    var Z = await salaImp(["Giulia", "Luca", "Sara"], { aiuto: "simile", spia: "sa", giri: 2, mani: 2, tempo: 60, indizi: "scritti" });
    var S = Z.S, P = W.finestra("Paky"), nomi = ["Paky", "Giulia", "Luca", "Sara"];
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 4; }, 10000)) no("nella saletta non arrivano in 4 (" + nomiTel(C) + ")");
    var rg = await W.aspetta(function () { return /giri di indizi/.test(A.regoleDi(W.finestra("Giulia"))) ? A.regoleDi(W.finestra("Giulia")) : null; }, 4000);
    if (!rg || !/con la spia/.test(rg)) no("Giulia non legge le regole («" + A.regoleDi(W.finestra("Giulia")) + "»)");
    if (!W.clicca(P, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    var v = await aspettaPasso(C, "indizi", 10000); if (!v) no("la partita non comincia");
    if (v.giro !== 1 || v.giri !== 2 || v.mani !== 2) no("giro/giri/mani: " + [v.giro, v.giri, v.mani]);
    // ognuno la sua carta (aspetto che arrivino tutte)
    if (!await W.aspetta(function () { return nomi.every(function (n) { return ruoloDi(W.finestra(n)); }); }, 6000)) no("non tutti hanno la carta: " + nomi.map(function (n) { return n + "=" + carta(W.finestra(n)).grande; }).join(" "));
    var ruoli = {}; nomi.forEach(function (n) { ruoli[n] = ruoloDi(W.finestra(n)); });
    var imp = nomi.filter(function (n) { return ruoli[n] === "imp"; }), spia = nomi.filter(function (n) { return ruoli[n] === "spia"; }), civ = nomi.filter(function (n) { return ruoli[n] === "civ"; });
    if (imp.length !== 1 || spia.length !== 1 || civ.length !== 2) no("ruoli sbagliati: " + JSON.stringify(ruoli));
    var parola = carta(W.finestra(civ[0])).grande, simile = carta(W.finestra(spia[0])).grande;
    if (carta(W.finestra(civ[1])).grande !== parola) no("i due civili hanno parole diverse");
    if (parola === simile) no("la spia ha la stessa parola");
    if (!/Categoria/.test(carta(W.finestra(imp[0])).giu)) no("con la spia l'impostore deve sapere la categoria: " + JSON.stringify(carta(W.finestra(imp[0]))));
    if (!W.finestra(civ[0]).document.querySelector(".im-carta.grande")) no("al primo giro la carta non è grande");
    // l'indizio con la propria parola: rifiutato (sul telefono e, se arriva, dall'host)
    var wc = W.finestra(civ[0]);
    scrivi(wc, parola.toLowerCase());
    await W.dorme(400);
    if (wc.document.querySelector(".im-fatto") || (vm(C).scritto || []).length) no("l'indizio con la propria parola è stato accettato");
    W.reteDi(civ[0]) && W.reteDi(civ[0]).invia({ t: "indizio", testo: parola });   // (anche mandato a mano: l'host lo rifiuta)
    await W.dorme(400);
    if ((vm(C).scritto || []).length) no("l'host ha accettato l'indizio con la parola");
    // giro 1: scrivono tutti tranne Luca, che ricarica la pagina dopo aver scritto
    var wl = W.finestra("Luca"), cartaL = carta(wl).grande;
    scrivi(wl, "primoluca");
    if (!await W.aspetta(function () { return (vm(C).scritto || []).length === 1; }, 3000)) no("l'indizio di Luca non arriva");
    if (JSON.stringify(vm(C)).indexOf("primoluca") >= 0) no("l'indizio di Luca è nella foto prima dello svelamento");
    wl = await W.ricarica("Luca");
    if (!await W.aspetta(function () { return carta(W.finestra("Luca")).grande === cartaL; }, 9000)) no("Luca ricarica e non ritrova la sua parola («" + carta(W.finestra("Luca")).grande + "» invece di «" + cartaL + "»)");
    if (!await W.aspetta(function () { return /Hai scritto/.test(T(W.finestra("Luca"))); }, 3000)) no("Luca ricarica e non vede «✅ Hai scritto»");
    v = await giroIndizi(C, nomi, ["Luca"]);
    if (v.passo !== "indizi" || v.giro !== 2) no("dopo il giro 1 non si passa al giro 2 (" + v.passo + " " + v.giro + ")");
    if (((v.ind || {})[(v.players.filter(function (p) { return p.nome === "Luca"; })[0] || {}).id] || [])[0] !== "primoluca") no("l'indizio di Luca non è svelato al giro 2: " + JSON.stringify(v.ind));
    if (!await W.aspetta(function () { return W.finestra("Giulia").document.querySelectorAll(".im-w").length === 4; }, 3000)) no("Giulia non vede i 4 indizi svelati");
    if (W.finestra("Giulia").document.querySelector(".im-carta.grande")) no("al giro 2 la carta dovrebbe essere piccola");
    v = await giroIndizi(C, nomi);
    if (v.passo !== "discuti") no("dopo il giro 2 non si discute (" + v.passo + ")");
    if (!await W.aspetta(function () { return W.finestra("Sara").document.querySelectorAll(".im-w").length === 8; }, 3000)) no("nella discussione non si vedono 8 indizi");
    if (!/In gioco: 🕵️ 1 impostore · 🎭 1 spia/.test(T(P))) no("nella discussione manca chi c'è in gioco");
    // «🗳️ Votiamo»: servono 3 su 4
    await pronto(P); await pronto(W.finestra("Giulia"));
    await W.dorme(500);
    if (vm(C).passo !== "discuti") no("con 2 su 4 si vota già");
    if (!/2 su 3/.test((P.document.querySelector(".im-pronto") || {}).textContent || "")) no("il tasto non dice «2 su 3»: " + (P.document.querySelector(".im-pronto") || {}).textContent);
    await pronto(W.finestra("Luca"));
    v = await aspettaPasso(C, "voto", 4000); if (!v) no("con 3 su 4 non si va al voto");
    // il voto: tutti l'impostore (l'impostore vota la spia); Giulia prima sbaglia e poi cambia
    var votoDi = {};
    nomi.forEach(function (n) { votoDi[n] = n === imp[0] ? spia[0] : imp[0]; });
    if (vota(W.finestra("Paky"), "Paky")) no("si può votare sé stessi");
    var altro = nomi.filter(function (n) { return n !== "Giulia" && n !== votoDi.Giulia; })[0];
    vota(W.finestra("Giulia"), altro); await W.dorme(300);
    if (!/Hai votato/.test(T(W.finestra("Giulia")))) no("Giulia non vede «Hai votato»");
    vota(W.finestra("Giulia"), votoDi.Giulia);
    for (var i = 0; i < nomi.length; i++) if (nomi[i] !== "Giulia") vota(W.finestra(nomi[i]), votoDi[nomi[i]]);
    v = await aspettaPasso(C, "spoglio", 5000); if (!v) no("dopo i voti di tutti non arriva lo spoglio (" + vm(C).passo + ")");
    if (nomeDi(C, v.spoglio.acc) !== imp[0] || v.spoglio.ruolo !== "impostore") no("lo spoglio non accusa l'impostore: " + JSON.stringify(v.spoglio));
    v = await aspettaPasso(C, "ultima", 9000); if (!v) no("non arriva l'ultima possibilità");
    var wi = W.finestra(imp[0]), giusta = parola;
    var sb = [].filter.call(wi.document.querySelectorAll(".im-sc"), function (b) { return !b.disabled; });
    if (sb.length !== 6) no("l'impostore non ha 6 parole da toccare (" + sb.length + ")");
    if ([].some.call(W.finestra("Giulia").document.querySelectorAll(".im-sc"), function (b) { return !b.disabled; }) && imp[0] !== "Giulia") no("anche gli altri possono toccare le parole");
    var sbagliata = sb.filter(function (b) { return b.textContent !== giusta; })[0];
    sbagliata.click();
    if (!await W.aspetta(function () { return /Sbagliato/.test(T(W.finestra(civ[0]))); }, 4000)) no("gli altri non vedono «❌ Sbagliato!»");
    v = await aspettaPasso(C, "esito", 6000); if (!v) no("non arriva la fine della mano");
    var pt = {}; v.players.forEach(function (p) { pt[p.nome] = p.piu; });
    nomi.forEach(function (n) { var att = n === imp[0] ? 0 : n === spia[0] ? 2 + 2 : 2; if (pt[n] !== att) no("punti di " + n + " (" + ruoli[n] + "): " + pt[n] + " invece di " + att); });
    if (!/Impostore scoperto/.test(T(P))) no("il titolo della fine mano: «" + T(P).slice(0, 80) + "»");
    if (!new RegExp(parola).test(T(W.finestra("Giulia")))) no("a fine mano non si vede la parola");
    // le parole non sono mai passate nella foto per tutti
    var male = controllaSpia([parola, simile]);
    if (male.length) no(male.slice(0, 2).join(" | "));
    // «⏩ Avanti»: 3 su 4
    await pronto(P); await pronto(W.finestra("Giulia")); await pronto(W.finestra("Sara"));
    v = await W.aspetta(function () { var x = vm(C); return x.mano === 2 && x.passo === "indizi" ? x : null; }, 4000);
    if (!v) no("«⏩ Avanti» da 3 su 4 non fa partire la mano 2 (" + vm(C).mano + " " + vm(C).passo + ")");
    // mano 2: Sara si spegne più di 20 s (📱 telefono bloccato: resta in partita, dal 26 ott 2026); gli altri scrivono e il giro
    // la aspetta; Sara riaccende, ritrova la sua carta e scrive: il giro si chiude
    W.spegni("Sara");
    await W.aspetta(function () { var p = (vm(C).players || []).filter(function (x) { return x.nome === "Sara"; })[0]; return p && p.dorme; }, 26000);
    var ps = (vm(C).players || []).filter(function (x) { return x.nome === "Sara"; })[0];
    if (!ps.dorme || ps.via) no("Sara spenta dopo 20 s non ha 📱 (o è uscita): " + JSON.stringify(ps));
    ["Paky", "Giulia", "Luca"].forEach(function (n) { scrivi(W.finestra(n), "indizio" + n.slice(0, 3) + "1"); });
    await W.dorme(3000);
    if (vm(C).passo !== "indizi") no("il giro di indizi si è chiuso senza aspettare Sara (📱)");
    if (!/Aspettiamo Sara/.test(T(P))) no("Paky non legge «⏳ Aspettiamo Sara 📱»");
    W.riaccendi("Sara");
    if (!await W.aspetta(function () { var p = (vm(C).players || []).filter(function (x) { return x.nome === "Sara"; })[0]; return p && !p.via && !p.dorme; }, 10000)) no("Sara riaccesa non torna in partita");
    if (!await W.aspetta(function () { return ruoloDi(W.finestra("Sara")); }, 6000)) no("Sara tornata non ha la sua carta della mano 2");
    while (vm(C).passo === "indizi") v = await giroIndizi(C, nomi);   // (Sara scrive il suo; poi c'è ancora il 2° giro)
    v = await aspettaPasso(C, "discuti", 6000); if (!v) no("mano 2: niente discussione");
    await pronto(P); await pronto(W.finestra("Giulia")); await pronto(W.finestra("Luca"));
    v = await aspettaPasso(C, "voto", 4000); if (!v) no("mano 2: niente voto");
    // pareggio: Paky→Giulia, Giulia→Paky, Luca e Sara non votano (tempo): aspetto il tempo del voto (40 s) → nessuno accusato
    vota(P, "Giulia"); vota(W.finestra("Giulia"), "Paky");
    v = await aspettaPasso(C, "esito", 60000); if (!v) no("mano 2: niente fine mano (" + vm(C).passo + ")");
    if (v.esito.acc != null) no("con il pareggio qualcuno è accusato");
    if (!/Pareggio nei voti/.test(T(P))) no("manca «Pareggio nei voti!»");
    if (!/Classifica/.test((P.document.querySelector(".im-pronto") || {}).textContent || "")) no("all'ultima mano il tasto non dice «🏆 Classifica»");
    await pronto(P); await pronto(W.finestra("Giulia")); await pronto(W.finestra("Luca"));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 4000)) no("la partita non finisce");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(W.finestra("Giulia")); }, 5000)) no("a fine partita mancano i tasti del core");
    if (A.tastiFineDi(P).join(" | ") !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + A.tastiFineDi(P).join(" | ") + "»");
    if (A.tastiFineDi(W.finestra("Giulia")).join(" | ") !== "👍 Ci sto! | 🏠 Torna in Sala") no("Giulia ha «" + A.tastiFineDi(W.finestra("Giulia")).join(" | ") + "»");
    // Rivincita: tutti ci stanno, 3-2-1 e si riparte
    ["Giulia", "Luca", "Sara"].forEach(function (n) { W.clicca(W.finestra(n), /Ci sto/, ".fine-tasti button"); });
    await W.dorme(600);
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    v = await aspettaPasso(C, "indizi", 15000); if (!v) no("la Rivincita non fa ripartire la partita (" + vm(C).fase + ")");
    if (v.mano !== 1 || v.partita !== 2) no("rivincita: mano " + v.mano + ", partita " + v.partita);
    if (!await W.aspetta(function () { return nomi.every(function (n) { return ruoloDi(W.finestra(n)); }); }, 6000)) no("alla Rivincita non arrivano le carte");
    var e = errori(); if (e) no("errori: " + e);
    return "partita intera ok (impostore " + imp[0] + ", spia " + spia[0] + ", parola «" + parola + "»), rivincita ok";
  } });

  // ===================== imp3: chi guarda, indizi a voce =====================
  COPIONE.aggiungi("imp3", { nome: "Impostore: chi arriva tardi guarda (vede il segreto), indizi a voce, entra alla Rivincita", fai: async function () {
    W.__spiaImp = [];
    var Z = await salaImp(["Giulia", "Luca"], { aiuto: "buio", spia: "no", mani: 1, tempo: 60, indizi: "voce" });
    var S = Z.S, P = W.finestra("Paky");
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    if (!W.clicca(P, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    var v = await aspettaPasso(C, "discuti", 10000); if (!v) no("a voce si dovrebbe partire dalla discussione (" + vm(C).passo + ")");
    if (!/Inizia/.test(T(P)) || !P.document.querySelector(".im-ordine .primo")) no("a voce manca «Inizia …» e il giro");
    if (!P.document.querySelector(".im-carta.grande")) no("a voce la carta deve essere grande all'inizio");
    var imp = ["Paky", "Giulia", "Luca"].filter(function (n) { return ruoloDi(W.finestra(n)) === "imp"; })[0];
    if (!imp) no("nessun impostore");
    if (carta(W.finestra(imp)).grande !== "🕵️ Impostore") no("senza aiuto l'impostore non deve avere parole: " + carta(W.finestra(imp)).grande);
    // Marco arriva a partita cominciata: guarda
    var M = await W.apriTel("Marco", opzImp({ hash: "sala=" + S, x: 555 }));
    // nella Sala chi arriva tardi aspetta «entri alla prossima»: tocca «👀 Guarda» per vedere la partita
    if (!await W.aspetta(function () { return W.clicca(M, /👀 Guarda/); }, 10000)) no("Marco non ha «👀 Guarda» («" + T(M).slice(0, 120) + "»)");
    if (!await W.aspetta(function () { return M.document.querySelector(".im-scena"); }, 15000)) no("Marco non vede la partita («" + T(M).slice(0, 80) + "»)");
    if (!/Guardi/.test(T(M))) no("Marco non legge «👀 Guardi»");
    if (M.document.querySelector(".im-pronto")) no("chi guarda ha il tasto «Votiamo»");
    if (!await W.aspetta(function () { return /🕵️/.test(carta(M).grande); }, 6000)) no("Marco non vede il segreto tenendo premuto: " + JSON.stringify(carta(M)));
    if (carta(M).grande !== "🕵️ " + imp) no("a Marco il segreto dice «" + carta(M).grande + "» invece di " + imp);
    if ((vm(C).players || []).some(function (p) { return p.nome === "Marco"; })) no("Marco è stato messo in partita");
    // si vota: tutti l'impostore
    await pronto(P); await pronto(W.finestra("Giulia")); await pronto(W.finestra("Luca"));
    v = await aspettaPasso(C, "voto", 5000); if (!v) no("niente voto");
    if ([].some.call(M.document.querySelectorAll(".im-vb"), function (b) { return !b.disabled; })) no("chi guarda può votare");
    ["Paky", "Giulia", "Luca"].forEach(function (n) { vota(W.finestra(n), n === imp ? ["Paky", "Giulia", "Luca"].filter(function (x) { return x !== imp; })[0] : imp); });
    v = await aspettaPasso(C, "ultima", 12000); if (!v) no("niente ultima possibilità");
    // l'impostore non tocca niente: il tempo scade (25 s)
    v = await aspettaPasso(C, "esito", 40000); if (!v) no("dopo il tempo dell'ultima possibilità non arriva la fine mano");
    if (!/Impostore scoperto/.test(T(P))) no("titolo: «" + T(P).slice(0, 60) + "»");
    await pronto(P); await pronto(W.finestra("Giulia"));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("la partita non finisce");
    if (!await W.aspetta(function () { return /l'hai guardata/.test(T(M)); }, 5000)) no("Marco non legge «Questa partita l'hai guardata»");
    await W.dorme(400);
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === "Marco"; }) || (vm(C).fase === "gioco" && (vm(C).players || []).length === 4); }, 15000)) no("alla Rivincita Marco non entra a giocare (" + nomiTel(C) + ")");
    var e = errori(); if (e) no("errori: " + e);
    return "chi guarda ok, a voce ok, Marco entra alla rivincita";
  } });

  // ===================== imp4: l'host ricarica =====================
  COPIONE.aggiungi("imp4", { nome: "Impostore: l'host ricarica a metà partita nella Sala, la partita riprende", fai: async function () {
    var Z = await salaImp(["Giulia", "Luca"], { aiuto: "categoria", spia: "no", mani: 3, giri: 1, indizi: "scritti", tempo: 60 });
    var S = Z.S, P = W.finestra("Paky");
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    if (!W.clicca(P, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    if (!await aspettaPasso(C, "indizi", 10000)) no("la partita non comincia");
    await giroIndizi(C, ["Paky", "Giulia", "Luca"]);
    if (!await aspettaPasso(C, "discuti", 5000)) no("con 1 giro di indizi si discute subito");
    // (dal 18 ott, Passo 5: l'Impostore riprende) nella Sala l'host che ricarica ritrova la partita col suo codice: nessuno
    // torna nella Sala, stessa mano, stesse parole, si discute ancora
    var carte0 = {}; ["Paky", "Giulia", "Luca"].forEach(function (n) { carte0[n] = carta(W.finestra(n)).grande; });
    var mano0 = vm(C).mano, s0 = (W.statoStanza(C) || {})._s, inSala = "";
    await W.dorme(900);
    P = await W.ricarica("Paky");
    var ok = await W.aspetta(function () {
      ["Giulia", "Luca"].forEach(function (n) { var w = W.finestra(n); if (!w.document.querySelector(".im-scena") && /Sei dentro/.test(T(w))) inSala = n; });
      var s = W.statoStanza(C) || {}, v = vm(C);
      return s._s && s._s !== s0 && s._r && v.fase === "gioco" && v.passo === "discuti" && v.mano === mano0 && W.finestra("Paky").document.querySelector(".im-scena");
    }, 20000);
    if (!ok) no("dopo la ricarica dell'host la partita non riprende (" + vm(C).fase + " " + vm(C).passo + ", «" + T(W.finestra("Paky")).slice(0, 60) + "»)");
    if (inSala) no(inSala + " è tornato nella Sala");
    if (!await W.aspetta(function () { return ["Paky", "Giulia", "Luca"].every(function (n) { return carta(W.finestra(n)).grande === carte0[n]; }); }, 8000)) no("dopo la ricarica le parole non sono quelle di prima");
    if (!await W.aspetta(function () { return ["Giulia", "Luca"].every(function (n) { return W.finestra(n).document.querySelector(".im-scena"); }); }, 4000)) no("gli amici non sono più nella partita");
    var e = errori(); if (e) no("errori: " + e);
    return "l'host ricarica: la partita riprende (stessa mano, stesse parole, codice " + C + ")";
  } });

  // ===================== imp5: le misure =====================
  async function misura(nome, wh, quale) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{animation:none!important}.im-w.nuova{animation:none!important}"; d.head.appendChild(st); }
    f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(700);
    var male = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) male.push("la pagina scorre");
    if (d.documentElement.scrollWidth > wh[0] + 1) male.push("scorre di lato");
    [].forEach.call(d.querySelectorAll(quale), function (x) {
      var r = x.getBoundingClientRect(); if (!r.width) return;
      if (r.bottom > w.innerHeight + 1 || r.right > wh[0] + 1 || r.left < -1) male.push("«" + (x.innerText || x.className).replace(/\s+/g, " ").slice(0, 30) + "» fuori (" + Math.round(r.bottom) + ")");
    });
    // il corpo non deve tagliare righe (tutte le righe dentro il corpo visibile)
    var corpo = d.querySelector(".im-corpo");
    if (corpo && corpo.scrollHeight > corpo.clientHeight + 2) male.push("il corpo è tagliato (" + corpo.scrollHeight + " > " + corpo.clientHeight + ")");
    return male.join(", ");
  }
  async function misuraTutto(nomi, quale, cosa, note) {
    for (var i = 0; i < 2; i++) {
      var wh = i ? [412, 915] : [360, 640];
      for (var k = 0; k < nomi.length; k++) {
        var m = await misura(nomi[k], wh, quale);
        if (m) note.push(cosa + " " + wh.join("x") + " " + nomi[k] + ": " + m);
      }
    }
  }
  COPIONE.aggiungi("imp5", { nome: "Impostore: misure 360x640 e 412x915 con 8 telefoni (indizi, voto, spoglio, fine mano, classifica)", fai: async function () {
    var amici = ["Giulia", "Luca", "Sara", "Marco", "Bea", "Ciro", "Massimiliano"];
    var Z = await salaImp(amici, { aiuto: "simile", spia: "sa", mani: 1, giri: 3, indizi: "scritti", tempo: 60 });
    var S = Z.S, P = W.finestra("Paky"), tutti = ["Paky"].concat(amici), note = [];
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 8; }, 15000)) no("nella saletta non arrivano in 8 (" + nomiTel(C).length + ")");
    if (!W.clicca(P, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    if (!await aspettaPasso(C, "indizi", 10000)) no("la partita non comincia");
    await W.aspetta(function () { return tutti.every(function (n) { return ruoloDi(W.finestra(n)); }); }, 8000);
    await misuraTutto(["Paky", "Massimiliano"], ".im-scrivi, .im-carta, .im-lista, .im-piede", "indizi 1", note);
    for (var g = 0; g < 2; g++) {
      for (var i = 0; i < tutti.length; i++) scrivi(W.finestra(tutti[i]), "parolalunghissim" + g + i);
      await W.aspetta(function () { return vm(C).giro === g + 2; }, 8000);
    }
    await misuraTutto(["Paky", "Massimiliano"], ".im-scrivi, .im-carta, .im-lista, .im-piede", "indizi 3", note);
    for (var j = 0; j < tutti.length; j++) scrivi(W.finestra(tutti[j]), "ultimissimaparola" + j);
    if (!await aspettaPasso(C, "discuti", 8000)) no("niente discussione");
    await misuraTutto(["Paky"], ".im-lista, .im-piede, .im-ruoli", "discussione", note);
    await prontiTutti(tutti.slice(0, 5));
    if (!await aspettaPasso(C, "voto", 5000)) no("niente voto");
    await misuraTutto(["Paky", "Massimiliano"], ".im-voti, .im-piede", "voto", note);
    tutti.forEach(function (n, k) { vota(W.finestra(n), tutti[(k + 1) % tutti.length]); });   // tutti a pari voti: nessuno accusato
    if (!await aspettaPasso(C, "spoglio", 6000)) no("niente spoglio");
    await W.dorme(4500);
    await misuraTutto(["Paky"], ".im-sp, .im-verdetto", "spoglio", note);
    if (!await aspettaPasso(C, "esito", 8000)) no("niente fine mano");
    await misuraTutto(["Paky", "Massimiliano"], ".im-es, .im-piede, .im-svela", "fine mano", note);
    await prontiTutti(tutti.slice(0, 5));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("la partita non finisce");
    await W.dorme(800);
    await misuraTutto(["Paky", "Giulia"], ".fine-tasti button, .classifica", "classifica", note);
    tutti.forEach(function (n) { var f = document.getElementById("tel-" + n); f.style.width = "360px"; f.style.height = "740px"; });
    if (note.length) no(note.slice(0, 4).join(" | "));
    var e = errori(); if (e) no("errori: " + e);
    return "misure ok con 8 telefoni";
  } });

  // ===================== imp6: sullo stesso telefono =====================
  COPIONE.aggiungi("imp6", { nome: "Impostore sullo stesso telefono: dalla home alla classifica coi tasti", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), d = w.document;
    var tess = await W.aspetta(function () { return [].filter.call(d.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === NOME; })[0]; }, 6000);
    if (!tess) no("in home non c'è la tessera dell'Impostore");
    tess.click(); await W.dorme(300);
    W.clicca(w, /Su questo telefono/);   // (se c'è la scelta del modo)
    await W.dorme(300);
    // gli amici: 3 nomi, poi «Avanti ▶» e le regole
    for (var k = 0; k < 2; k++) { W.clicca(w, /Aggiungi giocatore/); await W.dorme(150); }
    var nomi = ["Paky", "Giulia", "Luca"];
    [].filter.call(d.querySelectorAll("input[type=text], input:not([type])"), function (x) { return x.offsetParent && /Giocatore/.test(x.placeholder || ""); }).forEach(function (x, k) {
      x.value = nomi[k] || ("Amico" + k); x.dispatchEvent(new w.Event("input", { bubbles: true })); x.dispatchEvent(new w.Event("change", { bubbles: true }));
    });
    if (!W.clicca(w, /Avanti ▶/)) no("non trovo «Avanti ▶» dopo i nomi («" + T(w).slice(0, 100) + "»)");
    await W.dorme(400);
    if (/Gli indizi|Giri di indizi/.test(T(w))) no("sullo stesso telefono compaiono le scelte degli indizi (sono solo online)");
    // fino alla fine: i passaggi del telefono, le carte (tieni premuto), il voto e i risultati
    var fino = Date.now() + 60000, passi = 0;
    while (Date.now() < fino) {
      await W.dorme(520);
      var tx = T(w);
      if (/Classifica|1°|🥇/.test(tx) && d.querySelector(".classifica")) break;
      var carta0 = [].filter.call(d.querySelectorAll("div"), function (x) { return /Tieni premuto qui/.test(x.textContent) && x.style.position === "relative"; })[0];
      if (carta0) { carta0.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true })); carta0.dispatchEvent(new w.PointerEvent("pointerup", { bubbles: true })); await W.dorme(500); }
      var b = [].filter.call(d.querySelectorAll(".piede button, .contenuto button"), function (x) { return x.style.visibility !== "hidden" && !x.disabled && x.offsetParent; });
      var pref = b.filter(function (x) { return /Sono |Ho capito|Andiamo a votare|Avanti|Vedi|Prossima|Classifica|Comincia|Gioca/.test(x.textContent); })[0] || b.filter(function (x) { return !/Esci|‹|Tempo/.test(x.textContent); })[0];
      if (pref) { pref.click(); passi++; }
    }
    if (!d.querySelector(".classifica")) no("sullo stesso telefono non si arriva alla classifica («" + T(w).slice(0, 100) + "»)");
    var e = errori(); if (e) no("errori: " + e);
    return "stesso telefono ok (" + passi + " tocchi)";
  } });
})();
