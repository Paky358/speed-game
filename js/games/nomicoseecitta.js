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
  var K_PERSO = "sg_ncc_perso";
  var PUNTI_OK = 10;      // parola valida e unica
  var PUNTI_DOPPIA = 5;   // parola valida ma scritta anche da un altro

  function catPerso() { try { return JSON.parse(localStorage.getItem(K_PERSO)) || []; } catch (e) { return []; } }
  function salvaPerso(a) { try { localStorage.setItem(K_PERSO, JSON.stringify(a)); } catch (e) {} }

  function letteraACaso(escludi) {
    var l;
    do { l = LETTERE[Math.floor(Math.random() * LETTERE.length)]; } while (l === escludi && LETTERE.length > 1);
    return l;
  }
  function norm(s) { return (s || "").trim().toLowerCase(); }

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
    var persona = /personaggio|cantante/i.test((cat && cat.testo) || "");
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
      "Ogni giro esce una <b>lettera</b> uguale per tutti: a turno ciascuno riempie le categorie con parole che iniziano con quella lettera.",
      "Poi si <b>vota</b>: per ogni parola gli altri dicono se vale. Ognuno ha il suo tasto e può cambiare idea cliccando di nuovo.",
      "Le parole <b>giuste</b> (con la lettera giusta e che il gioco conosce) partono già con <b>👍 da tutti</b>; quelle con la lettera sbagliata o che il gioco non conosce partono bocciate: basta un tocco per cambiare voto.",
      "Se <b>più della metà</b> approva la parola vale <b>10 punti</b>; se due hanno scritto la <b>stessa</b> parola valgono <b>5</b> a testa; se è bocciata o vuota, <b>0</b>.",
      "Si gioca un certo numero di giri: alla fine vince chi ha totalizzato più punti.",
      "<b>Online</b> (ognuno dal suo telefono): si scrive tutti nello stesso momento, poi al tabellone ognuno vota dal suo telefono. Una parola <b>vale</b> se non la boccia almeno metà degli altri."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      var dati = window.SG_NCC_CATEGORIE || { normali: [], black: [] };
      var scelte = dati.normali.slice(0, 5);
      dove.categorie = scelte;
      dove.secondi = 60;
      dove.round = 2;
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

      function isScelta(c) { return scelte.indexOf(c) >= 0; }
      function toggle(c, chip) {
        var i = scelte.indexOf(c);
        if (i >= 0) scelte.splice(i, 1); else scelte.push(c);
        chip.className = "cat-chip" + (isScelta(c) ? " attiva" : "");
        aggiornaConta();
      }
      function chipDi(c) {
        var chip = el("button", { class: "cat-chip" + (isScelta(c) ? " attiva" : ""), onclick: function () { toggle(c, chip); } }, [
          el("span", { class: "ci", text: c.emoji }),
          el("span", { text: c.testo }),
          el("span", { class: "spunta", text: "✓" })
        ]);
        return chip;
      }

      var conta = el("p", { class: "modulo-nota" });
      function aggiornaConta() {
        conta.textContent = scelte.length + (scelte.length === 1 ? " categoria scelta" : " categorie scelte")
          + (scelte.length < 3 ? " · scegline almeno 3" : "");
      }

      box.appendChild(el("div", { class: "etichetta", text: "Categorie" }));
      var gN = el("div", { class: "cat-griglia" });
      dati.normali.forEach(function (c) { gN.appendChild(chipDi(c)); });
      box.appendChild(gN);

      if (dati.black && dati.black.length) {
        box.appendChild(el("div", { class: "etichetta", text: "😈 Black humor" }));
        var gB = el("div", { class: "cat-griglia" });
        dati.black.forEach(function (c) { gB.appendChild(chipDi(c)); });
        box.appendChild(gB);
      }

      box.appendChild(el("div", { class: "etichetta", text: "✏️ Le tue categorie" }));
      var gP = el("div", { class: "cat-griglia" });
      box.appendChild(gP);
      function disegnaPerso() {
        while (gP.firstChild) gP.removeChild(gP.firstChild);
        catPerso().forEach(function (c) {
          var riga = el("div", { style: "display:flex;gap:6px;align-items:stretch" });
          riga.appendChild(chipDi(c));
          riga.appendChild(el("button", { class: "togli", text: "×", "aria-label": "Elimina", onclick: function () {
            salvaPerso(catPerso().filter(function (x) { return x.testo !== c.testo; }));
            var i = scelte.indexOf(c); if (i >= 0) scelte.splice(i, 1);
            disegnaPerso(); aggiornaConta();
          } }));
          gP.appendChild(riga);
        });
      }
      catPerso().forEach(function (c) { if (scelte.indexOf(c) < 0) scelte.push(c); });
      disegnaPerso();

      var campo = el("input", { class: "link-campo", type: "text", maxlength: "28", placeholder: "Es. Un supereroe, Una scusa…" });
      var aggiungi = el("button", { class: "btn btn-fantasma", text: "＋ Aggiungi la categoria", onclick: function () {
        var testo = (campo.value || "").trim();
        if (testo.length < 2) return;
        var nuova = { emoji: "✏️", testo: testo };
        var lista = catPerso(); lista.push(nuova); salvaPerso(lista);
        scelte.push(nuova); campo.value = "";
        disegnaPerso(); aggiornaConta();
      } });
      box.appendChild(campo);
      box.appendChild(aggiungi);

      box.appendChild(el("div", { class: "etichetta", text: "Tempo per turno" }));
      var bt = {};
      function scegliSec(v) { dove.secondi = v; [60, 90, 120].forEach(function (x) { bt[x].className = "modo-chip" + (v === x ? " attiva" : ""); }); }
      var gT = el("div", { class: "modo-griglia" });
      [60, 90, 120].forEach(function (v) {
        bt[v] = el("button", { class: "modo-chip" + (v === 60 ? " attiva" : ""), onclick: function () { scegliSec(v); } }, [
          el("div", {}, [ el("div", { class: "mt", text: v + " sec" }) ]) ]);
        gT.appendChild(bt[v]);
      });
      box.appendChild(gT);

      box.appendChild(el("div", { class: "etichetta", text: "Giri a testa" }));
      var br = {};
      function scegliRound(v) { dove.round = v; [1, 2, 3].forEach(function (x) { br[x].className = "modo-chip" + (v === x ? " attiva" : ""); }); }
      var gR = el("div", { class: "modo-griglia" });
      [1, 2, 3].forEach(function (v) {
        br[v] = el("button", { class: "modo-chip" + (v === 2 ? " attiva" : ""), onclick: function () { scegliRound(v); } }, [
          el("div", {}, [ el("div", { class: "mt", text: v === 1 ? "1 giro" : v + " giri" }) ]) ]);
        gR.appendChild(br[v]);
      });
      box.appendChild(gR);

      box.appendChild(conta);
      aggiornaConta();
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteNcc(t, t.linkParams.stanza);
      caricaParole();
      var cats = (imp.categorie && imp.categorie.length >= 3) ? imp.categorie.slice()
        : (window.SG_NCC_CATEGORIE ? window.SG_NCC_CATEGORIE.normali.slice(0, 5) : []);
      if (imp.modo === "online") return hostNcc(t, cats, imp);
      var st = {
        g: t.giocatori.map(function (n) { return { nome: n, punti: 0 }; }),
        cats: cats, secondi: imp.secondi || 60, giri: imp.round || 2,
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
      ".nc-tab-su .nm{font-size:13px;font-weight:800;color:#cdd6ff;flex:0 0 auto;max-width:28%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".nc-tab-su .parola{flex:1;min-width:0;font-family:" + MANO + ";font-size:22px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
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
      ".nc-mio{border:0;border-radius:99px;padding:8px 14px;font:inherit;font-size:14px;font-weight:900;cursor:pointer}",
      ".nc-mio.si{background:#2ecc71;color:#08210f}",
      ".nc-mio.no{background:#ff5d6c;color:#2a0006}",
      ".nc-attesa{margin:0;text-align:center;font-weight:800;color:#cdd6ff}",
      ".nc-lobby{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,.06);font-weight:700}",
      ".nc-lobby .fac{width:38px;height:38px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
      ".nc-lobby .fac svg{width:100%;height:100%;display:block}",
      ".nc-cats-lobby{justify-content:flex-start;max-width:none}"
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

  // ---- un giro: una lettera per tutti ----
  async function iniziaGiro(t, st) {
    var S = st.S; if (!S.vivo()) return;
    st.lettera = letteraACaso(st.lettera);
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
  function apriFoglio(S, el, g, lettera, cats, ms) {
    return new Promise(function (fine) {
      var foglio = el("div", { class: "nc-foglio" }), campi = [], chiuso = false;
      var barraT = el("i"), tempo = el("div", { class: "nc-tempo" }, [barraT]);
      var carta = el("div", { class: "nc-carta" }, [
        el("div", { class: "nc-testa" }, [ el("div", { class: "nc-chi2" }, [ fac(el, g), el("span", { text: g.nome }) ]), el("div", { class: "nc-lett", text: lettera }) ]),
        tempo
      ]);
      cats.forEach(function (c) {
        var inp = el("input", { type: "text", maxlength: "30", autocomplete: "off", autocapitalize: "words", spellcheck: "false", placeholder: "con la " + lettera + "…" });
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); var k = campi.indexOf(inp); if (campi[k + 1]) campi[k + 1].focus(); else inp.blur(); } });
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
      var toFine = setTimeout(chiudi, ms);
      function chiudi() {
        if (chiuso) return; chiuso = true; clearTimeout(toFine); clearTimeout(toPoco);
        var parole = campi.map(function (inp) { return (inp.value || "").trim(); }); S._chiudiFoglio = null;
        try { if (document.activeElement) document.activeElement.blur(); } catch (e) {}
        ST.viaBarra(S);
        foglio.classList.add("via");
        setTimeout(function () { foglio.classList.remove("on"); setTimeout(function () { if (foglio.parentNode) foglio.parentNode.removeChild(foglio); fine(parole); }, 260); }, 330);
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
      var righe = el("div", { class: "nc-tab-righe" });
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
      st.g.forEach(function (g, a) {
        var testo = st.risposte[a][ci], riga = el("div", { class: "nc-tab-riga" });
        riga.style.animationDelay = (a * 0.12) + "s";
        var esito = el("span", { class: "nc-esito" });
        aggiorna.push(function (conta) {
          if (!testo) { esito.textContent = "0"; esito.className = "nc-esito"; return; }
          var si = st.voti[a][ci].reduce(function (n, v, k) { return n + (k !== a && v ? 1 : 0); }, 0), ok = vale(a);
          var doppia = ok && conta[norm(testo)] >= 2;
          esito.textContent = ok ? (doppia ? "✔ uguale · 5" : "✔ vale · 10") : "✖ " + si + "/" + votanti;
          esito.className = "nc-esito" + (ok ? (doppia ? " doppia" : " si") : "");
        });
        riga.appendChild(el("div", { class: "nc-tab-su" }, [ fac(el, g), el("span", { class: "nm", text: g.nome }),
          el("span", { class: "parola" + (testo ? "" : " vuota"), text: testo || "— vuoto" }), esito ]));
        if (testo && votanti > 0) {
          var voti = el("div", { class: "nc-voti" }), bottoni = [];
          st.g.forEach(function (gg, k) {
            if (k === a) return;   // l'autore non vota sé stesso
            var b = el("button", {});
            function pinta() { var on = st.voti[a][ci][k]; b.className = on ? "on" : ""; b.textContent = (on ? "👍 " : "👎 ") + gg.nome; }
            b.addEventListener("click", function () { st.voti[a][ci][k] = !st.voti[a][ci][k]; pinta(); aggiornaTutte(); try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} });
            pinta(); bottoni.push(pinta); voti.appendChild(b);
          });
          if (votanti > 1) voti.appendChild(el("button", { class: "tutti", text: "👍 tutti", onclick: function () {
            st.g.forEach(function (_, k) { if (k !== a) st.voti[a][ci][k] = true; }); bottoni.forEach(function (p) { p(); }); aggiornaTutte();
          } }));
          riga.appendChild(voti);
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
    var ordine = st.g.slice().sort(function (x, y) { return y.punti - x.punti; });
    var ultimo = (st.giro + 1 >= st.giri);
    if (ultimo) {
      var vinc = st.g.indexOf(ordine[0]);
      await ST.finale(S, vinc, ordine[0].punti + " punti");
      return t.fine(ordine.map(function (gg) { return { nome: gg.nome, punti: gg.punti }; }));
    }
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "nc-clas" }, [ el("h2", { text: "🏁 Classifica dopo il giro " + (st.giro + 1) }) ]);
    ordine.forEach(function (gg, k) {
      var r = el("div", { class: "nc-cl" + (k === 0 ? " primo" : "") }, [
        el("span", { class: "pos", text: ["🥇", "🥈", "🥉"][k] || (k + 1) + "°" }), fac(el, gg), el("span", { class: "nm", text: gg.nome }),
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
    var H = { fase: "lobby", codice: "…", pronta: false, cats: cats, secondi: imp.secondi || 60, giri: imp.round || 2, giro: 0, lettera: null,
      players: [{ id: "host", nome: nomeHost, omino: ST.mioAvatar(nomeHost), punti: 0 }],
      risposte: {}, fatti: {}, voti: {}, ci: 0, pronti: {}, scadenza: 0, ultimo: null, to: null };
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function pres() { return H.players.filter(function (p) { return !p.via; }); }
    function clearTo() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    var cb = { sonoHost: true, myId: "host",
      onComincia: comincia,
      onRisposte: function (r) { risposte("host", r); },
      onVoto: function (a, ci, si) { voto("host", a, ci, si); },
      onPronto: function (ci) { pronto("host", ci); },
      onProssimo: prossimoGiro, onNuova: nuova,
      onFine: function (cl) { clearTo(); rete.chiudi(); t.fine(cl); },
      onEsci: function () { clearTo(); rete.chiudi(); t.esci(); } };
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
          if (H.fase === "lobby" && !pById(id) && H.players.length < 10) H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: ST.avatarValido(m.omino), punti: 0 });
          bd();
        }
        else if (m.t === "risposte") risposte(id, m.r);
        else if (m.t === "voto") voto(id, m.a, m.ci, m.si);
        else if (m.t === "pronto") pronto(id, m.ci);
      },
      onErrore: function () { senzaReteN(t); }
    });
    function vm() {
      var o = { fase: H.fase, codice: H.codice, pronta: H.pronta, giro: H.giro, giri: H.giri, lettera: H.lettera, secondi: H.secondi, cats: H.cats,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino || null, punti: p.punti, via: !!p.via }; }),
        fatti: Object.keys(H.fatti) };
      if (H.fase === "scrittura") o.rimMs = Math.max(0, H.scadenza - Date.now());
      if (H.fase === "tabellone") {
        o.ci = H.ci; o.pronti = Object.keys(H.pronti);
        o.tab = H.players.map(function (p) { return { id: p.id, parola: (H.risposte[p.id] || [])[H.ci] || "", no: Object.keys(((H.voti[p.id] || {})[H.ci]) || {}) }; });
      }
      if (H.fase === "punti" || H.fase === "fine") o.ultimo = H.ultimo;
      return o;
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegnaNccVM(t, v, cb); }
    function comincia() {
      if (H.fase !== "lobby" || H.players.length < 2) return;
      H.fase = "apertura"; bd();   // la sigla dello studio, uguale su tutti i telefoni
      H.to = setTimeout(nuovoGiro, ST.durataApertura(H.players.length));
    }
    function nuovoGiro() {
      clearTo();
      H.lettera = letteraACaso(H.lettera); H.risposte = {}; H.fatti = {}; H.voti = {}; H.ci = 0; H.pronti = {}; H.ultimo = null;
      H.fase = "lettera"; bd();
      H.to = setTimeout(scrittura, DURATA_LETTERA);
    }
    function scrittura() {
      clearTo();
      H.fase = "scrittura"; H.scadenza = Date.now() + H.secondi * 1000 + ANTICIPO_FOGLIO; bd();
      H.to = setTimeout(tabellone, H.secondi * 1000 + ANTICIPO_FOGLIO + GRAZIA);
    }
    function risposte(id, r) {
      var p = pById(id); if (H.fase !== "scrittura" || !p || p.via || H.fatti[id]) return;
      H.risposte[id] = H.cats.map(function (_, ci) { return String((r && r[ci]) || "").trim().slice(0, 30); });
      H.fatti[id] = true; controlla(); bd();
    }
    function tabellone() {
      clearTo();
      votiDiPartenza();
      H.fase = "tabellone"; H.ci = 0; H.pronti = {}; bd();
      H.to = setTimeout(prossimaCat, TEMPO_VOTO);
    }
    // le parole non giuste (lettera sbagliata o sconosciute) partono bocciate da tutti: basta un "Vale" per cambiare
    function votiDiPartenza() {
      H.players.forEach(function (p) {
        H.cats.forEach(function (cat, ci) {
          var w = (H.risposte[p.id] || [])[ci]; if (!w || rispostaGiusta(w, cat, H.lettera) !== false) return;
          var v = H.voti[p.id] || (H.voti[p.id] = {}), c = v[ci] || (v[ci] = {});
          H.players.forEach(function (q) { if (q.id !== p.id) c[q.id] = true; });
        });
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
      H.pronti[id] = true; controlla(); bd();
    }
    function prossimaCat() {
      clearTo();
      if (H.ci + 1 < H.cats.length) { H.ci++; H.pronti = {}; bd(); H.to = setTimeout(prossimaCat, TEMPO_VOTO); return; }
      calcola();
    }
    // chi ha finito di scrivere / di votare: quando ci sono tutti si va avanti senza aspettare il tempo
    function controlla() {
      if (H.fase === "lobby" || H.fase === "fine") return;
      if (pres().length < 2) { clearTo(); H.ultimo = H.ultimo || { tot: {} }; H.fase = "fine"; return; }   // è rimasto uno solo: finisce qui
      if (H.fase === "scrittura" && pres().every(function (p) { return H.fatti[p.id]; })) { clearTo(); H.to = setTimeout(tabellone, 1400); }
      if (H.fase === "tabellone" && pres().every(function (p) { return H.pronti[p.id]; })) { clearTo(); H.to = setTimeout(prossimaCat, 700); }
    }
    // i punti del giro: vale se più della metà degli altri non l'ha bocciata; uguale a un'altra valida = 5
    function calcola() {
      clearTo();
      var presenti = pres(), idsP = presenti.map(function (p) { return p.id; }), votanti = presenti.length - 1, tot = {};
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
        presenti.forEach(function (p) { if (valida[p.id]) tot[p.id] += conta[norm((H.risposte[p.id] || [])[ci])] >= 2 ? PUNTI_DOPPIA : PUNTI_OK; });
      });
      presenti.forEach(function (p) { p.punti += tot[p.id]; });
      H.ultimo = { tot: tot };
      H.fase = (H.giro + 1 >= H.giri) ? "fine" : "punti"; bd();
    }
    function prossimoGiro() { if (H.fase === "punti") { H.giro++; nuovoGiro(); } }
    function nuova() {   // stessa gente, si ricomincia (senza sigla)
      if (H.fase !== "fine") return;
      H.players = pres(); H.players.forEach(function (p) { p.punti = 0; });
      if (H.players.length < 2) return;
      H.giro = 0; H.lettera = null; nuovoGiro();
    }
    disegnaNccVM(t, vm(), cb);
  }

  function ospiteNcc(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteN(t);
    var el = t.el, G = { myId: null, vm: null, rete: null, nome: "", msg: null };
    var cb = { sonoHost: false, myId: null,
      onRisposte: function (r) { G.rete && G.rete.invia({ t: "risposte", r: r }); },
      onVoto: function (a, ci, si) { G.rete && G.rete.invia({ t: "voto", a: a, ci: ci, si: si }); },
      onPronto: function (ci) { G.rete && G.rete.invia({ t: "pronto", ci: ci }); },
      onEsci: function () { if (G.rete) G.rete.chiudi(); t.esci(); } };
    function disegna() { if (G.vm) { cb.myId = G.myId; disegnaNccVM(t, G.vm, cb); } }
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
        onAperto: function (id) { G.myId = id; G.rete.invia({ t: "join", nome: G.nome, omino: ST.mioAvatar(G.nome) });
          setTimeout(function () { if (!G.vm && G.msg) G.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) { if (m && m.t === "vm") { G.vm = m.vm; disegna(); } },
        onChiuso: function () { if (G.vm && G.vm.fase === "fine") return; erroreN(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { erroreN(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
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
  // un passo della regia: true se ha fatto un momento dello spettacolo (poi si guarda lo stato più recente)
  async function regiaPassoN(R) {
    var vm = R.vm, S = R.S;
    if (!S.vivo()) return false;
    vm.players.forEach(function (p, i) { if (p.via && !R.usciti[p.id]) { R.usciti[p.id] = true; ST.fuori(S, i, true); ST.testoLeggio(S, i, "👋 uscito", true); } });
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
      if (R.kScrivi !== kG) { R.kScrivi = kG; R.kLettera = kG; await scriviOnline(R); return true; }
      aggiornaFatti(R, vm); return false;
    }
    if (vm.fase === "tabellone") {
      var kT = kG + "|" + vm.ci;
      if (R.kTab !== kT) { R.kTab = kT; R.kScrivi = kG; await tabelloneOnline(R, vm); return true; }
      aggiornaTab(R, vm); return false;
    }
    if (vm.fase === "punti" || vm.fase === "fine") {
      if (R.kPunti !== kG) { R.kPunti = kG; await puntiOnline(R, vm); return true; }
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
    ST.accendiSolo(S, io); ST.testoLeggio(S, io, "✍️ scrive");
    ST.terzo(S, io, "Si scrive tutti insieme!", "Parole con la " + vm.lettera, "✍️");
    await ST.suLeggio(S, io, 700);
    ST.viaTerzo(S); ST.lampo(S);
    var rim = Math.max(3000, (R.vm.rimMs || 0) - (Date.now() - R.vmTs));   // il tempo che resta secondo l'host
    var parole = await apriFoglio(S, el, me, vm.lettera, vm.cats, rim);
    if (!S.vivo()) return;
    cb.onRisposte(parole);
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
    var S = R.S, el = R.t.el, fatti = vm.fatti || [], k = fatti.join("|");
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
  async function tabelloneOnline(R, vm) {
    var S = R.S, el = R.t.el, cb = R.cb, ci = vm.ci, c = vm.cats[ci] || { emoji: "", testo: "" };
    ST.viaBarra(S); R.righeTab = null; R.kBarra = null;
    if (ci === 0) {   // prima categoria: si va al tabellone
      ST.accendiSolo(S, -1); await ST.largo(S, 800);
      ST.terzo(S, null, "Tutti hanno scritto!", "Andiamo al tabellone 📋", "📋"); ST.pubblico(S, "applauso");
      await ST.dorme(1500); ST.viaTerzo(S);
      if (!S.vivo()) return;
    }
    if (!S.shot || S.shot() !== S.R.schermo) await ST.suSchermo(S, 800);
    vm = R.vm; if (vm.fase !== "tabellone" || vm.ci !== ci) return;   // intanto si è andati avanti
    ST.fermaTimer(S); ST.vuota(S.sch);
    var righe = el("div", { class: "nc-tab-righe" });
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
      riga.appendChild(el("div", { class: "nc-tab-su" }, [ fac(el, p), el("span", { class: "nm", text: p.id === cb.myId ? "Tu" : p.nome }),
        el("span", { class: "parola" + (w.parola ? "" : " vuota"), text: w.parola || "— vuoto" }), esito ]));
      if (w.parola && p.id !== cb.myId && io >= 0 && !vm.players[io].via) {
        var b = el("button", { class: "nc-mio" });
        R.mieiNo[p.id] = (w.no || []).indexOf(cb.myId) >= 0;
        var pinta = function () { var no = R.mieiNo[p.id]; b.className = "nc-mio" + (no ? " no" : " si"); b.textContent = no ? "👎 Non vale" : "👍 Vale"; };
        b.addEventListener("click", function () { R.mieiNo[p.id] = !R.mieiNo[p.id]; pinta(); cb.onVoto(p.id, ci, !R.mieiNo[p.id]); aggiornaTab(R, R.vm); try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} });
        pinta(); riga.appendChild(el("div", { class: "nc-voti" }, [b]));
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
      if (!w.parola) { e.textContent = "0"; e.className = "nc-esito"; return; }
      var s2 = stato[p.id], doppia = s2.ok && conta[norm(w.parola)] >= 2;
      e.textContent = s2.ok ? (doppia ? "✔ uguale · 5" : "✔ vale · 10") : "✖ " + s2.si + "/" + votanti;
      e.className = "nc-esito" + (s2.ok ? (doppia ? " doppia" : " si") : "");
    });
    var pronti = vm.pronti || [], io = idxN(vm, cb.myId), gioco = io >= 0 && !vm.players[io].via;
    var sonoPronto = pronti.indexOf(cb.myId) >= 0 || R.prontoCi === vm.giro + "|" + vm.ci;
    var mancano = presenti.filter(function (p) { return pronti.indexOf(p.id) < 0 && !(p.id === cb.myId && sonoPronto); }).map(function (p) { return p.id === cb.myId ? "te" : p.nome; });
    var k = vm.ci + "|" + (sonoPronto ? 1 : 0) + "|" + mancano.join(",");
    if (R.kBarra === k) return;
    R.kBarra = k;
    var ultima = vm.ci === vm.cats.length - 1;
    if (gioco && !sonoPronto) ST.barra(S, [ el("button", { class: "btn btn-primario", text: ultima ? "✅ Ho votato: i punti!" : "✅ Ho votato, avanti ▶",
      onclick: function () { R.prontoCi = vm.giro + "|" + vm.ci; cb.onPronto(vm.ci); aggiornaTab(R, R.vm); } }) ]);
    else ST.barra(S, [ el("p", { class: "nc-attesa", text: mancano.length ? "Aspettiamo: " + mancano.join(", ") : "Si va avanti…" }) ]);
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
  function ordineN(vm) { return vm.players.filter(function (p) { return !p.via; }).sort(function (x, y) { return y.punti - x.punti; }); }
  async function classificaOnline(R, vm) {
    var S = R.S, el = R.t.el, cb = R.cb, tot = (vm.ultimo && vm.ultimo.tot) || {};
    await ST.suSchermo(S, 800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var box = el("div", { class: "nc-clas" }, [ el("h2", { text: "🏁 Classifica dopo il giro " + (vm.giro + 1) }) ]);
    ordineN(vm).forEach(function (p, k) {
      var r = el("div", { class: "nc-cl" + (k === 0 ? " primo" : "") }, [
        el("span", { class: "pos", text: ["🥇", "🥈", "🥉"][k] || (k + 1) + "°" }), fac(el, p), el("span", { class: "nm", text: p.nome + (p.id === cb.myId ? " (tu)" : "") }),
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
    var S = R.S, ordine = ordineN(vm), vinc = ordine[0] ? idxN(vm, ordine[0].id) : -1;
    await ST.finale(S, vinc, (ordine[0] ? ordine[0].punti : 0) + " punti");
    fineN(R.t, vm, R.cb, ordine);
  }
  function fineN(t, vm, cb, ordine) {
    var el = t.el, s = t.schermata({ icona: "🏆", titolo: ordine[0] ? "Vince " + ordine[0].nome + "!" : "Fine partita", sotto: "Nomi, Cose e Città" });
    var box = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    ordine.forEach(function (p, k) {
      box.appendChild(el("div", { class: "nc-cl" + (k === 0 ? " primo" : "") }, [
        el("span", { class: "pos", text: ["🥇", "🥈", "🥉"][k] || (k + 1) + "°" }), fac(el, p), el("span", { class: "nm", text: p.nome + (p.id === cb.myId ? " (tu)" : "") }),
        el("span", { class: "pt", text: p.punti + " punti" })
      ]));
    });
    s._contenuto.appendChild(box);
    if (cb.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏁 Fine", onclick: function () { cb.onFine(ordine.map(function (p) { return { nome: p.nome, punti: p.punti }; })); } }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "Se l'host fa un'altra partita, riparti da solo." }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
  }
  // la lobby: chi c'è (con l'avatar), le categorie scelte; l'host fa partire
  // la saletta d'attesa (uguale per tutti i giochi): sotto, le categorie e il tempo scelti dall'host
  function lobbyN(t, vm, cb) {
    var el = t.el, cc = el("div", { class: "nc-cats nc-cats-lobby" });
    (vm.cats || []).forEach(function (c) { cc.appendChild(el("span", { text: c.emoji + " " + c.testo })); });
    var info = el("div", {}, [ el("div", { class: "etichetta", text: "Categorie · " + vm.secondi + " secondi · " + (vm.giri === 1 ? "1 giro" : vm.giri + " giri") }), cc ]);
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, testoComincia: "Via ▶",
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [info], attesa: "Aspetta che l'host dia il via: poi scrivete tutti insieme!",
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
})();
