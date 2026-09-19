/* =========================================================
   BLACK JACK — "Il 21"
   Carte francesi disegnate a mano (SVG originali, nessun mazzo
   con copyright). Sabot da 6 mazzi, banco gestito dalla CPU,
   fiches con puntate, mosse Carta/Stai/Raddoppia/Dividi/Assicura.
   Da 1 a 10 giocatori. Interfaccia verticale a tre zone:
   Banco in alto · Giocatore attivo al centro (grande) ·
   Tavolata compatta a scorrimento in basso.
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
  function testo(mano) { var p = punteggio(mano); return eBlackjack(mano) ? "BJ" : (p > 21 ? "sballa " + p : (eSoft(mano) ? "" + (p - 10) + "/" + p : "" + p)); }

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
    valoreCarta: valoreCarta, punteggio: punteggio, eSoft: eSoft, eBlackjack: eBlackjack,
    testo: testo, cartaHTML: cartaHTML, fronteSVG: fronteSVG, retroSVG: retroSVG, colore: colore
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

  function manoVuota(puntata) { return { carte: [], puntata: puntata, chiusa: false, raddoppiata: false, esito: null, vincita: 0 }; }

  function creaMotoreBJ(nomi, mischia) {
    var st = {
      sabot: nuovoSabot(mischia),
      giocatori: nomi.map(function (n, i) {
        return { id: "g" + i, nome: n, fiches: FICHES_INIZIALI, puntata: 0, assicura: 0, mani: [], attiva: 0 };
      }),
      banco: { carte: [] },
      fase: "punta",     // punta -> (assic) -> gioca -> banco -> esito
      giro: 1,
      turno: 0,          // indice del giocatore che sta agendo
      msg: "",
      rimescolato: false
    };

    function inGioco() { return st.giocatori.filter(function (g) { return g.fiches > 0 || g.puntata > 0; }); }

    function nuovaMano() {
      if (restaSotto(st.sabot)) { rimescolaSabot(st.sabot); st.rimescolato = true; } else st.rimescolato = false;
      st.banco = { carte: [] };
      st.giocatori.forEach(function (g) { g.puntata = 0; g.assicura = 0; g.mani = []; g.attiva = 0; });
      st.fase = "punta";
      st.turno = primoCheDevePuntare(0);
      st.msg = "";
      return st;
    }
    function primoCheDevePuntare(da) {
      for (var i = da; i < st.giocatori.length; i++) if (st.giocatori[i].fiches >= PUNTATA_MIN) return i;
      return -1;
    }

    // Un giocatore punta; quando hanno puntato tutti quelli che possono, si distribuisce.
    function punta(idx, importo) {
      var g = st.giocatori[idx]; if (!g || st.fase !== "punta") return st;
      importo = Math.max(PUNTATA_MIN, Math.min(importo, g.fiches));
      g.puntata = importo; g.fiches -= importo;
      var next = primoCheDevePuntare(idx + 1);
      if (next < 0) distribuisci(); else st.turno = next;
      return st;
    }

    function distribuisci() {
      var attivi = st.giocatori.filter(function (g) { return g.puntata > 0; });
      attivi.forEach(function (g) { g.mani = [manoVuota(g.puntata)]; g.attiva = 0; });
      // due giri di carte ai giocatori, due al banco
      attivi.forEach(function (g) { g.mani[0].carte.push(pescaSabot(st.sabot)); });
      st.banco.carte.push(pescaSabot(st.sabot));
      attivi.forEach(function (g) { g.mani[0].carte.push(pescaSabot(st.sabot)); });
      st.banco.carte.push(pescaSabot(st.sabot));  // seconda carta = coperta finché non tocca al banco
      // black jack naturali dei giocatori: mano chiusa
      attivi.forEach(function (g) { if (eBlackjack(g.mani[0].carte)) g.mani[0].chiusa = true; });
      // se il banco mostra un Asso -> assicurazione
      if (st.banco.carte[0].v === 1 && attivi.some(function (g) { return g.fiches >= Math.floor(g.puntata / 2); })) {
        st.fase = "assic"; st.turno = primoDaAssicurare(0);
      } else avviaGioco();
      return st;
    }
    function primoDaAssicurare(da) {
      for (var i = da; i < st.giocatori.length; i++) { var g = st.giocatori[i]; if (g.puntata > 0 && !eBlackjack(g.mani[0].carte)) return i; }
      return -1;
    }
    function assicura(idx, si) {
      var g = st.giocatori[idx]; if (!g || st.fase !== "assic") return st;
      if (si) { var costo = Math.min(Math.floor(g.puntata / 2), g.fiches); g.assicura = costo; g.fiches -= costo; }
      var next = primoDaAssicurare(idx + 1);
      if (next < 0) avviaGioco(); else st.turno = next;
      return st;
    }

    function avviaGioco() {
      st.fase = "gioca";
      st.turno = prossimoGiocatoreDaGiocare(0);
      if (st.turno < 0) giocaBanco();
    }
    function prossimoGiocatoreDaGiocare(da) {
      for (var i = da; i < st.giocatori.length; i++) {
        var g = st.giocatori[i];
        if (g.puntata > 0 && g.mani.some(function (m) { return !m.chiusa; })) { g.attiva = g.mani.findIndex(function (m) { return !m.chiusa; }); return i; }
      }
      return -1;
    }

    // azione del giocatore attivo sulla mano attiva
    function azione(mossa) {
      if (st.fase !== "gioca") return st;
      var g = st.giocatori[st.turno]; if (!g) return st;
      var m = g.mani[g.attiva]; if (!m || m.chiusa) return st;
      if (mossa === "carta") { m.carte.push(pescaSabot(st.sabot)); if (punteggio(m.carte) >= 21) m.chiusa = true; }
      else if (mossa === "stai") { m.chiusa = true; }
      else if (mossa === "raddoppia") {
        if (m.carte.length === 2 && g.fiches >= m.puntata) { g.fiches -= m.puntata; m.puntata *= 2; m.raddoppiata = true; m.carte.push(pescaSabot(st.sabot)); m.chiusa = true; }
      } else if (mossa === "dividi") {
        if (puoDividere(g, m)) {
          g.fiches -= m.puntata;
          var c2 = m.carte.pop();
          var nuova = manoVuota(m.puntata); nuova.carte.push(c2);
          m.carte.push(pescaSabot(st.sabot));
          nuova.carte.push(pescaSabot(st.sabot));
          g.mani.splice(g.attiva + 1, 0, nuova);
          if (m.carte[0].v === 1) { m.chiusa = true; nuova.chiusa = true; } // split di assi: una carta sola
        }
      }
      avanzaTurno(g);
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

    function giocaBanco() {
      st.fase = "banco";
      // il banco gioca solo se c'è almeno una mano viva (non sballata e non BJ già risolto)
      var qualcuno = st.giocatori.some(function (g) { return g.mani.some(function (m) { return punteggio(m.carte) <= 21 && !eBlackjack(m.carte); }); });
      if (qualcuno) { while (punteggio(st.banco.carte) < 17) st.banco.carte.push(pescaSabot(st.sabot)); }
      risolvi();
    }

    function risolvi() {
      var pb = punteggio(st.banco.carte), bjBanco = eBlackjack(st.banco.carte);
      st.giocatori.forEach(function (g) {
        // assicurazione: paga 2:1 se il banco ha black jack
        if (g.assicura > 0) { if (bjBanco) g.fiches += g.assicura * 3; }
        g.mani.forEach(function (m) {
          var pm = punteggio(m.carte), bjMano = eBlackjack(m.carte), v = 0, es;
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
      st.giro++;
    }

    return {
      st: st,
      nuovaMano: nuovaMano, punta: punta, assicura: assicura, azione: azione,
      mosseValide: mosseValide, PUNTATE_RAPIDE: PUNTATE_RAPIDE, PUNTATA_MIN: PUNTATA_MIN
    };
  }

  window.__BJ.creaMotore = creaMotoreBJ;
  window.__BJ.FICHES_INIZIALI = FICHES_INIZIALI;
})();

// =========================================================
//  INTERFACCIA + REGISTRAZIONE DEL GIOCO
//  Tre zone verticali: Banco in alto · Giocatore attivo al
//  centro (grande) · Tavolata compatta a scorrimento in basso.
// =========================================================
(function () {
  "use strict";
  var BJ = window.__BJ;

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
    ".bj-punta-val{font-size:2rem;font-weight:900;color:#ffe58a}",
    // tavolata
    ".bj-tavolata{flex:0 0 auto;display:flex;gap:8px;overflow-x:auto;padding:8px 2px;scrollbar-width:none}",
    ".bj-tavolata::-webkit-scrollbar{display:none}",
    ".bj-seat{flex:0 0 auto;width:104px;background:rgba(0,0,0,.28);border-radius:14px;padding:8px 8px 10px;text-align:center;border:2px solid transparent;transition:opacity .2s}",
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
    // animazione di entrata delle carte (pesca / distribuzione)
    "@keyframes bjIn{from{opacity:0;transform:translateY(-16px) scale(.86) rotate(-4deg)}to{opacity:1;transform:none}}",
    ".bj-nuova{animation:bjIn .26s cubic-bezier(.2,.9,.3,1.2) both}",
    ".bj-flip{animation:bjIn .3s ease both}"
  ].join("");

  function iniettaCSS() {
    if (document.getElementById("bj-css")) return;
    var st = document.createElement("style"); st.id = "bj-css"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---- suoni (Web Audio) + vibrazione ----
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
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
  function suonoCarta() { bip(300, 420, 0.09, "triangle", 0.18); vibra(8); }
  function suonoStai() { bip(240, 200, 0.1, "sine", 0.14); }
  function suonoChip() { bip(660, 880, 0.07, "square", 0.12); vibra(6); }
  function suonoSballo() { bip(220, 90, 0.35, "sawtooth", 0.22); vibra([0, 30, 40, 60]); }
  function suonoVinci() { bip(520, 660, 0.12, "triangle", 0.22); setTimeout(function () { bip(700, 900, 0.16, "triangle", 0.22); }, 110); vibra([0, 18, 40, 22]); }
  function suonoBlackjack() { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { bip(f, f, 0.14, "triangle", 0.22); }, i * 90); }); vibra([0, 20, 30, 20, 30, 30]); }
  function suonoPerdi() { bip(300, 180, 0.22, "sine", 0.16); }

  function cartaEl(el, c, coperta, cls) {
    return el("div", { class: "cc " + (cls || ""), html: BJ.cartaHTML(c, coperta) });
  }

  // ---------- MODALITÀ "UN TELEFONO SOLO" ----------
  function localeBJ(t) {
    iniettaCSS();
    var el = t.el;
    var nomi = (t.giocatori && t.giocatori.length) ? t.giocatori.slice() : ["Giocatore 1"];
    var M = BJ.creaMotore(nomi, t.mischia);
    var st = M.st;
    var animaUltima = false, animaDistrib = false, animaBanco = false;  // flag di animazione

    var s = t.schermata({
      titolo: "🃏 Black Jack", sotto: "Banco: CPU",
      indietro: function () { if (window.confirm("Uscire dal tavolo?")) { document.body.classList.remove("bj-verde"); t.esci(); } }
    });
    var wrap = el("div", { class: "bj-wrap" });
    var zBanco = el("div", { class: "bj-banco" });
    var zHero = el("div", { class: "bj-hero" });
    var zMsg = el("div", { class: "bj-msg" });
    var zTav = el("div", { class: "bj-tavolata" });
    wrap.appendChild(zBanco); wrap.appendChild(zHero); wrap.appendChild(zMsg); wrap.appendChild(zTav);
    s._contenuto.appendChild(wrap);
    t.mostra(s);
    document.body.classList.add("bj-verde");

    M.nuovaMano();
    aggiorna();

    function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }

    // wrapper: puntata (chip) con suono; se parte la distribuzione, animala
    function puntaChip(v) {
      suonoChip();
      M.punta(st.turno, v);
      if (st.fase !== "punta") animaDistrib = true;   // sono state distribuite le carte
      aggiorna();
    }
    // wrapper: mossa di gioco con suoni/vibrazione/animazione
    function agisciMossa(mossa) {
      var g = st.giocatori[st.turno], m = g && g.mani[g.attiva];
      var primaFase = st.fase;
      M.azione(mossa);
      if (mossa === "stai") suonoStai();
      else { animaUltima = true; suonoCarta(); if (m && BJ.punteggio(m.carte) > 21) setTimeout(suonoSballo, 90); }
      if (st.fase === "esito" && primaFase !== "esito") finaleMano();
      aggiorna();
    }
    function finaleMano() {
      animaBanco = true;
      var delta = 0, bj = false;
      st.giocatori.forEach(function (g) { g.mani.forEach(function (m) { delta += (m.vincita - m.puntata); if (m.esito === "blackjack") bj = true; }); });
      setTimeout(function () { if (bj) suonoBlackjack(); else if (delta > 0) suonoVinci(); else if (delta < 0) suonoPerdi(); }, 420);
    }

    function aggiorna() {
      disegnaBanco();
      disegnaTavolata();
      disegnaHero();
      zMsg.textContent = st.msg || "";
      animaUltima = false; animaDistrib = false; animaBanco = false;
    }

    // ---- BANCO ----
    function disegnaBanco() {
      svuota(zBanco);
      zBanco.appendChild(el("div", { class: "bj-titoloz", text: "Il Banco" }));
      var riga = el("div", { class: "bj-carte" });
      var mostraTutto = (st.fase === "banco" || st.fase === "esito");
      st.banco.carte.forEach(function (c, i) {
        var coperta = (!mostraTutto && i === 1);
        var card = cartaEl(el, c, coperta, "cc" + (animaBanco ? " bj-flip" : ""));
        if (animaBanco) card.style.animationDelay = (i * 0.12) + "s";
        riga.appendChild(card);
      });
      if (!st.banco.carte.length) riga.appendChild(el("div", { style: "color:rgba(255,255,255,.4);font-size:.85rem", text: "—" }));
      zBanco.appendChild(riga);
      if (st.banco.carte.length) {
        var p = mostraTutto ? BJ.punteggio(st.banco.carte) : BJ.valoreCarta(st.banco.carte[0].v);
        var cls = mostraTutto && p > 21 ? "bust" : "";
        zBanco.appendChild(el("div", { class: "bj-pt " + cls, text: mostraTutto ? ("" + p + (BJ.eBlackjack(st.banco.carte) ? " · BJ" : "")) : ("" + p + " +?") }));
      }
    }

    // ---- TAVOLATA (tutti i giocatori, compatti) ----
    function disegnaTavolata() {
      svuota(zTav);
      st.giocatori.forEach(function (g, idx) {
        var attivo = (st.fase === "punta" || st.fase === "assic" || st.fase === "gioca") && idx === st.turno;
        var seat = el("div", { class: "bj-seat" + (attivo ? " attiva" : (attivo ? "" : "")) });
        if (attivo) seat.classList.add("attivo"); else if (st.fase === "gioca" || st.fase === "punta") seat.classList.add("spenta");
        seat.appendChild(el("div", { class: "nm", text: g.nome }));
        seat.appendChild(el("div", { class: "fi", text: g.fiches + " 🪙" }));
        var mano = g.mani[0];
        var fan = el("div", { class: "bj-fan" });
        if (mano && mano.carte.length) {
          var n = mano.carte.length, spread = Math.min(16, 70 / n);
          mano.carte.forEach(function (c, i) {
            var card = cartaEl(el, c, false);
            card.style.left = (i * spread) + "px";
            card.style.zIndex = i;
            fan.appendChild(card);
          });
          fan.style.width = ((n - 1) * spread + 36) + "px";
        } else fan.appendChild(el("div", { style: "color:rgba(255,255,255,.35);font-size:.75rem;margin-top:16px", text: g.puntata ? "…" : "in attesa" }));
        seat.appendChild(fan);
        if (mano && mano.carte.length) {
          var pm = BJ.punteggio(mano.carte);
          var bcls = mano.esito === "vince" || mano.esito === "blackjack" ? "win" : (pm > 21 ? "bust" : "");
          var txt = st.fase === "esito" && mano.esito ? etichettaEsito(mano) : BJ.testo(mano.carte);
          seat.appendChild(el("span", { class: "bj-badge " + bcls, text: txt }));
        } else if (g.puntata) seat.appendChild(el("span", { class: "bj-badge", text: g.puntata + "🪙" }));
        zTav.appendChild(seat);
      });
    }
    function etichettaEsito(m) {
      return ({ vince: "vince", blackjack: "BJ!", perde: "perde", pari: "pari" })[m.esito] || "";
    }

    // ---- HERO (giocatore attivo, grande) ----
    function disegnaHero() {
      svuota(zHero);
      if (st.fase === "punta") return heroPunta();
      if (st.fase === "assic") return heroAssic();
      if (st.fase === "gioca") return heroGioca();
      if (st.fase === "esito") return heroEsito();
    }

    function heroPunta() {
      var g = st.giocatori[st.turno];
      zHero.appendChild(el("div", { class: "bj-hnome", text: g.nome + ", punta" }));
      zHero.appendChild(el("div", { class: "bj-hfiches", text: g.fiches + " 🪙 disponibili" }));
      var chip = el("div", { class: "bj-chip" });
      M.PUNTATE_RAPIDE.forEach(function (v) {
        var b = el("button", { class: "bj-c", text: "" + v, onclick: function () { if (g.fiches >= v) puntaChip(v); } });
        if (g.fiches < v) b.disabled = true;
        chip.appendChild(b);
      });
      zHero.appendChild(chip);
      zHero.appendChild(el("button", { class: "bj-btn bj-b-stai", style: "flex:0 0 auto;min-width:180px", text: "Punta tutto (" + g.fiches + ")", onclick: function () { puntaChip(g.fiches); } }));
    }

    function heroAssic() {
      var g = st.giocatori[st.turno], costo = Math.floor(g.puntata / 2);
      zHero.appendChild(el("div", { class: "bj-hnome", text: g.nome + ": assicurazione?" }));
      zHero.appendChild(el("div", { class: "bj-hfiches", text: "Il banco mostra un Asso. Assicuri per " + costo + " 🪙? (paga 2:1)" }));
      heroCarteAttive(g);
      var az = el("div", { class: "bj-azioni" });
      az.appendChild(el("button", { class: "bj-btn bj-b-si", text: "Assicuro", onclick: function () { M.assicura(st.turno, true); aggiorna(); } }));
      az.appendChild(el("button", { class: "bj-btn bj-b-no", text: "No", onclick: function () { M.assicura(st.turno, false); aggiorna(); } }));
      zHero.appendChild(az);
    }

    function heroCarteAttive(g) {
      var box = el("div", { class: "bj-mani" });
      g.mani.forEach(function (m, i) {
        var mano = el("div", { class: "bj-mano" + (i === g.attiva && st.fase === "gioca" ? " attiva" : "") });
        var cc = el("div", { class: "bj-hcarte" + (g.mani.length > 1 ? " doppia" : "") });
        m.carte.forEach(function (c, ci) {
          var isUlt = (i === g.attiva && ci === m.carte.length - 1);
          var anima = animaDistrib || (animaUltima && isUlt);
          var card = cartaEl(el, c, false, anima ? "bj-nuova" : "");
          if (animaDistrib) card.style.animationDelay = (ci * 0.1) + "s";
          cc.appendChild(card);
        });
        mano.appendChild(cc);
        var pm = BJ.punteggio(m.carte);
        mano.appendChild(el("div", { class: "bj-pt " + (pm > 21 ? "bust" : (m.esito === "vince" || m.esito === "blackjack" ? "win" : "")), style: "display:block;margin:6px auto 0;width:fit-content", text: BJ.testo(m.carte) + " · " + m.puntata + "🪙" }));
        box.appendChild(mano);
      });
      zHero.appendChild(box);
    }

    function heroGioca() {
      var g = st.giocatori[st.turno];
      zHero.appendChild(el("div", { class: "bj-hnome", text: g.nome }));
      zHero.appendChild(el("div", { class: "bj-hfiches", text: g.fiches + " 🪙" }));
      heroCarteAttive(g);
      var v = M.mosseValide();
      var az = el("div", { class: "bj-azioni" });
      az.appendChild(btn("Carta", "bj-b-carta", true, function () { agisciMossa("carta"); }));
      az.appendChild(btn("Stai", "bj-b-stai", true, function () { agisciMossa("stai"); }));
      az.appendChild(btn("Raddoppia", "bj-b-radd", v.raddoppia, function () { agisciMossa("raddoppia"); }));
      az.appendChild(btn("Dividi", "bj-b-dividi", v.dividi, function () { agisciMossa("dividi"); }));
      zHero.appendChild(az);
    }
    function btn(txt, cls, on, cb) {
      var b = el("button", { class: "bj-btn " + cls, text: txt, onclick: cb }); if (!on) b.disabled = true; return b;
    }

    function heroEsito() {
      var vinc = 0;
      st.giocatori.forEach(function (g) { g.mani.forEach(function (m) { vinc += (m.vincita - m.puntata); }); });
      zHero.appendChild(el("div", { class: "bj-hnome", text: "Fine mano " + (st.giro - 1) }));
      zHero.appendChild(el("div", { class: "bj-hfiches", text: st.rimescolato ? "🔀 Sabot rimescolato" : "" }));
      var classifica = st.giocatori.slice().sort(function (a, b) { return b.fiches - a.fiches; });
      var lista = el("div", { style: "width:100%;max-width:360px" });
      classifica.forEach(function (g) {
        lista.appendChild(el("div", { style: "display:flex;justify-content:space-between;padding:5px 10px;border-bottom:1px solid rgba(255,255,255,.08)" }, [
          el("span", { style: "font-weight:800", text: g.nome }),
          el("span", { style: "font-weight:900;color:#ffe58a", text: g.fiches + " 🪙" })
        ]));
      });
      zHero.appendChild(lista);
      var az = el("div", { class: "bj-azioni" });
      az.appendChild(el("button", { class: "bj-btn bj-b-carta", text: "Nuova mano ▶", onclick: function () { M.nuovaMano(); aggiorna(); } }));
      zHero.appendChild(az);
    }
  }

  // ---------- REGISTRAZIONE ----------
  SG.registra({
    id: "blackjack",
    nome: "Black Jack",
    icona: "🃏",
    descrizione: "Il 21 contro il banco: punta le fiches, chiedi carta o stai, raddoppia e dividi. Carte francesi vere, Sabot da 6 mazzi. Da 1 a 10 giocatori.",
    giocatoriMin: 1, giocatoriMax: 10, difficolta: 2,
    regole: [
      "Obiettivo: avvicinarti a <b>21</b> più del banco, senza superarlo. Le figure valgono 10, l'Asso 1 o 11.",
      "Ogni mano <b>punti le fiches</b>; poi ricevi due carte. Il banco ne mostra una sola.",
      "Nel tuo turno: <b>Carta</b> (peschi), <b>Stai</b> (ti fermi), <b>Raddoppia</b> (raddoppi la puntata e prendi un'ultima carta), <b>Dividi</b> (se hai due carte uguali fai due mani).",
      "Se il banco mostra un Asso puoi <b>assicurarti</b>. Il <b>Black Jack</b> (21 con due carte) paga 3:2.",
      "Il banco pesca fino ad arrivare almeno a 17. Vince chi si avvicina di più a 21. Si gioca con un <b>Sabot da 6 mazzi</b>, rimescolato quando restano poche carte."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el; dove.modo = "locale";
      box.appendChild(el("p", { class: "as-msg", html: "🃏 Un telefono solo, appoggiato al tavolo: il <b>banco è la CPU</b>. La modalità online (ognuno dal suo telefono) arriva a breve." }));
    },
    avvia: function (t) { return localeBJ(t); }
  });
})();

