/* =========================================================
   MODELLO DI GIOCO ONLINE per SPeeD GAME — da COPIARE per ogni gioco nuovo.
   È un gioco vero e funzionante ("Il più veloce": quando il tasto diventa
   verde, chi lo tocca per primo prende un punto; chi tocca troppo presto
   ne perde uno). Ha già fatte bene tutte le cose facili da sbagliare:
   - saletta d'attesa comune (t.lobby) con avatar e posti che mancano;
   - chi entra senza profilo scrive il nome, chi ha il profilo entra da solo;
   - gli id dei giocatori nella "foto" (vm): servono a chi entra per sapere che è dentro;
   - segreti a un telefono solo con inviaVeloce + "to" (mai con invia);
   - "⚙️ Regole" in saletta (t.onRegole);
   - chi esce: dalla saletta si toglie senza rimescolare, a partita iniziata resta "via";
   - "Esci" a partita iniziata chiede conferma;
   - fine partita: t.risultato coi NOMI dei giocatori, poi "Nuova partita" nella STESSA saletta;
   - schermo intero senza scorrere e senza titolo, aggiornato a pezzi (niente lampeggio);
   - tocchi con pointerdown (su iPhone il click a volte non arriva).
   Come usarlo: copialo in js/games/<id>.js, cambia ID/nome/testi e riscrivi
   solo le parti segnate con "QUI". Il resto lascialo com'è.
   ========================================================= */
(function () {
  "use strict";

  var ID = "modello";            // QUI: l'id del gioco (uguale in GIOCHI_ONLINE e CAT_GIOCO di core.js)
  var MIN = 2, MAX = 10;         // QUI: quanti giocatori

  function fmtN(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }   // 1.000
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, giri: imp.giri || 5, giro: 0, stato: "attesa", vincitore: null, classifica: null, to: null,
      players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0 }] };
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }

    // "⚙️ Regole" nella saletta: l'host cambia le impostazioni quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.giri = im.giri || 5; bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        var p = pById(id); if (!p) return;
        // nella saletta si toglie e basta (squadre e posti degli altri restano come sono)
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;                                   // a partita iniziata resta in classifica, ma non gioca più
        if (H.fase === "gioco" && presenti().length < MIN) return fine();
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (H.fase === "lobby" && !pById(id) && H.players.length < MAX)
            H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino), punti: 0 });
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          return;
        }
        if (H.fase !== "gioco" || !pById(id)) return;
        if (m.t === "tocco") tocco(id);               // QUI: le mosse degli ospiti
      }
    });
    // la "foto" per tutti: SEMPRE con gli id; MAI segreti (quelli vanno con privato)
    function vm() {
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, giri: H.giri, giro: H.giro, stato: H.stato, vincitore: H.vincitore, classifica: H.classifica,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }) };
    }
    // un messaggio per un telefono solo (carta, ruolo, avviso): inviaVeloce, così non resta in stanza
    function privato(id, m) {
      if (id === "host") { avviso(m.testo); return; }
      m.to = id; rete.inviaVeloce(m);
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); }

    // ----- la partita -----  QUI: la logica del tuo gioco
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.fase = "gioco"; H.giro = 0; H.classifica = null;
      H.players.forEach(function (p) { p.punti = 0; });
      prossimoGiro();
    }
    function prossimoGiro() {
      ferma();
      H.giro++;
      if (H.giro > H.giri) return fine();
      H.stato = "attesa"; H.vincitore = null; bd();
      H.to = setTimeout(function () { H.stato = "via"; bd(); H.to = setTimeout(nessuno, 4000); }, 1500 + Math.random() * 2500);
    }
    function tocco(id) {
      var p = pById(id); if (!p || p.via) return;
      if (H.stato === "attesa") { p.punti -= 1; privato(id, { t: "priv", testo: "Troppo presto! −1" }); bd(); return; }
      if (H.stato !== "via") return;
      ferma(); H.stato = "preso"; H.vincitore = p.nome; p.punti += 1; bd();
      H.to = setTimeout(prossimoGiro, 1800);
    }
    function nessuno() { H.stato = "preso"; H.vincitore = null; bd(); H.to = setTimeout(prossimoGiro, 1500); }
    function fine() {
      ferma();
      var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      H.classifica = ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
      H.fase = "fine"; bd();
      // torneo online: i NOMI dei giocatori col loro posto (pari merito = stesso posto). Nei giochi a squadre: chi vince al posto 1, gli altri dopo.
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, tutti tornano nella saletta (MAI chiudere e riaprire la stanza)
    function nuova() { ferma(); H.fase = "lobby"; H.classifica = null; H.players = presenti(); H.players.forEach(function (p) { p.punti = 0; }); bd(); }

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova,
      onTocco: function () { tocco("host"); },
      onEsci: function () {
        if (H.fase === "gioco" && !window.confirm("Chiudere la partita per tutti?")) return;   // un tocco sbagliato non chiude il gioco a tutti
        ferma(); rete.chiudi(); t.esci();
      } };
    bd();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null,
      onTocco: function () { if (S.rete) S.rete.invia({ t: "tocco" }); },   // QUI: le tue mosse
      onEsci: function () {
        if (S.vm && S.vm.fase === "gioco" && !window.confirm("Uscire dalla partita?")) return;
        if (S.rete) S.rete.chiudi(); t.esci();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🎲", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
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
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
          else if (m.t === "priv") avviso(m.testo);      // QUI: i tuoi messaggi privati
        },
        onChiuso: function () { errore(t, "La partita è stata chiusa dall'host."); },
        onErrore: function () { errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function attesa() {
      var s = t.schermata({ icona: "🎲", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti): saletta, gioco, fine
  // =========================================================
  var UI = null;   // la schermata di gioco si costruisce UNA volta e poi si aggiorna a pezzi
  function disegna(t, vm, cb) {
    if (vm.fase === "lobby") { UI = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") { UI = null; return finale(t, vm, cb); }
    if (!UI) UI = creaSchermo(t, cb);
    aggiorna(UI, vm, cb);
  }
  function lobby(t, vm, cb) {
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),   // solo i posti che mancano per cominciare
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota", text: "Si gioca a " + vm.giri + " giri." })],   // QUI: le info del gioco (o scelte come le squadre)
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function creaSchermo(t, cb) {
    stile();
    var s = t.schermata({}); s.classList.add("mo-piena");   // schermo intero: niente titolo, niente scorrimento
    var ui = { t: t, giro: t.el("div", { class: "mo-giro" }), tasto: t.el("button", { class: "mo-tasto" }), avviso: t.el("div", { class: "mo-avviso" }), punti: t.el("div", { class: "mo-punti" }), chip: {} };
    // tocco immediato col pointerdown (su iPhone il click a volte non arriva)
    ui.tasto.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onTocco(); });
    var esci = t.el("button", { class: "mo-esci", "aria-label": "Esci", text: "‹", onclick: cb.onEsci });
    s._contenuto.appendChild(t.el("div", { class: "mo-scena" }, [t.el("div", { class: "mo-barra" }, [esci, ui.giro]), ui.tasto, ui.avviso, ui.punti]));
    t.mostra(s);
    return ui;
  }
  function aggiorna(ui, vm, cb) {   // QUI: aggiorna solo i pezzi che cambiano (testi e classi), mai tutta la schermata
    ui.giro.textContent = "Giro " + vm.giro + " di " + vm.giri;
    var testo = vm.stato === "attesa" ? "Aspetta…" : vm.stato === "via" ? "TOCCA!" : (vm.vincitore ? "Punto a " + vm.vincitore : "Nessuno…");
    ui.tasto.textContent = testo; ui.tasto.className = "mo-tasto " + vm.stato;
    vm.players.forEach(function (p) {
      var c = ui.chip[p.id];
      if (!c) { c = ui.chip[p.id] = ui.t.el("div", { class: "mo-chip" }); ui.punti.appendChild(c); }
      c.textContent = (p.id === cb.myId ? "Tu" : p.nome) + " " + fmtN(p.punti);
      c.classList.toggle("via", !!p.via);
    });
  }
  function avviso(testo) {
    if (!UI || !testo) return;
    UI.avviso.textContent = testo; UI.avviso.classList.remove("su"); void UI.avviso.offsetWidth; UI.avviso.classList.add("su");
  }
  function finale(t, vm, cb) {
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale" });
    var ol = t.el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    (vm.classifica || []).forEach(function (r) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[r.pos - 1] || (r.pos + "°") }),
        t.el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        t.el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(s);
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Questo gioco si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  var cssFatto = false;
  function stile() {   // QUI: lo stile del gioco, con un prefisso di classe tutto suo
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.mo-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#15123a}",
      ".schermata.mo-piena>.testa,.schermata.mo-piena>.piede{display:none}",
      ".schermata.mo-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".mo-scena{height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:12px;padding:calc(8px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".mo-barra{display:flex;align-items:center;gap:10px;font-weight:800}",
      ".mo-esci{width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".mo-tasto{flex:1 1 auto;min-height:0;border:0;border-radius:28px;font:inherit;font-size:clamp(2rem,10vw,3.4rem);font-weight:900;color:#fff;touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
      ".mo-tasto.attesa{background:#c92a2a}.mo-tasto.via{background:#2f9e44}.mo-tasto.preso{background:#495057}",
      ".mo-avviso{min-height:1.4em;text-align:center;font-weight:900;color:#ffa94d;opacity:0}.mo-avviso.su{animation:moAvviso 1.6s ease}",
      "@keyframes moAvviso{0%{opacity:0;transform:scale(.8)}15%{opacity:1;transform:scale(1.05)}80%{opacity:1}100%{opacity:0}}",
      ".mo-punti{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}",
      ".mo-chip{padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800;font-size:.85rem}.mo-chip.via{opacity:.4}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Il più veloce", icona: "⚡",   // QUI: nome e icona
    descrizione: "Quando il tasto diventa verde, toccalo per primo! Ognuno dal suo telefono.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,   // difficolta 1-3: pesa i punti nel torneo
    modi: [], soloOnline: true,   // QUI: se c'è anche un modo sullo stesso telefono, mettilo in modi e togli soloOnline
    regole: [
      "Il tasto è <b>rosso</b>: aspetta. Quando diventa <b>verde</b>, toccalo per primo e prendi un punto.",
      "Se lo tocchi quando è ancora rosso perdi un punto. Vince chi ha più punti alla fine dei giri."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.giri = 5;
      // le scelte con bottoni .modo-chip: così l'host le ritrova in "⚙️ Regole" nella saletta
      box.appendChild(el("div", { class: "etichetta", text: "Quanti giri" }));
      var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(3,1fr)" });
      [3, 5, 10].forEach(function (n) {
        var b = el("button", { class: "modo-chip" + (n === 5 ? " attiva" : ""), style: "justify-content:center", onclick: function () {
          dove.giri = n; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: n + " giri" })]);
        g.appendChild(b);
      });
      box.appendChild(g);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
})();
