/* =========================================================
   GIOCO — "Tris" (filetto / tic-tac-toe)
   Tre modalità:
     • Contro il Bot (da solo): Facile / Medio / Difficile / Impossibile.
     • In due sullo stesso telefono: X e O a turno (con più amici: chi vince resta).
     • Online, ognuno dal suo telefono: l'host è X, l'ospite è O
       (host-autoritativo, stesso collegamento a turni degli altri giochi).
   Due varianti: il Tris classico e il "Tris che sparisce" (ognuno ha al massimo
   3 segni: al quarto sparisce il più vecchio, così non si pareggia mai).
   In alto i due avatar col conto delle vittorie: le rivincite valgono.
   ========================================================= */
(function () {
  "use strict";

  var LINEE = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  var CX = "#4dabf7", CO = "#ff6b6b";   // 🌙 blu e rosso luminosi per il fondo scuro (almeno 5,5:1 sul tabellone)

  function altro(s) { return s === "X" ? "O" : "X"; }
  function vuota() { return [null, null, null, null, null, null, null, null, null]; }
  function libere(b) { var o = []; for (var i = 0; i < 9; i++) if (!b[i]) o.push(i); return o; }
  function pieno(b) { for (var i = 0; i < 9; i++) if (!b[i]) return false; return true; }
  function vincitore(b) {
    for (var k = 0; k < LINEE.length; k++) {
      var l = LINEE[k];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { s: b[l[0]], linea: l };
    }
    return null;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function aCaso(l) { return l[Math.floor(Math.random() * l.length)]; }
  // il Bot di questa partita: quello deciso dal core (torneo a eliminazione) o uno dei bot fissi, scelto dal livello
  // (nei tasti si dice "Bot"; in partita ha il suo nome e il suo avatar). escludi = i nomi di chi gioca
  function botDi(imp, liv, escludi) {
    if (imp && imp.bot && imp.bot.nome) return imp.bot;
    var b = SG.bot && SG.bot.prendi ? SG.bot.prendi(1, { livello: liv === "impossibile" ? "difficile" : liv, escludi: escludi })[0] : null;
    return b || { nome: "Bot", omino: null, bot: true };
  }

  // ---- suoni (niente vibrazione qui: quella la dà il core solo quando tocchi tu) ----
  // un pennarello che scrive veloce (raffica di rumore filtrato con qualche "tratto")
  function suonoPenna() {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime, dur = 0.2;
      var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
      var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1950; bp.Q.value = 0.9;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      var seq = [[0.012, 0.30], [0.05, 0.12], [0.085, 0.28], [0.12, 0.10], [0.155, 0.22], [0.2, 0]];
      seq.forEach(function (s) { g.gain.linearRampToValueAtTime(s[1], t + s[0]); });
      src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start(t); src.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function nota(ctx, f, t0, dur, vol, tipo) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  // "turno" = un ding leggero quando tocca a te (online); "vinci", "perdi", "pari" a fine partita
  function suono(tipo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime;
      if (tipo === "turno") { nota(ctx, 988, t, 0.12, 0.06); nota(ctx, 1319, t + 0.09, 0.16, 0.05); }
      else if (tipo === "vinci") [523, 659, 784, 1047].forEach(function (f, k) { nota(ctx, f, t + k * 0.09, 0.24, 0.08, "triangle"); });
      else if (tipo === "perdi") { nota(ctx, 392, t, 0.22, 0.07, "triangle"); nota(ctx, 311, t + 0.18, 0.34, 0.06, "triangle"); }
      else if (tipo === "pari") { nota(ctx, 587, t, 0.16, 0.06, "triangle"); nota(ctx, 587, t + 0.15, 0.22, 0.05, "triangle"); }
    } catch (e) {}
  }

  // =========================================================
  //  LA PARTITA (uguale in tutti i modi)
  //  st = { board:[9], turno, fine:{vincitore,linea}|null, ord:{X:[],O:[]}, mosse:{X,O}, variante }
  // =========================================================
  function nuovaPartita(primo, variante) {
    return { board: vuota(), turno: primo || "X", fine: null, ord: { X: [], O: [] }, mosse: { X: 0, O: 0 }, variante: variante === "sparisce" ? "sparisce" : "classico" };
  }
  // mette il segno di chi è di turno nella casella i; nel "Tris che sparisce" il 4° segno fa sparire il più vecchio
  function metti(st, i) {
    if (st.fine || typeof i !== "number" || (i | 0) !== i || i < 0 || i > 8 || st.board[i] != null) return false;
    var p = st.turno;
    if (st.variante === "sparisce" && st.ord[p].length >= 3) st.board[st.ord[p].shift()] = null;
    st.board[i] = p; st.ord[p].push(i); st.mosse[p]++;
    var w = vincitore(st.board);
    if (w) st.fine = { vincitore: w.s, linea: w.linea };
    else if (st.variante !== "sparisce" && pieno(st.board)) st.fine = { vincitore: null, linea: null };
    else st.turno = altro(p);
    return true;
  }
  // chi comincia la prossima: "turno" = a turno, "perso" = chi ha appena perso, "caso" = a sorte
  function scegliPrimo(regola, primoPrima, fine) {
    if (regola === "caso") return Math.random() < 0.5 ? "X" : "O";
    if (regola === "perso" && fine && fine.vincitore) return altro(fine.vincitore);
    return altro(primoPrima || "O");
  }

  // ---- il Bot ----
  function copia(st) { return { board: st.board.slice(), turno: st.turno, fine: null, ord: { X: st.ord.X.slice(), O: st.ord.O.slice() }, mosse: { X: 0, O: 0 }, variante: st.variante }; }
  function dopo(st, i) { var s = copia(st); metti(s, i); return s; }
  function scambia(st) { var s = copia(st); s.turno = altro(st.turno); return s; }
  // le caselle con cui chi è di turno vince subito
  function vincenti(st) { return libere(st.board).filter(function (i) { var s = dopo(st, i); return !!(s.fine && s.fine.vincitore === st.turno); }); }
  // dopo la mossa i, l'avversario può vincere subito?
  function lasciaVincere(st, i) { var s = dopo(st, i); return !s.fine && vincenti(s).length > 0; }
  // ricerca (negamax con potatura): punti dal punto di vista di chi è di turno; prima si vince, meglio è
  function cerca(st, prof, a, b) {
    var libs = libere(st.board), best = -1000;
    if (!libs.length) return 0;
    for (var k = 0; k < libs.length; k++) {
      var s = dopo(st, libs[k]), v;
      if (s.fine) v = s.fine.vincitore ? 100 + prof : 0;
      else if (prof <= 0) v = 0;
      else v = -cerca(s, prof - 1, -b, -a);
      if (v > best) best = v;
      if (v > a) a = v;
      if (a >= b) break;
    }
    return best;
  }
  function migliori(st, prof) {
    var libs = libere(st.board), best = -1e9, tutte = [];
    libs.forEach(function (i) {
      var s = dopo(st, i);
      var v = s.fine ? (s.fine.vincitore ? 100 + prof : 0) : (prof <= 0 ? 0 : -cerca(s, prof - 1, -1e9, 1e9));
      if (v > best) { best = v; tutte = [i]; } else if (v === best) tutte.push(i);
    });
    return tutte;
  }
  // la mossa del Bot e che tipo di mossa è (per le sue battute): "blocca", "attacca", "sbaglia" o null
  function mossaBot(st, liv) {
    var libs = libere(st.board); if (!libs.length) return null;
    var vinci = vincenti(st), minaccia = vincenti(scambia(st)).length > 0, i, distratto = false;
    var classico = st.variante !== "sparisce";
    if (liv === "facile") i = aCaso(libs);
    else if (vinci.length) i = vinci[0];
    else if (liv === "medio") {   // non lascia vincere se può evitarlo, per il resto va a caso (si batte)
      var sicure = libs.filter(function (c) { return !lasciaVincere(st, c); });
      i = aCaso(sicure.length ? sicure : libs);
    } else if (liv === "difficile" && Math.random() < 0.15) { i = aCaso(libs); distratto = true; }   // ogni tanto si distrae (un giocatore normale lo batte ~1 volta su 5)
    else i = aCaso(migliori(st, classico ? 9 : (liv === "difficile" ? 3 : 7)));
    var s = dopo(st, i), tipo = null;
    if (!s.fine) {
      if (distratto && vincenti(s).length) tipo = "sbaglia";
      else if (minaccia && !vincenti(s).length) tipo = "blocca";
      else if (vincenti(scambia(s)).length >= 2) tipo = "attacca";
    }
    return { i: i, tipo: tipo };
  }
  // le battute del Bot (nella nuvoletta sopra il suo avatar)
  var BATTUTE = {
    inizio: ["Pronto? Io sì 😎", "Questa volta non mi scappi.", "Scaldo i circuiti… 🔌", "Che vinca il migliore (cioè io).", "Ho fatto stretching ai bit.", "Vai, ti lascio un vantaggio. Forse."],
    blocca: ["Eh no, questa la blocco!", "Ti ho visto! 👀", "Troppo facile da leggere.", "Alt! Di qui non si passa ✋", "Pensavi che non me ne accorgessi?", "Bella idea. Peccato per te."],
    attacca: ["Occhio a questa… 😏", "Due strade, una sola difesa!", "Adesso sono guai per te.", "E ora? Scegli bene… 😈"],
    vince: ["Tris! 🤖🏆", "Bip bop: ho vinto!", "Calcolato al millimetro.", "Rivincita? Tanto vinco ancora.", "Grazie per la partita 😇", "Facile come accendere una lampadina 💡"],
    perde: ["Non è possibile… 😵", "Hai avuto fortuna!", "Va bene, sei più bravo tu. Per ora.", "Riavviooo… 🔄", "Chiedo la rivincita!", "Mi si è impallato il cervello 🥴"],
    pari: ["Pari! Ci conosciamo troppo bene.", "Nessuno passa, nessuno vince 🤝", "Bella sfida, eh?", "Muro contro muro!", "Pari e patta, la prossima è mia."],
    sbaglia: ["Ops… dove ho messo il segno?", "Ehm… volevo metterlo lì. Credo.", "Ho starnutito sul tasto 🤧", "Mi sono distratto un attimo…"]
  };
  var ultimaBattuta = "";
  function battuta(tipo) {
    var l = (BATTUTE[tipo] || []).filter(function (x) { return x !== ultimaBattuta; });
    if (!l.length) return ""; ultimaBattuta = aCaso(l); return ultimaBattuta;
  }

  // ---- faccine e frasi durante la partita (il pezzo comune è in scopa.js: window.SGChiacchiere) ----
  function CH() { return window.SGChiacchiere || null; }
  // chi parla: "X" / "O" = un giocatore (fumetto sotto il suo avatar); se no chi guarda (in basso a sinistra, col nome)
  function chiacTris(ui, k, c, nome) {
    var X = CH(); if (!X || !ui || !document.body.contains(ui.s)) return;
    var muto = !!(ui.cb && ui.cb.guarda);   // (chi guarda: niente suoni)
    if (k === "X" || k === "O") X.bolla(ui.gio[k].box, "tris", c, { sotto: true, muto: muto });
    else X.volante("tris", c, nome, muto);
  }
  // l'host: una chiacchiera arrivata da un telefono (avvId = chi gioca con l'O; gli altri guardano: solo faccine)
  function chiacDaOspite(ch, filtra, acceso, id, m, avvId) {
    if (!ch || !acceso || !filtra(id)) return null;
    var gioca = !!avvId && id === avvId, c = String(m.c || "");
    if (!ch.valido("tris", c, !gioca)) return null;
    var x = { t: "chiac", k: gioca ? "O" : "g", id: id, c: c };
    if (!gioca) x.n = ch.nomeDi(m.n);
    return x;
  }

  SG.registra({
    id: "tris",
    tema: "oro",   // 🤍 Bianco e oro: tutto il gioco è chiaro
    nome: "Tris",
    icona: "⭕",
    descrizione: "Il filetto classico: allinea tre simboli. Da solo contro il Bot, in due sullo stesso telefono o online. C'è anche il Tris che sparisce!",
    giocatoriMin: 1, giocatoriMax: 6, difficolta: 1,
    postiOnline: 2,   // online si gioca in due: gli altri guardano
    riprende: true,   // se l'host ricarica la pagina, la partita riprende dalla stessa mossa (t.ripresa)
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Giochi da solo contro il Bot" },
      { modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "In due (o di più: chi vince resta)", amici: true }],
    regole: [
      "A turno si mette il proprio simbolo (<b>X</b> o <b>O</b>) in una casella libera della griglia 3×3.",
      "Vince chi per primo allinea <b>tre</b> simboli uguali: in orizzontale, verticale o diagonale.",
      "Se si riempie tutto senza allineamenti, è <b>pareggio</b>.",
      "<b>Tris che sparisce</b>: ognuno ha al massimo 3 simboli. Quando ne metti un quarto, il tuo più vecchio sparisce (è quello più chiaro). Così non si pareggia mai!",
      "In alto c'è il conto delle vittorie: ogni rivincita vale. Su questo telefono, se siete più di due, <b>chi vince resta</b> e chi perde lascia il posto al prossimo.",
      "Modalità: <b>contro il Bot</b> (Facile / Medio / Difficile / Impossibile), <b>sullo stesso telefono</b>, oppure <b>online</b> (ognuno dal suo, uno apre la stanza e l'altro entra col codice; gli altri guardano)."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = aiuti.torneo ? "telefono" : (aiuti.modo || (aiuti.sala ? "online" : "bot"));
      dove.torneo = !!aiuti.torneo;
      dove.difficolta = dove.difficolta || "medio"; dove.variante = dove.variante || "classico"; dove.inizia = dove.inizia || "turno";
      // una riga di scelte (tasti piccoli, icona sopra e nome sotto: stanno anche su un telefono stretto)
      function scelta(titolo, chiave, voci, colonne) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var g = el("div", { class: "modo-griglia", style: "display:grid;gap:8px;grid-template-columns:repeat(" + colonne + ",minmax(0,1fr))" });
        voci.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v[0] ? " attiva" : ""), style: "flex-direction:column;gap:2px;padding:10px 6px;justify-content:center;text-align:center;min-width:0",
            onclick: function () { dove[chiave] = v[0]; [].forEach.call(g.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva"); } },
            [el("span", { class: "mi", style: "font-size:1.5rem", text: v[1] }), el("div", { class: "mt", style: "font-size:.98rem", text: v[2] }), v[3] ? el("div", { class: "ms", style: "font-size:.78rem", text: v[3] }) : null]);
          g.appendChild(b);
        });
        box.appendChild(g);
      }
      if (dove.modo === "bot") scelta("Bravura del Bot", "difficolta", [["facile", "🙂", "Facile"], ["medio", "😐", "Medio"], ["difficile", "😠", "Difficile"], ["impossibile", "💀", "Impossibile"]], 2);
      scelta("Variante", "variante", [["classico", "⭕", "Classico", "Il Tris di sempre"], ["sparisce", "♻️", "Che sparisce", "Max 3 segni a testa"]], 2);
      if (!aiuti.torneo) scelta("Chi comincia", "inizia", [["turno", "🔁", "A turno"], ["perso", "😤", "Chi perde"], ["caso", "🎲", "A sorte"]], 3);
      if (dove.modo === "online" && CH()) CH().regola(el, box, dove);   // 💬 faccine e frasi durante la partita (l'host le può spegnere)
      if (dove.modo === "online" && !aiuti.sala) {
        box.appendChild(el("div", { class: "link-avviso", text: (window.SGNet && SGNet.disponibile())
          ? "Apri la stanza e invita l'altro col tasto 📤: entra dal suo telefono (gli altri guardano)."
          : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online." }));
      }
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return t.linkParams.guarda ? guardaTris(t, t.linkParams.stanza) : ospiteTris(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostTris(t);
      return localeTris(t, imp.modo === "telefono" ? "telefono" : "bot", imp.difficolta || "medio", !!imp.torneo, imp);
    }
  });

  // =========================================================
  //  STILE (una volta sola)
  // =========================================================
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.id = "sg-tris-css";
    st.textContent = [
      // 🤍 Bianco e oro: tutto il gioco è chiaro (tema: "oro"). Colori solo con le variabili --o-* (css/styles.css);
      // X e O restano blu e rosso, ma scuri quanto basta per il fondo chiaro (CX/CO in cima al file)
      ".schermata.tr-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden}",
      ".schermata.tr-piena>.piede{display:none}",
      ".schermata.tr-piena>.contenuto{height:100%;margin:0;padding:0}",
      // il ‹ in alto a sinistra: tasto bianco col filo d'oro (prima era un velo nero con la freccia bianca)
      ".oro.g-tris.senza-testa>.testa .btn-piccolo{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra)}",
      ".tr-scena{--trw:min(86vw,calc(var(--alt,100dvh) - 290px),460px);position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 10px calc(12px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".tr-gioc{width:var(--trw);max-width:100%;display:flex;align-items:flex-start;justify-content:center;gap:4px;padding:0 34px;box-sizing:border-box}",
      ".tr-g{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;opacity:.75;transform:scale(.9);transition:opacity .25s,transform .25s;position:relative}",
      ".tr-g.turno,.tr-g.vince{opacity:1;transform:scale(1)}",
      ".tr-avw{position:relative;width:56px;height:56px}",
      ".tr-av{width:100%;height:100%;box-sizing:border-box;border-radius:50%;background:var(--o-carta-2);border:2.5px solid;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.9rem;line-height:1;box-shadow:var(--o-ombra)}",
      ".tr-av svg{width:100%;height:100%;display:block;align-self:flex-end}",
      ".tr-g.X .tr-av{border-color:" + CX + "}.tr-g.O .tr-av{border-color:" + CO + "}",
      ".tr-g.vince .tr-av{box-shadow:0 0 0 2px var(--o-carta),0 0 0 4.5px var(--o-oro)}",
      ".tr-sim{position:absolute;right:-5px;bottom:-3px;width:22px;height:22px;border-radius:50%;color:var(--o-scuro-testo);font-weight:900;font-size:.8rem;line-height:22px;text-align:center;box-shadow:0 0 0 2px var(--o-carta-piena),0 1px 4px rgba(0,0,0,.5)}",
      ".tr-g.X .tr-sim{background:" + CX + "}.tr-g.O .tr-sim{background:" + CO + "}",
      ".tr-nome{font-weight:800;font-size:.86rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--o-testo)}",
      ".tr-tu{font-size:.72rem;font-weight:700;color:var(--o-tenue);min-height:1.1em;line-height:1.1}",
      ".tr-punti{flex:0 0 auto;align-self:center;font-family:var(--o-tit);font-weight:700;font-size:2rem;white-space:nowrap;margin-bottom:12px;font-variant-numeric:lining-nums tabular-nums;text-align:center;line-height:1.05;color:var(--o-testo)}",
      ".tr-punti small{display:block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif;font-size:.66rem;font-weight:700;color:var(--o-tenue);letter-spacing:.02em}",
      ".tr-fumetto{position:absolute;top:60px;z-index:6;width:max-content;max-width:150px;background:var(--o-carta-piena);color:var(--o-testo);border:1px solid var(--o-filo-oro);font-weight:800;font-size:.8rem;line-height:1.25;padding:6px 9px;border-radius:12px;box-shadow:var(--o-ombra-alta);opacity:0;transform:translateY(-4px) scale(.9);transition:opacity .2s,transform .2s;pointer-events:none;text-align:center;white-space:normal}",
      ".tr-g.X .tr-fumetto{left:0}.tr-g.O .tr-fumetto{right:0}",
      ".tr-fumetto.on{opacity:1;transform:none}",
      ".tr-stato{font-family:var(--o-tit);font-weight:700;font-size:1.5rem;min-height:1.3em;text-align:center;line-height:1.2;padding:0 6px;color:var(--o-testo)}",
      ".tr-stato.pop{animation:trPop .45s ease-out}",
      "@keyframes trPop{0%{transform:scale(.7);opacity:.3}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}",
      // la griglia: una carta bianca col filo d'oro; dentro, le quattro linee sottili del Tris (d'oro) disegnate dalle caselle
      ".tr-griglia{--trc:var(--o-oro);position:relative;isolation:isolate;margin:8px 0;width:var(--trw);max-width:100%;aspect-ratio:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));gap:3.5%}",
      ".tr-griglia::before{content:'';position:absolute;inset:-10px;z-index:-1;border-radius:24px;background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra-alta);pointer-events:none}",
      // il filo del turno (tocca a te, o del colore di chi tocca sullo stesso telefono): sottile, niente bagliore
      ".tr-griglia::after{content:'';position:absolute;inset:-10px;border-radius:24px;box-shadow:0 0 0 2px var(--trc);opacity:0;transition:opacity .3s;pointer-events:none}",
      ".tr-griglia.tuo::after{opacity:.9;animation:trRespira 1.5s ease-in-out infinite alternate}",
      "@keyframes trRespira{0%{opacity:.4}100%{opacity:1}}",
      ".tr-cella{position:relative;display:block;border:0;padding:0;margin:0;min-height:0;border-radius:14px;background:transparent;box-shadow:none;cursor:pointer;-webkit-tap-highlight-color:transparent;color:inherit;font:inherit;transition:transform .08s,background .2s}",
      ".tr-cella:disabled{cursor:default;opacity:1;color:inherit}",
      ".tr-cella:not(:disabled):active{transform:scale(.94);background:var(--o-carta-viva)}",
      "@media (hover:hover){.tr-cella:not(:disabled):hover{background:var(--o-carta-2)}}",
      ".tr-cella.vinc{background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.3)}",
      // le linee: ogni casella disegna un pezzo, nello spazio tra le caselle (gap = 11,29% di una casella: la metà è 5,645%)
      ".tr-cella::before,.tr-cella::after{content:'';position:absolute;display:none;background:rgba(255,255,255,.36);border-radius:2px;pointer-events:none}",   // (linee chiare e neutre: il lampone si confondeva col rosso della O)
      ".tr-cella:nth-child(3n+1)::before,.tr-cella:nth-child(3n+2)::before{display:block;left:calc(105.645% - 1px);top:0;width:2px;height:100%}",
      ".tr-cella:nth-child(-n+6):nth-child(3n+1)::before,.tr-cella:nth-child(-n+6):nth-child(3n+2)::before{height:111.29%}",
      ".tr-cella:nth-child(-n+6)::after{display:block;top:calc(105.645% - 1px);left:0;height:2px;width:100%}",
      ".tr-cella:nth-child(-n+6):nth-child(3n+1)::after,.tr-cella:nth-child(-n+6):nth-child(3n+2)::after{width:111.29%}",
      ".tr-cella svg{position:absolute;left:13%;top:13%;width:74%;height:74%;overflow:visible;transition:opacity .25s}",
      ".tr-cella .seg{fill:none;stroke-width:10;stroke-linecap:round}",
      ".tr-cella .seg.x{stroke:" + CX + "}.tr-cella .seg.o{stroke:" + CO + "}",
      ".tr-cella svg.nuovo .seg{stroke-dasharray:100;stroke-dashoffset:100;animation:trScrivi .28s ease-out forwards}",
      "@keyframes trScrivi{to{stroke-dashoffset:0}}",
      ".tr-cella svg.prova{opacity:.4}",
      ".tr-cella svg.vecchio{opacity:.35}",
      ".tr-cella svg.sparisce{animation:trVia .3s ease-in forwards}",
      "@keyframes trVia{to{opacity:0;transform:scale(.4)}}",
      ".tr-linea{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:2}",
      ".tr-linea line{stroke:var(--o-testo);stroke-width:7;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:100;opacity:0}",   // (spenta: la linea di zero lunghezza con la punta tonda era un puntino)
      ".tr-linea.on line{opacity:1;animation:trScrivi .35s .15s ease-out forwards}",
      ".tr-piede{width:var(--trw);max-width:100%;min-height:52px;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}",
      ".tr-piede .btn{flex:1 1 0;min-width:0;margin:0}",
      ".tr-piede .sl-faccine{flex:1 1 100%}",
      ".tr-scena.con-fa{--trw:min(86vw,calc(var(--alt,100dvh) - 350px),460px)}",
      // chi guarda: in basso c'è la targhetta del core (alta 44 px + 10): la si lascia libera
      ".tr-scena.con-targa{padding-bottom:calc(62px + env(safe-area-inset-bottom));--trw:min(86vw,calc(var(--alt,100dvh) - 340px),460px)}",
      ".tr-scena.con-targa.con-fa{--trw:min(86vw,calc(var(--alt,100dvh) - 400px),460px)}",
      ".tr-nota{flex:1 1 100%;margin:0;text-align:center;font-weight:700;font-size:.9rem;color:var(--o-tenue);line-height:1.3}",
      ".tr-nota.corta{flex:1 1 0;min-width:0}",   // (accanto al tasto 💬)
      ".tr-cor{position:absolute;left:50%;top:45%;width:9px;height:14px;border-radius:2px;pointer-events:none;z-index:8;will-change:transform,opacity}",
      ".tr-attesa{font-size:1.1rem;line-height:1.5;text-align:center;margin:30vh 0 0}",
      // il tasto 💬 (è del pezzo comune delle chiacchiere: qui prende il bianco e oro)
      ".oro.g-tris .sgc-tasto{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra)}",
      ".oro.g-tris .sgc-tasto i{background:var(--o-oro)}",
      // il foglio delle faccine e frasi (💬, sta sulla pagina, fuori dalla schermata): vetro pieno dell'app al posto del blu di prima
      "body:has(.oro.g-tris) .sgc-velo{background:rgba(9,11,22,.55)}",
      "body:has(.oro.g-tris) .sgc-foglio{background:var(--o-carta-piena);color:var(--o-testo);border:1px solid var(--o-filo-oro);box-shadow:var(--o-ombra-alta)}",
      "body:has(.oro.g-tris) :is(.sgc-fac button,.sgc-frasi button,.sgc-x){background:var(--o-fondo-2);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo)}",
      // telefoni bassi (360x640): punti e scritta un po' più piccoli, così i tasti di fine partita restano nello schermo
      "@media (max-height:700px){.tr-griglia{margin:2px 0}.tr-punti{font-size:1.6rem;margin-bottom:8px}.tr-stato{font-size:1.25rem}}",
      // telefoni alti: avatar e scritte più grandi
      "@media (min-height:800px){.tr-scena{gap:14px}.tr-avw{width:70px;height:70px}.tr-av{font-size:2.4rem}.tr-fumetto{top:74px}.tr-nome{font-size:1rem}.tr-punti{font-size:2.3rem}.tr-stato{font-size:1.7rem}}"
    ].join("");
    document.head.appendChild(st);
  }

  // =========================================================
  //  IL CAMPO (uguale per tutte le modalità): si costruisce UNA volta e poi si aggiorna a pezzi
  //  vm = { fase:"gioco"|"fine", board, turno, fine, ord, mosse, variante, nomi:{X,O}, omini:{X,O}, punti:{X,O,pari}, n }
  //  cb = { mio:"X"|"O"|"-"|null, bot, liv, locale, sonoHost, guarda, spettatore, torneo, prova, hostVia,
  //         notaGioco, testoRivincita, onCella(i), onRivincita, onEsci, onAvanti, onSpareggio }
  //  M  = { ui, fase } (uno per partita: la schermata e l'ultima fase vista)
  // =========================================================
  function statoHtml(vm, cb) {
    function nome(k) { return "<span style='color:" + (k === "X" ? CX : CO) + "'>" + esc(vm.nomi[k]) + "</span>"; }
    if (vm.fase === "fine") {
      if (vm.fine && vm.fine.vincitore) {
        if (cb.mio === vm.fine.vincitore) return "🏆 Hai vinto!";
        if (cb.bot && vm.fine.vincitore === "O") return "🤖 Vince " + nome("O") + "!";
        return "🏆 Vince " + nome(vm.fine.vincitore) + "!";
      }
      return "🤝 Pareggio!";
    }
    if (cb.hostVia) return "⏳ Aspettiamo " + esc(vm.nomi.X) + "…";   // (è uscito un attimo dall'app: lo dice anche la pillola in alto)
    if (cb.mio && cb.mio === vm.turno) return "Tocca a <b>te</b>";
    if (cb.bot && vm.turno === "O") return "🤖 " + nome("O") + " sta pensando…";
    return "Tocca a " + nome(vm.turno);
  }
  function segnoSvg(s, cls) {
    return s === "X"
      ? "<svg viewBox='0 0 100 100' class='" + cls + "' aria-hidden='true'><path class='seg x' pathLength='100' d='M22 22L78 78M78 22L22 78'/></svg>"
      : "<svg viewBox='0 0 100 100' class='" + cls + "' aria-hidden='true'><circle class='seg o' pathLength='100' cx='50' cy='50' r='30' transform='rotate(-90 50 50)'/></svg>";
  }
  function avatarHtml(om) {
    if (typeof om === "string") return esc(om);   // il Bot: un'emoji
    if (om && window.SGOmino) { try { return SGOmino.svg(om, { busto: true }); } catch (e) {} }
    return "🙂";
  }
  function puoi(ui) {
    var vm = ui.vm, cb = ui.cb;
    return !!(vm && cb && vm.fase === "gioco" && !cb.guarda && !cb.hostVia && ui.prova == null && (cb.mio == null || cb.mio === vm.turno));
  }

  function campo(t, M, vm, cb, rifai) {
    if (M.ui && !document.body.contains(M.ui.s)) { if (!rifai) return; M.ui = null; }   // schermata lasciata: in locale non si rimette su
    if (!M.ui) M.ui = creaCampo(t);
    var era = M.fase; M.fase = vm.fase;
    aggiorna(M.ui, vm, cb, era);
  }
  function creaCampo(t) {
    stile();
    var el = t.el, ui = { t: t, celle: [], v: [], tok: [], vm: null, cb: null, gio: {}, firmaPiede: null, firmaStato: "", firmaLinea: "", prova: null, n: null };
    ui.s = t.schermata({ indietro: function () { indietro(ui); } });
    ui.s.classList.add("tr-piena");
    ui.scena = el("div", { class: "tr-scena" });
    // i due giocatori, col conto delle vittorie in mezzo
    ui.barra = el("div", { class: "tr-gioc" });
    ["X", "O"].forEach(function (k) {
      var g = { box: el("div", { class: "tr-g " + k }), av: el("div", { class: "tr-av" }), nome: el("div", { class: "tr-nome" }), tu: el("div", { class: "tr-tu" }), fum: el("div", { class: "tr-fumetto" }), firma: "" };
      g.box.appendChild(el("div", { class: "tr-avw" }, [g.av, el("div", { class: "tr-sim", text: k })]));
      g.box.appendChild(g.nome); g.box.appendChild(g.tu); g.box.appendChild(g.fum);
      ui.gio[k] = g;
    });
    ui.punti = el("div", { class: "tr-punti" });
    ui.barra.appendChild(ui.gio.X.box); ui.barra.appendChild(ui.punti); ui.barra.appendChild(ui.gio.O.box);
    ui.stato = el("div", { class: "tr-stato" });
    ui.griglia = el("div", { class: "tr-griglia" });
    for (var i = 0; i < 9; i++) (function (i) {
      var b = el("button", { class: "tr-cella", "aria-label": "Casella " + (i + 1), onclick: function () { tocca(ui, i); } });
      ui.celle.push(b); ui.v.push(null); ui.tok.push(0); ui.griglia.appendChild(b);
    })(i);
    ui.griglia.insertAdjacentHTML("beforeend", "<svg class='tr-linea' viewBox='0 0 300 300' preserveAspectRatio='none' aria-hidden='true'><line pathLength='100' x1='0' y1='0' x2='0' y2='0'/></svg>");
    ui.linea = ui.griglia.lastChild; ui.lineaL = ui.linea.firstChild;
    ui.piede = el("div", { class: "tr-piede" });
    [ui.barra, ui.stato, ui.griglia, ui.piede].forEach(function (n) { ui.scena.appendChild(n); });
    ui.s._contenuto.appendChild(ui.scena);
    t.mostra(ui.s);
    return ui;
  }
  function indietro(ui) {
    var cb = ui.cb; if (!cb) return;
    if (cb.guarda || !ui.vm || ui.vm.fase !== "gioco") return cb.onEsci();
    if (ui.t.conferma) ui.t.conferma("Uscire dalla partita?", cb.onEsci); else if (window.confirm("Uscire dalla partita?")) cb.onEsci();   // (la finestra al centro dell'app)
  }
  function tocca(ui, i) {
    if (!puoi(ui) || ui.vm.board[i] != null) return;
    if (ui.cb.prova) {   // online: il segno compare subito (chiaro) finché non arriva la conferma dell'host
      ui.prova = i; ui.v[i] = "?"; ui.tok[i]++;
      ui.celle[i].innerHTML = segnoSvg(ui.cb.mio, "prova");
      [].forEach.call(ui.celle, function (b) { b.disabled = true; });
      ui.griglia.classList.remove("tuo");
      clearTimeout(ui.tProva);
      ui.tProva = setTimeout(function () { togliProva(ui); if (ui.vm) aggiorna(ui, ui.vm, ui.cb, ui.vm.fase); }, 4000);   // l'host non ha risposto: si può ritoccare
    }
    ui.cb.onCella(i);
  }
  function togliProva(ui) {
    if (ui.prova == null) return;
    var p = ui.prova; ui.prova = null; clearTimeout(ui.tProva);
    if (ui.v[p] === "?") { ui.v[p] = null; ui.tok[p]++; ui.celle[p].innerHTML = ""; }
  }

  function aggiorna(ui, vm, cb, era) {
    var prima = ui.vm, primaVolta = !prima;
    ui.vm = vm; ui.cb = cb;
    if (ui.prova != null && (vm.board[ui.prova] != null || vm.fase !== "gioco" || vm.turno !== cb.mio)) togliProva(ui);
    var nuova = !!prima && prima.n !== vm.n;   // è cominciata un'altra partita (rivincita)
    // ---- i giocatori e il conto ----
    ["X", "O"].forEach(function (k) {
      var g = ui.gio[k], om = vm.omini && vm.omini[k], f = (typeof om === "string" ? om : JSON.stringify(om || null)) + "|" + vm.nomi[k];
      if (g.firma !== f) { g.firma = f; g.av.innerHTML = avatarHtml(om); g.nome.textContent = vm.nomi[k] || ""; }
      var tu = cb.mio === k ? "(tu)" : (cb.bot && k === "O" && cb.liv ? ({ facile: "Facile", medio: "Medio", difficile: "Difficile", impossibile: "Impossibile" })[cb.liv] || "" : "");
      if (g.tu.textContent !== tu) g.tu.textContent = tu;
      var c = "tr-g " + k + (vm.fase === "gioco" && vm.turno === k ? " turno" : "") + (vm.fase === "fine" && vm.fine && (vm.fine.vincitore === k || !vm.fine.vincitore) ? " vince" : "");
      if (vm.fase === "fine" && vm.fine && !vm.fine.vincitore) c = c.replace(" vince", " turno");
      if (g.box.className !== c) g.box.className = c;
    });
    var p = vm.punti || { X: 0, O: 0, pari: 0 };
    var ph = cifre(p.X) + " – " + cifre(p.O) + (p.pari ? "<small>" + cifre(p.pari) + " pari</small>" : "<small>&nbsp;</small>");
    if (ui.firmaPunti !== ph) { ui.firmaPunti = ph; ui.punti.innerHTML = ph; }
    // ---- la scritta del turno ----
    var sh = statoHtml(vm, cb);
    if (sh !== ui.firmaStato) {
      ui.firmaStato = sh; ui.stato.innerHTML = sh;
      if (vm.fase === "fine") { ui.stato.classList.remove("pop"); void ui.stato.offsetWidth; ui.stato.classList.add("pop"); } else ui.stato.classList.remove("pop");
    }
    // ---- le caselle: si cambia solo quella che cambia ----
    var via = vm.variante === "sparisce" && vm.fase === "gioco" && vm.ord && vm.ord[vm.turno] && vm.ord[vm.turno].length >= 3 ? vm.ord[vm.turno][0] : -1;
    var lin = (vm.fine && vm.fine.linea) || [], posso = puoi(ui), segnoNuovo = false;
    for (var i = 0; i < 9; i++) {
      var b = ui.celle[i], v = vm.board[i] || null;
      if (ui.v[i] !== v && !(ui.prova === i && v == null)) {
        var vecchio = ui.v[i]; ui.v[i] = v; ui.tok[i]++;
        if (!v) {   // il segno se ne va (Tris che sparisce, o nuova partita): svanisce
          var sv = b.querySelector("svg");
          if (sv && vecchio !== "?") { sv.setAttribute("class", "sparisce"); (function (b, tk, i) { setTimeout(function () { if (ui.tok[i] === tk) b.innerHTML = ""; }, 320); })(b, ui.tok[i], i); }
          else b.innerHTML = "";
        } else {
          b.innerHTML = segnoSvg(v, primaVolta ? "" : "nuovo");
          if (!primaVolta && !nuova) segnoNuovo = true;
        }
      }
      var sv2 = b.querySelector("svg");
      if (sv2 && ui.v[i] && ui.v[i] !== "?") { var cls = (sv2.getAttribute("class") || "").replace(/\s*vecchio/, "") + (i === via ? " vecchio" : ""); if (sv2.getAttribute("class") !== cls.trim()) sv2.setAttribute("class", cls.trim()); }
      var vinc = lin.indexOf(i) >= 0;
      if (b.classList.contains("vinc") !== vinc) b.classList.toggle("vinc", vinc);
      var dis = !(posso && v == null);
      if (b.disabled !== dis) b.disabled = dis;
    }
    if (segnoNuovo && !cb.guarda) suonoPenna();
    // il bagliore attorno alla griglia: tocca a te (o, sullo stesso telefono, del colore di chi tocca)
    if (ui.griglia.classList.contains("tuo") !== posso) ui.griglia.classList.toggle("tuo", posso);
    var trc = vm.turno === "X" ? CX : CO;
    if (ui.trc !== trc) { ui.trc = trc; ui.griglia.style.setProperty("--trc", trc); }
    // ---- la linea della vittoria ----
    var fl = lin.join(",");
    if (fl !== ui.firmaLinea) {
      ui.firmaLinea = fl; ui.linea.classList.remove("on");
      if (lin.length) {
        var c0 = [46.5, 150, 253.5], a = lin[0], z = lin[2];
        var x1 = c0[a % 3], y1 = c0[Math.floor(a / 3)], x2 = c0[z % 3], y2 = c0[Math.floor(z / 3)];
        var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, ext = 22;
        ui.lineaL.setAttribute("x1", x1 - dx / len * ext); ui.lineaL.setAttribute("y1", y1 - dy / len * ext);
        ui.lineaL.setAttribute("x2", x2 + dx / len * ext); ui.lineaL.setAttribute("y2", y2 + dy / len * ext);
        void ui.linea.getBoundingClientRect(); ui.linea.classList.add("on");
      }
    }
    // ---- in fondo: tasti e note ----
    piede(ui, vm, cb);
    // ---- "tocca a te" online: un ding leggero (solo se il telefono è in primo piano) ----
    if (!cb.locale && !cb.guarda && prima && vm.fase === "gioco" && cb.mio === vm.turno && (prima.turno !== vm.turno || prima.fase !== "gioco") && document.visibilityState !== "hidden")
      setTimeout(function () { suono("turno"); }, 260);
    // ---- fine partita vista coi propri occhi: festa, suoni e trofei (non dopo una pagina ricaricata) ----
    if (era === "gioco" && vm.fase === "fine" && vm.fine) {
      fineEffetti(ui, vm, cb);
      trofeiTris(vm, cb);
    }
  }
  function piede(ui, vm, cb) {
    var el = ui.t.el, voci = [];   // [tipo, testo, azione]; "fa" = la fila delle faccine (solo online); "c" = il tasto 💬
    // chi guarda soltanto (fuori dal torneo a eliminazione) ha la targhetta del core in basso "👀 Guardi · 😂 · ✕":
    // lì ci sono le faccine e l'uscita, quindi qui niente fila né "🏠 Esci" (e sotto si lascia il suo posto)
    var targa = !!(ui.t.guarda && !ui.t.eliminazione);
    var fa = !cb.locale && ui.t.faccine && !targa ? ["fa", ""] : null;
    // 💬 durante la partita: contro il Bot, online se l'host le ha lasciate accese (chi guarda: le faccine del core)
    var chiac = vm.fase === "gioco" && !!cb.onChiac && !!CH() && (cb.locale ? !!cb.bot : vm.ch === 1);
    // fine di una partita online: i tasti di fine uguali per tutti, se li disegna il core (host e avversario; chi guarda
    // soltanto, se il core li ha per lui, es. "Chi vince resta"; chi è in più nella stanza, solo nella Sala con "Chi gioca?")
    var tf = vm.fase === "fine" && !cb.locale && !cb.torneo && ui.t.tastiFine && (!cb.guarda || ui.t.guarda || (cb.spettatore && !!ui.t.scelti))
      ? { host: !!cb.sonoHost && !cb.guarda, nuova: cb.sonoHost && !cb.guarda ? cb.onSaletta : null, esci: cb.onEsci } : null;
    if (vm.fase === "gioco") {
      if (cb.spettatore) { if (fa) voci.push(fa); voci.push(["f", "🏠 Esci", cb.onEsci]); }   // ("👀 Giocano in due: tu guardi" lo dice la pillola in alto)
      else if (cb.guarda) { if (fa) voci.push(fa); }   // (nel torneo a eliminazione chi guarda ha la fila qui)
      else if (cb.notaGioco) voci.push(["n", cb.notaGioco]);
      else if (vm.variante === "sparisce") voci.push(["n", "♻️ Tris che sparisce: al 4° segno sparisce il tuo più vecchio (quello chiaro)."]);
      if (chiac) voci.unshift(["c", ""]);
    } else if (cb.guarda && !cb.spettatore) {
      voci.push(["n", !ui.t.eliminazione ? "👀 Aspettiamo la prossima partita…" : (vm.fine && vm.fine.vincitore ? "Tra poco si torna al tabellone…" : "Pareggio: si rigioca!")]);
      if (fa) voci.push(fa);
    } else if (cb.spettatore) {
      if (fa) voci.push(fa); voci.push(["f", "🏠 Esci", cb.onEsci]);
    } else if (cb.torneo) {
      if (vm.fine && vm.fine.vincitore) voci.push(["p", "Avanti ▶", cb.onAvanti]);
      else { voci.push(["p", "🔄 Spareggio", cb.onSpareggio]); voci.push(["f", "🤝 Pari, avanti", cb.onAvanti]); }
    } else if (cb.locale || cb.sonoHost) {
      if (fa) voci.push(fa);
      voci.push(["p", cb.testoRivincita || "🔄 Rivincita", cb.onRivincita]); voci.push(["f", "🏠 Esci", cb.onEsci]);
      if (cb.notaFine) voci.push(["n", cb.notaFine]);
    } else {
      voci.push(["n", "Aspetta: la rivincita la fa partire " + (vm.nomi.X || "l'host") + "."]); if (fa) voci.push(fa); voci.push(["f", "🏠 Esci", cb.onEsci]);
    }
    var firma = (tf ? "tf|" + vm.n + "|" : "") + voci.map(function (v) { return v[0] + v[1]; }).join("|");
    ui.azioni = voci.map(function (v) { return v[2]; });   // le azioni si aggiornano sempre (i tasti restano gli stessi)
    if (firma === ui.firmaPiede) return;
    ui.firmaPiede = firma;
    ui.piede.innerHTML = "";
    var conFa = false;
    if (tf && ui.t.tastiFine(ui.piede, tf)) {   // li ha messi il core: sopra, le faccine
      var f0 = fa ? ui.t.faccine() : null;
      if (f0) { ui.piede.insertBefore(f0, ui.piede.firstChild); conFa = true; }
      voci = [];
    }
    voci.forEach(function (v, k) {
      if (v[0] === "fa") { var f = ui.t.faccine(); if (f) { ui.piede.appendChild(f); conFa = true; } return; }
      if (v[0] === "c") { ui.piede.appendChild(CH().tasto({ gioco: "tris", soloFaccine: !!ui.cb.guarda, onScegli: function (c) { if (ui.cb && ui.cb.onChiac) ui.cb.onChiac(c); } })); return; }
      if (v[0] === "n") ui.piede.appendChild(el("p", { class: "tr-nota" + (chiac ? " corta" : ""), text: v[1] }));
      else {
        var b = el("button", { class: "btn " + (v[0] === "p" ? "btn-primario" : "btn-fantasma"), text: v[1], onclick: function () { var f = ui.azioni[k]; if (f) f(); } });
        ui.piede.appendChild(b);
        // torneo a eliminazione: col pareggio si rigioca da soli (la rivincita ha il conto)
        if (v[0] === "p" && ui.t.eliminazione && vm.fase === "fine" && vm.fine && !vm.fine.vincitore && (cb.locale || cb.sonoHost) && ui.t.contoAvanti)
          ui.t.contoAvanti(b, 8, function () { var f = ui.azioni[k]; if (f) f(); });
      }
    });
    // con le faccine il piede è più alto: la griglia si fa un po' più piccola (niente scorre)
    if (ui.scena.classList.contains("con-fa") !== conFa) ui.scena.classList.toggle("con-fa", conFa);
    if (ui.scena.classList.contains("con-targa") !== targa) ui.scena.classList.toggle("con-targa", targa);   // (il posto della targhetta)
  }
  function fineEffetti(ui, vm, cb) {
    var w = vm.fine.vincitore;
    if (!w) { if (!cb.guarda) suono("pari"); return; }
    var mia = cb.mio === w || (cb.locale && !cb.bot), persa = !!cb.mio && cb.mio !== "-" && cb.mio !== w;
    if (persa) {
      if (!cb.guarda) suono("perdi");
      if (ui.griglia.animate) try { ui.griglia.animate([{ transform: "translateX(0)" }, { transform: "translateX(-9px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-5px)" }, { transform: "translateX(0)" }], { duration: 380, delay: 300 }); } catch (e) {}
      return;
    }
    if (mia || cb.guarda) {
      if (!cb.guarda) suono("vinci");
      coriandoli(ui, w === "X" ? CX : CO);
    }
  }
  // coriandoli leggeri: pochi pezzetti che volano (solo transform e opacity)
  function coriandoli(ui, colore) {
    if (!ui.scena.animate) return;
    var colori = [colore, "var(--o-oro)", "var(--o-oro-chiaro)", "var(--o-scuro)", colore];   // 🤍 coriandoli sobri: il colore del vincitore, oro e inchiostro
    for (var k = 0; k < 22; k++) (function (k) {
      var p = document.createElement("div"); p.className = "tr-cor"; p.style.background = colori[k % colori.length];
      ui.scena.appendChild(p);
      var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 150, dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 60;
      try {
        var an = p.animate([{ transform: "translate(-50%,-50%) rotate(0) scale(.6)", opacity: 1 },
          { transform: "translate(calc(-50% + " + dx.toFixed(0) + "px),calc(-50% + " + dy.toFixed(0) + "px)) rotate(" + (Math.random() * 540 - 270).toFixed(0) + "deg) scale(1)", opacity: 1, offset: 0.6 },
          { transform: "translate(calc(-50% + " + (dx * 1.15).toFixed(0) + "px),calc(-50% + " + (dy + 140).toFixed(0) + "px)) rotate(" + (Math.random() * 720 - 360).toFixed(0) + "deg) scale(.9)", opacity: 0 }],
          { duration: 1300 + Math.random() * 400, delay: 200 + k * 12, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
        an.onfinish = function () { if (p.parentNode) p.parentNode.removeChild(p); };
      } catch (e) {}
      setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 2400);
    })(k);
  }
  // la nuvoletta con la battuta (sopra l'avatar di chi parla)
  function fumetto(ui, k, testo) {
    if (!ui || !testo) return;
    var g = ui.gio[k]; g.fum.textContent = testo; g.fum.classList.add("on");
    clearTimeout(g.tFum); g.tFum = setTimeout(function () { g.fum.classList.remove("on"); }, 2600);
  }

  // ---- trofei: a fine partita si contano solo per chi ha il profilo su questo telefono ----
  // (contro il Bot e online sei tu; sullo stesso telefono conta solo partite e simboli di chi ha il nome del profilo:
  //  vittorie e pareggi lì si potrebbero fare da soli)
  function trofeiTris(vm, cb) {
    if (cb.guarda || cb.spettatore) return;   // chi guarda non gioca
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var io = cb.mio, nm = String(SGNube.profilo().nome || "").trim().toLowerCase();
    if (!io) io = String(vm.nomi.X || "").trim().toLowerCase() === nm ? "X" : (String(vm.nomi.O || "").trim().toLowerCase() === nm ? "O" : null);
    if (io !== "X" && io !== "O") return;
    var miei = vm.mosse ? vm.mosse[io] || 0 : vm.board.filter(function (x) { return x === io; }).length;
    if (cb.locale && !cb.bot) { SGNube.salvaProgressi(null, "tris", [["partite", 1], ["simboli", miei]]); return; }
    var w = vm.fine.vincitore, vinta = w === io, pari = !w, online = !cb.locale, bot = !!cb.bot, liv = cb.liv;
    var lin = (vm.fine.linea || []).join(",");
    var s0 = SGNube.statGioco("tris") || {};
    var c = { partite: 1, vinte: vinta, pareggi: pari, online: online, vinteOnline: online && vinta,
      vinteFacile: bot && liv === "facile" && vinta, vinteMedio: bot && liv === "medio" && vinta, vinteDifficile: bot && liv === "difficile" && vinta,
      vinteDiagonale: vinta && (lin === "0,4,8" || lin === "2,4,6"), vinteIn3: vinta && miei === 3 && !(bot && liv === "facile"), simboli: miei };   // (contro il Facile, che gioca a caso, non vale)
    var sPar = pari ? (s0.serieParOra || 0) + 1 : 0;                                                          // pareggi di fila
    var sOn = online ? (vinta ? (s0.serieOnlineOra || 0) + 1 : 0) : (s0.serieOnlineOra || 0);                 // vittorie online di fila
    var sDif = bot && liv === "difficile" ? (vinta || pari ? (s0.serieImbDiffOra || 0) + 1 : 0) : (s0.serieImbDiffOra || 0);   // imbattuto contro il Difficile
    var incrs = []; for (var k in c) if (c[k]) incrs.push([k, +c[k]]);
    SGNube.salvaProgressi(null, "tris", incrs, [["serieParMax", sPar], ["serieOnlineMax", sOn], ["serieImbDiffMax", sDif]],
      [["serieParOra", sPar], ["serieOnlineOra", sOn], ["serieImbDiffOra", sDif]]);
  }
  // com'è finita, per il core (XP, torneo): chi vince 1°, chi perde 2°; pari = tutti e due 1° (come Drop 4: il core
  // lo tratta come pareggio, nessuno vince; nel torneo a eliminazione si rigioca)
  function classificaDi(nomi, fine, botK) {   // botK: il segno del Bot (la sua riga ha bot: true)
    var r = classificaSola(nomi, fine); if (botK) r.forEach(function (x) { if (x.nome === nomi[botK]) x.bot = true; }); return r;
  }
  function classificaSola(nomi, fine) {
    if (!fine.vincitore) return [{ nome: nomi.X, pos: 1, pari: true }, { nome: nomi.O, pos: 1, pari: true }];
    return [{ nome: nomi[fine.vincitore], pos: 1 }, { nome: nomi[altro(fine.vincitore)], pos: 2 }];
  }

  // =========================================================
  //  LOCALE — contro il Bot oppure sullo stesso telefono
  // =========================================================
  function localeTris(t, modo, liv, torneo, imp) {
    var bot = modo === "bot", variante = imp.variante, inizia = imp.inizia || "turno";
    var lista = (t.giocatori || []).map(function (s) { return String(s || "").trim(); }).filter(Boolean);
    var ilBot = bot ? botDi(imp, liv, [lista[0] || "Tu", t.nomeProfilo && t.nomeProfilo()]) : null;
    var gente = bot ? [lista[0] || "Tu", ilBot.nome] : (torneo ? lista.slice(0, 2) : lista.slice());
    if (!bot) {
      if (!gente[0]) gente[0] = "Giocatore 1";
      if (!gente[1]) gente[1] = gente[0] === "Giocatore 2" ? "Giocatore 1" : "Giocatore 2";
      gente = gente.map(function (n, i) { return gente.indexOf(n) < i ? n + " " + (i + 1) : n; });   // due nomi uguali: il conto non si mescola
    }
    var sedia = { X: gente[0], O: gente[1] }, coda = gente.slice(2);   // chi vince resta: gli altri aspettano in fila
    var vittorie = {}, pari = {}, omini = {};
    var st = null, primo = "X", ultimaFine = null, n = 0, timer = null, chiuso = false, M = { ui: null, fase: null };
    var profilo = String((t.nomeProfilo && t.nomeProfilo()) || "").trim().toLowerCase();
    function ominoDi(nome) {
      if (!omini[nome]) omini[nome] = (bot || String(nome).toLowerCase() === profilo) && t.mioOmino ? t.mioOmino(nome) : (window.SGOmino ? SGOmino.casuale(nome) : "🙂");
      return omini[nome];
    }
    function coppia() { return [sedia.X, sedia.O].sort().join("|"); }
    function esci() { if (chiuso) return; chiuso = true; clearTimeout(timer); timer = null; t.esci(); }
    function vivo() { return !chiuso && (!M.ui || document.body.contains(M.ui.s)); }
    function vm() {
      return { fase: st.fine ? "fine" : "gioco", board: st.board, turno: st.turno, fine: st.fine, ord: st.ord, mosse: st.mosse, variante: st.variante,
        nomi: { X: sedia.X, O: sedia.O }, omini: { X: ominoDi(sedia.X), O: bot ? (ilBot.omino || "🤖") : ominoDi(sedia.O) },
        punti: { X: vittorie[sedia.X] || 0, O: vittorie[sedia.O] || 0, pari: pari[coppia()] || 0 }, n: n };
    }
    var tx = CH() ? CH().trasmettitore(t) : null;   // torneo a eliminazione: le chiacchiere arrivano anche a chi guarda
    var cb = { locale: true, bot: bot, mio: bot ? "X" : null, liv: liv, torneo: torneo,
      // 💬 contro il Bot: il mio fumetto, e ogni tanto Bot risponde
      onChiac: !bot ? null : function (c) {
        if (!vivo() || !CH() || !CH().valido("tris", c)) return;
        chiacTris(M.ui, "X", c); if (tx) tx({ t: "chiac", k: "X", id: "io", c: c });
        CH().rispondeBot(function (r) { if (!vivo() || !st || st.fine) return; chiacTris(M.ui, "O", r); if (tx) tx({ t: "chiac", k: "O", id: "bot", c: r }); });
      },
      onCella: function (i) { if (st && !st.fine && (!bot || st.turno === "X")) gioca(i); },
      onRivincita: rivincita, onEsci: esci,
      onSpareggio: function () { if (st && st.fine) nuova(); },
      onAvanti: function () { if (st && st.fine && !chiuso) { chiuso = true; t.fine(classificaDi(sedia, st.fine, bot && "O")); } } };
    function render() {
      if (!vivo()) { chiuso = true; clearTimeout(timer); timer = null; return false; }   // la partita è stata lasciata: non si rimette su
      var v = vm();
      if (t.trasmetti) t.trasmetti({ t: "vm", vm: v });   // torneo a eliminazione: gli altri guardano la partita col Bot
      var poi = coda.length ? "Chi vince resta · poi tocca a " + coda[0] : "";
      cb.notaGioco = poi ? (st.variante === "sparisce" ? "♻️ " : "") + poi : "";
      cb.testoRivincita = coda.length ? "▶ Avanti " + coda[0] : null;
      cb.notaFine = coda.length && st.fine ? (st.fine.vincitore ? sedia[st.fine.vincitore] + " resta, " + sedia[altro(st.fine.vincitore)] + " lascia il posto" : sedia[primo] + " (che aveva cominciato) lascia il posto") : "";
      campo(t, M, v, cb, false);
      return true;
    }
    function parla(tipo, prob) { if (bot && M.ui && Math.random() < (prob == null ? 1 : prob)) fumetto(M.ui, "O", battuta(tipo)); }
    function gioca(i) {
      if (!metti(st, i)) return;
      if (st.fine) finePartita();
      if (!render()) return;
      if (st.fine) { if (bot) parla(st.fine.vincitore === "O" ? "vince" : st.fine.vincitore ? "perde" : "pari"); }
      else if (bot && st.turno === "O") pensaBot();
    }
    function finePartita() {
      var w = st.fine.vincitore; ultimaFine = st.fine;
      if (w) vittorie[sedia[w]] = (vittorie[sedia[w]] || 0) + 1; else pari[coppia()] = (pari[coppia()] || 0) + 1;
      if (!torneo && t.risultato) t.risultato(classificaDi(sedia, st.fine, bot && "O"));   // XP e torneo a eliminazione (nel torneo su questo telefono basta t.fine)
    }
    // il Bot pensa un po' (più caselle libere = più tempo), poi muove; se nel frattempo si è usciti o è cominciata un'altra partita, non fa niente
    function pensaBot() {
      clearTimeout(timer);
      var questa = st, attesa = 420 + libere(st.board).length * 50 + Math.random() * 260;
      timer = setTimeout(function () {
        timer = null;
        if (!vivo() || st !== questa || st.fine || st.turno !== "O") return;
        var m = mossaBot(st, liv); if (!m) return;
        gioca(m.i);
        if (m.tipo && st === questa && !st.fine) parla(m.tipo, m.tipo === "sbaglia" ? 1 : 0.6);
      }, attesa);
    }
    function nuova(prima) {
      clearTimeout(timer); timer = null;
      primo = prima ? (inizia === "caso" ? scegliPrimo("caso") : "X") : scegliPrimo(inizia, primo, ultimaFine);
      st = nuovaPartita(primo, variante); n++;
      if (!render()) return;
      if (bot && st.turno === "O") { pensaBot(); parla("inizio", 0.45); }
      else if (bot) parla("inizio", 0.2);
    }
    function rivincita() {
      if (!st || !st.fine) return;
      if (coda.length) {   // chi vince resta; a pari esce chi aveva cominciato
        var esce = st.fine.vincitore ? altro(st.fine.vincitore) : primo;
        coda.push(sedia[esce]); sedia[esce] = coda.shift();
      }
      nuova(false);
    }
    nuova(true);
  }

  // =========================================================
  //  ONLINE — host è X, ospite è O (host-autoritativo, a turni)
  // =========================================================
  function hostTris(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var st = {
      fase: "lobby", codice: "…", pronta: false, p: nuovaPartita("X", imp.variante), primo: "X", n: 0,
      variante: imp.variante || "classico", inizia: imp.inizia || "turno",
      nomiX: (t.giocatori && t.giocatori[0]) || "Host", nomiO: null, avvId: null, ominoX: t.mioOmino ? t.mioOmino() : null, ominoO: null,
      punti: { X: 0, O: 0, pari: 0 }, ultimoO: "", sospesa: false, avviso: ""
    };
    var M = { ui: null, fase: null }, chiuso = false, rete = null;
    var ch = CH(), filtra = ch ? ch.filtro() : null;   // 💬 le faccine e le frasi (accese o spente dall'host nel ⚙️)
    st.ch = !!ch && ch.attive(imp);
    // ---- la ripresa: l'host ha ricaricato la pagina (o l'app si è chiusa) a metà partita → si continua dalla stessa mossa.
    // L'avversario è "via" finché non si rifà vivo (rientra da solo in un attimo); se in 30 s non torna è come se fosse
    // uscito (la partita resta a metà e si può riprendere)
    var CAMPI = ["fase", "p", "primo", "n", "variante", "inizia", "nomiO", "avvId", "ominoO", "punti", "ultimoO", "sospesa", "avviso", "uscito", "uscitoId", "uscitoT"];
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.tris, ricordata = !!RIP;
    if (RIP) {
      CAMPI.forEach(function (k) { if (RIP[k] !== undefined) st[k] = RIP[k]; });
      if (st.avvId) { st.avvVia = true; setTimeout(function () { if (!chiuso && st.avvVia && st.avvId) avvUscito(st.avvId); }, 30000); }
    }
    function ricorda() {   // dopo ogni cambiamento (in saletta non c'è niente da riprendere)
      if (!t.ricorda) return;
      if (st.fase === "lobby") { if (ricordata) { ricordata = false; t.ricorda(null); } return; }
      var o = {}; CAMPI.forEach(function (k) { o[k] = st[k]; });
      ricordata = true; t.ricorda({ tris: o });
    }
    function avvUscito(id) {
      if (id !== st.avvId) return;   // (uno che guardava e basta: niente da fare)
      st.avvVia = false;
      st.uscito = st.nomiO || ""; st.uscitoId = id; st.uscitoT = Date.now(); st.avvId = null; st.avviso = "😕 " + (st.nomiO || "L'avversario") + " è uscito.";
      if (st.fase === "gioco") st.sospesa = true;   // la partita a metà resta lì: si può riprendere
      st.fase = "lobby"; st.nomiO = null; bd();
    }
    // "⚙️ Regole" nella saletta: valgono dalla prossima partita (le chiacchiere subito)
    t.onRegole = function (im) { st.variante = im.variante || "classico"; st.inizia = im.inizia || "turno"; var c0 = st.ch; st.ch = !!ch && ch.attive(im); if (st.fase === "lobby" || c0 !== st.ch) bd(); };
    var bRicomincia = t.el("button", { class: "btn btn-fantasma", text: "🔄 Ricomincia da capo", onclick: function () { if (st.fase === "lobby" && st.avvId) nuovaGara(); } });
    rete = SGNet.ospita("tris", {
      onCodice: function (c) { st.codice = c; st.riserva = riservaAvv("tris", c); bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: avvUscito,
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (st.avvVia && id === st.avvId) st.avvVia = false;   // (ripresa) l'avversario si è rifatto vivo
        if (m.t === "join") {
          // la partita a metà resta per un po' a chi è uscito (telefono spento, app chiusa): se torna, riprende lui;
          // chi guardava prende il posto solo dopo 90 secondi
          var tienePosto = st.sospesa && st.uscitoId && id !== st.uscitoId && Date.now() - (st.uscitoT || 0) < 90000;
          var nome = String(m.nome || "Avversario").trim().slice(0, 16) || "Avversario";
          // (nella Sala gioca solo chi è stato scelto: gli altri guardano)
          if (!st.avvId && !tienePosto && !postoRiservato(st.riserva, id) && (!t.puoSedersi || t.puoSedersi(id, nome))) {
            if (nome !== st.ultimoO) st.punti = { X: 0, O: 0, pari: 0 };   // un avversario nuovo: il conto riparte
            st.avviso = st.uscito && st.uscito !== nome ? "🔄 " + st.uscito + " è uscito: ora gioca " + nome + "." : "";   // chi prende il posto di chi è uscito
            st.avvId = id; st.nomiO = nome; st.ultimoO = nome; st.ominoO = avatarOk(m.omino); st.uscito = ""; st.uscitoId = null;
          }
          bd();   // (chi rientra o chi guarda riceve la foto)
        }
        else if (m.t === "mossa") { if (st.fase === "gioco" && st.p.turno === "O" && id === st.avvId) applica(+m.i); }
        else if (m.t === "chiac" && st.fase !== "lobby") {   // 💬 dall'avversario (o una faccina da chi guarda): a tutti
          var x = chiacDaOspite(ch, filtra, st.ch, id, m, st.avvId);
          if (x) { rete.inviaVeloce(x); chiacTris(M.ui, x.k, x.c, x.n); }
        }
      },
      // (arriva solo se il primo collegamento non riesce: dopo, la rete si ricollega da sola)
      onErrore: function () { if (!chiuso && !st.pronta) { chiuso = true; errore(t, "Problema di collegamento. Controlla la connessione e riprova."); } }
    }, { ripresa: !!RIP });   // (ripresa: gli amici restano sul tavolo, non tornano in saletta)
    function vm() {
      var p = st.p;
      return { fase: st.fase, codice: st.codice, pronta: st.pronta, board: p.board, turno: p.turno, fine: p.fine, ord: p.ord, mosse: p.mosse, variante: p.variante,
        nomi: { X: st.nomiX, O: st.nomiO || st.ultimoO || "Avversario" }, avversario: !!st.avvId, avvId: st.avvId,
        omini: { X: st.ominoX, O: st.ominoO }, punti: st.punti, n: st.n, sospesa: st.sospesa, avviso: st.avviso, prossima: st.variante, ch: st.ch ? 1 : 0 };
    }
    function bd() {
      if (chiuso) return;
      ricordaAvv("tris", st.codice, st.avvId || (st.riserva && Date.now() < st.riserva.fino ? st.riserva.id : null));
      ricorda();
      if (rete) rete.invia({ t: "vm", vm: vm() }); disegna();
    }
    function applica(i) {
      if (st.fase !== "gioco" || !metti(st.p, i)) return;
      if (st.p.fine) {
        st.fase = "fine";
        var w = st.p.fine.vincitore; if (w) st.punti[w]++; else st.punti.pari++;
        if (t.risultato) t.risultato(classificaDi({ X: st.nomiX, O: st.nomiO }, st.p.fine));   // XP a tutti e torneo online
      }
      bd();
    }
    function nuovaGara() {
      st.primo = st.n ? scegliPrimo(st.inizia, st.primo, st.p.fine) : (st.inizia === "caso" ? scegliPrimo("caso") : "X");
      st.p = nuovaPartita(st.primo, st.variante); st.n++; st.sospesa = false; st.avviso = ""; st.fase = "gioco"; bd();
    }
    var cb = {
      sonoHost: true, mio: "X", ricomincia: bRicomincia,
      onChiac: function (c) { if (!st.ch || !rete || st.fase === "lobby" || !ch.valido("tris", c)) return; chiacTris(M.ui, "X", c); rete.inviaVeloce({ t: "chiac", k: "X", id: "host", c: c }); },
      onCella: function (i) { if (st.fase === "gioco" && st.p.turno === "X") applica(i); },
      onComincia: function () {
        if (st.fase !== "lobby" || !st.avvId) return;
        if (st.sospesa && !st.p.fine) { st.sospesa = false; st.avviso = ""; st.fase = "gioco"; return bd(); }   // si riprende da dove era rimasta
        nuovaGara();
      },
      onRivincita: function () { if (st.fase === "fine" && st.avvId) nuovaGara(); },
      // la rivincita dei tasti di fine comuni: si torna nella saletta con lo stesso avversario (il core fa il 3-2-1)
      onSaletta: function () { if (st.fase === "fine" && st.avvId) { st.fase = "lobby"; st.avviso = ""; bd(); } },
      onEsci: function () { if (chiuso) return; if (t.ricorda) t.ricorda(null); chiuso = true; if (rete) rete.chiudi(); t.esci(); }   // (uscito apposta: niente da riprendere)
    };
    t.onRivincita = cb.onSaletta;
    function disegna() {
      if (chiuso) return;
      var v = vm();
      if (v.fase === "lobby") { M.fase = "lobby"; return lobbyTris(t, v, cb); }
      campo(t, M, v, cb, true);
    }
    disegna();
  }

  function ospiteTris(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null, chiuso: false, scritta: null }, M = { ui: null, fase: null };
    function esci() { if (S.chiuso) return; S.chiuso = true; if (S.rete) S.rete.chiudi(); t.esci(); }
    // gioca solo l'avversario vero (il suo id è nella foto dell'host): chi è in più guarda, senza "Tu" né "Tocca a te"
    var cbG = { sonoHost: false, mio: "O", prova: true, onCella: function (i) { if (S.rete) S.rete.invia({ t: "mossa", i: i }); }, onComincia: function () {}, onEsci: esci,
      // 💬 il mio fumetto subito, poi lo manda l'host a tutti (il suo "rimando" a me non si rifà)
      onChiac: function (c) { if (!S.rete || !CH() || !CH().valido("tris", c)) return; chiacTris(M.ui, "O", c); S.rete.invia({ t: "chiac", c: c }); } };
    var cbS = { spettatore: true, guarda: true, sonoHost: false, mio: "-", onCella: function () {}, onEsci: esci };   // si gioca in due: si guarda
    function disegna() {
      if (S.chiuso || !S.vm) return;
      var vm = S.vm, cb = (!vm.avvId || vm.avvId === S.myId) ? cbG : cbS;
      cbG.myId = cbS.myId = S.myId;
      S.scritta = null;
      if (vm.fase === "lobby") { M.fase = "lobby"; return lobbyTris(t, vm, cb); }
      campo(t, M, vm, cb, true);
    }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "⭕", titolo: "Entra nel Tris", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        if (S.rete) return;
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita: controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (S.chiuso || !m) return;
          if (m.t === "chiac") { if (m.id !== S.myId) chiacTris(M.ui, m.k, m.c, m.n); return; }   // 💬 di un altro
          if (m.t !== "vm" || !m.vm || !m.vm.board) return;
          S.vm = m.vm; disegna();
        },
        onHostVia: function (sparito) { cbG.hostVia = cbS.hostVia = !!sparito; disegna(); },
        onChiuso: function () { if (S.chiuso) return; S.chiuso = true; if (S.rete) S.rete.chiudi(); chiusa(t, S.vm, cbG.hostVia); },
        onErrore: function () { if (!S.chiuso && !S.vm) errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }   // (solo se il primo collegamento non riesce)
      });
    }
  }

  // chi guarda soltanto (torneo a eliminazione, duello della Sala, "👀 Guarda"): la vede in diretta, senza poter toccare.
  // Le sue faccine passano dal core (la fila t.faccine(), o il 😂 della targhetta): le sue mosse il core le butta
  function guardaTris(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var rete = null, S = { scritta: null, chiuso: false }, M = { ui: null, fase: null };   // (chi guarda: niente suoni né trofei)
    var cb = { guarda: true, sonoHost: false, mio: "-", onCella: function () {}, onRivincita: function () {},
      onEsci: function () { if (S.chiuso) return; S.chiuso = true; if (rete) rete.chiudi(); t.esci(); } };
    attesa(t, S, "👀 Mi collego alla partita…", cb.onEsci);
    rete = SGNet.entra(codice, {
      onMsg: function (m) {
        if (S.chiuso || !m) return;
        if (m.t === "chiac") { if (!rete || m.id !== rete.mioId) chiacTris(M.ui, m.k, m.c, m.n); return; }   // 💬 dei due che giocano (o di chi guarda)
        if (m.t !== "vm" || !m.vm || !m.vm.board) return;
        if (m.vm.fase === "lobby") { M.fase = "lobby"; return attesa(t, S, "👀 La partita sta per cominciare…", cb.onEsci); }
        S.scritta = null;
        campo(t, M, m.vm, cb, true);
      },
      onChiuso: function () { cb.onEsci(); },   // partita finita e chiusa: si torna al tabellone
      onErrore: function () { if (!S.chiuso) errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
    });
  }

  function avatarOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // l'avversario di questa stanza, ricordato sul telefono dell'host: se la pagina dell'host si ricarica (la stanza si
  // riapre con lo stesso codice), per 15 secondi il posto resta a chi giocava, non a chi guardava ed è stato più svelto
  function ricordaAvv(gioco, codice, id) { try { if (codice && codice !== "…") localStorage.setItem("sg-avv-" + gioco, JSON.stringify({ c: codice, id: id || null, t: Date.now() })); } catch (e) {} }
  function riservaAvv(gioco, codice) {
    try { var x = JSON.parse(localStorage.getItem("sg-avv-" + gioco) || "null"); if (x && x.c === codice && x.id && Date.now() - x.t < 20 * 60000) return { id: x.id, fino: Date.now() + 15000 }; } catch (e) {}
    return null;
  }
  function postoRiservato(r, id) { return !!(r && r.id !== id && Date.now() < r.fino); }   // true = questo posto non è (ancora) per lui
  // la saletta d'attesa (uguale per tutti i giochi): tu e il tuo avversario
  function lobbyTris(t, vm, cb) {
    // "tu" solo per l'avversario vero (il suo id è nella foto): chi è in più guarda
    var io = !cb.sonoHost && !!cb.myId && vm.avvId === cb.myId, guardo = !cb.sonoHost && !!vm.avvId && !io;
    var om = vm.omini || {}, gio = [{ id: "X", nome: vm.nomi.X, omino: om.X || null, host: true, tu: !!cb.sonoHost }];
    if (vm.avversario) gio.push({ id: vm.avvId || "O", nome: vm.nomi.O, omino: om.O || null, tu: io });
    var nota = null, extra = [], sparisce = (vm.sospesa ? vm.variante : vm.prossima) === "sparisce";
    if (cb.sonoHost) {
      nota = vm.avviso ? vm.avviso + " " : "";
      if (vm.sospesa) nota += vm.avversario ? "La partita era a metà: riprendila da dove era rimasta, o ricomincia da capo." : "Quando rientra (o entra un altro), la partita riprende da dove era rimasta.";
      else nota += vm.avversario ? "✅ Avversario collegato! Quando vuoi, comincia." : "Invita il tuo avversario col tasto 📤.";
      if (vm.sospesa && vm.avversario && cb.ricomincia) extra.push(cb.ricomincia);
    }
    var att = guardo ? "👀 Giocano " + vm.nomi.X + " e " + vm.nomi.O + ": tu guardi."
      : (!cb.sonoHost && !io) ? "⏳ Entro nella partita…"   // (l'host non mi ha ancora messo come avversario)
      : (vm.sospesa ?"La partita era a metà: aspetta che " + vm.nomi.X + " la riprenda." : "Aspetta che " + vm.nomi.X + " cominci: tu giochi con il cerchio ⭕.");
    if (sparisce) att += " Si gioca a ♻️ Tris che sparisce.";
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, vuoti: vm.avversario ? 0 : 1, giocatori: gio, extra: extra,
      testoComincia: vm.sospesa ? "▶ Riprendi la partita" : null,
      nota: nota, attesa: att, onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  // una scritta d'attesa semplice (chi guarda), rifatta solo se cambia
  function attesa(t, S, txt, onEsci) {
    if (S.scritta === txt) return; S.scritta = txt;
    stile();   // (lo stile del gioco serve anche qui: il ‹ in alto a sinistra)
    var s = t.schermata({ indietro: onEsci });
    s._contenuto.appendChild(t.el("p", { class: "modulo-nota guarda-attesa tr-attesa", text: txt }));
    if (!t.linkParams || !t.linkParams.guarda) s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: onEsci }));
    else if (t.eliminazione && t.faccine) { var fa = t.faccine(); if (fa) s._piede.appendChild(fa); }   // (fuori dal torneo le faccine sono nella targhetta)
    t.mostra(s);
  }
  // l'host ha chiuso la partita (o non risponde più): niente errore, un saluto col conto finale
  function chiusa(t, vm, sparito) {
    var host = (vm && vm.nomi && vm.nomi.X) || "L'host";
    var s = t.schermata({ icona: "🏁", titolo: "Partita chiusa" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.1rem;line-height:1.5;text-align:center", text: sparito ? host + " non risponde più: la partita è finita." : host + " ha chiuso la partita." }));
    if (vm && vm.punti && vm.n) {
      var p = vm.punti;
      s._contenuto.appendChild(t.el("p", { style: "font-size:1.35rem;font-weight:900;text-align:center;margin-top:10px",
        html: "<span style='color:" + CX + "'>" + esc(vm.nomi.X) + "</span> " + cifre(p.X) + " – " + cifre(p.O) + " <span style='color:" + CO + "'>" + esc(vm.nomi.O) + "</span>" + (p.pari ? "<br><small style='font-size:.85rem;opacity:.75'>" + cifre(p.pari) + " pareggi</small>" : "") }));
    }
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }

  function errore(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca contro il Bot o in due sullo stesso telefono." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
})();
