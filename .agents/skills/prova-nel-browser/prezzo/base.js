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
      if (ok && /Offro per tutto/.test(ok.textContent) && H.vet) { var tot = H.vet.v.pezzi.reduce(function (a, x) { return a + x.prezzo; }, 0); return scrivi(w, tot * (0.9 + Math.random() * 0.08)); }
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
        if (/E adesso\?/.test(titolo)) { var m = /Hai fatto (\d+)/.exec(titolo), v1 = m ? +m[1] : 50; sc[v1 < 55 ? 0 : 1].click(); return true; }
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
    if (!rr.a.cento || rr.a.punti !== 1300 || rr.b.punti !== 150 || !rr.c.out || rr.c.punti || rr.d.punti !== 75) no("Ruota: " + JSON.stringify(er.righe));
    if (P.puntiBonus(100) !== 1000 || P.puntiBonus(5) !== 500 || P.puntiBonus(15) !== 500 || P.puntiBonus(50)) no("giro bonus");
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
    ["apertura", "offerta.prodotto", "offerta.offri", "offerta.rivela", "premio.gioca", "premio.riv", "punti", "ruota.giro1", "ruota.decidi", "ruota.riv", "vetrina.mostra", "vetrina.offri", "vetrina.riv", "carrello", "fine"].forEach(function (f) {
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
    var ok = await giocaTutti(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 480000 });
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
      await W.dorme(9000);
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
    if (sch) [].forEach.call(sch.querySelectorAll(".pz-scheda,.pz-riga,.pz-cl,.pz-car,.pz-vp,.pz-och,.pz-rg,.pz-conta,.pz-banner,.pz-gioco,.pz-intro,.pz-testa"), function (e) {
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
  // (finché c'è un gioco a premi solo, la scelta non si vede: qui se ne registra un secondo finto, copia di «Più o meno»)
  COPIONE.aggiungi("pz10", { nome: "Prezzo: 🤖 Contro il Bot, con due giochi a premi chi vince l'Offerta sceglie", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "puntata", offerte: "vista", liv: "facile", nBot: 1 }; } });
    if (!await W.aspetta(function () { return w.SG_PREZZO_PREMI && w.SG_PREZZO_PREMI.piuomeno; }, 5000)) no("«Più o meno» non è registrato");
    w.SG_PREZZO_PREMI.finto = Object.assign({}, w.SG_PREZZO_PREMI.piuomeno, { nome: "Il Finto", icona: "🧪", regola: "Una copia di Più o meno, per la prova" });
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

  W.PZ = { agisci: agisci, giocaTutti: giocaTutti, spiaFasi: spiaFasi, controllaVista: controllaVista, contrBot: contrBot, stessoTelefono: stessoTelefono, salaPrezzo: salaPrezzo, conSpia: conSpia, senzaSpia: senzaSpia };
})();
