// AIUTI COMUNI delle prove del Passo 3 (la Compagnia): li usano tutti i file di passo3/ (p3-a … p3-z).
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo3/comune.js");  var P3 = COPIONE.passo3;   (anche window.P3)
//   P3.fotoSale(C, 30)            le foto della Sala (t:"sala") passate dal broker su quel codice negli ultimi 30 s
//                                 (senza secondi: tutte), dalla più vecchia: [{ ms, da, r, s, gen, nato, vice, comp, msg }]
//   await P3.unSoloHost(C, 3000)  guarda per 3 s: se passano foto di due sessioni diverse ("due host") è NO; se no
//                                 restituisce la sessione vista (o null se non è passata nessuna foto)
//   await P3.apriCompagnia("Luca", "KFRTPQ", "Quelli del giovedì", { emoji: "🍻", x: 185 })
//                                 apre il telefono col link fisso della compagnia (#gruppo=…&n=…&e=…), con la Sala nuova
//   P3.tessera(w) / P3.tessera(w, "KFRTPQ")   il testo di una tessera della compagnia in home ("" se non c'è)
//   P3.tessere(w)                 i testi di tutte le tessere
//   P3.linkCompagnia(C, nome, emoji)          l'hash del link fisso (senza "#")
// Dai telefoni finti (telefoni-finti.js): apriTel(nome, { orologio: ms }), spostaOrologio(nome, ms), congela(nome) /
// scongela(nome) (fermo SENZA testamento), contaCollegamenti(nome), due telefoni con lo stesso profilo
// (apriTel("Paky2", { profilo: { nome: "Paky", uid: "finto-Paky" } })), liste del profilo in BR.nube[uid].liste,
// richieste d'amicizia in BR.amicizie. COPIONE.aiuti.codiceSaletta / codiceTestata leggono codici di 4 o 6 lettere.
// Scenario 309: i telefoni finti del Passo 3 (orologio, stesso profilo su due telefoni, amicizie, congela, foto della Sala).
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, BASE = "seratagiochi/v1/";
  function no(perche) { throw new Error(perche); }
  var aggiungi = (W.COPIONE && W.COPIONE.aggiungi) ? W.COPIONE.aggiungi.bind(W.COPIONE) : function (n, s) { W.COPIONE.scenari[n] = s; };
  var A = (W.COPIONE && W.COPIONE.aiuti) || {};

  // tutti i messaggi passati sullo "stato" di un codice (dal più vecchio), già letti: [{ ms, da, r, m }]
  function passati(C, daMs) {
    var top = BASE + String(C).toUpperCase() + "/stato";
    return ((W.BR && W.BR.storia) || []).filter(function (x) { return x.topic === top && x.ms >= (daMs || 0); }).map(function (x) {
      var m = null; try { m = JSON.parse(x.p); } catch (e) {}
      return { ms: x.ms, da: x.da, r: x.r, m: m };
    }).filter(function (x) { return x.m && typeof x.m === "object"; });
  }
  // le foto della Sala su quel codice negli ultimi sec secondi (senza sec: tutte)
  function fotoSale(C, sec) {
    return passati(C, sec ? Date.now() - sec * 1000 : 0).filter(function (x) { return x.m.t === "sala"; }).map(function (x) {
      var m = x.m;
      return { ms: x.ms, da: x.da, r: x.r, s: m._s || null, gen: m.gen || 0, nato: m.nato || 0, vice: m.vice || [], comp: m.comp || null, msg: m };
    });
  }
  // "mai due host": per ms millisecondi nessuna foto (messaggio con _s) di una sessione diversa sullo stato di C
  async function unSoloHost(C, ms) {
    var t0 = Date.now();
    await W.dorme(ms || 3000);
    var viste = {}, chi = {};
    passati(C, t0).forEach(function (x) { if (x.m._s) { viste[x.m._s] = (viste[x.m._s] || 0) + 1; chi[x.m._s] = x.da; } });
    var s = Object.keys(viste);
    if (s.length > 1) no("due host su " + C + ": " + s.map(function (k) { return chi[k] + " (" + k + ", " + viste[k] + " foto)"; }).join(" e "));
    return s[0] || null;
  }
  // l'hash del link fisso della compagnia (come SGCompagnia.link, senza l'indirizzo)
  function linkCompagnia(C, nomeComp, emoji) {
    var h = "gruppo=" + String(C).toUpperCase();
    if (nomeComp) h += "&n=" + encodeURIComponent(nomeComp) + "&e=" + encodeURIComponent(emoji || "🍻");
    return h;
  }
  // apre il telefono col link fisso della compagnia (Sala nuova: salaSempre, come tutti gli scenari del Passo 3)
  async function apriCompagnia(nome, C, nomeComp, opz) {
    opz = Object.assign({ salaSempre: true }, opz || {});
    var e = opz.emoji; delete opz.emoji;
    opz.hash = linkCompagnia(C, nomeComp, e);
    return W.apriTel(nome, opz);
  }
  // il testo di una tessera della compagnia in home: "🍻 Quelli del giovedì · 🟢 Paky e Luca sono dentro · Entra ›"
  function testoTessera(t) {
    var pezzi = [".cmp-em", ".cmp-nome", ".cmp-stato", ".cmp-entra"].map(function (q) { var n = t.querySelector(q); return n ? n.textContent.replace(/\s+/g, " ").trim() : ""; });
    if (!pezzi.join("")) return t.textContent.replace(/\s+/g, " ").trim();
    return (pezzi[0] + " " + pezzi[1]).trim() + " · " + pezzi[2] + " · " + pezzi[3];
  }
  function tessere(w) { return [].map.call(w.document.querySelectorAll(".cmp-tessera"), testoTessera); }
  function tessera(w, C) {
    var l = [].slice.call(w.document.querySelectorAll(".cmp-tessera"));
    var t = C ? l.filter(function (x) { return x.getAttribute("data-codice") === String(C).toUpperCase(); })[0] : l[0];
    return t ? testoTessera(t) : "";
  }

  W.P3 = { fotoSale: fotoSale, unSoloHost: unSoloHost, apriCompagnia: apriCompagnia, linkCompagnia: linkCompagnia, tessera: tessera, tessere: tessere, passati: passati };
  if (W.COPIONE) W.COPIONE.passo3 = W.P3;

  // 309. I telefoni finti del Passo 3 funzionano: orologio spostato, stesso profilo su due telefoni, amicizie,
  // telefono congelato (niente testamento), collegamenti contati, foto della Sala e "un solo host", codici di 6 lettere
  aggiungi(309, { nome: "Telefoni finti del Passo 3 (orologio, stesso profilo, amicizie, congela, foto della Sala)", fai: async function () {
    var fatti = [];
    // codici di 4 o 6 lettere, anche spaziati
    var sc = A.soloCodice;
    if (sc) {
      if (sc("K F R T P Q") !== "KFRTPQ" || sc("KFRT") !== "KFRT" || sc("K F R T") !== "KFRT" || sc("KFRTP") !== null || sc("") !== null || sc(null) !== null) no("soloCodice non legge bene 4 o 6 lettere");
      fatti.push("codici 4/6");
    }
    // l'orologio: +90 s
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, orologio: 90000 });
    var d = P.Date.now() - Date.now();
    if (Math.abs(d - 90000) > 300) no("con +90 s Paky legge " + d + " ms di scarto");
    var d2 = new P.Date().getTime() - Date.now();
    if (Math.abs(d2 - 90000) > 300) no("new Date() di Paky: " + d2 + " ms di scarto");
    if (new P.Date(0).getTime() !== 0 || !(new P.Date() instanceof P.Date) || typeof P.Date() !== "string" || P.Date.UTC(2026, 0, 1) !== Date.UTC(2026, 0, 1)) no("il Date finto non si comporta come Date");
    W.spostaOrologio("Paky", -5000);
    d = P.Date.now() - Date.now(); if (Math.abs(d + 5000) > 300) no("spostaOrologio -5 s: " + d);
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return P.document.querySelector(".home .contenuto"); }, 5000)) no("Paky dopo la ricarica non è in home");
    d = P.Date.now() - Date.now(); if (Math.abs(d + 5000) > 300) no("dopo la ricarica l'orologio non è più -5 s: " + d);
    W.spostaOrologio("Paky", 0);
    d = P.Date.now() - Date.now(); if (Math.abs(d) > 300) no("orologio rimesso giusto: " + d);
    fatti.push("orologio +90 s ok");
    // lo stesso profilo su due telefoni: la stessa lista
    var Q = await W.apriTel("Paky2", { x: 185, salaSempre: true, profilo: { nome: "Paky", uid: "finto-Paky" } });
    var L = await W.apriTel("Luca", { x: 370, salaSempre: true });
    if (Q.SGNube.utente().uid !== "finto-Paky" || Q.SGNube.profilo().uid !== "finto-Paky") no("Paky2 non ha l'uid di Paky");
    if (L.SGNube.profilo().uid !== "finto-Luca") no("Luca non ha uid finto-Luca (" + L.SGNube.profilo().uid + ")");
    if (P.SG.listaProfilo("compagnie").length) no("all'inizio la lista c'è già");
    P.SG.salvaListaProfilo("compagnie", [{ c: "KFRTPQ", n: "Quelli del giovedì", e: "🍻" }]);
    var lq = Q.SG.listaProfilo("compagnie");
    if (!lq.length || lq[0].c !== "KFRTPQ") no("Paky2 non vede la lista salvata da Paky (" + JSON.stringify(lq) + ")");
    if (!(Q.SGNube.lista("compagnie") instanceof Q.Array)) no("la lista non è un array della pagina del telefono");
    if (L.SG.listaProfilo("compagnie").length) no("Luca vede la lista di Paky");
    Q.SGNube.lista("compagnie")[0].n = "cambiata a mano";   // (una copia: la nube non cambia)
    if (P.SGNube.lista("compagnie")[0].n !== "Quelli del giovedì") no("la lista letta non è una copia");
    Q = await W.ricarica("Paky2");
    await W.aspetta(function () { return Q.document.querySelector(".home .contenuto"); }, 5000);
    if ((Q.SG.listaProfilo("compagnie")[0] || {}).c !== "KFRTPQ") no("dopo la ricarica Paky2 non vede più la lista");
    fatti.push("stessa lista su 2 telefoni");
    // amicizie
    var esito = await P.SGNube.chiediAmicizia({ uid: "finto-Luca", nome: "Luca" });
    if (esito !== "inviata") no("chiediAmicizia: " + esito);
    var rl = await L.SGNube.richieste(), rp = await P.SGNube.richieste();
    if (rl.arrivate.length !== 1 || rl.arrivate[0].da !== "finto-Paky" || rl.inviate.length) no("Luca: richieste " + JSON.stringify(rl));
    if (rp.inviate.length !== 1 || rp.inviate[0].a !== "finto-Luca" || rp.arrivate.length) no("Paky: richieste " + JSON.stringify(rp));
    if (W.BR.amicizie.length !== 1 || W.BR.amicizie[0].nome !== "Luca") no("BR.amicizie: " + JSON.stringify(W.BR.amicizie));
    W.BR.nube["finto-Paky"].amici = ["finto-Luca"];
    if (Q.SGNube.amici().indexOf("finto-Luca") < 0) no("amici() non legge BR.nube[uid].amici");
    if (L.SGNube.amici().length) no("Luca ha amici che non ha");
    fatti.push("amicizie");
    // la Sala con Luca: foto della Sala, un solo host, congela senza testamento
    var S = await A.apriSalaNuova("Paky");
    L = await W.apriTel("Luca", { hash: "sala=" + S, x: 370, salaSempre: true });
    if (!await W.aspetta(function () { return ((A.vm(S).membri) || []).length === 2; }, 10000)) no("Luca non entra nella Sala");
    var fs = fotoSale(S, 30);
    if (!fs.length || !fs[0].s || fs.some(function (f) { return f.s !== fs[0].s; })) no("fotoSale: " + fs.length + " foto, sessioni " + fs.map(function (f) { return f.s; }).join(","));
    if (fotoSale(S, 30).filter(function (f) { return f.da === "Paky"; }).length !== fs.length) no("foto della Sala non tutte di Paky");
    var sess = await unSoloHost(S, 1500);
    if (sess && sess !== fs[0].s) no("unSoloHost: sessione " + sess + " invece di " + fs[0].s);
    var nP = W.contaCollegamenti("Paky");
    if (nP < 1) no("contaCollegamenti(Paky) = " + nP);
    W.congela("Paky");
    await W.dorme(600);
    if (W.BR.log.some(function (l) { return l.indexOf("Paky ✝") === 0; })) no("congela ha mandato il testamento");
    if ((W.statoStanza(S) || {}).t !== "sala") no("con Paky congelato la foto trattenuta non è più quella della Sala");
    if (W.BR.clients.some(function (c) { return c.nome === "Paky"; })) no("Paky congelato è ancora nel broker");
    var prima = W.BR.storia.length;
    W.viviDi("Paky").forEach(function (c) { c.publish(BASE + S + "/stato", JSON.stringify({ t: "sala", _s: "prova" }), {}); });
    if (W.BR.storia.length !== prima) no("Paky congelato riesce a mandare");
    W.scongela("Paky");
    if (!W.BR.clients.some(function (c) { return c.nome === "Paky"; })) no("scongelato, Paky non torna nel broker");
    // ancora tutti dentro dopo un attimo
    if (!await W.aspetta(function () { return ((A.vm(S).membri) || []).length === 2; }, 6000)) no("dopo scongela la Sala non ha più 2 membri");
    // congela e poi spegni: il broker se ne accorge (testamento)
    W.congela("Luca"); W.spegni("Luca");
    if (!W.BR.log.some(function (l) { return l.indexOf("Luca ✝") === 0; })) no("congela + spegni: niente testamento di Luca");
    W.riaccendi("Luca");
    await W.ricarica("Paky");
    if (W.contaCollegamenti("Paky") <= nP) no("ricaricando Paky non ha aperto collegamenti nuovi");
    fatti.push("Sala " + S + ": " + fs.length + " foto, un solo host, congela senza testamento, " + W.contaCollegamenti("Paky") + " collegamenti di Paky");
    // apriCompagnia e tessera
    var Z = await apriCompagnia("Sara", "kfrtpq", "Quelli del giovedì", { x: 555 });
    var src = document.getElementById("tel-Sara").src;
    if (src.indexOf("#gruppo=KFRTPQ&n=Quelli%20del%20gioved%C3%AC&e=" + encodeURIComponent("🍻")) < 0) no("il link della compagnia è " + src);
    if (Z.localStorage.getItem("sg-sala-sempre") === "0") no("apriCompagnia non apre con la Sala nuova");
    var box = Z.document.createElement("div");
    box.innerHTML = '<button class="cmp-tessera" data-codice="KFRTPQ"><span class="cmp-em">🍻</span><span class="cmp-mezzo"><b class="cmp-nome">Quelli del giovedì</b><span class="cmp-stato">🟢 Paky e Luca sono dentro</span></span><span class="cmp-dx"><span class="cmp-entra">Entra ›</span></span></button>';
    Z.document.body.appendChild(box);
    var tt = tessera(Z, "KFRTPQ");
    box.remove();
    if (tt !== "🍻 Quelli del giovedì · 🟢 Paky e Luca sono dentro · Entra ›") no("tessera: «" + tt + "»");
    if (tessera(Z) !== "" || tessere(Z).length) no("tessera senza tessere non è vuota");
    fatti.push("apriCompagnia e tessera");
    return fatti.join(" · ");
  } });
})();
