// 📜 Le pagine legali e la cancellazione del profilo (26 nov 2026). Si carica dopo copione-prova.js:
//   prova.js --carica legali/prove.js --prova lg1,lg2,lg3,lg4
// lg1: in home e nel profilo la riga «Privacy · Regole d'uso · Crediti» coi link giusti (e mai dentro le partite: qui solo home e profilo).
// lg2: «🗑️ Cancella il mio profilo»: conferma, password, SGNube.cancella con la password scritta, poi il telefono dimentica tutto (sg-*).
// lg3: password sbagliata: resta sulla schermata, «Password sbagliata.», niente cancellato sul telefono.
// lg4: le tre pagine si aprono, hanno «Revel House», nessun segnaposto rimasto, l'email di contatto, il titolare nella privacy, e i crediti caricano e cercano.
// SGNube è quello finto dei telefoni finti: la cancellazione vera (js/nube.js) si prova senza browser con un Firebase finto
// (.agents/skills/crediti/prova-cancella.js). MAI account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function home(nome) {
    var P = await W.apriTel(nome, { x: 0 });
    if (!await W.aspetta(function () { return P.document.querySelector(".home [data-gioco]"); }, 15000)) no("la home non arriva");
    return P;
  }
  function linkLegali(nodo) { return nodo ? [].map.call(nodo.querySelectorAll("a"), function (a) { return a.getAttribute("href"); }).join(",") : ""; }
  async function profilo(P) {
    P.SGCuore.schermataAccesso();
    if (!await W.aspetta(function () { return P.document.querySelector(".pf-cancella"); }, 5000)) no("nel profilo manca «Cancella il mio profilo»");
  }
  function fintaCancella(P, giusta) {
    P.__cancellate = [];
    P.SGNube.cancella = function (pwd) {
      P.__cancellate.push(pwd);
      return pwd === giusta ? Promise.resolve() : Promise.reject(Object.assign(new Error("x"), { code: "auth/invalid-credential" }));
    };
  }
  function chiaviSg(P) { var l = []; for (var i = 0; i < P.localStorage.length; i++) if (/^sg-/.test(P.localStorage.key(i))) l.push(P.localStorage.key(i)); return l; }
  async function scrivi(P, campo, t) { campo.value = t; campo.dispatchEvent(new P.Event("input", { bubbles: true })); }

  COPIONE.aggiungi("lg1", { nome: "Pagine legali: la riga Privacy · Regole · Crediti in home e nel profilo", fai: async function () {
    var P = await home("Luca"), err = [];
    var h = P.document.querySelector(".home .home-legale");
    if (linkLegali(h) !== "privacy.html,regole.html,crediti.html") err.push("home: «" + linkLegali(h) + "»");
    else { var r = h.getBoundingClientRect(); if (r.height < 10 || r.width < 100) err.push("home: la riga è di " + Math.round(r.width) + "x" + Math.round(r.height)); if (!h.closest(".home")) err.push("home: la riga non è nella home"); }
    if (h && [].some.call(h.querySelectorAll("a"), function (a) { return a.target !== "_blank"; })) err.push("i link non si aprono a parte");
    await profilo(P);
    var pf = P.document.querySelector(".pf-legale");
    if (linkLegali(pf) !== "privacy.html,regole.html,crediti.html") err.push("profilo: «" + linkLegali(pf) + "»");
    if (err.length) no(err.join("; "));
    return "home e profilo: " + linkLegali(h);
  } });

  COPIONE.aggiungi("lg2", { nome: "Cancella il profilo: conferma, password, poi il telefono dimentica tutto", fai: async function () {
    var P = await home("Giulia"); fintaCancella(P, "segreta1");
    await profilo(P);
    var prima = chiaviSg(P).length;
    if (!prima) no("il telefono non ricordava niente: la prova non dice niente");
    P.document.querySelector(".pf-cancella").click();   // (la conferma «🗑️ Continua» la toccano da soli i telefoni finti)
    var campo = await W.aspetta(function () { return P.document.querySelector(".bp-cancella .bp-pwd"); }, 5000);
    if (!campo) no("dopo la conferma non arriva la schermata della password");
    var b = P.document.querySelector(".bp-cancella .btn-rosso");
    b.click();
    await W.aspetta(function () { return false; }, 200);
    if (!/Scrivi la tua password/.test(P.document.querySelector(".bp-cancella .bp-avviso").textContent)) no("senza password non lo dice");
    if (P.__cancellate.length) no("ha cancellato senza password");
    await scrivi(P, campo, "segreta1"); b.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".bp-cancellato"); }, 5000)) no("non arriva «Profilo cancellato»");
    if (P.__cancellate.join() !== "segreta1") no("SGNube.cancella chiamata con «" + P.__cancellate.join() + "»");
    var dopo = chiaviSg(P);
    if (dopo.length) no("sul telefono restano: " + dopo.join(", "));
    var tasto = P.document.querySelector(".bp-cancellato .btn-primario");
    if (!tasto || !/Ricomincia/.test(tasto.textContent)) no("manca «Ricomincia»");
    return prima + " cose del telefono dimenticate, «Profilo cancellato»";
  } });

  COPIONE.aggiungi("lg3", { nome: "Cancella il profilo: password sbagliata = resta tutto", fai: async function () {
    var P = await home("Marco"); fintaCancella(P, "giusta12");
    await profilo(P);
    var prima = chiaviSg(P).length;
    P.document.querySelector(".pf-cancella").click();
    var campo = await W.aspetta(function () { return P.document.querySelector(".bp-cancella .bp-pwd"); }, 5000);
    if (!campo) no("non arriva la schermata della password");
    await scrivi(P, campo, "sbagliata"); P.document.querySelector(".bp-cancella .btn-rosso").click();
    if (!await W.aspetta(function () { return /Password sbagliata/.test(P.document.querySelector(".bp-cancella .bp-avviso").textContent); }, 5000)) no("non dice «Password sbagliata»");
    if (P.document.querySelector(".bp-cancellato")) no("dice cancellato");
    if (chiaviSg(P).length !== prima) no("il telefono ha perso delle cose: " + prima + " → " + chiaviSg(P).length);
    P.document.querySelector(".bp-cancella .bp-gia").click();
    if (!await W.aspetta(function () { return P.document.querySelector(".pf-cancella"); }, 3000)) no("«No, tengo il profilo» non torna al profilo");
    return "password sbagliata: niente cancellato, si torna al profilo";
  } });

  COPIONE.aggiungi("lg4", { nome: "Le tre pagine: si aprono, Revel House, contatto e titolare, crediti con la ricerca", fai: async function () {
    var err = [], fatti = [];
    for (var pg of ["privacy.html", "regole.html", "crediti.html"]) {
      var f = W.document.createElement("iframe"); f.style.cssText = "width:360px;height:640px;position:fixed;left:0;top:0;opacity:.01";
      W.document.body.appendChild(f);
      await new Promise(function (r) { f.onload = r; f.src = "/" + pg + "?" + Date.now(); });
      var d = f.contentWindow.document;
      if (!/Revel/.test(d.querySelector(".pg-marchio").textContent)) err.push(pg + ": niente Revel House");
      if (d.documentElement.scrollWidth > 362) err.push(pg + ": esce di lato (" + d.documentElement.scrollWidth + " px)");
      var sp = d.querySelectorAll(".segnaposto").length;
      if (sp) err.push(pg + ": restano " + sp + " segnaposto");
      if (pg !== "crediti.html" && !d.querySelector("a[href='mailto:revelhouse.app@gmail.com']")) err.push(pg + ": manca l'email di contatto");
      if (pg === "privacy.html" && !/titolare del trattamento è Pasquale Cito/.test(d.body.textContent)) err.push("privacy: manca il titolare");
      if (pg === "crediti.html") {
        if (!await W.aspetta(function () { return d.querySelectorAll("details.cr-gruppo").length >= 4; }, 5000)) err.push("crediti: i gruppi delle foto non arrivano");
        var q = d.getElementById("cr-q"); q.value = "nutella"; q.dispatchEvent(new f.contentWindow.Event("input"));
        await W.aspetta(function () { return /trovat/.test(d.getElementById("cr-conta").textContent); }, 3000);
        var li = d.querySelector("details.cr-gruppo[open] .cr-lista li");
        if (!li || !/Nutella/i.test(li.textContent) || !li.querySelector("a[href*='commons.wikimedia.org/wiki/File:']")) err.push("crediti: la ricerca «nutella» non trova la foto col link");
        fatti.push("crediti: " + d.getElementById("cr-conta").textContent);
      } else fatti.push(pg + ": contatto" + (pg === "privacy.html" ? " e titolare" : ""));
      f.remove();
    }
    if (err.length) no(err.join("; "));
    return fatti.join(" · ");
  } });
})();
