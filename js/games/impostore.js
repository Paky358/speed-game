/* =========================================================
   GIOCO — "L'Impostore"
   Un telefono solo. Tutti ricevono la STESSA parola, tranne
   uno: l'impostore. Se l'host tiene acceso l'aiutino,
   l'impostore riceve una parola SIMILE ma diversa (dalla
   coppia in data/impostore-parole.js), per riuscire a
   bleffare; altrimenti è al buio.
   Il telefono si passa di mano: ognuno guarda il suo ruolo in
   segreto. Poi l'app dice chi inizia (a caso). Si parla a voce,
   a turno un indizio; infine si vota chi è l'impostore.
   ========================================================= */
(function () {
  "use strict";

  function scegli(a) { return a[Math.floor(Math.random() * a.length)]; }

  SG.registra({
    id: "impostore",
    nome: "L'Impostore",
    icona: "🕵️",
    descrizione: "Tutti hanno la stessa parola, tranne l'impostore. Scoprite chi bluffa prima che la faccia franca.",
    giocatoriMin: 3,
    giocatoriMax: 10,
    difficolta: 2,
    regole: [
      "Il telefono si passa di mano: ognuno guarda in segreto la <b>parola</b>. Uno di voi è l'<b>impostore</b>.",
      "Con l'aiutino acceso l'impostore riceve una parola <b>simile ma diversa</b>, per provare a mimetizzarsi; da spento è al buio.",
      "L'app dice <b>chi inizia</b>: a turno ognuno dice a voce una parola legata alla propria, senza essere troppo esplicito.",
      "Alla fine si <b>vota</b> chi è l'impostore. Se lo scoprite, punti a chi l'ha beccato; se la fa franca, punti all'impostore."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.suggerimento = true;
      box.appendChild(el("div", { class: "etichetta", text: "Aiutino all'impostore" }));
      var bSi, bNo;
      function scegliAiuto(v) {
        dove.suggerimento = v;
        bSi.className = "modo-chip" + (v ? " attiva" : "");
        bNo.className = "modo-chip" + (v ? "" : " attiva");
      }
      bSi = el("button", { class: "modo-chip attiva", onclick: function () { scegliAiuto(true); } }, [
        el("span", { class: "mi", text: "💡" }), el("div", {}, [
          el("div", { class: "mt", text: "Con parola simile" }), el("div", { class: "ms", text: "Vicina, ma diversa" })])]);
      bNo = el("button", { class: "modo-chip", onclick: function () { scegliAiuto(false); } }, [
        el("span", { class: "mi", text: "🙈" }), el("div", {}, [
          el("div", { class: "mt", text: "Al buio" }), el("div", { class: "ms", text: "Nessuna parola" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bSi, bNo]));
      box.appendChild(el("p", { class: "modulo-nota",
        text: "Chi inizia viene scelto a caso. L'impostore è sempre uno, sorteggiato tra tutti." }));
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      var pool = window.SG_IMPOSTORE || [];
      if (!pool.length) return niente(t);
      var n = t.giocatori.length;
      var impostore = Math.floor(Math.random() * n);
      // chi inizia è a caso, ma l'impostore quasi mai apre (posizione più difficile):
      // se il sorteggio lo pesca, nel 90% dei casi passo la mano a un altro.
      // Resta una piccola probabilità che tocchi a lui, così non è del tutto escluso.
      var iniziante = Math.floor(Math.random() * n);
      if (iniziante === impostore && n > 1 && Math.random() < 0.9) {
        do { iniziante = Math.floor(Math.random() * n); } while (iniziante === impostore);
      }
      var st = {
        g: t.giocatori.map(function (nm) { return { nome: nm, punti: 0, voto: null }; }),
        carta: scegli(pool),
        impostore: impostore,
        suggerimento: imp.suggerimento !== false,
        iniziante: iniziante
      };
      rivela(t, st, 0);
    }
  });

  function niente(t) {
    var s = t.schermata({ icona: "🕵️", titolo: "L'Impostore", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "Mancano le parole del gioco." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---- rivelazione segreta, uno alla volta ----
  function rivela(t, st, i) {
    if (i >= st.g.length) return siComincia(t, st);
    t.passaA(st.g[i].nome, function () { schermataRuolo(t, st, i); });
  }

  function schermataRuolo(t, st, i) {
    var el = t.el;
    var s = t.schermata({ icona: "🕵️", titolo: st.g[i].nome, sotto: "Solo tu puoi guardare" });
    var box = el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:12px" });
    s._contenuto.appendChild(box);

    var svelato = false;
    var tocca = el("button", { class: "btn btn-primario", style: "font-size:1.2rem;padding:22px",
      text: "👁️ Tocca per vedere il tuo ruolo" });
    var piede = el("button", { class: "btn btn-primario", text: "Ho capito, nascondi ▶", hidden: "hidden",
      onclick: function () { rivela(t, st, i + 1); } });

    tocca.addEventListener("click", function () {
      if (svelato) return; svelato = true;
      t.svuota(box);
      if (i === st.impostore) {
        box.appendChild(el("div", { style: "font-size:3.2rem", text: "🕵️" }));
        box.appendChild(el("div", { style: "font-size:1.5rem;font-weight:800;color:#ff6b6b", text: "Sei l'IMPOSTORE" }));
        if (st.suggerimento) {
          box.appendChild(el("p", { class: "tenue", text: "La tua parola (occhio: è simile ma diversa)" }));
          box.appendChild(el("div", { style: "font-size:2rem;font-weight:800", text: st.carta.impostore }));
        } else {
          box.appendChild(el("p", { class: "tenue", text: "Non hai una parola. Ascolta gli altri e bleffa!" }));
        }
      } else {
        box.appendChild(el("p", { class: "tenue", text: "La parola è" }));
        box.appendChild(el("div", { style: "font-size:2.4rem;font-weight:800", text: st.carta.reale }));
      }
      tocca.hidden = true; piede.hidden = false;
    });

    box.appendChild(tocca);
    s._piede.appendChild(piede);
    t.mostra(s);
  }

  function siComincia(t, st) {
    var el = t.el;
    var s = t.schermata({ icona: "🎬", titolo: "Si comincia!", sotto: "Tutti hanno visto il proprio ruolo" });
    s._contenuto.appendChild(el("div", { style: "text-align:center;margin:14px 0" }, [
      el("p", { class: "tenue", text: "Inizia" }),
      el("div", { style: "font-size:2.2rem;font-weight:800", text: st.g[st.iniziante].nome }),
      el("p", { class: "modulo-nota", style: "margin-top:16px",
        text: "A turno dite a voce UNA parola legata alla vostra — senza essere troppo espliciti. Poi discutete chi è l'impostore." })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Andiamo a votare ▶", onclick: function () { vota(t, st, 0); } }));
    t.mostra(s);
  }

  // ---- votazione: ognuno indica in segreto chi crede sia l'impostore ----
  function vota(t, st, i) {
    if (i >= st.g.length) return esito(t, st);
    t.passaA(st.g[i].nome, function () { schermataVoto(t, st, i); });
  }

  function schermataVoto(t, st, i) {
    var el = t.el;
    var s = t.schermata({ icona: "🗳️", titolo: st.g[i].nome + ", chi è l'impostore?", sotto: "Vota in segreto" });
    var g = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    st.g.forEach(function (gg, k) {
      if (k === i) return;
      g.appendChild(el("button", { class: "btn btn-fantasma", style: "font-size:1.1rem;padding:14px", text: gg.nome,
        onclick: function () { st.g[i].voto = k; vota(t, st, i + 1); } }));
    });
    s._contenuto.appendChild(g);
    t.mostra(s);
  }

  // ---- esito + punti ----
  function esito(t, st) {
    var el = t.el;
    var conte = st.g.map(function () { return 0; });
    st.g.forEach(function (gg) { if (gg.voto != null) conte[gg.voto]++; });
    var max = Math.max.apply(null, conte);
    var piuVotati = [];
    conte.forEach(function (n, k) { if (n === max && max > 0) piuVotati.push(k); });
    var scoperto = (piuVotati.length === 1 && piuVotati[0] === st.impostore);

    st.g.forEach(function (gg, k) {
      if (k === st.impostore) { gg.punti += scoperto ? 0 : 3; }
      else if (gg.voto === st.impostore) { gg.punti += 2; }
    });

    var s = t.schermata({ icona: scoperto ? "✅" : "🕵️",
      titolo: scoperto ? "Impostore scoperto!" : "L'impostore l'ha fatta franca!" });
    s._contenuto.appendChild(el("div", { style: "text-align:center;margin:8px 0 14px" }, [
      el("p", { class: "tenue", text: "L'impostore era" }),
      el("div", { style: "font-size:1.8rem;font-weight:800", text: "🕵️ " + st.g[st.impostore].nome }),
      el("p", { class: "tenue", style: "margin-top:10px", text: "La parola era" }),
      el("div", { style: "font-size:1.8rem;font-weight:800", text: st.carta.reale }),
      st.suggerimento ? el("p", { class: "tenue", style: "margin-top:8px", text: "(l'impostore aveva: " + st.carta.impostore + ")" }) : null
    ]));
    var lista = el("div");
    st.g.forEach(function (gg) {
      if (gg.voto == null) return;
      lista.appendChild(el("div", { style: "display:flex;justify-content:space-between;padding:6px 10px;border-radius:10px;margin-bottom:5px;background:rgba(255,255,255,.05)" }, [
        el("span", { text: gg.nome + " → " + st.g[gg.voto].nome }),
        el("span", { text: gg.voto === st.impostore ? "✅" : "❌" })
      ]));
    });
    s._contenuto.appendChild(lista);

    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Vedi la classifica 🏆", onclick: function () {
      var classifica = st.g.slice().sort(function (a, b) { return b.punti - a.punti; })
        .map(function (x) { return { nome: x.nome, punti: x.punti }; });
      t.fine(classifica);
    } }));
    t.mostra(s);
  }
})();
