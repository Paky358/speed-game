/* =========================================================
   GIOCO — "La Scalinata"  (ispirato a Wii Party, Scalinata a sorte)
   Solo in 4. A ogni round ognuno sceglie in segreto 1, 3 o 5
   gradini (4 secondi). Le scelte si scoprono tutte insieme: se
   due o più scelgono lo stesso numero restano fermi; avanza solo
   chi ha scelto un numero unico, di tanti gradini quanti il numero.
   Primo in cima (gradino TRAGUARDO) vince.
   Un telefono solo: il telefono si passa, ognuno sceglie in segreto.
   ========================================================= */
(function () {
  "use strict";

  var TRAGUARDO = 15;
  var SECONDI = 4;
  var SCELTE = [1, 3, 5];
  var COLORI = ["#ff6b6b", "#4dabf7", "#51cf66", "#ffd43b"];

  function coloreScelta(n) { return n === 1 ? "#8ce99a" : n === 3 ? "#ffd43b" : "#ff922b"; }

  SG.registra({
    id: "scalinata",
    nome: "La Scalinata",
    icona: "🪜",
    descrizione: "In quattro sulla scala: scegli 1, 3 o 5. Avanza solo chi sceglie un numero che nessun altro ha scelto. Primo in cima, vince.",
    giocatoriMin: 4,
    giocatoriMax: 4,
    difficolta: 2,
    regole: [
      "Solo in <b>4</b>. A ogni round hai <b>4 secondi</b> per scegliere in segreto <b>1, 3 o 5</b> gradini.",
      "Le scelte si scoprono <b>tutte insieme</b>, sopra la testa di ognuno: se due o più scelgono lo <b>stesso</b> numero, restano <b>fermi</b>.",
      "Avanza solo chi ha scelto un numero <b>che nessun altro ha scelto</b>, di tanti gradini quanti il numero.",
      "Vince il primo che arriva in cima alla scalinata (gradino <b>" + TRAGUARDO + "</b>)."
    ],

    avvia: function (t) {
      if (t.giocatori.length !== 4) return niente(t);
      var st = { g: t.giocatori.map(function (n, i) { return { nome: n, colore: COLORI[i], passi: 0 }; }), scelte: [null, null, null, null], nRound: 0 };
      introRound(t, st);
    }
  });

  function niente(t) {
    var s = t.schermata({ icona: "🪜", titolo: "La Scalinata", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "Questo gioco si fa esattamente in 4 giocatori." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  function introRound(t, st) {
    st.nRound += 1; st.scelte = [null, null, null, null];
    var el = t.el;
    var s = t.schermata({ icona: "🪜", titolo: "Round " + st.nRound, sotto: "Verso il gradino " + TRAGUARDO });
    s._contenuto.appendChild(disegnaScala(t, st, null, null));
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Passatevi il telefono: ognuno sceglie in segreto 1, 3 o 5. Ricordate: se scegliete lo stesso numero di un altro, restate fermi!" }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Si comincia ▶", onclick: function () { turno(t, st, 0); } }));
    t.mostra(s);
  }

  function turno(t, st, i) {
    if (i >= 4) return rivela(t, st);
    t.passaA(st.g[i].nome, function () { schermataScelta(t, st, i); });
  }

  function schermataScelta(t, st, i) {
    var el = t.el, g = st.g[i];
    var s = t.schermata({ icona: "🪜", titolo: g.nome, sotto: "Sei al gradino " + g.passi + " di " + TRAGUARDO });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Scegli in segreto quanti gradini fare. Svelto!" }));
    var timerBox = el("div", { style: "text-align:center;font-size:2.6rem;font-weight:800;margin:2px 0 6px", text: SECONDI });
    s._contenuto.appendChild(timerBox);
    var scelto = false, restano = SECONDI, tm;
    function scegli(n) { if (scelto) return; scelto = true; if (tm) clearInterval(tm); st.scelte[i] = n; turno(t, st, i + 1); }
    var griglia = el("div", { style: "display:flex;gap:12px;justify-content:center;margin-top:6px" });
    SCELTE.forEach(function (n) {
      griglia.appendChild(el("button", { style: "flex:1;max-width:130px;padding:28px 0;border-radius:18px;border:0;cursor:pointer;color:#08210f;font-weight:800;background:" + coloreScelta(n) + ";box-shadow:0 4px 10px rgba(0,0,0,.3)", onclick: function () { scegli(n); } }, [
        el("div", { style: "font-size:2.6rem;line-height:1", text: String(n) }),
        el("div", { style: "font-size:.8rem;font-weight:700;opacity:.8", text: n === 1 ? "gradino" : "gradini" })
      ]));
    });
    s._contenuto.appendChild(griglia);
    tm = setInterval(function () { restano -= 1; timerBox.textContent = Math.max(0, restano); if (restano <= 0) { clearInterval(tm); if (!scelto) scegli(SCELTE[Math.floor(Math.random() * 3)]); } }, 1000);
    t.mostra(s);
  }

  function rivela(t, st) {
    var scelte = st.scelte.slice();
    var conta = {}; scelte.forEach(function (n) { conta[n] = (conta[n] || 0) + 1; });
    var avanza = st.g.map(function (_, i) { return conta[scelte[i]] === 1; });
    var prev = st.g.map(function (g) { return g.passi; });
    st.g.forEach(function (g, i) { if (avanza[i]) g.passi = Math.min(TRAGUARDO, g.passi + scelte[i]); });

    var el = t.el;
    var s = t.schermata({ icona: "🪜", titolo: "Si scopre!", sotto: "Round " + st.nRound });
    s._contenuto.appendChild(disegnaScala(t, st, scelte, avanza, prev));
    var leg = el("div", { style: "margin-top:8px" });
    st.g.forEach(function (g, i) {
      leg.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px;padding:4px 6px;font-size:.92rem" }, [
        el("span", { style: "width:12px;height:12px;border-radius:50%;background:" + g.colore }),
        el("span", { style: "flex:1", text: g.nome + " ha scelto " + scelte[i] }),
        el("span", { style: "font-weight:700;color:" + (avanza[i] ? "#51cf66" : "#ff8787"), text: avanza[i] ? "+" + scelte[i] + " ▲" : "fermo" })
      ]));
    });
    s._contenuto.appendChild(leg);

    var finiti = st.g.filter(function (g) { return g.passi >= TRAGUARDO; });
    if (finiti.length) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Vedi il podio 🏆", onclick: function () { finePartita(t, st); } }));
    else s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Prossimo round ▶", onclick: function () { introRound(t, st); } }));
    t.mostra(s);
  }

  // ---- la scalinata a 4 corsie ----
  function disegnaScala(t, st, scelte, avanza, prev) {
    var el = t.el;
    var wrap = el("div", { style: "position:relative;height:330px;border-radius:16px;background:linear-gradient(180deg,#242c52 0%,#171634 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)" });
    wrap.appendChild(el("div", { style: "position:absolute;top:0;left:0;right:0;height:24px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;color:#ffe066;background:linear-gradient(180deg,rgba(255,224,102,.18),transparent)", text: "🏁 TRAGUARDO" }));
    // linee di riferimento ogni 5 gradini
    var area = el("div", { style: "position:absolute;top:28px;bottom:26px;left:8px;right:8px;display:flex;gap:6px" });
    for (var gr = 5; gr < TRAGUARDO; gr += 5) {
      var y = (gr / TRAGUARDO) * 100;
      area.appendChild(el("div", { style: "position:absolute;left:0;right:0;bottom:" + y + "%;height:1px;background:rgba(255,255,255,.1);pointer-events:none;z-index:1" }));
      area.appendChild(el("div", { style: "position:absolute;left:0;bottom:" + y + "%;transform:translateY(50%);font-size:.66rem;color:rgba(255,255,255,.35);z-index:1", text: gr }));
    }
    // corsie
    st.g.forEach(function (g, i) {
      var col = el("div", { style: "flex:1;height:100%;position:relative;border-radius:10px;background:rgba(255,255,255,.045)" });
      var da = prev ? prev[i] : g.passi;
      var pedina = el("div", { style: "position:absolute;left:50%;transform:translateX(-50%);bottom:" + (da / TRAGUARDO) * 100 + "%;transition:bottom .9s cubic-bezier(.2,.75,.3,1);display:flex;flex-direction:column;align-items:center;z-index:2" });
      var badge = null;
      if (scelte) {
        badge = el("div", { style: "font-size:.95rem;font-weight:800;padding:1px 8px;border-radius:12px;margin-bottom:3px;color:#08210f;background:" + (avanza[i] ? "#69db7c" : "#adb5bd") + ";opacity:0;transition:opacity .5s .3s", text: String(scelte[i]) });
        pedina.appendChild(badge);
      }
      pedina.appendChild(el("div", { style: "width:24px;height:24px;border-radius:50%;background:" + g.colore + ";border:2px solid rgba(255,255,255,.85);box-shadow:0 2px 6px rgba(0,0,0,.45)" }));
      col.appendChild(pedina);
      col.appendChild(el("div", { style: "position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:.66rem;font-weight:700;color:" + g.colore + ";text-shadow:0 1px 2px rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px", text: g.nome }));
      area.appendChild(col);
      // anima salita + comparsa numero
      if (scelte) setTimeout(function () {
        pedina.style.bottom = (g.passi / TRAGUARDO) * 100 + "%";
        if (badge) badge.style.opacity = "1";
      }, 60);
    });
    wrap.appendChild(area);
    return wrap;
  }

  function finePartita(t, st) {
    var classifica = st.g.slice()
      .sort(function (a, b) { return b.passi - a.passi; })
      .map(function (g) { return { nome: g.nome, punti: g.passi + "🪜" }; });
    t.fine(classifica);
  }
})();
