// PROVE DI «😂 MEMATA» (31 ott 2026, chat «😂 Meme»): il gioco dei meme, solo online.
//   prova.js --porta 8981 --carica preferiti/memata.js --prova mm1,mm2,…
// mm1 in 4 dalla stanza: partita intera (3 round), ognuno scrive nei riquadri e consegna, «🔄 Cambia meme» una volta,
//     voto anonimo (nella foto mai chi ha scritto cosa; l'autore non vota il suo), rivelazione dal meno votato al più votato
//     con la vibrazione a chi vince, ultimo round stesso meme per tutti a punti doppi, classifica, meme della serata e foto.
// mm2 chi arriva tardi (entra dal round dopo con 0 punti, intanto guarda senza votare), chi ricarica mentre scrive (ritrova
//     meme e testo), chi scrive e non tocca «Fatto» (allo zero il suo meme vale lo stesso).
// mm3 l'host ricarica mentre si scrive, mentre si vota e alla rivelazione: la partita riprende, nessun punto doppio.
// mm4 l'host sparisce: il vice porta avanti la partita fino alla classifica (con Paky dentro).
// mm5 in 8 dalla Sala: partita intera, «↻ Rivincita» col 3-2-1.
// mm6 le misure a 360x640 e 412x915: scrivere (anche con la tastiera aperta), votare, rivelazione, fine: niente scorre, niente esce.
// mm10 i cambi di meme scelti nelle impostazioni (3 in tutta la partita: il numero scende, poi il tasto sparisce; nell'ultimo
//      round niente cambio) e i tasti per scrivere: «Avanti ▶» passa al riquadro dopo, «📤 Invia meme» manda anche a metà.
// mm9 in due: partita intera (ognuno vota il meme dell'altro), classifica e meme della serata.
// mm8 l'host ricarica mentre si vota: il voto già dato da Giulia resta (non deve rivotare) e conta alla rivelazione.
// mm7 l'host ricarica DUE volte di fila mentre si scrive (la seconda durante il respiro): si riprende lo stesso round.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var MM = W.MM = {};
  var IMP = { tempo: 25, giri: 3, cambi: 1 };   // tempi corti per le prove (e un cambio di meme solo, come all'inizio)
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
  }
  function vibrazioni(w) { w.__vib = []; try { Object.defineProperty(w.navigator, "vibrate", { configurable: true, value: function (p) { w.__vib.push(p); return true; } }); } catch (e) {} }
  function prima(imp) { return function (w) { vibrazioni(w); w.__MEMATA_IMP = imp; }; }
  MM.tocca = tocca;
  function F(n) { return W.finestra(n); }
  function giocatore(C, nome) { return (vm(C).players || []).filter(function (p) { return p.nome === nome; })[0] || null; }
  function punti(C) { var o = {}; (vm(C).players || []).forEach(function (p) { o[p.nome] = p.punti; }); return o; }
  MM.punti = punti;
  function campo(w) { var c = w && w.document.querySelector(".me-campo"); return c && c.offsetParent ? c : null; }
  // la stanza: Paky apre, gli amici entrano col link; poi «Comincia»
  MM.stanza = async function (amici, opz) {
    opz = opz || {};
    var P = await W.apriTel("Paky", { x: 0, prima: prima(opz.imp || IMP) });
    var C = await W.apriStanza(P, "Memata");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=memata&stanza=" + C, x: 185 * ((i + 1) % 6), prima: vibrazioni });
      var n = amici[i];
      if (!await W.aspetta(function () { return !!giocatore(C, n); }, 8000)) no(n + " non entra");
    }
    if (!opz.fermo) {
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 9000)) no("la partita non comincia (" + vm(C).fase + ")");
    }
    return { C: C, P: P };
  };
  var FRASI = ["quando arriva il venerdì", "e invece è lunedì", "io", "il capo", "la pizza"];
  // scrive nel telefono w un testo per ogni riquadro (e consegna)
  MM.scrivi = async function (w, testi, consegna) {
    if (!await W.aspetta(function () { return campo(w); }, 8000)) return false;
    var chips = [].slice.call(w.document.querySelectorAll(".me-chip")), n = Math.max(1, chips.length && chips[0].offsetParent ? chips.length : 1);
    for (var i = 0; i < n; i++) {
      if (n > 1) tocca(w, w.document.querySelectorAll(".me-chip")[i]);
      var c = campo(w);
      c.value = (testi && testi[i]) || FRASI[i] || "boh";
      c.dispatchEvent(new w.Event("input", { bubbles: true }));
    }
    if (consegna !== false) { var f = w.document.querySelector(".me-primario"); if (f) tocca(w, f); }
    return true;
  };
  // vota il meme di adesso (se può): v 2 😂, 1 🙂, 0 😐
  MM.vota = function (w, v) {
    if (!w) return false;
    var b = [].slice.call(w.document.querySelectorAll(".me-voto")).filter(function (x) { return x.offsetParent && !x.disabled; });
    var x = b[v === 2 ? 0 : v === 1 ? 1 : 2]; if (!x) return false; tocca(w, x); return true;
  };
  // una partita fino alla fine: chi c'è scrive e vota (i telefoni si cercano per nome: dopo una ricarica sono nuovi)
  MM.finoAllaFine = async function (C, nomi, opz) {
    opz = opz || {};
    var fino = Date.now() + (opz.ms || 240000), visti = {};
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase === "fine") return true;
      if (opz.ferma && opz.ferma(v)) return false;
      if (v.fase === "gioco" && v.stato === "scrivi") {
        for (var i = 0; i < nomi.length; i++) {
          var nome = nomi[i], w = F(nome), k = v.partita + "|" + v.giro + "|" + nome;
          if (visti[k] || !campo(w) || (opz.nonConsegna && opz.nonConsegna(nome, v))) continue;
          visti[k] = 1; await MM.scrivi(w, null, true);
        }
      }
      if (v.fase === "gioco" && v.stato === "vota" && v.voto) {
        nomi.forEach(function (n2) { var k2 = v.partita + "|" + v.giro + "|v" + v.voto.k + "|" + n2; if (!visti[k2] && MM.vota(F(n2), opz.voto ? opz.voto(n2, v) : 2)) visti[k2] = 1; });
      }
      if (v.fase === "gioco" && v.stato === "rivela" && v.riv && v.riv.finito && opz.avanti !== false) {
        var cap = F(opz.capo || "Paky"), b = cap && cap.document.querySelector(".me-vai"); if (b) b.click();
      }
      await W.dorme(150);
    }
    return vm(C).fase === "fine";
  };
  MM.vibrazioni = vibrazioni;
  // la somma dei punti dati alle rivelazioni (per controllare che nessuno li prenda due volte)
  function guardaRivelazioni(C) {
    var tot = {}, visti = {};
    var id = setInterval(function () {
      var v = vm(C); if (!v || v.stato !== "rivela" || !v.riv) return;
      var k = v.partita + "|" + v.giro; if (visti[k]) return; visti[k] = 1;
      v.riv.lista.forEach(function (r) { tot[r.nome] = (tot[r.nome] || 0) + r.pt; });
    }, 100);
    return { tot: tot, stop: function () { clearInterval(id); return tot; } };
  }

  COPIONE.aggiungi("mm1", { nome: "Memata in 4: partita intera, voto anonimo, rivelazione, ultimo round uguale e doppio, fine con la foto", fai: async function () {
    var Z = await MM.stanza(["Giulia", "Luca", "Marco"]), C = Z.C, P = Z.P, G = F("Giulia"), L = F("Luca");
    var nomi = ["Paky", "Giulia", "Luca", "Marco"];
    if (!await W.aspetta(function () { return vm(C).stato === "scrivi" && campo(G); }, 9000)) no("Giulia non ha il campo per scrivere («" + T(G).slice(0, 120) + "»)");
    if (!await W.aspetta(function () { var i = G.document.querySelector(".me-img"); return i && i.naturalWidth > 0; }, 12000)) no("l'immagine del meme non arriva a Giulia");
    var foto = JSON.stringify(vm(C));
    if (/"rec"|"testi"|"mem"/.test(foto)) no("nella foto mentre si scrive ci sono i meme o i testi: " + foto.slice(0, 200));
    // Luca cambia meme una volta
    await W.aspetta(function () { var i = L.document.querySelector(".me-img"); return i && i.src; }, 5000);
    var primaImg = L.document.querySelector(".me-img").src, cb = L.document.querySelector(".me-cambia");
    if (!cb || !cb.offsetParent) no("Luca non ha «🔄 Cambia meme»");
    tocca(L, cb);
    if (!await W.aspetta(function () { var i = L.document.querySelector(".me-img"); return i && i.src !== primaImg; }, 6000)) no("dopo «Cambia meme» Luca ha lo stesso meme");
    if (L.document.querySelector(".me-cambia").offsetParent) no("«Cambia meme» c'è ancora dopo averlo usato");
    var testi = { Paky: ["quando il prof", "dice compito a sorpresa"], Giulia: ["io alle 3 di notte"], Luca: ["lunedì mattina"], Marco: ["la dieta", "la pizza"] };
    for (var i = 0; i < nomi.length; i++) await MM.scrivi(F(nomi[i]), testi[nomi[i]], true);
    if (!await W.aspetta(function () { return vm(C).stato === "vota"; }, 9000)) no("dopo le consegne non si vota (" + vm(C).stato + ")");
    var fv = JSON.stringify(vm(C).voto || {});
    if (/Paky|Giulia|Luca|Marco|"id"/.test(fv)) no("nel voto c'è il nome di chi l'ha scritto: " + fv);
    // ognuno vota: l'autore ha i tasti spenti
    var senza = 0, n4 = vm(C).voto.n;
    for (var k = 0; k < n4; k++) {
      await W.aspetta(function () { return vm(C).stato === "vota" && vm(C).voto && vm(C).voto.k === k; }, 15000);
      await W.dorme(300);
      nomi.forEach(function (nn) { if (!MM.vota(F(nn), nn === "Giulia" ? 1 : 2)) senza++; });
      await W.aspetta(function () { return vm(C).stato !== "vota" || vm(C).voto.k !== k; }, 15000);
    }
    if (senza !== n4) no("chi non ha potuto votare: " + senza + " (dovevano essere " + n4 + ", l'autore di ogni meme)");
    if (!await W.aspetta(function () { return vm(C).stato === "rivela"; }, 6000)) no("niente rivelazione");
    var riv = vm(C).riv, asc = riv.lista.every(function (r, i, a) { return !i || a[i - 1].pt <= r.pt; });
    if (!asc) no("la rivelazione non va dal meno votato al più votato");
    var top = riv.lista[riv.lista.length - 1], wTop = F(top.nome);
    if (!await W.aspetta(function () { return vm(C).riv && vm(C).riv.finito; }, 20000)) no("la rivelazione non finisce");
    var vibTop = await W.aspetta(function () { return (wTop.__vib || []).filter(function (x) { return Array.isArray(x) && x.length >= 5; }).length; }, 3000);
    if (!vibTop) no(top.nome + " ha vinto il round ma il telefono non ha fatto la vibrazione di festa (" + JSON.stringify(wTop.__vib) + ")");
    var p1 = punti(C);
    // ultimo round: stesso meme per tutti
    var uguale = null;
    var ok = await MM.finoAllaFine(C, nomi, { ferma: function (v) {
      if (v.giro === 3 && v.stato === "scrivi" && uguale === null) {
        var srcs = nomi.map(function (n) { var im = F(n).document.querySelector(".me-img"); return im && campo(F(n)) ? im.src : null; });
        if (srcs.every(Boolean)) uguale = srcs.every(function (s) { return s === srcs[0]; });
      }
      return false;
    } });
    if (!ok) no("la partita non finisce");
    if (uguale === false) no("nell'ultimo round i meme non erano uguali per tutti");
    var fin = vm(C);
    if (!fin.serata || !fin.serata.rec) no("manca il meme della serata");
    if (!await W.aspetta(function () { var im = P.document.querySelector(".me-serata .me-img"); return im && im.naturalWidth > 0; }, 10000)) no("il meme della serata non si vede");
    var url = null; P.__MEMATA = { fotoFinta: function (u) { url = u; } };
    var bf = [].filter.call(P.document.querySelectorAll("button"), function (b) { return /WhatsApp/.test(b.textContent); })[0];
    if (!bf) no("manca «📸 Manda su WhatsApp»");
    tocca(P, bf);
    if (!await W.aspetta(function () { return url; }, 10000)) no("la foto per WhatsApp non si fa");
    W.__fotoMemata = url;
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(G); }, 5000)) no("a fine partita mancano i tasti del core");
    return "4 giocatori, 3 round (l'ultimo uguale per tutti: " + uguale + "); voto anonimo, " + n4 + " meme per round; primo round a " + top.nome + " (+" + top.pt + ", vibrato); punti dopo il primo " + JSON.stringify(p1) + "; meme della serata di " + fin.serata.nome + " (" + fin.serata.pt + "); foto " + Math.round(url.length / 1024) + " KB";
  } });

  COPIONE.aggiungi("mm2", { nome: "Memata: chi arriva tardi entra dal round dopo, chi ricarica ritrova meme e testo, chi non tocca «Fatto» vale lo stesso", fai: async function () {
    var Z = await MM.stanza(["Giulia", "Luca"]), C = Z.C;
    if (!await W.aspetta(function () { return campo(F("Giulia")); }, 9000)) no("Giulia non scrive");
    // Marco arriva mentre si scrive
    await W.apriTel("Marco", { hash: "gioco=memata&stanza=" + C, x: 555, prima: vibrazioni });
    var M = F("Marco");
    if (!await W.aspetta(function () { return (vm(C).prossimi || []).some(function (p) { return p.nome === "Marco"; }); }, 8000)) no("Marco non è tra chi entra al prossimo round");
    if (!await W.aspetta(function () { return /Entri al prossimo round/.test(T(F("Marco"))); }, 6000)) no("Marco non legge «Entri al prossimo round» («" + T(F("Marco")).slice(0, 120) + "»)");
    if (campo(M)) no("Marco ha il campo per scrivere a round cominciato");
    // Giulia scrive senza consegnare e ricarica: ritrova lo stesso meme e il testo
    await MM.scrivi(F("Giulia"), ["prima della ricarica", "secondo"], false);
    var imgG = F("Giulia").document.querySelector(".me-img").src;
    await W.dorme(1200);
    await W.ricarica("Giulia");
    if (!await W.aspetta(function () { return campo(F("Giulia")); }, 12000)) no("dopo la ricarica Giulia non ha il campo per scrivere");
    var G = F("Giulia");
    if (!await W.aspetta(function () { var i = G.document.querySelector(".me-img"); return i && i.src === imgG; }, 5000)) no("dopo la ricarica Giulia ha un altro meme");
    if (campo(G).value !== "prima della ricarica") no("dopo la ricarica il testo di Giulia è «" + campo(G).value + "»");
    // Luca scrive e non consegna: allo zero il suo testo vale lo stesso. Paky e Giulia consegnano
    await MM.scrivi(F("Luca"), ["non tocco fatto"], false);
    await MM.scrivi(F("Paky"), null, true); await MM.scrivi(G, ["prima della ricarica", "secondo"], true);
    if (!await W.aspetta(function () { return vm(C).stato === "vota"; }, 40000)) no("allo zero non si vota (" + vm(C).stato + ")");
    if (vm(C).voto.n !== 3) no("si votano " + vm(C).voto.n + " meme invece di 3 (quello di Luca senza «Fatto» manca?)");
    // Marco intanto guarda: niente tasti per votare
    await W.dorme(400);
    if (MM.vota(F("Marco"), 2)) no("Marco vota prima di entrare");
    // fino al secondo round: Marco entra con 0 punti e scrive
    var nomi = ["Paky", "Giulia", "Luca", "Marco"];
    await MM.finoAllaFine(C, nomi, { ferma: function (v) { return v.giro === 2 && v.stato === "scrivi"; } });
    var m2 = giocatore(C, "Marco");
    if (!m2) no("al secondo round Marco non è tra i giocatori");
    if (m2.punti !== 0) no("Marco entra con " + m2.punti + " punti");
    if (!await W.aspetta(function () { return campo(F("Marco")); }, 8000)) no("al secondo round Marco non scrive");
    if (!await MM.finoAllaFine(C, nomi)) no("la partita non finisce");
    var cl = (vm(C).classifica || []).map(function (r) { return r.nome; });
    if (cl.indexOf("Marco") < 0) no("Marco non è in classifica");
    return "Marco al prossimo round (0 punti, non vota prima); Giulia ricarica e ritrova meme e testo; il meme di Luca senza «Fatto» votato; classifica " + cl.join(", ");
  } });

  // Paky ricarica e aspetta la partita ripresa
  async function ricaricaPaky(C, cosa) {
    var g0 = vm(C).giro, sPrima = (W.statoStanza(C) || {})._s;
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var st = W.statoStanza(C) || {}; return st._s && st._s !== sPrima && st._r && vm(C).stato === "ripresa"; }, 12000)) no("dopo la ricarica di Paky (" + cosa + ") la partita non riprende (stato " + vm(C).stato + ", _r " + (W.statoStanza(C) || {})._r + ")");
    if (vm(C).giro !== g0) no("dopo la ricarica il round è cambiato");
    if (!await W.aspetta(function () { return vm(C).stato !== "ripresa"; }, 30000)) no("la ripresa non finisce");
  }
  COPIONE.aggiungi("mm3", { nome: "Memata: l'host ricarica mentre si scrive, mentre si vota e alla rivelazione (niente punti doppi)", fai: async function () {
    var Z = await MM.stanza(["Giulia", "Luca"]), C = Z.C, nomi = ["Paky", "Giulia", "Luca"], spia = guardaRivelazioni(C);
    if (!await W.aspetta(function () { return campo(F("Giulia")); }, 9000)) no("Giulia non scrive");
    var imgG = F("Giulia").document.querySelector(".me-img").src;
    await MM.scrivi(F("Giulia"), ["Giulia ha consegnato"], true);
    await MM.scrivi(F("Paky"), ["scritto da Paky prima"], false);
    await W.dorme(1200);
    // 1) mentre si scrive
    await ricaricaPaky(C, "mentre si scrive");
    if (vm(C).stato !== "scrivi") no("dopo la ripresa non si scrive più (" + vm(C).stato + ")");
    if (F("Giulia").document.querySelector(".me-img").src !== imgG) no("dopo la ripresa Giulia ha un altro meme");
    if (!await W.aspetta(function () { return campo(F("Paky")); }, 8000)) no("dopo la ripresa Paky non ha il campo");
    if (campo(F("Paky")).value !== "scritto da Paky prima") no("Paky non ritrova il suo testo («" + campo(F("Paky")).value + "»)");
    // 2) mentre si vota (al secondo meme)
    await MM.finoAllaFine(C, nomi, { ferma: function (v) { return v.stato === "vota" && v.voto && v.voto.k === 1; } });
    await W.dorme(600);
    await ricaricaPaky(C, "mentre si vota");
    if (vm(C).stato !== "vota" || vm(C).voto.k !== 1) no("dopo la ripresa non si vota il secondo meme (" + vm(C).stato + " " + JSON.stringify(vm(C).voto && vm(C).voto.k) + ")");
    // 3) alla rivelazione finita
    await MM.finoAllaFine(C, nomi, { avanti: false, ferma: function (v) { return v.stato === "rivela" && v.riv && v.riv.finito; } });
    var p = JSON.stringify(punti(C));
    await ricaricaPaky(C, "alla rivelazione");
    if (JSON.stringify(punti(C)) !== p) no("dopo la ricarica alla rivelazione i punti sono " + JSON.stringify(punti(C)) + " invece di " + p);
    if (!await MM.finoAllaFine(C, nomi)) no("la partita non finisce");
    var tot = spia.stop(), fin = punti(C), diversi = Object.keys(fin).filter(function (n) { return (tot[n] || 0) !== fin[n]; });
    if (diversi.length) no("i punti finali non sono la somma delle rivelazioni: " + JSON.stringify(fin) + " / " + JSON.stringify(tot));
    return "ripresa mentre si scrive (meme e testi ritrovati), mentre si vota (stesso meme), alla rivelazione (punti uguali); finale " + JSON.stringify(fin);
  } });

  COPIONE.aggiungi("mm4", { nome: "Memata: l'host sparisce, Giulia porta avanti la partita fino alla classifica", fai: async function () {
    var Z = await MM.stanza(["Giulia", "Luca", "Marco"]), C = Z.C, idG = giocatore(C, "Giulia").id;
    if (!await W.aspetta(function () { return campo(F("Giulia")); }, 9000)) no("Giulia non scrive");
    await MM.scrivi(F("Luca"), ["Luca prima del cambio"], true);
    await W.dorme(800);
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idG; }, 20000)) no("la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var nomi = ["Giulia", "Luca", "Marco"];
    if (!await MM.finoAllaFine(C, nomi, { capo: "Giulia" })) no("la partita con Giulia non finisce (" + vm(C).stato + ")");
    var cl = (vm(C).classifica || []).map(function (r) { return r.nome; });
    if (cl.indexOf("Paky") < 0) no("Paky non è in classifica");
    return "Giulia tiene la partita (gen 2) e la finisce; classifica " + cl.join(", ");
  } });

  COPIONE.aggiungi("mm5", { nome: "Memata in 8 dalla Sala: partita intera e Rivincita col 3-2-1", fai: async function () {
    var amici = ["Giulia", "Luca", "Marco", "Bea", "Ciro", "Dani", "Ele"];
    await W.apriTel("Paky", { x: 0, salaSempre: true, prima: prima({ tempo: 25, giri: 2 }) });
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { salaSempre: true, hash: "sala=" + S, x: 185 * ((i + 1) % 6), prima: vibrazioni });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 8; }, 15000)) no("nella Sala non sono in 8");
    var C = await A.lanciaDallaSala("Paky", S, "Memata");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 8; }, 15000)) no("nella saletta non arrivano in 8 (" + (vm(C).players || []).length + ")");
    W.clicca(F("Paky"), /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 9000)) no("la partita non comincia");
    var nomi = ["Paky"].concat(amici);
    if (!await MM.finoAllaFine(C, nomi)) no("la partita in 8 non finisce");
    if (!await W.aspetta(function () { return A.tastiFineDi(F("Paky")) && A.tastiFineDi(F("Giulia")); }, 6000)) no("mancano i tasti di fine");
    var tP = A.tastiFineDi(F("Paky")).join(" | ");
    W.clicca(F("Paky"), /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 15000)) no("la rivincita non parte da sola");
    return "8 dalla Sala, 2 round, fine «" + tP + "», rivincita partita";
  } });

  // le misure: niente scorre, i pezzi importanti dentro lo schermo
  async function misura(nome, larg, alt, cosa) {
    var f = document.getElementById("tel-" + nome), w = F(nome);
    f.style.width = larg + "px"; f.style.height = alt + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(500);
    var d = w.document, err = [];
    var se = d.scrollingElement; if (se && se.scrollHeight > w.innerHeight + 2) err.push("la pagina scorre (" + se.scrollHeight + " > " + w.innerHeight + ")");
    var sc = d.querySelector(".me-scena"); if (sc && sc.offsetParent && sc.scrollHeight > sc.clientHeight + 2) err.push("la scena scorre");
    [".me-barra", ".me-titolo", ".me-quadro", ".me-campo", ".me-primario", ".me-voto", ".me-rivchi", ".me-vai", ".me-conto", ".me-punti", ".fine-tasti button", ".classifica li", ".me-foto"].forEach(function (q) {
      [].forEach.call(d.querySelectorAll(q), function (e) {
        if (!e.offsetParent) return; var r = e.getBoundingClientRect();
        if (r.top < -1 || r.bottom > w.innerHeight + 1 || r.left < -1 || r.right > w.innerWidth + 1) err.push(q + " esce (" + Math.round(r.top) + "-" + Math.round(r.bottom) + " su " + w.innerHeight + ")");
      });
    });
    var q = d.querySelector(".me-quadro"); if (q && q.offsetParent && q.getBoundingClientRect().height < 110) err.push("il meme è alto solo " + Math.round(q.getBoundingClientRect().height) + " px");
    return err.length ? cosa + " " + larg + "x" + alt + ": " + err.join("; ") : null;
  }
  MM.misura = misura;
  COPIONE.aggiungi("mm6", { nome: "Memata: le misure a 360x640 e 412x915 in ogni fase", fai: async function () {
    var Z = await MM.stanza(["Giulia", "Luca"], { imp: { tempo: 40, giri: 2 } }), C = Z.C, nomi = ["Paky", "Giulia", "Luca"], errori = [], fatte = [];
    async function tutte(cosa) { for (var k = 0; k < 2; k++) { var m = k ? [412, 915] : [360, 640]; for (var i = 0; i < nomi.length; i++) { var e = await misura(nomi[i], m[0], m[1], cosa + " (" + nomi[i] + ")"); if (e) errori.push(e); } } fatte.push(cosa); }
    if (!await W.aspetta(function () { return campo(F("Giulia")) && campo(F("Paky")) && campo(F("Luca")); }, 9000)) no("non scrivono");
    await W.dorme(1500);
    await tutte("scrivere");
    // la tastiera aperta: lo schermo si abbassa a 340 px
    var G = F("Giulia"); campo(G).focus(); var e1 = await misura("Giulia", 360, 340, "scrivere con la tastiera"); if (e1) errori.push(e1);
    campo(G).blur();
    await MM.scrivi(F("Luca"), null, true);
    await tutte("consegnato");
    await MM.scrivi(F("Paky"), null, true); await MM.scrivi(F("Giulia"), null, true);
    await W.aspetta(function () { return vm(C).stato === "vota"; }, 10000); await W.dorme(800);
    await tutte("votare");
    await MM.finoAllaFine(C, nomi, { avanti: false, ferma: function (v) { return v.stato === "rivela" && v.riv && v.riv.passo === 1; } });
    await W.dorme(300); await tutte("rivelazione");
    await MM.finoAllaFine(C, nomi, { avanti: false, ferma: function (v) { return v.stato === "rivela" && v.riv && v.riv.finito; } });
    await W.dorme(600); await tutte("fine del round");
    if (!await MM.finoAllaFine(C, nomi)) no("la partita non finisce");
    await W.dorme(1500); await tutte("classifica");
    if (errori.length) no(errori.slice(0, 6).join(" · ") + (errori.length > 6 ? " · (+" + (errori.length - 6) + ")" : ""));
    return "misurate: " + fatte.join(", ") + " (360x640 e 412x915, più la tastiera aperta)";
  } });
  COPIONE.aggiungi("mm7", { nome: "Memata: l'host ricarica due volte di fila (la seconda nel respiro): stesso round", fai: async function () {
    var Z = await MM.stanza(["Giulia", "Luca"]), C = Z.C;
    if (!await W.aspetta(function () { return campo(F("Giulia")); }, 9000)) no("Giulia non scrive");
    var imgG = F("Giulia").document.querySelector(".me-img").src;
    await MM.scrivi(F("Giulia"), ["Giulia prima"], false);
    await W.dorme(1200);
    var sPrima = (W.statoStanza(C) || {})._s;
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var st = W.statoStanza(C) || {}; return st._s && st._s !== sPrima && vm(C).stato === "ripresa"; }, 12000)) no("la prima ripresa non parte");
    var s2 = (W.statoStanza(C) || {})._s;
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var st = W.statoStanza(C) || {}; return st._s && st._s !== s2 && vm(C).stato === "ripresa"; }, 12000)) no("la seconda ripresa non parte");
    if (!await W.aspetta(function () { return vm(C).stato !== "ripresa"; }, 30000)) no("la ripresa non finisce");
    if (vm(C).stato !== "scrivi" || vm(C).giro !== 1) no("dopo due ricariche si è a «" + vm(C).stato + "» del round " + vm(C).giro + " invece di scrivere nel round 1");
    if (F("Giulia").document.querySelector(".me-img").src !== imgG) no("Giulia ha un altro meme");
    // (il campo mostra il riquadro scelto per ultimo: il testo del primo si guarda sull'anteprima)
    function primo() { var q = F("Giulia").document.querySelector(".me-q .me-qt"); return q ? q.textContent.replace(/s+/g, " ").toLowerCase() : ""; }
    if (!await W.aspetta(function () { return campo(F("Giulia")) && primo() === "giulia prima"; }, 5000)) no("Giulia non ritrova il testo («" + primo() + "»)");
    return "due ricariche di fila: si continua a scrivere nel round 1, stesso meme e stesso testo";
  } });
  COPIONE.aggiungi("mm8", { nome: "Memata: l'host ricarica mentre si vota, il voto già dato resta e conta", fai: async function () {
    var Z = await MM.stanza(["Giulia", "Luca"]), C = Z.C, nomi = ["Paky", "Giulia", "Luca"];
    await MM.finoAllaFine(C, nomi, { ferma: function (v) { return v.stato === "vota" && v.voto && v.voto.k === 0; } });
    await W.dorme(500);
    // vota solo Giulia (se il meme non è suo), poi Paky ricarica
    var chi = MM.vota(F("Giulia"), 2) ? "Giulia" : (MM.vota(F("Luca"), 2) ? "Luca" : null);
    if (!chi) no("né Giulia né Luca possono votare il primo meme");
    if (!await W.aspetta(function () { return vm(C).voto && vm(C).voto.hanno === 1; }, 5000)) no("il voto di " + chi + " non arriva");
    var sPrima = (W.statoStanza(C) || {})._s;
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var st = W.statoStanza(C) || {}; return st._s && st._s !== sPrima && vm(C).stato === "ripresa"; }, 12000)) no("la ripresa non parte");
    if (!await W.aspetta(function () { return vm(C).stato === "vota"; }, 30000)) no("dopo la ripresa non si vota (" + vm(C).stato + ")");
    if (vm(C).voto.k !== 0) no("dopo la ripresa si vota il meme " + vm(C).voto.k + " invece del primo");
    if (vm(C).voto.hanno !== 1) no("dopo la ripresa i voti arrivati sono " + vm(C).voto.hanno + " invece di 1 (il voto di " + chi + " è sparito)");
    return "ripresa durante il voto: il voto di " + chi + " è rimasto (" + vm(C).voto.hanno + " arrivato)";
  } });
  COPIONE.aggiungi("mm9", { nome: "Memata in due: partita intera", fai: async function () {
    var Z = await MM.stanza(["Giulia"], { imp: { tempo: 25, giri: 2 } }), C = Z.C;
    if (!await MM.finoAllaFine(C, ["Paky", "Giulia"], { voto: function (n) { return n === "Paky" ? 2 : 1; } })) no("la partita in due non finisce (" + vm(C).stato + ")");
    var cl = vm(C).classifica || [];
    if (cl.length !== 2) no("in classifica ci sono " + cl.length + " giocatori");
    if (!await W.aspetta(function () { return A.tastiFineDi(F("Paky")) && A.tastiFineDi(F("Giulia")); }, 5000)) no("mancano i tasti di fine");
    return "in due: " + cl.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + "; meme della serata di " + ((vm(C).serata || {}).nome || "nessuno");
  } });
  COPIONE.aggiungi("mm10", { nome: "Memata: 3 cambi di meme per partita, «Avanti ▶» e «📤 Invia meme»", fai: async function () {
    var Z = await MM.stanza(["Giulia", "Luca"], { imp: { tempo: 60, giri: 3, cambi: 3 } }), C = Z.C;
    if (!await W.aspetta(function () { return campo(F("Luca")) && F("Luca").document.querySelector(".me-img").src; }, 9000)) no("Luca non scrive");
    function tasto(w) { var b = w.document.querySelector(".me-cambia"); return b && b.offsetParent ? b : null; }
    async function cambia(w, attesa) {
      var b = await W.aspetta(function () { var x = tasto(w); return x && !x.disabled ? x : null; }, 5000); if (!b) return false;
      var prima = w.document.querySelector(".me-img").src; tocca(w, b);
      return !!await W.aspetta(function () { var i = w.document.querySelector(".me-img"); return i && i.src !== prima; }, attesa || 6000);
    }
    var L = F("Luca");
    if (!/· 3/.test((tasto(L) || {}).textContent || "")) no("il tasto non dice che restano 3 cambi («" + ((tasto(L) || {}).textContent || "") + "»)");
    if (!await cambia(L)) no("il primo cambio non arriva");
    if (!await cambia(L)) no("il secondo cambio (stesso round) non arriva");
    if (!/· 1/.test((tasto(L) || {}).textContent || "")) no("dopo due cambi il tasto dice «" + ((tasto(L) || {}).textContent || "") + "»");
    // «Avanti ▶» e «📤 Invia meme» su un meme a più riquadri (Giulia cambia finché ne trova uno, al massimo 3 volte)
    var G = F("Giulia");
    for (var i = 0; i < 3 && G.document.querySelectorAll(".me-chip").length < 2; i++) await cambia(G);
    var n = G.document.querySelectorAll(".me-chip").length, esitoTasti = "meme a un riquadro (tasti non provati)";
    if (n >= 2) {
      var pr = G.document.querySelector(".me-primario"), inv = G.document.querySelector(".me-invia");
      if (!/Avanti/.test(pr.textContent)) no("sul primo riquadro il tasto accanto al campo è «" + pr.textContent + "»");
      if (!inv || !inv.offsetParent) no("manca il tasto a parte «📤 Invia meme»");
      var c = campo(G); c.value = "solo il primo"; c.dispatchEvent(new G.Event("input", { bubbles: true }));
      tocca(G, pr);
      if (!G.document.querySelectorAll(".me-chip")[1].classList.contains("on")) no("«Avanti ▶» non passa al secondo riquadro");
      tocca(G, G.document.querySelector(".me-invia"));
      if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === "Giulia" && p.fatto; }); }, 5000)) no("«📤 Invia meme» non manda il meme");
      esitoTasti = "«Avanti ▶» passa al riquadro 2, «📤 Invia meme» manda col solo primo riquadro scritto";
    }
    // round 2: a Luca resta 1 cambio; usato quello il tasto sparisce
    await MM.finoAllaFine(C, ["Paky", "Giulia", "Luca"], { ferma: function (v) { return v.giro === 2 && v.stato === "scrivi" && campo(F("Luca")); } });
    L = F("Luca");
    if (!/· 1/.test((tasto(L) || {}).textContent || "")) no("al round 2 il tasto di Luca dice «" + ((tasto(L) || {}).textContent || "nessun tasto") + "»");
    if (!await cambia(L)) no("il terzo cambio non arriva");
    await W.dorme(600);
    if (tasto(L)) no("finiti i cambi il tasto c'è ancora");
    // ultimo round: niente cambio per nessuno
    await MM.finoAllaFine(C, ["Paky", "Giulia", "Luca"], { ferma: function (v) { return v.giro === 3 && v.stato === "scrivi" && campo(F("Paky")); } });
    await W.dorme(500);
    if (tasto(F("Paky"))) no("nell'ultimo round (stesso meme per tutti) c'è il tasto per cambiare");
    if (!await MM.finoAllaFine(C, ["Paky", "Giulia", "Luca"])) no("la partita non finisce");
    return "3 cambi: · 3 → · 1 → finiti al round 2, niente cambio nell'ultimo round; " + esitoTasti;
  } });
})();
