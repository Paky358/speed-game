// ↻ LA RIVINCITA CHE PORTA ALLE REGOLE (22 nov 2026, chat «🪟 Saletta di vetro»; il proprietario: «quando faccio rivincita mi porta
// nella pagina per riscegliere le regole, questo su qualsiasi gioco»). Si carica da sola (copione-prova.js prima).
// rvc1: online nella Sala in 3 (Linea del tempo): fine, «Ci sto», «↻ Rivincita» → tutti nella saletta, NESSUNO parte da solo (3 s
//       senza 3-2-1), Paky cambia le carte nel ⚙️ (Giulia legge «✨ Cambiate: … 6 carte»), «Comincia» → la partita ha 6 carte per tutti.
// rvc2: sullo stesso telefono (Linea del tempo): regole con 4 carte, fine, «↻ Rigioca» → la pagina delle regole con 4 carte già
//       scelte (non riparte), +2 → «Comincia» → la partita nuova ha 6 carte.
// Con prezzo/difetti/foto.js fa anche le foto (W.scatta); W.__pfOpz.solofoto = true → niente NO sul comportamento nuovo (per le
// foto «prima», sulla versione vecchia).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, vm = A.vm;
  if (!W.scatta) W.scatta = async function () {};
  if (!W.misuraTel) W.misuraTel = function (nome, L, Al, x) {
    var f = document.getElementById("tel-" + nome); if (!f) return;
    f.style.transform = "none"; f.style.width = L + "px"; f.style.height = Al + "px"; f.style.left = (x || 0) + "px"; f.style.top = "0px";
    try { f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); } catch (e) {}
  };
  function vis(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function soloFoto() { return !!(W.__pfOpz && W.__pfOpz.solofoto); }
  function NO(m) { if (!soloFoto()) no(m); }

  COPIONE.aggiungi("rvc1", { nome: "Rivincita online nella Sala: saletta, niente partenza da sola, ⚙️ cambiato, «Comincia», la regola nuova per tutti", fai: async function () {
    A.spiaTavolo();
    var amici = ["Giulia", "Luca"], w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true, spiaTav: ["timeline"] }) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, spiaTav: ["timeline"] });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 3; }, 12000)) no("nella Sala non sono entrati in 3");
    var P = w.Paky, G = w.Giulia, L = w.Luca;
    W.misuraTel("Paky", 412, 915, 1150); W.misuraTel("Giulia", 360, 640, 1580);
    var C = await A.lanciaDallaSala("Paky", S, "La linea del tempo");
    if (!await W.aspetta(function () { return A.ids(C, "giocatori").length === 3 && A.dentro(G) && A.dentro(L); }, 12000)) no("non sono in 3 nella saletta");
    await W.dorme(600);
    W.clicca(P, /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 10000)) no("la partita non comincia");
    var carte0 = vm(C).carte;
    await W.dorme(1500);
    // la fine (la dà la spia del tavolo, come nelle prove 46): classifica e tasti del core
    var cl = [{ nome: "Paky", punti: 300, pos: 1 }, { nome: "Giulia", punti: 200, pos: 2 }, { nome: "Luca", punti: 100, pos: 3 }];
    if (!P.__tav || !G.__tav || !L.__tav) no("la spia del tavolo non c'è");
    [P, G, L].forEach(function (x) { x.__tav.fine(cl); });
    if (!await W.aspetta(function () { var t = A.tastiFineDi(P); return t && /Rivincita/.test(t[0]); }, 8000)) no("Paky non ha «↻ Rivincita» («" + T(P).slice(-100) + "»)");
    if (!await W.aspetta(function () { return [G, L].every(function (x) { var t = A.tastiFineDi(x); return t && /Ci sto/.test(t[0]); }); }, 8000)) no("Giulia e Luca non hanno «👍 Ci sto!»");
    [G, L].forEach(function (x) { W.clicca(x, /Ci sto/, ".fine-tasti button"); });
    await W.dorme(600);
    // (niente foto qui: la partita finta continua sotto e dopo la foto la Linea ridisegna il suo turno)
    // ↻ Rivincita: la saletta nuova (stessi amici, stesse regole) e nessuno parte da solo
    var via = { visto: false }, tv = setInterval(function () { [P, G, L].forEach(function (x) { if (x.document.querySelector(".sl-via")) via.visto = true; }); }, 25);
    if (!await W.aspetta(function () { return W.clicca(P, /Rivincita/, ".fine-tasti button"); }, 5000)) { clearInterval(tv); no("Paky non riesce a toccare «↻ Rivincita» («" + T(P).slice(-80) + "»)"); }
    var C2 = await W.aspetta(function () { var c = vm(S).stanza; return c && c !== C ? c : null; }, 10000);
    if (!C2) { clearInterval(tv); no("la Rivincita non apre la stanza nuova"); }
    if (!await W.aspetta(function () { return P.document.querySelector(".saletta-schermo") && A.dentro(G) && A.dentro(L); }, 12000) && !soloFoto()) { clearInterval(tv); no("dopo la Rivincita non sono tutti nella saletta"); }
    await W.dorme(3000);   // (prima, con tutti dentro, partiva il 3-2-1 da solo dopo 0,7 s)
    await W.scatta("Paky", "rvc1-2-dopo-rivincita-Paky"); await W.scatta("Giulia", "rvc1-2-dopo-rivincita-Giulia");
    if (via.visto || vm(C2).fase !== "lobby") { clearInterval(tv); NO("dopo la Rivincita la partita è partita da sola (fase " + vm(C2).fase + ", 3-2-1 " + via.visto + ")"); }
    if (soloFoto() && vm(C2).fase !== "lobby") { clearInterval(tv); return "foto (prima): la partita è ripartita da sola"; }
    var go = P.document.querySelector(".sl-go");
    if (!go || go.disabled || !vis(go)) NO("Paky non ha «Comincia» acceso nella saletta");
    if (vm(C2).carte !== carte0) NO("le regole non sono quelle di prima (" + vm(C2).carte + " carte invece di " + carte0 + ")");
    // Paky cambia le carte nel ⚙️: a Giulia arriva «✨ Cambiate: … 6 carte»
    if (!W.clicca(P, /Regole/, ".sl-regole")) NO("Paky non trova «⚙️ Regole»");
    await W.dorme(400);
    var fo = P.document.querySelector(".sl-foglio"); if (!fo) no("il foglio delle regole non si apre");
    var st = [].find.call(fo.querySelectorAll(".stepper"), vis); if (!st) no("nel ⚙️ non c'è il numero di carte");
    st.querySelectorAll("button")[1].click();
    var voluto = carte0 + 1;
    await W.scatta("Paky", "rvc1-3-regole-Paky");
    W.clicca(P, /Fatto/, ".sl-foglio button");
    var bx = await W.aspetta(function () { var b = G.document.querySelector(".sl-attesa .sl-att-reg"); return b && !b.hidden && /Cambiate/.test(b.textContent) && new RegExp(voluto + " carte").test(b.textContent) ? b : null; }, 4000);
    if (!bx) NO("a Giulia non arriva «✨ Cambiate: … " + voluto + " carte» («" + ((G.document.querySelector(".sl-att-reg") || {}).textContent || "") + "»)");
    await W.scatta("Giulia", "rvc1-4-regole-cambiate-Giulia");
    if (vm(C2).fase !== "lobby") NO("la partita è partita da sola dopo il cambio delle regole");
    // «Comincia»: la partita nuova con le regole nuove, per tutti
    W.clicca(P, /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return vm(C2).fase && vm(C2).fase !== "lobby"; }, 10000)) no("dopo «Comincia» la partita non parte");
    clearInterval(tv);
    if (!via.visto) NO("niente 3-2-1 dopo «Comincia»");
    if (vm(C2).carte !== voluto) NO("la partita nuova ha " + vm(C2).carte + " carte invece di " + voluto);
    if (!await W.aspetta(function () { return [G, L].every(function (x) { return !x.document.querySelector(".saletta-schermo") && !x.document.querySelector(".fine-tasti"); }); }, 8000)) NO("Giulia e Luca non sono nella partita nuova");
    await W.dorme(1200);
    await W.scatta("Giulia", "rvc1-5-partita-nuova-Giulia");
    return "fine → «Ci sto» → «↻ Rivincita»: saletta nuova (" + C2 + "), 3 s ferma; ⚙️ " + carte0 + " → " + voluto + " carte, Giulia legge «" + (bx ? bx.textContent : "") + "»; «Comincia» → 3-2-1 e " + vm(C2).carte + " carte per tutti" +
      (W.erroriTel().length ? " · ERRORI: " + W.erroriTel().slice(0, 3).join(" / ") : "");
  } });

  COPIONE.aggiungi("rvc2", { nome: "Rivincita sullo stesso telefono: la pagina delle regole con quelle di prima, cambio, «Comincia»", fai: async function () {
    A.spiaTavolo();
    var U = await W.apriTel("Ugo", { x: 0, spiaTav: ["timeline"] });
    W.misuraTel("Ugo", 360, 640, 1150);
    await W.dorme(500);
    var tess = await W.aspetta(function () { return A.tessera(U, "La linea del tempo"); }, 8000); if (!tess) no("non trovo la tessera");
    tess.click(); await W.dorme(900);
    if (!await W.aspetta(function () { return W.clicca(U, /Su questo telefono/); }, 8000)) no("non c'è «Su questo telefono»");
    await W.dorme(700);
    if (await W.aspetta(function () { return U.document.querySelector(".sala-riga input"); }, 3000)) {
      while (U.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(U, /Aggiungi giocatore/)) break; await W.dorme(80); }
      [].forEach.call(U.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia"][k] || c.value; c.dispatchEvent(new U.Event("input", { bubbles: true })); });
    }
    for (var k = 0; k < 6 && !U.document.querySelector(".stepper"); k++) {
      var b2 = [].find.call(U.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|▶/.test(x.textContent) && !x.disabled; });
      if (!b2) break; b2.click(); await W.dorme(600);
    }
    function stepper() { return [].find.call(U.document.querySelectorAll(".stepper"), vis) || null; }
    function valore() { var s = stepper(); return s ? +s.querySelector(".valore").textContent : null; }
    if (!stepper()) no("non arrivo alle impostazioni");
    stepper().querySelectorAll("button")[0].click(); await W.dorme(150);   // 5 → 4 carte
    var c1 = valore();
    await W.scatta("Ugo", "rvc2-1-regole");
    var b3 = [].find.call(U.document.querySelectorAll(".schermata .piede button"), function (x) { return /Comincia/.test(x.textContent) && !x.disabled; });
    if (!b3) no("non trovo «Comincia»"); b3.click();
    if (!await W.aspetta(function () { return U.__tav && U.__tav.impostazioni && U.__tav.impostazioni.carte === c1; }, 6000)) no("la partita non parte con " + c1 + " carte");
    var tav1 = U.__tav;
    await W.dorme(1500);
    tav1.fine([{ nome: "Paky", punti: 300, pos: 1 }, { nome: "Giulia", punti: 100, pos: 2 }]);
    if (!await W.aspetta(function () { return [].some.call(U.document.querySelectorAll("button"), function (x) { return /Rigioca/.test(x.textContent) && vis(x); }); }, 6000)) no("a fine partita non c'è «↻ Rigioca» («" + T(U).slice(-100) + "»)");
    await W.scatta("Ugo", "rvc2-2-fine");
    W.clicca(U, /Rigioca/);
    await W.dorme(1200);
    await W.scatta("Ugo", "rvc2-3-dopo-rigioca");
    if (soloFoto() && !stepper()) return "foto (prima): «Rigioca» riparte subito";
    if (U.__tav !== tav1) NO("«↻ Rigioca» è ripartito subito invece di mostrare le regole");
    if (!stepper()) NO("dopo «↻ Rigioca» non ci sono le regole («" + T(U).slice(0, 100) + "»)");
    if (valore() !== c1) NO("le regole non sono quelle di prima (" + valore() + " carte invece di " + c1 + ")");
    if (!/Paky/.test(T(U)) || !/Giulia/.test(T(U))) NO("la pagina delle regole non ha gli stessi giocatori");
    stepper().querySelectorAll("button")[1].click(); await W.dorme(100);
    stepper().querySelectorAll("button")[1].click(); await W.dorme(150);   // 4 → 6 carte
    var c2 = valore();
    var b4 = [].find.call(U.document.querySelectorAll(".schermata .piede button"), function (x) { return /Comincia/.test(x.textContent) && !x.disabled; });
    if (!b4) no("dopo «Rigioca» non c'è «Comincia»"); b4.click();
    if (!await W.aspetta(function () { return U.__tav && U.__tav !== tav1 && U.__tav.impostazioni.carte === c2; }, 6000)) NO("la partita nuova non parte con " + c2 + " carte (" + (U.__tav && U.__tav.impostazioni && U.__tav.impostazioni.carte) + ")");
    await W.dorme(1200);
    await W.scatta("Ugo", "rvc2-4-partita-nuova");
    return "regole " + c1 + " carte → fine → «↻ Rigioca»: la pagina delle regole con " + c1 + " carte → " + c2 + " → «Comincia»: partita nuova con " + U.__tav.impostazioni.carte + " carte" +
      (W.erroriTel().length ? " · ERRORI: " + W.erroriTel().slice(0, 3).join(" / ") : "");
  } });
})();
