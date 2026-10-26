// PROVE della Linea del tempo "preferita" (16 ott 2026): anno svelato quando si sbaglia («Sbagliato di 12 anni!» e
// «📍 Andava qui»), posti con gli anni («Tra il 1982 e il 1994»), carte già viste che non tornano, «✨ Decide il gioco»
// (da 5 in su ⚡ tutti insieme), risultato più corto e «⏩ Avanti» di tutti, 🔥 ultima carta doppia anche a turno,
// «📅 Dimmi l'anno», «📸 I nostri ricordi», e dal 26 ott 2026 «✋ Rubala» come in Hitster al posto dei voti 👍/👎 (chi pensa
// che chi gioca sbagli tocca il posto giusto, in segreto e anche in tanti sullo stesso posto: presa +100, sbagliata −50,
// «👍 Passo» 0).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/timeline.js"); window.__run = COPIONE.prova("tp1")
// Gli scenari durano 2-5 minuti: lanciali senza aspettarli e poi leggi COPIONE.esiti (o await window.__run).
//
// tp1: Sala in 3 a turno, 3 carte a testa (nel ⚙️ niente più «Rubala con l'anno»). Ogni turno controllato col conto dei
//      punti fatto a parte: l'host piazza dal suo telefono (posto con gli anni, l'anno scritto nel selettore: esatto +100),
//      sbaglia apposta (carta girata con l'anno vero, «Sbagliato di…», «Andava qui»), ruba coi tasti (il posto di chi gioca
//      non si tocca, «📍 L'ha messa qui Giulia», «✋ Secondo te va qui») e passa; gli amici rubano giusto (la carta entra
//      nella linea), in due sullo stesso posto (tutti e due +100, «Rubata da Giulia e Luca»), sbagliato (−50), passano, un
//      telefono con l'app di prima manda 👎 (= passo), chi cambia idea (vale la prima), chi gioca prova a rubarsi la carta
//      (non conta); l'ultima carta di ognuno vale doppio anche per chi ruba; nella foto mai l'anno della carta, mai gli
//      anni detti, mai chi ruba e dove prima del risultato; misure 360x640 e 412x915 col selettore dell'anno e rubando;
//      classifica finale = conto a parte.
// tp2: Sala in 5 senza toccare le regole: si parte «⚡ Tutti insieme» con 10 carte (5 a testa → 10 in tutto). «📸 I nostri
//      ricordi»: 2 di Giulia dal profilo, 1 scritto da Luca nel foglio della saletta (anche a 360x640); nella foto solo
//      quanti e di chi; i ricordi escono tutti nelle 10 carte, chi l'ha scritto non lo gioca («È un tuo ricordo»); il bonus
//      dell'anno va solo al più vicino; «⏩ Avanti» parte subito solo quando lo toccano tutti; senza tocchi il risultato
//      dura circa 15 s (in 5: 9 s di rivelazione + 5,5 da leggere + 1 per gli anni); misure; classifica = conto a parte.
// tp3: Sullo stesso telefono in 2, 3 carte a testa: ricordi scritti dal ⚙️, posti con gli anni, selettore dell'anno,
//      carta sbagliata girata con l'anno, ✋ tutti insieme (posto toccato senza avatar = avviso, avatar acceso, il posto dice
//      chi ruba, presa e furto sbagliato); poi «Rigioca»: nessuna carta della prima partita torna nella seconda.
// tp4: A turno in 3 (stanza di un gioco solo): Giulia ruba e ricarica la pagina (ritrova la decisione presa), l'host ricarica
//      durante il furto (stessa carta rigiocata, furti azzerati), un amico arriva a partita cominciata e guarda
//      (niente tasti per rubare), tempo scaduto (carta girata con l'anno), fino alla fine senza errori.
// tp5: Sullo stesso telefono in 3, ✋ «Uno alla volta»: ci si passa il telefono, si ruba in segreto (chi viene dopo non vede
//      i furti di prima), in due sullo stesso posto, «✋ In 2 vogliono rubarla!», classifica finale = conto a parte.
// tp6: «📆 Epoca» sullo stesso telefono: 5 scelte (di partenza «Tutta la storia»), il conto delle carte segue le categorie,
//      «Dal 1980 a oggi» = carte tutte dal 1980; poi «Scegli tu gli anni»: le maniglie trascinate col dito (dal 1500 al 1800),
//      ‹ › per aggiustare, le maniglie non si scavalcano, l'avviso con pochissime carte; carte tutte negli anni scelti.
// tp7: «📆 Epoca» online dal ⚙️ della saletta: «Scegli tu» (la riga delle regole dice «📆 dall'anno 0 al 1800»), poi
//      «Il Novecento»: la partita intera ha solo carte del Novecento.
// tp8: «🔄 Cambia carta» sullo stesso telefono in 2: al primo turno ognuno cambia (carta nuova, il tasto sparisce e non torna),
//      il cambio non costa un turno, misure col tasto.
// tp9: «🔄 Cambia carta» online: Giulia a messaggio (la seconda volta non vale, Paky vede «Giulia cambia carta!»), Giulia
//      non può cambiare la carta di Paky, Paky col tasto (carta nuova sul suo telefono), la carta giudicata è quella nuova.
// tp10: le foto vere (solo Storia e Invenzioni): la foto sulla carta in mano e la miniatura sulla linea per le carte che la
//      hanno (e mai per quelle senza), si caricano da Wikimedia, misure, la foto che non arriva si toglie.
// tp11: online a turno in 2, Nino arriva a metà del primo giro: aspetta in «prossimi» («✋ Entri al prossimo giro»), entra
//      all'inizio del giro dopo con 0 punti e le carte che restano agli altri, gioca i suoi turni, è nella classifica.
// tp12: lo stesso con «⚡ Tutti insieme»: Nino arriva alla carta 2 ed entra dalla carta 3 con 8 carte.
// tp13-tp16 (26 ott 2026): «🧍 Ognuno la sua linea» (ognuno la sua linea, vince chi arriva prima a N carte, spareggio, chi ha
//      finito guarda le linee degli altri): tp13 partita intera in 3, tp14 spareggio a due (tp14b in 4: gli altri continuano;
//      tp14c spareggio a tre, chi sbaglia esce), tp15 sullo stesso telefono in 2, tp16 l'host ricarica (a metà carta e sul
//      risultato). La descrizione completa è sopra la tp13.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm;

  // ---- aiuti ----
  var RIC = {};   // i ricordi delle prove: titolo → anno
  function senzaErrori(cosa) { var e = W.erroriTel(); if (e.length) no((cosa ? cosa + ": " : "") + "errori: " + e.slice(0, 3).join(" | ")); }
  function annoTx(a) { return a < 0 ? Math.abs(a) + " a.C." : String(a); }
  function annoDi(w, tit) {
    if (RIC[tit] != null) return RIC[tit];
    var cats = w.SG_CATEGORIE || [];
    for (var i = 0; i < cats.length; i++) for (var j = 0; j < (cats[i].eventi || []).length; j++) if (cats[i].eventi[j].titolo === tit) return cats[i].eventi[j].anno;
    return null;
  }
  function gapOk(linea, Y) { return linea.filter(function (e) { return e.anno < Y; }).length; }
  function gapKo(linea, Y) { if (linea.length && linea[0].anno < Y) return 0; if (linea.length && linea[linea.length - 1].anno > Y) return linea.length; return -1; }
  function errAtteso(linea, gap, Y) {
    var a = gap > 0 ? linea[gap - 1].anno : null, b = gap < linea.length ? linea[gap].anno : null;
    if (a != null && Y < a) return a - Y; if (b != null && Y > b) return Y - b; return 0;
  }
  function etAttesa(linea, i) {
    if (!linea.length) return "Metti qui";
    if (i === 0) return "Prima del " + annoTx(linea[0].anno);
    if (i >= linea.length) return "Dopo il " + annoTx(linea[linea.length - 1].anno);
    var a = linea[i - 1].anno, b = linea[i].anno;
    return a === b ? "Nel " + annoTx(a) : "Tra il " + annoTx(a) + " e il " + annoTx(b);
  }
  function idDi(C, nome) { var g = (vm(C).giocatori || []).filter(function (x) { return x.nome === nome; })[0]; return g ? g.id : null; }
  function nomeDi(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  function gDi(C, id) { return (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0] || null; }
  function manda(nome, C, m) { var h = W.reteDi(nome); if (!h) no(nome + " non ha la rete"); m.n = vm(C).n; h.invia(m); }
  async function regola(P, fn) {
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 5000)) no("non trovo ⚙️ Regole");
    await W.dorme(300);
    var f = P.document.querySelector(".sl-foglio"); if (!f) no("il foglio delle regole non si apre");
    await fn(f);
    W.clicca(P, /Fatto/, ".sl-foglio button"); await W.dorme(400);
  }
  function chipIn(f, re) {
    var b = [].find.call(f.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); });
    if (!b) no("nel ⚙️ non trovo " + re); b.click(); return b;
  }
  // un telefono a misura: la pagina non scorre, i tasti in basso dentro lo schermo, la linea si vede ancora
  async function misura(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    // (con la finestra del browser nascosta transizioni e animazioni restano ferme a metà: per misurare si saltano alla fine)
    var ferma = d.createElement("style"); ferma.textContent = "*,*:before,*:after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}";
    d.head.appendChild(ferma);
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(700);
    try { return misuraOra(w, d, nome, larg, alt); } finally { ferma.remove(); }
  }
  function misuraOra(w, d, nome, larg, alt) {
    var tag = nome + " " + larg + "x" + alt + ": ";
    if (d.documentElement.scrollHeight > alt + 1) return tag + "la pagina scorre (" + d.documentElement.scrollHeight + ")";
    if (d.documentElement.scrollWidth > larg + 1) return tag + "la pagina scorre di lato (" + d.documentElement.scrollWidth + ")";
    var tasti = d.querySelectorAll(".st-barra.on button, .st-barra.on input");
    for (var i = 0; i < tasti.length; i++) { var r = tasti[i].getBoundingClientRect(); if (r.width && (r.bottom > alt + 1 || r.right > larg + 1 || r.left < -1)) return tag + "«" + (tasti[i].textContent || tasti[i].className) + "» esce dallo schermo"; }
    var sc = d.querySelector(".st-sch-in .tl-scroll");
    if (sc && sc.getBoundingClientRect().height < 50) return tag + "la linea del tempo non si vede più (" + Math.round(sc.getBoundingClientRect().height) + " px)";
    var es = d.querySelector(".st-sch-in .tl-esito");
    if (es && es.scrollHeight > es.clientHeight + 4) return tag + "il risultato non sta nello schermo (" + es.scrollHeight + " su " + es.clientHeight + ")";
    return "";
  }
  function rimetti(w, nome) { var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); }
  async function misure(w, nome) { var m = await misura(w, nome, 360, 640) || await misura(w, nome, 412, 915); rimetti(w, nome); await W.dorme(300); return m; }
  // scrive l'anno nel selettore (come col dito: tocca la casella, scrive, esce)
  function scriviAnno(w, Y) {
    var inp = w.document.querySelector(".st-barra .tl-anno .v"); if (!inp) return false;
    inp.focus(); inp.value = String(Y); inp.dispatchEvent(new w.Event("input")); inp.blur(); return true;
  }
  // i punti di una riga di risultato (a turno): chi gioca, i voti, i furti
  function contaEsito(punti, v) {
    var es = v.esito || {}, ch = v.turnoId;
    punti[ch] = (punti[ch] || 0) + es.delta + (es.bonusAnno || 0);
    (es.voti || []).forEach(function (x) { punti[x.id] = (punti[x.id] || 0) + x.delta; });
  }
  function confrontaClassifica(C, punti) {
    (vm(C).classifica || []).forEach(function (r) { if (r.punti !== (punti[r.id] || 0)) no(r.nome + " ha " + r.punti + " punti invece di " + (punti[r.id] || 0) + " (conto: " + JSON.stringify(punti) + ")"); });
  }
  async function sala(gioco, amici) {
    var Z = await A.salaConAmici(amici);
    return Z;
  }

  // ---- per guardare con gli occhi: COPIONE.tlFoto("scelta" | "ruba" | "ko" | "ricordi", 360, 640) ferma la partita in quel
  // momento con il telefono di Paky a grandezza vera in alto a sinistra (poi si fa la foto dello schermo) ----
  COPIONE.tlFoto = async function (cosa, larg, alt) {
    A.pulisci();
    var Z = await sala("La linea del tempo", ["Giulia"]);
    var C = await A.lanciaDallaSala("Paky", Z.S, "La linea del tempo"), P = W.finestra("Paky");
    await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 10000);
    function grande() { var f = document.getElementById("tel-Paky"); f.style.width = (larg || 360) + "px"; f.style.height = (alt || 640) + "px"; f.style.transform = "none"; f.style.zIndex = 99; P.dispatchEvent(new P.Event("resize")); }
    if (cosa === "ricordi") { grande(); await W.dorme(400); W.clicca(P, /I nostri ricordi/, ".tl-ric-btn"); return C; }
    W.clicca(P, /Comincia/, ".sl-go");
    var fino = Date.now() + 90000;
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase === "turno" && v.turnoId !== "host") { var Y = annoDi(P, v.carta.titolo); manda("Giulia", C, { t: "scelta", gap: gapKo(v.linea, Y) >= 0 ? gapKo(v.linea, Y) : 0 }); await W.dorme(500); continue; }
      if (v.fase === "turno" && v.turnoId === "host" && (cosa === "scelta" || cosa === "ko")) {
        await W.aspetta(function () { return P.document.querySelector(".tl-slot"); }, 12000);
        var Y2 = annoDi(P, v.carta.titolo), g = cosa === "ko" ? gapKo(v.linea, Y2) : gapOk(v.linea, Y2);
        P.document.querySelectorAll(".tl-slot")[g < 0 ? 0 : g].click(); await W.dorme(200);
        grande();
        if (cosa === "scelta") { scriviAnno(P, Y2); return C; }
        W.clicca(P, /Mettila qui/, ".tl-conferma"); await W.dorme(300);
        manda("Giulia", C, { t: "ruba", gap: null });
        await W.aspetta(function () { return P.document.querySelector(".st-sch-in .tl-esito"); }, 15000); await W.dorme(1200); P.setTimeout = function () { return 0; }; return C;   // (la regia si ferma lì: la foto resta)
      }
      if (v.fase === "votazione" && v.turnoId !== "host" && cosa === "ruba") {
        // ✋ Paky tocca un posto per rubarla (il fantasma rosso «✋ Secondo te va qui»)
        if (await W.aspetta(function () { return bottone(P, /👍 Passo/); }, 12000)) { var s0 = P.document.querySelector(".st-sch-in .tl-slot"); if (s0) s0.click(); grande(); await W.dorme(500); return C; }
      }
      if (v.fase === "votazione" && v.turnoId === "host") manda("Giulia", C, { t: "ruba", gap: null });
      if (v.fase === "esito") W.clicca(P, /Avanti/, ".st-barra button");
      await W.dorme(300);
    }
    return C;
  };

  // ---- ✋ Rubala (dal 26 ott 2026, come in Hitster, al posto dei voti 👍/👎) ----
  function giustoIn(linea, g, Y) { return (g === 0 || linea[g - 1].anno <= Y) && (g === linea.length || Y <= linea[g].anno); }
  // un posto da rubare (né quello di chi gioca): giusto, o sbagliato (−1 se non c'è)
  function postoGiusto(linea, Y, escludi) { for (var g = 0; g <= linea.length; g++) if (g !== escludi && giustoIn(linea, g, Y)) return g; return -1; }
  function postoSbagliato(linea, Y, escludi) { for (var g = linea.length; g >= 0; g--) if (g !== escludi && !giustoIn(linea, g, Y)) return g; return -1; }
  function bottone(w, re, ancheSpento) { return [].filter.call(w.document.querySelectorAll(".st-barra button"), function (b) { return re.test(b.textContent) && (ancheSpento || !b.disabled); })[0] || null; }
  // ruba coi tasti: il posto di chi gioca non si tocca (lì c'è la sua carta, «📍 L'ha messa qui …»), poi «✋ Rubala: va qui!»
  async function rubaTasti(w, linea, gap, tent, chiGioca, primaDi) {
    if (!await W.aspetta(function () { return bottone(w, /👍 Passo/); }, 12000)) return "non trova «👍 Passo» («" + T(w).slice(-160) + "»)";
    var sl = w.document.querySelectorAll(".st-sch-in .tl-slot");
    if (sl.length !== linea.length) return "vede " + sl.length + " posti invece di " + linea.length + " (quello di chi gioca non si tocca)";
    var ch = w.document.querySelector(".st-sch-in .tl-asse > .tl-ev.tent .chi");
    if (!ch || ch.textContent.indexOf(chiGioca) < 0) return "la carta di chi gioca non dice «📍 L'ha messa qui " + chiGioca + "» (" + (ch && ch.textContent) + ")";
    var br = bottone(w, /Tocca il posto/, true);
    if (!br || !br.disabled) return "«✋ Rubala» si può toccare prima di scegliere il posto";
    sl[gap < tent ? gap : gap - 1].click(); await W.dorme(150);
    if (primaDi) await primaDi();
    var b = bottone(w, /Rubala: va qui/);
    if (!b) return "dopo il posto non c'è «✋ Rubala: va qui!»";
    b.click(); return "";
  }
  async function passaTasti(w) { var b = await W.aspetta(function () { return bottone(w, /👍 Passo/); }, 12000); if (!b) return "non trova «👍 Passo»"; b.click(); return ""; }

  // =================== tp1: a turno con ✋ Rubala e l'anno ===================
  COPIONE.aggiungi("tp1", { nome: "Linea del tempo a turno in 3: ✋ Rubala (posto giusto, in tanti sullo stesso, in segreto), Passo, anno svelato, Dimmi l'anno, ultima carta doppia", fai: async function () {
    var Z = await sala("La linea del tempo", ["Giulia", "Luca"]);
    var C = await A.lanciaDallaSala("Paky", Z.S, "La linea del tempo"), P = W.finestra("Paky"), G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    if (!await W.aspetta(function () { return /da 5 in su ⚡ tutti insieme/.test(A.regoleDi(G)); }, 6000)) no("di partenza Giulia legge «" + A.regoleDi(G) + "» (manca «da 5 in su ⚡ tutti insieme»)");
    if (vm(C).insieme) no("in 3 la saletta dice «insieme»");
    await regola(P, async function (f) {
      var att = [].filter.call(f.querySelectorAll(".modo-chip.attiva"), function (x) { return /Decide il gioco/.test(x.textContent); });
      if (!att.length) no("nel ⚙️ «✨ Decide il gioco» non è la scelta di partenza");
      if (/Rubala con l'anno/.test(f.textContent)) no("nel ⚙️ c'è ancora «✋ Rubala con l'anno»");
      var meno = f.querySelector(".stepper button"); meno.click(); meno.click();
    });
    if (!await W.aspetta(function () { return /3 carte a testa/.test(A.regoleDi(G)) && /📅 l'anno/.test(A.regoleDi(G)); }, 5000)) no("Giulia legge «" + A.regoleDi(G) + "»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var ID = { Paky: "host", Giulia: idDi(C, "Giulia"), Luca: idDi(C, "Luca") }, ORD = ["Paky", "Giulia", "Luca"];
    var punti = {}, visti = {}, kVisto = "", turni = 0, misurato = { scelta: false, ruba: false, esito: false };
    var turnoDi = {}, piano = null, fino = Date.now() + 480000, conta = { prese: 0, insieme: 0, perse: 0, passo: 0 };
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n;
      if (k === kVisto) { await W.dorme(200); continue; }
      kVisto = k;
      var js = JSON.stringify(v);
      if (v.insieme) no("la foto dice «insieme»");
      if (v.fase === "turno") {
        var chi = v.turnoId, nChi = v.turnoNome, Y = annoDi(P, v.carta.titolo);
        if (Y == null) no("non trovo l'anno di «" + v.carta.titolo + "»");
        if (v.carta.anno != null) no("nella foto c'è l'anno della carta in gioco");
        turnoDi[chi] = (turnoDi[chi] || 0) + 1;
        var giro = turnoDi[chi], g0 = gDi(C, chi);
        if (!!v.doppio !== (g0.restano === 1)) no("turno " + nChi + " " + giro + ": doppio = " + v.doppio + " con " + g0.restano + " carte");
        var ok = gapOk(v.linea, Y), ko = gapKo(v.linea, Y), sbaglia, an = null;
        // Paky: giusta con l'anno esatto, sbagliata apposta, giusta. Giulia: sbagliata, giusta con l'anno +1, sbagliata. Luca: giusta, sbagliata, giusta con l'anno esatto
        if (nChi === "Paky") { sbaglia = giro === 2; an = giro === 1 ? Y : null; }
        else if (nChi === "Giulia") { sbaglia = giro !== 2; an = giro === 2 ? Y + 1 : null; }
        else { sbaglia = giro === 2; an = giro === 3 ? Y : null; }
        if (sbaglia && ko < 0) sbaglia = false;
        var gap = sbaglia ? ko : ok;
        piano = { chi: chi, nome: nChi, Y: Y, linea: v.linea.slice(), n: v.n, giro: giro, gap: gap, giusto: !sbaglia, anno: an };
        if (chi === "host") {
          if (!await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === v.linea.length + 1; }, 12000)) no("Paky non vede i posti");
          var lab = P.document.querySelectorAll(".tl-slot .lab")[gap].textContent;
          if (lab !== etAttesa(v.linea, gap)) no("il posto " + gap + " dice «" + lab + "» invece di «" + etAttesa(v.linea, gap) + "»");
          var selA = P.document.querySelector(".st-barra .tl-anno");
          if (!selA || !selA.classList.contains("spento")) no("il selettore dell'anno non è spento prima di scegliere il posto");
          P.document.querySelectorAll(".tl-slot")[gap].click(); await W.dorme(200);
          if (P.document.querySelector(".st-barra .tl-anno.spento")) no("dopo il posto il selettore dell'anno resta spento");
          if (an != null) {
            if (!scriviAnno(P, an)) no("non trovo la casella dell'anno");
            await W.dorme(150);
            var cf = P.document.querySelector(".tl-conferma");
            if (!cf || cf.textContent.indexOf(annoTx(an)) < 0) no("il tasto dice «" + (cf && cf.textContent) + "» invece dell'anno " + annoTx(an));
            if (!misurato.scelta) { var m1 = await misure(P, "Paky"); if (m1) no(m1); misurato.scelta = true; }
          }
          if (!W.clicca(P, /Mettila qui/, ".tl-conferma")) no("Paky non riesce a confermare");
        } else manda(nChi, C, { t: "scelta", gap: gap, anno: an });
        await W.dorme(300);
        continue;
      }
      if (v.fase === "votazione" && piano && piano.n === v.n) {
        // in segreto: nella foto chi ha deciso (gli id) e basta, niente posti dei furti, niente anni detti, niente risultato
        if (/"(annoDetto|detto|mosse|voti|rube)"\s*:/.test(js)) no("nella foto ci sono segreti (" + js.match(/"(annoDetto|detto|mosse|voti|rube)"\s*:[^,]*/)[0] + ")");
        if (v.esito) no("durante il furto la foto ha già il risultato");
        if (v.scelta !== piano.gap) no("la foto dice il posto " + v.scelta + " invece di " + piano.gap);
        var pg = postoGiusto(piano.linea, piano.Y, piano.gap), ps = postoSbagliato(piano.linea, piano.Y, piano.gap), dec = {};
        if (piano.nome === "Paky") {
          if (piano.giro === 1) { dec.Giulia = -1; dec.Luca = ps; }
          else if (piano.giro === 2) { dec.Giulia = pg; dec.Luca = pg; }   // in due sullo stesso posto
          else { dec.Giulia = "vecchio"; dec.Luca = -1; }                 // (un telefono con l'app di prima: 👎 = passo)
        } else if (piano.nome === "Giulia") {
          if (piano.giro === 1) { dec.Paky = pg; dec.Luca = ps; }
          else if (piano.giro === 2) { dec.Paky = -1; dec.Luca = ps; }
          else { dec.Paky = -1; dec.Luca = -1; }
        } else {
          if (piano.giro === 1) { dec.Giulia = -1; dec.Paky = ps; }
          else if (piano.giro === 2) { dec.Giulia = pg; dec.Paky = -1; }
          else { dec.Giulia = ps; dec.Paky = -1; }
        }
        // chi gioca prova a rubarsi la carta a messaggio: non conta
        if (piano.nome !== "Paky") { manda(piano.nome, C, { t: "ruba", gap: pg >= 0 ? pg : 0 }); await W.dorme(250); if ((vm(C).hannoVotato || []).indexOf(piano.chi) >= 0) no(piano.nome + " ha rubato la sua stessa carta"); }
        // gli amici a messaggio; Luca al primo turno di Paky cambia idea subito dopo: vale la prima
        ["Giulia", "Luca"].forEach(function (n) {
          if (!(n in dec)) return;
          var d = dec[n];
          manda(n, C, d === "vecchio" ? { t: "voto", d: false } : { t: "ruba", gap: d >= 0 ? d : null });
          if (n === "Luca" && piano.nome === "Paky" && piano.giro === 1) manda(n, C, { t: "ruba", gap: null });
        });
        // Paky coi tasti
        if ("Paky" in dec) {
          var e;
          if (dec.Paky >= 0) {
            e = await rubaTasti(P, piano.linea, dec.Paky, piano.gap, piano.nome, misurato.ruba ? null : async function () {
              var sel = P.document.querySelector(".st-sch-in .tl-slot.sel .fant.ruba");
              if (!sel || !/Secondo te va qui/.test(sel.textContent)) no("il posto scelto per rubare non mostra «✋ Secondo te va qui»");
              var m2 = await misure(P, "Paky"); if (m2) no("rubando: " + m2); misurato.ruba = true;
            });
            if (!e && !await W.aspetta(function () { return /Secondo te va «/.test(T(P)); }, 4000)) no("dopo il furto Paky non legge «Secondo te va «…»»");
          } else e = await passaTasti(P);
          if (e) no("Paky (turno " + piano.nome + " " + piano.giro + "): " + e);
        }
        piano.dec = dec;
        await W.dorme(300);
        continue;
      }
      if (v.fase === "esito" && piano && piano.n === v.n) {
        turni++;
        var es = v.esito || {}, molt = es.doppio ? 2 : 1;
        if (es.anno !== piano.Y) no("l'esito dice l'anno " + es.anno + " invece di " + piano.Y);
        if (!!es.giusto !== !!piano.giusto) no("turno " + turni + ": giusto = " + es.giusto + ", atteso " + piano.giusto);
        if (Math.abs(es.delta) !== 100 * molt) no("turno " + turni + ": delta " + es.delta + " con doppio " + es.doppio);
        if (!es.giusto) {
          var errA = errAtteso(piano.linea, piano.gap, piano.Y);
          if (es.errore !== errA) no("sbagliato di " + es.errore + " anni, atteso " + errA);
          if (!es.prima && !es.dopo) no("manca «dove andava»");
        }
        if (piano.anno != null && es.giusto) {
          var bAtt = (piano.anno === piano.Y ? 100 : Math.abs(piano.anno - piano.Y) <= 2 ? 30 : 0) * molt;
          if (es.bonusAnno !== bAtt) no("bonus dell'anno " + es.bonusAnno + " invece di " + bAtt);
        }
        // ✋ i furti: +100 a chi indovina il posto quando chi gioca sbaglia (anche in tanti), −50 agli altri; chi passa 0
        var dec2 = piano.dec || {}, att = {}, passano = [], ladri = [];
        ORD.forEach(function (n) {
          if (!(n in dec2)) return;
          var d = dec2[n];
          if (typeof d !== "number" || d < 0) { passano.push(ID[n]); conta.passo++; return; }
          var presa = !piano.giusto && giustoIn(piano.linea, d, piano.Y);
          att[ID[n]] = (presa ? 100 : -50) * molt;
          if (presa) { ladri.push(n); conta.prese++; } else conta.perse++;
        });
        if (ladri.length > 1) conta.insieme++;
        (es.voti || []).forEach(function (x) {
          if (att[x.id] == null) no("turno " + turni + ": nell'esito c'è un furto di " + x.id + " che non ha rubato");
          else if (x.delta !== att[x.id]) no("turno " + turni + ": il furto di " + x.id + " vale " + x.delta + " invece di " + att[x.id]);
          delete att[x.id];
        });
        Object.keys(att).forEach(function (id) { no("turno " + turni + ": manca il furto di " + id); });
        passano.forEach(function (id) { if ((es.passo || []).indexOf(id) < 0) no("turno " + turni + ": " + id + " ha passato ma l'esito non lo dice"); });
        var ladroAtt = ladri.length ? (ladri.length === 1 ? ladri[0] : ladri.slice(0, -1).join(", ") + " e " + ladri[ladri.length - 1]) : null;
        if ((es.ladro || null) !== ladroAtt) no("turno " + turni + ": la carta la ruba «" + es.ladro + "» invece di «" + ladroAtt + "»");
        var dentro = v.linea.some(function (x) { return x.titolo === es.titolo; });
        if ((es.giusto || ladri.length) && !dentro) no("turno " + turni + ": la carta " + (ladri.length ? "rubata" : "giusta") + " non è entrata nella linea");
        if (!es.giusto && !ladri.length && dentro) no("turno " + turni + ": la carta sbagliata e non rubata è entrata nella linea");
        contaEsito(punti, v);
        visti[turni] = (es.giusto ? "✅" : "❌") + (es.ladro ? "✋" + es.ladro : "") + ((es.voti || []).some(function (x) { return !x.giusto; }) ? "✋❌" : "") + (es.bonusAnno ? "📅+" + es.bonusAnno : "") + (es.doppio ? "🔥" : "");
        // sul telefono di Giulia
        if (ladri.length) { if (!await W.aspetta(function () { return /Rubata da/.test(T(G)); }, 9000)) no("Giulia non legge «Rubata da»"); }
        else if (!es.giusto) {
          var re = es.errore <= 3 ? /Per un pelo/ : /Sbagliato di/;
          if (!await W.aspetta(function () { return re.test(T(G)) && /Andava qui/i.test(T(G)) && T(G).indexOf(annoTx(piano.Y)) >= 0; }, 9000)) no("Giulia non vede l'anno vero, «" + re.source + "» e «Andava qui» («" + T(G).slice(0, 200) + "»)");
          if (!misurato.esito) { var m3 = await misure(G, "Giulia"); if (m3) no("sul risultato sbagliato: " + m3); misurato.esito = true; }
        }
        if ((es.voti || []).some(function (x) { return !x.giusto; }) && !await W.aspetta(function () { return /Volevano rubarla|Posto sbagliato/.test(T(G)); }, 9000)) no("Giulia non legge chi ha provato a rubarla senza riuscirci");
        piano = null;
        await W.aspetta(function () { return W.clicca(P, /Avanti/, ".st-barra button"); }, 25000);
        continue;
      }
      await W.dorme(200);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ") · " + JSON.stringify(visti));
    if (turni !== 9) no("i turni sono " + turni);
    if (!conta.prese || !conta.insieme || !conta.perse) no("non sono successi tutti i furti: " + JSON.stringify(conta));
    confrontaClassifica(C, punti);
    senzaErrori();
    return "9 turni " + Object.keys(visti).map(function (k) { return visti[k]; }).join(" ") + "; furti " + JSON.stringify(conta) +
      "; classifica " + (vm(C).classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ") + "; misure ok";
  } });

  // =================== tp2: tutti insieme da 5, ricordi, anno al più vicino ===================
  COPIONE.aggiungi("tp2", { nome: "Linea del tempo nella Sala in 5: si parte ⚡ tutti insieme, 📸 I nostri ricordi, 🎯 il più vicino, Avanti di tutti", fai: async function () {
    var amici = ["Giulia", "Luca", "Marco", "Bea"];
    var Z = await sala("La linea del tempo", amici);
    RIC = { "Il viaggio a Ibiza dei cugini": 2019, "La prima asta del fanta di Marco": 2021, "Luca rompe la Panda": 2016 };
    W.BR.nube["finto-Giulia"] = { liste: { "timeline-ricordi": ["2019|Il viaggio a Ibiza dei cugini", "2021|La prima asta del fanta di Marco"] } };
    var C = await A.lanciaDallaSala("Paky", Z.S, "La linea del tempo"), P = W.finestra("Paky"), L = W.finestra("Luca"), B = W.finestra("Bea");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 5; }, 12000)) no("nella saletta non arrivano in 5");
    if (!vm(C).insieme) no("in 5 la saletta non dice «insieme»");
    if (vm(C).carte !== 10) no("in 5 le carte sono " + vm(C).carte + " invece di 10");
    if (!await W.aspetta(function () { return vm(C).nRic === 2; }, 6000)) no("l'host non ha i 2 ricordi di Giulia (nRic " + vm(C).nRic + ")");
    if (JSON.stringify(vm(C)).indexOf("Ibiza") >= 0) no("nella foto della saletta c'è il testo di un ricordo");
    // Luca scrive un ricordo dal foglio della saletta
    if (!await W.aspetta(function () { return W.clicca(L, /I nostri ricordi/, ".tl-ric-btn"); }, 6000)) no("Luca non trova «📸 I nostri ricordi» in saletta («" + T(L).slice(0, 200) + "»)");
    await W.dorme(300);
    var f = L.document.querySelector(".tl-ric-velo"); if (!f) no("il foglio dei ricordi non si apre");
    var mR = await misura(L, "Luca", 360, 640); rimetti(L, "Luca"); if (mR) no("col foglio dei ricordi: " + mR);
    var ti = f.querySelector(".tl-ric-form .t"), an = f.querySelector(".tl-ric-form .a");
    ti.value = "Luca rompe la Panda"; an.value = "1890";
    W.clicca(L, /➕/, ".tl-ric-form button"); await W.dorme(150);
    if (!/Scrivi l'anno/.test(T(L))) no("con l'anno 1890 il foglio non dice «Scrivi l'anno»");
    an.value = "2016"; W.clicca(L, /➕/, ".tl-ric-form button"); await W.dorme(200);
    if (!/Aggiunto/.test(T(L))) no("il ricordo di Luca non si aggiunge («" + T(L).slice(-200) + "»)");
    W.clicca(L, /Fatto/, ".tl-ric-velo button"); await W.dorme(300);
    if (!await W.aspetta(function () { return vm(C).nRic === 3 && (vm(C).ricDa || []).indexOf("Luca") >= 0; }, 6000)) no("l'host non ha il ricordo di Luca (nRic " + vm(C).nRic + ", da " + JSON.stringify(vm(C).ricDa) + ")");
    if (!await W.aspetta(function () { return /I nostri ricordi: 3/.test(T(B)); }, 5000)) no("Bea non legge «📸 I nostri ricordi: 3» in saletta");
    if (!await W.aspetta(function () { return /da 5 in su ⚡ tutti insieme/.test(A.regoleDi(B)); }, 6000)) no("Bea legge «" + A.regoleDi(B) + "»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "tutti"; }, 40000)) no("la prima carta non arriva");
    if (vm(C).carte !== 10 || !vm(C).insieme) no("la partita non è «insieme» con 10 carte");
    var punti = {}, n0 = -1, carte = 0, noi = [], tempi = [], note = [], misurato = false;
    var fino = Date.now() + 420000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "tutti" && v.n !== n0) {
        n0 = v.n; carte++;
        var Y = annoDi(P, v.carta.titolo); if (Y == null) no("non trovo l'anno di «" + v.carta.titolo + "»");
        var ok = gapOk(v.linea, Y), ko = gapKo(v.linea, Y), au = v.carta.autore || null;
        if (v.carta.cat === "noi") {
          noi.push(v.carta.titolo);
          var nAu = nomeDi(C, au);
          if (!nAu) no("il ricordo «" + v.carta.titolo + "» non ha l'autore");
          if (!await W.aspetta(function () { return /È un tuo ricordo/.test(T(W.finestra(nAu))); }, 9000)) no(nAu + " non legge «È un tuo ricordo»");
          if (!await W.aspetta(function () { return /Un ricordo di/.test(T(W.finestra(amici.filter(function (x) { return x !== nAu; })[0]))); }, 6000)) no("sulla carta non c'è «📸 Un ricordo di…»");
        }
        // Giulia giusta con l'anno esatto, Luca giusta con l'anno +1, Marco giusta senza anno, Bea sbagliata; Paky dal telefono, giusta
        var mosse = { Giulia: { gap: ok, anno: Y }, Luca: { gap: ok, anno: Y + 1 }, Marco: { gap: ok }, Bea: { gap: ko >= 0 ? ko : ok } };
        await W.aspetta(function () { return B.document.querySelector(".tl-slot"); }, 8000);
        if (!misurato && !au) {
          B.document.querySelectorAll(".tl-slot")[0].click(); await W.dorme(150);
          var mB = await misure(B, "Bea"); if (mB) no("Bea mentre piazza: " + mB);
          misurato = true;
        }
        amici.forEach(function (n) { var m = mosse[n]; if (idDi(C, n) === au) return; manda(n, C, { t: "posa", gap: m.gap, anno: m.anno != null ? m.anno : null }); });
        await W.dorme(500);
        if (au && (vm(C).hannoScelto || []).indexOf(au) >= 0) no("l'autore del ricordo ha potuto piazzarlo");
        if (au !== "host") {
          if (!await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === v.linea.length + 1; }, 6000)) no("Paky non vede i posti");
          P.document.querySelectorAll(".tl-slot")[ok].click(); await W.dorme(120);
          W.clicca(P, /Mettila qui/, ".tl-conferma");
        }
        if (!await W.aspetta(function () { return vm(C).fase === "tEsito"; }, 8000)) no("hanno scelto tutti ma non si scopre (carta " + carte + ")");
        var e = vm(C).esitoT || {}, molt = e.doppio ? 2 : 1;
        // il bonus dell'anno: solo al più vicino (Giulia esatta; se il ricordo è suo, Luca a 1 anno)
        var atteso = {};
        amici.concat(["Paky"]).forEach(function (n) {
          var id = idDi(C, n); if (id === au) { atteso[id] = 0; return; }
          var m = n === "Paky" ? { gap: ok } : mosse[n], giusto = m.gap === ok || (m.gap !== ok && errAtteso(v.linea, m.gap, Y) === 0);
          atteso[id] = giusto ? 100 * molt : 0;
        });
        var vel = (e.risultati || []).filter(function (r) { return r.veloce; })[0];
        if (vel) atteso[vel.id] += 50 * molt;
        var gId = idDi(C, "Giulia"), lId = idDi(C, "Luca");
        if (au !== gId) atteso[gId] += 100 * molt; else atteso[lId] += 30 * molt;
        (e.risultati || []).forEach(function (r) {
          if (r.delta !== atteso[r.id]) no("carta " + carte + ": " + nomeDi(C, r.id) + " prende " + r.delta + " invece di " + atteso[r.id] + " (" + JSON.stringify(e.risultati) + ")");
          if (r.id === au && !r.suo) no("il risultato non dice che il ricordo è dell'autore");
          punti[r.id] = (punti[r.id] || 0) + r.delta;
        });
        if (!await W.aspetta(function () { return /Il più vicino/.test(T(B)); }, 9000)) no("Bea non legge «🎯 Il più vicino»");
        // «⏩ Avanti»: 4 su 5 non bastano, con tutti e 5 si parte subito; alla carta 4 nessuno tocca niente (il tempo)
        if (carte === 4) {
          var t0 = Date.now();
          if (!await W.aspetta(function () { return vm(C).n !== n0 || vm(C).fase === "fine"; }, 20000)) no("senza tocchi il risultato non finisce");
          tempi.push(Math.round((Date.now() - t0) / 100) / 10);
          continue;
        }
        if (vm(C).fase === "tEsito") {
          amici.forEach(function (n) { manda(n, C, { t: "avanti" }); });
          await W.dorme(1200);
          if (vm(C).n !== n0) no("con 4 su 5 si è già andati avanti");
          if (!await W.aspetta(function () { return W.clicca(P, /Avanti/, ".st-barra button"); }, 12000)) no("Paky non trova «⏩ Avanti»");
          var t1 = Date.now();
          if (!await W.aspetta(function () { return vm(C).n !== n0 || vm(C).fase === "fine"; }, 3000)) no("con tutti e 5 non si va avanti");
          if (Date.now() - t1 > 1500) note.push("avanti lento " + (Date.now() - t1) + " ms");
        }
      }
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ", carta " + carte + ")");
    if (carte !== 10) no("le carte giocate sono " + carte);
    if (noi.length !== 3) no("i ricordi usciti sono " + noi.length + " (" + noi.join(", ") + ")");
    if (tempi[0] < 12 || tempi[0] > 18) no("senza tocchi il risultato dura " + tempi[0] + " s");
    confrontaClassifica(C, punti);
    senzaErrori();
    return "10 carte tutti insieme, ricordi usciti: " + noi.join(" | ") + "; risultato senza tocchi " + tempi[0] + " s; " + note.join(", ") +
      "; classifica " + (vm(C).classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ");
  } });

  // =================== tp3: sullo stesso telefono ===================
  async function localeTl(P, nomi, conRicordo, opz) {
    opz = opz || {};
    var tess = await W.aspetta(function () { return A.tessera(P, "La linea del tempo"); }, 6000); if (!tess) no("non trovo la tessera");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    if (await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) {
      while (P.document.querySelectorAll(".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
      while (P.document.querySelectorAll(".sala-riga input").length > nomi.length) { var x = P.document.querySelector(".sala-riga .togli, .sala-riga button"); if (!x) break; x.click(); await W.dorme(80); }
      [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k]; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    }
    for (var k = 0; k < 6; k++) {
      if (P.document.querySelector(".stepper")) {
        var meno = P.document.querySelector(".stepper button"); meno.click(); meno.click();
        if (/Come votano/i.test(T(P)) || !/Rubare la carta/i.test(T(P))) no("nelle impostazioni non c'è «✋ Rubare la carta»");
        if (opz.uno) { var cu = [].find.call(P.document.querySelectorAll(".modo-chip"), function (x) { return /Uno alla volta/.test(x.textContent); }); if (!cu) no("non trovo «Uno alla volta»"); else cu.click(); }
        if (conRicordo) {
          if (!W.clicca(P, /I nostri ricordi/, ".tl-ric-btn")) no("nelle impostazioni non c'è «📸 I nostri ricordi»");
          await W.dorme(250);
          var f = P.document.querySelector(".tl-ric-velo"); if (!f) no("il foglio dei ricordi non si apre");
          f.querySelector(".tl-ric-form .t").value = "Il matrimonio di Ciro"; f.querySelector(".tl-ric-form .a").value = "2018";
          W.clicca(P, /➕/, ".tl-ric-form button"); await W.dorme(150);
          W.clicca(P, /Fatto/, ".tl-ric-velo button"); await W.dorme(200);
          if (!/1 tuo/.test(T(P))) no("dopo il ricordo il tasto non dice «1 tuo»");
        }
        if (opz.prima) await opz.prima();   // (le altre scelte delle impostazioni, prima di cominciare)
        var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Comincia|Gioca|Inizia|▶/.test(x.textContent) && !x.disabled; });
        if (!b) no("non trovo il tasto per cominciare"); b.click(); await W.dorme(400); return;
      }
      var b2 = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Pronti|▶/.test(x.textContent) && !x.disabled; });
      if (!b2) break; b2.click(); await W.dorme(400);
    }
  }
  async function partitaLocale(P, titoli) {
    var fino = Date.now() + 260000, turni = 0, sbagliate = 0, kOld = "", fatti = {};
    while (Date.now() < fino) {
      if (/Classifica finale/.test(T(P))) return turni;
      if (W.clicca(P, /tocca a me/)) { await W.dorme(300); continue; }
      var slots = P.document.querySelectorAll(".tl-slot"), mano = P.document.querySelector(".st-sch-in .tl-mano .tit");
      if (slots.length && mano && P.document.querySelector(".tl-conferma") && kOld !== mano.textContent + "|" + slots.length) {
        var tit = mano.textContent; kOld = tit + "|" + slots.length; titoli.push(tit);
        var Y = annoDi(P, tit); if (Y == null) no("non trovo l'anno di «" + tit + "»");
        var linea = [].map.call(P.document.querySelectorAll(".st-sch-in .tl-asse > .tl-ev .anno"), function (a) { return a.textContent; });
        var labs = [].map.call(P.document.querySelectorAll(".tl-slot .lab"), function (l) { return l.textContent; });
        if (!/^Prima del /.test(labs[0]) || !/^Dopo il /.test(labs[labs.length - 1])) no("i posti dicono " + JSON.stringify(labs) + " (linea " + linea.join(",") + ")");
        // una giusta e una sbagliata (si sa dall'ordine degli anni scritti sulla linea)
        var anni = [].map.call(P.document.querySelectorAll(".st-sch-in .tl-asse > .tl-ev .anno"), function (a) { var t = a.textContent; return /a\.C\./.test(t) ? -parseInt(t, 10) : parseInt(t, 10); });
        var lin = anni.map(function (a) { return { anno: a }; }), ok = gapOk(lin, Y), ko = gapKo(lin, Y), sbaglia = turni % 2 === 1 && ko >= 0;
        slots[sbaglia ? ko : ok].click(); await W.dorme(150);
        if (!sbaglia) { if (!scriviAnno(P, Y)) no("sullo stesso telefono non c'è il selettore dell'anno"); await W.dorme(100); }
        if (!W.clicca(P, /Mettila qui/, ".tl-conferma")) no("non riesco a confermare");
        turni++;
        // ✋ si ruba tutti insieme: l'avatar dell'altro e poi il posto. La prima sbagliata la ruba giusta, la seconda giusta la ruba male
        var tent = sbaglia ? ko : ok, rubo = null;
        if (await W.aspetta(function () { return P.document.querySelector(".tl-gv"); }, 3000)) {
          if (sbaglia && !fatti.presa) { rubo = postoGiusto(lin, Y, tent); fatti.presa = true; }
          else if (!sbaglia && turni >= 3 && !fatti.persa) { rubo = postoSbagliato(lin, Y, tent); if (rubo < 0) rubo = null; else fatti.persa = true; }
          if (rubo != null) {
            var sl2 = P.document.querySelectorAll(".st-sch-in .tl-slot"), dov = sl2[rubo < tent ? rubo : rubo - 1];
            if (sl2.length !== lin.length) no("rubando si vedono " + sl2.length + " posti invece di " + lin.length);
            dov.click(); await W.dorme(120);
            if (!/Prima tocca il tuo avatar/.test(T(P))) no("toccato il posto senza avatar non c'è l'avviso");
            P.document.querySelector(".tl-gv").click(); await W.dorme(120);
            if (!P.document.querySelector(".tl-gv.attivo")) no("l'avatar toccato non si accende");
            dov.click(); await W.dorme(120);
            if (!/✋ (Giulia|Paky)/.test(dov.querySelector(".lab").textContent)) no("il posto non dice chi ruba («" + dov.querySelector(".lab").textContent + "»)");
            if (!P.document.querySelector(".tl-gv.ruba")) no("l'avatar di chi ruba non diventa rosso");
            if (!fatti.misRuba) { fatti.misRuba = true; var mr = await misure(P, "Paky"); if (mr) no("rubando tutti insieme: " + mr); }
            if (!W.clicca(P, /Fatto: 1 la ruba/)) no("non trovo «✅ Fatto: 1 la ruba»");
          } else if (!W.clicca(P, /Nessuno la ruba/)) no("non trovo «Nessuno la ruba: avanti»");
        }
        if (sbaglia && rubo != null) {
          if (!await W.aspetta(function () { return /Rubata da/.test(T(P)) && T(P).indexOf(annoTx(Y)) >= 0; }, 12000)) no("rubata: non vedo «Rubata da» e l'anno («" + T(P).slice(0, 200) + "»)");
        } else if (sbaglia) {
          sbagliate++;
          if (!await W.aspetta(function () { return /Sbagliato di|Per un pelo/.test(T(P)) && /Andava qui/i.test(T(P)) && T(P).indexOf(annoTx(Y)) >= 0; }, 10000)) no("sbagliata: non vedo l'anno vero e «Andava qui» («" + T(P).slice(0, 200) + "»)");
          if (sbagliate === 1) { var m = await misure(P, "Paky"); if (m) no("sul risultato sbagliato: " + m); }
        } else {
          if (!await W.aspetta(function () { return /Esatto!/.test(T(P)) && /🎯/.test(T(P)); }, 10000)) no("giusta con l'anno esatto: non vedo «🎯 Esatto!» («" + T(P).slice(0, 200) + "»)");
          if (rubo != null && !/Volevano rubarla/.test(T(P))) no("il furto sbagliato non si legge («Volevano rubarla»)");
        }
        continue;
      }
      await W.dorme(250);
    }
    no("la partita sullo stesso telefono non finisce («" + T(P).slice(0, 160) + "»)");
  }
  COPIONE.aggiungi("tp3", { nome: "Linea del tempo sullo stesso telefono: ricordi, posti con gli anni, anno, carta girata; poi niente carte ripetute", fai: async function () {
    RIC = { "Il matrimonio di Ciro": 2018 };
    var P = await W.apriTel("Paky", { x: 0 });
    await localeTl(P, ["Paky", "Giulia"], true);
    var t1 = [], t2 = [];
    var n1 = await partitaLocale(P, t1);
    if (n1 !== 6) no("la prima partita ha " + n1 + " turni");
    if (t1.indexOf("Il matrimonio di Ciro") < 0) no("il ricordo non è uscito nella prima partita (" + t1.join(" | ") + ")");
    var viste = JSON.parse(P.localStorage.getItem("sg-tl-viste") || "{}");
    if (Object.keys(viste).length < 7) no("le carte viste ricordate sono " + Object.keys(viste).length);
    if (!await W.aspetta(function () { return W.clicca(P, /Rigioca/); }, 5000)) no("non trovo «Rigioca»");
    var n2 = await partitaLocale(P, t2);
    var doppie = t2.filter(function (x) { return x !== "Il matrimonio di Ciro" && t1.indexOf(x) >= 0; });
    if (doppie.length) no("nella seconda partita tornano carte della prima: " + doppie.join(" | "));
    senzaErrori();
    return "2 partite da " + n1 + " e " + n2 + " turni, nessuna carta ripetuta (" + Object.keys(viste).length + " carte ricordate dopo la prima), ricordo uscito, misure ok";
  } });

  // =================== tp4: rientri, ripresa, chi guarda, tempo scaduto ===================
  COPIONE.aggiungi("tp4", { nome: "Linea del tempo a turno con ✋ Rubala: chi ruba ricarica, l'host ricarica nel furto, chi guarda, tempo scaduto", fai: async function () {
    // (la stanza di un gioco solo, col link: in questo ramo la Sala riporta tutti nella Sala quando l'host ricarica)
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
    await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    await regola(P, async function (f) { var meno = f.querySelector(".stepper button"); meno.click(); meno.click(); });
    if (!await W.aspetta(function () { return vm(C).carte === 3; }, 5000)) no("le regole (3 carte) non arrivano");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var fatto = { ricaricaG: false, ricaricaH: false, guarda: false, scaduto: false }, kV = "", note = [], fino = Date.now() + 420000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n;
      if (k === kV) { await W.dorme(250); continue; }
      kV = k; P = W.finestra("Paky");
      if (v.fase === "turno") {
        var Y = annoDi(P, v.carta.titolo), ok = gapOk(v.linea, Y), ko = gapKo(v.linea, Y), nm = nomeDi(C, v.turnoId);
        if (nm === "Luca" && !fatto.scaduto) {
          // Luca non sceglie: tempo scaduto, la carta si gira lo stesso
          fatto.scaduto = true;
          if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 45000)) no("allo scadere del tempo non arriva il risultato");
          var es0 = vm(C).esito;
          if (!es0.scaduto || es0.anno !== Y) no("tempo scaduto: esito " + JSON.stringify(es0).slice(0, 120));
          if (!await W.aspetta(function () { return /Tempo scaduto/.test(T(W.finestra("Giulia"))) && T(W.finestra("Giulia")).indexOf(annoTx(Y)) >= 0; }, 9000)) no("tempo scaduto: Giulia non vede l'anno");
          note.push("tempo scaduto ok");
          continue;
        }
        if (v.turnoId === "host") {
          if (!await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === v.linea.length + 1; }, 12000)) no("Paky non vede i posti");
          P.document.querySelectorAll(".tl-slot")[ko >= 0 ? ko : ok].click(); await W.dorme(150); W.clicca(P, /Mettila qui/, ".tl-conferma");
        } else manda(nm, C, { t: "scelta", gap: ko >= 0 ? ko : ok });
        continue;
      }
      if (v.fase === "votazione") {
        var tur = nomeDi(C, v.turnoId), Yv = annoDi(P, v.carta.titolo);
        if (tur !== "Giulia" && !fatto.ricaricaG) {
          // Giulia ruba (un posto qualsiasi, non quello di chi gioca) e ricarica la pagina: ritrova la decisione presa
          manda("Giulia", C, { t: "ruba", gap: v.scelta === 0 ? 1 : 0 });
          await W.dorme(500);
          if ((vm(C).hannoVotato || []).indexOf(idDi(C, "Giulia")) < 0) no("la foto non dice che Giulia ha deciso");
          var G = await W.ricarica("Giulia");
          if (!await W.aspetta(function () { return /Hai deciso|Aspetta gli altri/.test(T(W.finestra("Giulia"))); }, 15000)) no("Giulia dopo la ricarica non ritrova la decisione («" + T(W.finestra("Giulia")).slice(0, 160) + "»)");
          if (bottone(W.finestra("Giulia"), /👍 Passo|Rubala/, true)) no("dopo la ricarica Giulia può rubare di nuovo");
          fatto.ricaricaG = true; note.push("Giulia ricarica dopo il furto: decisione ritrovata");
          void G;
        }
        if (fatto.ricaricaG && !fatto.ricaricaH && tur === "Giulia") {
          // l'host ricarica durante il furto, dopo che Luca ha rubato: la stessa carta si rigioca, furti azzerati
          var tit = v.carta.titolo, pgL = postoGiusto(v.linea, Yv, v.scelta);
          manda("Luca", C, { t: "ruba", gap: pgL >= 0 ? pgL : (v.scelta === 0 ? 1 : 0) });
          await W.dorme(400);
          P = await W.ricarica("Paky");
          if (!await W.aspetta(function () { return vm(C).fase === "ripresa"; }, 15000)) no("dopo la ricarica dell'host niente «Partita ripresa»");
          if (!await W.aspetta(function () { return vm(C).fase === "turno"; }, 15000)) no("dopo la ripresa il turno non riparte");
          if (vm(C).carta.titolo !== tit) no("dopo la ripresa la carta è un'altra");
          if ((vm(C).hannoVotato || []).length) no("dopo la ripresa i furti non sono azzerati");
          fatto.ricaricaH = true; note.push("host ricarica nel furto: stessa carta, furti azzerati");
          kV = ""; continue;
        }
        if (fatto.ricaricaH && !fatto.guarda) {
          // un amico arriva a partita cominciata: guarda (niente tasti per rubare)
          var N = await W.apriTel("Nino", { hash: "gioco=timeline&stanza=" + C, x: 555 });
          if (!await W.aspetta(function () { return /Stai guardando/.test(T(W.finestra("Nino"))); }, 15000)) no("Nino non legge «Stai guardando» («" + T(W.finestra("Nino")).slice(0, 160) + "»)");
          if (W.finestra("Nino").document.querySelector(".tl-vota") || bottone(W.finestra("Nino"), /👍 Passo|Rubala/, true)) no("Nino che guarda ha i tasti per rubare");
          fatto.guarda = true; note.push("Nino guarda"); void N;
        }
        ["Giulia", "Luca"].forEach(function (n) { if (n !== tur) manda(n, C, { t: "ruba", gap: null }); });
        if (tur !== "Paky") await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /👍 Passo/); }, 12000);
        continue;
      }
      if (v.fase === "esito") { await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Avanti/, ".st-barra button"); }, 25000); continue; }
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ") · " + note.join(" · "));
    Object.keys(fatto).forEach(function (x) { if (!fatto[x]) no("non è successo: " + x + " · " + note.join(" · ")); });
    senzaErrori();
    return note.join("; ") + "; classifica " + (vm(C).classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ");
  } });

  // =================== tp5: sullo stesso telefono in 3, ✋ uno alla volta ===================
  COPIONE.aggiungi("tp5", { nome: "Linea del tempo sullo stesso telefono in 3, ✋ uno alla volta: si passa il telefono, si ruba in segreto, in due sullo stesso posto", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), NOMI = ["Paky", "Giulia", "Luca"];
    await localeTl(P, NOMI, false, { uno: true });
    var punti = { Paky: 0, Giulia: 0, Luca: 0 }, cur = null, turni = 0, fino = Date.now() + 420000;
    var conta = { insieme: 0, presa: 0, persa: 0, passo: 0, segreto: 0 };
    function stato() { var s = P.document.querySelector(".st-sch-in .tl-stato"); return s ? s.textContent : ""; }
    while (Date.now() < fino) {
      if (/Classifica finale/.test(T(P))) break;
      if (W.clicca(P, /📱 Sono /)) { await W.dorme(300); continue; }
      // 1) chi gioca mette la carta (una sbagliata e una giusta, a turno)
      var conf = P.document.querySelector(".st-barra .tl-conferma"), slots = P.document.querySelectorAll(".st-sch-in .tl-slot"), mano = P.document.querySelector(".st-sch-in .tl-mano .tit");
      var mT = /Tocca a te, (\S+)!/.exec(stato());
      if (conf && slots.length && mano && mT && (!cur || cur.tit !== mano.textContent)) {
        var tit = mano.textContent, Y = annoDi(P, tit);
        if (Y == null) no("non trovo l'anno di «" + tit + "»");
        var anni = [].map.call(P.document.querySelectorAll(".st-sch-in .tl-asse > .tl-ev .anno"), function (a) { var t = a.textContent; return /a\.C\./.test(t) ? -parseInt(t, 10) : parseInt(t, 10); });
        var lin = anni.map(function (a) { return { anno: a }; }), ok = gapOk(lin, Y), ko = gapKo(lin, Y), sb = turni % 2 === 0 && ko >= 0;
        cur = { tit: tit, Y: Y, lin: lin, gap: sb ? ko : ok, giusto: !sb, chi: mT[1], dec: {}, doppio: /vale doppio/.test(stato()) };
        slots[cur.gap].click(); await W.dorme(120);
        if (!W.clicca(P, /Mettila qui/, ".tl-conferma")) no("non riesco a confermare");
        punti[cur.chi] += (cur.giusto ? 100 : -100) * (cur.doppio ? 2 : 1);
        turni++; await W.dorme(300); continue;
      }
      // 2) chi ruba, in segreto: «Giulia, la rubi?»
      var mR = /(\S+), la rubi\?/.exec(stato());
      if (mR && cur && !(mR[1] in cur.dec) && bottone(P, /👍 Passo/)) {
        var chiR = mR[1], labs = [].map.call(P.document.querySelectorAll(".st-sch-in .tl-slot .lab"), function (l) { return l.textContent; }).join(" ");
        if (P.document.querySelector(".st-sch-in .tl-slot.ha") || /✋ (Paky|Giulia|Luca)/.test(labs)) no("chi ruba dopo vede i furti di prima (" + labs + ")");
        if (Object.keys(cur.dec).length) conta.segreto++;
        var pg = postoGiusto(cur.lin, cur.Y, cur.gap), ps = postoSbagliato(cur.lin, cur.Y, cur.gap), nDec = Object.keys(cur.dec).length, d = -1;
        // carta sbagliata: la prima volta la rubano tutti e due sullo stesso posto, poi uno solo; carta giusta: uno ruba male (una volta)
        if (!cur.giusto) d = (conta.insieme === 0 || nDec === 0) ? pg : -1;
        else if (nDec === 0 && ps >= 0 && !conta.persa) d = ps;
        var e = d >= 0 ? await rubaTasti(P, cur.lin, d, cur.gap, cur.chi) : await passaTasti(P);
        if (e) no(chiR + ": " + e);
        cur.dec[chiR] = d;
        var molt = cur.doppio ? 2 : 1;
        if (d >= 0) { var presa = !cur.giusto && giustoIn(cur.lin, d, cur.Y); punti[chiR] += (presa ? 100 : -50) * molt; if (presa) conta.presa++; else conta.persa++; }
        else conta.passo++;
        // decidono tutti e due: «✋ In 2 vogliono rubarla!» e «Rubata da Giulia e Luca»
        if (Object.keys(cur.dec).length === 2) {
          var rub = Object.keys(cur.dec).filter(function (n) { return cur.dec[n] >= 0; }), ladri = rub.filter(function (n) { return !cur.giusto && giustoIn(cur.lin, cur.dec[n], cur.Y); });
          if (rub.length === 2 && !await W.aspetta(function () { return /In 2 vogliono rubarla/.test(T(P)); }, 6000)) no("non si legge «✋ In 2 vogliono rubarla!»");
          if (rub.length === 1 && !await W.aspetta(function () { return /Qualcuno vuole rubarla/.test(T(P)); }, 6000)) no("non si legge «✋ Qualcuno vuole rubarla!»");
          if (ladri.length === 2) { if (!await W.aspetta(function () { return /Rubata da \S+ e \S+/.test(T(P)); }, 12000)) no("non si legge «Rubata da … e …» («" + T(P).slice(0, 160) + "»)"); else conta.insieme++; }
          else if (ladri.length === 1 && !await W.aspetta(function () { return /Rubata da/.test(T(P)); }, 12000)) no("non si legge «Rubata da»");
        }
        await W.dorme(300); continue;
      }
      await W.dorme(250);
    }
    if (!/Classifica finale/.test(T(P))) no("la partita non finisce («" + T(P).slice(0, 160) + "»)");
    if (turni !== 9) no("i turni sono " + turni);
    if (!conta.insieme || !conta.presa || !conta.persa || !conta.segreto) no("non è successo tutto: " + JSON.stringify(conta));
    // la classifica finale (sul podio) = il conto a parte
    var fine = {};
    [].forEach.call(P.document.querySelectorAll(".tl-gradino, .tl-riga"), function (r) {
      var nm = r.querySelector(".nm"), pt = r.querySelector(".pt"); if (!nm || !pt) return;
      fine[nm.textContent] = parseInt(pt.textContent.replace(/\./g, "").replace("−", "-"), 10);
    });
    NOMI.forEach(function (n) { if (fine[n] !== punti[n]) no(n + " ha " + fine[n] + " punti invece di " + punti[n] + " (" + JSON.stringify(fine) + ")"); });
    senzaErrori();
    return "9 turni, furti " + JSON.stringify(conta) + "; classifica " + JSON.stringify(fine);
  } });

  // =================== tp6, tp7: «📆 Epoca» (26 ott 2026) ===================
  // la posizione di un anno sulla linea da muovere (la stessa scala del gioco: 0-12% prima di Cristo, 12-27% fino al 1500,
  // 27-45% fino al 1900, il resto dal 1900 a oggi)
  function posAnno(y) {
    var ora = new Date().getFullYear(), S = [[-3500, 0, 0, 0.12], [0, 1500, 0.12, 0.27], [1500, 1900, 0.27, 0.45], [1900, ora, 0.45, 1]];
    for (var i = 0; i < S.length; i++) { var s = S[i]; if (y <= s[1] || i === S.length - 1) return s[2] + (y - s[0]) / (s[1] - s[0]) * (s[3] - s[2]); }
  }
  // il dito sulla linea: giù dove sta, poi si sposta fino a «a» e si alza
  async function trascina(w, pista, da, a) {
    var r = pista.getBoundingClientRect();
    function dito(tipo, p) { pista.dispatchEvent(new w.PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: 7, isPrimary: true, clientX: r.left + p * r.width, clientY: r.top + 22 })); }
    dito("pointerdown", da); for (var k = 1; k <= 6; k++) { dito("pointermove", da + (a - da) * k / 6); await W.dorme(20); } dito("pointerup", a);
    await W.dorme(80);
  }
  function valoriEpoca(box) { return [].map.call(box.querySelectorAll(".tl-ep-val"), function (v) { return v.textContent.replace(/[‹›]/g, " ").replace(/\s+/g, " ").trim(); }); }
  function chipEpoca(box, re) { var c = [].find.call(box.querySelectorAll(".tl-ep-chips .modo-chip"), function (x) { return re.test(x.textContent); }); if (!c) no("non trovo la scelta d'epoca " + re); return c; }
  function anniFuori(w, titoli, lo, hi) { return titoli.filter(function (t) { var y = annoDi(w, t); return y == null || y < lo || y > hi; }).map(function (t) { return t + " (" + annoDi(w, t) + ")"; }); }

  COPIONE.aggiungi("tp6", { nome: "Linea del tempo sullo stesso telefono: 📆 Epoca («Dal 1980 a oggi», poi «Scegli tu gli anni» con la linea e ‹ ›, poche carte)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), note = [];
    // 1) «Dal 1980 a oggi»: il conto delle carte cambia con le categorie, la linea degli anni resta nascosta
    await localeTl(P, ["Paky", "Giulia"], false, { prima: async function () {
      var d = P.document, chips = d.querySelectorAll(".tl-ep-chips .modo-chip");
      if (chips.length !== 5) no("le scelte dell'epoca sono " + chips.length);
      var att = d.querySelector(".tl-ep-chips .modo-chip.attiva"); if (!att || !/Tutta la storia/.test(att.textContent)) no("di partenza l'epoca non è «Tutta la storia»");
      var c80 = chipEpoca(d, /Dal 1980/), n80 = function () { return parseInt(c80.querySelector(".ms").textContent.replace(/\./g, ""), 10); }, prima = n80();
      if (!(prima > 900 && prima < 1300)) no("«Dal 1980 a oggi» dice " + prima + " carte");
      var rap = [].find.call(d.querySelectorAll(".cat-chip"), function (x) { return /Rap/.test(x.textContent); });
      rap.click(); await W.dorme(80); var senza = n80(); rap.click(); await W.dorme(80);
      if (!(senza < prima) || n80() !== prima) no("il conto delle carte non segue le categorie (" + prima + " → " + senza + " → " + n80() + ")");
      c80.click(); await W.dorme(80);
      if (!d.querySelector(".tl-ep").hidden) no("la linea degli anni si vede anche senza «Scegli tu»");
      note.push("dal 1980: " + prima + " carte (senza Rap " + senza + ")");
    } });
    var t1 = [], n1 = await partitaLocale(P, t1), f1 = anniFuori(P, t1, 1980, 3000);
    if (f1.length) no("con «Dal 1980 a oggi» escono carte di prima: " + f1.join(" | "));
    note.push(n1 + " turni, carte tutte dal 1980");
    // 2) «Scegli tu gli anni»: la maniglia di destra trascinata al 1800, quella di sinistra al 1500, ‹ › per aggiustare
    if (!await W.aspetta(function () { return W.clicca(P, /Home/); }, 5000)) no("dalla classifica non trovo «Home»");
    await W.dorme(600);
    await localeTl(P, ["Paky", "Giulia"], false, { prima: async function () {
      var d = P.document; chipEpoca(d, /Scegli tu/).click(); await W.dorme(100);
      var ep = d.querySelector(".tl-ep"); if (!ep || ep.hidden) no("«Scegli tu gli anni» non apre la linea");
      if (valoriEpoca(ep).join(" | ") !== "Dal 3500 a.C. | a oggi") no("la linea parte da «" + valoriEpoca(ep).join(" | ") + "»");
      var pista = ep.querySelector(".tl-ep-pista");
      await trascina(P, pista, 1, posAnno(1800));
      await trascina(P, pista, 0, posAnno(1500));
      if (valoriEpoca(ep).join(" | ") !== "Dal 1500 | al 1800") no("dopo il dito la linea dice «" + valoriEpoca(ep).join(" | ") + "»");
      var meno = ep.querySelectorAll(".tl-ep-val .pa")[0], piu = ep.querySelectorAll(".tl-ep-val .pa")[1];
      meno.click(); await W.dorme(50);
      if (!/Dal 1490/.test(valoriEpoca(ep)[0])) no("‹ non va al 1490 («" + valoriEpoca(ep)[0] + "»)");
      piu.click(); await W.dorme(50);
      var nC = parseInt((ep.querySelector(".tl-ep-conta").textContent.match(/[\d.]+/) || ["0"])[0].replace(/\./g, ""), 10);
      if (!(nC >= 30 && nC < 400) || ep.querySelector(".tl-ep-conta.poche")) no("tra il 1500 e il 1800 il conto dice «" + ep.querySelector(".tl-ep-conta").textContent + "»");
      // le maniglie non si scavalcano, e con pochissime carte c'è l'avviso
      await trascina(P, pista, posAnno(1500), posAnno(1950));
      if (valoriEpoca(ep).join(" | ") !== "Dal 1800 | al 1800") no("le maniglie si scavalcano («" + valoriEpoca(ep).join(" | ") + "»)");
      if (!ep.querySelector(".tl-ep-conta.poche") || !/allarga/.test(ep.querySelector(".tl-ep-conta").textContent)) no("con un anno solo non c'è l'avviso «allarga gli anni» («" + ep.querySelector(".tl-ep-conta").textContent + "»)");
      await trascina(P, pista, posAnno(1800) - 0.002, posAnno(1500));
      if (valoriEpoca(ep).join(" | ") !== "Dal 1500 | al 1800") no("rimessa a posto la linea dice «" + valoriEpoca(ep).join(" | ") + "»");
      note.push("dal 1500 al 1800: " + nC + " carte");
    } });
    var t2 = [], n2 = await partitaLocale(P, t2), f2 = anniFuori(P, t2, 1500, 1800);
    if (f2.length) no("con «dal 1500 al 1800» escono carte fuori: " + f2.join(" | "));
    note.push(n2 + " turni, carte tutte tra il 1500 e il 1800");
    senzaErrori();
    return note.join("; ");
  } });

  COPIONE.aggiungi("tp7", { nome: "Linea del tempo online: 📆 Epoca dal ⚙️ della saletta (Scegli tu, poi Il Novecento), la riga delle regole, carte negli anni", fai: async function () {
    var Z = await sala("La linea del tempo", ["Giulia"]);
    var C = await A.lanciaDallaSala("Paky", Z.S, "La linea del tempo"), P = W.finestra("Paky"), G = W.finestra("Giulia"), note = [];
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 10000)) no("nella saletta non arrivano in 2");
    if (/📆/.test(A.regoleDi(G))) no("di partenza la riga delle regole dice già un'epoca («" + A.regoleDi(G) + "»)");
    await regola(P, async function (f) {
      chipEpoca(f, /Scegli tu/).click(); await W.dorme(100);
      var ep = f.querySelector(".tl-ep"); if (!ep || ep.hidden) no("nel ⚙️ «Scegli tu gli anni» non apre la linea");
      await trascina(P, ep.querySelector(".tl-ep-pista"), 1, posAnno(1800));
      await trascina(P, ep.querySelector(".tl-ep-pista"), 0, posAnno(0));
    });
    if (!await W.aspetta(function () { return /📆 dall'anno 0 al 1800/.test(A.regoleDi(G)); }, 5000)) no("Giulia legge «" + A.regoleDi(G) + "» (manca «📆 dall'anno 0 al 1800»)");
    note.push("Giulia legge «" + (A.regoleDi(G).match(/📆[^·]*/) || [""])[0].trim() + "»");
    await regola(P, async function (f) { chipEpoca(f, /Novecento/).click(); var meno = f.querySelector(".stepper button"); meno.click(); meno.click(); });
    if (!await W.aspetta(function () { return /📆 il Novecento/.test(A.regoleDi(G)) && /3 carte a testa/.test(A.regoleDi(G)); }, 5000)) no("Giulia legge «" + A.regoleDi(G) + "»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var titoli = {}, kV = "", fino = Date.now() + 300000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n;
      (v.linea || []).forEach(function (e) { titoli[e.titolo] = e.anno; });
      if (k === kV) { await W.dorme(250); continue; }
      kV = k;
      if (v.fase === "turno") {
        var Y = annoDi(P, v.carta.titolo), ok = gapOk(v.linea, Y); titoli[v.carta.titolo] = Y;
        if (v.turnoId === "host") {
          if (!await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === v.linea.length + 1; }, 12000)) no("Paky non vede i posti");
          P.document.querySelectorAll(".tl-slot")[ok].click(); await W.dorme(150); W.clicca(P, /Mettila qui/, ".tl-conferma");
        } else manda("Giulia", C, { t: "scelta", gap: ok });
        continue;
      }
      if (v.fase === "votazione") { if (v.turnoId === "host") manda("Giulia", C, { t: "ruba", gap: null }); else await W.aspetta(function () { return W.clicca(P, /👍 Passo/); }, 12000); continue; }
      if (v.fase === "esito") { await W.aspetta(function () { return W.clicca(P, /Avanti/, ".st-barra button"); }, 25000); continue; }
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ")");
    var fuori = Object.keys(titoli).filter(function (t) { return titoli[t] < 1900 || titoli[t] > 1999; });
    if (fuori.length) no("con «Il Novecento» escono carte fuori: " + fuori.map(function (t) { return t + " (" + titoli[t] + ")"; }).join(" | "));
    note.push(Object.keys(titoli).length + " carte, tutte del Novecento");
    senzaErrori();
    return note.join("; ");
  } });

  // =================== tp8, tp9: «🔄 Cambia carta» (26 ott 2026) ===================
  COPIONE.aggiungi("tp8", { nome: "Linea del tempo sullo stesso telefono: 🔄 Cambia carta una volta a testa, carta nuova, il tasto sparisce", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), usato = {}, turni = 0, kOld = "", note = [], fino = Date.now() + 300000;
    await localeTl(P, ["Paky", "Giulia"], false);
    function stato() { var s = P.document.querySelector(".st-sch-in .tl-stato"); return s ? s.textContent : ""; }
    while (Date.now() < fino) {
      if (/Classifica finale/.test(T(P))) break;
      if (W.clicca(P, /tocca a me/)) { await W.dorme(300); continue; }
      if (W.clicca(P, /Nessuno la ruba/)) { await W.dorme(300); continue; }
      var mT = /Tocca a te, (\S+)!/.exec(stato()), mano = P.document.querySelector(".st-sch-in .tl-mano .tit"), slots = P.document.querySelectorAll(".st-sch-in .tl-slot");
      if (mT && mano && slots.length && P.document.querySelector(".tl-conferma") && kOld !== mano.textContent) {
        var chi = mT[1], tit = mano.textContent, bc = P.document.querySelector(".st-sch-in .tl-mano .cambia");
        if (!usato[chi]) {
          if (!bc) no(chi + " al primo turno non ha «🔄 Cambia»");
          else {
            var m = await misure(P, "Paky"); if (m) no("col tasto «🔄 Cambia»: " + m);
            bc.click(); usato[chi] = tit;
            if (!await W.aspetta(function () { var t2 = P.document.querySelector(".st-sch-in .tl-mano .tit"); return t2 && t2.textContent !== tit && P.document.querySelector(".tl-conferma"); }, 6000)) no(chi + ": dopo «🔄 Cambia» la carta resta la stessa");
            if (P.document.querySelector(".st-sch-in .tl-mano .cambia")) no(chi + ": dopo il cambio il tasto «🔄 Cambia» c'è ancora");
            note.push(chi + " cambia «" + tit.slice(0, 30) + "»");
            continue;
          }
        } else if (bc) no(chi + " ha già cambiato ma ha ancora «🔄 Cambia»");
        kOld = mano.textContent;
        var Y = annoDi(P, mano.textContent), anni = [].map.call(P.document.querySelectorAll(".st-sch-in .tl-asse > .tl-ev .anno"), function (a) { var t = a.textContent; return /a\.C\./.test(t) ? -parseInt(t, 10) : parseInt(t, 10); });
        slots[gapOk(anni.map(function (a) { return { anno: a }; }), Y)].click(); await W.dorme(120);
        if (!W.clicca(P, /Mettila qui/, ".tl-conferma")) no("non riesco a confermare");
        turni++; await W.dorme(300); continue;
      }
      await W.dorme(250);
    }
    if (!/Classifica finale/.test(T(P))) no("la partita non finisce («" + T(P).slice(0, 160) + "»)");
    if (turni !== 6) no("i turni sono " + turni + " (il cambio non deve costare un turno)");
    if (Object.keys(usato).length !== 2) no("hanno cambiato carta: " + Object.keys(usato).join(", "));
    senzaErrori();
    return turni + " turni; " + note.join(", ");
  } });

  COPIONE.aggiungi("tp9", { nome: "Linea del tempo online: 🔄 Cambia carta (a messaggio e col tasto), una volta sola, solo al proprio turno, gli altri lo vedono", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo"), note = [];
    await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 10000)) no("nella saletta non arrivano in 2");
    await regola(P, async function (f) { var meno = f.querySelector(".stepper button"); meno.click(); meno.click(); });
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var gG = null, fatto = { giulia: false, paky: false, fuoriTurno: false }, kV = "", fino = Date.now() + 300000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n + "|" + (v.carta && v.carta.titolo);
      if (k === kV) { await W.dorme(250); continue; }
      kV = k; gG = gG || idDi(C, "Giulia");
      if (v.fase === "turno") {
        if (!v.cambiOn) no("a turno la foto dice che non si può cambiare carta");
        var tit = v.carta.titolo;
        if (v.turnoId !== "host") {
          if (!fatto.giulia) {
            manda("Giulia", C, { t: "cambia" });
            if (!await W.aspetta(function () { return vm(C).carta && vm(C).carta.titolo !== tit; }, 5000)) no("Giulia manda «cambia» ma la carta resta la stessa");
            var t2 = vm(C).carta.titolo;
            if (!gDi(C, gG).cambio || vm(C).cambi !== 1) no("dopo il cambio la foto non lo dice (cambio " + gDi(C, gG).cambio + ", cambi " + vm(C).cambi + ")");
            if (!await W.aspetta(function () { return /Giulia cambia carta/.test(T(P)); }, 5000)) no("Paky non vede «🔄 Giulia cambia carta!»");
            manda("Giulia", C, { t: "cambia" }); await W.dorme(600);
            if (vm(C).carta.titolo !== t2) no("Giulia ha cambiato carta due volte");
            fatto.giulia = true; note.push("Giulia cambia (a messaggio), la seconda volta no"); kV = ""; continue;
          }
          var Yg = annoDi(P, v.carta.titolo); manda("Giulia", C, { t: "scelta", gap: gapOk(v.linea, Yg) });
        } else {
          if (!fatto.fuoriTurno) {   // Giulia prova a cambiare la carta di Paky: non vale
            manda("Giulia", C, { t: "cambia" }); await W.dorme(600);
            if (vm(C).carta.titolo !== tit) no("Giulia ha cambiato la carta di Paky");
            fatto.fuoriTurno = true;
          }
          if (!await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === v.linea.length + 1; }, 12000)) no("Paky non vede i posti");
          var bc = P.document.querySelector(".st-sch-in .tl-mano .cambia");
          if (!fatto.paky) {
            if (!bc) no("Paky al suo turno non ha «🔄 Cambia»");
            else {
              bc.click();
              if (!await W.aspetta(function () { return vm(C).carta && vm(C).carta.titolo !== tit; }, 5000)) no("Paky tocca «🔄 Cambia» ma la carta resta la stessa");
              if (!await W.aspetta(function () { var t3 = P.document.querySelector(".st-sch-in .tl-mano .tit"); return t3 && t3.textContent === vm(C).carta.titolo && !P.document.querySelector(".st-sch-in .tl-mano .cambia"); }, 6000)) no("sul telefono di Paky non c'è la carta nuova (o c'è ancora «🔄 Cambia»)");
              fatto.paky = true; note.push("Paky cambia col tasto"); kV = ""; continue;
            }
          } else if (bc) no("Paky ha già cambiato ma ha ancora «🔄 Cambia»");
          var Yp = annoDi(P, vm(C).carta.titolo), lin = vm(C).linea;
          if (!await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === lin.length + 1; }, 8000)) no("Paky non vede i posti della carta nuova");
          P.document.querySelectorAll(".tl-slot")[gapOk(lin, Yp)].click(); await W.dorme(150); W.clicca(P, /Mettila qui/, ".tl-conferma");
        }
        continue;
      }
      if (v.fase === "votazione") { if (v.turnoId === "host") manda("Giulia", C, { t: "ruba", gap: null }); else await W.aspetta(function () { return W.clicca(P, /👍 Passo/); }, 12000); continue; }
      if (v.fase === "esito") {
        if (!v.esito.giusto) no("turno di " + v.esito.nome + ": la carta messa al posto giusto risulta sbagliata (la carta cambiata non è quella giudicata?)");
        await W.aspetta(function () { return W.clicca(P, /Avanti/, ".st-barra button"); }, 25000); continue;
      }
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ")");
    Object.keys(fatto).forEach(function (x) { if (!fatto[x]) no("non è successo: " + x); });
    senzaErrori();
    return note.join("; ") + "; classifica " + (vm(C).classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ");
  } });

  // =================== tp10: le foto vere sulle carte (26 ott 2026) ===================
  COPIONE.aggiungi("tp10", { nome: "Linea del tempo sullo stesso telefono, solo Storia e Invenzioni: le foto vere sulla carta in mano e sulla linea, si caricano, misure, foto che non arriva = carta senza foto (opz.cat: altre categorie)", fai: async function (opz) {
    var CAT = new RegExp((opz && opz.cat) || "Storia|Invenzioni");
    var P = await W.apriTel("Paky", { x: 0 }), viste = 0, conFoto = 0, rotta = false, fino = Date.now() + 260000, kOld = "", turni = 0, linea = 0;
    var F = P.SG_TL_FOTO || {};
    if (Object.keys(F).length < 100) no("le foto nel gioco sono solo " + Object.keys(F).length);
    await localeTl(P, ["Paky", "Giulia"], false, { prima: async function () {
      [].forEach.call(P.document.querySelectorAll(".cat-chip"), function (c) { if (!CAT.test(c.textContent) && c.classList.contains("attiva")) c.click(); });
      await W.dorme(100);
      var att = [].map.call(P.document.querySelectorAll(".cat-chip.attiva"), function (c) { return c.textContent; });
      if (att.length !== 2) no("le categorie accese sono " + att.join(", "));
    } });
    function stato() { var s = P.document.querySelector(".st-sch-in .tl-stato"); return s ? s.textContent : ""; }
    var TIT = {}; Object.keys(F).forEach(function (k) { TIT[k.split("|").slice(1).join("|")] = 1; });
    function foto(tit) { return TIT[tit]; }
    while (Date.now() < fino) {
      if (/Classifica finale/.test(T(P))) break;
      if (W.clicca(P, /tocca a me/)) { await W.dorme(300); continue; }
      if (W.clicca(P, /Nessuno la ruba/)) { await W.dorme(300); continue; }
      var mano = P.document.querySelector(".st-sch-in .tl-mano"), tit = mano && mano.querySelector(".tit"), slots = P.document.querySelectorAll(".st-sch-in .tl-slot");
      if (/Tocca a te/.test(stato()) && tit && slots.length && P.document.querySelector(".tl-conferma") && kOld !== tit.textContent) {
        kOld = tit.textContent; viste++;
        var im = mano.querySelector("img.ft");
        if (foto(tit.textContent)) {
          conFoto++;
          if (!im || !mano.classList.contains("con-foto")) no("«" + tit.textContent + "» ha la foto ma la carta non la mostra");
          else {
            if (!/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(im.src)) no("la foto viene da " + im.src.slice(0, 60));
            if (!await W.aspetta(function () { return im.complete && im.naturalWidth > 0; }, 15000)) no("la foto di «" + tit.textContent + "» non si carica (" + im.src.slice(-70) + ")");
            if (conFoto === 1) { var m = await misure(P, "Paky"); if (m) no("con la foto: " + m); }
            // la foto che non arriva (rete, Wikimedia giù): si toglie e la carta resta solo scritta
            if (conFoto === 2 && !rotta) {
              rotta = true; im.dispatchEvent(new P.Event("error"));
              if (mano.querySelector("img.ft") || mano.classList.contains("con-foto")) no("la foto che non arriva resta sulla carta");
            }
          }
        } else if (im) no("«" + tit.textContent + "» non ha foto ma la carta ne mostra una");
        // sulla linea: le carte con la foto hanno la miniatura
        [].forEach.call(P.document.querySelectorAll(".st-sch-in .tl-asse > .tl-ev:not(.tent)"), function (ev) {
          var t = ev.querySelector(".tit span:last-child"); if (!t) return;
          var ha = !!ev.querySelector(".card img.ft");
          if (foto(t.textContent) && !ha) no("sulla linea «" + t.textContent + "» non ha la miniatura");
          if (!foto(t.textContent) && ha) no("sulla linea «" + t.textContent + "» ha una miniatura che non è sua");
          if (ha) linea++;
        });
        var Y = annoDi(P, tit.textContent), anni = [].map.call(P.document.querySelectorAll(".st-sch-in .tl-asse > .tl-ev .anno"), function (a) { var t2 = a.textContent; return /a\.C\./.test(t2) ? -parseInt(t2, 10) : parseInt(t2, 10); });
        slots[gapOk(anni.map(function (a) { return { anno: a }; }), Y)].click(); await W.dorme(120);
        if (!W.clicca(P, /Mettila qui/, ".tl-conferma")) no("non riesco a confermare");
        turni++; await W.dorme(300); continue;
      }
      await W.dorme(250);
    }
    if (!/Classifica finale/.test(T(P))) no("la partita non finisce");
    if (conFoto < 3) no("solo " + conFoto + " carte su " + viste + " avevano la foto");
    senzaErrori();
    return turni + " turni; foto sulla carta in mano " + conFoto + " su " + viste + "; miniature viste sulla linea " + linea + "; foto che non arriva tolta: " + rotta + "; misure ok";
  } });
  // =================== tp11, tp12: chi arriva tardi entra al giro dopo (26 ott 2026) ===================
  // gioca da sola una partita online coi messaggi (scelta giusta, nessuno ruba); a metà arriva Nino: aspetta in «prossimi»,
  // legge «✋ Entri al …», ed entra all'inizio del giro dopo (a turno) o alla carta dopo (⚡ tutti insieme) con 0 punti
  async function partitaConRitardatario(gara, nomi, quando) {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo"), note = [];
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=timeline&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 10000)) no("nella saletta non arrivano in " + nomi.length);
    await regola(P, async function (f) {
      chipIn(f, gara === "insieme" ? /Tutti insieme/ : /^🎯?\s*A turno/);
      var meno = f.querySelector(".stepper button"); if (gara !== "insieme") { meno.click(); meno.click(); }
    });
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var kV = "", fino = Date.now() + 360000, nino = null, entrato = null, prima = null, turniNino = 0, giusteNino = 0;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n;
      if (!nino && quando(v)) {
        // arriva Nino: aspetta (nella foto il suo id in «prossimi»), mai tra i giocatori a metà giro
        nino = await W.apriTel("Nino", { hash: "gioco=timeline&stanza=" + C, x: 185 * nomi.length });
        if (!await W.aspetta(function () { return (vm(C).prossimi || []).some(function (x) { return x.nome === "Nino"; }); }, 15000)) no("Nino non è in «prossimi» (" + JSON.stringify(vm(C).prossimi) + ")");
        var re = gara === "insieme" ? /Entri dalla prossima carta/ : /Entri al prossimo giro/;
        if (!await W.aspetta(function () { return re.test(T(W.finestra("Nino"))); }, 15000)) no("Nino non legge «" + re.source + "» («" + T(W.finestra("Nino")).slice(-160) + "»)");
        prima = { n: vm(C).n, giro: vm(C).giro, restano: Math.max.apply(null, vm(C).giocatori.map(function (g) { return g.restano; })) };
        note.push("Nino arriva alla foto " + prima.n);
      }
      if (nino && !entrato && (vm(C).giocatori || []).some(function (g) { return g.nome === "Nino"; })) {
        var g = (vm(C).giocatori || []).filter(function (x) { return x.nome === "Nino"; })[0], v2 = vm(C);
        entrato = { n: v2.n, restano: g.restano, punti: g.punti };
        if (g.punti !== 0) no("Nino entra con " + g.punti + " punti");
        if ((v2.prossimi || []).length) no("Nino entrato ma ancora in «prossimi»");
        if (gara !== "insieme" && v2.fase === "turno" && v2.turnoId !== idDi(C, "Paky")) no("Nino è entrato a metà giro (tocca a " + v2.turnoNome + ")");
        note.push("entra alla foto " + v2.n + " con " + g.restano + " carte");
      }
      if (k === kV) { await W.dorme(200); continue; }
      kV = k;
      if (v.fase === "turno") {
        var Y = annoDi(P, v.carta.titolo), ok = gapOk(v.linea, Y), chi = v.turnoNome;
        if (chi === "Nino") turniNino++;
        if (chi === "Paky") {
          if (!await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === v.linea.length + 1; }, 12000)) no("Paky non vede i posti");
          P.document.querySelectorAll(".tl-slot")[ok].click(); await W.dorme(150); W.clicca(P, /Mettila qui/, ".tl-conferma");
        } else manda(chi, C, { t: "scelta", gap: ok });
        continue;
      }
      if (v.fase === "votazione") {
        (v.giocatori || []).forEach(function (g) { if (g.id !== v.turnoId && g.nome !== "Paky") manda(g.nome, C, { t: "ruba", gap: null }); });
        if (v.turnoNome !== "Paky") await W.aspetta(function () { return W.clicca(P, /👍 Passo/); }, 12000);
        continue;
      }
      if (v.fase === "tutti") {
        var Y2 = annoDi(P, v.carta.titolo), ok2 = gapOk(v.linea, Y2);
        (v.giocatori || []).forEach(function (g) { if (g.nome !== "Paky") manda(g.nome, C, { t: "posa", gap: ok2 }); });
        if (await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === v.linea.length + 1; }, 12000)) {
          P.document.querySelectorAll(".tl-slot")[ok2].click(); await W.dorme(150); W.clicca(P, /Mettila qui/, ".tl-conferma");
        }
        continue;
      }
      if (v.fase === "esito") { if (v.turnoNome === "Nino" && v.esito && v.esito.giusto) giusteNino++; await W.aspetta(function () { return W.clicca(P, /Avanti/, ".st-barra button"); }, 25000); continue; }
      if (v.fase === "tEsito") {
        (v.esitoT.risultati || []).forEach(function (r) { if (r.giusto && (vm(C).giocatori || []).some(function (g) { return g.id === r.id && g.nome === "Nino"; })) giusteNino++; });
        (v.giocatori || []).forEach(function (g) { if (g.nome !== "Paky") manda(g.nome, C, { t: "avanti" }); });
        W.clicca(P, /Avanti/, ".st-barra button"); continue;
      }
      await W.dorme(200);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ") · " + note.join(" · "));
    if (!entrato) no("Nino non è mai entrato · " + note.join(" · "));
    var cl = vm(C).classifica || [], rn = cl.filter(function (r) { return r.nome === "Nino"; })[0];
    if (!rn) no("Nino non è nella classifica finale");
    senzaErrori();
    return { note: note, entrato: entrato, prima: prima, turniNino: turniNino, giusteNino: giusteNino, cl: cl, C: C };
  }

  COPIONE.aggiungi("tp11", { nome: "Linea del tempo online a turno: chi arriva a metà partita aspetta ed entra all'inizio del giro dopo, con 0 punti e le carte che restano", fai: async function () {
    // Nino arriva quando tocca a Giulia nel primo giro (a metà giro)
    var r = await partitaConRitardatario("turno", ["Paky", "Giulia"], function (v) { return v.fase === "turno" && v.turnoNome === "Giulia" && v.giocatori.some(function (g) { return g.nome === "Giulia" && g.restano === 3; }); });
    if (r.entrato.restano !== r.prima.restano - 1) no("Nino entra con " + r.entrato.restano + " carte invece di " + (r.prima.restano - 1) + " (quelle che restano agli altri)");
    if (r.turniNino !== r.entrato.restano) no("Nino ha giocato " + r.turniNino + " turni invece di " + r.entrato.restano);
    return r.note.join("; ") + "; Nino gioca " + r.turniNino + " turni; classifica " + r.cl.map(function (x) { return x.nome + " " + x.punti; }).join(", ");
  } });

  COPIONE.aggiungi("tp12", { nome: "Linea del tempo online ⚡ Tutti insieme: chi arriva a metà carta entra dalla carta dopo, con 0 punti e le carte che restano", fai: async function () {
    var r = await partitaConRitardatario("insieme", ["Paky", "Giulia"], function (v) { return v.fase === "tutti" && v.giro === 2; });
    if (r.entrato.restano !== 10 - 2) no("Nino entra con " + r.entrato.restano + " carte invece di 8");
    return r.note.join("; ") + "; Nino ha messo giuste " + r.giusteNino + " carte; classifica " + r.cl.map(function (x) { return x.nome + " " + x.punti; }).join(", ");
  } });

  // =================== tp13-tp16: «🧍 Ognuno la sua linea» (26 ott 2026) ===================
  // Ognuno ha la sua linea (una carta di partenza a testa), esce una carta per tutti e ognuno la mette nella SUA linea: vince chi
  // arriva prima a N carte messe bene; spareggio se in tanti arrivano insieme al primo posto; si gioca finché c'è il podio.
  // Chi ha finito (e chi guarda) tocca gli avatar di chi gioca e vede la sua linea e dove ha messo la carta (messaggio "spia").
  // tp13: online in 3, N = 5, partita intera (Luca sbaglia spesso): linee diverse che crescono solo coi ✅, mai le mosse nella
  //       foto, la fila degli avatar di chi ha finito, la classifica (t.risultato), misure.
  // tp14: online in 3, spareggio a due (Paky e Giulia): solo loro giocano (la carta di Luca non vale), Luca guarda le loro linee,
  //       «ancora» (tutti giusti, poi tutti sbagliati), vince chi la mette giusta da solo, la partita finisce (podio in 3 = 2).
  // tp14b: online in 4: lo spareggio a due finisce e gli altri continuano fino al terzo posto (chi ha finito li guarda).
  // tp14c: online in 3: spareggio a tre, chi sbaglia esce dallo spareggio (arriva terzo) e poi guarda gli altri due.
  // tp15: sullo stesso telefono in 2: il telefono passa di mano, ognuno vede solo la sua linea, fino al vincitore.
  // tp16: l'host ricarica la pagina a metà carta e poi sul risultato: la partita riprende con le stesse linee.
  function visibile(e) { for (; e; e = e.parentElement) if (e.hidden) return false; return true; }
  function titoli(lin) { return (lin || []).map(function (e) { return e.titolo; }).join(" | "); }
  // le carte della linea che si vede sul maxischermo (senza la carta messa per prova)
  function lineaVista(w) { return [].map.call(w.document.querySelectorAll(".st-sch-in .tl-asse > .tl-ev:not(.tent) .tit span:last-child"), function (s) { return s.textContent; }).join(" | "); }
  // la carta messa per prova sulla linea che si vede: { chi, posto } (posto = quante carte prima di lei) o null
  function tentVisto(w) {
    var asse = w.document.querySelector(".st-sch-in .tl-asse"); if (!asse) return null;
    var figli = [].slice.call(asse.children), i = figli.findIndex(function (x) { return x.classList.contains("tent") && x.classList.contains("tl-ev"); });
    if (i < 0) return null;
    return { chi: (figli[i].querySelector(".chi") || {}).textContent || "", posto: figli.slice(0, i).filter(function (x) { return x.classList.contains("tl-ev"); }).length };
  }
  function chipSpia(w) { return [].slice.call(w.document.querySelectorAll(".st-barra.on .tl-spia .tl-gv")); }
  // le regole del modo nuovo dal ⚙️ della saletta: «🧍 Ognuno la sua linea» e la lineetta (le righe che non servono spariscono)
  async function regolaLinee(P, vinci) {
    await regola(P, async function (f) {
      chipIn(f, /Ognuno la sua linea/);
      await W.dorme(100);
      ["Come si gioca online", "Carte da piazzare", "Carte in tutto", "Dimmi l'anno", "I nostri ricordi", "Rubare la carta"].forEach(function (tx) {
        var et = [].find.call(f.querySelectorAll(".etichetta"), function (e) { return e.textContent.indexOf(tx) >= 0 && visibile(e); });
        if (et) no("col modo nuovo nel ⚙️ si vede ancora «" + tx + "»");
      });
      if ([].some.call(f.querySelectorAll(".stepper"), visibile)) no("col modo nuovo nel ⚙️ c'è ancora il − / + delle carte");
      var sl = f.querySelector(".tl-vinci .sl"), nn = f.querySelector(".tl-vinci .n");
      if (!sl || !visibile(sl)) no("nel ⚙️ non c'è la lineetta delle carte per vincere");
      if (sl.type !== "range") no("le carte per vincere non si scelgono con la lineetta (" + sl.type + ")");
      if (sl.min !== "5" || sl.max !== "15") no("la lineetta va da " + sl.min + " a " + sl.max);
      if (nn.textContent !== "10") no("di partenza le carte per vincere sono " + nn.textContent);
      if (!/Vince chi arriva prima a 10 carte/.test(f.textContent)) no("sotto «Ognuno la sua linea» non c'è «Vince chi arriva prima a 10 carte»");
      sl.value = String(vinci); sl.dispatchEvent(new P.Event("input", { bubbles: true }));
      await W.dorme(80);
      if (nn.textContent !== String(vinci)) no("spostata la lineetta, il numero dice " + nn.textContent);
    });
  }
  // il modello delle regole (fatto a parte): dopo i risultati di una carta, chi arriva, lo spareggio e se è finita
  function attesoL(M, ris) {
    var giusti = ris.filter(function (r) { return r.giusto; }).map(function (r) { return r.id; }), gi = ris.map(function (r) { return r.id; }), arr = [], tipo = null;
    giusti.forEach(function (id) { M.ok[id] = (M.ok[id] || 0) + 1; });
    var nFin = Object.keys(M.fin).length;
    function arriva(id, p) { M.fin[id] = p; arr.push(id + ":" + p); }
    if (!M.spar) {
      var a = giusti.filter(function (id) { return M.ok[id] >= M.vinci; });
      if (a.length > 1 && nFin === 0) { M.spar = a; tipo = "inizia"; }
      else a.forEach(function (id) { arriva(id, nFin + 1); });
    } else if (giusti.length === 1) {
      arriva(giusti[0], 1); gi.forEach(function (id) { if (id !== giusti[0]) arriva(id, 2); });
      M.spar = null; tipo = "vinto";
    } else if (!giusti.length || giusti.length === gi.length) tipo = "ancora";
    else { gi.forEach(function (id) { if (giusti.indexOf(id) < 0) arriva(id, 1 + giusti.length); }); M.spar = giusti; tipo = "fuori"; }
    return { arr: arr.sort().join(","), tipo: tipo, fine: !M.spar && Object.keys(M.fin).length >= Math.max(1, Math.min(3, M.n - 1)) };
  }
  // una partita online «Ognuno la sua linea» fino alla fine. piano(nome, carta, v) = true (giusta), false (sbagliata), null (non sceglie).
  // Paky (l'host) gioca dal suo telefono coi tasti, gli altri a messaggio. A ogni carta: mai le mosse nella foto, le linee crescono solo
  // coi ✅, le carte messe bene, chi gioca (lo spareggio), chi arriva e il suo posto (col modello a parte), il messaggio "spia" mai a
  // chi gioca. opz.prima(v, ctx) prima delle mosse ("rifai" = la carta si rilegge da capo), opz.mossa(v, ctx, id) dopo ogni mossa
  // degli amici, opz.esito(v, ctx) sul risultato ("rifai" = niente Avanti)
  async function partitaLinee(C, nomi, vinci, piano, opz) {
    opz = opz || {};
    var ctx = { carte: 0, storia: [], lin: null, giocPerN: {}, M: { ok: {}, fin: {}, spar: null, vinci: vinci, n: nomi.length }, note: [], piani: {}, foto: 0 };
    var kV = "", fino = Date.now() + (opz.ms || 600000);
    function P() { return W.finestra("Paky"); }
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n;
      if (v.fase === "lp") {   // la foto prima del risultato: mai dove l'hanno messa
        var js = JSON.stringify(v); ctx.foto++;
        var seg = js.match(/"(gap|mosse|scelte|posti)"\s*:\s*[^n,}\]]/);
        if (seg) no("carta " + ctx.carte + ": nella foto prima del risultato c'è «" + seg[0] + "…» (" + js.slice(0, 120) + ")");
      }
      if (k === kV) { await W.dorme(120); continue; }
      kV = k;
      if (v.fase === "lp") {
        if (!v.linee) no("la foto non dice «linee»");
        if (v.carta.anno != null) no("nella foto c'è l'anno della carta in gioco");
        var Y = annoDi(P(), v.carta.titolo); if (Y == null) no("non trovo l'anno di «" + v.carta.titolo + "»");
        // le linee sono quelle di prima (solo chi è appena entrato ha la sua nuova)
        if (ctx.lin) Object.keys(ctx.lin).forEach(function (id) { if (titoli(ctx.lin[id]) !== titoli(v.lin[id])) no("carta " + (ctx.carte + 1) + ": la linea di " + nomeDi(C, id) + " è «" + titoli(v.lin[id]) + "» invece di «" + titoli(ctx.lin[id]) + "»"); });
        var gioc = v.giocatori.filter(function (g) { return !g.fin && (!v.spar || v.spar.ids.indexOf(g.id) >= 0); });
        var giocAtt = v.giocatori.filter(function (g) { return !ctx.M.fin[g.id] && (!ctx.M.spar || ctx.M.spar.indexOf(g.id) >= 0); });
        if (gioc.map(function (g) { return g.id; }).sort().join() !== giocAtt.map(function (g) { return g.id; }).sort().join()) no("carta " + (ctx.carte + 1) + ": giocano " + gioc.map(function (g) { return g.nome; }).join(", ") + " invece di " + giocAtt.map(function (g) { return g.nome; }).join(", "));
        v.giocatori.forEach(function (g) { if ((g.ok || 0) !== (ctx.M.ok[g.id] || 0)) no(g.nome + " ha " + g.ok + " carte messe bene invece di " + (ctx.M.ok[g.id] || 0)); });
        ctx.carte++;
        ctx.v = v; ctx.Y = Y; ctx.giocPerN[v.n] = gioc.map(function (g) { return g.id; });
        ctx.piani = {};
        gioc.forEach(function (g) {
          var lin = v.lin[g.id] || [], p = piano(g.nome, ctx.carte, v), ok = gapOk(lin, Y), ko = gapKo(lin, Y);
          if (p === false && ko < 0) p = true;
          ctx.piani[g.id] = { giusto: p === true, gap: p == null ? null : p ? ok : ko, nome: g.nome };
        });
        if (opz.prima && (await opz.prima(v, ctx)) === "rifai") { kV = ""; ctx.carte--; continue; }   // (la carta si rigioca: conta una volta)
        // gli amici a messaggio, Paky dal telefono (prima di toccare un posto aspetta i posti della SUA linea)
        var amici = gioc.filter(function (g) { return g.id !== "host"; });
        for (var a = 0; a < amici.length; a++) {
          var pa = ctx.piani[amici[a].id];
          if (pa.gap != null) manda(amici[a].nome, C, { t: "posa", gap: pa.gap });
          if (opz.mossa) await opz.mossa(v, ctx, amici[a].id);
        }
        var ph = ctx.piani.host;
        if (ph && ph.gap != null) {
          var linH = v.lin.host || [];
          if (!await W.aspetta(function () { return P().document.querySelectorAll(".st-sch-in .tl-slot").length === linH.length + 1 && P().document.querySelector(".tl-conferma"); }, 15000)) no("carta " + ctx.carte + ": Paky non vede i posti della sua linea («" + T(P()).slice(0, 160) + "»)");
          if (lineaVista(P()) !== titoli(linH)) no("carta " + ctx.carte + ": Paky vede la linea «" + lineaVista(P()) + "» invece della sua «" + titoli(linH) + "»");
          P().document.querySelectorAll(".st-sch-in .tl-slot")[ph.gap].click(); await W.dorme(120);
          if (opz.scelto) await opz.scelto(v, ctx);
          if (!W.clicca(P(), /Mettila qui/, ".tl-conferma")) no("carta " + ctx.carte + ": Paky non riesce a confermare");
        }
        continue;
      }
      if (v.fase === "lEsito") {
        var es = v.esitoL || {}, Mi = attesoL(ctx.M, es.risultati || []);
        if (es.anno !== ctx.Y) no("il risultato dice l'anno " + es.anno + " invece di " + ctx.Y);
        var ids = (es.risultati || []).map(function (r) { return r.id; }).sort().join();
        if (ids !== Object.keys(ctx.piani).sort().join()) no("carta " + ctx.carte + ": nel risultato ci sono " + ids + " invece di " + Object.keys(ctx.piani).sort().join());
        (es.risultati || []).forEach(function (r) {
          var p = ctx.piani[r.id], prima = ctx.v.lin[r.id] || [], dopo = v.lin[r.id] || [];
          if (!p) return;
          if (r.giusto !== p.giusto) no("carta " + ctx.carte + ": " + p.nome + " giusto = " + r.giusto + ", atteso " + p.giusto);
          if (r.scelto !== (p.gap != null)) no("carta " + ctx.carte + ": " + p.nome + " scelto = " + r.scelto);
          // la linea cresce solo coi ✅ (e con la carta di adesso)
          if (dopo.length !== prima.length + (r.giusto ? 1 : 0)) no("carta " + ctx.carte + ": la linea di " + p.nome + " ha " + dopo.length + " carte (prima " + prima.length + ", giusto " + r.giusto + ")");
          if (dopo.some(function (e) { return e.titolo === es.titolo; }) !== r.giusto) no("carta " + ctx.carte + ": la carta " + (r.giusto ? "giusta non è entrata" : "sbagliata è entrata") + " nella linea di " + p.nome);
          for (var q = 1; q < dopo.length; q++) if (dopo[q - 1].anno > dopo[q].anno) no("la linea di " + p.nome + " non è in ordine");
        });
        // chi non gioca questa carta: la sua linea non cambia
        Object.keys(v.lin).forEach(function (id) { if (!ctx.piani[id] && ctx.v.lin[id] && titoli(ctx.v.lin[id]) !== titoli(v.lin[id])) no("carta " + ctx.carte + ": la linea di " + nomeDi(C, id) + " è cambiata, ma non giocava"); });
        var arr = (es.arrivi || []).map(function (x) { return x.id + ":" + x.posto; }).sort().join(",");
        if (arr !== Mi.arr) no("carta " + ctx.carte + ": arrivano «" + arr + "» invece di «" + Mi.arr + "»");
        if ((es.spar ? es.spar.tipo : null) !== Mi.tipo) no("carta " + ctx.carte + ": spareggio «" + (es.spar && es.spar.tipo) + "» invece di «" + Mi.tipo + "»");
        if (!!es.fine !== Mi.fine) no("carta " + ctx.carte + ": fine = " + es.fine + ", atteso " + Mi.fine);
        if ((v.spar ? v.spar.ids.slice().sort().join() : "") !== (ctx.M.spar ? ctx.M.spar.slice().sort().join() : "")) no("carta " + ctx.carte + ": lo spareggio nella foto è " + JSON.stringify(v.spar));
        v.giocatori.forEach(function (g) { if ((g.fin || 0) !== (ctx.M.fin[g.id] || 0)) no(g.nome + " ha il posto " + g.fin + " invece di " + (ctx.M.fin[g.id] || 0)); });
        ctx.storia.push(ctx.carte + ":" + (es.risultati || []).map(function (r) { return nomeDi(C, r.id).slice(0, 1) + (r.giusto ? "✅" : r.scelto ? "❌" : "⏰"); }).join("") + (es.spar ? "⚔️" + es.spar.tipo : "") + (arr ? "🏁" + arr : ""));
        ctx.lin = JSON.parse(JSON.stringify(v.lin));
        if (opz.esito && (await opz.esito(v, ctx)) === "rifai") { kV = ""; continue; }
        // «⏩ Avanti»: chi ha giocato (Paky col tasto, dopo la rivelazione; gli amici a messaggio, un attimo dopo)
        var conPaky = (es.risultati || []).some(function (r) { return r.id === "host"; });
        if (conPaky) await W.aspetta(function () { return bottone(P(), /Avanti/); }, 20000);
        else await W.dorme(2500);
        (es.risultati || []).forEach(function (r) { if (r.id !== "host" && !gDi(C, r.id).via) manda(nomeDi(C, r.id), C, { t: "avanti" }); });
        if (conPaky) W.clicca(P(), /Avanti/, ".st-barra button");
        continue;
      }
      await W.dorme(150);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ") · " + ctx.storia.join(" "));
    // il messaggio "spia" (dove l'hanno messa): mai a chi gioca quella carta, e senza anni
    var spie = 0;
    (W.BR.storia || []).forEach(function (s) {
      if (s.topic.indexOf("/" + C + "/") < 0) return;
      var m = null; try { m = JSON.parse(s.p); } catch (e) {}
      if (!m || m.t !== "spia") return;
      spie++;
      var gi = ctx.giocPerN[m.n] || [];
      (m.per || []).forEach(function (id) { if (gi.indexOf(id) >= 0) no("il messaggio «spia» della carta " + m.n + " va anche a " + nomeDi(C, id) + ", che la gioca"); });
      if (/anno/.test(s.p)) no("nel messaggio «spia» ci sono gli anni");
    });
    ctx.spie = spie;
    // la classifica: prima chi ha finito (il suo posto), poi gli altri per carte (stesse carte = stesso posto)
    var nFin = Object.keys(ctx.M.fin).length, cl = vm(C).classifica || [];
    cl.forEach(function (r) {
      var att = ctx.M.fin[r.id] || (1 + nFin + Object.keys(ctx.M.ok).filter(function (id) { return !ctx.M.fin[id] && ctx.M.ok[id] > (ctx.M.ok[r.id] || 0); }).length);
      if (r.pos !== att) no(r.nome + " in classifica è " + r.pos + "° invece di " + att + "°");
      if (r.punti !== (ctx.M.ok[r.id] || 0)) no(r.nome + " in classifica ha " + r.punti + " carte invece di " + (ctx.M.ok[r.id] || 0));
    });
    senzaErrori();
    return ctx;
  }
  // apre la stanza (un gioco solo) con Paky host e gli amici, sceglie «Ognuno la sua linea» con vinci carte, e comincia
  async function stanzaLinee(nomi, vinci) {
    A.spiaTavolo();
    var P = await W.apriTel("Paky", { x: 0, spiaTav: ["timeline"] }), C = await W.apriStanza(P, "La linea del tempo");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=timeline&stanza=" + C, x: 185 * i, spiaTav: ["timeline"] });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 10000)) no("nella saletta non arrivano in " + nomi.length);
    await regolaLinee(P, vinci);
    var G = W.finestra(nomi[1]);
    if (!await W.aspetta(function () { return A.regoleDi(G).indexOf("🧍 Ognuno la sua linea · vince chi arriva a " + vinci + " carte") === 0; }, 5000)) no(nomi[1] + " legge «" + A.regoleDi(G) + "»");
    if (/📅|📸/.test(A.regoleDi(G))) no("la riga delle regole parla ancora di anno o ricordi («" + A.regoleDi(G) + "»)");
    if (!await W.aspetta(function () { return vm(C).linee === true && vm(C).vinci === vinci; }, 4000)) no("le regole nuove non arrivano nella foto");
    // (la spia di t.risultato: la classifica che va alla Sala e al torneo)
    P.__risultati = [];
    var tav = P.__tav; if (!tav) no("la spia del tavolo non c'è");
    var ris0 = tav.risultato; tav.risultato = function (l) { P.__risultati.push(JSON.parse(JSON.stringify(l))); return ris0 ? ris0.apply(this, arguments) : undefined; };
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "lp"; }, 40000)) no("la prima carta non arriva (fase " + vm(C).fase + ")");
    // la carta di partenza: una a testa, diversa per ognuno
    var v = vm(C), tit = {};
    v.giocatori.forEach(function (g) { var l = v.lin[g.id] || []; if (l.length !== 1) no(g.nome + " parte con " + l.length + " carte"); tit[l[0] && l[0].titolo] = 1; });
    if (Object.keys(tit).length !== nomi.length) no("le carte di partenza non sono diverse: " + JSON.stringify(v.lin));
    return { C: C, P: P };
  }
  function risultatoDi(P) { return (P.__risultati || []).slice(-1)[0] || null; }
  function posDi(l, nome) { var r = (l || []).filter(function (x) { return x.nome === nome; })[0]; return r ? r.pos : null; }

  COPIONE.aggiungi("tp13", { nome: "Linea del tempo online in 3, «🧍 Ognuno la sua linea» a 5 carte: partita intera, linee diverse, mai le mosse nella foto, chi ha finito guarda le linee degli altri, classifica, misure", fai: async function () {
    var Z = await stanzaLinee(["Paky", "Giulia", "Luca"], 5), C = Z.C, P = Z.P, G = W.finestra("Giulia"), note = [], visto = { spia: false, misScelta: false, misEsito: false };
    // Paky sempre giusta (finisce alla carta 5), Giulia sbaglia la 2 (finisce alla 6), Luca sbaglia quasi sempre
    var ctx = await partitaLinee(C, ["Paky", "Giulia", "Luca"], 5, function (nome, c) {
      if (nome === "Paky") return true;
      if (nome === "Giulia") return c !== 2;
      return c === 3 || c === 6;
    }, {
      // Paky sceglie il posto: misure col posto scelto (una volta)
      scelto: async function () { if (visto.misScelta) return; visto.misScelta = true; var m = await misure(W.finestra("Paky"), "Paky"); if (m) no("mentre sceglie: " + m); },
      prima: async function (v, ctx) {
        // la barra in alto dice le carte messe bene ("3/5")
        function hud() { return [].map.call(P.document.querySelectorAll(".st-sch-in .tl-hud .tl-pl .p"), function (p) { return p.textContent; }).join(" "); }
        if (!await W.aspetta(function () { return /\d\/5/.test(hud()); }, 8000)) no("la barra in alto non dice le carte messe bene («" + hud() + "»)");
        // chi gioca non ha la fila di chi guarda
        if (G.document.querySelector(".tl-spia")) no("Giulia, che gioca, ha la fila degli avatar di chi guarda");
        if (!v.giocatori.some(function (g) { return g.id === "host" && g.fin; })) return;
        // Paky ha finito: guarda le linee di Giulia e Luca. Prima Luca (tocca il suo avatar), poi Giulia
        var gi = v.giocatori.filter(function (g) { return !g.fin; });
        if (!await W.aspetta(function () { return chipSpia(P).length === gi.length; }, 12000)) no("Paky ha finito ma non vede la fila con " + gi.length + " avatar («" + T(P).slice(-200) + "»)");
        var idL = idDi(C, "Luca"), idG = idDi(C, "Giulia");
        var att = P.document.querySelector(".tl-spia .tl-gv.attivo");
        if (!att) no("nella fila nessun avatar è acceso");
        var sel = att.getAttribute("data-id");
        if (!await W.aspetta(function () { return lineaVista(P) === titoli(v.lin[sel]); }, 5000)) no("Paky guarda " + nomeDi(C, sel) + " ma vede «" + lineaVista(P) + "» invece di «" + titoli(v.lin[sel]) + "»");
        if (tentVisto(P)) no("prima che scelga, sulla linea guardata c'è già una carta messa");
        var m4 = await misure(P, "Paky"); if (m4) no("mentre guarda: " + m4);
        chipSpia(P).filter(function (b) { return b.getAttribute("data-id") === idL; })[0].click();
        if (!await W.aspetta(function () { return lineaVista(P) === titoli(v.lin[idL]) && /linea di Luca/.test(T(P)); }, 4000)) no("toccato Luca, Paky vede «" + lineaVista(P) + "»");
        // Luca sceglie: Paky vede dove l'ha messa (Giulia no: gioca)
        var pL = ctx.piani[idL]; manda("Luca", C, { t: "posa", gap: pL.gap });
        if (!await W.aspetta(function () { var tv = tentVisto(P); return tv && /Luca/.test(tv.chi) && tv.posto === pL.gap; }, 6000)) no("Luca ha scelto il posto " + pL.gap + " ma Paky vede " + JSON.stringify(tentVisto(P)));
        if (G.document.querySelector(".st-sch-in .tl-ev.tent .chi") && /Luca/.test(G.document.querySelector(".st-sch-in .tl-ev.tent .chi").textContent)) no("Giulia vede dove l'ha messa Luca");
        // di nuovo Giulia: la sua linea, senza carta (non ha ancora scelto)
        chipSpia(P).filter(function (b) { return b.getAttribute("data-id") === idG; })[0].click();
        if (!await W.aspetta(function () { return lineaVista(P) === titoli(v.lin[idG]) && !tentVisto(P); }, 4000)) no("toccata Giulia, Paky vede «" + lineaVista(P) + "» " + JSON.stringify(tentVisto(P)));
        visto.spia = true; note.push("Paky guarda Luca (carta al posto " + pL.gap + ") e Giulia");
        // (la mossa di Luca la rimanda anche partitaLinee: vale la prima)
      },
      esito: async function (v, ctx) {
        if (visto.misEsito) return;
        if (!await W.aspetta(function () { return bottone(G, /Avanti/); }, 15000)) no("Giulia non arriva al risultato");
        if (!/Giusta!|Sbagliata|Tempo scaduto/.test(T(G))) no("Giulia non legge com'è andata («" + T(G).slice(0, 200) + "»)");
        var m = await misure(G, "Giulia"); if (m) no("sul risultato: " + m);
        visto.misEsito = true;
      }
    });
    if (!visto.spia) no("Paky non ha mai guardato le linee degli altri · " + ctx.storia.join(" "));
    // (qui guarda solo l'host, che lo sa già: il messaggio «spia» non serve. Lo prova la tp14, dove guarda Luca)
    if (ctx.spie) no("il messaggio «spia» è partito " + ctx.spie + " volte, ma guardava solo l'host");
    var r = risultatoDi(P);
    if (!r || posDi(r, "Paky") !== 1 || posDi(r, "Giulia") !== 2 || posDi(r, "Luca") !== 3) no("t.risultato dice " + JSON.stringify(r));
    if (!await W.aspetta(function () { return /Classifica finale/.test(T(G)) && /5 carte/.test(T(G)); }, 30000)) no("Giulia non vede la classifica con le carte («" + T(G).slice(0, 200) + "»)");
    return ctx.carte + " carte: " + ctx.storia.join(" ") + "; " + note.join(", ") + "; foto controllate " + ctx.foto + " (mai le mosse); risultato " + r.map(function (x) { return x.nome + " " + x.pos + "°"; }).join(", ");
  } });

  COPIONE.aggiungi("tp14", { nome: "Linea del tempo online in 3, «Ognuno la sua linea» a 5 carte: spareggio tra Paky e Giulia (ancora, ancora, vince chi la mette giusta da solo), Luca guarda le loro linee", fai: async function () {
    var Z = await stanzaLinee(["Paky", "Giulia", "Luca"], 5), C = Z.C, P = Z.P, L = W.finestra("Luca"), note = [], fatto = { guarda: false, ignorata: false, annuncio: false };
    var linLuca = null;
    // Paky e Giulia sempre giuste fino a 5 (spareggio); poi carta 6 giuste tutti e due, carta 7 sbagliate tutti e due, carta 8 vince Giulia
    var ctx = await partitaLinee(C, ["Paky", "Giulia", "Luca"], 5, function (nome, c) {
      if (nome === "Luca") return false;
      if (c <= 6) return true;
      if (c === 7) return false;
      return nome === "Giulia";
    }, {
      prima: async function (v, ctx) {
        if (!v.spar) return;
        if (v.spar.ids.slice().sort().join() !== ["host", idDi(C, "Giulia")].sort().join()) no("lo spareggio è tra " + JSON.stringify(v.spar.ids));
        if (!linLuca) linLuca = titoli(v.lin[idDi(C, "Luca")]);
        else if (titoli(v.lin[idDi(C, "Luca")]) !== linLuca) no("durante lo spareggio la linea di Luca è cambiata");
        // la carta di Luca durante lo spareggio non vale
        if (!fatto.ignorata) {
          manda("Luca", C, { t: "posa", gap: 0 }); await W.dorme(500);
          if ((vm(C).hannoScelto || []).indexOf(idDi(C, "Luca")) >= 0) no("durante lo spareggio Luca ha potuto mettere la carta");
          fatto.ignorata = true;
        }
        // Luca guarda: la fila coi due dello spareggio
        if (!await W.aspetta(function () { return chipSpia(L).length === 2; }, 12000)) no("durante lo spareggio Luca non vede la fila coi due avatar («" + T(L).slice(-200) + "»)");
        if (!/spareggio/i.test(T(L))) no("Luca non legge «spareggio» («" + T(L).slice(-200) + "»)");
        // tocca Paky (la sua linea), poi Giulia (la sua linea, niente carta: non ha ancora scelto)
        var idG = idDi(C, "Giulia");
        chipSpia(L).filter(function (b) { return b.getAttribute("data-id") === "host"; })[0].click();
        if (!await W.aspetta(function () { return lineaVista(L) === titoli(v.lin.host); }, 4000)) no("toccato Paky, Luca vede «" + lineaVista(L) + "» invece di «" + titoli(v.lin.host) + "»");
        chipSpia(L).filter(function (b) { return b.getAttribute("data-id") === idG; })[0].click();
        if (!await W.aspetta(function () { return lineaVista(L) === titoli(v.lin[idG]) && !tentVisto(L); }, 4000)) no("toccata Giulia, Luca vede «" + lineaVista(L) + "» " + JSON.stringify(tentVisto(L)));
      },
      // Giulia ha scelto: Luca, che la guarda, vede dove l'ha messa (Paky, che gioca, no)
      mossa: async function (v, ctx, id) {
        if (!v.spar || id !== idDi(C, "Giulia")) return;
        var gap = ctx.piani[id].gap;
        if (!await W.aspetta(function () { var tv = tentVisto(L); return tv && /Giulia/.test(tv.chi) && tv.posto === gap; }, 6000)) no("Giulia ha scelto il posto " + gap + " ma Luca vede " + JSON.stringify(tentVisto(L)));
        var tP = P.document.querySelector(".st-sch-in .tl-ev.tent .chi");
        if (tP && /Giulia/.test(tP.textContent)) no("Paky, che gioca lo spareggio, vede dove l'ha messa Giulia");
        if (!fatto.guarda) {
          var m = await misure(L, "Luca"); if (m) no("Luca che guarda lo spareggio: " + m);
          // Luca ricarica la pagina: ritrova la fila e, toccata Giulia, dove l'ha messa (lo chiede all'host: «spiami»)
          L = await W.ricarica("Luca");
          if (!await W.aspetta(function () { return chipSpia(L).length === 2; }, 15000)) no("dopo la ricarica Luca non ritrova la fila («" + T(L).slice(-200) + "»)");
          chipSpia(L).filter(function (b) { return b.getAttribute("data-id") === id; })[0].click();
          if (!await W.aspetta(function () { var tv = tentVisto(L); return tv && /Giulia/.test(tv.chi) && tv.posto === gap; }, 8000)) no("dopo la ricarica Luca non vede dove l'ha messa Giulia (" + JSON.stringify(tentVisto(L)) + ")");
        }
        fatto.guarda = true;
      },
      esito: async function (v, ctx) {
        var es = v.esitoL;
        if (es.spar && es.spar.tipo === "inizia" && !await W.aspetta(function () { return /Spareggio/.test(T(L)); }, 15000)) no("all'inizio dello spareggio Luca non legge «⚔️ Spareggio!»");
        if (es.spar && es.spar.tipo === "ancora") note.push("ancora (" + (es.spar.tutti ? "tutti giusti" : "tutti sbagliati") + ")");
      }
    });
    if (!fatto.ignorata) no("lo spareggio non c'è mai stato · " + ctx.storia.join(" "));
    if (!fatto.guarda) no("Luca non ha mai visto dove l'ha messa Giulia · " + ctx.storia.join(" "));
    if (note.length !== 2) no("gli «ancora» dello spareggio sono " + note.length + " · " + ctx.storia.join(" "));
    if (!ctx.spie) no("il messaggio «spia» per Luca non è mai partito");
    var r = risultatoDi(P);
    if (!r || posDi(r, "Giulia") !== 1 || posDi(r, "Paky") !== 2 || posDi(r, "Luca") !== 3) no("t.risultato dice " + JSON.stringify(r));
    return ctx.carte + " carte: " + ctx.storia.join(" ") + "; " + note.join(", ") + "; Luca guarda lo spareggio (spia mandata " + ctx.spie + " volte, mai a chi gioca); risultato " + r.map(function (x) { return x.nome + " " + x.pos + "°"; }).join(", ");
  } });

  COPIONE.aggiungi("tp14b", { nome: "Linea del tempo online in 4, «Ognuno la sua linea» a 5 carte: lo spareggio a due finisce e gli altri continuano fino al terzo posto", fai: async function () {
    var Z = await stanzaLinee(["Paky", "Giulia", "Luca", "Bea"], 5), C = Z.C, P = Z.P, B = W.finestra("Bea"), fatto = { beaGuarda: false, pakyGuarda: false };
    // Paky e Giulia sempre giuste (spareggio alla 5, la 6 la vince Paky); Luca sbaglia la 1 e la 2 (alla 5 ne ha 3), Bea sbaglia sempre
    var ctx = await partitaLinee(C, ["Paky", "Giulia", "Luca", "Bea"], 5, function (nome, c) {
      if (nome === "Bea") return false;
      if (nome === "Luca") return c > 2;
      if (c <= 5) return true;
      return nome === "Paky";
    }, {
      prima: async function (v) {
        var idL = idDi(C, "Luca");
        if (v.spar) {   // durante lo spareggio Bea e Luca guardano (non giocano)
          if (!await W.aspetta(function () { return chipSpia(B).length === 2; }, 12000)) no("durante lo spareggio Bea non vede la fila coi due avatar");
          fatto.beaGuarda = true;
        } else if (v.giocatori.some(function (g) { return g.id === "host" && g.fin; })) {   // dopo lo spareggio: Paky ha finito e guarda Luca e Bea
          if (!await W.aspetta(function () { return chipSpia(P).length === 2 && chipSpia(P).some(function (b) { return b.getAttribute("data-id") === idL; }); }, 12000)) no("dopo lo spareggio Paky non guarda Luca e Bea");
          fatto.pakyGuarda = true;
        }
      }
    });
    if (!fatto.beaGuarda || !fatto.pakyGuarda) no("non è successo tutto: " + JSON.stringify(fatto) + " · " + ctx.storia.join(" "));
    var r = risultatoDi(P);
    if (!r || posDi(r, "Paky") !== 1 || posDi(r, "Giulia") !== 2 || posDi(r, "Luca") !== 3 || posDi(r, "Bea") !== 4) no("t.risultato dice " + JSON.stringify(r));
    return ctx.carte + " carte: " + ctx.storia.join(" ") + "; risultato " + r.map(function (x) { return x.nome + " " + x.pos + "°"; }).join(", ");
  } });

  COPIONE.aggiungi("tp14c", { nome: "Linea del tempo online in 3, «Ognuno la sua linea» a 5 carte: spareggio a tre, chi sbaglia esce (arriva terzo) e guarda gli altri due", fai: async function () {
    var Z = await stanzaLinee(["Paky", "Giulia", "Luca"], 5), C = Z.C, P = Z.P, L = W.finestra("Luca"), fatto = { fuori: false, guarda: false };
    // tutti giusti fino a 5 (spareggio a tre); la 6 sbagliata da tutti (ancora); la 7 Luca sbaglia (fuori, terzo); la 8 vince Paky
    var ctx = await partitaLinee(C, ["Paky", "Giulia", "Luca"], 5, function (nome, c) {
      if (c <= 5) return true;
      if (c === 6) return false;
      if (c === 7) return nome !== "Luca";
      return nome === "Paky";
    }, {
      prima: async function (v) {
        if (v.spar && v.spar.ids.length === 2) {   // Luca è uscito dallo spareggio (terzo): guarda Paky e Giulia
          if (!await W.aspetta(function () { return chipSpia(L).length === 2; }, 12000)) no("uscito dallo spareggio, Luca non guarda gli altri due");
          if (!/Hai finito/.test(T(L))) no("Luca non legge «Hai finito»");
          fatto.guarda = true;
        }
      },
      esito: async function (v) { if (v.esitoL.spar && v.esitoL.spar.tipo === "fuori") { fatto.fuori = true; if (!await W.aspetta(function () { return /fuori dallo spareggio/.test(T(W.finestra("Giulia"))); }, 15000)) no("Giulia non legge «… fuori dallo spareggio»"); } }
    });
    if (!fatto.fuori || !fatto.guarda) no("non è successo tutto: " + JSON.stringify(fatto) + " · " + ctx.storia.join(" "));
    var r = risultatoDi(P);
    if (!r || posDi(r, "Paky") !== 1 || posDi(r, "Giulia") !== 2 || posDi(r, "Luca") !== 3) no("t.risultato dice " + JSON.stringify(r));
    return ctx.carte + " carte: " + ctx.storia.join(" ") + "; risultato " + r.map(function (x) { return x.nome + " " + x.pos + "°"; }).join(", ");
  } });

  COPIONE.aggiungi("tp15", { nome: "Linea del tempo sullo stesso telefono in 2, «Ognuno la sua linea» a 5 carte: il telefono passa di mano, ognuno vede solo la sua linea, fino al vincitore", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), note = [];
    await localeTl(P, ["Paky", "Giulia"], false, { prima: async function () {
      var d = P.document;
      if (!d.querySelector(".tl-linee-chips")) no("nelle impostazioni non c'è «🎲 Che partita?»");
      var att = d.querySelector(".tl-linee-chips .modo-chip.attiva"); if (!att || !/Una linea per tutti/.test(att.textContent)) no("di partenza non è «Una linea per tutti»");
      if (!visibile(d.querySelector(".tl-ric-btn"))) no("col modo di sempre non si vede «📸 I nostri ricordi»");
      chipIn(d, /Ognuno la sua linea/); await W.dorme(100);
      if (visibile(d.querySelector(".tl-ric-btn")) || visibile(d.querySelector(".stepper"))) no("col modo nuovo si vedono ancora i ricordi o il − / + delle carte");
      if (/Rubare la carta|Dimmi l'anno/.test(T(P))) no("col modo nuovo si legge ancora «Rubare la carta» o «Dimmi l'anno»");
      var sl = d.querySelector(".tl-vinci .sl"); if (!sl || !visibile(sl)) no("non c'è la lineetta delle carte per vincere");
      sl.value = "5"; sl.dispatchEvent(new P.Event("input", { bubbles: true })); await W.dorme(80);
      if (d.querySelector(".tl-vinci .n").textContent !== "5") no("la lineetta a 5 dice " + d.querySelector(".tl-vinci .n").textContent);
    } });
    function stato() { var s = P.document.querySelector(".st-sch-in .tl-stato"); return s ? s.textContent : ""; }
    // le linee come le vede chi gioca: la prima volta è la carta di partenza, poi cresce solo coi ✅
    var lin = {}, partenza = {}, carte = 0, kOld = "", chi = null, mosse = 0, fino = Date.now() + 360000, misurato = false;
    // (i tasti della barra accesa: quella spenta tiene ancora il tasto di prima)
    function tastoOn(re) { return [].filter.call(P.document.querySelectorAll(".st-barra.on button"), function (b) { return re.test(b.textContent) && !b.disabled; })[0] || null; }
    while (Date.now() < fino) {
      if (/Classifica finale/.test(T(P))) break;
      var bS = tastoOn(/📱 Sono /);
      if (bS) {
        // tra un giocatore e l'altro il maxischermo non mostra la linea di chi ha appena scelto
        if (P.document.querySelector(".st-sch-in .tl-asse")) no("mentre il telefono passa («" + bS.textContent + "») si vede ancora una linea");
        bS.click(); await W.dorme(300); continue;
      }
      var bP = tastoOn(/Prossima carta|La classifica/);
      if (bP) { bP.click(); await W.dorme(300); continue; }
      var mT = /Tocca a te, (\S+)!/.exec(stato()), mano = P.document.querySelector(".st-sch-in .tl-mano .tit"), slots = P.document.querySelectorAll(".st-sch-in .tl-slot");
      if (mT && mano && slots.length && P.document.querySelector(".tl-conferma") && kOld !== mano.textContent + "|" + mT[1]) {
        chi = mT[1]; kOld = mano.textContent + "|" + chi;
        var tit = mano.textContent, vista = lineaVista(P), Y = annoDi(P, tit);
        if (!lin[chi]) { lin[chi] = vista.split(" | "); partenza[chi] = lin[chi][0]; if (lin[chi].length !== 1) no(chi + " parte con " + lin[chi].length + " carte"); }
        else if (vista.split(" | ").sort().join(" | ") !== lin[chi].slice().sort().join(" | ")) no(chi + " vede la linea «" + vista + "» invece di «" + lin[chi].join(" | ") + "»");
        // la carta di partenza dell'altro non c'è nella mia linea
        Object.keys(partenza).forEach(function (n) { if (n !== chi && vista.split(" | ").indexOf(partenza[n]) >= 0) no(chi + " vede nella sua linea la carta di partenza di " + n); });
        if (Object.keys(partenza).length === 2 && partenza.Paky === partenza.Giulia) no("la carta di partenza è la stessa per tutti e due");
        if (!/Nella tua linea: \d+ su 5|Spareggio/.test(stato())) no("sotto «Tocca a te» non c'è «Nella tua linea: … su 5» («" + stato() + "»)");
        var anni = [].map.call(P.document.querySelectorAll(".st-sch-in .tl-asse > .tl-ev .anno"), function (a) { var t2 = a.textContent; return /a\.C\./.test(t2) ? -parseInt(t2, 10) : parseInt(t2, 10); });
        var l2 = anni.map(function (a) { return { anno: a }; }), ok = gapOk(l2, Y), ko = gapKo(l2, Y);
        // Paky sempre giusta; Giulia sbaglia la seconda e la quarta carta
        if (chi === "Paky") carte++;
        var giusta = chi === "Paky" || !(carte === 2 || carte === 4) || ko < 0;
        slots[giusta ? ok : ko].click(); await W.dorme(120);
        if (!misurato) { misurato = true; var m = await misure(P, "Paky"); if (m) no("mentre sceglie: " + m); }
        if (!W.clicca(P, /Mettila qui/, ".tl-conferma")) no("non riesco a confermare");
        mosse++;
        if (giusta) lin[chi].push(tit);
        // quando hanno scelto tutti e due: il risultato per tutti
        if (chi === "Giulia") {
          var esN = function () { var e = P.document.querySelector(".st-sch-in .tl-esito"); return e ? e.textContent : ""; };
          if (!await W.aspetta(function () { return tastoOn(/Prossima carta|La classifica/) && esN().indexOf(annoTx(Y)) >= 0; }, 30000)) no("dopo le due scelte non si vede il risultato con l'anno («" + T(P).slice(0, 200) + "»)");
          var tx = esN();
          if (!/Paky/.test(tx) || !/Giulia/.test(tx) || !/\d\/5/.test(tx)) no("nel risultato non ci sono tutti e due con le carte («" + tx.slice(0, 200) + "»)");
          note.push(carte + ":" + (giusta ? "✅" : "❌"));
        }
        continue;
      }
      await W.dorme(200);
    }
    if (!/Classifica finale/.test(T(P))) no("la partita non finisce («" + T(P).slice(0, 160) + "»)");
    if (carte !== 5) no("le carte giocate sono " + carte + " (Paky deve arrivare a 5 alla quinta)");
    var p1 = P.document.querySelector(".tl-gradino.p1 .nm"), pt1 = P.document.querySelector(".tl-gradino.p1 .pt");
    if (!p1 || p1.textContent !== "Paky") no("sul podio il primo è " + (p1 && p1.textContent));
    if (!pt1 || !/5 carte/.test(pt1.textContent)) no("sotto il primo c'è «" + (pt1 && pt1.textContent) + "» invece di «🏁 5 carte»");
    senzaErrori();
    return carte + " carte, " + mosse + " scelte (Giulia: " + note.join(" ") + "); linee viste: Paky " + lin.Paky.length + ", Giulia " + lin.Giulia.length + "; Paky vince";
  } });

  COPIONE.aggiungi("tp16", { nome: "Linea del tempo online in 3, «Ognuno la sua linea» a 5 carte: l'host ricarica a metà carta e sul risultato, la partita riprende con le stesse linee", fai: async function () {
    var Z = await stanzaLinee(["Paky", "Giulia", "Luca"], 5), C = Z.C, note = [], fatto = { carta: false, esito: false };
    function copia(v) { return { lin: JSON.stringify(v.lin), ok: v.giocatori.map(function (g) { return g.id + ":" + g.ok + ":" + g.fin; }).join(","), giro: v.giro }; }
    var ctx = await partitaLinee(C, ["Paky", "Giulia", "Luca"], 5, function (nome, c) {
      if (nome === "Paky") return c !== 1;
      if (nome === "Giulia") return c % 2 === 0;
      return c === 2;
    }, {
      prima: async function (v) {
        if (fatto.carta || v.giro !== 3) return;
        // a metà carta (Giulia ha già scelto): l'host ricarica. La stessa carta si rigioca da capo, le linee restano
        manda("Giulia", C, { t: "posa", gap: 0 }); await W.dorme(400);
        var prima = copia(v), tit = v.carta.titolo;
        await W.ricarica("Paky");
        if (!await W.aspetta(function () { return vm(C).fase === "ripresa"; }, 15000)) no("dopo la ricarica niente «Partita ripresa» (fase " + vm(C).fase + ")");
        if (!await W.aspetta(function () { return vm(C).fase === "lp"; }, 20000)) no("dopo la ripresa la carta non riparte");
        var dopo = copia(vm(C));
        if (dopo.lin !== prima.lin) no("dopo la ripresa le linee sono cambiate");
        if (dopo.ok !== prima.ok) no("dopo la ripresa le carte messe bene sono cambiate (" + dopo.ok + " invece di " + prima.ok + ")");
        if (vm(C).carta.titolo !== tit) no("dopo la ripresa la carta è un'altra");
        if ((vm(C).hannoScelto || []).length) no("dopo la ripresa le scelte non sono azzerate");
        if (vm(C).giro !== prima.giro) no("dopo la ripresa la carta è la " + vm(C).giro + " invece della " + prima.giro);
        if (!await W.aspetta(function () { return /Partita ripresa|Carta 3/.test(T(W.finestra("Giulia"))); }, 8000)) note.push("(Giulia non ha letto «Partita ripresa»)");
        fatto.carta = true; note.push("ricarica a metà carta: stesse linee, stessa carta");
        return "rifai";
      },
      esito: async function (v) {
        if (fatto.esito || v.esitoL.giro !== 4) return;
        // sul risultato: l'host ricarica, poi si va alla carta dopo con le linee nuove
        var prima = copia(v);
        await W.ricarica("Paky");
        if (!await W.aspetta(function () { return vm(C).fase === "lp" && vm(C).giro === 5; }, 25000)) no("dopo la ricarica sul risultato non arriva la carta 5 (fase " + vm(C).fase + ", carta " + vm(C).giro + ")");
        var dopo = copia(vm(C));
        if (dopo.lin !== prima.lin || dopo.ok !== prima.ok) no("dopo la ricarica sul risultato le linee o le carte sono cambiate");
        fatto.esito = true; note.push("ricarica sul risultato: si riparte dalla carta dopo");
        return "rifai";
      }
    });
    if (!fatto.carta || !fatto.esito) no("non è successo tutto: " + JSON.stringify(fatto) + " · " + ctx.storia.join(" "));
    return ctx.carte + " carte: " + ctx.storia.join(" ") + "; " + note.join("; ");
  } });

  // tp16b: l'host di riserva. 4 telefoni (stanza di un gioco solo), «Ognuno la sua linea» a 5 carte; alla carta 2 il telefono di
  // Paky si spegne e non torna: entro 8 s la partita la tiene Giulia, con le stesse linee e la stessa carta; si gioca fino alla
  // classifica (Paky, sparito, non si aspetta). Usa la spia di passo5/riserva.js (w.__imp = le regole, w.__cbH = la stanza tenuta)
  COPIONE.aggiungi("tp16b", { nome: "Linea del tempo online in 4, «Ognuno la sua linea»: l'host si spegne, Giulia porta avanti la partita con le stesse linee fino alla classifica", fai: async function () {
    await COPIONE.carica("passo5/riserva.js");
    var nomi = ["Paky", "Giulia", "Luca", "Sara"], ids = { Paky: "host" }, vivi = nomi.slice(), note = [];
    var P = await W.apriTel("Paky", { x: 0, spiaR: true, prima: function (w) { w.__imp = { linee: true, vinci: 5 }; } });
    var C = await W.apriStanza(P, "La linea del tempo");
    for (var i = 1; i < nomi.length; i++) {
      await W.apriTel(nomi[i], { hash: "gioco=timeline&stanza=" + C, x: 185 * i, spiaR: true });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === i + 1; }, 10000)) no(nomi[i] + " non entra in saletta");
      ids[nomi[i]] = idDi(C, nomi[i]); await W.dorme(300);
    }
    function chi() { var c = A.chiTiene(C), h = c.h || "host"; return Object.keys(ids).filter(function (n) { return ids[n] === h; })[0] || "Paky"; }
    function mossa(nome, msg) {
      if (vivi.indexOf(nome) < 0) return;
      msg.n = vm(C).n;
      if (nome === chi()) { var w = W.finestra(nome), cb = w && w.__cbH && w.__cbH.timeline; if (cb) cb.onMsg(ids[nome], JSON.parse(JSON.stringify(msg))); return; }
      var h = W.reteDi(nome); if (h) h.invia(msg);
    }
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "lp" && vm(C).linee; }, 40000)) no("la prima carta non arriva (fase " + vm(C).fase + ", linee " + vm(C).linee + ")");
    // Giulia sempre giusta, Luca sbaglia la prima, Sara giusta dalla terza (Paky sparisce alla seconda)
    function piano(nome, giro) { return nome === "Giulia" || nome === "Paky" || (nome === "Luca" ? giro > 1 : giro > 2); }
    var kV = "", fatto = false, fino = Date.now() + 420000, carte = 0, storia = [];
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n;
      if (k === kV) { await W.dorme(200); continue; }
      kV = k;
      if (v.fase === "lp") {
        if (v.giro === 2 && !fatto) {
          // ---- Paky si spegne e non torna ----
          await W.dorme(1600);   // (la copia ai vice: al massimo una al secondo)
          var prima = JSON.stringify(v.lin), ok0 = v.giocatori.map(function (g) { return g.id + ":" + g.ok; }).join(","), tit = v.carta.titolo, t0 = Date.now();
          A.muore("Paky"); vivi = nomi.slice(1);
          if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === ids.Giulia; }, 8000)) no("dopo 8 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ", fase " + vm(C).fase + ")");
          note.push("Giulia tiene la partita in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
          if (!await W.aspetta(function () { return vm(C).fase === "lp" && vm(C).linee; }, 20000)) no("con Giulia la carta non riparte (fase " + vm(C).fase + ")");
          if (JSON.stringify(vm(C).lin) !== prima) no("con Giulia le linee sono cambiate");
          if (vm(C).giocatori.map(function (g) { return g.id + ":" + g.ok; }).join(",") !== ok0) no("con Giulia le carte messe bene sono cambiate");
          if (vm(C).carta.titolo !== tit) no("con Giulia la carta è un'altra");
          if (vm(C).vinci !== 5) no("con Giulia le carte per vincere sono " + vm(C).vinci);
          fatto = true; kV = ""; continue;
        }
        carte++;
        var Y = annoDi(W.finestra("Giulia"), v.carta.titolo);
        v.giocatori.forEach(function (g) {
          if (g.fin || (v.spar && v.spar.ids.indexOf(g.id) < 0)) return;
          var lin = v.lin[g.id] || [], ko = gapKo(lin, Y), giusta = piano(g.nome, v.giro) || ko < 0;
          mossa(g.nome, { t: "posa", gap: giusta ? gapOk(lin, Y) : ko });
        });
        continue;
      }
      if (v.fase === "lEsito") {
        storia.push(v.giro + ":" + v.esitoL.risultati.map(function (r) { return nomeDi(C, r.id).slice(0, 1) + (r.giusto ? "✅" : r.scelto ? "❌" : "⏰"); }).join(""));
        await W.dorme(1500);
        v.esitoL.risultati.forEach(function (r) { var n = nomeDi(C, r.id); if (n) mossa(n, { t: "avanti" }); });
        continue;
      }
      if (v.fase === "attesa") { var wT = W.finestra(chi()); if (wT) W.clicca(wT, /Finisci qui la partita/); }
      await W.dorme(200);
    }
    if (!fatto) no("Paky non si è mai spento · " + storia.join(" "));
    if (vm(C).fase !== "fine") no("la partita tenuta da Giulia non finisce (fase " + vm(C).fase + ") · " + storia.join(" "));
    var cl = vm(C).classifica || [], pos = {}; cl.forEach(function (r) { pos[r.nome] = r.pos; });
    if (pos.Giulia !== 1 || pos.Luca !== 2 || pos.Sara !== 3 || pos.Paky !== 4) no("la classifica è " + JSON.stringify(pos) + " · " + storia.join(" "));
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== ids.Giulia) no("alla fine la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    if (!await W.aspetta(function () { return /Nuova partita|Rivincita/.test(T(W.finestra("Giulia"))); }, 25000)) no("Giulia non vede la classifica coi tasti dell'host");
    senzaErrori();
    return note.join("; ") + "; " + storia.join(" ") + "; classifica " + cl.map(function (r) { return r.nome + " " + r.pos + "° (" + r.punti + ")"; }).join(", ");
  } });
})();
