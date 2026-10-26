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
})();
