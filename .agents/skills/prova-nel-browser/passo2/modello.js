// PROVE DEL PASSO 2, pezzo p2-m: il MODELLO dei giochi nuovi (.agents/skills/nuovo-gioco/modello-gioco-online.js) nella Sala.
// Il modello non è in GIOCHI_ONLINE: per la prova si registra al posto di un gioco online vero (di partenza "garapesca",
// che su quei telefoni non si registra), così la Sala lo mette nell'elenco col suo nome ("Il più veloce").
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/modello.js"); await COPIONE.prova(240)
//
// 240: Sala con Paky, Giulia e Luca → "Il più veloce": gli amici entrano da soli (stessi id della Sala), "📜 Si gioca così: 5 giri",
//   partita intera; fine coi tasti del core (Paky «↻ Rivincita | 🎮 Cambia gioco», Giulia «👍 Ci sto! | 🏠 Torna in Sala»),
//   la classifica non si ridisegna; Ci sto → «· 👍 1»; Rivincita → 3-2-1 da solo e si rigioca; seconda partita intera;
//   «🎮 Cambia gioco» → La Scalinata: Giulia e Luca nella saletta nuova senza toccare niente.
// 241: lo stesso modello con 3 posti (MAX = 3) e 4 nella Sala: «Chi gioca?», Marco non scelto entra e guarda
//   («👀 Questa volta guardi», il suo id nella foto tra chi guarda, niente posto), partita intera, alla Rivincita guarda ancora.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm, ids = A.ids;
  var COME = "garapesca";

  // i telefoni con opz.comeGioco non registrano quel gioco vero (il modello prende il suo posto)
  if (!W.__pfModello) {
    var pf = W.__pfModello = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      pf.apply(this, arguments);
      if (!opz || !opz.comeGioco) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && g.id === opz.comeGioco && !g.__modello) return; return reg.apply(v, arguments); };
      } });
    };
  }
  // il testo del modello, con l'id preso in prestito e (se serve) un altro MAX
  async function testoModello(max) {
    var src = await (await fetch("/.agents/skills/nuovo-gioco/modello-gioco-online.js?" + Date.now())).text();
    src = src.replace('var ID = "modello";', 'var ID = "' + COME + '";').replace("SG.registra({", "SG.registra({ __modello: true,");
    if (max) src = src.replace("var MIN = 2, MAX = 10;", "var MIN = 2, MAX = " + max + ";");
    if (src.indexOf("__modello") < 0 || src.indexOf('"' + COME + '"') < 0) no("non riesco a preparare il modello per la prova");
    return src;
  }
  function opzModello(src, extra) { return Object.assign({ salaSempre: true, comeGioco: COME, prima: function (w) { w.eval(src); } }, extra || {}); }
  // la Sala con gli amici, tutti col modello
  async function salaModello(src, amici) {
    var w = { Paky: await W.apriTel("Paky", opzModello(src, { x: 0 })) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], opzModello(src, { hash: "sala=" + S, x: 185 * (i + 1) }));
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 10000)) no("nella Sala non sono entrati in " + (amici.length + 1));
    return { S: S, w: w };
  }
  function tocca(w) { var b = w && w.document.querySelector(".mo-tasto"); if (b) b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true })); return !!b; }
  // una partita intera: quando il tasto è verde tocca chi deve (a turno), poi l'host va avanti col «Prossimo giro»
  async function finoAllaFine(C, P, chi) {
    var fino = Date.now() + 90000, k = 0;
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase === "fine") return true;
      if (v.fase === "gioco" && v.stato === "via") { tocca(chi[k++ % chi.length]); await W.aspetta(function () { return vm(C).stato !== "via"; }, 3000); continue; }
      if (v.fase === "gioco" && v.stato === "preso") { var b = P.document.querySelector(".mo-vai"); if (b) { b.click(); await W.aspetta(function () { return vm(C).stato !== "preso"; }, 3000); continue; } }
      await W.dorme(100);
    }
    return vm(C).fase === "fine";
  }

  COPIONE.aggiungi(240, { nome: "Il modello dalla Sala: partita intera, Rivincita col 3-2-1 e Cambia gioco", fai: async function () {
    var src = await testoModello(), Z = await salaModello(src, ["Giulia", "Luca"]), S = Z.S, P = Z.w.Paky, G = Z.w.Giulia, L = Z.w.Luca;
    var C = await A.lanciaDallaSala("Paky", S, "Il più veloce");
    if (!await W.aspetta(function () { return ids(C, "players").length === 3 && A.dentro(G) && A.dentro(L); }, 9000)) no("Giulia e Luca non arrivano da soli nella saletta (" + ids(C, "players").length + ")");
    if (ids(C, "players").indexOf(A.idInSala(S, "Giulia")) < 0) no("l'id di Giulia nel gioco non è quello della Sala");
    if (!await W.aspetta(function () { return /5 giri/.test(A.regoleDi(G)); }, 4000)) no("Giulia non legge le regole («" + A.regoleDi(G) + "»)");
    if (/Si gioca a 5 giri/.test(T(G))) no("in saletta la nota del gioco ripete le regole");
    var regG = A.regoleDi(G);
    if (!W.clicca(P, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    if (!await finoAllaFine(C, P, [P, G, L])) no("la prima partita non finisce");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(G) && A.tastiFineDi(L); }, 5000)) no("a fine partita mancano i tasti del core");
    var tP = A.tastiFineDi(P).join(" | "), tG = A.tastiFineDi(G).join(" | ");
    if (tP !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
    if (tG !== "👍 Ci sto! | 🏠 Torna in Sala") no("Giulia ha «" + tG + "»");
    if (/Nuova partita|🏠 Esci|Se l'host fa un'altra partita/.test(T(P) + T(G))) no("ci sono anche i tasti di sempre del modello");
    var clG = G.document.querySelector(".classifica");
    W.clicca(G, /Ci sto/, ".fine-tasti button");
    if (!await W.aspetta(function () { return (A.tastiFineDi(G) || [])[0] === "✅ Ci stai!" && (A.tastiFineDi(P) || [])[0] === "↻ Rivincita · 👍 1"; }, 3000))
      no("dopo «Ci sto»: Giulia «" + (A.tastiFineDi(G) || []).join(" | ") + "», Paky «" + (A.tastiFineDi(P) || []).join(" | ") + "»");
    if (G.document.querySelector(".classifica") !== clG) no("la classifica di Giulia è stata ridisegnata");
    var vP = A.spiaVia(P), vG = A.spiaVia(G), t0 = Date.now();
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    var ok = await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 10000);
    var viP = vP.stop(), viG = vG.stop();
    if (!ok) no("dopo «Rivincita» la partita non riparte da sola (fase " + vm(C).fase + ", «" + T(P).slice(0, 80) + "»)");
    if (!viP || !viG) no("il 3-2-1 non si è visto (Paky " + viP + ", Giulia " + viG + ")");
    if (ids(C, "players").length !== 3) no("nella rivincita non sono in 3");
    var tR = ((Date.now() - t0) / 1000).toFixed(1);
    if (!await finoAllaFine(C, P, [G, L])) no("la rivincita non finisce");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(L); }, 5000)) no("a fine rivincita mancano i tasti del core");
    // «🎮 Cambia gioco»: tutti nella Sala, Paky sceglie La Scalinata, gli amici arrivano senza toccare niente
    var tocchiAmici = 0;
    [G, L].forEach(function (x) { x.document.addEventListener("pointerdown", function (e) { if (e.isTrusted) tocchiAmici++; }, true); });
    if (!W.clicca(P, /Cambia gioco/, ".fine-tasti button")) no("Paky non trova «Cambia gioco»");
    if (!await W.aspetta(function () { return !vm(S).gioco && vm(S).sceglie; }, 4000)) no("la Sala non dice che Paky sta scegliendo");
    if (!await W.aspetta(function () { return /sceglie il prossimo gioco/.test(T(G)) && /sceglie il prossimo gioco/.test(T(L)); }, 5000)) no("Giulia e Luca non leggono «Paky sceglie il prossimo gioco…»");
    var tess = await W.aspetta(function () { return A.tessera(P, "La Scalinata"); }, 3000);
    if (!tess) no("Paky non è nell'elenco dei giochi");
    tess.click();
    var C2 = await W.aspetta(function () { var c = A.codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S && c !== C ? c : null; }, 6000);
    if (!C2) no("dopo la tessera Paky non è nella saletta della Scalinata");
    if (!await W.aspetta(function () { return A.dentro(G) && A.dentro(L) && G.document.querySelector(".saletta-schermo") && L.document.querySelector(".saletta-schermo"); }, 9000)) no("Giulia e Luca non arrivano da soli nella Scalinata");
    if (tocchiAmici) no("gli amici hanno toccato " + tocchiAmici + " volte");
    return "entrati da soli (stessi id), regole «" + regG + "»; fine: Paky «" + tP + "», Giulia «" + tG + "»; Ci sto → «👍 1»; Rivincita → 3-2-1 e si gioca in " + tR + " s; Cambia gioco → Scalinata, amici 0 tocchi";
  } });

  COPIONE.aggiungi(241, { nome: "Il modello con 3 posti e 4 nella Sala: «Chi gioca?», Marco guarda (anche alla Rivincita)", fai: async function () {
    var src = await testoModello(3), Z = await salaModello(src, ["Giulia", "Luca", "Marco"]), S = Z.S, P = Z.w.Paky, G = Z.w.Giulia, M = Z.w.Marco;
    var dove = await A.toccaGiocoSala(P, "Il più veloce");
    if (dove.etichetta !== "Max 3: gioca chi scegli") no("l'etichetta nell'elenco è «" + dove.etichetta + "»");
    if (dove.dove !== "chi") no("con 4 nella Sala e 3 posti non si apre «Chi gioca?» (" + dove.dove + ")");
    if (!W.clicca(P, /Si gioca/, ".piede button")) no("in «Chi gioca?» non c'è «▶ Si gioca»");
    var C = await W.aspetta(function () { var c = A.codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 6000);
    if (!C) no("dopo «Si gioca» Paky non è nella saletta");
    var idM = A.idInSala(S, "Marco");
    if (!await W.aspetta(function () { return ids(C, "players").length === 3 && ids(C, "guarda").indexOf(idM) >= 0; }, 9000))
      no("nella foto non ci sono 3 giocatori e Marco tra chi guarda (" + ids(C, "players").join(",") + " / " + ids(C, "guarda").join(",") + ")");
    if (ids(C, "players").indexOf(idM) >= 0) no("Marco ha preso un posto");
    if (!await W.aspetta(function () { return /Questa volta guardi/.test(T(M)); }, 5000)) no("Marco non legge «👀 Questa volta guardi» («" + T(M).slice(0, 100) + "»)");
    if ([].some.call(M.document.querySelectorAll(".sl-pronto"), function (b) { return !b.hidden && b.offsetParent; })) no("Marco ha «Sono pronto»");
    if (!/Guardano: tu/.test(T(M)) || !/Guardano: Marco/.test(T(G))) no("in saletta non si legge chi guarda");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    if (!await W.aspetta(function () { var g = M.document.querySelector(".mo-giro"); return g && /👀 Guardi/.test(g.textContent); }, 4000)) no("Marco in partita non è tra chi guarda");
    if (!await W.aspetta(function () { return vm(C).stato === "via"; }, 6000)) no("il tasto non diventa verde");
    tocca(M); await W.dorme(300);
    if (vm(C).stato !== "via") no("il tocco di Marco (che guarda) ha preso il punto");
    if (!await finoAllaFine(C, P, [P, G])) no("la partita non finisce");
    if (!await W.aspetta(function () { return A.tastiFineDi(P); }, 5000)) no("a fine partita mancano i tasti di Paky");
    if (!/Questa partita l'hai guardata/.test(T(M))) no("Marco a fine partita non legge che l'ha guardata");
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return (vm(C).fase === "lobby" || vm(C).partita === 2) && ids(C, "guarda").indexOf(idM) >= 0 && ids(C, "players").indexOf(idM) < 0; }, 8000))
      no("alla Rivincita Marco non guarda più (" + ids(C, "players").join(",") + " / " + ids(C, "guarda").join(",") + ")");
    return "«Max 3: gioca chi scegli», «Chi gioca?» → Paky, Giulia, Luca; Marco «👀 Questa volta guardi» (id tra chi guarda), il suo tocco non conta, alla fine «l'hai guardata», alla Rivincita guarda ancora";
  } });
})();
