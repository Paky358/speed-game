/* =========================================================
   GIOCO — "Drop 4" (quattro in fila / a gravità)
   Griglia 7 colonne × 6 righe (42 caselle), struttura grigia.
   Giocatore 1 = pedine GIALLE, Giocatore 2 = pedine BIANCHE.
   Si sceglie una colonna: la pedina CADE in fondo, sul primo posto
   libero. Vince chi allinea 4 pedine (orizzontale, verticale o
   diagonale). Se si riempie tutto senza allineamenti: pareggio.
   Modi: contro il Bot (Facile/Medio/Difficile), in due sullo stesso
   telefono, oppure online (host=Giallo, ospite=Bianco, gli altri guardano).
   ========================================================= */
(function () {
  "use strict";

  var COLS = 7, ROWS = 6, N = COLS * ROWS;
  var CG = "#ffd43b", CB = "#f8f9fa";          // giallo, bianco (le pedine)
  var TG = "#ffd43b", TB = "#f8f9fa";          // 🌙 gli stessi due colori per le SCRITTE sul fondo scuro (oltre 10:1)
  var ORD = [3, 2, 4, 1, 5, 0, 6];              // colonne dal centro (per il bot)
  var ISTANZA = 0;                              // ogni partita aperta ha il suo numero (per i trofei)

  // ---- faccine e frasi durante la partita (il pezzo comune è in scopa.js: window.SGChiacchiere) ----
  function CH() { return window.SGChiacchiere || null; }
  // chi parla: "G" / "B" = un giocatore (fumetto sotto il suo avatar); se no chi guarda (in basso a sinistra, col nome)
  function chiacDrop(ui, k, c, nome) {
    var X = CH(); if (!X || !ui || !document.body.contains(ui.s)) return;
    var muto = !!(ui.cb && (ui.cb.guarda || ui.cb.spettatore));   // (chi guarda: niente suoni)
    if (k === "G" || k === "B") X.bolla(ui.gio[k].box, "drop4", c, { sotto: true, muto: muto });
    else X.volante("drop4", c, nome, muto);
  }

  function idx(r, c) { return r * COLS + c; }
  function altro(s) { return s === "G" ? "B" : "G"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function colore(s) { return s === "G" ? CG : CB; }
  function nomeCol(s, nome) { return "<span style='color:" + (s === "G" ? TG : TB) + "'>" + esc(nome) + "</span>"; }
  function pallino(s) { return "<i class='d4-pal " + (s === "G" ? "g" : "b") + "'></i>"; }   // la pedina, piccola, dentro il testo

  // ---- suoni (niente vibrazione: quella c'è solo quando tocchi tu per scegliere) ----
  // la pedina che cade e si incastra nel posto (un "tock" pieno + click di contatto + assestamento)
  function suonoDrop() {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(85, t + 0.11);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.18);
      var dur = 0.03, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2600;
      var gn = ctx.createGain(); gn.gain.setValueAtTime(0.35, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(hp); hp.connect(gn); gn.connect(ctx.destination); src.start(t); src.stop(t + dur + 0.01);
      var o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = "triangle"; o2.frequency.setValueAtTime(150, t + 0.09); o2.frequency.exponentialRampToValueAtTime(92, t + 0.16);
      g2.gain.setValueAtTime(0.0001, t + 0.09); g2.gain.exponentialRampToValueAtTime(0.18, t + 0.1); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o2.connect(g2); g2.connect(ctx.destination); o2.start(t + 0.09); o2.stop(t + 0.22);
    } catch (e) {}
  }
  // fine partita: fanfara (vinto), tre note che scendono (perso), due note uguali (pari)
  function suonoFine(tipo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    var note = tipo === "vinto" ? [523, 659, 784, 1047] : (tipo === "perso" ? [392, 330, 262] : [440, 440]);
    var passo = tipo === "vinto" ? 0.11 : 0.17;
    try {
      var t0 = ctx.currentTime + 0.02;
      note.forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + i * passo, lunga = i === note.length - 1 ? 0.45 : 0.16;
        o.type = tipo === "vinto" ? "square" : "triangle"; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(tipo === "vinto" ? 0.12 : 0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + lunga);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + lunga + 0.02);
      });
    } catch (e) {}
  }

  // ---- regole ----
  // tutte le 69 quaterne vincenti (indici 0..41) e, per ogni casella, quelle che ci passano
  var LINEE4 = (function () {
    var L = [], r, c;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS - 3; c++) L.push([idx(r, c), idx(r, c + 1), idx(r, c + 2), idx(r, c + 3)]);          // orizzontali
    for (c = 0; c < COLS; c++) for (r = 0; r < ROWS - 3; r++) L.push([idx(r, c), idx(r + 1, c), idx(r + 2, c), idx(r + 3, c)]);          // verticali
    for (r = 0; r < ROWS - 3; r++) for (c = 0; c < COLS - 3; c++) L.push([idx(r, c), idx(r + 1, c + 1), idx(r + 2, c + 2), idx(r + 3, c + 3)]); // diag \
    for (r = 3; r < ROWS; r++) for (c = 0; c < COLS - 3; c++) L.push([idx(r, c), idx(r - 1, c + 1), idx(r - 2, c + 2), idx(r - 3, c + 3)]);     // diag /
    return L;
  })();
  var PER_CELLA = (function () {
    var P = [], i; for (i = 0; i < N; i++) P.push([]);
    LINEE4.forEach(function (l) { l.forEach(function (x) { P[x].push(l); }); });
    return P;
  })();

  function vincitoreDrop(b) {
    for (var k = 0; k < LINEE4.length; k++) {
      var l = LINEE4[k], a = b[l[0]];
      if (a && a === b[l[1]] && a === b[l[2]] && a === b[l[3]]) return { s: a, celle: l };
    }
    return null;
  }
  // la pedina appena messa in i fa 4? (guarda solo le righe che passano di lì: veloce)
  function vinceDa(b, i) {
    var s = b[i], L = PER_CELLA[i];
    if (!s) return false;
    for (var k = 0; k < L.length; k++) { var l = L[k]; if (b[l[0]] === s && b[l[1]] === s && b[l[2]] === s && b[l[3]] === s) return true; }
    return false;
  }
  function colonnaLibera(b, c) { return b[idx(0, c)] == null; }
  function colonneLibere(b) { var o = []; for (var c = 0; c < COLS; c++) if (colonnaLibera(b, c)) o.push(c); return o; }
  function cadi(b, c, s) { for (var r = ROWS - 1; r >= 0; r--) { if (b[idx(r, c)] == null) { b[idx(r, c)] = s; return r; } } return -1; }
  function rigaLibera(b, c) { for (var r = ROWS - 1; r >= 0; r--) if (b[idx(r, c)] == null) return r; return -1; }
  function boardVuota() { var a = []; for (var i = 0; i < N; i++) a.push(null); return a; }
  function contaPezzi(b) { var n = 0; for (var i = 0; i < b.length; i++) if (b[i]) n++; return n; }
  function vinceColonna(b, c, s) { var r = cadi(b, c, s); if (r < 0) return false; var w = vinceDa(b, idx(r, c)); b[idx(r, c)] = null; return w; }

  // =========================================================
  //  IL BOT
  //  Facile: vince se può, a volte para, poi quasi a caso.
  //  Medio: guarda 4 mosse avanti, con un po' di caso tra le mosse buone.
  //  Difficile: guarda fino a 9 mosse avanti (con un tempo massimo) e conosce le "minacce" sulle righe giuste.
  // =========================================================
  var BOT = { primo: "G", nodi: 0, scad: 0 }, STOP = { stop: 1 };
  // un buco che completerebbe 4 ma non si può ancora riempire (sotto è vuoto): una minaccia "di riserva".
  // Vale di più sulle righe giuste: chi ha cominciato vuole le righe dispari contando da sotto, l'altro le pari.
  function minaccia(b, i, s) {
    var r = Math.floor(i / COLS);
    if (r === ROWS - 1 || b[i + COLS]) return 0;   // si può giocare subito: ci pensa la ricerca
    var daSotto = ROWS - r, giusta = (s === BOT.primo) ? (daSotto % 2 === 1) : (daSotto % 2 === 0);
    return giusta ? 10 : 4;
  }
  function valuta(b, me) {
    var opp = altro(me), s = 0, r, k, j;
    for (r = 0; r < ROWS; r++) { var v = b[idx(r, 3)]; if (v === me) s += 3; else if (v === opp) s -= 3; }   // il centro conta
    for (k = 0; k < LINEE4.length; k++) {
      var l = LINEE4[k], nm = 0, no = 0, vuota = -1;
      for (j = 0; j < 4; j++) { var x = b[l[j]]; if (x === me) nm++; else if (x === opp) no++; else vuota = l[j]; }
      if (nm && no) continue;
      if (nm === 3) s += 5 + minaccia(b, vuota, me);
      else if (no === 3) s -= 5 + minaccia(b, vuota, opp);
      else if (nm === 2) s += 2;
      else if (no === 2) s -= 2;
    }
    return s;
  }
  // ricerca "negamax" con potatura: il punteggio è sempre visto da chi deve muovere
  function nega(b, prof, alpha, beta, turno, pezzi) {
    if (pezzi >= N) return 0;
    if (prof === 0) return valuta(b, turno);
    if ((++BOT.nodi & 1023) === 0 && Date.now() > BOT.scad) throw STOP;
    var best = -Infinity;
    for (var k = 0; k < COLS; k++) {
      var c = ORD[k]; if (b[c] != null) continue;
      var r = cadi(b, c, turno), i = idx(r, c), s;
      if (vinceDa(b, i)) s = 100000 + prof;   // vincere prima vale di più
      else s = -nega(b, prof - 1, -beta, -alpha, altro(turno), pezzi + 1);
      b[i] = null;
      if (s > best) best = s;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }
  function ordina(mosse) { var o = []; for (var i = 0; i < ORD.length; i++) if (mosse.indexOf(ORD[i]) >= 0) o.push(ORD[i]); return o; }
  // il punteggio di ogni colonna, guardando prof mosse avanti (null = tempo finito)
  function punteggi(b, me, prof, ms) {
    BOT.scad = Date.now() + ms; BOT.nodi = 0;
    var pezzi = contaPezzi(b), out = {}, bb = b.slice();
    try {
      ordina(colonneLibere(bb)).forEach(function (c) {
        var r = cadi(bb, c, me), i = idx(r, c);
        out[c] = vinceDa(bb, i) ? 100000 + prof : -nega(bb, prof - 1, -Infinity, Infinity, altro(me), pezzi + 1);
        bb[i] = null;
      });
    } catch (e) { if (e !== STOP) throw e; return null; }
    return out;
  }
  // la mossa migliore: sempre più a fondo finché c'è tempo (si tiene l'ultima ricerca finita)
  function migliore(b, me, profMax, ms) {
    BOT.scad = Date.now() + ms; BOT.nodi = 0;
    var pezzi = contaPezzi(b), ordine = ordina(colonneLibere(b)), scelta = ordine[0];
    for (var p = 1; p <= profMax && p <= N - pezzi; p++) {
      try {
        var bb = b.slice(), alpha = -Infinity, best = -Infinity, bm = ordine[0];
        for (var k = 0; k < ordine.length; k++) {
          var c = ordine[k], r = cadi(bb, c, me), i = idx(r, c);
          var s = vinceDa(bb, i) ? 100000 + p : -nega(bb, p - 1, -Infinity, -alpha, altro(me), pezzi + 1);
          bb[i] = null;
          if (s > best) { best = s; bm = c; }
          if (best > alpha) alpha = best;
        }
        scelta = bm;
        ordine = [bm].concat(ordine.filter(function (x) { return x !== bm; }));   // la migliore si prova per prima la volta dopo
        if (best >= 90000 || best <= -90000) break;   // vittoria (o sconfitta) già sicura
      } catch (e) { if (e !== STOP) throw e; break; }
    }
    return scelta;
  }
  function aCaso(a) { return a[Math.floor(Math.random() * a.length)]; }
  function mossaBot(b, me, liv, primo) {
    var mosse = colonneLibere(b), i;
    if (!mosse.length) return -1;
    BOT.primo = primo || "G";
    for (i = 0; i < mosse.length; i++) if (vinceColonna(b, mosse[i], me)) return mosse[i];   // vince subito
    if (liv === "facile") {
      if (Math.random() < 0.6) for (i = 0; i < mosse.length; i++) if (vinceColonna(b, mosse[i], altro(me))) return mosse[i];   // a volte para
      var pesi = []; mosse.forEach(function (c) { pesi.push(c); if (c >= 2 && c <= 4) pesi.push(c); });   // un po' più spesso al centro
      return aCaso(pesi);
    }
    if (liv === "medio") {
      var sc = punteggi(b, me, 4, 500);
      if (!sc) { for (i = 0; i < mosse.length; i++) if (vinceColonna(b, mosse[i], altro(me))) return mosse[i]; return aCaso(mosse); }
      var best = -Infinity; mosse.forEach(function (c) { if (sc[c] > best) best = sc[c]; });
      var buone = mosse.filter(function (c) { return sc[c] >= best - 3 && (sc[c] > -90000 || best <= -90000); });
      return aCaso(buone.length ? buone : mosse);
    }
    // difficile: all'inizio il centro (la mossa migliore), poi la ricerca profonda
    if (contaPezzi(b) <= 1 && colonnaLibera(b, 3)) return 3;
    return migliore(b, me, 9, 900);
  }

  // =========================================================
  //  REGISTRAZIONE
  // =========================================================
  SG.registra({
    id: "drop4",
    tema: "oro",   // 🤍 Bianco e oro: tutto il gioco è chiaro
    nome: "Drop 4",
    icona: "🟡",
    descrizione: "Quattro in fila a gravità: fai cadere le pedine in colonna e allinea quattro dello stesso colore. Contro il Bot, in due o online.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 2,
    postiOnline: 2,   // online si gioca in due: gli altri guardano
    riprende: true,   // se l'host ricarica la pagina, la partita riprende dalla stessa mossa (t.ripresa)
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    // la riga «📜 Si gioca così» della saletta
    riassunto: function (imp) { var p = imp && imp.primo; return "Comincia " + (p === "ospite" ? "chi entra" : p === "caso" ? "chi capita, a sorte" : "chi apre la stanza"); },
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Giochi da solo contro il Bot" },
      { modo: "telefono", icona: "📱", nome: "In due su questo telefono", sotto: "Vi passate il telefono a ogni mossa", amici: true }],
    regole: [
      "Griglia di <b>7 colonne × 6 righe</b>. Si gioca a turni: <b>Giallo</b> contro <b>Bianco</b>.",
      "Nel tuo turno tocca una <b>colonna</b> (o tieni il dito e spostalo, poi lascia): la pedina <b>cade in fondo</b>, sul primo posto libero.",
      "Una colonna piena (6 pedine) non si può più usare: scegline un'altra.",
      "Vince chi allinea <b>4 pedine</b> del suo colore: in orizzontale, verticale o diagonale.",
      "Se si riempiono tutte le 42 caselle senza un allineamento, è <b>pareggio</b>.",
      "Con la <b>rivincita</b> comincia l'altro, e in alto si tiene il conto delle vittorie.",
      "Online: uno apre la stanza, l'altro entra col codice. Se entra un terzo amico, <b>guarda la partita</b>."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = aiuti.modo || "bot"; dove.difficolta = "medio"; dove.primo = "host"; dove.torneo = !!aiuti.torneo;
      if (aiuti.torneo) { dove.modo = "telefono"; return; }
      // una fila di scelte (bottoni .modo-chip: così l'host le ritrova in "⚙️ Regole" nella saletta)
      function scelte(etichetta, voci, chiave) {
        box.appendChild(el("div", { class: "etichetta", text: etichetta }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + voci.length + ",1fr)" });
        voci.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v[0] ? " attiva" : ""), style: "justify-content:center;text-align:center", onclick: function () {
            dove[chiave] = v[0];
            [].forEach.call(g.children, function (x) { x.classList.remove("attiva"); });
            b.classList.add("attiva");
          } }, [el("div", { class: "mt", text: v[1] })]);
          g.appendChild(b);
        });
        box.appendChild(g);
      }
      if (dove.modo === "bot") scelte("Bravura del Bot", [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]], "difficolta");
      else if (dove.modo === "online") scelte("Chi comincia la prima partita", [["host", "🟡 Chi apre"], ["ospite", "⚪ Chi entra"], ["caso", "🎲 A caso"]], "primo");
      if (dove.modo === "online" && CH()) CH().regola(el, box, dove);   // 💬 faccine e frasi durante la partita (l'host le può spegnere)
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return t.linkParams.guarda ? guardaDrop(t, t.linkParams.stanza) : ospiteDrop(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostDrop(t);
      return localeDrop(t, imp.modo === "telefono" ? "telefono" : "bot", imp.difficolta || "medio", !!imp.torneo);
    }
  });

  // =========================================================
  //  STILE (una volta sola)
  // =========================================================
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.id = "sg-drop-css";
    st.textContent = [
      // 🤍 Bianco e oro: tutto il gioco è chiaro (tema: "oro"). Colori solo con le variabili --o-* (css/styles.css);
      // la tavola resta un oggetto blu scuro, incorniciata d'oro; pedine gialle e bianche come sempre
      ".schermata.d4-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden}",
      ".schermata.d4-piena>.testa,.schermata.d4-piena>.piede{display:none}",
      ".schermata.d4-piena>.contenuto{height:100%;margin:0;padding:0}",
      // il ‹ in alto a sinistra delle schermate d'attesa: bianco col filo d'oro (prima velo nero con la freccia bianca)
      ".oro.g-drop4.senza-testa>.testa .btn-piccolo{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra)}",
      ".d4-scena{--d4w:min(88vw,calc(var(--alt,100dvh) - 232px),500px);position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 8px calc(10px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".d4-esci{position:absolute;top:calc(8px + env(safe-area-inset-top));left:8px;width:38px;height:38px;border-radius:50%;border:0;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra);font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer;z-index:5}",
      ".d4-gioc{width:var(--d4w);display:flex;align-items:flex-end;justify-content:center;gap:6px;padding:0 34px;box-sizing:border-box}",
      ".d4-g{--av:54px;position:relative;flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;opacity:.55;transform:scale(.9);transition:opacity .25s,transform .25s}",
      ".d4-g.turno,.d4-g.vince{opacity:1;transform:scale(1)}",
      ".d4-g.via{opacity:.3}",
      ".d4-av{width:var(--av);height:var(--av);border-radius:50%;background:var(--o-carta-2);border:3px solid;box-shadow:var(--o-ombra);overflow:hidden;display:flex;align-items:flex-end;justify-content:center;font-size:1.9rem;line-height:var(--av)}",
      ".d4-av svg{width:100%;height:100%;display:block}",
      ".d4-g.G .d4-av{border-color:" + CG + "}.d4-g.B .d4-av{border-color:" + CB + "}",
      ".d4-g.vince .d4-av{box-shadow:0 0 0 2px var(--o-carta),0 0 0 4.5px var(--o-oro)}",
      // la pedina di ognuno, piccola sull'angolo dell'avatar (il giallo da solo non si legge sul bianco)
      ".d4-g::after{content:'';position:absolute;top:calc(var(--av) + 6px - 20px);left:calc(50% + (var(--av) + 6px) / 2 - 14px);width:20px;height:20px;border-radius:50%;box-shadow:0 0 0 2px var(--o-carta-piena),0 1px 4px rgba(0,0,0,.5),inset 0 -2px 0 rgba(0,0,0,.14)}",
      ".d4-g.G::after{background:radial-gradient(circle at 36% 30%,#fff6c4 0,#ffd43b 42%,#e8a800 100%)}",
      ".d4-g.B::after{background:radial-gradient(circle at 36% 30%,#fff 0,#f1f3f5 45%,#c3c8cf 100%)}",
      ".d4-nome{font-weight:800;font-size:.88rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--o-testo)}",
      ".d4-serie{flex:0 0 auto;font-family:var(--o-tit);font-weight:700;font-size:2rem;font-variant-numeric:lining-nums tabular-nums;padding-bottom:12px;white-space:nowrap;color:var(--o-testo)}",
      // il «VS» di prima della sfida: una pillola di vetro col filo, scritta tenue (al posto dell'emoji 🆚, che era un riquadro grigio)
      ".d4-serie.vs{font-family:var(--o-tit);font-size:.78rem;font-weight:800;letter-spacing:.1em;line-height:1;padding:7px 11px;margin-bottom:34px;border-radius:999px;color:var(--o-tenue);background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo),inset 0 1px 0 rgba(255,255,255,.06),0 6px 14px -8px rgba(0,0,0,.8)}",
      ".d4-stato{font-family:var(--o-tit);font-weight:700;font-size:1.5rem;min-height:1.3em;text-align:center;line-height:1.2;color:var(--o-testo)}",
      ".d4-stato.pop{animation:d4Pop .45s ease-out}",
      // il pallino della pedina nel testo («Tocca a te ●»): una pedina vera, col filo, leggibile anche sul bianco
      ".d4-pal{display:inline-block;width:.8em;height:.8em;border-radius:50%;vertical-align:-.06em;box-shadow:inset 0 -.1em 0 rgba(0,0,0,.14),0 0 0 1px rgba(255,255,255,.2)}",
      ".d4-pal.g{background:radial-gradient(circle at 36% 30%,#fff6c4 0,#ffd43b 42%,#e8a800 100%)}",
      ".d4-pal.b{background:radial-gradient(circle at 36% 30%,#fff 0,#f1f3f5 45%,#c3c8cf 100%)}",
      "@keyframes d4Pop{0%{transform:scale(.7);opacity:.3}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}",
      ".d4-area{width:var(--d4w);touch-action:none;cursor:pointer}",
      ".d4-mano{position:relative;width:100%;height:calc(var(--d4w) / 7)}",
      // la tavola: blu scuro, con la cornice d'oro e un passe-partout bianco
      ".d4-tav{position:relative;width:100%;aspect-ratio:7/6;border-radius:14px;overflow:hidden;background:#0f1a3d;box-shadow:0 0 0 2px var(--o-oro),0 0 0 5px var(--o-carta),0 0 0 6px var(--o-filo-oro),var(--o-ombra-alta)}",
      ".d4-p{position:absolute;width:calc(100% / 7);height:calc(100% / 6);visibility:hidden;will-change:transform}",
      ".d4-mano .d4-p{height:100%;top:0}",
      ".d4-p.g,.d4-p.b{visibility:visible}",
      ".d4-p::before{content:'';position:absolute;inset:5%;border-radius:50%}",
      ".d4-p.g::before{background:radial-gradient(circle at 36% 30%,#fff6c4 0,#ffd43b 42%,#e8a800 100%);box-shadow:inset 0 -3px 0 rgba(0,0,0,.18),inset 0 0 0 5px rgba(0,0,0,.07)}",
      ".d4-p.b::before{background:radial-gradient(circle at 36% 30%,#fff 0,#f1f3f5 45%,#c3c8cf 100%);box-shadow:inset 0 -3px 0 rgba(0,0,0,.16),inset 0 0 0 5px rgba(0,0,0,.06)}",
      ".d4-mano .d4-p{opacity:.95}",
      // la pedina «in mano» sta sul fondo chiaro: ha bisogno di un filo attorno
      ".d4-mano .d4-p.g::before{box-shadow:inset 0 -3px 0 rgba(0,0,0,.18),inset 0 0 0 5px rgba(0,0,0,.07)}",
      ".d4-mano .d4-p.b::before{box-shadow:inset 0 -3px 0 rgba(0,0,0,.16),inset 0 0 0 5px rgba(0,0,0,.06)}",
      ".d4-telaio{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
      ".d4-segni{position:absolute;inset:0;pointer-events:none}",
      ".d4-meta{position:absolute;width:calc(100% / 7);height:calc(100% / 6);display:none}",
      ".d4-meta::before{content:'';position:absolute;inset:12%;border-radius:50%;border:3px dashed currentColor;opacity:.75}",
      ".d4-anello{position:absolute;width:calc(100% / 7);height:calc(100% / 6);opacity:0;animation:d4Su .45s ease-out forwards}",
      ".d4-anello::before{content:'';position:absolute;inset:4%;border-radius:50%;border:3.5px solid var(--o-oro-chiaro);box-shadow:0 0 0 1.5px rgba(0,0,0,.5);animation:d4Pulsa .9s ease-in-out .45s infinite alternate}",
      "@keyframes d4Su{0%{opacity:0;transform:scale(1.8)}100%{opacity:1;transform:scale(1)}}",
      "@keyframes d4Pulsa{0%{transform:scale(1)}100%{transform:scale(.86)}}",
      ".d4-piede{width:var(--d4w);min-height:52px;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}",
      ".d4-piede .btn{flex:1 1 0;min-width:0;margin:0}",
      ".d4-piede .sl-faccine{flex:1 1 100%}",
      ".d4-scena.con-fa{--d4w:min(88vw,calc(var(--alt,100dvh) - 290px),500px)}",
      // chi guarda: in basso c'è la targhetta del core (alta 44 px + 10): la si lascia libera
      ".d4-scena.con-targa{padding-bottom:calc(60px + env(safe-area-inset-bottom));--d4w:min(88vw,calc(var(--alt,100dvh) - 282px),500px)}",
      ".d4-scena.con-targa.con-fa{--d4w:min(88vw,calc(var(--alt,100dvh) - 340px),500px)}",
      ".d4-nota{flex:1 1 100%;margin:0;text-align:center;font-weight:700;font-size:.92rem;color:var(--o-tenue)}",
      // «Uscire dalla partita?» sopra la tavola
      ".d4-chiedi{position:absolute;inset:0;z-index:20;background:rgba(9,11,22,.6);display:flex;align-items:center;justify-content:center;padding:20px}",
      ".d4-chiedi-box{background:var(--o-carta-piena);border:1px solid var(--o-filo-oro);border-radius:var(--o-raggio);padding:18px;max-width:320px;width:100%;box-shadow:var(--o-ombra-alta);text-align:center}",
      ".d4-chiedi-box p{margin:0 0 14px;font-family:var(--o-tit);font-weight:700;font-size:1.4rem}",
      ".d4-chiedi-tasti{display:flex;gap:8px}.d4-chiedi-tasti .btn{flex:1;margin:0}",
      // il tasto 💬 (è del pezzo comune delle chiacchiere: qui prende il bianco e oro)
      ".oro.g-drop4 .sgc-tasto{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra)}",
      ".oro.g-drop4 .sgc-tasto i{background:var(--o-oro)}",
      // il foglio delle faccine e frasi (💬, sta sulla pagina, fuori dalla schermata): vetro pieno dell'app al posto del blu di prima
      "body:has(.oro.g-drop4) .sgc-velo{background:rgba(9,11,22,.55)}",
      "body:has(.oro.g-drop4) .sgc-foglio{background:var(--o-carta-piena);color:var(--o-testo);border:1px solid var(--o-filo-oro);box-shadow:var(--o-ombra-alta)}",
      "body:has(.oro.g-drop4) :is(.sgc-fac button,.sgc-frasi button,.sgc-x){background:var(--o-fondo-2);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo)}",
      // telefoni alti: avatar e scritte più grandi, più aria tra i pezzi
      "@media (min-height:800px){.d4-scena{gap:14px}.d4-g{--av:72px}.d4-av{font-size:2.4rem}.d4-nome{font-size:1rem}.d4-serie{font-size:2.3rem}.d4-serie.vs{font-size:.86rem;margin-bottom:43px}.d4-stato{font-size:1.7rem}}"
    ].join("");
    document.head.appendChild(st);
  }
  // il telaio grigio coi 42 buchi: sta SOPRA le pedine, così cadono "dentro" la griglia
  function svgTelaio() {
    var d = "M0 0H7V6H0Z", cerchi = "", r, c;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      d += "M" + (c + 0.1) + " " + (r + 0.5) + "a.4 .4 0 1 0 .8 0a.4 .4 0 1 0 -.8 0Z";
      cerchi += "<circle cx='" + (c + 0.5) + "' cy='" + (r + 0.5) + "' r='.4'/>";
    }
    return "<svg class='d4-telaio' viewBox='0 0 7 6' preserveAspectRatio='none' aria-hidden='true'>" +
      "<defs><linearGradient id='d4lg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#34529f'/><stop offset='1' stop-color='#1f3a85'/></linearGradient></defs>" +
      "<path d='" + d + "' fill='url(#d4lg)' fill-rule='evenodd'/>" +
      "<g fill='none' stroke='rgba(6,12,40,.6)' stroke-width='.05'>" + cerchi + "</g></svg>";
  }
  function posa(nodo, i) { nodo.style.left = ((i % COLS) * 100 / COLS) + "%"; nodo.style.top = (Math.floor(i / COLS) * 100 / ROWS) + "%"; }
  function avatarHtml(om) {
    if (om && window.SGOmino) { try { return SGOmino.svg(om, { busto: true }); } catch (e) {} }
    return null;
  }
  // il Bot di questa partita: quello deciso dal core (torneo a eliminazione) o uno dei bot fissi, scelto dal livello
  // (nei tasti si dice "Bot"; in partita ha il suo nome e il suo avatar). escludi = i nomi di chi gioca
  function botDi(imp, liv, escludi) {
    if (imp && imp.bot && imp.bot.nome) return imp.bot;
    var b = SG.bot && SG.bot.prendi ? SG.bot.prendi(1, { livello: liv, escludi: escludi })[0] : null;
    return b || { nome: "Bot", omino: null, bot: true };
  }

  // =========================================================
  //  IL CAMPO (uguale per tutti i modi): si costruisce UNA volta e poi si aggiorna a pezzi
  //  vm = { fase, board:[42], turno, fine:{vincitore,celle}|null, nomi:{G,B}, omini, serie:{G,B}, n, assente }
  //  cb = { mio:"G"|"B"|"-"|null, bot, liv, locale, sonoHost, guarda, spettatore, torneo, partita,
  //         onColonna(c), onRivincita, onEsci, onNuovoAvv, esciSubito }
  // =========================================================
  function campo(t, ui, vm, cb) {
    if (ui && !document.body.contains(ui.s)) return ui;   // la schermata è stata lasciata: non si rimette su
    if (!ui) ui = creaCampo(t);
    aggiorna(ui, vm, cb);
    return ui;
  }
  function creaCampo(t) {
    stile();
    var el = t.el, i;
    var s = t.schermata({}); s.classList.add("d4-piena");
    var ui = { t: t, s: s, p: [], board: null, fermo: 0, cade: 0, firme: {}, gio: {}, anelli: [], mira: -1, premuto: null };
    ui.scena = el("div", { class: "d4-scena" });
    ui.esci = el("button", { class: "d4-esci", "aria-label": "Esci", text: "‹", onclick: function () { if (ui.cb && ui.cb.onEsci) ui.cb.onEsci(); } });
    // i due giocatori, col conto delle vittorie in mezzo
    ui.barra = el("div", { class: "d4-gioc" });
    ["G", "B"].forEach(function (k) {
      var g = { box: el("div", { class: "d4-g " + k }), av: el("div", { class: "d4-av" }), nome: el("div", { class: "d4-nome" }), firma: "" };
      g.box.appendChild(g.av); g.box.appendChild(g.nome); ui.gio[k] = g;
    });
    ui.serie = el("div", { class: "d4-serie vs", text: "VS" });   // (prima della sfida: una pillola «VS» al posto dell'emoji grigia)
    ui.barra.appendChild(ui.gio.G.box); ui.barra.appendChild(ui.serie); ui.barra.appendChild(ui.gio.B.box);
    ui.stato = el("div", { class: "d4-stato" });
    // la pedina "in mano" sopra le colonne, la griglia (pedine sotto, telaio sopra) e i segni
    ui.mano = el("div", { class: "d4-mano" });
    ui.fantasma = el("div", { class: "d4-p" }); ui.mano.appendChild(ui.fantasma);
    ui.tav = el("div", { class: "d4-tav" });
    ui.pezzi = el("div", { style: "position:absolute;inset:0" });
    for (i = 0; i < N; i++) { var p = el("div", { class: "d4-p" }); posa(p, i); ui.p.push(p); ui.pezzi.appendChild(p); }
    ui.tav.appendChild(ui.pezzi);
    ui.tav.insertAdjacentHTML("beforeend", svgTelaio());
    ui.segni = el("div", { class: "d4-segni" });
    ui.meta = el("div", { class: "d4-meta" }); ui.segni.appendChild(ui.meta);
    ui.tav.appendChild(ui.segni);
    ui.area = el("div", { class: "d4-area" }, [ui.mano, ui.tav]);
    ui.piede = el("div", { class: "d4-piede" });
    [ui.esci, ui.barra, ui.stato, ui.area, ui.piede].forEach(function (n) { ui.scena.appendChild(n); });
    s._contenuto.appendChild(ui.scena);
    tocchi(ui);
    t.mostra(s);
    return ui;
  }

  // ---- i tocchi: il dito sopra la griglia mostra dove cade la pedina; lasciando, cade ----
  function puoi(ui) {
    var vm = ui.vm, cb = ui.cb;
    return !!(vm && cb && vm.fase === "gioco" && !cb.guarda && !cb.spettatore && !ui.chiedi && (cb.mio == null || cb.mio === vm.turno));
  }
  function colDa(ui, e) {
    var r = ui.tav.getBoundingClientRect(), m = ui.mano.getBoundingClientRect();
    var x = e.clientX - r.left;
    if (x < 0 || x >= r.width || e.clientY < m.top - 24 || e.clientY > r.bottom + 24) return -1;
    return Math.max(0, Math.min(COLS - 1, Math.floor(x / (r.width / COLS))));
  }
  function mira(ui, c) {
    if (c < 0 || !puoi(ui) || !ui.vm.board || !colonnaLibera(ui.vm.board, c) || Date.now() < ui.fermo) c = -1;
    if (c === ui.mira && (c < 0 || ui.fantasma.dataset.s === ui.vm.turno)) return;
    ui.mira = c;
    if (c < 0) { ui.fantasma.className = "d4-p"; ui.meta.style.display = "none"; return; }
    var s = ui.vm.turno;
    ui.fantasma.dataset.s = s;
    ui.fantasma.className = "d4-p " + (s === "G" ? "g" : "b");
    ui.fantasma.style.left = (c * 100 / COLS) + "%";
    posa(ui.meta, idx(rigaLibera(ui.vm.board, c), c));
    ui.meta.style.color = colore(s); ui.meta.style.display = "block";
  }
  function tocchi(ui) {
    var a = ui.area;
    a.addEventListener("pointerdown", function (e) {
      if (!puoi(ui)) return;
      ui.premuto = e.pointerId;
      try { a.setPointerCapture(e.pointerId); } catch (er) {}
      mira(ui, colDa(ui, e));
    });
    a.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" && ui.premuto !== e.pointerId) return;   // col dito: solo mentre è appoggiato
      mira(ui, colDa(ui, e));
    });
    a.addEventListener("pointerup", function (e) {
      if (ui.premuto !== e.pointerId) return;
      ui.premuto = null;
      var c = colDa(ui, e);
      if (e.pointerType !== "mouse") mira(ui, -1);
      if (c < 0 || !puoi(ui) || Date.now() < ui.fermo || !colonnaLibera(ui.vm.board, c)) return;
      ui.fermo = Date.now() + 400;   // niente doppio tocco: la prossima mossa dopo che la pedina è caduta
      try { if (navigator.vibrate) navigator.vibrate(10); } catch (er) {}   // hai scelto: piccola vibrazione
      mira(ui, -1);
      // la pedina dell'avversario sta ancora cadendo: la tua parte appena atterra (il tocco non si perde)
      var resta = ui.cade - Date.now(), vm0 = ui.vm;
      if (resta > 0) return setTimeout(function () { if (ui.vm === vm0 && puoi(ui) && colonnaLibera(ui.vm.board, c)) ui.cb.onColonna(c); }, resta);
      ui.cb.onColonna(c);
    });
    function via(e) { if (ui.premuto === e.pointerId) ui.premuto = null; mira(ui, -1); }
    a.addEventListener("pointercancel", via);
    a.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") via(e); });
  }

  // ---- animazioni delle pedine (solo transform) ----
  function cadiAnim(ui, i) {
    var r = Math.floor(i / COLS), k = r + 1, nodo = ui.p[i];
    var tCad = Math.round(150 * Math.sqrt(k)), tot = Math.round(tCad / 0.78);
    ui.cade = Date.now() + tCad + 30;   // fino a qui la pedina è in volo
    if (nodo.animate) {
      try {
        nodo.animate([
          { transform: "translateY(-" + (k * 100) + "%)", easing: "cubic-bezier(.55,0,1,.45)" },
          { transform: "translateY(0)", offset: 0.78, easing: "ease-out" },
          { transform: "translateY(-" + Math.min(16, 6 + k * 2) + "%)", offset: 0.89, easing: "ease-in" },
          { transform: "translateY(0)" }
        ], { duration: tot });
      } catch (e) {}
    }
    if (ui.suoni) setTimeout(function () { if (document.body.contains(ui.s)) suonoDrop(); }, tCad);
    return tCad;
  }
  // nuova partita: le pedine vecchie scivolano giù e spariscono
  function svuotaAnim(ui, prima) {
    ui.cade = Math.max(ui.cade, Date.now() + 560);
    prima.forEach(function (v, i) {
      if (!v) return;
      var nodo = ui.p[i];
      nodo.className = "d4-p " + (v === "G" ? "g" : "b");
      if (!nodo.animate) { nodo.className = "d4-p"; return; }
      try {
        var rit = (i % COLS) * 22 + (ROWS - 1 - Math.floor(i / COLS)) * 8, fatto = false;
        var an = nodo.animate([{ transform: "translateY(0)" }, { transform: "translateY(" + ((ROWS + 1) * 100) + "%)" }],
          { duration: 420, delay: rit, easing: "cubic-bezier(.5,0,1,.5)", fill: "forwards" });
        var finito = function () { if (fatto) return; fatto = true; if (!ui.board || !ui.board[i]) nodo.className = "d4-p"; an.cancel(); };
        an.onfinish = finito;
        setTimeout(finito, rit + 480);   // anche se il telefono ha fermato le animazioni (schermo spento, app in secondo piano)
      } catch (e) { nodo.className = "d4-p"; }
    });
  }
  function togliAnelli(ui) { ui.anelli.forEach(function (a) { if (a.parentNode) a.parentNode.removeChild(a); }); ui.anelli = []; }
  function mettiAnelli(ui, celle) {
    togliAnelli(ui);
    (celle || []).forEach(function (i, k) {
      var a = ui.t.el("div", { class: "d4-anello" }); posa(a, i); a.style.animationDelay = (k * 0.11) + "s";
      ui.segni.appendChild(a); ui.anelli.push(a);
    });
  }

  // ---- testo in alto ----
  function statoDrop(vm, cb) {
    var mio = cb.mio === "G" || cb.mio === "B" ? cb.mio : null;
    if (vm.fase === "fine") {
      var w = vm.fine && vm.fine.vincitore;
      if (!w) return "🤝 Pareggio!";
      if (mio && w === mio) return "🏆 Hai vinto!";
      if (mio) return "😖 Vince " + nomeCol(w, vm.nomi[w]);
      return "🏆 Vince " + nomeCol(w, vm.nomi[w]) + "!";
    }
    if (vm.assente && vm.turno === "B") return "⏳ Aspettiamo " + nomeCol("B", vm.nomi.B) + "…";
    if (mio && mio === vm.turno) return "Tocca a <b>te</b> " + pallino(mio);
    if ((cb.bot || vm.bot) && vm.turno === "B") return "🤖 " + nomeCol("B", vm.nomi.B) + " sta pensando…";
    return "Tocca a " + nomeCol(vm.turno, vm.nomi[vm.turno]);
  }

  // ---- in basso: i tasti e gli avvisi (si rifanno solo quando cambiano) ----
  function piedeDrop(ui, vm, cb) {
    var el = ui.t.el, f, nodi, tf = null, sopra = null;   // tf: i tasti di fine uguali per tutti (online), se li disegna il core (sopra: una nota sopra di loro)
    function nota(txt) { return el("p", { class: "d4-nota", text: txt }); }
    function tasto(txt, cls, fn) { return el("button", { class: "btn " + cls, text: txt, onclick: fn }); }
    // chi guarda soltanto (fuori dal torneo a eliminazione) ha la targhetta del core in basso "👀 Guardi · 😂 · ✕":
    // lì ci sono le faccine e l'uscita, quindi qui niente fila (e sotto si lascia il suo posto)
    var targa = !!(ui.t.guarda && !ui.t.eliminazione);
    // 💬 durante la partita: contro il Bot, online se l'host le ha lasciate accese (chi guarda: le faccine del core)
    var chiac = vm.fase === "gioco" && !!cb.onChiac && !!CH() && !cb.spettatore && !(cb.sonoHost && vm.assente) && (cb.locale ? !!cb.bot : vm.ch === 1);
    if (cb.guarda) {
      f = "guarda|" + vm.fase + "|" + !!(vm.fine && vm.fine.vincitore);
      // a fine partita i tasti del core, se ne ha per chi guarda (es. "Chi vince resta")
      if (vm.fase === "fine" && !cb.locale) tf = { host: false, esci: cb.onEsci };
      nodi = function () {
        if (vm.fase !== "fine") return ["fa"];   // (nel torneo a eliminazione la fila delle faccine)
        return [nota(!ui.t.eliminazione ? "👀 Aspettiamo la prossima partita…" : (vm.fine && vm.fine.vincitore ? "Tra poco si torna al tabellone…" : "Pareggio: si rigioca!")), "fa"];
      };
    } else if (cb.spettatore) {
      f = "spett";
      // nella Sala con "Chi gioca?" a fine partita decide il core (es. «🏠 Torna in Sala»)
      if (vm.fase === "fine" && ui.t.scelti) tf = { host: false, esci: cb.onEsci };
      nodi = function () { return [nota("👀 Giocano in due: tu guardi la partita."), "fa"]; };
    } else if (cb.torneo) {
      f = "torneo|" + vm.fase;
      nodi = function () { return vm.fase === "fine" ? [nota("Tra poco i punti del torneo…")] : []; };
    } else if (cb.sonoHost && vm.assente) {
      var chi = vm.nomi.B || "L'avversario";
      var via = vm.assente.voluto ? "🚪 " + chi + " ha lasciato la partita." : "⏳ " + chi + " si è disconnesso… lo aspettiamo.";
      f = "assente|" + vm.assente.voluto + "|" + chi;
      // a partita finita restano i tasti di fine del core (con "Chi vince resta" niente "Nuovo avversario"): sopra, chi se n'è andato
      if (vm.fase === "fine" && !cb.locale) { tf = { host: true, nuova: cb.onSaletta, esci: cb.esciSubito || cb.onEsci }; sopra = via; }
      nodi = function () {
        return [nota(via), tasto("👥 Nuovo avversario", "btn-fantasma", cb.onNuovoAvv), tasto("🏠 Esci", "btn-fantasma", cb.esciSubito)];
      };
    } else if (vm.fase === "fine" && (cb.locale || cb.sonoHost)) {
      f = "fine";
      if (!cb.locale) tf = { host: true, nuova: cb.onSaletta, esci: cb.esciSubito || cb.onEsci };
      nodi = function () {
        var riv = tasto("🔄 Rivincita", "btn-primario", cb.onRivincita);
        // torneo a eliminazione: col pareggio si rigioca da soli (la rivincita ha il conto)
        if (ui.t.eliminazione && vm.fine && !vm.fine.vincitore && ui.t.contoAvanti) ui.t.contoAvanti(riv, 8, function () { if (cb.onRivincita) cb.onRivincita(); });
        return ["fa", riv, tasto("🏠 Esci", "btn-fantasma", cb.esciSubito || cb.onEsci)];
      };
    } else if (vm.fase === "fine") {
      f = "attesa";
      tf = { host: false, esci: cb.onEsci };
      nodi = function () { return [nota("In attesa dell'host per la rivincita…"), "fa"]; };
    } else { f = "vuoto" + (chiac ? "|c" : ""); nodi = function () { return chiac ? ["c"] : []; }; }
    if (tf && !ui.t.tastiFine) tf = null;
    if (tf) f = "tf|" + vm.n + "|" + f;
    if (ui.firme.piede === f) return;
    ui.firme.piede = f;
    ui.piede.innerHTML = "";
    // "fa" = la fila delle faccine (solo online: il mio avatar le fa sui telefoni di tutti)
    var conFa = false;
    if (tf && ui.t.tastiFine(ui.piede, tf)) {   // li ha messi il core: sopra, le faccine (e i tasti del gioco non servono)
      var fa0 = ui.t.faccine && !targa ? ui.t.faccine() : null;
      if (fa0) { ui.piede.insertBefore(fa0, ui.piede.firstChild); conFa = true; }
      if (sopra) ui.piede.insertBefore(nota(sopra), ui.piede.firstChild);
      nodi = function () { return []; };
    }
    nodi().forEach(function (n) {
      if (n === "fa") { var fa = !cb.locale && !targa && ui.t.faccine ? ui.t.faccine() : null; if (fa) { ui.piede.appendChild(fa); conFa = true; } return; }
      if (n === "c") { ui.piede.appendChild(CH().tasto({ gioco: "drop4", soloFaccine: !!ui.cb.guarda, onScegli: function (c) { if (ui.cb && ui.cb.onChiac) ui.cb.onChiac(c); } })); return; }
      ui.piede.appendChild(n);
    });
    if (ui.scena.classList.contains("con-fa") !== conFa) ui.scena.classList.toggle("con-fa", conFa);   // la griglia un po' più piccola: niente scorre
    if (ui.scena.classList.contains("con-targa") !== targa) ui.scena.classList.toggle("con-targa", targa);   // (il posto della targhetta)
  }

  // ---- aggiorna solo quello che è cambiato ----
  function aggiorna(ui, vm, cb) {
    ui.vm = vm; ui.cb = cb;
    ui.suoni = !cb.guarda && !cb.spettatore;
    trofeiDrop(vm, cb);
    // i giocatori
    ["G", "B"].forEach(function (k) {
      var g = ui.gio[k], nome = vm.nomi[k] || "…", om = vm.omini ? vm.omini[k] : null;
      var bot = k === "B" && (cb.bot || vm.bot), tu = cb.mio === k;
      var firma = nome + "|" + tu + "|" + bot + "|" + (om ? JSON.stringify(om) : "");
      if (g.firma !== firma) {
        g.firma = firma;
        g.nome.textContent = tu && !cb.locale ? nome + " (tu)" : nome;
        var h = avatarHtml(om);   // (il Bot ha il suo avatar: 🤖 solo se manca)
        if (h) g.av.innerHTML = h; else g.av.textContent = bot ? "🤖" : (k === "G" ? "🟡" : "⚪");
      }
      var w = vm.fine && vm.fine.vincitore;
      g.box.classList.toggle("turno", vm.fase === "gioco" && vm.turno === k);
      g.box.classList.toggle("vince", vm.fase === "fine" && w === k);
      g.box.classList.toggle("via", k === "B" && !!vm.assente);
    });
    var se = vm.serie && (vm.serie.G || vm.serie.B) ? vm.serie.G + " – " + vm.serie.B : "VS";
    if (ui.serie.textContent !== se) { ui.serie.textContent = se; ui.serie.classList.toggle("vs", se === "VS"); }

    // le pedine: cade solo quella nuova; nuova partita = la griglia si svuota
    var prima = ui.board, b = vm.board || boardVuota(), nuove = [], tolte = 0, i;
    ui.board = b.slice();
    if (!prima) {
      for (i = 0; i < N; i++) ui.p[i].className = "d4-p" + (b[i] ? (b[i] === "G" ? " g" : " b") : "");
    } else {
      for (i = 0; i < N; i++) if (prima[i] !== b[i]) { if (b[i]) nuove.push(i); else tolte++; }
      if (tolte && !contaPezzi(b)) svuotaAnim(ui, prima);
      for (i = 0; i < N; i++) if (prima[i] !== b[i] && (b[i] || !tolte || contaPezzi(b))) ui.p[i].className = "d4-p" + (b[i] ? (b[i] === "G" ? " g" : " b") : "");
      if (nuove.length === 1 && !tolte) cadiAnim(ui, nuove[0]);
    }

    // il testo in alto (con un saltello quando cambia)
    var sh = statoDrop(vm, cb);
    if (ui.firme.stato !== sh) {
      ui.firme.stato = sh; ui.stato.innerHTML = sh;
      if (prima) { ui.stato.classList.remove("pop"); void ui.stato.offsetWidth; ui.stato.classList.add("pop"); }
    }

    // fine partita: i 4 vincenti si accendono uno dopo l'altro, con la musichetta
    var chiaveFine = vm.fase === "fine" && vm.fine ? (vm.n || 0) + "|" + b.join("") : null;
    if (chiaveFine !== ui.firme.fine) {
      ui.firme.fine = chiaveFine;
      if (!chiaveFine) togliAnelli(ui);
      else {
        var attesa = Math.max(0, ui.cade - Date.now()) + 60, w = vm.fine.vincitore, mio = cb.mio === "G" || cb.mio === "B" ? cb.mio : null;
        var tipo = !w ? "pari" : (mio && w !== mio ? "perso" : "vinto");
        var conSuono = !!prima && ui.suoni;
        setTimeout(function () {
          if (ui.firme.fine !== chiaveFine || !document.body.contains(ui.s)) return;
          if (vm.fine.celle) mettiAnelli(ui, vm.fine.celle);
          if (conSuono) suonoFine(tipo);
        }, attesa);
      }
    }
    if (!puoi(ui)) mira(ui, -1);
    piedeDrop(ui, vm, cb);
  }

  // ---- domanda "sei sicuro?" in stile app (al posto della finestra grigia del telefono) ----
  function chiedi(ui, testo, siTesto, si) {
    if (!ui || !document.body.contains(ui.s)) return si();
    if (ui.chiedi) return;
    var el = ui.t.el;
    function chiudi() { if (ui.chiedi && ui.chiedi.parentNode) ui.chiedi.parentNode.removeChild(ui.chiedi); ui.chiedi = null; }
    ui.chiedi = el("div", { class: "d4-chiedi", onclick: function (e) { if (e.target === ui.chiedi) chiudi(); } }, [
      el("div", { class: "d4-chiedi-box" }, [
        el("p", { text: testo }),
        el("div", { class: "d4-chiedi-tasti" }, [
          el("button", { class: "btn btn-fantasma", text: "No, resto", onclick: chiudi }),
          el("button", { class: "btn btn-primario", text: siTesto, onclick: function () { chiudi(); si(); } })
        ])
      ])
    ]);
    mira(ui, -1);
    ui.scena.appendChild(ui.chiedi);
  }

  // =========================================================
  //  TROFEI: a fine partita si contano solo per chi ha il profilo su questo telefono
  //  (contro il bot e online sei tu; in due sullo stesso telefono conta chi ha il nome del profilo).
  //  Ogni partita si conta UNA volta sola (anche se la pagina si ricarica sulla schermata finale).
  // =========================================================
  var TD = { chiave: null, prec: null, blocchi: 0, contate: {} };
  function giaContata(k, persisti) {
    if (TD.contate[k]) return true;
    TD.contate[k] = 1;
    if (!persisti) return false;
    try {
      var a = JSON.parse(localStorage.getItem("sg-drop4-contate") || "[]");
      if (a.indexOf(k) >= 0) return true;
      a.push(k); localStorage.setItem("sg-drop4-contate", JSON.stringify(a.slice(-30)));
    } catch (e) {}
    return false;
  }
  function mioColoreDrop(vm, cb) {
    if (cb.mio === "G" || cb.mio === "B") return cb.mio;
    if (cb.mio === "-") return null;
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return null;
    var nm = String(SGNube.profilo().nome || "").trim().toLowerCase();
    return String(vm.nomi.G || "").trim().toLowerCase() === nm ? "G" : (String(vm.nomi.B || "").trim().toLowerCase() === nm ? "B" : null);
  }
  function trofeiDrop(vm, cb) {
    if (cb.guarda || cb.spettatore || !cb.partita || !vm.board) return;   // chi guarda non gioca
    var k = cb.partita + "#" + (vm.n || 0);
    if (TD.chiave !== k || !contaPezzi(vm.board)) { TD.chiave = k; TD.prec = null; TD.blocchi = 0; }   // partita nuova: si riparte da zero
    var io = mioColoreDrop(vm, cb);
    // "Guastafeste": la mia pedina nuova cade proprio dove l'avversario, al turno prima, avrebbe fatto 4
    if (io && TD.prec) {
      var nuove = [], i;
      for (i = 0; i < vm.board.length; i++) if (vm.board[i] && !TD.prec[i]) nuove.push(i);
      if (nuove.length === 1 && vm.board[nuove[0]] === io && vinceColonna(TD.prec.slice(), nuove[0] % COLS, altro(io))) TD.blocchi++;
    }
    TD.prec = vm.board.slice();
    if (vm.fase !== "fine" || !vm.fine) return;
    if (giaContata(k, !!cb.persisti)) return;
    var blocchi = TD.blocchi; TD.blocchi = 0;
    if (!io || !(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var w = vm.fine.vincitore, vinta = w === io, pari = !w, online = !cb.locale, bot = !!cb.bot, liv = cb.liv, telefono = cb.locale && !bot;
    var vero = online || (bot && liv === "difficile");   // i trofei più rari: solo online o contro il Bot Difficile
    var miei = 0, tot = 0; vm.board.forEach(function (x) { if (x) tot++; if (x === io) miei++; });
    var dir = null, cel = vm.fine.celle;
    if (vinta && cel && cel.length > 1) dir = cel[0] % COLS === cel[1] % COLS ? "V" : (Math.floor(cel[0] / COLS) === Math.floor(cel[1] / COLS) ? "O" : "D");
    var c = { partite: 1, vinte: vinta, pareggi: pari && (online || (bot && liv !== "facile")), online: online, vinteOnline: online && vinta,
      vinteFacile: bot && liv === "facile" && vinta, vinteMedio: bot && liv === "medio" && vinta, vinteDifficile: bot && liv === "difficile" && vinta,
      vinteVerticale: dir === "V", vinteOrizzontale: dir === "O", vinteDiagonale: dir === "D" && !telefono,
      vinteSfratto: vinta && tot > 21 && !telefono, vinteIn4: vinta && miei === 4 && vero, gettoni: miei, blocchi: blocchi };
    var incrs = []; for (var key in c) if (c[key]) incrs.push([key, +c[key]]);
    SGNube.salvaProgressi(null, "drop4", incrs);
  }

  // =========================================================
  //  LOCALE — contro il bot oppure in due sullo stesso telefono
  // =========================================================
  function localeDrop(t, modo, difficolta, torneo) {
    var bot = modo === "bot";
    var ilBot = bot ? botDi(t.impostazioni, difficolta, [t.giocatori[0] || "Tu", t.nomeProfilo && t.nomeProfilo()]) : null;
    var nomi = bot
      ? { G: (t.giocatori[0] || "Tu"), B: ilBot.nome }
      : { G: (t.giocatori[0] || "Giocatore 1"), B: (t.giocatori[1] || "Giocatore 2") };
    var prof = t.nomeProfilo ? t.nomeProfilo() : "";
    function ominoDi(nome) {
      if (prof && String(nome).trim().toLowerCase() === prof.toLowerCase() && t.mioOmino) return t.mioOmino(nome);
      return window.SGOmino ? SGOmino.casuale(nome) : null;
    }
    var omini = { G: ominoDi(nomi.G), B: bot ? (ilBot.omino || null) : ominoDi(nomi.B) };
    var primo = "G", st, n = 0, serie = { G: 0, B: 0 }, ui = null, uscito = false, tBot = null, tFine = null;
    var partita = "L" + (++ISTANZA);
    var tx = CH() ? CH().trasmettitore(t) : null;   // torneo a eliminazione: le chiacchiere arrivano anche a chi guarda

    function ferma() { clearTimeout(tBot); clearTimeout(tFine); tBot = tFine = null; }
    function esci() { uscito = true; ferma(); t.esci(); }
    // la partita è stata lasciata (‹, o la schermata è cambiata): niente più mosse né disegni
    function viva() {
      if (uscito) return false;
      if (ui && !document.body.contains(ui.s)) { uscito = true; ferma(); return false; }
      return true;
    }
    var cb = {
      locale: true, bot: bot, mio: bot ? "G" : null, liv: difficolta, torneo: torneo, partita: partita,
      // 💬 contro il Bot: il mio fumetto, e ogni tanto Bot risponde
      onChiac: !bot ? null : function (c) {
        if (!viva() || !CH() || !CH().valido("drop4", c)) return;
        chiacDrop(ui, "G", c); if (tx) tx({ t: "chiac", k: "G", id: "io", c: c });
        CH().rispondeBot(function (r) { if (!viva() || st.fine) return; chiacDrop(ui, "B", r); if (tx) tx({ t: "chiac", k: "B", id: "bot", c: r }); });
      },
      onColonna: function (c) { if (!bot || st.turno === "G") gioca(c); },
      onRivincita: function () { primo = altro(primo); nuova(); },
      onEsci: function () { if (!st.fine && contaPezzi(st.board)) chiedi(ui, "Uscire dalla partita?", "Esci", esci); else esci(); },
      esciSubito: esci
    };
    function render() {
      if (!viva()) return;
      var vm = { fase: st.fine ? "fine" : "gioco", board: st.board, turno: st.turno, fine: st.fine, nomi: nomi, omini: omini, serie: serie, n: n, primo: primo, bot: bot };
      if (t.trasmetti) t.trasmetti({ t: "vm", vm: vm });   // torneo a eliminazione: gli altri guardano la partita col bot
      ui = campo(t, ui, vm, cb);
    }
    function classifica() {
      var w = st.fine.vincitore;
      var r = !w ? [{ nome: nomi.G, pos: 1, pari: true, k: "G" }, { nome: nomi.B, pos: 1, pari: true, k: "B" }]   // pari: nessuno ha vinto (per gli XP)
        : [{ nome: nomi[w], pos: 1, k: w }, { nome: nomi[altro(w)], pos: 2, k: altro(w) }];
      return r.map(function (x) { var y = { nome: x.nome, pos: x.pos }; if (x.pari) y.pari = true; if (bot && x.k === "B") y.bot = true; return y; });   // la riga del Bot: bot: true
    }
    function gioca(c) {
      if (!viva() || st.fine || c < 0 || !colonnaLibera(st.board, c)) return;
      var r = cadi(st.board, c, st.turno);
      if (vinceDa(st.board, idx(r, c))) st.fine = { vincitore: st.turno, celle: vincitoreDrop(st.board).celle };
      else if (!colonneLibere(st.board).length) st.fine = { vincitore: null, celle: null };
      else st.turno = altro(st.turno);
      if (st.fine) {
        if (st.fine.vincitore) serie[st.fine.vincitore]++;
        // torneo a eliminazione e XP: chi ha vinto (pari = stesso posto, si rigioca)
        if (!torneo && t.risultato) t.risultato(classifica());
      }
      render();
      // torneo sullo stesso telefono: prima si vede la mossa vincente, poi i punti
      if (st.fine && torneo) { var cl = classifica(); tFine = setTimeout(function () { if (viva()) t.fine(cl); }, 1800); }
      if (!st.fine && bot && st.turno === "B") pensaBot();
    }
    function pensaBot() {
      clearTimeout(tBot);
      tBot = setTimeout(function () {
        tBot = null;
        if (!viva() || st.fine || st.turno !== "B") return;
        gioca(mossaBot(st.board.slice(), "B", difficolta, primo));
      }, 450 + Math.random() * 300);
    }
    function nuova() {
      ferma();
      n++;
      st = { board: boardVuota(), turno: primo, fine: null };
      render();
      if (bot && st.turno === "B") pensaBot();
    }
    nuova();
  }

  // =========================================================
  //  ONLINE — host = Giallo, ospite = Bianco (host-autoritativo).
  //  Chi entra quando la partita è piena la guarda. Se l'avversario sparisce,
  //  la partita resta lì e riprende quando torna (anche con un id nuovo: si riconosce dal nome).
  // =========================================================
  function stessoNome(a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); }
  function hostDrop(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Host";
    var st = {
      fase: "lobby", codice: "…", pronta: false, n: 0, primoImp: imp.primo || "host",
      board: boardVuota(), turno: "G", fine: null, primo: "G", serie: { G: 0, B: 0 },
      nomeG: nomeHost, ominoG: t.mioOmino ? t.mioOmino(nomeHost) : null,
      avv: null,          // { id, nome, omino }
      assente: null,      // { voluto } : l'avversario è uscito o ha perso la rete a partita iniziata
      guardano: []        // [{ id, nome, omino }]: chi è entrato a stanza piena
    };
    var ui = null, uscito = false, partita = "H" + Date.now().toString(36) + (++ISTANZA);   // (un nome che non si ripete: con la ripresa i trofei restano contati)
    var ch = CH(), filtra = ch ? ch.filtro() : null;   // 💬 le faccine e le frasi (accese o spente dall'host nel ⚙️)
    st.ch = !!ch && ch.attive(imp);
    // ---- la ripresa: l'host ha ricaricato la pagina (o l'app si è chiusa) a metà partita → si continua dalla stessa mossa.
    // L'avversario è "via" finché non si rifà vivo (rientra da solo in un attimo); se in 30 s non torna, "⏳ si è
    // disconnesso… lo aspettiamo" come quando perde la rete. Chi guardava rientra da solo col suo join
    var CAMPI = ["fase", "n", "primoImp", "board", "turno", "fine", "primo", "serie", "avv", "prossimo"];
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.drop4, ricordata = !!RIP, avvVia = false;
    if (RIP) {
      CAMPI.forEach(function (k) { if (RIP[k] !== undefined) st[k] = RIP[k]; });
      if (RIP.partita) partita = RIP.partita;   // (stessa partita: i trofei non si contano due volte)
      if (st.avv) {
        avvVia = true;
        setTimeout(function () { if (!uscito && avvVia && st.avv && st.fase !== "lobby" && !st.assente) { avvVia = false; st.assente = { voluto: false }; bd(); } }, 30000);
      }
    }
    function ricorda() {   // dopo ogni cambiamento (in saletta non c'è niente da riprendere)
      if (!t.ricorda) return;
      if (st.fase === "lobby") { if (ricordata) { ricordata = false; t.ricorda(null); } return; }
      var o = { partita: partita }; CAMPI.forEach(function (k) { o[k] = st[k]; });
      ricordata = true; t.ricorda({ drop4: o });
    }

    // "⚙️ Regole" nella saletta: chi comincia la prima partita (e le chiacchiere, subito)
    t.onRegole = function (im) { st.primoImp = (im && im.primo) || "host"; var c0 = st.ch; st.ch = !!ch && ch.attive(im); if (st.fase === "lobby" || c0 !== st.ch) bd(); };

    function guardaDi(id) { for (var i = 0; i < st.guardano.length; i++) if (st.guardano[i].id === id) return i; return -1; }
    function togliGuarda(id) { var i = guardaDi(id); if (i >= 0) st.guardano.splice(i, 1); }
    function nuovoAvv(p) { st.avv = p; st.assente = null; st.prossimo = null; st.serie = { G: 0, B: 0 }; togliGuarda(p.id); }
    // in saletta il posto libero va al primo che stava guardando
    // (nella Sala gioca solo chi è stato scelto: gli altri guardano)
    function puo(p) { return !t.puoSedersi || t.puoSedersi(p.id, p.nome); }
    function promuovi() { if (st.avv) return; for (var i = 0; i < st.guardano.length; i++) if (puo(st.guardano[i])) return nuovoAvv(st.guardano[i]); }

    var rete = SGNet.ospita("drop4", {
      onCodice: function (c) {
        st.codice = c; st.riserva = riservaAvv("drop4", c);
        if (st.riserva) setTimeout(function () { if (!uscito && !st.avv && st.fase === "lobby") { promuovi(); bd(); } }, 15100);   // non è tornato: tocca a chi guardava
        bd();
      },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        if (st.avv && id === st.avv.id) {
          if (st.fase === "lobby") { st.avv = null; st.serie = { G: 0, B: 0 }; promuovi(); }
          else {
            if (!st.assente) st.assente = { voluto: false };
            // è già tornato con un altro id (stesso nome) e sta guardando: riprende il suo posto
            for (var i = 0; i < st.guardano.length; i++) if (stessoNome(st.guardano[i].nome, st.avv.nome)) { st.avv.id = st.guardano[i].id; st.guardano.splice(i, 1); st.assente = null; break; }
          }
          bd(); return;
        }
        if (guardaDi(id) >= 0) { togliGuarda(id); bd(); }
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (st.avv && id === st.avv.id) avvVia = false;   // (ripresa) l'avversario si è rifatto vivo
        if (st.avv && id === st.avv.id && st.assente && m.t !== "esco") st.assente = null;   // è tornato
        if (m.t === "join") {
          var p = { id: id, nome: String(m.nome || "Avversario").slice(0, 16), omino: avatarOk(m.omino) };
          if (st.avv && id === st.avv.id) { /* c'era già: gli rimando la foto */ }
          else if (!st.avv && st.fase === "lobby" && !postoRiservato(st.riserva, id) && puo(p)) nuovoAvv(p);
          else if (st.avv && st.assente && stessoNome(p.nome, st.avv.nome)) { st.avv.id = id; st.assente = null; togliGuarda(id); }   // rientrato con un id nuovo
          else if (guardaDi(id) < 0 && st.guardano.length < 12) st.guardano.push(p);   // stanza piena: guarda
          bd(); return;
        }
        if (m.t === "esco") {
          if (st.avv && id === st.avv.id) {
            if (st.fase === "lobby") { st.avv = null; st.serie = { G: 0, B: 0 }; promuovi(); }
            else st.assente = { voluto: true };
          } else togliGuarda(id);
          bd(); return;
        }
        if (m.t === "mossa") { if (st.fase === "gioco" && st.turno === "B" && st.avv && id === st.avv.id) applica(m.c); return; }
        if (m.t === "chiac") {   // 💬 dall'avversario (o una faccina da chi guarda): a tutti
          if (!ch || !st.ch || st.fase === "lobby" || !filtra(id)) return;
          var gioca = !!st.avv && id === st.avv.id, c = String(m.c || "");
          if (!ch.valido("drop4", c, !gioca)) return;
          var x = { t: "chiac", k: gioca ? "B" : "g", id: id, c: c };
          if (!gioca) x.n = ch.nomeDi(m.n);
          rete.inviaVeloce(x); chiacDrop(ui, x.k, c, x.n);
          return;
        }
        bd();
      },
      onErrore: function () { if (!st.pronta) errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }   // dopo, la rete si ricollega da sola
    }, { ripresa: !!RIP });   // (ripresa: gli amici restano sul tavolo, non tornano in saletta)
    function vm() {
      return { fase: st.fase, codice: st.codice, pronta: st.pronta, n: st.n, board: st.board, turno: st.turno, fine: st.fine, primo: st.primo, primoImp: st.primoImp,
        nomi: { G: st.nomeG, B: st.avv ? st.avv.nome : "Avversario" }, avversario: !!st.avv, avvId: st.avv ? st.avv.id : null,
        omini: { G: st.ominoG, B: st.avv ? st.avv.omino : null }, serie: st.serie, assente: st.assente, ch: st.ch ? 1 : 0,
        guardano: st.guardano.map(function (g) { return g.id; }), nomiGuardano: st.guardano.map(function (g) { return g.nome; }) };
    }
    function bd() {
      if (uscito) return;
      ricordaAvv("drop4", st.codice, st.avv ? st.avv.id : (st.riserva && Date.now() < st.riserva.fino ? st.riserva.id : null));
      ricorda();
      var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(v);
    }
    function applica(c) {
      if (st.fase !== "gioco" || st.fine || !colonnaLibera(st.board, c)) return;
      var r = cadi(st.board, c, st.turno);
      if (vinceDa(st.board, idx(r, c))) st.fine = { vincitore: st.turno, celle: vincitoreDrop(st.board).celle };
      else if (!colonneLibere(st.board).length) st.fine = { vincitore: null, celle: null };
      if (st.fine) {
        st.fase = "fine";
        if (st.fine.vincitore) st.serie[st.fine.vincitore]++;
        // per il torneo online: chi ha vinto (pari = stesso posto)
        var nB = st.avv ? st.avv.nome : "Avversario";
        if (t.risultato) t.risultato(st.fine.vincitore === "B" ? [{ nome: nB, pos: 1 }, { nome: st.nomeG, pos: 2 }]
          : (st.fine.vincitore ? [{ nome: st.nomeG, pos: 1 }, { nome: nB, pos: 2 }] : [{ nome: st.nomeG, pos: 1, pari: true }, { nome: nB, pos: 1, pari: true }]));
      } else st.turno = altro(st.turno);
      bd();
    }
    function parti(primo) { st.n++; st.primo = primo; st.board = boardVuota(); st.turno = primo; st.fine = null; st.fase = "gioco"; bd(); }
    function comincia() {
      if (st.fase !== "lobby" || !st.avv) return;
      var pr = st.prossimo; st.prossimo = null;   // (dopo una rivincita dalla saletta comincia l'altro)
      parti(pr || (st.primoImp === "ospite" ? "B" : (st.primoImp === "caso" ? (Math.random() < 0.5 ? "G" : "B") : "G")));
    }
    function rivincita() { if (st.fase !== "fine" || !st.avv || st.assente) return; parti(altro(st.primo)); }
    // la rivincita dei tasti di fine comuni: si torna nella saletta con lo stesso avversario (il core fa il 3-2-1), poi comincia l'altro
    // (l'avversario se n'è andato: si torna nella saletta col posto libero, come "👥 Nuovo avversario")
    function allaSaletta() { if (st.fase !== "fine") return; if (!st.avv || st.assente) return cbH.onNuovoAvv(); st.prossimo = altro(st.primo); st.fase = "lobby"; bd(); }
    t.onRivincita = allaSaletta;
    function chiudi() { if (t.ricorda) t.ricorda(null); uscito = true; rete.chiudi(); t.esci(); }   // (uscito apposta: niente da riprendere)
    var cbH = {
      sonoHost: true, mio: "G", partita: partita, persisti: true,
      onChiac: function (c) { if (!st.ch || st.fase === "lobby" || !ch.valido("drop4", c)) return; chiacDrop(ui, "G", c); rete.inviaVeloce({ t: "chiac", k: "G", id: "host", c: c }); },
      onColonna: function (c) { if (st.fase === "gioco" && st.turno === "G") applica(c); },
      onComincia: comincia, onRivincita: rivincita, onSaletta: allaSaletta,
      onNuovoAvv: function () { st.avv = null; st.assente = null; st.prossimo = null; st.serie = { G: 0, B: 0 }; st.fase = "lobby"; st.board = boardVuota(); st.fine = null; promuovi(); bd(); },
      onEsci: function () {
        if (st.fase === "gioco" && st.avv && !st.assente) chiedi(ui, "Chiudere la partita per tutti?", "Chiudi", chiudi);
        else chiudi();
      },
      esciSubito: chiudi
    };
    function disegna(v) {
      if (uscito) return;
      if (v.fase === "lobby") { ui = null; return lobbyDrop(t, v, { host: true, myId: "host", onComincia: comincia, onEsci: cbH.onEsci }); }
      ui = campo(t, ui, v, cbH);
    }
    bd();
  }

  function ospiteDrop(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null }, ui = null, uscito = false;
    var cb = {
      sonoHost: false, mio: "-", partita: "O" + String(codice).toUpperCase(), persisti: true,
      onColonna: function (c) { if (S.rete) S.rete.invia({ t: "mossa", c: c }); },
      // 💬 il mio fumetto subito, poi lo manda l'host a tutti (il suo "rimando" a me non si rifà)
      onChiac: function (c) { if (!S.rete || cb.mio !== "B" || !CH() || !CH().valido("drop4", c)) return; chiacDrop(ui, "B", c); S.rete.invia({ t: "chiac", c: c }); },
      onRivincita: function () {},
      onEsci: function () {
        if (S.vm && S.vm.fase === "gioco" && cb.mio === "B") chiedi(ui, "Uscire dalla partita?", "Esci", esci);
        else esci();
      }
    };
    cb.esciSubito = cb.onEsci;
    function esci() {
      uscito = true;
      if (S.rete) { try { S.rete.invia({ t: "esco" }); } catch (e) {} S.rete.chiudi(); }   // l'host sa che sei uscito apposta
      t.esci();
    }
    function disegna() {
      var vm = S.vm; if (!vm || uscito) return;
      var io = !!(S.myId && vm.avvId === S.myId);
      if (vm.fase === "lobby") { ui = null; return lobbyDrop(t, vm, { host: false, myId: S.myId, onEsci: cb.onEsci }); }
      cb.mio = io ? "B" : "-"; cb.spettatore = !io;
      ui = campo(t, ui, vm, cb);
    }
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else schermaNome();   // col profilo si entra da soli
    function schermaNome() {
      var s = t.schermata({ icona: "🟡", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function attesa() {
      var s = t.schermata({ icona: "🟡", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      S.msg = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" });
      s._contenuto.appendChild(S.msg);
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) {
          S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita: controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000);
        },
        onMsg: function (m) {
          if (m && m.t === "chiac") { if (m.id !== S.myId && !uscito) chiacDrop(ui, m.k, m.c, m.n); return; }   // 💬 di un altro
          if (m && m.t === "vm" && m.vm) { S.vm = m.vm; disegna(); }
        },
        onChiuso: function () { if (!uscito) errore(t, "La partita è stata chiusa dall'host."); },
        onErrore: function () { if (!S.vm && !uscito) errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  // chi guarda soltanto (torneo a eliminazione, duello della Sala, "👀 Guarda"): la vede in diretta, senza poter toccare.
  // Le sue faccine passano dal core (la fila t.faccine(), o il 😂 della targhetta): le sue mosse il core le butta
  function guardaDrop(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var rete = null, scritta = null, ui = null;   // (chi guarda: niente suoni)
    var cb = { guarda: true, sonoHost: false, mio: "-", onColonna: function () {}, onRivincita: function () {},
      onEsci: function () { if (rete) rete.chiudi(); t.esci(); } };
    function attesa(txt) {
      if (scritta === txt) return; scritta = txt; ui = null;
      stile();   // (lo stile del gioco serve anche qui: il ‹ in alto a sinistra)
      var s = t.schermata({ indietro: cb.onEsci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota guarda-attesa", text: txt }));
      if (t.eliminazione && t.faccine) { var fa = t.faccine(); if (fa) s._piede.appendChild(fa); }   // (fuori dal torneo le faccine sono nella targhetta)
      t.mostra(s);
    }
    attesa("👀 Mi collego alla partita…");
    rete = SGNet.entra(codice, {
      onMsg: function (m) {
        if (m && m.t === "chiac") { if (!rete || m.id !== rete.mioId) chiacDrop(ui, m.k, m.c, m.n); return; }   // 💬 dei due che giocano (o di chi guarda)
        if (!m || m.t !== "vm" || !m.vm || !m.vm.board) return;
        if (m.vm.fase === "lobby") return attesa("👀 La partita sta per cominciare…");
        scritta = null;
        ui = campo(t, ui, m.vm, cb);
      },
      onChiuso: function () { cb.onEsci(); },   // partita finita e chiusa: si torna al tabellone
      onErrore: function () { if (!ui) errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
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
  // la saletta d'attesa (uguale per tutti i giochi): l'host, l'avversario e chi guarda
  var EXTRA = { testo: null, nodo: null };
  function lobbyDrop(t, vm, o) {
    var om = vm.omini || {};
    var io = !o.host && o.myId && vm.avvId === o.myId;
    var guardo = !o.host && o.myId && (vm.guardano || []).indexOf(o.myId) >= 0;
    var gio = [{ id: "host", nome: vm.nomi.G, omino: om.G || null, host: true, tu: !!o.host }];
    if (vm.avversario) gio.push({ id: vm.avvId, nome: vm.nomi.B, omino: om.B || null, tu: !!io });
    var righe = [(vm.primoImp === "ospite" ? "Comincia chi entra (pedine bianche)." : (vm.primoImp === "caso" ? "Chi comincia si decide a caso." : "Comincia " + vm.nomi.G + " (pedine gialle).")) + " Con la rivincita si alterna."];
    if (vm.nomiGuardano && vm.nomiGuardano.length) righe.push("👀 Guardano: " + vm.nomiGuardano.join(", "));
    var testo = righe.join("\n");
    if (EXTRA.testo !== testo) { EXTRA.testo = testo; EXTRA.nodo = t.el("p", { class: "modulo-nota", style: "text-align:center;white-space:pre-line", text: testo }); }
    t.lobby({ host: !!o.host, codice: vm.codice, pronta: vm.pronta, min: 2, vuoti: vm.avversario ? 0 : 1, giocatori: gio, extra: [EXTRA.nodo],
      nota: o.host ? (vm.avversario ? "✅ Avversario collegato! Quando vuoi, comincia." : "Invita il tuo avversario col tasto 📤.") : null,
      attesa: io ? "Aspetta che l'host cominci: tu hai le pedine bianche." : (guardo || (vm.avversario && !o.host) ? "👀 Giocano " + vm.nomi.G + " e " + vm.nomi.B + ": tu guardi." : "Entro nella partita…"),
      onComincia: o.onComincia, onEsci: o.onEsci });
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
