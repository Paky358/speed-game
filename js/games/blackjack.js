/* =========================================================
   BLACK JACK — "Il 21"
   Carte francesi disegnate a mano (SVG originali, nessun mazzo
   con copyright). Mazzo da 6 mazzi, il banco è un bot fisso (lo guida
   chi tiene la partita), mosse Carta/Stai/Raddoppia/Dividi/Assicura.
   Da 1 a 10 giocatori. Il tavolo ovale con la telecamera sopra,
   sotto le carte grandi e i tasti di chi decide.
   ========================================================= */
(function () {
  "use strict";

  // ---- costanti del mazzo ----
  // semi: 0 picche, 1 cuori, 2 quadri, 3 fiori. cuori/quadri = rossi.
  var SEMI = ["♠", "♥", "♦", "♣"];
  var ROSSO = { 1: true, 2: true };
  var RANGHI = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var N_MAZZI = 6;                 // il sabot unisce 6 mazzi da 52
  var SOGLIA_RIMESCOLA = 0.20;     // si rimescola sotto il 20% di carte

  // valore di una carta ai fini del Black Jack (l'asso conta 11, poi si abbassa)
  function valoreCarta(v) { return v === 1 ? 11 : (v >= 10 ? 10 : v); }

  // punteggio di una mano: gestisce gli assi (11 -> 1 se si sballa)
  function punteggio(mano) {
    var tot = 0, assi = 0;
    for (var i = 0; i < mano.length; i++) {
      tot += valoreCarta(mano[i].v);
      if (mano[i].v === 1) assi++;
    }
    while (tot > 21 && assi > 0) { tot -= 10; assi--; }
    return tot;
  }
  function eSoft(mano) { // ha un asso ancora contato come 11
    var tot = 0, assi = 0;
    for (var i = 0; i < mano.length; i++) { tot += valoreCarta(mano[i].v); if (mano[i].v === 1) assi++; }
    var soft = false;
    while (tot > 21 && assi > 0) { tot -= 10; assi--; }
    return assi > 0 && tot <= 21;
  }
  function eBlackjack(mano) { return mano.length === 2 && punteggio(mano) === 21; }
  // Black Jack vero di una mano: 21 con due carte e la mano NON nasce da "Dividi" (lì è solo 21)
  function eBJ(m) { return !!m && !m.divisa && eBlackjack(m.carte); }
  // 1000 -> "1.000", 10000 -> "10.000"
  function fmtN(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function testo(mano, divisa) { var p = punteggio(mano); return (eBlackjack(mano) && !divisa) ? "BJ" : (p > 21 ? "sballa " + p : (eSoft(mano) ? "" + (p - 10) + "/" + p : "" + p)); }

  // La mossa giusta secondo la "strategia base" (6 mazzi, il banco sta sul 17).
  // m = la mano, su = la carta scoperta del banco; puoRadd/puoDiv = mosse permesse adesso.
  function consiglio(m, su, puoRadd, puoDiv) {
    var c = m.carte, d = su ? valoreCarta(su.v) : 10, p = punteggio(c), soft = eSoft(c);
    function radd(altrimenti) { return puoRadd ? "raddoppia" : altrimenti; }
    if (puoDiv && c.length === 2) {
      var v = valoreCarta(c[0].v);
      if (v === 11 || v === 8) return "dividi";
      if (v === 9 && d !== 7 && d < 10) return "dividi";
      if ((v === 7 || v === 3 || v === 2) && d <= 7) return "dividi";
      if (v === 6 && d <= 6) return "dividi";
      if (v === 4 && (d === 5 || d === 6)) return "dividi";
    }
    if (soft) {
      if (p >= 19) return "stai";
      if (p === 18) return (d >= 3 && d <= 6) ? radd("stai") : (d <= 8 ? "stai" : "carta");
      if (p === 17) return (d >= 3 && d <= 6) ? radd("carta") : "carta";
      if (p >= 15) return (d >= 4 && d <= 6) ? radd("carta") : "carta";
      if (p <= 12) return "carta";   // due assi che non si possono dividere
      return (d === 5 || d === 6) ? radd("carta") : "carta";
    }
    if (p >= 17) return "stai";
    if (p >= 13) return d <= 6 ? "stai" : "carta";
    if (p === 12) return (d >= 4 && d <= 6) ? "stai" : "carta";
    if (p === 11) return radd("carta");
    if (p === 10) return d <= 9 ? radd("carta") : "carta";
    if (p === 9) return (d >= 3 && d <= 6) ? radd("carta") : "carta";
    return "carta";
  }

  // =========================================================
  //  DISEGNO DELLE CARTE (SVG) — originali, stile francese pulito
  // =========================================================

  // posizioni dei "pip" (simboli seme) per le carte numeriche, in coordinate 0..1
  // sull'area interna; nella metà bassa il pip va capovolto, come nei mazzi veri.
  var PIP = {
    2: [[.5, .18], [.5, .82]],
    3: [[.5, .18], [.5, .5], [.5, .82]],
    4: [[.3, .18], [.7, .18], [.3, .82], [.7, .82]],
    5: [[.3, .18], [.7, .18], [.5, .5], [.3, .82], [.7, .82]],
    6: [[.3, .18], [.7, .18], [.3, .5], [.7, .5], [.3, .82], [.7, .82]],
    7: [[.3, .18], [.7, .18], [.5, .34], [.3, .5], [.7, .5], [.3, .82], [.7, .82]],
    8: [[.3, .18], [.7, .18], [.5, .34], [.3, .5], [.7, .5], [.5, .66], [.3, .82], [.7, .82]],
    9: [[.3, .16], [.7, .16], [.3, .38], [.7, .38], [.5, .5], [.3, .62], [.7, .62], [.3, .84], [.7, .84]],
    10: [[.3, .16], [.7, .16], [.5, .27], [.3, .38], [.7, .38], [.3, .62], [.7, .62], [.5, .73], [.3, .84], [.7, .84]]
  };

  function seme(s) { return SEMI[s]; }
  function colore(s) { return ROSSO[s] ? "#d21c24" : "#101014"; }

  // Un pip: il simbolo del seme, capovolto se sta nella metà bassa della carta.
  // Le colonne (.3/.7) e le righe si mappano su un'area larga, così i simboli
  // riempiono il fronte come in un mazzo vero (non ammassati al centro).
  function pip(s, x, y) {
    var cx = -5 + x * 110, cy = 11 + y * 118;
    var rot = y > 0.5 ? " transform='rotate(180 " + cx + " " + cy + ")'" : "";
    return "<text x='" + cx + "' y='" + cy + "' font-size='24' text-anchor='middle' dominant-baseline='central' fill='" + colore(s) + "'" + rot + ">" + seme(s) + "</text>";
  }

  // Indice d'angolo (rango + seme) allineato al bordo: così il "10" non sfora.
  // In alto a sinistra; ripetuto ruotato in basso a destra.
  function angolo(v, s) {
    var col = colore(s), r = RANGHI[v], fr = r.length > 1 ? 16 : 19;
    return "<g fill='" + col + "' text-anchor='start'>" +
      "<text x='0' y='0' font-size='" + fr + "' font-weight='800' font-family='Georgia,\"Times New Roman\",serif' dominant-baseline='hanging'>" + r + "</text>" +
      "<text x='1.5' y='" + (fr + 1) + "' font-size='10' dominant-baseline='hanging'>" + seme(s) + "</text></g>";
  }

  // Fronte carta: viewBox 0 0 100 140. Numeri coi pip, A grande, figure J/Q/K
  // come lettera stilizzata dentro una cornice (disegno originale, niente ritratti).
  function fronteSVG(c) {
    var v = c.v, s = c.s, col = colore(s), dentro = "";
    if (v >= 2 && v <= 10) {
      PIP[v].forEach(function (p) { dentro += pip(s, p[0], p[1]); });
    } else if (v === 1) {
      dentro = "<text x='50' y='71' font-size='64' text-anchor='middle' dominant-baseline='central' fill='" + col + "'>" + seme(s) + "</text>";
    } else {
      // figura: cornice + grande lettera + seme sotto
      dentro =
        "<rect x='24' y='34' width='52' height='72' rx='6' fill='none' stroke='" + col + "' stroke-width='1.5' stroke-dasharray='4 3' opacity='.55'/>" +
        "<text x='50' y='66' font-size='40' font-weight='800' text-anchor='middle' dominant-baseline='central' fill='" + col + "'>" + RANGHI[v] + "</text>" +
        "<text x='50' y='96' font-size='24' text-anchor='middle' dominant-baseline='central' fill='" + col + "'>" + seme(s) + "</text>";
    }
    return "<svg class='bj-svg' viewBox='0 0 100 140' xmlns='http://www.w3.org/2000/svg'>" +
      "<rect x='1.5' y='1.5' width='97' height='137' rx='9' fill='#fffdf7' stroke='#d9d3c2' stroke-width='1.5'/>" +
      "<g transform='translate(9 9)'>" + angolo(v, s) + "</g>" +
      "<g transform='translate(91 131) rotate(180)'>" + angolo(v, s) + "</g>" +
      dentro + "</svg>";
  }

  // Retro carta: motivo geometrico blu originale.
  function retroSVG() {
    return "<svg class='bj-svg' viewBox='0 0 100 140' xmlns='http://www.w3.org/2000/svg'>" +
      "<rect x='1.5' y='1.5' width='97' height='137' rx='9' fill='#243a86' stroke='#dfe6ff' stroke-width='1.5'/>" +
      "<rect x='7' y='7' width='86' height='126' rx='6' fill='none' stroke='#6f86d8' stroke-width='2'/>" +
      "<g stroke='#4a63b8' stroke-width='2' opacity='.8'>" +
      "<path d='M7 40 L93 100 M7 100 L93 40 M50 7 L50 133 M7 70 L93 70'/></g>" +
      "<circle cx='50' cy='70' r='15' fill='#1a2a63' stroke='#8fa4e6' stroke-width='2'/>" +
      "<text x='50' y='70' font-size='16' text-anchor='middle' dominant-baseline='central' fill='#dfe6ff'>21</text></svg>";
  }

  function cartaHTML(c, coperta) { return coperta ? retroSVG() : fronteSVG(c); }

  // esposto per il resto del modulo (motore + UI qui sotto lo usano)
  window.__BJ = {
    SEMI: SEMI, RANGHI: RANGHI, N_MAZZI: N_MAZZI, SOGLIA_RIMESCOLA: SOGLIA_RIMESCOLA,
    valoreCarta: valoreCarta, punteggio: punteggio, eSoft: eSoft, eBlackjack: eBlackjack, eBJ: eBJ, consiglio: consiglio,
    testo: testo, fmtN: fmtN, cartaHTML: cartaHTML, fronteSVG: fronteSVG, retroSVG: retroSVG, colore: colore
  };

  // =========================================================
  //  MOTORE — logica pura del Black Jack (niente disegno).
  //  Uno stato + azioni: riutilizzabile per "un telefono solo"
  //  e per l'online (l'host tiene lo stato e manda le viste).
  // =========================================================
  var FICHES_INIZIALI = 500;
  var PUNTATA_MIN = 10;
  var PUNTATE_RAPIDE = [10, 25, 50, 100];

  function mischiaDef(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Sabot: 6 mazzi uniti e mescolati; si rimescola quando restano poche carte.
  function nuovoSabot(mischia) {
    var carte = [];
    for (var d = 0; d < N_MAZZI; d++)
      for (var s = 0; s < 4; s++)
        for (var v = 1; v <= 13; v++) carte.push({ s: s, v: v });
    return { carte: (mischia || mischiaDef)(carte), i: 0, mischia: mischia || mischiaDef };
  }
  function pescaSabot(sb) { return sb.carte[sb.i++]; }
  function restaSotto(sb) { return (sb.carte.length - sb.i) < sb.carte.length * SOGLIA_RIMESCOLA; }
  function rimescolaSabot(sb) { sb.carte = sb.mischia(sb.carte); sb.i = 0; }

  function manoVuota(puntata) { return { carte: [], puntata: puntata, chiusa: false, raddoppiata: false, divisa: false, esito: null, vincita: 0 }; }
  var MAX_POSTI = 10;

  // opz: { min: puntata minima, mani: quante mani si giocano (0 = senza fine) }
  function creaMotoreBJ(nomi, mischia, fichesIniz, opz) {
    opz = opz || {};
    function nuovoGioc(i, n, f) {
      f = (f == null) ? FICHES_INIZIALI : Math.max(0, Math.floor(+f) || 0);
      return { id: "g" + i, nome: n, fiches: f, inizio: f, puntata: 0, assicura: 0, mani: [], attiva: 0, via: false, salta: false, prova: false };
    }
    var st = {
      sabot: nuovoSabot(mischia),
      giocatori: nomi.map(function (n, i) { return nuovoGioc(i, n, fichesIniz ? fichesIniz[i] : null); }),
      banco: { carte: [] },
      fase: "punta",     // punta -> (assic) -> gioca -> banco -> esito  (e "fine": la classifica)
      giro: 1,
      mano: 0,           // mani giocate in questa partita
      maniTot: Math.max(0, Math.floor(+opz.mani) || 0),
      min: Math.max(1, Math.floor(+opz.min) || PUNTATA_MIN),
      turno: 0,          // indice del giocatore che sta agendo
      msg: "",
      rimescolato: false
    };

    // annuncio "in prima persona" della mossa di un giocatore: la UI lo mostra
    // come una nuvoletta sopra il suo riquadro (es. clicca "Stai" -> dice "Passo").
    function annuncia(seat, testo) { st.annSeq = (st.annSeq || 0) + 1; st.annuncio = { seat: seat, testo: testo, id: st.annSeq }; }

    function nuovaMano() {
      if (restaSotto(st.sabot)) { rimescolaSabot(st.sabot); st.rimescolato = true; } else st.rimescolato = false;
      st.banco = { carte: [] };
      st.giocatori.forEach(function (g) { g.puntata = 0; g.assicura = 0; g.mani = []; g.attiva = 0; g.decisoAssic = false; g.salta = false; });
      st.fase = "punta";
      st.turno = primoCheDevePuntare(0);
      st.msg = ""; st.annuncio = null;
      return st;
    }
    // chi può ancora puntare: chi ha meno della puntata minima punta tutto quello che ha
    function puoPuntareG(g) { return !g.puntata && !g.via && !g.salta && g.fiches > 0; }
    function primoCheDevePuntare(da) {
      for (var i = da; i < st.giocatori.length; i++) if (puoPuntareG(st.giocatori[i])) return i;
      return -1;
    }

    // Un giocatore punta (in qualsiasi ordine); quando hanno puntato tutti quelli che possono, si distribuisce.
    function punta(idx, importo) {
      var g = st.giocatori[idx]; if (!g || st.fase !== "punta" || !puoPuntareG(g)) return st;
      importo = Math.floor(Number(importo)); if (!isFinite(importo)) return st;   // solo numeri interi veri
      importo = Math.max(Math.min(st.min, g.fiches), Math.min(importo, g.fiches));
      g.puntata = importo; g.fiches -= importo;
      annuncia(idx, (g.fiches === 0 ? "Tutto! " : "Punto ") + fmtN(importo));
      var next = primoCheDevePuntare(0);
      if (next < 0) distribuisci(); else st.turno = next;
      return st;
    }
    // tempo scaduto per le puntate: chi non ha puntato salta questa mano, gli altri giocano
    function scadePuntate() {
      if (st.fase !== "punta" || !attiviDist().length) return st;
      st.giocatori.forEach(function (g) { if (puoPuntareG(g)) g.salta = true; });
      distribuisci();
      return st;
    }

    // La distribuzione non è istantanea: si fa a passi (una carta alla volta),
    // così la UI la mostra col ritmo del vero tavolo.
    //   Giro 1: una carta scoperta a ogni giocatore, poi una al banco (scoperta).
    //   Giro 2: una seconda a ogni giocatore, poi la seconda al banco (coperta).
    function distribuisci() {
      var attivi = st.giocatori.filter(function (g) { return g.puntata > 0; });
      attivi.forEach(function (g) { g.mani = [manoVuota(g.puntata)]; g.attiva = 0; });
      st.fase = "distrib"; st.dGiro = 1; st.dIdx = 0;
      return st;
    }
    function attiviDist() { return st.giocatori.filter(function (g) { return g.puntata > 0; }); }
    // dà UNA carta al prossimo destinatario del giro (giocatori, poi banco)
    function passoDistribuzione() {
      if (st.fase !== "distrib") return st;
      var att = attiviDist();
      if (st.dIdx < att.length) att[st.dIdx].mani[0].carte.push(pescaSabot(st.sabot));
      else st.banco.carte.push(pescaSabot(st.sabot));
      st.dIdx++;
      if (st.dIdx > att.length) {                 // finito il giro (tutti + banco)
        if (st.dGiro === 1) { st.dGiro = 2; st.dIdx = 0; }
        else fineDistribuzione(att);
      }
      return st;
    }
    function fineDistribuzione(att) {
      att.forEach(function (g) { if (eBlackjack(g.mani[0].carte)) g.mani[0].chiusa = true; });
      var t0 = primoDaAssicurare(0);
      if (st.banco.carte[0].v === 1 && t0 >= 0) { st.fase = "assic"; st.turno = t0; }
      else avviaGioco();
    }
    // l'assicurazione la decidono tutti insieme, ognuno dal suo telefono (solo chi può pagarla)
    function deveAssicurare(g) {
      return g.puntata > 0 && !g.decisoAssic && !g.via && !eBlackjack(g.mani[0].carte) && g.fiches >= Math.max(1, Math.floor(g.puntata / 2));
    }
    function primoDaAssicurare(da) {
      for (var i = da; i < st.giocatori.length; i++) if (deveAssicurare(st.giocatori[i])) return i;
      return -1;
    }
    function assicura(idx, si) {
      var g = st.giocatori[idx]; if (!g || st.fase !== "assic" || !deveAssicurare(g)) return st;
      g.decisoAssic = true;
      if (si) { var costo = Math.floor(g.puntata / 2); g.assicura = costo; g.fiches -= costo; annuncia(idx, "Assicuro"); }
      else annuncia(idx, "Niente");
      var next = primoDaAssicurare(0);
      if (next < 0) avviaGioco(); else st.turno = next;
      return st;
    }
    // tempo scaduto per l'assicurazione: chi non ha risposto non si assicura
    function scadeAssic() {
      if (st.fase !== "assic") return st;
      st.giocatori.forEach(function (g) { if (deveAssicurare(g)) g.decisoAssic = true; });
      avviaGioco();
      return st;
    }

    function avviaGioco() {
      st.fase = "gioca";
      // il banco con un Asso o un 10 scoperto guarda subito la coperta: se ha Black Jack la mano
      // finisce qui (si perde solo la puntata, niente Raddoppia o Dividi da pagare)
      var su = st.banco.carte[0];
      if (su && valoreCarta(su.v) >= 10 && eBlackjack(st.banco.carte)) { giocaBanco(); return; }
      st.turno = prossimoGiocatoreDaGiocare(0);
      if (st.turno < 0) giocaBanco();
    }
    function prossimoGiocatoreDaGiocare(da) {
      for (var i = da; i < st.giocatori.length; i++) {
        var g = st.giocatori[i];
        if (g.via) g.mani.forEach(function (m) { m.chiusa = true; });   // chi è uscito sta fermo
        if (g.puntata > 0 && g.mani.some(function (m) { return !m.chiusa; })) { g.attiva = g.mani.findIndex(function (m) { return !m.chiusa; }); return i; }
      }
      return -1;
    }

    // azione del giocatore attivo sulla mano attiva.
    // chk (dall'online) = { h: mano, n: carte che vedeva }: se nel frattempo è cambiato qualcosa
    // (un doppio tocco arrivato due volte) la mossa si scarta.
    function azione(mossa, chk) {
      if (st.fase !== "gioca") return st;
      var g = st.giocatori[st.turno]; if (!g) return st;
      var m = g.mani[g.attiva]; if (!m || m.chiusa || m.carte.length < 2) return st;   // con una carta sola aspetta la seconda
      if (chk && (chk.h !== g.attiva || chk.n !== m.carte.length)) return st;
      if (mossa === "carta") { m.carte.push(pescaSabot(st.sabot)); if (punteggio(m.carte) >= 21) m.chiusa = true; annuncia(st.turno, "Carta!"); }
      else if (mossa === "stai") { m.chiusa = true; annuncia(st.turno, "Passo"); }
      else if (mossa === "raddoppia") {
        if (m.carte.length === 2 && g.fiches >= m.puntata) { g.fiches -= m.puntata; m.puntata *= 2; m.raddoppiata = true; m.carte.push(pescaSabot(st.sabot)); m.chiusa = true; annuncia(st.turno, "Raddoppio!"); }
      } else if (mossa === "dividi") {
        if (puoDividere(g, m)) {
          g.fiches -= m.puntata;
          // le due mani restano con una carta: la seconda arriva una alla volta, quando tocca a quella mano (passoDivisa)
          var nuova = manoVuota(m.puntata); nuova.carte.push(m.carte.pop());
          m.divisa = true; nuova.divisa = true;   // da qui in poi un 21 con due carte non è Black Jack
          if (m.carte[0].v === 1) { m.assi = true; nuova.assi = true; }   // split di assi: una carta sola per mano
          g.mani.splice(g.attiva + 1, 0, nuova);
          annuncia(st.turno, "Divido!");
        }
      }
      return st;   // il turno NON avanza subito: la UI aspetta e poi chiama avanza()
    }
    // tempo scaduto nel turno: la mano si ferma lì ("Stai")
    function scadeTurno() {
      if (st.fase !== "gioca") return st;
      var g = st.giocatori[st.turno]; if (!g) return st;
      var m = g.mani[g.attiva]; if (!m || m.chiusa || m.carte.length < 2) return st;
      m.chiusa = true; annuncia(st.turno, "⏱ Tempo!");
      return st;
    }
    // dopo "Dividi": la mano che tocca riceve la sua seconda carta
    function passoDivisa() {
      if (st.fase !== "gioca") return st;
      var g = st.giocatori[st.turno]; if (!g) return st;
      var m = g.mani[g.attiva]; if (!m || m.chiusa || m.carte.length !== 1) return st;
      m.carte.push(pescaSabot(st.sabot));
      if (m.assi || punteggio(m.carte) >= 21) m.chiusa = true;
      return st;
    }
    // un giocatore online se ne va: non si aspetta più (le sue mani restano ferme)
    function esce(idx) {
      var g = st.giocatori[idx]; if (!g || g.via) return st;
      g.via = true;
      if (st.fase === "punta") { var p = primoCheDevePuntare(0); if (p >= 0) st.turno = p; else if (attiviDist().length) distribuisci(); }
      else if (st.fase === "assic") { var a = primoDaAssicurare(0); if (a < 0) avviaGioco(); else st.turno = a; }
      else if (st.fase === "gioca" && st.turno === idx) { g.mani.forEach(function (m) { m.chiusa = true; }); avanzaTurno(g); }
      return st;
    }
    // chi era uscito torna (pagina ricaricata, rete tornata): si siede di nuovo.
    // Se la sua mano è ancora in gioco la gioca, altrimenti riparte dalla prossima.
    function rientra(idx) {
      var g = st.giocatori[idx]; if (!g || !g.via) return st;
      g.via = false;
      if (st.fase === "punta" && st.turno < 0) st.turno = primoCheDevePuntare(0);
      return st;
    }
    // chi arriva a partita iniziata prende un posto nuovo: gioca dalla prossima puntata
    function aggiungi(nome, fiches, rid, prova) {
      if (st.giocatori.length >= MAX_POSTI) return -1;
      var g = nuovoGioc(st.giocatori.length, nome, fiches); g.rid = rid || null; g.prova = !!prova;
      st.giocatori.push(g);
      if (st.fase === "punta" && st.turno < 0) st.turno = primoCheDevePuntare(0);
      return st.giocatori.length - 1;
    }
    // monete arrivate da fuori (ruota del giorno): non sono una vincita al tavolo
    function aggiungiFiches(idx, piu) {
      var g = st.giocatori[idx]; piu = Math.floor(+piu) || 0; if (!g || piu <= 0) return st;
      g.fiches += piu; g.inizio += piu;
      if (st.fase === "punta" && st.turno < 0) st.turno = primoCheDevePuntare(0);
      return st;
    }
    // chi ha finito le monete riparte con 500 di prova (non si salvano nel profilo)
    function ricarica(idx) {
      var g = st.giocatori[idx];
      var inGioco = st.fase !== "esito" && st.fase !== "fine" && g && g.puntata > 0;   // a fine mano la puntata è già pagata
      if (!g || g.fiches > 0 || inGioco || g.via) return st;
      g.fiches = FICHES_INIZIALI; g.inizio += FICHES_INIZIALI; g.prova = true;
      annuncia(idx, "Ricarico!");
      if (st.fase === "punta" && st.turno < 0) st.turno = primoCheDevePuntare(0);
      return st;
    }
    // passa alla mano successiva del giocatore, o al prossimo giocatore, o al banco
    function avanza() {
      if (st.fase !== "gioca") return st;
      var g = st.giocatori[st.turno]; if (g) avanzaTurno(g);
      return st;
    }
    function avanzaTurno(g) {
      var pross = g.mani.findIndex(function (m) { return !m.chiusa; });
      if (pross >= 0) { g.attiva = pross; return; }
      var ng = prossimoGiocatoreDaGiocare(st.turno + 1);
      if (ng < 0) giocaBanco(); else st.turno = ng;
    }

    function puoDividere(g, m) {
      return m.carte.length === 2 && valoreCarta(m.carte[0].v) === valoreCarta(m.carte[1].v) && g.fiches >= m.puntata && g.mani.length < 4;
    }
    function mosseValide() {
      var g = st.giocatori[st.turno]; if (!g) return {};
      var m = g.mani[g.attiva] || { carte: [] };
      return {
        carta: true, stai: true,
        raddoppia: m.carte.length === 2 && g.fiches >= m.puntata,
        dividi: puoDividere(g, m)
      };
    }

    function giocaBanco() { st.fase = "banco"; }   // gira la coperta; poi pesca a passi
    function bancoVivo() { return st.giocatori.some(function (g) { return g.mani.some(function (m) { return punteggio(m.carte) <= 21 && !eBJ(m); }); }); }
    // un passo del banco: pesca se ha 16 o meno (e c'è qualcuno da battere), altrimenti risolve
    function passoBanco() {
      if (st.fase !== "banco") return st;
      if (bancoVivo() && punteggio(st.banco.carte) < 17) { st.banco.carte.push(pescaSabot(st.sabot)); return st; }
      risolvi();
      return st;
    }

    function risolvi() {
      var pb = punteggio(st.banco.carte), bjBanco = eBlackjack(st.banco.carte);
      st.giocatori.forEach(function (g) {
        // assicurazione: paga 2:1 se il banco ha black jack
        if (g.assicura > 0) { if (bjBanco) g.fiches += g.assicura * 3; }
        g.mani.forEach(function (m) {
          var pm = punteggio(m.carte), bjMano = eBJ(m), v = 0, es;
          if (pm > 21) { es = "perde"; v = 0; }
          else if (bjMano && !bjBanco) { es = "blackjack"; v = m.puntata + Math.floor(m.puntata * 3 / 2); }
          else if (bjBanco && !bjMano) { es = "perde"; v = 0; }
          else if (bjBanco && bjMano) { es = "pari"; v = m.puntata; }
          else if (pb > 21 || pm > pb) { es = "vince"; v = m.puntata * 2; }
          else if (pm === pb) { es = "pari"; v = m.puntata; }
          else { es = "perde"; v = 0; }
          m.esito = es; m.vincita = v; g.fiches += v;
        });
      });
      st.fase = "esito";
      st.giro++; st.mano++;
    }

    // la classifica della partita: chi ha guadagnato di più al tavolo (pari merito = stesso posto)
    function classifica() {
      var r = st.giocatori.map(function (g, k) { return { i: k, nome: g.nome, netto: g.fiches - g.inizio, fiches: g.fiches }; });
      r.sort(function (a, b) { return b.netto - a.netto; });
      r.forEach(function (x) { x.pos = 1 + r.filter(function (y) { return y.netto > x.netto; }).length; });
      return r;
    }
    function finita() { return st.maniTot > 0 && st.mano >= st.maniTot; }
    // si chiude il tavolo (fine delle mani o scelto da chi guida): classifica sul tavolo
    function fineTavolo() {
      if (st.fase !== "esito" && st.fase !== "punta") return st;
      if (st.fase === "punta") st.giocatori.forEach(function (g) { g.fiches += g.puntata; g.puntata = 0; });   // le puntate non giocate tornano indietro
      st.fase = "fine"; st.classifica = classifica(); st.annuncio = null;
      return st;
    }
    // "Gioca ancora": una partita nuova, con le monete che avete adesso
    function nuovaSerie() {
      st.giocatori.forEach(function (g) { g.inizio = g.fiches; });
      st.mano = 0; st.classifica = null;
      return nuovaMano();
    }

    return {
      st: st,
      nuovaMano: nuovaMano, punta: punta, assicura: assicura, azione: azione, avanza: avanza,
      passoDistribuzione: passoDistribuzione, passoBanco: passoBanco, passoDivisa: passoDivisa, esce: esce,
      rientra: rientra, aggiungi: aggiungi, aggiungiFiches: aggiungiFiches, ricarica: ricarica,
      scadePuntate: scadePuntate, scadeAssic: scadeAssic, scadeTurno: scadeTurno,
      classifica: classifica, finita: finita, fineTavolo: fineTavolo, nuovaSerie: nuovaSerie,
      mosseValide: mosseValide, PUNTATE_RAPIDE: PUNTATE_RAPIDE, PUNTATA_MIN: PUNTATA_MIN
    };
  }

  window.__BJ.creaMotore = creaMotoreBJ;
  window.__BJ.FICHES_INIZIALI = FICHES_INIZIALI;
  window.__BJ.PUNTATE_RAPIDE = PUNTATE_RAPIDE;
  window.__BJ.PUNTATA_MIN = PUNTATA_MIN;
})();

// =========================================================
//  INTERFACCIA + REGISTRAZIONE DEL GIOCO
//  Tre zone verticali: Banco in alto · Giocatore attivo al
//  centro (grande) · Tavolata compatta a scorrimento in basso.
// =========================================================
(function () {
  "use strict";
  var BJ = window.__BJ;
  // il saldo fiches col tasto del bonus serve anche al Poker (stesse fiches)
  BJ.riquadroBonus = function (el, dopo) { return riquadroBonus(el, dopo); };
  // l'ultima puntata di ognuno: la mano dopo riparte da lì (non da 100)
  var ultimePuntate = {};
  function chiavePuntata(g) { return (g.id || "") + "|" + (g.nome || ""); }
  var fmt = BJ.fmtN;   // 1.000 · 10.000
  function puoPuntare(vm, i) { var g = vm.giocatori[i]; return !!g && !g.puntata && !g.via && !g.salta && g.fiches > 0; }
  function deveAssic(vm, i) { var g = vm.giocatori[i]; return !!g && g.puntata > 0 && !g.dec && !g.via && !!g.mani[0] && !BJ.eBlackjack(g.mani[0].carte) && g.fiches >= Math.max(1, Math.floor(g.puntata / 2)); }

  // ---- le battute del croupier (la stessa su tutti i telefoni: si sceglie col numero della mano) ----
  var FRASI = {
    punta: ["Fate il vostro gioco!", "Puntate, signori!", "Chi mi sfida stasera?", "Le carte sono calde…", "Avanti, il banco aspetta 😏",
      "Mano nuova, storia nuova", "Il 21 vi sta chiamando", "Puntate col cuore… e con la testa", "Mazzo pronto, sorriso pronto 🎩",
      "Coraggio, non mordo… quasi", "Stasera mi sento fortunato", "Le monete non si puntano da sole!", "Il tavolo è vostro… per ora",
      "Chi punta poco rischia poco 😉", "Monete sul panno, prego!", "Che la fortuna vi assista", "Pronti? Le carte non aspettano",
      "Vediamo chi ha la mano calda"],
    rimescola: ["Mazzo rimescolato: si riparte!", "Carte nuove, fortuna nuova", "Ho mischiato tutto per bene 🔀", "Sei mazzi freschi di giornata",
      "Rimescolato! Niente trucchi", "Le carte hanno cambiato posto", "Mischia, mischia… pronto!", "Mazzo nuovo, stesse regole"],
    tutto: ["Tutto su una mano? Che fegato!", "Tutto dentro! Qui si fa sul serio", "Coraggio da vendere!", "Tutte le monete? Rispetto.",
      "Il tutto per tutto!", "Questa me la segno 📝", "Che cuore! Vediamo le carte", "Brividi al tavolo!", "O la va o la spacca!",
      "Il banco apprezza il coraggio 😏", "Le mie mani non tremano. E le tue?"],
    distrib: ["Carte in arrivo!", "Una per te, una per te…", "Occhio alle carte!", "Carte fresche fresche", "Non sbirciate! 😄",
      "Tenetevi forte", "Vediamo cosa dice il mazzo", "Carta dopo carta…", "E una anche per me…", "Pronti al primo sguardo?"],
    sballa: ["Ahi, troppo!", "Oltre il 21… peccato!", "Sballato! Succede ai migliori", "Una carta di troppo 😬", "Il 21 era lì vicino…",
      "Ops! Le monete vengono da me", "Coraggioso, ma troppo", "C'è sempre un'altra mano", "Il mazzo oggi è cattivo", "Eh, la gola…",
      "Peccato, ci credevi!", "Sballo! Il banco ringrazia 😏"],
    bj: ["Black Jack! Chapeau 🎩", "Asso e dieci: che classe!", "Black Jack! Ti pago 3 a 2", "Mani d'oro!", "Allora porti fortuna!",
      "Ventuno servito!", "Applausi al tavolo! 👏", "Che colpo!", "Ecco come si fa!", "Mi hai fregato 😅", "Fortuna sfacciata!"],
    ventuno: ["21 tondo! Bravo!", "Ventuno preciso!", "Che mira!", "Giusto giusto 21", "Al millimetro!", "Calcolo perfetto!",
      "21! Ti avevo sottovalutato", "Più preciso di un orologio"],
    bancoSballa: ["Sballato! 😵", "Ho esagerato…", "Oggi il mazzo non mi ama", "Pago tutti, che disastro!", "Ahia, troppo anche per me",
      "Va bene, avete vinto voi", "Il banco piange 😢", "Quasi quasi cambio mestiere", "Una carta di troppo… la mia", "Che figuraccia!",
      "Monete per tutti, accidenti!", "Stavolta mi avete battuto"],
    bancoBJ: ["Black Jack! 😎", "Asso e figura: tocca a me!", "Black Jack del banco, mi spiace", "Ventuno servito… per me 😏",
      "Che fortuna, eh?", "Scusate, era scritto!", "Il banco non perdona", "Asso nella manica… anzi, sul tavolo!"],
    bancoVince: ["Il banco vince 😎", "Grazie per le monete!", "Il banco ringrazia", "Ritenta, sarai più fortunato", "Non è serata, eh?",
      "Queste le prendo io", "Il 21 è amico mio", "Alla prossima andrà meglio", "Monete in cassa! 🪙", "Non abbattetevi: si riprova",
      "Il banco è il banco 🎩", "Peccato, ci eravate quasi"],
    vincete: ["Complimenti! 👏", "Bravi, stasera siete forti", "Pago volentieri… più o meno", "Ben giocato!", "Mi state svuotando la cassa!",
      "Che squadra!", "Bella mano!", "Mi arrendo… per questa mano", "Le monete sono vostre", "Avete fiuto!", "Che tavolo fortunato!",
      "Bravi! Ma non abituatevi 😏"],
    pari: ["Pari e patta", "Nessuno vince, nessuno perde", "Tutto come prima!", "Pareggio: si ricomincia", "Patta! Rigiochiamo?", "Un bel pareggio"],
    fine: ["Grazie per aver giocato!", "Che partita!", "Alla prossima, campioni!", "Il tavolo vi aspetta sempre", "È stato un piacere 🎩",
      "Vado a lucidare le fiche", "Bella sfida, davvero!", "Tornate presto!"]
  };
  function frase(tipo, seme) { var l = FRASI[tipo] || [""]; return l[Math.abs(Math.floor(seme || 0) * 7 + 3) % l.length]; }

  var CSS = [
    ".bj-wrap{position:relative;display:flex;flex-direction:column;gap:8px;min-height:78vh}",
    ".bj-svg{display:block;width:100%;height:auto}",
    // zona banco
    ".bj-banco{text-align:center;padding:6px 0 2px}",
    ".bj-titoloz{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:4px}",
    ".bj-carte{display:flex;justify-content:center;align-items:flex-end;gap:6px;min-height:64px}",
    ".bj-carte .cc{width:46px;flex:0 0 auto;filter:drop-shadow(0 3px 6px rgba(0,0,0,.4))}",
    ".bj-pt{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:26px;padding:0 8px;border-radius:13px;background:#0d1b12;color:#fff;font-weight:900;font-size:.9rem;border:1px solid rgba(255,255,255,.18);margin-top:4px}",
    ".bj-pt.win{background:linear-gradient(135deg,#3fb56a,#1f7d45);color:#04220f}",
    ".bj-pt.bust{background:#7a2230;color:#ffd7dc}",
    // zona hero (giocatore attivo)
    ".bj-hero{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.08),rgba(0,0,0,0));border-radius:18px;padding:10px 6px}",
    ".bj-hnome{font-size:1.15rem;font-weight:900}",
    ".bj-hfiches{font-size:.85rem;color:#ffe58a;font-weight:800}",
    ".bj-hcarte{display:flex;justify-content:center;align-items:flex-end;gap:8px;min-height:120px;flex-wrap:wrap}",
    ".bj-hcarte .cc{width:78px;flex:0 0 auto;filter:drop-shadow(0 6px 12px rgba(0,0,0,.45))}",
    ".bj-hcarte.doppia .cc{width:58px}",
    ".bj-mani{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}",
    ".bj-mano{padding:6px;border-radius:14px;border:2px solid transparent}",
    ".bj-mano.attiva{border-color:#ffd45e;background:rgba(255,212,94,.08)}",
    // azioni
    ".bj-azioni{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:100%;max-width:440px}",
    ".bj-btn{flex:1 1 40%;min-width:120px;min-height:52px;border:0;border-radius:14px;font-family:inherit;font-weight:900;font-size:1.02rem;cursor:pointer;color:#08130b}",
    ".bj-btn:disabled{opacity:.32}",
    ".bj-b-carta{background:linear-gradient(135deg,#4fe895,#1faf60)}",
    ".bj-b-stai{background:linear-gradient(135deg,#ff9d8a,#e0533a);color:#2a0d06}",
    ".bj-b-radd{background:linear-gradient(135deg,#9fb4ff,#5468c7);color:#fff}",
    ".bj-b-dividi{background:linear-gradient(135deg,#ffe58a,#e0a90a)}",
    ".bj-b-si{background:linear-gradient(135deg,#4fe895,#1faf60)}",
    ".bj-b-no{background:var(--carta-2,#241f4a);color:#fff}",
    // puntata
    ".bj-chip{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}",
    ".bj-c{min-width:60px;min-height:56px;border-radius:50%;border:3px solid rgba(255,255,255,.5);font-weight:900;font-size:1rem;cursor:pointer;color:#08130b}",
    ".bj-punta-val{font-size:2.6rem;font-weight:900;color:#ffe58a;line-height:1;margin:2px 0}",
    ".bj-step{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;width:100%;max-width:440px}",
    ".bj-sbtn{flex:1 1 0;min-width:62px;min-height:50px;border-radius:13px;border:0;background:var(--carta-2,#241f4a);color:#fff;font-weight:900;font-size:1.05rem;font-family:inherit;cursor:pointer}",
    ".bj-sbtn:active{transform:scale(.95)}",
    // tavolata
    ".bj-tavolata{flex:0 0 auto;display:flex;gap:8px;overflow-x:auto;padding:8px 2px;scrollbar-width:none}",
    ".bj-tavolata::-webkit-scrollbar{display:none}",
    ".bj-seat{position:relative;flex:0 0 auto;width:104px;background:rgba(0,0,0,.28);border-radius:14px;padding:8px 8px 10px;text-align:center;border:2px solid transparent;transition:opacity .2s}",
    // nuvoletta con la mossa detta dal giocatore (\"Passo\", \"Carta!\"…)
    ".bj-bolla{position:absolute;left:50%;top:1px;transform:translateX(-50%);max-width:96px;background:#fff;color:#12233a;font-weight:900;font-size:.82rem;line-height:1.1;padding:5px 10px;border-radius:13px;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,.5);z-index:6;pointer-events:none;animation:bjBolla .22s ease}",
    ".bj-bolla::after{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border:6px solid transparent;border-bottom:0;border-top-color:#fff}",
    "@keyframes bjBolla{from{opacity:0;transform:translateX(-50%) translateY(6px) scale(.7)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}",
    ".bj-seat.attivo{border-color:#ffd45e;opacity:1}",
    ".bj-seat.spenta{opacity:.42}",
    ".bj-seat .nm{font-size:.82rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".bj-seat .fi{font-size:.72rem;color:#ffe58a;margin-bottom:4px}",
    ".bj-fan{position:relative;height:56px;display:flex;justify-content:center;align-items:flex-start}",
    ".bj-fan .cc{width:36px;position:absolute;top:0;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))}",
    ".bj-badge{display:inline-block;margin-top:4px;min-width:22px;padding:1px 7px;border-radius:11px;background:#0d1b12;color:#fff;font-weight:900;font-size:.78rem;border:1px solid rgba(255,255,255,.2)}",
    ".bj-badge.win{background:#3fb56a;color:#04220f}.bj-badge.bust{background:#7a2230;color:#ffd7dc}",
    ".bj-msg{text-align:center;font-weight:800;min-height:20px;color:#fff}",
    // tavolo verde da casinò (copre l'area di gioco edge-to-edge)
    ".bj-wrap{background:radial-gradient(130% 80% at 50% 0%,#1a7a49,#0c5230 55%,#083b22);margin:-14px -16px 0;padding:14px 16px calc(14px + env(safe-area-inset-bottom));border-radius:0}",
    "body.bj-verde{background:#083b22}",
    // il mazzo (sabot) da cui volano le carte, in alto a destra del tavolo
    ".bj-mazzo{position:absolute;top:2px;right:6px;width:44px;height:62px;z-index:4;pointer-events:none}",
    ".bj-mazzo .r{position:absolute;top:0;left:0;width:44px}",
    ".bj-mazzo .r:nth-child(1){transform:translate(5px,5px);opacity:.4}",
    ".bj-mazzo .r:nth-child(2){transform:translate(2.5px,2.5px);opacity:.7}",
    ".bj-mazzo .bj-svg{width:100%;height:auto;filter:drop-shadow(0 2px 5px rgba(0,0,0,.55))}",
    // ---- LA REGIA: tavolo ovale e telecamera che inquadra chi gioca ----
    ".bj-sala{position:relative;flex:1 1 auto;min-height:0;margin:0;overflow:hidden;border-radius:16px;background:#1f130e;box-shadow:inset 0 0 44px rgba(0,0,0,.55)}",
    ".bjr-cam{position:absolute;inset:0;transform-origin:0 0;transition:transform .95s cubic-bezier(.45,.05,.25,1)}",
    ".bjr-muro{position:absolute;left:-60%;right:-60%;top:-60%;bottom:-60%;background:radial-gradient(40% 35% at 50% 60%,rgba(255,214,140,.40),rgba(255,214,140,0) 70%),linear-gradient(#4a2c22 0%,#34201a 55%,#1f130e 100%)}",
    ".bjr-strato{position:absolute;inset:0;z-index:1}",
    ".bjr-gioc{position:absolute;cursor:pointer}.bjr-gioc svg{display:block;width:100%;height:auto}",
    ".bjr-gioc.attivo svg{filter:drop-shadow(0 0 7px rgba(255,212,94,.95))}",
    ".bjr-prosp{position:absolute;inset:0;perspective-origin:50% -10%;pointer-events:none;z-index:2}",
    ".bjr-piano{position:absolute;left:50%;transform-origin:50% 100%;transform:rotateX(58deg);transform-style:preserve-3d;border-radius:50%;background:linear-gradient(#7a4724,#4a2a14);padding:13px;box-shadow:0 -6px 0 #8a562c inset}",
    ".bjr-panno{position:relative;width:100%;height:100%;border-radius:50%;background:radial-gradient(90% 80% at 50% 30%,#1f8a52,#127043 60%,#0b5431);box-shadow:inset 0 0 26px rgba(0,0,0,.45);transform-style:preserve-3d}",
    ".bjr-panno::after{content:'BLACK JACK PAGA 3 A 2';position:absolute;left:0;right:0;top:60%;text-align:center;font-weight:800;font-size:13px;letter-spacing:3px;color:rgba(255,215,120,.42)}",
    ".bjr-segno{position:absolute;width:100px;height:2px;margin:-1px 0 0 -50px}",
    ".bjr-pila{position:absolute;transform:translate(-50%,-50%);transform-style:preserve-3d}",
    ".bjr-fiche{position:absolute;inset:0;border-radius:50%;border:3px dashed rgba(255,255,255,.85);box-shadow:inset 0 0 0 2px rgba(0,0,0,.25),0 1px 0 rgba(0,0,0,.55);animation:bjrCade .35s ease-in}",
    "@keyframes bjrCade{from{transform:translateZ(60px);opacity:0}}",
    ".bjr-fiche.via{animation:bjrVia .6s ease-in forwards}@keyframes bjrVia{to{transform:translate3d(0,160px,10px);opacity:0}}",
    ".bjr-cc{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:3px;transform-style:preserve-3d}",
    ".bjr-cc.cascata{display:block}.bjr-cc.cascata .bjr-carta{position:absolute;top:0}",
    ".bjr-carta{flex:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}.bjr-carta .bj-svg{display:block;width:100%;height:auto}",
    ".bjr-carta.arriva{animation:bjrArriva .5s cubic-bezier(.2,.85,.3,1)}@keyframes bjrArriva{from{transform:translate3d(0,170px,90px) scale(.8);opacity:.2}}",
    ".bjr-punti{position:absolute;left:50%;top:-22px;transform:translateX(-50%);background:#0d1b12;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:0 6px;font-weight:900;font-size:13px;line-height:20px;white-space:nowrap}",
    ".bjr-punti.win{background:#3fb56a;color:#04220f}.bjr-punti.bust{background:#7a2230;color:#ffd7dc}",
    ".bjr-sopra{position:absolute;inset:0;pointer-events:none;z-index:3}",
    ".bjr-nome{position:absolute;transform:translate(-50%,-100%);background:rgba(10,18,50,.8);border:1.5px solid rgba(255,255,255,.16);border-radius:999px;padding:0 7px;font-size:.66rem;font-weight:800;white-space:nowrap}",
    ".bjr-nome.mini{font-size:.56rem;padding:0 5px}.bjr-nome.attivo{border-color:#ffd45e;box-shadow:0 0 10px rgba(255,212,94,.6)}",
    ".bjr-nome .piu{color:#7dffa8}.bjr-nome .meno{color:#ff9d8a}",
    ".bjr-nome{border-radius:9px;text-align:center;line-height:1.2;padding:1px 7px}.bjr-nome .ff{color:#ffe58a;font-size:.92em}.bjr-nome.via{opacity:.45}",
    ".bjr-fval{position:absolute;transform:translate(-50%,-100%);background:rgba(0,0,0,.72);color:#ffe58a;border:1px solid rgba(255,229,138,.5);border-radius:8px;padding:0 5px;font-size:.62rem;font-weight:900;white-space:nowrap;transition:opacity .3s}",
    ".bjr-bolla{position:absolute;transform:translate(-50%,-100%);background:#fff;color:#12233a;font-weight:900;font-size:.72rem;padding:3px 8px;border-radius:11px;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,.45);animation:bjrPop .25s cubic-bezier(.3,1.6,.5,1)}",
    ".bjr-bolla.oro{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400}.bjr-bolla.rossa{background:#ff8a8a;color:#3a0009}",
    "@keyframes bjrPop{from{transform:translate(-50%,-100%) scale(.3);opacity:0}}",
    ".bjr-matt{position:absolute;display:flex;flex-direction:column;align-items:center;cursor:pointer;pointer-events:auto}",
    ".bjr-matt .bj-av{width:58px;height:58px;margin:0}.bjr-matt.turno .bj-av,.bjr-matt.turno .bjr-matt-nome{border-color:#ffd45e}",
    ".bjr-matt-nome{margin-top:-8px;position:relative;background:rgba(10,18,50,.9);border:2px solid rgba(255,255,255,.16);border-radius:10px;padding:1px 8px;font-size:.7rem;font-weight:800;white-space:nowrap}",
    // Bot e quanto ha il banco stanno FUORI dalla telecamera: si vedono sempre, anche negli zoom
    ".bj-sala .bjr-matt{left:6px;bottom:6px;z-index:6}.bjr-matt-nome b{font-size:1.02rem;color:#ffe066;margin-left:4px}.bjr-matt-nome b.bust{color:#ff9d8a}.bj-sala>.bjr-fum{z-index:6}",
    // dopo "Dividi": un mazzetto per mano, quello che si gioca illuminato
    ".bjr-cc.cascata.divise{display:flex;align-items:flex-end;gap:9px}.bjr-mn{position:relative;flex:none;border-radius:5px;transform-style:preserve-3d}.bjr-mn.on{box-shadow:0 0 0 2px #ffd45e,0 0 12px rgba(255,212,94,.7)}",
    ".bjr-fum{position:absolute;max-width:150px;background:#fff;color:#12233a;font-weight:900;border-radius:13px;padding:5px 10px;font-size:.8rem;line-height:1.15;box-shadow:0 4px 12px rgba(0,0,0,.4);transform:translateY(-100%);animation:bjFum .26s cubic-bezier(.3,1.6,.5,1)}",
    ".bjr-fum.oro{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400}",
    "@keyframes bjFum{from{transform:translateY(-100%) scale(.3);opacity:0}}",
    // apertura: Bot ci guarda, poi la telecamera passa su ognuno
    ".bjr-intro{position:absolute;inset:0;z-index:8;overflow:hidden;background:radial-gradient(70% 55% at 50% 10%,rgba(255,214,140,.45),rgba(255,214,140,0) 70%),linear-gradient(#4a2c22,#1f130e);transition:opacity .6s,transform .6s cubic-bezier(.5,0,.75,0)}",
    ".bjr-intro.via{opacity:0;transform:translateX(-60%) scale(1.15);pointer-events:none}",
    ".bjr-intro .mg{position:absolute;left:50%;bottom:14%;width:78%;max-width:340px;transform:translateX(-50%)}.bjr-intro .mg svg{display:block;width:100%;height:auto}",
    ".bjr-intro .banc{position:absolute;left:-10%;right:-10%;bottom:0;height:26%;background:linear-gradient(#1f8a52,#0b5431);border-top:14px solid #7a4724;border-radius:50% 50% 0 0/30% 30% 0 0;box-shadow:inset 0 10px 24px rgba(0,0,0,.45)}",
    ".bjr-intro .benv{position:absolute;left:50%;top:9%;transform:translateX(-50%);background:#fff;color:#12233a;font-weight:900;border-radius:16px;padding:8px 14px;font-size:1rem;white-space:nowrap;box-shadow:0 6px 16px rgba(0,0,0,.45);animation:bjrPopC .3s cubic-bezier(.3,1.6,.5,1)}",
    ".bjr-presenta{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:6;background:rgba(10,18,50,.88);border:2px solid #ffd45e;border-radius:14px;padding:4px 14px;font-weight:900;font-size:1.05rem;white-space:nowrap;animation:bjrPopC .25s cubic-bezier(.3,1.6,.5,1)}",
    "@keyframes bjrPopC{from{transform:translateX(-50%) scale(.3);opacity:0}}",
    ".bj-wrap .bj-mazzo{right:14px}",
    ".bj-av{position:relative;margin:-2px auto 3px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#4a64c9,#26357a);border:2px solid rgba(255,255,255,.25)}",
    ".bj-av svg{position:absolute;left:50%;bottom:-1px;transform:translateX(-50%);width:96%;height:auto}",
    ".bj-hchi{display:flex;align-items:center;gap:8px}",
    // nomi sopra le teste, punteggio accanto alle carte
    ".bj-nome{position:absolute;transform:translate(-50%,-100%);background:rgba(10,18,50,.8);border:1.5px solid rgba(255,255,255,.16);border-radius:999px;padding:0 7px;font-size:.66rem;font-weight:800;white-space:nowrap;max-width:96px;overflow:hidden;text-overflow:ellipsis}",
    ".bj-nome.mini{font-size:.56rem;padding:0 5px;max-width:76px}",
    ".bj-nome.attivo{border-color:#ffd45e;box-shadow:0 0 10px rgba(255,212,94,.6)}",
    ".bj-nome .piu{color:#7dffa8}.bj-nome .meno{color:#ff9d8a}",
    ".bj-punti{position:absolute;transform:translateY(-50%);margin:0;font-size:.7rem;padding:0 6px}.bj-punti.mini{font-size:.6rem;padding:0 4px}",
    // PRIORITÀ AL TAVOLO: la parte sotto (carte grandi e tasti) è compatta
    ".bj-hero{flex:0 0 auto;gap:4px;padding:6px 6px 4px}",
    ".bj-hero .bj-hnome{font-size:.95rem}.bj-hero .bj-hfiches{font-size:.75rem}",
    ".bj-hero .bj-av{width:30px!important;height:30px!important}",
    ".bj-hcarte{min-height:0;gap:6px}.bj-hcarte .cc{width:50px}.bj-hcarte.doppia .cc{width:40px}",
    ".bj-mano{padding:3px}",
    ".bj-hero .bj-pt{margin-top:3px!important;height:22px;font-size:.78rem}",
    ".bj-azioni{gap:6px}",
    ".bj-btn{flex:1 1 20%;min-width:0;min-height:42px;font-size:.88rem;border-radius:12px}",
    ".bj-punta-val{font-size:1.7rem}",
    ".bj-sbtn{min-height:38px;font-size:.92rem}",
    ".bj-wrap{min-height:0;gap:6px}",
    // la scritta grande sulla parete: chi sta giocando
    ".bj-turno{position:absolute;z-index:5;pointer-events:none;left:50%;top:10px;transform:translateX(-50%);text-align:center;font-weight:900;font-size:1.25rem;color:#ffe066;text-shadow:0 2px 10px rgba(0,0,0,.7),0 0 18px rgba(255,200,60,.35);white-space:nowrap;max-width:78%;overflow:hidden;text-overflow:ellipsis;line-height:1.1}",
    ".bj-turno small{display:block;font-size:.72rem;color:#ffe58a;opacity:.85;font-weight:800}",
    // sotto: tasti ai lati delle carte
    ".bj-hriga{display:flex;align-items:center;gap:8px;width:100%}",
    ".bj-col{flex:0 0 26%;display:flex;flex-direction:column;gap:8px}",
    ".bj-col .bj-btn{flex:none;width:100%;min-height:54px;font-size:.92rem}",
    ".bj-hcentro{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center}",
    ".bj-hcarte{flex-wrap:nowrap}.bj-hcarte .cc{flex:none}",
    ".bj-mani{flex-wrap:nowrap;gap:8px}.bj-mano .bj-pt{white-space:nowrap}",
    ".bj-col{flex:0 0 24%}",
    ".bj-esiti{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 12px;font-size:.78rem;color:#ffe58a;max-height:62px;overflow:hidden}.bj-esiti b{color:#fff}",
    // IL BLACK JACK OCCUPA ESATTAMENTE LO SCHERMO: niente da scorrere; sotto altezza fissa, il tavolo prende il resto
    ".bj-wrap{position:fixed;top:0;bottom:0;left:0;right:0;max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:6px;padding:6px 6px calc(6px + env(safe-area-inset-bottom));z-index:5;border-radius:0}",
    ".bj-sala{flex:1 1 auto;min-height:0;margin:0}",
    ".bj-hero{flex:0 0 150px;height:150px;min-height:0;justify-content:center;overflow:hidden}",
    ".bj-msg:empty,.bj-wrap .bj-tavolata{display:none}",
    // con 7-10 giocatori sopra la testa solo il nome (corto); uno su e uno giù, così non si coprono
    ".bjr-nome.mini{overflow:hidden;text-overflow:ellipsis;padding:0 4px}",
    // il tempo per decidere (lo tiene l'host): in alto a destra; rosso negli ultimi secondi
    ".bj-turno{max-width:66%}",
    ".bj-tempo{position:absolute;top:8px;right:8px;z-index:7;pointer-events:none;background:rgba(0,0,0,.62);color:#fff;border:1.5px solid rgba(255,255,255,.25);border-radius:12px;padding:1px 9px;font-weight:900;font-size:.9rem;white-space:nowrap}",
    ".bj-tempo.urge{background:#c92a2a;border-color:#ffb3b3}",
    // il consiglio della mossa giusta: il tasto brilla
    ".bj-btn.bj-cons{box-shadow:0 0 0 3px #fff6b0,0 0 16px rgba(255,240,150,.85)}",
    ".bj-hmini{font-size:.72rem;color:#ffe58a;opacity:.9;text-align:center}",
    ".bj-esiti .piu{color:#7dffa8}.bj-esiti .meno{color:#ff9d8a}.bj-esiti.fitti{font-size:.7rem;gap:1px 9px}",
    // domanda d'uscita nello stile del tavolo
    ".bj-dlg{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6)}",
    ".bj-dlg-box{width:100%;max-width:320px;background:linear-gradient(#174a2e,#0c3420);border:2px solid #ffd45e;border-radius:18px;padding:16px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.6);animation:bjrPopD .22s cubic-bezier(.3,1.5,.5,1)}",
    ".bj-dlg-box b{display:block;font-size:1.15rem;margin-bottom:6px}.bj-dlg-box p{margin:0 0 12px;color:#ffe58a;font-size:.9rem}",
    "@keyframes bjrPopD{from{transform:scale(.6);opacity:0}}",
    // fine partita: la classifica sul tavolo
    ".bj-podio{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:10px 12px 70px;background:rgba(6,22,13,.84);animation:bjrPopD .35s ease}",
    ".bj-podio h3{margin:0 0 6px;color:#ffe066;font-size:1.3rem;text-shadow:0 2px 10px rgba(0,0,0,.6)}",
    ".bj-pr{display:flex;align-items:center;gap:8px;width:100%;max-width:330px;background:rgba(255,255,255,.08);border-radius:10px;padding:3px 10px;font-weight:800}",
    ".bj-pr.oro{background:linear-gradient(90deg,rgba(255,214,90,.35),rgba(255,214,90,.08));border:1px solid rgba(255,214,90,.6)}",
    ".bj-pr .md{width:26px;text-align:center}.bj-pr .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}",
    ".bj-pr .nt{white-space:nowrap}.bj-pr .nt.piu{color:#7dffa8}.bj-pr .nt.meno{color:#ff9d8a}.bj-pr .ff{color:#ffe58a;font-size:.8em;white-space:nowrap}",
    ".bj-podio.fitto{gap:2px}.bj-podio.fitto .bj-pr{padding:1px 8px;font-size:.8rem}"
  ].join("");

  function iniettaCSS() {
    if (document.getElementById("bj-css")) return;
    var st = document.createElement("style"); st.id = "bj-css"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---------- avatar: il croupier (un bot fisso) + i giocatori ai loro posti ----------
  var MATT_DEALER = { forma: "uomo", corpo: "medio", pelle: 2, capelli: "indietro", colCap: 1, barba: "corta", capo: "giacca", maglia: 7,
    collo: "papillon", colCollo: 0, sopracc: "decise", occhi: "furbi", bocca: "ghigno" };
  var FACCE = {
    normale: {},
    pensa: { occhi: "assonnati", sopracc: "alzate", bocca: "neutro" },
    esulta: { occhi: "felici", sopracc: "alzate", bocca: "sorrisone" },
    triste: { occhi: "dolci", sopracc: "preoccupate", bocca: "smorfia" }
  };
  var svgCache = {};
  function svgAvatar(cfg, faccia, opts) {
    var k = JSON.stringify(cfg) + "|" + faccia + "|" + (opts && opts.busto ? "b" : "");
    if (!svgCache[k]) {
      var c = {}, x = FACCE[faccia] || {}, n;
      for (n in cfg) c[n] = cfg[n];
      for (n in x) c[n] = x[n];
      svgCache[k] = SGOmino.svg(c, opts);
    }
    return svgCache[k];
  }
  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // il banco è uno dei bot fissi (SG.bot: di partenza Matt, il campione), vestito da croupier: giacca e papillon,
  // faccia, capelli e occhiali suoi (così si riconosce). Si sceglie a inizio partita e va nel vm (gli ospiti lo leggono da lì).
  var DIVISA = { capo: "giacca", maglia: 7, collo: "papillon", colCollo: 0, mano: "nessuno", animale: "nessuno", schiena: "nessuna", borsa: "nessuna" };
  function croupierDa(nomi) {
    var b = window.SG && SG.bot ? SG.bot.prendi(1, { livello: "difficile", escludi: nomi || [] })[0] : null;
    if (!b) return null;
    var cfg = {}, n;
    for (n in (b.omino || MATT_DEALER)) cfg[n] = (b.omino || MATT_DEALER)[n];
    for (n in DIVISA) cfg[n] = DIVISA[n];
    return { id: b.id, nome: b.nome, omino: cfg };
  }
  function nomeBanco(vm) { return (vm && vm.croupier && vm.croupier.nome) || "Bot"; }
  function avatarBanco(vm) { return (vm && vm.croupier && avatarValido(vm.croupier.omino)) || MATT_DEALER; }

  // ---- suoni (Web Audio) ----
  // la vibrazione al tocco dei tasti la fa già l'app (una sola, solo quando si sceglie): qui nessun vibra()
  function bip(freqDa, freqA, dur, tipo, vol) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo || "triangle";
      o.frequency.setValueAtTime(freqDa, t);
      if (freqA && freqA !== freqDa) o.frequency.exponentialRampToValueAtTime(freqA, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  // i suoni del tavolo (carte, vincite) non vibrano mai
  function suonoCarta() { bip(300, 420, 0.09, "triangle", 0.18); }
  function suonoStai() { bip(240, 200, 0.1, "sine", 0.14); }
  function suonoChip() { bip(660, 880, 0.07, "square", 0.12); }
  function suonoSballo() { bip(220, 90, 0.35, "sawtooth", 0.22); }
  function suonoVinci() { bip(520, 660, 0.12, "triangle", 0.22); setTimeout(function () { bip(700, 900, 0.16, "triangle", 0.22); }, 110); }
  function suonoBlackjack() { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { bip(f, f, 0.14, "triangle", 0.22); }, i * 90); }); }
  function suonoPerdi() { bip(300, 180, 0.22, "sine", 0.16); }
  function suonoTic() { bip(880, 880, 0.05, "sine", 0.08); }

  function cartaEl(el, c, coperta, cls) {
    return el("div", { class: "cc " + (cls || ""), html: BJ.cartaHTML(c, coperta) });
  }

  function fmtTempo(ms) {
    var s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? (h + "h " + m + "m") : (m > 0 ? (m + "m") : "poco");
  }
  // riquadro con saldo fiches + tasto per la ruota del giorno (monete o XP, un giro al giorno: torna a mezzanotte)
  // dopo(nuovo, piu) = facoltativo, avvisa chi lo usa (es. la saletta online) del nuovo saldo e di quante monete sono arrivate
  // compatto: la versione bassa per la saletta online (così la saletta sta in uno schermo da 360x640 senza scorrere)
  function riquadroBonus(el, dopo, compatto) {
    var box = el("div", { style: "background:var(--carta,#1b1836);border-radius:14px;text-align:center;box-shadow:var(--ombra,0 6px 16px rgba(0,0,0,.3));" + (compatto ? "padding:7px 10px;margin-bottom:0" : "padding:12px;margin-bottom:12px") });
    var saldo = SGNube.monete ? SGNube.monete() : 0;   // le fiches sono le Speed Coins del profilo
    var testoSaldo = el("div", { style: "color:#ffe58a;font-weight:800;" + (compatto ? "font-size:.95rem;margin-bottom:5px" : "font-size:1.1rem;margin-bottom:8px"), html: "🪙 Hai <b>" + fmt(saldo) + "</b> monete" });
    var b = el("button", { class: "btn btn-primario", style: "margin:0" + (compatto ? ";min-height:0;padding:8px 12px;font-size:.92rem" : "") });
    function agg() {
      if (SGNube.puoRitirareBonus()) { b.disabled = false; b.textContent = "🎡 Gira la ruota del giorno: monete o XP"; }
      else { b.disabled = true; b.textContent = "⏳ Nuovo giro della ruota tra " + fmtTempo(SGNube.prossimoBonusMs()) + " (a mezzanotte)"; }
    }
    b.onclick = function () {
      if (!(window.SG && SG.ruotaDelGiorno)) return;
      var prima = SGNube.monete ? SGNube.monete() : 0;
      SG.ruotaDelGiorno(function (res) {
        var piu = res.coins - prima;
        testoSaldo.innerHTML = "🪙 Hai <b>" + fmt(res.coins) + "</b> monete" + (piu > 0 ? "  ·  +" + fmt(piu) + " 🎉" : "");
        if (piu > 0) suonoChip();
        agg();
        if (dopo && piu) dopo(res.coins, piu);
      });
    };
    agg();
    box.appendChild(testoSaldo); box.appendChild(b);
    return box;
  }

  // serie di Black Jack di fila nella sessione al tavolo (si azzera quando si esce)
  var sessioneBJ = { fila: 0, filaMax: 0 };
  function nuovaSessioneBJ() { sessioneBJ = { fila: 0, filaMax: 0 }; }

  // a fine mano salva fiches + statistiche (per i trofei) del giocatore col profilo (non in prova)
  function salvaFineMano(g, vm) {
    if (!g || !g.mani || !g.mani.length || !(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;   // mano guardata: niente da salvare
    var s0 = SGNube.statGioco("blackjack") || {};
    var sv = s0.serieVinteOra || 0, ss = s0.serieSconfitteOra || 0, svMax = 0, ssMax = 0;   // serie che continuano tra le sessioni
    var bancoSballa = vm && vm.banco && vm.banco.length ? BJ.punteggio(vm.banco) > 21 : false;
    var c = { maniGiocate: 0, maniVinte: 0, blackjackFatti: 0, fichesVinteTot: 0, maniSballate: 0, maniPari: 0,
              vinteSballoBanco: 0, ventunoTre: 0, vinte5carte: 0 };
    var vincMax = 0, puntataVintaMax = 0;
    g.mani.forEach(function (m) {
      var pm = BJ.punteggio(m.carte), vinta = m.esito === "vince" || m.esito === "blackjack";
      c.maniGiocate++;
      if (vinta) {
        c.maniVinte++;
        if (bancoSballa && pm <= 21) c.vinteSballoBanco++;          // vinta perché il banco ha sballato
        if (m.carte.length >= 5 && pm <= 21) c.vinte5carte++;          // funambolo: vinta con 5+ carte
        if (m.puntata > puntataVintaMax) puntataVintaMax = m.puntata;  // puntata più alta mai vinta
      }
      if (m.esito === "blackjack") c.blackjackFatti++;
      if (pm > 21) c.maniSballate++;
      if (m.esito === "pari") c.maniPari++;
      if (pm === 21 && m.carte.length >= 3) c.ventunoTre++;            // 21 esatto con 3 o più carte
      var netto = (m.vincita || 0) - m.puntata;
      if (netto > 0) { c.fichesVinteTot += netto; if (netto > vincMax) vincMax = netto; }
      // serie di fila: vinte / perse / black jack
      if (vinta) { sv++; ss = 0; } else if (m.esito === "perde") { ss++; sv = 0; } else { sv = 0; ss = 0; }
      if (sv > svMax) svMax = sv; if (ss > ssMax) ssMax = ss;
      if (m.esito === "blackjack") sessioneBJ.fila++; else sessioneBJ.fila = 0;
      if (sessioneBJ.fila > sessioneBJ.filaMax) sessioneBJ.filaMax = sessioneBJ.fila;
    });
    var incrs = []; for (var k in c) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(g.fiches, "blackjack", incrs,
      [["recordFiches", g.fiches], ["vincitaMax", vincMax], ["puntataVintaMax", puntataVintaMax],
       ["serieVinteMax", svMax], ["serieSconfitteMax", ssMax], ["serieBJMax", sessioneBJ.filaMax]],
      [["serieVinteOra", sv], ["serieSconfitteOra", ss]]);
  }

  // ---- vista (vm): stessa forma dello stato; serve sia il locale sia
  //      l'online (le carte del Black Jack sono scoperte per tutti). ----
  function cp(c) { return { s: c.s, v: c.v }; }
  function contaCarte(g) { var n = 0; (g.mani || []).forEach(function (m) { n += m.carte.length; }); return n; }
  // extra = { consigli } (le regole scelte che servono solo al disegno)
  function vistaBJ(st, extra) {
    var scoperta = st.fase === "banco" || st.fase === "esito" || st.fase === "fine";
    return {
      fase: st.fase, giro: st.giro, mano: st.mano, maniTot: st.maniTot, rimescolato: st.rimescolato, turno: st.turno,
      annuncio: st.annuncio ? { seat: st.annuncio.seat, testo: st.annuncio.testo, id: st.annuncio.id } : null,
      puntataMin: st.min, consigli: !!(extra && extra.consigli), croupier: st.croupier || null,
      // la carta coperta del banco non parte finché non si gira (nessuno la può sbirciare)
      banco: st.banco.carte.map(function (c, k) { return (k === 1 && !scoperta) ? { s: 0, v: 0, cop: 1 } : cp(c); }),
      classifica: st.fase === "fine" ? st.classifica : null,
      giocatori: st.giocatori.map(function (g) {
        return { id: g.id, rid: g.rid || null, nome: g.nome, fiches: g.fiches, puntata: g.puntata, assicura: g.assicura, attiva: g.attiva,
          via: !!g.via, dec: !!g.decisoAssic, salta: !!g.salta, prova: !!g.prova,
          mani: g.mani.map(function (m) { return { carte: m.carte.map(cp), chiusa: m.chiusa, esito: m.esito, vincita: m.vincita, puntata: m.puntata, divisa: !!m.divisa }; }) };
      })
    };
  }
  function mosseValideVm(vm) {
    var g = vm.giocatori[vm.turno]; if (!g) return {};
    var m = g.mani[g.attiva] || { carte: [] }, due = m.carte.length === 2;
    return { carta: true, stai: true,
      raddoppia: due && g.fiches >= m.puntata,
      dividi: due && BJ.valoreCarta(m.carte[0].v) === BJ.valoreCarta(m.carte[1].v) && g.fiches >= m.puntata && g.mani.length < 4 };
  }

  // ---- il tavolo: disegna da un vm e chiama i callback del "driver".
  //      mioIdx = il seat del giocatore su QUESTO telefono. ----
  function tavoloBJ(t, drv) {
    iniettaCSS();
    var el = t.el;
    var s = t.schermata({
      titolo: "🃏 Black Jack", sotto: drv.sotto || "Banco: Bot",
      indietro: function () { chiediUscita(); }
    });
    var wrap = el("div", { class: "bj-wrap" });
    var zBanco = el("div", { class: "bj-sala" }), zHero = el("div", { class: "bj-hero" }),
        zMsg = el("div", { class: "bj-msg" }), zTav = el("div", { class: "bj-tavolata" });
    [zBanco, zHero, zMsg, zTav].forEach(function (z) { wrap.appendChild(z); });
    var mazzo = el("div", { class: "bj-mazzo" }, [
      el("div", { class: "r", html: BJ.retroSVG() }),
      el("div", { class: "r", html: BJ.retroSVG() }),
      el("div", { class: "r", html: BJ.retroSVG() })
    ]);
    wrap.appendChild(mazzo);
    mazzo.style.visibility = "hidden";   // il mazzo non si vede (spazio al tavolo): le carte partono da Bot
    s._contenuto.appendChild(wrap); t.mostra(s);
    document.body.classList.add("bj-verde");
    // il core può portarci via dal tavolo senza passare da qui (la Sala che passa a un amico, «Cambia gioco»): appena il
    // tavolo non è più nella pagina si chiude da solo (via lo sfondo verde e i tempi), se no il verde resterebbe sotto la Sala
    // (drv.portatoVia: chi era seduto da amico a metà mano riprende la sua puntata, come quando l'host lascia il tavolo)
    var guardia = setInterval(function () { if (!document.body.contains(wrap)) { chiudi(); if (drv.portatoVia) drv.portatoVia(); } }, 400);
    // se lo schermo cambia misura (barre del telefono, rotazione) il tavolo si ridisegna sulla misura nuova
    function suResize() { if (vm && !chiuso && document.body.contains(wrap)) disegnaScena(); }
    window.addEventListener("resize", suResize);

    var vm = null, anim = { ultima: -1, banco: false }, timerPasso = null, daVolare = [], puntSel = null, chiuso = false;
    var bolla = null, bollaId = -1, bollaTimer = null;   // nuvoletta della mossa
    var scopri = { attesa: false, t: null };   // la carta coperta di Bot si gira solo quando la telecamera è arrivata
    var heroK = null, bloccoT = null;          // la parte di sotto si rifà solo se cambia; i tasti bloccati dopo un tocco
    var tempo = { el: el("div", { class: "bj-tempo", hidden: "hidden" }), fine: 0, k: "", int: null, ultimoS: -1 };
    zBanco.appendChild(tempo.el);
    function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }
    // ci si alza dal tavolo: tutti i tempi si fermano (niente mani che vanno avanti senza schermata)
    function chiudi() {
      if (chiuso) return;
      chiuso = true;
      clearInterval(guardia);
      [timerPasso, bollaTimer, scopri.t, bloccoT].forEach(function (x) { if (x) clearTimeout(x); });
      if (tempo.int) clearInterval(tempo.int);
      intro.stop = true;
      window.removeEventListener("resize", suResize);
      document.body.classList.remove("bj-verde");
    }
    // la domanda "ti alzi?" nello stile del tavolo (non la finestrella grigia del telefono)
    function chiediUscita() {
      if (chiuso) return;
      var vecchia = wrap.querySelector(".bj-dlg"); if (vecchia) { vecchia.remove(); return; }
      var avviso = drv.avvisoUscita ? drv.avvisoUscita(vm) : "";
      var dlg = el("div", { class: "bj-dlg" }, [ el("div", { class: "bj-dlg-box" }, [
        el("b", { text: drv.domandaUscita || "Ti alzi dal tavolo?" }),
        avviso ? el("p", { text: avviso }) : null,
        el("div", { class: "bj-azioni" }, [
          el("button", { class: "bj-btn bj-b-no", text: "Resto", onclick: function () { dlg.remove(); } }),
          el("button", { class: "bj-btn bj-b-stai", text: "Mi alzo", onclick: function () { dlg.remove(); chiudi(); drv.onEsci(); } })
        ])
      ]) ]);
      dlg.onclick = function (e) { if (e.target === dlg) dlg.remove(); };
      wrap.appendChild(dlg);
    }
    function mioIdx() { return drv.mioIdx ? drv.mioIdx() : vm.turno; }
    // chi sta decidendo adesso: online puntate e assicurazione si fanno tutti insieme
    function decide(i) {
      if (vm.fase === "punta") return drv.mioIdx ? puoPuntare(vm, i) : i === vm.turno;
      if (vm.fase === "assic") return drv.mioIdx ? deveAssic(vm, i) : i === vm.turno;
      return vm.fase === "gioca" && i === vm.turno;
    }
    // il posto che QUESTO telefono deve far decidere (puntata o assicurazione), o -1
    function chiDecide() {
      if (!drv.mioIdx) return vm.turno;   // un telefono solo: uno alla volta
      var i = mioIdx(); return decide(i) ? i : -1;
    }

    function aggiorna(nuovo) {
      if (chiuso) return;
      var pre = vm; vm = nuovo;
      if (vm.fase !== "punta") puntSel = null;
      aggiornaTempo();
      anim = { ultima: -1, banco: false }; daVolare = [];
      if (pre && vm.fase === "banco" && pre.fase !== "banco") {
        scopri.attesa = true; clearTimeout(scopri.t);
        scopri.t = setTimeout(function () { scopri.attesa = false; if (vm && document.body.contains(wrap)) disegnaScena(); }, 1150);
      } else if (vm.fase !== "banco") { scopri.attesa = false; clearTimeout(scopri.t); }
      applicaDiff(pre, vm);
      if (vm.annuncio && vm.annuncio.id !== bollaId) {   // nuova mossa: mostra la nuvoletta ~2,2s
        bollaId = vm.annuncio.id; bolla = { seat: vm.annuncio.seat, testo: vm.annuncio.testo };
        if (bollaTimer) clearTimeout(bollaTimer);
        bollaTimer = setTimeout(function () { bolla = null; if (!chiuso) disegnaTavolata(); }, 2200);
      }
      if (pre && pre.fase !== "esito" && vm.fase === "esito" && drv.onFineMano) drv.onFineMano(vm);
      if (pre && pre.fase !== "fine" && vm.fase === "fine" && drv.onFinePartita) drv.onFinePartita(vm);
      disegnaScena(); disegnaHero();
      daVolare.forEach(volaDalMazzo);
      programmaPasso();
    }
    // il conto alla rovescia arriva dall'host (vm.tempo = { k, ms }): qui si mostra e basta
    function aggiornaTempo() {
      var tv = vm.tempo;
      if (!tv) { tempo.k = ""; tempo.el.hidden = true; if (tempo.int) { clearInterval(tempo.int); tempo.int = null; } return; }
      if (tv.k !== tempo.k || Math.abs(Date.now() + tv.ms - tempo.fine) > 1500) { tempo.k = tv.k; tempo.fine = Date.now() + tv.ms; tempo.ultimoS = -1; }
      if (!tempo.int) tempo.int = setInterval(scriviTempo, 250);
      scriviTempo();
    }
    function scriviTempo() {
      if (chiuso || !vm || !vm.tempo) return;
      var sec = Math.max(0, Math.ceil((tempo.fine - Date.now()) / 1000));
      if (sec === tempo.ultimoS) return;
      tempo.ultimoS = sec; tempo.el.hidden = false;
      tempo.el.textContent = "⏱ " + sec;
      tempo.el.className = "bj-tempo" + (sec <= 5 ? " urge" : "");
      if (sec <= 5 && sec > 0 && chiDecide() >= 0 && drv.mioIdx) suonoTic();   // tocca a me e il tempo sta finendo
    }
    // La carta appena distribuita parte dal mazzo e "vola" fino alla sua
    // posizione finale (tecnica FLIP: la metto dov'è, la sposto sul mazzo, la libero).
    function volaDalMazzo(cardEl) {
      var m = mazzo.getBoundingClientRect(), c = cardEl.getBoundingClientRect();
      if (!c.width || !m.width) return;
      var dx = (m.left + m.width / 2) - (c.left + c.width / 2);
      var dy = (m.top + m.height / 2) - (c.top + c.height / 2);
      var sc = Math.max(0.32, m.width / c.width);
      cardEl.style.transition = "none";
      cardEl.style.transformOrigin = "50% 50%";
      cardEl.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + sc + ")";
      cardEl.style.opacity = "0.5";
      cardEl.getBoundingClientRect();   // forza il reflow
      requestAnimationFrame(function () {
        cardEl.style.transition = "transform .52s cubic-bezier(.2,.85,.3,1), opacity .3s ease";
        cardEl.style.transform = "";
        cardEl.style.opacity = "1";
      });
    }
    function manoChiusaAttiva() {
      if (!vm || vm.fase !== "gioca") return false;
      var g = vm.giocatori[vm.turno]; if (!g) return false;
      var m = g.mani[g.attiva]; return !!(m && m.chiusa);
    }
    // dopo "Dividi" la mano che tocca ha una carta sola: Bot le dà la seconda
    function manoDaCompletare() {
      if (!vm || vm.fase !== "gioca") return false;
      var g = vm.giocatori[vm.turno]; if (!g) return false;
      var m = g.mani[g.attiva]; return !!(m && !m.chiusa && m.carte.length === 1);
    }
    // Chi guida il motore (locale/host) scandisce i tempi con calma: distribuzione
    // e banco una carta alla volta, e dopo che una mano si chiude lascia qualche
    // secondo per vedere la carta prima di passare il turno.
    function programmaPasso() {
      if (timerPasso) { clearTimeout(timerPasso); timerPasso = null; }
      if (chiuso || !(drv.guida && drv.guida())) return;
      var N = vm.giocatori.length;   // più siete, più veloce si distribuisce (con 10 al tavolo non si aspetta mezzo minuto)
      if (vm.fase === "distrib") timerPasso = setTimeout(function () { drv.onPasso("distrib"); }, N <= 3 ? 1050 : (N <= 6 ? 650 : 420));
      else if (vm.fase === "banco") timerPasso = setTimeout(function () { drv.onPasso("banco"); }, scopri.attesa ? 2800 : 1300);
      else if (manoDaCompletare()) timerPasso = setTimeout(function () { drv.onPasso("divisa"); }, 900);
      else if (manoChiusaAttiva()) {
        var g = vm.giocatori[vm.turno], m = g.mani[g.attiva], p = BJ.punteggio(m.carte);
        var pausa = p > 21 ? 1800 : (BJ.eBJ(m) ? 1600 : 1200);
        timerPasso = setTimeout(function () { drv.onPasso("avanza"); }, pausa);
      }
    }
    function applicaDiff(pre, v) {
      if (!pre) return;
      var rivelato = (v.fase === "banco" || v.fase === "esito") && !(pre.fase === "banco" || pre.fase === "esito");
      if (v.banco.length > pre.banco.length || rivelato) anim.banco = true;
      if (v.banco.length > pre.banco.length) suonoCarta();
      for (var i = 0; i < v.giocatori.length; i++) {
        if (contaCarte(v.giocatori[i]) > (pre.giocatori[i] ? contaCarte(pre.giocatori[i]) : 0)) {
          anim.ultima = i;
          var g = v.giocatori[i], m = g.mani[g.attiva] || g.mani[g.mani.length - 1];
          suonoCarta(); if (m && BJ.punteggio(m.carte) > 21) setTimeout(suonoSballo, 90);
          break;
        }
      }
      if (v.fase === "esito" && pre.fase !== "esito") {
        var delta = 0, bj = false;
        v.giocatori.forEach(function (g) { g.mani.forEach(function (m) { delta += (m.vincita - m.puntata); if (m.esito === "blackjack") bj = true; }); });
        setTimeout(function () { if (bj) suonoBlackjack(); else if (delta > 0) suonoVinci(); else if (delta < 0) suonoPerdi(); }, 420);
      }
    }

    // ============ LA REGIA: tavolo ovale, persone sedute lungo il bordo lontano, telecamera che inquadra chi gioca ============
    var FICHE = [[250, "#7b3fe4"], [50, "#26262b"], [10, "#1c7ed6"]];
    function puntataDi(g) { return g.mani && g.mani.length ? g.mani.reduce(function (s, m) { return s + m.puntata; }, 0) : (g.puntata || 0); }
    function nettoDi(g) { var n = 0; g.mani.forEach(function (m) { n += m.vincita - m.puntata; }); return n; }
    function facciaDi(g, idx) {
      var m = g.mani[g.attiva] || g.mani[0];
      if (vm.fase === "fine") { var rc = rigaClass(idx); return rc && rc.netto > 0 ? "esulta" : (rc && rc.netto < 0 ? "triste" : "normale"); }
      if (vm.fase === "esito") { var n = nettoDi(g); return n > 0 ? "esulta" : (n < 0 ? "triste" : "normale"); }
      if (m && BJ.punteggio(m.carte) > 21) return "triste";
      if (m && BJ.eBJ(m)) return "esulta";
      if (decide(idx)) return "pensa";
      return "normale";
    }
    function rigaClass(idx) { var l = vm.classifica || []; for (var i = 0; i < l.length; i++) if (l[i].i === idx) return l[i]; return null; }
    // Bot nell'angolo: la faccia e la battuta giusta per quello che succede al tavolo
    function faccinaMatt() {
      var pB = vm.banco.length ? BJ.punteggio(vm.banco) : 0, r = { faccia: "normale", fum: null, oro: false }, seme = vm.giro || 0;
      if (vm.fase === "punta") {
        var tutto = vm.giocatori.some(function (g) { return g.puntata > 0 && g.fiches === 0; });
        r.fum = frase(tutto ? "tutto" : (vm.rimescolato ? "rimescola" : "punta"), seme);
        if (tutto) r.faccia = "pensa";
      }
      else if (vm.fase === "distrib") r.fum = frase("distrib", seme);
      else if (vm.fase === "gioca") {   // la mano di chi gioca si è appena chiusa: Bot commenta
        var g = vm.giocatori[vm.turno], m = g && g.mani[g.attiva];
        if (m && m.chiusa) {
          var p = BJ.punteggio(m.carte), sm = seme * 3 + vm.turno + g.attiva;
          if (p > 21) { r.faccia = "esulta"; r.fum = frase("sballa", sm); }
          else if (BJ.eBJ(m)) { r.faccia = "triste"; r.fum = frase("bj", sm); r.oro = true; }
          else if (p === 21) { r.fum = frase("ventuno", sm); }
        }
      }
      else if (vm.fase === "banco") r.faccia = pB > 21 ? "triste" : "pensa";
      else if (vm.fase === "esito") {
        var netto = 0, giocate = 0; vm.giocatori.forEach(function (g) { netto += nettoDi(g); giocate += g.mani.length; });
        if (pB > 21) { r.faccia = "triste"; r.fum = frase("bancoSballa", seme); }
        else if (BJ.eBlackjack(vm.banco)) { r.faccia = "esulta"; r.fum = frase("bancoBJ", seme); r.oro = true; }
        else if (netto < 0) { r.faccia = "esulta"; r.fum = frase("bancoVince", seme); }
        else if (netto > 0) { r.faccia = "triste"; r.fum = frase("vincete", seme); }
        else if (giocate) r.fum = frase("pari", seme);
      }
      else if (vm.fase === "fine") { r.faccia = "esulta"; r.fum = frase("fine", seme); }
      return r;
    }
    function cartaR(c, w, nuova, coperta) { var d = el("div", { class: "bjr-carta" + (nuova ? " arriva" : ""), html: BJ.cartaHTML(c, coperta) }); d.style.width = w + "px"; return d; }

    var cam = el("div", { class: "bjr-cam" }), capt = el("div", { class: "bj-turno" });
    // Bot con quanto ha il banco: fuori dalla telecamera, così si vede sempre (anche quando zooma su chi gioca)
    var hud = el("div", { class: "bjr-matt" }, [ el("div", { class: "bj-av" }), el("div", { class: "bjr-matt-nome" }) ]), fumEl = null;
    hud.onclick = function () { sbircia(-1); };
    zBanco.appendChild(cam); zBanco.appendChild(capt); zBanco.appendChild(hud);
    var R = null;   // il mondo costruito: si rifà solo se cambia il numero di giocatori o la misura dello schermo

    function costruisci() {
      var N = vm.giocatori.length, W = zBanco.clientWidth, H = zBanco.clientHeight;
      svuota(cam); cam.style.transition = "none"; cam.style.transform = "none";
      cam.appendChild(el("div", { class: "bjr-muro" }));
      var strato = el("div", { class: "bjr-strato" }), prosp = el("div", { class: "bjr-prosp", style: "perspective:" + Math.round(H * 1.8) + "px" });
      var PW = Math.round(W * 1.55), PH = Math.round(H * 1.0), PWi = PW - 26, PHi = PH - 26;
      var piano = el("div", { class: "bjr-piano", style: "width:" + PW + "px;height:" + PH + "px;margin-left:" + (-PW / 2) + "px;bottom:" + Math.round(-PH * 0.1) + "px" });
      var panno = el("div", { class: "bjr-panno" }), sopra = el("div", { class: "bjr-sopra" });
      piano.appendChild(panno); prosp.appendChild(piano);
      [strato, prosp, sopra].forEach(function (z) { cam.appendChild(z); });
      function su(x, y, nodo) { nodo.style.left = Math.round(x) + "px"; nodo.style.top = Math.round(y) + "px"; panno.appendChild(nodo); return nodo; }
      var cx = PWi / 2, cy = PHi / 2, rx = PWi / 2, ry = PHi / 2;
      var ampiezza = N === 1 ? 0 : Math.min(98, 40 + N * 11);   // più siete, più l'arco si allarga lungo l'ovale
      var rCarte = N > 6 ? 0.66 : 0.56, rFiche = N > 6 ? 0.84 : 0.78;
      var seg = vm.giocatori.map(function (g, i) {
        var th = (90 + ampiezza / 2 - (N === 1 ? 0 : i * ampiezza / (N - 1))) * Math.PI / 180;
        function p(r) { return [cx + rx * r * Math.cos(th), cy - ry * r * Math.sin(th)]; }
        var b = p(1.04), f = p(rFiche), c = p(rCarte);
        return { segno: su(b[0], b[1], el("div", { class: "bjr-segno" })), pila: su(f[0], f[1], el("div", { class: "bjr-pila" })), mf: su(f[0], f[1], el("div", { class: "bjr-segno" })),
                 cc: su(c[0], c[1], el("div", { class: "bjr-cc cascata" })), mira: su(c[0], c[1], el("div", { class: "bjr-segno" })),
                 spazio: N === 1 ? 999 : rx * rCarte * (ampiezza / (N - 1)) * Math.PI / 180 };
      });
      var bancoCC = su(cx, PHi * 0.8, el("div", { class: "bjr-cc" })), bancoMira = su(cx, PHi * 0.8, el("div", { class: "bjr-segno" }));
      // misuro dove sono finiti (telecamera ferma) e siedo le persone dietro al bordo
      var zr = zBanco.getBoundingClientRect();
      function pt(n) { var r = n.getBoundingClientRect(); return { x: r.left + r.width / 2 - zr.left, y: r.top + r.height / 2 - zr.top, sc: r.width / 100 }; }
      var base = (N <= 4 ? 150 : (N <= 6 ? 120 : 100)) * Math.max(1, Math.min(1.4, H / 340));
      var punti = seg.map(function (s) { return pt(s.segno); });
      seg.forEach(function (s, i) {
        var p = punti[i], vic = 999;
        [i - 1, i + 1].forEach(function (j) { if (j >= 0 && j < N) vic = Math.min(vic, Math.hypot(punti[j].x - p.x, punti[j].y - p.y)); });
        var w = Math.round(Math.min(base * Math.max(0.7, Math.min(1.4, p.sc)), vic * (N > 6 ? 1.75 : 1.35)));
        var testa = Math.round(p.y - w * 0.9); if (testa < 52) { w = Math.max(30, Math.round((p.y - 52) / 0.9)); testa = Math.round(p.y - w * 0.9); }
        s.x = p.x; s.y = p.y; s.w = w; s.testa = testa; s.carte = pt(s.mira); s.fp = pt(s.mf);
        s.fig = el("div", { class: "bjr-gioc", style: "left:" + Math.round(p.x - w / 2) + "px;top:" + testa + "px;width:" + w + "px;z-index:" + Math.round(p.y) });
        s.fig.onclick = function () { sbircia(i); };
        strato.appendChild(s.fig);
        // con 7-10 giocatori: solo il nome, largo al massimo quanto lo spazio tra due vicini, e uno su e uno giù
        var largo = N > 6 ? "max-width:" + Math.max(34, Math.round(vic * 2 - 6)) + "px;" : "";
        s.top0 = testa + Math.round(w * 0.06);
        s.nome = el("div", { class: "bjr-nome" + (N > 6 ? " mini" : ""), style: largo + "left:" + Math.round(p.x) + "px;top:" + s.top0 + "px" });
        s.fval = el("div", { class: "bjr-fval", style: "left:" + Math.round(s.fp.x) + "px;top:" + Math.round(s.fp.y - 10) + "px;opacity:0" });   // il valore sopra la pila
        sopra.appendChild(s.nome); sopra.appendChild(s.fval);
        s.cw = N > 6 ? 20 : (N > 4 ? 28 : 34);
        var fd = N > 6 ? 22 : 32; s.pila.style.width = s.pila.style.height = fd + "px";
        s.k = {};   // cosa è già disegnato (per non rifare niente che non è cambiato)
      });
      var bm = pt(bancoMira);
      R = { N: N, W: W, H: H, seg: seg, bancoCC: bancoCC, bx: bm.x, by: bm.y, bsc: bm.sc || 1, sopra: sopra, k: {} };
      requestAnimationFrame(function () { cam.style.transition = ""; });
    }

    function disegnaScena() {
      if (!vm) return;
      var W = zBanco.clientWidth, H = zBanco.clientHeight, N = vm.giocatori.length;
      if (!R || R.N !== N || Math.abs(R.W - W) > 2 || Math.abs(R.H - H) > 2) costruisci();
      zTav.hidden = true;
      var nomiCambiati = false;
      mazzo.style.top = Math.round(R.by + 10) + "px"; mazzo.style.left = Math.round(R.bx - 22) + "px"; mazzo.style.right = "auto";   // le carte partono da Bot
      vm.giocatori.forEach(function (g, i) {
        var s = R.seg[i], attivo = decide(i);
        // faccia e luce di chi gioca
        var kf = facciaDi(g, i) + (attivo ? "*" : "");
        if (s.k.f !== kf) { s.k.f = kf; var cfg = avatarDi(i); s.fig.innerHTML = cfg ? svgAvatar(cfg, facciaDi(g, i)) : ""; s.fig.className = "bjr-gioc" + (attivo ? " attivo" : ""); }
        // sopra la testa: il nome e le fiche che ha (a fine mano anche quanto ha vinto o perso)
        var d = vm.fase === "esito" ? nettoDi(g) : 0;
        var kn = g.nome + "|" + attivo + "|" + d + "|" + g.fiches + "|" + !!g.via + "|" + (drv.mioIdx && i === mioIdx());
        if (s.k.n !== kn) {
          s.k.n = kn; nomiCambiati = true; s.nome.className = "bjr-nome" + (N > 6 ? " mini" : "") + (attivo ? " attivo" : "") + (g.via ? " via" : "");
          s.nome.innerHTML = "";
          if (N > 6) { s.nome.textContent = (drv.mioIdx && i === mioIdx() ? "⭐" : "") + g.nome + (g.via ? " 👋" : ""); }   // le monete si leggono sotto e nello zoom
          else {
            s.nome.appendChild(el("div", { text: g.nome + (drv.mioIdx && i === mioIdx() && N > 1 ? " ⭐" : "") + (g.via ? " 👋" : "") }));
            var rf = el("div", { class: "ff", text: fmt(g.fiches) + " 🪙" });
            if (d) rf.appendChild(el("b", { class: d > 0 ? "piu" : "meno", text: " " + (d > 0 ? "+" : "−") + fmt(Math.abs(d)) }));
            s.nome.appendChild(rf);
          }
        }
        // le fiche puntate, col valore scritto sopra (a fine mano: chi perde resta senza, chi vince vede la vincita)
        var imp = vm.fase === "esito" ? g.mani.reduce(function (a, m) { return a + (m.vincita || 0); }, 0) : puntataDi(g);
        if (s.k.p !== imp) {
          var cresce = imp > (s.k.p || 0); s.k.p = imp;
          if (!imp && s.pila.children.length) { [].forEach.call(s.pila.children, function (f) { f.classList.add("via"); }); setTimeout(function () { if (!s.k.p) svuota(s.pila); }, 650); }
          else {
            svuota(s.pila); var resto = imp, nf = 0;
            FICHE.forEach(function (f) { while (resto >= f[0] && nf < 14) { var ch = el("div", { class: "bjr-fiche", style: "background-color:" + f[1] + ";transform:translateZ(" + (nf * 2.6) + "px)" + (cresce ? ";animation-delay:" + (nf * 0.06) + "s" : ";animation:none") }); s.pila.appendChild(ch); nf++; resto -= f[0]; } });
          }
          s.fval.textContent = fmt(imp) + " 🪙"; s.fval.style.opacity = imp ? 1 : 0;
        }
        // le carte a cascata (come i croupier), col punteggio sopra; dopo "Dividi" ogni mano ha il suo mazzetto
        var nm = g.mani.length;
        var kc = g.mani.map(function (m) { return m.carte.map(function (c) { return c.v + "" + c.s; }).join(",") + ":" + (m.esito || ""); }).join("/") + "|" + g.attiva + "|" + vm.fase;
        if (s.k.c !== kc) {
          var prima = s.k.lens || [], stesse = prima.length === nm;   // appena diviso niente volo: le carte c'erano già
          s.k.c = kc; s.k.lens = g.mani.map(function (m) { return m.carte.length; }); svuota(s.cc);
          s.cc.className = "bjr-cc cascata" + (nm > 1 ? " divise" : "");
          var cw = nm > 1 ? Math.round(s.cw * (nm > 2 ? 0.62 : 0.8)) : s.cw, totW = 0;
          g.mani.forEach(function (m, h) {
            var n = m.carte.length, largo = Math.min(s.spazio * 0.74 / nm, cw * 3.2);
            var dx = n > 1 ? Math.max(5, Math.min(cw * 0.62, (largo - cw) / (n - 1))) : 0, dy = Math.min(5, dx * 0.3);
            var bw = Math.round(cw + Math.max(0, n - 1) * dx);
            var box = el("div", { class: "bjr-mn" + (nm > 1 && h === g.attiva && vm.fase === "gioca" ? " on" : "") });
            box.style.width = bw + "px"; box.style.height = Math.round(cw * 1.45 + Math.max(0, n - 1) * dy) + "px";
            totW += bw + (h ? 9 : 0);
            m.carte.forEach(function (c, k) {
              var cd = cartaR(c, cw, stesse && k >= (prima[h] || 0));
              cd.style.left = Math.round(k * dx) + "px"; cd.style.top = Math.round((n - 1 - k) * dy) + "px"; box.appendChild(cd);
            });
            if (n) {
              var pm = BJ.punteggio(m.carte), bj = BJ.eBJ(m);
              box.appendChild(el("span", { class: "bjr-punti" + (pm > 21 ? " bust" : (bj || m.esito === "vince" || m.esito === "blackjack" ? " win" : "")),
                text: (vm.fase === "esito" || vm.fase === "fine") && m.esito ? etichettaEsito(m) : (bj ? "BJ" : BJ.testo(m.carte, m.divisa)) }));
            }
            s.cc.appendChild(box);
          });
          s.ccW = totW * ((s.carte && s.carte.sc) || 1);   // quanto sono larghe sullo schermo (per lo zoom)
        }
      });
      if (nomiCambiati && N > 6) sistemaNomi();
      // le carte di Bot (vicino a noi): la coperta si gira solo quando la telecamera è arrivata
      var scoperta = (vm.fase === "banco" || vm.fase === "esito" || vm.fase === "fine") && !scopri.attesa;
      var kb = vm.banco.map(function (c) { return c.v + "" + c.s; }).join(",") + "|" + scoperta;
      if (R.k.b !== kb) {
        var pr = R.k.nb || 0, gira = R.k.cop && scoperta && pr === vm.banco.length && R.bancoCC.children[1];
        R.k.b = kb; R.k.nb = vm.banco.length; R.k.cop = !scoperta && vm.banco.length > 1;
        if (gira) giraCarta(R.bancoCC.children[1], vm.banco[1]);
        else { svuota(R.bancoCC); vm.banco.forEach(function (c, k) { R.bancoCC.appendChild(cartaR(c, 50, k >= pr && vm.banco.length > pr, !scoperta && k === 1)); }); }
      }
      // Bot nell'angolo con quanto ha il banco (sempre visibile)
      var fm = faccinaMatt(), pB = testoBanco(scoperta);
      var km = fm.faccia + "|" + fm.fum + "|" + pB + "|" + vm.fase + "|" + nomeBanco(vm);
      if (R.k.m !== km) {
        R.k.m = km;
        hud.className = "bjr-matt" + (vm.fase === "banco" ? " turno" : "");
        if (window.SGOmino) hud.firstChild.innerHTML = svgAvatar(avatarBanco(vm), fm.faccia, { busto: true });
        var hn = hud.lastChild; hn.innerHTML = ""; hn.appendChild(document.createTextNode(pB ? "🎩 Banco" : "🎩 " + nomeBanco(vm)));
        if (pB) hn.appendChild(el("b", { class: /Sball/.test(pB) ? "bust" : "", text: pB }));
        if (fumEl) fumEl.remove(); fumEl = null;
        if (fm.fum) { fumEl = el("div", { class: "bjr-fum" + (fm.oro ? " oro" : ""), style: "left:8px;top:" + (R.H - 96) + "px", text: fm.fum }); zBanco.appendChild(fumEl); }   // il fumetto sta sopra la testa di Bot, lontano dalle carte
      }
      // la nuvoletta della mossa sopra la testa di chi l'ha detta
      [].forEach.call(R.sopra.querySelectorAll(".bjr-bolla"), function (b) { if (!bolla || +b.dataset.id !== bollaId) b.remove(); });
      if (bolla && R.seg[bolla.seat] && !R.sopra.querySelector(".bjr-bolla")) {
        var sb = R.seg[bolla.seat], tb = bolla.testo, tipo = /sball/i.test(tb) ? " rossa" : (/black|21/i.test(tb) ? " oro" : "");
        R.sopra.appendChild(el("div", { class: "bjr-bolla" + tipo, "data-id": bollaId, style: "left:" + Math.round(sb.x) + "px;top:" + Math.max(20, sb.testa - 16) + "px", text: tb }));
      }
      // in grande sulla parete: chi sta giocando
      var gt = vm.giocatori[vm.turno], scritta = "", sotto = "", quale = vm.maniTot ? "mano " + Math.min(vm.maniTot, vm.mano + (vm.fase === "esito" ? 0 : 1)) + " di " + vm.maniTot : "";
      if (vm.fase === "distrib") scritta = nomeBanco(vm) + " distribuisce…";
      else if (vm.fase === "banco") scritta = "Tocca a " + nomeBanco(vm) + " 🎩";
      else if (vm.fase === "esito") { scritta = vm.maniTot && vm.mano >= vm.maniTot ? "Ultima mano finita!" : "Fine mano"; sotto = quale; }
      else if (vm.fase === "fine") scritta = "Fine partita 🏁";
      else if (vm.fase === "punta" && drv.mioIdx) {   // online si punta tutti insieme
        var manc = vm.giocatori.filter(function (x, j) { return puoPuntare(vm, j); }).map(function (x) { return x.nome; });
        scritta = "Puntate! 🪙"; sotto = manc.length ? "aspettiamo " + manc.slice(0, 3).join(", ") + (manc.length > 3 ? "…" : "") : quale;
      }
      else if (vm.fase === "assic" && drv.mioIdx) scritta = "Assicurazione?";
      else if (vm.fase === "punta" && !gt) scritta = "Monete finite 😅";
      else if (gt) { scritta = (vm.fase === "punta" ? "Punta " : (vm.fase === "assic" ? "Assicura? " : "Tocca a ")) + gt.nome; sotto = fmt(gt.fiches) + " 🪙" + (vm.fase === "punta" && quale ? " · " + quale : ""); }
      var kcap = intro.corre ? "" : scritta + "|" + sotto;
      if (capt.dataset.k !== kcap) {   // la scritta si rifà solo se cambia
        capt.dataset.k = kcap; capt.innerHTML = "";
        if (!intro.corre) { capt.appendChild(el("div", { text: scritta })); if (sotto) capt.appendChild(el("small", { text: sotto })); }
      }
      disegnaPodio();
      if (!intro.fatta) apertura(); else telecamera();
    }
    // con 7-10 giocatori i nomi sopra le teste non si devono coprire: chi tocca il vicino sale di una riga
    function sistemaNomi() {
      var fatti = [];
      R.seg.forEach(function (s) {
        var w = s.nome.offsetWidth, h = s.nome.offsetHeight, x0 = parseFloat(s.nome.style.left) - w / 2, top = s.top0;
        for (var giro = 0; giro < 3; giro++) {
          var tocca = fatti.some(function (f) { return x0 < f.x1 - 1 && f.x0 < x0 + w - 1 && top - h < f.y1 - 1 && f.y0 < top - 1; });
          if (!tocca) break;
          top -= h + 1;
        }
        s.nome.style.top = top + "px";
        fatti.push({ x0: x0, x1: x0 + w, y0: top - h, y1: top });
      });
    }
    // fine partita: la classifica sul tavolo (chi ha guadagnato di più al primo posto)
    var podio = null;
    function disegnaPodio() {
      if (vm.fase !== "fine" || !vm.classifica) { if (podio) { podio.remove(); podio = null; } return; }
      var kp = JSON.stringify(vm.classifica);
      if (podio && podio.dataset.k === kp) return;
      if (podio) podio.remove();
      var N = vm.classifica.length, md = ["🥇", "🥈", "🥉"];
      podio = el("div", { class: "bj-podio" + (N > 6 ? " fitto" : ""), "data-k": kp }, [ el("h3", { text: "🏁 Classifica" }) ]);
      vm.classifica.forEach(function (r) {
        var n = r.netto;
        podio.appendChild(el("div", { class: "bj-pr" + (r.pos === 1 && n > 0 ? " oro" : "") }, [
          el("span", { class: "md", text: N > 1 ? (md[r.pos - 1] || r.pos + "°") : "🃏" }),
          el("span", { class: "nm", text: r.nome + (drv.mioIdx && r.i === mioIdx() && N > 1 ? " ⭐" : "") }),
          el("span", { class: "nt " + (n > 0 ? "piu" : (n < 0 ? "meno" : "")), text: n ? (n > 0 ? "+" : "−") + fmt(Math.abs(n)) : "pari" }),
          el("span", { class: "ff", text: fmt(r.fiches) + " 🪙" })
        ]));
      });
      zBanco.appendChild(podio);
    }
    function disegnaBanco() { disegnaScena(); }
    function disegnaTavolata() { disegnaScena(); }

    // ---------- LA TELECAMERA ----------
    var camK = "", sbirciaFino = 0;
    function inquadra(box, durata) {
      var W = R.W, H = R.H, tr;
      if (!box) tr = "translate(0px,0px) scale(1)";
      else {
        var s = Math.min(2.6, Math.min(W / box.w, (H - 40) / box.h) * 0.92);
        var tx = W / 2 - box.x * s, ty = (H + 40) / 2 - box.y * s;
        ty = Math.max(ty, H - H * 1.1 * s);   // il bordo vicino del tavolo è a 1,1 H: sotto non c'è niente, non si scende oltre
        tr = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
      }
      if (tr === camK) return;
      camK = tr; cam.style.transitionDuration = (durata || 0.95) + "s"; cam.style.transform = tr;
    }
    function suGiocatore(i, largo) {
      var s = R.seg[i], top = s.testa - 22, bot = Math.max(s.carte.y, s.fp.y) + 34;
      return { x: s.x, y: (top + bot) / 2, w: Math.max(s.w * (largo ? 3 : 1.3), largo ? 230 : 140, (s.ccW || 0) * 1.35), h: (bot - top) * (largo ? 1.25 : 1) };
    }
    // lo zoom sul banco va sulle CARTE di Bot, al centro (la sua faccia è già nell'angolo)
    function suMatt() {
      var n = Math.max(2, vm.banco.length), w = Math.max(210, (53 * n) * R.bsc + 120);
      return { x: R.bx, y: R.by, w: w, h: w * 0.62 };
    }
    // cosa ha il banco, scritto accanto a Bot: finché la seconda è coperta "10 + ?"
    function testoBanco(scoperta) {
      if (!vm.banco.length) return "";
      if (!scoperta) { var c = vm.banco[0]; return (c.v === 1 ? "A" : BJ.valoreCarta(c.v)) + (vm.banco.length > 1 ? " + ?" : ""); }
      var p = BJ.punteggio(vm.banco);
      return BJ.eBlackjack(vm.banco) ? "Black Jack" : (p > 21 ? "Sballa " + p : "" + p);
    }
    // la carta coperta si gira sul posto (si stringe, cambia faccia, si riapre)
    function giraCarta(d, c) {
      suonoCarta();
      try { d.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: 170, easing: "ease-in", fill: "forwards" }); } catch (e) {}
      setTimeout(function () {
        d.innerHTML = BJ.cartaHTML(c, false);
        try { d.getAnimations().forEach(function (a) { a.cancel(); }); d.animate([{ transform: "scaleX(0) translateY(-8px)" }, { transform: "scaleX(1) translateY(0)" }], { duration: 240, easing: "cubic-bezier(.2,.9,.3,1.25)" }); } catch (e) {}
      }, 170);
    }
    // dove guarda la telecamera, in base a cosa succede
    function telecamera() {
      if (intro.corre || Date.now() < sbirciaFino) return;
      var f = vm.fase, veloce = vm.giocatori.length > 6;
      if (f === "gioca" || (f === "assic" && !drv.mioIdx)) inquadra(suGiocatore(vm.turno), veloce ? 0.6 : 0.85);   // online l'assicurazione è di tutti: tavolo intero
      else if (f === "banco") inquadra(suMatt());
      else if (f === "distrib") {
        // primo giro largo; al secondo giro la telecamera scorre lungo il tavolo seguendo la carta
        if (anim.ultima >= 0 && contaCarte(vm.giocatori[anim.ultima]) >= 2) inquadra(suGiocatore(anim.ultima, true), veloce ? 0.4 : 0.55);
        else if (anim.banco && vm.banco.length >= 2) inquadra(suMatt(), 0.6);
        else if (anim.ultima >= 0 || anim.banco) inquadra(null, 0.6);
      }
      else inquadra(null);   // puntate e fine mano: tutti al tavolo
    }
    // tocco su una faccia: la telecamera va da lui un attimo, poi torna
    function sbircia(i) {
      if (intro.corre) return;
      sbirciaFino = Date.now() + 2300;
      inquadra(i < 0 ? suMatt() : suGiocatore(i));
      setTimeout(function () { if (!chiuso && Date.now() >= sbirciaFino) telecamera(); }, 2350);
    }
    // ---------- APERTURA (la prima volta): Bot ci guarda, poi la telecamera passa su ognuno ----------
    // Si salta con un tocco; online si vede una volta sola per stanza (chi rientra non la rivede).
    var intro = { fatta: false, corre: false, stop: false, velo: null };
    function introGiaVista() { try { return !!(drv.stanza && sessionStorage.getItem("bj-intro-" + drv.stanza)); } catch (e) { return false; } }
    function apertura() {
      intro.fatta = true;
      if (introGiaVista()) { telecamera(); return; }
      try { if (drv.stanza) sessionStorage.setItem("bj-intro-" + drv.stanza, "1"); } catch (e) {}
      intro.corre = true;
      var N = vm.giocatori.length, velo = el("div", { class: "bjr-intro" }, [
        el("div", { class: "mg", html: window.SGOmino ? svgAvatar(avatarBanco(vm), "esulta") : "" }), el("div", { class: "banc" }) ]);
      intro.velo = velo;
      zBanco.appendChild(velo); capt.innerHTML = ""; capt.dataset.k = "";
      var passi = [];
      function poi(ms, fn) { passi.push([ms, fn]); }
      function esulta(i) { var s = R.seg[i]; s.k.f = "x"; var cfg = avatarDi(i); if (cfg) s.fig.innerHTML = svgAvatar(cfg, "esulta"); }
      poi(450, function () { velo.appendChild(el("div", { class: "benv", text: "Benvenuti al tavolo! 🎩" })); });
      poi(1500, function () { inquadra(suGiocatore(0, N > 4), 0.01); velo.classList.add("via"); });
      poi(600, function () { velo.remove(); });
      if (N <= 4) {   // pochi: uno alla volta, col nome
        vm.giocatori.forEach(function (g, i) {
          poi(0, function () { inquadra(suGiocatore(i), 0.6); });
          poi(450, function () { esulta(i); var pr = el("div", { class: "bjr-presenta", text: vm.giocatori[i].nome }); zBanco.appendChild(pr); R.seg[i].pr = pr; });
          poi(600, function () { var s = R.seg[i]; if (s.pr) s.pr.remove(); });
        });
      } else {        // tanti: una carrellata unica lungo il tavolo, tutti che salutano
        poi(0, function () { vm.giocatori.forEach(function (g, i) { esulta(i); }); });
        poi(120, function () { inquadra(suGiocatore(N - 1, true), 2.2); });
        poi(2400, function () {});
      }
      poi(0, fineIntro);
      (function vai(k) { if (k >= passi.length) return; setTimeout(function () { if (intro.stop || chiuso || !document.body.contains(zBanco)) return; passi[k][1](); vai(k + 1); }, passi[k][0]); })(0);
    }
    function fineIntro() {
      if (!intro.corre) return;
      intro.corre = false; intro.stop = true;
      if (intro.velo) intro.velo.remove();
      [].forEach.call(zBanco.querySelectorAll(".bjr-presenta"), function (x) { x.remove(); });
      if (R) R.seg.forEach(function (s) { s.k.f = null; });
      if (vm && !chiuso) disegnaScena();
    }
    // un tocco sul tavolo durante la presentazione la salta
    zBanco.addEventListener("click", function (e) { if (intro.corre) { e.stopPropagation(); fineIntro(); } }, true);
    // avatar di un giocatore (quello vero se c'è, altrimenti uno fisso legato al nome)
    function avatarDi(idx) {
      var lista = drv.avatari ? drv.avatari() : [];
      return avatarValido(lista[idx]) || (window.SGOmino ? SGOmino.casuale((vm.giocatori[idx] || {}).nome || idx) : null);
    }
    function bustoEl(idx, px) {
      var cfg = avatarDi(idx);
      if (!cfg) return null;
      return el("div", { class: "bj-av", style: "width:" + px + "px;height:" + px + "px", html: svgAvatar(cfg, "normale", { busto: true }) });
    }
    function etichettaEsito(m) { return ({ vince: "vince", blackjack: "BJ!", perde: "perde", pari: "pari" })[m.esito] || ""; }

    // ---------- LA PARTE DI SOTTO: si rifà solo quando cambia quello che mostra (niente lampeggio) ----------
    function maniK(g) { return g ? g.mani.map(function (m) { return m.carte.map(function (c) { return c.v + "" + c.s; }).join(",") + (m.chiusa ? "c" : "") + m.puntata + (m.esito || ""); }).join("/") : ""; }
    function chiaveHero() {
      var f = vm.fase, io = drv.mioIdx ? mioIdx() : -1, me = vm.giocatori[io];
      var base = [f, !!drv.puoAgire(vm), io, me ? [me.fiches, me.puntata, !!me.via, !!me.prova, !!me.salta] : null, !!(drv.puoRuota && drv.puoRuota())];
      if (f === "punta") {
        var i = chiDecide(), g = vm.giocatori[i];
        if (g) return JSON.stringify(base.concat(["P", i, g.nome, g.fiches, vm.puntataMin]));
        return JSON.stringify(base.concat(["PW", vm.giocatori.map(function (x, j) { return puoPuntare(vm, j) ? x.nome : ""; }), vm.giocatori.every(function (x) { return x.fiches <= 0; })]));
      }
      if (f === "assic") { var a = chiDecide(); return JSON.stringify(base.concat(["A", a, maniK(vm.giocatori[a] || me)])); }
      if (f === "gioca") { var gg = vm.giocatori[vm.turno]; return JSON.stringify(base.concat(["G", vm.turno, gg ? gg.attiva : -1, maniK(gg), gg ? gg.fiches : 0])); }
      if (f === "esito") return JSON.stringify(base.concat(["E", vm.giocatori.map(function (x) { return [x.nome, x.fiches, nettoDi(x)]; }), vm.rimescolato, vm.mano, vm.maniTot, !!(drv.puoNuova && drv.puoNuova())]));
      return JSON.stringify(base);
    }
    function disegnaHero(forza) {
      var k = chiaveHero(); if (!forza && k === heroK) return;
      heroK = k;
      if (bloccoT) { clearTimeout(bloccoT); bloccoT = null; }
      svuota(zHero);
      var mio = drv.puoAgire(vm);
      if (vm.fase === "fine") return heroFine();
      if (drv.mioIdx && !vm.giocatori[mioIdx()]) return heroInfo("🪑", "Ti stai sedendo al tavolo…");   // appena arrivato: il posto sta arrivando
      if (vm.fase === "distrib") return heroInfo("🂠", nomeBanco(vm) + " distribuisce…");
      if (vm.fase === "punta") return heroPunta(chiDecide());
      if (vm.fase === "assic") return heroAssic(chiDecide());
      if (vm.fase === "banco") return heroInfo("🎴", "Gioca il banco…");
      if (vm.fase === "gioca") return heroGioca(mio);
      if (vm.fase === "esito") return heroEsito();
    }
    // dopo un tocco i tasti si spengono finché non arriva il tavolo nuovo (niente doppio tocco = doppia carta)
    function bloccaTasti() {
      [].forEach.call(zHero.querySelectorAll("button"), function (b) { b.disabled = true; });
      if (bloccoT) clearTimeout(bloccoT);
      bloccoT = setTimeout(function () { bloccoT = null; if (!chiuso && vm) disegnaHero(true); }, 1500);   // la mossa non è passata: si riaccendono
    }
    function tasto(txt, cls, fn) { return el("button", { class: "bj-btn " + cls, text: txt, onclick: function () { fn(); } }); }
    function heroInfo(ico, txt) {
      zHero.appendChild(el("div", { style: "font-size:2.6rem;line-height:1", text: ico }));
      zHero.appendChild(el("div", { class: "bj-hnome", text: txt }));
    }
    // monete finite: si riparte con 500 di prova, si gira la ruota del giorno (o, sullo stesso telefono, si chiude la partita)
    function heroZero() {
      zHero.appendChild(el("div", { class: "bj-hnome", text: drv.mioIdx ? "Hai finito le monete 😅" : "Monete finite per tutti! 😅" }));
      var az = el("div", { class: "bj-azioni" });
      if (drv.puoRuota && drv.puoRuota()) az.appendChild(tasto("🎡 Ruota del giorno", "bj-b-dividi", function () { drv.onRuota(); }));
      az.appendChild(tasto("♻️ 500 di prova", "bj-b-carta", function () { bloccaTasti(); drv.onRicarica(-1); }));
      if (!drv.mioIdx && drv.onFine) az.appendChild(tasto("🏁 Classifica", "bj-b-no", function () { drv.onFine(); }));
      zHero.appendChild(az);
      zHero.appendChild(el("div", { class: "bj-hmini", text: "Le monete di prova non finiscono nel profilo" }));
    }
    // chi gioca e quante monete ha lo dice la scritta grande sulla parete: qui sotto solo carte e tasti
    // (online ognuno punta dal suo telefono, senza aspettare il turno)
    function heroPunta(idx) {
      var g = vm.giocatori[idx];
      if (!g) {   // ho già puntato (o non posso): aspetto gli altri
        var io = drv.mioIdx ? vm.giocatori[mioIdx()] : null;
        if (drv.mioIdx ? (io && !io.puntata && !io.via && io.fiches <= 0) : vm.giocatori.every(function (x) { return x.fiches <= 0 || x.via; })) return heroZero();
        var manc = vm.giocatori.filter(function (x, j) { return puoPuntare(vm, j); }).map(function (x) { return x.nome; });
        if (io && io.puntata) zHero.appendChild(el("div", { class: "bj-punta-val", text: fmt(io.puntata) + " 🪙" }));
        else if (io && io.salta) zHero.appendChild(el("div", { class: "bj-hnome", text: "Questa mano la guardi" }));
        zHero.appendChild(el("div", { class: "bj-hfiches", text: manc.length ? "Aspettiamo " + manc.join(", ") + "…" : "Nessuno ha monete da puntare" }));
        return;
      }
      var maxP = g.fiches, minP = Math.min(vm.puntataMin || 10, maxP);   // con meno della puntata minima si punta tutto
      if (puntSel == null) puntSel = Math.min(ultimePuntate[chiavePuntata(g)] || Math.max(100, minP), maxP);   // di base la stessa puntata della mano prima
      puntSel = Math.max(minP, Math.min(puntSel, maxP));
      var val = el("div", { class: "bj-punta-val", text: fmt(puntSel) + " 🪙" });
      zHero.appendChild(val);
      var bPunta;
      function agg() {
        puntSel = Math.max(minP, Math.min(puntSel, maxP));
        val.textContent = fmt(puntSel) + " 🪙";
        if (bPunta) bPunta.textContent = "Punta " + fmt(puntSel) + " ▶";
      }
      function step(d) { return function () { puntSel += d; agg(); }; }
      var riga = el("div", { class: "bj-step" });
      [["−100", -100], ["−10", -10], ["+10", 10], ["+100", 100]].forEach(function (x) {
        riga.appendChild(el("button", { class: "bj-sbtn", text: x[0], onclick: step(x[1]) }));
      });
      zHero.appendChild(riga);
      var az = el("div", { class: "bj-azioni" });
      bPunta = el("button", { class: "bj-btn bj-b-carta", text: "Punta " + fmt(puntSel) + " ▶", onclick: function () { var v = puntSel; puntSel = null; ultimePuntate[chiavePuntata(g)] = v; suonoChip(); bloccaTasti(); drv.onPunta(v, idx); } });
      az.appendChild(bPunta);
      az.appendChild(el("button", { class: "bj-btn bj-b-stai", text: "Tutto (" + fmt(maxP) + ")", onclick: function () { puntSel = null; ultimePuntate[chiavePuntata(g)] = maxP; suonoChip(); bloccaTasti(); drv.onPunta(maxP, idx); } }));
      zHero.appendChild(az);
    }
    function heroAssic(idx) {
      var g = vm.giocatori[idx];
      if (!g) {   // ho già deciso (o non devo): aspetto gli altri
        var io = drv.mioIdx ? vm.giocatori[mioIdx()] : null;
        if (io && io.mani.length) heroCarte(io);
        zHero.appendChild(el("div", { class: "bj-hfiches", text: "Aspettiamo le assicurazioni…" }));
        return;
      }
      var costo = Math.floor(g.puntata / 2);
      zHero.appendChild(el("div", { class: "bj-hfiches", text: nomeBanco(vm) + " ha un Asso: assicuri per " + fmt(costo) + " 🪙? Paga 2 a 1" }));
      // come nel turno: i tasti ai lati delle carte (così tutto sta nello spazio di sotto)
      var centro = el("div", { class: "bj-hcentro" });
      heroCarte(g, centro);
      var sx = el("div", { class: "bj-col" }, [ tasto("Assicuro", "bj-b-si", function () { bloccaTasti(); drv.onAssicura(true, idx); }) ]);
      var dx = el("div", { class: "bj-col" }, [ tasto("No", "bj-b-no" + (vm.consigli ? " bj-cons" : ""), function () { bloccaTasti(); drv.onAssicura(false, idx); }) ]);   // il consiglio: l'assicurazione non conviene
      zHero.appendChild(el("div", { class: "bj-hriga" }, [sx, centro, dx]));
    }
    function heroCarte(g, dove) {
      var gi = vm.giocatori.indexOf(g);
      var box = el("div", { class: "bj-mani" });
      // tutte le mani in fila: stessa misura per tutte le carte; se non ci stanno si sovrappongono un po'
      var larga = (Math.min(560, window.innerWidth || 375) - 12) * (dove ? 0.46 : 0.62), nm = g.mani.length, tot = 0;
      g.mani.forEach(function (m) { tot += m.carte.length; });
      var w = Math.max(30, Math.min(52, Math.floor((larga - nm * 18 - tot * 6) / Math.max(1, tot))));   // piccole: le carte si vedono già in grande nello zoom
      var serve = tot * (w + 6) + nm * 18, sovr = tot > nm && serve > larga ? Math.ceil((serve - larga) / (tot - nm)) : 0;
      g.mani.forEach(function (m, i) {
        var mano = el("div", { class: "bj-mano" + (i === g.attiva && vm.fase === "gioca" && g.mani.length > 1 ? " attiva" : "") });
        var cc = el("div", { class: "bj-hcarte" });
        // carte grandi finché ci stanno: la larghezza si calcola sullo spazio vero, così non finiscono sopra i tasti
        m.carte.forEach(function (c, ci) {
          var isUlt = (i === g.attiva && ci === m.carte.length - 1);
          var card = cartaEl(el, c, false, "");
          card.style.width = w + "px"; if (ci && sovr) card.style.marginLeft = (-sovr) + "px";
          if (anim.ultima === gi && isUlt) daVolare.push(card);
          cc.appendChild(card);
        });
        mano.appendChild(cc);
        var pm = BJ.punteggio(m.carte);
        mano.appendChild(el("div", { class: "bj-pt " + (pm > 21 ? "bust" : (m.esito === "vince" || m.esito === "blackjack" ? "win" : "")), style: "display:block;margin:6px auto 0;width:fit-content", text: BJ.testo(m.carte, m.divisa) + " · " + fmt(m.puntata) + "🪙" }));
        box.appendChild(mano);
      });
      (dove || zHero).appendChild(box);
    }
    function heroGioca(mio) {
      var g = vm.giocatori[vm.turno];
      if (!g) return heroInfo("🎴", "Gioca il banco…");
      var centro = el("div", { class: "bj-hcentro" });
      heroCarte(g, centro);
      var ma = g.mani[g.attiva], attesa = ma && !ma.chiusa && ma.carte.length < 2;   // dopo "Dividi": aspetta la seconda carta
      if (attesa) centro.appendChild(el("div", { class: "bj-hnome", style: "margin-top:2px;color:#ffe58a", text: nomeBanco(vm) + " ti dà la carta…" }));
      if (ma && ma.chiusa) {   // mano finita: resta a schermo un attimo prima di passare
        var pm = BJ.punteggio(ma.carte);
        centro.appendChild(el("div", { class: "bj-hnome", style: "margin-top:2px;color:" + (pm > 21 ? "#ff9d8a" : "#9fe6b4"),
          text: pm > 21 ? ("Sballato! " + pm) : (BJ.eBJ(ma) ? "Black Jack! 🎉" : "Fermo a " + pm) }));
      }
      if (!mio || (ma && ma.chiusa) || attesa) { zHero.appendChild(centro); return; }
      // tasti ai lati delle carte: a sinistra Dividi e Raddoppia, a destra Stai e Carta
      var v = mosseValideVm(vm), chk = { h: g.attiva, n: ma.carte.length };
      var cons = vm.consigli ? BJ.consiglio(ma, vm.banco[0], v.raddoppia, v.dividi) : null;   // la mossa giusta brilla
      function b(txt, cls, on, mv) {
        var x = tasto(txt, cls + (cons === mv ? " bj-cons" : ""), function () { bloccaTasti(); drv.onMossa(mv, chk); });
        if (!on) x.disabled = true; return x;
      }
      var sx = el("div", { class: "bj-col" }, [ b("Dividi", "bj-b-dividi", v.dividi, "dividi"), b("Raddoppia", "bj-b-radd", v.raddoppia, "raddoppia") ]);
      var dx = el("div", { class: "bj-col" }, [ b("Stai", "bj-b-stai", true, "stai"), b("Carta", "bj-b-carta", true, "carta") ]);
      zHero.appendChild(el("div", { class: "bj-hriga" }, [sx, centro, dx]));
    }
    function heroEsito() {
      // chi ha vinto o perso si vede sul tavolo: qui le monete di tutti (con +/−) e i tasti
      // con 7-10 giocatori solo nome e +/− (le monete di ognuno si leggono quando punta): così ci stanno tutti
      var fitti = vm.giocatori.length > 6, riga = el("div", { class: "bj-esiti" + (fitti ? " fitti" : "") });
      vm.giocatori.forEach(function (g) {
        var d = nettoDi(g);
        riga.appendChild(el("span", {}, [ el("b", { text: g.nome }), fitti ? (d ? "" : " =") : " " + fmt(g.fiches) + " 🪙",
          d ? el("span", { class: d > 0 ? "piu" : "meno", text: " " + (d > 0 ? "+" : "−") + fmt(Math.abs(d)) }) : null ]));
      });
      zHero.appendChild(riga);
      if (vm.rimescolato) zHero.appendChild(el("div", { class: "bj-hmini", text: "🔀 Mazzo rimescolato" }));
      // online con gli amici al tavolo la mano nuova parte da sola dopo 12 secondi (l'host la può far partire prima):
      // nessuno resta ad aspettare un host distratto
      var conto = drv.contoMano && drv.contoMano(vm) && t.contoAvanti, kConto = "bj|" + (drv.stanza || "") + "|" + vm.giro + "|" + vm.mano;
      if (drv.puoNuova && drv.puoNuova()) {
        var az = el("div", { class: "bj-azioni" }), finita = vm.maniTot && vm.mano >= vm.maniTot, vai;
        if (finita) az.appendChild(vai = tasto("🏁 Classifica ▶", "bj-b-carta", function () { bloccaTasti(); drv.onFine(); }));
        else {
          az.appendChild(vai = tasto("Nuova mano ▶", "bj-b-carta", function () { bloccaTasti(); drv.onNuova(); }));
          if (!drv.mioIdx && vm.giocatori.some(function (g) { return g.fiches <= 0; })) az.appendChild(tasto("♻️ 500 a chi è a zero", "bj-b-dividi", function () { drv.onRicarica(-1); }));
          az.appendChild(tasto("🏁 Basta così", "bj-b-no", function () { bloccaTasti(); drv.onFine(); }));
        }
        zHero.appendChild(az);
        if (conto) t.contoAvanti(vai, 12, function () { if (chiuso || !vm || vm.fase !== "esito") return; bloccaTasti(); if (finita) drv.onFine(); else drv.onNuova(); }, kConto);
      } else {
        var asp = el("div", { class: "bj-hfiches", text: "Aspettiamo l'host per la mano nuova…" });
        zHero.appendChild(asp);
        if (conto) t.contoAvanti(asp, 12, null, kConto);
      }
    }
    // fine partita: la classifica è sul tavolo; qui si riparte o ci si alza
    function heroFine() {
      var az = el("div", { class: "bj-azioni" }), host = !!(drv.puoNuova && drv.puoNuova());
      // online: i tasti di fine uguali per tutti li mette il core (la Rivincita è la serie nuova); se no quelli di sempre
      var delCore = !!(drv.stanza && t.tastiFine && t.tastiFine(az, { host: host, nuova: drv.onAncora, esci: function () { chiudi(); drv.onEsci(); } }));
      if (host) zHero.appendChild(el("div", { class: "bj-hnome", text: "Bella partita! 🎉" }));
      else if (!delCore) zHero.appendChild(el("div", { class: "bj-hfiches", text: "Aspettiamo l'host: si gioca ancora?" }));
      if (!delCore) {
        if (host) az.appendChild(tasto(drv.testoAncora || "Gioca ancora ▶", "bj-b-carta", function () { bloccaTasti(); drv.onAncora(); }));
        az.appendChild(tasto("🚪 Mi alzo", "bj-b-no", function () { chiediUscita(); }));
      }
      zHero.appendChild(az);
      var fa = drv.stanza && t.faccine ? t.faccine() : null;   // (online) le faccine della saletta sulla classifica
      if (fa) zHero.appendChild(el("div", { style: "display:flex;justify-content:center;margin-top:6px" }, [ fa ]));
    }

    return {
      aggiorna: aggiorna, chiudi: chiudi,
      // gli avatar sono arrivati dopo (chi rientra o si siede a partita iniziata): si ridisegnano le facce
      avatariCambiati: function () { if (!vm || chiuso) return; if (R) R.seg.forEach(function (s) { s.k.f = null; }); disegnaScena(); disegnaHero(true); }
    };
  }

  // ---------- LE REGOLE DEL TAVOLO (scelte prima di cominciare; online l'host le cambia in saletta) ----------
  function regoleDa(imp) {
    imp = imp || {};
    return {
      min: [10, 50, 100].indexOf(+imp.min) >= 0 ? +imp.min : BJ.PUNTATA_MIN,
      mani: Math.max(0, Math.floor(+imp.mani) || 0),                    // 0 = senza fine
      tempo: imp.tempo == null ? 25 : Math.max(0, Math.floor(+imp.tempo) || 0),   // secondi per decidere (online)
      consigli: imp.consigli == null ? true : !!imp.consigli
    };
  }
  function testoRegole(r, online) {
    return "Puntata minima " + fmt(r.min) + " 🪙 · " + (r.mani ? r.mani + " mani" : "mani senza fine") +
      (online ? " · " + (r.tempo ? r.tempo + " s per decidere" : "tempo libero") : "") + (r.consigli ? " · 💡 consigli" : "");
  }
  // la ruota del giorno girata dal tavolo: cb(saldoNuovo, quanteMoneteInPiu)
  function ruotaDalTavolo(cb) {
    if (!(window.SG && SG.ruotaDelGiorno && window.SGNube)) return;
    var prima = SGNube.monete ? SGNube.monete() : 0;
    SG.ruotaDelGiorno(function (res) { var piu = res.coins - prima; if (piu > 0) { suonoChip(); cb(res.coins, piu); } });
  }
  // le monete di un giocatore ancora sul tavolo in questa mano (puntata, raddoppi, mani divise)
  function puntataInGioco(g) { return g.mani && g.mani.length ? g.mani.reduce(function (a, m) { return a + m.puntata; }, 0) : (g.puntata || 0); }
  // (online) al tavolo c'è almeno un amico oltre all'host: allora la mano nuova parte anche da sola
  function conAmici(vm) { return !!vm && vm.giocatori.some(function (g, i) { return i > 0 && !g.via; }); }
  function puoRuotaProfilo(prof) { return !!(prof && window.SGNube && SGNube.puoRitirareBonus && SGNube.puoRitirareBonus()); }

  // ---------- MODALITÀ "UN TELEFONO SOLO" ----------
  function localeBJ(t) {
    nuovaSessioneBJ();
    var imp = t.impostazioni || {}, RG = regoleDa(imp), torneo = !!imp.torneo;
    var nomi = (t.giocatori && t.giocatori.length) ? t.giocatori.slice() : ["Giocatore 1"];
    // se c'è un profilo cloud, il primo giocatore usa (e salva) le sue monete
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var fichesIniz = null, prova = false;
    if (prof) {
      var f = SGNube.fiches("blackjack");
      if (f != null && f > 0) { fichesIniz = [f]; }
      else { prova = true; fichesIniz = [BJ.FICHES_INIZIALI]; }   // a zero: gioca di prova, non si salva
    }
    var M = BJ.creaMotore(nomi, t.mischia, fichesIniz, RG), st = M.st, tav;
    st.giocatori[0].prova = prova;
    st.croupier = croupierDa(nomi);   // il banco: uno dei bot fissi
    var avatari = nomi.map(function (n, i) { return i === 0 ? mioAvatar(n) : null; });   // gli altri: faccia fissa legata al nome
    var maniFinite = 0, detto = false, salvato = st.giocatori[0].fiches;
    // il saldo del profilo segue il tavolo: la puntata si toglie subito (uscendo a metà mano non torna indietro)
    function salva() { var g = st.giocatori[0]; if (prof && !g.prova && g.fiches !== salvato) { salvato = g.fiches; SGNube.salvaFiches("blackjack", salvato); } }
    function classifica() { return M.classifica().map(function (r) { return { nome: r.nome, pos: r.pos }; }); }
    // com'è andata (dà gli XP; vince chi ha guadagnato di più)
    function risultatoLoc() {
      if (!maniFinite || detto || !t.risultato) return;
      detto = true; t.risultato(classifica());
    }
    function refresh() { tav.aggiorna(vistaBJ(st, RG)); salva(); }
    tav = tavoloBJ(t, {
      avatari: function () { return avatari; },
      sotto: prof ? (prova ? ("👤 " + prof.nome + " · prova · gira la ruota del giorno!") : ("👤 " + prof.nome + " · gioca con le tue monete")) : "Un telefono · Banco: " + nomeBanco(st),
      avvisoUscita: function (vm) { return vm.fase !== "esito" && vm.fase !== "fine" && vm.giocatori.some(function (g) { return g.puntata > 0; }) ? "Le puntate di questa mano sono perse." : ""; },
      puoAgire: function () { return true; },
      puoNuova: function () { return true; },
      guida: function () { return true; },
      puoRuota: function () { return puoRuotaProfilo(prof); },
      onRuota: function () {
        ruotaDalTavolo(function (nuovo, piu) {
          var g = st.giocatori[0];
          if (g.prova) { g.prova = false; M.aggiungiFiches(0, nuovo - g.fiches); } else M.aggiungiFiches(0, piu);   // da prova a monete vere
          salvato = g.fiches; refresh();
        });
      },
      onRicarica: function () { st.giocatori.forEach(function (g, i) { if (g.fiches <= 0) M.ricarica(i); }); refresh(); },
      onPasso: function (k) { if (k === "distrib") M.passoDistribuzione(); else if (k === "banco") M.passoBanco(); else if (k === "divisa") M.passoDivisa(); else if (k === "avanza") M.avanza(); refresh(); },
      onPunta: function (v) { M.punta(st.turno, v); refresh(); },
      onMossa: function (m) { if (m === "stai") suonoStai(); M.azione(m); refresh(); },
      onAssicura: function (si) { M.assicura(st.turno, si); refresh(); },
      onFineMano: function (v) { var g = v.giocatori[0]; if (prof && !g.prova) { salvaFineMano(g, v); salvato = g.fiches; } maniFinite++; },
      onNuova: function () { M.nuovaMano(); refresh(); },
      onFine: function () { M.fineTavolo(); refresh(); },
      onFinePartita: function () { if (!torneo) risultatoLoc(); },
      testoAncora: torneo ? "🏆 Avanti nel torneo ▶" : null,
      onAncora: function () {
        if (torneo && t.fine) { tav.chiudi(); salva(); detto = true; t.fine(classifica()); return; }   // torneo: i punti di questa partita
        detto = false; maniFinite = 0; M.nuovaSerie(); refresh();
      },
      onEsci: function () { salva(); risultatoLoc(); t.esci(); }
    });
    M.nuovaMano(); refresh();
  }

  // ---------- MODALITÀ ONLINE ----------
  // la saletta d'attesa: chi è al tavolo aspetta col suo personaggio; l'host ha codice, link e "Comincia"
  function renderLobbyBJ(t, info, cb) {
    iniettaCSS();
    document.body.classList.remove("bj-verde");
    t.lobby({ host: info.sonoHost, codice: info.codice, pronta: info.pronta, min: 1, puoiDaSolo: true,
      giocatori: info.giocatori.map(function (g, i) { return { id: g.id, nome: g.nome, omino: g.omino || null, host: i === 0, tu: info.sonoHost ? i === 0 : g.id === info.mioId }; }),
      attesa: "Aspetta che l'host apra il tavolo: poi si punta tutti insieme.",
      extra: [cb.bonus, cb.nota],   // saldo + ruota del giorno per chi ha il profilo (anche chi entra da invito) e le regole del tavolo
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function hostBJ(t) {
    nuovaSessioneBJ();
    if (!(window.SGNet && SGNet.disponibile())) return localeBJ(t);
    var imp = t.impostazioni || {}, RG = regoleDa(imp);
    var nota = t.el("p", { class: "modulo-nota", style: "text-align:center" });
    // "⚙️ Regole" nella saletta: l'host cambia le regole prima di cominciare
    t.onRegole = function (im) { imp = im || {}; if (!M) { RG = regoleDa(imp); lobbyOut(); } };
    // la Rivincita a fine serie: una serie nuova allo stesso tavolo, ognuno con le monete che ha
    t.onRivincita = function () { if (!M || finito || M.st.fase !== "fine") return; detto = false; maniFinite = 0; M.nuovaSerie(); bcast(); };
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var provaHost = false, mieFiches = prof ? SGNube.fiches("blackjack") : null;
    if (prof && (mieFiches == null || mieFiches <= 0)) { provaHost = true; mieFiches = BJ.FICHES_INIZIALI; }
    var seats = [{ id: "host", nome: (prof ? prof.nome : (t.giocatori && t.giocatori[0])) || "Host", fiches: mieFiches, prova: provaHost }];
    seats[0].omino = mioAvatar(seats[0].nome);
    var M = null, rete = null, codice = "…", tav = null, pronta = false, finito = false;
    var guardano = [];   // chi è entrato ma non è tra chi gioca (scelti nella Sala): guarda il tavolo senza sedersi
    var maniFinite = 0, detto = false, salvato = mieFiches;
    var TT = { k: "", fine: 0, to: null };   // il conto alla rovescia per decidere (lo tiene l'host)
    // la ruota girata in saletta (o dal tavolo): si gioca con le monete nuove (e se eri a zero non è più di prova)
    var boxBonus = prof ? riquadroBonus(t.el, function (nuovo, piu) {
      if (M) { bonusHost(nuovo, piu); return; }
      if (nuovo > 0) { provaHost = false; seats[0].fiches = nuovo; seats[0].prova = false; salvato = nuovo; }
    }, true) : null;
    function bonusHost(nuovo, piu) {
      var g = M.st.giocatori[0];
      if (g.prova) { g.prova = false; M.aggiungiFiches(0, nuovo - g.fiches); } else M.aggiungiFiches(0, piu);
      salvato = g.fiches; bcast();
    }

    function seatDiId(id) { for (var i = 0; i < seats.length; i++) if (seats[i].id === id) return i; return -1; }
    function nuovoSeat(id, m) {
      var f = (typeof m.fiches === "number" && isFinite(m.fiches)) ? Math.max(0, Math.floor(m.fiches)) : null;
      return { id: id, nome: String(m.nome || "Amico").slice(0, 16), fiches: f, prova: !!m.prova, omino: avatarValido(m.omino) };
    }
    function listaAvatari() { return seats.map(function (x) { return x.omino || null; }); }
    // il conto alla rovescia: chi non decide in tempo salta la mano (puntata), non si assicura o sta
    function chiaveAttesa() {
      var st = M.st, sec = RG.tempo;
      if (!sec || st.giocatori.filter(function (g) { return !g.via; }).length < 2) return null;   // da soli non si aspetta nessuno
      if (st.fase === "punta") {
        var qualcuno = st.giocatori.some(function (g) { return g.puntata > 0; });
        var manca = st.giocatori.some(function (g) { return !g.puntata && !g.via && !g.salta && g.fiches > 0; });
        return qualcuno && manca ? { k: "p" + st.giro, ms: (sec + 10) * 1000, fn: M.scadePuntate } : null;   // parte dalla prima puntata
      }
      if (st.fase === "assic") return { k: "a" + st.giro, ms: sec * 1000, fn: M.scadeAssic };
      if (st.fase === "gioca") {
        var g = st.giocatori[st.turno], m = g && g.mani[g.attiva];
        if (!m || m.chiusa || m.carte.length < 2) return null;
        return { k: "g" + st.giro + "|" + st.turno + "|" + g.attiva + "|" + m.carte.length, ms: sec * 1000, fn: M.scadeTurno };
      }
      return null;
    }
    function fermaTempo() { if (TT.to) clearTimeout(TT.to); TT.to = null; TT.k = ""; }
    function gestisciTempo() {
      var a = chiaveAttesa();
      if (!a) { fermaTempo(); return; }
      if (a.k === TT.k) return;
      fermaTempo(); TT.k = a.k; TT.fine = Date.now() + a.ms;
      TT.to = setTimeout(function () { TT.to = null; TT.k = ""; if (!M || finito) return; a.fn(); bcast(); }, a.ms);
    }
    function bcast() {
      if (!M) { lobbyOut(); return; }
      if (finito) return;
      gestisciTempo();
      var vm = vistaBJ(M.st, RG);
      vm.tempo = TT.k ? { k: TT.k, ms: Math.max(0, TT.fine - Date.now()) } : null;
      if (guardano.length) vm.guardano = guardano.slice();
      if (rete) rete.invia({ t: "vm", vm: vm });
      if (tav) tav.aggiorna(vm);
      salva();
    }
    // il saldo dell'host segue il tavolo (la puntata si toglie subito)
    function salva() { var g = M && M.st.giocatori[0]; if (prof && g && !g.prova && g.fiches !== salvato) { salvato = g.fiches; SGNube.salvaFiches("blackjack", salvato); } }
    function lobbyOut() {
      var rt = testoRegole(RG, true);
      nota.textContent = "🃏 " + rt;
      if (rete) rete.invia({ t: "lobby", codice: codice, regole: rt, giocatori: seats.map(function (x) { return { id: x.id, nome: x.nome, omino: x.omino || null }; }) });
      renderLobbyBJ(t, { sonoHost: true, codice: codice, pronta: pronta, giocatori: seats }, {
        bonus: boxBonus, nota: nota,
        onComincia: comincia,
        onEsci: function () { finito = true; if (rete) rete.chiudi(); t.esci(); }
      });
    }
    function comincia() {
      if (M) return;
      RG = regoleDa(imp);
      M = BJ.creaMotore(seats.map(function (x) { return x.nome; }), t.mischia, seats.map(function (x) { return x.fiches; }), RG);
      M.st.giocatori.forEach(function (g, i) { g.rid = seats[i].id; g.prova = !!seats[i].prova; });
      M.st.croupier = croupierDa(seats.map(function (x) { return x.nome; }));   // il banco: uno dei bot fissi (va a tutti nel vm)
      maniFinite = 0; detto = false;
      avviaTavoloHost(); M.nuovaMano(); bcast();
    }
    function avviaTavoloHost() {
      tav = tavoloBJ(t, {
        sotto: "Online · sei l'host", stanza: codice, contoMano: conAmici,
        domandaUscita: "Chiudi il tavolo per tutti?",
        avvisoUscita: function (vm) { var g = vm.giocatori[0]; return (g && g.puntata > 0 && vm.fase !== "esito" && vm.fase !== "fine" ? "Perdi la puntata di questa mano. " : "") + "Gli amici vedranno com'è finita."; },
        avatari: listaAvatari,
        mioIdx: function () { return 0; },
        puoAgire: function (vm) { return vm.turno === 0; },
        puoNuova: function () { return true; },
        guida: function () { return true; },
        puoRuota: function () { return puoRuotaProfilo(prof); },
        onRuota: function () { ruotaDalTavolo(bonusHost); },
        onRicarica: function () { M.ricarica(0); bcast(); },
        onPasso: function (k) { if (k === "distrib") M.passoDistribuzione(); else if (k === "banco") M.passoBanco(); else if (k === "divisa") M.passoDivisa(); else if (k === "avanza") M.avanza(); bcast(); },
        onPunta: function (v) { M.punta(0, v); bcast(); },
        onMossa: function (m, chk) { if (M.st.turno === 0) { if (m === "stai") suonoStai(); M.azione(m, chk); bcast(); } },
        onAssicura: function (si) { M.assicura(0, si); bcast(); },
        onFineMano: function (vm) { var g = vm.giocatori[0]; if (prof && !g.prova) { salvaFineMano(g, vm); salvato = g.fiches; } maniFinite++; },
        onNuova: function () { M.nuovaMano(); bcast(); },
        onFine: function () { M.fineTavolo(); bcast(); },
        onFinePartita: function () { risultatoBJ(); },
        onAncora: function () { detto = false; maniFinite = 0; M.nuovaSerie(); bcast(); },
        onEsci: function () {
          risultatoBJ(); salva(); fermaTempo(); finito = true;
          // a metà mano: gli amici si riprendono la loro puntata (il tavolo l'ha chiuso l'host, non loro)
          var rimborso = !!M && ["esito", "fine"].indexOf(M.st.fase) < 0;
          if (rimborso) M.st.giocatori.forEach(function (g, i) { if (i > 0) g.fiches += puntataInGioco(g) + (g.assicura || 0); });
          // gli amici vedono chi ha chiuso e com'è finita (non "collegamento perso")
          if (rete) { try { rete.inviaVeloce({ t: "chiuso", nome: seats[0].nome, rimborso: rimborso, classifica: M ? M.classifica() : null }); } catch (e) {} rete.chiudi(); }
          t.esci();
        }
      });
    }
    // per il torneo online: a fine partita (o quando l'host si alza) conta chi ha guadagnato di più
    function risultatoBJ() {
      if (!M || !maniFinite || detto || !t.risultato) return;
      detto = true;
      t.risultato(M.classifica().map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    rete = SGNet.ospita("blackjack", {
      onCodice: function (c) { codice = c; if (!M) lobbyOut(); },
      onConnesso: function () { pronta = true; if (!M) lobbyOut(); },
      onAddio: function (id) {
        if (guardano.indexOf(id) >= 0) guardano.splice(guardano.indexOf(id), 1);
        var i = seatDiId(id); if (i <= 0) return;
        if (M) { M.esce(i); bcast(); }   // a partita iniziata il posto resta (gli altri non cambiano numero): non si aspetta più
        else { seats.splice(i, 1); lobbyOut(); }
      },
      onMsg: function (id, m) {
        if (!m || !m.t || finito) return;
        if (m.t === "join") {
          var i = seatDiId(id);
          if (i < 0 && t.puoSedersi && !t.puoSedersi(id, m.nome)) {   // non è tra chi gioca: guarda (riceve le foto, non si siede)
            if (guardano.indexOf(id) < 0) guardano.push(id);
            if (M) { rete.inviaVeloce({ t: "avatari", to: id, lista: listaAvatari() }); bcast(); } else lobbyOut();
            return;
          }
          if (M) {
            if (i >= 0) {   // chi rientra (pagina ricaricata, rete tornata) ritrova il suo posto e gli avatar
              M.rientra(i);
              rete.inviaVeloce({ t: "avatari", to: id, lista: listaAvatari() });
              bcast(); return;
            }
            if (seats.length >= 10) { rete.inviaVeloce({ t: "pieno", to: id }); return; }
            // arrivato a partita iniziata: si siede subito, gioca dalla prossima puntata
            var ns = nuovoSeat(id, m); seats.push(ns);
            M.aggiungi(ns.nome, ns.fiches, id, ns.prova);
            rete.inviaVeloce({ t: "avatari", lista: listaAvatari() });
            bcast(); return;
          }
          if (i < 0) {
            if (seats.length >= 10) { rete.inviaVeloce({ t: "pieno", to: id }); return; }
            seats.push(nuovoSeat(id, m));
          }
          lobbyOut();
        } else if (m.t === "fiches") {   // chi è al tavolo ha girato la ruota del giorno
          var sf = seatDiId(id); if (sf <= 0) return;
          var nuovo = Math.floor(+m.fiches), piu = Math.floor(+m.piu) || 0;
          if (!M) { if (isFinite(nuovo) && nuovo >= 0) { seats[sf].fiches = nuovo; if (nuovo > 0) seats[sf].prova = false; } return; }   // in saletta: è il suo saldo
          if (seats[sf].bonus || piu <= 0 || !isFinite(nuovo)) return;   // a partita iniziata: una volta sola a testa
          seats[sf].bonus = true; piu = Math.min(piu, 10000);            // al massimo il premio grosso della ruota
          var gf = M.st.giocatori[sf];
          if (gf.prova) { gf.prova = false; M.aggiungiFiches(sf, nuovo - gf.fiches); } else M.aggiungiFiches(sf, piu);
          bcast();
        } else if (M && m.t === "ricarica") {
          var sr = seatDiId(id); if (sr < 0) return;
          M.ricarica(sr); bcast();
        } else if (M && m.t === "mossa") {
          var seat = seatDiId(id); if (seat < 0) return;
          if (m.kind === "punta") M.punta(seat, m.val);            // le puntate arrivano da tutti insieme
          else if (m.kind === "assic") M.assicura(seat, !!m.si);
          else if (m.kind === "azione") {
            if (M.st.turno !== seat) return;
            M.azione(m.mossa, typeof m.n === "number" ? { h: m.h, n: m.n } : null);   // una mossa arrivata due volte si scarta
          }
          bcast();
        }
      },
      // (arriva solo se il primo collegamento non riesce: a tavolo aperto, se la rete salta, il core mostra «📶 Mi ricollego…»)
      onErrore: function () {
        if (M || finito) return;
        finito = true; fermaTempo(); try { rete.chiudi(); } catch (e) {}
        erroreBJ(t, "Non riesco ad aprire il tavolo online. Controlla la connessione e riprova.");
      }
    });
    lobbyOut();
  }

  function ospiteBJ(t, codice) {
    nuovaSessioneBJ();
    if (!(window.SGNet && SGNet.disponibile())) return localeBJ(t);
    var el = t.el, prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var S = { rete: null, nome: "", mioId: null, mioSeat: -1, tav: null, avatari: [], fiches: null, prova: false, vm: null, salvato: null, finito: false, ultimoJoin: 0 };
    var nota = el("p", { class: "modulo-nota", style: "text-align:center" });
    // anche chi entra da invito gira la ruota in saletta: l'host si segna le monete nuove
    var boxBonus = prof ? riquadroBonus(el, function (nuovo, piu) { mandaBonus(nuovo, piu); }, true) : null;
    function mandaBonus(nuovo, piu) {
      if (!S.rete) return;
      if (!S.tav) {
        if (nuovo > 0) { S.fiches = nuovo; S.prova = false; S.salvato = nuovo; }
        S.rete.invia({ t: "fiches", fiches: S.fiches });
      } else if (piu > 0) S.rete.invia({ t: "fiches", fiches: nuovo, piu: piu });   // a partita iniziata
    }
    if (prof) {   // già loggato col profilo: entra diretto, niente da riscrivere
      S.nome = prof.nome;
      var ff = SGNube.fiches("blackjack");
      if (ff != null && ff > 0) { S.fiches = ff; S.prova = false; }
      else { S.fiches = BJ.FICHES_INIZIALI; S.prova = true; }   // a zero: gioca di prova, non salva
      S.salvato = S.fiches;
      collega();
    } else schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra al tavolo", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      var msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function invia(m) { if (S.rete && !S.finito) S.rete.invia(m); }
    function mandaJoin() { S.ultimoJoin = Date.now(); invia({ t: "join", nome: S.nome, fiches: S.fiches, prova: S.prova, omino: mioAvatar(S.nome) }); }
    // il saldo del profilo segue il tavolo: la puntata si toglie subito (uscendo a metà mano non torna indietro)
    function salvaMio(vm) {
      var me = vm.giocatori[S.mioSeat];
      if (!prof || !me || me.prova || me.fiches === S.salvato) return;
      S.salvato = me.fiches; SGNube.salvaFiches("blackjack", me.fiches);
    }
    function assicuraTavolo() {
      if (S.tav) return;
      S.tav = tavoloBJ(t, {
        sotto: "Online", stanza: codice, contoMano: conAmici,
        avvisoUscita: function (vm) { var me = vm.giocatori[S.mioSeat]; return me && me.puntata > 0 && vm.fase !== "esito" && vm.fase !== "fine" ? "Perdi la puntata di questa mano." : ""; },
        avatari: function () { return S.avatari || []; },
        mioIdx: function () { return S.mioSeat; },
        puoAgire: function (vm) { return S.mioSeat >= 0 && vm.turno === S.mioSeat; },
        puoNuova: function () { return false; },
        guida: function () { return false; },
        puoRuota: function () { return puoRuotaProfilo(prof); },
        onRuota: function () { ruotaDalTavolo(mandaBonus); },
        onRicarica: function () { invia({ t: "ricarica" }); },
        onPasso: function () {},
        onPunta: function (v) { invia({ t: "mossa", kind: "punta", val: v }); },
        onMossa: function (m, chk) { if (m === "stai") suonoStai(); invia({ t: "mossa", kind: "azione", mossa: m, h: chk ? chk.h : null, n: chk ? chk.n : null }); },
        onAssicura: function (si) { invia({ t: "mossa", kind: "assic", si: si }); },
        onFineMano: function (vm) { var me = vm.giocatori[S.mioSeat]; if (prof && me && !me.prova) { salvaFineMano(me, vm); S.salvato = me.fiches; } },
        onNuova: function () {},
        onEsci: function () { S.finito = true; if (S.rete) S.rete.chiudi(); t.esci(); },
        // il core mi ha portato via dal tavolo (la Sala è passata a un amico, «Cambia gioco»…): a metà mano la puntata torna
        portatoVia: function () { if (S.finito) return; finisci("", null, !!S.vm && ["esito", "fine"].indexOf(S.vm.fase) < 0); }
      });
    }
    function finisci(titolo, classifica, rimborso) {
      if (S.finito) return;
      S.finito = true;
      // il tavolo si è chiuso a metà mano (non per colpa mia): la puntata torna nel mio profilo
      var me = S.vm && S.vm.giocatori[S.mioSeat];
      if (rimborso && prof && me && !me.prova) {
        var torna = puntataInGioco(me) + (me.assicura || 0);
        if (torna > 0) { S.salvato = me.fiches + torna; SGNube.salvaFiches("blackjack", S.salvato); }
      }
      if (S.tav) S.tav.chiudi();
      if (S.rete) S.rete.chiudi();
      finaleBJ(t, titolo, classifica, S.vm, S.mioSeat);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.mioId = id; mandaJoin(); },
        onMsg: function (m) {
          if (!m || S.finito) return;
          if (m.to && m.to !== S.mioId) return;          // era per un altro telefono
          if (m.t === "lobby") {
            S.avatari = (m.giocatori || []).map(function (x) { return x.omino; });
            nota.textContent = m.regole ? "🃏 " + m.regole : "";
            if (!S.tav) renderLobbyBJ(t, { sonoHost: false, codice: m.codice, giocatori: m.giocatori || [], mioId: S.mioId }, { bonus: boxBonus, nota: m.regole ? nota : null, onEsci: function () { S.finito = true; if (S.rete) S.rete.chiudi(); t.esci(); } });
          } else if (m.t === "vm") {
            S.vm = m.vm;
            S.mioSeat = (m.vm.giocatori || []).findIndex(function (x) { return x.rid === S.mioId; });   // il mio posto lo ritrovo dal mio id (anche dopo aver ricaricato)
            var me = m.vm.giocatori[S.mioSeat];
            var guardo = S.mioSeat < 0 && (m.vm.guardano || []).indexOf(S.mioId) >= 0;   // non sono tra chi gioca: guardo e basta
            if ((S.mioSeat < 0 || (me && me.via)) && !guardo && Date.now() - S.ultimoJoin > 3000) mandaJoin();   // l'host non mi ha (ancora) rimesso al tavolo
            assicuraTavolo();
            S.tav.aggiorna(m.vm);
            salvaMio(m.vm);
          } else if (m.t === "avatari") {
            S.avatari = m.lista || [];
            if (S.tav) S.tav.avatariCambiati();
          } else if (m.t === "pieno") finisci("Il tavolo è pieno (10 su 10). Riprova più tardi!");
          else if (m.t === "chiuso") finisci((m.nome || "L'host") + " ha chiuso il tavolo" + (m.rimborso ? ": la puntata di questa mano ti torna indietro" : ""), m.classifica, !!m.rimborso);
        },
        onChiuso: function () {
          var aMeta = !!S.vm && ["esito", "fine"].indexOf(S.vm.fase) < 0;
          finisci("L'host ha lasciato il tavolo" + (aMeta ? ": la puntata di questa mano ti torna indietro" : ""), null, aMeta);
        },
        // (arriva solo se il primo collegamento non riesce: dopo, se la rete salta, il core mostra «📶 Mi ricollego…» e si continua)
        onErrore: function () {
          if (S.vm || S.finito) return;
          if (S.tav) S.tav.chiudi(); S.finito = true; try { S.rete.chiudi(); } catch (e) {}
          erroreBJ(t, "Non riesco a collegarmi al tavolo. Controlla la connessione e riprova.");
        }
      });
    }
  }

  // il tavolo è chiuso (o non c'è posto): chi era seduto vede com'è finita
  function finaleBJ(t, titolo, classifica, vm, mioSeat) {
    document.body.classList.remove("bj-verde");
    var el = t.el, s = t.schermata({ icona: "🃏", titolo: "Tavolo chiuso", sotto: "Black Jack online" });
    s._contenuto.appendChild(el("p", { class: "as-msg", text: titolo }));
    var aMeta = !!vm && ["esito", "fine"].indexOf(vm.fase) < 0;   // a metà mano le puntate tornano a tutti
    var righe = classifica || (vm ? vm.giocatori.map(function (g, i) { return { i: i, nome: g.nome, fiches: g.fiches + (aMeta ? puntataInGioco(g) + (g.assicura || 0) : 0), netto: null, pos: null }; }) : []);
    if (righe.length) {
      var md = ["🥇", "🥈", "🥉"], ol = el("ol", { class: "classifica" });
      righe.forEach(function (r, k) {
        var io = r.i === mioSeat;
        ol.appendChild(el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
          el("span", { class: "pos", text: r.pos ? (md[r.pos - 1] || r.pos + "°") : (k + 1) + "." }),
          el("span", { class: "nome", text: r.nome + (io ? " ⭐" : "") }),
          el("span", { class: "punti", text: fmt(r.fiches) + " 🪙" + (r.netto ? " (" + (r.netto > 0 ? "+" : "−") + fmt(Math.abs(r.netto)) + ")" : "") })
        ]));
      });
      s._contenuto.appendChild(ol);
    }
    // chi era al tavolo: i tasti di fine uguali per tutti (se li mette il core); se no si torna alla home
    if (!(vm && t.tastiFine && t.tastiFine(s._piede, { host: false, esci: t.esci })))
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }

  function erroreBJ(t, testo) {
    document.body.classList.remove("bj-verde");
    var el = t.el, s = t.schermata({ icona: "⚠️", titolo: "Ops", sotto: "Black Jack online" });
    s._contenuto.appendChild(el("p", { class: "as-msg", text: testo }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }

  // ---------- REGISTRAZIONE ----------
  SG.registra({
    id: "blackjack",
    nome: "Black Jack",
    icona: "🃏",
    descrizione: "Il 21 contro il banco: punta le monete, chiedi carta o stai, raddoppia e dividi. Carte francesi vere, 6 mazzi. Da 1 a 10 giocatori.",
    giocatoriMin: 1, giocatoriMax: 10, difficolta: 2,
    postiOnline: 10,   // posti al tavolo online
    modi: [{ modo: "locale", icona: "📱", nome: "Su questo telefono", sotto: "Siete insieme e vi passate il telefono (fino a 10)", amici: true }],
    regole: [
      "Obiettivo: avvicinarti a <b>21</b> più del banco, senza superarlo. Le figure valgono 10, l'Asso 1 o 11.",
      "Ogni mano <b>punti le monete</b>; poi ricevi due carte. Il banco ne mostra una sola. Chi ha meno della puntata minima punta tutto quello che ha.",
      "Nel tuo turno: <b>Carta</b> (peschi), <b>Stai</b> (ti fermi), <b>Raddoppia</b> (raddoppi la puntata e prendi un'ultima carta), <b>Dividi</b> (se hai due carte uguali fai due mani).",
      "Il <b>Black Jack</b> (Asso + 10 o figura, con le prime due carte) paga 3 a 2. Dopo <b>Dividi</b> un Asso con un 10 vale 21, non Black Jack.",
      "Se il banco mostra un Asso puoi <b>assicurarti</b> (paga 2 a 1). Se mostra un Asso o un 10 controlla subito la carta coperta: se ha Black Jack la mano finisce lì e perdi solo la puntata.",
      "Il banco pesca fino ad arrivare almeno a 17. Vince chi si avvicina di più a 21. Si gioca con <b>6 mazzi</b>, rimescolati quando restano poche carte.",
      "Online ognuno gioca dal suo telefono: chi non decide in tempo salta la mano o sta. Chi finisce le monete può ripartire con 500 di prova.",
      "A fine partita vince chi ha guadagnato di più al tavolo. Col 💡 consiglio acceso (lo scegli prima di cominciare) il tasto della mossa giusta brilla."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, online = aiuti.modo === "online" || !!aiuti.sala;
      dove.modo = aiuti.torneo ? "locale" : (aiuti.modo || "locale");
      if (aiuti.torneo) dove.torneo = true;
      dove.min = 10; dove.mani = (aiuti.torneo || aiuti.sala) ? 10 : 0; dove.tempo = 25; dove.consigli = true;
      // il saldo e la ruota del giorno (online li trovi già nella saletta)
      if (!online && !aiuti.torneo && window.SGNube && SGNube.disponibile() && SGNube.profilo()) box.appendChild(riquadroBonus(el));
      function gruppo(titolo, chiave, scelte) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var riga = el("div", { style: "display:flex;gap:8px" });
        scelte.forEach(function (sc) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === sc[0] ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
            dove[chiave] = sc[0]; [].forEach.call(riga.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
          } }, [ el("div", { class: "mt", text: sc[1] }) ]);
          riga.appendChild(b);
        });
        box.appendChild(riga);
      }
      gruppo("Puntata minima", "min", [[10, "10 🪙"], [50, "50 🪙"], [100, "100 🪙"]]);
      gruppo("Quante mani", "mani", [[10, "10"], [20, "20"], [0, "Senza fine"]]);
      if (online) gruppo("Tempo per decidere", "tempo", [[15, "15 s"], [25, "25 s"], [0, "Senza limite"]]);
      gruppo("💡 Consiglio della mossa giusta", "consigli", [[true, "Sì"], [false, "No"]]);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteBJ(t, t.linkParams.stanza);
      var imp = t.impostazioni || {};
      if (imp.modo === "online") return hostBJ(t);
      return localeBJ(t);
    }
  });
})();
