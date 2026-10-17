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
  var RIPRESA = 5000;          // online: l'host ha ricaricato, "Partita ripresa!" e poi si riparte
  var ATTESA_MAX = 90000;      // online: chi deve ancora giocare è senza rete; dopo 90 secondi la partita finisce lì
  // "⚡ Tutti insieme" (online): tutti piazzano la stessa carta nello stesso momento
  var TEMPO_T = 25;            // secondi per piazzarla
  var VELOCE = 50;             // in più al più veloce di chi l'ha messa giusta
  var INTRO_T = 2200;          // "Carta 3 di 10": il tempo parte dopo
  var ESITO_T = 13000;         // il risultato: poi si va avanti da soli (o prima, se più di metà tocca "⏩ Avanti")

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
    ".tl-pl.via{opacity:.45;filter:grayscale(1)}",   // scollegato: grigio finché non torna
    // timer calmo (il risultato: si riparte da soli, niente rosso)
    ".tl-timer.calmo{margin:0}",
    ".tl-timer.calmo .tl-timer-fill,.tl-timer.calmo.poco .tl-timer-fill{background:rgba(255,255,255,.55);box-shadow:none}",
    // voto tutti insieme (sullo stesso telefono): ognuno tocca il suo avatar
    ".tl-gvoto{flex:0 0 auto;margin-bottom:10px;padding:8px 10px 10px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}",
    ".tl-gvoto .tt{font-size:.8rem;font-weight:800;color:var(--testo-tenue);text-align:center;margin-bottom:7px}",
    ".tl-gvoto .gr{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}",
    ".tl-gv{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;border-radius:99px;border:2px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-weight:800;font-size:.85rem;cursor:pointer;max-width:48%}",
    ".tl-gv .av{width:30px;height:30px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.12);flex:0 0 auto}",
    ".tl-gv .av svg{width:100%;height:100%;display:block}",
    ".tl-gv .nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tl-gv .v{font-size:1.05rem;flex:0 0 auto}",
    ".tl-gv.si{border-color:var(--verde);background:rgba(55,212,126,.2)}",
    ".tl-gv.no{border-color:var(--rosso);background:rgba(255,93,108,.2)}",
    ".tl-gv:active{transform:scale(.96)}",
    // tanti giocatori: avatar più piccoli, tre per riga (la linea del tempo resta visibile)
    ".tl-gvoto.molti .tl-gv{max-width:32%;font-size:.75rem;padding:2px 7px 2px 2px;gap:4px}",
    ".tl-gvoto.molti .tl-gv .av{width:24px;height:24px}",
    ".tl-gvoto.molti .tl-gv .v{font-size:.9rem}",
    ".tl-stato{flex:0 0 auto;text-align:center;font-weight:900;font-size:1.05rem;margin:6px 0 4px;letter-spacing:.01em}",
    ".tl-stato small{display:block;font-size:.78rem;font-weight:700;color:var(--testo-tenue);margin-top:1px}",
    ".tl-stato{display:flex;align-items:center;justify-content:center;gap:10px}",
    ".tl-chi{width:44px;height:44px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);box-shadow:0 0 0 2px var(--accento);flex:0 0 auto}",
    ".tl-chi svg,.tl-reaz svg{width:100%;height:100%;display:block}",
    ".tl-reaz-riga{display:flex;align-items:center;gap:12px}",
    ".tl-reaz{width:64px;height:64px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto;animation:tlPop .45s ease 1.15s both}",
    // tempo
    ".tl-timer{flex:0 0 auto;height:6px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin:2px 0 10px;}",
    ".tl-timer-fill{height:100%;width:100%;border-radius:99px;transform-origin:0 50%;will-change:transform;background:linear-gradient(90deg,var(--verde),var(--accento));box-shadow:0 0 10px rgba(255,202,58,.6)}",
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
    ".tl-flip.fatto{perspective:none}",
    ".tl-flip.fatto .tl-flip-in{animation:none;transform:none;transform-style:flat}",
    ".tl-flip.fatto .tl-flip-f{display:none}",
    ".tl-flip.fatto .tl-flip-f.retro{display:flex;transform:none}",
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
    // la classifica finale sta in uno schermo: tanti giocatori = righe in due colonne
    ".tl-fila{display:flex;flex-direction:column;gap:6px}",
    ".tl-fine.molti .tl-fila{display:grid;grid-template-columns:1fr 1fr;gap:5px}",
    ".tl-fine.molti .tl-riga{gap:5px;padding:3px 8px 3px 3px}",
    ".tl-fine.molti .tl-riga .pos{width:auto;font-size:.8rem}",
    ".tl-fine.molti .tl-riga .fac{width:28px;height:28px}",
    ".tl-fine.molti .tl-riga .nm{font-size:.82rem}",
    ".tl-fine.molti .tl-riga .pt{font-size:.82rem}",
    ".tl-fine.molti .tl-podio{margin:2px 0 8px}",
    ".tl-fine.molti .tl-gradino .fac{width:56px;height:56px}.tl-fine.molti .tl-gradino.p1 .fac{width:70px;height:70px}",
    ".tl-fine.molti .tl-gradino.p1 .blocco{height:64px}.tl-fine.molti .tl-gradino.p2 .blocco{height:48px}.tl-fine.molti .tl-gradino.p3 .blocco{height:36px}",
    ".tl-nota-fine{text-align:center;margin:10px 0 0}",
    ".tl-faccine{margin-top:10px}",
    ".tl-lobby{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-radius:14px;background:rgba(255,255,255,.06);margin-bottom:6px;font-weight:800}",
    ".tl-lobby .fac{width:36px;height:36px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
    ".tl-lobby .fac svg{width:100%;height:100%;display:block}",
    // ⚡ tutti insieme: il risultato di tutti (carta più bassa, chi l'ha messa giusta in una griglia che sta nello schermo)
    ".tl-flip.corta{height:150px;margin-top:0}",
    ".tl-flip.corta .grande{font-size:2.8rem}",
    ".tl-esito-t{gap:6px;padding-top:2px}",
    ".tl-esito-t .tl-verdetto{font-size:1.35rem}",
    ".tl-tutti{list-style:none;padding:0;margin:2px auto 0;width:100%;max-width:380px;display:grid;grid-template-columns:1fr;gap:5px;animation:tlPop .4s ease 1.6s both}",
    ".tl-esito-t.molti .tl-tutti{grid-template-columns:1fr 1fr}",
    ".tl-tutti.due{grid-template-columns:1fr 1fr}",
    ".tl-tutti li{display:flex;align-items:center;gap:6px;min-width:0;background:rgba(255,255,255,.07);border-radius:12px;padding:3px 8px 3px 3px;font-weight:700;font-size:.82rem;text-align:left}",
    ".tl-tutti li.si{background:rgba(55,212,126,.16)}",
    ".tl-tutti .av{width:26px;height:26px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
    ".tl-tutti .av svg{width:100%;height:100%;display:block}",
    ".tl-tutti .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tl-tutti .d{flex:0 0 auto;font-weight:900;color:var(--verde)}",
    "@media (prefers-reduced-motion:reduce){.tl-mano,.tl-mano:after{animation:none}}"
  ].join("");
  document.head.appendChild(stile);

  // --- Suoni + vibrazione ---
  var AC = null;
  function ctx() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; }
  function beep(freqs, dur, tipo) {
    var c = ctx(); if (!c) return;
    var t0 = c.currentTime;
    // un suono che non parte non deve mai fermare la partita
    try { freqs.forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = tipo || "sine"; o.frequency.value = f;
      var s = t0 + i * (dur * 0.6);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.25, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + dur);
    }); } catch (e) {}
  }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  // la vibrazione solo quando si tocca per scegliere (il voto), mai da sola
  var FX = {
    giusto: function () { beep([660, 880, 1180], 0.18, "triangle"); },
    sbagliato: function () { beep([180, 120], 0.28, "sawtooth"); },
    turno: function () { beep([880, 1180], 0.12, "sine"); },
    voto: function () { beep([520], 0.1, "square"); vibra(30); },
    tic: function () { beep([1200], 0.05, "sine"); },
    vittoria: function () { beep([660, 880, 1046, 1318], 0.22, "triangle"); },
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
  // trofeo "tutte e 5 le categorie": le 5 storiche (le categorie nuove non lo rendono più difficile)
  var CINQUE = ["storia", "invenzioni", "calcio", "rap", "cinema"];
  function tutteLeCategorie(imp) {
    var scelte = imp && imp.categorie;
    return !scelte || CINQUE.every(function (id) { return scelte.indexOf(id) >= 0; });
  }
  function quanteCategorie(imp) {
    var cats = window.SG_CATEGORIE || [], scelte = imp && imp.categorie;
    var n = cats.filter(function (c) { return !scelte || scelte.indexOf(c.id) >= 0; }).length;
    return n || cats.length;
  }
  // carte a testa: se il mazzo non basta per tutti, meno carte (sempre uguali per tutti)
  function carteGiuste(carte, mazzo, n) { return Math.max(1, Math.min(carte, Math.floor((mazzo - 1) / Math.max(1, n)))); }
  // "⚡ Tutti insieme": le carte sono in comune (una per giro), basta che il mazzo ne abbia abbastanza
  function carteInsieme(carte, mazzo) { return Math.max(1, Math.min(carte, mazzo - 1)); }

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
  function fmtN(n) { n = Math.round(n || 0); return (n < 0 ? "−" : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }   // 1.000
  function gapGiusto(linea, gap, Y) {
    return ((gap === 0) || (linea[gap - 1].anno <= Y)) && ((gap === linea.length) || (Y <= linea[gap].anno));
  }

  // ---- Colori e icone delle categorie, avatar dei giocatori ----
  var COL_CAT = { storia: ["#f2a93b", "#9a560b"], calcio: ["#2fc071", "#0f6a3d"], cinema: ["#ff5b73", "#8e1c3c"],
    invenzioni: ["#48a2ff", "#1d4e9e"], rap: ["#c56bff", "#5b1f8d"],
    musica: ["#ff8a3d", "#a8410c"], tv: ["#36d1c4", "#0d6e66"], giochi: ["#9fd83a", "#41700c"], sport: ["#ff6fb5", "#8a1658"], italia: ["#e8484f", "#1f7a3c"] };
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
      el("div", { class: "tit", text: carta.titolo })   // la spiegazione si legge solo dopo il risultato (a volte suggerisce la data)
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
      top.appendChild(el("div", { class: "tl-pl" + (g._me ? " me" : "") + (turno ? " turno" : "") + (g.via ? " via" : "") }, [
        el("span", { class: "av", html: avatarDi(g) }),
        el("div", {}, [ el("div", { class: "n", text: (g.via ? "💤 " : "") + g.nome }), el("div", { class: "p", text: fmtN(g.punti) }) ])
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
    // la barra si accorcia con una scala: la muove la scheda grafica, niente ridisegni a ogni fotogramma (neanche mentre la telecamera si muove)
    fill.style.transform = "scaleX(" + frac.toFixed(4) + ")";
    var anim = null;
    try { if (fill.animate && rimastiMs > 0) anim = fill.animate([{ transform: "scaleX(" + frac.toFixed(4) + ")" }, { transform: "scaleX(0)" }], { duration: rimastiMs, easing: "linear", fill: "forwards" }); } catch (e) {}
    // gli ultimi 8 secondi la barra diventa rossa
    var toPoco = rimastiMs > 8000 ? setTimeout(function () { wrap.classList.add("poco"); }, rimastiMs - 8000) : null;
    if (onScaduto && rimastiMs > 0) wrap._to = setTimeout(onScaduto, rimastiMs);
    else if (onScaduto) onScaduto();
    wrap._stop = function () { if (wrap._to) clearTimeout(wrap._to); if (toPoco) clearTimeout(toPoco); if (anim) try { anim.pause(); } catch (e) {} };
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
  // opz (online): { online: true, testoRigioca, nota (per chi non è l'host), esci (chiude anche il collegamento) }
  // Online niente "Cambia gioco" e "La sala" (portano alle schermate dello stesso telefono): l'host ha "Nuova partita
  // (stessi amici)", gli altri aspettano l'host; tutti hanno la fila delle faccine.
  var notaFine = null, NOTA_CHIUSA = "🚪 L'host ha chiuso la stanza.";
  function schermataFine(t, classifica, rigioca, opz) {
    var el = t.el; opz = opz || {};
    var esci = opz.esci || t.esci;
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: gioco.nome });
    s.classList.add("tl-fine");
    if (classifica.length > 6) s.classList.add("molti");
    var podio = el("div", { class: "tl-podio" }), MED = ["🥇", "🥈", "🥉"];
    [1, 0, 2].forEach(function (p) {
      var r = classifica[p]; if (!r) return;
      var g = el("div", { class: "tl-gradino p" + (p + 1) }, [
        el("div", { class: "fac", html: avatarDi(r) }),
        el("div", { class: "nm", text: r.nome }),
        el("div", { class: "pt", text: fmtN(r.punti) + " punti" }),
        el("div", { class: "blocco", text: MED[(r.pos || p + 1) - 1] || MED[p] })   // pari merito: stessa medaglia
      ]);
      g.style.animationDelay = ([0.3, 0.15, 0.45][p]) + "s";
      podio.appendChild(g);
    });
    s._contenuto.appendChild(podio);
    var box = el("div", { class: "tl-fila" });
    classifica.forEach(function (r, i) {
      if (i < 3) return;   // i primi tre sono già sul podio
      var riga = el("div", { class: "tl-riga" }, [
        el("span", { class: "pos", text: (r.pos || i + 1) + "°" }),
        el("span", { class: "fac", html: avatarDi(r) }),
        el("span", { class: "nm", text: r.nome }),
        el("span", { class: "pt", text: fmtN(r.punti) })
      ]);
      riga.style.animationDelay = (0.5 + i * 0.08) + "s";
      box.appendChild(riga);
    });
    if (box.childNodes.length) s._contenuto.appendChild(box);
    notaFine = null;
    // online: i tasti di fine uguali per tutti (opz.tf), se li disegna il core: allora niente tasti nostri né "Aspetta l'host"
    // (la nota resta nascosta: serve solo se l'host chiude la stanza)
    var comuni = !!(opz.online && opz.tf && t.tastiFine && t.tastiFine(s._piede, opz.tf));
    var testoNota = comuni ? (opz.chiusa ? NOTA_CHIUSA : "") : opz.nota;
    if (testoNota || (comuni && !opz.tf.host)) s._contenuto.appendChild(notaFine = el("p", { class: "modulo-nota tl-nota-fine", text: testoNota || "" }));
    if (notaFine && !testoNota) notaFine.hidden = true;
    var fa = opz.online && t.faccine ? t.faccine() : null;   // online: le faccine, mentre si guarda la classifica
    if (fa) { fa.classList.add("tl-faccine"); s._contenuto.appendChild(fa); }
    FX.vittoria(); setTimeout(coriandoli, 300);
    if (comuni) { t.mostra(s); return; }
    if (rigioca) s._piede.appendChild(el("button", { class: "btn btn-primario", text: opz.testoRigioca || "↻ Rigioca", onclick: rigioca }));
    if (opz.online) {
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: function () { esci(); } }));
    } else {
      var azioni = el("div", { class: "home-azioni" });
      azioni.appendChild(el("button", { class: "azione", text: "🎮 Cambia gioco", onclick: function () { SG.cambiaGioco(); } }));
      azioni.appendChild(el("button", { class: "azione", text: "👥 La sala", onclick: function () { SG.sala(); } }));
      azioni.appendChild(el("button", { class: "azione", text: "🏠 Home", onclick: function () { esci(); } }));
      s._piede.appendChild(azioni);
    }
    t.mostra(s);
  }



  // ---------- il gioco sul maxischermo ----------
  // o: { giocatori, turnoId, stato, sotto, rimMs, onScaduto, carta, linea, scegli, sel, tent, nuovo, chiave }
  function schermoGioco(S, o) {
    var el = S.t.el, sch = S.sch;
    fermaTimer(S); vuota(sch);
    sch.appendChild(nodoTop(el, o.giocatori, o.turnoId));
    sch.appendChild(el("div", { class: "tl-stato" }, [ el("div", {}, [ el("span", { text: o.stato }), o.sotto ? el("small", { text: o.sotto }) : null ]) ]));
    if (o.rimMs != null) { var tot = o.totMs || TEMPO * 1000; S.timer = barraTimer(el, Math.min(tot, Math.max(0, o.rimMs)), tot, o.onScaduto || null); sch.appendChild(S.timer); }
    sch.appendChild(o.pannello || nodoCartaMano(el, o.carta || { titolo: "" }));   // pannello: al posto della carta (il voto tutti insieme)
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
  // voto tutti insieme sullo stesso telefono: ognuno tocca il suo avatar (❔ → 👍 → 👎); risolve con { indice: true/false }
  function votaTuttiInsieme(S, o) {
    return new Promise(function (fine) {
      var el = S.t.el, voti = {}, quanti = 0;
      var fatto = el("button", { class: "btn btn-primario", text: "Nessun voto: avanti ▶", onclick: function () { viaBarra(S); fine(voti); } });
      var gr = el("div", { class: "gr" });
      o.votanti.forEach(function (vi) {
        var g = o.giocatori[vi], seg = el("span", { class: "v", text: "❔" });
        var b = el("button", { class: "tl-gv" }, [ el("span", { class: "av", html: avatarDi(g) }), el("span", { class: "nm", text: g.nome }), seg ]);
        b.addEventListener("click", function () {
          var v = voti[vi], nuovo = v == null ? true : (v === true ? false : null);   // ❔ → 👍 → 👎 → ❔
          if (nuovo == null) delete voti[vi]; else voti[vi] = nuovo;
          seg.textContent = nuovo == null ? "❔" : (nuovo ? "👍" : "👎");
          b.className = "tl-gv" + (nuovo == null ? "" : (nuovo ? " si" : " no"));
          FX.voto();
          quanti = Object.keys(voti).length;
          fatto.textContent = quanti === o.votanti.length ? "✅ Abbiamo votato tutti" : (quanti ? "✅ Fatto (" + quanti + " su " + o.votanti.length + ")" : "Nessun voto: avanti ▶");
        });
        gr.appendChild(b);
      });
      var pann = el("div", { class: "tl-gvoto" + (o.votanti.length > 4 ? " molti" : "") }, [ el("div", { class: "tt", text: "Toccate il vostro avatar: 👍 giusto, 👎 sbagliato" }), gr ]);
      schermoGioco(S, { giocatori: o.giocatori, turnoId: o.turnoId, stato: "Siete d'accordo?", sotto: o.chi + " l'ha messa qui",
        carta: o.carta, linea: o.linea, tent: o.gap, pannello: pann, chiave: "locg|" + chiaveCarta(o.carta) });
      barra(S, [fatto]);
    });
  }

  // R = { gi, es: { giusto, anno, titolo, fatto, cat, scaduto, finito, nome }, voti: [{ i, d, giusto, delta }], dopo: [punti per indice] }
  async function rivelazione(S, R) {
    var el = S.t.el, es = R.es, ok = !!es.giusto;
    viaBarra(S); fermaTimer(S);
    await suSchermo(S, 700);
    vuota(S.sch);
    S.sch.appendChild(ST.raggi(S, !ok));
    S.sch.appendChild(nodoEsito(el, { giusto: ok, anno: es.anno, titolo: es.titolo, fatto: es.fatto, cat: es.cat, nome: es.nome, scaduto: es.scaduto, finito: es.finito }, null));
    FX.rullo(1.2);
    setTimeout(function () { ok ? FX.giusto() : FX.sbagliato(); }, 1300);
    await dorme(2300);
    if (!S.vivo()) return;
    var fl = S.sch.querySelector(".tl-flip"); if (fl) fl.classList.add("fatto");   // carta girata: da qui in poi è piatta (niente 3D mentre la telecamera si muove)
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
    riprende: true,   // se l'host ricarica a metà partita, la partita riprende da dove era (il core lo dice agli amici)
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    nome: "La linea del tempo",
    icona: "📜",
    descrizione: "Metti gli avvenimenti nell'ordine giusto e sfida gli amici a punti.",
    giocatoriMin: 1,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono, uno alla volta", amici: true }],
    giocatoriMax: MAX_GIOCATORI,
    postiOnline: MAX_GIOCATORI,   // posti online (10)
    // le regole in una riga, per la saletta: "5 carte a testa · Storia, Cinema" (o "· tutte le categorie")
    riassunto: function (imp) {
      imp = imp || {};
      var cats = window.SG_CATEGORIE || [], scelte = imp.categorie;
      var nomi = cats.filter(function (c) { return !scelte || scelte.indexOf(c.id) >= 0; }).map(function (c) { return c.nome; });
      var testo = imp.gara === "insieme" ? "⚡ Tutti insieme · " + (imp.carte || 10) + " carte" : (imp.carte || 5) + " carte a testa";
      if (tutteLeCategorie(imp) || !nomi.length) return testo + " · tutte le categorie";
      return testo + " · " + (nomi.length > 3 ? nomi.slice(0, 3).join(", ") + " e altre " + (nomi.length - 3) : nomi.join(", "));
    },
    difficolta: 2,   // Media — quanto vale vincerlo nel torneo (1 facile, 2 media, 3 difficile)

    regole: [
      "Al tuo turno esce un avvenimento <b>senza data</b>: hai <b>30 secondi</b> per decidere dove va nella linea del tempo.",
      "Se indovini vinci <b>100 punti</b> e la carta entra nella linea. Se sbagli <b>perdi 100 punti</b> e la carta sparisce (la data resta segreta).",
      "Quando scegli, gli altri vedono il punto e <b>votano</b> se sono d'accordo. Chi vota giusto prende <b>50 punti</b>, chi sbaglia ne perde 50.",
      "Sullo stesso telefono si vota <b>tutti insieme</b> (ognuno tocca il suo avatar), <b>uno alla volta</b> o anche <b>senza voti</b>: si sceglie prima di cominciare.",
      "La <b>classifica</b> è sempre in alto. Vince chi ha più punti quando tutti hanno finito le carte.",
      "Online c'è anche <b>⚡ Tutti insieme</b>: esce una carta e la piazzate <b>tutti nello stesso momento</b>, ognuno dal suo telefono (" + TEMPO_T + " secondi). Chi la mette giusta prende <b>100 punti</b>, il più veloce dei giusti <b>50 in più</b>; chi sbaglia non perde niente. Poi la carta entra nella linea per tutti. L'<b>ultima carta vale doppio</b>!"
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      var categorie = window.SG_CATEGORIE || [];
      var link = SG.parametriLink();

      dove.modo = "telefono";
      var dopoModo = null;   // (la scelta "a turno / tutti insieme" si vede solo online)
      if (aiuti.modo) dove.modo = aiuti.modo;   // come giocare l'avete già scelto prima
      else if (!aiuti.torneo) {
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      var bTel, bOnl;
      function scegliModo(m) {
        dove.modo = m;
        bTel.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        notaOnline.hidden = (m !== "online");
        if (dopoModo) dopoModo(m);
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
      var notaCat = el("div", { class: "link-avviso", hidden: "hidden", text: "Serve almeno una categoria: scegline un'altra prima di togliere questa." });
      categorie.forEach(function (c) {
        var chip = el("button", { class: "cat-chip" + (dove.categorie.indexOf(c.id) >= 0 ? " attiva" : ""),
          onclick: function () {
            var i = dove.categorie.indexOf(c.id);
            if (i >= 0 && dove.categorie.length === 1) { notaCat.hidden = false; return; }   // l'ultima non si toglie
            notaCat.hidden = true;
            if (i >= 0) dove.categorie.splice(i, 1); else dove.categorie.push(c.id);
            chip.className = "cat-chip" + (dove.categorie.indexOf(c.id) >= 0 ? " attiva" : "");
          } }, [ el("span", { class: "ci", text: c.icona || "🎲" }), el("span", { text: c.nome }), el("span", { class: "spunta", text: "✓" }) ]);
        griglia.appendChild(chip);
      });
      box.appendChild(griglia);
      box.appendChild(notaCat);

      // online: a turno (uno piazza, gli altri votano) o tutti insieme (la stessa carta per tutti, nessuno aspetta)
      dove.gara = "turno";
      var garaBox = el("div");
      garaBox.hidden = dove.modo !== "online";
      garaBox.appendChild(el("div", { class: "etichetta", text: "Come si gioca online" }));
      var mg = el("div", { class: "modo-griglia" });
      [["turno", "🎯", "A turno", "Uno piazza, gli altri votano"],
       ["insieme", "⚡", "Tutti insieme", "La stessa carta per tutti: nessuno aspetta"]].forEach(function (o) {
        var b = el("button", { class: "modo-chip" + (o[0] === dove.gara ? " attiva" : ""), onclick: function () {
          if (dove.gara === o[0]) return;
          dove.gara = o[0]; [].forEach.call(mg.children, function (x) { x.className = "modo-chip"; }); b.className = "modo-chip attiva";
          // le carte: "a testa" (3-8) a turno, "in tutto" (5-15) tutti insieme
          if (o[0] === "insieme" && dove.carte === 5) dove.carte = 10;
          else if (o[0] === "turno" && dove.carte === 10) dove.carte = 5;
          agg(0);
        } }, [ el("span", { class: "mi", text: o[1] }), el("div", {}, [ el("div", { class: "mt", text: o[2] }), el("div", { class: "ms", text: o[3] }) ]) ]);
        mg.appendChild(b);
      });
      garaBox.appendChild(mg);
      box.appendChild(garaBox);
      dopoModo = function (m) { garaBox.hidden = m !== "online"; if (m !== "online" && dove.gara !== "turno") mg.children[0].click(); };

      dove.carte = link.carte ? Math.max(3, Math.min(8, link.carte)) : 5;
      var etCarte = el("div", { class: "etichetta", text: "Carte da piazzare a testa" });
      box.appendChild(etCarte);
      var valore = el("span", { class: "valore", text: dove.carte });
      function limiti() { return dove.gara === "insieme" ? [5, 15] : [3, 8]; }
      function agg(d) {
        var lm = limiti(); dove.carte = Math.max(lm[0], Math.min(lm[1], dove.carte + d)); valore.textContent = dove.carte;
        var et = dove.gara === "insieme" ? "Carte in tutto (le giocate tutti)" : "Carte da piazzare a testa";
        if (etCarte.textContent !== et) etCarte.textContent = et;
      }
      box.appendChild(el("div", { class: "stepper" }, [
        el("button", { text: "−", onclick: function () { agg(-1); } }), valore,
        el("button", { text: "+", onclick: function () { agg(1); } }) ]));

      // sullo stesso telefono: come votano gli altri (online ognuno vota dal suo telefono)
      if (dove.modo !== "online") {
        dove.voti = "insieme";
        box.appendChild(el("div", { class: "etichetta", text: "Come votano gli altri" }));
        var mv = el("div", { class: "modo-griglia" });
        [["insieme", "👥", "Tutti insieme", "Ognuno tocca il suo avatar: veloce"],
         ["turno", "🤫", "Uno alla volta", "Voto segreto: si passa il telefono"],
         ["no", "🚫", "Senza voti", "Gioca solo chi ha la carta"]].forEach(function (o) {
          var b = el("button", { class: "modo-chip" + (o[0] === dove.voti ? " attiva" : ""), onclick: function () {
            dove.voti = o[0]; [].forEach.call(mv.children, function (x) { x.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [ el("span", { class: "mi", text: o[1] }), el("div", {}, [ el("div", { class: "mt", text: o[2] }), el("div", { class: "ms", text: o[3] }) ]) ]);
          mv.appendChild(b);
        });
        box.appendChild(mv);
      }
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
    var carte = carteGiuste((t.impostazioni && t.impostazioni.carte) || 5, mazzo.length, t.giocatori.length);
    var stato = {
      mazzo: mazzo, linea: [mazzo.pop()], turno: 0, carta: null, voti: (t.impostazioni && t.impostazioni.voti) || "insieme",
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
  // chi gioca ancora: ha carte e non è scollegato (online)
  function attivi(stato) { var n = 0; stato.giocatori.forEach(function (g) { if (g.restano > 0 && !g.via) n++; }); return n; }
  function saltaFiniti(stato) { var giri = 0, N = stato.giocatori.length; while (N && giri < N && (stato.giocatori[stato.turno % N].restano <= 0 || stato.giocatori[stato.turno % N].via)) { stato.turno++; giri++; } }

  async function turnoTel(t, stato) {
    var S = stato.S;
    if (!S.vivo()) return;
    if (attivi(stato) === 0 || stato.mazzo.length === 0) return fineTel(t, stato);
    saltaFiniti(stato);
    var N = stato.giocatori.length, gi = stato.turno % N, g = stato.giocatori[gi], uno = N === 1;
    var carta = stato.carta = stato.mazzo.pop();
    stato.giocatori.forEach(function (x) { delete x._voto; });
    // 1) stacco su chi gioca (e il telefono passa a lui)
    ST.logoSchermo(S);   // fra un turno e l'altro sul maxischermo torna il logo
    await stacco(S, gi, uno ? "Dove va questa carta?" : "Passa il telefono a " + g.nome);
    if (!uno) await aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶");
    if (!S.vivo()) return;
    FX.turno();
    // 2) si gioca sul maxischermo
    await suSchermo(S, 900);
    var gap = await scegliSulloSchermo(S, { giocatori: stato.giocatori, turnoId: g.nome, nome: g.nome, carta: carta, linea: stato.linea, nuovo: stato._nuovo });
    stato._nuovo = null;
    if (!S.vivo()) return;
    // 3) votano gli altri: tutti insieme (ognuno tocca il suo avatar) o uno alla volta col telefono in mano (cartellino coperto)
    var votanti = [];
    if (gap != null && stato.voti !== "no") stato.giocatori.forEach(function (x, i) { if (i !== gi) votanti.push(i); });
    if (votanti.length && stato.voti === "turno") {
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
    } else if (votanti.length) {
      var vv = await votaTuttiInsieme(S, { giocatori: stato.giocatori, votanti: votanti, turnoId: g.nome, chi: g.nome, carta: carta, linea: stato.linea, gap: gap });
      if (!S.vivo()) return;
      votanti.forEach(function (i) { if (vv[i] != null) { stato.giocatori[i]._voto = vv[i]; cartello(S, i, "su", vv[i]); } });
    }
    if (stato.giocatori.some(function (x) { return x._voto != null; })) { accendiSolo(S, -1); await largo(S, 900); terzo(S, null, "Tutti hanno votato!", "Vediamo chi ha ragione…", "🗳️"); await dorme(1500); viaTerzo(S); }
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
  // classifica coi posti: stessi punti = stesso posto (serve anche al torneo)
  function classificaPunti(giocatori) {
    var ord = giocatori.slice().sort(function (a, b) { return b.punti - a.punti; });
    return ord.map(function (g) {
      return { id: g.id, nome: g.nome, punti: g.punti, omino: g.omino || null, pos: 1 + ord.filter(function (q) { return q.punti > g.punti; }).length };
    });
  }
  async function fineTel(t, stato) {
    var cl = classificaPunti(stato.giocatori), io = stato.giocatori[stato._io];
    if (io) tFine(stato._T, cl, function (r) { return r.nome === io.nome; }, io.restano === 0);
    var vinc = -1; stato.giocatori.forEach(function (g, i) { if (vinc < 0 && cl[0] && g.nome === cl[0].nome) vinc = i; });
    if (stato.S && stato.S.vivo()) await ST.finale(stato.S, vinc, fmtN(cl[0] ? cl[0].punti : 0) + " punti");
    if (stato.S && !stato.S.vivo()) return;
    schermataFine(t, cl, function () { partenzaTelefono(t); });
  }

  // =========================================================
  //  MODALITÀ ONLINE (host-authoritative, con votazione)
  // =========================================================
  function indexById(st, id) { for (var i = 0; i < st.giocatori.length; i++) if (st.giocatori[i].id === id) return i; return -1; }
  function trovaG(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return vm.giocatori[i]; return null; }
  // quanto dura il risultato prima di ripartire da soli: la rivelazione (più lunga se ci sono voti) e qualche secondo per leggere
  function durataEsito(nVoti, finito, nGioc) {
    return 5600 + (nVoti ? (nGioc > 4 ? 8000 : 2600 + 420 * nVoti) : 0) + (finito && nGioc > 1 ? 1600 : 0) + 6000;
  }
  function vmDa(st) {
    var g = st.giocatori, c = g.length ? g[st.turno % g.length] : null;
    return {
      fase: st.fase, codice: st.codice, pronta: !!st.pronta, n: st.n, partita: st.partita,
      // il tempo che resta (non l'ora dell'host: gli orologi dei telefoni possono essere diversi)
      resta: st.scadenza ? Math.max(0, st.scadenza - Date.now()) : null, durata: st.durata || null,
      scelta: st.scelta != null ? st.scelta : null,
      giocatori: g.map(function (x) { return { id: x.id, nome: x.nome, restano: x.restano, punti: x.punti, omino: x.omino || null, via: !!x.via }; }),
      turnoId: c ? c.id : null, turnoNome: c ? c.nome : "",
      linea: st.linea.map(function (e) { return { anno: e.anno, titolo: e.titolo, fatto: e.fatto || "", cat: e._cat }; }),
      carta: st.carta ? { titolo: st.carta.titolo, cat: st.carta._cat } : null,   // la spiegazione no: si vede nel risultato
      hannoVotato: Object.keys(st.voti || {}), esito: st.esito || null, classifica: st.classifica || null,
      guarda: (st.guarda || []).slice(),   // nella Sala: chi questa volta guarda soltanto
      // "⚡ Tutti insieme": la carta numero giro (di carte); chi ha già scelto (SOLO gli id: dove l'ha messa resta segreto
      // fino al risultato), il risultato di tutti e chi ha già toccato "⏩ Avanti"
      insieme: !!st.insieme, giro: st.giro || 0, hannoScelto: Object.keys(st.mosse || {}),
      esitoT: st.esitoT || null, avanti: Object.keys(st.avanti || {}),
      // servono agli ospiti per i trofei e alla saletta (in saletta: le carte vere, se il mazzo non basta per tutti)
      carte: st.iniziata ? st.carte : (st.insieme ? carteInsieme(st.carte, st.mazzo.length) : carteGiuste(st.carte, st.mazzo.length, g.length)), tutteCat: st.tutteCat, nCat: st.nCat
    };
  }

  // ---- la partita dell'host si ricorda col modo comune (t.ricorda / t.ripresa): se ricarica la pagina la riprende ----
  // (il mazzo si ricorda come chiavi delle carte e si rifà alla ripresa)
  function chiaveEv(e) { return (e._cat || "") + "|" + e.titolo; }
  // (il mazzo si ricorda come numeri: il posto della carta nell'elenco di tutte le carte, uguale su ogni telefono.
  // Così la copia per l'host di riserva resta piccola: con le chiavi intere erano più di 60 KB)
  function rifaiMazzo(chiavi) {
    var lista = pescaDati(null), tutte = {}; lista.forEach(function (e) { tutte[chiaveEv(e)] = e; });
    return (chiavi || []).map(function (k) { return typeof k === "number" ? lista[k] : tutte[k]; }).filter(Boolean);
  }
  var POS_CARTE = null, POS_N = -1;
  function mazzoInNumeri(mazzo) {
    var n = 0; (window.SG_CATEGORIE || []).forEach(function (c) { n += (c.eventi || []).length; });
    if (!POS_CARTE || POS_N !== n) { POS_CARTE = {}; POS_N = n; pescaDati(null).forEach(function (e, i) { POS_CARTE[chiaveEv(e)] = i; }); }
    var pos = POS_CARTE;
    return mazzo.map(function (e) { return pos[chiaveEv(e)]; }).filter(function (n) { return n != null; });
  }
  function idPartita() { return Math.random().toString(36).slice(2, 8); }

  // la partita lasciata a metà (pagina ricaricata, app chiusa) riparte da sola quando l'app riapre la STESSA stanza
  // (lo fa il core, con lo stesso codice, e la passa in t.ripresa): punti, linea e carte restano, gli amici rientrano da soli.
  function hostCrea(t) {
    if (!(window.SGNet && SGNet.disponibile())) return schermataNoNet(t);
    try { localStorage.removeItem("sg-tl-host"); } catch (e) {}   // (il salvataggio di prima, fatto in casa: non serve più)
    var R0 = t.ripresa && t.ripresa.stato;
    hostAvvia(t, R0 && R0.st ? { st: R0.st, T: R0.T || null } : null);
  }
  function hostAvvia(t, sv) {
    REG = null;
    var IO = t.mioId || "host";   // io che tengo la partita ("host", o l'amico che ha preso il posto dell'host)
    var carte = (t.impostazioni && t.impostazioni.carte) || 5, imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || "Host";
    var st = {
      mazzo: mischiaArr(pescaDati(imp)), linea: [], turno: 0, n: 0, carta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, carte: carte, codice: "…", scelta: null, voti: {}, scadenza: null, durata: null, _to: null,
      tutteCat: tutteLeCategorie(imp), nCat: quanteCategorie(imp), T: null, partita: idPartita(), pronta: false,
      insieme: imp.gara === "insieme", giro: 0, mosse: {}, avanti: {}, esitoT: null, inizio: 0,   // "⚡ Tutti insieme"
      giocatori: [{ id: IO, nome: nomeHost, restano: carte, punti: 0, omino: mioAvatar(nomeHost) }],
      guarda: []   // nella Sala: chi non è stato scelto per giocare (guarda soltanto; con l'id, così sa di essere entrato)
    };
    function corr() { return st.giocatori[st.turno % st.giocatori.length]; }
    function gDi(id) { var i = indexById(st, id); return i >= 0 ? st.giocatori[i] : null; }
    function clearTo() { if (st._to) { clearTimeout(st._to); st._to = null; } }
    function arma(ms, fn) { clearTo(); st.durata = ms; st.scadenza = Date.now() + ms; st._to = setTimeout(fn, ms); }
    var visti = {};   // chi è arrivato a partita cominciata (gli rimando la foto una volta)
    // "⚙️ Regole" in saletta: categorie e carte a testa nuove (il mazzo si rifà con le categorie scelte)
    t.onRegole = function (im) {
      if (st.iniziata) return;
      imp = im || {};
      st.insieme = imp.gara === "insieme";
      st.carte = imp.carte || (st.insieme ? 10 : 5); st.mazzo = mischiaArr(pescaDati(imp)); st.tutteCat = tutteLeCategorie(imp); st.nCat = quanteCategorie(imp);
      st.giocatori.forEach(function (g) { g.restano = st.carte; });
      bd();
    };

    // la partita di prima (t.ripresa): si riprende anche sulla classifica finale (gli XP non si ridanno: lo controlla il core)
    var ripresa = !!(sv && sv.st && sv.st.fase !== "lobby");
    var rete = SGNet.ospita("timeline", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        var kG = st.guarda.indexOf(id); if (kG >= 0) { st.guarda.splice(kG, 1); bd(); return; }
        var g = gDi(id); if (!g) return;
        // nella saletta si toglie e basta; a partita iniziata resta al suo posto (grigio): se torna riprende con punti e carte
        if (!st.iniziata) { st.giocatori.splice(indexById(st, id), 1); bd(); return; }
        if (g.via || g.id === IO) return;
        g.via = true; delete st.voti[id];
        dopoUscita(id);
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        var g = gDi(id);
        if (m.t === "join") {
          if (g) { torna(g); return; }   // c'era già (rientra, o si ricollega): stesso posto, rimando la foto
          var nomeJ = String(m.nome || "Amico").slice(0, 16);
          // nella Sala gioca solo chi è stato scelto: gli altri guardano (il loro id nella foto: sanno di essere entrati)
          if (st.guarda.indexOf(id) >= 0 || (t.puoSedersi && !t.puoSedersi(id, nomeJ))) {
            if (st.guarda.indexOf(id) < 0) st.guarda.push(id);
            bd(); return;
          }
          if (!st.iniziata && st.giocatori.length < MAX_GIOCATORI) {
            st.giocatori.push({ id: id, nome: nomeJ, restano: st.carte, punti: 0, omino: avatarValido(m.omino) });
            bd(); return;
          }
          // partita già cominciata: guarda (la foto la riceve come tutti) ed entra alla prossima. Niente messaggio col suo
          // codice, se no il collegamento lo crede "dentro" e non gli dice "👀 Partita in corso: entri alla prossima"
          if (st.iniziata) { if (!visti[id]) { visti[id] = 1; invia(); } return; }
          rete.inviaVeloce({ t: "pieno", to: id, vm: vmDa(st) });   // stanza piena: glielo dico una volta sola
          return;
        }
        if (!g) return;
        if (g.via) torna(g);   // si è rifatto vivo
        if (m.n != null && m.n !== st.n) return;   // mossa di un turno vecchio (arrivata in ritardo): non vale
        if (m.t === "scelta") scelta(id, m.gap);
        else if (m.t === "voto") voto(id, m.d);
        else if (m.t === "posa") posa(id, m.gap);
        else if (m.t === "avanti") { if (st.insieme) avantiT(id); else if (st.fase === "esito" && corr().id === id) prossimo(); }
      },
      // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
      onErrore: function (e) { clearTo(); t.ricorda(null); schermataErrore(t, "Non riesco ad aprire la stanza. " + codiceErrore(e)); }
    }, { ripresa: ripresa });   // (gli amici non tornano in saletta: la partita riprende)
    if (!rete) return schermataNoNet(t);
    // la stanza riaperta è quella della partita ricordata: la partita riprende da dove era
    if (ripresa) {
      var o = sv.st;
      ["linea", "turno", "n", "carta", "esito", "fase", "carte", "scelta", "voti", "tutteCat", "nCat", "giocatori", "partita", "riprEsito",
       "insieme", "giro", "mosse", "avanti", "esitoT", "classifica"].forEach(function (k) { if (o[k] !== undefined) st[k] = o[k]; });
      st.mazzo = rifaiMazzo(o.mazzo); st.iniziata = true; st.codice = rete.codice || st.codice; st.T = sv.T || null;
      // ho preso il posto dell'host sparito (host di riserva): i trofei sono i miei (quelli contati da ospite), non i suoi
      if (t.ripresa && t.ripresa.daRiserva) st.T = caricaT(chiaveT(st.codice, st, IO)) || creaTraccia({ online: true, carte: st.carte, tutteCat: st.tutteCat });
      st.giocatori.forEach(function (g) { if (g.id !== IO) g.via = true; });   // gli amici tornano "dentro" appena si rifanno vivi
      if (st.fase !== "fine") riprendi();   // (sulla classifica finale si resta lì)
    }
    function invia() { rete.invia({ t: "vm", vm: vmDa(st) }); }
    function bd() { invia(); salva(); disegna(); vici(); }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda (non gioca: non ha niente da perdere)
    var viciK = "";
    function vici() {
      var l = st.guarda.concat(Object.keys(visti).filter(function (id) { return !gDi(id); })), k = l.join(",");
      if (k !== viciK && t.vici) { viciK = k; t.vici(l.length ? l : null); }
    }
    // la partita com'è adesso, per riprenderla (niente in saletta: lì non c'è niente da riprendere)
    function salva() {
      if (!st.iniziata || st.fase === "lobby") return t.ricorda(null);
      t.ricorda({ T: st.T, st: {
        linea: st.linea, turno: st.turno, n: st.n, carta: st.carta, esito: st.esito, fase: st.fase, carte: st.carte, scelta: st.scelta,
        voti: st.voti, tutteCat: st.tutteCat, nCat: st.nCat, partita: st.partita, riprEsito: !!st.riprEsito, mazzo: mazzoInNumeri(st.mazzo),
        insieme: !!st.insieme, giro: st.giro || 0, mosse: st.mosse || {}, avanti: st.avanti || {}, esitoT: st.esitoT || null, classifica: st.classifica || null,
        giocatori: st.giocatori.map(function (g) { return { id: g.id, nome: g.nome, restano: g.restano, punti: g.punti, omino: g.omino || null, via: !!g.via }; }) } });
    }

    // qualcuno è sparito: se toccava a lui si passa al prossimo (la carta torna nel mazzo), se votava non lo si aspetta
    function dopoUscita(id) {
      if (st.insieme) { delete st.avanti[id]; verificaTutti(); verificaAvanti(); return; }   // non lo si aspetta
      var c = corr();
      if ((st.fase === "turno" || st.fase === "votazione") && c && c.id === id) return salta();
      if (st.fase === "votazione") verificaVoti();
    }
    function salta() { clearTo(); if (st.carta) st.mazzo.unshift(st.carta); st.carta = null; st.turno += 1; iniziaTurno(); }
    function comincia() {
      if (st.iniziata || st.giocatori.length < 1) return;
      st.iniziata = true; st.giro = 0; st.mosse = {}; st.avanti = {}; st.esitoT = null;
      st.carte = st.insieme ? carteInsieme(st.carte, st.mazzo.length) : carteGiuste(st.carte, st.mazzo.length, st.giocatori.length);
      st.giocatori.forEach(function (g) { g.restano = st.carte; g.punti = 0; g.via = false; });
      st.linea = [st.mazzo.pop()]; ordina(st.linea);
      st.T = creaTraccia({ online: true, carte: st.carte, tutteCat: st.tutteCat });
      // prima la sigla dello studio (uguale su tutti i telefoni), poi il primo turno
      st.fase = "apertura"; st.scadenza = null; st.durata = null; bd();
      clearTo(); st._to = setTimeout(iniziaTurno, durataApertura(st.giocatori.length));
    }
    // qualcuno ha ancora carte (anche se adesso è scollegato)?
    function restanoCarte() { return st.giocatori.some(function (g) { return g.restano > 0; }); }
    function iniziaTurno() {
      clearTo();
      if (st.insieme) return iniziaCarta();
      if (!restanoCarte() || st.mazzo.length === 0) return finisci();
      // chi ha ancora carte è tutto scollegato: non si chiude la partita, si aspetta che torni (l'host può chiuderla)
      // (se non torna entro 90 secondi, la partita finisce lì con i punti fatti)
      if (attivi(st) === 0) {
        st.carta = null; st.scelta = null; st.voti = {}; st.esito = null; st.fase = "attesa";
        arma(ATTESA_MAX, function () { if (st.fase === "attesa") finisci(); });
        bd(); return;
      }
      saltaFiniti(st);
      st.n++;
      st.carta = st.mazzo.pop(); st.scelta = null; st.voti = {}; st.esito = null; st.fase = "turno";
      // il tempo parte dopo lo stacco della telecamera su chi gioca; tempo scaduto = niente scelta
      var n = st.n;
      arma(TEMPO * 1000 + STACCO, function () { if (st.n === n) scelta(corr().id, null); });
      bd();
    }
    // ---------- "⚡ Tutti insieme": la stessa carta per tutti, nello stesso momento ----------
    function presenti() { return st.giocatori.filter(function (x) { return !x.via; }); }
    function iniziaCarta() {
      clearTo();
      if (st.giro >= st.carte || st.mazzo.length === 0) return finisci();
      st.n++; st.giro++;
      st.carta = st.mazzo.pop(); st.mosse = {}; st.avanti = {}; st.esitoT = null; st.scelta = null; st.voti = {}; st.esito = null;
      st.fase = "tutti"; st.inizio = Date.now() + INTRO_T;   // il tempo (e la gara a chi è più veloce) parte dopo "Carta 3 di 10"
      var n = st.n;
      // (+600: le scelte dell'ultimo secondo sono ancora in viaggio)
      arma(INTRO_T + TEMPO_T * 1000 + 600, function () { if (st.n === n && st.fase === "tutti") chiudiCarta(); });
      bd();
    }
    // una scelta: vale la prima (niente ripensamenti: conta anche la velocità)
    function posa(id, gap) {
      if (st.fase !== "tutti" || st.mosse[id]) return;
      var g = gDi(id); if (!g || g.via) return;
      gap = Math.floor(+gap); if (!(gap >= 0 && gap <= st.linea.length)) return;
      st.mosse[id] = { gap: gap, ms: Math.max(0, Date.now() - st.inizio) };
      bd(); verificaTutti();
    }
    // hanno scelto tutti quelli collegati: si scopre subito (chi è senza rete non lo si aspetta)
    function verificaTutti() {
      if (st.fase !== "tutti") return;
      var pr = presenti();
      if (pr.length && pr.every(function (x) { return st.mosse[x.id]; })) chiudiCarta();
    }
    function chiudiCarta() {
      if (st.fase !== "tutti") return;
      clearTo();
      var carta = st.carta, doppio = st.giro === st.carte && st.carte > 1, molt = doppio ? 2 : 1, veloce = null;
      st.giocatori.forEach(function (x) {
        var m = st.mosse[x.id];
        if (m && gapGiusto(st.linea, m.gap, carta.anno) && (!veloce || m.ms < st.mosse[veloce].ms)) veloce = x.id;
      });
      var risultati = st.giocatori.map(function (x) {
        var m = st.mosse[x.id], ok = !!m && gapGiusto(st.linea, m.gap, carta.anno), delta = ok ? (PUNTI + (x.id === veloce ? VELOCE : 0)) * molt : 0;
        x.punti += delta; x.restano = Math.max(0, x.restano - 1);
        if (x.id === IO) tPiazza(st.T, ok, carta._cat);
        return { id: x.id, giusto: ok, delta: delta, veloce: x.id === veloce, scelto: !!m, sec: m ? Math.round(m.ms / 100) / 10 : null };
      });
      st.linea.push(carta); ordina(st.linea);   // la carta entra nella linea per tutti (si impara la data)
      st.esitoT = { anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto || "", cat: carta._cat, doppio: doppio, risultati: risultati, ultima: st.giro >= st.carte };
      st.fase = "tEsito"; st.avanti = {};
      var n = st.n;
      arma(ESITO_T + Math.min(4000, st.giocatori.length * 300), function () { if (st.n === n && st.fase === "tEsito") prossimo(); });
      bd();
    }
    // "⏩ Avanti": se lo tocca più di metà di chi gioca, si va avanti subito
    function avantiT(id) {
      if (st.fase !== "tEsito") return;
      var g = gDi(id); if (!g || g.via || st.avanti[id]) return;
      st.avanti[id] = true; bd(); verificaAvanti();
    }
    function verificaAvanti() {
      if (st.fase !== "tEsito") return;
      var pr = presenti(), si = pr.filter(function (x) { return st.avanti[x.id]; }).length;
      if (si * 2 > pr.length) prossimo();
    }
    function votanti() { var c = corr(); return st.giocatori.filter(function (x) { return x.id !== c.id && !x.via; }); }
    function scelta(playerId, gap) {
      if (st.fase !== "turno" || corr().id !== playerId) return;
      clearTo();
      st.scelta = (gap == null ? -1 : gap); // -1 = tempo scaduto senza scegliere
      if (st.scelta === -1 || votanti().length === 0) return risolvi(); // nessuno da far votare
      st.fase = "votazione"; st.voti = {};
      arma(TEMPO * 1000, risolvi);
      bd();
    }
    function voto(id, d) {
      if (st.fase !== "votazione" || id === corr().id) return;
      var g = gDi(id); if (!g || g.via) return;
      st.voti[id] = !!d; bd(); verificaVoti();
    }
    function verificaVoti() {
      if (st.fase !== "votazione") return;
      if (votanti().every(function (x) { return st.voti[x.id] != null; })) risolvi();
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
        if (x.id === IO) tVoto(st.T, st.voti[x.id], giustoV);
        voti.push({ id: x.id, nome: x.nome, omino: x.omino || null, d: st.voti[x.id], giusto: giustoV, delta: giustoV ? VOTO : -VOTO });
      });
      if (g.id === IO) tPiazza(st.T, ok, carta._cat);
      if (ok) { st.linea.push(carta); ordina(st.linea); g.punti += PUNTI; } else { g.punti -= PUNTI; }
      g.restano -= 1;
      st.esito = { giusto: ok, anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto || "", nome: g.nome, cat: carta._cat,
        delta: ok ? PUNTI : -PUNTI, scaduto: gap === -1, voti: voti, finito: g.restano === 0 };
      st.scelta = null; st.fase = "esito";
      // il risultato non aspetta per sempre il tasto Avanti: dopo la rivelazione si riparte da soli
      var n = st.n;
      arma(durataEsito(voti.length, st.esito.finito, st.giocatori.length), function () { if (st.n === n && st.fase === "esito") prossimo(); });
      bd();
    }
    function prossimo() {
      clearTo();
      if (!restanoCarte() || st.mazzo.length === 0) return finisci();
      st.turno += 1; iniziaTurno();
    }
    // uno scollegato si è rifatto vivo: se la partita aspettava lui, riparte
    function torna(g) {
      g.via = false;
      if (st.fase === "attesa") iniziaTurno(); else bd();
    }
    function finisci() {
      clearTo(); st.fase = "fine"; st.scadenza = null; st.durata = null;
      st.classifica = classificaPunti(st.giocatori);
      // torneo online: i nomi coi posti (pari merito = stesso posto)
      if (t.risultato) t.risultato(st.classifica.map(function (r) { return { nome: r.nome, pos: r.pos, punti: r.punti }; }));
      var io = gDi(IO);
      if (io) tFine(st.T, st.classifica, function (r) { return r.id === IO; }, io.restano === 0);
      bd();   // (si ricorda anche la classifica: se l'host ricarica qui, la ritrova)
    }
    // "Rigioca": stessa stanza, stessi amici (chi era sparito resta fuori), tutti di nuovo nella saletta
    function nuova() {
      clearTo();
      st.giocatori = st.giocatori.filter(function (g) { return !g.via; });
      // chi tiene la partita è il primo (in saletta ha la corona); se l'ha presa guardando (host di riserva), si siede
      if (!gDi(IO)) { st.guarda = st.guarda.filter(function (x) { return x !== IO; }); st.giocatori.push({ id: IO, nome: nomeHost, restano: 0, punti: 0, omino: mioAvatar(nomeHost) }); }
      st.giocatori.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });
      st.giocatori.forEach(function (g) { g.punti = 0; g.restano = st.carte = (imp.carte || st.carte); });
      st.mazzo = mischiaArr(pescaDati(imp)); st.linea = []; st.turno = 0; st.carta = null; st.esito = null; st.classifica = null;
      st.scelta = null; st.voti = {}; st.scadenza = null; st.durata = null; st.T = null; st.iniziata = false; st.fase = "lobby"; st.partita = idPartita();
      st.insieme = imp.gara === "insieme"; st.giro = 0; st.mosse = {}; st.avanti = {}; st.esitoT = null;
      bd();
    }
    // partita ripresa dopo che l'host ha ricaricato la pagina: "🔁 Partita ripresa!" per qualche secondo (gli amici
    // intanto rientrano da soli), poi il turno riparte da capo con la stessa carta (o si passa al turno dopo, se il risultato c'era già)
    function riprendi() {
      var eraEsito = st.fase === "esito" || st.fase === "tEsito" || (st.fase === "ripresa" && !!st.riprEsito);
      st.riprEsito = eraEsito;   // (se la pagina si ricarica ancora durante la ripresa)
      if (!eraEsito && st.carta && (st.fase === "turno" || st.fase === "votazione")) st.mazzo.push(st.carta);   // la stessa carta torna in cima
      // tutti insieme: la carta a metà si rigioca da capo (stessa carta, scelte azzerate)
      if (!eraEsito && st.carta && st.fase === "tutti") { st.mazzo.push(st.carta); st.giro = Math.max(0, (st.giro || 1) - 1); }
      st.mosse = {}; st.avanti = {};
      st.carta = null; st.scelta = null; st.voti = {}; st.fase = "ripresa";
      arma(RIPRESA, function () {
        if (st.fase !== "ripresa") return;
        if (eraEsito) prossimo(); else iniziaTurno();
      });
    }
    var cb = { myId: IO, sonoHost: true,
      onGap: function (g) { scelta(IO, g); }, onVoto: function (d) { voto(IO, d); },
      onPosa: function (g) { posa(IO, g); },
      // a turno l'host può sempre andare avanti (anche al posto di chi si è distratto); tutti insieme conta come un voto
      onAvanti: function () { if (st.insieme) avantiT(IO); else if (st.fase === "esito") prossimo(); },
      onComincia: comincia, onNuova: function () { if (st.fase === "fine") nuova(); },
      onFinisci: function () { if (st.fase === "attesa") finisci(); },   // chi manca non torna più: si chiude qui
      onEsci: function (soloRete) {
        clearTo(); t.ricorda(null); rete.chiudi(); if (soloRete !== true) t.esci();
      } };
    // la Rivincita dei tasti di fine comuni: tutti di nuovo nella saletta, stessi amici (il core fa il 3-2-1)
    t.onRivincita = cb.onNuova;
    function disegna() { var v = vmDa(st); v._fino = st.scadenza; disegnaVM(t, v, cb); }
    disegna();
  }

  function ospiteEntra(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return schermataNoNet(t);
    REG = null;
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null, T: null, tFatto: false, tVia: null };
    function invia(m) { if (S.rete) { if (S.vm) m.n = S.vm.n; S.rete.invia(m); } }
    var cb = { myId: null, sonoHost: false,
      onGap: function (g) { invia({ t: "scelta", gap: g }); },
      onVoto: function (d) { invia({ t: "voto", d: d }); },
      onPosa: function (g) { invia({ t: "posa", gap: g }); },
      onAvanti: function () { invia({ t: "avanti" }); },
      onEsci: function (soloRete) {
        if (S.tVia) { clearInterval(S.tVia); S.tVia = null; }
        if (S.rete) S.rete.chiudi();
        if (soloRete !== true) t.esci();
      } };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaVM(t, S.vm, cb); } }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🔗", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        if (S.rete) return;
        ctx(); S.nome = (input.value || "Amico").trim().slice(0, 16) || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function entrata() { return { t: "join", nome: S.nome, omino: mioAvatar(S.nome) }; }
    // se l'host mi vede "scollegato" (il mio rientro si è perso) glielo ripeto ogni 3 secondi finché non torno dentro
    // (in saletta senza di me ci pensa il collegamento: ripete da solo "sono entrato")
    function controllaVia(vm) {
      var io = trovaG(vm, S.myId), via = !!(io && io.via && vm.fase !== "lobby" && vm.fase !== "fine");
      if (!via) { if (S.tVia) { clearInterval(S.tVia); S.tVia = null; } return; }
      if (S.tVia) return;
      S.rete.invia(entrata()); var k = 0;
      S.tVia = setInterval(function () { if (++k > 40 || !S.rete) { clearInterval(S.tVia); S.tVia = null; return; } S.rete.invia(entrata()); }, 3000);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia(entrata());
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice o aspetta che l'host apra la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;   // era per un altro telefono
          if (m.t === "pieno") { if (S.tVia) { clearInterval(S.tVia); S.tVia = null; } return schermaErr("La stanza è piena: ci sono già " + MAX_GIOCATORI + " giocatori."); }
          if (m.t === "vm" && m.vm) {
            var vm = m.vm, primo = !S.vm;
            vm._fino = vm.resta != null ? Date.now() + vm.resta : null;   // l'ora di fine col MIO orologio
            tracciaOspite(S, vm, codice); S.vm = vm; controllaVia(vm); disegna();
            if (primo) bentornato(vm);
          }
        },
        // l'host ha chiuso la stanza apposta (se sparisce e non torna, "La stanza è chiusa" lo dice il core):
        // sulla classifica finale resta la classifica, con la scritta giusta
        onChiuso: function () {
          if (S.tVia) { clearInterval(S.tVia); S.tVia = null; }
          if (S.vm && S.vm.fase === "fine") { cb.chiusa = true; if (notaFine) { notaFine.textContent = NOTA_CHIUSA; notaFine.hidden = false; } return; }
          schermaErr("🚪 L'host ha chiuso la partita.");
        },
        // (solo se il primo collegamento non riesce)
        onErrore: function (e) { schermaErr(codiceErrore(e)); }
      });
    }
    // chi rientra a partita in corso (pagina ricaricata): un saluto e quante carte gli restano
    function bentornato(vm) {
      var io = trovaG(vm, S.myId);
      if (!io || ["turno", "votazione", "esito", "tutti", "tEsito"].indexOf(vm.fase) < 0) return;
      setTimeout(function () {
        if (!REG || !REG.S.vivo()) return;
        var i = idxDi(S.vm, S.myId); if (i < 0) return;
        var sotto = vm.insieme ? (io.restano === 1 ? "Manca 1 carta" : "Mancano " + io.restano + " carte")
          : io.restano > 0 ? (io.restano === 1 ? "Ti resta 1 carta" : "Ti restano " + io.restano + " carte") : "Hai finito le carte: ora voti";
        terzo(REG.S, i, "Bentornato, " + io.nome + "!", sotto, "👋");
        setTimeout(function () { if (REG && REG.S.vivo()) viaTerzo(REG.S); }, 2600);
      }, 400);
    }
    function schermaErr(txt) {
      var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
      s._contenuto.appendChild(el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: function () { if (S.rete) S.rete.chiudi(); t.esci(); } }));
      t.mostra(s);
    }
  }

  // L'ospite conta i suoi trofei guardando i risultati che arrivano dall'host.
  // Si ricorda (sul telefono) cosa ha già contato: chi ricarica la pagina non conta due volte la stessa carta o la stessa partita.
  function chiaveT(codice, vm, id) { return "sg-tl-T-" + String(codice).toUpperCase() + "-" + (vm.partita || "") + "-" + id; }
  function caricaT(k) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); if (v && v.T && Date.now() - v.t < 6 * 3600000) return v.T; } catch (e) {} return null; }
  function salvaT(k, T) {
    try {
      localStorage.setItem(k, JSON.stringify({ t: Date.now(), T: T }));
      for (var i = localStorage.length - 1; i >= 0; i--) {   // pulizia: via quelli vecchi
        var kk = localStorage.key(i);
        if (kk && kk.indexOf("sg-tl-T-") === 0 && kk !== k) { var v = null; try { v = JSON.parse(localStorage.getItem(kk)); } catch (e) {} if (!v || Date.now() - v.t > 6 * 3600000) localStorage.removeItem(kk); }
      }
    } catch (e) {}
  }
  function tracciaOspite(S, vm, codice) {
    if (vm.fase === "lobby") { S.T = null; S.tFatto = false; return; }   // nuova partita nella stessa stanza
    var io = trovaG(vm, S.myId); if (!io) return;   // chi guarda soltanto non prende trofei
    var k = chiaveT(codice, vm, S.myId);
    if (!S.T && !S.tFatto) {
      S.tFatto = true;
      S.T = caricaT(k) || creaTraccia({ online: true, carte: vm.carte, tutteCat: vm.tutteCat });
      if (S.T && !S.T.visti) S.T.visti = [];
    }
    if (!S.T) return;
    var cambiato = false;
    if (vm.fase === "tEsito" && vm.esitoT && S.T.visti.indexOf(vm.n) < 0) {   // tutti insieme: la mia carta di questo giro
      S.T.visti.push(vm.n); cambiato = true;
      (vm.esitoT.risultati || []).forEach(function (r) { if (r.id === S.myId) tPiazza(S.T, r.giusto, vm.esitoT.cat); });
    }
    if (vm.fase === "esito" && vm.esito && S.T.visti.indexOf(vm.n) < 0) {
      S.T.visti.push(vm.n); cambiato = true;
      if (vm.turnoId === S.myId) tPiazza(S.T, vm.esito.giusto, vm.esito.cat);
      (vm.esito.voti || []).forEach(function (v) { if (v.id === S.myId) tVoto(S.T, v.d, v.giusto); });
    }
    if (vm.fase === "fine" && !S.T.salvato) {
      tFine(S.T, vm.classifica || [], function (r) { return r.id === S.myId; }, io.restano === 0);
      cambiato = true;
    }
    if (cambiato) salvaT(k, S.T);
  }

  // Ricordo dell'ultima fase (per la lobby e la classifica)
  var ultimaFase = null;

  // ---- ONLINE: ogni telefono ha il suo studio e la sua "regia" ----
  // Le novità dall'host arrivano in qualsiasi momento: la regia le mette in fila
  // e fa partire i momenti dello spettacolo uno dopo l'altro, senza saltarne.
  var REG = null;
  function idxDi(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return i; return -1; }
  function giocHUD(vm, meId) { return vm.giocatori.map(function (g) { return { id: g.id, nome: g.nome, punti: g.punti, omino: g.omino, via: g.via, _me: g.id === meId }; }); }
  function disegnaVM(t, vm, cb) {
    if (vm.fase === "lobby") { ultimaFase = "lobby"; REG = null; return disegnaLobby(t, vm, cb); }
    var ids = vm.giocatori.map(function (g) { return g.id; }).join("|");
    // regia nuova: la prima volta, in un'altra stanza o in una partita nuova (la regia vecchia non serve più)
    if (!REG || REG.codice !== vm.codice || REG.partita !== vm.partita || (!REG.S.vivo() && !REG.fineFatta)) {
      REG = { t: t, cb: cb, vm: vm, ids: ids, codice: vm.codice, partita: vm.partita };
      REG.S = creaStudio(t, vm.giocatori, { io: idxDi(vm, cb.myId), esci: function () { cb.onEsci(); }, titolo: OPZ_STUDIO.titolo, logo: OPZ_STUDIO.logo });
      vm.giocatori.forEach(function (g, i) { puntiLeggio(REG.S, i, g.punti, 0); });
    } else if (REG.ids !== ids && REG.S.vivo()) {   // i giocatori sono cambiati: rifaccio i leggii
      REG.ids = ids; REG.S.impostaGiocatori(vm.giocatori, idxDi(vm, cb.myId));
      vm.giocatori.forEach(function (g, i) { puntiLeggio(REG.S, i, g.punti, 0); });
      camera(REG.S, REG.S.shot(), 0);
    }
    // chi è scollegato ha il leggio in bianco e nero finché non torna
    if (REG.S.vivo()) vm.giocatori.forEach(function (g, i) { ST.fuori(REG.S, i, !!g.via); });
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
    var kT = (vm.turnoId || "") + "|" + chiaveCarta(vm.carta) + "|" + (vm.n || 0), nomeT = vm.turnoNome || "";
    if (vm.fase === "apertura") {
      if (R.aperturaFatta) return false;
      R.aperturaFatta = true; ultimaFase = "apertura";
      await apertura(S); return true;
    }
    if (vm.fase === "fine") {
      if (R.fineFatta) return false;
      R.fineFatta = true; ultimaFase = "fine";
      var cl = vm.classifica || [], vinc = cl[0] ? idxDi(vm, cl[0].id) : -1;
      await ST.finale(S, vinc, fmtN(cl[0] ? cl[0].punti : 0) + " punti");
      // i tasti di fine comuni: all'host e a chi ha giocato (chi ha solo guardato tiene i suoi)
      var tf = cb.sonoHost ? { host: true, nuova: cb.onNuova, esci: cb.onEsci } : (io >= 0 ? { host: false, esci: cb.onEsci } : null);
      schermataFine(R.t, cl, cb.sonoHost ? cb.onNuova : null, cb.sonoHost
        ? { online: true, testoRigioca: "↻ Nuova partita (stessi amici)", esci: cb.onEsci, tf: tf }
        : { online: true, esci: cb.onEsci, tf: tf, chiusa: !!cb.chiusa, nota: cb.chiusa ? NOTA_CHIUSA
          : io >= 0 ? "⏳ Aspetta l'host: se fa un'altra partita, torni da solo nella saletta."
          : (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta hai guardato." : "⏳ Aspetta l'host: alla prossima partita giochi anche tu." });
      return true;
    }
    if (vm.fase === "attesa") {   // chi ha ancora carte è scollegato: si aspetta che torni (al massimo 90 secondi)
      var kA = "attesa|" + vm.giocatori.map(function (g) { return g.via ? 1 : 0; }).join("");
      if (R.mostrato === kA) return false;
      R.mostrato = kA; R.aperturaFatta = true; ultimaFase = "attesa";
      var assenti = vm.giocatori.filter(function (g) { return g.via && g.restano > 0; }).map(function (g) { return g.nome; });
      ST.logoSchermo(S); largo(S, 900);
      var secA = vm._fino ? Math.max(1, Math.round((vm._fino - Date.now()) / 1000)) : 90, kFin = "tl-attesa|" + vm.partita + "|" + vm.n;
      var bFin = cb.sonoHost ? el("button", { class: "btn btn-fantasma", text: "🏁 Finisci qui la partita", onclick: function () { viaBarra(S); cb.onFinisci(); } }) : null;
      var pFin = cb.sonoHost ? null : el("p", { class: "tl-attesa" });
      barra(S, [ el("p", { class: "tl-attesa", text: "💤 Aspettiamo che torni " + (assenti.join(", ") || "chi manca") + ": deve ancora giocare le sue carte." }), bFin, pFin, R.t.faccine() ]);
      R.t.contoAvanti(bFin || pFin, secA, bFin ? function () { viaBarra(S); cb.onFinisci(); } : null, kFin);
      return false;
    }
    if (vm.fase === "ripresa") {   // l'host ha ricaricato la pagina: la partita riprende da dove era
      if (R.mostrato === "ripresa|" + vm.n) return false;
      R.mostrato = "ripresa|" + vm.n; R.aperturaFatta = true; R.kTurno = null; R.kEsito = null; R.kTutti = null; R.kEsitoT = null; ultimaFase = "ripresa";
      vm.giocatori.forEach(function (g, i) { puntiLeggio(S, i, g.punti, 0); });
      ST.logoSchermo(S); largo(S, 900);
      terzo(S, null, "🔁 Partita ripresa!", "Si continua da dove eravamo", "🔁");
      var pR = el("p", { class: "tl-attesa" });
      barra(S, [ pR ]);
      R.t.contoAvanti(pR, vm._fino ? Math.max(1, Math.round((vm._fino - Date.now()) / 1000)) : RIPRESA / 1000, null, "tl-ripresa|" + vm.partita + "|" + vm.n);
      setTimeout(function () { if (S.vivo()) viaTerzo(S); }, 2600);
      return false;
    }
    if (vm.fase === "tutti") {   // ⚡ tutti insieme: la stessa carta per tutti
      var kC = "T|" + vm.n;
      if (R.kTutti !== kC) {
        R.kTutti = kC; R.aperturaFatta = true; R.mostrato = null; R.mioPosa = null; R.alzati = {}; ultimaFase = "tutti";
        memSel = { k: chiaveCarta(vm.carta), gap: null };
        vm.giocatori.forEach(function (g, i) { puntiLeggio(S, i, g.punti, 0); });
        cartelliGiu(S); tutteNormali(S); accendiSolo(S, -1);
        // "Carta 3 di 10" (l'ultima vale doppio), poi la carta sul maxischermo. Chi rientra a carta già cominciata salta l'annuncio
        var giaVia = vm._fino && vm._fino - Date.now() < TEMPO_T * 1000 - 400;
        if (!giaVia) {
          ST.logoSchermo(S);
          var ultimaC = vm.giro >= vm.carte && vm.carte > 1;
          terzo(S, null, ultimaC ? "🔥 Ultima carta: vale doppio!" : "⚡ Carta " + vm.giro + " di " + vm.carte, "Tutti insieme: piazzala giusta, e prima degli altri!", ultimaC ? "🔥" : "⚡");
          if (io >= 0) FX.turno();
          await dorme(1400); viaTerzo(S);
          if (S.vivo()) await suSchermo(S, 700);
        } else if (S.shot && S.shot() !== S.R.schermo) await suSchermo(S, 500);
        return true;
      }
      mostraTutti(R, vm, io);
      return false;
    }
    if (vm.fase === "tEsito") {
      var kE2 = "TE|" + vm.n;
      if (R.kEsitoT !== kE2) {
        R.kEsitoT = kE2; R.kTutti = "T|" + vm.n; R.aperturaFatta = true; R.mostrato = null; ultimaFase = "tEsito";
        R.nuovoT = vm.esitoT ? vm.esitoT.titolo : null;
        await rivelazioneTutti(S, R, vm);
        return true;
      }
      if (R.mostrato !== kE2) { R.mostrato = kE2; mostraDopoTutti(R, vm, io); }
      else aggiornaAvanti(R, vm, io);
      return false;
    }
    if (vm.fase === "turno" || vm.fase === "votazione") {
      if (R.kTurno !== kT) {   // turno nuovo: stacco su chi gioca, poi sul maxischermo
        R.kTurno = kT; R.aperturaFatta = true; R.mioVoto = null; R.mostrato = null; R.alzati = {};
        memSel = { k: chiaveCarta(vm.carta), gap: null };
        vm.giocatori.forEach(function (g, i) { puntiLeggio(S, i, g.punti, 0); });
        if (vm.fase === "turno") {
          ultimaFase = "turno";
          if (mioTurno) FX.turno();
          ST.logoSchermo(S);
          await stacco(S, gi, mioTurno ? "Tocca a te!" : "Sta per scegliere…");
          if (S.vivo()) await suSchermo(S, 900);
          return true;
        }
      }
      if (vm.fase === "turno") mostraTurno(R, vm, gi, io, mioTurno, nomeT, kT);
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
        mostraDopoEsito(R, vm, mioTurno, nomeT);
      }
      return false;
    }
    return false;
  }
  // dopo il risultato: "Avanti ▶ 8" per chi ha giocato e per l'host (conta e a zero si va avanti da soli,
  // il tempo lo tiene l'host), "Si va avanti tra 8…" per gli altri
  function mostraDopoEsito(R, vm, mioTurno, nomeT) {
    var S = R.S, el = R.t.el, cb = R.cb, nE = vm.n;
    var sec = vm._fino ? Math.max(1, Math.round((vm._fino - Date.now()) / 1000)) : 12, kE = "tl-esito|" + vm.partita + "|" + vm.n;
    if (mioTurno || cb.sonoHost) {
      var b = el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: function () {
        viaBarra(S); cb.onAvanti();
        if (cb.sonoHost) return;
        // l'"avanti" può perdersi (host via un attimo): lo ripeto finché non si passa oltre
        var k = 0, iv = setInterval(function () {
          if (++k > 5 || !S.vivo() || R.vm.n !== nE || R.vm.fase !== "esito") { clearInterval(iv); return; }
          cb.onAvanti();
        }, 2000);
      } });
      barra(S, [ b ]);
      R.t.contoAvanti(b, sec, cb.sonoHost ? function () { viaBarra(S); cb.onAvanti(); } : null, kE);
    } else {
      var p = el("p", { class: "tl-attesa" });
      barra(S, [ p ]);
      R.t.contoAvanti(p, sec, null, kE);
    }
  }
  function mostraTurno(R, vm, gi, io, mioTurno, nomeT, kT) {
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
      sotto: mioTurno ? "Dove va questa carta?" : "Sta scegliendo dove metterla…", rimMs: vm._fino ? vm._fino - Date.now() : null,
      carta: vm.carta, linea: vm.linea, sel: mioTurno ? memSel.gap : null, chiave: "vm-t|" + kT,
      scegli: mioTurno ? function (i) { memSel = { k: kCarta, gap: i }; conf.disabled = false; conf.textContent = "✅ Mettila qui"; } : null });
    if (conf) barra(S, [conf]);
    else barra(S, [ el("p", { class: "tl-attesa", text: io < 0 ? ((vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta guardi: gioca chi è stato scelto." : "👀 Stai guardando: alla prossima partita giochi anche tu!") : "Guarda bene la linea: dopo tocca votare!" }), R.t.faccine() ]);
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
    var guardo = io < 0;   // spettatore: non vota
    schermoGioco(S, { giocatori: giocHUD(vm, cb.myId), turnoId: vm.turnoId, stato: mioTurno ? "Gli altri votano…" : (devoVotare ? "Vota!" : (guardo ? "Si vota…" : "Hai votato")),
      sotto: mioTurno ? "Speriamo siano d'accordo 🤞" : nomeT + " l'ha messa qui: è giusto?", rimMs: vm._fino ? vm._fino - Date.now() : null,
      carta: vm.carta, linea: vm.linea, tent: vm.scelta, chiave: "vm-v|" + kT });
    if (devoVotare) {
      if (S.shot && S.shot() !== S.R.schermo) suSchermo(S, 700);
      barra(S, [ el("div", { class: "tl-vota" }, [
        el("button", { class: "btn btn-verde", text: "👍 Giusto", onclick: function () { FX.voto(); R.mioVoto = true; viaBarra(S); cb.onVoto(true); regiaTick(R); } }),
        el("button", { class: "btn btn-rosso", text: "👎 No", onclick: function () { FX.voto(); R.mioVoto = false; viaBarra(S); cb.onVoto(false); regiaTick(R); } })
      ]) ]);
    } else {
      // niente da fare: la telecamera va sui concorrenti a vedere i cartellini che si alzano
      barra(S, [ el("p", { class: "tl-attesa", text: mioTurno ? "Gli altri stanno votando la tua scelta…" : (guardo ? "👀 Stai guardando: gli altri votano la carta di " + nomeT + "." : "Hai votato. Aspetta gli altri…") }), R.t.faccine() ]);
      largo(S, 900);
      if (R.mioVoto != null && io >= 0) cartello(S, io, "su", R.mioVoto);
    }
  }

  // ---------- ⚡ TUTTI INSIEME: la stessa carta per tutti ----------
  // "✅ 2 su 5 hanno scelto": si aggiorna solo questa riga (e i cartellini coperti sui leggii), il resto resta fermo
  function testoContaT(vm) {
    var pr = vm.giocatori.filter(function (g) { return !g.via; }).length, n = vm.hannoScelto.length;
    return n ? "✅ " + n + " su " + pr + (n === 1 ? " ha scelto" : " hanno scelto") : "Nessuno ha ancora scelto: sbrigati!";
  }
  function mostraTutti(R, vm, io) {
    var S = R.S, el = R.t.el, cb = R.cb, kCarta = chiaveCarta(vm.carta), n = vm.n;
    var hoScelto = io >= 0 && (R.mioPosa != null || vm.hannoScelto.indexOf(cb.myId) >= 0);
    vm.hannoScelto.forEach(function (id) { var i = idxDi(vm, id); if (i >= 0 && !R.alzati[id]) { R.alzati[id] = true; cartello(S, i, "su", null); } });
    var chiave = "tt|" + n + "|" + (io < 0 ? "guarda" : hoScelto ? "fatto" : "scegli") + "|" + vm.giocatori.length;
    if (R.mostrato === chiave) { if (R.contaT) { var tc = testoContaT(vm); if (R.contaT.textContent !== tc) R.contaT.textContent = tc; } return; }
    R.mostrato = chiave;
    var ultimaC = vm.giro >= vm.carte && vm.carte > 1;
    var stato = ultimaC ? "🔥 Ultima carta: vale doppio!" : "⚡ Carta " + vm.giro + " di " + vm.carte;
    R.contaT = el("p", { class: "tl-attesa", text: testoContaT(vm) });
    var o = { giocatori: giocHUD(vm, cb.myId), turnoId: null, stato: stato, rimMs: vm._fino ? vm._fino - Date.now() : null, totMs: TEMPO_T * 1000,
      carta: vm.carta, linea: vm.linea, nuovo: R.nuovoT, chiave: "vm-tt|" + n };
    if (io < 0) {
      o.sotto = "Tutti piazzano questa carta…";
      schermoGioco(S, o);
      barra(S, [ R.contaT, el("p", { class: "tl-attesa", text: (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta guardi: gioca chi è stato scelto." : "👀 Stai guardando: alla prossima partita giochi anche tu!" }), R.t.faccine() ]);
      return;
    }
    if (hoScelto) {
      o.sotto = R.mioPosa != null ? "✅ Fatta! L'hai messa qui: aspetta gli altri…" : "✅ Hai già scelto: aspetta gli altri…";
      if (R.mioPosa != null) o.tent = R.mioPosa;
      schermoGioco(S, o);
      barra(S, [ R.contaT, R.t.faccine() ]);
      return;
    }
    // da scegliere: tocca il punto, poi "✅ Mettila qui" (vale la prima: conta anche chi è più veloce)
    var conf = el("button", { class: "btn btn-primario tl-conferma", text: memSel.gap != null ? "✅ Mettila qui" : "⤵ Tocca dove va la carta", onclick: function () {
      if (memSel.gap == null || R.mioPosa != null) return;
      var gap = memSel.gap; R.mioPosa = gap; FX.voto();
      cb.onPosa(gap);
      // la scelta può perdersi (rete che salta): la ripeto finché l'host non la vede
      var k = 0, iv = setInterval(function () {
        if (++k > 6 || !S.vivo() || R.vm.n !== n || R.vm.fase !== "tutti" || R.vm.hannoScelto.indexOf(cb.myId) >= 0) { clearInterval(iv); return; }
        cb.onPosa(gap);
      }, 2000);
      regiaTick(R);
    } });
    if (memSel.gap == null) conf.disabled = true;
    o.sotto = "Dove va? Al più veloce dei giusti 50 punti in più"; o.sel = memSel.gap;
    o.scegli = function (i) { memSel = { k: kCarta, gap: i }; conf.disabled = false; conf.textContent = "✅ Mettila qui"; };
    schermoGioco(S, o);
    barra(S, [ conf, R.contaT ]);
  }
  // il risultato: la carta si gira e svela l'anno, poi chi l'ha messa giusta (sul maxischermo e sui cartellini dei leggii)
  function nodoEsitoTutti(el, vm, myId) {
    var es = vm.esitoT || {}, ic = infoCat(es.cat), ris = (es.risultati || []).slice(), mio = null;
    ris.forEach(function (r) { if (r.id === myId) mio = r; });
    var molti = ris.length > 6;
    var verd = mio ? (mio.giusto ? "✅ Giusta! +" + fmtN(mio.delta) + (mio.veloce ? " ⚡" : "") : mio.scelto ? "❌ Sbagliata" : "⏰ Tempo scaduto") : "📅 " + annoTesto(es.anno);
    var box = el("div", { class: "tl-esito tl-esito-t" + (molti ? " molti" : "") }, [
      el("div", { class: "tl-flip ok corta", style: stileCat(es.cat) }, [
        el("div", { class: "tl-flip-in" }, [
          el("div", { class: "tl-flip-f" }, [ el("div", { class: "q", text: "?" }), el("div", { class: "tit", text: ic.icona + " " + es.titolo }) ]),
          el("div", { class: "tl-flip-f retro" }, [ el("div", { class: "grande", text: annoTesto(es.anno) }), el("div", { class: "tit", text: es.titolo }) ])
        ])
      ]),
      el("div", { class: "tl-verdetto " + (!mio || mio.giusto ? "giusto" : "sbagliato"), text: verd }),
      es.doppio ? el("div", { class: "tl-delta su", text: "🔥 Punti doppi!" }) : null,
      (!molti && es.fatto) ? el("div", { class: "tl-desc-es", text: es.fatto }) : null
    ]);
    // prima i giusti (dal più veloce), poi chi ha sbagliato, poi chi non ha scelto
    function ordine(r) { return r.giusto ? 0 : r.scelto ? 1 : 2; }
    ris.sort(function (a, b) { return ordine(a) - ordine(b) || ((a.sec || 0) - (b.sec || 0)); });
    var ul = el("ul", { class: "tl-tutti" + (ris.length >= 4 ? " due" : "") });
    ris.forEach(function (r) {
      var g = trovaG(vm, r.id); if (!g) return;
      ul.appendChild(el("li", { class: r.giusto ? "si" : "no" }, [
        el("span", { class: "av", html: avatarDi(g, r.giusto ? "esulta" : null) }),
        el("span", { class: "nm", text: (r.giusto ? "✅ " : r.scelto ? "❌ " : "⏰ ") + g.nome + (r.id === myId ? " (tu)" : "") }),
        el("span", { class: "d", text: r.giusto ? "+" + fmtN(r.delta) + (r.veloce ? " ⚡" : "") : "" })
      ]));
    });
    box.appendChild(ul);
    if (!mio || mio.giusto) setTimeout(coriandoli, 1250);
    return box;
  }
  async function rivelazioneTutti(S, R, vm) {
    var el = S.t.el, es = vm.esitoT || {}, mio = null;
    (es.risultati || []).forEach(function (r) { if (r.id === R.cb.myId) mio = r; });
    viaBarra(S); fermaTimer(S);
    await suSchermo(S, 700);
    if (!S.vivo()) return;
    vuota(S.sch);
    S.sch.appendChild(ST.raggi(S, !!mio && !mio.giusto));
    S.sch.appendChild(nodoEsitoTutti(el, vm, R.cb.myId));
    FX.rullo(1.2);
    setTimeout(function () { if (!mio || mio.giusto) FX.giusto(); else FX.sbagliato(); }, 1300);
    await dorme(2600);
    if (!S.vivo()) return;
    var fl = S.sch.querySelector(".tl-flip"); if (fl) fl.classList.add("fatto");   // carta girata: piatta (niente 3D mentre la telecamera si muove)
    // sui leggii si girano i cartellini: ✅ chi l'ha messa giusta, ❌ chi ha sbagliato
    var gir = [];
    (es.risultati || []).forEach(function (r) { var i = idxDi(vm, r.id); if (i >= 0 && r.scelto) gir.push({ i: i, r: r }); });
    var dopo = vm.giocatori.map(function (g) { return g.punti; });
    if (gir.length) {
      gir.forEach(function (x) { cartello(S, x.i, "su"); });
      await largo(S, 900); await dorme(300);
      var gira = function (x) {
        cartello(S, x.i, "gira", x.r.giusto);
        var f = S.L[x.i] && S.L[x.i].cart && S.L[x.i].cart.querySelector(".f.r"); if (f) f.textContent = x.r.giusto ? "✅" : "❌";
        faccia(S, x.i, x.r.giusto ? "esulta" : "triste"); puntiLeggio(S, x.i, dopo[x.i], x.r.delta);
      };
      if (S.file === 1) {
        for (var k = 0; k < gir.length; k++) { if (!S.vivo()) return; gira(gir[k]); await dorme(300); }
        pubblico(S, mio && !mio.giusto ? "ohh" : "applauso");
        await dorme(1300);
      } else {
        var perIdx = {}; gir.forEach(function (x) { perIdx[x.i] = x; });
        for (var f2 = 0; f2 < S.file; f2++) await panFila(S, f2, 1500, function (i) { if (perIdx[i]) gira(perIdx[i]); });
        await dorme(600);
      }
    }
    dopo.forEach(function (p, i) { if (S.L[i] && S.L[i].valore !== p) puntiLeggio(S, i, p, 0); });
    cartelliGiu(S); tutteNormali(S); accendiSolo(S, -1);
    if (S.vivo()) await suSchermo(S, 700);   // di nuovo sul maxischermo: la lista di chi l'ha messa giusta, da leggere col conto
  }
  // dopo il risultato: "⏩ Avanti" (se lo tocca più di metà di chi gioca si parte subito) e "Si va avanti tra 8…"
  function mostraDopoTutti(R, vm, io) {
    var S = R.S, el = R.t.el, cb = R.cb, n = vm.n;
    var sec = vm._fino ? Math.max(1, Math.round((vm._fino - Date.now()) / 1000)) : 10;
    var p = el("p", { class: "tl-attesa" }), nodi = [];
    R.avBtn = null;
    if (io >= 0) {
      R.avTxt = el("span", { text: "⏩ Avanti" });
      R.avBtn = el("button", { class: "btn btn-primario", onclick: function () {
        if (R.avMio === n) return;
        R.avMio = n; cb.onAvanti(); aggiornaAvanti(R, R.vm, io);
        if (cb.sonoHost) return;
        var k = 0, iv = setInterval(function () {   // l'"avanti" può perdersi: lo ripeto finché l'host non lo vede
          if (++k > 5 || !S.vivo() || R.vm.n !== n || R.vm.fase !== "tEsito" || (R.vm.avanti || []).indexOf(cb.myId) >= 0) { clearInterval(iv); return; }
          cb.onAvanti();
        }, 2000);
      } }, [ R.avTxt ]);
      nodi.push(R.avBtn);
    }
    nodi.push(p);
    barra(S, nodi);
    R.t.contoAvanti(p, sec, null, "tl-tesito|" + vm.partita + "|" + n);
    aggiornaAvanti(R, vm, io);
  }
  function aggiornaAvanti(R, vm, io) {
    if (!R.avBtn || io < 0) return;
    var pr = vm.giocatori.filter(function (g) { return !g.via; }).length, si = (vm.avanti || []).length;
    var mio = R.avMio === vm.n || (vm.avanti || []).indexOf(R.cb.myId) >= 0;
    var tx = (mio ? "✅ Pronto" : "⏩ Avanti") + (si ? " · " + si + " su " + pr : "");
    if (R.avTxt.textContent !== tx) R.avTxt.textContent = tx;
    if (R.avBtn.disabled !== mio) R.avBtn.disabled = mio;
  }

  // la saletta d'attesa (uguale per tutti i giochi)
  function disegnaLobby(t, vm, cb) {
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, puoiDaSolo: true,
      giocatori: vm.giocatori.map(function (g, i) { return { id: g.id, nome: g.nome, omino: g.omino || null, host: i === 0, tu: g.id === cb.myId }; }),
      nota: cb.sonoHost && vm.giocatori.length < 2 ? "Si gioca meglio in 2 o più: invita gli amici col tasto 📤." : null,
      extra: [],   // (le regole le scrive il core: «📜 Si gioca così: 5 carte a testa · …»)
      // nella Sala: chi non è stato scelto guarda soltanto
      spettatore: !cb.sonoHost && (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta guardi" : null,
      attesa: "Aspetta che l'host faccia partire lo studio!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function schermataNoNet(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato. Da un file locale o da un'anteprima non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  function schermataErrore(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function codiceErrore(e) { var ty = e && e.type; if (ty === "no-mqtt") return "Il collegamento non è disponibile qui."; return "Problema di collegamento. Controlla la connessione e riprova."; }

  SG.registra(gioco);
})();
