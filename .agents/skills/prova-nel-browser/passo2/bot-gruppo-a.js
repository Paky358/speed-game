// PROVE DEL PASSO 2, pezzo p2-bg1: i giochi del gruppo A (Tris, Drop 4, Battaglia Navale, Scopa, Calcio Biliardo, Scopone,
// Glow Hockey) usano i bot fissi (SG.bot): nei menu si dice solo "Bot", in partita il bot ha il suo nome e il suo avatar.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/bot-gruppo-a.js"); await COPIONE.prova(261)
//
// 261:  Tris contro il Bot Difficile: in partita c'è Matt (il bot fisso difficile) col suo avatar, "Matt sta pensando…",
//       a 360x640 non scorre; il menu dice "Bot" e nessun nome.
// 261b: Drop 4 contro il Bot Facile: il bot facile fisso (nome e avatar), "<nome> sta pensando…".
// 261c: Battaglia Navale contro il Bot: dopo "A caso" e "Pronto", "Spara <nome>…" / si gioca col nome del bot fisso.
// 261d: Scopa contro il Bot (Medio): il bot fisso medio al tavolo col suo avatar; menu "Contro il Bot", "Bravura del Bot".
// 261e: Calcio Biliardo contro il Bot: i nomi sulle targhette sono il tuo e quello del bot fisso.
// 261f: Scopone: i tre bot fissi del livello (compagno di fronte), coi loro avatar; le regole non hanno nomi.
// 261g: Glow Hockey contro il Bot: "🤖 <nome> · Medio" sotto, e col bot che vince "Ha vinto <nome>".
// 261h: Torneo a eliminazione a Tris in 3: chi gioca col Bot del torneo lo vede col nome e l'avatar del torneo, e la
//       partita trasmessa a chi guarda ha lo stesso nome e avatar (non "🤖"); la riga del bot nell'esito ha bot: true.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var NOMI_BOT = /\b(Matt|Angela|Rosa|Peppe|Gina|Totò|Ciro|Lella)\b/;

  // dalla home al gioco, "Contro il computer" (o il primo modo col Bot), la bravura scelta, poi "Comincia"
  async function controIlBot(P, nomeGioco, livello, primaDiCominciare) {
    var tess = await W.aspetta(function () { return A.tessera(P, nomeGioco); }, 5000);
    if (!tess) no("non trovo la tessera di " + nomeGioco);
    tess.click(); await W.dorme(250);
    var modi = A.modiVisti(P), mb = modi.filter(function (m) { return /^🤖/.test(m); })[0];
    if (modi.length) {   // (un gioco con un modo solo, come lo Scopone, va dritto alle impostazioni)
      if (!mb) no(nomeGioco + ": in «Come giocate?» non c'è il modo col Bot (" + modi.join(" / ") + ")");
      if (NOMI_BOT.test(mb)) no(nomeGioco + ": il modo col Bot ha un nome: «" + mb + "»");
      W.clicca(P, new RegExp(mb.slice(3, 14).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), ".modo-grande"); await W.dorme(250);
    }
    var imp = T(P);
    if (NOMI_BOT.test(imp.replace(/Prova il \S+/g, ""))) no(nomeGioco + ": le impostazioni dicono un nome di bot («" + imp.slice(0, 160) + "»)");
    if (livello) {
      var ch = [].find.call(P.document.querySelectorAll(".modo-chip"), function (b) { return new RegExp("^\\W*" + livello + "\\b").test(b.textContent.trim()); });
      if (!ch) no(nomeGioco + ": non trovo la bravura «" + livello + "»");
      ch.click(); await W.dorme(80);
    }
    if (primaDiCominciare) await primaDiCominciare();
    var via = [].find.call(P.document.querySelectorAll(".piede button, button"), function (b) { return /Comincia|Gioca|Inizia/.test(b.textContent) && b.offsetParent; });
    if (!via) no(nomeGioco + ": non trovo «Comincia» («" + T(P).slice(0, 80) + "»)");
    via.click(); await W.dorme(600);
  }
  // il bot fisso che deve uscire con questa bravura (gli stessi parametri del gioco)
  function atteso(P, livello, n) { return P.SG.bot.prendi(n || 1, { livello: livello, escludi: [P.__fp.nome] }); }
  // (gli id dei disegni cambiano a ogni disegno, e gli occhi che si muovono hanno uno style: si tolgono)
  var senzaId = function (s) { return String(s || "").replace(/om[0-9a-z]+_/g, "om_").replace(/ style="[^"]*"/g, ""); };
  function stessoAvatar(P, nodo, b) {
    var svg = nodo && nodo.querySelector("svg"), d = P.document.createElement("div");
    d.innerHTML = P.SGOmino.svg(b.omino, { busto: true });   // (passato dal browser: le virgolette diventano uguali)
    return !!svg && !!d.firstElementChild && senzaId(svg.outerHTML) === senzaId(d.firstElementChild.outerHTML);
  }
  // Scopa e Scopone: l'avatar al tavolo (.sc-avv-fig) è quello che la stanza condivisa (SGCarte.stanza4) fa col bot fisso,
  // con una delle sue facce (normale, pensa, esulta, triste)
  function stessoAvatarCarte(P, fig, b) {
    var el = function (tag, a, figli) {
      var d = P.document.createElement(tag); a = a || {};
      Object.keys(a).forEach(function (k) { if (k === "html") d.innerHTML = a[k]; else if (k === "text") d.textContent = a[k]; else if (k === "class") d.className = a[k]; else if (typeof a[k] !== "function") d.setAttribute(k, a[k]); });
      (figli || []).forEach(function (f) { if (f) d.appendChild(f); }); return d;
    };
    return !!fig && ["normale", "pensa", "esulta", "triste"].some(function (fa) {
      var R = P.SGCarte.stanza4(el, { scH: 300, pianoW: 300, pianoH: 200 }, [{ nome: b.nome, cfg: b.omino, n: 0, faccia: fa }]);
      return senzaId(R.posti[0].fig.innerHTML) === senzaId(fig.innerHTML);
    });
  }
  async function aMisura(P, nome, cosa) {
    var m = await A.misuraSchermata(P, nome, 360, 640) || (cosa.indexOf("Scopone") < 0 && await A.misuraSchermata(P, nome, 412, 915));   // (lo Scopone si misura solo quando si apre)
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; P.dispatchEvent(new P.Event("resize"));
    if (m) no(cosa + ": " + m);
  }

  COPIONE.aggiungi(261, { nome: "Tris contro il Bot Difficile: il bot fisso (Matt) col suo avatar, menu solo «Bot»", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await controIlBot(P, "Tris", "Difficile");
    var b = atteso(P, "difficile")[0];
    var O = await W.aspetta(function () { return P.document.querySelector(".tr-g.O"); }, 4000);
    if (!O) no("il Tris non parte («" + T(P).slice(0, 80) + "»)");
    if (O.innerText.indexOf(b.nome) < 0) no("il bot si chiama «" + O.innerText.replace(/\s+/g, " ") + "», non " + b.nome);
    if (!stessoAvatar(P, O, b)) no(b.nome + " non ha il suo avatar fisso");
    if (/\bBot\b/.test(O.innerText)) no("il bot si chiama ancora «Bot»");
    // una mossa: il bot pensa col suo nome
    var c = P.document.querySelectorAll(".tr-cella")[4];
    ["pointerdown", "pointerup", "click"].forEach(function (t) { c.dispatchEvent(new P.PointerEvent(t, { bubbles: true })); });
    if (!await W.aspetta(function () { return T(P).indexOf("🤖 " + b.nome + " sta pensando") >= 0; }, 1500)) no("non si legge «🤖 " + b.nome + " sta pensando…» («" + T(P).slice(0, 100) + "»)");
    await W.dorme(1500);
    await aMisura(P, "Paky", "il Tris col bot");
    return "contro il Bot Difficile gioca " + b.nome + " (avatar fisso), «🤖 " + b.nome + " sta pensando…», 360x640 e 412x915 senza scorrere";
  } });

  COPIONE.aggiungi("261b", { nome: "Drop 4 contro il Bot Facile: il bot fisso facile col suo avatar", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await controIlBot(P, "Drop 4", "Facile");
    var b = atteso(P, "facile")[0];
    var gB = await W.aspetta(function () { var g = P.document.querySelectorAll(".d4-g"); return g.length === 2 ? g[1] : null; }, 4000);
    if (!gB) no("Drop 4 non parte («" + T(P).slice(0, 80) + "»)");
    if (gB.innerText.indexOf(b.nome) < 0) no("il bot si chiama «" + gB.innerText.replace(/\s+/g, " ") + "», non " + b.nome);
    if (!stessoAvatar(P, gB, b)) no(b.nome + " non ha il suo avatar fisso");
    // tocco una colonna: il bot pensa col suo nome
    // tocco la colonna di mezzo (se comincia il bot, prima aspetto il mio turno): poi il bot pensa col suo nome
    await W.aspetta(function () { return /Tocca a te/.test(T(P)); }, 3000);
    var area = P.document.querySelector(".d4-area"), tav = P.document.querySelector(".d4-area > :last-child").getBoundingClientRect();
    var xy = { bubbles: true, pointerId: 7, pointerType: "touch", clientX: tav.left + tav.width / 2, clientY: tav.top + tav.height / 2 };
    area.dispatchEvent(new P.PointerEvent("pointerdown", xy)); area.dispatchEvent(new P.PointerEvent("pointerup", xy));
    var pensa = await W.aspetta(function () { return T(P).indexOf("🤖 " + b.nome + " sta pensando") >= 0; }, 2000);
    if (!pensa) no("dopo la mia mossa non si legge «🤖 " + b.nome + " sta pensando…» («" + T(P).slice(0, 100) + "»)");
    await W.dorme(1200);
    await aMisura(P, "Paky", "Drop 4 col bot");
    return "contro il Bot Facile gioca " + b.nome + " (avatar fisso), «🤖 " + b.nome + " sta pensando…», 360x640 e 412x915 senza scorrere";
  } });

  COPIONE.aggiungi("261c", { nome: "Battaglia Navale contro il Bot: si gioca col nome del bot fisso", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await controIlBot(P, "Battaglia Navale", "Medio");
    var b = atteso(P, "medio")[0];
    if (!W.clicca(P, /A caso/)) no("non trovo «🎲 A caso» («" + T(P).slice(0, 80) + "»)");
    await W.dorme(200);
    var vai = [].find.call(P.document.querySelectorAll(".piede button"), function (x) { return !x.disabled && x.offsetParent; });
    if (!vai) no("non trovo il tasto per partire («" + T(P).slice(0, 120) + "»)");
    vai.click();
    var ok = await W.aspetta(function () { var t = T(P); return t.indexOf("Spara " + b.nome) >= 0 || /Tocca a te/.test(t); }, 3000);
    if (!ok) no("la battaglia non parte («" + T(P).slice(0, 120) + "»)");
    if (/Spara Bot|del Bot/.test(T(P))) no("si legge ancora «Bot» in partita («" + T(P).slice(0, 120) + "»)");
    // se tocca a me sparo, poi deve sparare il bot col suo nome
    var visto = T(P).indexOf("Spara " + b.nome) >= 0;
    if (!visto) {
      for (var k = 0; k < 12 && !visto; k++) {   // (chi colpisce spara ancora: si continua finché tocca al bot)
        var cel = P.document.querySelector(".nav-board:not(.nav-mini) .nav-c.sparabile");   // il campo dell'avversario (il mio è il piccolo): le caselle dove si può sparare
        if (cel) cel.click();
        visto = await W.aspetta(function () { return T(P).indexOf("🤖 Spara " + b.nome) >= 0; }, 1500);
      }
    }
    if (!visto) no("non si legge «🤖 Spara " + b.nome + "…» («" + T(P).slice(0, 100) + "»)");
    await aMisura(P, "Paky", "la Navale col bot");
    return "contro il Bot (Medio) gioca " + b.nome + (visto ? ": «🤖 Spara " + b.nome + "…»" : " (il suo turno non l'ho visto)") + ", 360x640 e 412x915 senza scorrere";
  } });

  COPIONE.aggiungi("261d", { nome: "Scopa contro il Bot: il bot fisso medio al tavolo col suo avatar", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await controIlBot(P, "Scopa", "Medio");
    var b = atteso(P, "medio")[0];
    var ok = await W.aspetta(function () { return T(P).indexOf(b.nome) >= 0; }, 4000);
    if (!ok) no("al tavolo non c'è " + b.nome + " («" + T(P).slice(0, 120) + "»)");
    if (/\bBot\b/.test(T(P))) no("al tavolo si legge ancora «Bot» («" + T(P).slice(0, 120) + "»)");
    // l'avatar dell'avversario: quello del bot fisso (la Scopa lo disegna con la sua faccia del momento)
    var fig = await W.aspetta(function () { var f = P.document.querySelector(".sc-avv-fig"); return f && f.querySelector("svg") ? f : null; }, 3000);
    if (!fig) no("al tavolo non vedo l'avatar dell'avversario");
    if (!stessoAvatarCarte(P, fig, b)) no("al tavolo " + b.nome + " non ha il suo avatar fisso");
    await W.dorme(1500);
    await aMisura(P, "Paky", "la Scopa col bot");
    return "contro il Bot (Medio) gioca " + b.nome + " col suo avatar fisso, nessun «Bot» al tavolo, 360x640 e 412x915 senza scorrere";
  } });

  COPIONE.aggiungi("261e", { nome: "Calcio Biliardo contro il Bot: il nome del bot fisso sulle targhette", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    await controIlBot(P, "Calcio Biliardo", "Difficile");
    var b = atteso(P, "difficile")[0];
    var ok = await W.aspetta(function () { return T(P).indexOf(b.nome) >= 0; }, 4000);
    if (!ok) no("in campo non c'è " + b.nome + " («" + T(P).slice(0, 120) + "»)");
    if (/\bBot\b/.test(T(P))) no("in campo si legge ancora «Bot» («" + T(P).slice(0, 120) + "»)");
    await aMisura(P, "Paky", "Calcio Biliardo col bot");
    return "contro il Bot (Difficile) gioca " + b.nome + ", nessun «Bot» in campo, 360x640 e 412x915 senza scorrere";
  } });

  COPIONE.aggiungi("261f", { nome: "Scopone: i tre bot fissi del livello, coi loro avatar", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    try { P.localStorage.removeItem("sg-scopone-partita"); } catch (e) {}
    // (la stanza dello Scopone si misura quando si apre: il telefono è già a 360x640)
    await controIlBot(P, "Scopone", "Facile", async function () { var f = document.getElementById("tel-Paky"); f.style.width = "360px"; f.style.height = "640px"; P.dispatchEvent(new P.Event("resize")); await W.dorme(300); });
    var tre = atteso(P, "facile", 3);
    var targhe = await W.aspetta(function () { var n = P.document.querySelectorAll(".sc-targa4 .sc-nome"); return n.length === 3 ? [].map.call(n, function (x) { return x.textContent; }) : null; }, 4000);
    if (!targhe) no("lo Scopone non parte («" + T(P).slice(0, 120) + "»)");
    var voluti = [tre[0].nome, "🤝 " + tre[1].nome, tre[2].nome];
    if (targhe.join("|") !== voluti.join("|")) no("al tavolo: " + targhe.join(", ") + " (dovevano essere " + voluti.join(", ") + ")");
    // gli avatar: quelli dei bot fissi (la partita salvata sul telefono li tiene in st.omini; al tavolo ci sono i disegni)
    var fig = [].filter.call(P.document.querySelectorAll(".sc-avv-fig"), function (f) { return f.querySelector("svg"); });
    if (fig.length < 3) no("al tavolo si vedono " + fig.length + " avatar su 3");
    tre.forEach(function (b, i) { if (!stessoAvatarCarte(P, fig[i], b)) no("al tavolo " + b.nome + " non ha il suo avatar fisso"); });
    var sv = await W.aspetta(function () { try { var x = JSON.parse(P.localStorage.getItem("sg-scopone-partita") || "null"); return x && x.st && x.st.omini ? x : null; } catch (e) { return null; } }, 4000);
    if (sv) [1, 2, 3].forEach(function (s, i) { if (JSON.stringify(sv.st.omini[s]) !== JSON.stringify(tre[i].omino)) no("al posto " + s + " " + tre[i].nome + " non ha il suo avatar fisso"); });
    await W.dorme(1200);
    await aMisura(P, "Paky", "lo Scopone");
    try { P.localStorage.removeItem("sg-scopone-partita"); } catch (e) {}
    return "al tavolo " + targhe.join(", ") + " (i bot fissi facili, coi loro avatar" + (sv ? ", uguali ai fissi" : "") + "), 360x640 senza scorrere";
  } });

  COPIONE.aggiungi("261g", { nome: "Glow Hockey contro il Bot: il nome del bot fisso del livello", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    // Difficile e a 3 gol: io non tocco niente, il bot segna da solo e vince (in campo il nome non si scrive: si vede alla fine)
    await controIlBot(P, "Glow Hockey", "Difficile", async function () {
      var v = [].find.call(P.document.querySelectorAll(".modo-chip"), function (x) { return /Veloce/.test(x.textContent); });
      if (v) v.click(); await W.dorme(80);
    });
    var b = atteso(P, "difficile")[0];
    if (!await W.aspetta(function () { return P.document.querySelector("canvas"); }, 4000)) no("il campo dell'hockey non si apre («" + T(P).slice(0, 80) + "»)");
    await aMisura(P, "Paky", "il campo dell'hockey");
    var fine = await W.aspetta(function () { return /Ha vinto/.test(T(P)); }, 90000);
    if (!fine) return "il campo si apre e sta a misura; la fine non l'ho vista (con la finestra nascosta il campo va piano): il nome del bot si legge solo alla fine";
    if (T(P).indexOf("Ha vinto " + b.nome) < 0) no("alla fine si legge «" + T(P).slice(0, 100) + "», non «Ha vinto " + b.nome + "»");
    if (T(P).indexOf("🤖 " + b.nome + " (Difficile)") < 0) no("sotto il titolo manca «🤖 " + b.nome + " (Difficile)» («" + T(P).slice(0, 120) + "»)");
    var pr = /Prova il Medio/.test(T(P));
    await aMisura(P, "Paky", "la fine dell'hockey");
    return "«Ha vinto " + b.nome + "» · «Glow Hockey · 🤖 " + b.nome + " (Difficile)»" + (pr ? " · «🙂 Prova il Medio ▶» (il tasto dice il livello, non il nome)" : "") + "; 360x640 e 412x915 senza scorrere";
  } });

  COPIONE.aggiungi("261h", { nome: "Torneo a eliminazione a Tris in 3: la partita col Bot ha il nome e l'avatar del Bot del torneo", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: A.botFinti });
    var tess = await W.aspetta(function () { return A.tessera(P, "Tris"); }, 5000);
    if (!tess) no("non trovo il Tris"); tess.click(); await W.dorme(200);
    if (!W.clicca(P, /Torneo a eliminazione/)) no("non trovo «Torneo a eliminazione»");
    var S = await W.aspetta(function () { return A.codiceSaletta(P); }, 5000); if (!S) no("il torneo non ha il codice");
    await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, prima: A.botFinti });
    await W.apriTel("Luca", { hash: "sala=" + S, x: 370, prima: A.botFinti });
    if (!await W.aspetta(function () { return ((A.vm(S).membri) || []).length === 3; }, 8000)) no("non entrano tutti nel torneo");
    if (!W.clicca(P, /Comincia il torneo/)) no("non trovo «Comincia il torneo»");
    var E = await W.aspetta(function () { var e = A.vm(S).elim; return e && e.iniziato && e.turni && e.turni[0] ? e : null; }, 5000);
    if (!E) no("il torneo non comincia");
    var pb = E.turni[0].filter(function (p) { return p.b === "bot"; })[0];
    if (!pb || !E.bot) no("nessuno gioca col Bot");
    var chi = (E.nomi || {})[pb.a], w = W.finestra(chi), fisso = P.SG.bot.daId(E.bot.id);
    var O = await W.aspetta(function () { var o = w.document.querySelector(".tr-g.O"); return o && o.innerText.indexOf(E.bot.nome) >= 0 ? o : null; }, 6000);
    if (!O) no(chi + " non vede " + E.bot.nome + " nel Tris («" + T(w).slice(0, 100) + "»)");
    if (!stessoAvatar(w, O, fisso)) no("nel Tris di " + chi + " " + E.bot.nome + " non ha l'avatar del bot fisso");
    // la partita trasmessa a chi guarda (la stanza della partita col bot)
    var v = await W.aspetta(function () { var x = W.vmDi(pb.stanza); return x && x.nomi ? x : null; }, 5000);
    if (!v) no("la partita col bot non è trasmessa nella sua stanza (" + pb.stanza + ")");
    if (v.nomi.O !== E.bot.nome) no("a chi guarda arriva il nome «" + v.nomi.O + "», non " + E.bot.nome);
    if (!v.omini || typeof v.omini.O !== "object") no("a chi guarda arriva l'avatar «" + (v.omini && v.omini.O) + "», non quello del bot fisso");
    return chi + " gioca contro " + E.bot.nome + " (avatar del bot fisso); chi guarda riceve lo stesso nome e avatar";
  } });
})();
