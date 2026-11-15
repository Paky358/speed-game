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
    return "da solo 1 gettone + 3 posti liberi (l'invito si apre), in 3 col rimbalzo e Giulia pronta (✓ nel gettone, niente ✋), in 10 senza posti liberi, nessuno si sovrappone";
  } });
})();
