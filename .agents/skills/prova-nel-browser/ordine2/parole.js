// PROVE DI PAROLA D'ORDINE, giro 2 (21 ott 2026), compito «Le parole» (data/ordine-parole.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("ordine2/parole.js"); await COPIONE.prova("o2p1")
// Con Edge invisibile: prova.js --porta 8995 --carica ordine2/parole.js --prova o2p1,o2p2,o2p3 --rifai
//
// o2p1: le liste come le carica l'app: il Classico (più di 1.500 parole) e il 🌶️ Serata (circa 250), nessun altro mazzo
//       (i mazzi a tema non ci sono più); niente doppioni, solo lettere, da 3 a 10, nessuna parola di 4+ lettere all'inizio
//       di un'altra; le parole che ne contengono un'altra (NAVE e ASTRONAVE) e quelle che il gioco trova «simili» (PIZZA e
//       PIZZERIA) stanno tutte in SG_ORDINE_SORELLE; ogni sorella esiste scritta uguale nella stessa lista; il gioco
//       (__ORDINE.sorelle) le legge tutte; via le parole tolte (ESQUIMESE, CAPELLO, SEGA nel Classico, AMICIZIA…) e dentro
//       quelle nuove (ARCO, PEDALÒ, PUNIZIONE, COPIONE…); 2.000 tabelloni fatti come li fa il gioco: pieni e mai due sorelle.
// o2p2: online in 4: un tabellone vero del Classico (25 parole del Classico, nessuna coppia di sorelle, nessuna radice doppia)
//       e uno del 🌶️ Serata (tutte e 25 del Serata).
// o2p3: le parole nuove più lunghe (SALVAGENTE, FORMAZIONE, PROMOZIONE, CHIOCCIOLA…) messe sul tabellone come «parole
//       vostre»: a 360x640 e 412x915, sul telefono di chi indovina, ogni parola sta nella sua casella e la pagina non scorre.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no;
  var LUNGHE = ["SALVAGENTE", "FORMAZIONE", "PROMOZIONE", "CHIOCCIOLA", "CARTUCCIA", "PELLICOLA", "MERCOLEDÌ", "MONTAGGIO",
    "MARCATORE", "TRASFERTA", "PUNIZIONE", "NAZIONALE"];

  // ---- la spia (solo con apriTel(nome, { o2p: true })): w.__impO2 = regole per la prova, le legge l'host all'avvio ----
  if (!W.__prepO2P) {
    W.__prepO2P = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepO2P(w, nome, opz);
      if (!opz || !opz.o2p) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "ordine") {
            var avvia = g.avvia;
            g.avvia = function (t) {
              if (w.__impO2 && t.impostazioni && !(t.linkParams && t.linkParams.stanza)) Object.keys(w.__impO2).forEach(function (k) { t.impostazioni[k] = w.__impO2[k]; });
              return avvia.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- le regole delle liste (le stesse di data/ordine-parole.js; radice e «simile» come nel gioco) ----
  var ACC = { "À": "A", "Á": "A", "È": "E", "É": "E", "Ì": "I", "Í": "I", "Ò": "O", "Ó": "O", "Ù": "U", "Ú": "U" };
  function norm(w) { return String(w || "").toUpperCase().split("").map(function (c) { return ACC[c] || c; }).join("").replace(/[^A-Z]/g, ""); }
  function simile(a, b, radice) {
    var corta = a.length <= b.length ? a : b, lunga = a.length <= b.length ? b : a;
    if (corta.length >= 4 && lunga.indexOf(corta) === 0) return true;
    var rc = radice(corta);
    return rc.length >= 4 && lunga.length - corta.length >= 2 && lunga.indexOf(rc) === 0 && lunga.length - rc.length <= 4;
  }
  function chiave(a, b) { return [norm(a), norm(b)].sort().join("|"); }
  function controllaLista(nome, l, sor, radice, N) {
    var n = l.map(norm), visti = {}, scoperte = [], pb = [];
    l.forEach(function (w, i) {
      if (!/^[A-ZÀÈÉÌÒÙ]+$/.test(w)) pb.push("«" + w + "» ha caratteri strani");
      if (w.length < 3 || w.length > 10) pb.push("«" + w + "» ha " + w.length + " lettere");
      if (visti[n[i]]) pb.push("«" + w + "» è doppia"); visti[n[i]] = 1;
    });
    for (var i = 0; i < n.length; i++) for (var j = 0; j < n.length; j++) {
      if (i === j || n[i] === n[j]) continue;
      if (n[i].length >= 4 && n[j].indexOf(n[i]) === 0) pb.push("«" + l[i] + "» all'inizio di «" + l[j] + "»");
      var dentro = n[i].length >= 4 && n[j].indexOf(n[i]) > 0, sim = i < j && simile(n[i], n[j], radice);
      if ((dentro || sim) && radice(n[i]) !== radice(n[j]) && !sor[chiave(l[i], l[j])]) scoperte.push(l[i] + "/" + l[j]);
    }
    if (pb.length) no(nome + ": " + pb.slice(0, 8).join(", "));
    if (scoperte.length) no(nome + ": coppie da tenere separate che non sono nelle sorelle: " + scoperte.slice(0, 10).join(", "));
    N.push(nome + " " + l.length + " parole: regole OK");
  }
  function giaSorelle(tab, S) {
    var c = {}; tab.forEach(function (w) { c[norm(w)] = 1; });
    return S.filter(function (p) { return c[norm(p[0])] && c[norm(p[1])]; }).map(function (p) { return p.join("/"); });
  }

  // ---- la stanza: Paky apre, Giulia, Luca e Sara entrano; imp = le regole della prova ----
  async function stanza(imp) {
    var P = await W.apriTel("Paky", { x: 0, o2p: true, prima: function (w) { w.__impO2 = imp || null; } });
    var C = await W.apriStanza(P, "Parola d'ordine");
    var amici = ["Giulia", "Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1) });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 4; }, 10000)) no("non entrano tutti (" + (vm(C).players || []).length + ")");
    return { P: P, C: C };
  }
  async function comincia(X) {
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 6000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { var v = vm(X.C); return v.fase === "gioco" && (v.tab || []).length >= 20; }, 10000)) no("la partita non comincia (" + vm(X.C).fase + ")");
    await W.dorme(500);
    return vm(X.C).tab.map(function (c) { return c.w; });
  }
  // il telefono di chi indovina nei Rossi o nei Blu (non il capo)
  function indovina(X) {
    var v = vm(X.C), p = (v.players || []).filter(function (p) { return v.capo.indexOf(p.id) < 0 && p.id !== "host"; })[0];
    return p ? p.nome : null;
  }
  function calmo(w) {
    var ui = w.__ORDINE && w.__ORDINE.ui, d = w.document; if (!ui || !ui.S) return !!d.querySelector(".or-tab .or-carta");
    if (ui.inScena || (ui.coda && ui.coda.length)) return false;
    if (ui.S.shot && ui.S.R && ui.S.shot() !== ui.S.R.schermo) return false;
    return !d.querySelector(".or-vignetta.su, .st-terzo.on");
  }
  // mette il telefono a quella misura, in alto a sinistra e a grandezza vera (anche per le foto)
  function misura(nome, L, H) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome);
    f.style.transform = "none"; f.style.left = "0px"; f.style.top = "0px"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 50;
    try { void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize")); } catch (e) {}
  }
  function stanno(nome) {   // ogni parola sta nella sua casella? la pagina scorre?
    var w = W.finestra(nome), d = w.document, out = [], fs = [];
    if (d.documentElement.scrollHeight > w.innerHeight + 1) out.push("la pagina scorre (" + d.documentElement.scrollHeight + " su " + w.innerHeight + ")");
    [].forEach.call(d.querySelectorAll(".or-tab .or-carta"), function (b) {
      var s = b.querySelector(".or-w"); if (!s) return;
      fs.push([parseFloat(w.getComputedStyle(s).fontSize), s.textContent]);
      if (s.scrollWidth > b.clientWidth + 1 || s.offsetHeight > b.clientHeight + 1) out.push("«" + s.textContent + "» non ci sta nella casella");
    });
    fs.sort(function (a, b) { return a[0] - b[0]; });
    return { out: out, piccole: fs.slice(0, 3).map(function (x) { return x[1] + " " + x[0].toFixed(1) + "px"; }).join(", ") };
  }
  COPIONE.o2p = { stanza: stanza, comincia: comincia, indovina: indovina, calmo: calmo, misura: misura, stanno: stanno, LUNGHE: LUNGHE };

  COPIONE.aggiungi("o2p1", { nome: "Parola d'ordine, le parole: Classico e 🌶️ Serata, regole, sorelle, 2.000 tabelloni", fai: async function () {
    var N = [];
    var w = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return w.__ORDINE && w.SG_ORDINE_PAROLE; }, 8000)) no("l'app non ha caricato le parole");
    var C = w.SG_ORDINE_PAROLE, M = w.SG_ORDINE_MAZZI || {}, S = w.SG_ORDINE_SORELLE, O = w.__ORDINE;
    if (!Array.isArray(C) || C.length < 1500) no("il Classico ha " + (C && C.length) + " parole");
    if (JSON.stringify(Object.keys(M)) !== '["serata"]') no("i mazzi sono " + JSON.stringify(Object.keys(M)) + " invece del solo serata");
    if (!Array.isArray(M.serata) || M.serata.length < 240) no("il 🌶️ Serata ha " + (M.serata && M.serata.length) + " parole");
    if (!Array.isArray(S) || S.length < 200 || S.some(function (p) { return !Array.isArray(p) || p.length !== 2; })) no("SG_ORDINE_SORELLE non è una lista di coppie");
    N.push("Classico " + C.length + ", 🌶️ Serata " + M.serata.length + ", sorelle " + S.length);
    var sor = {}; S.forEach(function (p) { sor[chiave(p[0], p[1])] = 1; });
    controllaLista("Classico", C, sor, O.radice, N);
    controllaLista("🌶️ Serata", M.serata, sor, O.radice, N);
    var fuori = S.filter(function (p) { var c = C.indexOf(p[0]) >= 0 && C.indexOf(p[1]) >= 0, s = M.serata.indexOf(p[0]) >= 0 && M.serata.indexOf(p[1]) >= 0; return !c && !s; });
    if (fuori.length) no("sorelle che non stanno (scritte uguali) nella stessa lista: " + fuori.slice(0, 6).map(function (p) { return p.join("/"); }).join(", "));
    var tolte = ["ESQUIMESE", "CAPELLO", "SEGA", "AMICIZIA", "OSSIDIANA", "PIZZERIA", "ARCOBALENO", "PEDALO", "PORTOGALLO", "DIRETTRICE"].filter(function (x) { return C.indexOf(x) >= 0; });
    if (tolte.length) no("nel Classico ci sono ancora: " + tolte.join(", "));
    var nuove = ["ARCO", "PALLA", "PEDALÒ", "PORTO", "CANALE", "CORRENTE", "PUNIZIONE", "BOMBER", "COPIONE", "SMORFIA", "MARSUPIO", "RISERVA"].filter(function (x) { return C.indexOf(x) < 0; });
    if (nuove.length) no("nel Classico mancano: " + nuove.join(", "));
    if (M.serata.indexOf("SEGA") < 0) no("SEGA non è nel 🌶️ Serata");
    // il gioco legge tutte le coppie
    var gs = O.sorelle ? O.sorelle() : null;
    if (!gs) no("il gioco non legge le sorelle (__ORDINE.sorelle)");
    var perse = S.filter(function (p) { return !(gs[norm(p[0])] || []).some(function (g) { return (gs[norm(p[1])] || []).indexOf(g) >= 0; }); });
    if (perse.length) no("il gioco non vede " + perse.length + " coppie (" + perse.slice(0, 4).map(function (p) { return p.join("/"); }).join(", ") + ")");
    N.push("il gioco legge le " + S.length + " coppie");
    // 2.000 tabelloni come li fa il gioco (radice e sorelle), 1.000 per lista
    [["Classico", C], ["🌶️ Serata", M.serata]].forEach(function (x) {
      var corti = 0, insieme = 0;
      for (var t = 0; t < 1000; t++) {
        var l = x[1].slice(); for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), y = l[i]; l[i] = l[j]; l[j] = y; }
        var usate = {}, tab = [];
        l.forEach(function (w0) {
          var r = O.radice(w0), g = gs[norm(w0)] || [];
          if (tab.length >= 25 || usate[norm(w0)] || usate["r" + r] || g.some(function (k) { return usate["s" + k]; })) return;
          usate[norm(w0)] = 1; usate["r" + r] = 1; g.forEach(function (k) { usate["s" + k] = 1; }); tab.push(w0);
        });
        if (tab.length < 25) corti++;
        if (giaSorelle(tab, S).length) insieme++;
      }
      if (corti || insieme) no(x[0] + ": su 1.000 tabelloni " + corti + " non pieni e " + insieme + " con due sorelle");
    });
    N.push("2.000 tabelloni pieni, mai due sorelle insieme");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | "));
    return N.join(" · ");
  } });

  COPIONE.aggiungi("o2p2", { nome: "Parola d'ordine, le parole: un tabellone vero del Classico e uno del 🌶️ Serata", fai: async function () {
    var N = [];
    var X = await stanza({ usaMie: false });
    var P = X.P, C = P.SG_ORDINE_PAROLE, S = P.SG_ORDINE_SORELLE, R = P.__ORDINE.radice;
    var tab = await comincia(X);
    if (tab.length !== 25) no("il tabellone ha " + tab.length + " parole");
    var nonC = tab.filter(function (w) { return C.indexOf(w) < 0; }); if (nonC.length) no("parole non del Classico: " + nonC.join(", "));
    var ins = giaSorelle(tab, S); if (ins.length) no("sorelle insieme sul tabellone: " + ins.join(", "));
    var rr = {}, dop = []; tab.forEach(function (w) { var r = R(w); if (rr[r]) dop.push(rr[r] + "/" + w); rr[r] = w; }); if (dop.length) no("stessa radice: " + dop.join(", "));
    N.push("Classico: " + tab.slice(0, 8).join(", ") + "…");
    A.pulisci();   // (via i telefoni della prima stanza: memorie vuote, si riparte da zero)
    var Y = await stanza({ usaMie: false, mazzo: "serata" });
    var tab2 = await comincia(Y), SER = Y.P.SG_ORDINE_MAZZI.serata;
    if (tab2.length !== 25) no("il tabellone 🌶️ ha " + tab2.length + " parole");
    var nonS = tab2.filter(function (w) { return SER.indexOf(w) < 0; }); if (nonS.length) no("parole non del 🌶️ Serata: " + nonS.join(", "));
    var ins2 = giaSorelle(tab2, S); if (ins2.length) no("sorelle insieme sul tabellone 🌶️: " + ins2.join(", "));
    N.push("🌶️ Serata: " + tab2.slice(0, 8).join(", ") + "…");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | "));
    return N.join(" · ");
  } });

  COPIONE.aggiungi("o2p3", { nome: "Parola d'ordine, le parole: le nuove più lunghe stanno nelle caselle a 360x640 e 412x915", fai: async function () {
    var N = [];
    var X = await stanza({ gruppo: LUNGHE, quante: "tutte" });
    var tab = await comincia(X);
    var su = LUNGHE.filter(function (w) { return tab.indexOf(w) >= 0; });
    if (su.length < 10) no("sul tabellone solo " + su.length + " delle parole lunghe (" + tab.join(", ") + ")");
    var nome = indovina(X); if (!nome) no("non trovo chi indovina");
    var w = W.finestra(nome), st = w.document.createElement("style");
    st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; w.document.head.appendChild(st);
    var M = [[360, 640], [412, 915]];
    for (var k = 0; k < M.length; k++) {
      misura(nome, M[k][0], M[k][1]);
      await W.dorme(700);
      await W.aspetta(function () { return calmo(w); }, 15000);
      await W.dorme(300);
      var r = stanno(nome);
      r.out.forEach(function (x) { no(nome + " a " + M[k].join("x") + ": " + x); });
      N.push(M[k].join("x") + ": tutte dentro (le più piccole: " + r.piccole + ")");
    }
    N.unshift(su.length + " parole lunghe sul tabellone di " + nome);
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | "));
    return N.join(" · ");
  } });
})();
