/* =========================================================
   GIOCO — La linea del tempo
   Modalità: "un telefono solo" e "ognuno dal suo telefono"
   (con votazione degli altri giocatori, punteggi, timer,
   classifica sempre visibile, suoni e vibrazione).
   ========================================================= */
(function () {
  "use strict";

  var PUNTI = 100;     // per una risposta giusta/sbagliata
  var VOTO = 50;       // per chi vota giusto/sbagliato
  var TEMPO = 30;      // secondi per turno / per votare
  var MAX_GIOCATORI = 10;

  // --- Aspetto (moderno: schermo intero, linea verticale con gli anni, carte colorate per categoria) ---
  var stile = document.createElement("style");
  stile.textContent = [
    ".schermata.tl-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;",
      "background:radial-gradient(130% 55% at 50% 0%,#2d44a8 0%,#18225a 50%,#0b1030 100%)}",
    ".schermata.tl-piena.tl-ferma{animation:none}",
    ".schermata.tl-piena>.testa{display:none}",
    ".schermata.tl-piena>.contenuto{flex:1;min-height:0;display:flex;flex-direction:column;padding:calc(8px + env(safe-area-inset-top)) 12px 0;margin:0}",
    ".schermata.tl-piena>.piede{flex:0 0 auto;margin:0;padding:10px 14px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(rgba(11,16,48,0),rgba(11,16,48,.92) 35%)}",
    ".schermata.tl-piena>.piede:empty{padding:0 0 env(safe-area-inset-bottom)}",
    // barra in alto: indietro + giocatori con avatar e punti
    ".tl-barra{display:flex;align-items:center;gap:8px;flex:0 0 auto}",
    ".tl-esci{flex:0 0 auto;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;font:inherit;font-size:1.25rem;font-weight:900;cursor:pointer}",
    ".tl-hud{flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;padding:4px 2px;scrollbar-width:none}",
    ".tl-hud::-webkit-scrollbar{display:none}",
    ".tl-pl{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;border-radius:99px;background:rgba(255,255,255,.08);border:2px solid transparent;transition:all .25s}",
    ".tl-pl .av{width:32px;height:32px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.12);flex:0 0 auto}",
    ".tl-pl .av svg{width:100%;height:100%;display:block}",
    ".tl-pl .n{font-size:.7rem;font-weight:800;color:var(--testo-tenue);max-width:8ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.1}",
    ".tl-pl .p{font-size:.95rem;font-weight:900;line-height:1.1}",
    ".tl-pl.me{border-color:rgba(255,255,255,.35)}",
    ".tl-pl.turno{background:linear-gradient(135deg,rgba(255,202,58,.35),rgba(255,202,58,.1));border-color:var(--accento);box-shadow:0 0 14px rgba(255,202,58,.35)}",
    ".tl-pl.turno .n{color:var(--accento)}",
    ".tl-stato{flex:0 0 auto;text-align:center;font-weight:900;font-size:1.05rem;margin:6px 0 4px;letter-spacing:.01em}",
    ".tl-stato small{display:block;font-size:.78rem;font-weight:700;color:var(--testo-tenue);margin-top:1px}",
    ".tl-stato{display:flex;align-items:center;justify-content:center;gap:10px}",
    ".tl-chi{width:44px;height:44px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);box-shadow:0 0 0 2px var(--accento);flex:0 0 auto}",
    ".tl-chi svg,.tl-reaz svg{width:100%;height:100%;display:block}",
    ".tl-reaz-riga{display:flex;align-items:center;gap:12px}",
    ".tl-reaz{width:64px;height:64px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto;animation:tlPop .45s ease 1.15s both}",
    // tempo
    ".tl-timer{flex:0 0 auto;height:6px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin:2px 0 10px;}",
    ".tl-timer-fill{height:100%;width:100%;border-radius:99px;background:linear-gradient(90deg,var(--verde),var(--accento));box-shadow:0 0 10px rgba(255,202,58,.6)}",
    ".tl-timer.poco .tl-timer-fill{background:linear-gradient(90deg,#ff8a3a,var(--rosso));box-shadow:0 0 10px rgba(255,93,108,.7)}",
    // la carta da piazzare (colore della categoria)
    ".tl-mano{flex:0 0 auto;position:relative;overflow:hidden;border-radius:20px;padding:12px 16px 14px;margin-bottom:10px;color:#fff;",
      "background:linear-gradient(145deg,var(--c1),var(--c2));box-shadow:0 10px 28px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.35);animation:tlGalleggia 3.2s ease-in-out infinite}",
    ".tl-mano:after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.22) 45%,transparent 60%);transform:translateX(-100%);animation:tlLuce 3.8s ease-in-out infinite}",
    "@keyframes tlGalleggia{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}",
    "@keyframes tlLuce{0%,55%{transform:translateX(-100%)}85%,100%{transform:translateX(100%)}}",
    ".tl-mano .fil{position:absolute;right:-8px;bottom:-18px;font-size:5.5rem;opacity:.16;transform:rotate(-12deg);pointer-events:none}",
    ".tl-mano .testa{display:flex;justify-content:space-between;align-items:center;gap:8px;position:relative}",
    ".tl-mano .cat{font-size:.7rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".tl-mano .anno{flex:0 0 auto;background:rgba(0,0,0,.28);border-radius:99px;padding:2px 10px;font-weight:900;font-size:.85rem;letter-spacing:.12em}",
    ".tl-mano .tit{position:relative;font-size:1.18rem;font-weight:900;line-height:1.2;margin-top:6px;text-shadow:0 1px 2px rgba(0,0,0,.25)}",
    ".tl-mano .desc{position:relative;font-size:.84rem;line-height:1.35;margin-top:6px;opacity:.92}",
    // la linea del tempo verticale
    ".tl-scroll{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;margin:0 -12px;padding:4px 12px 16px;",
      "-webkit-mask:linear-gradient(transparent,#000 14px);mask:linear-gradient(transparent,#000 14px)}",
    ".tl-asse{position:relative;display:flex;flex-direction:column;gap:8px;padding:6px 0 10px}",
    ".tl-asse:before{content:'';position:absolute;left:80px;top:0;bottom:0;width:3px;border-radius:3px;background:linear-gradient(rgba(255,255,255,.05),rgba(140,170,255,.55) 8%,rgba(140,170,255,.55) 92%,rgba(255,255,255,.05))}",
    ".tl-ev,.tl-slot{position:relative;display:grid;grid-template-columns:68px 26px 1fr;align-items:center}",
    ".tl-ev .anno{justify-self:end;font-weight:900;font-size:.95rem;color:#fff;background:linear-gradient(135deg,var(--c1),var(--c2));",
      "border-radius:10px;padding:4px 8px;box-shadow:0 3px 10px rgba(0,0,0,.35);white-space:nowrap;max-width:68px;overflow:hidden;text-overflow:ellipsis}",
    ".tl-ev .punto{justify-self:center;width:13px;height:13px;border-radius:50%;background:var(--c1);box-shadow:0 0 0 3px #18225a,0 0 10px var(--c1)}",
    ".tl-ev .card{min-width:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-left:4px solid var(--c1);border-radius:14px;padding:9px 11px;",
      "box-shadow:0 4px 14px rgba(0,0,0,.25);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}",
    ".tl-ev .tit{font-size:.95rem;font-weight:800;line-height:1.25}",
    ".tl-ev .tit .ic{margin-right:5px}",
    ".tl-ev .desc{font-size:.78rem;color:var(--testo-tenue);line-height:1.3;margin-top:3px}",
    ".tl-ev.tent .anno{background:var(--accento);color:#2a2000;animation:tlPulsa 1s ease-in-out infinite}",
    ".tl-ev.tent .card{border:2px dashed var(--accento);border-left-width:4px;background:rgba(255,202,58,.14)}",
    ".tl-ev.nuovo .card{animation:tlEntra .7s cubic-bezier(.2,1.4,.4,1) both;box-shadow:0 0 0 2px var(--verde),0 0 22px rgba(55,212,126,.5)}",
    "@keyframes tlPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}",
    "@keyframes tlEntra{from{opacity:0;transform:translateX(40px) scale(.9)}to{opacity:1;transform:none}}",
    // punti dove si può mettere la carta
    ".tl-slot{width:100%;border:0;background:none;padding:0;font:inherit;color:inherit;cursor:pointer;text-align:left;min-height:38px}",
    ".tl-slot .piu{grid-column:2;justify-self:center;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;",
      "background:#18225a;border:2px dashed rgba(255,202,58,.7);color:var(--accento);font-weight:900;font-size:.95rem;line-height:1;transition:all .2s}",
    ".tl-slot .lab{grid-column:3;justify-self:start;border:2px dashed rgba(255,202,58,.45);color:rgba(255,220,120,.9);border-radius:99px;padding:5px 12px;",
      "font-size:.8rem;font-weight:800;transition:all .15s}",
    ".tl-slot:active .lab{transform:scale(.97)}",
    ".tl-slot .fant{display:none}",
    ".tl-slot.sel .lab,.tl-slot.sel .piu{display:none}",
    ".tl-slot.sel .fant{display:grid;grid-column:1/-1;width:100%}",
    // esito: la carta si gira e svela l'anno
    ".tl-esito{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;gap:8px;padding:6px 0 10px;text-align:center}",
    ".tl-flip{width:min(300px,86%);height:210px;perspective:900px;margin:4px auto 2px}",
    ".tl-flip-in{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:tlGira 1.1s cubic-bezier(.3,1.3,.5,1) .25s both}",
    "@keyframes tlGira{from{transform:rotateY(0)}to{transform:rotateY(180deg)}}",
    ".tl-flip-f{position:absolute;inset:0;border-radius:22px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;color:#fff;",
      "background:linear-gradient(145deg,var(--c1),var(--c2));box-shadow:0 14px 34px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.35);overflow:hidden}",
    ".tl-flip-f .q{font-size:5rem;font-weight:900;opacity:.9}",
    ".tl-flip-f.retro{transform:rotateY(180deg)}",
    ".tl-flip.ok .retro{box-shadow:0 0 0 4px var(--verde),0 0 40px rgba(55,212,126,.55),0 14px 34px rgba(0,0,0,.45)}",
    ".tl-flip.ko .retro{background:linear-gradient(145deg,#5a5f78,#2b2f45);box-shadow:0 0 0 4px var(--rosso),0 0 40px rgba(255,93,108,.45)}",
    ".tl-flip.ko .tl-flip-in{animation:tlGira 1.1s cubic-bezier(.3,1.3,.5,1) .25s both,tlScuoti .5s ease 1.35s}",
    "@keyframes tlScuoti{0%,100%{translate:0}20%{translate:-10px}40%{translate:9px}60%{translate:-6px}80%{translate:4px}}",
    ".tl-flip .grande{font-size:3.4rem;font-weight:900;line-height:1;text-shadow:0 3px 0 rgba(0,0,0,.2)}",
    ".tl-flip .tit{font-size:1rem;font-weight:800;line-height:1.25;margin-top:10px}",
    ".tl-flip .mist{font-size:.85rem;opacity:.85;margin-top:6px}",
    ".tl-verdetto{font-size:1.6rem;font-weight:900;animation:tlPop .4s ease 1.2s both}",
    ".tl-verdetto.giusto{color:var(--verde)} .tl-verdetto.sbagliato{color:var(--rosso)}",
    ".tl-delta{font-size:1.2rem;font-weight:900;padding:4px 14px;border-radius:99px;animation:tlPop .4s ease 1.4s both}",
    ".tl-delta.su{color:#04321c;background:var(--verde)} .tl-delta.giu{color:#fff;background:var(--rosso)}",
    "@keyframes tlPop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}",
    ".tl-desc-es{font-size:.86rem;color:var(--testo-tenue);line-height:1.4;max-width:34ch;animation:tlPop .4s ease 1.5s both}",
    ".tl-finito{font-size:1rem;font-weight:800;color:var(--verde);animation:tlPop .4s ease 1.6s both}",
    ".tl-voti{list-style:none;padding:0;margin:4px auto 0;width:100%;max-width:340px;display:flex;flex-direction:column;gap:6px;animation:tlPop .4s ease 1.6s both}",
    ".tl-voti li{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border-radius:12px;padding:5px 10px 5px 5px;font-weight:700;text-align:left}",
    ".tl-voti .av{width:30px;height:30px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
    ".tl-voti .av svg{width:100%;height:100%;display:block}",
    ".tl-voti .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tl-voti .d{font-size:1rem;font-weight:900}",
    ".tl-coriandoli{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}",
    ".tl-coriandoli i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:tlCade 2.4s cubic-bezier(.2,.6,.4,1) forwards}",
    "@keyframes tlCade{to{transform:translate(var(--dx),110vh) rotate(var(--r));opacity:.9}}",
    // voto e attesa
    ".tl-vota{display:flex;gap:12px;}",
    ".tl-vota .btn{flex:1;font-size:1.15rem;min-height:60px}",
    ".tl-attesa{color:var(--testo-tenue);text-align:center;font-weight:700;margin:0}",
    ".tl-conferma:disabled{opacity:.55;filter:grayscale(.4)}",
    // classifica finale col podio
    ".tl-podio{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:8px 0 14px}",
    ".tl-gradino{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;animation:tlPop .5s ease both}",
    ".tl-gradino .fac{width:70px;height:70px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1)}",
    ".tl-gradino.p1 .fac{width:90px;height:90px;box-shadow:0 0 0 3px #ffd43b,0 0 26px rgba(255,212,59,.55)}",
    ".tl-gradino .fac svg{width:100%;height:100%;display:block}",
    ".tl-gradino .nm{font-weight:800;font-size:.85rem;margin-top:4px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tl-gradino .pt{font-size:.78rem;color:var(--testo-tenue);font-weight:700;margin-bottom:4px}",
    ".tl-gradino .blocco{width:100%;border-radius:10px 10px 0 0;display:flex;justify-content:center;padding-top:6px;font-size:1.6rem}",
    ".tl-gradino.p1 .blocco{height:84px;background:linear-gradient(#ffd75a,#c99a10)}",
    ".tl-gradino.p2 .blocco{height:62px;background:linear-gradient(#e6ebf2,#98a3b3)}",
    ".tl-gradino.p3 .blocco{height:46px;background:linear-gradient(#e8a866,#a8662a)}",
    ".tl-riga{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;border-radius:14px;background:rgba(255,255,255,.06);animation:slideIn .45s ease both}",
    ".tl-riga .pos{width:28px;text-align:center;font-weight:900}",
    ".tl-riga .fac{width:38px;height:38px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
    ".tl-riga .fac svg{width:100%;height:100%;display:block}",
    ".tl-riga .nm{flex:1;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tl-riga .pt{font-weight:900;color:var(--accento)}",
    "@keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}",
    ".tl-lobby{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-radius:14px;background:rgba(255,255,255,.06);margin-bottom:6px;font-weight:800}",
    ".tl-lobby .fac{width:36px;height:36px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
    ".tl-lobby .fac svg{width:100%;height:100%;display:block}",
    "@media (prefers-reduced-motion:reduce){.tl-mano,.tl-mano:after{animation:none}}"
  ].join("");
  document.head.appendChild(stile);

  // --- Suoni + vibrazione ---
  var AC = null;
  function ctx() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; }
  function beep(freqs, dur, tipo) {
    var c = ctx(); if (!c) return;
    var t0 = c.currentTime;
    freqs.forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = tipo || "sine"; o.frequency.value = f;
      var s = t0 + i * (dur * 0.6);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.25, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + dur);
    });
  }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  var FX = {
    giusto: function () { beep([660, 880, 1180], 0.18, "triangle"); vibra(60); },
    sbagliato: function () { beep([180, 120], 0.28, "sawtooth"); vibra([90, 60, 90]); },
    turno: function () { beep([880, 1180], 0.12, "sine"); vibra(120); },
    voto: function () { beep([520], 0.1, "square"); vibra(30); },
    tic: function () { beep([1200], 0.05, "sine"); },
    vittoria: function () { beep([660, 880, 1046, 1318], 0.22, "triangle"); vibra([120, 60, 120, 60, 200]); },
    // applauso del pubblico: tanti battiti di mani (rumore filtrato) sparsi in un secondo e mezzo
    applauso: function () {
      var c = ctx(); if (!c) return;
      try {
        var buf = rumore(c, 0.05);
        for (var i = 0; i < 48; i++) {
          var t0 = c.currentTime + Math.random() * 1.6, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
          s.buffer = buf; f.type = "bandpass"; f.frequency.value = 900 + Math.random() * 1700; f.Q.value = 1.3;
          g.gain.setValueAtTime((0.05 + Math.random() * 0.08) * (1 - (t0 - c.currentTime) / 2.2), t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
          s.connect(f); f.connect(g); g.connect(c.destination); s.start(t0); s.stop(t0 + 0.06);
        }
      } catch (e) {}
    },
    // "ohhh" deluso del pubblico: due voci che scendono
    ohh: function () {
      var c = ctx(); if (!c) return;
      try {
        [0, 7].forEach(function (d) {
          var t0 = c.currentTime, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
          o.type = "sawtooth"; o.frequency.setValueAtTime(250 + d, t0); o.frequency.exponentialRampToValueAtTime(170 + d, t0 + 0.9);
          f.type = "lowpass"; f.frequency.value = 650;
          g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1);
          o.connect(f); f.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 1.05);
        });
      } catch (e) {}
    },
    // rullo di tamburo prima della rivelazione
    rullo: function (dur) {
      var c = ctx(); if (!c) return;
      try {
        var buf = rumore(c, 0.04); dur = dur || 1.1;
        for (var x = 0; x < dur; x += 0.045) {
          var t0 = c.currentTime + x, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
          s.buffer = buf; f.type = "lowpass"; f.frequency.value = 520;
          g.gain.setValueAtTime(0.05 + 0.2 * (x / dur), t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
          s.connect(f); f.connect(g); g.connect(c.destination); s.start(t0); s.stop(t0 + 0.045);
        }
      } catch (e) {}
    }
  };
  function rumore(c, dur) {
    var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    return b;
  }

  function ordina(linea) { linea.sort(function (a, b) { return a.anno - b.anno; }); }
  function pescaDati(imp) {
    var cats = window.SG_CATEGORIE || [];
    var scelte = (imp && imp.categorie) || null;
    var attive = cats.filter(function (c) { return !scelte || scelte.indexOf(c.id) >= 0; });
    if (!attive.length) attive = cats;
    var d = []; attive.forEach(function (c) { (c.eventi || []).forEach(function (e) {
      var x = {}; for (var k in e) x[k] = e[k]; x._cat = c.id; d.push(x);   // la carta ricorda la sua categoria (trofei)
    }); });
    return d;
  }
  function tutteLeCategorie(imp) {
    var tot = (window.SG_CATEGORIE || []).length, scelte = imp && imp.categorie;
    return !scelte || scelte.length >= tot;
  }

  // ---- Statistiche per i trofei: conta SOLO le giocate di chi ha il profilo attivo ----
  // Tutto in memoria durante la partita; a fine partita un solo salvataggio sul profilo.
  function creaTraccia(opz) {
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return null;
    var s0 = SGNube.statGioco("timeline") || {};
    var T = { online: !!opz.online, carte: opz.carte || 5, tutteCat: !!opz.tutteCat, piazzate: 0, errori: 0, prima: true,
      serie: s0.serieOra || 0, serieV: s0.serieVotiOra || 0, inc: {}, salvato: false };   // le serie "di fila" continuano tra le partite
    T.serieMax = T.serie; T.serieVMax = T.serieV;
    return T;
  }
  function tInc(T, k) { T.inc[k] = (T.inc[k] || 0) + 1; }
  function tPiazza(T, ok, cat) {         // una mia carta messa nella linea
    if (!T) return;
    if (T.prima && !ok) tInc(T, "erroriPrimaCarta");
    T.prima = false; T.piazzate++;
    if (ok) { tInc(T, "giusteTot"); if (cat) tInc(T, "giuste_" + cat); T.serie++; if (T.serie > T.serieMax) T.serieMax = T.serie; }
    else { T.errori++; T.serie = 0; }
  }
  function tVoto(T, detto, giusto) {     // un mio voto 👍/👎 sulla carta di un altro
    if (!T) return;
    if (giusto) { tInc(T, "votiGiusti"); tInc(T, detto ? "votiSiGiusti" : "votiNoGiusti"); T.serieV++; if (T.serieV > T.serieVMax) T.serieVMax = T.serieV; }
    else T.serieV = 0;
  }
  function tFine(T, classifica, sonoIo, tutteGiocate) {
    if (!T || T.salvato) return;
    T.salvato = true;
    tInc(T, "partite"); if (T.online) tInc(T, "partiteOnline");
    // vittoria solo se c'era almeno un avversario e si è primi da soli
    var vinto = classifica.length >= 2 && sonoIo(classifica[0]) && classifica[0].punti > classifica[1].punti;
    var distacco = vinto ? classifica[0].punti - classifica[1].punti : 0;
    if (vinto) { tInc(T, "vinte"); if (T.online) tInc(T, "vinteOnline"); if (T.tutteCat) tInc(T, "vinte5cat"); }
    if (tutteGiocate && T.piazzate > 0 && T.errori === 0) { tInc(T, "perfette"); if (T.carte >= 8) tInc(T, "perfette8"); }
    var incrs = []; for (var k in T.inc) incrs.push([k, T.inc[k]]);
    SGNube.salvaProgressi(null, "timeline", incrs,
      [["serieMax", T.serieMax], ["serieVotiMax", T.serieVMax], ["distaccoMax", distacco]],
      [["serieOra", T.serie], ["serieVotiOra", T.serieV]]);
  }
  function mischiaArr(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function annoTesto(a) { return a < 0 ? Math.abs(a) + " a.C." : String(a); }
  function gapGiusto(linea, gap, Y) {
    return ((gap === 0) || (linea[gap - 1].anno <= Y)) && ((gap === linea.length) || (Y <= linea[gap].anno));
  }

  // ---- Colori e icone delle categorie, avatar dei giocatori ----
  var COL_CAT = { storia: ["#f2a93b", "#9a560b"], calcio: ["#2fc071", "#0f6a3d"], cinema: ["#ff5b73", "#8e1c3c"],
    invenzioni: ["#48a2ff", "#1d4e9e"], rap: ["#c56bff", "#5b1f8d"] };
  function colCat(id) { return COL_CAT[id] || ["#ffca3a", "#9a6b00"]; }
  function infoCat(id) {
    var c = (window.SG_CATEGORIE || []).filter(function (x) { return x.id === id; })[0];
    return c ? { icona: c.icona || "📜", nome: c.nome } : { icona: "📜", nome: "Avvenimento" };
  }
  function stileCat(id) { var c = colCat(id); return "--c1:" + c[0] + ";--c2:" + c[1]; }
  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  var cacheAv = {};
  var FACCE = { esulta: { occhi: "felici", sopracc: "alzate", bocca: "sorrisone" }, triste: { occhi: "dolci", sopracc: "preoccupate", bocca: "smorfia" } };
  // l'avatar di un giocatore: quello che ha mandato (online), il mio profilo se è il mio nome, sennò uno fisso dal nome
  function avatarDi(g, faccia) {
    if (!window.SGOmino || !g) return "";
    var cfg = avatarValido(g.omino);
    if (!cfg) { var p = window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo(); cfg = (p && p.omino && p.nome === g.nome) ? p.omino : SGOmino.casuale(g.nome || "?"); }
    if (faccia && FACCE[faccia]) { var c2 = {}, n; for (n in cfg) c2[n] = cfg[n]; for (n in FACCE[faccia]) c2[n] = FACCE[faccia][n]; cfg = c2; }
    var k = JSON.stringify(cfg);
    if (!cacheAv[k]) { try { cacheAv[k] = SGOmino.svg(cfg, { busto: true }); } catch (e) { cacheAv[k] = ""; } }
    return cacheAv[k];
  }

  // ---- Memoria tra un ridisegno e l'altro (online si ridisegna a ogni novità) ----
  // così la linea non torna in cima e il punto scelto resta scelto
  var memScroll = { k: null, top: 0 }, memSel = { k: null, gap: null };
  function chiaveCarta(carta) { return carta ? carta.titolo : ""; }

  // La carta da piazzare
  function nodoCartaMano(el, carta, occhiello) {
    var cat = carta._cat || carta.cat, ic = infoCat(cat);
    return el("div", { class: "tl-mano", style: stileCat(cat) }, [
      el("div", { class: "fil", text: ic.icona }),
      el("div", { class: "testa" }, [ el("span", { class: "cat", text: ic.icona + " " + ic.nome }), el("span", { class: "anno", text: "????" }) ]),
      el("div", { class: "tit", text: carta.titolo }),
      carta.fatto ? el("div", { class: "desc", text: carta.fatto }) : null
    ]);
  }
  // Un avvenimento sulla linea (tent = messo lì per prova, anno ancora segreto)
  function nodoEvento(el, ev, tent, cls) {
    var cat = ev._cat || ev.cat, ic = infoCat(cat);
    return el("div", { class: "tl-ev" + (tent ? " tent" : "") + (cls ? " " + cls : ""), style: stileCat(cat) }, [
      el("span", { class: "anno", text: tent ? "?" : annoTesto(ev.anno) }),
      el("span", { class: "punto" }),
      el("div", { class: "card" }, [
        el("div", { class: "tit" }, [ el("span", { class: "ic", text: ic.icona }), el("span", { text: ev.titolo }) ]),
        (!tent && ev.fatto) ? el("div", { class: "desc", text: ev.fatto }) : null
      ])
    ]);
  }
  // La linea del tempo verticale.
  //  opts.scegli(gap)  -> mostra i punti "metti qui"; toccarne uno ci mette la carta (fantasma)
  //  opts.tent         -> la carta messa per prova in quel punto (votazione)
  //  opts.carta        -> la carta in gioco (per il fantasma)
  //  opts.sel          -> punto già scelto (dopo un ridisegno)
  //  opts.nuovo        -> titolo dell'avvenimento appena entrato (si illumina)
  function nodoLinea(el, linea, opts) {
    opts = opts || {};
    var asse = el("div", { class: "tl-asse" }), slots = [];
    var fantasma = opts.carta ? { titolo: opts.carta.titolo, cat: opts.carta._cat || opts.carta.cat } : null;
    function slot(i) {
      var lab = linea.length === 0 ? "Metti qui" : (i === 0 ? "Prima di tutto" : (i === linea.length ? "Dopo tutto" : "Metti qui"));
      var b = el("button", { class: "tl-slot", onclick: function () {
        slots.forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel");
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
        opts.scegli(i);
      } }, [ el("span", { class: "piu", text: "+" }), el("span", { class: "lab", text: lab }), fantasma ? nodoEvento(el, fantasma, true, "fant") : null ]);
      if (opts.sel === i) b.classList.add("sel");
      slots[i] = b; return b;
    }
    if (opts.scegli) asse.appendChild(slot(0));
    linea.forEach(function (ev, i) {
      if (opts.tent === i && fantasma) asse.appendChild(nodoEvento(el, fantasma, true));
      asse.appendChild(nodoEvento(el, ev, false, opts.nuovo && ev.titolo === opts.nuovo ? "nuovo" : ""));
      if (opts.scegli) asse.appendChild(slot(i + 1));
    });
    if (opts.tent != null && opts.tent >= linea.length && fantasma) asse.appendChild(nodoEvento(el, fantasma, true));
    return asse;
  }
  // Classifica sempre visibile in cima: avatar + punti, chi gioca illuminato
  function nodoTop(el, giocatori, correnteId) {
    var ord = giocatori.slice().sort(function (a, b) { return b.punti - a.punti; });
    var top = el("div", { class: "tl-hud" });
    ord.forEach(function (g) {
      var turno = correnteId != null && (g.id != null ? g.id === correnteId : g.nome === correnteId);
      top.appendChild(el("div", { class: "tl-pl" + (g._me ? " me" : "") + (turno ? " turno" : "") }, [
        el("span", { class: "av", html: avatarDi(g) }),
        el("div", {}, [ el("div", { class: "n", text: g.nome }), el("div", { class: "p", text: g.punti }) ])
      ]));
    });
    return top;
  }
  // Barra tempo. rimastiMs/totaliMs; onScaduto solo dove serve (telefono singolo / host)
  function barraTimer(el, rimastiMs, totaliMs, onScaduto) {
    var wrap = el("div", { class: "tl-timer" + (rimastiMs <= 8000 ? " poco" : "") });
    var fill = el("div", { class: "tl-timer-fill" });
    wrap.appendChild(fill);
    var frac = Math.max(0, Math.min(1, rimastiMs / totaliMs));
    fill.style.width = (frac * 100) + "%";
    requestAnimationFrame(function () { fill.style.transition = "width " + rimastiMs + "ms linear"; fill.style.width = "0%"; });
    // gli ultimi 8 secondi la barra diventa rossa
    var toPoco = rimastiMs > 8000 ? setTimeout(function () { wrap.classList.add("poco"); }, rimastiMs - 8000) : null;
    if (onScaduto && rimastiMs > 0) wrap._to = setTimeout(onScaduto, rimastiMs);
    else if (onScaduto) onScaduto();
    wrap._stop = function () { if (wrap._to) clearTimeout(wrap._to); if (toPoco) clearTimeout(toPoco); };
    return wrap;
  }
  // Il risultato: la carta si gira e svela l'anno (o resta un mistero), poi punti e voti
  // es = { giusto, anno, titolo, fatto, cat, nome, delta, scaduto, finito, voti:[{nome, omino, d, giusto, delta}] }
  function nodoEsito(el, es, chi) {
    var ic = infoCat(es.cat);
    var box = el("div", { class: "tl-esito" }, [
      el("div", { class: "tl-flip " + (es.giusto ? "ok" : "ko"), style: stileCat(es.cat) }, [
        el("div", { class: "tl-flip-in" }, [
          el("div", { class: "tl-flip-f" }, [ el("div", { class: "q", text: "?" }), el("div", { class: "tit", text: ic.icona + " " + es.titolo }) ]),
          el("div", { class: "tl-flip-f retro" }, es.giusto
            ? [ el("div", { class: "grande", text: annoTesto(es.anno) }), el("div", { class: "tit", text: es.titolo }) ]
            : [ el("div", { class: "grande", text: "✗" }), el("div", { class: "tit", text: es.titolo }), el("div", { class: "mist", text: "La data resta un mistero…" }) ])
        ])
      ]),
      el("div", { class: "tl-reaz-riga" }, [
        chi ? el("span", { class: "tl-reaz", html: avatarDi(chi, es.giusto ? "esulta" : "triste") }) : null,
        el("div", { class: "tl-verdetto " + (es.giusto ? "giusto" : "sbagliato"), text: es.scaduto ? "⏰ Tempo scaduto!" : (es.giusto ? "✅ Esatto!" : "❌ Sbagliato") })
      ]),
      el("div", { class: "tl-delta " + (es.giusto ? "su" : "giu"), text: (es.giusto ? "+" : "−") + PUNTI + " a " + es.nome }),
      (es.giusto && es.fatto) ? el("div", { class: "tl-desc-es", text: es.fatto }) : null,
      es.finito ? el("div", { class: "tl-finito", text: "🎉 " + es.nome + " ha finito le sue carte!" }) : null
    ]);
    if (es.voti && es.voti.length) {
      var ul = el("ul", { class: "tl-voti" });
      es.voti.forEach(function (vt) { ul.appendChild(el("li", {}, [
        el("span", { class: "av", html: avatarDi(vt) }),
        el("span", { class: "nm", text: (vt.d ? "👍 " : "👎 ") + vt.nome }),
        el("span", { class: "d", text: (vt.delta > 0 ? "+" : "−") + Math.abs(vt.delta), style: "color:" + (vt.giusto ? "var(--verde)" : "var(--rosso)") })
      ])); });
      box.appendChild(ul);
    }
    if (es.giusto) setTimeout(coriandoli, 1250);
    return box;
  }
  function coriandoli() {
    var c = document.createElement("div"); c.className = "tl-coriandoli";
    var col = ["#ffd43b", "#37d47e", "#4dabf7", "#ff6b6b", "#cc5de8", "#fff"];
    for (var i = 0; i < 40; i++) {
      var p = document.createElement("i");
      p.style.left = (Math.random() * 100) + "%";
      p.style.background = col[i % col.length];
      p.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
      p.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
      p.style.animationDelay = (Math.random() * 0.4) + "s";
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 3200);
  }

  // Schermata finale: podio con gli avatar, poi tutti in fila (usata da entrambe le modalità)
  function schermataFine(t, classifica, rigioca) {
    var el = t.el;
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: gioco.nome });
    var podio = el("div", { class: "tl-podio" });
    [1, 0, 2].forEach(function (p) {
      var r = classifica[p]; if (!r) return;
      var g = el("div", { class: "tl-gradino p" + (p + 1) }, [
        el("div", { class: "fac", html: avatarDi(r) }),
        el("div", { class: "nm", text: r.nome }),
        el("div", { class: "pt", text: r.punti + " punti" }),
        el("div", { class: "blocco", text: ["🥇", "🥈", "🥉"][p] })
      ]);
      g.style.animationDelay = ([0.3, 0.15, 0.45][p]) + "s";
      podio.appendChild(g);
    });
    s._contenuto.appendChild(podio);
    var box = el("div", { style: "display:flex;flex-direction:column;gap:6px" });
    classifica.forEach(function (r, i) {
      var riga = el("div", { class: "tl-riga" }, [
        el("span", { class: "pos", text: (i + 1) + "°" }),
        el("span", { class: "fac", html: avatarDi(r) }),
        el("span", { class: "nm", text: r.nome }),
        el("span", { class: "pt", text: r.punti })
      ]);
      riga.style.animationDelay = (0.5 + i * 0.08) + "s";
      box.appendChild(riga);
    });
    s._contenuto.appendChild(box);
    FX.vittoria(); setTimeout(coriandoli, 300);
    if (rigioca) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Rigioca", onclick: rigioca }));
    var azioni = el("div", { class: "home-azioni" });
    azioni.appendChild(el("button", { class: "azione", text: "🎮 Cambia gioco", onclick: function () { SG.cambiaGioco(); } }));
    azioni.appendChild(el("button", { class: "azione", text: "👥 La sala", onclick: function () { SG.sala(); } }));
    azioni.appendChild(el("button", { class: "azione", text: "🏠 Home", onclick: t.esci }));
    s._piede.appendChild(azioni);
    t.mostra(s);
  }


  // =========================================================
  //  LO STUDIO DEL GAME SHOW
  //  Un "mondo" grande (studio, pubblico, maxischermo, leggii) e una
  //  telecamera che lo inquadra (transform). Si gioca sul maxischermo;
  //  nei momenti morti la telecamera torna ai concorrenti. Niente si salta.
  // =========================================================
  var STACCO = 2600;   // ms di stacco su chi gioca prima che parta il suo tempo (online l'host lo aggiunge al timer)
  function durataApertura(n) { return 7500 + (n <= 4 ? 1550 * n : 6800); }
  var ST_COL = ["#ffd43b", "#4dabf7", "#ff6b6b", "#51cf66", "#cc5de8", "#ff922b", "#20c997", "#f783ac", "#a9e34b", "#74c0fc"];
  function dorme(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function vuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

  // Telefoni meno potenti: niente fari che girano e immagini dello studio più leggere
  var LEGGERO = !!((navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 3));

  function assicuraStileStudio() {
    if (document.getElementById("sg-studio-css")) return;
    var st = document.createElement("style"); st.id = "sg-studio-css";
    // Regola d'oro per non far laggare: le animazioni muovono SOLO transform e opacity su pezzi piccoli.
    // Tutto quello che sta fermo (sfondo, arco, pubblico, pavimento, cornice) è disegnato una volta sola su canvas.
    st.textContent = [
      ".schermata.st-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#07041a;animation:none}",
      ".schermata.st-piena>.testa,.schermata.st-piena>.piede{display:none}",
      ".schermata.st-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".st-vista{position:relative;width:100%;max-width:520px;margin:0 auto;height:var(--alt,100dvh);overflow:hidden;background:#07041a;user-select:none;-webkit-user-select:none}",
      ".st-mondo{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}",
      ".st-mondo>*{position:absolute}",
      ".st-quieto .st-anim,.st-quieto .st-anim *{animation-play-state:paused!important}",
      ".st-quieto .st-leggio .luce,.st-quieto .st-leggio .pozza{opacity:0!important}",
      ".st-tela{left:0;top:0}",
      // fari che girano (solo rotazione)
      ".st-fascio{transform-origin:50% 0;opacity:.5;clip-path:polygon(46% 0,54% 0,100% 100%,0 100%);will-change:transform;animation:stFascio 6s ease-in-out infinite alternate}",
      "@keyframes stFascio{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}",
      // barre delle torri LED (solo scala verticale)
      ".st-eq{overflow:hidden;border-radius:14px}",
      ".st-eq i{position:absolute;bottom:0;height:88%;width:11%;border-radius:4px 4px 0 0;background:linear-gradient(#fff3a8,#ffb300 40%,#ff3ea5 75%,#7b2cff);transform-origin:50% 100%;will-change:transform;animation:stEq 1s ease-in-out infinite alternate}",
      "@keyframes stEq{from{transform:scaleY(.16)}to{transform:scaleY(1)}}",
      // lampadine della cornice: due disegni che si alternano (solo opacità)
      ".st-lampade{will-change:opacity;animation:stLampade .9s linear infinite}",
      "@keyframes stLampade{0%,49%{opacity:1}51%,100%{opacity:0}}",
      // pubblico (canvas) che salta quando applaude, con lucine dei telefoni e flash
      ".st-pubwrap{left:0}",
      ".st-pubwrap>*,.st-pubdeco>*{position:absolute}",
      ".st-pubdeco{left:0;top:0;width:100%;height:100%;pointer-events:none}",
      // il pubblico è fatto a file (canvas): ogni fila ondeggia per conto suo, quando applaude saltano
      ".st-fila{left:0;will-change:transform;animation:stOnda var(--dur,2s) ease-in-out var(--rit,0s) infinite}",
      "@keyframes stOnda{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}",
      ".st-pubwrap.salta .st-fila{animation:stSaltaFila .24s ease-in-out var(--rit,0s) infinite alternate}",
      "@keyframes stSaltaFila{from{transform:translateY(0)}to{transform:translateY(-7px)}}",
      // bastoncini luminosi e cartelli che sventolano, occhi di bue colorati che passano sulla folla
      ".st-bastone{width:5px;height:22px;margin:-22px 0 0 -2.5px;border-radius:3px;background:linear-gradient(#fff,var(--c) 30%);box-shadow:0 0 8px 2px var(--c);transform-origin:50% 100%;will-change:transform;animation:stSventola var(--dur,1.4s) ease-in-out var(--rit,0s) infinite alternate}",
      ".st-cartellone{margin:-34px 0 0 -22px;width:44px;transform-origin:50% 100%;will-change:transform;animation:stSventolaPoco var(--dur,1.8s) ease-in-out var(--rit,0s) infinite alternate}",
      ".st-cartellone b{display:block;background:#fff;color:#2a1d6e;border-radius:4px;font:900 9px/1.1 system-ui,sans-serif;text-align:center;padding:4px 2px;box-shadow:0 2px 6px rgba(0,0,0,.4)}",
      ".st-cartellone:after{content:'';display:block;width:3px;height:12px;margin:0 auto;background:#c9a46a}",
      "@keyframes stSventola{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}",
      "@keyframes stSventolaPoco{from{transform:rotate(-9deg) translateY(0)}to{transform:rotate(9deg) translateY(-4px)}}",
      ".st-occhio{border-radius:50%;opacity:.5;will-change:transform;animation:stGiro var(--dur,8s) ease-in-out var(--rit,0s) infinite}",
      "@keyframes stGiro{0%,100%{transform:translate(0,0)}33%{transform:translate(var(--dx),var(--dy))}66%{transform:translate(calc(var(--dx) * .35),calc(var(--dy) * -.7))}}",
      ".st-ringhiera{height:5px;border-radius:3px;background:linear-gradient(90deg,transparent,#ffd43b,transparent);box-shadow:0 0 10px rgba(255,212,59,.6)}",
      ".st-lucina{width:6px;height:6px;margin:-3px;border-radius:50%;background:#e8fbff;box-shadow:0 0 8px 3px rgba(160,240,255,.8);will-change:opacity;animation:stLuccica 2.4s ease-in-out infinite}",
      "@keyframes stLuccica{0%,100%{opacity:.15}50%{opacity:1}}",
      ".st-flash{width:26px;height:26px;margin:-13px;border-radius:50%;background:radial-gradient(circle,#fff 0 30%,rgba(255,255,255,0) 70%);opacity:0}",
      ".st-flash.on{animation:stFlash .5s ease-out}",
      "@keyframes stFlash{0%{opacity:0;transform:scale(.4)}15%{opacity:1;transform:scale(2.4)}100%{opacity:0;transform:scale(1)}}",
      ".st-fumetto{font-weight:900;font-size:36px;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.4);opacity:0;white-space:nowrap;transform:translate(-50%,0);pointer-events:none;z-index:5}",
      ".st-fumetto.on{animation:stFum 1.8s ease-out}",
      "@keyframes stFum{0%{opacity:0;transform:translate(-50%,20px) scale(.6)}15%{opacity:1;transform:translate(-50%,0) scale(1.1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-30px)}}",
      // maxischermo
      ".st-schermo{border-radius:14px;overflow:hidden;box-shadow:0 0 0 5px #120a38;background:radial-gradient(130% 55% at 50% 0%,#2d44a8 0%,#18225a 50%,#0b1030 100%)}",
      ".st-sch-in{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(8px + env(safe-area-inset-top)) 12px 10px}",
      ".st-vista.con-barra .st-sch-in{padding-bottom:104px}",
      ".st-sch-in .tl-hud{flex:0 0 auto;margin-left:42px;align-items:center}",
      ".st-sch-in .tl-ev .card{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(255,255,255,.1)}",
      ".st-vetro{position:absolute;inset:0;pointer-events:none;background:linear-gradient(118deg,rgba(255,255,255,.1),transparent 32%)}",
      ".st-idle{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px}",
      ".st-idle .logo{font-size:46px;font-weight:900;line-height:1.03;letter-spacing:.03em;color:#ffd43b;text-shadow:0 4px 0 #a85c00,0 0 22px rgba(255,160,40,.55)}",
      ".st-idle .stelle{color:#ffe066;letter-spacing:.35em;font-size:24px}",
      ".st-idle .sotto{font-size:14px;font-weight:800;letter-spacing:.32em;text-transform:uppercase;color:#cdd6ff}",
      ".st-sch-in .tl-esito{justify-content:center;padding-bottom:40px}",
      ".st-sch-in .tl-flip{width:min(310px,88%);height:230px}",
      ".st-raggi{position:absolute;left:50%;top:38%;width:180%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;opacity:0;will-change:transform;",
        "background:repeating-conic-gradient(rgba(255,230,120,.22) 0 8deg,transparent 8deg 20deg);-webkit-mask:radial-gradient(circle,#000 20%,transparent 65%);mask:radial-gradient(circle,#000 20%,transparent 65%);animation:stRaggi 14s linear infinite,stAppari .6s ease 1.3s forwards}",
      ".st-raggi.ko{background:repeating-conic-gradient(rgba(255,93,108,.2) 0 8deg,transparent 8deg 20deg)}",
      "@keyframes stRaggi{to{transform:translate(-50%,-50%) rotate(360deg)}}",
      "@keyframes stAppari{to{opacity:1}}",
      // leggii (le postazioni)
      ".st-leggio{display:flex;flex-direction:column;align-items:center}",
      ".st-leggio .alone{position:absolute;left:50%;top:0;width:96%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;opacity:.45;",
        "background:radial-gradient(circle,var(--col) 0,transparent 66%);transition:opacity .4s,transform .4s}",
      // occhio di bue: il fascio scende fino al pavimento e ci lascia una pozza di luce, e illumina il banco
      ".st-leggio .luce{position:absolute;left:50%;bottom:-17%;width:172%;height:480%;transform:translateX(-50%);opacity:0;transition:opacity .45s;pointer-events:none;",
        "background:linear-gradient(to top,rgba(255,246,205,.46),rgba(255,246,205,.2) 40%,rgba(255,246,205,0) 92%);clip-path:polygon(43% 0,57% 0,100% 100%,0 100%)}",
      ".st-leggio .pozza{position:absolute;z-index:1;left:50%;bottom:-24%;width:180%;height:30%;transform:translateX(-50%);border-radius:50%;opacity:0;transition:opacity .45s;pointer-events:none;",
        "background:radial-gradient(closest-side,rgba(255,248,215,.85),rgba(255,232,160,.4) 50%,rgba(255,232,160,0))}",
      ".st-leggio.acceso .pozza{opacity:1}",
      ".st-leggio .fronte:before{content:'';position:absolute;inset:0;background:linear-gradient(rgba(255,246,205,.3),rgba(255,246,205,.08));opacity:0;transition:opacity .45s;pointer-events:none}",
      ".st-leggio.acceso .fronte:before{opacity:1}",
      ".st-leggio .av{position:relative;z-index:2;width:74%;aspect-ratio:178/182}",
      ".st-leggio .av canvas{width:100%;height:100%;display:block}",
      ".st-leggio .podio{position:relative;z-index:3;width:100%;margin-top:-.9em}",
      ".st-leggio .piano{position:relative;height:1.1em;border-radius:.55em .55em .2em .2em;background:linear-gradient(#ffffff,#d8d2ff 35%,#8d84d8 75%,#5a50a8);",
        "box-shadow:inset 0 .12em 0 #fff,0 .25em .45em rgba(0,0,0,.4)}",
      ".st-leggio .buzz{position:absolute;right:13%;top:-.5em;width:1.15em;height:.62em;border-radius:1em 1em .2em .2em;background:radial-gradient(circle at 40% 30%,#ffc2c7,#ff2d45 55%,#8a0f1c)}",
      ".st-leggio .tu{position:absolute;left:10%;top:-.62em;background:linear-gradient(#fff3a8,#ffca3a);color:#241f00;font-weight:900;font-size:.72em;padding:.08em .55em;border-radius:99px}",
      ".st-leggio .fronte{position:relative;margin:0 5%;padding:.75em .4em .7em;text-align:center;clip-path:polygon(0 0,100% 0,95% 100%,5% 100%);",
        "background:linear-gradient(90deg,rgba(255,255,255,.14),transparent 22%,transparent 78%,rgba(255,255,255,.1)),linear-gradient(#36268a,#1b1152 55%,#0d0730)}",
      ".st-leggio .fronte:after{content:'';position:absolute;left:8%;right:8%;top:.22em;height:.34em;",
        "background:radial-gradient(circle,#fffbe0 0 .09em,var(--col) .15em,transparent .21em) 0 0/.62em .34em}",
      ".st-leggio .nome{font-weight:900;font-size:1.3em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 .08em 0 rgba(0,0,0,.45)}",
      ".st-leggio .punti{display:inline-block;margin-top:.3em;min-width:72%;font-family:'Courier New',ui-monospace,monospace;font-weight:900;font-size:1.6em;letter-spacing:.04em;color:#ffe066;",
        "background:#05030f;border-radius:.3em;padding:.08em .4em;box-shadow:inset 0 0 0 .08em rgba(255,224,102,.3)}",
      ".st-leggio .punti.neg{color:#ff8d98}",
      ".st-leggio .led{position:relative;height:.42em;margin:0 9%;border-radius:0 0 .3em .3em;background:var(--col);box-shadow:0 0 .8em var(--col)}",
      ".st-leggio .led:after{content:'';position:absolute;left:-12%;right:-12%;top:-160%;bottom:-160%;border-radius:50%;background:radial-gradient(closest-side,var(--col),transparent);opacity:0;will-change:opacity}",
      ".st-leggio.acceso .alone{opacity:1;transform:translateX(-50%) scale(1.12)}",
      ".st-leggio.acceso .luce{opacity:1}",
      ".st-leggio.acceso .led:after{animation:stLed .6s ease-in-out infinite alternate}",
      "@keyframes stLed{from{opacity:.2}to{opacity:.95}}",
      ".st-leggio .cart{position:absolute;z-index:4;left:50%;top:-44%;width:48%;aspect-ratio:1;perspective:400px;opacity:0;transform:translateX(-50%) translateY(40%) scale(.2);transition:transform .35s cubic-bezier(.3,1.5,.5,1),opacity .2s}",
      ".st-leggio .cart:after{content:'';position:absolute;left:50%;top:96%;width:.5em;height:2.2em;margin-left:-.25em;background:linear-gradient(90deg,#b58a4e,#e6c28a,#b58a4e);border-radius:.2em;z-index:-1}",
      ".st-leggio .cart.su{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}",
      ".st-leggio .cart .in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .6s}",
      ".st-leggio .cart.gira .in{transform:rotateY(180deg)}",
      ".st-leggio .cart .f{position:absolute;inset:0;border-radius:.9em;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;align-items:center;justify-content:center;",
        "font-size:3.4em;font-weight:900;background:linear-gradient(#ffffff,#e8e4ff);color:#2a1d6e;box-shadow:0 .25em .5em rgba(0,0,0,.4)}",
      ".st-leggio .cart .f.r{transform:rotateY(180deg)}",
      ".st-leggio .cart .f.r.si{background:linear-gradient(#6ff0a6,#27b567)} .st-leggio .cart .f.r.no{background:linear-gradient(#ff95a0,#e0364a)}",
      ".st-leggio .delta{position:absolute;z-index:5;left:50%;top:6%;transform:translateX(-50%);font-weight:900;font-size:2.6em;opacity:0;white-space:nowrap;text-shadow:0 .08em 0 rgba(0,0,0,.45)}",
      ".st-leggio .delta.on{animation:stDelta 1.7s ease-out}",
      "@keyframes stDelta{0%{opacity:0;transform:translate(-50%,20%) scale(.6)}15%{opacity:1;transform:translate(-50%,-20%) scale(1.15)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-120%)}}",
      // sovrimpressioni sopra la telecamera
      ".st-esci{position:absolute;left:8px;top:calc(8px + env(safe-area-inset-top));z-index:25;width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.4);color:#fff;font:inherit;font-size:1.25rem;font-weight:900;cursor:pointer}",
      ".st-rec{position:absolute;right:10px;top:calc(12px + env(safe-area-inset-top));z-index:25;font-size:11px;font-weight:900;letter-spacing:.1em;color:#fff;background:rgba(0,0,0,.45);border-radius:99px;padding:3px 10px;opacity:0;transition:opacity .3s}",
      ".st-rec.on{opacity:1}",
      ".st-rec:before{content:'';display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff3b3b;margin-right:6px;animation:stRec 1s steps(2) infinite}",
      "@keyframes stRec{50%{opacity:.2}}",
      ".st-terzo{position:absolute;left:12px;bottom:calc(104px + env(safe-area-inset-bottom));z-index:22;display:flex;align-items:center;gap:10px;max-width:calc(100% - 24px);padding:6px 16px 6px 6px;",
        "border-radius:16px;border-left:7px solid var(--col,#ff3ea5);background:linear-gradient(100deg,#fff3b0,#ffca3a 55%,#f59f00);color:#241f00;box-shadow:0 8px 20px rgba(0,0,0,.45);",
        "transform:translateX(-120%);transition:transform .45s cubic-bezier(.3,1.3,.5,1)}",
      ".st-terzo.on{transform:none}",
      ".st-terzo .fac{width:46px;height:46px;border-radius:50%;overflow:hidden;background:rgba(0,0,0,.15);flex:0 0 auto}",
      ".st-terzo .fac svg{width:100%;height:100%;display:block}",
      ".st-terzo .ic{font-size:28px;flex:0 0 auto}",
      ".st-terzo .tx{font-weight:900;font-size:18px;line-height:1.15;min-width:0}",
      ".st-terzo .tx small{display:block;font-size:12px;font-weight:700;opacity:.8}",
      ".st-barra{position:absolute;left:0;right:0;bottom:0;z-index:22;display:flex;flex-direction:column;gap:8px;padding:12px 14px calc(14px + env(safe-area-inset-bottom));",
        "background:linear-gradient(rgba(7,4,26,0),rgba(7,4,26,.92) 36%);transform:translateY(110%);transition:transform .35s}",
      ".st-barra.on{transform:none}",
      ".st-barra .btn{min-height:58px;font-size:1.1rem}",
      ".st-lampo{position:absolute;inset:0;z-index:24;background:#fff;opacity:0;pointer-events:none}",
      ".st-lampo.on{animation:stLampo .45s ease-out}",
      "@keyframes stLampo{0%{opacity:.85}100%{opacity:0}}",
      ".st-leggero .st-fascio,.st-leggero .st-eq i,.st-leggero .st-lucina,.st-leggero .st-lampade,.st-leggero .st-fila,.st-leggero .st-bastone,.st-leggero .st-cartellone,.st-leggero .st-occhio{animation:none}",
      "@media (prefers-reduced-motion:reduce){.st-fascio,.st-eq i,.st-lucina,.st-lampade,.st-fila,.st-bastone,.st-cartellone,.st-occhio{animation:none}}"
    ].join("");
    document.head.appendChild(st);
  }

  // Crea lo studio (una sola volta per partita) e lo mette a schermo.
  // giocatori: [{ nome, omino? }]; opz: { io (indice di chi ha questo telefono, -1 = nessuno), esci() }
  function creaStudio(t, giocatori, opz) {
    assicuraStileStudio();
    var el = t.el, s = t.schermata({});
    s.classList.add("st-piena");
    var vista = el("div", { class: "st-vista" + (LEGGERO ? " st-leggero" : "") }), mondo = el("div", { class: "st-mondo" });
    vista.appendChild(mondo);
    vista.addEventListener("scroll", function () { vista.scrollTop = 0; vista.scrollLeft = 0; });
    var S = { t: t, s: s, vista: vista, mondo: mondo, gioc: [], io: -1, L: [], shot: null, timer: null };
    function pezzo(tag, cls, dove) { var e = el(tag, { class: cls }); (dove || mondo).appendChild(e); return e; }
    // --- studio: il fondo fermo è un'immagine sola (canvas), sopra solo pochi pezzi che si muovono ---
    S.tela = pezzo("canvas", "st-tela");
    S.fasci = [];
    if (!LEGGERO) ["rgba(255,236,170,.55)", "rgba(255,62,165,.5)", "rgba(34,211,238,.5)", "rgba(255,236,170,.55)"].forEach(function (c, i) {
      var f = pezzo("div", "st-fascio st-anim"); f.style.background = "linear-gradient(" + c + ",transparent 88%)";
      f.style.animationDelay = (-i * 1.9) + "s"; f.style.animationDuration = (5 + (i % 3)) + "s"; S.fasci.push(f);
    });
    S.eq = [0, 1].map(function () {
      var e = pezzo("div", "st-eq st-anim");
      for (var k = 0; k < 7; k++) { var b = el("i"); b.style.left = (4 + k * 13.4) + "%"; b.style.animationDelay = (-k * 0.31) + "s"; b.style.animationDuration = (0.7 + (k % 3) * 0.22) + "s"; if (LEGGERO) b.style.transform = "scaleY(" + (0.3 + ((k * 37) % 60) / 100) + ")"; e.appendChild(b); }
      return e;
    });
    // il pubblico: file di mini avatar (canvas, create in disegnaPubblico) + cose vive sopra
    S.pubWrap = pezzo("div", "st-pubwrap");
    S.strisce = [];
    S.pubDeco = pezzo("div", "st-pubdeco", S.pubWrap);
    S.ringhiere = []; for (var q = 0; q < 6; q++) S.ringhiere.push(pezzo("div", "st-ringhiera", S.pubDeco));
    S.occhi = LEGGERO ? [] : ["rgba(255,62,165,.55)", "rgba(34,211,238,.5)", "rgba(255,212,59,.42)"].map(function (c, i) {
      var o = pezzo("div", "st-occhio st-anim", S.pubDeco); o.style.background = "radial-gradient(closest-side," + c + ",transparent)";
      o.style.setProperty("--dur", (7 + i * 2) + "s"); o.style.setProperty("--rit", (-i * 2.3) + "s"); o._i = i; return o;
    });
    var COLB = ["#ff3ea5", "#22d3ee", "#ffd43b", "#a06bff", "#51cf66"];
    function vivo(e, zona) { e._rx = Math.random(); e._ry = Math.random(); e._zona = zona; e.style.setProperty("--dur", (1.1 + Math.random() * 0.9).toFixed(2) + "s"); e.style.setProperty("--rit", (-Math.random() * 2).toFixed(2) + "s"); return e; }
    S.bastoni = []; for (q = 0; q < (LEGGERO ? 0 : 14); q++) { var ba = vivo(pezzo("div", "st-bastone st-anim", S.pubDeco), q % 3); ba.style.setProperty("--c", COLB[q % COLB.length]); S.bastoni.push(ba); }
    S.cartelli = ["❤️ BRAVI", "⭐⭐⭐", "FORZA!", "👏👏", "WOW!"].map(function (tx, i) { var ca = vivo(pezzo("div", "st-cartellone st-anim", S.pubDeco), i % 3); ca.appendChild(el("b", { text: tx })); ca._ry *= 0.7; return ca; });
    S.lucine = []; for (q = 0; q < (LEGGERO ? 0 : 10); q++) { var lu = pezzo("div", "st-lucina st-anim", S.pubDeco); lu.style.animationDelay = (-Math.random() * 2.4) + "s"; lu._rx = Math.random(); lu._ry = Math.random(); lu._zona = q % 3; S.lucine.push(lu); }
    S.flash = []; for (q = 0; q < 6; q++) { var fl = pezzo("div", "st-flash", S.pubDeco); fl._rx = Math.random(); fl._ry = Math.random(); fl._zona = q % 3; S.flash.push(fl); }
    S.lampade = pezzo("canvas", "st-lampade st-anim");
    S.schermo = pezzo("div", "st-schermo");
    S.sch = el("div", { class: "st-sch-in" }); S.schermo.appendChild(S.sch); S.schermo.appendChild(el("div", { class: "st-vetro" }));
    S.fumetto = pezzo("div", "st-fumetto");
    S.zonaLeggii = el("div"); S.zonaLeggii.style.cssText = "position:absolute;left:0;top:0;width:0;height:0"; mondo.appendChild(S.zonaLeggii);
    // --- sovrimpressioni ---
    vista.appendChild(el("button", { class: "st-esci", text: "‹", "aria-label": "Esci", onclick: function () { if (window.confirm("Uscire dalla partita?")) { fermaTimer(S); opz.esci(); } } }));
    S.rec = el("div", { class: "st-rec", text: "IN ONDA" }); vista.appendChild(S.rec);
    S.terzoEl = el("div", { class: "st-terzo" }); vista.appendChild(S.terzoEl);
    S.barraEl = el("div", { class: "st-barra" }); vista.appendChild(S.barraEl);
    S.lampoEl = el("div", { class: "st-lampo" }); vista.appendChild(S.lampoEl);
    s._contenuto.appendChild(vista);
    t.mostra(s);
    S.vivo = function () { return vista.isConnected; };
    S.impostaGiocatori = function (lista, io) { S.gioc = lista.map(function (g) { return { nome: g.nome, omino: g.omino || null }; }); S.io = io == null ? -1 : io; costruisciLeggii(S); layoutStudio(S); };
    S.impostaGiocatori(giocatori, opz.io);
    // appena le facce del pubblico sono pronte ridisegno la folla (all'inizio per un attimo ci sono le sagome)
    preparaPoolPubblico(function () { if (S.vivo() && S.zonePub) disegnaPubblico(S); });
    logoSchermo(S);
    S.shot = function () { return { x: 0, y: 0, w: S.W, h: S.H }; };
    camera(S, S.shot(), 0);
    // se cambia la misura dello schermo ridisegno lo studio (una volta, dopo che si è assestato)
    var toR = null;
    function suResize() {
      if (!S.vivo()) { window.removeEventListener("resize", suResize); return; }
      clearTimeout(toR);
      toR = setTimeout(function () { if (!S.vivo()) return; if (Math.abs(S.vista.clientWidth - S.VW) < 2 && Math.abs(S.vista.clientHeight - S.VH) < 2) return; layoutStudio(S); camera(S, S.shot(), 0); }, 200);
    }
    window.addEventListener("resize", suResize);
    return S;
  }

  // ---- avatar dei leggii come immagini già pronte (non si ridisegnano a ogni zoom della telecamera) ----
  var cacheImg = {};
  function immagineAvatar(g, f, cb) {
    var svg = avatarDi(g, f); if (!svg) return;
    var e = cacheImg[svg];
    if (!e) {
      e = cacheImg[svg] = { img: new Image(), ok: false, cbs: [] };
      e.img.onload = function () { e.ok = true; var l = e.cbs; e.cbs = []; l.forEach(function (c) { c(e.img); }); };
      e.img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", "<svg width='356' height='364' "));
    }
    if (e.ok) cb(e.img); else if (cb) e.cbs.push(cb);
  }
  function mettiAvatar(X, g, f) {
    var v = X.versione = (X.versione || 0) + 1;
    immagineAvatar(g, f, function (img) {
      if (X.versione !== v) return;   // nel frattempo è cambiata faccia
      var c = X.avc, x = c.getContext("2d"); x.clearRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    });
  }
  function costruisciLeggii(S) {
    var el = S.t.el; vuota(S.zonaLeggii); S.L = [];
    S.gioc.forEach(function (g, i) {
      var L = el("div", { class: "st-leggio" }); L.style.position = "absolute"; L.style.setProperty("--col", ST_COL[i % ST_COL.length]);
      L.innerHTML = "<div class='luce'></div><div class='pozza'></div><div class='alone'></div>" +
        "<div class='cart'><div class='in'><div class='f'>?</div><div class='f r'></div></div></div><div class='delta'></div><div class='av'><canvas width='356' height='364'></canvas></div>" +
        "<div class='podio'><div class='piano'><span class='buzz'></span></div><div class='fronte'><div class='nome'></div><div class='punti'>0</div></div><div class='led'></div></div>";
      L.querySelector(".nome").textContent = g.nome;
      if (i === S.io) L.querySelector(".piano").appendChild(el("span", { class: "tu", text: "TU" }));
      var X = { el: L, avc: L.querySelector(".av canvas"), cart: L.querySelector(".cart"), delta: L.querySelector(".delta"), pEl: L.querySelector(".punti"), valore: 0, faccia: null };
      mettiAvatar(X, g, null);
      setTimeout(function () { ["esulta", "triste", "pensa"].forEach(function (f) { immagineAvatar(g, f, null); }); }, 1500 + i * 200);   // pronte per dopo (non tutte insieme all'entrata)
      S.L.push(X);
    });
  }
  // posti dei leggii: fino a 4 una fila; da 5 a 10 due file sfalsate (quella dietro più piccola e più in alto)
  function postiLeggii(S) {
    var n = S.gioc.length, VW = S.VW, VH = S.VH, out = [], i;
    if (n <= 4) {
      var sp = 1.92 * VW / Math.max(1, n), w = Math.min(0.46 * VW, sp * 0.92);
      for (i = 0; i < n; i++) out.push({ cx: 0.04 * VW + sp * (i + 0.5), top: 1.36 * VH, w: w, fila: 0 });
      return out;
    }
    // file sfalsate di mezzo posto: con B == F serve mezzo posto in più di spazio
    var F = Math.ceil(n / 2), B = n - F, pari = B === F, spf = 1.92 * VW / (F + (pari ? 0.5 : 0)), wf = Math.min(0.40 * VW, spf * 0.88), wb = wf * 0.84;
    for (i = 0; i < F; i++) out.push({ cx: 0.04 * VW + spf * (i + 0.5) + (pari ? spf / 2 : 0), top: 1.5 * VH, w: wf, fila: 0 });
    for (i = 0; i < B; i++) out.push({ cx: 0.04 * VW + spf * (pari ? i + 0.5 : i + 1), top: 1.27 * VH, w: wb, fila: 1 });
    return out;
  }

  // ---- disegno dello studio su canvas (una volta sola) ----
  function qualitaTela(S) { return Math.min(LEGGERO ? 1 : 2, window.devicePixelRatio || 1, 4000 / S.H); }
  function preparaTela(c, w, h, q) {
    c.width = Math.max(1, Math.round(w * q)); c.height = Math.max(1, Math.round(h * q));
    c.style.width = w + "px"; c.style.height = h + "px";
    var x = c.getContext("2d"); x.setTransform(q, 0, 0, q, 0, 0); return x;
  }
  function rett(x, X, Y, w, h, r) {
    x.beginPath(); x.moveTo(X + r, Y); x.lineTo(X + w - r, Y); x.quadraticCurveTo(X + w, Y, X + w, Y + r); x.lineTo(X + w, Y + h - r);
    x.quadraticCurveTo(X + w, Y + h, X + w - r, Y + h); x.lineTo(X + r, Y + h); x.quadraticCurveTo(X, Y + h, X, Y + h - r); x.lineTo(X, Y + r); x.quadraticCurveTo(X, Y, X + r, Y); x.closePath();
  }
  function alone(x, cx, cy, r, col) { var g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  function lampadina(x, px, py, accesa) {
    if (accesa) { alone(x, px, py, 8, "rgba(255,190,60,.55)"); x.fillStyle = "#ffc93c"; x.beginPath(); x.arc(px, py, 3.6, 0, 7); x.fill(); x.fillStyle = "#fffbe0"; x.beginPath(); x.arc(px, py, 2.4, 0, 7); x.fill(); }
    else { x.fillStyle = "#5e4108"; x.beginPath(); x.arc(px, py, 3.6, 0, 7); x.fill(); x.fillStyle = "#8a6716"; x.beginPath(); x.arc(px, py, 2.2, 0, 7); x.fill(); }
  }
  function puntiCornice(R) {   // le lampadine lungo il bordo del maxischermo, ogni 20px
    var p = [], x0 = R.x - 8, y0 = R.y - 8, x1 = R.x + R.w + 8, y1 = R.y + R.h + 8, d;
    for (d = x0 + 10; d < x1 - 5; d += 20) p.push([d, y0]);
    for (d = y0 + 10; d < y1 - 5; d += 20) p.push([x1, d]);
    for (d = x1 - 10; d > x0 + 5; d -= 20) p.push([d, y1]);
    for (d = y1 - 10; d > y0 + 5; d -= 20) p.push([x0, d]);
    return p;
  }
  function disegnaStudio(S) {
    var VW = S.VW, VH = S.VH, W = S.W, H = S.H, R = S.R.schermo, q = qualitaTela(S), i;
    var x = preparaTela(S.tela, W, H, q);
    // fondo luminoso da prima serata
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#3a1b8c"); g.addColorStop(0.4, "#27106a"); g.addColorStop(0.7, "#1a0b4d"); g.addColorStop(1, "#120736");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    alone(x, W * 0.5, H * 0.24, VW * 0.9, "rgba(255,206,110,.5)");
    alone(x, W * 0.03, H * 0.3, VW * 0.85, "rgba(255,62,165,.55)");
    alone(x, W * 0.97, H * 0.3, VW * 0.85, "rgba(34,211,238,.5)");
    alone(x, W * 0.5, H * 0.68, VW * 1.1, "rgba(140,90,255,.4)");
    x.fillStyle = "rgba(255,255,255,.05)"; for (i = 0; i < W; i += 64) x.fillRect(i, 0, 2, H);
    x.fillStyle = "rgba(255,255,255,.035)"; for (i = 0; i < H; i += 64) x.fillRect(0, i, W, 2);
    // fari fissi dipinti (sui telefoni leggeri al posto di quelli che girano)
    if (LEGGERO) [0.1, 0.37, 0.63, 0.9].forEach(function (p, k) {
      x.save(); x.translate(W * p, 0.03 * VH); x.rotate((k % 2 ? 1 : -1) * 0.25);
      var fg = x.createLinearGradient(0, 0, 0, 1.3 * VH); fg.addColorStop(0, "rgba(255,236,170,.35)"); fg.addColorStop(1, "rgba(255,236,170,0)");
      x.fillStyle = fg; x.beginPath(); x.moveTo(-0.02 * VW, 0); x.lineTo(0.02 * VW, 0); x.lineTo(0.22 * VW, 1.3 * VH); x.lineTo(-0.22 * VW, 1.3 * VH); x.closePath(); x.fill(); x.restore();
    });
    // arco al neon attorno al maxischermo
    var ax = R.x - 0.13 * VW, aw = R.w + 0.26 * VW, ay = 0.012 * VH, ah = 1.12 * VH, ry = Math.min(aw * 0.3, 0.16 * VH);
    x.beginPath(); x.moveTo(ax, ay + ah); x.lineTo(ax, ay + ry); x.ellipse(ax + aw / 2, ay + ry, aw / 2, ry, 0, Math.PI, 2 * Math.PI); x.lineTo(ax + aw, ay + ah);
    x.fillStyle = "rgba(10,6,40,.45)"; x.fill();
    var ag = x.createLinearGradient(ax, ay, ax + aw, ay + ah);
    ag.addColorStop(0, "#ff3ea5"); ag.addColorStop(0.35, "#ffd43b"); ag.addColorStop(0.65, "#22d3ee"); ag.addColorStop(1, "#a06bff");
    x.save(); x.lineWidth = 7; x.strokeStyle = ag; x.shadowColor = "rgba(255,62,165,.9)"; x.shadowBlur = 26; x.stroke(); x.restore();
    x.lineWidth = 2; x.strokeStyle = "rgba(255,255,255,.75)"; x.stroke();
    // torri LED (le barre che ballano sono sopra, a parte)
    S.torriR = [[0.06 * VW, 0.1 * VH, 0.36 * VW, 0.36 * VH], [1.58 * VW, 0.1 * VH, 0.36 * VW, 0.36 * VH]];
    S.torriR.forEach(function (p) {
      x.save(); rett(x, p[0], p[1], p[2], p[3], 14); x.fillStyle = "#0a0624"; x.shadowColor = "rgba(255,62,165,.65)"; x.shadowBlur = 26; x.fill(); x.restore();
      rett(x, p[0], p[1], p[2], p[3], 14); x.lineWidth = 3; x.strokeStyle = "#2b2366"; x.stroke();
      x.save(); x.fillStyle = "#ffe066"; x.font = "900 20px system-ui,sans-serif"; x.textAlign = "center"; x.shadowColor = "#ff9d2e"; x.shadowBlur = 12;
      x.fillText("★  ★  ★", p[0] + p[2] / 2, p[1] + 30); x.restore();
    });
    // gradinate del pubblico: fondo scuro a gradoni (le persone sono sopra, a file che si muovono)
    (S.zonePub || []).forEach(function (z) {
      var zy = S.pubTop + z[1];
      x.save(); x.beginPath(); rettAlto(x, z[0], zy, z[2], z[3], 18); x.clip();
      var zg = x.createLinearGradient(0, zy, 0, zy + z[3]); zg.addColorStop(0, "#0c0729"); zg.addColorStop(1, "#1d1352");
      x.fillStyle = zg; x.fillRect(z[0], zy, z[2], z[3]);
      x.fillStyle = "rgba(255,255,255,.05)"; for (var gy2 = zy + 22; gy2 < zy + z[3]; gy2 += 24) x.fillRect(z[0], gy2, z[2], 3);
      x.restore();
    });
    // traliccio con i fari in alto
    var th = 0.035 * VH, tg = x.createLinearGradient(0, 0, 0, th); tg.addColorStop(0, "#3b3560"); tg.addColorStop(1, "#1d1838");
    x.fillStyle = tg; x.fillRect(0, 0, W, th);
    x.strokeStyle = "rgba(255,255,255,.18)"; x.lineWidth = 2; x.beginPath();
    for (i = -th; i < W + th; i += 12) { x.moveTo(i, th * 0.18); x.lineTo(i + th * 0.5, th * 0.82); x.moveTo(i + th * 0.5, th * 0.18); x.lineTo(i, th * 0.82); }
    x.stroke();
    for (i = 0; i < 6; i++) {
      var fx = W * (0.07 + i * 0.172), fy = 0.02 * VH + 12;
      alone(x, fx, fy, 44, "rgba(255,220,130,.6)");
      var lg = x.createRadialGradient(fx - 2, fy - 3, 1, fx, fy, 12); lg.addColorStop(0, "#fff"); lg.addColorStop(0.35, "#ffe9a8"); lg.addColorStop(0.7, "#ffb300"); lg.addColorStop(1, "#5a3a00");
      x.fillStyle = lg; x.beginPath(); x.arc(fx, fy, 12, 0, 7); x.fill();
    }
    // pavimento lucido con la striscia di luci
    var py = 1.48 * VH, pg = x.createLinearGradient(0, py, 0, H); pg.addColorStop(0, "#2c1c78"); pg.addColorStop(0.5, "#170d4a"); pg.addColorStop(1, "#0c0628");
    x.fillStyle = pg; x.fillRect(0, py, W, H - py);
    x.save(); x.beginPath(); x.rect(0, py, W, H - py); x.clip(); alone(x, W / 2, py, VW * 0.9, "rgba(255,206,110,.28)"); x.restore();
    x.fillStyle = "rgba(255,255,255,.07)"; for (i = 0; i < W; i += 70) x.fillRect(i, py, 2, H - py);
    var sg = x.createLinearGradient(0, 0, W, 0);
    ["#ff3ea5", "#ffd43b", "#22d3ee", "#a06bff", "#ff3ea5"].forEach(function (c, k) { sg.addColorStop(k / 4, c); });
    x.save(); x.fillStyle = sg; x.shadowColor = "#ffd43b"; x.shadowBlur = 20; x.fillRect(0, py, W, 6); x.restore();
    // maxischermo: alone azzurro dietro, cornice dorata con le lampadine
    x.save(); rett(x, R.x, R.y, R.w, R.h, 14); x.fillStyle = "#0b1030"; x.shadowColor = "rgba(120,170,255,.6)"; x.shadowBlur = 40; x.fill(); x.restore();
    x.save(); rett(x, R.x - 16, R.y - 16, R.w + 32, R.h + 32, 26); x.fillStyle = "#2a1d00"; x.shadowColor = "rgba(255,190,60,.6)"; x.shadowBlur = 34; x.fill(); x.restore();
    rett(x, R.x - 16, R.y - 16, R.w + 32, R.h + 32, 26); x.lineWidth = 3; x.strokeStyle = "#3a2a00"; x.stroke();
    var pc = puntiCornice(R);
    pc.forEach(function (p, k) { lampadina(x, p[0], p[1], k % 2 === 1); });
    // seconda serie di lampadine (quelle che si alternano): canvas sopra che si accende e spegne
    var lx = R.x - 16, ly = R.y - 16, y2 = preparaTela(S.lampade, R.w + 32, R.h + 32, q);
    S.lampade.style.left = lx + "px"; S.lampade.style.top = ly + "px";
    pc.forEach(function (p, k) { lampadina(y2, p[0] - lx, p[1] - ly, k % 2 === 0); });
  }
  // il pubblico: silhouette disegnate una volta sola (poi il canvas intero "salta" quando applaude)
  // ---- il pubblico: tanti piccoli avatar veri, disegnati una volta a file (canvas) che ondeggiano ognuna per conto suo ----
  var poolPubblico = null;   // una ventina di facce pronte (bitmap), riusate per tutta la folla
  function preparaPoolPubblico(cb) {
    if (poolPubblico) { if (poolPubblico.pronti) cb(); else poolPubblico.cbs.push(cb); return; }
    poolPubblico = { pronti: false, img: [], cbs: [cb] };
    var N = 20, fatti = 0;
    function uno() {
      if (++fatti < N) return;
      poolPubblico.pronti = true; var l = poolPubblico.cbs; poolPubblico.cbs = [];
      l.forEach(function (f) { try { f(); } catch (e) {} });
    }
    if (!window.SGOmino) { fatti = N - 1; uno(); return; }
    for (var i = 0; i < N; i++) (function (i) {
      var svg; try { svg = SGOmino.svg(SGOmino.casuale("pubblico-" + i), { busto: true }); } catch (e) { uno(); return; }
      var img = new Image();
      img.onload = function () {
        try { var c = document.createElement("canvas"); c.width = 72; c.height = 74; c.getContext("2d").drawImage(img, 0, 0, 72, 74); poolPubblico.img.push(c); } catch (e) {}
        uno();
      };
      img.onerror = uno;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", "<svg width='72' height='74' "));
    })(i);
  }
  // rettangolo con solo gli angoli in alto arrotondati (aggiunto al percorso in corso)
  function rettAlto(x, X, Y, w, h, r) {
    x.moveTo(X, Y + h); x.lineTo(X, Y + r); x.quadraticCurveTo(X, Y, X + r, Y); x.lineTo(X + w - r, Y);
    x.quadraticCurveTo(X + w, Y, X + w, Y + r); x.lineTo(X + w, Y + h); x.closePath();
  }
  function sagoma(x, cx, y, s) {   // persona stilizzata (finché le facce non sono pronte)
    x.fillStyle = "#3a2d78"; x.beginPath(); x.ellipse(cx, y + s * 0.92, s * 0.46, s * 0.34, 0, 0, 7); x.fill();
    x.fillStyle = "#6f5cb8"; x.beginPath(); x.arc(cx, y + s * 0.38, s * 0.26, 0, 7); x.fill();
  }
  function disegnaPubblico(S) {
    var W = S.W, h = S.pubH, q = Math.min(1.5, qualitaTela(S)), Z = S.zonePub;
    S.pubWrap.style.top = S.pubTop + "px"; S.pubWrap.style.width = W + "px"; S.pubWrap.style.height = h + "px";
    S.strisce.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
    S.strisce = [];
    var pool = (poolPubblico && poolPubblico.pronti && poolPubblico.img.length) ? poolPubblico.img : null;
    var seme = 11; function rnd() { seme = (seme * 16807) % 2147483647; return seme / 2147483647; }
    // le file: in alto (in fondo alla sala) più piccole, in basso (davanti) più grandi
    var righe = [], y = 2;
    while (y < h - 8) { var sz = 24 + 14 * (y / h); righe.push({ y: y, s: sz }); y += sz * 0.58; }
    var PER = 4;
    for (var r0 = 0; r0 < righe.length; r0 += PER) {
      var gruppo = righe.slice(r0, r0 + PER), ult = gruppo[gruppo.length - 1];
      var y0 = Math.max(0, Math.floor(gruppo[0].y - 3)), y1 = Math.min(h, Math.ceil(ult.y + ult.s * 1.08));
      if (y1 - y0 < 4) continue;
      var c = document.createElement("canvas"); c.className = "st-fila st-anim";
      var x = preparaTela(c, W, y1 - y0, q);
      c.style.top = y0 + "px";
      c.style.setProperty("--dur", (1.6 + rnd() * 1.3).toFixed(2) + "s");
      c.style.setProperty("--rit", (-rnd() * 2).toFixed(2) + "s");
      x.translate(0, -y0);
      x.save(); x.beginPath(); Z.forEach(function (z) { rettAlto(x, z[0], z[1], z[2], z[3], 18); }); x.clip();
      gruppo.forEach(function (R, k) {
        var s = R.s, passo = s * 0.78, off = ((r0 + k) % 2) * passo / 2;
        Z.forEach(function (z, zi) {
          if (R.y < z[1] - s * 0.2 || R.y > z[1] + z[3] - s * 0.35) return;
          for (var px = z[0] - passo * 0.4 + off; px < z[0] + z[2] - s * 0.3; px += passo) {
            // nella fascia sotto il maxischermo salto i tratti dove ci sono già le gradinate laterali
            if (zi === 2 && ((px + s > Z[0][0] && px < Z[0][0] + Z[0][2]) || (px + s > Z[1][0] && px < Z[1][0] + Z[1][2]))) continue;
            var ss = s * (0.9 + rnd() * 0.2), jx = (rnd() - 0.5) * s * 0.2, jy = (rnd() - 0.5) * s * 0.14;
            if (pool) {
              var im = pool[Math.floor(rnd() * pool.length)];
              if (rnd() < 0.5) x.drawImage(im, px + jx, R.y + jy, ss, ss * 1.03);
              else { x.save(); x.translate(px + jx + ss, R.y + jy); x.scale(-1, 1); x.drawImage(im, 0, 0, ss, ss * 1.03); x.restore(); }
            } else sagoma(x, px + jx + ss / 2, R.y + jy, ss);
          }
        });
      });
      // luce da palco solo sulle persone: più buio in fondo (in alto), magenta a sinistra e azzurro a destra
      x.globalCompositeOperation = "source-atop";
      var sg = x.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, "rgba(14,7,44,.72)"); sg.addColorStop(0.55, "rgba(14,7,44,.46)"); sg.addColorStop(1, "rgba(14,7,44,.34)");   // il pubblico sta in penombra: i concorrenti devono risaltare
      x.fillStyle = sg; x.fillRect(0, y0, W, y1 - y0);
      var hg = x.createLinearGradient(0, 0, W, 0);
      hg.addColorStop(0, "rgba(255,62,165,.3)"); hg.addColorStop(0.22, "rgba(255,62,165,0)"); hg.addColorStop(0.78, "rgba(34,211,238,0)"); hg.addColorStop(1, "rgba(34,211,238,.3)");
      x.fillStyle = hg; x.fillRect(0, y0, W, y1 - y0);
      x.globalCompositeOperation = "source-over";
      x.restore();
      S.pubWrap.insertBefore(c, S.pubDeco);
      S.strisce.push(c);
    }
  }
  function layoutStudio(S) {
    var VW = S.vista.clientWidth || 360, VH = S.vista.clientHeight || 640, W = 2 * VW, H = 2 * VH;
    S.VW = VW; S.VH = VH; S.W = W; S.H = H;
    function pos(e, x, y, w, h) { e.style.left = x + "px"; e.style.top = y + "px"; if (w != null) e.style.width = w + "px"; if (h != null) e.style.height = h + "px"; }
    S.mondo.style.width = W + "px"; S.mondo.style.height = H + "px";
    S.R = { schermo: { x: 0.5 * VW, y: 0.06 * VH, w: VW, h: VH } };
    var R = S.R.schermo;
    // zone del pubblico (coordinate dentro al blocco del pubblico): due gradinate ai lati e la fascia sotto il maxischermo
    S.pubTop = 0.52 * VH; S.pubH = 1.48 * VH - S.pubTop;
    var fondo = (R.y + R.h + 18) - S.pubTop;   // la fascia parte sotto la cornice, così le lampadine restano sopra
    S.zonePub = [[0.03 * VW, 0, 0.42 * VW, S.pubH], [1.55 * VW, 0, 0.42 * VW, S.pubH], [0.03 * VW, fondo, 1.94 * VW, S.pubH - fondo]];
    disegnaStudio(S);
    disegnaPubblico(S);
    pos(S.schermo, R.x, R.y, R.w, R.h);
    S.fasci.forEach(function (f, i) { var fx = W * (0.1 + i * 0.267); pos(f, fx - 0.22 * VW, 0.03 * VH, 0.44 * VW, 1.35 * VH); });
    S.eq.forEach(function (e, i) { var p = S.torriR[i]; pos(e, p[0], p[1] + 44, p[2], p[3] - 44); });
    function inPub(e) { var z = S.zonePub[e._zona]; pos(e, z[0] + 12 + e._rx * (z[2] - 24), z[1] + 24 + e._ry * (z[3] - 60)); }
    S.lucine.forEach(inPub); S.flash.forEach(inPub);
    S.bastoni.forEach(inPub); S.cartelli.forEach(inPub);
    S.ringhiere.forEach(function (r, i) { var lato = i % 2, fila = Math.floor(i / 2); pos(r, lato ? 1.55 * VW : 0.03 * VW, (0.2 + fila * 0.26) * VH, 0.42 * VW, 5); });
    S.occhi.forEach(function (o, i) {   // occhi di bue colorati che passano sulla folla
      var z = S.zonePub[i], d = 0.55 * VW; pos(o, z[0] + z[2] / 2 - d / 2, z[1] + Math.min(z[3], 0.5 * VH) * 0.35 - d / 2, d, d);
      o.style.setProperty("--dx", (i === 2 ? 0.7 * VW : (i ? -0.25 : 0.25) * VW) + "px"); o.style.setProperty("--dy", (i === 2 ? -0.06 * VH : 0.42 * VH) + "px");
    });
    pos(S.fumetto, W / 2, 1.06 * VH);
    // leggii
    S.posti = postiLeggii(S);
    var ordine = S.posti.map(function (p, i) { return i; }).sort(function (a, b) { return S.posti[b].fila - S.posti[a].fila; });   // prima la fila dietro
    ordine.forEach(function (i) {
      var p = S.posti[i], X = S.L[i]; if (!X) return;
      pos(X.el, p.cx - p.w / 2, p.top, p.w);
      X.el.style.fontSize = (p.w * 0.1).toFixed(1) + "px";
      S.zonaLeggii.appendChild(X.el);
    });
    S.file = S.posti.length > 4 ? 2 : 1;
  }

  // ---------- TELECAMERA ----------
  function camera(S, r, ms) {
    var s = Math.min(S.VW / r.w, S.VH / r.h), tx = (S.VW - r.w * s) / 2 - r.x * s, ty = (S.VH - r.h * s) / 2 - r.y * s;
    if (Math.abs(s - 1) < 0.001) { s = 1; tx = Math.round(tx); ty = Math.round(ty); }   // sul maxischermo: nitido al pixel
    S.mondo.style.transition = ms ? "transform " + ms + "ms cubic-bezier(.45,.05,.25,1)" : "none";
    S.mondo.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) scale(" + s.toFixed(4) + ")";
    var suSch = r === S.R.schermo;
    S.mondo.classList.toggle("st-quieto", suSch);   // sul maxischermo lo studio si ferma (risparmio batteria)
    S.rec.classList.toggle("on", !suSch);
    return dorme(ms || 0);
  }
  function inquadra(S, shot, ms) { S.shot = shot; return camera(S, shot(), ms); }
  function suSchermo(S, ms) { return inquadra(S, function () { return S.R.schermo; }, ms); }
  function largo(S, ms) { return inquadra(S, function () { return { x: 0, y: 0, w: S.W, h: S.H }; }, ms); }
  function suLeggio(S, i, ms) {
    return inquadra(S, function () {
      var p = S.posti[i] || S.posti[0], w = Math.max(0.64 * S.VW, p.w * 1.5), h = w * S.VH / S.VW;
      var x = Math.max(0, Math.min(S.W - w, p.cx - w / 2)), y = Math.max(0, Math.min(S.H - h, p.top + p.w * 0.72 - h / 2));   // mai fuori dallo studio
      return { x: x, y: y, w: w, h: h };
    }, ms);
  }
  function suPubblico(S, lato, ms) { return inquadra(S, function () { return { x: lato ? 1.5 * S.VW : 0, y: 0.06 * S.VH, w: 0.5 * S.VW, h: 1.1 * S.VH }; }, ms); }
  // panoramica lungo una fila di leggii: fn(i) viene chiamata quando la telecamera passa davanti al leggio i
  async function panFila(S, fila, ms, fn) {
    var idx = []; S.posti.forEach(function (p, i) { if (p.fila === fila) idx.push(i); });
    idx.sort(function (a, b) { return S.posti[a].cx - S.posti[b].cx; });
    if (!idx.length) return;
    var w = 0.9 * S.VW, h = 0.9 * S.VH;
    function rett(cx) { var p = S.posti[idx[0]]; return { x: Math.max(0, Math.min(S.W - w, cx - w / 2)), y: p.top + p.w * 0.66 - h / 2, w: w, h: h }; }
    var a = S.posti[idx[0]].cx, b = S.posti[idx[idx.length - 1]].cx;
    await inquadra(S, function () { return rett(a); }, 700);
    idx.forEach(function (i, k) { setTimeout(function () { if (fn) fn(i); }, idx.length > 1 ? k * ms / (idx.length - 1) * 0.9 : 0); });
    await inquadra(S, function () { return rett(b); }, ms);
  }

  // ---------- pezzi dello spettacolo ----------
  function fermaTimer(S) { if (S.timer && S.timer._stop) S.timer._stop(); S.timer = null; }
  function terzo(S, i, testo, sotto, ic) {
    var el = S.t.el, T = S.terzoEl; vuota(T);
    T.style.setProperty("--col", i != null && i >= 0 ? ST_COL[i % ST_COL.length] : "#ff3ea5");
    if (i != null && i >= 0 && S.gioc[i]) T.appendChild(el("span", { class: "fac", html: avatarDi(S.gioc[i]) }));
    else T.appendChild(el("span", { class: "ic", text: ic || "📺" }));
    T.appendChild(el("div", { class: "tx" }, [ el("span", { text: testo }), sotto ? el("small", { text: sotto }) : null ]));
    T.classList.remove("on"); void T.offsetWidth; T.classList.add("on");
  }
  function viaTerzo(S) { S.terzoEl.classList.remove("on"); }
  function barra(S, nodi) { vuota(S.barraEl); nodi.forEach(function (n) { if (n) S.barraEl.appendChild(n); }); S.barraEl.classList.add("on"); S.vista.classList.add("con-barra"); }
  function viaBarra(S) { S.barraEl.classList.remove("on"); S.vista.classList.remove("con-barra"); }
  function aspettaTasto(S, testo) {
    return new Promise(function (fine) {
      barra(S, [ S.t.el("button", { class: "btn btn-primario", text: testo, onclick: function () { viaBarra(S); fine(); } }) ]);
    });
  }
  function lampo(S) { var l = S.lampoEl; l.classList.remove("on"); void l.offsetWidth; l.classList.add("on"); }
  function accendi(S, i, on) { var X = S.L[i]; if (X) X.el.classList.toggle("acceso", !!on); }
  function accendiSolo(S, i) { S.L.forEach(function (X, k) { X.el.classList.toggle("acceso", k === i); }); }
  function faccia(S, i, f) { var X = S.L[i]; if (!X || X.faccia === (f || null)) return; X.faccia = f || null; mettiAvatar(X, S.gioc[i], f); }
  function tutteNormali(S) { S.L.forEach(function (X, i) { faccia(S, i, null); }); }
  function puntiLeggio(S, i, valore, delta) {
    var X = S.L[i]; if (!X) return;
    var da = X.valore; X.valore = valore;
    function scrivi(v) { X.pEl.textContent = v; X.pEl.classList.toggle("neg", v < 0); }
    if (!delta) return scrivi(valore);
    X.delta.textContent = (delta > 0 ? "+" : "−") + Math.abs(delta);
    X.delta.style.color = delta > 0 ? "#6ff0a6" : "#ff8d98";
    X.delta.classList.remove("on"); void X.delta.offsetWidth; X.delta.classList.add("on");
    var t0 = performance.now();
    (function passo() { var p = Math.min(1, (performance.now() - t0) / 800); scrivi(Math.round(da + (valore - da) * p)); if (p < 1) requestAnimationFrame(passo); })();
    setTimeout(function () { scrivi(valore); }, 900);   // anche se l'animazione non gira
  }
  function cartello(S, i, stato, voto) {
    var X = S.L[i]; if (!X) return;
    var r = X.cart.querySelector(".f.r");
    if (stato === "giu") { X.cart.classList.remove("su", "gira"); return; }
    if (voto != null) { r.className = "f r " + (voto ? "si" : "no"); r.textContent = voto ? "👍" : "👎"; }
    X.cart.classList.add("su");
    if (stato === "gira") X.cart.classList.add("gira");
  }
  function cartelliGiu(S) { S.L.forEach(function (X, i) { cartello(S, i, "giu"); }); }
  function pubblico(S, tipo) {
    var testi = { applauso: ["👏 Bravo!", "👏👏👏", "🔥 Grande!", "👏 Evviva!"], ohh: ["😮 Ohhh…", "😱 Nooo!", "😬 Ahia…"] };
    var l = testi[tipo] || testi.applauso;
    S.fumetto.textContent = l[Math.floor(Math.random() * l.length)];
    S.fumetto.classList.remove("on"); void S.fumetto.offsetWidth; S.fumetto.classList.add("on");
    if (tipo === "applauso") {
      S.pubWrap.classList.add("salta");
      S.flash.forEach(function (f, k) { setTimeout(function () { f.classList.remove("on"); void f.offsetWidth; f.classList.add("on"); }, 100 + Math.random() * 1300); });
      setTimeout(function () { S.pubWrap.classList.remove("salta"); }, 1900);
      FX.applauso();
    } else FX.ohh();
  }
  function logoSchermo(S) {
    fermaTimer(S);
    S.sch.innerHTML = "<div class='st-idle'><div class='stelle'>★ ★ ★</div><div class='logo'>LA LINEA<br>DEL TEMPO</div><div class='sotto'>il game show</div></div>";
  }

  // ---------- il gioco sul maxischermo ----------
  // o: { giocatori, turnoId, stato, sotto, rimMs, onScaduto, carta, linea, scegli, sel, tent, nuovo, chiave }
  function schermoGioco(S, o) {
    var el = S.t.el, sch = S.sch;
    fermaTimer(S); vuota(sch);
    sch.appendChild(nodoTop(el, o.giocatori, o.turnoId));
    sch.appendChild(el("div", { class: "tl-stato" }, [ el("div", {}, [ el("span", { text: o.stato }), o.sotto ? el("small", { text: o.sotto }) : null ]) ]));
    if (o.rimMs != null) { S.timer = barraTimer(el, Math.min(TEMPO * 1000, Math.max(0, o.rimMs)), TEMPO * 1000, o.onScaduto || null); sch.appendChild(S.timer); }
    sch.appendChild(nodoCartaMano(el, o.carta || { titolo: "" }));
    var z = el("div", { class: "tl-scroll" }), k = o.chiave;
    z.addEventListener("scroll", function () { memScroll = { k: k, top: z.scrollTop }; }, { passive: true });
    var asse = nodoLinea(el, o.linea || [], { carta: o.carta, scegli: o.scegli, sel: o.sel, tent: o.tent, nuovo: o.nuovo });
    z.appendChild(asse); sch.appendChild(z);
    if (memScroll.k === k) z.scrollTop = memScroll.top;
    else {
      memScroll = { k: k, top: 0 };
      if (o.tent != null) setTimeout(function () { var e = asse.querySelector(".tl-ev.tent"); if (e) { z.scrollTop = Math.max(0, e.offsetTop - z.clientHeight / 2 + e.offsetHeight / 2); memScroll = { k: k, top: z.scrollTop }; } }, 60);
    }
  }
  // chi gioca sceglie il punto: risolve col punto scelto, o null se scade il tempo
  function scegliSulloSchermo(S, o) {
    return new Promise(function (fine) {
      var scelto = null, finito = false;
      function chiudi(v) { if (finito) return; finito = true; fermaTimer(S); viaBarra(S); fine(v); }
      var conf = S.t.el("button", { class: "btn btn-primario tl-conferma", text: "⤵ Tocca dove va la carta", disabled: "disabled", onclick: function () { if (scelto != null) chiudi(scelto); } });
      schermoGioco(S, { giocatori: o.giocatori, turnoId: o.turnoId, stato: "Tocca a te, " + o.nome + "!", sotto: "Dove va questa carta?", rimMs: TEMPO * 1000,
        onScaduto: function () { chiudi(null); }, carta: o.carta, linea: o.linea, nuovo: o.nuovo, chiave: "loc|" + chiaveCarta(o.carta),
        scegli: function (i) { scelto = i; conf.disabled = false; conf.textContent = "✅ Mettila qui"; } });
      barra(S, [conf]);
    });
  }
  function votaSulloSchermo(S, o) {
    return new Promise(function (fine) {
      schermoGioco(S, { giocatori: o.giocatori, turnoId: o.turnoId, stato: o.nome + ", sei d'accordo?", sotto: o.chi + " l'ha messa qui: è giusto?",
        carta: o.carta, linea: o.linea, tent: o.gap, chiave: "locv|" + chiaveCarta(o.carta) + "|" + o.nome });
      var el = S.t.el;
      barra(S, [ el("div", { class: "tl-vota" }, [
        el("button", { class: "btn btn-verde", text: "👍 Giusto", onclick: function () { viaBarra(S); fine(true); } }),
        el("button", { class: "btn btn-rosso", text: "👎 No", onclick: function () { viaBarra(S); fine(false); } })
      ]) ]);
    });
  }

  // ---------- LA REGIA: i momenti dello spettacolo ----------
  async function apertura(S) {
    viaBarra(S); logoSchermo(S);
    await suPubblico(S, 0, 0);
    terzo(S, null, "In diretta dallo studio", "La linea del tempo", "📺");
    pubblico(S, "applauso");
    await dorme(600); await suSchermo(S, 1600); await dorme(400); await suPubblico(S, 1, 1600); viaTerzo(S);
    await largo(S, 1300); await dorme(400);
    if (S.gioc.length <= 4) {
      for (var i = 0; i < S.gioc.length; i++) {
        if (!S.vivo()) return;
        await suLeggio(S, i, 850); accendiSolo(S, i); faccia(S, i, "esulta");
        terzo(S, i, S.gioc[i].nome, i === S.io ? "Sei tu! In bocca al lupo" : "Concorrente n° " + (i + 1));
        await dorme(700); faccia(S, i, null); viaTerzo(S);
      }
      accendiSolo(S, -1);
    } else {
      for (var f = 0; f < S.file; f++) {
        if (!S.vivo()) return;
        var quanti = S.posti.filter(function (p) { return p.fila === f; }).length;
        terzo(S, null, f === 0 ? "Ecco i concorrenti!" : "…e in seconda fila!", quanti + " concorrenti", "🎤");
        await panFila(S, f, 2600, function (k) { accendi(S, k, true); faccia(S, k, "esulta"); setTimeout(function () { accendi(S, k, false); faccia(S, k, null); }, 900); });
      }
      viaTerzo(S);
    }
    await largo(S, 1000); await dorme(300);
  }
  // stacco su chi gioca prima di andare sul maxischermo
  async function stacco(S, gi, sotto) {
    viaBarra(S); cartelliGiu(S); tutteNormali(S);
    accendiSolo(S, gi);
    await suLeggio(S, gi, 900);
    faccia(S, gi, "pensa");
    terzo(S, gi, "Tocca a " + (S.gioc[gi] ? S.gioc[gi].nome : ""), sotto);
    await dorme(1300);
    viaTerzo(S); faccia(S, gi, null);
  }
  // R = { gi, es: { giusto, anno, titolo, fatto, cat, scaduto, finito, nome }, voti: [{ i, d, giusto, delta }], dopo: [punti per indice] }
  async function rivelazione(S, R) {
    var el = S.t.el, es = R.es, ok = !!es.giusto;
    viaBarra(S); fermaTimer(S);
    await suSchermo(S, 700);
    vuota(S.sch);
    S.sch.appendChild(el("div", { class: "st-raggi" + (ok ? "" : " ko") }));
    S.sch.appendChild(nodoEsito(el, { giusto: ok, anno: es.anno, titolo: es.titolo, fatto: es.fatto, cat: es.cat, nome: es.nome, scaduto: es.scaduto, finito: es.finito }, null));
    FX.rullo(1.2);
    setTimeout(function () { ok ? FX.giusto() : FX.sbagliato(); }, 1300);
    await dorme(2300);
    if (!S.vivo()) return;
    // la reazione di chi ha giocato, col pubblico
    lampo(S); accendiSolo(S, R.gi);
    await suLeggio(S, R.gi, 650);
    faccia(S, R.gi, ok ? "esulta" : "triste");
    pubblico(S, ok ? "applauso" : "ohh");
    puntiLeggio(S, R.gi, R.dopo[R.gi], ok ? PUNTI : -PUNTI);
    if (ok) coriandoli();
    await dorme(1900);
    // i cartellini degli altri si girano
    if (R.voti && R.voti.length) {
      R.voti.forEach(function (v) { cartello(S, v.i, "su"); });
      await largo(S, 900); await dorme(350);
      function gira(v) { cartello(S, v.i, "gira", v.d); faccia(S, v.i, v.giusto ? "esulta" : "triste"); puntiLeggio(S, v.i, R.dopo[v.i], v.delta); }
      if (S.file === 1) {
        for (var k = 0; k < R.voti.length; k++) { if (!S.vivo()) return; gira(R.voti[k]); await dorme(420); }
        await dorme(1300);
      } else {
        var perIdx = {}; R.voti.forEach(function (v) { perIdx[v.i] = v; });
        for (var f = 0; f < S.file; f++) await panFila(S, f, 1800, function (i) { if (perIdx[i]) gira(perIdx[i]); });
        await dorme(900); await largo(S, 800);
      }
    }
    // tutti i punti giusti (anche chi non ha votato)
    R.dopo.forEach(function (p, i) { if (S.L[i] && S.L[i].valore !== p) puntiLeggio(S, i, p, 0); });
    cartelliGiu(S); tutteNormali(S); accendiSolo(S, -1);
  }
  async function finaleStudio(S, vinc, punti) {
    viaBarra(S); fermaTimer(S); logoSchermo(S); cartelliGiu(S);
    await largo(S, 1000);
    terzo(S, null, "Fine della puntata!", "E il vincitore è…", "🏁");
    FX.rullo(1.6);
    await dorme(1800); viaTerzo(S);
    if (vinc >= 0) {
      lampo(S); accendiSolo(S, vinc);
      await suLeggio(S, vinc, 1100);
      faccia(S, vinc, "esulta");
      terzo(S, vinc, (S.gioc[vinc] ? S.gioc[vinc].nome : "") + " vince!", punti + " punti", "🏆");
      pubblico(S, "applauso"); coriandoli(); FX.vittoria();
      await dorme(3000); viaTerzo(S);
    }
    await largo(S, 1400); await dorme(700);
  }

  var gioco = {
    id: "timeline",
    nome: "La linea del tempo",
    icona: "📜",
    descrizione: "Metti gli avvenimenti nell'ordine giusto e sfida gli amici a punti.",
    giocatoriMin: 1,
    giocatoriMax: MAX_GIOCATORI,
    difficolta: 2,   // Media — quanto vale vincerlo nel torneo (1 facile, 2 media, 3 difficile)

    regole: [
      "Al tuo turno esce un avvenimento <b>senza data</b>: hai <b>30 secondi</b> per decidere dove va nella linea del tempo.",
      "Se indovini vinci <b>100 punti</b> e la carta entra nella linea. Se sbagli <b>perdi 100 punti</b> e la carta sparisce (la data resta segreta).",
      "Online: quando scegli, gli altri vedono il punto e <b>votano</b> se sono d'accordo. Chi vota giusto prende <b>50 punti</b>, chi sbaglia ne perde 50.",
      "La <b>classifica</b> è sempre in alto. Vince chi ha più punti quando tutti hanno finito le carte."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      var categorie = window.SG_CATEGORIE || [];
      var link = SG.parametriLink();

      dove.modo = "telefono";
      if (!aiuti.torneo) {
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      var bTel, bOnl;
      function scegliModo(m) {
        dove.modo = m;
        bTel.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        notaOnline.hidden = (m !== "online");
        notaOnline.textContent = SGNet && SGNet.disponibile()
          ? "Gli altri entrano dai loro telefoni con un codice. Qui scrivi solo il TUO nome."
          : "Attenzione: qui il collegamento non è disponibile. Funziona quando il gioco è pubblicato su un sito.";
      }
      bTel = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [
          el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "Si passa di mano in mano" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [
          el("div", { class: "mt", text: "Ognuno dal suo telefono" }), el("div", { class: "ms", text: "Con voti e punti" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bTel, bOnl]));
      box.appendChild(notaOnline);
      }

      var idValidi = categorie.map(function (c) { return c.id; });
      var diPartenza = (link.cat && link.cat.filter(function (id) { return idValidi.indexOf(id) >= 0; })) || null;
      dove.categorie = (diPartenza && diPartenza.length) ? diPartenza.slice() : idValidi.slice();
      box.appendChild(el("div", { class: "etichetta", text: "Categorie in gioco" }));
      var griglia = el("div", { class: "cat-griglia" });
      categorie.forEach(function (c) {
        var chip = el("button", { class: "cat-chip" + (dove.categorie.indexOf(c.id) >= 0 ? " attiva" : ""),
          onclick: function () {
            var i = dove.categorie.indexOf(c.id);
            if (i >= 0) dove.categorie.splice(i, 1); else dove.categorie.push(c.id);
            chip.className = "cat-chip" + (dove.categorie.indexOf(c.id) >= 0 ? " attiva" : "");
          } }, [ el("span", { class: "ci", text: c.icona || "🎲" }), el("span", { text: c.nome }), el("span", { class: "spunta", text: "✓" }) ]);
        griglia.appendChild(chip);
      });
      box.appendChild(griglia);

      dove.carte = link.carte ? Math.max(3, Math.min(8, link.carte)) : 5;
      box.appendChild(el("div", { class: "etichetta", text: "Carte da piazzare a testa" }));
      var valore = el("span", { class: "valore", text: dove.carte });
      function agg(d) { dove.carte = Math.max(3, Math.min(8, dove.carte + d)); valore.textContent = dove.carte; }
      box.appendChild(el("div", { class: "stepper" }, [
        el("button", { text: "−", onclick: function () { agg(-1); } }), valore,
        el("button", { text: "+", onclick: function () { agg(1); } }) ]));

      box.appendChild(el("div", { class: "etichetta", text: "Da mandare agli amici" }));
      var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", hidden: "hidden" });
      var avviso = el("div", { class: "link-avviso", hidden: "hidden" });
      box.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Crea il link con queste impostazioni",
        onclick: function () {
          if (!dove.categorie.length) { avviso.hidden = false; avviso.textContent = "Scegli almeno una categoria."; return; }
          var url = SG.creaLink({ gioco: "timeline", cat: dove.categorie, carte: dove.carte });
          campo.value = url; campo.hidden = false; campo.focus(); campo.select();
          try { navigator.clipboard.writeText(url); } catch (e) {}
          avviso.hidden = false; avviso.textContent = "Link pronto! Se non si copia da solo, tienilo premuto e copialo.";
        } }));
      box.appendChild(campo); box.appendChild(avviso);
    },

    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteEntra(t, t.linkParams.stanza);
      if (t.impostazioni && t.impostazioni.modo === "online") return hostCrea(t);
      return partenzaTelefono(t);
    }
  };

  // =========================================================
  //  MODALITÀ "UN TELEFONO SOLO"
  // =========================================================
  function partenzaTelefono(t) {
    var mazzo = mischiaArr(pescaDati(t.impostazioni));
    var carte = (t.impostazioni && t.impostazioni.carte) || 5;
    var stato = {
      mazzo: mazzo, linea: [mazzo.pop()], turno: 0, carta: null,
      giocatori: t.giocatori.map(function (n) { return { nome: n, restano: carte, punti: 0 }; })
    };
    // chi ha il profilo su questo telefono (i trofei contano solo le sue giocate)
    var prof = window.SGNube && SGNube.disponibile() && SGNube.profilo();
    stato._io = -1;
    if (prof) stato.giocatori.forEach(function (g, i) { if (stato._io < 0 && g.nome === prof.nome) stato._io = i; });
    stato._T = stato._io >= 0 ? creaTraccia({ online: false, carte: carte, tutteCat: tutteLeCategorie(t.impostazioni) }) : null;
    ordina(stato.linea);
    // lo studio: tutti sullo stesso telefono, quindi nessun "TU"
    stato.S = creaStudio(t, stato.giocatori, { io: -1, esci: t.esci });
    apertura(stato.S).then(function () { turnoTel(t, stato); });
  }
  function attivi(stato) { var n = 0; stato.giocatori.forEach(function (g) { if (g.restano > 0) n++; }); return n; }
  function saltaFiniti(stato) { var giri = 0, N = stato.giocatori.length; while (N && stato.giocatori[stato.turno % N].restano === 0 && giri < N) { stato.turno++; giri++; } }

  async function turnoTel(t, stato) {
    var S = stato.S;
    if (!S.vivo()) return;
    if (attivi(stato) === 0 || stato.mazzo.length === 0) return fineTel(t, stato);
    saltaFiniti(stato);
    var N = stato.giocatori.length, gi = stato.turno % N, g = stato.giocatori[gi], uno = N === 1;
    var carta = stato.carta = stato.mazzo.pop();
    stato.giocatori.forEach(function (x) { delete x._voto; });
    // 1) stacco su chi gioca (e il telefono passa a lui)
    await stacco(S, gi, uno ? "Dove va questa carta?" : "Passa il telefono a " + g.nome);
    if (!uno) await aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶");
    if (!S.vivo()) return;
    FX.turno();
    // 2) si gioca sul maxischermo
    await suSchermo(S, 900);
    var gap = await scegliSulloSchermo(S, { giocatori: stato.giocatori, turnoId: g.nome, nome: g.nome, carta: carta, linea: stato.linea, nuovo: stato._nuovo });
    stato._nuovo = null;
    if (!S.vivo()) return;
    // 3) votano gli altri, uno alla volta col telefono in mano; il cartellino resta coperto
    var votanti = [];
    if (gap != null) stato.giocatori.forEach(function (x, i) { if (i !== gi) votanti.push(i); });
    for (var j = 0; j < votanti.length; j++) {
      var vi = votanti[j], v = stato.giocatori[vi];
      accendiSolo(S, vi);
      await suLeggio(S, vi, 800);
      terzo(S, vi, "Passa il telefono a " + v.nome, "Ora tocca a te votare", "📱");
      await aspettaTasto(S, "📱 Sono " + v.nome + " ▶");
      viaTerzo(S); if (!S.vivo()) return;
      await suSchermo(S, 800);
      v._voto = await votaSulloSchermo(S, { giocatori: stato.giocatori, turnoId: g.nome, nome: v.nome, chi: g.nome, carta: carta, linea: stato.linea, gap: gap });
      FX.voto(); cartello(S, vi, "su", v._voto);
    }
    if (votanti.length) { accendiSolo(S, -1); await largo(S, 900); terzo(S, null, "Tutti hanno votato!", "Vediamo chi ha ragione…", "🗳️"); await dorme(1500); viaTerzo(S); }
    // 4) risultato: punti e trofei, poi lo spettacolo
    var ok = gap != null && gapGiusto(stato.linea, gap, carta.anno), voti = [];
    if (gi === stato._io) tPiazza(stato._T, ok, carta._cat);
    stato.giocatori.forEach(function (x, xi) {
      if (xi === gi || x._voto == null) return;
      var giusto = (x._voto === ok);
      if (xi === stato._io) tVoto(stato._T, x._voto, giusto);
      x.punti += giusto ? VOTO : -VOTO;
      voti.push({ i: xi, d: x._voto, giusto: giusto, delta: giusto ? VOTO : -VOTO });
      delete x._voto;
    });
    if (ok) { stato.linea.push(carta); ordina(stato.linea); g.punti += PUNTI; stato._nuovo = carta.titolo; }
    else { g.punti -= PUNTI; }
    g.restano -= 1;
    await rivelazione(S, { gi: gi, voti: voti, dopo: stato.giocatori.map(function (x) { return x.punti; }),
      es: { giusto: ok, anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto, cat: carta._cat, nome: g.nome, scaduto: gap == null, finito: g.restano === 0 } });
    if (!S.vivo()) return;
    if (g.restano === 0 && N > 1) { terzo(S, gi, "🎉 " + g.nome + " ha finito le carte!", "Complimenti", "🎉"); await dorme(1600); viaTerzo(S); }
    var finita = attivi(stato) === 0 || stato.mazzo.length === 0;
    if (finita) return fineTel(t, stato);
    if (uno) await aspettaTasto(S, "Avanti ▶");
    stato.turno += 1;
    turnoTel(t, stato);
  }
  function classificaPunti(giocatori) {
    return giocatori.slice().sort(function (a, b) { return b.punti - a.punti; }).map(function (g) { return { id: g.id, nome: g.nome, punti: g.punti, omino: g.omino || null }; });
  }
  async function fineTel(t, stato) {
    var cl = classificaPunti(stato.giocatori), io = stato.giocatori[stato._io];
    if (io) tFine(stato._T, cl, function (r) { return r.nome === io.nome; }, io.restano === 0);
    var vinc = -1; stato.giocatori.forEach(function (g, i) { if (vinc < 0 && cl[0] && g.nome === cl[0].nome) vinc = i; });
    if (stato.S && stato.S.vivo()) await finaleStudio(stato.S, vinc, cl[0] ? cl[0].punti : 0);
    if (stato.S && !stato.S.vivo()) return;
    schermataFine(t, cl, function () { partenzaTelefono(t); });
  }

  // =========================================================
  //  MODALITÀ ONLINE (host-authoritative, con votazione)
  // =========================================================
  function indexById(st, id) { for (var i = 0; i < st.giocatori.length; i++) if (st.giocatori[i].id === id) return i; return -1; }
  function trovaG(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return vm.giocatori[i]; return null; }
  function vmDa(st) {
    var g = st.giocatori, idx = g.length ? (st.turno % g.length) : 0;
    return {
      fase: st.fase, codice: st.codice, scadenza: st.scadenza || null, scelta: st.scelta != null ? st.scelta : null,
      giocatori: g.map(function (x) { return { id: x.id, nome: x.nome, restano: x.restano, punti: x.punti, omino: x.omino || null }; }),
      turnoId: g.length ? g[idx].id : null, turnoNome: g.length ? g[idx].nome : "",
      linea: st.linea.map(function (e) { return { anno: e.anno, titolo: e.titolo, fatto: e.fatto || "", cat: e._cat }; }),
      carta: st.carta ? { titolo: st.carta.titolo, fatto: st.carta.fatto || "", cat: st.carta._cat } : null,
      hannoVotato: Object.keys(st.voti || {}), esito: st.esito || null, classifica: st.classifica || null,
      carte: st.carte, tutteCat: st.tutteCat   // servono agli ospiti per i trofei
    };
  }
  function hostCrea(t) {
    if (!(window.SGNet && SGNet.disponibile())) return schermataNoNet(t);
    var carte = (t.impostazioni && t.impostazioni.carte) || 5;
    var st = {
      mazzo: mischiaArr(pescaDati(t.impostazioni)), linea: [], turno: 0, carta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, carte: carte, codice: "…", scelta: null, voti: {}, scadenza: null, _to: null,
      tutteCat: tutteLeCategorie(t.impostazioni), T: null,
      giocatori: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host", restano: carte, punti: 0, omino: mioAvatar((t.giocatori && t.giocatori[0]) || "Host") }]
    };
    function corr() { return st.giocatori[st.turno % st.giocatori.length]; }
    function clearTo() { if (st._to) { clearTimeout(st._to); st._to = null; } }

    var rete = SGNet.ospita("timeline", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        var i = indexById(st, id); if (i < 0) return;
        var eraCorr = st.iniziata && corr().id === id;
        st.giocatori.splice(i, 1); delete st.voti[id];
        if (st.iniziata && st.giocatori.length === 0) { clearTo(); rete.chiudi(); return t.esci(); }
        if (st.iniziata && st.fase !== "fine" && attivi(st) === 0) return finisci();
        if (eraCorr && st.fase === "turno") { clearTo(); st.turno = st.turno % st.giocatori.length; iniziaTurno(); return; }
        if (eraCorr && st.fase === "esito") { st.turno = st.turno % st.giocatori.length; iniziaTurno(); return; }   // se esce chi doveva premere Avanti, si va avanti lo stesso
        if (st.fase === "votazione") verificaVoti();
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (!st.iniziata && indexById(st, id) < 0 && st.giocatori.length < MAX_GIOCATORI)
            st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), restano: st.carte, punti: 0, omino: avatarValido(m.omino) });
          bd();
        }
        else if (m.t === "scelta") { scelta(id, m.gap); }
        else if (m.t === "voto") { voto(id, m.d); }
        else if (m.t === "avanti") { if (st.fase === "esito" && corr().id === id) prossimo(); }
      },
      onErrore: function (e) { schermataNoNet(t, e); }
    });
    function invia() { rete.invia({ t: "vm", vm: vmDa(st) }); }
    function bd() { invia(); disegna(); }

    function comincia() {
      if (st.iniziata || st.giocatori.length < 1) return;
      st.iniziata = true; st.linea = [st.mazzo.pop()]; ordina(st.linea);
      st.T = creaTraccia({ online: true, carte: st.carte, tutteCat: st.tutteCat });
      // prima la sigla dello studio (uguale su tutti i telefoni), poi il primo turno
      st.fase = "apertura"; st.scadenza = null; bd();
      st._to = setTimeout(iniziaTurno, durataApertura(st.giocatori.length));
    }
    function iniziaTurno() {
      clearTo();
      if (attivi(st) === 0 || st.mazzo.length === 0) return finisci();
      saltaFiniti(st);
      st.carta = st.mazzo.pop(); st.scelta = null; st.voti = {}; st.esito = null; st.fase = "turno";
      // il tempo parte dopo lo stacco della telecamera su chi gioca
      st.scadenza = Date.now() + TEMPO * 1000 + STACCO;
      st._to = setTimeout(function () { scelta(corr().id, null); }, TEMPO * 1000 + STACCO); // tempo scaduto = niente scelta
      bd();
    }
    function scelta(playerId, gap) {
      if (st.fase !== "turno" || corr().id !== playerId) return;
      clearTo();
      st.scelta = (gap == null ? -1 : gap); // -1 = tempo scaduto senza scegliere
      var votanti = st.giocatori.filter(function (x) { return x.id !== corr().id; });
      if (st.scelta === -1 || votanti.length === 0) return risolvi(); // nessuno da far votare
      st.fase = "votazione"; st.voti = {}; st.scadenza = Date.now() + TEMPO * 1000;
      st._to = setTimeout(function () { risolvi(); }, TEMPO * 1000);
      bd();
    }
    function voto(id, d) {
      if (st.fase !== "votazione" || id === corr().id) return;
      if (indexById(st, id) < 0) return;
      st.voti[id] = !!d; bd(); verificaVoti();
    }
    function verificaVoti() {
      var votanti = st.giocatori.filter(function (x) { return x.id !== corr().id; });
      if (votanti.every(function (x) { return st.voti[x.id] != null; })) risolvi();
    }
    function risolvi() {
      clearTo();
      var g = corr(), carta = st.carta, gap = st.scelta;
      var ok = gap != null && gap >= 0 && gapGiusto(st.linea, gap, carta.anno);
      var voti = [];
      st.giocatori.forEach(function (x) {
        if (x.id === g.id) return;
        if (st.voti[x.id] == null) return; // non ha votato: 0
        var giustoV = (st.voti[x.id] === ok);
        x.punti += giustoV ? VOTO : -VOTO;
        if (x.id === "host") tVoto(st.T, st.voti[x.id], giustoV);
        voti.push({ id: x.id, nome: x.nome, omino: x.omino || null, d: st.voti[x.id], giusto: giustoV, delta: giustoV ? VOTO : -VOTO });
      });
      if (g.id === "host") tPiazza(st.T, ok, carta._cat);
      if (ok) { st.linea.push(carta); ordina(st.linea); g.punti += PUNTI; } else { g.punti -= PUNTI; }
      g.restano -= 1;
      st.esito = { giusto: ok, anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto || "", nome: g.nome, cat: carta._cat,
        delta: ok ? PUNTI : -PUNTI, scaduto: gap === -1, voti: voti, finito: g.restano === 0 };
      st.scelta = null; st.scadenza = null; st.fase = "esito";
      bd();
    }
    function prossimo() {
      if (attivi(st) === 0 || st.mazzo.length === 0) return finisci();
      st.turno += 1; iniziaTurno();
    }
    function finisci() {
      clearTo(); st.fase = "fine"; st.scadenza = null;
      st.classifica = classificaPunti(st.giocatori);
      var io = st.giocatori[indexById(st, "host")];
      if (io) tFine(st.T, st.classifica, function (r) { return r.id === "host"; }, io.restano === 0);
      bd();
    }
    var cb = { myId: "host", sonoHost: true,
      onGap: function (g) { scelta("host", g); }, onVoto: function (d) { voto("host", d); },
      onAvanti: function () { if (st.fase === "esito" && corr().id === "host") prossimo(); },
      onComincia: comincia, onEsci: function () { clearTo(); rete.chiudi(); t.esci(); } };
    function disegna() { disegnaVM(t, vmDa(st), cb); }
    disegna();
  }

  function ospiteEntra(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return schermataNoNet(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null };
    var cb = { myId: null, sonoHost: false,
      onGap: function (g) { S.rete && S.rete.invia({ t: "scelta", gap: g }); },
      onVoto: function (d) { S.rete && S.rete.invia({ t: "voto", d: d }); },
      onAvanti: function () { S.rete && S.rete.invia({ t: "avanti" }); },
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaVM(t, S.vm, cb); } }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🔗", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        ctx(); S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: mioAvatar(S.nome) });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice o aspetta che l'host apra la stanza…"; }, 8000); },
        onMsg: function (m) { if (m && m.t === "vm") { tracciaOspite(S, m.vm); S.vm = m.vm; disegna(); } },
        onChiuso: function () { schermaErr("Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function (e) { schermaErr(codiceErrore(e)); }
      });
    }
    function schermaErr(txt) {
      var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
      s._contenuto.appendChild(el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
      t.mostra(s);
    }
  }

  // L'ospite conta i suoi trofei guardando i cambi di fase che arrivano dall'host
  function tracciaOspite(S, vm) {
    var prima = S.vm ? S.vm.fase : null;
    if (vm.fase !== "lobby" && !S.T && !S.tFatto) { S.tFatto = true; S.T = creaTraccia({ online: true, carte: vm.carte, tutteCat: vm.tutteCat }); }
    if (!S.T) return;
    if (vm.fase === "esito" && prima !== "esito" && vm.esito) {
      if (vm.turnoId === S.myId) tPiazza(S.T, vm.esito.giusto, vm.esito.cat);
      (vm.esito.voti || []).forEach(function (v) { if (v.id === S.myId) tVoto(S.T, v.d, v.giusto); });
    }
    if (vm.fase === "fine" && prima !== "fine") {
      var io = trovaG(vm, S.myId);
      tFine(S.T, vm.classifica || [], function (r) { return r.id === S.myId; }, !!io && io.restano === 0);
    }
  }

  // Ricordo dell'ultima fase (per la lobby e la classifica)
  var ultimaFase = null;

  // ---- ONLINE: ogni telefono ha il suo studio e la sua "regia" ----
  // Le novità dall'host arrivano in qualsiasi momento: la regia le mette in fila
  // e fa partire i momenti dello spettacolo uno dopo l'altro, senza saltarne.
  var REG = null;
  function idxDi(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return i; return -1; }
  function giocHUD(vm, meId) { return vm.giocatori.map(function (g) { return { id: g.id, nome: g.nome, punti: g.punti, omino: g.omino, _me: g.id === meId }; }); }
  function disegnaVM(t, vm, cb) {
    if (vm.fase === "lobby") { ultimaFase = "lobby"; REG = null; return disegnaLobby(t, vm, cb); }
    var ids = vm.giocatori.map(function (g) { return g.id; }).join("|");
    if (!REG || (!REG.S.vivo() && !REG.fineFatta)) {
      REG = { t: t, cb: cb, vm: vm, ids: ids };
      REG.S = creaStudio(t, vm.giocatori, { io: idxDi(vm, cb.myId), esci: function () { cb.onEsci(); } });
      vm.giocatori.forEach(function (g, i) { puntiLeggio(REG.S, i, g.punti, 0); });
    } else if (REG.ids !== ids && REG.S.vivo()) {   // qualcuno è uscito: rifaccio i leggii
      REG.ids = ids; REG.S.impostaGiocatori(vm.giocatori, idxDi(vm, cb.myId));
      vm.giocatori.forEach(function (g, i) { puntiLeggio(REG.S, i, g.punti, 0); });
      camera(REG.S, REG.S.shot(), 0);
    }
    REG.cb = cb; REG.vm = vm;
    regiaTick(REG);
  }
  async function regiaTick(R) {
    if (R.corre) { R.ancora = true; return; }
    R.corre = true;
    try {
      for (var giri = 0; giri < 30; giri++) {
        R.ancora = false;
        var fatto = await regiaPasso(R);
        if (!fatto && !R.ancora) break;
      }
    } catch (e) {} finally { R.corre = false; }
  }
  // un passo della regia: true se ha fatto uno spettacolo (poi si ricontrolla la situazione più recente)
  async function regiaPasso(R) {
    var vm = R.vm, S = R.S, cb = R.cb, el = R.t.el;
    if (!S.vivo()) return false;
    var io = idxDi(vm, cb.myId), gi = idxDi(vm, vm.turnoId), mioTurno = gi >= 0 && gi === io;
    var kT = (vm.turnoId || "") + "|" + chiaveCarta(vm.carta), nomeT = vm.turnoNome || "";
    if (vm.fase === "apertura") {
      if (R.aperturaFatta) return false;
      R.aperturaFatta = true; ultimaFase = "apertura";
      await apertura(S); return true;
    }
    if (vm.fase === "fine") {
      if (R.fineFatta) return false;
      R.fineFatta = true; ultimaFase = "fine";
      var cl = vm.classifica || [], vinc = cl[0] ? idxDi(vm, cl[0].id) : -1;
      await finaleStudio(S, vinc, cl[0] ? cl[0].punti : 0);
      schermataFine(R.t, cl, null); return true;
    }
    if (vm.fase === "turno" || vm.fase === "votazione") {
      if (R.kTurno !== kT) {   // turno nuovo: stacco su chi gioca, poi sul maxischermo
        R.kTurno = kT; R.aperturaFatta = true; R.mioVoto = null; R.mostrato = null; R.alzati = {};
        memSel = { k: chiaveCarta(vm.carta), gap: null };
        vm.giocatori.forEach(function (g, i) { puntiLeggio(S, i, g.punti, 0); });
        if (vm.fase === "turno") {
          ultimaFase = "turno";
          if (mioTurno) FX.turno();
          await stacco(S, gi, mioTurno ? "Tocca a te!" : "Sta per scegliere…");
          if (S.vivo()) await suSchermo(S, 900);
          return true;
        }
      }
      if (vm.fase === "turno") mostraTurno(R, vm, gi, mioTurno, nomeT, kT);
      else mostraVoto(R, vm, gi, io, mioTurno, nomeT, kT);
      return false;
    }
    if (vm.fase === "esito") {
      var kE = kT + "|esito";
      if (R.kEsito !== kE) {
        R.kEsito = kE; R.kTurno = kT; ultimaFase = "esito";
        var es = vm.esito || {}, voti = [];
        (es.voti || []).forEach(function (v) { var i = idxDi(vm, v.id); if (i >= 0) { voti.push({ i: i, d: v.d, giusto: v.giusto, delta: v.delta }); cartello(S, i, "su"); } });
        await rivelazione(S, { gi: gi, voti: voti, dopo: vm.giocatori.map(function (g) { return g.punti; }),
          es: { giusto: es.giusto, anno: es.anno, titolo: es.titolo, fatto: es.fatto, cat: es.cat, nome: es.nome, scaduto: es.scaduto, finito: es.finito } });
        if (S.vivo() && es.finito && vm.giocatori.length > 1) { terzo(S, gi, "🎉 " + es.nome + " ha finito le carte!", "Complimenti", "🎉"); await dorme(1500); viaTerzo(S); }
        return true;
      }
      if (R.mostrato !== kE) {
        R.mostrato = kE;
        if (mioTurno) barra(S, [ el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: function () { viaBarra(S); cb.onAvanti(); } }) ]);
        else barra(S, [ el("p", { class: "tl-attesa", text: "In attesa di " + nomeT + "…" }) ]);
      }
      return false;
    }
    return false;
  }
  function mostraTurno(R, vm, gi, mioTurno, nomeT, kT) {
    var S = R.S, el = R.t.el, cb = R.cb, kCarta = chiaveCarta(vm.carta);
    var chiave = "t|" + kT + "|" + vm.giocatori.length;
    if (R.mostrato === chiave) return;
    R.mostrato = chiave;
    if (S.shot && S.shot() !== S.R.schermo) suSchermo(S, 700);
    var conf = null;
    if (mioTurno) {
      conf = el("button", { class: "btn btn-primario tl-conferma", text: memSel.gap != null ? "✅ Mettila qui" : "⤵ Tocca dove va la carta",
        onclick: function () { if (memSel.gap != null) { viaBarra(S); fermaTimer(S); cb.onGap(memSel.gap); } } });
      if (memSel.gap == null) conf.disabled = true;
    }
    schermoGioco(S, { giocatori: giocHUD(vm, cb.myId), turnoId: vm.turnoId, stato: mioTurno ? "Tocca a te!" : "Tocca a " + nomeT,
      sotto: mioTurno ? "Dove va questa carta?" : "Sta scegliendo dove metterla…", rimMs: vm.scadenza ? vm.scadenza - Date.now() : null,
      carta: vm.carta, linea: vm.linea, sel: mioTurno ? memSel.gap : null, chiave: "vm-t|" + kT,
      scegli: mioTurno ? function (i) { memSel = { k: kCarta, gap: i }; conf.disabled = false; conf.textContent = "✅ Mettila qui"; } : null });
    if (conf) barra(S, [conf]);
    else barra(S, [ el("p", { class: "tl-attesa", text: "Guarda bene la linea: dopo tocca votare!" }) ]);
  }
  function mostraVoto(R, vm, gi, io, mioTurno, nomeT, kT) {
    var S = R.S, el = R.t.el, cb = R.cb;
    var hoVotato = vm.hannoVotato.indexOf(cb.myId) >= 0 || R.mioVoto != null;
    // cartellini (coperti) di chi ha già votato: il mio lo conosco, gli altri no
    vm.hannoVotato.forEach(function (id) { var i = idxDi(vm, id); if (i >= 0 && !R.alzati[id]) { R.alzati[id] = true; cartello(S, i, "su", id === cb.myId ? R.mioVoto : null); } });
    var devoVotare = !mioTurno && !hoVotato && io >= 0;
    var chiave = "v|" + kT + "|" + vm.giocatori.length + "|" + (devoVotare ? "vota" : "guarda");
    if (R.mostrato === chiave) return;
    R.mostrato = chiave;
    schermoGioco(S, { giocatori: giocHUD(vm, cb.myId), turnoId: vm.turnoId, stato: mioTurno ? "Gli altri votano…" : (devoVotare ? "Vota!" : "Hai votato"),
      sotto: mioTurno ? "Speriamo siano d'accordo 🤞" : nomeT + " l'ha messa qui: è giusto?", rimMs: vm.scadenza ? vm.scadenza - Date.now() : null,
      carta: vm.carta, linea: vm.linea, tent: vm.scelta, chiave: "vm-v|" + kT });
    if (devoVotare) {
      if (S.shot && S.shot() !== S.R.schermo) suSchermo(S, 700);
      barra(S, [ el("div", { class: "tl-vota" }, [
        el("button", { class: "btn btn-verde", text: "👍 Giusto", onclick: function () { FX.voto(); R.mioVoto = true; viaBarra(S); cb.onVoto(true); regiaTick(R); } }),
        el("button", { class: "btn btn-rosso", text: "👎 No", onclick: function () { FX.voto(); R.mioVoto = false; viaBarra(S); cb.onVoto(false); regiaTick(R); } })
      ]) ]);
    } else {
      // niente da fare: la telecamera va sui concorrenti a vedere i cartellini che si alzano
      barra(S, [ el("p", { class: "tl-attesa", text: mioTurno ? "Gli altri stanno votando la tua scelta…" : "Hai votato. Aspetta gli altri…" }) ]);
      largo(S, 900);
      if (R.mioVoto != null && io >= 0) cartello(S, io, "su", R.mioVoto);
    }
  }

  function disegnaLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🔗", titolo: "Sala d'attesa", sotto: cb.sonoHost ? "Invita gli amici" : "Aspetta l'inizio", indietro: cb.onEsci });
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
    s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
    if (cb.sonoHost && vm.codice && vm.codice !== "…") {
      var link = SG.creaLink({ gioco: "timeline", stanza: vm.codice });
      var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
      s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
        onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
      s._contenuto.appendChild(campo);
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Chi c'è (" + vm.giocatori.length + ")" }));
    var lista = el("div");
    vm.giocatori.forEach(function (g) { lista.appendChild(el("div", { class: "tl-lobby" }, [
      el("span", { class: "fac", html: avatarDi(g) }), el("span", { text: g.nome + (g.id === cb.myId ? " (tu)" : "") })
    ])); });
    s._contenuto.appendChild(lista);
    if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: vm.giocatori.length < 2 ? "Comincia (meglio in 2+)" : "Comincia ▶", onclick: cb.onComincia }));
    else s._piede.appendChild(el("p", { class: "tl-attesa", text: "In attesa che l'host cominci…" }));
    t.mostra(s);
  }

  function schermataNoNet(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato. Da un file locale o da un'anteprima non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  function codiceErrore(e) { var ty = e && e.type; if (ty === "no-mqtt") return "Il collegamento non è disponibile qui."; return "Problema di collegamento. Controlla la connessione e riprova."; }

  SG.registra(gioco);
})();
