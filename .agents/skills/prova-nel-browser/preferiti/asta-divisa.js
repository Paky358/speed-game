// PROVE DELLE DUE ASTE DIVISE (29 ott 2026, il proprietario: «due giochi separati in prima schermata, ognuno con la sua tessera,
// la sua foto e la sua categoria: «🔨 L'Asta» (i temi) e «⚽ Mini Asta Fantacalcio»… un link vecchio del fanta deve aprire il fanta»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-divisa.js"); await COPIONE.prova("dv1")
//
// dv1 In home le due tessere (categoria Festa, la foto del fanta caricata davvero); dalla tessera del fanta «Come giocate?» al primo
//     tocco; le impostazioni di ognuna (L'Asta: crediti, tema, round, carta maledetta, niente fanta; il fanta: la giornata, niente temi),
//     il riassunto e le regole; la stanza online del fanta si chiama «astafanta» (il codice porta al fanta); Giulia entra col link
//     VECCHIO («gioco=asta») e Luca col nuovo: tutti e due nella saletta del fanta e poi nello stadio.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  async function giochi() {   // le due registrazioni, lette dal file del gioco (come pa0)
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), l = {};
    new Function("SG", src)({ registra: function (x) { l[x.id] = x; }, bot: W.SG && SG.bot });
    return l;
  }
  function prova(g, modo) {   // le impostazioni di un gioco in una scatola vera (il testo che si vede: le parti nascoste non contano)
    var box = document.createElement("div"), dove = {};
    var el = function (tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k === "class") e.className = a[k]; else if (k === "style") e.style.cssText = a[k]; else if (k === "onclick") e.onclick = a[k]; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; };
    document.body.appendChild(box);
    g.impostazioni(box, dove, { el: el, modo: modo || null });
    var testo = box.innerText; box.remove();
    return { dove: dove, testo: testo };
  }
  COPIONE.aggiungi("dv1", { nome: "L'Asta e la Mini Asta Fantacalcio: due tessere, impostazioni a parte, stanza «astafanta», link vecchio che apre il fanta", fai: async function () {
    var x = [];
    // ---- le due registrazioni ----
    var G = await giochi(), a = G.asta, f = G.astafanta;
    if (!a || !f) no("non ci sono tutte e due le registrazioni (" + Object.keys(G).join(", ") + ")");
    if (a.nome !== "L'Asta" || f.nome !== "Mini Asta Fantacalcio" || f.icona !== "⚽") no("nomi o icone sbagliati: " + a.nome + " / " + f.icona + " " + f.nome);
    if (!f.provaDaSolo || !f.riprende || !f.riserva || f.postiOnline !== a.postiOnline) no("il fanta non ha prova da solo, ripresa, riserva o i posti dell'Asta");
    var pa = prova(a, "telefono"), pf = prova(f, "telefono");
    if (pa.dove.formato !== "temi" || pf.dove.formato !== "fanta" || pf.dove.crediti !== 20) no("formato o crediti: " + JSON.stringify(pa.dove) + " / " + JSON.stringify(pf.dove));
    if (/Modalità|giornata dopo l'asta/i.test(pa.testo) || !/Crediti a testa/.test(pa.testo) || !/I round/.test(pa.testo) || !/carta maledetta/i.test(pa.testo)) no("le impostazioni dell'Asta: «" + pa.testo.replace(/\s+/g, " ").slice(0, 200) + "»");
    if (/Modalità|Crediti a testa|Tema|I round|maledetta/.test(pf.testo) || !/giornata dopo l'asta/i.test(pf.testo)) no("le impostazioni del fanta: «" + pf.testo.replace(/\s+/g, " ").slice(0, 200) + "»");
    if (!/^🎁 Temi classici/.test(a.riassunto({})) || !/^⚽ Mini asta Fantacalcio/.test(f.riassunto({})) || !/^⚽/.test(a.riassunto({ formato: "fanta" }))) no("riassunti: " + a.riassunto({}) + " / " + f.riassunto({}));
    var ra = a.regole.join(" "), rf = f.regole.join(" ");
    if (/Fantacalcio|fantapunti/.test(ra) || !/RIGORISTA/.test(rf) || !/rialzare da solo/.test(rf) || /carta-scenario/.test(rf)) no("le regole non sono divise bene");
    x.push("registrazioni, impostazioni, riassunti e regole a parte");
    // ---- la home: due tessere ----
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { try { w.localStorage.setItem("sg_asta_formato", "fanta"); } catch (e) {} } });
    var tA = await W.aspetta(function () { return A.tessera(P, "L'Asta"); }, 6000), tF = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000);
    if (!tA || !tF) no("in home non ci sono le due tessere");
    if (tF.getAttribute("data-cat") !== "festa" || tF.getAttribute("data-gioco") !== "astafanta") no("la tessera del fanta: categoria «" + tF.getAttribute("data-cat") + "», gioco «" + tF.getAttribute("data-gioco") + "»");
    var img = tF.querySelector("img.illustr");
    if (!img || !await W.aspetta(function () { return img.complete && img.naturalWidth >= 600; }, 6000)) no("la foto della tessera del fanta non si carica");
    x.push("due tessere in home (Festa), foto del fanta " + img.naturalWidth + "×" + img.naturalHeight);
    // ---- online: la stanza del fanta, il link vecchio e quello nuovo ----
    var C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    var meta = null;
    [BR].concat(Object.keys(BR.uffici || {}).map(function (k) { return BR.uffici[k]; })).forEach(function (u) { Object.keys(u.retained || {}).forEach(function (k) { if (k.slice(-(C.length + 5)) === C + "/meta") meta = u.retained[k]; }); });
    if (!meta || JSON.parse(meta).g !== "astafanta") no("la stanza del fanta non dice «astafanta» («" + meta + "»)");
    await W.apriTel("Giulia", { hash: "gioco=asta&stanza=" + C, x: 185 });   // il link di prima
    await W.apriTel("Luca", { hash: "gioco=astafanta&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 12000)) no("non entrano in 3 (" + (vm(C).giocatori || []).length + ")");
    if (vm(C).formato !== "fanta") no("la stanza non è del fanta: " + vm(C).formato);
    W.clicca(P, /Comincia/);
    var Gw = W.finestra("Giulia"), Lw = W.finestra("Luca");
    if (!await W.aspetta(function () { return q(Gw, ".st-stadio") && q(Lw, ".st-stadio") && q(P, ".st-stadio"); }, 10000)) no("lo stadio non arriva su tutti (Giulia col link vecchio: «" + T(Gw).slice(0, 80) + "»)");
    x.push("stanza «astafanta»; Giulia col link vecchio e Luca col nuovo nello stadio del fanta");
    // ---- un tocco dalla home: «Come giocate?» (su un altro telefono) ----
    var B = await W.apriTel("Bea", { x: 555 }), tB = await W.aspetta(function () { return A.tessera(B, "Mini Asta Fantacalcio"); }, 6000);
    if (!tB) no("Bea non vede la tessera del fanta");
    tB.click();
    if (!await W.aspetta(function () { return /Su questo telefono/.test(T(B)) && /Online|apro io/.test(T(B)); }, 4000)) no("dalla tessera del fanta non arriva «Come giocate?» («" + T(B).slice(0, 100) + "»)");
    x.push("un tocco: «Come giocate?»");
    return x.join(" · ");
  } });
})();
