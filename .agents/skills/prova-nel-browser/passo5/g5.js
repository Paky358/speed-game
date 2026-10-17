// PROVE DEL PASSO 5, GRUPPO 5 (minigiochi in tempo reale che riprendono): Palla Matta, Gara di pesca, Horto Muso, Palla a Pendolo.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo5/g5.js"); await COPIONE.prova(570)      (oppure await COPIONE.gruppo5g5(): 570-573 in fila)
// Tutte col percorso di prima (stanza di un gioco solo: i telefoni finti partono con sg-sala-sempre = "0") e l'aiuto
// comune provaRipresa: l'host ricarica la pagina, la stanza si riapre con lo stesso codice, la foto nuova dice _r, nessuno
// passa dalla saletta, gli amici leggono «🔁 Paky è tornato: la partita riprende da dove era».
// 570 Palla Matta: ricarica dell'host dopo due tiri → stesso livello, stessi pioli, punti, palline e turno; poi ricarica col
//     tiro in volo → il tiro non vale (punti e palline di prima), tocca di nuovo a chi tirava; si gioca fino alla fine e
//     ricaricando sulla classifica niente esito doppio.
// 571 Gara di pesca: ricarica dell'host a metà gara → stessi chili e pesci, si riprende col tempo che restava + 5 s, un
//     pesce già contato e rimandato non conta due volte, uno nuovo sì; la gara finisce da sola.
// 572 Horto Muso: ricarica dell'host a metà corsa → stessi iscritti e posti, «🔁 Si riparte dai cancelletti» e la corsa
//     ricomincia (3-2-1 lungo); si arriva in fondo; ricaricando sulla classifica la classifica resta, niente esito doppio.
// 573 Palla a Pendolo: ricarica dell'host a metà manche → stessi ruoli, «🔁 Si riparte da capo» su tutti i telefoni e dopo
//     5 secondi la manche ricomincia; si arriva alla fine; ricaricando sulla schermata finale resta quella, niente esito doppio.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  function vm(c) { return A.vm(c); }
  function ripresaDi(nome) { try { return JSON.parse(W.BR.mem[nome].l["sg-ripresa"] || "null"); } catch (e) { return null; } }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  // ricarica l'host sulla fine: stessa fine, nessun esito di nuovo, nessuno in saletta
  async function ricaricaSullaFine(C, amici, eFine, msg) {
    var e1 = A.contaStoria(C, '"__esito"'), s0 = (W.statoStanza(C) || {})._s;
    await W.dorme(900);
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._s && s._s !== s0 && s._r && eFine(vm(C)); }, 10000)) no(msg + ": ricaricando sulla fine la fine non torna (" + JSON.stringify(vm(C)).slice(0, 100) + ")");
    await W.dorme(2500);
    if (A.contaStoria(C, '"__esito"') !== e1) no(msg + ": ricaricando sulla fine l'esito è arrivato di nuovo");
    amici.forEach(function (n) { if (W.finestra(n).document.querySelector(".saletta-schermo")) no(msg + ": " + n + " è tornato in saletta"); });
    if (W.finestra("Paky").document.querySelector(".saletta-schermo")) no(msg + ": l'host è in saletta");
  }

  // =================== 570 PALLA MATTA ===================
  function chiTira(v) { var p = (v.players || [])[v.turno]; return p ? (p.id === "host" ? "Paky" : "Giulia") : null; }
  function tavoloPM(v) { return JSON.stringify({ lv: v.lv, via: v.via, tipi: v.tipi && v.tipi.replace(/v/g, "b"), turno: v.turno, seq: v.seq, p: (v.players || []).map(function (p) { return [p.id, p.punti, p.palline]; }) }); }
  async function tiroPM(C) {   // tira chi deve tirare (il suo telefono), e aspetta il turno dopo (o la fine)
    var v = vm(C), seq = v.seq, w = W.finestra(chiTira(v));
    if (!await W.aspetta(function () { var P = w.__PMpartita; return P && P.st().fase === "mira"; }, 8000)) no("chi deve tirare (" + chiTira(v) + ") non può mirare");
    w.__PMpartita.tira();
    if (!await W.aspetta(function () { var x = vm(C); return x.seq !== seq || x.fase === "fine"; }, 40000)) no("il tiro non finisce (seq " + seq + ")");
  }
  aggiungi(570, { nome: "Palla Matta: l'host ricarica tra due tiri e col tiro in volo → stesso tavolo, il tiro in volo si rifà", fai: async function () {
    var r = await A.provaRipresa({ gioco: "pallamatta", nomeTessera: "Palla Matta", amici: ["Giulia"], fase: "gioco",
      arriva: function (v) { return (v.players || []).filter(function (p) { return !p.via; }).length >= 2; },
      prepara: async function (C) { await tiroPM(C); await tiroPM(C); if (vm(C).fase !== "gioco") no("dopo due tiri la partita è già finita"); },
      controlla: function (a, b) { return tavoloPM(a) === tavoloPM(b) ? true : "il tavolo era " + tavoloPM(a) + " e ora è " + tavoloPM(b); } });
    var C = r.C, note = ["ripresa tra due tiri in " + r.dt + " s, stesso tavolo (" + r.prima.players.map(function (p) { return p.nome + " " + p.punti; }).join(", ") + ")"];
    if (!ripresaDi("Paky")) no("dopo la ripresa la partita non è più in «sg-ripresa»");
    // il tiro in volo: parte e l'host ricarica subito
    await W.dorme(700);
    var prima = vm(C), chi = chiTira(prima), w = W.finestra(chi);
    if (!await W.aspetta(function () { var P = w.__PMpartita; return P && P.st().fase === "mira"; }, 8000)) no("dopo la ripresa " + chi + " non può mirare");
    var s0 = (W.statoStanza(C) || {})._s;
    w.__PMpartita.tira();
    await W.dorme(chi === "Paky" ? 250 : 600);
    if (!await W.aspetta(function () { var P = W.finestra("Paky").__PMpartita; return P && P.st().fase === "volo"; }, 3000)) no("il tiro di " + chi + " non parte sul telefono dell'host");
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}, v = vm(C); return s._s && s._s !== s0 && s._r && v.fase === "gioco" && v.rip >= 2; }, 10000)) no("col tiro in volo la partita non riprende (" + JSON.stringify(vm(C)).slice(0, 120) + ")");
    var dopo = vm(C);
    if (tavoloPM(dopo) !== tavoloPM(prima)) no("col tiro in volo il tavolo era " + tavoloPM(prima) + " e ora è " + tavoloPM(dopo));
    if (chiTira(dopo) !== chi) no("dopo il tiro annullato tocca a " + chiTira(dopo) + " invece che a " + chi);
    var G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return /Si riprende|Partita ripresa/.test(T(G)) || /Si riprende|Partita ripresa/.test(T(W.finestra("Paky"))); }, 5000)) no("nessuno legge «🔁 Si riprende»");
    note.push("tiro di " + chi + " in volo annullato: stessi punti e palline, tira di nuovo " + chi);
    // si gioca fino alla fine
    var fino = Date.now() + 300000;
    while (vm(C).fase === "gioco" && Date.now() < fino) await tiroPM(C);
    if (vm(C).fase !== "fine") no("la partita non finisce");
    if (!await W.aspetta(function () { return /Rivincita|Altra partita|Nuova partita/.test(T(W.finestra("Paky"))); }, 15000)) no("l'host non vede la classifica");
    var cl = JSON.stringify(vm(C).classifica);
    await ricaricaSullaFine(C, ["Giulia"], function (v) { return v.fase === "fine" && JSON.stringify(v.classifica) === cl; }, "Palla Matta");
    if (!await W.aspetta(function () { return /Rivincita|Altra partita|Nuova partita/.test(T(W.finestra("Paky"))); }, 8000)) no("ricaricando sulla classifica l'host non la rivede");
    errori();
    return note.join("; ") + "; partita finita, ricaricando sulla classifica la classifica resta (un esito solo)";
  } });

  // =================== 571 GARA DI PESCA ===================
  function pesci(v) { return (v.players || []).map(function (p) { return p.id + ":" + p.n + ":" + p.kg; }).join(","); }
  aggiungi(571, { nome: "Gara di pesca: l'host ricarica a metà gara → stessi chili, tempo che restava + 5 s, nessun pesce doppio", fai: async function () {
    var k1 = "prova-g-1", k2 = "prova-l-1";
    var r = await A.provaRipresa({ gioco: "garapesca", amici: ["Giulia", "Luca"], fase: "gioco",
      apri: async function (P) {
        var gia = await W.aspetta(function () { return /apro io/.test(T(P)); }, 5000);
        if (!gia) no("non trovo «apro io» della Gara di pesca");
        W.clicca(P, /apro io/); await W.dorme(250);
        if (!W.clicca(P, /^1 min$/, ".modo-chip")) no("nelle regole non trovo «1 min»");
        if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
        var C = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 5000);
        if (!C) no("la stanza non ha il codice"); return C;
      },
      prepara: async function (C) {
        await W.dorme(1500);
        W.reteDi("Giulia").invia({ t: "preso", id: "carpa", cm: 50, k: k1 });
        W.reteDi("Luca").invia({ t: "preso", id: "alborella", cm: 12, k: k2 });
        if (!await W.aspetta(function () { return (vm(C).players || []).filter(function (p) { return p.n > 0; }).length === 2; }, 4000)) no("i pesci di Giulia e Luca non arrivano (" + pesci(vm(C)) + ")");
      },
      controlla: function (a, b) { return pesci(a) === pesci(b) && a.gara === b.gara ? true : "i pesci erano " + pesci(a) + " e ora " + pesci(b); } });
    var C = r.C, prima = r.prima, dopo = vm(C), passati = +r.dt * 1000, note = "";
    // il tempo: quello che restava (meno il tempo della ricarica) più 5 secondi
    var atteso = prima.resta - passati + 5000;
    if (Math.abs(dopo.resta - atteso) > 4000) no("dopo la ripresa restano " + dopo.resta + " ms invece di circa " + Math.round(atteso));
    // lo stesso pesce rimandato non conta due volte, uno nuovo sì
    W.reteDi("Giulia").invia({ t: "preso", id: "carpa", cm: 50, k: k1 });
    await W.dorme(800);
    var g = function () { return (vm(C).players || []).filter(function (p) { return p.id === A.mioId("Giulia"); })[0] || {}; };
    if (g().n !== 1) no("il pesce di Giulia rimandato dopo la ripresa conta due volte (" + g().n + ")");
    W.reteDi("Giulia").invia({ t: "preso", id: "carpa", cm: 40, k: "prova-g-2" });
    if (!await W.aspetta(function () { return g().n === 2; }, 4000)) no("dopo la ripresa il pesce nuovo di Giulia non conta");
    if (!/🔁 Gara ripresa/.test(JSON.stringify((W.statoStanza(C) || {}).vm || {})) && !/Gara ripresa/.test(T(W.finestra("Giulia")))) note = " (avviso non visto)";
    // la gara finisce da sola col tempo
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, dopo.resta + 8000)) no("la gara non finisce col tempo (resta " + vm(C).resta + ")");
    var cl = vm(C).classifica || [];
    if (cl[0] && cl[0].id !== A.mioId("Giulia")) no("ha vinto " + cl[0].nome + " invece di Giulia");
    await ricaricaSullaFine(C, ["Giulia", "Luca"], function (v) { return v.fase === "fine" && JSON.stringify(v.classifica) === JSON.stringify(cl); }, "Gara di pesca");
    errori();
    return "ripresa in " + r.dt + " s con gli stessi pesci (" + pesci(prima) + "); restavano " + Math.round(prima.resta / 1000) + " s, dopo " + Math.round(dopo.resta / 1000) +
      " s; pesce doppio scartato, quello nuovo contato; gara finita col tempo, ricarica sulla classifica senza esito doppio" + note;
  } });

  // =================== 572 HORTO MUSO ===================
  function idsHorto(v) { return v.ids || (v.seggi || []).map(function (s) { return s && s.id; }); }
  aggiungi(572, { nome: "Horto Muso: l'host ricarica a metà corsa → stessi iscritti, si riparte dai cancelletti; sulla classifica resta", fai: async function () {
    var r = await A.provaRipresa({ gioco: "horto", nomeTessera: "Horto Muso", amici: ["Giulia"],
      arriva: function (v) { return idsHorto(v).indexOf(A.mioId("Giulia")) >= 0; },
      fase: function (v) { return v.t === "via"; },
      prepara: async function (C) {
        await W.dorme(4500);   // (3-2-1 e un po' di corsa)
        for (var i = 0; i < 4; i++) { W.reteDi("Giulia").invia({ t: "frusta" }); await W.dorme(450); }
      },
      controlla: function (a, b) {
        if (b.t !== "via") return "la foto è «" + b.t + "»";
        if (b.garaId === a.garaId) return "la corsa non è ripartita (stessa gara)";
        if (!b.rip) return "il via nuovo non dice che è la ripresa";
        return JSON.stringify(a.ids) === JSON.stringify(b.ids) && a.n === b.n ? true : "iscritti cambiati: " + JSON.stringify(a.ids) + " → " + JSON.stringify(b.ids);
      } });
    var C = r.C, P = W.finestra("Paky"), G = W.finestra("Giulia");
    if (!/Si riparte dai cancelletti/.test(T(P))) no("l'host non legge «🔁 Si riparte dai cancelletti»");
    if (!await W.aspetta(function () { return /Si riparte dai cancelletti/.test(T(G)); }, 3000)) no("Giulia non legge «🔁 Si riparte dai cancelletti»");
    if (!G.document.querySelector(".ho-scena")) no("Giulia non ha la corsa sullo schermo");
    // la corsa riparte e arriva in fondo (Giulia frusta ogni tanto)
    var fino = Date.now() + 90000;
    while (vm(C).t !== "fine" && Date.now() < fino) { W.reteDi("Giulia").invia({ t: "frusta" }); await W.dorme(700); }
    if (vm(C).t !== "fine") no("la corsa ripartita non finisce");
    var ord = JSON.stringify(vm(C).ord), gid = vm(C).garaId;
    await W.dorme(6000);   // (photo finish e classifica)
    await ricaricaSullaFine(C, ["Giulia"], function (v) { return v.t === "fine" && v.garaId === gid && JSON.stringify(v.ord) === ord; }, "Horto");
    if (!await W.aspetta(function () { return /Rigioca|Rivincita|Saletta|Nuova partita/.test(T(W.finestra("Paky"))); }, 6000)) no("ricaricando sulla classifica l'host non la rivede");
    // si rigioca: la corsa nuova parte (3-2-1 normale)
    if (!W.clicca(W.finestra("Paky"), /Rigioca|Rivincita|Nuova partita/)) no("niente «Nuova partita»");
    if (!await W.aspetta(function () { var v = vm(C); return v.t === "via" && v.garaId !== gid && !v.rip; }, 10000)) no("la corsa nuova non parte");
    errori();
    return "ripresa in " + r.dt + " s: stessi iscritti, «🔁 Si riparte dai cancelletti» su tutti e due, corsa finita; ricarica sulla classifica senza esito doppio; rigioca";
  } });

  // =================== 573 PALLA A PENDOLO ===================
  aggiungi(573, { nome: "Palla a Pendolo: l'host ricarica a metà manche → stessi ruoli, si riparte da capo dopo 5 s; sulla fine resta", fai: async function () {
    var r = await A.provaRipresa({ gioco: "pendolo", nomeTessera: "Palla a Pendolo", amici: ["Giulia"],
      arriva: function (v) { if (v.t === "riparte") return true; var l = (v.seggi || []).map(function (s) { return s && s.id; }).concat([v.lanc]); return l.indexOf(A.mioId("Giulia")) >= 0; },
      fase: function (v) { return v.t === "via"; },
      prepara: async function () { await W.dorme(3000); },
      controlla: function (a, b) { return b.t === "riparte" || (b.t === "via" && b.gameId !== a.gameId) ? true : "la foto è «" + b.t + "»"; } });
    var C = r.C, prima = r.prima, P = W.finestra("Paky"), G = W.finestra("Giulia");
    if (!/Si riparte da capo/.test(T(P))) no("l'host non legge «🔁 Si riparte da capo»");
    if (!await W.aspetta(function () { return /Si riparte da capo/.test(T(G)); }, 3000)) no("Giulia non legge «🔁 Si riparte da capo»");
    if (!await W.aspetta(function () { var v = vm(C); return v.t === "via" && v.gameId !== prima.gameId; }, 9000)) no("dopo 5 secondi la manche non riparte");
    var v = vm(C);
    if (v.lanc !== prima.lanc || JSON.stringify(v.seggi) !== JSON.stringify(prima.seggi)) no("i ruoli sono cambiati: " + JSON.stringify([prima.lanc, prima.seggi]) + " → " + JSON.stringify([v.lanc, v.seggi]));
    if (!await W.aspetta(function () { return !!G.document.querySelector("canvas"); }, 4000)) no("Giulia non ha la manche sullo schermo");
    // fino alla fine della manche
    if (!await W.aspetta(function () { return vm(C).t === "fine"; }, 60000)) no("la manche ripartita non finisce");
    var gid = vm(C).gameId;
    await W.dorme(1500);
    await ricaricaSullaFine(C, ["Giulia"], function (x) { return x.t === "fine" && x.gameId === gid; }, "Pendolo");
    if (!await W.aspetta(function () { return /Hai vinto|Hai perso/.test(T(W.finestra("Paky"))); }, 6000)) no("ricaricando sulla fine l'host non rivede la schermata finale");
    errori();
    return "ripresa in " + r.dt + " s: «🔁 Si riparte da capo» su tutti e due, manche ripartita con gli stessi ruoli e finita; ricarica sulla fine senza esito doppio";
  } });

  COPIONE.gruppo5g5 = async function () {
    var es = {};
    for (var n of [570, 571, 572, 573]) { try { es[n] = await COPIONE.prova(n); } catch (e) { es[n] = "NO " + (e && e.message); } }
    return es;
  };
})();
