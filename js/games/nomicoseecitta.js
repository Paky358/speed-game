/* =========================================================
   GIOCO — "Nomi, Cose e Città"
   Un telefono solo. Ogni giro esce UNA lettera uguale per
   tutti: a turno ciascuno riempie le categorie con parole
   che iniziano con quella lettera. Poi il gruppo VOTA parola
   per parola: se più della metà dà l'ok vale 10 punti, 5 se
   due hanno scritto la stessa parola, 0 se bocciata o vuota.
   Le categorie stanno in data/ncc-categorie.js; qui il gioco
   aggiunge quelle scritte dai giocatori (salvate sul telefono).
   ========================================================= */
(function () {
  "use strict";

  var LETTERE = "ABCDEFGILMNOPRSTV".split(""); // lettere comode in italiano
  var DIFFICILI = ["U", "Z"];                  // in più, se l'avete scelto nelle regole
  var K_PERSO = "sg_ncc_perso";
  var K_SCELTE = "sg_ncc_scelte";   // le categorie scelte l'ultima volta (solo i nomi)
  var K_SALVATI = "sg_ncc_salvati"; // partite online già salvate nei trofei (anche dopo una ricarica)
  var K_BOZZA = "sg_ncc_bozza";     // il foglio che sto scrivendo online (se la pagina si ricarica lo ritrovo)
  var MAX_CAT = 8, MIN_CAT = 3;
  var PUNTI_OK = 10;      // parola valida e unica
  var PUNTI_DOPPIA = 5;   // parola valida ma scritta anche da un altro
  var SALVATI_NCC = {};
  function sessioneNcc() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function leggiLS(k, def) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }
  function scriviLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // posti con i pari merito: stessi punti = stesso posto (lista già in ordine di punti)
  function conPosti(lista) { return lista.map(function (p) { return { p: p, pos: 1 + lista.filter(function (q) { return q.punti > p.punti; }).length }; }); }
  function medaglia(pos) { return ["🥇", "🥈", "🥉"][pos - 1] || pos + "°"; }
  function nomiInsieme(n) { return n.length <= 1 ? (n[0] || "") : n.slice(0, -1).join(", ") + " e " + n[n.length - 1]; }

  // I progressi si accumulano durante i giri e si salvano una volta sola alla fine.
  function nuovoProgresso() { return { paroleValide: 0, paroleDoppie: 0, giriCompleti: 0, giriPerfetti: 0 }; }
  function registraProgresso(g, cats, risposte, valida, esito) {
    var p = g._trofei || (g._trofei = nuovoProgresso());
    var piene = 0, giuste = 0, doppie = 0;
    cats.forEach(function (_, ci) {
      if (risposte[ci]) piene++;
      if (valida[ci]) { giuste++; if (esito[ci] === PUNTI_DOPPIA) doppie++; }
    });
    p.paroleValide += giuste; p.paroleDoppie += doppie;
    if (piene === cats.length) p.giriCompleti++;
    if (giuste === cats.length) p.giriPerfetti++;
  }
  function salvaTrofeiNcc(t, sessione, id, nome, giocatore, vittoria, online) {
    if (!giocatore || !giocatore._trofei) return;
    if (t.prova || (t.linkParams && t.linkParams.prova) || !window.SGNube || !SGNube.disponibile() || !SGNube.pronto()) return;
    var prof = SGNube.profilo(); if (!prof || !prof.nome) return;
    // Online è autorevole l'host; ogni telefono salva soltanto i propri dati.
    // Sul telefono condiviso conta il posto col nome del profilo.
    if (!online && String(nome || "").trim().toLowerCase() !== String(prof.nome).trim().toLowerCase()) return;
    var chiave = String(sessione || "") + "|" + String(id || "");
    if (SALVATI_NCC[chiave]) return;
    var giaFatti = leggiLS(K_SALVATI, []); if (!Array.isArray(giaFatti)) giaFatti = [];
    if (online && giaFatti.indexOf(chiave) >= 0) return;   // ricaricato sul podio: questa partita è già salvata
    SALVATI_NCC[chiave] = true;
    if (online) { giaFatti.push(chiave); scriviLS(K_SALVATI, giaFatti.slice(-30)); }
    var stat = giocatore._trofei, inc = [["partite", 1]];
    if (vittoria) inc.push(["vinte", 1]);
    if (online) inc.push(["partiteOnline", 1]);
    if (online && vittoria) inc.push(["vinteOnline", 1]);
    ["paroleValide", "paroleDoppie", "giriCompleti", "giriPerfetti"].forEach(function (k) { if (stat[k]) inc.push([k, stat[k]]); });
    SGNube.salvaProgressi(null, "nomicose", inc, [["puntiMax", giocatore.punti || 0]], []);
  }

  function catPerso() { try { return JSON.parse(localStorage.getItem(K_PERSO)) || []; } catch (e) { return []; } }
  function salvaPerso(a) { try { localStorage.setItem(K_PERSO, JSON.stringify(a)); } catch (e) {} }

  // una lettera che in questa partita non è ancora uscita (usate = lista che si allunga; finite tutte si ricomincia)
  function letteraACaso(usate, difficili) {
    var tutte = difficili ? LETTERE.concat(DIFFICILI) : LETTERE;
    var libere = tutte.filter(function (l) { return usate.indexOf(l) < 0; });
    if (!libere.length) { var ultima = usate[usate.length - 1]; usate.length = 0; libere = tutte.filter(function (l) { return l !== ultima; }); }
    var l = libere[Math.floor(Math.random() * libere.length)];
    usate.push(l);
    return l;
  }
  // per decidere se due parole sono "uguali": senza maiuscole, accenti e articolo ("la iena" = "Iena", "Cantù" = "cantu")
  function norm(s) { var p = pulisci(s); return chiaveP(p.replace(ARTICOLI, "")) || chiaveP(p) || String(s || "").trim().toLowerCase(); }

  // tutte le categorie che si possono scegliere (per ritrovarle dal nome)
  function tutteCat() {
    var d = window.SG_NCC_CATEGORIE || {}, l = [];
    ["normali", "serata", "black"].forEach(function (k) { (d[k] || []).forEach(function (c) { l.push(c); }); });
    (d.pacchetti || []).forEach(function (p) { (p.categorie || []).forEach(function (c) { l.push(c); }); });
    return l.concat(catPerso());
  }
  // almeno 3 categorie: se ne mancano aggiungo le classiche (Nome, Città, …) dopo quelle scelte
  function completaCat(lista) {
    var c = (lista || []).slice(0, MAX_CAT), d = window.SG_NCC_CATEGORIE || { normali: [] };
    for (var i = 0; c.length < MIN_CAT && i < d.normali.length; i++) {
      if (!c.some(function (x) { return x.testo === d.normali[i].testo; })) c.push(d.normali[i]);
    }
    return c;
  }

  // ---- le risposte giuste partono già col pollice su ----
  // "giusta" = inizia con la lettera del giro ed è nell'elenco della sua categoria (file parole/ncc.js, caricato solo per questo gioco)
  var PAROLE = null;   // { "Città": { "milano": 1, … }, … }
  function pulisci(s) { s = String(s || "").toLowerCase(); try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {} return s.replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim(); }
  var ARTICOLI = /^(il|lo|la|i|gli|le|l|un|uno|una)\s+/;
  function chiaveP(s) { return s.replace(/\s+/g, ""); }
  function preparaParole() {
    if (PAROLE || !window.SG_NCC_PAROLE) return;
    var P = {};
    Object.keys(window.SG_NCC_PAROLE).forEach(function (cat) {
      var set = {}, n = 0;
      String(window.SG_NCC_PAROLE[cat]).split("|").forEach(function (w) { var p = pulisci(w); if (!p) return; n++; set[chiaveP(p)] = 1; set[chiaveP(p.replace(ARTICOLI, ""))] = 1; });
      if (n >= 20) P[cat] = set;   // un elenco vuoto o troppo corto vale come "niente elenco": conta solo la lettera
    });
    PAROLE = P;
  }
  function caricaParole() {
    if (window.SG_NCC_PAROLE) { preparaParole(); return Promise.resolve(PAROLE); }
    if (!caricaParole.p) caricaParole.p = new Promise(function (ok) {
      var sc = document.createElement("script"); sc.src = "parole/ncc.js"; sc.async = true;
      sc.onload = function () { preparaParole(); ok(PAROLE); };
      sc.onerror = function () { caricaParole.p = null; ok(null); };   // senza elenco si gioca come prima
      document.head.appendChild(sc);
    });
    return caricaParole.p;
  }
  // forme da cercare: com'è scritta, senza articolo, e dal plurale al singolare (gatti→gatto, banche→banca, ciliegie→ciliegia)
  function formeP(p) {
    var u = p.replace(ARTICOLI, ""), f = [p, u];
    if (u.indexOf(" ") < 0 && u.length > 3) {
      if (/chi$/.test(u)) f.push(u.replace(/chi$/, "co"));
      if (/ghi$/.test(u)) f.push(u.replace(/ghi$/, "go"));
      if (/che$/.test(u)) f.push(u.replace(/che$/, "ca"));
      if (/ghe$/.test(u)) f.push(u.replace(/ghe$/, "ga"));
      if (/i$/.test(u)) f.push(u.replace(/i$/, "o"), u.replace(/i$/, "e"), u.replace(/i$/, "a"), u.replace(/i$/, "io"));
      if (/e$/.test(u)) f.push(u.replace(/e$/, "a"));
    }
    return f.map(chiaveP);
  }
  // false = lettera sbagliata o parola che il gioco non conosce; true = giusta; null = categoria senza elenco (inventata o "black"): conta solo la lettera
  function rispostaGiusta(testo, cat, lettera) {
    var p = pulisci(testo); if (!p) return false;
    var l = pulisci(lettera).charAt(0), senza = p.replace(ARTICOLI, ""), pezzi = senza.split(" ");
    var persona = /personaggio|cantante|calciatore|allenatore|rapper|telecronista|cantautore/i.test((cat && cat.testo) || "");
    if (!(senza.charAt(0) === l || p.charAt(0) === l || (persona && pezzi[pezzi.length - 1].charAt(0) === l))) return false;   // per le persone vale anche il cognome
    var set = PAROLE && cat && PAROLE[cat.testo];
    if (!set) return null;
    return formeP(p).some(function (k) { return !!set[k]; });
  }

  SG.registra({
    id: "nomicose",
    nome: "Nomi, Cose e Città",
    icona: "✍️",
    descrizione: "Esce una lettera, riempi le categorie con parole che iniziano così, poi votate insieme quali valgono.",
    giocatoriMin: 2,
    giocatoriMax: 10,
    difficolta: 2,   // Media — quanto vale vincerlo nel torneo
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono: scrive uno alla volta", amici: true }],
    regole: [
      "Ogni giro esce una <b>lettera</b> uguale per tutti (nella stessa partita non esce due volte): ognuno riempie le categorie con parole che iniziano con quella lettera.",
      "Poi si <b>vota</b> al tabellone, una categoria alla volta: il tasto <b>👍 / 👎</b> accanto a ogni parola dice se vale. Si cambia idea toccando di nuovo; con <b>⋯</b> ognuno vota per conto suo.",
      "Le parole <b>giuste</b> (con la lettera giusta e che il gioco conosce) partono già con <b>👍 da tutti</b>; quelle con la lettera sbagliata o che il gioco non conosce partono bocciate: basta un tocco per cambiare voto.",
      "Se <b>più della metà</b> approva la parola vale <b>10 punti</b>; se due hanno scritto la <b>stessa</b> parola (anche con o senza articolo) valgono <b>5</b> a testa; se è bocciata o vuota, <b>0</b>.",
      "Si gioca un certo numero di giri: alla fine vince chi ha più punti. A pari punti si vince insieme.",
      "<b>Online</b> (ognuno dal suo telefono): si scrive tutti nello stesso momento, poi al tabellone ognuno vota dal suo telefono. Una parola <b>vale</b> se non la boccia almeno metà degli altri."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      var dati = window.SG_NCC_CATEGORIE || { normali: [], black: [] };
      // le categorie dell'ultima volta (per nome); la prima volta le 5 classiche
      var scelte = [], salvate = leggiLS(K_SCELTE, null), tutte = tutteCat();
      if (Array.isArray(salvate)) salvate.forEach(function (n) {
        var c = tutte.filter(function (x) { return x.testo === n; })[0];
        if (c && scelte.length < MAX_CAT && !isScelta(c)) scelte.push(c);
      });
      if (!scelte.length) dati.normali.slice(0, 5).forEach(function (c) { scelte.push(c); });
      dove.categorie = scelte;   // sempre lo stesso elenco: lo cambio, non lo sostituisco
      dove.secondi = 60;
      dove.round = 2;
      dove.difficili = false;
      dove.modo = "telefono";
      if (aiuti.modo) dove.modo = aiuti.modo;   // come giocare l'avete già scelto prima
      else if (!aiuti.torneo && !aiuti.sala) {   // nella sala si gioca sempre online
        box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
        var nota = el("div", { class: "link-avviso", hidden: "hidden" }), bT, bO;
        var scegliModo = function (m) {
          dove.modo = m;
          bT.className = "modo-chip" + (m === "telefono" ? " attiva" : ""); bO.className = "modo-chip" + (m === "online" ? " attiva" : "");
          nota.hidden = (m !== "online");
          nota.textContent = (window.SGNet && SGNet.disponibile())
            ? "Apri una stanza e manda il codice: tutti scrivono insieme, ognuno dal suo telefono, e poi votate al tabellone."
            : "Qui il collegamento non è disponibile. Funziona quando il gioco è aperto dal sito pubblicato online.";
        };
        bT = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
          el("span", { class: "mi", text: "📱" }), el("div", {}, [el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "Si passa di mano" })])]);
        bO = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
          el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Ognuno dal suo" }), el("div", { class: "ms", text: "Tutti scrivono insieme" })])]);
        box.appendChild(el("div", { class: "modo-griglia" }, [bT, bO]));
        box.appendChild(nota);
      }

      // le categorie si riconoscono dal nome (le mie categorie vengono rilette e sono oggetti nuovi)
      function isScelta(c) { return scelte.some(function (x) { return x.testo === c.testo; }); }
      var tasti = [];   // { c, chip }: per ridipingere tutti i tasti della stessa categoria
      function ridipingi() { tasti.forEach(function (x) { x.chip.className = "cat-chip" + (isScelta(x.c) ? " attiva" : ""); }); }
      function salvaScelte() { scriviLS(K_SCELTE, scelte.map(function (x) { return x.testo; })); }
      function toggle(c) {
        if (isScelta(c)) { for (var i = scelte.length - 1; i >= 0; i--) if (scelte[i].testo === c.testo) scelte.splice(i, 1); }
        else if (scelte.length >= MAX_CAT) { avvisoMax(); return; }
        else scelte.push(c);
        ridipingi(); aggiornaConta(); salvaScelte();
      }
      function chipDi(c) {
        var chip = el("button", { class: "cat-chip" + (isScelta(c) ? " attiva" : ""), onclick: function () { toggle(c); } }, [
          el("span", { class: "ci", text: c.emoji }),
          el("span", { text: c.testo }),
          el("span", { class: "spunta", text: "✓" })
        ]);
        tasti.push({ c: c, chip: chip });
        return chip;
      }

      var conta = el("p", { class: "modulo-nota" }), toMax = null;
      function aggiornaConta() {
        conta.textContent = scelte.length + (scelte.length === 1 ? " categoria scelta" : " categorie scelte")
          + (scelte.length < MIN_CAT ? " · ne servono almeno 3: se mancano aggiungo io le classiche" : "")
          + (scelte.length >= MAX_CAT ? " · massimo " + MAX_CAT : "");
      }
      function avvisoMax() {
        var testo = "Massimo " + MAX_CAT + " categorie: togline una per sceglierne un'altra.";
        conta.textContent = testo;
        clearTimeout(toMax); toMax = setTimeout(aggiornaConta, 2600);
        // anche in basso sullo schermo, dove si sta toccando
        var v = document.getElementById("nc-max");
        if (!v) { v = el("div", { id: "nc-max", style: "position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:50;max-width:88%;text-align:center;background:#ff5d6c;color:#2a0006;font-weight:800;padding:9px 14px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.35);pointer-events:none" }); document.body.appendChild(v); }
        v.textContent = testo; clearTimeout(avvisoMax.to);
        avvisoMax.to = setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, 2600);
      }
      function tastiDi(lista) { var g = el("div", { class: "cat-griglia" }); lista.forEach(function (c) { g.appendChild(chipDi(c)); }); return g; }
      function griglia(titolo, lista) {
        box.appendChild(el("div", { class: "etichetta", text: titolo }));
        box.appendChild(tastiDi(lista));
      }
      // un gruppo che si apre toccando il titolo (aperto se dentro c'è già qualcosa di scelto)
      function gruppo(titolo, lista, dopo) {
        var d = el("details", { style: "margin:4px 0 8px" });
        d.appendChild(el("summary", { class: "etichetta", style: "cursor:pointer", text: titolo + " · " + lista.length }));
        d.appendChild(tastiDi(lista));
        if (dopo) d.appendChild(dopo);
        if (lista.some(isScelta)) d.open = true;
        box.appendChild(d);
      }

      box.appendChild(conta);
      griglia("Categorie classiche", dati.normali);
      if (dati.serata && dati.serata.length) griglia("🎉 Da serata", dati.serata);
      (dati.pacchetti || []).forEach(function (p) {
        gruppo(p.emoji + " Pacchetto " + p.nome, p.categorie, el("button", { class: "btn btn-fantasma", text: "Gioca solo col pacchetto " + p.nome, onclick: function () {
          scelte.length = 0; p.categorie.slice(0, 6).forEach(function (c) { scelte.push(c); });
          ridipingi(); aggiornaConta(); salvaScelte();
        } }));
      });
      if (dati.black && dati.black.length) gruppo("😈 Black humor", dati.black);

      box.appendChild(el("div", { class: "etichetta", text: "✏️ Le tue categorie" }));
      var gP = el("div", { class: "cat-griglia" });
      box.appendChild(gP);
      function disegnaPerso() {
        tasti = tasti.filter(function (x) { return !gP.contains(x.chip); });
        while (gP.firstChild) gP.removeChild(gP.firstChild);
        catPerso().forEach(function (c) {
          var riga = el("div", { style: "display:flex;gap:6px;align-items:stretch" });
          riga.appendChild(chipDi(c));
          riga.appendChild(el("button", { class: "togli", text: "×", "aria-label": "Elimina", onclick: function () {
            salvaPerso(catPerso().filter(function (x) { return x.testo !== c.testo; }));
            for (var i = scelte.length - 1; i >= 0; i--) if (scelte[i].testo === c.testo) scelte.splice(i, 1);
            disegnaPerso(); ridipingi(); aggiornaConta(); salvaScelte();
          } }));
          gP.appendChild(riga);
        });
      }
      disegnaPerso();

      var campo = el("input", { class: "link-campo", type: "text", maxlength: "28", placeholder: "Es. Un supereroe, Una scusa…" });
      var aggiungi = el("button", { class: "btn btn-fantasma", text: "＋ Aggiungi la categoria", onclick: function () {
        var testo = (campo.value || "").trim();
        if (testo.length < 2) return;
        var lista = catPerso(), nuova = { emoji: "✏️", testo: testo };
        if (!lista.some(function (x) { return x.testo === testo; })) { lista.push(nuova); salvaPerso(lista); }
        campo.value = "";
        disegnaPerso();
        var piena = !isScelta(nuova) && scelte.length >= MAX_CAT;
        if (!isScelta(nuova) && !piena) scelte.push(nuova);
        ridipingi(); salvaScelte();
        if (piena) avvisoMax(); else aggiornaConta();
      } });
      box.appendChild(campo);
      box.appendChild(aggiungi);

      box.appendChild(el("div", { class: "etichetta", text: "Tempo per scrivere" }));
      var bt = {};
      function scegliSec(v) { dove.secondi = v; [60, 90, 120].forEach(function (x) { bt[x].className = "modo-chip" + (v === x ? " attiva" : ""); }); }
      var gT = el("div", { class: "modo-griglia" });
      [60, 90, 120].forEach(function (v) {
        bt[v] = el("button", { class: "modo-chip" + (v === 60 ? " attiva" : ""), onclick: function () { scegliSec(v); } }, [
          el("div", {}, [ el("div", { class: "mt", text: v + " sec" }) ]) ]);
        gT.appendChild(bt[v]);
      });
      box.appendChild(gT);

      box.appendChild(el("div", { class: "etichetta", text: "Quanti giri" }));
      var br = {};
      function scegliRound(v) { dove.round = v; [1, 2, 3].forEach(function (x) { br[x].className = "modo-chip" + (v === x ? " attiva" : ""); }); }
      var gR = el("div", { class: "modo-griglia" });
      [1, 2, 3].forEach(function (v) {
        br[v] = el("button", { class: "modo-chip" + (v === 2 ? " attiva" : ""), onclick: function () { scegliRound(v); } }, [
          el("div", {}, [ el("div", { class: "mt", text: v === 1 ? "1 giro" : v + " giri" }) ]) ]);
        gR.appendChild(br[v]);
      });
      box.appendChild(gR);

      box.appendChild(el("div", { class: "etichetta", text: "Lettere" }));
      var bL = [];
      function scegliLett(v) { dove.difficili = v; bL[0].className = "modo-chip" + (!v ? " attiva" : ""); bL[1].className = "modo-chip" + (v ? " attiva" : ""); }
      bL[0] = el("button", { class: "modo-chip attiva", onclick: function () { scegliLett(false); } }, [ el("div", {}, [ el("div", { class: "mt", text: "Solo le comode" }) ]) ]);
      bL[1] = el("button", { class: "modo-chip", onclick: function () { scegliLett(true); } }, [ el("div", {}, [ el("div", { class: "mt", text: "Anche U e Z" }), el("div", { class: "ms", text: "per esperti" }) ]) ]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bL[0], bL[1]]));

      aggiornaConta();
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteNcc(t, t.linkParams.stanza);
      caricaParole();
      var cats = completaCat(imp.categorie);   // meno di 3? aggiungo le classiche
      if (imp.modo === "online") return hostNcc(t, cats, imp);
      var st = {
        sessioneTrofei: sessioneNcc(),
        g: t.giocatori.map(function (n) { return { nome: n, punti: 0, _trofei: nuovoProgresso() }; }),
        cats: cats, secondi: imp.secondi || 60, giri: imp.round || 2, usate: [], difficili: !!imp.difficili,
        giro: 0, lettera: null, risposte: [], voti: []
      };
      // si gioca nello studio del game show: sigla, poi il primo giro
      st.t = t;
      assicuraStileN();
      st.S = ST.crea(t, st.g.map(function (g) { return { nome: g.nome }; }), { io: -1, esci: t.esci, titolo: "Nomi, Cose e Città", logo: ["NOMI, COSE", "E CITTÀ"] });
      ST.apertura(st.S).then(function () { iniziaGiro(t, st); });
    }
  });

  // =========================================================
  //  NELLO STUDIO DEL GAME SHOW (condiviso: js/studio.js)
  //  La lettera esce sul maxischermo; a turno la telecamera va su chi scrive
  //  e poi si stringe sul suo FOGLIO; alla fine si va al TABELLONE (maxischermo):
  //  categoria per categoria si vedono le parole di tutti e si vota.
  // =========================================================
  var ST = window.SGStudio;
  var MANO = "'Segoe Print','Bradley Hand','Chalkboard SE','Marker Felt','Comic Sans MS',cursive";
  function assicuraStileN() {
    if (document.getElementById("sg-ncc-css")) return;
    var s = document.createElement("style"); s.id = "sg-ncc-css";
    s.textContent = [
      // estrazione della lettera
      ".nc-estr{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}",
      ".nc-giro{font-size:18px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#cdd6ff}",
      ".nc-slot{width:210px;height:230px;border-radius:30px;display:flex;align-items:center;justify-content:center;font-size:170px;font-weight:900;line-height:1;color:#241f00;",
        "background:linear-gradient(#fff6c9,#ffca3a 55%,#e0a90a);box-shadow:0 12px 30px rgba(0,0,0,.45),inset 0 -8px 0 rgba(0,0,0,.15)}",
      ".nc-slot.fermo{animation:ncClac .5s cubic-bezier(.3,1.6,.5,1)}",
      "@keyframes ncClac{0%{transform:none}35%{transform:scale(1.1)}100%{transform:none}}",
      ".nc-sotto{font-size:22px;font-weight:800}",
      ".nc-cats{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:94%}",
      ".nc-cats span{background:rgba(255,255,255,.1);border-radius:99px;padding:5px 11px;font-weight:800;font-size:15px}",
      // il maxischermo mentre si scrive (si vede anche da lontano)
      ".nc-grande{font-size:210px;font-weight:900;line-height:1;color:#ffd43b;text-shadow:0 8px 0 rgba(0,0,0,.35)}",
      ".nc-chi{font-size:34px;font-weight:900}",
      ".nc-fatti{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:96%}",
      ".nc-fatti span{display:flex;align-items:center;gap:6px;font-size:22px;font-weight:800;background:rgba(255,255,255,.1);border-radius:99px;padding:4px 12px 4px 4px}",
      ".nc-fatti span.ok{background:rgba(55,212,126,.25)}",
      ".nc-fatti .fac,.nc-tab-su .fac,.nc-cl .fac,.nc-chi2 .fac{border-radius:50%;overflow:hidden;background:rgba(255,255,255,.12);flex:0 0 auto}",
      ".nc-fatti .fac{width:36px;height:36px}",
      ".nc-fatti .fac svg,.nc-tab-su .fac svg,.nc-cl .fac svg,.nc-chi2 .fac svg{width:100%;height:100%;display:block}",
      // il foglio (la telecamera ci entra dentro)
      ".nc-foglio{position:absolute;inset:0;z-index:21;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(12px + env(safe-area-inset-top)) 12px 120px;background:rgba(7,4,26,.6);opacity:0;pointer-events:none;transition:opacity .25s}",
      ".nc-foglio.on{opacity:1;pointer-events:auto}",
    ".nc-conf-testo{color:#fff;font-weight:800;text-align:center;font-size:1.02rem;text-shadow:0 2px 6px rgba(0,0,0,.6)}.nc-conf-riga{display:flex;gap:8px}.nc-conf-riga .btn{flex:1;min-width:0;margin:0}",
      ".nc-carta{position:relative;margin:0 auto;max-width:460px;border-radius:6px 6px 12px 12px;padding:16px 14px 20px 46px;color:#1d2a5c;",
        "background:linear-gradient(90deg,transparent 34px,rgba(229,57,53,.55) 34px,rgba(229,57,53,.55) 36px,transparent 36px),repeating-linear-gradient(#fffdf4 0 35px,#bcd5f0 35px 36px),#fffdf4;",
        "box-shadow:0 18px 40px rgba(0,0,0,.5);transform-origin:50% 100%;animation:ncEntra .6s cubic-bezier(.2,1.2,.4,1) both}",
      ".nc-foglio.via .nc-carta{animation:ncEsce .35s ease-in forwards}",
      "@keyframes ncEntra{from{transform:translateY(45%) scale(.22) rotate(-7deg);opacity:0}to{transform:none;opacity:1}}",
      "@keyframes ncEsce{to{transform:translateY(60%) scale(.3) rotate(6deg);opacity:0}}",
      ".nc-testa{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}",
      ".nc-chi2{display:flex;align-items:center;gap:8px;font-family:" + MANO + ";font-size:24px;font-weight:700;min-width:0}",
      ".nc-chi2 .fac{width:42px;height:42px;background:#ece5cc}",
      ".nc-lett{flex:0 0 auto;width:66px;height:66px;border-radius:50%;border:3px solid #e53935;color:#e53935;display:flex;align-items:center;justify-content:center;font-family:" + MANO + ";font-size:46px;font-weight:700;transform:rotate(-8deg)}",
      ".nc-tempo{height:6px;border-radius:3px;background:rgba(29,42,92,.15);overflow:hidden;margin:2px 0 12px}",
      ".nc-tempo i{display:block;height:100%;width:100%;background:#1d2a5c;transform-origin:0 50%;will-change:transform}",
      ".nc-tempo.poco i{background:#e53935}",
      ".nc-riga{display:block;margin-bottom:8px}",
      ".nc-riga .c{display:block;font-size:13px;font-weight:800;color:#5a6aa0;text-transform:uppercase;letter-spacing:.06em}",
      ".nc-riga input{width:100%;border:0;border-bottom:2px dashed rgba(29,42,92,.3);background:transparent;font-family:" + MANO + ";font-size:26px;color:#1d2a5c;padding:2px 2px 4px;outline:none;border-radius:0}",
      ".nc-riga input:focus{border-bottom-color:#e53935}",
      // il foglietto sul leggio
      ".nc-foglietto{position:absolute;left:15%;top:-.5em;width:2.3em;height:1.5em;border-radius:.1em;transform:rotate(-8deg);box-shadow:0 .1em .25em rgba(0,0,0,.35);",
        "background:repeating-linear-gradient(#fffdf4 0 .3em,#bcd5f0 .3em .34em)}",
      ".nc-foglietto.scritto{background:repeating-linear-gradient(#fffdf4 0 .2em,#1d2a5c .2em .26em,#fffdf4 .26em .34em)}",
      // il tabellone (maxischermo, da vicino)
      ".nc-tab{flex:1;min-height:0;display:flex;flex-direction:column}",
      ".nc-tab-testa{text-align:center;margin:2px 0 8px}",
      ".nc-tab-testa small{display:block;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#cdd6ff}",
      ".nc-tab-cat{font-size:24px;font-weight:900;color:#ffe066}",
      ".nc-tab-righe{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:8px;padding-bottom:10px;perspective:600px}",
      ".nc-tab-riga{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:8px 10px;animation:ncGiraRiga .5s ease both}",
      "@keyframes ncGiraRiga{from{transform:rotateX(90deg);opacity:0}to{transform:none;opacity:1}}",
      ".nc-tab-su{display:flex;align-items:center;gap:8px}",
      ".nc-tab-su .fac{width:34px;height:34px}",
      ".nc-tab-su .chi{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}",
      ".nc-tab-su .nm{font-size:12px;font-weight:800;color:#cdd6ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".nc-tab-su .parola{font-family:" + MANO + ";font-size:21px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      // con tanti giocatori le righe si stringono (si vede tutto senza scorrere)
      ".nc-tab-righe.tanti{gap:4px;padding-bottom:2px}.nc-tab-righe.tanti .nc-tab-riga{padding:3px 8px}.nc-tab-righe.tanti .nc-tab-su .fac{width:28px;height:28px}.nc-tab-righe.tanti .chi{line-height:1.08}.nc-tab-righe.tanti .nm{font-size:11px}",
      ".nc-tab-righe.tanti .parola{font-size:17px}.nc-tab-righe.tanti .nc-tg,.nc-tab-righe.tanti .nc-piu,.nc-tab-righe.tanti .nc-mio{height:30px}",
      ".nc-tab-su .parola.vuota{color:rgba(255,255,255,.35);font-family:inherit;font-size:14px}",
      ".nc-esito{flex:0 0 auto;font-size:12px;font-weight:900;padding:3px 8px;border-radius:99px;background:rgba(255,93,108,.22);color:#ff8d98}",
      ".nc-esito.si{background:#37d47e;color:#04321c}",
      ".nc-esito.doppia{background:#ffd43b;color:#3a2a00}",
      ".nc-voti{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}",
      ".nc-voti button{border:0;border-radius:99px;padding:6px 10px;font:inherit;font-size:12px;font-weight:800;cursor:pointer;background:rgba(255,255,255,.12);color:#fff;opacity:.85}",
      ".nc-voti button.on{background:#2ecc71;color:#08210f;opacity:1}",
      ".nc-voti button.tutti{background:rgba(255,212,59,.2);color:#ffe066}",
      // classifica del giro (maxischermo)
      ".nc-clas{flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px}",
      ".nc-clas h2{margin:0 0 6px;text-align:center;font-size:26px}",
      ".nc-cl{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;border-radius:14px;background:rgba(255,255,255,.07);animation:ncGiraRiga .45s ease both}",
      ".nc-cl.primo{background:rgba(255,212,59,.18);border:1px solid rgba(255,212,59,.5)}",
      ".nc-cl .pos{width:28px;text-align:center;font-weight:900}",
      ".nc-cl .fac{width:40px;height:40px}",
      ".nc-cl .nm{flex:1;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".nc-cl .pt{font-weight:900;color:#ffe066}",
      ".nc-cl .pi{font-size:12px;font-weight:800;color:#6ff0a6;margin-left:4px}",
      // online: il mio voto (ognuno vota dal suo telefono), le attese, la lobby
      ".nc-mio{flex:0 0 auto;border:0;border-radius:99px;height:34px;padding:0 12px;font:inherit;font-size:14px;font-weight:900;cursor:pointer;white-space:nowrap}",
      ".nc-mio.si{background:#2ecc71;color:#08210f}",
      ".nc-mio.no{background:#ff5d6c;color:#2a0006}",
      ".nc-attesa{margin:0;text-align:center;font-weight:800;color:#cdd6ff}",
      ".nc-lobby{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,.06);font-weight:700}",
      ".nc-lobby .fac{width:38px;height:38px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
      ".nc-lobby .fac svg{width:100%;height:100%;display:block}",
      ".nc-cats-lobby{justify-content:flex-start;max-width:none}",
      // gli ultimi 5 secondi: il numero grande sopra il foglio
      ".nc-conto{position:absolute;top:calc(14px + env(safe-area-inset-top));right:14px;z-index:23;width:76px;height:76px;border-radius:50%;display:flex;align-items:center;justify-content:center;",
        "font-size:46px;font-weight:900;color:#fff;background:#e53935;box-shadow:0 6px 18px rgba(0,0,0,.45);pointer-events:none;opacity:0}",
      ".nc-conto.on{animation:ncConto .9s ease-out both}",
      "@keyframes ncConto{0%{transform:scale(1.6);opacity:0}25%{transform:scale(1);opacity:1}80%{opacity:1}100%{transform:scale(.9);opacity:.15}}",
      // un telefono solo: un tasto per parola (vale / non vale) e ⋯ per i voti di ognuno
      ".nc-tg{flex:0 0 auto;border:0;border-radius:99px;min-width:44px;height:34px;padding:0 10px;font:inherit;font-size:17px;font-weight:900;cursor:pointer}",
      ".nc-tg.si{background:#2ecc71;color:#08210f}",
      ".nc-tg.no{background:#ff5d6c;color:#2a0006}",
      ".nc-piu{flex:0 0 auto;border:0;border-radius:99px;width:34px;height:34px;font:inherit;font-size:16px;font-weight:900;cursor:pointer;background:rgba(255,255,255,.12);color:#fff}",
      ".nc-voti[hidden]{display:none}",
      // chi guarda senza giocare
      ".nc-guardi{position:absolute;left:50%;top:calc(8px + env(safe-area-inset-top));transform:translateX(-50%);z-index:22;max-width:92%;text-align:center;",
        "background:rgba(7,4,26,.78);color:#ffe066;font-weight:800;font-size:13px;padding:6px 12px;border-radius:99px;pointer-events:none}"
    ].join("");
    document.head.appendChild(s);
  }
  function fac(el, g, cls) { return el("span", { class: "fac" + (cls ? " " + cls : ""), html: ST.avatarDi(g) }); }
  function tick(freq) {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var o = c.createOscillator(), g = c.createGain(), n = c.currentTime; o.type = "square"; o.frequency.setValueAtTime(freq, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.1, n + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.05);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + 0.06); } catch (e) {}
  }
  // "tempo scaduto!": un ronzio basso da quiz
  function tempoScaduto() {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var o = c.createOscillator(), g = c.createGain(), n = c.currentTime; o.type = "sawtooth"; o.frequency.setValueAtTime(190, n); o.frequency.linearRampToValueAtTime(150, n + 0.55);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.12, n + 0.02); g.gain.setValueAtTime(0.12, n + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.6);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + 0.62); } catch (e) {}
  }

  // la fine della puntata: un vincitore, oppure il pareggio con tutti i primi accesi insieme
  async function finaleStudio(S, primi, sotto) {
    if (primi.length <= 1) return ST.finale(S, primi.length ? primi[0] : -1, sotto);
    await ST.finale(S, -1, sotto);
    if (!S.vivo()) return;
    ST.lampo(S);
    primi.forEach(function (i) { ST.accendi(S, i, true); ST.faccia(S, i, "esulta"); });
    ST.terzo(S, null, "Pareggio!", nomiInsieme(primi.map(function (i) { return S.gioc[i] ? S.gioc[i].nome : ""; })) + " · " + sotto, "🤝");
    ST.pubblico(S, "ovazione"); ST.coriandoli();
    await ST.dorme(3000); ST.viaTerzo(S); ST.tutteNormali(S);
  }

  // ---- un giro: una lettera per tutti ----
  async function iniziaGiro(t, st) {
    var S = st.S; if (!S.vivo()) return;
    st.lettera = letteraACaso(st.usate, st.difficili);
    st.risposte = st.g.map(function () { return st.cats.map(function () { return ""; }); });
    st.voti = st.g.map(function () { return st.cats.map(function () { return st.g.map(function () { return false; }); }); });
    st.votiPronti = {};
    st.fatti = st.g.map(function () { return false; });
    st.g.forEach(function (g, i) { ST.puntiLeggio(S, i, g.punti, 0); foglietto(st, i, false); });
    await estraiLettera(st);
    for (var i = 0; i < st.g.length; i++) {
      if (!S.vivo()) return;
      await turnoScrittura(st, i);
    }
    if (!S.vivo()) return;
    ST.accendiSolo(S, -1);
    await ST.largo(S, 800);
    ST.terzo(S, null, "Tutti hanno scritto!", "Andiamo al tabellone 📋", "📋");
    ST.pubblico(S, "applauso");
    await ST.dorme(1600); ST.viaTerzo(S);
    for (var ci = 0; ci < st.cats.length; ci++) {
      if (!S.vivo()) return;
      await tabellone(st, ci);
    }
    if (!S.vivo()) return;
    calcolaPunti(st);
    await rivelaPunti(t, st);
  }

  // la lettera esce dal maxischermo come una slot machine
  async function estraiLettera(st) {
    var S = st.S, el = st.t.el;
    ST.viaBarra(S); ST.accendiSolo(S, -1);
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    // la slot machine: le lettere scorrono veloci e rallentano piano piano fino a fermarsi (tac… tac…… tac)
    var slot = ST.rullo(S, { cls: "nc-slot", alt: 230, voci: LETTERE, ultima: st.lettera, durata: 3600, scatto: function (k) { tick(k % 2 ? 640 : 820); } });
    var sotto = el("div", { class: "nc-sotto", text: "La lettera è…" });
    S.sch.appendChild(el("div", { class: "nc-estr" }, [ el("div", { class: "nc-giro", text: "Giro " + (st.giro + 1) + " di " + st.giri }), slot.el, sotto ]));
    ST.FX.rullo(3.4);
    await slot.via();
    slot.el.classList.add("fermo"); sotto.textContent = "Tutte le parole con la " + st.lettera + "!";
    ST.FX.applauso();
    await ST.dorme(1100);
    var cats = el("div", { class: "nc-cats" });
    st.cats.forEach(function (c) { cats.appendChild(el("span", { text: c.emoji + " " + c.testo })); });
    S.sch.firstChild.appendChild(cats);
    await ST.dorme(1300);
  }
  // il maxischermo mentre si scrive: la lettera enorme e chi ha già finito
  function schermoScrittura(st, i) {
    var S = st.S, el = st.t.el;
    ST.fermaTimer(S); ST.vuota(S.sch);
    var fatti = el("div", { class: "nc-fatti" });
    st.g.forEach(function (g, k) { fatti.appendChild(el("span", { class: st.fatti[k] ? "ok" : "" }, [ fac(el, g), el("span", { text: (st.fatti[k] ? "✅ " : "") + g.nome }) ])); });
    S.sch.appendChild(el("div", { class: "nc-estr" }, [
      el("div", { class: "nc-giro", text: "Giro " + (st.giro + 1) + " di " + st.giri }),
      el("div", { class: "nc-grande", text: st.lettera }),
      el("div", { class: "nc-chi", text: i != null ? "✍️ Scrive " + st.g[i].nome : "📋 Tutti hanno scritto" }),
      fatti
    ]));
  }
  function foglietto(st, i, scritto) { fogliettoS(st.S, i, scritto); }
  function fogliettoS(S, i, scritto) {
    var X = S.L[i]; if (!X) return;
    var f = X.el.querySelector(".nc-foglietto");
    if (!f) { f = document.createElement("div"); f.className = "nc-foglietto"; var piano = X.el.querySelector(".piano"); if (piano) piano.appendChild(f); }
    f.classList.toggle("scritto", !!scritto);
  }
  async function turnoScrittura(st, i) {
    var S = st.S, g = st.g[i], uno = st.g.length === 1;
    schermoScrittura(st, i);
    await ST.stacco(S, i, uno ? "Tocca a te scrivere!" : "Passa il telefono a " + g.nome);
    if (!uno) await ST.aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶");
    if (!S.vivo()) return;
    ST.accendiSolo(S, i); ST.testoLeggio(S, i, "✍️ scrive");
    await ST.suLeggio(S, i, 400);
    ST.lampo(S);
    st.risposte[i] = await apriFoglio(S, st.t.el, g, st.lettera, st.cats, st.secondi * 1000);   // la telecamera "entra" nel foglio: si scrive
    if (!S.vivo()) return;
    st.fatti[i] = true; foglietto(st, i, true);
    ST.testoLeggio(S, i, "✅ fatto"); ST.faccia(S, i, "esulta");
    schermoScrittura(st, i);
    await ST.dorme(700);
    ST.faccia(S, i, null);
  }
  // il foglio a righe: la lettera cerchiata, una riga per categoria, il tempo è una matita che si accorcia
  // ms = quanto tempo c'è; si chiude con "Ho finito", quando scade il tempo o se lo chiude il gioco (S._chiudiFoglio). Restituisce le parole.
  // opz.iniziali = parole già scritte (chi rientra le ritrova); opz.onCambia(parole, subito) = a ogni lettera (subito: lasciata la casella)
  function apriFoglio(S, el, g, lettera, cats, ms, opz) {
    opz = opz || {};
    return new Promise(function (fine) {
      var foglio = el("div", { class: "nc-foglio" }), campi = [], chiuso = false;
      function parole() { return campi.map(function (inp) { return (inp.value || "").trim(); }); }
      var barraT = el("i"), tempo = el("div", { class: "nc-tempo" }, [barraT]);
      var carta = el("div", { class: "nc-carta" }, [
        el("div", { class: "nc-testa" }, [ el("div", { class: "nc-chi2" }, [ fac(el, g), el("span", { text: g.nome }) ]), el("div", { class: "nc-lett", text: lettera }) ]),
        tempo
      ]);
      cats.forEach(function (c) {
        var inp = el("input", { type: "text", maxlength: "30", autocomplete: "off", autocapitalize: "words", spellcheck: "false", placeholder: "con la " + lettera + "…" });
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); var k = campi.indexOf(inp); if (campi[k + 1]) campi[k + 1].focus(); else inp.blur(); } });
        if (opz.iniziali && opz.iniziali[campi.length]) inp.value = String(opz.iniziali[campi.length]).slice(0, 30);
        if (opz.onCambia) {
          inp.addEventListener("input", function () { if (!chiuso) opz.onCambia(parole(), false); });
          inp.addEventListener("change", function () { if (!chiuso) opz.onCambia(parole(), true); });
        }
        campi.push(inp);
        carta.appendChild(el("label", { class: "nc-riga" }, [ el("span", { class: "c", text: c.emoji + " " + c.testo }), inp ]));
      });
      foglio.appendChild(carta);
      S.vista.appendChild(foglio);
      S.rec.classList.remove("on");   // sul foglio niente scritta "IN ONDA" sopra la lettera
      requestAnimationFrame(function () { foglio.classList.add("on"); });
      setTimeout(function () { foglio.classList.add("on"); }, 90);   // anche se lo schermo non ha ancora ridisegnato
      // il tempo: la barra si accorcia (solo transform), gli ultimi 10 secondi diventa rossa
      var partita = false, t0 = Date.now();
      function parti() { if (partita) return; partita = true; var resta = Math.max(0, ms - (Date.now() - t0)); barraT.style.transform = "scaleX(" + (resta / ms).toFixed(4) + ")"; void barraT.offsetWidth; barraT.style.transition = "transform " + resta + "ms linear"; barraT.style.transform = "scaleX(0)"; }
      requestAnimationFrame(function () { requestAnimationFrame(parti); });
      setTimeout(parti, 120);
      var toPoco = setTimeout(function () { tempo.classList.add("poco"); }, Math.max(0, ms - 10000));
      var toFine = setTimeout(function () { tempoScaduto(); chiudi(); }, ms);
      // gli ultimi 5 secondi: tic-tac e il numero grande 5-4-3-2-1
      var conto = el("div", { class: "nc-conto" }), toConto = [];
      S.vista.appendChild(conto);
      [5, 4, 3, 2, 1].forEach(function (n) {
        var quando = ms - n * 1000; if (quando < 0) return;
        toConto.push(setTimeout(function () {
          if (chiuso) return;
          conto.textContent = String(n); conto.classList.remove("on"); void conto.offsetWidth; conto.classList.add("on");
          tick(n === 1 ? 990 : 760);
        }, quando));
      });
      function chiudi() {
        if (chiuso) return; chiuso = true; clearTimeout(toFine); clearTimeout(toPoco); toConto.forEach(clearTimeout);
        if (conto.parentNode) conto.parentNode.removeChild(conto);
        var scritte = parole(); S._chiudiFoglio = null;
        try { if (document.activeElement) document.activeElement.blur(); } catch (e) {}
        ST.viaBarra(S);
        foglio.classList.add("via");
        setTimeout(function () { foglio.classList.remove("on"); setTimeout(function () { if (foglio.parentNode) foglio.parentNode.removeChild(foglio); fine(scritte); }, 260); }, 330);
      }
      S._chiudiFoglio = chiudi;
      // "Ho finito" chiede conferma (con quante caselle mancano): un tocco per sbaglio non chiude il foglio
      function tastoFinito() { ST.barra(S, [ el("button", { class: "btn btn-primario", text: "Ho finito ▶", onclick: chiediConferma }) ]); }
      function chiediConferma() {
        if (chiuso) return;
        var vuote = campi.filter(function (inp) { return !(inp.value || "").trim(); }).length;
        ST.barra(S, [
          el("div", { class: "nc-conf-testo", text: vuote ? "Ti " + (vuote === 1 ? "manca 1 casella" : "mancano " + vuote + " caselle") + ": hai finito davvero?" : "Hai finito davvero? Dopo non puoi più cambiare." }),
          el("div", { class: "nc-conf-riga" }, [
            el("button", { class: "btn btn-fantasma", text: "✏️ Continuo", onclick: tastoFinito }),
            el("button", { class: "btn btn-primario", text: "✅ Sì, ho finito", onclick: chiudi }) ])
        ]);
      }
      tastoFinito();
      setTimeout(function () { try { if (campi[0]) campi[0].focus({ preventScroll: true }); } catch (e) {} }, 650);
    });
  }

  // ---- il tabellone: una categoria alla volta, le parole di tutti e i voti ----
  function tabellone(st, ci) {
    var S = st.S, el = st.t.el, c = st.cats[ci];
    return new Promise(async function (fine) {
      if (!S.shot || S.shot() !== S.R.schermo) await ST.suSchermo(S, 800);
      ST.fermaTimer(S); ST.vuota(S.sch);
      var righe = el("div", { class: "nc-tab-righe" + (st.g.length > 6 ? " tanti" : "") });
      S.sch.appendChild(el("div", { class: "nc-tab" }, [
        el("div", { class: "nc-tab-testa" }, [ el("small", { text: "📋 Tabellone · lettera " + st.lettera + " · " + (ci + 1) + " di " + st.cats.length }), el("div", { class: "nc-tab-cat", text: c.emoji + " " + c.testo }) ]),
        righe
      ]));
      // le parole giuste partono col pollice su di tutti; le altre (lettera sbagliata o sconosciute) partono giù
      if (!(st.votiPronti || (st.votiPronti = {}))[ci]) {
        st.votiPronti[ci] = true;
        st.g.forEach(function (_, a) { var w = st.risposte[a][ci]; if (w && rispostaGiusta(w, c, st.lettera) !== false) st.g.forEach(function (_, k) { if (k !== a) st.voti[a][ci][k] = true; }); });
      }
      var votanti = st.g.length - 1, aggiorna = [];
      function vale(a) { if (!st.risposte[a][ci]) return false; var si = st.voti[a][ci].reduce(function (n, v, k) { return n + (k !== a && v ? 1 : 0); }, 0); return si * 2 > votanti; }
      // le parole uguali valgono di meno, ma solo tra quelle approvate (come nel calcolo dei punti): si ricontrolla tutto a ogni voto
      function aggiornaTutte() { var conta = {}; st.g.forEach(function (_, a) { if (vale(a)) { var w = norm(st.risposte[a][ci]); conta[w] = (conta[w] || 0) + 1; } }); aggiorna.forEach(function (f) { f(conta); }); }
      // ogni parola ha UN tasto (👍 vale / 👎 non vale, deciso a voce dal gruppo); con ⋯ si aprono i voti di ognuno
      st.g.forEach(function (g, a) {
        var testo = st.risposte[a][ci], riga = el("div", { class: "nc-tab-riga" });
        riga.style.animationDelay = (a * 0.12) + "s";
        var esito = el("span", { class: "nc-esito" }), tg = null, voti = null, bottoni = [];
        aggiorna.push(function (conta) {
          if (!testo) { esito.textContent = "0"; esito.className = "nc-esito"; return; }
          var si = st.voti[a][ci].reduce(function (n, v, k) { return n + (k !== a && v ? 1 : 0); }, 0), ok = vale(a);
          var doppia = ok && conta[norm(testo)] >= 2;
          esito.textContent = ok ? (doppia ? "uguale · 5" : "+10") : (votanti > 1 ? si + "/" + votanti + " · 0" : "0");
          esito.className = "nc-esito" + (ok ? (doppia ? " doppia" : " si") : "");
          if (tg) { tg.className = "nc-tg " + (ok ? "si" : "no"); tg.textContent = ok ? "👍" : "👎"; tg.setAttribute("aria-label", ok ? "Vale: tocca per bocciarla" : "Non vale: tocca per approvarla"); }
          bottoni.forEach(function (p) { p(); });
        });
        var su = el("div", { class: "nc-tab-su" }, [ fac(el, g), el("div", { class: "chi" }, [ el("span", { class: "nm", text: g.nome }),
          el("span", { class: "parola" + (testo ? "" : " vuota"), text: testo || "— vuoto" }) ]), esito ]);
        riga.appendChild(su);
        if (testo && votanti > 0) {
          tg = el("button", { class: "nc-tg" });
          tg.addEventListener("click", function () { var nuovo = !vale(a); st.g.forEach(function (_, k) { if (k !== a) st.voti[a][ci][k] = nuovo; }); aggiornaTutte(); });
          su.appendChild(tg);
          if (votanti > 1) {
            voti = el("div", { class: "nc-voti", hidden: "hidden" });
            st.g.forEach(function (gg, k) {
              if (k === a) return;   // l'autore non vota sé stesso
              var b = el("button", {});
              bottoni.push(function () { var on = st.voti[a][ci][k]; b.className = on ? "on" : ""; b.textContent = (on ? "👍 " : "👎 ") + gg.nome; });
              b.addEventListener("click", function () { st.voti[a][ci][k] = !st.voti[a][ci][k]; aggiornaTutte(); });
              voti.appendChild(b);
            });
            su.appendChild(el("button", { class: "nc-piu", text: "⋯", "aria-label": "Voti di ognuno", onclick: function () { voti.hidden = !voti.hidden; } }));
            riga.appendChild(voti);
          }
        }
        righe.appendChild(riga);
      });
      aggiornaTutte();
      var ultimo = ci === st.cats.length - 1;
      ST.barra(S, [ el("button", { class: "btn btn-primario", text: ultimo ? "🧮 Calcola i punti" : "Avanti ▶", onclick: function () { ST.viaBarra(S); fine(); } }) ]);
    });
  }

  // ---- calcolo punti del giro ----
  function calcolaPunti(st) {
    var votanti = st.g.length - 1;
    // 1) validità di ogni casella
    var valida = st.g.map(function (_, a) {
      return st.cats.map(function (_, ci) {
        var testo = st.risposte[a][ci];
        if (!testo) return false;
        var si = st.voti[a][ci].reduce(function (n, v, k) { return n + (k !== a && v ? 1 : 0); }, 0);
        return si * 2 > votanti;
      });
    });
    // 2) per ogni categoria, chi ha una parola valida uguale a un altro prende meno
    var esito = st.g.map(function () { return st.cats.map(function () { return 0; }); });
    st.cats.forEach(function (_, ci) {
      var conteggio = {};
      st.g.forEach(function (_, a) { if (valida[a][ci]) { var w = norm(st.risposte[a][ci]); conteggio[w] = (conteggio[w] || 0) + 1; } });
      st.g.forEach(function (_, a) {
        if (!valida[a][ci]) { esito[a][ci] = 0; return; }
        var w = norm(st.risposte[a][ci]);
        esito[a][ci] = conteggio[w] >= 2 ? PUNTI_DOPPIA : PUNTI_OK;
      });
    });
    // 3) somma
    st.g.forEach(function (gg, a) {
      var tot = esito[a].reduce(function (n, p) { return n + p; }, 0);
      gg.punti += tot;
      gg._ultimo = { esito: esito[a], valida: valida[a], tot: tot };
      registraProgresso(gg, st.cats, st.risposte[a], valida[a], esito[a]);
    });
  }

  // i punti scorrono sui leggii, poi la classifica del giro sul maxischermo
  async function rivelaPunti(t, st) {
    var S = st.S, el = t.el;
    ST.viaBarra(S);
    await ST.largo(S, 900);
    ST.terzo(S, null, "Fine giro " + (st.giro + 1), "Ecco i punti!", "🏁");
    for (var i = 0; i < st.g.length; i++) {
      var tot = st.g[i]._ultimo ? st.g[i]._ultimo.tot : 0;
      ST.puntiLeggio(S, i, st.g[i].punti, tot || 0);
      ST.faccia(S, i, tot > 0 ? "esulta" : "triste");
      await ST.dorme(320);
    }
    ST.pubblico(S, "applauso");
    await ST.dorme(1700); ST.viaTerzo(S); ST.tutteNormali(S);
    var ordine = conPosti(st.g.slice().sort(function (x, y) { return y.punti - x.punti; }));
    var ultimo = (st.giro + 1 >= st.giri);
    if (ultimo) {
      var primi = ordine.filter(function (o) { return o.pos === 1; }).map(function (o) { return st.g.indexOf(o.p); });
      await finaleStudio(S, primi, ordine[0].p.punti + " punti");
      var mioNome = t.nomeProfilo && t.nomeProfilo();
      var mioIndice = st.g.findIndex(function (gg) { return String(gg.nome).trim().toLowerCase() === String(mioNome || "").trim().toLowerCase(); });
      if (mioIndice >= 0) salvaTrofeiNcc(t, st.sessioneTrofei, st.g[mioIndice].nome, st.g[mioIndice].nome, st.g[mioIndice], primi.indexOf(mioIndice) >= 0 && st.g[mioIndice].punti > 0, false);   // a 0 punti non vince nessuno
      return t.fine(ordine.map(function (o) { return { nome: o.p.nome, punti: o.p.punti, pos: o.pos }; }));
    }
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "nc-clas" }, [ el("h2", { text: "🏁 Classifica dopo il giro " + (st.giro + 1) }) ]);
    ordine.forEach(function (o, k) {
      var gg = o.p, r = el("div", { class: "nc-cl" + (o.pos === 1 ? " primo" : "") }, [
        el("span", { class: "pos", text: medaglia(o.pos) }), fac(el, gg), el("span", { class: "nm", text: gg.nome }),
        el("span", { class: "pt", text: String(gg.punti) }), el("span", { class: "pi", text: "+" + (gg._ultimo ? gg._ultimo.tot : 0) })
      ]);
      r.style.animationDelay = (k * 0.1) + "s";
      box.appendChild(r);
    });
    S.sch.appendChild(box);
    await ST.aspettaTasto(S, "Prossimo giro ▶");
    st.giro += 1;
    iniziaGiro(t, st);
  }

  // =========================================================
  //  ONLINE — ognuno scrive dal suo telefono, tutti nello stesso momento.
  //  L'host tiene lo stato (lettera, tempo, parole, voti, punti) e lo manda a tutti;
  //  ogni telefono ha il suo studio e la sua regia (i momenti dello spettacolo uno dopo l'altro).
  //  Al tabellone ognuno vota dal suo telefono: una parola vale finché non la boccia almeno metà degli altri.
  // =========================================================
  var DURATA_LETTERA = 7400;    // la slot machine della lettera sui telefoni
  var ANTICIPO_FOGLIO = 1600;   // la telecamera va sul leggio e si apre il foglio: poi parte il tempo
  var GRAZIA = 2500;            // finito il tempo, aspetto i fogli che arrivano un po' in ritardo
  var TEMPO_VOTO = 90000;       // al massimo, per ogni categoria del tabellone
  function senzaReteN(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreN(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }

  function hostNcc(t, cats, imp) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteN(t);
    var nomeHost = (t.giocatori && t.giocatori[0]) || "Host";
    var H = { sessioneTrofei: sessioneNcc(), fase: "lobby", codice: "…", pronta: false, cats: cats, secondi: imp.secondi || 60, giri: imp.round || 2, difficili: !!imp.difficili,
      giro: 0, lettera: null, usate: [], giriFatti: 0, interrotta: false, sigla: false, risultatoDato: false,
      players: [{ id: "host", nome: nomeHost, omino: ST.mioAvatar(nomeHost), punti: 0, _trofei: nuovoProgresso() }],
      risposte: {}, bozze: {}, fatti: {}, voti: {}, ci: 0, pronti: {}, scadenza: 0, tabT0: 0, votoScade: 0, corto: false, ultimo: null, to: null };
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function pres() { return H.players.filter(function (p) { return !p.via; }); }
    function clearTo() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    function pulisciR(r) { return H.cats.map(function (_, ci) { return String((r && r[ci]) || "").trim().slice(0, 30); }); }
    function privato(id, m) { if (id === "host") return avvisoTardi(RN, m.bozza); m.to = id; rete.inviaVeloce(m); }
    // "⚙️ Regole" in saletta: categorie, secondi, giri e lettere (gli amici vedono subito le categorie cambiate)
    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      if (im.categorie && im.categorie.length) H.cats = completaCat(im.categorie);
      H.secondi = im.secondi || 60; H.giri = im.round || 2; H.difficili = !!im.difficili;
      bd();
    };
    var cb = { sonoHost: true, myId: "host",
      onComincia: comincia,
      onRisposte: function (r) { risposte("host", r); },
      onBozza: function (r) { bozza("host", r); },
      onVoto: function (a, ci, si) { voto("host", a, ci, si); },
      onPronto: function (ci) { pronto("host", ci); },
      onAvanti: function () { if (H.fase === "tabellone") prossimaCat(); },
      onProssimo: prossimoGiro, onNuova: nuova,
      onEsci: function () {
        if (H.fase !== "lobby" && H.fase !== "fine" && !window.confirm("Chiudere la partita per tutti?")) return;   // un tocco sbagliato non chiude il gioco a tutti
        clearTo(); rete.chiudi(); t.esci();
      } };
    var rete = SGNet.ospita("nomicose", {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        if (H.fase === "lobby") { H.players = H.players.filter(function (p) { return p.id !== id; }); bd(); return; }
        var p = pById(id); if (!p || p.via) return;
        p.via = true; controlla(); bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p = pById(id);
          if (!p && H.fase === "lobby" && H.players.length < 10) H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: ST.avatarValido(m.omino), punti: 0, _trofei: nuovoProgresso() });
          else if (p && p.via && H.fase !== "fine") { p.via = false; controlla(); }   // era uscito (o senza rete): rientra nella partita
          bd();   // a chi rientra rimando la foto (col tempo che resta, se si scrive)
        }
        else if (m.t === "risposte") risposte(id, m.r);
        else if (m.t === "bozza") bozza(id, m.r);
        else if (m.t === "voto") voto(id, m.a, m.ci, m.si);
        else if (m.t === "pronto") pronto(id, m.ci);
      },
      onErrore: function () { senzaReteN(t); }
    });
    function vm() {
      var o = { sessioneTrofei: H.sessioneTrofei, fase: H.fase, codice: H.codice, pronta: H.pronta, giro: H.giro, giri: H.giri, lettera: H.lettera, secondi: H.secondi, cats: H.cats,
        difficili: H.difficili, interrotta: H.interrotta, giriFatti: H.giriFatti,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino || null, punti: p.punti, via: !!p.via, trofei: p._trofei || null }; }),
        fatti: Object.keys(H.fatti) };
      if (H.fase === "scrittura") o.rimMs = Math.max(0, H.scadenza - Date.now());
      if (H.fase === "tabellone") {
        o.ci = H.ci; o.pronti = Object.keys(H.pronti); o.corto = H.corto;
        o.tab = H.players.map(function (p) { return { id: p.id, parola: (H.risposte[p.id] || [])[H.ci] || "", no: Object.keys(((H.voti[p.id] || {})[H.ci]) || {}) }; });
      }
      if (H.fase === "punti" || H.fase === "fine") o.ultimo = H.ultimo;
      return o;
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegnaNccVM(t, v, cb); }
    function comincia() {
      if (H.fase !== "lobby" || H.players.length < 2) return;
      H.giro = 0; H.lettera = null; H.usate = []; H.giriFatti = 0; H.interrotta = false; H.risultatoDato = false;
      H.players.forEach(function (p) { p.punti = 0; p._trofei = nuovoProgresso(); });
      if (H.sigla) return nuovoGiro();   // dalla seconda partita nella stessa stanza niente sigla: si parte subito
      H.sigla = true;
      H.fase = "apertura"; bd();   // la sigla dello studio, uguale su tutti i telefoni
      H.to = setTimeout(nuovoGiro, ST.durataApertura(H.players.length));
    }
    function nuovoGiro() {
      clearTo();
      H.lettera = letteraACaso(H.usate, H.difficili); H.risposte = {}; H.bozze = {}; H.fatti = {}; H.voti = {}; H.ci = 0; H.pronti = {}; H.ultimo = null; H.corto = false;
      H.fase = "lettera"; bd();
      H.to = setTimeout(scrittura, DURATA_LETTERA);
    }
    function scrittura() {
      clearTo();
      H.fase = "scrittura"; H.scadenza = Date.now() + H.secondi * 1000 + ANTICIPO_FOGLIO; bd();
      H.to = setTimeout(tabellone, H.secondi * 1000 + ANTICIPO_FOGLIO + GRAZIA);
    }
    // mentre si scrive ognuno manda ogni tanto il suo foglio a metà: se il foglio vero arriva tardi valgono queste parole
    function bozza(id, r) {
      var p = pById(id); if (H.fase !== "scrittura" || !p || p.via || H.fatti[id]) return;
      H.bozze[id] = pulisciR(r);
    }
    function risposte(id, r) {
      var p = pById(id); if (!p || p.via || H.fatti[id]) return;
      if (H.fase === "scrittura") { H.risposte[id] = pulisciR(r); H.fatti[id] = true; controlla(); bd(); return; }
      if (H.fase !== "tabellone" || H.ci !== 0) return;
      if (Date.now() - H.tabT0 < RITARDO_OK) {   // arrivato appena dopo il taglio: vale ancora (il tabellone sui telefoni non è ancora apparso)
        H.risposte[id] = pulisciR(r); H.fatti[id] = true; delete H.voti[id]; votiPartenzaDi(p); bd(); return;
      }
      H.fatti[id] = true;
      privato(id, { t: "tardi", bozza: !!H.bozze[id] });   // troppo tardi: glielo dico
    }
    function tabellone() {
      clearTo();
      pres().forEach(function (p) { if (!H.fatti[p.id] && H.bozze[p.id]) H.risposte[p.id] = H.bozze[p.id]; });   // chi non ha consegnato: vale la sua ultima bozza
      votiDiPartenza();
      H.fase = "tabellone"; H.ci = 0; H.pronti = {}; H.corto = false; H.tabT0 = Date.now(); bd();
      tempoVoto(TEMPO_VOTO);
    }
    function tempoVoto(ms) { clearTo(); H.votoScade = Date.now() + ms; H.to = setTimeout(prossimaCat, ms); }
    // le parole non giuste (lettera sbagliata o sconosciute) partono bocciate da tutti: basta un "Vale" per cambiare
    function votiDiPartenza() { H.players.forEach(votiPartenzaDi); }
    function votiPartenzaDi(p) {
      H.cats.forEach(function (cat, ci) {
        var w = (H.risposte[p.id] || [])[ci]; if (!w || rispostaGiusta(w, cat, H.lettera) !== false) return;
        var v = H.voti[p.id] || (H.voti[p.id] = {}), c = v[ci] || (v[ci] = {});
        H.players.forEach(function (q) { if (q.id !== p.id) c[q.id] = true; });
      });
    }
    function voto(id, a, ci, si) {
      if (H.fase !== "tabellone" || ci !== H.ci || id === a || !pById(id) || !pById(a)) return;
      var v = H.voti[a] || (H.voti[a] = {}), c = v[ci] || (v[ci] = {});
      if (si) delete c[id]; else c[id] = true;   // si segna solo chi la boccia
      bd();
    }
    function pronto(id, ci) {
      if (H.fase !== "tabellone" || ci !== H.ci || !pById(id)) return;
      H.pronti[id] = true; controlla();
      // più della metà ha votato: chi manca ha ancora 20 secondi, non 90
      var p = pres(), quanti = p.filter(function (q) { return H.pronti[q.id]; }).length;
      if (H.fase === "tabellone" && quanti < p.length && quanti * 2 > p.length && H.votoScade - Date.now() > TEMPO_CORTO) { H.corto = true; tempoVoto(TEMPO_CORTO); }
      bd();
    }
    function prossimaCat() {
      clearTo();
      if (H.ci + 1 < H.cats.length) { H.ci++; H.pronti = {}; H.corto = false; bd(); tempoVoto(TEMPO_VOTO); return; }
      calcola();
    }
    // chi ha finito di scrivere / di votare: quando ci sono tutti si va avanti senza aspettare il tempo
    function controlla() {
      if (H.fase === "lobby" || H.fase === "fine") return;
      if (pres().length < 2) {   // è rimasto uno solo: la partita si interrompe (nessuno vince)
        clearTo(); H.ultimo = H.ultimo || { tot: {} }; H.interrotta = true; H.fase = "fine"; return;
      }
      if (H.fase === "scrittura" && pres().every(function (p) { return H.fatti[p.id]; })) { clearTo(); H.to = setTimeout(tabellone, 1400); }
      if (H.fase === "tabellone" && pres().every(function (p) { return H.pronti[p.id]; })) { clearTo(); H.to = setTimeout(prossimaCat, 700); }
    }
    // i punti del giro: vale se più della metà degli altri non l'ha bocciata; uguale a un'altra valida = 5
    function calcola() {
      clearTo();
      var presenti = pres(), idsP = presenti.map(function (p) { return p.id; }), votanti = presenti.length - 1, tot = {}, validPer = {}, esitoPer = {};
      presenti.forEach(function (p) { tot[p.id] = 0; });
      H.cats.forEach(function (_, ci) {
        var valida = {}, conta = {};
        presenti.forEach(function (p) {
          var w = (H.risposte[p.id] || [])[ci] || "";
          if (!w) { valida[p.id] = false; return; }
          var no = Object.keys(((H.voti[p.id] || {})[ci]) || {}).filter(function (id) { return id !== p.id && idsP.indexOf(id) >= 0; }).length;
          valida[p.id] = (votanti - no) * 2 > votanti;
          if (valida[p.id]) { var k = norm(w); conta[k] = (conta[k] || 0) + 1; }
        });
        presenti.forEach(function (p) {
          var ok = !!valida[p.id], doppia = ok && conta[norm((H.risposte[p.id] || [])[ci])] >= 2;
          (validPer[p.id] || (validPer[p.id] = []))[ci] = ok;
          (esitoPer[p.id] || (esitoPer[p.id] = []))[ci] = ok ? (doppia ? PUNTI_DOPPIA : PUNTI_OK) : 0;
          if (ok) tot[p.id] += doppia ? PUNTI_DOPPIA : PUNTI_OK;
        });
      });
      presenti.forEach(function (p) {
        p.punti += tot[p.id];
        registraProgresso(p, H.cats, H.risposte[p.id] || [], validPer[p.id] || [], esitoPer[p.id] || []);
      });
      H.ultimo = { tot: tot }; H.giriFatti++;
      H.fase = (H.giro + 1 >= H.giri) ? "fine" : "punti"; bd();
      if (H.fase === "fine") daiRisultato();
    }
    // a fine partita: i nomi col loro posto (pari punti = stesso posto; chi è uscito in fondo). Serve al torneo e dà gli XP a tutti
    function daiRisultato() {
      if (H.risultatoDato || !t.risultato) return;
      H.risultatoDato = true;
      var ord = conPosti(pres().sort(function (a, b) { return b.punti - a.punti; })), cl = ord.map(function (o) { return { nome: o.p.nome, punti: o.p.punti, pos: o.pos }; });
      H.players.forEach(function (p) { if (p.via) cl.push({ nome: p.nome, punti: p.punti, pos: ord.length + 1 }); });
      t.risultato(cl);
    }
    function prossimoGiro() { if (H.fase === "punti") { H.giro++; nuovoGiro(); } }
    function nuova() {   // "Nuova partita": stessa stanza, si torna nella saletta (chi è uscito non c'è più, chi aspettava entra)
      if (H.fase !== "fine") return;
      clearTo();
      H.players = pres(); H.players.forEach(function (p) { p.punti = 0; p._trofei = nuovoProgresso(); });
      H.sessioneTrofei = sessioneNcc();   // partita nuova: i trofei contano anche questa (e ripartono da zero)
      H.fase = "lobby"; H.giro = 0; H.lettera = null; H.ultimo = null; H.interrotta = false; H.risposte = {}; H.bozze = {}; H.fatti = {}; H.voti = {};
      bd();
    }
    disegnaNccVM(t, vm(), cb);
  }
  var RITARDO_OK = 2500;   // un foglio che arriva entro 2,5 secondi dall'inizio del tabellone vale ancora
  var TEMPO_CORTO = 20000; // al tabellone, quando più della metà ha votato

  function ospiteNcc(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteN(t);
    var el = t.el, G = { myId: null, vm: null, rete: null, nome: "", msg: null, ultimoJoin: 0 };
    var cb = { sonoHost: false, myId: null,
      onRisposte: function (r) { G.rete && G.rete.invia({ t: "risposte", r: r }); },
      onBozza: function (r) { G.rete && G.rete.invia({ t: "bozza", r: r }); },
      onVoto: function (a, ci, si) { G.rete && G.rete.invia({ t: "voto", a: a, ci: ci, si: si }); },
      onPronto: function (ci) { G.rete && G.rete.invia({ t: "pronto", ci: ci }); },
      onEsci: function () {
        var f = G.vm && G.vm.fase;
        if (f && f !== "lobby" && f !== "fine" && idxN(G.vm, G.myId) >= 0 && !window.confirm("Uscire dalla partita?")) return;
        if (G.rete) G.rete.chiudi(); t.esci();
      } };
    function disegna() { if (G.vm) { cb.myId = G.myId; disegnaNccVM(t, G.vm, cb); } }
    function entra() { G.ultimoJoin = Date.now(); G.rete.invia({ t: "join", nome: G.nome, omino: ST.mioAvatar(G.nome) }); }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "✍️", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      G.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(G.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        G.nome = (input.value || "Amico").trim() || "Amico"; G.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function collega() {
      G.rete = SGNet.entra(codice, {
        onAperto: function (id) { G.myId = id; entra();
          setTimeout(function () { if (!G.vm && G.msg) G.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== G.myId) return;   // era per un altro telefono
          if (m.t === "vm") {
            G.vm = m.vm;
            // in saletta e non ci sono (arrivato a partita iniziata, o la stanza era piena): chiedo di nuovo di entrare
            if (G.vm.fase === "lobby" && G.myId && idxN(G.vm, G.myId) < 0 && G.vm.players.length < 10 && Date.now() - G.ultimoJoin > 2000) entra();
            disegna();
          }
          else if (m.t === "tardi") avvisoTardi(RN, m.bozza);
        },
        onChiuso: function () { if (G.vm && G.vm.fase === "fine") return; erroreN(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { erroreN(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  // un avviso in alto sullo studio (sparisce da solo)
  function avvisoStudio(R, testo, ms) {
    if (!R || !R.S || !R.S.vivo()) return;
    var a = R.t.el("div", { class: "nc-guardi", text: testo });
    R.S.vista.appendChild(a);
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, ms || 4500);
  }
  function avvisoTardi(R, conBozza) {
    avvisoStudio(R, conBozza ? "⏰ Il tuo foglio è arrivato tardi: valgono le parole salvate pochi secondi prima" : "⏰ Il tuo foglio è arrivato tardi: questa volta le tue parole non contano", 5000);
  }

  // ---- ogni telefono: lobby, poi lo studio con la sua regia ----
  var RN = null;
  function idxN(vm, id) { for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return i; return -1; }
  function disegnaNccVM(t, vm, cb) {
    assicuraStileN();
    if (vm.fase === "lobby") { RN = null; return lobbyN(t, vm, cb); }
    // lo studio si fa una volta per partita (e di nuovo se l'host ricomincia dopo la fine)
    if (!RN || (!RN.S.vivo() && (vm.fase !== "fine" || !RN.fineFatta))) {
      RN = { t: t, cb: cb, usciti: {} };
      RN.S = ST.crea(t, vm.players, { io: idxN(vm, cb.myId), esci: function () { cb.onEsci(); }, titolo: "Nomi, Cose e Città", logo: ["NOMI, COSE", "E CITTÀ"] });
      vm.players.forEach(function (p, i) { ST.puntiLeggio(RN.S, i, p.punti, 0); });
      // arrivato a partita iniziata (o stanza piena): guarda, e lo sa
      if (idxN(vm, cb.myId) < 0) RN.S.vista.appendChild(t.el("div", { class: "nc-guardi", text: "👀 Partita già cominciata: la guardi, entri alla prossima" }));
    }
    RN.vm = vm; RN.cb = cb; RN.vmTs = Date.now();
    if (vm.fase !== "scrittura" && RN.S._chiudiFoglio) RN.S._chiudiFoglio();   // il tempo è finito per tutti: il foglio si chiude
    regiaTickN(RN);
  }
  async function regiaTickN(R) {
    if (R.corre) { R.ancora = true; return; }
    R.corre = true;
    try {
      for (var giri = 0; giri < 40; giri++) {
        R.ancora = false;
        var fatto = await regiaPassoN(R);
        if (!fatto && !R.ancora) break;
      }
    } catch (e) {} finally { R.corre = false; }
  }
  // devo ancora scrivere? (rientrato dopo essere uscito, o la prima volta ero fuori)
  function devoScrivere(R, vm) {
    var io = idxN(vm, R.cb.myId), me = vm.players[io];
    return io >= 0 && me && !me.via && (vm.fatti || []).indexOf(R.cb.myId) < 0 && R.foglioGiro !== vm.giro && !R.S._chiudiFoglio;
  }
  // un passo della regia: true se ha fatto un momento dello spettacolo (poi si guarda lo stato più recente)
  async function regiaPassoN(R) {
    var vm = R.vm, S = R.S;
    if (!S.vivo()) return false;
    vm.players.forEach(function (p, i) {
      if (p.via && !R.usciti[p.id]) { R.usciti[p.id] = true; ST.fuori(S, i, true); ST.testoLeggio(S, i, "👋 uscito", true); }
      else if (!p.via && R.usciti[p.id]) { delete R.usciti[p.id]; ST.fuori(S, i, false); ST.puntiLeggio(S, i, p.punti, 0); }   // è rientrato
    });
    var kG = vm.giro;
    if (vm.fase === "apertura") {
      if (R.aperturaFatta) return false;
      R.aperturaFatta = true; await ST.apertura(S); return true;
    }
    R.aperturaFatta = true;
    if (vm.fase === "lettera") {
      if (R.kLettera === kG) return false;
      R.kLettera = kG;
      vm.players.forEach(function (p, i) { if (!p.via) { ST.puntiLeggio(S, i, p.punti, 0); fogliettoS(S, i, false); } });
      await estraiLettera({ S: S, t: R.t, giro: vm.giro, giri: vm.giri, lettera: vm.lettera, cats: vm.cats });
      return true;
    }
    if (vm.fase === "scrittura") {
      if (R.kScrivi !== kG || devoScrivere(R, vm)) { R.kScrivi = kG; R.kLettera = kG; await scriviOnline(R); return true; }
      // ho consegnato ma l'host non mi ha ancora tra i "fatti" (messaggio perso, o ero fuori per un attimo): lo rimando
      var mio = vm.players[idxN(vm, R.cb.myId)], inv = R.inviate;
      if (mio && !mio.via && inv && inv.giro === vm.sessioneTrofei + "|" + vm.giro && (vm.fatti || []).indexOf(R.cb.myId) < 0 && Date.now() - inv.ts > 2000) { inv.ts = Date.now(); R.cb.onRisposte(inv.r); }
      aggiornaFatti(R, vm); return false;
    }
    if (vm.fase === "tabellone") {
      var kT = kG + "|" + vm.ci, kP = vm.players.map(function (p) { return p.via ? 0 : 1; }).join("");
      if (R.kTab !== kT) { R.kTab = kT; R.kTabP = kP; R.kScrivi = kG; await tabelloneOnline(R, vm); return true; }
      if (R.kTabP !== kP && R.righeTab) { R.kTabP = kP; await tabelloneOnline(R, vm, true); return true; }   // qualcuno è uscito o rientrato: ridisegno le righe
      aggiornaTab(R, vm); return false;
    }
    if (vm.fase === "punti" || vm.fase === "fine") {
      if (R.kPunti !== kG && !vm.interrotta) { R.kPunti = kG; await puntiOnline(R, vm); return true; }
      if (vm.fase === "fine") {
        if (R.fineFatta) return false;
        R.fineFatta = true; await finaleOnline(R, vm); return true;
      }
      if (R.kClas !== kG) { R.kClas = kG; await classificaOnline(R, vm); return true; }
      return false;
    }
    return false;
  }
  // tutti scrivono insieme: la telecamera va sul mio leggio e si apre il MIO foglio
  async function scriviOnline(R) {
    var S = R.S, el = R.t.el, cb = R.cb, vm = R.vm, io = idxN(vm, cb.myId), me = vm.players[io];
    schermoScritturaOnline(R, vm);
    if (io < 0 || !me || me.via || (vm.fatti || []).indexOf(cb.myId) >= 0) { await ST.suSchermo(S, 800); return; }
    R.foglioGiro = vm.giro;
    ST.accendiSolo(S, io); ST.testoLeggio(S, io, "✍️ scrive");
    ST.terzo(S, io, "Si scrive tutti insieme!", "Parole con la " + vm.lettera, "✍️");
    await ST.suLeggio(S, io, 700);
    ST.viaTerzo(S); ST.lampo(S);
    if (R.vm.fase !== "scrittura") return;   // intanto il tempo è finito
    var rim = Math.max(3000, (R.vm.rimMs || 0) - (Date.now() - R.vmTs));   // il tempo che resta secondo l'host
    // il foglio a metà resta sul telefono (se la pagina si ricarica lo ritrovo) e ogni tanto va all'host
    var chiave = vm.sessioneTrofei + "|" + vm.giro + "|" + vm.lettera + "|" + cb.myId, salvata = leggiLS(K_BOZZA, null);
    var iniziali = salvata && salvata.k === chiave && Array.isArray(salvata.r) ? salvata.r : null;
    var ora = iniziali, inviata = "", toB = null;
    function mandaBozza() { toB = null; if (!ora || !cb.onBozza) return; var s = JSON.stringify(ora); if (s === inviata) return; inviata = s; cb.onBozza(ora); }
    if (iniziali) mandaBozza();
    var parole = await apriFoglio(S, el, me, vm.lettera, vm.cats, rim, { iniziali: iniziali, onCambia: function (r, subito) {
      ora = r; scriviLS(K_BOZZA, { k: chiave, r: r });
      if (subito) { clearTimeout(toB); mandaBozza(); } else if (!toB) toB = setTimeout(mandaBozza, 2000);
    } });
    clearTimeout(toB);
    if (!S.vivo()) return;
    cb.onRisposte(parole);
    R.inviate = { giro: vm.sessioneTrofei + "|" + vm.giro, r: parole, ts: Date.now() };   // se l'host non lo riceve, lo rimando
    fogliettoS(S, io, true); ST.testoLeggio(S, io, "✅ fatto"); ST.faccia(S, io, "esulta");
    await ST.suSchermo(S, 800);
    ST.faccia(S, io, null);
    if (R.vm.fase === "scrittura") ST.barra(S, [ el("p", { class: "nc-attesa", text: "Fatto! Aspettiamo gli altri…" }) ]);
  }
  function schermoScritturaOnline(R, vm) {
    var S = R.S, el = R.t.el;
    ST.fermaTimer(S); ST.vuota(S.sch);
    R.listaFatti = el("div", { class: "nc-fatti" }); R.kFatti = null;
    S.sch.appendChild(el("div", { class: "nc-estr" }, [
      el("div", { class: "nc-giro", text: "Giro " + (vm.giro + 1) + " di " + vm.giri }),
      el("div", { class: "nc-grande", text: vm.lettera }),
      el("div", { class: "nc-chi", text: "✍️ Scrivono tutti" }),
      R.listaFatti
    ]));
    aggiornaFatti(R, vm);
  }
  function aggiornaFatti(R, vm) {
    var S = R.S, el = R.t.el, fatti = vm.fatti || [], k = fatti.join("|") + "#" + vm.players.map(function (p) { return p.via ? 0 : 1; }).join("");
    if (R.kFatti === k) return;
    R.kFatti = k;
    if (R.listaFatti) {
      ST.vuota(R.listaFatti);
      vm.players.forEach(function (p) { if (p.via) return; var ok = fatti.indexOf(p.id) >= 0;
        R.listaFatti.appendChild(el("span", { class: ok ? "ok" : "" }, [ fac(el, p), el("span", { text: (ok ? "✅ " : "") + p.nome }) ])); });
    }
    vm.players.forEach(function (p, i) { if (p.via) return; var ok = fatti.indexOf(p.id) >= 0; fogliettoS(S, i, ok); ST.testoLeggio(S, i, ok ? "✅ fatto" : "✍️ scrive"); });
  }
  // il tabellone: una categoria alla volta, le parole di tutti; io voto le parole degli altri dal mio telefono
  async function tabelloneOnline(R, vm, ridisegna) {
    var S = R.S, el = R.t.el, cb = R.cb, ci = vm.ci, c = vm.cats[ci] || { emoji: "", testo: "" };
    ST.viaBarra(S); R.righeTab = null; R.kBarra = null; R.kVotati = null;
    if (ci === 0 && !ridisegna) {   // prima categoria: si va al tabellone
      ST.accendiSolo(S, -1); await ST.largo(S, 800);
      ST.terzo(S, null, "Tutti hanno scritto!", "Andiamo al tabellone 📋", "📋"); ST.pubblico(S, "applauso");
      await ST.dorme(1500); ST.viaTerzo(S);
      if (!S.vivo()) return;
    }
    if (!S.shot || S.shot() !== S.R.schermo) await ST.suSchermo(S, 800);
    vm = R.vm; if (vm.fase !== "tabellone" || vm.ci !== ci) return;   // intanto si è andati avanti
    ST.fermaTimer(S); ST.vuota(S.sch);
    var righe = el("div", { class: "nc-tab-righe" + (vm.players.filter(function (p) { return !p.via; }).length > 6 ? " tanti" : "") });
    S.sch.appendChild(el("div", { class: "nc-tab" }, [
      el("div", { class: "nc-tab-testa" }, [ el("small", { text: "📋 Tabellone · lettera " + vm.lettera + " · " + (ci + 1) + " di " + vm.cats.length }), el("div", { class: "nc-tab-cat", text: c.emoji + " " + c.testo }) ]),
      righe
    ]));
    R.mieiNo = {}; R.righeTab = {};
    var io = idxN(vm, cb.myId);
    (vm.tab || []).forEach(function (w, a) {
      var p = vm.players[a]; if (!p || p.via) return;
      var riga = el("div", { class: "nc-tab-riga" }), esito = el("span", { class: "nc-esito" });
      riga.style.animationDelay = (a * 0.12) + "s";
      var su = el("div", { class: "nc-tab-su" }, [ fac(el, p), el("div", { class: "chi" }, [ el("span", { class: "nm", text: p.id === cb.myId ? "Tu" : p.nome }),
        el("span", { class: "parola" + (w.parola ? "" : " vuota"), text: w.parola || "— vuoto" }) ]), esito ]);
      riga.appendChild(su);
      if (w.parola && p.id !== cb.myId && io >= 0 && !vm.players[io].via) {   // il mio voto, sulla stessa riga
        var b = el("button", { class: "nc-mio" });
        R.mieiNo[p.id] = (w.no || []).indexOf(cb.myId) >= 0;
        var pinta = function () { var no = R.mieiNo[p.id]; b.className = "nc-mio" + (no ? " no" : " si"); b.textContent = no ? "👎 No" : "👍 Vale"; b.setAttribute("aria-label", no ? "Non vale: tocca per approvarla" : "Vale: tocca per bocciarla"); };
        b.addEventListener("click", function () { R.mieiNo[p.id] = !R.mieiNo[p.id]; pinta(); cb.onVoto(p.id, ci, !R.mieiNo[p.id]); aggiornaTab(R, R.vm); });
        pinta(); su.appendChild(b);
      }
      R.righeTab[p.id] = esito;
      righe.appendChild(riga);
    });
    aggiornaTab(R, vm);
  }
  function aggiornaTab(R, vm) {
    var S = R.S, el = R.t.el, cb = R.cb;
    if (!R.righeTab || vm.fase !== "tabellone") return;
    var presenti = vm.players.filter(function (p) { return !p.via; }), idsP = presenti.map(function (p) { return p.id; }), votanti = presenti.length - 1;
    var stato = {}, conta = {};
    (vm.tab || []).forEach(function (w, a) {
      var p = vm.players[a]; if (!p || p.via || !w.parola) return;
      var no = (w.no || []).filter(function (id) { return id !== p.id && idsP.indexOf(id) >= 0; });
      if (p.id !== cb.myId && R.mieiNo && R.mieiNo[p.id] != null) {   // il mio voto lo conosco già (anche se l'host non l'ha ancora rimandato)
        no = no.filter(function (id) { return id !== cb.myId; }); if (R.mieiNo[p.id]) no.push(cb.myId);
      }
      var si = votanti - no.length, ok = si * 2 > votanti;
      stato[p.id] = { ok: ok, si: si };
      if (ok) { var k = norm(w.parola); conta[k] = (conta[k] || 0) + 1; }
    });
    (vm.tab || []).forEach(function (w, a) {
      var p = vm.players[a], e = p && R.righeTab[p.id]; if (!e) return;
      if (!w.parola || !stato[p.id]) { e.textContent = "0"; e.className = "nc-esito"; return; }
      var s2 = stato[p.id], doppia = s2.ok && conta[norm(w.parola)] >= 2;
      e.textContent = s2.ok ? (doppia ? "uguale · 5" : "+10") : (votanti > 1 ? s2.si + "/" + votanti + " · 0" : "0");
      e.className = "nc-esito" + (s2.ok ? (doppia ? " doppia" : " si") : "");
    });
    var pronti = vm.pronti || [], io = idxN(vm, cb.myId), gioco = io >= 0 && !vm.players[io].via;
    var sonoPronto = pronti.indexOf(cb.myId) >= 0 || R.prontoCi === vm.giro + "|" + vm.ci;
    // chi ha già votato: la spunta sul suo leggio
    var kV = vm.ci + "#" + pronti.join("|") + "#" + idsP.join("|");
    if (R.kVotati !== kV) { R.kVotati = kV; presenti.forEach(function (p) { ST.testoLeggio(S, idxN(vm, p.id), pronti.indexOf(p.id) >= 0 ? "✅ votato" : "🗳️ vota"); }); }
    var mancano = presenti.filter(function (p) { return pronti.indexOf(p.id) < 0 && !(p.id === cb.myId && sonoPronto); }).map(function (p) { return p.id === cb.myId ? "te" : p.nome; });
    // l'host può andare avanti senza aspettare quando ha votato più della metà
    var avanti = cb.sonoHost && sonoPronto && mancano.length > 0 && (presenti.length - mancano.length) * 2 > presenti.length;
    var k = vm.ci + "|" + (sonoPronto ? 1 : 0) + "|" + mancano.join(",") + "|" + (vm.corto ? 1 : 0) + "|" + (avanti ? 1 : 0);
    if (R.kBarra === k) return;
    R.kBarra = k;
    var ultima = vm.ci === vm.cats.length - 1;
    if (gioco && !sonoPronto) ST.barra(S, [ el("button", { class: "btn btn-primario", text: ultima ? "✅ Ho votato: i punti!" : "✅ Ho votato, avanti ▶",
      onclick: function () { R.prontoCi = vm.giro + "|" + vm.ci; cb.onPronto(vm.ci); aggiornaTab(R, R.vm); } }) ]);
    else ST.barra(S, [
      el("p", { class: "nc-attesa", text: mancano.length ? "Aspettiamo: " + mancano.join(", ") + (vm.corto ? " · si va avanti tra poco" : "") : "Si va avanti…" }),
      avanti ? el("button", { class: "btn btn-fantasma", text: "⏭ Avanti senza aspettare", onclick: function () { ST.viaBarra(S); cb.onAvanti && cb.onAvanti(); } }) : null
    ]);
  }
  // i punti del giro scorrono sui leggii
  async function puntiOnline(R, vm) {
    var S = R.S, tot = (vm.ultimo && vm.ultimo.tot) || {};
    ST.viaBarra(S); ST.accendiSolo(S, -1); ST.viaTerzo(S);
    await ST.largo(S, 900);
    ST.terzo(S, null, "Fine giro " + (vm.giro + 1), "Ecco i punti!", "🏁");
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
  function ordineN(vm) { return conPosti(vm.players.filter(function (p) { return !p.via; }).sort(function (x, y) { return y.punti - x.punti; })); }
  async function classificaOnline(R, vm) {
    var S = R.S, el = R.t.el, cb = R.cb, tot = (vm.ultimo && vm.ultimo.tot) || {};
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "nc-clas" }, [ el("h2", { text: "🏁 Classifica dopo il giro " + (vm.giro + 1) }) ]);
    ordineN(vm).forEach(function (o, k) {
      var p = o.p, r = el("div", { class: "nc-cl" + (o.pos === 1 ? " primo" : "") }, [
        el("span", { class: "pos", text: medaglia(o.pos) }), fac(el, p), el("span", { class: "nm", text: p.nome + (p.id === cb.myId ? " (tu)" : "") }),
        el("span", { class: "pt", text: String(p.punti) }), el("span", { class: "pi", text: "+" + (tot[p.id] || 0) })
      ]);
      r.style.animationDelay = (k * 0.1) + "s";
      box.appendChild(r);
    });
    S.sch.appendChild(box);
    if (cb.sonoHost) ST.barra(S, [ el("button", { class: "btn btn-primario", text: "Prossimo giro ▶", onclick: function () { ST.viaBarra(S); cb.onProssimo(); } }) ]);
    else ST.barra(S, [ el("p", { class: "nc-attesa", text: "Il prossimo giro lo fa partire l'host…" }) ]);
  }
  async function finaleOnline(R, vm) {
    var S = R.S, ordine = ordineN(vm), primi = ordine.filter(function (o) { return o.pos === 1; }).map(function (o) { return idxN(vm, o.p.id); });
    var io = idxN(vm, R.cb.myId), mio = io >= 0 ? vm.players[io] : null;
    // trofei: solo chi era ancora in partita; se la partita si è interrotta, solo se si è giocato almeno un giro intero
    if (mio && !mio.via && (!vm.interrotta || vm.giriFatti >= 1)) {
      salvaTrofeiNcc(R.t, vm.sessioneTrofei, mio.id, mio.nome, { punti: mio.punti, _trofei: mio.trofei || nuovoProgresso() }, !vm.interrotta && primi.indexOf(io) >= 0 && mio.punti > 0, true);
    }
    if (vm.interrotta) {   // sono usciti gli altri: nessuno vince
      ST.viaBarra(S); ST.fermaTimer(S); ST.logoSchermo(S); ST.accendiSolo(S, -1);
      await ST.largo(S, 900);
      ST.terzo(S, null, "Partita interrotta", "Sono usciti gli altri giocatori", "👋");
      await ST.dorme(2400); ST.viaTerzo(S);
    } else await finaleStudio(S, primi, (ordine[0] ? ordine[0].p.punti : 0) + " punti");
    if (RN !== R) return;   // intanto l'host ha già fatto ripartire (siamo nella saletta)
    fineN(R.t, vm, R.cb, ordine);
  }
  function fineN(t, vm, cb, ordine) {
    var el = t.el, primi = ordine.filter(function (o) { return o.pos === 1; }).map(function (o) { return o.p.nome; });
    var titolo = vm.interrotta ? "Partita interrotta" : primi.length > 1 ? "Pareggio tra " + nomiInsieme(primi) + "!" : primi.length ? "Vince " + primi[0] + "!" : "Fine partita";
    var s = t.schermata({ icona: vm.interrotta ? "👋" : primi.length > 1 ? "🤝" : "🏆", titolo: titolo, sotto: vm.interrotta ? "Sono usciti gli altri giocatori" : "Nomi, Cose e Città" });
    var box = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    ordine.forEach(function (o) {
      var p = o.p;
      box.appendChild(el("div", { class: "nc-cl" + (o.pos === 1 && !vm.interrotta ? " primo" : "") }, [
        el("span", { class: "pos", text: vm.interrotta ? "·" : medaglia(o.pos) }), fac(el, p), el("span", { class: "nm", text: p.nome + (p.id === cb.myId ? " (tu)" : "") }),
        el("span", { class: "pt", text: p.punti + " punti" })
      ]));
    });
    s._contenuto.appendChild(box);
    if (cb.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏁 Fine", onclick: cb.onEsci }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "Se l'host fa un'altra partita, tornerai nella saletta senza fare niente." }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
  }
  // la saletta d'attesa (uguale per tutti i giochi): sotto, le categorie e il tempo scelti dall'host
  function lobbyN(t, vm, cb) {
    var el = t.el, cc = el("div", { class: "nc-cats nc-cats-lobby" });
    (vm.cats || []).forEach(function (c) { cc.appendChild(el("span", { text: c.emoji + " " + c.testo })); });
    var info = el("div", {}, [ el("div", { class: "etichetta", text: "Categorie · " + vm.secondi + " secondi · " + (vm.giri === 1 ? "1 giro" : vm.giri + " giri") + (vm.difficili ? " · anche U e Z" : "") }), cc ]);
    var extra = [info];
    if (!cb.sonoHost && idxN(vm, cb.myId) < 0) extra.unshift(el("p", { class: "link-avviso", text: vm.players.length >= 10
      ? "La stanza è piena (10 giocatori): se qualcuno esce entri tu."
      : "Ti sto facendo entrare…" }));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, testoComincia: "Via ▶",
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: extra, attesa: "Aspetta che l'host dia il via: poi scrivete tutti insieme!",
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
})();
