// PROVE DELLE PAGELLE DELLA GIORNATA DOPO L'ASTA (22 ott 2026, il proprietario: «le pagelle finali fa che durano un po' di più e
// che poi le skippo io… metti un coso che poi l'host va avanti»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-pagelle.js");
// await COPIONE.prova("pg1") (preferiti/asta.js serve per la spia che mette le regole della partita: il formato fantacalcio)
//
// pg1 Online fantacalcio in 3 (Paky tiene la partita, Giulia e Luca): asta veloce, poi la giornata (col ⏩ su tutti i telefoni).
//     All'intervallo Paky ha «Avanti ▶ (…)», Luca e Giulia «⏳ Aspettiamo Paky…» e restano fermi finché Paky non tocca; poi
//     vanno avanti anche loro. Al fischio finale lo stesso, pagella per pagella: Luca aspetta Paky, e quando Paky va avanti
//     anche Luca passa alla pagella dopo; alla fine il podio per tutti.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }
  async function telefoniOnline(imp, nomi) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "L'Asta");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=asta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 12000)) no("non sono entrati in " + nomi.length + " (" + (vm(C).giocatori || []).length + ")");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  function pagelle(w) { var p = q(w, ".st-pag.on"); return p && !p.classList.contains("live") ? p : null; }   // (le pagelle aperte, non la scheda toccata)
  function titoloPag(w) { var p = pagelle(w), t = p && p.querySelector(".st-pag-tit"), n = p && p.querySelector(".st-pf-testa span"); return p ? (t ? t.textContent : "") + (n ? " · " + n.textContent : "") : ""; }

  COPIONE.aggiungi("pg1", { nome: "Asta fantacalcio online in 3: le pagelle (intervallo e fischio finale) aspettano «Avanti ▶» di chi tiene la partita, gli altri «⏳ Aspettiamo Paky…»", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], o = await telefoniOnline({ formato: "fanta" }, NOMI), P = o.P, C = o.C, x = [], fino = Date.now() + 300000, visti = {};
    // l'asta veloce: se nessuno ha offerto lo prende il primo che può, poi passano gli altri
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(250); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else manda(pr.nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: a.nCarta }); });
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("il fanta online non finisce");
    var L = W.finestra("Luca"), G = W.finestra("Giulia"), tutti = [P, G, L];
    // la classifica delle rose → la giornata (un «Salta» a testa), poi ⏩ su tutti i telefoni
    for (var i = 0; i < tutti.length; i++) { var w = tutti[i]; if (!await W.aspetta(function () { return q(w, ".st-rivela"); }, 15000)) no("niente classifica delle rose"); W.clicca(w, /Salta/); }
    if (!await W.aspetta(function () { return tutti.every(function (w) { return q(w, ".st-bar-vel"); }); }, 8000)) no("la giornata non parte su tutti i telefoni");
    tutti.forEach(function (w) { var b = q(w, ".st-bar-vel"); if (b && !b.classList.contains("on")) b.click(); });
    // ⏸️ l'intervallo: Paky ha «Avanti ▶», Luca e Giulia aspettano
    if (!await W.aspetta(function () { return pagelle(P) && pagelle(L) && pagelle(G); }, 120000)) no("le pagelle del primo tempo non arrivano su tutti (Paky " + !!pagelle(P) + ", Luca " + !!pagelle(L) + ", Giulia " + !!pagelle(G) + ")");
    var avP = bott(P, ".st-pag-av", /Avanti/), attL = q(L, ".st-pag-attesa"), attG = q(G, ".st-pag-attesa");
    if (!avP) no("all'intervallo Paky non ha «Avanti ▶»");
    if (!attL || !/Aspettiamo Paky/.test(attL.textContent) || bott(L, ".st-pag-av", /Avanti/)) no("all'intervallo Luca non legge «⏳ Aspettiamo Paky…» (o ha un «Avanti»): " + (attL ? attL.textContent : "niente"));
    if (!attG) no("all'intervallo Giulia non aspetta");
    await W.dorme(3500);
    if (!pagelle(L) || !pagelle(G)) no("Luca e Giulia non hanno aspettato Paky: le pagelle sono sparite da sole");
    var pagP = titoloPag(P);
    avP.click();
    if (!await W.aspetta(function () { return !pagelle(L) || titoloPag(L) !== pagP; }, 4000)) no("Paky va avanti ma Luca resta alle pagelle del primo tempo");
    x.push("intervallo: Paky «" + avP.textContent.trim() + "», Luca «" + attL.textContent.trim() + "», poi tutti avanti al tocco di Paky");
    // 🏁 il fischio finale: pagella per pagella, Luca aspetta Paky
    if (!await W.aspetta(function () { return pagelle(P) && pagelle(P).classList.contains("uno") && pagelle(L) && pagelle(L).classList.contains("uno"); }, 150000)) no("le pagelle finali non arrivano su Paky e Luca");
    var carte = 0;
    for (var giro = 0; giro < 6; giro++) {
      var av = await W.aspetta(function () { return bott(P, ".st-pag-av", /Avanti/); }, 15000);   // (dopo che i voti sono usciti tutti)
      if (!av) { if (q(P, ".st-gradini")) break; no("nelle pagelle finali Paky non ha «Avanti ▶»"); }
      if (!await W.aspetta(function () { return q(L, ".st-pag-attesa"); }, 12000)) no("nelle pagelle finali Luca non aspetta Paky");
      var prima = titoloPag(L);
      await W.dorme(2000);
      if (titoloPag(L) !== prima) no("Luca è andato avanti da solo nelle pagelle finali");
      av.click(); carte++;
      if (!await W.aspetta(function () { return titoloPag(L) !== prima || q(L, ".st-gradini"); }, 5000)) no("Paky va avanti ma Luca resta sulla stessa pagella (" + prima + ")");
      if (await W.aspetta(function () { return q(P, ".st-gradini"); }, 4500)) break;
    }
    if (!await W.aspetta(function () { return q(P, ".st-gradini") && q(L, ".st-gradini"); }, 15000)) no("alla fine il podio non arriva per tutti");
    x.push("fischio finale: " + carte + " pagelle, ognuna aspettata da Luca e passata al tocco di Paky; podio per tutti");
    return x.join(" · ");
  } });
})();
