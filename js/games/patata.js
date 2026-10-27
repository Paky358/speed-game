/* =========================================================
   GIOCO — "La Patata Bollente"  (ispirato a "Bomba a Tempo")
   Esce una categoria (la più votata fra 3, o "a sorpresa").
   Chi ha la bomba dice a voce una parola della categoria e la
   passa a chi vuole, toccando il suo leggio. Chi la riceve ha il
   tempo pieno (15 s, cambiabile nelle regole); ogni 4 passaggi il
   tempo cala di 2 s, fino a 5 s. Non puoi ripassarla a chi l'ha già
   avuta finché non ha fatto il giro. Se chi te l'ha data non ha detto
   la parola, "Non valeva!": torna a lui col tempo che aveva.
   A chi scade il tempo, la bomba esplode: perde una vita (di solito
   ne ha una sola: è fuori). Si va avanti finché ne resta uno.
   Un telefono solo (si passa di mano) oppure ognuno dal suo (online).
   ========================================================= */
(function () {
  "use strict";

  var ST = window.SGStudio;   // lo studio del game show (condiviso, js/studio.js)
  var COLORI = ["#ff6b6b", "#4dabf7", "#51cf66", "#ffd43b", "#cc5de8", "#ff922b", "#20c997", "#f783ac", "#a9e34b", "#66d9e8"];
  var PARTITE_SALVATE = Object.create(null);
  // Le regole cambiabili (impostazioni e "⚙️ Regole" in saletta)
  function regoleDa(imp) {
    imp = imp || {};
    var tempo = [10, 15, 20].indexOf(+imp.tempo) >= 0 ? +imp.tempo : 15;
    var vite = [1, 2, 3].indexOf(+imp.vite) >= 0 ? +imp.vite : 1;
    return { tempo: tempo * 1000, accelera: imp.accelera !== false, vite: vite, difficili: !!imp.difficili, segreta: imp.miccia === "segreta" };
  }
  function testoRegole(r) {
    var tempo = r.segreta ? "🤫 Miccia segreta (scoppia tra " + MICCIA_MIN / 1000 + " e " + MICCIA_MAX / 1000 + " secondi)" : "⏱️ " + (r.tempo / 1000) + " secondi" + (r.accelera ? " (poi cala)" : "");
    return tempo + " · " + (r.vite > 1 ? "❤️ " + r.vite + " vite" : "❤️ 1 vita") + (r.difficili ? " · anche categorie difficili" : "");
  }
  // la miccia segreta (come la bomba vera): a ogni manche dura un tempo a caso, che nessuno vede (lo sa solo il motore dell'host)
  var MICCIA_MIN = 20000, MICCIA_MAX = 60000;
  // Pause dello spettacolo (il tempo della bomba NON scende): rivelazione della categoria con la bomba
  // che vola sul primo, bomba che passa al nuovo dopo un'esplosione, e l'esplosione stessa.
  var ATTESA_INIZIO = 4600, ATTESA_ROUND = 1800, DURATA_BOOM = 3400;
  var TEMPO_VOTO = 25;   // online: secondi per votare la categoria, poi si parte da soli
  var ATTESA_SORPRESA = 2600;   // in più quando la categoria è a sorpresa: gira la ruota delle categorie
  var BLOCCO_PASSAGGIO = 600;   // dopo un passaggio, per un attimo nessuno si può toccare (niente doppio tocco)

  function nuovaSessioneP() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  function creaStatGiocatoriP(players) {
    var out = Object.create(null);
    players.forEach(function (p) { out[p.id] = { votiCategoria: 0, bombeRicevute: 0, passaggi: 0, rimandi: 0, esplosioni: 0, roundSopravvissuti: 0 }; });
    return out;
  }
  function salvaTrofeiPatata(t, vm, cb) {
    try {
      if (!vm || vm.fase !== "fine" || t.guarda || (t.linkParams && (t.linkParams.guarda || t.linkParams.prova)) ||
          (t.impostazioni && t.impostazioni.prova) || !vm.partitaId ||
          !(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var profilo = SGNube.profilo(), lista = vm.players || [], id = null, me = null;
      if (cb.locale) {
        var nomeProfilo = String(profilo.nome || "").trim().toLowerCase();
        me = lista.filter(function (p) { return String(p.nome || "").trim().toLowerCase() === nomeProfilo; })[0];
        id = me && me.id;
      } else {
        id = cb.myId;
        me = lista.filter(function (p) { return p.id === id; })[0];
      }
      if (!me || !id || !String(profilo.nome || "").trim() || String(profilo.nome).trim().toLowerCase() !== String(me.nome || "").trim().toLowerCase()) return;
      var profiloId = String(profilo.uid || profilo.nome).trim().toLowerCase();
      var chiave = "patata|" + vm.partitaId + "|" + profiloId;
      if (PARTITE_SALVATE[chiave]) return;
      var chiaveLocale = "sg-patata-ultima-partita-" + profiloId;
      try { if (window.localStorage && localStorage.getItem(chiaveLocale) === String(vm.partitaId)) { PARTITE_SALVATE[chiave] = 1; return; } } catch (e) {}
      // la vittoria conta solo online, con almeno 3 giocatori e se gli altri non sono usciti (niente partite "finte":
      // sullo stesso telefono uno da solo potrebbe inventarsi due nomi e vincere quante volte vuole)
      var valida = !cb.locale && (vm.players || []).length >= 3 && !vm.abbandonata;
      var miei = (vm.statFine || {})[id] || {}, vinta = valida && !!(vm.vincitore && vm.vincitore.id === id);
      var incr = [["partite", 1], ["votiCategoria", +miei.votiCategoria || 0], ["bombeRicevute", +miei.bombeRicevute || 0],
        ["passaggi", +miei.passaggi || 0], ["rimandi", +miei.rimandi || 0], ["esplosioni", +miei.esplosioni || 0],
        ["roundSopravvissuti", +miei.roundSopravvissuti || 0]];
      if (!cb.locale) incr.push(["partiteOnline", 1]);
      if (vm.sorpresa) incr.push(["partiteSorpresa", 1]);
      if (vinta) { incr.push(["vittorie", 1]); if (!cb.locale) incr.push(["vittorieOnline", 1]); }
      var s = SGNube.statGioco ? (SGNube.statGioco("patata") || {}) : {};
      if (s.ultimaPartitaTrofei === vm.partitaId) return;
      var serie = valida ? (vinta ? (+s.serieVittorieOra || 0) + 1 : 0) : (+s.serieVittorieOra || 0);
      PARTITE_SALVATE[chiave] = 1;
      try { if (window.localStorage) localStorage.setItem(chiaveLocale, String(vm.partitaId)); } catch (e) {}
      SGNube.salvaProgressi(null, "patata", incr.filter(function (x) { return x[1] > 0; }),
        [["serieVittorieMax", serie]], [["serieVittorieOra", serie], ["ultimaPartitaTrofei", vm.partitaId]]);
    } catch (e) {}
  }

  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  SG.registra({
    id: "patata",
    nome: "La Patata Bollente",
    icona: "💣",
    descrizione: "Esce una categoria: dici una parola a voce e lanci la bomba a chi vuoi. A chi scade il tempo, esplode! Si va avanti finché ne resta uno.",
    giocatoriMin: 2,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono con la bomba!", amici: true }],
    giocatoriMax: 10,
    postiOnline: 10,   // posti online
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    riprende: true,    // se l'host ricarica la pagina, la partita riprende: la bomba torna in mano a chi l'aveva, col tempo intero
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    difficolta: 2,
    regole: [
      "Si vota fra <b>3 categorie</b> o <b>🎲 a sorpresa</b> (una a caso, la sceglie la ruota): si gioca la più votata.",
      "Chi ha la bomba dice a voce <b>una parola della categoria</b> e la passa toccando un altro giocatore. Chi la riceve ha <b>15 secondi</b> per fare lo stesso.",
      "Ogni <b>4 passaggi</b> il tempo cala di 2 secondi, fino a 5. Non puoi ripassarla a chi l'ha già avuta finché non ha fatto il giro.",
      "Se chi te l'ha data <b>non ha detto la parola</b> (o l'ha ripetuta), tocca <b>“↩️ Non valeva!”</b>: torna a lui, col tempo che aveva.",
      "A chi <b>finisce il tempo</b> la bomba esplode: perde una vita (di solito ne ha una sola: è fuori). Vince l'<b>ultimo rimasto</b>.",
      "Con la <b>🤫 miccia segreta</b> non c'è il conto alla rovescia: la bomba scoppia a caso tra 20 e 60 secondi, e passarla non rimette a posto il tempo. Si sente solo il ticchettio che accelera: chi ce l'ha in mano quando scoppia, perde!",
      "Miccia, tempo, vite e categorie difficili si cambiano nelle regole della partita."
    ],
    riassunto: function (imp) { return testoRegole(regoleDa(imp)); },

    // le scelte con bottoni .modo-chip: così l'host le ritrova anche in "⚙️ Regole" nella saletta
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = aiuti.torneo ? "telefono" : (aiuti.modo || "telefono");
      if (aiuti.torneo) dove.torneo = true;
      dove.tempo = 15; dove.accelera = true; dove.vite = 1; dove.difficili = false; dove.miccia = "vista";
      function fila(titolo, voci, chiave, dentro, poi) {
        dentro = dentro || box;
        dentro.appendChild(el("div", { class: "etichetta", text: titolo }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + voci.length + ",1fr)" });
        voci.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v[0] ? " attiva" : ""), style: "justify-content:center", onclick: function () {
            dove[chiave] = v[0]; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
            if (poi) poi();
          } }, [el("div", { class: "mt", text: v[1] })]);
          g.appendChild(b);
        });
        dentro.appendChild(g);
      }
      // la miccia segreta: niente conto alla rovescia, quindi tempo e "cala" non servono (si nascondono)
      var conTempo = el("div");
      fila("💣 La miccia", [["vista", "A vista ⏱️"], ["segreta", "Segreta 🤫"]], "miccia", null, function () { conTempo.hidden = dove.miccia === "segreta"; });
      box.appendChild(conTempo);
      fila("⏱️ Tempo per passarla", [[10, "10 s"], [15, "15 s"], [20, "20 s"]], "tempo", conTempo);
      fila("⚡ Il tempo cala ogni 4 passaggi", [[true, "Sì"], [false, "No"]], "accelera", conTempo);
      fila("❤️ Vite di ognuno", [[1, "1"], [2, "2"], [3, "3"]], "vite");
      fila("🗂️ Categorie", [[false, "Normali"], [true, "Anche difficili"]], "difficili");
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospitePatata(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostPatata(t);
      return singolaPatata(t);
    }
  });

  // =========================================================
  //  MOTORE condiviso (stato + timer + regole). onCambio() viene
  //  chiamato a ogni cambiamento (per ridisegnare / trasmettere).
  // =========================================================
  // regole: { tempo (ms), accelera, vite, difficili } (vedi regoleDa)
  // usate: le categorie dell'host già proposte (si alternano fra una partita e l'altra)
  function creaMotore(giocatori, onCambio, extraCats, regole, usate) {
    regole = regole || regoleDa({});
    var deck = (window.SG_PATATA || []).concat(regole.difficili ? (window.SG_PATATA_DIFFICILI || []) : []);
    extraCats = extraCats || []; usate = usate || [];
    var chiuso = false, toBoom = null;   // chiuso: la partita è stata lasciata (niente più disegni né timer)
    function cambia() { if (!chiuso) onCambio(); }
    // Il timer riparte a ogni "ricezione". Il tetto parte dal tempo scelto e (se "accelera")
    // cala di 2s ogni 4 passaggi, fino a un minimo di 5s: 15, 13, 11, 9, 7, 5.
    function capMs(passaggi) { return regole.accelera ? Math.max(Math.min(5000, regole.tempo), regole.tempo - 2000 * Math.floor(passaggi / 4)) : regole.tempo; }
    // fra le 3 proposte al massimo 2 categorie dell'host, prima quelle non ancora proposte; il resto a caso
    function pesca(n) {
      var nuove = extraCats.filter(function (c) { return usate.indexOf(c) < 0; });
      if (!nuove.length) { usate.length = 0; nuove = extraCats.slice(); }
      var out = mischia(nuove).slice(0, Math.min(2, n));
      out.forEach(function (c) { usate.push(c); });
      out = out.concat(mischia(deck.filter(function (c) { return out.indexOf(c) < 0; })).slice(0, n - out.length));
      return mischia(out);
    }
    var st = {
      fase: "voto", cats: pesca(3), categoria: null,
      players: giocatori.map(function (g) { return { id: g.id, nome: g.nome, colore: g.colore, omino: g.omino || null, eliminato: false, via: false, vite: regole.vite, voto: null }; }),
      holder: null, prev: null, ultimo: null, giro: [], round: 0, ts: 0, boom: null, vincitore: null, abbandonata: false,
      remaining: 0, cap: regole.tempo, passaggi: 0, remPrima: null, giroPrima: [], eliminati: [], soloDare: null, attesa: 0,
      miccia: 0, bruciato: 0   // miccia segreta: quanto dura questa manche (mai nella foto prima dello scoppio) e quanta ne è già bruciata
    };
    function nuovaMiccia() { st.miccia = MICCIA_MIN + Math.floor(Math.random() * (MICCIA_MAX - MICCIA_MIN + 1)); st.bruciato = 0; }
    var partitaId = nuovaSessioneP(), statGiocatori = creaStatGiocatoriP(st.players);
    function statP(id) { return statGiocatori[id] || (statGiocatori[id] = { votiCategoria: 0, bombeRicevute: 0, passaggi: 0, rimandi: 0, esplosioni: 0, roundSopravvissuti: 0 }); }
    function pById(id) { for (var i = 0; i < st.players.length; i++) if (st.players[i].id === id) return st.players[i]; return null; }
    function vivi() { return st.players.filter(function (p) { return !p.eliminato; }); }
    function inGara(id) { var p = pById(id); return !!p && !p.eliminato; }
    function holderObj() { return pById(st.holder); }
    function finisci(abbandonata) {
      var v = vivi();
      st.fase = "fine"; st.boom = null; st.abbandonata = !!abbandonata;
      st.vincitore = v[0] ? { id: v[0].id, nome: v[0].nome, colore: v[0].colore } : null;
    }
    // il giro: chi ha già avuto la bomba. Se chi ce l'ha non ha più nessuno a cui darla, si apre un giro nuovo.
    function sistemaGiro() {
      st.giro = st.giro.filter(inGara);
      if (st.holder && st.giro.indexOf(st.holder) < 0) st.giro.push(st.holder);
      var liberi = vivi().filter(function (p) { return p.id !== st.holder && st.giro.indexOf(p.id) < 0; });
      if (!liberi.length) st.giro = st.holder ? [st.holder] : [];
    }

    function aggiorna() {
      if (chiuso || st.fase !== "gioco") return;
      var now = Date.now(), dt = now - st.ts; st.ts = now;
      // pausa dello spettacolo: il tempo è fermo (ma la miccia segreta brucia anche nell'attimo dopo un passaggio)
      if (now < st.attesa && !(regole.segreta && st.blocco)) return;
      if (!holderObj()) return;
      if (regole.segreta) {   // la miccia brucia per conto suo: passare la bomba non la rimette a posto
        st.bruciato += dt;
        if (st.bruciato >= st.miccia) { st.bruciato = st.miccia; esplode(); }
        return;
      }
      st.remaining -= dt;
      if (st.remaining <= 0) { st.remaining = 0; esplode(); }
    }
    var loop = setInterval(aggiorna, 120);

    // "a sorpresa": una categoria a caso fra tutte, ma non una delle tre in votazione
    function sorpresa() {
      var tutte = mischia(extraCats.concat(deck)).filter(function (c) { return st.cats.indexOf(c) < 0; });
      return tutte.length ? tutte[0] : st.cats[Math.floor(Math.random() * st.cats.length)];
    }
    function scegli(idx) { if (idx >= st.cats.length) avviaGioco(sorpresa(), true); else avviaGioco(st.cats[idx], false); }   // l'ultima voce è "a sorpresa"
    function avviaGioco(cat, aCaso) {
      st.sorpresa = !!aCaso; st.categoria = cat; st.round = 0; st.boom = null; st.vincitore = null; st.passaggi = 0; st.remPrima = null; st.eliminati = [];
      // chi se n'è andato resta fuori (non torna in gara come un fantasma)
      st.players.forEach(function (p) { p.eliminato = !!p.via; p.vite = regole.vite; if (p.via) st.eliminati.push(p.id); });
      var vv = vivi();
      if (vv.length < 2) { finisci(true); cambia(); return; }
      st.holder = vv[Math.floor(Math.random() * vv.length)].id;
      statP(st.holder).bombeRicevute++;
      st.prev = null; st.ultimo = null; st.soloDare = null; st.giro = [st.holder]; st.cap = capMs(0); st.remaining = st.cap; nuovaMiccia();
      st.fase = "gioco"; st.ts = Date.now(); st.attesa = st.ts + ATTESA_INIZIO + (st.sorpresa ? ATTESA_SORPRESA : 0); st.blocco = false; cambia();
    }
    function esplode() {
      var h = holderObj(); if (!h) return;
      statP(h.id).esplosioni++;
      h.vite = Math.max(0, (h.vite || 1) - 1);
      var fuori = h.vite <= 0;
      if (fuori) { h.eliminato = true; st.eliminati.push(h.id); }
      st.boom = { id: h.id, nome: h.nome, fuori: fuori, vite: h.vite, miccia: regole.segreta ? Math.round(st.miccia / 1000) : null }; st.fase = "esplosione"; cambia();
      toBoom = setTimeout(dopoBoom, DURATA_BOOM);
    }
    // finita l'esplosione: la bomba a un altro (o la fine). (Anche dopo la ripresa, se l'host ha ricaricato durante il BOOM)
    function dopoBoom() {
      toBoom = null;
      if (chiuso || st.fase !== "esplosione") return;   // partita lasciata o già finita (es. sono usciti tutti)
      var hid = st.holder;   // (chi è appena esploso)
      st.boom = null; var v = vivi();
      v.forEach(function (p) { if (p.id !== hid) statP(p.id).roundSopravvissuti++; });
      if (v.length <= 1) { finisci(false); cambia(); return; }
      st.round++;
      // togli gli eliminati dal giro, poi dai la bomba a caso a chi NON è ancora
      // stato scelto in questo giro (così si completa il giro); se hanno già avuto
      // tutti, si apre un giro nuovo.
      st.giro = st.giro.filter(inGara);
      var cand = v.filter(function (p) { return st.giro.indexOf(p.id) < 0; });
      if (!cand.length) { st.giro = []; cand = v; }
      var nh = cand[Math.floor(Math.random() * cand.length)];
      st.holder = nh.id; st.giro.push(nh.id); statP(nh.id).bombeRicevute++;
      if (st.giro.length >= v.length) st.giro = [nh.id];
      st.prev = null; st.ultimo = null; st.soloDare = null;
      st.cap = capMs(st.passaggi); st.remaining = st.cap; st.remPrima = null; nuovaMiccia();
      st.fase = "gioco"; st.ts = Date.now(); st.attesa = st.ts + ATTESA_ROUND; st.blocco = false; cambia();
    }

    return {
      st: st, vivi: vivi,
      vota: function (id, idx) { var p = pById(id); if (p && !p.via && st.fase === "voto" && idx >= 0 && idx <= st.cats.length) { if (p.voto == null) statP(id).votiCategoria++; p.voto = idx; cambia(); } },
      via: function () {
        if (st.fase !== "voto") return;
        var conta = st.cats.map(function () { return 0; }); conta.push(0);   // + "a sorpresa"
        st.players.forEach(function (p) { if (!p.via && p.voto != null && conta[p.voto] != null) conta[p.voto]++; });
        var max = Math.max.apply(null, conta), top = [];
        conta.forEach(function (c, i) { if (c === max) top.push(i); });
        scegli(top[Math.floor(Math.random() * top.length)]);
      },
      viaCon: function (idx) { if (st.fase === "voto") scegli(idx); },
      passa: function (fromId, targetId) {
        aggiorna(); if (st.fase !== "gioco" || fromId !== st.holder || Date.now() < st.attesa) return;
        var tgt = pById(targetId); if (!tgt || tgt.eliminato || targetId === st.holder) return;
        if (st.soloDare != null && !inGara(st.soloDare)) st.soloDare = null;
        if (st.soloDare != null) {
          if (targetId !== st.soloDare) return;      // dopo "Non valeva!": puoi ridarla SOLO a chi te l'ha rimandata
        } else if (st.giro.indexOf(targetId) >= 0) {
          return;                                    // regola normale: non a chi ha già avuto la bomba nel giro
        }
        st.soloDare = null;                     // vincolo consumato
        st.remPrima = st.remaining;             // per l'eventuale "Non valeva!"
        st.passaggi++; statP(fromId).passaggi++; statP(targetId).bombeRicevute++; st.cap = capMs(st.passaggi); st.remaining = st.cap;  // riceve -> timer riparte
        st.ultimo = st.holder;                  // tenuto solo come info (il ritorno si fa col pulsante "Non valeva!")
        st.giroPrima = st.giro.slice();         // per ripristinarlo con "Non valeva!"
        st.prev = st.holder; st.holder = targetId; st.giro.push(targetId);
        sistemaGiro();
        st.ts = Date.now(); st.attesa = st.ts + BLOCCO_PASSAGGIO; st.blocco = true;   // un attimo fermi: il secondo tocco non la ripassa subito
        cambia();
      },
      indietro: function (fromId) {
        aggiorna(); if (st.fase !== "gioco" || fromId !== st.holder || !st.prev || Date.now() < st.attesa) return;
        var p = pById(st.prev); if (!p || p.eliminato) return;
        // il passaggio non valeva: non conta nei trofei di chi l'aveva passata (né di chi l'ha ricevuta)
        var sp = statP(st.prev), sf = statP(fromId);
        sp.passaggi = Math.max(0, sp.passaggi - 1); sf.bombeRicevute = Math.max(0, sf.bombeRicevute - 1);
        if (sf.rimandi < 3) sf.rimandi++;        // al massimo 3 a partita (non si gonfia rimandandosela all'infinito)
        // torna a chi l'aveva, col tempo che aveva (NIENTE reset)
        st.passaggi = Math.max(0, st.passaggi - 1); st.cap = capMs(st.passaggi);
        if (st.remPrima != null) st.remaining = st.remPrima;
        st.ultimo = st.holder;
        st.soloDare = st.holder;                 // chi riprende la bomba potrà ridarla SOLO a chi gliel'ha rimandata
        // NON si resetta il giro: si ripristina com'era prima del passaggio annullato
        var back = st.prev; st.prev = null; st.holder = back; st.giro = st.giroPrima ? st.giroPrima.slice() : st.giro; sistemaGiro();
        st.ts = Date.now(); st.attesa = st.ts + BLOCCO_PASSAGGIO; st.blocco = true; cambia();
      },
      // chi se ne va (online): fuori da questa partita e da quelle dopo
      rimuovi: function (id) {
        var p = pById(id); if (!p || p.via) return;
        var eraInGara = !p.eliminato;
        p.via = true; p.eliminato = true; p.voto = null;
        if (st.eliminati.indexOf(id) < 0) st.eliminati.push(id);
        if (st.soloDare === id) st.soloDare = null;   // il bersaglio del vincolo non c'è più
        if (st.fase === "voto") { if (vivi().length <= 1) finisci(true); }
        else if (eraInGara && (st.fase === "gioco" || st.fase === "esplosione")) {
          var v = vivi();
          if (v.length <= 1) finisci(true);
          else if (st.holder === id && st.fase === "gioco") {   // aveva la bomba: passa a un altro a caso, con un attimo per accorgersene
            st.holder = v[Math.floor(Math.random() * v.length)].id; statP(st.holder).bombeRicevute++;
            st.prev = null; st.soloDare = null; st.giro = [st.holder]; st.cap = capMs(st.passaggi); st.remaining = st.cap;
            st.ts = Date.now(); st.attesa = st.ts + ATTESA_ROUND; st.blocco = false;
          } else {
            if (st.prev === id) st.prev = null;
            sistemaGiro();
          }
        }
        cambia();
      },
      nuova: function () {
        st.players.forEach(function (p) { p.eliminato = !!p.via; p.vite = regole.vite; p.voto = null; });
        st.eliminati = []; st.cats = pesca(3); st.fase = "voto"; st.categoria = null; st.sorpresa = false; st.boom = null; st.vincitore = null; st.abbandonata = false;
        partitaId = nuovaSessioneP(); statGiocatori = creaStatGiocatoriP(st.players); cambia();
      },
      remaining: function () { return Math.max(0, st.remaining); },
      bruciato: function () { return st.bruciato; },
      chiuso: function () { return chiuso; },
      distruggi: function () { chiuso = true; clearInterval(loop); if (toBoom) { clearTimeout(toBoom); toBoom = null; } },
      // la ripresa (l'host ha ricaricato la pagina): la partita com'è (un oggetto semplice) e di nuovo dentro il motore
      esporta: function () { return JSON.parse(JSON.stringify({ st: st, partitaId: partitaId, stat: statGiocatori })); },
      // la bomba riparte col tempo INTERO in mano a chi l'aveva (durante la ricarica non scoppia), dopo `respiro` ms fermi;
      // un BOOM a metà si chiude da solo; voto e classifica restano come sono
      importa: function (x, respiro) {
        if (!x || !x.st) return;
        Object.keys(x.st).forEach(function (k) { st[k] = x.st[k]; });
        if (x.partitaId) partitaId = x.partitaId;
        if (x.stat) statGiocatori = x.stat;
        if (toBoom) { clearTimeout(toBoom); toBoom = null; }
        var ora = Date.now();
        if (st.fase === "gioco") {
          if (!holderObj() || !inGara(st.holder)) { var v = vivi(); if (v.length) st.holder = v[0].id; }
          st.cap = capMs(st.passaggi); st.remaining = st.cap; st.remPrima = null; if (regole.segreta) nuovaMiccia();
          st.ts = ora; st.attesa = ora + (respiro || 0); st.blocco = false;
        } else if (st.fase === "esplosione") toBoom = setTimeout(dopoBoom, Math.max(1200, respiro || 0));
      },
      vm: function () {
        var classifica = null;
        if (st.fase === "fine") {
          // dal vincitore (ultimo rimasto) giù fino al primo esploso; chi è uscito in fondo
          var esplosi = st.eliminati.slice().reverse().map(pById).filter(function (p) { return p && !p.via; });
          var usciti = st.players.filter(function (p) { return p.via; });
          var ord = vivi().concat(esplosi, usciti);
          classifica = ord.map(function (p, i) { return { id: p.id, nome: p.nome, colore: p.colore, omino: p.omino || null, via: !!p.via, pos: i + 1 }; });
        }
        return {
          fase: st.fase, categoria: st.categoria, sorpresa: !!st.sorpresa, cats: st.cats, round: st.round,
          partitaId: partitaId, statFine: st.fase === "fine" ? statGiocatori : null, abbandonata: !!st.abbandonata,
          viteMax: regole.vite, tempo: regole.tempo,
          // miccia segreta: nella foto c'è solo quanta ne è già bruciata (serve al ticchettio), MAI quanto dura
          segreta: !!regole.segreta, bruciato: regole.segreta ? Math.round(st.bruciato) : 0, blocco: !!st.blocco,
          players: st.players.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore, omino: p.omino || null, eliminato: p.eliminato, via: !!p.via, vite: p.vite, voto: p.voto }; }),
          holder: st.holder, prev: st.prev, ultimo: st.ultimo, giro: st.giro.slice(),
          soloDare: (st.soloDare != null && inGara(st.soloDare)) ? st.soloDare : null,
          remaining: Math.max(0, Math.round(st.remaining)), cap: st.cap, boom: st.boom, vincitore: st.vincitore, classifica: classifica,
          attesaMs: Math.max(0, st.attesa - Date.now())   // quanto manca prima che il tempo della bomba riparta
        };
      }
    };
  }

  // =========================================================
  //  SUONO — ticchettio che accelera + boom
  // =========================================================
  function acP() { try { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; acP._c = acP._c || new AC(); if (acP._c.state === "suspended") acP._c.resume(); return acP._c; } catch (e) { return null; } }
  function tickP(freq) {
    var ctx = acP(); if (!ctx) return;
    try { var o = ctx.createOscillator(), g = ctx.createGain(), n = ctx.currentTime;
      o.type = "square"; o.frequency.setValueAtTime(freq, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.14, n + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.06);
      o.connect(g); g.connect(ctx.destination); o.start(n); o.stop(n + 0.07); } catch (e) {}
  }
  function boomP() {
    var ctx = acP(); if (!ctx) return;
    try {
      var n = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(180, n); o.frequency.exponentialRampToValueAtTime(40, n + 0.5);
      g.gain.setValueAtTime(0.35, n); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.6);
      o.connect(g); g.connect(ctx.destination); o.start(n); o.stop(n + 0.62);
    } catch (e) {}
  }

  function swishP() {   // "fiuu" della bomba che vola
    var ctx = acP(); if (!ctx) return;
    try {
      var n = ctx.currentTime, len = Math.floor(ctx.sampleRate * 0.18), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = buf; f.type = "bandpass"; f.frequency.setValueAtTime(900, n); f.frequency.exponentialRampToValueAtTime(2600, n + 0.18); f.Q.value = 1.4; g.gain.value = 0.35;
      s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(n); s.stop(n + 0.2);
    } catch (e) {}
  }

  function cuoreP() {   // battito del cuore negli ultimi 3 secondi (due colpi bassi)
    var ctx = acP(); if (!ctx) return;
    try {
      [0, 0.17].forEach(function (d, k) {
        var n = ctx.currentTime + d, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(k ? 62 : 75, n); o.frequency.exponentialRampToValueAtTime(40, n + 0.14);
        g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(k ? 0.45 : 0.6, n + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.16);
        o.connect(g); g.connect(ctx.destination); o.start(n); o.stop(n + 0.17);
      });
    } catch (e) {}
  }
  function allarmeP() {   // "ti è arrivata!" (online, quando la bomba arriva sul tuo telefono)
    var ctx = acP(); if (!ctx) return;
    try {
      [0, 0.12, 0.24].forEach(function (d, k) {
        var n = ctx.currentTime + d, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "square"; o.frequency.setValueAtTime(k % 2 ? 660 : 990, n);
        g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.2, n + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.1);
        o.connect(g); g.connect(ctx.destination); o.start(n); o.stop(n + 0.11);
      });
    } catch (e) {}
  }

  var dispTimer = null, tickTimer = null;
  function stopTimers() { if (dispTimer) clearInterval(dispTimer); if (tickTimer) clearTimeout(tickTimer); dispTimer = tickTimer = null; }
  function assicuraStileP() {
    if (document.getElementById("sg-patata-css")) return;
    var s = document.createElement("style"); s.id = "sg-patata-css";
    // come nello studio: si anima solo transform/opacity
    s.textContent = [
      // maxischermo durante il gioco (si vede da lontano: scritte grandi)
      ".pt-sch{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:10px 6px}",
      ".pt-cat{font-size:22px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#cdd6ff}",
      ".pt-catnome{font-size:44px;font-weight:900;line-height:1.08;color:#ffe066;text-shadow:0 4px 0 rgba(0,0,0,.35);padding:0 6px}",
      ".pt-bombona{font-size:110px;line-height:1;will-change:transform;animation:ptPulsa .6s ease-in-out infinite alternate}",
      "@keyframes ptPulsa{from{transform:scale(.94)}to{transform:scale(1.06)}}",
      ".pt-conto{font-family:'Courier New',ui-monospace,monospace;font-size:150px;font-weight:900;line-height:.95;color:#fff;text-shadow:0 0 30px rgba(255,120,60,.6)}",
      ".pt-conto.poco{color:#ff5d6c;will-change:transform;animation:ptCuore .5s ease-out infinite}",
      ".pt-conto.pt-mistero{letter-spacing:.06em}",
      "@keyframes ptCuore{0%{transform:scale(1)}15%{transform:scale(1.12)}30%{transform:scale(1)}45%{transform:scale(1.07)}100%{transform:scale(1)}}",
      // la bomba arriva sul tuo telefono (online): lo schermo si colora di rosso un attimo
      ".pt-allarme{position:absolute;inset:0;z-index:23;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,rgba(255,40,40,0) 35%,rgba(255,30,30,.75) 100%)}",
      ".pt-allarme.on{animation:ptAllarme 1.1s ease-out}",
      "@keyframes ptAllarme{0%{opacity:0}12%{opacity:1}35%{opacity:.35}50%{opacity:.9}100%{opacity:0}}",
      ".pt-guardi{font-size:.98rem;color:#cdd6ff}",
      // chi guarda soltanto: la targhetta del core in basso (44 px + 10 di margine) ha il suo posto
      ".st-vista.st-con-targa .st-barra{padding-bottom:calc(64px + env(safe-area-inset-bottom))}.st-vista.st-con-targa.con-barra .st-sch-in{padding-bottom:152px}",
      ".schermata.pt-con-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
      ".pt-indietro b{display:block;font-size:1.15rem}",
      ".pt-chi{font-size:34px;font-weight:800;color:#fff}",
      ".pt-chi b{color:#ffd43b}",
      ".pt-regola{font-size:22px;font-weight:700;color:#cdd6ff;opacity:.85}",
      ".pt-boomtxt{font-size:96px;font-weight:900;color:#ff5d6c;text-shadow:0 6px 0 rgba(0,0,0,.35);animation:ptEsce .45s cubic-bezier(.3,1.5,.5,1) both}",
      // voto della categoria (si vede da vicino)
      ".pt-voto{flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:8px 4px}",
      ".pt-titolo{font-size:26px;font-weight:900;text-align:center}",
      ".pt-sotto{font-size:14px;color:#cdd6ff;text-align:center;margin:-6px 0 4px}",
      ".pt-catbtn{display:flex;flex-direction:column;gap:4px;width:100%;text-align:left;padding:18px;border-radius:18px;border:3px solid transparent;cursor:pointer;color:#fff;font:inherit;font-size:21px;font-weight:900;",
        "background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.05));box-shadow:0 6px 16px rgba(0,0,0,.3)}",
      ".pt-catbtn small{font-size:13px;font-weight:700;opacity:.8}",
      ".pt-catbtn.sorpresa{background:linear-gradient(135deg,rgba(160,107,255,.42),rgba(255,62,165,.2))}",
      ".pt-rullo{width:100%;max-width:380px;border-radius:20px;background:linear-gradient(#2a1f6e,#140c3e);box-shadow:0 0 0 3px #ffd43b,0 10px 26px rgba(0,0,0,.45)}",
      ".pt-rullo .st-cella{padding:0 14px;font-size:34px;font-weight:900;line-height:1.1;color:#ffe066;text-shadow:0 3px 0 rgba(0,0,0,.35)}",
      ".pt-rullo.fermo{animation:ptClac .5s cubic-bezier(.3,1.6,.5,1)}",
      "@keyframes ptClac{0%{transform:none}35%{transform:scale(1.08)}100%{transform:none}}",
      ".pt-catbtn.scelta{border-color:#ffd43b;background:linear-gradient(135deg,rgba(255,212,59,.32),rgba(255,212,59,.08))}",
      ".pt-rivela{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center}",
      ".pt-catgrande{font-size:40px;font-weight:900;color:#ffe066;text-shadow:0 4px 0 rgba(0,0,0,.35);padding:0 10px;animation:ptEsce .5s cubic-bezier(.3,1.5,.5,1) both}",
      "@keyframes ptEsce{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}",
      // la bomba sopra la testa (trema, la miccia sfavilla) e l'esplosione
      ".pt-bomba{position:absolute;left:0;top:0;z-index:6;pointer-events:none;opacity:0;transition:opacity .25s;will-change:transform}",
      ".pt-bomba-in{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;line-height:1;will-change:transform;animation:ptTrema .18s ease-in-out infinite alternate}",
      ".pt-bomba.corri .pt-bomba-in{animation-duration:.07s}",
      "@keyframes ptTrema{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}",
      ".pt-miccia{position:absolute;right:6%;top:2%;width:24%;height:24%;border-radius:50%;background:radial-gradient(circle,#fff 0 25%,#ffd43b 45%,rgba(255,120,0,0) 70%);will-change:transform,opacity;animation:ptScintilla .12s steps(2) infinite}",
      "@keyframes ptScintilla{50%{transform:scale(1.6);opacity:.6}}",
      ".pt-boom{position:absolute;z-index:7;width:0;height:0;pointer-events:none}",
      ".pt-boom:before{content:'';position:absolute;left:-150px;top:-150px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#fff 0,#ffd43b 25%,#ff6b00 50%,rgba(255,60,0,0) 70%);will-change:transform,opacity;animation:ptOnda .8s ease-out forwards}",
      ".pt-boom span{position:absolute;left:0;top:0;font-size:120px;line-height:1;will-change:transform,opacity;animation:ptBoom .9s ease-out forwards}",
      ".pt-boom i{position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(120,110,125,.9),rgba(80,70,85,0) 70%);opacity:0;will-change:transform,opacity;animation:ptFumo 1.6s ease-out forwards}",
      ".pt-boom i:nth-child(1){--fx:-110px;--fy:-130px}.pt-boom i:nth-child(2){--fx:100px;--fy:-140px}.pt-boom i:nth-child(3){--fx:-150px;--fy:-20px}",
      ".pt-boom i:nth-child(4){--fx:150px;--fy:-30px}.pt-boom i:nth-child(5){--fx:-40px;--fy:-190px}.pt-boom i:nth-child(6){--fx:50px;--fy:-180px}",
      "@keyframes ptOnda{from{transform:scale(.2);opacity:1}to{transform:scale(1.8);opacity:0}}",
      "@keyframes ptBoom{0%{transform:translate(-50%,-50%) scale(.2);opacity:1}40%{transform:translate(-50%,-50%) scale(1.3);opacity:1}100%{transform:translate(-50%,-50%) scale(1.1);opacity:0}}",
      "@keyframes ptFumo{0%{transform:translate(0,0) scale(.3);opacity:0}20%{opacity:1}100%{transform:translate(var(--fx),var(--fy)) scale(2.2);opacity:0}}",
      // barra sotto
      ".pt-hint{font-size:.98rem}",
      ".pt-indietro{width:100%;padding:12px;border-radius:14px;border:2px solid #ffa94d;background:rgba(255,169,77,.18);color:#ffd8a8;font:inherit;font-weight:700;cursor:pointer}",
      // lobby e classifica con gli avatar
      ".pt-lobby{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,.06);font-weight:700}",
      ".pt-lobby .fac,.pt-riga .fac{width:38px;height:38px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
      ".pt-lobby .fac svg,.pt-riga .fac svg,.pt-gradino .fac svg{width:100%;height:100%;display:block}",
      ".pt-podio{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:8px 0 14px}",
      ".pt-gradino{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center}",
      ".pt-gradino .fac{width:70px;height:70px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1)}",
      ".pt-gradino.p1 .fac{width:90px;height:90px;box-shadow:0 0 0 3px #ffd43b,0 0 26px rgba(255,212,59,.55)}",
      ".pt-gradino .nm{font-weight:800;font-size:.85rem;margin:4px 0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pt-gradino .blocco{width:100%;border-radius:10px 10px 0 0;display:flex;justify-content:center;padding-top:6px;font-size:1.6rem}",
      ".pt-gradino.p1 .blocco{height:84px;background:linear-gradient(#ffd75a,#c99a10)}",
      ".pt-gradino.p2 .blocco{height:62px;background:linear-gradient(#e6ebf2,#98a3b3)}",
      ".pt-gradino.p3 .blocco{height:46px;background:linear-gradient(#e8a866,#a8662a)}",
      ".pt-riga{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;border-radius:14px;background:rgba(255,255,255,.06)}",
      ".pt-riga.primo{background:rgba(255,212,59,.16);border:1px solid rgba(255,212,59,.5)}",
      ".pt-riga .pos{width:28px;text-align:center;font-weight:900}",
      ".pt-riga .nm{flex:1;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pt-riga .et{font-size:.8rem;opacity:.8}",
      ".pt-riga.via{opacity:.6}",
      // classifica finale su schermi bassi (o con tanti giocatori): podio e righe più basse, poi su due colonne
      ".pt-corta .pt-podio{margin:2px 0 8px}.pt-corta .pt-gradino .fac{width:50px;height:50px}.pt-corta .pt-gradino.p1 .fac{width:62px;height:62px}",
      ".pt-corta .pt-gradino .blocco{font-size:1.2rem;padding-top:3px}.pt-corta .pt-gradino.p1 .blocco{height:44px}.pt-corta .pt-gradino.p2 .blocco{height:32px}.pt-corta .pt-gradino.p3 .blocco{height:24px}",
      ".pt-corta .pt-righe{gap:4px!important}.pt-corta .pt-riga{padding:3px 10px 3px 4px;gap:8px}.pt-corta .pt-riga .fac{width:28px;height:28px}",
      ".pt-due .pt-righe{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))}.pt-due .pt-riga{gap:5px;padding:3px 6px 3px 3px}.pt-due .pt-riga .pos{width:auto}.pt-due .pt-riga .et{display:none}",
      // 🤍 Bianco e oro: la classifica finale è una schermata chiara (lo studio con la patata resta com'è)
      ".oro.g-patata .pt-gradino .fac,.oro.g-patata .pt-riga .fac{background:var(--o-fondo-2)}",
      ".oro.g-patata .pt-gradino.p1 .fac{box-shadow:0 0 0 3px var(--o-oro),0 6px 18px rgba(167,123,13,.3)}",
      ".oro.g-patata .pt-gradino.p1 .blocco{background:var(--o-tasto)}",
      ".oro.g-patata .pt-riga{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo),var(--o-ombra)}",
      ".oro.g-patata .pt-riga.primo{background:var(--o-carta-viva);border:0;box-shadow:inset 0 0 0 1.5px var(--o-oro),var(--o-ombra)}",
      ".oro.g-patata .pt-riga .pos{font-family:var(--o-tit);font-variant-numeric:lining-nums;color:var(--o-oro-testo)}",
      ".oro.g-patata .pt-riga .et{color:var(--o-tenue);opacity:1}"
    ].join("");
    document.head.appendChild(s);
  }

  // =========================================================
  //  UN TELEFONO SOLO
  // =========================================================
  function singolaPatata(t) {
    var imp = t.impostazioni || {};
    var giocatori = t.giocatori.map(function (n, i) { return { id: "p" + i, nome: n, colore: COLORI[i % COLORI.length] }; });
    var motore = creaMotore(giocatori, function () { disegna(); }, [], regoleDa(imp));
    var cb = {
      locale: true, sonoHost: true, myId: null, torneo: !!imp.torneo, chiuso: false,
      getRemaining: function () { return motore.remaining(); },
      getBruciato: function () { return motore.bruciato(); },
      onScegliCat: function (idx) { motore.viaCon(idx); },
      onPassa: function (id) { motore.passa(motore.st.holder, id); },
      onIndietro: function () { motore.indietro(motore.st.holder); },
      onNuova: function () { motore.nuova(); },
      // torneo sullo stesso telefono: la classifica di questa partita passa al torneo
      onTorneo: function (cl) { if (cb.chiuso) return; cb.chiuso = true; stopTimers(); motore.distruggi(); t.fine(cl); },
      onEsci: function () { cb.chiuso = true; stopTimers(); motore.distruggi(); t.esci(); }
    };
    function disegna() { if (!cb.chiuso) disegnaPatataVM(t, motore.vm(), cb); }
    disegna();
  }

  // =========================================================
  //  ONLINE — ospita / ospite
  // =========================================================
  function hostPatata(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteP(t);
    var nomeHost = (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Host";
    var IO = t.mioId || "host";   // chi tiene la partita su questo telefono ("host", o l'amico che ha preso il posto dell'host)
    var H = { fase: "lobby", codice: "…", pronta: false, motore: null, customCats: [], usate: [], regole: regoleDa(t.impostazioni),
      players: [{ id: IO, nome: nomeHost, colore: COLORI[0], omino: t.mioOmino ? t.mioOmino(nomeHost) : ST.mioAvatar(nomeHost) }],
      attesa: [],     // attesa: chi è entrato a partita iniziata (guarda, e gioca dalla prossima)
      fuori: [] };    // fuori: nella Sala, chi non è stato scelto per giocare (guarda soltanto, anche le partite dopo)
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function colora() { H.players.forEach(function (p, i) { p.colore = COLORI[i % COLORI.length]; }); }
    // "⚙️ Regole" nella saletta: l'host cambia tempo, vite e categorie
    t.onRegole = function (im) { H.regole = regoleDa(im); if (H.fase === "lobby") bd(); };
    // la ripresa (l'host ha ricaricato la pagina a metà partita): t.ripresa.stato.patata = quello che si è ricordato in bd()
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.patata;
    var attesi = {};   // (ripresa) gli amici che devono rifarsi vivi: chi non torna in 20 s esce come quando se ne va
    var detto = null;   // la partita (partitaId) già data al torneo online
    // ---- la ripresa: stessi giocatori, stesse vite, stessa categoria; la bomba torna in mano a chi l'aveva, col tempo
    // intero, dopo 5 secondi fermi. Gli amici restano in gara e rientrano da soli (stesso id)
    if (RIP && RIP.motore) {
      ["customCats", "usate", "players", "attesa", "fuori"].forEach(function (k) { if (Array.isArray(RIP[k])) H[k] = RIP[k]; });
      if (RIP.regole) H.regole = RIP.regole;
      detto = RIP.detto || null;
      H.fase = "gioco";
      H.motore = creaMotore(presenti(), function () { bd(); }, H.customCats, H.regole, H.usate);
      H.motore.importa(RIP.motore, 5000);
      H.players.concat(H.attesa, H.fuori).forEach(function (p) { if (p.id !== IO && !p.via) attesi[p.id] = 1; });
    }
    var cbRete = {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        delete attesi[id];
        var nf = H.fuori.length; H.fuori = H.fuori.filter(function (a) { return a.id !== id; });
        if (H.fuori.length !== nf) { bd(); return; }
        if (H.fase === "lobby") { H.players = H.players.filter(function (p) { return p.id !== id; }); colora(); bd(); return; }
        H.attesa = H.attesa.filter(function (a) { return a.id !== id; });
        var p = pById(id); if (p) p.via = true;   // a partita iniziata resta in classifica come "uscito", ma non gioca più
        if (H.motore && p) H.motore.rimuovi(id); else bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        delete attesi[id];   // (si è rifatto vivo)
        if (m.t === "join") {
          var nome = String(m.nome || "Amico").slice(0, 16), omino = ST.avatarValido(m.omino), p = pById(id);
          // nella Sala gioca solo chi è stato scelto: gli altri guardano (col loro id nella foto)
          var giaFuori = H.fuori.some(function (a) { return a.id === id; });
          if (!p && (giaFuori || (t.puoSedersi && !t.puoSedersi(id, nome)))) { if (!giaFuori) H.fuori.push({ id: id, nome: nome }); bd(); return; }
          if (H.fase === "lobby") {
            if (!p) { if (H.players.length >= 10) return piena(id); H.players.push({ id: id, nome: nome, colore: COLORI[H.players.length % COLORI.length], omino: omino }); }
          } else if ((!p || p.via) && !H.attesa.some(function (a) { return a.id === id; })) {
            // entra a partita iniziata (o torna dopo essere stato tolto): guarda e gioca dalla prossima
            if (presenti().length + H.attesa.length >= 10) return piena(id);
            H.attesa.push({ id: id, nome: nome, omino: omino });
          }
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          return;
        }
        if (!H.motore) return;
        if (m.t === "vota") H.motore.vota(id, m.idx);
        else if (m.t === "passa") H.motore.passa(id, m.target);
        else if (m.t === "indietro") H.motore.indietro(id);
      },
      onErrore: function () { senzaReteP(t); }
    };
    var rete = SGNet.ospita("patata", cbRete, H.motore ? { ripresa: true } : null);
    function piena(id) { try { rete.inviaVeloce({ t: "piena", to: id }); } catch (e) {} }
    function vmHost() {
      if (H.fase === "lobby") return { fase: "lobby", codice: H.codice, pronta: H.pronta, regole: testoRegole(H.regole),
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore, omino: p.omino || null }; }), customCats: H.customCats.slice(),
        fuori: H.fuori.map(function (a) { return { id: a.id, nome: a.nome }; }) };
      var vm = H.motore.vm(); vm.codice = H.codice; vm.pronta = H.pronta;
      vm.guardano = H.attesa.concat(H.fuori).map(function (a) { return { id: a.id, nome: a.nome }; });   // con il loro id: così sanno di essere entrati
      vm.fuori = H.fuori.map(function (a) { return { id: a.id, nome: a.nome }; });
      return vm;
    }
    function bd() {
      var v = vmHost();
      if (v.fase === "fine" && v.classifica && detto !== v.partitaId && t.risultato) {
        detto = v.partitaId; t.risultato(v.classifica.map(function (p) { return { nome: p.nome, pos: p.pos }; }));
      }
      ricorda(); vici();
      rete.invia({ t: "vm", vm: v }); disegna();
    }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda (non gioca: non ha niente da perdere)
    var viciK = "";
    function vici() {
      var l = H.attesa.concat(H.fuori).map(function (a) { return a.id; }).filter(function (id) { return id !== IO; }), k = l.join(",");
      if (k !== viciK && t.vici) { viciK = k; t.vici(l.length ? l : null); }
    }
    // dopo ogni cambiamento la partita si ricorda (in saletta niente da riprendere)
    var ricordato = !!H.motore;
    function ricorda() {
      if (!t.ricorda) return;
      if (H.fase === "lobby" || !H.motore) { if (ricordato) { ricordato = false; t.ricorda(null); } return; }
      ricordato = true;
      t.ricorda({ patata: { fase: H.fase, customCats: H.customCats, usate: H.usate, regole: H.regole, players: H.players,
        attesa: H.attesa, fuori: H.fuori, detto: detto, motore: H.motore.esporta() } });
    }
    var cb = {
      locale: false, sonoHost: true, myId: IO, chiuso: false,
      getRemaining: function () { return H.motore ? H.motore.remaining() : 0; },
      getBruciato: function () { return H.motore ? H.motore.bruciato() : 0; },
      onAggiungiCat: function (txt) { txt = String(txt || "").trim().slice(0, 40); if (H.fase === "lobby" && txt && H.customCats.indexOf(txt) < 0) { H.customCats.push(txt); bd(); } },
      onTogliCat: function (i) { if (H.fase === "lobby") { H.customCats.splice(i, 1); bd(); } },
      onContinua: function () {
        if (H.fase !== "lobby" || presenti().length < 2) return;
        if (cb._cat && cb._cat.inp.value.trim()) { cb.onAggiungiCat(cb._cat.inp.value); cb._cat.inp.value = ""; }   // la categoria scritta e non aggiunta non si perde
        H.fase = "gioco"; H.motore = creaMotore(presenti(), function () { bd(); }, H.customCats, H.regole, H.usate); bd();
      },
      onVota: function (idx) { H.motore && H.motore.vota(IO, idx); },
      onVia: function () { H.motore && H.motore.via(); },
      onPassa: function (id) { H.motore && H.motore.passa(IO, id); },
      onIndietro: function () { H.motore && H.motore.indietro(IO); },
      // "Nuova partita": tutti tornano nella saletta (entra anche chi è arrivato tardi, esce chi se n'è andato)
      onNuova: function () {
        if (H.motore) H.motore.distruggi();
        H.motore = null; H.fase = "lobby";
        H.players = presenti().concat(H.attesa.map(function (a) { return { id: a.id, nome: a.nome, omino: a.omino }; }));
        // chi tiene la partita è il primo (in saletta ha la corona); se l'ha presa guardando (host di riserva), si siede
        if (!H.players.some(function (p) { return p.id === IO; })) { H.fuori = H.fuori.filter(function (a) { return a.id !== IO; }); H.players.push({ id: IO, nome: nomeHost, omino: t.mioOmino ? t.mioOmino(nomeHost) : ST.mioAvatar(nomeHost) }); }
        H.players.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });
        H.attesa = []; colora(); bd();
      },
      // la Rivincita dei tasti di fine comuni: come "Nuova partita", solo a partita finita (il core fa il 3-2-1)
      onRivincita: function () { if (H.fase === "gioco" && H.motore && H.motore.st.fase === "fine") cb.onNuova(); },
      onEsci: function () { if (t.ricorda) t.ricorda(null); cb.chiuso = true; stopTimers(); if (H.motore) H.motore.distruggi(); rete.chiudi(); t.esci(); }
    };
    function disegna() { if (!cb.chiuso) disegnaPatataVM(t, vmHost(), cb); }
    t.onRivincita = cb.onRivincita;
    if (H.motore) {   // (ripresa) la partita com'era, a tutti; chi non si rifà vivo in 20 s esce come quando se ne va
      bd();
      setTimeout(function () { if (!cb.chiuso) Object.keys(attesi).forEach(function (id) { cbRete.onAddio(id); }); }, 20000);
    } else disegna();
  }

  function ospitePatata(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteP(t);
    var el = t.el, S = { myId: null, vm: null, vmTs: 0, rete: null, nome: "", msg: null };
    var cb = {
      locale: false, sonoHost: false, myId: null, chiuso: false,
      // il tempo scende solo dopo la pausa dello spettacolo (attesaMs)
      getRemaining: function () { if (!S.vm) return 0; return Math.max(0, S.vm.remaining - Math.max(0, (Date.now() - S.vmTs) - (S.vm.attesaMs || 0))); },
      getBruciato: function () { if (!S.vm) return 0; return (S.vm.bruciato || 0) + Math.max(0, (Date.now() - S.vmTs) - (S.vm.blocco ? 0 : (S.vm.attesaMs || 0))); },
      onVota: function (idx) { S.rete && S.rete.invia({ t: "vota", idx: idx }); },
      onPassa: function (id) { S.rete && S.rete.invia({ t: "passa", target: id }); },
      onIndietro: function () { S.rete && S.rete.invia({ t: "indietro" }); },
      onEsci: function () { cb.chiuso = true; stopTimers(); if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() {
      if (!S.vm || cb.chiuso) return;
      cb.myId = S.myId;
      // guardo soltanto: sono entrato a partita iniziata (o ero uscito): gioco dalla prossima
      cb.guardo = S.vm.fase !== "lobby" && !S.vm.players.some(function (p) { return p.id === S.myId && !p.via; });
      cb.scartato = (S.vm.fuori || []).some(function (a) { return a.id === S.myId; });   // nella Sala: non sono stato scelto, guardo
      disegnaPatataVM(t, S.vm, cb);
    }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ chiara: true, icona: "💣", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        if (S.rete) return;
        S.nome = (input.value || "Amico").trim().slice(0, 16) || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function collega() {
      // il "join" lo ripete il collegamento comune finché l'host non mi mette dentro (il mio id compare nella foto)
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : ST.mioAvatar(S.nome) });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (!m || cb.chiuso) return;
          if (m.to && m.to !== S.myId) return;   // era per un altro telefono
          if (m.t === "piena") { cb.chiuso = true; stopTimers(); if (S.rete) S.rete.chiudi(); erroreP(t, "La stanza è piena: ci sono già 10 giocatori."); return; }
          if (m.t === "vm") { S.vm = m.vm; S.vmTs = Date.now(); disegna(); }
        },
        onChiuso: function () {
          if (cb.chiuso) return;
          // l'host ha chiuso la stanza dalla classifica finale: la classifica resta, con la scritta giusta
          if (S.vm && S.vm.fase === "fine") { cb.chiusa = true; if (cb._notaFine) { cb._notaFine.textContent = NOTA_CHIUSA_P; cb._notaFine.hidden = false; } return; }
          cb.chiuso = true; stopTimers(); erroreP(t, "Collegamento perso. L'host potrebbe aver chiuso la partita.");
        },
        onErrore: function () { if (cb.chiuso) return; cb.chiuso = true; stopTimers(); erroreP(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function erroreP(t, txt) {
    var s = t.schermata({ chiara: true, icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaReteP(t) {
    var s = t.schermata({ chiara: true, icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  DISEGNO: lo STUDIO del game show (condiviso con la Linea del tempo)
  //  Tutti ai leggii; sul maxischermo la categoria e il conto alla rovescia gigante.
  //  La bomba sta sopra la testa di chi la tiene e VOLA da un leggio all'altro:
  //  chi ce l'ha tocca il leggio di chi la riceve. Quando scade: BOOM, zoom sul leggio.
  // =========================================================
  var RP = null;   // la regia di questo telefono
  // chi guarda soltanto (link con guarda=1): in basso la targhetta del core "👀 Guardi · 😂 · ✕" (faccine e uscita le dà lei)
  function conTargaP(t) { return !!(t && t.guarda && !t.eliminazione); }
  function faccineP(t) { return conTargaP(t) || !t.faccine ? null : t.faccine(); }
  function idxP(vm, id) { for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return i; return -1; }
  // il testo sul leggio di chi è in gara (con più vite: i cuori che restano)
  function testoInGara(vm, p) { return (vm.viteMax || 1) > 1 ? new Array((p.vite || 0) + 1).join("❤️") : "IN GARA"; }
  function testoFuori(p) { return p.via ? "🚪 USCITO" : "💀 OUT"; }
  function disegnaPatataVM(t, vm, cb) {
    if (cb.chiuso) return;   // partita lasciata: niente più disegni (la home resta la home)
    assicuraStileP();
    if (vm.fase === "lobby") { RP = null; stopTimers(); return disegnaLobbyP(t, vm, cb); }
    var ids = vm.players.map(function (p) { return p.id; }).join("|");
    if (!RP || RP.cb !== cb || RP.ids !== ids || (!RP.S.vivo() && vm.fase !== "fine")) {
      if (!(RP && RP.cb === cb && RP.fineFatta && vm.fase === "fine")) {
        stopTimers();
        // chi rientra a partita iniziata (pagina ricaricata, arrivato tardi): niente sigla né presentazione della categoria
        var rientro = !cb._presentato && vm.fase !== "voto";
        RP = { t: t, ids: ids, cb: cb, presentato: !!cb._presentato || rientro, rientro: rientro, rientroFine: rientro && vm.fase === "fine" };
        if (rientro) { cb._presentato = true; RP.kCat = vm.categoria; }
        RP.S = ST.crea(t, vm.players, { io: cb.locale ? -1 : idxP(vm, cb.myId), esci: function () { cb.onEsci(); }, titolo: "La Patata Bollente", logo: ["LA PATATA", "BOLLENTE"] });
        if (conTargaP(t)) RP.S.vista.classList.add("st-con-targa");   // chi guarda soltanto: il posto della targhetta del core
        RP.S.onTocca = function (i) { var p = RP.vm && RP.vm.players[i]; if (p) { swishP(); RP.cb.onPassa(p.id); } };
        vm.players.forEach(function (p, i) { ST.testoLeggio(RP.S, i, p.eliminato ? testoFuori(p) : testoInGara(vm, p), p.eliminato); if (p.eliminato) { ST.fuori(RP.S, i, true); if (!p.via) ST.faccia(RP.S, i, "esploso"); } });
        RP.bomba = creaBomba(RP.S);
        RP.allarme = t.el("div", { class: "pt-allarme" }); RP.S.vista.appendChild(RP.allarme);
      }
    }
    RP.vm = vm; RP.cb = cb; RP.vmTs = Date.now();
    regiaTickP(RP);
  }
  async function regiaTickP(R) {
    if (R.corre) { R.ancora = true; return; }
    R.corre = true;
    try {
      for (var giri = 0; giri < 30; giri++) {
        R.ancora = false;
        var fatto = await regiaPassoP(R);
        if (!fatto && !R.ancora) break;
      }
    } catch (e) {} finally { R.corre = false; }
  }
  async function regiaPassoP(R) {
    var vm = R.vm, S = R.S, cb = R.cb;
    if (cb.chiuso || RP !== R) return false;   // uscito (o c'è già una regia nuova): questa si ferma
    if (vm.fase === "fine") {
      if (R.fineFatta) return false;
      R.fineFatta = true; stopTimers(); nascondiBomba(R); ST.tocca(S, []); ST.viaBarra(S);
      var vinc = vm.vincitore ? idxP(vm, vm.vincitore.id) : -1;
      if (S.vivo() && !R.rientroFine) await ST.finale(S, vinc, "Ultimo sopravvissuto! 💣");
      if (R.cb.chiuso || RP !== R) return false;   // nel frattempo si è usciti o si è tornati in saletta
      schermataFineP(R.t, vm, R.cb);
      return true;
    }
    if (!S.vivo()) return false;
    if (!R.presentato) {   // la sigla, una volta sola per partita
      R.presentato = true; cb._presentato = true;
      await ST.apertura(S);
      return true;
    }
    if (vm.fase === "voto") { mostraVotoP(R, vm); return false; }
    if (vm.fase === "gioco") {
      var kR = vm.categoria + "|" + vm.round;
      if (R.kRound !== kR) {
        R.kRound = kR; stopTimers();
        if (R.kCat !== vm.categoria) { R.kCat = vm.categoria; await rivelaCategoria(R); }
        else await nuovoRound(R);
        return true;
      }
      aggiornaGioco(R);
      return false;
    }
    if (vm.fase === "esplosione" && vm.boom) {
      var kB = vm.categoria + "|" + vm.round + "|" + vm.boom.id;
      if (R.kBoom === kB) return false;
      R.kBoom = kB;
      await esplosione(R);
      return true;
    }
    return false;
  }

  // ---- il maxischermo ----
  function testoCap(vm) { return vm.segreta ? "🤫 Nessuno sa quando scoppia!" : "Chi la riceve ha " + Math.round(vm.cap / 1000) + " secondi"; }
  function schermoPatata(R) {
    var el = R.t.el, S = R.S, vm = R.vm, h = null;
    ST.fermaTimer(S); ST.vuota(S.sch);
    vm.players.forEach(function (p) { if (p.id === vm.holder) h = p; });
    // miccia segreta: al posto dei secondi, il punto di domanda (il tempo vero non lo sa nessuno)
    R.contoEl = el("div", { class: "pt-conto" + (vm.segreta ? " pt-mistero" : ""), text: vm.segreta ? "???" : (vm.cap / 1000).toFixed(1) });
    R.bombonaEl = null;
    R.chiEl = el("b", { text: h ? h.nome : "" });
    R.regolaEl = el("div", { class: "pt-regola", text: testoCap(vm) });
    S.sch.appendChild(el("div", { class: "pt-sch" }, [
      el("div", { class: "pt-cat", text: "🗂️ categoria" }),
      el("div", { class: "pt-catnome", text: vm.categoria || "" }),
      R.bombonaEl = el("div", { class: "pt-bombona", text: "💣" }),
      R.contoEl,
      el("div", { class: "pt-chi" }, [ el("span", { text: "Ha la bomba " }), R.chiEl ]),
      R.regolaEl
    ]));
  }
  // il voto: i 4 tasti si creano una volta sola per ogni gruppo di categorie, poi cambiano solo voti e bordo
  function mostraVotoP(R, vm) {
    var S = R.S, el = R.t.el, cb = R.cb;
    stopTimers(); nascondiBomba(R); ST.tocca(S, []); ST.accendiSolo(S, -1);
    var mio = null; vm.players.forEach(function (p) { if (p.id === cb.myId && !p.via) mio = p; });
    var iS = vm.cats.length, chiave = "voto|" + vm.cats.join("|");
    if (R.mostrato !== chiave) {
      R.mostrato = chiave; R.tastiVoto = [];
      ST.fermaTimer(S); ST.vuota(S.sch);
      var box = el("div", { class: "pt-voto" }, [
        el("div", { class: "pt-titolo", text: "🗳️ Che categoria?" }),
        el("div", { class: "pt-sotto", text: cb.locale ? "Toccatene una per iniziare" : "Vota: si gioca la più votata" })
      ]);
      vm.cats.concat(["🎲 A sorpresa"]).forEach(function (cat, i) {
        var small = el("small"), b = el("button", { class: "pt-catbtn" + (i === iS ? " sorpresa" : ""), onclick: function () {
          if (R.cb.guardo) return;   // chi guarda soltanto non vota
          swishP(); if (R.cb.locale) R.cb.onScegliCat(i); else R.cb.onVota(i);
        } }, [ el("span", { text: cat }), small ]);
        R.tastiVoto.push({ b: b, small: small, sorpresa: i === iS });
        box.appendChild(b);
      });
      S.sch.appendChild(box);
    }
    R.tastiVoto.forEach(function (x, i) {
      var voti = vm.players.filter(function (p) { return !p.via && p.voto === i; }).length;
      var testo = cb.locale ? "" : (voti === 1 ? "1 voto" : voti + " voti");
      if (x.sorpresa) testo = (testo ? testo + " · " : "") + "una categoria a caso";
      if (x.small.textContent !== testo) x.small.textContent = testo;
      x.b.classList.toggle("scelta", !!mio && mio.voto === i);
      if (x.b.disabled !== !!R.cb.guardo) x.b.disabled = !!R.cb.guardo;   // chi guarda soltanto non vota
    });
    if (R.inq !== "schermo") { R.inq = "schermo"; ST.suSchermo(S, 900); }
    var kB = "v|" + (cb.locale ? "l" : cb.sonoHost ? "h" : cb.guardo ? "g" : "o");
    if (R.barraK !== kB) {
      R.barraK = kB;
      // online il voto non resta aperto per sempre: dopo un po' si parte da soli (l'host può anche dare il via prima)
      var kConto = "pt-voto|" + vm.partitaId + "|" + vm.cats.join("|");
      if (!cb.locale && cb.sonoHost) {
        var bVia = el("button", { class: "btn btn-primario", text: "Via! ▶", onclick: function () { ST.viaBarra(S); R.barraK = null; cb.onVia(); } });
        ST.barra(S, [ bVia ]);
        if (R.t.contoAvanti) R.t.contoAvanti(bVia, TEMPO_VOTO, function () { if (RP === R && R.vm.fase === "voto") { ST.viaBarra(S); R.barraK = null; cb.onVia(); } }, kConto);
      }
      else if (cb.guardo) ST.barra(S, [ el("p", { class: "tl-attesa pt-guardi", text: cb.scartato ? "👀 Questa volta guardi: gioca chi è stato scelto." : "👀 Stai guardando: entri nella prossima partita" }), faccineP(R.t) ]);
      else if (!cb.locale) {
        var conto = el("p", { class: "tl-attesa" });
        ST.barra(S, [ el("p", { class: "tl-attesa", text: "Vota pure: parte quando l'host dà il via" }), conto ]);
        if (R.t.contoAvanti) R.t.contoAvanti(conto, TEMPO_VOTO, null, kConto); else conto.remove();
      }
      else ST.viaBarra(S);
    }
  }
  // la categoria esce dal maxischermo, poi la telecamera si allarga e la bomba vola sul primo
  async function rivelaCategoria(R) {
    var S = R.S, el = R.t.el, vm = R.vm;
    ST.viaBarra(S); R.barraK = null; ST.tocca(S, []); nascondiBomba(R);
    if (R.inq !== "schermo") { R.inq = "schermo"; await ST.suSchermo(S, 600); }
    ST.fermaTimer(S); ST.vuota(S.sch); R.mostrato = null;
    var riv = el("div", { class: "pt-rivela" }, [ el("div", { class: "pt-titolo", text: vm.sorpresa ? "🎲 Categoria a sorpresa…" : "La categoria è…" }) ]);
    S.sch.appendChild(riv);
    if (vm.sorpresa) {
      // la ruota delle categorie: parte veloce e rallenta piano piano fino a fermarsi
      var tutte = (window.SG_PATATA || []).slice(); if (tutte.indexOf(vm.categoria) < 0) tutte.push(vm.categoria);
      var ruota = ST.rullo(S, { cls: "pt-rullo", alt: 120, voci: tutte, ultima: vm.categoria || "", durata: 3400, scatto: function (k) { tickP(k % 2 ? 620 : 780); } });
      riv.appendChild(ruota.el);
      ST.FX.rullo(3.2);
      await ruota.via();
      ruota.el.classList.add("fermo");
      ST.FX.applauso();
      await ST.dorme(1300);
    } else {
      ST.FX.rullo(1.1);
      await ST.dorme(1250);
      riv.appendChild(el("div", { class: "pt-catgrande", text: vm.categoria || "" }));
      ST.FX.applauso();
      await ST.dorme(1000);
    }
    if (R.cb.chiuso || !S.vivo()) return;
    schermoPatata(R);
    R.inq = "largo"; await ST.largo(S, 800);
    await arrivaBomba(R, true);
  }
  async function nuovoRound(R) {
    var S = R.S;
    schermoPatata(R); R.mostrato = null;
    if (R.inq !== "largo") { R.inq = "largo"; await ST.largo(S, 600); }
    await arrivaBomba(R, false);
  }
  async function arrivaBomba(R, dalloSchermo) {
    var S = R.S, vm = R.vm, i = idxP(vm, vm.holder); if (i < 0 || R.cb.chiuso || !S.vivo()) return;
    var p = vm.players[i];
    ST.accendiSolo(S, i); ST.faccia(S, i, "paura");
    var da = dalloSchermo ? { x: S.R.schermo.x + S.R.schermo.w / 2, y: S.R.schermo.y + S.R.schermo.h * 0.45 } : { x: ST.sopraTesta(S, i).x, y: -80 };
    await voloBomba(R, da, puntoBomba(R, i), 650);
    if (R.cb.chiuso || !S.vivo()) return;
    vm = R.vm; i = idxP(vm, vm.holder);   // nel frattempo può essere già passata (o chi l'aveva è uscito)
    if (vm.fase !== "gioco" || i < 0) return;
    p = vm.players[i];
    R.holder = vm.holder;
    if (!R.cb.locale && vm.holder === R.cb.myId) allarme(R);
    ST.terzo(S, i, "💣 Ha la bomba " + p.nome, "Di' una parola e passala!", "💣");
    setTimeout(function () { if (R.vm.holder === p.id) ST.viaTerzo(S); }, 1600);
    avviaCronometro(R);
    aggiornaGioco(R);
  }
  // online: la bomba è arrivata sul MIO telefono (suono e bordo rosso: non sempre si guarda lo schermo)
  function allarme(R) {
    allarmeP();
    var a = R.allarme; if (!a) return;
    a.classList.remove("on"); void a.offsetWidth; a.classList.add("on");
  }
  async function esplosione(R) {
    var S = R.S, vm = R.vm, i = idxP(vm, vm.boom.id), el = R.t.el, fuori = vm.boom.fuori !== false;
    stopTimers(); ST.tocca(S, []); ST.viaBarra(S); R.barraK = null;
    boomP(); ST.lampo(S); ST.scossa(S);
    var dove = puntoBomba(R, i); nascondiBomba(R);
    var b = el("div", { class: "pt-boom" }, [ el("i"), el("i"), el("i"), el("i"), el("i"), el("i"), el("span", { text: "💥" }) ]);
    b.style.left = dove.x + "px"; b.style.top = dove.y + "px";
    S.mondo.appendChild(b); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    var resta = vm.boom.vite === 1 ? "resta con 1 vita ❤️" : "restano " + vm.boom.vite + " vite ❤️";
    // miccia segreta: adesso si può dire quanto durava
    var durava = vm.boom.miccia ? "🤫 La miccia durava " + vm.boom.miccia + " secondi" : null;
    S.sch.appendChild(el("div", { class: "pt-sch" }, [ el("div", { class: "pt-boomtxt", text: "💥 BOOM!" }),
      el("div", { class: "pt-chi" }, [ el("b", { text: vm.boom.nome }), el("span", { text: fuori ? " è fuori!" : " perde una vita!" }) ]),
      fuori ? null : el("div", { class: "pt-regola", text: resta }),
      durava ? el("div", { class: "pt-regola", text: durava }) : null ]));
    R.inq = "leggio"; await ST.suLeggio(S, i, 450);
    if (R.cb.chiuso || !S.vivo()) return;
    ST.faccia(S, i, "esploso"); ST.accendiSolo(S, -1);
    if (fuori) { ST.fuori(S, i, true); ST.testoLeggio(S, i, "💀 OUT", true); }
    else ST.testoLeggio(S, i, testoInGara(vm, vm.players[i] || {}), true);
    ST.pubblico(S, "ohh");
    ST.terzo(S, i, "💥 BOOM! " + vm.boom.nome, fuori ? "è eliminato!" : resta, "💥");
    await ST.dorme(1500); ST.viaTerzo(S);
    if (R.cb.chiuso || !S.vivo()) return;
    if (!fuori) ST.faccia(S, i, null);
    R.inq = "largo"; await ST.largo(S, 700);
    R.holder = null;
  }

  // ---- durante il gioco: bomba, chi si può toccare, display dei leggii ----
  function aggiornaGioco(R) {
    var S = R.S, vm = R.vm, cb = R.cb, el = R.t.el;
    if (vm.fase !== "gioco" || cb.chiuso || !S.vivo()) return;
    var hi = idxP(vm, vm.holder), inAttesa = Date.now() < R.vmTs + (vm.attesaMs || 0);
    if (inAttesa) R.toccaAttivo = false;   // finita la pausa, il cronometro riaccende chi si può toccare
    if (R.holder && R.holder !== vm.holder && hi >= 0) {   // la bomba è passata: vola da un leggio all'altro
      var da = idxP(vm, R.holder);
      if (da >= 0) { ST.faccia(S, da, vm.players[da].eliminato && !vm.players[da].via ? "esploso" : null); voloBomba(R, puntoBomba(R, da), puntoBomba(R, hi), 420); }
      else posaBomba(R, hi);
      ST.accendiSolo(S, hi); ST.faccia(S, hi, "paura");
      if (R.chiEl) R.chiEl.textContent = vm.players[hi].nome;
      if (!cb.locale && vm.holder === cb.myId) allarme(R);
    }
    if (hi >= 0 && !R.holder) { posaBomba(R, hi); ST.accendiSolo(S, hi); ST.faccia(S, hi, "paura"); if (R.chiEl) R.chiEl.textContent = vm.players[hi].nome; }
    R.holder = vm.holder;
    if (R.regolaEl) { var tc = testoCap(vm); if (R.regolaEl.textContent !== tc) R.regolaEl.textContent = tc; }
    vm.players.forEach(function (p, i) {
      if (p.eliminato) { ST.fuori(S, i, true); ST.testoLeggio(S, i, testoFuori(p), true); }
      else if (i !== hi) ST.testoLeggio(S, i, testoInGara(vm, p));
    });
    // chi si può toccare (solo chi ha la bomba: in locale tutti, online il suo telefono)
    // subito dopo un passaggio c'è un attimo di pausa: un secondo tocco veloce non la ripassa
    var mia = cb.locale || vm.holder === cb.myId, puoi = mia && !inAttesa, lista = [];
    if (puoi) vm.players.forEach(function (p, i) {
      if (p.eliminato || i === hi) return;
      if (vm.soloDare != null ? p.id === vm.soloDare : vm.giro.indexOf(p.id) < 0) lista.push(i);
    });
    ST.tocca(S, lista);
    // la barra sotto: "Non valeva!" / suggerimento (non dipende dalla pausa: così non lampeggia)
    var prevP = null; vm.players.forEach(function (p) { if (p.id === vm.prev) prevP = p; });
    var ioFuori = !cb.locale && !cb.guardo && vm.players.some(function (p) { return p.id === cb.myId && p.eliminato; });   // online: sono già esploso
    var chiave = "b|" + vm.holder + "|" + (mia ? 1 : 0) + "|" + (prevP && !prevP.eliminato ? prevP.id : "") + "|" + (vm.soloDare || "") + "|" + (cb.guardo ? 1 : 0) + "|" + (ioFuori ? 1 : 0);
    if (R.barraK !== chiave) {
      R.barraK = chiave;
      var nodi = [];
      if (mia && vm.soloDare) { var chiRi = null; vm.players.forEach(function (p) { if (p.id === vm.soloDare) chiRi = p; }); nodi.push(el("p", { class: "tl-attesa pt-hint", text: "Te l'hanno rimandata: di' la parola e ridàlla a " + (chiRi ? chiRi.nome : "chi te l'ha rimandata") + " 👇" })); }
      else if (mia) nodi.push(el("p", { class: "tl-attesa pt-hint", text: "Di' una parola su «" + vm.categoria + "» e tocca chi la riceve 👇" }));
      else if (cb.guardo) nodi.push(el("p", { class: "tl-attesa pt-guardi", text: cb.scartato ? "👀 Questa volta guardi: gioca chi è stato scelto." : "👀 Stai guardando: entri nella prossima partita" }), faccineP(R.t));
      else if (ioFuori) nodi.push(el("p", { class: "tl-attesa pt-guardi", text: "💀 Sei fuori: guarda chi resta in piedi!" }), faccineP(R.t));
      else if (!cb.locale && hi >= 0) nodi.push(el("p", { class: "tl-attesa pt-hint", text: "💣 Ce l'ha " + vm.players[hi].nome + "… occhio che può toccare a te!" }));
      if (mia && prevP && !prevP.eliminato) nodi.push(el("button", { class: "pt-indietro", html: "↩️ Non valeva! <b>Ridalla a " + escP(prevP.nome) + "</b>", onclick: function () { swishP(); cb.onIndietro(); } }));
      if (nodi.length) ST.barra(S, nodi); else ST.viaBarra(S);
    }
    if (R.inq !== "largo" && R.inq !== "leggio") { R.inq = "largo"; ST.largo(S, 700); }
    if (!dispTimer) avviaCronometro(R);
  }
  function escP(s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // countdown sul maxischermo e sul leggio di chi ha la bomba, ticchettio che accelera (e il cuore negli ultimi 3 secondi)
  function avviaCronometro(R) {
    stopTimers();
    var S = R.S;
    if (R.vm.segreta) return cronometroSegreto(R);
    dispTimer = setInterval(function () {
      if (!S.vivo() || R.cb.chiuso || R.vm.fase !== "gioco") { stopTimers(); return; }
      var r = Math.max(0, R.cb.getRemaining()), hi = idxP(R.vm, R.vm.holder), txt = (r / 1000).toFixed(1);
      if (R.contoEl) { R.contoEl.textContent = txt; R.contoEl.classList.toggle("poco", r < 3000); }
      if (hi >= 0) ST.testoLeggio(S, hi, "💣 " + txt, r < 3000);
      if (R.bomba) R.bomba.classList.toggle("corri", r < 3000);
      if (hi >= 0 && Date.now() >= R.vmTs + (R.vm.attesaMs || 0) && !R.toccaAttivo) { R.toccaAttivo = true; aggiornaGioco(R); }
    }, 100);
    R.toccaAttivo = Date.now() >= R.vmTs + (R.vm.attesaMs || 0);
    (function loopSuono() {
      if (!S.vivo() || R.cb.chiuso || R.vm.fase !== "gioco") { tickTimer = null; return; }
      var r = R.cb.getRemaining(), inAttesa = Date.now() < R.vmTs + (R.vm.attesaMs || 0), pieno = R.vm.tempo || 15000;
      if (r > 0 && !inAttesa) { if (r < 3000) cuoreP(); else tickP(560 + (1 - Math.min(1, r / pieno)) * 620); }
      tickTimer = setTimeout(loopSuono, r < 3000 ? 500 : Math.max(85, Math.min(620, r / 12)));
    })();
  }
  // la miccia segreta: niente numeri. Il ticchettio (e la bomba che trema) accelera con il tempo PASSATO dall'inizio
  // della manche, che non dice niente su quando scoppierà: dopo 20 secondi può succedere in qualsiasi momento
  function fretta(ms) { return Math.max(0, Math.min(1, ms / MICCIA_MAX)); }   // 0 all'inizio, 1 dopo un minuto
  function cronometroSegreto(R) {
    var S = R.S, ultimoK = null;
    dispTimer = setInterval(function () {
      if (!S.vivo() || R.cb.chiuso || R.vm.fase !== "gioco") { stopTimers(); return; }
      var b = R.cb.getBruciato(), f = fretta(b), hi = idxP(R.vm, R.vm.holder), k = f < 0.33 ? 0 : f < 0.6 ? 1 : 2;
      if (hi >= 0) ST.testoLeggio(S, hi, "💣 ???", k === 2);
      if (k !== ultimoK) {   // tre passi di fretta: cambia solo la classe (niente ridisegni)
        ultimoK = k;
        if (R.contoEl) R.contoEl.classList.toggle("poco", k === 2);
        if (R.bomba) R.bomba.classList.toggle("corri", k >= 1);
        if (R.bombonaEl) R.bombonaEl.style.animationDuration = [0.6, 0.38, 0.22][k] + "s";
      }
      if (hi >= 0 && Date.now() >= R.vmTs + (R.vm.attesaMs || 0) && !R.toccaAttivo) { R.toccaAttivo = true; aggiornaGioco(R); }
    }, 150);
    R.toccaAttivo = Date.now() >= R.vmTs + (R.vm.attesaMs || 0);
    (function loopSuono() {
      if (!S.vivo() || R.cb.chiuso || R.vm.fase !== "gioco") { tickTimer = null; return; }
      var inAttesa = Date.now() < R.vmTs + (R.vm.attesaMs || 0), f = fretta(R.cb.getBruciato());
      if (!inAttesa) tickP(560 + f * 620);
      tickTimer = setTimeout(loopSuono, Math.round(620 - f * 500));   // da 620 a 120 millisecondi
    })();
  }

  // ---- la bomba (sopra la testa di chi la tiene) ----
  function creaBomba(S) {
    var b = document.createElement("div"); b.className = "pt-bomba";
    b.innerHTML = "<div class='pt-bomba-in'><span class='pt-em'>💣</span><i class='pt-miccia'></i></div>";
    S.mondo.appendChild(b);
    return b;
  }
  // metà del leggio, ma mai troppo piccola: con 10 giocatori deve vedersi bene da lontano
  // (lo studio intero si vede a metà grandezza: un quarto dello schermo nel mondo = almeno ~44 px sul telefono)
  function misuraBomba(R) { var p = R.S.posti[0]; return Math.round(Math.max((p ? p.w : 120) * 0.5, (R.S.VW || 360) * 0.25)); }
  function puntoBomba(R, i) { var q = ST.sopraTesta(R.S, i), d = misuraBomba(R); return { x: q.x, y: q.y - d * 0.45 }; }
  function trasfBomba(R, p, giro) { var d = misuraBomba(R); return "translate(" + (p.x - d / 2).toFixed(1) + "px," + (p.y - d / 2).toFixed(1) + "px) rotate(" + (giro || 0) + "deg)"; }
  function posaBomba(R, i) {
    var b = R.bomba, d = misuraBomba(R); if (!b || i < 0) return;
    b.style.width = b.style.height = d + "px"; b.style.fontSize = (d * 0.8) + "px";
    b.style.transform = trasfBomba(R, puntoBomba(R, i)); b.style.opacity = 1;
  }
  function voloBomba(R, da, a, ms) {
    var b = R.bomba, d = misuraBomba(R); if (!b) return Promise.resolve();
    b.style.width = b.style.height = d + "px"; b.style.fontSize = (d * 0.8) + "px"; b.style.opacity = 1;
    var mezzo = { x: (da.x + a.x) / 2, y: Math.min(da.y, a.y) - R.S.VH * 0.22 };   // parabola
    var fine = trasfBomba(R, a);
    b.style.transform = fine;
    try { b.animate([{ transform: trasfBomba(R, da) }, { transform: trasfBomba(R, mezzo, 200) }, { transform: trasfBomba(R, a, 360) }], { duration: ms, easing: "cubic-bezier(.3,.1,.3,1)" }); } catch (e) {}
    return ST.dorme(ms);
  }
  function nascondiBomba(R) { if (R.bomba) R.bomba.style.opacity = 0; R.holder = null; }

  // ---- lobby (online) ----
  // la saletta d'attesa (uguale per tutti i giochi); l'host sotto può aggiungere le sue categorie
  function disegnaLobbyP(t, vm, cb) {
    var el = t.el, extra = [];
    if (vm.regole) {
      if (!cb._regEl) cb._regEl = el("p", { class: "modulo-nota", style: "text-align:center" });
      cb._regEl.textContent = vm.regole;
      extra.push(cb._regEl);
    }
    if (cb.sonoHost) {
      if (!cb._cat) {   // il riquadro delle categorie si crea una volta sola (così quello che scrivi non si perde quando entra qualcuno)
        var inpCat = el("input", { class: "link-campo", type: "text", maxlength: "40", placeholder: "Scrivi una categoria…" }), lista = el("div");
        var aggiungiCat = function () { if (inpCat.value.trim()) { cb.onAggiungiCat(inpCat.value); inpCat.value = ""; } };
        inpCat.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); aggiungiCat(); } });
        cb._cat = { inp: inpCat, lista: lista, box: el("div", {}, [ el("div", { class: "etichetta", text: "Categorie tue (facoltative)" }), inpCat,
          el("button", { class: "btn btn-fantasma", style: "margin-top:6px", text: "＋ Aggiungi categoria", onclick: aggiungiCat }), lista ]) };
      }
      var L = cb._cat.lista, chiave = (vm.customCats || []).join("|");
      if (cb._cat.k !== chiave) {   // la lista si rifà solo quando cambia
        cb._cat.k = chiave;
        while (L.firstChild) L.removeChild(L.firstChild);
        (vm.customCats || []).forEach(function (c, i) {
          L.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;margin-top:6px;background:rgba(255,255,255,.06)" }, [
            el("span", { style: "flex:1", text: "📝 " + c }), el("button", { class: "togli", text: "×", onclick: function () { cb.onTogliCat(i); } }) ]));
        });
        if ((vm.customCats || []).length) L.appendChild(el("p", { class: "modulo-nota", text: "A ogni partita ne propongo fino a 2 delle tue (a turno), insieme a quelle a caso." }));
      }
      extra.push(cb._cat.box);
    }
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, testoComincia: "Continua ▶",
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: extra, attesa: "Aspetta l'host: poi si vota la categoria e parte la bomba! 💣",
      // nella Sala: chi non è stato scelto guarda soltanto
      spettatore: !cb.sonoHost && (vm.fuori || []).some(function (a) { return a.id === cb.myId; }) ? "👀 Questa volta guardi" : null,
      onComincia: cb.onContinua, onEsci: cb.onEsci });
  }

  // ---- classifica finale (dopo il finale nello studio) ----
  var NOTA_CHIUSA_P = "🚪 L'host ha chiuso la stanza.";
  function schermataFineP(t, vm, cb) {
    salvaTrofeiPatata(t, vm, cb);
    var el = t.el;
    var cl = vm.classifica || [];
    var risultato = cl.map(function (p) { return { nome: p.nome, pos: p.pos }; });
    // sullo stesso telefono: gli XP (e le statistiche) a fine partita; nel torneo ci pensa "Avanti"
    if (cb.locale && !cb.torneo && t.risultato && cb._detto !== vm.partitaId) { cb._detto = vm.partitaId; t.risultato(risultato); }
    var sf = t.schermata({ chiara: true, icona: "🏆", titolo: "Vince " + (vm.vincitore ? vm.vincitore.nome : "") + "!", sotto: "La Patata Bollente" });
    var ultimoEsploso = -1; cl.forEach(function (p, i) { if (i > 0 && !p.via) ultimoEsploso = i; });
    var podio = el("div", { class: "pt-podio" });
    [1, 0, 2].forEach(function (k) {
      var p = cl[k]; if (!p || p.via) return;   // chi è uscito non sale sul podio
      podio.appendChild(el("div", { class: "pt-gradino p" + (k + 1) }, [
        el("div", { class: "fac", html: ST.avatarDi(p, k === 0 ? "esulta" : null) }),
        el("div", { class: "nm", text: p.nome }),
        el("div", { class: "blocco", text: ["🏆", "🥈", "🥉"][k] })
      ]));
    });
    sf._contenuto.appendChild(podio);
    var box = el("div", { class: "pt-righe", style: "display:flex;flex-direction:column;gap:6px" });
    // che tutto stia in uno schermo: podio, righe, faccine e tasti
    var conFac = !cb.locale && !!t.faccine, alto = window.innerHeight || 640;
    var serve = 300 + cl.length * 56 + (conFac ? 56 : 0) + (cb.sonoHost ? 120 : 110);
    if (serve > alto) sf.classList.add("pt-corta");
    if (300 - 95 + cl.length * 38 + (conFac ? 56 : 0) + 120 > alto) sf.classList.add("pt-due");
    cl.forEach(function (p, i) {
      var et = i === 0 ? "🏆 vincitore" : p.via ? "🚪 uscito" : (i === ultimoEsploso ? "💥 primo esploso" : "");
      box.appendChild(el("div", { class: "pt-riga" + (i === 0 ? " primo" : "") + (p.via ? " via" : "") }, [
        el("span", { class: "pos", text: (i + 1) + "°" }),
        el("span", { class: "fac", html: ST.avatarDi(p, i === ultimoEsploso ? "esploso" : null) }),
        el("span", { class: "nm", text: p.id === cb.myId ? p.nome + " (tu)" : p.nome }),
        el("span", { class: "et", text: et })
      ]));
    });
    sf._contenuto.appendChild(box);
    var targa = !cb.locale && cb.guardo && conTargaP(t);   // chi guarda col link: faccine e uscita le dà la targhetta del core
    var fac = !cb.locale && !targa && t.faccine ? t.faccine() : null;   // online: le faccine della saletta, si festeggia tutti insieme
    if (fac) { fac.classList.add("fine-faccine"); sf._contenuto.appendChild(fac); }
    // online: i tasti di fine comuni (all'host e a chi ha giocato), se li disegna il core: allora niente tasti nostri.
    // La nota resta nascosta: serve solo se l'host chiude la stanza
    var tf = cb.locale ? null : cb.sonoHost ? { host: true, nuova: cb.onNuova, esci: cb.onEsci } : (!cb.guardo || targa ? { host: false, esci: cb.onEsci } : null);
    cb._notaFine = null;
    if (tf && t.tastiFine && t.tastiFine(sf._piede, tf)) {
      if (!cb.sonoHost) {
        cb._notaFine = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:12px", text: cb.chiusa ? NOTA_CHIUSA_P : "" });
        if (!cb.chiusa) cb._notaFine.hidden = true;
        sf._contenuto.appendChild(cb._notaFine);
      }
    } else if (cb.locale && cb.torneo) {
      sf._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏆 Avanti nel torneo ▶", onclick: function () { cb.onTorneo(risultato); } }));
    } else if (cb.sonoHost) {
      sf._piede.appendChild(el("button", { class: "btn btn-primario", text: cb.locale ? "🔄 Nuova partita" : "🔄 Nuova partita (si torna nella saletta)", onclick: cb.onNuova }));
      sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Chiudi", onclick: cb.onEsci }));
    } else {
      sf._contenuto.appendChild(cb._notaFine = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:12px",
        text: cb.chiusa ? NOTA_CHIUSA_P : cb.scartato ? "👀 Questa volta hai guardato." : cb.guardo ? "👀 Hai guardato questa partita: se l'host ne fa un'altra, entri anche tu." : "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      if (!targa) sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      else sf.classList.add("pt-con-targa");   // (si esce dalla targhetta)
    }
    t.mostra(sf);
  }
})();
