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

  function creaMotoreBJ(nomi, mischia, fichesIniz) {
    var st = {
      sabot: nuovoSabot(mischia),
      giocatori: nomi.map(function (n, i) {
        var f = (fichesIniz && fichesIniz[i] != null) ? fichesIniz[i] : FICHES_INIZIALI;
        return { id: "g" + i, nome: n, fiches: f, puntata: 0, assicura: 0, mani: [], attiva: 0 };
      }),
      banco: { carte: [] },
      fase: "punta",     // punta -> (assic) -> gioca -> banco -> esito
      giro: 1,
      turno: 0,          // indice del giocatore che sta agendo
      msg: "",
      rimescolato: false
    };

    function inGioco() { return st.giocatori.filter(function (g) { return g.fiches > 0 || g.puntata > 0; }); }

    // annuncio "in prima persona" della mossa di un giocatore: la UI lo mostra
    // come una nuvoletta sopra il suo riquadro (es. clicca "Stai" -> dice "Passo").
    function annuncia(seat, testo) { st.annSeq = (st.annSeq || 0) + 1; st.annuncio = { seat: seat, testo: testo, id: st.annSeq }; }

    function nuovaMano() {
      if (restaSotto(st.sabot)) { rimescolaSabot(st.sabot); st.rimescolato = true; } else st.rimescolato = false;
      st.banco = { carte: [] };
      st.giocatori.forEach(function (g) { g.puntata = 0; g.assicura = 0; g.mani = []; g.attiva = 0; });
      st.fase = "punta";
      st.turno = primoCheDevePuntare(0);
      st.msg = ""; st.annuncio = null;
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
      annuncia(idx, "Punto " + importo);
      var next = primoCheDevePuntare(idx + 1);
      if (next < 0) distribuisci(); else st.turno = next;
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
      if (st.banco.carte[0].v === 1 && att.some(function (g) { return g.fiches >= Math.floor(g.puntata / 2); })) {
        st.fase = "assic"; st.turno = primoDaAssicurare(0);
      } else avviaGioco();
    }
    function primoDaAssicurare(da) {
      for (var i = da; i < st.giocatori.length; i++) { var g = st.giocatori[i]; if (g.puntata > 0 && !eBlackjack(g.mani[0].carte)) return i; }
      return -1;
    }
    function assicura(idx, si) {
      var g = st.giocatori[idx]; if (!g || st.fase !== "assic") return st;
      if (si) { var costo = Math.min(Math.floor(g.puntata / 2), g.fiches); g.assicura = costo; g.fiches -= costo; annuncia(idx, "Assicuro"); }
      else annuncia(idx, "Niente");
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
      if (mossa === "carta") { m.carte.push(pescaSabot(st.sabot)); if (punteggio(m.carte) >= 21) m.chiusa = true; annuncia(st.turno, "Carta!"); }
      else if (mossa === "stai") { m.chiusa = true; annuncia(st.turno, "Passo"); }
      else if (mossa === "raddoppia") {
        if (m.carte.length === 2 && g.fiches >= m.puntata) { g.fiches -= m.puntata; m.puntata *= 2; m.raddoppiata = true; m.carte.push(pescaSabot(st.sabot)); m.chiusa = true; annuncia(st.turno, "Raddoppio!"); }
      } else if (mossa === "dividi") {
        if (puoDividere(g, m)) {
          g.fiches -= m.puntata;
          var c2 = m.carte.pop();
          var nuova = manoVuota(m.puntata); nuova.carte.push(c2);
          m.carte.push(pescaSabot(st.sabot));
          nuova.carte.push(pescaSabot(st.sabot));
          g.mani.splice(g.attiva + 1, 0, nuova);
          if (m.carte[0].v === 1) { m.chiusa = true; nuova.chiusa = true; } // split di assi: una carta sola
          annuncia(st.turno, "Divido!");
        }
      }
      return st;   // il turno NON avanza subito: la UI aspetta e poi chiama avanza()
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
    function bancoVivo() { return st.giocatori.some(function (g) { return g.mani.some(function (m) { return punteggio(m.carte) <= 21 && !eBlackjack(m.carte); }); }); }
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
      nuovaMano: nuovaMano, punta: punta, assicura: assicura, azione: azione, avanza: avanza,
      passoDistribuzione: passoDistribuzione, passoBanco: passoBanco,
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
    // ---- la sala: telecamera dietro Matt, giocatori seduti attorno al tavolo a mezzaluna ----
    ".bj-sala{position:relative;margin:0 -8px;overflow:hidden;border-radius:16px;background:radial-gradient(80% 60% at 50% 0%,rgba(255,214,140,.40),rgba(255,214,140,0) 70%),linear-gradient(#4a2c22 0%,#34201a 55%,#1f130e 100%);box-shadow:inset 0 0 44px rgba(0,0,0,.55)}",
    ".bj-pl{position:absolute;inset:0;z-index:1}",
    ".bj-gioc{position:absolute}.bj-gioc svg{display:block;width:100%;height:auto}",
    ".bj-gioc.attivo svg{filter:drop-shadow(0 0 7px rgba(255,212,94,.95))}",
    ".bj-prosp{position:absolute;inset:0;perspective-origin:50% -10%;z-index:2;pointer-events:none}",
    ".bj-piano{position:absolute;left:50%;bottom:-6px;transform-origin:50% 100%;transform:rotateX(58deg);transform-style:preserve-3d;border-radius:26px 26px 50% 50%/26px 26px 30% 30%;background:linear-gradient(#7a4724,#4a2a14);padding:13px;box-shadow:0 -6px 0 #8a562c inset}",
    ".bj-panno{position:relative;width:100%;height:100%;border-radius:16px 16px 50% 50%/16px 16px 30% 30%;background:radial-gradient(90% 80% at 50% 30%,#1f8a52,#127043 60%,#0b5431);box-shadow:inset 0 0 26px rgba(0,0,0,.45);transform-style:preserve-3d}",
    ".bj-panno::after{content:'BLACK JACK PAGA 3 A 2';position:absolute;left:0;right:0;top:66%;text-align:center;font-weight:800;font-size:13px;letter-spacing:3px;color:rgba(255,215,120,.42)}",
    ".bj-segno{position:absolute;width:100px;height:2px;margin:-1px 0 0 -50px}",
    ".bj-pila{position:absolute;transform:translate(-50%,-50%);transform-style:preserve-3d}",
    ".bj-fiche{position:absolute;inset:0;border-radius:50%;border:3px dashed rgba(255,255,255,.85);box-shadow:inset 0 0 0 2px rgba(0,0,0,.25),0 1px 0 rgba(0,0,0,.55)}",
    ".bj-cc{position:absolute;transform:translate(-50%,-50%);display:flex;gap:3px;transform-style:preserve-3d}",
    ".bj-cc .cc{flex:0 0 auto;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}",
    ".bj-cc .cc.arriva{animation:bjArriva .5s cubic-bezier(.2,.85,.3,1)}",
    "@keyframes bjArriva{from{transform:translate3d(0,150px,90px) scale(.8);opacity:.2}to{transform:none;opacity:1}}",
    ".bj-sopra{position:absolute;inset:0;z-index:3;pointer-events:none}",
    ".bj-etich{position:absolute;transform:translateX(-50%);display:flex;align-items:center;gap:4px;background:rgba(10,18,50,.84);border:2px solid rgba(255,255,255,.16);border-radius:999px;padding:1px 7px;white-space:nowrap;font-size:.7rem;font-weight:800}",
    ".bj-etich .nm{max-width:72px;overflow:hidden;text-overflow:ellipsis}",
    ".bj-etich .bj-badge{margin:0;font-size:.66rem;padding:0 5px}",
    ".bj-etich.attivo{border-color:#ffd45e;box-shadow:0 0 10px rgba(255,212,94,.6)}",
    ".bj-etich.mini{font-size:.6rem;padding:0 5px}.bj-etich.mini .nm{max-width:42px}",
    ".bj-delta{position:absolute;transform:translate(-50%,-100%);font-weight:900;font-size:.95rem;text-shadow:0 2px 6px rgba(0,0,0,.8);animation:bjDelta .6s ease}",
    ".bj-delta.piu{color:#7dffa8}.bj-delta.meno{color:#ff9d8a}",
    "@keyframes bjDelta{from{opacity:0;margin-top:12px}to{opacity:1;margin-top:0}}",
    ".bj-bolla-pos{position:absolute;width:0;height:0}.bj-bolla-pos .bj-bolla{top:auto;bottom:2px}",
    ".bj-matt{position:absolute;left:8px;bottom:8px;display:flex;flex-direction:column;align-items:center}",
    ".bj-matt-nome{margin-top:-8px;position:relative;background:rgba(10,18,50,.9);border:2px solid rgba(255,255,255,.16);border-radius:10px;padding:1px 8px;font-size:.7rem;font-weight:800;white-space:nowrap}",
    ".bj-matt.turno .bj-av,.bj-matt.turno .bj-matt-nome{border-color:#ffd45e}",
    ".bj-fum{position:absolute;left:72px;bottom:60px;z-index:6;max-width:150px;background:#fff;color:#12233a;font-weight:900;border-radius:13px;padding:5px 10px;font-size:.8rem;line-height:1.15;box-shadow:0 4px 12px rgba(0,0,0,.4);transform-origin:0 100%;animation:bjFum .26s cubic-bezier(.3,1.6,.5,1)}",
    ".bj-fum::after{content:'';position:absolute;left:-6px;bottom:6px;border:7px solid transparent;border-right-color:#fff;border-left:0}",
    ".bj-fum.oro{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400}.bj-fum.oro::after{border-right-color:#ffc21a}",
    "@keyframes bjFum{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}",
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
    ".bj-turno{position:absolute;left:50%;top:10px;transform:translateX(-50%);text-align:center;font-weight:900;font-size:1.25rem;color:#ffe066;text-shadow:0 2px 10px rgba(0,0,0,.7),0 0 18px rgba(255,200,60,.35);white-space:nowrap;max-width:78%;overflow:hidden;text-overflow:ellipsis;line-height:1.1}",
    ".bj-turno small{display:block;font-size:.72rem;color:#ffe58a;opacity:.85;font-weight:800}",
    // sotto: tasti ai lati delle carte
    ".bj-hriga{display:flex;align-items:center;gap:8px;width:100%}",
    ".bj-col{flex:0 0 26%;display:flex;flex-direction:column;gap:8px}",
    ".bj-col .bj-btn{flex:none;width:100%;min-height:54px;font-size:.92rem}",
    ".bj-hcentro{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center}",
    ".bj-hcarte{flex-wrap:nowrap}.bj-hcarte .cc{flex:none}",
    ".bj-col{flex:0 0 24%}",
    ".bj-esiti{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 12px;font-size:.78rem;color:#ffe58a;max-height:62px;overflow:hidden}.bj-esiti b{color:#fff}",
    // IL BLACK JACK OCCUPA ESATTAMENTE LO SCHERMO: niente da scorrere; sotto altezza fissa, il tavolo prende il resto
    ".bj-wrap{position:fixed;top:0;bottom:0;left:0;right:0;max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:6px;padding:6px 6px calc(6px + env(safe-area-inset-bottom));z-index:5;border-radius:0}",
    ".bj-sala{flex:1 1 auto;min-height:0;margin:0}",
    ".bj-hero{flex:0 0 196px;height:196px;min-height:0;justify-content:center;overflow:hidden}",
    ".bj-msg:empty,.bj-wrap .bj-tavolata{display:none}"
  ].join("");

  function iniettaCSS() {
    if (document.getElementById("bj-css")) return;
    var st = document.createElement("style"); st.id = "bj-css"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---- suoni (Web Audio) + vibrazione ----
  // ---------- avatar: Matt il dealer + i giocatori ai loro posti ----------
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

  function fmtTempo(ms) {
    var s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? (h + "h " + m + "m") : (m > 0 ? (m + "m") : "poco");
  }
  // riquadro con saldo fiches + tasto per ritirare il bonus gratis (ogni 2 ore)
  function riquadroBonus(el) {
    var box = el("div", { style: "background:var(--carta,#1b1836);border-radius:14px;padding:12px;margin-bottom:12px;text-align:center;box-shadow:var(--ombra,0 6px 16px rgba(0,0,0,.3))" });
    var p = SGNube.profilo();
    var saldo = (p && p.fiches && p.fiches.blackjack != null) ? p.fiches.blackjack : 0;
    var testoSaldo = el("div", { style: "font-size:1.1rem;margin-bottom:8px;color:#ffe58a;font-weight:800", html: "🎰 Hai <b>" + saldo + "</b> fiches" });
    var b = el("button", { class: "btn btn-primario", style: "margin:0" });
    function agg() {
      if (SGNube.puoRitirareBonus()) { b.disabled = false; b.textContent = "🎁 Ritira " + SGNube.bonusImporto + " fiches gratis"; }
      else { b.disabled = true; b.textContent = "⏳ Prossimo bonus tra " + fmtTempo(SGNube.prossimoBonusMs()); }
    }
    b.onclick = function () {
      b.disabled = true;
      SGNube.ritiraBonus().then(function (nuovo) {
        testoSaldo.innerHTML = "🎰 Hai <b>" + nuovo + "</b> fiches  ·  +" + SGNube.bonusImporto + " 🎉";
        agg();
      }).catch(function () { agg(); });
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
    if (!g || !(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
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
  function vistaBJ(st) {
    return {
      fase: st.fase, giro: st.giro, rimescolato: st.rimescolato, turno: st.turno,
      annuncio: st.annuncio ? { seat: st.annuncio.seat, testo: st.annuncio.testo, id: st.annuncio.id } : null,
      puntateRapide: BJ.PUNTATE_RAPIDE, puntataMin: BJ.PUNTATA_MIN,
      banco: st.banco.carte.map(cp),
      giocatori: st.giocatori.map(function (g) {
        return { id: g.id, nome: g.nome, fiches: g.fiches, puntata: g.puntata, assicura: g.assicura, attiva: g.attiva,
          mani: g.mani.map(function (m) { return { carte: m.carte.map(cp), chiusa: m.chiusa, esito: m.esito, vincita: m.vincita, puntata: m.puntata }; }) };
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
      titolo: "🃏 Black Jack", sotto: drv.sotto || "Banco: Matt",
      indietro: function () { if (window.confirm("Uscire dal tavolo?")) { document.body.classList.remove("bj-verde"); drv.onEsci(); } }
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
    mazzo.style.visibility = "hidden";   // il mazzo non si vede (spazio al tavolo): le carte partono da Matt
    s._contenuto.appendChild(wrap); t.mostra(s);
    document.body.classList.add("bj-verde");
    // se lo schermo cambia misura (barre del telefono, rotazione) il tavolo si ridisegna sulla misura nuova
    window.addEventListener("resize", function () { if (vm && document.body.contains(wrap)) disegnaScena(); });

    var vm = null, anim = { ultima: -1, banco: false }, timerPasso = null, daVolare = [], puntSel = null;
    var bolla = null, bollaId = -1, bollaTimer = null;   // nuvoletta della mossa
    function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }
    function mioIdx() { return drv.mioIdx ? drv.mioIdx() : vm.turno; }

    function aggiorna(nuovo) {
      var pre = vm; vm = nuovo;
      if (vm.fase !== "punta") puntSel = null;
      anim = { ultima: -1, banco: false }; daVolare = [];
      applicaDiff(pre, vm);
      if (vm.annuncio && vm.annuncio.id !== bollaId) {   // nuova mossa: mostra la nuvoletta ~2,2s
        bollaId = vm.annuncio.id; bolla = { seat: vm.annuncio.seat, testo: vm.annuncio.testo };
        if (bollaTimer) clearTimeout(bollaTimer);
        bollaTimer = setTimeout(function () { bolla = null; disegnaTavolata(); }, 2200);
      }
      if (pre && pre.fase !== "esito" && vm.fase === "esito" && drv.onFineMano) drv.onFineMano(vm);
      disegnaScena(); disegnaHero();
      daVolare.forEach(volaDalMazzo);
      programmaPasso();
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
    // Chi guida il motore (locale/host) scandisce i tempi con calma: distribuzione
    // e banco una carta alla volta, e dopo che una mano si chiude lascia qualche
    // secondo per vedere la carta prima di passare il turno.
    function programmaPasso() {
      if (timerPasso) { clearTimeout(timerPasso); timerPasso = null; }
      if (!(drv.guida && drv.guida())) return;
      if (vm.fase === "distrib") timerPasso = setTimeout(function () { drv.onPasso("distrib"); }, 1050);
      else if (vm.fase === "banco") timerPasso = setTimeout(function () { drv.onPasso("banco"); }, 1200);
      else if (manoChiusaAttiva()) {
        var g = vm.giocatori[vm.turno], m = g.mani[g.attiva], p = BJ.punteggio(m.carte);
        var pausa = p > 21 ? 1800 : (BJ.eBlackjack(m.carte) ? 1600 : 1200);
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

    // ---- la sala: la telecamera è dietro Matt, i giocatori seduti attorno al tavolo a mezzaluna ----
    var FICHE = [[250, "#7b3fe4"], [50, "#26262b"], [10, "#1c7ed6"]];
    function pilaFiche(importo) {   // i colori delle fiche della puntata, dal basso verso l'alto
      var out = [];
      FICHE.forEach(function (f) { while (importo >= f[0] && out.length < 14) { out.push(f[1]); importo -= f[0]; } });
      return out;
    }
    function puntataDi(g) { return g.mani && g.mani.length ? g.mani.reduce(function (s, m) { return s + m.puntata; }, 0) : (g.puntata || 0); }
    function nettoDi(g) { var n = 0; g.mani.forEach(function (m) { n += m.vincita - m.puntata; }); return n; }
    function facciaDi(g, idx) {
      var m = g.mani[g.attiva] || g.mani[0];
      if (vm.fase === "esito") { var n = nettoDi(g); return n > 0 ? "esulta" : (n < 0 ? "triste" : "normale"); }
      if (m && BJ.punteggio(m.carte) > 21) return "triste";
      if (m && BJ.eBlackjack(m.carte)) return "esulta";
      if ((vm.fase === "gioca" || vm.fase === "punta" || vm.fase === "assic") && idx === vm.turno) return "pensa";
      return "normale";
    }
    function faccinaMatt() {
      var pB = vm.banco.length ? BJ.punteggio(vm.banco) : 0, r = { faccia: "normale", fum: null, oro: false };
      if (vm.fase === "punta") r.fum = "Fate il vostro gioco!";
      else if (vm.fase === "banco") r.faccia = pB > 21 ? "triste" : "pensa";
      else if (vm.fase === "esito") {
        var netto = 0; vm.giocatori.forEach(function (g) { netto += nettoDi(g); });
        if (pB > 21) { r.faccia = "triste"; r.fum = "Sballato! 😵"; }
        else if (BJ.eBlackjack(vm.banco)) { r.faccia = "esulta"; r.fum = "Black Jack! 😎"; r.oro = true; }
        else if (netto < 0) { r.faccia = "esulta"; r.fum = "Il banco vince 😎"; }
        else if (netto > 0) { r.faccia = "triste"; r.fum = "Complimenti! 👏"; }
      }
      return r;
    }
    function carteSulPanno(carte, cw, nuova, coperta) {
      var box = el("div", { class: "bj-cc" });
      carte.forEach(function (c, i) {
        var card = cartaEl(el, c, coperta === i, "cc");
        card.style.width = cw + "px";
        if (nuova && i === carte.length - 1) card.classList.add("arriva");
        box.appendChild(card);
      });
      return box;
    }
    function disegnaScena() {
      svuota(zBanco); zTav.hidden = true;
      var W = zBanco.clientWidth || (Math.min(560, window.innerWidth || 375) - 16);
      var H = zBanco.clientHeight || Math.max(300, (window.innerHeight || 700) - 230);   // il tavolo prende tutto lo schermo che resta sopra la parte fissa di sotto
      mazzo.style.top = Math.round(H * 0.74) + "px"; mazzo.style.left = "calc(50% - 22px)"; mazzo.style.right = "auto";
      var N = vm.giocatori.length, inTurno = (vm.fase === "punta" || vm.fase === "assic" || vm.fase === "gioca");
      var PW = Math.round(W * 1.3), PH = Math.round(H * 0.97);   // largo: in prospettiva il lato in fondo arriva quasi da bordo a bordo
      var cx = PW / 2, cy = PH, rx = PW / 2 - 18, ry = PH - 18;
      var strato = el("div", { class: "bj-pl" });   // i giocatori, dietro al tavolo
      var prosp = el("div", { class: "bj-prosp", style: "perspective:" + Math.round(H * 1.8) + "px" });
      var piano = el("div", { class: "bj-piano", style: "width:" + PW + "px;height:" + PH + "px;margin-left:" + (-PW / 2) + "px" });
      var panno = el("div", { class: "bj-panno" });
      var sopra = el("div", { class: "bj-sopra" });   // nomi e punteggi, sopra al tavolo
      piano.appendChild(panno); prosp.appendChild(piano);
      [strato, prosp, sopra].forEach(function (z) { zBanco.appendChild(z); });
      function sulPanno(x, y, nodo) { nodo.style.left = Math.round(x) + "px"; nodo.style.top = Math.round(y) + "px"; panno.appendChild(nodo); return nodo; }
      // i giocatori siedono sul lato LUNGO del tavolo (quello in fondo), in fila per tutta la larghezza; in tanti: due file sfalsate
      // tutti sul lato lungo in fondo; da 6 in su due file sfalsate (una sì e una no un po' più indietro e più in alto)
      var DUE = N > 5, PWi = PW - 26, PHi = PH - 13, fondoL = PWi * 0.8;
      var passo = N === 1 ? 0 : Math.min(PWi * 0.24, (DUE ? fondoL : PWi * 0.72) / (N - 1));
      function posto(idx) {
        var xf = PWi / 2 + (idx - (N - 1) / 2) * passo, dietro = DUE && idx % 2 === 1;
        return { bordo: [xf, 4], pf: [xf, PHi * (dietro ? 0.25 : 0.13)], pc: [xf, PHi * (dietro ? 0.41 : 0.29)] };
      }
      var cw = N === 1 ? 60 : (N <= 2 ? 48 : (N <= 4 ? 32 : (N <= 7 ? 26 : 22))), fd = N === 1 ? 44 : (N <= 3 ? 36 : (N <= 6 ? 28 : 22));
      var segni = vm.giocatori.map(function (g, idx) {
        var ps = posto(idx), bordo = ps.bordo, pf = ps.pf, pc = ps.pc;
        var segno = sulPanno(bordo[0], bordo[1], el("div", { class: "bj-segno" }));
        // la pila di fiche puntate, davanti al posto
        var colori = pilaFiche(vm.fase === "esito" ? g.mani.reduce(function (s, m) { return s + (m.vincita || 0); }, 0) : puntataDi(g));   // a fine mano: chi perde resta senza, chi vince vede la vincita
        if (colori.length) {
          var pila = el("div", { class: "bj-pila", style: "width:" + fd + "px;height:" + fd + "px" });
          colori.forEach(function (col, i) { pila.appendChild(el("div", { class: "bj-fiche", style: "background-color:" + col + ";transform:translateZ(" + (i * 2.6) + "px)" })); });
          sulPanno(pf[0], pf[1], pila);
        }
        // le carte, posate tra le fiche e il banco
        var carte = []; g.mani.forEach(function (m) { carte = carte.concat(m.carte); });
        var gruppo = carte.length ? sulPanno(pc[0], pc[1], carteSulPanno(carte, cw, anim.ultima === idx, -1)) : null;
        return { idx: idx, g: g, segno: segno, gruppo: gruppo };
      });
      // le carte di Matt, vicino a noi (siamo dietro di lui)
      var mostraTutto = (vm.fase === "banco" || vm.fase === "esito");
      if (vm.banco.length) sulPanno(cx, PH * 0.8, carteSulPanno(vm.banco, Math.round(Math.max(46, Math.min(66, H / 9))), anim.banco, mostraTutto ? -1 : 1));
      // Matt: la sua faccia in basso a sinistra, con il fumetto
      var fm = faccinaMatt(), pB = vm.banco.length ? (mostraTutto ? BJ.punteggio(vm.banco) : BJ.valoreCarta(vm.banco[0].v)) : null;
      var matt = el("div", { class: "bj-matt" + (vm.fase === "banco" ? " turno" : "") });
      if (window.SGOmino) matt.appendChild(el("div", { class: "bj-av", style: "width:58px;height:58px;margin:0", html: svgAvatar(MATT_DEALER, fm.faccia, { busto: true }) }));
      matt.appendChild(el("div", { class: "bj-matt-nome", text: "🎩 Matt" + (pB != null ? " · " + (mostraTutto ? pB + (BJ.eBlackjack(vm.banco) ? " BJ" : "") : pB + " +?") : "") }));
      sopra.appendChild(matt);
      if (fm.fum) sopra.appendChild(el("div", { class: "bj-fum" + (fm.oro ? " oro" : ""), text: fm.fum }));
      // in grande sulla parete: chi sta giocando (così sotto non serve scriverlo)
      var gt = vm.giocatori[vm.turno], scritta = null, sotto = null;
      if (vm.fase === "distrib") scritta = "Matt distribuisce…";
      else if (vm.fase === "banco") scritta = "Tocca a Matt 🎩";
      else if (vm.fase === "esito") scritta = "Fine mano";
      else if (gt) { scritta = (vm.fase === "punta" ? "Punta " : (vm.fase === "assic" ? "Assicura? " : "Tocca a ")) + gt.nome; sotto = gt.fiches + " 🪙"; }
      if (scritta) sopra.appendChild(el("div", { class: "bj-turno" }, [ el("div", { text: scritta }), sotto ? el("small", { text: sotto }) : null ]));
      // ora che il tavolo è in prospettiva, siedo ognuno dietro al suo posto (più lontano = più piccolo)
      var base = (N === 1 ? 190 : (N === 2 ? 165 : (N <= 4 ? 132 : (N <= 6 ? 108 : (N <= 8 ? 90 : 78))))) * Math.max(1, Math.min(1.4, H / 340)) * 1.2;
      var zr = zBanco.getBoundingClientRect();
      // distanza tra un posto e l'altro sullo schermo: nessuno è più largo di così (si toccano appena, non si coprono)
      // distanza sullo schermo dal vicino più vicino: nessuno è più largo di così (si toccano appena, non si coprono)
      var centri = segni.map(function (sg) { var r = sg.segno.getBoundingClientRect(); return [r.left + r.width / 2, r.top]; });
      function spazioDi(i) {
        var d = 999;
        (DUE ? [i - 2, i + 2] : [i - 1, i + 1]).forEach(function (j) {   // in due file il vicino vero è due posti più in là
 if (j >= 0 && j < N) d = Math.min(d, Math.hypot(centri[j][0] - centri[i][0], centri[j][1] - centri[i][1])); });
        return d;
      }
      segni.forEach(function (sg) {
        var r = sg.segno.getBoundingClientRect();
        var sc = Math.max(0.7, Math.min(1.35, r.width / 100));
        var x = r.left + r.width / 2 - zr.left, y = r.top + r.height / 2 - zr.top;
        var w = Math.round(Math.min(base * sc, spazioDi(sg.idx) * 1.2));
        if (DUE && sg.idx % 2 === 1) { w = Math.round(w * 0.92); y -= Math.round(w * 0.42); }   // fila dietro: un po' più in alto, spunta sopra le spalle
        var testa = Math.round(y - w * 0.9);
        var cima = N === 1 ? 64 : 52;   // in alto c'è la scritta del turno: nessuna testa ci va sopra
        if (testa - (N === 1 ? 0 : 14) < cima) { w = Math.max(40, Math.round((y - cima - (N === 1 ? 0 : 14)) / 0.9)); testa = Math.round(y - w * 0.9); }
        var attivo = inTurno && sg.idx === vm.turno;
        var cfg = avatarDi(sg.idx);
        if (cfg) strato.appendChild(el("div", { class: "bj-gioc" + (attivo ? " attivo" : ""),
          style: "left:" + Math.round(x - w / 2) + "px;top:" + testa + "px;width:" + w + "px;z-index:" + Math.round(y),
          html: svgAvatar(cfg, facciaDi(sg.g, sg.idx)) }));
        // il nome sopra la testa (a fine mano: quanto ha vinto o perso)
        var g = sg.g, m = g.mani[g.attiva] || g.mani[0], n = vm.fase === "esito" ? nettoDi(g) : 0;
        var nome = el("div", { class: "bj-nome" + (attivo ? " attivo" : "") + (N > 4 ? " mini" : ""), style: "left:" + Math.round(x) + "px;top:" + Math.max(14, testa + Math.round(w * 0.06)) + "px" }, [
          el("span", { text: g.nome + (drv.mioIdx && sg.idx === mioIdx() && N > 1 ? " ⭐" : "") }),
          n ? el("b", { class: n > 0 ? "piu" : "meno", text: " " + (n > 0 ? "+" : "−") + Math.abs(n) }) : null ]);
        if (N > 1) sopra.appendChild(nome);   // da soli il nome lo dice già la scritta grande
        // il punteggio scritto accanto alle sue carte sul tavolo
        if (sg.gruppo && m && m.carte.length) {
          var rc = sg.gruppo.getBoundingClientRect(), pm = BJ.punteggio(m.carte);
          sopra.appendChild(el("div", { class: "bj-badge bj-punti " + (m.esito === "vince" || m.esito === "blackjack" ? "win" : (pm > 21 ? "bust" : "")) + (N > 6 ? " mini" : ""),
            style: "left:" + Math.round(rc.right - zr.left + 2) + "px;top:" + Math.round(rc.top + rc.height / 2 - zr.top) + "px",
            text: vm.fase === "esito" && m.esito ? etichettaEsito(m) : BJ.testo(m.carte) }));
        }
        if (bolla && sg.idx === bolla.seat) sopra.appendChild(el("div", { class: "bj-bolla-pos", style: "left:" + Math.round(x) + "px;top:" + Math.max(30, testa - 14) + "px" }, [ el("div", { class: "bj-bolla", text: bolla.testo }) ]));
      });
    }
    function disegnaBanco() { disegnaScena(); }
    function disegnaTavolata() { disegnaScena(); }
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

    function disegnaHero() {
      svuota(zHero);
      var mio = drv.puoAgire(vm);
      if (vm.fase === "distrib") return heroInfo("🂠", "Il mazziere distribuisce…");
      if (vm.fase === "punta") return heroPunta(mio);
      if (vm.fase === "assic") return heroAssic(mio);
      if (vm.fase === "banco") return heroInfo("🎴", "Gioca il banco…");
      if (vm.fase === "gioca") return heroGioca(mio);
      if (vm.fase === "esito") return heroEsito();
    }
    // nome di chi gioca, con la sua faccia accanto quando al tavolo siete in più d'uno
    function heroNome(idx, txt) {
      var nome = el("div", { class: "bj-hnome", text: txt });
      var av = vm.giocatori.length > 1 ? bustoEl(idx, 44) : null;
      if (av) av.style.margin = "0";
      return av ? el("div", { class: "bj-hchi" }, [av, nome]) : nome;
    }
    function heroInfo(ico, txt) {
      zHero.appendChild(el("div", { style: "font-size:2.6rem;line-height:1", text: ico }));
      zHero.appendChild(el("div", { class: "bj-hnome", text: txt }));
    }
    // chi gioca e quante fiche ha lo dice la scritta grande sulla parete: qui sotto solo carte e tasti
    function heroPunta(mio) {
      var g = vm.giocatori[vm.turno];
      if (!mio) { zHero.appendChild(el("div", { class: "bj-hfiches", text: "sta puntando…" })); return; }
      var minP = vm.puntataMin || 10, maxP = g.fiches;
      if (puntSel == null) puntSel = Math.min(100, maxP);
      puntSel = Math.max(minP, Math.min(puntSel, maxP));
      var val = el("div", { class: "bj-punta-val", text: puntSel + " 🪙" });
      zHero.appendChild(val);
      var bPunta;
      function agg() {
        puntSel = Math.max(minP, Math.min(puntSel, maxP));
        val.textContent = puntSel + " 🪙";
        if (bPunta) bPunta.textContent = "Punta " + puntSel + " ▶";
      }
      function step(d) { return function () { puntSel += d; agg(); vibra(6); }; }
      var riga = el("div", { class: "bj-step" });
      [["−100", -100], ["−10", -10], ["+10", 10], ["+100", 100]].forEach(function (x) {
        riga.appendChild(el("button", { class: "bj-sbtn", text: x[0], onclick: step(x[1]) }));
      });
      zHero.appendChild(riga);
      var az = el("div", { class: "bj-azioni" });
      bPunta = el("button", { class: "bj-btn bj-b-carta", text: "Punta " + puntSel + " ▶", onclick: function () { var v = puntSel; puntSel = null; suonoChip(); drv.onPunta(v); } });
      az.appendChild(bPunta);
      az.appendChild(el("button", { class: "bj-btn bj-b-stai", text: "Tutto (" + maxP + ")", onclick: function () { puntSel = null; suonoChip(); drv.onPunta(maxP); } }));
      zHero.appendChild(az);
    }
    function heroAssic(mio) {
      var g = vm.giocatori[vm.turno], costo = Math.floor(g.puntata / 2);
      if (mio) zHero.appendChild(el("div", { class: "bj-hfiches", text: "Il banco mostra un Asso: assicuri per " + costo + " 🪙? (paga 2 a 1)" }));
      heroCarte(g);
      if (!mio) return;
      var az = el("div", { class: "bj-azioni" });
      az.appendChild(el("button", { class: "bj-btn bj-b-si", text: "Assicuro", onclick: function () { drv.onAssicura(true); } }));
      az.appendChild(el("button", { class: "bj-btn bj-b-no", text: "No", onclick: function () { drv.onAssicura(false); } }));
      zHero.appendChild(az);
    }
    function heroCarte(g, dove) {
      var gi = vm.giocatori.indexOf(g);
      var box = el("div", { class: "bj-mani" });
      g.mani.forEach(function (m, i) {
        var mano = el("div", { class: "bj-mano" + (i === g.attiva && vm.fase === "gioca" && g.mani.length > 1 ? " attiva" : "") });
        var cc = el("div", { class: "bj-hcarte" });
        // carte grandi finché ci stanno: la larghezza si calcola sullo spazio vero, così non finiscono sopra i tasti
        var spazio = (Math.min(560, window.innerWidth || 375) - 12) * (dove ? 0.44 : 0.62) / g.mani.length - 12;
        var n = m.carte.length, w = Math.max(30, Math.min(80, Math.floor((spazio - (n - 1) * 6) / n)));
        m.carte.forEach(function (c, ci) {
          var isUlt = (i === g.attiva && ci === m.carte.length - 1);
          var card = cartaEl(el, c, false, "");
          card.style.width = w + "px";
          if (anim.ultima === gi && isUlt) daVolare.push(card);
          cc.appendChild(card);
        });
        mano.appendChild(cc);
        var pm = BJ.punteggio(m.carte);
        mano.appendChild(el("div", { class: "bj-pt " + (pm > 21 ? "bust" : (m.esito === "vince" || m.esito === "blackjack" ? "win" : "")), style: "display:block;margin:6px auto 0;width:fit-content", text: BJ.testo(m.carte) + " · " + m.puntata + "🪙" }));
        box.appendChild(mano);
      });
      (dove || zHero).appendChild(box);
    }
    function heroGioca(mio) {
      var g = vm.giocatori[vm.turno];
      var centro = el("div", { class: "bj-hcentro" });
      heroCarte(g, centro);
      var ma = g.mani[g.attiva];
      if (ma && ma.chiusa) {   // mano finita: resta a schermo un attimo prima di passare
        var pm = BJ.punteggio(ma.carte);
        centro.appendChild(el("div", { class: "bj-hnome", style: "margin-top:2px;color:" + (pm > 21 ? "#ff9d8a" : "#9fe6b4"),
          text: pm > 21 ? ("Sballato! " + pm) : (BJ.eBlackjack(ma.carte) ? "Black Jack! 🎉" : "Fermo a " + pm) }));
      }
      if (!mio || (ma && ma.chiusa)) { zHero.appendChild(centro); return; }
      // tasti ai lati delle carte: a sinistra Dividi e Raddoppia, a destra Stai e Carta
      var v = mosseValideVm(vm);
      function b(txt, cls, on, mv) { var x = el("button", { class: "bj-btn " + cls, text: txt, onclick: function () { drv.onMossa(mv); } }); if (!on) x.disabled = true; return x; }
      var sx = el("div", { class: "bj-col" }, [ b("Dividi", "bj-b-dividi", v.dividi, "dividi"), b("Raddoppia", "bj-b-radd", v.raddoppia, "raddoppia") ]);
      var dx = el("div", { class: "bj-col" }, [ b("Stai", "bj-b-stai", true, "stai"), b("Carta", "bj-b-carta", true, "carta") ]);
      zHero.appendChild(el("div", { class: "bj-hriga" }, [sx, centro, dx]));
    }
    function heroEsito() {
      // chi ha vinto o perso si vede già sul tavolo (+/− sopra le teste): qui solo le fiche e il tasto
      var riga = el("div", { class: "bj-esiti" });
      vm.giocatori.forEach(function (g) { riga.appendChild(el("span", {}, [ el("b", { text: g.nome }), " " + g.fiches + " 🪙" ])); });
      zHero.appendChild(riga);
      if (vm.rimescolato) zHero.appendChild(el("div", { class: "bj-hfiches", text: "🔀 Sabot rimescolato" }));
      if (drv.puoNuova && drv.puoNuova()) {
        var az = el("div", { class: "bj-azioni" });
        az.appendChild(el("button", { class: "bj-btn bj-b-carta", text: "Nuova mano ▶", onclick: function () { drv.onNuova(); } }));
        zHero.appendChild(az);
      } else zHero.appendChild(el("div", { class: "bj-hfiches", text: "In attesa dell'host per la mano nuova…" }));
    }

    return { aggiorna: aggiorna };
  }

  // ---------- MODALITÀ "UN TELEFONO SOLO" ----------
  function localeBJ(t) {
    nuovaSessioneBJ();
    var nomi = (t.giocatori && t.giocatori.length) ? t.giocatori.slice() : ["Giocatore 1"];
    // se c'è un profilo cloud, il primo giocatore usa (e salva) le sue fiches
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var fichesIniz = null, prova = false;
    if (prof) {
      var f = SGNube.fiches("blackjack");
      if (f != null && f >= BJ.PUNTATA_MIN) { fichesIniz = [f]; }
      else { prova = true; fichesIniz = [BJ.FICHES_INIZIALI]; }   // a zero: gioca di prova, non si salva
    }
    var M = BJ.creaMotore(nomi, t.mischia, fichesIniz), st = M.st, tav;
    var avatari = nomi.map(function (n, i) { return i === 0 ? mioAvatar(n) : null; });   // gli altri: faccia fissa legata al nome
    function salva() { if (prof && !prova) SGNube.salvaFiches("blackjack", st.giocatori[0].fiches); }
    function refresh() { tav.aggiorna(vistaBJ(st)); }
    tav = tavoloBJ(t, {
      avatari: function () { return avatari; },
      sotto: prof ? (prova ? ("👤 " + prof.nome + " · prova · ritira il bonus!") : ("👤 " + prof.nome + " · fiches salvate")) : "Un telefono · Banco: Matt",
      puoAgire: function () { return true; },
      puoNuova: function () { return true; },
      guida: function () { return true; },
      onPasso: function (k) { if (k === "distrib") M.passoDistribuzione(); else if (k === "banco") M.passoBanco(); else if (k === "avanza") M.avanza(); refresh(); },
      onPunta: function (v) { suonoChip(); M.punta(st.turno, v); refresh(); },
      onMossa: function (m) { if (m === "stai") suonoStai(); M.azione(m); refresh(); },
      onAssicura: function (si) { M.assicura(st.turno, si); refresh(); },
      onFineMano: function (v) { if (prof && !prova) salvaFineMano(v.giocatori[0], v); },
      onNuova: function () { M.nuovaMano(); refresh(); },
      onEsci: function () { salva(); t.esci(); }
    });
    M.nuovaMano(); refresh();
  }

  // ---------- MODALITÀ ONLINE ----------
  function renderLobbyBJ(t, info, cb) {
    iniettaCSS();
    var el = t.el;
    var s = t.schermata({ icona: "🃏", titolo: "Black Jack online",
      sotto: info.sonoHost ? "Sei l'host · gestisci il banco" : ("Stanza " + (info.codice || "").toUpperCase()),
      indietro: function () { document.body.classList.remove("bj-verde"); cb.onEsci(); } });
    if (info.sonoHost) {
      s._contenuto.appendChild(el("div", { class: "link-avviso", html: "Codice: <b style='font-size:1.4rem;letter-spacing:2px'>" + (info.codice || "…") + "</b><br>Manda il codice o il link: gli amici entrano dal loro telefono." }));
      s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare", onclick: function () { try { navigator.clipboard.writeText(SG.creaLink({ gioco: "blackjack", stanza: info.codice })); } catch (e) {} } }));
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Al tavolo (" + info.giocatori.length + ")" }));
    info.giocatori.forEach(function (g, i) {
      s._contenuto.appendChild(el("div", { class: "as-bid" }, [ el("div", { class: "who" }, [ el("b", { text: g.nome + (i === 0 ? " · host" : "") }) ]) ]));
    });
    if (info.sonoHost) {
      var b = el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: cb.onComincia });
      s._piede.appendChild(b);
    } else s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa che l'host cominci la partita…" }));
    t.mostra(s);
  }

  function hostBJ(t) {
    nuovaSessioneBJ();
    if (!(window.SGNet && SGNet.disponibile())) return localeBJ(t);
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var provaHost = false, mieFiches = prof ? SGNube.fiches("blackjack") : null;
    if (prof && (mieFiches == null || mieFiches < BJ.PUNTATA_MIN)) { provaHost = true; mieFiches = BJ.FICHES_INIZIALI; }
    var seats = [{ id: "host", nome: (prof ? prof.nome : (t.giocatori && t.giocatori[0])) || "Host", fiches: mieFiches }];
    seats[0].omino = mioAvatar(seats[0].nome);
    var M = null, rete = null, codice = "…", tav = null;

    function nomiSeat() { return seats.map(function (x) { return x.nome; }); }
    function seatDiId(id) { for (var i = 0; i < seats.length; i++) if (seats[i].id === id) return i; return -1; }
    function bcast() {
      if (!M) { lobbyOut(); return; }
      var vm = vistaBJ(M.st);
      if (rete) rete.invia({ t: "vm", vm: vm });
      if (tav) tav.aggiorna(vm);
    }
    function lobbyOut() {
      if (rete) rete.invia({ t: "lobby", codice: codice, giocatori: seats.map(function (x) { return { id: x.id, nome: x.nome, omino: x.omino || null }; }) });
      renderLobbyBJ(t, { sonoHost: true, codice: codice, giocatori: seats }, {
        onComincia: function () { M = BJ.creaMotore(nomiSeat(), t.mischia, seats.map(function (x) { return x.fiches; })); avviaTavoloHost(); M.nuovaMano(); bcast(); },
        onEsci: function () { if (rete) rete.chiudi(); t.esci(); }
      });
    }
    function avviaTavoloHost() {
      tav = tavoloBJ(t, {
        sotto: "Online · sei l'host",
        avatari: function () { return seats.map(function (x) { return x.omino; }); },
        mioIdx: function () { return 0; },
        puoAgire: function (vm) { return vm.turno === 0; },
        puoNuova: function () { return true; },
        guida: function () { return true; },
        onPasso: function (k) { if (k === "distrib") M.passoDistribuzione(); else if (k === "banco") M.passoBanco(); else if (k === "avanza") M.avanza(); bcast(); },
        onPunta: function (v) { if (M.st.turno === 0) { suonoChip(); M.punta(0, v); bcast(); } },
        onMossa: function (m) { if (M.st.turno === 0) { if (m === "stai") suonoStai(); M.azione(m); bcast(); } },
        onAssicura: function (si) { if (M.st.turno === 0) { M.assicura(0, si); bcast(); } },
        onFineMano: function (vm) { if (prof && !provaHost) salvaFineMano(vm.giocatori[0], vm); },
        onNuova: function () { M.nuovaMano(); bcast(); },
        onEsci: function () { if (rete) rete.chiudi(); t.esci(); }
      });
    }
    rete = SGNet.ospita("blackjack", {
      onCodice: function (c) { codice = c; if (!M) lobbyOut(); },
      onConnesso: function () { if (!M) lobbyOut(); },
      onAddio: function (id) { var i = seatDiId(id); if (i > 0) { seats.splice(i, 1); if (!M) lobbyOut(); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (seatDiId(id) < 0 && !M && seats.length < 10) seats.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), fiches: (typeof m.fiches === "number" ? m.fiches : null), omino: avatarValido(m.omino) });
          lobbyOut();
        } else if (M && m.t === "mossa") {
          var seat = seatDiId(id); if (seat < 0 || M.st.turno !== seat) return;
          if (m.kind === "punta") M.punta(seat, m.val);
          else if (m.kind === "azione") M.azione(m.mossa);
          else if (m.kind === "assic") M.assicura(seat, m.si);
          bcast();
        }
      },
      onErrore: function () { localeBJ(t); }
    });
    lobbyOut();
  }

  function ospiteBJ(t, codice) {
    nuovaSessioneBJ();
    if (!(window.SGNet && SGNet.disponibile())) return localeBJ(t);
    var el = t.el, prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var S = { rete: null, nome: "", mioSeat: -1, tav: null, giocatori: [], fiches: null };
    if (prof) {   // già loggato col profilo: entra diretto, niente da riscrivere
      S.nome = prof.nome;
      var ff = SGNube.fiches("blackjack");
      if (ff != null && ff >= BJ.PUNTATA_MIN) { S.fiches = ff; S.prova = false; }
      else { S.fiches = BJ.FICHES_INIZIALI; S.prova = true; }   // a zero: gioca di prova, non salva
      collega();
    } else schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra al tavolo", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      var msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; msg.textContent = "Collegamento in corso…"; collega();
      } }));
      t.mostra(s);
    }
    function assicuraTavolo() {
      if (S.tav) return;
      S.tav = tavoloBJ(t, {
        sotto: "Online",
        avatari: function () { return S.avatari || []; },
        mioIdx: function () { return S.mioSeat; },
        puoAgire: function (vm) { return vm.turno === S.mioSeat; },
        puoNuova: function () { return false; },
        guida: function () { return false; },
        onPasso: function () {},
        onPunta: function (v) { suonoChip(); if (S.rete) S.rete.invia({ t: "mossa", kind: "punta", val: v }); },
        onMossa: function (m) { if (m === "stai") suonoStai(); if (S.rete) S.rete.invia({ t: "mossa", kind: "azione", mossa: m }); },
        onAssicura: function (si) { if (S.rete) S.rete.invia({ t: "mossa", kind: "assic", si: si }); },
        onFineMano: function (vm) { if (prof && !S.prova && S.mioSeat >= 0) salvaFineMano(vm.giocatori[S.mioSeat], vm); },
        onNuova: function () {},
        onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
      });
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.mioId = id; S.rete.invia({ t: "join", nome: S.nome, fiches: S.fiches, omino: mioAvatar(S.nome) }); },
        onMsg: function (m) {
          if (!m) return;
          if (m.t === "lobby") {
            S.mioSeat = (m.giocatori || []).findIndex(function (x) { return x.id === S.mioId; });
            S.avatari = (m.giocatori || []).map(function (x) { return x.omino; });
            if (!S.tav) renderLobbyBJ(t, { sonoHost: false, codice: m.codice, giocatori: m.giocatori }, { onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
          } else if (m.t === "vm") {
            assicuraTavolo();
            S.tav.aggiorna(m.vm);
          }
        },
        onChiuso: function () { erroreBJ(t, "Collegamento perso: l'host potrebbe aver chiuso il tavolo."); },
        onErrore: function () { erroreBJ(t, "Problema di collegamento. Riprova."); }
      });
    }
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
      if (aiuti.torneo) { dove.modo = "locale"; return; }
      if (window.SGNube && SGNube.disponibile() && SGNube.profilo()) box.appendChild(riquadroBonus(el));
      var bLoc, bOnl, nota;
      function sel(m) {
        dove.modo = m;
        bLoc.className = "modo-chip" + (m === "locale" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        nota.hidden = (m !== "online");
      }
      bLoc = el("button", { class: "modo-chip attiva", onclick: function () { sel("locale"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "Appoggiato al tavolo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bLoc, bOnl]));
      nota = el("div", { class: "link-avviso", hidden: "hidden" });
      nota.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri una stanza e manda il codice: gli amici entrano dal loro telefono. Il banco è la CPU dell'host."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato.";
      box.appendChild(nota);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteBJ(t, t.linkParams.stanza);
      var imp = t.impostazioni || {};
      if (imp.modo === "online") return hostBJ(t);
      return localeBJ(t);
    }
  });
})();

