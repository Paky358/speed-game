// PROVE DELLA RUOTA DELLA FORTUNA: «❓ Lo spicchio Mistero», «✍️ La frase degli amici», «⏩ Avanti» a maggioranza a fine manche.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora2/g7-ruota.js"); await COPIONE.prova("g7r1")
//
// g7r0: regole e motore senza telefoni: il controllo delle frasi (troppo lunga, parola da 13, caratteri strani, corta, apostrofi
//       ricurvi), la riga «📜 Si gioca così», il ⚙️ fuori pagina (❓ Mistero acceso, Frasi «Del gioco» di base, «Anche le nostre»
//       apre la casella, aggiungi/togli, al massimo 5, le frasi MAI nelle regole), le manche col Mistero (le ultime due normali,
//       mai nel round veloce), Mistero vinto/Bancarotta/tempo scaduto, la foto senza l'esito prima che si apra, il Bot che apre
//       solo se è indietro, le frasi degli amici una manche su due con la firma.
// g7r1: contro i Bot (Facile), 4 manche, tutti i round, «Anche le nostre» con 2 frasi nel ⚙️: manche 1 e 3 con «✍️ scritta da voi»;
//       nella manche 2 il Mistero (forzato): «❓ Apri il Mistero» → «+10.000!» grande, sul leggio i soldi; la ruota torna da 1.000;
//       misure della scelta e della scritta a 360x640 e 412x915; partita fino alla classifica (31 ott: la finale per tutti, poi la busta se vince Paky).
// g7r2: sullo stesso telefono in 2 (Prenota spento): Mistero aperto che va male → «BANCAROTTA!», soldi a zero, tocca all'altro;
//       partita fino alla fine.
// g7r3: online in 3 (Paky host, Luca, Giulia) + Bea che arriva a partita cominciata e guarda; «Anche le nostre», nessuna frase nel ⚙️.
//       Solo Bea ha «✍️ Scrivi una frase»; una frase sbagliata → avviso nel foglio; una giusta → «in coda»; la frase non passa MAI
//       sul broker finché la manche non è risolta; esce nella manche dopo con «✍️ di Bea» su tutti i telefoni; un giocatore che
//       manda una frase a mano viene respinto. A fine manche «⏩ Avanti · 0 su 2» a chi gioca (non a Bea, che vede il conto):
//       Luca tocca → «✅ Avanti · 1 su 2» (stesso tasto), ricarica e ritrova il suo ✅, Giulia tocca → si riparte subito.
//       Mistero online aperto da Luca: nella foto l'esito arriva solo dopo, tutti vedono la scritta grande.
//       Bea manda un'altra frase nell'ultima manche; «Nuova partita»: Bea ora gioca e la sua frase NON esce (resta in coda).
// g7r4: nella Sala in 5 (la Ruota ha 4 posti: uno guarda): ⚙️ della saletta con «Anche le nostre» e una frase (riga «📜» degli
//       amici, la frase mai sul broker), manche 1 «✍️ scritta da voi»; chi guarda manda la sua frase, ricarica e ritrova «in coda»;
//       esce con «✍️ di …» su tutti e 5 i telefoni; «⏩ Avanti» in 4 = «0 su 3», con 2 tocchi si aspetta, al terzo si parte;
//       fine partita coi tasti del core (Rivincita).
// Tutte: COPIONE.carica("migliora2/g7-ruota.js") e poi g7r0 … g7r4 una alla volta (g7r1-r4: 1-2 minuti l'una).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".ru-azioni button, .ru-scrivi-riga button, .ru-form button"), function (b) { return re.test(b.textContent) && !b.disabled && !b.hidden && b.getClientRects().length > 0; }) || null; }
  function lettera(w, L) { return [].find.call(w.document.querySelectorAll(".ru-azioni .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled; }) || null; }
  function Pdi(h) { return h.__RUOTA && h.__RUOTA.ultima; }
  function cat(w) { var c = w.document.querySelector(".ru-cat"); return c ? c.textContent : ""; }
  function base(ch) { return { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" }[ch] || ch; }
  function eL(ch) { return /^[A-ZÀÈÉÌÒÙ]$/.test(ch); }
  var CONS = "BCDFGHJKLMNPQRSTVWXYZ";
  function senzaAnimazioni(w) { var st = w.document.createElement("style"); st.textContent = ".schermata{animation:none!important}.st-barra,.ru-mist,.ru-form{transition:none!important}";   /* (con la finestra nascosta le transizioni restano al primo fotogramma) */ w.document.head.appendChild(st); }
  function dentro(w, sel) {
    var d = w.document, x = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) x.push("la pagina scorre");
    sel.forEach(function (s) {
      var el = d.querySelector(s); if (!el) { x.push("manca " + s); return; }
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.left < -1 || r.top < -1 || r.right > w.innerWidth + 1 || r.bottom > w.innerHeight + 1) x.push(s + " fuori schermo (" + Math.round(r.top) + "-" + Math.round(r.bottom) + " su " + w.innerHeight + ")");
    });
    return x.join(", ");
  }
  async function misura(nome, cosa, sel) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), out = [];
    [[360, 640], [412, 915]].forEach(function () {});
    var M = [[360, 640], [412, 915]];
    for (var i = 0; i < M.length; i++) {
      f.style.width = M[i][0] + "px"; f.style.height = M[i][1] + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(350);
      var e = dentro(w, sel); if (e) out.push(cosa + " a " + M[i][0] + "x" + M[i][1] + ": " + e);
    }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(150);
    return out;
  }
  // scrive la soluzione con la tastiera del gioco: le lettere coperte, nell'ordine
  async function scrivi(w, frase, tab) {
    for (var i = 0; i < tab.length; i++) {
      if (tab.charAt(i) !== "_") continue;
      var b = lettera(w, base(frase.charAt(i)));
      if (!b) return false;
      tocca(w, b); await W.dorme(30);
    }
    var ok = tasto(w, /✓ Risolvi/); if (!ok) return false;
    tocca(w, ok); return true;
  }
  function coperta(P) { return P.frase.split("").map(function (ch) { return eL(ch) && !P.rivelate[base(ch)] ? "_" : ch; }).join(""); }
  // ---- il pilota: fa giocare gli umani (telefoni: { id: finestra }) finché la partita finisce ----
  // opz.mistero = { manche: n, sorte: true/false, apri: true }: in quella manche il primo umano di turno cade sul Mistero
  // opz.avanti(P) = cosa fare a fine manche (online); opz.ogni(P) = chiamata a ogni giro
  async function pilota(H, tel, opz) {
    opz = opz || {};
    var fine = Date.now() + (opz.ms || 300000), k0 = "", fermo = 0, misteri = {}, forzato = null, finFatti = {};
    while (Date.now() < fine) {
      var P = Pdi(H);
      if (!P) { await W.dorme(200); continue; }
      if (opz.ogni) { var r = await opz.ogni(P); if (r === "basta") return P; }
      if (P.fase === "fine" || (H.document.querySelector(".classifica") && !H.document.querySelector(".ru-studio"))) return P;
      if (forzato && P.giroN !== forzato.g) { H.Math.random = forzato.r; forzato = null; }
      var f = P.fase, L = P.lampo, att = f === "lampo" ? L && L.chi : ["fbusta", "fesito"].indexOf(f) >= 0 ? P.busta && P.busta.id : ["fintro", "flettere", "frivela", "ftempo", "fcambio"].indexOf(f) >= 0 ? null : P.giocatori[P.turno] && P.giocatori[P.turno].id;
      // 🏆 (31 ott) la finale per tutti: ogni persona gioca dal suo telefono (opz.finale(P, id, w) può decidere lei: "salta" = non fare niente)
      if ((f === "flettere" || f === "ftempo") && P.fin) {
        for (var fid in tel) {
          var gf = P.fin.g[fid]; if (!gf || P.finFatto(fid) || (f === "flettere" && gf.scelte)) continue;
          var kf = f + ":" + P.fin.b + ":" + fid; if (finFatti[kf] && Date.now() - finFatti[kf] < 3000) continue;
          finFatti[kf] = Date.now();
          var wf = tel[fid];
          try {
            if (opz.finale && (await opz.finale(P, fid, wf)) === "salta") continue;
            if (f === "flettere") {
              var scc = "BCDFGHMPQVZ".split("").slice(0, 3).concat(["A"]);
              scc.forEach(function (ch) { var b = lettera(wf, ch); if (b) tocca(wf, b); });
              await W.dorme(100); var be = tasto(wf, /Ecco le mie lettere/); if (be) tocca(wf, be);
            } else {
              if (P.fin.b === 3) { var bs2 = tasto(wf, /La so: scrivo/); if (bs2) { tocca(wf, bs2); await W.dorme(200); } }
              await scrivi(wf, P.frase, P.finTab(gf.ch));
            }
          } catch (e) {}
        }
        await W.dorme(250); continue;
      }
      var w = att && tel[att], k = [f, P.manche, P.giroN, att, Object.keys(P.chiamate).length, L ? L.n + ":" + L.prove : ""].join("|");
      if (k === k0 && Date.now() - fermo < 900) { await W.dorme(120); continue; }
      k0 = k; fermo = Date.now();
      try {
        if (f === "lampo" && L && !L.chi) {   // il primo umano prenota quando sono uscite un po' di lettere
          if (L.n >= 3) { var ids = Object.keys(tel).filter(function (id) { return !L.fuori[id] && P.trova(id) && !P.trova(id).via; }); if (ids.length) { var wp = tel[ids[0]], np = P.trova(ids[0]).nome;
            var bp = tasto(wp, /PRENOTO/) || tasto(wp, new RegExp("🔔 " + np)); if (bp) tocca(wp, bp); } }
        } else if (!w) { /* tocca a un bot o è un momento che va avanti da solo */ }
        else if (f === "lampo" && L && L.chi) { await W.dorme(300); await scrivi(w, L.frase, P.lampoTab()); }
        else if (f === "gira") {
          var M = opz.mistero;
          if (M && P.manche === M.manche && P.mist === "on" && !misteri[P.manche] && P.consonantiNascoste() > 0) {
            if (!tasto(w, /🎡 Gira/)) { k0 = ""; await W.dorme(250); continue; }   // (la sigla non è ancora finita: i tasti non ci sono)
            misteri[P.manche] = 1; P.sorteMistero = function () { return !!M.sorte; };
            forzato = { g: P.giroN, r: H.Math.random }; H.Math.random = function () { return 22.5 / 24; };
            tocca(w, tasto(w, /🎡 Gira/));
          } else { var br = tasto(w, /💡 Risolvi/); if (br) tocca(w, br); }
        }
        else if (f === "consonante") {
          var c = P.frase.split("").map(base).filter(function (ch) { return CONS.indexOf(ch) >= 0 && !P.chiamate[ch]; })[0];
          if (c && lettera(w, c)) tocca(w, lettera(w, c));
        }
        else if (f === "mistero") { if (opz.dopoScelta) await opz.dopoScelta("prima", P); tocca(w, tasto(w, opz.mistero && opz.mistero.apri === false ? /Mi tengo/ : /Apri il Mistero/)); }
        else if (f === "sceltaexp") tocca(w, tasto(w, /Gioco/));
        else if (f === "express") tocca(w, tasto(w, /Mi fermo/));
        else if (f === "risolvi") { await W.dorme(250); await scrivi(w, P.frase, P.vista().tab); }
        else if (f === "vlettera") { var x = P.frase.split("").map(base).filter(function (ch) { return /[A-Z]/.test(ch) && !P.chiamate[ch]; })[0]; if (x && lettera(w, x)) tocca(w, lettera(w, x)); }
        else if (f === "vdecidi") tocca(w, tasto(w, /Risolvo/));
        else if (f === "fbusta") { if (opz.busta) await opz.busta(P, w); var bb = [].find.call(w.document.querySelectorAll(".ru-btn.busta"), function (b) { return !b.disabled; }); if (bb) tocca(w, bb); }   // (✉️ chi vince sceglie una busta)
        if (f === "finemanche" && opz.avanti) await opz.avanti(P);
      } catch (e) { /* (un tasto sparito tra un giro e l'altro: si riprova) */ }
      await W.dorme(250);
    }
    no("la partita non finisce (fase " + (Pdi(H) || {}).fase + ")");
  }
  async function apriRuota(w) {
    var tess = await W.aspetta(function () { return A.tessera(w, "La Ruota della Fortuna"); }, 6000);
    if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(300);
  }
  function chip(w, re) { var b = [].find.call(w.document.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); }); if (b) b.click(); return !!b; }
  function chipAcceso(w, re) { var b = [].find.call(w.document.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); }); return !!b && /attiva/.test(b.className); }
  // il ⚙️: «Anche le nostre» e le frasi scritte a mano nella casella
  async function scriviNostre(w, lista) {
    if (!chip(w, /Anche le nostre/)) no("nelle regole non c'è «✍️ Anche le nostre»");
    await W.dorme(100);
    var box = w.document.querySelector(".ru-nostre");
    if (!box || box.hidden) no("«Anche le nostre» non apre la casella delle frasi");
    var ins = box.querySelectorAll(".ru-n-in");
    for (var i = 0; i < lista.length; i++) {
      ins[0].value = lista[i][0]; ins[1].value = lista[i][1];
      [].find.call(box.querySelectorAll("button"), function (b) { return /Aggiungi/.test(b.textContent); }).click();
      await W.dorme(80);
      var nota = box.querySelector(".ru-n-nota").textContent;
      if (lista[i][2] ? nota.indexOf(lista[i][2]) < 0 : !/Aggiunta/.test(nota)) no("aggiungendo «" + lista[i][1] + "» l'avviso è «" + nota + "»");
    }
    return box;
  }

  // ---------------------------------------------------------------- g7r0
  COPIONE.aggiungi("g7r0", { nome: "Ruota: controllo delle frasi, riassunto, ⚙️ (Mistero, Frasi), motore del Mistero e delle frasi degli amici", fai: async function () {
    var src = await (await fetch("/js/games/ruota.js?" + Date.now())).text(), g = {};
    var vecchia = window.__RUOTA;
    new Function("SG", src)({ registra: function (x) { Object.assign(g, x); }, bot: window.SG && SG.bot, audioCtx: function () { return null; } });
    var R = window.__RUOTA; window.__RUOTA = vecchia;
    var c = R.controllaFrase;
    var casi = [["Il motto di Paky", "chi dorme non piglia pesci", true], ["", "chi dorme non piglia pesci", /categoria/], ["x", "precipitevolissimevolmente sì", /troppo lunga/],
      ["x", "ciao bea", /corta/], ["x", "PAKY HA 30 ANNI", /non sa mostrare «3»/], ["x", "UNA FRASE LUNGHISSIMA CHE NON STA PROPRIO NEL TABELLONE DELLA RUOTA", /Non sta nel tabellone/],
      ["Motto", "l’unione fa la forza!", true], ["Una categoria lunghissima davvero", "chi dorme non piglia pesci", /Categoria troppo lunga/], ["x", "pàky <b>ciao</b>", /non sa mostrare/]];
    casi.forEach(function (k) { var r = c(k[0], k[1]); if (k[2] === true ? !r.ok : !(r.err && k[2].test(r.err))) no("controllo di «" + k[1] + "»: " + JSON.stringify(r)); });
    if (c("Motto", "l’unione fa la forza!").f !== "L'UNIONE FA LA FORZA!") no("l'apostrofo ricurvo non diventa quello del tabellone");
    var r0 = g.riassunto({}), r1 = g.riassunto({ manche: 3, mistero: false, frasi: "nostre" });
    if (r0 !== "4 manche · 🔔🚂⚡🏆❓") no("riassunto di base: " + r0);
    if (r1 !== "3 manche · 🔔🚂⚡🏆 · ✍️ anche le vostre frasi") no("riassunto con le frasi: " + r1);
    if (!g.regole.some(function (x) { return /Mistero/.test(x) && /10\.000/.test(x) && /Bancarotta/.test(x); })) no("le regole non spiegano il Mistero");
    if (!g.regole.some(function (x) { return /Scrivi una frase/.test(x) && /chi guarda/.test(x); })) no("le regole non spiegano le frasi degli amici");
    if (!g.regole.some(function (x) { return /⏩ Avanti/.test(x) && /più di metà/.test(x); })) no("le regole non spiegano «⏩ Avanti»");
    // il ⚙️ fuori dalla pagina (come lo prepara la Sala)
    var tieni = localStorage.getItem("sg-ruota-nostre"); localStorage.removeItem("sg-ruota-nostre");
    try {
      var box = document.createElement("div"), dove = {};
      var el = function (tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k === "class") e.className = a[k]; else if (k === "style") e.style.cssText = a[k]; else if (k === "onclick") e.onclick = a[k]; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (f) { if (f) e.appendChild(f); }); return e; };
      g.impostazioni(box, dove, { el: el, modo: "online", sala: true });
      if (dove.mistero !== true || dove.frasi !== "gioco") no("valori di base: " + JSON.stringify(dove));
      var ch = function (re) { return [].find.call(box.querySelectorAll(".modo-chip"), function (b) { return re.test(b.textContent); }); };
      var corpo = box.querySelector(".ru-nostre");
      if (!corpo || !corpo.hidden) no("la casella delle frasi si vede anche con «Del gioco»");
      ch(/Mistero/).click(); if (dove.mistero !== false) no("❓ Mistero non si spegne");
      ch(/Anche le nostre/).click(); if (dove.frasi !== "nostre" || corpo.hidden) no("«Anche le nostre» non apre la casella");
      var ins = corpo.querySelectorAll(".ru-n-in"), agg = [].find.call(corpo.querySelectorAll("button"), function (b) { return /Aggiungi/.test(b.textContent); });
      function metti(cc, ff) { ins[0].value = cc; ins[1].value = ff; agg.click(); return corpo.querySelector(".ru-n-nota").textContent; }
      if (!/troppo lunga/.test(metti("Noi", "supercalifragilistichespiralidoso"))) no("la parola lunga non dà l'avviso");
      ["CHI DORME NON PIGLIA PESCI", "PAKY ARRIVA SEMPRE TARDI", "LUCA PAGA DA BERE", "GIULIA VINCE A SCOPA", "IL GIOVEDÌ SI GIOCA"].forEach(function (f, i) { var n = metti("Noi " + i, f); if (!/Aggiunta/.test(n)) no("«" + f + "»: " + n); });
      if (!/il massimo/.test(corpo.querySelector(".ru-n-nota").textContent)) no("alla quinta frase non si dice che è il massimo");
      metti("Noi", "UNA SESTA FRASE DI TROPPO");
      if (!agg.disabled) no("con 5 frasi «Aggiungi» resta acceso");
      var salvate = JSON.parse(localStorage.getItem("sg-ruota-nostre") || "[]");
      if (salvate.length !== 5) no("sul telefono ci sono " + salvate.length + " frasi");
      if (JSON.stringify(dove).indexOf("PESCI") >= 0) no("le frasi finiscono nelle regole (le vedrebbero gli amici)");
      if (/PESCI/.test(corpo.textContent)) no("nella lista le frasi si vedono scoperte");
      var occhio = [].find.call(corpo.querySelectorAll(".ru-n-tasto"), function (b) { return b.textContent === "👁"; }); occhio.click();
      if (!/CHI DORME NON PIGLIA PESCI/.test(corpo.textContent)) no("👁 non mostra la frase");
      [].find.call(corpo.querySelectorAll(".ru-n-tasto"), function (b) { return b.textContent === "✕"; }).click();
      if (JSON.parse(localStorage.getItem("sg-ruota-nostre") || "[]").length !== 4) no("✕ non toglie la frase");
      var box2 = document.createElement("div"); g.impostazioni(box2, { frasi: "nostre" }, { el: el, modo: "bot" });
      if (box2.querySelector(".ru-nostre").hidden || box2.querySelectorAll(".ru-n-riga").length !== 4) no("riaprendo le regole la casella non torna con le 4 frasi");
    } finally { if (tieni == null) localStorage.removeItem("sg-ruota-nostre"); else localStorage.setItem("sg-ruota-nostre", tieni); }
    // il motore: in quali manche c'è il Mistero
    function quali(reg, tot) { var P = R.creaPartita([{ id: "a", nome: "A" }, { id: "b", nome: "B", bot: true }], tot, reg), l = []; for (var m = 1; m <= tot; m++) { P.nuovaManche(); if (P.fase === "lampo") { P.lampoNessuno(); P.dopoLampo(); } if (P.mist) l.push(m); } return l.join(","); }
    var q = [quali({ mistero: true, veloce: true, prenota: true }, 4), quali({ mistero: true }, 4), quali({ mistero: true, veloce: true }, 5), quali({ mistero: false, veloce: true }, 4)];
    if (q.join(" / ") !== "2,3 / 3,4 / 3,4 / ") no("manche col Mistero: " + q.join(" / "));
    function finoAlMistero(sorte, soldi) {
      var P = R.creaPartita([{ id: "a", nome: "A" }, { id: "b", nome: "B" }], 1, { mistero: true }); P.nuovaManche(); P.sorteMistero = function () { return sorte; }; P.giocatori[0].soldi = soldi || 0;
      var rr = Math.random; Math.random = function () { return 22.5 / 24; }; P.gira(); Math.random = rr; P.dopoGiro();
      if (P.fase !== "consonante" || !/Mistero/.test(P.msg)) no("sul Mistero: " + P.fase + " «" + P.msg + "»");
      P.consonante(R.solo(P.frase).split("").filter(function (ch) { return CONS.indexOf(ch) >= 0; })[0]);
      if (P.fase !== "mistero") no("con la consonante giusta non si sceglie (fase " + P.fase + ")");
      return P;
    }
    var P1 = finoAlMistero(true, 500), s1 = P1.giocatori[0].soldi; P1.mistero(true);
    if (/vinto|mres/.test(JSON.stringify(P1.vista()))) no("nella foto c'è l'esito prima che si apra");
    P1.mistRivela(); var v1 = P1.vista();
    if (!v1.mres || !v1.mres.vinto || P1.giocatori[0].soldi !== s1 + 10000 || v1.mist !== "aperto" || P1.spicchi[22].s || P1.spicchi[22].v !== 1000) no("Mistero vinto: " + JSON.stringify([v1.mres, P1.giocatori[0].soldi, P1.spicchi[22]]));
    P1.dopoMistero(); if (P1.fase !== "gira" || P1.turno !== 0) no("dopo il Mistero vinto non gioca ancora");
    var P2 = finoAlMistero(false, 3000); P2.mistero(true); P2.mistRivela();
    if (P2.giocatori[0].soldi !== 0 || P2.giocatori[0].stat.bancarotte !== 1) no("Mistero perso: soldi " + P2.giocatori[0].soldi);
    P2.dopoMistero(); if (P2.turno !== 1) no("dopo la Bancarotta del Mistero non tocca all'altro");
    var P3 = finoAlMistero(true); P3.rinuncia(true); if (P3.fase !== "gira" || P3.mist !== "on") no("tempo scaduto sulla scelta: " + P3.fase + " " + P3.mist);
    P3.giocatori[1].totale = 4000; if (!R.apreMistero(P3)) no("il Bot indietro non apre"); P3.giocatori[1].totale = 0; P3.giocatori[0].totale = 10; if (R.apreMistero(P3)) no("il Bot davanti apre");
    // le frasi degli amici: una manche su due, con la firma
    var n = 0, P4 = R.creaPartita([{ id: "a", nome: "A" }, { id: "b", nome: "B" }], 5, { frasi: "nostre", amica: function () { n++; return { f: "PAKY E LUCA AL MARE", c: "Noi", firma: n === 1 ? "" : "Bea" }; } }), giri = [];
    for (var m = 1; m <= 5; m++) { P4.nuovaManche(); giri.push(P4.cat === "Noi" ? P4.vista().firma || "voi" : "-"); }
    if (giri.join(",") !== "voi,-,Bea,-,Bea") no("frasi degli amici: " + giri.join(","));
    var P5 = R.creaPartita([{ id: "a", nome: "A" }, { id: "b", nome: "B" }], 2, { frasi: "gioco", amica: function () { return { f: "PAKY E LUCA AL MARE", c: "Noi", firma: "" }; } }); P5.nuovaManche();
    if (P5.cat === "Noi") no("con «Del gioco» esce una frase degli amici");
    return "ok · " + r0 + " · Mistero nelle manche " + q.join(" / ") + " · frasi " + giri.join(",");
  } });

  // ---------------------------------------------------------------- g7r1
  COPIONE.aggiungi("g7r1", { nome: "Ruota contro i Bot: ✍️ due frasi nostre, ❓ Mistero vinto, partita intera", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }); senzaAnimazioni(P);
    try { P.localStorage.removeItem("sg-ruota-nostre"); } catch (e) {}
    await apriRuota(P);
    if (!W.clicca(P, /Contro i Bot/, ".modo-grande")) no("non c'è «Contro i Bot»");
    await W.dorme(300);
    if (!chip(P, /^Facile$/)) no("non trovo «Facile»");
    if (!chipAcceso(P, /Mistero/)) no("❓ Mistero non è acceso di base");
    if (!chipAcceso(P, /Del gioco/)) no("«Frasi: Del gioco» non è la scelta di base");
    await scriviNostre(P, [["Il motto di Paky", "chi dorme non piglia pesci"], ["La compagnia", "IL GIOVEDÌ SI GIOCA A CARTE"], ["x", "ciao", "corta"]]);
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    var misure = [], visti = {}, mist = null;
    var Pf = await pilota(P, { host: P }, {
      mistero: { manche: 2, sorte: true, apri: true },
      dopoScelta: async function () { misure = misure.concat(await misura("Paky", "la scelta del Mistero", [".ru-azioni", ".ru-cat"])); },
      ogni: async function (G) {
        var c = cat(P);
        if (G.fase === "gira" || G.fase === "consonante") visti[G.manche] = c;
        if (G.fase === "mapre" && !mist) {
          mist = { apre: P.document.querySelector(".ru-mist.on.apre") ? 1 : 0 };
        }
        if (G.fase === "mrivela" && mist && !mist.esito) {
          await W.dorme(200);
          var big = P.document.querySelector(".ru-mist.on.vinto");
          mist.esito = big ? big.textContent : "(niente)";
          mist.soldi = G.giocatori[0].soldi;
          misure = misure.concat(await misura("Paky", "la scritta del Mistero", [".ru-mist", ".ru-cat"]));
          mist.spicchio = JSON.stringify(G.spicchi[22]);
        }
      } });
    if (!mist || !mist.apre) no("mentre si apre il Mistero non si vede «❓ MISTERO…»");
    if (!/\+10\.000!/.test(mist.esito)) no("la scritta del Mistero vinto è «" + mist.esito + "»");
    if (mist.soldi < 10000) no("dopo il Mistero vinto i soldi sono " + mist.soldi);
    if (mist.spicchio !== '{"v":1000}') no("aperto, lo spicchio è " + mist.spicchio);
    if (!/✍️ scritta da voi/.test(visti[1] || "") || !/✍️ scritta da voi/.test(visti[3] || "")) no("manche 1 e 3 senza la firma: " + JSON.stringify(visti));
    if (/✍️/.test(visti[2] || "") || /✍️/.test(visti[4] || "")) no("due frasi degli amici di fila: " + JSON.stringify(visti));
    var tf = await W.aspetta(function () { return P.document.querySelector(".classifica") && T(P); }, 30000);
    if (!tf) no("non arriva la classifica");
    if (misure.length) no(misure.join(" · "));
    return "manche: " + Object.keys(visti).map(function (k) { return k + "=" + visti[k]; }).join(" | ") + " · Mistero «" + mist.esito.replace(/\s+/g, " ") + "», soldi " + mist.soldi + " · classifica: " + tf.replace(/\s+/g, " ").slice(0, 90);
  } });

  // ---------------------------------------------------------------- g7r2
  COPIONE.aggiungi("g7r2", { nome: "Ruota sullo stesso telefono in 2: ❓ Mistero che va in Bancarotta, partita intera", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }); senzaAnimazioni(P);
    await apriRuota(P);
    if (!W.clicca(P, /Sullo stesso telefono/, ".modo-grande")) no("non c'è «Sullo stesso telefono»");
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) no("non si scrivono i nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/); await W.dorme(300);
    if (!chip(P, /^3 manche$/)) no("non trovo «3 manche»");
    chip(P, /Giochi veloci/);   // spento: si va più spediti
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    var tel = { p0: P, p1: P }, mist = null;
    await pilota(P, tel, { mistero: { manche: 1, sorte: false, apri: true }, ogni: async function (G) {
      if (G.fase === "mrivela" && !mist) {
        await W.dorme(200);
        var big = P.document.querySelector(".ru-mist.on.banca");
        mist = { esito: big ? big.textContent : "(niente)", soldi: G.giocatori.map(function (x) { return x.soldi; }), chi: G.mres && G.mres.id };
      }
      if (mist && !mist.dopo && G.fase !== "mrivela" && G.fase !== "mapre") { mist.dopo = G.giocatori[G.turno].id; mist.tasti = (P.document.querySelector(".ru-azioni") || {}).textContent; }
    } });
    if (!mist) no("il Mistero non si è aperto");
    if (!/BANCAROTTA!/.test(mist.esito) || !/Ahi!/.test(mist.esito)) no("la scritta del Mistero perso è «" + mist.esito + "»");
    var i = mist.chi === "p0" ? 0 : 1;
    if (mist.soldi[i] !== 0) no("dopo la Bancarotta del Mistero ha ancora " + mist.soldi[i]);
    if (mist.dopo === mist.chi) no("dopo la Bancarotta del Mistero gioca ancora lo stesso");
    var tf = await W.aspetta(function () { return P.document.querySelector(".classifica") && T(P); }, 30000);
    if (!tf || !/Paky/.test(tf) || !/Giulia/.test(tf)) no("non arriva la classifica con tutti e due");
    return "«" + mist.esito.replace(/\s+/g, " ") + "», poi tocca a " + mist.dopo + " · " + tf.replace(/\s+/g, " ").slice(0, 80);
  } });

  // ---------------------------------------------------------------- g7r3
  COPIONE.aggiungi("g7r3", { nome: "Ruota online in 3 + Bea che guarda: ✍️ frase di Bea, ⏩ Avanti a maggioranza, ❓ Mistero, frase dell'autrice che gioca", fai: async function () {
    var F = {}, misure = [];
    var P = F.Paky = await W.apriTel("Paky", { x: 0 }); senzaAnimazioni(P);
    try { P.localStorage.removeItem("sg-ruota-nostre"); } catch (e) {}
    await apriRuota(P);
    if (!W.clicca(P, /apro io/, ".modo-grande")) no("non c'è «Online: apro io»");
    await W.dorme(300);
    chip(P, /^3 manche$/); chip(P, /Giochi veloci/); chip(P, /Finale/); chip(P, /Anche le nostre/);
    if (!W.clicca(P, /Apri la stanza/)) no("non c'è «Apri la stanza»");
    var C = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 6000);
    if (!C) no("niente codice");
    F.Luca = await W.apriTel("Luca", { hash: "gioco=ruota&stanza=" + C, x: 185 }); senzaAnimazioni(F.Luca);
    F.Giulia = await W.apriTel("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 370 }); senzaAnimazioni(F.Giulia);
    if (!await W.aspetta(function () { return (W.vmDi(C).giocatori || []).length === 3; }, 10000)) no("in saletta non sono in 3");
    await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("«Comincia» spento");
    if (!await W.aspetta(function () { return Pdi(P) && Pdi(P).fase === "gira"; }, 40000)) no("la partita non comincia");
    F.Bea = await W.apriTel("Bea", { hash: "gioco=ruota&stanza=" + C, x: 555 }); senzaAnimazioni(F.Bea);
    var id = function (n) { var h = W.reteDi(n); return h && h.stato ? h.stato().id : null; };
    var tel = { host: P }; ["Luca", "Giulia"].forEach(function (n) { tel[id(n)] = F[n]; });
    if (Object.keys(tel).length !== 3) no("non trovo gli id di Luca e Giulia");
    var B = F.Bea, scr = await W.aspetta(function () { return tasto(B, /Scrivi una frase/); }, 25000);
    if (!scr) no("Bea (guarda) non ha «✍️ Scrivi una frase» («" + T(B).slice(-120) + "»)");
    if (tasto(F.Luca, /Scrivi una frase/)) no("anche Luca (gioca) ha «Scrivi una frase»");
    misure = misure.concat(await misura("Bea", "chi guarda", [".ru-scrivi-riga", ".ru-cat"]));
    tocca(B, scr); await W.dorme(300);
    var form = B.document.querySelector(".ru-form.on"); if (!form) no("il foglio per scrivere non si apre");
    misure = misure.concat(await misura("Bea", "il foglio della frase", [".ru-form", ".ru-form .ru-btn.risolvi"]));
    var ins = form.querySelectorAll(".ru-f-in");
    ins[0].value = "Il motto di Bea"; ins[1].value = "evviva la ruota 2026";
    tocca(B, tasto(B, /Manda all'host/)); await W.dorme(200);
    if (!/non sa mostrare «2»/.test(form.querySelector(".ru-f-nota").textContent)) no("la frase sbagliata non dà l'avviso («" + form.querySelector(".ru-f-nota").textContent + "»)");
    var FRASE = "BEA HA SEMPRE RAGIONE";
    ins[1].value = FRASE.toLowerCase();
    tocca(B, tasto(B, /Manda all'host/));
    if (!await W.aspetta(function () { return (W.vmDi(C).coda || []).indexOf(id("Bea")) >= 0 && /in coda/.test(B.document.querySelector(".ru-scrivi-nota").textContent); }, 5000)) no("la frase di Bea non entra in coda");
    if (B.document.querySelector(".ru-form.on")) no("il foglio resta aperto dopo «Frase arrivata»");
    if (tasto(B, /Scrivi una frase/)) no("con la frase in coda Bea può mandarne un'altra");
    // un giocatore che la manda a mano: no
    W.reteDi("Luca").invia({ t: "frase", c: "Luca", f: "LUCA HA SEMPRE RAGIONE" }); await W.dorme(400);
    if ((Pdi(P) && P.__RUOTA.H.coda || []).some(function (x) { return /LUCA/.test(x.f); })) no("la frase di Luca (gioca) è entrata in coda");
    // la frase non passa MAI sul broker finché non è risolta
    // (tranne la copia per i vice del Passo 5, __ris: la manda il core e c'è tutta la partita, anche la frase da indovinare)
    var sulloStato = function () { return (BR.storia || []).some(function (x) { var s = JSON.stringify(x); return s.indexOf("BEA HA SEMPRE") >= 0 && !/__ris/.test(s); }) || JSON.stringify(BR.retained).indexOf("BEA HA SEMPRE") >= 0; };   // (le foto: mai la frase prima che sia risolta)
    var stati = { avanti: null, bea: null, mist: null, prima: null }, firmaVista = null, kAvRic = null;
    await pilota(P, tel, {
      mistero: { manche: 2, sorte: true, apri: true },
      ogni: async function (G) {
        if (G.firma === "Bea" && !firmaVista && (G.fase === "gira" || G.fase === "consonante")) {
          await W.dorme(400);
          firmaVista = ["Paky", "Luca", "Giulia", "Bea"].map(function (n) { return n + ":" + (/✍️ di Bea/.test(cat(F[n])) ? "sì" : cat(F[n])); });
          var vmNow = JSON.stringify(W.vmDi(C));
          if (vmNow.indexOf("RAGIONE") >= 0 || sulloStato()) no("la frase di Bea è passata nelle foto prima di essere risolta");
          stati.prima = "ok";
        }
        if (G.fase === "mapre" && !stati.mist) { stati.mist = { foto: JSON.stringify(W.vmDi(C)) }; }
        if (G.fase === "mrivela" && stati.mist && !stati.mist.vede) {
          await W.dorme(300);
          stati.mist.vede = ["Paky", "Luca", "Giulia", "Bea"].filter(function (n) { return F[n].document.querySelector(".ru-mist.on.vinto"); }).join(",");
        }
        // il primo riepilogo: Luca tocca, ricarica, poi Giulia
        if (G.fase === "finemanche" && !stati.avanti) {
          stati.avanti = "inizio";
          var bl = await W.aspetta(function () { return F.Luca.document.querySelector(".ru-btn.avanti"); }, 4000);
          if (!bl || !/⏩ Avanti · 0 su 2/.test(bl.textContent)) no("Luca non ha «⏩ Avanti · 0 su 2» («" + (bl && bl.textContent) + "»)");
          if (F.Bea.document.querySelector(".ru-btn.avanti")) no("Bea (guarda) ha «⏩ Avanti»");
          if (!/Si va avanti tra/.test(F.Bea.document.querySelector(".ru-conto").textContent)) no("Bea non vede il conto");
          misure = misure.concat(await misura("Luca", "il riepilogo", [".ru-btn.avanti", ".ru-conto"]));
          tocca(F.Luca, bl);
          if (!await W.aspetta(function () { return /✅ Avanti · 1 su 2/.test(bl.textContent) && F.Luca.document.contains(bl); }, 3000)) no("dopo il tocco il tasto di Luca è «" + bl.textContent + "» (o è stato rifatto)");
          if (!await W.aspetta(function () { var b = P.document.querySelector(".ru-btn.avanti"); return b && /1 su 2/.test(b.textContent); }, 3000)) no("Paky non vede «1 su 2»");
          kAvRic = W.vmDi(C).kAv;
          F.Luca = await W.ricarica("Luca"); senzaAnimazioni(F.Luca); tel[id("Luca")] = F.Luca;
          var b2 = await W.aspetta(function () { var b = F.Luca.document.querySelector(".ru-btn.avanti"); return b && /✅ Avanti/.test(b.textContent) && b; }, 12000);
          if (!b2 && W.vmDi(C).kAv === kAvRic) no("Luca, ricaricata la pagina, non ritrova il suo «✅ Avanti»");
          var t0 = Date.now(), bg = F.Giulia.document.querySelector(".ru-btn.avanti");
          if (W.vmDi(C).kAv === kAvRic && bg) {
            tocca(F.Giulia, bg);
            if (!await W.aspetta(function () { return Pdi(P).fase !== "finemanche"; }, 2500)) no("con 2 su 2 non si riparte subito");
            stati.avanti = "subito in " + (Date.now() - t0) + " ms";
          } else stati.avanti = "(il riepilogo è finito durante la ricarica)";
        }
        // nell'ultima manche Bea manda un'altra frase: resta in coda per la prossima partita
        if (G.manche === 3 && !stati.bea && G.fase !== "finemanche" && tasto(F.Bea, /Scrivi una frase/)) {   // (la manche 3 è il round veloce)
          stati.bea = "mandata";
          tocca(F.Bea, tasto(F.Bea, /Scrivi una frase/)); await W.dorme(200);
          var f2 = F.Bea.document.querySelectorAll(".ru-form .ru-f-in"); f2[0].value = "Bea dice"; f2[1].value = "LA RIVINCITA LA VINCO IO";
          tocca(F.Bea, tasto(F.Bea, /Manda all'host/));
          if (!await W.aspetta(function () { return (W.vmDi(C).coda || []).indexOf(id("Bea")) >= 0; }, 4000)) no("la seconda frase di Bea non entra in coda");
        }
      } });
    if (!firmaVista) no("la frase di Bea non è uscita");
    if (firmaVista.some(function (x) { return !/:sì$/.test(x); })) no("la firma «✍️ di Bea» non si vede su tutti: " + firmaVista.join(" "));
    if (!stati.mist || /"mres"/.test(stati.mist.foto)) no("nella foto del Mistero che si apre c'è già l'esito");
    if (!stati.mist.vede || stati.mist.vede.split(",").length !== 4) no("la scritta del Mistero la vedono solo: " + (stati.mist.vede || "nessuno"));
    if (!stati.bea) no("Bea non ha mandato la seconda frase");
    // la classifica per tutti, poi «Nuova partita»: Bea ora gioca e la sua frase non esce
    if (!await W.aspetta(function () { return ["Paky", "Luca", "Giulia"].every(function (n) { return F[n].document.querySelector(".classifica"); }); }, 30000)) no("non arriva la classifica a tutti");
    var nuova = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll("button"), function (b) { return /Nuova partita|Rivincita/.test(b.textContent); }); }, 5000);
    if (!nuova) no("l'host non ha «Nuova partita»");
    nuova.click();
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "lobby" && (W.vmDi(C).giocatori || []).length === 4; }, 15000)) no("nella saletta nuova non sono in 4 (" + JSON.stringify((W.vmDi(C).giocatori || []).map(function (p) { return p.nome; })) + ")");
    await W.dorme(400);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { var G = Pdi(P); return G && G.manche >= 1 && G.fase === "gira"; }, 40000)) no("la nuova partita non comincia");
    var G = Pdi(P);
    if (G.firma === "Bea" || /RIVINCITA LA VINCO/.test(G.frase)) no("Bea gioca e riceve la sua frase");
    if ((W.vmDi(C).coda || []).indexOf(id("Bea")) < 0) no("la frase di Bea non è più in coda");
    if (misure.length) no(misure.join(" · "));
    return "firma: " + firmaVista.join(" ") + " · Avanti " + stati.avanti + " · Mistero visto da " + stati.mist.vede + " · nuova partita: manche 1 «" + G.cat + "», la frase di Bea resta in coda";
  } });

  // ---------------------------------------------------------------- g7r4
  COPIONE.aggiungi("g7r4", { nome: "Ruota nella Sala in 5 (4 giocano, 1 guarda): ⚙️ «Anche le nostre» dalla saletta, la frase di chi guarda, ⏩ Avanti 3 su 4, fine col core", fai: async function () {
    var Sa = await A.salaConAmici(["Luca", "Giulia", "Ciro", "Bea"]), S = Sa.S, F = Sa.w, P = F.Paky, misure = [];
    Object.keys(F).forEach(function (n) { senzaAnimazioni(F[n]); });
    try { P.localStorage.removeItem("sg-ruota-nostre"); } catch (e) {}
    var C = await A.lanciaDallaSala("Paky", S, "La Ruota della Fortuna");
    if (!await W.aspetta(function () { return (W.vmDi(C).giocatori || []).length === 4; }, 12000)) no("nella saletta non sono in 4 (" + JSON.stringify((W.vmDi(C).giocatori || []).map(function (p) { return p.nome; })) + ")");
    // ⚙️ Regole della saletta: 3 manche, niente Prenota né finale, «✍️ Anche le nostre» con una frase
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 4000)) no("non trovo ⚙️ Regole");
    await W.dorme(300);
    chip(P, /^3 manche$/); chip(P, /Giochi veloci/); chip(P, /Finale/);
    await scriviNostre(P, [["Il motto di Paky", "CHI DORME NON PIGLIA PESCI"]]);
    W.clicca(P, /Fatto/, ".sl-foglio button, .sl-velo button"); await W.dorme(500);
    var rr = await W.aspetta(function () { var x = A.regoleDi(F.Giulia); return /anche le vostre frasi/.test(x) ? x : null; }, 5000);
    if (!rr) no("la riga «📜 Si gioca così» di Giulia non dice «✍️ anche le vostre frasi» («" + A.regoleDi(F.Giulia) + "»)");
    if (/PESCI/.test(JSON.stringify(W.vmDi(C))) || /PESCI/.test(JSON.stringify(BR.storia))) no("la frase del ⚙️ passa sul broker");
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "gioco" || W.clicca(P, /Comincia/, ".sl-go"); }, 12000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return Pdi(P) && Pdi(P).fase === "gira"; }, 40000)) no("la partita non comincia");
    var id = function (n) { var h = W.reteDi(n); return h && h.stato ? h.stato().id : null; };
    var G0 = Pdi(P), tel = { host: P }, chiGuarda = null;
    ["Luca", "Giulia", "Ciro", "Bea"].forEach(function (n) { if (G0.trova(id(n))) tel[id(n)] = F[n]; else chiGuarda = n; });
    if (!chiGuarda || Object.keys(tel).length !== 4) no("non trovo chi guarda (" + Object.keys(tel).length + " al tavolo)");
    var B = F[chiGuarda];
    if (!await W.aspetta(function () { return /✍️ scritta da voi/.test(cat(P)); }, 20000)) no("la manche 1 non è la frase del ⚙️ («" + cat(P) + "», firma " + JSON.stringify(G0.firma) + ")");
    if (/PESCI/.test(JSON.stringify(W.vmDi(C)))) no("la frase del ⚙️ è nella foto");
    ["Luca", "Giulia", "Ciro", "Bea"].filter(function (n) { return n !== chiGuarda; }).forEach(function (n) { if (tasto(F[n], /Scrivi una frase/)) no(n + " gioca e ha «Scrivi una frase»"); });
    var scr = await W.aspetta(function () { return tasto(B, /Scrivi una frase/); }, 20000);
    if (!scr) no(chiGuarda + " (guarda) non ha «✍️ Scrivi una frase» («" + T(B).slice(-120) + "»)");
    misure = misure.concat(await misura(chiGuarda, "chi guarda nella Sala", [".ru-scrivi-riga", ".ru-cat", ".ru-azioni"]));
    tocca(B, scr); await W.dorme(300);
    var ins = B.document.querySelectorAll(".ru-form.on .ru-f-in"); if (ins.length !== 2) no("il foglio per scrivere non si apre");
    ins[0].value = "Il motto di " + chiGuarda; ins[1].value = "IL GIOVEDI SI GIOCA";
    tocca(B, tasto(B, /Manda all'host/));
    if (!await W.aspetta(function () { return (W.vmDi(C).coda || []).indexOf(id(chiGuarda)) >= 0; }, 5000)) no("la frase di chi guarda non entra in coda");
    // ricarica: ritrova «la tua frase è in coda»
    F[chiGuarda] = B = await W.ricarica(chiGuarda); senzaAnimazioni(B);
    if (!await W.aspetta(function () { var n = B.document.querySelector(".ru-scrivi-nota"); return n && /in coda/.test(n.textContent) && n.getClientRects().length; }, 15000)) no(chiGuarda + ", ricaricata la pagina, non ritrova «la tua frase è in coda»");
    var stato = { av: null, firma: null };
    await pilota(P, tel, {
      ogni: async function (G) {
        if (G.firma === chiGuarda && !stato.firma && G.fase !== "finemanche") {
          await W.dorme(400);
          stato.firma = Object.keys(F).filter(function (n) { return new RegExp("✍️ di " + chiGuarda).test(cat(F[n])); }).length;
          if (/GIOVEDI SI GIOCA/.test(JSON.stringify(W.vmDi(C)))) no("la frase di chi guarda è nella foto prima di essere risolta");
        }
      },
      avanti: async function (G) {
        if (stato.av) return;
        stato.av = "inizio";
        var nomi = ["Paky"].concat(Object.keys(tel).filter(function (k) { return k !== "host"; }).map(function (k) { return Object.keys(F).filter(function (n) { return F[n] === tel[k]; })[0]; }));
        var b0 = await W.aspetta(function () { return F[nomi[1]].document.querySelector(".ru-btn.avanti"); }, 4000);
        if (!b0 || !/0 su 3/.test(b0.textContent)) no("in 4 il riepilogo non dice «0 su 3» («" + (b0 && b0.textContent) + "»)");
        if (B.document.querySelector(".ru-btn.avanti")) no("chi guarda ha «⏩ Avanti»");
        var t0 = Date.now();
        for (var i = 1; i <= 3; i++) {
          var b = F[nomi[i]].document.querySelector(".ru-btn.avanti"); if (b) tocca(F[nomi[i]], b);
          await W.dorme(250);
          if (i < 3 && Pdi(P).fase !== "finemanche") no("si riparte con " + i + " su 3");
        }
        if (!await W.aspetta(function () { return Pdi(P).fase !== "finemanche"; }, 2500)) no("con 3 su 3 non si riparte subito");
        stato.av = "3 su 4 → via in " + (Date.now() - t0) + " ms";
      } });
    if (!stato.firma) no("la frase di chi guarda non è uscita");
    if (stato.firma !== 5) no("la firma «✍️ di " + chiGuarda + "» la vedono " + stato.firma + " telefoni su 5");
    if (!await W.aspetta(function () { return /Rivincita/.test(T(P)) && ["Luca", "Giulia", "Ciro"].every(function (n) { return F[n].document.querySelector(".classifica"); }); }, 30000)) no("a fine partita non ci sono i tasti del core («" + T(P).slice(-120) + "»)");
    if (misure.length) no(misure.join(" · "));
    return "guarda " + chiGuarda + " · " + rr + " · firma vista da " + stato.firma + " · Avanti " + stato.av;
  } });
})();
