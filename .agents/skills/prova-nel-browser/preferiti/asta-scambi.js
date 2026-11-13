// PROVE DEGLI «🔄 SCAMBI A FINE ASTA» DELLA MINI ASTA FANTACALCIO (13 nov 2026, il proprietario: «dammelo, ti do quello più forte»… «va reso
// facilissimo»). Finita l'asta, prima della classifica delle rose: «Chi vuole scambiare?», il mercato, il tavolo con «✅ Accetta scambio 0 di 2».
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-scambi.js");
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta.js,preferiti/asta-scambi.js --prova sc0,sc1,sc2,sc3 --timeout 1500
// (preferiti/asta.js: la spia delle regole; dal 13 nov le altre prove hanno gli scambi spenti, queste li accendono con scambi: true)
//
// sc0 Senza telefoni: le regole dello scambio (rose giuste per ruolo, cosa manca), lo scambio vero (i calciatori cambiano rosa col prezzo), il ⚙️
//     «🔄 Scambi a fine asta» acceso di partenza, il riassunto con «🔒 niente scambi» quando è spento, le regole scritte.
// sc1 Online in 4: finita l'asta tutti sono nel mercato (niente domanda): la mia rosa in alto, le altre, le 10 partite. Paky tocca l'attaccante
//     di Giulia (il suo si sceglie da solo) e un suo centrocampista (Paky ne ha due: lampeggiano e ne tocca uno); «📨 Proponi»: il pop-up arriva
//     solo a Giulia, anche dopo che ha ricaricato; Rifiuta (Paky lo sa), poi una nuova proposta e Accetta: i calciatori cambiano rosa, Luca vede
//     l'annuncio; «⏹ Fine»: la classifica usa le rose nuove.
// sc2 Online in 3 senza «🆚»: il mercato ha lo stesso le partite (e sono quelle che si giocano); Paky ricarica con una proposta in attesa: il
//     mercato riprende con la proposta e il tempo; «＋1'» allunga.
// sc3 Sullo stesso telefono in 3: dopo l'asta la schermata degli scambi; due rose, un centrocampista a testa, «✅ Scambiate», l'annuncio;
//     «Fine scambi ▶» porta alla classifica delle rose.
// sc5 (13 nov 2026, dopo la prova del proprietario, il proprietario: «le squadre sono piccolissime… la mia squadra la prima che si vede, ma della stessa grandezza delle altre…
//     adattiamo lo schermo in base a quanti giocatori siamo») Senza asta: il mercato disegnato con rose finte in 2, 3, 4, 6, 8 e 10 su un
//     telefono piccolo (360×640) e su uno come quello del proprietario (412×800): rose tutte della stessa grandezza, la mia per prima, niente
//     scorrere, targhette dentro il campo, scritte da 9 px in su; in 2 una colonna sola e campi alti; da 3 in su due rose per riga (in 3 un
//     posto vuoto a destra: il proprietario non vuole le tre una sotto l'altra); sul telefono grande fino a 8 tutti in una schermata; quando
//     servono le pagine ‹ › la mia rosa resta per prima e le altre ci sono tutte.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function mk(tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "class") e.className = a[k]; else if (k === "text") e.textContent = a[k]; else if (k === "style") e.style.cssText = a[k]; else if (k.slice(0, 2) === "on") e[k] = a[k]; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  async function motore() {   // il file del gioco con le funzioni dello scambio portate fuori (solo per la prova)
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {}, ag = "  function hostFanta(t) {";
    if (src.indexOf(ag) < 0) no("non trovo l'host del fanta");
    src = src.replace(ag, "FUORI.valido = scambioValido; FUORI.fai = faiScambio; FUORI.frase = fraseScambio; " + ag);
    var g = {}; new Function("SG", "FUORI", src)({ registra: function (x) { if (x.id === "astafanta") Object.assign(g, x); }, bot: W.SG && SG.bot }, fuori);
    fuori.g = g; return fuori;
  }
  function c(nome, sq, ruolo, prezzo) { return { nome: nome, squadra: sq, ruolo: ruolo, prezzo: prezzo || 1 }; }

  COPIONE.aggiungi("sc0", { nome: "Mini Asta Fantacalcio, 🔄 scambi a fine asta: regole dello scambio, scambio vero, ⚙️, riassunto e regole scritte", fai: async function () {
    var M = await motore(), x = [];
    var A = { id: "a", nome: "Paky", kit: [c("Sommer", "Inter", "P"), c("Bastoni", "Inter", "D"), c("Barella", "Inter", "C", 9), c("Calhanoglu", "Inter", "C", 4), c("Lautaro", "Inter", "A", 15)] };
    var B = { id: "b", nome: "Giulia", kit: [c("Maignan", "Milan", "P"), c("Tomori", "Milan", "D"), c("Modric", "Milan", "C", 6), c("Loftus-Cheek", "Milan", "C", 2), c("Leao", "Milan", "A", 12)] };
    var v0 = M.valido(A, B, [], []); if (v0.ok || !/Toccate/.test(v0.msg)) no("senza calciatori: «" + v0.msg + "»");
    var v1 = M.valido(A, B, ["Barella|Inter"], ["Leao|Milan"]); if (v1.ok || v1.msg !== "Serve un centrocampista di Giulia e un attaccante di Paky in cambio") no("C per A: «" + v1.msg + "»");
    var v2 = M.valido(A, B, ["Barella|Inter"], []); if (v2.ok || v2.msg !== "Serve un centrocampista di Giulia in cambio") no("C per niente: «" + v2.msg + "»");
    var v3 = M.valido(A, B, ["Barella|Inter", "Lautaro|Inter"], ["Modric|Milan", "Leao|Milan"]); if (!v3.ok) no("C+A per C+A: «" + v3.msg + "»");
    var v4 = M.valido(A, B, ["Sommer|Inter"], ["Tomori|Milan"]); if (v4.ok || !/un portiere di Giulia/.test(v4.msg)) no("P per D: «" + v4.msg + "»");
    var r = M.fai(A, B, ["Barella|Inter", "Lautaro|Inter"], ["Modric|Milan", "Leao|Milan"]);
    var nA = A.kit.map(function (k) { return k.nome; }).sort().join(","), nB = B.kit.map(function (k) { return k.nome; }).sort().join(",");
    if (nA !== "Bastoni,Calhanoglu,Leao,Modric,Sommer" || nB !== "Barella,Lautaro,Loftus-Cheek,Maignan,Tomori") no("dopo lo scambio: " + nA + " / " + nB);
    if (A.kit.filter(function (k) { return k.nome === "Leao"; })[0].prezzo !== 12) no("il prezzo pagato non segue il calciatore");
    var fr = M.frase({ na: "Paky", nb: "Giulia", ca: ["Barella", "Lautaro"], cb: ["Modric", "Leao"] });
    if (fr !== "Paky dà Barella e Lautaro a Giulia per Modric e Leao") no("l'annuncio: «" + fr + "»");
    x.push("regole dello scambio e annuncio «" + fr + "»");
    var box = document.createElement("div"), dove = {};
    M.g.impostazioni(box, dove, { el: mk, modo: "online" });
    if (!/Scambi a fine asta/.test(box.textContent) || dove.scambi !== true) no("nel ⚙️ «🔄 Scambi a fine asta» non c'è o non è acceso di partenza (" + dove.scambi + ")");
    var rN = M.g.riassunto({ formato: "fanta", scambi: false }), rS = M.g.riassunto({ formato: "fanta" });
    if (!/🔒 niente scambi/.test(rN) || /scambi/.test(rS) || rN.length > 90) no("riassunti: «" + rS + "» / «" + rN + "»");
    if (!/Scambi a fine asta<\/b> \(nel ⚙️, accesi di partenza\)/.test(M.g.regole.join(" "))) no("le regole non parlano degli scambi");
    x.push("⚙️ acceso di partenza · «" + rN + "»");
    return x.join(" · ");
  } });

  // il mercato ben diviso: la mia rosa per prima, tutte della stessa grandezza, niente scorrere, targhette dentro il campo, scritte leggibili
  function misureMercato(w) {
    var rose = qa(w, ".mc-rosa"), campi = qa(w, ".mc-campo"), s = q(w, ".sc-merc"), box = q(w, ".mc-rose");
    if (!rose.length || !s || !box) return "il mercato non c'è";
    if (!rose[0].classList.contains("mc-mia") || !/La tua rosa/.test(rose[0].textContent)) return "la prima rosa non è la mia";
    var r0 = campi[0].getBoundingClientRect(), diversi = campi.filter(function (c) { var r = c.getBoundingClientRect(); return Math.abs(r.width - r0.width) > 1.5 || Math.abs(r.height - r0.height) > 1.5; });
    if (diversi.length) return "le rose non sono tutte della stessa grandezza";
    if (s.scrollHeight > s.clientHeight + 1 || w.document.documentElement.scrollHeight > w.innerHeight + 1) return "il mercato scorre (" + s.scrollHeight + " > " + s.clientHeight + ")";
    if (rose[rose.length - 1].getBoundingClientRect().bottom > box.getBoundingClientRect().bottom + 1) return "l'ultima rosa è tagliata";
    var fuori = qa(w, ".mc-p").filter(function (b) { var r = b.getBoundingClientRect(), c = b.parentNode.getBoundingClientRect(); return r.left < c.left - 1 || r.right > c.right + 1 || r.top < c.top - 1 || r.bottom > c.bottom + 1; });
    if (fuori.length) return fuori.length + " targhette escono dal campo (" + fuori[0].textContent + ")";
    var sovra = 0; campi.forEach(function (c) { var pp = [].map.call(c.querySelectorAll(".mc-p"), function (b) { return b.getBoundingClientRect(); }); pp.forEach(function (a, i) { pp.slice(i + 1).forEach(function (b) { if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) sovra++; }); }); });
    if (sovra) return sovra + " targhette una sopra l'altra";
    var f = parseFloat(w.getComputedStyle(q(w, ".mc-p")).fontSize); if (f < 8.9) return "scritte troppo piccole (" + f + " px)";
    return null;
  }
  async function telefoni(nomi, imp) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 190 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non entrano tutti");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  async function asta(P, C) {   // l'asta veloce (chi può lo prende, gli altri passano), fino agli scambi
    var fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "scambi" && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(200); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      var poss = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; });
      if (!a.leaderId) { var pr = poss[a.nCarta % Math.max(1, poss.length)]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(250);
    }
    if (vm(C).fase !== "scambi") no("finita l'asta non arrivano gli scambi (fase «" + vm(C).fase + "»)");
  }
  function rosa(C, nome) { var g = (vm(C).giocatori || []).filter(function (x) { return x.nome === nome; })[0]; return g ? g.kit : []; }
  function carta(w, k) { return qa(w, ".sc-carta").filter(function (b) { return b.getAttribute("data-k") === k; })[0] || null; }
  function tasto(w) { return q(w, ".sc-ok"); }
  async function tocca(w, k) { var b = carta(w, k); if (!b) no("sul tavolo non c'è la carta " + k); b.click(); await W.dorme(500); }

  function pill(w, gid, k) { return qa(w, ".mc-rosa[data-g=\"" + gid + "\"] .mc-p").filter(function (b) { return b.getAttribute("data-k") === k; })[0] || null; }
  function kDi(C, nome, r, i) { var c = rosa(C, nome).filter(function (x) { return x.ruolo === r; })[i || 0]; return c ? c.nome + "|" + c.squadra : null; }
  async function clic(w, gid, k) { var b = pill(w, gid, k); if (!b) no("non trovo la targhetta " + k); b.click(); await W.dorme(350); }

  COPIONE.aggiungi("sc1", { nome: "Mini Asta Fantacalcio online in 4: il mercato (la mia rosa, le altre, le partite), i miei si scelgono da soli, il centrocampista lo scelgo io, la proposta, il pop-up, chi ricarica, Rifiuta e Accetta, l'annuncio, la classifica con le rose nuove", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Sara"], o = await telefoni(NOMI, { formato: "fanta", scambi: true }), P = o.P, C = o.C, x = [];
    await asta(P, C);
    var G = W.finestra("Giulia"), L = W.finestra("Luca"), iG = idDi("Giulia");
    if (!await W.aspetta(function () { return [P, G, L].every(function (w) { return q(w, ".mc-mia .mc-p") && qa(w, ".mc-griglia .mc-rosa").length === 4; }); }, 8000)) no("il mercato non arriva a tutti con la propria rosa e le 3 rose degli altri");
    [P, G, L].forEach(function (w) { var e = misureMercato(w); if (e) no(e); });
    if (q(P, ".sc-domanda")) no("c'è ancora la domanda «Chi vuole scambiare?»");
    if (qa(P, ".mc-ris .st-ris-p").length !== 10) no("sotto il mercato non ci sono le 10 partite della giornata");
    var nums = qa(P, ".mc-p small").map(function (e) { return e.textContent; });
    if (!nums.length || !nums.every(function (t) { return /^\d+$/.test(t); }) || /overall|⭐/.test(q(P, ".sc-merc").textContent)) no("nel mercato non ci sono le quotazioni (o c'è l'overall): " + nums.slice(0, 5).join(", "));
    x.push("mercato: la mia rosa per prima e le 3 rose degli altri, tutte uguali (con le quotazioni), le 10 partite");
    // un attaccante di Giulia: il mio attaccante si sceglie da solo
    var kGA = kDi(C, "Giulia", "A"), kPA = kDi(C, "Paky", "A");
    await clic(P, iG, kGA);
    var mioA = qa(P, ".mc-mia .mc-p").filter(function (b) { return b.getAttribute("data-k") === kPA; })[0];
    if (!mioA || !mioA.classList.contains("sel")) no("toccato l'attaccante di Giulia, il mio attaccante non si sceglie da solo");
    var bp = bott(P, ".mc-barra .sc-ok", /Proponi/); if (!bp || bp.disabled) no("«📨 Proponi» spento con uno scambio giusto");
    var su = q(P, ".mc-barra.su"); if (!su || su.getBoundingClientRect().top < qa(P, ".mc-rosa").pop().getBoundingClientRect().bottom - 1) no("la barra di «📨 Proponi» copre le rose (o non sale)");
    var e1 = misureMercato(P); if (e1) no("con la scelta: " + e1);
    // e un suo centrocampista: io ne ho due, scelgo io quale
    var kGC = kDi(C, "Giulia", "C"), kPC = kDi(C, "Paky", "C", 1);
    await clic(P, iG, kGC);
    if (!bott(P, ".mc-barra .sc-ok", /Proponi/).disabled) no("con due centrocampisti miei «Proponi» è acceso prima di sceglierne uno");
    if (!/quale centrocampista/.test(q(P, ".mc-barra").textContent)) no("non dice di toccare quale centrocampista dai («" + q(P, ".mc-barra").textContent + "»)");
    if (qa(P, ".mc-mia .mc-p.scegli").length !== 2) no("i miei due centrocampisti non lampeggiano");
    qa(P, ".mc-mia .mc-p").filter(function (b) { return b.getAttribute("data-k") === kPC; })[0].click(); await W.dorme(300);
    var bp2 = bott(P, ".mc-barra .sc-ok", /Proponi/); if (!bp2 || bp2.disabled) no("scelto il centrocampista, «Proponi» resta spento");
    x.push("attaccante scelto da solo, centrocampista scelto a mano");
    bp2.click();
    if (!await W.aspetta(function () { return q(G, ".mc-pop") && /Paky ti propone/.test(q(G, ".mc-pop").textContent); }, 6000)) no("a Giulia non arriva il pop-up della proposta");
    if (q(L, ".mc-pop")) no("il pop-up arriva anche a Luca");
    if (!/Hai proposto/.test(q(P, ".mc-barra").textContent)) no("Paky non vede la sua proposta in attesa");
    await W.ricarica("Giulia"); G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return G && q(G, ".mc-pop"); }, 15000)) no("Giulia ricarica e la proposta non c'è più");
    x.push("pop-up solo a Giulia, anche dopo che ha ricaricato");
    W.clicca(G, /Rifiuta/);
    if (!await W.aspetta(function () { var a = q(P, ".mc-avviso"); return a && /rifiutato/.test(a.textContent); }, 6000)) no("Paky non sa che Giulia ha rifiutato");
    if (!await W.aspetta(function () { return !(vm(C).scambi.prop || []).length; }, 4000)) no("dopo il rifiuto la proposta resta");
    // di nuovo, solo l'attaccante: Giulia accetta
    await clic(P, iG, kGA); bott(P, ".mc-barra .sc-ok", /Proponi/).click();
    if (!await W.aspetta(function () { return q(G, ".mc-pop"); }, 6000)) no("la seconda proposta non arriva");
    W.clicca(G, /Accetta/);
    if (!await W.aspetta(function () { return rosa(C, "Paky").some(function (k) { return k.nome + "|" + k.squadra === kGA; }) && rosa(C, "Giulia").some(function (k) { return k.nome + "|" + k.squadra === kPA; }); }, 6000)) no("accettato, i calciatori non cambiano rosa");
    if (!await W.aspetta(function () { var a = q(L, ".sc-annuncio"); return a && /Paky dà/.test(a.textContent); }, 4000)) no("Luca non vede l'annuncio dello scambio");
    x.push("Rifiuta, poi Accetta: «" + q(L, ".sc-annuncio").textContent.replace("🔄 SCAMBIO FATTO", "") + "»");
    await W.dorme(1000);
    W.clicca(P, /⏹ Fine/); await W.dorme(400); W.clicca(P, /⏹ Chiudi/);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 8000)) no("«⏹ Fine» non porta alla classifica");
    var rp = (vm(C).classifica || []).filter(function (r) { return r.nome === "Paky"; })[0];
    if (!rp || !rp.kit.some(function (k) { return k.nome + "|" + k.squadra === kGA; })) no("la classifica non usa la rosa nuova di Paky");
    var cp = (vm(C).serieA || {}).partite || [], sc0 = vm(C);
    x.push("classifica con le rose nuove");
    return x.join(" · ");
  } });

  COPIONE.aggiungi("sc2", { nome: "Mini Asta Fantacalcio online in 3: chi tiene la partita ricarica con una proposta in attesa (il mercato riprende con la proposta e il tempo), «＋1'», le partite del mercato sono quelle della giornata", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], o = await telefoni(NOMI, { formato: "fanta", scambi: true, vs: false, vsScelto: true }), P = o.P, C = o.C, x = [], iG = idDi("Giulia");
    await asta(P, C);
    var G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return q(P, ".mc-mia .mc-p") && q(G, ".mc-mia .mc-p"); }, 8000)) no("il mercato non arriva");
    var mercato = ((vm(C).scambi || {}).coppie || [])[0] || []; if (mercato.length !== 10) no("senza «🆚» il mercato non ha le partite (" + mercato.length + ")");
    await clic(P, iG, kDi(C, "Giulia", "P")); bott(P, ".mc-barra .sc-ok", /Proponi/).click();
    if (!await W.aspetta(function () { return q(G, ".mc-pop"); }, 6000)) no("la proposta non arriva");
    await W.ricarica("Paky", { pa: true, prima: function (w) { w.__imp = { formato: "fanta", scambi: true, vs: false, vsScelto: true }; } }); P = W.finestra("Paky");
    if (!await W.aspetta(function () { return P && q(P, ".mc-barra") && /Hai proposto/.test(q(P, ".mc-barra").textContent); }, 20000)) no("dopo la ricarica Paky non ritrova la sua proposta");
    await W.aspetta(function () { return vm(C).fase === "scambi" && vm(C).scambi && vm(C).scambi.resta != null; }, 8000);
    var s1 = vm(C).scambi; if (!s1 || s1.resta < 25000 || (s1.prop || []).length !== 1) no("dopo la ricarica il mercato non riprende come prima (" + JSON.stringify(s1 && { resta: s1.resta, prop: (s1.prop || []).length }) + ")");
    if (!q(G, ".mc-pop")) no("dopo la ricarica di Paky il pop-up di Giulia sparisce");
    x.push("Paky ricarica: proposta e tempo (" + Math.round(s1.resta / 1000) + " s) ripresi");
    var r0 = s1.resta; W.clicca(P, /＋1'/);
    if (!await W.aspetta(function () { var s = vm(C).scambi; return s && s.resta > r0 + 40000; }, 5000)) no("«＋1'» non allunga il mercato");
    x.push("«＋1'» allunga");
    W.clicca(G, /Accetta/);
    if (!await W.aspetta(function () { return !(vm(C).scambi.prop || []).length; }, 5000)) no("Giulia accetta ma la proposta resta");
    W.clicca(P, /⏹ Fine/); await W.dorme(400); W.clicca(P, /⏹ Chiudi/);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 8000)) no("il mercato non finisce");
    var gio = ((vm(C).serieA || {}).partite || []).map(function (p) { return [p.c, p.f].sort().join("-"); }).sort().join(","), merc = mercato.map(function (p) { return p.slice().sort().join("-"); }).sort().join(",");
    if (gio !== merc) no("le partite del mercato non sono quelle della giornata");
    x.push("le partite del mercato sono quelle che si giocano");
    return x.join(" · ");
  } });

  COPIONE.aggiungi("sc4", { nome: "Mini Asta Fantacalcio online in 3: dopo il mercato niente sfilata delle rose, tutti dritti alla giornata", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], o = await telefoni(NOMI, { formato: "fanta", scambi: true }), P = o.P, C = o.C;
    await asta(P, C);
    var G = W.finestra("Giulia"), L = W.finestra("Luca");
    if (!await W.aspetta(function () { return q(P, ".mc-mia .mc-p"); }, 8000)) no("il mercato non arriva");
    W.clicca(P, /⏹ Fine/); await W.dorme(400); W.clicca(P, /⏹ Chiudi/);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 8000)) no("il mercato non finisce");
    var t0 = performance.now(), visto = false;
    var ok = await W.aspetta(function () { [P, G, L].forEach(function (w) { var n = q(w, ".st-campo-nome"); if (n && /La rosa di/.test(n.textContent) && n.getClientRects().length && n.offsetParent && q(w, ".st-rivela") && !q(w, ".st-rivela").classList.contains("gio")) { var c = q(w, ".st-campo"); if (c && c.getClientRects().length && getComputedStyle(c).display !== "none" && c.offsetHeight > 50) visto = true; } }); return [P, G, L].every(function (w) { return q(w, ".st-gio-riga"); }); }, 8000);
    if (!ok) no("dopo il mercato la giornata non parte su tutti i telefoni");
    if (visto) no("dopo il mercato c'è ancora la sfilata delle rose");
    return "dopo «⏹ Fine» tutti nella giornata in " + Math.round((performance.now() - t0) / 100) / 10 + " s, senza la sfilata delle rose";
  } });

  COPIONE.aggiungi("sc5", { nome: "Mini Asta Fantacalcio, il mercato in 2, 3, 4, 6, 8 e 10 su un telefono piccolo e su uno grande: rose tutte uguali, la mia per prima, niente scorrere, scritte grandi, le pagine solo quando servono", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), x = [];
    P.SGCuore.precarica("astafanta");
    if (!await W.aspetta(function () { return P.SG_FANTA_CALCIATORI && P.SG_FANTA_SQUADRE && P.SG_FANTA_QUOTAZIONI; }, 20000)) no("i dati del fanta non arrivano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "  var MERC = null;";
    if (src.indexOf(ag) < 0) no("non trovo il mercato nel file del gioco");
    new P.Function("SG", "FUORI", src.replace(ag, "FUORI.mercatoVM = mercatoVM; FUORI.sorteggio = sorteggioCoppie;" + ag))({ registra: function () {}, bot: P.SG && P.SG.bot }, F);
    var el = P.SGCuore.el, app = P.document.getElementById("app"), CA = P.SG_FANTA_CALCIATORI;
    var t = { el: el, guarda: false, conferma: function () {},
      schermata: function () { var s = el("div", { class: "schermata oro senza-testa g-astafanta" }, [ el("div", { class: "testa" }), el("div", { class: "contenuto" }), el("div", { class: "piede" }) ]); s._contenuto = s.children[1]; s._piede = s.children[2]; return s; },
      mostra: function (s) { while (app.firstChild) app.removeChild(app.firstChild); app.appendChild(s); } };
    var NOMI = ["Paky", "Giulia", "Luca", "Sara", "Bea", "Massimiliano", "Maria Antonietta", "Gianfrancesco", "Ale", "Ugo"];
    function rose(n, seme) {
      var usati = {}; function rnd() { seme = (seme * 9301 + 49297) % 233280; return seme / 233280; }
      function tutti(r) { var l = []; Object.keys(CA[r]).forEach(function (f) { l = l.concat(CA[r][f]); }); return l; }
      function prendi(r) { var l = tutti(r); for (;;) { var s = l[Math.floor(rnd() * l.length)]; if (usati[s]) continue; usati[s] = 1; var m = /^(.*) \((.*)\)$/.exec(s); return { nome: m[1], squadra: m[2], ruolo: r, prezzo: 1 + Math.floor(rnd() * 20) }; } }
      return NOMI.slice(0, n).map(function (nm, i) { return { id: i ? "g" + i : "host", nome: nm, omino: null, crediti: 3, kit: ["P", "D", "C", "C", "A"].map(prendi) }; });
    }
    var fr = document.getElementById("tel-Paky"), giro = 0;
    for (var ti = 0; ti < 2; ti++) {
      var wh = [[360, 640], [412, 800]][ti], righe = [];
      fr.style.cssText = "position:absolute;top:0;left:0;width:" + wh[0] + "px;height:" + wh[1] + "px;border:0;background:#000;transform:none;z-index:9";
      P.dispatchEvent(new P.Event("resize")); await W.dorme(300);
      for (var ni = 0; ni < 6; ni++) {
        var n = [2, 3, 4, 6, 8, 10][ni], gio = rose(n, 11 + n * 7 + ti); giro++;
        F.mercatoVM(t, { codice: "SC5" + giro, sessione: giro, fase: "scambi", giocatori: gio, scambi: { resta: 170000, prop: [], esiti: [], nf: 0, coppie: [F.sorteggio()] } }, { myId: "host", sonoHost: true, onScambio: function () {} });
        await W.dorme(350);
        var dove = wh.join("×") + " in " + n + ": ", e = misureMercato(P); if (e) no(dove + e);
        var pag = q(P, ".mc-pag"), vis = qa(P, ".mc-rosa"), f = parseFloat(P.getComputedStyle(q(P, ".mc-p")).fontSize), giri = 0;
        if (!pag && vis.length !== n) no(dove + "si vedono " + vis.length + " rose");
        var c0 = q(P, ".mc-campo").getBoundingClientRect(), b0 = q(P, ".mc-rose").getBoundingClientRect();
        if (n === 2 && (c0.width < b0.width - 2 || c0.height < wh[1] * 0.3)) no(dove + "le due rose non prendono lo schermo (" + Math.round(c0.width) + "×" + Math.round(c0.height) + ")");
        if (n >= 3 && Math.abs(c0.width - (b0.width - 6) / 2) > 2) no(dove + "le rose non sono due per riga (" + Math.round(c0.width) + " su " + Math.round(b0.width) + ")");
        if (n >= 3 && n <= 4 && c0.height < wh[1] * 0.27) no(dove + "le rose non prendono lo schermo (alte " + Math.round(c0.height) + ")");
        if (ti === 1 && n <= 8 && pag) no(dove + "sul telefono grande fino a 8 devono stare tutti in una schermata");
        if (pag) {   // le pagine: la mia sempre per prima, e girandole ci sono tutti
          var visti = {};
          do {
            var l = qa(P, ".mc-rosa"); if (!l[0].classList.contains("mc-mia")) no(dove + "girando le pagine la mia rosa non è più la prima");
            l.forEach(function (r) { visti[r.getAttribute("data-g")] = 1; });
            var e2 = misureMercato(P); if (e2) no(dove + "(pagina " + (giri + 1) + ") " + e2);
            qa(P, ".mc-pag .mc-mini")[1].click(); await W.dorme(150); giri++;
          } while (giri < 5 && !/^Rose degli altri 1–/.test(q(P, ".mc-pag span").textContent));
          if (Object.keys(visti).length !== n) no(dove + "girando le pagine si vedono " + Object.keys(visti).length + " rose su " + n);
        }
        righe.push(n + (pag ? " (" + giri + " pagine)" : "") + " " + f.toFixed(1) + " px");
      }
      x.push(wh.join("×") + ": " + righe.join(", "));
    }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("sc3", { nome: "Mini Asta Fantacalcio sullo stesso telefono in 3: gli scambi dopo l'asta, «✅ Scambiate», l'annuncio, «Fine scambi ▶»", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], x = [];
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "fanta", scambi: true }; } });
    var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000); if (!tess) no("non trovo la tessera");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < NOMI.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = NOMI[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 8 && !P.__t; k++) { await W.dorme(300); if (P.__t) break; var b0 = qa(P, ".schermata .piede button").filter(function (y) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(y.textContent) && !y.disabled; })[0]; if (b0) b0.click(); }
    if (!await W.aspetta(function () { if (q(P, ".st-stadio .sa-pers")) return true; W.clicca(P, /Comincia l'asta/); return false; }, 8000)) no("non arrivo allo stadio");
    var fino = Date.now() + 240000;
    while (Date.now() < fino && !q(P, ".sc-merc") && !q(P, ".st-rivela")) {
      if (q(P, ".st-stadio .sa-pers") && !q(P, ".sa-aggiudicato")) {
        var pg = qa(P, ".sa-pers.guida")[0], capo = pg && pg.querySelector("b") ? pg.querySelector("b").textContent : null;
        if (!capo) { var pu = q(P, ".sa-pers.puo"); if (pu) pu.click(); }
        else qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== capo && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); });
      }
      await W.dorme(250);
    }
    if (!q(P, ".sc-merc")) no("dopo l'asta non arriva la schermata degli scambi");
    var righe = qa(P, ".sc-riga"); if (righe.length !== 3) no("nella lista non ci sono le 3 rose");
    var primaG = righe[1].querySelector("small").textContent;
    righe[0].click(); await W.dorme(200); qa(P, ".sc-riga")[1].click(); await W.dorme(300);
    if (!q(P, ".sc-tavolo")) no("toccate due rose, il tavolo non si apre");
    var cols = qa(P, ".sc-col"), cA = [].slice.call(cols[0].querySelectorAll(".sc-carta")).filter(function (b) { return /CEN/.test(b.textContent); })[0], cB = [].slice.call(cols[1].querySelectorAll(".sc-carta")).filter(function (b) { return /CEN/.test(b.textContent); })[0];
    var nA = cA.querySelector(".sc-nome").textContent, nB = cB.querySelector(".sc-nome").textContent;
    cA.click(); await W.dorme(200);
    var cB2 = [].slice.call(qa(P, ".sc-col")[1].querySelectorAll(".sc-carta")).filter(function (b) { return b.querySelector(".sc-nome").textContent === nB; })[0]; cB2.click(); await W.dorme(200);
    var ok = q(P, ".sc-ok"); if (!ok || ok.disabled) no("«✅ Scambiate» spento con lo scambio giusto");
    ok.click();
    if (!await W.aspetta(function () { var a = q(P, ".sc-annuncio"); return a && a.textContent.indexOf(nA) >= 0 && a.textContent.indexOf(nB) >= 0; }, 3000)) no("niente annuncio dello scambio");
    if (!await W.aspetta(function () { return qa(P, ".sc-riga").length === 3; }, 3000)) no("dopo lo scambio non si torna alla lista");
    var dopoG = qa(P, ".sc-riga")[1].querySelector("small").textContent;
    if (dopoG.indexOf(nA) < 0 || dopoG === primaG) no("la rosa di Giulia non cambia: «" + dopoG + "»");
    x.push("scambio sullo stesso telefono: " + nA + " ⇄ " + nB);
    W.clicca(P, /Fine scambi/);
    if (!await W.aspetta(function () { return q(P, ".st-rivela"); }, 6000)) no("«Fine scambi ▶» non porta alla classifica delle rose");
    x.push("«Fine scambi ▶» → classifica delle rose");
    return x.join(" · ");
  } });
})();

// gr1 (13 nov 2026, gli amici del proprietario: «quando fai gioca ancora le partite si ripetono… l'Atalanta gioca sempre contro la Roma»)
//     Online in 2: due partite di fila con la Rivincita; le partite della giornata della seconda devono essere sorteggiate da capo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  async function astaFino(P, C) {
    var fino = Date.now() + 240000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[v.sessione + "|" + a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(200); continue; }
      visti[v.sessione + "|" + a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("l'asta non finisce");
  }
  function coppie(F) { return ((F.serieA || {}).partite || []).map(function (p) { return [p.c, p.f].sort().join("-"); }); }
  COPIONE.aggiungi("gr1", { nome: "Mini Asta Fantacalcio online in 2: con la Rivincita la giornata si sorteggia da capo (mai le stesse partite) e i colori restano quelli", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "fanta" }; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    await W.apriTel("Giulia", { hash: "gioco=astafanta&stanza=" + C, x: 200 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 15000)) no("Giulia non entra");
    var giri = [], x = [], colori = [];
    for (var g = 0; g < 3; g++) {
      if (g) { P.__t.onRivincita(); if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 8000)) no("la Rivincita non porta in saletta"); await W.dorme(600); }
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita " + (g + 1) + " non comincia");
      await astaFino(P, C);
      var cp = coppie(vm(C)); if (cp.length !== 10) no("la giornata " + (g + 1) + " non ha 10 partite");
      giri.push(cp);
      // (13 nov 2026, il proprietario: a ogni «Gioca ancora» lo stesso colore dei miei giocatori) i colori dei quadretti nella giornata
      await W.dorme(800); W.clicca(P, /Salta/);
      if (!await W.aspetta(function () { return qa(P, ".st-gio-riga").length === 2; }, 15000)) no("la giornata " + (g + 1) + " non parte");
      var col = {}; qa(P, ".st-gio-riga").forEach(function (r) { col[r.querySelector(".st-gio-nome").textContent] = r.style.getPropertyValue("--pc"); });
      colori.push(col);
    }
    for (var i = 1; i < giri.length; i++) {
      var uguali = giri[i].filter(function (k) { return giri[i - 1].indexOf(k) >= 0; }).length;
      x.push("partita " + (i + 1) + ": " + uguali + " partite uguali alla precedente");
      if (uguali > 3) no("con la Rivincita la giornata si ripete: " + uguali + " partite su 10 uguali (" + giri[i].slice(0, 4).join(", ") + "…)");
    }
    for (var j = 1; j < colori.length; j++) ["Paky", "Giulia"].forEach(function (n) { if (!colori[j][n] || colori[j][n] !== colori[0][n]) no("il colore di " + n + " cambia da una partita all'altra: " + colori[0][n] + " → " + colori[j][n]); });
    x.push("colori uguali in tutte e 3 le partite (Paky " + colori[0].Paky + ", Giulia " + colori[0].Giulia + ")");
    return x.join(" · ");
  } });
})();
