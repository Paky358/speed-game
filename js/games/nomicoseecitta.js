/* =========================================================
   GIOCO — "Nomi, Cose e Città"
   Un telefono solo, a turni. Esce una lettera: hai pochi
   secondi per riempire tutte le categorie con parole che
   iniziano con quella lettera. Ogni casella riempita vale
   punti; alla fine c'è la classifica.
   Le categorie stanno in data/ncc-categorie.js; qui il gioco
   aggiunge quelle che scrivono i giocatori (salvate su questo
   telefono).
   ========================================================= */
(function () {
  "use strict";

  var LETTERE = "ABCDEFGILMNOPRSTV".split(""); // lettere comode in italiano
  var K_PERSO = "sg_ncc_perso";                 // categorie personali salvate qui
  var PER_CASELLA = 10;                          // punti per ogni casella valida
  var BONUS_PIENO = 5;                           // bonus se le riempi tutte

  function catPerso() {
    try { return JSON.parse(localStorage.getItem(K_PERSO)) || []; } catch (e) { return []; }
  }
  function salvaPerso(a) {
    try { localStorage.setItem(K_PERSO, JSON.stringify(a)); } catch (e) {}
  }

  function letteraACaso(escludi) {
    var l;
    do { l = LETTERE[Math.floor(Math.random() * LETTERE.length)]; } while (l === escludi && LETTERE.length > 1);
    return l;
  }

  function valida(risposta, lettera) {
    var r = (risposta || "").trim().toLowerCase();
    if (!r) return false;
    return r.charAt(0) === lettera.toLowerCase();
  }

  SG.registra({
    id: "nomicose",
    nome: "Nomi, Cose e Città",
    icona: "✍️",
    descrizione: "Esce una lettera: riempi tutte le categorie con parole che iniziano così, prima che scada il tempo.",
    giocatoriMin: 1,
    giocatoriMax: 10,
    difficolta: 2,   // Media — quanto vale vincerlo nel torneo
    regole: [
      "A turno, ognuno prende il telefono: esce una <b>lettera</b> e parte il tempo.",
      "Scrivi in ogni categoria una parola che <b>inizia con quella lettera</b> (Nome, Città, Animale, Colore…).",
      "Ogni casella riempita bene vale <b>10 punti</b>; se le riempi <b>tutte</b> c'è un bonus.",
      "Si gioca un certo numero di giri a testa: alla fine vince chi ha totalizzato più punti."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      var dati = window.SG_NCC_CATEGORIE || { normali: [], black: [] };
      // selezione: default le prime 5 categorie normali
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

      // --- categorie normali ---
      box.appendChild(el("div", { class: "etichetta", text: "Categorie" }));
      var gN = el("div", { class: "cat-griglia" });
      dati.normali.forEach(function (c) { gN.appendChild(chipDi(c)); });
      box.appendChild(gN);

      // --- black humor ---
      if (dati.black && dati.black.length) {
        box.appendChild(el("div", { class: "etichetta", text: "😈 Black humor" }));
        var gB = el("div", { class: "cat-griglia" });
        dati.black.forEach(function (c) { gB.appendChild(chipDi(c)); });
        box.appendChild(gB);
      }

      // --- personalizzate (le scrive chi gioca, restano su questo telefono) ---
      box.appendChild(el("div", { class: "etichetta", text: "✏️ Le tue categorie" }));
      var gP = el("div", { class: "cat-griglia" });
      box.appendChild(gP);
      function disegnaPerso() {
        aiuti.el; // noop
        while (gP.firstChild) gP.removeChild(gP.firstChild);
        catPerso().forEach(function (c) {
          if (dove.categorie.indexOf(c) < 0 && isScelta(c) === false && scelte.indexOf(c) < 0) {}
          var riga = el("div", { style: "display:flex;gap:6px;align-items:stretch" });
          riga.appendChild(chipDi(c));
          riga.appendChild(el("button", { class: "togli", text: "×", "aria-label": "Elimina", onclick: function () {
            var lista = catPerso().filter(function (x) { return !(x.testo === c.testo); });
            salvaPerso(lista);
            var i = scelte.indexOf(c); if (i >= 0) scelte.splice(i, 1);
            disegnaPerso(); aggiornaConta();
          } }));
          gP.appendChild(riga);
        });
      }
      // le personalizzate salvate diventano subito disponibili e scelte
      catPerso().forEach(function (c) { if (scelte.indexOf(c) < 0) scelte.push(c); });
      disegnaPerso();

      var campo = el("input", { class: "link-campo", type: "text", maxlength: "28", placeholder: "Es. Un supereroe, Una scusa…" });
      var aggiungi = el("button", { class: "btn btn-fantasma", text: "＋ Aggiungi la categoria", onclick: function () {
        var testo = (campo.value || "").trim();
        if (testo.length < 2) return;
        var nuova = { emoji: "✏️", testo: testo };
        var lista = catPerso(); lista.push(nuova); salvaPerso(lista);
        scelte.push(nuova);
        campo.value = "";
        disegnaPerso(); aggiornaConta();
      } });
      box.appendChild(campo);
      box.appendChild(aggiungi);

      // --- tempo per turno ---
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

      // --- giri a testa ---
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
      var el = t.el;
      var imp = t.impostazioni || {};
      var cats = (imp.categorie && imp.categorie.length >= 3) ? imp.categorie.slice()
        : (window.SG_NCC_CATEGORIE ? window.SG_NCC_CATEGORIE.normali.slice(0, 5) : []);
      var secondi = imp.secondi || 60;
      var giri = imp.round || 2;

      var st = {
        g: t.giocatori.map(function (n) { return { nome: n, punti: 0 }; }),
        cats: cats, secondi: secondi, totale: giri * t.giocatori.length,
        turno: 0, ultimaLettera: null
      };
      prossimo(t, st);
    }
  });

  function prossimo(t, st) {
    if (st.turno >= st.totale) return finePartita(t, st);
    var gioc = st.g[st.turno % st.g.length];
    t.passaA(gioc.nome, function () { turno(t, st, gioc); });
  }

  function turno(t, st, gioc) {
    var el = t.el;
    var lettera = letteraACaso(st.ultimaLettera);
    st.ultimaLettera = lettera;
    var giro = Math.floor(st.turno / st.g.length) + 1;
    var giriTot = st.totale / st.g.length;

    var s = t.schermata({ icona: "✍️", titolo: gioc.nome, sotto: "Giro " + giro + " di " + giriTot });

    // barra del tempo
    var wrap = el("div", { class: "as-timer" });
    var fill = el("div", { class: "as-timer-fill" });
    wrap.appendChild(fill);
    s._contenuto.appendChild(wrap);

    // lettera grande
    s._contenuto.appendChild(el("div", { style: "text-align:center;margin:6px 0 12px" }, [
      el("div", { class: "tenue", text: "La lettera è" }),
      el("div", { style: "font-size:4.2rem;font-weight:800;line-height:1", text: lettera })
    ]));

    // una casella per categoria
    var campi = [];
    st.cats.forEach(function (c) {
      var inp = el("input", { class: "link-campo", type: "text", maxlength: "30", autocomplete: "off",
        autocapitalize: "words", placeholder: "con la " + lettera + "…" });
      campi.push({ cat: c, inp: inp });
      s._contenuto.appendChild(el("div", { class: "ncc-riga", style: "margin-bottom:10px" }, [
        el("div", { class: "etichetta", style: "margin:0 0 4px", text: c.emoji + " " + c.testo }),
        inp
      ]));
    });

    var chiuso = false;
    var restano = st.secondi;
    var timer = setInterval(function () {
      restano -= 0.1;
      var perc = Math.max(0, restano / st.secondi) * 100;
      fill.style.width = perc + "%";
      if (restano <= 0) fineTurno();
    }, 100);

    function fineTurno() {
      if (chiuso) return;
      chiuso = true;
      clearInterval(timer);
      var risposte = campi.map(function (x) {
        var testo = (x.inp.value || "").trim();
        return { cat: x.cat, testo: testo, ok: valida(testo, lettera) };
      });
      var valide = risposte.filter(function (r) { return r.ok; }).length;
      var punti = valide * PER_CASELLA + (valide === st.cats.length ? BONUS_PIENO : 0);
      gioc.punti += punti;
      recap(t, st, gioc, lettera, risposte, punti);
    }

    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ho finito ▶", onclick: fineTurno }));
    t.mostra(s);
    if (campi.length) setTimeout(function () { try { campi[0].inp.focus(); } catch (e) {} }, 50);
  }

  function recap(t, st, gioc, lettera, risposte, punti) {
    var el = t.el;
    var s = t.schermata({ icona: "✍️", titolo: gioc.nome + ": +" + punti, sotto: "Lettera " + lettera });
    var lista = el("div");
    risposte.forEach(function (r) {
      lista.appendChild(el("div", { class: "ncc-esito", style: "display:flex;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:rgba(255,255,255,.05)" }, [
        el("span", { text: r.cat.emoji + " " + (r.testo || "—") }),
        el("span", { style: "font-weight:700", text: r.ok ? "✅ +" + 10 : "❌ 0" })
      ]));
    });
    s._contenuto.appendChild(lista);
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Totale di " + gioc.nome + ": " + gioc.punti + " punti" }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: (st.turno + 1 >= st.totale) ? "Vedi la classifica 🏆" : "Avanti ▶",
      onclick: function () { st.turno += 1; prossimo(t, st); } }));
    t.mostra(s);
  }

  function finePartita(t, st) {
    var classifica = st.g.slice().sort(function (a, b) { return b.punti - a.punti; })
      .map(function (x) { return { nome: x.nome, punti: x.punti }; });
    t.fine(classifica);
  }
})();
