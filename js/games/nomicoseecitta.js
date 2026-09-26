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

  SG.registra({
    id: "nomicose",
    nome: "Nomi, Cose e Città",
    icona: "✍️",
    descrizione: "Esce una lettera, riempi le categorie con parole che iniziano così, poi votate insieme quali valgono.",
    giocatoriMin: 2,
    giocatoriMax: 10,
    difficolta: 2,   // Media — quanto vale vincerlo nel torneo
    regole: [
      "Ogni giro esce una <b>lettera</b> uguale per tutti: a turno ciascuno riempie le categorie con parole che iniziano con quella lettera.",
      "Poi si <b>vota</b>: per ogni parola gli altri dicono se vale. Ognuno ha il suo tasto e può cambiare idea cliccando di nuovo.",
      "Se <b>più della metà</b> approva la parola vale <b>10 punti</b>; se due hanno scritto la <b>stessa</b> parola valgono <b>5</b> a testa; se è bocciata o vuota, <b>0</b>.",
      "Si gioca un certo numero di giri: alla fine vince chi ha totalizzato più punti."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      var dati = window.SG_NCC_CATEGORIE || { normali: [], black: [] };
      var scelte = dati.normali.slice(0, 5);
      dove.categorie = scelte;
      dove.secondi = 60;
      dove.round = 2;

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
      var cats = (imp.categorie && imp.categorie.length >= 3) ? imp.categorie.slice()
        : (window.SG_NCC_CATEGORIE ? window.SG_NCC_CATEGORIE.normali.slice(0, 5) : []);
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
      ".nc-slot.gira{animation:ncGira .08s linear infinite}",
      ".nc-slot.fermo{animation:ncPop .55s cubic-bezier(.3,1.6,.5,1)}",
      "@keyframes ncGira{0%{transform:translateY(-4px)}50%{transform:translateY(4px)}100%{transform:translateY(-4px)}}",
      "@keyframes ncPop{from{transform:scale(.6)}to{transform:none}}",
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
      ".nc-cl .pi{font-size:12px;font-weight:800;color:#6ff0a6;margin-left:4px}"
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
    var slot = el("div", { class: "nc-slot gira", text: "A" }), sotto = el("div", { class: "nc-sotto", text: "La lettera è…" });
    S.sch.appendChild(el("div", { class: "nc-estr" }, [ el("div", { class: "nc-giro", text: "Giro " + (st.giro + 1) + " di " + st.giri }), slot, sotto ]));
    ST.FX.rullo(1.5);
    var passo = 60, fine = Date.now() + 1500;
    await new Promise(function (ok) {
      (function giro() {
        slot.textContent = LETTERE[Math.floor(Math.random() * LETTERE.length)]; tick(700 + Math.random() * 300);
        if (Date.now() >= fine) return ok();
        passo = Math.min(220, passo * 1.12); setTimeout(giro, passo);
      })();
    });
    slot.textContent = st.lettera; slot.className = "nc-slot fermo"; sotto.textContent = "Tutte le parole con la " + st.lettera + "!";
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
  function foglietto(st, i, scritto) {
    var X = st.S.L[i]; if (!X) return;
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
    await apriFoglio(st, i);   // la telecamera "entra" nel foglio: si scrive
    if (!S.vivo()) return;
    st.fatti[i] = true; foglietto(st, i, true);
    ST.testoLeggio(S, i, "✅ fatto"); ST.faccia(S, i, "esulta");
    schermoScrittura(st, i);
    await ST.dorme(700);
    ST.faccia(S, i, null);
  }
  // il foglio a righe: la lettera cerchiata, una riga per categoria, il tempo è una matita che si accorcia
  function apriFoglio(st, i) {
    var S = st.S, el = st.t.el, g = st.g[i];
    return new Promise(function (fine) {
      var foglio = el("div", { class: "nc-foglio" }), campi = [], chiuso = false;
      var barraT = el("i"), tempo = el("div", { class: "nc-tempo" }, [barraT]);
      var carta = el("div", { class: "nc-carta" }, [
        el("div", { class: "nc-testa" }, [ el("div", { class: "nc-chi2" }, [ fac(el, g), el("span", { text: g.nome }) ]), el("div", { class: "nc-lett", text: st.lettera }) ]),
        tempo
      ]);
      st.cats.forEach(function (c) {
        var inp = el("input", { type: "text", maxlength: "30", autocomplete: "off", autocapitalize: "words", spellcheck: "false", placeholder: "con la " + st.lettera + "…" });
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); var k = campi.indexOf(inp); if (campi[k + 1]) campi[k + 1].focus(); else inp.blur(); } });
        campi.push(inp);
        carta.appendChild(el("label", { class: "nc-riga" }, [ el("span", { class: "c", text: c.emoji + " " + c.testo }), inp ]));
      });
      foglio.appendChild(carta);
      S.vista.appendChild(foglio);
      S.rec.classList.remove("on");   // sul foglio niente scritta "IN ONDA" sopra la lettera
      requestAnimationFrame(function () { foglio.classList.add("on"); });
      // il tempo: la barra si accorcia (solo transform), gli ultimi 10 secondi diventa rossa
      var ms = st.secondi * 1000;
      requestAnimationFrame(function () { requestAnimationFrame(function () { barraT.style.transition = "transform " + ms + "ms linear"; barraT.style.transform = "scaleX(0)"; }); });
      var toPoco = setTimeout(function () { tempo.classList.add("poco"); }, Math.max(0, ms - 10000));
      var toFine = setTimeout(chiudi, ms);
      function chiudi() {
        if (chiuso) return; chiuso = true; clearTimeout(toFine); clearTimeout(toPoco);
        campi.forEach(function (inp, ci) { st.risposte[i][ci] = (inp.value || "").trim(); });
        try { if (document.activeElement) document.activeElement.blur(); } catch (e) {}
        ST.viaBarra(S);
        foglio.classList.add("via");
        setTimeout(function () { foglio.classList.remove("on"); setTimeout(function () { if (foglio.parentNode) foglio.parentNode.removeChild(foglio); fine(); }, 260); }, 330);
      }
      ST.barra(S, [ el("button", { class: "btn btn-primario", text: "Ho finito ▶", onclick: chiudi }) ]);
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
})();
