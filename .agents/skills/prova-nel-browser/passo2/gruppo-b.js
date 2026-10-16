// PROVE DEL PASSO 2 — giochi del gruppo B (posti contati): Scalinata, Palla Matta, Ruota, Scopa 2 vs 2, Pendolo, Horto.
// Scenari 211-216 (uno per gioco), telefoni con salaSempre: true. Si caricano dopo il copione:
//   const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
//   await COPIONE.carica("passo2/gruppo-b.js"); await COPIONE.prova(211)
// Cosa provano (riscritti da p2-z dopo p2-f e p2-h: «Chi gioca?» vero del core, fine del core):
// - il gioco si lancia dalla Sala e gli amici ci arrivano da soli;
// - con più amici dei posti l.host sceglie in «Chi gioca a …?» (scegliChi): si siedono solo gli scelti, gli altri
//   leggono "👀 Questa volta guardi" nella saletta e non hanno "Sono pronto"; con posti per tutti niente «Chi gioca?»;
// - la fine partita è quella del core («↻ Rivincita», «🎮 Cambia gioco», «👍 Ci sto!»).
// In fondo 217 (Rivincita col 3-2-1 nella Scalinata) e 218 (Ruota con 6: «Chi gioca?»).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T, dentro = A.dentro;

  // "Chi gioca?" a mano: sul telefono dell'host le regole del gioco `gid` portano scelti = [{ id, nome }] (presi dalla
  // Sala al momento del lancio). Si fa avvolgendo SG.registra del telefono prima che i giochi si registrino.
  var sceltiPer = {};   // gid -> function () { return [{ id, nome }] }
  if (!W.__preparaGruppoB) {
    W.__preparaGruppoB = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__preparaGruppoB(w, nome, opz);
      if (!opz || !opz.conScelti) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id) {
            var imp0 = g.impostazioni;
            g.impostazioni = function (box, dove, aiuti) {
              if (imp0) imp0.apply(this, arguments);
              var f = sceltiPer[g.id]; if (aiuti && aiuti.sala && f) dove.scelti = f();
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // la Sala con questi amici (il primo è l'host): restituisce il codice della Sala
  async function salaCon(nomi) {
    sceltiPer = {};
    await W.apriTel(nomi[0], { x: 0, salaSempre: true, conScelti: true });
    var S = await A.apriSala(nomi[0]);
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "sala=" + S, x: 185 * i, salaSempre: true });
    if (!await W.aspetta(function () { return (vm(S).membri || []).length === nomi.length; }, 10000)) no("nella Sala non sono entrati in " + nomi.length + " (" + (vm(S).membri || []).length + ")");
    return S;
  }
  // (p2-z, 15 ott) dopo p2-h "Chi gioca?" è quello vero del core: con più amici dei posti l'host sceglie dalla schermata
  // «Chi gioca a …?» (qui: scegliChi), con meno posti liberi per tutti. La fine è quella del core («↻ Rivincita»).
  function scegli() {}   // (il "Chi gioca?" a mano non serve più: resta per chi riprova a mano il contratto neutro)
  // in «Chi gioca?» restano scelti esattamente questi nomi (prima si tolgono gli altri, poi si aggiungono i mancanti)
  function scegliChi(w, nomi) {
    var ora = A.chiGioca(w) || [];
    ora.forEach(function (n) { if (nomi.indexOf(n) < 0 && n !== "Paky") A.toccaChi(w, n); });
    nomi.forEach(function (n) { if ((A.chiGioca(w) || []).indexOf(n) < 0) A.toccaChi(w, n); });
    var fin = (A.chiGioca(w) || []).slice().sort().join(",");
    if (fin !== nomi.slice().sort().join(",")) no("in «Chi gioca?» non riesco a scegliere " + nomi.join(", ") + " (scelti: " + fin + ")");
  }
  // l'host lancia il gioco dalla Sala (con «Chi gioca?» se serve): restituisce il codice della stanza del gioco
  async function lancia(S, host, nomeGioco, gid, nomi) {
    var w = W.finestra(host);
    if (!await W.aspetta(function () { return W.clicca(w, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("nella Sala non c'è «Scegli un gioco»");
    var tess = await W.aspetta(function () { return A.tessera(w, nomeGioco); }, 4000);
    if (!tess) no("non trovo " + nomeGioco + " tra i giochi della Sala");
    tess.click();
    var dove = await W.aspetta(function () { return w.document.querySelector(".chi-gioca") ? "chi" : (w.document.querySelector(".saletta-schermo") && A.codiceSaletta(w) ? "saletta" : null); }, 5000);
    if (nomi && dove !== "chi") no("siamo più dei posti ma non si apre «Chi gioca a " + nomeGioco + "?» («" + T(w).slice(0, 80) + "»)");
    if (!nomi && dove === "chi") no("ci sono posti per tutti ma si apre «Chi gioca?»");
    if (dove === "chi") { scegliChi(w, nomi); if (!W.clicca(w, /Si gioca/, ".piede button")) no("in «Chi gioca?» non c'è «▶ Si gioca»"); }
    var C = await W.aspetta(function () { var c = A.codiceSaletta(w); return c && c !== S && vm(S).gioco === gid ? c : null; }, 6000);
    if (!C) no("toccato " + nomeGioco + ", l'host non è nella sua saletta («" + T(w).slice(0, 80) + "»)");
    return C;
  }
  // la saletta di chi guarda: titolo "👀 Questa volta guardi" e niente "Sono pronto"
  async function guardaInSaletta(nome) {
    var w = W.finestra(nome);
    var ok = await W.aspetta(function () { return w.document.querySelector(".saletta-schermo") && /Questa volta guardi/.test(W.testo(w)); }, 8000);
    if (!ok) no(nome + " non legge «👀 Questa volta guardi» nella saletta («" + T(w).slice(0, 90) + "»)");
    if (/Sono pronto/.test(W.testo(w))) no(nome + " (che guarda) ha «Sono pronto»");
    if (dentro(w)) no(nome + " (che guarda) legge «Sei dentro»");
    return true;
  }
  function tasti(w) { return [].map.call(w.document.querySelectorAll("button"), function (b) { return b.textContent.replace(/\s+/g, " ").trim(); }).filter(Boolean); }
  // la fine del core: l'host ha «↻ Rivincita» e «🎮 Cambia gioco» nel piede (niente tasti di sempre del gioco)
  async function fineCore(w, vecchi) {
    if (!await W.aspetta(function () { var b = w.document.querySelector(".fine-tasti"); return b && /Rivincita/.test(b.textContent); }, 8000)) no("a fine partita l'host non ha «↻ Rivincita» del core («" + tasti(w).join(" | ").slice(-160) + "»)");
    var tx = A.tastiFineDi(w).join(" | ");
    if (!/Cambia gioco/.test(tx)) no("a fine partita l'host non ha «🎮 Cambia gioco» (" + tx + ")");
    if (vecchi && tasti(w).some(function (t) { return vecchi.test(t); })) no("a fine partita ci sono ancora i tasti di sempre del gioco (" + tasti(w).join(" | ") + ")");
    return tx;
  }
  // «↻ Rivincita»: si riparte (col 3-2-1 quando ci sono tutti); poi chi guarda deve guardare ancora
  async function rivincita(w, C, partita) {
    W.clicca(w, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return partita(vm(C), W.statoStanza(C) || {}); }, 15000)) no("dopo «↻ Rivincita» la partita non riparte");
  }

  // 211. Scalinata nella Sala con 5: con la scala grande (dal ramo miglioramenti) salgono tutti e 5, niente «Chi gioca?»
  //      né Bot, numeri da 1 a 5; partita intera, fine del core e Rivincita con tutti. («Chi gioca?» con chi guarda: sc1, «Piccola»)
  COPIONE.aggiungi(211, { nome: "Scalinata dalla Sala in 5: tutti sulla scala grande (niente Chi gioca); partita intera; fine del core e Rivincita", fai: async function () {
    var S = await salaCon(["Paky", "Giulia", "Luca", "Marco", "Bea"]);
    var C = await lancia(S, "Paky", "La Scalinata", "scalinata", null);
    if (!await W.aspetta(function () { return A.ids(C).length === 5; }, 10000)) no("sulla scala non ci sono tutti e 5 (posti " + A.ids(C).join(",") + " · guarda " + A.ids(C, "guarda").join(",") + ")");
    var P = W.finestra("Paky");
    if (!await W.aspetta(function () { return W.clicca(P, /^\s*(▶\s*)?Comincia/); }, 6000)) no("l'host non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 8000)) no("la partita non comincia");
    if (vm(C).posti.some(function (p) { return p.bot; })) no("c'è un bot anche se ci sono tutti e 5");
    if ((vm(C).sc || []).join() !== "1,2,3,4,5") no("i numeri sono " + JSON.stringify(vm(C).sc));
    if (!await A.scalinataFinoAllaFine(C, ["Giulia", "Luca", "Marco", "Bea"], "Paky")) no("la Scalinata non è finita");
    var tx = await fineCore(P, /Nuova partita/);
    ["Giulia", "Luca", "Marco", "Bea"].forEach(function (n) { W.clicca(W.finestra(n), /Ci sto/); });
    await rivincita(P, C, function (v) { return v.fase === "scelta" || v.fase === "lobby"; });
    await W.dorme(400);
    if (A.ids(C).length !== 5) no("alla rivincita sulla scala non sono in 5 (" + A.ids(C).join(",") + ")");
    return "Sala " + S + ": tutti e 5 sulla scala grande (1-5, niente Bot), partita intera, rivincita in 5; fine del core: " + tx;
  } });

  // 212. Palla Matta nella Sala con 5 (4 posti): giocano Paky, Giulia, Marco e Bea, Luca guarda il tavolo
  COPIONE.aggiungi(212, { nome: "Palla Matta dalla Sala: Chi gioca (4 su 5), Luca guarda il tavolo; fine del core", fai: async function () {
    var S = await salaCon(["Paky", "Giulia", "Luca", "Marco", "Bea"]);
    var C = await lancia(S, "Paky", "Palla Matta", "pallamatta", ["Paky", "Giulia", "Marco", "Bea"]);
    var idL = A.idInSala(S, "Luca");
    if (!await W.aspetta(function () { return A.ids(C, "players").length === 4 && (vm(C).guarda || []).some(function (g) { return g.id === idL; }); }, 10000))
      no("non giocano in 4 con Luca a guardare (giocano " + A.ids(C, "players").join(",") + ")");
    await guardaInSaletta("Luca");
    var P = W.finestra("Paky");
    if (!await W.aspetta(function () { return W.clicca(P, /^\s*(▶\s*)?Comincia/); }, 6000)) no("l'host non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    var L = W.finestra("Luca");
    if (!await W.aspetta(function () { return L.document.querySelector(".pm-scena canvas"); }, 6000)) no("Luca non vede il tavolo («" + T(L).slice(0, 80) + "»)");
    if (A.ids(C, "players").indexOf(idL) >= 0) no("Luca è tra i giocatori");
    // fine veloce: gli altri se ne vanno, l'host resta solo → "🏁 Finisci ora"
    W.spegni("Giulia"); W.spegni("Marco"); W.spegni("Bea");
    var fin = await W.aspetta(function () { return W.clicca(P, /Finisci ora/); }, 40000);
    if (!fin) no("andati via gli altri, l'host non ha «Finisci ora»");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non finisce");
    var tx = await fineCore(P, /Altra partita/);
    await W.dorme(1500); if (/Ci sto/.test(W.testo(L))) no("Luca (ha guardato) ha «Ci sto»");
    if (!await W.aspetta(function () { return /Palline finite|Partita chiusa|Hai vinto|Vince|Pareggio|Fine partita/.test(W.testo(L)); }, 6000)) no("Luca non vede la classifica («" + T(L).slice(0, 80) + "»)");
    return "giocano Paky, Giulia, Marco e Bea; Luca guarda il tavolo e la classifica; fine del core: " + tx;
  } });

  // 213. Ruota nella Sala con 5 (4 posti): alla ruota i 4 scelti, Luca guarda; niente posti per i bot
  COPIONE.aggiungi(213, { nome: "Ruota dalla Sala: Chi gioca (4 su 5), Luca guarda lo studio; niente bot", fai: async function () {
    var S = await salaCon(["Paky", "Giulia", "Luca", "Marco", "Bea"]);
    var C = await lancia(S, "Paky", "La Ruota della Fortuna", "ruota", ["Paky", "Giulia", "Marco", "Bea"]);
    var idL = A.idInSala(S, "Luca");
    if (!await W.aspetta(function () { return A.ids(C, "giocatori").length === 4 && (vm(C).guarda || []).some(function (g) { return g.id === idL; }); }, 10000))
      no("alla ruota non sono in 4 con Luca a guardare (" + A.ids(C, "giocatori").join(",") + ")");
    await guardaInSaletta("Luca");
    var P = W.finestra("Paky");
    var piu = [].find.call(P.document.querySelectorAll(".ru-bot-riga button"), function (b) { return b.textContent === "+"; });
    if (piu && !piu.disabled) no("con 4 alla ruota si può ancora aggiungere un bot");
    if (!await W.aspetta(function () { return W.clicca(P, /^\s*(▶\s*)?Comincia/); }, 6000)) no("l'host non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).giocoFase === "gioco"; }, 8000)) no("la partita non comincia");
    if (A.ids(C, "giocatori").indexOf(idL) >= 0) no("Luca è alla ruota");
    var L = W.finestra("Luca");
    if (!await W.aspetta(function () { return L.document.querySelector(".ru-sopra, canvas"); }, 8000)) no("Luca non vede lo studio («" + T(L).slice(0, 80) + "»)");
    return "alla ruota Paky, Giulia, Marco e Bea (nessun bot), Luca guarda lo studio";
  } });

  // 214. Scopa 2 vs 2 nella Sala con 5 (4 posti): al tavolo i 4 scelti, Luca guarda
  COPIONE.aggiungi(214, { nome: "Scopa 2 vs 2 dalla Sala: Chi gioca (4 su 5), Luca guarda; niente bot", fai: async function () {
    var S = await salaCon(["Paky", "Giulia", "Luca", "Marco", "Bea"]);
    var C = await lancia(S, "Paky", "Scopa 2 vs 2", "scopa2v2", ["Paky", "Giulia", "Marco", "Bea"]);
    var idG = A.idInSala(S, "Giulia"), idL = A.idInSala(S, "Luca");
    var lob = function () { return W.statoStanza(C) || {}; };
    if (!await W.aspetta(function () { var l = lob(); return l.t === "lobby" && (l.seggi || []).some(function (g) { return g && g.id === idG; }) && (l.guarda || []).some(function (g) { return g.id === idL; }); }, 10000))
      no("al tavolo non c'è Giulia con Luca a guardare (" + JSON.stringify(lob()).slice(0, 120) + ")");
    if ((lob().seggi || []).some(function (g) { return g && g.id === idL; })) no("Luca si è seduto");
    await guardaInSaletta("Luca");
    var P = W.finestra("Paky");
    if (!await W.aspetta(function () { return W.clicca(P, /^\s*(▶\s*)?Comincia/); }, 6000)) no("l'host non ha «Comincia»");
    var L = W.finestra("Luca");
    if (!await W.aspetta(function () { return /Questa volta guardi/.test(W.testo(L)) && !L.document.querySelector(".saletta-schermo"); }, 8000)) no("a partita cominciata Luca non legge «Questa volta guardi» («" + T(L).slice(0, 80) + "»)");
    var G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return G.document.querySelector(".sc-mensola"); }, 8000)) no("Giulia non è al tavolo («" + T(G).slice(0, 80) + "»)");
    return "al tavolo Paky, Giulia, Marco e Bea; Luca guarda (saletta e partita)";
  } });

  // 215. Pendolo nella Sala con 5 (4 posti): lancia Paky, sulla trave Giulia, Marco e Bea; Luca guarda e non lancia
  COPIONE.aggiungi(215, { nome: "Pendolo dalla Sala: Chi gioca (4 su 5), Luca guarda e non lancia; partita intera; fine del core", fai: async function () {
    var S = await salaCon(["Paky", "Giulia", "Luca", "Marco", "Bea"]);
    var C = await lancia(S, "Paky", "Palla a Pendolo", "pendolo", ["Paky", "Giulia", "Marco", "Bea"]);
    var idG = A.idInSala(S, "Giulia"), idL = A.idInSala(S, "Luca");
    var lob = function () { return W.statoStanza(C) || {}; };
    if (!await W.aspetta(function () { var l = lob(); return l.t === "lobby" && (l.seggi || []).some(function (g) { return g && g.id === idG; }) && (l.fuori || []).indexOf(idL) >= 0; }, 10000))
      no("Giulia non è sulla trave con Luca fuori (" + JSON.stringify(lob()).slice(0, 140) + ")");
    await guardaInSaletta("Luca");
    var L = W.finestra("Luca");
    W.clicca(L, /Lancio io/, ".modo-chip"); await W.dorme(600);
    if (lob().lanc === idL) no("Luca (che guarda) ha preso il posto di chi lancia");
    var P = W.finestra("Paky");
    if (!await W.aspetta(function () { return W.clicca(P, /^\s*(▶\s*)?Comincia/); }, 6000)) no("l'host non ha «Comincia»");
    if (!await W.aspetta(function () { return P.document.querySelector(".fine-tasti"); }, 90000, 300)) no("la partita del Pendolo non è finita («" + T(P).slice(0, 80) + "»)");
    var tx = await fineCore(P, /Rigioca/);
    await W.dorme(1500); if (/Ci sto/.test(W.testo(L))) no("Luca (ha guardato) ha «Ci sto»");
    if (!await W.aspetta(function () { return /Partita finita|Fine partita/.test(W.testo(L)); }, 8000)) no("Luca non vede la fine («" + T(L).slice(0, 80) + "»)");
    if (/Alla prossima giochi anche tu/.test(W.testo(L))) no("a Luca (non scelto) si dice «Alla prossima giochi anche tu»");
    return "lancia Paky, sulla trave Giulia, Marco e Bea, Luca guarda; fine del core: " + tx;
  } });

  // 216. Horto nella Sala con 3 (8 posti): niente «Chi gioca?», corrono tutti e tre (più i bot); fine del core e Rivincita
  COPIONE.aggiungi(216, { nome: "Horto dalla Sala con 3: posti per tutti (niente Chi gioca), corsa intera; fine del core e Rivincita", fai: async function () {
    var S = await salaCon(["Paky", "Giulia", "Luca"]);
    var C = await lancia(S, "Paky", "Horto Muso", "horto", null);
    var idG = A.idInSala(S, "Giulia"), idL = A.idInSala(S, "Luca");
    var lob = function () { return W.statoStanza(C) || {}; };
    if (!await W.aspetta(function () { var l = lob(); return l.t === "lobby" && [idG, idL].every(function (id) { return (l.seggi || []).some(function (g) { return g && g.id === id; }); }); }, 10000))
      no("Giulia e Luca non hanno il loro cavallo (" + JSON.stringify(lob()).slice(0, 140) + ")");
    var P = W.finestra("Paky");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia la corsa|^\s*(▶\s*)?Comincia/); }, 6000)) no("l'host non ha «Comincia la corsa»");
    if (!await W.aspetta(function () { return P.document.querySelector(".fine-tasti"); }, 90000, 300)) no("la corsa non è finita («" + T(P).slice(0, 80) + "»)");
    var tx = await fineCore(P, /Saletta|Rigioca/);
    var L = W.finestra("Luca");
    if (!await W.aspetta(function () { return /Ci sto/.test(W.testo(L)); }, 8000)) no("Luca (ha corso) non ha «👍 Ci sto!» («" + T(L).slice(0, 80) + "»)");
    W.clicca(L, /Ci sto/); W.clicca(W.finestra("Giulia"), /Ci sto/);
    var tFine = (W.statoStanza(C) || {}).t;   // (la foto di Horto: t = "lobby", "via" (la corsa)…)
    await rivincita(P, C, function (v, st) { return !!st.t && st.t !== tFine; });
    return "corrono Paky, Giulia e Luca (più i bot), fine del core: " + tx + "; Rivincita riparte";
  } });

  // ===== DOPO p2-f / p2-h (le fa girare p2-z) =====
  // 217. Rivincita col 3-2-1 nella Scalinata della Sala: alla fine Paky "↻ Rivincita", gli altri "👍 Ci sto!"
  COPIONE.aggiungi(217, { nome: "(dopo p2-f) Scalinata: Rivincita col 3-2-1 e Cambia gioco", fai: async function () {
    var S = await salaCon(["Paky", "Giulia", "Luca"]);
    var C = await lancia(S, "Paky", "La Scalinata", "scalinata");
    if (!await W.aspetta(function () { return A.ids(C).length === 3; }, 10000)) no("sulla scala non sono in 3");
    var P = W.finestra("Paky");
    W.clicca(P, /^\s*(▶\s*)?Comincia/);
    if (!await A.scalinataFinoAllaFine(C, ["Giulia", "Luca"], "Paky")) no("la Scalinata non è finita");
    await W.dorme(600);
    if (!/Rivincita/.test(tasti(P).join(" "))) return "da fare dopo p2-f (oggi alla fine: " + tasti(P).join(" | ") + ")";
    var G = W.finestra("Giulia"), L = W.finestra("Luca");
    if (!W.clicca(G, /Ci sto/)) no("Giulia non ha «Ci sto!»");
    W.clicca(L, /Ci sto/);
    W.clicca(P, /Rivincita/);
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 15000)) no("la Rivincita non riparte da sola col 3-2-1");
    return "Rivincita col 3-2-1 senza altri tocchi";
  } });
  // 218. Ruota con 6 nella Sala: "Chi gioca alla Ruota?" con l'host dentro, i 2 non scelti guardano (scenario 53 di p2-h)
  COPIONE.aggiungi(218, { nome: "(dopo p2-h) Ruota con 6: solo i 4 scelti giocano", fai: async function () {
    var S = await salaCon(["Paky", "Giulia", "Luca", "Marco", "Bea", "Ugo"]);
    var w = W.finestra("Paky");
    W.clicca(w, /Scegli (un|il primo) gioco|Prossimo gioco/);
    var tess = await W.aspetta(function () { return A.tessera(w, "La Ruota della Fortuna"); }, 4000); if (!tess) no("non trovo la Ruota");
    tess.click(); await W.dorme(500);
    if (!/Chi gioca/.test(W.testo(w))) return "da fare dopo p2-h (non c'è «Chi gioca alla Ruota?»)";
    if (!W.clicca(w, /Si gioca/)) no("non c'è «Si gioca»");
    var C = await W.aspetta(function () { var c = A.codiceSaletta(w); return c && c !== S && vm(S).gioco === "ruota" ? c : null; }, 6000);
    if (!C) no("la Ruota non parte");
    if (!await W.aspetta(function () { return A.ids(C, "giocatori").length === 4 && (vm(C).guarda || []).length === 2; }, 10000)) no("non giocano in 4 con 2 a guardare");
    return "giocano i 4 scelti, 2 guardano";
  } });
})();
