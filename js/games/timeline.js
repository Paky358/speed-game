/* =========================================================
   GIOCO — La linea del tempo
   Modalità: "un telefono solo" e "ognuno dal suo telefono"
   (con votazione degli altri giocatori, punteggi, timer,
   classifica sempre visibile, suoni e vibrazione).
   ========================================================= */
(function () {
  "use strict";

  var PUNTI = 100;     // per una risposta giusta/sbagliata
  var VOTO = 50;       // quanto perde chi prova a rubare e sbaglia (✋ Rubala)
  var TEMPO = 30;      // secondi per turno
  var MAX_GIOCATORI = 10;
  var RIPRESA = 5000;          // online: l'host ha ricaricato, "Partita ripresa!" e poi si riparte
  var ATTESA_MAX = 90000;      // online: chi deve ancora giocare è senza rete; dopo 90 secondi la partita finisce lì
  // "⚡ Tutti insieme" (online): tutti piazzano la stessa carta nello stesso momento
  var TEMPO_T = 25;            // secondi per piazzarla
  var VELOCE = 50;             // in più al più veloce di chi l'ha messa giusta
  var INTRO_T = 2200;          // "Carta 3 di 10": il tempo parte dopo
  var ESITO_T = 5500;          // il risultato da leggere DOPO la rivelazione: poi si va avanti da soli (o subito, se toccano "⏩ Avanti" tutti)
  // quanto dura la rivelazione di "⚡ Tutti insieme" (carta che si gira + cartellini sui leggii; da 5 in su due file di leggii)
  function rivelazioneT(n) { return n > 4 ? 9000 : 6300 + 300 * n; }
  var TANTI = 5;               // online da 5 in su la partita parte "⚡ Tutti insieme" (regola «✨ Decide il gioco»)
  // «📅 Dimmi l'anno»: dopo il posto, chi vuole dice anche l'anno
  var BONUS_ESATTO = 100, BONUS_VICINO = 30, VICINO = 2;   // anno esatto +100, sbagliato di 1-2 anni +30
  var PELO = 3;                // "Per un pelo!": sbagliato di 3 anni o meno
  // «✋ Rubala» (come in Hitster, dal 26 ott 2026 al posto dei voti 👍/👎): chi pensa che chi gioca sbagli tocca il posto giusto,
  // in segreto e anche in tanti sullo stesso posto. Se sbagliava davvero e il posto è giusto +PUNTI, se no −VOTO; «👍 Passo» = 0
  var TEMPO_RUBA = 20;         // secondi per decidere (online)
  // «📸 I nostri ricordi»: i fatti del gruppo con l'anno (al massimo 12 a testa, sul profilo di chi li scrive)
  var MAX_RICORDI = 12, LUNGO_RICORDO = 60, ANNO_RICORDI = 1900;

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
    // ✋ Rubala sullo stesso telefono: l'avatar toccato aspetta il posto (giallo), chi ruba è rosso
    ".tl-gv.attivo{border-color:var(--accento);background:rgba(255,202,58,.24);box-shadow:0 0 12px rgba(255,202,58,.45)}",
    ".tl-gv.ruba{border-color:var(--rosso);background:rgba(255,93,108,.2)}",
    ".tl-gvoto .tt.ora{color:var(--accento)}",
    ".tl-slot.ha .lab{border-style:solid;border-color:var(--rosso);background:rgba(255,93,108,.18);color:#fff}",
    // la carta messa da chi gioca (tra le altre) e quella di chi ruba: chi l'ha messa lì
    ".tl-ev .chi{font-size:.72rem;font-weight:800;color:var(--accento);margin-top:3px}",
    ".tl-slot .fant.ruba .chi{color:#ffb3bb}",
    ".tl-slot.sel .fant.ruba .card{border-color:var(--rosso);background:rgba(255,93,108,.16)}",
    ".tl-slot .fant.ruba .anno{background:var(--rosso);color:#fff}",
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
    // le foto vere: sulla carta in mano un quadrato a sinistra, sulle carte della linea una miniatura a destra
    ".tl-mano.con-foto{padding-left:98px;min-height:100px}",
    ".tl-mano.con-foto.con-cambia .cat .cn{display:none}",   // (foto e «🔄 Cambia» insieme: della categoria resta l'icona)
    ".tl-mano .ft{position:absolute;left:12px;top:12px;width:74px;height:74px;object-fit:cover;border-radius:12px;background:rgba(0,0,0,.22);box-shadow:0 2px 8px rgba(0,0,0,.35);z-index:1}",
    ".tl-ev .card .ft{float:right;width:46px;height:46px;margin:0 0 3px 8px;object-fit:cover;border-radius:9px;background:rgba(0,0,0,.22)}",
    // «🔄 Cambia carta» (una volta a partita): il tasto sulla carta, accanto ai ????; la luce che passa non lo copre
    ".tl-mano:after{pointer-events:none}",
    ".tl-mano .cambia{flex:0 0 auto;margin-left:auto;position:relative;z-index:1;border:0;border-radius:99px;padding:4px 11px;background:rgba(255,255,255,.24);color:#fff;font:inherit;font-weight:900;font-size:.78rem;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}",
    ".tl-mano .cambia:active{transform:scale(.94)}.tl-mano .cambia:disabled{opacity:.5}",
    ".tl-mano .tit{position:relative;font-size:1.18rem;font-weight:900;line-height:1.2;margin-top:6px;text-shadow:0 1px 2px rgba(0,0,0,.25)}",
    ".tl-mano .desc{position:relative;font-size:.84rem;line-height:1.35;margin-top:6px;opacity:.92}",
    // la linea del tempo verticale
    ".tl-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;margin:0 -12px;padding:4px 12px 16px;",
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
    // chi guarda soltanto: la targhetta del core in basso (44 px + 10 di margine) ha il suo posto, sotto la barra e la classifica
    ".st-vista.st-con-targa .st-barra{padding-bottom:calc(64px + env(safe-area-inset-bottom))}",
    ".st-vista.st-con-targa.con-barra .st-sch-in{padding-bottom:152px}",
    ".tl-fine.tl-con-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
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
    // la barra in basso più alta (anno, Rubala): il maxischermo si stringe quanto serve
    ".st-vista.con-barra.tl-alta .st-sch-in{padding-bottom:var(--tl-barra,104px)}",
    // «📅 Dimmi l'anno»: − 10, − 1, l'anno, + 1, + 10 e la rotella (cursore) per i salti lunghi
    ".tl-anno{display:flex;flex-direction:column;gap:4px;transition:opacity .2s}",
    ".tl-anno.spento{opacity:.4;pointer-events:none}",
    ".tl-anno .riga{display:flex;align-items:center;gap:6px}",
    ".tl-anno .pa{flex:0 0 auto;min-width:40px;height:38px;border-radius:12px;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-weight:900;font-size:.85rem;cursor:pointer;padding:0 6px}",
    ".tl-anno .pa:active{transform:scale(.94)}",
    ".tl-anno .v{flex:1;min-width:0;height:38px;border-radius:12px;border:2px solid rgba(255,202,58,.55);background:rgba(0,0,0,.35);color:#fff;font:inherit;font-weight:900;font-size:1.15rem;text-align:center;letter-spacing:.06em;padding:0 4px}",
    ".tl-anno .v::placeholder{color:rgba(255,220,120,.85);font-size:.9rem;letter-spacing:0;font-weight:800}",
    ".tl-anno.ha .v{border-color:var(--accento);background:rgba(255,202,58,.18)}",
    ".tl-anno .sl{width:100%;height:22px;margin:0;accent-color:#ffca3a;cursor:pointer}",
    ".tl-anno .tt{font-size:.78rem;font-weight:800;color:rgba(255,230,160,.95);text-align:center;line-height:1.2}",
    ".tl-ruba{min-height:44px!important;font-size:.95rem!important}",
    ".tl-ruba-tasti{display:flex;gap:8px;min-width:0}.tl-ruba-tasti .btn{flex:1 1 auto;width:auto;min-width:0;margin:0}",
    ".tl-ruba-tasti .btn.ind{flex:0 0 64px;width:64px;padding-left:0;padding-right:0}",
    ".tl-anno .riga .pa,.tl-anno .riga .v{margin:0}",
    // l'esito quando si sbaglia: la carta un po' più bassa, e sotto "dove andava"
    ".tl-flip.media{height:168px}",
    ".st-sch-in .tl-flip.media{height:172px}",
    ".tl-flip .err{font-size:.95rem;font-weight:900;margin-top:6px;padding:2px 10px;border-radius:99px;background:rgba(0,0,0,.3)}",
    ".tl-dove{width:100%;max-width:340px;display:flex;flex-direction:column;gap:3px;animation:tlPop .4s ease 1.5s both}",
    ".tl-dove .tt{font-size:.75rem;font-weight:900;color:var(--testo-tenue);text-transform:uppercase;letter-spacing:.08em}",
    ".tl-dove .x{display:flex;align-items:center;gap:8px;padding:3px 8px;border-radius:10px;background:rgba(255,255,255,.07);font-size:.8rem;font-weight:700;text-align:left;min-width:0}",
    ".tl-dove .x b{flex:0 0 auto;min-width:46px;text-align:right;font-weight:900}",
    ".tl-dove .x span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tl-dove .x.qui{background:rgba(255,202,58,.22);box-shadow:0 0 0 2px var(--accento);animation:tlQui .75s ease-in-out 1.9s 2 both}",
    "@keyframes tlQui{0%,100%{transform:scale(1)}50%{transform:scale(1.04);box-shadow:0 0 0 3px var(--accento),0 0 18px rgba(255,202,58,.6)}}",
    ".tl-righe{list-style:none;padding:0;margin:0 auto;width:100%;max-width:340px;display:flex;flex-direction:column;gap:3px;animation:tlPop .4s ease 1.6s both}",
    ".tl-righe li{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.07);border-radius:10px;padding:3px 8px;font-size:.8rem;font-weight:700;text-align:left}",
    ".tl-righe li .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tl-righe li .d{flex:0 0 auto;font-weight:900}",
    ".tl-righe li.si .d{color:var(--verde)} .tl-righe li.no .d{color:var(--rosso)}",
    ".tl-esito.stretto{gap:5px}.tl-esito.stretto .tl-reaz{width:48px;height:48px}.tl-esito.stretto .tl-verdetto{font-size:1.3rem}.tl-esito.stretto .tl-delta{font-size:1rem;padding:2px 12px}",
    ".tl-esito.stretto .tl-desc-es{font-size:.78rem;line-height:1.3}",
    ".tl-tutti .an{flex:0 0 auto;font-size:.72rem;font-weight:800;color:var(--testo-tenue)}",
    ".tl-ricordo{font-size:.72rem;font-weight:800;opacity:.92;margin-top:4px;position:relative}",
    // «📸 I nostri ricordi»: il tasto in saletta e il foglio per scriverli
    ".tl-ric-btn{width:100%;margin-top:6px}",
    ".tl-ric-form{display:flex;gap:6px;align-items:stretch}",
    ".tl-ric-form .link-campo{margin:0}",
    ".tl-ric-form .t{flex:1;min-width:0}",
    ".tl-ric-form .a{flex:0 0 74px;width:74px;text-align:center}",
    ".tl-ric-lista{display:flex;flex-direction:column;gap:5px;margin-top:8px;max-height:34vh;overflow-y:auto}",
    ".tl-ric-voce{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;border-radius:12px;background:rgba(255,255,255,.07);font-weight:700;font-size:.88rem}",
    ".tl-ric-voce b{flex:0 0 auto;color:var(--accento)}",
    ".tl-ric-voce span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tl-ric-voce button{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font:inherit;font-weight:900;cursor:pointer}",
    // «📆 Epoca» nelle impostazioni: le scelte in due colonne (l'ultima, "Scegli tu", larga) e la linea con due maniglie
    ".tl-ep-chips{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".tl-ep-chips .modo-chip{gap:8px;padding:10px;min-height:0}.tl-ep-chips .modo-chip .mi{font-size:1.4rem}.tl-ep-chips .modo-chip .mt{font-size:.95rem}.tl-ep-chips .modo-chip .ms{font-size:.78rem}",
    ".tl-ep-chips .modo-chip:last-child{grid-column:1/-1}.tl-ep-chips .modo-chip .ms.poche{color:var(--rosso);font-weight:800}",
    ".tl-ep{margin-top:10px;padding:12px 14px 10px;border-radius:16px;background:var(--carta)}",
    ".tl-ep-righe{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}",
    ".tl-ep-val{display:flex;align-items:center;gap:5px}.tl-ep-val .n{min-width:1.9em;font-size:.85rem;font-weight:700;color:var(--testo-tenue)}",
    ".tl-ep-val .v{min-width:4.6em;text-align:center;font-size:1.05rem;font-weight:900;color:var(--accento)}",
    ".tl-ep-val .pa{width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.2rem;font-weight:900;cursor:pointer;padding:0;line-height:1}",
    ".tl-ep-val .pa:active{transform:scale(.92)}",
    ".tl-ep-pista{position:relative;height:44px;margin:6px 12px 0;touch-action:none;cursor:pointer}",
    ".tl-ep-pista:before{content:'';position:absolute;left:0;right:0;top:20px;height:4px;border-radius:4px;background:rgba(255,255,255,.2)}",
    ".tl-ep-pieno{position:absolute;top:20px;height:4px;border-radius:4px;background:var(--accento)}",
    ".tl-ep-man{position:absolute;top:9px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:#fff;border:4px solid var(--accento);box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none}",
    ".tl-ep-tacche{position:relative;height:16px;margin:0 12px;font-size:.68rem;font-weight:700;color:var(--testo-tenue)}",
    ".tl-ep-tacche span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}.tl-ep-tacche span.pri{transform:none}.tl-ep-tacche span.ult{transform:translateX(-100%)}",
    ".tl-ep-conta{margin-top:8px;text-align:center;font-size:.85rem;font-weight:700;color:var(--testo-tenue)}.tl-ep-conta.poche{color:var(--rosso)}",
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
  // «📆 Scegli l'epoca» (26 ott 2026): gli anni delle carte in gioco. imp.epoca = "tutta", "antica", "900", "80" o "mia"
  // (gli anni a scelta: imp.da, imp.a); null = senza limite. Se in quegli anni ci sono meno di EPOCA_MIN carte, l'epoca non conta
  var ANNO_ORA = new Date().getFullYear(), ANNO_MIN = -3500, EPOCA_MIN = 12;
  var EPOCHE = { tutta: [null, null], antica: [null, 1899], "900": [1900, 1999], "80": [1980, null] };
  var EPOCHE_SCELTE = [["tutta", "🌍", "Tutta la storia"], ["antica", "🏛️", "Prima del 1900"], ["900", "📻", "Il Novecento"],
    ["80", "📱", "Dal 1980 a oggi"], ["mia", "✏️", "Scegli tu gli anni"]];
  function limitiEpoca(imp) {
    imp = imp || {};
    if (imp.epoca === "mia") return [imp.da != null && isFinite(+imp.da) && +imp.da > ANNO_MIN ? +imp.da : null, imp.a != null && isFinite(+imp.a) && +imp.a < ANNO_ORA ? +imp.a : null];
    return EPOCHE[imp.epoca] || [null, null];
  }
  function nellEpoca(lim, anno) { return (lim[0] == null || anno >= lim[0]) && (lim[1] == null || anno <= lim[1]); }
  // l'epoca che vale davvero: con meno di EPOCA_MIN carte (con queste categorie) non conta, e lo dicono anche le regole
  function epocaAttiva(imp) {
    var lim = limitiEpoca(imp);
    if (lim[0] == null && lim[1] == null) return lim;
    return contaCarte(imp && imp.categorie, lim) >= EPOCA_MIN ? lim : [null, null];
  }
  // "dal 1980 a oggi", "dal 452 a.C. al 1800", "prima del 1900", "il Novecento" (per la riga delle regole)
  function testoEpoca(imp) {
    var lim = epocaAttiva(imp);
    if (lim[0] == null && lim[1] == null) return "";
    if (imp.epoca === "900") return "il Novecento";
    if (lim[0] == null) return imp.epoca === "antica" ? "prima del 1900" : "fino al " + annoTesto(lim[1]);
    return (lim[0] === 0 ? "dall'anno 0" : "dal " + annoTesto(lim[0])) + (lim[1] == null ? " a oggi" : " al " + annoTesto(lim[1]));
  }
  function pescaDati(imp) {
    var cats = window.SG_CATEGORIE || [];
    var scelte = (imp && imp.categorie) || null;
    var attive = cats.filter(function (c) { return !scelte || scelte.indexOf(c.id) >= 0; });
    if (!attive.length) attive = cats;
    var d = []; attive.forEach(function (c) { (c.eventi || []).forEach(function (e) {
      var x = {}; for (var k in e) x[k] = e[k]; x._cat = c.id; d.push(x);   // la carta ricorda la sua categoria (trofei)
    }); });
    var lim = epocaAttiva(imp);
    if (lim[0] != null || lim[1] != null) d = d.filter(function (e) { return nellEpoca(lim, e.anno); });
    return d;
  }
  // quante carte ci sono con queste categorie in questi anni (per le impostazioni)
  function contaCarte(scelte, lim) {
    var n = 0;
    (window.SG_CATEGORIE || []).forEach(function (c) {
      if (scelte && scelte.indexOf(c.id) < 0) return;
      (c.eventi || []).forEach(function (e) { if (nellEpoca(lim, e.anno)) n++; });
    });
    return n;
  }
  // trofeo "tutte e 5 le categorie": le 5 storiche (le categorie nuove non lo rendono più difficile)
  var CINQUE = ["storia", "invenzioni", "calcio", "rap", "cinema"];
  function tutteLeCategorie(imp) {
    var scelte = imp && imp.categorie, e = epocaAttiva(imp);
    if (e[0] != null || e[1] != null) return false;   // (con un'epoca le categorie non sono più tutte intere)
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
  // sulla carta di un altro: «👍 Passo» conta come 👍 (giusto se aveva ragione lui), «✋ Rubala» come 👎 (giusto solo se presa)
  // (i trofei dei voti restano così finché il proprietario non decide quelli nuovi delle rubate)
  function tVoto(T, detto, giusto) {
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
  // i posti dicono tra quali anni: "Prima del 1950", "Tra il 1982 e il 1994", "Dopo il 2010"
  function etichettaSlot(linea, i) {
    if (!linea.length) return "Metti qui";
    if (i === 0) return "Prima del " + annoTesto(linea[0].anno);
    if (i >= linea.length) return "Dopo il " + annoTesto(linea[linea.length - 1].anno);
    var a = linea[i - 1].anno, b = linea[i].anno;
    return a === b ? "Nel " + annoTesto(a) : "Tra il " + annoTesto(a) + " e il " + annoTesto(b);
  }
  // quanti anni di sbaglio (la distanza dal posto scelto), e i vicini del posto giusto ("dove andava")
  function erroreAnni(linea, gap, Y) {
    if (gap == null || gap < 0) return null;
    var a = gap > 0 ? linea[gap - 1].anno : null, b = gap < linea.length ? linea[gap].anno : null;
    if (a != null && Y < a) return a - Y;
    if (b != null && Y > b) return Y - b;
    return 0;
  }
  function viciniGiusti(linea, Y) {
    var i = 0; while (i < linea.length && linea[i].anno <= Y) i++;
    function x(e) { return e ? { anno: e.anno, titolo: e.titolo, cat: e._cat || e.cat || "" } : null; }
    return { prima: x(linea[i - 1]), dopo: x(linea[i]) };
  }
  // i limiti dell'anno da dire per un posto (le ends: gli anni più lontani della partita)
  function limitiPosto(linea, gap, anni) {
    var lo = anni ? anni[0] : -3000, hi = anni ? anni[1] : new Date().getFullYear();
    if (gap > 0 && linea[gap - 1]) lo = linea[gap - 1].anno;
    if (gap < linea.length && linea[gap]) hi = linea[gap].anno;
    if (hi < lo) hi = lo;
    return [lo, hi];
  }
  function anniDi(carte) {
    var lo = null, hi = null;
    (carte || []).forEach(function (e) { if (e && typeof e.anno === "number") { if (lo == null || e.anno < lo) lo = e.anno; if (hi == null || e.anno > hi) hi = e.anno; } });
    var ora = new Date().getFullYear();
    return [lo == null ? -3000 : lo, Math.max(hi == null ? ora : hi, ora)];
  }
  // «📅 Dimmi l'anno»: il bonus per quanto ci si è avvicinati (null = niente)
  function bonusAnno(detto, Y) {
    if (detto == null || typeof detto !== "number") return 0;
    var d = Math.abs(detto - Y);
    return d === 0 ? BONUS_ESATTO : (d <= VICINO ? BONUS_VICINO : 0);
  }
  function annoValido(v) { v = Math.round(+v); return isFinite(v) && v >= -10000 && v <= 3000 ? v : null; }

  // ---- Niente carte già viste: sul telefono di chi tiene il mazzo (host o telefono solo) restano le carte uscite (60 giorni).
  // Si pescano prima quelle mai viste; quando una categoria è finita, la si ricomincia da capo.
  var VISTE = "sg-tl-viste", VITA_VISTE = 60 * 86400000;
  function leggiViste() {
    try { var v = JSON.parse(localStorage.getItem(VISTE) || "null"); if (v && typeof v === "object") return v; } catch (e) {}
    return {};
  }
  function scriviViste(v) { try { localStorage.setItem(VISTE, JSON.stringify(v)); } catch (e) {} }
  function segnaVista(carta) {
    if (!carta) return;
    var v = leggiViste(); v[chiaveEv(carta)] = Date.now(); scriviViste(v);
  }
  // il mazzo nuovo: in cima (in fondo all'array: si pesca con pop) quelle mai viste, sotto quelle già viste
  function mazzoNuovo(imp) {
    var tutte = pescaDati(imp), v = leggiViste(), ora = Date.now(), cambiato = false, k;
    for (k in v) if (!(ora - v[k] < VITA_VISTE)) { delete v[k]; cambiato = true; }
    var perCat = {};
    tutte.forEach(function (e) { (perCat[e._cat] = perCat[e._cat] || []).push(e); });
    for (var c in perCat) {   // categoria finita: si ricomincia (le sue carte tornano "mai viste")
      if (perCat[c].every(function (e) { return v[chiaveEv(e)]; })) { perCat[c].forEach(function (e) { delete v[chiaveEv(e)]; }); cambiato = true; }
    }
    if (cambiato) scriviViste(v);
    var nuove = [], viste = [];
    tutte.forEach(function (e) { (v[chiaveEv(e)] ? viste : nuove).push(e); });
    viste.sort(function (a, b) { return v[chiaveEv(b)] - v[chiaveEv(a)]; });   // le più vecchie più in alto
    return viste.concat(mischiaArr(nuove));
  }

  // ---- «📸 I nostri ricordi»: fatti del gruppo con l'anno ("2019|Il viaggio a Ibiza"), sul profilo di chi li scrive ----
  var LISTA_RIC = "timeline-ricordi", RIC_LOCALE = "sg-tl-ricordi";
  function pulisciRicordo(s) {
    var p = String(s || "").split("|"), anno = parseInt(p[0], 10), tit = p.slice(1).join("|").replace(/\s+/g, " ").trim();
    var ora = new Date().getFullYear();
    if (!(anno >= ANNO_RICORDI && anno <= ora) || tit.length < 3) return null;
    return anno + "|" + tit.slice(0, LUNGO_RICORDO);
  }
  function leggiRicordi(lista) {
    var out = [], visti = {};
    (Array.isArray(lista) ? lista : []).forEach(function (s) {
      var r = pulisciRicordo(s); if (!r || out.length >= MAX_RICORDI) return;
      var k = r.split("|").slice(1).join("|").toLowerCase(); if (visti[k]) return;
      visti[k] = 1; out.push(r);
    });
    return out;
  }
  function mieiRicordi() {
    var l = null;
    try { if (window.SG && SG.listaProfilo && window.SGNube && SGNube.profilo && SGNube.profilo()) l = SG.listaProfilo(LISTA_RIC); } catch (e) {}
    if (!l || !l.length) { try { var x = JSON.parse(localStorage.getItem(RIC_LOCALE) || "null"); if (Array.isArray(x) && (!l || !l.length)) l = x; } catch (e) {} }
    return leggiRicordi(l || []);
  }
  function salvaRicordi(lista) {
    lista = leggiRicordi(lista);
    try { if (window.SG && SG.salvaListaProfilo && window.SGNube && SGNube.profilo && SGNube.profilo()) SG.salvaListaProfilo(LISTA_RIC, lista.slice()); } catch (e) {}
    try { localStorage.setItem(RIC_LOCALE, JSON.stringify(lista)); } catch (e) {}
    return lista;
  }
  // da "2019|Il viaggio a Ibiza" a una carta della partita (categoria "Noi")
  function cartaRicordo(s, autoreId, autoreNome) {
    var p = String(s).split("|");
    return { anno: parseInt(p[0], 10), titolo: p.slice(1).join("|"), fatto: autoreNome ? "📸 Un ricordo di " + autoreNome : "📸 Un vostro ricordo",
      _cat: "noi", autore: autoreId || null, autoreNome: autoreNome || null };
  }
  // i ricordi entrano nel mazzo: al massimo una carta su 3 di quelle che si giocheranno, sparse (prima quelle mai viste)
  function mescolaRicordi(mazzo, ricordi, quante) {
    if (!ricordi || !ricordi.length || quante < 1) return mazzo;
    var v = leggiViste(), nuovi = [], visti = [];
    mischiaArr(ricordi).forEach(function (r) { (v[chiaveEv(r)] ? visti : nuovi).push(r); });
    var n = Math.min(ricordi.length, Math.max(1, Math.round(quante / 3)));
    var scelti = nuovi.concat(visti).slice(0, n);
    var resto = Math.max(0, quante - scelti.length);
    var cima = mazzo.splice(Math.max(0, mazzo.length - resto), resto);
    return mazzo.concat(mischiaArr(cima.concat(scelti)));
  }
  function testoBtnRicordi(miei, gruppo) {
    var t = "📸 I nostri ricordi";
    if (gruppo != null && gruppo > 0) t += ": " + fmtN(gruppo);
    else if (miei) t += " · " + (miei === 1 ? "1 tuo" : fmtN(miei) + " tuoi");
    else t += " · scrivine uno ✍️";
    return t;
  }
  // il foglio per scriverli: "Il viaggio a Ibiza" + 2019 → ➕; ognuno con la sua ✕. opz: { telefono, dopo(lista), vivo() }
  function foglioRicordi(el, opz) {
    if (document.querySelector(".sl-velo")) return;
    var lista = mieiRicordi(), velo, tic, ora = new Date().getFullYear();
    function chiudi() { clearInterval(tic); if (velo.parentNode) velo.parentNode.removeChild(velo); }
    var tit = el("input", { type: "text", class: "link-campo t", maxlength: String(LUNGO_RICORDO), placeholder: "Il viaggio a Ibiza", autocomplete: "off", enterkeyhint: "next" });
    var an = el("input", { type: "text", class: "link-campo a", inputmode: "numeric", maxlength: "4", placeholder: String(ora - 3), autocomplete: "off", enterkeyhint: "done" });
    var esito = el("p", { class: "modulo-nota" }), elenco = el("div", { class: "tl-ric-lista" }), conta = el("p", { class: "modulo-nota" });
    function disegna() {
      while (elenco.firstChild) elenco.removeChild(elenco.firstChild);
      lista.forEach(function (s, i) {
        var p = s.split("|");
        elenco.appendChild(el("div", { class: "tl-ric-voce" }, [ el("b", { text: p[0] }), el("span", { text: p.slice(1).join("|") }),
          el("button", { type: "button", "aria-label": "Cancella", text: "✕", onclick: function () { lista.splice(i, 1); lista = salvaRicordi(lista); disegna(); if (opz.dopo) opz.dopo(lista); } }) ]));
      });
      conta.textContent = lista.length ? (lista.length === 1 ? "1 ricordo" : fmtN(lista.length) + " ricordi") + " (al massimo " + MAX_RICORDI + ")" : "Ancora nessun ricordo.";
    }
    function aggiungi() {
      var a = parseInt(an.value, 10), t = String(tit.value || "").replace(/\s+/g, " ").trim();
      if (t.length < 3) { esito.textContent = "✍️ Scrivi cosa è successo (almeno 3 lettere)."; tit.focus(); return; }
      if (!(a >= ANNO_RICORDI && a <= ora)) { esito.textContent = "📅 Scrivi l'anno (dal " + ANNO_RICORDI + " al " + ora + ")."; an.focus(); return; }
      if (lista.length >= MAX_RICORDI) { esito.textContent = "Ne hai già " + MAX_RICORDI + ": cancellane uno con la ✕."; return; }
      var r = pulisciRicordo(a + "|" + t);
      if (!r) return;
      if (lista.some(function (x) { return x.split("|").slice(1).join("|").toLowerCase() === r.split("|").slice(1).join("|").toLowerCase(); })) { esito.textContent = "Questo c'è già."; return; }
      lista.unshift(r); lista = salvaRicordi(lista);
      tit.value = ""; an.value = ""; esito.textContent = "✅ Aggiunto: diventa una carta della partita!";
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
      disegna(); if (opz.dopo) opz.dopo(lista);
      tit.focus();
    }
    tit.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); an.focus(); } });
    an.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); aggiungi(); } });
    velo = el("div", { class: "sl-velo tl-ric-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "📸 I nostri ricordi" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [
          el("p", { class: "modulo-nota", text: opz.telefono
            ? "Fatti del vostro gruppo con l'anno («La prima asta del fanta», 2021). Diventano carte della partita, mescolate alle altre. 🤫 Chi scrive non li fa vedere!"
            : "Fatti del vostro gruppo con l'anno («Il viaggio a Ibiza», 2019). Diventano carte della partita: il tuo non lo giochi tu, lo giocano gli altri. Restano sul tuo profilo per le prossime sere." }),
          el("div", { class: "tl-ric-form" }, [ tit, an, el("button", { class: "btn btn-primario btn-piccolo", type: "button", text: "➕", "aria-label": "Aggiungi", onclick: aggiungi }) ]),
          esito, conta, elenco ]),
        el("button", { class: "btn btn-primario", text: "👍 Fatto", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
    disegna();
    // la saletta se ne va (la partita parte): il foglio si chiude da solo
    if (opz.vivo) tic = setInterval(function () { if (!opz.vivo()) chiudi(); }, 400);
  }
  // a turno: il tuo ricordo non lo giochi tu (lo sai già): si scambia con la prima carta sotto che non è tua
  function evitaAutore(mazzo, id) {
    var top = mazzo.length - 1; if (top < 0 || !id || !mazzo[top] || mazzo[top].autore !== id) return;
    for (var j = top - 1; j >= Math.max(0, top - 30); j--) if (mazzo[j].autore !== id) { var x = mazzo[j]; mazzo[j] = mazzo[top]; mazzo[top] = x; return; }
  }

  // ---- Colori e icone delle categorie, avatar dei giocatori ----
  var COL_CAT = { storia: ["#f2a93b", "#9a560b"], calcio: ["#2fc071", "#0f6a3d"], cinema: ["#ff5b73", "#8e1c3c"],
    invenzioni: ["#48a2ff", "#1d4e9e"], rap: ["#c56bff", "#5b1f8d"],
    musica: ["#ff8a3d", "#a8410c"], tv: ["#36d1c4", "#0d6e66"], giochi: ["#9fd83a", "#41700c"], sport: ["#ff6fb5", "#8a1658"], italia: ["#e8484f", "#1f7a3c"],
    noi: ["#ff7eb6", "#6a2bb8"] };
  function colCat(id) { return COL_CAT[id] || ["#ffca3a", "#9a6b00"]; }
  function infoCat(id) {
    if (id === "noi") return { icona: "📸", nome: "I nostri ricordi" };
    var c = (window.SG_CATEGORIE || []).filter(function (x) { return x.id === id; })[0];
    return c ? { icona: c.icona || "📜", nome: c.nome } : { icona: "📜", nome: "Avvenimento" };
  }
  function stileCat(id) { var c = colCat(id); return "--c1:" + c[0] + ";--c2:" + c[1]; }

  // ---- Memoria tra un ridisegno e l'altro (online si ridisegna a ogni novità) ----
  // così la linea non torna in cima e il punto scelto resta scelto
  var memScroll = { k: null, top: 0 }, memSel = { k: null, gap: null }, memAnno = { k: null, v: null };
  function chiaveCarta(carta) { return carta ? carta.titolo : ""; }

  // La carta da piazzare
  // ---- Le foto vere delle carte (data/linea-foto.js: da Wikimedia Commons, foto libere guardate a occhio, 26 ott 2026) ----
  // "cat|titolo" → "percorso su Commons|larghezza dell'originale". Una misura sola (330 px, una di quelle fisse di Wikimedia):
  // la stessa foto serve alla carta in mano e alla linea, e il telefono la scarica una volta. Senza foto la carta resta com'era
  var COMMONS = "https://upload.wikimedia.org/wikipedia/commons/", FOTO_PX = 330, PRESE = {};
  function urlFoto(ev) {
    var f = ev && ev.titolo && (window.SG_TL_FOTO || {})[(ev._cat || ev.cat || "") + "|" + ev.titolo];
    if (!f) return null;
    var s = String(f).split("|"), path = s[0], w = +s[1] || 0, nome = path.split("/").pop();
    if (!/^[0-9a-f]\/[0-9a-f]{2}\/./.test(path)) return null;
    var enc = path.split("/").map(encodeURIComponent).join("/");
    return w && w <= FOTO_PX ? COMMONS + enc : COMMONS + "thumb/" + enc + "/" + FOTO_PX + "px-" + encodeURIComponent(nome);
  }
  // si scarica prima (la carta di adesso e quella dopo), così quando la carta compare la foto c'è già
  function precaricaFoto(ev) { var u = urlFoto(ev); if (u && !PRESE[u]) { PRESE[u] = new Image(); PRESE[u].src = u; } }
  // la foto (o niente); se non arriva si toglie e la carta resta solo scritta
  function nodoFoto(el, ev, cls) {
    var u = urlFoto(ev); if (!u) return null;
    var im = el("img", { class: cls, alt: "", draggable: "false", decoding: "async" });
    im.onerror = function () { var p = im.parentNode; if (p) { p.removeChild(im); p.classList.remove("con-foto"); } };
    im.src = u;
    return im;
  }
  // cambia: la funzione del tasto «🔄 Cambia» (una volta a partita, al proprio turno), o niente
  function nodoCartaMano(el, carta, occhiello, cambia) {
    var cat = carta._cat || carta.cat, ic = infoCat(cat), ft = nodoFoto(el, { cat: cat, titolo: carta.titolo }, "ft");
    return el("div", { class: "tl-mano" + (ft ? " con-foto" : "") + (cambia ? " con-cambia" : ""), style: stileCat(cat) }, [
      ft,
      el("div", { class: "fil", text: ic.icona }),
      el("div", { class: "testa" }, [ el("span", { class: "cat" }, [ ic.icona, el("span", { class: "cn", text: " " + ic.nome }) ]),
        cambia ? el("button", { class: "cambia", type: "button", text: "🔄 Cambia", "aria-label": "Cambia carta (una volta a partita)",
          onclick: function (e) { e.currentTarget.disabled = true; cambia(); } }) : null,
        el("span", { class: "anno", text: "????" }) ]),
      el("div", { class: "tit", text: carta.titolo }),   // la spiegazione si legge solo dopo il risultato (a volte suggerisce la data)
      cat === "noi" ? el("div", { class: "tl-ricordo", text: carta.autoreNome ? "📸 Un ricordo di " + carta.autoreNome : "📸 Un vostro ricordo" }) : null
    ]);
  }
  // Un avvenimento sulla linea (tent = messo lì per prova, anno ancora segreto; chi = la riga "📍 L'ha messa qui Paky")
  function nodoEvento(el, ev, tent, cls, chi) {
    var cat = ev._cat || ev.cat, ic = infoCat(cat);
    return el("div", { class: "tl-ev" + (tent ? " tent" : "") + (cls ? " " + cls : ""), style: stileCat(cat) }, [
      el("span", { class: "anno", text: tent ? "?" : annoTesto(ev.anno) }),
      el("span", { class: "punto" }),
      el("div", { class: "card" }, [
        nodoFoto(el, ev, "ft"),
        el("div", { class: "tit" }, [ el("span", { class: "ic", text: ic.icona }), el("span", { text: ev.titolo }) ]),
        (!tent && ev.fatto) ? el("div", { class: "desc", text: ev.fatto }) : null,
        chi ? el("div", { class: "chi", text: chi }) : null
      ])
    ]);
  }
  // La linea del tempo verticale.
  //  opts.scegli(gap)  -> mostra i punti "metti qui"; toccarne uno ci mette la carta (fantasma)
  //  opts.tent         -> la carta messa per prova in quel punto (✋ si ruba); con scegli: lì niente "metti qui"
  //  opts.tentChi      -> sotto la carta messa per prova: chi l'ha messa lì
  //  opts.fantChi      -> sotto il fantasma: "✋ Secondo te va qui" (il fantasma di chi ruba è rosso)
  //  opts.marca        -> false: toccare un punto non ci mette il fantasma (✋ sullo stesso telefono: il punto dice chi ruba)
  //  opts.carta        -> la carta in gioco (per il fantasma)
  //  opts.sel          -> punto già scelto (dopo un ridisegno)
  //  opts.nuovo        -> titolo dell'avvenimento appena entrato (si illumina)
  // Restituisce l'asse; asse.slots = i punti (per aggiornarli senza ridisegnare)
  function nodoLinea(el, linea, opts) {
    opts = opts || {};
    var asse = el("div", { class: "tl-asse" }), slots = [], marca = opts.marca !== false;
    var fantasma = opts.carta ? { titolo: opts.carta.titolo, cat: opts.carta._cat || opts.carta.cat } : null;
    function slot(i) {
      var lab = etichettaSlot(linea, i);
      var b = el("button", { class: "tl-slot", onclick: function () {
        if (marca) { slots.forEach(function (x) { if (x) x.classList.remove("sel"); }); b.classList.add("sel"); }
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
        opts.scegli(i);
      } }, [ el("span", { class: "piu", text: "+" }), el("span", { class: "lab", text: lab }),
        fantasma && marca ? nodoEvento(el, fantasma, true, "fant" + (opts.fantChi ? " ruba" : ""), opts.fantChi || null) : null ]);
      if (marca && opts.sel === i) b.classList.add("sel");
      slots[i] = b; return b;
    }
    // il posto i (prima della carta i): la carta messa per prova, o il punto da toccare
    function posto(i) {
      if (opts.tent === i && fantasma) asse.appendChild(nodoEvento(el, fantasma, true, null, opts.tentChi || null));
      else if (opts.scegli) asse.appendChild(slot(i));
    }
    linea.forEach(function (ev, i) {
      posto(i);
      asse.appendChild(nodoEvento(el, ev, false, opts.nuovo && ev.titolo === opts.nuovo ? "nuovo" : ""));
    });
    posto(linea.length);
    asse.slots = slots;
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
  // «📅 Dimmi l'anno»: [−10] [−1] [anno] [+1] [+10] e sotto il cursore per i salti lunghi.
  // opz: { lo, hi, valore, spento, segnaposto, onCambia(v) }. Restituisce il nodo con .imposta(lo, hi), .valore(), .accendi(si)
  function selettoreAnno(el, opz) {
    var lo = opz.lo, hi = opz.hi, val = null, verso = opz.verso || null;
    var box = el("div", { class: "tl-anno" + (opz.spento ? " spento" : "") });
    var inp = el("input", { class: "v", type: "text", inputmode: "numeric", maxlength: "9", autocomplete: "off", placeholder: opz.segnaposto || "📅 L'anno? (facoltativo)", "aria-label": "Anno" });
    var sl = el("input", { class: "sl", type: "range", step: "1", "aria-label": "Scorri gli anni" });
    // dove parte il cursore (l'anno non è ancora detto): a metà; prima della prima carta vicino a lei, dopo l'ultima vicino a lei
    function inizio() {
      if (hi - lo > 120 && verso === "giu") return Math.max(lo, hi - 20);
      if (hi - lo > 120 && verso === "su") return Math.min(hi, lo + 10);
      return Math.round((lo + hi) / 2);
    }
    function scriviInp() { var tx = val == null ? "" : annoTesto(val); if (document.activeElement !== inp && inp.value !== tx) inp.value = tx; }
    function metti(v, daCursore) {
      v = Math.max(lo, Math.min(hi, Math.round(v)));
      val = v; box.classList.add("ha");
      if (!daCursore) sl.value = String(v);
      scriviInp();
      if (opz.onCambia) opz.onCambia(v);
    }
    function imposta(a, b, v) {
      lo = Math.min(a, b); hi = Math.max(a, b); verso = v || null;
      sl.min = String(lo); sl.max = String(hi);
      if (val != null && (val < lo || val > hi)) { val = null; box.classList.remove("ha"); if (opz.onCambia) opz.onCambia(null); }
      sl.value = String(val != null ? val : inizio());
      scriviInp();
    }
    function leggi(s) {
      s = String(s || "").toLowerCase().replace(/\s+/g, "");
      var ac = /a\.?c/.test(s), n = parseInt(s.replace(/[^\d-]/g, ""), 10);
      if (!isFinite(n)) return null;
      return ac ? -Math.abs(n) : n;
    }
    sl.addEventListener("input", function () { metti(+sl.value, true); });
    inp.addEventListener("focus", function () { if (val != null) inp.value = String(val); try { inp.select(); } catch (e) {} });
    // mentre si scrive: appena l'anno è dentro i limiti vale già (il tasto lo dice)
    inp.addEventListener("input", function () {
      var v = leggi(inp.value);
      if (v != null && v >= lo && v <= hi && v !== val) { val = v; box.classList.add("ha"); sl.value = String(v); if (opz.onCambia) opz.onCambia(v); }
    });
    inp.addEventListener("blur", function () { var v = leggi(inp.value); if (v != null) metti(v); else scriviInp(); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); inp.blur(); } });
    function tasto(tx, d) { return el("button", { class: "pa", type: "button", text: tx, onclick: function () { metti(val == null ? inizio() : val + d); } }); }
    box.appendChild(el("div", { class: "riga" }, [ tasto("−10", -10), tasto("−1", -1), inp, tasto("+1", 1), tasto("+10", 10) ]));
    box.appendChild(sl);
    imposta(lo, hi, verso);
    if (opz.valore != null) metti(opz.valore);
    box.imposta = imposta;
    // (mentre si scrive: l'anno scritto vale già, senza richiamare onCambia)
    box.valore = function () {
      if (inp.ownerDocument.activeElement === inp) { var v = leggi(inp.value); if (v != null) { val = Math.max(lo, Math.min(hi, Math.round(v))); box.classList.add("ha"); sl.value = String(val); } }
      return val;
    };
    box.accendi = function (si) { box.classList.toggle("spento", !si); };
    return box;
  }
  // «📆 Scegli tu gli anni»: la linea con due maniglie (dal… al…), più ‹ › per gli aggiustamenti. Gli anni non sono larghi
  // uguali: le carte sono quasi tutte dal 1900 in poi, quindi lì ogni anno ha più spazio, e prima si va a salti
  // (50 anni prima di Cristo, 10 fino al 1500, 5 fino al 1900). SCALA = [da, a, posizione da, posizione a, salto]
  var SCALA = [[ANNO_MIN, 0, 0, 0.12, 50], [0, 1500, 0.12, 0.27, 10], [1500, 1900, 0.27, 0.45, 5], [1900, ANNO_ORA, 0.45, 1, 1]];
  function annoDaPos(p) {
    p = Math.max(0, Math.min(1, p));
    for (var i = 0; i < SCALA.length; i++) {
      var s = SCALA[i];
      if (p <= s[3] || i === SCALA.length - 1) return Math.max(ANNO_MIN, Math.min(ANNO_ORA, Math.round((s[0] + (p - s[2]) / (s[3] - s[2]) * (s[1] - s[0])) / s[4]) * s[4]));
    }
  }
  function posDaAnno(y) {
    for (var i = 0; i < SCALA.length; i++) { var s = SCALA[i]; if (y <= s[1] || i === SCALA.length - 1) return Math.max(0, Math.min(1, s[2] + (y - s[0]) / (s[1] - s[0]) * (s[3] - s[2]))); }
  }
  function saltoAnno(y, verso) { for (var i = 0; i < SCALA.length; i++) if (verso > 0 ? y < SCALA[i][1] : y <= SCALA[i][1]) return SCALA[i][4]; return 1; }
  // dove = le impostazioni (dove.da, dove.a, dove.categorie); restituisce il nodo con .aggiorna() (anche dopo un cambio di categorie)
  function pistaEpoca(el, dove) {
    var box = el("div", { class: "tl-ep" }), conta = el("div", { class: "tl-ep-conta" });
    var pista = el("div", { class: "tl-ep-pista" }), pieno = el("div", { class: "tl-ep-pieno" });
    var man = { da: el("span", { class: "tl-ep-man" }), a: el("span", { class: "tl-ep-man" }) }, val = {}, nome = {};
    pista.appendChild(pieno); pista.appendChild(man.da); pista.appendChild(man.a);
    function testo(k) { var y = dove[k]; return k === "a" && y >= ANNO_ORA ? "oggi" : annoTesto(y); }
    function metti(k, y) {
      y = Math.max(ANNO_MIN, Math.min(ANNO_ORA, y));
      if (k === "da") y = Math.min(y, dove.a); else y = Math.max(y, dove.da);   // (le maniglie non si scavalcano)
      dove[k] = y; aggiorna();
    }
    function riga(k, nome0) {
      val[k] = el("b", { class: "v" }); nome[k] = el("span", { class: "n", text: nome0 });
      return el("div", { class: "tl-ep-val" }, [ nome[k],
        el("button", { class: "pa", type: "button", text: "‹", "aria-label": nome0 + ": prima", onclick: function () { metti(k, dove[k] - saltoAnno(dove[k], -1)); } }), val[k],
        el("button", { class: "pa", type: "button", text: "›", "aria-label": nome0 + ": dopo", onclick: function () { metti(k, dove[k] + saltoAnno(dove[k], 1)); } }) ]);
    }
    function aggiorna() {
      if (dove.da == null) dove.da = ANNO_MIN;
      if (dove.a == null) dove.a = ANNO_ORA;
      var pDa = posDaAnno(dove.da), pA = posDaAnno(dove.a);
      man.da.style.left = (pDa * 100).toFixed(2) + "%"; man.a.style.left = (pA * 100).toFixed(2) + "%";
      pieno.style.left = (pDa * 100).toFixed(2) + "%"; pieno.style.width = ((pA - pDa) * 100).toFixed(2) + "%";
      ["da", "a"].forEach(function (k) { var tx = testo(k); if (val[k].textContent !== tx) val[k].textContent = tx; });
      var na = dove.a >= ANNO_ORA ? "a" : "al"; if (nome.a.textContent !== na) nome.a.textContent = na;   // ("a oggi", "al 1800")
      var n = contaCarte(dove.categorie, [dove.da > ANNO_MIN ? dove.da : null, dove.a < ANNO_ORA ? dove.a : null]);
      var tc = n < EPOCA_MIN ? "⚠️ Solo " + fmtN(n) + (n === 1 ? " carta" : " carte") + ": allarga gli anni (se no si gioca con tutti)" : "📜 " + fmtN(n) + " carte in questi anni";
      if (conta.textContent !== tc) conta.textContent = tc;
      conta.classList.toggle("poche", n < EPOCA_MIN);
    }
    // trascinare: si muove la maniglia più vicina al dito (niente vibrazione: si sta scorrendo)
    var tiro = null;
    function annoDi(e) { var r = pista.getBoundingClientRect(); return annoDaPos((e.clientX - r.left) / Math.max(1, r.width)); }
    pista.addEventListener("pointerdown", function (e) {
      var y = annoDi(e), r = pista.getBoundingClientRect(), x = (e.clientX - r.left) / Math.max(1, r.width);
      tiro = Math.abs(x - posDaAnno(dove.da)) <= Math.abs(x - posDaAnno(dove.a)) ? "da" : "a";
      if (dove.da === dove.a) tiro = y < dove.da ? "da" : "a";
      try { pista.setPointerCapture(e.pointerId); } catch (er) {}
      metti(tiro, y); e.preventDefault();
    });
    pista.addEventListener("pointermove", function (e) { if (tiro) metti(tiro, annoDi(e)); });
    function lascia() { tiro = null; }
    pista.addEventListener("pointerup", lascia); pista.addEventListener("pointercancel", lascia);
    var tacche = el("div", { class: "tl-ep-tacche" });
    [[ANNO_MIN, annoTesto(ANNO_MIN)], [1500, "1500"], [1900, "1900"], [1950, "1950"], [ANNO_ORA, "oggi"]].forEach(function (t, i, l) {
      tacche.appendChild(el("span", { class: i === 0 ? "pri" : i === l.length - 1 ? "ult" : "", text: t[1], style: "left:" + (posDaAnno(t[0]) * 100).toFixed(2) + "%" }));
    });
    box.appendChild(el("div", { class: "tl-ep-righe" }, [ riga("da", "Dal"), riga("a", "al") ]));
    box.appendChild(pista); box.appendChild(tacche); box.appendChild(conta);
    box.aggiorna = aggiorna;
    aggiorna();
    return box;
  }
  // la barra in basso dei comandi: se è più alta del solito (anno, Rubala) il maxischermo lascia il posto giusto
  function barraTL(S, nodi) {
    barra(S, nodi);
    var misura = function () {
      var h = S.barraEl.offsetHeight;
      if (h > 120) { S.vista.style.setProperty("--tl-barra", (h - 8) + "px"); S.vista.classList.add("tl-alta"); }
      else S.vista.classList.remove("tl-alta");
    };
    misura(); setTimeout(misura, 60);
  }

  // Il risultato: la carta si gira e svela l'anno, poi i punti e chi ha provato a rubarla
  // es = { giusto, anno, titolo, fatto, cat, nome, delta, scaduto, finito, ladro, ladri, presa, rubate:[{ nome, giusto, delta }] }
  // "Sbagliato di 12 anni!" / "😬 Per un pelo: 2 anni!"
  function testoErrore(n) {
    if (n == null) return "";
    if (n <= PELO) return "😬 Per un pelo: " + n + (n === 1 ? " anno!" : " anni!");
    return "Sbagliato di " + fmtN(n) + " anni!";
  }
  // "Giulia", "Giulia e Luca", "Giulia, Luca e Sara"
  function elenco(nomi) { return nomi.length < 2 ? (nomi[0] || "") : nomi.slice(0, -1).join(", ") + " e " + nomi[nomi.length - 1]; }
  // le righe sotto il risultato: l'anno detto da chi giocava e chi ha provato a rubarla senza riuscirci
  // (chi l'ha presa ha la sua scritta grande: «✋ Rubata da Giulia!»). es.rubate = [{ nome, giusto, delta }]
  function righeEsito(el, es) {
    var r = [];
    if (es.detto != null) {
      var b = es.bonusAnno || 0, dd = Math.abs(es.detto - es.anno);
      r.push(el("li", { class: b ? "si" : "" }, [ el("span", { class: "nm", text: "📅 " + es.nome + " diceva " + annoTesto(es.detto) }),
        el("span", { class: "d", text: b ? (dd === 0 ? "🎯 Esatto! +" : "Quasi! +") + fmtN(b) : (es.giusto ? "a " + fmtN(dd) + " anni" : "") }) ]));
    }
    var no = (es.rubate || []).filter(function (x) { return !x.giusto; });
    if (no.length) r.push(el("li", { class: "no" }, [
      el("span", { class: "nm", text: "✋ " + (es.giusto ? "Volevano rubarla: " : "Posto sbagliato: ") + elenco(no.map(function (x) { return x.nome; })) }),
      el("span", { class: "d", text: "−" + fmtN(Math.abs(no[0].delta)) + (no.length > 1 ? " a testa" : "") }) ]));
    return r.length ? el("ul", { class: "tl-righe" }, r) : null;
  }
  // "📍 Andava qui": la carta tra i suoi vicini veri (si illumina un attimo)
  function nodoDove(el, es) {
    if (es.giusto || es.ladro || (!es.prima && !es.dopo)) return null;
    function riga(e, qui) { return el("div", { class: "x" + (qui ? " qui" : ""), style: stileCat(e.cat) }, [ el("b", { text: annoTesto(e.anno) }), el("span", { text: (qui ? "👉 " : "") + e.titolo }) ]); }
    return el("div", { class: "tl-dove" }, [ el("div", { class: "tt", text: "📍 Andava qui" }),
      es.prima ? riga(es.prima) : null, riga({ anno: es.anno, titolo: es.titolo, cat: es.cat }, true), es.dopo ? riga(es.dopo) : null ]);
  }
  function nodoEsito(el, es, chi) {
    var ic = infoCat(es.cat), ok = !!es.giusto, preso = !!es.ladro;
    var righe = righeEsito(el, es), dove = nodoDove(el, es);
    var tanti = (dove ? 1 : 0) + (righe ? righe.childNodes.length : 0) + (es.finito ? 1 : 0);
    var delta = Math.abs(es.delta != null ? es.delta : PUNTI);
    var verd = es.scaduto ? "⏰ Tempo scaduto!" : (ok ? "✅ Esatto!" : "❌ Sbagliato");
    var box = el("div", { class: "tl-esito" + (tanti >= 2 ? " stretto" : "") }, [
      el("div", { class: "tl-flip " + (ok || preso ? "ok" : "ko") + (ok && !tanti ? "" : " media"), style: stileCat(es.cat) }, [
        el("div", { class: "tl-flip-in" }, [
          el("div", { class: "tl-flip-f" }, [ el("div", { class: "q", text: "?" }), el("div", { class: "tit", text: ic.icona + " " + es.titolo }) ]),
          // la carta si gira SEMPRE: anche quando è sbagliata si vede l'anno vero (e di quanto si è sbagliato)
          el("div", { class: "tl-flip-f retro" }, [ el("div", { class: "grande", text: annoTesto(es.anno) }), el("div", { class: "tit", text: es.titolo }),
            !ok && es.errore != null && !es.scaduto ? el("div", { class: "err", text: testoErrore(es.errore) }) : null ])
        ])
      ]),
      el("div", { class: "tl-reaz-riga" }, [
        chi ? el("span", { class: "tl-reaz", html: avatarDi(chi, ok ? "esulta" : "triste") }) : null,
        el("div", { class: "tl-verdetto " + (ok ? "giusto" : "sbagliato"), text: verd })
      ]),
      el("div", { class: "tl-delta " + (ok ? "su" : "giu"), text: (ok ? "+" : "−") + fmtN(delta) + " a " + es.nome + (es.doppio ? " 🔥" : "") }),
      preso ? el("div", { class: "tl-delta su", text: "✋ Rubata da " + es.ladro + "! +" + fmtN(es.presa || PUNTI) + (es.ladri > 1 ? " a testa" : "") }) : null,
      dove,
      righe,
      (es.fatto && tanti < 3) ? el("div", { class: "tl-desc-es", text: es.fatto }) : null,
      es.finito ? el("div", { class: "tl-finito", text: "🎉 " + es.nome + " ha finito le sue carte!" }) : null
    ]);
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
    var targa = opz.online && conTarga(t);   // chi guarda soltanto: faccine e uscita le dà la targhetta del core
    var fa = opz.online && !targa && t.faccine ? t.faccine() : null;   // online: le faccine, mentre si guarda la classifica
    if (fa) { fa.classList.add("tl-faccine"); s._contenuto.appendChild(fa); }
    if (!targa) FX.vittoria();   // (chi guarda non ha vinto niente: niente fanfara)
    setTimeout(coriandoli, 300);
    if (targa) s.classList.add("tl-con-targa");
    if (comuni || targa) { t.mostra(s); return; }
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
  // o: { giocatori, turnoId, stato, sotto, rimMs, onScaduto, carta, linea, scegli, sel, tent, tentChi, fantChi, marca, nuovo, chiave }
  // restituisce l'asse della linea (asse.slots: i punti da toccare)
  function schermoGioco(S, o) {
    var el = S.t.el, sch = S.sch;
    fermaTimer(S); vuota(sch);
    sch.appendChild(nodoTop(el, o.giocatori, o.turnoId));
    sch.appendChild(el("div", { class: "tl-stato" }, [ el("div", {}, [ el("span", { text: o.stato }), o.sotto ? el("small", { text: o.sotto }) : null ]) ]));
    if (o.rimMs != null) { var tot = o.totMs || TEMPO * 1000; S.timer = barraTimer(el, Math.min(tot, Math.max(0, o.rimMs)), tot, o.onScaduto || null); sch.appendChild(S.timer); }
    sch.appendChild(o.pannello || nodoCartaMano(el, o.carta || { titolo: "" }, null, o.cambia || null));   // pannello: al posto della carta (si ruba tutti insieme)
    var z = el("div", { class: "tl-scroll" }), k = o.chiave;
    z.addEventListener("scroll", function () { memScroll = { k: k, top: z.scrollTop }; }, { passive: true });
    var asse = nodoLinea(el, o.linea || [], { carta: o.carta, scegli: o.scegli, sel: o.sel, tent: o.tent, tentChi: o.tentChi, fantChi: o.fantChi, marca: o.marca, nuovo: o.nuovo });
    z.appendChild(asse); sch.appendChild(z);
    if (memScroll.k === k) z.scrollTop = memScroll.top;
    else {
      memScroll = { k: k, top: 0 };
      if (o.tent != null) setTimeout(function () { var e = asse.querySelector(".tl-ev.tent:not(.fant)"); if (e) { z.scrollTop = Math.max(0, e.offsetTop - z.clientHeight / 2 + e.offsetHeight / 2); memScroll = { k: k, top: z.scrollTop }; } }, 60);
    }
    return asse;
  }
  // chi gioca sceglie il punto: risolve col punto scelto, o null se scade il tempo
  function scegliSulloSchermo(S, o) {
    return new Promise(function (fine) {
      var scelto = null, finito = false, sel = null;
      function chiudi(v) { if (finito) return; finito = true; fermaTimer(S); viaBarra(S); fine({ gap: v, anno: v != null && sel ? sel.valore() : null }); }
      var conf = S.t.el("button", { class: "btn btn-primario tl-conferma", text: "⤵ Tocca dove va la carta", disabled: "disabled", onclick: function () { if (scelto != null) chiudi(scelto); } });
      // «📅 Dimmi l'anno»: si accende quando hai scelto il posto (solo gli anni di quel posto)
      if (o.anno) sel = selettoreAnno(S.t.el, { lo: o.anni[0], hi: o.anni[1], spento: true, onCambia: function (v) { if (scelto != null) conf.textContent = "✅ Mettila qui" + (v != null ? " · " + annoTesto(v) : ""); } });
      schermoGioco(S, { giocatori: o.giocatori, turnoId: o.turnoId, stato: "Tocca a te, " + o.nome + "!", sotto: o.doppio ? "🔥 Ultima carta: vale doppio!" : "Dove va questa carta?", rimMs: TEMPO * 1000,
        onScaduto: function () { chiudi(null); }, carta: o.carta, linea: o.linea, nuovo: o.nuovo, chiave: "loc|" + chiaveCarta(o.carta),
        // «🔄 Cambia carta»: risolve con { cambia: true } (la carta nuova la pesca chi chiama)
        cambia: o.cambia ? function () { if (finito) return; finito = true; FX.voto(); fermaTimer(S); viaBarra(S); fine({ cambia: true }); } : null,
        scegli: function (i) {
          scelto = i; conf.disabled = false;
          if (sel) { var l = limitiPosto(o.linea, i, o.anni); sel.imposta(l[0], l[1], i === 0 ? "giu" : i >= o.linea.length ? "su" : null); sel.accendi(true); }
          var v = sel ? sel.valore() : null;
          conf.textContent = "✅ Mettila qui" + (v != null ? " · " + annoTesto(v) : "");
        } });
      barraTL(S, [sel, conf]);
    });
  }
  // la riga sotto i tasti di «✋ Rubala»: quanto si vince e quanto si rischia
  function notaRuba(el, doppio) {
    return el("p", { class: "tl-attesa", text: "✋ Se ha sbagliato e indovini il posto +" + fmtN(PUNTI * (doppio ? 2 : 1)) + ", se no −" + fmtN(VOTO * (doppio ? 2 : 1)) + (doppio ? " 🔥" : "") });
  }
  // «✋ Rubala» uno alla volta (in segreto, col telefono in mano): tocca il posto giusto e «✋ Rubala», o «👍 Passo».
  // Risolve col posto scelto, o −1 (passo)
  function rubaSulloSchermo(S, o) {
    return new Promise(function (fine) {
      var el = S.t.el, scelto = null;
      var bRuba = el("button", { class: "btn btn-rosso", text: "✋ Tocca il posto", disabled: "disabled", onclick: function () { if (scelto != null) { viaBarra(S); fine(scelto); } } });
      schermoGioco(S, { giocatori: o.giocatori, turnoId: o.turnoId, stato: o.nome + ", la rubi?", sotto: o.chi + " l'ha messa qui. Sbaglia? Tocca il posto giusto",
        carta: o.carta, linea: o.linea, tent: o.gap, tentChi: "📍 L'ha messa qui " + o.chi, fantChi: "✋ Secondo te va qui", chiave: "locv|" + chiaveCarta(o.carta) + "|" + o.nome,
        scegli: function (i) { scelto = i; bRuba.disabled = false; bRuba.textContent = "✋ Rubala: va qui!"; } });
      barraTL(S, [ el("div", { class: "tl-vota" }, [
        el("button", { class: "btn btn-verde", text: "👍 Passo", onclick: function () { viaBarra(S); fine(-1); } }), bRuba ]), notaRuba(el, o.doppio) ]);
    });
  }
  // «✋ Rubala» tutti insieme sullo stesso telefono: chi vuole tocca il suo avatar e poi il posto giusto (anche in tanti sullo stesso);
  // toccare di nuovo il proprio avatar cambia idea. Risolve con { indice: posto } (solo chi ruba)
  function rubaTuttiInsieme(S, o) {
    return new Promise(function (fine) {
      var el = S.t.el, rube = {}, attivo = null, chips = {}, asse = null;
      var fatto = el("button", { class: "btn btn-primario", text: "Nessuno la ruba: avanti ▶", onclick: function () { viaBarra(S); fine(rube); } });
      var tt = el("div", { class: "tt" }), gr = el("div", { class: "gr" });
      function aggiorna(avviso) {
        o.votanti.forEach(function (vi) {
          var c = chips[vi], cl = "tl-gv" + (vi === attivo ? " attivo" : rube[vi] != null ? " ruba" : ""), sg = vi === attivo ? "👆" : rube[vi] != null ? "✋" : "❔";
          if (c.b.className !== cl) c.b.className = cl;
          if (c.seg.textContent !== sg) c.seg.textContent = sg;
        });
        // sui punti della linea: chi ruba lì (si aggiornano solo le scritte, la linea resta ferma)
        if (asse) asse.slots.forEach(function (b, i) {
          if (!b) return;
          var nomi = o.votanti.filter(function (vi) { return rube[vi] === i; }).map(function (vi) { return o.giocatori[vi].nome; });
          var lab = b.querySelector(".lab"), tx = etichettaSlot(o.linea, i) + (nomi.length ? " · ✋ " + nomi.join(", ") : "");
          if (lab.textContent !== tx) lab.textContent = tx;
          b.classList.toggle("ha", nomi.length > 0);
        });
        var n = Object.keys(rube).length;
        fatto.textContent = n ? "✅ Fatto: " + (n === 1 ? "1 la ruba" : "in " + n + " la rubano") + " ▶" : "Nessuno la ruba: avanti ▶";
        tt.textContent = avviso || (attivo != null ? "👆 " + o.giocatori[attivo].nome + ", ora tocca il posto giusto sulla linea" : "✋ Chi vuole rubarla? Tocca il tuo avatar, poi il posto giusto");
        tt.className = "tt" + (avviso || attivo != null ? " ora" : "");
      }
      o.votanti.forEach(function (vi) {
        var g = o.giocatori[vi], seg = el("span", { class: "v", text: "❔" });
        var b = el("button", { class: "tl-gv" }, [ el("span", { class: "av", html: avatarDi(g) }), el("span", { class: "nm", text: g.nome }), seg ]);
        b.addEventListener("click", function () {
          FX.voto();
          if (attivo === vi) attivo = null;            // toccato di nuovo: non ruba
          else { delete rube[vi]; attivo = vi; }       // (chi aveva già scelto un posto lo cambia)
          aggiorna();
        });
        chips[vi] = { b: b, seg: seg }; gr.appendChild(b);
      });
      var pann = el("div", { class: "tl-gvoto" + (o.votanti.length > 4 ? " molti" : "") }, [ tt, gr ]);
      asse = schermoGioco(S, { giocatori: o.giocatori, turnoId: o.turnoId, stato: "✋ La rubate?", sotto: o.chi + " l'ha messa qui. Sbaglia? Rubategliela",
        carta: o.carta, linea: o.linea, tent: o.gap, tentChi: "📍 L'ha messa qui " + o.chi, pannello: pann, marca: false, chiave: "locg|" + chiaveCarta(o.carta),
        scegli: function (i) {
          if (attivo == null) return aggiorna("👆 Prima tocca il tuo avatar, poi il posto");
          rube[attivo] = i; attivo = null; aggiorna();
        } });
      aggiorna();
      barraTL(S, [ fatto, notaRuba(el, o.doppio) ]);
    });
  }

  // R = { gi, es: { giusto, anno, titolo, fatto, cat, scaduto, finito, nome, ladro, rubate }, voti: [{ i, d, giusto, delta, ruba }] (chi ha
  // provato a rubarla: d = presa, il cartellino diventa ✋ verde o rosso), dopo: [punti per indice] }
  async function rivelazione(S, R) {
    var el = S.t.el, es = R.es, ok = !!es.giusto;
    viaBarra(S); fermaTimer(S);
    cartelliGiu(S);   // giù i cartellini di chi ha passato: dopo si alzano solo quelli di chi ha provato a rubarla
    await suSchermo(S, 700);
    vuota(S.sch);
    S.sch.appendChild(ST.raggi(S, !ok));
    var copia = {}; for (var kk in es) if (kk !== "voti") copia[kk] = es[kk];
    S.sch.appendChild(nodoEsito(el, copia, null));
    FX.rullo(1.2);
    setTimeout(function () {
      ok ? FX.giusto() : FX.sbagliato();
      // i momenti che contano vibrano (corto): anno esatto, carta rubata
      if (es.bonusAnno === BONUS_ESATTO || es.ladro) vibra([30, 60, 30]);
    }, 1300);
    await dorme(es.errore != null || es.ladro || es.detto != null ? 3000 : 2300);
    if (!S.vivo()) return;
    var fl = S.sch.querySelector(".tl-flip"); if (fl) fl.classList.add("fatto");   // carta girata: da qui in poi è piatta (niente 3D mentre la telecamera si muove)
    // la reazione di chi ha giocato, col pubblico
    lampo(S); accendiSolo(S, R.gi);
    await suLeggio(S, R.gi, 650);
    faccia(S, R.gi, ok ? "esulta" : "triste");
    pubblico(S, ok ? "applauso" : "ohh");
    puntiLeggio(S, R.gi, R.dopo[R.gi], (ok ? 1 : -1) * Math.abs(es.delta != null ? es.delta : PUNTI) + (es.bonusAnno || 0));
    if (ok) coriandoli();
    await dorme(1900);
    // i cartellini di chi ha provato a rubarla si girano
    if (R.voti && R.voti.length) {
      R.voti.forEach(function (v) { cartello(S, v.i, "su"); });
      await largo(S, 900); await dorme(350);
      function gira(v) {
        cartello(S, v.i, "gira", v.d);
        if (v.ruba) { var f = S.L[v.i] && S.L[v.i].cart && S.L[v.i].cart.querySelector(".f.r"); if (f) f.textContent = "✋"; }
        faccia(S, v.i, v.giusto || v.presa ? "esulta" : "triste"); puntiLeggio(S, v.i, R.dopo[v.i], v.delta);
      }
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
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    // le regole in una riga, per la saletta: "5 carte a testa · Storia, Cinema" (o "· tutte le categorie")
    riassunto: function (imp) {
      imp = imp || {};
      var cats = window.SG_CATEGORIE || [], scelte = imp.categorie;
      var nomi = cats.filter(function (c) { return !scelte || scelte.indexOf(c.id) >= 0; }).map(function (c) { return c.nome; });
      var testo = imp.gara === "insieme" ? "⚡ Tutti insieme · " + (imp.carte || 10) + " carte"
        : (imp.carte || 5) + " carte a testa" + (imp.gara === "auto" ? " (da " + TANTI + " in su ⚡ tutti insieme)" : "");
      if (imp.anno !== false) testo += " · 📅 l'anno";
      if (testoEpoca(imp)) testo += " · 📆 " + testoEpoca(imp);
      if (imp.ricordi === "no") testo += " · 📸 senza ricordi";
      if (tutteLeCategorie(imp) || !nomi.length) return testo + " · tutte le categorie";
      return testo + " · " + (nomi.length > 3 ? nomi.slice(0, 3).join(", ") + " e altre " + (nomi.length - 3) : nomi.join(", "));
    },
    difficolta: 2,   // Media — quanto vale vincerlo nel torneo (1 facile, 2 media, 3 difficile)

    regole: [
      "Al tuo turno esce un avvenimento <b>senza data</b>: hai <b>30 secondi</b> per decidere dove va nella linea del tempo.",
      "I posti dicono tra quali anni stanno: <b>«Tra il 1982 e il 1994»</b>, «Prima del 1950», «Dopo il 2010».",
      "Se indovini vinci <b>100 punti</b> e la carta entra nella linea. Se sbagli <b>perdi 100 punti</b>: la carta si gira, vedi l'<b>anno vero</b> («Sbagliato di 12 anni!») e dove andava, poi esce dal gioco.",
      "📅 <b>Dimmi l'anno</b>: dopo il posto, se vuoi, scegli anche l'anno. <b>Anno esatto +100</b>, sbagliato di 1 o 2 anni <b>+30</b>.",
      "✋ <b>Rubala</b>: quando scegli, gli altri vedono dove l'hai messa. Chi pensa che hai sbagliato tocca il <b>posto giusto</b>, anche in tanti sullo stesso posto (online e uno alla volta si ruba <b>in segreto</b>). Se hai sbagliato davvero, chi ha indovinato il posto prende <b>100 punti</b> e la carta entra nella linea; chi ruba e sbaglia perde <b>50 punti</b>. Chi non è sicuro non ruba («<b>👍 Passo</b>») e non rischia niente.",
      "🔥 <b>Ultimo giro doppio</b>: l'ultima carta di ognuno vale doppio (anche per chi la ruba).",
      "🔄 <b>Cambia carta</b>: una volta a partita, al tuo turno, puoi cambiare la carta che ti è uscita col tasto sulla carta (e il tempo riparte). Solo a turno: in «⚡ Tutti insieme» la carta è la stessa per tutti.",
      "📸 <b>I nostri ricordi</b>: in saletta ognuno può scrivere fatti del gruppo con l'anno («Il viaggio a Ibiza», 2019). Diventano carte della partita (il tuo non lo giochi tu) e restano per le prossime sere.",
      "📆 <b>Epoca</b>: prima di cominciare scegli gli anni delle carte: tutta la storia, prima del 1900, il Novecento, dal 1980 a oggi, oppure <b>«Scegli tu gli anni»</b> e muovi la linea (per esempio dal 476 al 1800).",
      "Le carte già uscite non tornano per un bel po': prima escono quelle che non avete mai visto.",
      "Sullo stesso telefono si ruba <b>tutti insieme</b> (chi vuole tocca il suo avatar e poi il posto), <b>uno alla volta</b> (in segreto, passandosi il telefono) o si gioca <b>senza</b>: si sceglie prima di cominciare.",
      "La <b>classifica</b> è sempre in alto. Vince chi ha più punti quando tutti hanno finito le carte.",
      "Online c'è anche <b>⚡ Tutti insieme</b> (da " + TANTI + " giocatori in su si parte così): esce una carta e la piazzate <b>tutti nello stesso momento</b>, ognuno dal suo telefono (" + TEMPO_T + " secondi). Chi la mette giusta prende <b>100 punti</b>, il più veloce dei giusti <b>50 in più</b>, e il bonus dell'anno va a chi ci va più vicino; chi sbaglia non perde niente. Poi la carta entra nella linea per tutti. L'<b>ultima carta vale doppio</b>!"
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
          el("div", { class: "mt", text: "Ognuno dal suo telefono" }), el("div", { class: "ms", text: "Con punti e ✋ rubate" })])]);
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
            contaEpoca();   // (quante carte ci sono negli anni scelti cambia con le categorie)
          } }, [ el("span", { class: "ci", text: c.icona || "🎲" }), el("span", { text: c.nome }), el("span", { class: "spunta", text: "✓" }) ]);
        griglia.appendChild(chip);
      });
      box.appendChild(griglia);
      box.appendChild(notaCat);

      // «📆 Epoca»: tutta la storia, prima del 1900, il Novecento, dal 1980 a oggi, o gli anni a scelta (la linea da muovere)
      dove.epoca = "tutta"; dove.da = null; dove.a = null;
      box.appendChild(el("div", { class: "etichetta", text: "📆 Epoca" }));
      var epChips = el("div", { class: "modo-griglia tl-ep-chips" }), epB = {}, epMs = {};
      var pista = pistaEpoca(el, dove);
      pista.hidden = true;
      EPOCHE_SCELTE.forEach(function (o) {
        epMs[o[0]] = el("div", { class: "ms" });
        epB[o[0]] = el("button", { class: "modo-chip" + (o[0] === dove.epoca ? " attiva" : ""), type: "button", onclick: function () {
          dove.epoca = o[0];
          for (var k in epB) epB[k].className = "modo-chip" + (k === o[0] ? " attiva" : "");
          pista.hidden = o[0] !== "mia";
          if (o[0] === "mia") pista.aggiorna();
        } }, [ el("span", { class: "mi", text: o[1] }), el("div", {}, [ el("div", { class: "mt", text: o[2] }), epMs[o[0]] ]) ]);
        epChips.appendChild(epB[o[0]]);
      });
      box.appendChild(epChips); box.appendChild(pista);
      function contaEpoca() {
        EPOCHE_SCELTE.forEach(function (o) {
          var n = o[0] === "mia" ? null : contaCarte(dove.categorie, EPOCHE[o[0]]), poche = n != null && n < EPOCA_MIN && o[0] !== "tutta";
          var tx = n == null ? "Muovi tu la linea degli anni" : poche ? "⚠️ " + fmtN(n) + (n === 1 ? " carta" : " carte") + ": si gioca con tutte" : fmtN(n) + (n === 1 ? " carta" : " carte");
          if (epMs[o[0]].textContent !== tx) epMs[o[0]].textContent = tx;
          epMs[o[0]].classList.toggle("poche", poche);
        });
        pista.aggiorna();
      }
      contaEpoca();

      // online: a turno (uno piazza, gli altri votano), tutti insieme (la stessa carta per tutti, nessuno aspetta)
      // o «✨ Decide il gioco» (di partenza): fino a 4 a turno, da 5 in su tutti insieme (in tanti a turno si aspetta troppo)
      dove.gara = dove.modo === "online" ? "auto" : "turno";
      var garaBox = el("div"), bottoniGara = {};
      garaBox.hidden = dove.modo !== "online";
      garaBox.appendChild(el("div", { class: "etichetta", text: "Come si gioca online" }));
      var mg = el("div", { class: "modo-griglia" });
      function scegliGara(g) {
        if (dove.gara === g) return;
        var prima = dove.gara;
        dove.gara = g; for (var k in bottoniGara) bottoniGara[k].className = "modo-chip" + (k === g ? " attiva" : "");
        // le carte: "a testa" (3-8) a turno, "in tutto" (5-15) tutti insieme
        if (g === "insieme" && prima !== "insieme" && dove.carte === 5) dove.carte = 10;
        else if (g !== "insieme" && prima === "insieme" && dove.carte === 10) dove.carte = 5;
        agg(0);
        if (dopoGara) dopoGara();
      }
      [["turno", "🎯", "A turno", "Uno piazza, gli altri possono rubargliela"],
       ["insieme", "⚡", "Tutti insieme", "La stessa carta per tutti: nessuno aspetta"],
       ["auto", "✨", "Decide il gioco", "Fino a 4 a turno, da " + TANTI + " in su ⚡ tutti insieme"]].forEach(function (o) {
        var b = bottoniGara[o[0]] = el("button", { class: "modo-chip" + (o[0] === dove.gara ? " attiva" : ""), onclick: function () { scegliGara(o[0]); } },
          [ el("span", { class: "mi", text: o[1] }), el("div", {}, [ el("div", { class: "mt", text: o[2] }), el("div", { class: "ms", text: o[3] }) ]) ]);
        mg.appendChild(b);
      });
      garaBox.appendChild(mg);
      box.appendChild(garaBox);
      var dopoGara = null;
      dopoModo = function (m) { garaBox.hidden = m !== "online"; scegliGara(m === "online" ? "auto" : "turno"); if (dopoOnline) dopoOnline(m); };
      var dopoOnline = null;

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

      // sullo stesso telefono: come si ruba la carta (online ognuno ruba dal suo telefono)
      if (dove.modo !== "online") {
        dove.voti = "insieme";
        box.appendChild(el("div", { class: "etichetta", text: "✋ Rubare la carta" }));
        var mv = el("div", { class: "modo-griglia" });
        [["insieme", "👥", "Tutti insieme", "Chi vuole tocca il suo avatar e poi il posto"],
         ["turno", "🤫", "Uno alla volta", "In segreto: si passa il telefono"],
         ["no", "🚫", "Senza", "Gioca solo chi ha la carta"]].forEach(function (o) {
          var b = el("button", { class: "modo-chip" + (o[0] === dove.voti ? " attiva" : ""), onclick: function () {
            dove.voti = o[0]; [].forEach.call(mv.children, function (x) { x.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [ el("span", { class: "mi", text: o[1] }), el("div", {}, [ el("div", { class: "mt", text: o[2] }), el("div", { class: "ms", text: o[3] }) ]) ]);
          mv.appendChild(b);
        });
        box.appendChild(mv);
      }

      // le regole nuove: una riga di due scelte ciascuna (si aggiorna solo la scelta toccata)
      function riga2(titolo, chiave, opz) {
        var et = el("div", { class: "etichetta", text: titolo }), mgr = el("div", { class: "modo-griglia" }), bb = [];
        opz.forEach(function (o) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === o[0] ? " attiva" : ""), onclick: function () {
            dove[chiave] = o[0]; bb.forEach(function (x, k) { x.className = "modo-chip" + (opz[k][0] === o[0] ? " attiva" : ""); });
          } }, [ el("span", { class: "mi", text: o[1] }), el("div", {}, [ el("div", { class: "mt", text: o[2] }), el("div", { class: "ms", text: o[3] }) ]) ]);
          bb.push(b); mgr.appendChild(b);
        });
        var wrap = el("div", {}, [et, mgr]); box.appendChild(wrap); return wrap;
      }
      dove.anno = true;
      riga2("📅 Dimmi l'anno", "anno", [[true, "📅", "Sì", "Anno esatto +100, a 1-2 anni +30"], [false, "🚫", "No", "Conta solo il posto"]]);
      // «📸 I nostri ricordi»: le carte del gruppo, mescolate alle altre
      dove.ricordi = "mix";
      riga2("📸 I nostri ricordi", "ricordi", [["mix", "📸", "Mescolati", "I fatti vostri tra le carte"], ["no", "🚫", "Senza", "Solo le carte del gioco"]]);
      // sullo stesso telefono si scrivono qui (online ognuno li scrive dalla sua saletta)
      if (dove.modo !== "online") {
        var bRic = el("button", { class: "btn btn-fantasma tl-ric-btn", type: "button", onclick: function () {
          foglioRicordi(el, { telefono: true, dopo: function (l) { bRic.textContent = testoBtnRicordi(l.length, null); } });
        } });
        bRic.textContent = testoBtnRicordi(mieiRicordi().length, null);
        box.appendChild(bRic);
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
    var imp = t.impostazioni || {};
    var mazzo = mazzoNuovo(imp);   // prima le carte mai viste su questo telefono
    var carte = carteGiuste(imp.carte || 5, mazzo.length, t.giocatori.length);
    var linea = [mazzo.pop()]; segnaVista(linea[0]);
    // «📸 I nostri ricordi» scritti su questo telefono, sparsi tra le carte
    // (anche i ricordi stanno negli anni scelti: «📆 Epoca»)
    if (imp.ricordi !== "no") mazzo = mescolaRicordi(mazzo, mieiRicordi().map(function (s) { return cartaRicordo(s, null, null); })
      .filter(function (c) { return nellEpoca(epocaAttiva(imp), c.anno); }), carte * t.giocatori.length);
    var stato = {
      mazzo: mazzo, linea: linea, turno: 0, carta: null, voti: imp.voti || "insieme", carte: carte,
      anno: imp.anno !== false, anni: anniDi(mazzo.concat(linea)),
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
    segnaVista(carta);
    precaricaFoto(carta); precaricaFoto(stato.mazzo[stato.mazzo.length - 1]);   // (le foto vere: già pronte quando servono)
    // 🔥 l'ultima carta di ognuno vale doppio (anche per chi la ruba)
    var doppio = g.restano === 1 && stato.carte > 1, molt = doppio ? 2 : 1;
    // 1) stacco su chi gioca (e il telefono passa a lui)
    ST.logoSchermo(S);   // fra un turno e l'altro sul maxischermo torna il logo
    await stacco(S, gi, doppio ? "🔥 Ultima carta: vale doppio!" : (uno ? "Dove va questa carta?" : "Passa il telefono a " + g.nome));
    if (!uno) await aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶");
    if (!S.vivo()) return;
    FX.turno();
    // 2) si gioca sul maxischermo («🔄 Cambia carta»: una volta a partita la carta torna in fondo al mazzo e se ne pesca un'altra)
    await suSchermo(S, 900);
    var scelta;
    while (true) {
      scelta = await scegliSulloSchermo(S, { giocatori: stato.giocatori, turnoId: g.nome, nome: g.nome, carta: carta, linea: stato.linea, nuovo: stato._nuovo,
        anno: stato.anno, anni: stato.anni, doppio: doppio, cambia: !g.cambio && stato.mazzo.length > 0 });
      if (!scelta.cambia || !S.vivo()) break;
      g.cambio = true; stato.mazzo.unshift(carta);
      carta = stato.carta = stato.mazzo.pop(); segnaVista(carta); precaricaFoto(carta);
      terzo(S, null, "🔄 Carta cambiata!", "Ecco la carta nuova", "🔄");
      setTimeout(function () { if (S.vivo()) viaTerzo(S); }, 1300);   // (intanto la carta nuova è già sul maxischermo)
    }
    var gap = scelta.gap, detto = scelta.anno;
    stato._nuovo = null;
    if (!S.vivo()) return;
    // 3) ✋ gli altri possono rubarla: tutti insieme (ognuno tocca il suo avatar e poi il posto) o uno alla volta col telefono
    //    in mano (in segreto: il cartellino resta coperto). rube = { indice: posto scelto, −1 = «👍 Passo» }
    var votanti = [], rube = {};
    if (gap != null && stato.voti !== "no") stato.giocatori.forEach(function (x, i) { if (i !== gi) votanti.push(i); });
    if (votanti.length && stato.voti === "turno") {
      for (var j = 0; j < votanti.length; j++) {
        var vi = votanti[j], v = stato.giocatori[vi];
        accendiSolo(S, vi);
        await suLeggio(S, vi, 800);
        terzo(S, vi, "Passa il telefono a " + v.nome, "✋ Vuoi rubarla?", "📱");
        await aspettaTasto(S, "📱 Sono " + v.nome + " ▶");
        viaTerzo(S); if (!S.vivo()) return;
        await suSchermo(S, 800);
        rube[vi] = await rubaSulloSchermo(S, { giocatori: stato.giocatori, turnoId: g.nome, nome: v.nome, chi: g.nome, carta: carta, linea: stato.linea, gap: gap, doppio: doppio });
        ST.logoSchermo(S);   // via subito la sua scelta dal maxischermo: chi viene dopo non deve vederla
        FX.voto(); cartello(S, vi, "su", null);
      }
    } else if (votanti.length) {
      rube = await rubaTuttiInsieme(S, { giocatori: stato.giocatori, votanti: votanti, turnoId: g.nome, chi: g.nome, carta: carta, linea: stato.linea, gap: gap, doppio: doppio });
      if (!S.vivo()) return;
      Object.keys(rube).forEach(function (i) { cartello(S, +i, "su", null); });
    }
    var nRube = Object.keys(rube).filter(function (k) { return rube[k] >= 0; }).length;
    if (nRube) {
      accendiSolo(S, -1); await largo(S, 900);
      terzo(S, null, nRube === 1 ? "✋ Qualcuno vuole rubarla!" : "✋ In " + nRube + " vogliono rubarla!", "Vediamo chi ha ragione…", "✋");
      await dorme(1500); viaTerzo(S);
    }
    // 4) risultato: punti e trofei, poi lo spettacolo
    var ok = gap != null && gapGiusto(stato.linea, gap, carta.anno), voti = [], rubate = [], ladri = [];
    if (gi === stato._io) tPiazza(stato._T, ok, carta._cat === "noi" ? null : carta._cat);
    Object.keys(rube).forEach(function (k) {
      var xi = +k, x = stato.giocatori[xi], r = rube[k];
      if (r < 0) { if (xi === stato._io) tVoto(stato._T, true, ok); return; }   // «👍 Passo»: niente punti
      // presa se chi gioca ha sbagliato e il posto è quello giusto (in tanti sullo stesso posto: tutti)
      var presa = !ok && gapGiusto(stato.linea, r, carta.anno), dv = (presa ? PUNTI : -VOTO) * molt;
      if (xi === stato._io) tVoto(stato._T, false, presa);
      x.punti += dv;
      if (presa) ladri.push(x.nome);
      voti.push({ i: xi, d: presa, giusto: presa, delta: dv, ruba: true, presa: presa });
      rubate.push({ nome: x.nome, giusto: presa, delta: dv });
    });
    // l'anno vero si vede sempre: di quanto si è sbagliato e dove andava (prima di mettere la carta nella linea)
    var errore = ok ? null : erroreAnni(stato.linea, gap, carta.anno), vic = ok ? {} : viciniGiusti(stato.linea, carta.anno);
    var bonus = ok ? bonusAnno(detto, carta.anno) * molt : 0;
    if (ok) { g.punti += PUNTI * molt + bonus; } else { g.punti -= PUNTI * molt; }
    if (ok || ladri.length) { stato.linea.push(carta); ordina(stato.linea); stato._nuovo = carta.titolo; }   // (rubata: entra anche lei)
    g.restano -= 1;
    await rivelazione(S, { gi: gi, voti: voti, dopo: stato.giocatori.map(function (x) { return x.punti; }),
      es: { giusto: ok, anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto, cat: carta._cat, nome: g.nome, scaduto: gap == null, finito: g.restano === 0,
        delta: (ok ? PUNTI : -PUNTI) * molt, doppio: doppio, errore: errore, prima: vic.prima || null, dopo: vic.dopo || null,
        detto: gap != null && detto != null ? detto : null, bonusAnno: bonus,
        rubate: rubate, ladro: ladri.length ? elenco(ladri) : null, ladri: ladri.length, presa: PUNTI * molt } });
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
      giocatori: g.map(function (x) { return { id: x.id, nome: x.nome, restano: x.restano, punti: x.punti, omino: x.omino || null, via: !!x.via, cambio: !!x.cambio }; }),
      turnoId: c ? c.id : null, turnoNome: c ? c.nome : "",
      linea: st.linea.map(function (e) { return { anno: e.anno, titolo: e.titolo, fatto: e.fatto || "", cat: e._cat }; }),
      // la spiegazione no (si vede nel risultato); per i ricordi chi l'ha scritto (non lo gioca e non vota)
      carta: st.carta ? { titolo: st.carta.titolo, cat: st.carta._cat, autore: st.carta.autore || null, autoreNome: st.carta.autoreNome || null } : null,
      // «✋ Rubala»: chi ha già deciso (SOLO gli id: chi ruba e dove resta segreto fino al risultato)
      hannoVotato: Object.keys(st.voti || {}), esito: st.esito || null, classifica: st.classifica || null,
      // le regole nuove: l'anno (📅), l'ultima carta doppia, gli anni della partita
      annoOn: !!st.annoOn, doppio: !!st.doppio, anni: st.anni || null,
      // «🔄 Cambia carta» (una volta a partita, solo a turno): cambi = quante volte è cambiata la carta in questo turno
      cambiOn: !insiemeOra(st) && st.mazzo.length > 0, cambi: st.cambi || 0,
      // «📸 I nostri ricordi» in saletta: quanti e di chi (i fatti e gli anni restano sull'host)
      ricordiOn: st.ricordiOn !== false, nRic: contaRicordi(st), ricDa: daChiRicordi(st),
      guarda: (st.guarda || []).slice(),   // nella Sala: chi questa volta guarda soltanto
      // "⚡ Tutti insieme": la carta numero giro (di carte); chi ha già scelto (SOLO gli id: dove l'ha messa resta segreto
      // fino al risultato), il risultato di tutti e chi ha già toccato "⏩ Avanti"
      insieme: insiemeOra(st), giro: st.giro || 0, hannoScelto: Object.keys(st.mosse || {}),
      esitoT: st.esitoT || null, avanti: Object.keys(st.avanti || {}),
      // servono agli ospiti per i trofei e alla saletta (in saletta: le carte vere, se il mazzo non basta per tutti)
      carte: st.iniziata ? st.carte : (insiemeOra(st) ? carteInsieme(carteDi(st, true), st.mazzo.length) : carteGiuste(st.carte, st.mazzo.length, g.length)), tutteCat: st.tutteCat, nCat: st.nCat
    };
  }
  // «✨ Decide il gioco»: da 5 in su si gioca tutti insieme (in saletta lo si dice già con quelli che ci sono)
  function insiemeOra(st) { return st.iniziata ? !!st.insieme : (st.gara === "insieme" || (st.gara === "auto" && st.giocatori.length >= TANTI)); }
  // le carte della partita: a turno "a testa"; tutti insieme "in tutto" (scelte apposta, o il doppio di quelle a testa)
  function carteDi(st, insieme) {
    if (!insieme) return st.carte;
    if (st.gara === "insieme") return st.carte;
    return Math.max(5, Math.min(15, st.carte * 2));
  }
  function contaRicordi(st) {
    if (st.ricordiOn === false) return 0;
    var n = 0, k; for (k in (st.ricordi || {})) n += st.ricordi[k].length;
    return n;
  }
  function daChiRicordi(st) {
    var out = [], k; if (st.ricordiOn === false || st.iniziata) return out;
    for (k in (st.ricordi || {})) if (st.ricordi[k].length && st.ricNomi[k]) out.push(st.ricNomi[k]);
    return out.slice(0, 10);
  }

  // ---- la partita dell'host si ricorda col modo comune (t.ricorda / t.ripresa): se ricarica la pagina la riprende ----
  // (il mazzo si ricorda come chiavi delle carte e si rifà alla ripresa)
  function chiaveEv(e) { return (e._cat || "") + "|" + e.titolo; }
  // (il mazzo si ricorda come numeri: il posto della carta nell'elenco di tutte le carte, uguale su ogni telefono.
  // Così la copia per l'host di riserva resta piccola: con le chiavi intere erano più di 60 KB. I «📸 ricordi» del
  // gruppo non sono nell'elenco: restano come chiave e si ritrovano tra i ricordi della partita, salvati interi)
  function rifaiMazzo(chiavi, ricordi) {
    var lista = pescaDati(null), tutte = {}; lista.forEach(function (e) { tutte[chiaveEv(e)] = e; });
    (ricordi || []).forEach(function (e) { tutte[chiaveEv(e)] = e; });
    return (chiavi || []).map(function (k) { return typeof k === "number" ? lista[k] : tutte[k]; }).filter(Boolean);
  }
  var POS_CARTE = null, POS_N = -1;
  function mazzoInNumeri(mazzo) {
    var n = 0; (window.SG_CATEGORIE || []).forEach(function (c) { n += (c.eventi || []).length; });
    if (!POS_CARTE || POS_N !== n) { POS_CARTE = {}; POS_N = n; pescaDati(null).forEach(function (e, i) { POS_CARTE[chiaveEv(e)] = i; }); }
    var pos = POS_CARTE;
    return mazzo.map(function (e) { var k = chiaveEv(e); return pos[k] != null ? pos[k] : e._cat === "noi" ? k : null; }).filter(function (n) { return n != null; });
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
      mazzo: mazzoNuovo(imp), linea: [], turno: 0, n: 0, carta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, carte: carte, codice: "…", scelta: null, voti: {}, scadenza: null, durata: null, _to: null,
      tutteCat: tutteLeCategorie(imp), nCat: quanteCategorie(imp), T: null, partita: idPartita(), pronta: false,
      gara: imp.gara || "turno", insieme: imp.gara === "insieme", giro: 0, mosse: {}, avanti: {}, esitoT: null, inizio: 0,   // "⚡ Tutti insieme"
      // le regole nuove: «📅 Dimmi l'anno», l'ultima carta doppia, «📸 I nostri ricordi»
      // (st.voti = chi ha deciso nel «✋ Rubala»: id → il posto scelto, −1 = «👍 Passo»)
      annoOn: imp.anno !== false, ricordiOn: imp.ricordi !== "no", anni: null,
      annoDetto: null, doppio: false,
      ricordi: {}, ricNomi: {}, ricPool: [],   // i ricordi di chi è entrato (per id) e quelli entrati nel mazzo di questa partita
      giocatori: [{ id: IO, nome: nomeHost, restano: carte, punti: 0, omino: mioAvatar(nomeHost) }],
      guarda: []   // nella Sala: chi non è stato scelto per giocare (guarda soltanto; con l'id, così sa di essere entrato)
    };
    st.ricordi[IO] = mieiRicordi(); st.ricNomi[IO] = nomeHost;
    // i ricordi che arrivano da un amico: puliti e al massimo 12 (al massimo 16 amici li portano)
    function prendiRicordi(id, nome, l) {
      if (!Array.isArray(l)) return false;
      if (!st.ricordi[id] && Object.keys(st.ricordi).length >= 16) return false;
      var p = leggiRicordi(l.slice(0, MAX_RICORDI * 2)), prima = JSON.stringify(st.ricordi[id] || []);
      st.ricordi[id] = p; st.ricNomi[id] = nome;
      return JSON.stringify(p) !== prima;
    }
    function corr() { return st.giocatori[st.turno % st.giocatori.length]; }
    function gDi(id) { var i = indexById(st, id); return i >= 0 ? st.giocatori[i] : null; }
    function clearTo() { if (st._to) { clearTimeout(st._to); st._to = null; } }
    function arma(ms, fn) { clearTo(); st.durata = ms; st.scadenza = Date.now() + ms; st._to = setTimeout(fn, ms); }
    var visti = {};   // chi è arrivato a partita cominciata (gli rimando la foto una volta)
    // "⚙️ Regole" in saletta: categorie e carte a testa nuove (il mazzo si rifà con le categorie scelte)
    t.onRegole = function (im) {
      if (st.iniziata) return;
      imp = im || {};
      st.gara = imp.gara || "turno"; st.insieme = imp.gara === "insieme";
      st.annoOn = imp.anno !== false; st.ricordiOn = imp.ricordi !== "no";
      st.carte = imp.carte || (st.insieme ? 10 : 5); st.mazzo = mazzoNuovo(imp); st.tutteCat = tutteLeCategorie(imp); st.nCat = quanteCategorie(imp);
      st.giocatori.forEach(function (g) { g.restano = st.carte; });
      bd();
    };

    // la partita di prima (t.ripresa): si riprende anche sulla classifica finale (gli XP non si ridanno: lo controlla il core)
    var ripresa = !!(sv && sv.st && sv.st.fase !== "lobby");
    var rete = SGNet.ospita("timeline", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        if (!st.iniziata && st.ricordi[id]) { delete st.ricordi[id]; delete st.ricNomi[id]; }   // (in saletta i suoi ricordi se ne vanno con lui)
        var kG = st.guarda.indexOf(id); if (kG >= 0) { st.guarda.splice(kG, 1); bd(); return; }
        var g = gDi(id); if (!g) { if (!st.iniziata) bd(); return; }
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
        // «📸 I nostri ricordi»: chi entra li porta (anche chi guarda), e li riscrive dalla saletta
        if (m.t === "ricordi") { if (!st.iniziata && prendiRicordi(id, g ? g.nome : String(m.nome || "Amico").slice(0, 16), m.l)) bd(); return; }
        if (m.t === "join" && !st.iniziata && m.ricordi) prendiRicordi(id, g ? g.nome : String(m.nome || "Amico").slice(0, 16), m.ricordi);
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
        if (m.t === "scelta") scelta(id, m.gap, m.anno);
        else if (m.t === "ruba") ruba(id, m.gap);
        else if (m.t === "cambia") cambiaCarta(id);
        else if (m.t === "voto") ruba(id, null);   // (un telefono con l'app di prima: il suo 👍/👎 vale «👍 Passo»)
        else if (m.t === "posa") posa(id, m.gap, m.anno);
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
       "insieme", "giro", "mosse", "avanti", "esitoT", "classifica", "gara", "annoOn", "ricordiOn", "anni", "annoDetto", "doppio",
       "ricPool", "ricordi", "ricNomi"].forEach(function (k) { if (o[k] !== undefined) st[k] = o[k]; });
      st.mazzo = rifaiMazzo(o.mazzo, o.ricPool); st.iniziata = true; st.codice = rete.codice || st.codice; st.T = sv.T || null;
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
        gara: st.gara, annoOn: !!st.annoOn, ricordiOn: st.ricordiOn !== false, anni: st.anni, annoDetto: st.annoDetto,
        doppio: !!st.doppio, ricPool: st.ricPool || [], ricordi: st.ricordi || {}, ricNomi: st.ricNomi || {},
        giocatori: st.giocatori.map(function (g) { return { id: g.id, nome: g.nome, restano: g.restano, punti: g.punti, omino: g.omino || null, via: !!g.via, cambio: !!g.cambio }; }) } });
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
      // «✨ Decide il gioco»: da 5 in su tutti insieme (le carte "a testa" diventano il doppio "in tutto")
      var ins = insiemeOra(st), carteIns = carteDi(st, ins);
      st.insieme = ins;
      st.iniziata = true; st.giro = 0; st.mosse = {}; st.avanti = {}; st.esitoT = null;
      st.annoDetto = null; st.doppio = false;
      st.carte = st.insieme ? carteInsieme(carteIns, st.mazzo.length) : carteGiuste(st.carte, st.mazzo.length, st.giocatori.length);
      st.giocatori.forEach(function (g) { g.restano = st.carte; g.punti = 0; g.via = false; g.cambio = false; });
      st.linea = [st.mazzo.pop()]; ordina(st.linea); segnaVista(st.linea[0]);
      // «📸 I nostri ricordi» di chi c'è (anche di chi guarda), sparsi tra le carte che si giocheranno
      st.ricPool = [];
      if (st.ricordiOn && st.giocatori.length >= 2) {   // (da soli i propri ricordi non si giocano: l'anno lo sai già)
        var giaR = {};
        Object.keys(st.ricordi).forEach(function (id) {
          if (id !== IO && !gDi(id) && st.guarda.indexOf(id) < 0) return;   // (se n'è andato)
          var nome = (gDi(id) || {}).nome || st.ricNomi[id] || "un amico";
          st.ricordi[id].forEach(function (s) {
            var c = cartaRicordo(s, id, nome), k = c.titolo.toLowerCase();
            if (!giaR[k] && nellEpoca(epocaAttiva(imp), c.anno)) { giaR[k] = 1; st.ricPool.push(c); }   // (negli anni scelti: «📆 Epoca»)
          });
        });
        if (st.ricPool.length) st.mazzo = mescolaRicordi(st.mazzo, st.ricPool, st.insieme ? st.carte : st.carte * st.giocatori.length);
      }
      st.anni = anniDi(st.mazzo.concat(st.linea));
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
      evitaAutore(st.mazzo, corr().id);   // (il tuo ricordo non lo giochi tu)
      st.carta = st.mazzo.pop(); segnaVista(st.carta); precaricaFoto(st.carta); precaricaFoto(st.mazzo[st.mazzo.length - 1]);
      st.scelta = null; st.voti = {}; st.esito = null; st.fase = "turno"; st.annoDetto = null; st.cambi = 0;
      st.doppio = corr().restano === 1 && st.carte > 1;   // 🔥 l'ultima carta di ognuno vale doppio
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
      st.carta = st.mazzo.pop(); segnaVista(st.carta); precaricaFoto(st.carta); precaricaFoto(st.mazzo[st.mazzo.length - 1]);
      st.mosse = {}; st.avanti = {}; st.esitoT = null; st.scelta = null; st.voti = {}; st.esito = null;
      st.fase = "tutti"; st.inizio = Date.now() + INTRO_T;   // il tempo (e la gara a chi è più veloce) parte dopo "Carta 3 di 10"
      var n = st.n;
      // (+600: le scelte dell'ultimo secondo sono ancora in viaggio)
      arma(INTRO_T + TEMPO_T * 1000 + 600, function () { if (st.n === n && st.fase === "tutti") chiudiCarta(); });
      bd();
    }
    // chi ha scritto il ricordo in gioco (non lo gioca e non vota: l'anno lo sa)
    function autoreCarta() { return st.carta && st.carta.autore ? st.carta.autore : null; }
    // una scelta: vale la prima (niente ripensamenti: conta anche la velocità). Con «📅 Dimmi l'anno» anche l'anno (facoltativo)
    function posa(id, gap, anno) {
      if (st.fase !== "tutti" || st.mosse[id]) return;
      var g = gDi(id); if (!g || g.via || id === autoreCarta()) return;
      gap = Math.floor(+gap); if (!(gap >= 0 && gap <= st.linea.length)) return;
      st.mosse[id] = { gap: gap, ms: Math.max(0, Date.now() - st.inizio), anno: st.annoOn && anno != null ? annoValido(anno) : null };
      bd(); verificaTutti();
    }
    // hanno scelto tutti quelli collegati: si scopre subito (chi è senza rete non lo si aspetta)
    function verificaTutti() {
      if (st.fase !== "tutti") return;
      var au = autoreCarta(), pr = presenti().filter(function (x) { return x.id !== au; });
      if (pr.length && pr.every(function (x) { return st.mosse[x.id]; })) chiudiCarta();
    }
    function chiudiCarta() {
      if (st.fase !== "tutti") return;
      clearTo();
      var carta = st.carta, doppio = st.giro === st.carte && st.carte > 1, molt = doppio ? 2 : 1, veloce = null, au = autoreCarta();
      st.giocatori.forEach(function (x) {
        var m = st.mosse[x.id];
        if (m && gapGiusto(st.linea, m.gap, carta.anno) && (!veloce || m.ms < st.mosse[veloce].ms)) veloce = x.id;
      });
      // «📅 Dimmi l'anno»: il bonus va a chi si avvicina di più (tra chi l'ha messa giusta), se è entro 2 anni
      var piuVicino = null;
      st.giocatori.forEach(function (x) {
        var m = st.mosse[x.id];
        if (m && m.anno != null && gapGiusto(st.linea, m.gap, carta.anno)) { var d = Math.abs(m.anno - carta.anno); if (d <= VICINO && (piuVicino == null || d < piuVicino)) piuVicino = d; }
      });
      var risultati = st.giocatori.map(function (x) {
        var m = st.mosse[x.id], ok = !!m && gapGiusto(st.linea, m.gap, carta.anno);
        var bonus = ok && m.anno != null && piuVicino != null && Math.abs(m.anno - carta.anno) === piuVicino ? bonusAnno(m.anno, carta.anno) * molt : 0;
        var delta = ok ? (PUNTI + (x.id === veloce ? VELOCE : 0)) * molt + bonus : 0;
        x.punti += delta; x.restano = Math.max(0, x.restano - 1);
        if (x.id === IO && x.id !== au) tPiazza(st.T, ok, carta._cat === "noi" ? null : carta._cat);
        return { id: x.id, giusto: ok, delta: delta, veloce: x.id === veloce, scelto: !!m, sec: m ? Math.round(m.ms / 100) / 10 : null,
          anno: m && m.anno != null ? m.anno : null, bonus: bonus, suo: x.id === au };
      });
      st.linea.push(carta); ordina(st.linea);   // la carta entra nella linea per tutti (si impara la data)
      st.esitoT = { anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto || "", cat: carta._cat, doppio: doppio, risultati: risultati, ultima: st.giro >= st.carte };
      st.fase = "tEsito"; st.avanti = {};
      var n = st.n, conAnni = risultati.some(function (r) { return r.anno != null; });
      arma(rivelazioneT(st.giocatori.length) + ESITO_T + (conAnni ? 1000 : 0), function () { if (st.n === n && st.fase === "tEsito") prossimo(); });
      bd();
    }
    // "⏩ Avanti": se lo toccano tutti quelli che giocano, si va avanti subito (se no, quando finisce il tempo)
    function avantiT(id) {
      if (st.fase !== "tEsito") return;
      var g = gDi(id); if (!g || g.via || st.avanti[id]) return;
      st.avanti[id] = true; bd(); verificaAvanti();
    }
    function verificaAvanti() {
      if (st.fase !== "tEsito") return;
      var pr = presenti(), si = pr.filter(function (x) { return st.avanti[x.id]; }).length;
      if (pr.length && si >= pr.length) prossimo();
    }
    // chi può rubarla: gli altri collegati (non chi gioca, e non chi ha scritto il ricordo in gioco)
    function votanti() { var c = corr(), au = autoreCarta(); return st.giocatori.filter(function (x) { return x.id !== c.id && !x.via && x.id !== au; }); }
    function scelta(playerId, gap, anno) {
      if (st.fase !== "turno" || corr().id !== playerId) return;
      clearTo();
      st.scelta = (gap == null ? -1 : gap); // -1 = tempo scaduto senza scegliere
      st.annoDetto = st.annoOn && gap != null && anno != null ? annoValido(anno) : null;   // (segreto fino al risultato)
      if (st.scelta === -1 || votanti().length === 0) return risolvi(); // nessuno che possa rubarla
      st.fase = "votazione"; st.voti = {};
      arma(TEMPO_RUBA * 1000, risolvi);
      bd();
    }
    // «🔄 Cambia carta»: chi gioca, una volta a partita, rimette la carta in fondo al mazzo e ne pesca un'altra (il tempo riparte)
    function cambiaCarta(id) {
      if (st.fase !== "turno" || st.insieme || corr().id !== id) return;
      var g = gDi(id); if (!g || g.cambio || !st.mazzo.length) return;
      g.cambio = true; st.mazzo.unshift(st.carta);
      evitaAutore(st.mazzo, id);   // (il tuo ricordo non lo giochi tu)
      st.carta = st.mazzo.pop(); segnaVista(st.carta); precaricaFoto(st.carta); st.cambi = (st.cambi || 0) + 1;
      var n = st.n;
      arma(TEMPO * 1000, function () { if (st.n === n && st.fase === "turno") scelta(corr().id, null); });
      bd();
    }
    // «✋ Rubala»: il posto che secondo lui è giusto (diverso da quello di chi gioca), o null = «👍 Passo». Vale la prima decisione
    function ruba(id, gap) {
      if (st.fase !== "votazione" || id === corr().id) return;
      var g = gDi(id); if (!g || g.via || id === autoreCarta()) return;
      if (st.voti[id] != null) return;
      var x = gap == null ? -1 : Math.floor(+gap);
      if (x !== -1 && !(x >= 0 && x <= st.linea.length && x !== st.scelta)) return;
      st.voti[id] = x;
      bd(); verificaVoti();
    }
    function verificaVoti() {
      if (st.fase !== "votazione") return;
      if (votanti().every(function (x) { return st.voti[x.id] != null; })) risolvi();
    }
    function risolvi() {
      clearTo();
      var g = corr(), carta = st.carta, gap = st.scelta, molt = st.doppio ? 2 : 1;
      var ok = gap != null && gap >= 0 && gapGiusto(st.linea, gap, carta.anno);
      // «✋ Rubala»: se chi gioca ha sbagliato, la prende chi ha toccato il posto giusto (anche in tanti: tutti); chi sbaglia −50
      var voti = [], rubate = [], ladri = [], passo = [];
      st.giocatori.forEach(function (x) {
        if (x.id === g.id) return;
        var r = st.voti[x.id];
        if (r == null) return;   // non ha deciso in tempo: 0
        if (!(typeof r === "number" && r >= 0)) { passo.push(x.id); if (x.id === IO) tVoto(st.T, true, ok); return; }   // «👍 Passo»: 0
        var presa = !ok && gapGiusto(st.linea, r, carta.anno), dv = (presa ? PUNTI : -VOTO) * molt;
        x.punti += dv;
        if (presa) ladri.push(x.nome);
        if (x.id === IO) tVoto(st.T, false, presa);
        voti.push({ id: x.id, giusto: presa, delta: dv, nome: x.nome, d: presa });   // (nome e d: per i telefoni con l'app di prima)
        rubate.push({ nome: x.nome, giusto: presa, delta: dv });
      });
      if (g.id === IO) tPiazza(st.T, ok, carta._cat === "noi" ? null : carta._cat);
      var errore = ok ? null : erroreAnni(st.linea, gap, carta.anno), vic = ok ? {} : viciniGiusti(st.linea, carta.anno);
      var bonus = ok ? bonusAnno(st.annoDetto, carta.anno) * molt : 0;
      if (ok) g.punti += PUNTI * molt + bonus; else g.punti -= PUNTI * molt;
      if (ok || ladri.length) { st.linea.push(carta); ordina(st.linea); }   // (rubata: entra nella linea anche lei)
      g.restano -= 1;
      st.esito = { giusto: ok, anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto || "", nome: g.nome, cat: carta._cat,
        delta: (ok ? PUNTI : -PUNTI) * molt, scaduto: gap === -1, voti: voti, passo: passo, finito: g.restano === 0, doppio: !!st.doppio,
        errore: errore, prima: vic.prima || null, dopo: vic.dopo || null, detto: st.annoDetto, bonusAnno: bonus,
        rubate: rubate, ladro: ladri.length ? elenco(ladri) : null, ladri: ladri.length, presa: PUNTI * molt };
      st.scelta = null; st.fase = "esito";
      // il risultato non aspetta per sempre il tasto Avanti: dopo la rivelazione si riparte da soli
      var n = st.n, extra = (errore != null || ladri.length || st.annoDetto != null || rubate.length) ? 1500 : 0;
      arma(durataEsito(voti.length, st.esito.finito, st.giocatori.length) + extra, function () { if (st.n === n && st.fase === "esito") prossimo(); });
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
      st.carte = imp.carte || (st.gara === "insieme" ? 10 : 5);
      st.giocatori.forEach(function (g) { g.punti = 0; g.restano = st.carte; g.cambio = false; });
      st.annoDetto = null; st.doppio = false; st.ricPool = [];
      st.mazzo = mazzoNuovo(imp); st.linea = []; st.turno = 0; st.carta = null; st.esito = null; st.classifica = null;
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
      st.mosse = {}; st.avanti = {}; st.annoDetto = null;
      st.carta = null; st.scelta = null; st.voti = {}; st.fase = "ripresa";
      arma(RIPRESA, function () {
        if (st.fase !== "ripresa") return;
        if (eraEsito) prossimo(); else iniziaTurno();
      });
    }
    var cb = { myId: IO, sonoHost: true,
      onGap: function (g, a) { scelta(IO, g, a); }, onRuba: function (gap) { ruba(IO, gap); }, onCambia: function () { cambiaCarta(IO); },
      onPosa: function (g, a) { posa(IO, g, a); },
      // «📸 I nostri ricordi» dell'host, cambiati dalla saletta
      onRicordi: function (l) { if (!st.iniziata && prendiRicordi(IO, nomeHost, l)) bd(); },
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
      onGap: function (g, a) { invia({ t: "scelta", gap: g, anno: a != null ? a : null }); },
      onRuba: function (gap) { invia({ t: "ruba", gap: gap != null && gap >= 0 ? gap : null }); },
      onCambia: function () { invia({ t: "cambia" }); },
      onPosa: function (g, a) { invia({ t: "posa", gap: g, anno: a != null ? a : null }); },
      onAvanti: function () { invia({ t: "avanti" }); },
      onRicordi: function (l) { if (S.rete) S.rete.invia({ t: "ricordi", l: l, nome: S.nome }); },
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
    // chi entra porta i suoi «📸 ricordi» (fatti e anni li vede solo l'host)
    function entrata() { var r = mieiRicordi(), m = { t: "join", nome: S.nome, omino: mioAvatar(S.nome) }; if (r.length) m.ricordi = r; return m; }
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
          : io.restano > 0 ? (io.restano === 1 ? "Ti resta 1 carta" : "Ti restano " + io.restano + " carte") : "Hai finito le carte: ora puoi rubare";
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
      // «✋ Rubala»: chi ha provato a rubarla (voti) e chi ha passato
      (vm.esito.voti || []).forEach(function (v) { if (v.id === S.myId) tVoto(S.T, false, v.giusto); });
      if ((vm.esito.passo || []).indexOf(S.myId) >= 0) tVoto(S.T, true, vm.esito.giusto);
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
  // chi guarda soltanto (link con guarda=1): in basso c'è la targhetta del core "👀 Guardi · 😂 · ✕" (le faccine e l'uscita
  // le dà lei: niente fila delle faccine né "🏠 Esci" del gioco, e la barra lascia il suo posto)
  function conTarga(t) { return !!(t && t.guarda && !t.eliminazione); }
  function faccineDi(t) { return conTarga(t) || !t.faccine ? null : t.faccine(); }
  function idxDi(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return i; return -1; }
  function giocHUD(vm, meId) { return vm.giocatori.map(function (g) { return { id: g.id, nome: g.nome, punti: g.punti, omino: g.omino, via: g.via, _me: g.id === meId }; }); }
  function disegnaVM(t, vm, cb) {
    if (vm.fase === "lobby") { ultimaFase = "lobby"; REG = null; return disegnaLobby(t, vm, cb); }
    var ids = vm.giocatori.map(function (g) { return g.id; }).join("|");
    // regia nuova: la prima volta, in un'altra stanza o in una partita nuova (la regia vecchia non serve più)
    if (!REG || REG.codice !== vm.codice || REG.partita !== vm.partita || (!REG.S.vivo() && !REG.fineFatta)) {
      REG = { t: t, cb: cb, vm: vm, ids: ids, codice: vm.codice, partita: vm.partita };
      REG.S = creaStudio(t, vm.giocatori, { io: idxDi(vm, cb.myId), esci: function () { cb.onEsci(); }, titolo: OPZ_STUDIO.titolo, logo: OPZ_STUDIO.logo });
      if (conTarga(t)) REG.S.vista.classList.add("st-con-targa");   // (il posto della targhetta di chi guarda)
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
    } catch (e) { try { console.error("Linea del tempo:", e); } catch (x) {} } finally { R.corre = false; }
  }
  // un passo della regia: true se ha fatto uno spettacolo (poi si ricontrolla la situazione più recente)
  async function regiaPasso(R) {
    var vm = R.vm, S = R.S, cb = R.cb, el = R.t.el;
    if (!S.vivo()) return false;
    if (vm.carta) precaricaFoto(vm.carta);   // (la foto vera si scarica mentre la telecamera fa lo stacco)
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
      var tf = cb.sonoHost ? { host: true, nuova: cb.onNuova, esci: cb.onEsci } : (io >= 0 || conTarga(R.t) ? { host: false, esci: cb.onEsci } : null);   // (chi guarda col link: se c'è, la fine del core)
      schermataFine(R.t, cl, cb.sonoHost ? cb.onNuova : null, cb.sonoHost
        ? { online: true, testoRigioca: "↻ Nuova partita (stessi amici)", esci: cb.onEsci, tf: tf }
        : { online: true, esci: cb.onEsci, tf: tf, chiusa: !!cb.chiusa, nota: cb.chiusa ? NOTA_CHIUSA
          : io >= 0 ? "⏳ Aspetta l'host: se fa un'altra partita, torni da solo nella saletta."
          : (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta hai guardato." : conTarga(R.t) ? "👀 Hai guardato: se l'host fa un'altra partita, entri anche tu." : "⏳ Aspetta l'host: alla prossima partita giochi anche tu." });
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
      barraTL(S, [ el("p", { class: "tl-attesa", text: "💤 Aspettiamo che torni " + (assenti.join(", ") || "chi manca") + ": deve ancora giocare le sue carte." }), bFin, pFin, faccineDi(R.t) ]);
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
      barraTL(S, [ pR ]);
      R.t.contoAvanti(pR, vm._fino ? Math.max(1, Math.round((vm._fino - Date.now()) / 1000)) : RIPRESA / 1000, null, "tl-ripresa|" + vm.partita + "|" + vm.n);
      setTimeout(function () { if (S.vivo()) viaTerzo(S); }, 2600);
      return false;
    }
    if (vm.fase === "tutti") {   // ⚡ tutti insieme: la stessa carta per tutti
      var kC = "T|" + vm.n;
      if (R.kTutti !== kC) {
        R.kTutti = kC; R.aperturaFatta = true; R.mostrato = null; R.mioPosa = null; R.mioAnnoT = null; R.alzati = {}; ultimaFase = "tutti";
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
      // «🔄 Cambia carta»: stesso turno, carta nuova (niente stacco: solo la scritta, e la carta nuova sul maxischermo)
      if (R.kTurno !== kT && vm.fase === "turno" && vm.cambi && R.nTurno === vm.n && R.tTurno === vm.turnoId) {
        R.kTurno = kT; R.mostrato = null; memSel = { k: chiaveCarta(vm.carta), gap: null }; memAnno = { k: null, v: null };
        terzo(S, null, mioTurno ? "🔄 Carta cambiata!" : "🔄 " + nomeT + " cambia carta!", mioTurno ? "Ecco la carta nuova" : "Vediamo questa…", "🔄");
        setTimeout(function () { if (S.vivo()) viaTerzo(S); }, 1300);
      }
      if (R.kTurno !== kT) {   // turno nuovo: stacco su chi gioca, poi sul maxischermo
        R.kTurno = kT; R.nTurno = vm.n; R.tTurno = vm.turnoId; R.aperturaFatta = true; R.mioVoto = null; R.mostrato = null; R.alzati = {};
        memSel = { k: chiaveCarta(vm.carta), gap: null };
        vm.giocatori.forEach(function (g, i) { puntiLeggio(S, i, g.punti, 0); });
        if (vm.fase === "turno") {
          ultimaFase = "turno";
          if (mioTurno) FX.turno();
          ST.logoSchermo(S);
          await stacco(S, gi, vm.doppio ? "🔥 Ultima carta: vale doppio!" : (mioTurno ? "Tocca a te!" : "Sta per scegliere…"));
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
        // chi ha provato a rubarla: il suo cartellino si gira ✋ (verde se l'ha presa, rosso se no)
        (es.voti || []).forEach(function (v) { var i = idxDi(vm, v.id); if (i >= 0) voti.push({ i: i, d: !!v.giusto, giusto: !!v.giusto, delta: v.delta, ruba: true, presa: !!v.giusto }); });
        await rivelazione(S, { gi: gi, voti: voti, dopo: vm.giocatori.map(function (g) { return g.punti; }), es: es });
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
      barraTL(S, [ b ]);
      R.t.contoAvanti(b, sec, cb.sonoHost ? function () { viaBarra(S); cb.onAvanti(); } : null, kE);
    } else {
      var p = el("p", { class: "tl-attesa" });
      barraTL(S, [ p ]);
      R.t.contoAvanti(p, sec, null, kE);
    }
  }
  function mostraTurno(R, vm, gi, io, mioTurno, nomeT, kT) {
    var S = R.S, el = R.t.el, cb = R.cb, kCarta = chiaveCarta(vm.carta);
    var chiave = "t|" + kT + "|" + vm.giocatori.length;
    if (R.mostrato === chiave) return;
    R.mostrato = chiave;
    if (S.shot && S.shot() !== S.R.schermo) suSchermo(S, 700);
    var conf = null, sel = null;
    if (mioTurno) {
      var testoConf = function () { var v = sel ? sel.valore() : null; return memSel.gap == null ? "⤵ Tocca dove va la carta" : "✅ Mettila qui" + (v != null ? " · " + annoTesto(v) : ""); };
      conf = el("button", { class: "btn btn-primario tl-conferma",
        onclick: function () { if (memSel.gap != null) { var a = sel ? sel.valore() : null; viaBarra(S); fermaTimer(S); cb.onGap(memSel.gap, a); } } });
      // «📅 Dimmi l'anno»: si accende col posto scelto, solo con gli anni di quel posto (resta anche se la schermata si ridisegna)
      if (vm.annoOn) {
        sel = selettoreAnno(el, { lo: (vm.anni || [-3000, 2026])[0], hi: (vm.anni || [-3000, 2026])[1], spento: memSel.gap == null,
          valore: memAnno.k === kT ? memAnno.v : null,
          onCambia: function (v) { memAnno = { k: kT, v: v }; conf.textContent = testoConf(); } });
        if (memSel.gap != null) { var l0 = limitiPosto(vm.linea, memSel.gap, vm.anni); sel.imposta(l0[0], l0[1], memSel.gap === 0 ? "giu" : memSel.gap >= vm.linea.length ? "su" : null); }
      }
      conf.textContent = testoConf();
      if (memSel.gap == null) conf.disabled = true;
    }
    var ioG = trovaG(vm, cb.myId);   // («🔄 Cambia carta»: una volta a partita, solo a turno)
    schermoGioco(S, { giocatori: giocHUD(vm, cb.myId), turnoId: vm.turnoId, stato: mioTurno ? "Tocca a te!" : "Tocca a " + nomeT,
      cambia: mioTurno && vm.cambiOn && ioG && !ioG.cambio && cb.onCambia ? function () { FX.voto(); cb.onCambia(); } : null,
      sotto: vm.doppio ? "🔥 Ultima carta: vale doppio!" : (mioTurno ? "Dove va questa carta?" : "Sta scegliendo dove metterla…"), rimMs: vm._fino ? vm._fino - Date.now() : null,
      carta: vm.carta, linea: vm.linea, sel: mioTurno ? memSel.gap : null, chiave: "vm-t|" + kT,
      scegli: mioTurno ? function (i) {
        memSel = { k: kCarta, gap: i }; conf.disabled = false;
        if (sel) { var l = limitiPosto(vm.linea, i, vm.anni); sel.imposta(l[0], l[1], i === 0 ? "giu" : i >= vm.linea.length ? "su" : null); sel.accendi(true); }
        conf.textContent = testoConf();
      } : null });
    if (conf) barraTL(S, [sel, conf]);
    else barraTL(S, [ el("p", { class: "tl-attesa", text: io < 0 ? ((vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta guardi: gioca chi è stato scelto." : "👀 Stai guardando: alla prossima partita giochi anche tu!")
      : (vm.carta && vm.carta.autore === cb.myId ? "📸 È un tuo ricordo: guardali sudare!" : "✋ Guarda bene la linea: se sbaglia, puoi rubargliela!") }), faccineDi(R.t) ]);
  }
  // «✋ Rubala» online: chi gioca ha scelto il posto; gli altri toccano il posto giusto e «✋ Rubala: va qui!», o «👍 Passo».
  // In segreto: sui leggii si alza un cartellino coperto per chi ha deciso, chi ruba e dove si scopre col risultato.
  // R.mioVoto: il posto che ho scelto, −1 = passo (null = non ancora); il posto toccato resta anche se la schermata si ridisegna
  var memRuba = { k: null, gap: null };
  function primaMinuscola(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : ""; }
  function mostraVoto(R, vm, gi, io, mioTurno, nomeT, kT) {
    var S = R.S, el = R.t.el, cb = R.cb;
    var hoDeciso = vm.hannoVotato.indexOf(cb.myId) >= 0 || R.mioVoto != null;
    vm.hannoVotato.forEach(function (id) { var i = idxDi(vm, id); if (i >= 0 && !R.alzati[id]) { R.alzati[id] = true; cartello(S, i, "su", null); } });
    var mioRicordo = vm.carta && vm.carta.autore === cb.myId;
    var devo = !mioTurno && !hoDeciso && io >= 0 && !mioRicordo;
    var chiave = "v|" + kT + "|" + vm.giocatori.length + "|" + (devo ? "ruba" : "guarda");
    if (R.mostrato === chiave) return;
    R.mostrato = chiave;
    var guardo = io < 0;   // spettatore: non ruba
    var o = { giocatori: giocHUD(vm, cb.myId), turnoId: vm.turnoId, rimMs: vm._fino ? vm._fino - Date.now() : null, totMs: TEMPO_RUBA * 1000,
      carta: vm.carta, linea: vm.linea, tent: vm.scelta, tentChi: mioTurno ? "📍 L'hai messa qui tu" : "📍 L'ha messa qui " + nomeT, chiave: "vm-v|" + kT };
    if (devo) {
      if (S.shot && S.shot() !== S.R.schermo) suSchermo(S, 700);
      var n = vm.n, scelto = memRuba.k === kT ? memRuba.gap : null;
      var decidi = function (gap) {
        FX.voto(); R.mioVoto = gap; viaBarra(S); cb.onRuba(gap);
        // la decisione può perdersi (rete che salta): la ripeto finché l'host non la vede
        if (!cb.sonoHost) { var k = 0, iv = setInterval(function () {
          if (++k > 5 || !S.vivo() || R.vm.n !== n || R.vm.fase !== "votazione" || R.vm.hannoVotato.indexOf(cb.myId) >= 0) { clearInterval(iv); return; }
          cb.onRuba(gap);
        }, 2000); }
        regiaTick(R);
      };
      var bRuba = el("button", { class: "btn btn-rosso", text: scelto != null ? "✋ Rubala: va qui!" : "✋ Tocca il posto", onclick: function () { if (scelto != null) decidi(scelto); } });
      if (scelto == null) bRuba.disabled = true;
      o.stato = "✋ La rubi?"; o.sotto = nomeT + " l'ha messa qui. Sbaglia? Tocca il posto giusto";
      o.fantChi = "✋ Secondo te va qui"; o.sel = scelto;
      o.scegli = function (i) { scelto = i; memRuba = { k: kT, gap: i }; bRuba.disabled = false; bRuba.textContent = "✋ Rubala: va qui!"; };
      schermoGioco(S, o);
      barraTL(S, [ el("div", { class: "tl-vota" }, [ el("button", { class: "btn btn-verde", text: "👍 Passo", onclick: function () { decidi(-1); } }), bRuba ]), notaRuba(el, vm.doppio) ]);
      return;
    }
    // niente da fare: la telecamera va sui concorrenti a vedere i cartellini che si alzano
    var mio = R.mioVoto;
    o.stato = mioTurno ? "✋ Te la rubano?" : guardo ? "✋ Si ruba…" : mioRicordo ? "📸 È il tuo ricordo" : mio != null && mio >= 0 ? "✋ Hai provato a rubarla" : mio === -1 ? "👍 Hai passato" : "✅ Hai deciso";
    o.sotto = mioTurno ? "Gli altri decidono se rubartela…" : nomeT + " l'ha messa qui";
    schermoGioco(S, o);
    barraTL(S, [ el("p", { class: "tl-attesa", text: mioTurno ? "🤞 Se hai sbagliato, chi indovina il posto te la ruba!" : (guardo ? "👀 Stai guardando: gli altri decidono se rubare la carta di " + nomeT + "."
      : mioRicordo ? "📸 L'hai scritto tu: questa volta non rubi." : mio != null && mio >= 0 ? "✋ Secondo te va «" + primaMinuscola(etichettaSlot(vm.linea, mio)) + "». Aspetta gli altri…"
      : "Aspetta gli altri…") }), faccineDi(R.t) ]);
    largo(S, 900);
    if (mio != null && io >= 0) cartello(S, io, "su", null);
  }

  // ---------- ⚡ TUTTI INSIEME: la stessa carta per tutti ----------
  // "✅ 2 su 5 hanno scelto": si aggiorna solo questa riga (e i cartellini coperti sui leggii), il resto resta fermo
  function testoContaT(vm) {
    var au = vm.carta && vm.carta.autore, pr = vm.giocatori.filter(function (g) { return !g.via && g.id !== au; }).length, n = vm.hannoScelto.length;
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
      barraTL(S, [ R.contaT, el("p", { class: "tl-attesa", text: (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta guardi: gioca chi è stato scelto." : "👀 Stai guardando: alla prossima partita giochi anche tu!" }), faccineDi(R.t) ]);
      return;
    }
    // il mio ricordo: lo giocano gli altri, io guardo
    if (vm.carta && vm.carta.autore === cb.myId) {
      o.sotto = "📸 È un tuo ricordo: lo giocano gli altri!";
      schermoGioco(S, o);
      barraTL(S, [ R.contaT, faccineDi(R.t) ]);
      return;
    }
    if (hoScelto) {
      o.sotto = R.mioPosa != null ? "✅ Fatta! L'hai messa qui" + (R.mioAnnoT != null ? " (" + annoTesto(R.mioAnnoT) + ")" : "") + ": aspetta gli altri…" : "✅ Hai già scelto: aspetta gli altri…";
      if (R.mioPosa != null) o.tent = R.mioPosa;
      schermoGioco(S, o);
      barraTL(S, [ R.contaT, faccineDi(R.t) ]);
      return;
    }
    // da scegliere: tocca il punto, (se vuoi) l'anno, poi "✅ Mettila qui" (vale la prima: conta anche chi è più veloce)
    var sel = null, kA = "T|" + n;
    function testoConf() { var v = sel ? sel.valore() : null; return memSel.gap == null ? "⤵ Tocca dove va la carta" : "✅ Mettila qui" + (v != null ? " · " + annoTesto(v) : ""); }
    var conf = el("button", { class: "btn btn-primario tl-conferma", onclick: function () {
      if (memSel.gap == null || R.mioPosa != null) return;
      var gap = memSel.gap, anno = sel ? sel.valore() : null; R.mioPosa = gap; R.mioAnnoT = anno; FX.voto();
      cb.onPosa(gap, anno);
      // la scelta può perdersi (rete che salta): la ripeto finché l'host non la vede
      var k = 0, iv = setInterval(function () {
        if (++k > 6 || !S.vivo() || R.vm.n !== n || R.vm.fase !== "tutti" || R.vm.hannoScelto.indexOf(cb.myId) >= 0) { clearInterval(iv); return; }
        cb.onPosa(gap, anno);
      }, 2000);
      regiaTick(R);
    } });
    if (vm.annoOn) {
      sel = selettoreAnno(el, { lo: (vm.anni || [-3000, 2026])[0], hi: (vm.anni || [-3000, 2026])[1], spento: memSel.gap == null,
        valore: memAnno.k === kA ? memAnno.v : null, onCambia: function (v) { memAnno = { k: kA, v: v }; conf.textContent = testoConf(); } });
      if (memSel.gap != null) { var l0 = limitiPosto(vm.linea, memSel.gap, vm.anni); sel.imposta(l0[0], l0[1], memSel.gap === 0 ? "giu" : memSel.gap >= vm.linea.length ? "su" : null); }
    }
    conf.textContent = testoConf();
    if (memSel.gap == null) conf.disabled = true;
    o.sotto = vm.annoOn ? "Dove va? +50 al più veloce, l'anno più vicino +100" : "Dove va? Al più veloce dei giusti 50 punti in più"; o.sel = memSel.gap;
    o.scegli = function (i) {
      memSel = { k: kCarta, gap: i }; conf.disabled = false;
      if (sel) { var l = limitiPosto(vm.linea, i, vm.anni); sel.imposta(l[0], l[1], i === 0 ? "giu" : i >= vm.linea.length ? "su" : null); sel.accendi(true); }
      conf.textContent = testoConf();
    };
    schermoGioco(S, o);
    barraTL(S, [ sel, conf, R.contaT ]);
  }
  // il risultato: la carta si gira e svela l'anno, poi chi l'ha messa giusta (sul maxischermo e sui cartellini dei leggii)
  function nodoEsitoTutti(el, vm, myId) {
    var es = vm.esitoT || {}, ic = infoCat(es.cat), ris = (es.risultati || []).slice(), mio = null;
    ris.forEach(function (r) { if (r.id === myId) mio = r; });
    var molti = ris.length > 6;
    var verd = mio ? (mio.suo ? "📸 Il tuo ricordo!" : mio.giusto ? "✅ Giusta! +" + fmtN(mio.delta) + (mio.veloce ? " ⚡" : "") + (mio.bonus ? " 🎯" : "") : mio.scelto ? "❌ Sbagliata" : "⏰ Tempo scaduto") : "📅 " + annoTesto(es.anno);
    // «📅 Dimmi l'anno»: chi ci è andato più vicino
    var vicini = ris.filter(function (r) { return r.bonus; }).map(function (r) { var g = trovaG(vm, r.id); return g ? g.nome : ""; }).filter(Boolean);
    var box = el("div", { class: "tl-esito tl-esito-t" + (molti ? " molti" : "") }, [
      el("div", { class: "tl-flip ok corta", style: stileCat(es.cat) }, [
        el("div", { class: "tl-flip-in" }, [
          el("div", { class: "tl-flip-f" }, [ el("div", { class: "q", text: "?" }), el("div", { class: "tit", text: ic.icona + " " + es.titolo }) ]),
          el("div", { class: "tl-flip-f retro" }, [ el("div", { class: "grande", text: annoTesto(es.anno) }), el("div", { class: "tit", text: es.titolo }) ])
        ])
      ]),
      el("div", { class: "tl-verdetto " + (!mio || mio.giusto ? "giusto" : "sbagliato"), text: verd }),
      es.doppio ? el("div", { class: "tl-delta su", text: "🔥 Punti doppi!" }) : null,
      vicini.length ? el("div", { class: "tl-delta su", text: "🎯 Il più vicino: " + vicini.join(", ") }) : null,
      (!molti && !vicini.length && es.fatto) ? el("div", { class: "tl-desc-es", text: es.fatto }) : null
    ]);
    // prima i giusti (dal più veloce), poi chi ha sbagliato, poi chi non ha scelto
    function ordine(r) { return r.suo ? 3 : r.giusto ? 0 : r.scelto ? 1 : 2; }
    ris.sort(function (a, b) { return ordine(a) - ordine(b) || ((a.sec || 0) - (b.sec || 0)); });
    var ul = el("ul", { class: "tl-tutti" + (ris.length >= 4 ? " due" : "") });
    ris.forEach(function (r) {
      var g = trovaG(vm, r.id); if (!g) return;
      ul.appendChild(el("li", { class: r.giusto ? "si" : "no" }, [
        el("span", { class: "av", html: avatarDi(g, r.giusto ? "esulta" : null) }),
        el("span", { class: "nm", text: (r.suo ? "📸 " : r.giusto ? "✅ " : r.scelto ? "❌ " : "⏰ ") + g.nome + (r.id === myId ? " (tu)" : "") }),
        r.anno != null ? el("span", { class: "an", text: annoTesto(r.anno) }) : null,
        el("span", { class: "d", text: r.giusto ? "+" + fmtN(r.delta) + (r.veloce ? " ⚡" : "") + (r.bonus ? " 🎯" : "") : "" })
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
    setTimeout(function () { if (!mio || mio.giusto) FX.giusto(); else FX.sbagliato(); if (mio && mio.bonus) vibra([30, 60, 30]); }, 1300);
    await dorme(2400);
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
    barraTL(S, nodi);
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

  // «📸 I nostri ricordi» in saletta: un tasto (sempre lo stesso nodo: la saletta non lampeggia) che apre il foglio per scriverli
  var LR = null;
  function nodoRicordiLobby(t, vm, cb) {
    if (vm.ricordiOn === false || !cb.onRicordi) return null;
    if (!LR || LR.t !== t) {
      LR = { t: t };
      LR.btn = t.el("button", { class: "btn btn-fantasma tl-ric-btn", type: "button", onclick: function () {
        foglioRicordi(t.el, { dopo: function (l) { cb.onRicordi(l); LR.miei = l.length; scriviLR(); }, vivo: function () { return document.body.contains(LR.btn); } });
      } });
    }
    LR.miei = mieiRicordi().length; LR.vm = vm;
    scriviLR();
    return LR.btn;
  }
  function scriviLR() {
    if (!LR) return;
    var vm = LR.vm || {}, da = vm.ricDa || [];
    var tx = testoBtnRicordi(LR.miei, vm.nRic) + (da.length ? " (" + (da.length > 3 ? da.slice(0, 3).join(", ") + "…" : da.join(", ")) + ") ✍️" : "");
    if (LR.btn.textContent !== tx) LR.btn.textContent = tx;
  }
  // la saletta d'attesa (uguale per tutti i giochi)
  function disegnaLobby(t, vm, cb) {
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, puoiDaSolo: true,
      giocatori: vm.giocatori.map(function (g, i) { return { id: g.id, nome: g.nome, omino: g.omino || null, host: i === 0, tu: g.id === cb.myId }; }),
      nota: cb.sonoHost && vm.giocatori.length < 2 ? "Si gioca meglio in 2 o più: invita gli amici col tasto 📤." : null,
      extra: [ nodoRicordiLobby(t, vm, cb) ],   // (le regole le scrive il core: «📜 Si gioca così: 5 carte a testa · …»)
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
