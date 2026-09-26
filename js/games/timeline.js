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
  };

  // lo studio del game show è condiviso con gli altri giochi (js/studio.js)
  var ST = window.SGStudio;
  var creaStudio = ST.crea, camera = ST.camera, suSchermo = ST.suSchermo, largo = ST.largo, suLeggio = ST.suLeggio, panFila = ST.panFila,
    terzo = ST.terzo, viaTerzo = ST.viaTerzo, barra = ST.barra, viaBarra = ST.viaBarra, aspettaTasto = ST.aspettaTasto, lampo = ST.lampo,
    accendiSolo = ST.accendiSolo, faccia = ST.faccia, tutteNormali = ST.tutteNormali, puntiLeggio = ST.puntiLeggio,
    cartello = ST.cartello, cartelliGiu = ST.cartelliGiu, pubblico = ST.pubblico, fermaTimer = ST.fermaTimer,
    apertura = ST.apertura, stacco = ST.stacco, avatarDi = ST.avatarDi, mioAvatar = ST.mioAvatar, avatarValido = ST.avatarValido,
    coriandoli = ST.coriandoli, dorme = ST.dorme, vuota = ST.vuota, durataApertura = ST.durataApertura, STACCO = ST.STACCO;
  FX.applauso = ST.FX.applauso; FX.ohh = ST.FX.ohh; FX.rullo = ST.FX.rullo;
  var OPZ_STUDIO = { titolo: "La linea del tempo", logo: ["LA LINEA", "DEL TEMPO"] };

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
    stato.S = creaStudio(t, stato.giocatori, { io: -1, esci: t.esci, titolo: OPZ_STUDIO.titolo, logo: OPZ_STUDIO.logo });
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
    if (stato.S && stato.S.vivo()) await ST.finale(stato.S, vinc, (cl[0] ? cl[0].punti : 0) + " punti");
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
      REG.S = creaStudio(t, vm.giocatori, { io: idxDi(vm, cb.myId), esci: function () { cb.onEsci(); }, titolo: OPZ_STUDIO.titolo, logo: OPZ_STUDIO.logo });
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
      await ST.finale(S, vinc, (cl[0] ? cl[0].punti : 0) + " punti");
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
