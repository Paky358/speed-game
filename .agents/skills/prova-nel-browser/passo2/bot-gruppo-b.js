// PROVE DEL PASSO 2, pezzo p2-bg2: i giochi del gruppo B usano i bot fissi (SG.bot).
// Dei 6 giochi del gruppo (Scalinata, Palla Matta, Ruota, Scopa 2 vs 2, Pendolo, Horto Muso) hanno dei bot tutti tranne Palla Matta.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/bot-gruppo-b.js"); await COPIONE.prova(262)
//
// 262: Scalinata su questo telefono: sulla scala i 3 bot fissi (SG.bot.prendi(3), nessuno col nome di chi gioca) coi loro avatar
//      (nessuno inventato), il menu dice "Bot"; partita intera fino al podio coi nomi dei bot; 360x640 senza scorrere.
// 262b: Scalinata online in 2: i 2 posti liberi vanno ai bot fissi (nome + avatar nella foto), l'ospite li vede uguali.
// 262c: Ruota contro i Bot: menu "Contro i Bot" e "Bravura dei Bot"; in studio i bot fissi del livello scelto (difficile: Matt, Angela)
//       coi loro avatar; 360x640 senza scorrere.
// 262d: Ruota online: "+" mette il bot fisso (avatar mandato agli ospiti), cambiando la bravura in saletta i bot cambiano livello.
// 262e: Scopa 2 vs 2 contro i Bot: al tavolo i 3 bot fissi (medio: Peppe, Gina, Totò) coi loro avatar; menu "Contro i Bot".
// 262f: Scopa 2 vs 2 online in 2: i 2 posti liberi ai bot fissi, l'ospite li vede col loro nome e avatar.
// 262g: Pendolo da solo (sulla trave e lanciatore): i bot fissi del livello scelto, coi loro avatar (nessuno inventato).
// 262h: Pendolo online: chi lancia (se nessuno) e i posti liberi sono bot fissi, l'ospite li riceve col loro avatar.
// 262i: Horto contro i Bot: corsa intera coi bot fissi in sella (nomi e avatar), classifica coi loro nomi; 360x640.
// 262j: Horto online: i posti liberi ai bot fissi (nome + avatar nel "via"), l'ospite li vede uguali.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var VECCHI = ["Bot", "Kevin", "Cody", "Giulia", "Toni", "Sara", "Leo", "Nina", "Bot 2", "Bot 3"];
  // conta quante volte il telefono inventa un avatar (SGOmino.casuale) per uno di questi nomi
  function spiaCasuale(w, nomi) {
    var c = { n: 0, chi: [] }, orig = w.SGOmino.casuale;
    w.SGOmino.casuale = function (n) { if (nomi.indexOf(n) >= 0) { c.n++; c.chi.push(n); } return orig.apply(this, arguments); };
    return c;
  }
  // gli avatar disegnati dal telefono (SGOmino.svg): per vedere se c'è quello del bot fisso
  var CAMPI = ["forma", "pelle", "viso", "capelli", "colCap", "capo", "maglia", "occhiali", "cappello"];
  function impronta(o) { return o ? CAMPI.map(function (k) { return String(o[k]); }).join("|") : ""; }
  function spiaSvg(w) {
    var s = { visti: {} }, orig = w.SGOmino.svg;
    w.SGOmino.svg = function (cfg) { try { s.visti[impronta(w.SGOmino.norm(cfg))] = 1; } catch (e) {} return orig.apply(this, arguments); };
    s.ha = function (b) { return !!s.visti[impronta(b.omino)]; };
    return s;
  }
  function attesi(w, n, livello, escludi) { return w.SG.bot.prendi(n, { livello: livello, escludi: escludi }); }
  function nomi(l) { return l.map(function (b) { return b.nome; }); }
  async function apriGioco(w, nome) {
    var tess = await W.aspetta(function () { return A.tessera(w, nome); }, 5000); if (!tess) no("non trovo " + nome);
    tess.click(); await W.dorme(300);
  }
  // il modo "contro i bot": deve dire Bot e mai un nome
  function modoBot(w) {
    var mb = A.modiVisti(w).filter(function (m) { return /Bot/.test(m); })[0];
    if (!mb || /Matt|Angela|Rosa|Peppe|Gina|Totò|Ciro|Lella|computer|il primo/.test(mb)) no("il modo contro i bot dice: " + (mb || A.modiVisti(w).join(" / ")));
    return mb;
  }
  async function misura(w, nome) {
    var mis = await A.misuraSchermata(w, nome, 360, 640);
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return mis;
  }
  function scegliChip(w, re) { var b = [].find.call(w.document.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); }); if (b) b.click(); return !!b; }

  COPIONE.aggiungi(262, { nome: "Scalinata su un telefono: i 3 bot fissi coi loro avatar, partita intera fino al podio", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await apriGioco(P, "La Scalinata");
    if (!/anche con i Bot/.test(A.modiVisti(P).join(" "))) no("il modo dice: " + A.modiVisti(P).join(" / "));
    W.clicca(P, /Su questo telefono/, ".modo-grande"); await W.dorme(300); W.clicca(P, /Avanti/); await W.dorme(300);
    var B = attesi(P, 3, null, ["Paky"]), N = nomi(B), spia = spiaCasuale(P, N.concat(VECCHI)), svg = spiaSvg(P);
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return /Via!/.test(T(P)); }, 5000)) no("la scala non si apre («" + T(P).slice(0, 80) + "»)");
    var tx = T(P);
    N.forEach(function (n) { if (tx.indexOf("🤖 " + n) < 0) no(n + " (bot fisso) non è sulla scala («" + tx.slice(0, 160) + "»)"); });
    if (/🤖 (Bot|Kevin|Cody)\b/.test(tx)) no("sulla scala c'è un bot coi nomi vecchi");
    if (spia.n) no("la scala inventa l'avatar di " + spia.chi.slice(0, 3).join(", "));
    B.forEach(function (b) { if (!svg.ha(b)) no(b.nome + " non ha il suo avatar fisso"); });
    var mis = await misura(P, "Paky"); if (mis) no("la scala: " + mis);
    // partita intera
    var fine = Date.now() + 120000;
    while (Date.now() < fine && !/Fine partita/.test(T(P))) {
      W.clicca(P, /Via!/) || W.clicca(P, /Vedi il podio/) || W.clicca(P, /Prossimo round/) || W.clicca(P, /^\d+gradin/);
      await W.dorme(250);
    }
    var tf = T(P);
    if (!/Fine partita/.test(tf)) no("la partita non finisce («" + tf.slice(-100) + "»)");
    N.forEach(function (n) { if (tf.indexOf(n) < 0) no("nella classifica finale non c'è " + n + " («" + tf.slice(0, 160) + "»)"); });
    return "sulla scala " + N.join(", ") + " coi loro avatar; fine: «" + tf.replace(/\s+/g, " ").slice(0, 110) + "»; 360x640 senza scorrere";
  } });

  COPIONE.aggiungi("262b", { nome: "Scalinata online: i posti liberi ai bot fissi, nome e avatar nella foto, l'ospite li vede", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti }), C = await W.apriStanza(P, "La Scalinata");
    var G = await W.apriTel("Giulia", { hash: "gioco=scalinata&stanza=" + C, x: 185, prima: A.botFinti });
    if (!await W.aspetta(function () { return (A.vm(C).posti || []).length === 2 && A.dentro(G); }, 8000)) no("Giulia non entra");
    var B = attesi(P, 2, null, ["Paky", "Giulia"]), N = nomi(B), spia = spiaCasuale(G, N.concat(VECCHI));
    W.clicca(P, /Comincia/);
    var bots = await W.aspetta(function () { var b = (A.vm(C).posti || []).filter(function (p) { return p.bot; }); return b.length === 2 && b; }, 8000);
    if (!bots) no("i bot non arrivano nella foto");
    if (nomi(bots).join() !== N.join()) no("i bot sono " + nomi(bots).join(", ") + " invece di " + N.join(", "));
    bots.forEach(function (p, i) { if (impronta(G.SGOmino.norm(p.omino)) !== impronta(B[i].omino)) no(p.nome + " nella foto non ha il suo avatar fisso"); });
    if (!await W.aspetta(function () { return N.every(function (n) { return T(G).indexOf("🤖 " + n) >= 0; }); }, 6000)) no("Giulia non vede i bot sulla scala («" + T(G).slice(0, 120) + "»)");
    if (spia.n) no("il telefono di Giulia inventa l'avatar di " + spia.chi.slice(0, 3).join(", "));
    return "nella foto e da Giulia: " + N.join(", ") + " col loro avatar";
  } });

  COPIONE.aggiungi("262c", { nome: "Ruota contro i Bot: menu «Contro i Bot», in studio i bot fissi del livello scelto", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await apriGioco(P, "La Ruota della Fortuna");
    var mb = modoBot(P);
    W.clicca(P, /Contro i Bot/, ".modo-grande"); await W.dorme(300);
    if (!/Bravura dei Bot/.test(P.document.body.textContent)) no("nelle impostazioni non c'è «Bravura dei Bot»");
    if (!scegliChip(P, /^Difficile$/)) no("non trovo «Difficile»");
    var B = attesi(P, 2, "difficile", ["Paky"]), N = nomi(B), spia = spiaCasuale(P, N.concat(VECCHI).concat(["Rosa", "Peppe", "Gina"])), svg = spiaSvg(P);
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    // la sigla presenta i concorrenti uno alla volta: si guarda chi compare (anche per un attimo)
    var visti = {}, vecchi = {};
    if (!await W.aspetta(function () {
      var tx = T(P); N.forEach(function (n) { if (tx.indexOf(n) >= 0) visti[n] = 1; });
      ["Rosa", "Peppe", "Gina"].forEach(function (n) { if (N.indexOf(n) < 0 && tx.indexOf(n) >= 0) vecchi[n] = 1; });
      return Object.keys(visti).length === N.length;
    }, 25000)) no("in studio non si vedono " + N.join(", ") + " (visti: " + Object.keys(visti).join(", ") + ")");
    if (Object.keys(vecchi).length) no("in studio ci sono altri bot: " + Object.keys(vecchi).join(", "));
    if (spia.n) no("lo studio inventa l'avatar di " + spia.chi.slice(0, 3).join(", "));
    B.forEach(function (b) { if (!svg.ha(b)) no(b.nome + " non ha il suo avatar fisso"); });
    var mis = await misura(P, "Paky"); if (mis) no("lo studio: " + mis);
    return "«" + mb + "»; difficile: " + N.join(", ") + " coi loro avatar; 360x640 senza scorrere";
  } });

  COPIONE.aggiungi("262d", { nome: "Ruota online: «+» mette un bot fisso (avatar agli ospiti), la bravura in saletta cambia i bot", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti }), C = await W.apriStanza(P, "La Ruota della Fortuna");
    var G = await W.apriTel("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 185, prima: A.botFinti });
    if (!await W.aspetta(function () { return (A.vm(C).giocatori || []).length === 2 && A.dentro(G); }, 8000)) no("Giulia non entra");
    var liv = A.vm(C).difficolta || "medio", B = attesi(P, 1, liv, ["Paky", "Giulia"]), spia = spiaCasuale(G, nomi(B).concat(["Rosa", "Peppe", "Gina", "Bot"]));
    var piu = function () { return [].find.call(P.document.querySelectorAll(".ru-bot-riga button"), function (b) { return b.textContent === "+"; }); };
    if (!piu()) no("l'host non ha il «+» dei bot");
    piu().click();
    var botVm = function () { return (A.vm(C).giocatori || []).filter(function (p) { return p.bot; }); };
    if (!await W.aspetta(function () { return botVm().length === 1; }, 5000)) no("il bot non arriva nella foto");
    if (botVm()[0].nome !== B[0].nome) no("il bot è " + botVm()[0].nome + " invece di " + B[0].nome);
    if (!await W.aspetta(function () { return A.avatarDi(G, B[0].nome); }, 5000)) no("Giulia non vede " + B[0].nome + " in saletta");
    await W.dorme(400);
    if (A.avatarDi(G, B[0].nome).innerHTML.replace(/om[0-9a-z]+_/g, "") !== A.avatarDi(P, B[0].nome).innerHTML.replace(/om[0-9a-z]+_/g, "")) no(B[0].nome + " ha un avatar diverso sui due telefoni");
    if (spia.n) no("Giulia inventa l'avatar di " + spia.chi.join(", "));
    // la bravura cambia in saletta: il bot diventa quello del nuovo livello
    var altro = liv === "difficile" ? "facile" : "difficile", B2 = attesi(P, 1, altro, ["Paky", "Giulia"]);
    var hs = P.document.querySelector(".sl-regole, [data-regole]") || [].find.call(P.document.querySelectorAll("button"), function (b) { return /Regole/.test(b.textContent); });
    if (!hs) no("non trovo «⚙️ Regole» in saletta");
    hs.click(); await W.dorme(400);
    if (!scegliChip(P, new RegExp("^" + (altro === "facile" ? "Facile" : "Difficile") + "$"))) no("nelle regole non trovo la bravura");
    W.clicca(P, /Fatto|Salva|Ok|Conferma|Applica/); await W.dorme(600);
    if (!await W.aspetta(function () { return botVm().length === 1 && botVm()[0].nome === B2[0].nome; }, 5000)) no("cambiata la bravura, il bot è " + (botVm()[0] || {}).nome + " invece di " + B2[0].nome);
    if (!await W.aspetta(function () { return A.avatarDi(G, B2[0].nome); }, 5000)) no("Giulia non vede " + B2[0].nome);
    return liv + ": «+» mette " + B[0].nome + " (stesso avatar da Giulia); bravura " + altro + ": diventa " + B2[0].nome;
  } });

  COPIONE.aggiungi("262e", { nome: "Scopa 2 vs 2 contro i Bot: al tavolo i 3 bot fissi coi loro avatar", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await apriGioco(P, "Scopa 2 vs 2");
    var mb = modoBot(P);
    W.clicca(P, /Contro i Bot/, ".modo-grande"); await W.dorme(300);
    if (!/Bravura dei Bot/.test(P.document.body.textContent)) no("nelle impostazioni non c'è «Bravura dei Bot»");
    var B = attesi(P, 3, "medio", ["Paky"]), N = nomi(B), svg = spiaSvg(P);
    // (il tavolo della Scopa si misura quando si apre: si apre già a 360x640, come su un telefono vero)
    var fr = document.getElementById("tel-Paky"); fr.style.width = "360px"; fr.style.height = "640px"; P.dispatchEvent(new P.Event("resize")); await W.dorme(300);
    if (!W.clicca(P, /Comincia|Gioca/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return N.every(function (n) { return T(P).indexOf(n) >= 0; }); }, 8000)) no("al tavolo non ci sono " + N.join(", ") + " («" + T(P).slice(0, 160) + "»)");
    await W.dorme(800);
    if (/(^|\s)(Bot|Giulia|Toni)(\s|$)/.test(T(P))) no("al tavolo c'è un bot coi nomi vecchi («" + T(P).slice(0, 160) + "»)");
    B.forEach(function (b) { if (!svg.ha(b)) no(b.nome + " non ha il suo avatar fisso"); });
    var mis = await misura(P, "Paky"); if (mis) no("il tavolo: " + mis);
    return "«" + mb + "»; al tavolo " + N.join(", ") + " (avversario, compagno, avversario) coi loro avatar; 360x640 senza scorrere";
  } });

  COPIONE.aggiungi("262f", { nome: "Scopa 2 vs 2 online: i posti liberi ai bot fissi, l'ospite li vede col loro avatar", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti }), C = await W.apriStanza(P, "Scopa 2 vs 2");
    var G = await W.apriTel("Giulia", { hash: "gioco=scopa2v2&stanza=" + C, x: 185, prima: A.botFinti });
    if (!await W.aspetta(function () { return A.dentro(G) && /Giulia/.test(T(P)); }, 8000)) no("Giulia non entra");
    if (/🤖 bot\b/.test(T(P))) no("la saletta dice ancora «🤖 bot»");
    var B = attesi(P, 2, "medio", ["Paky", "Giulia"]), N = nomi(B), svg = spiaSvg(G);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return N.every(function (n) { return T(G).indexOf(n) >= 0 && T(P).indexOf(n) >= 0; }); }, 8000)) no("al tavolo non ci sono " + N.join(", ") + " («" + T(G).slice(0, 160) + "»)");
    await W.dorme(800);
    B.forEach(function (b) { if (!svg.ha(b)) no("Giulia non vede " + b.nome + " col suo avatar fisso"); });
    return "Paky e Giulia vedono " + N.join(", ") + " col loro avatar";
  } });

  COPIONE.aggiungi("262g", { nome: "Pendolo da solo: i bot fissi (sulla trave e chi lancia) coi loro avatar", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti }), res = [];
    for (var giro = 0; giro < 2; giro++) {
      await apriGioco(P, "Palla a Pendolo");
      if (giro === 0) { var mb = (P.document.body.innerText.match(/Contro i Bot[^\n]*/) || [""])[0]; if (!mb) no("il pendolo non dice «Contro i Bot»"); }
      W.clicca(P, /Da solo/, ".modo-grande"); await W.dorme(300);
      if (!/Bravura dei Bot/.test(P.document.body.textContent)) no("nelle impostazioni non c'è «Bravura dei Bot»");
      if (giro === 1) { scegliChip(P, /Sulla trave/); scegliChip(P, /^Difficile$/); }
      var liv = giro === 1 ? "difficile" : "medio", B = attesi(P, 3, liv, ["Paky"]), svg = spiaSvg(P), spia = spiaCasuale(P, VECCHI.concat(nomi(B)));
      if (!W.clicca(P, /Comincia|Gioca/)) no("non trovo «Comincia»");
      if (!await W.aspetta(function () { return P.document.querySelector("canvas"); }, 6000)) no("il pendolo non si apre");
      await W.dorme(1500);
      // (chi lancia si vede di spalle, disegnato a mano dal gioco: si guardano quelli sulla trave)
      B.slice(giro === 1 ? 1 : 0).forEach(function (b) { if (!svg.ha(b)) no(b.nome + " non ha il suo avatar fisso (" + liv + ")"); });
      if (spia.n) no("il pendolo inventa l'avatar di " + spia.chi.join(", "));
      res.push((giro ? "sulla trave, " : "lanci tu, ") + liv + ": " + nomi(B).join(", "));
      if (giro === 0) { var mis = await misura(P, "Paky"); if (mis) no("il pendolo: " + mis); }
      W.clicca(P, /^‹$/); await W.dorme(600); W.clicca(P, /Esci/); await W.dorme(600);
      if (giro === 0 && !await W.aspetta(function () { return A.tessera(P, "Palla a Pendolo"); }, 5000)) { W.clicca(P, /^‹$/); await W.dorme(600); }
    }
    return res.join("; ") + " coi loro avatar; 360x640 senza scorrere";
  } });

  COPIONE.aggiungi("262h", { nome: "Pendolo online: chi lancia e i posti liberi sono bot fissi, l'ospite li riceve col loro avatar", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti }), C = await W.apriStanza(P, "Palla a Pendolo");
    var G = await W.apriTel("Giulia", { hash: "gioco=pendolo&stanza=" + C, x: 185, prima: A.botFinti });
    if (!await W.aspetta(function () { return A.dentro(G) && /Giulia/.test(T(P)); }, 8000)) no("Giulia non entra");
    if (/🤖 bot\b/.test(T(P))) no("la saletta dice ancora «🤖 bot»");
    var svg = spiaSvg(G);
    W.clicca(P, /Comincia/);
    var via = await W.aspetta(function () { var s = A.vm(C); return s && s.t === "via" && s.av && s; }, 8000);
    if (!via) no("non arriva il «via» della partita");
    var umani = ["Paky", "Giulia"], bot = via.av.posti.filter(function (p) { return umani.indexOf(p.nome) < 0; });
    if (!via.lanc) bot.unshift(via.av.lanc);
    var B = attesi(P, 4, via.difficolta || "medio", umani);
    bot.forEach(function (p, i) {
      if (p.nome !== B[i].nome) no("il bot " + (i + 1) + " è «" + p.nome + "» invece di «" + B[i].nome + "»");
      if (impronta(P.SGOmino.norm(p.cfg)) !== impronta(B[i].omino)) no(p.nome + " non ha il suo avatar fisso nel «via»");
    });
    await W.dorme(1500);
    bot.forEach(function (p, i) { if (!svg.ha(B[i])) no("Giulia non disegna " + p.nome + " col suo avatar"); });
    return "chi lancia: " + (via.lanc ? "persona" : bot[0].nome) + "; bot: " + nomi(bot).join(", ") + " col loro avatar anche da Giulia";
  } });

  COPIONE.aggiungi("262i", { nome: "Horto contro i Bot: corsa intera coi bot fissi in sella, classifica coi loro nomi", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await apriGioco(P, "Horto Muso");
    var mb = modoBot(P);
    W.clicca(P, /Contro i Bot/, ".modo-grande"); await W.dorme(300);
    if (!/Bravura dei Bot/.test(P.document.body.textContent)) no("nelle impostazioni non c'è «Bravura dei Bot»");
    var B = attesi(P, 3, "medio", ["Paky"]), N = nomi(B), svg = spiaSvg(P), spia = spiaCasuale(P, VECCHI.concat(N));
    if (!W.clicca(P, /Comincia|Gioca/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return P.document.querySelector(".ho-wrap, .ho-pista, [class^=ho-]"); }, 6000)) no("la corsa non si apre");
    await W.dorme(1200);
    B.forEach(function (b) { if (!svg.ha(b)) no(b.nome + " non ha il suo avatar in sella"); });
    if (spia.n) no("la corsa inventa l'avatar di " + spia.chi.join(", "));
    var mis = await misura(P, "Paky"); if (mis) no("la corsa: " + mis);
    // frusta fino alla fine
    var fine = Date.now() + 90000, tasto = function () { return [].find.call(P.document.querySelectorAll("button"), function (b) { return /FRUSTA/i.test(b.textContent); }); };
    while (Date.now() < fine && !/Rigioca|Ancora/.test(T(P))) {
      var b = tasto(); if (b) { b.dispatchEvent(new P.PointerEvent("pointerdown", { bubbles: true })); b.dispatchEvent(new P.PointerEvent("pointerup", { bubbles: true })); }
      await W.dorme(700);
    }
    var tf = T(P);
    if (!/Rigioca|Ancora/.test(tf)) no("la corsa non finisce («" + tf.slice(-100) + "»)");
    if (!N.some(function (n) { return tf.indexOf(n) >= 0; })) no("alla fine non ci sono i bot («" + tf.slice(0, 160) + "»)");
    return "«" + mb + "»; in sella " + N.join(", ") + " coi loro avatar; fine: «" + tf.replace(/\s+/g, " ").slice(0, 100) + "»";
  } });

  COPIONE.aggiungi("262j", { nome: "Horto online: i posti liberi ai bot fissi (nome e avatar nel via), l'ospite li vede", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti }), C = await W.apriStanza(P, "Horto Muso");
    var G = await W.apriTel("Giulia", { hash: "gioco=horto&stanza=" + C, x: 185, prima: A.botFinti });
    if (!await W.aspetta(function () { return A.dentro(G) && /Giulia/.test(T(P)); }, 8000)) no("Giulia non entra");
    var svg = spiaSvg(G);
    W.clicca(P, /Comincia/);
    var via = await W.aspetta(function () { var s = A.vm(C); return s && s.t === "via" && s.av && s; }, 8000);
    if (!via) no("non arriva il «via» della corsa");
    var bot = []; via.nomi.forEach(function (n, i) { if (!via.ids[i]) bot.push({ nome: n, cfg: via.av[i] }); });
    var B = attesi(P, bot.length, via.diff || "medio", ["Paky", "Giulia"]);
    if (nomi(bot).join() !== nomi(B).join()) no("i bot sono " + nomi(bot).join(", ") + " invece di " + nomi(B).join(", "));
    bot.forEach(function (p, i) { if (impronta(P.SGOmino.norm(p.cfg)) !== impronta(B[i].omino)) no(p.nome + " non ha il suo avatar fisso nel «via»"); });
    await W.dorme(1500);
    B.forEach(function (b) { if (!svg.ha(b)) no("Giulia non vede " + b.nome + " col suo avatar"); });
    return "in corsa con Paky e Giulia: " + nomi(bot).join(", ") + " col loro avatar anche da Giulia";
  } });
})();
