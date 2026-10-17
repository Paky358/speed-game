// PROVE della Linea del tempo "preferita" (16 ott 2026): anno svelato quando si sbaglia («Sbagliato di 12 anni!» e
// «📍 Andava qui»), posti con gli anni («Tra il 1982 e il 1994»), carte già viste che non tornano, «✨ Decide il gioco»
// (da 5 in su ⚡ tutti insieme), risultato più corto e «⏩ Avanti» di tutti, 🔥 ultima carta doppia anche a turno,
// «📅 Dimmi l'anno», «✋ Rubala con l'anno» (regola spenta di partenza, 2 gettoni), «📸 I nostri ricordi».
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/timeline.js"); window.__run = COPIONE.prova("tp1")
// Gli scenari durano 2-5 minuti: lanciali senza aspettarli e poi leggi COPIONE.esiti (o await window.__run).
//
// tp1: Sala in 3 a turno, 3 carte a testa, «✋ Rubala» accesa dal ⚙️ (la riga «📜 Si gioca così» lo dice). Ogni turno
//      controllato col conto dei punti fatto a parte: l'host piazza dal suo telefono (posto con gli anni, l'anno scritto
//      nel selettore: esatto +100), sbaglia apposta (carta girata con l'anno vero, «Sbagliato di…», «Andava qui»), ruba
//      dal suo telefono con l'anno esatto; gli amici rubano giusto (la carta entra nella linea per chi ruba) e sbagliato
//      (−1 gettone), l'anno esatto al proprio turno ridà un gettone; l'ultima carta di ognuno vale doppio; nella foto mai
//      l'anno della carta, mai gli anni detti né quelli dei furti prima del risultato; misure 360x640 e 412x915 col
//      selettore dell'anno e con «✋ Rubala» aperto; classifica finale = conto a parte.
// tp2: Sala in 5 senza toccare le regole: si parte «⚡ Tutti insieme» con 10 carte (5 a testa → 10 in tutto). «📸 I nostri
//      ricordi»: 2 di Giulia dal profilo, 1 scritto da Luca nel foglio della saletta (anche a 360x640); nella foto solo
//      quanti e di chi; i ricordi escono tutti nelle 10 carte, chi l'ha scritto non lo gioca («È un tuo ricordo»); il bonus
//      dell'anno va solo al più vicino; «⏩ Avanti» parte subito solo quando lo toccano tutti; senza tocchi il risultato
//      dura circa 15 s (in 5: 9 s di rivelazione + 5,5 da leggere + 1 per gli anni); misure; classifica = conto a parte.
// tp3: Sullo stesso telefono in 2, 3 carte a testa: ricordi scritti dal ⚙️, posti con gli anni, selettore dell'anno,
//      carta sbagliata girata con l'anno; poi «Rigioca»: nessuna carta della prima partita torna nella seconda.
// tp4: A turno in 3 con «✋ Rubala» (stanza di un gioco solo): Giulia ruba e ricarica la pagina (ritrova il voto fatto), l'host ricarica
//      durante il voto (stessa carta rigiocata, furti azzerati, gettoni salvi), un amico arriva a partita cominciata e guarda
//      (niente tasti per votare), tempo scaduto (carta girata con l'anno), fino alla fine senza errori.
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
    await regola(P, async function (f) { chipIn(f, /^✋?\s*Accesa/); });
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
        manda("Giulia", C, { t: "voto", d: true });
        await W.aspetta(function () { return P.document.querySelector(".st-sch-in .tl-esito"); }, 15000); await W.dorme(1200); P.setTimeout = function () { return 0; }; return C;   // (la regia si ferma lì: la foto resta)
      }
      if (v.fase === "votazione" && v.turnoId !== "host" && cosa === "ruba") {
        if (await W.aspetta(function () { return W.clicca(P, /Rubala con l'anno/); }, 12000)) { grande(); await W.dorme(500); return C; }
      }
      if (v.fase === "votazione" && v.turnoId === "host") manda("Giulia", C, { t: "voto", d: true });
      if (v.fase === "esito") W.clicca(P, /Avanti/, ".st-barra button");
      await W.dorme(300);
    }
    return C;
  };

  // =================== tp1: a turno con Rubala e l'anno ===================
  COPIONE.aggiungi("tp1", { nome: "Linea del tempo a turno in 3: anno svelato, posti con gli anni, Dimmi l'anno, ✋ Rubala, ultima carta doppia", fai: async function () {
    var Z = await sala("La linea del tempo", ["Giulia", "Luca"]);
    var C = await A.lanciaDallaSala("Paky", Z.S, "La linea del tempo"), P = W.finestra("Paky"), G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    if (!await W.aspetta(function () { return /da 5 in su ⚡ tutti insieme/.test(A.regoleDi(G)); }, 6000)) no("di partenza Giulia legge «" + A.regoleDi(G) + "» (manca «da 5 in su ⚡ tutti insieme»)");
    if (/Rubala/.test(A.regoleDi(G))) no("«✋ Rubala» è accesa di partenza");
    if (vm(C).insieme) no("in 3 la saletta dice «insieme»");
    await regola(P, async function (f) {
      var att = [].filter.call(f.querySelectorAll(".modo-chip.attiva"), function (x) { return /Decide il gioco/.test(x.textContent); });
      if (!att.length) no("nel ⚙️ «✨ Decide il gioco» non è la scelta di partenza");
      chipIn(f, /^✋?\s*Accesa/);
      var meno = f.querySelector(".stepper button"); meno.click(); meno.click();
    });
    if (!await W.aspetta(function () { return /3 carte a testa/.test(A.regoleDi(G)) && /✋ Rubala/.test(A.regoleDi(G)) && /📅 l'anno/.test(A.regoleDi(G)); }, 5000)) no("Giulia legge «" + A.regoleDi(G) + "»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var punti = {}, visti = {}, note = [], kVisto = "", turni = 0, misurato = { scelta: false, ruba: false, esito: false };
    var turnoDi = {}, piano = null, fino = Date.now() + 420000;
    var gL = idDi(C, "Luca"), gett = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n;
      if (k === kVisto) { await W.dorme(200); continue; }
      kVisto = k;
      var js = JSON.stringify(v);
      if (v.insieme) no("la foto dice «insieme»");
      if (v.fase === "turno") {
        var chi = v.turnoId, nChi = v.turnoNome, Y = annoDi(P, v.carta.titolo);
        if (Y == null) no("non trovo l'anno di «" + v.carta.titolo + "»");
        if (/"anno":\s*-?\d+,\s*"titolo":\s*"[^"]*",\s*"cat"/.test(JSON.stringify(v.carta)) || v.carta.anno != null) no("nella foto c'è l'anno della carta in gioco");
        turnoDi[chi] = (turnoDi[chi] || 0) + 1;
        var giro = turnoDi[chi], g0 = gDi(C, chi);
        if (!!v.doppio !== (g0.restano === 1)) no("turno " + nChi + " " + giro + ": doppio = " + v.doppio + " con " + g0.restano + " carte");
        var ok = gapOk(v.linea, Y), ko = gapKo(v.linea, Y);
        piano = { chi: chi, Y: Y, linea: v.linea.slice(), n: v.n, giro: giro };
        if (chi === "host") {
          // Paky dal suo telefono: giro 1 giusto con l'anno esatto, giro 2 sbagliato apposta, giro 3 giusto senza anno
          var sbaglia = giro === 2 && ko >= 0;
          var gap = sbaglia ? ko : ok;
          if (!await W.aspetta(function () { return P.document.querySelectorAll(".tl-slot").length === v.linea.length + 1; }, 12000)) no("Paky non vede i posti");
          var lab = P.document.querySelectorAll(".tl-slot .lab")[gap].textContent;
          if (lab !== etAttesa(v.linea, gap)) no("il posto " + gap + " dice «" + lab + "» invece di «" + etAttesa(v.linea, gap) + "»");
          var selA = P.document.querySelector(".st-barra .tl-anno");
          if (!selA || !selA.classList.contains("spento")) no("il selettore dell'anno non è spento prima di scegliere il posto");
          P.document.querySelectorAll(".tl-slot")[gap].click(); await W.dorme(200);
          if (P.document.querySelector(".st-barra .tl-anno.spento")) no("dopo il posto il selettore dell'anno resta spento");
          if (giro === 1) {
            if (!scriviAnno(P, Y)) no("non trovo la casella dell'anno");
            await W.dorme(150);
            var cf = P.document.querySelector(".tl-conferma");
            if (!cf || cf.textContent.indexOf(annoTx(Y)) < 0) no("il tasto dice «" + (cf && cf.textContent) + "» invece dell'anno " + annoTx(Y));
            if (!misurato.scelta) { var m1 = await misure(P, "Paky"); if (m1) no(m1); misurato.scelta = true; }
          }
          piano.anno = giro === 1 ? Y : null; piano.giusto = !sbaglia;
          if (!W.clicca(P, /Mettila qui/, ".tl-conferma")) no("Paky non riesce a confermare");
        } else {
          // Giulia: giro 1 sbagliato (Luca ruba con l'anno esatto), giro 2 giusto con l'anno +1, giro 3 sbagliato (Paky ruba dal telefono, Luca sbaglia l'anno)
          // Luca: giro 1 giusto senza anno, giro 2 sbagliato (nessuno ruba), giro 3 giusto con l'anno esatto (gettone indietro)
          var nome = nomeDi(C, chi), sb, an = null;
          if (nome === "Giulia") { sb = giro !== 2; an = giro === 2 ? Y + 1 : null; }
          else { sb = giro === 2; an = giro === 3 ? Y : null; }
          if (sb && ko < 0) sb = false;
          piano.giusto = !sb; piano.anno = an;
          manda(nome, C, { t: "scelta", gap: sb ? ko : ok, anno: an });
        }
        await W.dorme(300);
        continue;
      }
      if (v.fase === "votazione" && piano && piano.n === v.n) {
        if (/"(annoDetto|detto|ruba|mosse)"\s*:/.test(js)) no("nella foto ci sono anni segreti (" + js.match(/"(annoDetto|detto|ruba|mosse)"\s*:[^,]*/)[0] + ")");
        var tur = nomeDi(C, piano.chi);
        // i voti degli amici
        ["Giulia", "Luca"].forEach(function (n) {
          if (n === tur) return;
          var m = { t: "voto", d: piano.giusto };
          if (tur === "Giulia" && n === "Luca" && piano.giro === 1) { m = { t: "voto", d: false, ruba: piano.Y }; piano.ladro = "Luca"; }
          if (tur === "Giulia" && n === "Luca" && piano.giro === 3) { m = { t: "voto", d: false, ruba: piano.Y + 7 }; }
          if (tur === "Luca" && piano.giro === 2) m = { t: "voto", d: true };   // Giulia sbaglia il voto
          manda(n, C, m);
        });
        if (tur !== "Paky") {
          // Paky vota dal telefono; al terzo turno di Giulia ruba con l'anno esatto
          if (tur === "Giulia" && piano.giro === 3 && !piano.giusto) {
            if (!await W.aspetta(function () { return W.clicca(P, /Rubala con l'anno/); }, 12000)) no("Paky non trova «✋ Rubala con l'anno» («" + T(P).slice(-160) + "»)");
            await W.dorme(250);
            if (!/la carta è tua/.test(T(P))) no("aperto «Rubala» non spiega la regola");
            if (!misurato.ruba) { var m2 = await misure(P, "Paky"); if (m2) no("con «Rubala» aperto: " + m2); misurato.ruba = true; }
            if (!scriviAnno(P, piano.Y)) no("in «Rubala» non trovo la casella dell'anno");
            await W.dorme(150);
            if (!W.clicca(P, /✋ Rubala!/)) no("Paky non riesce a toccare «✋ Rubala!»");
            if (!piano.ladro) piano.ladro = "Paky";
            await W.dorme(600);
            var v2 = vm(C);
            if ((v2.rubano || []).indexOf("host") < 0 && v2.fase === "votazione") no("nella foto non si vede che Paky ruba");
            if (JSON.stringify(v2).indexOf(String(piano.Y)) >= 0 && v2.fase === "votazione") note.push("(l'anno " + piano.Y + " compare nella foto per caso: controlla)");
          } else if (!await W.aspetta(function () { return W.clicca(P, piano.giusto ? /👍 Giusto/ : /👎 No/); }, 12000)) no("Paky non riesce a votare");
        }
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
          var errA = errAtteso(piano.linea, gapKo(piano.linea, piano.Y), piano.Y);
          if (es.errore !== errA) no("sbagliato di " + es.errore + " anni, atteso " + errA);
          if (!es.prima && !es.dopo) no("manca «dove andava»");
        }
        if (piano.anno != null && es.giusto) {
          var bAtt = (piano.anno === piano.Y ? 100 : Math.abs(piano.anno - piano.Y) <= 2 ? 30 : 0) * molt;
          if (es.bonusAnno !== bAtt) no("bonus dell'anno " + es.bonusAnno + " invece di " + bAtt);
        }
        if (piano.ladro && !es.giusto) {
          if (es.ladro !== piano.ladro) no("la carta doveva rubarla " + piano.ladro + " (ladro: " + es.ladro + ")");
          if (!v.linea.some(function (x) { return x.titolo === es.titolo; })) no("la carta rubata non è entrata nella linea");
        }
        contaEsito(punti, v);
        visti[turni] = (es.giusto ? "✅" : "❌") + (es.ladro ? "✋" + es.ladro : "") + (es.bonusAnno ? "📅+" + es.bonusAnno : "") + (es.doppio ? "🔥" : "");
        // sul telefono di Giulia: la carta girata con l'anno vero e «Andava qui»
        if (!es.giusto && !es.ladro) {
          var re = es.errore <= 3 ? /Per un pelo/ : /Sbagliato di/;
          if (!await W.aspetta(function () { return re.test(T(G)) && /Andava qui/i.test(T(G)) && T(G).indexOf(annoTx(piano.Y)) >= 0; }, 9000)) no("Giulia non vede l'anno vero, «" + re.source + "» e «Andava qui» («" + T(G).slice(0, 200) + "»)");
          if (!misurato.esito) { var m3 = await misure(G, "Giulia"); if (m3) no("sul risultato sbagliato: " + m3); misurato.esito = true; }
        }
        if (es.ladro && !await W.aspetta(function () { return /Rubata da/.test(T(G)); }, 9000)) no("Giulia non legge «Rubata da»");
        // gettoni: −1 per ogni furto andato male, +1 (massimo 3) a chi dice l'anno esatto al suo turno
        (es.rubate || []).forEach(function (x) { if (x.esito === "perso") gett[x.id] = (gett[x.id] == null ? 2 : gett[x.id]) - 1; });
        if (es.giusto && es.detto === es.anno) gett[v.turnoId] = Math.min(3, (gett[v.turnoId] == null ? 2 : gett[v.turnoId]) + 1);
        (v.giocatori || []).forEach(function (g) { var att = gett[g.id] == null ? 2 : gett[g.id]; if (g.gettoni !== att) no(g.nome + " ha " + g.gettoni + " gettoni invece di " + att); });
        var gtL = (gDi(C, gL) || {}).gettoni;
        piano = null;
        // avanti: l'host tocca «Avanti» appena c'è
        await W.aspetta(function () { return W.clicca(P, /Avanti/, ".st-barra button"); }, 25000);
        note.push("Luca " + gtL + "🪙");
        continue;
      }
      await W.dorme(200);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ") · " + JSON.stringify(visti));
    if (turni !== 9) no("i turni sono " + turni);
    confrontaClassifica(C, punti);
    senzaErrori();
    return "9 turni " + Object.keys(visti).map(function (k) { return visti[k]; }).join(" ") + "; gettoni di Luca " + note.join(" ") +
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
  async function localeTl(P, nomi, conRicordo) {
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
        if (conRicordo) {
          if (!W.clicca(P, /I nostri ricordi/, ".tl-ric-btn")) no("nelle impostazioni non c'è «📸 I nostri ricordi»");
          await W.dorme(250);
          var f = P.document.querySelector(".tl-ric-velo"); if (!f) no("il foglio dei ricordi non si apre");
          f.querySelector(".tl-ric-form .t").value = "Il matrimonio di Ciro"; f.querySelector(".tl-ric-form .a").value = "2018";
          W.clicca(P, /➕/, ".tl-ric-form button"); await W.dorme(150);
          W.clicca(P, /Fatto/, ".tl-ric-velo button"); await W.dorme(200);
          if (!/1 tuo/.test(T(P))) no("dopo il ricordo il tasto non dice «1 tuo»");
        }
        var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Comincia|Gioca|Inizia|▶/.test(x.textContent) && !x.disabled; });
        if (!b) no("non trovo il tasto per cominciare"); b.click(); await W.dorme(400); return;
      }
      var b2 = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Pronti|▶/.test(x.textContent) && !x.disabled; });
      if (!b2) break; b2.click(); await W.dorme(400);
    }
  }
  async function partitaLocale(P, titoli) {
    var fino = Date.now() + 260000, turni = 0, sbagliate = 0, kOld = "";
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
        // il voto (tutti insieme: tocco l'avatar dell'altro una volta, poi ✅)
        if (await W.aspetta(function () { return P.document.querySelector(".tl-gv"); }, 3000)) { P.document.querySelector(".tl-gv").click(); await W.dorme(100); W.clicca(P, /Fatto|votato tutti/); }
        if (sbaglia) {
          sbagliate++;
          if (!await W.aspetta(function () { return /Sbagliato di|Per un pelo/.test(T(P)) && /Andava qui/i.test(T(P)) && T(P).indexOf(annoTx(Y)) >= 0; }, 10000)) no("sbagliata: non vedo l'anno vero e «Andava qui» («" + T(P).slice(0, 200) + "»)");
          if (sbagliate === 1) { var m = await misure(P, "Paky"); if (m) no("sul risultato sbagliato: " + m); }
        } else if (!await W.aspetta(function () { return /Esatto!/.test(T(P)) && /🎯/.test(T(P)); }, 10000)) no("giusta con l'anno esatto: non vedo «🎯 Esatto!» («" + T(P).slice(0, 200) + "»)");
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
  COPIONE.aggiungi("tp4", { nome: "Linea del tempo a turno con ✋ Rubala: chi ruba ricarica, l'host ricarica nel voto, chi guarda, tempo scaduto", fai: async function () {
    // (la stanza di un gioco solo, col link: in questo ramo la Sala riporta tutti nella Sala quando l'host ricarica)
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
    await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    await regola(P, async function (f) { chipIn(f, /^✋?\s*Accesa/); var meno = f.querySelector(".stepper button"); meno.click(); meno.click(); });
    if (!await W.aspetta(function () { return vm(C).rubala && vm(C).carte === 3; }, 5000)) no("le regole (✋ Rubala, 3 carte) non arrivano");
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
          // Giulia ruba (anno sbagliato) e ricarica la pagina: ritrova il voto fatto
          manda("Giulia", C, { t: "voto", d: false, ruba: Yv + 3 });
          await W.dorme(500);
          if ((vm(C).rubano || []).indexOf(idDi(C, "Giulia")) < 0) no("la foto non dice che Giulia ruba");
          var G = await W.ricarica("Giulia");
          if (!await W.aspetta(function () { return /Hai votato|Aspetta gli altri|provato a rubarla/.test(T(W.finestra("Giulia"))); }, 15000)) no("Giulia dopo la ricarica non ritrova il voto («" + T(W.finestra("Giulia")).slice(0, 160) + "»)");
          if (W.finestra("Giulia").document.querySelector(".tl-ruba")) no("dopo la ricarica Giulia può rubare di nuovo");
          fatto.ricaricaG = true; note.push("Giulia ricarica dopo il furto: voto ritrovato");
          void G;
        }
        if (fatto.ricaricaG && !fatto.ricaricaH && tur === "Giulia") {
          // l'host ricarica durante il voto, dopo che Luca ha rubato: la stessa carta si rigioca, furti azzerati, gettoni salvi
          var gtPrima = (gDi(C, idDi(C, "Giulia")) || {}).gettoni, tit = v.carta.titolo;
          manda("Luca", C, { t: "voto", d: false, ruba: Yv });
          await W.dorme(400);
          P = await W.ricarica("Paky");
          if (!await W.aspetta(function () { return vm(C).fase === "ripresa"; }, 15000)) no("dopo la ricarica dell'host niente «Partita ripresa»");
          if (!await W.aspetta(function () { return vm(C).fase === "turno"; }, 15000)) no("dopo la ripresa il turno non riparte");
          if (vm(C).carta.titolo !== tit) no("dopo la ripresa la carta è un'altra");
          if ((vm(C).rubano || []).length) no("dopo la ripresa i furti non sono azzerati");
          if ((gDi(C, idDi(C, "Giulia")) || {}).gettoni !== gtPrima) no("dopo la ripresa i gettoni di Giulia sono cambiati");
          fatto.ricaricaH = true; note.push("host ricarica nel voto: stessa carta, furti azzerati, gettoni " + gtPrima);
          kV = ""; continue;
        }
        if (fatto.ricaricaH && !fatto.guarda) {
          // un amico arriva a partita cominciata: guarda (niente tasti per votare)
          var N = await W.apriTel("Nino", { hash: "gioco=timeline&stanza=" + C, x: 555 });
          if (!await W.aspetta(function () { return /Stai guardando/.test(T(W.finestra("Nino"))); }, 15000)) no("Nino non legge «Stai guardando» («" + T(W.finestra("Nino")).slice(0, 160) + "»)");
          if (W.finestra("Nino").document.querySelector(".tl-vota, .tl-ruba")) no("Nino che guarda ha i tasti per votare");
          fatto.guarda = true; note.push("Nino guarda"); void N;
        }
        ["Giulia", "Luca"].forEach(function (n) { if (n !== tur) manda(n, C, { t: "voto", d: true }); });
        if (tur !== "Paky") await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /👍 Giusto/); }, 12000);
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
})();
