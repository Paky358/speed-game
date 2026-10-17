(function () {
  "use strict";

  var MIN = 4, MAX = 16, SQUADRE = ["A", "B"];
  var MAX_PASSI = 3;
  var ATTESA_PRONTO = 20000;   // chi deve spiegare ha 20 s per toccare "Pronti, via!", poi si parte da soli
  var ANNULLA_MS = 5000;       // per 5 s l'host o chi spiega possono annullare un BUZZ
  var ATTESA_RIFAI = 45, ATTESA_CHIUDI = 120;   // manca qualcuno e non torna: dopo 45 s si rifanno le squadre (in pochi: dopo 2 minuti si chiude)
  var BLOCCO_MS = 400;         // dopo un tocco i tasti si fermano un attimo (niente doppio tocco)
  var LIVELLI = { 1: [1], 2: [1, 2, 3], 3: [2, 3] };   // carte: 1 facili, 2 miste, 3 difficili
  var CHIAVE_VISTE = "sg-taboo-viste";

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
  function puntiTesto(n) { return n + (Math.abs(n) === 1 ? " punto" : " punti"); }

  // ---- il mazzo: le carte già uscite su questo telefono vanno in fondo, così non tornano subito ----
  function leggiViste() { try { return JSON.parse(localStorage.getItem(CHIAVE_VISTE) || "{}") || {}; } catch (e) { return {}; } }
  function scriviViste(o) { try { localStorage.setItem(CHIAVE_VISTE, JSON.stringify(o)); } catch (e) {} }
  function carteDelLivello(liv) {
    var tutte = window.SG_TABOO_CARTE || [], ok = LIVELLI[liv] || LIVELLI[2];
    var scelte = tutte.filter(function (c) { return ok.indexOf(c.l || 1) >= 0; });
    return scelte.length >= 40 ? scelte : tutte.slice();
  }
  function mazzo(liv) {
    var tutte = carteDelLivello(liv), viste = leggiViste(), nuove = [], gia = [];
    tutte.forEach(function (c) { (viste[c.p] ? gia : nuove).push(c); });
    if (nuove.length < 60) {   // uscite quasi tutte: si ricomincia il giro
      tutte.forEach(function (c) { delete viste[c.p]; }); scriviViste(viste);
      nuove = tutte; gia = [];
    }
    return mescola(nuove).concat(mescola(gia));
  }
  function segnaViste(parole) {
    if (!parole.length) return;
    var viste = leggiViste();
    if (Object.keys(viste).length > 4000) viste = {};
    parole.forEach(function (p) { viste[p] = 1; }); scriviViste(viste);
  }

  // ---- suoni piccoli fatti al volo (niente file) ----
  var NOTE = {
    giusta: [[880, 0, 0.09, "sine"], [1320, 0.08, 0.16, "sine"]],
    buzz: [[150, 0, 0.5, "sawtooth"], [158, 0, 0.5, "square"]],
    passo: [[560, 0, 0.07, "triangle"], [400, 0.07, 0.1, "triangle"]],
    tic: [[1100, 0, 0.04, "square"]],
    via: [[660, 0, 0.1, "triangle"], [990, 0.1, 0.18, "triangle"]],
    gong: [[196, 0, 1.1, "sine"], [294, 0, 0.8, "sine"]],
    fanfara: [[523, 0, 0.14, "triangle"], [659, 0.14, 0.14, "triangle"], [784, 0.28, 0.14, "triangle"], [1047, 0.42, 0.5, "triangle"]]
  };
  function suono(tipo) {
    var ac = null; try { ac = SG.audioCtx && SG.audioCtx(); } catch (e) {}
    if (!ac || !NOTE[tipo]) return;
    try {
      var ora = ac.currentTime;
      NOTE[tipo].forEach(function (n) {
        var o = ac.createOscillator(), g = ac.createGain(), v = tipo === "buzz" ? 0.09 : (tipo === "tic" ? 0.05 : 0.12);
        o.type = n[3]; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, ora + n[1]); g.gain.exponentialRampToValueAtTime(v, ora + n[1] + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, ora + n[1] + n[2]);
        o.connect(g); g.connect(ac.destination); o.start(ora + n[1]); o.stop(ora + n[1] + n[2] + 0.05);
      });
    } catch (e) {}
  }

  function stile() {
    if (document.getElementById("sg-taboo-css")) return;
    var s = document.createElement("style"); s.id = "sg-taboo-css";
    s.textContent = [
      ".schermata.tb-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#171a2d;color:#fff}",
      ".schermata.tb-piena>.testa,.schermata.tb-piena>.piede{display:none}",
      ".schermata.tb-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".tb{height:var(--alt,100dvh);box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;gap:clamp(7px,1.6vh,14px);padding:calc(10px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));font-family:inherit}",
      ".tb-top{display:grid;grid-template-columns:36px minmax(0,1fr) auto minmax(0,1fr) 36px;align-items:center;gap:6px}",
      ".tb-mini{width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.13);color:#fff;font:inherit;font-size:16px;padding:0;touch-action:manipulation}",
      ".tb-squadra{min-width:0;text-align:center;border-radius:13px;padding:5px 6px;background:rgba(255,255,255,.1)}.tb-squadra span{display:block;font-size:clamp(10px,2.9vw,13px);font-weight:800;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tb-squadra.mia{outline:2px solid #ffd43b;outline-offset:-2px}.tb-squadra b{display:block;font-size:clamp(22px,7vw,32px);line-height:1.1}.tb-squadra.a{box-shadow:inset 0 -4px #e64980}.tb-squadra.b{box-shadow:inset 0 -4px #4263eb}.tb-squadra.mia span::after{content:' · tu'}",
      ".tb-bump{animation:tbBump .35s ease-out}@keyframes tbBump{0%{transform:scale(1.35)}100%{transform:scale(1)}}",
      ".tb-timer{min-width:64px;font-size:clamp(32px,10vw,46px);font-weight:1000;line-height:1;text-align:center;font-variant-numeric:tabular-nums}.tb-timer.testo{font-size:clamp(18px,5.5vw,24px)}",
      ".tb-barra{height:10px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden;flex:none}.tb-barra i{display:block;height:100%;background:#51cf66;transform-origin:left center;transition:transform .2s linear}.tb-barra.rossa i{background:#fa5252}",
      ".tb-turno{font-size:clamp(13px,3.8vw,17px);font-weight:850;text-align:center;opacity:.88;min-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".tb-centro{position:relative;flex:1;min-height:0;display:flex;flex-direction:column}",
      ".tb-corpo{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px}",
      ".tb-carta{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,1.8vh,16px);border-radius:24px;background:#fff;color:#171a2d;padding:12px;box-shadow:0 12px 32px #0004}",
      ".tb-entra{animation:tbEntra .28s ease-out}@keyframes tbEntra{0%{transform:translateX(40px) scale(.96);opacity:0}100%{transform:none;opacity:1}}",
      ".tb-trema{animation:tbTrema .4s}@keyframes tbTrema{0%,100%{transform:none}20%{transform:translateX(-10px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}",
      ".tb-parola{font-size:clamp(32px,10vw,56px);font-weight:1000;line-height:1.02;text-align:center;overflow-wrap:anywhere}",
      ".tb-vietate{display:grid;grid-template-columns:1fr 1fr;gap:7px;width:100%}.tb-vietata{border-radius:12px;background:#fff0f0;color:#a61e4d;text-align:center;font-size:clamp(15px,4.5vw,21px);font-weight:900;padding:7px 5px}.tb-vietata:last-child:nth-child(odd){grid-column:1/-1}",
      ".tb-promemoria{font-size:clamp(11px,3vw,13px);font-weight:700;color:#868e96;text-align:center}",
      ".tb-attesa-carta{font-size:clamp(20px,6vw,28px);font-weight:900;color:#868e96}",
      ".tb-nascondi{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px}.tb-indovina{font-size:clamp(30px,10vw,56px);font-weight:1000;line-height:1.05}.tb-sub{font-size:clamp(14px,4.2vw,18px);font-weight:750;opacity:.85}",
      ".tb-conto{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.tb-conto span{border-radius:999px;background:rgba(255,255,255,.12);padding:6px 12px;font-weight:900;font-size:clamp(14px,4vw,18px)}.tb-conto .fuoco{background:#ff922b;color:#2b1400}",
      ".tb-av{display:flex;justify-content:center;align-items:flex-end;height:clamp(90px,20vh,170px)}.tb-av svg{height:100%;width:auto}.tb-av.piccolo{height:44px}",
      ".tb-tasti{display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:none}.tb-btn{min-height:72px;padding:10px 8px;border:0;border-radius:18px;background:#51cf66;color:#10200f;font:inherit;font-size:clamp(17px,5vw,23px);font-weight:1000;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 6px 0 #0003}.tb-btn:active{transform:translateY(2px)}.tb-btn:disabled{opacity:.45;box-shadow:none}.tb-btn.pass{background:#ffd43b;color:#332500}.tb-btn.buzz{grid-column:1/-1;background:#fa5252;color:#fff;min-height:96px;font-size:clamp(27px,8vw,38px)}.tb-btn.largo{grid-column:1/-1}.tb-btn.grigio{background:rgba(255,255,255,.14);color:#fff;box-shadow:none;min-height:56px;font-size:clamp(15px,4.4vw,18px)}.tb-btn.blu{background:#4dabf7;color:#04213a}",
      ".tb-nota{grid-column:1/-1;text-align:center;font-size:clamp(13px,3.8vw,16px);font-weight:750;opacity:.8;min-height:1.2em}",
      ".tb-banner{position:absolute;left:8px;right:8px;top:8px;z-index:3;border-radius:16px;background:#c92a2a;color:#fff;padding:10px 12px;text-align:center;box-shadow:0 10px 26px #0006;opacity:0;transform:translateY(-12px);transition:opacity .2s,transform .2s;pointer-events:none}.tb-banner.vis{opacity:1;transform:none;pointer-events:auto}.tb-banner.verde{background:#2b8a3e}.tb-banner b{display:block;font-size:clamp(19px,5.6vw,25px)}.tb-banner small{display:block;font-size:clamp(13px,3.7vw,16px);font-weight:750;opacity:.92}.tb-banner .tb-btn{min-height:44px;margin-top:8px;width:100%;font-size:17px;background:#fff;color:#c92a2a}",
      ".tb-volo{position:absolute;left:50%;top:42%;z-index:2;pointer-events:none;font-size:clamp(30px,9vw,46px);font-weight:1000;text-shadow:0 3px 10px #0007;animation:tbVolo .9s ease-out forwards}.tb-volo.ok{color:#69db7c}.tb-volo.no{color:#ff6b6b}.tb-volo.pa{color:#ffd43b}@keyframes tbVolo{0%{transform:translate(-50%,10px) scale(.7);opacity:0}25%{transform:translate(-50%,0) scale(1.1);opacity:1}100%{transform:translate(-50%,-70px) scale(1);opacity:0}}",
      ".tb-riep{flex:1 1 auto;min-height:0;overflow:hidden;border-radius:16px;background:rgba(255,255,255,.08);padding:10px;display:flex;flex-direction:column;gap:6px}.tb-riep h3{margin:0;font-size:clamp(15px,4.3vw,19px);display:flex;justify-content:space-between;gap:8px}.tb-riep h3 em{font-style:normal;white-space:nowrap}",
      ".tb-chips{min-height:0;overflow:hidden;line-height:1.15}.tb-chip{display:inline-block;border-radius:999px;padding:4px 10px;margin:2px 2px;font-weight:850;font-size:clamp(12px,3.4vw,15px)}.tb-chip.ok{background:#2b8a3e}.tb-chip.no{background:#c92a2a}.tb-chip.pa{background:#e67700}.tb-chip.altre{background:rgba(255,255,255,.18)}",
      ".tb-prossimo{flex:none;display:flex;align-items:center;gap:12px;border-radius:16px;background:rgba(255,255,255,.1);padding:8px 12px}.tb-prossimo .tb-av{height:clamp(70px,13vh,110px);flex:none}.tb-prossimo b{display:block;font-size:clamp(20px,6vw,28px);line-height:1.1}.tb-prossimo span{display:block;font-size:clamp(13px,3.8vw,16px);font-weight:750;opacity:.85;margin-top:3px}",
      ".tb-fine{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:clamp(6px,1.4vh,12px);overflow:hidden}.tb-fine h1{font-size:clamp(28px,8.5vw,44px);margin:0;line-height:1.05}.tb-fine p{margin:0;font-size:clamp(14px,4vw,17px);font-weight:750;opacity:.88}",
      ".tb-colonne{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}.tb-col{border-radius:16px;background:rgba(255,255,255,.08);padding:8px 6px;min-width:0}.tb-col.a{box-shadow:inset 0 -4px #e64980}.tb-col.b{box-shadow:inset 0 -4px #4263eb}.tb-col h3{margin:0 0 4px;font-size:clamp(14px,4vw,18px)}.tb-col .tb-pt{font-size:clamp(26px,8vw,38px);font-weight:1000;line-height:1}",
      ".tb-gente{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 4px;margin-top:4px}.tb-gente div{display:flex;flex-direction:column;align-items:center;width:52px}.tb-gente small{font-size:11px;font-weight:800;max-width:52px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tb-col.vince .tb-av{animation:tbSalta 1s ease-in-out infinite}.tb-col.vince .tb-gente div:nth-child(2n) .tb-av{animation-delay:-.5s}@keyframes tbSalta{0%,100%{transform:none}50%{transform:translateY(-8px)}}",
      ".tb-premi{display:flex;flex-direction:column;gap:5px;width:100%}.tb-premi div{border-radius:12px;background:rgba(255,212,59,.14);padding:6px 10px;font-size:clamp(13px,3.8vw,16px);font-weight:800}",
      ".tb-squad-box{display:flex;flex-direction:column;gap:4px;margin:2px 0}.tb-sq-testa{display:flex;align-items:center;gap:8px;min-height:28px}.tb-squad-lista{display:flex;gap:4px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;align-items:center;border-radius:12px;padding:4px 6px;background:rgba(0,0,0,.05)}.tb-squad-lista::-webkit-scrollbar{display:none}.tb-squad-lista>*{flex:none}.tb-squad-lista.a{border-left:4px solid #e64980}.tb-squad-lista.b{border-left:4px solid #4263eb}.tb-squad-lista b{font-size:13px;min-width:2.4em;white-space:nowrap}.tb-scelta{border:0;border-radius:999px;padding:4px 10px;color:#fff;font:inherit;font-size:13px;font-weight:850;line-height:1.25;background:#383d59;max-width:9.5em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tb-scelta.a{background:#c2255c}.tb-scelta.b{background:#364fc7}.tb-scelta.tu{outline:2px solid #ffd43b}.tb-entra-sq{border:1.5px dashed currentColor;border-radius:999px;padding:3px 9px;background:transparent;font:inherit;font-size:12px;font-weight:850;line-height:1.25;color:inherit;opacity:.75}.tb-casuale{flex:none;border:0;border-radius:999px;padding:5px 11px;background:#ffd43b;color:#332500;font:inherit;font-size:13px;font-weight:950}.tb-sq-nota{min-width:0;font-size:12px;font-weight:700;line-height:1.25;opacity:.75}",
      ".tb-tasti .sl-faccine{grid-column:1/-1}",
      // su questo telefono: le squadre da toccare, chi controlla, le carte del riepilogo che si correggono
      ".tb-loc-squadre{justify-content:flex-start;padding-top:4px}.tb-loc-squadre .tb-colonne{flex:1;min-height:0}.tb-loc-squadre .tb-col{display:flex;flex-direction:column;min-height:0;overflow:hidden}",
      ".tb-loc-nomi{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-content:flex-start;min-height:0;overflow:hidden;padding-top:4px}.tb-loc-nomi .tb-scelta{font-size:clamp(14px,4vw,17px);padding:7px 12px;max-width:100%}",
      ".tb-loc-ctrl{width:100%;box-sizing:border-box;border-radius:16px;background:rgba(250,82,82,.16);border:2px solid rgba(250,82,82,.55);padding:8px 12px}.tb-loc-ctrl b{display:block;font-size:clamp(17px,5vw,22px)}.tb-loc-ctrl span{display:block;font-size:clamp(13px,3.7vw,16px);font-weight:700;opacity:.9;margin-top:2px}",
      "button.tb-chip{border:0;color:#fff;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer}.tb-chip.nu{background:rgba(255,255,255,.22)}.tb-loc-corr{color:#fff;opacity:.7;margin-top:auto}",
      "@media(max-height:700px){.tb{gap:6px;padding-top:calc(6px + env(safe-area-inset-top));padding-bottom:calc(8px + env(safe-area-inset-bottom))}.tb-timer{font-size:34px}.tb-btn{min-height:60px}.tb-btn.buzz{min-height:78px}.tb-carta{gap:7px;padding:9px}.tb-vietata{padding:5px}.tb-av{height:84px}}"
    ].join("");
    document.head.appendChild(s);
  }

  // tasto che risponde al primo tocco (pointerup), senza il ritardo del click
  function bottone(t, classe, testo, fn) {
    var b = t.el("button", { class: "tb-btn " + (classe || ""), type: "button", text: testo });
    var giu = false;
    b.addEventListener("pointerdown", function (e) { if (b.disabled) return; giu = true; e.preventDefault(); });
    b.addEventListener("pointerup", function (e) { if (!giu || b.disabled) return; giu = false; e.preventDefault(); try { SG.audioCtx && SG.audioCtx(); } catch (_) {} fn(); });
    b.addEventListener("pointercancel", function () { giu = false; });
    b.addEventListener("pointerleave", function () { giu = false; });
    return b;
  }
  function avatarNodo(t, cfg, nome, classe) {
    var d = t.el("div", { class: "tb-av " + (classe || "") });
    var c = cfg || (window.SGOmino ? SGOmino.casuale(nome || "?") : null);
    if (c && window.SGOmino) d.innerHTML = SGOmino.svg(c); else d.textContent = "🙂";
    return d;
  }

  // ---- le squadre nella saletta: le vedono tutti; ognuno tocca una squadra per cambiarla, l'host sposta chiunque ----
  function boxSquadre(t, o) {
    var box = t.el("div", { class: "tb-squad-box" }), firma = "";
    // compatto: una riga sola per squadra (con tanti nomi la riga scorre di lato), tasti piccoli: la saletta sta in uno schermo anche a 360x640
    box.aggiorna = function (giocatori, squadre, mioId) {
      var f = JSON.stringify([giocatori.map(function (p) { return p.id + ":" + p.nome; }), squadre, mioId]);
      if (f === firma) return;
      firma = f; box.innerHTML = "";
      var testa = t.el("div", { class: "tb-sq-testa" });
      if (o.host) testa.appendChild(t.el("button", { class: "tb-casuale", type: "button", text: "🔀 A caso", onclick: o.aCaso }));
      var dentro = o.host || giocatori.some(function (p) { return p.id === mioId; });   // (chi guarda soltanto non ha una squadra)
      testa.appendChild(t.el("div", { class: "tb-sq-nota", text: o.host ? "Tocca un nome per spostarlo nell'altra squadra." : dentro ? "Tocca il tuo nome o «Vai qui» per cambiare squadra." : "Le squadre di questa partita." }));
      box.appendChild(testa);
      [0, 1].forEach(function (s) {
        var r = t.el("div", { class: "tb-squad-lista " + (s ? "b" : "a") });
        var membri = giocatori.filter(function (p) { return (squadre[p.id] === 1 ? 1 : 0) === s; });
        r.appendChild(t.el("b", { text: SQUADRE[s] + " · " + membri.length }));
        membri.forEach(function (p) {
          var tu = p.id === mioId;
          r.appendChild(t.el("button", { class: "tb-scelta " + (s ? "b" : "a") + (tu ? " tu" : ""), type: "button", text: tu ? "Tu" : p.nome,
            onclick: function () { if (o.host || tu) o.sposta(p.id, 1 - s); } }));
        });
        var mia = squadre[mioId] === 1 ? 1 : 0;
        if (!o.host && dentro && mia !== s) r.appendChild(t.el("button", { class: "tb-entra-sq", type: "button", text: "+ Vai qui", onclick: function () { o.sposta(mioId, s); } }));
        box.appendChild(r);
      });
    };
    return box;
  }

  // ---- la schermata di gioco, uguale per host e amici: si disegna dalla "foto" (vm) ----
  // o: { sonoHost, mioId(), azione(tipo, extra), esci(), pausa(), rifai(), chiudiPartita(), nuova() }
  function creaVista(t, o) {
    var V = { ui: null, v: null, key: "", seq: null, fineLocale: 0, ultimoSec: -1, omini: Object.create(null), bloccoFino: 0, tBanner: null, festa: "" };
    function io() { return o.mioId(); }
    function giocatore(v, id) { return (v.giocatori || []).find(function (p) { return p.id === id; }) || null; }
    function nomeDi(v, id) { var p = giocatore(v, id); return p ? p.nome : "…"; }
    function squadraDi(v, id) { return v.squadre && v.squadre[id] === 1 ? 1 : 0; }
    function dentro(v) { return !!giocatore(v, io()); }
    function faccine(dove) { var f = t.faccine ? t.faccine() : null; if (f) dove.appendChild(f); }
    function ruolo(v) {
      var me = io();
      if (!dentro(v)) return "guarda";   // arrivato a partita cominciata: guarda e gioca dalla prossima
      if (!v.attivo) return "nessuno";
      if (me === v.attivo) return "spiega";
      return squadraDi(v, me) === v.team ? "compagno" : "avversario";
    }
    function tasto(classe, testo, fn) {
      return bottone(t, classe, testo, function () { if (Date.now() < V.bloccoFino) return; V.bloccoFino = Date.now() + BLOCCO_MS; fn(); });
    }
    function esci() {
      if (V.v && V.v.fase === "fine") return o.esci();
      t.conferma(o.sonoHost ? "Chiudere la partita per tutti?" : "Uscire dalla partita?", o.sonoHost ? "La partita finisce anche per gli amici." : null, o.sonoHost ? "Chiudi" : "Esci", function () { o.esci(); });
    }
    function frame() {
      stile();
      var s = t.schermata({}); s.classList.add("tb-piena");
      var ui = V.ui = { s: s };
      ui.pausa = t.el("button", { class: "tb-mini", type: "button", text: "⏸️", title: "Pausa", onclick: function () { if (o.pausa) o.pausa(); } });
      ui.esci = t.el("button", { class: "tb-mini", type: "button", text: "✕", title: "Esci", onclick: esci });
      ui.box = [0, 1].map(function (q) { var b = t.el("div", { class: "tb-squadra " + (q ? "b" : "a") }, [t.el("span", { text: "Squadra " + SQUADRE[q] }), t.el("b", { text: "0" })]); return b; });
      ui.score = ui.box.map(function (b) { return b.querySelector("b"); });
      ui.timer = t.el("div", { class: "tb-timer" });
      ui.barraI = t.el("i");
      ui.barra = t.el("div", { class: "tb-barra" }, [ui.barraI]);
      ui.turno = t.el("div", { class: "tb-turno" });
      ui.corpo = t.el("div", { class: "tb-corpo" });
      ui.banner = t.el("div", { class: "tb-banner" });
      ui.centro = t.el("div", { class: "tb-centro" }, [ui.corpo, ui.banner]);
      ui.tasti = t.el("div", { class: "tb-tasti" });
      s._contenuto.appendChild(t.el("div", { class: "tb" }, [t.el("div", { class: "tb-top" }, [ui.pausa, ui.box[0], ui.timer, ui.box[1], ui.esci]), ui.barra, ui.turno, ui.centro, ui.tasti]));
      t.mostra(s);
      V.key = ""; V.festa = "";
    }

    // ---- quello che è appena successo: suono, scritta che vola, avviso del BUZZ ----
    function vola(testo, classe) {
      if (!V.ui) return;
      var n = t.el("div", { class: "tb-volo " + classe, text: testo });
      V.ui.centro.appendChild(n); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 950);
    }
    function banner(titolo, sotto, verde, ms, conAnnulla) {
      var b = V.ui.banner; b.innerHTML = ""; b.classList.toggle("verde", !!verde);
      b.appendChild(t.el("b", { text: titolo })); if (sotto) b.appendChild(t.el("small", { text: sotto }));
      if (conAnnulla) b.appendChild(tasto("", "↩️ Annulla BUZZ", function () { o.azione("annulla", { seq: conAnnulla }); nascondiBanner(); }));
      b.classList.add("vis");
      if (V.tBanner) clearTimeout(V.tBanner);
      V.tBanner = setTimeout(nascondiBanner, ms);
    }
    function nascondiBanner() { if (V.tBanner) { clearTimeout(V.tBanner); V.tBanner = null; } if (V.ui) V.ui.banner.classList.remove("vis"); }
    function evento(ev, v) {
      var r = ruolo(v);
      if (ev.tipo === "giusta") { suono("giusta"); vola("✅ +1", "ok"); }
      else if (ev.tipo === "passo") { if (r !== "compagno") suono("passo"); vola("⏭️ Passata", "pa"); }
      else if (ev.tipo === "buzz") {
        suono("buzz"); vola("❌ −1", "no");
        var c = V.ui.corpo.querySelector(".tb-carta, .tb-nascondi"); if (c) { c.classList.remove("tb-entra"); c.classList.add("tb-trema"); }
        var puo = (o.sonoHost || io() === v.attivo);
        banner("🚨 BUZZ di " + (ev.nome || "…") + "!", "Parola vietata detta · carta: " + (ev.parola || ""), false, puo ? ANNULLA_MS : 2400, puo ? ev.seq : 0);
      } else if (ev.tipo === "annullato") { suono("via"); banner("↩️ BUZZ annullato", "Il punto torna alla squadra " + SQUADRE[v.team], true, 2200); }
    }

    // ---- la parte che cambia: si rifà solo quando cambia carta, turno o fase ----
    function chiave(v) {
      var r = ruolo(v);
      if (v.fase === "turno") return ["T", v.turno, v.chiaveCarta, r, v.carta ? 1 : 0, v.pausa ? 1 : 0, v.passati].join("|");
      if (v.fase === "pronto") return ["P", v.turno, v.attivo, r, v.avviso || "", v.pausa ? 1 : 0, (v.riepilogo && v.riepilogo.turno) || 0, o.sonoHost ? v.presenti : 0, v.rifatto || 0].join("|");
      return "F|" + v.partitaId;
    }
    function corpo(v) {
      var ui = V.ui; ui.corpo.innerHTML = ""; ui.tasti.innerHTML = ""; ui.conta = null; nascondiBanner();
      if (v.fase === "turno") corpoTurno(v, ui);
      else if (v.fase === "pronto") corpoPronto(v, ui);
      else corpoFine(v, ui);
    }
    function carta(c, conPromemoria) {
      var box = t.el("div", { class: "tb-carta tb-entra" });
      if (!c) { box.appendChild(t.el("div", { class: "tb-attesa-carta", text: "Carta in arrivo…" })); return box; }
      box.appendChild(t.el("div", { class: "tb-parola", text: c.p }));
      box.appendChild(t.el("div", { class: "tb-vietate" }, (c.v || []).map(function (w) { return t.el("div", { class: "tb-vietata", text: w }); })));
      if (conPromemoria) box.appendChild(t.el("div", { class: "tb-promemoria", text: "Vietati anche: la parola stessa, un suo pezzo, i gesti" }));
      return box;
    }
    function corpoTurno(v, ui) {
      var r = ruolo(v);
      if (v.pausa) {
        ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, [t.el("div", { class: "tb-indovina", text: "⏸️ Pausa" }), t.el("div", { class: "tb-sub", text: o.sonoHost ? "Il tempo è fermo per tutti." : "L'host ha fermato il tempo." })]));
        if (o.sonoHost) ui.tasti.appendChild(tasto("largo", "▶ Riprendi", function () { o.pausa(); }));
        return;
      }
      if (r === "guarda") {   // arrivato a partita cominciata: vede la carta (come chi controlla), senza tasti
        ui.corpo.appendChild(carta(v.carta, false));
        ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: "👀 Partita in corso: giochi dalla prossima." }));
        faccine(ui.tasti);
        return;
      }
      if (r === "spiega" || r === "avversario") {
        ui.corpo.appendChild(carta(v.carta, r === "spiega"));
        if (r === "spiega") {
          var ok = tasto("", "✅ Indovinata", function () { o.azione("indovinata"); });
          var pa = tasto("pass", "⏭️ Passo " + v.passati + "/" + MAX_PASSI, function () { o.azione("passo"); });
          ok.disabled = !v.carta; pa.disabled = !v.carta || v.passati >= MAX_PASSI;
          ui.tasti.appendChild(ok); ui.tasti.appendChild(pa);
        } else {
          var bz = tasto("buzz", "❌ BUZZ", function () { o.azione("buzz"); }); bz.disabled = !v.carta;
          ui.tasti.appendChild(bz);
        }
      } else {
        // i compagni di chi spiega: l'avatar di chi spiega, quante ne avete fatte, la serie
        var conto = t.el("div", { class: "tb-conto" }, [t.el("span", { text: "✅ " + (v.giusteTurno || 0) + (v.giusteTurno === 1 ? " indovinata" : " indovinate") })]);
        if (v.combo >= 3) conto.appendChild(t.el("span", { class: "fuoco", text: "🔥 " + v.combo + " di fila!" }));
        ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, [
          avatarNodo(t, V.omini[v.attivo], nomeDi(v, v.attivo)),
          t.el("div", { class: "tb-indovina", text: "Indovina!" }),
          t.el("div", { class: "tb-sub", text: "Ascolta " + nomeDi(v, v.attivo) + " e grida la risposta" }), conto]));
      }
    }
    function riepilogo(v, ui) {
      var r = v.riepilogo; if (!r) return;
      var delta = r.giuste.length - r.buzz.length;
      var box = t.el("div", { class: "tb-riep" }, [t.el("h3", {}, [t.el("span", { text: r.nome + (r.uscito ? " (uscito)" : "") + " · Squadra " + SQUADRE[r.team] }), t.el("em", { text: (delta > 0 ? "+" : "") + delta })])]);
      var chips = t.el("div", { class: "tb-chips" }), voci = [];
      r.giuste.forEach(function (p) { voci.push(["ok", "✅ " + p]); });
      r.buzz.forEach(function (p) { voci.push(["no", "❌ " + p]); });
      r.passate.forEach(function (p) { voci.push(["pa", "⏭️ " + p]); });
      if (!voci.length) chips.appendChild(t.el("span", { class: "tb-chip altre", text: "Nessuna carta in questo turno" }));
      var max = window.innerHeight < 700 ? 9 : 14;
      voci.slice(0, voci.length > max ? max - 1 : max).forEach(function (x) { chips.appendChild(t.el("span", { class: "tb-chip " + x[0], text: x[1] })); });
      if (voci.length > max) chips.appendChild(t.el("span", { class: "tb-chip altre", text: "+" + (voci.length - max + 1) + " altre" }));
      box.appendChild(chips); ui.corpo.appendChild(box);
    }
    function corpoPronto(v, ui) {
      riepilogo(v, ui);
      // la partita è ripresa a metà turno (l'host aveva ricaricato): quel turno si rifà da capo
      if (v.rifatto && v.attivo && !v.avviso) ui.corpo.appendChild(t.el("div", { class: "tb-nota", text: "🔁 La partita è ripresa: questo turno si rifà da capo, con il tempo intero e una carta nuova." }));
      var me = io();
      if (v.avviso) {
        ui.corpo.appendChild(t.el("div", { class: "tb-prossimo" }, [t.el("div", {}, [t.el("b", { text: "⏳ Aspettiamo…" }), t.el("span", { text: v.avviso })])]));
        if (o.sonoHost) {
          var rifai = tasto("blu", "🔀 Rifai le squadre", function () { o.rifai(); }); rifai.disabled = (v.presenti || 0) < MIN;
          var chiudiP = tasto("grigio", "🏁 Chiudi la partita", function () { t.conferma("Chiudere la partita?", "Non conterà né vittorie né trofei.", "Chiudi", function () { o.chiudiPartita(); }); });
          ui.tasti.appendChild(rifai); ui.tasti.appendChild(chiudiP);
          ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: rifai.disabled ? "Per rifare le squadre servono almeno 4 persone collegate." : "Se tornano, si riparte da soli." }));
          // la partita non resta ferma: se nessuno torna, dopo un po' si rifanno le squadre (o, se siete in pochi, si chiude)
          var kAv = "tb-avviso|" + v.partitaId + "|" + v.turno + "|" + (rifai.disabled ? "chiudi" : "rifai");
          if (t.contoAvanti) {
            if (!rifai.disabled) t.contoAvanti(rifai, ATTESA_RIFAI, function () { o.rifai(); }, kAv);
            else t.contoAvanti(chiudiP, ATTESA_CHIUDI, function () { o.chiudiPartita(); }, kAv);
          }
        } else ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: "Se tornano, si riparte da soli." }));
        faccine(ui.tasti);
        return;
      }
      if (!v.attivo) {   // l'ultimo turno è finito
        ui.corpo.appendChild(t.el("div", { class: "tb-prossimo" }, [t.el("div", {}, [t.el("b", { text: "🏁 Ultimo turno finito!" }), t.el("span", { text: "Tra un attimo vediamo chi ha vinto…" })])]));
        return;
      }
      var r = ruolo(v), nome = nomeDi(v, v.attivo);
      var sotto = r === "spiega" ? "Spiega alla tua squadra senza dire le parole vietate." : (r === "compagno" ? "Tu indovini: ascolta " + nome + "." :
        r === "guarda" ? "Tu guardi: giochi dalla prossima partita." : "Tu controlli: premi BUZZ se dice una parola vietata.");
      ui.corpo.appendChild(t.el("div", { class: "tb-prossimo" }, [avatarNodo(t, V.omini[v.attivo], nome),
        t.el("div", {}, [t.el("b", { text: r === "spiega" ? "Tocca a te!" : "Tocca a " + nome }), t.el("span", { text: "Squadra " + SQUADRE[v.team] + " · " + sotto })])]));
      if (v.pausa) {
        ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: "⏸️ Pausa: si riparte quando l'host vuole." }));
        if (o.sonoHost) ui.tasti.appendChild(tasto("largo", "▶ Riprendi", function () { o.pausa(); }));
        return;
      }
      if (r === "spiega") ui.tasti.appendChild(tasto("largo", "▶ Pronti, via!", function () { o.azione("pronto"); }));
      ui.conta = t.el("div", { class: "tb-nota" }); ui.tasti.appendChild(ui.conta);
      if (r !== "spiega") faccine(ui.tasti);   // tra un turno e l'altro: le faccine
    }
    function corpoFine(v, ui) {
      var f = v.fine || {}, win = f.vincitore, me = io();
      var titolo = f.annullata ? "Partita chiusa" : (win < 0 ? "Pareggio! 🤝" : "Squadra " + SQUADRE[win] + " vince! 🏆");
      ui.corpo.appendChild(t.el("div", { class: "tb-fine" }, (function () {
        var x = [t.el("h1", { text: titolo })];
        if (f.annullata) x.push(t.el("p", { text: (f.motivo || "") + " Questa partita non conta per vittorie e trofei." }));
        else if (!dentro(v)) x.push(t.el("p", { text: (v.guarda || []).indexOf(me) >= 0 ? "👀 Questa volta hai guardato." : "👀 Hai guardato questa partita: se l'host ne fa un'altra, giochi anche tu." }));
        else if (win >= 0) x.push(t.el("p", { text: squadraDi(v, me) === win ? "Bravissimi, avete vinto! 🎉" : "Peccato, sarà per la prossima!" }));
        var col = t.el("div", { class: "tb-colonne" });
        [0, 1].forEach(function (s) {
          var gente = t.el("div", { class: "tb-gente" });
          (v.giocatori || []).filter(function (p) { return squadraDi(v, p.id) === s; }).forEach(function (p) {
            gente.appendChild(t.el("div", {}, [avatarNodo(t, V.omini[p.id], p.nome, "piccolo"), t.el("small", { text: p.id === me ? "Tu" : p.nome })]));
          });
          col.appendChild(t.el("div", { class: "tb-col " + (s ? "b" : "a") + (!f.annullata && win === s ? " vince" : "") }, [t.el("h3", { text: "Squadra " + SQUADRE[s] }), t.el("div", { class: "tb-pt", text: String(v.punti[s]) }), gente]));
        });
        x.push(col);
        if (f.premi && f.premi.length) x.push(t.el("div", { class: "tb-premi" }, f.premi.map(function (p) { return t.el("div", { text: p }); })));
        return x;
      })()));
      faccine(ui.tasti);   // si festeggia (o si sfotte) tutti insieme
      // i tasti di fine comuni (all'host e a chi ha giocato), se li disegna il core: allora niente tasti nostri
      var tf = o.sonoHost ? { host: true, nuova: o.nuova, esci: o.esci } : (dentro(v) ? { host: false, esci: o.esci } : null);
      if (!(tf && t.tastiFine && t.tastiFine(ui.tasti, tf))) {
        if (o.sonoHost) ui.tasti.appendChild(tasto("largo", "🔁 Nuova partita (stessi amici)", function () { o.nuova(); }));
        ui.tasti.appendChild(tasto("grigio largo", "Esci", function () { o.esci(); }));
      }
      if (V.festa !== v.partitaId) { V.festa = v.partitaId; if (!f.annullata) suono("fanfara"); }
    }

    // ---- ogni 200 ms: tempo, barra e conto alla rovescia (solo testi) ----
    function tick() {
      var v = V.v, ui = V.ui; if (!v || !ui || v.fase === "lobby") return;
      var rest = v.pausa ? (v.restano || 0) : Math.max(0, V.fineLocale - Date.now()), sec = Math.ceil(rest / 1000);
      if (v.fase === "turno") {
        ui.timer.className = "tb-timer"; ui.timer.textContent = v.pausa ? "⏸️" : String(sec);
        ui.barra.style.visibility = "visible";
        ui.barraI.style.transform = "scaleX(" + Math.max(0, Math.min(1, rest / ((v.durata || 90) * 1000))).toFixed(4) + ")";
        ui.barra.classList.toggle("rossa", sec <= 10);
        if (!v.pausa && sec <= 5 && sec > 0 && sec !== V.ultimoSec) suono("tic");
        V.ultimoSec = sec;
      } else {
        ui.barra.style.visibility = "hidden"; ui.timer.className = "tb-timer testo";
        ui.timer.textContent = v.fase === "fine" ? "Fine" : (v.pausa ? "⏸️" : (v.avviso ? "⏳" : (v.attivo ? "Pronti?" : "🏁")));
        if (ui.conta) ui.conta.textContent = io() === v.attivo ? "Se non tocchi, si parte da soli tra " + sec + " s" : "Si parte quando " + nomeDi(v, v.attivo) + " tocca «Pronti, via!» (al massimo " + sec + " s)";
      }
    }
    function testi(v) {
      var ui = V.ui, me = io();
      [0, 1].forEach(function (q) {
        var nuovo = String(v.punti[q]);
        if (ui.score[q].textContent !== nuovo) { ui.score[q].textContent = nuovo; ui.box[q].classList.remove("tb-bump"); void ui.box[q].offsetWidth; ui.box[q].classList.add("tb-bump"); }
        ui.box[q].classList.toggle("mia", dentro(v) && squadraDi(v, me) === q);
      });
      if (v.fase === "turno") ui.turno.textContent = "Turno " + v.turno + " di " + v.totale + " · " + (v.attivo === me ? "spieghi tu" : nomeDi(v, v.attivo) + " spiega");
      else if (v.fase === "pronto") ui.turno.textContent = v.attivo ? "Turno " + v.turno + " di " + v.totale : (v.avviso ? "Partita ferma" : "Turni finiti");
      else ui.turno.textContent = "";
      var puoPausa = o.sonoHost && ((v.fase === "turno") || (v.fase === "pronto" && v.attivo && !v.avviso));
      ui.pausa.style.visibility = puoPausa ? "visible" : "hidden";
      ui.pausa.textContent = v.pausa ? "▶️" : "⏸️";
    }

    return {
      vm: function (v) {
        var prima = V.v; V.v = v;
        (v.giocatori || []).forEach(function (p) { if (p.omino) V.omini[p.id] = p.omino; });
        if (v.fase === "lobby") { V.ui = null; return; }
        V.fineLocale = Date.now() + (v.restano || 0);   // il tempo si conta da quando arriva la foto (non dall'orologio dell'host)
        var nuovaSchermata = !V.ui || !document.body.contains(V.ui.s);
        if (nuovaSchermata) frame();
        var k = chiave(v);
        if (k !== V.key) { V.key = k; corpo(v); }
        testi(v); tick();
        // suoni dei cambi di fase (non a chi è appena rientrato)
        if (prima && V.seq != null) {
          if (prima.fase === "turno" && v.fase === "pronto") suono("gong");
          else if (prima.fase === "pronto" && v.fase === "turno") suono("via");
        }
        var ev = v.ultimo;
        if (V.seq == null) V.seq = ev ? ev.seq : 0;   // appena arrivato: gli eventi vecchi non si ripetono
        else if (ev && ev.seq !== V.seq) { V.seq = ev.seq; if (v.fase === "turno") evento(ev, v); }
      },
      tick: tick,
      azzera: function () { V.ui = null; V.key = ""; }
    };
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

  // i contatori dei trofei (host e amici, ognuno salva i suoi)
  var statSalvate = Object.create(null);
  function salvaStatTaboo(t, id, v) {
    if (!id || !v || !v.partitaId || statSalvate[v.partitaId]) return;
    if (v.fine && v.fine.annullata) return;   // partita chiusa a metà: non conta
    statSalvate[v.partitaId] = true;
    if (t.guarda || (t.linkParams && t.linkParams.prova) || (t.impostazioni && t.impostazioni.prova)) return;
    if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
    var me = (v.giocatori || []).find(function (p) { return p.id === id; });
    var miei = v.statGiocatori && v.statGiocatori[id];
    if (!me || !miei) return;
    var vincitore = v.fine ? v.fine.vincitore : -1;
    var x = { partite: 1, partiteOnline: 1, turniSpiegati: miei.turniSpiegati, carteIndovinate: miei.carteIndovinate,
      cartePassate: miei.cartePassate, buzzFatti: miei.buzzFatti, buzzSubiti: miei.buzzSubiti, turniPositivi: miei.turniPositivi };
    if (vincitore >= 0 && v.squadre[id] === vincitore) x.vittorie = 1;
    var s0 = SGNube.statGioco ? (SGNube.statGioco("taboo") || {}) : {};
    if (s0.ultimaPartitaTrofei === v.partitaId) return;   // partita già contata (es. pagina ricaricata a fine partita)
    var serie = s0.serieTurniPositiviOra || 0;
    (miei.esitiTurni || []).forEach(function (buono) { serie = buono ? serie + 1 : 0; });
    var incr = []; Object.keys(x).forEach(function (k) { if (x[k] > 0) incr.push([k, x[k]]); });
    SGNube.salvaProgressi(null, "taboo", incr,
      [["comboCarteMax", miei.comboCarteMax || 0], ["serieTurniPositiviMax", serie]],
      [["serieTurniPositiviOra", serie], ["ultimaPartitaTrofei", v.partitaId]]);
  }

  function senzaRete(t) {
    var s = t.schermata({ titolo: "" }); s._contenuto.appendChild(t.el("p", { class: "modulo-nota", text: "Taboo si gioca online quando il sito è aperto dal web." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Esci", onclick: t.esci })); t.mostra(s);
  }

  function avvia(t) {
    stile();
    var modo = (t.impostazioni || {}).modo;
    if (!(t.linkParams && t.linkParams.stanza) && modo && modo !== "online") return locale(t);   // su questo telefono (anche nella Serata a punti)
    if (!(t.linkParams && t.linkParams.stanza) && !modo && t.giocatori && t.giocatori.length >= MIN) return locale(t);
    if (t.linkParams && t.linkParams.stanza) {
      if (t.nomeProfilo()) return ospite(t, t.linkParams.stanza, t.nomeProfilo());
      return chiediNome(t, t.linkParams.stanza, function (nome) { ospite(t, t.linkParams.stanza, nome); });   // senza profilo: si scrive il nome
    }
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    host(t);
  }

  // =========================================================
  //  HOST: tiene la partita e manda a tutti la "foto"
  // =========================================================
  function host(t) {
    var imp = t.impostazioni || {};
    var durata = [60, 90, 120].indexOf(Number(imp.tempo)) >= 0 ? Number(imp.tempo) : 90;
    var giri = Math.max(1, Math.min(4, Number(imp.giri) || 1));
    var livello = [1, 2, 3].indexOf(Number(imp.carte)) >= 0 ? Number(imp.carte) : 2;
    var codice = "…", pronta = false, fase = "lobby", rete = null, tic = null;
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var IO = t.mioId || "host";   // io che tengo la partita ("host", o l'amico che ha preso il posto dell'host)
    var giocatori = [{ id: IO, nome: nomeHost, omino: avatar(nomeHost), host: true }];
    var squadre = {}, punti = [0, 0], carte = [], indiceCarta = 0, uscite = [];
    squadre[IO] = 0;
    var coda = [], indiceTurno = 0, puntatore = [0, 0], primaSquadra = 0, sceltoPer = null;
    var attivo = null, deadline = 0, prontoScade = 0, pausa = false, rimasto = 0, avviso = null;
    var passati = 0, cartaOra = null, chiaveCarta = 0, statTurno = null, riepilogo = null;
    var seqEv = 0, ultimo = null, ultimoBuzz = null, fine = null;
    var partitaId = nuovoId(), statGiocatori = Object.create(null);
    var box = null, fotoOspiti = 0;
    var guarda = [];   // nella Sala: chi non è stato scelto per giocare (guarda soltanto: le squadre si fanno senza di lui)
    var rifatto = 0;   // la partita è ripresa a metà turno: quel turno si rifà da capo (il numero del turno, per la scritta)
    var inizioTurno = null;   // punti e statistiche com'erano a inizio turno (per rifarlo da capo se la partita riprende)
    statPersona(IO);

    function nuovoId() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
    function statPersona(id) {
      if (!statGiocatori[id]) statGiocatori[id] = { turniSpiegati: 0, carteIndovinate: 0, cartePassate: 0, buzzFatti: 0, buzzSubiti: 0, turniPositivi: 0, comboCarte: 0, comboCarteMax: 0, esitiTurni: [] };
      return statGiocatori[id];
    }
    function indice(id) { return giocatori.findIndex(function (p) { return p.id === id; }); }
    function gioc(id) { return giocatori[indice(id)] || null; }
    function squadra(id) { return squadre[id] === 1 ? 1 : 0; }
    function membri(s) { return giocatori.filter(function (p) { return squadra(p.id) === s; }); }
    function presenti(s) { return membri(s).filter(function (p) { return !p.via; }); }

    var vista = creaVista(t, {
      sonoHost: true,
      mioId: function () { return IO; },
      azione: function (tipo, extra) { azione(IO, tipo, chiaveCarta, extra); },
      esci: function () { t.ricorda(null); chiudi(); t.esci(); },
      pausa: cambiaPausa,
      rifai: rifaiSquadre,
      chiudiPartita: function () { finePartita("Mancavano giocatori in una squadra."); },
      nuova: nuovaPartita
    });

    // ---- saletta ----
    function distribuisci(lista) {
      mescola(lista).forEach(function (p, i) { squadre[p.id] = (i + (Math.random() < 0.5 ? 0 : 1)) % 2 === 0 ? 0 : 1; });
      // in pari: metà e metà (con un giocatore in più a caso)
      var a = lista.filter(function (p) { return squadre[p.id] === 0; }), b = lista.filter(function (p) { return squadre[p.id] === 1; });
      while (a.length - b.length > 1) { var x = a.pop(); squadre[x.id] = 1; b.push(x); }
      while (b.length - a.length > 1) { var y = b.pop(); squadre[y.id] = 0; a.push(y); }
    }
    function sposta(id, dest) {
      if (fase !== "lobby" || indice(id) < 0) return;
      squadre[id] = dest === 1 ? 1 : 0; aggiornaLobby();
    }
    function aggiornaLobby() {
      if (fase !== "lobby") return;
      if (!box) box = boxSquadre(t, { host: true, aCaso: function () { distribuisci(giocatori); aggiornaLobby(); }, sposta: sposta });
      box.aggiorna(giocatori, squadre, IO);
      var lista = giocatori.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino, host: !!p.host }; });
      if (rete) rete.invia({ t: "vm", vm: { fase: "lobby", codice: codice, pronta: pronta, giocatori: lista, squadre: squadre, punti: [0, 0], guarda: guarda.slice() } });
      t.ricorda(null);   // in saletta non c'è niente da riprendere
      vista.vm({ fase: "lobby" });
      var piccola = membri(0).length < 2 || membri(1).length < 2;
      t.lobby({ host: true, codice: codice, pronta: pronta, min: MIN, vuoti: Math.max(0, MIN - giocatori.length), giocatori: lista, extra: [box],
        puoComincia: giocatori.length >= MIN && !piccola,
        testoComincia: "Comincia ▶",
        nota: giocatori.length < MIN ? "Servono almeno 4 persone. Potete arrivare fino a 16." : (piccola ? "Ogni squadra deve avere almeno 2 persone: sposta qualcuno o fai le squadre a caso." : "Squadre pronte! Quando volete, si comincia."),
        onComincia: inizia, onEsci: function () { t.ricorda(null); chiudi(); t.esci(); } });
    }
    t.onRegole = function (nuove) {
      if (fase !== "lobby") return;
      t.impostazioni = t.impostazioni || {};
      if ([60, 90, 120].indexOf(Number(nuove.tempo)) >= 0) { durata = Number(nuove.tempo); t.impostazioni.tempo = durata; }
      giri = Math.max(1, Math.min(4, Number(nuove.giri) || 1)); t.impostazioni.giri = giri;
      if ([1, 2, 3].indexOf(Number(nuove.carte)) >= 0) { livello = Number(nuove.carte); t.impostazioni.carte = livello; }
      aggiornaLobby();
    };

    // ---- la foto della partita (la carta c'è dentro: un solo messaggio per tutti) ----
    function restano() {
      if (pausa) return rimasto;
      if (fase === "turno") return Math.max(0, deadline - Date.now());
      if (fase === "pronto" && prontoScade) return Math.max(0, prontoScade - Date.now());
      return 0;
    }
    function vm(conOmini) {
      var omini = conOmini || fase !== "turno";
      return { fase: fase, codice: codice, pronta: pronta, partitaId: partitaId,
        giocatori: giocatori.map(function (p) { var x = { id: p.id, nome: p.nome, host: !!p.host, via: !!p.via }; if (omini) x.omino = p.omino; return x; }),
        squadre: squadre, punti: punti.slice(), durata: durata, giri: giri,
        turno: fase === "turno" ? indiceTurno : indiceTurno + 1, totale: coda.length,
        attivo: attivo, team: attivo == null ? null : squadra(attivo),
        restano: restano(), pausa: pausa, avviso: avviso, presenti: giocatori.filter(function (p) { return !p.via; }).length,
        chiaveCarta: chiaveCarta, carta: fase === "turno" ? cartaOra : null, passati: passati,
        giusteTurno: statTurno ? statTurno.giuste.length : 0, combo: attivo ? statPersona(attivo).comboCarte : 0,
        ultimo: ultimo, riepilogo: fase === "pronto" ? riepilogo : null, rifatto: fase === "pronto" && rifatto === indiceTurno + 1 ? rifatto : 0,
        fine: fase === "fine" ? fine : null, statGiocatori: fase === "fine" ? statGiocatori : null, guarda: guarda.slice() };
    }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda (non gioca: non ha niente da perdere)
    var viciK = "";
    function vici() { var k = guarda.join(","); if (k !== viciK && t.vici) { viciK = k; t.vici(guarda.length ? guarda.slice() : null); } }
    function inviaStato(conOmini) {
      if (fase === "lobby") return aggiornaLobby();
      var x = vm(conOmini);
      if (rete) rete.invia({ t: "vm", vm: x });
      ricorda();
      vici();
      vista.vm(x);
    }
    // la partita com'è adesso, per riprenderla se la pagina si ricarica (t.ripresa). Il mazzo va come numeri
    // (la posizione delle carte nella lista di tutte le carte), così resta piccolo
    var TUTTE = window.SG_TABOO_CARTE || [];
    function numeroCarta(c) { var i = TUTTE.indexOf(c); if (i < 0) for (var k = 0; k < TUTTE.length; k++) if (TUTTE[k].p === c.p) return k; return i; }
    function ricorda() {
      if (fase === "lobby") return t.ricorda(null);
      var resto = carte.slice(indiceCarta).map(numeroCarta).filter(function (i) { return i >= 0; });
      t.ricorda({ fase: fase, giocatori: giocatori, squadre: squadre, punti: punti, livello: livello, durata: durata, giri: giri,
        resto: resto, uscite: uscite, coda: coda, indiceTurno: indiceTurno, puntatore: puntatore, primaSquadra: primaSquadra,
        sceltoPer: sceltoPer, attivo: attivo, avviso: avviso, riepilogo: riepilogo, fine: fine, partitaId: partitaId,
        statGiocatori: statGiocatori, guarda: guarda, inizioTurno: inizioTurno, seqEv: seqEv, chiaveCarta: chiaveCarta });
    }

    // la partita di prima (l'host ha ricaricato la pagina o riaperto l'app: t.ripresa): si riprende da lì.
    // Gli amici non si danno per usciti: si aspettano ("attesi") e rientrano da soli; chi non torna entro 10 secondi esce
    var R0 = t.ripresa && t.ripresa.stato, ripresa = !!(R0 && R0.fase && R0.fase !== "lobby" && R0.giocatori), attesi = {}, tAttesi = null;
    if (ripresa) {
      fase = R0.fase; giocatori = R0.giocatori; squadre = R0.squadre || {}; punti = R0.punti || [0, 0];
      livello = R0.livello || livello; durata = R0.durata || durata; giri = R0.giri || giri;
      carte = (R0.resto || []).map(function (i) { return TUTTE[i]; }).filter(Boolean); indiceCarta = 0; uscite = R0.uscite || [];
      coda = R0.coda || []; indiceTurno = R0.indiceTurno || 0; puntatore = R0.puntatore || [0, 0]; primaSquadra = R0.primaSquadra || 0;
      sceltoPer = R0.sceltoPer || null; attivo = R0.attivo || null; avviso = R0.avviso || null; riepilogo = R0.riepilogo || null;
      fine = R0.fine || null; partitaId = R0.partitaId || partitaId; guarda = R0.guarda || [];
      statGiocatori = R0.statGiocatori || Object.create(null); inizioTurno = R0.inizioTurno || null;
      seqEv = R0.seqEv || 0; chiaveCarta = (R0.chiaveCarta || 0) + 1;   // (una carta vecchia toccata adesso non vale)
      giocatori.forEach(function (p) { statPersona(p.id); if (p.id !== IO && !p.via) attesi[p.id] = 1; });
      giocatori.forEach(function (p) { p.host = p.id === IO; });   // (ho preso il posto dell'host sparito: ora la corona è mia)
    }
    var cbRete = {
      onCodice: function (c) { codice = c; if (fase === "lobby") aggiornaLobby(); else inviaStato(true); },
      onConnesso: function () { pronta = true; if (fase === "lobby") aggiornaLobby(); else inviaStato(true); },
      onAddio: function (id) {
        delete attesi[id];
        if (guarda.indexOf(id) >= 0) { guarda.splice(guarda.indexOf(id), 1); return inviaStato(true); }
        var p = gioc(id); if (!p) return;
        if (fase === "lobby") { giocatori.splice(indice(id), 1); delete squadre[id]; delete statGiocatori[id]; aggiornaLobby(); return; }
        // a partita iniziata non si toglie nessuno: resta "assente" e può rientrare
        p.via = true;
        if (fase === "turno" && id === attivo) return fineTurno(true);
        if (fase === "pronto" && (id === attivo || (!avviso && attivo && (presenti(0).length < 2 || presenti(1).length < 2)))) return preparaPronto();
        inviaStato();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          delete attesi[id];   // (dopo una ripresa: è tornato)
          var p = gioc(id);
          if (p) {   // già dentro (pagina ricaricata, rete tornata): stesso posto, gli rimando la foto
            var eraVia = p.via; p.via = false;
            if (fase === "lobby") return aggiornaLobby();
            if (eraVia && fase === "pronto" && avviso) return preparaPronto();
            return inviaStato(true);
          }
          var nome = String(m.nome || "Amico").trim().slice(0, 16) || "Amico";
          // nella Sala gioca solo chi è stato scelto: gli altri guardano (col loro id nella foto)
          if (guarda.indexOf(id) >= 0 || (t.puoSedersi && !t.puoSedersi(id, nome))) {
            if (guarda.indexOf(id) < 0) guarda.push(id);
            return inviaStato(true);
          }
          if (fase === "lobby" && giocatori.length < MAX) {
            giocatori.push({ id: id, nome: nome, omino: valido(m.omino) }); statPersona(id);
            squadre[id] = membri(0).length <= membri(1).length ? 0 : 1;
            aggiornaLobby();
          } else if (fase === "lobby") rete.inviaVeloce({ t: "rifiuto", to: id, testo: "La stanza è piena." });
          else if (Date.now() - fotoOspiti > 3000) { fotoOspiti = Date.now(); inviaStato(true); }   // partita cominciata: guarda (la foto subito) ed entra alla prossima, quando torna la saletta
        } else if (m.t === "squadra") {
          sposta(id, m.s);
        } else azione(id, m.t, m.chiave, m);
      },
      onErrore: function () { senzaRete(t); }
    };
    rete = SGNet.ospita("taboo", cbRete, { ripresa: ripresa });   // (con la ripresa gli amici non tornano in saletta)
    if (ripresa) riprendi(); else aggiornaLobby();

    // la ripresa: tra un turno e l'altro si resta lì (chi doveva spiegare ha di nuovo il suo tempo); a metà turno quel
    // turno si rifà da capo (punti com'erano a inizio turno, tempo intero, carta nuova: quella di prima l'hanno vista in tanti);
    // sulla classifica finale si resta sulla classifica
    function riprendi() {
      if (rete && rete.codice) codice = rete.codice;
      tAttesi = setTimeout(function () { Object.keys(attesi).forEach(function (id) { if (rete) cbRete.onAddio(id); }); }, 10000);
      pausa = false; rimasto = 0; ultimoBuzz = null; deadline = 0;
      if (fase === "fine") return inviaStato(true);
      if (fase === "turno") {
        if (inizioTurno) { punti = inizioTurno.punti.slice(); statGiocatori = inizioTurno.stat; }
        indiceTurno = Math.max(0, indiceTurno - 1);   // (avviaTurno lo rifà avanzare)
        sceltoPer = { turno: indiceTurno, id: attivo };
        rifatto = indiceTurno + 1;
        if (uscite.length) { segnaViste(uscite); uscite = []; }
        cartaOra = null; statTurno = null;
      }
      riepilogo = fase === "turno" ? null : riepilogo;
      preparaPronto();
    }

    // le mosse (dell'host e degli amici): ognuna vale solo per la carta su cui è stata fatta
    function azione(id, tipo, chiave, extra) {
      if (fase === "pronto" && tipo === "pronto" && id === attivo && !pausa && !avviso) return avviaTurno();
      if (tipo === "annulla") { if (id === IO || id === attivo) annullaBuzz(extra && extra.seq); return; }
      if (fase !== "turno" || pausa || chiave !== chiaveCarta || !cartaOra) return;
      if (tipo === "indovinata" && id === attivo) registra("giusta", id);
      else if (tipo === "passo" && id === attivo && passati < MAX_PASSI) registra("passata", id);
      else if (tipo === "buzz" && gioc(id) && squadra(id) !== squadra(attivo)) registra("buzz", id);
    }

    // ---- turni: le due squadre si alternano, ognuna con lo stesso numero di turni; dentro la squadra si va a giro ----
    function inizia() {
      if (fase !== "lobby" || giocatori.length < MIN || membri(0).length < 2 || membri(1).length < 2) return;
      punti = [0, 0]; carte = mazzo(livello); indiceCarta = 0; indiceTurno = 0; uscite = [];
      puntatore = [0, 0]; coda = []; sceltoPer = null; ultimo = null; ultimoBuzz = null; fine = null; riepilogo = null; pausa = false;
      giocatori.forEach(function (p) { statPersona(p.id); });
      var turniSquadra = Math.max(membri(0).length, membri(1).length) * giri;
      for (var k = 0; k < turniSquadra * 2; k++) coda.push((primaSquadra + k) % 2);
      preparaPronto();
    }
    function scegli(s) {   // il prossimo della squadra che c'è
      var m = membri(s); if (!m.length) return null;
      for (var i = 0; i < m.length; i++) {
        var p = m[(puntatore[s] + i) % m.length];
        if (!p.via) { puntatore[s] = (puntatore[s] + i + 1) % m.length; return p.id; }
      }
      return null;
    }
    function testoMancano() {
      var via = giocatori.filter(function (p) { return p.via; }).map(function (p) { return p.nome; });
      var corta = [0, 1].filter(function (s) { return presenti(s).length < 2; }).map(function (s) { return "Squadra " + SQUADRE[s]; });
      return (via.length ? (via.length > 1 ? "Si sono scollegati " + via.slice(0, -1).join(", ") + " e " + via[via.length - 1] : "Si è scollegato " + via[0]) + ". " : "") + corta.join(" e ") + (corta.length > 1 ? " hanno" : " ha") + " meno di 2 persone collegate.";
    }
    // tra un turno e l'altro: chi spiega dopo si prepara e tocca "Pronti, via!"
    function preparaPronto() {
      fase = "pronto"; pausa = false; avviso = null; cartaOra = null; statTurno = null;
      if (indiceTurno >= coda.length) { attivo = null; prontoScade = Date.now() + 6500; return inviaStato(true); }
      if (presenti(0).length < 2 || presenti(1).length < 2) { attivo = null; prontoScade = 0; avviso = testoMancano(); return inviaStato(true); }
      // se per questo turno era già stato scelto qualcuno (e c'è ancora), resta lui: nessuno perde il suo turno
      var s = coda[indiceTurno], prima = sceltoPer && sceltoPer.turno === indiceTurno ? gioc(sceltoPer.id) : null;
      attivo = prima && !prima.via && squadra(prima.id) === s ? prima.id : scegli(s);
      sceltoPer = { turno: indiceTurno, id: attivo };
      prontoScade = Date.now() + ATTESA_PRONTO;
      inviaStato(true);
    }
    function avviaTurno() {
      // (com'era prima del turno: se la partita riprende a metà, il turno si rifà da qui)
      inizioTurno = { punti: punti.slice(), stat: JSON.parse(JSON.stringify(statGiocatori)) };
      fase = "turno"; indiceTurno++; passati = 0; pausa = false;
      statTurno = { giuste: [], buzz: [], passate: [] };
      statPersona(attivo).turniSpiegati++; statPersona(attivo).comboCarte = 0;
      deadline = Date.now() + durata * 1000;
      pescaCarta(); inviaStato();
    }
    function pescaCarta() {
      if (indiceCarta >= carte.length) { carte = mescola(carteDelLivello(livello)); indiceCarta = 0; }   // mazzo finito: si rimescola
      cartaOra = carte[indiceCarta++]; chiaveCarta++; uscite.push(cartaOra.p);
    }
    function evento(tipo, id, parola) { ultimo = { tipo: tipo, seq: ++seqEv, nome: id ? (gioc(id) || {}).nome : null, parola: parola || null }; }
    function registra(tipo, id) {
      var speaker = statPersona(attivo), parola = cartaOra.p;
      if (tipo === "giusta") { punti[squadra(attivo)]++; statTurno.giuste.push(parola); speaker.carteIndovinate++; speaker.comboCarte++; speaker.comboCarteMax = Math.max(speaker.comboCarteMax, speaker.comboCarte); evento("giusta", id, parola); }
      else if (tipo === "buzz") {
        punti[squadra(attivo)]--; statTurno.buzz.push(parola); speaker.buzzSubiti++; speaker.comboCarte = 0; statPersona(id).buzzFatti++;
        evento("buzz", id, parola);
        ultimoBuzz = { seq: ultimo.seq, ora: Date.now(), da: id, speaker: attivo, team: squadra(attivo), parola: parola, turno: indiceTurno };
      } else { passati++; statTurno.passate.push(parola); speaker.cartePassate++; speaker.comboCarte = 0; evento("passo", id, parola); }
      pescaCarta(); inviaStato();
    }
    function annullaBuzz(seq) {
      var b = ultimoBuzz;
      if (!b || b.seq !== seq || b.annullato || fase !== "turno" || b.turno !== indiceTurno || Date.now() - b.ora > ANNULLA_MS + 1500) return;
      b.annullato = true; punti[b.team]++;
      var i = statTurno.buzz.lastIndexOf(b.parola); if (i >= 0) statTurno.buzz.splice(i, 1);
      statPersona(b.da).buzzFatti = Math.max(0, statPersona(b.da).buzzFatti - 1);
      statPersona(b.speaker).buzzSubiti = Math.max(0, statPersona(b.speaker).buzzSubiti - 1);
      evento("annullato", b.da, b.parola); inviaStato();
    }
    function fineTurno(uscito) {
      if (fase !== "turno") return;
      var buono = statTurno.giuste.length > statTurno.buzz.length, st = statPersona(attivo);
      if (buono) st.turniPositivi++;
      st.esitiTurni.push(buono);
      riepilogo = { turno: indiceTurno, id: attivo, nome: (gioc(attivo) || {}).nome || "…", uscito: !!uscito, team: squadra(attivo),
        giuste: statTurno.giuste.slice(), buzz: statTurno.buzz.slice(), passate: statTurno.passate.slice() };
      segnaViste(uscite); uscite = [];
      preparaPronto();
    }
    function cambiaPausa() {
      if (fase !== "turno" && !(fase === "pronto" && attivo && !avviso)) return;
      if (!pausa) { rimasto = restano(); pausa = true; }
      else { pausa = false; if (fase === "turno") deadline = Date.now() + rimasto; else prontoScade = Date.now() + Math.max(rimasto, 5000); }
      inviaStato();
    }
    function rifaiSquadre() {
      if (fase !== "pronto" || !avviso) return;
      var vivi = giocatori.filter(function (p) { return !p.via; });
      if (vivi.length < MIN) return;
      distribuisci(vivi); puntatore = [0, 0];
      preparaPronto();
    }

    // ---- fine partita ----
    function vincitore() { return punti[0] === punti[1] ? -1 : (punti[0] > punti[1] ? 0 : 1); }
    function premi() {
      var x = [], best = null, cic = null;
      giocatori.forEach(function (p) {
        var s = statGiocatori[p.id]; if (!s) return;
        if (s.carteIndovinate > 0 && (!best || s.carteIndovinate > best.n)) best = { nome: p.nome, n: s.carteIndovinate };
        if (s.buzzFatti > 0 && (!cic || s.buzzFatti > cic.n)) cic = { nome: p.nome, n: s.buzzFatti };
      });
      if (best) x.push("🎙️ Miglior spiegatore: " + best.nome + " (" + best.n + (best.n === 1 ? " carta" : " carte") + ")");
      if (cic) x.push("🚨 Cicalino d'oro: " + cic.nome + " (" + cic.n + " BUZZ)");
      return x;
    }
    function classificaGiocatori() {
      var v = vincitore(), primi = v < 0 ? giocatori.length : membri(v).length;
      return giocatori.map(function (p) { return { nome: p.nome, pos: (v < 0 || squadra(p.id) === v) ? 1 : primi + 1 }; })
        .sort(function (a, b) { return a.pos - b.pos; });
    }
    function finePartita(motivo) {
      if (fase === "fine") return;
      if (uscite.length) { segnaViste(uscite); uscite = []; }
      fase = "fine"; attivo = null; pausa = false; avviso = null; deadline = 0; prontoScade = 0;
      fine = motivo ? { annullata: true, motivo: motivo, vincitore: -1, premi: [] } : { vincitore: vincitore(), premi: premi() };
      var x = vm(true);
      if (rete) rete.invia({ t: "vm", vm: x });
      ricorda();
      if (!motivo) { salvaStatTaboo(t, IO, x); if (t.risultato) t.risultato(classificaGiocatori()); }
      vista.vm(x);
    }
    // "Nuova partita": tutti tornano nella saletta con le stesse squadre (chi se n'è andato esce dalla lista)
    function nuovaPartita() {
      giocatori = giocatori.filter(function (p) { return !p.via; });
      // chi tiene la partita è il primo (in saletta ha la corona); se l'ha presa guardando (host di riserva), si siede
      if (indice(IO) < 0) { guarda = guarda.filter(function (x) { return x !== IO; }); giocatori.push({ id: IO, nome: nomeHost, omino: avatar(nomeHost), host: true }); squadre[IO] = membri(0).length <= membri(1).length ? 0 : 1; }
      giocatori.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });
      Object.keys(squadre).forEach(function (id) { if (indice(id) < 0) delete squadre[id]; });
      if (giocatori.length >= MIN && (membri(0).length < 2 || membri(1).length < 2)) distribuisci(giocatori);
      fase = "lobby"; partitaId = nuovoId(); statGiocatori = Object.create(null); giocatori.forEach(function (p) { statPersona(p.id); });
      punti = [0, 0]; attivo = null; deadline = 0; prontoScade = 0; riepilogo = null; cartaOra = null; coda = []; indiceTurno = 0;
      ultimo = null; fine = null; pausa = false; avviso = null; primaSquadra = 1 - primaSquadra;   // la prossima volta comincia l'altra squadra
      aggiornaLobby();
    }
    function chiudi() { clearTimeout(tAttesi); if (tic) { clearInterval(tic); tic = null; } if (rete) { rete.chiudi(); rete = null; } }
    // la Rivincita dei tasti di fine comuni: tutti di nuovo nella saletta, stesse squadre (il core fa il 3-2-1)
    t.onRivincita = function () { if (fase === "fine") nuovaPartita(); };

    // l'orologio dell'host: fine del tempo e partenza da soli
    tic = setInterval(function () {
      if (!pausa) {
        if (fase === "turno" && Date.now() >= deadline) fineTurno(false);
        else if (fase === "pronto" && prontoScade && Date.now() >= prontoScade) { if (attivo) avviaTurno(); else finePartita(); }
      }
      vista.tick();
    }, 200);
  }

  // =========================================================
  //  AMICO: riceve la foto e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice, nome) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var G = { rete: null, myId: null, vm: null, tic: null, box: null, finito: false };
    var vista = creaVista(t, {
      sonoHost: false,
      mioId: function () { return G.myId; },
      azione: function (tipo, extra) { if (G.rete && G.vm) G.rete.invia(Object.assign({ t: tipo, chiave: G.vm.chiaveCarta }, extra || {})); },
      esci: esci
    });
    function esci() { G.finito = true; if (G.tic) { clearInterval(G.tic); G.tic = null; } if (G.rete) G.rete.chiudi(); t.esci(); }
    function avviso(testo) {
      G.finito = true; if (G.tic) { clearInterval(G.tic); G.tic = null; }
      stile(); vista.azzera();
      var s = t.schermata({}); s.classList.add("tb-piena");
      s._contenuto.appendChild(t.el("div", { class: "tb", style: "justify-content:center;text-align:center" }, [t.el("div", { class: "tb-indovina", style: "font-size:clamp(24px,7vw,36px)", text: testo }), t.el("button", { class: "tb-btn grigio", type: "button", text: "Esci", onclick: function () { if (G.rete) G.rete.chiudi(); t.esci(); } })]));
      t.mostra(s);
    }
    function attesa() {
      stile(); var s = t.schermata({}); s.classList.add("tb-piena");
      s._contenuto.appendChild(t.el("div", { class: "tb", style: "justify-content:center;text-align:center" }, [t.el("div", { class: "tb-indovina", text: "Ti stai unendo…" }), t.el("div", { class: "tb-sub", text: "Stanza " + String(codice).toUpperCase() })]));
      t.mostra(s);
    }
    function lobby(v) {
      var gio = (v.giocatori || []).map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino, host: !!p.host, tu: p.id === G.myId }; });
      if (!G.box) G.box = boxSquadre(t, { host: false, sposta: function (id, s) { if (id === G.myId && G.rete) G.rete.invia({ t: "squadra", s: s }); } });
      G.box.aggiorna(v.giocatori || [], v.squadre || {}, G.myId);
      var guardo = (v.guarda || []).indexOf(G.myId) >= 0;   // nella Sala: non sono stato scelto, guardo soltanto
      t.lobby({ host: false, codice: v.codice, pronta: v.pronta, min: MIN, vuoti: Math.max(0, MIN - gio.length), giocatori: gio, extra: [G.box],
        spettatore: guardo ? "👀 Questa volta guardi" : null,
        attesa: guardo ? "Si parte quando l'host dà il via: tu guardi la partita." : "Scegli la tua squadra. Si parte quando l'host dà il via!", onEsci: esci });
    }
    attesa();
    G.rete = SGNet.entra(codice, {
      onAperto: function (id) { G.myId = id; G.rete.invia({ t: "join", nome: nome, omino: t.mioOmino(nome) }); },
      onMsg: function (m) {
        if (G.finito || !m) return;
        if (m.t === "vm" && m.vm) {
          var v = m.vm; G.vm = v;
          if (v.fase === "lobby") { vista.vm(v); return lobby(v); }
          if (!G.myId) return;
          vista.vm(v);   // (chi non è in questa partita la guarda, ed entra alla prossima)
          if (v.fase === "fine") salvaStatTaboo(t, G.myId, v);
        } else if (m.t === "rifiuto" && m.to === G.myId) { if (G.rete) G.rete.chiudi(); avviso(m.testo || "Non puoi entrare in questa partita."); }
      },
      onChiuso: function () { if (!G.finito) avviso("La stanza è stata chiusa dall'host."); },
      onErrore: function () { if (!G.finito) avviso("Problema di collegamento. Riprova più tardi."); }
    });
    G.tic = setInterval(function () { vista.tick(); }, 200);
  }

  // =========================================================
  //  SU QUESTO TELEFONO: il classico. Chi spiega tiene il telefono,
  //  un avversario guarda la carta da sopra la spalla e preme BUZZ.
  // =========================================================
  var ICONE = { ok: "✅", no: "❌", pa: "⏭️" };
  function vibra(x) { try { if (navigator.vibrate) navigator.vibrate(x); } catch (e) {} }
  function elenco(nomi) { return nomi.length > 1 ? nomi.slice(0, -1).join(", ") + " e " + nomi[nomi.length - 1] : (nomi[0] || ""); }

  function locale(t) {
    stile();
    var imp = t.impostazioni || {};
    var durata = [60, 90, 120].indexOf(Number(imp.tempo)) >= 0 ? Number(imp.tempo) : 90;
    var giri = Math.max(1, Math.min(4, Number(imp.giri) || 1));
    var livello = [1, 2, 3].indexOf(Number(imp.carte)) >= 0 ? Number(imp.carte) : 2;
    var mio = (t.nomeProfilo && t.nomeProfilo()) || "", ominoMio = mio ? avatar(mio) : null;
    // i giocatori per posto (due nomi uguali restano due persone diverse)
    var gio = (t.giocatori || []).map(function (n, k) { return { k: k, nome: String(n || "").trim() || ("Giocatore " + (k + 1)), sq: 0 }; });
    var L = { turni: [], coda: [], idx: 0, punt: [0, 0], ctrl: [0, 0], prima: Math.random() < 0.5 ? 0 : 1,
      carte: mazzo(livello), ic: 0, uscite: [], T: null, ui: null, tic: null, finita: false };

    function membri(s) { return gio.filter(function (p) { return p.sq === s; }); }
    function punti() {
      var p = [0, 0];
      var tutti = L.T && L.turni.indexOf(L.T) < 0 ? L.turni.concat([L.T]) : L.turni;   // (anche il turno in corso)
      tutti.forEach(function (T) { T.carte.forEach(function (c) { if (c.e === "ok") p[T.sq]++; else if (c.e === "no") p[T.sq]--; }); });
      return p;
    }
    function omino(nome) { return nome === mio && ominoMio ? ominoMio : null; }
    function ferma() { if (L.tic) { clearInterval(L.tic); L.tic = null; } }
    function viva() { return L.ui && document.body.contains(L.ui.s); }
    function esci() {
      if (L.finita) { ferma(); return t.esci(); }
      var eraPausa = L.T && L.T.pausa;
      if (L.T && L.T.corre && !eraPausa) pausa();   // mentre si decide, il tempo si ferma
      t.conferma("Uscire dalla partita?", "La partita in corso si perde.", "Esci", function () { ferma(); t.esci(); });
    }
    function dividi() {
      mescola(gio).forEach(function (p, i) { p.sq = (i + L.prima) % 2; });
    }

    // ---- la cornice di gioco (in alto: pausa, punti, tempo, esci) ----
    function cornice(conPausa) {
      var s = t.schermata({}); s.classList.add("tb-piena");
      var ui = { s: s };
      ui.pausa = t.el("button", { class: "tb-mini", type: "button", text: "⏸️", title: "Pausa", onclick: function () { pausa(); } });
      ui.esci = t.el("button", { class: "tb-mini", type: "button", text: "✕", title: "Esci", onclick: esci });
      ui.box = [0, 1].map(function (q) { return t.el("div", { class: "tb-squadra " + (q ? "b" : "a") }, [t.el("span", { text: "Squadra " + SQUADRE[q] }), t.el("b", { text: "0" })]); });
      ui.score = ui.box.map(function (b) { return b.querySelector("b"); });
      ui.timer = t.el("div", { class: "tb-timer testo" });
      ui.barraI = t.el("i");
      ui.barra = t.el("div", { class: "tb-barra" }, [ui.barraI]);
      ui.turno = t.el("div", { class: "tb-turno" });
      ui.corpo = t.el("div", { class: "tb-corpo" });
      ui.banner = t.el("div", { class: "tb-banner" });
      ui.centro = t.el("div", { class: "tb-centro" }, [ui.corpo, ui.banner]);
      ui.tasti = t.el("div", { class: "tb-tasti" });
      ui.pausa.style.visibility = conPausa ? "visible" : "hidden";
      ui.barra.style.visibility = "hidden";
      s._contenuto.appendChild(t.el("div", { class: "tb" }, [t.el("div", { class: "tb-top" }, [ui.pausa, ui.box[0], ui.timer, ui.box[1], ui.esci]), ui.barra, ui.turno, ui.centro, ui.tasti]));
      L.ui = ui; segna(false);
      return ui;
    }
    function segna(salta) {   // i punti in alto (salta = il numero che cambia fa un saltino)
      var ui = L.ui, p = punti();
      [0, 1].forEach(function (q) {
        var nuovo = String(p[q]);
        if (ui.score[q].textContent !== nuovo) {
          ui.score[q].textContent = nuovo;
          if (salta) { ui.box[q].classList.remove("tb-bump"); void ui.box[q].offsetWidth; ui.box[q].classList.add("tb-bump"); }
        }
      });
    }
    function vola(testo, classe) {
      var n = t.el("div", { class: "tb-volo " + classe, text: testo });
      L.ui.centro.appendChild(n); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 950);
    }
    function nascondiBanner() { if (L.tBanner) { clearTimeout(L.tBanner); L.tBanner = null; } if (L.ui) L.ui.banner.classList.remove("vis"); }

    // ---- 1. le squadre: si toccano i nomi per spostarli ----
    function schermoSquadre() {
      var ui = cornice(false);
      ui.timer.textContent = "👥";
      ui.turno.textContent = "Le squadre";
      var col = t.el("div", { class: "tb-colonne tb-sq-loc" }), nota = t.el("div", { class: "tb-nota" });
      var via = tasto("", "Via ▶", function () { if (membri(0).length >= 2 && membri(1).length >= 2) comincia(); });
      function disegna() {
        col.innerHTML = "";
        [0, 1].forEach(function (s) {
          var lista = t.el("div", { class: "tb-loc-nomi" });
          membri(s).forEach(function (p) {
            lista.appendChild(t.el("button", { class: "tb-scelta " + (s ? "b" : "a") + (p.nome === mio ? " tu" : ""), type: "button", text: p.nome,
              onclick: function () { p.sq = 1 - s; disegna(); } }));
          });
          col.appendChild(t.el("div", { class: "tb-col " + (s ? "b" : "a") }, [t.el("h3", { text: "Squadra " + SQUADRE[s] + " · " + membri(s).length }), lista]));
        });
        var ok = membri(0).length >= 2 && membri(1).length >= 2;
        via.disabled = !ok;
        nota.textContent = ok ? "Tocca un nome per cambiargli squadra." : "Ogni squadra deve avere almeno 2 persone: tocca un nome per spostarlo.";
      }
      ui.corpo.appendChild(t.el("div", { class: "tb-nascondi tb-loc-squadre" }, [col,
        t.el("div", { class: "tb-sub", text: "A turno uno spiega alla sua squadra; un avversario guarda la carta e preme BUZZ." })]));
      ui.tasti.appendChild(tasto("grigio", "🔀 A caso", function () { dividi(); disegna(); }));
      ui.tasti.appendChild(via);
      ui.tasti.appendChild(nota);
      disegna();
      t.mostra(ui.s);
    }
    function tasto(classe, testo, fn) {
      return bottone(t, classe, testo, function () { if (Date.now() < (L.blocco || 0)) return; L.blocco = Date.now() + BLOCCO_MS; fn(); });
    }

    // ---- 2. i turni: le squadre si alternano, stessi turni per tutte e due; dentro la squadra si va a giro ----
    function comincia() {
      var turniSquadra = Math.max(membri(0).length, membri(1).length) * giri;
      L.coda = []; for (var k = 0; k < turniSquadra * 2; k++) L.coda.push((L.prima + k) % 2);
      L.idx = 0; L.turni = []; L.punt = [0, 0]; L.ctrl = [1, 1];   // (chi controlla non è chi spiega subito dopo: si può preparare)
      prossimo();
    }
    function prossimoChi() {   // chi spiega e chi controlla nel prossimo turno (senza andare avanti)
      if (L.idx >= L.coda.length) return null;
      var s = L.coda[L.idx], m = membri(s), a = membri(1 - s);
      return { sq: s, chi: m[L.punt[s] % m.length], ctrl: a[L.ctrl[1 - s] % a.length] };
    }
    function prossimo() {
      var x = prossimoChi(); if (!x) return finale();
      L.punt[x.sq]++; L.ctrl[1 - x.sq]++; L.idx++;
      L.T = { n: L.idx, sq: x.sq, chi: x.chi, ctrl: x.ctrl, carte: [], passati: 0, carta: null, corre: false, pausa: false, combo: 0, comboMax: 0 };
      schermoPronto();
    }
    function testoTurno() { return "Turno " + L.T.n + " di " + L.coda.length; }
    function schermoPronto() {
      var T = L.T, ui = cornice(false), compagni = membri(T.sq).filter(function (p) { return p !== T.chi; }).map(function (p) { return p.nome; });
      ui.timer.textContent = "Pronti?";
      ui.turno.textContent = testoTurno();
      ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, [
        t.el("div", { class: "tb-sub", text: "📱 Passa il telefono a" }),
        avatarNodo(t, omino(T.chi.nome), T.chi.nome),
        t.el("div", { class: "tb-indovina", text: T.chi.nome }),
        t.el("div", { class: "tb-sub", text: "Squadra " + SQUADRE[T.sq] + " · spieghi a " + elenco(compagni) }),
        t.el("div", { class: "tb-loc-ctrl" }, [t.el("b", { text: "👀 " + T.ctrl.nome + " controlla" }),
          t.el("span", { text: "Mettiti dietro a " + T.chi.nome + ", guarda la carta e premi BUZZ se dice una parola vietata." })])
      ]));
      ui.tasti.appendChild(tasto("largo", "▶ Pronti, via!", partenza));
      ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: "I compagni di " + T.chi.nome + " non guardano lo schermo!" }));
      t.mostra(ui.s);
    }

    // ---- 3. il turno: la carta, ✅, ⏭️ e il BUZZ sullo stesso telefono ----
    function partenza() {
      var T = L.T, ui = cornice(true);
      T.corre = true; T.fine = Date.now() + durata * 1000;
      ui.turno.textContent = testoTurno() + " · 👀 " + T.ctrl.nome + " controlla";
      ui.timer.className = "tb-timer"; ui.barra.style.visibility = "visible";
      ui.ok = tasto("", "✅ Indovinata", function () { mossa("ok"); });
      ui.pa = tasto("pass", "⏭️ Passo 0/" + MAX_PASSI, function () { mossa("pa"); });
      ui.bz = tasto("buzz", "❌ BUZZ", function () { mossa("no"); });
      ui.tasti.appendChild(ui.ok); ui.tasti.appendChild(ui.pa); ui.tasti.appendChild(ui.bz);
      t.mostra(ui.s);
      suono("via");
      pesca();
      ferma(); L.ultimoSec = -1;
      L.tic = setInterval(tick, 200); tick();
    }
    function pesca() {
      var T = L.T;
      if (L.ic >= L.carte.length) { L.carte = mescola(carteDelLivello(livello)); L.ic = 0; }   // mazzo finito: si rimescola
      T.carta = L.carte[L.ic++]; L.uscite.push(T.carta.p);
      mostraCarta();
    }
    function cartaNodo(c) {
      return t.el("div", { class: "tb-carta tb-entra" }, [t.el("div", { class: "tb-parola", text: c.p }),
        t.el("div", { class: "tb-vietate" }, (c.v || []).map(function (w) { return t.el("div", { class: "tb-vietata", text: w }); })),
        t.el("div", { class: "tb-promemoria", text: "Vietati anche: la parola stessa, un suo pezzo, i gesti" })]);
    }
    function mostraCarta() {   // cambia solo la carta e il tasto dei passi (niente lampeggio)
      var T = L.T, ui = L.ui; if (!viva()) return;
      ui.corpo.innerHTML = "";
      if (T.pausa) {
        ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, [t.el("div", { class: "tb-indovina", text: "⏸️ Pausa" }), t.el("div", { class: "tb-sub", text: "Il tempo è fermo. La carta torna quando riprendete." })]));
      } else if (T.carta) ui.corpo.appendChild(cartaNodo(T.carta));
      ui.pa.textContent = "⏭️ Passo " + T.passati + "/" + MAX_PASSI;
      ui.pa.disabled = T.pausa || T.passati >= MAX_PASSI;
      ui.ok.disabled = ui.bz.disabled = T.pausa;
      ui.pausa.textContent = T.pausa ? "▶️" : "⏸️";
      if (T.pausa) {
        if (!ui.riprendi) { ui.riprendi = tasto("blu largo", "▶ Riprendi", function () { pausa(); }); ui.tasti.appendChild(ui.riprendi); }
      } else if (ui.riprendi) { ui.riprendi.remove(); ui.riprendi = null; }
    }
    function mossa(e) {
      var T = L.T; if (!T || !T.corre || T.pausa || !T.carta) return;
      if (e === "pa" && T.passati >= MAX_PASSI) return;
      var rec = { p: T.carta.p, e: e, base: "pa" };
      T.carte.push(rec); T.carta = null;   // (fino alla carta nuova i tocchi non contano)
      if (e === "ok") { T.combo++; T.comboMax = Math.max(T.comboMax, T.combo); suono("giusta"); vola("✅ +1", "ok"); if (T.combo >= 5 && T.combo % 5 === 0) vibra(25); }
      else if (e === "pa") { T.passati++; T.combo = 0; suono("passo"); vola("⏭️ Passata", "pa"); }
      else {
        T.combo = 0; suono("buzz"); vola("❌ −1", "no"); vibra([60, 40, 60]);
        var c = L.ui.corpo.querySelector(".tb-carta"); if (c) { c.classList.remove("tb-entra"); c.classList.add("tb-trema"); }
        bannerBuzz(rec);
      }
      segna(true);
      if (e !== "no") return pesca();
      setTimeout(function () { if (L.T === T && T.corre && !T.carta) pesca(); }, 380);   // dopo il BUZZ la carta trema, poi arriva la nuova
    }
    function bannerBuzz(rec) {
      var b = L.ui.banner; b.innerHTML = ""; b.classList.remove("verde");
      b.appendChild(t.el("b", { text: "🚨 BUZZ!" }));
      b.appendChild(t.el("small", { text: "Parola vietata · carta: " + rec.p }));
      b.appendChild(tasto("", "↩️ Annulla BUZZ", function () {
        if (rec.e !== "no") return;
        rec.e = "nu"; rec.base = "nu"; rec.ico = "↩️"; segna(true); suono("via");
        nascondiBanner();
      }));
      b.classList.add("vis");
      if (L.tBanner) clearTimeout(L.tBanner);
      L.tBanner = setTimeout(nascondiBanner, ANNULLA_MS);
    }
    function pausa() {
      var T = L.T; if (!T || !T.corre) return;
      if (!T.pausa) { T.resta = Math.max(0, T.fine - Date.now()); T.pausa = true; nascondiBanner(); }
      else { T.pausa = false; T.fine = Date.now() + T.resta; }
      mostraCarta(); tick();
    }
    function tick() {
      var T = L.T, ui = L.ui;
      if (!T || !T.corre) return;
      if (!viva()) { ferma(); return; }   // usciti dal gioco: l'orologio si spegne
      var rest = T.pausa ? T.resta : Math.max(0, T.fine - Date.now()), sec = Math.ceil(rest / 1000);
      ui.timer.textContent = T.pausa ? "⏸️" : String(sec);
      ui.barraI.style.transform = "scaleX(" + Math.max(0, Math.min(1, rest / (durata * 1000))).toFixed(4) + ")";
      ui.barra.classList.toggle("rossa", sec <= 10);
      if (!T.pausa && sec <= 5 && sec > 0 && sec !== L.ultimoSec) suono("tic");
      L.ultimoSec = sec;
      if (!T.pausa && rest <= 0) tempoScaduto();
    }
    function tempoScaduto() {
      var T = L.T; T.corre = false; ferma(); nascondiBanner();
      if (T.carta) T.carte.push({ p: T.carta.p, e: "nu", base: "nu", ico: "⏰" });   // la carta allo scadere: se l'avevano detta in tempo, si corregge
      T.carta = null;
      segnaViste(L.uscite); L.uscite = [];
      suono("gong"); vola("⏰ Tempo!", "pa");
      var ui = L.ui; ui.ok.disabled = ui.pa.disabled = ui.bz.disabled = true; ui.timer.textContent = "0";
      L.turni.push(T);
      setTimeout(function () { if (L.T === T && viva()) schermoRiepilogo(); }, 1100);
    }

    // ---- 4. com'è andato il turno: le carte si toccano per correggerle ----
    function schermoRiepilogo() {
      var T = L.T, ui = cornice(false), dopo = prossimoChi();
      ui.timer.textContent = dopo ? "⏰" : "🏁";
      ui.turno.textContent = testoTurno() + (dopo ? "" : " · l'ultimo!");
      var em = t.el("em"), box = t.el("div", { class: "tb-riep" }, [t.el("h3", {}, [t.el("span", { text: T.chi.nome + " · Squadra " + SQUADRE[T.sq] }), em])]);
      var chips = t.el("div", { class: "tb-chips" });
      function delta() { var d = 0; T.carte.forEach(function (c) { if (c.e === "ok") d++; else if (c.e === "no") d--; }); em.textContent = (d > 0 ? "+" : "") + d; }
      function testoChip(c) { return (c.e === "nu" ? (c.ico || "⏰") : ICONE[c.e]) + " " + c.p; }
      var max = window.innerHeight < 700 ? 16 : 24;
      if (!T.carte.length) chips.appendChild(t.el("span", { class: "tb-chip altre", text: "Nessuna carta in questo turno" }));
      T.carte.slice(-max).forEach(function (c) {
        var b = t.el("button", { class: "tb-chip " + c.e, type: "button", text: testoChip(c), onclick: function () {
          var giro = ["ok", "no", c.base || "pa"], i = giro.indexOf(c.e);
          c.e = giro[(i + 1) % giro.length]; b.className = "tb-chip " + c.e; b.textContent = testoChip(c);
          delta(); segna(true);
        } });
        chips.appendChild(b);
      });
      if (T.carte.length > max) chips.insertBefore(t.el("span", { class: "tb-chip altre", text: "+" + (T.carte.length - max) + " prima" }), chips.firstChild);
      box.appendChild(chips);
      if (T.carte.length) box.appendChild(t.el("div", { class: "tb-promemoria tb-loc-corr", text: "Sbagliato un tocco? Tocca una carta per correggerla (✅ → ❌ → ⏭️)." }));
      delta(); ui.corpo.appendChild(box);
      if (dopo) {
        ui.corpo.appendChild(t.el("div", { class: "tb-prossimo" }, [avatarNodo(t, omino(dopo.chi.nome), dopo.chi.nome),
          t.el("div", {}, [t.el("b", { text: "Ora tocca a " + dopo.chi.nome }), t.el("span", { text: "Squadra " + SQUADRE[dopo.sq] + " · 👀 controlla " + dopo.ctrl.nome })])]));
        ui.tasti.appendChild(tasto("largo", "Avanti ▶", prossimo));
      } else {
        ui.corpo.appendChild(t.el("div", { class: "tb-prossimo" }, [t.el("div", {}, [t.el("b", { text: "🏁 Turni finiti!" }), t.el("span", { text: "Controllate le carte, poi vediamo chi ha vinto." })])]));
        ui.tasti.appendChild(tasto("largo", "🏆 Chi ha vinto?", finale));
      }
      t.mostra(ui.s);
    }

    // ---- 5. la fine: la squadra che vince, i premi, poi la classifica del core ----
    function finale() {
      ferma(); L.finita = true;
      var p = punti(), win = p[0] === p[1] ? -1 : (p[0] > p[1] ? 0 : 1), ui = cornice(false);
      ui.timer.textContent = "Fine"; ui.turno.textContent = "";
      // i premi (contati dopo le correzioni)
      var spieg = {}, serie = null;
      L.turni.forEach(function (T) {
        var n = T.carte.filter(function (c) { return c.e === "ok"; }).length;
        spieg[T.chi.k] = (spieg[T.chi.k] || 0) + n;
        var cc = 0, mx = 0; T.carte.forEach(function (c) { if (c.e === "ok") { cc++; mx = Math.max(mx, cc); } else if (c.e !== "nu") cc = 0; });
        if (mx >= 3 && (!serie || mx > serie.n)) serie = { nome: T.chi.nome, n: mx };
      });
      var best = null; gio.forEach(function (g) {
        var n = spieg[g.k] || 0; if (n <= 0) return;
        if (!best || n > best.n) best = { nome: g.nome, n: n, pari: [g.nome] }; else if (n === best.n) best.pari.push(g.nome);
      });
      if (best && best.pari.length > 1) best = best.pari.length === 2 ? { nome: elenco(best.pari), n: best.n } : null;   // a pari: due nomi, se di più niente premio
      var premi = [];
      if (best) premi.push("🎙️ Miglior spiegatore: " + best.nome + " (" + best.n + (best.n === 1 ? " carta" : " carte") + ")");
      if (serie) premi.push("🔥 Serie più lunga: " + serie.nome + " (" + serie.n + " di fila)");
      var col = t.el("div", { class: "tb-colonne" });
      [0, 1].forEach(function (s) {
        var gente = t.el("div", { class: "tb-gente" });
        membri(s).forEach(function (g) { gente.appendChild(t.el("div", {}, [avatarNodo(t, omino(g.nome), g.nome, "piccolo"), t.el("small", { text: g.nome })])); });
        col.appendChild(t.el("div", { class: "tb-col " + (s ? "b" : "a") + (win === s ? " vince" : "") }, [t.el("h3", { text: "Squadra " + SQUADRE[s] }), t.el("div", { class: "tb-pt", text: String(p[s]) }), gente]));
      });
      ui.corpo.appendChild(t.el("div", { class: "tb-fine" }, [t.el("h1", { text: win < 0 ? "Pareggio! 🤝" : "Squadra " + SQUADRE[win] + " vince! 🏆" }),
        t.el("p", { text: win < 0 ? "Stessi punti: siete pari." : "Bravissimi: " + elenco(membri(win).map(function (g) { return g.nome; })) + "!" }), col]
        .concat(premi.length ? [t.el("div", { class: "tb-premi" }, premi.map(function (x) { return t.el("div", { text: x }); }))] : [])));
      // la classifica per il core (Serata a punti): la squadra che vince al primo posto
      var primi = win < 0 ? gio.length : membri(win).length;
      var cl = gio.map(function (g) { return { nome: g.nome, punti: p[g.sq], pos: (win < 0 || g.sq === win) ? 1 : primi + 1 }; }).sort(function (a, b) { return a.pos - b.pos; });
      ui.tasti.appendChild(tasto("largo", "Classifica 🏆", function () { t.fine(cl); }));
      t.mostra(ui.s);
      suono("fanfara"); if (win >= 0) vibra([30, 40, 30]);
      salvaLocale(win);
    }
    // i trofei di chi ha il profilo (se gioca anche lui su questo telefono)
    function salvaLocale(win) {
      if (imp.prova || !mio) return;
      if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var me = gio.filter(function (g) { return g.nome === mio; })[0]; if (!me) return;
      var x = { partite: 1, turniSpiegati: 0, carteIndovinate: 0, cartePassate: 0, turniPositivi: 0, vittorie: win >= 0 && me.sq === win ? 1 : 0 }, combo = 0, esiti = [];
      L.turni.forEach(function (T) {
        if (T.chi !== me) return;
        var ok = 0, no = 0, cc = 0;
        x.turniSpiegati++;
        T.carte.forEach(function (c) {
          if (c.e === "ok") { ok++; cc++; combo = Math.max(combo, cc); } else { if (c.e === "no") no++; if (c.e === "pa") x.cartePassate++; if (c.e !== "nu") cc = 0; }
        });
        x.carteIndovinate += ok; if (ok > no) x.turniPositivi++;
        esiti.push(ok > no);
      });
      var s0 = SGNube.statGioco ? (SGNube.statGioco("taboo") || {}) : {}, serie = s0.serieTurniPositiviOra || 0, serieMax = 0;
      esiti.forEach(function (b) { serie = b ? serie + 1 : 0; serieMax = Math.max(serieMax, serie); });
      var incr = []; Object.keys(x).forEach(function (k) { if (x[k] > 0) incr.push([k, x[k]]); });
      try { SGNube.salvaProgressi(null, "taboo", incr, [["comboCarteMax", combo], ["serieTurniPositiviMax", serieMax]], [["serieTurniPositiviOra", serie]]); } catch (e) {}
    }

    if (gio.length < MIN) {   // (il core ne chiede già 4: qui per sicurezza)
      var s = t.schermata({ icona: "🤐", titolo: "Taboo" });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", text: "Servono almeno 4 persone: due squadre da 2." }));
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci })); t.mostra(s);
      return;
    }
    dividi();
    schermoSquadre();
  }

  function impostazioni(box, dove, aiuti) {
    dove.tempo = Number(dove.tempo) || 90; dove.giri = Number(dove.giri) || 1; dove.carte = Number(dove.carte) || 2;
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
    gruppo("Quanti giri (in un giro spiegano tutti)", [1, 2, 3, 4], "giri", ["1", "2", "3", "4"]);
    gruppo("Carte", [1, 2, 3], "carte", ["Facili", "Miste", "Difficili"]);
  }

  SG.registra({
    id: "taboo", nome: "Taboo", icona: "🤐",
    descrizione: "Spiega la parola senza dire quelle vietate! Su un telefono solo che passa di mano, o online ognuno col suo.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Chi spiega tiene il telefono, un avversario guarda e preme BUZZ", amici: true, min: MIN }],
    postiOnline: MAX,   // posti online (16)
    riprende: true,     // se l'host ricarica a metà partita, la partita riprende (il turno in corso si rifà da capo, con una carta nuova)
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    // le regole in una riga, per la saletta: "90 secondi a turno · 1 giro · carte miste"
    riassunto: function (imp) {
      imp = imp || {};
      var tempo = [60, 90, 120].indexOf(Number(imp.tempo)) >= 0 ? Number(imp.tempo) : 90, giri = Math.max(1, Math.min(4, Number(imp.giri) || 1));
      var carte = { 1: "carte facili", 2: "carte miste", 3: "carte difficili" }[Number(imp.carte)] || "carte miste";
      return tempo + " secondi a turno · " + (giri === 1 ? "1 giro" : giri + " giri") + " · " + carte;
    },
    regole: [
      "Fate due squadre. A turno, una persona spiega la parola alla propria squadra senza pronunciare le cinque parole vietate.",
      "Vietati anche la parola stessa o un suo pezzo, i gesti, i suoni («fa bau bau») e le parole in altre lingue.",
      "<b>Su questo telefono</b>: chi spiega tiene il telefono e un avversario si mette dietro di lui, guarda la carta e preme <b>BUZZ</b>. I compagni non guardano lo schermo. A fine turno si tocca una carta per correggerla (anche quella detta proprio allo scadere ⏰).",
      "<b>Online</b>: ognuno col suo telefono. Chi spiega vede la carta; la squadra avversaria la vede e può premere <b>BUZZ</b>. I compagni vedono solo il tempo e chi spiega.",
      "Ogni parola indovinata vale <b>+1</b>. Ogni BUZZ toglie <b>1 punto</b> (se è sbagliato si annulla entro 5 secondi: online lo fanno chi spiega o l'host). Si possono saltare al massimo <b>3 carte per turno</b>, senza perdere punti.",
      "Le squadre si alternano e ogni squadra ha gli stessi turni. Il tempo parte quando chi spiega tocca «Pronti, via!».",
      "Prima di cominciare si sceglie il tempo, quanti giri fare e le carte (facili, miste o difficili). Vince la squadra con più punti."
    ],
    impostazioni: impostazioni,
    avvia: avvia
  });
})();
