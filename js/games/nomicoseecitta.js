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
      iniziaGiro(t, st);
    }
  });

  // ---- un giro: una lettera per tutti ----
  function iniziaGiro(t, st) {
    st.lettera = letteraACaso(st.lettera);
    st.risposte = st.g.map(function () { return st.cats.map(function () { return ""; }); });
    st.voti = st.g.map(function () { return st.cats.map(function () { return st.g.map(function () { return false; }); }); });
    scrittura(t, st, 0);
  }

  function scrittura(t, st, i) {
    if (i >= st.g.length) return votazione(t, st, 0);
    t.passaA(st.g[i].nome, function () { schermataScrittura(t, st, i); });
  }

  function schermataScrittura(t, st, i) {
    var el = t.el;
    var lettera = st.lettera;
    var s = t.schermata({ icona: "✍️", titolo: st.g[i].nome, sotto: "Giro " + (st.giro + 1) + " di " + st.giri });

    var wrap = el("div", { class: "as-timer" });
    var fill = el("div", { class: "as-timer-fill" });
    wrap.appendChild(fill); s._contenuto.appendChild(wrap);

    s._contenuto.appendChild(el("div", { style: "text-align:center;margin:6px 0 12px" }, [
      el("div", { class: "tenue", text: "La lettera è" }),
      el("div", { style: "font-size:4.2rem;font-weight:800;line-height:1", text: lettera })
    ]));

    var campi = [];
    st.cats.forEach(function (c, ci) {
      var inp = el("input", { class: "link-campo", type: "text", maxlength: "30", autocomplete: "off",
        autocapitalize: "words", placeholder: "con la " + lettera + "…" });
      campi.push(inp);
      s._contenuto.appendChild(el("div", { class: "ncc-riga", style: "margin-bottom:10px" }, [
        el("div", { class: "etichetta", style: "margin:0 0 4px", text: c.emoji + " " + c.testo }),
        inp
      ]));
    });

    var chiuso = false, restano = st.secondi;
    var timer = setInterval(function () {
      restano -= 0.1;
      fill.style.width = Math.max(0, restano / st.secondi) * 100 + "%";
      if (restano <= 0) fineTurno();
    }, 100);

    function fineTurno() {
      if (chiuso) return; chiuso = true; clearInterval(timer);
      campi.forEach(function (inp, ci) { st.risposte[i][ci] = (inp.value || "").trim(); });
      scrittura(t, st, i + 1);
    }

    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ho finito ▶", onclick: fineTurno }));
    t.mostra(s);
    if (campi.length) setTimeout(function () { try { campi[0].focus(); } catch (e) {} }, 50);
  }

  // ---- votazione: per ogni autore, il gruppo vota le sue parole ----
  function votazione(t, st, a) {
    // salta gli autori che non hanno scritto nulla
    while (a < st.g.length && st.risposte[a].every(function (r) { return !r; })) a++;
    if (a >= st.g.length) return calcolaPunti(t, st);
    schermataVoto(t, st, a);
  }

  function schermataVoto(t, st, a) {
    var el = t.el;
    var votanti = st.g.filter(function (_, k) { return k !== a; });
    var s = t.schermata({ icona: "🗳️", titolo: "Votate le parole di " + st.g[a].nome, sotto: "Lettera " + st.lettera + " · più della metà = vale" });

    st.cats.forEach(function (c, ci) {
      var testo = st.risposte[a][ci];
      var riga = el("div", { style: "padding:8px 10px;border-radius:12px;margin-bottom:8px;background:rgba(255,255,255,.05)" });
      riga.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px;align-items:baseline" }, [
        el("span", { class: "tenue", text: c.emoji + " " + c.testo }),
        el("span", { style: "font-weight:700;font-size:1.1rem", text: testo || "— (vuoto)" })
      ]));
      if (testo) {
        var bottoni = el("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin-top:8px" });
        st.g.forEach(function (gg, k) {
          if (k === a) return; // l'autore non vota sé stesso
          function pinta(b) {
            var on = st.voti[a][ci][k];
            b.style.cssText = "padding:6px 10px;border-radius:999px;border:0;font-weight:700;cursor:pointer;"
              + (on ? "background:#2ecc71;color:#08210f" : "background:rgba(255,255,255,.12);color:#fff;opacity:.8");
            b.textContent = (on ? "👍 " : "👎 ") + gg.nome;
          }
          var b = el("button", {});
          b.addEventListener("click", function () { st.voti[a][ci][k] = !st.voti[a][ci][k]; pinta(b); });
          pinta(b);
          bottoni.appendChild(b);
        });
        riga.appendChild(bottoni);
      }
      s._contenuto.appendChild(riga);
    });

    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Conferma i voti ▶",
      onclick: function () { votazione(t, st, a + 1); } }));
    t.mostra(s);
  }

  // ---- calcolo punti del giro, poi recap ----
  function calcolaPunti(t, st) {
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
    recapGiro(t, st);
  }

  function recapGiro(t, st) {
    var el = t.el;
    var s = t.schermata({ icona: "🏁", titolo: "Fine giro " + (st.giro + 1), sotto: "Lettera " + st.lettera });
    var ordine = st.g.slice().sort(function (x, y) { return y.punti - x.punti; });
    var ol = el("ol", { class: "classifica" });
    var medaglie = ["🥇", "🥈", "🥉"];
    ordine.forEach(function (gg, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: gg.nome }),
        el("span", { class: "punti", text: gg.punti + "  (+" + (gg._ultimo ? gg._ultimo.tot : 0) + ")" })
      ]));
    });
    s._contenuto.appendChild(ol);

    var ultimo = (st.giro + 1 >= st.giri);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: ultimo ? "Vedi la classifica 🏆" : "Prossimo giro ▶",
      onclick: function () {
        if (ultimo) return t.fine(ordine.map(function (gg) { return { nome: gg.nome, punti: gg.punti }; }));
        st.giro += 1; iniziaGiro(t, st);
      } }));
    t.mostra(s);
  }
})();
