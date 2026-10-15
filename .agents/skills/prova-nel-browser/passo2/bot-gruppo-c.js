// PROVE DEL PASSO 2, pezzo p2-bg3: i giochi del gruppo C (carte e serate) usano i bot fissi (SG.bot).
// Dei 6 giochi del gruppo (Black Jack, Poker, Asta, Sì... però, Scarabocchio, Gara di pesca) hanno dei bot solo:
// - Black Jack: il banco (il croupier) è uno dei bot fissi (di partenza Matt), vestito da croupier;
// - Poker: i bot al tavolo (contro i Bot, e i posti che l'host dà ai bot online).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/bot-gruppo-c.js"); await COPIONE.prova(263)
//
// 263: Black Jack su questo telefono: il banco si chiama come il primo bot difficile di SG.bot ("🎩 Matt", "Matt distribuisce…"),
//      ha la sua faccia (avatar del gruppo fisso con giacca e papillon), in partita non c'è più "Bot"; 360x640 senza scorrere.
// 263b: Black Jack online in 2: il banco va nella foto (vm.croupier) e l'ospite vede lo stesso nome e lo stesso avatar.
// 263c: Poker contro i Bot: il menu dice "Contro i Bot" (mai un nome); al tavolo i 3 bot fissi del livello medio coi loro avatar
//       (nessuno inventato), nessuno si chiama come chi gioca; 360x640 senza scorrere.
// 263d: Poker online: l'host mette 2 bot in saletta: sono quelli fissi (difficile: Matt, Angela) e l'ospite li vede col loro avatar
//       (arriva dall'host, non inventato); "−" e poi "+" rimette lo stesso bot.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var senzaId = function (s) { return String(s || "").replace(/om[0-9a-z]+_/g, "om_"); };
  // conta quante volte il telefono inventa un avatar (SGOmino.casuale) per uno di questi nomi
  function spiaCasuale(w, nomi) {
    var c = { n: 0, chi: [] }, orig = w.SGOmino.casuale;
    w.SGOmino.casuale = function (n) { if (nomi.indexOf(n) >= 0) { c.n++; c.chi.push(n); } return orig.apply(this, arguments); };
    return c;
  }
  // il croupier come lo disegna il Black Jack: il bot fisso + giacca e papillon (per confrontare il disegno)
  function croupierAtteso(w, nomi) {
    var b = w.SG.bot.prendi(1, { livello: "difficile", escludi: nomi })[0], cfg = {}, n;
    for (n in b.omino) cfg[n] = b.omino[n];
    var DIV = { capo: "giacca", maglia: 7, collo: "papillon", colCollo: 0, mano: "nessuno", animale: "nessuno", schiena: "nessuna", borsa: "nessuna" };
    for (n in DIV) cfg[n] = DIV[n];
    // le quattro facce del banco (normale, pensa, esulta, triste): come FACCE in blackjack.js
    var FACCE = [{}, { occhi: "assonnati", sopracc: "alzate", bocca: "neutro" }, { occhi: "felici", sopracc: "alzate", bocca: "sorrisone" }, { occhi: "dolci", sopracc: "preoccupate", bocca: "smorfia" }];
    return { nome: b.nome, svg: FACCE.map(function (x) { var c = {}, k; for (k in cfg) c[k] = cfg[k]; for (k in x) c[k] = x[k]; var d = w.document.createElement("div"); d.innerHTML = w.SGOmino.svg(c, { busto: true }); return senzaId(d.innerHTML); }) };   // (letto come innerHTML: le virgolette cambiano)
  }
  // un testo in partita col banco che si chiama "Bot" (i menu e il sottotitolo restano fuori: si guarda solo il tavolo)
  function botNelTavolo(w) {
    var z = w.document.querySelector(".bj-wrap"); var t = z ? z.innerText : "";
    var m = t.match(/(^|\s)Bot( distribuisce| ha un Asso| ti dà)|Tocca a Bot|🎩 Bot\b/); return m ? m[0] : "";
  }

  COPIONE.aggiungi(263, { nome: "Black Jack su un telefono: il banco è un bot fisso (nome e faccia), niente «Bot» in partita", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    var tess = await W.aspetta(function () { return A.tessera(P, "Black Jack"); }, 5000); if (!tess) no("non trovo il Black Jack");
    tess.click(); await W.dorme(250);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.dorme(300); W.clicca(P, /Avanti/); await W.dorme(300);
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia» («" + T(P).slice(0, 80) + "»)");
    var att = croupierAtteso(P, ["Paky"]);
    var hn = await W.aspetta(function () { var x = P.document.querySelector(".bjr-matt-nome"); return x && x.textContent; }, 5000);
    if (hn !== "🎩 " + att.nome) no("nell'angolo il banco dice «" + hn + "» invece di «🎩 " + att.nome + "»");
    var av = senzaId(P.document.querySelector(".bjr-matt .bj-av").innerHTML);
    if (att.svg.indexOf(av) < 0) no("il banco non ha la faccia di " + att.nome + " (vestito da croupier)");
    // una mano intera: punta, stai; il banco gioca
    await W.dorme(4500);
    var visti = {}, fine = Date.now() + 25000;
    while (Date.now() < fine && !/Fine mano|Nuova mano/.test(T(P))) {
      var tx = T(P); [att.nome + " distribuisce…", "Tocca a " + att.nome].forEach(function (s) { if (tx.indexOf(s) >= 0) visti[s] = 1; });
      var b = botNelTavolo(P); if (b) no("in partita c'è ancora «" + b + "»");
      W.clicca(P, /^Punta /) || W.clicca(P, /^No$/) || W.clicca(P, /^Stai$/);
      await W.dorme(150);
    }
    if (!/Fine mano|Nuova mano/.test(T(P))) no("la mano non finisce («" + T(P).slice(-100) + "»)");
    if (!visti[att.nome + " distribuisce…"]) no("non si è letto «" + att.nome + " distribuisce…»");
    var mis = await A.misuraSchermata(P, "Paky", 360, 640);
    var f = document.getElementById("tel-Paky"); f.style.width = "360px"; f.style.height = "740px"; P.dispatchEvent(new P.Event("resize"));
    if (mis) no("il tavolo: " + mis);
    return "banco «🎩 " + att.nome + "» con la sua faccia e la divisa; letto: " + Object.keys(visti).join(" / ") + "; una mano intera; 360x640 senza scorrere";
  } });

  COPIONE.aggiungi("263b", { nome: "Black Jack online: il banco (bot fisso) va nella foto, l'ospite lo vede uguale", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti }), C = await W.apriStanza(P, "Black Jack");
    var G = await W.apriTel("Giulia", { hash: "gioco=blackjack&stanza=" + C, x: 185, prima: A.botFinti });
    if (!await W.aspetta(function () { return (A.vm(C).giocatori || []).length === 2 && A.dentro(G); }, 8000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    var cr = await W.aspetta(function () { return A.vm(C).croupier; }, 6000);
    var att = croupierAtteso(P, ["Paky", "Giulia"]);
    if (!cr) no("nella foto non c'è il banco (vm.croupier)");
    if (cr.nome !== att.nome) no("il banco nella foto è «" + cr.nome + "» invece di «" + att.nome + "»");
    var hG = await W.aspetta(function () { var x = G.document.querySelector(".bjr-matt-nome"); return x && x.textContent; }, 6000);
    if (hG !== "🎩 " + att.nome) no("Giulia vede il banco «" + hG + "»");
    var aP = senzaId(P.document.querySelector(".bjr-matt .bj-av").innerHTML), aG = senzaId(G.document.querySelector(".bjr-matt .bj-av").innerHTML);
    if (att.svg.indexOf(aP) < 0 || att.svg.indexOf(aG) < 0) no("il banco non ha la stessa faccia sui due telefoni");
    var b = botNelTavolo(G) || botNelTavolo(P); if (b) no("in partita c'è ancora «" + b + "»");
    return "vm.croupier = " + cr.nome + "; Paky e Giulia vedono «🎩 " + att.nome + "» con la stessa faccia";
  } });

  COPIONE.aggiungi("263c", { nome: "Poker contro i Bot: menu «Contro i Bot», al tavolo i bot fissi coi loro avatar", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    var tess = await W.aspetta(function () { return A.tessera(P, "Poker"); }, 5000); if (!tess) no("non trovo il Poker");
    tess.click(); await W.dorme(250);
    var modi = A.modiVisti(P), mb = modi.filter(function (m) { return /Bot/.test(m); })[0];
    if (!mb || !/Contro i Bot/.test(mb) || /Matt|Rosa|Peppe|Angela|computer|il primo/.test(mb)) no("il modo contro i bot dice: " + (mb || modi.join(" / ")));
    W.clicca(P, /Contro i Bot/, ".modo-grande"); await W.dorme(300);
    if (!/Bravura dei Bot/.test(P.document.body.textContent)) no("nelle impostazioni non c'è «Bravura dei Bot»");
    var attesi = P.SG.bot.prendi(3, { livello: "medio", escludi: ["Paky"] }), nomi = attesi.map(function (b) { return b.nome; });
    var spia = spiaCasuale(P, nomi.concat(["Bot", "Rosa", "Tonio", "Lia"]));
    if (!W.clicca(P, /Comincia|Gioca/)) no("non trovo il tasto per cominciare («" + T(P).slice(-80) + "»)");
    if (!await W.aspetta(function () { return P.document.querySelector(".pk-scena"); }, 6000)) no("il tavolo non si apre");
    await W.dorme(1500);
    var tx = P.document.querySelector(".pk-scena").innerText;
    nomi.forEach(function (n) { if (tx.indexOf(n) < 0) no(n + " (bot fisso medio) non è al tavolo («" + tx.slice(0, 120) + "»)"); });
    if (/(^|\n)Bot(\n|$)/.test(tx)) no("al tavolo c'è un bot che si chiama «Bot»");
    if (spia.n) no("il tavolo inventa l'avatar di " + spia.chi.slice(0, 3).join(", ") + " invece di usare quello fisso");
    var mis = await A.misuraSchermata(P, "Paky", 360, 640);
    var f = document.getElementById("tel-Paky"); f.style.width = "360px"; f.style.height = "740px"; P.dispatchEvent(new P.Event("resize"));
    if (mis) no("il tavolo: " + mis);
    return "«" + mb + "»; al tavolo " + nomi.join(", ") + " coi loro avatar fissi; 360x640 senza scorrere";
  } });

  COPIONE.aggiungi("263d", { nome: "Poker online: i bot dell'host sono quelli fissi, l'ospite li vede col loro avatar; «−» e «+» rimette lo stesso", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti }), C = await W.apriStanza(P, "Poker");
    var G = await W.apriTel("Giulia", { hash: "gioco=poker&stanza=" + C, x: 185, prima: A.botFinti });
    if (!await W.aspetta(function () { return (A.vm(C).players || []).length === 2 && A.dentro(G); }, 8000)) no("Giulia non entra");
    var liv = A.vm(C).difficolta || "medio";
    var attesi = P.SG.bot.prendi(2, { livello: liv, escludi: ["Paky", "Giulia"] }).map(function (b) { return b.nome; });
    var spiaG = spiaCasuale(G, attesi), spiaP = spiaCasuale(P, attesi);
    var piu = function () { return [].find.call(P.document.querySelectorAll(".pk-bot-riga button"), function (b) { return b.textContent === "+"; }); };
    var meno = function () { return [].find.call(P.document.querySelectorAll(".pk-bot-riga button"), function (b) { return b.textContent === "−"; }); };
    if (!piu()) no("l'host non ha il «+» dei bot");
    piu().click(); await W.dorme(300); piu().click();
    var botVm = function () { return (A.vm(C).players || []).filter(function (p) { return p.bot; }).map(function (p) { return p.nome; }); };
    if (!await W.aspetta(function () { return botVm().length === 2; }, 5000)) no("i bot non arrivano nella foto");
    if (botVm().join() !== attesi.join()) no("i bot sono " + botVm().join(", ") + " invece di " + attesi.join(", "));
    if (!await W.aspetta(function () { return attesi.every(function (n) { return A.avatarDi(G, n); }); }, 5000)) no("Giulia non vede i bot in saletta");
    await W.dorme(500);
    attesi.forEach(function (n) {
      if (senzaId(A.avatarDi(G, n).innerHTML) !== senzaId(A.avatarDi(P, n).innerHTML)) no(n + " non ha lo stesso avatar sui due telefoni");
    });
    if (spiaG.n || spiaP.n) no("un telefono inventa l'avatar di " + spiaG.chi.concat(spiaP.chi).slice(0, 3).join(", "));
    meno().click(); await W.dorme(300);
    if (!await W.aspetta(function () { return botVm().length === 1; }, 4000)) no("il «−» non toglie il bot");
    piu().click();
    if (!await W.aspetta(function () { return botVm().length === 2; }, 4000)) no("il «+» non rimette il bot");
    if (botVm().join() !== attesi.join()) no("dopo «−» e «+» i bot sono " + botVm().join(", "));
    var riga = (P.document.querySelector(".pk-bot-riga") || {}).textContent || "";
    if (!/🤖 Bot al tavolo: 2/.test(riga)) no("la riga dei bot dice «" + riga + "»");
    return "bot fissi " + attesi.join(", ") + " (livello " + liv + "); Giulia li vede con lo stesso avatar dell'host (nessuno inventato); «−» e «+» rimette " + attesi[1];
  } });
})();
