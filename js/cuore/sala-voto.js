/* =========================================================
   PEZZO DEL CUORE — 🗳️ SCEGLIAMO INSIEME (Passo 6, p6-e)
   Nella Sala l'host propone 3 giochi, tutti votano 20 s, poi la ruota (che pesa i voti) gira
   uguale su tutti i telefoni e il gioco parte per tutti: il voto dell'host, quello degli amici,
   la ripresa del voto e il vice che subentra a voto aperto. Il disegno della scheda e della
   ruota sta in js/scegliamo.js (SGScegliamo). Messaggi e campi: vedi AGENTS.md, Passo 6.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var giochi = cuore.giochi, giocoOnline = cuore.giocoOnline, el = cuore.el, chiediConferma = cuore.chiediConferma, mischia = cuore.mischia,
      schermata = cuore.schermata, mostra = cuore.mostra, schermataHome = cuore.schermataHome, minDi = cuore.minDi, giocoDa = cuore.giocoDa;

  // ---------- "🗳️ SCEGLIAMO INSIEME" (Passo 6, p6-e): l'host propone 3 giochi, tutti votano 20 s, la ruota decide ----------
  // sala.insieme = l'interruttore del ⚙️ (ricordato sul telefono dell'host in sg-insieme); sala.giochiFatti = i giochi di
  // stasera (l'ultimo in fondo); sala.voto = { n, giochi: [id], voti: { idMembro: idGioco }, fase: "voto" | "ruota",
  //   scade (ora dell'host), ruota: { spicchi: [{ g, n }], vince, theta, parte (ora dell'host in cui gira) } }.
  // Nella foto della Sala il voto ha anche ora (Date.now dell'host all'invio): chi la legge stima lo scarto (G8).
  // Il disegno (scheda del voto e ruota) è di js/scegliamo.js; qui la rete e la Sala
  var VOTO_SECONDI = 20, VOTO_UI = null;   // VOTO_UI: la scheda del voto sullo schermo { S (sala o salaG), n, s, sc }
  function insiemeSalvato() { try { return localStorage.getItem("sg-insieme") === "1"; } catch (e) { return false; } }
  function segnaFatto(gid) {
    if (!cuore.sala || !gid) return;
    var f = (cuore.sala.giochiFatti || []).filter(function (x) { return x !== gid; }); f.push(gid);
    cuore.sala.giochiFatti = f.slice(-30);
  }
  // si può proporre: interruttore acceso, almeno in due, niente torneo a eliminazione né "Chi vince resta"
  function votoPossibile() { return !!(cuore.sala && cuore.sala.insieme && !cuore.sala.elim && !cuore.sala.resta && cuore.sala.membri.length >= 2 && window.SGScegliamo); }
  // i 3 giochi proposti: adatti a quanti siamo, non quello appena giocato, prima quelli non ancora fatti stasera,
  // un po' a caso, al massimo uno a due
  function proponiTre() {
    var n = cuore.sala ? cuore.sala.membri.length : 1, fatti = (cuore.sala && cuore.sala.giochiFatti) || [], ultimo = fatti[fatti.length - 1];
    var tutti = giochi.filter(giocoOnline);
    var adatti = tutti.filter(function (g) { return cuore.aDue(g) ? n >= 2 : minDi(g, "online") <= n; });
    if (adatti.length < 3) adatti = tutti;
    var ordine = mischia(adatti.filter(function (g) { return g.id !== ultimo && fatti.indexOf(g.id) < 0; }))
      .concat(mischia(adatti.filter(function (g) { return g.id !== ultimo && fatti.indexOf(g.id) >= 0; })), adatti.filter(function (g) { return g.id === ultimo; }));
    var out = [], due = 0;
    ordine.forEach(function (g) { if (out.length >= 3 || (cuore.aDue(g) && due)) return; if (cuore.aDue(g)) due++; out.push(g.id); });
    ordine.forEach(function (g) { if (out.length < 3 && out.indexOf(g.id) < 0) out.push(g.id); });   // (pochi giochi adatti: anche un secondo a due)
    return out;
  }
  // nel ⚙️ della Sala: l'interruttore "🗳️ Scegliamo insieme"
  function rigaInsieme() {
    var chk = el("input", { type: "checkbox", "aria-label": "Scegliamo insieme" }); chk.checked = !!(cuore.sala && cuore.sala.insieme);
    chk.addEventListener("change", function () {
      if (!cuore.sala) return;
      cuore.sala.insieme = !!chk.checked;
      try { localStorage.setItem("sg-insieme", cuore.sala.insieme ? "1" : "0"); } catch (e) {}
      cuore.sala._bcast();
    });
    return el("div", { class: "sl-viva-opz sl-insieme" }, [
      el("label", { class: "sl-interruttore" }, [ el("span", { text: "🗳️ Scegliamo insieme" }), chk ]),
      el("small", { text: "Proponi 3 giochi, tutti votano, gira la ruota" })
    ]);
  }
  function votoInfo(ids) { return (ids || []).map(function (id) { var g = giocoDa(id); return { id: id, icona: (g && g.icona) || "🎲", nome: (g && g.nome) || String(id) }; }); }
  function votoValido(v) {
    return !!(v && typeof v === "object" && typeof v.n === "number" && Array.isArray(v.giochi) && v.giochi.length >= 2 && v.voti && typeof v.voti === "object"
      && (v.fase === "voto" || (v.fase === "ruota" && v.ruota && Array.isArray(v.ruota.spicchi) && v.ruota.spicchi.length)));
  }
  // il voto per la foto della Sala (con l'ora dell'host)
  function votoFoto(V) { return { n: V.n, giochi: V.giochi, voti: V.voti, fase: V.fase, scade: V.scade, ruota: V.ruota || undefined, ora: Date.now() }; }
  // (Passo 3) la Sala passa al vice: il voto continua con gli id rimappati (il suo id di prima → "host"; chi la teneva se n'è andato)
  function votoEredita(v, vecchio) {
    if (!votoValido(v)) return null;
    var voti = {};
    Object.keys(v.voti).forEach(function (id) { if (id === "host") return; voti[id === vecchio ? "host" : id] = v.voti[id]; });
    return { n: v.n, giochi: v.giochi.slice(0, 3), voti: voti, fase: v.fase, ruota: v.ruota || null };
  }
  // chi può votare adesso: i membri collegati (non chi è sparito un attimo, non chi deve ancora tornare)
  function votoVotanti() {
    if (!cuore.sala) return [];
    var forse = (cuore.sala.rete && cuore.sala.rete._sv && cuore.sala.rete._sv.forse) || {};
    return cuore.sala.membri.filter(function (m) { return m && m.id && !forse[m.id] && !(cuore.sala.attesi && cuore.sala.attesi[m.id]); });
  }
  // l'estrazione: ogni gioco ha voti + 1 spicchi, ogni spicchio vale uguale. { spicchi: [{ g, n }], vince (indice), theta, g }
  function votoEstrai(ids, voti, caso) {
    caso = caso || Math.random;
    var conti = SGScegliamo.conta(ids, voti || {}), lista = SGScegliamo.spicchi(votoInfo(ids), conti);
    var vince = Math.min(lista.length - 1, Math.floor(caso() * lista.length));
    return { spicchi: conti, vince: vince, theta: 0.15 + caso() * 0.7, g: lista[vince] ? lista[vince].g : ids[0] };
  }
  // si apre il voto (host): tutti vedono la scheda. eredita = il voto che continua (subentro del vice)
  function salaVotoApri(ids, eredita) {
    if (!cuore.sala || !window.SGScegliamo) return;
    ids = (ids || []).filter(function (id, i, a) { return giocoDa(id) && a.indexOf(id) === i; }).slice(0, 3);
    if (ids.length < 2) return cuore.salaScegliGioco({ scelgoIo: true });
    if (cuore.sala.resta) cuore.restaFerma(true);
    // (un gioco degli amici ancora aperto, con l'host già nella Sala: finisce, come quando si sceglie un altro gioco)
    if (cuore.sala.gioco && !cuore.sala.inGioco) { cuore.sala.gioco = null; cuore.sala.stanza = null; cuore.sala.fase = null; cuore.sala.fuori = {}; cuore.sala.ctx = null; cuore.sala.duello = null; cuore.sala.scelti = null; SGNet.chiudiGiochi(1500); }
    clearTimeout(cuore.sala.tVoto);
    var V = cuore.sala.voto = eredita ? { n: eredita.n, giochi: ids, voti: eredita.voti || {}, fase: "voto", scade: eredita.scade }
      : { n: (cuore.sala.votoN || 0) + 1, giochi: ids, voti: {}, fase: "voto", scade: Date.now() + VOTO_SECONDI * 1000 };
    cuore.sala.votoN = Math.max(cuore.sala.votoN || 0, V.n);
    var S0 = cuore.sala;
    S0.votoTutti = false;
    S0.tVoto = setTimeout(function () { if (cuore.sala === S0) salaVotoChiudi(V.n); }, Math.max(0, V.scade - Date.now()));
    S0.votoUltimo = Date.now(); S0._bcast();
    schermataVotoGiochi(S0, V, true);
    votoTimer();   // (ereditato: forse hanno già votato tutti)
  }
  // un voto (anche il mio): uno per membro, si può cambiare
  function salaVotoSegna(id, n, g) {
    var V = cuore.sala && cuore.sala.voto;
    if (!V || V.fase !== "voto" || +n !== V.n || V.giochi.indexOf(g) < 0) return;
    if (id !== "host" && !cuore.membroSala(id)) return;
    if (V.voti[id] === g) return;
    V.voti[id] = g;
    votoAggiornaUI(); votoInvia(); votoTimer();
  }
  // la foto della Sala col voto: al massimo una ogni 300 ms (tanti tocchi insieme vanno in una)
  function votoInvia() {
    var S0 = cuore.sala; if (!S0) return;
    var d = 300 - (Date.now() - (S0.votoUltimo || 0));
    if (d <= 0) { clearTimeout(S0.tVotoB); S0.tVotoB = null; S0.votoUltimo = Date.now(); return S0._bcast(); }
    if (!S0.tVotoB) S0.tVotoB = setTimeout(function () { S0.tVotoB = null; if (cuore.sala !== S0) return; S0.votoUltimo = Date.now(); S0._bcast(); }, d);
  }
  // quando si chiude: hanno votato tutti quelli collegati (dopo un attimo, così si vede l'ultimo voto), se no allo scadere
  function votoTimer() {
    var S0 = cuore.sala, V = S0 && S0.voto; if (!V || V.fase !== "voto") return;
    var vv = votoVotanti(), tutti = vv.length > 0 && vv.every(function (m) { return !!V.voti[m.id]; });
    if (tutti === !!S0.votoTutti) return;
    S0.votoTutti = tutti; clearTimeout(S0.tVoto);
    var n = V.n, quando = tutti ? Math.min(V.scade, Date.now() + 700) : V.scade;
    S0.tVoto = setTimeout(function () { if (cuore.sala === S0) salaVotoChiudi(n); }, Math.max(0, quando - Date.now()));
  }
  // "‹" dalla scheda del voto (host): il voto si annulla, tutti nella Sala
  function salaVotoAnnulla() {
    var V = cuore.sala && cuore.sala.voto;
    if (V && V.fase !== "voto") return;   // (la ruota gira già: si aspetta lei)
    if (cuore.sala) { clearTimeout(cuore.sala.tVoto); clearTimeout(cuore.sala.tVotoB); cuore.sala.tVotoB = null; cuore.sala.voto = null; cuore.sala.sceglie = false; cuore.sala._bcast(); }
    VOTO_UI = null;
    cuore.disegnaSalaHost();
  }
  // il voto si chiude: la ruota (spicchio e theta li decide l'host, uguali su tutti i telefoni)
  function salaVotoChiudi(n) {
    var V = cuore.sala && cuore.sala.voto;
    if (!V || V.fase !== "voto" || (n != null && n !== V.n)) return;
    clearTimeout(cuore.sala.tVoto); clearTimeout(cuore.sala.tVotoB); cuore.sala.tVotoB = null;
    var ci = {}; cuore.sala.membri.forEach(function (m) { ci[m.id] = 1; });
    Object.keys(V.voti).forEach(function (id) { if (!ci[id]) delete V.voti[id]; });   // (chi è uscito ha perso il voto)
    var e = votoEstrai(V.giochi, V.voti);
    V.fase = "ruota"; V.ruota = { spicchi: e.spicchi, vince: e.vince, theta: e.theta, parte: Date.now() + 400 };
    if (VOTO_UI && VOTO_UI.S === cuore.sala) VOTO_UI.sc.chiudi();
    cuore.sala.votoUltimo = Date.now(); cuore.sala._bcast();
    salaVotoRuota();
  }
  function salaVotoRuota() {
    var S0 = cuore.sala, V = S0 && S0.voto; if (!V || V.fase !== "ruota" || !V.ruota) return;
    var R = V.ruota, n = V.n;
    SGScegliamo.ruota({ spicchi: R.spicchi, giochi: votoInfo(V.giochi), vince: R.vince, theta: R.theta, parte: R.parte, scarto: 0,
      poi: function (g) { salaVotoFatto(S0, n, g); } });
  }
  // la ruota si è fermata: il gioco parte per tutti (con "Chi gioca?" se servono posti, come quando lo tocca l'host)
  function salaVotoFatto(S0, n, gid) {
    if (cuore.sala !== S0 || !S0.voto || S0.voto.n !== n) return;
    var g = giocoDa(gid) || giocoDa(S0.voto.giochi[0]);
    S0.voto = null; VOTO_UI = null;
    S0._bcast();
    if (g) cuore.salaPreparaGioco(g); else cuore.disegnaSalaHost();
  }
  // la Sala si riapre col voto di prima: pagina ricaricata (il voto riparte da capo con gli stessi giochi) o subentro del vice
  // (continua coi voti di prima). Se la ruota aveva già deciso si va dritti al gioco uscito
  function salaVotoRiprendi(vp, continua) {
    if (!cuore.sala || !votoValido(vp) || !window.SGScegliamo) return false;
    cuore.sala.votoN = Math.max(cuore.sala.votoN || 0, vp.n);
    if (vp.fase === "ruota") {
      var x = SGScegliamo.spicchi(votoInfo(vp.giochi), vp.ruota.spicchi)[vp.ruota.vince | 0], g = x && giocoDa(x.g);
      cuore.sala.voto = null; cuore.sala._bcast();
      if (g) cuore.salaPreparaGioco(g); else cuore.disegnaSalaHost();
      return true;
    }
    salaVotoApri(vp.giochi, continua ? { n: vp.n, voti: vp.voti, scade: Date.now() + 15000 } : null);
    return true;
  }
  // i voti con nome e avatar di chi ha votato (per gli avatar sotto le tessere)
  function votiPersone(S, V) {
    var o = {};
    Object.keys(V.voti || {}).forEach(function (id) {
      var m = (S.membri || []).filter(function (x) { return x && x.id === id; })[0];
      if (m) o[id] = { g: V.voti[id], nome: m.nome, omino: m.omino || null };
    });
    return o;
  }
  // la scheda del voto (host e amici): S = la Sala (sala o salaG), V = il voto
  function schermataVotoGiochi(S, V, host) {
    var mio = host ? "host" : cuore.mioIdSala(S), quanti = (S.membri || []).length;
    var s = schermata({ indietro: host ? salaVotoAnnulla : function () { chiediConferma("Uscire dalla Sala?", null, "🚪 Esci", function () { VOTO_UI = null; cuore.chiudiSalaOspite(); schermataHome(); }); } });
    s.classList.add("sala-voto");
    var mioG = V.voti[mio] || (!host && S.votoMio && S.votoMio.n === V.n ? S.votoMio.g : null);
    var sc = SGScegliamo.scheda({
      giochi: V.giochi.map(function (id) { var g = giocoDa(id), et = g ? cuore.etichettaPosti(g, quanti) : null; return { id: id, icona: (g && g.icona) || "🎲", nome: (g && g.nome) || id, sotto: et ? et.t : "" }; }),
      mio: mioG, voti: votiPersone(S, V), scade: V.scade, scarto: host ? 0 : (S.votoScarto || 0), host: host, membri: host ? votoVotanti().length : quanti,
      onVota: function (g) {
        if (host) return salaVotoSegna("host", V.n, g);
        if (cuore.salaG !== S || !S.rete) return;
        S.votoMio = { n: V.n, g: g };
        try { S.rete.invia({ t: "voto", n: V.n, g: g }); } catch (e) {}
      },
      onChiudi: function () { salaVotoChiudi(V.n); }
    });
    s._contenuto.appendChild(sc.nodo);
    VOTO_UI = { S: S, n: V.n, s: s, sc: sc };
    mostra(s);
  }
  // la scheda sullo schermo cambia solo avatar, conto e tasto (niente lampeggio)
  function votoAggiornaUI() {
    var U = VOTO_UI; if (!U || !document.body.contains(U.s)) return;
    var host = U.S === cuore.sala, V = host ? cuore.sala.voto : U.S.voto;
    if (!V || V.n !== U.n || V.fase !== "voto") return;
    var mio = host ? "host" : cuore.mioIdSala(U.S);
    var ms = V.scade - (Date.now() + (host ? 0 : (U.S.votoScarto || 0)));
    U.sc.aggiorna(votiPersone(U.S, V), V.voti[mio] !== undefined ? V.voti[mio] : undefined, ms, host ? votoVotanti().length : (U.S.membri || []).length);
  }
  // (amico) la foto della Sala col voto aperto o la ruota: la scheda, o la ruota che gira uguale per tutti
  function votoOspite(S, V) {
    // lo scarto tra l'ora dell'host e la mia: il più grande visto da questo host (una foto trattenuta vecchia lo fa più piccolo)
    var k = (S.capo && S.capo._s) || "";
    if (typeof V.ora === "number") { var sc = V.ora - Date.now(); if (S.votoScK !== k || !(sc <= S.votoScarto)) { S.votoScarto = sc; S.votoScK = k; } }
    S.voto = V;
    if (V.fase === "ruota") {
      var R = V.ruota, fineH = R.parte + SGScegliamo.DURATA;
      if (S.votoRuota === V.n) {
        // (già partita: se intanto ho capito meglio l'ora dell'host e gira ancora, la rimetto al punto giusto)
        if (S.veloV && S.veloV.isConnected && Math.abs((S.votoRuotaSc || 0) - S.votoScarto) > 500 && Date.now() + S.votoScarto < fineH) giraOspite(S, V);
        return;
      }
      if (VOTO_UI && VOTO_UI.S === S) VOTO_UI.sc.chiudi();
      else cuore.disegnaSalaOspite();   // (arrivo a ruota già partita: sotto c'è la Sala)
      return giraOspite(S, V);
    }
    if (VOTO_UI && VOTO_UI.S === S && VOTO_UI.n === V.n && document.body.contains(VOTO_UI.s)) return votoAggiornaUI();
    if (S.votoMio && S.votoMio.n !== V.n) S.votoMio = null;
    schermataVotoGiochi(S, V, false);
  }
  function giraOspite(S, V) {
    var R = V.ruota;
    S.votoRuota = V.n; S.votoRuotaSc = S.votoScarto;
    S.veloV = SGScegliamo.ruota({ spicchi: R.spicchi, giochi: votoInfo(V.giochi), vince: R.vince, theta: R.theta, parte: R.parte, scarto: S.votoScarto || 0,
      poi: function () {
        if (cuore.salaG !== S) return;
        S.veloV = null;
        if (VOTO_UI && VOTO_UI.S === S) VOTO_UI = null;
        if (S.inGioco === null && document.querySelector(".sala-voto")) cuore.disegnaSalaOspite();   // (il gioco non è ancora partito: la Sala)
      } });
  }
  // (amico) nella foto non c'è più il voto: via la scheda (la ruota, se gira, finisce da sola)
  function votoVia(S) {
    S.voto = null;
    if (VOTO_UI && VOTO_UI.S === S) { VOTO_UI.sc.chiudi(); VOTO_UI = null; }
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.insiemeSalvato = insiemeSalvato; cuore.proponiTre = proponiTre; cuore.rigaInsieme = rigaInsieme; cuore.salaVotoApri = salaVotoApri;
  cuore.salaVotoRiprendi = salaVotoRiprendi; cuore.salaVotoSegna = salaVotoSegna; cuore.segnaFatto = segnaFatto;
  cuore.votoAggiornaUI = votoAggiornaUI; cuore.votoEredita = votoEredita; cuore.votoEstrai = votoEstrai; cuore.votoFoto = votoFoto;
  cuore.votoOspite = votoOspite; cuore.votoPossibile = votoPossibile; cuore.votoTimer = votoTimer; cuore.votoValido = votoValido;
  cuore.votoVia = votoVia;
  Object.defineProperty(cuore, "VOTO_UI", { get: function () { return VOTO_UI; }, configurable: true });
})();
