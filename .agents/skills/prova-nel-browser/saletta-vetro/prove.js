// 🏛️ PROVE DEI GETTONI SUL PALCO DELLA SALETTA (15 nov 2026, chat «🪟 Saletta di vetro»). Profili finti, mai account veri.
// Uso (dopo copione-prova.js): await COPIONE.carica("saletta-vetro/prove.js"); await COPIONE.prova("sv1")
// sv1: Paky da solo nella saletta della Mini Asta (dalla Sala): 1 gettone sul piedistallo + 3 posti liberi col «+» (toccandone uno si
//      apre l'invito); arrivano Giulia e Luca (il loro disco cade col rimbalzo, i posti liberi diventano 1), Giulia è pronta
//      (lineetta verde e bollino ✓ nel gettone, niente ✋, il nome col filo del suo colore); poi in 10 (niente posti liberi, fascio
//      leggero). Le immagini sono quelle grandi (carte/emoji-grandi). Con W.__foto il programma che fotografa fa le foto nei
//      momenti giusti (W.__fotoOra = nome; aspetta W.__fotoFatta === nome).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error(p); }
  async function foto(nome) { if (!W.__foto) return; W.__fotoOra = nome; await W.aspetta(function () { return W.__fotoFatta === nome; }, 60000); }
  function palchi(w) { return w.document.querySelectorAll(".saletta-schermo .sl-av:not(.sl-vuoto):not(.esce):not(.va) .gtp").length; }
  function liberi(w) { return w.document.querySelectorAll(".saletta-schermo .sl-av.sl-vuoto:not(.esce) .gtp-libero").length; }
  function figDi(w, nome) { var t = A.targaDi(w, nome); if (!t) return null; return [].find.call(w.document.querySelectorAll(".saletta-schermo .sl-av"), function (a) { return a._targa === t; }) || null; }
  function pausa(ms) { return W.aspetta(function () { return false; }, ms); }
  // ognuno sta dentro la stanza, nessun gettone si sovrappone a un altro né copre la nota in cima
  function controllaPosti(w) {
    var st = w.document.querySelector(".sl-stanza"), rs = st.getBoundingClientRect(), r = [];
    var dischi = [].map.call(w.document.querySelectorAll(".saletta-schermo .sl-av:not(.esce) .gtp"), function (x) { return x.getBoundingClientRect(); });
    dischi.forEach(function (d, i) {
      if (d.left < rs.left - 1 || d.right > rs.right + 1 || d.top < rs.top - 1 || d.bottom > rs.bottom + 1) r.push("il gettone " + i + " esce dalla stanza");
      dischi.forEach(function (e, j) { if (j > i && d.left < e.right - 2 && e.left < d.right - 2 && d.top < e.bottom - 2 && e.top < d.bottom - 2) r.push("i gettoni " + i + " e " + j + " si sovrappongono"); });
    });
    var nota = w.document.querySelector(".sl-nota:not([hidden])");
    if (nota && nota.offsetParent) { var rn = nota.getBoundingClientRect(); dischi.forEach(function (d, i) { if (d.top < rn.bottom - 2 && d.bottom > rn.top) r.push("il gettone " + i + " copre la nota"); }); }
    return r.join("; ");
  }
  W.__controllaPosti = controllaPosti;   // (anche per il programma che fotografa: lo rifà a ogni misura del telefono)
  COPIONE.aggiungi("sv1", { nome: "Saletta: gettoni sul piedistallo, posti liberi, pronto, in 10", fai: async function () {
    var w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true }) };
    var S = await A.apriSalaNuova("Paky");
    await A.lanciaDallaSala("Paky", S, "Mini Asta Fantacalcio");
    var P = w.Paky;
    if (!await W.aspetta(function () { return palchi(P) === 1 && liberi(P) === 3; }, 5000)) no("da solo: " + palchi(P) + " gettoni e " + liberi(P) + " posti liberi (attesi 1 e 3)");
    if (P.document.querySelector(".saletta-schermo .sl-av svg.gettone")) no("c'è ancora il gettone piatto di prima");
    if (!P.document.querySelector(".gtp-disco image[href*='emoji-grandi']")) no("il gettone non usa l'immagine grande");
    // il posto libero apre l'invito (il tasto «Invita gli amici»)
    var invitato = 0;
    P.document.querySelector(".sl-link").addEventListener("click", function () { invitato++; }, true);
    P.document.querySelector(".sl-vuoto.invita").click();
    if (!invitato) no("toccare il posto libero non apre l'invito");
    await pausa(1500);
    var e1 = controllaPosti(P); if (e1) no("da solo: " + e1);
    await foto("solo");
    // arrivano Giulia e Luca
    w.Giulia = await W.apriTel("Giulia", { hash: "sala=" + S, x: 190, salaSempre: true });
    var cadde = false;
    if (await W.aspetta(function () { var a = figDi(P, "Giulia"); return a && a.classList.contains("entra"); }, 8000)) {
      var d = figDi(P, "Giulia").querySelector(".gtp-disco");
      cadde = !!d && P.getComputedStyle(d).animationName === "gtpCade";
    }
    if (!cadde) no("il disco di Giulia non entra col rimbalzo");
    w.Luca = await W.apriTel("Luca", { hash: "sala=" + S, x: 380, salaSempre: true });
    if (!await W.aspetta(function () { return palchi(P) === 3 && liberi(P) === 1; }, 10000)) no("in 3: " + palchi(P) + " gettoni e " + liberi(P) + " posti liberi (attesi 3 e 1)");
    if (!await W.aspetta(function () { return W.clicca(w.Giulia, /Sono pronto/, ".sl-pronto"); }, 6000)) no("Giulia non trova «Sono pronto»");
    if (!await W.aspetta(function () { var a = figDi(P, "Giulia"); return a && a.classList.contains("pronto"); }, 5000)) no("Giulia non risulta pronta da Paky");
    await pausa(900);
    var aG = figDi(P, "Giulia"), gp = aG.querySelector(".gtp-pronto");
    if (!gp || +P.getComputedStyle(gp).opacity < 0.9) no("nel gettone di Giulia non si accende il segno di pronto");
    var dopo = P.getComputedStyle(aG.querySelector(".sl-fig"), "::after").content;
    if (dopo && dopo !== "none" && dopo !== "normal") no("c'è ancora la manina ✋ (" + dopo + ")");
    var pcG = aG._targa.style.getPropertyValue("--pc").trim(), colG = aG.querySelector(".gtp").style.getPropertyValue("--gt").trim();
    if (!pcG || pcG !== colG) no("il nome di Giulia non ha il filo del suo colore (" + pcG + " / " + colG + ")");
    var e3 = controllaPosti(P); if (e3) no("in 3: " + e3);
    await foto("tre");
    // in 10
    var altri = ["Marco", "Bea", "Sara", "Ciro", "Anna", "Gigi", "Tina"];
    for (var i = 0; i < altri.length; i++) w[altri[i]] = await W.apriTel(altri[i], { hash: "sala=" + S, x: 570 + 60 * i, salaSempre: true });
    if (!await W.aspetta(function () { return palchi(P) === 10 && liberi(P) === 0; }, 20000)) no("in 10: " + palchi(P) + " gettoni e " + liberi(P) + " posti liberi");
    for (var k = 0; k < 3; k++) { var wk = w[altri[k * 2]]; await W.aspetta(function () { return W.clicca(wk, /Sono pronto/, ".sl-pronto"); }, 6000); }
    await W.aspetta(function () { return P.document.querySelectorAll(".saletta-schermo .sl-av.pronto").length >= 4; }, 6000);
    if (!P.document.querySelector(".sl-stanza.tanti")) no("in 10 il fascio non diventa più leggero");
    await pausa(1200);
    var e10 = controllaPosti(P); if (e10) no("in 10: " + e10);
    await foto("dieci");
    // in 12 (il massimo della Mini Asta e di altri giochi)
    w.Ugo = await W.apriTel("Ugo", { hash: "sala=" + S, x: 1000, salaSempre: true });
    w.Vera = await W.apriTel("Vera", { hash: "sala=" + S, x: 1060, salaSempre: true });
    if (!await W.aspetta(function () { return palchi(P) === 12 && liberi(P) === 0; }, 20000)) no("in 12: " + palchi(P) + " gettoni e " + liberi(P) + " posti liberi");
    await pausa(1500);
    var e12 = controllaPosti(P); if (e12) no("in 12: " + e12);
    await foto("dodici");
    return "da solo 1 gettone + 3 posti liberi (l'invito si apre), in 3 col rimbalzo e Giulia pronta (✓ nel gettone, niente ✋), in 10 e in 12 senza posti liberi, nessuno si sovrappone";
  } });
})();

// sv2: il giro delle schermate dove si vede il gettone (per le foto prima/dopo del gettone di vetro ovunque):
//      «Come giocate?» della Linea del tempo, il profilo, la Sala con 6, la partita della Linea del tempo (testata), il podio.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error(p); }
  async function foto(nome) { if (!W.__foto) return; W.__fotoOra = nome; await W.aspetta(function () { return W.__fotoFatta === nome; }, 60000); }
  function pausa(ms) { return W.aspetta(function () { return false; }, ms); }
  COPIONE.aggiungi("sv2", { nome: "Il gettone ovunque: Come giocate?, profilo, Sala, partita, podio", fai: async function () {
    A.spiaTavolo();
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, spiaTav: ["timeline"] });
    var t = await W.aspetta(function () { return A.tessera(P, "La linea del tempo"); }, 6000);
    if (!t) no("non trovo la Linea del tempo in home");
    t.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".modo-grande"); }, 5000)) no("non si apre «Come giocate?»");
    await pausa(1500); await foto("come");
    await W.ricarica("Paky"); P = W.finestra("Paky");
    await A.apriProfilo(P); await pausa(1500); await foto("profilo");
    await W.ricarica("Paky"); P = W.finestra("Paky");
    var amici = ["Giulia", "Luca", "Marco", "Bea", "Sara"], w = { Paky: P };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 120 * (i + 1), salaSempre: true, spiaTav: ["timeline"] });
    if (!await W.aspetta(function () { return ((A.vm(S).membri) || []).length === 6; }, 15000)) no("nella Sala non sono entrati in 6");
    await pausa(1500); await foto("sala");
    var C = await A.lanciaDallaSala("Paky", S, "La linea del tempo");
    if (!await W.aspetta(function () { return A.ids(C, "giocatori").length === 6; }, 15000)) no("non sono in 6 nella saletta");
    W.clicca(P, /Comincia/, ".sl-go");
    await W.aspetta(function () { return A.vm(C).fase && A.vm(C).fase !== "lobby"; }, 15000);
    await pausa(5000); await foto("gioco");
    // il podio della Linea del tempo (disegnato qui sopra la partita con le stesse classi del gioco: la fine vera richiede 10 carte)
    var gg = (A.vm(C).giocatori || []).slice(0, 6);
    var html = "<div class='schermata oro tl-fine' style='position:fixed;inset:0;z-index:9999;background:#0d1020;padding:20px 16px'><h2 style='color:#fff;margin:0 0 6px'>🏆 Classifica finale</h2><div class='tl-podio'>" +
      [1, 0, 2].map(function (p) { var g = gg[p]; return g ? "<div class='tl-gradino p" + (p + 1) + "' style='animation:none;opacity:1'><div class='fac'>" + P.SGOmino.svg(g.omino, { busto: true }) + "</div><div class='nm'>" + g.nome + "</div><div class='pt'>" + (300 - p * 50) + "</div><div class='blocco'>" + ["🥇", "🥈", "🥉"][p] + "</div></div>" : ""; }).join("") +
      "</div><div class='tl-fila'>" + gg.slice(3).map(function (g, i) { return "<div class='tl-riga'><span class='pos'>" + (i + 4) + "°</span><span class='fac'>" + P.SGOmino.svg(g.omino, { busto: true }) + "</span><span class='nm'>" + g.nome + "</span></div>"; }).join("") + "</div></div>";
    P.document.body.insertAdjacentHTML("beforeend", html);
    await pausa(1500); await foto("podiotl");
    P.document.body.removeChild(P.document.body.lastElementChild);
    var cl = ["Paky", "Giulia", "Luca", "Marco", "Bea", "Sara"].map(function (n, k) { return { nome: n, punti: 12 - k * 2, pos: k + 1 }; });
    P.__tav.fine(cl);
    await pausa(2500); await foto("podio");
    return "foto: come, profilo, sala, gioco, podio";
  } });
})();
