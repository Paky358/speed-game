/* =========================================================
   GIOCO — "La Balla Colossale" (ispirato a Balderdash / Fibbage)
   Nello studio del game show (js/studio.js): su un telefono solo (ce lo si passa) oppure online. Niente bot.
   Ogni round sul maxischermo esce una notizia VERA ma incredibile, con un pezzo mancante.
   1. A turno ognuno, in segreto, scrive una BALLA credibile per completarla.
   2. Le balle e la risposta vera si mescolano (due balle uguali diventano una sola); se le risposte
      sono meno di 5 la "redazione" aggiunge qualche balla sua (balleCasa: chi ci casca non dà punti a nessuno).
   3. A turno ognuno vota in segreto quella che crede vera (la sua non la può votare).
   4. La rivelazione: +2 a chi trova la verità, +1 all'autore di una balla per ogni voto che prende.
      L'ultimo round vale doppio. A fine partita i premi: Re delle balle, Detective, Credulone, Balla d'oro.
   5. «😂 Che balla!» (regola dell'host, accesa di partenza): alla rivelazione chi vuole mette un 😂 alle balle che lo
      fanno ridere (non alla sua). La balla con più 😂 del round è la «Balla d'oro»: +1 a chi l'ha scritta.
   6. «👥 Parliamo di te» (regola dell'host: solo notizie / notizie e amici / solo amici): la domanda è su uno di voi
      («Il cibo che Luca non mangerebbe mai è…»). Lui scrive la VERITÀ, gli altri le balle; lui non vota e prende +1
      per ogni amico che trova la sua verità. Se non la scrive (online, tempo finito) si passa a una notizia.
   Le notizie sono in data/balla-domande.js: SG_BALLA = [{ domanda, rispostaVera, balleCasa: [..] }]
   e, in fondo allo stesso file, le domande sugli amici: SG_BALLA_AMICI = [{ domanda (con {nome}), balleCasa: [..] }].
   La domanda finisce con "..." (il pezzo mancante va in fondo) oppure ha "___" dove va il pezzo.
   ========================================================= */
(function () {
  "use strict";

  var ST = window.SGStudio;
  var MAX_BALLA = 45;   // caratteri al massimo per una balla
  // i caratteri (mai corsivo né scritto a mano: si legge al volo): le risposte col carattere dell'app, chiaro e grosso;
  // il titolo della prima pagina con un carattere da giornale (Playfair Display, licenza SIL Open Font, dentro questo file)
  var TESTO = "'SG Testo','Plus Jakarta Sans',system-ui,sans-serif";
  var TITOLO = "'BC Titolo','Playfair Display',Georgia,'Times New Roman',serif";
  // «🔥 La Balla Finale»: l'ultima notizia ha due pezzi mancanti; una risposta sono i due pezzi attaccati con SEP
  var SEP = " ‖ ";

  // =========================================================
  //  LE REGOLE (senza grafica: serviranno uguali anche all'online)
  // =========================================================
  function mescola(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = b[i]; b[i] = b[j]; b[j] = x; } return b; }
  // per confrontare due frasi: minuscole, senza accenti, punteggiatura, articoli e preposizioni (1.000 = 1000)
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/(\d)[.,](?=\d)/g, "$1").replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(il|lo|la|i|gli|le|l|un|uno|una|del|dello|della|dell|dei|degli|delle|di|d|con|col)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  // i numeri di una frase (in cifre o in lettere): se cambia un numero è un'altra risposta, mai "la verità"
  var NUMERI = { zero: 0, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12,
    tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20, trenta: 30,
    quaranta: 40, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80, novanta: 90, cento: 100, mille: 1000, mezzo: 0.5, mezza: 0.5,
    milione: 1e6, milioni: 1e6, miliardo: 1e9, miliardi: 1e9, primo: "1o", prima: "1o", secondo: "2o", terzo: "3o" };
  function numeri(n) { return n.split(" ").filter(function (w) { return /^\d+$/.test(w) || NUMERI[w] != null; }).map(function (w) { return /^\d+$/.test(w) ? String(+w) : String(NUMERI[w]); }).join(" "); }
  // la parola senza l'ultima vocale: "cubo" e "cubi", "verde" e "verdi" sono la stessa risposta
  function radice(n) { return n.split(" ").map(function (w) { return w.length > 3 ? w.replace(/[aeiou]$/, "") : w; }).join(" "); }
  function distanza(a, b) {   // quante lettere cambiare per passare da a a b
    var r = [], i, j;
    for (j = 0; j <= b.length; j++) r.push(j);
    for (i = 1; i <= a.length; i++) {
      var prec = r[0]; r[0] = i;
      for (j = 1; j <= b.length; j++) { var tmp = r[j]; r[j] = Math.min(r[j] + 1, r[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1)); prec = tmp; }
    }
    return r[b.length];
  }
  // la balla è (quasi) la risposta vera? (perdona un errore di battitura, al singolare o al plurale; i numeri devono essere uguali)
  function eLaVerita(balla, vera) {
    var a = norm(balla), b = norm(vera); if (!a) return false;
    if (a === b) return true;
    if (numeri(a) !== numeri(b)) return false;   // "39 minuti" non è "38 minuti"
    if (radice(a) === radice(b)) return true;
    var la = a.replace(/[0-9 ]/g, ""), lb = b.replace(/[0-9 ]/g, "");   // gli errori di battitura si contano solo sulle lettere
    return distanza(la, lb) <= (lb.length >= 12 ? 2 : lb.length >= 6 ? 1 : 0);
  }
  function pulisci(s) { return String(s || "").replace(/‖/g, "|").replace(/\s+/g, " ").trim().replace(/[.…]+$/, "").trim().slice(0, MAX_BALLA); }
  // la Balla Finale: i due pezzi di una risposta; pulita (vuota se manca un pezzo); è la verità solo se lo sono tutti e due i pezzi
  function dueDi(s) { var p = String(s || "").split("‖"); return [String(p[0] || "").trim(), p.slice(1).join(" ").trim()]; }
  function pulisciR(s, doppia) { if (!doppia) return pulisci(s); var p = dueDi(s).map(pulisci); return p[0] && p[1] ? p[0] + SEP + p[1] : ""; }
  function eLaVeritaR(b, vera, doppia) {
    if (!doppia) return eLaVerita(b, vera);
    var a = dueDi(b), v = dueDi(vera); return eLaVerita(a[0], v[0]) && eLaVerita(a[1], v[1]);
  }
  // come si legge una risposta (la Balla Finale: «primo pezzo / secondo pezzo»)
  function vis(s) { return String(s || "").split("‖").map(function (x) { return x.trim(); }).join(" / "); }
  // le scelte del round: la verità più le balle (quelle uguali diventano una sola, con tutti i loro autori), mescolate.
  // Se le risposte sono poche (pochi giocatori, chi non ha scritto, balle uguali) la redazione aggiunge le sue balle (casa: true)
  var MIN_SCELTE = 5;
  function preparaScelte(vera, balle, casa, doppia) {
    var scelte = [{ testo: vera, vera: true, autori: [] }];
    balle.forEach(function (b, i) {
      if (!b) return;
      var n = norm(b), gia = scelte.filter(function (x) { return !x.vera && norm(x.testo) === n; })[0];
      if (gia) gia.autori.push(i); else scelte.push({ testo: b, vera: false, autori: [i] });
    });
    mescola(casa || []).forEach(function (c) {
      c = pulisciR(c, doppia);
      if (!c || scelte.length >= MIN_SCELTE || eLaVeritaR(c, vera, doppia)) return;
      if (scelte.some(function (x) { return norm(x.testo) === norm(c); })) return;
      scelte.push({ testo: c, vera: false, autori: [], casa: true });
    });
    return mescola(scelte);
  }
  // l'ultimo round vale doppio (la Balla Finale, coi due pezzi mancanti, triplo)
  function moltiplica(giro, giri, doppia) { return giri > 1 && giro + 1 >= giri ? (doppia ? 3 : 2) : 1; }
  // i punti del round: voti[i] = la scelta votata da i. Restituisce, per ogni giocatore, i punti presi con la verità e con le balle
  // (più i numeri per i premi: verità trovate, amici ingannati, volte che ci è cascato, balla che ha ingannato tutti)
  // votanti = quanti potevano votare (chi è rimasto, senza il protagonista di «Parliamo di te»);
  // prot = il posto del protagonista (+1 per ogni amico che trova la sua verità);
  // risate = i 😂 di ogni scelta (con «Che balla!» accesa): le risate prese e la Balla d'oro (+1 a chi l'ha scritta)
  function calcola(scelte, voti, n, m, votanti, prot, risate) {
    m = m || 1;
    var d = []; for (var i = 0; i < n; i++) d.push({ vera: 0, inganni: 0, capito: 0, oro: 0, risate: 0, trovata: 0, ingannati: 0, cascato: 0, perfetta: 0, ori: 0 });
    var conProt = prot != null && prot >= 0 && prot < n;
    voti.forEach(function (v, i) {
      if (v == null || !scelte[v] || (conProt && i === prot)) return;
      if (scelte[v].vera) { d[i].vera += 2 * m; d[i].trovata = 1; if (conProt) d[prot].capito += m; }
      else { d[i].cascato = 1; scelte[v].autori.forEach(function (a) { if (a !== i) { d[a].inganni += m; d[a].ingannati++; } }); }
    });
    // la balla perfetta: l'hanno votata tutti gli altri (almeno 2)
    var altri = (votanti == null ? n - (conProt ? 1 : 0) : votanti) - 1;
    d.forEach(function (x) { if (altri >= 2 && x.ingannati >= altri) x.perfetta = 1; });
    if (risate) {
      scelte.forEach(function (sc, k) { (sc.autori || []).forEach(function (a) { if (d[a]) d[a].risate += risate[k] || 0; }); });
      var oro = calcolaOro(scelte, risate);
      if (oro) oro.ks.forEach(function (k) { scelte[k].autori.forEach(function (a) { if (d[a]) { d[a].oro = 1; d[a].ori = 1; } }); });
    }
    return d;
  }
  // la Balla d'oro del round: la balla di un giocatore (non della redazione) con più 😂; a pari 😂 vincono tutte
  function calcolaOro(scelte, risate) {
    var max = 0, ks = [];
    scelte.forEach(function (sc, k) {
      if (sc.vera || sc.casa || !(sc.autori || []).length) return;
      var n = (risate && risate[k]) || 0; if (!n) return;
      if (n > max) { max = n; ks = [k]; } else if (n === max) ks.push(k);
    });
    return max ? { ks: ks, n: max } : null;
  }
  // i punti del round di un giocatore
  function puntiDi(d) { return d.vera + d.inganni + d.capito + d.oro; }
  // il piano dei round: "n" = notizia, "a" = «Parliamo di te», "f" = la Balla Finale (due pezzi mancanti, punti tripli).
  // modo: "no" (solo notizie), "solo" (solo amici), altrimenti mescolate
  // (si comincia sempre con una notizia e si chiude con la Balla Finale; senza le sue notizie, con una notizia a punti doppi)
  function pianoRound(giri, modo) {
    var ci = (window.SG_BALLA_AMICI || []).length > 0, p = [];
    for (var i = 0; i < giri; i++) p.push(!ci || modo === "no" ? "n" : modo === "solo" ? "a" : i % 2 === 1 && i + 1 < giri ? "a" : "n");
    if (giri > 1 && p[giri - 1] === "n" && finali().length) p[giri - 1] = "f";
    return p;
  }
  // la domanda sugli amici col nome del protagonista
  function riempi(tpl, nome) { return String(tpl || "").replace(/\{nome\}/g, nome); }
  // la domanda divisa attorno ai pezzi mancanti: i testi prima, in mezzo e dopo (uno in più dei pezzi mancanti)
  function pezziN(domanda) {
    var s = String(domanda || "").trim();
    if (/_{3,}/.test(s)) return s.split(/_{3,}/).map(function (x) { return x.trim(); });
    return [s.replace(/(...|…)s*$/, "").trim(), ""];
  }
  // la domanda divisa attorno al pezzo mancante
  function pezzi(domanda) {
    var s = String(domanda || "").trim(), m = s.match(/_{3,}/);
    if (m) return { prima: s.slice(0, m.index).trim(), dopo: s.slice(m.index + m[0].length).trim() };
    return { prima: s.replace(/(\.\.\.|…)\s*$/, "").trim(), dopo: "" };
  }

  // ---- quali notizie: mai le stesse finché non le avete viste tutte (ricordate su questo telefono) ----
  var CHIAVE_VISTE = "sg-balla-viste";
  function chiave(d) { return String(d.domanda).slice(0, 60); }
  // le domande sugli amici (stessa regola: mai le stesse finché non le avete viste tutte)
  function scegliAmici(n) {
    return n > 0 ? scegliDomande(n, (window.SG_BALLA_AMICI || []).filter(function (d) { return d && d.domanda && /\{nome\}/.test(d.domanda); }), "sg-balla-amici-viste") : [];
  }
  function scegliDomande(n, lista, chiaveLS) {
    var CHIAVE_VISTE = chiaveLS || "sg-balla-viste";
    var tutte = lista || (window.SG_BALLA || []).filter(function (d) { return d && d.domanda && d.rispostaVera; });
    var viste = {}; try { (JSON.parse(localStorage.getItem(CHIAVE_VISTE) || "[]") || []).forEach(function (k) { viste[k] = 1; }); } catch (e) {}
    var scelte = mescola(tutte.filter(function (d) { return !viste[chiave(d)]; })).slice(0, n);
    if (scelte.length < n) {   // finite le nuove: si ricomincia il giro di tutte (di questa lista: le altre restano ricordate)
      tutte.forEach(function (d) { delete viste[chiave(d)]; });
      scelte = scelte.concat(mescola(tutte.filter(function (d) { return scelte.indexOf(d) < 0; })).slice(0, n - scelte.length));
    }
    scelte.forEach(function (d) { viste[chiave(d)] = 1; });
    try { localStorage.setItem(CHIAVE_VISTE, JSON.stringify(Object.keys(viste).slice(-1500))); } catch (e) {}
    return scelte;
  }
  // ---- «🔥 La Balla Finale»: le notizie coi due pezzi mancanti (SG_BALLA_FINALE: { domanda con due "___", risposteVere: [a, b], balleCasa: [[a, b] ×3] }) ----
  function finali() { return (window.SG_BALLA_FINALE || []).filter(function (d) { return d && d.domanda && (String(d.domanda).match(/_{3,}/g) || []).length === 2 && d.risposteVere && d.risposteVere.length === 2; }); }
  function scegliFinale() {
    var d = scegliDomande(1, finali(), "sg-balla-finale-viste")[0]; if (!d) return null;
    return { domanda: d.domanda, rispostaVera: d.risposteVere.join(SEP), doppia: true,
      balleCasa: (d.balleCasa || []).map(function (b) { return [].concat(b).join(SEP); }) };
  }
  // ---- «🎯 Sceglie chi è ultimo»: prima di ogni notizia chi è ultimo in classifica sceglie l'argomento tra tre ----
  var CATEGORIE = [
    { k: "animali", ic: "🐾", nome: "Animali" }, { k: "storia", ic: "🏛️", nome: "Storia" }, { k: "italia", ic: "🍝", nome: "Italia" },
    { k: "scienza", ic: "🔬", nome: "Scienza e corpo" }, { k: "mondo", ic: "🌍", nome: "Dal mondo" },
    { k: "spettacolo", ic: "🎬", nome: "Spettacolo e sport" }, { k: "invenzioni", ic: "💡", nome: "Invenzioni e marchi" }
  ];
  var TEMPO_CAT = 12000;   // online: quanto tempo ha chi sceglie (poi si sceglie a caso)
  function catDi(k) { return CATEGORIE.filter(function (c) { return c.k === k; })[0] || { k: k, ic: "📰", nome: "Notizie" }; }
  function notizieDi(k) { return (window.SG_BALLA || []).filter(function (d) { return d && d.domanda && d.rispostaVera && (!k || d.cat === k); }); }
  // tre argomenti a caso tra quelli che hanno notizie (prima quelli con notizie mai uscite su questo telefono)
  function treCategorie() {
    var viste = {}; try { (JSON.parse(localStorage.getItem(CHIAVE_VISTE) || "[]") || []).forEach(function (k) { viste[k] = 1; }); } catch (e) {}
    var ok = CATEGORIE.filter(function (c) { return notizieDi(c.k).length; });
    var fresche = ok.filter(function (c) { return notizieDi(c.k).some(function (d) { return !viste[chiave(d)]; }); });
    var l = mescola(fresche).slice(0, 3);
    if (l.length < 3) l = l.concat(mescola(ok.filter(function (c) { return l.indexOf(c) < 0; })).slice(0, 3 - l.length));
    return l.map(function (c) { return c.k; });
  }
  function notiziaDi(k) { var l = notizieDi(k); return (l.length ? scegliDomande(1, l) : scegliDomande(1))[0]; }
  // chi sceglie: chi ha meno punti; a pari punti chi ha scelto meno volte, poi a caso.
  // perche: "zero" (tutti a zero), "pari" (più d'uno in fondo), "ultimo"
  function chiSceglie(lista) {
    var min = Math.min.apply(null, lista.map(function (g) { return g.punti || 0; }));
    var ultimi = lista.filter(function (g) { return (g.punti || 0) === min; });
    var meno = Math.min.apply(null, ultimi.map(function (g) { return g.nScelte || 0; }));
    var c = mescola(ultimi.filter(function (g) { return (g.nScelte || 0) === meno; }))[0];
    return { g: c, perche: ultimi.length === lista.length && !min ? "zero" : ultimi.length > 1 ? "pari" : "ultimo" };
  }

  SG.registra({
    id: "balla",
    nome: "La Balla Colossale",
    icona: "🤥",
    descrizione: "Notizie vere ma incredibili, con un pezzo mancante. Inventate una balla credibile e scovate quella vera in mezzo alle vostre!",
    giocatoriMin: 3,
    giocatoriMax: 8,
    postiOnline: 8,   // posti online
    riprende: true,   // se l'host ricarica a metà partita, la partita riprende da dove era (t.ripresa)
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    ritardatari: "turno",   // online: chi arriva a partita cominciata gioca dal round dopo (con 0 punti)
    difficolta: 2,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono per scrivere e votare", amici: true }],
    regole: [
      "Esce una <b>notizia vera</b> ma incredibile, con un pezzo mancante.",
      "Ognuno, in segreto, scrive una <b>balla</b> per completarla: deve sembrare vera, per ingannare gli altri (sullo stesso telefono a turno, passandovi il telefono).",
      "Poi tutte le balle e la risposta vera si mescolano e ognuno <b>vota</b> in segreto quella che crede vera. La propria balla non si può votare.",
      "Quando le risposte sono poche, anche la <b>redazione</b> aggiunge qualche balla sua: occhio a non cascarci!",
      "<b>+2 punti</b> a chi trova la risposta vera. <b>+1 punto</b> a chi ha scritto una balla, per ogni amico che ci è cascato.",
      "👥 <b>Parliamo di te</b>: in certi round la domanda è su uno di voi («Il cibo che Luca non mangerebbe mai è…»). Lui scrive la <b>verità</b>, gli altri le balle. Lui non vota e prende <b>+1</b> per ogni amico che trova la sua verità.",
      "😂 <b>Che balla!</b> Quando le balle si scoprono, toccate 😂 su quelle che vi fanno ridere (non sulla vostra). La più votata del round è la <b>Balla d'oro</b>: +1 a chi l'ha scritta.",
      "🎯 <b>Sceglie chi è ultimo</b>: prima di ogni notizia chi è ultimo in classifica sceglie l'argomento tra tre (🐾 Animali, 🏛️ Storia, 🍝 Italia…).",
      "🔥 <b>La Balla Finale</b>: l'ultima notizia ha <b>due pezzi mancanti</b>. Si inventano tutti e due e vale il <b>triplo</b>: +6 per la verità, +3 per ogni amico ingannato. Alla fine vince chi ha più punti, e ci sono i premi: Re delle balle, Detective, Credulone e Balla d'oro.",
      "<b>Online</b> ognuno scrive e vota dal suo telefono, tutti insieme: 75 secondi per la balla e 45 per il voto."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      if ([3, 5, 7].indexOf(dove.round) < 0) dove.round = 5;
      if (["no", "misto", "solo"].indexOf(dove.amici) < 0) dove.amici = "misto";
      if (typeof dove.ride !== "boolean") dove.ride = true;
      if (typeof dove.sceglie !== "boolean") dove.sceglie = true;
      // un gruppo di scelte: un tocco accende quella e spegne le altre
      function gruppo(etichetta, chiave, voci) {
        box.appendChild(el("div", { class: "etichetta", text: etichetta }));
        var g = el("div", { class: "modo-griglia" }), bb = [];
        voci.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v.v ? " attiva" : ""), type: "button", onclick: function () {
            dove[chiave] = v.v; bb.forEach(function (x) { x.b.className = "modo-chip" + (x.v === v.v ? " attiva" : ""); });
          } }, [ el("div", {}, [ el("div", { class: "mt", text: v.mt }), el("div", { class: "ms", text: v.ms }) ]) ]);
          bb.push({ b: b, v: v.v }); g.appendChild(b);
        });
        box.appendChild(g);
      }
      gruppo("Quanti round", "round", [ { v: 3, mt: "3 round", ms: "Una partita veloce" }, { v: 5, mt: "5 round", ms: "Il giusto" }, { v: 7, mt: "7 round", ms: "Serata lunga" } ]);
      if ((window.SG_BALLA_AMICI || []).length)
        gruppo("Di cosa si parla", "amici", [ { v: "no", mt: "📰 Solo notizie", ms: "Notizie vere e strane" },
          { v: "misto", mt: "🔀 Notizie e amici", ms: "Un round sì e uno no si parla di voi" }, { v: "solo", mt: "👥 Solo amici", ms: "Ogni round una domanda su uno di voi" } ]);
      gruppo("Chi sceglie la notizia", "sceglie", [ { v: true, mt: "🎯 Chi è ultimo", ms: "Sceglie l'argomento tra tre" }, { v: false, mt: "🎲 A caso", ms: "Notizie di ogni tipo" } ]);
      gruppo("Che balla!", "ride", [ { v: true, mt: "😂 Sì", ms: "Le risate alle balle e la Balla d'oro" }, { v: false, mt: "No", ms: "Solo voti e punti" } ]);
      box.appendChild(el("p", { class: "modulo-nota", text: aiuti.modo === "online" ? "Online ognuno scrive e vota dal suo telefono, tutti insieme: 75 secondi per la balla, 45 per il voto." : "Ogni round: si scrivono le balle passandosi il telefono, poi si vota, sempre in segreto." }));
    },
    // la riga "📜 Si gioca così" che leggono gli amici in saletta
    riassunto: function (imp) {
      imp = imp || {};
      var am = (window.SG_BALLA_AMICI || []).length ? ({ no: "Solo notizie", solo: "Solo amici" }[imp.amici] || "Notizie e amici") : "Solo notizie";
      return (imp.round || 5) + " round · " + am + (imp.sceglie === false ? "" : " · 🎯 sceglie chi è ultimo") + " · " + (imp.ride === false ? "senza «Che balla!»" : "😂 Che balla!");
    },

    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteB(t, t.linkParams.stanza);   // entrato da un invito
      if ((t.impostazioni || {}).modo === "online") { assicuraStile(); return hostB(t); }
      var imp = t.impostazioni || {};
      var g = t.giocatori.map(function (n) { return { nome: n, punti: 0, tot: nuoviTot() }; });
      var domande = domandeLocali(imp.round || 5, imp.amici, g, imp.sceglie !== false);
      if (!domande.length) return niente(t);
      assicuraStile();
      var st = { t: t, domande: domande, giri: domande.length, giro: 0, g: g, ride: imp.ride !== false };
      st.S = ST.crea(t, st.g.map(function (g) { return { nome: g.nome }; }), { io: -1, esci: t.esci, titolo: "La Balla Colossale", logo: ["LA BALLA", "COLOSSALE"] });
      ST.apertura(st.S).then(function () { round(st); });
    }
  });

  // le domande della partita sullo stesso telefono: notizie e (se si parla di voi) domande sugli amici, coi protagonisti a turno,
  // e alla fine la Balla Finale. sceglie = la notizia la sceglie chi è ultimo: al suo posto c'è { daScegliere: true }
  function domandeLocali(giri, modo, g, sceglie) {
    var piano = pianoRound(giri, modo);
    var nA = piano.filter(function (x) { return x === "a"; }).length, nN = piano.filter(function (x) { return x === "n"; }).length;
    var notizie = sceglie ? [] : scegliDomande(nN), amici = scegliAmici(nA);
    var turno = mescola(g.map(function (_, i) { return i; })), q = 0, out = [];
    piano.forEach(function (x) {
      var tpl = x === "a" ? amici.shift() : null;
      if (tpl) { var p = turno[q++ % turno.length]; out.push({ domanda: riempi(tpl.domanda, g[p].nome), rispostaVera: "", balleCasa: tpl.balleCasa || [], amici: true, prot: p, protNome: g[p].nome }); }
      else if (x === "f" && finali().length) out.push(scegliFinale());
      else if (sceglie && notizieDi().length) out.push({ daScegliere: true });
      else { var d = notizie.shift() || scegliDomande(1)[0]; if (d) out.push(d); }
    });
    return out;
  }
  function eProt(st, i) { return !!(st.d && st.d.amici && st.d.prot === i); }
  function avvisoVera(st) { return st.d && st.d.amici ? "😱 È proprio la risposta di " + st.d.protNome + "! Inventa una balla diversa." : AVVISO_VERA; }

  // i numeri della partita di ogni giocatore (per i premi finali e i contatori)
  function nuoviTot() { return { trovate: 0, ingannati: 0, cascato: 0, perfette: 0, risate: 0, ori: 0 }; }
  function sommaTot(tot, d) { tot.trovate += d.trovata; tot.ingannati += d.ingannati; tot.cascato += d.cascato; tot.perfette += d.perfetta; tot.risate = (tot.risate || 0) + (d.risate || 0); tot.ori = (tot.ori || 0) + (d.ori || 0); }

  function niente(t) {
    var s = t.schermata({ chiara: true, icona: "🤥", titolo: "Mancano le notizie", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "Le notizie del gioco non sono state caricate." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  NELLO STUDIO: un round
  // =========================================================
  function fac(el, g, faccia) { return el("span", { class: "fac", html: ST.avatarDi(g, faccia) }); }
  // la PRIMA PAGINA di un giornale, con la notizia come titolo e i pezzi mancanti in giallo; risposta = il testo da mettere
  // nei buchi (null = vuoti); grande = sul maxischermo (con le colonne del giornale sotto il titolo).
  // «Parliamo di te»: un foglietto giallo invece del giornale
  var GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  function oggi() { var d = new Date(); return GIORNI[d.getDay()] + " " + d.getDate() + " " + MESI[d.getMonth()] + " " + d.getFullYear(); }
  function titoloNotizia(el, domanda, risposta) {
    var parti = pezziN(domanda), nb = parti.length - 1, r = risposta == null ? [] : nb > 1 ? dueDi(risposta) : [vis(risposta)];
    var nodi = [];
    parti.forEach(function (tx, n) {
      if (n) {   // un buco (e lo spazio prima del testo che segue, tranne davanti alla punteggiatura)
        nodi.push(el("span", { class: "bc-buco" + (r[n - 1] ? " pieno" : ""), text: r[n - 1] || "" }));
        if (tx) nodi.push(document.createTextNode((/^[,.;:!?)»]/.test(tx) ? "" : " ") + tx + (n < parti.length - 1 ? " " : "")));
      } else if (tx) nodi.push(document.createTextNode(tx + " "));
    });
    return el("p", { class: "bc-notizia" }, nodi);
  }
  function ritaglio(el, st, risposta, grande) {
    var am = !!st.d.amici, fin = !!st.d.doppia;
    if (am) return el("div", { class: "bc-ritaglio" + (grande ? " grande" : "") + " amici" }, [
      el("div", { class: "bc-testata", text: "👥 Parliamo di " + (st.d.protNome || "te") + " · round " + (st.giro + 1) + " di " + st.giri }),
      titoloNotizia(el, st.d.domanda, risposta) ]);
    var cat = st.d.cat ? catDi(st.d.cat) : null;
    var colonne = grande ? el("div", { class: "bc-colonne" }, [0, 1, 2].map(function () { return el("div", {}, [0, 1, 2, 3, 4].map(function () { return el("i"); })); })) : null;
    return el("div", { class: "bc-ritaglio pagina" + (grande ? " grande" : "") + (fin ? " finale" : "") }, [
      el("div", { class: "bc-testata" }, [ el("div", { class: "bc-gn", text: "Il Colossale" }), grande ? el("div", { class: "bc-gs", text: "Quotidiano di notizie vere e incredibili" }) : null ]),
      el("div", { class: "bc-griga" }, [ el("span", { text: oggi() }), el("span", { text: "Round " + (st.giro + 1) + " di " + st.giri }), el("span", { text: "€ 1,50" }) ]),
      el("div", { class: "bc-occhio", text: fin ? "🔥 La Balla Finale · due pezzi" : (cat ? cat.ic + " " + cat.nome + " · " : "📰 ") + "Notizia vera" }),
      titoloNotizia(el, st.d.domanda, risposta), colonne ]);
  }
  // riempie i buchi di una notizia già disegnata (null = vuoti)
  function mettiNeiBuchi(nodo, testo) {
    var b = nodo.querySelectorAll(".bc-buco"), p = testo == null ? [] : b.length > 1 ? dueDi(testo) : [vis(testo)];
    [].forEach.call(b, function (x, n) { var t = p[n] || ""; if (x.textContent !== t) x.textContent = t; x.classList.toggle("pieno", !!t); });
  }

  async function round(st) {
    var S = st.S; if (!S.vivo()) return;
    st.d = st.domande[st.giro];
    if (st.d && st.d.daScegliere) {   // «🎯 Sceglie chi è ultimo»
      var dd = await scegliLocale(st); if (!S.vivo()) return;
      st.d = st.domande[st.giro] = dd || scegliDomande(1)[0];
    }
    st.balle = st.g.map(function () { return ""; });
    st.voti = st.g.map(function () { return null; });
    st.fatti = st.g.map(function () { return false; });
    ST.tutteNormali(S);
    st.g.forEach(function (g, i) { ST.puntiLeggio(S, i, g.punti, 0); });
    // la notizia sul maxischermo, da leggere ad alta voce
    ST.viaBarra(S); ST.accendiSolo(S, -1);
    await ST.suSchermo(S, 800);
    schermoTurno(st, null, "scrive");
    ST.FX.rullo(1);
    await ST.dorme(1100);
    ST.pubblico(S, "piano");
    if (st.d.amici) await annunciaAmici(S, st.d.prot, st.d.protNome);
    if (moltiplica(st.giro, st.giri) > 1) await annunciaDoppio(S, st.d.doppia);
    await ST.aspettaTasto(S, st.d.amici ? "Letta! Prima " + st.d.protNome + " ✍️" : "Letta! Ora le balle ✍️");
    // «Parliamo di te»: scrive per primo il protagonista (la verità), così le balle uguali alla verità si scoprono subito
    var ordine = st.g.map(function (_, i) { return i; });
    if (st.d.amici) ordine = [st.d.prot].concat(ordine.filter(function (i) { return i !== st.d.prot; }));
    for (var q = 0; q < ordine.length; q++) {
      if (!S.vivo()) return;
      await turnoScrittura(st, ordine[q]);
    }
    if (!S.vivo()) return;
    st.scelte = preparaScelte(st.d.rispostaVera, st.balle, st.d.balleCasa, st.d.doppia);
    st.risate = st.scelte.map(function () { return 0; });
    // sullo stesso telefono i 😂 si contano a tocchi: al massimo uno per ogni amico che non l'ha scritta
    st.rideFn = function (k) { var sc = st.scelte[k]; if ((st.risate[k] || 0) >= st.g.length - (sc.autori || []).length) return false; st.risate[k]++; return true; };
    await presentaRisposte(st);
    if (!S.vivo()) return;
    await ST.aspettaTasto(S, "Si vota! 🗳️");
    st.fatti = st.g.map(function () { return false; });
    for (var i = 0; i < st.g.length; i++) {
      if (!S.vivo()) return;
      if (eProt(st, i)) continue;   // il protagonista la verità la sa: non vota
      await turnoVoto(st, i);
    }
    if (!S.vivo()) return;
    await rivelazione(st);
    if (!S.vivo()) return;
    if (st.ride) {
      var oro = calcolaOro(st.scelte, st.risate);
      if (oro) await schermoOro(st, oro);
      if (!S.vivo()) return;
    }
    await punteggi(st);
  }

  // «Parliamo di te»: lo studio annuncia di chi si parla
  async function annunciaAmici(S, i, nome) {
    ST.terzo(S, i, "👥 Parliamo di " + nome + "!", nome + " scrive la verità, gli altri le balle", "👥");
    ST.pubblico(S, "applauso");
    if (i != null && i >= 0) ST.faccia(S, i, "esulta");
    await ST.dorme(2600); ST.viaTerzo(S);
    if (i != null && i >= 0) ST.faccia(S, i, null);
  }

  // l'ultimo round: punti doppi; la Balla Finale (due pezzi mancanti) punti tripli (lo annuncia lo studio)
  async function annunciaDoppio(S, finale) {
    if (finale) ST.terzo(S, null, "🔥 La Balla Finale!", "Due pezzi mancanti, punti tripli: +6 per la verità, +3 per ogni amico ingannato", "🔥");
    else ST.terzo(S, null, "🔥 Ultimo round!", "Punti doppi: +4 per la verità, +2 per ogni amico ingannato", "🔥");
    ST.pubblico(S, finale ? "ovazione" : "applauso");
    await ST.dorme(finale ? 3200 : 2600); ST.viaTerzo(S);
  }

  // ---- «🎯 Sceglie chi è ultimo»: sul maxischermo i tre argomenti; chi sceglie li tocca (onScegli = null: si guardano soltanto) ----
  // c = { opz: [3 argomenti], perche }; io = online, sono io che scelgo
  function schermoCategoria(st, i, c, onScegli, io) {
    var S = st.S, el = st.t.el, g = st.g[i] || { nome: "?" };
    ST.fermaTimer(S); ST.vuota(S.sch);
    var perche = { zero: "Siete tutti a zero: comincia " + (io ? "tu" : g.nome), pari: "Siete pari in fondo: tocca a " + (io ? "te" : g.nome),
      ultimo: io ? "Sei ultimo in classifica: rifatti!" : g.nome + " è ultimo in classifica" }[c.perche] || "";
    var carte = (c.opz || []).map(function (k, n) {
      var cat = catDi(k), b = el("button", { class: "bc-cat-c", type: "button" }, [ el("span", { class: "ic", text: cat.ic }), el("span", { class: "nm", text: cat.nome }) ]);
      if (onScegli) b.addEventListener("click", function () {
        if (b.disabled) return;
        carte.forEach(function (x) { x.disabled = true; }); b.classList.add("toccata");
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
        onScegli(n);
      });
      else b.disabled = true;
      return b;
    });
    S.sch.appendChild(el("div", { class: "bc-sch bc-catsch" }, [
      el("div", { class: "bc-giro", text: "Round " + (st.giro + 1) + " di " + st.giri }),
      el("div", { class: "bc-chi-sch bc-chi-cat" }, [ i >= 0 ? fac(el, g, "pensa") : null, el("span", { text: io ? "🎯 Scegli tu l'argomento!" : "🎯 " + g.nome + " sceglie l'argomento" }) ]),
      el("div", { class: "bc-perche", text: perche }),
      el("div", { class: "bc-cats" }, carte) ]));
    return carte;
  }
  function segnaCategoria(carte, k) { (carte || []).forEach(function (b, n) { b.disabled = true; b.classList.toggle("scelta", n === k); b.classList.toggle("spenta", n !== k); }); }
  // sullo stesso telefono: chi è ultimo tocca uno dei tre argomenti (il telefono ce l'hanno tutti davanti), poi la notizia
  async function scegliLocale(st) {
    var S = st.S, vivi = st.g.filter(function (g) { return !g.via; }), ch = chiSceglie(vivi), i = st.g.indexOf(ch.g);
    ch.g.nScelte = (ch.g.nScelte || 0) + 1;
    var c = { opz: treCategorie(), perche: ch.perche };
    if (!c.opz.length) return null;
    ST.viaBarra(S); ST.viaTerzo(S); ST.tutteNormali(S); ST.accendiSolo(S, i);
    await ST.suSchermo(S, 800);
    if (!S.vivo()) return null;
    ST.faccia(S, i, "pensa"); ST.pubblico(S, "piano");
    var carte = null, k = await new Promise(function (fine) { carte = schermoCategoria(st, i, c, fine); });
    segnaCategoria(carte, k); ST.faccia(S, i, "esulta"); tic(880);
    await ST.dorme(1100); ST.faccia(S, i, null);
    return notiziaDi(c.opz[k]);
  }

  // il maxischermo tra un turno e l'altro: la notizia (o, quando si vota, il tabellone) e chi ha già finito
  function schermoTurno(st, i, cosa) {
    var S = st.S, el = st.t.el;
    var fatti = el("div", { class: "bc-fatti" }); st.boxFatti = fatti;
    st.g.forEach(function (g, k) {
      if (g.via || (cosa === "vota" && eProt(st, k))) return;   // (chi è uscito; e il protagonista, che non vota)
      fatti.appendChild(el("span", { class: st.fatti[k] ? "ok" : "" }, [ fac(el, g), el("span", { text: (st.fatti[k] ? "✅ " : "") + g.nome }) ]));
    });
    var chi = i == null ? (cosa === "scrive" ? (st.d.amici ? "✍️ " + st.d.protNome + " scrive la verità, voi una balla!" : "✍️ Inventate una balla per completarla!") : "🗳️ Qual è la risposta vera?")
      : (cosa === "scrive" ? (eProt(st, i) ? "🤫 Scrive la verità " : "✍️ Scrive ") : "🗳️ Vota ") + st.g[i].nome;
    if (cosa === "vota") return tabellone(st, { sotto: [ el("div", { class: "bc-chi-sch", text: chi }), fatti ] });
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "bc-sch" }, [ ritaglio(el, st, null, true), el("div", { class: "bc-chi-sch", text: chi }), fatti ]);
    S.sch.appendChild(box);
    stringiPagina(box);
    if (window.ResizeObserver) new ResizeObserver(function () { if (box.isConnected) stringiPagina(box); }).observe(box);
    try { document.fonts.ready.then(function () { if (box.isConnected) stringiPagina(box); }); } catch (e) {}
  }
  // la prima pagina sul maxischermo: con le notizie lunghe (o lo schermo basso) prima vanno via le colonne, poi il titolo si stringe
  function stringiPagina(box) {
    var pg = box.querySelector(".bc-ritaglio.grande"); if (!pg) return;
    var fs = pg.classList.contains("amici") ? 23 : 26, cs = getComputedStyle(box);
    var troppo = function () {
      var k = [].filter.call(box.children, function (c) { return c.offsetHeight > 0; }); if (!k.length || !box.clientHeight) return false;
      var ul = k[k.length - 1], alto = ul.offsetTop + ul.offsetHeight - k[0].offsetTop + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      return alto > box.clientHeight + 1;
    };
    pg.classList.remove("bassa"); pg.style.setProperty("--ft", fs + "px");
    if (troppo()) pg.classList.add("bassa");
    while (troppo() && fs > 15) { fs--; pg.style.setProperty("--ft", fs + "px"); }
  }

  // ---- il TABELLONE sul maxischermo: tutte le risposte numerate, balle e verità mescolate ----
  // o.entra = le righe compaiono una alla volta (le gira chi chiama); o.voti = accanto a ogni risposta chi l'ha votata; o.sotto = nodi sotto
  function tabellone(st, o) {
    var S = st.S, el = st.t.el; o = o || {};
    ST.fermaTimer(S); ST.vuota(S.sch);
    var righe = st.scelte.map(function (sc, k) {
      var r = el("div", { class: "bc-riga" + (o.entra ? " giu" : "") }, [ el("span", { class: "n", text: String(k + 1) }), el("span", { class: "tx", text: vis(sc.testo) }) ]);
      r._voti = el("span", { class: "vv" }); r.appendChild(r._voti);
      if (o.voti) chiHaVotato(st, k).forEach(function (v) { r._voti.appendChild(fac(el, st.g[v])); });
      return r;
    });
    var box = el("div", { class: "bc-sch tab" }, [ ritaglio(el, st, null, false), o.titolo ? el("div", { class: "bc-chi-sch", text: o.titolo }) : null, el("div", { class: "bc-tab" }, righe) ].concat(o.sotto || []));
    S.sch.appendChild(box);
    // tante risposte su un telefono piccolo: le scritte si stringono quanto basta per starci tutte
    // (si tiene già il posto per il tasto in basso, che compare quasi sempre col tabellone)
    stringiTab(box, S.vista.classList.contains("con-barra") ? 0 : 94);
    if (window.ResizeObserver) new ResizeObserver(function () { if (box.isConnected) stringiTab(box, 0); }).observe(box);
    return righe;
  }
  function stringiTab(box, riserva) {
    var fs = parseInt(box.style.getPropertyValue("--fs"), 10) || 18, cs = getComputedStyle(box);
    var troppo = function () {   // quanto è alto il contenuto (dal primo all'ultimo pezzo visibile) rispetto allo spazio
      var k = [].filter.call(box.children, function (c) { return c.offsetHeight > 0; }); if (!k.length || !box.clientHeight) return false;
      var ul = k[k.length - 1], alto = ul.offsetTop + ul.offsetHeight - k[0].offsetTop + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      return alto > box.clientHeight - riserva + 1;
    };
    while (troppo() && fs > 12) { fs--; box.style.setProperty("--fs", fs + "px"); }
    if (troppo()) box.classList.add("soloFacce");   // ancora troppo: chi ha finito si vede solo dall'avatar
    if (troppo()) box.classList.add("minimo");      // e le righe più fitte
    if (troppo()) box.classList.add("corto");       // e solo alla fine via la notizia (prima andava via subito: in 6 sul telefono piccolo la domanda spariva)
  }
  function tic(freq) {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var o = c.createOscillator(), g = c.createGain(), n = c.currentTime; o.type = "square"; o.frequency.setValueAtTime(freq, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.08, n + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.06);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + 0.07); } catch (e) {}
  }
  // finite le balle: sul tabellone compaiono le risposte, una alla volta, col rumore delle palette che girano
  async function presentaRisposte(st) {
    var S = st.S;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.largo(S, 800);
    ST.terzo(S, null, "Le balle sono pronte!", "Ecco le risposte…", "🤥");
    ST.pubblico(S, "applauso");
    await ST.dorme(1500); ST.viaTerzo(S);
    await ST.suSchermo(S, 800);
    var titolo = st.t.el("div", { class: "bc-chi-sch", text: "📋 Ecco le risposte!" });
    var righe = tabellone(st, { entra: true, sotto: [ titolo ] });
    for (var k = 0; k < righe.length; k++) {
      await ST.dorme(k ? 650 : 400);
      if (!S.vivo()) return;
      righe[k].classList.remove("giu"); tic(520 + k * 40);
    }
    await ST.dorme(600);
    titolo.textContent = "🤫 Una sola è vera… quale?"; titolo.classList.add("pulsa");
    ST.FX.rullo(1.2);
    await ST.dorme(1300);
  }
  // i voti sul tabellone: accanto a ogni risposta compaiono gli avatar di chi l'ha votata
  async function mostraVoti(st) {
    var S = st.S, el = st.t.el;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 800);
    var titolo = el("div", { class: "bc-chi-sch", text: "🗳️ Ecco i voti!" });
    var righe = tabellone(st, { sotto: [ titolo ] });
    for (var k = 0; k < righe.length; k++) {
      var chi = chiHaVotato(st, k);
      for (var q = 0; q < chi.length; q++) {
        await ST.dorme(300);
        if (!S.vivo()) return;
        righe[k]._voti.appendChild(fac(el, st.g[chi[q]])); tic(700 + q * 60);
      }
    }
    await ST.dorme(700);
    titolo.textContent = "🔍 E adesso… la verità!"; titolo.classList.add("pulsa");
    ST.pubblico(S, "piano");
    await ST.dorme(900);
  }

  async function turnoScrittura(st, i) {
    var S = st.S, g = st.g[i];
    schermoTurno(st, i, "scrive");
    await ST.stacco(S, i, "Passa il telefono a " + g.nome);
    await ST.aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶");
    if (!S.vivo()) return;
    ST.accendiSolo(S, i); ST.testoLeggio(S, i, eProt(st, i) ? "🤫 la verità" : "✍️ scrive");
    await ST.suLeggio(S, i, 400);
    ST.lampo(S);
    if (eProt(st, i)) { st.d.rispostaVera = await apriBiglietto(st, i, { vero: true }); st.balle[i] = ""; }   // la verità, non una balla
    else st.balle[i] = await apriBiglietto(st, i);
    if (!S.vivo()) return;
    st.fatti[i] = true;
    ST.testoLeggio(S, i, "✅ fatto"); ST.faccia(S, i, "esulta");
    schermoTurno(st, i, "scrive");
    await ST.dorme(650);
    ST.faccia(S, i, null);
  }

  async function turnoVoto(st, i) {
    var S = st.S, g = st.g[i];
    schermoTurno(st, i, "vota");
    await ST.stacco(S, i, "Passa il telefono a " + g.nome);
    await ST.aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶");
    if (!S.vivo()) return;
    ST.accendiSolo(S, i); ST.testoLeggio(S, i, "🗳️ vota");
    await ST.suLeggio(S, i, 400);
    ST.lampo(S);
    st.voti[i] = await apriVoto(st, i);
    if (!S.vivo()) return;
    st.fatti[i] = true;
    ST.testoLeggio(S, i, "✅ votato"); ST.faccia(S, i, "pensa");
    schermoTurno(st, i, "vota");
    await ST.dorme(650);
    ST.faccia(S, i, null);
  }

  // ---- il foglio segreto, sopra lo studio (si chiude da solo: niente resta a vista quando si passa il telefono) ----
  // ms = il tempo (online): una barra che si accorcia; S._chiudiVelo lo chiude da fuori (il tempo è finito per tutti)
  function apriVelo(S, el, nodi, cls, ms) {
    var velo = el("div", { class: "bc-velo" }), carta = el("div", { class: "bc-carta" + (cls ? " " + cls : "") }, nodi);
    var toPoco = null, toSec = null;
    if (ms) {
      // la barra del tempo e, accanto, i secondi che mancano (negli ultimi 5 un tic per secondo)
      var barraT = el("i"), tempo = el("div", { class: "bc-tempo" }, [barraT]), sec = el("b", { class: "bc-sec" });
      carta.insertBefore(el("div", { class: "bc-tempo-riga" }, [tempo, sec]), carta.firstChild);
      var parti = function () { if (barraT._via) return; barraT._via = 1; barraT.style.transition = "transform " + ms + "ms linear"; barraT.style.transform = "scaleX(0)"; };
      requestAnimationFrame(function () { requestAnimationFrame(parti); }); setTimeout(parti, 120);
      toPoco = setTimeout(function () { tempo.classList.add("poco"); sec.classList.add("poco"); }, Math.max(0, ms - 10000));
      var fineT = Date.now() + ms, ultimo = -1;
      var segna = function () {
        // il foglio non c'è più (es. nella Sala l'host è sparito e il core ha portato tutti fuori): il tempo si ferma, niente tic
        if (ultimo >= 0 && !document.body.contains(velo)) { clearTimeout(toPoco); clearInterval(toSec); return; }
        var s = Math.max(0, Math.ceil((fineT - Date.now()) / 1000)); if (s === ultimo) return;
        ultimo = s; sec.textContent = s;
        if (s > 0 && s <= 5) tic(980);
      };
      segna(); toSec = setInterval(segna, 250);
    }
    velo.appendChild(carta); S.vista.appendChild(velo);
    S.rec.classList.remove("on");
    requestAnimationFrame(function () { velo.classList.add("on"); });
    setTimeout(function () { velo.classList.add("on"); }, 90);
    return { velo: velo, carta: carta, chiudi: function (poi) {
      clearTimeout(toPoco); clearInterval(toSec); S._chiudiVelo = null;
      try { if (document.activeElement) document.activeElement.blur(); } catch (e) {}
      velo.classList.add("via");
      setTimeout(function () { velo.classList.remove("on"); setTimeout(function () { if (velo.parentNode) velo.parentNode.removeChild(velo); poi(); }, 260); }, 300);
    } };
  }
  // tante risposte lunghe su un telefono piccolo: le scritte si stringono quanto basta per stare tutte nello schermo, senza scorrere
  // (per gradi: scritte più piccole, notizia più piccola, risposte su due colonne, notizia nascosta: è già sul maxischermo)
  // lungo = la risposta più lunga: si misura con quella già dentro la notizia (quando si tocca una risposta la notizia si allunga)
  function adatta(v, tante, notizia, lungo) {
    var cs = getComputedStyle(v.velo), pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    var buchi = notizia ? [].slice.call(notizia.querySelectorAll(".bc-buco")) : [];
    var prima = buchi.map(function (b) { return [b.textContent, b.classList.contains("pieno")]; });
    if (buchi.length && lungo) mettiNeiBuchi(notizia, lungo);
    var troppo = function () { return v.carta.offsetHeight > v.velo.clientHeight - pad; }, fs = 16;
    var stringi = function () { fs = 16; v.carta.style.setProperty("--fs", fs + "px"); while (troppo() && fs > 12) { fs--; v.carta.style.setProperty("--fs", fs + "px"); } };
    (function () {
      stringi(); if (!troppo()) return;
      v.carta.classList.add("piccola"); if (!troppo()) return;
      if (tante) { v.carta.classList.add("due"); stringi(); if (!troppo()) return; }
      if (window.SGStudio && SGStudio.piatto) {   // (senza studio: notizia piccola, scritte fino a 11 px, mai la notizia nascosta)
        v.carta.classList.add("mini"); fs = 12; v.carta.style.setProperty("--fs", fs + "px");
        while (troppo() && fs > 11) { fs -= 0.5; v.carta.style.setProperty("--fs", fs + "px"); }
        return;
      }
      v.carta.classList.add("senza"); stringi();   // senza la notizia c'è più posto: le scritte tornano grandi quanto si può
    })();
    if (buchi.length && lungo) buchi.forEach(function (b, n) { b.textContent = prima[n][0]; b.classList.toggle("pieno", prima[n][1]); });
  }
  function testaSegreta(el, g) { return el("div", { class: "bc-chi" }, [ fac(el, g), el("b", { text: g.nome }), el("small", { text: "🤫 guarda solo tu" }) ]); }
  var AVVISO_VERA = "😱 Troppo vicina alla risposta vera! Inventa una balla diversa.";

  // scrivere la balla: la notizia col buco, la penna, "Fatto". Restituisce la balla (o "" se il tempo finisce col foglio vuoto).
  // o.ms = il tempo (online); o.avviso = un avviso subito; o.verita = false quando la verità la sa solo l'host (online);
  // o.vero = «Parliamo di te»: il protagonista scrive la VERITÀ su di sé (niente controllo)
  function apriBiglietto(st, i, o) {
    var S = st.S, el = st.t.el, g = st.g[i]; o = o || {};
    return new Promise(function (fine) {
      var chiuso = false, toFine = null, doppia = !!st.d.doppia;   // (la Balla Finale: due campi, uno per pezzo)
      var campi = (doppia ? [1, 2] : [0]).map(function (n) {
        return el("textarea", { class: "bc-penna", maxlength: String(MAX_BALLA), rows: doppia ? "1" : "2", autocomplete: "off", autocapitalize: "none", spellcheck: "true",
          enterkeyhint: n === 1 ? "next" : "done", placeholder: o.vero ? "scrivi qui la verità…" : n === 1 ? "il primo pezzo…" : n === 2 ? "il secondo pezzo…" : "scrivi qui la tua balla…" });
      });
      var inp = campi[0], conte = campi.map(function () { return el("div", { class: "bc-conta", text: "0/" + MAX_BALLA }); });
      var avviso = el("div", { class: "bc-avviso" });
      var ok = el("button", { class: "btn btn-primario bc-ok", text: o.ms ? "✅ Fatto!" : "✅ Fatto, nascondi", disabled: "disabled" });
      var anteprima = ritaglio(el, st, null, false), buchi = anteprima.querySelectorAll(".bc-buco");
      function valore() { var p = campi.map(function (c) { return pulisci(c.value); }); return doppia ? (p[0] && p[1] ? p[0] + SEP + p[1] : "") : p[0]; }
      function aggiorna() {
        campi.forEach(function (c, n) {
          var v = pulisci(c.value), b = buchi[n];
          conte[n].textContent = c.value.length + "/" + MAX_BALLA;
          if (b) { b.textContent = v; b.classList.toggle("pieno", !!v); }   // la balla si vede già dentro la notizia
        });
        ok.disabled = !valore();
        avviso.classList.remove("on");
      }
      function chiudi(v) {
        if (chiuso) return; chiuso = true; ok.disabled = true; clearTimeout(toFine);
        if (vv) vv.removeEventListener("resize", tastiera);
        v0.chiudi(function () { fine(v); });
      }
      // con la tastiera aperta lo schermo si abbassa: la notizia si fa piccola, il campo e "Fatto" restano a vista
      var vv = window.visualViewport;
      function tastiera() {
        var giu = vv.height < window.innerHeight * 0.8;
        v0.carta.classList.toggle("tastiera", giu);
        v0.velo.style.paddingBottom = giu ? Math.max(12, window.innerHeight - vv.height - vv.offsetTop + 12) + "px" : "";
        if (giu) try { ok.scrollIntoView({ block: "nearest" }); } catch (e) {}
      }
      function finito() {
        if (chiuso) return;
        var v = valore();
        if (!v) { var vuoto = campi.filter(function (c) { return !pulisci(c.value); })[0]; if (vuoto) try { vuoto.focus({ preventScroll: true }); } catch (e) {} return; }
        if (!o.vero && o.verita !== false && st.d.rispostaVera && eLaVeritaR(v, st.d.rispostaVera, doppia)) {   // ha scritto proprio la verità: deve inventare un'altra cosa
          avviso.textContent = avvisoVera(st); campi.forEach(function (c) { c.value = ""; }); aggiorna(); avviso.classList.add("on");
          try { inp.focus({ preventScroll: true }); } catch (e) {}
          return;
        }
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
        chiudi(v);
      }
      campi.forEach(function (c, n) {
        c.addEventListener("input", aggiorna);
        c.addEventListener("keydown", function (e) {   // a capo: dal primo pezzo si passa al secondo
          if (e.key !== "Enter") return; e.preventDefault();
          if (doppia && n === 0 && !pulisci(campi[1].value)) { try { campi[1].focus({ preventScroll: true }); } catch (x) {} } else finito();
        });
      });
      ok.addEventListener("click", finito);
      var scrivi = el("label", { class: "bc-scrivi" + (o.vero ? " vero" : "") + (doppia ? " doppia" : "") }, [
        el("span", { class: "bc-et", text: o.vero ? "🤫 Scrivi la VERITÀ: gli altri dovranno trovarla!" : doppia ? "✍️ La tua balla: inventa tutti e due i pezzi!" : "✍️ La tua balla: deve sembrare vera!" }) ]);
      campi.forEach(function (c, n) {
        if (doppia) scrivi.appendChild(el("div", { class: "bc-pezzo" }, [ el("span", { class: "nn", text: String(n + 1) }), el("div", { class: "cc" }, [ c, conte[n] ]) ]));
        else { scrivi.appendChild(c); scrivi.appendChild(conte[n]); }
      });
      var v0 = apriVelo(S, el, [ testaSegreta(el, g), anteprima, scrivi, avviso, ok ], doppia ? "doppia" : "", o.ms);
      if (o.avviso) { avviso.textContent = o.avviso; avviso.classList.add("on"); }
      if (vv) vv.addEventListener("resize", tastiera);
      S._chiudiVelo = function () { chiudi(valore()); };   // il tempo è finito: vale quello che c'è scritto (nella Balla Finale, se ci sono tutti e due i pezzi)
      if (o.ms) toFine = setTimeout(S._chiudiVelo, o.ms);
      setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 650);
    });
  }

  // votare: tutte le risposte, la propria balla non si può scegliere. Restituisce la scelta (o null se il tempo finisce).
  // o.mia(sc) = è la mia balla? (online la riconosco dal testo che ho scritto); o.ms = il tempo; o.avviso = un avviso subito
  function apriVoto(st, i, o) {
    var S = st.S, el = st.t.el, g = st.g[i]; o = o || {};
    var mia = o.mia || function (sc) { return (sc.autori || []).indexOf(i) >= 0; };
    return new Promise(function (fine) {
      var scelto = null, chiuso = false, bottoni = [], toFine = null;
      var ok = el("button", { class: "btn btn-primario bc-ok", text: "🗳️ Voto questa", disabled: "disabled" });
      var tante = st.scelte.length > 6;
      var lista = el("div", { class: "bc-scelte" + (tante ? " tante" : "") });
      var notizia = ritaglio(el, st, null, false);
      // la mia balla: grigia, con "✍️ la tua", non si tocca (online può arrivare dopo, se ho ricaricato la pagina)
      function segnaMia(b, sc) {
        if (!mia(sc) || b._mia) return;
        b._mia = true; b.disabled = true; b.classList.add("mia"); b.classList.remove("sel");
        b.appendChild(el("span", { class: "tag", text: "✍️ la tua" }));
        if (scelto === bottoni.indexOf(b)) { scelto = null; ok.disabled = true; anteprima(null); }
      }
      // la risposta toccata si legge già dentro la notizia
      function anteprima(testo) { mettiNeiBuchi(notizia, testo || null); }
      st.scelte.forEach(function (sc, k) {
        var b = el("button", { class: "bc-scelta" }, [ el("span", { class: "n", text: String(k + 1) }), el("span", { class: "tx", text: vis(sc.testo) }) ]);
        b.addEventListener("click", function () {
          if (chiuso || b._mia) return;
          scelto = k; bottoni.forEach(function (x, kk) { x.classList.toggle("sel", kk === k); });
          ok.disabled = false; anteprima(sc.testo);
          try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
        });
        bottoni.push(b); lista.appendChild(b);
      });
      bottoni.forEach(function (b, k) { segnaMia(b, st.scelte[k]); });
      S._segnaMia = function () { bottoni.forEach(function (b, k) { segnaMia(b, st.scelte[k]); }); };
      function chiudi(k) { if (chiuso) return; chiuso = true; clearTimeout(toFine); S._segnaMia = null; v0.chiudi(function () { fine(k); }); }
      ok.addEventListener("click", function () { if (scelto != null) chiudi(scelto); });
      var avviso = el("div", { class: "bc-avviso" + (o.avviso ? " on" : ""), text: o.avviso || "" });
      var v0 = apriVelo(S, el, [ testaSegreta(el, g), notizia, avviso,
        el("div", { class: "bc-et", text: "🔍 Qual è la risposta VERA?" }), lista, ok ], st.scelte.length > 5 ? "stretta" : "", o.ms);
      adatta(v0, tante, notizia, st.scelte.reduce(function (a, sc) { return sc.testo.length > a.length ? sc.testo : a; }, ""));
      S._chiudiVelo = function () { chiudi(null); };   // il tempo è finito: niente voto
      if (o.ms) toFine = setTimeout(S._chiudiVelo, o.ms);
    });
  }

  // =========================================================
  //  LA RIVELAZIONE: prima le balle che hanno ingannato qualcuno (dalla meno votata), poi la verità
  // =========================================================
  async function rivelazione(st) {
    var S = st.S;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    st.conta = st.scelte.map(function () { return 0; });
    st.voti.forEach(function (v) { if (v != null) st.conta[v]++; });
    var ordine = st.scelte.map(function (_, k) { return k; })
      .filter(function (k) { return !st.scelte[k].vera && st.conta[k] > 0; })
      .sort(function (a, b) { return st.conta[a] - st.conta[b]; });
    var kVera = st.scelte.map(function (sc) { return sc.vera; }).indexOf(true);
    await mostraVoti(st);
    if (!S.vivo()) return;
    await ST.aspettaTasto(S, "Scopriamo la verità 🔍");
    for (var q = 0; q < ordine.length; q++) { if (!S.vivo()) return; await mostraScelta(st, ordine[q]); }
    if (!S.vivo()) return;
    await mostraScelta(st, kVera);
    var ignorate = st.scelte.map(function (_, k) { return k; }).filter(function (k) { return !st.scelte[k].vera && st.conta[k] === 0; });
    if (ignorate.length && S.vivo()) await schermoIgnorate(st, ignorate);
  }

  function chiHaVotato(st, k) { var l = []; st.voti.forEach(function (v, i) { if (v === k) l.push(i); }); return l; }
  function quanti(n) { return ["", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto"][n] || String(n); }
  function nomi(st, lista) { var n = lista.map(function (i) { return st.g[i].nome; }); return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " e " + n[n.length - 1]; }

  function mostraScelta(st, k, online) {
    var S = st.S, el = st.t.el, sc = st.scelte[k], votanti = chiHaVotato(st, k);
    return new Promise(async function (fine) {
      ST.fermaTimer(S); ST.vuota(S.sch);
      var gente = el("div", { class: "bc-gente" });
      var timbro = el("div", { class: "bc-timbro " + (sc.vera ? "vero" : "balla"), text: sc.vera ? "Vero!" : "Balla!" });
      // (con «Che balla!» il biglietto tiene un po' di spazio sotto per il tasto 😂: niente salti quando compare)
      var biglietto = el("div", { class: "bc-big" + (!sc.vera && st.ride && st.rideFn ? " con-ride" : "") }, [ el("span", { class: "tx", text: vis(sc.testo) }), timbro ]);
      var sotto = el("div", { class: "bc-sotto" });
      S.sch.appendChild(el("div", { class: "bc-sch riv" }, [
        el("div", { class: "bc-giro", text: votanti.length ? (votanti.length === 1 ? "1 voto" : votanti.length + " voti") : "Nessun voto" }),
        biglietto, gente, sotto ]));
      // chi l'ha votata, uno alla volta
      for (var q = 0; q < votanti.length; q++) {
        await ST.dorme(q ? 380 : 650);
        var v = votanti[q];
        gente.appendChild(el("span", { class: "bc-votante" }, [ fac(el, st.g[v]), el("span", { text: st.g[v].nome }) ]));
      }
      if (!votanti.length) gente.appendChild(el("span", { class: "bc-nessuno", text: "Nessuno l'ha votata…" }));
      await ST.dorme(700);
      ST.FX.rullo(1.1);
      await ST.dorme(1250);
      if (!S.vivo()) return fine();
      timbro.classList.add("on");
      var m = moltiplica(st.giro, st.giri, st.d.doppia);
      // «😂 Che balla!»: appena il timbro dice «Balla!» si può ridere (non della propria)
      if (!sc.vera && st.ride && st.rideFn) biglietto.appendChild(bottoneRide(st, k, false));
      if (sc.vera) {
        var am = st.d.amici;
        sotto.appendChild(el("div", { class: "bc-intera" }, [ el("small", { text: am ? "La risposta di " + st.d.protNome + ":" : "La notizia vera:" }), ritaglio(el, st, sc.testo, false) ]));
        if (votanti.length) {
          sotto.appendChild(el("div", { class: "bc-premio si", text: "+" + (2 * m) + " punti a " + nomi(st, votanti) }));
          if (am) sotto.appendChild(el("div", { class: "bc-premio si oro", text: "+" + (votanti.length * m) + " a " + st.d.protNome + ": " + (votanti.length === 1 ? "l'ha capita 1 amico" : "l'hanno capita in " + quanti(votanti.length)) }));
          gente.querySelectorAll(".bc-votante").forEach(function (n) { n.classList.add("giusto"); });
          votanti.forEach(function (v) { ST.faccia(S, v, "evviva"); });
          ST.pubblico(S, "ovazione"); ST.coriandoli();
        } else {
          sotto.appendChild(el("div", { class: "bc-premio no", text: am ? "Nessuno conosce davvero " + st.d.protNome + "! 😱" : "Nessuno ha trovato la verità! 😱" }));
          ST.pubblico(S, "ohh");
        }
        if (am && st.d.prot >= 0) ST.faccia(S, st.d.prot, votanti.length ? "evviva" : "esploso");
      } else {
        gente.querySelectorAll(".bc-votante").forEach(function (n) { n.classList.add("cascato"); });
        votanti.forEach(function (v) { ST.faccia(S, v, "esploso"); });
        sc.autori.forEach(function (a) { ST.faccia(S, a, "esulta"); });
        if (sc.casa || !sc.autori.length) {   // una balla della redazione: nessuno prende punti
          sotto.appendChild(el("div", { class: "bc-autore" }, [ el("small", { text: "L'ha scritta" }),
            el("div", { class: "bc-redazione", text: "🗞️ la redazione" }) ]));
        } else {
          var guadagno = sc.autori.map(function (a) { return votanti.filter(function (v) { return v !== a; }).length * m; });
          sotto.appendChild(el("div", { class: "bc-autore" }, [
            el("small", { text: sc.autori.length > 1 ? "L'hanno scritta in " + quanti(sc.autori.length) + ":" : "L'ha scritta" }),
            el("div", { class: "bc-autori" }, sc.autori.map(function (a, n) { return el("span", { class: "bc-votante autore" }, [ fac(el, st.g[a], "esulta"), el("span", { text: st.g[a].nome + " +" + guadagno[n] }) ]); }))
          ]));
        }
        ST.pubblico(S, "ohh");
      }
      await ST.dorme(900);
      if (!online) await ST.aspettaTasto(S, "Avanti ▶");
      fine();
    });
  }

  // le balle a cui non ha creduto nessuno (sul maxischermo, tutte insieme)
  async function schermoIgnorate(st, lista, online) {
    var S = st.S, el = st.t.el;
    ST.fermaTimer(S); ST.vuota(S.sch);
    var righe = el("div", { class: "bc-ignorate" }), ride = st.ride && st.rideFn;
    lista.forEach(function (k, n) {
      var sc = st.scelte[k], r = el("div", { class: "bc-ign" }, [ el("span", { class: "tx", text: vis(sc.testo) }), el("span", { class: "di", text: sc.autori.length ? nomi(st, sc.autori) : "🗞️ redazione" }),
        ride ? bottoneRide(st, k, true) : null ]);
      r.style.animationDelay = (n * 0.12) + "s"; righe.appendChild(r);
    });
    var box = el("div", { class: "bc-sch" }, [ el("div", { class: "bc-chi-sch", text: "🙄 Balle a cui non ha creduto nessuno" }), righe,
      ride ? el("div", { class: "bc-giro", text: "😂 Fanno ridere? Toccate 😂" }) : null ]);
    S.sch.appendChild(box);
    ST.pubblico(S, "piano");
    if (!online) await ST.aspettaTasto(S, st.ride ? "Avanti ▶" : "Vediamo i punti ▶");
  }

  // ---- «😂 Che balla!»: il tasto delle risate su una balla ----
  // st.rideFn(k) = conta la risata (false = non si può: già fatto, o troppi tocchi); st.hoRiso(k) = online, l'ho già fatto;
  // st.miaBalla(sc) = online, l'ho scritta io (non si ride della propria). piccolo = nella lista delle balle ignorate
  function bottoneRide(st, k, piccolo) {
    var el = st.t.el, sc = st.scelte[k], mia = !!(st.miaBalla && st.miaBalla(sc));
    var b = el("button", { class: "bc-ride" + (piccolo ? " pic" : ""), type: "button", "aria-label": "Che balla!" }, [
      el("span", { class: "em", text: "😂" }), piccolo ? null : el("span", { class: "rt", text: mia ? "La tua" : "Che balla!" }), el("b", { class: "nn" }) ]);
    b._n = 0;
    if (mia) { b.disabled = true; b.classList.add("mia"); }   // (della propria balla non si ride)
    segnaRide(b, (st.risate && st.risate[k]) || 0, st.hoRiso && st.hoRiso(k), true);
    b.addEventListener("click", function () {
      if (b.disabled) return;
      if (!st.rideFn(k)) { b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); return; }
      try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
      risatina();
      segnaRide(b, st.risate[k], st.hoRiso && st.hoRiso(k));
    });
    if (st.rideBtn) st.rideBtn[k] = b;
    return b;
  }
  // il numero di 😂 (a ogni risata in più vola su una faccina); mio = l'ho già toccato io
  function segnaRide(b, n, mio, subito) {
    if (!subito) for (var q = b._n; q < Math.min(n, b._n + 4); q++) vola(b, q - b._n);
    b._n = n;
    var nn = b.querySelector(".nn"), tx = n ? String(n) : "";
    if (nn.textContent !== tx) nn.textContent = tx;
    b.classList.toggle("mio", !!mio);
  }
  function vola(b, q) {
    var f = document.createElement("span"); f.className = "bc-vola"; f.textContent = "😂";
    f.style.left = (25 + Math.random() * 50) + "%"; f.style.animationDelay = (q * 0.12) + "s";
    b.appendChild(f); setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1500);
  }
  function risatina() {   // "ah-ah-ah": tre note che scendono
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { [880, 740, 622].forEach(function (f, i) { var o = c.createOscillator(), g = c.createGain(), n = c.currentTime + i * 0.09;
      o.type = "triangle"; o.frequency.setValueAtTime(f, n); g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.09, n + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.08);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + 0.09); }); } catch (e) {}
  }

  // ---- la Balla d'oro del round: la balla con più 😂, sul maxischermo (+1 a chi l'ha scritta) ----
  async function schermoOro(st, oro, online) {
    var S = st.S, el = st.t.el; if (!oro || !S.vivo()) return;
    ST.accendiSolo(S, -1); ST.tutteNormali(S); ST.viaBarra(S);
    await ST.suSchermo(S, 700);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var autori = [];
    oro.ks.forEach(function (k) { (st.scelte[k].autori || []).forEach(function (a) { if (autori.indexOf(a) < 0) autori.push(a); }); });
    var carte = oro.ks.slice(0, 2).map(function (k) { return el("div", { class: "bc-big oro" }, [ el("span", { class: "tx", text: vis(st.scelte[k].testo) }) ]); });
    S.sch.appendChild(el("div", { class: "bc-sch riv bc-oro" }, [
      el("div", { class: "bc-coppa", text: "🏆" }),
      el("div", { class: "bc-chi-sch", text: oro.ks.length > 1 ? "Balle d'oro del round!" : "Balla d'oro del round!" }) ].concat(carte, [
      el("div", { class: "bc-giro", text: "😂 × " + oro.n + (oro.ks.length > 1 ? " a testa" : "") }),
      el("div", { class: "bc-autori" }, autori.map(function (a) { return el("span", { class: "bc-votante autore" }, [ fac(el, st.g[a], "evviva"), el("span", { text: st.g[a].nome + " +1" }) ]); }))
    ])));
    autori.forEach(function (a) { ST.faccia(S, a, "evviva"); });
    ST.pubblico(S, "ovazione"); ST.coriandoli(); tic(1046);
    try { if (navigator.vibrate) navigator.vibrate([30, 40, 60]); } catch (e) {}
    if (!online) await ST.aspettaTasto(S, "Vediamo i punti ▶");
  }

  // i punti scorrono sui leggii, poi la classifica sul maxischermo (o il gran finale)
  async function punteggi(st) {
    var S = st.S, t = st.t, el = t.el;
    ST.viaBarra(S); ST.tutteNormali(S);
    await ST.largo(S, 900);
    ST.terzo(S, null, "Fine del round " + (st.giro + 1), "Ecco i punti!", "🏁");
    st.esito = calcola(st.scelte, st.voti, st.g.length, moltiplica(st.giro, st.giri, st.d.doppia), null, st.d.amici ? st.d.prot : null, st.ride ? st.risate : null);
    for (var i = 0; i < st.g.length; i++) {
      var d = st.esito[i], piu = puntiDi(d);
      st.g[i].punti += piu; st.g[i].ultimo = piu; sommaTot(st.g[i].tot, d);
      ST.puntiLeggio(S, i, st.g[i].punti, piu);
      ST.faccia(S, i, piu > 0 ? "esulta" : "triste");
      await ST.dorme(320);
    }
    ST.pubblico(S, "applauso");
    await ST.dorme(1700); ST.viaTerzo(S); ST.tutteNormali(S);
    var ordine = st.g.slice().sort(function (x, y) { return y.punti - x.punti; });
    var pos = function (g) { return 1 + st.g.filter(function (q) { return q.punti > g.punti; }).length; };   // a pari punti, stessa posizione
    if (st.giro + 1 >= st.giri) {
      await schermoPremi(S, el, st.g, false);
      if (!S.vivo()) return;
      await granFinale(S, st.g, ordine.filter(function (g) { return pos(g) === 1; }));
      var clas = ordine.map(function (g) { return { nome: g.nome, punti: g.punti, pos: pos(g) }; });
      salvaContatori(st.g.map(function (g) { return { nome: g.nome, pos: pos(g), punti: g.punti, tot: g.tot }; }), null, false);
      return t.fine(clas);
    }
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "bc-clas" + (st.g.length > 4 ? " tanti" : "") }, [ el("h2", { text: "🏁 Classifica dopo " + (st.giro + 1) + " round" }) ]);
    ordine.forEach(function (g, k) {
      var r = el("div", { class: "bc-cl" + (pos(g) === 1 ? " primo" : "") }, [
        el("span", { class: "pos", text: medaglia(pos(g)) }), fac(el, g), el("span", { class: "nm", text: g.nome }),
        el("span", { class: "pt", text: String(g.punti) }), el("span", { class: "pi", text: "+" + (g.ultimo || 0) })
      ]);
      r.style.animationDelay = (k * 0.1) + "s";
      box.appendChild(r);
    });
    S.sch.appendChild(box);
    await ST.aspettaTasto(S, "Prossima notizia ▶");
    st.giro += 1;
    round(st);
  }
  function medaglia(p) { return ["🥇", "🥈", "🥉"][p - 1] || p + "°"; }

  // ---- fine partita: i premi della serata, poi il vincitore (o il pareggio) ----
  // g = i giocatori con i loro numeri (tot); online = non si aspetta il tasto
  var PREMI = [
    { k: "ingannati", icona: "🤥", nome: "Re delle balle", dice: function (n) { return n === 1 ? "1 amico ingannato" : n + " amici ingannati"; } },
    { k: "trovate", icona: "🔍", nome: "Detective", dice: function (n) { return n === 1 ? "1 verità scovata" : n + " verità scovate"; } },
    { k: "cascato", icona: "🙈", nome: "Credulone", dice: function (n) { return n === 1 ? "ci è cascato 1 volta" : "ci è cascato " + n + " volte"; } },
    { k: "risate", icona: "😂", nome: "Balla d'oro", dice: function (n) { return n === 1 ? "1 risata per le sue balle" : n + " risate per le sue balle"; } }
  ];
  async function schermoPremi(S, el, g, online) {
    var righe = [];
    PREMI.forEach(function (pr) {
      var max = 0; g.forEach(function (x) { if (x.tot && !x.via && x.tot[pr.k] > max) max = x.tot[pr.k]; });
      if (!max) return;
      var chi = g.filter(function (x) { return x.tot && !x.via && x.tot[pr.k] === max; }).slice(0, 3);
      righe.push(el("div", { class: "bc-premio-riga" }, [ el("span", { class: "ic", text: pr.icona }),
        el("div", { class: "cosa" }, [ el("b", { text: pr.nome }), el("small", { text: pr.dice(max) }) ]),
        el("div", { class: "chi" }, chi.map(function (x) { return el("span", { class: "bc-votante" }, [ fac(el, x, "esulta"), el("span", { text: x.nome }) ]); })) ]));
    });
    if (!righe.length || !S.vivo()) return;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "bc-sch bc-premi" }, [ el("div", { class: "bc-chi-sch", text: "🏅 I premi della serata" }) ]);
    S.sch.appendChild(box);
    for (var k = 0; k < righe.length; k++) {
      await ST.dorme(k ? 900 : 500);
      if (!S.vivo()) return;
      box.appendChild(righe[k]); tic(620 + k * 120); ST.pubblico(S, "applauso");
    }
    if (online) await ST.dorme(3200); else await ST.aspettaTasto(S, "E il vincitore è… ▶");
  }
  // il vincitore; a pari punti vincono in tanti
  async function granFinale(S, g, primi) {
    if (primi.length === 1) return ST.finale(S, g.indexOf(primi[0]), primi[0].punti + " punti");
    await ST.finale(S, -1);
    if (!S.vivo()) return;
    primi.forEach(function (p) { ST.faccia(S, g.indexOf(p), "esulta"); });
    ST.terzo(S, null, "Pareggio!", "Vincono " + primi.map(function (p) { return p.nome; }).join(", ").replace(/, ([^,]*)$/, " e $1") + " · " + primi[0].punti + " punti", "🏆");
    ST.pubblico(S, "ovazione"); ST.coriandoli(); if (ST.FX.fanfara) ST.FX.fanfara();
    await ST.dorme(3000); ST.viaTerzo(S);
  }

  // ---- i contatori per i trofei (solo per chi ha il profilo; online ognuno salva i suoi) ----
  // righe = [{ nome, id?, pos, punti, tot }]; mioId = online il mio id, altrimenti si cerca il nome del profilo
  var SALVATE = {};
  function salvaContatori(righe, mioId, online, sessione) {
    try {
      if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var nomeP = String(SGNube.profilo().nome || "").trim().toLowerCase(); if (!nomeP) return;
      var me = righe.filter(function (r) { return online ? r.id === mioId : String(r.nome || "").trim().toLowerCase() === nomeP; })[0];
      if (!me || !me.tot) return;
      if (sessione) {   // online: una volta sola per partita, anche se si ricarica la pagina
        if (SALVATE[sessione]) return; SALVATE[sessione] = 1;
        try { if (localStorage.getItem("sg-balla-salvata") === sessione) return; localStorage.setItem("sg-balla-salvata", sessione); } catch (e) {}
      }
      var incr = [["partite", 1], ["veritaTrovate", me.tot.trovate], ["amiciIngannati", me.tot.ingannati], ["ballePerfette", me.tot.perfette],
        ["risatePrese", me.tot.risate || 0], ["balleDoro", me.tot.ori || 0]];
      if (online) incr.push(["partiteOnline", 1]);
      if (me.pos === 1) incr.push(["vinte", 1]);
      SGNube.salvaProgressi(null, "balla", incr.filter(function (x) { return x[1] > 0; }), [["puntiMax", me.punti || 0]]);
    } catch (e) {}
  }

  // =========================================================
  //  ONLINE — ognuno dal suo telefono: si scrive e si vota tutti insieme, col tempo.
  //  L'host tiene la partita (notizie, balle, voti, punti) e manda a tutti la "foto" (vm);
  //  ogni telefono ha il suo studio e la sua regia, e fa vedere gli stessi momenti.
  //  Segreti: le balle e i voti non sono mai nella foto finché non si scoprono.
  // =========================================================
  var MIN_ON = 3, MAX_ON = 8;
  var TEMPO_SCRIVI = 75000, TEMPO_VOTA = 45000;   // quanto tempo c'è per scrivere e per votare
  var TEMPO_SCRIVI_FINALE = 100000;                 // la Balla Finale: due pezzi da inventare
  var DURATA_SCELTA = 2200;                         // l'argomento scelto resta a vista, poi la notizia
  var ANTICIPO = 1600;                              // la telecamera va sul leggio e si apre il foglio: poi parte il tempo
  var GRAZIA = 2500;                                // finito il tempo, aspetto i fogli che arrivano un po' in ritardo
  var DURATA_NOTIZIA = 6500;
  function durataRisposte(n) { return 2400 + 400 + n * 650 + 1900 + 1600; }   // le risposte che compaiono sul tabellone
  function durataVoti(nv) { return 1600 + nv * 300 + 1600 + 1500; }          // i voti che compaiono sul tabellone
  function durataPasso(nVoti, vera) { return (vera ? 7200 : 5600) + nVoti * 380; }
  function durataPunti(n) { return 4000 + n * 320 + 12000; }                 // i punti sui leggii, poi 12 secondi di classifica
  var RIDE_IN_PIU = 2500;            // «Che balla!»: un po' più di tempo su ogni balla scoperta, per toccare 😂
  var DURATA_IGNORATE_RIDE = 8000;   // e sulle balle a cui non ha creduto nessuno
  var DURATA_ORO = 5600;             // la Balla d'oro del round sul maxischermo

  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function senzaRete(t) {
    var s = t.schermata({ chiara: true, icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online si gioca quando l'app è aperta dal sito pubblicato. Intanto potete giocare \"Su questo telefono\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  function errore(t, testo) {
    var s = t.schermata({ chiara: true, icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }

  // ---------------- HOST ----------------
  function hostB(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var IO = t.mioId || "host";   // io che tengo la partita ("host", o l'amico che ha preso il posto dell'host)
    var H = { fase: "lobby", codice: "…", pronta: false, giri: imp.round || 5, giro: 0, d: null, notizie: [], amiciQ: [], piano: [],
      modoAmici: imp.amici || "misto", ride: imp.ride !== false, sceglie: imp.sceglie !== false, cat: null, giaProt: [], rif: 0, saltato: null,
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0 }],
      balle: {}, fatti: {}, voti: {}, scelte: [], scadenza: 0, passo: 0, ordine: [], ignorate: [], ultimo: {}, classifica: null, to: null,
      risate: {}, oro: null, avanti: [],
      guarda: [],   // nella Sala: chi non è stato scelto per giocare (guarda soltanto, col suo id nella foto)
      prossimi: [] };   // chi è arrivato a partita cominciata: { id, nome, omino }, entra all'inizio del round dopo (i punti del round vanno per posto)
    // la partita di prima (l'host ha ricaricato la pagina o riaperto l'app: t.ripresa): si riprende da lì.
    // Gli amici non si danno per usciti: si aspettano ("attesi") e rientrano da soli; chi non torna entro 10 secondi esce
    var R0 = t.ripresa && t.ripresa.stato, ripresa = !!(R0 && R0.fase && R0.fase !== "lobby" && R0.players), attesi = {}, tAttesi = null;
    if (ripresa) {
      H = R0; H.to = null; H.pronta = false; H.guarda = H.guarda || []; H.avanti = H.avanti || []; H.prossimi = H.prossimi || [];
      H.players.forEach(function (p) { if (p.id !== IO && !p.via) attesi[p.id] = 1; });
      H.prossimi.forEach(function (x) { attesi[x.id] = 1; });
      if (H.d && H.balle[IO]) MIA = { dom: H.d.domanda, testo: H.balle[IO] };   // la mia balla di questo round
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function iDi(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return i; return -1; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function prossimo(id) { return H.prossimi.some(function (x) { return x.id === id; }); }
    // chi aspettava entra in partita (all'inizio di un round, o nella saletta della partita dopo) con 0 punti
    function entrano() {
      H.prossimi.forEach(function (x) { if (!pById(x.id) && H.players.length < MAX_ON) H.players.push({ id: x.id, nome: x.nome, omino: x.omino || null, punti: 0, tot: nuoviTot() }); });
      H.prossimi = [];
    }
    // chi vota in questo round: chi è rimasto, senza il protagonista di «Parliamo di te» (la verità la sa)
    function votanti() { return presenti().filter(function (p) { return !(H.d && H.d.amici && p.id === H.d.prot); }); }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    function dopo(ms, f) { ferma(); H.to = setTimeout(f, ms); }

    // "⚙️ Regole" nella saletta: quanti round, di cosa si parla, «Che balla!»
    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      im = im || {}; H.giri = im.round || 5; H.modoAmici = im.amici || "misto"; H.ride = im.ride !== false; H.sceglie = im.sceglie !== false; bd();
    };

    // chi se ne va (o, dopo una ripresa, non è tornato in tempo)
    function addio(id) {
      delete attesi[id];
      if (H.guarda.indexOf(id) >= 0) { H.guarda.splice(H.guarda.indexOf(id), 1); bd(); return; }
      if (prossimo(id)) { H.prossimi = H.prossimi.filter(function (x) { return x.id !== id; }); bd(); return; }   // aspettava il round dopo: via e basta
      var p = pById(id); if (!p || p.via) return;
      if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
      p.via = true;   // a partita iniziata resta in classifica, ma non gioca più
      controlla(); bd();
    }
    var rete = SGNet.ospita("balla", {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: addio,
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          delete attesi[id];   // (dopo una ripresa: è tornato)
          var p0 = pById(id), nomeJ = String(m.nome || "Amico").slice(0, 16);
          // nella Sala gioca solo chi è stato scelto: gli altri guardano
          if (!p0 && (H.guarda.indexOf(id) >= 0 || (t.puoSedersi && !t.puoSedersi(id, nomeJ)))) { if (H.guarda.indexOf(id) < 0) H.guarda.push(id); bd(); return; }
          if (H.fase === "lobby" && !p0 && H.players.length < MAX_ON)
            H.players.push({ id: id, nome: nomeJ, omino: avatarValido(m.omino), punti: 0, tot: nuoviTot() });
          // a partita cominciata: aspetta il round dopo (entrare a metà round sballerebbe i punti, che vanno per posto).
          // Se non c'è più posto guarda soltanto (entra alla prossima partita, se si libera un posto)
          else if (!p0 && H.fase !== "lobby" && !prossimo(id) && H.players.length + H.prossimi.length < MAX_ON)
            H.prossimi.push({ id: id, nome: nomeJ, omino: avatarValido(m.omino) });
          else if (p0 && p0.via) { p0.via = false; controlla(); }   // è tornato (stesso id): riprende a giocare coi suoi punti
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          if (p0 && H.balle[id] && H.d && H.fase !== "lobby") privato(id, { t: "priv", k: "mia", testo: H.balle[id], dom: H.d.domanda });   // e la sua balla
          return;
        }
        if (m.t === "balla") balla(id, m.testo);
        else if (m.t === "cat") sceltaCat(id, m.k);
        else if (m.t === "voto") voto(id, m.k);
        else if (m.t === "ride") ride(id, m.k);
        else if (m.t === "avanti") avanti(id);
      },
      // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
      onErrore: function () { if (!H.pronta) { ferma(); clearTimeout(tAttesi); t.ricorda(null); errore(t, "Non riesco ad aprire la stanza. Controlla la connessione e riprova."); } }
    }, { ripresa: ripresa });   // (gli amici non tornano in saletta: la partita riprende)
    if (!rete) return senzaRete(t);
    if (ripresa && rete.codice) H.codice = rete.codice;
    // la "foto" per tutti: SEMPRE con gli id; le balle, la verità e i voti solo quando si scoprono
    function vm() {
      var f = H.fase, o = { fase: f, codice: H.codice, pronta: H.pronta, giro: H.giro, giri: H.giri, rif: H.rif, classifica: H.classifica, sessione: H.sessione,
        ride: H.ride, modoAmici: H.modoAmici, sceglie: H.sceglie,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino || null, punti: p.punti, via: !!p.via }; }),
        fatti: Object.keys(H.fatti), guarda: H.guarda.slice() };
      if (H.prossimi.length) o.prossimi = H.prossimi.map(function (x) { return x.id; });   // chi gioca dal round dopo
      if (H.d && f !== "lobby") { o.domanda = H.d.domanda; if (H.d.amici) { o.amici = true; o.prot = H.d.prot; } if (H.d.doppia) o.doppia = true; if (H.d.cat) o.catN = H.d.cat; }
      if (f === "categoria" && H.cat) o.cat = { chi: H.cat.chi, opz: H.cat.opz, k: H.cat.k, perche: H.cat.perche };
      if (f === "notizia" && H.saltato) o.saltato = H.saltato;
      if (f === "scrittura" || f === "voto" || f === "punti" || f === "categoria") o.rimMs = Math.max(0, H.scadenza - Date.now());
      if (f === "risposte" || f === "voto") o.scelte = H.scelte.map(function (sc) { return { testo: sc.testo }; });
      if ((f === "voti" || f === "rivela" || f === "oro" || f === "punti" || f === "fine") && H.scelte.length) {
        o.vera = H.d.rispostaVera; o.scelte = H.scelte; o.ordine = H.ordine; o.ignorate = H.ignorate; o.passo = H.passo;
        o.voti = H.players.map(function (p) { return H.voti[p.id] != null ? H.voti[p.id] : null; });
        o.risate = H.scelte.map(function (_, k) { return (H.risate[k] || []).slice(); });
      }
      if (f === "oro" || f === "punti" || f === "fine") o.oro = H.oro;
      if (f === "punti") { o.avanti = H.avanti.slice(); o.servono = servono(); }
      if (f === "punti" || f === "fine") o.ultimo = H.ultimo;
      return o;
    }
    // un messaggio per un telefono solo: inviaVeloce con "to" (così non resta in stanza)
    function privato(id, m) { if (id === IO) return privatoB(m); m.to = id; rete.inviaVeloce(m); }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); ricorda(); disegnaVM(t, v, cbHost); vici(); }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda (non gioca: non ha niente da perdere)
    var viciK = "";
    function vici() { var k = H.guarda.join(","); if (k !== viciK && t.vici) { viciK = k; t.vici(H.guarda.length ? H.guarda.slice() : null); } }
    // la partita com'è adesso, per riprenderla se ricarico la pagina (tutto H tranne il timer; in saletta niente).
    // Le balle e i voti segreti restano qui (e nella copia per il vice), mai nella foto
    function ricorda() {
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {}; Object.keys(H).forEach(function (k) { if (k !== "to") s[k] = H[k]; });
      t.ricorda(s);
    }
    // la ripresa: scrittura e voto si rifanno col tempo intero (le balle e i voti già dati restano), la rivelazione va
    // ai punti del round e poi alla notizia dopo. Il giro cambia chiave (rif), così ogni telefono riapre il suo foglio
    function riprendi() {
      var f = H.fase;
      tAttesi = setTimeout(function () { Object.keys(attesi).forEach(addio); }, 10000);
      if (f === "fine") return bd();
      if (f === "categoria" && H.cat) {   // «🎯 Sceglie chi è ultimo»: già scelto si va alla notizia, se no il tempo riparte (stesso argomenti, stessa persona)
        H.rif++;
        if (H.cat.k != null) return dopoCategoria();
        H.scadenza = Date.now() + TEMPO_CAT + ANTICIPO; bd(); return dopo(TEMPO_CAT + ANTICIPO + GRAZIA, aCaso);
      }
      if (f === "apertura" || !H.d) return nuovoRound();
      if (f === "notizia" || f === "scrittura") { H.rif++; H.saltato = null; H.fase = "notizia"; bd(); return dopo(DURATA_NOTIZIA, scrittura); }
      if (f === "risposte" || f === "voto") {   // le risposte di nuovo sul tabellone, poi si vota (chi aveva votato ha già fatto)
        H.rif++; H.fatti = {}; Object.keys(H.voti).forEach(function (id) { H.fatti[id] = 1; });
        H.fase = "risposte"; bd(); return dopo(durataRisposte(H.scelte.length), votazione);
      }
      if (f === "voti") return fineVoto();   // i voti di nuovo sul tabellone, poi la rivelazione
      if (f === "rivela") { bd(); return dopo(5000, dopoRivela); }   // (la Balla d'oro, se c'è, poi i punti)
      if (f === "oro") { bd(); return dopo(DURATA_ORO, punti); }
      if (f === "punti") {   // la classifica del round: il tempo che restava (almeno 5 secondi)
        var resta = Math.max(5000, (t.ripresa.ora(H.scadenza) || 0) - Date.now());
        H.avanti = []; H.scadenza = Date.now() + resta; bd(); return dopo(resta, prossimo);
      }
      nuovoRound();
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN_ON) return;
      H.piano = pianoRound(H.giri, H.modoAmici);
      var nA = H.piano.filter(function (x) { return x === "a"; }).length, nN = H.piano.filter(function (x) { return x === "n"; }).length;
      // (con «🎯 Sceglie chi è ultimo» la notizia si prende quando si sa l'argomento)
      H.notizie = H.sceglie ? [] : scegliDomande(nN); H.amiciQ = scegliAmici(nA);
      if (!notizieDi().length && !H.amiciQ.length) return;
      H.players.forEach(function (p) { p.nScelte = 0; }); H.cat = null;
      H.giro = 0; H.classifica = null; H.giaProt = []; H.rif = 0;
      H.sessione = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      H.players.forEach(function (p) { p.punti = 0; p.tot = nuoviTot(); });
      H.fase = "apertura"; bd();   // la sigla dello studio, uguale su tutti i telefoni
      dopo(ST.durataApertura(H.players.length), nuovoRound);
    }
    // la domanda del round: una notizia, oppure («Parliamo di te») una domanda su un amico che non è ancora stato protagonista
    function domandaDelRound() {
      if (H.piano[H.giro] === "a" && H.amiciQ.length && presenti().length >= MIN_ON) {
        var cand = presenti().filter(function (p) { return H.giaProt.indexOf(p.id) < 0; });
        if (!cand.length) { H.giaProt = []; cand = presenti(); }
        var p = cand[Math.floor(Math.random() * cand.length)], tpl = H.amiciQ.shift();
        H.giaProt.push(p.id);
        return { domanda: riempi(tpl.domanda, p.nome), rispostaVera: "", balleCasa: tpl.balleCasa || [], amici: true, prot: p.id };
      }
      if (H.piano[H.giro] === "f") { var fin = scegliFinale(); if (fin) return fin; }   // 🔥 la Balla Finale
      return H.notizie.shift() || scegliDomande(1)[0];
    }
    function pulisciRound() { H.balle = {}; H.fatti = {}; H.voti = {}; H.scelte = []; H.ordine = []; H.ignorate = []; H.passo = 0; H.ultimo = {}; H.risate = {}; H.oro = null; H.avanti = []; }
    function nuovoRound() {
      entrano();   // chi è arrivato durante il round di prima gioca da questo
      if (t.aCheSiamo) t.aCheSiamo("Round " + (H.giro + 1) + " di " + H.giri);   // (nella Sala, per chi è fuori)
      H.saltato = null; pulisciRound(); H.cat = null;
      if (H.piano[H.giro] === "n" && H.sceglie && presenti().length >= 2 && treCategorie().length) return categoria();
      H.d = domandaDelRound();
      H.fase = "notizia"; bd();
      dopo(DURATA_NOTIZIA, scrittura);
    }
    // «🎯 Sceglie chi è ultimo»: chi ha meno punti sceglie l'argomento tra tre (TEMPO_CAT, poi a caso); poi la notizia
    function categoria() {
      var ch = chiSceglie(presenti());
      ch.g.nScelte = (ch.g.nScelte || 0) + 1;
      H.d = null; H.cat = { chi: ch.g.id, opz: treCategorie(), k: null, perche: ch.perche };
      H.fase = "categoria"; H.scadenza = Date.now() + TEMPO_CAT + ANTICIPO; bd();
      dopo(TEMPO_CAT + ANTICIPO + GRAZIA, aCaso);
    }
    function aCaso() { if (H.fase === "categoria" && H.cat && H.cat.k == null) sceltaCat(null, Math.floor(Math.random() * H.cat.opz.length)); }
    function sceltaCat(id, k) {
      k = Number(k);
      if (H.fase !== "categoria" || !H.cat || H.cat.k != null || !(k >= 0 && k < H.cat.opz.length)) return;
      if (id != null && id !== H.cat.chi) return;   // sceglie solo lui (null = il tempo è finito: a caso)
      H.cat.k = k; bd();
      dopo(DURATA_SCELTA, dopoCategoria);
    }
    function dopoCategoria() {
      H.d = notiziaDi(H.cat.opz[H.cat.k]) || domandaDelRound();
      H.fase = "notizia"; bd();
      dopo(DURATA_NOTIZIA, scrittura);
    }
    // il protagonista non ha scritto la sua verità (tempo finito o uscito): si passa a una notizia, stesso round
    function siPassaAUnaNotizia() {
      var p = pById(H.d.prot); H.saltato = p ? p.nome : "Il protagonista";
      H.d = H.notizie.shift() || scegliDomande(1)[0]; H.rif++; pulisciRound();
      H.fase = "notizia"; bd();
      dopo(DURATA_NOTIZIA + 2600, scrittura);
    }
    function scrittura() {
      var ms = H.d && H.d.doppia ? TEMPO_SCRIVI_FINALE : TEMPO_SCRIVI;
      H.fase = "scrittura"; H.scadenza = Date.now() + ms + ANTICIPO; bd(); dopo(ms + ANTICIPO + GRAZIA, fineScrittura);
    }
    function balla(id, testo) {
      var p = pById(id); if (H.fase !== "scrittura" || !p || p.via || H.fatti[id]) return;
      var doppia = !!H.d.doppia, v = pulisciR(testo, doppia); if (!v) return;
      if (H.d.amici && id === H.d.prot) {   // «Parliamo di te»: questa è la verità
        H.d.rispostaVera = v; H.fatti[id] = 1;
        // chi aveva già scritto proprio la verità ne deve inventare un'altra
        Object.keys(H.balle).forEach(function (o) { if (eLaVerita(H.balle[o], v)) { delete H.balle[o]; delete H.fatti[o]; privato(o, { t: "priv", k: "vera" }); } });
        controlla(); bd(); return;
      }
      if (H.d.rispostaVera && eLaVeritaR(v, H.d.rispostaVera, doppia)) return privato(id, { t: "priv", k: "vera" });   // ha scritto la verità: ne deve inventare un'altra
      H.balle[id] = v; H.fatti[id] = 1; controlla(); bd();
      privato(id, { t: "priv", k: "mia", testo: v, dom: H.d.domanda });   // conferma: questa è la tua balla
    }
    function fineScrittura() {
      ferma();
      if (H.d.amici && !H.d.rispostaVera) return siPassaAUnaNotizia();
      var vera = H.d.rispostaVera;
      H.scelte = preparaScelte(vera, H.players.map(function (p) { var b = H.balle[p.id] || ""; return b && !eLaVeritaR(b, vera, H.d.doppia) ? b : ""; }), H.d.balleCasa, H.d.doppia);   // gli autori sono i posti dei giocatori
      H.fatti = {}; H.fase = "risposte"; bd();
      dopo(durataRisposte(H.scelte.length), votazione);
    }
    function votazione() { H.fase = "voto"; H.scadenza = Date.now() + TEMPO_VOTA + ANTICIPO; bd(); dopo(TEMPO_VOTA + ANTICIPO + GRAZIA, fineVoto); }
    function voto(id, k) {
      var i = iDi(id), p = H.players[i]; k = Number(k);
      if (H.fase !== "voto" || !p || p.via || H.voti[id] != null || !(k >= 0 && k < H.scelte.length)) return;
      if (H.d.amici && id === H.d.prot) return;   // il protagonista non vota
      if (H.scelte[k].autori.indexOf(i) >= 0) return privato(id, { t: "priv", k: "tua" });   // la propria balla non si vota
      H.voti[id] = k; H.fatti[id] = 1; controlla(); bd();
    }
    function fineVoto() {
      ferma();
      var conta = H.scelte.map(function () { return 0; }), nv = 0;
      H.players.forEach(function (p) { var v = H.voti[p.id]; if (v != null) { conta[v]++; nv++; } });
      var ks = H.scelte.map(function (_, k) { return k; });
      H.ordine = ks.filter(function (k) { return !H.scelte[k].vera && conta[k] > 0; }).sort(function (a, b) { return conta[a] - conta[b]; });
      H.ignorate = ks.filter(function (k) { return !H.scelte[k].vera && conta[k] === 0; });
      H.fatti = {}; H.fase = "voti"; H.passo = 0; bd();
      dopo(durataVoti(nv), function () { H.fase = "rivela"; H.passo = 0; bd(); prossimoPasso(conta); });
    }
    // la rivelazione: un passo alla volta (prima le balle votate, poi la verità, poi quelle che non ha votato nessuno)
    // con «Che balla!» accesa i passi delle balle durano un po' di più: c'è il tempo di toccare 😂
    function prossimoPasso(conta) {
      var nL = H.ordine.length, kVera = H.scelte.map(function (sc) { return sc.vera; }).indexOf(true);
      var dur = H.passo < nL ? durataPasso(conta[H.ordine[H.passo]], false) + (H.ride ? RIDE_IN_PIU : 0)
        : H.passo === nL ? durataPasso(conta[kVera], true) : (H.ride ? DURATA_IGNORATE_RIDE : 4600);
      dopo(dur, function () {
        H.passo++;
        if (H.passo > nL + (H.ignorate.length ? 1 : 0)) return dopoRivela();
        bd(); prossimoPasso(conta);
      });
    }
    // i 😂 di «Che balla!»: uno a testa per balla (anche chi guarda nella Sala), mai sulla propria
    function ride(id, k) {
      k = Number(k);
      if (!H.ride || H.fase !== "rivela" || !(k >= 0 && k < H.scelte.length) || H.scelte[k].vera) return;
      var i = iDi(id), p = H.players[i];
      if (p ? p.via : H.guarda.indexOf(id) < 0 && !prossimo(id)) return;   // (chi aspetta il round dopo ride anche lui)
      if (i >= 0 && H.scelte[k].autori.indexOf(i) >= 0) return;
      var l = H.risate[k] || (H.risate[k] = []); if (l.indexOf(id) >= 0) return;
      l.push(id); bd();
    }
    function contaRisate() { return H.scelte.map(function (_, k) { return (H.risate[k] || []).length; }); }
    // finita la rivelazione: la Balla d'oro del round (se qualcuno ha riso), poi i punti
    function dopoRivela() {
      H.oro = H.ride ? calcolaOro(H.scelte, contaRisate()) : null;
      if (!H.oro) return punti();
      H.fase = "oro"; bd();
      dopo(DURATA_ORO, punti);
    }
    function punti() {
      ferma();
      var esito = calcola(H.scelte, H.players.map(function (p) { return H.voti[p.id] != null ? H.voti[p.id] : null; }), H.players.length,
        moltiplica(H.giro, H.giri, H.d.doppia), votanti().length, H.d.amici ? iDi(H.d.prot) : null, H.ride ? contaRisate() : null);
      H.ultimo = {};
      H.players.forEach(function (p, i) { if (p.via) return; var d = puntiDi(esito[i]); p.punti += d; H.ultimo[p.id] = d; sommaTot(p.tot || (p.tot = nuoviTot()), esito[i]); });
      if (H.giro + 1 >= H.giri) return fine();
      // la classifica del round: si va avanti col conto alla rovescia, o subito se più di metà tocca «⏩ Avanti»
      var dur = durataPunti(H.players.length);
      H.avanti = []; H.fase = "punti"; H.scadenza = Date.now() + dur; bd();
      dopo(dur, prossimo);
    }
    function servono() { return Math.floor(presenti().length / 2) + 1; }
    function avanti(id) {
      var p = pById(id); if (H.fase !== "punti" || !p || p.via || H.avanti.indexOf(id) >= 0) return;
      H.avanti.push(id);
      if (H.avanti.length >= servono()) return prossimo();
      bd();
    }
    function prossimo() { if (H.fase !== "punti") return; ferma(); H.giro++; nuovoRound(); }
    // chi ha finito di scrivere / di votare: quando ci sono tutti si va avanti senza aspettare il tempo
    function controlla() {
      if (H.fase === "lobby" || H.fase === "fine") return;
      if (presenti().length < 2) return fine();   // è rimasto uno solo: finisce qui
      var tutti = function (lista) { return lista.every(function (p) { return H.fatti[p.id]; }); };
      if (H.fase === "scrittura") {
        var protVia = H.d && H.d.amici && !H.d.rispostaVera && (pById(H.d.prot) || {}).via;
        if (protVia || tutti(presenti())) dopo(1200, fineScrittura);
      }
      if (H.fase === "voto" && tutti(votanti())) dopo(1200, fineVoto);
      if (H.fase === "categoria" && H.cat && H.cat.k == null && (pById(H.cat.chi) || { via: true }).via) aCaso();   // chi sceglie è uscito: a caso
      if (H.fase === "punti" && H.avanti.length >= servono()) prossimo();
    }
    function fine() {
      ferma();
      // chi è uscito resta in classifica, ma in fondo (dopo tutti quelli rimasti): vince sempre il primo della classifica
      var perPunti = function (a, b) { return b.punti - a.punti; };
      var dentro = presenti().sort(perPunti), fuori = H.players.filter(function (p) { return p.via; }).sort(perPunti);
      var riga = function (gruppo, base) { return function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, tot: p.tot || nuoviTot(),
        pos: base + 1 + gruppo.filter(function (q) { return q.punti > p.punti; }).length }; }; };
      H.classifica = dentro.map(riga(dentro, 0)).concat(fuori.map(riga(fuori, dentro.length)));
      H.fase = "fine"; bd();
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici (anche chi era uscito ed è tornato), tutti tornano nella saletta
    function nuova() { ferma(); H.fase = "lobby"; H.classifica = null; H.d = null; H.players = presenti(); entrano();   // (e chi aspettava)
      // chi tiene la partita è il primo (in saletta ha la corona); se l'ha presa guardando (host di riserva), si siede
      if (!pById(IO)) { H.guarda = H.guarda.filter(function (x) { return x !== IO; }); H.players.push({ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0 }); }
      H.players.sort(function (a, b) { return (b.id === IO) - (a.id === IO); }); H.players.forEach(function (p) { p.punti = 0; p.tot = nuoviTot(); }); bd(); }

    var cbHost = { sonoHost: true, myId: IO, onComincia: comincia, onNuova: nuova, onProssimo: prossimo,
      onBalla: function (testo) { balla(IO, testo); }, onVoto: function (k) { voto(IO, k); }, onCat: function (k) { sceltaCat(IO, k); },
      onRide: function (k) { ride(IO, k); }, onAvanti: function () { avanti(IO); },
      onEsci: function (giaChiesto) {   // (dallo studio la domanda "Uscire dalla partita?" l'ha già fatta lui)
        if (giaChiesto !== true && H.fase !== "lobby" && H.fase !== "fine") return t.conferma("Chiudere la partita per tutti?", null, "Esci", function () { cbHost.onEsci(true); });   // un tocco sbagliato non chiude il gioco a tutti
        ferma(); clearTimeout(tAttesi); t.ricorda(null); rete.chiudi(); t.esci();
      } };
    // la Rivincita dei tasti di fine comuni: tutti di nuovo nella saletta, stessi amici (il core fa il 3-2-1)
    t.onRivincita = function () { if (H.fase === "fine") nuova(); };
    if (ripresa) riprendi(); else bd();
  }

  // ---------------- OSPITE ----------------
  function ospiteB(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var G = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null,
      onBalla: function (testo) { if (G.rete) G.rete.invia({ t: "balla", testo: testo }); },
      onVoto: function (k) { if (G.rete) G.rete.invia({ t: "voto", k: k }); },
      onCat: function (k) { if (G.rete) G.rete.invia({ t: "cat", k: k }); },
      onRide: function (k) { if (G.rete) G.rete.invia({ t: "ride", k: k }); },
      onAvanti: function () { if (G.rete) G.rete.invia({ t: "avanti" }); },
      onEsci: function (giaChiesto) {
        if (giaChiesto !== true && G.vm && G.vm.fase !== "lobby" && G.vm.fase !== "fine") return t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(true); });
        if (G.rete) G.rete.chiudi(); t.esci();
      } };
    if (t.nomeProfilo()) { G.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ chiara: true, icona: "🤥", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        G.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      var s = t.schermata({ chiara: true, icona: "🤥", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
      G.rete = SGNet.entra(codice, {
        onAperto: function (id) { G.myId = id; cb.myId = id; G.rete.invia({ t: "join", nome: G.nome, omino: t.mioOmino(G.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== G.myId) return;   // era per un altro telefono
          if (m.t === "vm") { G.vm = m.vm; disegnaVM(t, m.vm, cb); }
          else if (m.t === "priv") privatoB(m);
        },
        // l'host ha chiuso la stanza apposta (se sparisce e non torna, "La stanza è chiusa" lo dice il core):
        // sulla classifica finale resta la classifica, con la scritta giusta
        onChiuso: function () {
          if (G.vm && G.vm.fase === "fine") { cb.chiusa = true; if (RB && RB.notaFine) { RB.notaFine.textContent = NOTA_CHIUSA; RB.notaFine.hidden = false; } return; }
          errore(t, "🚪 L'host ha chiuso la partita.");
        },
        // (solo se il primo collegamento non riesce)
        onErrore: function () { errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  // ---------------- OGNI TELEFONO: la saletta, poi lo studio con la sua regia ----------------
  var RB = null, NOTA_CHIUSA = "🚪 L'host ha chiuso la stanza.";
  function idxDi(vm, id) { for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return i; return -1; }
  // la mia balla del round (online): la tengo fuori dallo studio, così resta anche se la foto arriva dopo
  var MIA = null;   // { dom: la notizia, testo }
  // i messaggi solo per me: ho scritto la verità, ho votato la mia balla, o l'host mi dice qual è la mia balla
  function privatoB(m) {
    if (m.k === "mia") { MIA = { dom: m.dom, testo: String(m.testo || "") }; if (RB && RB.S._segnaMia) RB.S._segnaMia(); return; }
    if (m.k === "vera") MIA = null;   // la verità non era una balla buona: non è "la mia"
    if (!RB) return;
    if (m.k === "vera") RB.vera = true;
    if (m.k === "tua") RB.tua = true;
    regiaTick(RB);
  }
  function disegnaVM(t, vm, cb) {
    assicuraStile();
    if (vm.fase === "lobby") { RB = null; return lobbyB(t, vm, cb); }
    // lo studio si fa una volta per partita (e di nuovo se l'host ricomincia dopo la fine)
    // (e da capo se il tavolo è un altro: l'amico che prende il posto dell'host sparito, Passo 5, non usa lo studio di quando era ospite)
    var ids = vm.players.map(function (p) { return p.id; }).join("|");
    if (!RB || RB.t !== t || (!RB.S.vivo() && (vm.fase !== "fine" || !RB.fineFatta))) {
      RB = { t: t, cb: cb, usciti: {}, mie: {}, ids: ids };
      RB.S = ST.crea(t, vm.players, { io: idxDi(vm, cb.myId), esci: function () { cb.onEsci(true); }, titolo: "La Balla Colossale", logo: ["LA BALLA", "COLOSSALE"] });
      if (conTarga(t)) RB.S.vista.classList.add("st-con-targa");   // chi guarda soltanto: il posto della targhetta del core in basso
      vm.players.forEach(function (p, i) { ST.puntiLeggio(RB.S, i, p.punti, 0); });
    } else if (RB.ids !== ids && RB.S.vivo()) {   // è entrato chi aspettava il round dopo: rifaccio i leggii (i posti di prima restano gli stessi)
      RB.ids = ids; RB.usciti = {};
      RB.S.impostaGiocatori(vm.players, idxDi(vm, cb.myId));
      vm.players.forEach(function (p, i) { ST.puntiLeggio(RB.S, i, p.punti, 0); });
      if (RB.S.shot) ST.camera(RB.S, RB.S.shot(), 0);
    }
    RB.vm = vm; RB.cb = cb; RB.vmTs = Date.now();
    if (vm.fase !== "scrittura" && vm.fase !== "voto" && RB.S._chiudiVelo) RB.S._chiudiVelo();   // il tempo è finito per tutti: il foglio si chiude
    aggiornaRisate(RB); aggiornaAvanti(RB);   // (i 😂 degli altri e i tocchi di «⏩ Avanti»: solo i numeri, senza ridisegnare)
    regiaTick(RB);
  }
  // «😂 Che balla!»: i 😂 arrivati dagli altri telefoni sui tasti a vista (a ogni risata in più vola una faccina)
  function aggiornaRisate(R) {
    var vm = R.vm, btn = R.rideBtn; if (!btn || !vm.risate) return;
    Object.keys(btn).forEach(function (k) {
      var b = btn[k], l = vm.risate[k] || [], mia = l.indexOf(R.cb.myId) >= 0;
      if (!b.isConnected) return;
      segnaRide(b, l.length + (R.mie[R.kRide + "|" + k] && !mia ? 1 : 0), mia || !!R.mie[R.kRide + "|" + k]);
    });
  }
  function testoLobby(vm) {
    var am = vm.modoAmici === "solo" ? " Ogni round una domanda su uno di voi: lui scrive la verità, gli altri le balle."
      : vm.modoAmici === "no" ? "" : " Ogni tanto la domanda è su uno di voi (👥 Parliamo di te).";
    return "Si gioca con " + (vm.giri === 1 ? "1 round" : vm.giri + " round") + "." + am + (vm.sceglie === false ? "" : " 🎯 L'argomento lo sceglie chi è ultimo.")
      + (vm.modoAmici === "solo" ? "" : " 🔥 L'ultima notizia è la Balla Finale, coi punti tripli.") + (vm.ride === false ? "" : " 😂 Alle balle più divertenti va la Balla d'oro.");
  }
  function lobbyB(t, vm, cb) {
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN_ON,
      vuoti: Math.max(0, MIN_ON - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota bc-lobby", text: testoLobby(vm) + " Ognuno scrive e vota dal suo telefono, tutti insieme." })],
      // nella Sala: chi non è stato scelto guarda soltanto
      spettatore: !cb.sonoHost && (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta guardi" : null,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  async function regiaTick(R) {
    if (R.corre) { R.ancora = true; return; }
    R.corre = true;
    try {
      for (var giri = 0; giri < 40; giri++) {
        R.ancora = false;
        var fatto = await regiaPasso(R);
        if (!fatto && !R.ancora) break;
      }
    } catch (e) {} finally { R.corre = false; }
  }
  // lo stato del round come lo usano le schermate (uguali a quelle del telefono che passa)
  function statoDa(R, vm) {
    var ip = vm.amici ? idxDi(vm, vm.prot) : -1, io = idxDi(vm, R.cb.myId), kR = vm.giro + "." + (vm.rif || 0);
    var st = { S: R.S, t: R.t, g: vm.players, giro: vm.giro, giri: vm.giri,
      d: { domanda: vm.domanda || "", rispostaVera: vm.vera || "", amici: !!vm.amici, prot: ip, protNome: ip >= 0 ? vm.players[ip].nome : "", doppia: !!vm.doppia, cat: vm.catN || null },
      scelte: vm.scelte || [], voti: vm.voti || vm.players.map(function () { return null; }),
      fatti: vm.players.map(function (p) { return (vm.fatti || []).indexOf(p.id) >= 0; }),
      ride: vm.ride !== false, rideBtn: {}, kR: kR };
    // «😂 Che balla!» online: un 😂 a testa per balla (lo conta l'host), mai sulla propria
    var mieR = function (k) { return !!R.mie[kR + "|" + k] || ((vm.risate || [])[k] || []).indexOf(R.cb.myId) >= 0; };
    st.risate = st.scelte.map(function (_, k) { var l = (vm.risate || [])[k] || []; return l.length + (R.mie[kR + "|" + k] && l.indexOf(R.cb.myId) < 0 ? 1 : 0); });
    st.hoRiso = mieR;
    st.miaBalla = function (sc) { return io >= 0 && (sc.autori || []).indexOf(io) >= 0; };
    var me = vm.players[io], guardo = (vm.guarda || []).indexOf(R.cb.myId) >= 0 || (vm.prossimi || []).indexOf(R.cb.myId) >= 0;
    st.rideFn = !(me ? !me.via : guardo) ? null : function (k) {   // (chi è uscito non ride; chi guarda nella Sala e chi aspetta il round dopo sì)
      if (mieR(k) || R.vm.fase !== "rivela") return false;
      R.mie[kR + "|" + k] = 1; st.risate[k]++; R.cb.onRide(k); return true;
    };
    return st;
  }
  // un passo della regia: true se ha fatto un momento dello spettacolo (poi si guarda lo stato più recente)
  async function regiaPasso(R) {
    var vm = R.vm, S = R.S;
    if (!S.vivo()) return false;
    vm.players.forEach(function (p, i) {
      if (p.via && !R.usciti[p.id]) { R.usciti[p.id] = true; ST.fuori(S, i, true); ST.testoLeggio(S, i, "👋 uscito", true); }
      else if (!p.via && R.usciti[p.id]) { delete R.usciti[p.id]; ST.fuori(S, i, false); ST.puntiLeggio(S, i, p.punti, 0); }   // è tornato
    });
    // la chiave del round: il giro e, se il protagonista non ha scritto e si è passati a una notizia, quante volte è successo
    var st = statoDa(R, vm), kG = st.kR;
    if (vm.fase === "apertura") {
      if (R.aperturaFatta) return false;
      R.aperturaFatta = true; await ST.apertura(S); return true;
    }
    R.aperturaFatta = true;
    if (vm.fase === "categoria") {
      if (R.kCat !== kG) { R.kCat = kG; await categoriaOnline(R, st); return true; }
      aggiornaCat(R); return false;
    }
    if (vm.fase === "notizia") {
      if (R.kN === kG) return false;
      R.kN = kG; R.vera = false; R.tua = false;
      ST.viaBarra(S); ST.accendiSolo(S, -1); ST.tutteNormali(S);
      vm.players.forEach(function (p, i) { if (!p.via) ST.puntiLeggio(S, i, p.punti, 0); });
      if (vm.saltato) {   // «Parliamo di te» saltato: lo studio lo dice, poi la notizia
        ST.terzo(S, null, "😶 " + vm.saltato + " non ha scritto la risposta", "Si passa a una notizia!", "📰"); ST.pubblico(S, "ohh");
        await ST.dorme(2400); ST.viaTerzo(S);
      }
      await ST.suSchermo(S, 800);
      schermoTurno(st, null, "scrive"); R.boxFatti = st.boxFatti;
      ST.FX.rullo(1); await ST.dorme(1100); ST.pubblico(S, "piano");
      if (st.d.amici && R.vm.fase === "notizia") await annunciaAmici(S, st.d.prot, st.d.protNome);
      if (moltiplica(vm.giro, vm.giri) > 1 && R.vm.fase === "notizia") await annunciaDoppio(S, st.d.doppia);
      return true;
    }
    // (chi rientra mentre si scrive o si vota: la prima foto può dirlo ancora "uscito"; quando torna dentro gli si apre il foglio)
    var dentro = function () { var me = vm.players[idxDi(vm, R.cb.myId)]; return !!me && !me.via; };
    if (vm.fase === "scrittura") {
      if (R.kS !== kG || R.vera || (R.fuoriS === kG && dentro())) { R.kS = R.kN = kG; R.fuoriS = dentro() ? null : kG; await scriviOnline(R, st); return true; }
      aggiornaFatti(R, vm, "scrive"); aggiornaAttesa(R); return false;
    }
    if (vm.fase === "risposte") {
      if (R.kR === kG) return false;
      R.kR = R.kS = R.kN = kG; ST.viaBarra(S);
      await presentaRisposte(st); return true;
    }
    if (vm.fase === "voto") {
      if (R.kV !== kG || R.tua || (R.fuoriV === kG && dentro())) { R.kV = R.kR = R.kS = R.kN = kG; R.fuoriV = dentro() ? null : kG; await votaOnline(R, st); return true; }
      aggiornaFatti(R, vm, "vota"); aggiornaAttesa(R); return false;
    }
    if (vm.fase === "voti") {
      if (R.kVo === kG) return false;
      R.kVo = R.kV = kG; ST.viaBarra(S);
      await mostraVoti(st); return true;
    }
    if (vm.fase === "rivela") {
      var kP = kG + "|" + vm.passo;
      if (R.kP === kP) return false;
      R.kP = kP; R.kVo = kG; ST.viaBarra(S);
      R.rideBtn = st.rideBtn; R.kRide = kG;   // (i 😂 degli altri arrivano su questi tasti)
      var nL = (vm.ordine || []).length;
      if (vm.passo < nL) await mostraScelta(st, vm.ordine[vm.passo], true);
      else if (vm.passo === nL) await mostraScelta(st, st.scelte.map(function (sc) { return sc.vera; }).indexOf(true), true);
      else await schermoIgnorate(st, vm.ignorate || [], true);
      return true;
    }
    if (vm.fase === "oro") {
      if (R.kOro === kG) return false;
      R.kOro = R.kP = R.kVo = kG; R.rideBtn = null;
      await schermoOro(st, vm.oro, true); return true;
    }
    if (vm.fase === "punti" || vm.fase === "fine") {
      R.rideBtn = null;
      if (R.kPunti !== kG && vm.ultimo) { R.kPunti = kG; await puntiOnline(R, vm); return true; }
      if (vm.fase === "fine") {
        if (R.fineFatta) return false;
        R.fineFatta = true; await finaleOnline(R, vm); return true;
      }
      if (R.kClas !== kG) { R.kClas = kG; await classificaOnline(R, vm); return true; }
      return false;
    }
    return false;
  }
  // «🎯 Sceglie chi è ultimo» online: i tre argomenti sul maxischermo; li tocca solo chi sceglie, gli altri guardano
  async function categoriaOnline(R, st) {
    var S = R.S, el = R.t.el, vm = R.vm, c = vm.cat || {}, i = idxDi(vm, c.chi), io = idxDi(vm, R.cb.myId);
    var mio = c.chi === R.cb.myId && io >= 0 && !vm.players[io].via, k0 = st.kR;
    ST.viaBarra(S); ST.viaTerzo(S); ST.tutteNormali(S); ST.accendiSolo(S, i);
    vm.players.forEach(function (p, n) { if (!p.via) ST.puntiLeggio(S, n, p.punti, 0); });
    await ST.suSchermo(S, 800);
    if (!S.vivo() || R.vm.fase !== "categoria" || R.kCat !== k0) return;
    if (i >= 0) ST.faccia(S, i, "pensa");
    R.carteCat = schermoCategoria(st, i, c, mio ? function (k) { R.catMia = k0; R.cb.onCat(k); } : null, mio);
    R.catSegnata = null;
    var conto = el("p", { class: "bc-attesa" }), sec = Math.max(1, Math.round(((R.vm.rimMs || TEMPO_CAT) - (Date.now() - R.vmTs)) / 1000));
    ST.barra(S, [ conto, faccineB(R.t) ]);
    R.t.contoAvanti(conto, sec, null, "bc-cat|" + vm.sessione + "|" + k0, mio ? "Scegli entro " : "Si sceglie a caso tra ");
    aggiornaCat(R);
  }
  // l'argomento scelto (arriva con la foto dopo): si accende quella carta, le altre si spengono (solo quella parte cambia)
  function aggiornaCat(R) {
    var c = R.vm.cat, k0 = statoDa(R, R.vm).kR;
    if (!c || c.k == null || !R.carteCat || R.catSegnata === k0 || R.kCat !== k0) return;
    R.catSegnata = k0;
    segnaCategoria(R.carteCat, c.k); ST.viaBarra(R.S); tic(880);
    var i = idxDi(R.vm, c.chi); if (i >= 0) ST.faccia(R.S, i, "esulta");
  }
  function tempoRimasto(R) { return Math.max(3000, (R.vm.rimMs || 0) - (Date.now() - R.vmTs)); }   // il tempo che resta secondo l'host
  // tutti scrivono insieme: la telecamera va sul mio leggio e si apre il MIO foglio
  async function scriviOnline(R, st) {
    var S = R.S, el = R.t.el, cb = R.cb, vm = R.vm, io = idxDi(vm, cb.myId), me = vm.players[io];
    var riprova = R.vera; R.vera = false;
    schermoTurno(st, null, "scrive"); R.boxFatti = st.boxFatti; aggiornaFatti(R, vm, "scrive", true);
    if (io < 0 || !me || me.via || (!riprova && (vm.fatti || []).indexOf(cb.myId) >= 0)) { await ST.suSchermo(S, 800); attesaOnline(R, io < 0 || !me || me.via); return; }
    var vero = eProt(st, io);   // «Parliamo di te» e la domanda è su di me: scrivo la verità
    ST.accendiSolo(S, io); ST.testoLeggio(S, io, vero ? "🤫 la verità" : "✍️ scrive");
    if (!riprova) {
      if (vero) ST.terzo(S, io, "La domanda è su di te!", "Scrivi la verità: gli altri dovranno trovarla", "🤫");
      else ST.terzo(S, io, "Scrivete tutti la vostra balla!", st.d.amici ? "Su " + st.d.protNome + ": deve sembrare vera" : "Deve sembrare vera", "✍️");
      await ST.suLeggio(S, io, 700); ST.viaTerzo(S); ST.lampo(S);
    }
    if (riprova && ST.viaBarra) ST.viaBarra(S);
    var testo = await apriBiglietto(st, io, { ms: tempoRimasto(R), verita: false, vero: vero, avviso: riprova ? avvisoVera(st) : null });
    if (!S.vivo()) return;
    if (testo && R.vm.fase === "scrittura") { if (!vero) MIA = { dom: vm.domanda, testo: testo }; cb.onBalla(testo); }   // (l'host poi conferma, o dice "è la verità")
    ST.testoLeggio(S, io, testo ? "✅ fatto" : "😶 niente"); ST.faccia(S, io, testo ? "esulta" : "triste");
    await ST.suSchermo(S, 800);
    ST.faccia(S, io, null);
    if (R.vm.fase === "scrittura") ST.barra(S, [ el("p", { class: "bc-attesa", text: testo ? "Fatto! Aspettiamo gli altri…" : "⏰ Tempo scaduto: salti questa balla, ma puoi votare" }), faccineB(R.t) ]);
  }
  // chi non scrive/vota adesso (guarda, oppure ha già finito): una riga e le faccine, mentre gli altri finiscono
  function attesaOnline(R, guardo) {
    var S = R.S, el = R.t.el, f = R.vm.fase;
    if (!S.vivo() || (f !== "scrittura" && f !== "voto")) return;
    ST.barra(S, [ el("p", { class: "bc-attesa", text: !guardo ? "Fatto! Aspettiamo gli altri…" : testoGuardo(R) }), faccineB(R.t) ]);
  }
  // chi guarda: se intanto l'host l'ha messo tra chi gioca dal round dopo, la riga lo dice (cambia solo la scritta)
  // (12 nov 2026: senza la telecamera la riga si scrive prima che arrivi la foto con «prossimi»)
  function aggiornaAttesa(R) {
    var me = R.vm.players[idxDi(R.vm, R.cb.myId)]; if (me && !me.via) return;
    var p = R.S.barraEl.querySelector(".bc-attesa"), tx = testoGuardo(R);
    if (p && /^(👀|✋)/.test(p.textContent) && p.textContent !== tx) p.textContent = tx;
  }
  // la riga di chi non gioca questo round: aspetta il round dopo, guarda nella Sala, o guarda soltanto
  function testoGuardo(R) {
    var vm = R.vm, id = R.cb.myId;
    if ((vm.prossimi || []).indexOf(id) >= 0) return "✋ Giochi dal prossimo round: intanto guarda!";
    if ((vm.guarda || []).indexOf(id) >= 0) return "👀 Questa volta guardi: gioca chi è stato scelto.";
    return "👀 Stai guardando: alla prossima partita giochi anche tu.";
  }
  // chi guarda soltanto (col link "guarda", fuori dal torneo a eliminazione): le faccine e l'uscita le dà la targhetta del core
  function conTarga(t) { return !!(t && t.guarda && !t.eliminazione); }
  function faccineB(t) { return conTarga(t) || !t.faccine ? null : t.faccine(); }
  // tutti votano insieme, ognuno dal suo telefono; il tabellone resta sul maxischermo
  async function votaOnline(R, st) {
    var S = R.S, el = R.t.el, cb = R.cb, vm = R.vm, io = idxDi(vm, cb.myId), me = vm.players[io];
    var riprova = R.tua; R.tua = false;
    schermoTurno(st, null, "vota"); R.boxFatti = st.boxFatti; aggiornaFatti(R, vm, "vota", true);
    if (io < 0 || !me || me.via || (!riprova && (vm.fatti || []).indexOf(cb.myId) >= 0)) { await ST.suSchermo(S, 800); attesaOnline(R, io < 0 || !me || me.via); return; }
    if (eProt(st, io)) {   // «Parliamo di te» e la domanda è su di me: la verità la so, non voto
      ST.testoLeggio(S, io, "🤫 la sa"); await ST.suSchermo(S, 800);
      if (R.vm.fase === "voto") ST.barra(S, [ el("p", { class: "bc-attesa", text: "🤫 La domanda è su di te: non voti. Guarda chi ci casca!" }), faccineB(R.t) ]);
      return;
    }
    ST.accendiSolo(S, io); ST.testoLeggio(S, io, "🗳️ vota");
    if (!riprova) { ST.terzo(S, io, "Tutti al voto!", "Qual è la risposta vera?", "🗳️"); await ST.suLeggio(S, io, 700); ST.viaTerzo(S); ST.lampo(S); }
    var mia = function (sc) { return !!MIA && MIA.dom === R.vm.domanda && norm(sc.testo) === norm(MIA.testo); };
    var k = await apriVoto(st, io, { ms: tempoRimasto(R), mia: mia, avviso: riprova ? "✍️ Quella è la tua balla! Vota un'altra risposta." : null });
    if (!S.vivo()) return;
    if (k != null && R.vm.fase === "voto") cb.onVoto(k);
    ST.testoLeggio(S, io, k != null ? "✅ votato" : "😶 niente"); ST.faccia(S, io, "pensa");
    await ST.suSchermo(S, 800);
    ST.faccia(S, io, null);
    if (R.vm.fase === "voto") ST.barra(S, [ el("p", { class: "bc-attesa", text: k != null ? "Votato! Aspettiamo gli altri…" : "Aspettiamo gli altri…" }), faccineB(R.t) ]);
  }
  // chi ha già finito: le spunte sotto il maxischermo e sui leggii (si rifanno solo se cambia qualcosa)
  function aggiornaFatti(R, vm, cosa, forza) {
    var S = R.S, el = R.t.el, fatti = vm.fatti || [], k = cosa + "|" + fatti.join("|");
    if (!forza && R.kFatti === k) return;
    R.kFatti = k;
    var prot = vm.amici ? vm.prot : null;   // «Parliamo di te»: il protagonista scrive la verità e non vota
    if (R.boxFatti) {
      ST.vuota(R.boxFatti);
      vm.players.forEach(function (p) { if (p.via || (cosa === "vota" && p.id === prot)) return; var ok = fatti.indexOf(p.id) >= 0;
        R.boxFatti.appendChild(el("span", { class: ok ? "ok" : "" }, [ fac(el, p), el("span", { text: (ok ? "✅ " : "") + (p.id === R.cb.myId ? "Tu" : p.nome) }) ])); });
    }
    vm.players.forEach(function (p, i) {
      if (p.via) return; var ok = fatti.indexOf(p.id) >= 0;
      if (p.id === prot) return ST.testoLeggio(S, i, cosa === "vota" ? "🤫 la sa" : ok ? "✅ fatto" : "🤫 la verità");
      ST.testoLeggio(S, i, ok ? (cosa === "vota" ? "✅ votato" : "✅ fatto") : (cosa === "vota" ? "🗳️ vota" : "✍️ scrive"));
    });
  }
  // i punti del round scorrono sui leggii
  async function puntiOnline(R, vm) {
    var S = R.S, tot = vm.ultimo || {};
    ST.viaBarra(S); ST.accendiSolo(S, -1); ST.viaTerzo(S);
    await ST.largo(S, 900);
    ST.terzo(S, null, "Fine del round " + (vm.giro + 1), "Ecco i punti!", "🏁");
    for (var i = 0; i < vm.players.length; i++) {
      var p = vm.players[i]; if (p.via) continue;
      var d = tot[p.id] || 0;
      ST.puntiLeggio(S, i, p.punti, d);
      ST.faccia(S, i, d > 0 ? "esulta" : "triste");
      await ST.dorme(320);
    }
    ST.pubblico(S, "applauso");
    await ST.dorme(1700); ST.viaTerzo(S); ST.tutteNormali(S);
  }
  function ordineB(vm) { return vm.players.filter(function (p) { return !p.via; }).sort(function (x, y) { return y.punti - x.punti; }); }
  async function classificaOnline(R, vm) {
    var S = R.S, el = R.t.el, cb = R.cb, tot = vm.ultimo || {};
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "bc-clas" + ((vm.players || []).length > 4 ? " tanti" : "") }, [ el("h2", { text: "🏁 Classifica dopo " + (vm.giro + 1) + " round" }) ]);
    var lista = ordineB(vm);
    lista.forEach(function (p, k) {
      var pos = 1 + lista.filter(function (q) { return q.punti > p.punti; }).length;   // a pari punti, stessa medaglia
      var r = el("div", { class: "bc-cl" + (pos === 1 ? " primo" : "") }, [
        el("span", { class: "pos", text: medaglia(pos) }), fac(el, p), el("span", { class: "nm", text: p.nome + (p.id === cb.myId ? " (tu)" : "") }),
        el("span", { class: "pt", text: String(p.punti) }), el("span", { class: "pi", text: "+" + (tot[p.id] || 0) })
      ]);
      r.style.animationDelay = (k * 0.1) + "s";
      box.appendChild(r);
    });
    S.sch.appendChild(box);
    // "Si va avanti tra 12…" per tutti (il tempo lo tiene l'host); «⏩ Avanti» a chi gioca: si parte subito se lo tocca più di metà
    var sec = Math.max(1, Math.round(((R.vm.rimMs || 12000) - (Date.now() - R.vmTs)) / 1000)), k = "bc-notizia|" + vm.sessione + "|" + vm.giro;
    var conto = el("p", { class: "bc-attesa" }), me = vm.players[idxDi(vm, cb.myId)], bAv = null;
    if (me && !me.via) {
      bAv = el("button", { class: "btn btn-primario bc-avanti", type: "button", onclick: function () {
        if (bAv.disabled) return; R.avantiMio = k; bAv.disabled = true; aggiornaAvanti(R);
        try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
        cb.onAvanti();
      } }, [ el("span", { class: "tx", text: "⏩ Avanti" }), el("span", { class: "quanti" }) ]);
    }
    R.bAvanti = bAv; R.kAvanti = k;
    var tocca = !bAv && (vm.prossimi || []).indexOf(cb.myId) >= 0 ? el("p", { class: "bc-attesa", text: "✋ Al prossimo round giochi anche tu!" }) : null;
    ST.barra(S, [ conto, bAv || tocca, faccineB(R.t) ]);
    R.t.contoAvanti(conto, sec, null, k);
    aggiornaAvanti(R);
  }
  // «⏩ Avanti» sulla classifica del round: quanti l'hanno toccato (servono più di metà); il mio tocco resta segnato
  function aggiornaAvanti(R) {
    var b = R.bAvanti, vm = R.vm; if (!b || !b.isConnected || vm.fase !== "punti") return;
    var l = vm.avanti || [], mio = l.indexOf(R.cb.myId) >= 0 || R.avantiMio === R.kAvanti, n = l.length + (mio && l.indexOf(R.cb.myId) < 0 ? 1 : 0);
    var q = b.querySelector(".quanti"), tx = n + " su " + (vm.servono || 1);
    if (q.textContent !== tx) q.textContent = tx;
    var t0 = mio ? "✅ Avanti" : "⏩ Avanti", s = b.querySelector(".tx");
    if (s.textContent !== t0) s.textContent = t0;
    b.disabled = mio;
  }
  async function finaleOnline(R, vm) {
    var S = R.S, t = R.t, el = t.el, cb = R.cb, clas = vm.classifica || [];
    // vince il primo della classifica (chi è uscito sta in fondo); a pari punti vincono in tanti
    var gen = clas.map(function (r) { var p = vm.players[idxDi(vm, r.id)] || {}; return { id: r.id, nome: r.nome, omino: p.omino || null, punti: r.punti, via: r.via, tot: r.tot }; });
    salvaContatori(clas, cb.myId, true, vm.sessione);
    await schermoPremi(S, el, gen, true);
    if (!S.vivo()) return;
    var primi = clas.filter(function (r) { return r.pos === 1; });
    if (primi.length === 1) await ST.finale(S, idxDi(vm, primi[0].id), primi[0].punti + " punti");
    else await granFinale(S, vm.players, primi.map(function (r) { return vm.players[idxDi(vm, r.id)] || r; }));
    var titolo = !primi.length ? "Fine partita" : primi.length === 1 ? "Vince " + primi[0].nome + "!" : "Pareggio!";
    var s = t.schermata({ chiara: true, icona: "🏆", titolo: titolo, sotto: "La Balla Colossale" });
    var box = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    clas.forEach(function (r) {
      var p = vm.players[idxDi(vm, r.id)] || r;
      box.appendChild(el("div", { class: "bc-cl" + (r.pos === 1 ? " primo" : "") }, [
        el("span", { class: "pos", text: medaglia(r.pos) }), fac(el, p), el("span", { class: "nm", text: r.nome + (r.id === cb.myId ? " (tu)" : "") + (r.via ? " (uscito)" : "") }),
        el("span", { class: "pt", text: r.punti + (r.punti === 1 ? " punto" : " punti") }) ]));
    });
    s._contenuto.appendChild(box);
    // i tasti di fine comuni (all'host e a chi ha giocato), se li disegna il core: allora niente tasti nostri né "Aspetta l'host"
    // (la nota resta nascosta: serve solo se l'host chiude la stanza)
    // (chi guarda soltanto: i tasti di fine del core se ci sono, se no la targhetta "👀 Guardi · ✕" basta: niente Esci nostro)
    var haGiocato = cb.sonoHost || idxDi(vm, cb.myId) >= 0, targa = conTarga(t);
    var comuni = (haGiocato || targa) && t.tastiFine(s._piede, cb.sonoHost ? { host: true, nuova: cb.onNuova, esci: cb.onEsci } : { host: false, esci: cb.onEsci });
    if (targa) s.classList.add("bc-con-targa");
    if (cb.sonoHost) { if (!comuni) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova })); }
    else {
      var guardo = !haGiocato && (vm.guarda || []).indexOf(cb.myId) >= 0, aspetto = !haGiocato && (vm.prossimi || []).indexOf(cb.myId) >= 0;
      s._contenuto.appendChild(R.notaFine = el("p", { class: "modulo-nota", style: "text-align:center", text: cb.chiusa ? NOTA_CHIUSA
        : comuni ? "" : guardo ? "👀 Questa volta hai guardato." : aspetto ? "✋ Sei dentro: alla prossima partita giochi anche tu!"
        : targa ? "👀 Hai guardato: se l'host fa un'altra partita, entri anche tu." : "⏳ Aspetta l'host: se fa un'altra partita, torni da solo nella saletta." }));
      if (!R.notaFine.textContent) R.notaFine.hidden = true;
    }
    var fa = faccineB(t);   // le faccine mentre si guarda la classifica
    if (fa) { fa.style.marginTop = "10px"; s._contenuto.appendChild(fa); }
    if (!comuni && !targa) s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(s);
  }

  // =========================================================
  //  LO STILE (prefisso bc-)
  // =========================================================
  function assicuraStile() {
    if (document.getElementById("sg-balla-css")) return;
    var s = document.createElement("style"); s.id = "sg-balla-css";
    s.textContent = [
      "@font-face{font-family:'BC Titolo';font-style:normal;font-weight:900;font-display:swap;src:url(data:font/woff2;base64," + FONT_TITOLO + ") format('woff2')}",
      ".bc-sch .fac,.bc-chi .fac,.bc-cl .fac{border-radius:50%;overflow:hidden;background:rgba(255,255,255,.12);flex:0 0 auto}",
      ".bc-sch .fac svg,.bc-chi .fac svg,.bc-cl .fac svg{width:100%;height:100%;display:block}",
      // il maxischermo
      ".bc-sch{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:0 4px}",
      ".bc-chi-sch{font-size:22px;font-weight:900;color:#fff}",
      ".bc-giro{font-size:14px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--o-oro-testo)}",
      ".bc-fatti{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:96%}",
      ".bc-fatti>span{display:flex;align-items:center;gap:6px;font-size:16px;font-weight:800;background:rgba(255,255,255,.1);border-radius:99px;padding:3px 11px 3px 3px}",
      ".bc-fatti>span.ok{background:rgba(55,212,126,.25)}",
      ".bc-fatti .fac{width:30px;height:30px}",
      // il tabellone delle risposte
      ".bc-sch.tab{justify-content:flex-start;justify-content:safe center;overflow:hidden;gap:10px;padding-top:46px}",
      ".bc-sch.tab .bc-notizia{font-size:calc(var(--fs,18px) + 1px)}.bc-sch.tab .bc-ritaglio{padding:9px 12px 11px}",
      ".bc-sch.tab.soloFacce .bc-fatti{gap:4px}.bc-sch.tab.soloFacce .bc-fatti>span{padding:2px}.bc-sch.tab.soloFacce .bc-fatti>span>span:not(.fac){display:none}.bc-sch.tab.corto .bc-ritaglio{display:none}",
      ".bc-sch.tab.minimo{gap:6px}.bc-sch.tab.minimo .bc-tab{gap:4px}.bc-sch.tab.minimo .bc-riga{padding:3px 8px 3px 4px}.bc-sch.tab.minimo .bc-riga .n{width:22px;height:22px;font-size:12px}.bc-sch.tab.minimo .bc-chi-sch{font-size:18px}",
      ".bc-tab{display:flex;flex-direction:column;gap:7px;width:100%;max-width:440px;perspective:700px}",
      ".bc-riga{display:flex;align-items:center;gap:9px;text-align:left;background:#f5efe0;color:#1b1610;border-radius:12px;padding:6px 10px 6px 6px;box-shadow:0 5px 14px rgba(0,0,0,.35);transform-origin:50% 0;transition:transform .4s cubic-bezier(.3,1.4,.5,1),opacity .3s}",
      ".bc-riga.giu{transform:rotateX(-92deg);opacity:0}",
      ".bc-riga .n{flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1b1610;color:#f5efe0;font-weight:900;font-size:14px}",
      ".bc-riga .tx{flex:1;min-width:0;font-family:" + TESTO + ";font-size:var(--fs,18px);font-weight:800;line-height:1.2;overflow-wrap:anywhere}",
      ".bc-riga .vv{flex:0 0 auto;display:flex;max-width:45%;flex-wrap:wrap;justify-content:flex-end}",
      ".bc-riga .vv .fac{width:26px;height:26px;margin-left:-6px;border:2px solid #fffdf4;background:#e9e3d2;animation:bcPop .35s cubic-bezier(.3,1.6,.5,1) both}",
      ".bc-chi-sch.pulsa{animation:bcPulsa 1.1s ease-in-out infinite}",
      "@keyframes bcPulsa{50%{transform:scale(1.07)}}",
      // il ritaglio di giornale
      ".bc-ritaglio{position:relative;width:100%;max-width:440px;margin:0 auto;padding:9px 12px 11px;box-sizing:border-box;text-align:left;color:#1b1610;",
        "background:repeating-linear-gradient(0deg,rgba(80,60,30,.03) 0 2px,transparent 2px 5px),#f5efe0;border-radius:2px;box-shadow:0 12px 28px rgba(0,0,0,.5);transform:rotate(-.8deg)}",
      ".bc-testata{text-align:center;border-bottom:3px double #1b1610;padding-bottom:2px}",
      ".bc-ritaglio .bc-gn{font:900 23px/1.08 " + TITOLO + ";letter-spacing:-.01em}",   // (più forte di «.st-schermo div» dello studio)
      ".bc-gs{font:800 9px/1.2 " + TESTO + ";letter-spacing:.12em;text-transform:uppercase;color:#5a4f40;margin:2px 0 1px}",
      ".bc-griga{display:flex;justify-content:space-between;gap:8px;font:800 9.5px/1.25 " + TESTO + ";letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid #1b1610;padding:3px 1px;white-space:nowrap}",
      ".bc-griga span{overflow:hidden;text-overflow:ellipsis}.bc-griga span:first-child{flex:0 1 auto;min-width:0}",
      ".bc-occhio{font:800 11px/1.25 " + TESTO + ";letter-spacing:.12em;color:#c92a2a;text-transform:uppercase;margin:7px 0 3px}",
      ".bc-ritaglio.finale .bc-occhio{display:inline-block;color:#fff;background:#c92a2a;padding:2px 7px;border-radius:2px}",
      ".bc-colonne{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:9px;border-top:1px solid #1b1610;padding-top:6px}",
      ".bc-colonne i{display:block;height:4px;background:#d8cfbb;margin:0 0 4px;border-radius:2px}.bc-colonne i:nth-child(3n){width:70%}",
      ".bc-ritaglio.grande{padding:11px 14px 13px}.bc-ritaglio.grande .bc-gn{font-size:31px}.bc-ritaglio.grande .bc-notizia{font-size:var(--ft,26px);line-height:1.14}",
      ".bc-ritaglio.grande.bassa .bc-colonne,.bc-ritaglio.grande.bassa .bc-gs{display:none}",
      ".bc-notizia{margin:0;font:900 19px/1.18 " + TITOLO + ";font-variant-numeric:lining-nums;letter-spacing:-.003em;overflow-wrap:break-word}",
      ".bc-buco{display:inline-block;min-width:4.2em;padding:0 .14em;vertical-align:-.12em;line-height:1.05;background:#ffd84a;border-bottom:.09em solid #c92a2a;border-radius:.06em .06em 0 0}",
      ".bc-buco:empty{height:.95em}",
      ".bc-buco.pieno{min-width:0;vertical-align:baseline;background:#ffe98a;font-family:" + TESTO + ";font-weight:800;font-size:.9em;letter-spacing:0;color:#14306b}",
      // il foglio segreto
      ".bc-velo{position:absolute;inset:0;z-index:21;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(12px + env(safe-area-inset-top)) 12px 24px;background:rgba(10,12,24,.9);opacity:0;pointer-events:none;transition:opacity .25s}",
      ".bc-velo.on{opacity:1;pointer-events:auto}",
      ".bc-carta{position:relative;margin:0 auto;max-width:460px;display:flex;flex-direction:column;gap:12px;animation:bcEntra .55s cubic-bezier(.2,1.2,.4,1) both}",
      ".bc-velo.via .bc-carta{animation:bcEsce .3s ease-in forwards}",
      "@keyframes bcEntra{from{transform:translateY(40%) scale(.3) rotate(-6deg);opacity:0}to{transform:none;opacity:1}}",
      "@keyframes bcEsce{to{transform:translateY(55%) scale(.3) rotate(5deg);opacity:0}}",
      ".bc-chi{display:flex;align-items:center;gap:8px;color:#fff;font-size:20px;padding-right:46px}",
      ".bc-chi .fac{width:44px;height:44px}",
      ".bc-chi small{margin-left:auto;font-size:13px;font-weight:800;color:var(--o-oro-testo)}",
      ".bc-scrivi{display:block;background:#fffdf4;border-radius:14px;padding:10px 12px 8px;box-shadow:0 8px 20px rgba(0,0,0,.35)}",
      ".bc-et{display:block;font-size:14px;font-weight:900;color:#5a4a9a;margin-bottom:4px}",
      ".bc-carta>.bc-et{color:#fff;font-size:16px;text-align:center;margin:2px 0 -4px}",
      ".bc-penna{display:block;width:100%;box-sizing:border-box;resize:none;border:0;border-bottom:2px dashed rgba(27,22,16,.3);background:transparent;font-family:" + TESTO + ";font-size:22px;font-weight:800;line-height:1.3;color:#14306b;padding:2px;outline:none;border-radius:0}",
      ".bc-pezzo{display:flex;align-items:flex-start;gap:8px;margin-top:4px}.bc-pezzo .nn{flex:0 0 auto;width:26px;height:26px;margin-top:4px;border-radius:50%;background:#c92a2a;color:#fff;display:flex;align-items:center;justify-content:center;font:900 14px " + TESTO + "}.bc-pezzo .cc{flex:1;min-width:0}",
      ".bc-scrivi.doppia .bc-penna{font-size:20px}.bc-scrivi.doppia .bc-conta{margin-top:1px}",
      ".bc-penna:focus{border-bottom-color:#c92a2a}",
      ".bc-conta{text-align:right;font-size:12px;font-weight:800;color:#8a8fb0;margin-top:3px}",
      ".bc-avviso{display:none;background:var(--o-ambra);color:#2a1a00;border-radius:12px;padding:9px 12px;font-weight:800;font-size:15px;line-height:1.35}",
      ".bc-avviso.on{display:block;animation:bcScuoti .4s}",
      "@keyframes bcScuoti{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}",
      ".bc-ok{width:100%;margin:0;position:sticky;bottom:0;z-index:2;box-shadow:0 -6px 16px rgba(10,12,24,.6)}",   // il tasto resta sempre a vista
      ".bc-tempo-riga{display:flex;align-items:center;gap:8px}.bc-tempo-riga .bc-tempo{flex:1}",
      ".bc-sec{min-width:30px;text-align:right;font-size:17px;font-weight:900;color:var(--o-oro-testo);font-variant-numeric:tabular-nums}.bc-sec.poco{color:var(--o-rosso-testo)}",
      // con la tastiera aperta: la notizia si fa piccola
      ".bc-carta.tastiera{gap:8px}.bc-carta.tastiera .bc-testata,.bc-carta.tastiera .bc-griga,.bc-carta.tastiera .bc-occhio,.bc-carta.tastiera .bc-chi small{display:none}.bc-carta.tastiera .bc-notizia{font-size:15px}.bc-carta.tastiera .bc-chi{font-size:16px}.bc-carta.tastiera .bc-chi .fac{width:30px;height:30px}.bc-carta.tastiera .bc-penna{font-size:20px}",
      // le scelte da votare
      ".bc-scelte{display:flex;flex-direction:column;gap:8px}",
      ".bc-scelta .n{flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1b1610;color:#f5efe0;font-family:" + TESTO + ";font-weight:800;font-size:13px}",
      ".bc-tempo{height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden}.bc-tempo i{display:block;height:100%;width:100%;background:var(--o-oro);transform-origin:0 50%;will-change:transform}.bc-tempo.poco i{background:var(--o-rosso-testo)}",
      ".bc-attesa{margin:0;text-align:center;font-weight:800;color:var(--o-tenue)}",
      // chi guarda soltanto: in basso il posto della targhetta del core ("👀 Guardi · 😂 · ✕")
      ".st-vista.st-con-targa .st-barra{padding-bottom:calc(64px + env(safe-area-inset-bottom))}.st-vista.st-con-targa.con-barra .st-sch-in{padding-bottom:152px}",
      ".bc-con-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
      ".bc-lobby{margin:0;font-size:14px;line-height:1.45}",
      ".bc-scelta{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:2px solid #e2d8c3;border-radius:14px;background:#f5efe0;color:#1b1610;padding:9px 12px;font-family:" + TESTO + ";font-size:19px;font-weight:800;line-height:1.22;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s}",
      ".bc-scelta:active{transform:scale(.97)}",
      ".bc-scelta .tx{flex:1;min-width:0;overflow-wrap:anywhere}",
      ".bc-scelta.sel{border-color:var(--n-lampone);background:#ffe3ec;box-shadow:0 0 0 3px rgba(224,34,90,.4)}",
      ".bc-scelta.mia{opacity:.55;cursor:default}",
      ".bc-scelta .tag{flex:0 0 auto;font-family:system-ui,sans-serif;font-size:11px;font-weight:900;color:#fff;background:#5a4a9a;border-radius:99px;padding:3px 8px}",
      ".bc-scelte.tante .bc-scelta{font-size:var(--fs,16px);line-height:1.18;padding:6px 10px}",
      ".bc-carta.piccola .bc-notizia{font-size:14px}.bc-carta.piccola .bc-testata,.bc-carta.piccola .bc-griga,.bc-carta.piccola .bc-occhio{display:none}.bc-carta.piccola .bc-chi small{display:none}",
      // tantissime risposte: su due colonne e, se non basta, senza la notizia (è già sul maxischermo)
      ".bc-carta.due .bc-scelte{display:grid;grid-template-columns:1fr 1fr;gap:6px}.bc-carta.due .bc-scelta{padding:5px 7px;gap:5px;align-items:flex-start}.bc-carta.due .bc-scelta .n{width:20px;height:20px;font-size:11px}",
      ".bc-carta.due .bc-scelta .tag{position:absolute;right:4px;bottom:-7px;font-size:9px;padding:1px 5px}.bc-carta.due .bc-scelta{position:relative}",
      ".bc-carta.senza .bc-ritaglio{display:none}",
      ".bc-carta.mini .bc-notizia{font-size:12px;line-height:1.25}.bc-carta.mini .bc-scelta{padding-top:3px;padding-bottom:3px}",
      ".bc-carta.stretta{gap:8px}.bc-carta.stretta .bc-ritaglio{padding:8px 12px 10px}.bc-carta.stretta .bc-notizia{font-size:15px}.bc-carta.stretta .bc-scelte{gap:6px}.bc-carta.stretta .bc-chi{font-size:17px}.bc-carta.stretta .bc-chi .fac{width:36px;height:36px}",
      // la rivelazione
      ".bc-sch.riv{gap:22px}",
      ".bc-big{position:relative;width:100%;max-width:420px;box-sizing:border-box;padding:22px 16px 30px;border-radius:16px;background:#f5efe0;color:#1b1610;box-shadow:0 14px 30px rgba(0,0,0,.45);transform:rotate(-1deg);animation:bcEntra .5s cubic-bezier(.2,1.2,.4,1) both}",
      ".bc-big .tx{font-family:" + TESTO + ";font-size:28px;font-weight:800;line-height:1.2;overflow-wrap:anywhere}",
      ".bc-timbro{position:absolute;right:8px;bottom:-26px;padding:2px 14px;border:5px solid currentColor;border-radius:10px;font-family:system-ui,sans-serif;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;background:rgba(255,255,255,.88);transform:rotate(12deg) scale(3);opacity:0;pointer-events:none}",
      ".bc-timbro.balla{color:#e03131}.bc-timbro.vero{color:#2b8a3e}",
      ".bc-timbro.on{animation:bcTimbro .45s cubic-bezier(.3,1.5,.5,1) forwards}",
      "@keyframes bcTimbro{from{transform:rotate(12deg) scale(3);opacity:0}to{transform:rotate(12deg) scale(1);opacity:1}}",
      ".bc-gente,.bc-autori{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}",
      ".bc-votante{display:flex;align-items:center;gap:6px;font-size:17px;font-weight:800;background:rgba(255,255,255,.12);border-radius:99px;padding:3px 12px 3px 3px;animation:bcPop .35s cubic-bezier(.3,1.6,.5,1) both}",
      ".bc-votante .fac{width:34px;height:34px}",
      ".bc-votante.cascato{background:rgba(255,93,108,.28)}",
      ".bc-votante.giusto{background:rgba(55,212,126,.35)}",
      ".bc-votante.autore{background:rgba(224,34,90,.3);font-size:19px}",
      ".bc-votante.autore .fac{width:42px;height:42px}",
      "@keyframes bcPop{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}",
      ".bc-nessuno{font-weight:800;color:var(--o-tenue)}",
      ".bc-redazione{font-size:19px;font-weight:900;background:var(--o-carta-2);border-radius:99px;padding:5px 14px}",
      // i premi della serata
      ".bc-premi{gap:12px}",
      ".bc-premio-riga{display:flex;align-items:center;gap:10px;width:100%;max-width:440px;box-sizing:border-box;background:rgba(255,255,255,.08);border-radius:16px;padding:8px 10px;text-align:left;animation:bcPop .45s cubic-bezier(.3,1.6,.5,1) both}",
      ".bc-premio-riga .ic{font-size:34px;flex:0 0 auto}",
      ".bc-premio-riga .cosa{flex:1;min-width:0;display:flex;flex-direction:column}.bc-premio-riga .cosa b{font-size:18px;color:var(--o-oro-testo)}.bc-premio-riga .cosa small{font-size:13px;font-weight:700;color:var(--o-tenue)}",
      ".bc-premio-riga .chi{display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex:0 1 auto;min-width:0}.bc-premio-riga .bc-votante{font-size:15px;padding:2px 10px 2px 2px}.bc-premio-riga .bc-votante .fac{width:28px;height:28px}",
      ".bc-sotto{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}",
      ".bc-autore{display:flex;flex-direction:column;align-items:center;gap:6px;animation:bcPop .4s .1s both}",
      ".bc-autore small,.bc-intera small{font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--o-tenue)}",
      ".bc-intera{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;animation:bcPop .45s .1s both}",
      ".bc-intera .bc-ritaglio{transform:rotate(.8deg)}",
      ".bc-premio{font-size:18px;font-weight:900;padding:6px 14px;border-radius:99px;animation:bcPop .4s .25s both}",
      ".bc-premio.si{background:var(--o-verde);color:var(--o-verde-testo)}.bc-premio.no{background:rgba(255,93,108,.3);color:#ffd0d5}",
      ".bc-ignorate{display:flex;flex-direction:column;gap:8px;width:100%;max-width:420px}",
      ".bc-ign{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);border-radius:12px;padding:8px 12px;text-align:left;animation:bcPop .35s both}",
      ".bc-ign .tx{flex:1;min-width:0;font-family:" + TESTO + ";font-size:18px;font-weight:800;overflow-wrap:anywhere}",
      ".bc-ign .di{flex:0 0 auto;max-width:40%;font-size:13px;font-weight:800;color:var(--o-oro-testo);text-align:right}",
      // la classifica
      ".bc-clas{flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px}",
      ".bc-clas h2{margin:0 0 6px;text-align:center;font-size:24px}",
      ".bc-cl{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;border-radius:14px;background:rgba(255,255,255,.07);animation:bcPop .45s ease both}",
      ".bc-cl.primo{background:color-mix(in srgb,var(--n-monete) 18%,transparent);border:1px solid color-mix(in srgb,var(--n-monete) 50%,transparent)}",
      ".bc-cl .pos{width:28px;text-align:center;font-weight:900}",
      ".bc-cl .fac{width:40px;height:40px}",
      ".bc-clas.tanti{gap:4px;justify-content:flex-start;padding-bottom:6px}.bc-clas.tanti h2{font-size:19px;margin:0 0 2px}.bc-clas.tanti .bc-cl{padding:3px 10px 3px 4px}.bc-clas.tanti .bc-cl .fac{width:28px;height:28px}",
      ".bc-cl .nm{flex:1;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".bc-cl .pt{font-weight:900;color:var(--n-monete)}",
      ".bc-cl .pi{font-size:12px;font-weight:800;color:var(--o-verde);margin-left:4px}",
      // la classifica finale è una schermata dell'app (Notte vivace, classe .oro): righe di vetro sollevato, il primo col filo d'oro
      // (la classifica dopo ogni round, nello studio, resta com'è: lì non c'è .oro)
      ".oro .bc-cl{border:1px solid var(--o-filo);background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 10px 24px -14px rgba(0,0,0,.8)}",
      ".oro .bc-cl.primo{border-color:color-mix(in srgb,var(--n-monete) 60%,transparent)}",
      ".oro .bc-cl .fac{background:radial-gradient(circle at 50% 35%,var(--o-carta-2),var(--o-carta-piena));box-shadow:0 0 0 1px var(--o-filo-oro)}",
      ".oro .bc-cl .pt{color:var(--n-monete)}",
      // «Parliamo di te»: un foglietto giallo al posto del ritaglio di giornale; il foglio della verità
      ".bc-ritaglio.amici{background:repeating-linear-gradient(0deg,rgba(60,90,200,.10) 0 1px,transparent 1px 26px),#fff4a8;transform:rotate(1.2deg);padding:12px 14px 14px}",
      ".bc-ritaglio.amici .bc-testata{text-align:left;font:900 11px/1.3 " + TESTO + ";letter-spacing:.14em;text-transform:uppercase;color:#7048e8;border-bottom:2px solid #7048e8;padding-bottom:5px;margin-bottom:7px}",
      ".bc-ritaglio.amici .bc-notizia{font:800 19px/1.32 " + TESTO + "}.bc-ritaglio.amici.grande .bc-notizia{font-size:var(--ft,23px)}",
      ".bc-catsch{gap:12px}",
      ".bc-chi-cat{display:flex;align-items:center;justify-content:center;gap:10px;line-height:1.2}.bc-chi-cat .fac{width:46px;height:46px}",
      ".bc-perche{font-size:15px;font-weight:800;color:var(--o-tenue);margin-top:-6px}",
      ".bc-cats{display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px}",
      ".bc-cat-c{display:flex;align-items:center;gap:14px;width:100%;min-height:62px;padding:10px 16px;border:2px solid #e2d8c3;border-radius:16px;background:#f5efe0;color:#1b1610;font:800 21px/1.15 " + TESTO + ";text-align:left;box-shadow:0 8px 18px rgba(0,0,0,.4);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .15s,opacity .3s,box-shadow .2s;animation:bcPop .4s cubic-bezier(.3,1.6,.5,1) both}",
      ".bc-cat-c:nth-child(2){animation-delay:.1s}.bc-cat-c:nth-child(3){animation-delay:.2s}",
      ".bc-cat-c .ic{font-size:30px;line-height:1;flex:0 0 auto}.bc-cat-c:not(:disabled):active{transform:scale(.96)}.bc-cat-c:disabled{cursor:default}",
      ".bc-cat-c.toccata,.bc-cat-c.scelta{border-color:var(--n-lampone);box-shadow:0 0 0 4px rgba(224,34,90,.45),0 8px 18px rgba(0,0,0,.4);transform:scale(1.04)}",
      ".bc-cat-c.spenta{opacity:.32;transform:scale(.96)}",
      ".bc-scrivi.vero{box-shadow:0 0 0 3px var(--o-verde),0 8px 20px rgba(0,0,0,.35)}.bc-scrivi.vero .bc-et{color:#2b8a3e}",
      // «😂 Che balla!»: il tasto delle risate sul biglietto (in basso a sinistra; il timbro è a destra) e nella lista
      ".bc-big.con-ride{margin-bottom:14px}.bc-big.con-ride .bc-timbro{font-size:24px;padding:2px 11px;border-width:4px}",
      ".bc-ride{position:absolute;left:6px;bottom:-24px;z-index:2;display:flex;align-items:center;gap:4px;min-height:44px;padding:3px 12px 3px 7px;border:3px solid var(--o-filo-oro);border-radius:99px;",
        "background:var(--o-carta-piena);color:var(--o-testo);font:900 15px system-ui,sans-serif;box-shadow:0 6px 14px rgba(0,0,0,.4);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;animation:bcPop .4s cubic-bezier(.3,1.6,.5,1) both;transition:transform .12s}",
      ".bc-ride:active{transform:scale(.92)}",
      ".bc-ride .em{font-size:22px;line-height:1}.bc-ride .nn{min-width:0;font-size:16px}.bc-ride .nn:not(:empty){margin-left:2px;background:var(--o-scuro);border-radius:99px;padding:0 8px;color:var(--o-scuro-testo)}",
      ".bc-ride.mio{background:var(--o-tasto);color:var(--o-tasto-testo);border-color:transparent}.bc-ride.mio .rt:after{content:' ✓'}",
      ".bc-ride.mia,.bc-ride:disabled{background:var(--o-carta-2);color:var(--o-tenue);cursor:default;box-shadow:none}",
      ".bc-ride.no{animation:bcScuoti .35s}",
      ".bc-ride.pic{position:relative;left:auto;bottom:auto;min-height:40px;padding:2px 10px 2px 6px;border-width:2px;font-size:14px;flex:0 0 auto}.bc-ride.pic .em{font-size:20px}.bc-ride.pic .nn{font-size:14px}",
      ".bc-vola{position:absolute;bottom:60%;font-size:26px;pointer-events:none;animation:bcVola 1.2s ease-out both}",
      "@keyframes bcVola{from{transform:translate(-50%,0) scale(.6);opacity:1}to{transform:translate(-50%,-90px) scale(1.3) rotate(-14deg);opacity:0}}",
      ".bc-ign{position:relative}",
      // la Balla d'oro del round
      ".bc-oro{gap:14px}",
      ".bc-coppa{font-size:56px;line-height:1;animation:bcPop .5s cubic-bezier(.3,1.6,.5,1) both}",
      ".bc-big.oro{background:linear-gradient(135deg,#fff8d6,#ffe066);box-shadow:0 0 0 4px var(--n-monete),0 14px 30px rgba(0,0,0,.45);padding:16px 16px 18px}",
      ".bc-big.oro .tx{font-size:26px}",
      ".bc-premio.oro{background:var(--n-monete);color:#3b2a00;font-family:inherit}",
      // «⏩ Avanti» sulla classifica del round
      ".bc-avanti{display:flex;align-items:center;justify-content:center;gap:10px}.bc-avanti .quanti{font-size:14px;font-weight:800;background:rgba(255,255,255,.22);border-radius:99px;padding:2px 10px}",
      "@media (prefers-reduced-motion:reduce){.bc-carta,.bc-big,.bc-votante,.bc-timbro.on,.bc-cl,.bc-ign,.bc-ride,.bc-vola,.bc-coppa{animation:none}.bc-timbro.on{transform:rotate(12deg);opacity:1}}"
    ].join("");
    document.head.appendChild(s);
  }

  // Playfair Display Black (lettere latine), di Claus Eggers Sørensen: licenza SIL Open Font License 1.1 (si può usare e incorporare liberamente)
  var FONT_TITOLO = "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";

  // per le prove (e per l'online, più avanti): le regole senza grafica
  window.__balla = { pulisciR: pulisciR, eLaVeritaR: eLaVeritaR, vis: vis, pezziN: pezziN, moltiplica: moltiplica, chiSceglie: chiSceglie, treCategorie: treCategorie,
    CATEGORIE: CATEGORIE, finali: finali, scegliFinale: scegliFinale, notizieDi: notizieDi,
    norm: norm, eLaVerita: eLaVerita, preparaScelte: preparaScelte, calcola: calcola, calcolaOro: calcolaOro, pianoRound: pianoRound, riempi: riempi, pezzi: pezzi, pulisci: pulisci };
})();
