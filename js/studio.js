/* =========================================================
   STUDIO DEL GAME SHOW — condiviso dai giochi "Quiz e parole"
   (La linea del tempo, La Patata Bollente, …).
   Un "mondo" grande (studio luminoso, pubblico di mini avatar,
   maxischermo, leggii dei concorrenti) e una telecamera che lo
   inquadra con transform. Ogni gioco ci mette il suo contenuto
   sul maxischermo (S.sch) e fa la sua regia con questi pezzi.
   Regola d'oro per non far laggare: lo sfondo fermo è disegnato
   una volta su canvas; le animazioni muovono solo transform/opacity.
   ========================================================= */
(function () {
  "use strict";

  // ---- suoni del pubblico (applauso, "ohhh", rullo di tamburi, fanfara) ----
  var AC = null;
  function ctx() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; }
  function beep(freqs, dur, tipo) {
    var c = ctx(); if (!c) return;
    try {
      var t0 = c.currentTime;
      freqs.forEach(function (f, i) {
        var o = c.createOscillator(), g = c.createGain(), s = t0 + i * (dur * 0.6);
        o.type = tipo || "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.25, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
        o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + dur);
      });
    } catch (e) {}
  }
  var FX = {
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
  ,
    fanfara: function () { beep([660, 880, 1046, 1318], 0.22, "triangle"); try { if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 200]); } catch (e) {} }
  };
  function rumore(c, dur) {
    var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    return b;
  }

  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  var cacheAv = {};
  var FACCE = { esulta: { occhi: "felici", sopracc: "alzate", bocca: "sorrisone" }, triste: { occhi: "dolci", sopracc: "preoccupate", bocca: "smorfia" },
    pensa: { occhi: "assonnati", sopracc: "alzate", bocca: "neutro" }, paura: { occhi: "grandi", sopracc: "preoccupate", bocca: "nervoso" },
    esploso: { occhi: "chiusi", sopracc: "preoccupate", bocca: "o" } };
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

  function coriandoli() {
    assicuraStileStudio();
    var c = document.createElement("div"); c.className = "st-coriandoli";
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
      // coriandoli, scossa della telecamera
      ".st-coriandoli{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}",
      ".st-coriandoli i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;will-change:transform;animation:stCade 2.6s cubic-bezier(.2,.6,.4,1) forwards}",
      "@keyframes stCade{to{transform:translate(var(--dx),110vh) rotate(var(--r))}}",
      ".st-scena{position:absolute;inset:0}",
      ".st-scena.scossa{animation:stScossa .55s ease-out}",
      "@keyframes stScossa{0%{transform:translate(0,0)}15%{transform:translate(-9px,5px)}30%{transform:translate(8px,-6px)}45%{transform:translate(-6px,-3px)}60%{transform:translate(5px,4px)}80%{transform:translate(-2px,1px)}100%{transform:translate(0,0)}}",
      // leggii toccabili (es. a chi passare la bomba) ed eliminati
      ".st-leggio .anello{position:absolute;z-index:1;left:50%;top:-4%;width:90%;aspect-ratio:1;margin-left:-45%;border-radius:50%;border:.28em solid #6ff0a6;opacity:0;pointer-events:none}",
      ".st-leggio.tocca{cursor:pointer}",
      ".st-leggio.tocca .anello{opacity:1;will-change:transform,opacity;animation:stAnello 1s ease-in-out infinite}",
      "@keyframes stAnello{0%,100%{transform:scale(.92);opacity:.55}50%{transform:scale(1.06);opacity:1}}",
      ".st-leggio.fuori .av canvas{filter:grayscale(1) brightness(.5)}",
      ".st-leggio.fuori .podio{filter:grayscale(.85) brightness(.55)}",
      ".st-leggio.fuori .alone{opacity:0}",
      ".st-leggio .punti.testo{font-size:1.25em;letter-spacing:.02em}",
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
    var vista = el("div", { class: "st-vista" + (LEGGERO ? " st-leggero" : "") }), scena = el("div", { class: "st-scena" }), mondo = el("div", { class: "st-mondo" });
    scena.appendChild(mondo); vista.appendChild(scena);   // la scena serve per far tremare l'inquadratura (scossa) senza toccare la telecamera
    vista.addEventListener("scroll", function () { vista.scrollTop = 0; vista.scrollLeft = 0; });
    var S = { t: t, s: s, vista: vista, scena: scena, mondo: mondo, gioc: [], io: -1, L: [], shot: null, timer: null,
      titolo: opz.titolo || "", logo: opz.logo || [opz.titolo || "GAME SHOW"], onTocca: null };
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
      toR = setTimeout(function () { if (!S.vivo()) return;
        var ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;   // è la tastiera che si apre: non ridisegno lo studio
        if (Math.abs(S.vista.clientWidth - S.VW) < 2 && Math.abs(S.vista.clientHeight - S.VH) < 2) return; layoutStudio(S); camera(S, S.shot(), 0); }, 200);
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
        "<div class='anello'></div><div class='cart'><div class='in'><div class='f'>?</div><div class='f r'></div></div></div><div class='delta'></div><div class='av'><canvas width='356' height='364'></canvas></div>" +
        "<div class='podio'><div class='piano'><span class='buzz'></span></div><div class='fronte'><div class='nome'></div><div class='punti'>0</div></div><div class='led'></div></div>";
      L.querySelector(".nome").textContent = g.nome;
      L.addEventListener("click", function () { if (S.onTocca && L.classList.contains("tocca")) S.onTocca(i); });   // il gioco decide chi si può toccare
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
    var el = S.t.el; vuota(S.sch);
    var logo = el("div", { class: "logo" }); S.logo.forEach(function (r, k) { if (k) logo.appendChild(el("br")); logo.appendChild(document.createTextNode(r)); });
    S.sch.appendChild(el("div", { class: "st-idle" }, [ el("div", { class: "stelle", text: "★ ★ ★" }), logo, el("div", { class: "sotto", text: "il game show" }) ]));
  }

  // ---------- LA REGIA: i momenti dello spettacolo ----------
  async function apertura(S) {
    viaBarra(S); logoSchermo(S);
    await suPubblico(S, 0, 0);
    terzo(S, null, "In diretta dallo studio", S.titolo || "", "📺");
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
  async function finale(S, vinc, sotto) {
    viaBarra(S); fermaTimer(S); logoSchermo(S); cartelliGiu(S);
    await largo(S, 1000);
    terzo(S, null, "Fine della puntata!", "E il vincitore è…", "🏁");
    FX.rullo(1.6);
    await dorme(1800); viaTerzo(S);
    if (vinc >= 0) {
      lampo(S); accendiSolo(S, vinc);
      await suLeggio(S, vinc, 1100);
      faccia(S, vinc, "esulta");
      terzo(S, vinc, (S.gioc[vinc] ? S.gioc[vinc].nome : "") + " vince!", sotto || "", "🏆");
      pubblico(S, "applauso"); coriandoli(); FX.fanfara();
      await dorme(3000); viaTerzo(S);
    }
    await largo(S, 1400); await dorme(700);
  }


  // ---- pezzi in più per i giochi (es. la bomba della Patata) ----
  // scritta libera sul display del leggio (al posto dei punti): es. "IN GARA", "💀 OUT", il countdown
  function testoLeggio(S, i, testo, neg) { var X = S.L[i]; if (!X) return; X.pEl.textContent = testo; X.pEl.classList.add("testo"); X.pEl.classList.toggle("neg", !!neg); }
  // quali leggii si possono toccare (anello verde che pulsa); lista di indici
  function tocca(S, lista) { S.L.forEach(function (X, k) { X.el.classList.toggle("tocca", lista.indexOf(k) >= 0); }); }
  function fuori(S, i, on) { var X = S.L[i]; if (X) X.el.classList.toggle("fuori", !!on); }
  function scossa(S) { var e = S.scena; e.classList.remove("scossa"); void e.offsetWidth; e.classList.add("scossa"); }
  // punto del mondo sopra la testa del concorrente i (per metterci sopra una cosa, es. la bomba)
  function sopraTesta(S, i) { var p = S.posti[i] || S.posti[0]; return { x: p.cx, y: p.top, w: p.w }; }

  window.SGStudio = {
    crea: creaStudio, camera: camera, inquadra: inquadra, suSchermo: suSchermo, largo: largo, suLeggio: suLeggio, suPubblico: suPubblico, panFila: panFila,
    terzo: terzo, viaTerzo: viaTerzo, barra: barra, viaBarra: viaBarra, aspettaTasto: aspettaTasto, lampo: lampo,
    accendi: accendi, accendiSolo: accendiSolo, faccia: faccia, tutteNormali: tutteNormali, puntiLeggio: puntiLeggio,
    cartello: cartello, cartelliGiu: cartelliGiu, pubblico: pubblico, logoSchermo: logoSchermo, fermaTimer: fermaTimer,
    apertura: apertura, stacco: stacco, finale: finale,
    testoLeggio: testoLeggio, tocca: tocca, fuori: fuori, scossa: scossa, sopraTesta: sopraTesta,
    avatarDi: avatarDi, mioAvatar: mioAvatar, avatarValido: avatarValido, coriandoli: coriandoli,
    dorme: dorme, vuota: vuota, durataApertura: durataApertura, STACCO: STACCO, FX: FX, COLORI: ST_COL
  };
})();
