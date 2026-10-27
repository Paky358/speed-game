/* =========================================================
   GIOCO — "L'Impostore"
   Un telefono solo. Tutti ricevono la STESSA parola, tranne
   l'impostore, che non la sa (con l'aiutino riceve una parola
   SIMILE oppure solo la categoria). Da 4 giocatori può esserci
   anche la SPIA: riceve una parola simile (mare/lago) e, a
   scelta dell'host, sa di essere la spia oppure no.
   Il telefono si passa di mano: ognuno tiene premuto per
   vedere il suo ruolo in segreto. L'app dice chi inizia e il
   giro; si parla a voce, poi si vota in segreto. Lo spoglio
   svela il più votato; l'impostore scoperto ha un'ultima
   possibilità: indovinare la parola. Una o più mani.
   ONLINE (ognuno dal suo telefono, anche nella Sala): ognuno vede
   la sua parola sul suo telefono (tenendo premuto); gli indizi si
   scrivono di nascosto e si svelano tutti insieme al giro dopo
   (1-3 giri), oppure si dicono a voce; poi si discute, si vota in
   segreto sul telefono, lo spoglio, l'ultima possibilità
   dell'impostore e i punti. Chi rientra ritrova la sua parola;
   chi guarda vede la parola e chi è l'impostore (tenendo premuto).
   Le coppie di parole sono in data/impostore-parole.js.
   ========================================================= */
(function () {
  "use strict";

  var CHIAVE_REGOLE = "sg_impostore_regole", CHIAVE_USATE = "sg_impostore_usate";
  // indizi e giri valgono solo online: "scritti" (di nascosto, svelati insieme) o "voce" (come sul telefono solo)
  // voto: "una" (si vota una volta, com'era) o "elim" (🔪 a eliminazione, alla Undercover); nimp: 1 o 2 impostori (2 solo a
  // eliminazione e da 7 giocatori); conosce: i due impostori si conoscono ("si") oppure no
  var BASE = { aiuto: "simile", spia: "no", mani: 1, tempo: 0, cat: null, indizi: "scritti", giri: 2, voto: "una", nimp: 1, conosce: "si" };
  // online: quanti giocano e i tempi (in secondi) di ogni momento della mano
  var MIN_ON = 3, MAX_ON = 10;
  var T_INDIZIO = 45, T_LEGGI = 10, T_VOTO = 40, T_ULTIMA = 25, T_ESITO = 20, T_LIBERO = 300, T_FUORI = 12, T_BALLO = 15;
  // 📱 chi ha bloccato il telefono (si parla tanto: lo fanno tutti) resta in partita; se finito il tempo manca ancora il suo
  // indizio o il suo voto, lo si aspetta una volta questi secondi in più (26 ott 2026)
  var T_DORME = 50;

  function rnd(n) { return Math.floor(Math.random() * n); }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function leggi(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function stessoNome(a, b) { return String(a || "").trim().toLowerCase().slice(0, 16) === String(b || "").trim().toLowerCase().slice(0, 16); }

  // ---- le coppie, divise per categoria ----
  function categorie() {
    return (window.SG_IMPOSTORE || []).filter(function (c) { return c && c.coppie; }).map(function (c) {
      var coppie = c.coppie.split("|").map(function (s) { return s.split("/"); })
        .filter(function (p) { return p.length === 2 && p[0].trim() && p[1].trim(); })
        .map(function (p) { return { a: p[0].trim(), b: p[1].trim(), cat: c.id }; });
      return { id: c.id, icona: c.icona || "🏷️", nome: c.nome || c.id, coppie: coppie };
    }).filter(function (c) { return c.coppie.length; });
  }

  // le regole scelte (anche quelle di una volta: "suggerimento" sì/no)
  function regoleDa(imp) {
    var r = {};
    for (var k in BASE) r[k] = imp && imp[k] != null ? imp[k] : BASE[k];
    if (imp && imp.aiuto == null && imp.suggerimento === false) r.aiuto = "buio";
    r.voto = r.voto === "elim" ? "elim" : "una";
    r.nimp = +r.nimp === 2 ? 2 : 1;
    r.conosce = r.conosce === "no" ? "no" : "si";
    return r;
  }
  // quanti impostori in una mano con n giocatori (2 solo a eliminazione e da 7) e se c'è posto per la spia (da 4; con 2 impostori da 8)
  function quantiImp(R, n) { return R.voto === "elim" && R.nimp === 2 && n >= 7 ? 2 : 1; }
  function spiaPossibile(R, n, nImp) { return R.spia !== "no" && n >= (nImp > 1 ? 8 : 4); }

  // ---- suoni (tutti piccoli, col motore audio comune) ----
  function nota(f, dur, dopo, tipo, vol) {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), n = c.currentTime + (dopo || 0);
      o.type = tipo || "triangle"; o.frequency.setValueAtTime(f, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(vol || 0.1, n + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + dur + 0.02);
    } catch (e) {}
  }
  function tic(f) { nota(f || 620, 0.06, 0, "square", 0.05); }
  function rullo() { for (var k = 0; k < 14; k++) nota(180 + (k % 2) * 30, 0.05, k * 0.08, "square", 0.04 + k * 0.003); }
  function fanfara(bella) {
    var seq = bella ? [523, 659, 784, 1047] : [440, 392, 349, 262];
    seq.forEach(function (f, k) { nota(f, bella ? 0.22 : 0.3, k * (bella ? 0.12 : 0.2), "triangle", 0.12); });
  }

  // ---- un tasto che ignora i tocchi appena compare (niente turni saltati col doppio tocco) ----
  function tasto(t, testo, classe, fn) {
    var nato = Date.now(), usato = false;
    var b = t.el("button", { class: "btn " + (classe == null ? "btn-primario" : classe), text: testo, onclick: function () {
      if (usato || Date.now() - nato < 450 || b.style.visibility === "hidden") return;
      usato = true; fn(b);
    } });
    b.sveglia = function () { nato = Date.now(); };
    return b;
  }
  function uscita(t) {
    return function () { t.conferma("Uscire dalla partita?", "I punti di questa partita si perdono.", "Esci", t.esci); };
  }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p || 12); } catch (e) {} }

  // ---- le regole di una mano, senza grafica (uguali sul telefono solo e online) ----
  // il segreto di un giocatore: cosa vede tenendo premuto
  function ruoloInfo(o) {   // o: { imp, spia, spiaSa, aiuto, parola, simile, cat (oggetto categoria), due (2 impostori), socio (il nome dell'altro, se vi conoscete) }
    if (o.imp) {
      var x, chi = o.due ? "Sei un impostore!" : "Sei l'impostore!";
      if (o.aiuto === "simile") x = { su: chi + " La tua parola è simile ma diversa", grande: o.simile, giu: "Gli altri hanno un'altra parola: mimetizzati" };
      else if (o.aiuto === "categoria") x = { su: chi + " Non hai la parola", grande: "🕵️ Impostore", giu: "Categoria: " + (o.cat ? o.cat.icona + " " + o.cat.nome : "?") + ". Ascolta e bluffa" };
      else x = { su: chi + " Non hai la parola", grande: "🕵️ Impostore", giu: "Ascolta gli altri e bluffa" };
      // con 2 impostori: chi è l'altro (solo se vi conoscete), una riga che resta a vista anche sulla carta piccola
      if (o.due) x.socio = o.socio ? "🤝 L'altro impostore è " + o.socio : "👥 C'è un altro impostore: non sai chi";
      return x;
    }
    if (o.spia && o.spiaSa) return { su: "Sei la spia! La tua parola è simile a quella degli altri", grande: o.simile, giu: "Mimetizzati e non farti votare" };
    return { su: "La tua parola è", grande: o.spia ? o.simile : o.parola, giu: "Non dirla ad alta voce" };
  }
  // conti dei voti: il più votato DA SOLO viene accusato (col pareggio nessuno). voti[k] = chi ha votato k (indice) o null
  function contaVoti(n, voti) {
    var conte = []; for (var i = 0; i < n; i++) conte.push(0);
    voti.forEach(function (v) { if (v != null && v >= 0 && v < n) conte[v]++; });
    var max = Math.max.apply(null, conte.concat([0])), piu = [];
    conte.forEach(function (c, k) { if (c === max && max > 0) piu.push(k); });
    return { conte: conte, piu: piu, accusato: piu.length === 1 ? piu[0] : -1 };
  }
  // i punti della mano (spia = -1 se non c'è)
  function puntiMano(n, voti, imp, spia, accusato, indovinato) {
    var scoperto = accusato === imp, p = [];
    for (var k = 0; k < n; k++) {
      var x = 0;
      if (k === imp) x = !scoperto ? 3 : (indovinato ? 2 : 0);
      else {
        if (voti[k] === imp) x += 2;
        else if (spia >= 0 && voti[k] === spia) x += 1;
        if (k === spia && accusato !== k) x += 2;
      }
      p.push(x);
    }
    return p;
  }
  function testiEsito(accusato, imp, spia, indovinato) {
    if (accusato === imp && !indovinato) return { titolo: "Impostore scoperto!", icona: "✅", sotto: "E non ha indovinato la parola" };
    if (accusato === imp) return { titolo: "Scoperto… ma ha indovinato!", icona: "🎯", sotto: "Si salva all'ultimo" };
    if (spia >= 0 && accusato === spia) return { titolo: "Presa la spia!", icona: "🎭", sotto: "Ma l'impostore se la cava" };
    if (accusato >= 0) return { titolo: "Avete accusato un innocente!", icona: "😇", sotto: "L'impostore l'ha fatta franca" };
    return { titolo: "Pareggio nei voti!", icona: "🤝", sotto: "Così l'impostore si salva" };
  }
  // le 6 parole dell'ultima possibilità: la giusta, la simile e altre della stessa categoria (se non bastano, da tutte)
  function scelteUltima(cats, cat, parola, simile) {
    var c = cats.filter(function (x) { return x.id === cat; })[0] || cats[0], esche = [];
    c.coppie.forEach(function (p) { if (p.a !== parola && p.b !== parola) esche.push(p.a, p.b); });
    esche = mischia(esche.filter(function (w) { return w !== simile; }));
    if (esche.length < 4) cats.forEach(function (cc) { if (cc !== c) cc.coppie.forEach(function (p) { esche.push(p.a); }); });
    var scelte = [parola, simile];
    esche.forEach(function (w) { if (scelte.length < 6 && scelte.indexOf(w) < 0) scelte.push(w); });
    return mischia(scelte);
  }
  // un indizio non può contenere la propria parola (nemmeno al plurale: pizza → pizze)
  function norma(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function radice(w) { return w.length >= 4 ? w.replace(/[aeiou]$/, "") : w; }
  function svelaParola(testo, parola) {
    var a = norma(testo), b = norma(parola);
    if (!a || !b) return false;
    if (a.replace(/ /g, "") === b.replace(/ /g, "")) return true;
    var pa = a.split(" ").map(radice), pb = b.split(" ").filter(function (w) { return w.length >= 3; }).map(radice);
    return pb.some(function (w) { return pa.indexOf(w) >= 0; });
  }
  function pulisciIndizio(s) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, 24); }

  // ---- 🔪 A ELIMINAZIONE (alla Undercover): le regole senza grafica, uguali sul telefono solo e online ----
  // (le "chiavi" sono gli indici sul telefono solo e gli id online; ruolo: "imp", "spia" o "cit")
  // chi ha vinto, con chi è ancora dentro: "cit" se gli impostori sono tutti fuori, "imp" se sono almeno quanti gli altri (in 2 con l'impostore dentro)
  function fineElim(vivi, imps) {
    var dentro = vivi.filter(function (k) { return imps.indexOf(k) >= 0; }).length;
    if (!dentro) return "cit";
    return dentro >= vivi.length - dentro ? "imp" : null;
  }
  // cosa succede dopo un voto: chi esce (acc), oppure pareggio (si rifà il giro), oppure ballottaggio tra i pari (al secondo pareggio
  // di fila); se anche il ballottaggio è pari decide la sorte. V = contaVoti; cand = chi si poteva votare; pari = i pareggi di fila prima
  function decidiElim(V, inBallo, pari, cand, caso) {
    if (V.accusato >= 0) return { acc: V.accusato, pari: 0 };
    var pari2 = V.piu.length ? V.piu : cand;
    if (inBallo) return { acc: pari2[(caso || rnd)(pari2.length)], sorte: true, pari: 0 };
    if (pari + 1 >= 2 && pari2.length >= 2) return { acc: -1, ballo: pari2, pari: pari + 1 };
    return { acc: -1, pari: pari + 1 };
  }
  // i punti a fine mano: +2 a ogni cittadino se vincono (anche a chi è uscito); impostore +1 per ogni giro in cui è restato dentro
  // e +3 se vince; la spia +2 se arriva alla fine senza essere eliminata. Torna { chiave: punti }
  function puntiElim(chi, imps, spia, vince, sopr, fuori) {
    var p = {};
    chi.forEach(function (k) {
      if (imps.indexOf(k) >= 0) p[k] = ((sopr && sopr[k]) || 0) + (vince === "imp" ? 3 : 0);
      else if (k === spia) p[k] = fuori.indexOf(k) < 0 ? 2 : 0;
      else p[k] = vince === "cit" ? 2 : 0;
    });
    return p;
  }
  // "Luca era un cittadino 😇" / "Luca era la spia 🎭" / "Luca era l'impostore 🕵️" (con 2 impostori: "un impostore")
  function fraseRuolo(nome, ruolo, nImp, tu) {
    var r = ruolo === "imp" ? (nImp > 1 ? "un impostore 🕵️" : "l'impostore 🕵️") : ruolo === "spia" ? "la spia 🎭" : "un cittadino 😇";
    return (tu ? "Tu eri " : nome + " era ") + r;
  }
  function testiFineElim(vince, nImp, indovinato, chiIndovina) {
    var tanti = nImp > 1;
    if (vince === "cit") return { titolo: "Vincono i cittadini!", icona: "🎉", sotto: tanti ? "Tutti e due gli impostori sono fuori" : "L'impostore è fuori" };
    if (indovinato) return { titolo: tanti ? "Vincono gli impostori!" : "Vince l'impostore!", icona: "🎯", sotto: (chiIndovina || "L'impostore") + " ha indovinato la parola all'ultimo" };
    return { titolo: tanti ? "Vincono gli impostori!" : "Vince l'impostore!", icona: "🕵️", sotto: tanti ? "Sono rimasti tanti quanti i cittadini" : "Siete rimasti in due: l'ha fatta franca" };
  }
  // per le prove (.agents/skills/prova-nel-browser/migliora/impostore.js e migliora2/g1-impostore.js): le regole senza grafica
  window.__impostore = { contaVoti: contaVoti, puntiMano: puntiMano, testiEsito: testiEsito, scelteUltima: scelteUltima, svelaParola: svelaParola, pulisciIndizio: pulisciIndizio, ruoloInfo: ruoloInfo,
    fineElim: fineElim, decidiElim: decidiElim, puntiElim: puntiElim, fraseRuolo: fraseRuolo, quantiImp: quantiImp, spiaPossibile: spiaPossibile, regoleDa: regoleDa };

  SG.registra({
    id: "impostore",
    nome: "L'Impostore",
    icona: "🕵️",
    tema: "oro",   // 🤍 Bianco e oro: tutte le schermate chiare (lo stile sta in fondo al file)
    descrizione: "Tutti hanno la stessa parola, tranne l'impostore (e forse una spia). Scoprite chi bluffa prima che la faccia franca.",
    giocatoriMin: 3,
    giocatoriMax: 10,
    difficolta: 2,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono e guardate la parola in segreto", amici: true }],
    postiOnline: MAX_ON,
    riprende: true,   // se l'host ricarica o riapre l'app, la partita online riprende da dove era (t.ripresa, t.ricorda)
    riserva: true,    // se l'host sparisce del tutto un amico la porta avanti (gioco lungo, a turni, da 3 a 10: non a due né in tempo reale)
    // la riga "📜 Si gioca così" che gli amici leggono in saletta
    riassunto: function (imp) {
      var r = regoleDa(imp), con = r.spia !== "no", elim = r.voto === "elim";
      var aiuto = r.aiuto === "buio" ? "🙈 l'impostore non sa niente" : (r.aiuto === "simile" && !con) ? "💡 parola simile all'impostore" : "🏷️ l'impostore sa la categoria";
      // a eliminazione si scrive un indizio a testa per ogni giro (i "giri di indizi" non contano)
      return [r.indizi === "voce" ? "🗣️ Indizi a voce" : elim ? "✍️ Indizi scritti" : "✍️ " + (r.giri > 1 ? r.giri + " giri di indizi scritti" : "1 giro di indizi scritti"),
        elim ? "🔪 a eliminazione" : null, elim && r.nimp === 2 ? "👥 2 impostori " + (r.conosce === "si" ? "che si conoscono" : "che non si conoscono") : null, aiuto,
        con ? (r.spia === "sa" ? "🎭 con la spia" : "🤫 con la spia (che non lo sa)") : null, r.mani > 1 ? r.mani + " mani" : "1 mano"].filter(Boolean).join(" · ");
    },
    regole: [
      "<b>Online</b>: ognuno vede la sua parola sul suo telefono. Gli <b>indizi</b> si scrivono di nascosto e si svelano <b>tutti insieme</b> (oppure si dicono a voce, se l'host sceglie così). Poi si discute e si vota sul telefono.",
      "<b>🔪 A eliminazione</b> (se l'host lo sceglie): dopo ogni voto il più votato <b>esce</b> e si scopre chi era. Chi resta fa un altro giro di indizi con la <b>stessa parola</b>, finché l'impostore è fuori (vincono i cittadini) o restate in 2 con l'impostore dentro (vince lui). L'impostore scoperto ha l'ultima possibilità: se indovina la parola, vince lui. Pareggio: nessuno esce e si rifà il giro; al secondo pareggio di fila, <b>ballottaggio</b> solo tra i pari. Chi esce non vota più: guarda.",
      "Punti a eliminazione: <b>+2</b> a ogni cittadino se vincono (anche a chi è uscito). L'impostore <b>+1</b> per ogni giro in cui resta dentro e <b>+3</b> se vince; la spia <b>+2</b> se arriva alla fine.",
      "<b>👥 Due impostori</b> (a eliminazione, da 7 giocatori): l'host sceglie se <b>si conoscono</b> (ognuno vede chi è l'altro) o no. I cittadini vincono quando sono fuori tutti e due; gli impostori quando sono tanti quanti i cittadini rimasti. Con 2 impostori la spia c'è da 8 giocatori.",
      "Il telefono passa di mano: ognuno <b>tiene premuto</b> per vedere in segreto la sua parola. Uno di voi è l'<b>impostore</b>: non ha la parola.",
      "L'host sceglie cosa sa l'impostore: una parola <b>simile</b>, solo la <b>categoria</b> oppure <b>niente</b>.",
      "Da 4 giocatori può esserci anche la <b>spia</b>: riceve una parola simile a quella degli altri (mare/lago). L'host decide se la spia <b>sa</b> di esserlo oppure <b>no</b>: in quel caso crede di avere la parola giusta!",
      "L'app dice <b>chi inizia</b>: a turno ognuno dice a voce UNA parola legata alla sua, senza svelarla. Poi discutete e <b>votate in segreto</b> chi è l'impostore.",
      "Punti: chi vota l'impostore <b>+2</b>, chi vota la spia <b>+1</b>. L'impostore prende <b>+3</b> se non è il più votato (basta un pareggio per salvarsi); la spia <b>+2</b> se non è la più votata.",
      "L'impostore scoperto ha un'<b>ultima possibilità</b>: se indovina la parola degli altri si salva e prende <b>+2</b>."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, cats = categorie(), online = aiuti.modo === "online";
      var r = regoleDa(Object.assign({}, leggi(CHIAVE_REGOLE) || {}, dove));
      for (var k in r) dove[k] = r[k];
      if (dove.cat) dove.cat = dove.cat.filter(function (id) { return cats.some(function (c) { return c.id === id; }); });
      if (dove.cat && !dove.cat.length) dove.cat = null;
      function salva() { scrivi(CHIAVE_REGOLE, { aiuto: dove.aiuto, spia: dove.spia, mani: dove.mani, tempo: dove.tempo, cat: dove.cat, indizi: dove.indizi, giri: dove.giri, voto: dove.voto, nimp: dove.nimp, conosce: dove.conosce }); }

      var CHIP = "padding:9px 12px;min-height:44px;font-size:.95rem";
      // le scelte principali: tre tasti su una riga (icona sopra, scritta sotto), così stanno in alto senza scorrere
      var CHIP3 = "flex-direction:column;justify-content:center;gap:2px;padding:7px 4px;min-height:54px;min-width:0;font-size:.86rem;line-height:1.15;text-align:center";
      var gruppi = {}, forzato = false;
      function riga(titolo, chiave, opzioni, dove2) {   // (dove2: la parte che si apre; se no in alto)
        var su = dove2 || box;
        su.appendChild(el("div", { class: "etichetta", text: titolo }));
        var tre = opzioni.length === 3;
        var g = el("div", { class: "cat-griglia", style: "gap:8px" + (tre ? ";display:grid;grid-template-columns:repeat(3,minmax(0,1fr))" : opzioni.length === 2 ? ";display:grid;grid-template-columns:repeat(2,minmax(0,1fr))" : "") });
        gruppi[chiave] = opzioni.map(function (o) {
          var b = el("button", { class: "cat-chip", style: tre ? CHIP3 : opzioni.length === 2 ? CHIP + ";min-width:0;justify-content:center;padding:9px 6px" : CHIP, onclick: function () {
            if (b.disabled) return;
            dove[chiave] = o.v;
            if (chiave === "spia" && o.v !== "no" && dove.aiuto === "simile") { dove.aiuto = "categoria"; forzato = true; }   // la parola simile ce l'ha la spia
            else if (chiave === "spia" && o.v === "no" && forzato) { dove.aiuto = "simile"; forzato = false; }   // tolta la spia, torna com'era
            else if (chiave === "aiuto") forzato = false;
            aggiorna(); salva();
          } }, [ o.i ? el("span", { class: "ci", text: o.i }) : null, el("span", { text: o.t }) ]);
          b._v = o.v; g.appendChild(b); return b;
        });
        su.appendChild(g);
      }
      riga("Cosa sa l'impostore", "aiuto", [
        { v: "simile", i: "💡", t: "Parola simile" }, { v: "categoria", i: "🏷️", t: "La categoria" }, { v: "buio", i: "🙈", t: "Niente" }]);
      riga("La spia", "spia", [
        { v: "no", i: "🚫", t: "Niente spia" }, { v: "sa", i: "🎭", t: "Sa di esserlo" }, { v: "nonsa", i: "🤫", t: "Non lo sa" }]);
      // online: gli indizi scritti di nascosto (svelati tutti insieme) oppure a voce, come sul telefono solo
      if (online) riga("Gli indizi", "indizi", [{ v: "scritti", i: "✍️", t: "Scritti di nascosto" }, { v: "voce", i: "🗣️", t: "A voce" }]);
      // 🔪 a eliminazione (alla Undercover): e lì, da 7 giocatori, 👥 due impostori (che si conoscono o no), affiancati
      riga("Come si vota", "voto", [{ v: "una", i: "🗳️", t: "Una volta" }, { v: "elim", i: "🔪", t: "A eliminazione" }]);
      var nGioc = Array.isArray(aiuti.giocatori) ? aiuti.giocatori.length : 0;
      var puoDue = online || !nGioc || nGioc >= 7;   // (online quanti sarete si sa solo al via: la scelta c'è sempre, con la nota)
      var boxDue = el("div", { style: "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 10px" });
      var colImp = el("div", { style: "min-width:0" }), colCon = el("div", { style: "min-width:0" });
      boxDue.appendChild(colImp); boxDue.appendChild(colCon); box.appendChild(boxDue);
      riga("Impostori", "nimp", [{ v: 1, i: "🕵️", t: "1" }, { v: 2, i: "👥", t: "2" }], colImp);
      riga("Si conoscono", "conosce", [{ v: "si", i: "🤝", t: "Sì" }, { v: "no", i: "🤫", t: "No" }], colCon);
      var nota = el("p", { class: "modulo-nota", style: "margin:8px 0 0" });
      box.appendChild(nota);

      // il resto (mani, tempo e categorie) sta in una parte che si apre: in alto restano le scelte principali
      var altro = el("div", { hidden: "hidden" }), riassunto = el("span", { class: "imp-altro-r" });
      var apri = el("button", { class: "imp-altro", type: "button", "aria-expanded": "false", onclick: function () {
        var su = altro.hidden; altro.hidden = !su; apri.setAttribute("aria-expanded", su ? "true" : "false");
        freccia.textContent = su ? "▴" : "▾";
      } }), freccia = el("b", { text: "▾" });
      apri.appendChild(el("b", { text: "Altre scelte", style: "flex:none" }));
      apri.appendChild(riassunto);
      apri.appendChild(freccia);
      apri.style.cssText = "display:flex;align-items:center;gap:10px;width:100%;margin-top:12px;padding:12px 14px;border:0;border-radius:14px;" +
        "background:var(--carta);color:inherit;font:inherit;text-align:left;cursor:pointer";
      riassunto.style.cssText = "flex:1;min-width:0;font-size:.85rem;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
      box.appendChild(apri);
      box.appendChild(altro);
      riga("Mani", "mani", [{ v: 1, t: "1 mano" }, { v: 3, t: "3 mani" }, { v: 5, t: "5 mani" }], altro);
      var boxGiri = el("div");
      if (online) { riga("Giri di indizi", "giri", [{ v: 1, t: "1 giro" }, { v: 2, t: "2 giri" }, { v: 3, t: "3 giri" }], boxGiri); altro.appendChild(boxGiri); }
      riga(online ? "Tempo per discutere" : "Tempo per parlare", "tempo", [{ v: 0, i: "♾️", t: "Libero" }, { v: 60, t: "1 min" }, { v: 120, t: "2 min" }, { v: 180, t: "3 min" }], altro);
      var notaTempo = online ? el("p", { class: "modulo-nota", style: "margin:6px 0 0", text: "Libero: si vota quando più di metà tocca «🗳️ Votiamo» (al massimo 5 minuti)." }) : null;
      if (notaTempo) altro.appendChild(notaTempo);

      // categorie: tocca per togliere o rimettere (almeno una resta)
      altro.appendChild(el("div", { class: "etichetta", text: "Categorie" }));
      var gc = el("div", { class: "cat-griglia", style: "gap:8px" }), chipCat = [];
      var tutte = el("button", { class: "cat-chip", style: CHIP, onclick: function () { dove.cat = null; aggiorna(); salva(); } },
        [el("span", { class: "ci", text: "🎲" }), el("span", { text: "Tutte" })]);
      gc.appendChild(tutte);
      cats.forEach(function (c) {
        var b = el("button", { class: "cat-chip", style: CHIP, onclick: function () {
          var sel = dove.cat ? dove.cat.slice() : [];
          var i = sel.indexOf(c.id);
          if (!dove.cat) sel = [c.id];                 // da "Tutte" si passa a solo questa
          else if (i >= 0) sel.splice(i, 1); else sel.push(c.id);
          dove.cat = (!sel.length || sel.length === cats.length) ? null : sel;
          aggiorna(); salva();
        } }, [el("span", { class: "ci", text: c.icona }), el("span", { text: c.nome })]);
        b._id = c.id; chipCat.push(b); gc.appendChild(b);
      });
      altro.appendChild(gc);
      var contaCat = el("p", { class: "modulo-nota", style: "margin:8px 0 0" });
      altro.appendChild(contaCat);

      function aggiorna() {
        for (var ch in gruppi) gruppi[ch].forEach(function (b) {
          var off = ch === "aiuto" && b._v === "simile" && dove.spia !== "no";
          b.disabled = off; b.style.opacity = off ? ".4" : "";
          b.className = "cat-chip" + (dove[ch] === b._v ? " attiva" : "");
        });
        var testi = {
          simile: "L'impostore riceve una parola simile ma diversa: può mimetizzarsi.",
          categoria: "L'impostore non ha la parola, ma sa la categoria (per esempio 🍕 Cibo).",
          buio: "L'impostore non ha nessun aiuto: ascolta e bluffa."
        };
        var s = testi[dove.aiuto];
        if (dove.spia === "sa") s += " La spia ha una parola simile e lo sa.";
        if (dove.spia === "nonsa") s += " La spia ha una parola simile ma crede di avere quella giusta!";
        if (dove.spia !== "no") s += " (La spia c'è da 4 giocatori in su; la parola simile va a lei, quindi l'impostore non la riceve.)";
        if (online) s += dove.indizi === "voce" ? " Gli indizi si dicono a voce, a turno: giocate vicini o in chiamata." : " Gli indizi si scrivono di nascosto e si svelano tutti insieme.";
        var elim = dove.voto === "elim", due = elim && puoDue && +dove.nimp === 2;
        if (elim) s += " 🔪 A eliminazione: dopo ogni voto il più votato esce e si scopre chi era; si continua con la stessa parola finché l'impostore è fuori o restate in 2." +
          (online && dove.indizi !== "voce" ? " Un indizio a testa per ogni giro." : "");
        if (due) s += " 👥 2 impostori da 7 giocatori (con meno ce n'è uno solo)" + (dove.conosce === "si" ? ": ognuno vede chi è l'altro." : ": non sanno chi è l'altro.") +
          (dove.spia !== "no" ? " Con 2 impostori la spia c'è da 8 giocatori." : "");
        nota.textContent = s;
        boxDue.style.display = elim && puoDue ? "grid" : "none";   // (non "hidden": lo stile in linea "display:grid" vincerebbe)
        colCon.style.visibility = due ? "" : "hidden";   // (resta il suo posto: la pagina non salta)
        boxGiri.hidden = !online || dove.indizi === "voce" || elim;
        if (notaTempo) notaTempo.hidden = dove.tempo !== 0;
        tutte.className = "cat-chip" + (!dove.cat ? " attiva" : "");
        chipCat.forEach(function (b) { b.className = "cat-chip" + (dove.cat && dove.cat.indexOf(b._id) >= 0 ? " attiva" : ""); });
        var n = 0; cats.forEach(function (c) { if (!dove.cat || dove.cat.indexOf(c.id) >= 0) n += c.coppie.length; });
        contaCat.textContent = n + " coppie di parole in gioco";
        var nc = dove.cat ? dove.cat.length : 0;
        riassunto.textContent = (dove.mani > 1 ? dove.mani + " mani" : "1 mano") + " · " +
          (online && dove.indizi !== "voce" && !elim ? (dove.giri > 1 ? dove.giri + " giri" : "1 giro") + " · " : "") +
          (dove.tempo ? "⏱️ " + Math.round(dove.tempo / 60) + " min" : "⏱️ libero") + " · " +
          (nc ? nc + (nc === 1 ? " categoria" : " categorie") : "tutte le categorie");
      }
      aggiorna();
    },

    avvia: function (t) {
      stile();   // (le classi di colore servono anche alle schermate sullo stesso telefono)
      var cats = categorie();
      if (!cats.length) return niente(t);
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito (o dalla Sala)
      if (t.impostazioni && t.impostazioni.modo === "online") return host(t);
      var st = {
        R: regoleDa(t.impostazioni),
        cats: cats,
        g: t.giocatori.map(function (nm) { return { nome: nm, punti: 0, voto: null, piu: 0 }; }),
        mano: 0
      };
      nuovaMano(t, st);
    }
  });

  function niente(t) {
    var s = t.schermata({ icona: "🕵️", titolo: "Mancano le parole", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "Le parole del gioco non sono state caricate." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---- pesca una coppia: dalle categorie scelte, evitando quelle uscite di recente ----
  function pescaCoppia(st) {
    var pool = [];
    st.cats.forEach(function (c) { if (!st.R.cat || st.R.cat.indexOf(c.id) >= 0) pool = pool.concat(c.coppie); });
    if (!pool.length) st.cats.forEach(function (c) { pool = pool.concat(c.coppie); });
    var usate = leggi(CHIAVE_USATE); if (!Array.isArray(usate)) usate = [];
    var nuove = pool.filter(function (p) { return usate.indexOf(p.a) < 0; });
    var c = (nuove.length ? nuove : pool)[rnd((nuove.length ? nuove : pool).length)];
    usate = usate.filter(function (x) { return x !== c.a; }); usate.push(c.a);
    scrivi(CHIAVE_USATE, usate.slice(-Math.min(200, Math.max(1, pool.length - 5))));   // le ultime ~200 non tornano
    return c;
  }
  function categoria(st, id) { return st.cats.filter(function (c) { return c.id === id; })[0]; }

  function nuovaMano(t, st) {
    st.mano++;
    var n = st.g.length, R = st.R;
    st.g.forEach(function (gg) { gg.voto = null; gg.piu = 0; });
    var c = pescaCoppia(st), giro = Math.random() < 0.5;   // una volta su due le due parole si scambiano
    st.parola = giro ? c.b : c.a; st.simile = giro ? c.a : c.b; st.cat = c.cat;
    st.impostore = rnd(n);
    st.imps = [st.impostore];
    if (quantiImp(R, n) === 2) { var i2; do { i2 = rnd(n); } while (i2 === st.impostore); st.imps.push(i2); }
    st.spia = -1;
    if (spiaPossibile(R, n, st.imps.length)) { do { st.spia = rnd(n); } while (st.imps.indexOf(st.spia) >= 0); }
    // 🔪 a eliminazione: chi è fuori (in ordine), il giro, i pareggi di fila, il ballottaggio e i giri in cui ogni impostore è restato dentro
    st.elim = R.voto === "elim";
    st.fuori = []; st.turno = 1; st.pari = 0; st.ballo = null; st.sopr = {}; st.ricevuti = []; st.giusti = {}; st.ultimoFuori = null;
    st.g.forEach(function () { st.ricevuti.push(0); });
    st.aiuto = (R.aiuto === "simile" && st.spia >= 0) ? "categoria" : R.aiuto;   // con la spia la parola simile è sua
    st.indovinato = false;
    // chi inizia è a caso, ma l'impostore apre di rado (posizione più difficile):
    // se il sorteggio lo pesca, nel 60% dei casi passo la mano a un altro.
    var ini = rnd(n);
    if (ini === st.impostore && Math.random() < 0.6) { do { ini = rnd(n); } while (ini === st.impostore); }
    st.iniziante = ini;
    rivela(t, st, 0);
  }

  // ---- passaggio del telefono (con l'uscita e senza tocchi doppi) ----
  function passa(t, nome, quando) {
    var el = t.el;
    var s = t.schermata({ indietro: uscita(t) });
    s._contenuto.style.display = "flex";
    s._contenuto.appendChild(el("div", { class: "passa" }, [
      el("div", { class: "emoji", text: "🤝" }),
      el("p", { class: "tenue", text: "Passa il telefono a" }),
      el("div", { class: "grande", style: "overflow-wrap:anywhere", text: nome })
    ]));
    s._piede.appendChild(tasto(t, "Sono " + nome + " ▶", "btn-primario", quando));
    t.mostra(s);
  }

  // ---- rivelazione segreta, uno alla volta ----
  function rivela(t, st, i) {
    if (i >= st.g.length) return siComincia(t, st);
    passa(t, st.g[i].nome, function () { schermataRuolo(t, st, i); });
  }

  // cosa vede ognuno: stessa forma e stessi colori per tutti, cambia solo il testo
  function ruolo(st, i) {
    var due = st.imps.length > 1, socio = due && st.R.conosce === "si" ? st.g[st.imps[0] === i ? st.imps[1] : st.imps[0]].nome : null;
    return ruoloInfo({ imp: st.imps.indexOf(i) >= 0, spia: i === st.spia, spiaSa: st.R.spia === "sa", aiuto: st.aiuto, parola: st.parola, simile: st.simile, cat: categoria(st, st.cat),
      due: due, socio: socio });
  }

  function schermataRuolo(t, st, i) {
    var el = t.el, info = ruolo(st, i);
    var s = t.schermata({ icona: "🤫", titolo: st.g[i].nome, sotto: "Solo tu puoi guardare", indietro: uscita(t) });
    s._contenuto.style.cssText = "display:flex;flex-direction:column";
    var STRATO = "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px;text-align:center;transition:opacity .12s";
    // 🤍 la carta: il dorso è scuro con un filo d'oro, il fronte (la parola) è avorio con la cornice dorata
    var coperta = el("div", { class: "im-rl-dorso", style: STRATO }, [
      el("div", { class: "im-rl-dito", text: "👆" }),
      el("div", { class: "im-rl-dt", text: "Tieni premuto qui per vedere" }),
      el("div", { class: "im-rl-dn", text: "Quando lasci il dito si nasconde" })
    ]);
    var dentro = el("div", { class: "im-rl-fronte", style: STRATO + ";opacity:0" }, [
      el("div", { class: "im-rl-su", text: info.su }),
      el("div", { class: "im-rl-parola", style: "font-size:" + (info.grande.length > 16 ? "1.9rem" : "2.7rem") + ";overflow-wrap:anywhere", text: info.grande }),
      el("div", { class: "im-rl-giu", text: info.giu }),
      info.socio ? el("div", { class: "im-rl-socio", text: info.socio }) : null
    ]);
    var carta = el("div", { class: "im-rl-carta", style: "position:relative;flex:1;min-height:220px;border-radius:22px;" +
      "-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;cursor:pointer;overflow:hidden" }, [coperta, dentro]);
    s._contenuto.appendChild(carta);

    var ok = tasto(t, "Ho capito, avanti ▶", "btn-primario", function () { rivela(t, st, i + 1); });
    ok.style.visibility = "hidden";   // compare solo dopo aver visto il ruolo
    s._piede.appendChild(ok);

    var premuto = false;
    function vedi(v) { coperta.style.opacity = v ? "0" : "1"; dentro.style.opacity = v ? "1" : "0"; }
    carta.addEventListener("pointerdown", function (e) {
      e.preventDefault(); premuto = true; vedi(true);
      try { carta.setPointerCapture(e.pointerId); } catch (x) {}
    });
    function lascia() {
      if (!premuto) return; premuto = false; vedi(false);
      if (ok.style.visibility === "hidden") { ok.style.visibility = "visible"; ok.sveglia(); }
    }
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) { carta.addEventListener(ev, lascia); });
    carta.addEventListener("contextmenu", function (e) { e.preventDefault(); });   // niente menu col dito premuto a lungo
    t.mostra(s);
  }

  // ---- si parla: chi inizia, il giro e (se scelto) il tempo ----
  function siComincia(t, st) {
    var el = t.el, n = st.g.length, R = st.R, elim = st.elim;
    var sotto = elim ? (st.turno > 1 ? "Stessa parola, chi resta rifà il giro" : "Tutti hanno visto la parola") : R.mani > 1 ? "Mano " + st.mano + " di " + R.mani : "Tutti hanno visto la parola";
    if (elim && R.mani > 1) sotto += " · mano " + st.mano + " di " + R.mani;
    var s = t.schermata({ icona: elim ? "🔪" : "🎬", titolo: elim ? "Giro " + st.turno : "Si comincia!", indietro: uscita(t), sotto: sotto });
    var nImp = st.imps.length;
    var ruoli = "🕵️ " + nImp + (nImp > 1 ? " impostori" : " impostore") + (st.spia >= 0 ? " · 🎭 1 spia" + (R.spia === "nonsa" ? " (che non lo sa!)" : "") : "");
    // il giro dei turni, partendo da chi inizia (a eliminazione: solo chi è dentro, e a ogni giro parte il seguente)
    var giroIdx = [];
    for (var k = 0; k < n; k++) { var ix = (st.iniziante + k) % n; if (!elim || !fuoriL(st, ix)) giroIdx.push(ix); }
    if (elim && giroIdx.length) { var sh = (st.turno - 1) % giroIdx.length; giroIdx = giroIdx.slice(sh).concat(giroIdx.slice(0, sh)); }
    s._contenuto.appendChild(el("div", { style: "text-align:center" }, [
      el("div", { class: "modulo-nota", style: "margin:0 0 10px;font-weight:700", text: "In gioco: " + ruoli }),
      el("p", { class: "modulo-nota", style: "margin:0", text: "Inizia" }),
      el("div", { class: "im-inizia-l", style: "font-size:2.4rem;overflow-wrap:anywhere", text: st.g[giroIdx[0]].nome })
    ]));
    var giro = el("div", { style: "display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0" });
    giroIdx.forEach(function (ix, k) {
      giro.appendChild(el("span", { class: "im-pill" + (k === 0 ? " primo" : ""), style: "padding:5px 10px;border-radius:999px;font-size:.9rem;font-weight:700;max-width:46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: (k + 1) + ". " + st.g[ix].nome }));
    });
    s._contenuto.appendChild(giro);
    if (elim && st.fuori.length) s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin:0 0 10px;font-weight:700",
      text: "🚪 Fuori: " + st.fuori.map(function (f) { return st.g[f.i].nome + " " + iconaRuolo(f.ruolo); }).join(", ") }));
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin:0 0 12px",
      text: elim ? "A turno dite a voce UNA parola nuova legata alla vostra, senza svelarla. Poi discutete: chi esce?" : "A turno dite a voce UNA parola legata alla vostra, senza svelarla. Poi discutete: chi bluffa?" }));
    if (R.tempo > 0) s._contenuto.appendChild(orologio(t, R.tempo));
    s._piede.appendChild(tasto(t, "Andiamo a votare ▶", "btn-primario", function () { if (elim) votaE(t, st); else vota(t, st, 0); }));
    t.mostra(s);
  }

  // il tempo per parlare: parte quando lo toccate, si aggiorna solo la scritta
  function orologio(t, sec) {
    var el = t.el, fine = 0, timer = null, ultimo = -1;
    function mmss(x) { return Math.floor(x / 60) + ":" + ("0" + (x % 60)).slice(-2); }
    var b = el("button", { class: "btn im-orol", style: "font-size:1.4rem;font-weight:900;font-variant-numeric:tabular-nums", text: "⏱️ Avvia il tempo · " + mmss(sec) });
    b.addEventListener("click", function () {
      if (timer) return;
      fine = Date.now() + sec * 1000; tic(880);
      timer = setInterval(passo, 250); passo();
    });
    function passo() {
      if (!document.body.contains(b)) { clearInterval(timer); return; }
      var resta = Math.max(0, Math.ceil((fine - Date.now()) / 1000));
      b.textContent = resta > 0 ? "⏱️ " + mmss(resta) : "⏰ Tempo scaduto: si vota!";
      if (resta === ultimo) return;   // la scritta cambia solo quando cambia il secondo
      ultimo = resta;
      if (resta > 0 && resta <= 5) tic(700);
      if (resta === 0) { clearInterval(timer); b.classList.add("scaduto"); fanfara(false); }
    }
    return b;
  }

  // ---- votazione: ognuno indica in segreto chi crede sia l'impostore ----
  function vota(t, st, i) {
    if (i >= st.g.length) return spoglio(t, st);
    passa(t, st.g[i].nome, function () { schermataVoto(t, st, i); });
  }

  function schermataVoto(t, st, i) {
    var el = t.el, n = st.g.length;
    var s = t.schermata({ icona: "🗳️", titolo: st.g[i].nome + ", chi accusi?", sotto: "Vota in segreto: chi è l'impostore?", indietro: uscita(t) });
    var g = el("div", { style: "display:grid;gap:8px;grid-template-columns:" + (n - 1 > 5 ? "1fr 1fr" : "1fr") });
    st.g.forEach(function (gg, k) {
      if (k === i) return;
      g.appendChild(tasto(t, gg.nome, "", function () { st.g[i].voto = k; vota(t, st, i + 1); }));
    });
    [].forEach.call(g.children, function (b) { b.style.cssText = "font-size:1.1rem;padding:12px 10px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block"; });
    s._contenuto.appendChild(g);
    t.mostra(s);
  }

  // conti dei voti: il più votato DA SOLO viene accusato (col pareggio nessuno)
  function conta(st) { return contaVoti(st.g.length, st.g.map(function (gg) { return gg.voto; })); }

  // ---- lo spoglio: i voti escono uno alla volta, poi il verdetto ----
  function spoglio(t, st) {
    var el = t.el, n = st.g.length, V = conta(st);
    st.V = V;
    var s = t.schermata({ icona: "📮", titolo: "Lo spoglio", sotto: "Quanti voti ha preso ognuno", indietro: uscita(t) });
    var griglia = el("div", { style: "display:grid;gap:6px;grid-template-columns:" + (n > 6 ? "1fr 1fr" : "1fr") });
    var bolle = st.g.map(function (gg, k) {
      var bolla = el("span", { class: "im-bolla", style: "min-width:34px", text: "·" });
      var riga = el("div", { class: "im-sp-r", style: "padding:7px 10px" }, [
        el("span", { style: "font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: gg.nome }), bolla ]);
      griglia.appendChild(riga);
      return { bolla: bolla, riga: riga };
    });
    s._contenuto.appendChild(griglia);
    var verdetto = el("div", { style: "text-align:center;margin-top:14px;opacity:0;transform:scale(.9);transition:opacity .3s, transform .3s" });
    var esito1 = el("div", { class: "modulo-nota", style: "margin:0;font-weight:700" });
    var esito2 = el("div", { class: "im-v2l", style: "line-height:1.2;margin-top:4px;opacity:0;transform:translateY(8px);transition:opacity .35s, transform .35s" });
    verdetto.appendChild(esito1); verdetto.appendChild(esito2);
    s._contenuto.appendChild(verdetto);
    var avanti = tasto(t, "Avanti ▶", "btn-primario", function () {
      if (V.accusato === st.impostore) ultimaPossibilita(t, st); else esito(t, st);
    });
    avanti.style.visibility = "hidden";
    s._piede.appendChild(avanti);
    t.mostra(s);

    var passi = 0;
    function dopo(ms, fn) { setTimeout(function () { if (document.body.contains(s)) fn(); }, ms); }
    st.g.forEach(function (gg, k) {
      dopo(450 + k * 330, function () {
        bolle[k].bolla.textContent = V.conte[k]; bolle[k].bolla.style.transform = "scale(1.35)";
        setTimeout(function () { bolle[k].bolla.style.transform = ""; }, 200);
        tic(500 + V.conte[k] * 90);
      });
      passi = 450 + k * 330;
    });
    dopo(passi + 500, function () {
      V.piu.forEach(function (k) { bolle[k].riga.classList.add("piu"); });
      if (V.accusato < 0) {
        esito1.textContent = V.piu.length ? "Pareggio nei voti!" : "Nessun voto";
        esito2.textContent = "🤝 Nessuno viene accusato";
      } else {
        esito1.textContent = "Il più votato è " + st.g[V.accusato].nome + "…";
        esito2.textContent = V.accusato === st.impostore ? "🕵️ ed è l'impostore!" : V.accusato === st.spia ? "🎭 ed è la spia!" : "😇 ed è innocente!";
      }
      verdetto.style.opacity = "1"; verdetto.style.transform = "none";
      rullo();
    });
    dopo(passi + 1900, function () {
      esito2.style.opacity = "1"; esito2.style.transform = "none";
      fanfara(V.accusato === st.impostore || V.accusato === st.spia);
      avanti.style.visibility = "visible"; avanti.sveglia();
    });
  }

  // ---- ultima possibilità: l'impostore scoperto prova a indovinare la parola (a eliminazione: chi è appena uscito) ----
  function ultimaPossibilita(t, st, chi) {
    var el = t.el, elim = st.elim;
    if (chi == null) chi = st.impostore;
    var nome = st.g[chi].nome;
    var s = t.schermata({ icona: "🎯", titolo: elim ? fraseRuolo(nome, "imp", st.imps.length) : "Ultima possibilità!",
      sotto: elim ? "Ultima possibilità: " + nome + ", indovina la parola degli altri" : nome + ", indovina la parola degli altri", indietro: uscita(t) });
    if (elim) vibra([30, 40, 30]);   // la rivelazione del ruolo
    var scelte = scelteUltima(st.cats, st.cat, st.parola, st.simile);
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center",
      text: elim ? (st.imps.length > 1 ? "Se indovini, vincete tu e l'altro impostore. Gli altri: niente aiutini!" : "Se indovini, vinci tu. Gli altri: niente aiutini!")
        : "Se indovini ti salvi e prendi 2 punti. Gli altri: niente aiutini!" }));
    var g = el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px" });
    var esito1 = el("div", { style: "text-align:center;font-size:1.4rem;font-weight:900;margin-top:14px;min-height:2em" });
    var avanti = tasto(t, "Vedi il risultato ▶", "btn-primario", function () { if (elim) dopoUltimaE(t, st, chi); else esito(t, st); });
    avanti.style.visibility = "hidden";
    var scelto = false;
    var bottoni = scelte.map(function (w) {
      var b = tasto(t, w, "im-scl", function () {
        if (scelto) return; scelto = true;
        st.indovinato = w === st.parola;
        // a eliminazione, se resta dentro un altro impostore la parola NON si svela (la saprebbe anche lui)
        var svela = !elim || st.indovinato || !!fineElim(viviL(st), st.imps);
        bottoni.forEach(function (x) {
          x.disabled = true;
          if (x._w === st.parola && svela) { x.classList.add("giusta"); x.disabled = false; }
        });
        if (!st.indovinato) { b.classList.add("sbagliata"); b.disabled = false; }
        esito1.textContent = st.indovinato ? (elim ? (st.imps.length > 1 ? "🎯 Indovinata! Vincono gli impostori!" : "🎯 Indovinata! Vince l'impostore!") : "🎯 Indovinata! Si salva!") : "❌ Sbagliato!" + (svela ? " La parola era " + st.parola : " La parola resta segreta");
        fanfara(st.indovinato);
        avanti.style.visibility = "visible"; avanti.sveglia();
      });
      b._w = w;
      b.style.cssText = "font-size:1rem;padding:12px 8px;min-width:0;overflow-wrap:anywhere;line-height:1.15";
      g.appendChild(b); return b;
    });
    s._contenuto.appendChild(g);
    s._contenuto.appendChild(esito1);
    s._piede.appendChild(avanti);
    t.mostra(s);
  }

  // ---- statistiche per i trofei: conta SOLO chi ha il profilo attivo sul telefono ----
  function salvaTrofei(st, salvo) {
    var prof = window.SGNube && SGNube.disponibile() && SGNube.profilo();
    if (!prof) return;
    var io = -1;
    st.g.forEach(function (gg, k) { if (io < 0 && stessoNome(gg.nome, prof.nome)) io = k; });
    if (io < 0) return;
    contaTrofei({ io: io, impostore: st.impostore, spia: st.spia, voti: st.g.map(function (gg) { return gg.voto; }), conte: st.V.conte, accusato: st.V.accusato,
      aiuto: st.aiuto, iniziante: st.iniziante, ultima: st.mano >= st.R.mani, salvo: salvo }, st);
  }
  // i contatori di una mano per il giocatore "io" (indice). mem tiene la serie tra le mani (il cloud può arrivare in ritardo)
  function contaTrofei(d, mem) {
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    if (mem.serie == null) mem.serie = (SGNube.statGioco("impostore") || {}).serieSmascheratiOra || 0;
    var serie = mem.serie, io = d.io;
    var c = {}, conParola = d.aiuto === "simile", buio = d.aiuto === "buio";
    if (d.ultima) c.partite = 1;   // la partita conta una volta sola, all'ultima mano
    if (io === d.impostore) {
      if (conParola) c.impostoreConAiuto = 1;
      if (d.salvo) {
        c.vinteImpostore = 1;
        if (conParola) c.vinteImpAiutoOn = 1; else if (buio) c.vinteImpAiutoOff = 1;
        if (d.conte[io] === 0) { c.vinteImp0Voti = 1; if (buio) c.vinteImpPerfette = 1; }   // nessuno ti ha votato
        if (d.iniziante === io) c.vinteImpApertura = 1;                                      // e aprivi pure il giro
      }
    } else {
      if (d.voti[io] === d.impostore) { c.smascherati = 1; if (conParola) c.smascheratiControAiuto = 1; serie++; }
      else serie = 0;
      if (d.accusato === io && io !== d.spia) c.innocenteAccusato = 1;   // il più votato, ma innocente
    }
    mem.serie = serie;
    var incrs = []; for (var k in c) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(null, "impostore", incrs, [["serieSmascheratiMax", serie]], [["serieSmascheratiOra", serie]]);
  }

  // ---- esito della mano + punti ----
  function esito(t, st) {
    var el = t.el, V = st.V, R = st.R, n = st.g.length;
    var scoperto = V.accusato === st.impostore, salvo = !scoperto || st.indovinato;
    var pm = puntiMano(n, st.g.map(function (gg) { return gg.voto; }), st.impostore, st.spia, V.accusato, st.indovinato);
    st.g.forEach(function (gg, k) { gg.piu = pm[k]; gg.punti += pm[k]; });
    salvaTrofei(st, salvo);

    var te = testiEsito(V.accusato, st.impostore, st.spia, st.indovinato), titolo = te.titolo, icona = te.icona, sotto = te.sotto;
    var ultima = st.mano >= R.mani;
    var s = t.schermata({ icona: icona, titolo: titolo, sotto: sotto + (R.mani > 1 ? " · mano " + st.mano + " di " + R.mani : ""), indietro: uscita(t) });

    // chi era chi e le parole, in due righe
    var svela = [
      el("div", { class: "chi", style: "overflow-wrap:anywhere", text: "🕵️ " + st.g[st.impostore].nome +
        (st.spia >= 0 ? "   🎭 " + st.g[st.spia].nome : "") }),
      el("div", { class: "modulo-nota", style: "margin:2px 0 0;font-size:.95rem" }, [ "Parola: ", el("b", { style: "color:var(--testo)", text: st.parola }),
        (st.spia >= 0 || st.aiuto === "simile") ? (st.spia >= 0 ? " · la spia aveva " : " · l'impostore aveva ") + st.simile : null ])
    ];
    s._contenuto.appendChild(el("div", { class: "im-svela", style: "margin-bottom:8px" }, svela));

    // una riga a testa: chi ha votato chi e i punti presi
    var lista = el("div", { style: "display:flex;flex-direction:column;gap:" + (n > 6 ? "3px" : "4px") });
    st.g.forEach(function (gg, k) {
      var segno = k === st.impostore ? "🕵️" : k === st.spia ? "🎭" : "";
      var voto = gg.voto == null ? "" : "→ " + st.g[gg.voto].nome +
        (k === st.impostore ? "" : gg.voto === st.impostore ? " ✅" : gg.voto === st.spia ? " 🎭" : " ❌");
      lista.appendChild(el("div", { class: "im-es-r", style: "grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) auto" + (R.mani > 1 ? " auto" : "") +
        ";padding:" + (n > 6 ? "3px" : "7px") + " 10px;font-size:" + (n > 6 ? ".9rem" : "1rem") }, [
        el("span", { style: "font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: (segno ? segno + " " : "") + gg.nome }),
        el("span", { class: "modulo-nota", style: "margin:0;font-size:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: voto }),
        el("span", { style: "font-weight:900;color:" + (gg.piu ? "var(--verde)" : "var(--testo-tenue)"), text: "+" + gg.piu }),
        R.mani > 1 ? el("span", { style: "font-weight:900;min-width:2ch;text-align:right", text: String(gg.punti) }) : null
      ]));
    });
    s._contenuto.appendChild(lista);

    s._piede.appendChild(ultima
      ? tasto(t, "Vedi la classifica 🏆", "btn-primario", function () { t.fine(classifica(st)); })
      : tasto(t, "Prossima mano (" + (st.mano + 1) + " di " + R.mani + ") ▶", "btn-primario", function () { nuovaMano(t, st); }));
    t.mostra(s);
  }

  // classifica finale: a pari punti, stesso posto
  function classifica(st) {
    var ord = st.g.slice().sort(function (a, b) { return b.punti - a.punti; });
    return ord.map(function (x, i) {
      var pos = i + 1;
      for (var j = 0; j < i; j++) if (ord[j].punti === x.punti) { pos = j + 1; break; }
      return { nome: x.nome, punti: x.punti, pos: pos };
    });
  }

  // =========================================================
  //  🔪 A ELIMINAZIONE sullo stesso telefono: si vota (solo chi è dentro),
  //  lo spoglio, chi esce si svela; pareggio → si rifà il giro, al secondo
  //  pareggio di fila ballottaggio tra i pari (pari ancora: la sorte).
  // =========================================================
  function iconaRuolo(r) { return r === "imp" ? "🕵️" : r === "spia" ? "🎭" : "😇"; }
  function fuoriL(st, i) { return st.fuori.some(function (f) { return f.i === i; }); }
  function viviL(st) { var v = []; st.g.forEach(function (gg, i) { if (!fuoriL(st, i)) v.push(i); }); return v; }
  function ruoloL(st, i) { return st.imps.indexOf(i) >= 0 ? "imp" : i === st.spia ? "spia" : "cit"; }
  function soprL(st) { st.imps.forEach(function (i) { if (!fuoriL(st, i)) st.sopr[i] = (st.sopr[i] || 0) + 1; }); }   // un giro in più restato dentro
  function stileNomi(g) { [].forEach.call(g.children, function (b) { b.style.cssText = "font-size:1.1rem;padding:12px 10px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block"; }); }

  function votaE(t, st) {   // il voto del giro (o il ballottaggio): votano solo quelli ancora dentro
    st.g.forEach(function (gg) { gg.voto = null; });
    st.votanti = viviL(st);
    votaEi(t, st, 0);
  }
  function votaEi(t, st, pos) {
    if (pos >= st.votanti.length) return spoglioE(t, st);
    passa(t, st.g[st.votanti[pos]].nome, function () { schermataVotoE(t, st, pos); });
  }
  function schermataVotoE(t, st, pos) {
    var el = t.el, i = st.votanti[pos];
    var cand = (st.ballo || viviL(st)).filter(function (k) { return k !== i; });
    var s = t.schermata({ icona: st.ballo ? "⚖️" : "🗳️", titolo: st.g[i].nome + ", chi esce?",
      sotto: st.ballo ? "Ballottaggio: si vota solo tra i pari" : "Vota in segreto: il più votato esce", indietro: uscita(t) });
    var g = el("div", { style: "display:grid;gap:8px;grid-template-columns:" + (cand.length > 5 ? "1fr 1fr" : "1fr") });
    cand.forEach(function (k) { g.appendChild(tasto(t, st.g[k].nome, "", function () { st.g[i].voto = k; votaEi(t, st, pos + 1); })); });
    stileNomi(g);
    s._contenuto.appendChild(g);
    t.mostra(s);
  }
  // lo spoglio del giro: si vedono solo quelli che si potevano votare
  function spoglioE(t, st) {
    var el = t.el, n = st.g.length, cand = st.ballo ? st.ballo.slice() : viviL(st);
    var V = contaVoti(n, st.g.map(function (gg) { return gg.voto; }));
    var dec = decidiElim(V, !!st.ballo, st.pari, cand);
    st.dec = dec; st.V = V;
    V.conte.forEach(function (c, k) { st.ricevuti[k] += c; });
    var s = t.schermata({ icona: "📮", titolo: st.ballo ? "Il ballottaggio" : "Lo spoglio", sotto: "Giro " + st.turno + " · quanti voti ha preso ognuno", indietro: uscita(t) });
    var griglia = el("div", { style: "display:grid;gap:6px;grid-template-columns:" + (cand.length > 6 ? "1fr 1fr" : "1fr") });
    var bolle = {};
    cand.forEach(function (k) {
      var bolla = el("span", { class: "im-bolla", style: "min-width:34px", text: "·" });
      var riga = el("div", { class: "im-sp-r", style: "padding:7px 10px" }, [
        el("span", { style: "font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: st.g[k].nome }), bolla ]);
      griglia.appendChild(riga); bolle[k] = { bolla: bolla, riga: riga };
    });
    s._contenuto.appendChild(griglia);
    var verdetto = el("div", { style: "text-align:center;margin-top:14px;opacity:0;transform:scale(.9);transition:opacity .3s, transform .3s" });
    var esito1 = el("div", { class: "modulo-nota", style: "margin:0;font-weight:700" });
    var esito2 = el("div", { class: "im-v2l", style: "line-height:1.2;margin-top:4px;opacity:0;transform:translateY(8px);transition:opacity .35s, transform .35s;overflow-wrap:anywhere" });
    verdetto.appendChild(esito1); verdetto.appendChild(esito2);
    s._contenuto.appendChild(verdetto);
    var testi = testiSpoglioE(dec, V, function (k) { return st.g[k].nome; });
    var avanti = tasto(t, dec.acc >= 0 ? "Chi era? ▶" : dec.ballo ? "Al ballottaggio ▶" : "Rifate il giro ▶", "btn-primario", function () { dopoSpoglioE(t, st); });
    avanti.style.visibility = "hidden";
    s._piede.appendChild(avanti);
    t.mostra(s);
    var passi = 450;
    function dopo(ms, fn) { setTimeout(function () { if (document.body.contains(s)) fn(); }, ms); }
    cand.forEach(function (k, j) {
      passi = 450 + j * 330;
      dopo(passi, function () { bolle[k].bolla.textContent = V.conte[k]; bolle[k].bolla.style.transform = "scale(1.35)"; setTimeout(function () { bolle[k].bolla.style.transform = ""; }, 200); tic(500 + V.conte[k] * 90); });
    });
    dopo(passi + 500, function () {
      (dec.acc >= 0 ? [dec.acc] : dec.ballo || V.piu).forEach(function (k) { if (bolle[k]) bolle[k].riga.classList.add("piu"); });
      esito1.textContent = testi.v1; esito2.textContent = testi.v2;
      verdetto.style.opacity = "1"; verdetto.style.transform = "none";
      rullo();
    });
    dopo(passi + 1900, function () {
      esito2.style.opacity = "1"; esito2.style.transform = "none";
      fanfara(dec.acc >= 0);
      avanti.style.visibility = "visible"; avanti.sveglia();
    });
  }
  // le due righe del verdetto (uguali sul telefono solo e online): nome(k) dà il nome
  function elenco(l) { return l.length > 1 ? l.slice(0, -1).join(", ") + " e " + l[l.length - 1] : l.join(""); }   // "Luca, Sara e Giulia"
  function testiSpoglioE(dec, V, nome) {
    if (dec.acc == null) dec = Object.assign({}, dec, { acc: -1 });
    if (dec.sorte) return { v1: "Pari anche al ballottaggio!", v2: "🎲 La sorte sceglie " + nome(dec.acc) + ": esce!" };
    if (dec.acc !== -1) return { v1: "Il più votato è " + nome(dec.acc) + "…", v2: "🚪 Esce dalla partita!" };
    if (dec.ballo) return { v1: "Di nuovo pari!", v2: "⚖️ Ballottaggio tra " + elenco(dec.ballo.map(nome)) };
    return { v1: V.piu.length ? "Pareggio nei voti!" : "Nessun voto", v2: "🤝 Nessuno esce: si rifà il giro" };
  }
  function dopoSpoglioE(t, st) {
    var dec = st.dec; st.pari = dec.pari;
    if (dec.ballo) { st.ballo = dec.ballo; return votaE(t, st); }
    st.ballo = null;
    if (dec.acc < 0) { soprL(st); st.turno++; return siComincia(t, st); }
    var acc = dec.acc, r = ruoloL(st, acc);
    st.fuori.push({ i: acc, ruolo: r, turno: st.turno });
    if (r === "imp") {
      st.votanti.forEach(function (v) { if (st.g[v].voto === acc) st.giusti[v] = 1; });
      st.indovinato = false;
      return ultimaPossibilita(t, st, acc);
    }
    soprL(st);
    var w = fineElim(viviL(st), st.imps);
    if (w) return esitoE(t, st, w, false, acc);
    fuoriE(t, st, acc);
  }
  function dopoUltimaE(t, st, chi) {
    if (st.indovinato) return esitoE(t, st, "imp", true, null, chi);
    soprL(st);
    var w = fineElim(viviL(st), st.imps);
    if (w) return esitoE(t, st, w, false, null);
    fuoriE(t, st, chi);
  }
  // chi è uscito: il ruolo in grande, poi il giro dopo
  function fuoriE(t, st, chi) {
    var el = t.el, r = ruoloL(st, chi), vivi = viviL(st);
    var impDentro = vivi.filter(function (k) { return st.imps.indexOf(k) >= 0; }).length;
    var s = t.schermata({ indietro: uscita(t) });
    s._contenuto.style.cssText = "display:flex;flex-direction:column;justify-content:center;text-align:center;gap:10px";
    s._contenuto.appendChild(el("div", { style: "font-size:3.6rem;line-height:1", text: iconaRuolo(r) }));
    s._contenuto.appendChild(el("div", { style: "font-size:1.8rem;font-weight:900;line-height:1.15;overflow-wrap:anywhere", text: fraseRuolo(st.g[chi].nome, r, st.imps.length) }));
    if (r === "imp") s._contenuto.appendChild(el("div", { class: "modulo-nota", style: "margin:0;font-weight:700", text: "E non ha indovinato la parola" }));
    s._contenuto.appendChild(el("div", { class: "modulo-nota", style: "margin:6px 0 0;font-weight:700;font-size:1rem",
      text: "Restano in " + vivi.length + " · " + (impDentro > 1 ? "🕵️ 2 impostori ancora dentro" : r === "imp" ? "🕵️ ma c'è ancora un impostore!" : "🕵️ l'impostore è ancora dentro") }));
    s._contenuto.appendChild(el("div", { class: "modulo-nota", style: "margin:0", text: "🚪 Fuori: " + st.fuori.map(function (f) { return st.g[f.i].nome + " " + iconaRuolo(f.ruolo); }).join(", ") }));
    s._piede.appendChild(tasto(t, "Prossimo giro ▶", "btn-primario", function () { st.turno++; siComincia(t, st); }));
    t.mostra(s);
    vibra([30, 40, 30]);   // la rivelazione del ruolo
    fanfara(r !== "cit");
  }
  // fine della mano a eliminazione: chi ha vinto, chi era chi, quando è uscito ognuno e i punti
  function esitoE(t, st, vince, indovinato, ultimo, chiIndov) {
    var el = t.el, R = st.R, n = st.g.length, chi = st.g.map(function (gg, i) { return i; });
    var pm = puntiElim(chi, st.imps, st.spia, vince, st.sopr, st.fuori.map(function (f) { return f.i; }));
    st.g.forEach(function (gg, k) { gg.piu = pm[k]; gg.punti += pm[k]; });
    salvaTrofeiElim(st, vince);
    var te = testiFineElim(vince, st.imps.length, indovinato, chiIndov != null ? st.g[chiIndov].nome : null);
    var s = t.schermata({ icona: te.icona, titolo: te.titolo, sotto: te.sotto + (R.mani > 1 ? " · mano " + st.mano + " di " + R.mani : ""), indietro: uscita(t) });
    if (ultimo != null) s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:900;font-size:1.15rem;margin-bottom:6px;overflow-wrap:anywhere",
      text: fraseRuolo(st.g[ultimo].nome, ruoloL(st, ultimo), st.imps.length) }));
    s._contenuto.appendChild(el("div", { class: "im-svela", style: "margin-bottom:8px" }, [
      el("div", { class: "chi", style: "overflow-wrap:anywhere", text: "🕵️ " + st.imps.map(function (i) { return st.g[i].nome; }).join(" e ") + (st.spia >= 0 ? "   🎭 " + st.g[st.spia].nome : "") }),
      el("div", { class: "modulo-nota", style: "margin:2px 0 0;font-size:.95rem" }, [ "Parola: ", el("b", { style: "color:var(--testo)", text: st.parola }),
        (st.spia >= 0 || st.aiuto === "simile") ? (st.spia >= 0 ? " · la spia aveva " : " · l'impostore aveva ") + st.simile : null ])
    ]));
    var lista = el("div", { style: "display:flex;flex-direction:column;gap:" + (n > 6 ? "3px" : "4px") });
    st.g.forEach(function (gg, k) {
      var f = st.fuori.filter(function (x) { return x.i === k; })[0], r = ruoloL(st, k);
      lista.appendChild(el("div", { class: "im-es-r", style: "grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto" + (R.mani > 1 ? " auto" : "") +
        ";padding:" + (n > 6 ? "3px" : "7px") + " 10px;font-size:" + (n > 6 ? ".9rem" : "1rem") }, [
        el("span", { style: "font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: (r !== "cit" ? iconaRuolo(r) + " " : "") + gg.nome }),
        el("span", { class: "modulo-nota", style: "margin:0;font-size:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: f ? "🚪 fuori al " + f.turno + "° giro" : "🏁 fino alla fine" }),
        el("span", { style: "font-weight:900;color:" + (gg.piu ? "var(--verde)" : "var(--testo-tenue)"), text: "+" + gg.piu }),
        R.mani > 1 ? el("span", { style: "font-weight:900;min-width:2ch;text-align:right", text: fmtN(gg.punti) }) : null
      ]));
    });
    s._contenuto.appendChild(lista);
    var ultima = st.mano >= R.mani;
    s._piede.appendChild(ultima
      ? tasto(t, "Vedi la classifica 🏆", "btn-primario", function () { t.fine(classifica(st)); })
      : tasto(t, "Prossima mano (" + (st.mano + 1) + " di " + R.mani + ") ▶", "btn-primario", function () { nuovaMano(t, st); }));
    t.mostra(s);
    if (ultimo != null) vibra([30, 40, 30]);
    fanfara(vince === "cit");
  }
  // i trofei a eliminazione, con le stesse voci della partita normale (io, gli impostori e la spia sono "chiavi": indici o id)
  function datiTrofeiElim(o) {   // o: { io, imps, spia, giusti, ricevuti (chiave→voti presi), fuori ([{k, ruolo}]), iniziante, aiuto, ultima, vince, chi (le chiavi in ordine) }
    var ix = function (k) { return k == null ? -1 : o.chi.indexOf(k); };
    var io = ix(o.io), imp = o.imps.indexOf(o.io) >= 0 ? io : ix(o.imps[0]);
    var voti = o.chi.map(function () { return null; });
    if (o.giusti[o.io]) voti[io] = imp;   // ha votato un impostore quando è uscito
    var fuoriIo = o.fuori.filter(function (f) { return f.k === o.io; })[0];
    return { io: io, impostore: imp, spia: ix(o.spia), voti: voti, conte: o.chi.map(function (k) { return o.ricevuti[k] || 0; }),
      accusato: fuoriIo && fuoriIo.ruolo === "cit" ? io : -1, aiuto: o.aiuto, iniziante: ix(o.iniziante), ultima: o.ultima, salvo: o.vince === "imp" };
  }
  function salvaTrofeiElim(st, vince) {
    var prof = window.SGNube && SGNube.disponibile() && SGNube.profilo();
    if (!prof) return;
    var io = -1;
    st.g.forEach(function (gg, k) { if (io < 0 && stessoNome(gg.nome, prof.nome)) io = k; });
    if (io < 0) return;
    var chi = st.g.map(function (gg, i) { return i; }), ric = {};
    st.ricevuti.forEach(function (c, k) { ric[k] = c; });
    contaTrofei(datiTrofeiElim({ io: io, imps: st.imps, spia: st.spia >= 0 ? st.spia : null, giusti: st.giusti, ricevuti: ric,
      fuori: st.fuori.map(function (f) { return { k: f.i, ruolo: f.ruolo }; }), iniziante: st.iniziante, aiuto: st.aiuto, ultima: st.mano >= st.R.mani, vince: vince, chi: chi }), st);
  }

  // =========================================================
  //  ONLINE — ognuno dal suo telefono (anche nella Sala della serata).
  //  L'HOST tiene la partita vera e manda a tutti la "foto" (vm): mai
  //  segreti nella foto. Le parole vanno a un telefono solo (inviaVeloce
  //  con "to"); chi rientra le richiede ("chiedi") e le ritrova.
  //  Una mano: indizi (1-3 giri, scritti di nascosto e svelati tutti
  //  insieme; oppure a voce) → discussione → voto segreto → spoglio →
  //  ultima possibilità dell'impostore → punti. Poi la mano dopo.
  // =========================================================
  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }   // 1.000
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function trova(vm, id) { var l = (vm && vm.players) || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function presentiVm(vm) { return ((vm && vm.players) || []).filter(function (p) { return !p.via; }); }
  function setTx(n, tx) { if (n && n.textContent !== tx) n.textContent = tx; }
  var MEM = { serie: null, fatti: {} };   // trofei online: la serie tra le mani e le mani già contate (su questo telefono)

  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    // io che tengo la partita: "host", oppure (host di riserva) l'id da amico di chi ha preso il posto dell'host sparito
    var IO = t.mioId || "host";
    var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, mano: 0, R: regoleDa(t.impostazioni), cats: categorie(),
      rip: 0,        // quante volte la partita è ripresa (nelle chiavi dei conti: così ripartono da capo su tutti i telefoni)
      respiro: 0,    // dopo una ripresa, fino a quest'ora nessun momento si chiude da solo (gli amici intanto rientrano)
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0, piu: 0 }],
      guarda: [],   // nella Sala: chi non è stato scelto per giocare (guarda soltanto, col suo id nella foto): { id, nome }
      tardi: [],    // arrivati a partita cominciata: guardano ed entrano alla prossima
      passo: null, giro: 0, ordine: [], ind: {}, cor: {}, voti: {}, pronti: [], scadenza: 0, to: null,
      seg: null, V: null, vv: null, spoglio: null, ultima: null, esito: null, classifica: null,
      // 🔪 a eliminazione: il giro, chi è fuori ({ id, ruolo, turno }), i pareggi di fila, il ballottaggio (gli id dei pari),
      // i giri restati dentro di ogni impostore, i voti presi in tutta la mano, chi ha votato giusto, l'ultimo uscito
      elim: false, turno: 0, fuori: [], pari: 0, ballo: null, sopr: {}, ricevuti: {}, giusti: {}, ultimoFuori: null, dec: null };
    // ----- la partita di prima (t.ripresa): l'host ha ricaricato la pagina o riaperto l'app, oppure (daRiserva) l'host è
    // sparito e questo telefono la porta avanti. Chi giocava resta dentro "atteso" (rientra da solo col suo join, stesso id:
    // lì gli si rimanda il segreto); chi non torna in 15 secondi esce. L'host sparito (se la porto avanti io) è fuori subito
    var R0 = t.ripresa, riprendo = !!(R0 && R0.stato && R0.stato.fase && R0.stato.fase !== "lobby" && R0.stato.players), attesi = {}, tAttesi = null;
    if (riprendo) {
      H = R0.stato;
      H.to = null; H.pronta = false; H.cats = categorie(); H.rip = H.rip || 0; H.guarda = H.guarda || []; H.tardi = H.tardi || [];
      H.players.forEach(function (p) {
        p.forse = false;
        if (p.id === IO) { p.via = false; p.omino = t.mioOmino(p.nome); return; }
        if (R0.daRiserva && p.id === R0.vecchioHost) { p.via = true; return; }
        if (!p.via) attesi[p.id] = 1;
      });
      // (chi guarda e chi è arrivato tardi restano nelle loro liste: rientrano anche loro col join. Se la porto avanti io
      // guardando, resto tra chi guarda: vedo la partita come prima e alla "Nuova partita" mi siedo)
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function iDi(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return i; return -1; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    function dopo(ms, fn) { ferma(); H.to = setTimeout(function () { H.to = null; fn(); }, ms); }
    function scade(sec) { H.scadenza = Date.now() + sec * 1000; }
    // a eliminazione chi è fuori guarda: non scrive, non vota e non conta per «🗳️ Votiamo» / «⏩ Avanti» (tranne a fine mano)
    function eFuori(id) { return H.elim && H.fase === "gioco" && H.passo !== "esito" && H.fuori.some(function (f) { return f.id === id; }); }
    function vivi() { return H.players.filter(function (p) { return !H.fuori.some(function (f) { return f.id === p.id; }); }); }   // ancora dentro (anche chi è sparito un attimo)
    function attivi() { return presenti().filter(function (p) { return !eFuori(p.id); }); }
    // per «🗳️ Votiamo» / «⏩ Avanti» basta più di metà di chi ha il telefono acceso (e di chi l'ha toccato prima di bloccarlo)
    function contano() { return attivi().filter(function (p) { return !p.dorme || H.pronti.indexOf(p.id) >= 0; }); }
    function servono() { return Math.floor(contano().length / 2) + 1; }
    function guardaId(id) { return H.guarda.some(function (x) { return x.id === id; }); }
    function chiave() { return H.partita + "|" + H.mano + "|" + H.passo + "|" + H.giro + "|" + H.turno + (H.ballo ? "b" : ""); }
    function catDi(id) { return H.cats.filter(function (c) { return c.id === id; })[0] || null; }
    function prontiVeri() { return H.pronti.filter(function (id) { var p = pById(id); return p && !p.via && !eFuori(id); }); }
    function ruoloId(id) { var S = H.seg; return !S ? "cit" : S.imps.indexOf(id) >= 0 ? "imp" : id === S.spia ? "spia" : "cit"; }

    // "⚙️ Regole" nella saletta: l'host cambia le impostazioni quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.R = regoleDa(im); bd(); };

    // chi se ne va (uscito apposta, sparito da più di 20 secondi o, dopo una ripresa, non tornato in tempo: sparito = true)
    function addio(id, sparito) {
      delete attesi[id];
      if (guardaId(id)) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
      if (H.tardi.indexOf(id) >= 0) { H.tardi.splice(H.tardi.indexOf(id), 1); return; }
      var p = pById(id); if (!p || (p.via && H.fase !== "lobby")) return;
      var bloccato = sparito || p.forse;   // sparito senza salutare (schermo bloccato, app in secondo piano), non uscito apposta
      p.forse = false;
      // nella saletta si toglie e basta (i posti degli altri restano come sono)
      if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
      // 📱 a partita iniziata chi ha bloccato il telefono resta in partita col suo ruolo: lo si aspetta (prima, 20 secondi dopo
      // era fuori e con meno di 3 rimasti la partita finiva per tutti). Esce solo chi tocca «Esci» o chi dorme due mani di fila
      if (bloccato && H.fase === "gioco") {
        if (!p.dorme) { p.dorme = true; p.dormeMano = H.partita + "|" + H.mano; }
        controlla(); bd(); return;
      }
      p.via = true; p.dorme = false;   // a partita iniziata resta in classifica, ma non gioca più (se torna riprende il suo posto)
      if (H.fase === "gioco" && presenti().length < MIN_ON) return fine();
      controlla(); bd();
    }
    var rete = SGNet.ospita("impostore", {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      // la stanza non si è proprio aperta (primo collegamento): si riprova da capo. Dopo, la rete che salta la gestisce il core
      onErrore: function () {
        if (H.pronta) return;
        ferma(); clearTimeout(tAttesi); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
      onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
      onAddio: addio,
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        var ds = pById(id);
        if (ds && ds.dorme) { ds.dorme = false; if (m.t !== "join") { controlla(); bd(); } }   // 📱 ha riaperto il telefono
        if (m.t === "join") {
          delete attesi[id];   // (dopo una ripresa: è tornato)
          var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
          // nella Sala, se siete più dei posti, gioca chi ha scelto l'host: gli altri guardano (col loro id nella foto)
          if (!p && (guardaId(id) || !t.puoSedersi(id, nome))) {
            if (!guardaId(id)) H.guarda.push({ id: id, nome: nome });
            bd(); spettatore(id); return;
          }
          if (!p && H.fase === "lobby" && H.players.length < MAX_ON)
            H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino), punti: 0, piu: 0 });
          else if (!p) {   // arrivato a partita cominciata (o stanza piena): guarda ed entra alla prossima
            if (H.fase !== "lobby" && H.tardi.indexOf(id) < 0) H.tardi.push(id);
            bd(); spettatore(id); return;
          }
          // chi rientra (pagina ricaricata, telefono riacceso) ha lo STESSO id: ritrova il suo posto, i suoi punti e la sua parola
          if (p) { p.forse = false; if (!p.omino) p.omino = avatarValido(m.omino); if (p.via && H.fase === "gioco") { p.via = false; controlla(); } }
          bd();
          if (p && H.fase === "gioco") privato(id, segretoDi(id));
          return;
        }
        if (H.fase !== "gioco") return;
        if (m.t === "chiedi") { if (pById(id)) privato(id, segretoDi(id)); else spettatore(id); return; }
        var q = pById(id); if (!q || q.via) return;   // chi guarda soltanto non fa mosse
        if (m.t === "indizio") indizio(id, m.testo);
        else if (m.t === "voto") voto(id, m.chi);
        else if (m.t === "avanti") avanti(id, m.k);
        else if (m.t === "indovina") indovina(id, m.w);
      }
    }, { ripresa: riprendo });   // con la partita ripresa gli amici NON tornano in saletta (leggono "🔁 … la partita riprende")
    if (!rete) return senzaRete(t);
    if (riprendo && rete.codice) H.codice = rete.codice;

    // ----- i segreti: a un telefono solo -----
    function segretoDi(id) {
      var S = H.seg; if (!S) return null;
      // a eliminazione chi è fuori guarda: vede tutto, come chi guarda
      // (tranne l'impostore appena scoperto mentre prova a indovinare: la parola la vedrà dopo)
      if (H.elim && H.fuori.some(function (f) { return f.id === id; }) && !(H.passo === "ultima" && H.ultima && H.ultima.chi === id && H.ultima.scelto == null)) return segretoGuarda(true);
      var imp = S.imps.indexOf(id) >= 0, spia = id === S.spia, due = S.imps.length > 1;
      // 👥 due impostori che si conoscono: il nome dell'altro va SOLO a loro due (mai nella foto per tutti)
      var socio = imp && due && H.R.conosce === "si" ? (pById(S.imps[0] === id ? S.imps[1] : S.imps[0]) || {}).nome || "?" : null;
      var info = ruoloInfo({ imp: imp, spia: spia, spiaSa: H.R.spia === "sa", aiuto: S.aiuto, parola: S.parola, simile: S.simile, cat: catDi(S.cat), due: due, socio: socio });
      // "mia": la parola che ha in mano (serve al suo telefono per non fargliela scrivere come indizio)
      return { t: "seg", k: H.partita + "|" + H.mano, info: info, mia: imp ? (S.aiuto === "simile" ? S.simile : null) : spia ? S.simile : S.parola };
    }
    // chi guarda (e chi è fuori) vede tutto tenendo premuto: la parola e chi è l'impostore
    function segretoGuarda(fuori) {
      var S = H.seg, c = catDi(S.cat), ps = S.spia ? pById(S.spia) : null;
      var imp = S.imps.map(function (id) { var p = pById(id); return p ? p.nome : "?"; }).join(" e ");
      return { t: "seg", k: H.partita + "|" + H.mano, guarda: { parola: S.parola, simile: S.simile, aiuto: S.aiuto, fuori: !!fuori, due: S.imps.length > 1,
        imp: imp, spia: ps ? ps.nome : null, cat: c ? c.icona + " " + c.nome : "" } };
    }
    function spettatore(id) {
      if (H.fase !== "gioco" || !H.seg) return;
      privato(id, segretoGuarda(false));
    }
    function privato(id, m) {
      if (!m) return;
      if (id === IO) { riceviPrivato(cbHost, m); return; }
      m.to = id; rete.inviaVeloce(m);   // (con "to": non resta in stanza e gli altri telefoni lo ignorano)
    }
    // la "foto" per tutti: SEMPRE con gli id e con "fase"; MAI le parole (solo a fine mano, nell'esito)
    function vm() {
      var u = H.ultima;
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, mano: H.mano, mani: H.R.mani,
        tiene: IO, rip: H.rip,   // chi tiene la partita (la corona in saletta) e quante volte è ripresa (nelle chiavi dei conti)
        indizi: H.R.indizi, giri: H.elim ? 1 : H.R.giri, passo: H.passo, giro: H.giro, k: chiave(),
        resta: H.fase === "gioco" && H.scadenza ? Math.max(0, Math.ceil((H.scadenza - Date.now()) / 1000)) : 0,   // i secondi che mancano (non l'ora)
        ordine: H.ordine, ind: H.ind, scritto: Object.keys(H.cor), votato: Object.keys(H.voti),
        pronti: prontiVeri(), servono: servono(),
        conSpia: !!(H.seg && H.seg.spia), spiaNonSa: H.R.spia === "nonsa", nImp: H.seg ? H.seg.imps.length : 1,
        // 🔪 a eliminazione: chi è fuori e il suo ruolo (svelato a tutti), il giro, il ballottaggio, l'ultimo uscito
        elim: H.elim, turno: H.turno, fuori: H.fuori, ballo: H.ballo, ultimoFuori: H.ultimoFuori,
        spoglio: H.spoglio,
        ultima: u ? { chi: u.chi, scelte: u.scelte, scelto: u.scelto, giusto: u.giusto, parola: u.scelto != null && u.svela && H.seg ? H.seg.parola : null } : null,
        esito: H.esito, classifica: H.classifica,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, piu: p.piu || 0, via: !!p.via, forse: !!p.forse, dorme: !!p.dorme || undefined, fuori: eFuori(p.id) || undefined,
          omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }),
        guarda: H.guarda };
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); ricorda(); disegna(t, v, cbHost); vici(); }
    // la partita da ricordare (se l'host ricarica, o se la porta avanti un amico): tutto H tranne il timer e le parole del
    // gioco (cats: si rileggono), senza avatar (tornano col join), con le scadenze come ORE. I segreti (chi è l'impostore,
    // le parole) ci sono: restano su questo telefono e nella copia per il vice, mai nella foto per tutti. In saletta niente
    function ricorda() {
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {};
      Object.keys(H).forEach(function (k) { if (k !== "to" && k !== "cats") s[k] = H[k]; });
      s.players = H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, piu: p.piu || 0, via: !!p.via }; });
      t.ricorda(s);
    }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda (vede già tutto: parola e impostore), poi
    // il core aggiunge i primi arrivati
    var viciK = "";
    function vici() {
      if (!t.vici) return;
      var l = H.guarda.map(function (x) { return x.id; }).concat(H.tardi).filter(function (id, i, a) { return id !== IO && a.indexOf(id) === i; });
      var k = l.join(","); if (k === viciK) return;
      viciK = k; t.vici(l.length ? l : null);
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN_ON) return;
      H.fase = "gioco"; H.partita++; H.mano = 0; H.classifica = null; H.tardi = [];
      H.players.forEach(function (p) { p.punti = 0; p.piu = 0; });
      nuovaMano();
    }
    function nuovaMano() {
      ferma();
      H.mano++;
      var pres = presenti(), R = H.R;
      var c = pescaCoppia(H), giro = Math.random() < 0.5;   // una volta su due le due parole si scambiano
      var nImp = quantiImp(R, pres.length), imps = [], spia = null;
      while (imps.length < nImp) { var x = pres[rnd(pres.length)].id; if (imps.indexOf(x) < 0) imps.push(x); }
      if (spiaPossibile(R, pres.length, nImp)) { do { spia = pres[rnd(pres.length)].id; } while (imps.indexOf(spia) >= 0); }
      H.seg = { parola: giro ? c.b : c.a, simile: giro ? c.a : c.b, cat: c.cat, imp: imps[0], imps: imps, spia: spia,
        aiuto: (R.aiuto === "simile" && spia) ? "categoria" : R.aiuto };   // con la spia la parola simile è sua
      // chi apre il giro: a caso, ma l'impostore apre di rado (come sul telefono solo)
      var ini = rnd(pres.length);
      if (imps.indexOf(pres[ini].id) >= 0 && Math.random() < 0.6 && pres.length > imps.length) { do { ini = rnd(pres.length); } while (imps.indexOf(pres[ini].id) >= 0); }
      H.ordine = pres.slice(ini).concat(pres.slice(0, ini)).map(function (p) { return p.id; });
      H.ordine0 = H.ordine.slice();
      H.ind = {}; H.cor = {}; H.voti = {}; H.pronti = []; H.V = H.vv = H.spoglio = H.ultima = H.esito = null;
      // 🔪 a eliminazione: si riparte dal giro 1, nessuno fuori
      H.elim = R.voto === "elim"; H.turno = H.elim ? 1 : 0; H.fuori = []; H.pari = 0; H.ballo = null; H.sopr = {}; H.ricevuti = {}; H.giusti = {}; H.ultimoFuori = null; H.dec = null;
      H.players.forEach(function (p) { p.piu = 0; });
      // i segreti prima della foto: ognuno la sua parola, chi guarda il segreto intero
      H.players.forEach(function (p) { privato(p.id, segretoDi(p.id)); });
      H.guarda.forEach(function (x) { spettatore(x.id); });
      H.tardi.forEach(spettatore);
      if (R.indizi === "voce") iniziaDiscuti(); else iniziaIndizi(1);
    }
    function iniziaIndizi(g) {
      H.passo = "indizi"; H.giro = g; H.cor = {};
      var sec = T_INDIZIO + (g === 1 && H.turno <= 1 ? T_LEGGI : 0);   // al primo giro qualche secondo in più per guardare la parola
      scade(sec); dopo(sec * 1000, chiudiIndizi); bd();
    }
    function indizio(id, testo) {
      if (H.passo !== "indizi" || eFuori(id)) return;
      testo = pulisciIndizio(testo); if (!testo) return;
      var sg = segretoDi(id);
      if (sg && sg.mia && svelaParola(testo, sg.mia)) { privato(id, { t: "no", testo: "🙊 Non puoi scrivere la tua parola!" }); return; }
      H.cor[id] = testo;
      controlla(); bd();
    }
    // gli indizi del giro si svelano tutti insieme (anche "—" per chi non ha scritto). A eliminazione: uno a testa per ogni giro
    // 📱 il tempo è finito ma chi ha bloccato il telefono non ha ancora scritto o votato: lo si aspetta UNA volta T_DORME
    // secondi in più (sui telefoni accesi «⏳ Aspettiamo Giulia 📱»; appena ci sono tutti si chiude subito)
    function aspettaChiDorme(fn) {
      if (H.attesa === chiave()) return false;
      var manca = attivi().some(function (p) { return p.dorme && (H.passo === "voto" ? H.voti[p.id] == null : H.ordine.indexOf(p.id) >= 0 && H.cor[p.id] == null); });
      if (!manca) return false;
      H.attesa = chiave(); scade(T_DORME); dopo(T_DORME * 1000, fn); bd();
      return true;
    }
    function chiudiIndizi() {
      if (H.passo !== "indizi") return;
      if (aspettaChiDorme(chiudiIndizi)) return;
      H.players.forEach(function (p) {
        if (H.ordine.indexOf(p.id) < 0 && H.cor[p.id] == null) return;
        if (eFuori(p.id)) return;
        H.ind[p.id] = (H.ind[p.id] || []).concat([H.cor[p.id] || ""]);
      });
      if (!H.elim && H.giro < H.R.giri) return iniziaIndizi(H.giro + 1);
      iniziaDiscuti();
    }
    function iniziaDiscuti() {
      H.passo = "discuti"; H.giro = 0; H.pronti = [];
      var sec = (H.R.tempo || T_LIBERO) + (H.R.indizi === "voce" && H.turno <= 1 ? T_LEGGI : 0);
      scade(sec); dopo(sec * 1000, iniziaVoto); bd();
    }
    function iniziaVoto() {
      if (H.passo !== "discuti") return;
      H.passo = "voto"; H.voti = {}; H.pronti = []; H.ballo = null;
      scade(T_VOTO); dopo(T_VOTO * 1000, chiudiVoto); bd();
    }
    function voto(id, chi) {
      if (H.passo !== "voto" || chi === id || eFuori(id) || eFuori(chi)) return;
      if (H.ballo && H.ballo.indexOf(chi) < 0) return;   // al ballottaggio si vota solo tra i pari
      var q = pById(chi); if (!q) return;
      H.voti[id] = chi;
      controlla(); bd();
    }
    function chiudiVoto() {
      if (H.passo !== "voto") return;
      if (aspettaChiDorme(chiudiVoto)) return;
      var n = H.players.length;
      H.vv = H.players.map(function (p) { return H.voti[p.id] != null ? iDi(H.voti[p.id]) : null; });
      H.V = contaVoti(n, H.vv);
      var acc = H.V.accusato >= 0 ? H.players[H.V.accusato].id : null, conte = {};
      H.players.forEach(function (p, i) { conte[p.id] = H.V.conte[i]; });
      if (H.elim) return chiudiVotoElim(conte);
      H.spoglio = { conte: conte, piu: H.V.piu.map(function (i) { return H.players[i].id; }), acc: acc,
        ruolo: acc == null ? null : acc === H.seg.imp ? "impostore" : acc === H.seg.spia ? "spia" : "innocente",
        ordine: H.ordine.concat(H.players.map(function (p) { return p.id; }).filter(function (id) { return H.ordine.indexOf(id) < 0 && conte[id]; })) };
      H.passo = "spoglio"; H.giro = 0;
      var ms = 1000 + H.spoglio.ordine.length * 350 + 2600;
      H.scadenza = Date.now() + ms; bd();
      dopo(ms, dopoSpoglio);
    }
    // dopo lo spoglio (non a eliminazione): il più votato è l'impostore → l'ultima possibilità, se no la mano si chiude
    function dopoSpoglio() {
      if (H.passo !== "spoglio") return;
      if (H.elim) return dopoSpoglioElim();
      var acc = H.spoglio ? H.spoglio.acc : null;
      if (acc != null && acc === H.seg.imp) iniziaUltima(); else chiudiMano(false);
    }
    // ----- 🔪 a eliminazione: lo spoglio decide chi esce (o pareggio, ballottaggio, sorte) -----
    function chiudiVotoElim(conte) {
      // si potevano votare: quelli ancora dentro (al ballottaggio solo i pari), nell'ordine del giro
      var cand = H.ballo ? H.ballo.slice() : H.ordine.filter(function (id) { return !eFuori(id) && pById(id); });
      if (!H.ballo) vivi().forEach(function (p) { if (cand.indexOf(p.id) < 0) cand.push(p.id); });
      var candI = cand.map(iDi);
      var dec = decidiElim(H.V, !!H.ballo, H.pari, candI);
      H.players.forEach(function (p) { H.ricevuti[p.id] = (H.ricevuti[p.id] || 0) + (conte[p.id] || 0); });
      var acc = dec.acc >= 0 ? H.players[dec.acc].id : null, ballo = dec.ballo ? dec.ballo.map(function (i) { return H.players[i].id; }) : null;
      H.dec = { acc: acc, sorte: !!dec.sorte, ballo: ballo, pari: dec.pari };
      H.spoglio = { conte: conte, piu: H.V.piu.map(function (i) { return H.players[i].id; }), acc: acc, elim: true, sorte: !!dec.sorte, ballo: ballo,
        ruolo: acc == null ? null : ruoloId(acc) === "imp" ? "impostore" : ruoloId(acc) === "spia" ? "spia" : "innocente", ordine: cand, eraBallo: !!H.ballo };
      H.passo = "spoglio"; H.giro = 0;
      var ms = 1000 + cand.length * 350 + 2600;
      H.scadenza = Date.now() + ms; bd();
      dopo(ms, dopoSpoglioElim);
    }
    function dopoSpoglioElim() {
      if (H.passo !== "spoglio") return;
      var dec = H.dec; H.pari = dec.pari;
      if (dec.ballo) {   // secondo pareggio di fila: ballottaggio di 15 secondi solo tra i pari
        H.passo = "voto"; H.voti = {}; H.pronti = []; H.ballo = dec.ballo; H.spoglio = null;
        scade(T_BALLO); dopo(T_BALLO * 1000, chiudiVoto); bd(); return;
      }
      H.ballo = null;
      if (dec.acc == null) { soprElim(); return nuovoTurno(); }   // pareggio: nessuno esce, si rifà il giro
      var acc = dec.acc, r = ruoloId(acc);
      H.fuori.push({ id: acc, ruolo: r, turno: H.turno });
      if (r === "imp") {   // (la parola la vedrà dopo l'ultima possibilità)
        Object.keys(H.voti).forEach(function (v) { if (H.voti[v] === acc) H.giusti[v] = 1; });
        return iniziaUltima(acc);
      }
      privato(acc, segretoGuarda(true));   // chi esce guarda: ora vede tutto tenendo premuto
      soprElim();
      var w = fineElim(vivi().map(function (p) { return p.id; }), H.seg.imps);
      if (w) return chiudiManoElim(w, false, acc);
      iniziaFuori(acc, r);
    }
    function soprElim() { H.seg.imps.forEach(function (id) { if (!H.fuori.some(function (f) { return f.id === id; })) H.sopr[id] = (H.sopr[id] || 0) + 1; }); }
    // chi è uscito: il ruolo in grande, col conto alla rovescia e «⏩ Avanti» (si va avanti subito se lo tocca più di metà)
    function iniziaFuori(id, r, sbaglia) {
      H.ultimoFuori = { id: id, ruolo: r, turno: H.turno, sbaglia: !!sbaglia };
      H.passo = "fuori"; H.giro = 0; H.pronti = [];
      scade(T_FUORI); dopo(T_FUORI * 1000, nuovoTurno); bd();
    }
    function nuovoTurno() {
      if (H.fase !== "gioco") return;
      H.turno++; H.ballo = null; H.cor = {}; H.voti = {}; H.pronti = []; H.V = H.vv = H.spoglio = H.ultima = H.dec = null;
      // l'ordine del giro: solo chi è dentro, e a ogni giro apre il seguente
      var dentro = (H.ordine0 || H.ordine).filter(function (id) { return pById(id) && !H.fuori.some(function (f) { return f.id === id; }); });
      var sh = dentro.length ? (H.turno - 1) % dentro.length : 0;
      H.ordine = dentro.slice(sh).concat(dentro.slice(0, sh));
      if (H.R.indizi === "voce") iniziaDiscuti(); else iniziaIndizi(1);
    }
    function chiudiManoElim(vince, indovinato, ultimo) {
      var S = H.seg, chi = H.players.map(function (p) { return p.id; });
      var pm = puntiElim(chi, S.imps, S.spia, vince, H.sopr, H.fuori.map(function (f) { return f.id; }));
      H.players.forEach(function (p) { p.piu = pm[p.id] || 0; p.punti += p.piu; });
      var chiInd = indovinato && H.ultima ? (pById(H.ultima.chi) || {}).nome : null;
      var te = testiFineElim(vince, S.imps.length, indovinato, chiInd), c = catDi(S.cat);
      H.esito = { elim: true, vince: vince, titolo: te.titolo, icona: te.icona, sotto: te.sotto, imp: S.imps[0], imps: S.imps, spia: S.spia, parola: S.parola, simile: S.simile, aiuto: S.aiuto,
        cat: c ? c.icona + " " + c.nome : "", fuori: H.fuori.slice(), ultimo: ultimo ? { id: ultimo, ruolo: ruoloId(ultimo) } : null, indovinato: !!indovinato,
        ricevuti: H.ricevuti, giusti: H.giusti, iniziante: (H.ordine0 || H.ordine)[0] || null, ultima: H.mano >= H.R.mani, giocano: chi };
      H.passo = "esito"; H.giro = 0; H.pronti = []; H.ballo = null;
      scade(T_ESITO); dopo(T_ESITO * 1000, avantiEsito); bd();
    }
    // l'impostore scoperto ha un'ultima possibilità: indovinare la parola tra 6
    function iniziaUltima(chi) {
      if (chi == null) chi = H.seg.imp;
      H.ultima = { chi: chi, scelte: scelteUltima(H.cats, H.seg.cat, H.seg.parola, H.seg.simile), scelto: null, giusto: null };
      H.passo = "ultima"; H.giro = 0;
      var q = pById(chi), sec = q && !q.via ? T_ULTIMA + (q.dorme ? T_DORME : 0) : 4;   // (se è uscito, si aspetta poco; 📱 se ha il telefono bloccato, di più)
      scade(sec); dopo(sec * 1000, function () { indovina(chi, null, true); }); bd();
    }
    function indovina(id, w, scaduto) {
      var u = H.ultima;
      if (H.passo !== "ultima" || !u || id !== u.chi || u.scelto != null) return;
      if (!scaduto && u.scelte.indexOf(w) < 0) return;
      u.scelto = scaduto ? "" : w; u.giusto = !scaduto && w === H.seg.parola;
      // a eliminazione, se resta dentro un altro impostore la parola NON si svela (la saprebbe anche lui)
      u.svela = !H.elim || u.giusto || !!fineElim(vivi().map(function (p) { return p.id; }), H.seg.imps);
      scade(3); bd();
      dopo(3000, dopoIndovina);
    }
    // la parola dell'ultima possibilità è stata scelta (o il tempo è finito): si va avanti
    function dopoIndovina() {
      var u = H.ultima; if (H.passo !== "ultima" || !u || u.scelto == null) return;
      if (H.elim) dopoUltimaElim(u); else chiudiMano(u.giusto);
    }
    function dopoUltimaElim(u) {
      if (H.passo !== "ultima") return;
      if (u.giusto) return chiudiManoElim("imp", true, null);   // ha indovinato: vince lui (vincono gli impostori)
      privato(u.chi, segretoGuarda(true));   // ora che ha provato, guarda come gli altri fuori
      soprElim();
      var w = fineElim(vivi().map(function (p) { return p.id; }), H.seg.imps);
      if (w) return chiudiManoElim(w, false, null);
      iniziaFuori(u.chi, "imp", true);   // ne resta un altro: si svela e si va avanti
    }
    function chiudiMano(indovinato) {
      if (H.passo !== "spoglio" && H.passo !== "ultima") return;
      var S = H.seg, n = H.players.length, imp = iDi(S.imp), spia = S.spia ? iDi(S.spia) : -1;
      var pm = puntiMano(n, H.vv, imp, spia, H.V.accusato, !!indovinato);
      H.players.forEach(function (p, i) { p.piu = pm[i]; p.punti += pm[i]; });
      var te = testiEsito(H.V.accusato, imp, spia, !!indovinato), c = catDi(S.cat);
      H.esito = { titolo: te.titolo, icona: te.icona, sotto: te.sotto, imp: S.imp, spia: S.spia, parola: S.parola, simile: S.simile, aiuto: S.aiuto,
        cat: c ? c.icona + " " + c.nome : "", voti: H.voti, conte: H.spoglio.conte, acc: H.spoglio.acc, indovinato: !!indovinato,
        iniziante: H.ordine[0] || null, ultima: H.mano >= H.R.mani, giocano: H.players.map(function (p) { return p.id; }) };
      H.passo = "esito"; H.giro = 0; H.pronti = [];
      scade(T_ESITO); dopo(T_ESITO * 1000, avantiEsito); bd();
    }
    // «🗳️ Votiamo» e «⏩ Avanti»: si va avanti subito se lo tocca più di metà (k = il momento giusto: un tocco vecchio non vale)
    function avanti(id, k) {
      if (k && k !== chiave()) return;
      if (H.passo !== "discuti" && H.passo !== "esito" && H.passo !== "fuori") return;
      if (eFuori(id)) return;   // chi è fuori guarda: non decide
      if (H.pronti.indexOf(id) < 0) H.pronti.push(id);
      if (prontiVeri().length >= servono()) { if (Date.now() >= H.respiro) return passoPronti(); controlla(); }   // (nel respiro: dopo)
      bd();
    }
    function passoPronti() { if (H.passo === "discuti") iniziaVoto(); else if (H.passo === "fuori") nuovoTurno(); else avantiEsito(); }
    function avantiEsito() {
      if (H.fase !== "gioco" || H.passo !== "esito") return;
      if (H.mano >= H.R.mani) return fine();
      // 📱 chi ha il telefono bloccato da prima di questa mano (non si è visto per una mano intera) non riceve la parola nuova:
      // è come uscito, e se torna rientra. Chi l'ha bloccato in questa mano invece gioca anche la prossima
      var ora = H.partita + "|" + H.mano;
      H.players.forEach(function (p) { if (p.dorme && p.dormeMano !== ora) { p.dorme = false; p.via = true; } });
      if (presenti().length < MIN_ON) return fine();
      nuovaMano();
    }
    // qualcuno ha finito (o è uscito): se ci sono tutti si va avanti senza aspettare il tempo
    // (dopo una ripresa, nei primi secondi di respiro nessun momento si chiude: si ricontrolla quando il respiro finisce)
    var tRespiro = null, uscito = false;
    function controlla() {
      if (H.fase !== "gioco") return;
      var presto = (H.respiro || 0) - Date.now();
      if (presto > 0) { clearTimeout(tRespiro); tRespiro = setTimeout(function () { tRespiro = null; if (!uscito) controlla(); }, presto + 60); return; }
      var att = attivi();
      if (H.passo === "indizi" && att.every(function (p) { return H.cor[p.id] != null; })) { scade(1); dopo(900, chiudiIndizi); }
      else if (H.passo === "voto" && att.every(function (p) { return H.voti[p.id] != null; })) { scade(2); dopo(1500, chiudiVoto); }
      else if ((H.passo === "discuti" || H.passo === "esito" || H.passo === "fuori") && prontiVeri().length >= servono()) passoPronti();
    }
    function fine() {
      ferma();
      var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      H.classifica = ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
      H.fase = "fine"; H.passo = null; H.scadenza = 0; bd();
      // classifica della serata e XP: i NOMI dei giocatori col loro posto (pari merito = stesso posto)
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, tutti tornano nella saletta (chi guardava nella Sala resta a guardare)
    function nuova() {
      if (H.fase !== "fine") return;
      ferma(); H.fase = "lobby"; H.passo = null; H.mano = 0; H.classifica = null; H.tardi = [];
      H.seg = H.V = H.vv = H.spoglio = H.ultima = H.esito = null; H.ordine = []; H.ind = {}; H.cor = {}; H.voti = {}; H.pronti = []; H.scadenza = 0;
      H.elim = false; H.turno = 0; H.fuori = []; H.pari = 0; H.ballo = null; H.ultimoFuori = null; H.dec = null;
      H.players = presenti().filter(function (p) { return !p.dorme; });   // (📱 chi ha il telefono bloccato rientra col suo join)
      // chi tiene la partita è il primo (in saletta ha la corona); se l'ha presa guardando (host di riserva), si siede
      if (!pById(IO)) {
        var g0 = H.guarda.filter(function (x) { return x.id === IO; })[0];
        H.guarda = H.guarda.filter(function (x) { return x.id !== IO; });
        H.players.push({ id: IO, nome: (g0 && g0.nome) || t.nomeProfilo() || nomeHost, omino: t.mioOmino((g0 && g0.nome) || nomeHost), punti: 0, piu: 0 });
      }
      H.players.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });
      H.players.forEach(function (p) { p.punti = 0; p.piu = 0; });
      bd();   // (in saletta bd() fa t.ricorda(null): niente da riprendere)
    }
    t.onRivincita = nuova;

    // ----- la ripresa: ogni momento continua col tempo che restava (mai troppo poco), con almeno 5 secondi di respiro
    // (gli amici intanto rientrano). I punti si danno solo a fine mano (chiudiMano): una mano già chiusa resta chiusa,
    // e sulla classifica finale si resta lì (t.risultato l'aveva già dato chi teneva la partita)
    function riprendi() {
      tAttesi = setTimeout(function () { tAttesi = null; if (!uscito) Object.keys(attesi).forEach(function (id) { addio(id, true); }); }, 15000);   // (📱 forse ha solo il telefono bloccato)
      // i trofei di questa mano li avevo già contati prima di ricaricare
      if (!R0.daRiserva && H.passo === "esito") MEM.fatti[H.codice + "|" + chiave()] = 1;
      if (H.fase !== "gioco") { H.scadenza = 0; return bd(); }
      var ora = Date.now(), resta = H.scadenza ? R0.ora(H.scadenza) - ora : 0, p = H.passo, u = H.ultima, ms, fn;
      function almeno(sec) { return Math.max(resta, sec * 1000); }
      H.rip++; H.respiro = ora + 5000;
      if (p === "indizi") { ms = almeno(12); fn = chiudiIndizi; }
      else if (p === "discuti") { ms = almeno(10); fn = iniziaVoto; }
      else if (p === "voto") { ms = almeno(12); fn = chiudiVoto; }
      else if (p === "spoglio") { ms = almeno(5); fn = dopoSpoglio; }
      else if (p === "ultima" && u && u.scelto == null) { ms = almeno(10); fn = function () { indovina(u.chi, null, true); }; }
      else if (p === "ultima" && u) { ms = almeno(5); fn = dopoIndovina; }
      else if (p === "fuori") { ms = almeno(6); fn = nuovoTurno; }
      else if (p === "esito") { ms = almeno(6); fn = avantiEsito; }
      else { H.mano = Math.max(0, H.mano - 1); ms = 5000; fn = nuovaMano; }   // (un momento che non c'è: la mano si rifà, nessun punto dato)
      H.scadenza = ora + ms; dopo(ms, fn);
      // il mio segreto (la mia parola, o quello di chi guarda): gli altri lo riavranno col loro join
      if (H.seg) { if (pById(IO)) privato(IO, segretoDi(IO)); else privato(IO, segretoGuarda(false)); }
      bd();
      controlla();   // (se c'erano già tutti: si va avanti appena finisce il respiro)
    }

    var cbHost = { sonoHost: true, myId: IO, seg: null, mio: {}, vm: null, chiedi: null,
      onComincia: comincia, onNuova: nuova,
      onIndizio: function (w) { indizio(IO, w); },
      onVoto: function (chi) { voto(IO, chi); },
      onAvanti: function (k) { avanti(IO, k); },
      onIndovina: function (w) { indovina(IO, w); },
      onEsci: function () {
        // uscito apposta: niente da riprendere (t.ricorda(null)), poi si chiude la stanza
        function via() { uscito = true; ferma(); clearTimeout(tAttesi); clearTimeout(tRespiro); t.ricorda(null); rete.chiudi(); t.esci(); }
        // (dalla saletta il core ha già chiesto "Chiudere la stanza per tutti?")
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);
        via();
      } };
    window.__impHost = { H: function () { return H; }, io: IO };   // (per le prove: passo5/impostore.js)
    if (riprendo) riprendi(); else bd();
  }

  // =========================================================
  //  ONLINE — OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, nome: "", chiesto: 0 };
    function invia(m) { if (S.rete) S.rete.invia(m); }
    var cb = { sonoHost: false, myId: null, seg: null, mio: {}, vm: null,
      onIndizio: function (w) { invia({ t: "indizio", testo: w }); },
      onVoto: function (chi) { invia({ t: "voto", chi: chi }); },
      onAvanti: function (k) { invia({ t: "avanti", k: k }); },
      onIndovina: function (w) { invia({ t: "indovina", w: w }); },
      // la mia parola non è arrivata (pagina ricaricata, messaggio perso): la richiedo all'host, al massimo ogni 2,5 secondi
      chiedi: function () { if (!S.rete || Date.now() - S.chiesto < 2500) return; S.chiesto = Date.now(); invia({ t: "chiedi" }); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (cb.vm && cb.vm.fase === "gioco" && trova(cb.vm, cb.myId)) return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🕵️", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        // il "join" lo ripete il collegamento finché il mio id non compare nella foto dell'host
        onAperto: function (id) { cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== cb.myId) return;   // era per un altro telefono
          if (m.t === "vm") {
            disegna(t, m.vm, cb);
            if (m.vm.fase === "gioco" && !(cb.seg && cb.seg.k === m.vm.partita + "|" + m.vm.mano)) cb.chiedi();
          }
          else if (m.t === "seg" || m.t === "no") riceviPrivato(cb, m);
        },
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        // SOLO se il primo collegamento non è riuscito: si riprova (dopo, la rete che salta la gestisce il core)
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "🕵️", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // un messaggio solo per questo telefono: il segreto della mano, o "non puoi scrivere la tua parola"
  function riceviPrivato(cb, m) {
    if (m.t === "seg") { cb.seg = m; if (UI && UI.cb === cb && cb.vm && cb.vm.fase === "gioco") aggiornaCarta(UI, cb.vm, cb); return; }
    if (m.t === "no") {
      cb.mio.ind = null; avviso(m.testo); vibra(30);
      if (UI && UI.cb === cb && UI.fase && UI.fase.zona) UI.fase.zona();
    }
  }

  // =========================================================
  //  ONLINE — DISEGNO (uguale per host e ospiti)
  // =========================================================
  var UI = null;   // la schermata di gioco si costruisce UNA volta e poi si aggiorna a pezzi
  var FIN = null;  // la classifica finale già a schermo: le foto che arrivano dopo non la ridisegnano
  function disegna(t, vm, cb) {
    cb.vm = vm;
    if (vm.fase === "lobby") { UI = FIN = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      UI = null;
      var kf = "fine|" + vm.partita;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: finale(t, vm, cb) };
      return;
    }
    FIN = null;
    if (!UI || UI.t !== t || UI.cb !== cb || !document.body.contains(UI.s)) UI = creaSchermo(t, cb);
    aggiorna(UI, vm, cb);
  }
  function lobby(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    // (le regole scelte dall'host le scrive già il core in saletta, "📜 Si gioca così")
    var extra = [];
    if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN_ON,
      vuoti: Math.max(0, MIN_ON - vm.players.length),   // solo i posti che mancano per cominciare
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),   // (la corona a chi tiene la partita)
      extra: extra,
      spettatore: guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX_ON ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function creaSchermo(t, cb) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("im-piena");   // schermo intero: niente titolo, niente scorrimento
    var ui = { t: t, s: s, cb: cb, k: null, fase: null, tempoFine: 0, kTempo: null };
    ui.stato = el("div", { class: "im-stato" });
    ui.tempo = el("div", { class: "im-tempo" });
    ui.carta = cartaSegreta(t);
    ui.corpo = el("div", { class: "im-corpo" });
    ui.piede = el("div", { class: "im-piede" });
    ui.avviso = el("div", { class: "im-avviso" });
    var esci = el("button", { class: "im-esci", type: "button", "aria-label": "Esci", text: "‹", onclick: function () { cb.onEsci(); } });
    s._contenuto.appendChild(el("div", { class: "im-scena" }, [el("div", { class: "im-barra" }, [esci, ui.stato, ui.tempo]), ui.carta.nodo, ui.corpo, ui.piede, ui.avviso]));
    t.mostra(s);
    // il tempo che scorre (solo la scritta) e, se la mia parola non è arrivata, la richiesta all'host
    ui.timer = setInterval(function () {
      if (!document.body.contains(s)) { if (Date.now() - ui.nato > 2000) clearInterval(ui.timer); return; }
      var v = cb.vm;
      if (ui.tempoFine) {
        var r = Math.max(0, Math.ceil((ui.tempoFine - Date.now()) / 1000));
        setTx(ui.tempo, "⏱️ " + Math.floor(r / 60) + ":" + ("0" + (r % 60)).slice(-2));
        ui.tempo.classList.toggle("poco", r <= 10);
        if (r !== ui.ultimoSec && r > 0 && r <= 5 && trova(v, cb.myId)) tic(700);
        ui.ultimoSec = r;
      } else setTx(ui.tempo, "");
      if (cb.chiedi && v && v.fase === "gioco" && !(cb.seg && cb.seg.k === v.partita + "|" + v.mano)) cb.chiedi();
      if (ui.fase && ui.fase.tic) ui.fase.tic();
    }, 250);
    ui.nato = Date.now();
    return ui;
  }

  // la carta segreta: si tiene premuto per vederla (grande quando arriva la parola, poi piccola in alto)
  function cartaSegreta(t) {
    var el = t.el;
    var su = el("div", { class: "im-c-su" }), grande = el("div", { class: "im-c-grande" }), giu = el("div", { class: "im-c-giu" }), socio = el("div", { class: "im-c-socio" });
    var tx = el("span", { class: "im-c-tx" });
    var coperta = el("div", { class: "im-c-coperta" }, [el("span", { class: "im-c-dito", text: "👆" }), tx]);
    var nodo = el("div", { class: "im-carta" }, [coperta, el("div", { class: "im-c-dentro" }, [su, grande, giu, socio])]);
    var premuto = false;
    nodo.addEventListener("pointerdown", function (e) {
      e.preventDefault(); premuto = true; nodo.classList.add("su");
      try { nodo.setPointerCapture(e.pointerId); } catch (x) {}
    });
    function lascia() { if (!premuto) return; premuto = false; nodo.classList.remove("su"); }
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) { nodo.addEventListener(ev, lascia); });
    nodo.addEventListener("contextmenu", function (e) { e.preventDefault(); });   // niente menu col dito premuto a lungo
    return { nodo: nodo, su: su, grande: grande, giu: giu, socio: socio, tx: tx, sig: null };
  }
  function aggiornaCarta(ui, vm, cb) {
    var c = ui.carta, seg = cb.seg && cb.seg.k === vm.partita + "|" + vm.mano ? cb.seg : null, info, cop;
    var me = trova(vm, cb.myId);
    if (!seg) { info = { su: "", grande: "⏳", giu: "" }; cop = me && !me.fuori ? "Arriva la tua parola…" : "Arriva il segreto…"; }
    else if (seg.guarda) {
      var g = seg.guarda;
      info = { su: "Parola: " + g.parola + (g.spia ? " · la spia ha «" + g.simile + "»" : g.aiuto === "simile" ? " · l'impostore ha «" + g.simile + "»" : ""),
        grande: "🕵️ " + g.imp, giu: g.spia ? "🎭 La spia è " + g.spia : "Shh: non dirlo a chi gioca!" };
      cop = g.fuori ? "Sei fuori · tieni premuto: il segreto" : "Tieni premuto: il segreto (guardi)";
    }
    else { info = seg.info; cop = "Tieni premuto: la tua parola"; }
    var sig = JSON.stringify([info, cop]);
    if (c.sig === sig) return;
    c.sig = sig;
    setTx(c.su, info.su); setTx(c.grande, info.grande); setTx(c.giu, info.giu); setTx(c.socio, info.socio || ""); setTx(c.tx, cop);
    c.grande.classList.toggle("lunga", String(info.grande).length > 14);
    c.nodo.classList.toggle("socio", !!info.socio);   // (👥 l'altro impostore: una riga in più, a vista anche sulla carta piccola)
  }

  var TESTI_PASSO = { indizi: "✍️ Indizi", discuti: "🗣️ Discutete", voto: "🗳️ Si vota", spoglio: "📮 Lo spoglio", ultima: "🎯 Ultima prova", esito: "🏁 Fine mano", fuori: "🚪 Chi esce" };
  function aggiorna(ui, vm, cb) {
    var me = trova(vm, cb.myId), guardo = !me;
    var passo = (vm.passo === "indizi" && vm.giri > 1 ? "✍️ Indizio " + vm.giro + " di " + vm.giri : vm.passo === "voto" && vm.ballo ? "⚖️ Ballottaggio" : (TESTI_PASSO[vm.passo] || "")) +
      (vm.passo === "discuti" && vm.indizi === "voce" ? " a voce" : "");
    if (vm.elim && vm.passo !== "esito") passo = "🔪 Giro " + vm.turno + " · " + passo;   // a eliminazione: il giro
    setTx(ui.stato, (guardo ? "👀 Guardi · " : me.fuori ? "🚪 Fuori · " : "") + (vm.mani > 1 ? "Mano " + vm.mano + "/" + vm.mani + " · " : "") + passo);
    // il tempo: si riparte a ogni momento nuovo (e si corregge se l'host l'ha accorciato)
    var conTempo = vm.passo === "indizi" || vm.passo === "discuti" || vm.passo === "voto" || (vm.passo === "ultima" && vm.ultima && vm.ultima.scelto == null);
    if (!conTempo) ui.tempoFine = 0;
    else {
      var fineNuova = Date.now() + (vm.resta || 0) * 1000;
      if (ui.kTempo !== vm.k || !ui.tempoFine || Math.abs(fineNuova - ui.tempoFine) > 1600) ui.tempoFine = fineNuova;
    }
    ui.kTempo = vm.k;
    // la carta: grande quando la parola è appena arrivata, nascosta a fine mano (le parole sono svelate)
    var primo = ((vm.passo === "indizi" && vm.giro === 1) || (vm.passo === "discuti" && vm.indizi === "voce")) && !(vm.elim && vm.turno > 1);
    ui.carta.nodo.classList.toggle("grande", primo);
    ui.carta.nodo.hidden = vm.passo === "esito" || vm.passo === "fuori";
    aggiornaCarta(ui, vm, cb);
    // il momento della mano: si costruisce una volta (quando cambia), poi si aggiornano solo i pezzi
    if (vm.k !== ui.k) {
      ui.k = vm.k;
      ui.t.svuota(ui.corpo); ui.t.svuota(ui.piede);
      var f = { indizi: fIndizi, discuti: fDiscuti, voto: fVoto, spoglio: fSpoglio, ultima: fUltima, esito: vm.esito && vm.esito.elim ? fEsitoElim : fEsito, fuori: fFuori }[vm.passo];
      ui.fase = (f && f(ui, vm, cb)) || {};
      ui.corpo.scrollTop = 0;
    }
    if (ui.fase.agg) ui.fase.agg(vm);
  }

  // ---- pezzi comuni dei momenti ----
  function titolo(el, testo, sotto) { return el("div", { class: "im-tit" }, [el("b", { text: testo }), sotto ? el("small", { text: sotto }) : null]); }
  // chi guarda: una riga e le faccine
  function piedeGuarda(ui, vm, cb) {
    var el = ui.t.el, scelto = (vm.guarda || []).some(function (x) { return x.id === cb.myId; }), me = trova(vm, cb.myId);
    ui.piede.appendChild(el("p", { class: "im-conto", text: me && me.fuori ? "🚪 Sei fuori: guardi (tieni premuto in alto per il segreto)"
      : scelto ? "👀 Questa volta guardi: tieni premuto in alto per il segreto" : "👀 Guardi: alla prossima partita giochi anche tu" }));
    faccine(ui);
  }
  // gioca davvero in questo momento: è in partita e (a eliminazione) non è fuori
  function giocoIo(vm, cb) { var me = trova(vm, cb.myId); return me && !me.fuori ? me : null; }
  function faccine(ui) { var f = ui.t.faccine(); if (f) ui.piede.appendChild(f); return f; }
  // il tasto "più di metà": «🗳️ Votiamo» / «⏩ Avanti» con quanti l'hanno toccato (il mio tocco resta segnato)
  function tastoPronti(ui, vm, cb, testo, fatto) {
    var el = ui.t.el, me = trova(vm, cb.myId), k = vm.k; if (!me || me.via || me.fuori) return null;
    var tx = el("span", { class: "tx", text: testo }), q = el("span", { class: "quanti" });
    var b = el("button", { class: "btn btn-primario im-pronto", type: "button", onclick: function () {
      if (b.disabled) return;
      cb.mio.pronto = k; agg(cb.vm || vm); cb.onAvanti(k);
    } }, [tx, q]);
    function agg(v) {
      var l = v.pronti || [], mio = cb.mio.pronto === k || l.indexOf(cb.myId) >= 0, n = l.length + (mio && l.indexOf(cb.myId) < 0 ? 1 : 0);
      setTx(q, Math.min(n, v.servono || 1) + " su " + (v.servono || 1));
      setTx(tx, mio ? fatto : testo);
      b.disabled = mio;
    }
    agg(vm);
    ui.piede.appendChild(b);
    return { agg: agg };
  }
  function riempiIndizi(el, box, lista, nuovo, k) {
    lista.forEach(function (w, g) {
      var ch = el("b", { class: "im-w" + (nuovo && g === lista.length - 1 ? " nuova" : "") + (g === lista.length - 1 && lista.length > 1 ? " ultimo" : "") + (w ? "" : " vuota"), text: w || "—" });
      if (nuovo && g === lista.length - 1) ch.style.animationDelay = (k * 0.22) + "s";   // svelati tutti insieme, uno dopo l'altro
      box.appendChild(ch);
    });
  }
  // gli indizi di tutti, nell'ordine del giro (correnti: ✍️/✅ di chi sta scrivendo)
  function listaIndizi(ui, vm, cb, correnti, nuovi) {
    var el = ui.t.el, ids = (vm.ordine || []).filter(function (id) { return trova(vm, id); });
    // a eliminazione anche chi è fuori, in fondo, col suo ruolo e i suoi indizi di prima (grigio)
    var fuori = vm.elim ? (vm.fuori || []).filter(function (f) { return trova(vm, f.id) && ids.indexOf(f.id) < 0; }) : [];
    var tutti = ids.concat(fuori.map(function (f) { return f.id; }));
    var box = el("div", { class: "im-lista" + (tutti.length > 6 ? " fitta" : "") }), righe = {};
    tutti.forEach(function (id, k) {
      var p = trova(vm, id), ind = el("span", { class: "im-ind" }), segno = el("span", { class: "im-segno" }), f = fuori.filter(function (x) { return x.id === id; })[0];
      riempiIndizi(el, ind, (vm.ind && vm.ind[id]) || [], nuovi && !f, k);
      var r = el("div", { class: "im-riga" + (id === cb.myId ? " io" : "") + (f ? " fuori" : "") }, [el("span", { class: "im-nome", text: (f ? iconaRuolo(f.ruolo) + " " : "") + (id === cb.myId ? "Tu" : p.nome) }), ind, segno]);
      box.appendChild(r); righe[id] = { r: r, segno: segno, f: f };
    });
    return { nodo: box, agg: function (v) {
      tutti.forEach(function (id) {
        var p = trova(v, id) || {}, x = righe[id];
        setTx(x.segno, x.f ? "🚪" : p.via ? "🚪" : correnti && (v.scritto || []).indexOf(id) >= 0 ? "✅" : p.dorme ? "📱" : p.forse ? "📶" : correnti ? "✍️" : "");
        x.r.classList.toggle("via", !!p.via);
      });
    } };
  }
  // quanti giocano davvero in questo momento (presenti e, a eliminazione, non fuori)
  function attiviVm(v) { return presentiVm(v).filter(function (p) { return !p.fuori; }); }
  // 📱 «⏳ Aspettiamo Giulia e Luca 📱»: chi ha il telefono bloccato e non ha ancora fatto (fatti = gli id che hanno fatto)
  function aspettiamo(v, fatti, myId) {
    var l = attiviVm(v).filter(function (p) { return p.dorme && p.id !== myId && (fatti || []).indexOf(p.id) < 0; }).map(function (p) { return p.nome; });
    if (!l.length) return "";
    return " · ⏳ Aspettiamo " + (l.length > 1 ? l.slice(0, -1).join(", ") + " e " + l[l.length - 1] : l[0]) + " 📱";
  }
  // "In gioco: 🕵️ 1 impostore · 🎭 1 spia" (a eliminazione anche quanti sono ancora dentro)
  function testoRuoli(vm) {
    var n = vm.nImp || 1, s = "In gioco: 🕵️ " + n + (n > 1 ? " impostori" : " impostore") + (vm.conSpia ? " · 🎭 1 spia" + (vm.spiaNonSa ? " (che non lo sa!)" : "") : "");
    if (vm.elim && (vm.fuori || []).length) s += " · 🚪 " + vm.fuori.length + " fuori";
    return s;
  }
  function haIndizi(vm) { return vm.ind && Object.keys(vm.ind).length > 0; }

  // ---- ✍️ gli indizi: si scrive di nascosto, si svelano tutti insieme al giro dopo ----
  function fIndizi(ui, vm, cb) {
    var el = ui.t.el, me = giocoIo(vm, cb), k = vm.k, dopoIl1 = vm.giro > 1 || (vm.elim && vm.turno > 1);
    ui.corpo.appendChild(titolo(el, dopoIl1 ? "✍️ Un altro indizio" : "✍️ Scrivi un indizio",
      vm.elim && vm.turno > 1 ? "Stessa parola: ecco gli indizi dei giri prima, scrivine uno nuovo" : vm.giro > 1 ? "Ecco gli indizi di prima: scrivine un altro, diverso" : "Una parola legata alla tua, senza dirla: si svelano tutti insieme"));
    var zona = el("div", { class: "im-scrivi" });
    if (me) ui.corpo.appendChild(zona);
    var lista = listaIndizi(ui, vm, cb, true, dopoIl1);
    ui.corpo.appendChild(lista.nodo);
    var conto = el("p", { class: "im-conto" });
    ui.piede.appendChild(conto);
    if (!me) piedeGuarda(ui, vm, cb);
    var disegnato = null;
    function zonaScrivi() {
      if (!me) return;
      var v = cb.vm || vm, mio = cb.mio.ind && cb.mio.ind.k === k ? cb.mio.ind : null;
      var gia = !mio && (v.scritto || []).indexOf(cb.myId) >= 0;   // (rientrato: l'avevo già scritto)
      var stato = mio ? "m:" + mio.testo : gia ? "gia" : "scrivi";
      if (stato === disegnato) return;
      disegnato = stato;
      ui.t.svuota(zona);
      if (mio || gia) {
        zona.appendChild(el("div", { class: "im-fatto" }, [el("span", { text: mio ? "✅ Hai scritto «" + mio.testo + "»" : "✅ Hai scritto il tuo indizio" }),
          el("button", { class: "im-cambia", type: "button", text: "✏️ Cambia", onclick: function () { cb.mio.ind = null; disegnato = null; cb.mio.cambio = k; zonaScrivi(); } })]));
        return;
      }
      var inp = el("input", { type: "text", class: "im-input", maxlength: "24", placeholder: "Il tuo indizio", autocomplete: "off", autocapitalize: "none", enterkeyhint: "send" });
      var b = el("button", { class: "btn btn-primario im-invia", type: "button", text: "Invia" });
      function manda() {
        var w = pulisciIndizio(inp.value);
        if (!w) { inp.focus(); return; }
        var sg = cb.seg && cb.seg.k === v.partita + "|" + v.mano ? cb.seg : null;
        if (sg && sg.mia && svelaParola(w, sg.mia)) { avviso("🙊 Non puoi scrivere la tua parola!"); vibra(30); return; }
        cb.mio.ind = { k: k, testo: w, quando: Date.now() };
        try { inp.blur(); } catch (e) {}
        cb.onIndizio(w); zonaScrivi();
      }
      b.addEventListener("click", manda);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); manda(); } });
      zona.appendChild(inp); zona.appendChild(b);
      if (cb.mio.cambio === k) { cb.mio.cambio = null; try { inp.focus(); } catch (e) {} }
    }
    zonaScrivi();
    return { zona: zonaScrivi, agg: function (v) {
      lista.agg(v);
      setTx(conto, "✍️ " + (v.scritto || []).length + " su " + attiviVm(v).length + " hanno scritto" + aspettiamo(v, v.scritto, cb.myId));
      // l'indizio non è arrivato all'host (rete saltata): lo rimando
      var mio = cb.mio.ind;
      if (mio && mio.k === k && (v.scritto || []).indexOf(cb.myId) < 0 && Date.now() - mio.quando > 3000) { mio.quando = Date.now(); cb.onIndizio(mio.testo); }
      zonaScrivi();
    } };
  }

  // ---- 🗣️ la discussione: gli indizi svelati (o il giro a voce), poi «🗳️ Votiamo» ----
  function fDiscuti(ui, vm, cb) {
    var el = ui.t.el, me = giocoIo(vm, cb), voce = vm.indizi === "voce";
    var ruoli = testoRuoli(vm);
    var lista = null;
    if (voce) {
      var ini = trova(vm, (vm.ordine || [])[0]);
      ui.corpo.appendChild(titolo(el, "🗣️ A turno, a voce", vm.elim && vm.turno > 1 ? "Stessa parola: ognuno dice UNA parola nuova. Poi discutete: chi esce?"
        : "Ognuno dice UNA parola legata alla sua, senza svelarla. Poi discutete: chi bluffa?"));
      ui.corpo.appendChild(el("div", { class: "im-inizia" }, [el("small", { text: "Inizia" }), el("b", { text: ini ? (ini.id === cb.myId ? "Tu" : ini.nome) : "?" })]));
      var giro = el("div", { class: "im-ordine" });
      (vm.ordine || []).forEach(function (id, k) { var p = trova(vm, id); if (p) giro.appendChild(el("span", { class: k === 0 ? "primo" : "", text: (k + 1) + ". " + (id === cb.myId ? "Tu" : p.nome) })); });
      ui.corpo.appendChild(giro);
      if (vm.elim && (vm.fuori || []).length) ui.corpo.appendChild(el("p", { class: "im-ruoli", text: "🚪 Fuori: " + vm.fuori.map(function (f) { var p = trova(vm, f.id); return (f.id === cb.myId ? "tu" : p ? p.nome : "?") + " " + iconaRuolo(f.ruolo); }).join(", ") }));
    } else {
      ui.corpo.appendChild(vm.elim ? titolo(el, "🗣️ Chi esce?", "Ecco gli indizi: discutete, poi il più votato esce") : titolo(el, "🗣️ Chi bluffa?", "Ecco tutti gli indizi: discutete, poi si vota"));
      lista = listaIndizi(ui, vm, cb, false, true);
      ui.corpo.appendChild(lista.nodo);
    }
    ui.corpo.appendChild(el("p", { class: "im-ruoli", text: ruoli }));
    var tp = me ? tastoPronti(ui, vm, cb, "🗳️ Votiamo", "✅ Votiamo") : null;
    if (me) faccine(ui); else piedeGuarda(ui, vm, cb);
    return { agg: function (v) { if (lista) lista.agg(v); if (tp) tp.agg(v); } };
  }

  // ---- 🗳️ il voto segreto: si può cambiare finché non votano tutti ----
  function fVoto(ui, vm, cb) {
    var el = ui.t.el, me = giocoIo(vm, cb), k = vm.k;
    // si possono votare quelli ancora dentro (a eliminazione chi è fuori no; al ballottaggio solo i pari).
    // A eliminazione anche chi se n'è andato dall'app resta votabile: se no un impostore uscito non si potrebbe più scoprire
    // e i cittadini dovrebbero eliminarsi tra loro finché vince lui
    var cand = (vm.ordine || []).concat(vm.players.map(function (p) { return p.id; }).filter(function (id) { return (vm.ordine || []).indexOf(id) < 0; }))
      .filter(function (id) { var p = trova(vm, id); return p && (!p.via || vm.elim) && !p.fuori && id !== cb.myId && (!vm.ballo || vm.ballo.indexOf(id) >= 0); });
    var sotto = me ? "Vota in segreto: puoi cambiare finché non votano tutti" : "Gli altri votano in segreto";
    ui.corpo.appendChild(vm.ballo ? titolo(el, "⚖️ Ballottaggio!", "Di nuovo pari: si vota solo tra loro, in " + T_BALLO + " secondi")
      : vm.elim ? titolo(el, "🗳️ Chi esce?", me ? "Il più votato esce. Vota in segreto: puoi cambiare finché non votano tutti" : sotto)
      : titolo(el, "🗳️ Chi è l'impostore?", sotto));
    var griglia = el("div", { class: "im-voti" + (cand.length > 4 ? " due" : "") }), bot = {};
    cand.forEach(function (id) {
      var p = trova(vm, id), ind = (vm.ind && vm.ind[id]) || [];
      var b = el("button", { class: "im-vb", type: "button", onclick: function () {
        if (!me || b.disabled) return;
        cb.mio.voto = { k: k, chi: id, quando: Date.now() }; agg(cb.vm || vm); cb.onVoto(id);
      } }, [el("b", { text: p.nome }), ind.length ? el("small", { text: ind.map(function (w) { return w || "—"; }).join(" · ") }) : null]);
      if (!me) b.disabled = true;
      bot[id] = b; griglia.appendChild(b);
    });
    ui.corpo.appendChild(griglia);
    var conto = el("p", { class: "im-conto" });
    ui.piede.appendChild(conto);
    if (!me) piedeGuarda(ui, vm, cb);
    function agg(v) {
      var mio = cb.mio.voto && cb.mio.voto.k === k ? cb.mio.voto : null;
      cand.forEach(function (id) { var p = trova(v, id) || {}; bot[id].classList.toggle("scelto", !!mio && mio.chi === id); bot[id].classList.toggle("via", !!p.via); });
      var n = (v.votato || []).length, tot = attiviVm(v).length;
      setTx(conto, (mio ? "Hai votato " + (trova(v, mio.chi) || {}).nome + " · " : "") + "✅ " + n + " su " + tot + " hanno votato" + aspettiamo(v, v.votato, cb.myId));
      // il voto non è arrivato all'host (rete saltata): lo rimando
      if (mio && (v.votato || []).indexOf(cb.myId) < 0 && Date.now() - mio.quando > 3000) { mio.quando = Date.now(); cb.onVoto(mio.chi); }
    }
    return { agg: agg };
  }

  // ---- 📮 lo spoglio: i voti escono uno alla volta, poi il verdetto ----
  function fSpoglio(ui, vm, cb) {
    var el = ui.t.el, sp = vm.spoglio || { conte: {}, piu: [], ordine: [] }, k = vm.k, me = giocoIo(vm, cb);
    ui.corpo.appendChild(titolo(el, sp.eraBallo ? "⚖️ Il ballottaggio" : "📮 Lo spoglio", sp.elim ? "Quanti voti ha preso ognuno: il più votato esce" : "Quanti voti ha preso ognuno"));
    var ids = (sp.ordine || []).filter(function (id) { return trova(vm, id); });
    var griglia = el("div", { class: "im-sp" + (ids.length > 6 ? " fitta" : "") }), righe = {};
    ids.forEach(function (id) {
      var bolla = el("span", { class: "im-bolla", text: "·" });
      var r = el("div", { class: "im-sp-r" }, [el("span", { class: "im-nome", text: id === cb.myId ? "Tu" : trova(vm, id).nome }), bolla]);
      griglia.appendChild(r); righe[id] = { r: r, bolla: bolla };
    });
    ui.corpo.appendChild(griglia);
    var v1 = el("div", { class: "v1" }), v2 = el("div", { class: "v2" }), ver = el("div", { class: "im-verdetto" }, [v1, v2]);
    ui.corpo.appendChild(ver);
    if (!me) piedeGuarda(ui, vm, cb);
    function vivo() { return UI === ui && ui.k === k && document.body.contains(ui.s); }
    function dopo(ms, fn) { setTimeout(function () { if (vivo()) fn(); }, ms); }
    var passi = 450;
    ids.forEach(function (id, i) {
      passi = 450 + i * 330;
      dopo(passi, function () {
        var x = righe[id], n = sp.conte[id] || 0;
        x.bolla.textContent = String(n); x.bolla.style.transform = "scale(1.35)";
        setTimeout(function () { x.bolla.style.transform = ""; }, 200);
        tic(500 + n * 90);
      });
    });
    dopo(passi + 500, function () {
      (sp.elim ? (sp.acc != null ? [sp.acc] : sp.ballo || sp.piu || []) : sp.piu || []).forEach(function (id) { if (righe[id]) righe[id].r.classList.add("piu"); });
      var acc = sp.acc != null ? trova(vm, sp.acc) : null;
      if (sp.elim) {   // 🔪 a eliminazione: chi esce (il ruolo si svela dopo), pareggio, ballottaggio o sorte
        var te = testiSpoglioE({ acc: sp.acc, sorte: sp.sorte, ballo: sp.ballo }, { piu: sp.piu || [] }, function (id) { var p = trova(vm, id); return id === cb.myId ? "TU" : p ? p.nome : "?"; });
        v1.textContent = te.v1; v2.textContent = te.v2;
      } else {
        v1.textContent = acc ? "Il più votato è " + (sp.acc === cb.myId ? "TU" : acc.nome) + "…" : (sp.piu || []).length ? "Pareggio nei voti!" : "Nessun voto";
        v2.textContent = !acc ? "🤝 Nessuno viene accusato" : sp.ruolo === "impostore" ? "🕵️ ed è l'impostore!" : sp.ruolo === "spia" ? "🎭 ed è la spia!" : "😇 ed è innocente!";
      }
      ver.classList.add("su");
      rullo();
    });
    dopo(passi + 1900, function () {
      v2.classList.add("su");
      fanfara(sp.elim ? sp.acc != null : sp.ruolo === "impostore" || sp.ruolo === "spia");
      if (me && !sp.elim) vibra([30, 40, 30]);   // la rivelazione: un momento che conta (a eliminazione vibra quando si svela il ruolo)
    });
    return {};
  }

  // ---- 🎯 l'ultima possibilità: solo l'impostore tocca, gli altri guardano ----
  function fUltima(ui, vm, cb) {
    var el = ui.t.el, u = vm.ultima || { scelte: [] }, io = u.chi === cb.myId, chi = trova(vm, u.chi) || { nome: "?" };
    if (vm.elim) {   // 🔪 a eliminazione: il ruolo si svela in grande, e se indovina vince lui
      var due = (vm.nImp || 1) > 1;
      ui.corpo.appendChild(rivelaRuolo(el, "imp", fraseRuolo(chi.nome, "imp", vm.nImp || 1, io),
        io ? (due ? "Ultima possibilità: se indovini la parola, vincete tu e l'altro impostore" : "Ultima possibilità: se indovini la parola, vinci tu")
          : "Ultima possibilità: se indovina la vostra parola, " + (due ? "vincono gli impostori" : "vince lui") + "…", true));
      if (trova(vm, cb.myId)) vibra([30, 40, 30]);   // la rivelazione del ruolo
    } else
    ui.corpo.appendChild(io ? titolo(el, "🎯 Ultima possibilità!", "Indovina la parola degli altri: se ci riesci ti salvi e prendi 2 punti")
      : titolo(el, "🎯 " + chi.nome + " è l'impostore!", "Ultima possibilità: prova a indovinare la vostra parola…"));
    var griglia = el("div", { class: "im-scelte" }), bot = [];
    u.scelte.forEach(function (w) {
      var b = el("button", { class: "im-sc", type: "button", text: w, onclick: function () {
        if (!io || b.disabled) return;
        bot.forEach(function (x) { x.disabled = true; }); b.classList.add("mia");
        cb.onIndovina(w);
      } });
      b._w = w; if (!io || u.scelto != null) b.disabled = true;
      bot.push(b); griglia.appendChild(b);
    });
    ui.corpo.appendChild(griglia);
    var ris = el("div", { class: "im-ris" });
    ui.corpo.appendChild(ris);
    if (!io) faccine(ui);
    var mostrato = false;
    return { agg: function (v) {
      var x = v.ultima; if (!x || x.scelto == null || mostrato) return;
      mostrato = true;
      bot.forEach(function (b) {
        b.disabled = true;
        if (b._w === x.parola) b.classList.add("giusta");
        else if (b._w === x.scelto) b.classList.add("sbagliata");
      });
      ris.textContent = x.giusto ? (v.elim ? ((v.nImp || 1) > 1 ? "🎯 Indovinata! Vincono gli impostori!" : "🎯 Indovinata! Vince l'impostore!") : "🎯 Indovinata! Si salva!") : x.scelto ? "❌ Sbagliato!" + (x.parola ? " La parola era «" + x.parola + "»" : " La parola resta segreta") : "⌛ Tempo scaduto!" + (x.parola ? " La parola era «" + x.parola + "»" : " La parola resta segreta");
      fanfara(!x.giusto);
      if (trova(v, cb.myId)) vibra(x.giusto ? [30, 40, 30] : 25);
    } };
  }

  // ---- 🏁 fine mano: chi era chi, le parole, i voti e i punti. Si va avanti col conto, o subito se più di metà tocca «⏩ Avanti» ----
  function fEsito(ui, vm, cb) {
    var el = ui.t.el, e = vm.esito || {}, me = trova(vm, cb.myId);
    var pi = trova(vm, e.imp) || { nome: "?" }, ps = e.spia ? trova(vm, e.spia) : null;
    ui.corpo.appendChild(el("div", { class: "im-testa" }, [el("span", { class: "ic", text: e.icona || "🏁" }), el("b", { text: e.titolo || "" }),
      el("small", { text: (e.sotto || "") + (vm.mani > 1 ? " · mano " + vm.mano + " di " + vm.mani : "") })]));
    ui.corpo.appendChild(el("div", { class: "im-svela" }, [
      el("div", { class: "chi", text: "🕵️ Impostore: " + (e.imp === cb.myId ? "tu" : pi.nome) + (ps ? " · 🎭 Spia: " + (e.spia === cb.myId ? "tu" : ps.nome) : "") }),
      el("div", { class: "par" }, ["Parola: ", el("b", { text: e.parola || "" }),
        ps ? " · la spia aveva «" + e.simile + "»" : e.aiuto === "simile" ? " · l'impostore aveva «" + e.simile + "»" : e.cat ? " · " + e.cat : null])]));
    // una riga a testa: chi ha votato chi e i punti presi
    var ids = (e.giocano || []).filter(function (id) { return trova(vm, id); }), fitta = ids.length > 6;
    var lista = el("div", { class: "im-es" + (fitta ? " fitta" : "") });
    ids.forEach(function (id) {
      var p = trova(vm, id), segno = id === e.imp ? "🕵️ " : id === e.spia ? "🎭 " : "", vo = e.voti ? e.voti[id] : null, vp = vo ? trova(vm, vo) : null;
      var voto = vp ? "→ " + (vo === cb.myId ? "te" : vp.nome) + (id === e.imp ? "" : vo === e.imp ? " ✅" : vo === e.spia ? " 🎭" : " ❌") : "";
      lista.appendChild(el("div", { class: "im-es-r" + (id === cb.myId ? " io" : "") }, [
        el("span", { class: "nm", text: segno + (id === cb.myId ? "Tu" : p.nome) }),
        el("span", { class: "vo", text: voto }),
        el("span", { class: "pi" + (p.piu ? "" : " zero"), text: "+" + p.piu }),
        el("span", { class: "tot", text: fmtN(p.punti) })]));
    });
    ui.corpo.appendChild(lista);
    // il conto per tutti ("Si va avanti tra 20…": il tempo lo tiene l'host) e «⏩ Avanti» a chi gioca
    var conto = el("p", { class: "im-conto" });
    ui.piede.appendChild(conto);
    var ripC = contoRip(ui, conto, vm, T_ESITO, "im-esito");
    var tp = me && !me.via ? tastoPronti(ui, vm, cb, e.ultima ? "🏆 Classifica" : "⏩ Avanti", e.ultima ? "✅ Classifica" : "✅ Avanti") : null;
    if (me) faccine(ui); else piedeGuarda(ui, vm, cb);
    // i trofei: ognuno conta i suoi, una volta per mano
    var km = vm.codice + "|" + vm.k;
    if (me && !MEM.fatti[km] && ids.indexOf(cb.myId) >= 0) {
      MEM.fatti[km] = 1;
      var ix = function (id) { return id == null ? -1 : ids.indexOf(id); };
      var io = ix(cb.myId), imp = ix(e.imp), acc = ix(e.acc);
      try {
        contaTrofei({ io: io, impostore: imp, spia: ix(e.spia), voti: ids.map(function (id) { var x = e.voti ? e.voti[id] : null; return x ? ix(x) : null; }),
          conte: ids.map(function (id) { return (e.conte && e.conte[id]) || 0; }), accusato: acc, aiuto: e.aiuto, iniziante: ix(e.iniziante),
          ultima: !!e.ultima, salvo: acc !== imp || e.indovinato }, MEM);
      } catch (er) {}
    }
    if (me && me.piu >= 3) vibra(20);   // tanti punti
    return { agg: function (v) { if (tp) tp.agg(v); ripC(v); } };
  }

  // ---- 🔪 il ruolo di chi esce, in grande ("Luca era un cittadino 😇") ----
  function rivelaRuolo(el, ruolo, testo, sotto, piccolo) {
    return el("div", { class: "im-riv " + ruolo + (piccolo ? " piccolo" : "") }, [el("span", { class: "ic", text: iconaRuolo(ruolo) }), el("b", { text: testo }), sotto ? el("small", { text: sotto }) : null]);
  }
  function righeFuori(vm, cb) {
    return (vm.fuori || []).map(function (f) { var p = trova(vm, f.id); return (f.id === cb.myId ? "tu" : p ? p.nome : "?") + " " + iconaRuolo(f.ruolo); }).join(", ");
  }
  // ---- 🚪 chi è uscito: il ruolo svelato a tutti, poi il giro dopo col conto (o subito se più di metà tocca «⏩ Avanti») ----
  function fFuori(ui, vm, cb) {
    var el = ui.t.el, u = vm.ultimoFuori || {}, p = trova(vm, u.id) || { nome: "?" }, me = giocoIo(vm, cb), nImp = vm.nImp || 1;
    var impFuori = (vm.fuori || []).filter(function (f) { return f.ruolo === "imp"; }).length, dentro = nImp - impFuori;
    var resta = dentro > 1 ? "🕵️ " + dentro + " impostori ancora dentro" : nImp > 1 ? "🕵️ C'è ancora un impostore!" : "🕵️ L'impostore è ancora dentro";
    var vivi = vm.players.filter(function (x) { return !(vm.fuori || []).some(function (f) { return f.id === x.id; }); }).length;
    ui.corpo.appendChild(el("div", { class: "im-fuori" }, [
      rivelaRuolo(el, u.ruolo, fraseRuolo(p.nome, u.ruolo, nImp, u.id === cb.myId), u.sbaglia ? "Non ha indovinato la parola" : null),
      el("div", { class: "im-resta" }, [el("b", { text: resta }), el("span", { text: "Restano in " + vivi + " · stessa parola, nuovo giro" })]),
      el("p", { class: "im-ruoli", text: "🚪 Fuori: " + righeFuori(vm, cb) })]));
    var conto = el("p", { class: "im-conto" });
    ui.piede.appendChild(conto);
    var ripC = contoRip(ui, conto, vm, T_FUORI, "im-fuori");
    var tp = me ? tastoPronti(ui, vm, cb, "⏩ Avanti", "✅ Avanti") : null;
    if (me) faccine(ui); else piedeGuarda(ui, vm, cb);
    if (trova(vm, cb.myId)) vibra([30, 40, 30]);   // la rivelazione del ruolo
    fanfara(u.ruolo !== "cit");
    return { agg: function (v) { if (tp) tp.agg(v); ripC(v); } };
  }
  // ---- 🏁 fine mano a eliminazione: chi ha vinto, chi era chi, quando è uscito ognuno, i punti ----
  function fEsitoElim(ui, vm, cb) {
    var el = ui.t.el, e = vm.esito || {}, me = trova(vm, cb.myId), nImp = (e.imps || []).length || 1;
    var nome = function (id) { var p = trova(vm, id); return id === cb.myId ? "tu" : p ? p.nome : "?"; };
    ui.corpo.appendChild(el("div", { class: "im-testa" }, [el("span", { class: "ic", text: e.icona || "🏁" }), el("b", { text: e.titolo || "" }),
      el("small", { text: (e.sotto || "") + (vm.mani > 1 ? " · mano " + vm.mano + " di " + vm.mani : "") })]));
    if (e.ultimo) { var pu = trova(vm, e.ultimo.id); ui.corpo.appendChild(el("p", { class: "im-ultimo", text: fraseRuolo(pu ? pu.nome : "?", e.ultimo.ruolo, nImp, e.ultimo.id === cb.myId) })); }
    ui.corpo.appendChild(el("div", { class: "im-svela" }, [
      el("div", { class: "chi", text: "🕵️ " + (nImp > 1 ? "Impostori: " : "Impostore: ") + elenco((e.imps || []).map(nome)) + (e.spia ? " · 🎭 Spia: " + nome(e.spia) : "") }),
      el("div", { class: "par" }, ["Parola: ", el("b", { text: e.parola || "" }),
        e.spia ? " · la spia aveva «" + e.simile + "»" : e.aiuto === "simile" ? " · l'impostore aveva «" + e.simile + "»" : e.cat ? " · " + e.cat : null])]));
    var ids = (e.giocano || []).filter(function (id) { return trova(vm, id); }), fitta = ids.length > 6;
    var lista = el("div", { class: "im-es" + (fitta ? " fitta" : "") });
    ids.forEach(function (id) {
      var p = trova(vm, id), f = (e.fuori || []).filter(function (x) { return x.id === id; })[0];
      var r = (e.imps || []).indexOf(id) >= 0 ? "imp" : id === e.spia ? "spia" : "cit";
      lista.appendChild(el("div", { class: "im-es-r" + (id === cb.myId ? " io" : "") }, [
        el("span", { class: "nm", text: (r !== "cit" ? iconaRuolo(r) + " " : "") + (id === cb.myId ? "Tu" : p.nome) }),
        el("span", { class: "vo", text: f ? "🚪 fuori al " + f.turno + "° giro" : "🏁 fino alla fine" }),
        el("span", { class: "pi" + (p.piu ? "" : " zero"), text: "+" + p.piu }),
        el("span", { class: "tot", text: fmtN(p.punti) })]));
    });
    ui.corpo.appendChild(lista);
    var conto = el("p", { class: "im-conto" });
    ui.piede.appendChild(conto);
    var ripC = contoRip(ui, conto, vm, T_ESITO, "im-esito");
    var tp = me && !me.via ? tastoPronti(ui, vm, cb, e.ultima ? "🏆 Classifica" : "⏩ Avanti", e.ultima ? "✅ Classifica" : "✅ Avanti") : null;
    if (me) faccine(ui); else piedeGuarda(ui, vm, cb);
    // i trofei: ognuno conta i suoi, una volta per mano
    var km = vm.codice + "|" + vm.k;
    if (me && !MEM.fatti[km] && ids.indexOf(cb.myId) >= 0) {
      MEM.fatti[km] = 1;
      try {
        contaTrofei(datiTrofeiElim({ io: cb.myId, imps: e.imps || [], spia: e.spia || null, giusti: e.giusti || {}, ricevuti: e.ricevuti || {},
          fuori: (e.fuori || []).map(function (f) { return { k: f.id, ruolo: f.ruolo }; }), iniziante: e.iniziante, aiuto: e.aiuto, ultima: !!e.ultima, vince: e.vince, chi: ids }), MEM);
      } catch (er) {}
    }
    if (me && (e.ultimo || me.piu >= 3)) vibra(e.ultimo ? [30, 40, 30] : 20);   // la rivelazione dell'ultimo uscito, o tanti punti
    fanfara(e.vince === "cit");
    return { agg: function (v) { if (tp) tp.agg(v); ripC(v); } };
  }

  // il conto «Si va avanti tra N…» (il tempo lo tiene chi tiene la partita). Dopo una ripresa (vm.rip cambia) riparte
  // dai secondi nuovi: il momento è lo stesso (stessa vm.k), ma chi tiene la partita aspetta di nuovo qualche secondo
  function contoRip(ui, nodo, vm, def, pre) {
    var rip = vm.rip || 0, c = ui.t.contoAvanti(nodo, vm.resta || def, null, pre + "|" + vm.k + "|" + rip);
    return function (v) {
      if ((v.rip || 0) === rip) return;
      rip = v.rip || 0; if (c) c.ferma();
      c = ui.t.contoAvanti(nodo, v.resta || def, null, pre + "|" + v.k + "|" + rip);
    };
  }
  function avviso(testo) {
    if (!UI || !testo) return;
    UI.avviso.textContent = testo; UI.avviso.classList.remove("su"); void UI.avviso.offsetWidth; UI.avviso.classList.add("su");
  }
  // medaglie a pari merito: oro, oro, poi argento (posti 1, 1, 3 → 🥇🥇🥈), come la fine partita del core
  function medaglie(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; });
  }
  function finale(t, vm, cb) {
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale" });
    var cl = vm.classifica || [], fac = t.faccine();
    // tanti giocatori (o schermo basso): righe su due colonne, così i tasti restano a vista senza scorrere
    var fitta = cl.length > 6 || cl.length * 71 + 300 + (fac ? 56 : 0) > (window.innerHeight || 640);
    var ol = t.el("ol", { class: "classifica" + (fitta ? " fitta" : "") }), med = medaglie(cl.map(function (r) { return r.pos; }));
    cl.forEach(function (r, i) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[i] }),
        t.el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        t.el("span", { class: "punti", text: fmtN(r.punti) })]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    if (!cl.some(function (r) { return r.id === cb.myId; })) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
    else if (cl.some(function (r) { return r.id === cb.myId && r.pos === 1; })) vibra([30, 40, 60]);   // vittoria
    // I TASTI DI FINE LI METTE IL CORE (Rivincita col 3-2-1, Cambia gioco, Ci sto). Solo se torna false, i tasti di sempre
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
    return s;
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  // il primo collegamento non è riuscito: "Riprova" rifà il collegamento da capo
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online si gioca quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.im-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden}",
      ".schermata.im-piena>.testa,.schermata.im-piena>.piede{display:none}",
      ".schermata.im-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".im-scena{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px calc(10px + env(safe-area-inset-bottom));overflow:hidden}",
      ".im-barra{display:flex;align-items:center;gap:8px;font-weight:800;flex:none}",
      ".im-esci{flex:none;width:38px;height:38px;border-radius:50%;border:0;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra);font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".im-stato{flex:1;min-width:0;font-size:.92rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".im-tempo{flex:none;font-variant-numeric:tabular-nums;font-weight:900;padding:4px 10px;border-radius:999px;background:var(--o-scuro);color:var(--o-scuro-testo)}",
      ".im-tempo.poco{background:var(--o-rosso);color:#fff}.im-tempo:empty{display:none}",
      // la carta segreta (tieni premuto)
      ".im-carta{position:relative;flex:none;height:46px;border-radius:16px;background:var(--carta);box-shadow:var(--ombra);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none;cursor:pointer;overflow:hidden}",
      ".im-carta.grande{height:clamp(110px,22vh,180px);border-radius:22px}.im-carta[hidden]{display:none}",
      ".im-c-coperta,.im-c-dentro{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:8px;padding:4px 12px;text-align:center;transition:opacity .12s}",
      ".im-c-dentro{opacity:0;flex-direction:column;gap:2px}.im-carta.su .im-c-dentro{opacity:1}.im-carta.su .im-c-coperta{opacity:0}",
      ".im-c-dito{font-size:1.3rem}.im-c-tx{font-weight:800}",
      ".im-carta.grande .im-c-coperta{flex-direction:column;gap:4px}.im-carta.grande .im-c-dito{font-size:2.4rem}.im-carta.grande .im-c-tx{font-size:1.1rem}",
      ".im-c-su,.im-c-giu{font-size:.8rem;opacity:.85;line-height:1.15}",
      ".im-c-grande{font-size:1.2rem;font-weight:900;line-height:1.1;overflow-wrap:anywhere}",
      ".im-carta.grande .im-c-grande{font-size:1.9rem}.im-carta.grande .im-c-grande.lunga{font-size:1.45rem}",
      ".im-carta:not(.grande) .im-c-su,.im-carta:not(.grande) .im-c-giu{display:none}",
      // il corpo del momento
      ".im-corpo{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px;overflow:hidden}",
      ".im-tit{display:flex;flex-direction:column;gap:2px;text-align:center;flex:none}.im-tit b{font-size:1.12rem;line-height:1.2}.im-tit small{font-size:.84rem;opacity:.8;line-height:1.25}",
      ".im-scrivi{display:flex;gap:8px;flex:none}",
      ".im-input{flex:1;min-width:0;height:48px;box-sizing:border-box;border-radius:14px;border:1.5px solid var(--o-filo-oro);background:var(--o-carta);color:var(--o-testo);font:inherit;font-size:1.1rem;font-weight:700;padding:0 12px}",
      ".im-input:focus{outline:none;border-color:var(--o-oro);box-shadow:0 0 0 3px rgba(197,151,41,.18)}",
      ".btn.im-invia{width:auto;margin:0;flex:none;padding:0 18px;min-height:48px}",
      ".im-fatto{flex:1;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:48px;padding:0 6px 0 12px;border-radius:14px;background:var(--o-verde-tenue);box-shadow:inset 0 0 0 1px rgba(46,125,79,.28);font-weight:800;overflow:hidden}",
      ".im-fatto span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".im-cambia{flex:none;border:0;border-radius:10px;padding:8px 10px;background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo-oro);color:inherit;font:inherit;font-weight:800;cursor:pointer}",
      ".im-lista{display:grid;gap:5px;align-content:start;min-height:0;overflow:hidden}.im-lista.fitta{grid-template-columns:1fr 1fr;gap:4px}",
      ".im-riga{display:flex;align-items:center;gap:4px 8px;padding:5px 10px;border-radius:12px;background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo);min-width:0}",
      ".im-lista.fitta .im-riga{flex-wrap:wrap;padding:4px 7px;font-size:.88rem;gap:2px 5px}.im-lista.fitta .im-nome{flex:1;max-width:none}.im-lista.fitta .im-ind{order:3;flex:1 1 100%}.im-lista.fitta .im-ind:empty{display:none}.im-riga.via{opacity:.45}.im-riga.io{background:var(--o-carta-viva);box-shadow:inset 0 0 0 1.5px var(--o-oro)}",
      ".im-nome{flex:none;max-width:42%;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".im-ind{flex:1;min-width:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:.88rem;line-height:1.25;overflow-wrap:anywhere}",
      ".im-lista.fitta .im-ind{font-size:.78rem}",
      ".im-w{display:inline;font-weight:800}.im-w+.im-w::before{content:\" · \";font-weight:400;opacity:.6}.im-w.ultimo{color:var(--accento)}.im-w.vuota{opacity:.55}",
      ".im-w.nuova{animation:imSvela .5s ease both}",
      "@keyframes imSvela{from{opacity:0}to{opacity:1}}",
      ".im-segno{flex:none;margin-left:auto}",
      ".im-conto{margin:0;text-align:center;font-weight:800;opacity:.85;font-size:.9rem}",
      ".im-piede{flex:none;display:flex;flex-direction:column;gap:6px;align-items:stretch}.im-piede>.sl-faccine{align-self:center;flex:none}",
      ".btn.im-pronto{margin:0;display:flex;align-items:center;justify-content:center;gap:10px}.im-pronto .quanti{font-size:.85rem;opacity:.8;font-weight:700}",
      ".im-ruoli{margin:0;text-align:center;font-weight:700;font-size:.86rem;opacity:.9;flex:none}",
      ".im-inizia{text-align:center;flex:none}.im-inizia small{opacity:.8}.im-inizia b{display:block;font-size:1.8rem;font-weight:900;overflow-wrap:anywhere;line-height:1.1}",
      ".im-ordine{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;flex:none}",
      ".im-ordine span{padding:4px 10px;border-radius:999px;background:var(--carta);font-weight:700;font-size:.88rem;max-width:46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".im-ordine span.primo{background:var(--o-scuro);color:var(--o-scuro-testo)}",
      // il voto
      ".im-voti{display:grid;gap:6px;align-content:start;min-height:0}.im-voti.due{grid-template-columns:1fr 1fr}",
      ".im-vb{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;min-height:48px;min-width:0;padding:5px 10px;border-radius:14px;border:2px solid transparent;background:var(--carta);color:inherit;font:inherit;text-align:left;cursor:pointer}",
      ".im-vb b{font-size:1rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".im-vb small{font-size:.76rem;opacity:.8;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".im-vb.scelto{border-color:var(--accento);background:var(--carta-2)}.im-vb:disabled{cursor:default;color:inherit}.im-vb.via{opacity:.45}",
      // lo spoglio
      ".im-sp{display:grid;gap:5px}.im-sp.fitta{grid-template-columns:1fr 1fr;gap:4px}",
      ".im-sp-r{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-radius:12px;background:var(--carta);border:2px solid transparent}",
      ".im-sp.fitta .im-sp-r{padding:3px 8px}.im-sp-r.piu{border-color:var(--accento)}",
      ".im-bolla{min-width:30px;text-align:center;padding:1px 8px;border-radius:999px;background:var(--carta-2);font-weight:900;transition:transform .2s}",
      ".im-verdetto{text-align:center;opacity:0;transform:scale(.9);transition:opacity .3s,transform .3s;flex:none}.im-verdetto.su{opacity:1;transform:none}",
      ".im-verdetto .v1{font-weight:700;opacity:.9}",
      ".im-verdetto .v2{font-size:1.45rem;font-weight:900;line-height:1.2;margin-top:2px;opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s}.im-verdetto .v2.su{opacity:1;transform:none}",
      // l'ultima possibilità
      ".im-scelte{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
      ".im-sc{min-height:52px;border-radius:14px;border:2px solid transparent;background:var(--carta);color:inherit;font:inherit;font-weight:800;font-size:1rem;padding:8px;overflow-wrap:anywhere;line-height:1.15;cursor:pointer}",
      ".im-sc:disabled{cursor:default;color:inherit}.im-sc.mia{border-color:var(--accento)}",
      ".im-sc.giusta,.im-scl.giusta{background:var(--o-verde);color:#fff;border-color:var(--o-verde)}.im-sc.sbagliata,.im-scl.sbagliata{background:var(--o-rosso);color:#fff;border-color:var(--o-rosso)}",
      ".im-ris{text-align:center;font-size:1.25rem;font-weight:900;min-height:1.4em;flex:none}",
      // fine mano
      ".im-testa{text-align:center;flex:none;line-height:1.15}.im-testa .ic{font-size:1.9rem;display:block}.im-testa b{display:block;font-size:1.25rem}.im-testa small{opacity:.8;font-size:.85rem}",
      ".im-svela{text-align:center;padding:6px 10px;border-radius:14px;background:var(--carta);flex:none}",
      ".im-svela .chi{font-size:1.08rem;font-weight:900;overflow-wrap:anywhere}.im-svela .par{font-size:.9rem;opacity:.92}",
      ".im-es{display:flex;flex-direction:column;gap:3px;min-height:0;overflow:hidden}",
      ".im-es-r{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) auto 2.6ch;gap:8px;align-items:center;padding:5px 10px;border-radius:10px;background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo);font-size:.94rem}",
      ".im-es.fitta .im-es-r{padding:2px 8px;font-size:.85rem}.im-es-r.io{background:var(--o-carta-viva);box-shadow:inset 0 0 0 1.5px var(--o-oro)}",
      ".im-es-r span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.im-es-r .nm{font-weight:800}.im-es-r .vo{opacity:.85}",
      ".im-es-r .pi{font-weight:900;color:var(--verde)}.im-es-r .pi.zero{color:var(--testo-tenue)}.im-es-r .tot{font-weight:900;text-align:right}",
      ".im-avviso{position:absolute;left:12px;right:12px;top:42%;text-align:center;font-weight:900;font-size:1.05rem;width:fit-content;max-width:calc(100% - 24px);margin:0 auto;padding:10px 18px;border-radius:999px;background:var(--o-scuro);color:var(--o-scuro-testo);box-shadow:var(--o-ombra-alta);opacity:0;pointer-events:none}",
      ".im-avviso.su{animation:imAvviso 1.8s ease}",
      "@keyframes imAvviso{0%{opacity:0;transform:scale(.8)}15%{opacity:1;transform:scale(1.05)}80%{opacity:1}100%{opacity:0}}",
      // 👥 l'altro impostore sulla carta (anche piccola) e 🔪 a eliminazione: chi è fuori, il ruolo svelato in grande
      ".im-c-socio{font-size:.82rem;font-weight:800;line-height:1.15;color:var(--accento)}.im-c-socio:empty{display:none}",
      ".im-carta.socio:not(.grande){height:58px}.im-carta.grande .im-c-socio{font-size:.95rem;margin-top:4px}",
      ".im-riga.fuori{opacity:.5}.im-riga.fuori .im-ind{-webkit-line-clamp:1}",
      ".im-fuori{flex:1;display:flex;flex-direction:column;justify-content:center;gap:14px;min-height:0}",
      ".im-riv{text-align:center;flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 12px;border-radius:22px;background:var(--carta);box-shadow:var(--ombra);animation:imRiv .45s ease both}",
      ".im-riv .ic{font-size:3.4rem;line-height:1}.im-riv b{font-size:1.65rem;font-weight:900;line-height:1.15;overflow-wrap:anywhere}.im-riv small{font-size:.92rem;opacity:.85;line-height:1.25}",
      ".im-riv.imp{box-shadow:inset 0 0 0 2px var(--o-rosso),var(--ombra)}.im-riv.spia{box-shadow:inset 0 0 0 2px var(--o-oro),var(--ombra)}.im-riv.cit{box-shadow:inset 0 0 0 2px var(--o-verde),var(--ombra)}",
      ".im-riv.piccolo{padding:8px 10px;gap:2px}.im-riv.piccolo .ic{font-size:2rem}.im-riv.piccolo b{font-size:1.25rem}.im-riv.piccolo small{font-size:.84rem}",
      "@keyframes imRiv{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}",
      ".im-resta{text-align:center;display:flex;flex-direction:column;gap:2px;flex:none}.im-resta b{font-size:1.1rem}.im-resta span{font-size:.88rem;opacity:.85}",
      ".im-ultimo{margin:0;text-align:center;font-weight:900;font-size:1.02rem;flex:none;overflow-wrap:anywhere}",
      // =====================================================================================================
      // 🤍 BIANCO E ORO (tutte le regole sotto .oro.g-impostore: valgono solo nelle schermate chiare di questo gioco)
      // La carta della parola: il dorso è scuro con un filo d'oro (come il dorso di una carta da gioco), il fronte
      // è avorio con la doppia cornice dorata e la parola in carattere elegante. Solo colori, bordi, ombre, caratteri.
      // =====================================================================================================
      ".oro.g-impostore .im-carta,.oro.g-impostore .im-rl-carta{background:var(--o-scuro);color:var(--o-scuro-testo);box-shadow:var(--o-ombra-alta)}",
      ".oro.g-impostore .im-c-coperta,.oro.g-impostore .im-rl-dorso{color:var(--o-scuro-testo)}",
      ".oro.g-impostore .im-c-coperta::before,.oro.g-impostore .im-rl-dorso::before{content:\"\";position:absolute;inset:5px;border-radius:12px;border:1px solid rgba(236,210,131,.5);pointer-events:none}",
      ".oro.g-impostore .im-carta.grande .im-c-coperta::before,.oro.g-impostore .im-rl-dorso::before{inset:8px;border-radius:15px}",
      ".oro.g-impostore .im-c-tx,.oro.g-impostore .im-rl-dt{font-family:var(--o-tit);font-weight:700;letter-spacing:.01em}",
      ".oro.g-impostore .im-carta.grande .im-c-tx{font-size:1.45rem}.oro.g-impostore .im-rl-dt{font-size:1.7rem;font-weight:700}",
      ".oro.g-impostore .im-rl-dito{font-size:3rem}.oro.g-impostore .im-rl-dn{font-size:.9rem;color:rgba(236,210,131,.8)}",
      ".oro.g-impostore .im-c-dentro,.oro.g-impostore .im-rl-fronte{background:var(--o-carta);color:var(--o-testo);",
      "box-shadow:inset 0 0 0 1.5px var(--o-filo-oro),inset 0 0 0 6px var(--o-carta),inset 0 0 0 7px var(--o-filo-oro);border-radius:inherit}",
      ".oro.g-impostore .im-c-su,.oro.g-impostore .im-c-giu,.oro.g-impostore .im-rl-su,.oro.g-impostore .im-rl-giu{color:var(--o-tenue);opacity:1;font-size:.82rem;line-height:1.25;font-weight:650}",
      ".oro.g-impostore .im-rl-su,.oro.g-impostore .im-rl-giu{font-size:.95rem}",
      ".oro.g-impostore .im-c-grande,.oro.g-impostore .im-rl-parola{font-family:var(--o-tit);font-weight:700;letter-spacing:.005em;color:var(--o-testo)}",
      ".oro.g-impostore .im-c-grande{font-size:1.6rem;line-height:1.05}.oro.g-impostore .im-carta.grande .im-c-grande{font-size:2.5rem}.oro.g-impostore .im-carta.grande .im-c-grande.lunga{font-size:1.85rem}",
      ".oro.g-impostore .im-rl-parola::after{content:\"\";display:block;width:44px;height:1px;background:var(--o-oro);margin:12px auto 0}",
      ".oro.g-impostore.senza-testa>.testa .btn-piccolo{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra)}",
      ".oro.g-impostore .im-c-socio,.oro.g-impostore .im-rl-socio{color:var(--o-oro-testo);font-weight:800}.oro.g-impostore .im-rl-socio{margin-top:4px;font-size:1.05rem}",
      // la barra in alto e i titoli dei momenti
      ".oro.g-impostore .im-stato{color:var(--o-testo);font-weight:800}",
      ".oro.g-impostore .im-tit b,.oro.g-impostore .im-testa b,.oro.g-impostore .im-resta b{font-family:var(--o-tit);font-weight:700;letter-spacing:.005em;color:var(--o-testo)}",
      ".oro.g-impostore .im-tit b{font-size:1.5rem;line-height:1.05}.oro.g-impostore .im-testa b{font-size:1.65rem;line-height:1.05}",
      ".oro.g-impostore .im-tit small,.oro.g-impostore .im-testa small,.oro.g-impostore .im-resta span,.oro.g-impostore .im-riv small{color:var(--o-tenue);opacity:1}",
      ".oro.g-impostore .im-conto,.oro.g-impostore .im-ruoli{color:var(--o-tenue);opacity:1}",
      ".oro.g-impostore .im-pronto .quanti{opacity:.75}",
      // righe, pillole, voti
      ".oro.g-impostore .im-nome{color:var(--o-testo)}.oro.g-impostore .im-ind{color:var(--o-testo)}",
      ".oro.g-impostore .im-w.ultimo{color:var(--o-oro-testo)}",
      ".oro.g-impostore .im-riga.fuori,.oro.g-impostore .im-riga.via{background:var(--o-fondo-2)}",
      ".oro.g-impostore .im-ordine span,.oro.g-impostore .im-pill{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
      ".oro.g-impostore .im-ordine span.primo,.oro.g-impostore .im-pill.primo{background:var(--o-scuro);color:var(--o-scuro-testo);box-shadow:none}",
      ".oro.g-impostore .im-inizia small{color:var(--o-tenue);opacity:1}",
      ".oro.g-impostore .im-inizia b,.oro.g-impostore .im-inizia-l{font-family:var(--o-tit);font-weight:700;color:var(--o-testo)}",
      ".oro.g-impostore .im-inizia b{font-size:2.3rem}",
      ".oro.g-impostore .im-vb,.oro.g-impostore .im-sc,.oro.g-impostore .im-scl{background:var(--o-carta);color:var(--o-testo);border:1.5px solid var(--o-filo-oro);box-shadow:var(--o-ombra)}",
      ".oro.g-impostore .im-vb small{color:var(--o-tenue);opacity:1}",
      ".oro.g-impostore .im-vb.scelto,.oro.g-impostore .im-sc.mia{background:var(--o-carta-viva);border-color:var(--o-oro);box-shadow:0 0 0 1px var(--o-oro),var(--o-ombra)}",
      ".oro.g-impostore .im-vb:disabled,.oro.g-impostore .im-sc:disabled{color:var(--o-testo)}",
      ".oro.g-impostore .im-sc.giusta,.oro.g-impostore .im-scl.giusta{background:var(--o-verde);color:#fff;border-color:var(--o-verde);box-shadow:none}",
      ".oro.g-impostore .im-sc.sbagliata,.oro.g-impostore .im-scl.sbagliata{background:var(--o-rosso);color:#fff;border-color:var(--o-rosso);box-shadow:none}",
      // lo spoglio
      ".oro.g-impostore .im-sp-r{background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo),var(--o-ombra)}",
      ".oro.g-impostore .im-sp-r.piu{background:var(--o-carta-viva);border-color:var(--o-oro);box-shadow:0 0 0 1px var(--o-oro),var(--o-ombra)}",
      ".oro.g-impostore .im-bolla{background:var(--o-fondo-2);color:var(--o-testo);font-weight:800;font-variant-numeric:lining-nums tabular-nums;box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
      ".oro.g-impostore .im-verdetto .v1{color:var(--o-tenue);opacity:1}",
      ".oro.g-impostore .im-verdetto .v2,.oro.g-impostore .im-v2l{font-family:var(--o-tit);font-weight:700;font-size:1.9rem;color:var(--o-testo)}",
      // fine mano e chi è uscito
      ".oro.g-impostore .im-svela{background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra);border-radius:16px;padding:8px 12px}",
      ".oro.g-impostore .im-svela .chi{font-family:var(--o-tit);font-weight:700;font-size:1.3rem}.oro.g-impostore .im-svela .par{color:var(--o-tenue);opacity:1}",
      ".oro.g-impostore .im-es-r .vo{color:var(--o-tenue);opacity:1}.oro.g-impostore .im-es-r .pi{color:var(--o-verde)}.oro.g-impostore .im-es-r .pi.zero{color:var(--o-tenue)}",
      ".oro.g-impostore .im-es-r .tot{font-weight:900}",
      ".oro.g-impostore .im-riv{background:var(--o-carta)}",
      ".oro.g-impostore .im-ris{font-family:var(--o-tit);font-weight:700;font-size:1.45rem}",
      // l'orologio sullo stesso telefono
      ".oro.g-impostore .im-orol.scaduto{background:var(--o-rosso);color:#fff;box-shadow:none}",
      // schermi alti: righe più comode
      "@media (min-height:780px){.im-es-r{padding:8px 12px;font-size:1rem}.im-es.fitta .im-es-r{padding:5px 10px;font-size:.92rem}.im-riga{padding:8px 12px}.im-sp-r{padding:9px 12px}.im-vb{min-height:56px}.im-lista.fitta .im-riga{padding:6px 8px}}"
    ].join("");
    document.head.appendChild(st);
  }
})();
