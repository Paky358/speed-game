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
    // il mazzo (sabot) da cui volano le carte, in alto a destra del tavolo
    ".bj-mazzo{position:absolute;top:2px;right:6px;width:44px;height:62px;z-index:4;pointer-events:none}",
    ".bj-mazzo .r{position:absolute;top:0;left:0;width:44px}",
    ".bj-mazzo .r:nth-child(1){transform:translate(5px,5px);opacity:.4}",
    ".bj-mazzo .r:nth-child(2){transform:translate(2.5px,2.5px);opacity:.7}",
    ".bj-mazzo .bj-svg{width:100%;height:auto;filter:drop-shadow(0 2px 5px rgba(0,0,0,.55))}"
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

  function fmtTempo(ms) {
    var s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? (h + "h " + m + "m") : (m > 0 ? (m + "m") : "poco");
  }
  // riquadro con saldo fiches + tasto per ritirare il bonus gratis (ogni 6 ore)
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

  // ---- vista (vm): stessa forma dello stato; serve sia il locale sia
  //      l'online (le carte del Black Jack sono scoperte per tutti). ----
  function cp(c) { return { s: c.s, v: c.v }; }
  function contaCarte(g) { var n = 0; (g.mani || []).forEach(function (m) { n += m.carte.length; }); return n; }
  function vistaBJ(st) {
    return {
      fase: st.fase, giro: st.giro, rimescolato: st.rimescolato, turno: st.turno,
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
      titolo: "🃏 Black Jack", sotto: drv.sotto || "Banco: CPU",
      indietro: function () { if (window.confirm("Uscire dal tavolo?")) { document.body.classList.remove("bj-verde"); drv.onEsci(); } }
    });
    var wrap = el("div", { class: "bj-wrap" });
    var zBanco = el("div", { class: "bj-banco" }), zHero = el("div", { class: "bj-hero" }),
        zMsg = el("div", { class: "bj-msg" }), zTav = el("div", { class: "bj-tavolata" });
    [zBanco, zHero, zMsg, zTav].forEach(function (z) { wrap.appendChild(z); });
    var mazzo = el("div", { class: "bj-mazzo" }, [
      el("div", { class: "r", html: BJ.retroSVG() }),
      el("div", { class: "r", html: BJ.retroSVG() }),
      el("div", { class: "r", html: BJ.retroSVG() })
    ]);
    wrap.appendChild(mazzo);
    s._contenuto.appendChild(wrap); t.mostra(s);
    document.body.classList.add("bj-verde");

    var vm = null, anim = { ultima: -1, banco: false }, timerPasso = null, daVolare = [], puntSel = null;
    function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }
    function mioIdx() { return drv.mioIdx ? drv.mioIdx() : vm.turno; }

    function aggiorna(nuovo) {
      var pre = vm; vm = nuovo;
      if (vm.fase !== "punta") puntSel = null;
      anim = { ultima: -1, banco: false }; daVolare = [];
      applicaDiff(pre, vm);
      if (pre && pre.fase !== "esito" && vm.fase === "esito" && drv.onFineMano) drv.onFineMano(vm);
      disegnaBanco(); disegnaTavolata(); disegnaHero();
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

    function disegnaBanco() {
      svuota(zBanco);
      zBanco.appendChild(el("div", { class: "bj-titoloz", text: "Il Banco" }));
      var riga = el("div", { class: "bj-carte" });
      var mostraTutto = (vm.fase === "banco" || vm.fase === "esito");
      vm.banco.forEach(function (c, i) {
        var coperta = (!mostraTutto && i === 1);
        var card = cartaEl(el, c, coperta, "cc");
        if (anim.banco && i === vm.banco.length - 1) daVolare.push(card);
        riga.appendChild(card);
      });
      if (!vm.banco.length) riga.appendChild(el("div", { style: "color:rgba(255,255,255,.4);font-size:.85rem", text: "—" }));
      zBanco.appendChild(riga);
      if (vm.banco.length) {
        var p = mostraTutto ? BJ.punteggio(vm.banco) : BJ.valoreCarta(vm.banco[0].v);
        zBanco.appendChild(el("div", { class: "bj-pt " + (mostraTutto && p > 21 ? "bust" : ""), text: mostraTutto ? ("" + p + (BJ.eBlackjack(vm.banco) ? " · BJ" : "")) : ("" + p + " +?") }));
      }
    }

    function disegnaTavolata() {
      svuota(zTav);
      var inTurno = (vm.fase === "punta" || vm.fase === "assic" || vm.fase === "gioca");
      vm.giocatori.forEach(function (g, idx) {
        var attivo = inTurno && idx === vm.turno;
        var seat = el("div", { class: "bj-seat" + (attivo ? " attivo" : (inTurno ? " spenta" : "")) });
        seat.appendChild(el("div", { class: "nm", text: g.nome + (idx === mioIdx() ? " (tu)" : "") }));
        seat.appendChild(el("div", { class: "fi", text: g.fiches + " 🪙" }));
        var mano = g.mani[0], fan = el("div", { class: "bj-fan" });
        if (mano && mano.carte.length) {
          var n = mano.carte.length, spread = Math.min(16, 70 / n);
          mano.carte.forEach(function (c, i) {
            var card = cartaEl(el, c, false); card.style.left = (i * spread) + "px"; card.style.zIndex = i;
            if (anim.ultima === idx && i === n - 1) daVolare.push(card);
            fan.appendChild(card);
          });
          fan.style.width = ((n - 1) * spread + 36) + "px";
        } else fan.appendChild(el("div", { style: "color:rgba(255,255,255,.35);font-size:.75rem;margin-top:16px", text: g.puntata ? "…" : "in attesa" }));
        seat.appendChild(fan);
        if (mano && mano.carte.length) {
          var pm = BJ.punteggio(mano.carte), bcls = mano.esito === "vince" || mano.esito === "blackjack" ? "win" : (pm > 21 ? "bust" : "");
          seat.appendChild(el("span", { class: "bj-badge " + bcls, text: vm.fase === "esito" && mano.esito ? etichettaEsito(mano) : BJ.testo(mano.carte) }));
        } else if (g.puntata) seat.appendChild(el("span", { class: "bj-badge", text: g.puntata + "🪙" }));
        zTav.appendChild(seat);
      });
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
    function heroInfo(ico, txt) {
      zHero.appendChild(el("div", { style: "font-size:2.6rem;line-height:1", text: ico }));
      zHero.appendChild(el("div", { class: "bj-hnome", text: txt }));
    }
    function heroPunta(mio) {
      var g = vm.giocatori[vm.turno];
      if (!mio) { zHero.appendChild(el("div", { class: "bj-hnome", text: g.nome + " sta puntando…" })); return; }
      var minP = vm.puntataMin || 10, maxP = g.fiches;
      if (puntSel == null) puntSel = Math.min(100, maxP);
      puntSel = Math.max(minP, Math.min(puntSel, maxP));
      zHero.appendChild(el("div", { class: "bj-hnome", text: g.nome + ", quanto punti?" }));
      zHero.appendChild(el("div", { class: "bj-hfiches", text: g.fiches + " 🪙 disponibili" }));
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
      zHero.appendChild(el("div", { class: "bj-hnome", text: g.nome + ": assicurazione?" }));
      if (mio) zHero.appendChild(el("div", { class: "bj-hfiches", text: "Il banco mostra un Asso. Assicuri per " + costo + " 🪙? (2:1)" }));
      heroCarte(g);
      if (!mio) return;
      var az = el("div", { class: "bj-azioni" });
      az.appendChild(el("button", { class: "bj-btn bj-b-si", text: "Assicuro", onclick: function () { drv.onAssicura(true); } }));
      az.appendChild(el("button", { class: "bj-btn bj-b-no", text: "No", onclick: function () { drv.onAssicura(false); } }));
      zHero.appendChild(az);
    }
    function heroCarte(g) {
      var gi = vm.giocatori.indexOf(g);
      var box = el("div", { class: "bj-mani" });
      g.mani.forEach(function (m, i) {
        var mano = el("div", { class: "bj-mano" + (i === g.attiva && vm.fase === "gioca" ? " attiva" : "") });
        var cc = el("div", { class: "bj-hcarte" + (g.mani.length > 1 ? " doppia" : "") });
        m.carte.forEach(function (c, ci) {
          var isUlt = (i === g.attiva && ci === m.carte.length - 1);
          var card = cartaEl(el, c, false, "");
          if (anim.ultima === gi && isUlt) daVolare.push(card);
          cc.appendChild(card);
        });
        mano.appendChild(cc);
        var pm = BJ.punteggio(m.carte);
        mano.appendChild(el("div", { class: "bj-pt " + (pm > 21 ? "bust" : (m.esito === "vince" || m.esito === "blackjack" ? "win" : "")), style: "display:block;margin:6px auto 0;width:fit-content", text: BJ.testo(m.carte) + " · " + m.puntata + "🪙" }));
        box.appendChild(mano);
      });
      zHero.appendChild(box);
    }
    function heroGioca(mio) {
      var g = vm.giocatori[vm.turno];
      zHero.appendChild(el("div", { class: "bj-hnome", text: g.nome + (mio ? "" : " sta giocando…") }));
      zHero.appendChild(el("div", { class: "bj-hfiches", text: g.fiches + " 🪙" }));
      heroCarte(g);
      var ma = g.mani[g.attiva];
      if (ma && ma.chiusa) {   // mano finita: resta a schermo un attimo prima di passare
        var pm = BJ.punteggio(ma.carte);
        zHero.appendChild(el("div", { class: "bj-hnome", style: "margin-top:2px;color:" + (pm > 21 ? "#ff9d8a" : "#9fe6b4"),
          text: pm > 21 ? ("Sballato! " + pm) : (BJ.eBlackjack(ma.carte) ? "Black Jack! 🎉" : "Fermo a " + pm) }));
        return;
      }
      if (!mio) return;
      var v = mosseValideVm(vm), az = el("div", { class: "bj-azioni" });
      function b(txt, cls, on, mv) { var x = el("button", { class: "bj-btn " + cls, text: txt, onclick: function () { drv.onMossa(mv); } }); if (!on) x.disabled = true; return x; }
      az.appendChild(b("Carta", "bj-b-carta", true, "carta"));
      az.appendChild(b("Stai", "bj-b-stai", true, "stai"));
      az.appendChild(b("Raddoppia", "bj-b-radd", v.raddoppia, "raddoppia"));
      az.appendChild(b("Dividi", "bj-b-dividi", v.dividi, "dividi"));
      zHero.appendChild(az);
    }
    function heroEsito() {
      zHero.appendChild(el("div", { class: "bj-hnome", text: "Fine mano " + (vm.giro - 1) }));
      if (vm.rimescolato) zHero.appendChild(el("div", { class: "bj-hfiches", text: "🔀 Sabot rimescolato" }));
      var classifica = vm.giocatori.slice().sort(function (a, b) { return b.fiches - a.fiches; });
      var lista = el("div", { style: "width:100%;max-width:360px" });
      classifica.forEach(function (g) {
        lista.appendChild(el("div", { style: "display:flex;justify-content:space-between;padding:5px 10px;border-bottom:1px solid rgba(255,255,255,.08)" }, [
          el("span", { style: "font-weight:800", text: g.nome + (vm.giocatori.indexOf(g) === mioIdx() ? " (tu)" : "") }),
          el("span", { style: "font-weight:900;color:#ffe58a", text: g.fiches + " 🪙" })
        ]));
      });
      zHero.appendChild(lista);
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
    function salva() { if (prof && !prova) SGNube.salvaFiches("blackjack", st.giocatori[0].fiches); }
    function refresh() { tav.aggiorna(vistaBJ(st)); }
    tav = tavoloBJ(t, {
      sotto: prof ? (prova ? ("👤 " + prof.nome + " · prova · ritira il bonus!") : ("👤 " + prof.nome + " · fiches salvate")) : "Un telefono · Banco CPU",
      puoAgire: function () { return true; },
      puoNuova: function () { return true; },
      guida: function () { return true; },
      onPasso: function (k) { if (k === "distrib") M.passoDistribuzione(); else if (k === "banco") M.passoBanco(); else if (k === "avanza") M.avanza(); refresh(); },
      onPunta: function (v) { suonoChip(); M.punta(st.turno, v); refresh(); },
      onMossa: function (m) { if (m === "stai") suonoStai(); M.azione(m); refresh(); },
      onAssicura: function (si) { M.assicura(st.turno, si); refresh(); },
      onFineMano: function () { salva(); },
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
    if (!(window.SGNet && SGNet.disponibile())) return localeBJ(t);
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var provaHost = false, mieFiches = prof ? SGNube.fiches("blackjack") : null;
    if (prof && (mieFiches == null || mieFiches < BJ.PUNTATA_MIN)) { provaHost = true; mieFiches = BJ.FICHES_INIZIALI; }
    var seats = [{ id: "host", nome: (prof ? prof.nome : (t.giocatori && t.giocatori[0])) || "Host", fiches: mieFiches }];
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
      if (rete) rete.invia({ t: "lobby", codice: codice, giocatori: seats.map(function (x) { return { id: x.id, nome: x.nome }; }) });
      renderLobbyBJ(t, { sonoHost: true, codice: codice, giocatori: seats }, {
        onComincia: function () { M = BJ.creaMotore(nomiSeat(), t.mischia, seats.map(function (x) { return x.fiches; })); avviaTavoloHost(); M.nuovaMano(); bcast(); },
        onEsci: function () { if (rete) rete.chiudi(); t.esci(); }
      });
    }
    function avviaTavoloHost() {
      tav = tavoloBJ(t, {
        sotto: "Online · sei l'host",
        mioIdx: function () { return 0; },
        puoAgire: function (vm) { return vm.turno === 0; },
        puoNuova: function () { return true; },
        guida: function () { return true; },
        onPasso: function (k) { if (k === "distrib") M.passoDistribuzione(); else if (k === "banco") M.passoBanco(); else if (k === "avanza") M.avanza(); bcast(); },
        onPunta: function (v) { if (M.st.turno === 0) { suonoChip(); M.punta(0, v); bcast(); } },
        onMossa: function (m) { if (M.st.turno === 0) { if (m === "stai") suonoStai(); M.azione(m); bcast(); } },
        onAssicura: function (si) { if (M.st.turno === 0) { M.assicura(0, si); bcast(); } },
        onFineMano: function (vm) { if (prof && !provaHost) SGNube.salvaFiches("blackjack", vm.giocatori[0].fiches); },
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
          if (seatDiId(id) < 0 && !M && seats.length < 10) seats.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), fiches: (typeof m.fiches === "number" ? m.fiches : null) });
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
        mioIdx: function () { return S.mioSeat; },
        puoAgire: function (vm) { return vm.turno === S.mioSeat; },
        puoNuova: function () { return false; },
        guida: function () { return false; },
        onPasso: function () {},
        onPunta: function (v) { suonoChip(); if (S.rete) S.rete.invia({ t: "mossa", kind: "punta", val: v }); },
        onMossa: function (m) { if (m === "stai") suonoStai(); if (S.rete) S.rete.invia({ t: "mossa", kind: "azione", mossa: m }); },
        onAssicura: function (si) { if (S.rete) S.rete.invia({ t: "mossa", kind: "assic", si: si }); },
        onFineMano: function (vm) { if (prof && !S.prova && S.mioSeat >= 0 && vm.giocatori[S.mioSeat]) SGNube.salvaFiches("blackjack", vm.giocatori[S.mioSeat].fiches); },
        onNuova: function () {},
        onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
      });
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.mioId = id; S.rete.invia({ t: "join", nome: S.nome, fiches: S.fiches }); },
        onMsg: function (m) {
          if (!m) return;
          if (m.t === "lobby") {
            S.mioSeat = (m.giocatori || []).findIndex(function (x) { return x.id === S.mioId; });
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

