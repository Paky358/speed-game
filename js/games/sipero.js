/* =========================================================
   GIOCO — "Sì... però"
   A ogni round uno fa da GIUDICE (a turno: tutti lo stesso numero
   di volte) e gli altri si dividono a sorte in due SQUADRE.
   Le squadre giocano a turno le carte: Bonus sul proprio scenario,
   Malus su quello avversario. Poi l'arringa a voce e il verdetto.
   Fasi: CLASSICA (Paradiso, Schianto, Rinforzo, Ghigliottina) o
   PERSONALIZZATA (le compone chi organizza).
   Un mazzo solo per partita: nessuna carta doppia sul tavolo o
   nelle mani, e le carte tornano solo quando il mazzo è finito.
   Punti personali: chi è nella squadra scelta dal giudice prende +1.
   Modi: stesso telefono (si passa di mano) e online (l'host tiene la
   partita; la mano di carte arriva solo ai telefoni della squadra).
   Carte in data/sipero-carte.js.
   ========================================================= */
(function () {
  "use strict";

  var MAX_MANO = 7, MIN = 3, MAX = 10;
  var CHIAVE_SEQ = "sg-sipero-sequenza";   // l'ultima sequenza personalizzata, sul telefono di chi organizza
  var PARTITE_SALVATE = Object.create(null);
  var CLASSICA = [
    { tipo: "bonus", n: 2, bers: "se" },
    { tipo: "malus", n: 2, bers: "avv" },
    { tipo: "bonus", n: 1, bers: "se" },
    { tipo: "malus", n: 2, bers: "avv" }
  ];
  var MEDAGLIE = ["🥇", "🥈", "🥉"];

  // ---------- piccoli aiuti ----------
  function nuovaSessione() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  function norm(s) { return String(s || "").trim().toLowerCase(); }
  function altra(k) { return k === 0 ? 1 : 0; }
  function medaglia(pos) { return MEDAGLIE[pos - 1] || pos + "°"; }
  function emoSq(k) { return k === 0 ? "🟥" : "🟦"; }
  function nomeSq(k) { return "Squadra " + (k + 1); }
  function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function testoSe(n, txt) { if (n.textContent !== txt) n.textContent = txt; }
  function quante(n, tipo) { return n + (n === 1 ? " carta " : " carte ") + (tipo === "bonus" ? "Bonus" : "Malus"); }
  function descriviFase(f) { return quante(f.n, f.tipo) + " " + (f.bers === "se" ? "su di sé" : "agli avversari"); }
  function statPersona(st, id) {
    if (!st.statGiocatori) st.statGiocatori = Object.create(null);
    if (!st.statGiocatori[id]) st.statGiocatori[id] = { roundGiocati: 0, roundGiudice: 0, roundVinti: 0, carteBonus: 0, carteMalus: 0 };
    return st.statGiocatori[id];
  }
  // classifica con il posto: a pari punti lo stesso posto
  function conPosizioni(lista) {
    var ord = lista.slice().sort(function (a, b) { return b.punti - a.punti; });
    ord.forEach(function (r) { r.pos = 1 + ord.filter(function (q) { return q.punti > r.punti; }).length; });
    return ord;
  }

  // ---------- le fasi ----------
  function seqPulita(s) {
    if (!Array.isArray(s)) return [];
    return s.filter(function (f) { return f && (f.tipo === "bonus" || f.tipo === "malus") && (f.bers === "se" || f.bers === "avv"); })
      .slice(0, 12).map(function (f) { return { tipo: f.tipo, n: Math.max(1, Math.min(3, +f.n || 1)), bers: f.bers }; });
  }
  // la sequenza scelta nelle regole: { seq, vuota } (vuota = Personalizzata senza fasi)
  function seqDa(imp) {
    imp = imp || {};
    if (imp.modalita !== "custom") return { seq: CLASSICA, vuota: false };
    var s = seqPulita(imp.sequenza);
    return s.length ? { seq: s, vuota: false } : { seq: CLASSICA, vuota: true };
  }
  function leggiSeqSalvata() { try { var s = seqPulita(JSON.parse(localStorage.getItem(CHIAVE_SEQ) || "null")); return s.length ? s : null; } catch (e) { return null; } }
  function salvaSeq(s) { try { localStorage.setItem(CHIAVE_SEQ, JSON.stringify(s)); } catch (e) {} }
  // il nome di ogni fase (anche nella Personalizzata)
  function nomeFase(seq, i) {
    var f = seq[i], j;
    if (f.tipo === "bonus" && f.bers === "se") {
      for (j = 0; j < i; j++) if (seq[j].tipo === "bonus" && seq[j].bers === "se") return { ic: "🩹", nome: "Rinforzo" };
      return { ic: "😇", nome: "Paradiso" };
    }
    if (f.tipo === "malus" && f.bers === "avv") {
      var prima = false, dopo = false;
      for (j = 0; j < seq.length; j++) if (j !== i && seq[j].tipo === "malus" && seq[j].bers === "avv") { if (j < i) prima = true; else dopo = true; }
      return (prima && !dopo) ? { ic: "🪓", nome: "Ghigliottina" } : { ic: "💥", nome: "Schianto" };
    }
    if (f.tipo === "bonus") return { ic: "🎁", nome: "Regalo" };
    return { ic: "🤕", nome: "Autogol" };
  }
  function riassuntoSeq(seq) { return seq.map(function (f, i) { var nf = nomeFase(seq, i); return nf.ic + " " + nf.nome; }).join(" → "); }
  // i turni: ogni fase la gioca prima una squadra e poi l'altra (chi apre cambia a ogni round)
  function creaPassi(seq, primo) {
    var p = [];
    seq.forEach(function (f, i) { p.push({ sq: primo, f: f, fi: i }); p.push({ sq: altra(primo), f: f, fi: i }); });
    return p;
  }
  function istruzione(f, sq, voi) {
    var dove = f.bers === "se" ? (voi ? " per il vostro scenario" : " sul proprio scenario") : " per la " + nomeSq(f.bers === "se" ? sq : altra(sq));
    return (voi ? "scegliete " : "") + quante(f.n, f.tipo) + dove;
  }

  // ---------- il mazzo (uno per partita) ----------
  function nuovoMazzo(t, carte) { return { carte: carte.slice(), pila: t.mischia(carte) }; }
  function inUsoDa(mani, scen) {
    var u = Object.create(null);
    (mani || []).forEach(function (m) { m.bonus.concat(m.malus).forEach(function (c) { u[c] = 1; }); });
    (scen || []).forEach(function (s) { s.voci.forEach(function (v) { u[v.testo] = 1; }); });
    return u;
  }
  // pesca dal mazzo; finito il mazzo si rimischiano le carte che non sono in gioco
  function pesca(t, mz, inUso) {
    if (!mz.pila.length) mz.pila = t.mischia(mz.carte.filter(function (c) { return !inUso[c]; }));
    return mz.pila.length ? mz.pila.pop() : null;
  }
  function riempi(t, mano, mz, inUso) {
    while (mano.length < MAX_MANO) { var c = pesca(t, mz, inUso); if (c == null) break; mano.push(c); inUso[c] = 1; }
    return mano;
  }
  function nuoveMani(t, mazzi, scen) {
    var mani = [{ bonus: [], malus: [] }, { bonus: [], malus: [] }];
    var u = inUsoDa(null, scen);
    mani.forEach(function (m) { riempi(t, m.bonus, mazzi.bonus, u); riempi(t, m.malus, mazzi.malus, u); });
    return mani;
  }
  function scenVuoti() { return [{ voci: [] }, { voci: [] }]; }

  // squadre a sorte, bilanciate, cercando di non rimettere sempre insieme le stesse coppie
  function chiaveCoppia(a, b) { return a < b ? a + "|" + b : b + "|" + a; }
  function formaSquadre(t, persone, coppie) {
    var meglio = null, costoMin = Infinity;
    function costo(sq) { var c = 0; for (var i = 0; i < sq.length; i++) for (var j = i + 1; j < sq.length; j++) c += coppie[chiaveCoppia(sq[i], sq[j])] || 0; return c; }
    for (var k = 0; k < 40; k++) {
      var m = t.mischia(persone), h = Math.ceil(m.length / 2), a = m.slice(0, h), b = m.slice(h), c = costo(a) + costo(b);
      if (c < costoMin) { costoMin = c; meglio = [a, b]; }
    }
    meglio.forEach(function (sq) { for (var i = 0; i < sq.length; i++) for (var j = i + 1; j < sq.length; j++) { var kk = chiaveCoppia(sq[i], sq[j]); coppie[kk] = (coppie[kk] || 0) + 1; } });
    return t.mischia(meglio);   // anche chi è "Squadra 1" cambia
  }

  // ---------- trofei ----------
  // d: { online, mioId, mioRuolo, manuale, sessione, classifica:[{id?, nome, punti, pos}], statFine }
  function salvaTrofeiSipero(t, d) {
    try {
      if (!d || !d.sessione || t.guarda || (t.linkParams && (t.linkParams.guarda || t.linkParams.prova)) ||
          (t.impostazioni && t.impostazioni.prova) ||
          !(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var profilo = SGNube.profilo(), nomeP = norm(profilo.nome), cl = d.classifica || [];
      if (!nomeP) return;
      var me = d.online ? cl.filter(function (r) { return r.id === d.mioId; })[0] : cl.filter(function (r) { return norm(r.nome) === nomeP; })[0];
      if (!me || norm(me.nome) !== nomeP) return;
      var profiloId = norm(profilo.uid || profilo.nome);
      var chiave = "sipero|" + d.sessione + "|" + profiloId;
      if (PARTITE_SALVATE[chiave]) return;
      var chiaveLocale = "sg-sipero-ultima-partita-" + profiloId;
      try { if (window.localStorage && localStorage.getItem(chiaveLocale) === String(d.sessione)) { PARTITE_SALVATE[chiave] = 1; return; } } catch (e) {}
      var miei = (d.statFine || {})[d.online ? d.mioId : me.nome] || {};
      var primi = cl.filter(function (r) { return r.pos === 1; }).length;
      var vinta = me.pos === 1 && (d.manuale || primi === 1);   // un round con le squadre scelte: vince tutta la squadra
      var pareggio = !vinta && me.pos === 1 && primi > 1;
      var incr = [["partite", 1], ["roundGiocati", +miei.roundGiocati || 0], ["roundGiudice", +miei.roundGiudice || 0],
        ["roundVinti", +miei.roundVinti || 0], ["carteBonus", +miei.carteBonus || 0], ["carteMalus", +miei.carteMalus || 0]];
      if (d.online) incr.push(["partiteOnline", 1]);
      if (vinta) { incr.push(["vittorie", 1]); if (d.online) incr.push(["vittorieOnline", 1]); }
      if (pareggio) incr.push(["pareggi", 1]);
      var s = SGNube.statGioco ? (SGNube.statGioco("sipero") || {}) : {};
      if (s.ultimaPartitaTrofei === d.sessione) return;
      var giudice = d.manuale && d.mioRuolo === "g";   // da giudice non si può vincere: la serie resta com'era
      var serie = vinta ? (+s.serieVittorieOra || 0) + 1 : giudice ? (+s.serieVittorieOra || 0) : 0;
      PARTITE_SALVATE[chiave] = 1;
      try { if (window.localStorage) localStorage.setItem(chiaveLocale, String(d.sessione)); } catch (e) {}
      SGNube.salvaProgressi(null, "sipero", incr.filter(function (x) { return x[1] > 0; }),
        [["serieVittorieMax", serie]], [["serieVittorieOra", serie], ["ultimaPartitaTrofei", d.sessione]]);
    } catch (e) {}
  }

  // ---------- suoni ----------
  function suono(tipo) {
    var c = null;
    try { c = window.SG && SG.audioCtx && SG.audioCtx(); } catch (e) {}
    if (!c) return;
    try {
      var ora = c.currentTime;
      var nota = function (f, t0, d, onda, vol) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = onda || "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ora + t0);
        g.gain.exponentialRampToValueAtTime(vol || 0.12, ora + t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ora + t0 + d);
        o.connect(g); g.connect(c.destination); o.start(ora + t0); o.stop(ora + t0 + d + 0.05);
      };
      if (tipo === "bonus") { nota(660, 0, 0.14, "triangle"); nota(990, 0.08, 0.2, "triangle"); }
      else if (tipo === "malus") { nota(170, 0, 0.22, "square", 0.07); nota(110, 0.06, 0.3, "sawtooth", 0.06); }
      else if (tipo === "tempo") { nota(880, 0, 0.16, "square", 0.08); nota(880, 0.24, 0.16, "square", 0.08); nota(620, 0.48, 0.4, "square", 0.08); }
      else if (tipo === "martello") { nota(150, 0, 0.12, "square", 0.16); nota(90, 0.02, 0.2, "triangle", 0.2); }
      else if (tipo === "vittoria") { [523, 659, 784, 1047].forEach(function (f, i) { nota(f, i * 0.1, 0.3, "triangle", 0.1); }); }
    } catch (e) {}
  }

  // ---------- lo stile (una volta sola) ----------
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.sp-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden}",
      ".schermata.sp-piena>.testa,.schermata.sp-piena>.piede{display:none}",
      ".schermata.sp-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".sp-scena{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:7px;padding:calc(8px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".sp-barra{flex:0 0 auto;display:flex;align-items:center;gap:8px;min-height:38px}",
      ".sp-esci{flex:0 0 auto;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".sp-fase{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;line-height:1.2}",
      ".sp-fase b{font-size:1.02rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sp-fase small{font-size:.74rem;color:var(--testo-tenue);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sp-giudice{flex:0 1 auto;max-width:44%;padding:5px 10px;border-radius:999px;background:rgba(255,202,58,.16);color:#ffe08a;font-weight:800;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sp-tavolo{flex:0 1 auto;min-height:74px;max-height:36%;display:grid;grid-template-columns:1fr 1fr;gap:6px}",
      ".sp-scena.largo .sp-tavolo{flex:1 1 auto;max-height:none}",
      ".sp-col{min-height:0;min-width:0;display:flex;flex-direction:column;border-radius:12px;padding:6px;background:rgba(255,255,255,.06);border:2px solid transparent;cursor:pointer;transition:border-color .25s,background-color .25s,box-shadow .25s}",
      ".sp-col.c0{--sq:#ff8787}.sp-col.c1{--sq:#74c0fc}",
      ".sp-col.mia{background:rgba(255,255,255,.11)}",
      ".sp-col.turno{border-color:var(--sq)}",
      ".sp-col.vince{border-color:#ffca3a;box-shadow:0 0 18px rgba(255,202,58,.45)}",
      ".sp-col-testa{flex:0 0 auto;font-size:.74rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 2px 4px;color:var(--sq)}",
      ".sp-lista{flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:3px;font-size:.7rem}",
      ".sp-mini{flex:0 0 auto;line-height:1.25;padding:4px 6px;border-radius:7px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;color:#fff}",
      ".sp-mini.b{background:rgba(55,212,126,.24)}.sp-mini.m{background:rgba(255,93,108,.28)}",
      ".sp-scena.largo .sp-mini{display:block;-webkit-line-clamp:unset;padding:3px 5px}",
      ".sp-mini.nuova{animation:spPop .5s cubic-bezier(.2,1.4,.4,1) both}",
      "@keyframes spPop{from{opacity:0;transform:scale(.5) translateY(-8px)}to{opacity:1;transform:none}}",
      ".sp-vuoto{margin:auto 0;text-align:center;font-size:.72rem;color:var(--testo-tenue)}",
      ".sp-turno{flex:0 0 auto;font-size:.86rem;font-weight:700;text-align:center;line-height:1.3}",
      ".sp-turno:empty{display:none}",
      ".sp-azione{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:6px}",
      ".sp-scena.largo .sp-azione{flex:0 0 auto}",
      ".sp-azione:empty{display:none}",
      ".sp-msg{margin:auto 0;text-align:center;color:var(--testo-tenue);font-size:.92rem;line-height:1.4;padding:2px 8px}",
      ".sp-msg .sp-emo{display:block;font-size:2rem;margin-bottom:2px}",
      ".sp-scena.largo .sp-msg{margin:0}.sp-scena.largo .sp-msg .sp-emo{display:inline;font-size:1rem;margin-right:4px}",
      ".sp-mano{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:6px}",
      ".sp-carta{position:relative;min-height:0;min-width:0;overflow:hidden;display:flex;align-items:center;padding:6px 8px;border-radius:12px;color:#fff;line-height:1.22;cursor:pointer;border:2px solid rgba(255,255,255,.12);box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .15s,box-shadow .15s,border-color .15s;touch-action:manipulation}",
      ".sp-carta.b{background:linear-gradient(160deg,#25915a,#156040)}.sp-carta.m{background:linear-gradient(160deg,#b8364a,#7a1f30)}",
      ".sp-carta.su{transform:translateY(-3px) scale(1.03);border-color:#ffca3a;box-shadow:0 8px 18px rgba(0,0,0,.45);z-index:1}",
      ".sp-n{position:absolute;top:3px;right:4px;min-width:18px;height:18px;border-radius:9px;background:#ffca3a;color:#241f00;font-size:.7rem;font-weight:900;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(.4);transition:opacity .15s,transform .15s}",
      ".sp-carta.su .sp-n{opacity:1;transform:none}",
      ".sp-altre{min-height:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:6px;border-radius:12px;border:2px dashed rgba(255,255,255,.28);color:var(--testo-tenue);font-weight:800;font-size:.78rem;cursor:pointer;line-height:1.25}",
      ".sp-piede{flex:0 0 auto;display:flex;gap:8px;align-items:center}",
      ".sp-piede:empty{display:none}",
      ".sp-piede .btn{flex:1 1 0;margin:0;min-width:0;padding-left:8px;padding-right:8px}",
      ".sp-nota{flex:1;text-align:center;font-size:.85rem;color:var(--testo-tenue)}",
      ".btn.sp-vota.c0{background:#e03e4e;color:#fff}.btn.sp-vota.c1{background:#2f80d0;color:#fff}",
      ".sp-timer{display:flex;align-items:center;gap:8px}",
      ".sp-timer-bar{flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden}",
      ".sp-timer-fill{height:100%;background:linear-gradient(90deg,#ffca3a,#ff922b);transform-origin:left center;transition:transform .25s linear}",
      ".sp-timer-n{font-weight:900;font-size:.9rem;min-width:3.4em;text-align:right}",
      ".sp-timer.finito .sp-timer-n{color:#ff8787;animation:spBatti .6s ease 3}",
      "@keyframes spBatti{50%{transform:scale(1.25)}}",
      ".sp-classi{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}",
      ".sp-classi span{padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.1);font-weight:800;font-size:.8rem;white-space:nowrap}",
      ".sp-classi span.primo{background:rgba(255,202,58,.28)}.sp-classi span.tu{box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)}",
      ".sp-verdetto{position:absolute;inset:0;z-index:20;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,10,30,.55);animation:spVIn .3s ease both;overflow:hidden;transition:opacity .5s}",
      ".sp-verdetto.via{opacity:0}",
      "@keyframes spVIn{from{opacity:0}to{opacity:1}}",
      ".sp-martello{font-size:4.5rem;transform-origin:80% 80%;animation:spMartello .7s ease both}",
      "@keyframes spMartello{0%{transform:rotate(-50deg) scale(.6);opacity:0}45%{transform:rotate(15deg) scale(1.1);opacity:1}60%{transform:rotate(-6deg)}100%{transform:none}}",
      ".sp-vtesto{margin:8px 16px 0;padding:10px 18px;border-radius:16px;font-size:1.45rem;font-weight:900;text-align:center;background:var(--sqc);color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.4);animation:spPop .5s .25s cubic-bezier(.2,1.4,.4,1) both}",
      ".sp-verdetto.c0{--sqc:#e03e4e}.sp-verdetto.c1{--sqc:#2f80d0}",
      ".sp-cor{position:absolute;top:-16px;width:8px;height:14px;border-radius:2px;animation:spCade 2.4s linear both}",
      "@keyframes spCade{to{transform:translateY(110vh) rotate(720deg)}}",
      ".sp-lente{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,10,28,.78)}",
      ".sp-lente-box{width:100%;max-width:480px;max-height:86%;overflow-y:auto;background:var(--sfondo,#223066);border-radius:18px;padding:14px;box-shadow:0 14px 40px rgba(0,0,0,.5);animation:spPop .25s ease both}",
      ".sp-lente-tit{font-weight:900;font-size:1.05rem;margin-bottom:10px}",
      ".sp-lente-r{font-size:1.08rem;line-height:1.4;padding:10px 12px;border-radius:12px;margin-bottom:8px}",
      ".sp-lente-r.b{background:rgba(55,212,126,.24)}.sp-lente-r.m{background:rgba(255,93,108,.28)}",
      ".sp-lente-box .btn{width:100%;margin-top:4px}",
      // schermata del round (stesso telefono)
      ".sp-round{display:flex;flex-direction:column;gap:10px}",
      ".sp-giudbox{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:14px;background:rgba(255,202,58,.14);font-weight:800}",
      ".sp-sqbox{padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.06);border-left:4px solid var(--sq)}",
      ".sp-sqbox.c0{--sq:#ff8787}.sp-sqbox.c1{--sq:#74c0fc}",
      ".sp-sqbox b{display:block;color:var(--sq);font-size:.85rem;margin-bottom:5px}",
      ".sp-chi{display:flex;flex-wrap:wrap;gap:6px}",
      ".sp-chi span.sp-pers{display:inline-flex;align-items:center;gap:5px;padding:2px 9px 2px 2px;border-radius:999px;background:rgba(255,255,255,.09);font-weight:700;font-size:.9rem}",
      ".sp-av{width:30px;height:30px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.16);display:inline-block;flex:0 0 auto}",
      ".sp-av svg{width:100%;height:auto;display:block}",
      ".sp-giudbox .sp-av{width:42px;height:42px}",
      ".sp-contro{text-align:center;font-weight:900;color:var(--testo-tenue);font-size:.85rem}",
      ".sp-seqinfo{font-size:.82rem;color:var(--testo-tenue);text-align:center;line-height:1.45}",
      ".sp-avviso{font-size:.85rem;text-align:center;padding:6px 10px;border-radius:10px;background:rgba(255,202,58,.15)}",
      ".sp-centro{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;min-height:60vh}",
      ".sp-centro .sp-grande{font-size:4.2rem}.sp-centro b{font-size:1.35rem}.sp-centro p{margin:0;color:var(--testo-tenue);max-width:22em}",
      // saletta
      ".sp-lobby{display:flex;flex-direction:column;gap:6px}",
      ".sp-info{font-size:.84rem;line-height:1.45;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.06)}",
      ".sp-riga{padding:7px 9px;border-radius:12px;background:rgba(255,255,255,.06)}",
      ".sp-riga-t{display:flex;justify-content:space-between;gap:8px;font-weight:700}",
      ".sp-ruoli{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:6px}",
      ".sp-ruoli button{min-height:38px;border-radius:10px;border:2px solid transparent;background:rgba(255,255,255,.1);color:#fff;font:inherit;font-size:1.05rem;cursor:pointer}",
      ".sp-ruoli button.attiva{border-color:#ffca3a;background:rgba(255,202,58,.2)}"
    ].join("\n");
    document.head.appendChild(st);
    // girando il telefono le carte si rimisurano
    var tm = null;
    window.addEventListener("resize", function () {
      clearTimeout(tm);
      tm = setTimeout(function () {
        [].forEach.call(document.querySelectorAll(".sp-mano"), adattaCarte);
        [].forEach.call(document.querySelectorAll(".sp-scena.largo .sp-lista"), adattaLista);
      }, 200);
    });
  }

  // ---------- pezzi grafici comuni ----------
  // la lente: legge in grande una carta o uno scenario intero
  function lente(t, titolo, voci) {
    if (document.querySelector(".sp-lente")) return;
    stile();
    var el = t.el, aperta = Date.now();
    var box = el("div", { class: "sp-lente-box" });
    box.appendChild(el("div", { class: "sp-lente-tit", text: titolo }));
    if (!voci.length) box.appendChild(el("p", { class: "tenue", text: "Ancora nessuna carta." }));
    voci.forEach(function (v) { box.appendChild(el("div", { class: "sp-lente-r " + (v.tipo === "bonus" ? "b" : "m"), text: (v.tipo === "bonus" ? "✅ " : "❌ ") + v.testo })); });
    function chiudi() { if (Date.now() - aperta < 350) return; if (velo.parentNode) velo.parentNode.removeChild(velo); }
    box.appendChild(el("button", { class: "btn btn-primario", text: "Chiudi", onclick: chiudi }));
    var velo = el("div", { class: "sp-lente", onclick: function (e) { if (e.target === velo) chiudi(); } }, [box]);
    document.body.appendChild(velo);
  }
  function chiudiLente() { var l = document.querySelector(".sp-lente"); if (l && l.parentNode) l.parentNode.removeChild(l); }
  // tocco lungo (per leggere una carta in grande)
  function premiLungo(nodo, fn) {
    var tm = null, x0 = 0, y0 = 0;
    function stop() { if (tm) { clearTimeout(tm); tm = null; } }
    nodo.addEventListener("pointerdown", function (e) {
      x0 = e.clientX; y0 = e.clientY; stop();
      tm = setTimeout(function () { tm = null; nodo._lungo = true; fn(); setTimeout(function () { nodo._lungo = false; }, 700); }, 480);
    });
    nodo.addEventListener("pointermove", function (e) { if (tm && (Math.abs(e.clientX - x0) > 10 || Math.abs(e.clientY - y0) > 10)) stop(); });
    nodo.addEventListener("pointerup", stop); nodo.addEventListener("pointercancel", stop); nodo.addEventListener("pointerleave", stop);
  }

  // lo schermo di gioco: barra, tavolo (i due scenari), turno, azione, piede
  function creaScena(t, onEsci) {
    stile();
    var el = t.el;
    var s = t.schermata({}); s.classList.add("sp-piena");
    var ui = { t: t, s: s, chiave: null, nuova: true };
    ui.fase = el("b"); ui.sotto = el("small"); ui.giudice = el("div", { class: "sp-giudice" });
    ui.barra = el("div", { class: "sp-barra" }, [
      el("button", { class: "sp-esci", "aria-label": "Esci", text: "‹", onclick: onEsci }),
      el("div", { class: "sp-fase" }, [ui.fase, ui.sotto]), ui.giudice]);
    ui.cols = [creaColonna(t, 0), creaColonna(t, 1)];
    ui.tavolo = el("div", { class: "sp-tavolo" }, [ui.cols[0].nodo, ui.cols[1].nodo]);
    ui.turno = el("div", { class: "sp-turno" });
    ui.azione = el("div", { class: "sp-azione" });
    ui.piede = el("div", { class: "sp-piede" });
    ui.scena = el("div", { class: "sp-scena" }, [ui.barra, ui.tavolo, ui.turno, ui.azione, ui.piede]);
    s._contenuto.appendChild(ui.scena);
    t.mostra(s);
    return ui;
  }
  function barra(ui, fase, sotto, giudice) { testoSe(ui.fase, fase); testoSe(ui.sotto, sotto); testoSe(ui.giudice, giudice); }
  function creaColonna(t, k) {
    var el = t.el;
    var c = { k: k, t: t, testa: el("div", { class: "sp-col-testa" }), lista: el("div", { class: "sp-lista" }), voci: [], titolo: "" };
    c.nodo = el("div", { class: "sp-col c" + k, role: "button", onclick: function () { lente(t, c.titolo, c.voci); } }, [c.testa, c.lista]);
    return c;
  }
  // d: { titolo, voci:[{tipo,testo}], turno, mia, vince, anima (false = senza animazione), ritardo (secondi tra una carta e l'altra) }
  // aggiunge solo le carte nuove; ridà quante sono state aggiunte
  function aggiornaColonna(c, d) {
    var el = c.t.el;
    testoSe(c.testa, d.titolo); c.titolo = d.titolo;
    c.nodo.classList.toggle("turno", !!d.turno);
    c.nodo.classList.toggle("mia", !!d.mia);
    c.nodo.classList.toggle("vince", !!d.vince);
    var nuove = d.voci || [], vecchie = c.voci;
    var stesse = vecchie.length <= nuove.length && vecchie.every(function (v, i) { return v.testo === nuove[i].testo && v.tipo === nuove[i].tipo; });
    if (!stesse) { svuota(c.lista); vecchie = []; }
    var vuoto = c.lista.querySelector(".sp-vuoto");
    if (!nuove.length) { if (!vuoto) c.lista.appendChild(el("div", { class: "sp-vuoto", text: "(ancora niente)" })); }
    else if (vuoto) c.lista.removeChild(vuoto);
    var aggiunte = 0;
    for (var i = vecchie.length; i < nuove.length; i++) {
      var v = nuove[i];
      var n = el("div", { class: "sp-mini " + (v.tipo === "bonus" ? "b" : "m") + (d.anima === false ? "" : " nuova"), text: (v.tipo === "bonus" ? "✅ " : "❌ ") + v.testo });
      if (d.ritardo) n.style.animationDelay = ((d.base || 0) + aggiunte * d.ritardo).toFixed(2) + "s";
      c.lista.appendChild(n); aggiunte++;
    }
    c.voci = nuove.slice();
    if (aggiunte && !d.ritardo) c.lista.scrollTop = c.lista.scrollHeight;
    return aggiunte;
  }
  // nel tavolo grande (arringa e verdetto) le scritte si rimpiccioliscono quel che serve per stare tutte
  function adattaLista(lista) {
    if (!lista || !document.body.contains(lista)) return;
    var f = 14;
    lista.style.fontSize = f + "px";
    while (lista.scrollHeight > lista.clientHeight + 1 && f > 9) { f -= 0.5; lista.style.fontSize = f + "px"; }
  }
  function adattaTavolo(ui) { ui.cols.forEach(function (c) { adattaLista(c.lista); }); }
  function largo(ui, si) {
    var era = ui.scena.classList.contains("largo");
    ui.scena.classList.toggle("largo", !!si);
    if (era && !si) ui.cols.forEach(function (c) { c.lista.style.fontSize = ""; });
  }
  // un messaggio al posto delle carte
  function messaggio(ui, emo, testo) {
    var el = ui.t.el;
    ui.azione.appendChild(el("div", { class: "sp-msg" }, [el("span", { class: "sp-emo", text: emo }), document.createTextNode(testo)]));
  }
  function notaPiede(ui, testo) { ui.piede.appendChild(ui.t.el("div", { class: "sp-nota", text: testo })); }

  // la mano di carte in griglia (2 colonne, niente scorrimento).
  // o: { carte, tipo, quante (0 = solo da guardare), altre: { tipo, carte } | null, onCambia(sel) }
  function creaMano(t, o) {
    var el = t.el, sel = [], nodi = [];
    var g = el("div", { class: "sp-mano" });
    var n = o.carte.length + (o.altre ? 1 : 0);
    g.style.gridTemplateRows = "repeat(" + Math.max(1, Math.ceil(n / 2)) + ", minmax(0, 1fr))";
    function segna() {
      nodi.forEach(function (x) { var i = sel.indexOf(x.c); x.b.classList.toggle("su", i >= 0); x.num.textContent = i >= 0 ? String(i + 1) : ""; });
      if (o.onCambia) o.onCambia(sel.slice());
    }
    o.carte.forEach(function (c) {
      var num = el("span", { class: "sp-n" });
      var attr = { class: "sp-carta " + (o.tipo === "bonus" ? "b" : "m") };
      if (o.quante) attr.role = "button";
      var b = el("div", attr, [el("span", { class: "sp-tx", text: c }), num]);
      var titolo = o.tipo === "bonus" ? "🟢 Carta Bonus" : "🔴 Carta Malus";
      premiLungo(b, function () { lente(t, titolo, [{ tipo: o.tipo, testo: c }]); });
      b.addEventListener("click", function () {
        if (b._lungo) return;
        if (!o.quante) return lente(t, titolo, [{ tipo: o.tipo, testo: c }]);
        var i = sel.indexOf(c);
        if (i >= 0) sel.splice(i, 1);
        else { if (sel.length >= o.quante) sel.shift(); sel.push(c); }   // piena: la prima scelta lascia il posto
        segna();
      });
      nodi.push({ c: c, b: b, num: num });
      g.appendChild(b);
    });
    if (o.altre) {
      var tt = o.altre.tipo === "bonus" ? "🟢 Le tue carte Bonus" : "🔴 I tuoi Malus";
      g.appendChild(el("div", { class: "sp-altre", role: "button", text: "👀 " + tt + " (" + o.altre.carte.length + ")",
        onclick: function () { lente(t, tt, o.altre.carte.map(function (c) { return { tipo: o.altre.tipo, testo: c }; })); } }));
    }
    return { nodo: g, sel: function () { return sel.slice(); }, adatta: function () { adattaCarte(g); } };
  }
  // ogni carta col carattere più grande che ci sta
  function adattaCarte(g) {
    if (!g || !document.body.contains(g)) return;
    [].forEach.call(g.querySelectorAll(".sp-carta"), function (b) {
      var tx = b.firstChild, h = b.clientHeight;
      if (!h) return;
      var f = Math.max(10, Math.min(15.5, h / 5));
      tx.style.fontSize = f + "px";
      while (tx.offsetHeight > b.clientHeight - 10 && f > 9.5) { f -= 0.5; tx.style.fontSize = f + "px"; }
    });
  }

  // il conto alla rovescia dell'arringa (facoltativo)
  function mettiTimer(t, dove, sec) {
    var el = t.el, inizio = Date.now(), fine = inizio + sec * 1000;
    var fill = el("div", { class: "sp-timer-fill" }), num = el("span", { class: "sp-timer-n", text: sec + " s" });
    var nodo = el("div", { class: "sp-timer" }, [el("div", { class: "sp-timer-bar" }, [fill]), num]);
    dove.appendChild(nodo);
    var iv = setInterval(function () {
      if (!document.body.contains(nodo)) return clearInterval(iv);
      var resto = Math.max(0, fine - Date.now());
      fill.style.transform = "scaleX(" + (resto / (sec * 1000)).toFixed(3) + ")";
      testoSe(num, Math.ceil(resto / 1000) + " s");
      if (!resto) { clearInterval(iv); nodo.classList.add("finito"); num.textContent = "⏰ Tempo!"; suono("tempo"); }
    }, 250);
  }

  // il verdetto: martelletto, cartello della squadra e coriandoli
  function verdetto(ui, k, testo) {
    var el = ui.t.el, colori = ["#ffca3a", "#ff6b6b", "#4dabf7", "#51cf66", "#cc5de8"];
    var nodo = el("div", { class: "sp-verdetto c" + k }, [el("div", { class: "sp-martello", text: "🔨" }), el("div", { class: "sp-vtesto", text: testo })]);
    for (var i = 0; i < 22; i++) {
      nodo.appendChild(el("i", { class: "sp-cor", style: "left:" + (Math.random() * 100).toFixed(1) + "%;background:" + colori[i % 5] +
        ";animation-delay:" + (0.2 + Math.random() * 0.7).toFixed(2) + "s;animation-duration:" + (1.8 + Math.random() * 1.2).toFixed(2) + "s" }));
    }
    ui.scena.appendChild(nodo);
    suono("martello"); setTimeout(function () { suono("vittoria"); }, 350);
    setTimeout(function () { nodo.classList.add("via"); }, 2500);
    setTimeout(function () { if (nodo.parentNode) nodo.parentNode.removeChild(nodo); }, 3100);
  }
  // la classifica corta (pallini coi punti)
  function classificaCorta(t, lista, mioId) {
    var box = t.el("div", { class: "sp-classi" });
    conPosizioni(lista).forEach(function (r) {
      box.appendChild(t.el("span", { class: (r.pos === 1 ? "primo" : "") + (mioId && r.id === mioId ? " tu" : ""), text: medaglia(r.pos) + " " + r.nome + " " + r.punti }));
    });
    return box;
  }
  function avatar(t, nome, omino) {
    var cfg = omino || (window.SGOmino && SGOmino.casuale ? SGOmino.casuale(nome) : null);
    var html = "";
    try { html = cfg && window.SGOmino ? SGOmino.svg(cfg) : ""; } catch (e) {}
    return t.el("span", { class: "sp-av", html: html });
  }
  function persona(t, nome) { return t.el("span", { class: "sp-pers" }, [avatar(t, nome), document.createTextNode(nome)]); }

  // =========================================================
  //  REGISTRAZIONE
  // =========================================================
  SG.registra({
    id: "sipero",
    nome: "Sì... però",
    icona: "🤨",
    descrizione: "Due squadre costruiscono lo scenario di vita migliore e si sabotano a colpi di Malus. Il giudice decide chi vince.",
    giocatoriMin: MIN,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Giudice e squadre sullo stesso telefono", amici: true }],
    giocatoriMax: MAX,
    difficolta: 2,
    regole: [
      "A ogni round uno di voi fa da <b>giudice</b> (a turno: tutti lo stesso numero di volte) e gli altri si dividono <b>a sorte</b> in due squadre. Bastano 3 giocatori.",
      "Le squadre giocano a turno le carte: i <b>Bonus</b> rendono più bello il proprio scenario, i <b>Malus</b> rovinano quello avversario. Nella classica: 😇 <b>Paradiso</b> (2 Bonus), 💥 <b>Schianto</b> (2 Malus agli avversari), 🩹 <b>Rinforzo</b> (1 Bonus), 🪓 <b>Ghigliottina</b> (2 Malus finali). Si può anche comporre una sequenza personalizzata.",
      "Il tavolo si vede sempre: scegliete il Malus che incastra meglio i Bonus degli avversari. Tieni premuta una carta per leggerla in grande.",
      "Poi l'<b>arringa</b>: ogni squadra convince a voce il giudice che il suo scenario, guai compresi, è il migliore da vivere (libera o a tempo).",
      "Il giudice sceglie la squadra vincente: chi ne fa parte prende un punto. Alla fine vince chi ha più punti. Online chi apre la stanza può anche scegliere lui squadre e giudice, per un round solo."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = aiuti.modo || (aiuti.sala ? "online" : "telefono");
      dove.modalita = "classica";
      dove.sequenza = leggiSeqSalvata() || seqPulita(CLASSICA);
      dove.giri = 1;
      dove.arringa = 0;
      dove.squadre = "sorte";
      var online = dove.modo === "online";

      function rigaChip(valori, get, set, colonne) {
        var row = el("div", { class: "modo-griglia", style: colonne ? "grid-template-columns:repeat(" + colonne + ",1fr)" : "" });
        valori.forEach(function (v) {
          row.appendChild(el("button", { class: "modo-chip" + (get() === v.val ? " attiva" : ""), style: v.ic ? "" : "justify-content:center", onclick: function () {
            set(v.val);
            [].forEach.call(row.children, function (c, j) { c.className = "modo-chip" + (valori[j].val === v.val ? " attiva" : ""); });
          } }, [v.ic ? el("span", { class: "mi", text: v.ic }) : null,
            el("div", {}, [el("div", { class: "mt", text: v.txt }), v.sotto ? el("div", { class: "ms", text: v.sotto }) : null])]));
        });
        return row;
      }
      if (online) box.appendChild(el("p", { class: "modulo-nota", text: "Queste regole le ritrovi nella saletta (⚙️ Regole): puoi cambiarle anche con gli amici già dentro." }));

      // --- le fasi ---
      box.appendChild(el("div", { class: "etichetta", text: "Le fasi" }));
      var pannello = el("div", { hidden: "hidden" });
      box.appendChild(rigaChip([
        { val: "classica", ic: "📜", txt: "Classica", sotto: "Paradiso, Schianto, Rinforzo, Ghigliottina" },
        { val: "custom", ic: "🎛️", txt: "Personalizzata", sotto: "Le componi tu" }
      ], function () { return dove.modalita; }, function (v) { dove.modalita = v; pannello.hidden = (v !== "custom"); }));

      var nuovo = { tipo: "bonus", n: 2, bers: "se" };
      pannello.appendChild(el("div", { class: "etichetta", text: "La tua sequenza di fasi" }));
      var listaFasi = el("div", { style: "display:flex;flex-direction:column;gap:6px;margin-bottom:8px" });
      pannello.appendChild(listaFasi);
      function cambiata() { salvaSeq(dove.sequenza); ridisegnaFasi(); }
      function ridisegnaFasi() {
        svuota(listaFasi);
        if (!dove.sequenza.length) listaFasi.appendChild(el("p", { class: "modulo-nota", style: "color:#ffd43b", text: "Nessuna fase: aggiungine almeno una qui sotto, se no si gioca la Classica." }));
        dove.sequenza.forEach(function (f, i) {
          var nf = nomeFase(dove.sequenza, i);
          listaFasi.appendChild(el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.06)" }, [
            el("span", { text: (i + 1) + ") " + nf.ic + " " + nf.nome + ": " + descriviFase(f) }),
            el("button", { class: "togli", text: "×", "aria-label": "Togli la fase", onclick: function () { dove.sequenza.splice(i, 1); cambiata(); } })
          ]));
        });
      }
      pannello.appendChild(el("div", { class: "etichetta", style: "margin:6px 0 4px", text: "Tipo di carta" }));
      pannello.appendChild(rigaChip([{ val: "bonus", txt: "Bonus" }, { val: "malus", txt: "Malus" }], function () { return nuovo.tipo; }, function (v) { nuovo.tipo = v; }));
      pannello.appendChild(el("div", { class: "etichetta", style: "margin:6px 0 4px", text: "Quante carte" }));
      pannello.appendChild(rigaChip([{ val: 1, txt: "1" }, { val: 2, txt: "2" }, { val: 3, txt: "3" }], function () { return nuovo.n; }, function (v) { nuovo.n = v; }, 3));
      pannello.appendChild(el("div", { class: "etichetta", style: "margin:6px 0 4px", text: "Su chi" }));
      pannello.appendChild(rigaChip([{ val: "se", txt: "Su di sé" }, { val: "avv", txt: "Agli avversari" }], function () { return nuovo.bers; }, function (v) { nuovo.bers = v; }));
      pannello.appendChild(el("div", { style: "display:flex;gap:8px;margin-top:8px" }, [
        el("button", { class: "btn btn-fantasma", style: "flex:1", text: "＋ Aggiungi", onclick: function () {
          if (dove.sequenza.length >= 12) return;
          dove.sequenza.push({ tipo: nuovo.tipo, n: nuovo.n, bers: nuovo.bers }); cambiata();
        } }),
        el("button", { class: "btn btn-fantasma", style: "flex:1", text: "↺ Come la Classica", onclick: function () { dove.sequenza = seqPulita(CLASSICA); cambiata(); } })
      ]));
      ridisegnaFasi();
      box.appendChild(pannello);

      // --- quanti round ---
      box.appendChild(el("div", { class: "etichetta", text: "Quanto si gioca" }));
      box.appendChild(rigaChip([{ val: 1, txt: "1 giro" }, { val: 2, txt: "2 giri" }, { val: 3, txt: "3 giri" }], function () { return dove.giri; }, function (v) { dove.giri = v; }, 3));
      box.appendChild(el("p", { class: "modulo-nota", text: "In un giro ognuno fa il giudice una volta: con 4 giocatori, 1 giro = 4 round." }));

      // --- l'arringa ---
      box.appendChild(el("div", { class: "etichetta", text: "L'arringa" }));
      box.appendChild(rigaChip([{ val: 0, txt: "Libera" }, { val: 60, txt: "60 secondi" }, { val: 90, txt: "90 secondi" }], function () { return dove.arringa; }, function (v) { dove.arringa = v; }, 3));

      // --- le squadre (solo online) ---
      if (online) {
        box.appendChild(el("div", { class: "etichetta", text: "Squadre e giudice" }));
        box.appendChild(rigaChip([
          { val: "sorte", ic: "🎲", txt: "A sorte", sotto: "Cambiano a ogni round, il giudice gira" },
          { val: "mano", ic: "✋", txt: "Le scelgo io", sotto: "Un round solo, in saletta" }
        ], function () { return dove.squadre; }, function (v) { dove.squadre = v; }));
      }
    },

    avvia: function (t) {
      var dati = window.SG_SIPERO || { bonus: [], malus: [] };
      if (dati.bonus.length < 20 || dati.malus.length < 20) return niente(t, "Mancano le carte del gioco.");
      if (t.linkParams && t.linkParams.stanza) return ospiteSipero(t, t.linkParams.stanza);
      if ((t.impostazioni || {}).modo === "online") return hostSipero(t, dati);
      if ((t.giocatori || []).length < MIN) return niente(t, "Servono almeno 3 giocatori: un giudice e due squadre.");
      avviaLocale(t, dati);
    }
  });

  function niente(t, testo) {
    var s = t.schermata({ icona: "🤨", titolo: "Non si può giocare", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  STESSO TELEFONO
  // =========================================================
  function avviaLocale(t, dati) {
    var imp = t.impostazioni || {};
    var giri = [1, 2, 3].indexOf(+imp.giri) >= 0 ? +imp.giri : 1;
    var sq = seqDa(imp);
    var punti = {}; t.giocatori.forEach(function (n) { punti[n] = 0; });
    var st = {
      giocatori: t.giocatori.slice(), punti: punti, seq: sq.seq, avvisoSeq: sq.vuota,
      totale: t.giocatori.length * giri, round: 0, arringa: +imp.arringa || 0,
      mazzi: { bonus: nuovoMazzo(t, dati.bonus), malus: nuovoMazzo(t, dati.malus) }, coppie: {},
      sessione: nuovaSessione(), statGiocatori: Object.create(null)
    };
    st.esci = function () { if (window.confirm("Uscire dalla partita? I punti di questa partita si perdono.")) { chiudiLente(); t.esci(); } };
    iniziaRound(t, st);
  }
  function membri(st, k) { return st.squadre[k].join(", "); }
  function titoloColonna(k, nomi) { return emoSq(k) + " " + nomeSq(k) + (nomi ? " · " + nomi : ""); }

  function iniziaRound(t, st) {
    st.round += 1;
    if (st.round > st.totale) return finePartita(t, st);
    var el = t.el, n = st.giocatori.length;
    st.giudice = st.giocatori[(st.round - 1) % n];
    st.squadre = formaSquadre(t, st.giocatori.filter(function (x) { return x !== st.giudice; }), st.coppie);
    st.giocatori.forEach(function (nome) { statPersona(st, nome).roundGiocati++; });
    statPersona(st, st.giudice).roundGiudice++;
    st.scen = scenVuoti();
    st.mani = nuoveMani(t, st.mazzi, st.scen);
    st.passi = creaPassi(st.seq, (st.round - 1) % 2);
    st.passo = 0;

    stile();
    var s = t.schermata({ icona: "🥊", titolo: "Round " + st.round + " di " + st.totale, indietro: st.esci });
    var box = el("div", { class: "sp-round" });
    box.appendChild(el("div", { class: "sp-giudbox" }, [avatar(t, st.giudice), el("span", { text: "⚖️ Giudice: " + st.giudice })]));
    [0, 1].forEach(function (k) {
      if (k === 1) box.appendChild(el("div", { class: "sp-contro", text: "contro" }));
      box.appendChild(el("div", { class: "sp-sqbox c" + k }, [el("b", { text: emoSq(k) + " " + nomeSq(k) }),
        el("div", { class: "sp-chi" }, st.squadre[k].map(function (nome) { return persona(t, nome); }))]));
    });
    box.appendChild(el("div", { class: "sp-seqinfo", text: "Le fasi: " + riassuntoSeq(st.seq) }));
    if (st.avvisoSeq && st.round === 1) box.appendChild(el("div", { class: "sp-avviso", text: "Nella Personalizzata non c'era nessuna fase: si gioca la Classica." }));
    box.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin:0", text: "Passatevi il telefono a turno: le carte in mano sono segrete, quelle giocate vanno sul tavolo." }));
    s._contenuto.appendChild(box);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Via ▶", onclick: function () { prossimoPasso(t, st); } }));
    t.mostra(s);
  }

  function prossimoPasso(t, st) {
    if (st.passo >= st.passi.length) return alCentro(t, st);
    var p = st.passi[st.passo];
    t.passaA(emoSq(p.sq) + " " + nomeSq(p.sq) + " (" + membri(st, p.sq) + ")", function () { sceltaLocale(t, st, p); });
  }
  function colonneLocale(ui, st, d) {
    [0, 1].forEach(function (k) {
      aggiornaColonna(ui.cols[k], { titolo: titoloColonna(k, membri(st, k)), voci: st.scen[k].voci, turno: d.turno === k, mia: d.mia === k, vince: d.vince === k, anima: d.anima, ritardo: d.ritardo, base: d.base && d.base[k] });
    });
  }

  function sceltaLocale(t, st, p) {
    var el = t.el, f = p.f, nf = nomeFase(st.seq, p.fi);
    var ui = creaScena(t, st.esci);
    barra(ui, nf.ic + " " + nf.nome, "Round " + st.round + " di " + st.totale + " · fase " + (p.fi + 1) + " di " + st.seq.length, "⚖️ " + st.giudice);
    colonneLocale(ui, st, { turno: p.sq, mia: p.sq, anima: false });
    var mano = st.mani[p.sq], altro = f.tipo === "bonus" ? "malus" : "bonus";
    var n = Math.min(f.n, mano[f.tipo].length);
    testoSe(ui.turno, emoSq(p.sq) + " Tocca a voi: " + istruzione({ tipo: f.tipo, n: n, bers: f.bers }, p.sq, true));
    var bOk = el("button", { class: "btn btn-primario", text: "Conferma ▶", disabled: "disabled" });
    var m = creaMano(t, { carte: mano[f.tipo], tipo: f.tipo, quante: n, altre: { tipo: altro, carte: mano[altro] },
      onCambia: function (sel) { bOk.disabled = sel.length !== n; } });
    ui.azione.appendChild(m.nodo);
    ui.piede.appendChild(bOk);
    m.adatta();
    bOk.addEventListener("click", function () {
      var sel = m.sel(); if (sel.length !== n || bOk._fatto) return;
      bOk._fatto = true; bOk.disabled = true;
      var bers = f.bers === "se" ? p.sq : altra(p.sq);
      sel.forEach(function (c) { st.scen[bers].voci.push({ tipo: f.tipo, testo: c }); });
      st.squadre[p.sq].forEach(function (nome) { statPersona(st, nome)[f.tipo === "bonus" ? "carteBonus" : "carteMalus"] += sel.length; });
      mano[f.tipo] = mano[f.tipo].filter(function (c) { return sel.indexOf(c) < 0; });
      riempi(t, mano[f.tipo], st.mazzi[f.tipo], inUsoDa(st.mani, st.scen));
      st.passo += 1;
      // le carte volano sul tavolo, poi si passa il telefono
      colonneLocale(ui, st, { turno: p.sq, mia: p.sq });
      suono(f.tipo);
      svuota(ui.azione); svuota(ui.piede);
      messaggio(ui, f.tipo === "bonus" ? "✨" : "💥", "Carte sul tavolo!");
      setTimeout(function () { if (document.body.contains(ui.s)) prossimoPasso(t, st); }, 1100);
    });
  }

  function alCentro(t, st) {
    var el = t.el;
    var s = t.schermata({ indietro: st.esci });
    s._contenuto.appendChild(el("div", { class: "sp-centro" }, [
      el("div", { class: "sp-grande", text: "📱" }),
      el("b", { text: "Mettete il telefono al centro del tavolo" }),
      el("p", { text: "Tutte le carte sono giocate: ora si scoprono i due scenari, poi l'arringa." })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Scopriamo gli scenari 🎭", onclick: function () { rivelaLocale(t, st); } }));
    t.mostra(s);
  }

  function rivelaLocale(t, st) {
    var ui = creaScena(t, st.esci);
    largo(ui, true);
    barra(ui, "🎭 Gli scenari", "Round " + st.round + " di " + st.totale, "⚖️ " + st.giudice);
    var passo = 0.45, n0 = st.scen[0].voci.length;
    colonneLocale(ui, st, { ritardo: passo, base: [0, n0 * passo] });
    adattaTavolo(ui);
    // un suono per ogni carta che si scopre
    st.scen[0].voci.concat(st.scen[1].voci).forEach(function (v, i) {
      setTimeout(function () { if (document.body.contains(ui.s)) suono(v.tipo); }, Math.round(i * passo * 1000) + 150);
    });
    arringaLocale(t, st, ui, 0);
  }

  function arringaLocale(t, st, ui, k) {
    var el = t.el;
    colonneLocale(ui, st, { turno: k });
    testoSe(ui.turno, "🎤 " + emoSq(k) + " " + nomeSq(k) + " (" + membri(st, k) + "): convincete il giudice!");
    svuota(ui.azione); svuota(ui.piede);
    if (st.arringa) mettiTimer(t, ui.azione, st.arringa);
    ui.piede.appendChild(el("button", { class: "btn btn-primario", text: k === 0 ? "Tocca alla " + nomeSq(1) + " ▶" : "Al verdetto ⚖️",
      onclick: function () { if (k === 0) arringaLocale(t, st, ui, 1); else giudizioLocale(t, st, ui); } }));
    adattaTavolo(ui);
  }

  function giudizioLocale(t, st, ui) {
    var el = t.el;
    colonneLocale(ui, st, {});
    testoSe(ui.turno, "⚖️ " + st.giudice + ", quale scenario è il migliore da vivere?");
    svuota(ui.azione); svuota(ui.piede);
    [0, 1].forEach(function (k) {
      ui.piede.appendChild(el("button", { class: "btn sp-vota c" + k, text: emoSq(k) + " " + nomeSq(k), onclick: function () {
        st.squadre[k].forEach(function (m) { st.punti[m] = (st.punti[m] || 0) + 1; statPersona(st, m).roundVinti++; });
        esitoLocale(t, st, ui, k);
      } }));
    });
    adattaTavolo(ui);
  }

  function esitoLocale(t, st, ui, k) {
    var el = t.el;
    colonneLocale(ui, st, { vince: k });
    testoSe(ui.turno, "🏅 Il round va alla " + nomeSq(k) + ": +1 a " + membri(st, k) + "!");
    svuota(ui.azione); svuota(ui.piede);
    ui.azione.appendChild(classificaCorta(t, st.giocatori.map(function (nome) { return { id: nome, nome: nome, punti: st.punti[nome] || 0 }; })));
    adattaTavolo(ui);
    verdetto(ui, k, "Vince la " + nomeSq(k) + "!");
    var ultimo = st.round >= st.totale;
    ui.piede.appendChild(el("button", { class: "btn btn-primario", text: ultimo ? "Classifica finale 🏆" : "Prossimo round ▶",
      onclick: function () { chiudiLente(); iniziaRound(t, st); } }));
  }

  function finePartita(t, st) {
    chiudiLente();
    var classifica = conPosizioni(st.giocatori.map(function (nome) { return { nome: nome, punti: st.punti[nome] || 0 }; }));
    salvaTrofeiSipero(t, { online: false, sessione: st.sessione, classifica: classifica, statFine: st.statGiocatori });
    t.fine(classifica.map(function (r) { return { nome: r.nome, punti: r.punti, pos: r.pos }; }));
  }

  // =========================================================
  //  ONLINE — ognuno dal suo telefono (host-autoritativo).
  //  Squadre a sorte (il giudice gira, più round) oppure scelte
  //  dall'host in saletta (un round). Il tavolo si vede sempre;
  //  la mano arriva solo ai telefoni della propria squadra.
  // =========================================================
  function squadraDi(assegna, id) { var a = assegna ? assegna[id] : null; return (a === 0 || a === 1) ? a : -1; }
  function avatarOkS(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }

  function hostSipero(t, dati) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteS(t);
    var nomeHost = (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Host";
    var st = {
      fase: "lobby", codice: "…", pronta: false,
      giocatori: [{ id: "host", nome: nomeHost, omino: t.mioOmino ? t.mioOmino(nomeHost) : null, via: false, guarda: false }],
      assegna: {}, regole: null, manuale: false, seq: CLASSICA, arringaSec: 0,
      round: 0, totale: 0, punti: {}, giudicati: {}, giocato: {}, coppie: {}, ordine: [],
      mazzi: { bonus: nuovoMazzo(t, dati.bonus), malus: nuovoMazzo(t, dati.malus) },
      scen: scenVuoti(), mani: null, manoV: [0, 0], passi: [], passo: 0, parla: 0, timerN: 0,
      vincitore: null, classifica: null, sessione: null, statGiocatori: Object.create(null), autoTo: null
    };
    function leggiRegole(imp) {
      imp = imp || {};
      var s = seqDa(imp);
      st.regole = { seq: s.seq, vuota: s.vuota, giri: [1, 2, 3].indexOf(+imp.giri) >= 0 ? +imp.giri : 1,
        arringa: +imp.arringa || 0, squadre: imp.squadre === "mano" ? "mano" : "sorte" };
    }
    leggiRegole(t.impostazioni);
    // "⚙️ Regole" nella saletta: l'host cambia le regole quando vuole (prima di cominciare)
    t.onRegole = function (im) { if (st.fase !== "lobby") return; leggiRegole(im); bd(); };
    var V = { t: t };

    var rete = SGNet.ospita("sipero", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: addio,
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") return entra(id, m);
        if (!pById(id)) return;
        if (m.t === "chiediMano") manoA(id);
        else if (m.t === "gioca") giocaCarte(id, m.carte);
        else if (m.t === "avanti") avanti(id);
        else if (m.t === "giudica") giudica(id, m.sq);
      },
      onErrore: function (e) { if (e && e.type === "no-mqtt") senzaReteS(t); }   // gli altri intoppi li ripara la rete da sola
    });
    function pById(id) { for (var i = 0; i < st.giocatori.length; i++) if (st.giocatori[i].id === id) return st.giocatori[i]; return null; }
    function presenti() { return st.giocatori.filter(function (p) { return !p.via; }); }
    function giudice() { for (var i = 0; i < st.giocatori.length; i++) if (st.assegna[st.giocatori[i].id] === "g") return st.giocatori[i]; return null; }
    function presentiSq(k) { return st.giocatori.filter(function (p) { return !p.via && st.assegna[p.id] === k; }); }
    function ferma() { if (st.autoTo) { clearTimeout(st.autoTo); st.autoTo = null; } }

    // ----- chi entra, chi rientra, chi esce -----
    function entra(id, m) {
      var p = pById(id);
      if (p) { p.via = false; bd(); manoA(id); return; }   // rientra (stesso id): ritrova la partita e le sue carte
      var nome = String(m.nome || "").trim().slice(0, 16) || "Amico";
      if (st.fase !== "lobby") {   // rientra da un altro telefono (o con la memoria cancellata): stesso nome, stesso posto
        var vecchio = st.giocatori.filter(function (x) { return x.via && norm(x.nome) === norm(nome); })[0];
        if (vecchio) { cambiaId(vecchio, id); bd(); manoA(id); return; }
      }
      if (st.giocatori.length >= MAX) { rete.inviaVeloce({ t: "piena", to: id }); return; }
      st.giocatori.push({ id: id, nome: nome, omino: avatarOkS(m.omino), via: false, guarda: st.fase !== "lobby" });
      bd();
    }
    function cambiaId(p, nuovo) {
      var vec = p.id; p.id = nuovo; p.via = false;
      if (vec in st.assegna) { st.assegna[nuovo] = st.assegna[vec]; delete st.assegna[vec]; }
      ["punti", "giudicati", "giocato"].forEach(function (k) { if (vec in st[k]) { st[k][nuovo] = st[k][vec]; delete st[k][vec]; } });
      if (st.statGiocatori[vec]) { st.statGiocatori[nuovo] = st.statGiocatori[vec]; delete st.statGiocatori[vec]; }
      st.ordine = st.ordine.map(function (x) { return x === vec ? nuovo : x; });
    }
    function addio(id) {
      var p = pById(id); if (!p || id === "host") return;
      if (st.fase === "lobby") { st.giocatori = st.giocatori.filter(function (x) { return x.id !== id; }); delete st.assegna[id]; bd(); return; }
      p.via = true;   // a partita iniziata tiene il suo posto (e il suo ruolo): se rientra, riprende da lì
      bd(); controllaVuota();
    }

    // ----- la mano: solo ai telefoni della squadra -----
    function manoA(id) {
      if (id === "host" || !st.mani || st.fase === "lobby" || st.fase === "fine") return;
      var k = squadraDi(st.assegna, id); if (k < 0) return;
      rete.inviaVeloce({ t: "mano", per: [id], sq: k, v: st.manoV[k], mano: st.mani[k] });
    }
    function manoSquadra(k) {
      var per = presentiSq(k).map(function (p) { return p.id; }).filter(function (id) { return id !== "host"; });
      if (per.length) rete.inviaVeloce({ t: "mano", per: per, sq: k, v: st.manoV[k], mano: st.mani[k] });
    }

    // la "foto" per tutti: SEMPRE con gli id; MAI le carte in mano
    function vm() {
      var g = giudice(), r = st.regole;
      var v = { fase: st.fase, codice: st.codice, pronta: st.pronta,
        giocatori: st.giocatori.map(function (p) { return { id: p.id, nome: p.nome, via: !!p.via, guarda: !!p.guarda, punti: st.punti[p.id] || 0, omino: st.fase === "lobby" ? (p.omino || null) : undefined }; }),
        regole: { seq: r.seq, vuota: r.vuota, giri: r.giri, arringa: r.arringa, squadre: r.squadre },
        manuale: st.manuale, round: st.round, totale: st.totale, assegna: st.assegna,
        giudiceId: g ? g.id : null, giudiceNome: g ? g.nome : "", giudiceVia: !!(g && g.via),
        scen: st.scen, manoV: st.manoV, step: null, vuota: false, prossimi: null,
        parla: st.parla, timer: { n: st.timerN, sec: st.arringaSec }, vincitore: st.vincitore,
        classifica: st.classifica, sessione: st.sessione, statFine: st.fase === "fine" ? st.statGiocatori : null };
      if (st.fase === "gioco" && st.passo < st.passi.length) {
        var p = st.passi[st.passo], nf = nomeFase(st.seq, p.fi);
        v.step = { sq: p.sq, tipo: p.f.tipo, n: nCarte(p), bers: p.f.bers, fi: p.fi + 1, ftot: st.seq.length, ic: nf.ic, nome: nf.nome, i: st.passo };
        v.vuota = presentiSq(p.sq).length === 0;
        v.prossimi = [0, 1].map(function (k) { for (var j = st.passo; j < st.passi.length; j++) if (st.passi[j].sq === k) return st.passi[j].f.tipo; return null; });
      }
      return v;
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegnaOn(V, v, cb); }

    // ----- la partita -----
    function manualeOk() {
      var g = giudice();
      return !!(g && !g.via && presentiSq(0).length && presentiSq(1).length);
    }
    function comincia() {
      if (st.fase !== "lobby") return;
      var r = st.regole, pres = presenti();
      if (r.vuota) return;
      st.manuale = r.squadre === "mano";
      if (st.manuale) { if (!manualeOk()) return; st.totale = 1; }
      else { if (pres.length < MIN) return; st.totale = pres.length * r.giri; st.assegna = {}; }
      st.seq = r.seq; st.arringaSec = r.arringa;
      st.ordine = pres.map(function (p) { return p.id; });
      st.round = 0; st.punti = {}; st.giudicati = {}; st.giocato = {}; st.coppie = {};
      st.sessione = nuovaSessione(); st.statGiocatori = Object.create(null); st.classifica = null;
      st.giocatori.forEach(function (p) { p.guarda = false; });
      prossimoRound();
    }
    function prossimoRound() {
      ferma();
      st.round += 1;
      var pres = presenti();
      if (st.round > st.totale || (!st.manuale && pres.length < MIN)) return fine();
      if (!st.manuale) {
        pres.forEach(function (p) { p.guarda = false; if (st.ordine.indexOf(p.id) < 0) st.ordine.push(p.id); });
        // il giudice: chi l'ha fatto meno volte, nell'ordine d'arrivo
        var g = pres.slice().sort(function (a, b) {
          return ((st.giudicati[a.id] || 0) - (st.giudicati[b.id] || 0)) || (st.ordine.indexOf(a.id) - st.ordine.indexOf(b.id));
        })[0];
        var sq = formaSquadre(t, pres.filter(function (p) { return p !== g; }).map(function (p) { return p.id; }), st.coppie);
        st.assegna = {}; st.assegna[g.id] = "g";
        sq[0].forEach(function (id) { st.assegna[id] = 0; }); sq[1].forEach(function (id) { st.assegna[id] = 1; });
      }
      Object.keys(st.assegna).forEach(function (id) {
        if (!pById(id)) return;
        var s = statPersona(st, id); s.roundGiocati++; st.giocato[id] = 1;
        if (st.assegna[id] === "g") { s.roundGiudice++; st.giudicati[id] = (st.giudicati[id] || 0) + 1; }
      });
      st.scen = scenVuoti();
      st.mani = nuoveMani(t, st.mazzi, st.scen);
      st.manoV = [st.manoV[0] + 1, st.manoV[1] + 1];
      st.passi = creaPassi(st.seq, (st.round - 1) % 2); st.passo = 0;
      st.parla = 0; st.vincitore = null; st.fase = "gioco";
      bd(); manoSquadra(0); manoSquadra(1); controllaVuota();
    }
    function nCarte(p) { return Math.min(p.f.n, st.mani ? st.mani[p.sq][p.f.tipo].length : p.f.n); }
    function giocaCarte(id, carte) {
      if (st.fase !== "gioco" || st.passo >= st.passi.length) return;
      var p = st.passi[st.passo];
      if (squadraDi(st.assegna, id) !== p.sq) return;
      giocaPasso(p, carte);
    }
    function giocaPasso(p, carte) {
      var mano = st.mani[p.sq][p.f.tipo], n = nCarte(p);
      if (!Array.isArray(carte) || carte.length !== n) return;
      for (var i = 0; i < carte.length; i++) if (mano.indexOf(carte[i]) < 0 || carte.indexOf(carte[i]) !== i) return;
      ferma();
      var bers = p.f.bers === "se" ? p.sq : altra(p.sq);
      carte.forEach(function (c) { st.scen[bers].voci.push({ tipo: p.f.tipo, testo: c }); });
      st.giocatori.forEach(function (g) { if (st.assegna[g.id] === p.sq) statPersona(st, g.id)[p.f.tipo === "bonus" ? "carteBonus" : "carteMalus"] += carte.length; });
      st.mani[p.sq][p.f.tipo] = mano.filter(function (c) { return carte.indexOf(c) < 0; });
      riempi(t, st.mani[p.sq][p.f.tipo], st.mazzi[p.f.tipo], inUsoDa(st.mani, st.scen));
      st.manoV[p.sq]++;
      st.passo++;
      if (st.passo >= st.passi.length) { st.fase = "arringa"; st.parla = 0; st.timerN++; }
      bd(); manoSquadra(p.sq); controllaVuota();
    }
    // una squadra rimasta senza nessuno: dopo un attimo le carte le sceglie il caso (la partita non si ferma)
    function controllaVuota() {
      if (st.fase !== "gioco" || st.passo >= st.passi.length || st.autoTo) return;
      var p = st.passi[st.passo], quale = st.passo;
      if (presentiSq(p.sq).length) return;
      st.autoTo = setTimeout(function () {
        st.autoTo = null;
        if (st.fase !== "gioco" || st.passo !== quale || presentiSq(p.sq).length) return controllaVuota();
        giocaPasso(p, t.mischia(st.mani[p.sq][p.f.tipo]).slice(0, nCarte(p)));
      }, 3500);
    }
    // decide il giudice; se il giudice è uscito, decide l'host
    function puoDecidere(id) { var g = giudice(); return (g && !g.via && id === g.id) || (id === "host" && (!g || g.via)); }
    function avanti(id) {
      if (st.fase !== "arringa" || !puoDecidere(id)) return;
      if (st.parla === 0) { st.parla = 1; st.timerN++; } else st.fase = "giudizio";
      bd();
    }
    function giudica(id, k) {
      if (st.fase !== "giudizio" || !puoDecidere(id) || (k !== 0 && k !== 1)) return;
      st.vincitore = k; st.fase = "esito";
      st.giocatori.forEach(function (g) { if (st.assegna[g.id] === k) { st.punti[g.id] = (st.punti[g.id] || 0) + 1; statPersona(st, g.id).roundVinti++; } });
      bd();
    }
    function prossimo() { if (st.fase === "esito") prossimoRound(); }
    function fine() {
      ferma();
      st.classifica = conPosizioni(st.giocatori.filter(function (p) { return st.giocato[p.id]; })
        .map(function (p) { return { id: p.id, nome: p.nome, punti: st.punti[p.id] || 0 }; }));
      st.fase = "fine"; bd();
      // torneo online: i NOMI dei giocatori col loro posto (pari merito = stesso posto)
      if (t.risultato && st.classifica.length) t.risultato(st.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, tutti tornano nella saletta
    function nuova() {
      ferma();
      st.giocatori = presenti(); st.giocatori.forEach(function (p) { p.guarda = false; });
      if (st.manuale) Object.keys(st.assegna).forEach(function (id) { if (!pById(id)) delete st.assegna[id]; });
      else st.assegna = {};
      st.fase = "lobby"; st.round = 0; st.totale = 0; st.classifica = null; st.vincitore = null;
      st.scen = scenVuoti(); st.mani = null; st.passi = []; st.passo = 0;
      bd();
    }
    var cb = {
      sonoHost: true, myId: "host",
      mano: function (k) { return st.mani ? st.mani[k] : null; },
      onAssegna: function (pid, val) {
        if (st.fase !== "lobby" || !pById(pid)) return;
        if (val === "g") Object.keys(st.assegna).forEach(function (id) { if (st.assegna[id] === "g") delete st.assegna[id]; });   // un giudice solo
        if (val == null) delete st.assegna[pid]; else st.assegna[pid] = val;
        bd();
      },
      onComincia: comincia, onProssimo: prossimo, onNuova: nuova,
      onGioca: function (carte) { giocaCarte("host", carte); },
      onAvanti: function () { avanti("host"); },
      onGiudica: function (k) { giudica("host", k); },
      onEsci: function () {
        if (st.fase !== "lobby" && st.fase !== "fine" && !window.confirm("Chiudere la partita per tutti?")) return;
        ferma(); chiudiLente(); rete.chiudi(); t.esci();
      }
    };
    bd();
  }

  function ospiteSipero(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteS(t);
    var el = t.el, V = { t: t };
    var S = { myId: null, vm: null, rete: null, nome: "", msg: null, mano: null, manoSq: -1, manoV: -1, chiesta: 0, riprova: null };
    function invia(m) { if (S.rete) S.rete.invia(m); }
    var cb = {
      sonoHost: false, myId: null,
      // la mia mano (arriva a parte, solo a me); se manca o è vecchia la richiedo
      mano: function (k) {
        if (S.mano && S.manoSq === k && S.vm && S.manoV === S.vm.manoV[k]) return S.mano;
        if (Date.now() - S.chiesta > 1800) { S.chiesta = Date.now(); invia({ t: "chiediMano" }); }
        if (!S.riprova) S.riprova = setTimeout(function () { S.riprova = null; disegna(); }, 2500);
        return null;
      },
      onAssegna: function () {}, onComincia: function () {}, onNuova: function () {}, onProssimo: function () {},
      onGioca: function (carte) { invia({ t: "gioca", carte: carte }); },
      onGiudica: function (k) { invia({ t: "giudica", sq: k }); },
      onAvanti: function () { invia({ t: "avanti" }); },
      onEsci: function () {
        if (S.vm && S.vm.fase !== "lobby" && S.vm.fase !== "fine" && !window.confirm("Uscire dalla partita?")) return;
        chiudiLente(); if (S.rete) S.rete.chiudi(); t.esci();
      }
    };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaOn(V, S.vm, cb); } }
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🤨", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      var s = t.schermata({ icona: "🤨", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      S.msg = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" });
      s._contenuto.appendChild(S.msg);
      t.mostra(s);
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) {
          S.myId = id; cb.myId = id;
          invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice, o chi la organizza non ha ancora aperto la stanza…"; }, 12000);
        },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;   // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; disegna(); }
          else if (m.t === "mano") { if (m.per && m.per.indexOf(S.myId) >= 0) { S.mano = m.mano; S.manoSq = m.sq; S.manoV = m.v; disegna(); } }
          else if (m.t === "piena") { if (S.rete) S.rete.chiudi(); erroreS(t, "La stanza è piena: ci sono già 10 giocatori. Chiedi a chi la organizza di aprirne un'altra."); }
        },
        onChiuso: function () { chiudiLente(); erroreS(t, "Collegamento perso. Chi organizzava potrebbe aver chiuso la partita."); },
        onErrore: function () { chiudiLente(); erroreS(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function erroreS(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaReteS(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "Il gioco \"ognuno dal suo telefono\" funziona quando l'app è aperta dal sito pubblicato. Intanto potete giocare su un telefono solo." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---------- disegno online (uguale per host e ospiti) ----------
  function squadreVm(vm) {
    var sq = [[], []];
    vm.giocatori.forEach(function (g) { var a = squadraDi(vm.assegna, g.id); if (a >= 0) sq[a].push(g); });
    return sq;
  }
  function disegnaOn(V, vm, cb) {
    if (vm.fase === "lobby") { V.ui = null; V.fineSess = null; return lobbyOn(V, vm, cb); }
    if (vm.fase === "fine") { V.ui = null; return fineOn(V, vm, cb); }
    if (!V.ui || !document.body.contains(V.ui.s)) V.ui = creaScena(V.t, cb.onEsci);
    aggiornaOn(V, vm, cb);
    V.ui.nuova = false;
  }

  function lobbyOn(V, vm, cb) {
    var t = V.t, el = t.el, r = vm.regole;
    if (!V.lobbyNodo) { stile(); V.lobbyNodo = el("div", { class: "sp-lobby" }); }
    var pres = vm.giocatori.filter(function (g) { return !g.via; });
    var sig = JSON.stringify([r, vm.assegna, pres.map(function (g) { return [g.id, g.nome]; }), cb.sonoHost, cb.myId]);
    if (sig !== V.lobbySig) {   // si rifà solo se è cambiato qualcosa (niente lampeggio)
      V.lobbySig = sig;
      var n = V.lobbyNodo; svuota(n);
      var giri = r.squadre === "mano" ? "🔁 Un round, squadre e giudice scelti da chi organizza" :
        "🔁 " + r.giri + (r.giri === 1 ? " giro" : " giri") + ": ognuno fa il giudice " + (r.giri === 1 ? "una volta" : r.giri + " volte") + ", squadre a sorte a ogni round";
      n.appendChild(el("div", { class: "sp-info" }, [
        el("div", { text: "📜 " + (r.vuota ? "Personalizzata senza fasi" : riassuntoSeq(r.seq)) }),
        el("div", { text: giri }),
        el("div", { text: "🎤 Arringa " + (r.arringa ? r.arringa + " secondi a squadra" : "libera") })
      ]));
      if (r.squadre === "mano") {
        n.appendChild(el("div", { class: "etichetta", text: "Giudice e squadre" }));
        if (cb.sonoHost) n.appendChild(el("p", { class: "modulo-nota", style: "margin:0", text: "Tocca ⚖️ per il giudice (uno solo), 🟥 o 🟦 per le squadre, 👀 per chi guarda." }));
        pres.forEach(function (g) {
          var a = vm.assegna[g.id];
          var ruolo = a === "g" ? "⚖️ Giudice" : a === 0 ? "🟥 Squadra 1" : a === 1 ? "🟦 Squadra 2" : "👀 Guarda";
          var riga = el("div", { class: "sp-riga" }, [el("div", { class: "sp-riga-t" }, [el("span", { text: g.nome + (g.id === cb.myId ? " (tu)" : "") }), el("span", { text: ruolo })])]);
          if (cb.sonoHost) {
            var ruoli = el("div", { class: "sp-ruoli" });
            [["⚖️", "g"], ["🟥", 0], ["🟦", 1], ["👀", null]].forEach(function (o) {
              var att = o[1] === null ? (a !== "g" && a !== 0 && a !== 1) : a === o[1];
              ruoli.appendChild(el("button", { class: att ? "attiva" : "", text: o[0], onclick: function () { cb.onAssegna(g.id, o[1]); } }));
            });
            riga.appendChild(ruoli);
          }
          n.appendChild(riga);
        });
      }
    }
    var ok, nota = null;
    if (r.vuota) { ok = false; nota = "Nella Personalizzata non c'è nessuna fase: aggiungine almeno una da ⚙️ Regole."; }
    else if (r.squadre === "mano") {
      var sq = squadreVm({ giocatori: pres, assegna: vm.assegna });
      ok = !!(pres.some(function (g) { return vm.assegna[g.id] === "g"; }) && sq[0].length && sq[1].length);
      if (!ok) nota = "Per cominciare servono un giudice (⚖️) e almeno uno per squadra (🟥 🟦).";
    } else ok = pres.length >= MIN;
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN, vuoti: Math.max(0, MIN - pres.length), puoComincia: ok,
      giocatori: pres.map(function (g) { return { id: g.id, nome: g.nome, omino: g.omino || null, host: g.id === "host", tu: g.id === cb.myId }; }),
      extra: [V.lobbyNodo], nota: cb.sonoHost && pres.length >= MIN && !ok ? nota : null,
      attesa: r.squadre === "mano" ? "Aspetta: chi organizza sta scegliendo il giudice e le squadre. 🤨" : "Aspetta che si cominci: giudice e squadre li decide la sorte. 🤨",
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function aggiornaOn(V, vm, cb) {
    var ui = V.ui, t = V.t, el = t.el, step = vm.step;
    var io = vm.giocatori.filter(function (g) { return g.id === cb.myId; })[0];
    var me = { sq: squadraDi(vm.assegna, cb.myId), giudice: vm.giudiceId === cb.myId, guarda: io ? io.guarda : true };
    me.decide = (me.giudice && !vm.giudiceVia) || (cb.sonoHost && (vm.giudiceVia || !vm.giudiceId));
    var sqs = squadreVm(vm), round = vm.totale > 1 ? "Round " + vm.round + " di " + vm.totale : "Round unico";

    // barra in alto
    var fase = vm.fase === "gioco" && step ? step.ic + " " + step.nome : vm.fase === "arringa" ? "🎤 L'arringa" : vm.fase === "giudizio" ? "⚖️ Il verdetto" : "🏅 Il verdetto";
    barra(ui, fase, round + (vm.fase === "gioco" && step ? " · fase " + step.fi + " di " + step.ftot : ""),
      "⚖️ " + (me.giudice ? "Tu" : vm.giudiceNome || "—") + (vm.giudiceVia ? " 💤" : ""));

    // il tavolo
    largo(ui, vm.fase !== "gioco");
    var aggiunte = 0, ultimoTipo = null;
    [0, 1].forEach(function (k) {
      var nomi = sqs[k].map(function (m) { return (m.id === cb.myId ? "Tu" : m.nome) + (m.via ? " 💤" : ""); }).join(", ");
      var a = aggiornaColonna(ui.cols[k], { titolo: titoloColonna(k, nomi), voci: vm.scen[k].voci, anima: !ui.nuova,
        turno: (vm.fase === "gioco" && step && step.sq === k) || (vm.fase === "arringa" && vm.parla === k),
        mia: me.sq === k, vince: vm.fase === "esito" && vm.vincitore === k });
      if (a) { aggiunte += a; ultimoTipo = vm.scen[k].voci[vm.scen[k].voci.length - 1].tipo; }
    });
    if (aggiunte && !ui.nuova) suono(ultimoTipo);

    // la riga del turno
    var turno = "";
    if (vm.fase === "gioco" && step) {
      if (vm.vuota) turno = "🎲 La " + nomeSq(step.sq) + " è rimasta senza giocatori: le carte le sceglie il caso…";
      else if (me.sq === step.sq) turno = emoSq(step.sq) + " Tocca a voi: " + istruzione(step, step.sq, true);
      else turno = emoSq(step.sq) + " Tocca alla " + nomeSq(step.sq) + ": " + istruzione(step, step.sq, false);
    } else if (vm.fase === "arringa") turno = "🎤 " + emoSq(vm.parla) + " Parla la " + nomeSq(vm.parla) + (me.sq === vm.parla ? " (voi!)" : "") + ": convincete il giudice!";
    else if (vm.fase === "giudizio") turno = me.decide ? "⚖️ Quale scenario è il migliore da vivere?" : "⚖️ Il giudice sta decidendo…";
    else if (vm.fase === "esito") turno = "🏅 Il round va alla " + nomeSq(vm.vincitore) + "!";
    testoSe(ui.turno, turno);

    // azione e piede: si rifanno solo quando cambia la situazione (la selezione resta)
    var chiave, fai;
    if (vm.fase === "gioco" && step) {
      if (me.giudice) { chiave = "giud"; fai = function () { messaggio(ui, "⚖️", "Sei il giudice: guarda il tavolo. Alla fine scegli tu lo scenario migliore da vivere."); }; }
      else if (me.sq < 0) {
        chiave = "guarda|" + me.guarda;
        fai = function () { messaggio(ui, "👀", me.guarda ? "Partita in corso: entri dal prossimo round. Intanto guardi!" : "Questo round lo giocano gli altri: tu guardi."); };
      } else {
        var mano = cb.mano(me.sq);
        if (!mano) { chiave = "carte"; fai = function () { messaggio(ui, "🃏", "Arrivano le tue carte…"); }; }
        else {
          var mio = step.sq === me.sq && !vm.vuota;
          var tipo = mio ? step.tipo : ((vm.prossimi && vm.prossimi[me.sq]) || "bonus"), altro = tipo === "bonus" ? "malus" : "bonus";
          chiave = "mano|" + mio + "|" + (mio ? step.i + "|" + step.n : "") + "|" + tipo + "|" + mano[tipo].join("§") + "|" + mano[altro].join("§");
          fai = function () {
            var bOk = null;
            var m = creaMano(t, { carte: mano[tipo], tipo: tipo, quante: mio ? step.n : 0, altre: { tipo: altro, carte: mano[altro] },
              onCambia: function (sel) { if (bOk) bOk.disabled = sel.length !== step.n; } });
            ui.azione.appendChild(m.nodo);
            if (mio) {
              bOk = el("button", { class: "btn btn-primario", text: "Gioca ▶", disabled: "disabled", onclick: function () {
                var s = m.sel(); if (s.length !== step.n) return;
                bOk.disabled = true; bOk.textContent = "…"; cb.onGioca(s);
              } });
              ui.piede.appendChild(bOk);
            } else notaPiede(ui, "Le tue carte per dopo (tocca per leggerle). Ora gioca la " + nomeSq(step.sq) + ".");
            m.adatta();
          };
        }
      }
    } else if (vm.fase === "arringa") {
      chiave = "arr|" + vm.parla + "|" + vm.timer.n + "|" + me.decide;
      fai = function () {
        if (vm.timer.sec) mettiTimer(t, ui.azione, vm.timer.sec);
        if (me.decide) {
          var b = el("button", { class: "btn btn-primario", text: vm.parla === 0 ? "Tocca alla " + nomeSq(1) + " ▶" : "Al verdetto ⚖️",
            onclick: function () { b.disabled = true; cb.onAvanti(); } });
          ui.piede.appendChild(b);
          if (!me.giudice) notaPiede(ui, "Il giudice è uscito: vai avanti tu.");
        } else notaPiede(ui, "Poi decide il giudice.");
      };
    } else if (vm.fase === "giudizio") {
      chiave = "giu|" + me.decide;
      fai = function () {
        if (!me.decide) return;
        if (!me.giudice) notaPiede(ui, "Il giudice è uscito: decidi tu.");
        [0, 1].forEach(function (k) {
          var b = el("button", { class: "btn sp-vota c" + k, text: emoSq(k) + " " + nomeSq(k), onclick: function () { b.disabled = true; cb.onGiudica(k); } });
          ui.piede.appendChild(b);
        });
      };
    } else if (vm.fase === "esito") {
      var punti = vm.giocatori.filter(function (g) { return g.punti || (vm.assegna[g.id] != null); });
      chiave = "esi|" + vm.round + "|" + JSON.stringify(punti.map(function (g) { return [g.id, g.punti]; }));
      fai = function () {
        ui.azione.appendChild(classificaCorta(t, punti.map(function (g) { return { id: g.id, nome: g.id === cb.myId ? "Tu" : g.nome, punti: g.punti }; }), cb.myId));
        var ultimo = vm.round >= vm.totale;
        if (cb.sonoHost) ui.piede.appendChild(el("button", { class: "btn btn-primario", text: ultimo ? "Classifica finale 🏆" : "Prossimo round ▶",
          onclick: function () { chiudiLente(); cb.onProssimo(); } }));
        else notaPiede(ui, ultimo ? "Tra poco la classifica finale." : "Il prossimo round lo fa partire chi organizza.");
      };
      var visto = vm.sessione + "|" + vm.round;
      if (V.esitoVisto !== visto) { V.esitoVisto = visto; verdetto(ui, vm.vincitore, "Vince la " + nomeSq(vm.vincitore) + "!"); }
    } else { chiave = "?"; fai = function () {}; }
    if (ui.chiave !== chiave) { ui.chiave = chiave; svuota(ui.azione); svuota(ui.piede); fai(); }
    if (vm.fase !== "gioco") adattaTavolo(ui);
  }

  function fineOn(V, vm, cb) {
    var t = V.t, el = t.el;
    if (V.fineSess === vm.sessione && V.fineS && document.body.contains(V.fineS)) return;   // già mostrata
    V.fineSess = vm.sessione;
    chiudiLente();
    var cl = vm.classifica || [];
    salvaTrofeiSipero(t, { online: true, mioId: cb.myId, mioRuolo: vm.assegna ? vm.assegna[cb.myId] : null, manuale: vm.manuale,
      sessione: vm.sessione, classifica: cl, statFine: vm.statFine });
    var primi = cl.filter(function (r) { return r.pos === 1; });
    var titolo = vm.manuale && vm.vincitore != null ? "Vince la " + nomeSq(vm.vincitore) + "!" :
      primi.length === 1 ? "Vince " + (primi[0].id === cb.myId ? "tu" : primi[0].nome) + "!" : "Pari merito in testa!";
    var s = t.schermata({ icona: "🏆", titolo: titolo, sotto: "Classifica finale" });
    var ol = el("ol", { class: "classifica" });
    cl.forEach(function (r) {
      ol.appendChild(el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglia(r.pos) }),
        el("span", { class: "nome", text: r.nome + (r.id === cb.myId ? " (tu)" : "") }),
        el("span", { class: "punti", text: r.punti + (r.punti === 1 ? " punto" : " punti") })]));
    });
    s._contenuto.appendChild(ol);
    if (!cl.some(function (r) { return r.id === cb.myId; })) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Questa partita l'hai guardata: giochi dalla prossima." }));
    if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Se chi organizza fa un'altra partita, torni da solo nella saletta." }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    V.fineS = s;
    t.mostra(s);
  }
})();
