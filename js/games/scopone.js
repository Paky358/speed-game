/* =========================================================
   GIOCO — "Scopone" (carte napoletane, stesse immagini della Scopa)
   In quattro, a due squadre (chi sta di fronte è il compagno).
   Due varianti:
     • Scientifico: 10 carte a testa, niente carte sul tavolo all'inizio.
     • Classico: 9 carte a testa + 4 sul tavolo.
   Tutte le carte sono distribuite subito (non si pesca). Regole di presa
   come la Scopa (valore uguale, singolo forzato, altrimenti somme). Scopa
   quando svuoti il tavolo (tranne l'ultima carta, se non si sceglie
   altrimenti). A fine mano le carte rimaste vanno all'ultima squadra che ha
   preso. Punti a squadra: Carte, Denari, Settebello, Primiera + le Scope
   (+ la Napola, se accesa). Partita a 11 (o ai punti scelti).
   Modi: contro i Bot (tu + un Bot compagno contro due Bot) oppure ONLINE
   (ognuno dal suo telefono, i posti vuoti ai Bot; coppie scelte, a caso o
   a giro; chi guarda vede le carte di chi vuole, mai chi gioca).
   Riusa gli aiuti condivisi window.SGCarte (definiti in scopa.js).
   La stanza si costruisce una volta per mano: a ogni mossa si aggiorna
   solo quello che cambia (niente lampeggio). Contro i Bot la partita si
   salva sul telefono a ogni mossa: ricaricando la pagina si può riprendere.
   Online l'host (posto 0) tiene la partita vera e manda a ognuno la SUA
   vista (vistaDa: il tavolo "girato" come lo vede lui, con le sue carte).
   ========================================================= */
(function () {
  "use strict";
  var ID = "scopone";                                    // (le prove lo cambiano per provarlo nella Sala)
  var TARGET = 11;
  var PAUSA_MANO = 15;                                   // online: secondi del riepilogo di fine mano
  var TEMPO_TURNO = 60;                                  // online: chi non gioca per tanto, gioca il Bot al posto suo
  // i tre bot (1 e 3 rivali, 2 il tuo compagno) sono i bot fissi uguali in tutti i giochi (SG.bot), scelti dalla bravura
  var SALVA = "sg-scopone-partita";                     // la partita in corso, salvata sul telefono
  var COPPIE = "sg-scopone-coppie";                     // 👫 lo storico delle coppie della giornata (sul telefono dell'host, per nome)
  // 🤫 Messaggio al compagno (online, tra due compagni veri): le frasi pronte, al massimo PSST_MAX a testa per smazzata
  var PSST = ["💰 Ho il settebello", "🪙 Ho i denari", "7️⃣ Ho un 7", "🚫 Non ho 7", "✋ Lascia, ci penso io", "🤝 Fidati di me"];
  var PSST_MAX = 2, PSST_MS = 4000;
  var SEMI_TXT = { D: "🪙", C: "🏆", S: "🗡️", B: "🪵" };   // denari, coppe, spade, bastoni
  // frasi dei bot a fumetto nei momenti forti (corte: stanno nel fumetto)
  var FRASI = {
    scopa: ["🧹 SCOPA!", "🧹 Pulito!", "🧹 Spazzato!", "🧹 Via tutto!", "🧹 Tutto mio!", "🧹 Che scopa!", "🧹 Lindo!", "🧹 E vai!", "🧹 Olé!", "🧹 Tavola pulita!"],
    sette: ["💰 Settebello!", "💰 Il bello!", "💰 Sette d'oro!", "💰 Lo tengo io!", "💰 Che bellezza!", "💰 Vieni qua!", "💰 Il re dei 7!", "💰 Mio, mio!"],
    somma: ["🎯 Spariglio!", "🎯 Conti fatti!", "🎯 Somma giusta!", "🎯 Calcolato!", "🎯 Tutto torna!", "🎯 Sparigliato!", "🎯 Matematica!"],
    bravo: ["👏 Grande!", "👏 Che colpo!", "👏 Così si fa!", "👏 Bellissima!", "👏 Da manuale!", "👏 Siamo forti!", "👏 Applausi!", "👏 Spettacolo!"],
    braviSette: ["💰 Bel colpo!", "💰 È nostro!", "💰 Evvai!", "💰 Preso, grande!", "💰 Che mano!"]
  };
  function C() { return window.SGCarte; } // aiuti condivisi (carte + logica di presa)
  function squadra(s) { return (s % 2 === 0) ? "noi" : "loro"; }
  function trova(a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function importanza(c) { return c.id === "D7" ? 12 : c.s === "D" ? 3 : c.v === 7 ? 2.2 : (c.v === 6 || c.v === 1) ? 1.6 : 1; }
  function pesca(a) { return a[Math.floor(Math.random() * a.length)]; }
  function nomeCarta(c) { return (c.v === 1 ? "A" : c.v === 8 ? "F" : c.v === 9 ? "C" : c.v === 10 ? "R" : c.v) + (SEMI_TXT[c.s] || ""); }
  function corto(n) { n = String(n || ""); return n.length > 8 ? n.slice(0, 7) + "…" : n; }
  function regoleDa(imp) { imp = imp || {}; return { napola: !!imp.napola, ultima: !!imp.ultima }; }
  function prendiBot(n, livello, escludi) {   // i bot del gruppo fisso (SG.bot: sempre gli stessi nomi e avatar in tutti i giochi)
    var b = null;
    try { if (window.SG && SG.bot && SG.bot.prendi) b = SG.bot.prendi(n, { livello: livello, escludi: escludi }); } catch (e) {}
    if (!b || b.length < n) { b = []; for (var k = 0; k < n; k++) b.push({ nome: "Bot " + (k + 1), omino: null }); }   // (di sicurezza)
    return b;
  }

  SG.registra({
    id: ID,
    nome: "Scopone",
    icona: "🃏",
    tema: "oro",   // 🤍 Bianco e oro: impostazioni, riepiloghi e schermate di servizio chiari; il tavolo resta una stanza vera (schermata «scura»)
    descrizione: "Lo scopone in quattro, a coppie: tu e il tuo compagno contro due avversari. Scientifico o classico, contro i Bot o online, ognuno dal suo telefono (i posti vuoti li fanno i Bot).",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 3, etichettaGiocatori: "👥 1–4 giocatori",   // (i posti liberi li prendono i Bot)
    postiOnline: 4,   // 4 al tavolo: nella Sala, se siete di più, gioca chi sceglie l'host e gli altri guardano
    riprende: true,   // se l'host ricarica la pagina (o riapre l'app), la mano continua da dove era (stesse carte, punti e turno)
    riserva: true,    // se il telefono dell'host si spegne del tutto, un amico seduto al tavolo porta avanti la partita dal suo posto
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro i Bot", sotto: "Tu e un Bot contro due Bot" }],
    regole: [
      "Si gioca <b>in quattro, a due coppie</b>: tu e il tuo <b>compagno</b> (di fronte) contro due <b>avversari</b>. Contro i Bot gli altri tre sono Bot; <b>online</b> ognuno gioca dal suo telefono e i posti vuoti li fanno i Bot.",
      "<b>Scientifico</b>: 10 carte a testa, niente carte sul tavolo. <b>Classico</b>: 9 a testa + 4 sul tavolo.",
      "Le carte sono date <b>tutte subito</b> (non si pesca). Nel tuo turno giochi una carta: se ha lo stesso valore di una del tavolo la <b>prendi</b>, altrimenti puoi prendere una <b>somma</b> di più carte.",
      "Svuoti il tavolo? <b>Scopa</b> (+1), tranne con l'ultima carta (se l'host non accende «Scopa all'ultima carta»). A fine mano le carte rimaste vanno all'ultima coppia che ha preso.",
      "Punti a fine mano (sommando i due compagni): <b>Carte, Denari, Settebello, Primiera</b> e le <b>Scope</b>. Con la <b>Napola</b> accesa: asso, 2 e 3 di denari presi dalla stessa coppia valgono 3 punti, +1 per ogni denaro che segue (4, 5…).",
      "Vince la coppia che arriva per prima ai <b>punti scelti</b> (di solito " + TARGET + "; lo «Scopone a trentuno» si gioca a 31 con la Napola; a pari punti si gioca un'altra mano). Si può giocare anche <b>una mano sola</b>.",
      "Online le coppie le sceglie l'host (🔀 in saletta), oppure si sorteggiano o cambiano a ogni partita. A fine mano <b>⏩ Avanti</b>: se lo tocca più di metà si riparte subito. Chi guarda vede le carte di un giocatore alla volta (🔄 per cambiare), chi gioca vede solo le sue.",
      "A fine mano <b>🏅 Il migliore in campo</b>: in ogni coppia la medaglia va a chi ha portato di più (scope e settebello contano di più; a pari, niente medaglia).",
      "Online l'host si ricorda le coppie di oggi (<b>👫 «Paky e Luca: 3 vinte, 1 persa»</b>): lo vedete in saletta e a fine partita. L'host può fare <b>🔁 Rivincita a coppie scambiate</b>: si rigioca subito, ognuno con un compagno nuovo.",
      "<b>🤫 Messaggio al compagno</b> (si accende nel ⚙️): online, se il compagno non è un Bot, il tasto 🤫 vicino alla mano manda una frase pronta («Ho il settebello», «Lascia, ci penso io»…). La legge solo il compagno; gli avversari e chi guarda vedono solo 🤫. Al massimo 2 a testa per mano.",
      "Accanto al nome di ogni giocatore vedi l'<b>ultima carta</b> che ha giocato. Contro i Bot, se chiudi l'app a metà, la prossima volta puoi <b>riprendere la partita</b>."
    ],
    // la riga "📜 Si gioca così" che gli amici leggono in saletta
    riassunto: function (imp) {
      imp = imp || {};
      var tr = C() ? C().traguardoDa(imp) : TARGET, liv = { facile: "facili", medio: "medi", difficile: "difficili" }[imp.difficolta] || "medi";
      var p = [imp.variante === "classico" ? "Classico" : "Scientifico", tr ? "a " + tr + " punti" : "una mano sola", "Bot " + liv];
      if (imp.napola) p.push("con la Napola");
      if (imp.ultima) p.push("scopa anche all'ultima carta");
      if (imp.coppie === "caso") p.push("coppie a caso"); else if (imp.coppie === "giro") p.push("compagni a giro");
      if (imp.psst) p.push("🤫 messaggi al compagno");
      return p.join(" · ");
    },
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, online = aiuti.modo === "online";
      dove.variante = "scientifico"; dove.difficolta = "medio"; dove.aiuto = true; dove.napola = false; dove.ultima = false;
      if (online) { dove.coppie = "scelte"; dove.psst = false; }
      var bSci, bCla;
      // c'è una partita lasciata a metà? lo diciamo subito (si riprende toccando Comincia)
      var prof = !online && window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo(), sosp = online ? null : leggiSalvata(prof && prof.nome ? String(prof.nome).trim().slice(0, 16) : undefined);
      if (sosp) box.appendChild(el("p", { class: "modulo-nota", style: "margin:0 0 10px;padding:8px 10px;border-radius:10px;background:var(--o-crema);border:1.5px solid var(--o-filo-oro)",
        html: "⏸️ Hai una partita a metà (<b>Noi " + sosp.st.punti.noi + " — " + sosp.st.punti.loro + " Loro</b>): tocca <b>Comincia</b> per riprenderla o per farne una nuova." }));
      function selV(v) { dove.variante = v; bSci.className = "modo-chip" + (v === "scientifico" ? " attiva" : ""); bCla.className = "modo-chip" + (v === "classico" ? " attiva" : ""); }
      bSci = el("button", { class: "modo-chip attiva", onclick: function () { selV("scientifico"); } }, [
        el("span", { class: "mi", text: "🎓" }), el("div", {}, [el("div", { class: "mt", text: "Scientifico" }), el("div", { class: "ms", text: "10 carte, tavolo vuoto" })])]);
      bCla = el("button", { class: "modo-chip", onclick: function () { selV("classico"); } }, [
        el("span", { class: "mi", text: "📜" }), el("div", {}, [el("div", { class: "mt", text: "Classico" }), el("div", { class: "ms", text: "9 carte + 4 sul tavolo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Variante" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bSci, bCla]));
      function righina(scelte, chiave) {   // fila di scelte che si accendono
        var dg = el("div", { style: "display:flex;gap:8px" });
        scelte.forEach(function (d) {
          var b = el("button", { class: "modo-chip" + (d[0] === dove[chiave] ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
            dove[chiave] = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
          } }, [el("div", { class: "mt", text: d[1] })]);
          b.style.flex = "1"; dg.appendChild(b);
        });
        return dg;
      }
      function etichetta(txt) { box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: txt })); }
      if (online) {   // le coppie: scelte dall'host in saletta (🔀), sorteggiate al via o che cambiano a ogni partita
        etichetta("Coppie");
        box.appendChild(righina([["scelte", "✋ Scelte"], ["caso", "🎲 A caso"], ["giro", "🔄 A giro"]], "coppie"));
      }
      etichetta(online ? "Bravura dei Bot (nei posti liberi)" : "Bravura dei Bot");
      box.appendChild(righina([["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]], "difficolta"));
      C().sceltaTraguardo(el, box, dove);   // i punti da raggiungere
      box.appendChild(el("p", { class: "modulo-nota", style: "margin:4px 0 0", text: "Le vittorie contano per i trofei nelle partite da 11 punti in su." }));
      etichetta("Napola (asso, 2 e 3 di denari)");
      box.appendChild(righina([[false, "No"], [true, "Sì"]], "napola"));
      etichetta("Scopa all'ultima carta");
      box.appendChild(righina([[false, "Non vale"], [true, "Vale"]], "ultima"));
      if (online) {   // 🤫 Messaggio al compagno: solo online, tra due compagni veri
        etichetta("🤫 Messaggio al compagno");
        box.appendChild(righina([[false, "No"], [true, "Sì"]], "psst"));
        box.appendChild(el("p", { class: "modulo-nota", style: "margin:4px 0 0", text: "Un tasto 🤫 manda al compagno una frase pronta (2 a mano): la legge solo lui." }));
      }
      etichetta("Illumina le carte che prendono");
      box.appendChild(righina([[true, "Sì"], [false, "No"]], "aiuto"));
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:10px", text: online
        ? "Ognuno dal suo telefono: chi sta di fronte è il compagno. I posti liberi li fanno i Bot."
        : "Giochi tu (in basso) col tuo compagno di fronte, contro due avversari ai lati: sono tutti Bot." }));
    },
    avvia: function (t) {
      if (!window.SGCarte) { var s = t.schermata({ icona: "⚠️", titolo: "Un attimo" }); s._contenuto.appendChild(t.el("p", { text: "Ricarica la pagina e riprova." })); s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci })); return t.mostra(s); }
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteScopone(t, t.linkParams.stanza);   // entrato da un invito (o dalla Sala)
      if (imp.modo === "online") return hostScopone(t);
      var mioNome = (t.nomeProfilo && t.nomeProfilo()) || t.giocatori[0] || "Tu";
      var sv = leggiSalvata(mioNome);
      function nuova() { cancellaSalvata(); localeScopone(t, imp.variante || "scientifico", imp.difficolta || "medio", imp.aiuto !== false, null); }
      if (!sv) return nuova();
      // c'era una partita lasciata a metà: si può riprendere
      var p = sv.st.punti, s2 = t.schermata({ icona: "🃏", titolo: "Partita in sospeso", sotto: "Scopone " + (sv.st.variante === "classico" ? "classico" : "scientifico"), indietro: t.esci });
      s2._contenuto.appendChild(t.el("p", { style: "text-align:center;font-size:1.05rem;line-height:1.5", text: "Avevi lasciato una partita a metà. Vuoi riprenderla?" }));
      s2._contenuto.appendChild(t.el("div", { style: "text-align:center;font-size:1.4rem;font-weight:800;margin:10px 0",
        html: "Noi <span style='color:var(--o-verde)'>" + p.noi + "</span> — " + p.loro + " Loro <span class='tenue' style='font-size:.9rem'>(" + C().testoTraguardo(sv.st.traguardo) + ")</span>" }));
      s2._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "▶ Riprendi la partita", onclick: function () { localeScopone(t, sv.st.variante, sv.diff || "medio", sv.aiuto !== false, sv.st); } }));
      s2._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🔄 Nuova partita", onclick: nuova }));
      t.mostra(s2);
    }
  });

  // ---------- partita salvata sul telefono (solo contro i Bot) ----------
  function salvaPartita(st, diff, aiuto) {
    try {
      if (st.fase === "fine") return localStorage.removeItem(SALVA);
      localStorage.setItem(SALVA, JSON.stringify({ v: 1, quando: Date.now(), nome: st.nomi[0], diff: diff, aiuto: aiuto, st: st }));
    } catch (e) {}
  }
  function leggiSalvata(nome) {
    try {
      var o = JSON.parse(localStorage.getItem(SALVA) || "null");
      if (!o || o.v !== 1 || !o.st || !o.st.mani || !o.st.punti || o.st.fase === "fine") return null;
      if (Date.now() - (o.quando || 0) > 3 * 864e5 || (nome !== undefined && o.nome && o.nome !== nome)) return null;   // vecchia o di un altro profilo (senza nome: va bene qualsiasi)
      return o;
    } catch (e) { return null; }
  }
  function cancellaSalvata() { try { localStorage.removeItem(SALVA); } catch (e) {} }

  // ---------- 👫 lo storico delle coppie di oggi (online, sul telefono dell'host; per NOME, si azzera a mezzanotte) ----------
  function oggi() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function leggiCoppie() {
    try {
      var o = JSON.parse(localStorage.getItem(COPPIE) || "null");
      if (!o || o.g !== oggi() || !o.c || typeof o.c !== "object") return {};
      var c = {};
      Object.keys(o.c).slice(0, 60).forEach(function (k) { var x = o.c[k]; if (x && typeof x.nomi === "string") c[k] = { nomi: x.nomi.slice(0, 40), v: +x.v || 0, p: +x.p || 0 }; });
      return c;
    } catch (e) { return {}; }
  }
  function salvaCoppie(c) { try { localStorage.setItem(COPPIE, JSON.stringify({ g: oggi(), c: c })); } catch (e) {} }
  function testoCoppia(x) { return x.nomi + ": " + x.v + (x.v === 1 ? " vinta" : " vinte") + ", " + x.p + (x.p === 1 ? " persa" : " perse"); }

  // ---------- motore ----------
  function creaStato(variante, traguardo, regole) {   // traguardo: i punti da raggiungere (0 = una mano sola)
    var st = {
      traguardo: traguardo == null ? TARGET : traguardo, regole: regole || { napola: false, ultima: false },
      variante: variante, mazzo: [], tavolo: [], mani: [[], [], [], []], prese: [[], [], [], []],
      scope: [0, 0, 0, 0], turno: 0, ultimaPresa: null, fase: "gioco", primo: 0,
      punti: { noi: 0, loro: 0 }, ultimoRound: null, presa: null, messaGiu: null, messaDa: 0,
      nomi: {}, posti: {}, ultime: {}, manoN: 0, giocate: 0, fumo: null, resto: null, risultatoDato: false
    };
    return st;
  }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function maniVuote(st) { return st.mani[0].length === 0 && st.mani[1].length === 0 && st.mani[2].length === 0 && st.mani[3].length === 0; }

  function distribuisci(st) {
    st.mazzo = C().creaMazzo(mischia);
    if (st.variante === "classico") { st.tavolo = st.mazzo.splice(0, 4); for (var s = 0; s < 4; s++) st.mani[s] = st.mazzo.splice(0, 9); }
    else { st.tavolo = []; for (var s2 = 0; s2 < 4; s2++) st.mani[s2] = st.mazzo.splice(0, 10); }
    st.prese = [[], [], [], []]; st.scope = [0, 0, 0, 0]; st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null;
    st.posti = {}; st.ultime = {}; st.manoN = (st.manoN || 0) + 1; st.giocate = 0; st.fumo = null; st.resto = null;
    st.psst = null; st.psstN = [0, 0, 0, 0];   // 🤫 i messaggi al compagno ricominciano a ogni smazzata
  }

  // esegue una mossa del giocatore "seat": ritorna {presa, scopa, sette, somma}. La fine mano la chiude chi chiama (dopo aver mostrato l'ultima giocata).
  function applica(st, seat, cartaId, presaIds) {
    var carta = trova(st.mani[seat], cartaId); if (!carta || st.turno !== seat || st.fase !== "gioco") return { errore: true };
    st.presa = null; st.messaGiu = null;
    st.mani[seat] = st.mani[seat].filter(function (c) { return c.id !== cartaId; });
    var opts = C().catture(carta.v, st.tavolo);
    var ev = { presa: false, scopa: false, sette: false, somma: false };
    st.ultime[seat] = carta; st.giocate++;
    if (opts.length) {
      var set = presaIds && C().validaSet(opts, presaIds) ? presaIds : opts[0];
      var tavoloPrima = st.tavolo.slice();
      var presi = set.map(function (id) { return trova(st.tavolo, id); }).filter(Boolean);
      st.tavolo = st.tavolo.filter(function (c) { return set.indexOf(c.id) < 0; });
      st.prese[seat] = st.prese[seat].concat(presi, [carta]);
      st.ultimaPresa = seat; ev.presa = true;
      ev.sette = carta.id === "D7" || set.indexOf("D7") >= 0; ev.somma = set.length >= 2;
      // scopa: si svuota il tavolo (con l'ultima carta della mano solo se l'host ha acceso "Scopa all'ultima carta")
      if (st.tavolo.length === 0 && (!maniVuote(st) || (st.regole && st.regole.ultima))) { st.scope[seat]++; ev.scopa = true; }
      st.presa = { chi: seat, carta: carta, scopa: ev.scopa, tavoloPrima: tavoloPrima, presiIds: set, n: st.giocate };
    } else {
      st.tavolo.push(carta); st.messaGiu = carta.id; st.messaDa = seat;
    }
    st.turno = (seat + 1) % 4;
    return ev;
  }
  function fineMano(st) {
    var mvp = migliori(st.prese, st.scope);   // 🏅 conta quello che ognuno ha preso LUI (le carte rimaste non sono merito suo)
    if (st.tavolo.length && st.ultimaPresa != null) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
    var r = contaScopone(st);
    r.mvp = mvp;
    st.punti.noi += r.puntiNoi; st.punti.loro += r.puntiLoro;
    r.tot = { noi: st.punti.noi, loro: st.punti.loro };
    st.ultimoRound = r; st.presa = null; st.resto = null; st.fumo = null;
    st.fase = C().partitaFinita(st.traguardo, st.punti.noi, st.punti.loro) ? "fine" : "fineround";
  }
  // 🏅 Il migliore in campo: per ogni coppia, chi dei due ha portato di più (scope e settebello pesano di più; a pari, nessuno)
  function bravura(prese, scope) {
    var b = { n: prese.length, den: 0, sette: false, n7: 0, scope: scope || 0 }, n6 = 0, n1 = 0;
    prese.forEach(function (c) { if (c.s === "D") b.den++; if (c.id === "D7") b.sette = true; if (c.v === 7) b.n7++; else if (c.v === 6) n6++; else if (c.v === 1) n1++; });
    b.punti = 2 * b.n + 3 * b.den + (b.sette ? 20 : 0) + 20 * b.scope + 4 * b.n7 + 2 * n6 + n1;   // (tutto ×2: numeri interi, il pari è un pari vero)
    return b;
  }
  function testoBravura(b) {   // "2 scope e il settebello", "il settebello e 6 denari", "14 carte e 5 denari"
    var p = [];
    if (b.scope) p.push(b.scope === 1 ? "1 scopa" : b.scope + " scope");
    if (b.sette) p.push("il settebello");
    if (p.length < 2 && b.den) p.push(b.den === 1 ? "1 denaro" : b.den + " denari");
    if (p.length < 2 && b.n7 >= 2) p.push(b.n7 + " sette");
    if (p.length < 2) p.push(b.n === 1 ? "1 carta" : b.n + " carte");
    return p.length > 1 ? p[0] + " e " + p[1] : p[0];
  }
  function migliori(prese, scope) {   // [coppia dei posti 0-2, coppia dei posti 1-3]: { s, testo } o null
    return [[0, 2], [1, 3]].map(function (c) {
      var a = bravura(prese[c[0]], scope[c[0]]), b = bravura(prese[c[1]], scope[c[1]]);
      if (a.punti === b.punti) return null;
      var s = a.punti > b.punti ? c[0] : c[1];
      return { s: s, testo: testoBravura(s === c[0] ? a : b) };
    });
  }
  function carteSquadra(st, team) { var o = []; for (var s = 0; s < 4; s++) if (squadra(s) === team) o = o.concat(st.prese[s]); return o; }
  // la Napola: asso, 2 e 3 di denari = 3 punti, poi +1 per ogni denaro che segue (4, 5, 6…)
  function napola(carte) {
    var d = {}; carte.forEach(function (c) { if (c.s === "D") d[c.v] = 1; });
    if (!(d[1] && d[2] && d[3])) return 0;
    var n = 3; while (n < 10 && d[n + 1]) n++;
    return n;
  }
  function contaScopone(st) {
    var A = carteSquadra(st, "noi"), B = carteSquadra(st, "loro");
    function den(x) { var n = 0; x.forEach(function (c) { if (c.s === "D") n++; }); return n; }
    var carteA = A.length, carteB = B.length, denA = den(A), denB = den(B);
    var sette = trova(A, "D7") ? "noi" : (trova(B, "D7") ? "loro" : null);
    var primA = C().primiera(A), primB = C().primiera(B);
    var scopeNoi = st.scope[0] + st.scope[2], scopeLoro = st.scope[1] + st.scope[3];
    var pCarte = carteA > carteB ? "noi" : carteB > carteA ? "loro" : null;
    var pDen = denA > denB ? "noi" : denB > denA ? "loro" : null;
    var pPrim = primA > primB ? "noi" : primB > primA ? "loro" : null;
    var conNap = !!(st.regole && st.regole.napola), napA = conNap ? napola(A) : 0, napB = conNap ? napola(B) : 0;
    function pts(team) { return (team === "noi" ? scopeNoi + napA : scopeLoro + napB) + (pCarte === team ? 1 : 0) + (pDen === team ? 1 : 0) + (sette === team ? 1 : 0) + (pPrim === team ? 1 : 0); }
    return { carteA: carteA, carteB: carteB, denA: denA, denB: denB, sette: sette, primA: primA, primB: primB, napola: conNap, napA: napA, napB: napB,
      pCarte: pCarte, pDen: pDen, pPrim: pPrim, scopeNoi: scopeNoi, scopeLoro: scopeLoro, scopeSeat: st.scope.slice(), puntiNoi: pts("noi"), puntiLoro: pts("loro") };
  }

  // ---------- la vista di un posto: il tavolo "girato" come lo vede chi sta al posto io (lui in basso, il compagno di fronte) ----------
  // È lo stesso stato che usa la partita contro i Bot (posto 0 = chi guarda lo schermo), così il disegno è uno solo.
  // Le carte in mano agli altri non ci sono (solo quante sono); le prese solo della sua coppia. guardo = chi guarda (non gioca).
  function vistaDa(st, io, guardo) {
    function r(s) { return (s - io + 4) % 4; }    // posto vero → posto sullo schermo
    function a(k) { return (k + io) % 4; }        // posto sullo schermo → posto vero
    var giro = io % 2 === 1;                      // la sua coppia è quella dei posti dispari: "noi" e "loro" si scambiano
    function sq(x) { return !giro || x == null ? x : (x === "noi" ? "loro" : "noi"); }
    function zeri(n) { var o = []; for (var i = 0; i < n; i++) o.push(0); return o; }
    var v = {
      io: io, guardo: !!guardo, traguardo: st.traguardo, regole: st.regole, variante: st.variante, aiuto: st.aiuto,
      tavolo: st.tavolo, fase: st.fase, manoN: st.manoN, giocate: st.giocate, posti: st.posti, messaGiu: st.messaGiu,
      mani: [0, 1, 2, 3].map(function (k) { return k === 0 ? st.mani[a(0)].slice() : zeri(st.mani[a(k)].length); }),
      prese: [0, 1, 2, 3].map(function (k) { return k % 2 === 0 ? st.prese[a(k)] : []; }),
      scope: [0, 1, 2, 3].map(function (k) { return st.scope[a(k)]; }),
      turno: r(st.turno), primo: r(st.primo || 0), ultimaPresa: st.ultimaPresa == null ? null : r(st.ultimaPresa), messaDa: r(st.messaDa || 0),
      punti: giro ? { noi: st.punti.loro, loro: st.punti.noi } : { noi: st.punti.noi, loro: st.punti.loro },
      presa: st.presa ? { chi: r(st.presa.chi), carta: st.presa.carta, scopa: st.presa.scopa, tavoloPrima: st.presa.tavoloPrima, presiIds: st.presa.presiIds, n: st.presa.n } : null,
      resto: sq(st.resto), fumo: st.fumo ? { s: r(st.fumo.s), txt: st.fumo.txt, forte: st.fumo.forte } : null,
      nomi: {}, omini: {}, ultime: {}, ultimoRound: null, risultatoDato: true
    };
    for (var k = 0; k < 4; k++) { v.nomi[k] = st.nomi[a(k)]; v.omini[k] = (st.omini && st.omini[a(k)]) || null; if (st.ultime && st.ultime[a(k)]) v.ultime[k] = st.ultime[a(k)]; }
    var u = st.ultimoRound;
    if (u) {
      v.ultimoRound = giro ? {
        carteA: u.carteB, carteB: u.carteA, denA: u.denB, denB: u.denA, sette: sq(u.sette), primA: u.primB, primB: u.primA, napola: u.napola, napA: u.napB, napB: u.napA,
        pCarte: sq(u.pCarte), pDen: sq(u.pDen), pPrim: sq(u.pPrim), scopeNoi: u.scopeLoro, scopeLoro: u.scopeNoi, puntiNoi: u.puntiLoro, puntiLoro: u.puntiNoi,
        tot: u.tot ? { noi: u.tot.loro, loro: u.tot.noi } : null
      } : JSON.parse(JSON.stringify(u));
      v.ultimoRound.scopeSeat = [0, 1, 2, 3].map(function (k) { return (u.scopeSeat || [])[a(k)] || 0; });
      v.ultimoRound.mvp = (u.mvp || []).filter(Boolean).map(function (x) { return { s: r(x.s), testo: x.testo }; });   // 🏅 (posti sullo schermo)
    }
    // 🤫 il messaggio al compagno: tutti sanno CHI l'ha mandato (🤫 sopra il suo avatar); la frase solo lui e il compagno
    if (st.psst) v.psst = { s: r(st.psst.s), n: st.psst.n, k: (!guardo && st.psst.k != null && (st.psst.s === io || st.psst.s === (io + 2) % 4)) ? st.psst.k : null };
    return v;
  }

  // ---------- bot ----------
  function mossaBot(st, seat, diff) {
    var mano = st.mani[seat], tavolo = st.tavolo, mosse = [];
    mano.forEach(function (c) {
      var opts = C().catture(c.v, tavolo);
      if (opts.length) opts.forEach(function (set) { mosse.push({ carta: c.id, presa: set, cattura: true, c: c, set: set }); });
      else mosse.push({ carta: c.id, presa: null, cattura: false, c: c, set: [] });
    });
    if (!mosse.length) return null;
    if (diff === "facile") return mosse[Math.floor(Math.random() * mosse.length)];
    if (diff === "difficile" && mosse.length > 1) return mossaDifficile(st, seat, mosse);
    function punteggio(m) {
      var s = 0;
      if (m.cattura) {
        s += importanza(m.c);
        m.set.forEach(function (id) { s += importanza(trova(tavolo, id)); });
        if (tavolo.length - m.set.length === 0) s += 6; // scopa
      } else s -= importanza(m.c) * 0.6;   // posa la carta meno preziosa
      return s;
    }
    var best = mosse[0], bs = -1e9;
    mosse.forEach(function (m) { var s = punteggio(m) + Math.random() * 0.25; if (s > bs) { bs = s; best = m; } });
    return best;
  }

  // prese possibili su un tavolo, calcolate una volta: valore -> liste di carte (singolo uguale obbligato)
  function tabellaPrese(tav) {
    var sing = {}, per = {}, n = tav.length;
    tav.forEach(function (c) { (sing[c.v] = sing[c.v] || []).push([c]); });
    if (n <= 12) for (var mask = 3; mask < (1 << n); mask++) {
      if (!(mask & (mask - 1))) continue;   // almeno due carte
      var s = 0, set = [];
      for (var i = 0; i < n && s <= 10; i++) if (mask & (1 << i)) { s += tav[i].v; set.push(tav[i]); }
      if (s <= 10) (per[s] = per[s] || []).push(set);
    }
    return function (v) { return sing[v] || per[v] || []; };
  }
  // Bot difficile: ricorda le carte uscite (le altre sono in mano agli altri tre) e immagina tante distribuzioni possibili.
  // Per ogni sua mossa: il prossimo avversario risponde col meglio per lui (pensando anche al mio compagno), poi il compagno.
  function mossaDifficile(st, seat, mosse) {
    var tavolo = st.tavolo, viste = {};
    st.mani[seat].concat(tavolo).forEach(function (c) { viste[c.id] = 1; });
    st.prese.forEach(function (p) { p.forEach(function (c) { viste[c.id] = 1; }); });
    var ignote = C().creaMazzo().filter(function (c) { return !viste[c.id]; });
    var avv = (seat + 1) % 4, comp = (seat + 2) % 4, nA = st.mani[avv].length, nC = st.mani[comp].length;
    var resto = st.mani[0].length + st.mani[1].length + st.mani[2].length + st.mani[3].length;   // carte ancora da giocare (con la mia)
    var ultimaVale = !!(st.regole && st.regole.ultima);
    var K = tavolo.length > 8 ? 8 : 14, campioni = [];
    for (var k = 0; k < K; k++) { var mz = mischia(ignote); campioni.push([mz.slice(0, nA), mz.slice(nA, nA + nC)]); }
    function valore(carta, presi, restano, scopaVale) {
      var s = importanza(carta); presi.forEach(function (c) { s += importanza(c); });
      if (restano === 0 && (scopaVale || ultimaVale)) s += 7;
      return s;
    }
    function togli(tav, presi) { return tav.filter(function (x) { return presi.indexOf(x) < 0; }); }
    function migliorePresa(mano, tav, prese, scopaVale) {   // la presa migliore che una mano può fare su questo tavolo (0 se nessuna)
      var b = 0;
      mano.forEach(function (c) { prese(c.v).forEach(function (pr) { var v = valore(c, pr, tav.length - pr.length, scopaVale); if (v > b) b = v; }); });
      return b;
    }
    var best = mosse[0], bs = -1e9;
    mosse.forEach(function (m) {
      var presi = m.cattura ? m.set.map(function (id) { return trova(tavolo, id); }) : [];
      var tav1 = m.cattura ? togli(tavolo, presi) : tavolo.concat([m.c]);
      var g1 = m.cattura ? valore(m.c, presi, tav1.length, resto > 1) : -0.35 * importanza(m.c);
      var prese1 = tabellaPrese(tav1), tot = 0;
      campioni.forEach(function (cp) {
        var hA = cp[0], hC = cp[1];
        if (!hA.length) { tot += g1 + 0.6 * migliorePresa(hC, tav1, prese1, resto > 3); return; }
        var bV = -1e9, g2b = 0, g3b = 0;
        hA.forEach(function (c) {
          var pp = prese1(c.v), giocate = pp.length ? pp : [null];
          giocate.forEach(function (pr) {
            var tav2 = pr ? togli(tav1, pr) : tav1.concat([c]);
            var g2 = pr ? valore(c, pr, tav2.length, resto > 2) : -0.35 * importanza(c);
            var g3 = hC.length ? migliorePresa(hC, tav2, tabellaPrese(tav2), resto > 3) : 0;
            var v = g2 - 0.6 * g3;
            if (v > bV) { bV = v; g2b = g2; g3b = g3; }
          });
        });
        tot += g1 - g2b + 0.6 * g3b;
      });
      var s = tot / K + Math.random() * 0.03;
      if (s > bs) { bs = s; best = m; }
    });
    return best;
  }

  // ---------- trofei: contatori per il profilo (la coppia "noi" = quella di chi gioca su questo telefono) ----------
  // r = riepilogo della mano visto da lui; info = { fase, traguardo, variante, punti: { noi, loro } }; scope / primoTurno: le sue
  function salvaTrofei(r, info, scope, primoTurno) {
    var c = { scopePersonali: scope, scopaPrimoTurno: primoTurno };
    if (r.sette === "noi") c.settebello = 1;
    if (r.pDen === "noi") c.denari = 1;
    if (r.pCarte === "noi") c.carte = 1;
    if (r.pPrim === "noi") c.primiera = 1;
    if (r.sette === "noi" && r.pDen === "noi" && r.pCarte === "noi" && r.pPrim === "noi") c.grandeSlam = 1;
    var sets = [], recs = [];
    if (info.fase === "fine" && !(info.traguardo != null && info.traguardo < TARGET)) {   // (con una mano sola o pochi punti sarebbero regalati)
      var vinto = info.punti.noi > info.punti.loro, sci = info.variante === "scientifico";
      var s0 = (window.SGNube && SGNube.statGioco && SGNube.statGioco("scopone")) || {}, serie = s0.serieSciOra || 0;
      c.partite = 1;
      if (vinto) {
        c.vinte = 1; c[sci ? "vinteScientifico" : "vinteClassico"] = 1;
        if (info.punti.loro === 0) c.vinteAZero = 1;
      }
      if (sci) { serie = vinto ? serie + 1 : 0; recs.push(["serieSciMax", serie]); sets.push(["serieSciOra", serie]); }
    }
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var incrs = []; for (var k in c) if (c[k]) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(null, "scopone", incrs, recs, sets);
  }
  // contro i Bot: tu = posto 0
  function tracciaScopone(st, seat, ev, primaDellaMossa) {
    var R = st._T || (st._T = { scope: 0, primoTurno: 0 });
    if (seat === 0 && ev.scopa) {
      R.scope++;
      if (st.variante === "classico" && primaDellaMossa === 9) R.primoTurno++;   // la tua prima carta della smazzata
    }
    if (st.fase === "gioco") return;
    st._T = null;
    salvaTrofei(st.ultimoRound, st, R.scope, R.primoTurno);
  }
  // online: dalle viste che arrivano (posto 0 = io). Ricaricata la pagina sul riepilogo: quello è già stato contato
  function tracciaOnline(T, v) {
    if (T.fase === null && v.fase !== "gioco") { T.fase = v.fase; return; }
    var prima = T.fase; T.fase = v.fase;
    if (!(v.fase === "fineround" || v.fase === "fine") || prima === v.fase || !v.ultimoRound) return;
    salvaTrofei(v.ultimoRound, v, (v.ultimoRound.scopeSeat || [])[0] || 0, 0);
  }

  // ---------- suoni e vibrazioni ----------
  function suonoPresa(scopa) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try { var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(scopa ? 520 : 360, t); o.frequency.exponentialRampToValueAtTime(scopa ? 880 : 300, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (scopa ? 0.28 : 0.16));
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) {}
  }
  function suonoNote(note, vol) {   // piccole note in fila (tocca a te)
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime;
      note.forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + n[1];
        o.type = "sine"; o.frequency.setValueAtTime(n[0], t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.25);
      });
    } catch (e) {}
  }
  function suonoVittoria() {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      [523, 659, 784, 1047].forEach(function (f, i) {
        var t = ctx.currentTime + i * 0.13, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (i === 3 ? 0.6 : 0.22));
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.65);
      });
    } catch (e) {}
  }
  // vibra quando tocchi tu una carta per sceglierla e nei momenti che contano (scopa della tua coppia, vittoria): brevi
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function tocco() { vibra(10); }

  // ---------- controller locale (tu = seat 0) ----------
  function localeScopone(t, variante, diff, aiuto, salvata) {
    C().assicuraStile(); stileScopone();
    var finita = false, timers = [];
    var mioNome = (t.nomeProfilo && t.nomeProfilo()) || t.giocatori[0] || "Tu";
    var st, sel = { carta: null, presa: [] };
    function nomi() {   // i tre bot fissi (SG.bot), scelti dalla bravura: 1 a sinistra, 2 il compagno di fronte, 3 a destra
      var b = SG.bot && SG.bot.prendi ? SG.bot.prendi(3, { livello: diff, escludi: [mioNome] }) : [];
      st.nomi = { 0: mioNome }; st.omini = {};
      [1, 2, 3].forEach(function (s, i) { var x = b[i] || { nome: "Bot " + s, omino: null }; st.nomi[s] = x.nome; st.omini[s] = x.omino || null; });
    }
    function nuovaPartita() { st = creaStato(variante, C().traguardoDa(t.impostazioni), regoleDa(t.impostazioni)); nomi(); distribuisci(st); }
    if (salvata) { st = salvata; nomi(); st.presa = null; st.fumo = null; st.resto = null; st.posti = st.posti || {}; st.ultime = st.ultime || {}; st.regole = st.regole || { napola: false, ultima: false }; }
    else nuovaPartita();

    // i tempi dei bot: si fermano tutti quando si esce (così la partita non torna da sola sopra la home)
    function dopoMs(fn, ms) {
      var id = setTimeout(function () {
        timers = timers.filter(function (x) { return x !== id; });
        if (finita) return;
        if (V.uscito()) { chiudi(); return; }   // la schermata non c'è più (uscito in un altro modo)
        fn();
      }, ms);
      timers.push(id);
    }
    function chiudi() { finita = true; timers.forEach(clearTimeout); timers = []; if (window.SGMusica) window.SGMusica.ferma(); }
    function esci() { chiudi(); cancellaSalvata(); t.esci(); }

    var V = vista(t, {
      onCella: function (i) { tapMano(i); },
      onTavolo: function (id) { tapTavolo(id); },
      onAvanti: function () { st.primo = (st.primo + 1) % 4; distribuisci(st); sel = { carta: null, presa: [] }; salvaPartita(st, diff, aiuto); render(); avviaGiro(); },
      onNuova: function () { nuovaPartita(); sel = { carta: null, presa: [] }; salvaPartita(st, diff, aiuto); render(); avviaGiro(); },
      onEsci: esci,
      onIndietro: function () { if (st.fase === "fine") return esci(); t.conferma("Uscire dalla partita?", null, "Esci", esci); }
    }, aiuto, function () { return finita; });

    function render() { if (!finita) V.disegna(st, sel); }

    function tapMano(id) {
      if (finita || st.turno !== 0 || st.fase !== "gioco" || st.presa) return;
      var carta = trova(st.mani[0], id); if (!carta) return;
      tocco();
      var opts = C().catture(carta.v, st.tavolo);
      if (opts.length === 0) { sel = { carta: null, presa: [] }; gioco(0, id, null); return; }
      if (opts.length === 1) { sel = { carta: null, presa: [] }; gioco(0, id, opts[0]); return; }
      sel = (sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] }; render();
    }
    function tapTavolo(id) {
      if (finita || st.turno !== 0 || st.fase !== "gioco" || st.presa) return;
      var carta = sel.carta ? trova(st.mani[0], sel.carta) : null; if (!carta) return;
      var opts = C().catture(carta.v, st.tavolo);
      var p = sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      if (C().validaSet(opts, p)) { tocco(); var cid = sel.carta; sel = { carta: null, presa: [] }; gioco(0, cid, p); return; }
      if (C().prefisso(opts, p)) { tocco(); sel.presa = p; }
      render();
    }
    function gioco(seat, id, presa) {
      var primaDellaMossa = st.mani[0].length;
      var ev = applica(st, seat, id, presa); if (ev.errore) return;
      tracciaScopone(st, seat, ev, primaDellaMossa);
      // il fumetto: chi ha fatto il colpo, oppure il compagno che ti fa i complimenti
      st.fumo = null;
      if (seat === 0) { if (ev.scopa) st.fumo = { s: 2, txt: pesca(FRASI.bravo) }; else if (ev.sette) st.fumo = { s: 2, txt: pesca(FRASI.braviSette) }; }
      else if (ev.scopa) st.fumo = { s: seat, txt: pesca(FRASI.scopa), forte: true };
      else if (ev.sette) st.fumo = { s: seat, txt: pesca(FRASI.sette), forte: true };
      else if (ev.somma && Math.random() < 0.5) st.fumo = { s: seat, txt: pesca(FRASI.somma) };
      if (ev.presa) suonoPresa(ev.scopa);
      if (ev.scopa && seat % 2 === 0) vibra(35);   // scopa della tua coppia: un momento che conta
      salvaPartita(st, diff, aiuto);
      render(); dopo(ev);
    }
    function dopo(ev) {
      if (maniVuote(st)) {   // l'ultima carta: prima si vede la giocata, poi le carte rimaste, poi i punti
        dopoMs(function () {
          st.presa = null; st.fumo = null;
          if (st.tavolo.length && st.ultimaPresa != null) {
            st.resto = squadra(st.ultimaPresa); render();
            dopoMs(chiudiMano, 1600);
          } else chiudiMano();
        }, ev.presa ? (ev.scopa ? 1500 : 1100) : 800);
        return;
      }
      if (ev.presa) dopoMs(function () { st.presa = null; st.fumo = null; render(); giro(); }, ev.scopa ? 1500 : 1000);
      else giro();
    }
    function chiudiMano() {
      fineMano(st);
      tracciaScopone(st, -1, {}, 0);
      salvaPartita(st, diff, aiuto);   // a fine partita cancella il salvataggio
      render();
    }
    function giro() { // fa giocare i bot finché non tocca a te (o finisce)
      if (finita || st.fase !== "gioco") return;
      if (st.turno === 0) { render(); return; }
      dopoMs(function () {
        if (st.fase !== "gioco" || st.turno === 0 || st.presa) { render(); return; }
        var m = mossaBot(st, st.turno, diff); gioco(st.turno, m.carta, m.presa);
      }, Math.max(750 + Math.random() * 400, V.dealFino() - Date.now() + 250));   // i bot aspettano la fine della distribuzione
    }
    function avviaGiro() { if (st.fase === "gioco" && st.turno !== 0) giro(); }

    render();
    if (st.fase === "gioco" && maniVuote(st)) chiudiMano();   // ripresa proprio dopo l'ultima carta
    else avviaGiro(); // se inizia (o tocca) a un bot
  }

  // ========================================================
  //  ONLINE — il telefono di chi gioca (host o ospite) o di chi guarda: riceve le viste e manda le sue mosse
  //  o: { sonoHost, gioca(id, presa), voto(), onAvanti(), onNuova(), onEsci(), cambiaVista() }
  // ========================================================
  function clientScopone(t, o) {
    var Cl = { st: null, sel: { carta: null, presa: [] }, chiuso: false, attesa: null, T: { fase: null }, mioPrima: false, presaN: null };
    var V = vista(t, {
      onCella: function (id) { tapMano(id); },
      onTavolo: function (id) { tapTavolo(id); },
      onAvanti: function () { if (o.onAvanti) o.onAvanti(); },   // il conto del riepilogo arriva a zero (solo l'host)
      onVoto: function () { if (o.voto) o.voto(); },
      onNuova: function () { if (o.onNuova) o.onNuova(); },
      onEsci: function () { o.onEsci(); },
      onIndietro: function () { o.onEsci(); },
      onCambiaVista: function () { if (o.cambiaVista) o.cambiaVista(); },
      onPsst: function (k) { if (o.psst) o.psst(k); },
      onScambia: o.scambia ? function (piede) { o.scambia(piede); } : null
    }, true, function () { return Cl.chiuso; }, { online: true, sonoHost: !!o.sonoHost });
    Cl.V = V;
    // 🤫 un messaggio nuovo: il compagno legge la frase sopra il mio avatar, gli altri (e chi guarda) solo 🤫, per 4 secondi;
    // chi l'ha mandato vede passare "🤫 A Luca: «…»". Chi rientra non rivede quelli vecchi (l'host li tiene 4 secondi)
    function vediPsst(st) {
      var p = st.psst;
      if (!p) return;
      if (p.n === Cl.psstN) { V.psstPosto(p.s); return; }   // (chi guarda e cambia giocatore: il fumetto resta sopra chi l'ha mandato)
      Cl.psstN = p.n;
      var frase = p.k != null ? PSST[p.k] : null;
      if (p.s === 0 && !st.guardo) { if (frase) V.avvisoLocale("🤫 A " + st.nomi[2] + ": «" + frase + "»"); return; }
      var dalComp = p.s === 2 && !st.guardo && frase;
      V.psst({ n: p.n, s: p.s, txt: dalComp ? frase : "🤫", fino: Date.now() + PSST_MS });
      if (dalComp) { vibra(25); suonoNote([[988, 0], [1319, 0.08]], 0.07); }   // il compagno ti ha detto qualcosa: un momento che conta
      clearTimeout(Cl.psstT);
      Cl.psstT = setTimeout(function () { if (!V.uscito()) Cl.ridisegna(); }, PSST_MS + 80);   // il fumetto se ne va (solo se il tavolo c'è ancora)
    }
    function puo() {
      var st = Cl.st;
      if (!st || Cl.chiuso || st.guardo || st.turno !== 0 || st.fase !== "gioco" || st.presa || st.resto) return false;
      return !(Cl.attesa && Cl.attesa.g === st.giocate && Date.now() < Cl.attesa.fino);   // la mossa è partita: si aspetta l'host
    }
    function manda(id, presa) { Cl.attesa = { g: Cl.st.giocate, fino: Date.now() + 4000 }; Cl.sel = { carta: null, presa: [] }; o.gioca(id, presa); }
    function tapMano(id) {
      if (!puo()) return;
      var st = Cl.st, carta = trova(st.mani[0], id); if (!carta) return;
      tocco();
      var opts = C().catture(carta.v, st.tavolo);
      if (opts.length === 0) return manda(id, null);
      if (opts.length === 1) return manda(id, opts[0]);
      Cl.sel = (Cl.sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] }; Cl.ridisegna();
    }
    function tapTavolo(id) {
      if (!puo()) return;
      var st = Cl.st, carta = Cl.sel.carta ? trova(st.mani[0], Cl.sel.carta) : null; if (!carta) return;
      var opts = C().catture(carta.v, st.tavolo);
      var p = Cl.sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      if (C().validaSet(opts, p)) { tocco(); return manda(Cl.sel.carta, p); }
      if (C().prefisso(opts, p)) { tocco(); Cl.sel.presa = p; }
      else if (C().prefisso(opts, [id])) { tocco(); Cl.sel.presa = [id]; }   // carta di un'altra presa: si ricomincia la scelta da quella
      Cl.ridisegna();
    }
    Cl.setVm = function (st) {
      if (Cl.chiuso || !st) return;
      var prima = Cl.st;
      if (st.turno !== 0 || st.fase !== "gioco" || st.guardo || (prima && prima.manoN !== st.manoN)) Cl.sel = { carta: null, presa: [] };
      if (Cl.attesa && (st.giocate !== Cl.attesa.g || st.fase !== "gioco")) Cl.attesa = null;
      // quando arriva il tuo turno, un piccolo suono
      var mio = !st.guardo && st.fase === "gioco" && st.turno === 0 && !st.presa && !st.resto;
      if (mio && !Cl.mioPrima) suonoNote([[660, 0], [880, 0.09]], 0.12);
      Cl.mioPrima = mio;
      if (st.presa && st.presa.n !== Cl.presaN) {
        Cl.presaN = st.presa.n; suonoPresa(st.presa.scopa);
        if (st.presa.scopa && st.presa.chi % 2 === 0 && !st.guardo) vibra(35);   // scopa della mia coppia
      }
      if (!st.presa) Cl.presaN = null;
      if (!st.guardo) tracciaOnline(Cl.T, st);   // trofei (chi guarda non ne prende)
      Cl.st = st;
      vediPsst(st);
      V.disegna(st, Cl.sel);
    };
    Cl.ridisegna = function () { if (Cl.st && !Cl.chiuso) V.disegna(Cl.st, Cl.sel); };
    Cl.azzera = function () { Cl.st = null; Cl.sel = { carta: null, presa: [] }; Cl.attesa = null; Cl.presaN = null; Cl.mioPrima = false; clearTimeout(Cl.psstT); V.azzera(); };
    return Cl;
  }

  // ========================================================
  //  ONLINE — HOST = posto 0; gli amici prendono i posti 1, 2, 3 (di fronte = il compagno dell'host).
  //  I posti vuoti li fanno i Bot. A ognuno arriva solo la SUA vista (con le sue carte), mai quella degli altri;
  //  chi guarda riceve tutto e sceglie lui di chi vedere le carte.
  //  La rete salta, la partita no: se l'host ricarica la pagina (o riapre l'app) la mano continua da dove era
  //  (t.ripresa); se il suo telefono si spegne del tutto, un amico seduto al tavolo porta avanti la partita dal suo
  //  posto (host di riserva) e l'host di prima, se torna, si riprende il suo.
  // ========================================================
  var RESPIRO = 5000;   // (ripresa) i secondi di respiro prima che i Bot tornino a giocare: gli amici intanto rientrano
  function hostScopone(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    C().assicuraStile(); stileScopone();
    var IO = t.mioId || "host";   // chi tiene la partita su questo telefono ("host", o l'id da amico del vice)
    // il mio posto: lo 0; dopo un subentro (host di riserva) quello dove giocavo; -1 = tengo la partita guardando.
    // In saletta è sempre lo 0 (l'host di prima, se c'è, si siede in un posto da amico)
    var MIO = 0;
    function altri() { return [0, 1, 2, 3].filter(function (s) { return s !== MIO; }); }
    var H = { st: null, codice: "…", pronta: false, chiuso: false, attesa: false, pid: "",
      posti: { 0: null, 1: null, 2: null, 3: null }, nomi: { 0: null, 1: null, 2: null, 3: null }, avi: { 0: null, 1: null, 2: null, 3: null },
      via: {},                                       // via[posto] = chi è uscito a partita in corso (se torna, si riprende il suo posto)
      bot: { 0: false, 1: true, 2: true, 3: true },  // chi gioca col computer durante la partita
      guarda: [],                                    // chi guarda: { id, nome, sala } (sala = non scelto in "Chi gioca?"; se no aspetta un posto)
      avanti: {}, scad: 0, nAvviso: 0, avviso: null, detto: false, storico: leggiCoppie(), giocateTurno: -1, psstN: 0, scambia: false,
      rip: 0,          // quante volte la partita è ripresa (nella chiave del conto del riepilogo: riparte giusto su tutti)
      gSeat: 0 };      // (se tengo la partita guardando) di chi guardo le carte
    var timers = [], respiroFino = 0, attesi = {};
    function dopo(fn, ms) { var id = setTimeout(function () { timers = timers.filter(function (x) { return x !== id; }); if (!H.chiuso) fn(); }, ms); timers.push(id); return id; }
    function fermaTutto() { timers.forEach(clearTimeout); timers = []; }
    function imp() { return t.impostazioni || {}; }
    function diff() { return imp().difficolta || "medio"; }
    function mioNome() { return (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Host"; }
    function mioAv() { return t.mioOmino ? t.mioOmino(mioNome()) : C().mioAvatar(mioNome()); }
    function seatDi(id) { var l = altri().filter(function (s) { return H.posti[s] === id; }); return l.length ? l[0] : -1; }
    function postoLibero() { var l = altri().filter(function (s) { return !H.posti[s]; }); return l.length ? l[0] : -1; }
    function guardaDi(id) { for (var i = 0; i < H.guarda.length; i++) if (H.guarda[i].id === id) return H.guarda[i]; return null; }
    function idDi(s) { return s === MIO ? IO : H.posti[s]; }
    function umani() { var o = MIO >= 0 ? [IO] : []; altri().forEach(function (s) { if (H.posti[s] && !(H.st && H.bot[s])) o.push(H.posti[s]); }); return o; }
    function avviso(testo) { H.avviso = { n: ++H.nAvviso, testo: testo }; }

    // ---- la partita si ricorda (t.ricorda) dopo ogni cambiamento: se l'host ricarica la mano continua; in saletta niente ----
    var ricordato = !!(t.ripresa && t.ripresa.stato && t.ripresa.stato.scopone);
    function ricorda(x, soloQui) {
      if (!t.ricorda) return;
      if (!x) { if (ricordato) { ricordato = false; t.ricorda(null); } return; }
      ricordato = true; t.ricorda(x, soloQui);
    }
    function ricordaOra() {
      if (!H.st) return;
      var st = JSON.parse(JSON.stringify(H.st)); delete st.psst;   // (il 🤫 di questo momento dura 4 secondi: non si ricorda)
      var x = { scopone: { st: st, mio: MIO, io: IO, posti: H.posti, nomi: H.nomi, avi: H.avi, bot: H.bot, via: H.via, guarda: H.guarda,
        pid: H.pid, scad: H.scad, avanti: H.avanti, nAvviso: H.nAvviso, detto: H.detto, psstN: H.psstN, rip: H.rip, gSeat: H.gSeat } };
      x.fase = st.fase;
      var tx = JSON.stringify(x), soloQui = null;
      if (tx.length > 50000) {   // (gli avatar sono tanti: restano su questo telefono, la copia per il vice va senza)
        x = JSON.parse(tx); var y = x.scopone;
        soloQui = { omini: y.st.omini, avi: y.avi, via: {}, guarda: {} };
        y.st.omini = {}; y.avi = { 0: null, 1: null, 2: null, 3: null };
        Object.keys(y.via).forEach(function (k) { soloQui.via[k] = y.via[k].omino; y.via[k].omino = null; });
        y.guarda.forEach(function (g) { soloQui.guarda[g.id] = g.omino; g.omino = null; });
      }
      ricorda(x, soloQui);
    }
    // (host di riserva) chi porta avanti la partita se sparisco: gli amici seduti al tavolo (hanno già le loro carte e il loro posto)
    var viciK = "";
    function vici() {
      if (!t.vici) return;
      var l = altri().filter(function (s) { return H.posti[s] && !H.bot[s]; }).map(function (s) { return H.posti[s]; }), k = l.join(",");
      if (k !== viciK) { viciK = k; t.vici(l.length ? l : null); }
    }

    function viaHost() { ricorda(null); H.chiuso = true; Cl.chiuso = true; fermaTutto(); if (window.SGMusica) window.SGMusica.ferma(); if (rete) rete.chiudi(); t.esci(); }
    var Cl = clientScopone(t, {
      sonoHost: true,
      gioca: function (id, presa) { if (MIO >= 0) passo(MIO, id, presa); },
      voto: function () { voto(IO, H.st && H.st.manoN); },
      psst: function (k) { if (MIO >= 0) psstDa(MIO, k); },
      cambiaVista: function () { if (MIO < 0) { H.gSeat = (H.gSeat + 1) % 4; mostraMia(); } },   // (tengo la partita guardando: 🔄)
      // "🔁 Rivincita a coppie scambiate": la Rivincita di sempre (quella del core, col 3-2-1), ma prima si cambiano i compagni
      scambia: function (piede) {
        if (!H.st || H.st.fase !== "fine") return;
        H.scambia = true;
        var b = piede && piede.querySelector(".ft-primo");
        if (b && !b.disabled && document.body.contains(b)) b.click();   // (il tocco è già tuo: il core non vibra due volte)
        else tornaSaletta();
      },
      onAvanti: prossimaMano,
      onNuova: tornaSaletta,
      onEsci: function () {   // (dalla saletta il core ha già chiesto "Chiudere la stanza per tutti?")
        if (H.st && H.st.fase !== "fine") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", viaHost);
        viaHost();
      }
    });
    t.onRegole = function () { if (!H.st) aggiornaLobby(); };   // l'host ha cambiato le regole in saletta: lo vedono tutti
    t.onRivincita = tornaSaletta;                                 // la "↻ Rivincita" della Sala: tutti nella stessa saletta

    // un bot del gruppo fisso per un posto libero: mai uno già al tavolo, né col nome di chi gioca, di chi è uscito o di chi guarda
    function mettiBot(s) {
      var escludi = [mioNome()], k;
      for (k = 0; k <= 3; k++) if (H.nomi[k]) escludi.push(H.nomi[k]);
      if (H.st) for (k = 0; k < 4; k++) if (H.st.nomi[k] && k !== s) escludi.push(H.st.nomi[k]);
      Object.keys(H.via).forEach(function (x) { escludi.push(H.via[x].nome); });
      H.guarda.forEach(function (g) { escludi.push(g.nome); });
      var b = prendiBot(1, diff(), escludi)[0];
      H.st.nomi[s] = b.nome; H.st.omini[s] = b.omino || null;
    }

    // ---- le viste ----
    function infoAvanti(s) {
      var u = umani(), si = u.filter(function (id) { return H.avanti[id]; }).length;
      return { si: si, tot: u.length, resta: Math.max(1, Math.ceil((H.scad - Date.now()) / 1000)), mio: s != null && !!H.avanti[idDi(s)] };
    }
    // 👫 lo storico delle coppie di oggi (per nome, anche tra una stanza e l'altra): "Paky e Luca: 3 vinte, 1 persa"
    function storicoTesti() {   // a fine partita: le due coppie che hanno appena giocato
      var st = H.st, o = [];
      if (st) [0, 1].forEach(function (tm) { var x = H.storico[[st.nomi[tm], st.nomi[tm + 2]].sort().join("|")]; if (x) o.push(testoCoppia(x)); });
      return o;
    }
    // quanti 🤫 restano a questo posto (-1 = niente tasto: messaggi spenti, o lui o il compagno sono Bot)
    function psstResto(s) { var st = H.st; return (s != null && st && st.conPsst && !H.bot[s] && !H.bot[(s + 2) % 4]) ? PSST_MAX - (st.psstN[s] || 0) : -1; }
    function extra(v, s) {
      v.pid = H.pid; v.rip = H.rip; v.avviso = H.avviso; v.avanti = infoAvanti(s); v.storico = H.st && H.st.fase === "fine" ? storicoTesti() : null;
      v.psstResto = psstResto(s);
      if (s != null && s === MIO) v.scambia = !!(H.st && H.st.fase === "fine" && (imp().coppie || "scelte") === "scelte" && altri().some(function (k) { return H.posti[k]; }));   // (l'host: "🔁 Rivincita a coppie scambiate")
      return v;
    }
    function pieno() {   // per chi guarda: tutto (sceglie lui di chi vedere le carte) tranne il mazzo, che non serve
      var st = H.st, o = {};
      for (var k in st) if (k !== "mazzo" && k !== "_T") o[k] = st[k];
      if (st.psst) o.psst = { s: st.psst.s, n: st.psst.n };   // 🤫 chi guarda vede solo CHI l'ha mandato, mai la frase
      return o;
    }
    // 🤫 un messaggio al compagno: passa dall'host, la frase va solo a chi l'ha mandato e al compagno (nella LORO vista,
    // come le carte); agli altri e a chi guarda solo "🤫" sopra l'avatar. Al massimo PSST_MAX a testa per smazzata; dopo 4 s sparisce
    function psstDa(s, k) {
      var st = H.st; k = +k;
      if (H.chiuso || !st || !st.conPsst || st.fase !== "gioco" || !(k >= 0 && k < PSST.length) || k % 1) return;
      if (H.bot[s] || H.bot[(s + 2) % 4]) return;   // il compagno è un Bot: niente messaggi
      if ((st.psstN[s] || 0) >= PSST_MAX) { if (s !== MIO) mandaVm(s); return; }
      st.psstN[s] = (st.psstN[s] || 0) + 1;
      var n = ++H.psstN; st.psst = { s: s, k: k, n: n };
      bcast();
      dopo(function () { if (st.psst && st.psst.n === n) st.psst = null; }, PSST_MS);   // (chi rientra dopo non lo rivede)
    }
    function mandaVm(s) { if (rete && H.posti[s]) rete.inviaVeloce({ t: "vm", to: H.posti[s], vm: extra(vistaDa(H.st, s), s) }); }   // solo a lui, e non resta sul server
    function mandaGuarda(id) { if (rete && H.st) rete.inviaVeloce({ t: "vm", to: id, vm: extra({ guardo: true, pieno: pieno() }, null) }); }
    // la mia vista: dal mio posto; se tengo la partita guardando (vice che guardava), come chi guarda (🔄 per cambiare)
    function mostraMia() {
      if (H.chiuso || !H.st) return;
      if (MIO >= 0) return Cl.setVm(extra(vistaDa(H.st, MIO), MIO));
      Cl.setVm(extra(vistaDa(pieno(), H.gSeat, true), null));
    }
    function bcast() {
      if (H.chiuso) return;
      if (!H.st) return aggiornaLobby();
      ricordaOra();
      altri().forEach(function (s) { if (!H.bot[s]) mandaVm(s); });
      H.guarda.forEach(function (g) { mandaGuarda(g.id); });
      vici();
      mostraMia();
    }

    // ---- la partita ----
    function comincia() {
      if (H.st || H.chiuso) return;
      var im = imp();
      if (im.coppie === "caso") sorteggia(false);
      var st = H.st = creaStato(im.variante || "scientifico", C().traguardoDa(im), regoleDa(im));
      st.aiuto = im.aiuto !== false; H.pid = Math.random().toString(36).slice(2, 8);
      st.conPsst = !!im.psst; H.scambia = false;   // 🤫 messaggi al compagno (⚙️)
      st.nomi = { 0: mioNome() }; st.omini = { 0: mioAv() };
      for (var s = 1; s <= 3; s++) { H.bot[s] = !H.posti[s]; if (H.posti[s]) { st.nomi[s] = H.nomi[s]; st.omini[s] = H.avi[s]; } }
      for (s = 1; s <= 3; s++) if (H.bot[s]) mettiBot(s);
      st.primo = Math.floor(Math.random() * 4);   // chi comincia la prima mano: a caso (poi gira)
      distribuisci(st);
      H.via = {}; H.detto = false; H.avanti = {}; H.avviso = null;
      if (im.coppie === "caso") avviso("🎲 Coppie: " + st.nomi[0] + " e " + st.nomi[2] + " contro " + st.nomi[1] + " e " + st.nomi[3]);
      if (rete) rete.invia({ t: "inCorso", fase: "gioco" });   // sul server resta solo "partita in corso" (niente carte di nessuno)
      bcast(); giro();
    }
    // l'ultima carta è giocata: prima si vede la giocata, poi le carte rimaste, poi i punti
    function chiudiDopo(st, ms) {
      H.attesa = true;
      dopo(function () {
        if (H.st !== st) return;
        st.presa = null; st.fumo = null;
        if (st.tavolo.length && st.ultimaPresa != null) { st.resto = squadra(st.ultimaPresa); bcast(); dopo(function () { if (H.st === st) chiudiMano(); }, 1600); }
        else chiudiMano();
      }, ms);
    }
    function passo(seat, id, presa) {
      var st = H.st;
      if (H.chiuso || !st || st.fase !== "gioco" || st.turno !== seat || st.presa || st.resto || H.attesa) return false;
      var ev = applica(st, seat, id, presa); if (ev.errore) return false;
      st.fumo = null;
      if (ev.scopa) st.fumo = { s: seat, txt: pesca(FRASI.scopa), forte: true };
      else if (ev.sette) st.fumo = { s: seat, txt: pesca(FRASI.sette), forte: true };
      else if (ev.somma && H.bot[seat] && Math.random() < 0.5) st.fumo = { s: seat, txt: pesca(FRASI.somma) };
      bcast();
      if (maniVuote(st)) { chiudiDopo(st, ev.presa ? (ev.scopa ? 1500 : 1100) : 800); return true; }
      if (ev.presa) { H.attesa = true; dopo(function () { if (H.st !== st) return; H.attesa = false; st.presa = null; st.fumo = null; bcast(); giro(); }, ev.scopa ? 1500 : 1000); }
      else giro();
      return true;
    }
    function giro() {
      var st = H.st;
      if (H.chiuso || !st || st.fase !== "gioco" || H.attesa) return;
      var s = st.turno, g = st.giocate;
      if (H.bot[s]) {
        dopo(function () {
          if (H.st !== st || st.fase !== "gioco" || st.turno !== s || st.giocate !== g || H.attesa || !H.bot[s]) return;
          var m = mossaBot(st, s, diff()); if (m) passo(s, m.carta, m.presa);
        }, Math.max(750 + Math.random() * 400, Cl.V.dealFino() - Date.now() + 250, respiroFino - Date.now()));   // i bot aspettano la fine della distribuzione (e il respiro dopo una ripresa)
        return;
      }
      // tocca a un amico: se non gioca per tanto (distratto, telefono in tasca) gioca il Bot al posto suo, una carta
      if (H.giocateTurno === g + "|" + st.manoN) return;
      H.giocateTurno = g + "|" + st.manoN;
      dopo(function () {
        if (H.st !== st || st.fase !== "gioco" || st.turno !== s || st.giocate !== g || H.bot[s]) return;
        avviso("⏱️ " + st.nomi[s] + ", tra 15 secondi gioca il Bot al posto tuo"); bcast();
      }, (TEMPO_TURNO - 15) * 1000);
      dopo(function () {
        if (H.st !== st || st.fase !== "gioco" || st.turno !== s || st.giocate !== g || H.bot[s]) return;
        if (H.attesa) return;
        var m = mossaBot(st, s, "medio"); if (!m) return;
        avviso("⏱️ " + st.nomi[s] + " ci pensava troppo: il Bot ha giocato al posto suo");
        passo(s, m.carta, m.presa);
      }, TEMPO_TURNO * 1000);
    }
    function chiudiMano() {
      var st = H.st; if (!st) return;
      H.attesa = false;
      fineMano(st);
      H.avanti = {}; H.scad = Date.now() + PAUSA_MANO * 1000;
      if (st.fase === "fine") finePartita();
      bcast();
    }
    function prossimaMano() {
      var st = H.st;
      if (H.chiuso || !st || st.fase !== "fineround") return;
      st.primo = (st.primo + 1) % 4; distribuisci(st);
      H.avanti = {}; H.avviso = null;
      bcast(); giro();
    }
    // "⏩ Avanti" sul riepilogo della mano: se lo tocca più di metà di chi gioca si parte subito (se no, il conto alla rovescia)
    function voto(id, m) {
      var st = H.st;
      if (!st || st.fase !== "fineround" || (m != null && m !== st.manoN)) return;
      if (umani().indexOf(id) < 0) return;   // chi guarda non vota
      H.avanti[id] = 1;
      var I = infoAvanti(null);
      if (I.si * 2 > I.tot) return prossimaMano();
      bcast();
    }
    function finePartita() {
      var st = H.st; if (H.detto) return;
      H.detto = true;
      var v = st.punti.noi > st.punti.loro ? 0 : 1, pari = st.punti.noi === st.punti.loro;
      // 👫 le coppie di oggi: quante vinte e quante perse (per nome; resta sul telefono dell'host fino a mezzanotte)
      [0, 1].forEach(function (tm) {
        var a = st.nomi[tm], b = st.nomi[tm + 2], k = [a, b].sort().join("|");
        var x = H.storico[k] || (H.storico[k] = { nomi: a + " e " + b, v: 0, p: 0 });
        if (!pari) { if (tm === v) x.v++; else x.p++; }
      });
      salvaCoppie(H.storico);
      // per la Classifica della serata e gli XP: i nomi, chi vince al posto 1 (pari: tutti al posto 1)
      if (t.risultato) t.risultato([0, 2, 1, 3].map(function (k) { var x = { nome: st.nomi[k], pos: (k % 2 === v || pari) ? 1 : 3 }; if (k !== MIO && H.bot[k]) x.bot = true; return x; })
        .sort(function (a, b) { return a.pos - b.pos; }));
      if (rete) rete.invia({ t: "fine", fase: "fine" });   // (sul server: la partita è finita, senza carte)
    }
    function rientra(s) {   // chi era uscito a partita in corso torna al suo posto (al posto del bot)
      var v = H.via[s]; delete H.via[s];
      H.posti[s] = v.id; H.nomi[s] = v.nome; H.avi[s] = v.omino; H.bot[s] = false;
      H.st.nomi[s] = v.nome; H.st.omini[s] = v.omino;
      avviso(v.nome + " torna al tavolo!");
      bcast(); giro();
    }
    // "Nuova partita" (e la Rivincita della Sala): tutti di nuovo nella stessa saletta
    function tornaSaletta() {
      if (!H.st || H.st.fase !== "fine") return;
      fermaTutto();
      H.st = null; H.via = {}; H.attesa = false; H.avanti = {}; H.detto = false; H.avviso = null; H.giocateTurno = -1; attesi = {};
      if (MIO !== 0) {   // (tenevo la partita al posto di un altro: in saletta torno al posto 0, chi era lì prende il mio)
        var chi0 = H.posti[0] ? { id: H.posti[0], nome: H.nomi[0], omino: H.avi[0] } : null;
        var mioPrima = MIO;
        H.posti[0] = H.nomi[0] = H.avi[0] = null; MIO = 0;
        if (chi0) {
          var l0 = mioPrima > 0 && !H.posti[mioPrima] ? mioPrima : postoLibero();
          if (l0 >= 0) { H.posti[l0] = chi0.id; H.nomi[l0] = chi0.nome; H.avi[l0] = chi0.omino; }
          else if (!guardaDi(chi0.id)) H.guarda.push(chi0);
        }
      }
      H.bot[0] = false;
      for (var s = 1; s <= 3; s++) H.bot[s] = true;
      if (imp().coppie === "giro" || H.scambia) ruota();   // compagni a giro (ognuno gioca con tutti) o "🔁 Rivincita a coppie scambiate"
      H.scambia = false;
      promuovi();
      Cl.azzera();
      aggiornaLobby();
    }
    // chi aspettava un posto (arrivato a partita cominciata o a tavolo pieno) si siede appena c'è posto
    function promuovi() {
      H.guarda = H.guarda.filter(function (g) {
        if (g.sala) return true;
        var s = postoLibero(); if (s < 0) return true;
        H.posti[s] = g.id; H.nomi[s] = g.nome; H.avi[s] = g.omino || null; return false;
      });
    }
    // le coppie in saletta: 🔀 cambia il compagno dell'host (ruota i posti 1-2-3), 🎲 a caso
    function ruota() {
      var P = [H.posti[1], H.posti[2], H.posti[3]], N = [H.nomi[1], H.nomi[2], H.nomi[3]], A = [H.avi[1], H.avi[2], H.avi[3]];
      for (var i = 0; i < 3; i++) { var d = ((i + 1) % 3) + 1; H.posti[d] = P[i]; H.nomi[d] = N[i]; H.avi[d] = A[i]; }
    }
    function sorteggia(nuove) {
      var prima = [H.posti[1], H.posti[2], H.posti[3]].join(","), giri = 0;
      do {
        var ord = mischia([1, 2, 3]), P = [], N = [], A = [];
        ord.forEach(function (s) { P.push(H.posti[s]); N.push(H.nomi[s]); A.push(H.avi[s]); });
        for (var i = 0; i < 3; i++) { H.posti[i + 1] = P[i]; H.nomi[i + 1] = N[i]; H.avi[i + 1] = A[i]; }
      } while (nuove && [H.posti[1], H.posti[2], H.posti[3]].join(",") === prima && ++giri < 6);
    }

    // ---- la saletta ----
    function seggi() {
      return [{ nome: mioNome(), id: IO, omino: mioAv() }].concat([1, 2, 3].map(function (s) { return H.posti[s] ? { nome: H.nomi[s], id: H.posti[s], omino: H.avi[s] } : null; }));
    }
    function storicoLobby() {   // il record delle coppie di adesso (se hanno già giocato insieme in questa stanza)
      var o = [];
      [[0, 2], [1, 3]].forEach(function (c) {
        var n = c.map(function (s) { return s === 0 ? mioNome() : H.nomi[s]; });
        if (!n[0] || !n[1]) return;
        var x = H.storico[n.slice().sort().join("|")];
        if (x && (x.v || x.p)) o.push(testoCoppia(x));
      });
      return o;
    }
    function aggiornaLobby() {
      if (H.st || H.chiuso) return;
      ricorda(null);   // (in saletta niente da riprendere)
      if (rete) rete.invia({ t: "lobby", codice: H.codice, pronta: H.pronta, seggi: seggi(), guarda: H.guarda, coppie: imp().coppie || "scelte", storico: storicoLobby(), psst: !!imp().psst });
      disegnaLobby();
    }
    function disegnaLobby() {
      if (H.st || H.chiuso) return;
      renderLobby(t, { codice: H.codice, pronta: H.pronta, sonoHost: true, myId: IO, seggi: seggi(), guarda: H.guarda, coppie: imp().coppie || "scelte", storico: storicoLobby(), psst: !!imp().psst }, {
        onComincia: comincia,
        onCambia: function () { if (!H.st) { ruota(); aggiornaLobby(); } },
        onCaso: function () { if (!H.st) { sorteggia(true); aggiornaLobby(); } },
        onEsci: viaHost
      });
    }

    // ---- la ripresa (t.ripresa): stessa mano (le carte in mano a tutti, il tavolo, le prese), stessi punti, stessi posti e
    // stesse coppie. Gli amici restano al loro posto e rientrano da soli (il join gli rimanda le sue carte); chi non torna in
    // 30 s lascia il posto al Bot (come quando se ne va: se torna, se lo riprende). Se la tengo io al posto dell'host sparito
    // (t.ripresa.daRiserva) gioco dal mio posto e il suo resta a lui
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.scopone;
    if (RIP && RIP.st && Array.isArray(RIP.st.mani) && RIP.st.fase !== "lobby") {
      var oraR = t.ripresa.ora || function (x) { return x; }, SQ = t.ripresa.soloQui || null, st0 = H.st = RIP.st;
      st0.presa = null; st0.fumo = null; st0.psst = null;   // (una presa che si stava guardando è già fatta: si va avanti)
      st0.omini = st0.omini || {};
      if (SQ && SQ.omini) st0.omini = SQ.omini;
      ["posti", "nomi", "avi", "bot"].forEach(function (k) {
        var x = (k === "avi" && SQ && SQ.avi) || RIP[k] || {};
        for (var s = 0; s <= 3; s++) H[k][s] = k === "bot" ? !!x[s] : (x[s] || null);
      });
      H.via = RIP.via && typeof RIP.via === "object" ? RIP.via : {};
      H.guarda = Array.isArray(RIP.guarda) ? RIP.guarda : [];
      if (SQ && SQ.via) Object.keys(H.via).forEach(function (k) { if (SQ.via[k]) H.via[k].omino = SQ.via[k]; });
      if (SQ && SQ.guarda) H.guarda.forEach(function (g) { if (SQ.guarda[g.id]) g.omino = SQ.guarda[g.id]; });
      H.pid = RIP.pid || ""; H.avanti = RIP.avanti && typeof RIP.avanti === "object" ? RIP.avanti : {};
      H.nAvviso = +RIP.nAvviso || 0; H.detto = !!RIP.detto; H.psstN = +RIP.psstN || 0; H.rip = (+RIP.rip || 0) + 1; H.gSeat = +RIP.gSeat || 0;
      H.scad = RIP.scad ? oraR(RIP.scad) : 0;
      // chi teneva la partita (il suo posto e il suo id); se adesso la tengo io da un altro posto (host di riserva),
      // il suo posto diventa quello di un amico che rientra (o del Bot) e il mio quello dove giocavo
      var mioPrima = RIP.mio >= -1 && RIP.mio <= 3 ? +RIP.mio : 0, ioPrima = RIP.io || "host";
      MIO = mioPrima;
      if (ioPrima !== IO) {
        var sMio = [0, 1, 2, 3].filter(function (s) { return H.posti[s] === IO; })[0];
        if (mioPrima >= 0) { H.posti[mioPrima] = ioPrima; H.nomi[mioPrima] = st0.nomi[mioPrima]; H.avi[mioPrima] = st0.omini[mioPrima] || null; H.bot[mioPrima] = false; }
        Object.keys(H.via).forEach(function (k) { if (H.via[k] && H.via[k].id === IO) delete H.via[k]; });
        if (sMio != null) { MIO = sMio; H.posti[MIO] = H.nomi[MIO] = H.avi[MIO] = null; H.bot[MIO] = false; }
        else MIO = -1;   // (guardavo: tengo la partita guardando, il posto dell'host resta suo)
        H.guarda = H.guarda.filter(function (g) { return g.id !== IO; });
      }
      altri().forEach(function (s) { if (H.posti[s] && !H.bot[s]) attesi[H.posti[s]] = 1; });
      H.guarda.forEach(function (g) { attesi[g.id] = 1; });
    }

    var cbR = {
      onCodice: function (c) { H.codice = c; if (!H.st) aggiornaLobby(); },
      onConnesso: function () { H.pronta = true; if (!H.st) aggiornaLobby(); },
      // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
      onErrore: function () { if (H.pronta || H.st || H.chiuso) return; H.chiuso = true; Cl.chiuso = true; fermaTutto(); if (rete) rete.chiudi(); erroreRete(t, "Non riesco ad aprire la stanza.", function () { hostScopone(t); }); },
      // un amico sparito senza salutare: se è il suo turno lo diciamo (dopo 20 secondi arriva onAddio e gioca il Bot)
      onForse: function (id) { var s = seatDi(id); if (s >= 0 && H.st && H.st.fase === "gioco" && !H.bot[s]) { avviso("📶 " + H.nomi[s] + " si sta ricollegando…"); bcast(); } },
      onAddio: function (id) {
        delete attesi[id];
        var g0 = H.guarda.length; H.guarda = H.guarda.filter(function (g) { return g.id !== id; });
        var s = seatDi(id);
        if (s < 0) { if (H.guarda.length !== g0 && !H.st) aggiornaLobby(); return; }
        var nome = H.nomi[s];
        H.posti[s] = null; H.nomi[s] = null; H.avi[s] = null;
        if (H.st && H.st.fase !== "fine") {   // il suo posto passa a un Bot (se torna, se lo riprende)
          H.via[s] = { id: id, nome: nome, omino: H.st.omini[s] };
          H.bot[s] = true; mettiBot(s);
          avviso(nome + " esce dalla partita: gioca il Bot " + H.st.nomi[s]);
          bcast(); giro();
        } else if (!H.st) { promuovi(); aggiornaLobby(); }
      },
      onMsg: function (id, m) {
        if (H.chiuso || !m || !m.t) return;
        delete attesi[id];   // (ripresa: si è rifatto vivo)
        if (m.t === "join") {
          var nome = String(m.nome || "Amico").slice(0, 16), s = seatDi(id), g = guardaDi(id);
          if (s >= 0) { if (H.st) mandaVm(s); else aggiornaLobby(); return; }   // chi rientra (pagina ricaricata) ritrova il suo posto e le sue carte
          if (H.st) { var kv = altri().filter(function (k) { return H.via[k] && H.via[k].id === id && !H.posti[k]; })[0]; if (kv != null) { rientra(kv); return; } }
          if (g) { if (H.st) mandaGuarda(id); else aggiornaLobby(); return; }
          // nella Sala chi non è stato scelto in "Chi gioca?" guarda (il suo id va nella foto, tra chi guarda)
          if (t.puoSedersi && !t.puoSedersi(id, nome)) { H.guarda.push({ id: id, nome: nome, sala: true }); if (H.st) mandaGuarda(id); else aggiornaLobby(); return; }
          var om = C().avatarValido(m.omino);
          var libero = H.st ? -1 : postoLibero();
          if (libero >= 0) { H.posti[libero] = id; H.nomi[libero] = nome; H.avi[libero] = om; }
          else if (H.guarda.length < 12) H.guarda.push({ id: id, nome: nome, omino: om });   // partita cominciata o tavolo pieno: guarda ed entra alla prossima
          if (H.st) mandaGuarda(id); else aggiornaLobby();
          return;
        }
        if (!H.st) return;
        if (m.t === "gioca") { var sm = seatDi(id); if (sm >= 0 && !H.bot[sm] && !passo(sm, m.carta, m.presa)) mandaVm(sm); }   // mossa non valida: gli rimando la sua vista
        else if (m.t === "avanti") voto(id, m.m);
        else if (m.t === "psst") { var sp = seatDi(id); if (sp >= 0) psstDa(sp, m.k); }
      }
    };
    var rete = SGNet.ospita(ID, cbR, H.st ? { ripresa: true } : null);   // (ripresa: gli amici restano al tavolo, non tornano in saletta)
    if (!rete) return senzaRete(t);
    // (per le prove) lo stato vero della partita su questo telefono
    window.__SCOPONEhost = { st: function () { return H.st; }, H: H, mio: function () { return MIO; }, io: IO };
    if (!H.st) { disegnaLobby(); return; }
    // (ripresa) il tavolo com'era, a ognuno le sue carte; dopo il respiro si va avanti da dove si era
    var stR = H.st;
    if (rete) rete.invia(stR.fase === "fine" ? { t: "fine", fase: "fine" } : { t: "inCorso", fase: "gioco" });   // (sul server solo a che punto è la partita, senza carte)
    if (stR.fase === "gioco") {
      if (maniVuote(stR)) { bcast(); chiudiDopo(stR, RESPIRO); }   // l'ultima carta era già giocata: si chiude la mano
      else { respiroFino = Date.now() + RESPIRO; bcast(); giro(); }   // tocca a chi toccava (i Bot dopo il respiro)
    } else {
      if (stR.fase === "fineround") H.scad = Math.max(H.scad || 0, Date.now() + RESPIRO + 1000);   // il riepilogo, col tempo che restava (almeno 6 s)
      bcast();
    }
    // chi non si rifà vivo in 30 s lascia il posto al Bot (come quando se ne va; se torna, se lo riprende)
    dopo(function () { if (H.st && !Cl.V.uscito()) Object.keys(attesi).forEach(function (id) { cbR.onAddio(id); }); }, 30000);   // (non se il core ha già portato via il gioco)
  }

  // ========================================================
  //  ONLINE — OSPITE: disegna le viste che arrivano dall'host e manda solo le sue mosse
  // ========================================================
  function ospiteScopone(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    C().assicuraStile(); stileScopone();
    var S = { rete: null, myId: null, nome: "", chiuso: false, seat: 0, guardo: null, inGioco: false, visto: false };
    function via() { S.chiuso = true; Cl.chiuso = true; if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); }
    var Cl = clientScopone(t, {
      sonoHost: false,
      gioca: function (id, presa) { if (S.rete) S.rete.invia({ t: "gioca", carta: id, presa: presa }); },
      voto: function () { if (S.rete && Cl.st) S.rete.invia({ t: "avanti", m: Cl.st.manoN }); },
      psst: function (k) { if (S.rete) S.rete.invia({ t: "psst", k: k }); },   // 🤫 al compagno (passa dall'host)
      onEsci: function () {
        if (Cl.st && Cl.st.fase !== "fine" && !Cl.st.guardo) return t.conferma("Uscire dalla partita?", "Al tuo posto gioca un Bot.", "Esci", via);
        via();
      },
      cambiaVista: function () { S.seat = (S.seat + 1) % 4; mostraGuardo(); }   // chi guarda: le carte del prossimo giocatore
    });
    // chi guarda: la vista dal posto scelto (le carte di quel giocatore sulla mensola)
    function mostraGuardo() {
      var g = S.guardo; if (!g || !g.pieno) return;
      var v = vistaDa(g.pieno, S.seat, true);
      v.pid = g.pid; v.rip = g.rip; v.avviso = g.avviso; v.avanti = g.avanti; v.storico = g.storico;
      Cl.setVm(v);
    }
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra nello Scopone", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function attesa(testo) {
      var s = t.schermata({ icona: "🃏", titolo: "Entro nello Scopone…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: via });
      S.msg = t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: testo || "Collegamento in corso…" });
      s._contenuto.appendChild(S.msg); t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : C().mioAvatar(S.nome) }); },
        onMsg: function (m) {
          if (!m || S.chiuso) return;
          S.visto = true;
          if (m.to && m.to !== S.myId) return;   // un messaggio per un altro telefono (le sue carte): non è per me
          if (m.t === "vm" && m.vm) {
            S.inGioco = true;
            if (m.vm.guardo) { S.guardo = m.vm; mostraGuardo(); } else { S.guardo = null; Cl.setVm(m.vm); }
          } else if (m.t === "lobby") {
            if (S.inGioco) { S.inGioco = false; S.guardo = null; Cl.azzera(); }   // "Nuova partita": si torna in saletta
            renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, seggi: m.seggi, guarda: m.guarda, coppie: m.coppie, storico: m.storico, psst: m.psst }, { onEsci: via });
          } else if (m.t === "inCorso") {
            if (!S.inGioco && S.msg && document.body.contains(S.msg)) S.msg.textContent = "La partita è cominciata: sto entrando…";
          }
        },
        // la stanza è chiusa: { voluto: true } = l'host l'ha chiusa apposta; { sparito: true } = l'host non è tornato
        onChiuso: function (perche) {
          if (S.chiuso) return;
          var finita = Cl.st && Cl.st.fase === "fine";
          S.chiuso = true; Cl.chiuso = true;
          if (finita) grazie(t); else errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita.");
        },
        // SOLO se il primo collegamento non è riuscito: si riprova (dopo, la rete che salta la gestisce il core)
        onErrore: function () { if (S.chiuso || S.visto) return; if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
  }

  // saletta uguale per host e ospiti: le due coppie (viste da chi guarda lo schermo), i Bot nei posti liberi; i tasti solo all'host
  function renderLobby(t, L, cb) {
    var el = t.el, seggi = L.seggi || [], mio = -1;
    for (var k = 0; k < seggi.length; k++) if (seggi[k] && seggi[k].id === L.myId) mio = k;
    var gio = [], umani = 0;
    seggi.forEach(function (g, i) { if (g) { umani++; gio.push({ id: g.id, nome: g.nome, omino: g.omino || null, host: i === 0, tu: g.id === L.myId }); } });
    var guarda = L.guarda || [], guardo = mio < 0 && guarda.some(function (g) { return g.id === L.myId; }), sala = guardo && guarda.some(function (g) { return g.id === L.myId && g.sala; });
    var io = mio < 0 ? 0 : mio;
    function nomeSeat(i) { var g = seggi[i]; return g ? (g.id === L.myId ? "tu" : g.nome) : "🤖 Bot"; }
    // (compatto: con la saletta e i tasti deve stare tutto in uno schermo da 360x640)
    var righe = [
      el("div", {}, [ el("b", { text: "🟢 " + nomeSeat(io) + " + " + nomeSeat((io + 2) % 4) }), document.createTextNode(" 🆚 "),
        el("b", { text: "🔴 " + nomeSeat((io + 1) % 4) + " + " + nomeSeat((io + 3) % 4) }) ]) ];
    if (L.coppie === "caso") righe.push(el("div", { style: "opacity:.8;font-size:.85em", text: "🎲 Le coppie si sorteggiano al via" }));
    else if (L.coppie === "giro") righe.push(el("div", { style: "opacity:.8;font-size:.85em", text: "🔄 A ogni partita si cambia compagno" }));
    if (L.storico && L.storico.length) righe.push(el("div", { style: "opacity:.8;font-size:.85em", text: "👫 " + L.storico.join(" · ") }));   // le coppie di adesso, oggi
    var sotto = [];
    if (L.psst) sotto.push("🤫 messaggi al compagno");
    if (umani < 4) sotto.push("i posti liberi li fanno i Bot");
    if (sotto.length) { sotto[0] = sotto[0].charAt(0).toUpperCase() + sotto[0].slice(1); righe.push(el("div", { style: "opacity:.8;font-size:.85em", text: sotto.join(" · ") })); }
    if (L.sonoHost && umani > 1 && L.coppie !== "caso") {
      righe.push(el("div", { style: "display:flex;gap:6px;justify-content:center;margin-top:4px" }, [
        el("button", { class: "btn btn-fantasma", style: "margin:0;min-height:0;padding:5px 12px;font-size:.85rem;width:auto", text: "🔀 Cambia compagno", onclick: cb.onCambia }),
        el("button", { class: "btn btn-fantasma", style: "margin:0;min-height:0;padding:5px 12px;font-size:.85rem;width:auto", text: "🎲 A caso", onclick: cb.onCaso }) ]));
    }
    if (guarda.length) righe.push(el("div", { style: "opacity:.8;font-size:.85em", text: "👀 Guardano: " + guarda.map(function (g) { return g.id === L.myId ? "tu" : g.nome; }).join(", ") }));
    var box = el("div", { class: "modulo-nota", style: "text-align:center;line-height:1.5" }, righe);
    t.lobby({ host: L.sonoHost, codice: L.codice, pronta: L.pronta, min: 1, puoiDaSolo: true, vuoti: 0, giocatori: gio, extra: [box],
      nota: L.sonoHost ? "Puoi cominciare quando vuoi: i posti vuoti li fanno i Bot." : null,
      spettatore: guardo ? (sala ? "👀 Questa volta guardi" : "👀 Tavolo pieno: guardi la partita") : null,
      attesa: guardo ? "Al tavolo giocano in quattro: questa partita la guardi." : "Aspetta che l'host cominci: si gioca in coppia! 🃏",
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreRete(t, testo, riprova) {   // il primo collegamento non è riuscito: "Riprova" rifà il collegamento da capo
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function grazie(t) {   // l'host ha chiuso a partita finita: niente errore
    var s = t.schermata({ icona: "👋", titolo: "Partita chiusa" });
    s._contenuto.appendChild(t.el("p", { text: "L'host ha chiuso la stanza: grazie per aver giocato!", style: "font-size:1.05rem;line-height:1.5;text-align:center" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "Lo Scopone online funziona quando l'app è aperta dal sito pubblicato. Intanto puoi giocare contro i Bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---------- stile in più (solo Scopone) ----------
  var DIREZ = { 0: [0, 210], 1: [-150, -190], 2: [0, -210], 3: [150, -190] };   // verso ogni posto (sul tavolo inclinato)
  function stileScopone() {
    if (document.getElementById("sg-scopone-css")) return;
    var r = [
      ".sc-carta.sp-puo{box-shadow:0 0 0 3px rgba(105,219,124,.9),0 2px 6px rgba(0,0,0,.45)}",
      ".sc-carta.sp-no{opacity:.38;transition:opacity .2s}",
      ".sc-carta{transition:opacity .2s}",
      ".sp-ult{font-size:.66rem;font-weight:900;background:#fff7e0;color:#3b2400;border-radius:6px;padding:0 4px;line-height:1.35}",
      ".sp-ult:empty{display:none}",
      ".sc-avv-carte .sc-dorso{transition:transform .25s ease}",
      ".sc-fumetto.sp-dx{transform-origin:100% 100%}",
      ".sc-fumetto.sp-dx::after{left:auto;right:-6px;border:7px solid transparent;border-left-color:#fff;border-right:0}",
      ".sc-fumetto.scopa.sp-dx::after{border-left-color:var(--o-oro)}",
      ".sc-fumetto.sp-frase{font-size:.95rem}",
      // online: chi guarda tocca la riga sotto la mano per vedere le carte di un altro
      ".sc-prese.sp-guardo{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}",
      ".sp-tocca{display:inline-block;background:var(--o-tasto);color:var(--o-tasto-testo);font-weight:900;border-radius:999px;padding:1px 10px;margin-right:6px;animation:spPulsa 1.2s ease-in-out infinite}",
      "@keyframes spPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}",
      // online: un avviso che passa (uscito, tornato, coppie sorteggiate…)
      ".sp-avviso{position:absolute;left:50%;top:44px;transform:translateX(-50%);z-index:9;max-width:92%;text-align:center;background:var(--o-carta);border:1.5px solid var(--o-oro);color:var(--o-testo);font-weight:800;font-size:.85rem;padding:6px 12px;border-radius:12px;pointer-events:none;animation:spAvviso 3.6s ease forwards}",
      "@keyframes spAvviso{0%{opacity:0;transform:translate(-50%,-8px)}10%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-8px)}}",
      ".sp-avanti{display:flex;flex-direction:column;align-items:center;gap:4px}",
      ".sp-avanti .btn{margin:0}",
      ".sp-avanti p{margin:0;text-align:center;font-weight:800}",
      ".sp-storico{text-align:center;font-size:.8rem;margin-top:6px;opacity:.85}",
      ".sp-mvp{text-align:center;font-size:.8rem;font-weight:700;margin-top:4px;line-height:1.35}",
      ".sp-stretto .sp-avs{display:none}.sp-stretto .sp-storico{margin-top:3px}",
      ".sp-scambia{margin:0 0 6px!important;min-height:0!important;padding:7px 12px!important;font-size:.9rem!important}",
      // 🤫 il tasto vicino alla mano e il pannellino delle frasi
      ".sp-psst{position:absolute;right:8px;bottom:calc(5px + env(safe-area-inset-bottom));z-index:7;margin:0;min-height:0;height:28px;padding:0 10px;border-radius:999px;border:1px solid var(--o-filo-oro);background:var(--o-carta);color:var(--o-testo);font-weight:900;font-size:.85rem;line-height:1;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,.3)}",
      ".sp-psst[disabled]{opacity:.4;cursor:default}",
      ".sp-psst-pan{position:absolute;left:8px;right:8px;bottom:100%;margin-bottom:6px;z-index:8;background:var(--o-carta);border:1.5px solid var(--o-oro);border-radius:14px;padding:8px;box-shadow:0 6px 18px rgba(0,0,0,.4);animation:spPan .18s ease-out}",
      "@keyframes spPan{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
      ".sp-psst-tit{font-size:.8rem;font-weight:800;text-align:center;margin:0 26px 6px;color:var(--o-testo)}",
      ".sp-psst-gr{display:grid;grid-template-columns:1fr 1fr;gap:6px}",
      ".sp-psst-f{margin:0;min-height:38px;border-radius:10px;border:1px solid var(--o-filo-oro);background:var(--o-carta-2);color:var(--o-testo);font-weight:800;font-size:.82rem;padding:4px 6px;line-height:1.15;cursor:pointer}",
      ".sp-psst-x{position:absolute;top:3px;right:4px;margin:0;min-height:0;background:none;border:0;color:var(--o-tenue);font-size:1.05rem;padding:3px 8px;cursor:pointer}",
      // fine mano: tabella Noi / Loro
      ".sp-tab{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:4px;font-size:.95rem}",
      ".sp-tab > div{padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.05);text-align:center}",
      ".sp-tab > div.sx{text-align:left}",
      ".sp-tab > div.th{background:none;font-weight:800;color:rgba(255,255,255,.75);padding:2px 8px;line-height:1.15}",
      ".sp-tab > div.ok{background:rgba(105,219,124,.18);font-weight:800}",
      ".sp-tab > div.tot{background:rgba(255,212,59,.14);font-weight:800}",
      ".g-scopone.oro .sp-tab > div{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo)}",
      ".g-scopone.oro .sp-tab > div.th{background:none;box-shadow:none;color:var(--o-tenue)}",
      ".g-scopone.oro .sp-tab > div.ok{background:var(--o-verde-tenue);color:var(--o-verde);box-shadow:inset 0 0 0 1px var(--o-verde)}",
      ".g-scopone.oro .sp-tab > div.tot{background:var(--o-crema);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
      ".g-scopone.oro .sp-tot{font-family:var(--o-tit);font-weight:700;font-variant-numeric:lining-nums}",
      ".g-scopone .sp-ult{background:var(--o-crema);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
      ".sp-avs{display:flex;justify-content:center;gap:10px;margin:2px 0 6px}",
      ".sp-avs > div{width:78px}",
      ".sp-avs svg{display:block;width:100%;height:auto}",
      ".sp-avs.festa > div{animation:spSalta 1s ease-in-out infinite}",
      ".sp-avs.festa > div:nth-child(2){animation-delay:.25s}",
      "@keyframes spSalta{0%,100%{transform:none}40%{transform:translateY(-12px)}}",
      // telefoni bassi (360x640): riepilogo più stretto, così i tasti restano a vista senza scorrere
      "@media (max-height:740px){.sp-tab{font-size:.86rem;gap:3px}.sp-tab > div{padding:2px 8px}.sp-avs{margin:0 0 2px}.sp-avs > div{width:54px}.sp-tot{font-size:1.15rem!important;margin-top:4px!important}" +
        // (l'host con «🔁 Rivincita a coppie scambiate» ha un tasto in più: sugli schermi bassi niente avatar della festa e righe più strette)
        ".sp-mvp{font-size:.74rem;line-height:1.22;margin-top:2px}.sp-avs > div{width:46px}.sp-piu .sp-avs{display:none}.sp-piu .sp-storico{margin-top:3px;font-size:.75rem}.sp-piu .sp-scambia{padding:5px 12px!important;margin-bottom:4px!important}}",
      ".sp-cori{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}",
      ".sp-cori i{position:absolute;top:-20px;width:9px;height:14px;border-radius:2px;animation:spCade 2.6s ease-in forwards}",
      "@keyframes spCade{0%{transform:translateY(0) rotate(0);opacity:1}85%{opacity:1}100%{transform:translateY(105vh) rotate(540deg);opacity:0}}"
    ];
    // le carte volano verso chi le prende / arrivano da chi le gioca (solo transform e opacity)
    [0, 1, 2, 3].forEach(function (d) {
      var x = DIREZ[d][0], y = DIREZ[d][1], xa = Math.round(x * 0.7), ya = Math.round(y * 0.7);
      r.push("@keyframes spVia" + d + "{0%,35%{transform:none;opacity:1}100%{transform:translate(" + x + "px," + y + "px) scale(.4);opacity:0}}");
      r.push(".sp-via" + d + "{animation:spVia" + d + " .95s ease-in forwards;position:relative;z-index:4}");
      r.push("@keyframes spGioca" + d + "{0%{transform:translate(" + xa + "px," + ya + "px) scale(.92);opacity:0}16%{opacity:1}30%,38%{transform:none;opacity:1}100%{transform:translate(" + x + "px," + y + "px) scale(.4);opacity:0}}");
      r.push(".sp-gioca" + d + "{animation:spGioca" + d + " .95s ease-in forwards}");
      r.push("@keyframes spPosa" + d + "{0%{transform:translate(" + xa + "px," + ya + "px) scale(1.08);opacity:0}60%{opacity:1}100%{transform:none;opacity:1}}");
      r.push(".sp-posa" + d + "{animation:spPosa" + d + " .4s ease-out}");
    });
    var s = document.createElement("style"); s.id = "sg-scopone-css"; s.textContent = r.join(""); document.head.appendChild(s);
  }

  // ---------- disegno ----------
  // La stanza (avatar, tavolo, mensola) si costruisce una volta per mano; poi a ogni mossa si cambia solo quello che serve.
  // opz (online): { online: true, sonoHost }. Lo stato è sempre "visto dal posto 0" (contro i Bot: tu; online: vistaDa).
  var cacheFig = {};
  function vista(t, cb, aiuto, eFinita, opz) {
    opz = opz || {};
    var el = t.el, mont = null, dealFino = 0, schermo = null, FIN = null;
    var psstF = null;   // 🤫 il fumetto del messaggio al compagno: { n, s (posto sullo schermo), txt, fino }

    // il disegno di un avatar con un'espressione (lo fa la stanza condivisa; si tiene da parte)
    function figHtml(nome, cfg, faccia) {
      var k = nome + "|" + faccia + "|" + (cfg ? JSON.stringify(cfg) : "");
      if (cacheFig[k] == null) {
        var R0 = C().stanza4(el, { scH: 300, pianoW: 300, pianoH: 200 }, [{ nome: nome, cfg: cfg, n: 0, faccia: faccia }]);
        cacheFig[k] = R0.posti[0].fig.innerHTML;
      }
      return cacheFig[k];
    }
    function misure(st) {
      var A = Math.min(window.innerWidth || 375, 600) - 46, wH = Math.max(40, Math.min(70, Math.floor((A - 4 * 8) / 5)));
      var M = C().misureStanza4("scopone", wH, 2);
      // (online la stanza si rifà anche quando cambia chi siede o da che posto si guarda: un amico esce e arriva un Bot)
      var chi = st ? (st.io || 0) + "|" + [1, 2, 3].map(function (s) { return st.nomi[s]; }).join(",") : "";
      return { M: M, wH: wH, k: M.corr.k + "|" + wH + "|" + chi };
    }

    var ultimo = null;   // l'ultimo disegno (per rifare la stanza della misura giusta se si gira il telefono)
    function disegna(st, sel) {
      ultimo = { st: st, sel: sel }; vistaViva = api;
      if (st.fase === "fineround" || st.fase === "fine") { mont = null; return fine(st); }
      FIN = null;
      var ms = misure(st);
      var nuova = !mont || !document.body.contains(mont.s) || mont.manoN !== st.manoN;
      if (nuova || mont.k !== ms.k) return costruisci(st, sel, ms, nuova && st.giocate === 0);
      aggiorna(st, sel);
    }

    function costruisci(st, sel, ms, deal) {
      var M = ms.M, wH = ms.wH, ASP = C().ASP_CARTA;
      if (window.SGMusica) window.SGMusica.avvia(function () { return !schermo || document.body.contains(schermo); });   // (portati via dal core: la musica si ferma da sola)
      var box = el("div", { style: "display:flex;flex-direction:column" });
      var head = el("div", { class: "sc-testata" });   // punteggio e musica DENTRO la stanza (in alto; a sinistra c'è il tasto indietro)
      var punti = el("div", { style: "font-size:.82rem;font-weight:700" });
      head.appendChild(punti);
      if (window.SGMusica) head.appendChild(window.SGMusica.bottone(el));
      // la stanza: un avversario a sinistra, il compagno di fronte, l'altro avversario a destra
      var sedie = [1, 2, 3].map(function (s) { return { cfg: (st.omini && st.omini[s]) || null, nome: st.nomi[s], n: st.mani[s].length, turno: false, mia: s === 2, faccia: "normale", fumetto: null }; });
      var R = C().stanza4(el, M, sedie);
      R.scena.appendChild(head);
      R.posti.forEach(function (p) { p.ult = el("span", { class: "sp-ult" }); p.targa.appendChild(p.ult); p.stato = { faccia: "normale" }; });
      var area = el("div", { class: "sc-terra sc-t3d" });
      R.feltro.appendChild(area);
      box.appendChild(R.scena);
      var aiutoEl = el("div", { class: "sc-aiuto", style: "display:none" });
      R.scena.appendChild(aiutoEl);
      // la tua mano: due file da 5 sulla mensola di legno
      var mensola = el("div", { class: "sc-mensola", style: "min-height:" + (2 * Math.round(wH * ASP) + 6 + 34) + "px" });
      var manoW = el("div", { class: "sc-mano-riga", style: "max-width:" + (5 * wH + 4 * 8 + 4) + "px;margin:0 auto;row-gap:6px" });
      mensola.appendChild(manoW);
      var preseEl = el("div", { class: "sc-prese", onclick: function () { if (mont && mont.guardo) cb.onCambiaVista && cb.onCambiaVista(); } });
      mensola.appendChild(preseEl);
      // 🤫 online tra due compagni veri: il tasto vicino alla mano apre le frasi pronte (le legge solo il compagno)
      mensola.style.position = "relative";
      var psstP = el("div", { class: "sp-psst-pan", hidden: "hidden" }), psstTit = el("div", { class: "sp-psst-tit" });
      psstP.appendChild(psstTit);
      psstP.appendChild(el("div", { class: "sp-psst-gr" }, PSST.map(function (f, i) {
        return el("button", { class: "sp-psst-f", type: "button", text: f, onclick: function () { psstP.hidden = true; if (cb.onPsst) cb.onPsst(i); } });
      })));
      psstP.appendChild(el("button", { class: "sp-psst-x", type: "button", text: "✕", "aria-label": "Chiudi", onclick: function () { psstP.hidden = true; } }));
      var psstB = el("button", { class: "sp-psst", type: "button", hidden: "hidden", onclick: function () { if (!psstB.disabled) psstP.hidden = !psstP.hidden; } });
      mensola.appendChild(psstP); mensola.appendChild(psstB);
      box.appendChild(mensola);

      // montaggio: la schermata resta la stessa per tutta la partita, cambia solo il contenuto quando serve
      if (mont && mont.cont && document.body.contains(mont.s)) {
        mont.cont.replaceChild(box, mont.box); mont.piede.innerHTML = "";
      } else {
        var s = t.schermata({ scura: true, indietro: function () { cb.onIndietro(); } });   // (scura: la stanza col tavolo vero)
        s.classList.add("sc-piena");   // stanza da bordo a bordo
        s._contenuto.appendChild(box); t.mostra(s); schermo = s;
        mont = { s: s, cont: s._contenuto, piede: s._piede };
      }
      mont.box = box; mont.R = R; mont.M = M; mont.wH = wH; mont.k = ms.k; mont.manoN = st.manoN;
      mont.punti = punti; mont.area = area; mont.grid = null; mont.tavEls = {}; mont.manoW = manoW; mont.manoEls = {};
      mont.preseEl = preseEl; mont.aiutoEl = aiutoEl; mont.psstB = psstB; mont.psstP = psstP; mont.psstTit = psstTit; mont.presaVista = null; mont.restoVisto = false; mont.gioc = null; mont.costruendo = true;
      mont.avvisoN = st.avviso ? st.avviso.n : null;   // (un avviso già passato non torna quando la stanza si rifà)
      mont.testoPunti = mont.preseTxt = mont.aiutoTesto = null;   // (la stanza è nuova: le scritte vanno rimesse)
      if (C().correggiStanza4(M, mont.cont.parentNode, mensola, function () { costruisci(st, sel, misure(st), deal); })) return;
      R.siedi();
      R.posti.forEach(function (p) { p.w = parseFloat(p.box.style.width) || 100; });
      mont.nuoveTav = [];
      aggiorna(st, sel);
      mont.costruendo = false;
      // con le carte in mano la mensola può crescere un poco: se la schermata esce dallo schermo, si rifà più bassa (una volta)
      if (C().ricontrollaStanza4 && C().ricontrollaStanza4(M, mont.cont.parentNode)) return costruisci(st, sel, misure(st), deal);
      if (deal) {
        var manoEls = [].slice.call(manoW.children);
        dealFino = Date.now() + C().animaDistribuzione4(mont.nuoveTav, manoEls,
          R.posti.map(function (p) { return [].slice.call(p.vent.children); }), R.feltro, 0.07);
      }
    }

    // solo le parti che cambiano
    function aggiorna(st, sel) {
      var R = mont.R, M = mont.M, guardo = !!st.guardo, illumina = st.aiuto != null ? st.aiuto : aiuto;
      mont.guardo = guardo;
      var mioTurno = (!guardo && st.turno === 0 && st.fase === "gioco" && !st.presa && !st.resto);
      var testoPunti = guardo   // chi guarda: i nomi delle coppie (da che parte sta lui non conta)
        ? corto(st.nomi[0]) + "+" + corto(st.nomi[2]) + " <b style='color:var(--o-verde)'>" + st.punti.noi + "</b> — <b>" + st.punti.loro + "</b> " + corto(st.nomi[1]) + "+" + corto(st.nomi[3])
        : "Noi <b style='color:var(--o-verde)'>" + st.punti.noi + "</b> — Loro <b>" + st.punti.loro + "</b> <span class='tenue' style='font-weight:600'>(" + C().testoTraguardo(st.traguardo) + ")</span>";
      if (mont.testoPunti !== testoPunti) { mont.testoPunti = testoPunti; mont.punti.innerHTML = testoPunti; }

      // --- i tre posti: faccia, fumetto, targa di turno, carte in mano, ultima carta giocata ---
      var diTurno = -1;
      R.posti.forEach(function (p, i) {
        var s = i + 1, faccia = "normale", fumetto = null, forte = false;
        if (st.presa && st.presa.scopa) faccia = squadra(s) === squadra(st.presa.chi) ? "esulta" : "triste";
        else if (st.presa && st.fumo && st.fumo.forte && st.fumo.s === s) faccia = "esulta";
        else if (st.turno === s && st.fase === "gioco" && !st.presa && !st.resto) { faccia = "pensa"; fumetto = "🤔"; }
        if (st.fumo && st.fumo.s === s) { fumetto = st.fumo.txt; forte = !!st.fumo.forte; if (faccia === "normale" || faccia === "pensa") faccia = "esulta"; }
        // 🤫 il messaggio al compagno (la frase, o solo 🤫 per gli avversari e chi guarda): 4 secondi, sotto la scopa e le frasi forti
        var psstQui = psstF && psstF.s === s && Date.now() < psstF.fino && !(st.presa && st.presa.scopa) && !(st.fumo && st.fumo.s === s) ? psstF.txt : null;
        if (psstQui) fumetto = psstQui;
        var turno = st.turno === s && !st.presa && !st.resto && st.fase === "gioco";
        if (turno) diTurno = i;
        var o = p.stato;
        if (o.faccia !== faccia) {
          p.fig.innerHTML = figHtml(st.nomi[s], (st.omini && st.omini[s]) || null, faccia);
          p.box.classList.toggle("pensa", faccia === "pensa");
          if (faccia === "esulta" && st.presa && st.presa.chi === s && p.fig.animate) p.fig.animate([{ transform: "none" }, { transform: "translateY(-18px)" }, { transform: "none" }], { duration: 650, easing: "ease-out" });
        }
        if (o.fumetto !== fumetto) {
          var vecchio = p.box.querySelector(".sc-fumetto"); if (vecchio) vecchio.parentNode.removeChild(vecchio);
          p.box.style.zIndex = fumetto ? "6" : "";   // (chi parla sta sopra gli altri avatar e le targhe: il fumetto non resta coperto)
          if (fumetto) {
            var fm = el("div", { class: "sc-fumetto" + (psstQui ? (fumetto.length > 9 ? " lungo" : "")
              : (forte || faccia === "esulta" && fumetto.indexOf("🤔") < 0 ? " scopa" : "") + (fumetto.length > 9 ? " sp-frase" : "")), text: fumetto });
            p.box.appendChild(fm);
            fm.style.left = Math.round(p.w * (i === 2 ? 0.05 : 0.7)) + "px"; fm.style.top = Math.round(p.w * 0.15) + "px";
            // se esce dallo schermo a destra, il fumetto va dall'altra parte della testa
            var sw = R.scena.clientWidth;
            if (p.box.offsetLeft + fm.offsetLeft + fm.offsetWidth > sw - 4) { fm.classList.add("sp-dx"); fm.style.left = Math.round(p.w * 0.32 - fm.offsetWidth) + "px"; }
          }
        }
        if (o.turno !== turno) p.targa.classList.toggle("turno", turno);
        var n = st.mani[s].length;
        if (o.n !== n) {
          p.targa.querySelector(".sc-num").textContent = n;
          while (p.vent.children.length > n) p.vent.removeChild(p.vent.lastChild);
          ventaglio(p);
        }
        var u = st.ultime[s] ? nomeCarta(st.ultime[s]) : "";
        if (o.u !== u) p.ult.textContent = u;
        p.stato = { faccia: faccia, fumetto: fumetto, turno: turno, n: n, u: u };
      });
      // gli altri guardano chi deve giocare (solo gli occhi): verso la sedia di turno, o in basso se tocca a te
      var turno0 = st.turno === 0 && st.fase === "gioco" && !st.presa && !st.resto;
      R.posti.forEach(function (p, i) {
        var oc = p.fig.querySelector(".om-occhi"); if (!oc) return;
        var dx = 0, dy = 0;
        if (i !== diTurno) { dx = diTurno < 0 ? 0 : (diTurno > i ? 3 : -3); dy = diTurno < 0 && turno0 ? 2.5 : 0; }
        oc.style.translate = (dx || dy) ? dx + "px " + dy + "px" : "";
      });

      // --- il tavolo: le carte restano al loro posto, si aggiungono o tolgono solo quelle che cambiano ---
      var carteTav = (st.presa && st.presa.tavoloPrima) ? st.presa.tavoloPrima : st.tavolo;
      var P = C().postiTavolo(st.posti, carteTav, M), wT = P.w;
      var g0 = P.griglia(el);
      if (!mont.grid || mont.grid.style.cssText !== g0.style.cssText) {   // cambia la misura (9 carte o più): griglia nuova
        if (mont.grid) mont.area.removeChild(mont.grid);
        mont.grid = g0; mont.area.insertBefore(g0, mont.area.firstChild); mont.tavEls = {};
      }
      var ids = {}; carteTav.forEach(function (c) { ids[c.id] = true; });
      Object.keys(mont.tavEls).forEach(function (id) { if (!ids[id]) { var e = mont.tavEls[id]; if (e.parentNode) e.parentNode.removeChild(e); delete mont.tavEls[id]; } });
      carteTav.forEach(function (c) {
        if (mont.tavEls[c.id]) return;
        var cel = C().cartaEl(el, c, wT, "", function () { cb.onTavolo(c.id); });
        if (c.id === st.messaGiu && !mont.costruendo) cel.classList.add("sp-posa" + (st.messaDa || 0));
        mont.grid.appendChild(P.metti(cel, c.id)); mont.tavEls[c.id] = cel;
        if (mont.nuoveTav) mont.nuoveTav.push(cel);
      });
      // aiuto alla presa: verdi le carte che puoi prendere, spente quelle che non stanno con quelle già toccate
      var cartaSel = (mioTurno && sel.carta) ? trova(st.mani[0], sel.carta) : null;
      var opts = cartaSel ? C().catture(cartaSel.v, st.tavolo) : [];
      var ok = {};
      opts.forEach(function (set) { if (sel.presa.every(function (id) { return set.indexOf(id) >= 0; })) set.forEach(function (id) { ok[id] = true; }); });
      carteTav.forEach(function (c) {
        var e = mont.tavEls[c.id]; if (!e || st.presa) return;
        var presel = sel.presa.indexOf(c.id) >= 0;
        e.classList.toggle("presel", !!cartaSel && presel);
        e.classList.toggle("cap", !!cartaSel && !presel && !!ok[c.id]);
        e.classList.toggle("sp-no", !!cartaSel && !ok[c.id]);
      });
      // la presa: la carta giocata arriva da chi gioca, si posa sopra le carte prese, poi volano tutte da lui
      if (st.presa && mont.presaVista !== st.presa.n) {
        mont.presaVista = st.presa.n;
        var dir = st.presa.chi, presiEls = [];
        st.presa.presiIds.forEach(function (id) { var e = mont.tavEls[id]; if (e) { e.classList.remove("cap", "presel", "sp-no"); e.classList.add("sp-via" + dir); presiEls.push(e); } });
        if (mont.gioc && mont.gioc.parentNode) mont.gioc.parentNode.removeChild(mont.gioc);
        var gioc = C().cartaEl(el, st.presa.carta, wT);
        gioc.style.cssText += ";position:absolute;z-index:6;opacity:0";
        mont.area.appendChild(gioc); mont.gioc = gioc;
        if (presiEls.length) {
          var cx = 0, cy = 0;
          presiEls.forEach(function (e) { cx += e.offsetLeft + e.offsetWidth / 2; cy += e.offsetTop + e.offsetHeight / 2; });
          cx /= presiEls.length; cy /= presiEls.length;
          gioc.style.left = (cx - gioc.offsetWidth / 2) + "px"; gioc.style.top = (cy - gioc.offsetHeight / 2) + "px";
        } else { gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = (-wT / 2) + "px"; gioc.style.marginTop = (-Math.round(wT * C().ASP_CARTA) / 2) + "px"; }
        gioc.classList.add("sp-gioca" + dir);
      }
      if (!st.presa && mont.gioc) { if (mont.gioc.parentNode) mont.gioc.parentNode.removeChild(mont.gioc); mont.gioc = null; }
      // fine mano: le carte rimaste volano a chi ha preso per ultimo
      if (st.resto && !mont.restoVisto) {
        mont.restoVisto = true;
        Object.keys(mont.tavEls).forEach(function (id) { var e = mont.tavEls[id]; e.classList.remove("cap", "presel", "sp-no"); e.style.animationDelay = ".5s"; e.classList.add("sp-via" + (st.ultimaPresa || 0)); });
      }

      // --- la scritta d'aiuto sopra la mensola ---
      var testo = "", giallo = false;
      if (st.resto) testo = "Ultima presa: le carte rimaste vanno a " + (guardo ? (st.resto === "noi" ? st.nomi[0] + " e " + st.nomi[2] : st.nomi[1] + " e " + st.nomi[3]) : (st.resto === "noi" ? "Noi" : "Loro"));
      else if (st.presa && st.presa.scopa && st.presa.chi === 0) { testo = guardo ? "SCOPA di " + st.nomi[0] + "! 🧹" : "SCOPA! 🧹"; giallo = true; }
      else if (cartaSel && opts.length >= 2) testo = opts[0].length === 1 ? "Tocca la carta verde da prendere." : "Tocca le carte verdi che sommano a " + cartaSel.v + ".";
      if (mont.aiutoTesto !== testo) {
        mont.aiutoTesto = testo;
        mont.aiutoEl.textContent = testo; mont.aiutoEl.style.display = testo ? "" : "none";
        mont.aiutoEl.style.borderColor = giallo ? "var(--o-oro)" : ""; mont.aiutoEl.style.fontSize = giallo ? "1.1rem" : "";
      }
      // --- online: un avviso che passa (uscito, tornato, coppie sorteggiate, chi ci pensa troppo) ---
      if (st.avviso && st.avviso.n !== mont.avvisoN) {
        mont.avvisoN = st.avviso.n;
        var av = el("div", { class: "sp-avviso", text: st.avviso.testo }); R.scena.appendChild(av);
        setTimeout(function () { if (av.parentNode) av.parentNode.removeChild(av); }, 3700);
      }

      // --- la tua mano (chi guarda: quella del giocatore che ha scelto): si toglie solo la carta giocata ---
      var inMano = {}; st.mani[0].forEach(function (c) { inMano[c.id] = true; });
      Object.keys(mont.manoEls).forEach(function (id) { if (!inMano[id]) { var e = mont.manoEls[id]; if (e.parentNode) e.parentNode.removeChild(e); delete mont.manoEls[id]; } });
      st.mani[0].forEach(function (c) {
        var e = mont.manoEls[c.id];
        if (!e) { e = C().cartaEl(el, c, mont.wH, "", function () { cb.onCella(c.id); }); mont.manoW.appendChild(e); mont.manoEls[c.id] = e; }
        e.classList.toggle("sel", sel.carta === c.id);
        e.classList.toggle("sp-puo", illumina && mioTurno && sel.carta !== c.id && C().catture(c.v, st.tavolo).length > 0);
      });
      var mie = st.prese[0].concat(st.prese[2]), scNoi = st.scope[0] + st.scope[2], preseTxt;
      if (guardo) preseTxt = "👀 Guardi le carte di <b>" + st.nomi[0] + "</b>" + (turno0 ? " · è il suo turno" : "") + " · 🔄 cambia";
      else preseTxt = (mioTurno && opz.online ? "<span class='sp-tocca'>👉 Tocca a te!</span>" : "") + "prese coppia: <b>" + mie.length + "</b>" + (trova(mie, "D7") ? " · 7💰" : "") + (scNoi ? " · scope " + scNoi : "") + (mioTurno && !opz.online ? " · <b style='color:var(--o-oro-chiaro)'>tocca a te</b>" : "");
      if (mont.preseTxt !== preseTxt) { mont.preseTxt = preseTxt; mont.preseEl.innerHTML = preseTxt; mont.preseEl.classList.toggle("sp-guardo", guardo); }
      // 🤫 il tasto dei messaggi al compagno (solo online, chi gioca, e se il compagno non è un Bot) e il pannellino delle frasi
      var resto = st.psstResto, vedi = !guardo && resto != null && resto >= 0 && st.fase === "gioco";
      if (mont.psstB.hidden === vedi) mont.psstB.hidden = !vedi;
      if (vedi) {
        var tb = "🤫 " + Math.max(0, resto);
        if (mont.psstB.textContent !== tb) mont.psstB.textContent = tb;
        if (mont.psstB.disabled !== (resto <= 0)) mont.psstB.disabled = resto <= 0;
        var tt = "🤫 Solo " + (st.nomi[2] || "il compagno") + " lo legge · ancora " + resto;
        if (mont.psstTit.textContent !== tt) mont.psstTit.textContent = tt;
      }
      if ((!vedi || resto <= 0) && !mont.psstP.hidden) mont.psstP.hidden = true;
    }

    // il ventaglio dei dorsi in mano a un bot (come lo mette la stanza condivisa)
    function ventaglio(p) {
      var w = p.w || 100, cw = Math.round(w * 0.16), ch = Math.round(cw * C().ASP_CARTA), n = p.vent.children.length, ang = n > 5 ? 6 : 12;
      [].forEach.call(p.vent.children, function (d, k) {
        var a = (k - (n - 1) / 2) * ang;
        d.style.width = cw + "px"; d.style.height = ch + "px"; d.style.left = (-cw / 2) + "px";
        d.style.transform = "translateX(" + (a * 1.1) + "px) rotate(" + a + "deg)";
      });
    }

    // ---------- fine mano / fine partita ----------
    // Online la schermata si fa UNA volta per mano: le viste che arrivano dopo cambiano solo la riga di "⏩ Avanti"
    function fine(st) {
      var finale = st.fase === "fine", online = !!opz.online, guardo = !!st.guardo;
      var kF = (st.pid || "") + "|" + st.manoN + "|" + st.fase + "|" + (st.io || 0);
      if (FIN && FIN.k === kF && document.body.contains(FIN.s)) { FIN.st = st; if (!finale) avanti(); return; }
      var r = st.ultimoRound, vinto = st.punti.noi > st.punti.loro, pari = st.punti.noi === st.punti.loro;
      function coppia(tm) { return tm === "noi" ? st.nomi[0] + " e " + st.nomi[2] : st.nomi[1] + " e " + st.nomi[3]; }
      var titolo = "Fine mano";
      if (finale) titolo = pari ? "Pareggio!" : guardo ? "Vincono " + coppia(vinto ? "noi" : "loro") + "!" : vinto ? "Avete vinto!" : "Hanno vinto " + st.nomi[1] + " e " + st.nomi[3];
      var s = t.schermata({ icona: finale ? (pari ? "🤝" : (vinto || guardo) ? "🏆" : "😮") : "🧮", titolo: titolo,
        sotto: "Scopone " + (st.variante === "scientifico" ? "scientifico" : "classico") + (guardo ? (finale ? " · 👀 questa partita l'hai guardata" : " · 👀 guardi la partita") : ""),
        indietro: function () { if (finale) cb.onEsci(); else cb.onIndietro(); } });
      schermo = s;
      FIN = { k: kF, s: s, st: st, box: null };
      var C0 = s._contenuto;
      if (finale && !pari) {   // la coppia che ha vinto fa festa
        var avs = el("div", { class: "sp-avs festa" });
        var io0 = (st.omini && st.omini[0]) || (online ? null : (C().mioAvatar ? C().mioAvatar(st.nomi[0]) : null));
        var chi = vinto ? [[st.nomi[0], io0], [st.nomi[2], st.omini && st.omini[2]]] : [[st.nomi[1], st.omini && st.omini[1]], [st.nomi[3], st.omini && st.omini[3]]];
        chi.forEach(function (x) { avs.appendChild(el("div", { html: figHtml(x[0], x[1] || null, "esulta") })); });
        C0.appendChild(avs);
      }
      if (r) {
        var tab = el("div", { class: "sp-tab" });
        function cella(txt, cls) { tab.appendChild(el("div", { class: cls || "", html: txt })); }
        function esc(x) { return String(x || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
        cella("", "th");
        cella(guardo ? esc(corto(st.nomi[0])) + "<br>" + esc(corto(st.nomi[2])) : "Noi", "th");
        cella(guardo ? esc(corto(st.nomi[1])) + "<br>" + esc(corto(st.nomi[3])) : "Loro", "th");
        function riga(nome, a, b, vinc) {
          cella(nome, "sx");
          cella(a + (vinc === "noi" ? " ✅" : ""), vinc === "noi" ? "ok" : "");
          cella(b + (vinc === "loro" ? " ✅" : ""), vinc === "loro" ? "ok" : "");
        }
        riga("🃏 Carte", r.carteA, r.carteB, r.pCarte);
        riga("🪙 Denari", r.denA, r.denB, r.pDen);
        riga("💰 Settebello", r.sette === "noi" ? "sì" : "—", r.sette === "loro" ? "sì" : "—", r.sette);
        riga("👑 Primiera", r.primA, r.primB, r.pPrim);
        if (r.napola) riga("🪙 Napola", r.napA ? "+" + r.napA : "—", r.napB ? "+" + r.napB : "—", r.napA ? "noi" : r.napB ? "loro" : null);
        riga("🧹 Scope", r.scopeNoi, r.scopeLoro, null);
        cella("<b>Punti mano</b>", "sx tot"); cella("+" + r.puntiNoi, "tot"); cella("+" + r.puntiLoro, "tot");
        C0.appendChild(tab);
        // chi ha fatto le scope
        var ss = r.scopeSeat || [], chiSc = [];
        [0, 2, 1, 3].forEach(function (seat) { if (ss[seat]) chiSc.push((seat === 0 && !guardo ? "Tu" : st.nomi[seat]) + " " + ss[seat]); });
        if (chiSc.length) C0.appendChild(el("div", { class: "tenue", style: "text-align:center;font-size:.85rem;margin-top:6px", text: "Scope: " + chiSc.join(" · ") }));
        // 🏅 Il migliore in campo di ogni coppia: "🏅 Luca: 2 scope e il settebello" (a pari, nessuna medaglia)
        var mvp = (r.mvp || []).filter(Boolean).sort(function (x, y) { return (x.s % 2) - (y.s % 2); });
        if (mvp.length) {
          C0.appendChild(el("div", { class: "sp-mvp" }, mvp.map(function (x, i) {
            var nome = x.s === 0 && !guardo ? "Tu" : st.nomi[x.s];
            return el("div", {}, [ el("span", { style: "color:" + (squadra(x.s) === "noi" ? "var(--o-verde)" : "var(--o-rosso)"), text: "🏅 " + nome }), document.createTextNode(": " + x.testo) ]);
          })));
          if (!guardo && mvp.some(function (x) { return x.s === 0; })) vibra(30);   // la medaglia è tua: breve
        }
        var tot = r.tot || st.punti;
        C0.appendChild(el("div", { class: "sp-tot", style: "text-align:center;font-size:1.35rem;font-weight:800;margin-top:8px",
          html: (guardo ? "" : "Noi ") + "<span style='color:var(--o-oro-testo)'>" + tot.noi + "</span> — " + tot.loro + (guardo ? "" : " Loro") + " <span class='tenue' style='font-size:.85rem;font-weight:600'>(" + C().testoTraguardo(st.traguardo) + ")</span>" }));
      }
      if (finale && st.storico && st.storico.length) C0.appendChild(el("div", { class: "sp-storico", text: "👫 " + st.storico.join(" · ") }));   // 👫 lo storico delle coppie di oggi
      if (finale) {
        if (!online) {
          // com'è finita (dà gli XP): tu e il compagno contro i rivali — una volta sola
          if (!st.risultatoDato) {
            st.risultatoDato = true;
            var pNoi = st.punti.noi >= st.punti.loro ? 1 : 2, pLoro = st.punti.loro >= st.punti.noi ? 1 : 2;
            if (t.risultato && st.nomi) t.risultato([0, 2, 1, 3].map(function (seat) { var x = { nome: st.nomi[seat], pos: seat % 2 === 0 ? pNoi : pLoro }; if (seat) x.bot = true; return x; }));
            if (vinto) { suonoVittoria(); coriandoli(s); vibra(80); }
          }
          s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
          s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
        } else {
          if (vinto && !guardo) { suonoVittoria(); coriandoli(s); vibra(80); }
          var fac = t.faccine ? t.faccine() : null; if (fac) { fac.style.margin = "0 0 8px"; s._piede.appendChild(fac); }
          // l'host: "🔁 Rivincita a coppie scambiate" (la Rivincita di sempre, ma ognuno cambia compagno)
          if (opz.sonoHost && st.scambia && cb.onScambia) {
            var piede = s._piede;
            s.classList.add("sp-piu");
            piede.appendChild(el("button", { class: "btn btn-fantasma sp-scambia", type: "button", text: "🔁 Rivincita a coppie scambiate", onclick: function () { cb.onScambia(piede); } }));
          }
          // i tasti di fine uguali per tutti i giochi (Rivincita col 3-2-1, Ci sto, Cambia gioco); se il core non li mette, quelli di sempre
          if (!(t.tastiFine && t.tastiFine(s._piede, { host: !!opz.sonoHost, nuova: opz.sonoHost ? cb.onNuova : null, esci: cb.onEsci }))) {
            if (opz.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
            else s._piede.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
            s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
          }
        }
      } else if (!online) {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: function () { cb.onIndietro(); } }));
      } else {
        // online la prossima mano parte da sola dopo il conto; "⏩ Avanti" se lo tocca più di metà si parte subito
        FIN.box = el("div", { class: "sp-avanti" });
        s._piede.appendChild(FIN.box);
        var fac2 = t.faccine ? t.faccine() : null; if (fac2) { fac2.style.margin = "6px 0 0"; s._piede.appendChild(fac2); }
        avanti();
      }
      t.mostra(s);
      stringi(s);
    }
    // se il riepilogo non sta in uno schermo (nomi lunghi, la riga della serata, il tasto in più dell'host) via gli avatar
    // della festa: si controlla subito e quando il core ha finito di riempire i tasti (niente scorrimento)
    function stringi(s) {
      [0, 400, 1500].forEach(function (ms) {
        setTimeout(function () {
          if (!document.body.contains(s) || s.classList.contains("sp-stretto")) return;
          if (document.documentElement.scrollHeight > window.innerHeight + 1) s.classList.add("sp-stretto");
        }, ms);
      });
    }
    // la riga di "⏩ Avanti" sotto il riepilogo della mano: si rifà solo quando cambia qualcosa (niente lampeggio)
    function avanti() {
      var st = FIN.st, A = st.avanti || {}, gioco = !st.guardo, toccato = gioco && (!!A.mio || FIN.mio === st.manoN);
      var k = st.manoN + "|" + (st.rip || 0) + "|" + (toccato ? 1 : 0) + "|" + (A.si || 0) + "|" + (A.tot || 0);
      if (FIN.kA === k || !FIN.box) return;
      FIN.kA = k;
      while (FIN.box.firstChild) FIN.box.removeChild(FIN.box.firstChild);
      var kC = "scopone|" + (st.pid || "") + "|" + st.manoN + "|" + (st.rip || 0), nodo;   // (rip: dopo una ripresa il conto riparte giusto su tutti)
      if (gioco && !toccato) nodo = el("button", { class: "btn btn-primario", text: "⏩ Avanti", onclick: function () { FIN.mio = st.manoN; cb.onVoto(); avanti(); } });
      else nodo = el("p", { class: "modulo-nota" });
      FIN.box.appendChild(nodo);
      if (A.si) FIN.box.appendChild(el("p", { class: "modulo-nota", style: "font-size:.8rem", text: "⏩ " + A.si + " su " + A.tot + " vogliono andare avanti" }));
      // il conto: a zero l'host fa partire la mano (gli altri vedono solo il numero)
      if (t.contoAvanti) t.contoAvanti(nodo, A.resta || PAUSA_MANO, opz.sonoHost ? function () { cb.onAvanti(); } : null, kC);
    }
    function coriandoli(s) {
      var strato = el("div", { class: "sp-cori" }), col = ["var(--o-oro)", "var(--o-oro-chiaro)", "var(--o-filo-oro)", "var(--o-oro-testo)", "var(--o-scuro)"];   // 🤍 sobri: pezzetti d'oro
      for (var i = 0; i < 40; i++) {
        var c = el("i", {}); c.style.left = Math.round(Math.random() * 100) + "%"; c.style.background = col[i % col.length];
        c.style.animationDelay = (Math.random() * 0.9).toFixed(2) + "s"; c.style.animationDuration = (2 + Math.random() * 1.4).toFixed(2) + "s";
        strato.appendChild(c);
      }
      s.appendChild(strato);
      setTimeout(function () { if (strato.parentNode) strato.parentNode.removeChild(strato); }, 4600);
    }

    var api = {
      disegna: disegna,
      dealFino: function () { return dealFino; },
      uscito: function () { return !!schermo && !document.body.contains(schermo); },
      azzera: function () { mont = null; FIN = null; schermo = null; dealFino = 0; ultimo = null; psstF = null; },
      // 🤫 il fumetto del messaggio al compagno sopra un posto (e chi guarda che cambia giocatore: il posto si sposta)
      psst: function (f) { psstF = f; },
      psstPosto: function (s) { if (psstF) psstF.s = s; },
      // un avviso che passa solo su questo telefono ("🤫 A Luca: «Ho il settebello»")
      avvisoLocale: function (testo) {
        if (!mont || !mont.R || !document.body.contains(mont.s)) return;
        var av = el("div", { class: "sp-avviso", text: testo }); mont.R.scena.appendChild(av);
        setTimeout(function () { if (av.parentNode) av.parentNode.removeChild(av); }, 3700);
      },
      // girato il telefono o cambiata l'altezza dello schermo: la stanza si rifà della misura giusta (solo se cambia)
      misura: function () {
        if (FIN && FIN.s && document.body.contains(FIN.s)) { stringi(FIN.s); return; }   // (il riepilogo: se non sta più, via gli avatar della festa)
        if (!eFinita() && ultimo && mont && document.body.contains(mont.s) && ultimo.st.fase === "gioco") disegna(ultimo.st, ultimo.sel); }
    };
    return api;
  }
  var vistaViva = null, giraT = null;
  window.addEventListener("resize", function () {
    clearTimeout(giraT);
    giraT = setTimeout(function () { if (vistaViva) vistaViva.misura(); }, 250);
  });

  // (per le prove) il motore, senza grafica
  window.__SCOPONE = { creaStato: creaStato, distribuisci: distribuisci, applica: applica, fineMano: fineMano, contaScopone: contaScopone, napola: napola, vistaDa: vistaDa, mossaBot: mossaBot, maniVuote: maniVuote, migliori: migliori, bravura: bravura };
})();
