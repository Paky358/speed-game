// PROVE DEL «📞 TELEFONO DISEGNATO» (27 nov 2026, chat «📞✏️ Telefono Disegnato»).
//   prova.js --porta 8996 --carica preferiti/telefono.js --prova td0,td1,…
// td0 le regole senza grafica: pagine per 2-12 giocatori (nessuno tocca due volte lo stesso libretto, ognuno lavora a ogni
//     passo, ultima pagina scritta), disegni che vanno e tornano uguali, la semplificazione, i premi.
// td1 in 4 dalla stanza: frasi, disegni e frasi che non passano MAI nella foto mentre si gioca; si va avanti appena hanno
//     finito tutti; la rivelazione coi disegni, una reazione, la ⭐; i premi e i tasti del core.
// td2 chi arriva tardi (Sara: entra alla prossima, niente lavagna), chi guarda (Dina col link: targhetta del core, niente
//     tasti), chi ricarica mentre disegna (Luca ritrova il suo disegno), chi esce a metà (Marco: la sua pagina si salta).
// td3 l'host ricarica mentre si disegna (la frase di Giulia resta) e nella rivelazione (si riprende dalla stessa pagina).
// td4 l'host sparisce a metà: Giulia (la vice) porta avanti la partita, gli altri le rimandano i disegni, fino ai premi.
// td5 le misure in 10 a 360x640 e 412x915: si scrive, si disegna, si aspetta, si sfoglia, i premi: niente esce dallo schermo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var TD = W.TD = {};
  function prima(extra) { return function (w) { w.__TD_PROVA = Object.assign({ ritmo: { s0: 30, d: 40, s: 30 }, riv: { s: 1.2, d: 1.5, f: 2.2 }, ridisegno: 300 }, extra || {}); }; }
  TD.prima = prima;
  function F(n) { return W.finestra(n); }
  function giocatore(C, nome) { return (vm(C).players || []).filter(function (p) { return p.nome === nome; })[0] || null; }
  function vede(e) { return !!(e && e.offsetParent && e.getBoundingClientRect().height > 0); }
  // la pagina che ho davanti: «scrivo» (c'è il campo), «disegno» (c'è la lavagna da disegnare), o niente
  function cosa(w) {
    if (!w || !w.document) return null;
    if (vede(w.document.querySelector(".td-cv.matita"))) return "disegno";
    if (vede(w.document.querySelector(".td-campo"))) return "scrivo";
    return null;
  }
  TD.cosa = cosa;
  function fatto(w) { return [].find.call(w.document.querySelectorAll(".td-piede .td-tasto"), function (b) { return vede(b) && /Fatto/.test(b.textContent); }) || null; }
  // un disegno vero: qualche tratto col dito finto sulla lavagna (n tratti)
  TD.disegna = function (w, n) {
    var cv = w.document.querySelector(".td-cv.matita"); if (!cv) return false;
    var r = cv.getBoundingClientRect(), id = 1;
    function ev(tipo, x, y) { cv.dispatchEvent(new w.PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: id, clientX: r.left + x * r.width, clientY: r.top + y * r.height, pointerType: "touch", isPrimary: true })); }
    for (var k = 0; k < (n || 3); k++) {
      var y0 = 0.2 + 0.2 * k;
      ev("pointerdown", 0.15, y0);
      for (var j = 1; j <= 12; j++) ev("pointermove", 0.15 + j * 0.06, y0 + Math.sin(j / 2) * 0.05);
      ev("pointerup", 0.87, y0);
    }
    return true;
  };
  TD.scrivi = function (w, testo) {
    var c = w.document.querySelector(".td-campo"); if (!vede(c)) return false;
    c.value = testo; c.dispatchEvent(new w.Event("input", { bubbles: true }));
    return true;
  };
  // fa la pagina di chi la deve fare (testi[nome] = la frase, o una funzione (giro) → frase); true se l'ha fatta
  TD.faiPagina = function (nome, testo) {
    var w = F(nome), c = cosa(w); if (!c) return false;
    if (c === "disegno") TD.disegna(w, 2); else TD.scrivi(w, testo || (nome + " scrive qualcosa"));
    var b = fatto(w); if (!b || b.disabled) return false;
    b.click(); return true;
  };
  // la stanza: Paky apre, gli amici entrano col link; poi «Comincia»
  TD.stanza = async function (amici, opz) {
    opz = opz || {};
    var P = await W.apriTel("Paky", { x: 0, prima: prima(opz.prova) });
    var C = await W.apriStanza(P, "Telefono Disegnato");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=telefono&stanza=" + C, x: 185 * ((i + 1) % 6), prima: prima(opz.prova) });
      var n = amici[i];
      if (!await W.aspetta(function () { return !!giocatore(C, n); }, 8000)) no(n + " non entra");
    }
    if (!opz.fermo) {
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 9000)) no("la partita non comincia (" + vm(C).fase + ")");
    }
    return { C: C, P: P };
  };
  // un passo intero: ognuno dei nomi fa la sua pagina; torna quando il passo è cambiato (o è cominciata la rivelazione)
  TD.passo = async function (C, nomi, frasi) {
    var g0 = vm(C).giro, fatti = {};
    if (!await W.aspetta(function () { return vm(C).passo === "giro"; }, 15000)) no("non si gioca (passo " + vm(C).passo + ")");
    var ok = await W.aspetta(function () {
      nomi.forEach(function (n) { if (!fatti[n] && TD.faiPagina(n, frasi && frasi[n] ? frasi[n] + " " + g0 : null)) fatti[n] = 1; });
      return nomi.every(function (n) { return fatti[n]; });
    }, 15000, 200);
    if (!ok) no("al passo " + (g0 + 1) + " non tutti hanno la loro pagina (" + nomi.filter(function (n) { return !fatti[n]; }).map(function (n) { return n + ": «" + T(F(n)).slice(0, 80) + "»"; }).join(" / ") + ")");
    if (!await W.aspetta(function () { return vm(C).giro !== g0 || vm(C).passo === "rivela" || vm(C).fase === "fine"; }, 12000)) no("dopo che hanno finito tutti il passo " + (g0 + 1) + " non va avanti");
  };
  TD.finoAllaRivelazione = async function (C, nomi, frasi) {
    for (var k = 0; k < 14 && vm(C).passo === "giro"; k++) await TD.passo(C, nomi, frasi);
    if (!await W.aspetta(function () { return vm(C).passo === "rivela"; }, 8000)) no("non si arriva alla rivelazione (passo " + vm(C).passo + ")");
  };
  // sfoglia tutto col tasto di chi tiene la partita (o aspettando il conto); fai(v) a ogni foto nuova
  TD.sfoglia = async function (C, chi, fai) {
    var w = F(chi || "Paky"), visti = {};
    var ok = await W.aspetta(function () {
      var v = vm(C); if (v.fase === "fine") return true;
      if (!v.riv) return false;
      var k = v.riv.i + "|" + v.riv.p;
      if (!visti[k]) { visti[k] = 1; if (fai) fai(v); return false; }
      var b = [].find.call(w.document.querySelectorAll(".td-avanti .td-tasto"), function (x) { return vede(x) && !x.classList.contains("v"); });
      if (b && !visti[k + "c"]) { visti[k + "c"] = 1; b.click(); }
      return false;
    }, 120000, 250);
    if (!ok) no("la rivelazione non finisce (" + JSON.stringify(vm(C).riv || {}).slice(0, 120) + ")");
    return visti;
  };

  COPIONE.aggiungi("td0", { nome: "Telefono Disegnato: le regole senza grafica (pagine, disegni in viaggio, premi)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: prima() });
    var tess = await W.aspetta(function () { return A.tessera(P, "Telefono Disegnato"); }, 6000);
    if (!tess) no("non trovo la tessera"); tess.click();
    if (!await W.aspetta(function () { return P.SG_TD_PROVA; }, 8000)) no("il gioco non arriva");
    var R = P.SG_TD_PROVA, pagine = [];
    for (var N = 2; N <= 12; N++) {
      var sc = R.schema(N); pagine.push(N + "→" + sc.L);
      if (sc.L > R.MAXP) no("in " + N + " i libretti hanno " + sc.L + " pagine");
      if (sc.L % 2 !== 1) no("in " + N + " l'ultima pagina non è scritta (" + sc.L + " pagine)");
      if (N >= 4 && N <= 7 && sc.L < N) no("in " + N + " un libretto non passa da tutti (" + sc.L + ")");
      var tocchi = {};
      for (var r = 0; r < sc.L; r++) {
        var usati = {};
        for (var b = 0; b < N; b++) {
          var i = R.chiFa(b, r, N, sc.pari);
          if (usati[i]) no("in " + N + " al passo " + r + " il posto " + i + " ha due libretti");
          usati[i] = 1;
          if (R.libroDi(i, r, N, sc.pari) !== b) no("in " + N + " libroDi e chiFa non vanno d'accordo (" + b + ", " + r + ")");
          var kk = b + "|" + i;
          // chi ha scritto la frase la disegna anche (solo in pari): è l'unica pagina doppia permessa
          if (tocchi[kk] && !(sc.pari && r === 1 && i === b)) no("in " + N + " il posto " + i + " tocca due volte il libretto " + b);
          tocchi[kk] = 1;
        }
        if (Object.keys(usati).length !== N) no("in " + N + " al passo " + r + " qualcuno non lavora");
      }
    }
    var tr = [{ c: 3, w: 2, f: 0, p: [0, 0, 500, 600, 1000, 1200] }, { c: 12, w: 0, f: 1, p: [400, 400] }];
    var dd = R.decodifica(R.codifica(tr));
    if (JSON.stringify(dd) !== JSON.stringify(tr)) no("il disegno non torna uguale: " + JSON.stringify(dd));
    var lungo = { c: 0, w: 1, f: 0, p: [] }; for (var k = 0; k < 6000; k++) lungo.p.push(100 + k % 800, 100 + Math.round(Math.sin(k / 30) * 300 + 400));
    var se = R.semplifica([lungo]); if (se[0].p.length / 2 > 2600) no("la semplificazione lascia " + se[0].p.length / 2 + " punti");
    if (R.somiglia("Un gatto che fa surf su una pizza", "gatto surfista sulla pizza") < 0.5) no("«gatto surfista sulla pizza» non somiglia a «un gatto che fa surf su una pizza»");
    if (R.somiglia("Un gatto che fa surf su una pizza", "Un orso in gondola") > 0) no("«un orso in gondola» somiglia al gatto");
    var libri = [{ a: "a", pag: [{ t: "s", chi: "a", x: "Un gatto che fa surf su una pizza", pk: "0.0" }, { t: "d", chi: "b", pk: "0.1" }, { t: "s", chi: "c", x: "Un orso in gondola", pk: "0.2" }, { t: "d", chi: "d", pk: "0.3" }, { t: "s", chi: "a", x: "Venezia", pk: "0.4" }] },
      { a: "b", pag: [{ t: "s", chi: "b", x: "Un cane al mare", pk: "1.0" }, { t: "d", chi: "c", pk: "1.1" }, { t: "s", chi: "d", x: "Un cane al mare", pk: "1.2" }, { t: "d", chi: "a", pk: "1.3" }, { t: "s", chi: "b", x: "Cane in spiaggia", pk: "1.4" }] }];
    var pr = R.calcolaPremi(libri, { "0.2": [4, 0, 0, 0, 0], "1.1": [0, 0, 2, 0, 0] }, { 0: { a: 1, c: 1 }, 1: { b: 3 } }, { d: 3 }, { a: "Paky", b: "Giulia", c: "Luca", d: "Marta" });
    var per = {}; pr.forEach(function (p) { per[p.tit] = p.nome; });
    if (per["Il Picasso"] !== "Giulia") no("il Picasso è " + per["Il Picasso"] + " (doveva essere Giulia: 2 ⭐)");
    if (per["Il Sabotatore"] !== "Luca") no("il Sabotatore è " + per["Il Sabotatore"] + " (doveva essere Luca: l'orso al posto del gatto)");
    if (per["Il Detective"] !== "Marta") no("il Detective è " + per["Il Detective"]);
    if (per["Il libretto più bello"] !== "Paky") no("il libretto più bello è di " + per["Il libretto più bello"]);
    if (per["Con calma"] !== "Marta") no("«Con calma» è " + per["Con calma"]);
    if (!(P.SG_TELEFONO_IDEE || []).length) no("le idee non ci sono");
    return "pagine " + pagine.join(", ") + "; disegni uguali; premi " + JSON.stringify(per) + "; idee " + P.SG_TELEFONO_IDEE.length;
  } });

  COPIONE.aggiungi("td1", { nome: "Telefono Disegnato in 4: pagine segrete, avanti appena finiti, rivelazione, reazioni, ⭐, premi", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"];
    var Z = await TD.stanza(nomi.slice(1)), C = Z.C, P = Z.P, G = F("Giulia");
    if (vm(C).L !== 5) no("in 4 i libretti hanno " + vm(C).L + " pagine (dovevano essere 5)");
    // mentre si gioca, nella foto non c'è niente di quello che si scrive o si disegna
    var segreti = [], spia = setInterval(function () { var v = vm(C); if (v.passo === "giro" || v.passo === "ripresa") { var s = JSON.stringify(v); if (/zorbak|segreto/i.test(s) || /"d":"\d+\.\d/.test(s)) segreti.push(v.giro); } }, 60);
    if (!await W.aspetta(function () { return cosa(G) === "scrivo" && /Scrivi una frase/.test(T(G)); }, 8000)) no("Giulia non ha il campo per la frase («" + T(G).slice(0, 100) + "»)");
    // 🎲 Dammi un'idea
    if (!W.clicca(G, /dammi un'idea/i)) no("non c'è «🎲 Dammi un'idea»");
    if (!(G.document.querySelector(".td-campo").value || "").trim()) no("«Dammi un'idea» non scrive niente");
    var frasi = { Paky: "Zorbak segreto di Paky", Giulia: "Zorbak segreto di Giulia", Luca: "Zorbak segreto di Luca", Marco: "Zorbak segreto di Marco" };
    var t0 = Date.now();
    await TD.passo(C, nomi, frasi);
    if (Date.now() - t0 > 12000) no("il primo passo non è andato avanti appena hanno finito tutti (" + (Date.now() - t0) + " ms)");
    // il passo 2 in 4 (pari): chi ha scritto la frase la disegna anche
    if (!await W.aspetta(function () { return cosa(G) === "disegno"; }, 8000)) no("al passo 2 Giulia non disegna («" + T(G).slice(0, 100) + "»)");
    if (!/Disegna la tua frase/i.test(T(G)) || !/Zorbak segreto di Giulia/.test(T(G))) no("al passo 2 Giulia non vede la sua frase da disegnare («" + T(G).slice(0, 120) + "»)");
    await TD.passo(C, nomi, frasi);
    // il passo 3: si scrive cosa si vede nel disegno di un altro (c'è la lavagna ferma, non la frase)
    if (!await W.aspetta(function () { return cosa(G) === "scrivo"; }, 8000)) no("al passo 3 Giulia non scrive");
    if (/Zorbak segreto/.test(T(G))) no("al passo 3 Giulia vede la frase invece del disegno");
    if (!G.document.querySelector(".td-spazio .td-cv")) no("al passo 3 Giulia non vede il disegno");
    await TD.finoAllaRivelazione(C, nomi, frasi);
    clearInterval(spia);
    if (segreti.length) no("frasi o disegni nella foto mentre si giocava (passi " + segreti.slice(0, 5).join(",") + ")");
    var v = vm(C);
    if (v.riv.nb !== 4) no("si sfogliano " + v.riv.nb + " libretti (dovevano essere 4)");
    // Luca reagisce, Giulia dà la ⭐ alla fine del primo libretto
    var reagito = false, stella = false, disVisti = 0;
    await TD.sfoglia(C, "Paky", function (v) {
      var L = F("Luca");
      if (!reagito && v.riv.p >= 1) { var b = L.document.querySelector(".td-r"); if (b) { b.click(); reagito = true; } }
      if (v.riv.dis) disVisti = Math.max(disVisti, Object.keys(v.riv.dis).length);
      if (v.riv.fin && !stella) {
        var m = [].find.call(G.document.querySelectorAll(".td-m"), function (x) { return !x.disabled; });
        if (m) { m.click(); stella = true; }
      }
    });
    if (!reagito) no("Luca non ha potuto reagire");
    if (!disVisti) no("nella rivelazione non sono arrivati disegni");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("non si arriva ai premi");
    var pr = vm(C).premi || [];
    if (!pr.length) no("a fine partita nessun premio");
    if (stella && !pr.some(function (p) { return /Picasso/.test(p.tit); })) no("Giulia ha dato una ⭐ ma non c'è il Picasso (" + JSON.stringify(pr) + ")");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(G); }, 5000)) no("a fine partita mancano i tasti del core");
    if (!/I premi/.test(T(G)) || !G.document.querySelector(".td-premio")) no("Giulia non vede i premi");
    // la galleria dei libretti
    if (!W.clicca(G, /Rivedi i libretti/)) no("non c'è «📖 Rivedi i libretti»");
    if (!await W.aspetta(function () { return G.document.querySelectorAll(".td-gal-lib").length === 4; }, 3000)) no("nella galleria non ci sono 4 libretti");
    G.document.querySelector(".td-gal-lib").click();
    if (!await W.aspetta(function () { return G.document.querySelector(".td-gal .td-cv"); }, 4000)) no("nel libretto della galleria non ci sono i disegni");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "4 libretti da 5 pagine, niente nella foto, reazione e ⭐ ok; premi: " + pr.map(function (p) { return p.ic + " " + p.nome; }).join(", ");
  } });

  COPIONE.aggiungi("td2", { nome: "Telefono Disegnato: chi arriva tardi, chi guarda, chi ricarica mentre disegna, chi esce a metà", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"];
    var Z = await TD.stanza(nomi.slice(1)), C = Z.C;
    await TD.passo(C, nomi);
    // passo 2: Luca disegna e ricarica prima di «Fatto»: ritrova il disegno
    var L = F("Luca");
    if (!await W.aspetta(function () { return cosa(L) === "disegno"; }, 8000)) no("Luca non disegna al passo 2");
    TD.disegna(L, 3);
    await W.dorme(300);
    L = await W.ricarica("Luca");
    if (!await W.aspetta(function () { return cosa(F("Luca")) === "disegno"; }, 12000)) no("Luca dopo la ricarica non ha la lavagna («" + T(F("Luca")).slice(0, 100) + "»)");
    await W.dorme(500);
    var pieno = F("Luca").eval("(function(){var c=document.querySelector('.td-cv.matita');var x=c.getContext('2d').getImageData(0,0,c.width,c.height).data,n=0;for(var i=0;i<x.length;i+=16)if(x[i]<200)n++;return n;})()");
    if (!(pieno > 20)) no("Luca dopo la ricarica ha la lavagna vuota (" + pieno + ")");
    // Sara arriva tardi, Dina guarda col link
    await W.apriTel("Sara", { hash: "gioco=telefono&stanza=" + C, x: 555, prima: prima() });
    await W.apriTel("Dina", { hash: "gioco=telefono&stanza=" + C + "&guarda=1", x: 740, prima: prima() });
    if (!await W.aspetta(function () { return (vm(C).prossimi || []).some(function (p) { return p.nome === "Sara"; }); }, 8000)) no("Sara non è tra chi entra alla prossima");
    if (!await W.aspetta(function () { return /Entri alla prossima/.test(T(F("Sara"))); }, 6000)) no("Sara non legge «Entri alla prossima» («" + T(F("Sara")).slice(0, 140) + "»)");
    if (cosa(F("Sara"))) no("Sara ha la lavagna o il campo prima della sua partita");
    if (!await W.aspetta(function () { return /Si stanno facendo i libretti/.test(T(F("Dina"))); }, 6000)) no("Dina non vede la partita («" + T(F("Dina")).slice(0, 140) + "»)");
    if (cosa(F("Dina"))) no("Dina (guarda) ha la lavagna o il campo");
    if (giocatore(C, "Dina")) no("Dina è tra i giocatori");
    if (!F("Dina").document.querySelector(".sg-guardo")) no("Dina non ha la targhetta del core");
    // Marco esce a metà (Esci): la sua pagina si salta, gli altri vanno avanti
    var M = F("Marco");
    M.document.querySelector(".td-esci").click();
    await W.dorme(400); W.clicca(M, /^Esci$/);
    await TD.passo(C, ["Paky", "Giulia", "Luca"]);
    if (!await W.aspetta(function () { var p = giocatore(C, "Marco"); return p && p.via; }, 30000)) no("Marco non risulta uscito");
    await TD.finoAllaRivelazione(C, ["Paky", "Giulia", "Luca"]);
    var saltata = false, dinaVede = false;
    await TD.sfoglia(C, "Paky", function (v) {
      if (v.riv.pag.some(function (pg) { return pg.s; })) saltata = true;
      if (F("Dina").document.querySelector(".td-voce")) dinaVede = true;
      if (F("Dina").document.querySelector(".td-r")) no("Dina ha i tasti delle reazioni");
    });
    if (!saltata) no("nessuna pagina saltata per Marco");
    if (!dinaVede) no("Dina non vede la rivelazione");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("non si arriva ai premi");
    var err = W.erroriTel().filter(function (e) { return !/Marco/.test(e); }); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "Luca ritrova il disegno (" + pieno + " punti scuri), Sara entra alla prossima, Dina guarda, la pagina di Marco si salta";
  } });

  COPIONE.aggiungi("td3", { nome: "Telefono Disegnato: l'host ricarica mentre si disegna e nella rivelazione", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"], frasi = { Giulia: "La frase di Giulia" };
    var r = await A.provaRipresa({ gioco: "telefono", nomeTessera: "Telefono Disegnato", prima: prima(), amici: nomi.slice(1),
      fase: function (v) { return v.fase === "gioco" && v.passo === "giro" && v.giro === 1; },
      comincia: async function (C, P) {
        W.clicca(P, /Comincia/);
        if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 9000)) no("la partita non comincia");
        await TD.passo(C, nomi, frasi);
      },
      prepara: async function (C) {
        if (!await W.aspetta(function () { return cosa(F("Giulia")) === "disegno"; }, 8000)) no("Giulia non disegna");
        TD.faiPagina("Giulia");
        if (!await W.aspetta(function () { var g = giocatore(C, "Giulia"); return ((vm(C).stato || {})[g.id] || {}).f; }, 5000)) no("il disegno di Giulia non arriva");
      },
      controlla: function (a, b) { return b.giro === a.giro ? true : "il passo era il " + a.giro + " e ora è il " + b.giro; } });
    var C = r.C;
    if (!await W.aspetta(function () { return vm(C).passo === "giro"; }, 20000)) no("dopo il respiro non si gioca (" + vm(C).passo + ")");
    var idG = giocatore(C, "Giulia").id;
    if (!((vm(C).stato || {})[idG] || {}).f) no("dopo la ricarica il disegno di Giulia è perso");
    await TD.passo(C, ["Paky", "Luca", "Marco"]);   // (Giulia aveva già finito il suo disegno)
    await TD.finoAllaRivelazione(C, nomi);
    // la rivelazione: due pagine avanti, poi l'host ricarica: si riprende da lì
    var w = F("Paky");
    for (var k = 0; k < 2; k++) { var n0 = vm(C).riv.n; W.clicca(w, /Avanti/); if (!await W.aspetta(function () { return vm(C).riv && vm(C).riv.n !== n0; }, 4000)) no("«Avanti» non va avanti"); }
    await W.dorme(900);
    var prima1 = vm(C).riv; var dove = prima1.i + "|" + prima1.p;
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { return vm(C).passo === "ripresa"; }, 10000)) no("nella rivelazione niente respiro dopo la ricarica");
    if (!await W.aspetta(function () { return vm(C).passo === "rivela"; }, 20000)) no("dopo il respiro non si torna alla rivelazione (" + vm(C).passo + ")");
    var ora = vm(C).riv.i + "|" + vm(C).riv.p;
    if (ora !== dove) no("la rivelazione era a " + dove + " e riprende da " + ora);
    // la frase di Giulia c'è ancora
    var libri = 0;
    await TD.sfoglia(C, "Paky", function (v) { if (v.riv.pag.some(function (pg) { return pg.x && /La frase di Giulia/.test(pg.x); })) libri++; });
    if (!libri) no("la frase di Giulia non si è vista nella rivelazione");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s, il disegno di Giulia resta, la rivelazione riprende da " + ora;
  } });

  COPIONE.aggiungi("td4", { nome: "Telefono Disegnato: l'host sparisce, la vice porta avanti fino ai premi coi disegni rimandati", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"];
    var Z = await TD.stanza(nomi.slice(1)), C = Z.C;
    await TD.passo(C, nomi);
    await TD.passo(C, nomi);   // (i disegni del passo 2 li hanno solo l'host e chi li ha fatti)
    await W.dorme(1500);   // (la copia ai vice)
    var idG = giocatore(C, "Giulia").id;
    A.muore("Paky");
    if (!await W.aspetta(function () { return A.chiTiene(C).h === idG; }, 25000)) no("dopo 25 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    if (!await W.aspetta(function () { return vm(C).passo === "giro"; }, 20000)) no("la vice non riparte (passo " + vm(C).passo + ")");
    // al passo 3 si scrive cosa c'è nel disegno: il disegno deve esserci (rimandato da chi l'ha fatto)
    var w = F("Luca");
    if (!await W.aspetta(function () { return cosa(w) === "scrivo"; }, 10000)) no("con la vice Luca non scrive");
    if (!w.document.querySelector(".td-spazio .td-cv")) no("con la vice Luca non vede il disegno da indovinare («" + T(w).slice(0, 120) + "»)");
    await TD.finoAllaRivelazione(C, ["Giulia", "Luca", "Marco"]);
    var persi = {};
    await TD.sfoglia(C, "Giulia", function (v) { v.riv.pag.forEach(function (pg) { if (pg.perso) persi[pg.pk] = ((v.players || []).filter(function (p) { return p.id === pg.chi; })[0] || {}).nome; }); });
    var chiP = JSON.stringify(persi); persi = Object.keys(persi).length;
    if (persi > 1) no(persi + " disegni persi " + chiP + ": Paky ne aveva fatto uno solo prima di sparire");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("la partita non finisce con la vice");
    var err = W.erroriTel().filter(function (e) { return !/Paky/.test(e); }); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "la vice Giulia porta avanti fino ai premi; disegni persi: " + persi + " (quelli di Paky, che è sparito)";
  } });

  // le misure: niente esce dallo schermo, niente scorre
  function misura(nome, L, H) { var f = W.document.getElementById("tel-" + nome); if (f) { f.style.width = L + "px"; f.style.height = H + "px"; } var w = F(nome); w.dispatchEvent(new w.Event("resize")); }
  function difetti(w) {
    var d = w.document, out = [], H = w.innerHeight, Wd = w.innerWidth;
    var sc = d.querySelector(".td-scena"); if (sc && vede(sc) && sc.scrollHeight > sc.clientHeight + 2) out.push("la scena scorre +" + (sc.scrollHeight - sc.clientHeight));
    var se = d.scrollingElement; if (se && se.scrollHeight > H + 2) out.push("la pagina scorre +" + (se.scrollHeight - H));
    [].forEach.call(d.querySelectorAll(".schermata.td-fine .contenuto"), function (c) { if (vede(c) && c.scrollHeight > c.clientHeight + 2) out.push("i premi scorrono +" + (c.scrollHeight - c.clientHeight)); });
    [].forEach.call(d.querySelectorAll(".fine-tasti button, .td-libri-btn"), function (e) { if (!vede(e)) return; var r = e.getBoundingClientRect(); if (r.bottom > H + 1) out.push("tasto di fine fuori: " + e.textContent.trim().slice(0, 20)); });
    [].forEach.call(d.querySelectorAll(".td-tasto, .td-cv, .td-campo, .td-col, .td-str, .td-spess, .td-r, .td-tempo, .td-foglietto, .td-persona, .td-premio"), function (e) {
      if (!vede(e)) return;
      if (e.closest(".td-feed") || e.closest(".td-gal")) return;   // (il feed sfuma in alto apposta)
      var r = e.getBoundingClientRect();
      if (r.bottom > H + 1 || r.right > Wd + 1 || r.left < -1 || r.top < -1) out.push(e.className.split(" ")[0] + " fuori (" + Math.round(r.left) + "," + Math.round(r.top) + "," + Math.round(r.right) + "," + Math.round(r.bottom) + ")");
    });
    return out;
  }
  TD.difetti = difetti;
  COPIONE.aggiungi("td5", { nome: "Telefono Disegnato in 10: le misure a 360x640 e 412x915 in ogni momento", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco", "Sara", "Dina", "Ciro", "Bea", "Tonio", "Rita"];
    var Z = await TD.stanza(nomi.slice(1)), C = Z.C, out = [], misure = [[360, 640], [412, 915]];
    if (vm(C).L !== 7) no("in 10 i libretti hanno " + vm(C).L + " pagine (dovevano essere 7)");
    async function controlla(cosaE, chi) {
      for (var k = 0; k < misure.length; k++) {
        misura(chi, misure[k][0], misure[k][1]); await W.dorme(450);
        difetti(F(chi)).forEach(function (x) { out.push(cosaE + " " + misure[k].join("x") + ": " + x); });
      }
    }
    if (!await W.aspetta(function () { return cosa(F("Giulia")) === "scrivo"; }, 8000)) no("Giulia non scrive");
    await controlla("frase", "Giulia");
    // tutti tranne Rita: Giulia vede «Fatto!» e aspetta
    var g0 = vm(C).giro;
    nomi.slice(0, 9).forEach(function (n) { TD.faiPagina(n); });
    await W.dorme(800);
    await controlla("aspetto", "Giulia");
    TD.faiPagina("Rita");
    if (!await W.aspetta(function () { return vm(C).giro !== g0; }, 8000)) no("il passo 1 non va avanti");
    if (!await W.aspetta(function () { return cosa(F("Giulia")) === "disegno"; }, 8000)) no("Giulia non disegna al passo 2");
    await controlla("disegno", "Giulia");
    await TD.passo(C, nomi);
    if (!await W.aspetta(function () { return cosa(F("Giulia")) === "scrivo"; }, 8000)) no("Giulia non indovina al passo 3");
    await controlla("indovina", "Giulia");
    await TD.finoAllaRivelazione(C, nomi);
    await W.dorme(1200);
    await controlla("rivelazione", "Giulia");
    var finCtl = false;
    await TD.sfoglia(C, "Paky", async function (v) { if (v.riv.fin && !finCtl) { finCtl = true; } });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("non si arriva ai premi");
    await W.dorme(800);
    await controlla("premi", "Giulia");
    if (out.length) no(out.slice(0, 8).join(" / "));
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "in 10, 7 pagine: frase, attesa, disegno, indovina, rivelazione e premi dentro lo schermo a 360x640 e 412x915";
  } });
})();

// td6 dalla Sala della serata in 5: partita intera, i tasti di fine del core, «↻ Rivincita» (tutti di nuovo nella saletta)
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, TD = W.TD;
  COPIONE.aggiungi("td6", { nome: "Telefono Disegnato dalla Sala in 5: partita intera, tasti di fine, Rivincita", fai: async function () {
    var amici = ["Giulia", "Luca", "Marco", "Bea"], nomi = ["Paky"].concat(amici);
    await W.apriTel("Paky", { x: 0, salaSempre: true, prima: TD.prima() });
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { salaSempre: true, hash: "sala=" + S, x: 185 * ((i + 1) % 6), prima: TD.prima() });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 5; }, 15000)) no("nella Sala non sono in 5");
    var C = await A.lanciaDallaSala("Paky", S, "Telefono Disegnato");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 5; }, 15000)) no("nella saletta non arrivano in 5 (" + (vm(C).players || []).length + ")");
    W.clicca(W.finestra("Paky"), /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 9000)) no("la partita non comincia");
    if (vm(C).L !== 5) no("in 5 i libretti hanno " + vm(C).L + " pagine");
    await TD.finoAllaRivelazione(C, nomi);
    await TD.sfoglia(C, "Paky");
    if (!await W.aspetta(function () { return A.tastiFineDi(W.finestra("Paky")) && A.tastiFineDi(W.finestra("Giulia")); }, 6000)) no("mancano i tasti di fine");
    var tP = A.tastiFineDi(W.finestra("Paky")).join(" | "), tG = A.tastiFineDi(W.finestra("Giulia")).join(" | ");
    if (!/Rivincita/.test(tP) || !/Cambia gioco/.test(tP)) no("i tasti di fine di Paky sono «" + tP + "»");
    W.clicca(W.finestra("Paky"), /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" || vm(C).fase === "gioco" && vm(C).partita === 2; }, 15000)) no("la rivincita non riporta nella saletta (" + vm(C).fase + ")");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "5 dalla Sala, fine «" + tP + "» / «" + tG + "», rivincita ok";
  } });
})();

// td7 i nomi giusti su ogni pagina (in 4: chi scrive la frase la disegna anche; in 5: mai): ogni telefono si annota le
//     pagine che ha fatto (__TD_FATTE), e nella foto della partita, nel feed di Giulia e nella foto per WhatsApp ogni
//     pagina deve avere il nome di chi l'ha fatta davvero; nessuno due volte nello stesso libretto (tranne la frase e il
//     primo disegno in 4)
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T, TD = W.TD;
  async function nomiGiusti(n) {
    var tutti = ["Paky", "Giulia", "Luca", "Marco", "Bea"].slice(0, n);
    var Z = await TD.stanza(tutti.slice(1)), C = Z.C;
    await TD.finoAllaRivelazione(C, tutti);
    var fatte = {}, nomeDi = {}, err = [];
    (vm(C).players || []).forEach(function (p) { nomeDi[p.id] = p.nome; });
    tutti.forEach(function (n) { (W.finestra(n).__TD_FATTE || []).forEach(function (x) { fatte[x.pk] = x.id; }); });
    var attese = vm(C).L * n;
    if (Object.keys(fatte).length !== attese) err.push("pagine annotate " + Object.keys(fatte).length + " (dovevano essere " + attese + ")");
    var visti = {};
    await TD.sfoglia(C, "Paky", function (v) {
      var rv = v.riv, chi = {};
      rv.pag.forEach(function (pg, j) {
        if (fatte[pg.pk] !== pg.chi) err.push("libretto di " + nomeDi[rv.a] + " pagina " + (j + 1) + ": la foto dice " + nomeDi[pg.chi] + ", l'ha fatta " + nomeDi[fatte[pg.pk]]);
        if (j === 0 && pg.chi !== rv.a) err.push("il libretto di " + nomeDi[rv.a] + " comincia con la frase di " + nomeDi[pg.chi]);
        var doppia = chi[pg.chi] != null && !(n % 2 === 0 && j === 1 && chi[pg.chi] === 0);
        if (doppia) err.push("nel libretto di " + nomeDi[rv.a] + " " + nomeDi[pg.chi] + " fa due pagine (" + (chi[pg.chi] + 1) + " e " + (j + 1) + ")");
        chi[pg.chi] = j;
      });
      // il feed di Giulia: ogni voce col nome giusto («Tu» per lei)
      if (!rv.fin && !visti[rv.i + "|" + rv.p]) {
        visti[rv.i + "|" + rv.p] = 1;
        var G = W.finestra("Giulia"), voci = G.document.querySelectorAll(".td-feed .td-voce");
        rv.pag.forEach(function (pg, j) {
          var tx = voci[j] && (voci[j].querySelector(".td-chi") || {}).textContent || "", atteso = nomeDi[pg.chi] === "Giulia" ? "Tu" : nomeDi[pg.chi];
          if (voci[j] && tx.indexOf(atteso + " ") !== 0 && tx.indexOf("🎲 " + atteso + " ") !== 0) err.push("feed di Giulia, libretto di " + nomeDi[rv.a] + " pagina " + (j + 1) + ": «" + tx + "» (doveva essere " + atteso + ")");
        });
      }
    });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("non si arriva ai premi");
    // la foto per WhatsApp di ogni libretto (dalla galleria di Giulia)
    var G = W.finestra("Giulia");
    try { Object.defineProperty(G.navigator, "canShare", { configurable: true, value: function () { return false; } }); } catch (e) {}
    G.HTMLAnchorElement.prototype.click = function () {};
    W.clicca(G, /Rivedi i libretti/);
    if (!await W.aspetta(function () { return G.document.querySelectorAll(".td-gal-lib").length === n; }, 4000)) no("nella galleria non ci sono " + n + " libretti");
    for (var k = 0; k < n; k++) {
      G.document.querySelectorAll(".td-gal-lib")[k].click(); await W.dorme(200);
      G.__TD_WA = null; W.clicca(G, /Manda su WhatsApp/); await W.dorme(300);
      (G.__TD_WA || []).forEach(function (x) { if (nomeDi[fatte[x.pk]] !== x.nome) err.push("foto per WhatsApp, pagina " + x.pk + ": " + x.nome + " (l'ha fatta " + nomeDi[fatte[x.pk]] + ")"); });
      if (!G.__TD_WA) err.push("la foto per WhatsApp del libretto " + (k + 1) + " non parte");
      G.document.querySelector(".td-gal .td-esci").click(); await W.dorme(150);
    }
    if (err.length) no(err.slice(0, 4).join(" / "));
    return "in " + n + ": " + attese + " pagine, tutte col nome giusto (foto, feed, WhatsApp)";
  }
  COPIONE.aggiungi("td7", { nome: "Telefono Disegnato: ogni pagina col nome di chi l'ha fatta (in 4)", fai: async function () {
    var a = await nomiGiusti(4);
    W.chiudiTutti && W.chiudiTutti();
    return a;
  } });
  COPIONE.aggiungi("td7b", { nome: "Telefono Disegnato: ogni pagina col nome di chi l'ha fatta (in 5)", fai: async function () { return nomiGiusti(5); } });
})();
