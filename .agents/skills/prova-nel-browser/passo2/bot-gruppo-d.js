// PROVE DEL PASSO 2, pezzo p2-bg4: i giochi del gruppo D (parole e quiz) usano i bot fissi (SG.bot).
// Dei 7 giochi del gruppo (Linea del tempo, Nomi Cose e Città, Balla, Taboo, Parola d'ordine, Patata, Impostore) ha dei bot
// solo Parola d'ordine, nella "🧪 Prova da solo" del proprietario: un bot in squadra con te, due nell'altra.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/bot-gruppo-d.js"); await COPIONE.prova(264)
//
// 264: IL PAPPONE apre Parola d'ordine → "🧪 Prova da solo": il menu dice "Bot" (mai un nome), in partita i tre bot sono
//   quelli fissi del livello facile (nomi e avatar uguali a SG.bot), nessuno si chiama come lui; il tavolo a 360x640 non scorre.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;

  COPIONE.aggiungi(264, { nome: "Parola d'ordine, «Prova da solo»: i bot sono quelli fissi (SG.bot), nei menu solo «Bot»", fai: async function () {
    var P = await W.apriTel("IL PAPPONE", { x: 0, prima: A.botFinti });
    var tess = await W.aspetta(function () { return A.tessera(P, "Parola d'ordine"); }, 5000);
    if (!tess) no("non trovo la tessera di Parola d'ordine");
    tess.click(); await W.dorme(200);
    var modi = A.modiVisti(P), prova = modi.filter(function (m) { return /Prova da solo/.test(m); })[0];
    if (!prova) no("IL PAPPONE non ha «Prova da solo» (" + modi.join(" / ") + ")");
    if (!/\bBot\b/.test(prova) || /Matt|Rosa|Peppe|Angela/.test(prova)) no("«Prova da solo» dice: " + prova);
    W.clicca(P, /Prova da solo/, ".modo-grande"); await W.dorme(300);
    var capo = [].map.call(P.document.querySelectorAll(".modo-chip .mt"), function (x) { return x.textContent; });
    if (capo.indexOf("Bot") < 0) no("nella scelta del capo non c'è «Bot» (" + capo.slice(0, 3).join(" / ") + ")");
    // "Nella tua squadra il capo è… Bot": così si vede anche un bot che dà l'indizio
    var tBot = [].find.call(P.document.querySelectorAll(".modo-chip"), function (b) { return b.textContent.trim() === "Bot"; });
    if (tBot) tBot.click();
    var via = [].find.call(P.document.querySelectorAll(".piede button, button"), function (b) { return /Gioca|Comincia|Inizia|Via/.test(b.textContent) && b.offsetParent; });
    if (!via) no("non trovo il tasto per cominciare («" + T(P).slice(0, 80) + "»)");
    via.click();
    var tav = await W.aspetta(function () { return P.document.querySelector(".or-tab .or-carta"); }, 5000);
    if (!tav) no("la prova non parte («" + T(P).slice(0, 80) + "»)");
    var attesi = P.SG.bot.prendi(3, { livello: "facile", escludi: ["IL PAPPONE"] });
    await W.dorme(500);
    // le faccine del tavolo (img con alt = nome): ci sono i tre bot fissi, coi loro avatar (gli id dei disegni cambiano a ogni disegno: si tolgono)
    var senzaId = function (s) { return s.replace(/om[0-9a-z]+_/g, "om_"); };
    var facce = {}; [].forEach.call(P.document.querySelectorAll(".or-f img[alt]"), function (i) { facce[i.alt] = senzaId(decodeURIComponent(i.src.split(",").slice(1).join(","))); });
    attesi.forEach(function (b) {
      if (!facce[b.nome]) no(b.nome + " (bot fisso) non è al tavolo (ci sono: " + Object.keys(facce).join(", ") + ")");
      if (facce[b.nome] !== senzaId(P.SGOmino.svg(b.omino, { busto: true }))) no("al tavolo " + b.nome + " non ha il suo avatar fisso");
    });
    if (Object.keys(facce).some(function (n) { return n === "Bot"; })) no("al tavolo c'è ancora un bot che si chiama «Bot»");
    // i bot capi danno l'indizio da soli (si comincia con l'indizio di un bot)
    if (!await W.aspetta(function () { return /INDIZIO DEI \S+ [A-ZÀ-Ù]{3,}\s?[0-9∞]/.test(T(P)); }, 8000)) no("il bot capo non dà l'indizio («" + T(P).slice(0, 120) + "»)");
    var mis = await A.misuraSchermata(P, "IL PAPPONE", 360, 640);
    var f = document.getElementById("tel-IL PAPPONE"); f.style.width = "360px"; f.style.height = "740px";
    if (mis) no("il tavolo della prova: " + mis);
    return "«Prova da solo: tu e un Bot contro due Bot»; capo «Bot»; al tavolo " + attesi.map(function (b) { return b.nome; }).join(", ") + " coi loro avatar fissi; 360x640 senza scorrere";
  } });
})();
