// PROVE DI «IL PREZZO È GIUSTO!» (js/games/prezzo.js, prezzo-scena.js, prezzo-premi-piu.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("prezzo/base.js"); await COPIONE.prova("pz1")
//
// pz1: le regole senza grafica (Offerta senza sforare e col margine del 2%, pari merito, PREZZO GIUSTO, «+1 €» cattivo,
//      tutti sopra, Solo il prezzo sopra o sotto, ultimo doppio, Ruota del 100, piano delle puntate, i prodotti e le vetrine).
// pz2: «🤖 Contro il Bot» (diretto: due tocchi), 📺 Come in TV ⚡ Veloce: dalla home alla fine (Offerte, Più o meno, Ruota, Vetrina, carrello, classifica del core).
// pz3: «🤖 Contro il Bot», 🎯 Solo il prezzo ⚡ Veloce (6 oggetti, l'ultimo doppio), offerte segrete.
// pz4: sullo stesso telefono in 3, 📺 ⚡ Veloce: a turno («📱 Sono Luca, tocca a me»), ruota a turno, vetrina passandosi il telefono.
// pz5: online nella Sala con 3 telefoni, 📺 ⚡ Veloce a vista: partita intera, il «+1 €» cattivo, Luca ricarica mentre si offre,
//      Rivincita col 3-2-1.
// pz6: online nella Sala con 8 telefoni, 🎯 Solo il prezzo ⚡ Veloce: partita intera, uno spegne il telefono più di 20 s e torna.
// pz7: online in 3: chi arriva tardi entra al prossimo oggetto; l'host ricarica (dal 17 ott la partita RIPRENDE, stesso codice:
//      nessuno passa dalla saletta, Sara resta in partita coi suoi punti; le prove della ripresa sono in passo5/prezzo.js).
// pz8: le misure: 360x640 e 412x915 in ogni passo (niente scorre, il maxischermo si vede tutto sopra il pannello).
// pz9: online nella Sala con 8 telefoni, 📺 Come in TV ⚡ Veloce (8 leggii, Ruota e Vetrina in 8).
// pz10: «🤖 Contro il Bot» con un secondo gioco a premi finto: chi vince l'Offerta sceglie tra due.
// pz11: «🤖 Contro il Bot» parte in due tocchi (gioco → Contro il Bot, niente impostazioni) con le regole di partenza.
// pz13: le foto vere (data/prezzo-foto.js): scritte bene, quasi tutti i prodotti ne hanno una (gli altri l'emoji), la scheda e la Vetrina le mostrano.
// pz12: la Ruota del 100 si gira anche in su (la striscia sale) e il mio numero sul maxischermo resta «—» finché la ruota
//       gira: compare solo quando si ferma, col pannello della ruota ancora aperto.
// (pz8 a una misura sola: W.__pz8misure = [[360, 640]])
// Le regole della partita per la prova: w.__imp (le legge solo chi apre, all'avvio), con apriTel(nome, { spiaPrezzo: true }).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- la spia: le regole della prova (w.__imp) entrano nelle impostazioni del gioco ----
  if (!W.__prepPrezzo) {
    W.__prepPrezzo = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepPrezzo(w, nome, opz);
      if (!opz || !opz.spiaPrezzo) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "prezzo" && !g.__spiato) {
            g.__spiato = true; w.__gPrezzo = g; var av = g.avvia;
            g.avvia = function (t) { if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; }); w.__tP = t; return av.apply(this, arguments); };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---------------- il giocatore automatico ----------------
  // H = lo stato vero (dal telefono che tiene la partita): serve per sapere i prezzi e giocare "bene"
  function Hdi(nomeHost) { var w = W.finestra(nomeHost || "Paky"); return w && w.__prezzoH; }
  function visibile(e) { return e && e.offsetParent !== null && e.getBoundingClientRect().height > 0; }
  function tocca(w, b) { if (!b) return false; b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" })); return true; }
  function tasto(w, tx) { return [].filter.call(w.document.querySelectorAll(".pz-pan.su .pz-k"), function (x) { return x.textContent.trim() === tx; })[0]; }
  function scrivi(w, v) {
    var conV = !!tasto(w, ","), s;
    if (conV && Math.round(v * 100) % 100) s = String(Math.floor(v)) + "," + String(Math.round(v * 100) % 100).padStart(2, "0").replace(/0$/, "");
    else s = String(Math.max(1, Math.round(v)));
    for (var i = 0; i < 9; i++) tocca(w, tasto(w, "⌫"));
    s.split("").forEach(function (c) { tocca(w, tasto(w, c)); });
    var ok = w.document.querySelector(".pz-pan.su .pz-ok");
    if (!ok || ok.disabled) return false;
    return tocca(w, ok);
  }
  // spinge la ruota col dito (in giù, veloce)
  async function spingi(w) {
    var r = w.document.querySelector(".pz-pan.su .pz-ruota.attiva"); if (!r) return false;
    var b = r.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + 20;
    function ev(t, yy) { r.dispatchEvent(new w.PointerEvent(t, { bubbles: true, pointerId: 7, pointerType: "touch", clientX: x, clientY: yy })); }
    ev("pointerdown", y);
    for (var k = 1; k <= 5; k++) { await W.dorme(18); ev("pointermove", y + k * 45); }
    ev("pointerup", y + 225);
    return true;
  }
  var STATO = {};   // memoria del giocatore automatico (per telefono): Più o meno
  // un passo del giocatore automatico su un telefono: fa quello che c'è da fare (true se ha fatto qualcosa)
  async function agisci(nome, opz) {
    opz = opz || {};
    if (opz.salta && opz.salta(nome)) return false;   // (una prova vuole che questo telefono aspetti)
    var w = W.finestra(nome); if (!w || !w.document) return false;
    var d = w.document, H = Hdi(opz.host);
    // sullo stesso telefono: «📱 Sono Luca, tocca a me ▶»
    var bTurno = d.querySelector(".st-barra.on button");
    if (bTurno && /tocca a me ▶/.test(bTurno.textContent) && W.clicca(w, /tocca a me ▶/, ".st-barra.on button")) { (W.__pzTurni = W.__pzTurni || []).push(bTurno.textContent.trim()); return true; }
    var pan = d.querySelector(".pz-pan.su");
    if (pan && H) {
      var ok = pan.querySelector(".pz-ok"), titolo = (pan.querySelector(".pz-pan-testa .tx") || {}).textContent || "";
      // Più o meno: prima una stima, poi giusto
      if (ok && /Prova/.test(ok.textContent) && !ok.disabled === false && ok.textContent === "…") return false;
      if (ok && /Prova!/.test(ok.textContent) && H.premio && H.premio.st && H.premio.st.prod) {
        var p = H.premio.st.prod.prezzo, k = (STATO[nome] = STATO[nome] || {}), n = (k[H.k] = (k[H.k] || 0) + 1);
        return scrivi(w, n === 1 ? p * (opz.bravo ? 1 : 0.6) : n === 2 ? p * 1.5 : p);
      }
      // (la Vetrina di questo telefono: quella sul maxischermo, rosa se è la misteriosa)
      if (ok && /Offro per tutto/.test(ok.textContent) && H.vet) { var VV = d.querySelector(".pz-vtit.mist") && H.vet.b ? H.vet.b : H.vet.v, tot = VV.pezzi.reduce(function (a, x) { return a + x.prezzo; }, 0); return scrivi(w, tot * (0.9 + Math.random() * 0.08)); }
      if (ok && /Offro!|Già preso|Sotto i/.test(ok.textContent) && H.prod) {
        var pr = H.prod.prezzo, v = opz.offerta ? opz.offerta(pr, H) : pr * (0.72 + Math.random() * 0.26);
        if (H.limite != null && v >= H.limite) v = H.limite * 0.7;
        v = pr < 20 ? Math.max(0.1, Math.round(v * 10) / 10) : Math.max(1, Math.round(v));
        if (scrivi(w, v)) return true;
        return scrivi(w, v + (pr < 20 ? 0.3 : 3));
      }
      if (pan.querySelector(".pz-ruota.attiva")) return spingi(w);
      var sc = [].filter.call(pan.querySelectorAll(".pz-sc"), function (b) { return !b.disabled; });
      if (sc.length) {
        // la Vetrina misteriosa: opz.mist = true / false / function (nome), se no a caso
        if (/Tieni o cambi/.test(titolo)) { var mm = typeof opz.mist === "function" ? opz.mist(nome) : opz.mist; sc[(mm == null ? Math.random() < 0.5 : mm) ? 1 : 0].click(); return true; }
        if (/E adesso\?/.test(titolo)) { var m =/Hai fatto (\d+)/.exec(titolo), v1 = m ? +m[1] : 50; sc[v1 < 55 ? 0 : 1].click(); return true; }
        sc[0].click(); return true;
      }
    }
    if (opz.avanti !== false) { var av = d.querySelector(".st-barra.on .pz-avanti:not([disabled])"); if (av) { av.click(); return true; } }
    return false;
  }
  // tutti i telefoni giocano finché la partita (stanza C, o H del telefono host) non è finita
  async function giocaTutti(nomi, finito, opz) {
    opz = opz || {};
    var fino = Date.now() + (opz.ms || 420000), giri = 0;
    while (Date.now() < fino) {
      if (finito()) return true;
      for (var i = 0; i < nomi.length; i++) { try { await agisci(nomi[i], opz); } catch (e) {} }
      if (opz.ognuno) try { await opz.ognuno(++giri); } catch (e) { throw e; }
      await W.dorme(opz.passo || 400);
    }
    return finito();
  }
  // le fasi viste dall'host (per controllare che la puntata passi da tutti i momenti)
  function spiaFasi(nomeHost) {
    var viste = [], w = W.finestra(nomeHost);
    var id = setInterval(function () { var H = w && w.__prezzoH; if (!H) return; var f = H.fase + (H.sotto ? "." + H.sotto : ""); if (viste[viste.length - 1] !== f) viste.push(f); }, 100);
    return { viste: viste, ferma: function () { clearInterval(id); } };
  }
  function errori() { var e = W.erroriTel(); return e.length ? " · ERRORI: " + e.slice(0, 3).join(" / ") : ""; }

  // ---------------- apertura dei modi ----------------
  async function apriGioco(w) {
    var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 5000);
    if (!tess) no("in home non c'è la tessera del Prezzo è Giusto");
    tess.click(); await W.dorme(300);
  }
  async function contrBot(imp, nome) {
    nome = nome || "Paky";
    var w = await W.apriTel(nome, { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = imp; } });
    await apriGioco(w);
    if (!W.clicca(w, /Contro il Bot/)) no("in «Come giocate?» non c'è «🤖 Contro il Bot» (" + T(w).slice(0, 120) + ")");
    // «🤖 Contro il Bot» è diretto: due tocchi dalla home (gioco → Contro il Bot) e si parte, senza le impostazioni
    // (le regole della prova arrivano da w.__imp, messe dalla spia all'avvio)
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita col Bot non parte al secondo tocco (" + T(w).slice(0, 160) + ")");
    return w;
  }
  async function stessoTelefono(amici, imp) {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = imp; } });
    await apriGioco(w);
    if (!W.clicca(w, /Su questo telefono/)) no("non c'è «📱 Su questo telefono»");
    await W.dorme(300);
    for (var i = 0; i < amici.length; i++) {
      if (!W.clicca(w, /Aggiungi giocatore/)) no("non c'è «＋ Aggiungi giocatore» (" + T(w).slice(0, 160) + ")");
      await W.dorme(200);
      var inp = [].filter.call(w.document.querySelectorAll("input[placeholder^='Giocatore']"), function (x) { return !x.value; }).pop();
      if (!inp) no("non trovo dove scrivere il nome dell'amico (" + T(w).slice(0, 160) + ")");
      inp.value = amici[i]; inp.dispatchEvent(new w.Event("input", { bubbles: true })); inp.dispatchEvent(new w.Event("change", { bubbles: true }));
      await W.dorme(150);
    }
    if (!W.clicca(w, /Avanti ▶/)) no("non trovo «Avanti ▶» nella sala (" + T(w).slice(0, 160) + ")");
    await W.dorme(300);
    return w;
  }

  // ===================== pz1: le regole =====================
  COPIONE.aggiungi("pz1", { nome: "Prezzo: le regole senza grafica e i prodotti", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), P = w.__prezzo, Z = w.SGPrezzoScena, note = [];
    if (!P || !Z) no("non vedo le regole (window.__prezzo) o la scena (SGPrezzoScena)");
    // i prezzi all'italiana
    [[1129, "1.129 €"], [6.99, "6,99 €"], [0.3, "0,30 €"], [15950, "15.950 €"], [2, "2 €"], [1.25, "1,25 €"], [240000, "240.000 €"]].forEach(function (x) { if (Z.fmtE(x[0]) !== x[1]) no("fmtE(" + x[0] + ") = " + Z.fmtE(x[0]) + " invece di " + x[1]); });
    // Offerta come in TV: senza sforare, margine 2% (o un passo)
    var e = P.esitoOfferta(300, { a: 270, b: 304, c: 312, d: 285 }, { senzaSforare: true, n: 4, ordine: ["a", "b", "c", "d"] });
    var r = {}; e.righe.forEach(function (x) { r[x.id] = x; });
    if (!r.b.giusto || r.b.pos !== 1 || r.b.punti !== 800) no("304 su 300 (dentro il 2%): doveva vincere col PREZZO GIUSTO (800): " + JSON.stringify(r.b));
    if (!r.c.sopra || r.c.punti) no("312 su 300: sforato, 0 punti: " + JSON.stringify(r.c));
    if (r.d.pos !== 2 || r.d.punti !== 150 || r.a.pos !== 3 || r.a.punti !== 75) no("posti 2° (285) e 3° (270, con 4 giocatori): " + JSON.stringify([r.d, r.a]));
    var e3 = P.esitoOfferta(100, { a: 90, b: 95, c: 80 }, { senzaSforare: true, n: 3 });
    if (e3.righe.filter(function (x) { return x.id === "c"; })[0].punti !== 0) no("in 3 il terzo non prende punti");
    // pari merito
    var ep = P.esitoOfferta(500, { a: 450, b: 450, c: 300 }, { senzaSforare: true, n: 3 });
    if (ep.vince.length !== 2 || ep.righe.filter(function (x) { return x.id === "c"; })[0].pos !== 3) no("pari merito: due primi e il terzo al 3° posto: " + JSON.stringify(ep.righe));
    // tutti sopra
    var es = P.esitoOfferta(50, { a: 60, b: 70 }, { senzaSforare: true, n: 2 });
    if (!es.tuttiSopra || es.vince.length) no("tutti sopra: " + JSON.stringify(es));
    // il «+1 €» cattivo: b arriva dopo a e dice 1 € in più
    var ec = P.esitoOfferta(1000, { a: 800, b: 801, c: 500 }, { senzaSforare: true, n: 3, ordine: ["a", "c", "b"] });
    if (!ec.cattivo || ec.cattivo.chi !== "b" || ec.cattivo.a !== "a") no("«+1 €» cattivo non visto: " + JSON.stringify(ec.cattivo));
    var ec2 = P.esitoOfferta(1000, { a: 800, b: 801 }, { senzaSforare: true, n: 2, ordine: ["b", "a"] });
    if (ec2.cattivo) no("«+1 €» se b aveva offerto PRIMA di a non è cattiveria");
    var ec3 = P.esitoOfferta(10, { a: 8.5, b: 8.6 }, { senzaSforare: true, n: 2, ordine: ["a", "b"] });
    if (!ec3.cattivo) no("+0,10 € sui prodotti coi centesimi: cattiveria non vista");
    // Solo il prezzo: sopra o sotto, ultimo doppio
    var eo = P.esitoOfferta(200, { a: 210, b: 185, c: 150 }, { senzaSforare: false, n: 3, molt: 2 });
    var ro = {}; eo.righe.forEach(function (x) { ro[x.id] = x; });
    if (ro.a.pos !== 1 || ro.a.punti !== 600 || ro.b.pos !== 2 || ro.b.punti !== 300) no("Solo il prezzo, sopra o sotto, doppio: " + JSON.stringify(eo.righe));
    // Ruota del 100
    var er = P.esitoRuota({ a: { v1: 60, v2: 40 }, b: { v1: 95 }, c: { v1: 70, v2: 35 }, d: { v1: 20, v2: 60 } }, ["a", "b", "c", "d"]);
    var rr = {}; er.righe.forEach(function (x) { rr[x.id] = x; });
    if (!rr.a.cento || rr.a.punti !== 500 || rr.b.punti !== 100 || !rr.c.out || rr.c.punti || rr.d.punti !== 50) no("Ruota: " + JSON.stringify(er.righe));
    if (P.puntiBonus(100) !== 300 || P.puntiBonus(5) !== 150 || P.puntiBonus(15) !== 150 || P.puntiBonus(50)) no("giro bonus");
    // il piano delle puntate
    var conta = function (p, x) { return p.filter(function (y) { return y === x; }).length; };
    var pv = P.piano("tv", "veloce", 1), pp = P.piano("tv", "puntata", 1), pl = P.piano("tv", "lunga", 1), p0 = P.piano("tv", "puntata", 0);
    if (conta(pv, "offerta") !== 2 || conta(pp, "offerta") !== 3 || conta(pl, "offerta") !== 4 || conta(pl, "ruota") !== 2 || conta(pv, "vetrina") !== 1) no("piano TV: " + pv.join(",") + " / " + pl.join(","));
    if (conta(p0, "premio")) no("senza giochi a premi non ci sono passi «premio»");
    var so = P.piano("solo", "veloce"), sp = P.piano("solo", "puntata"), sl = P.piano("solo", "lunga");
    if (conta(so, "oggetto") !== 6 || conta(sp, "oggetto") !== 10 || conta(sl, "oggetto") !== 15 || conta(so, "vetrina") || so[so.length - 1] !== "fine") no("piano Solo: " + so.join(","));
    if (so.join(",").indexOf("punti,punti") >= 0) no("due classifiche di fila: " + so.join(","));
    // i prodotti e le vetrine
    var L = P.prodotti(), V = P.vetrine(), male = [];
    if (L.length < 450) no("pochi prodotti: " + L.length);
    if (V.length < 20) no("poche vetrine: " + V.length);
    var ids = {};
    L.forEach(function (p) { if (ids[p.id]) male.push("doppio " + p.id); ids[p.id] = 1; if (!(p.prezzo > 0) || !p.e || !p.nome) male.push(p.id); });
    if (male.length) no("prodotti da sistemare: " + male.slice(0, 5).join(" | "));
    if (L.filter(function (p) { return p.prezzo >= 20 && p.prezzo <= 2000; }).length < 40) no("pochi prodotti per «Più o meno»");
    // il bot sbaglia di più se è facile
    var med = function (liv) { var s = 0; for (var i = 0; i < 400; i++) s += Math.abs(Math.log(P.stimaBot(1000, liv, false) / 1000)); return s / 400; };
    var mf = med("facile"), mm = med("medio"), md = med("difficile");
    if (!(mf > mm && mm > md)) no("errore del Bot: facile " + mf.toFixed(2) + " medio " + mm.toFixed(2) + " difficile " + md.toFixed(2));
    // la riga «📜 Si gioca così»
    var g = null; w.SG && (g = (w.SG.giochi || []).filter ? null : null);
    return L.length + " prodotti, " + V.length + " vetrine, regole ok" + note.join(" ");
  } });

  // ===================== pz2: contro il Bot, come in TV =====================
  COPIONE.aggiungi("pz2", { nome: "Prezzo: 🤖 Contro il Bot, 📺 Come in TV ⚡ Veloce, dall'inizio alla fine", fai: async function () {
    var w = await contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "difficile", nBot: 3 });
    var spia = spiaFasi("Paky");
    var ok = await giocaTutti(["Paky"], function () { return /Rivincita|Nuova partita|Gioca ancora|Classifica|🏆/.test(T(w)) && w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 400000 });
    spia.ferma();
    var viste = spia.viste.join(" → ");
    if (!ok) no("la partita col Bot non arriva alla fine (fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + "; viste " + viste + ")");
    ["apertura", "offerta.prodotto", "offerta.offri", "offerta.rivela", "premio.gioca", "premio.riv", "punti", "ruota.giro1", "ruota.decidi", "ruota.riv", "vetrina.mostra", "vetrina.scegli", "vetrina.offri", "vetrina.riv", "carrello", "fine"].forEach(function (f) {
      if (spia.viste.indexOf(f) < 0) no("la puntata non è passata da «" + f + "» (" + viste + ")");
    });
    var H = w.__prezzoH;
    if (H.players.length !== 4 || !H.players.slice(1).every(function (p) { return p.bot; })) no("non siamo tu + 3 Bot");
    if (!H.classifica || H.classifica.length !== 4) no("classifica finale: " + JSON.stringify(H.classifica));
    return "viste: " + viste + " · classifica: " + H.classifica.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + errori();
  } });

  // ===================== pz3: contro il Bot, solo il prezzo =====================
  COPIONE.aggiungi("pz3", { nome: "Prezzo: 🤖 Contro il Bot, 🎯 Solo il prezzo ⚡ Veloce, offerte segrete", fai: async function () {
    var w = await contrBot({ formato: "solo", durata: "veloce", offerte: "segrete", liv: "medio", nBot: 1 });
    var spia = spiaFasi("Paky"), doppio = false, segreteOk = true;
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 300000, ognuno: function () {
      var H = w.__prezzoH;
      if (H.doppio) doppio = true;
      // offerte segrete: sul tabellone niente prezzi degli altri finché si offre
      if (H.fase === "offerta" && H.sotto === "offri") { var v = [].map.call(w.document.querySelectorAll(".pz-och .v"), function (x) { return x.textContent; }).join(" "); if (/€/.test(v)) segreteOk = false; }
    } });
    spia.ferma();
    if (!ok) no("Solo il prezzo col Bot non finisce (" + spia.viste.join(" → ") + ")");
    var H = w.__prezzoH;
    if (H.iOff !== 6) no("oggetti giocati: " + H.iOff);
    if (!doppio) no("l'ultimo oggetto non era doppio");
    if (!segreteOk) no("con le offerte segrete si vedevano i prezzi sul tabellone");
    if (spia.viste.some(function (f) { return /premio|ruota|vetrina/.test(f); })) no("in «Solo il prezzo» c'erano giochi a premi, Ruota o Vetrina");
    if (H.players.length !== 2) no("1 Bot: giocatori " + H.players.length);
    return "viste: " + spia.viste.join(" → ") + errori();
  } });

  // ===================== pz4: sullo stesso telefono =====================
  COPIONE.aggiungi("pz4", { nome: "Prezzo: 📱 sullo stesso telefono in 3, 📺 ⚡ Veloce, a turno", fai: async function () {
    var w = await stessoTelefono(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "segrete" });
    if (!await W.aspetta(function () { return W.clicca(w, /Comincia/); }, 4000)) no("non trovo «Comincia» (" + T(w).slice(0, 200) + ")");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita non comincia (" + T(w).slice(0, 200) + ")");
    var H = w.__prezzoH;
    if (H.players.length !== 3) no("giocatori: " + H.players.map(function (p) { return p.nome; }));
    var spia = spiaFasi("Paky"); W.__pzTurni = [];
    // (10 minuti: dal 23 ott sullo stesso telefono ognuno sceglie anche la vetrina, al suo turno)
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 600000 });
    spia.ferma();
    var passaggi = W.__pzTurni.length, chi = {}; W.__pzTurni.forEach(function (x) { var m = /Sono (\S+)/.exec(x); if (m) chi[m[1]] = 1; });
    if (Object.keys(chi).length !== 3) no("il telefono non è passato a tutti e tre: " + Object.keys(chi).join(", "));
    if (!ok) no("sullo stesso telefono la partita non finisce (" + spia.viste.join(" → ") + ", fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + ")");
    if (passaggi < 9) no("passaggi del telefono troppo pochi: " + passaggi);
    if (spia.viste.indexOf("ruota.turni") < 0) no("la ruota non era a turno");
    return passaggi + " passaggi del telefono · viste: " + spia.viste.join(" → ") + errori();
  } });

  // ===================== online nella Sala =====================
  async function salaPrezzo(amici, imp, nomeHost) {
    var S0 = await A.salaConAmici(amici), P = S0.w.Paky;
    // l'host con la spia (le regole della prova): si riapre il telefono? No: la spia si mette ai telefoni nuovi. Qui basta
    // cambiare le regole nella saletta con ⚙️: più semplice, le scegliamo col tocco sulle chip prima di cominciare.
    var C = await A.lanciaDallaSala("Paky", S0.S, "Il Prezzo è Giusto!");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === amici.length + 1; }, 15000)) no("nella saletta del gioco non ci sono tutti (" + (vm(C).players || []).map(function (p) { return p.nome; }) + ")");
    // le regole della prova, nella partita dell'host (prima di cominciare: come «⚙️ Regole»)
    if (imp && P.__tP && P.__tP.onRegole) { Object.keys(imp).forEach(function (k) { P.__tP.impostazioni[k] = imp[k]; }); P.__tP.onRegole(P.__tP.impostazioni); }
    else if (imp) no("la spia delle regole non c'è (apri i telefoni con spiaPrezzo)");
    await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("l'host non trova «Comincia» (" + T(P).slice(0, 120) + ")");
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 12000)) no("la partita non comincia");
    return { C: C, S: S0.S, w: S0.w, P: P };
  }
  // i telefoni della Sala con la spia
  function conSpia() { if (!W.__apriTelVero) { W.__apriTelVero = W.apriTel; W.apriTel = function (n, o) { return W.__apriTelVero(n, Object.assign({ spiaPrezzo: true }, o || {})); }; } }
  function senzaSpia() { if (W.__apriTelVero) { W.apriTel = W.__apriTelVero; W.__apriTelVero = null; } }

  COPIONE.aggiungi("pz5", { nome: "Prezzo online nella Sala in 3: 📺 ⚡ Veloce a vista, «+1 €», chi ricarica, Rivincita", fai: async function () {
    conSpia();
    try {
      var X = await salaPrezzo(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [];
      var spia = spiaFasi("Paky"), ricaricato = false, cattivo = false, presoVisto = false;
      // Sara fa il «+1 €» su Luca (offre dopo di lui, un euro in più); Luca ricarica la pagina mentre si offre la seconda volta
      var offerta = function (pr, H) { return pr * 0.8; };
      var ok = await giocaTutti(["Paky", "Luca", "Sara"], function () { return vm(C).fase === "fine"; }, { ms: 420000,
        offerta: function (pr, H) { var off = H.off || {}, l = Object.keys(off); if (l.length) { var mx = Math.max.apply(null, l.map(function (id) { return off[id]; })); if (mx < pr) return mx + (pr < 20 ? 0.1 : 1); } return pr * 0.8; },
        ognuno: async function () {
          var H = P.__prezzoH;
          if (H.esito && H.esito.cattivo) cattivo = true;
          if (!ricaricato && H.fase === "offerta" && H.sotto === "offri" && H.iOff === 2) {
            ricaricato = true;
            var w = await W.ricarica("Luca");
            if (!await W.aspetta(function () { return w.document.querySelector(".st-vista"); }, 12000)) note.push("Luca dopo la ricarica non torna nello studio");
          }
        } });
      spia.ferma();
      if (!ok) no("la partita online non finisce (fase " + vm(C).fase + "." + vm(C).sotto + "; " + spia.viste.join(" → ") + ")");
      if (!ricaricato) note.push("(niente ricarica: la seconda offerta non è arrivata)");
      if (!cattivo) note.push("(il «+1 €» cattivo non è uscito in questa partita)");
      // fine: i tasti del core
      var t0f = Date.now();
      await W.aspetta(function () { var x = A.tastiFineDi(P); return x && x.some(function (y) { return /Rivincita/.test(y); }); }, 40000);
      note.push("(fine dopo " + Math.round((Date.now() - t0f) / 100) / 10 + " s)");
      var tf = A.tastiFineDi(P);
      if (!tf || !tf.some(function (x) { return /Rivincita/.test(x); })) no("l'host non ha «↻ Rivincita» a fine partita (" + JSON.stringify(tf) + " · " + T(P).slice(0, 120) + ")");
      var L = W.finestra("Luca");
      if (!A.tastiFineDi(L) || !A.tastiFineDi(L).some(function (x) { return /Ci sto/.test(x); })) note.push("Luca non ha «👍 Ci sto!» (" + JSON.stringify(A.tastiFineDi(L)) + ")");
      var cl = vm(C).classifica || [];
      if (cl.length !== 3) no("classifica: " + JSON.stringify(cl));
      // Rivincita: tutti di nuovo nella saletta e si riparte col 3-2-1
      W.clicca(P, /Rivincita/);
      ["Luca", "Sara"].forEach(function (n) { W.clicca(W.finestra(n), /Ci sto/); });
      if (!await W.aspetta(function () { return vm(C).fase === "lobby" || vm(C).fase === "apertura"; }, 15000)) no("la Rivincita non riporta in saletta (" + vm(C).fase + ")");
      if (!await W.aspetta(function () { return vm(C).fase === "apertura"; }, 20000)) note.push("dopo la Rivincita la partita non riparte da sola col 3-2-1 (fase " + vm(C).fase + ")");
      return "classifica " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + " · viste " + spia.viste.length + " passi " + note.join(" ") + errori();
    } finally { senzaSpia(); }
  } });

  COPIONE.aggiungi("pz6", { nome: "Prezzo online nella Sala in 8: 🎯 Solo il prezzo ⚡ Veloce, uno spegne il telefono e torna", fai: async function () {
    conSpia();
    try {
      var amici = ["Luca", "Sara", "Giulia", "Marco", "Bea", "Toni", "Ada"];
      var X = await salaPrezzo(amici, { formato: "solo", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [];
      var tutti = ["Paky"].concat(amici), spento = false, tornato = false, viaVisto = false;
      var ok = await giocaTutti(tutti.filter(function (n) { return n !== "Toni" || !spento || tornato; }), function () { return vm(C).fase === "fine"; }, { ms: 420000,
        ognuno: async function () {
          var H = P.__prezzoH;
          if (!spento && H.iOff === 2 && H.sotto === "offri") { spento = true; W.spegni("Toni"); }
          var t = H.players.filter(function (p) { return p.nome === "Toni"; })[0];
          if (t && t.via) viaVisto = true;
          if (spento && !tornato && viaVisto && H.iOff >= 3) { tornato = true; W.riaccendi("Toni"); }
        } });
      if (!ok) no("la partita in 8 non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      if (!viaVisto) note.push("Toni spento non è mai risultato «via» (più di 20 s)");
      var t = P.__prezzoH.players.filter(function (p) { return p.nome === "Toni"; })[0];
      if (tornato && t && t.via) no("Toni è tornato ma è ancora «via»");
      var cl = vm(C).classifica || [];
      if (cl.length !== 8) no("classifica in 8: " + cl.length);
      return "classifica " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + note.join(" ") + errori();
    } finally { senzaSpia(); }
  } });

  COPIONE.aggiungi("pz7", { nome: "Prezzo online: chi arriva tardi entra al prossimo oggetto; l'host ricarica e la partita riprende", fai: async function () {
    conSpia();
    try {
      var P = await W.apriTel("Paky", { x: 0, prima: function (w) { w.__imp = { formato: "solo", durata: "veloce" }; } });
      var C = await W.apriStanza(P, "Il Prezzo è Giusto!");
      await W.apriTel("Luca", { hash: "gioco=prezzo&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { return (vm(C).players || []).length === 2; }, 10000)) no("Luca non entra in saletta");
      if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
      if (!await W.aspetta(function () { return vm(C).fase === "offerta"; }, 25000)) no("non si arriva al primo oggetto");
      // Sara arriva a partita cominciata: guarda, col suo id nella foto, ed entra al prossimo oggetto
      var Sw = await W.apriTel("Sara", { hash: "gioco=prezzo&stanza=" + C, x: 370 });
      if (!await W.aspetta(function () { return (vm(C).arrivi || []).some(function (a) { return a.nome === "Sara"; }); }, 10000)) no("Sara arrivata tardi non è tra chi arriva (" + JSON.stringify(vm(C).arrivi) + ")");
      if (!await W.aspetta(function () { return /Entri al prossimo oggetto/.test(T(Sw)); }, 30000)) no("Sara non legge «Entri al prossimo oggetto» (" + T(Sw).slice(-160) + ")");
      await giocaTutti(["Paky", "Luca"], function () { return (vm(C).players || []).some(function (p) { return p.nome === "Sara"; }); }, { ms: 90000 });
      if (!(vm(C).players || []).some(function (p) { return p.nome === "Sara"; })) no("Sara non entra al prossimo oggetto");
      if (!await W.aspetta(function () { return Sw.document.querySelectorAll(".st-leggio").length === 3; }, 8000)) no("sul telefono di Sara i leggii non sono 3");
      // l'host ricarica: la partita riprende (stesso codice, niente saletta, Sara ancora in partita coi punti di prima)
      await W.dorme(900);
      var punti0 = JSON.stringify((vm(C).players || []).map(function (p) { return [p.nome, p.punti]; })), salette = {};
      await W.ricarica("Paky");
      var ok = await W.aspetta(function () {
        ["Luca", "Sara"].forEach(function (n) { if (W.finestra(n).document.querySelector(".saletta-schermo")) salette[n] = 1; });
        var v = vm(C);
        return (W.statoStanza(C) || {})._r && v.fase && v.fase !== "lobby" && (v.players || []).filter(function (p) { return !p.via; }).length === 3 &&
          JSON.stringify(v.players.map(function (p) { return [p.nome, p.punti]; })) === punti0;
      }, 20000);
      if (!ok) no("dopo la ricarica dell'host la partita non riprende con tutti e tre e gli stessi punti (fase " + vm(C).fase + ", " + JSON.stringify((vm(C).players || []).map(function (p) { return [p.nome, p.punti, !!p.via]; })) + ")");
      if (Object.keys(salette).length) no(Object.keys(salette).join(", ") + " è passato dalla saletta");
      return "Sara entra al prossimo oggetto; host ricarica → la partita riprende (" + vm(C).fase + ") con " + punti0 + errori();
    } finally { senzaSpia(); }
  } });

  // ===================== pz8: le misure =====================
  // dentro lo schermo del telefono: niente scorre, il contenuto del maxischermo sta sopra il pannello (o la barra), il pannello non è troppo alto
  function controllaVista(w) {
    var d = w.document, h = w.innerHeight, guai = [];
    if (d.scrollingElement.scrollHeight > h + 2) guai.push("la pagina scorre (" + d.scrollingElement.scrollHeight + ")");
    var pan = d.querySelector(".pz-pan.su"), barra = d.querySelector(".st-barra.on");
    var basso = h - (pan ? pan.offsetHeight : 0);
    if (pan && pan.offsetHeight > h * 0.66) guai.push("pannello alto " + pan.offsetHeight + " su " + h);
    var sch = d.querySelector(".st-sch-in .pz-sch");
    if (sch && !d.querySelector(".st-mondo.st-quieto")) return guai;   // (la telecamera non è sul maxischermo)
    if (sch) [].forEach.call(sch.querySelectorAll(".pz-scheda,.pz-riga,.pz-cl,.pz-car,.pz-vp,.pz-och,.pz-rg,.pz-rcard,.pz-rpag,.pz-conta,.pz-banner,.pz-gioco,.pz-intro,.pz-testa"), function (e) {
      var r = e.getBoundingClientRect(); if (!r.height) return;
      if (r.bottom > basso + 2) guai.push((e.className.split(" ")[0]) + " sotto il pannello (" + Math.round(r.bottom) + ">" + Math.round(basso) + ")");
      if (r.left < -1 || r.right > w.innerWidth + 1) guai.push((e.className.split(" ")[0]) + " esce di lato");
    });
    return guai;
  }
  COPIONE.aggiungi("pz8", { nome: "Prezzo: le misure a 360x640 e 412x915 (Bot in 6, 📺 ⚡ Veloce)", fai: async function () {
    var esiti = [];
    var misure = W.__pz8misure || [[360, 640], [412, 915]];   // (una sola: W.__pz8misure = [[360, 640]])
    for (var m = 0; m < misure.length; m++) {
      var wh = misure[m];
      var w = await contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 5 });
      var f = document.getElementById("tel-Paky"); f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize"));
      var visti = {}, guai = {};
      await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine"; }, { ms: 400000, passo: 500, ognuno: async function () {
        var H = w.__prezzoH, k = H.fase + "." + (H.sotto || "");
        if (visti[k] > 3) return;
        await W.dorme(1300);
        visti[k] = (visti[k] || 0) + 1;
        controllaVista(w).forEach(function (g) { guai[k + ": " + g] = 1; });
      } });
      esiti.push(wh.join("x") + ": " + (Object.keys(guai).length ? Object.keys(guai).slice(0, 8).join(" | ") : "ok") + " (passi visti " + Object.keys(visti).length + ")");
      A.pulisci();
    }
    var male = esiti.filter(function (e) { return !/: ok/.test(e); });
    if (male.length) no(esiti.join(" ‖ "));
    return esiti.join(" ‖ ") + errori();
  } });

  COPIONE.aggiungi("pz9", { nome: "Prezzo online nella Sala in 8: 📺 Come in TV ⚡ Veloce", fai: async function () {
    conSpia();
    try {
      var amici = ["Luca", "Sara", "Giulia", "Marco", "Bea", "Toni", "Ada"];
      var X = await salaPrezzo(amici, { formato: "tv", durata: "veloce", offerte: "segrete" }), C = X.C, P = X.P;
      var spia = spiaFasi("Paky");
      var ok = await giocaTutti(["Paky"].concat(amici), function () { return vm(C).fase === "fine"; }, { ms: 480000 });
      spia.ferma();
      if (!ok) no("la puntata in 8 non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var cl = vm(C).classifica || [];
      if (cl.length !== 8) no("classifica in 8: " + cl.length);
      ["ruota.giro1", "ruota.decidi", "vetrina.offri", "vetrina.riv", "carrello"].forEach(function (f) { if (spia.viste.indexOf(f) < 0) no("in 8 non si è passati da «" + f + "»"); });
      return "classifica " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + errori();
    } finally { senzaSpia(); }
  } });

  // ===================== pz10: chi vince l'Offerta sceglie il gioco a premi =====================
  // (qui se ne registra un secondo finto, copia di «Più o meno», e si tolgono tutti gli altri giochi a premi arrivati dopo,
  //  così i due che escono sono per forza «Più o meno» e il finto)
  COPIONE.aggiungi("pz10", { nome: "Prezzo: 🤖 Contro il Bot, con due giochi a premi chi vince l'Offerta sceglie", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "puntata", offerte: "vista", liv: "facile", nBot: 1 }; } });
    if (!await W.aspetta(function () { return w.SG_PREZZO_PREMI && w.SG_PREZZO_PREMI.piuomeno; }, 5000)) no("«Più o meno» non è registrato");
    w.SG_PREZZO_PREMI.finto = Object.assign({}, w.SG_PREZZO_PREMI.piuomeno, { nome: "Il Finto", icona: "🧪", regola: "Una copia di Più o meno, per la prova" });
    Object.keys(w.SG_PREZZO_PREMI).forEach(function (k) { if (k !== "piuomeno" && k !== "finto") delete w.SG_PREZZO_PREMI[k]; });
    await apriGioco(w);
    if (!W.clicca(w, /Contro il Bot/)) no("niente «🤖 Contro il Bot»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita col Bot non parte al secondo tocco");
    var spia = spiaFasi("Paky"), sceltoIo = false, tipi = {};
    // Paky offre preciso nella prima Offerta (vince lui e sceglie); il secondo gioco a premi è l'altro (niente scelta)
    var ok = await giocaTutti(["Paky"], function () { var H = w.__prezzoH; return H.fase === "punti" && H.iPremio >= 2 || H.fase === "fine"; }, { ms: 300000,
      offerta: function (pr, H) { return H.iOff === 1 ? pr : pr * 0.2; },
      ognuno: function () { var H = w.__prezzoH; if (H.fase === "scegli" && H.scelta && H.scelta.fatta) { if (H.scelta.chi === "host") sceltoIo = true; } if (H.premio) tipi[H.premio.tipo] = 1; } });
    spia.ferma();
    if (!ok) no("non si arriva al secondo gioco a premi (" + spia.viste.join(" → ") + ")");
    if (spia.viste.indexOf("scegli") < 0) no("con due giochi a premi non c'è stata la scelta (" + spia.viste.join(" → ") + ")");
    if (!sceltoIo) no("Paky ha vinto l'Offerta ma non ha scelto lui");
    if (!tipi.finto || !tipi.piuomeno) no("i due giochi a premi non sono usciti tutti e due (si sceglie tra due, poi l'altro): " + Object.keys(tipi));
    return "Paky ha scelto · giochi: " + Object.keys(tipi).join(", ") + errori();
  } });

  // ===================== pz11: «🤖 Contro il Bot» in due tocchi, con le regole di partenza =====================
  COPIONE.aggiungi("pz11", { nome: "Prezzo: 🤖 Contro il Bot parte in due tocchi (📺 Come in TV, Puntata, 3 Bot medi, a vista, tutte le categorie)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true });   // niente w.__imp: le regole sono quelle di partenza del gioco
    await apriGioco(w);                                            // 1° tocco
    if (!W.clicca(w, /Contro il Bot/)) no("in «Come giocate?» non c'è «🤖 Contro il Bot»");   // 2° tocco
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("al secondo tocco la partita non parte (" + T(w).slice(0, 160) + ")");
    if (/Impostazioni|Comincia ▶/.test(T(w))) no("si vedono ancora le impostazioni");
    var H = w.__prezzoH, I = H.imp, nCat = (w.SGPrezzoScena && w.SGPrezzoScena.ORDINE_CAT || []).length;
    var atteso = { formato: "tv", durata: "puntata", offerte: "vista", sforare: false, liv: "medio", nBot: 3 };
    Object.keys(atteso).forEach(function (k) { if (I[k] !== atteso[k]) no("regola «" + k + "» = " + JSON.stringify(I[k]) + " invece di " + JSON.stringify(atteso[k])); });
    if (!nCat || I.cats.length !== nCat) no("categorie: " + I.cats.length + " su " + nCat);
    if (H.players.length !== 4 || !H.players.slice(1).every(function (p) { return p.bot; })) no("non siamo tu + 3 Bot: " + H.players.map(function (p) { return p.nome; }).join(", "));
    var t = w.__tP; if (!t || !t.impostazioni || t.impostazioni.modo !== "bot") no("il modo passato al gioco non è «bot»");
    var cast = H.players.map(function (p) { return p.nome; }).join(", ");
    // si gioca fino alla fine, con le regole di partenza
    var spia = spiaFasi("Paky");
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine" && /Rigioca/.test(T(w)) && !w.document.querySelector(".st-vista"); }, { ms: 600000 });
    spia.ferma();
    if (!ok) no("la partita col Bot non arriva alla fine (fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + "; " + spia.viste.slice(-8).join(" → ") + ")");
    ["offerta.rivela", "premio.riv", "ruota.riv", "vetrina.riv", "carrello", "fine"].forEach(function (f) { if (spia.viste.indexOf(f) < 0) no("la puntata non è passata da «" + f + "»"); });
    var clas = w.__prezzoH.classifica.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ");
    // «↻ Rigioca» (un tocco): stesse regole, stessi Bot
    var H0 = w.__prezzoH;
    if (!W.clicca(w, /Rigioca/)) no("niente «↻ Rigioca» alla fine");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH !== H0 && w.__prezzoH.fase !== "lobby"; }, 5000)) no("«Rigioca» non fa ripartire la partita col Bot");
    var I2 = w.__prezzoH.imp;
    Object.keys(atteso).forEach(function (k) { if (I2[k] !== atteso[k]) no("dopo «Rigioca» la regola «" + k + "» = " + JSON.stringify(I2[k])); });
    if (w.__prezzoH.players.length !== 4) no("dopo «Rigioca» giocatori " + w.__prezzoH.players.length);
    return "partita col Bot al 2° tocco · " + JSON.stringify(atteso) + " · " + nCat + " categorie · " + cast + " · finita: " + clas + " · Rigioca ok" + errori();
  } });

  // ===================== pz12: la Ruota del 100 si gira anche in su; il numero si vede solo a ruota ferma =====================
  // (20 ott: prima si girava solo in giù e il numero compariva sul maxischermo appena si girava, con la ruota ancora in corsa)
  async function spingiSu(w) {
    var r = w.document.querySelector(".pz-pan.su .pz-ruota.attiva"); if (!r) return false;
    var b = r.getBoundingClientRect(), x = b.left + b.width / 2, y = b.bottom - 20;
    function ev(t, yy) { r.dispatchEvent(new w.PointerEvent(t, { bubbles: true, pointerId: 8, pointerType: "touch", clientX: x, clientY: yy })); }
    ev("pointerdown", y);
    for (var k = 1; k <= 5; k++) { await W.dorme(18); ev("pointermove", y - k * 45); }
    ev("pointerup", y - 225);
    return true;
  }
  COPIONE.aggiungi("pz12", { nome: "Prezzo: la Ruota del 100 si gira anche in su e il numero si vede solo quando la ruota si ferma", fai: async function () {
    var w = await contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "facile", nBot: 1 });
    var H = function () { return w.__prezzoH; };
    if (!await giocaTutti(["Paky"], function () { return H().fase === "ruota"; }, { ms: 300000 })) no("non si arriva alla Ruota del 100");
    var r = await W.aspetta(function () { return w.document.querySelector(".pz-pan.su .pz-ruota.attiva"); }, 8000);
    if (!r) no("la mia ruota non si può girare");
    var nota0 = (w.document.querySelector(".pz-pan.su .pz-nota") || {}).textContent || "";
    if (!/su o giù/.test(nota0)) no("sotto la ruota non c'è «Trascina la ruota su o giù» («" + nota0 + "»)");
    var io = H().players.filter(function (p) { return !p.bot; })[0].id, str = r.querySelector(".pz-rstr");
    var yDi = function () { var m = /,\s*(-?[\d.]+)px/.exec(str.style.transform); return m ? +m[1] : 0; };
    var cella = function () { var c = [].filter.call(w.document.querySelectorAll(".pz-rcard"), function (x) { return (x.querySelector(".nm") || {}).textContent === "Tu"; })[0]; return c ? (c.querySelector(".val") || {}).textContent : null; };
    await spingiSu(w);
    await W.dorme(120); var y1 = yDi(); await W.dorme(120); var y2 = yDi();
    if (!(y2 < y1)) no("spinta in su: la striscia non sale (" + y1 + " → " + y2 + ")");
    if (!await W.aspetta(function () { var x = H().ruota.g[io]; return x && x.v1 != null; }, 4000)) no("la spinta in su non arriva (niente numero)");
    var v1 = H().ruota.g[io].v1;
    var vistoGira = cella();
    if (!/^[—…]$/.test(cella() || "")) no("mentre la ruota gira, sul maxischermo c'è già «" + cella() + "» (il numero è " + v1 + ")");
    if (!await W.aspetta(function () { return /^\d+/.test(cella() || ""); }, 9000)) no("la ruota non si ferma o il numero non arriva sul maxischermo");
    if (!w.document.querySelector(".pz-pan.su .pz-ruota")) no("il pannello della ruota si è chiuso prima che la ruota si fermasse");
    if (parseInt(cella(), 10) !== v1) no("sul maxischermo " + cella() + " invece di " + v1);
    var nota = (w.document.querySelector(".pz-pan.su .pz-nota") || {}).textContent || "";
    if (v1 !== 100 && nota.indexOf(String(v1)) < 0) no("sotto la ruota ferma non c'è " + v1 + " («" + nota + "»)");
    if (!await giocaTutti(["Paky"], function () { return H().fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 300000 })) no("la partita non finisce (fase " + H().fase + "." + H().sotto + ")");
    return "ruota girata in su (striscia " + Math.round(y1) + " → " + Math.round(y2) + " px), «" + vistoGira + "» finché gira, poi " + v1 + " a ruota ferma; partita finita" + errori();
  } });

  // ===================== pz13: le foto vere dei prodotti (data/prezzo-foto.js) =====================
  // (22-23 ott: al posto delle emoji le foto di Wikimedia Commons, scelte a occhio; un prodotto senza foto non esce)
  COPIONE.aggiungi("pz13", { nome: "Prezzo: le foto vere dei prodotti e delle vetrine", fai: async function () {
    var w = await contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "facile", nBot: 1 });
    var H = function () { return w.__prezzoH; }, F = w.SG_PREZZO_FOTO, P = w.__prezzo, Z = w.SGPrezzoScena;
    if (!F) no("data/prezzo-foto.js non è caricato");
    var ids = {}; w.SG_PREZZO.prodotti.forEach(function (p) { ids[p.id] = 1; }); w.SG_PREZZO.vetrine.forEach(function (v) { v.pezzi.forEach(function (x, i) { ids[v.id + "#" + i] = 1; }); });
    Object.keys(F).forEach(function (k) {
      if (!ids[k]) no("nelle foto c'è «" + k + "», che non è un prodotto né un pezzo di vetrina");
      if (!/^[0-9a-f]\/[0-9a-f]{2}\/[^|/]+\|\d+$/.test(F[k]) && !/^loc:carte\/prezzo\/[\w.\-]+\.(jpg|jpeg|png|webp)$/i.test(F[k])) no("foto scritta male per " + k + ": " + F[k]);
    });
    var L = P.prodotti(), conF = L.filter(function (p) { return p.f; }).length;
    if (conF < 450) no("prodotti con la foto: solo " + conF + " su " + L.length);   // (quelli senza foto restano con l'emoji)
    var u = Z.urlFoto("9/9b/Nutella_ak.jpg|1514", 500), u2 = Z.urlFoto("0/02/Stilles_Mineralwasser.jpg|298", 500);
    if (u !== "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Nutella_ak.jpg/500px-Nutella_ak.jpg" || u2 !== "https://upload.wikimedia.org/wikipedia/commons/0/02/Stilles_Mineralwasser.jpg") no("indirizzi delle foto: " + u + " / " + u2);
    // nella scheda dell'Offerta: la foto del prodotto giusto (o l'emoji se la rete non la dà), mai vuota
    if (!await giocaTutti(["Paky"], function () { return H().fase === "offerta" && H().sotto === "offri"; }, { ms: 60000 })) no("non si arriva all'Offerta");
    await W.dorme(1500);
    var im = w.document.querySelector(".pz-scheda .pz-foto img"), emo = w.document.querySelector(".pz-scheda .pz-emo");
    var atteso = Z.urlFoto(H().prod.f, 500);
    if (!im && !emo) no("nella scheda non c'è né la foto né l'emoji");
    if (im && im.getAttribute("src") !== atteso) no("la scheda mostra " + im.getAttribute("src") + " invece di " + atteso);
    var caricata = im && im.complete && im.naturalWidth > 0;
    // la Vetrina: ogni pezzo con la sua foto piccola (330)
    if (!await giocaTutti(["Paky"], function () { return H().fase === "vetrina" && H().sotto === "offri"; }, { ms: 300000 })) no("non si arriva alla Vetrina");
    await W.dorme(1200);
    var righe = [].slice.call(w.document.querySelectorAll(".pz-vp")), conFoto = righe.filter(function (r) { return r.querySelector(".pz-conf img"); }).length;
    if (!righe.length) no("la Vetrina non ha righe");
    if (!await giocaTutti(["Paky"], function () { return H().fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 300000 })) no("la partita non finisce");
    return conF + " prodotti su " + L.length + " con la foto · " + Object.keys(F).length + " foto · scheda " + (caricata ? "con la foto caricata" : im ? "con la foto (non ancora caricata)" : "con l'emoji (rete)") + " · Vetrina " + conFoto + "/" + righe.length + " righe con la foto" + errori();
  } });

  // ===================== pz14: la Ruota online, le ruote degli altri dal vivo =====================
  // (23 ott, il proprietario: «appena la mia fidanzata girava io vedevo già quanto aveva fatto», «mi fermavo a 80 e aspettavo
  // 10-15 secondi su uno schermo»: ora ognuno ha la sua ruota piccola sul maxischermo, il numero si vede quando si ferma)
  function cartaDi(w, nome) { return [].filter.call(w.document.querySelectorAll(".pz-rcard"), function (c) { return (c.querySelector(".nm") || {}).textContent === nome; })[0] || null; }
  function valCarta(c) { return c ? (c.querySelector(".val") || {}).textContent : null; }
  COPIONE.aggiungi("pz14", { nome: "Prezzo online in 2: alla Ruota il numero dell'altro si vede solo quando la sua ruota si ferma, e chi si ferma guarda le altre girare", fai: async function () {
    conSpia();
    try {
      var X = await salaPrezzo(["Luca"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [];
      var H = function () { return P.__prezzoH; };
      var g1 = null, g2 = null, sottoPrima = null;
      async function gioca2(nome, opz) {
        var w = W.finestra(nome), h = H();
        // alla Ruota: Paky si ferma, Luca gira ancora (se non ha già fatto 100)
        if (h && h.fase === "ruota" && h.sotto === "decidi" && w) {
          var b = [].filter.call(w.document.querySelectorAll(".pz-pan.su .pz-sc"), function (x) { return !x.disabled && new RegExp(nome === "Paky" ? "Mi fermo" : "Giro ancora").test(x.textContent); })[0];
          if (b) { b.click(); return true; }
        }
        return agisci(nome, opz);
      }
      var fino = Date.now() + 420000, idL = null;
      while (Date.now() < fino && vm(C).fase !== "fine") {
        var h = H();
        if (h && h.fase === "ruota") {
          idL = idL || (h.players.filter(function (p) { return p.nome === "Luca"; })[0] || {}).id;
          var x = h.ruota.g[idL] || {}, c = cartaDi(P, "Luca");
          // il numero di Luca è arrivato all'host: sul telefono di Paky la sua ruota gira e il numero non c'è ancora
          if (h.sotto === "giro1" && x.v1 != null && !g1) {
            g1 = { v: x.v1, t: Date.now(), subito: valCarta(c), gira: !!(c && c.classList.contains("gira")) };
            await W.aspetta(function () { return valCarta(cartaDi(P, "Luca")) === String(g1.v); }, 7000);
            g1.dopo = Date.now() - g1.t; g1.fine = valCarta(cartaDi(P, "Luca"));
          }
          if (h.sotto === "giro2" && x.v2 != null && !g2) {
            g2 = { v: x.v2, t: Date.now(), subito: valCarta(c), gira: !!(c && c.classList.contains("gira")), panPaky: !!P.document.querySelector(".pz-pan.su .pz-ruota"),
              vista: !!(c && c.getBoundingClientRect().height > 0) };
            await W.aspetta(function () { return valCarta(cartaDi(P, "Luca")) === x.v1 + " + " + g2.v; }, 7000);
            g2.dopo = Date.now() - g2.t; g2.fine = valCarta(cartaDi(P, "Luca"));
          }
        }
        for (var i = 0; i < 2; i++) { try { await gioca2(["Paky", "Luca"][i], {}); } catch (e) {} }
        await W.dorme(150);
      }
      if (vm(C).fase !== "fine") no("la partita in 2 non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      if (!g1) no("alla Ruota Luca non ha girato");
      if (/^\d/.test(g1.subito || "")) no("appena Luca gira, sul telefono di Paky c'è già il suo numero («" + g1.subito + "», il numero è " + g1.v + ")");
      if (!g1.gira) note.push("(la ruota di Luca non risultava in giro al primo controllo)");
      if (g1.fine !== String(g1.v) || g1.dopo < 1200) no("il numero di Luca doveva arrivare a ruota ferma, dopo un po': «" + g1.fine + "» dopo " + g1.dopo + " ms (numero " + g1.v + ")");
      if (g2) {
        if (g2.panPaky) no("Paky si era fermato ma ha ancora la ruota nel pannello");
        if (!g2.vista) no("Paky si era fermato e non vede la ruota di Luca");
        if (/\+/.test(g2.subito || "")) no("il secondo giro di Luca si vede prima che la ruota si fermi («" + g2.subito + "»)");
        if (g2.dopo < 1200) no("il secondo numero di Luca è arrivato troppo presto (" + g2.dopo + " ms)");
      } else note.push("(Luca non ha fatto il secondo giro: aveva " + (g1 && g1.v) + ")");
      return "1° giro di Luca: «" + g1.subito + "» mentre gira, " + g1.fine + " dopo " + g1.dopo + " ms" + (g2 ? " · 2° giro: Paky fermo guarda, «" + g2.subito + "» mentre gira, «" + g2.fine + "» dopo " + g2.dopo + " ms" : "") + (note.length ? " · " + note.join(" ") : "") + errori();
    } finally { senzaSpia(); }
  } });

  // ===================== pz15: la Ruota in 6: 4 ruote per schermata =====================
  COPIONE.aggiungi("pz15", { nome: "Prezzo: la Ruota in 6 col Bot, 4 ruote per schermata con le frecce", fai: async function () {
    var w = await contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 5 });
    var Hh = function () { return w.__prezzoH; }, visto = null, cambi = 0, ultimaPag = null;
    if (!await giocaTutti(["Paky"], function () { return Hh().fase === "ruota" && w.document.querySelectorAll(".pz-rcard").length === 6; }, { ms: 300000 })) no("non si arriva alla Ruota con 6 ruote");
    var fino = Date.now() + 25000;
    while (Date.now() < fino && Hh().fase === "ruota") {
      var vis = [].filter.call(w.document.querySelectorAll(".pz-rcard"), function (c) { return !c.hidden; }).map(function (c) { return c.querySelector(".nm").textContent; });
      if (!visto) visto = vis.length;
      var k = vis.join("|"); if (ultimaPag !== null && k !== ultimaPag) cambi++; ultimaPag = k;
      if (vis.length > 4) no("si vedono " + vis.length + " ruote insieme (al massimo 4)");
      await agisci("Paky", {});
      await W.dorme(150);
    }
    var pag = w.document.querySelector(".pz-rpag");
    if (!pag || pag.hidden) no("con 6 ruote non ci sono le frecce delle pagine");
    // le frecce: un tocco su ▶ e si vedono le altre
    var prima = [].filter.call(w.document.querySelectorAll(".pz-rcard"), function (c) { return !c.hidden; }).map(function (c) { return c.querySelector(".nm").textContent; }).join("|");
    var frecce = pag ? pag.querySelectorAll("button") : []; if (frecce[1]) frecce[1].click();
    await W.dorme(200);
    var dopo = [].filter.call(w.document.querySelectorAll(".pz-rcard"), function (c) { return !c.hidden; }).map(function (c) { return c.querySelector(".nm").textContent; }).join("|");
    if (Hh().fase === "ruota" && prima === dopo) no("toccando ▶ non cambiano le ruote");
    var guai = controllaVista(w); if (guai.length) no("alla Ruota in 6: " + guai.join(" | "));
    if (!await giocaTutti(["Paky"], function () { return Hh().fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 300000 })) no("la partita non finisce");
    return visto + " ruote alla volta su 6 · la pagina è cambiata " + cambi + " volte · frecce ok" + errori();
  } });

  // ===================== pz16: la regola di un gioco a premi si salta con «Avanti» =====================
  // (23 ott, il proprietario: «non voglio i secondi obbligatori per leggere le regole», «se la maggioranza per eccesso preme
  // avanti si va avanti»: col Bot e sullo stesso telefono basta un tocco, online la metà più uno di chi gioca)
  function avantiDi(w) { return w.document.querySelector(".st-barra.on .pz-avanti"); }
  COPIONE.aggiungi("pz16", { nome: "Prezzo: la regola di un gioco a premi si salta con «Avanti» (col Bot un tocco, online in 3 ne servono 2)", fai: async function () {
    var w = await contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 1 }), H = function () { return w.__prezzoH; };
    if (!await giocaTutti(["Paky"], function () { return H().fase === "premio" && H().sotto === "intro" && avantiDi(w); }, { ms: 240000, passo: 200, avanti: false })) no("col Bot sulla regola del gioco a premi non c'è «Avanti»");
    var t0 = Date.now(); avantiDi(w).click();
    if (!await W.aspetta(function () { return H().sotto !== "intro"; }, 2000)) no("col Bot, toccando «Avanti» la regola resta");
    var bot = Date.now() - t0;
    if (!await giocaTutti(["Paky"], function () { return H().fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 300000 })) no("col Bot la partita non finisce");
    conSpia();
    try {
      var X = await salaPrezzo(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, L = W.finestra("Luca");
      if (!await giocaTutti(["Paky", "Luca", "Sara"], function () { return vm(C).fase === "premio" && vm(C).sotto === "intro" && avantiDi(P) && avantiDi(L); }, { ms: 300000, passo: 250, avanti: false })) no("online sulla regola del gioco a premi non c'è «Avanti»");
      var k = P.__prezzoH.k;
      avantiDi(P).click();
      await W.dorme(900);
      var h = P.__prezzoH, qL = ((avantiDi(L) || {}).textContent || "");
      if (h.sotto !== "intro" || h.k !== k) no("online in 3 è bastato un «Avanti» su 3 per saltare la regola");
      if (!/1 su 2/.test(qL)) no("sul telefono di Luca il tasto non dice «1 su 2» («" + qL + "»)");
      if (!(avantiDi(P) || {}).disabled) no("dopo «Avanti» il tasto di Paky si può ancora toccare");
      t0 = Date.now(); avantiDi(L).click();
      if (!await W.aspetta(function () { return P.__prezzoH.k !== k; }, 3000)) no("online, col secondo «Avanti» su 3 la regola resta");
      var onl = Date.now() - t0;
      if (!await giocaTutti(["Paky", "Luca", "Sara"], function () { return vm(C).fase === "fine"; }, { ms: 360000 })) no("online la partita non finisce");
      return "col Bot «Avanti» salta la regola in " + bot + " ms · online in 3: 1 tocco non basta (Luca legge «" + qL.replace(/\s+/g, " ").trim() + "»), col 2° si parte in " + onl + " ms" + errori();
    } finally { senzaSpia(); }
  } });

  // ===================== pz17: la Vetrina misteriosa col Bot (e il conto in percentuale) =====================
  // (23 ott, il proprietario sceglie «scelgono tutti, in segreto»: ognuno tiene la vetrina vista o prende la misteriosa)
  function titVet(w, sel) { var t = w.document.querySelector(sel || ".pz-vtit"); return t ? { mist: t.classList.contains("mist"), testo: t.textContent } : null; }
  function pezziSch(w) { return [].map.call(w.document.querySelectorAll(".pz-sch .pz-vp .t b"), function (b) { return b.textContent; }); }
  COPIONE.aggiungi("pz17", { nome: "Prezzo: la Vetrina misteriosa col Bot (Paky prende la misteriosa) e il conto in percentuale", fai: async function () {
    var w = await contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 3 }), H = function () { return w.__prezzoH; };
    // le regole, senza grafica: due vetrine diverse, vince chi si avvicina di più in percentuale
    var ev = w.__prezzo.esitoVetrina({ p: 950, l: 19800, s: 1060, t: 30000 }, { p: "a", l: "b", s: "a", t: "b" }, 1000, 20000, 4), pt = {};
    ev.righe.forEach(function (r) { pt[r.id] = r.punti; });
    if (pt.l !== 1450 || pt.p !== 225 || pt.s !== 0 || pt.t !== 0) no("il conto della Vetrina in percentuale non torna: " + JSON.stringify(pt) + " (attesi l 1.450, p 225, s 0, t 0)");
    if (ev.tutti.join() !== "l" || ev.vince.join() !== "l") no("VINCI TUTTO / chi vince: " + ev.tutti + " / " + ev.vince);
    var vistaSc = null, vistaOff = null, vmSc = null;
    var ok = await giocaTutti(["Paky"], function () {
      var h = H();
      if (h.fase === "vetrina" && h.sotto === "scegli" && !vistaSc && w.document.querySelector(".pz-pan.su .pz-sc")) {
        vmSc = { b: !!(h.vet && h.vet.b), mist: !!w.document.querySelector(".pz-sch .pz-mist"), tasti: [].map.call(w.document.querySelectorAll(".pz-pan.su .pz-sc b"), function (b) { return b.textContent; }) };
        vistaSc = pezziSch(w);
      }
      if (h.fase === "vetrina" && h.sotto === "offri" && !vistaOff && w.document.querySelector(".pz-pan.su .pz-ok")) vistaOff = { t: titVet(w), pezzi: pezziSch(w), sc: JSON.parse(JSON.stringify(h.vet.sc)) };
      return h.fase === "fine" && !w.document.querySelector(".st-vista");
    }, { ms: 400000, mist: true });
    if (!ok) no("la partita non finisce (fase " + H().fase + "." + H().sotto + ")");
    if (!vmSc) no("non si è vista la scelta «Tieni o cambi?»");
    if (!vmSc.b || !vmSc.mist) no("alla scelta manca la vetrina misteriosa (" + JSON.stringify(vmSc) + ")");
    if (vmSc.tasti.join("|") !== "Tengo questa|La misteriosa") no("i tasti della scelta: " + vmSc.tasti.join("|"));
    var h = H(), B = h.vet.b, A = h.vet.v, nb = B.pezzi.map(function (x) { return x.nome; });
    if (vistaSc.some(function (n) { return nb.indexOf(n) >= 0 && A.pezzi.every(function (x) { return x.nome !== n; }); })) no("mentre si sceglie si vedono già i pezzi della misteriosa");
    if (!vistaOff) no("non si è arrivati a offrire sulla Vetrina");
    else {
      var io = h.players.filter(function (p) { return !p.bot; })[0].id;
      if (vistaOff.sc[io] !== "b") no("Paky ha preso la misteriosa ma per chi tiene la partita ha «" + vistaOff.sc[io] + "»");
      if (!vistaOff.t || !vistaOff.t.mist) no("Paky offre ma sul maxischermo non c'è la misteriosa (" + JSON.stringify(vistaOff.t) + ")");
      if (vistaOff.pezzi.join("|") !== nb.join("|")) no("sul maxischermo di Paky i pezzi non sono quelli della misteriosa: " + vistaOff.pezzi.join(", ") + " invece di " + nb.join(", "));
    }
    var e = h.vet.esito, rP = e.righe.filter(function (r) { return r.id === io; })[0];
    if (!e.prezziB || !rP || rP.w !== "b") no("nella rivelazione Paky non risulta sulla misteriosa (" + JSON.stringify(rP) + ")");
    var car = (h.players.filter(function (p) { return p.id === io; })[0] || {}).carrello || [];
    if (rP && rP.pos === 1 && !B.pezzi.every(function (x) { return car.some(function (c) { return c.nome === x.nome; }); })) no("Paky ha vinto la misteriosa ma nel carrello non ci sono i suoi pezzi");
    var bot = e.righe.filter(function (r) { return r.id !== io; }).map(function (r) { return r.w; }).join("");
    return "conto in percentuale ok · scelta: " + vmSc.tasti.join(" / ") + " · Paky sulla misteriosa «" + B.titolo + "» (" + rP.v + " su " + rP.tot + ", " + (rP.pos ? rP.pos + "°" : rP.sopra ? "sforato" : "-") + ", +" + rP.punti + ") · i Bot: " + bot + errori();
  } });

  // ===================== pz18: la Vetrina misteriosa online in 2, con chi ricarica =====================
  COPIONE.aggiungi("pz18", { nome: "Prezzo online in 2: Vetrina misteriosa, Paky tiene e Luca cambia; Luca ricarica mentre offre", fai: async function () {
    conSpia();
    try {
      var X = await salaPrezzo(["Luca"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [];
      var segreto = null, offP = null, offL = null, ric = false, dopoRic = null;
      var ok = await giocaTutti(["Paky", "Luca"], function () { return vm(C).fase === "fine"; }, { ms: 420000,
        mist: function (n) { return n === "Luca"; },
        // Luca non offre sulla Vetrina finché non ha ricaricato la pagina (così ricarica a metà offerta)
        salta: function (n) { var h = P.__prezzoH; return n === "Luca" && !ric && h && h.fase === "vetrina" && h.sotto === "offri"; },
        ognuno: async function () {
          var h = P.__prezzoH, L = W.finestra("Luca");
          if (!h || h.fase !== "vetrina") return;
          // mentre si sceglie: Paky ha scelto, Luca non sa cosa (vede solo che ha scelto)
          if (h.sotto === "scegli" && h.vet.sc[h.players[0].id] && !segreto) { var v = vm(C).vet || {}; segreto = { b: !!v.b, sc: !!v.sc, sFatti: (v.sFatti || []).length }; }
          if (h.sotto === "offri") {
            // (la vetrina di chi offre sta nel riquadro .pz-vbox: prima si vede ancora un attimo la schermata della scelta)
            if (!offP && P.document.querySelector(".pz-vbox .pz-vtit")) offP = titVet(P, ".pz-vbox .pz-vtit");
            if (!offL && L && L.document.querySelector(".pz-vbox .pz-vtit")) offL = titVet(L, ".pz-vbox .pz-vtit");
            if (!ric && offL && L.document.querySelector(".pz-pan.su .pz-ok")) {
              ric = true;
              var w2 = await W.ricarica("Luca");
              if (!await W.aspetta(function () { return w2.document.querySelector(".pz-vbox .pz-vtit"); }, 12000)) note.push("Luca dopo la ricarica non vede la vetrina");
              dopoRic = titVet(w2, ".pz-vbox .pz-vtit");
            }
          }
        } });
      if (!ok) no("la partita online non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var h = P.__prezzoH, sc = h.vet.sc, ids = h.players.map(function (p) { return p.id; });
      if (!segreto) no("non si è visto il momento della scelta");
      else if (segreto.b || segreto.sc) no("mentre si sceglie la foto della partita dice già la misteriosa o le scelte (" + JSON.stringify(segreto) + ")");
      var wP = sc[ids[0]], wL = sc[ids[1]];
      if (wP !== "a" || wL !== "b") no("le scelte non sono quelle fatte: Paky " + wP + ", Luca " + wL + " (attese a e b)");
      if (offP && !!offP.mist !== (wP === "b")) no("sul telefono di Paky la vetrina non è la sua (" + JSON.stringify(offP) + ", scelta " + wP + ")");
      if (offL && !!offL.mist !== (wL === "b")) no("sul telefono di Luca la vetrina non è la sua (" + JSON.stringify(offL) + ", scelta " + wL + ")");
      if (dopoRic && !!dopoRic.mist !== (wL === "b")) no("Luca dopo la ricarica vede l'altra vetrina (" + JSON.stringify(dopoRic) + ", scelta " + wL + ")");
      if (!ric) note.push("(Luca non ha ricaricato: non è arrivato a offrire)");
      return "scelte: Paky " + wP + ", Luca " + wL + " · mentre si sceglie la foto non dice niente · Luca ricarica e ritrova la sua vetrina " + (dopoRic ? "(" + dopoRic.testo + ")" : "") + (note.length ? " · " + note.join(" ") : "") + errori();
    } finally { senzaSpia(); }
  } });

  // ===================== pz19: a pari merito alla Ruota l'indizio va a tutti =====================
  // (23 ott, il proprietario: «se due persone fanno 100 alla ruota finale, l'indizio lo dà solamente ad una persona»)
  COPIONE.aggiungi("pz19", { nome: "Prezzo online in 2: tutti e due fanno 100 alla Ruota e tutti e due hanno l'indizio sulla Vetrina", fai: async function () {
    conSpia();
    try {
      var X = await salaPrezzo(["Luca"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P;
      var cento = false, visti = {};
      var ok = await giocaTutti(["Paky", "Luca"], function () { return vm(C).fase === "fine"; }, { ms: 420000,
        ognuno: async function () {
          var h = P.__prezzoH; if (!h) return;
          // alla decisione della Ruota: tutti e due a 100 (la prova forza il pari merito)
          if (h.fase === "ruota" && h.sotto === "decidi" && !cento) { cento = true; h.players.forEach(function (p) { var x = h.ruota.g[p.id]; if (x) { x.v1 = 100; x.si = false; } }); }
          if (h.fase === "vetrina" && h.sotto === "offri") ["Paky", "Luca"].forEach(function (n) { var w = W.finestra(n), r = w && w.document.querySelector(".pz-pan.su .pz-indizio"); if (r) visti[n] = r.textContent; });
        } });
      if (!ok) no("la partita non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var h = P.__prezzoH, ids = (h.indizio || {}).ids || [];
      if (ids.length !== 2) no("l'indizio è andato a " + ids.length + " giocatori invece che a tutti e due (" + JSON.stringify(h.indizio) + ")");
      if (!visti.Paky) no("Paky (chi tiene la partita) non ha visto il suo indizio");
      if (!visti.Luca) no("Luca (ospite) non ha visto il suo indizio");
      return "indizio a tutti e due · Paky: «" + visti.Paky + "» · Luca: «" + visti.Luca + "»" + errori();
    } finally { senzaSpia(); }
  } });

  // ===================== pz20: chi guarda soltanto e chi arriva tardi (Passo 6) =====================
  // (23 ott, punto 5: il Prezzo dichiara ritardatari "turno" e fa guardare chi apre «👀 Guarda» / il link con &guarda=1)
  COPIONE.aggiungi("pz20", { nome: "Prezzo online in 2: Bea guarda soltanto (targhetta, niente nome, fuori dalla foto), Sara arriva tardi ed entra al prossimo oggetto", fai: async function () {
    conSpia();
    try {
      var X = await salaPrezzo(["Luca"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P, note = [], righe = [];
      // la riga «a che punto siamo» che chi tiene la partita manda alla Sala
      var tP = P.__tP; if (tP && tP.aCheSiamo) { var vero = tP.aCheSiamo; tP.aCheSiamo = function (x) { if (righe[righe.length - 1] !== x) righe.push(x); return vero.apply(this, arguments); }; } else note.push("(niente spia di aCheSiamo)");
      if (!await giocaTutti(["Paky", "Luca"], function () { return vm(C).fase === "offerta" && vm(C).sotto === "offri"; }, { ms: 120000 })) no("la partita non arriva alla prima offerta");
      var B = await W.apriTel("Bea", { hash: "gioco=prezzo&stanza=" + C + "&guarda=1", x: 560 });
      var chip = await W.aspetta(function () { return B.document.querySelector(".sg-guardo"); }, 8000);
      if (!chip) no("Bea non ha la targhetta di chi guarda («" + T(B).slice(0, 80) + "»)");
      if (!await W.aspetta(function () { return B.document.querySelector(".st-vista"); }, 10000)) no("Bea non vede lo studio («" + T(B).slice(0, 80) + "»)");
      await W.dorme(1500);
      if (/Il tuo nome|Come ti chiami/.test(T(B))) no("a Bea si chiede il nome");
      if (!B.document.querySelector(".st-vista.st-con-targa")) no("lo studio di Bea non lascia il posto alla targhetta");
      var idB = W.reteDi("Bea") && W.reteDi("Bea").mioId; idB = idB || null;
      var v0 = vm(C), dentroB = function () { var v = vm(C); return (v.players || []).concat(v.arrivi || []).some(function (p) { return /Bea/.test(p.nome); }); };
      if (dentroB()) no("Bea è finita tra i giocatori o tra chi entra");
      // Sara arriva tardi col link normale: entra al prossimo oggetto
      var S2 = await W.apriTel("Sara", { hash: "gioco=prezzo&stanza=" + C, x: 750 });
      var arrivata = await W.aspetta(function () { return (vm(C).arrivi || []).some(function (a) { return a.nome === "Sara"; }) || (vm(C).players || []).some(function (p) { return p.nome === "Sara"; }); }, 15000);
      if (!arrivata) no("Sara non risulta arrivata (né tra chi entra né tra i giocatori)");
      var fino = Date.now() + 420000, saraGioca = false, bfacc = 0, barraB = false;
      while (Date.now() < fino && vm(C).fase !== "fine") {
        for (var i = 0; i < 3; i++) { try { await agisci(["Paky", "Luca", "Sara"][i], {}); } catch (e) {} }
        if ((vm(C).players || []).some(function (p) { return p.nome === "Sara"; })) saraGioca = true;
        if (B.document.querySelector(".st-barra.on .sl-faccine")) bfacc++;
        if (B.document.querySelector(".st-barra.on")) barraB = true;
        if (dentroB()) no("Bea è entrata in partita mentre guardava");
        if (B.document.querySelector(".pz-pan.su .pz-k, .pz-pan.su .pz-sc")) no("Bea ha dei tasti per giocare");
        await W.dorme(300);
      }
      if (vm(C).fase !== "fine") no("la partita non finisce (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      if (!saraGioca) no("Sara non è mai entrata in partita");
      if (bfacc) no("Bea ha la fila delle faccine del gioco oltre alla targhetta (" + bfacc + " volte)");
      // la fine di Bea: i tasti del core, niente «🏠 Esci» del gioco, la frase di chi ha guardato
      if (!await W.aspetta(function () { return /Hai guardato/.test(T(B)); }, 30000)) no("a fine partita Bea non legge «Hai guardato» («" + T(B).slice(0, 120) + "»)");
      if ([].some.call(B.document.querySelectorAll("button"), function (b) { return /🏠 Esci/.test(b.textContent); })) no("Bea ha «🏠 Esci» del gioco oltre al ✕ della targhetta");
      if (!righe.length) no("chi tiene la partita non dice mai a che punto siamo");
      return "Bea guarda con la targhetta, fuori dalla foto, senza tasti né faccine doppie" + (barraB ? " (ha la barra in basso)" : "") + " · Sara entra al prossimo oggetto · a che punto siamo: " + righe.slice(0, 6).join(" → ") + (note.length ? " · " + note.join(" ") : "") + errori();
    } finally { senzaSpia(); }
  } });

  // ===================== pz21: si scoprono solo le vetrine scelte =====================
  // (23 ott, il proprietario: «non ha senso che mi fai vedere anche la vetrina misteriosa e il suo valore… solo se sono state
  // scelte almeno entrambe»; e la misteriosa non scelta non si «brucia»: può uscire in un'altra partita)
  async function soloVetrina(mist) {
    var w = await contrBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 2 }), H = function () { return w.__prezzoH; };
    // subito alla Vetrina (la prova salta il resto della puntata)
    if (!await W.aspetta(function () { return H() && H().piano; }, 8000)) no("la partita col Bot non parte");
    H().piano = ["apertura", "vetrina", "carrello", "fine"]; H().ip = 0;
    var titoli = {}, bTit = null, bId = null, segnati = null, rivVista = false;
    var ok = await giocaTutti(["Paky"], function () {
      var h = H();
      // i Bot scelgono come la prova vuole (prima che scelgano da soli)
      if (h.fase === "vetrina" && h.sotto === "scegli" && h.vet && h.vet.b) { bTit = h.vet.b.titolo; bId = h.vet.b.id || h.vet.b.titolo; h.players.forEach(function (p) { if (p.bot && !h.vet.sc[p.id]) h.vet.sc[p.id] = mist ? "b" : "a"; }); }
      if (h.fase === "vetrina" && h.sotto === "riv") { rivVista = true; [].forEach.call(w.document.querySelectorAll(".pz-sch .pz-vtit, .pz-sch .pz-vt .t"), function (t) { titoli[(t.classList.contains("mist") ? "🎁" : "") + t.textContent] = 1; }); }
      if (h.fase === "carrello" && segnati == null) { try { segnati = JSON.parse(w.localStorage.getItem("sg-prezzo-vetrine") || "[]"); } catch (e) { segnati = []; } }
      return h.fase === "fine" && !w.document.querySelector(".st-vista");
    }, { ms: 240000, mist: !!mist, passo: 250 });
    if (!ok) no("la partita non finisce (fase " + H().fase + "." + H().sotto + ")");
    if (!rivVista) no("non si è vista la rivelazione della Vetrina");
    return { w: w, H: H(), titoli: Object.keys(titoli), bTit: bTit, bId: bId, segnati: segnati || [] };
  }
  COPIONE.aggiungi("pz21", { nome: "Prezzo: alla fine si scoprono solo le vetrine scelte (tutti la prima, poi tutti la misteriosa)", fai: async function () {
    // 1) tutti tengono la prima: la misteriosa non si vede, il suo valore nemmeno, e non risulta «già uscita»
    var a = await soloVetrina(false), eA = a.H.vet.esito;
    if (!a.bTit) no("nella prima partita non c'era la vetrina misteriosa");
    if (a.titoli.some(function (t) { return t.indexOf(a.bTit) >= 0; }) && !(eA.tutti || []).length) no("tutti hanno tenuto la prima ma nella rivelazione si vede la misteriosa «" + a.bTit + "» (" + a.titoli.join(" | ") + ")");
    if (eA.usaB) no("tutti hanno tenuto la prima ma per la partita la misteriosa è «usata»");
    if (a.segnati.indexOf(a.bId) >= 0 && !(eA.tutti || []).length) no("la misteriosa non scelta risulta già uscita su questo telefono (" + a.bId + ")");
    // 2) tutti prendono la misteriosa: si scopre solo quella
    var b = await soloVetrina(true), eB = b.H.vet.esito, vTit = b.H.vet.v.titolo;
    if (eB.usaA) no("tutti hanno preso la misteriosa ma per la partita la prima è «usata»");
    if (!b.titoli.some(function (t) { return t.indexOf("🎁") === 0 && t.indexOf(b.bTit) >= 0; })) no("tutti hanno preso la misteriosa ma non si scopre («" + b.titoli.join(" | ") + "»)");
    if (b.titoli.some(function (t) { return t.indexOf("🎁") !== 0 && t.indexOf(vTit) >= 0; }) && !(eB.tutti || []).length) no("tutti hanno preso la misteriosa ma si scoprono anche i prezzi della prima («" + vTit + "»)");
    if (b.segnati.indexOf(b.bId) < 0) no("la misteriosa scoperta non risulta uscita (" + b.bId + ")");
    return "tutti la prima: «" + a.titoli.join(" | ") + "», la misteriosa «" + a.bTit + "» resta un mistero e non si brucia · tutti la misteriosa: «" + b.titoli.join(" | ") + "»" + errori();
  } });

  W.PZ = { agisci: agisci, giocaTutti: giocaTutti, spiaFasi: spiaFasi, controllaVista: controllaVista, contrBot: contrBot, stessoTelefono: stessoTelefono, salaPrezzo: salaPrezzo, conSpia: conSpia, senzaSpia: senzaSpia };
})();
