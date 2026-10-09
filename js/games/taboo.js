(function () {
  "use strict";

  var MIN = 4, MAX = 16, SQUADRE = ["A", "B"];
  var COLORI = ["#e64980", "#4263eb"];

  function avatar(nome) {
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    return (p && p.omino) || (window.SGOmino ? SGOmino.casuale(nome || "io") : null);
  }
  function valido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function mescola(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function stile() {
    if (document.getElementById("sg-taboo-css")) return;
    var s = document.createElement("style"); s.id = "sg-taboo-css";
    s.textContent = [
      ".schermata.tb-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#171a2d;color:#fff}",
      ".schermata.tb-piena>.testa,.schermata.tb-piena>.piede{display:none}",
      ".schermata.tb-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".tb{height:var(--alt,100dvh);box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;gap:clamp(8px,2vh,18px);padding:calc(12px + env(safe-area-inset-top)) 14px calc(12px + env(safe-area-inset-bottom));font-family:inherit}",
      ".tb-top{display:flex;align-items:center;justify-content:center;gap:10px;font-size:clamp(14px,4vw,18px);font-weight:900}",
      ".tb-punti{display:flex;justify-content:center;gap:10px}",
      ".tb-squadra{min-width:90px;text-align:center;border-radius:13px;padding:7px 12px;background:rgba(255,255,255,.1)}.tb-squadra span{display:block;font-size:clamp(11px,3vw,14px)}.tb-squadra b{display:block;font-size:clamp(24px,7vw,34px)}.tb-squadra.a{box-shadow:inset 0 -4px #e64980}.tb-squadra.b{box-shadow:inset 0 -4px #4263eb}",
      ".tb-timer{font-size:clamp(42px,13vw,68px);font-weight:1000;line-height:1;text-align:center;font-variant-numeric:tabular-nums}",
      ".tb-turno{font-size:clamp(14px,4vw,18px);font-weight:850;text-align:center;opacity:.88}",
      ".tb-carta{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2vh,18px);border-radius:24px;background:#fff;color:#171a2d;padding:14px;box-shadow:0 12px 32px #0004}",
      ".tb-parola{font-size:clamp(34px,10vw,58px);font-weight:1000;line-height:1.02;text-align:center;overflow-wrap:anywhere}",
      ".tb-vietate{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}.tb-vietata{border-radius:12px;background:#fff0f0;color:#a61e4d;text-align:center;font-size:clamp(15px,4.6vw,21px);font-weight:900;padding:8px 5px}",
      ".tb-nascondi{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px}.tb-indovina{font-size:clamp(34px,11vw,62px);font-weight:1000;line-height:1.05}.tb-sub{font-size:clamp(15px,4.5vw,19px);font-weight:750;opacity:.82}",
      ".tb-tasti{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tb-btn{min-height:72px;padding:10px 8px;border:0;border-radius:18px;background:#51cf66;color:#10200f;font:inherit;font-size:clamp(17px,5vw,23px);font-weight:1000;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 6px 0 #0003}.tb-btn:active{transform:translateY(2px)}.tb-btn:disabled{opacity:.45;box-shadow:none}.tb-btn.pass{background:#ffd43b;color:#332500}.tb-btn.buzz{grid-column:1/-1;background:#fa5252;color:#fff;min-height:92px;font-size:clamp(27px,8vw,38px)}.tb-btn.esci{background:rgba(255,255,255,.14);color:#fff;min-height:50px;font-size:16px;box-shadow:none}",
      ".tb-esito{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:8px}.tb-liste{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:1;min-height:0}.tb-lista{min-height:0;overflow:hidden;border-radius:14px;background:rgba(255,255,255,.1);padding:9px}.tb-lista h3{margin:0 0 5px;font-size:clamp(14px,4vw,18px)}.tb-voci{font-size:clamp(11px,3.2vw,15px);line-height:1.25;overflow-wrap:anywhere}.tb-fine{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;flex:1}.tb-fine h1{font-size:clamp(30px,9vw,48px);margin:0}.tb-fine p{font-size:clamp(20px,6vw,30px);margin:0;font-weight:900}",
      ".tb-squad-lista{display:flex;gap:8px;margin:6px 0;flex-wrap:wrap}.tb-scelta{border:0;border-radius:12px;padding:9px 12px;color:white;font:inherit;font-weight:850;background:#383d59}.tb-scelta.a{background:#a61e4d}.tb-scelta.b{background:#364fc7}.tb-casuale{border:0;border-radius:14px;padding:12px 16px;background:#ffd43b;color:#332500;font:inherit;font-size:17px;font-weight:950}",
      "@media(max-height:700px){.tb{gap:7px;padding-top:calc(6px + env(safe-area-inset-top));padding-bottom:calc(6px + env(safe-area-inset-bottom))}.tb-timer{font-size:42px}.tb-btn{min-height:62px}.tb-btn.buzz{min-height:76px}.tb-carta{gap:8px;padding:9px}.tb-vietata{padding:5px}}"
    ].join("");
    document.head.appendChild(s);
  }
  function bottone(t, classe, testo, fn) {
    var b = t.el("button", { class: "tb-btn " + (classe || ""), type: "button", text: testo });
    var giu = false;
    b.addEventListener("pointerdown", function (e) { if (b.disabled) return; giu = true; e.preventDefault(); });
    b.addEventListener("pointerup", function (e) { if (!giu || b.disabled) return; giu = false; e.preventDefault(); try { SG.audioCtx && SG.audioCtx(); } catch (_) {} fn(); });
    b.addEventListener("pointercancel", function () { giu = false; });
    return b;
  }

  // chi entra dal link senza profilo scrive il suo nome (con il profilo si entra da soli)
  function chiediNome(t, codice, poi) {
    var s = t.schermata({ icona: "🤐", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
    var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
    s._contenuto.appendChild(input);
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
      try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
      poi((input.value || "").trim().slice(0, 16) || "Amico");
    } }));
    t.mostra(s);
  }

  function hostPartita(t) {
    var G = { rete: null, myId: null, nome: "", vm: null, carta: null, fase: null, ui: null, uiTurno: -1, riepilogo: null, tic: null, statSalvate: Object.create(null) };
    stile();
    if (t.linkParams && t.linkParams.stanza) {
      if (t.nomeProfilo()) { G.nome = t.nomeProfilo(); return ospite(t, t.linkParams.stanza); }
      return chiediNome(t, t.linkParams.stanza, function (nome) { G.nome = nome; ospite(t, t.linkParams.stanza); });   // senza profilo: si scrive il nome
    }
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {}, durata = [60, 90, 120].indexOf(Number(imp.tempo)) >= 0 ? Number(imp.tempo) : 90;
    var giri = Math.max(1, Math.min(4, Number(imp.giri) || 1));
    var codice = "…", pronta = false, fase = "lobby", rete = null, timer = null, timeoutEsito = null;
    var giocatori = [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host", omino: avatar(t.nomeProfilo() || "Host"), host: true }];
    var squadre = { host: 0 }, punti = [0, 0], carte = mescola((window.SG_TABOO_CARTE || []).slice()), indiceCarta = 0;
    var coda = [], indiceTurno = 0, attivo = null, deadline = 0, passati = 0, riepilogo = null, cartaOra = null;
    var statTurno = null, chiaveCarta = 0, boxSquadre = null, schermo = null, ui = null;
    var partitaId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    var statGiocatori = Object.create(null);

    function statPersona(id) {
      if (!statGiocatori[id]) statGiocatori[id] = { turniSpiegati: 0, carteIndovinate: 0, cartePassate: 0, buzzFatti: 0, buzzSubiti: 0, turniPositivi: 0, comboCarte: 0, comboCarteMax: 0, esitiTurni: [] };
      return statGiocatori[id];
    }
    function salvaStatTaboo(id, v) {
      if (!id || !v || !v.partitaId || G.statSalvate[v.partitaId]) return;
      G.statSalvate[v.partitaId] = true;
      if (t.guarda || (t.linkParams && t.linkParams.prova) || (t.impostazioni && t.impostazioni.prova)) return;
      if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var me = (v.giocatori || []).find(function (p) { return p.id === id; });
      var miei = v.statGiocatori && v.statGiocatori[id];
      if (!me || !miei) return;
      var vincitore = v.punti[0] === v.punti[1] ? -1 : (v.punti[0] > v.punti[1] ? 0 : 1);
      var x = { partite: 1, partiteOnline: 1, turniSpiegati: miei.turniSpiegati, carteIndovinate: miei.carteIndovinate,
        cartePassate: miei.cartePassate, buzzFatti: miei.buzzFatti, buzzSubiti: miei.buzzSubiti, turniPositivi: miei.turniPositivi };
      if (vincitore >= 0 && v.squadre[id] === vincitore) x.vittorie = 1;
      var s0 = SGNube.statGioco ? (SGNube.statGioco("taboo") || {}) : {};
      if (s0.ultimaPartitaTrofei === v.partitaId) return;   // partita già contata (es. pagina ricaricata a fine partita)
      var serie = s0.serieTurniPositiviOra || 0;
      (miei.esitiTurni || []).forEach(function (buono) { serie = buono ? serie + 1 : 0; });
      var incr = []; Object.keys(x).forEach(function (k) { if (x[k]) incr.push([k, x[k]]); });
      SGNube.salvaProgressi(null, "taboo", incr,
        [["comboCarteMax", miei.comboCarteMax || 0], ["serieTurniPositiviMax", serie]],
        [["serieTurniPositiviOra", serie], ["ultimaPartitaTrofei", v.partitaId]]);
    }

    function indice(id) { return giocatori.findIndex(function (p) { return p.id === id; }); }
    function squadra(id) { return squadre[id] === 1 ? 1 : 0; }
    function membri(s) { return giocatori.filter(function (p) { return squadra(p.id) === s; }); }
    function distribuisci() {
      var mesc = mescola(giocatori);
      mesc.forEach(function (p, i) { squadre[p.id] = i % 2; });
      aggiornaLobby();
    }
    function impostaSquadra(id, s) {
      if (fase !== "lobby" || !giocatori.some(function (p) { return p.id === id; })) return;
      if (membri(s).length <= 1) return;
      squadre[id] = 1 - s; aggiornaLobby();
    }
    function nodoSquadre() {
      var box = t.el("div", { class: "tb-squad-box" });
      var random = t.el("button", { class: "tb-casuale", type: "button", text: "🔀 Squadre a caso", onclick: distribuisci });
      box.appendChild(random);
      function lista(s) {
        var r = t.el("div", { class: "tb-squad-lista" });
        r.appendChild(t.el("b", { text: "Squadra " + SQUADRE[s] + ": " }));
        membri(s).forEach(function (p) {
          var b = t.el("button", { class: "tb-scelta " + (s ? "b" : "a"), type: "button", text: p.nome, title: "Sposta nell'altra squadra", onclick: function () { impostaSquadra(p.id, s); } });
          r.appendChild(b);
        });
        box.appendChild(r);
      }
      lista(0); lista(1);
      return box;
    }
    function aggiornaLobby() {
      if (fase !== "lobby") return;
      if (boxSquadre && boxSquadre.parentNode) boxSquadre.parentNode.removeChild(boxSquadre);
      boxSquadre = nodoSquadre();
      var giocatoriLobby = giocatori.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino, host: !!p.host }; });
      rete && rete.invia({ t: "vm", vm: { fase: "lobby", codice: codice, pronta: pronta, giocatori: giocatoriLobby, squadre: squadre, punti: punti } });
      t.lobby({ host: true, codice: codice, pronta: pronta, min: MIN, vuoti: Math.max(0, MIN - giocatori.length), giocatori: giocatoriLobby, extra: [boxSquadre],
        puoComincia: giocatori.length >= MIN && membri(0).length >= 2 && membri(1).length >= 2,
        testoComincia: "Comincia ▶", nota: giocatori.length < MIN ? "Servono almeno 4 persone. Potete arrivare fino a 16." : "Sposta i giocatori a mano o fai le squadre a caso.",
        onComincia: inizia, onEsci: function () { chiudi(); t.esci(); } });
    }
    t.onRegole = function (nuove) {
      if (fase !== "lobby") return;
      t.impostazioni = t.impostazioni || {};
      if ([60, 90, 120].indexOf(Number(nuove.tempo)) >= 0) { durata = Number(nuove.tempo); t.impostazioni.tempo = durata; }
      giri = Math.max(1, Math.min(4, Number(nuove.giri) || 1)); t.impostazioni.giri = giri;
      aggiornaLobby();
    };
    function vm() {
      return { fase: fase, codice: codice, pronta: pronta, partitaId: partitaId, statGiocatori: fase === "fine" ? statGiocatori : null, giocatori: giocatori.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino, host: !!p.host }; }), squadre: squadre,
        punti: punti.slice(), durata: durata, giri: giri, turno: indiceTurno, totale: coda.length, attivo: attivo, team: attivo == null ? null : squadra(attivo), deadline: deadline,
        passati: passati, maxPassi: 3, chiaveCarta: chiaveCarta, riepilogo: riepilogo, vincitore: fase === "fine" ? (punti[0] === punti[1] ? -1 : (punti[0] > punti[1] ? 0 : 1)) : null };
    }
    function inviaStato() { if (rete) rete.invia({ t: "vm", vm: vm() }); }
    function inviaCarta(id) {
      if (fase !== "turno" || !cartaOra || !id) return;
      var p = indice(id); if (p < 0) return;
      if (id === attivo || squadra(id) !== squadra(attivo)) rete.inviaVeloce({ t: "priv", to: id, chiave: chiaveCarta, carta: cartaOra });
    }
    function sincronizza(id) {
      inviaStato();
      if (fase === "turno") inviaCarta(id);
    }
    rete = SGNet.ospita("taboo", {
      onCodice: function (c) { codice = c; aggiornaLobby(); },
      onConnesso: function () { pronta = true; aggiornaLobby(); },
      onAddio: function (id) {
        var ix = indice(id); if (ix < 0) return;
        giocatori.splice(ix, 1); delete squadre[id];
        if (fase === "lobby") { aggiornaLobby(); return; }
        var era = id === attivo;
        coda = coda.slice(0, indiceTurno).concat(coda.slice(indiceTurno).filter(function (x) { return x !== id; }));
        if (!membri(0).length || !membri(1).length || giocatori.length < MIN) return finePartita();
        if (era && fase === "turno") fineTurno(); else inviaStato();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (fase === "lobby" && indice(id) < 0 && giocatori.length < MAX) {
            var nome = String(m.nome || "Amico").trim().slice(0, 16) || "Amico";
            giocatori.push({ id: id, nome: nome, omino: valido(m.omino) }); statPersona(id);
            squadre[id] = membri(0).length <= membri(1).length ? 0 : 1;
            aggiornaLobby();
          } else if (indice(id) >= 0) sincronizza(id);
          else rete.inviaVeloce({ t: "rifiuto", to: id, testo: fase === "lobby" ? "La stanza è piena." : "La partita è già iniziata." });
        } else if (m.t === "indovinata" && fase === "turno" && m.chiave === chiaveCarta && id === attivo) {
          registra("giusta", id);
        } else if (m.t === "passo" && fase === "turno" && m.chiave === chiaveCarta && id === attivo && passati < 3) {
          registra("passata", id);
        } else if (m.t === "buzz" && fase === "turno" && m.chiave === chiaveCarta && indice(id) >= 0 && squadra(id) !== squadra(attivo)) {
          registra("buzz", id);
        } else if (m.t === "esci") { /* la disconnessione volontaria arriva da SGNet.onAddio */ }
      },
      onErrore: function () { senzaRete(t); }
    });
    function inizia() {
      if (fase !== "lobby" || giocatori.length < MIN || membri(0).length < 2 || membri(1).length < 2) return;
      fase = "turno"; punti = [0, 0]; carte = mescola((window.SG_TABOO_CARTE || []).slice()); indiceCarta = 0; indiceTurno = 0;
      coda = [];
      for (var r = 0; r < giri; r++) {
        var gA = membri(0), gB = membri(1), n = giocatori.length;
        for (var k = 0; k < n; k++) { var s = k % 2; coda.push((s ? gB : gA)[Math.floor(k / 2) % (s ? gB.length : gA.length)].id); }
      }
      inviaStato(); prossimoTurno();
    }
    function prossimoTurno() {
      if (indiceTurno >= coda.length || indiceCarta >= carte.length || !membri(0).length || !membri(1).length) return finePartita();
      fase = "turno"; attivo = coda[indiceTurno++]; passati = 0; statTurno = { giuste: [], buzz: [], passate: [] }; riepilogo = null;
      statPersona(attivo).turniSpiegati++; statPersona(attivo).comboCarte = 0;
      cartaOra = carte[indiceCarta++]; chiaveCarta++; deadline = Date.now() + durata * 1000;
      inviaStato(); giocatori.forEach(function (p) { inviaCarta(p.id); });
      mostraPartita(); aggiornaPartita();
      if (timer) clearInterval(timer);
      timer = setInterval(function () { aggiornaPartita(); if (Date.now() >= deadline) fineTurno(); }, 200);
    }
    function registra(tipo, id) {
      if (fase !== "turno" || !statTurno) return;
      id = id || attivo;
      var speaker = statPersona(attivo);
      if (tipo === "giusta") { punti[squadra(attivo)]++; statTurno.giuste.push(cartaOra.p); speaker.carteIndovinate++; speaker.comboCarte++; speaker.comboCarteMax = Math.max(speaker.comboCarteMax, speaker.comboCarte); }
      else if (tipo === "buzz") { punti[squadra(attivo)]--; statTurno.buzz.push(cartaOra.p); speaker.buzzSubiti++; speaker.comboCarte = 0; statPersona(id).buzzFatti++; }
      else { passati++; statTurno.passate.push(cartaOra.p); speaker.cartePassate++; speaker.comboCarte = 0; }
      if (tipo === "passata" && passati > 3) return;
      if (passati >= 3 && tipo === "passata") { prossimaCarta(); return; }
      prossimaCarta();
    }
    function prossimaCarta() {
      if (indiceCarta >= carte.length) { fineTurno(); return; }
      cartaOra = carte[indiceCarta++]; chiaveCarta++; inviaStato(); giocatori.forEach(function (p) { inviaCarta(p.id); }); aggiornaPartita();
    }
    function fineTurno() {
      if (fase !== "turno") return;
      if (timer) { clearInterval(timer); timer = null; }
      var esitoPositivo = statTurno.giuste.length > statTurno.buzz.length, statsTurno = statPersona(attivo);
      if (esitoPositivo) statsTurno.turniPositivi++;
      statsTurno.esitiTurni.push(esitoPositivo);
      fase = "riepilogo"; deadline = 0; riepilogo = { id: attivo, nome: (giocatori[indice(attivo)] || {}).nome || "Giocatore", team: squadra(attivo), giuste: statTurno.giuste.slice(), buzz: statTurno.buzz.slice(), passate: statTurno.passate.slice() };
      inviaStato(); mostraRiepilogo();
      timeoutEsito = setTimeout(function () { timeoutEsito = null; if (fase === "riepilogo") { if (indiceTurno >= coda.length) finePartita(); else prossimoTurno(); } }, 6500);
    }
    function classifica() {
      var vinc = punti[0] === punti[1] ? -1 : (punti[0] > punti[1] ? 0 : 1);
      var arr = [0, 1].map(function (s) { return { nome: "Squadra " + SQUADRE[s] + " · " + punti[s] + (punti[s] === 1 ? " punto" : " punti"), pos: vinc < 0 ? 1 : (s === vinc ? 1 : 2) }; });
      return arr.sort(function (a, b) { return a.pos - b.pos; });
    }
    function classificaGiocatori() {
      var vinc = punti[0] === punti[1] ? -1 : (punti[0] > punti[1] ? 0 : 1), primi = vinc < 0 ? giocatori.length : membri(vinc).length;
      return giocatori.map(function (p) { return { nome: p.nome, pos: (vinc < 0 || squadra(p.id) === vinc) ? 1 : primi + 1 }; })
        .sort(function (a, b) { return a.pos - b.pos; });
    }
    // "Nuova partita": tutti tornano nella saletta con le stesse squadre (la stanza resta la stessa)
    function nuovaPartita() {
      if (timer) { clearInterval(timer); timer = null; }
      if (timeoutEsito) { clearTimeout(timeoutEsito); timeoutEsito = null; }
      fase = "lobby"; partitaId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); statGiocatori = Object.create(null); giocatori.forEach(function (p) { statPersona(p.id); });
      punti = [0, 0]; attivo = null; deadline = 0; riepilogo = null; cartaOra = null; coda = []; indiceTurno = 0; ui = null;
      aggiornaLobby();
    }
    function finePartita() {
      if (fase === "fine") return;
      if (timer) { clearInterval(timer); timer = null; }
      if (timeoutEsito) { clearTimeout(timeoutEsito); timeoutEsito = null; }
      fase = "fine"; attivo = null; deadline = 0; salvaStatTaboo("host", vm()); inviaStato();
      if (t.risultato) t.risultato(classificaGiocatori());
      mostraFine(true);
    }
    function chiudi() { if (timer) clearInterval(timer); if (timeoutEsito) clearTimeout(timeoutEsito); if (rete) rete.chiudi(); }

    function frame(elContenuto) {
      stile(); schermo = t.schermata({}); schermo.classList.add("tb-piena");
      ui = { timer: t.el("div", { class: "tb-timer" }), punti: t.el("div", { class: "tb-punti" }), turno: t.el("div", { class: "tb-turno" }), corpo: t.el("div", { class: "tb-carta" }), tasti: t.el("div", { class: "tb-tasti" }), key: -1 };
      ui.score = [0, 1].map(function (s) { var box = t.el("div", { class: "tb-squadra " + (s ? "b" : "a") }); box.appendChild(t.el("span", { text: "Squadra " + SQUADRE[s] })); var n = t.el("b", { text: "0" }); box.appendChild(n); ui.punti.appendChild(box); return n; });
      var rad = t.el("div", { class: "tb" }, [t.el("div", { class: "tb-top" }, [ui.punti]), ui.timer, ui.turno, ui.corpo, ui.tasti]);
      schermo._contenuto.appendChild(rad); t.mostra(schermo);
    }
    function mostraPartita() { frame(); }
    function aggiornaPartita() {
      if (!ui || fase !== "turno") return;
      [0, 1].forEach(function (s) { ui.score[s].textContent = String(punti[s]); });
      ui.timer.textContent = String(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      var pMe = "host", sMe = squadra(pMe), idAttivo = attivo, isSpeaker = pMe === idAttivo;
      ui.turno.textContent = "Turno " + indiceTurno + " di " + coda.length + " · " + (giocatori[indice(idAttivo)] || {}).nome + " spiega";
      if (ui.key === chiaveCarta) return;
      ui.key = chiaveCarta;
      ui.corpo.innerHTML = ""; ui.tasti.innerHTML = "";
      if (isSpeaker) {
        ui.corpo.appendChild(t.el("div", { class: "tb-parola", text: cartaOra.p }));
        ui.corpo.appendChild(t.el("div", { class: "tb-vietate" }, cartaOra.v.map(function (v) { return t.el("div", { class: "tb-vietata", text: v }); })));
        ui.tasti.appendChild(bottone(t, "", "✅ Indovinata", function () { registra("giusta"); }));
        ui.tasti.appendChild(bottone(t, "pass", "⏭️ Passo " + passati + "/3", function () { if (passati < 3) registra("passata"); }));
        ui.tasti.lastChild.disabled = passati >= 3;
      } else if (sMe !== squadra(idAttivo)) {
        ui.corpo.appendChild(t.el("div", { class: "tb-parola", text: cartaOra.p }));
        ui.corpo.appendChild(t.el("div", { class: "tb-vietate" }, cartaOra.v.map(function (v) { return t.el("div", { class: "tb-vietata", text: v }); })));
        ui.tasti.appendChild(bottone(t, "buzz", "❌ BUZZ", function () { registra("buzz", "host"); }));
      } else {
        ui.corpo.className = "tb-nascondi";
        ui.corpo.appendChild(t.el("div", { class: "tb-indovina", text: "Indovina!" }));
        ui.corpo.appendChild(t.el("div", { class: "tb-sub", text: "Ascolta chi spiega" }));
      }
      var esci = bottone(t, "esci", "Esci", function () { if (window.confirm("Chiudere la partita per tutti?")) { chiudi(); t.esci(); } }); esci.style.gridColumn = "1/-1"; ui.tasti.appendChild(esci);
    }
    function mostraRiepilogo() {
      if (!ui) frame();
      ui.timer.textContent = "Turno finito"; ui.turno.textContent = ""; ui.punti.textContent = ""; ui.corpo.className = "tb-esito"; ui.corpo.innerHTML = ""; ui.tasti.innerHTML = "";
      ui.punti.appendChild(t.el("div", { class: "tb-squadra a" }, [t.el("span", { text: "Squadra A" }), t.el("b", { text: String(punti[0]) })]));
      ui.punti.appendChild(t.el("div", { class: "tb-squadra b" }, [t.el("span", { text: "Squadra B" }), t.el("b", { text: String(punti[1]) })]));
      var voci = t.el("div", { class: "tb-liste" });
      [["✅ Indovinate", riepilogo.giuste], ["❌ Buzz", riepilogo.buzz], ["⏭️ Passate", riepilogo.passate]].forEach(function (x) {
        var b = t.el("div", { class: "tb-lista" }, [t.el("h3", { text: x[0] }), t.el("div", { class: "tb-voci", text: x[1].length ? x[1].join(" · ") : "—" })]); voci.appendChild(b);
      });
      ui.corpo.appendChild(t.el("div", { class: "tb-turno", text: riepilogo.nome + " — Squadra " + SQUADRE[riepilogo.team] })); ui.corpo.appendChild(voci);
      ui.tasti.appendChild(t.el("div", { class: "tb-sub", style: "grid-column:1/-1;text-align:center", text: "Il turno successivo parte tra pochi secondi…" }));
    }
    function mostraFine(sonoHost) {
      if (!ui) frame();
      var ord = classifica(), win = punti[0] === punti[1] ? -1 : (punti[0] > punti[1] ? 0 : 1);
      ui.punti.textContent = ""; ui.timer.textContent = "Partita finita"; ui.turno.textContent = ""; ui.corpo.className = "tb-fine"; ui.corpo.innerHTML = ""; ui.tasti.innerHTML = "";
      ui.corpo.appendChild(t.el("h1", { text: win < 0 ? "Pareggio! 🤝" : "Squadra " + SQUADRE[win] + " vince! 🏆" }));
      [0, 1].forEach(function (s) { ui.corpo.appendChild(t.el("p", { text: "Squadra " + SQUADRE[s] + " · " + punti[s] + (punti[s] === 1 ? " punto" : " punti") })); });
      var esci = bottone(t, "esci", "Esci", function () { chiudi(); t.esci(); }); esci.style.gridColumn = "1/-1"; ui.tasti.appendChild(esci);
      if (sonoHost) { var nuovo = bottone(t, "", "🔁 Nuova partita (stessi amici)", nuovaPartita); nuovo.style.gridColumn = "1/-1"; ui.tasti.appendChild(nuovo); }
    }

    function visualizzaVm(v) {
      if (G.vm && G.vm.chiaveCarta !== v.chiaveCarta) { G.carta = null; G.uiKey = -1; if (G.ui) G.ui.key = -1; }
      G.vm = v;
      if (v.fase === "lobby") return lobbyOspite(v);
      if (v.fase === "turno") {
        if (!G.ui || G.uiTurno !== v.turno || G.fase !== "turno") { G.fase = "turno"; G.uiTurno = v.turno; G.uiKey = -1; creaSchermoOspite(); avviaTic(); }
        aggiornaOspite();
      } else if (v.fase === "riepilogo") { stopTic(); G.fase = v.fase; G.riepilogo = v.riepilogo; creaSchermoOspite(); mostraRiepilogoOspite(); }
      else if (v.fase === "fine") { stopTic(); salvaStatTaboo(G.myId, v); G.fase = v.fase; creaSchermoOspite(); mostraFineOspite(); }
    }
    function ospite(t, codice) {
      if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
      avviaTic();
      G.rete = SGNet.entra(codice, {
        onAperto: function (id) { G.myId = id; G.rete.invia({ t: "join", nome: G.nome, omino: t.mioOmino(G.nome) }); attesaOspite(t, codice); },
        onMsg: function (m) {
          if (m.t === "vm") visualizzaVm(m.vm);
          else if (m.t === "priv" && m.to === G.myId && G.vm && m.chiave === G.vm.chiaveCarta) { G.carta = m.carta; if (G.ui) G.ui.key = -1; if (G.fase === "turno") aggiornaOspite(); }
          else if (m.t === "rifiuto" && m.to === G.myId) { stopTic(); if (G.rete) G.rete.chiudi(); avvisoOspite(t, m.testo || "Non puoi entrare in questa partita."); }
        },
        onChiuso: function () { stopTic(); G.fase = "fine"; avvisoOspite(t, "La stanza è stata chiusa dall'host."); },
        onErrore: function () { stopTic(); G.fase = "fine"; avvisoOspite(t, "Problema di collegamento. Riprova più tardi."); }
      });
    }
    function stopTic() { if (G.tic) { clearInterval(G.tic); G.tic = null; } }
    function avviaTic() { if (!G.tic) G.tic = setInterval(function () { if (G.fase === "turno") aggiornaOspite(); }, 200); }
    function attesaOspite(t, codice) {
      if (G.ui) return;
      stile(); var s = t.schermata({}); s.classList.add("tb-piena"); s._contenuto.appendChild(t.el("div", { class: "tb", style: "justify-content:center;text-align:center" }, [t.el("div", { class: "tb-indovina", text: "Ti stai unendo…" }), t.el("div", { class: "tb-sub", text: "Stanza " + codice.toUpperCase() })])); t.mostra(s);
    }
    function avvisoOspite(t, testo) {
      var s = t.schermata({}); s.classList.add("tb-piena"); s._contenuto.appendChild(t.el("div", { class: "tb", style: "justify-content:center;text-align:center" }, [t.el("div", { class: "tb-indovina", text: testo }), t.el("button", { class: "tb-btn esci", text: "Esci", onclick: function () { if (G.rete) G.rete.chiudi(); t.esci(); } })])); t.mostra(s);
    }
    function lobbyOspite(v) {
      var gio = (v.giocatori || []).map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino, host: !!p.host, tu: p.id === G.myId }; });
      t.lobby({ host: false, codice: v.codice, pronta: v.pronta, min: MIN, vuoti: Math.max(0, MIN - gio.length), giocatori: gio, attesa: "Aspetta che l'host divida le squadre e dia il via!", onEsci: function () { stopTic(); G.rete.chiudi(); t.esci(); } });
    }
    function creaSchermoOspite() {
      stile(); var s = t.schermata({}); s.classList.add("tb-piena");
      G.ui = { timer: t.el("div", { class: "tb-timer" }), punti: t.el("div", { class: "tb-punti" }), turno: t.el("div", { class: "tb-turno" }), corpo: t.el("div", { class: "tb-carta" }), tasti: t.el("div", { class: "tb-tasti" }), score: [], key: -1 };
      G.ui.score = [0, 1].map(function (team) { var box = t.el("div", { class: "tb-squadra " + (team ? "b" : "a") }); box.appendChild(t.el("span", { text: "Squadra " + SQUADRE[team] })); var n = t.el("b", { text: "0" }); box.appendChild(n); G.ui.punti.appendChild(box); return n; });
      s._contenuto.appendChild(t.el("div", { class: "tb" }, [t.el("div", { class: "tb-top" }, [G.ui.punti]), G.ui.timer, G.ui.turno, G.ui.corpo, G.ui.tasti])); G.ui.s = s; t.mostra(s);
    }
    function azione(tipo) { if (G.rete && G.vm) G.rete.invia({ t: tipo, chiave: G.vm.chiaveCarta }); }
    function aggiornaOspite() {
      var v = G.vm, x = G.ui; if (!v || !x || v.fase !== "turno") return;
      [0, 1].forEach(function (s) { x.score[s].textContent = String(v.punti[s]); });
      x.timer.textContent = String(Math.max(0, Math.ceil((v.deadline - Date.now()) / 1000)));
      var speaker = (v.giocatori || []).find(function (p) { return p.id === v.attivo; }), isSpeaker = G.myId === v.attivo;
      x.turno.textContent = "Turno " + v.turno + " di " + v.totale + " · " + ((speaker && speaker.nome) || "");
      if (x.key === v.chiaveCarta) return;
      x.key = v.chiaveCarta;
      x.corpo.innerHTML = ""; x.corpo.className = "tb-carta"; x.tasti.innerHTML = "";
      var sMe = v.squadre[G.myId] === 1 ? 1 : 0, mioTeam = v.team;
      if (isSpeaker || sMe !== mioTeam) {
        if (!G.carta || G.carta.p == null) { x.corpo.appendChild(t.el("div", { class: "tb-indovina", text: "" })); }
        else { x.corpo.appendChild(t.el("div", { class: "tb-parola", text: G.carta.p })); x.corpo.appendChild(t.el("div", { class: "tb-vietate" }, G.carta.v.map(function (w) { return t.el("div", { class: "tb-vietata", text: w }); }))); }
        if (isSpeaker) {
          x.tasti.appendChild(bottone(t, "", "✅ Indovinata", function () { azione("indovinata"); }));
          var pass = bottone(t, "pass", "⏭️ Passo " + v.passati + "/3", function () { azione("passo"); }); pass.disabled = v.passati >= 3; x.tasti.appendChild(pass);
        } else x.tasti.appendChild(bottone(t, "buzz", "❌ BUZZ", function () { azione("buzz"); }));
      } else {
        x.corpo.className = "tb-nascondi"; x.corpo.appendChild(t.el("div", { class: "tb-indovina", text: "Indovina!" }));
      }
      var esci = bottone(t, "esci", "Esci", function () { if (window.confirm("Uscire dalla partita?")) { stopTic(); G.rete.chiudi(); t.esci(); } }); esci.style.gridColumn = "1/-1"; x.tasti.appendChild(esci);
    }
    function mostraRiepilogoOspite() {
      var x = G.ui; if (!x) return; var r = G.riepilogo; x.timer.textContent = "Turno finito"; x.turno.textContent = ""; x.punti.innerHTML = ""; x.corpo.className = "tb-esito"; x.corpo.innerHTML = ""; x.tasti.innerHTML = "";
      [0, 1].forEach(function (s) { x.punti.appendChild(t.el("div", { class: "tb-squadra " + (s ? "b" : "a") }, [t.el("span", { text: "Squadra " + SQUADRE[s] }), t.el("b", { text: String(G.vm.punti[s]) })])); });
      x.corpo.appendChild(t.el("div", { class: "tb-turno", text: r.nome + " — Squadra " + SQUADRE[r.team] }));
      var voci = t.el("div", { class: "tb-liste" });
      [["✅ Indovinate", r.giuste], ["❌ Buzz", r.buzz], ["⏭️ Passate", r.passate]].forEach(function (a) { voci.appendChild(t.el("div", { class: "tb-lista" }, [t.el("h3", { text: a[0] }), t.el("div", { class: "tb-voci", text: a[1].length ? a[1].join(" · ") : "—" })])); });
      x.corpo.appendChild(voci); x.tasti.appendChild(t.el("div", { class: "tb-sub", style: "grid-column:1/-1;text-align:center", text: "Il turno successivo parte tra pochi secondi…" }));
    }
    function mostraFineOspite() {
      var x = G.ui, v = G.vm; if (!x) return; x.punti.innerHTML = ""; x.timer.textContent = "Partita finita"; x.turno.textContent = ""; x.corpo.className = "tb-fine"; x.corpo.innerHTML = ""; x.tasti.innerHTML = "";
      var win = v.punti[0] === v.punti[1] ? -1 : (v.punti[0] > v.punti[1] ? 0 : 1);
      x.corpo.appendChild(t.el("h1", { text: win < 0 ? "Pareggio! 🤝" : "Squadra " + SQUADRE[win] + " vince! 🏆" }));
      [0, 1].forEach(function (s) { x.corpo.appendChild(t.el("p", { text: "Squadra " + SQUADRE[s] + " · " + v.punti[s] + (v.punti[s] === 1 ? " punto" : " punti") })); });
      var esci = bottone(t, "esci", "Esci", function () { stopTic(); G.rete.chiudi(); t.esci(); }); esci.style.gridColumn = "1/-1"; x.tasti.appendChild(esci);
    }
    function senzaRete(tavolo) {
      var s = tavolo.schermata({ titolo: "" }); s._contenuto.appendChild(tavolo.el("p", { class: "modulo-nota", text: "Taboo si gioca online quando il sito è aperto dal web." }));
      s._piede.appendChild(tavolo.el("button", { class: "btn btn-primario", text: "Esci", onclick: tavolo.esci })); tavolo.mostra(s);
    }

  }

  function impostazioni(box, dove, aiuti) {
    dove.tempo = Number(dove.tempo) || 90; dove.giri = Number(dove.giri) || 1;
    var el = aiuti.el;
    function gruppo(label, valori, prop, titoli) {
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: label }));
      var row = el("div", { style: "display:flex;gap:8px" });
      valori.forEach(function (v, i) {
        var b = el("button", { class: "modo-chip" + (Number(dove[prop]) === v ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove[prop] = v; [].forEach.call(row.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
        } }, [el("div", { class: "mt", text: titoli[i] })]); row.appendChild(b);
      }); box.appendChild(row);
    }
    gruppo("Tempo del turno", [60, 90, 120], "tempo", ["60 s", "90 s", "120 s"]);
    gruppo("Quanti giri", [1, 2, 3, 4], "giri", ["1", "2", "3", "4"]);
  }

  SG.registra({
    id: "taboo", nome: "Taboo", icona: "🤐",
    descrizione: "Spiega la parola senza dire quelle vietate. Si gioca tutti nella stessa stanza, ognuno col proprio telefono.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1, modi: [], soloOnline: true,
    regole: [
      "Fate due squadre. A turno, una persona spiega la parola alla propria squadra senza pronunciare le cinque parole vietate.",
      "Chi spiega vede la carta; la squadra avversaria la vede e può premere <b>BUZZ</b>. I compagni vedono solo il tempo, i punti e «Indovina!».",
      "Ogni parola indovinata vale <b>+1</b>. Ogni BUZZ toglie <b>1 punto</b>. Si possono saltare al massimo <b>3 carte per turno</b>, senza perdere punti.",
      "L'host sceglie il tempo e quanti giri fare. Vince la squadra con più punti."
    ],
    impostazioni: impostazioni,
    avvia: hostPartita
  });
})();
