// PROVE DEL PASSO 5 PER «L'IMPOSTORE» (js/games/impostore.js: riprende + riserva, dal 18 ott 2026).
// Uso (dopo copione-prova.js): await COPIONE.carica("passo5/impostore.js"); await COPIONE.prova("5im1")
//   Edge invisibile: prova.js --porta 8978 --carica passo5/impostore.js --prova 5im1,5im2,5im3,5im4 --timeout 900
// Tutte col percorso di prima (stanza di un gioco solo), col gioco vero ("impostore", in GIOCHI_ONLINE). Profili finti.
// Le regole della partita si mettono nella memoria del telefono di Paky (sg_impostore_regole) prima di aprire la stanza.
// 5im1 Paky, Giulia e Luca, 2 mani, 2 giri di indizi: l'host ricarica mentre si scrivono gli indizi (Giulia ha già scritto)
//      → la partita RIPRENDE (niente saletta, «🔁 Paky è tornato…»): stessa parola sul telefono di ognuno, l'indizio di
//      Giulia resta («✅ Hai scritto»), stesso giro, almeno 12 s per scrivere; si continua. Poi ricarica sulla fine della
//      mano → la fine mano resta per tutti, i punti NON si danno due volte, dopo il conto (almeno 6 s) parte la 2ª mano coi
//      punti di prima; fino alla classifica (punti giusti, XP una volta a testa, un solo "__esito").
// 5im2 Paky, Giulia e Luca, 1 mano: l'host ricarica durante il voto (2 voti dati: restano, il terzo chiude il voto), poi
//      mentre l'impostore scoperto sceglie la parola (l'ultima possibilità resta sua e si gioca), poi sulla classifica →
//      la classifica resta, i punti uguali, XP una volta a testa, un solo "__esito".
// 5im3 Riserva in 4 (Paky, Giulia, Luca, Sara), 1 mano: il telefono di Paky si spegne del tutto mentre si scrivono gli
//      indizi → entro 8 s la partita la tiene Giulia (_g 2): stessa parola per tutti, gli indizi già scritti restano;
//      «👑 … la porti avanti tu» e «👑 Ora la partita la tiene Giulia»; si va avanti senza Paky; Paky torna: «👋 Bentornato!
//      … rientri come giocatore», ritrova la SUA parola e gioca; mai due host; fino alla classifica: XP una volta a testa
//      (anche Paky), un solo "__esito" (di Giulia). Le parole mai nella foto per tutti. «Nuova partita»: in saletta la
//      corona a Giulia (prima), Paky seduto da amico.
// 5im4 Riserva tenuta da chi guarda: Paky, Giulia e Luca giocano, Marco arriva a partita cominciata e guarda; il telefono
//      di Paky si spegne → la partita la tiene Marco GUARDANDO (vede il segreto di chi guarda, niente «Tu»), Giulia e Luca
//      vanno avanti; Paky torna con la sua parola; classifica, un "__esito" di Marco; «Nuova partita»: Marco si siede, primo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  var GID = "impostore", NOME = "L'Impostore", CHIAVE = "sg_impostore_regole";
  function no(p) { throw new Error("NO: " + p); }
  function vm(C) { return W.vmDi(C) || {}; }
  function pill(w) { return w ? [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | ") : ""; }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  // il motore della partita sul telefono di chi la tiene
  function HI(nome) { var w = W.finestra(nome); return w && w.__impHost; }
  function H(nome) { var h = HI(nome); return h && h.H(); }
  function puntiDi(nome) { var h = H(nome); if (!h) return null; var o = {}; h.players.forEach(function (p) { o[p.nome] = p.punti; }); return JSON.stringify(o); }
  // ---- la carta segreta e le mosse (come migliora/impostore.js) ----
  function carta(w) {
    var d = w && w.document; if (!d) return {};
    var q = function (s) { var e = d.querySelector(s); return e ? e.textContent : ""; };
    return { su: q(".im-c-su"), grande: q(".im-c-grande"), giu: q(".im-c-giu"), coperta: q(".im-c-tx") };
  }
  function ruoloDi(w) { var c = carta(w); return /impostore/.test(c.su) ? "imp" : /spia/.test(c.su) ? "spia" : /La tua parola/.test(c.su) ? "civ" : null; }
  function scrivi(w, testo) {
    var inp = w.document.querySelector(".im-input"), b = w.document.querySelector(".im-invia");
    if (!inp || !b) return false;
    inp.value = testo; inp.dispatchEvent(new w.Event("input", { bubbles: true })); b.click(); return true;
  }
  function vota(w, nome) {
    var b = [].filter.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent === nome; })[0];
    if (!b || b.disabled) return false; b.click(); return true;
  }
  async function pronto(w) { var b = await W.aspetta(function () { var x = w && w.document.querySelector(".im-pronto"); return x && !x.disabled ? x : null; }, 3000); if (!b) return false; b.click(); return true; }
  async function aspettaPasso(C, passo, ms) { return W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.passo === passo ? v : null; }, ms || 8000); }
  function idDi(C, nome) { var p = (vm(C).players || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  async function scriviTutti(C, nomi, pre) {
    var v = await aspettaPasso(C, "indizi", 10000); if (!v) no("non si scrivono gli indizi (" + vm(C).passo + ")");
    var g = v.giro, mano = v.mano;
    for (var i = 0; i < nomi.length; i++) {
      var w = W.finestra(nomi[i]);
      if (!await W.aspetta(function () { return w.document.querySelector(".im-input") || w.document.querySelector(".im-fatto"); }, 5000)) no(nomi[i] + " non ha il campo dell'indizio («" + T(w).slice(0, 80) + "»)");
      if (w.document.querySelector(".im-input")) scrivi(w, (pre || "indizio") + nomi[i].slice(0, 3).toLowerCase() + g);
    }
    if (!await W.aspetta(function () { var x = vm(C); return x.mano !== mano || x.passo !== "indizi" || x.giro !== g; }, 12000)) no("il giro di indizi non si chiude quando hanno scritto tutti");
    return vm(C);
  }
  function ruoli(nomi) { var r = {}; nomi.forEach(function (n) { r[n] = ruoloDi(W.finestra(n)); }); return r; }
  async function carteDi(nomi, ms) {
    if (!await W.aspetta(function () { return nomi.every(function (n) { return ruoloDi(W.finestra(n)); }); }, ms || 8000))
      no("non tutti hanno la carta: " + nomi.map(function (n) { return n + "=" + (carta(W.finestra(n)).grande || "?"); }).join(" "));
    var o = {}; nomi.forEach(function (n) { var c = carta(W.finestra(n)); o[n] = c.su + "|" + c.grande + "|" + c.giu; }); return o;
  }
  async function stesseCarte(prima, ms) {
    var nomi = Object.keys(prima), ora = {};
    var ok = await W.aspetta(function () { return nomi.every(function (n) { var c = carta(W.finestra(n)); ora[n] = c.su + "|" + c.grande + "|" + c.giu; return ora[n] === prima[n]; }); }, ms || 8000);
    if (!ok) no("le carte non sono quelle di prima: " + nomi.filter(function (n) { return ora[n] !== prima[n]; }).map(function (n) { return n + " «" + prima[n] + "» → «" + ora[n] + "»"; }).join("; "));
  }
  // si discute (🗳️ Votiamo da tutti) e si vota: "innocente" = tutti contro un cittadino (niente ultima possibilità),
  // "impostore" = i cittadini contro l'impostore (l'impostore contro un cittadino)
  async function discutiEVota(C, nomi, come, salta) {
    var v = await aspettaPasso(C, "discuti", 10000); if (!v) no("non si discute (" + vm(C).passo + ")");
    for (var i = 0; i < nomi.length; i++) await pronto(W.finestra(nomi[i]));
    if (!await aspettaPasso(C, "voto", 6000)) no("con «🗳️ Votiamo» di tutti non si vota");
    var r = ruoli(nomi), imp = nomi.filter(function (n) { return r[n] === "imp"; })[0], civ = nomi.filter(function (n) { return r[n] !== "imp"; });
    if (!imp && come === "impostore") no("nessuno ha la carta dell'impostore: " + JSON.stringify(r));
    for (var k = 0; k < nomi.length; k++) {
      var n = nomi[k]; if (salta && salta.indexOf(n) >= 0) continue;
      var chi = come === "impostore" ? (n === imp ? civ[0] : imp) : (n === civ[0] ? (civ[1] || imp) : civ[0]);
      var w = W.finestra(n);
      if (!await W.aspetta(function () { return vota(w, chi); }, 4000)) no(n + " non riesce a votare " + chi);
      await W.dorme(150);
    }
    return { imp: imp, civ: civ };
  }
  function prima(nome, regole) {
    var conta = A.contaPartite(nome);
    return function (w) { if (regole) try { w.localStorage.setItem(CHIAVE, JSON.stringify(regole)); } catch (e) {} conta(w); };
  }
  // l'host ricarica e la partita riprende: foto nuova (_r), nessuno in saletta, pillole. Restituisce { P, dt }
  async function ricaricaHost(C, amici, ok, ms) {
    var s0 = (W.statoStanza(C) || {})._s, t0 = Date.now(), pillAm = {}, sal = "";
    var P = await W.ricarica("Paky", { prima: prima("Paky") });
    var fatto = await W.aspetta(function () {
      amici.forEach(function (n) { var w = W.finestra(n); if (/tornato/.test(pill(w))) pillAm[n] = 1; if (w.document.querySelector(".saletta-schermo")) sal = n; });
      var s = W.statoStanza(C) || {};
      return s._s && s._s !== s0 && s._r && ok();
    }, ms || 12000);
    if (!fatto) no("ricaricando la partita non riprende (" + JSON.stringify({ fase: vm(C).fase, passo: vm(C).passo, r: (W.statoStanza(C) || {})._r }) + ", «" + T(W.finestra("Paky")).slice(0, 60) + "»)");
    if (sal) no(sal + " è passato dalla saletta");
    await A.pilloleDi(amici.filter(function (n) { return !pillAm[n]; }), /tornato/, 4000).then(function (x) { Object.keys(x).forEach(function (n) { if (x[n]) pillAm[n] = 1; }); });
    amici.forEach(function (n) { if (!pillAm[n]) no(n + " non legge «🔁 Paky è tornato…» («" + pill(W.finestra(n)) + "»)"); });
    return { P: P, dt: ((Date.now() - t0) / 1000).toFixed(1) };
  }
  function esitiDi(C) { return (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/stato") >= 0 && x.p.indexOf('"__esito"') >= 0; }); }
  // le parole non passano mai nei messaggi per tutti (solo nei "seg" con "to", nella copia per i vice e a mano finita)
  function paroleInChiaro(C, parole) {
    var male = [];
    (W.BR.storia || []).forEach(function (m) {
      if (m.topic.indexOf("/" + C + "/") < 0) return;
      var x; try { x = JSON.parse(m.p); } catch (e) { return; }
      var d = x && (x.data || x); if (!d || typeof d !== "object") return;
      // (per un telefono solo: i segreti con "to"; la copia della partita per i vice, "__ris", che nessuno vede: passano
      // dallo stesso canale del broker come i segreti "to", quindi non aprono un buco nuovo)
      if (d.to || d.t === "__ris") return;
      if (d.t === "indizio" || d.t === "indovina") return;
      var v = d.vm || (d.t === "vm" ? d : null);
      if (v && (v.passo === "esito" || v.fase !== "gioco")) return;
      var s = m.p; if (v && v.passo === "ultima") s = JSON.stringify(Object.assign({}, v, { ultima: null }));
      parole.forEach(function (p) { if (p && s.toLowerCase().indexOf("\"" + p.toLowerCase() + "\"") >= 0) male.push("«" + p + "» in un messaggio per tutti di " + m.da + ": " + s.slice(0, 80)); });
    });
    return male;
  }

  // ---------------- 5im1: ricarica mentre si scrivono gli indizi e sulla fine della mano ----------------
  COPIONE.aggiungi("5im1", { nome: "Impostore · in 3, 2 mani: l'host ricarica mentre si scrivono gli indizi (stesse parole, l'indizio resta) e sulla fine mano (niente punti doppi), fino alla classifica", fai: async function () {
    W.__partite = {};
    var L = [], nomi = ["Paky", "Giulia", "Luca"], carte0 = null, seg0 = null, idG = null;
    var REG = { mani: 2, giri: 2, tempo: 60, indizi: "scritti", spia: "no", aiuto: "categoria", voto: "una" };
    var r = await A.provaRipresa({ gioco: GID, hash: null, amici: ["Giulia", "Luca"], prima: function (w) {
        var n = String((w.frameElement && w.frameElement.id) || "").replace(/^tel-/, ""); prima(n, n === "Paky" ? REG : null)(w);
      }, riapri: { prima: prima("Paky") },
      apri: async function (P) { return W.apriStanza(P, NOME); },
      arriva: function (v) { return A.contaDentro(v) >= 3; },
      comincia: async function (C, P) { if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»"); },
      fase: function (v) { return v.fase === "gioco" && v.passo === "indizi" && v.giro === 1; },
      prepara: async function (C) {
        if (vm(C).mani !== 2) no("le mani sono " + vm(C).mani + " invece di 2 (le regole non sono arrivate)");
        carte0 = await carteDi(nomi);
        idG = idDi(C, "Giulia");
        scrivi(W.finestra("Giulia"), "primogiu");
        if (!await W.aspetta(function () { return (vm(C).scritto || []).indexOf(idG) >= 0; }, 4000)) no("l'indizio di Giulia non arriva");
        seg0 = JSON.stringify(H("Paky").seg);
      },
      controlla: function (a, v) {
        var h = H("Paky"); if (!h) return "l'host non ha la partita";
        if (h.passo !== "indizi" || h.giro !== 1) return "passo " + h.passo + " " + h.giro;
        if (JSON.stringify(h.seg) !== seg0) return "il segreto della mano è cambiato";
        if (h.cor[idG] !== "primogiu") return "l'indizio di Giulia non c'è più";
        return (v.rip || 0) >= 1 ? true : "la foto non dice rip";
      } });
    var C = r.C;
    await stesseCarte(carte0);
    if (!await W.aspetta(function () { return /Hai scritto/.test(T(W.finestra("Giulia"))); }, 4000)) no("dopo la ripresa Giulia non vede «✅ Hai scritto»");
    var resta = (H("Paky").scadenza - Date.now()) / 1000;
    if (resta < 6) no("dopo la ripresa restano solo " + resta.toFixed(1) + " s per scrivere");
    L.push("1ª ricarica mentre si scrivono gli indizi: ripresa in " + r.dt + " s, stesse parole, l'indizio di Giulia resta, " + Math.round(resta) + " s per scrivere");
    // si continua: fino alla fine della prima mano (tutti contro un cittadino: niente ultima possibilità)
    var v = await scriviTutti(C, nomi);
    if (v.passo !== "indizi" || v.giro !== 2) no("dopo il giro 1 non si passa al giro 2 (" + v.passo + " " + v.giro + ")");
    if (((v.ind || {})[idG] || [])[0] !== "primogiu") no("al giro 2 l'indizio di Giulia del giro 1 non è svelato: " + JSON.stringify(v.ind));
    await scriviTutti(C, nomi);
    await discutiEVota(C, nomi, "innocente");
    if (!await aspettaPasso(C, "esito", 15000)) no("la prima mano non finisce (" + vm(C).passo + ")");
    if (!await W.aspetta(function () { return nomi.every(function (n) { return W.finestra(n).document.querySelector(".im-es-r"); }); }, 5000)) no("non tutti vedono la fine della mano");
    await W.dorme(1000);
    var punti1 = puntiDi("Paky"), t2 = Date.now();
    if (punti1 === JSON.stringify({ Paky: 0, Giulia: 0, Luca: 0 })) no("a fine mano nessuno ha punti");
    // ---- 2ª ricarica: sulla fine della mano ----
    var r2 = await ricaricaHost(C, ["Giulia", "Luca"], function () { var h = H("Paky"); return h && h.passo === "esito" && W.finestra("Paky").document.querySelector(".im-es-r"); });
    if (puntiDi("Paky") !== punti1) no("2ª ricarica: i punti sono cambiati " + punti1 + " → " + puntiDi("Paky"));
    if (!["Giulia", "Luca"].every(function (n) { return W.finestra(n).document.querySelector(".im-es-r"); })) no("2ª ricarica: gli amici non sono più sulla fine della mano");
    if (!await W.aspetta(function () { var h = H("Paky"); return h && h.mano === 2 && h.passo === "indizi"; }, 30000)) no("dopo la 2ª ricarica la seconda mano non parte");
    var dt2 = (Date.now() - t2) / 1000;
    if (dt2 < 6) no("la seconda mano è partita dopo " + dt2.toFixed(1) + " s: niente respiro");
    if (puntiDi("Paky") !== punti1) no("nella seconda mano i punti non sono quelli di prima (" + puntiDi("Paky") + " invece di " + punti1 + ")");
    await carteDi(nomi);
    L.push("2ª ricarica sulla fine mano (ripresa in " + r2.dt + " s): resta per tutti, punti " + punti1 + " non dati due volte, 2ª mano dopo " + dt2.toFixed(1) + " s");
    // la seconda mano fino alla classifica
    await scriviTutti(C, nomi); await scriviTutti(C, nomi);
    await discutiEVota(C, nomi, "innocente");
    if (!await aspettaPasso(C, "esito", 15000)) no("la seconda mano non finisce");
    var hh = H("Paky"), att = {}; hh.players.forEach(function (p) { att[p.nome] = p.punti; });
    for (var i = 0; i < nomi.length; i++) await pronto(W.finestra(nomi[i]));
    if (!await W.aspetta(function () { return vm(C).fase === "fine" && nomi.every(function (n) { return W.finestra(n).document.querySelector(".classifica"); }); }, 8000)) no("non si arriva alla classifica");
    (vm(C).classifica || []).forEach(function (x) { if (x.punti !== att[x.nome]) no("in classifica " + x.nome + " ha " + x.punti + " invece di " + att[x.nome]); });
    await W.dorme(1500);
    nomi.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
    if (esitiDi(C).length !== 1) no("gli __esito sono " + esitiDi(C).length);
    errori();
    L.push("classifica coi punti giusti " + JSON.stringify(att) + ", XP una volta a testa, un solo __esito");
    return L.join(" · ");
  } });

  // ---------------- 5im2: ricarica durante il voto, durante l'ultima possibilità e sulla classifica ----------------
  COPIONE.aggiungi("5im2", { nome: "Impostore · in 3, 1 mano: l'host ricarica durante il voto (i voti restano), mentre l'impostore sceglie la parola e sulla classifica (XP e esito una volta)", fai: async function () {
    W.__partite = {};
    var L = [], nomi = ["Paky", "Giulia", "Luca"], voti0 = null, carte0 = null, chi = null;
    var REG = { mani: 1, giri: 1, tempo: 60, indizi: "scritti", spia: "no", aiuto: "categoria", voto: "una" };
    var r = await A.provaRipresa({ gioco: GID, hash: null, amici: ["Giulia", "Luca"], prima: function (w) {
        var n = String((w.frameElement && w.frameElement.id) || "").replace(/^tel-/, ""); prima(n, n === "Paky" ? REG : null)(w);
      }, riapri: { prima: prima("Paky") },
      apri: async function (P) { return W.apriStanza(P, NOME); },
      arriva: function (v) { return A.contaDentro(v) >= 3; },
      comincia: async function (C, P) { if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»"); },
      fase: function (v) { return v.fase === "gioco" && v.passo === "indizi"; },
      prepara: async function (C) {
        carte0 = await carteDi(nomi);
        await scriviTutti(C, nomi);
        if (!await aspettaPasso(C, "discuti", 6000)) no("non si discute");
        for (var i = 0; i < nomi.length; i++) await pronto(W.finestra(nomi[i]));
        if (!await aspettaPasso(C, "voto", 6000)) no("non si vota");
        // i cittadini votano l'impostore; il voto dell'impostore arriva dopo la ricarica
        var rr = ruoli(nomi); chi = { imp: nomi.filter(function (n) { return rr[n] === "imp"; })[0] }; chi.civ = nomi.filter(function (n) { return n !== chi.imp; });
        for (var k = 0; k < chi.civ.length; k++) { var w = W.finestra(chi.civ[k]); if (!await W.aspetta(function () { return vota(w, chi.imp); }, 4000)) no(chi.civ[k] + " non vota"); }
        if (!await W.aspetta(function () { return (vm(C).votato || []).length === 2; }, 4000)) no("i due voti non arrivano");
        voti0 = JSON.stringify(H("Paky").voti);
      },
      controlla: function () {
        var h = H("Paky"); if (!h) return "l'host non ha la partita";
        if (h.passo !== "voto") return "passo " + h.passo;
        return JSON.stringify(h.voti) === voti0 ? true : "i voti sono cambiati: " + voti0 + " → " + JSON.stringify(h.voti);
      } });
    var C = r.C;
    await stesseCarte(carte0);
    L.push("1ª ricarica durante il voto: ripresa in " + r.dt + " s, i 2 voti restano");
    // l'impostore vota: il voto si chiude (dopo il respiro), lo spoglio accusa lui → ultima possibilità
    var wi = W.finestra(chi.imp);
    if (!await W.aspetta(function () { return vota(wi, chi.civ[0]); }, 5000)) no(chi.imp + " (impostore) non riesce a votare dopo la ripresa");
    if (!await aspettaPasso(C, "ultima", 20000)) no("non arriva l'ultima possibilità (" + vm(C).passo + ")");
    if (!await W.aspetta(function () { return [].filter.call(W.finestra(chi.imp).document.querySelectorAll(".im-sc"), function (b) { return !b.disabled; }).length === 6; }, 5000)) no("l'impostore non ha le 6 parole");
    await W.dorme(900);
    var punti0 = puntiDi("Paky"), ult0 = JSON.stringify(H("Paky").ultima);
    // ---- 2ª ricarica: mentre l'impostore sceglie ----
    var r2 = await ricaricaHost(C, ["Giulia", "Luca"], function () { var h = H("Paky"); return h && h.passo === "ultima"; });
    if (JSON.stringify(H("Paky").ultima) !== ult0) no("l'ultima possibilità è cambiata: " + ult0 + " → " + JSON.stringify(H("Paky").ultima));
    if ((H("Paky").scadenza - Date.now()) < 5000) no("dopo la ripresa l'impostore ha meno di 5 s per scegliere");
    var parola = H("Paky").seg.parola;
    var sb = null;
    if (!await W.aspetta(function () { sb = [].filter.call(W.finestra(chi.imp).document.querySelectorAll(".im-sc"), function (b) { return !b.disabled && b.textContent !== parola; })[0]; return sb; }, 6000)) no("dopo la ripresa l'impostore non può scegliere");
    sb.click();
    if (!await aspettaPasso(C, "esito", 12000)) no("dopo la scelta non arriva la fine della mano (" + vm(C).passo + ")");
    if (H("Paky").ultima.scelto !== sb.textContent) no("la parola scelta non è quella toccata");
    L.push("2ª ricarica durante l'ultima possibilità (" + r2.dt + " s): resta all'impostore, sceglie e si va alla fine mano");
    for (var i = 0; i < nomi.length; i++) await pronto(W.finestra(nomi[i]));
    if (!await W.aspetta(function () { return vm(C).fase === "fine" && nomi.every(function (n) { return W.finestra(n).document.querySelector(".classifica"); }); }, 8000)) no("non si arriva alla classifica");
    await W.dorme(1500);
    var cl = JSON.stringify(vm(C).classifica);
    if (esitiDi(C).length !== 1) no("a fine partita gli __esito sono " + esitiDi(C).length);
    // ---- 3ª ricarica: sulla classifica ----
    await ricaricaHost(C, ["Giulia", "Luca"], function () { var h = H("Paky"); return h && h.fase === "fine" && W.finestra("Paky").document.querySelector(".classifica"); });
    await W.dorme(2500);
    if (JSON.stringify(vm(C).classifica) !== cl) no("sulla classifica ripresa i punti sono cambiati");
    nomi.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
    if (esitiDi(C).length !== 1) no("dopo la ricarica gli __esito sono " + esitiDi(C).length);
    if (!["Giulia", "Luca"].every(function (n) { return W.finestra(n).document.querySelector(".classifica"); })) no("gli amici non sono più sulla classifica");
    if (!/Nuova partita|Rivincita/.test(T(W.finestra("Paky")))) no("sulla classifica ripresa Paky non ha «Nuova partita»");
    errori();
    L.push("3ª ricarica sulla classifica: resta, XP una volta a testa, un solo __esito (punti prima " + punti0 + ")");
    return L.join(" · ");
  } });

  // ---------------- la riserva: apre la stanza con gli amici uno alla volta (i vice sono i primi arrivati) ----------------
  async function apriConAmici(amici, REG) {
    var P = await W.apriTel("Paky", { x: 0, prima: prima("Paky", REG) });
    var C = await W.apriStanza(P, NOME), ids = { Paky: "host" };
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i], k = i + 2;
      await W.apriTel(n, { hash: "gioco=" + GID + "&stanza=" + C, x: 185 * (i + 1), prima: prima(n) });
      if (!await W.aspetta(function () { return A.contaDentro(vm(C)) >= k; }, 10000)) no(n + " non entra in saletta");
      ids[n] = A.mioId(n);
      await W.dorme(300);
    }
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    if (!await aspettaPasso(C, "indizi", 10000)) no("la partita non comincia");
    return { P: P, C: C, ids: ids };
  }
  function sentinella(nomi) {
    var visti = [];
    var id = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Collegamento perso|La stanza è chiusa|ha chiuso la/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 150);
    return { stop: function () { clearInterval(id); return visti; } };
  }

  // ---------------- 5im3: la riserva in 4 ----------------
  COPIONE.aggiungi("5im3", { nome: "Impostore · riserva in 4: l'host si spegne mentre si scrivono gli indizi, Giulia porta avanti la partita; Paky torna con la sua parola; fino alla classifica", fai: async function () {
    W.__partite = {};
    var nomi = ["Paky", "Giulia", "Luca", "Sara"], amici = nomi.slice(1), L = [];
    var REG = { mani: 1, giri: 2, tempo: 60, indizi: "scritti", spia: "no", aiuto: "categoria", voto: "una" };
    var Z = await apriConAmici(amici, REG), C = Z.C, ids = Z.ids;
    var carte0 = await carteDi(nomi);
    // giro 1: scrivono Giulia e Luca; poi Paky si spegne del tutto
    scrivi(W.finestra("Giulia"), "primogiu"); scrivi(W.finestra("Luca"), "primoluc");
    if (!await W.aspetta(function () { return (vm(C).scritto || []).length === 2; }, 4000)) no("gli indizi di Giulia e Luca non arrivano");
    await W.dorme(1800);   // (la copia ai vice: al massimo una al secondo)
    var seg0 = JSON.stringify(H("Paky").seg), parola = H("Paky").seg.parola, t0 = Date.now(), sent = sentinella(amici);
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === ids.Giulia; }, 8000)) no("dopo 8 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    var pg = await A.pilloleDi(["Giulia"], /porti avanti tu/, 3000), pa = await A.pilloleDi(["Luca", "Sara"], /Ora la partita la tiene Giulia/, 4000);
    if (!pg.Giulia) no("Giulia non legge «… la porti avanti tu» («" + pill(W.finestra("Giulia")) + "»)");
    if (!pa.Luca || !pa.Sara) no("gli amici non leggono «Ora la partita la tiene Giulia» (" + JSON.stringify(pa) + ")");
    L.push("Giulia tiene la partita in " + dt + " s");
    if (!await W.aspetta(function () { return H("Giulia"); }, 4000)) no("sul telefono di Giulia non c'è la partita");
    var G = H("Giulia");
    if (HI("Giulia").io !== ids.Giulia) no("Giulia tiene la partita col nome «" + HI("Giulia").io + "»");
    if (JSON.stringify(G.seg) !== seg0) no("con Giulia il segreto della mano è cambiato");
    if (G.cor[ids.Giulia] !== "primogiu" || G.cor[ids.Luca] !== "primoluc") no("con Giulia gli indizi già scritti non ci sono più: " + JSON.stringify(G.cor));
    var pk = G.players.filter(function (p) { return p.id === "host"; })[0];
    if (!pk || !pk.via) no("con Giulia Paky non è fuori (" + JSON.stringify(pk) + ")");
    var c3 = {}; amici.forEach(function (n) { c3[n] = carte0[n]; });
    await stesseCarte(c3);
    if (!await W.aspetta(function () { return /Hai scritto/.test(T(W.finestra("Giulia"))) && /Hai scritto/.test(T(W.finestra("Luca"))); }, 5000)) no("Giulia o Luca non vedono «✅ Hai scritto»");
    L.push("stesse parole, gli indizi già scritti restano");
    // Sara scrive: senza Paky il giro si chiude (dopo il respiro)
    scrivi(W.finestra("Sara"), "primosar");
    if (!await W.aspetta(function () { var h = H("Giulia"); return h && h.passo === "indizi" && h.giro === 2; }, 15000)) no("senza Paky il giro 1 non si chiude (" + JSON.stringify({ passo: (H("Giulia") || {}).passo, giro: (H("Giulia") || {}).giro }) + ")");
    while (Date.now() - t0 < 10000) await W.dorme(300);
    // ---- Paky torna (l'app era solo in secondo piano) ----
    var t1 = Date.now();
    A.torna("Paky");
    var pp = await A.pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 9000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Giulia…» («" + pill(W.finestra("Paky")) + "»)");
    if (!await W.aspetta(function () { var h = H("Giulia"), p = h && h.players.filter(function (x) { return x.id === "host"; })[0]; return p && !p.via; }, 20000)) no("Paky non rientra in partita");
    await stesseCarte({ Paky: carte0.Paky }, 10000);
    L.push("Paky torna, rientra e ritrova la sua parola");
    // ---- fino alla classifica ----
    await scriviTutti(C, nomi, "secondo");
    await discutiEVota(C, nomi, "innocente");
    if (!await aspettaPasso(C, "esito", 15000)) no("la mano tenuta da Giulia non finisce");
    for (var i = 0; i < nomi.length; i++) await pronto(W.finestra(nomi[i]));
    if (!await W.aspetta(function () { return vm(C).fase === "fine" && nomi.every(function (n) { return W.finestra(n).document.querySelector(".classifica"); }); }, 10000)) no("non tutti vedono la classifica");
    await W.dorme(3000);
    var altre = A.fotoDa(C, t1 + 2500).filter(function (x) { return x.h !== ids.Giulia; });
    if (altre.length) no("dopo il ritorno di Paky ci sono foto di un altro host: " + JSON.stringify(altre.slice(0, 3)));
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== ids.Giulia) no("alla fine la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    nomi.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
    var es = esitiDi(C);
    if (es.length !== 1 || es[0].da !== "Giulia") no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di Giulia");
    var male = paroleInChiaro(C, [parola, H("Giulia").seg.simile]); if (male.length) no(male.slice(0, 2).join(" | "));
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    // «Nuova partita»: tutti in saletta, la corona a Giulia (prima), Paky seduto da amico
    W.clicca(W.finestra("Giulia"), /Nuova partita/, ".fine-tasti button, .piede button");
    if (!await W.aspetta(function () { var v = vm(C), p = v.players || []; return v.fase === "lobby" && v.tiene === ids.Giulia && p[0] && p[0].id === ids.Giulia && p.some(function (x) { return x.id === "host"; }); }, 8000))
      no("dopo «Nuova partita» la saletta non ha Giulia prima e Paky dentro (" + JSON.stringify((vm(C).players || []).map(function (p) { return p.id; })) + ")");
    errori();
    L.push("classifica; XP una volta a testa, un __esito di Giulia, mai due host, parole mai in chiaro; «Nuova partita»: Giulia prima, Paky seduto");
    return L.join(" · ");
  } });

  // ---------------- 5im4: la riserva tenuta da chi guarda ----------------
  COPIONE.aggiungi("5im4", { nome: "Impostore · riserva tenuta da chi guarda: Marco arriva tardi e guarda, Paky si spegne, Marco porta avanti la partita guardando; Paky torna", fai: async function () {
    W.__partite = {};
    var L = [], nomi = ["Paky", "Giulia", "Luca"];
    var REG = { mani: 1, giri: 1, tempo: 60, indizi: "scritti", spia: "no", aiuto: "categoria", voto: "una" };
    var Z = await apriConAmici(["Giulia", "Luca"], REG), C = Z.C, ids = Z.ids;
    var carte0 = await carteDi(nomi);
    var M = await W.apriTel("Marco", { hash: "gioco=" + GID + "&stanza=" + C, x: 555, prima: prima("Marco") });
    if (!await W.aspetta(function () { return /Guardi/.test(T(M)) && /Parola:/.test(carta(M).su); }, 10000)) no("Marco non guarda la partita col segreto di chi guarda («" + T(M).slice(0, 60) + "»)");
    var idM = A.mioId("Marco");
    scrivi(W.finestra("Giulia"), "primogiu");
    if (!await W.aspetta(function () { return (vm(C).scritto || []).length === 1; }, 4000)) no("l'indizio di Giulia non arriva");
    await W.dorme(1800);   // (la copia ai vice)
    var seg0 = JSON.stringify(H("Paky").seg), t0 = Date.now();
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idM; }, 10000)) no("dopo 10 s la partita non la tiene Marco (" + JSON.stringify(A.chiTiene(C)) + ")");
    L.push("Marco (guarda) tiene la partita in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
    if (!await W.aspetta(function () { return H("Marco"); }, 4000)) no("sul telefono di Marco non c'è la partita");
    var MH = H("Marco");
    if (MH.players.some(function (p) { return p.id === idM; })) no("Marco si è seduto a giocare invece di tenere la partita guardando");
    if (JSON.stringify(MH.seg) !== seg0) no("con Marco il segreto della mano è cambiato");
    if (!await W.aspetta(function () { var w = W.finestra("Marco"); return /Guardi/.test(T(w)) && /Parola:/.test(carta(w).su) && !w.document.querySelector(".im-input"); }, 6000)) no("Marco non vede la partita come chi guarda («" + T(W.finestra("Marco")).slice(0, 80) + "» · " + carta(W.finestra("Marco")).su + ")");
    await stesseCarte({ Giulia: carte0.Giulia, Luca: carte0.Luca });
    // Luca scrive: senza Paky si va avanti
    scrivi(W.finestra("Luca"), "primoluc");
    if (!await aspettaPasso(C, "discuti", 15000)) no("con Marco la partita non va avanti (" + vm(C).passo + ")");
    L.push("Giulia e Luca vanno avanti, Marco guarda");
    while (Date.now() - t0 < 10000) await W.dorme(300);
    A.torna("Paky");
    var pp = await A.pilloleDi(["Paky"], /Bentornato.*Marco.*rientri come giocatore/, 9000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Marco…» («" + pill(W.finestra("Paky")) + "»)");
    if (!await W.aspetta(function () { var p = (vm(C).players || []).filter(function (x) { return x.id === "host"; })[0]; return p && !p.via; }, 20000)) no("Paky non rientra in partita");
    await stesseCarte({ Paky: carte0.Paky }, 10000);
    L.push("Paky torna con la sua parola");
    await discutiEVota(C, nomi, "innocente");
    if (!await aspettaPasso(C, "esito", 15000)) no("la mano tenuta da Marco non finisce");
    for (var i = 0; i < nomi.length; i++) await pronto(W.finestra(nomi[i]));
    if (!await W.aspetta(function () { return vm(C).fase === "fine" && nomi.concat(["Marco"]).every(function (n) { return W.finestra(n).document.querySelector(".classifica"); }); }, 10000)) no("non tutti vedono la classifica");
    await W.dorme(3000);
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== idM) no("alla fine la partita non la tiene più Marco (" + JSON.stringify(c) + ")");
    if ((W.__partite || {}).Paky !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (Paky doveva averne 1)");
    var es = esitiDi(C);
    if (es.length !== 1 || es[0].da !== "Marco") no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di Marco");
    W.clicca(W.finestra("Marco"), /Nuova partita/, ".fine-tasti button, .piede button");
    if (!await W.aspetta(function () { var v = vm(C), p = v.players || []; return v.fase === "lobby" && v.tiene === idM && p[0] && p[0].id === idM && p.some(function (x) { return x.id === "host"; }); }, 8000))
      no("dopo «Nuova partita» la saletta non ha Marco primo e Paky dentro (" + JSON.stringify((vm(C).players || []).map(function (p) { return p.id; })) + ")");
    errori();
    L.push("classifica, XP a Paky una volta, un __esito di Marco; «Nuova partita»: Marco si siede primo, Paky dentro");
    return L.join(" · ");
  } });

  COPIONE.gruppo5im = async function () { var out = {}; for (var n of ["5im1", "5im2", "5im3", "5im4"]) out[n] = await COPIONE.prova(n); return out; };
})();
