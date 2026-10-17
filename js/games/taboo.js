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
  var ATTESA_ROUND = 15;       // tra un round e l'altro: 15 s (o subito se più di metà tocca «⏩ Avanti»)
  var RUBATA_MS = 5000, DECIDI_MS = 7000;   // 🫳 Rubata: 5 s all'altra squadra, poi chi spiega ha ancora 7 s per dire com'è andata (se no: niente rubata)
  var RIPRESA_MIN = 3000;      // il turno a metà continua nel round dopo solo se restano almeno 3 s
  // i tre round alla Time's Up: le stesse carte, regole sempre più strette
  var ROUND = [null,
    { ico: "🗣️", nome: "Spiega", regola: "Spiega come sempre, senza dire le parole vietate.", prom: "Vietati anche: la parola stessa, un suo pezzo, i gesti" },
    { ico: "☝️", nome: "Una parola sola", regola: "Le vietate spariscono: chi spiega può dire UNA parola sola. Se ne dice di più: BUZZ!", prom: "Una parola sola! Se ne dici di più: BUZZ" },
    { ico: "🤐", nome: "Solo mimo", regola: "Niente voce: solo gesti. Se chi spiega parla o fa suoni: BUZZ!", prom: "Solo gesti! Se parli o fai suoni: BUZZ" }];
  function leggiImp(imp) {
    imp = imp || {};
    return { durata: [60, 90, 120].indexOf(Number(imp.tempo)) >= 0 ? Number(imp.tempo) : 90,
      giri: Math.max(1, Math.min(4, Number(imp.giri) || 1)),
      livello: [1, 2, 3].indexOf(Number(imp.carte)) >= 0 ? Number(imp.carte) : 2,
      tre: imp.partita === "tre",
      mazzoN: [20, 30, 40].indexOf(Number(imp.mazzo)) >= 0 ? Number(imp.mazzo) : 30,
      rubata: Number(imp.rubata) === 1 };
  }
  function nomeRound(n) { var r = ROUND[n] || ROUND[1]; return r.ico + " " + r.nome; }

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
      // 🧺 tre round e 🫳 rubata
      ".tb-chip.ru{background:#7048e8}",
      ".tb-round{flex:none;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;border-radius:20px;background:linear-gradient(160deg,#5f3dc4,#364fc7);padding:clamp(10px,2.4vh,20px) 12px;box-shadow:0 10px 26px #0005}.tb-round small{font-size:clamp(13px,3.8vw,16px);font-weight:850;opacity:.9;letter-spacing:.04em;text-transform:uppercase}.tb-round b{font-size:clamp(30px,9.5vw,48px);font-weight:1000;line-height:1.05}.tb-round span{font-size:clamp(14px,4.1vw,18px);font-weight:750;line-height:1.25;opacity:.95}",
      ".tb-rtab{flex:none;display:flex;flex-direction:column;gap:4px;border-radius:14px;background:rgba(255,255,255,.08);padding:7px 10px}.tb-rtab div{display:grid;grid-template-columns:minmax(0,1fr) 3.2em 3.2em;align-items:center;font-size:clamp(13px,3.8vw,16px);font-weight:800}.tb-rtab div.ora{color:#ffd43b}.tb-rtab em{font-style:normal;text-align:center;font-variant-numeric:tabular-nums}.tb-rtab div:first-child em{font-size:12px;opacity:.8}",
      ".tb-rub{font-size:clamp(64px,22vw,110px);font-weight:1000;line-height:1;font-variant-numeric:tabular-nums;color:#b197fc}.tb-rubp{font-size:clamp(17px,5vw,22px);font-weight:900;border-radius:12px;background:rgba(255,255,255,.12);padding:6px 14px}",
      ".tb-btn.viola{background:#9775fa;color:#170b3b}.tb-btn .tb-q{display:block;font-size:.62em;font-weight:850;opacity:.85}",
      ".tb-turno.tre{color:#d0bfff}.tb-corpo:has(>.tb-round){justify-content:center}",
      "@media(max-height:700px){.tb-round{padding:8px 10px}.tb-round b{font-size:30px}.tb-rub{font-size:64px}}",
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
    var V = { ui: null, v: null, key: "", seq: null, fineLocale: 0, ultimoSec: -1, omini: Object.create(null), bloccoFino: 0, tBanner: null, festa: "", avantiK: null };
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
      if (squadraDi(v, me) === v.team) return "compagno";
      // 🫳 con la Rubata solo uno degli avversari controlla (vede la carta e ha il BUZZ): gli altri ascoltano per rubarla
      if (v.ctrl && me !== v.ctrl) return "ruba";
      return "avversario";
    }
    function roundN(v) { return v.tre ? v.tre.n : 1; }
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
      else if (ev.tipo === "rubata") {   // l'altra squadra ha preso l'ultima carta: è un momento che conta
        suono("giusta"); vola("🫳 +1", "ok");
        if (dentro(v) && v.rubata && squadraDi(v, io()) === v.rubata.ruba) vibra(30);
      } else if (ev.tipo === "rubno") suono("passo");
      else if (ev.tipo === "rubann") suono("via");
    }

    // ---- la parte che cambia: si rifà solo quando cambia carta, turno o fase ----
    function chiave(v) {
      var r = ruolo(v);
      if (v.fase === "turno") return ["T", v.turno, v.chiaveCarta, r, v.carta ? 1 : 0, v.pausa ? 1 : 0, v.passati, roundN(v)].join("|");
      if (v.fase === "pronto") return ["P", v.turno, v.attivo, r, v.avviso || "", v.pausa ? 1 : 0, (v.riepilogo && v.riepilogo.turno) || 0, o.sonoHost ? v.presenti : 0, v.ctrl || "", v.ripresa ? 1 : 0, roundN(v), v.rifatto || 0].join("|");
      if (v.fase === "rubata") return ["U", v.turno, r, v.rubata ? v.rubata.esito || "" : ""].join("|");
      if (v.fase === "round") return ["R", v.inter ? v.inter.k : "", dentro(v) ? 1 : 0].join("|");
      return "F|" + v.partitaId;
    }
    function corpo(v) {
      var ui = V.ui; ui.corpo.innerHTML = ""; ui.tasti.innerHTML = ""; ui.conta = null; ui.rubN = null; ui.avanti = null; nascondiBanner();
      if (v.fase === "turno") corpoTurno(v, ui);
      else if (v.fase === "pronto") corpoPronto(v, ui);
      else if (v.fase === "rubata") corpoRubata(v, ui);
      else if (v.fase === "round") corpoRound(v, ui);
      else corpoFine(v, ui);
    }
    // la carta: nel round ☝️ e 🤐 le vietate spariscono (si vede solo la parola)
    function carta(c, conPromemoria, n) {
      var box = t.el("div", { class: "tb-carta tb-entra" });
      if (!c) { box.appendChild(t.el("div", { class: "tb-attesa-carta", text: "Carta in arrivo…" })); return box; }
      box.appendChild(t.el("div", { class: "tb-parola", text: c.p }));
      if (!(n > 1)) box.appendChild(t.el("div", { class: "tb-vietate" }, (c.v || []).map(function (w) { return t.el("div", { class: "tb-vietata", text: w }); })));
      if (conPromemoria || n > 1) box.appendChild(t.el("div", { class: "tb-promemoria", text: (ROUND[n] || ROUND[1]).prom }));
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
        ui.corpo.appendChild(carta(v.carta, false, roundN(v)));
        ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: "👀 Partita in corso: giochi dalla prossima." }));
        faccine(ui.tasti);
        return;
      }
      if (r === "spiega" || r === "avversario") {
        ui.corpo.appendChild(carta(v.carta, r === "spiega", roundN(v)));
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
        var ruba = r === "ruba", verbo = roundN(v) === 3 ? "Guarda " : "Ascolta ";
        ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, [
          avatarNodo(t, V.omini[v.attivo], nomeDi(v, v.attivo)),
          t.el("div", { class: "tb-indovina", text: ruba ? "🫳 Occhio!" : "Indovina!" }),
          t.el("div", { class: "tb-sub", text: ruba ? verbo + nomeDi(v, v.attivo) + " in silenzio: se il tempo scade, la tua squadra può rubare l'ultima carta!" : verbo + nomeDi(v, v.attivo) + " e grida la risposta" }), conto]));
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
      if (r.rubata) voci.push(["ru", "🫳 " + r.rubata.p + " · rubata da " + SQUADRE[r.rubata.team]]);
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
      var r = ruolo(v), nome = nomeDi(v, v.attivo), n = roundN(v);
      var regolaSpiega = n === 2 ? "Puoi dire una parola sola." : (n === 3 ? "Solo gesti: niente voce." : "Spiega alla tua squadra senza dire le parole vietate.");
      var sotto = r === "spiega" ? regolaSpiega : (r === "compagno" ? "Tu indovini: " + (n === 3 ? "guarda " : "ascolta ") + nome + "." :
        r === "guarda" ? "Tu guardi: giochi dalla prossima partita." : r === "ruba" ? "Controlla " + nomeDi(v, v.ctrl) + ". Tu stai attento: a fine tempo potete rubare l'ultima carta!" :
        "Tu controlli: premi BUZZ se " + (n === 2 ? "dice più di una parola." : n === 3 ? "parla o fa suoni." : "dice una parola vietata."));
      if (v.ripresa) sotto = (r === "spiega" ? "Continui tu: " : nome + " continua: ") + "restano " + Math.ceil(v.ripresa / 1000) + " s. " + sotto;
      ui.corpo.appendChild(t.el("div", { class: "tb-prossimo" }, [avatarNodo(t, V.omini[v.attivo], nome),
        t.el("div", {}, [t.el("b", { text: r === "spiega" ? (v.ripresa ? "Tocca ancora a te!" : "Tocca a te!") : "Tocca a " + nome }), t.el("span", { text: "Squadra " + SQUADRE[v.team] + " · " + sotto })])]));
      if (v.pausa) {
        ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: "⏸️ Pausa: si riparte quando l'host vuole." }));
        if (o.sonoHost) ui.tasti.appendChild(tasto("largo", "▶ Riprendi", function () { o.pausa(); }));
        return;
      }
      if (r === "spiega") ui.tasti.appendChild(tasto("largo", "▶ Pronti, via!", function () { o.azione("pronto"); }));
      ui.conta = t.el("div", { class: "tb-nota" }); ui.tasti.appendChild(ui.conta);
      if (r !== "spiega") faccine(ui.tasti);   // tra un turno e l'altro: le faccine
    }
    // ---- 🫳 Rubata: il tempo è finito con una carta in gioco, l'altra squadra ha 5 secondi per dirla ----
    function corpoRubata(v, ui) {
      var rb = v.rubata || {}, r = ruolo(v), ladri = "Squadra " + SQUADRE[rb.ruba], nome = nomeDi(v, v.attivo);
      var x = [];
      if (!rb.esito) {
        x.push(t.el("div", { class: "tb-indovina", text: "🫳 RUBATA?" }));
        ui.rubN = t.el("div", { class: "tb-rub", text: "5" }); x.push(ui.rubN);
        var sotto = r === "spiega" ? "La " + ladri + " prova a dire la tua carta. L'hanno detta?" :
          (dentro(v) && squadraDi(v, io()) === rb.ruba ? (io() === v.ctrl ? "La tua squadra prova a dirla (tu l'hai vista: zitto!)" : "Dite subito l'ultima carta: avete 5 secondi!") :
          (r === "compagno" ? "La " + ladri + " prova a rubarvi l'ultima carta…" : "La " + ladri + " prova a rubare l'ultima carta…"));
        x.push(t.el("div", { class: "tb-sub", text: sotto }));
        if (r === "spiega" || io() === v.ctrl || r === "guarda") x.push(t.el("div", { class: "tb-rubp", text: "La carta: " + (rb.parola || "") }));
        if (r === "spiega") {
          ui.tasti.appendChild(tasto("", "✅ L'hanno presa", function () { o.azione("rubata", { presa: 1 }); }));
          ui.tasti.appendChild(tasto("grigio", "❌ No", function () { o.azione("rubata", { presa: 0 }); }));
        } else {
          ui.conta = t.el("div", { class: "tb-nota" }); ui.tasti.appendChild(ui.conta);
        }
      } else if (rb.esito === "presa") {
        x.push(t.el("div", { class: "tb-indovina", text: "🫳 Rubata!" }));
        x.push(t.el("div", { class: "tb-sub", text: "+1 alla " + ladri }));
        x.push(t.el("div", { class: "tb-rubp", text: "La carta: " + (rb.parola || "") }));
        if (o.sonoHost) ui.tasti.appendChild(tasto("grigio largo", "↩️ Annulla rubata", function () { o.azione("annullaRubata"); }));
      } else {
        x.push(t.el("div", { class: "tb-indovina", text: rb.esito === "annullata" ? "↩️ Rubata annullata" : "❌ Niente rubata" }));
        x.push(t.el("div", { class: "tb-rubp", text: "La carta: " + (rb.parola || "") }));
      }
      ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, x));
      if (r !== "spiega" && !ui.tasti.querySelector(".tb-btn")) faccine(ui.tasti);
    }
    // ---- 🧺 tra un round e l'altro: i punti, il round nuovo con la sua regola, «⏩ Avanti» a maggioranza ----
    function corpoRound(v, ui) {
      var it = v.inter || {}, me = io();
      ui.corpo.appendChild(rigaRound(t, it.n || 2));
      ui.corpo.appendChild(tabellaRound(t, v.tre && v.tre.punti, (it.n || 2) - 1));
      if (it.riepilogo) { var salva = v.riepilogo; v.riepilogo = it.riepilogo; riepilogo(v, ui); v.riepilogo = salva; }
      else if (it.chi) ui.corpo.appendChild(t.el("div", { class: "tb-prossimo" }, [avatarNodo(t, V.omini[it.chi], nomeDi(v, it.chi)),
        t.el("div", {}, [t.el("b", { text: it.chi === me ? "Poi continui tu" : "Poi continua " + nomeDi(v, it.chi) }), t.el("span", { text: "Il turno va avanti col tempo che restava: " + Math.ceil((it.resta || 0) / 1000) + " s" })])]));
      var conto = t.el("div", { class: "tb-nota" });
      ui.tasti.appendChild(conto);
      if (t.contoAvanti) t.contoAvanti(conto, Math.max(1, Math.ceil((v.restano || 0) / 1000)), null, "tb-round|" + it.k);
      var p = giocatore(v, me);
      if (p && !p.via) {
        ui.avanti = tasto("largo viola", "⏩ Avanti", function () { V.avantiK = it.k; aggiornaAvanti(V.v); o.azione("avanti", { k: it.k }); });
        ui.tasti.appendChild(ui.avanti);
        aggiornaAvanti(v);
      }
      faccine(ui.tasti);
    }
    // il mio tocco resta «✅ Avanti»: cambia solo il numero (niente lampeggio)
    function aggiornaAvanti(v) {
      var b = V.ui && V.ui.avanti, it = v && v.inter; if (!b || !it) return;
      var l = it.pronti || [], mio = V.avantiK === it.k || l.indexOf(io()) >= 0, n = l.length + (mio && l.indexOf(io()) < 0 ? 1 : 0);
      var testo = (mio ? "✅ Avanti" : "⏩ Avanti"), q = Math.min(n, it.servono || 1) + " su " + (it.servono || 1);
      if (b.firstChild && b.firstChild.nodeType === 3 && b.firstChild.nodeValue === testo && b.querySelector(".tb-q") && b.querySelector(".tb-q").textContent === q) return;
      b.textContent = testo; b.appendChild(t.el("span", { class: "tb-q", text: q }));
      b.disabled = mio;
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
      } else if (v.fase === "rubata") {
        ui.barra.style.visibility = "hidden"; ui.timer.className = "tb-timer testo";
        var esito = v.rubata && v.rubata.esito;
        ui.timer.textContent = esito ? "🫳" : (sec > 0 ? String(sec) : "⏰");
        if (ui.rubN) ui.rubN.textContent = sec > 0 ? String(sec) : "⏰";
        if (ui.conta) ui.conta.textContent = sec > 0 ? "" : "Decide " + nomeDi(v, v.attivo) + "…";
        if (!esito && sec <= 5 && sec > 0 && sec !== V.ultimoSec) suono("tic");
        V.ultimoSec = sec;
      } else if (v.fase === "round") {
        ui.barra.style.visibility = "hidden"; ui.timer.className = "tb-timer testo"; ui.timer.textContent = "🧺";
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
      var tre = v.tre, testa = tre ? nomeRound(tre.n) + " · 🧺 " + tre.carte :"Turno " + v.turno + " di " + v.totale;
      ui.turno.classList.toggle("tre", !!tre);
      if (v.fase === "turno") ui.turno.textContent = testa + " · " + (v.attivo === me ? "spieghi tu" : nomeDi(v, v.attivo) + " spiega");
      else if (v.fase === "pronto") ui.turno.textContent = v.attivo ? testa : (v.avviso ? "Partita ferma" : (tre ? "Tre round finiti" : "Turni finiti"));
      else if (v.fase === "rubata") ui.turno.textContent = "Tempo! · " + (v.attivo === me ? "hai spiegato tu" : nomeDi(v, v.attivo) + " ha spiegato");
      else if (v.fase === "round") ui.turno.textContent = "Round " + ((v.inter && v.inter.n) || 2) + " di 3";
      else ui.turno.textContent = "";
      if (v.fase === "round") aggiornaAvanti(v);
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
          if (prima.fase === "turno" && (v.fase === "pronto" || v.fase === "rubata")) suono("gong");
          else if (prima.fase === "pronto" && v.fase === "turno") suono("via");
          else if (prima.fase !== "round" && v.fase === "round") { suono("fanfara"); if (dentro(v)) vibra(25); }   // round nuovo
        }
        var ev = v.ultimo;
        if (V.seq == null) V.seq = ev ? ev.seq : 0;   // appena arrivato: gli eventi vecchi non si ripetono
        else if (ev && ev.seq !== V.seq) { V.seq = ev.seq; if (v.fase === "turno" || v.fase === "rubata") evento(ev, v); }
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
    var RI = leggiImp(t.impostazioni);
    var durata = RI.durata, giri = RI.giri, livello = RI.livello, treOn = RI.tre, mazzoN = RI.mazzoN, rubataOn = RI.rubata;
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
    // 🧺 tre round: tre = { n: il round, tutte: le carte della partita, coda: quelle ancora da indovinare in questo round, punti: [[A, B] per round], finita }
    var tre = null;
    var continua = null;    // { id, ms }: il turno rimasto a metà quando il mazzo è finito continua nel round dopo
    var inter = null;      // tra un round e l'altro: { n, k, pronti, scade, riepilogo, chi, resta }
    // 🫳 rubata: rub = { parola, ruba (la squadra che prova), scade, decidi, esito: null/"presa"/"no"/"annullata", fino }
    var rub = null, ctrl = null, ctrlPunt = [0, 0], rubate = [0, 0];
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
      var x = leggiImp(Object.assign({}, t.impostazioni, nuove || {}));
      durata = x.durata; giri = x.giri; livello = x.livello; treOn = x.tre; mazzoN = x.mazzoN; rubataOn = x.rubata;
      t.impostazioni.tempo = durata; t.impostazioni.giri = giri; t.impostazioni.carte = livello;
      t.impostazioni.partita = treOn ? "tre" : "classica"; t.impostazioni.mazzo = mazzoN; t.impostazioni.rubata = rubataOn ? 1 : 0;
      aggiornaLobby();
    };

    // ---- la foto della partita (la carta c'è dentro: un solo messaggio per tutti) ----
    function restano() {
      if (pausa) return rimasto;
      if (fase === "turno") return Math.max(0, deadline - Date.now());
      if (fase === "pronto" && prontoScade) return Math.max(0, prontoScade - Date.now());
      if (fase === "rubata" && rub) return rub.esito ? 0 : Math.max(0, rub.scade - Date.now());
      if (fase === "round" && inter) return Math.max(0, inter.scade - Date.now());
      return 0;
    }
    function inRipresa() { return fase === "pronto" && continua && continua.id === attivo; }
    function vm(conOmini) {
      var omini = conOmini || fase !== "turno";
      return { fase: fase, codice: codice, pronta: pronta, partitaId: partitaId,
        giocatori: giocatori.map(function (p) { var x = { id: p.id, nome: p.nome, host: !!p.host, via: !!p.via }; if (omini) x.omino = p.omino; return x; }),
        squadre: squadre, punti: punti.slice(), durata: durata, giri: giri,
        turno: (fase === "turno" || fase === "rubata" || inRipresa()) ? indiceTurno : indiceTurno + 1, totale: tre ? 0 : coda.length,
        attivo: attivo, team: attivo == null ? null : squadra(attivo),
        restano: restano(), pausa: pausa, avviso: avviso, presenti: giocatori.filter(function (p) { return !p.via; }).length,
        chiaveCarta: chiaveCarta, carta: fase === "turno" ? cartaOra : null, passati: passati,
        giusteTurno: statTurno ? statTurno.giuste.length : 0, combo: attivo ? statPersona(attivo).comboCarte : 0,
        ultimo: ultimo, riepilogo: fase === "pronto" ? riepilogo : null, rifatto: fase === "pronto" && rifatto === indiceTurno + 1 ? rifatto : 0,
        // 🧺 / 🫳
        tre: tre ? { n: tre.n, carte: tre.coda.length + (cartaOra && (fase === "turno" || fase === "rubata") ? 1 : 0), punti: tre.punti.map(function (p) { return p.slice(); }) } : null,
        rubataOn: rubataOn, ctrl: ctrl,
        rubata: fase === "rubata" && rub ? { parola: rub.parola, ruba: rub.ruba, esito: rub.esito } : null,
        inter: fase === "round" && inter ? { n: inter.n, k: inter.k, pronti: prontiVeri(), servono: servono(), riepilogo: inter.riepilogo, chi: inter.chi, resta: inter.resta } : null,
        ripresa: inRipresa() ? continua.ms : 0,   // (il turno che continua nel round dopo: i ms che restano)
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
        statGiocatori: statGiocatori, guarda: guarda, inizioTurno: inizioTurno, seqEv: seqEv, chiaveCarta: chiaveCarta,
        // 🧺 / 🫳 (le ore restano ore: alla ripresa si convertono con t.ripresa.ora)
        treOn: treOn, mazzoN: mazzoN, rubataOn: rubataOn, tre: tre, continua: continua, inter: inter, rub: rub, ctrl: ctrl,
        ctrlPunt: ctrlPunt, rubate: rubate, statTurno: statTurno });
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
      if (R0.treOn != null) { treOn = !!R0.treOn; mazzoN = R0.mazzoN || mazzoN; rubataOn = !!R0.rubataOn; }
      tre = R0.tre || null; continua = R0.continua || null; inter = R0.inter || null; rub = R0.rub || null; ctrl = R0.ctrl || null;
      ctrlPunt = R0.ctrlPunt || ctrlPunt; rubate = R0.rubate || rubate; statTurno = R0.statTurno || null;
      if (inter) inter.scade = Date.now() + Math.max(8000, (t.ripresa.ora(inter.scade) || 0) - Date.now());   // (il cambio di round: almeno 8 s di respiro)
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
        if (fase === "rubata" && id === attivo && rub && !rub.esito) return decidiRubata(false);   // chi spiegava non c'è più: niente rubata
        if (fase === "round") { if (prontiVeri().length >= servono()) return fineIntermezzo(); return inviaStato(); }
        if ((fase === "turno" || fase === "pronto") && id === ctrl && attivo) ctrl = scegliCtrl(1 - squadra(attivo));   // controlla un altro
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
      if (fase === "round" && inter) return inviaStato(true);   // 🧺 tra un round e l'altro si resta lì (col conto che restava)
      if (fase === "turno" || fase === "rubata") {   // (anche la 🫳 rubata: il turno si rifà da capo, rubata compresa)
        if (inizioTurno) {
          punti = inizioTurno.punti.slice(); statGiocatori = inizioTurno.stat;
          if (inizioTurno.tre) tre = inizioTurno.tre;   // 🧺 il mazzo del round com'era a inizio turno
          if (inizioTurno.rubate) rubate = inizioTurno.rubate.slice();
          if (inizioTurno.cont && attivo) statPersona(attivo).turniSpiegati = Math.max(0, statPersona(attivo).turniSpiegati - 1);   // (avviaTurno lo riconta)
        }
        rub = null; continua = null; fase = "turno";
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
      if (tipo === "avanti") return avanti(id, extra && extra.k);
      if (tipo === "rubata") { if (fase === "rubata" && rub && !rub.esito && id === attivo) decidiRubata(!!(extra && extra.presa)); return; }
      if (tipo === "annullaRubata") { if (id === IO) annullaRubata(); return; }
      if (fase !== "turno" || pausa || chiave !== chiaveCarta || !cartaOra) return;
      if (tipo === "indovinata" && id === attivo) registra("giusta", id);
      else if (tipo === "passo" && id === attivo && passati < MAX_PASSI) registra("passata", id);
      else if (tipo === "buzz" && gioc(id) && squadra(id) !== squadra(attivo) && (!ctrl || id === ctrl)) registra("buzz", id);
    }

    // ---- turni: le due squadre si alternano, ognuna con lo stesso numero di turni; dentro la squadra si va a giro ----
    // (nei tre round i turni non sono contati: si va avanti finché il terzo round non ha finito le carte)
    function squadraTurno(i) { return tre ? (primaSquadra + i) % 2 : coda[i]; }
    function finiti() { return tre ? !!tre.finita : indiceTurno >= coda.length; }
    function inizia() {
      if (fase !== "lobby" || giocatori.length < MIN || membri(0).length < 2 || membri(1).length < 2) return;
      punti = [0, 0]; carte = mazzo(livello); indiceCarta = 0; indiceTurno = 0; uscite = [];
      puntatore = [0, 0]; coda = []; sceltoPer = null; ultimo = null; ultimoBuzz = null; fine = null; riepilogo = null; pausa = false;
      continua = null; inter = null; rub = null; ctrl = null; ctrlPunt = [Math.floor(Math.random() * 16), Math.floor(Math.random() * 16)]; rubate = [0, 0]; tre = null;
      giocatori.forEach(function (p) { statPersona(p.id); });
      if (treOn) {   // 🧺 si pesca il mazzo della partita: le stesse carte nei tre round
        var tutte = carte.slice(0, mazzoN); indiceCarta = tutte.length;
        tre = { n: 1, tutte: tutte, coda: mescola(tutte), punti: [[0, 0], [0, 0], [0, 0]], finita: false };
      } else {
        var turniSquadra = Math.max(membri(0).length, membri(1).length) * giri;
        for (var k = 0; k < turniSquadra * 2; k++) coda.push((primaSquadra + k) % 2);
      }
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
    function scegliCtrl(s) {   // 🫳 chi controlla, a giro tra gli avversari collegati
      var m = membri(s); if (!m.length) return null;
      for (var i = 0; i < m.length; i++) {
        var p = m[(ctrlPunt[s] + i) % m.length];
        if (!p.via) { ctrlPunt[s] = (ctrlPunt[s] + i + 1) % m.length; return p.id; }
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
      fase = "pronto"; pausa = false; avviso = null; cartaOra = null; rub = null;
      if (continua) {   // il turno rimasto a metà: se chi spiegava non c'è più, il suo turno si chiude qui
        var rp = gioc(continua.id);
        if (!rp || rp.via) { attivo = continua.id; continua = null; if (statTurno) chiudiTurno(true); }
      }
      if (!continua) statTurno = null;
      if (finiti()) { attivo = null; ctrl = null; prontoScade = Date.now() + 6500; return inviaStato(true); }
      if (presenti(0).length < 2 || presenti(1).length < 2) { attivo = null; ctrl = null; prontoScade = 0; avviso = testoMancano(); return inviaStato(true); }
      if (continua) attivo = continua.id;
      else {
        // se per questo turno era già stato scelto qualcuno (e c'è ancora), resta lui: nessuno perde il suo turno
        var s = squadraTurno(indiceTurno), prima = sceltoPer && sceltoPer.turno === indiceTurno ? gioc(sceltoPer.id) : null;
        attivo = prima && !prima.via && squadra(prima.id) === s ? prima.id : scegli(s);
        sceltoPer = { turno: indiceTurno, id: attivo };
      }
      if (rubataOn) {   // 🫳 tra gli avversari controlla uno solo (gli altri ascoltano per rubare l'ultima carta)
        var c = ctrl ? gioc(ctrl) : null;
        if (!(continua && c && !c.via && squadra(ctrl) !== squadra(attivo))) ctrl = scegliCtrl(1 - squadra(attivo));
      } else ctrl = null;
      prontoScade = Date.now() + ATTESA_PRONTO;
      inviaStato(true);
    }
    function avviaTurno() {
      // (com'era prima del turno: se la partita riprende a metà, il turno si rifà da qui; 🧺 col mazzo del round com'era)
      var cont = !!(continua && continua.id === attivo);
      inizioTurno = { punti: punti.slice(), stat: JSON.parse(JSON.stringify(statGiocatori)), tre: tre ? JSON.parse(JSON.stringify(tre)) : null, rubate: rubate.slice(), cont: cont };
      fase = "turno"; pausa = false;
      if (cont) {   // 🧺 il turno di prima continua nel round nuovo, col tempo che restava
        deadline = Date.now() + continua.ms; continua = null;
        pescaCarta(); return inviaStato();
      }
      continua = null;
      indiceTurno++; passati = 0;
      statTurno = { giuste: [], buzz: [], passate: [] };
      statPersona(attivo).turniSpiegati++; statPersona(attivo).comboCarte = 0;
      deadline = Date.now() + durata * 1000;
      pescaCarta(); inviaStato();
    }
    function pescaCarta() {
      if (tre) { cartaOra = tre.coda.shift() || null; if (!cartaOra) return; }
      else {
        if (indiceCarta >= carte.length) { carte = mescola(carteDelLivello(livello)); indiceCarta = 0; }   // mazzo finito: si rimescola
        cartaOra = carte[indiceCarta++];
      }
      chiaveCarta++; uscite.push(cartaOra.p);
    }
    function evento(tipo, id, parola) { ultimo = { tipo: tipo, seq: ++seqEv, nome: id ? (gioc(id) || {}).nome : null, parola: parola || null }; }
    function registra(tipo, id) {
      var speaker = statPersona(attivo), parola = cartaOra.p, sq = squadra(attivo), c = cartaOra;
      if (tipo === "giusta") { punti[sq]++; statTurno.giuste.push(parola); speaker.carteIndovinate++; speaker.comboCarte++; speaker.comboCarteMax = Math.max(speaker.comboCarteMax, speaker.comboCarte); evento("giusta", id, parola); }
      else if (tipo === "buzz") {
        punti[sq]--; statTurno.buzz.push(parola); speaker.buzzSubiti++; speaker.comboCarte = 0; statPersona(id).buzzFatti++;
        evento("buzz", id, parola);
        ultimoBuzz = { seq: ultimo.seq, ora: Date.now(), da: id, speaker: attivo, team: sq, parola: parola, turno: indiceTurno, round: tre ? tre.n : 0 };
      } else { passati++; statTurno.passate.push(parola); speaker.cartePassate++; speaker.comboCarte = 0; evento("passo", id, parola); }
      cartaOra = null;
      if (tre) {   // 🧺 la carta indovinata esce dal round; quelle passate o col BUZZ tornano in fondo al mazzo
        if (tipo === "giusta") tre.punti[tre.n - 1][sq]++;
        else { if (tipo === "buzz") tre.punti[tre.n - 1][sq]--; tre.coda.push(c); }
        if (!tre.coda.length) return roundFinitoNelTurno();
      }
      pescaCarta(); inviaStato();
    }
    function annullaBuzz(seq) {
      var b = ultimoBuzz;
      if (!b || b.seq !== seq || b.annullato || fase !== "turno" || b.turno !== indiceTurno || Date.now() - b.ora > ANNULLA_MS + 1500) return;
      b.annullato = true; punti[b.team]++;
      if (tre && b.round) tre.punti[b.round - 1][b.team]++;
      var i = statTurno.buzz.lastIndexOf(b.parola); if (i >= 0) statTurno.buzz.splice(i, 1);
      statPersona(b.da).buzzFatti = Math.max(0, statPersona(b.da).buzzFatti - 1);
      statPersona(b.speaker).buzzSubiti = Math.max(0, statPersona(b.speaker).buzzSubiti - 1);
      evento("annullato", b.da, b.parola); inviaStato();
    }
    // il riepilogo del turno e i contatori di chi ha spiegato
    function chiudiTurno(uscito) {
      var buono = statTurno.giuste.length > statTurno.buzz.length, st = statPersona(attivo);
      if (buono) st.turniPositivi++;
      st.esitiTurni.push(buono);
      riepilogo = { turno: indiceTurno, id: attivo, nome: (gioc(attivo) || {}).nome || "…", uscito: !!uscito, team: squadra(attivo),
        giuste: statTurno.giuste.slice(), buzz: statTurno.buzz.slice(), passate: statTurno.passate.slice(), rubata: statTurno.rubata || null };
      segnaViste(uscite); uscite = [];
    }
    function fineTurno(uscito) {
      if (fase !== "turno" && fase !== "rubata") return;
      if (tre && cartaOra) tre.coda.push(cartaOra);   // 🧺 la carta rimasta in mano torna in fondo al mazzo del round
      cartaOra = null; rub = null;
      chiudiTurno(uscito);
      if (tre && !tre.coda.length) {
        if (tre.n >= 3) tre.finita = true;
        else return apriRound(riepilogo, null, 0);
      }
      preparaPronto();
    }
    // il tempo è finito: con la Rubata e una carta in gioco, prima l'altra squadra prova a dirla
    function tempoFinito() {
      if (rubataOn && cartaOra) return iniziaRubata();
      fineTurno(false);
    }

    // ---- 🧺 i tre round ----
    function roundFinitoNelTurno() {   // il mazzo del round è finito mentre si spiegava
      if (tre.n >= 3) { tre.finita = true; return fineTurno(false); }
      var resta = Math.max(0, deadline - Date.now());
      if (resta < RIPRESA_MIN) return fineTurno(false);
      continua = { id: attivo, ms: resta };
      apriRound(null, attivo, resta);
    }
    function apriRound(riep, chi, resta) {
      fase = "round"; attivo = null; cartaOra = null; pausa = false; avviso = null; rub = null;
      if (!chi) ctrl = null;
      tre.n++; tre.coda = mescola(tre.tutte);
      inter = { n: tre.n, k: partitaId + "|r" + tre.n, pronti: [], scade: Date.now() + ATTESA_ROUND * 1000, riepilogo: riep, chi: chi, resta: resta };
      inviaStato(true);
    }
    function servono() { return Math.floor(giocatori.filter(function (p) { return !p.via; }).length / 2) + 1; }
    function prontiVeri() { return inter ? inter.pronti.filter(function (id) { var p = gioc(id); return p && !p.via; }) : []; }
    // «⏩ Avanti»: si parte subito se lo tocca più di metà di chi gioca ed è collegato (il tocco vale solo per questo cambio di round)
    function avanti(id, k) {
      if (fase !== "round" || !inter || k !== inter.k) return;
      var p = gioc(id); if (!p || p.via) return;
      if (inter.pronti.indexOf(id) < 0) inter.pronti.push(id);
      if (prontiVeri().length >= servono()) return fineIntermezzo();
      inviaStato();
    }
    function fineIntermezzo() {
      if (fase !== "round") return;
      inter = null; riepilogo = null;
      preparaPronto();
    }

    // ---- 🫳 la rubata ----
    function iniziaRubata() {
      fase = "rubata";
      rub = { parola: cartaOra.p, ruba: 1 - squadra(attivo), scade: Date.now() + RUBATA_MS, decidi: Date.now() + RUBATA_MS + DECIDI_MS, esito: null, fino: 0 };
      inviaStato();
    }
    function decidiRubata(presa) {
      if (fase !== "rubata" || !rub || rub.esito) return;
      if (presa) {
        rub.esito = "presa"; punti[rub.ruba]++; rubate[rub.ruba]++; if (tre) tre.punti[tre.n - 1][rub.ruba]++;
        evento("rubata", attivo, rub.parola); rub.fino = Date.now() + ANNULLA_MS;   // l'host può ancora annullarla
      } else { rub.esito = "no"; evento("rubno", attivo, rub.parola); rub.fino = Date.now() + 1800; }
      inviaStato();
    }
    function annullaRubata() {
      if (fase !== "rubata" || !rub || rub.esito !== "presa") return;
      rub.esito = "annullata"; punti[rub.ruba]--; rubate[rub.ruba]--; if (tre) tre.punti[tre.n - 1][rub.ruba]--;
      evento("rubann", IO, rub.parola); rub.fino = Date.now() + 1800;
      inviaStato();
    }
    function chiudiRubata() {
      if (fase !== "rubata" || !rub) return;
      if (rub.esito === "presa") { statTurno.rubata = { p: rub.parola, team: rub.ruba }; cartaOra = null; }   // presa: esce anche dal mazzo del round
      fineTurno(false);
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
      if (continua && statTurno) { attivo = continua.id; continua = null; chiudiTurno(false); }   // squadre nuove: il turno a metà si chiude
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
      if (tre) x.push("🧺 Round per round (A–B): " + tre.punti.map(function (p) { return p[0] + "–" + p[1]; }).join(" · "));
      if (rubate[0] || rubate[1]) x.push("🫳 Carte rubate: A " + rubate[0] + " · B " + rubate[1]);
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
      fase = "fine"; attivo = null; pausa = false; avviso = null; deadline = 0; prontoScade = 0; rub = null; inter = null; continua = null; ctrl = null;
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
      tre = null; continua = null; inter = null; rub = null; ctrl = null; rubate = [0, 0];
      aggiornaLobby();
    }
    function chiudi() { clearTimeout(tAttesi); if (tic) { clearInterval(tic); tic = null; } if (rete) { rete.chiudi(); rete = null; } }
    // la Rivincita dei tasti di fine comuni: tutti di nuovo nella saletta, stesse squadre (il core fa il 3-2-1)
    t.onRivincita = function () { if (fase === "fine") nuovaPartita(); };

    // l'orologio dell'host: fine del tempo, rubata, cambio di round e partenza da soli
    tic = setInterval(function () {
      var ora = Date.now();
      if (!pausa) {
        if (fase === "turno" && ora >= deadline) tempoFinito();
        else if (fase === "pronto" && prontoScade && ora >= prontoScade) { if (attivo) avviaTurno(); else finePartita(); }
        else if (fase === "rubata" && rub) { if (!rub.esito && ora >= rub.decidi) decidiRubata(false); else if (rub.esito && ora >= rub.fino) chiudiRubata(); }
        else if (fase === "round" && inter && ora >= inter.scade) fineIntermezzo();
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

  // ---- 🧺 il round nuovo e i punti round per round (online e su questo telefono) ----
  function rigaRound(t, n) { return t.el("div", { class: "tb-round" }, [t.el("small", { text: "Round " + n + " di 3" }), t.el("b", { text: nomeRound(n) }), t.el("span", { text: ROUND[n].regola })]); }
  // i punti round per round (la riga del round in corso in giallo)
  function tabellaRound(t, pr, ora) {
    var tab = t.el("div", { class: "tb-rtab" }, [t.el("div", {}, [t.el("span", { text: "" }), t.el("em", { text: "A" }), t.el("em", { text: "B" })])]);
    (pr || []).forEach(function (x, i) {
      if (i + 1 > ora) return;
      tab.appendChild(t.el("div", { class: i + 1 === ora ? "ora" : "" }, [t.el("span", { text: nomeRound(i + 1) }), t.el("em", { text: String(x[0]) }), t.el("em", { text: String(x[1]) })]));
    });
    return tab;
  }
  // =========================================================
  //  SU QUESTO TELEFONO: il classico. Chi spiega tiene il telefono,
  //  un avversario guarda la carta da sopra la spalla e preme BUZZ.
  // =========================================================
  var ICONE = { ok: "✅", no: "❌", pa: "⏭️", ru: "🫳" };
  function vibra(x) { try { if (navigator.vibrate) navigator.vibrate(x); } catch (e) {} }
  function elenco(nomi) { return nomi.length > 1 ? nomi.slice(0, -1).join(", ") + " e " + nomi[nomi.length - 1] : (nomi[0] || ""); }
  function presa(e) { return e === "ok" || e === "ru"; }   // la carta è stata detta (dalla squadra o rubata)

  function locale(t) {
    stile();
    var R = leggiImp(t.impostazioni);
    var durata = R.durata, giri = R.giri, livello = R.livello;
    var mio = (t.nomeProfilo && t.nomeProfilo()) || "", ominoMio = mio ? avatar(mio) : null;
    // i giocatori per posto (due nomi uguali restano due persone diverse)
    var gio = (t.giocatori || []).map(function (n, k) { return { k: k, nome: String(n || "").trim() || ("Giocatore " + (k + 1)), sq: 0 }; });
    var L = { turni: [], coda: [], idx: 0, punt: [0, 0], ctrl: [0, 0], prima: Math.random() < 0.5 ? 0 : 1,
      carte: mazzo(livello), ic: 0, uscite: [], T: null, ui: null, tic: null, finita: false,
      tre: null,              // 🧺 { n: il round, tutte: le carte della partita, coda: quelle ancora da dire in questo round }
      rubata: R.rubata };     // 🫳

    function membri(s) { return gio.filter(function (p) { return p.sq === s; }); }
    function tuttiTurni() { return L.T && L.turni.indexOf(L.T) < 0 ? L.turni.concat([L.T]) : L.turni; }   // (anche il turno in corso)
    function punti(round) {
      var p = [0, 0];
      tuttiTurni().forEach(function (T) {
        T.carte.forEach(function (c) {
          if (round && c.r !== round) return;
          if (c.e === "ok") p[T.sq]++; else if (c.e === "no") p[T.sq]--; else if (c.e === "ru") p[1 - T.sq]++;
        });
      });
      return p;
    }
    function puntiRound() { return [punti(1), punti(2), punti(3)]; }
    function treFinito() { return L.tre && L.tre.n >= 3 && !L.tre.coda.length; }
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
      ui.turno = t.el("div", { class: "tb-turno" + (L.tre ? " tre" : "") });
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
      ui.turno.textContent = R.tre ? "Le squadre · 🧺 Tre round con " + R.mazzoN + " carte" : "Le squadre";
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
        t.el("div", { class: "tb-sub", text: "A turno uno spiega alla sua squadra; un avversario guarda la carta e preme BUZZ." + (L.rubata ? " 🫳 A fine tempo gli altri possono rubare l'ultima carta." : "") })]));
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
    // (nei tre round i turni non sono contati: si va avanti finché il terzo round non ha finito le carte)
    function comincia() {
      if (R.tre) {   // 🧺 si pesca il mazzo della partita: le stesse carte nei tre round
        var tutte = L.carte.slice(0, R.mazzoN); L.ic = tutte.length;
        L.tre = { n: 1, tutte: tutte, coda: mescola(tutte) };
        L.coda = [];
      } else {
        var turniSquadra = Math.max(membri(0).length, membri(1).length) * giri;
        L.coda = []; for (var k = 0; k < turniSquadra * 2; k++) L.coda.push((L.prima + k) % 2);
      }
      L.idx = 0; L.turni = []; L.punt = [0, 0]; L.ctrl = [1, 1];   // (chi controlla non è chi spiega subito dopo: si può preparare)
      prossimo();
    }
    function prossimoChi() {   // chi spiega e chi controlla nel prossimo turno (senza andare avanti)
      if (L.tre ? treFinito() : L.idx >= L.coda.length) return null;
      var s = L.tre ? (L.prima + L.idx) % 2 : L.coda[L.idx], m = membri(s), a = membri(1 - s);
      return { sq: s, chi: m[L.punt[s] % m.length], ctrl: a[L.ctrl[1 - s] % a.length] };
    }
    function prossimo() {
      var x = prossimoChi(); if (!x) return finale();
      L.punt[x.sq]++; L.ctrl[1 - x.sq]++; L.idx++;
      L.T = { n: L.idx, sq: x.sq, chi: x.chi, ctrl: x.ctrl, carte: [], passati: 0, carta: null, corre: false, pausa: false, combo: 0, comboMax: 0, ripresa: 0 };
      schermoPronto();
    }
    function nR() { return L.tre ? L.tre.n : 1; }
    function testoTurno() { return L.tre ? "Turno " + L.T.n + " · " + nomeRound(L.tre.n) : "Turno " + L.T.n + " di " + L.coda.length; }
    function regolaBuzz() { var n = nR(); return n === 2 ? "dice più di una parola" : (n === 3 ? "parla o fa suoni" : "dice una parola vietata"); }
    function schermoPronto() {
      var T = L.T, ui = cornice(false), compagni = membri(T.sq).filter(function (p) { return p !== T.chi; }).map(function (p) { return p.nome; });
      var n = nR(), rip = T.ripresa;
      ui.timer.textContent = "Pronti?";
      ui.turno.textContent = testoTurno();
      var spiega = rip ? "Continui tu: restano " + Math.ceil(rip / 1000) + " s" : "Squadra " + SQUADRE[T.sq] + " · spieghi a " + elenco(compagni);
      if (L.tre) spiega += " · " + (n === 1 ? "come sempre, senza le vietate" : n === 2 ? "una parola sola!" : "solo gesti, niente voce!");
      ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, [
        t.el("div", { class: "tb-sub", text: rip ? "📱 Tieni il telefono:" : "📱 Passa il telefono a" }),
        avatarNodo(t, omino(T.chi.nome), T.chi.nome),
        t.el("div", { class: "tb-indovina", text: T.chi.nome }),
        t.el("div", { class: "tb-sub", text: spiega }),
        t.el("div", { class: "tb-loc-ctrl" }, [t.el("b", { text: "👀 " + T.ctrl.nome + " controlla" }),
          t.el("span", { text: "Mettiti dietro a " + T.chi.nome + ", guarda la carta e premi BUZZ se " + regolaBuzz() + "." })])
      ]));
      ui.tasti.appendChild(tasto("largo", rip ? "▶ Si riparte!" : "▶ Pronti, via!", partenza));
      ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: "I compagni di " + T.chi.nome + " non guardano lo schermo!" + (L.rubata ? " 🫳 Squadra " + SQUADRE[1 - T.sq] + ": a fine tempo potete rubare l'ultima carta." : "") }));
      t.mostra(ui.s);
    }

    // ---- 3. il turno: la carta, ✅, ⏭️ e il BUZZ sullo stesso telefono ----
    function rigaTurno() {
      var T = L.T;
      if (!L.tre) return testoTurno() + " · 👀 " + T.ctrl.nome + " controlla";
      return nomeRound(L.tre.n) + " · 🧺 " + (L.tre.coda.length + (T.carta ? 1 : 0)) + " · 👀 " + T.ctrl.nome;
    }
    function partenza() {
      var T = L.T, ui = cornice(true);
      T.corre = true; T.fine = Date.now() + (T.ripresa || durata * 1000); T.ripresa = 0;
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
      if (L.tre) { T.carta = L.tre.coda.shift() || null; if (!T.carta) return; }
      else {
        if (L.ic >= L.carte.length) { L.carte = mescola(carteDelLivello(livello)); L.ic = 0; }   // mazzo finito: si rimescola
        T.carta = L.carte[L.ic++];
      }
      L.uscite.push(T.carta.p);
      mostraCarta();
    }
    function cartaNodo(c) {   // nel round ☝️ e 🤐 le vietate spariscono
      var n = nR(), x = [t.el("div", { class: "tb-parola", text: c.p })];
      if (n === 1) x.push(t.el("div", { class: "tb-vietate" }, (c.v || []).map(function (w) { return t.el("div", { class: "tb-vietata", text: w }); })));
      x.push(t.el("div", { class: "tb-promemoria", text: ROUND[n].prom }));
      return t.el("div", { class: "tb-carta tb-entra" }, x);
    }
    function mostraCarta() {   // cambia solo la carta e il tasto dei passi (niente lampeggio)
      var T = L.T, ui = L.ui; if (!viva()) return;
      ui.corpo.innerHTML = "";
      if (T.pausa) {
        ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, [t.el("div", { class: "tb-indovina", text: "⏸️ Pausa" }), t.el("div", { class: "tb-sub", text: "Il tempo è fermo. La carta torna quando riprendete." })]));
      } else if (T.carta) ui.corpo.appendChild(cartaNodo(T.carta));
      ui.turno.textContent = rigaTurno();
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
      var c = T.carta, rec = { p: c.p, e: e, base: "pa", c: c, r: nR() };
      T.carte.push(rec); T.carta = null;   // (fino alla carta nuova i tocchi non contano)
      if (L.tre && e !== "ok") L.tre.coda.push(c);   // 🧺 passata o BUZZ: torna in fondo al mazzo del round
      if (e === "ok") { T.combo++; T.comboMax = Math.max(T.comboMax, T.combo); suono("giusta"); vola("✅ +1", "ok"); if (T.combo >= 5 && T.combo % 5 === 0) vibra(25); }
      else if (e === "pa") { T.passati++; T.combo = 0; suono("passo"); vola("⏭️ Passata", "pa"); }
      else {
        T.combo = 0; suono("buzz"); vola("❌ −1", "no"); vibra([60, 40, 60]);
        var cn = L.ui.corpo.querySelector(".tb-carta"); if (cn) { cn.classList.remove("tb-entra"); cn.classList.add("tb-trema"); }
        bannerBuzz(rec);
      }
      segna(true);
      if (L.tre && !L.tre.coda.length) return roundFinitoNelTurno();
      if (e !== "no") return pesca();
      setTimeout(function () { if (L.T === T && T.corre && !T.carta) pesca(); }, 380);   // dopo il BUZZ la carta trema, poi arriva la nuova
    }
    function bannerBuzz(rec) {
      var b = L.ui.banner; b.innerHTML = ""; b.classList.remove("verde");
      b.appendChild(t.el("b", { text: "🚨 BUZZ!" }));
      b.appendChild(t.el("small", { text: (nR() === 2 ? "Più di una parola" : nR() === 3 ? "Ha parlato" : "Parola vietata") + " · carta: " + rec.p }));
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
      if (!T.pausa && rest <= 0) tempoScaduto(false);
    }
    // il turno finisce (tempo scaduto, o mazzo finito nel terzo round)
    function tempoScaduto(mazzoFinito) {
      var T = L.T; T.corre = false; ferma(); nascondiBanner();
      segnaViste(L.uscite); L.uscite = [];
      var ui = L.ui; ui.ok.disabled = ui.pa.disabled = ui.bz.disabled = true; ui.timer.textContent = mazzoFinito ? "🧺" : "0";
      if (T.carta && L.rubata) { suono("gong"); return setTimeout(function () { if (L.T === T && viva()) schermoRubata(); }, 600); }   // 🫳 prima la rubata
      if (T.carta) {   // la carta allo scadere: se l'avevano detta in tempo, si corregge
        T.carte.push({ p: T.carta.p, e: "nu", base: "nu", ico: "⏰", c: T.carta, r: nR() });
        if (L.tre) L.tre.coda.push(T.carta);
      }
      T.carta = null;
      suono("gong"); vola(mazzoFinito ? "🧺 Carte finite!" : "⏰ Tempo!", "pa");
      L.turni.push(T);
      setTimeout(function () { if (L.T === T && viva()) schermoRiepilogo(); }, 1100);
    }

    // ---- 🧺 il mazzo del round è finito mentre si spiegava ----
    function roundFinitoNelTurno() {
      var T = L.T;
      if (L.tre.n >= 3) return tempoScaduto(true);
      var resta = Math.max(0, T.fine - Date.now());
      if (resta < RIPRESA_MIN) return tempoScaduto(true);
      T.corre = false; ferma(); nascondiBanner(); T.ripresa = resta;
      L.ui.ok.disabled = L.ui.pa.disabled = L.ui.bz.disabled = true; L.ui.timer.textContent = "🧺";
      vola("🧺 Carte finite!", "ok");
      setTimeout(function () { if (L.T === T && viva()) schermoRound(schermoPronto); }, 1000);
    }
    // ---- 🧺 tra un round e l'altro: i punti, il round nuovo con la sua regola ----
    function schermoRound(poi) {
      L.tre.n++; L.tre.coda = mescola(L.tre.tutte);
      var n = L.tre.n, ui = cornice(false), T = L.T, fatto = false;
      function vai() { if (fatto || L.ui !== ui) return; fatto = true; poi(); }
      ui.timer.textContent = "🧺"; ui.turno.textContent = "Round " + n + " di 3";
      ui.corpo.appendChild(rigaRound(t, n));
      ui.corpo.appendChild(tabellaRound(t, puntiRound(), n - 1));
      var dopo = T && T.ripresa ? { chi: T.chi, testo: "Il turno va avanti col tempo che restava: " + Math.ceil(T.ripresa / 1000) + " s", b: "Poi continua " + T.chi.nome } : null;
      if (!dopo) { var x = prossimoChi(); if (x) dopo = { chi: x.chi, testo: "Squadra " + SQUADRE[x.sq] + " · 👀 controlla " + x.ctrl.nome, b: "Poi tocca a " + x.chi.nome }; }
      if (dopo) ui.corpo.appendChild(t.el("div", { class: "tb-prossimo" }, [avatarNodo(t, omino(dopo.chi.nome), dopo.chi.nome), t.el("div", {}, [t.el("b", { text: dopo.b }), t.el("span", { text: dopo.testo })])]));
      var b = tasto("largo viola", "⏩ Avanti", vai);
      ui.tasti.appendChild(b);
      if (t.contoAvanti) t.contoAvanti(b, ATTESA_ROUND, vai, "tb-loc-round|" + n + "|" + L.T.n);
      t.mostra(ui.s);
      suono("fanfara"); vibra(25);
    }

    // ---- 🫳 la rubata: il tempo è finito con una carta in gioco, l'altra squadra ha 5 secondi ----
    function schermoRubata() {
      var T = L.T, c = T.carta, ui = cornice(false), ladri = "Squadra " + SQUADRE[1 - T.sq], fatto = false, fine = Date.now() + RUBATA_MS, ultimo = -1;
      ui.timer.textContent = "5"; ui.turno.textContent = "Tempo! · " + testoTurno();
      var num = t.el("div", { class: "tb-rub", text: "5" });
      var sub = t.el("div", { class: "tb-sub", text: ladri + ": dite subito l'ultima carta! (Non vale " + T.ctrl.nome + ", che l'ha vista.)" });
      ui.corpo.appendChild(t.el("div", { class: "tb-nascondi" }, [t.el("div", { class: "tb-indovina", text: "🫳 RUBATA?" }), num, sub]));
      ui.tasti.appendChild(tasto("", "✅ L'hanno presa", function () { decidi(true); }));
      ui.tasti.appendChild(tasto("grigio", "❌ No", function () { decidi(false); }));
      ui.tasti.appendChild(t.el("div", { class: "tb-nota", text: T.chi.nome + ", decidi tu: l'hanno detta?" }));
      t.mostra(ui.s);
      function conto() {
        if (!viva() || fatto) { ferma(); return; }
        var s = Math.max(0, Math.ceil((fine - Date.now()) / 1000));
        num.textContent = s > 0 ? String(s) : "⏰"; ui.timer.textContent = s > 0 ? String(s) : "⏰";
        if (s > 0 && s !== ultimo) suono("tic");
        ultimo = s;
        if (s <= 0) { sub.textContent = "Tempo! " + T.chi.nome + ": l'hanno detta in tempo?"; ferma(); }
      }
      ferma(); L.tic = setInterval(conto, 200); conto();
      function decidi(si) {
        if (fatto) return; fatto = true; ferma();
        T.carte.push({ p: c.p, e: si ? "ru" : "nu", base: si ? "ru" : "nu", ico: "⏰", c: c, r: nR() });
        if (L.tre && !si) L.tre.coda.push(c);   // 🧺 non presa: torna in fondo al mazzo del round
        T.carta = null; L.turni.push(T); segna(true);
        if (si) { suono("giusta"); vola("🫳 +1 " + ladri, "ok"); vibra(30); } else { suono("passo"); vola("❌ Niente rubata", "pa"); }
        ui.tasti.querySelectorAll(".tb-btn").forEach(function (x) { x.disabled = true; });
        setTimeout(function () { if (L.T === T && viva()) schermoRiepilogo(); }, si ? 1300 : 800);
      }
    }

    // ---- 4. com'è andato il turno: le carte si toccano per correggerle ----
    function schermoRiepilogo() {
      var T = L.T, ui = cornice(false);
      ui.timer.textContent = "⏰";
      ui.turno.textContent = testoTurno();
      var em = t.el("em"), box = t.el("div", { class: "tb-riep" }, [t.el("h3", {}, [t.el("span", { text: T.chi.nome + " · Squadra " + SQUADRE[T.sq] }), em])]);
      var chips = t.el("div", { class: "tb-chips" }), dopoBox = t.el("div", { style: "display:contents" });
      function delta() { var d = 0; T.carte.forEach(function (c) { if (c.e === "ok") d++; else if (c.e === "no") d--; }); em.textContent = (d > 0 ? "+" : "") + d; }
      function testoChip(c) { return (c.e === "nu" ? (c.ico || "⏰") : ICONE[c.e]) + " " + c.p + (c.e === "ru" ? " · rubata da " + SQUADRE[1 - T.sq] : ""); }
      var max = window.innerHeight < 700 ? 16 : 24;
      if (!T.carte.length) chips.appendChild(t.el("span", { class: "tb-chip altre", text: "Nessuna carta in questo turno" }));
      T.carte.slice(-max).forEach(function (c) {
        var b = t.el("button", { class: "tb-chip " + c.e, type: "button", text: testoChip(c), onclick: function () {
          var giro = L.rubata && (c.base === "nu" || c.base === "ru") ? ["ok", "no", "ru", "nu"] : ["ok", "no", c.base || "pa"], i = giro.indexOf(c.e), prima = c.e;
          c.e = giro[(i + 1) % giro.length]; b.className = "tb-chip " + c.e; b.textContent = testoChip(c);
          // 🧺 la carta corretta entra o esce dal mazzo del round (solo se è di questo round)
          if (L.tre && c.c && c.r === L.tre.n) {
            var k = L.tre.coda.indexOf(c.c);
            if (presa(c.e) && !presa(prima) && k >= 0) L.tre.coda.splice(k, 1);
            else if (!presa(c.e) && presa(prima) && k < 0) L.tre.coda.push(c.c);
            disegnaDopo();
          }
          delta(); segna(true);
        } });
        chips.appendChild(b);
      });
      if (T.carte.length > max) chips.insertBefore(t.el("span", { class: "tb-chip altre", text: "+" + (T.carte.length - max) + " prima" }), chips.firstChild);
      box.appendChild(chips);
      if (T.carte.length) box.appendChild(t.el("div", { class: "tb-promemoria tb-loc-corr", text: "Sbagliato un tocco? Tocca una carta per correggerla (✅ → ❌ → " + (L.rubata ? "🫳 → ⏰" : "⏭️") + ")." }));
      delta(); ui.corpo.appendChild(box); ui.corpo.appendChild(dopoBox);
      // sotto: chi tocca dopo (o il round nuovo, o la fine): si ridisegna se una correzione cambia il mazzo del round
      function disegnaDopo() {
        dopoBox.innerHTML = ""; ui.tasti.innerHTML = "";
        var dopo = prossimoChi(), cambio = L.tre && !L.tre.coda.length && L.tre.n < 3;
        if (dopo) {
          dopoBox.appendChild(t.el("div", { class: "tb-prossimo" }, [avatarNodo(t, omino(dopo.chi.nome), dopo.chi.nome),
            t.el("div", {}, [t.el("b", { text: "Ora tocca a " + dopo.chi.nome }), t.el("span", { text: cambio ? "🧺 Carte finite: si passa al round " + (L.tre.n + 1) + " " + nomeRound(L.tre.n + 1) : "Squadra " + SQUADRE[dopo.sq] + " · 👀 controlla " + dopo.ctrl.nome })])]));
          ui.tasti.appendChild(tasto("largo", "Avanti ▶", function () { if (L.tre && !L.tre.coda.length && L.tre.n < 3) schermoRound(prossimo); else prossimo(); }));
        } else {
          dopoBox.appendChild(t.el("div", { class: "tb-prossimo" }, [t.el("div", {}, [t.el("b", { text: L.tre ? "🏁 Tre round finiti!" : "🏁 Turni finiti!" }), t.el("span", { text: "Controllate le carte, poi vediamo chi ha vinto." })])]));
          ui.tasti.appendChild(tasto("largo", "🏆 Chi ha vinto?", finale));
        }
      }
      disegnaDopo();
      t.mostra(ui.s);
    }

    // ---- 5. la fine: la squadra che vince, i premi, poi la classifica del core ----
    function finale() {
      ferma(); L.finita = true;
      var p = punti(), win = p[0] === p[1] ? -1 : (p[0] > p[1] ? 0 : 1), ui = cornice(false);
      ui.timer.textContent = "Fine"; ui.turno.textContent = "";
      // i premi (contati dopo le correzioni)
      var spieg = {}, serie = null, rubate = [0, 0];
      L.turni.forEach(function (T) {
        var n = T.carte.filter(function (c) { return c.e === "ok"; }).length;
        spieg[T.chi.k] = (spieg[T.chi.k] || 0) + n;
        T.carte.forEach(function (c) { if (c.e === "ru") rubate[1 - T.sq]++; });
        var cc = 0, mx = 0; T.carte.forEach(function (c) { if (c.e === "ok") { cc++; mx = Math.max(mx, cc); } else if (c.e !== "nu" && c.e !== "ru") cc = 0; });
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
      if (L.tre) premi.push("🧺 Round per round (A–B): " + puntiRound().map(function (x) { return x[0] + "–" + x[1]; }).join(" · "));
      if (rubate[0] || rubate[1]) premi.push("🫳 Carte rubate: A " + rubate[0] + " · B " + rubate[1]);
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
      if ((t.impostazioni || {}).prova || !mio) return;
      if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var me = gio.filter(function (g) { return g.nome === mio; })[0]; if (!me) return;
      var x = { partite: 1, turniSpiegati: 0, carteIndovinate: 0, cartePassate: 0, turniPositivi: 0, vittorie: win >= 0 && me.sq === win ? 1 : 0 }, combo = 0, esiti = [];
      L.turni.forEach(function (T) {
        if (T.chi !== me) return;
        var ok = 0, no = 0, cc = 0;
        x.turniSpiegati++;
        T.carte.forEach(function (c) {
          if (c.e === "ok") { ok++; cc++; combo = Math.max(combo, cc); } else { if (c.e === "no") no++; if (c.e === "pa") x.cartePassate++; if (c.e !== "nu" && c.e !== "ru") cc = 0; }
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
    var R = leggiImp(dove);
    dove.tempo = R.durata; dove.giri = R.giri; dove.carte = R.livello;
    dove.partita = R.tre ? "tre" : "classica"; dove.mazzo = R.mazzoN; dove.rubata = R.rubata ? 1 : 0;
    var el = aiuti.el;
    function gruppo(label, valori, prop, titoli, dopo) {
      var blocco = el("div");
      blocco.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: label }));
      var row = el("div", { style: "display:flex;gap:8px" });
      valori.forEach(function (v, i) {
        var b = el("button", { class: "modo-chip" + (String(dove[prop]) === String(v) ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove[prop] = v; [].forEach.call(row.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
          if (dopo) dopo();
        } }, [el("div", { class: "mt", text: titoli[i] })]); row.appendChild(b);
      });
      blocco.appendChild(row); box.appendChild(blocco);
      return blocco;
    }
    // 🧺 «Tre round»: le stesse carte spiegate, poi con una parola sola, poi mimate (i giri contano solo nella classica)
    var giri = null, quante = null;
    function mostra() { var tre = dove.partita === "tre"; if (giri) giri.hidden = tre; if (quante) quante.hidden = !tre; }   // (hidden: il core salta i pezzi nascosti)
    gruppo("Partita", ["classica", "tre"], "partita", ["Classica", "🧺 Tre round"], mostra);
    quante = gruppo("Carte della partita (le stesse nei tre round)", [20, 30, 40], "mazzo", ["20", "30", "40"]);
    giri = gruppo("Quanti giri (in un giro spiegano tutti)", [1, 2, 3, 4], "giri", ["1", "2", "3", "4"]);
    mostra();
    gruppo("Tempo del turno", [60, 90, 120], "tempo", ["60 s", "90 s", "120 s"]);
    gruppo("Carte", [1, 2, 3], "carte", ["Facili", "Miste", "Difficili"]);
    gruppo("🫳 Rubata! (a fine tempo l'altra squadra prova a dire l'ultima carta)", [0, 1], "rubata", ["No", "Sì"]);
  }

  SG.registra({
    id: "taboo", nome: "Taboo", icona: "🤐",
    descrizione: "Spiega la parola senza dire quelle vietate! Su un telefono solo che passa di mano, o online ognuno col suo. Anche in tre round: spiega, una parola sola, mimo.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Chi spiega tiene il telefono, un avversario guarda e preme BUZZ", amici: true, min: MIN }],
    postiOnline: MAX,   // posti online (16)
    riprende: true,     // se l'host ricarica a metà partita, la partita riprende (il turno in corso si rifà da capo, con una carta nuova)
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    // le regole in una riga, per la saletta: "90 secondi a turno · 1 giro · carte miste" / "🧺 Tre round con 30 carte · 90 secondi a turno · carte miste · 🫳 Rubata"
    riassunto: function (imp) {
      var R = leggiImp(imp);
      var carte = { 1: "carte facili", 2: "carte miste", 3: "carte difficili" }[R.livello];
      return (R.tre ? "🧺 Tre round con " + R.mazzoN + " carte · " : "") + R.durata + " secondi a turno · " + (R.tre ? "" : (R.giri === 1 ? "1 giro" : R.giri + " giri") + " · ") + carte + (R.rubata ? " · 🫳 Rubata" : "");
    },
    regole: [
      "Fate due squadre. A turno, una persona spiega la parola alla propria squadra senza pronunciare le cinque parole vietate.",
      "Vietati anche la parola stessa o un suo pezzo, i gesti, i suoni («fa bau bau») e le parole in altre lingue.",
      "<b>Su questo telefono</b>: chi spiega tiene il telefono e un avversario si mette dietro di lui, guarda la carta e preme <b>BUZZ</b>. I compagni non guardano lo schermo. A fine turno si tocca una carta per correggerla (anche quella detta proprio allo scadere ⏰).",
      "<b>Online</b>: ognuno col suo telefono. Chi spiega vede la carta; la squadra avversaria la vede e può premere <b>BUZZ</b>. I compagni vedono solo il tempo e chi spiega.",
      "Ogni parola indovinata vale <b>+1</b>. Ogni BUZZ toglie <b>1 punto</b> (se è sbagliato si annulla entro 5 secondi: online lo fanno chi spiega o l'host). Si possono saltare al massimo <b>3 carte per turno</b>, senza perdere punti.",
      "Le squadre si alternano e ogni squadra ha gli stessi turni. Il tempo parte quando chi spiega tocca «Pronti, via!».",
      "<b>🧺 Tre round</b>: all'inizio si pesca il mazzo della partita (20, 30 o 40 carte) e si usano <b>le stesse carte</b> in tutti e tre i round. Round 1 <b>🗣️ Spiega</b>: come sempre. Round 2 <b>☝️ Una parola sola</b>: le vietate spariscono e chi spiega può dire una parola sola. Round 3 <b>🤐 Solo mimo</b>: niente voce. Un round finisce quando sono state dette tutte le carte (quelle passate o col BUZZ tornano in fondo); se finisce a metà turno, chi spiegava continua nel round dopo col tempo che restava.",
      "<b>🫳 Rubata!</b>: se il tempo finisce con una carta in gioco, l'altra squadra ha <b>5 secondi</b> per dirla: se ci riesce prende <b>+1</b>. Decide chi spiegava («✅ L'hanno presa» o «❌ No»); online l'host può annullare. Non vale chi controllava, che la carta l'ha vista: online, con la Rubata, tra gli avversari controlla uno solo a giro (vede la carta e preme BUZZ), gli altri ascoltano.",
      "Prima di cominciare si sceglie il tipo di partita, il tempo, quanti giri fare (nella classica), le carte (facili, miste o difficili) e la Rubata. Vince la squadra con più punti."
    ],
    impostazioni: impostazioni,
    avvia: avvia
  });
})();
