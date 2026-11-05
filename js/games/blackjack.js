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
  // (un 21 morbido si scrive 21: «11/21» sembrava che si potesse ancora scegliere)
  function testo(mano, divisa) { var p = punteggio(mano); return (eBlackjack(mano) && !divisa) ? "BJ" : (p > 21 ? "sballa " + p : (eSoft(mano) && p < 21 ? "" + (p - 10) + "/" + p : "" + p)); }

  // La mossa giusta secondo la "strategia base" (6 mazzi, il banco sta sul 17).
  // m = la mano, su = la carta scoperta del banco; puoRadd/puoDiv = mosse permesse adesso.
  // le mosse permesse con le regole scelte (R = le regole da esperti: r911, das, rsa, resa…): le usano il motore e il disegno.
  // m.assi = assi divisi ancora aperti (si può solo dividere di nuovo, se la regola lo lascia, o stare)
  function mossePermesse(g, m, R) {
    R = R || {};
    var c = m.carte || [], due = c.length === 2, p = punteggio(c), soft = eSoft(c);
    return {
      carta: !m.assi, stai: true,
      raddoppia: !m.assi && due && g.fiches >= m.puntata && (!R.r911 || (!soft && p >= 9 && p <= 11)) && (R.das !== false || !m.divisa),
      dividi: due && valoreCarta(c[0].v) === valoreCarta(c[1].v) && g.fiches >= m.puntata && (g.mani || []).length < 4 && (!m.assi || !!R.rsa),
      resa: R.resa !== false && due && (g.mani || []).length === 1 && !m.divisa && !m.raddoppiata
    };
  }
  function consiglio(m, su, puoRadd, puoDiv, puoResa, h17) {
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
    // la resa (1 nov 2026): come al casinò con 6 mazzi, 16 contro 9, 10 e Asso, 15 contro 10 (8 e 8 invece si dividono: sopra)
    if (puoResa && !soft && ((p === 16 && d >= 9) || (p === 15 && d === 10) || (h17 && d === 11 && (p === 15 || p === 17)))) return "resa";   // (col banco che tira sul 17 morbido anche 15 e 17 contro l'Asso)
    if (soft) {
      if (p >= 20) return "stai";
      if (p === 19) return h17 && d === 6 ? radd("stai") : "stai";
      if (p === 18) return ((h17 ? d >= 2 : d >= 3) && d <= 6) ? radd("stai") : (d <= 8 ? "stai" : "carta");
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
  // (1 nov 2026: i simboli un po' più verso il centro, così l'indice d'angolo più grande non li tocca)
  function pip(s, x, y) {
    var cx = 50 + (x - 0.5) * 84, cy = 12 + y * 116;
    var rot = y > 0.5 ? " transform='rotate(180 " + cx + " " + cy + ")'" : "";
    return "<text x='" + cx + "' y='" + cy + "' font-size='21' text-anchor='middle' dominant-baseline='central' fill='" + colore(s) + "'" + rot + ">" + seme(s) + "</text>";
  }

  // Indice d'angolo (rango + seme) allineato al bordo: grande e senza grazie, si legge anche sulle carte piccole del tavolo.
  // In alto a sinistra; ripetuto ruotato in basso a destra.
  var CAR_CARTE = "font-family='\"SG Testo\",-apple-system,\"Segoe UI\",Roboto,system-ui,sans-serif'";
  function angolo(v, s) {
    var col = colore(s), r = RANGHI[v], fr = r.length > 1 ? 19 : 23;
    return "<g fill='" + col + "' text-anchor='middle'>" +
      "<text x='8' y='0' font-size='" + fr + "' font-weight='800' " + CAR_CARTE + (r.length > 1 ? " letter-spacing='-1.5'" : "") + " dominant-baseline='hanging'>" + r + "</text>" +
      "<text x='8' y='" + (fr + 1) + "' font-size='13' dominant-baseline='hanging'>" + seme(s) + "</text></g>";
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
        "<text x='50' y='66' font-size='40' font-weight='800' " + CAR_CARTE + " text-anchor='middle' dominant-baseline='central' fill='" + col + "'>" + RANGHI[v] + "</text>" +
        "<text x='50' y='96' font-size='24' text-anchor='middle' dominant-baseline='central' fill='" + col + "'>" + seme(s) + "</text>";
    }
    return "<svg class='bj-svg' viewBox='0 0 100 140' xmlns='http://www.w3.org/2000/svg'>" +
      "<rect x='1.5' y='1.5' width='97' height='137' rx='9' fill='#fffdf7' stroke='#d9d3c2' stroke-width='1.5'/>" +
      "<g transform='translate(6 7)'>" + angolo(v, s) + "</g>" +
      "<g transform='translate(94 133) rotate(180)'>" + angolo(v, s) + "</g>" +
      dentro + "</svg>";
  }

  // Retro carta: motivo geometrico originale. I colori li decide il tavolo (classi rb-…: vedi il CSS del tavolo di notte)
  function retroSVG() {
    return "<svg class='bj-svg bj-retro' viewBox='0 0 100 140' xmlns='http://www.w3.org/2000/svg'>" +
      "<rect class='rb-fondo' x='1.5' y='1.5' width='97' height='137' rx='9' fill='#243a86' stroke='#dfe6ff' stroke-width='1.5'/>" +
      "<rect class='rb-cornice' x='7' y='7' width='86' height='126' rx='6' fill='none' stroke='#6f86d8' stroke-width='2'/>" +
      "<g class='rb-righe' stroke='#4a63b8' stroke-width='2' opacity='.8'>" +
      "<path d='M7 40 L93 100 M7 100 L93 40 M50 7 L50 133 M7 70 L93 70'/></g>" +
      "<circle class='rb-tondo' cx='50' cy='70' r='15' fill='#1a2a63' stroke='#8fa4e6' stroke-width='2'/>" +
      "<text class='rb-21' x='50' y='70' font-size='16' font-weight='800' " + CAR_CARTE + " text-anchor='middle' dominant-baseline='central' fill='#dfe6ff'>21</text></svg>";
  }

  function cartaHTML(c, coperta) { return coperta ? retroSVG() : fronteSVG(c); }

  // esposto per il resto del modulo (motore + UI qui sotto lo usano)
  window.__BJ = {
    SEMI: SEMI, RANGHI: RANGHI, N_MAZZI: N_MAZZI, SOGLIA_RIMESCOLA: SOGLIA_RIMESCOLA,
    valoreCarta: valoreCarta, punteggio: punteggio, eSoft: eSoft, eBlackjack: eBlackjack, eBJ: eBJ, consiglio: consiglio, mossePermesse: mossePermesse,
    testo: testo, fmtN: fmtN, cartaHTML: cartaHTML, fronteSVG: fronteSVG, retroSVG: retroSVG, colore: colore
  };

  // =========================================================
  //  MOTORE — logica pura del Black Jack (niente disegno).
  //  Uno stato + azioni: riutilizzabile per "un telefono solo"
  //  e per l'online (l'host tiene lo stato e manda le viste).
  // =========================================================
  var FICHES_INIZIALI = 500;
  var FICHES_TORNEO = 1000;   // il Torneo della serata a fiches uguali: tutti partono con queste (finte)
  var PUNTATA_MIN = 10;
  var PUNTATE_RAPIDE = [10, 25, 50, 100];

  function mischiaDef(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Sabot: 6 mazzi uniti e mescolati; si rimescola quando restano poche carte.
  function nuovoSabot(mischia, nm) {
    var carte = [];
    for (var d = 0; d < (nm || N_MAZZI); d++)
      for (var s = 0; s < 4; s++)
        for (var v = 1; v <= 13; v++) carte.push({ s: s, v: v });
    return { carte: (mischia || mischiaDef)(carte), i: 0, mischia: mischia || mischiaDef };
  }
  function pescaSabot(sb) { if (sb.i >= sb.carte.length) { sb.carte = sb.mischia(sb.carte); sb.i = 0; } return sb.carte[sb.i++]; }
  function restaSotto(sb) { return (sb.carte.length - sb.i) < sb.carte.length * SOGLIA_RIMESCOLA; }
  function rimescolaSabot(sb) { sb.carte = sb.mischia(sb.carte); sb.i = 0; }

  function manoVuota(puntata) { return { carte: [], puntata: puntata, chiusa: false, raddoppiata: false, divisa: false, esito: null, vincita: 0 }; }
  var MAX_POSTI = 10;

  // ---- 😏 le battute del banco (3 nov 2026, il proprietario: «il banco prende in giro chi gioca, per far ridere il tavolo») ----
  // Nei momenti forti il banco dice UNA battuta col nome di chi c'entra: al massimo una ogni 2-3 mani. La sceglie chi tiene
  // la partita (nel motore) e va a tutti nella foto, uguale. {n} = il nome. Battute da amici al bar: MAI offensive.
  var BATTUTE = {
    sballa22: ["{n}, 22! Neanche fino a 21 sai contare", "22? {n}, il 21 era lì, bastava fermarsi a salutarlo", "{n}, 22: esageri sempre, anche stasera",
      "Un punto, {n}. UNO. Lo racconterai ai nipoti", "{n}, 22: la carta giusta era quella prima", "{n}, 22 è un bel numero… per un altro gioco",
      "22, {n}! Così vicino che quasi ti pagavo… quasi", "{n}, hai sballato col righello: di un punto preciso"],
    sballa: ["{n}, la carta in più la offre la casa. Grazie!", "{n}, chi troppo vuole…", "{n}, ma chi te l'ha detto di chiedere carta?",
      "Coraggioso, {n}, ma il 21 non si prende a spallate", "{n}, sballato! Le tue fiches stanno bene qui con me", "{n}, ancora una carta e arrivavi a 40",
      "{n}, la prossima volta chiedi a me: il consiglio è gratis", "{n}, sballato con stile, almeno"],
    meta: ["{n}, metà delle fiches in una mano. Che generosità!", "{n}, le tue fiches hanno traslocato. Qui da me", "{n}, quella mano ti è costata come una cena fuori",
      "{n}, hai dimezzato il bottino. Il banco ringrazia", "{n}, a questo ritmo il caffè te lo offro io", "{n}, la pila di prima era più bella",
      "{n}, una mano così e la pila si è fatta bassina"],
    tuttoPerso: ["{n}, tutto su una mano e… tutto a me. Grazie!", "{n}, tutto dentro! E ora tutto fuori", "{n}, il coraggio c'era. Le carte no",
      "{n}, o la va o la spacca. Si è spaccata", "{n}, tutto dentro, tutto fuori. Che velocità", "{n}, che cuore! Peccato per il resto",
      "{n}, tutto puntato e tutto perso: almeno sei coerente"],
    tuttoVinto: ["{n}, tutto su una mano e l'hai vinta. Non rifarlo, mi viene l'ansia", "{n}, raddoppiato tutto. Ok, stavolta hai ragione tu",
      "{n}, tutto e ti è andata bene. Ritenta, dai… ti prego", "{n}, che fegato! Ti ho lasciato vincere, sia chiaro", "{n} punta tutto e vince. Te le riprendo con gli interessi",
      "{n}, va bene, applausi. Ora però basta"],
    tre: ["{n}, tre di fila! Anche stasera offri tu?", "{n}, tre mani perse: sei il mio cliente preferito", "{n}, terza di fila. Vuoi che giochi io per te?",
      "{n}, tre su tre… per me. Grazie della fiducia", "{n}, cambia sedia, magari porta bene", "{n}, tre di fila! Lo dico con affetto: è un record",
      "{n}, la fortuna ti ha lasciato un biglietto: torna più tardi"],
    zero: ["{n}, ti restano due fiches e tanta dignità", "{n}, la pila è diventata un gradino", "{n}, con quelle fiches ci giochi a tris",
      "{n}, quasi a zero. Ma la rimonta sarà leggendaria, vero?", "{n}, le fiches stanno finendo, il sorriso no", "{n}, ti lascio qualche fiche per ricordo",
      "{n}, dai, da qui si può solo salire"],
    bj: ["{n}, Black Jack. Vabbè, non ti parlo più", "{n}, asso e figura… ma chi te l'ha insegnato?", "{n}, Black Jack! Lo sapevo che mi avresti tradito",
      "{n}, 3 a 2. Te li pago, ma con dolore", "{n}, Black Jack? Fammi vedere le maniche", "Black Jack di {n}. Il banco non saluta più",
      "{n}, ok, hai vinto. Ma io ho il papillon", "{n}, Black Jack? Fortuna del principiante, goditela"],
    grosso: ["{n}, mi stai svuotando la cassa. Ti tengo d'occhio", "{n}, vinci tu? Ricontrolla, sarà un errore", "{n}, goditela finché dura: tra due mani torna tutto a casa",
      "{n}, va bene, festeggia. Ma con moderazione", "{n}, queste fiches erano mie, sappilo", "{n}, mani d'oro o mazzo stregato?", "{n}, quelle fiches te le ho prestate io. Con gli interessi"],
    resa: ["{n}, bandiera bianca? Neanche hai visto le mie carte", "{n}, ti arrendi? Metà fiches a me, metà orgoglio a te", "{n}, ritirata strategica… o paura?",
      "{n}, scappi? Ti tengo la sedia calda", "{n}, saggio. Noioso, ma saggio", "{n}, ti sei arreso prima di me. Bravo… credo", "{n}, resa! Ma non dirlo in giro"],
    // quando sballa il banco ha SEMPRE una scusa e fa il fenomeno (il proprietario, 3 nov 2026: «deve fare il fenomeno il banchiere»)
    bancoSballa: ["Sballato apposta: stasera faccio beneficenza", "Vi ho lasciato vincere, se no piangevate", "Mi è scivolata la carta. A un campione capita una volta l'anno",
      "Sballato? Era per tenervi al tavolo. Roba da professionisti", "Il mazzo l'avete mischiato voi, si vede", "Avevo la luce negli occhi. Resto comunque il migliore",
      "Una mano di regalo. Non abituatevi: dalla prossima torno spietato", "Colpa del panno, è storto. Io sono perfetto"],
    raddoppio: ["{n}, raddoppiato e perso: hai raddoppiato il mio sorriso", "{n}, raddoppio! E il banco ringrazia due volte", "{n}, raddoppiare era un'idea. Non buona, ma un'idea",
      "{n}, doppia puntata, doppia figuraccia", "{n}, raddoppio perso. Te lo segno sul conto", "{n}, il raddoppio è coraggio. Il resto è storia", "{n}, due volte tanto… per me"],
    divise: ["{n}, hai diviso e hai perso due volte. Efficiente!", "{n}, due mani, due delusioni", "{n}, dividere per perdere doppio: strategia nuova",
      "{n}, hai diviso le carte… e io mi prendo tutte e due", "{n}, due mani perse insieme: un affare per me", "{n}, dividi et… perdi", "{n}, doppia mano, doppio regalo al banco"],
    cinque: ["{n}, cinque carte e niente sballo. Ma sei un mago?", "{n}, cinque carte! Pensavo volessi farti un mazzo tuo", "{n}, carta, carta, carta… e hai pure vinto. Assurdo",
      "{n}, cinque carte senza sballare: lo scrivo nel diario", "{n}, con tutte quelle carte ci giocavi a scopa", "{n}, il coraggio di un leone e la fortuna di un gatto"]
  };
  // l'ordine conta: se succedono più cose nella stessa mano vince la prima (le più rare e le più forti prima)
  var ORDINE_BATTUTE = ["tuttoPerso", "divise", "raddoppio", "zero", "tre", "meta", "sballa22", "cinque", "tuttoVinto", "bj", "grosso", "bancoSballa", "resa", "sballa"];
  var BATTUTE_LEGGERE = { bancoSballa: 1, resa: 1, sballa: 1 };   // le più comuni: una volta su due, se no sarebbero sempre loro
  // le ultime uscite (sul telefono di chi tiene la partita), per non ripeterle presto
  function pescaBattuta(chiave) {
    var l = BATTUTE[chiave], rec = [];
    try { rec = JSON.parse(localStorage.getItem("sg-bj-battute") || "[]") || []; } catch (e) { rec = []; }
    var lib = []; l.forEach(function (x, k) { if (rec.indexOf(chiave + k) < 0) lib.push(k); });
    if (!lib.length) { rec = rec.filter(function (x) { return x.indexOf(chiave) !== 0 || !/^\d+$/.test(x.slice(chiave.length)); }); lib = l.map(function (x, k) { return k; }); }
    var k = lib[Math.floor(Math.random() * lib.length)];
    rec.push(chiave + k); if (rec.length > 60) rec = rec.slice(-60);
    try { localStorage.setItem("sg-bj-battute", JSON.stringify(rec)); } catch (e) {}
    return l[k];
  }

  // opz: { min: puntata minima, mani: quante mani si giocano (0 = senza fine) }
  var ROSSO_M = ROSSO;   // (cuori e quadri: per la «Coppia» dello stesso colore)
  function creaMotoreBJ(nomi, mischia, fichesIniz, opz) {
    opz = opz || {};
    function nuovoGioc(i, n, f) {
      f = (f == null) ? FICHES_INIZIALI : Math.max(0, Math.floor(+f) || 0);
      return { id: "g" + i, nome: n, fiches: f, inizio: f, puntata: 0, assicura: 0, mani: [], attiva: 0, via: false, salta: false, prova: false, stat: statVuote() };
    }
    // per i titoli scherzosi di fine partita (1 nov 2026)
    function statVuote() { return { bj: 0, sball: 0, rese: 0, rischio: 0, segue: 0, mosse: 0, perso: 0 }; }
    var st = {
      sabot: nuovoSabot(mischia, [1, 2, 6, 8].indexOf(+opz.mazzi) >= 0 ? +opz.mazzi : N_MAZZI),
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
      // (con pochi mazzi si rimescola anche quando le carte rimaste non bastano per una mano di tutti)
      if (restaSotto(st.sabot) || st.sabot.carte.length - st.sabot.i < (st.giocatori.length + 1) * 8) { rimescolaSabot(st.sabot); st.rimescolato = true; } else st.rimescolato = false;
      st.banco = { carte: [] };
      st.giocatori.forEach(function (g) { g.puntata = 0; g.assicura = 0; g.mani = []; g.attiva = 0; g.decisoAssic = false; g.salta = false; g.coppia = 0; g.coppiaEsito = null; g.ex = {}; g.exEsito = {}; g.fIn = g.fiches; });
      st.fase = "punta"; st.battuta = null;
      // la gara (fiches uguali, con un numero di mani): le ultime 3 mani la puntata minima raddoppia (da 6 mani in su),
      // l'ultima si punta in segreto (nessuno vede le puntate degli altri finché non hanno puntato tutti)
      var gara = !!opz.uguali && st.maniTot > 0;
      st.finali = gara && st.maniTot >= 6 && st.mano >= st.maniTot - 3;
      st.segreta = gara && st.mano === st.maniTot - 1;
      st.minMano = st.min * (st.finali ? 2 : 1);
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
    // coppia: la scommessa extra «👯 Coppia» (se è accesa nelle regole): vale la puntata minima della mano, si paga appena arrivano le carte
    function punta(idx, importo, coppia, ex) {
      var g = st.giocatori[idx]; if (!g || st.fase !== "punta" || !puoPuntareG(g)) return st;
      importo = Math.floor(Number(importo)); if (!isFinite(importo)) return st;   // solo numeri interi veri
      importo = Math.max(Math.min(st.minMano || st.min, g.fiches), Math.min(importo, g.fiches));
      g.stat.rischio = Math.max(g.stat.rischio, importo / g.fiches);
      g.puntata = importo; g.fiches -= importo;
      var cq = st.minMano || st.min;
      if (opz.coppia && coppia && g.fiches >= cq) { g.coppia = cq; g.fiches -= cq; }
      g.ex = g.ex || {}; g.exEsito = g.exEsito || {};
      (Array.isArray(ex) ? ex : []).forEach(function (k) { if (EXTRA.indexOf(k) >= 0 && opz[k] && !g.ex[k] && g.fiches >= cq) { g.ex[k] = cq; g.fiches -= cq; } });
      annuncia(idx, st.segreta ? "🤫 Ho puntato" : (g.fiches === 0 ? "Tutto! " : "Punto ") + fmtN(importo));
      var next = primoCheDevePuntare(0);
      if (next < 0) chiudiPuntate(); else st.turno = next;
      return st;
    }
    // tempo scaduto per le puntate: chi non ha puntato salta questa mano, gli altri giocano
    function scadePuntate() {
      if (st.fase !== "punta" || !attiviDist().length) return st;
      st.giocatori.forEach(function (g) { if (puoPuntareG(g)) g.salta = true; });
      chiudiPuntate();
      return st;
    }
    // tutti hanno puntato: con le puntate segrete prima si scoprono tutte insieme (fase "svela", poi passoSvela), se no si distribuisce
    function chiudiPuntate() { if (st.segreta) { st.fase = "svela"; st.annuncio = null; } else distribuisci(); }
    function passoSvela() { if (st.fase === "svela") distribuisci(); return st; }

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
    // la «👯 Coppia» (come la «Perfect Pairs» dei casinò): le prime due carte dello stesso valore (K e K sì, K e Q no).
    // Colori diversi 6 a 1, stesso colore 15 a 1, identiche (stesso seme) 25 a 1. Con 6 mazzi il banco tiene appena 3 monete su 1.000.
    var PAGA_COPPIA = { mista: 6, colore: 15, perfetta: 25 };
    // le altre scommesse extra (regole da esperti, 1 nov 2026), con vincite giuste calcolate su 6 mazzi (il banco tiene dallo 0,6 al 3%):
    //  🃏 21+3 (le tue due carte + la scoperta del banco): colore 5, scala 11, tris 30, scala colore 40, tris dello stesso seme 100
    //  👑 Stesso seme: 2,5 a 1, re e donna dello stesso seme 45 a 1
    //  💥 Il banco sballa (il banco gioca sempre fino in fondo): con 3 carte 2, 4 carte 2,5, 5 carte 4, 6 carte 15, 7 carte 50, 8 e più 250
    var EXTRA = ["t213", "buster", "royal"];
    var PAGA_EXTRA = { t213: { colore: 5, scala: 11, tris: 30, scala_colore: 40, tris_seme: 100 }, royal: { seme: 2.5, reale: 45 },
      buster: { b3: 2, b4: 2.5, b5: 4, b6: 15, b7: 50, b8: 250 } };
    function tipo213(a, b, c) {
      var vs = [a.v, b.v, c.v].sort(function (x, y) { return x - y; }), seme = a.s === b.s && b.s === c.s, tris = vs[0] === vs[2];
      var scala = (vs[0] + 1 === vs[1] && vs[1] + 1 === vs[2]) || (vs[0] === 1 && vs[1] === 12 && vs[2] === 13);
      return tris && seme ? "tris_seme" : (scala && seme ? "scala_colore" : (tris ? "tris" : (scala ? "scala" : (seme ? "colore" : "no"))));
    }
    function pagaCoppie(att) {
      att.forEach(function (g) {
        if (!g.coppia) return;
        var c = g.mani[0].carte, tipo = "no";
        if (c.length === 2 && c[0].v === c[1].v) tipo = c[0].s === c[1].s ? "perfetta" : (!!ROSSO_M[c[0].s] === !!ROSSO_M[c[1].s] ? "colore" : "mista");
        var v = tipo === "no" ? 0 : g.coppia * (PAGA_COPPIA[tipo] + 1);
        g.fiches += v; g.coppiaEsito = { tipo: tipo, vincita: v };
      });
      att.forEach(function (g) {
        var c = g.mani[0].carte, ex = g.ex || {}; g.exEsito = g.exEsito || {};
        if (ex.t213) esitoExtra(g, "t213", tipo213(c[0], c[1], st.banco.carte[0]));
        if (ex.royal) esitoExtra(g, "royal", c[0].s !== c[1].s ? "no" : ((c[0].v === 12 && c[1].v === 13) || (c[0].v === 13 && c[1].v === 12) ? "reale" : "seme"));
      });
    }
    function esitoExtra(g, k, tipo) {
      var v = tipo === "no" ? 0 : Math.floor(g.ex[k] * (PAGA_EXTRA[k][tipo] + 1));
      g.fiches += v; g.exEsito[k] = { tipo: tipo, vincita: v };
    }
    function fineDistribuzione(att) {
      pagaCoppie(att);
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
      var mv = mosseValide(); g.stat.mosse++; if (consiglio(m, st.banco.carte[0], mv.raddoppia, mv.dividi, mv.resa, opz.h17) === mossa) g.stat.segue++;
      if (mossa === "carta" && mv.carta) {
        m.carte.push(pescaSabot(st.sabot)); annuncia(st.turno, "Carta!");
        if (punteggio(m.carte) >= 21) m.chiusa = true;
        else if (opz.charlie && m.carte.length >= 5) { m.chiusa = true; m.charlie = true; annuncia(st.turno, "5 carte! 🖐️"); }   // (regola «Charlie»: 5 carte senza sballare vincono)
      }
      else if (mossa === "stai") { m.chiusa = true; annuncia(st.turno, "Passo"); }
      else if (mossa === "resa") {   // ti ritiri: riprendi metà puntata (solo con le prime due carte, mai dopo Dividi)
        if (mv.resa) { m.chiusa = true; m.resa = true; annuncia(st.turno, "Mi ritiro 🏳️"); }
      }
      else if (mossa === "raddoppia") {
        if (mv.raddoppia) { g.fiches -= m.puntata; m.puntata *= 2; m.raddoppiata = true; m.carte.push(pescaSabot(st.sabot)); m.chiusa = true; annuncia(st.turno, "Raddoppio!"); }
      } else if (mossa === "dividi") {
        if (mv.dividi) {
          g.fiches -= m.puntata;
          // le due mani restano con una carta: la seconda arriva una alla volta, quando tocca a quella mano (passoDivisa)
          var nuova = manoVuota(m.puntata); nuova.carte.push(m.carte.pop());
          m.divisa = true; nuova.divisa = true;   // da qui in poi un 21 con due carte non è Black Jack
          if (m.carte[0].v === 1) { m.assi = true; nuova.assi = true; }   // split di assi: una carta sola per mano
          g.mani.splice(g.attiva + 1, 0, nuova);
          annuncia(st.turno, m.assi ? "Divido gli assi!" : "Divido!");
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
      // assi divisi: una carta sola; con «dividere di nuovo gli assi» un altro asso lascia la mano aperta (si può dividere ancora)
      if (punteggio(m.carte) >= 21 || (m.assi && !(opz.rsa && m.carte[1].v === 1 && g.mani.length < 4))) m.chiusa = true;
      return st;
    }
    // un giocatore online se ne va: non si aspetta più (le sue mani restano ferme)
    function esce(idx) {
      var g = st.giocatori[idx]; if (!g || g.via) return st;
      g.via = true;
      if (st.fase === "punta") { var p = primoCheDevePuntare(0); if (p >= 0) st.turno = p; else if (attiviDist().length) chiudiPuntate(); }
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

    function mosseValide() {
      var g = st.giocatori[st.turno]; if (!g) return {};
      return mossePermesse(g, g.mani[g.attiva] || { carte: [] }, opz);
    }

    function giocaBanco() { st.fase = "banco"; }   // gira la coperta; poi pesca a passi
    function bancoVivo() { return st.giocatori.some(function (g) { return g.mani.some(function (m) { return punteggio(m.carte) <= 21 && !eBJ(m) && !m.resa; }); }); }
    // un passo del banco: pesca se ha 16 o meno (e c'è qualcuno da battere), altrimenti risolve
    function passoBanco() {
      if (st.fase !== "banco") return st;
      var pb = punteggio(st.banco.carte), tira = pb < 17 || (opz.h17 && pb === 17 && eSoft(st.banco.carte));
      var buster = st.giocatori.some(function (g) { return g.ex && g.ex.buster; });
      if ((bancoVivo() || buster) && tira) { st.banco.carte.push(pescaSabot(st.sabot)); return st; }
      risolvi();
      return st;
    }

    function risolvi() {
      var pb = punteggio(st.banco.carte), bjBanco = eBlackjack(st.banco.carte);
      st.giocatori.forEach(function (g) {
        // assicurazione: paga 2:1 se il banco ha black jack
        if (g.assicura > 0) { if (bjBanco) g.fiches += g.assicura * 3; }
        if (g.ex && g.ex.buster) esitoExtra(g, "buster", pb > 21 ? "b" + Math.min(8, st.banco.carte.length) : "no");   // 💥 Il banco sballa
        g.mani.forEach(function (m) {
          var pm = punteggio(m.carte), bjMano = eBJ(m), v = 0, es;
          if (m.resa) { es = "resa"; v = Math.floor(m.puntata / 2); }
          else if (m.charlie && !bjBanco) { es = "vince"; v = m.puntata * 2; }   // 5 carte senza sballare
          else if (pm > 21) { es = "perde"; v = 0; }
          else if (bjMano && !bjBanco) { es = "blackjack"; v = m.puntata + Math.floor(m.puntata * 3 / 2); }
          else if (bjBanco && !bjMano) { es = "perde"; v = 0; }
          else if (bjBanco && bjMano) { es = "pari"; v = m.puntata; }
          else if (pb > 21 || pm > pb) { es = "vince"; v = m.puntata * 2; }
          else if (pm === pb) { es = "pari"; v = m.puntata; }
          else { es = "perde"; v = 0; }
          m.esito = es; m.vincita = v; g.fiches += v;
          if (es === "blackjack") g.stat.bj++; if (pm > 21) g.stat.sball++; if (es === "resa") g.stat.rese++; if (v < m.puntata) g.stat.perso += m.puntata - v;
        });
      });
      st.fase = "esito";
      st.giro++; st.mano++;
      if (opz.battute !== false) battuta(pb);
    }
    // 😏 la battuta del banco a fine mano: il momento più forte del tavolo, una sola, al massimo una ogni 2-3 mani
    function battuta(pb) {
      var cand = [], qm = st.minMano || st.min;
      st.giocatori.forEach(function (g, i) {
        if (!g.mani.length || g.via) return;
        var prima = g.fIn == null ? g.fiches : g.fIn, netto = g.fiches - prima, k = {};
        var perse = g.mani.every(function (m) { return m.esito === "perde"; }), vinte = g.mani.some(function (m) { return m.esito === "vince" || m.esito === "blackjack"; });
        g.serieP = perse ? (g.serieP || 0) + 1 : (vinte ? 0 : (g.serieP || 0));
        var tutto = g.puntata > 0 && g.puntata >= prima;
        if (tutto && netto < 0) k.tuttoPerso = 1;
        if (tutto && netto > 0) k.tuttoVinto = 1;
        if (g.mani.length > 1 && perse) k.divise = 1;
        if (g.mani.some(function (m) { return m.raddoppiata && m.esito === "perde"; })) k.raddoppio = 1;
        if (netto < 0 && g.fiches < qm * 2) k.zero = 1;
        if (g.serieP === 3) k.tre = 1;
        if (-netto > prima / 2) k.meta = 1;
        g.mani.forEach(function (m) {
          var p = punteggio(m.carte);
          if (p === 22) k.sballa22 = 1; else if (p > 21) k.sballa = 1;
          if (m.carte.length >= 5 && m.esito === "vince") k.cinque = 1;
          if (m.esito === "blackjack") k.bj = 1;
          if (m.resa) k.resa = 1;
        });
        if (netto >= Math.max(qm * 10, prima / 2)) k.grosso = 1;
        Object.keys(k).forEach(function (c) { cand.push({ c: c, i: i }); });
      });
      if (pb > 21) cand.push({ c: "bancoSballa", i: -1 });
      if (st.mano < (st.battDa || 0)) return;   // (la serie delle mani perse si conta lo stesso)
      cand = cand.filter(function (x) { return !BATTUTE_LEGGERE[x.c] || Math.random() < 0.5; });
      if (!cand.length) return;
      var c = null; ORDINE_BATTUTE.some(function (o) { c = o; return cand.some(function (x) { return x.c === o; }); });
      var chi = cand.filter(function (x) { return x.c === c; }), x = chi[Math.floor(Math.random() * chi.length)], g = st.giocatori[x.i];
      st.battSeq = (st.battSeq || 0) + 1;
      st.battuta = { id: st.battSeq, c: c, testo: pescaBattuta(c).replace("{n}", g ? g.nome : "") };
      st.battDa = st.mano + 2 + (Math.random() < 0.5 ? 1 : 0);   // la prossima tra 2 o 3 mani, mai prima
    }

    // la classifica della partita: chi ha guadagnato di più al tavolo (pari merito = stesso posto)
    function classifica() {
      var r = st.giocatori.map(function (g, k) { return { i: k, nome: g.nome, netto: g.fiches - g.inizio, fiches: g.fiches }; });
      r.sort(function (a, b) { return b.netto - a.netto; });
      r.forEach(function (x) { x.pos = 1 + r.filter(function (y) { return y.netto > x.netto; }).length; });
      return r;
    }
    // finita: le mani sono finite (o, nel torneo a fiches uguali, nessuno ha più fiches)
    function finita() {
      if (st.maniTot > 0 && st.mano >= st.maniTot) return true;
      if (st.gara && st.gara.quota) return false;   // (gara con la quota: chi è a zero può rientrare fino all'ultima mano)
      return !!opz.uguali && st.mano > 0 && st.giocatori.every(function (g) { return g.via || g.fiches <= 0; });
    }
    // si chiude il tavolo (fine delle mani o scelto da chi guida): classifica sul tavolo
    function fineTavolo() {
      if (st.fase !== "esito" && st.fase !== "punta") return st;
      if (st.fase === "punta") st.giocatori.forEach(function (g) { g.fiches += g.puntata; g.puntata = 0; });   // le puntate non giocate tornano indietro
      st.fase = "fine"; st.classifica = classifica(); st.annuncio = null;
      st.titoli = titoli();
      if (st.gara && st.gara.quota) premia();
      return st;
    }
    // ---- LA GARA CON LE SPEED COINS (1 nov 2026, il proprietario: «anche nella gara devi far usare gli speed coins»; solo online) ----
    // st.gara = { id, quota, chips, monte, pagati: { posto: quante quote pagate } }: ognuno paga la quota dal suo telefono (vedi
    // pagaGara), riceve le stesse fiches e le quote vanno nel montepremi. Chi resta senza fiches rientra pagando di nuovo, finché ha
    // monete e fino alla penultima mano. Alla fine il montepremi va ai primi (premia), anche a chi ha il telefono spento (lo prende quando torna).
    function gara(id, quota, chips, chi) {
      st.gara = { id: id, quota: quota, chips: chips, monte: 0, pagati: {}, conf: {} };
      (chi || []).forEach(function (k) { st.gara.pagati[k] = 1; });
      return st;
    }
    // il montepremi conta solo le quote che i telefoni dicono di aver pagato davvero (così non nascono monete dal nulla)
    function confermaGara(idx, q) {
      var G = st.gara; if (!G || !G.quota) return st;
      q = Math.min(Math.floor(+q) || 0, G.pagati[idx] || 0);
      if (q <= (G.conf[idx] || 0)) return st;
      G.conf[idx] = q; G.monte = 0; Object.keys(G.conf).forEach(function (k) { G.monte += G.conf[k] * G.quota; });
      return st;
    }
    function puoRientrare(idx) {
      var g = st.giocatori[idx], G = st.gara;
      return !!(G && G.quota && g && !g.via && g.fiches <= 0 && (st.fase === "esito" || (st.fase === "punta" && !(g.puntata > 0))) && st.mano < st.maniTot - 1);   // (a fine mano la puntata persa è ancora scritta: conta solo quando si punta)
    }
    function rientra2(idx) {
      if (!puoRientrare(idx)) return st;
      var g = st.giocatori[idx], G = st.gara;
      g.fiches = G.chips; G.pagati[idx] = (G.pagati[idx] || 0) + 1;   // (entra nel montepremi quando il suo telefono conferma)
      annuncia(idx, "Rientro! 🔁");
      if (st.fase === "punta" && st.turno < 0) st.turno = primoCheDevePuntare(0);
      return st;
    }
    // il montepremi: fino a 3 paganti tutto al primo, da 4 a 6 70/30, da 7 in su 60/30/10; a pari merito le parti si sommano e si dividono
    function premia() {
      var G = st.gara, paganti = Object.keys(G.pagati).length, quote = paganti <= 3 ? [1] : (paganti <= 6 ? [0.7, 0.3] : [0.6, 0.3, 0.1]);
      var vivi = st.classifica.slice();
      vivi.sort(function (a, b) { return b.fiches - a.fiches; });
      var premi = {}, k = 0;
      while (k < vivi.length && k < quote.length) {
        var pari = vivi.filter(function (x) { return x.fiches === vivi[k].fiches; }), parte = 0;
        for (var j = k; j < k + pari.length; j++) parte += quote[j] || 0;
        pari.forEach(function (x) { premi[x.i] = Math.floor(G.monte * parte / pari.length); });
        k += pari.length;
      }
      G.premi = premi;
    }
    // i titoli scherzosi: ognuno va a chi ha il numero più alto (se c'è un pari, a nessuno)
    function titoli() {
      var T = [["bj", "🍀 Il Fortunato", 1], ["rischio", "🎲 Lo Spericolato", 0.5], ["sball", "💥 Lo Sballone", 2], ["rese", "🏳️ Il Prudente", 1],
        ["seg", "🧊 Il Ragioniere", 0.8], ["perso", "🎩 L'amico del banco", 1]], out = [];
      T.forEach(function (x) {
        var best = -1, val = 0, pari = false;
        st.giocatori.forEach(function (g, i) {
          var s = g.stat || statVuote(), v = x[0] === "seg" ? (s.mosse >= 5 ? s.segue / s.mosse : 0) : s[x[0]];
          if (v > val) { val = v; best = i; pari = false; } else if (v === val && v > 0) pari = true;
        });
        if (best >= 0 && !pari && val >= x[2]) out.push({ i: best, t: x[1] });
      });
      return out;
    }
    // "Gioca ancora": una partita nuova, con le monete che avete adesso
    // (fichesUguali: il torneo a fiches uguali, tutti ripartono con le stesse fiches finte)
    function nuovaSerie(fichesUguali) {
      st.giocatori.forEach(function (g) { if (fichesUguali) { g.fiches = fichesUguali; g.prova = false; } g.inizio = g.fiches; g.stat = statVuote(); });
      st.mano = 0; st.classifica = null; st.titoli = null; st.gara = null;
      return nuovaMano();
    }

    return {
      st: st,
      nuovaMano: nuovaMano, punta: punta, assicura: assicura, azione: azione, avanza: avanza,
      passoDistribuzione: passoDistribuzione, passoBanco: passoBanco, passoDivisa: passoDivisa, passoSvela: passoSvela, esce: esce,
      gara: gara, puoRientrare: puoRientrare, rientraGara: rientra2, confermaGara: confermaGara,
      rientra: rientra, aggiungi: aggiungi, aggiungiFiches: aggiungiFiches, ricarica: ricarica,
      scadePuntate: scadePuntate, scadeAssic: scadeAssic, scadeTurno: scadeTurno,
      classifica: classifica, finita: finita, fineTavolo: fineTavolo, nuovaSerie: nuovaSerie,
      mosseValide: mosseValide, PUNTATE_RAPIDE: PUNTATE_RAPIDE, PUNTATA_MIN: PUNTATA_MIN,
      // la ripresa (l'host ha ricaricato la pagina): il tavolo com'è, come oggetto semplice (il sabot senza la funzione
      // che mescola), e di nuovo dentro il motore: la mano continua dallo stesso punto
      esporta: function () { var x = JSON.parse(JSON.stringify(st)); if (x.sabot) delete x.sabot.mischia; return x; },
      importa: function (x) {
        if (!x || typeof x !== "object" || !x.sabot || !Array.isArray(x.giocatori)) return false;
        Object.keys(x).forEach(function (k) { st[k] = x[k]; });
        st.sabot.mischia = mischia || mischiaDef;
        st.giocatori.forEach(function (g) { if (!g.stat) g.stat = statVuote(); });   // (una ripresa di prima dei titoli)
        return true;
      }
    };
  }

  window.__BJ.creaMotore = creaMotoreBJ;
  window.__BJ.FICHES_INIZIALI = FICHES_INIZIALI;
  window.__BJ.FICHES_TORNEO = FICHES_TORNEO;
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
    resa: ["Saggia ritirata 🏳️", "Metà a te, metà a me", "Prudenza, eh?", "Ritirata strategica!", "Meglio metà che niente", "Bandiera bianca, ricevuto"],
    pari: ["Pari e patta", "Nessuno vince, nessuno perde", "Tutto come prima!", "Pareggio: si ricomincia", "Patta! Rigiochiamo?", "Un bel pareggio"],
    fine: ["Grazie per aver giocato!", "Che partita!", "Alla prossima, campioni!", "Il tavolo vi aspetta sempre", "È stato un piacere 🎩",
      "Vado a lucidare le fiche", "Bella sfida, davvero!", "Tornate presto!"]
  };
  // Le scritte stampate sul panno (w × h = il panno), come nei tavoli veri: archi paralleli al bordo dei giocatori.
  // Stanno sotto carte e fiches; il colore lo dà il tavolo (--t-scritta).
  function stampaPanno(w, h) {
    var cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2, fs = Math.max(10, Math.round(w / 40)), n = 0;
    function p(r, a) { a = a * Math.PI / 180; return (cx + rx * r * Math.cos(a)).toFixed(1) + " " + (cy - ry * r * Math.sin(a)).toFixed(1); }
    function arco(r, a1, a2) { return "M" + p(r, a1) + " A" + (rx * r).toFixed(1) + " " + (ry * r).toFixed(1) + " 0 0 1 " + p(r, a2); }
    function scritta(r, a1, a2, testo, f, sp) {
      var id = "bjs" + (++n) + "-" + Math.round(w);
      return "<path id='" + id + "' d='" + arco(r, a1, a2) + "' fill='none'/>" +
        "<text font-size='" + f + "' letter-spacing='" + sp + "' fill='currentColor' text-anchor='middle'><textPath href='#" + id + "' startOffset='50%'><tspan dy='.35em'>" + testo + "</tspan></textPath></text>";
    }
    return "<svg class='bjr-stampa' viewBox='0 0 " + Math.round(w) + " " + Math.round(h) + "' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'>" +
      "<path class='banda' d='" + arco(0.35, 152, 28) + "'/><path class='banda' d='" + arco(0.45, 154, 26) + "'/>" +
      scritta(0.40, 150, 30, "L'ASSICURAZIONE PAGA 2 A 1", fs * 0.78, 2) +
      "<text x='" + cx + "' y='" + (cy - ry * 0.12).toFixed(1) + "' font-size='" + (fs * 1.15) + "' letter-spacing='3' fill='currentColor' text-anchor='middle'>BLACK JACK PAGA 3 A 2</text>" +
      "<text x='" + cx + "' y='" + (cy + ry * 0.04).toFixed(1) + "' font-size='" + (fs * 0.72) + "' letter-spacing='1.5' fill='currentColor' text-anchor='middle'>IL BANCO TIRA FINO A 16 · STA SU TUTTI I 17</text>" +
      "</svg>";
  }
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
    ".bjr-bolla.bj-doro{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400}.bjr-bolla.rossa{background:#ff8a8a;color:#3a0009}",
    "@keyframes bjrPop{from{transform:translate(-50%,-100%) scale(.3);opacity:0}}",
    ".bjr-matt{position:absolute;display:flex;flex-direction:column;align-items:center;cursor:pointer;pointer-events:auto}",
    ".bjr-matt .bj-av{width:58px;height:58px;margin:0}.bjr-matt.turno .bj-av,.bjr-matt.turno .bjr-matt-nome{border-color:#ffd45e}",
    ".bjr-matt-nome{margin-top:-8px;position:relative;background:rgba(10,18,50,.9);border:2px solid rgba(255,255,255,.16);border-radius:10px;padding:1px 8px;font-size:.7rem;font-weight:800;white-space:nowrap}",
    // Bot e quanto ha il banco stanno FUORI dalla telecamera: si vedono sempre, anche negli zoom
    ".bj-sala .bjr-matt{left:6px;bottom:6px;z-index:6}.bjr-matt-nome b{font-size:1.02rem;color:#ffe066;margin-left:4px}.bjr-matt-nome b.bust{color:#ff9d8a}.bj-sala>.bjr-fum{z-index:6}",
    // dopo "Dividi": un mazzetto per mano, quello che si gioca illuminato
    ".bjr-cc.cascata.divise{display:flex;align-items:flex-end;gap:9px}.bjr-mn{position:relative;flex:none;border-radius:5px;transform-style:preserve-3d}.bjr-mn.on{box-shadow:0 0 0 2px #ffd45e,0 0 12px rgba(255,212,94,.7)}",
    ".bjr-fum{position:absolute;max-width:150px;background:#fff;color:#12233a;font-weight:900;border-radius:13px;padding:5px 10px;font-size:.8rem;line-height:1.15;box-shadow:0 4px 12px rgba(0,0,0,.4);transform:translateY(-100%);animation:bjFum .26s cubic-bezier(.3,1.6,.5,1)}",
    ".bjr-fum.batt{max-width:min(210px,62vw);font-size:.84rem;box-shadow:0 0 0 2px var(--n-lampone,#e0225a),0 4px 12px rgba(0,0,0,.45)}",
    ".bjr-fum.bj-doro{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400}",
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
    ".bj-wrap .bjr-nome.mini.ill{font-size:11px;line-height:1.35;padding:0 5px;border-radius:8px}",
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
    ".bj-pr.bj-doro{background:linear-gradient(90deg,rgba(255,214,90,.35),rgba(255,214,90,.08));border:1px solid rgba(255,214,90,.6)}",
    ".bj-pr .md{width:26px;text-align:center}.bj-pr .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}",
    ".bj-pr .nt{white-space:nowrap}.bj-pr .nt.piu{color:#7dffa8}.bj-pr .nt.meno{color:#ff9d8a}.bj-pr .ff{color:#ffe58a;font-size:.8em;white-space:nowrap}",
    ".bj-podio.fitto{gap:2px}.bj-podio.fitto .bj-pr{padding:1px 8px;font-size:.8rem}",
    // chi guarda col link: in basso c'è la targhetta del core "👀 Guardi · 😂 · ✕" (il tavolo le lascia il posto)
    ".bj-wrap.bj-targa{padding-bottom:calc(60px + env(safe-area-inset-bottom))}",
    ".bj-hfa{display:flex;justify-content:center;margin-top:2px}",
    // ---- 🌙 NOTTE VIVACE sul tavolo: il panno, il legno e le carte restano; tasti, scritte, avvisi e classifica usano i colori della notte
    //      (testo chiaro, lampone per l'azione principale, oro delle monete per i soldi, vetro scuro pieno per finestre e righe) ----
    // la scritta sulla parete (di chi è il turno) e il tempo che resta
    ".bj-wrap .bj-turno{color:var(--o-testo);font-family:var(--o-tit);font-weight:700;font-size:1.45rem;letter-spacing:.01em;text-shadow:0 2px 8px rgba(0,0,0,.6)}",
    ".bj-wrap .bj-turno small{color:var(--n-monete);opacity:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif;font-weight:700}",
    ".bj-wrap .bj-tempo{background:var(--o-scuro);color:var(--o-scuro-testo);border:1px solid var(--o-oro)}",
    ".bj-wrap .bj-tempo.urge{background:var(--o-rosso);color:#fff;border-color:#fff}",
    // la puntata e i tasti di sotto: lampone pieno per l'azione principale, vetro scuro per «Stai» e «Tutto», solo scritta lampone per le altre
    ".bj-wrap .bj-punta-val{color:var(--n-monete);font-weight:800;font-size:1.9rem}",   // (i numeri restano nel carattere normale: «100» deve sembrare «100»)
    // il tavolo è un oggetto di gioco: resta col suo materiale, con un filo chiaro sottile e un'ombra morbida attorno
    ".bj-wrap .bj-sala{box-shadow:inset 0 0 44px rgba(0,0,0,.55),0 0 0 1px var(--o-filo-oro),0 6px 18px rgba(0,0,0,.35)}",
    ".bj-wrap .bj-btn{font-weight:800;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 4px 10px rgba(0,0,0,.3)}",
    ".bj-wrap .bj-b-carta,.bj-wrap .bj-b-si{background:var(--o-tasto);color:var(--o-tasto-testo)}",
    ".bj-wrap .bj-b-stai{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),0 4px 10px rgba(0,0,0,.3)}",
    ".bj-wrap .bj-b-radd,.bj-wrap .bj-b-dividi{background:var(--o-carta);color:var(--o-oro-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),0 4px 10px rgba(0,0,0,.3)}",
    ".bj-wrap .bj-b-no{background:rgba(255,255,255,.07);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
    ".bj-wrap .bj-sbtn{background:rgba(255,255,255,.08);color:var(--o-testo);font-weight:800;box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
    // un tasto spento (Dividi quando non si può, o per un attimo dopo un tocco): scuro e senza colore, ma la scritta si legge
    ".bj-wrap .bj-btn:disabled,.bj-wrap .bj-sbtn:disabled{opacity:1;background:var(--o-fondo-2);color:var(--o-tenue);box-shadow:inset 0 0 0 1px var(--o-filo)}",
    // il consiglio della mossa giusta: due anelli (scuro e ambra) e un alone morbido
    ".bj-wrap .bj-btn.bj-cons{box-shadow:0 0 0 2px var(--o-fondo),0 0 0 4px var(--o-ambra),0 0 14px rgba(255,181,71,.55)}",
    // scritte dei soldi in oro delle monete, i messaggi in grigio chiaro
    ".bj-wrap .bj-seat .fi,.bj-wrap .bj-esiti,.bj-wrap .bjr-nome .ff,.bj-wrap .bjr-matt-nome b,.bj-wrap .bjr-fval{color:var(--n-monete)}",
    ".bj-wrap .bj-hfiches,.bj-wrap .bj-hmini{color:var(--o-tenue);opacity:1}",
    ".bj-wrap .bjr-matt-nome b.bust{color:var(--o-rosso-testo)}",
    ".bj-wrap .bjr-fval{border-color:var(--o-filo-oro)}",
    ".bj-wrap .bj-esiti b{color:var(--o-testo)}",
    ".bj-wrap .bjr-nome .piu,.bj-wrap .bj-nome .piu,.bj-wrap .bj-esiti .piu,.bj-wrap .bj-pr .nt.piu{color:var(--o-verde)}",
    ".bj-wrap .bjr-nome .meno,.bj-wrap .bj-nome .meno,.bj-wrap .bj-pr .nt.meno{color:var(--o-rosso-testo)}",
    ".bj-wrap .bj-esiti .meno{color:#ff8089}",   // (sul verde del tavolo il rosso-testo arriva a 4,0:1: questo, un filo più chiaro, a 4,6:1)
    // i nomi sopra le teste e il croupier: blu notte quasi nero col filo chiaro (la persona di turno ha il filo lampone)
    ".bj-wrap .bjr-nome,.bj-wrap .bj-nome,.bj-wrap .bjr-matt-nome,.bj-wrap .bjr-presenta{background:rgba(9,11,22,.86);border-color:var(--o-filo-oro)}",
    ".bj-wrap .bjr-nome.attivo,.bj-wrap .bj-nome.attivo,.bj-wrap .bjr-matt.turno .bjr-matt-nome{border-color:var(--o-oro);box-shadow:0 0 0 1px var(--o-oro),0 2px 8px rgba(0,0,0,.4)}",
    ".bj-wrap .bjr-presenta{border-color:var(--o-oro)}",
    ".bj-wrap .bjr-matt.turno .bj-av{border-color:var(--o-oro)}",
    ".bj-wrap .bj-av{background:radial-gradient(circle at 50% 35%,#2f8a5c,#12452d);border-color:var(--o-filo-oro)}",
    ".bj-wrap .bjr-gioc.attivo svg{filter:drop-shadow(0 0 7px rgba(255,79,134,.8))}",
    ".bj-wrap .bj-seat.attivo,.bj-wrap .bj-mano.attiva{border-color:var(--o-oro)}",
    ".bj-wrap .bjr-mn.on{box-shadow:0 0 0 2px var(--o-oro),0 0 8px rgba(255,79,134,.5)}",
    // punti accanto alle carte
    ".bj-wrap .bj-pt.win,.bj-wrap .bj-badge.win,.bj-wrap .bjr-punti.win{background:var(--o-verde);color:var(--o-verde-testo)}",
    ".bj-wrap .bj-pt.bust,.bj-wrap .bj-badge.bust,.bj-wrap .bjr-punti.bust{background:var(--o-rosso);color:#fff}",
    // le nuvolette: chiare con la scritta scura (si staccano dal muro scuro); quella dorata (Black Jack!) nell'oro delle monete
    ".bj-wrap .bj-bolla,.bj-wrap .bjr-bolla,.bj-wrap .bjr-fum,.bj-wrap .bjr-intro .benv{background:var(--o-scuro);color:var(--o-scuro-testo)}",
    ".bj-wrap .bj-bolla::after{border-top-color:var(--o-scuro)}",
    ".bj-wrap .bjr-bolla.bj-doro,.bj-wrap .bjr-fum.bj-doro{background:var(--n-monete);color:var(--o-scuro-testo)}",
    ".bj-wrap .bjr-bolla.rossa{background:var(--o-rosso);color:#fff}",
    // «Ti alzi dal tavolo?»: la finestra in vetro scuro pieno come nel resto dell'app (Resto lampone, Mi alzo rosso)
    ".bj-wrap .bj-dlg-box{background:var(--o-carta-piena);color:var(--o-testo);border:1px solid var(--o-filo-oro);box-shadow:var(--o-ombra-alta)}",
    ".bj-wrap .bj-dlg-box b{font-family:var(--o-tit);font-weight:700;font-size:1.4rem}",
    ".bj-wrap .bj-dlg-box p{color:var(--o-tenue)}",
    ".bj-wrap .bj-dlg .bj-b-no{background:var(--o-tasto);color:var(--o-tasto-testo);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 6px 14px rgba(224,34,90,.35)}",
    ".bj-wrap .bj-dlg .bj-b-stai{background:var(--o-rosso);color:#fff;box-shadow:0 6px 14px rgba(214,60,74,.3)}",
    // la classifica sul tavolo: titolo chiaro e righe in vetro pieno col filo (la prima con l'oro delle monete)
    ".bj-wrap .bj-podio{background:rgba(8,26,17,.88)}",
    ".bj-wrap .bj-podio h3{color:var(--o-testo);font-family:var(--o-tit);font-weight:700;font-size:1.7rem;text-shadow:none}",
    ".bj-wrap .bj-pr{background:var(--o-carta-piena);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),0 4px 12px rgba(0,0,0,.25)}",
    ".bj-wrap .bj-pr.bj-doro{background:linear-gradient(180deg,rgba(255,194,71,.2),rgba(255,194,71,.06)),var(--o-carta-piena);border:0;box-shadow:inset 0 0 0 1.5px rgba(255,194,71,.75),0 6px 16px rgba(0,0,0,.3)}",
    ".bj-wrap .bj-pr .ff{color:var(--n-monete)}",
    // le regole del casinò spiegate quando succedono: assi divisi (con un piccolo asso disegnato) sotto le carte, mai sopra
    ".bj-hassi{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:3px;font-size:.78rem;font-weight:800;color:var(--n-monete,#ffc247);text-align:left;line-height:1.15;max-width:100%}",
    ".bj-asso{flex:none;display:inline-flex;align-items:center;justify-content:center;width:17px;height:23px;border-radius:3px;background:#fffdf7;color:#101014;font-size:.62rem;font-weight:900;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,.5)}",
    // ---- 🃏 IL TAVOLO DI NOTTE (1 nov 2026) ----
    // I TASTI DELLE MOSSE (deciso col Cervello): vetro scuro col SUO colore per bordo, simbolo e scritta (Carta verde, Stai rosso,
    // Raddoppia oro, Dividi azzurro, Assicura viola); la mossa consigliata si accende piena del suo colore con un bagliore.
    // Mai lampone sulle mosse. Simbolo sopra la scritta (maschera SVG col colore del tasto).
    ".bj-wrap .bj-btn.bj-m{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:4px 2px;background:rgba(13,16,32,.78);color:var(--m);box-shadow:inset 0 0 0 1.5px var(--m),0 4px 12px rgba(0,0,0,.35);transition:background-color .25s,color .25s,box-shadow .25s}",
    ".bj-m::before{content:'';flex:none;width:19px;height:19px;background:currentColor;-webkit-mask:var(--ico) center/contain no-repeat;mask:var(--ico) center/contain no-repeat}",
    ".bj-wrap .bj-btn.bj-m.bj-cons{background:var(--m);color:#0d1020;box-shadow:0 0 0 1px var(--m),0 0 18px var(--m-alone),0 4px 12px rgba(0,0,0,.35)}",
    ".bj-wrap .bj-btn.bj-m:disabled{opacity:.34;background:rgba(13,16,32,.78);color:var(--m);box-shadow:inset 0 0 0 1.5px var(--m)}",
    ".bj-m-carta{--m:#3ee0a8;--m-alone:rgba(62,224,168,.55);--ico:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='5' y='2.5' width='14' height='19' rx='2.5'/%3E%3Cpath d='M12 8.5v7M8.5 12h7'/%3E%3C/svg%3E\")}",
    ".bj-m-stai{--m:#ff6b7a;--m-alone:rgba(255,107,122,.5);--ico:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8'/%3E%3Cpath d='M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15'/%3E%3C/svg%3E\")}",
    ".bj-m-radd{--m:#ffc247;--m-alone:rgba(255,194,71,.55);--ico:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 8l7 8M10 8l-7 8M14 9.5a3 3 0 0 1 6 0c0 2.5-6 4-6 6.5h6'/%3E%3C/svg%3E\")}",
    ".bj-m-dividi{--m:#4fd8ff;--m-alone:rgba(79,216,255,.5);--ico:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 21v-7.5L5 6M12 13.5L19 6M4 10V5h5M20 10V5h-5'/%3E%3C/svg%3E\")}",
    ".bj-m-assic{--m:#b39bff;--m-alone:rgba(179,155,255,.55);--ico:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z'/%3E%3C/svg%3E\")}",
    ".bj-m-resa{--m:#d5d9ea;--m-alone:rgba(213,217,234,.45);--ico:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 22V3M5 4h11l-2 4 2 4H5'/%3E%3C/svg%3E\")}",
    // «Resa»: piccolo, accanto al punteggio della mano (così i quattro tasti grandi restano dove sono)
    ".bj-evento{position:absolute;left:50%;top:40%;z-index:7;pointer-events:none;transform:translate(-50%,-50%);max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:8px 18px;border-radius:16px;background:rgba(9,11,22,.9);font-family:var(--o-tit);font-weight:800;font-size:1.45rem;animation:bjEvento 2s ease forwards}",
    ".bj-evento.oro{color:#ffc247;box-shadow:0 0 0 1.5px #ffc247,0 0 26px rgba(255,194,71,.5)}.bj-evento.fuoco{color:#ff8a4a;box-shadow:0 0 0 1.5px #ff8a4a,0 0 26px rgba(255,138,74,.45)}",
    "@keyframes bjEvento{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}14%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}24%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-62%) scale(1)}}",
    // la gara: la classifica corta in alto (la scritta grande scende un po'), la fiche coperta della puntata segreta
    ".bj-gara{position:absolute;left:50%;top:5px;transform:translateX(-50%);z-index:6;max-width:calc(100% - 120px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:1px 10px;border-radius:10px;background:rgba(9,11,22,.82);box-shadow:inset 0 0 0 1px rgba(255,194,71,.45);color:var(--o-testo);font-size:.68rem;font-weight:800;pointer-events:none}",
    ".bj-wrap.bj-in-gara .bj-turno{top:26px}",
    // la classifica finale: il premio della gara in oro, i titoli scherzosi in fondo (a capo se non ci stanno)
    ".bj-wrap .bj-pr .ff.premio{color:var(--n-monete);font-weight:900}",
    ".bj-titoli{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 6px;max-width:340px;margin-top:6px}",
    ".bj-titoli span{background:rgba(255,194,71,.12);box-shadow:inset 0 0 0 1px rgba(255,194,71,.45);border-radius:10px;padding:1px 8px;font-size:.7rem;font-weight:800;white-space:nowrap}",
    ".bj-wrap .bjr-fiche.coperta{--fc:#2a1b12;--fb:#ffc247;animation:none}",
    // la «👯 Coppia»: un interruttore piccolo accanto alla puntata (acceso = oro)
    ".bj-valriga{display:flex;align-items:center;justify-content:center;gap:12px}.bj-valriga.tante{gap:6px}.bj-valriga.tante .bj-punta-val{font-size:1.5rem}.bj-valriga.tante .bj-coppia{padding:5px 8px}",
    ".bj-coppia{border:0;border-radius:14px;padding:5px 11px;font:800 .78rem var(--o-tit);background:rgba(13,16,32,.78);color:var(--o-tenue);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.18);cursor:pointer;white-space:nowrap}",
    ".bj-coppia.on{background:rgba(255,194,71,.16);color:#ffc247;box-shadow:inset 0 0 0 1.5px #ffc247}",
    ".bj-ptriga{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:6px}",
    ".bj-wrap .bj-btn.bj-m.bj-resa{flex:none;flex-direction:row;min-height:26px;height:26px;padding:0 10px;border-radius:13px;font-size:.78rem;gap:4px}.bj-m.bj-resa::before{width:13px;height:13px}",
    ".bj-m-no{--m:#c9cde0;--m-alone:rgba(201,205,224,.45);--ico:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.3' stroke-linecap='round'%3E%3Cpath d='M6 6l12 12M18 6L6 18'/%3E%3C/svg%3E\")}",
    // tutta la scena: fondo blu notte (mai più il verde sotto il tavolo), la parte di sotto in vetro
    "body.bj-verde{background:#0d1020}",
    ".bj-wrap{background:radial-gradient(120% 70% at 50% 0%,#1a1f3d,#0d1020 60%)}",
    ".bj-wrap .bj-sala{background:var(--t-muro-fondo);box-shadow:inset 0 0 40px rgba(0,0,0,.5),0 0 0 1px var(--o-filo-oro),0 6px 18px rgba(0,0,0,.35)}",
    ".bj-wrap .bj-hero{background:linear-gradient(180deg,rgba(30,36,62,.66),rgba(21,26,46,.8));border-radius:18px;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px var(--o-filo)}",
    ".bj-wrap .bjr-muro{background:var(--t-muro)}",
    ".bj-wrap .bjr-piano{background:var(--t-bordo);box-shadow:var(--t-bordo-luce)}",
    ".bj-wrap .bjr-panno{background:var(--t-panno);box-shadow:inset 0 0 0 1.5px var(--t-filo),inset 0 0 30px rgba(0,0,0,.5)}",
    // sul panno, come nei casinò veri (disegnate da stampaPanno): quanto paga il Black Jack, la fascia dell'assicurazione e la regola del banco
    ".bj-wrap .bjr-panno::after{content:none}",
    ".bjr-stampa{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;color:var(--t-scritta,rgba(255,215,120,.42));font-family:var(--o-tit);font-weight:700}",
    ".bjr-stampa .banda{fill:none;stroke:currentColor;stroke-width:1.3}",
    // il cerchio della puntata davanti a ogni posto (le fiches ci scivolano dentro)
    ".bj-wrap .bjr-pila::before{content:'';position:absolute;inset:-6px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--t-cerchio)}",
    // le fiches: disco pieno col bordo a spicchi bianchi e l'anello dentro (colore del tavolo per taglio: f10, f50, f250)
    ".bj-wrap .bjr-fiche{border:0;background:radial-gradient(circle,var(--fc) 0 47%,rgba(255,255,255,.9) 48% 51%,var(--fc) 52% 66%,transparent 67%),repeating-conic-gradient(var(--fc) 0 22deg,var(--fb) 22deg 38deg);box-shadow:0 1px 0 rgba(0,0,0,.6),inset 0 0 0 1px rgba(0,0,0,.25);animation:bjrScivola .45s cubic-bezier(.2,.8,.3,1) backwards}",
    // le fiches scivolano: dal posto di chi punta (lontano) al cerchio; la vincita arriva dal banco (vicino); chi perde le vede andare al banco
    "@keyframes bjrScivola{from{transform:translate3d(0,-46px,0);opacity:0}}",
    ".bj-wrap .bjr-pila.vinta .bjr-fiche{animation-name:bjrDalBanco}@keyframes bjrDalBanco{from{transform:translate3d(0,120px,0);opacity:0}}",
    ".bj-wrap .bjr-fiche.via{animation:bjrVia .6s ease-in forwards}",
    ".bj-wrap .bjr-fval{background:rgba(9,11,22,.86)}",
    // il dorso delle carte (colori del tavolo)
    ".bj-retro .rb-fondo{fill:var(--t-dorso,#243a86);stroke:var(--t-dorso-bordo,#dfe6ff)}.bj-retro .rb-cornice{stroke:var(--t-dorso-filo,#6f86d8)}.bj-retro .rb-righe{stroke:var(--t-dorso-righe,#4a63b8)}",
    ".bj-retro .rb-tondo{fill:var(--t-dorso-tondo,#1a2a63);stroke:var(--t-dorso-filo,#6f86d8)}.bj-retro .rb-21{fill:var(--t-dorso-21,#dfe6ff)}",
    // il banco: vetro, avatar un po' più grande
    ".bj-wrap .bjr-punti{top:auto;bottom:-24px}",   // (2 nov 2026: il punteggio sotto le carte: sopra, la pila delle fiches lo copriva)
    // la scritta grande in alto ha il suo fondino: niente della scena le passa sopra o la confonde
    ".bj-wrap .bj-turno{z-index:7;background:rgba(9,11,22,.78);padding:3px 14px 4px;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,.35)}.bj-wrap .bj-turno:empty{display:none}.bj-wrap .bj-turno.lunga{font-size:1.12rem}",   // (2 nov 2026: sopra le carte la pila delle fiches lo copriva)
    ".bjr-matt-carte{position:absolute;left:8px;top:8px;z-index:6;display:flex;align-items:center;gap:3px;padding:3px 5px 3px 4px;border-radius:9px;background:rgba(9,11,22,.72);box-shadow:inset 0 0 0 1px var(--o-filo-oro);pointer-events:none}.bjr-matt-carte span{font-size:.8rem;line-height:1}.bjr-matt-carte .bjr-carta{width:24px}",
    ".bj-wrap .bjr-matt-carte{top:66px}.bj-wrap.bj-in-gara .bjr-matt-carte{top:92px}",
    ".bj-wrap .bjr-matt .bj-av{width:64px;height:64px;background:radial-gradient(circle at 50% 35%,#2a3160,#141a33);border-color:var(--o-filo-oro)}",
    ".bj-wrap .bj-av{background:radial-gradient(circle at 50% 35%,#2a3160,#141a33)}",
    // 🎨 avatar illustrati (solo se accesi): il banco dalla testa alla vita DIETRO il suo bancone (con le mani sul bordo), apertura col bancone alto, braccia che escono dal disegno quando esultano
    ".bj-wrap .bjr-matt.ill .bj-av{width:92px;height:100px;border-radius:16px 16px 12px 12px;overflow:hidden}",
    ".bj-wrap .bjr-matt.ill .bj-av svg{left:0;transform:none;width:100%;bottom:0}",
    ".bj-wrap .bjr-matt.ill .bj-av::after{content:'';position:absolute;left:0;right:0;bottom:0;height:8px;background:var(--t-panno);border-top:2px solid var(--t-bordo-pieno)}",
    ".bj-wrap .bjr-matt.ill .bjr-matt-nome{margin-top:-2px}",
    // 🎨 giro 4: il banco più grande, la sua battuta SUL ritratto (sul suo gilet): non copre mai le carte né i giocatori
    ".bj-wrap .bjr-matt.ill{width:min(27%,108px)}.bj-wrap .bjr-matt.ill .bjr-matt-nome{font-size:.64rem;padding:1px 6px}.bj-wrap .bjr-matt.ill .bjr-matt-nome b{font-size:.9rem}",
    ".bj-wrap .bjr-matt.ill .bj-av{width:100%;height:auto;aspect-ratio:92/100}",
    ".bj-wrap .bjr-matt.ill .bjr-fum{position:absolute;left:50%;bottom:28px;top:auto;width:calc(100% + 10px);max-width:none;transform:translateX(-50%);box-sizing:border-box;font-size:.68rem;padding:3px 6px;text-align:center;animation:bjFumM .26s cubic-bezier(.3,1.6,.5,1);pointer-events:none;z-index:3}",
    "@keyframes bjFumM{from{transform:translateX(-50%) scale(.3);opacity:0}}",
    // l'importo della puntata sta SULLA fiche e resta piccolo anche quando la telecamera ingrandisce (prima copriva le mani)
    ".bj-wrap .bjr-fval.ill{transform:translate(-50%,-50%) scale(calc(1 / var(--zs,1)));transition:opacity .3s,transform .95s cubic-bezier(.45,.05,.25,1);font-size:.6rem;padding:0 4px}",
    ".bj-wrap .bjr-intro.ill .mg{bottom:calc(26% - 12px);transform:translateX(-50%)}",
    ".bj-wrap .bjr-intro.ill .banc{height:26%}",
    // illustrati: il fondo del disegno (la vita) sfuma, così dove il bordo del tavolo non arriva (posti di lato) non si vede un taglio netto
    ".bjr-strato.ill .bjr-gioc:not(.attivo)>svg,.bjr-strato.ill .bjr-gioc:not(.attivo)>.bjr-sal>svg{-webkit-mask-image:linear-gradient(#000 84%,transparent);mask-image:linear-gradient(#000 84%,transparent)}",
    // le braccia sopra il tavolo (mani sul panno) e il saluto che ondeggia
    ".bjr-bracc{position:absolute;inset:0;pointer-events:none;z-index:2}.bjr-gb{position:absolute}",
    ".bjr-gb .br{position:absolute;inset:0}.bjr-gb .br svg{position:absolute;left:-42.593%;top:-9.322%;width:185.185%;height:auto;display:block;overflow:visible}",
    ".bjr-gb .br.tap svg{animation:bjrTap .36s ease-in-out 2}@keyframes bjrTap{50%{transform:translateY(-3.6%)}}",
    ".bjr-sal{position:relative}.bjr-sal>svg{display:block;width:100%;height:auto}",
    ".bjr-sal .sb{position:absolute;left:0;top:0;width:100%;animation:bjrSaluta .55s ease-in-out infinite alternate}.bjr-sal .sb svg{display:block;width:100%;height:auto;overflow:visible}",
    ".bjr-sal.v .sb{left:-42.593%;top:-9.322%;width:185.185%}",
    "@keyframes bjrSaluta{from{transform:rotate(-10deg)}to{transform:rotate(11deg)}}",
    "@media (prefers-reduced-motion:reduce){.bjr-sal .sb,.bjr-gb .br.tap svg{animation:none}}",
    ".bj-wrap .bj-podio{background:rgba(9,12,26,.9)}",
    ".bj-wrap .bjr-intro{background:var(--t-muro)}.bj-wrap .bjr-intro .banc{background:var(--t-panno);border-top-color:var(--t-bordo-pieno)}",
    // la lineetta della puntata: binario di vetro, la parte puntata nell'oro delle monete, il cursore è una fiche
    ".bj-linea{display:flex;align-items:center;gap:8px;width:100%;max-width:440px;font-size:.72rem;font-weight:800;color:var(--o-tenue)}",
    ".bj-linea span{flex:none;min-width:26px;text-align:center}",
    ".bj-rg{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:34px;margin:0;background:transparent;touch-action:none;cursor:pointer}",
    ".bj-rg::-webkit-slider-runnable-track{height:8px;border-radius:4px;background:linear-gradient(90deg,var(--n-monete) var(--p,0%),rgba(255,255,255,.12) var(--p,0%));box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
    ".bj-rg::-moz-range-track{height:8px;border-radius:4px;background:linear-gradient(90deg,var(--n-monete) var(--p,0%),rgba(255,255,255,.12) var(--p,0%))}",
    ".bj-rg::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;margin-top:-11px;border-radius:50%;border:0;background:radial-gradient(circle,#ffc247 0 44%,#fff 45% 50%,#ffc247 51% 64%,transparent 65%),repeating-conic-gradient(#ffc247 0 22deg,#fff3d6 22deg 38deg);box-shadow:0 2px 8px rgba(0,0,0,.55)}",
    ".bj-rg::-moz-range-thumb{width:30px;height:30px;border-radius:50%;border:0;background:radial-gradient(circle,#ffc247 0 44%,#fff 45% 50%,#ffc247 51% 64%,transparent 65%),repeating-conic-gradient(#ffc247 0 22deg,#fff3d6 22deg 38deg);box-shadow:0 2px 8px rgba(0,0,0,.55)}",
    ".bj-rg:disabled{opacity:.4}",
    // ---- IL VESTITO «SMERALDO» (scelto dal proprietario il 1 nov 2026, tra «Mezzanotte» blu e questo): panno verde smeraldo scurissimo,
    //      bordo noce scuro col filo d'oro, luce calda sul tavolo. Le fiches: un colore per taglio, da 10 a 100.000 (come al casinò) ----
    ".bj-wrap{--t-muro-fondo:#0b0e1d;--t-muro:radial-gradient(46% 38% at 50% 64%,rgba(255,194,71,.24),rgba(255,194,71,0) 72%),linear-gradient(#141831 0%,#0f1226 55%,#0b0e1d 100%);" +
      "--t-bordo:linear-gradient(#3a2618,#1a110b);--t-bordo-pieno:#2a1b12;--t-bordo-luce:0 -1px 0 rgba(255,214,140,.5) inset,0 0 0 1.5px rgba(255,194,71,.6),0 0 20px rgba(255,194,71,.14);" +
      "--t-panno:radial-gradient(90% 80% at 50% 30%,#13603f,#0d4a31 55%,#083322);--t-filo:rgba(255,194,71,.45);--t-scritta:rgba(255,214,140,.45);--t-cerchio:rgba(255,214,140,.38);" +
      "--t-dorso:#5a1424;--t-dorso-bordo:#fff3dc;--t-dorso-filo:#ffc247;--t-dorso-righe:#7d2236;--t-dorso-tondo:#3d0d18;--t-dorso-21:#ffd98a}",
    // i tagli delle fiches: colore pieno (--fc) e spicchi del bordo (--fb)
    ".bjr-fiche.f10{--fc:#eceef2;--fb:#2f6fe0}.bjr-fiche.f50{--fc:#d6334a;--fb:#fff1f1}.bjr-fiche.f100{--fc:#2f6fe0;--fb:#eef3ff}.bjr-fiche.f500{--fc:#17171c;--fb:#ffc247}" +
      ".bjr-fiche.f1k{--fc:#7b3fe4;--fb:#efe6ff}.bjr-fiche.f5k{--fc:#ff8a1f;--fb:#fff1e0}.bjr-fiche.f10k{--fc:#ffc247;--fb:#17171c}.bjr-fiche.f50k{--fc:#e0225a;--fb:#ffe3ec}.bjr-fiche.f100k{--fc:#4fd8ff;--fb:#0d1020}",
    // schermate di servizio (Tavolo chiuso, Ops): il messaggio chiaro e centrato
    ".oro.g-blackjack .as-msg{text-align:center;color:var(--o-tenue);font-weight:700;font-size:1.05rem}"
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
  // 🎨 avatar illustrati (5 nov 2026): solo se accesi (oggi IL PAPPONE). Con quelli di oggi tutto resta come prima.
  function ill() { return !!(window.SGOmino && SGOmino.illustrato && SGOmino.illustrato()); }
  function svgAvatar(cfg, faccia, opts) {
    if (opts && !ill()) opts = opts.busto ? { busto: true } : undefined;   // (vita e gesti esistono solo negli illustrati)
    var k = JSON.stringify(cfg) + "|" + faccia + "|" + (opts ? (opts.busto ? "b" : "") + (opts.vita ? "v" : "") + (opts.gesto || "") : "") + (ill() ? "|i" : "");
    if (!svgCache[k]) {
      var c = {}, x = FACCE[faccia] || {}, n;
      for (n in cfg) c[n] = cfg[n];
      for (n in x) c[n] = x[n];
      svgCache[k] = SGOmino.svg(c, opts);
    }
    return svgCache[k];
  }
  // 🎨 (5 nov 2026, secondo giro) gesti e vestiti nostri per gli avatar illustrati: si aggiungono alla lista del motore una volta sola.
  //  bjSaluto = il braccio piegato col gomito in fuori (si fa ondeggiare intero, come chi saluta con la mano); bjBracci = le due mani
  //  appoggiate SUL PANNO, davanti al bordo del tavolo (le disegna un livello sopra il tavolo: dietro il bordo non si vedrebbero).
  function gestiBJ() {
    var A = window.SGOminoA; if (!A || !A.GESTI || A.GESTI.bjSaluto) return;
    A.GESTI.bjSaluto = { uno: { t: function (G) { return [G.Jd + 50, G.Jy - 100]; }, f: [1, 0.82], mano: "aperta" } };
    A.GESTI.bjBracci = { due: { t: function (G) { return [G.Jd * 1.12, G.Y.vita + 54]; }, f: [0.95, 0.52], mano: "piatta", davanti: 1 } };
  }
  function cfgConFaccia(cfg, faccia) { var c = {}, x = FACCE[faccia] || {}, n; for (n in cfg) c[n] = cfg[n]; for (n in x) c[n] = x[n]; return c; }
  // chi saluta: il corpo e il braccio sono due disegni, il braccio ondeggia (solo transform) attorno alla spalla
  function salutoHTML(cfg, faccia, vita) {
    var k = "S|" + JSON.stringify(cfg) + "|" + faccia + "|" + (vita ? 1 : 0);
    if (svgCache[k]) return svgCache[k];
    gestiBJ();
    var pp = SGOmino.parti ? SGOmino.parti(cfgConFaccia(cfg, faccia), { gesto: "bjSaluto", lato: 1, vita: !!vita }) : null;
    if (!pp) return (svgCache[k] = svgAvatar(cfg, faccia, vita ? { vita: true, gesto: "saluta" } : { gesto: "saluta" }));
    return (svgCache[k] = "<div class='bjr-sal" + (vita ? " v" : "") + "'>" + pp.corpo + "<div class='sb' style='transform-origin:" + (pp.perno.x / 2).toFixed(2) + "% " + (pp.perno.y / 2.64).toFixed(2) + "%'>" + pp.braccio + "</div></div>");
  }
  // le due braccia sul panno (livello sopra il tavolo); quello che batte il colpetto lo fa con un saltello (solo transform)
  function bracciaTavoloHTML(cfg, faccia, batte) {
    var k = "B|" + JSON.stringify(cfg) + "|" + faccia + "|" + (batte ? 1 : 0);
    if (svgCache[k]) return svgCache[k];
    gestiBJ();
    var c = cfgConFaccia(cfg, faccia);
    return (svgCache[k] = [-1, 1].map(function (l) { return "<div class='br" + (batte && l === 1 ? " tap" : "") + "'>" + SGOmino.svg(c, { gesto: "bjBracci", parte: "braccio", latoParte: l }) + "</div>"; }).join(""));
  }
  var VESTE_BANCO = { capo: "gilet", maglia: 7, collo: "papillon", colCollo: 0 };   // il banco: camicia chiara e gilet scuro (si stacca dallo sfondo notte)
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
  function avatarBanco(vm) {
    var b = (vm && vm.croupier && avatarValido(vm.croupier.omino)) || MATT_DEALER;
    if (!ill()) return b;
    var c = {}, n; for (n in b) c[n] = b[n]; for (n in VESTE_BANCO) c[n] = VESTE_BANCO[n];
    return c;
  }

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
    var testoSaldo = el("div", { style: "color:var(--bj-saldo,#ffe58a);font-weight:800;" + (compatto ? "font-size:.95rem;margin-bottom:5px" : "font-size:1.1rem;margin-bottom:8px"), html: "🪙 Hai <b>" + fmt(saldo) + "</b> monete" });
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
    if (vm && vm.uguali) {   // torneo a fiches uguali: le fiches sono finte, contano solo le mani (niente monete né record di fiches)
      var cu = { maniGiocate: 0, maniVinte: 0, blackjackFatti: 0, maniSballate: 0, maniPari: 0 };
      g.mani.forEach(function (m) {
        cu.maniGiocate++;
        if (m.esito === "vince" || m.esito === "blackjack") cu.maniVinte++;
        if (m.esito === "blackjack") cu.blackjackFatti++;
        if (BJ.punteggio(m.carte) > 21) cu.maniSballate++;
        if (m.esito === "pari") cu.maniPari++;
      });
      var iu = []; for (var ku in cu) if (cu[ku]) iu.push([ku, cu[ku]]);
      SGNube.salvaProgressi(null, "blackjack", iu, [], []);
      return;
    }
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
      battuta: st.fase === "esito" && st.battuta ? { id: st.battuta.id, c: st.battuta.c, testo: st.battuta.testo } : null,   // 😏 la battuta del banco
      puntataMin: st.minMano || st.min, consigli: !!(extra && extra.consigli), croupier: st.croupier || null, coppia: !!(extra && extra.coppia),
      regole: extra ? { h17: !!extra.h17, r911: !!extra.r911, das: extra.das !== false, rsa: !!extra.rsa, resa: extra.resa !== false, charlie: !!extra.charlie,
        t213: !!extra.t213, buster: !!extra.buster, royal: !!extra.royal } : {},
      // la gara: mani finali, ultima mano segreta, quota e montepremi, titoli di fine partita
      finali: !!st.finali, segreta: !!st.segreta, gara: st.gara || null, titoli: st.fase === "fine" ? (st.titoli || null) : null,
      uguali: !!(extra && extra.uguali),   // il Torneo della serata a fiches uguali (finte: nessun profilo si tocca)
      // la carta coperta del banco non parte finché non si gira (nessuno la può sbirciare)
      banco: st.banco.carte.map(function (c, k) { return (k === 1 && !scoperta) ? { s: 0, v: 0, cop: 1 } : cp(c); }),
      classifica: st.fase === "fine" ? st.classifica : null,
      giocatori: st.giocatori.map(function (g) {
        // l'ultima mano della gara si punta in segreto: di chi ha già puntato non si vedono né la puntata (-1 = coperta) né le fiches
        var cop = st.segreta && st.fase === "punta" && g.puntata > 0;
        return { id: g.id, rid: g.rid || null, nome: g.nome, fiches: cop ? null : g.fiches, puntata: cop ? -1 : g.puntata, assicura: g.assicura, attiva: g.attiva,
          via: !!g.via, dec: !!g.decisoAssic, salta: !!g.salta, prova: !!g.prova, coppia: cop ? 0 : (g.coppia || 0), coppiaEsito: g.coppiaEsito || null, ex: cop ? {} : JSON.parse(JSON.stringify(g.ex || {})), exEsito: JSON.parse(JSON.stringify(g.exEsito || {})),   // (copie: sullo stesso telefono la foto di prima non deve cambiare con quella dopo)
          mani: g.mani.map(function (m) { return { carte: m.carte.map(cp), chiusa: m.chiusa, esito: m.esito, vincita: m.vincita, puntata: m.puntata, divisa: !!m.divisa, assi: !!m.assi, resa: !!m.resa, charlie: !!m.charlie }; }) };
      })
    };
  }
  function mosseValideVm(vm) {
    var g = vm.giocatori[vm.turno]; if (!g) return {};
    return BJ.mossePermesse(g, g.mani[g.attiva] || { carte: [] }, vm.regole);
  }

  // ---- il tavolo: disegna da un vm e chiama i callback del "driver".
  //      mioIdx = il seat del giocatore su QUESTO telefono. ----
  function tavoloBJ(t, drv) {
    iniettaCSS();
    var el = t.el;
    var s = t.schermata({
      titolo: "🃏 Black Jack", sotto: drv.sotto || "Banco: Bot", scura: true,   // (il tavolo verde resta scuro: solo tasti, scritte e avvisi hanno l'oro)
      indietro: function () { chiediUscita(); }
    });
    var wrap = el("div", { class: "bj-wrap" + (t.guarda ? " bj-targa" : "") });
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
    var batt = null, battId = -1, battTimer = null;   // 😏 la battuta del banco: nel fumetto di Bot per 3,8 s, poi sparisce da sola (non ferma niente)
    var scopri = { attesa: false, t: null };   // la carta coperta di Bot si gira solo quando la telecamera è arrivata
    var puntataSegreta = 0;
    // le scommesse extra accese su questo telefono (la «👯 Coppia» e le altre): spente finché non le tocchi, poi le ricorda il telefono
    var extraSi = {}; ["coppia", "t213", "royal", "buster"].forEach(function (k) { try { extraSi[k] = localStorage.getItem("sg-bj-" + k) === "1"; } catch (e) { extraSi[k] = false; } });   // la mia puntata dell'ultima mano della gara (nella foto è coperta per tutti)
    var heroK = null, bloccoT = null;          // la parte di sotto si rifà solo se cambia; i tasti bloccati dopo un tocco
    var tempo = { el: el("div", { class: "bj-tempo", hidden: "hidden" }), fine: 0, k: "", int: null, ultimoS: -1 };
    zBanco.appendChild(tempo.el);
    function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }
    // ci si alza dal tavolo: tutti i tempi si fermano (niente mani che vanno avanti senza schermata)
    function chiudi() {
      if (chiuso) return;
      chiuso = true;
      clearInterval(guardia);
      [timerPasso, bollaTimer, scopri.t, bloccoT, eventoT].forEach(function (x) { if (x) clearTimeout(x); });
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
      if (vm.fase !== "punta") { puntSel = null; puntataSegreta = 0; }
      aggiornaTempo();
      anim = { ultima: -1, banco: false }; daVolare = [];
      if (pre && vm.fase === "banco" && pre.fase !== "banco") {
        scopri.attesa = true; clearTimeout(scopri.t);
        scopri.t = setTimeout(function () { scopri.attesa = false; if (vm && document.body.contains(wrap)) { disegnaScena(); disegnaHero(); } }, 1150);
      } else if (vm.fase !== "banco") { scopri.attesa = false; clearTimeout(scopri.t); }
      applicaDiff(pre, vm);
      eventi(pre, vm);
      if (vm.battuta && vm.battuta.id !== battId) {
        battId = vm.battuta.id; batt = vm.battuta;
        clearTimeout(battTimer);
        battTimer = setTimeout(function () { batt = null; if (!chiuso && vm && document.body.contains(wrap)) disegnaScena(); }, 3800);
      }
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
      else if (vm.fase === "svela") timerPasso = setTimeout(function () { drv.onPasso("svela"); }, 2600);
      else if (manoDaCompletare()) timerPasso = setTimeout(function () { drv.onPasso("divisa"); }, 900);
      else if (manoChiusaAttiva()) {
        var g = vm.giocatori[vm.turno], m = g.mani[g.attiva], p = BJ.punteggio(m.carte);
        var pausa = p > 21 ? 1800 : (BJ.eBJ(m) ? 1600 : 1200);
        timerPasso = setTimeout(function () { drv.onPasso("avanza"); }, pausa);
      }
    }
    // i momenti che contano, in grande sul tavolo per tutti (1 nov 2026): il Black Jack di qualcuno (vibra solo a chi l'ha fatto)
    // e chi punta TUTTO. Solo transform e trasparenza; uno alla volta (il nuovo prende il posto del vecchio)
    var eventoEl = null, eventoT = null;
    var NOMI_EXTRA = { colore: "colore", scala: "scala", tris: "tris", scala_colore: "scala colore", tris_seme: "tris dello stesso seme", seme: "stesso seme",
      reale: "re e donna dello stesso seme", b3: "il banco sballa con 3 carte", b4: "il banco sballa con 4 carte", b5: "il banco sballa con 5 carte",
      b6: "il banco sballa con 6 carte", b7: "il banco sballa con 7 carte", b8: "il banco sballa con 8 carte" };
    // (più annunci insieme, per esempio due scommesse vinte alla stessa carta: in fila, uno dopo l'altro, al massimo 4)
    var codaEv = [];
    function evento(testo, cls) {
      codaEv.push([testo, cls]); if (codaEv.length > 4) codaEv.shift();
      if (!eventoEl) prossimoEvento();
    }
    function prossimoEvento() {
      var x = codaEv.shift(); if (!x || chiuso) { eventoEl = null; return; }
      eventoEl = el("div", { class: "bj-evento " + x[1], text: x[0] }); zBanco.appendChild(eventoEl);
      eventoT = setTimeout(function () { if (eventoEl) eventoEl.remove(); eventoEl = null; prossimoEvento(); }, codaEv.length ? 1500 : 2000);
    }
    function eventi(pre, v) {
      if (!pre || pre.giocatori.length !== v.giocatori.length) return;
      v.giocatori.forEach(function (g, i) {
        var p = pre.giocatori[i], m = g.mani[0], pm = p.mani[0];
        if (g.mani.length === 1 && m && BJ.eBJ(m) && !(pm && BJ.eBJ(pm))) {
          evento("🎉 Black Jack di " + g.nome + "!", "oro");
          if (!drv.mioIdx || i === mioIdx()) { try { if (navigator.vibrate) navigator.vibrate([30, 40, 70]); } catch (e) {} }
        }
        if (v.fase === "punta" && g.puntata > 0 && g.fiches === 0 && !p.puntata) evento("🔥 " + g.nome + " punta TUTTO!", "fuoco");
        Object.keys(g.exEsito || {}).forEach(function (k) {
          var e = g.exEsito[k]; if (!e || !e.vincita || (p.exEsito && p.exEsito[k])) return;
          evento(({ t213: "🃏 ", royal: "👑 ", buster: "💥 " })[k] + g.nome + ": " + (NOMI_EXTRA[e.tipo] || e.tipo) + "! +" + fmt(e.vincita - ((g.ex || {})[k] || 0)), "oro");
          if (!drv.mioIdx || i === mioIdx()) { try { if (navigator.vibrate) navigator.vibrate([30, 40, 70]); } catch (e2) {} }
        });
        if (g.coppiaEsito && !p.coppiaEsito && g.coppiaEsito.vincita > 0) {   // la «👯 Coppia» vinta: in grande per tutti, vibra a chi l'ha presa
          evento("👯 " + g.nome + ": coppia" + ({ mista: "", colore: " di colore", perfetta: " perfetta" })[g.coppiaEsito.tipo] + "! +" + fmt(g.coppiaEsito.vincita - g.coppia), "oro");
          if (!drv.mioIdx || i === mioIdx()) { try { if (navigator.vibrate) navigator.vibrate([30, 40, 70]); } catch (e) {} }
        }
        if (v.gara && p.fiches <= 0 && g.fiches > 0 && v.fase === pre.fase) evento("🔁 " + g.nome + " rientra in gara!", "oro");
      });
      if (!inGara(v)) return;
      if (v.mano === 0 && v.fase === "punta") capoPrima = null;
      if (v.fase === "punta" && pre.fase !== "punta") {
        if (v.segreta) evento("🤫 Ultima mano: puntate segrete!", "oro");
        else if (v.finali && !pre.finali) evento("🔥 Ultime 3 mani: minima " + fmt(v.puntataMin) + "!", "fuoco");
      }
      if (v.fase === "svela" && pre.fase !== "svela") evento("🥁 Si scopre!", "oro");
      if (v.fase === "esito" && pre.fase !== "esito" && v.mano < v.maniTot) {
        var capo = capoDi(v);
        if (v.maniTot >= 6 && v.mano === Math.floor(v.maniTot / 2)) evento("🔔 Giro di boa" + (capo ? ": comanda " + capo.nome : ""), "oro");
        else if (capo && capoPrima && capo.nome !== capoPrima) evento("⬆️ " + capo.nome + " passa in testa!", "oro");
        if (capo) capoPrima = capo.nome;
      }
    }
    // 🎨 i gesti degli avatar illustrati: brevi, partono solo quando cambia il motivo (mai a ogni ridisegno) e poi torna «mani sul tavolo»
    var gesti = {};   // posto → { g, fino }
    function gestoDi(i) { var x = gesti[i]; return x && Date.now() < x.fino ? x.g : ""; }
    function dai(i, g, ms) {
      if (!ill()) return;
      var x = gesti[i] = { g: g, fino: Date.now() + ms };
      setTimeout(function () { if (gesti[i] === x && !chiuso && vm && R && document.body.contains(zBanco)) disegnaScena(); }, ms + 30);
    }
    function applicaDiff(pre, v) {
      if (!pre) return;
      if (ill()) {
        var nb = BJ.punteggio(v.banco) > 21;
        v.giocatori.forEach(function (g, i) {
          var pg = pre.giocatori[i];
          if (pre.fase === "gioca" && v.fase === "gioca" && pg && contaCarte(g) > contaCarte(pg)) dai(i, "batte", 750);   // «Carta»: un colpetto sul panno
          else if (v.fase === "esito" && pre.fase !== "esito" && nettoDi(g) > 0) {   // vincita: se il banco ha sballato prima applaude, poi esulta
            if (nb) { dai(i, "applaude", 1200); setTimeout(function () { if (vm && vm.fase === "esito" && !chiuso && R && document.body.contains(zBanco)) { dai(i, "esulta", 2000); disegnaScena(); } }, 1200); }
            else dai(i, "esulta", 2400);
          }
        });
      }
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
    // i tagli delle fiches (1 nov 2026, il proprietario: «se punto 10.000 ce ne deve stare una da 10.000»): la pila si fa coi tagli più grandi
    var FICHE = [[100000, "f100k"], [50000, "f50k"], [10000, "f10k"], [5000, "f5k"], [1000, "f1k"], [500, "f500"], [100, "f100"], [50, "f50"], [10, "f10"]];
    function puntataDi(g) { return g.mani && g.mani.length ? g.mani.reduce(function (s, m) { return s + m.puntata; }, 0) : (g.puntata || 0); }
    function nettoDi(g) {
      var n = 0; g.mani.forEach(function (m) { n += m.vincita - m.puntata; }); if (g.coppiaEsito) n += g.coppiaEsito.vincita - (g.coppia || 0);
      Object.keys(g.exEsito || {}).forEach(function (k) { n += g.exEsito[k].vincita - ((g.ex || {})[k] || 0); });
      return n;
    }
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
          if (m.resa) { r.faccia = "pensa"; r.fum = frase("resa", sm); }
          else if (p > 21) { r.faccia = "esulta"; r.fum = frase("sballa", sm); }
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
      // 😏 la battuta del banco prende il posto della frase di sempre (una sola alla volta), finché non sparisce
      if (batt && vm.fase !== "fine") { r.fum = batt.testo; r.oro = false; r.batt = true; r.faccia = /^(bj|grosso|tuttoVinto|cinque|bancoSballa)$/.test(batt.c) ? "triste" : "esulta"; }
      return r;
    }
    function cartaR(c, w, nuova, coperta) { var d = el("div", { class: "bjr-carta" + (nuova ? " arriva" : ""), html: BJ.cartaHTML(c, coperta) }); d.style.width = w + "px"; return d; }

    var cam = el("div", { class: "bjr-cam" }), capt = el("div", { class: "bj-turno" });
    // Bot con quanto ha il banco: fuori dalla telecamera, così si vede sempre (anche quando zooma su chi gioca)
    var hud = el("div", { class: "bjr-matt" }, [ el("div", { class: "bj-av" }), el("div", { class: "bjr-matt-nome" }) ]), fumEl = null;
    hud.onclick = function () { sbircia(-1); };
    zBanco.appendChild(cam); zBanco.appendChild(capt); zBanco.appendChild(hud);
    var R = null;   // il mondo costruito: si rifà solo se cambia il numero di giocatori o la misura dello schermo

    // 😏 la battuta è più lunga della frase di sempre: se tocca carte, punteggi, fiches o nomi (tante carte del banco, la
    // carte che arrivano) sale sopra di loro, a ogni fotogramma per i primi 2,5 s. Mai sopra le cose che contano.
    // (illustrati, da soli: la battuta non copre nemmeno chi festeggia; in più giocatori la sposta il solo spazio libero)
    function spostaBatt() {
      if (!fumEl || ill() || !fumEl.classList.contains("batt") || !document.body.contains(fumEl)) return;   // (illustrati: la battuta sta sul ritratto del banco)
      var zr = zBanco.getBoundingClientRect();
      for (var k = 0; k < 4; k++) {
        var a = fumEl.getBoundingClientRect(), su = null;
        [].forEach.call(zBanco.querySelectorAll(".bjr-carta, .bjr-cc, .bjr-punti, .bjr-fiche, .bjr-pila, .bjr-fval, .bjr-nome, .bjr-matt-carte" + (ill() && vm.giocatori.length === 1 ? ", .bjr-gioc" : "")), function (e) {
          var b = e.getBoundingClientRect(); if (!b.width || !b.height) return;
          if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) su = su == null ? b.top : Math.min(su, b.top);
        });
        if (su == null || su - zr.top - 4 < a.height) return;
        fumEl.style.top = Math.round(su - zr.top - 4) + "px";
      }
    }
    function hudLargo(W) { return Math.round(Math.min(W * 0.27, 108)); }   // (illustrati: il croupier in basso a sinistra, piccolo)
    function costruisci() {
      var N = vm.giocatori.length, W = zBanco.clientWidth, H = zBanco.clientHeight;
      svuota(cam); cam.style.transition = "none"; cam.style.transform = "none";
      cam.appendChild(el("div", { class: "bjr-muro" }));
      var strato = el("div", { class: "bjr-strato" + (ill() ? " ill" : "") }), prosp = el("div", { class: "bjr-prosp", style: "perspective:" + Math.round(H * 1.8) + "px" });
      var PW = Math.round(W * 1.55), PH = Math.round(H * 1.0), PWi = PW - 26, PHi = PH - 26;
      var piano = el("div", { class: "bjr-piano", style: "width:" + PW + "px;height:" + PH + "px;margin-left:" + (-PW / 2) + "px;bottom:" + Math.round(-PH * 0.1) + "px" });
      var panno = el("div", { class: "bjr-panno" }), sopra = el("div", { class: "bjr-sopra" }), bracc = el("div", { class: "bjr-bracc" });
      piano.appendChild(panno); prosp.appendChild(piano);
      panno.insertAdjacentHTML("afterbegin", stampaPanno(PWi, PHi));   // le scritte stampate sul panno, come nei casinò
      [strato, prosp, bracc, sopra].forEach(function (z) { cam.appendChild(z); });   // (le braccia illustrate stanno sopra il tavolo: le mani sul panno)
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
      var yBanco = ill() ? 0.7 : 0.8;   // (illustrati: più in alto, così non finisce sotto il croupier in basso)
      var bancoCC = su(cx, PHi * yBanco, el("div", { class: "bjr-cc" })), bancoMira = su(cx, PHi * yBanco, el("div", { class: "bjr-segno" }));
      // misuro dove sono finiti (telecamera ferma) e siedo le persone dietro al bordo
      var zr = zBanco.getBoundingClientRect();
      function pt(n) { var r = n.getBoundingClientRect(); return { x: r.left + r.width / 2 - zr.left, y: r.top + r.height / 2 - zr.top, sc: r.width / 100 }; }
      var base = (N <= 4 ? 128 : (N <= 6 ? 108 : 96)) * Math.max(1, Math.min(1.4, H / 340));
      var punti = seg.map(function (s) { return pt(s.segno); });
      // 🎨 illustrati (5 nov 2026, giro 4): fino a 6 giocatori tutti la STESSA misura, grandi quanto lo spazio tra i vicini e sempre dentro lo schermo
      //  (prima i posti più lontani, in alto, erano minuscoli e quelli ai lati finivano sotto il bordo)
      var altoI = N <= 4 ? 80 : 104, wComune = 0;   // (con più di 4 il cartellino del nome a due righe sta sopra le teste: serve posto)
      if (ill() && N > 1 && N <= 6) {
        wComune = 1e9; var alta = H / W > 1.5 ? 1.1 : 1;   // (schermo alto: avatar più grandi, così la metà in alto non resta vuota)
        punti.forEach(function (p, i) {
          var vic = 999; [i - 1, i + 1].forEach(function (j) { if (j >= 0 && j < N) vic = Math.min(vic, Math.hypot(punti[j].x - p.x, punti[j].y - p.y)); });
          wComune = Math.min(wComune, vic * (N <= 4 ? 1.5 : 1.25) * alta, W / N * (N <= 4 ? 1.5 : 1.3) * alta, (p.y - altoI) / 0.9226, base * 0.95 * alta);
        });
        wComune = Math.max(40, Math.round(wComune));
      }
      seg.forEach(function (s, i) {
        var p = punti[i], vic = 999;
        [i - 1, i + 1].forEach(function (j) { if (j >= 0 && j < N) vic = Math.min(vic, Math.hypot(punti[j].x - p.x, punti[j].y - p.y)); });
        var w = Math.round(Math.min(base * Math.max(0.7, Math.min(1.4, p.sc)), vic * (N > 6 ? 1.75 : 1.35)));
        // (1 nov 2026: testa e nome stanno sotto la scritta grande in alto, «Punta Luca»: prima a 360x640 si coprivano)
        var alto = N > 6 ? 70 : 96, testa = Math.round(p.y - w * 0.9); if (testa < alto) { w = Math.max(30, Math.round((p.y - alto) / 0.9)); testa = Math.round(p.y - w * 0.9); }
        // 🎨 illustrati: dalla testa alla vita, seduti DIETRO il bordo del tavolo con le mani appoggiate sul panno (prima in piedi, lontani)
        if (ill()) {
          if (wComune) { w = wComune; p = { x: Math.max(w * 0.5 + 2, Math.min(W - w * 0.5 - 2, p.x)), y: p.y, sc: p.sc }; }   // (dentro lo schermo: la figura si sposta appena, le fiches restano dove sono)
          else {
            w = Math.round(Math.min(w * 0.8, Math.max(36, vic * 1.05)));
            if (p.y + w * 0.17 - 1.0926 * w < alto) w = Math.max(30, Math.round((p.y - alto) / 0.9226));
          }
          testa = Math.round(p.y + w * 0.17 - 1.0926 * w);
        }
        s.x = p.x; s.y = p.y; s.w = w; s.testa = testa; s.carte = pt(s.mira); s.fp = pt(s.mf);
        s.fig = el("div", { class: "bjr-gioc", style: "left:" + Math.round(p.x - w / 2) + "px;top:" + testa + "px;width:" + w + "px;z-index:" + Math.round(p.y) });
        s.fig.onclick = function () { sbircia(i); };
        strato.appendChild(s.fig);
        if (ill()) { s.br = el("div", { class: "bjr-gb", style: "left:" + Math.round(p.x - w / 2) + "px;top:" + testa + "px;width:" + w + "px;height:" + Math.round(w * 118 / 108) + "px" }); bracc.appendChild(s.br); }
        // con 7-10 giocatori: solo il nome, largo al massimo quanto lo spazio tra due vicini, e uno su e uno giù
        var largo = N > 6 || (ill() && N > 4) ? "max-width:" + Math.max(34, Math.round(vic * 2 - 6)) + "px;" : "";
        s.top0 = testa + Math.round(w * (ill() ? -0.02 : 0.06));   // (illustrati: il cartellino sta SOPRA la testa, mai su cappello e fronte)
        s.nome = el("div", { class: "bjr-nome" + (N > 6 || (ill() && N > 4) ? " mini" : "") + (ill() ? " ill" : ""), style: largo + "left:" + Math.round(p.x) + "px;top:" + s.top0 + "px" });
        s.fval = el("div", { class: "bjr-fval" + (ill() ? " ill" : ""), style: "left:" + Math.round(s.fp.x) + "px;top:" + Math.round(s.fp.y - (ill() ? 0 : 10)) + "px;opacity:0" });   // il valore sopra la pila
        sopra.appendChild(s.nome); sopra.appendChild(s.fval);
        s.cw = N > 6 ? 22 : (N > 4 ? 31 : 40);   // (1 nov 2026: carte più grandi, avatar un po più piccoli: il tavolo prima di tutto)
        var fd = N > 6 ? 22 : 32; s.pila.style.width = s.pila.style.height = fd + "px";
        s.k = {};   // cosa è già disegnato (per non rifare niente che non è cambiato)
      });
      var bm = pt(bancoMira), bDisp = 0;
      if (ill()) {   // 🎨 le carte del banco stanno a destra del croupier (che sta in basso a sinistra), mai sotto di lui
        var hudR = hudLargo(W) + 14, bsc0 = bm.sc || 1, bdisp = W - hudR - 10;   // spazio per le carte
        var tx = Math.max(W / 2, hudR + 6 + Math.min(bdisp, 3 * 50 * bsc0 + 6) / 2);
        if (Math.abs(tx - bm.x) > 1) { var dl = (tx - bm.x) / bsc0; [bancoCC, bancoMira].forEach(function (n) { n.style.left = Math.round(cx + dl) + "px"; }); bm = pt(bancoMira); }
        bDisp = Math.max(60, Math.min(2 * (bm.x - hudR - 6), 2 * (W - bm.x - 6)));   // larghezza utile attorno al centro
      }
      R = { N: N, W: W, H: H, seg: seg, bancoCC: bancoCC, bx: bm.x, by: bm.y, bsc: bm.sc || 1, bDisp: bDisp, sopra: sopra, k: {} };
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
        var gp = ill() ? gestoDi(i) : "", kf = facciaDi(g, i) + (attivo ? "*" : "") + gp;
        if (s.k.f !== kf) { s.k.f = kf; var cfg = avatarDi(i); var sulPanno = !!s.br && (gp === "" || gp === "batte");   // illustrati: mani sul panno (le disegna il livello sopra il tavolo; il corpo ha la stessa posa, così non ci sono due mani)
          if (ill()) gestiBJ();
          s.fig.innerHTML = cfg ? svgAvatar(cfg, facciaDi(g, i), ill() ? { vita: true, gesto: sulPanno ? "bjBracci" : (gp || "tavolo") } : undefined) : ""; s.fig.className = "bjr-gioc" + (attivo ? " attivo" : "");
          if (s.br) s.br.innerHTML = cfg && sulPanno ? bracciaTavoloHTML(cfg, facciaDi(g, i), gp === "batte") : ""; }
        // sopra la testa: il nome e le fiche che ha (a fine mano anche quanto ha vinto o perso)
        var d = vm.fase === "esito" ? nettoDi(g) : 0;
        var kn = g.nome + "|" + attivo + "|" + d + "|" + g.fiches + "|" + !!g.via + "|" + (drv.mioIdx && i === mioIdx());
        // (2 nov 2026) quando la telecamera è su chi gioca, nome e monete li dice la scritta grande in alto: i cartellini sulle teste
        // si nascondono (comparivano due volte, e quello del vicino finiva sotto la scritta); tornano quando la telecamera si allarga
        s.nome.style.visibility = (vm.fase === "gioca" || (vm.fase === "assic" && !drv.mioIdx) || (ill() && (s.pr || (attivo && vm.fase === "punta" && !drv.mioIdx && N > 1)))) ? "hidden" : "";   // (illustrati: chi ha già la sua scritta grande in alto o la targa della presentazione non ha anche il cartellino: prima il nome compariva due volte)
        if (s.k.n !== kn) {
          s.k.n = kn; nomiCambiati = true; s.nome.className = "bjr-nome" + (N > 6 || (ill() && N > 4) ? " mini" : "") + (ill() ? " ill" : "") + (attivo ? " attivo" : "") + (g.via ? " via" : "");
          s.nome.innerHTML = "";
          if (N > 6 || (ill() && N > 4)) { s.nome.textContent = (drv.mioIdx && i === mioIdx() ? "⭐" : "") + g.nome + (g.via ? " 👋" : ""); }   // le monete si leggono sotto e nello zoom
          else {
            s.nome.appendChild(el("div", { text: g.nome + (drv.mioIdx && i === mioIdx() && N > 1 ? " ⭐" : "") + (g.via ? " 👋" : "") }));
            var rf = el("div", { class: "ff", text: g.fiches == null ? "🤫" : fmt(g.fiches) + " 🪙" });
            if (d) rf.appendChild(el("b", { class: d > 0 ? "piu" : "meno", text: " " + (d > 0 ? "+" : "−") + fmt(Math.abs(d)) }));
            s.nome.appendChild(rf);
          }
        }
        // le fiche puntate, col valore scritto sopra (a fine mano: chi perde resta senza, chi vince vede la vincita)
        var imp = vm.fase === "esito" ? g.mani.reduce(function (a, m) { return a + (m.vincita || 0); }, 0) : puntataDi(g);
        if (s.k.p !== imp && imp === -1) {   // puntata segreta: una fiche coperta, il valore non si sa
          s.k.p = imp; svuota(s.pila); s.pila.appendChild(el("div", { class: "bjr-fiche coperta" })); s.fval.textContent = "🤫"; s.fval.style.opacity = 1;
        } else if (s.k.p !== imp) {
          var cresce = imp > (s.k.p || 0); s.k.p = imp; s.pila.classList.toggle("vinta", vm.fase === "esito");
          if (!imp && s.pila.children.length) { [].forEach.call(s.pila.children, function (f) { f.classList.add("via"); }); setTimeout(function () { if (!s.k.p) svuota(s.pila); }, 650); }
          else {
            svuota(s.pila); var resto = imp, nf = 0;
            FICHE.forEach(function (f) { while (resto >= f[0] && nf < 14) { var ch = el("div", { class: "bjr-fiche " + f[1], style: "transform:translateZ(" + (nf * 2.6) + "px)" + (cresce ? ";animation-delay:" + (nf * 0.06) + "s" : ";animation:none") }); s.pila.appendChild(ch); nf++; resto -= f[0]; } });
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
      if (nomiCambiati && (N > 6 || (ill() && N > 4))) sistemaNomi();
      // le carte di Bot (vicino a noi): la coperta si gira solo quando la telecamera è arrivata
      var scoperta = (vm.fase === "banco" || vm.fase === "esito" || vm.fase === "fine") && !scopri.attesa;
      var kb = vm.banco.map(function (c) { return c.v + "" + c.s; }).join(",") + "|" + scoperta;
      if (R.k.b !== kb) {
        var pr = R.k.nb || 0, gira = R.k.cop && scoperta && pr === vm.banco.length && R.bancoCC.children[1];
        R.k.b = kb; R.k.nb = vm.banco.length; R.k.cop = !scoperta && vm.banco.length > 1;
        if (gira) giraCarta(R.bancoCC.children[1], vm.banco[1]);
        else { svuota(R.bancoCC); var cwB = 50; if (ill() && R.bDisp) cwB = Math.max(30, Math.min(50, Math.floor((R.bDisp / R.bsc - 3 * Math.max(0, vm.banco.length - 1)) / Math.max(1, vm.banco.length)))); vm.banco.forEach(function (c, k) { R.bancoCC.appendChild(cartaR(c, cwB, k >= pr && vm.banco.length > pr, !scoperta && k === 1)); }); }
      }
      // Bot nell'angolo con quanto ha il banco (sempre visibile)
      var fm = faccinaMatt(), pB = testoBanco(scoperta);
      // (1 nov 2026) mentre la telecamera è su chi gioca, le carte vere del banco restano in vista accanto alla sua faccia: è la carta che serve per decidere
      var conCarte = (vm.fase === "gioca" || vm.fase === "assic" || (vm.fase === "esito" && esitoZoom())) && vm.banco.length > 0;
      var km = (ill() ? "i" : "") + fm.faccia + "|" + fm.fum + "|" + pB + "|" + vm.fase + "|" + nomeBanco(vm) + "|" + (conCarte ? kb : "");
      if (R.k.m !== km) {
        R.k.m = km;
        hud.className = "bjr-matt" + (vm.fase === "banco" ? " turno" : "") + (ill() ? " ill" : "");
        if (window.SGOmino) hud.firstChild.innerHTML = svgAvatar(avatarBanco(vm), fm.faccia, ill() ? { vita: true, gesto: "tavolo" } : { busto: true });
        var hn = hud.children[1]; hn.innerHTML = ""; hn.appendChild(document.createTextNode(pB ? "🎩 Banco" : "🎩 " + nomeBanco(vm)));
        if (pB) hn.appendChild(el("b", { class: /Sball/.test(pB) ? "bust" : "", text: pB }));
        var mc = zBanco.querySelector(".bjr-matt-carte"); if (mc) mc.remove();   // (in alto a sinistra: nello zoom su chi gioca lì non c'è niente)
        if (conCarte) { mc = el("div", { class: "bjr-matt-carte" }, [ el("span", { text: "🎩" }) ]); vm.banco.forEach(function (c, k) { mc.appendChild(el("div", { class: "bjr-carta", html: BJ.cartaHTML(c, k === 1 && !scoperta) })); }); zBanco.appendChild(mc); }
        if (fumEl) fumEl.remove(); fumEl = null;
        if (fm.fum) { fumEl = el("div", { class: "bjr-fum" + (fm.oro ? " bj-doro" : "") + (fm.batt ? " batt" : ""), style: ill() ? "" : "left:8px;top:" + (R.H - 96) + "px", text: fm.fum }); (ill() ? hud : zBanco).appendChild(fumEl); if (fm.batt) { var fino = Date.now() + 2500; (function giro() { spostaBatt(); if (Date.now() < fino && fumEl && fumEl.classList.contains("batt")) requestAnimationFrame(giro); })(); } }   // il fumetto sta sopra la testa di Bot, lontano dalle carte
      }
      // la nuvoletta della mossa sopra la testa di chi l'ha detta
      [].forEach.call(R.sopra.querySelectorAll(".bjr-bolla"), function (b) { if (!bolla || +b.dataset.id !== bollaId) b.remove(); });
      if (bolla && R.seg[bolla.seat] && !R.sopra.querySelector(".bjr-bolla")) {
        var sb = R.seg[bolla.seat], tb = bolla.testo, tipo = /sball/i.test(tb) ? " rossa" : (/black|21/i.test(tb) ? " bj-doro" : "");
        R.sopra.appendChild(el("div", { class: "bjr-bolla" + tipo, "data-id": bollaId, style: "left:" + Math.round(sb.x) + "px;top:" + (ill() && sb.nome.style.visibility !== "hidden" ? Math.max(20, Math.round(parseFloat(sb.nome.style.top) - sb.nome.offsetHeight - 3)) : Math.max(20, sb.testa - 16)) + "px", text: tb }));   // (illustrati: la nuvoletta sta SOPRA il cartellino del nome, mai sopra le lettere)
      }
      // in grande sulla parete: chi sta giocando
      var gt = vm.giocatori[vm.turno], scritta = "", sotto = "", quale = vm.maniTot ? "mano " + Math.min(vm.maniTot, vm.mano + (vm.fase === "esito" ? 0 : 1)) + " di " + vm.maniTot : "";
      if (vm.fase === "distrib") scritta = nomeBanco(vm) + " distribuisce…";
      else if (vm.fase === "svela") { scritta = "🥁 Si scopre!"; sotto = "le puntate dell'ultima mano"; }
      else if (vm.fase === "banco") scritta = "Tocca a " + nomeBanco(vm) + " 🎩";
      else if (vm.fase === "esito") { scritta = vm.maniTot && vm.mano >= vm.maniTot ? "Ultima mano finita!" : "Fine mano"; sotto = quale; }
      else if (vm.fase === "fine") scritta = "Fine partita 🏁";
      else if (vm.fase === "punta" && drv.mioIdx) {   // online si punta tutti insieme
        var manc = vm.giocatori.filter(function (x, j) { return puoPuntare(vm, j); }).map(function (x) { return x.nome; });
        scritta = vm.segreta ? "🤫 Puntate segrete!" : "Puntate! 🪙"; sotto = manc.length ? "aspettiamo " + manc.slice(0, 3).join(", ") + (manc.length > 3 ? "…" : "") : quale;
      }
      else if (vm.fase === "assic" && drv.mioIdx) scritta = "Assicurazione?";
      else if (vm.fase === "punta" && !gt) scritta = "Monete finite 😅";
      else if (gt) { scritta = (vm.fase === "punta" ? (vm.segreta ? "🤫 Punta " : "Punta ") : (vm.fase === "assic" ? "Assicura? " : "Tocca a ")) + gt.nome; sotto = fmt(gt.fiches) + " 🪙" + (vm.fase === "punta" && quale ? " · " + quale : ""); }
      var kcap = intro.corre ? "" : scritta + "|" + sotto;
      if (capt.dataset.k !== kcap) {   // la scritta si rifà solo se cambia
        capt.dataset.k = kcap; capt.innerHTML = ""; capt.classList.toggle("lunga", scritta.length > 15);   // (un nome lungo: la scritta più piccola, mai tagliata)
        if (!intro.corre) { capt.appendChild(el("div", { text: scritta })); if (sotto) capt.appendChild(el("small", { text: sotto })); }
      }
      disegnaGara();
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
    // ---- LA GARA (fiches uguali con un numero di mani): la classifica corta sempre in alto, il montepremi se c'è la quota ----
    var garaEl = el("div", { class: "bj-gara", hidden: "hidden" }), capoPrima = null;
    zBanco.appendChild(garaEl);
    function inGara(v) { return !!(v && v.uguali && v.maniTot); }
    function capoDi(v) {   // chi comanda la gara (null se sono pari in testa)
      var l = v.giocatori.filter(function (g) { return g.fiches != null && !g.via; }).sort(function (a, b) { return b.fiches - a.fiches; });
      return l.length && (l.length < 2 || l[0].fiches > l[1].fiches) ? l[0] : null;
    }
    function disegnaGara() {
      var si = inGara(vm) && vm.fase !== "fine", testo = "";
      if (si) {
        var monte = vm.gara && vm.gara.quota ? " · 🏆 " + fmt(vm.gara.monte) : "";
        if (vm.segreta && vm.fase === "punta") testo = "🤫 Ultima mano" + monte;
        else {
          var md = ["🥇", "🥈", "🥉"], l = vm.giocatori.map(function (g, i) { return { n: g.nome, f: g.fiches || 0, i: i, via: g.via }; }).filter(function (x) { return !x.via; });
          l.sort(function (a, b) { return b.f - a.f; });
          testo = l.slice(0, 3).map(function (x, k) { return md[k] + " " + x.n + " " + fmt(x.f); }).join(" · ") + monte;
        }
      }
      if (garaEl.dataset.k === testo) return;
      garaEl.dataset.k = testo; garaEl.textContent = testo; garaEl.hidden = !si;
      wrap.classList.toggle("bj-in-gara", si);
    }
    // fine partita: la classifica sul tavolo (chi ha guadagnato di più al primo posto)
    var podio = null;
    function disegnaPodio() {
      if (vm.fase !== "fine" || !vm.classifica) { if (podio) { podio.remove(); podio = null; } return; }
      var premi = (vm.gara && vm.gara.premi) || {}, kp = JSON.stringify([vm.classifica, vm.titoli, premi]);
      if (podio && podio.dataset.k === kp) return;
      if (podio) podio.remove();
      var N = vm.classifica.length, md = ["🥇", "🥈", "🥉"];
      podio = el("div", { class: "bj-podio" + (N > 6 ? " fitto" : ""), "data-k": kp }, [ el("h3", { text: vm.uguali ? "🏆 Classifica del torneo" : "🏁 Classifica" }) ]);
      vm.classifica.forEach(function (r) {
        var n = r.netto;
        podio.appendChild(el("div", { class: "bj-pr" + (r.pos === 1 && n > 0 ? " bj-doro" : "") }, [
          el("span", { class: "md", text: N > 1 ? (md[r.pos - 1] || r.pos + "°") : "🃏" }),
          el("span", { class: "nm", text: r.nome + (drv.mioIdx && r.i === mioIdx() && N > 1 ? " ⭐" : "") }),
          el("span", { class: "nt " + (n > 0 ? "piu" : (n < 0 ? "meno" : "")), text: n ? (n > 0 ? "+" : "−") + fmt(Math.abs(n)) : "pari" }),
          el("span", { class: "ff" + (premi[r.i] ? " premio" : ""), text: premi[r.i] ? "🏆 +" + fmt(premi[r.i]) + " 🪙" : fmt(r.fiches) + " 🪙" })   // (la gara con la quota: il premio vinto)
        ]));
      });
      // i titoli scherzosi della partita
      if (vm.titoli && vm.titoli.length) podio.appendChild(el("div", { class: "bj-titoli" }, vm.titoli.map(function (x) {
        var g = vm.giocatori[x.i]; return el("span", { text: x.t + " · " + (g ? g.nome : "") });
      })));
      zBanco.appendChild(podio);
    }
    function disegnaBanco() { disegnaScena(); }
    function disegnaTavolata() { disegnaScena(); }

    // ---------- LA TELECAMERA ----------
    var camK = "", sbirciaFino = 0;
    function inquadra(box, durata) {
      var W = R.W, H = R.H, tr, s = 1;
      if (!box) tr = "translate(0px,0px) scale(1)";
      else {
        var su = wrap.classList.contains("bj-in-gara") ? 70 : 40;   // (in alto la scritta grande, nella gara anche la classifica: lì la telecamera non va)
        s = Math.min(2.6, Math.min(W / box.w, (H - su) / box.h) * 0.92);
        var tx = W / 2 - box.x * s, ty = (H + su) / 2 - box.y * s;
        if (ill()) tx = Math.min(0, Math.max(W - W * s, tx));   // (illustrati: dai lati non si esce dal tavolo)
        ty = Math.max(ty, H - H * 1.1 * s);   // il bordo vicino del tavolo è a 1,1 H: sotto non c'è niente, non si scende oltre
        tr = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
      }
      if (tr === camK) return;
      camK = tr; cam.style.setProperty("--zs", box ? s.toFixed(3) : "1"); cam.style.transitionDuration = (durata || 0.95) + "s"; cam.style.transform = tr;
    }
    // (2 nov 2026) l'inquadratura prende avatar, fiches, carte E il punteggio sotto le carte: con tanti giocatori i posti di lato hanno
    // le carte spostate rispetto alla testa, e prima finivano fuori dallo schermo
    function suGiocatore(i, largo) {
      var s = R.seg[i], sc = (s.carte && s.carte.sc) || 1, mezze = (s.ccW || s.cw * sc) / 2 + 12;
      var top = s.testa - 46, bot = Math.max(s.carte.y + (s.cw * 0.8 + 34) * sc, s.fp.y + 34);   // (sopra la testa c'è posto per la nuvoletta «Raddoppio!»)
      var x0 = Math.min(s.x - s.w * 0.4, s.carte.x - mezze, s.fp.x - 30), x1 = Math.max(s.x + s.w * 0.4, s.carte.x + mezze, s.fp.x + 30);
      return { x: (x0 + x1) / 2, y: (top + bot) / 2, w: Math.max((x1 - x0) * (largo ? 1.6 : 1.08), s.w * (largo ? 3 : 1.3), largo ? 230 : 140), h: (bot - top) * (largo ? 1.25 : 1) };
    }
    // 🎨 illustrati, da 3 in su: la telecamera su chi gioca tiene dentro anche i VICINI (interi, mai tagliati a metà) e non esce dal tavolo
    function suTurno(i) {
      var b = suGiocatore(i);
      if (!ill() || vm.giocatori.length < 3) return b;
      var x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, y0 = b.y - b.h / 2, y1 = b.y + b.h / 2;
      [i - 1, i + 1].forEach(function (j) { var n = R.seg[j]; if (!n) return; x0 = Math.min(x0, n.x - n.w * 0.55); x1 = Math.max(x1, n.x + n.w * 0.55); y0 = Math.min(y0, n.testa - 22); });
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
    }
    function esitoZoom() { return ill() && vm.giocatori.length <= 3; }
    function suTutti() {
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      vm.giocatori.forEach(function (g, i) { var r = suGiocatore(i); x0 = Math.min(x0, r.x - r.w / 2); x1 = Math.max(x1, r.x + r.w / 2); y0 = Math.min(y0, r.y - r.h / 2); y1 = Math.max(y1, r.y + r.h / 2); });
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
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
      if (f === "gioca" || (f === "assic" && !drv.mioIdx)) inquadra(suTurno(vm.turno), veloce ? 0.6 : 0.85);   // online l'assicurazione è di tutti: tavolo intero
      else if (f === "banco") inquadra(suMatt());
      else if (f === "distrib") {
        // primo giro largo; al secondo giro la telecamera scorre lungo il tavolo seguendo la carta
        if (anim.ultima >= 0 && contaCarte(vm.giocatori[anim.ultima]) >= 2) inquadra(suGiocatore(anim.ultima, true), veloce ? 0.4 : 0.55);
        else if (anim.banco && vm.banco.length >= 2) inquadra(suMatt(), 0.6);
        else if (anim.ultima >= 0 || anim.banco) inquadra(null, 0.6);
      }
      else if (f === "esito" && esitoZoom()) inquadra(suTutti(), 0.9);   // illustrati: a fine mano si vede CHI HA VINTO che festeggia (il banco resta nell'angolo con le sue carte)
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
    function introGiaVista() { if (drv.senzaIntro) return true; try { return !!(drv.stanza && sessionStorage.getItem("bj-intro-" + drv.stanza)); } catch (e) { return false; } }
    function apertura() {
      intro.fatta = true;
      if (introGiaVista()) { telecamera(); return; }
      try { if (drv.stanza) sessionStorage.setItem("bj-intro-" + drv.stanza, "1"); } catch (e) {}
      intro.corre = true;
      var N = vm.giocatori.length, velo = el("div", { class: "bjr-intro" + (ill() ? " ill" : "") }, [
        el("div", { class: "mg", html: window.SGOmino ? (ill() ? salutoHTML(avatarBanco(vm), "esulta", true) : svgAvatar(avatarBanco(vm), "esulta", undefined)) : "" }), el("div", { class: "banc" }) ]);
      intro.velo = velo;
      if (ill() && velo.firstChild) { var mw = Math.round(Math.min(R.W * 0.9, R.H * 0.64 / 1.09)); velo.firstChild.style.width = mw + "px"; velo.firstChild.style.maxWidth = "none"; }   // il croupier grande, dalla vita in su
      zBanco.appendChild(velo); capt.innerHTML = ""; capt.dataset.k = "";
      var passi = [];
      function poi(ms, fn) { passi.push([ms, fn]); }
      function esulta(i) { var s = R.seg[i]; s.k.f = "x"; var cfg = avatarDi(i); if (cfg) { s.fig.innerHTML = ill() ? salutoHTML(cfg, "esulta", true) : svgAvatar(cfg, "esulta", undefined); if (s.br) s.br.innerHTML = ""; } }
      poi(450, function () { velo.appendChild(el("div", { class: "benv", text: "Benvenuti al tavolo! 🎩" })); });
      poi(1500, function () { inquadra(suGiocatore(0, N > 4), 0.01); velo.classList.add("via"); });
      poi(600, function () { velo.remove(); });
      if (N <= 4) {   // pochi: uno alla volta, col nome
        vm.giocatori.forEach(function (g, i) {
          poi(0, function () { inquadra(suGiocatore(i), 0.6); });
          poi(450, function () { esulta(i); var pr = el("div", { class: "bjr-presenta", text: vm.giocatori[i].nome }); zBanco.appendChild(pr); R.seg[i].pr = pr; if (ill()) R.seg[i].nome.style.visibility = "hidden"; });
          poi(600, function () { var s = R.seg[i]; if (s.pr) s.pr.remove(); s.pr = null; if (ill()) s.nome.style.visibility = ""; });
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
      if (R) R.seg.forEach(function (s) { s.k.f = null; s.pr = null; });
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
    function etichettaEsito(m) { if (m.charlie && m.esito === "vince") return "5 carte!"; return ({ vince: "vince", blackjack: "BJ!", perde: "perde", pari: "pari", resa: "resa" })[m.esito] || ""; }

    // ---------- LA PARTE DI SOTTO: si rifà solo quando cambia quello che mostra (niente lampeggio) ----------
    function maniK(g) { return g ? g.mani.map(function (m) { return m.carte.map(function (c) { return c.v + "" + c.s; }).join(",") + (m.chiusa ? "c" : "") + m.puntata + (m.esito || ""); }).join("/") : ""; }
    function chiaveHero() {
      var f = vm.fase, io = drv.mioIdx ? mioIdx() : -1, me = vm.giocatori[io];
      var base = [f, !!drv.puoAgire(vm), io, me ? [me.fiches, me.puntata, !!me.via, !!me.prova, !!me.salta] : null, !!(drv.puoRuota && drv.puoRuota()),
        drv.guardo ? drv.guardo(vm) : ""];   // (guardo soltanto: la scritta cambia appena l'host mi mette tra chi guarda)
      if (f === "punta") {
        var i = chiDecide(), g = vm.giocatori[i];
        if (g) return JSON.stringify(base.concat(["P", i, g.nome, g.fiches, vm.puntataMin]));
        return JSON.stringify(base.concat(["PW", vm.giocatori.map(function (x, j) { return puoPuntare(vm, j) ? x.nome : ""; }), vm.giocatori.every(function (x) { return x.fiches <= 0; })]));
      }
      if (f === "assic") { var a = chiDecide(); return JSON.stringify(base.concat(["A", a, maniK(vm.giocatori[a] || me)])); }
      if (f === "gioca") { var gg = vm.giocatori[vm.turno]; return JSON.stringify(base.concat(["G", vm.turno, gg ? gg.attiva : -1, maniK(gg), gg ? gg.fiches : 0])); }
      if (f === "banco") return JSON.stringify(base.concat(["B", bancoTira()]));
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
      var gtx = drv.mioIdx && !vm.giocatori[mioIdx()] ? (drv.guardo && drv.guardo(vm)) || "" : "";
      if (drv.mioIdx && !vm.giocatori[mioIdx()] && !gtx) return heroInfo("🪑", "Ti stai sedendo al tavolo…");   // appena arrivato: il posto sta arrivando
      // guardo e basta (link "guarda", tavolo pieno, nella Sala non gioco): la mano di chi tocca, senza tasti, con la riga sopra
      if (gtx) zHero.appendChild(el("div", { class: "bj-hmini", text: gtx }));
      // arrivato a mano cominciata: ho già il posto, gioco dalla prossima mano (niente tasti finché la mano non è mia)
      var meH = drv.mioIdx ? vm.giocatori[mioIdx()] : null;
      if (meH && !meH.mani.length && !meH.puntata && ["distrib", "assic", "gioca", "banco"].indexOf(vm.fase) >= 0) zHero.appendChild(el("div", { class: "bj-hmini", text: "✋ Giochi dalla prossima mano" }));
      if (vm.fase === "distrib") return heroInfo("🂠", nomeBanco(vm) + " distribuisce…");
      if (vm.fase === "svela") return heroInfo("🥁", "Si scoprono le puntate!");
      if (vm.fase === "punta") return heroPunta(chiDecide());
      if (vm.fase === "assic") return heroAssic(chiDecide());
      if (vm.fase === "banco") return bancoTira() ? heroInfo("🎩", vm.regole && vm.regole.h17 ? "Il banco tira fino a 17, anche sul 17 morbido" : "Il banco tira sempre fino a 17") : heroInfo("🎴", "Gioca il banco…");
      if (vm.fase === "gioca") return heroGioca(mio);
      if (vm.fase === "esito") return heroEsito();
    }
    // dopo un tocco i tasti si spengono finché non arriva il tavolo nuovo (niente doppio tocco = doppia carta)
    function bloccaTasti() {
      [].forEach.call(zHero.querySelectorAll("button"), function (b) { b.disabled = true; });
      if (bloccoT) clearTimeout(bloccoT);
      bloccoT = setTimeout(function () { bloccoT = null; if (!chiuso && vm) disegnaHero(true); }, 1500);   // la mossa non è passata: si riaccendono
    }
    // il banco a 16 o meno pesca sempre (anche se sta già vincendo): si dice appena si vede la carta coperta,
    // così nessuno pensa a un errore. Se ha già vinto con tutti (sballati o Black Jack) non pesca e non si dice.
    function bancoTira() {
      if (vm.fase !== "banco" || scopri.attesa || BJ.punteggio(vm.banco) > 21) return false;
      if (vm.banco.length > 2) return true;
      var R = vm.regole || {}, pb = BJ.punteggio(vm.banco), tira = pb < 17 || (R.h17 && pb === 17 && BJ.eSoft(vm.banco));
      return tira && vm.giocatori.some(function (g) { return (g.ex && g.ex.buster) || g.mani.some(function (m) { return BJ.punteggio(m.carte) <= 21 && !BJ.eBJ(m) && !m.resa; }); });
    }
    // «Assi divisi: una carta per asso, come al casinò» (con un piccolo asso disegnato: l'emoji della carta non c'è su tutti i telefoni)
    function notaAssi() {
      return el("div", { class: "bj-hassi" }, [ el("span", { class: "bj-asso", text: "A♠" }), document.createTextNode("Assi divisi: una carta per asso, come al casinò") ]);
    }
    function tasto(txt, cls, fn) { return el("button", { class: "bj-btn " + cls, text: txt, onclick: function () { fn(); } }); }
    function heroInfo(ico, txt) {
      zHero.appendChild(el("div", { style: "font-size:2.6rem;line-height:1", text: ico }));
      zHero.appendChild(el("div", { class: "bj-hnome", text: txt }));
    }
    // monete finite: si riparte con 500 di prova, si gira la ruota del giorno (o, sullo stesso telefono, si chiude la partita)
    // (gara con la quota) chi è senza fiches rientra pagando di nuovo la quota, se ha le monete: un tasto con la conferma
    function tastoRientro() {
      var q = vm.gara && vm.gara.quota;
      if (!q || !drv.puoRientrare || !drv.puoRientrare(vm)) return null;
      return tasto("🔁 Rientra (" + fmt(q) + " 🪙)", "bj-b-carta", function () {
        t.conferma("Rientri nella gara?", "Paghi " + fmt(q) + " Speed Coins (vanno nel montepremi) e riparti con " + fmt(vm.gara.chips) + " fiches.", "Sì, rientro", function () { bloccaTasti(); drv.onRientra(); });
      });
    }
    function heroZero() {
      if (vm.uguali) {   // torneo a fiches uguali: niente ricariche, chi è a zero guarda la fine (o rientra, nella gara con la quota)
        var rt = tastoRientro();
        zHero.appendChild(el("div", { class: "bj-hnome", text: rt ? "🏳️ Fiches finite!" : (drv.mioIdx ? "🏳️ Fiches finite: guardi come finisce il torneo" : "Fiches finite per tutti! 🏳️") }));
        if (rt) zHero.appendChild(el("div", { class: "bj-azioni" }, [ rt ]));
        if (!drv.mioIdx && drv.onFine) zHero.appendChild(el("div", { class: "bj-azioni" }, [ tasto("🏁 Classifica", "bj-b-carta", function () { bloccaTasti(); drv.onFine(); }) ]));
        return;
      }
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
        if (io && io.puntata === -1) zHero.appendChild(el("div", { class: "bj-punta-val", text: "🤫 " + (puntataSegreta ? fmt(puntataSegreta) + " 🪙" : "Hai puntato") }));   // (la mia puntata segreta la so solo io)
        else if (io && io.puntata) zHero.appendChild(el("div", { class: "bj-punta-val", text: fmt(io.puntata) + " 🪙" }));
        else if (io && io.salta) zHero.appendChild(el("div", { class: "bj-hnome", text: "Questa mano la guardi" }));
        zHero.appendChild(el("div", { class: "bj-hfiches", text: manc.length ? "Aspettiamo " + manc.join(", ") + "…" : "Nessuno ha monete da puntare" }));
        return;
      }
      var maxP = g.fiches, minP = Math.min(vm.puntataMin || 10, maxP);   // con meno della puntata minima si punta tutto
      if (puntSel == null) puntSel = Math.min(ultimePuntate[chiavePuntata(g)] || Math.max(100, minP), maxP);   // di base la stessa puntata della mano prima
      puntSel = Math.max(minP, Math.min(puntSel, maxP));
      var val = el("div", { class: "bj-punta-val", text: fmt(puntSel) + " 🪙" });
      // le scommesse extra: un interruttore per ognuna accesa nelle regole, accanto alla puntata (spenti finché non li tocchi, poi li
      // ricorda il telefono: mai monete spese senza volerlo). Ognuna vale la puntata minima. Con più di una, solo il simbolo
      var R = vm.regole || {}, qm = vm.puntataMin || 10, chip = [];
      [["coppia", "👯", "Coppia", vm.coppia], ["t213", "🃏", "21+3", R.t213], ["royal", "👑", "Seme", R.royal], ["buster", "💥", "Sballa", R.buster]].forEach(function (x) {
        if (x[3] && maxP > qm) chip.push(x);
      });
      if (chip.length) {
        var riga = el("div", { class: "bj-valriga" + (chip.length > 1 ? " tante" : "") }, [ val ]);
        chip.forEach(function (x) {
          var b = el("button", { class: "bj-coppia" + (extraSi[x[0]] ? " on" : ""), "data-ex": x[0], text: x[1] + (chip.length > 2 ? "" : " " + x[2]) + " +" + fmt(qm) });
          b.onclick = function () { extraSi[x[0]] = !extraSi[x[0]]; b.classList.toggle("on", extraSi[x[0]]); try { localStorage.setItem("sg-bj-" + x[0], extraSi[x[0]] ? "1" : "0"); } catch (e) {} };
          riga.appendChild(b);
        });
        zHero.appendChild(riga);
      } else zHero.appendChild(val);
      function conCoppia(v) { return !!(vm.coppia && extraSi.coppia && maxP - v >= qm); }
      function extraScelti(v) {   // le scommesse extra accese (finché bastano le monete, dopo la puntata e la Coppia)
        var resto = maxP - v - (conCoppia(v) ? qm : 0), l = [];
        ["t213", "royal", "buster"].forEach(function (k) { if (R[k] && extraSi[k] && resto >= qm) { l.push(k); resto -= qm; } });
        return l;
      }
      var bPunta;
      function agg() {
        puntSel = Math.max(minP, Math.min(puntSel, maxP));
        val.textContent = fmt(puntSel) + " 🪙";
        if (bPunta) bPunta.textContent = "Punta " + fmt(puntSel) + " ▶";
      }
      // la lineetta della puntata (1 nov 2026, il proprietario: «fare +100 quando vuoi puntare 10.000 è troppo lungo»): da sinistra
      // la puntata minima a destra tutte le tue monete. Non è dritta: la prima metà è per le puntate piccole (precise, di 10 in 10),
      // la seconda arriva in fretta a quelle grandi (di 50, 100, 500 in 500). Mentre si trascina non vibra niente.
      var LUNGA = 1000;
      function tondo(v) { var p = v < 1000 ? 10 : (v < 5000 ? 50 : (v < 20000 ? 100 : 500)); return Math.round(v / p) * p; }
      function valDa(pos) {
        if (pos <= 0) return minP; if (pos >= LUNGA) return maxP;
        var x = pos / LUNGA; return Math.max(minP, Math.min(maxP, tondo(minP + (maxP - minP) * x * x)));
      }
      function posDa(v) { return maxP > minP ? Math.round(Math.sqrt(Math.max(0, v - minP) / (maxP - minP)) * LUNGA) : LUNGA; }
      var rg = el("input", { class: "bj-rg" });
      rg.type = "range"; rg.min = 0; rg.max = LUNGA; rg.step = 1; rg.value = posDa(puntSel); rg.setAttribute("aria-label", "Quanto punti");
      if (maxP <= minP) rg.disabled = true;
      function riempi() { rg.style.setProperty("--p", (rg.value / LUNGA * 100).toFixed(1) + "%"); }
      rg.oninput = function () { puntSel = valDa(+rg.value); riempi(); agg(); };
      riempi();
      zHero.appendChild(el("div", { class: "bj-linea" }, [ el("span", { text: fmt(minP) }), rg, el("span", { text: fmt(maxP) }) ]));
      var az = el("div", { class: "bj-azioni" });
      // con le Speed Coins vere, più di metà di quello che hai chiede un secondo sì (il proprietario, 1 nov 2026: «spenderne 1.000 su 90.000 è insignificante»)
      function seServe(v, fai) {
        if (drv.moneteVere && drv.moneteVere(idx) && v > g.fiches / 2 && t.conferma) t.conferma("Punti " + fmt(v) + " 🪙?", "È più della metà delle tue Speed Coins (" + fmt(g.fiches) + ").", "Sì, punto", fai);
        else fai();
      }
      bPunta = el("button", { class: "bj-btn bj-b-carta", text: "Punta " + fmt(puntSel) + " ▶", onclick: function () { var v = puntSel; seServe(v, function () { puntSel = null; if (vm.segreta) puntataSegreta = v; ultimePuntate[chiavePuntata(g)] = v; suonoChip(); bloccaTasti(); drv.onPunta(v, idx, conCoppia(v), extraScelti(v)); }); } });
      az.appendChild(bPunta);
      az.appendChild(el("button", { class: "bj-btn bj-b-stai", text: "Tutto (" + fmt(maxP) + ")", onclick: function () { seServe(maxP, function () { puntSel = null; if (vm.segreta) puntataSegreta = maxP; ultimePuntate[chiavePuntata(g)] = maxP; suonoChip(); bloccaTasti(); drv.onPunta(maxP, idx); }); } }));
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
      var sx = el("div", { class: "bj-col" }, [ tasto("Assicuro", "bj-m bj-m-assic", function () { bloccaTasti(); drv.onAssicura(true, idx); }) ]);
      var dx = el("div", { class: "bj-col" }, [ tasto("No", "bj-m bj-m-no" + (vm.consigli ? " bj-cons" : ""), function () { bloccaTasti(); drv.onAssicura(false, idx); }) ]);   // il consiglio: l'assicurazione non conviene
      zHero.appendChild(el("div", { class: "bj-hriga" }, [sx, centro, dx]));
    }
    // extra: un nodo che va accanto al punteggio della mano che si gioca (il tasto «Resa»)
    function heroCarte(g, dove, extra) {
      var gi = vm.giocatori.indexOf(g);
      var box = el("div", { class: "bj-mani" });
      // tutte le mani in fila: stessa misura per tutte le carte; se non ci stanno si sovrappongono un po'
      var larga = (Math.min(560, window.innerWidth || 375) - 12) * (dove ? 0.46 : 0.62), nm = g.mani.length, tot = 0;
      g.mani.forEach(function (m) { tot += m.carte.length; });
      var w = Math.max(30, Math.min(62, Math.floor((larga - nm * 18 - tot * 6) / Math.max(1, tot))));   // piccole: le carte si vedono già in grande nello zoom
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
        var ptEl = el("div", { class: "bj-pt " + (pm > 21 ? "bust" : (m.esito === "vince" || m.esito === "blackjack" ? "win" : "")), style: "display:block;margin:6px auto 0;width:fit-content", text: BJ.testo(m.carte, m.divisa) + " · " + fmt(m.puntata) + "🪙" });
        if (extra && i === g.attiva) { ptEl.style.margin = "0"; mano.appendChild(el("div", { class: "bj-ptriga" }, [ptEl, extra])); }
        else mano.appendChild(ptEl);
        box.appendChild(mano);
      });
      (dove || zHero).appendChild(box);
    }
    function heroGioca(mio) {
      var g = vm.giocatori[vm.turno];
      if (!g) return heroInfo("🎴", "Gioca il banco…");
      var centro = el("div", { class: "bj-hcentro" });
      var ma = g.mani[g.attiva], v = mosseValideVm(vm), resaB = null;
      if (mio && ma && !ma.chiusa && v.resa) resaB = el("button", { class: "bj-btn bj-m bj-m-resa bj-resa", text: "Resa" });   // (si accende qui sotto, col consiglio)
      heroCarte(g, centro, resaB);
      var attesa = ma && !ma.chiusa && ma.carte.length < 2;   // dopo "Dividi": aspetta la seconda carta
      if (ma && ma.assi && (ma.chiusa || !mio)) centro.appendChild(notaAssi());   // assi divisi: niente tasti, si spiega perché (resta per tutte e due le mani)
      else if (attesa) centro.appendChild(el("div", { class: "bj-hnome", style: "margin-top:2px;color:#ffe58a", text: nomeBanco(vm) + " ti dà la carta…" }));
      else if (ma && ma.charlie) centro.appendChild(el("div", { class: "bj-hnome", style: "margin-top:2px;color:#9fe6b4", text: "🖐️ 5 carte senza sballare: vinci!" }));
      else if (ma && ma.resa) centro.appendChild(el("div", { class: "bj-hnome", style: "margin-top:2px;color:var(--o-tenue)", text: "🏳️ Ti ritiri: riprendi " + fmt(Math.floor(ma.puntata / 2)) + " 🪙" }));
      else if (ma && ma.chiusa) {   // mano finita: resta a schermo un attimo prima di passare
        var pm = BJ.punteggio(ma.carte);
        centro.appendChild(el("div", { class: "bj-hnome", style: "margin-top:2px;color:" + (pm > 21 ? "#ff9d8a" : "#9fe6b4"),
          text: pm > 21 ? ("Sballato! " + pm) : (BJ.eBJ(ma) ? "Black Jack! 🎉" : "Fermo a " + pm) }));
      }
      if (!mio || (ma && ma.chiusa) || attesa) { zHero.appendChild(centro); return; }
      // tasti ai lati delle carte: a sinistra Dividi e Raddoppia, a destra Stai e Carta
      var chk = { h: g.attiva, n: ma.carte.length };
      var cons = vm.consigli ? BJ.consiglio(ma, vm.banco[0], v.raddoppia, v.dividi, v.resa, vm.regole && vm.regole.h17) : null;   // la mossa giusta brilla
      function b(txt, cls, on, mv) {
        var x = tasto(txt, cls + (cons === mv ? " bj-cons" : ""), function () { bloccaTasti(); drv.onMossa(mv, chk); });
        if (!on) x.disabled = true; return x;
      }
      var sx = el("div", { class: "bj-col" }, [ b("Dividi", "bj-m bj-m-dividi", v.dividi, "dividi"), b("Raddoppia", "bj-m bj-m-radd", v.raddoppia, "raddoppia") ]);
      var dx = el("div", { class: "bj-col" }, [ b("Stai", "bj-m bj-m-stai", true, "stai"), b("Carta", "bj-m bj-m-carta", v.carta !== false, "carta") ]);
      if (resaB) { if (cons === "resa") resaB.classList.add("bj-cons"); resaB.onclick = function () { bloccaTasti(); drv.onMossa("resa", chk); }; }
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
      // (gara con la quota) se sono a zero, al posto delle monete di tutti il tasto per rientrare: c'è tempo fino alla prossima puntata
      var rt = tastoRientro();
      zHero.appendChild(rt ? el("div", { class: "bj-azioni" }, [ rt ]) : riga);
      if (vm.rimescolato) zHero.appendChild(el("div", { class: "bj-hmini", text: "🔀 Mazzo rimescolato" }));
      // online con gli amici al tavolo la mano nuova parte da sola dopo 12 secondi (l'host la può far partire prima):
      // nessuno resta ad aspettare un host distratto
      var conto = drv.contoMano && drv.contoMano(vm) && t.contoAvanti, kConto = "bj|" + (drv.stanza || "") + "|" + vm.giro + "|" + vm.mano;
      if (drv.puoNuova && drv.puoNuova()) {
        var az = el("div", { class: "bj-azioni" }), vai;
        var finita = (vm.maniTot && vm.mano >= vm.maniTot) || (vm.uguali && !(vm.gara && vm.gara.quota) && vm.giocatori.every(function (g) { return g.via || g.fiches <= 0; }));   // (torneo: tutti senza fiches; nella gara con la quota si può rientrare)
        if (finita) az.appendChild(vai = tasto("🏁 Classifica ▶", "bj-b-carta", function () { bloccaTasti(); drv.onFine(); }));
        else {
          az.appendChild(vai = tasto("Nuova mano ▶", "bj-b-carta", function () { bloccaTasti(); drv.onNuova(); }));
          if (!drv.mioIdx && !vm.uguali && vm.giocatori.some(function (g) { return g.fiches <= 0; })) az.appendChild(tasto("♻️ 500 a chi è a zero", "bj-b-dividi", function () { drv.onRicarica(-1); }));
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
      else if (!delCore) zHero.appendChild(el("div", { class: "bj-hfiches", text: (t.guarda ? "👀 " : "") + "Aspettiamo l'host: si gioca ancora?" }));
      if (t.guarda && !host) return;   // chi guarda col link: esce e manda le faccine dalla targhetta del core
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
    var uguali = !!imp.uguali;   // il Torneo della serata: tutti con le stesse fiches finte (e un numero di mani: senza fine non c'è)
    return {
      min: [10, 50, 100].indexOf(+imp.min) >= 0 ? +imp.min : BJ.PUNTATA_MIN,
      uguali: uguali,
      mani: Math.max(0, Math.floor(+imp.mani) || 0) || (uguali ? 10 : 0),   // 0 = senza fine
      quota: uguali ? Math.max(0, Math.floor(+imp.quota) || 0) : 0,   // la gara con le Speed Coins (solo online): la quota d'ingresso, 0 = fiches finte
      tempo: imp.tempo == null ? 25 : Math.max(0, Math.floor(+imp.tempo) || 0),   // secondi per decidere (online)
      consigli: imp.consigli == null ? true : !!imp.consigli,
      coppia: imp.coppia == null ? true : !!imp.coppia,
      battute: imp.battute == null ? true : !!imp.battute,   // 😏 le battute del banco (di partenza accese, 3 nov 2026)   // la scommessa extra «👯 Coppia» (di partenza accesa, 1 nov 2026: per provarla)
      // 🎰 le regole da esperti (1 nov 2026, il proprietario: «mettiamo tutte le regole, al massimo le lasciamo disattivate»): di partenza come prima
      h17: !!imp.h17, mazzi: [1, 2, 6, 8].indexOf(+imp.mazzi) >= 0 ? +imp.mazzi : 6, r911: !!imp.r911, das: imp.das !== false, rsa: !!imp.rsa,
      resa: imp.resa !== false, charlie: !!imp.charlie, t213: !!imp.t213, buster: !!imp.buster, royal: !!imp.royal
    };
  }
  function testoRegole(r, online) {
    return (r.uguali ? (online && r.quota ? "🏆 Gara: quota " + fmt(r.quota) + " 🪙, montepremi ai primi · " : "🏆 Torneo: tutti con " + fmt(BJ.FICHES_TORNEO) + " fiches finte · ") : "") +
      "Puntata minima " + fmt(r.min) + " 🪙 · " + (r.mani ? r.mani + " mani" : "mani senza fine") +
      (online ? " · " + (r.tempo ? r.tempo + " s per decidere" : "tempo libero") : "") + (r.consigli ? " · 💡 consigli" : "") + (r.battute ? "" : " · niente battute") + (r.coppia ? " · 👯 coppia" : "") +
      (r.t213 ? " · 🃏 21+3" : "") + (r.royal ? " · 👑 stesso seme" : "") + (r.buster ? " · 💥 il banco sballa" : "") +
      (r.h17 ? " · banco tira sul 17 morbido" : "") + (r.mazzi !== 6 ? " · " + r.mazzi + (r.mazzi === 1 ? " mazzo" : " mazzi") : "") + (r.r911 ? " · raddoppio su 9-11" : "") +
      (!r.das ? " · niente raddoppio dopo Dividi" : "") + (r.rsa ? " · assi divisi di nuovo" : "") + (!r.resa ? " · niente resa" : "") + (r.charlie ? " · 5 carte vincono" : "");
  }
  // ---- LA GARA CON LA QUOTA: ogni telefono paga la sua quota e prende il suo premio da solo, una volta sola ----
  // (sg-bj-gare: { idGara: { q: quote già pagate, p: 1 = premio già preso } }, le ultime 30: così una pagina ricaricata non paga
  //  né incassa due volte). Torna di quanto è cambiato il saldo.
  function memGare() { try { return JSON.parse(localStorage.getItem("sg-bj-gare") || "{}") || {}; } catch (e) { return {}; } }
  var gareQui = {};   // (la stessa memoria anche nella pagina: se il telefono non riesce a scrivere, non si paga due volte lo stesso)
  function contiGara(vm, idx, prof) {
    contiGara.q = 0;
    var G = vm && vm.gara; if (!G || !G.quota || idx < 0 || !prof || !window.SGNube || !SGNube.salvaFiches) return 0;
    var mem = memGare(), r = mem[G.id] || { q: 0, p: 0, t: Date.now() }, qui = gareQui[G.id], delta = 0, dovute = (G.pagati || {})[idx] || 0;
    if (qui) { r.q = Math.max(r.q, qui.q); r.p = Math.max(r.p, qui.p); }
    gareQui[G.id] = r;
    if (dovute > r.q) { delta -= (dovute - r.q) * G.quota; r.q = dovute; }
    if (vm.fase === "fine" && G.premi && !r.p) { r.p = 1; delta += G.premi[idx] || 0; }
    contiGara.q = r.q;
    if (!delta && mem[G.id]) return 0;
    mem[G.id] = r;
    var ids = Object.keys(mem).sort(function (a, b) { return (mem[b].t || 0) - (mem[a].t || 0); }); ids.slice(30).forEach(function (k) { delete mem[k]; });
    try { localStorage.setItem("sg-bj-gare", JSON.stringify(mem)); } catch (e) {}
    if (delta) SGNube.salvaFiches("blackjack", Math.max(0, (SGNube.fiches("blackjack") || 0) + delta));
    return delta;
  }
  // posso rientrare nella gara? (a zero, prima dell'ultima mano, con le monete per la quota)
  function puoRientrareVm(vm, idx, prof) {
    var G = vm && vm.gara, g = vm && vm.giocatori[idx];
    return !!(G && G.quota && prof && window.SGNube && g && !g.via && g.fiches != null && g.fiches <= 0 &&
      (vm.fase === "esito" || (vm.fase === "punta" && !(g.puntata > 0))) && vm.mano < vm.maniTot - 1 && (SGNube.fiches("blackjack") || 0) >= G.quota);
  }
  function idGara() { return "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  // le fiches di partenza della gara: con la quota, tante quanto la quota (se no 1.000 finte)
  function chipsGara(RG) { return RG.quota || BJ.FICHES_TORNEO; }
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
    if (RG.uguali) fichesIniz = nomi.map(function () { return BJ.FICHES_TORNEO; });   // torneo: tutti uguali, fiches finte
    else if (prof) {
      var f = SGNube.fiches("blackjack");
      if (f != null && f > 0) { fichesIniz = [f]; }
      else { prova = true; fichesIniz = [BJ.FICHES_INIZIALI]; }   // a zero: gioca di prova, non si salva
    }
    var M = BJ.creaMotore(nomi, t.mischia, fichesIniz, RG), st = M.st, tav;
    st.giocatori[0].prova = prova;
    st.croupier = croupierDa(nomi);   // il banco: uno dei bot fissi
    var avatari = nomi.map(function (n, i) { return i === 0 ? mioAvatar(n) : null; });   // gli altri: faccia fissa legata al nome
    var maniFinite = 0, detto = false, salvato = st.giocatori[0].fiches;
    // torneo a fiches uguali in due o più sullo stesso telefono: a fine partita i punti vanno nella Classifica della serata
    function serata() { return RG.uguali && nomi.length >= 2; }
    // il saldo del profilo segue il tavolo: la puntata si toglie subito (uscendo a metà mano non torna indietro). Nel torneo no: fiches finte
    function salva() { var g = st.giocatori[0]; if (prof && !RG.uguali && !g.prova && g.fiches !== salvato) { salvato = g.fiches; SGNube.salvaFiches("blackjack", salvato); } }
    function classifica() { return M.classifica().map(function (r) { return { nome: r.nome, pos: r.pos }; }); }
    // com'è andata (dà gli XP; vince chi ha guadagnato di più)
    function risultatoLoc() {
      if (!maniFinite || detto || !t.risultato) return;
      detto = true; t.risultato(classifica());
    }
    function refresh() { tav.aggiorna(vistaBJ(st, RG)); salva(); }
    tav = tavoloBJ(t, {
      avatari: function () { return avatari; },
      sotto: RG.uguali ? "🏆 Torneo a fiches uguali (finte)" : prof ? (prova ? ("👤 " + prof.nome + " · prova · gira la ruota del giorno!") : ("👤 " + prof.nome + " · gioca con le tue monete")) : "Un telefono · Banco: " + nomeBanco(st),
      avvisoUscita: function (vm) { return vm.fase !== "esito" && vm.fase !== "fine" && vm.giocatori.some(function (g) { return g.puntata > 0; }) ? "Le puntate di questa mano sono perse." : ""; },
      puoAgire: function () { return true; },
      moneteVere: function (i) { return i === 0 && !!prof && !RG.uguali && !st.giocatori[0].prova; },   // (gli amici sullo stesso telefono hanno fiches finte)
      puoNuova: function () { return true; },
      guida: function () { return true; },
      puoRuota: function () { return !RG.uguali && puoRuotaProfilo(prof); },
      onRuota: function () {
        ruotaDalTavolo(function (nuovo, piu) {
          var g = st.giocatori[0];
          if (g.prova) { g.prova = false; M.aggiungiFiches(0, nuovo - g.fiches); } else M.aggiungiFiches(0, piu);   // da prova a monete vere
          salvato = g.fiches; refresh();
        });
      },
      onRicarica: function () { if (RG.uguali) return; st.giocatori.forEach(function (g, i) { if (g.fiches <= 0) M.ricarica(i); }); refresh(); },
      onPasso: function (k) { if (k === "distrib") M.passoDistribuzione(); else if (k === "banco") M.passoBanco(); else if (k === "divisa") M.passoDivisa(); else if (k === "avanza") M.avanza(); else if (k === "svela") M.passoSvela(); refresh(); },
      onPunta: function (v, i, cp, ex) { M.punta(st.turno, v, cp, ex); refresh(); },
      onMossa: function (m) { if (m === "stai") suonoStai(); M.azione(m); refresh(); },
      onAssicura: function (si) { M.assicura(st.turno, si); refresh(); },
      onFineMano: function (v) { var g = v.giocatori[0]; if (prof && !g.prova) { salvaFineMano(g, v); if (!RG.uguali) salvato = g.fiches; } maniFinite++; },
      onNuova: function () { M.nuovaMano(); refresh(); },
      onFine: function () { M.fineTavolo(); refresh(); },
      // (il torneo della Serata a punti e quello a fiches uguali in più persone danno i punti con t.fine, dal tasto qui sotto)
      onFinePartita: function () { if (!torneo && !serata()) risultatoLoc(); },
      testoAncora: torneo ? "🏆 Avanti nel torneo ▶" : (serata() ? "🏆 Punti della serata ▶" : (RG.uguali ? "🔄 Un altro torneo ▶" : null)),
      onAncora: function () {
        if ((torneo || serata()) && t.fine) { tav.chiudi(); salva(); detto = true; t.fine(classifica()); return; }   // torneo: i punti di questa partita
        detto = false; maniFinite = 0; M.nuovaSerie(RG.uguali ? BJ.FICHES_TORNEO : 0); refresh();
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
    t.lobby({ host: info.sonoHost, codice: info.codice, pronta: info.pronta, min: 1, puoiDaSolo: true, spettatore: info.spettatore || false,
      giocatori: info.giocatori.map(function (g, i) { return { id: g.id, nome: g.nome, omino: g.omino || null, host: i === 0, tu: info.sonoHost ? i === 0 : g.id === info.mioId }; }),
      attesa: "Aspetta che l'host apra il tavolo: poi si punta tutti insieme.",
      extra: [cb.bonus, cb.nota],   // saldo + ruota del giorno per chi ha il profilo (anche chi entra da invito) e le regole del tavolo
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function hostBJ(t) {
    nuovaSessioneBJ();
    if (!(window.SGNet && SGNet.disponibile())) return localeBJ(t);
    var IO = t.mioId || "host";   // chi tiene il tavolo su questo telefono ("host", o l'amico che ha preso il posto dell'host)
    // la ripresa (l'host ha ricaricato la pagina a metà partita): quello che si è ricordato in bcast()
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.bj;
    var imp = t.impostazioni || {}, RG = regoleDa(imp);
    var nota = t.el("p", { class: "modulo-nota", style: "text-align:center" });
    // "⚙️ Regole" nella saletta: l'host cambia le regole prima di cominciare
    t.onRegole = function (im) { imp = im || {}; if (!M) { RG = regoleDa(imp); lobbyOut(); } };
    // la Rivincita a fine serie: una serie nuova allo stesso tavolo, ognuno con le monete che ha
    t.onRivincita = function () { if (!M || finito || M.st.fase !== "fine") return; serieNuova(); };
    // una serie nuova allo stesso tavolo (torneo a fiches uguali: tutti di nuovo con le stesse fiches, e si siede chi guardava aspettando)
    function serieNuova() {
      detto = false; maniFinite = 0;
      if (RG.uguali && RG.quota) return garaNuova();
      if (RG.uguali) attesaUguali.splice(0).forEach(function (ns) {
        if (seatDiId(ns.id) >= 0 || seats.length >= 10) return;
        var k = guardano.indexOf(ns.id); if (k < 0) return;   // (intanto è andato via)
        guardano.splice(k, 1); seats.push(ns); M.aggiungi(ns.nome, chipsGara(RG), ns.id, false);
        rete.inviaVeloce({ t: "avatari", lista: listaAvatari() });
      });
      M.nuovaSerie(RG.uguali ? chipsGara(RG) : 0); bcast();
    }
    // ---- LA GARA CON LA QUOTA (1 nov 2026): chi non ha le monete per la quota guarda questa gara (e si siede alla prossima, se le ha) ----
    var senzaQuota = [];
    function moneteDi(x) { return x.id === IO ? (prof && !provaHost ? (SGNube.fiches("blackjack") || 0) : 0) : (x.prova ? 0 : (x.fiches || 0)); }
    function chiPaga() {
      senzaQuota = [];
      if (!RG.uguali || !RG.quota) return true;
      var tieni = [], fuori = [];
      seats.forEach(function (x) { if (moneteDi(x) >= RG.quota) tieni.push(x); else fuori.push(x); });
      if (!tieni.length) return false;
      fuori.forEach(function (x) {
        senzaQuota.push(x.id);
        if (x.id === IO) return;   // (l'host senza quota tiene il tavolo e guarda)
        if (guardano.indexOf(x.id) < 0) guardano.push(x.id);
        if (!attesaUguali.some(function (y) { return y.id === x.id; })) attesaUguali.push(x);
      });
      seats = tieni;
      return true;
    }
    function motoreGara() {   // il tavolo nuovo della gara: tutti con le stesse fiches, ognuno ha pagato una quota
      var cr = M && M.st.croupier;
      M = BJ.creaMotore(seats.map(function (x) { return x.nome; }), t.mischia, seats.map(function () { return chipsGara(RG); }), RG);
      M.st.giocatori.forEach(function (g, i) { g.rid = seats[i].id; g.prova = false; });
      M.st.croupier = cr || croupierDa(seats.map(function (x) { return x.nome; }));
      M.gara(idGara(), RG.quota, chipsGara(RG), seats.map(function (x, i) { return i; }));
    }
    // la Rivincita della gara con la quota: si siede chi aspettava, esce chi se n'è andato, si ripaga la quota
    function garaNuova() {
      var vecchi = M.st.giocatori;
      seats = seats.filter(function (x, i) { return !(vecchi[i] && vecchi[i].via); });
      attesaUguali.splice(0).forEach(function (ns) {
        if (seatDiId(ns.id) >= 0 || seats.length >= 10) return;
        var k = guardano.indexOf(ns.id); if (k < 0) return;
        guardano.splice(k, 1); seats.push(ns);
      });
      if (seatDiId(IO) < 0 && seatHost && seats.length < 10) seats.unshift(seatHost);   // (l'host che guardava senza quota prova a rientrare)
      if (!chiPaga()) {   // nessuno ha più la quota: la serie si gioca a fiches finte
        var cr = M.st.croupier;
        M = BJ.creaMotore(seats.map(function (x) { return x.nome; }), t.mischia, seats.map(function () { return BJ.FICHES_TORNEO; }), RG);
        M.st.giocatori.forEach(function (g, i) { g.rid = seats[i].id; }); M.st.croupier = cr;
        M.nuovaMano(); bcast(); return;
      }
      motoreGara(); M.nuovaMano();
      rete.inviaVeloce({ t: "avatari", lista: listaAvatari() });
      bcast();
    }
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var provaHost = false, mieFiches = prof ? SGNube.fiches("blackjack") : null;
    if (prof && (mieFiches == null || mieFiches <= 0)) { provaHost = true; mieFiches = BJ.FICHES_INIZIALI; }
    var seats = [{ id: IO, nome: (prof ? prof.nome : (t.giocatori && t.giocatori[0])) || "Host", fiches: mieFiches, prova: provaHost }];
    seats[0].omino = mioAvatar(seats[0].nome);
    var seatHost = seats[0];   // (il mio posto: nella gara con la quota posso restarne fuori una volta e tornare alla prossima)
    var M = null, rete = null, codice = "…", tav = null, pronta = false, finito = false;
    var guardano = [];   // chi è entrato ma non è tra chi gioca (scelti nella Sala): guarda il tavolo senza sedersi
    var attesaUguali = [];   // torneo a fiches uguali: chi è arrivato a partita iniziata guarda e si siede alla serie dopo
    var pieni = [];   // chi è arrivato a tavolo pieno (10 su 10): guarda (è anche in guardano); in saletta si siede appena si libera un posto
    var pieniDati = {};   // (in saletta) id -> il suo posto pronto (nome, fiches, avatar)
    var maniFinite = 0, detto = false, salvato = mieFiches;
    var TT = { k: "", fine: 0, to: null };   // il conto alla rovescia per decidere (lo tiene l'host)
    // la ruota girata in saletta (o dal tavolo): si gioca con le monete nuove (e se eri a zero non è più di prova)
    var boxBonus = prof ? riquadroBonus(t.el, function (nuovo, piu) {
      if (M) { bonusHost(nuovo, piu); return; }
      if (nuovo > 0) { provaHost = false; seats[mio()].fiches = nuovo; seats[mio()].prova = false; salvato = nuovo; }
    }, true) : null;
    function bonusHost(nuovo, piu) {
      var io = mio(), g = M.st.giocatori[io];
      if (RG.uguali || !g) return;   // (torneo: le fiches sono finte, la ruota resta nel profilo)
      if (g.prova) { g.prova = false; M.aggiungiFiches(io, nuovo - g.fiches); } else M.aggiungiFiches(io, piu);
      salvato = g.fiches; bcast();
    }

    function seatDiId(id) { for (var i = 0; i < seats.length; i++) if (seats[i].id === id) return i; return -1; }
    // tavolo pieno (10 su 10): invece di mandarlo via lo si fa guardare (riceve le foto)
    function guardaPieno(id, m) {
      if (guardano.indexOf(id) < 0) guardano.push(id);
      if (pieni.indexOf(id) < 0) pieni.push(id);
      pieniDati[id] = nuovoSeat(id, m);
    }
    // in saletta si è liberato un posto: si siede il primo arrivato a tavolo pieno
    function siediPieni() {
      while (!M && seats.length < 10 && pieni.length) {
        var id = pieni.shift(), ns = pieniDati[id]; delete pieniDati[id];
        var k = guardano.indexOf(id); if (k >= 0) guardano.splice(k, 1);
        if (ns && seatDiId(id) < 0) seats.push(ns);
      }
    }
    function mio() { var i = seatDiId(IO); return i < 0 ? (M ? -1 : 0) : i; }   // il mio posto (di solito il primo; -1 = guardo soltanto: ho preso il tavolo da chi guardava)
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
      // (gara con la quota) tutti a zero e nessuno rientra: dopo 25 secondi la classifica, la gara non resta mai ferma
      if (st.fase === "punta" && st.gara && st.gara.quota && st.giocatori.every(function (g) { return g.via || g.fiches <= 0; })) return { k: "z" + st.giro, ms: 25000, fn: M.fineTavolo };
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
    // (host di riserva) chi porta avanti il tavolo se sparisco: chi è seduto (ha già il suo posto e le sue fiches)
    var viciK = "";
    function vici() {
      var l = seats.filter(function (x) { return x.id !== IO && guardano.indexOf(x.id) < 0; }).map(function (x) { return x.id; }), k = l.join(",");
      if (k !== viciK && t.vici) { viciK = k; t.vici(l.length ? l : null); }
    }
    function bcast() {
      if (!M) { lobbyOut(); return; }
      if (finito) return;
      gestisciTempo();
      var Gq = M.st.gara;   // (gara con la quota: la mia quota e il mio premio, una volta sola; la mia quota pagata entra nel montepremi)
      if (Gq && Gq.quota && mio() >= 0) { contiGara({ gara: Gq, fase: M.st.fase }, mio(), prof); M.confermaGara(mio(), contiGara.q); }
      var vm = vistaBJ(M.st, RG);
      vm.tempo = TT.k ? { k: TT.k, ms: Math.max(0, TT.fine - Date.now()) } : null;
      if (guardano.length) vm.guardano = guardano.slice();
      if (pieni.length) vm.pieni = pieni.slice();
      if (senzaQuota.length) vm.senzaQuota = senzaQuota.slice();
      if (rete) rete.invia({ t: "vm", vm: vm });
      aCheSiamo();
      if (tav) tav.aggiorna(vm);
      vici();
      salva();
      ricorda();
    }
    // (nella Sala) a che punto è la partita, per chi è fuori: "mano 3 di 10" (la mano in corso; st.mano conta quelle finite)
    function aCheSiamo() {
      if (!t.aCheSiamo || !M || M.st.fase === "fine") return;
      var st = M.st, n = st.mano + (st.fase === "esito" ? 0 : 1);
      t.aCheSiamo("mano " + n + (st.maniTot ? " di " + st.maniTot : ""));
    }
    // a ogni mano nuova gli avatar a tutti: chi guarda col link (il gioco non lo vede: niente join) li ha dalla mano dopo
    function avatariATutti() { if (rete) rete.inviaVeloce({ t: "avatari", lista: listaAvatari() }); }
    // il saldo dell'host segue il tavolo (la puntata si toglie subito)
    function salva() { var g = M && M.st.giocatori[mio()]; if (prof && g && !RG.uguali && !g.prova && g.fiches !== salvato) { salvato = g.fiches; SGNube.salvaFiches("blackjack", salvato); } }
    // dopo ogni cambiamento il tavolo si ricorda (se l'host ricarica, la mano continua); in saletta niente da riprendere
    var ricordato = !!RIP;
    function ricorda() {
      if (!t.ricorda) return;
      if (!M || finito) { if (ricordato) { ricordato = false; t.ricorda(null); } return; }
      ricordato = true;
      t.ricorda({ bj: { st: M.esporta(), seats: seats, guardano: guardano, pieni: pieni, attesaUguali: attesaUguali, senzaQuota: senzaQuota, maniFinite: maniFinite,
        detto: detto, RG: RG, imp: imp } });
    }
    function lobbyOut() {
      ricorda();
      var rt = testoRegole(RG, true);
      nota.textContent = "🃏 " + rt;
      if (rete) rete.invia({ t: "lobby", codice: codice, regole: rt, giocatori: seats.map(function (x) { return { id: x.id, nome: x.nome, omino: x.omino || null }; }),
        pieni: pieni.length ? pieni.slice() : undefined });   // (chi è arrivato a tavolo pieno: guarda)
      renderLobbyBJ(t, { sonoHost: true, codice: codice, pronta: pronta, giocatori: seats }, {
        bonus: boxBonus, nota: nota,
        onComincia: comincia,
        onEsci: function () { finito = true; if (t.ricorda) t.ricorda(null); if (rete) rete.chiudi(); t.esci(); }
      });
    }
    function comincia() {
      if (M) return;
      RG = regoleDa(imp);
      if (RG.uguali && RG.quota) {   // la gara con la quota: paga chi ha le monete, gli altri guardano
        if (!chiPaga()) { if (t.conferma) t.conferma("Nessuno ha " + fmt(RG.quota) + " 🪙 per la quota", "Scegli una quota più bassa nelle regole (⚙️).", "Ok", function () {}); return; }
        motoreGara();
        maniFinite = 0; detto = false;
        avviaTavoloHost(); M.nuovaMano(); bcast(); avatariATutti();
        return;
      }
      // torneo a fiches uguali: tutti con le stesse fiches finte (le monete del profilo restano dove sono)
      M = BJ.creaMotore(seats.map(function (x) { return x.nome; }), t.mischia, seats.map(function (x) { return RG.uguali ? BJ.FICHES_TORNEO : x.fiches; }), RG);
      M.st.giocatori.forEach(function (g, i) { g.rid = seats[i].id; g.prova = !RG.uguali && !!seats[i].prova; });
      M.st.croupier = croupierDa(seats.map(function (x) { return x.nome; }));   // il banco: uno dei bot fissi (va a tutti nel vm)
      maniFinite = 0; detto = false;
      avviaTavoloHost(); M.nuovaMano(); bcast(); avatariATutti();
    }
    function avviaTavoloHost(senzaIntro) {
      tav = tavoloBJ(t, {
        sotto: "Online · sei l'host", stanza: codice, contoMano: conAmici, senzaIntro: !!senzaIntro,   // (ripresa: niente presentazione di nuovo)
        domandaUscita: "Chiudi il tavolo per tutti?",
        avvisoUscita: function (vm) { var g = vm.giocatori[mio()]; return (g && g.puntata > 0 && vm.fase !== "esito" && vm.fase !== "fine" ? "Perdi la puntata di questa mano. " : "") + (vm.gara && vm.gara.quota && vm.fase !== "fine" ? "La gara si ferma: le quote tornano a tutti. " : "") + "Gli amici vedranno com'è finita."; },
        avatari: listaAvatari,
        mioIdx: function () { return mio(); },
        guardo: function () { return mio() < 0 ? "👀 Tieni il tavolo e guardi: giocano gli altri" : ""; },   // (host di riserva preso da chi guardava)
        puoAgire: function (vm) { return vm.turno === mio(); },
        moneteVere: function (i) { var g = M && M.st.giocatori[i]; return i === mio() && !!prof && !RG.uguali && !!g && !g.prova; },
        puoRientrare: function (vm) { return puoRientrareVm(vm, mio(), prof); },
        onRientra: function () { M.rientraGara(mio()); bcast(); },
        puoNuova: function () { return true; },
        guida: function () { return true; },
        puoRuota: function () { return !RG.uguali && puoRuotaProfilo(prof); },
        onRuota: function () { ruotaDalTavolo(bonusHost); },
        onRicarica: function () { if (RG.uguali || mio() < 0) return; M.ricarica(mio()); bcast(); },
        onPasso: function (k) { if (k === "distrib") M.passoDistribuzione(); else if (k === "banco") M.passoBanco(); else if (k === "divisa") M.passoDivisa(); else if (k === "avanza") M.avanza(); else if (k === "svela") M.passoSvela(); bcast(); },
        onPunta: function (v, i, cp, ex) { if (mio() < 0) return; M.punta(mio(), v, cp, ex); bcast(); },
        onMossa: function (m, chk) { if (M.st.turno === mio()) { if (m === "stai") suonoStai(); M.azione(m, chk); bcast(); } },
        onAssicura: function (si) { if (mio() < 0) return; M.assicura(mio(), si); bcast(); },
        onFineMano: function (vm) { var g = vm.giocatori[mio()]; if (prof && g && !g.prova) { salvaFineMano(g, vm); if (!RG.uguali) salvato = g.fiches; } maniFinite++; },
        onNuova: function () { M.nuovaMano(); bcast(); avatariATutti(); },
        onFine: function () { M.fineTavolo(); bcast(); },
        onFinePartita: function () { risultatoBJ(); },
        testoAncora: RG.uguali ? "🔄 Un altro torneo ▶" : null,
        onAncora: function () { serieNuova(); },
        onEsci: function () {
          risultatoBJ(); salva(); fermaTempo(); finito = true;
          if (t.ricorda) t.ricorda(null);   // (uscito apposta: niente da riprendere)
          // a metà mano: gli amici si riprendono la loro puntata (il tavolo l'ha chiuso l'host, non loro)
          var rimborso = !!M && ["esito", "fine"].indexOf(M.st.fase) < 0, io = mio();
          // la gara con la quota chiusa prima della fine: le quote tornano a tutti (ognuno se le riprende dal suo telefono)
          var Gx = M && M.st.gara, rimb = null;
          if (Gx && Gx.quota && M.st.fase !== "fine") {
            rimb = { id: Gx.id, quota: Gx.quota, pagati: Gx.pagati, premi: {} };
            Object.keys(Gx.pagati).forEach(function (k) { rimb.premi[k] = Gx.pagati[k] * Gx.quota; });
            contiGara({ gara: rimb, fase: "fine" }, io, prof);
          }
          if (rimborso) M.st.giocatori.forEach(function (g, i) { if (i !== io) g.fiches += puntataInGioco(g) + (g.assicura || 0) + (g.coppiaEsito ? 0 : (g.coppia || 0)) + Object.keys(g.ex || {}).reduce(function (a, k) { return a + ((g.exEsito || {})[k] ? 0 : g.ex[k]); }, 0); });
          // gli amici vedono chi ha chiuso e com'è finita (non "collegamento perso")
          if (rete) { try { rete.inviaVeloce({ t: "chiuso", nome: (seats[io] || { nome: (t.giocatori && t.giocatori[0]) || "" }).nome, rimborso: rimborso, classifica: M ? M.classifica() : null, garaRimborso: rimb }); } catch (e) {} rete.chiudi(); }
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
    // ---- la ripresa: stessi posti, stesse fiches, stessa mano (carte, puntate, turno). Gli amici restano seduti e
    // rientrano da soli (stesso id: il join li rimette al loro posto); le fiches del profilo sono già quelle del tavolo
    var attesi = {};
    if (RIP && Array.isArray(RIP.seats) && RIP.seats.length && RIP.st) {
      if (RIP.RG) RG = RIP.RG;
      if (RIP.imp) imp = RIP.imp;
      M = BJ.creaMotore(RIP.seats.map(function (x) { return x.nome; }), t.mischia, null, RG);
      if (M.importa(RIP.st)) {
        seats = RIP.seats;
        guardano = Array.isArray(RIP.guardano) ? RIP.guardano : [];
        pieni = Array.isArray(RIP.pieni) ? RIP.pieni : [];
        attesaUguali = Array.isArray(RIP.attesaUguali) ? RIP.attesaUguali : [];
        senzaQuota = Array.isArray(RIP.senzaQuota) ? RIP.senzaQuota : [];
        maniFinite = +RIP.maniFinite || 0; detto = !!RIP.detto;
        // (il saldo del profilo l'ho già salvato dal tavolo prima di ricaricare: si risalva solo se è diverso)
        salvato = prof ? SGNube.fiches("blackjack") : null;
        if (seats[mio()] && !seats[mio()].omino) seats[mio()].omino = mioAvatar(seats[mio()].nome);
        seats.forEach(function (x) { if (x.id !== IO) attesi[x.id] = 1; });
      } else M = null;
    }
    rete = SGNet.ospita("blackjack", {
      onCodice: function (c) { codice = c; if (!M) lobbyOut(); },
      onConnesso: function () { pronta = true; if (!M) lobbyOut(); },
      onAddio: function (id) {
        delete attesi[id];
        if (guardano.indexOf(id) >= 0) guardano.splice(guardano.indexOf(id), 1);
        var ip = pieni.indexOf(id); if (ip >= 0) { pieni.splice(ip, 1); delete pieniDati[id]; if (!M) lobbyOut(); }
        var i = seatDiId(id); if (i < 0 || i === mio()) return;
        if (M) { M.esce(i); bcast(); }   // a partita iniziata il posto resta (gli altri non cambiano numero): non si aspetta più
        else { seats.splice(i, 1); siediPieni(); lobbyOut(); }
      },
      onMsg: function (id, m) {
        if (!m || !m.t || finito) return;
        delete attesi[id];   // (ripresa: si è rifatto vivo)
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
            if (seats.length >= 10) { guardaPieno(id, m); rete.inviaVeloce({ t: "avatari", to: id, lista: listaAvatari() }); bcast(); return; }   // tavolo pieno: guarda
            if (RG.uguali) {   // torneo a fiches uguali già cominciato: guarda, e si siede alla serie dopo
              if (guardano.indexOf(id) < 0) guardano.push(id);
              if (!attesaUguali.some(function (x) { return x.id === id; })) attesaUguali.push(nuovoSeat(id, m));
              rete.inviaVeloce({ t: "avatari", to: id, lista: listaAvatari() }); bcast(); return;
            }
            // arrivato a partita iniziata: si siede subito, gioca dalla prossima puntata
            var ns = nuovoSeat(id, m); seats.push(ns);
            M.aggiungi(ns.nome, ns.fiches, id, ns.prova);
            rete.inviaVeloce({ t: "avatari", lista: listaAvatari() });
            bcast(); return;
          }
          if (i < 0) {
            if (seats.length >= 10) { guardaPieno(id, m); lobbyOut(); return; }   // saletta piena: guarda, e si siede se si libera un posto
            seats.push(nuovoSeat(id, m));
          }
          lobbyOut();
        } else if (m.t === "fiches") {   // chi è al tavolo ha girato la ruota del giorno
          attesaUguali.forEach(function (y) { if (y.id === id && isFinite(+m.fiches)) y.fiches = Math.max(0, Math.floor(+m.fiches)); });   // (chi aspetta la gara dopo: ora ha la quota?)
          var sf = seatDiId(id); if (sf < 0 || sf === mio()) return;
          var nuovo = Math.floor(+m.fiches), piu = Math.floor(+m.piu) || 0;
          if (!M) { if (isFinite(nuovo) && nuovo >= 0) { seats[sf].fiches = nuovo; if (nuovo > 0) seats[sf].prova = false; } return; }   // in saletta: è il suo saldo
          if (RG.uguali || seats[sf].bonus || piu <= 0 || !isFinite(nuovo)) return;   // a partita iniziata: una volta sola a testa (nel torneo mai)
          seats[sf].bonus = true; piu = Math.min(piu, 10000);            // al massimo il premio grosso della ruota
          var gf = M.st.giocatori[sf];
          if (gf.prova) { gf.prova = false; M.aggiungiFiches(sf, nuovo - gf.fiches); } else M.aggiungiFiches(sf, piu);
          bcast();
        } else if (M && m.t === "pagato") {   // (gara con la quota) il telefono di un amico ha pagato: la sua quota entra nel montepremi
          var sp = seatDiId(id); if (sp >= 0 && M.st.gara && m.g === M.st.gara.id) { M.confermaGara(sp, m.q); bcast(); }
        } else if (M && m.t === "rientro") {   // (gara con la quota) un amico a zero rientra: la quota la paga dal suo telefono
          var sq = seatDiId(id); if (sq >= 0) { M.rientraGara(sq); bcast(); }
        } else if (m.t === "saldo") {   // (gara con la quota) il saldo nuovo di un amico dopo quota o premio: serve per la prossima gara
          var nf = Math.floor(+m.fiches); if (!isFinite(nf) || nf < 0) return;
          var sx = seatDiId(id); if (sx >= 0) seats[sx].fiches = nf;
          attesaUguali.forEach(function (y) { if (y.id === id) y.fiches = nf; });
        } else if (M && m.t === "ricarica") {
          var sr = seatDiId(id); if (sr < 0 || RG.uguali) return;
          M.ricarica(sr); bcast();
        } else if (M && m.t === "mossa") {
          var seat = seatDiId(id); if (seat < 0) return;
          if (m.kind === "punta") M.punta(seat, m.val, !!m.coppia, m.ex);            // le puntate arrivano da tutti insieme (con la «Coppia», se c'è)
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
    }, M ? { ripresa: true } : null);
    if (!M) { lobbyOut(); return; }
    // (ripresa) il tavolo com'era: la mano continua da dove era (il tempo per decidere riparte intero)
    avviaTavoloHost(true); bcast();
    // chi non si rifà vivo in 20 s si alza come quando se ne va (la sua mano resta ferma)
    setTimeout(function () { if (!finito) Object.keys(attesi).forEach(function (id) { var i = seatDiId(id); delete attesi[id]; if (i >= 0 && M) { M.esce(i); bcast(); } }); }, 20000);
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
    // chi guarda soltanto (link con guarda=1): niente join, niente puntate, niente ruota (il core butta comunque le sue mosse)
    S.guarda = !!t.guarda;
    function pieno(vm) { return (vm && vm.pieni || []).indexOf(S.mioId) >= 0; }
    function mandaJoin() { S.ultimoJoin = Date.now(); if (S.guarda) return; invia({ t: "join", nome: S.nome, fiches: S.fiches, prova: S.prova, omino: mioAvatar(S.nome) }); }
    // il saldo del profilo segue il tavolo: la puntata si toglie subito (uscendo a metà mano non torna indietro)
    function salvaMio(vm) {
      var me = vm.giocatori[S.mioSeat];
      if (!prof || !me || me.prova || vm.uguali || me.fiches === S.salvato) return;   // (torneo a fiches uguali: fiches finte, il profilo non cambia)
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
        moneteVere: function (i) { var me = S.vm && S.vm.giocatori[S.mioSeat]; return i === S.mioSeat && !!prof && !!me && !me.prova && !S.vm.uguali; },
        puoRientrare: function (vm) { return puoRientrareVm(vm, S.mioSeat, prof); },
        onRientra: function () { invia({ t: "rientro" }); },
        puoNuova: function () { return false; },
        guida: function () { return false; },
        puoRuota: function () { return !S.guarda && S.mioSeat >= 0 && !(S.vm && S.vm.uguali) && puoRuotaProfilo(prof); },
        onRuota: function () { ruotaDalTavolo(mandaBonus); },
        onRicarica: function () { invia({ t: "ricarica" }); },
        // non ho un posto: guardo (col link "guarda", nella Sala non sono tra chi gioca, tavolo pieno, o il torneo è già cominciato)
        guarda: S.guarda,
        guardo: function (vm) {
          if (S.guarda) return "👀 Guardi il tavolo";
          if ((vm.guardano || []).indexOf(S.mioId) < 0) return "";
          if (pieno(vm)) return "🪑 Il tavolo è pieno (10 su 10): guardi la partita";
          if ((vm.senzaQuota || []).indexOf(S.mioId) >= 0) return "🎟️ Non hai " + fmt(vm.gara ? vm.gara.quota : 0) + " 🪙 per la quota: guardi questa gara";
          return vm.uguali ? "🏆 Torneo in corso: lo guardi e giochi al prossimo" : "👀 Guardi il tavolo: questa volta giocano gli altri";
        },
        onPasso: function () {},
        onPunta: function (v, i, cp, ex) { invia({ t: "mossa", kind: "punta", val: v, coppia: !!cp, ex: ex || [] }); },
        onMossa: function (m, chk) { if (m === "stai") suonoStai(); invia({ t: "mossa", kind: "azione", mossa: m, h: chk ? chk.h : null, n: chk ? chk.n : null }); },
        onAssicura: function (si) { invia({ t: "mossa", kind: "assic", si: si }); },
        onFineMano: function (vm) { var me = vm.giocatori[S.mioSeat]; if (prof && me && !me.prova) { salvaFineMano(me, vm); if (!vm.uguali) S.salvato = me.fiches; } },
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
      if (rimborso && prof && me && !me.prova && !S.vm.uguali) {
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
            var sp = S.guarda ? "👀 Guardi soltanto" : ((m.pieni || []).indexOf(S.mioId) >= 0 ? "🪑 Tavolo pieno: guardi e ti siedi se si libera un posto" : false);
            if (!S.tav) renderLobbyBJ(t, { sonoHost: false, codice: m.codice, giocatori: m.giocatori || [], mioId: S.mioId, spettatore: sp }, { bonus: boxBonus, nota: m.regole ? nota : null, onEsci: function () { S.finito = true; if (S.rete) S.rete.chiudi(); t.esci(); } });
          } else if (m.t === "vm") {
            S.vm = m.vm;
            S.mioSeat = (m.vm.giocatori || []).findIndex(function (x) { return x.rid === S.mioId; });   // il mio posto lo ritrovo dal mio id (anche dopo aver ricaricato)
            var me = m.vm.giocatori[S.mioSeat];
            var guardo = S.mioSeat < 0 && (m.vm.guardano || []).indexOf(S.mioId) >= 0;   // non sono tra chi gioca: guardo e basta
            if ((S.mioSeat < 0 || (me && me.via)) && !guardo && Date.now() - S.ultimoJoin > 3000) mandaJoin();   // l'host non mi ha (ancora) rimesso al tavolo
            assicuraTavolo();
            S.tav.aggiorna(m.vm);
            salvaMio(m.vm);
            if (contiGara(m.vm, S.mioSeat, prof)) invia({ t: "saldo", fiches: SGNube.fiches("blackjack") || 0 });   // (gara con la quota: pagata o vinta)
            var Gv = m.vm.gara; if (Gv && Gv.quota && S.mioSeat >= 0 && contiGara.q > ((Gv.conf || {})[S.mioSeat] || 0)) invia({ t: "pagato", g: Gv.id, q: contiGara.q });   // (la mia quota nel montepremi)
          } else if (m.t === "avatari") {
            S.avatari = m.lista || [];
            if (S.tav) S.tav.avatariCambiati();
          } else if (m.t === "pieno") finisci("Il tavolo è pieno (10 su 10). Riprova più tardi!");
          else if (m.t === "chiuso") {
            if (m.garaRimborso) contiGara({ gara: m.garaRimborso, fase: "fine" }, S.mioSeat, prof);   // (la gara chiusa a metà: la quota torna)
            finisci((m.nome || "L'host") + " ha chiuso il tavolo" + (m.garaRimborso ? ": le quote della gara tornano a tutti" : (m.rimborso ? ": la puntata di questa mano ti torna indietro" : "")), m.classifica, !!m.rimborso);
          }
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
    iniettaCSS();
    document.body.classList.remove("bj-verde");
    var el = t.el, s = t.schermata({ icona: "🃏", titolo: "Tavolo chiuso", sotto: "Black Jack online" });
    s._contenuto.appendChild(el("p", { class: "as-msg", text: titolo }));
    var aMeta = !!vm && ["esito", "fine"].indexOf(vm.fase) < 0;   // a metà mano le puntate tornano a tutti
    var righe = classifica || (vm ? vm.giocatori.map(function (g, i) { return { i: i, nome: g.nome, fiches: (g.fiches || 0) + (aMeta ? Math.max(0, puntataInGioco(g)) + (g.assicura || 0) : 0), netto: null, pos: null }; }) : []);
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
    // (chi guarda col link esce dalla targhetta del core "👀 Guardi · ✕": niente seconda uscita)
    if (!(vm && t.tastiFine && t.tastiFine(s._piede, { host: false, esci: t.esci })) && !t.guarda)
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }

  function erroreBJ(t, testo) {
    iniettaCSS();
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
    tema: "oro",   // 🤍 Bianco e oro: schermate di servizio e classifica chiare; il tavolo resta un tavolo vero (schermata scura, vedi tavoloBJ)
    ritardatari: "mano",   // chi arriva a partita cominciata si siede subito e gioca dalla prossima mano (con le sue monete)
    riprende: true,    // se l'host ricarica la pagina, la mano continua da dove era (stesse carte, puntate e fiches)
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    // le regole in una riga, per la saletta ("📜 Si gioca così"): col torneo "🏆 Torneo: tutti con 1.000 fiches finte · …"
    riassunto: function (imp) { return testoRegole(regoleDa(imp || {}), true); },
    modi: [{ modo: "locale", icona: "📱", nome: "Su questo telefono", sotto: "Siete insieme e vi passate il telefono (fino a 10)", amici: true }],
    regole: [
      "Obiettivo: avvicinarti a <b>21</b> più del banco, senza superarlo. Le figure valgono 10, l'Asso 1 o 11.",
      "Ogni mano <b>punti le monete</b>; poi ricevi due carte. Il banco ne mostra una sola. Chi ha meno della puntata minima punta tutto quello che ha.",
      "Nel tuo turno: <b>Carta</b> (peschi), <b>Stai</b> (ti fermi), <b>Raddoppia</b> (raddoppi la puntata e prendi un'ultima carta), <b>Dividi</b> (se hai due carte uguali fai due mani).",
      "Il <b>Black Jack</b> (Asso + 10 o figura, con le prime due carte) paga 3 a 2. Dopo <b>Dividi</b> un Asso con un 10 vale 21, non Black Jack.",
      "<b>Assi divisi</b>: se dividi due Assi ricevi <b>una carta sola per asso</b> e la mano si ferma lì, come al casinò.",
      "<b>Resa</b> (il tastino 🏳️ sotto le carte): con le prime due carte puoi ritirarti e riprendere <b>metà puntata</b>. Non si può dopo Dividi. Conviene con 16 contro 9, 10 o Asso e con 15 contro 10.",
      "Se il banco mostra un Asso puoi <b>assicurarti</b> (paga 2 a 1). Se mostra un Asso o un 10 controlla subito la carta coperta: se ha Black Jack la mano finisce lì e perdi solo la puntata.",
      "Il banco non sceglie: <b>tira sempre fino a 16 e si ferma da 17</b>, anche quando sta già battendo qualcuno (come al casinò). Vince chi si avvicina di più a 21. Si gioca con <b>6 mazzi</b>, rimescolati quando restano poche carte.",
      "Online ognuno gioca dal suo telefono: chi non decide in tempo salta la mano o sta. Chi finisce le monete può ripartire con 500 di prova.",
      "A fine partita vince chi ha guadagnato di più al tavolo. Col 💡 consiglio acceso (lo scegli prima di cominciare) il tasto della mossa giusta brilla.",
      "Ogni mano scegli quanto puntare con la <b>lineetta</b>: a sinistra la puntata minima, a destra tutte le tue monete. Con le Speed Coins, se punti più di metà di quello che hai, il gioco ti chiede un secondo sì.",
      "<b>🏆 Gara della serata</b> (si accende nelle regole): tutti con le stesse fiches e un numero di mani, la classifica sempre in alto, vince chi ha più fiches alla fine. L'<b>ultima mano si punta in segreto</b>: le puntate si scoprono tutte insieme. Dalle 6 mani in su c'è anche il <b>giro di boa</b> a metà, e nelle ultime 3 mani la puntata minima raddoppia.",
      "Online la gara si gioca con le <b>Speed Coins</b>: ognuno paga la quota d'ingresso (chi non ce l'ha guarda) e le quote vanno nel <b>montepremi</b>: fino a 3 giocatori tutto al primo, da 4 a 6 il 70% e il 30%, da 7 in su 60, 30 e 10%. Chi resta senza fiches può <b>rientrare</b> pagando di nuovo la quota, fino alla penultima mano. Con la quota «Gratis» e sullo stesso telefono si gioca con fiches finte.",
      "<b>😏 Battute del banco</b> (si spengono nelle regole): ogni tanto, nei momenti forti (chi sballa, chi punta tutto, chi fa Black Jack…), il banco prende in giro chi gioca con una battuta nel suo fumetto. Per ridere, mai per offendere.",
      "<b>👯 Coppia</b> (si spegne nelle regole): mentre punti puoi aggiungere una fiche piccola, la puntata minima, che scommette sulle tue prime due carte. Se sono una coppia (due 8, due re…) vinci subito, anche se poi la mano va male: colori diversi 6 volte la fiche, stesso colore 15 volte, identiche (stesso seme) 25 volte. Se non è coppia perdi solo quella fiche.",
      "<b>🎰 Regole da esperti</b> (nelle regole, tutte come al casinò e di partenza spente): <b>🃏 21+3</b> (le tue due carte con la scoperta del banco: colore 5 volte, scala 11, tris 30, scala colore 40, tris dello stesso seme 100), <b>👑 Stesso seme</b> (le prime due carte dello stesso seme 2,5 volte, re e donna dello stesso seme 45), <b>💥 Il banco sballa</b> (il banco gioca sempre fino in fondo; se sballa paga secondo le carte che ha: 3 carte 2 volte, 4 carte 2,5, 5 carte 4, 6 carte 15, 7 carte 50, 8 e più 250); e poi il banco che tira sul 17 morbido, quanti mazzi (1, 2, 6 o 8), il raddoppio solo su 9, 10 e 11, niente raddoppio dopo Dividi, dividere di nuovo gli Assi, niente resa, 5 carte senza sballare che vincono sempre.",
      "A fine partita i <b>titoli</b>: 🍀 Il Fortunato, 🎲 Lo Spericolato, 💥 Lo Sballone, 🏳️ Il Prudente, 🧊 Il Ragioniere e 🎩 L'amico del banco."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, online = aiuti.modo === "online" || !!aiuti.sala;
      dove.modo = aiuti.torneo ? "locale" : (aiuti.modo || "locale");
      if (aiuti.torneo) dove.torneo = true;
      dove.min = 10; dove.mani = (aiuti.torneo || aiuti.sala) ? 10 : 0; dove.tempo = 25; dove.consigli = true;
      // il saldo e la ruota del giorno (online li trovi già nella saletta)
      if (!online && !aiuti.torneo && window.SGNube && SGNube.disponibile() && SGNube.profilo()) box.appendChild(riquadroBonus(el));
      function gruppo(titolo, chiave, scelte, dopo) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var riga = el("div", { style: "display:flex;gap:8px" });
        scelte.forEach(function (sc) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === sc[0] ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
            dove[chiave] = sc[0]; [].forEach.call(riga.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
            if (dopo) dopo(sc[0]);
          } }, [ el("div", { class: "mt", text: sc[1] }) ]);
          riga.appendChild(b);
        });
        box.appendChild(riga);
        return riga;
      }
      gruppo("Puntata minima", "min", [[10, "10 🪙"], [50, "50 🪙"], [100, "100 🪙"]]);
      var gm = gruppo("Quante mani", "mani", [[10, "10"], [20, "20"], [0, "Senza fine"]]);
      // il Torneo della serata: tutti con le stesse fiches finte, vince chi ne ha di più alla fine (le monete del profilo non si toccano)
      dove.uguali = false; dove.quota = online ? 1000 : 0;
      // la nota sotto la gara: con la quota (solo online) si gioca con le Speed Coins, se no con fiches finte
      function scriviNota() {
        var v = dove.uguali;
        notaU.textContent = !v ? "" : (dove.quota ? "Ognuno paga " + fmt(dove.quota) + " Speed Coins di quota e parte con " + fmt(dove.quota) + " fiches, uguali per tutti. Le quote vanno nel montepremi, che va ai primi. Chi resta senza fiches può rientrare pagando di nuovo la quota." :
          "Tutti partono con " + fmt(BJ.FICHES_TORNEO) + " fiches finte e vince chi ne ha di più alla fine. Le Speed Coins non si toccano.");
        notaU.style.display = v ? "" : "none";
        if (gq) { gq.style.display = v ? "" : "none"; gq.previousSibling.style.display = v ? "" : "none"; }
      }
      var gq = null;
      gruppo("🏆 Gara della serata", "uguali", [[false, "No"], [true, "Fiches uguali"]], function (v) {
        scriviNota();
        gm.lastChild.style.display = v ? "none" : "";   // (il torneo ha sempre un numero di mani)
        if (v && !dove.mani) { dove.mani = 10; [].forEach.call(gm.children, function (c, k) { c.classList.toggle("attiva", k === 0); }); }
      });
      // la quota d'ingresso della gara (solo online: sullo stesso telefono le monete le ha solo il primo)
      if (online) { gq = gruppo("🎟️ Quota d'ingresso", "quota", [[0, "Gratis"], [500, "500"], [1000, "1.000"], [5000, "5.000"], [10000, "10.000"]], function () { scriviNota(); }); gq.style.display = "none"; gq.previousSibling.style.display = "none"; }
      var notaU = el("p", { class: "modulo-nota", style: "margin-top:6px;display:none" });
      box.appendChild(notaU);
      if (online) gruppo("Tempo per decidere", "tempo", [[15, "15 s"], [25, "25 s"], [0, "Senza limite"]]);
      gruppo("💡 Consiglio della mossa giusta", "consigli", [[true, "Sì"], [false, "No"]]);
      dove.battute = true;
      gruppo("😏 Battute del banco", "battute", [[true, "Sì"], [false, "No"]]);
      // 🎰 le regole da esperti: chiuse in una sezione che si apre con un tocco (chi non le conosce non vede un muro di opzioni)
      dove.coppia = true; dove.h17 = false; dove.mazzi = 6; dove.r911 = false; dove.das = true; dove.rsa = false; dove.resa = true; dove.charlie = false;
      dove.t213 = false; dove.buster = false; dove.royal = false;
      var sez = el("div", { style: "display:none" }), apri = el("button", { class: "modo-chip", style: "margin-top:12px;width:100%;justify-content:center", onclick: function () {
        var on = sez.style.display === "none"; sez.style.display = on ? "" : "none"; apri.firstChild.textContent = on ? "🎰 Regole da esperti ▾" : "🎰 Regole da esperti ›";
      } }, [ el("div", { class: "mt", text: "🎰 Regole da esperti ›" }) ]);
      box.appendChild(apri); box.appendChild(sez);
      var boxFuori = box; box = sez;   // (i gruppi qui sotto finiscono nella sezione)
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:6px", text: "Le scommesse extra valgono la puntata minima e si accendono con l'interruttore accanto alla puntata." }));
      gruppo("👯 Scommessa «Coppia»", "coppia", [[true, "Sì"], [false, "No"]]);
      gruppo("🃏 Scommessa «21+3»", "t213", [[false, "No"], [true, "Sì"]]);
      gruppo("👑 Scommessa «Stesso seme»", "royal", [[false, "No"], [true, "Sì"]]);
      gruppo("💥 Scommessa «Il banco sballa»", "buster", [[false, "No"], [true, "Sì"]]);
      gruppo("Il banco col 17 morbido (Asso e 6)", "h17", [[false, "Sta"], [true, "Tira"]]);
      gruppo("Mazzi", "mazzi", [[1, "1"], [2, "2"], [6, "6"], [8, "8"]]);
      gruppo("Raddoppio", "r911", [[false, "Sempre"], [true, "Solo 9-10-11"]]);
      gruppo("Raddoppio dopo Dividi", "das", [[true, "Sì"], [false, "No"]]);
      gruppo("Dividere di nuovo gli Assi", "rsa", [[false, "No"], [true, "Sì"]]);
      gruppo("🏳️ Resa", "resa", [[true, "Sì"], [false, "No"]]);
      gruppo("🖐️ 5 carte senza sballare vincono", "charlie", [[false, "No"], [true, "Sì"]]);
      box = boxFuori;
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteBJ(t, t.linkParams.stanza);
      var imp = t.impostazioni || {};
      if (imp.modo === "online") return hostBJ(t);
      return localeBJ(t);
    }
  });
})();
