/* =========================================================
   GIOCO — L'Asta
   Un telefono appoggiato al tavolo: tutti vedono le carte e
   ognuno tocca il proprio tasto per rilanciare.
   4 round a tema; in ogni round ciascuno si aggiudica 1 carta.
   Alla fine si votano i kit degli altri con le stelle.
   ========================================================= */
(function () {
  "use strict";

  var TOT_ROUND = 4;
  var SECONDI = 10;      // conto alla rovescia dopo ogni rilancio
  var FANTA_VUOTO_MS = 6000, FANTA_RILANCIO_MS = 8000;   // fantacalcio: 6 secondi finché nessuno offre, 8 dopo ogni offerta
  var SCELTA_MS = 20000;  // (online) tempo per scegliere la carta da mettere all'asta: poi ne esce una a caso
  var AUTO_ESITO_MS = 4000, AUTO_ROUND_MS = 4500;   // temi: l'esito e l'inizio round vanno avanti da soli (c'è anche il tasto)
  var AUTO_KIT_MS = 15000;   // (online) i kit completi restano a schermo 15 secondi, poi si vota da soli
  // (online) il voto ha un tempo per tutti: 60 secondi fino a 4 giocatori, 10 in più per ognuno dopo (al massimo 2 minuti);
  // poco prima della fine i voti messi partono da soli, e chi non ha votato dà 3,5 ⭐ a testa
  function votoMs(n) { return Math.min(120000, 60000 + Math.max(0, n - 4) * 10000); }
  var MAX_GIOCATORI = 10;
  var PARTITE_SALVATE = Object.create(null);

  function nuovaSessione() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  function salvaTrofeiAsta(t, vm, idGiocatore, online) {
    try {
      if (!vm || vm.fase !== "fine" || t.guarda || (t.linkParams && t.linkParams.prova) ||
          (t.impostazioni && t.impostazioni.prova) || !vm.sessione ||
          !(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var profilo = SGNube.profilo(), lista = vm.giocatori || [];
      var me = online ? lista.filter(function (g) { return g.id === idGiocatore; })[0] :
        lista.filter(function (g) { return String(g.nome || "").trim().toLowerCase() === String(profilo.nome || "").trim().toLowerCase(); })[0];
      if (!me || !String(profilo.nome || "").trim() || String(profilo.nome).trim().toLowerCase() !== String(me.nome || "").trim().toLowerCase()) return;
      var profiloId = String(profilo.uid || profilo.nome).trim().toLowerCase();
      var chiave = "asta|" + vm.sessione + "|" + profiloId;
      if (PARTITE_SALVATE[chiave]) return;
      var chiaveLocale = "sg-asta-ultima-partita-" + profiloId;
      try { if (window.localStorage && localStorage.getItem(chiaveLocale) === String(vm.sessione)) { PARTITE_SALVATE[chiave] = 1; return; } } catch (e) {}
      var classifica = vm.classifica || [], posizione = classifica.findIndex(function (g) { return online ? g.id === idGiocatore : String(g.nome || "").trim().toLowerCase() === String(me.nome || "").trim().toLowerCase(); });
      var vinta = posizione >= 0 && (classifica[posizione].pos || posizione + 1) === 1, formato = vm.formato === "fanta" ? "Fanta" : "Temi";
      var incr = [["partite", 1], ["partite" + formato, 1], ["asteVinte", Math.max(0, +me.asteVinte || 0)],
        ["creditiSpesi", Math.max(0, +me.creditiSpesi || 0)], ["stelleRicevute", Math.max(0, +me.stelle || 0)]];
      if (online) incr.push(["partiteOnline", 1]);
      if (vinta) { incr.push(["vinte", 1], ["vinte" + formato, 1]); if (online) incr.push(["vinteOnline", 1]); }
      var s = SGNube.statGioco ? (SGNube.statGioco("asta") || {}) : {};
      if (s.ultimaPartitaTrofei === vm.sessione) return;
      PARTITE_SALVATE[chiave] = 1;
      try { if (window.localStorage) localStorage.setItem(chiaveLocale, String(vm.sessione)); } catch (e) {}
      SGNube.salvaProgressi(null, "asta", incr.filter(function (x) { return x[1] > 0; }), [], [["ultimaPartitaTrofei", vm.sessione]]);
    } catch (e) {}
  }

  // --- Aspetto specifico del gioco ---
  var stile = document.createElement("style");
  stile.textContent = [
    ".as-round{text-align:center;margin:6px 0 14px;}",
    ".as-round .n{font-size:.8rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--testo-tenue);}",
    ".as-round .t{font-size:2rem;font-weight:900;line-height:1.05;margin-top:2px;",
      "background:linear-gradient(135deg,#ffe58a,var(--accento) 55%,#ff9d3a);",
      "-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;}",
    ".as-top{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;margin:0 -2px 10px;}",
    ".as-pt{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:1px;background:var(--carta);",
      "border:2px solid transparent;border-radius:14px;padding:7px 12px;min-width:66px;}",
    ".as-pt .n{font-size:.78rem;font-weight:700;color:var(--testo-tenue);max-width:9ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".as-pt .c{font-size:1.05rem;font-weight:900;}",
    ".as-pt.attivo{border-color:var(--accento);}",
    ".as-pt.fatto{opacity:.5;}",
    ".as-griglia{display:flex;flex-direction:column;gap:10px;}",
    ".as-carta{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:1px solid rgba(255,255,255,.06);cursor:pointer;",
      "background:linear-gradient(160deg,var(--carta),#191735);color:inherit;border-radius:18px;padding:12px 14px;box-shadow:var(--ombra);",
      "font-family:inherit;transition:transform .06s ease;}",
    ".as-carta:active{transform:scale(.98);}",
    ".as-carta .em{font-size:2.3rem;width:64px;height:64px;flex:0 0 auto;display:flex;align-items:center;",
      "justify-content:center;border-radius:16px;background:radial-gradient(120% 120% at 30% 22%,var(--carta-2),#1c1940);",
      "border:1px solid rgba(255,255,255,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 4px 10px rgba(0,0,0,.28);}",
    ".as-carta .nm{flex:1;min-width:0;font-size:1.14rem;font-weight:800;line-height:1.22;letter-spacing:.005em;}",
    ".tier{flex:0 0 auto;font-size:.85rem;font-weight:900;width:30px;height:30px;border-radius:50%;",
      "display:flex;align-items:center;justify-content:center;}",
    ".tier-A{background:linear-gradient(135deg,#ffe58a,var(--accento-scuro));color:#241f00;}",
    ".tier-B{background:linear-gradient(135deg,#9fb4ff,#5468c7);color:#0d1230;}",
    ".tier-C{background:var(--carta-2);color:var(--testo-tenue);}",
    ".tier-x{background:var(--carta-2);color:var(--testo-tenue);}",
    ".as-fascia-x{margin-top:6px;font-weight:900;opacity:.6;font-size:.95rem;}",
    // badge ruolo del Fantacalcio (POR/DIF/CEN/ATT) — niente fasce a schermo
    ".as-rb{flex:0 0 auto;font-size:.68rem;font-weight:900;letter-spacing:.04em;padding:4px 8px;border-radius:8px;color:#0d1230;}",
    ".as-rb-P{background:linear-gradient(135deg,#ffd27a,#e0a90a);}",
    ".as-rb-D{background:linear-gradient(135deg,#9fe6b4,#3fb56a);}",
    ".as-rb-C{background:linear-gradient(135deg,#9fb4ff,#5468c7);color:#eef1ff;}",
    ".as-rb-A{background:linear-gradient(135deg,#ff9d8a,#e0533a);color:#fff;}",
    // Fantacalcio: avviso ultimo duello + pannello \"rose finora\" in linea (solo carte prese, per ruolo)
    ".as-duello{background:linear-gradient(135deg,#ffb347,#e0533a);color:#2a1200;font-weight:900;text-align:center;border-radius:12px;padding:10px 12px;margin:2px 0 10px;font-size:.95rem;line-height:1.25;}",
    ".as-rose{margin-top:14px;border-top:1px solid rgba(255,255,255,.1);padding-top:4px;}",
    ".as-rose-p{background:var(--carta);border-radius:14px;padding:10px 12px;margin-bottom:8px;box-shadow:var(--ombra);}",
    ".as-rose-nome{font-weight:900;font-size:1rem;margin-bottom:4px;}",
    ".as-rose-vuota{color:var(--testo-tenue);font-size:.9rem;font-style:italic;}",
    ".as-rose-riga{display:flex;align-items:center;gap:9px;padding:3px 0;font-size:.95rem;}",
    ".as-rose-em{font-size:1.2rem;flex:0 0 auto;}",
    ".as-rose-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    // votazione col budget di stelle (mezze stelle)
    ".as-budget{position:sticky;top:0;z-index:2;text-align:center;font-weight:900;padding:10px 12px;margin:0 0 10px;border-radius:12px;background:linear-gradient(135deg,#ffe58a,var(--accento) 60%,#ff9d3a);color:#2a2400;font-size:.98rem;line-height:1.25;}",
    ".as-budget.ok{background:linear-gradient(135deg,#9fe6b4,#3fb56a);color:#04321c;}",
    ".as-vrow{display:flex;align-items:center;justify-content:center;gap:14px;margin:-2px 0 12px;}",
    ".as-vbtn{width:46px;height:46px;border-radius:50%;border:0;font-size:1.5rem;font-weight:900;font-family:inherit;cursor:pointer;background:var(--carta-2);color:var(--testo);line-height:1;}",
    ".as-vbtn:disabled{opacity:.3;}",
    ".as-vval{min-width:74px;text-align:center;font-size:1.25rem;font-weight:900;color:var(--accento);}",
    // barra dei tasti offerta/passa SEMPRE visibile in basso durante l'asta (niente scroll per offrire)
    ".piede-fisso{position:sticky;bottom:0;z-index:5;margin:14px -16px 0;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:var(--sfondo);box-shadow:0 -6px 16px rgba(0,0,0,.4);}",
    ".as-big{text-align:center;background:linear-gradient(150deg,#fff3cf,var(--accento) 58%,var(--accento-scuro));",
      "color:#2a2400;border-radius:24px;padding:20px 18px 22px;box-shadow:0 12px 34px rgba(224,169,10,.4),inset 0 1px 0 rgba(255,255,255,.5);margin-bottom:12px;}",
    ".as-big .em{font-size:3.4rem;line-height:1;display:inline-flex;align-items:center;justify-content:center;width:98px;height:98px;border-radius:50%;",
      "background:radial-gradient(120% 120% at 32% 24%,#fffdf6,#ffe7ab);box-shadow:0 6px 16px rgba(150,90,0,.32),inset 0 2px 0 rgba(255,255,255,.7);margin:2px auto 8px;}",
    ".as-big .nm{font-size:1.62rem;font-weight:900;line-height:1.14;letter-spacing:.01em;margin-top:2px;}",
    ".as-offerta{text-align:center;margin:10px 0;}",
    ".as-offerta .v{font-size:2.6rem;font-weight:900;color:var(--accento);line-height:1;}",
    ".as-offerta .chi{font-size:1rem;font-weight:700;color:var(--testo-tenue);margin-top:2px;}",
    ".as-timer{height:8px;border-radius:99px;background:var(--carta);overflow:hidden;margin:4px 0 14px;}",
    ".as-timer-fill{height:100%;width:100%;border-radius:99px;background:linear-gradient(90deg,var(--verde),var(--accento));}",
    ".as-bid{display:flex;align-items:center;gap:8px;background:var(--carta);border:2px solid transparent;",
      "border-radius:14px;padding:8px 10px;margin-bottom:8px;}",
    ".as-bid.leader{border-color:var(--accento);}",
    ".as-bid .who{flex:1;min-width:0;}",
    ".as-bid .who b{display:block;font-size:1rem;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".as-bid .who span{font-size:.8rem;color:var(--testo-tenue);}",
    ".as-bid button{border:0;font-family:inherit;font-weight:800;border-radius:12px;cursor:pointer;min-height:44px;padding:0 14px;}",
    ".as-bid .su{background:linear-gradient(135deg,#4fe895,#1faf60);color:#04321c;font-size:1rem;}",
    ".as-bid .no{background:var(--carta-2);color:var(--testo-tenue);font-size:.9rem;}",
    ".as-bid button:disabled{opacity:.35;}",
    ".as-fuori{opacity:.45;}",
    // (online) classifica finale alta come lo schermo: i tasti in fondo si vedono sempre, se serve scorre solo il centro
    ".schermata.as-fissa{flex:0 0 auto;height:var(--alt,100dvh);max-height:var(--alt,100dvh);min-height:0;}",
    ".schermata.as-fissa>.contenuto{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}",
    ".as-kit{background:var(--carta);border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:var(--ombra);}",
    ".as-kit h3{margin:0 0 8px;font-size:1.15rem;}",
    ".as-kit .riga{display:flex;align-items:center;gap:10px;padding:4px 0;font-size:.98rem;}",
    ".as-kit .riga .em{font-size:1.3rem;}",
    // tanti kit insieme (riepilogo e fasce svelate): due colonne di carte e righe basse, così si legge quasi senza scorrere
    ".as-kits .as-kit{display:grid;grid-template-columns:1fr 1fr;column-gap:8px;padding:7px 10px;margin-bottom:6px;border-radius:13px;}",
    ".as-kits .as-kit h3{grid-column:1/-1;font-size:.92rem;margin:0 0 2px;}",
    ".as-kits .as-kit .riga{min-width:0;padding:1px 0;gap:5px;font-size:.76rem;line-height:1.2;}",
    ".as-kits .as-kit .riga>span[style]{min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
    ".as-kits .as-kit .riga .em{font-size:1rem;flex:none;}.as-kits .as-kit .tier{flex:none;}",
    ".as-stelle{display:flex;gap:6px;justify-content:center;margin-top:10px;}",
    ".as-stelle button{border:0;background:transparent;font-size:1.9rem;line-height:1;cursor:pointer;",
      "filter:grayscale(1);opacity:.4;padding:2px;}",
    ".as-stelle button.on{filter:none;opacity:1;}",
    ".as-msg{text-align:center;color:var(--testo-tenue);font-weight:700;}",
    // striscia dei 4 round (tutte le cose che si metteranno all'asta): quella in corso ha il contorno giallo
    ".as-steps{display:flex;gap:5px;justify-content:center;margin:2px 0 12px;}",
    ".as-step{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;background:var(--carta);",
      "border:2px solid transparent;border-radius:12px;padding:7px 3px 6px;opacity:.6;position:relative;}",
    ".as-step .si{font-size:1.2rem;line-height:1;}",
    ".as-step .sn{font-size:.58rem;font-weight:800;line-height:1.12;text-align:center;color:var(--testo);}",
    ".as-step .sk{position:absolute;top:2px;right:4px;font-size:.62rem;color:var(--verde);font-weight:900;}",
    ".as-step.fatto{opacity:.5;}",
    ".as-step.ora{opacity:1;border-color:var(--accento);background:linear-gradient(150deg,var(--carta-2),#2a2550);",
      "box-shadow:0 0 0 1px var(--accento) inset,0 4px 14px rgba(224,169,10,.25);}",
    ".as-step.ora .sn{color:var(--accento);}",
    // pannello \"ancora in palio\" durante l'asta di una carta
    ".as-palio{background:var(--carta);border-radius:14px;margin:2px 0 12px;padding:2px 12px 8px;}",
    ".as-palio .ph{padding:10px 0 2px;font-weight:800;color:var(--testo);display:flex;align-items:center;gap:8px;font-size:.95rem;}",
    ".as-palio .pr{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.95rem;}",
    ".as-palio .pr .em{font-size:1.25rem;width:32px;text-align:center;flex:0 0 auto;}",
    ".as-palio .pr .nm{flex:1;min-width:0;}",
    ".as-palio .pr.ora-c{color:var(--accento);font-weight:800;}",
    // ---- la sala d'asta vista dalle spalle del banditore, e lo stadio del fantacalcio (tutto a schermo, niente scorrimento) ----
    ".schermata.sa-sala{position:fixed;inset:0;z-index:5;padding:0;min-height:0;height:var(--alt,100dvh);overflow:hidden;display:flex;flex-direction:column;color:#fff;animation:none;background:linear-gradient(180deg,#3d1620 0%,#5c2331 36%,#5a3218 37.5%,#2c160b 100%);}",
    ".sa-sfondo{position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;}",
    ".sa-sala::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at 50% 42%,rgba(0,0,0,0) 48%,rgba(0,0,0,.42) 100%);}",
    ".sa-testa,.sa-pannello,.st-board,.sa-avviso,.sa-tempo,.sa-platea,.st-tribuna,.st-campo-box,.st-podio,.sa-basso,.sa-piede{position:relative;z-index:2;}",
    ".sa-testa{flex:none;display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 10px 2px;}",
    ".sa-tasto{border:0;height:38px;min-width:38px;padding:0 12px;border-radius:19px;background:rgba(255,255,255,.93);color:#2b1a10;font-weight:900;font-size:15px;font-family:inherit;box-shadow:0 3px 10px rgba(0,0,0,.3);}",
    ".sa-info{flex:1;min-width:0;text-align:center;font-weight:800;font-size:.8rem;text-shadow:0 1px 3px rgba(0,0,0,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".sa-vuoto{min-width:38px;}",
    // il pannello del lotto appeso alla parete: l'oggetto a sinistra, l'offerta a destra
    ".sa-pannello{flex:none;margin:6px 16px 0;display:flex;align-items:stretch;gap:8px;padding:7px;border-radius:12px;background:linear-gradient(180deg,#23302a,#101813);border:3px solid #d4af37;box-shadow:0 0 0 2px #6e5420,0 12px 26px rgba(0,0,0,.55),inset 0 0 16px rgba(0,0,0,.6);}",
    ".sa-lotto{flex:1;min-width:0;background:linear-gradient(180deg,#fffdf6,#f1e6cc);color:#2b2b2b;border-radius:8px;padding:6px 6px 5px;text-align:center;display:flex;flex-direction:column;justify-content:center;}",
    ".sa-carta-in .em{font-size:2.2rem;line-height:1.1;display:inline-flex;align-items:center;justify-content:center;}",
    ".sa-carta-in .em svg{width:50px;height:50px;}",
    ".sa-carta-in .nm{font-weight:900;font-size:1rem;line-height:1.18;margin-top:2px;}",
    ".sa-sotto{margin-top:2px;font-size:.68rem;font-weight:800;opacity:.6;}",
    ".sa-prezzo{flex:0 0 34%;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}",
    ".sa-prezzo small{font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:#d4af37;font-weight:900;}",
    ".sa-prezzo b{font-size:2.05rem;line-height:1.05;font-weight:900;color:#ffe08a;}",
    ".sa-prezzo span{font-size:.72rem;font-weight:800;opacity:.92;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".sa-avviso{flex:none;margin:6px 12px 0;padding:6px 10px;border-radius:10px;background:rgba(255,212,59,.95);color:#3a2200;font-weight:800;font-size:.78rem;text-align:center;}",
    ".sa-tempo{flex:none;height:8px;margin:8px 18px 0;border-radius:6px;background:rgba(255,255,255,.22);overflow:hidden;}",
    ".sa-tempo i{display:block;height:100%;transform-origin:left center;background:linear-gradient(90deg,#ff6b6b,#ffd43b,#51cf66);}",
    ".sa-sala.ultimi .sa-tempo i{background:#ff6b6b;animation:saUltimi .5s ease-in-out infinite alternate;}",
    "@keyframes saUltimi{from{opacity:1}to{opacity:.4}}",
    // il pubblico seduto: due file, quella dietro più piccola; davanti i primi numeri
    ".sa-platea{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:6px 4px 0;}",
    ".sa-fila{display:flex;justify-content:center;align-items:flex-end;gap:0 2%;}",
    ".sa-file{display:flex;flex-direction:column;gap:2px;transform-origin:50% 50%;}",
    ".sa-figura img{pointer-events:none;}",
    ".sa-pers{position:relative;display:flex;flex-direction:column;align-items:center;width:22%;max-width:112px;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:opacity .2s;user-select:none;-webkit-user-select:none;}",
    ".sa-fila0.n1 .sa-pers,.sa-fila0.n2 .sa-pers{width:31%;max-width:156px;}.sa-fila0.n3 .sa-pers{width:27%;max-width:136px;}.sa-fila0.n4 .sa-pers{width:22%;max-width:114px;}.sa-fila0.n5 .sa-pers{width:18.5%;max-width:98px;}",
    ".sa-fila1.n1 .sa-pers,.sa-fila1.n2 .sa-pers{width:23%;max-width:116px;}.sa-fila1.n3 .sa-pers{width:20%;max-width:100px;}.sa-fila1.n4 .sa-pers{width:17%;max-width:86px;}.sa-fila1.n5 .sa-pers{width:15%;max-width:76px;}",
    ".sa-figura{position:relative;width:100%;aspect-ratio:200/264;}",
    ".sa-sedia,.sa-av{position:absolute;left:0;top:0;width:100%;height:100%;}",
    ".sa-av{transition:opacity .12s;}",
    ".sa-av.sa-su{opacity:0;}",
    ".sa-pers.guida .sa-av{opacity:0;}.sa-pers.guida .sa-av.sa-su{opacity:1;}",
    ".sa-paletta{position:absolute;width:44%;aspect-ratio:1;transform:translate(-50%,-118%) rotate(8deg) scale(.5);opacity:0;transition:transform .22s cubic-bezier(.3,1.6,.5,1),opacity .15s;pointer-events:none;}",
    ".sa-paletta span{position:absolute;inset:0;border-radius:50%;background:#fff;border:3px solid #c92a2a;color:#c92a2a;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 3px 6px rgba(0,0,0,.35);}",
    ".sa-paletta::after{content:'';position:absolute;left:50%;top:94%;width:10%;height:62%;margin-left:-5%;border-radius:3px;background:#8b5a2b;z-index:-1;}",
    ".sa-pers.guida .sa-paletta{opacity:1;transform:translate(-50%,-118%) rotate(8deg) scale(1);}",
    ".sa-pers.salta .sa-figura{animation:saSalta .45s ease-out;}",
    "@keyframes saSalta{0%{transform:translateY(0)}35%{transform:translateY(-9%)}100%{transform:translateY(0)}}",
    ".sa-nuvola{position:absolute;left:50%;top:-6%;transform:translate(-50%,-100%);padding:3px 8px;border-radius:10px;background:#2f9e44;color:#fff;font-weight:900;font-size:.82rem;white-space:nowrap;opacity:0;box-shadow:0 3px 8px rgba(0,0,0,.35);pointer-events:none;z-index:3;}",
    ".sa-nuvola.via{animation:saNuvola 1.7s ease-out forwards;}",
    "@keyframes saNuvola{0%{opacity:0;transform:translate(-50%,-70%)}15%{opacity:1;transform:translate(-50%,-100%)}75%{opacity:1;transform:translate(-50%,-110%)}100%{opacity:0;transform:translate(-50%,-150%)}}",
    ".sa-num{position:absolute;left:2%;bottom:4%;min-width:20px;height:20px;padding:0 4px;border-radius:10px;background:#fff;color:#c92a2a;font-weight:900;font-size:.72rem;line-height:20px;text-align:center;font-style:normal;box-shadow:0 2px 4px rgba(0,0,0,.35);}",
    ".sa-pers b{font-size:.72rem;line-height:1.1;text-shadow:0 1px 3px rgba(0,0,0,.8);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".sa-pers small{font-size:.62rem;font-weight:800;opacity:.88;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.8);}",
    ".sa-pers.fuori{opacity:.42;}.sa-pers.via{opacity:.3;}",
    ".sa-pers.puo .sa-figura::before{content:'';position:absolute;left:8%;right:8%;bottom:-2%;height:12%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,224,102,.8),rgba(255,224,102,0) 70%);}",
    ".sa-pers.mio b{color:#ffe066;}.sa-pers.mio .sa-num{background:#ffe066;color:#3a2200;}",
    ".sa-passo{position:relative;z-index:6;margin-top:2px;border:0;border-radius:10px;min-height:28px;min-width:54px;padding:3px 10px;font-size:.74rem;font-weight:900;font-family:inherit;background:rgba(255,255,255,.26);color:#fff;}",
    // in basso: il banditore di spalle dietro il leggio, e a destra la riga d'aiuto e i tasti
    ".sa-basso{flex:none;display:flex;align-items:flex-end;gap:4px;pointer-events:none;}.sa-basso .sa-piede>*{pointer-events:auto;}",
    ".sa-ban{position:relative;flex:none;width:min(42%,calc(var(--alt,100dvh)*.21));max-width:190px;margin-left:-5%;aspect-ratio:200/236;align-self:flex-end;}",
    ".sa-ban-img{position:absolute;left:0;top:0;width:100%;}",
    ".sa-leggio{position:absolute;left:-4%;width:110%;top:77%;}",
    ".sa-ban.batte .sa-ban-img{animation:saBatte .45s ease-in-out 2;}",
    "@keyframes saBatte{0%,100%{transform:none}40%{transform:translateY(-4%) rotate(-3deg)}70%{transform:translateY(2%)}}",
    ".sa-martello{position:absolute;z-index:3;right:0;top:50%;font-size:28px;transform-origin:85% 85%;transform:rotate(-20deg);}",
    ".sa-martello.batte{animation:saMartello .45s ease-in 2;}",
    "@keyframes saMartello{0%{transform:rotate(-20deg)}40%{transform:rotate(-75deg)}70%{transform:rotate(25deg)}100%{transform:rotate(-20deg)}}",
    ".sa-bolla{position:absolute;z-index:4;left:42%;bottom:96%;width:max-content;max-width:180%;padding:7px 11px;border-radius:14px;background:#fff;color:#2b1a10;font-weight:900;font-size:.8rem;box-shadow:0 4px 12px rgba(0,0,0,.35);opacity:0;pointer-events:none;}",
    ".sa-bolla::after{content:'';position:absolute;left:18px;bottom:-7px;border:7px solid transparent;border-top-color:#fff;border-bottom:0;}",
    ".sa-bolla.conta{background:#c92a2a;color:#fff;font-size:1rem;}.sa-bolla.conta::after{border-top-color:#c92a2a;}",
    ".sa-bolla.via{animation:saBolla 2.6s ease-out forwards;}",
    "@keyframes saBolla{0%{opacity:0;transform:translateY(12%) scale(.92)}10%{opacity:1;transform:none}80%{opacity:1;transform:none}100%{opacity:0;transform:none}}",
    ".sa-piede{flex:1;min-width:0;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-end;gap:6px;padding:4px 12px calc(10px + env(safe-area-inset-bottom)) 0;}",
    ".sa-piede .btn{width:100%;max-width:none;min-height:46px;margin:0;}",
    ".sa-nota{margin:0;text-align:center;font-size:.74rem;font-weight:700;opacity:.92;text-shadow:0 1px 3px rgba(0,0,0,.7);}",
    ".sa-aggiudicato{position:absolute;z-index:8;left:50%;top:15%;transform:translate(-50%,-50%) rotate(-6deg);padding:10px 20px;border-radius:14px;border:4px solid #fff;background:#e03131;color:#fff;font-weight:900;font-size:1.8rem;letter-spacing:.06em;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.5);animation:saTimbro .35s cubic-bezier(.2,1.6,.4,1);pointer-events:none;}",
    "@keyframes saTimbro{from{transform:translate(-50%,-50%) rotate(-6deg) scale(2.2);opacity:0}to{transform:translate(-50%,-50%) rotate(-6deg) scale(1);opacity:1}}",
    ".sa-sala.chiusa .sa-pers,.sa-sala.chiusa .sa-piede .btn,.sa-sala.chiusa:not(.st-stadio) .sa-extra{pointer-events:none;}",
    // la scelta della carta: con tante carte, due o tre colonne (niente scorrimento)
    ".as-griglia.tante{display:grid;grid-template-columns:1fr 1fr;gap:8px;}",
    ".as-griglia.tante .as-carta{flex-direction:column;justify-content:center;text-align:center;gap:6px;padding:10px 8px;border-radius:16px;}",
    ".as-griglia.tante .as-carta .em{width:50px;height:50px;font-size:1.8rem;border-radius:14px;}",
    ".as-griglia.tante .as-carta .em svg{width:72%;height:72%;}",
    ".as-griglia.tante .as-carta .nm{flex:none;font-size:.92rem;}",
    ".as-griglia.molte{grid-template-columns:1fr 1fr 1fr;gap:6px;}",
    ".as-griglia.molte .as-carta{padding:6px 4px;gap:3px;border-radius:14px;}",
    ".as-griglia.molte .as-carta .em{width:36px;height:36px;font-size:1.3rem;border-radius:11px;}",
    ".as-griglia.molte .as-carta .nm{font-size:.74rem;line-height:1.15;}",
    // tante carte da scegliere (7-10): tutto un po' più stretto, così entra nello schermo senza scorrere
    ".as-stretto .as-round{margin:0 0 2px !important;}.as-stretto .as-steps{margin-bottom:6px;}.as-stretto .as-step{padding:4px 3px;}",
    ".as-stretto .as-top{margin-bottom:6px;padding-bottom:4px;gap:6px;}.as-stretto .as-pt{padding:3px 9px;min-width:54px;border-radius:11px;}",
    ".as-stretto .as-pt .n{font-size:.68rem;}.as-stretto .as-pt .c{font-size:.88rem;}.as-stretto .as-msg{font-size:.9rem;line-height:1.25;}",
    ".as-stretto .as-griglia.molte .as-carta .em{width:32px;height:32px;font-size:1.15rem;}",
    // il tempo per scegliere la carta (online) e l'avanzamento automatico: barre che si accorciano (solo transform)
    ".as-tbar{height:6px;border-radius:99px;background:var(--carta);overflow:hidden;margin:0 0 8px;}",
    ".as-tbar i{display:block;height:100%;transform-origin:left center;background:linear-gradient(90deg,#ff6b6b,var(--accento),var(--verde));}",
    ".btn.as-auto{position:relative;overflow:hidden;}",
    ".btn.as-auto::after{content:'';position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.55);transform-origin:left center;animation:asAuto var(--ms,4s) linear var(--rit,0s) forwards;}",
    "@keyframes asAuto{from{transform:scaleX(1)}to{transform:scaleX(0)}}",
    // la votazione compatta: una riga per kit (nome, le carte in breve, le stelle a destra); toccando la riga si legge tutto
    ".as-kv{display:flex;align-items:center;gap:8px;background:var(--carta);border-radius:14px;padding:7px 8px 7px 12px;margin-bottom:7px;box-shadow:var(--ombra);}",
    ".as-kv-t{flex:1;min-width:0;cursor:pointer;}",
    ".as-kv-n{font-weight:900;font-size:.95rem;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".as-kv-k{font-size:.72rem;line-height:1.3;color:var(--testo-tenue);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
    ".as-kv.aperta .as-kv-k{display:block;}",
    ".as-kv-k .em{font-size:.95rem;display:inline-flex;vertical-align:-2px;margin-right:2px;}.as-kv-k .em svg{width:1em;height:1em;}",
    ".as-kv .as-vbtn{width:38px;height:38px;font-size:1.3rem;flex:0 0 auto;}",
    ".as-kv .as-vval{min-width:50px;font-size:1.02rem;}",
    // tanti kit da votare (6 o più): righe più basse, le carte su una riga sola (toccando si leggono tutte)
    ".as-kv.fitta{padding:3px 6px 3px 10px;margin-bottom:4px;gap:6px;}.as-kv.fitta .as-kv-n{font-size:.88rem;}",
    ".as-kv.fitta .as-kv-k{-webkit-line-clamp:1;}.as-kv.fitta.aperta .as-kv-k{display:block;}",
    ".as-kv.fitta .as-vbtn{width:34px;height:34px;font-size:1.15rem;}.as-kv.fitta .as-vval{min-width:44px;font-size:.95rem;}",
    ".as-budget.fitto{padding:6px 10px;margin-bottom:6px;font-size:.86rem;}",
    // il foglio che sale dal basso (carte prese, formazioni)
    ".sa-foglio-velo{position:absolute;inset:0;z-index:9;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;}",
    ".sa-foglio{width:100%;max-height:84%;overflow-y:auto;overscroll-behavior:contain;background:#fff8e6;color:#2b2b2b;border-radius:20px 20px 0 0;padding:12px 12px calc(16px + env(safe-area-inset-bottom));animation:saFoglio .22s ease-out;}",
    "@keyframes saFoglio{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}",
    ".sa-foglio-testa{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:1.15rem;}",
    ".sa-formazioni{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}",
    ".sa-squadra{background:#fff;border-radius:12px;padding:6px;box-shadow:0 2px 8px rgba(0,0,0,.12);}",
    ".sa-sq-nome{font-weight:900;font-size:.8rem;text-align:center;margin-bottom:4px;}",
    ".sa-campo{position:relative;height:150px;border-radius:8px;background:repeating-linear-gradient(180deg,#3fa34d 0 15px,#37944a 15px 30px);box-shadow:inset 0 0 0 2px rgba(255,255,255,.6);}",
    ".sa-gioc{position:absolute;display:flex;flex-direction:column;align-items:center;width:30%;transform:translate(-50%,-50%);}",
    ".sa-maglia{width:30px;height:30px;font-style:normal;font-size:8px;font-weight:900;color:#fff;display:flex;align-items:center;justify-content:center;}",
    ".sa-gioc.vuoto .sa-maglia{border:2px dashed rgba(255,255,255,.75);border-radius:50%;width:24px;height:24px;}",
    ".sa-gioc span{font-size:9px;font-weight:800;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    // ---- lo stadio: maxischermo, tribuna, campetto ----
    ".schermata.st-stadio{background:linear-gradient(180deg,#06112b 0%,#0c2150 30%,#1a2f3e 52%,#1d5a2b 60%,#226b31 100%);}",
    ".st-board{flex:none;margin:4px 12px 0;padding:5px;border-radius:12px;background:linear-gradient(180deg,#444a54,#1d2026);box-shadow:0 0 0 2px #0b0c0f,0 14px 30px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.2);}",
    ".st-schermo{position:relative;overflow:hidden;border-radius:7px;height:clamp(104px,calc(var(--alt,100dvh)*.19),176px);background:#0c1424;}",
    ".st-colori{position:absolute;inset:0;}",
    ".st-led{position:absolute;inset:0;pointer-events:none;z-index:3;background-image:radial-gradient(circle,rgba(0,0,0,0) 52%,rgba(0,0,0,.26) 56%);background-size:4px 4px;}",
    ".st-dentro{position:absolute;z-index:2;left:0;right:0;top:0;bottom:24px;display:flex;align-items:center;gap:8px;padding:6px 10px;transition:opacity .2s;}",
    ".st-schermo.vuoto .st-dentro{opacity:0;}",
    ".st-schermo.entra .st-dentro{animation:stEntra .5s cubic-bezier(.2,1.3,.4,1);}",
    "@keyframes stEntra{from{transform:translateX(26%);opacity:0}to{transform:none;opacity:1}}",
    ".st-magliabox{flex:0 0 27%;height:100%;display:flex;align-items:center;justify-content:center;}",
    ".st-maglia{max-height:100%;max-width:100%;}",
    ".st-dati{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;padding:4px 8px;border-radius:8px;background:rgba(0,0,0,.34);text-shadow:0 2px 4px rgba(0,0,0,.7);}",
    ".st-riga{display:flex;align-items:center;gap:6px;min-width:0;}",
    ".st-ruolo{flex:none;font-size:.62rem;font-weight:900;letter-spacing:.04em;padding:3px 7px;border-radius:6px;color:#0d1230;text-shadow:none;}",
    ".st-ruolo-classifica{background:#ffd43b;color:#3a2200;}",
    ".st-squadra{font-size:.76rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-nome{font-size:clamp(1.2rem,6vw,1.75rem);font-weight:900;line-height:1.05;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-prezzo{display:flex;align-items:baseline;gap:8px;min-width:0;}",
    ".st-prezzo b{font-size:clamp(1.45rem,7vw,2rem);color:#ffe066;line-height:1;white-space:nowrap;}",
    ".st-prezzo span{font-size:.72rem;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-contatore b{font-size:clamp(2rem,10vw,2.9rem);font-variant-numeric:tabular-nums;}",
    ".st-ticker{position:absolute;z-index:2;left:0;right:0;bottom:0;height:24px;line-height:24px;padding:0 10px;background:rgba(0,0,0,.6);color:#ffd43b;font-weight:900;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.02em;}",
    ".st-ticker.via{animation:stTicker .35s ease-out;}",
    "@keyframes stTicker{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}",
    ".st-ticker.conta{color:#fff;background:#c92a2a;font-size:.95rem;text-align:center;}",
    ".st-stadio.ultimi .st-board{animation:stBordo .5s ease-in-out infinite alternate;}",
    "@keyframes stBordo{from{box-shadow:0 0 0 2px #0b0c0f,0 14px 30px rgba(0,0,0,.6)}to{box-shadow:0 0 0 3px #ff6b6b,0 14px 30px rgba(0,0,0,.6)}}",
    ".st-tribuna{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:2px;padding:4px 4px 0;}",
    ".st-tribuna .sa-fila0 .sa-pers{width:18%;max-width:84px;}.st-tribuna .sa-fila0.n1 .sa-pers,.st-tribuna .sa-fila0.n2 .sa-pers{width:22%;max-width:100px;}",
    // due file in tribuna (6-10 giocatori): più piccoli sugli schermi bassi, così non toccano il maxischermo né il campetto
    ".st-tribuna .sa-fila1 ~ .sa-fila0 .sa-pers{max-width:min(84px,calc(var(--alt,100dvh)*.09));}",
    ".st-tribuna .sa-fila1 .sa-pers{width:14.5%;max-width:min(66px,calc(var(--alt,100dvh)*.075));}",
    ".st-tribuna .sa-fila1 .sa-pers b,.st-tribuna .sa-fila1 ~ .sa-fila0 .sa-pers b{font-size:.64rem;}.st-tribuna .sa-fila1 .sa-pers small,.st-tribuna .sa-fila1 ~ .sa-fila0 .sa-pers small{font-size:.56rem;}",
    ".st-campo-box{flex:none;margin:2px 10px 0;padding:5px;border-radius:12px;background:rgba(0,0,0,.28);}",
    ".st-campo-testa{display:flex;align-items:center;gap:6px;margin-bottom:4px;}",
    ".st-freccia{flex:none;border:0;width:36px;height:28px;border-radius:14px;background:rgba(255,255,255,.92);color:#16351f;font-weight:900;font-size:18px;line-height:1;font-family:inherit;}",
    ".st-campo-nome{flex:1;min-width:0;text-align:center;font-weight:900;font-size:.8rem;text-shadow:0 1px 3px rgba(0,0,0,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-campo{position:relative;height:min(clamp(118px,calc(var(--alt,100dvh)*.23),230px),calc((100vw - 44px) / 1.44));aspect-ratio:36/25;margin:0 auto;border-radius:8px;background:repeating-linear-gradient(180deg,#3d9b49 0 18px,#358a41 18px 36px);box-shadow:inset 0 0 0 2px rgba(255,255,255,.7);overflow:hidden;}",
    ".st-campo.dipinto{background-size:100% 100%;box-shadow:none;}",
    ".st-slot{position:absolute;width:21%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;}",
    ".st-slot-maglia{display:block;width:clamp(30px,58%,52px);aspect-ratio:1;transition:opacity .2s;}",
    ".st-slot.vuoto .st-slot-maglia{opacity:0;}",
    ".st-slot-vuoto{position:absolute;top:0;left:50%;width:clamp(30px,58%,52px);aspect-ratio:1;transform:translateX(-50%);box-sizing:border-box;border:2px dashed rgba(255,255,255,.75);border-radius:50%;font-style:normal;font-size:.6rem;font-weight:900;color:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;}",
    ".st-slot:not(.vuoto) .st-slot-vuoto{display:none;}",
    ".st-slot.cerca .st-slot-vuoto{border-color:#ffe066;color:#ffe066;background:rgba(255,224,102,.16);animation:stCerca .8s ease-in-out infinite alternate;}",
    "@keyframes stCerca{from{transform:translateX(-50%) scale(.9)}to{transform:translateX(-50%) scale(1.08)}}",
    ".st-slot span{font-size:.62rem;font-weight:900;line-height:1.1;text-shadow:0 1px 2px rgba(0,0,0,.9);white-space:nowrap;max-width:150%;overflow:hidden;text-overflow:ellipsis;}",
    ".st-slot.arriva .st-slot-maglia{animation:stArriva .45s cubic-bezier(.2,1.6,.4,1);}",
    "@keyframes stArriva{from{transform:scale(1.5)}to{transform:none}}",
    ".st-val{position:absolute;top:-10%;right:2%;min-width:24px;padding:1px 5px;border-radius:9px;background:#ffd43b;color:#3a2200;font-style:normal;font-weight:900;font-size:.74rem;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,.4);opacity:0;transform:scale(.4);transition:transform .25s cubic-bezier(.2,1.6,.4,1),opacity .15s;}",
    ".st-val.su{opacity:1;transform:none;}",
    ".st-mister{position:absolute;z-index:3;left:4px;bottom:6px;width:14%;max-width:66px;pointer-events:none;}",   // l'allenatore a bordo campo, fuori dalle linee
    ".st-volo{position:absolute;z-index:7;pointer-events:none;}",
    ".st-piede{flex:none;flex-direction:row;flex-wrap:wrap;justify-content:center;padding:6px 12px calc(8px + env(safe-area-inset-bottom));}",
    ".st-piede .sa-nota{width:100%;}.st-piede .btn{flex:1;width:auto;}",
    ".st-stadio .sa-aggiudicato{top:14%;font-size:1.6rem;}",
    // la classifica finale del fantacalcio: il contatore che sale, poi il podio
    ".st-rivela .st-campo-box.st-grande{flex:1;min-height:0;display:flex;flex-direction:column;margin-top:10px;}",
    ".st-rivela .st-grande{justify-content:center;}.st-rivela .st-grande .st-campo{flex:none;height:min(calc(var(--alt,100dvh) * .36),calc((100vw - 44px) / 1.44));}",
    ".st-rivela .st-mister{width:16%;}",
    ".st-podio{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:8px 12px 0;}",
    ".st-gradini{display:flex;align-items:flex-end;justify-content:center;gap:6px;}",
    ".st-gradino{display:flex;flex-direction:column;align-items:center;width:31%;max-width:130px;animation:stSale .6s cubic-bezier(.2,1.3,.4,1) both;}",
    "@keyframes stSale{from{transform:translateY(60%);opacity:0}to{transform:none;opacity:1}}",
    ".st-gradino img{width:82%;margin-bottom:-6%;}",
    ".st-gradino b{font-size:.8rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.8);}",
    ".st-gradino small{font-size:.72rem;font-weight:900;color:#ffe066;text-shadow:0 1px 3px rgba(0,0,0,.8);}",
    ".st-gradino .blocco{width:100%;margin-top:3px;border-radius:8px 8px 0 0;display:flex;justify-content:center;padding-top:6px;font-weight:900;font-size:1.6rem;color:#3a2200;box-shadow:inset 0 2px 0 rgba(255,255,255,.5);}",
    ".st-gradino.p1 .blocco{height:96px;background:linear-gradient(180deg,#ffe066,#e0a90a);}",
    ".st-gradino.p2 .blocco{height:70px;background:linear-gradient(180deg,#f1f3f5,#adb5bd);}",
    ".st-gradino.p3 .blocco{height:52px;background:linear-gradient(180deg,#f3b886,#b5651d);}",
    ".st-altri{margin-top:6px;padding:6px 10px;border-radius:10px;background:rgba(0,0,0,.35);font-size:.76rem;font-weight:800;line-height:1.5;text-align:center;}"
  ].join("");
  document.head.appendChild(stile);

  // --- suoni ---
  var AC = null;
  function ctx() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; }
  function beep(fr, dur, tipo) {
    var c = ctx(); if (!c) return;
    try {   // (un suono che non parte non deve mai fermare il gioco)
      var t0 = c.currentTime;
      fr.forEach(function (f, i) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = tipo || "sine"; o.frequency.value = f;
        var s = t0 + i * (dur * 0.6);
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(0.22, s + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
        o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + dur);
      });
    } catch (e) {}
  }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  var FX = {
    rilancio: function (vibrare) { beep([740], 0.09, "square"); if (vibrare !== false) vibra(25); },   // vibra solo chi ha toccato
    aggiudicato: function () { beep([660, 880, 1180], 0.16, "triangle"); },   // (solo suono: questi arrivano anche senza tocco)
    round: function () { beep([520, 780], 0.14, "sine"); },
    fine: function () { beep([660, 880, 1046, 1318], 0.2, "triangle"); },
    conta: function (i) { beep([i === 2 ? 1175 : 880], 0.08, "square"); },          // "5 e uno… 5 e due… 5 e tre…"
    tic: function (p) { beep([520 + Math.round(p * 700)], 0.035, "square"); },      // il contatore del valore delle rose (sale di tono)
    pop: function () { beep([880, 1320], 0.08, "triangle"); },                       // la maglia arriva nel campetto (solo suono: niente vibrazione senza tocco)
    posto: function () { beep([660, 990], 0.14, "triangle"); },
    festa: function () { beep([660, 880, 1046, 1318], 0.2, "triangle"); }
  };

  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  // --- memoria delle carte già uscite ---
  // Ricorda le ultime carte apparse (su questo telefono) e preferisce
  // quelle mai viste: così due o tre partite di fila non si somigliano.
  var CHIAVE_VISTI = "sg_asta_visti_";
  var MEMORIA = 90;
  function elencoVisti(id) {
    try { var v = JSON.parse(localStorage.getItem(CHIAVE_VISTI + id) || "[]"); return (v instanceof Array) ? v : []; }
    catch (e) { return []; }
  }
  function segnaVisti(id, nomi) {
    try {
      var v = elencoVisti(id).concat(nomi);
      if (v.length > MEMORIA) v = v.slice(v.length - MEMORIA);
      localStorage.setItem(CHIAVE_VISTI + id, JSON.stringify(v));
    } catch (e) {}
  }

  // Attributi per l'icona di una carta: se l'emoji è un segnaposto "svg:..."
  // per cui abbiamo un'icona disegnata (es. armi da fuoco, che come emoji
  // diventano una pistola giocattolo), usiamo l'SVG; altrimenti l'emoji.
  function icoAttr(cls, emoji) {
    var svg = window.SG_ICONE && window.SG_ICONE[emoji];
    return svg ? { class: cls, html: svg } : { class: cls, text: emoji };
  }

  // Badge della fascia: durante l'asta resta nascosto ("?"), viene svelato
  // solo alla fine (nella schermata "Fasce svelate", dopo le votazioni).
  function cellaTier(el, tier, rivela) {
    // Durante l'asta la fascia resta nascosta: niente badge (più spazio al nome).
    // Si mostra il badge colorato solo alla fine, quando rivela === true.
    return rivela ? el("span", { class: "tier tier-" + tier, text: tier }) : null;
  }

  // Prende N carte dal round tenendo RARI i pezzi migliori:
  // circa un terzo di fascia A, un terzo di C e il resto B.
  // Con 4 giocatori esce 1 carta A, 2 B e 1 C: mai quattro pezzi top.
  function carteDelRound(r, n, temaId) {
    var visti = elencoVisti(temaId);
    // prima le carte mai viste, poi le altre
    function perFreschezza(lista) {
      var nuove = [], viste = [];
      (lista || []).forEach(function (c) { (visti.indexOf(c.nome) < 0 ? nuove : viste).push(c); });
      return mischia(nuove).concat(mischia(viste));
    }
    var pool = { A: perFreschezza(r.A), B: perFreschezza(r.B), C: perFreschezza(r.C) };
    var quota = { A: Math.max(1, Math.floor(n / 3)), C: Math.max(1, Math.floor(n / 3)) };
    quota.B = n - quota.A - quota.C;
    if (quota.B < 0) { quota.B = 0; quota.A = Math.min(quota.A, n); quota.C = n - quota.A; }

    var scelte = [];
    ["A", "B", "C"].forEach(function (t) {
      for (var i = 0; i < quota[t] && pool[t].length; i++) {
        var c = pool[t].shift();
        scelte.push({ nome: c.nome, emoji: c.emoji, tier: t });
      }
    });
    // se una fascia è finita, si completa con le altre (prima B, poi C, poi A)
    var giro = 0;
    while (scelte.length < n && giro < 60) {
      var t2 = ["B", "C", "A"][giro % 3];
      if (pool[t2].length) { var c2 = pool[t2].shift(); scelte.push({ nome: c2.nome, emoji: c2.emoji, tier: t2 }); }
      giro++;
    }
    segnaVisti(temaId, scelte.map(function (c) { return c.nome; }));
    return mischia(scelte);
  }

  // Quanto può puntare al massimo: deve tenere 1 credito per ogni round futuro
  function maxPuntata(st, i) {
    var futuri = (TOT_ROUND - 1) - st.roundIdx;
    return st.giocatori[i].crediti - futuri;
  }

  function strisciaCrediti(el, st, attivoIdx) {
    var top = el("div", { class: "as-top" });
    st.giocatori.forEach(function (g, i) {
      var haCarta = st.senzaCarta.indexOf(i) < 0;
      top.appendChild(el("div", { class: "as-pt" + (i === attivoIdx ? " attivo" : "") + (haCarta ? " fatto" : "") }, [
        el("div", { class: "n", text: g.nome }),
        el("div", { class: "c", text: g.crediti + "💰" })
      ]));
    });
    return top;
  }

  // la striscia con TUTTI e 4 i round (le cose che si metteranno all'asta): quello in corso
  // ha il contorno giallo, quelli già fatti hanno la spunta, i prossimi si vedono comunque.
  function strisciaRound(el, rounds, idx) {
    var box = el("div", { class: "as-steps" });
    (rounds || []).forEach(function (r, i) {
      box.appendChild(el("div", { class: "as-step" + (i === idx ? " ora" : (i < idx ? " fatto" : "")) }, [
        (i < idx ? el("span", { class: "sk", text: "✓" }) : null),
        el("span", { class: "si", text: r.icona || "" }),
        el("span", { class: "sn", text: r.nome || "" })
      ]));
    });
    return box;
  }

  // elenco SEMPRE VISIBILE delle carte ancora in palio nel round (quella in corso è evidenziata)
  function dettaglioPalio(el, cards, nomeCorrente) {
    if (!cards || !cards.length) return null;
    var box = el("div", { class: "as-palio" });
    box.appendChild(el("div", { class: "ph" }, [
      el("span", { text: "🎁" }),
      el("span", { style: "flex:1", text: "Ancora in palio in questo round (" + cards.length + ")" })
    ]));
    cards.forEach(function (c) {
      var ora = (c.nome === nomeCorrente);
      box.appendChild(el("div", { class: "pr" + (ora ? " ora-c" : "") }, [
        el("span", icoAttr("em", c.emoji)),
        el("span", { class: "nm", text: c.nome + (ora ? " · all'asta ora" : "") }),
        cellaTier(el, c.tier, false)
      ]));
    });
    return box;
  }

  function intestazioneRound(el, st) {
    var wrap = el("div", {});
    wrap.appendChild(el("div", { class: "as-round", style: "margin:6px 0 4px" }, [
      el("div", { class: "n", text: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND })
    ]));
    wrap.appendChild(strisciaRound(el, st.tema.round, st.roundIdx));
    return wrap;
  }

  var gioco = {
    id: "asta",
    nome: "L'Asta",
    icona: "🔨",
    descrizione: "Compra all'asta le carte migliori e costruisci il kit che gli altri voteranno.",
    giocatoriMin: 2,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono per rilanciare", amici: true }],
    giocatoriMax: MAX_GIOCATORI,
    postiOnline: MAX_GIOCATORI,   // posti online (10)
    riprende: true,   // se l'host ricarica a metà partita, la partita riprende (il lotto all'asta riparte da capo, nessuno paga niente)
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    // le regole in una riga, per la saletta: "🎁 Temi classici · Vacanze · 15 crediti" o "⚽ Mini asta Fantacalcio · 20 crediti"
    riassunto: function (imp) {
      imp = imp || {};
      if (imp.formato === "fanta") return "⚽ Mini asta Fantacalcio · " + FANTA_BUDGET + " crediti · rosa da 5";
      var temi = window.SG_ASTA_TEMI || [], tm = temi.filter(function (x) { return x.id === imp.tema; })[0] || temi[0];
      return "🎁 Temi classici" + (tm ? " · " + tm.icona + " " + tm.nome : "") + " · " + (imp.crediti || 15) + " crediti";
    },
    difficolta: 3,   // Difficile — vale di più nel torneo (1 facile, 2 media, 3 difficile)

    regole: [
      "Un solo telefono <b>appoggiato al tavolo</b>: tutti vedono le carte e ognuno tocca il proprio tasto.",
      "Si giocano <b>4 round</b> a tema. In ogni round sul tavolo ci sono tante carte quanti sono i giocatori e <b>ognuno se ne aggiudica una</b>.",
      "A turno uno sceglie quale carta mettere all'asta: parte da <b>1 credito</b>. Gli altri possono <b>rilanciare</b> (+1) o <b>passare</b>.",
      "Dopo ogni rilancio partono <b>10 secondi</b>: allo scadere la carta va a chi ha l'offerta più alta. <b>Paga solo il vincitore.</b> Chi ha già l'offerta più alta non può rilanciare contro sé stesso.",
      "Attenzione: devi tenere <b>almeno 1 credito per ogni round che resta</b>, altrimenti rimani a piedi.",
      "Alla fine ognuno vota i kit degli altri con le <b>stelle</b> (non il proprio): vince chi ne raccoglie di più.",
      "<b>Mini asta Fantacalcio</b>: 20 crediti a testa per una rosa da 5 (1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante). I calciatori escono a caso uno alla volta e partono da <b>1 credito</b>: ci sono <b>6 secondi</b> per la prima offerta e <b>8</b> dopo ogni rilancio, poi chi offre di più se lo prende. Se nessuno lo vuole <b>torna in fondo al mazzo</b> e si va avanti; solo quando tutti quelli rimasti di un ruolo sono stati rifiutati <b>2 volte</b>, vanno a caso a chi ne ha ancora bisogno.",
      "Nel fantacalcio alla fine si scoprono le <b>quotazioni vere</b> dei calciatori: vince la rosa che <b>vale di più</b>. A pari valore vince chi ha <b>più crediti avanzati</b>."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "telefono";
      dove.formato = "temi";
      dove.crediti = 15;
      dove._creditiTemi = 15;

      // contenitori che compaiono/spariscono in base alla modalità scelta
      var wrapCrediti = el("div", {}), wrapTema = el("div", {}), wrapFanta = el("div", { hidden: "hidden" });

      // --- Modalità: Temi classici oppure Mini asta Fantacalcio ---
      box.appendChild(el("div", { class: "etichetta", text: "Modalità" }));
      var bTemi, bFanta;
      function scegliFormato(f) {
        dove.formato = f;
        try { localStorage.setItem("sg_asta_formato", f); } catch (e) {}   // la prossima volta riparte dalla stessa modalità
        bTemi.className = "modo-chip" + (f === "temi" ? " attiva" : "");
        bFanta.className = "modo-chip" + (f === "fanta" ? " attiva" : "");
        wrapCrediti.hidden = (f !== "temi");
        wrapTema.hidden = (f !== "temi");
        wrapFanta.hidden = (f !== "fanta");
        dove.crediti = (f === "fanta") ? 20 : dove._creditiTemi;
      }
      bTemi = el("button", { class: "modo-chip attiva", onclick: function () { scegliFormato("temi"); } }, [
        el("span", { class: "mi", text: "🎁" }), el("div", {}, [
          el("div", { class: "mt", text: "Temi classici" }), el("div", { class: "ms", text: "Kit a tema · 4 round" })])]);
      bFanta = el("button", { class: "modo-chip", onclick: function () { scegliFormato("fanta"); } }, [
        el("span", { class: "mi", text: "⚽" }), el("div", {}, [
          el("div", { class: "mt", text: "Mini asta Fantacalcio" }), el("div", { class: "ms", text: "Rosa da 5 calciatori" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bTemi, bFanta]));

      // --- Come si gioca: un telefono solo oppure ognuno dal suo (vale per tutte e due) ---
      if (aiuti.modo) dove.modo = aiuti.modo;   // l'avete già scelto prima
      else if (!aiuti.torneo) {
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var notaOn = el("div", { class: "link-avviso", hidden: "hidden" });
      var bTel, bOnl;
      function scegliModo(m) {
        dove.modo = m;
        bTel.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        notaOn.hidden = (m !== "online");
        notaOn.textContent = (window.SGNet && SGNet.disponibile())
          ? "Gli altri entrano dai loro telefoni con un codice: nella sala basta il TUO nome."
          : "Attenzione: qui il collegamento non è disponibile. Funziona quando il gioco è aperto dal sito pubblicato.";
      }
      bTel = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [
          el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "Appoggiato al tavolo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [
          el("div", { class: "mt", text: "Ognuno dal suo telefono" }), el("div", { class: "ms", text: "Ognuno rilancia dal proprio" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bTel, bOnl]));
      box.appendChild(notaOn);
      }

      // --- Crediti a testa (solo Temi classici) ---
      wrapCrediti.appendChild(el("div", { class: "etichetta", text: "Crediti a testa" }));
      var b15, b20;
      function scegli(v) {
        dove._creditiTemi = v;
        if (dove.formato === "temi") dove.crediti = v;
        b15.className = "modo-chip" + (v === 15 ? " attiva" : "");
        b20.className = "modo-chip" + (v === 20 ? " attiva" : "");
      }
      b15 = el("button", { class: "modo-chip attiva", onclick: function () { scegli(15); } }, [
        el("span", { class: "mi", text: "💰" }), el("div", {}, [
          el("div", { class: "mt", text: "15 crediti" }), el("div", { class: "ms", text: "Partita tirata" })])]);
      b20 = el("button", { class: "modo-chip", onclick: function () { scegli(20); } }, [
        el("span", { class: "mi", text: "💰" }), el("div", {}, [
          el("div", { class: "mt", text: "20 crediti" }), el("div", { class: "ms", text: "Più margine per i rilanci" })])]);
      wrapCrediti.appendChild(el("div", { class: "modo-griglia" }, [b15, b20]));
      box.appendChild(wrapCrediti);

      // --- Tema (solo Temi classici) ---
      var temi = window.SG_ASTA_TEMI || [];
      dove.tema = temi.length ? temi[0].id : null;
      if (temi.length > 1) {
        wrapTema.appendChild(el("div", { class: "etichetta", text: "Tema" }));
        var g = el("div", { class: "cat-griglia" });
        temi.forEach(function (tm) {
          var chip = el("button", { class: "cat-chip" + (tm.id === dove.tema ? " attiva" : ""), onclick: function () {
            dove.tema = tm.id;
            [].forEach.call(g.children, function (c) { c.className = "cat-chip"; });
            chip.className = "cat-chip attiva";
          } }, [ el("span", { class: "ci", text: tm.icona }), el("span", { text: tm.nome }), el("span", { class: "spunta", text: "✓" }) ]);
          g.appendChild(chip);
        });
        wrapTema.appendChild(g);
      } else if (temi.length === 1) {
        wrapTema.appendChild(el("div", { class: "link-avviso", text: "Tema: " + temi[0].icona + " " + temi[0].nome + " — " + temi[0].sottotitolo }));
      }
      box.appendChild(wrapTema);

      // --- Nota Fantacalcio (solo modalità Fantacalcio) ---
      wrapFanta.appendChild(el("div", { class: "link-avviso",
        text: "⚽ 20 crediti a testa · rosa da 5 (1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante). I calciatori escono dal mazzo uno alla volta, in ordine tutto a caso. Alla fine vince la rosa che vale di più." }));
      box.appendChild(wrapFanta);
      var ultimo = null; try { ultimo = localStorage.getItem("sg_asta_formato"); } catch (e) {}
      if (ultimo === "fanta") scegliFormato("fanta");
    },

    avvia: function (t) {
      // Chi entra da un link è sempre un ospite: la modalità (temi o
      // fantacalcio) la decide l'host e arriva dentro la "foto" (vm).
      if (t.linkParams && t.linkParams.stanza) return ospiteAsta(t, t.linkParams.stanza);
      PONTE = null;   // stanza nuova
      avviaAsta(t);
    }
  };

  // ---- la stanza dell'host resta la stessa anche se in saletta cambi modalità (temi <-> fantacalcio):
  //      il nuovo "motore" riceve la stessa stanza e chi era già entrato, senza che gli amici escano ----
  var PONTE = null;   // { vera, cb, codice, pronta, entrati: [{ id, m }], maniglia }
  // (opz: { ripresa } la prima volta, quando la partita riprende dopo una ricarica dell'host)
  function ospitaAsta(cb, opz) {
    var P = PONTE;
    if (P) {
      P.cb = cb;
      setTimeout(function () {
        if (PONTE !== P) return;
        if (P.codice) cb.onCodice(P.codice);
        if (P.pronta) cb.onConnesso();
        P.entrati.forEach(function (e) { cb.onMsg(e.id, e.m); });   // rientrano da soli nel nuovo motore
      }, 0);
      return P.maniglia;
    }
    P = PONTE = { cb: cb, codice: null, pronta: false, entrati: [] };
    P.vera = SGNet.ospita("asta", {
      onCodice: function (c) { P.codice = c; if (P.cb.onCodice) P.cb.onCodice(c); },
      onConnesso: function () { P.pronta = true; if (P.cb.onConnesso) P.cb.onConnesso(); },
      onAddio: function (id) { P.entrati = P.entrati.filter(function (e) { return e.id !== id; }); if (P.cb.onAddio) P.cb.onAddio(id); },
      onMsg: function (id, m) {
        if (m && m.t === "join" && !P.entrati.some(function (e) { return e.id === id; })) P.entrati.push({ id: id, m: m });
        if (P.cb.onMsg) P.cb.onMsg(id, m);
      },
      onErrore: function (e) { if (P.cb.onErrore) P.cb.onErrore(e); }
    }, opz || {});
    if (!P.vera) { PONTE = null; return null; }
    P.maniglia = {
      invia: function (x) { P.vera.invia(x); },
      inviaVeloce: function (x) { P.vera.inviaVeloce(x); },
      inviaA: function (id, x) { P.vera.inviaA(id, x); },
      chiudi: function () { if (PONTE === P) PONTE = null; P.vera.chiudi(); }
    };
    return P.maniglia;
  }

  // la partita di prima da riprendere (l'host ha ricaricato la pagina: t.ripresa), una volta sola per partita
  // (se poi in saletta si cambia modalità, il motore nuovo parte da zero)
  var RIP_USATA = null;
  function prendiRipresa(t, formato) {
    var s = t.ripresa && t.ripresa.stato;
    if (RIP_USATA === t || !s || s.formato !== formato || !s.fase || s.fase === "lobby" || !s.giocatori) return null;
    RIP_USATA = t; return s;
  }
  function avviaAsta(t) {
      pulisciCache();
      var formato = (t.impostazioni && t.impostazioni.formato) || "temi";
      var rs = RIP_USATA !== t && t.ripresa && t.ripresa.stato;
      if (rs && rs.formato && t.impostazioni && t.impostazioni.modo === "online") formato = rs.formato;   // (la partita ripresa decide la modalità)
      if (formato === "fanta") {
        if (t.impostazioni && t.impostazioni.modo === "online") return hostFanta(t);
        return avviaFanta(t);
      }
      var temi = window.SG_ASTA_TEMI || [];
      if (!temi.length) return niente(t, "Mancano le carte del gioco.");
      var idT = (t.impostazioni && t.impostazioni.tema) || temi[0].id;
      var tema = temi.filter(function (x) { return x.id === idT; })[0] || temi[0];
      var crediti = (t.impostazioni && t.impostazioni.crediti) || 15;
      if (t.impostazioni && t.impostazioni.modo === "online") return hostAsta(t, tema, crediti);

      var st = {
        tema: tema, crediti: crediti, sessione: nuovaSessione(), roundIdx: 0, chooserPtr: 0, tavolo: [], senzaCarta: [], asta: null,
        giocatori: t.giocatori.map(function (n) { return { nome: n, crediti: crediti, kit: [], stelle: 0, asteVinte: 0 }; })
      };
      iniziaRound(t, st);
  }

  function niente(t, msg) {
    var s = t.schermata({ icona: "🔨", titolo: "L'Asta", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: msg, style: "font-size:1.05rem" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---- inizio round ----
  function iniziaRound(t, st) {
    var el = t.el;
    var r = st.tema.round[st.roundIdx];
    st.tavolo = carteDelRound(r, st.giocatori.length, st.tema.id);
    st.senzaCarta = st.giocatori.map(function (_, i) { return i; });
    st.chooserPtr = st.roundIdx; // ruota chi sceglie per primo a ogni round
    FX.round();

    var s = t.schermata({});
    var box = el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:10px" }, [
      el("div", { style: "font-size:4rem;line-height:1", text: r.icona }),
      el("div", { class: "as-round" }, [
        el("div", { class: "n", text: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND }),
        el("div", { class: "t", text: r.nome })
      ]),
      el("p", { class: "as-msg", text: "Sul tavolo " + st.giocatori.length + (st.giocatori.length === 1 ? " carta" : " carte") + ": ognuno se ne aggiudica una." })
    ]);
    s._contenuto.appendChild(box);
    s._contenuto.appendChild(strisciaRound(el, st.tema.round, st.roundIdx));
    var vai = autoAvanti(st, s, function () { prossimaAsta(t, st); }, AUTO_ROUND_MS);
    s._piede.appendChild(tastoAuto(el, "Vedi le carte ▶", AUTO_ROUND_MS, vai));
    t.mostra(s);
  }

  // (stesso telefono) la schermata va avanti da sola dopo un po', se è ancora quella a schermo; il tasto lo fa subito
  function autoAvanti(st, s, fn, ms) {
    if (st.pausa) clearTimeout(st.pausa);
    var fatto = false, vai = function () { if (fatto || st.finita) return; fatto = true; clearTimeout(st.pausa); st.pausa = null; fn(); };
    st.pausa = setTimeout(function () { if (document.body.contains(s)) vai(); }, ms);
    return vai;
  }
  // il tasto con la barretta che si accorcia: quando finisce si va avanti da soli
  function tastoAuto(el, testo, ms, onclick) {
    var b = el("button", { class: "btn btn-primario as-auto", text: testo, onclick: onclick });
    b.style.setProperty("--ms", Math.max(0, ms) + "ms");
    return b;
  }

  // ---- decide cosa fare: assegnazione automatica, scelta carta, o fine round ----
  function prossimaAsta(t, st) {
    if (st.senzaCarta.length === 0) return fineRound(t, st);
    if (st.senzaCarta.length === 1 && st.tavolo.length === 1) {
      var i = st.senzaCarta[0], carta = st.tavolo[0];
      st.giocatori[i].crediti -= 1;
      st.giocatori[i].kit.push(carta);
      st.tavolo = []; st.senzaCarta = [];
      return esitoAsta(t, st, i, carta, 1, true);
    }
    schermataScelta(t, st);
  }

  function schermataScelta(t, st) {
    var el = t.el;
    var chi = st.senzaCarta[st.chooserPtr % st.senzaCarta.length];
    var s = t.schermata({ indietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", t.esci); } });
    s._contenuto.appendChild(intestazioneRound(el, st));
    s._contenuto.appendChild(strisciaCrediti(el, st, chi));
    s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-bottom:10px",
      text: "🔨 " + st.giocatori[chi].nome + ", scegli la carta da mettere all'asta" }));
    var g = el("div", { class: "as-griglia" + (st.tavolo.length > 6 ? " tante molte" : st.tavolo.length > 3 ? " tante" : "") });
    if (st.tavolo.length > 6) s.classList.add("as-stretto");
    st.tavolo.forEach(function (c, idx) {
      g.appendChild(el("button", { class: "as-carta", onclick: function () { apriAsta(t, st, chi, idx); } }, [
        el("span", icoAttr("em", c.emoji)),
        el("span", { class: "nm", text: c.nome }),
        cellaTier(el, c.tier, false)
      ]));
    });
    s._contenuto.appendChild(g);
    t.mostra(s);
  }

  // ---- asta su una carta ----
  function apriAsta(t, st, chooser, idxCarta) {
    st.asta = {
      carta: st.tavolo[idxCarta], idxCarta: idxCarta,
      offerta: 1, leader: chooser,
      passati: {}, bar: null
    };
    if (restaSoloLeader(st)) return chiudiAsta(t, st);   // nessun altro può permettersi di rilanciare: è subito sua
    tempoAsta(st.asta, function () { chiudiAsta(t, st); });
    disegnaAsta(t, st);
  }
  // (stesso telefono) resta in gara solo chi ha l'offerta? (chi ha passato o non ha i crediti per rilanciare è fuori)
  function restaSoloLeader(st) {
    var a = st.asta; if (!a) return false;
    return st.senzaCarta.filter(function (x) { return x === a.leader || (!a.passati[x] && maxPuntata(st, x) >= a.offerta + 1); }).length <= 1;
  }

  // =========================================================
  //  LA SALA D'ASTA (asta a temi, sullo stesso telefono e online) — vista dalle spalle del banditore.
  //  In alto sulla parete il pannello col lotto e il prezzo; in mezzo il pubblico seduto in file (quella dietro più
  //  piccola) che guarda verso di noi e alza la paletta numerata; in basso a sinistra il banditore di spalle dietro il
  //  leggio, che parla e negli ultimi 3 secondi conta "5 e uno… 5 e due… 5 e tre…".
  //  Si costruisce una volta per ogni carta e poi si aggiorna solo quello che cambia (niente lampeggio).
  //  Il fantacalcio ha il suo stadio (più sotto, STADIO).
  // =========================================================
  var SALA = null, BANDITORE = null, ANG_PALETTA = 145, CACHE_AV = {};
  var COLORI_SQUADRE = {   // i colori delle maglie: lo sfondo del maxischermo del fantacalcio
    Napoli: ["#12a0d7", "#075d8c"], Juventus: ["#202020", "#d9d9d9"], Inter: ["#0b4ea2", "#0d0d1a"], Atalanta: ["#1d6fc0", "#111111"],
    Roma: ["#8e1f2f", "#f0b323"], Milan: ["#d0161c", "#141414"], Como: ["#0b4ea2", "#7fb3ea"], Lazio: ["#7dc8ec", "#e8f6ff"],
    Torino: ["#7a1c13", "#b5651d"], Sassuolo: ["#0b8a47", "#111111"], Fiorentina: ["#5b2a86", "#a77fd6"], Bologna: ["#a2142a", "#1b2f5c"],
    Cagliari: ["#a6192e", "#0b2559"], Parma: ["#e9e6dc", "#1a1a1a"], Venezia: ["#f26522", "#0b6b3a"], Udinese: ["#202020", "#d9d9d9"],
    Monza: ["#d7141f", "#f4f4f4"], Genoa: ["#ae1e2e", "#0a2240"], Lecce: ["#f2d200", "#d9001a"], Frosinone: ["#ffd400", "#0b46a6"]
  };
  function coloriSquadra(sq) { return COLORI_SQUADRE[sq] || null; }
  function cfgDi(nome, omino) { return omino || (window.SGOmino ? SGOmino.casuale(nome || "Giocatore") : null); }
  function srcSvg(k, fn) {   // un disegno SVG come immagine (fatto una volta e tenuto da parte)
    if (CACHE_AV[k] !== undefined) return CACHE_AV[k];
    var s = ""; try { s = fn() || ""; } catch (e) {}
    return (CACHE_AV[k] = s ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s) : "");
  }
  function srcAv(cfg, o) {   // l'avatar in una posa: seduto, col braccio alzato (la paletta), di spalle…
    if (!cfg || !window.SGOmino) return "";
    return srcSvg(JSON.stringify(cfg) + "|" + JSON.stringify(o || {}), function () { return SGOmino.svg(cfg, o || {}); });
  }
  var GIU = { seduto: true }, SU = { seduto: true, braccia: "canna", angolo: ANG_PALETTA };
  function manoAlzata(cfg) { try { return SGOmino.mano(cfg, SU); } catch (e) { return { x: 155, y: 126 }; } }
  // i disegni fissi (js/asta-sala-arte.js, js/asta-stadio-arte.js, js/asta-maglie.js); finché mancano, uno semplice di riserva
  function arte(nome, riserva, arg) {
    var A = window.SGAstaArte, f = A && typeof A[nome] === "function" ? A[nome] : null;
    return srcSvg("arte|" + nome + "|" + (arg || "") + (f ? "" : "|riserva"), function () { return f ? f(arg) : riserva; });
  }
  var SVG0 = "<svg xmlns='http://www.w3.org/2000/svg' ";
  var SEDIA_RIS = SVG0 + "viewBox='0 0 200 264'><rect x='54' y='98' width='92' height='104' rx='22' fill='#9b2335' stroke='#c99a3b' stroke-width='6'/><rect x='44' y='190' width='112' height='16' rx='7' fill='#b02a3e' stroke='#c99a3b' stroke-width='4'/><path d='M56 206v44M144 206v44' stroke='#b8862f' stroke-width='7' stroke-linecap='round'/></svg>";
  var SEGG_RIS = SVG0 + "viewBox='0 0 200 264'><path d='M58 198V138q0-18 18-18h48q18 0 18 18v60z' fill='#1c6fd1' stroke='#0b3f80' stroke-width='5'/><rect x='50' y='192' width='100' height='14' rx='7' fill='#2a84ea' stroke='#0b3f80' stroke-width='4'/><path d='M100 206v44' stroke='#5c6670' stroke-width='9'/></svg>";
  var LEGGIO_RIS = SVG0 + "viewBox='0 0 200 150'><path d='M10 20h180l-8 130H18z' fill='#5a2e16' stroke='#2e160a' stroke-width='5'/><rect x='4' y='6' width='192' height='18' rx='5' fill='#7a4423' stroke='#2e160a' stroke-width='4'/><rect x='30' y='44' width='140' height='70' rx='6' fill='#3e1f0e'/></svg>";
  function magliaRis(sq) {   // la maglia di riserva: i due colori della squadra
    var c = coloriSquadra(sq) || ["#adb5bd", "#868e96"];
    return SVG0 + "viewBox='0 0 100 100'><defs><linearGradient id='mr' x1='0' x2='1'><stop offset='.5' stop-color='" + c[0] + "'/><stop offset='.5' stop-color='" + c[1] + "'/></linearGradient></defs>" +
      "<path d='M35 12L10 26l8 19 10-5v50h44V40l10 5 8-19-25-14q-6 8-15 8t-15-8z' fill='url(#mr)' stroke='#1b1b1b' stroke-width='3.5' stroke-linejoin='round'/></svg>";
  }
  function maglia(sq) { return arte("maglia", magliaRis(sq), sq || "?"); }
  function banditore() {
    if (BANDITORE || !window.SGOmino) return BANDITORE;
    var c = SGOmino.casuale("Banditore d'asta");
    c.forma = "uomo"; c.capelli = "corti"; c.colCap = 1; c.capo = "giacca"; c.maglia = 7; c.collo = "papillon"; c.colCollo = 0; c.cappello = "nessuno"; c.occhiali = "tondi"; c.barba = "baffi";
    c.mano = "nessuno"; c.schiena = "nessuna"; c.animale = "nessuno"; c.stampa = "nessuna";
    try { c = SGOmino.norm(c); } catch (e) {}
    return (BANDITORE = c);
  }
  function trova(lista, id) { if (id == null) return null; for (var i = 0; i < (lista || []).length; i++) if (lista[i].id === id) return lista[i]; return null; }
  function rianima(n, cls, testo) { if (testo != null) n.textContent = testo; n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); }
  function svuotaNodo(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  // ---- pezzi in comune tra la sala e lo stadio ----
  // quanti nella fila davanti e in quella dietro: nella sala dai 3 in su c'è chi sta più avanti e chi più indietro; nello stadio una fila sola fino a 5
  function fileSala(n, unaFila) { if (n <= (unaFila || 2)) return [n]; var d = Math.ceil(n / 2); return [d, n - d]; }
  // una persona del pubblico: la sedia (o il seggiolino) dietro, l'avatar seduto, la paletta col numero, la nuvoletta dell'offerta
  function personaAsta(el, S, p, sedia) {
    var cfg = cfgDi(p.nome, p.omino), m = manoAlzata(cfg);
    var paletta = el("div", { class: "sa-paletta", style: "left:" + (m.x / 2) + "%;top:" + (m.y / 2.64) + "%" }, [ el("span", { text: String(p.num) }) ]);
    var nuvola = el("div", { class: "sa-nuvola" }), nota = el("small");
    var passo = el("button", { class: "sa-passo", text: "passo", onclick: function (e) { e.stopPropagation(); S.ultimiDati.onPassa(p.id); } });
    var nodo = el("div", { class: "sa-pers", role: "button", onclick: function () {
      var dd = S.ultimiDati, q = S.pers[p.id]; if ((dd.io == null || dd.io === p.id) && q && q.puo) dd.onRilancia(p.id); } }, [
      el("div", { class: "sa-figura" }, [ el("img", { class: "sa-sedia", src: sedia, alt: "" }), el("img", { class: "sa-av", src: srcAv(cfg, GIU), alt: "" }),
        el("img", { class: "sa-av sa-su", src: srcAv(cfg, SU), alt: "" }), paletta, nuvola, el("i", { class: "sa-num", text: String(p.num) }) ]),
      el("b", { text: p.nome.length > 9 ? p.nome.slice(0, 9) + "…" : p.nome }), nota, passo
    ]);
    S.pers[p.id] = { nodo: nodo, nota: nota, passo: passo, nuvola: nuvola, puo: false };
    return nodo;
  }
  function pubblico(el, S, persone, sedia, cls, unaFila) {   // le file del pubblico: davanti i primi numeri, dietro (più piccoli) gli altri
    var file = el("div", { class: "sa-file" }), box = el("div", { class: cls }, [ file ]), k = 0;
    fileSala(persone.length, unaFila).map(function (quanti, r) {
      var fila = el("div", { class: "sa-fila sa-fila" + r + " n" + quanti });
      for (var i = 0; i < quanti; i++) fila.appendChild(personaAsta(el, S, persone[k++], sedia));
      return fila;
    }).reverse().forEach(function (f) { file.appendChild(f); });
    return (S.pubblico = box);
  }
  // se il pubblico non ci sta (schermo basso, tanti giocatori) lo rimpicciolisco tutto insieme: così niente finisce sotto altri pezzi
  function adattaPubblico(box) {
    var f = box && box.firstChild; if (!f || !document.body.contains(box)) return;
    f.style.transform = "";
    var h = box.clientHeight, c = f.offsetHeight;
    if (h > 0 && c > h) f.style.transform = "scale(" + Math.max(0.5, (h - 2) / c).toFixed(3) + ")";
  }
  window.addEventListener("resize", function () { if (SALA) adattaPubblico(SALA.pubblico); if (STADIO) adattaPubblico(STADIO.pubblico); });
  function pulisciCache() { Object.keys(CACHE_AV).forEach(function (k) { if (k.indexOf("arte|") !== 0) delete CACHE_AV[k]; }); }   // le pose degli avatar della partita prima (i disegni fissi restano)
  function fermaTutto() { fermaConta(SALA); fermaConta(STADIO); fermaRivela(RIVELA); SALA = null; STADIO = null; RIVELA = null; }   // si esce dalla partita: niente più timer che ridisegnano
  function testaAsta(el, S, d) {
    return el("div", { class: "sa-testa" }, [
      el("button", { class: "sa-tasto", text: "‹", "aria-label": "Esci", onclick: function () { S.ultimiDati.onIndietro(); } }),
      S.info = el("div", { class: "sa-info" }),
      d.extra ? el("button", { class: "sa-tasto sa-extra", text: d.extra.testo, onclick: function () { var e = S.ultimiDati.extra; if (e) e.apri(); } }) : el("span", { class: "sa-vuoto" })
    ]);
  }
  function aggiornaPubblico(S, d) {   // chi guida tiene su la paletta; chi può rilanciare ha la luce sotto; chi ha già il ruolo (o la carta) è in ombra
    d.persone.forEach(function (p) {
      var q = S.pers[p.id]; if (!q) return;
      var guida = p.id === d.leader, fuori = p.stato !== "gara", mio = d.io != null && p.id === d.io;
      q.puo = !fuori && !!p.puo;   // chi guida può rialzare toccandosi di nuovo
      q.nodo.className = "sa-pers" + (guida ? " guida" : "") + (fuori ? " fuori" : "") + (p.via ? " via" : "") + (mio ? " mio" : "") + (q.puo && (d.io == null || mio) ? " puo" : "");
      q.nota.textContent = p.via ? "non c'è" : (p.nota || "");
      var conPasso = !fuori && !guida && d.puoPassare !== false;   // (stesso telefono: il posto del tasto resta, così le file non ballano)
      if (d.io == null) { q.passo.style.display = ""; q.passo.style.visibility = conPasso ? "" : "hidden"; } else q.passo.style.display = "none";
    });
  }
  function nuovaOfferta(S, d, dice) {   // chi ha appena rilanciato salta con la nuvoletta, e il banditore (o lo speaker) lo dice
    var capo = trova(d.persone, d.leader), chi = capo ? capo.nome : "";
    if (S.prezzo === undefined) dice(capo ? chi + " parte da " + d.prezzo + "! Chi offre di più?" : "Si parte da " + d.prezzo + "! Chi offre?");
    else if (d.leader != null && (d.leader !== S.leader || d.prezzo !== S.prezzo)) {
      var q = S.pers[d.leader];
      if (q) { rianima(q.nuvola, "via", d.prezzo + "!"); rianima(q.nodo, "salta"); }
      dice(S.leader == null ? chi + " lo prende a " + d.prezzo + "! Chi offre di più?"
        : [d.prezzo + " a " + chi + "!", d.prezzo + " da " + chi + "! Chi offre di più?", "Ho " + d.prezzo + " da " + chi + "!", d.prezzo + " a " + chi + ", e chi rilancia?"][d.prezzo % 4]);
    }
    S.leader = d.leader; S.prezzo = d.prezzo;
  }
  // il tempo: la barra riparte a ogni rilancio; negli ultimi 3 secondi "5 e uno… 5 e due… 5 e tre…"
  function avviaConta(S, resta, tot, dice) {
    fermaConta(S);
    resta = Math.max(0, +resta || 0); tot = tot || SECONDI * 1000;
    S.tempo.style.transition = "none"; S.tempo.style.transform = "scaleX(" + Math.min(1, resta / tot) + ")"; void S.tempo.offsetWidth;
    S.tempo.style.transition = "transform " + resta + "ms linear"; S.tempo.style.transform = "scaleX(0)";
    S.radice.classList.remove("ultimi");
    ["uno", "due", "tre"].forEach(function (parola, i) {
      var quando = resta - (3 - i) * 1000; if (quando < 0) return;
      S.conta.push(setTimeout(function () {
        if (!document.body.contains(S.radice)) return;
        S.radice.classList.add("ultimi");
        dice(S.prezzo + " e " + parola + "…", true); FX.conta(i);
      }, quando));
    });
  }
  function tempoDa(S, d, dice) {   // il conto alla rovescia riparte a ogni rilancio (giro nuovo); se arriva una foto più fresca con meno tempo si accorcia (mai si allunga)
    var fine = Date.now() + Math.max(0, +d.resta || 0);
    if (d.giro !== S.giro || fine < (S.fine || 0) - 700) { S.giro = d.giro; S.fine = fine; avviaConta(S, d.resta, d.durata, dice); }
  }
  function fermaConta(S) {
    if (!S || !S.conta) return;
    S.conta.forEach(function (x) { clearTimeout(x); }); S.conta = [];
    if (S.tempo) { var w = S.tempo.getBoundingClientRect().width, tw = S.tempo.parentNode ? S.tempo.parentNode.getBoundingClientRect().width : 0; S.tempo.style.transition = "none"; S.tempo.style.transform = "scaleX(" + (tw ? Math.min(1, w / tw) : 0) + ")"; }
    if (S.radice) S.radice.classList.remove("ultimi");
  }
  function piedeAsta(S, d) {   // la riga d'aiuto e i tasti (online solo per chi gioca da questo telefono)
    svuotaNodo(S.piede);
    if (d.nota) { var n = document.createElement("p"); n.className = "sa-nota"; n.textContent = d.nota; S.piede.appendChild(n); }
    if (d.io != null && d.mie) d.mie.forEach(function (b) { S.piede.appendChild(b); });
  }
  function timbro(scritta) { var b = document.createElement("div"); b.className = "sa-aggiudicato"; b.textContent = scritta; return b; }

  // ---- la sala (temi) ----
  // dati: { chiave, info, carta (nodo), sotto, prezzo, leader (id o null), persone: [{ id, nome, omino, num, stato: "gara"|"passato"|"fuori", via, nota, puo }],
  //         io (online: il mio id; null = stesso telefono, tutti toccabili), giro + resta (il conto alla rovescia: riparte quando cambia giro), durata,
  //         avviso, nota, mie (i miei tasti, online), puoPassare, onRilancia(id), onPassa(id), onIndietro, extra: { testo, apri } }
  function salaAsta(t, d) {
    if (SALA && SALA.chiave === d.chiave && document.body.contains(SALA.radice)) return aggiornaSala(d);
    fermaConta(SALA);
    var el = t.el, S = { chiave: d.chiave, pers: {}, conta: [] }, sfondo = el("div", { class: "sa-sfondo" }), quadro = arte("sala", "");
    if (quadro) sfondo.style.backgroundImage = "url(\"" + quadro + "\")";
    S.bolla = el("div", { class: "sa-bolla" });
    S.martello = el("div", { class: "sa-martello", text: "🔨" });
    S.pannello = el("div", { class: "sa-pannello" }, [
      el("div", { class: "sa-lotto" }, [ d.carta, el("div", { class: "sa-sotto", text: d.sotto || "" }) ]),
      el("div", { class: "sa-prezzo" }, [ el("small", { text: "Offerta" }), S.prezzoN = el("b"), S.chi = el("span") ])
    ]);
    S.avviso = el("div", { class: "sa-avviso" });
    S.tempo = el("i");
    S.piede = el("div", { class: "sa-piede" });
    S.ban = el("div", { class: "sa-ban" }, [ el("img", { class: "sa-ban-img", src: srcAv(banditore(), { spalle: true }), alt: "" }),
      el("img", { class: "sa-leggio", src: arte("leggio", LEGGIO_RIS), alt: "" }), S.martello, S.bolla ]);
    S.radice = el("div", { class: "schermata sa-sala" }, [ sfondo, testaAsta(el, S, d), S.pannello, S.avviso, el("div", { class: "sa-tempo" }, [ S.tempo ]),
      pubblico(el, S, d.persone, arte("sedia", SEDIA_RIS), "sa-platea"), el("div", { class: "sa-basso" }, [ S.ban, S.piede ]) ]);
    S.ultimiDati = d; SALA = S;
    t.mostra(S.radice);
    aggiornaSala(d);
    adattaPubblico(S.pubblico);   // (dopo aver scritto nomi e crediti: così so quanto è alto davvero)
  }
  function aggiornaSala(d) {
    var S = SALA; if (!S) return; S.ultimiDati = d;
    S.info.textContent = d.info || "";
    S.prezzoN.textContent = d.prezzo + " 💰";
    var capo = trova(d.persone, d.leader);
    S.chi.textContent = capo ? (d.io != null && capo.id === d.io ? "👑 è tua" : "di " + capo.nome) : "nessuna offerta";
    S.avviso.textContent = d.avviso || ""; S.avviso.style.display = d.avviso ? "" : "none";
    aggiornaPubblico(S, d);
    nuovaOfferta(S, d, parlaBanditore);
    tempoDa(S, d, parlaBanditore);
    piedeAsta(S, d);
  }
  function parlaBanditore(testo, conta) {
    var S = SALA; if (!S) return;
    S.bolla.classList.toggle("conta", !!conta); rianima(S.bolla, "via", testo);
  }
  function aggiudica(testo, poi, scritta) {   // il martello batte: "Aggiudicato!" (o un'altra scritta), poi si va avanti
    var S = SALA; if (!S || !document.body.contains(S.radice)) { SALA = null; return poi(); }   // (sala non a vista: niente martello, e niente giro senza fine)
    fermaConta(S); S.martello.classList.add("batte"); rianima(S.ban, "batte"); parlaBanditore(testo);
    S.radice.appendChild(timbro(scritta || "AGGIUDICATO!")); S.radice.classList.add("chiusa");
    SALA = null;
    setTimeout(poi, 1500);
  }

  // =========================================================
  //  LO STADIO (asta del fantacalcio, sullo stesso telefono e online).
  //  In alto il maxischermo col calciatore all'asta (lo sfondo prende i colori della sua squadra, la maglia, il prezzo, e lo
  //  speaker che conta "12 e uno… 12 e due…"); in mezzo la tribuna coi giocatori seduti che alzano la paletta; in basso il
  //  campetto con la formazione: quando un calciatore è aggiudicato la sua maglia vola dal maxischermo al suo posto.
  //  Si costruisce una volta per partita: poi cambia solo quello che serve (niente lampeggio).
  // =========================================================
  var STADIO = null;
  var POSTI_CAMPO = [ { r: "A", x: 50, y: 18 }, { r: "C", x: 26, y: 42 }, { r: "C", x: 74, y: 42 }, { r: "D", x: 50, y: 59 }, { r: "P", x: 50, y: 85 } ];
  function nomeCampo(n) {   // "Martinez L." → "Martinez" (via le iniziali)
    var s = String(n || ""), p = s.split(" ").filter(function (x) { return !/^[A-Za-zÀ-ÿ]{1,3}\.$/.test(x); });
    return p.join(" ") || s;
  }
  function slotRosa(kit) {   // i 5 posti del campetto (nell'ordine di POSTI_CAMPO) col calciatore che ci va, o null
    var per = { P: [], D: [], C: [], A: [] }, usati = { P: 0, D: 0, C: 0, A: 0 };
    (kit || []).forEach(function (c) { if (per[c.ruolo]) per[c.ruolo].push(c); });
    return POSTI_CAMPO.map(function (p) { return per[p.r][usati[p.r]++] || null; });
  }
  // la parte del campetto (anche alla fine, per svelare i valori): 5 posti in formazione e il mister a bordo campo
  function campetto(el, S) {
    S.slot = POSTI_CAMPO.map(function (p) {
      var img = el("img", { class: "st-slot-maglia", alt: "" }), nm = el("span"), val = el("em", { class: "st-val" });
      var n = el("div", { class: "st-slot vuoto", style: "left:" + p.x + "%;top:" + p.y + "%" }, [ el("i", { class: "st-slot-vuoto", text: (FANTA_RUOLI[p.r] || {}).breve }), img, nm, val ]);
      return { nodo: n, img: img, nome: nm, val: val, ruolo: p.r, k: null };
    });
    S.mister = el("img", { class: "st-mister", alt: "" });
    S.campo = el("div", { class: "st-campo" }, S.slot.map(function (s) { return s.nodo; }));   // (il mister sta fuori, a bordo campo)
    var fondo = arte("campo", ""); if (fondo) { S.campo.style.backgroundImage = "url(\"" + fondo + "\")"; S.campo.classList.add("dipinto"); }
    S.campoNome = el("div", { class: "st-campo-nome" });
    return S.campo;
  }
  function riempiSlot(s, c, valore) {   // un posto del campetto: la maglia e il nome del calciatore (o vuoto col ruolo)
    var k = c ? c.nome + "|" + c.squadra : "";
    if (k !== s.k) {
      s.k = k; s.nodo.classList.toggle("vuoto", !c);
      if (c) { s.img.src = maglia(c.squadra); s.nome.textContent = nomeCampo(c.nome); } else { s.img.removeAttribute("src"); s.nome.textContent = ""; }
      s.val.classList.remove("su"); s.val.textContent = "";
    }
    if (valore != null) { s.val.textContent = valore; s.val.classList.add("su"); }
  }
  function mostraMister(S, g) { var k = g ? g.nome + JSON.stringify(g.omino || "") : ""; if (k !== S.misterK) { S.misterK = k; S.mister.src = g ? srcAv(cfgDi(g.nome, g.omino), {}) : ""; } }
  function maxischermo(el, S, conContatore) {   // il maxischermo: due strati di colore che sfumano, la maglia, i dati, lo speaker in basso
    S.colA = el("div", { class: "st-colori" }); S.colB = el("div", { class: "st-colori" });
    S.magliaImg = el("img", { class: "st-maglia", alt: "" });
    S.ruolo = el("span", { class: "st-ruolo" }); S.squadra = el("span", { class: "st-squadra" });
    S.nome = el("div", { class: "st-nome" });
    S.prezzoN = el("b"); S.chi = el("span");
    S.ticker = el("div", { class: "st-ticker" });
    S.schermo = el("div", { class: "st-schermo vuoto" }, [ S.colA, S.colB,
      el("div", { class: "st-dentro" }, [
        el("div", { class: "st-magliabox" }, [ S.magliaImg ]),
        el("div", { class: "st-dati" }, [ el("div", { class: "st-riga" }, [ S.ruolo, S.squadra ]), S.nome, el("div", { class: conContatore ? "st-prezzo st-contatore" : "st-prezzo" }, [ S.prezzoN, S.chi ]) ])
      ]), S.ticker, el("div", { class: "st-led" }) ]);
    return el("div", { class: "st-board" }, [ S.schermo ]);
  }
  function coloriSchermo(S, col) {   // lo sfondo del maxischermo prende i colori della squadra (sfumando da quelli di prima)
    var grad = col ? "linear-gradient(135deg," + col[0] + " 0%," + col[0] + " 50%," + col[1] + " 100%)" : "linear-gradient(135deg,#1b2a4a,#0c1424)";
    if (grad === S.grad) return; S.grad = grad;
    var sopra = S.colSopra === S.colA ? S.colB : S.colA, sotto = sopra === S.colA ? S.colB : S.colA;
    sotto.style.zIndex = "0"; sopra.style.zIndex = "1";
    sopra.style.transition = "none"; sopra.style.opacity = "0"; sopra.style.backgroundImage = grad; void sopra.offsetWidth;
    sopra.style.transition = "opacity .6s"; sopra.style.opacity = "1"; S.colSopra = sopra;
  }
  function speaker(testo, conta) { var S = STADIO; if (!S) return; S.ticker.className = "st-ticker" + (conta ? " conta" : ""); rianima(S.ticker, "via", testo); }

  // dati: come la sala, più { fase: "asta"|"esito", carta: { nome, squadra, ruolo }, base, persone[i].crediti/.kit,
  //         esito: { n, tipo: "vinta"|"forzata"|"accollo", chiId, chiNome, carta, prezzo } }
  function stadio(t, d) {
    if (STADIO && STADIO.chiave === d.chiave && document.body.contains(STADIO.radice)) return aggiornaStadio(d);
    fermaConta(STADIO);
    var el = t.el, S = { chiave: d.chiave, pers: {}, conta: [], squadre: {}, vista: null, esitoN: null, carta: null }, sfondo = el("div", { class: "sa-sfondo" }), quadro = arte("stadio", "");
    if (quadro) sfondo.style.backgroundImage = "url(\"" + quadro + "\")";
    S.avviso = el("div", { class: "sa-avviso" });
    S.tempo = el("i");
    S.piede = el("div", { class: "sa-piede st-piede" });
    var board = maxischermo(el, S, false), campo = campetto(el, S);
    S.radice = el("div", { class: "schermata sa-sala st-stadio" }, [ sfondo, testaAsta(el, S, d), board, S.avviso, el("div", { class: "sa-tempo" }, [ S.tempo ]),
      pubblico(el, S, d.persone, arte("seggiolino", SEGG_RIS), "st-tribuna", 5),
      el("div", { class: "st-campo-box" }, [
        el("div", { class: "st-campo-testa" }, [
          el("button", { class: "st-freccia", text: "‹", "aria-label": "La squadra prima", onclick: function () { giraSquadra(S, -1); } }), S.campoNome,
          el("button", { class: "st-freccia", text: "›", "aria-label": "La squadra dopo", onclick: function () { giraSquadra(S, 1); } }) ]),
        campo, S.mister ]),
      S.piede ]);
    S.ultimiDati = d; STADIO = S;
    t.mostra(S.radice);
    aggiornaStadio(d);
    adattaPubblico(S.pubblico);
  }
  function aggiornaStadio(d) {
    var S = STADIO; if (!S) return; S.ultimiDati = d;
    S.info.textContent = d.info || "";
    d.persone.forEach(function (p) { S.squadre[p.id] = p; });
    // il calciatore sul maxischermo: cambia solo quando ne esce uno nuovo
    var c = d.carta, k = c ? c.nome + "|" + c.squadra + "|" + (d.giroCarta || "") : "";
    if (k !== S.carta) {
      S.carta = k; S.prezzo = undefined; S.leader = undefined; S.giro = undefined; S.fine = 0;   // calciatore nuovo: il conto alla rovescia riparte comunque
      if (d.io != null && d.fase === "asta") { S.vista = d.io; S.ultimoLeader = null; }   // (online) si torna a guardare la propria squadra
      var vecchio = S.radice.querySelector(".sa-aggiudicato"); if (vecchio) vecchio.parentNode.removeChild(vecchio);
      S.radice.classList.remove("chiusa");
      coloriSchermo(S, c ? coloriSquadra(c.squadra) : null);
      S.schermo.classList.toggle("vuoto", !c);
      if (c) {
        var ru = FANTA_RUOLI[c.ruolo] || {};
        S.magliaImg.src = maglia(c.squadra); S.ruolo.textContent = ru.breve || ""; S.ruolo.className = "st-ruolo as-rb-" + c.ruolo;
        S.squadra.textContent = c.squadra || ""; S.nome.textContent = c.nome; rianima(S.schermo, "entra");
      }
    }
    S.prezzoN.textContent = !c ? "" : d.esito && d.esito.tipo === "accollo" && !d.prezzo ? "—" : d.prezzo + " 💰";   // (nessuno lo vuole: niente "0 💰")
    var capo = trova(d.persone, d.leader);
    S.chi.textContent = !c ? "" : capo ? (d.io != null && capo.id === d.io ? "👑 l'offerta è tua" : "offerta di " + capo.nome) : (d.base ? "prezzo di partenza" : "");
    S.avviso.textContent = d.avviso || ""; S.avviso.style.display = d.avviso ? "" : "none";
    aggiornaPubblico(S, d);
    // il campetto: online la tua squadra; sullo stesso telefono quella di chi ha appena offerto (con le frecce si guardano le altre)
    if (S.vista == null || !S.squadre[S.vista]) S.vista = d.io != null && S.squadre[d.io] ? d.io : d.persone[0].id;
    if (d.io == null && d.fase === "asta" && d.leader != null && d.leader !== S.ultimoLeader) S.vista = d.leader;
    S.ultimoLeader = d.leader;
    if (d.fase === "asta") {
      nuovaOfferta(S, d, speaker);
      tempoDa(S, d, speaker);
    } else fermaConta(S);
    if (d.esito && d.esito.n !== S.esitoN) { S.esitoN = d.esito.n; return esitoStadio(S, d); }
    disegnaCampo(S, d, S.volo && S.vista === S.volo.chi ? S.volo.slot : undefined);   // (se la maglia sta ancora volando, il suo posto resta vuoto)
    piedeAsta(S, d);
  }
  function disegnaCampo(S, d, salta) {   // la formazione della squadra che si guarda (salta: un posto lasciato vuoto, ci arriva la maglia in volo)
    var g = S.squadre[S.vista]; if (!g) return;
    S.campoNome.textContent = (d.io != null && g.id === d.io ? "La tua squadra" : "Squadra di " + g.nome) + " · " + g.crediti + " 💰";
    mostraMister(S, g);
    var posti = slotRosa(g.kit), cerca = d.fase === "asta" && d.carta ? d.carta.ruolo : null, segnato = false;
    S.slot.forEach(function (s, i) {
      var c = i === salta ? null : posti[i], qui = !c && !segnato && cerca === s.ruolo;
      riempiSlot(s, c);
      if (qui) segnato = true;
      s.nodo.classList.toggle("cerca", qui);   // il posto dove andrebbe il calciatore all'asta
    });
  }
  function giraSquadra(S, dir) {
    var d = S.ultimiDati, n = d.persone.length, i = 0;
    d.persone.forEach(function (p, j) { if (p.id === S.vista) i = j; });
    S.vista = d.persone[(i + dir + n) % n].id;
    S.ultimoLeader = d.leader;
    disegnaCampo(S, d);
  }
  function esitoStadio(S, d) {   // aggiudicato: timbro sul maxischermo e la maglia vola nel campetto di chi l'ha preso; nessuno: torna in fondo al mazzo
    var e = d.esito;
    S.radice.appendChild(timbro(e.tipo === "accollo" ? "NESSUNO!" : "AGGIUDICATO!")); S.radice.classList.add("chiusa");
    piedeAsta(S, d);
    if (e.tipo === "accollo") { speaker("Nessuno lo vuole" + (e.carta && e.carta.rifiuti ? " (" + e.carta.rifiuti + "ª volta)" : "") + ": torna in fondo al mazzo"); disegnaCampo(S, d); return; }
    speaker(e.tipo !== "forzata" ? "Aggiudicato a " + e.chiNome + " per " + e.prezzo + "!"
      : e.motivo === "ufficio" ? "Nessuno li ha voluti per 2 volte: questo va a caso a " + e.chiNome + " per " + e.prezzo
      : "Solo " + e.chiNome + " cerca un " + ((FANTA_RUOLI[e.carta.ruolo] || {}).nome || "").toLowerCase() + ": è suo per " + e.prezzo + "!");
    S.vista = e.chiId;
    var g = S.squadre[e.chiId], posti = g ? slotRosa(g.kit) : [], i = -1;
    posti.forEach(function (c, j) { if (c && c.nome === e.carta.nome && c.squadra === e.carta.squadra) i = j; });
    disegnaCampo(S, d, i);
    if (i < 0) return;
    var n = S.esitoN; S.volo = { slot: i, chi: e.chiId };
    setTimeout(function () {
      if (STADIO !== S || S.esitoN !== n) return;
      volo(S, i, function () { if (STADIO !== S) return; S.volo = null; disegnaCampo(S, S.ultimiDati); rianima(S.slot[i].nodo, "arriva"); FX.pop(); });
    }, 450);
  }
  function volo(S, i, poi) {   // la maglia vola dal maxischermo al suo posto nel campetto (solo transform: niente scatti)
    var s = S.slot[i], da = S.magliaImg.getBoundingClientRect(), a = s.img.getBoundingClientRect(), base = S.radice.getBoundingClientRect();
    if (!da.width || !a.width) return poi();
    var img = document.createElement("img"); img.className = "st-volo"; img.src = S.magliaImg.src; img.alt = "";
    img.style.left = (da.left - base.left) + "px"; img.style.top = (da.top - base.top) + "px"; img.style.width = da.width + "px"; img.style.height = da.height + "px";
    S.radice.appendChild(img);
    var dx = (a.left + a.width / 2) - (da.left + da.width / 2), dy = (a.top + a.height / 2) - (da.top + da.height / 2), sc = a.width / da.width;
    var finito = false, fine = function () { if (finito) return; finito = true; if (img.parentNode) img.parentNode.removeChild(img); poi(); };
    if (img.animate) {
      var an = img.animate([
        { transform: "translate(0px,0px) scale(1) rotate(0deg)" },
        { transform: "translate(" + (dx * 0.45) + "px," + (dy * 0.45 - 50) + "px) scale(" + ((1 + sc) / 1.7) + ") rotate(-190deg)", offset: 0.5 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(" + sc + ") rotate(-360deg)" }
      ], { duration: 850, easing: "ease-in-out", fill: "forwards" });
      an.onfinish = fine;
    }
    setTimeout(fine, 1050);
  }

  // il foglio che sale dal basso sopra la sala (le carte prese, le formazioni)
  function foglioSala(t, titolo, contenuto) {
    var el = t.el, velo = el("div", { class: "sa-foglio-velo" }), chiudi = function () { if (velo.parentNode) velo.parentNode.removeChild(velo); };
    velo.addEventListener("click", function (e) { if (e.target === velo) chiudi(); });
    velo.appendChild(el("div", { class: "sa-foglio" }, [ el("div", { class: "sa-foglio-testa" }, [ el("b", { text: titolo }), el("button", { class: "sa-tasto", text: "✕", onclick: chiudi }) ]), contenuto ]));
    var dove = SALA && document.body.contains(SALA.radice) ? SALA.radice : STADIO && document.body.contains(STADIO.radice) ? STADIO.radice : null;
    if (dove) dove.appendChild(velo);   // (a sala chiusa non si apre: resterebbe appeso sopra la schermata dopo)
  }
  // tutte le formazioni del fantacalcio: la rosa di ognuno su un campetto, con le maglie delle squadre
  function formazioni(t, giocatori) {
    var el = t.el, box = el("div", { class: "sa-formazioni" });
    (giocatori || []).forEach(function (g) {
      var posti = slotRosa(g.kit), campo = el("div", { class: "sa-campo" });
      posti.forEach(function (c, i) {
        var p = POSTI_CAMPO[i];
        campo.appendChild(el("div", { class: "sa-gioc" + (c ? "" : " vuoto"), style: "left:" + p.x + "%;top:" + p.y + "%" }, [
          c ? el("img", { class: "sa-maglia", src: maglia(c.squadra), alt: "" }) : el("i", { class: "sa-maglia", text: (FANTA_RUOLI[p.r] || {}).breve }),
          el("span", { text: c ? nomeCampo(c.nome) : "" })
        ]));
      });
      box.appendChild(el("div", { class: "sa-squadra" }, [ el("div", { class: "sa-sq-nome", text: g.nome + " · " + g.crediti + " 💰" }), campo ]));
    });
    foglioSala(t, "👕 Le formazioni", box);
  }
  function esciAsta(t, st) { t.conferma("Uscire dalla partita?", null, "Esci", function () { esciAstaOra(t, st); }); }   // la finestra dell'app
  function esciAstaOra(t, st) {
    if (st) { st.finita = true; if (st.asta && st.asta.bar && st.asta.bar._stop) st.asta.bar._stop(); if (st.pausa) clearTimeout(st.pausa); }
    fermaTutto(); t.esci();
  }
  function tempoAsta(a, quando, ms) {   // (stesso telefono) il conto alla rovescia riparte: allo scadere, quando()
    if (a.bar && a.bar._stop) a.bar._stop();
    ms = ms || SECONDI * 1000;
    a.giro = (a.giro || 0) + 1; a.scadenza = Date.now() + ms; a.durata = ms;
    var to = setTimeout(quando, ms); a.bar = { _stop: function () { clearTimeout(to); } };
  }
  // fantacalcio: chi ha già il ruolo pieno, in breve (sotto l'avatar)
  function notaPieno(r) { return { P: "✔ portiere preso", D: "✔ difensore preso", C: "✔ centrocampisti presi", A: "✔ attaccante preso" }[r] || "✔ ruolo pieno"; }
  // fantacalcio: quanti posti delle rose sono già presi (per il contatore in alto)
  function postiPresi(giocatori) { var n = 0; giocatori.forEach(function (g) { n += (g.kit || []).length; }); return n + " di " + (giocatori.length * 5) + " calciatori presi"; }
  function cartaSala(el, emoji, nome, ico) { return el("div", { class: "sa-carta-in" }, [ ico ? el("div", icoAttr("em", emoji)) : el("div", { class: "em", text: emoji }), el("div", { class: "nm", text: nome }) ]); }
  function chiaveVM(vm, carta) { return "vm|" + (vm.codice || "") + "|" + (vm.roundIdx != null ? vm.roundIdx : "") + "|" + (carta ? carta.nome : ""); }
  // (online, temi) la sala d'asta vista da questo telefono: il tuo avatar ha il numero giallo, i tuoi tasti in basso
  function salaAstaVM(t, vm, cb) {
    var el = t.el, myId = cb.myId, a = vm.asta, io = trova(vm.giocatori, myId);
    var hoPassato = a.passati.indexOf(myId) >= 0, guido = a.leaderId === myId, prezzo = a.offerta + 1;
    var inGara = io && !io.haCarta, max = io ? io.crediti - ((vm.totRound - 1) - vm.roundIdx) : 0, mie = [];
    // il rilancio porta con sé quale asta e quale prezzo ho visto: se nel frattempo è cambiato, non conta (e niente doppi tocchi)
    var rilancio = function () { if (unTocco(cb)) cb.onRilancia({ n: a.n, prezzo: prezzo }); };
    if (inGara && !hoPassato) {
      if (guido) mie.push(el("button", { class: "btn btn-verde sa-grande", text: "👑 L'offerta è tua", disabled: "disabled" }));   // non si rilancia contro sé stessi
      else {
        var bSu = el("button", { class: "btn btn-verde sa-grande", text: "🙋 Rilancio: " + prezzo + " 💰", onclick: rilancio });
        if (max < prezzo) bSu.disabled = true;
        mie.push(bSu);
        mie.push(el("button", { class: "btn btn-rosso", text: "Passo", onclick: function () { cb.onPassa({ n: a.n }); } }));
      }
    }
    var tardi = cb._tardi && Date.now() - cb._tardi < 3000;
    var persone = vm.giocatori.map(function (g, i) {
      var pass = a.passati.indexOf(g.id) >= 0;
      return { id: g.id, nome: g.nome, omino: g.omino || null, num: i + 1, via: !!g.via, stato: g.haCarta ? "fuori" : pass ? "passato" : "gara",
        nota: g.haCarta ? "✔ ha la carta" : pass ? "ha passato" : g.crediti + " 💰", puo: g.id === myId && inGara && !hoPassato && !guido && max >= prezzo };
    });
    salaAsta(t, {
      chiave: chiaveVM(vm, a.carta), info: "Round " + (vm.roundIdx + 1) + " di " + vm.totRound + " · stanza " + (vm.codice || ""),
      carta: cartaSala(el, a.carta.emoji, a.carta.nome, true), sotto: "Fascia ancora segreta 🤫",
      prezzo: a.offerta, leader: a.leaderId || null, persone: persone, io: myId || "—", mie: mie,
      giro: a.giro, resta: a.resta, durata: SECONDI * 1000,
      nota: !io ? "Stai guardando la partita" : !inGara ? "Hai già la tua carta di questo round" : hoPassato ? "Hai passato: aspetti il risultato" : guido ? "👑 L'offerta più alta è tua"
        : tardi ? "⏱ Troppo tardi: qualcuno ha offerto prima di te. Ora è " + a.offerta + " 💰" : "Hai " + io.crediti + " 💰 · puoi arrivare a " + Math.max(0, max),
      onRilancia: rilancio, onPassa: function () { cb.onPassa({ n: a.n }); },
      onIndietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); },
      extra: { testo: "🃏 Carte", apri: function () { var b = el("div", {}), pal = dettaglioPalio(el, vm.tavolo, a.carta.nome); if (pal) b.appendChild(pal); b.appendChild(pannelloKit(el, vm.giocatori)); foglioSala(t, "🃏 Le carte", b); } }
    });
  }
  // (online, fantacalcio) lo stadio visto da questo telefono
  function stadioVM(t, vm, cb) {
    var el = t.el, myId = cb.myId, a = vm.fase === "asta" ? vm.asta : null, e = vm.fase === "esito" ? vm.esito : null, io = trova(vm.giocatori, myId);
    var carta = a ? a.carta : e ? e.carta : null; if (!carta) return;
    var ru = FANTA_RUOLI[carta.ruolo] || {};
    var hoPassato = !!a && a.passati.indexOf(myId) >= 0, guido = !!a && a.leaderId === myId, prezzo = a ? (!a.leaderId ? a.offerta : a.offerta + 1) : 0;
    var inGara = !!(a && io && (io.conta[a.ruolo] || 0) < FANTA_SLOT[a.ruolo]), max = io ? io.max : 0, mie = [];
    // l'offerta porta con sé quale calciatore e quale prezzo ho visto: se nel frattempo è cambiato, non conta (e niente doppi tocchi)
    var rilancio = function () { if (a && unTocco(cb)) cb.onRilancia({ n: a.nCarta, prezzo: prezzo }); };
    if (inGara && !hoPassato) {
      if (guido) mie.push(el("button", { class: "btn btn-verde sa-grande", text: "👑 L'offerta è tua", disabled: "disabled" }));   // non si rilancia contro sé stessi
      else {
        var bSu = el("button", { class: "btn btn-verde sa-grande", text: !a.leaderId ? "🙋 Lo prendo a " + a.offerta + " 💰" : "🙋 Rilancio: " + prezzo + " 💰", onclick: rilancio });
        if (max < prezzo) bSu.disabled = true;
        mie.push(bSu);
        mie.push(el("button", { class: "btn btn-rosso", text: "Passo", onclick: function () { cb.onPassa({ n: a.nCarta }); } }));
      }
    }
    var tardi = cb._tardi && Date.now() - cb._tardi < 3000;
    var persone = vm.giocatori.map(function (g, i) {
      var pieno = a ? (g.conta[a.ruolo] || 0) >= FANTA_SLOT[a.ruolo] : false, pass = !!a && a.passati.indexOf(g.id) >= 0;
      return { id: g.id, nome: g.nome, omino: g.omino || null, num: i + 1, crediti: g.crediti, kit: g.kit || [], via: !!g.via, stato: pieno ? "fuori" : pass ? "passato" : "gara",
        nota: pieno ? notaPieno(a.ruolo) : pass ? "ha passato" : g.crediti + " 💰", puo: g.id === myId && inGara && !hoPassato && !guido && max >= prezzo };
    });
    stadio(t, {
      chiave: "fo|" + (vm.codice || "") + "|" + (vm.sessione || ""), fase: a ? "asta" : "esito",
      info: (a ? ru.nome + " all'asta" : e.tipo === "accollo" ? "Nessuno lo vuole" : "Aggiudicato!") + " · " + (vm.presi || (vm.restano + " in mazzo")),
      carta: carta, giroCarta: a ? a.nCarta : e.nCarta, prezzo: a ? a.offerta : e.prezzo, base: !!a && !a.leaderId, leader: a ? (a.leaderId || null) : (e.chiId || null),
      persone: persone, io: myId || "—", mie: mie, giro: a ? a.giro : null, resta: a ? a.resta : 0, durata: a ? (a.durata || FANTA_RILANCIO_MS) : FANTA_RILANCIO_MS, puoPassare: false,
      esito: e ? { n: e.n, nCarta: e.nCarta, tipo: e.tipo, motivo: e.motivo || "", chiId: e.chiId, chiNome: e.chiNome, carta: e.carta, prezzo: e.prezzo } : null,
      avviso: a ? avvisoFanta(a.ultimoDuello, a.ultimaChiamata, a.ruolo) : "",
      nota: !a ? "" : !io ? "Stai guardando la partita" : !inGara ? "Hai già " + (a.ruolo === "C" ? "i 2 centrocampisti" : "il " + ru.nome.toLowerCase()) + " in rosa" : hoPassato ? "Hai passato: aspetti il risultato" : guido ? "👑 L'offerta più alta è tua"
        : tardi ? "⏱ Troppo tardi: qualcuno ha offerto prima di te. Ora è " + a.offerta + " 💰" : "Hai " + io.crediti + " 💰 · puoi arrivare a " + Math.max(0, max),
      onRilancia: rilancio, onPassa: function () { if (a) cb.onPassa({ n: a.nCarta }); },
      onIndietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); },
      extra: { testo: "👕 Tutte", apri: function () { formazioni(t, vm.giocatori); } }
    });
  }

  // =========================================================
  //  FINE DEL FANTACALCIO: si scoprono i valori. Le rose si svelano una alla volta, dalla meno preziosa alla più preziosa:
  //  il contatore sale (ti-ti-ti) fino al valore della rosa (la somma delle quotazioni ufficiali) e a ogni calciatore che passa
  //  spunta il suo valore sulla maglia. Poi il podio. A pari valore vince chi ha più crediti avanzati.
  // =========================================================
  var RIVELA = null;
  function valoreCalc(c) { var V = (window.SG_FANTA_QUOTAZIONI || {}).valori || {}, v = +V[c.nome + " (" + c.squadra + ")"]; return v > 0 ? v : 1; }
  function classificaFanta(giocatori) {
    var righe = giocatori.map(function (g, i) {
      var kit = ordinaRosa(g.kit || []).map(function (c) { return { nome: c.nome, squadra: c.squadra, ruolo: c.ruolo, valore: valoreCalc(c) }; }), tot = 0;
      kit.forEach(function (c) { tot += c.valore; });
      return { id: g.id != null ? g.id : i, nome: g.nome, omino: g.omino || null, crediti: g.crediti, kit: kit, totale: tot };
    });
    righe.sort(function (a, b) { return (b.totale - a.totale) || (b.crediti - a.crediti); });
    righe.forEach(function (r, i) { var p = righe[i - 1]; r.pos = p && p.totale === r.totale && p.crediti === r.crediti ? p.pos : i + 1; r.punti = "valore " + r.totale; });
    return righe;
  }
  // opz: { chiave, onEsci, bottoni: function () → i tasti da mettere in fondo quando appare il podio }
  function rivelaFanta(t, righe, opz) {
    if (RIVELA && RIVELA.chiave === opz.chiave && document.body.contains(RIVELA.radice)) { RIVELA.opz = opz; if (RIVELA.finito) piedeRivela(RIVELA); return; }
    fermaRivela(RIVELA);
    var el = t.el, R = { chiave: opz.chiave, opz: opz, righe: righe, timer: [], iv: null, finito: false, conta: [] }, sfondo = el("div", { class: "sa-sfondo" }), quadro = arte("stadio", "");
    if (quadro) sfondo.style.backgroundImage = "url(\"" + quadro + "\")";
    var board = maxischermo(el, R, true), campo = campetto(el, R);
    R.campoBox = el("div", { class: "st-campo-box st-grande" }, [ el("div", { class: "st-campo-testa" }, [ R.campoNome ]), campo, R.mister ]);
    R.podio = el("div", { class: "st-podio", style: "display:none" });
    R.piede = el("div", { class: "sa-piede st-piede" });
    R.salta = el("button", { class: "sa-tasto", text: "Salta ⏭", onclick: function () { podioRivela(R); } });
    R.radice = el("div", { class: "schermata sa-sala st-stadio st-rivela" }, [ sfondo,
      el("div", { class: "sa-testa" }, [ el("button", { class: "sa-tasto", text: "‹", "aria-label": "Esci", onclick: function () { R.opz.onEsci(); } }),
        el("div", { class: "sa-info", text: "La classifica delle rose" }), R.salta ]),
      board, R.campoBox, R.podio, R.piede ]);
    R.ruolo.className = "st-ruolo st-ruolo-classifica"; R.ruolo.textContent = "CLASSIFICA";
    coloriSchermo(R, ["#1b2a4a", "#0c1424"]);
    RIVELA = R; t.mostra(R.radice);
    var ordine = righe.slice().reverse(), j = 0;
    rianima(R.ticker, "via", "Si scoprono le quotazioni vere: dalla rosa che vale meno a quella che vale di più!");
    function avanti() {
      if (!vivoRivela(R)) return;
      if (j >= ordine.length) return podioRivela(R);
      svelaRosa(R, ordine[j], j === ordine.length - 1, function () { j++; R.timer.push(setTimeout(avanti, 700)); });
    }
    R.timer.push(setTimeout(avanti, 1400));
  }
  function vivoRivela(R) { return R && RIVELA === R && document.body.contains(R.radice); }
  function fermaRivela(R) { if (!R) return; R.timer.forEach(function (x) { clearTimeout(x); }); R.timer = []; if (R.iv) { clearInterval(R.iv); R.iv = null; } }
  function svelaRosa(R, r, ultima, poi) {
    R.campoNome.textContent = "La rosa di " + r.nome + " · " + r.crediti + " 💰 avanzati";
    mostraMister(R, r);
    var posti = slotRosa(r.kit);
    R.slot.forEach(function (s, i) { riempiSlot(s, posti[i]); s.nodo.classList.remove("cerca"); });
    R.magliaImg.src = srcAv(cfgDi(r.nome, r.omino), {}); R.squadra.textContent = ""; R.nome.textContent = r.nome; R.prezzoN.textContent = "0"; R.chi.textContent = "valore della rosa";
    R.schermo.classList.remove("vuoto"); rianima(R.schermo, "entra");
    var pari = R.righe.filter(function (o) { return o !== r && o.totale === r.totale; });
    rianima(R.ticker, "via", "La rosa di " + r.nome + "…");
    // le soglie: portiere, difensore, centrocampisti, attaccante; quando il contatore le passa, spunta il valore sulla maglia
    var soglie = [], somma = 0;
    r.kit.forEach(function (c) { somma += c.valore; soglie.push({ fino: somma, i: posti.indexOf(c), v: c.valore }); });
    var durata = Math.max(1800, Math.min(4200, 1200 + r.totale * 26)), t0 = 0, ultimoTic = 0, mostrato = -1, k = 0;
    R.timer.push(setTimeout(function () {
      if (!vivoRivela(R)) return;
      t0 = Date.now();
      R.iv = setInterval(function () {
        if (!vivoRivela(R)) { clearInterval(R.iv); return; }
        var p = Math.min(1, (Date.now() - t0) / durata), v = Math.round(r.totale * (1 - (1 - p) * (1 - p)));
        if (v !== mostrato) { mostrato = v; R.prezzoN.textContent = v; var ora = Date.now(); if (ora - ultimoTic > 55) { ultimoTic = ora; FX.tic(p); } }
        while (k < soglie.length && v >= soglie[k].fino) { var s = R.slot[soglie[k].i]; if (s) { s.val.textContent = soglie[k].v; s.val.classList.add("su"); } k++; }
        if (p >= 1) {
          clearInterval(R.iv); R.iv = null;
          R.chi.textContent = r.pos + "° posto" + (r.pos === 1 ? "! 🏆" : "");
          rianima(R.ticker, "via", pari.length ? "Stesso valore di " + pari.map(function (o) { return o.nome; }).join(", ") + ": conta chi ha più crediti avanzati" : r.nome + ": " + r.totale + " punti di valore");
          if (ultima) FX.festa(); else FX.posto();
          R.timer.push(setTimeout(poi, ultima ? 1700 : 1300));
        }
      }, 40);
    }, 600));
  }
  function podioRivela(R) {   // il podio: i primi tre sui gradini (il primo con le braccia alzate), sotto gli altri
    if (!vivoRivela(R) || R.finito) return;
    fermaRivela(R); R.finito = true; R.salta.style.visibility = "hidden";
    var el = document.createElement.bind(document), w = R.righe[0];
    R.campoBox.style.display = "none"; R.podio.style.display = "";
    var primi = R.righe.filter(function (r) { return r.pos === 1; });   // (a pari valore e pari crediti vincono insieme)
    if (w) { R.magliaImg.src = srcAv(cfgDi(w.nome, w.omino), {}); R.nome.textContent = primi.map(function (r) { return r.nome; }).join(" e "); R.prezzoN.textContent = w.totale; R.chi.textContent = primi.length > 1 ? "pari merito! 🏆" : "vince! 🏆"; R.squadra.textContent = ""; rianima(R.schermo, "entra"); }
    rianima(R.ticker, "via", "Vince la rosa che vale di più! A pari valore, chi ha più crediti avanzati.");
    var gradini = el("div"); gradini.className = "st-gradini";
    [1, 0, 2].forEach(function (i) {
      var r = R.righe[i]; if (!r) return;
      var g = el("div"); g.className = "st-gradino p" + (i + 1); g.style.animationDelay = (i === 0 ? 0.5 : i === 1 ? 0.25 : 0) + "s";
      var img = el("img"); img.src = srcAv(cfgDi(r.nome, r.omino), i === 0 ? { braccia: "su" } : {}); img.alt = "";
      var b = el("b"); b.textContent = r.nome; var sm = el("small"); sm.textContent = r.totale + " · " + r.crediti + " 💰";
      var blocco = el("div"); blocco.className = "blocco"; blocco.textContent = r.pos;
      g.appendChild(img); g.appendChild(b); g.appendChild(sm); g.appendChild(blocco);
      gradini.appendChild(g);
    });
    R.podio.appendChild(gradini);
    if (R.righe.length > 3) {
      var altri = el("div"); altri.className = "st-altri";
      R.righe.slice(3).forEach(function (r) { var riga = el("div"); riga.textContent = r.pos + "° " + r.nome + " · valore " + r.totale + " · " + r.crediti + " 💰"; altri.appendChild(riga); });
      R.podio.appendChild(altri);
    }
    FX.festa();
    piedeRivela(R);
  }
  function piedeRivela(R) { svuotaNodo(R.piede); (R.opz.bottoni ? R.opz.bottoni() : []).forEach(function (b) { if (b) R.piede.appendChild(b); }); }
  function disegnaAsta(t, st) {   // (stesso telefono) l'asta nella sala: tocchi il tuo avatar per rilanciare (il tempo riparte solo coi rilanci)
    var el = t.el, a = st.asta;
    var persone = st.giocatori.map(function (g, i) {
      var inGara = st.senzaCarta.indexOf(i) >= 0, pass = !!a.passati[i];
      return { id: i, nome: g.nome, omino: g.omino || null, num: i + 1, stato: !inGara ? "fuori" : pass ? "passato" : "gara",
        nota: !inGara ? "✔ ha la carta" : pass ? "ha passato" : g.crediti + " 💰", puo: inGara && !pass && a.leader !== i && maxPuntata(st, i) >= a.offerta + 1 };
    });
    salaAsta(t, { chiave: "t|" + st.sessione + "|" + st.roundIdx + "|" + a.idxCarta + "|" + a.carta.nome, info: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND,
      carta: cartaSala(el, a.carta.emoji, a.carta.nome, true), sotto: "Fascia ancora segreta 🤫", prezzo: a.offerta, base: false, leader: a.leader,
      persone: persone, io: null, giro: a.giro, resta: a.scadenza - Date.now(), durata: SECONDI * 1000,
      nota: "Tocca il tuo avatar per rilanciare di 1. Allo scadere del tempo la carta va a chi offre di più.",
      onRilancia: function (i) { rilancia(t, st, i); }, onPassa: function (i) { passa(t, st, i); }, onIndietro: function () { esciAsta(t, st); },
      extra: { testo: "🃏 Carte", apri: function () { var b = el("div", {}), pal = dettaglioPalio(el, st.tavolo, a.carta.nome); if (pal) b.appendChild(pal); b.appendChild(pannelloKit(el, st.giocatori)); foglioSala(t, "🃏 Le carte", b); } } });
  }

  function rilancia(t, st, i) {
    var a = st.asta;
    // chi ha già l'offerta più alta non rilancia contro sé stesso (un doppio tocco non fa pagare di più)
    if (!a || a.leader === i || st.senzaCarta.indexOf(i) < 0 || maxPuntata(st, i) < a.offerta + 1) return;
    a.offerta += 1; a.leader = i;
    delete a.passati[i];
    FX.rilancio();
    if (restaSoloLeader(st)) return chiudiAsta(t, st);   // nessun altro può più rilanciare: è subito sua
    tempoAsta(a, function () { chiudiAsta(t, st); });
    disegnaAsta(t, st);
  }

  function passa(t, st, i) {
    var a = st.asta;
    if (!a || a.leader === i) return;
    a.passati[i] = true;
    // se resta solo chi ha l'offerta più alta, l'asta si chiude subito
    if (restaSoloLeader(st)) return chiudiAsta(t, st);
    disegnaAsta(t, st);
  }

  function chiudiAsta(t, st) {
    var a = st.asta;
    if (!a) return;
    if (a.bar && a.bar._stop) a.bar._stop();
    var vincitore = a.leader, prezzo = a.offerta, carta = a.carta;
    st.giocatori[vincitore].crediti -= prezzo;
    st.giocatori[vincitore].kit.push(carta);
    st.giocatori[vincitore].asteVinte = (st.giocatori[vincitore].asteVinte || 0) + 1;
    st.tavolo.splice(a.idxCarta, 1);
    st.senzaCarta = st.senzaCarta.filter(function (x) { return x !== vincitore; });
    st.chooserPtr++;
    st.asta = null;
    esitoAsta(t, st, vincitore, carta, prezzo, false);
  }

  function esitoAsta(t, st, chi, carta, prezzo, automatica, dopo) {
    if (st.finita) return;
    if (!dopo) return aggiudica("Aggiudicato a " + st.giocatori[chi].nome + " per " + prezzo + "!", function () { esitoAsta(t, st, chi, carta, prezzo, automatica, true); });   // prima il martello
    var el = t.el;
    FX.aggiudicato();
    var s = t.schermata({});
    s._contenuto.appendChild(el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:8px" }, [
      el("div", { style: "font-size:3.4rem;line-height:1", text: "🔨" }),
      el("div", { style: "font-size:1.6rem;font-weight:900", text: st.giocatori[chi].nome + " si aggiudica" }),
      el("div", { class: "as-big", style: "margin-top:6px" }, [
        el("div", icoAttr("em", carta.emoji)),
        el("div", { class: "nm", text: carta.nome }),
        el("div", { class: "as-fascia-x", text: "Fascia ancora segreta 🤫" })
      ]),
      el("div", { style: "font-size:1.3rem;font-weight:900;color:var(--accento)", text: "per " + prezzo + " 💰" }),
      automatica ? el("p", { class: "as-msg", text: "Ultima carta rimasta: assegnata automaticamente." }) : null,
      el("p", { class: "as-msg", text: st.giocatori[chi].crediti === 1 ? "Gli resta 1 credito." : "Gli restano " + st.giocatori[chi].crediti + " crediti." })
    ]));
    var vai = autoAvanti(st, s, function () { prossimaAsta(t, st); }, AUTO_ESITO_MS);
    s._piede.appendChild(tastoAuto(el, "Avanti ▶", AUTO_ESITO_MS, vai));
    t.mostra(s);
  }

  function fineRound(t, st) {
    st.roundIdx++;
    if (st.roundIdx < TOT_ROUND) return iniziaRound(t, st);
    riepilogo(t, st);
  }

  // ---- riepilogo dei kit ----
  function riepilogo(t, st) {
    var el = t.el;
    var fanta = st && st.formato === "fanta";
    var s = t.schermata({ icona: fanta ? "🎽" : "🎒", titolo: fanta ? "Le rose complete" : "I kit completi", sotto: "Ora si vota!" });
    if (st.giocatori.length > 2) s.classList.add("as-kits");
    st.giocatori.forEach(function (g) {
      s._contenuto.appendChild(nodoKit(el, g, st));
    });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Si vota ⭐", onclick: function () { votazione(t, st, 0); } }));
    t.mostra(s);
  }

  function nodoKit(el, g, st, rivela) {
    var fanta = st && st.formato === "fanta";
    var box = el("div", { class: "as-kit" });
    box.appendChild(el("h3", { text: g.nome + " · " + g.crediti + " 💰 avanzati" }));
    (fanta ? ordinaRosa(g.kit) : g.kit).forEach(function (c) {
      box.appendChild(el("div", { class: "riga" }, fanta ? [
        el("span", { class: "em", text: (FANTA_RUOLI[c.ruolo] || {}).emoji }),
        el("span", { style: "flex:1", text: c.nome + (c.squadra ? " · " + c.squadra : "") }),
        el("span", { class: "as-rb as-rb-" + c.ruolo, text: (FANTA_RUOLI[c.ruolo] || {}).breve })
      ] : [
        el("span", icoAttr("em", c.emoji)),
        el("span", { style: "flex:1", text: c.nome }),
        cellaTier(el, c.tier, rivela)
      ]));
    });
    return box;
  }

  // ---- votazione a stelle: si passa il telefono a ogni giocatore ----
  function votazione(t, st, votante) {
    if (votante >= st.giocatori.length) return finePartita(t, st);
    var nome = st.giocatori[votante].nome;
    t.passaA(nome, function () { schermoVoto(t, st, votante); });
  }

  function schermoVoto(t, st, votante) {
    var el = t.el;
    var voti = {};
    var budget = budgetVoti(st.giocatori.length);
    var s = t.schermata({ icona: "⭐", titolo: nomeBreve(st.giocatori[votante].nome) + (st && st.formato === "fanta" ? ", vota le rose" : ", vota i kit"),
      sotto: budget == null ? "Da 0,5 a 5 ⭐ (non il tuo)" : st.giocatori.length > 6 ? "" : "Ognuno parte da 3,5 ⭐: sposta le stelle" });   // (in tanti: più posto ai kit)
    var avanti = el("button", { class: "btn btn-primario", text: "Conferma i voti",
      onclick: function () {
        st.giocatori.forEach(function (g, i) { if (i !== votante && voti[i]) g.stelle = mezzo(g.stelle + voti[i]); });
        votazione(t, st, votante + 1);
      } });
    var opp = [];
    st.giocatori.forEach(function (g, i) { if (i !== votante) opp.push({ key: i, g: g }); });
    var sez = sezioneVoto(el, opp, budget, voti, function (ok) { avanti.disabled = !ok; });
    sez.nodi.forEach(function (n) { s._contenuto.appendChild(n); });
    s._piede.appendChild(avanti);
    t.mostra(s);
  }

  function nomeBreve(n) { return n.length > 12 ? n.slice(0, 12) + "…" : n; }

  function finePartita(t, st) {
    if (st && st.formato === "fanta") {   // fantacalcio: si scoprono le quotazioni, dalla rosa che vale meno a quella che vale di più
      var righe = classificaFanta(st.giocatori);
      return rivelaFanta(t, righe, { chiave: "rl|" + st.sessione, onEsci: function () { esciAsta(t, st); },
        bottoni: function () { return [t.el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: function () { classificaFinale(t, st, righe); } })]; } });
    }
    FX.fine();
    svelaFasce(t, st);   // le fasce restano nascoste per tutta la partita: si svelano solo ORA
  }
  // le posizioni in classifica: a pari punti, stessa posizione
  function conPosizioni(righe, uguali) { righe.forEach(function (r, i) { r.pos = i > 0 && uguali(righe[i - 1], r) ? righe[i - 1].pos : i + 1; }); return righe; }
  // temi: vince chi ha più stelle; a pari stelle chi ha più crediti avanzati (come nel fantacalcio)
  function classificaStelle(giocatori) {
    var righe = giocatori.slice().sort(function (a, b) { return (b.stelle - a.stelle) || (b.crediti - a.crediti); });
    return conPosizioni(righe.map(function (g) {
      var pari = righe.some(function (o) { return o !== g && o.stelle === g.stelle; });   // a pari stelle si vede anche lo spareggio
      return { id: g.id, nome: g.nome, stelle: g.stelle, crediti: g.crediti, punti: fmtMezzi(g.stelle) + " ⭐" + (pari ? " · " + g.crediti + " 💰" : "") };
    }), function (a, b) { return a.stelle === b.stelle && a.crediti === b.crediti; });
  }

  function svelaFasce(t, st) {
    var el = t.el;
    var s = t.schermata({ icona: "🃏", titolo: "Fasce svelate!", sotto: "Ecco il vero valore delle carte" });
    if (st.giocatori.length > 2) s.classList.add("as-kits");
    st.giocatori.forEach(function (g) { s._contenuto.appendChild(nodoKit(el, g, st, true)); });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Classifica finale 🏆",
      onclick: function () { classificaFinale(t, st); } }));
    t.mostra(s);
  }

  function classificaFinale(t, st, righe) {
    var classifica = st.formato === "fanta" && righe
      ? righe.map(function (r) { return { nome: r.nome, punti: "valore " + r.totale + " · " + r.crediti + " 💰", pos: r.pos }; })
      : classificaStelle(st.giocatori);
    var profilo = window.SGNube && SGNube.profilo ? SGNube.profilo() : null;
    var me = profilo && st.giocatori.filter(function (g) { return String(g.nome).trim().toLowerCase() === String(profilo.nome || "").trim().toLowerCase(); })[0];
    if (me) salvaTrofeiAsta(t, { fase: "fine", sessione: st.sessione, formato: st.formato,
      giocatori: st.giocatori.map(function (g) { return { nome: g.nome, asteVinte: g.asteVinte, stelle: g.stelle,
        creditiSpesi: (st.formato === "fanta" ? FANTA_BUDGET : st.crediti || st.giocatori[0].crediti + g.asteVinte) - g.crediti }; }),
      classifica: classifica }, null, false);
    t.fine(classifica);
  }


  // =========================================================
  //  MODALITÀ ONLINE — "ognuno dal suo telefono"
  //  Un telefono ospita la stanza e tiene l'unica copia vera
  //  della partita: calcola tutto e manda agli altri una "foto".
  //  Gli ospiti disegnano e rimandano solo le proprie mosse.
  // =========================================================

  function futuri(st) { return (TOT_ROUND - 1) - st.roundIdx; }
  function maxPuntataG(st, g) { return g.crediti - futuri(st); }
  function perId(st, id) { for (var i = 0; i < st.giocatori.length; i++) if (st.giocatori[i].id === id) return st.giocatori[i]; return null; }
  function nomeDi(st, id) { var g = perId(st, id); return g ? g.nome : ""; }

  function vmAsta(st) {
    var r = st.tema.round[st.roundIdx] || {};
    var sceglie = st.senzaCarta.length ? st.senzaCarta[st.chooserPtr % st.senzaCarta.length] : null, ora = Date.now();
    return {
      fase: st.fase, codice: st.codice, sessione: st.sessione, formato: "temi",
      temaNome: st.tema.nome, temaIcona: st.tema.icona, temaId: st.tema.id,
      temi: (window.SG_ASTA_TEMI || []).map(function (x) { return { id: x.id, nome: x.nome, icona: x.icona }; }),
      roundIdx: st.roundIdx, roundNome: r.nome, roundIcona: r.icona, totRound: TOT_ROUND,
      rounds: (st.tema.round || []).map(function (x) { return { nome: x.nome, icona: x.icona }; }),
      giocatori: st.giocatori.map(function (g) {
        return { id: g.id, nome: g.nome, omino: g.omino || null, crediti: g.crediti, creditiSpesi: st.crediti - g.crediti,
          asteVinte: g.asteVinte || 0, stelle: g.stelle || 0, haCarta: st.senzaCarta.indexOf(g.id) < 0, via: !!g.via, kit: g.kit.slice() };
      }),
      tavolo: st.tavolo.map(function (c) { return { nome: c.nome, emoji: c.emoji, tier: c.tier }; }),
      sceglieId: sceglie, sceglieNome: sceglie ? nomeDi(st, sceglie) : "",
      nScelta: st.nScelta, restaScelta: st.fineScelta ? Math.max(0, st.fineScelta - ora) : 0, durataScelta: st.durataScelta || SCELTA_MS,
      restaAuto: st.fineAuto ? Math.max(0, st.fineAuto - ora) : 0, durataAuto: st.durataAuto || 0,   // (esito, inizio round e kit vanno avanti da soli)
      restaVoto: st.fase === "voto" && st.fineVoto ? Math.max(0, st.fineVoto - ora) : 0,                // (il voto si chiude da solo)
      asta: st.asta ? {
        n: st.nAsta, carta: st.asta.carta, offerta: st.asta.offerta,
        leaderId: st.asta.leader, leaderNome: nomeDi(st, st.asta.leader),
        passati: Object.keys(st.asta.passati), giro: st.giro, resta: st.scadenza ? st.scadenza - ora : 0   // il tempo che resta (non l'ora: gli orologi dei telefoni non sono uguali)
      } : null,
      esito: st.esito || null,
      hannoVotato: Object.keys(st.voti || {}),
      classifica: st.classifica || null
    };
  }

  // i timer dell'host: se il telefono si addormenta (schermo spento, cambio app), al risveglio recupera subito quelli già scaduti
  function timerHost(st, vivo) {
    var T = {
      ferma: function () { if (st._to) { clearTimeout(st._to); st._to = null; } st._toFn = null; },
      dopo: function (fn, ms) {
        T.ferma(); st._toFn = fn; st._toAt = Date.now() + ms;
        st._to = setTimeout(function () { st._to = null; st._toFn = null; fn(); }, ms);
      },
      sveglia: function () {
        if (!vivo()) return T.smetti();
        if (document.hidden || !st._toFn || Date.now() < st._toAt) return;
        var f = st._toFn; T.ferma(); f();
      },
      smetti: function () { document.removeEventListener("visibilitychange", T.sveglia); }
    };
    document.addEventListener("visibilitychange", T.sveglia);
    return T;
  }
  // la ripresa (Passo 5): lo stato dell'host da ricordare è tutto st tranne i timer (campi con "_") e il tema (si
  // ricorda solo il suo id); toAt = l'ora del prossimo passo che va avanti da solo (esito, round, voto…)
  function statoDaRicordare(st, formato) {
    var s = { formato: formato, toAt: st._toFn ? st._toAt : null, temaId: st.tema ? st.tema.id : null };
    Object.keys(st).forEach(function (k) { if (k.charAt(0) !== "_" && k !== "tema" && k !== "morto" && k !== "pronta") s[k] = st[k]; });
    return s;
  }
  function ripristina(st, R0) {
    Object.keys(R0).forEach(function (k) { if (k !== "formato" && k !== "toAt" && k !== "temaId") st[k] = R0[k]; });
    st.pronta = false;
  }
  // un tocco alla volta: un doppio tocco (entro mezzo secondo) conta una volta sola
  function unTocco(cb) { var ora = Date.now(); if (ora - (cb._tocco || 0) < 500) return false; cb._tocco = ora; return true; }

  // ---------- L'HOST ----------
  function hostAsta(t, tema, crediti) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var IO = t.mioId || "host";   // io che tengo la partita ("host", o l'amico che ha preso il posto dell'host)
    var st = {
      tema: tema, crediti: crediti, sessione: null, roundIdx: 0, chooserPtr: 0,
      tavolo: [], senzaCarta: [], asta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, codice: "…", scadenza: null, _to: null, voti: {}, giro: 0,
      nAsta: 0, nScelta: 0, fineScelta: null, fineAuto: null,
      giocatori: [{ id: IO, nome: (t.giocatori && t.giocatori[0]) || "Host", crediti: crediti, kit: [], stelle: 0, asteVinte: 0, omino: t.mioOmino ? t.mioOmino() : null }]
    };
    // la partita di prima (l'host ha ricaricato: t.ripresa): stessi crediti, stesse carte, stessa fase (vedi riprendi)
    var R0 = prendiRipresa(t, "temi"), ripresa = !!R0, attesi = {}, tAttesi = null;
    if (ripresa) {
      ripristina(st, R0);
      st.tema = (window.SG_ASTA_TEMI || []).filter(function (x) { return x.id === R0.temaId; })[0] || st.tema;
      st.giocatori.forEach(function (g) { if (g.id !== IO && !g.via) attesi[g.id] = 1; });
    }
    var TM = timerHost(st, function () { return !cb._uscito && !st.morto; });
    function stopTo() { TM.ferma(); }
    // "⚙️ Regole" in saletta: tema e crediti nuovi; se passi al Fantacalcio cambia motore (stessa stanza, stessi amici)
    t.onRegole = function (im) {
      if (st.iniziata) return;
      if ((im.formato || "temi") === "fanta") { st.morto = true; TM.smetti(); return avviaAsta(t); }
      var temi = window.SG_ASTA_TEMI || [];
      st.tema = temi.filter(function (x) { return x.id === im.tema; })[0] || st.tema;
      st.crediti = im.crediti || 15;
      st.giocatori.forEach(function (g) { g.crediti = st.crediti; });
      bd();
    };
    // la Rivincita (dalla classifica): tutti di nuovo nella saletta, stessi amici
    t.onRivincita = function () { if (st.fase === "fine" && !st.morto) nuovaInLobby(); };

    var cbRete = {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        delete attesi[id];
        var g = perId(st, id); if (!g) return;
        if (!st.iniziata) { st.giocatori = st.giocatori.filter(function (x) { return x.id !== id; }); return bd(); }   // in saletta chi esce se ne va davvero
        // a partita cominciata chi perde la connessione resta al suo posto ("non c'è"): passa da solo, tiene le sue carte, e se rientra riprende a giocare
        g.via = true;
        if (st.fase === "asta" && verificaPassati()) return;
        if (st.fase === "voto") { bd(); return verificaVoti(); }
        if (st.fase === "scelta" && chiSceglie() === g) tempoScelta();   // tocca a lui scegliere: tra un attimo una carta a caso
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          delete attesi[id];   // (dopo una ripresa: è tornato)
          var gj = perId(st, id);
          if (gj) {   // chi rientra (stesso id) riprende il suo posto
            var eraVia = gj.via; gj.via = false;
            if (eraVia && st.fase === "scelta" && chiSceglie() === gj) tempoScelta();   // e se tocca a lui scegliere, ha di nuovo il suo tempo
          }
          else if (!st.iniziata && st.giocatori.length < MAX_GIOCATORI && (!t.puoSedersi || t.puoSedersi(id, m.nome)))   // (chi non è tra chi gioca guarda)
            st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), crediti: st.crediti, kit: [], stelle: 0, asteVinte: 0, omino: avatarOk(m.omino) });
          bd();
        }
        else if (m.t === "scegli") scegli(id, m);
        else if (m.t === "rilancia") rilanciaO(id, m);
        else if (m.t === "passa") passaO(id, m);
        else if (m.t === "voto") voto(id, m.voti, m.s);
      },
      onErrore: function (e) {
        // un errore di rete passeggero: la rete si ricollega da sola e rimanda l'ultima foto, quindi la partita NON si ferma
        if (st.iniziata || st.pronta) return;
        if (e && e.type === "no-mqtt") return senzaRete(t);
        erroreSchermo(t, "Non riesco ad aprire la stanza. Controlla la connessione e riprova.");
      }
    };
    var rete = ospitaAsta(cbRete, { ripresa: ripresa });   // (con la ripresa gli amici non tornano in saletta)

    function invia() { rete.invia({ t: "vm", vm: vmAsta(st) }); ricorda(); }
    // la partita com'è adesso, per riprenderla se ricarico la pagina (in saletta niente)
    function ricorda() { if (!st.morto) t.ricorda(st.iniziata && st.fase !== "lobby" ? statoDaRicordare(st, "temi") : null); }
    var dopoTM = TM.dopo; TM.dopo = function (fn, ms) { dopoTM(fn, ms); ricorda(); };   // (anche l'ora del prossimo passo)
    function bd() { invia(); disegna(); }
    // la ripresa: si ricomincia dalla stessa fase coi secondi che restavano (almeno 5); il lotto all'asta riparte
    // da capo a 1 credito da chi l'aveva scelto (le offerte di prima non valgono: i crediti si pagano solo all'aggiudicazione);
    // il voto continua coi secondi che mancano e coi voti già dati
    function riprendi() {
      tAttesi = setTimeout(function () { Object.keys(attesi).forEach(function (id) { cbRete.onAddio(id); }); }, 10000);
      var f = st.fase, ms = Math.max(5000, ((t.ripresa.ora(R0.toAt) || 0) - Date.now()));
      st.scadenza = null;
      if (f === "round" || f === "esito") { avantiDaSolo(ms); return bd(); }
      if (f === "kit") { avantiDaSolo(ms, avanti); return bd(); }
      if (f === "scelta") { tempoScelta(Math.max(8000, ms)); return bd(); }
      if (f === "voto") { st.fineVoto = Date.now() + ms; TM.dopo(function () { verificaVoti(true); }, ms); bd(); return verificaVoti(); }
      if (f === "asta" && st.asta) {
        var ch = chiSceglie(), a = st.asta;
        st.nAsta++; st.esito = null;
        st.asta = { carta: st.tavolo[a.idx] || a.carta, idx: a.idx, offerta: 1, leader: ch ? ch.id : a.leader, passati: {} };
        if (!verificaPassati()) riparti();
        return;
      }
      bd();   // (la classifica: si resta lì)
    }
    function chiSceglie() { return st.senzaCarta.length ? perId(st, st.senzaCarta[st.chooserPtr % st.senzaCarta.length]) : null; }

    function comincia() {
      if (st.iniziata || st.giocatori.length < 2) return;
      st.iniziata = true; st.sessione = nuovaSessione(); st.roundIdx = 0; nuovoRound();
    }
    function avantiDaSolo(ms, fn) {   // l'esito, l'inizio del round e i kit restano un attimo, poi si va avanti da soli
      st.fineAuto = Date.now() + ms; st.durataAuto = ms;
      TM.dopo(fn || prossima, ms);
    }
    function nuovoRound() {
      stopTo();
      var r = st.tema.round[st.roundIdx];
      st.tavolo = carteDelRound(r, st.giocatori.length, st.tema.id);
      st.senzaCarta = st.giocatori.map(function (g) { return g.id; });
      st.chooserPtr = st.roundIdx;
      st.asta = null; st.esito = null; st.scadenza = null; st.fineScelta = null;
      st.fase = "round";
      avantiDaSolo(AUTO_ROUND_MS);
      FX.round(); bd();
    }
    function prossima() {
      stopTo(); st.fineAuto = null;
      if (st.senzaCarta.length === 0) return fineRoundO();
      if (st.senzaCarta.length === 1 && st.tavolo.length === 1) {
        var g = perId(st, st.senzaCarta[0]), carta = st.tavolo[0];
        g.crediti -= 1; g.kit.push(carta);
        st.tavolo = []; st.senzaCarta = [];
        st.esito = { chiId: g.id, chiNome: g.nome, carta: carta, prezzo: 1, automatica: true };
        st.asta = null; st.scadenza = null; st.fase = "esito";
        avantiDaSolo(AUTO_ESITO_MS);
        FX.aggiudicato(); return bd();
      }
      st.fase = "scelta"; st.nScelta++; st.asta = null; st.esito = null; st.scadenza = null;
      tempoScelta();
      bd();
    }
    // chi sceglie ha 20 secondi (se non c'è, un attimo): allo scadere va all'asta una carta a caso, che parte da lui a 1
    function tempoScelta(ms) {
      var ch = chiSceglie(); if (st.fase !== "scelta" || !ch) return;
      ms = ch.via ? 2500 : (ms || SCELTA_MS);
      st.fineScelta = Date.now() + ms; st.durataScelta = ch.via ? 2500 : SCELTA_MS;
      var n = st.nScelta;
      TM.dopo(function () { if (st.fase === "scelta" && st.nScelta === n && st.tavolo.length) scegli(ch.id, null, Math.floor(Math.random() * st.tavolo.length)); }, ms);
    }
    // m: { idx, n (quale scelta), nome (della carta) }: una scelta arrivata in ritardo (rete lenta) non tocca un tavolo diverso
    function scegli(id, m, aCaso) {
      if (st.fase !== "scelta" || !st.senzaCarta.length) return;
      var ch = chiSceglie(); if (!ch || id !== ch.id) return;
      var idx = aCaso != null ? aCaso : (m ? m.idx : null);
      if (idx == null || idx < 0 || idx >= st.tavolo.length) return;
      if (aCaso == null && (!m || (m.n != null && (m.n !== st.nScelta || st.tavolo[idx].nome !== m.nome)))) return;
      stopTo(); st.fineScelta = null;
      st.nAsta++;
      st.asta = { carta: st.tavolo[idx], idx: idx, offerta: 1, leader: id, passati: {} };
      st.fase = "asta";
      if (!verificaPassati()) riparti();   // se nessun altro può rilanciare, è subito sua
    }
    function riparti() {
      st.giro++; st.scadenza = Date.now() + SECONDI * 1000;
      TM.dopo(chiudi, SECONDI * 1000);
      bd();
    }
    function tardi(id) {   // chi ha rilanciato quando il prezzo era già cambiato: glielo dico (non paga niente)
      if (id === IO) { cb._tardi = Date.now(); return disegna(); }
      rete.inviaVeloce({ t: "tardi", a: id, prezzo: st.asta ? st.asta.offerta : 0 });
    }
    // m: { n (quale asta), prezzo (quello che ha visto) }: un'offerta vecchia o doppia non conta
    function rilanciaO(id, m) {
      if (st.fase !== "asta" || !st.asta || !m || (m.n != null && m.n !== st.nAsta)) return;
      var g = perId(st, id); if (!g) return;
      if (st.senzaCarta.indexOf(id) < 0 || st.asta.leader === id) return;   // chi ha già l'offerta più alta non rilancia contro sé stesso
      if (m.prezzo !== st.asta.offerta + 1) return tardi(id);
      if (maxPuntataG(st, g) < m.prezzo) return;
      st.asta.offerta = m.prezzo; st.asta.leader = id;
      delete st.asta.passati[id];
      FX.rilancio(id === IO);
      if (!verificaPassati()) riparti();   // se nessun altro può più offrire, è subito sua
    }
    function passaO(id, m) {
      if (st.fase !== "asta" || !st.asta || !m || (m.n != null && m.n !== st.nAsta)) return;
      if (st.senzaCarta.indexOf(id) < 0) return;
      if (st.asta.leader === id) return;
      st.asta.passati[id] = true;
      if (!verificaPassati()) bd();
    }
    function verificaPassati() {   // resta in gara chi ha l'offerta e chi può ancora rilanciare (chi non c'è o non ha i crediti conta come passato)
      if (!st.asta) return false;
      var a = st.asta, restano = st.senzaCarta.filter(function (x) {
        if (x === a.leader) return true;
        var g = perId(st, x); return !a.passati[x] && g && !g.via && maxPuntataG(st, g) >= a.offerta + 1;
      });
      if (restano.length <= 1) { chiudi(); return true; }
      return false;
    }
    function chiudi() {
      if (st.fase !== "asta" || !st.asta) return;
      stopTo();
      var a = st.asta, g = perId(st, a.leader);
      if (!g) { st.asta = null; return prossima(); }
      g.crediti -= a.offerta; g.kit.push(a.carta);
      g.asteVinte = (g.asteVinte || 0) + 1;
      st.tavolo.splice(a.idx, 1);
      st.senzaCarta = st.senzaCarta.filter(function (x) { return x !== a.leader; });
      st.chooserPtr++;
      st.esito = { chiId: g.id, chiNome: g.nome, carta: a.carta, prezzo: a.offerta, automatica: false };
      st.asta = null; st.scadenza = null; st.fase = "esito";
      avantiDaSolo(AUTO_ESITO_MS);
      FX.aggiudicato(); bd();
    }
    function avanti() {
      if (st.fase === "esito" || st.fase === "round") return prossima();
      if (st.fase === "kit") {   // si vota: il voto ha un tempo per tutti, poi si chiude da solo
        stopTo(); st.fineAuto = null;
        var ms = votoMs(st.giocatori.length);
        st.fase = "voto"; st.voti = {}; st.fineVoto = Date.now() + ms;
        TM.dopo(function () { verificaVoti(true); }, ms);
        return bd();
      }
    }
    function fineRoundO() {
      st.roundIdx++;
      if (st.roundIdx < TOT_ROUND) return nuovoRound();
      st.fase = "kit"; avantiDaSolo(AUTO_KIT_MS, avanti); bd();
    }
    function voto(id, voti, sessione) {
      if (st.fase !== "voto" || (sessione != null && sessione !== st.sessione)) return;   // (un voto rimasto indietro dalla partita prima non conta; senza numero: vale per questa)
      if (!perId(st, id) || st.voti[id]) return;
      st.voti[id] = voti || {};
      bd(); verificaVoti();
    }
    // si chiude quando hanno votato tutti quelli che ci sono, oppure quando l'host la chiude (forza):
    // chi non ha votato dà 3,5 ⭐ a testa (la media), così non cambia gli equilibri
    function verificaVoti(forza) {
      if (st.fase !== "voto") return;
      var tutti = st.giocatori.every(function (g) { return st.voti[g.id] || g.via; });   // chi non c'è non blocca la votazione
      if (!tutti && !forza) return;
      stopTo(); st.fineVoto = null;
      st.giocatori.forEach(function (g) { g.stelle = 0; });
      st.giocatori.forEach(function (chi) {
        var v = st.voti[chi.id];
        st.giocatori.forEach(function (g) {
          if (g.id === chi.id) return;
          var vv = v ? mezzo(+v[g.id] || 0) : 3.5;
          if (vv >= 0.5) g.stelle = mezzo(g.stelle + Math.max(0.5, Math.min(5, vv)));
        });
      });
      st.classifica = classificaStelle(st.giocatori);
      st.fase = "fine"; FX.fine(); bd();
      if (t.risultato) t.risultato(st.classifica);   // per il torneo online
    }

    function scegliTema(idx) {  // l'host cambia argomento in lobby
      if (st.iniziata) return;
      var temi = window.SG_ASTA_TEMI || [];
      if (temi[idx]) { st.tema = temi[idx]; bd(); }
    }
    function nuovaInLobby() {   // "Nuova partita": tutti tornano in lobby, stessi giocatori
      stopTo();
      st.iniziata = false; st.fase = "lobby"; st.sessione = null; st.roundIdx = 0; st.chooserPtr = 0;
      st.tavolo = []; st.senzaCarta = []; st.asta = null; st.esito = null; st.classifica = null; st.voti = {}; st.scadenza = null;
      st.fineScelta = null; st.fineAuto = null; st.fineVoto = null;
      st.giocatori = st.giocatori.filter(function (g) { return !g.via; });   // chi non c'è più esce dalla stanza
      st.giocatori.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });   // (chi tiene la partita è il primo: in saletta ha la corona)
      st.giocatori.forEach(function (g) { g.crediti = st.crediti; g.kit = []; g.stelle = 0; g.asteVinte = 0; });
      bd();
    }
    var cb = {
      myId: IO, sonoHost: true,
      onComincia: comincia,
      onTema: scegliTema,
      onNuova: nuovaInLobby,
      onScegli: function (x) { scegli(IO, x); },
      onRilancia: function (x) { rilanciaO(IO, x); },
      onPassa: function (x) { passaO(IO, x); },
      onAvanti: avanti,
      onVoto: function (v) { voto(IO, v, st.sessione); },
      onChiudiVoti: function () { if (st.fase === "voto") t.conferma("Chiudere il voto?", "Chi non ha votato dà 3,5 ⭐ a testa.", "Chiudi", function () { if (st.fase === "voto") verificaVoti(true); }); },
      onEsci: function () { stopTo(); clearTimeout(tAttesi); t.ricorda(null); TM.smetti(); cb._uscito = true; fermaTutto(); rete.chiudi(); t.esci(); }
    };
    function disegna() { if (!st.morto && !cb._uscito) disegnaAstaVM(t, vmAsta(st), cb); }
    if (ripresa) riprendi(); else disegna();
  }

  // ---------- UN OSPITE ----------
  function ospiteAsta(t, codice) {
    pulisciCache();
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null };
    function manda(m) { if (S.rete) S.rete.invia(m); }
    var cb = {
      myId: null, sonoHost: false,
      onScegli: function (x) { manda({ t: "scegli", idx: x.idx, n: x.n, nome: x.nome }); },
      onRilancia: function (x) { manda({ t: "rilancia", n: x.n, prezzo: x.prezzo }); },
      onPassa: function (x) { manda({ t: "passa", n: x.n }); },
      onAvanti: function () {},
      onVoto: function (v) { manda({ t: "voto", voti: v, s: S.vm && S.vm.sessione }); },
      onEsci: function () { cb._uscito = true; fermaTutto(); if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() {
      if (!S.vm || cb._uscito) return;
      cb.myId = S.myId;
      if (S.vm.formato === "fanta") disegnaFantaVM(t, S.vm, cb);
      else disegnaAstaVM(t, S.vm, cb);
    }

    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🔨", titolo: "Entra all'asta", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        if (S.rete) return;   // (già in collegamento)
        ctx(); S.nome = (input.value || "Amico").trim() || "Amico";
        S.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (!m) return;
          if (m.t === "vm") { S.vm = m.vm; disegna(); }
          else if (m.t === "tardi" && m.a === S.myId) { cb._tardi = Date.now(); disegna(); }   // il mio rilancio è arrivato quando il prezzo era già salito
        },
        onChiuso: function (perche) {
          cb._uscito = true; fermaTutto();
          // sulla classifica finale resta la classifica: cambia solo la scritta d'attesa
          if (S.vm && S.vm.fase === "fine") {
            cb._chiusa = true;
            [].forEach.call(document.querySelectorAll(".as-msg, .sa-nota"), function (p) { if (/In attesa dell'host/.test(p.textContent)) p.textContent = "🚪 L'host ha chiuso la stanza"; });
            return;
          }
          erroreSchermo(t, perche && perche.voluto ? "L'host ha chiuso la partita." : "Collegamento perso. L'host potrebbe aver chiuso la partita.");
        },
        // (arriva solo se il primo collegamento non riesce: dopo, se la rete salta, il core mostra «📶 Mi ricollego…» e si continua)
        onErrore: function (e) {
          if (S.vm || cb._uscito) return;
          if (e && e.type === "no-mqtt") return senzaRete(t);
          cb._uscito = true; fermaTutto(); try { S.rete.chiudi(); } catch (x) {}
          erroreSchermo(t, "Non riesco a collegarmi alla stanza. Controlla la connessione e riprova.");
        }
      });
    }
  }

  function erroreSchermo(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---------- DISEGNO CONDIVISO (host e ospiti) ----------
  // Conserva i voti che sto mettendo finché resto in fase "voto":
  // così se un altro giocatore conferma (arriva una nuova foto) le mie
  // stelle non si azzerano. Si ripuliscono solo quando entro nel voto.
  function ricordaVoti(cb, vm) {
    if (vm.fase === "voto") { if (!cb._inVoto) { cb._voti = {}; cb._inVoto = true; } }
    else cb._inVoto = false;
    cb._voti = cb._voti || {};
  }

  // --- Regole voti a fine partita ---
  // Media 3,5 ⭐ per avversario. Budget = 3,5 × (giocatori − 1), da spendere
  // TUTTO. Ogni voto da 0,5 a 5 (mezze stelle, mai 0). Con 2 giocatori è libero.
  function budgetVoti(n) { return n <= 2 ? null : Math.round(3.5 * (n - 1) * 2) / 2; }
  function mezzo(x) { return Math.round((x || 0) * 2) / 2; }
  function fmtMezzi(x) { x = mezzo(x); return (x % 1 === 0) ? String(x) : x.toFixed(1).replace(".", ","); }

  // Costruisce la sezione di voto (banner budget + per ogni avversario il suo
  // nodo kit/rosa e uno stepper − valore +). Ritorna { nodi, valido, aggiorna }.
  // `voti` è l'oggetto persistente chiave→valore (indice o id).
  function sezioneVoto(el, opp, budget, voti, onChange) {
    // tutti partono da 3,5: il budget è già tutto speso, si spostano solo le mezze stelle (pochi tocchi anche in 10)
    opp.forEach(function (o) { if (!(voti[o.key] >= 0.5)) voti[o.key] = 3.5; });
    var fitto = opp.length >= 5;   // tanti kit: righe più basse, così la votazione entra (quasi) tutta nello schermo
    var banner = el("div", { class: "as-budget" });
    var steppers = [];
    function somma() { var s = 0; opp.forEach(function (o) { s += voti[o.key] || 0; }); return mezzo(s); }
    function valido() { return budget == null ? true : somma() === budget; }
    function aggiorna() {
      var s = somma(), ok = valido();
      if (budget == null) banner.textContent = "🎁 Voto libero: da 0,5 a 5 ⭐";
      else banner.textContent = s === budget ? (fitto ? "✅ Stelle tutte date · togli a uno per dare a un altro" : "⭐ " + fmtMezzi(budget) + " stelle tutte date ✅ · togli a uno per dare a un altro")
        : "Ti restano " + fmtMezzi(budget - s) + " ⭐ da dare";
      banner.className = "as-budget" + (ok ? " ok" : "") + (fitto ? " fitto" : "");
      steppers.forEach(function (p) {
        var v = voti[p.key];
        p.meno.disabled = (v <= 0.5);
        p.piu.disabled = !(v < 5 && (budget == null || s + 0.5 <= budget));
        p.val.textContent = fmtMezzi(v) + " ⭐";
      });
      if (onChange) onChange(ok);
    }
    var nodi = [banner];
    opp.forEach(function (o) {
      var val = el("span", { class: "as-vval" });
      var meno = el("button", { class: "as-vbtn", text: "−", "aria-label": "Meno stelle", onclick: function () { if (voti[o.key] > 0.5) { voti[o.key] = mezzo(voti[o.key] - 0.5); aggiorna(); } } });
      var piu = el("button", { class: "as-vbtn", text: "+", "aria-label": "Più stelle", onclick: function () { if (voti[o.key] < 5 && (budget == null || somma() + 0.5 <= budget)) { voti[o.key] = mezzo(voti[o.key] + 0.5); aggiorna(); } } });
      steppers.push({ key: o.key, meno: meno, piu: piu, val: val });
      // una riga per kit: il nome, le carte in breve (toccando si leggono tutte), le stelle a destra
      var carte = el("div", { class: "as-kv-k" });
      (o.g.kit || []).forEach(function (c, i) {
        if (i) carte.appendChild(document.createTextNode(" · "));
        carte.appendChild(el("span", icoAttr("em", c.emoji)));
        carte.appendChild(document.createTextNode(c.nome));
      });
      var riga = el("div", { class: "as-kv" + (fitto ? " fitta" : "") });
      riga.appendChild(el("div", { class: "as-kv-t", onclick: function () { riga.classList.toggle("aperta"); } }, [
        el("div", { class: "as-kv-n", text: o.g.nome }), carte ]));
      riga.appendChild(meno); riga.appendChild(val); riga.appendChild(piu);
      nodi.push(riga);
    });
    aggiorna();
    return { nodi: nodi, valido: valido, aggiorna: aggiorna };
  }
  // pannello IN LINEA coi kit di tutti (Asta classica): mostrato durante
  // l'asta e sull'esito, così si vedono le squadre senza aprire altre schermate.
  function pannelloKit(el, giocatori) {
    var box = el("div", { class: "as-rose" });
    box.appendChild(el("div", { class: "etichetta", style: "margin-top:6px", text: "I kit finora" }));
    (giocatori || []).forEach(function (g) {
      var card = el("div", { class: "as-rose-p" });
      card.appendChild(el("div", { class: "as-rose-nome", text: g.nome + " · " + g.crediti + "💰" }));
      if (!g.kit || !g.kit.length) card.appendChild(el("div", { class: "as-rose-vuota", text: "ancora niente" }));
      else g.kit.forEach(function (c) {
        card.appendChild(el("div", { class: "as-rose-riga" }, [
          el("span", icoAttr("as-rose-em", c.emoji)),
          el("span", { class: "as-rose-txt", text: c.nome }),
          cellaTier(el, c.tier, false)
        ]));
      });
      box.appendChild(card);
    });
    return box;
  }
  function strisciaOnline(el, vm, myId) {
    var top = el("div", { class: "as-top" });
    vm.giocatori.forEach(function (g) {
      top.appendChild(el("div", { class: "as-pt" + (g.id === myId ? " attivo" : "") + (g.haCarta ? " fatto" : "") }, [
        el("div", { class: "n", text: g.nome }),
        el("div", { class: "c", text: g.crediti + "💰" })
      ]));
    });
    return top;
  }
  function testaRound(el, vm) {
    var wrap = el("div", {});
    wrap.appendChild(el("div", { class: "as-round", style: "margin:6px 0 4px" }, [
      el("div", { class: "n", text: "Round " + (vm.roundIdx + 1) + " di " + vm.totRound })
    ]));
    if (vm.rounds && vm.rounds.length) wrap.appendChild(strisciaRound(el, vm.rounds, vm.roundIdx));
    else wrap.appendChild(el("div", { class: "as-round" }, [ el("div", { class: "t", text: (vm.roundIcona || "") + " " + (vm.roundNome || "") }) ]));
    return wrap;
  }
  function nodoKitVm(el, g, rivela) {
    var box = el("div", { class: "as-kit" });
    box.appendChild(el("h3", { text: g.nome + " · " + g.crediti + " 💰 avanzati" }));
    g.kit.forEach(function (c) {
      box.appendChild(el("div", { class: "riga" }, [
        el("span", icoAttr("em", c.emoji)),
        el("span", { style: "flex:1", text: c.nome }),
        cellaTier(el, c.tier, rivela)
      ]));
    });
    return box;
  }

  function disegnaAstaVM(t, vm, cb) {
    var el = t.el, myId = cb.myId;
    ricordaVoti(cb, vm);   // i voti in corso non si azzerano quando un altro conferma
    if (vm.fase === "lobby") return lobbyAsta(t, vm, cb);
    if (vm.fase === "fine") return schermataFineAsta(t, vm, cb);
    // (online) l'asta si gioca nella sala; finita, il martello batte prima di mostrare chi l'ha presa
    var M = cb._martello;   // la stessa foto rimandata mentre batte il martello (qualcuno rientra): la tengo per dopo, il martello finisce
    if (M && Date.now() < M.fino && vm.fase === "esito" && vm.esito && vm.esito.carta && chiaveVM(vm, vm.esito.carta) === M.k) { M.vm = vm; return; }
    var ver = cb._ver = (cb._ver || 0) + 1;
    if (vm.fase === "asta") return salaAstaVM(t, vm, cb);
    if (vm.fase === "esito" && vm.esito && vm.esito.carta && SALA && SALA.chiave === chiaveVM(vm, vm.esito.carta)) {
      var e0 = vm.esito, nessuno = e0.tipo === "accollo", m = cb._martello = { k: chiaveVM(vm, e0.carta), fino: Date.now() + 1600, vm: vm };
      return aggiudica(nessuno ? "Nessuno lo vuole!" : "Aggiudicato a " + e0.chiNome + " per " + e0.prezzo + "!", function () { cb._martello = null; if (cb._ver === ver && !cb._uscito) disegnaAstaVM(t, m.vm, cb); }, nessuno ? "NESSUNO!" : "AGGIUDICATO!");
    }

    // (votazione) mentre voto, le foto che arrivano quando un altro conferma non mi ridisegnano la schermata (niente lampeggio, i voti restano)
    var kVoto = vm.fase === "voto" ? "voto|" + vm.sessione + "|" + vm.giocatori.map(function (g) { return g.id; }).join(",") : null;
    if (kVoto && vm.hannoVotato.indexOf(myId) < 0 && cb._voto && cb._voto.k === kVoto && document.body.contains(cb._voto.s)) { if (cb._voto.agg) cb._voto.agg(vm); return; }
    cb._voto = null;
    var esci = function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); };
    var s = vm.fase === "scelta" ? t.schermata({ indietro: esci })   // la scelta della carta: il tavolo prima di tutto (niente titolo)
      : t.schermata({ sotto: "Stanza " + (vm.codice || ""), icona: "🔨", titolo: titoloFaseAsta(vm, myId), indietro: esci });

    if (vm.fase !== "kit" && vm.fase !== "voto") s._contenuto.appendChild(testaRound(el, vm));
    if (vm.fase !== "voto" && vm.fase !== "kit") s._contenuto.appendChild(strisciaOnline(el, vm, myId));   // (nei kit i crediti avanzati sono già scritti, nella votazione non servono: più posto ai kit)
    if (vm.fase === "kit" || vm.fase === "voto") s.classList.add("as-fissa");   // (i tasti in fondo si vedono sempre)

    if (vm.fase === "round") {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:3.4rem;line-height:1;margin:10px 0", text: vm.roundIcona }));
      s._contenuto.appendChild(el("p", { class: "as-msg", text: "Sul tavolo " + vm.giocatori.length + " carte: ognuno se ne aggiudica una." }));
      piedeAuto(t, s, vm, cb, "Vedi le carte ▶", "Tra poco le carte…");
    }

    else if (vm.fase === "scelta") {
      var mio = vm.sceglieId === myId, scelta = false;
      s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-bottom:6px",
        text: mio ? "🔨 Scegli tu la carta da mettere all'asta" : ("🔨 " + vm.sceglieNome + " sta scegliendo la carta") }));
      if (vm.restaScelta > 0) s._contenuto.appendChild(barraTempo(el, vm.restaScelta, vm.durataScelta));   // allo scadere ne esce una a caso
      var g1 = el("div", { class: "as-griglia" + (vm.tavolo.length > 6 ? " tante molte" : vm.tavolo.length > 3 ? " tante" : "") });
      if (vm.tavolo.length > 6) s.classList.add("as-stretto");
      vm.tavolo.forEach(function (c, idx) {
        var nodo = el("button", { class: "as-carta", onclick: mio ? function () { if (scelta) return; scelta = true; cb.onScegli({ idx: idx, n: vm.nScelta, nome: c.nome }); } : null }, [
          el("span", icoAttr("em", c.emoji)),
          el("span", { class: "nm", text: c.nome }),
          cellaTier(el, c.tier, false)
        ]);
        if (!mio) nodo.disabled = true;
        g1.appendChild(nodo);
      });
      s._contenuto.appendChild(g1);
    }

    else if (vm.fase === "esito") {
      var e2 = vm.esito || {};
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:3rem;line-height:1;margin:6px 0", text: "🔨" }));
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.4rem;font-weight:900", text: e2.chiNome + " si aggiudica" }));
      s._contenuto.appendChild(el("div", { class: "as-big", style: "margin-top:8px" }, [
        el("div", icoAttr("em", e2.carta.emoji)),
        el("div", { class: "nm", text: e2.carta.nome }),
        el("div", { class: "as-fascia-x", text: "Fascia ancora segreta 🤫" })
      ]));
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.3rem;font-weight:900;color:var(--accento);margin-top:8px",
        text: "per " + e2.prezzo + " 💰" }));
      if (e2.automatica) s._contenuto.appendChild(el("p", { class: "as-msg", text: "Ultima carta rimasta: assegnata automaticamente." }));
      piedeAuto(t, s, vm, cb, "Avanti ▶", "Si va avanti da soli…");
    }

    else if (vm.fase === "kit") {
      if (vm.giocatori.length > 2) s.classList.add("as-kits");
      vm.giocatori.forEach(function (g) { s._contenuto.appendChild(nodoKitVm(el, g)); });
      piedeAuto(t, s, vm, cb, "Si vota ⭐", "Tra poco si vota…");
    }

    else if (vm.fase === "voto") {
      var hoVotato = vm.hannoVotato.indexOf(myId) >= 0;
      var dentro = vm.giocatori.some(function (g) { return g.id === myId; });
      var secVoto = Math.max(1, Math.ceil((vm.restaVoto || 0) / 1000)), kConto = kVoto + "|conto";
      // l'host può chiudere il voto prima, quando ha votato almeno uno (chi manca dà 3,5 ⭐ a testa)
      var bChiudi = cb.sonoHost && cb.onChiudiVoti ? el("button", { class: "btn btn-fantasma", onclick: cb.onChiudiVoti }) : null;
      var aggChiudi = function (v) {
        if (!bChiudi) return;
        var n = v.hannoVotato.length, tot = v.giocatori.filter(function (g) { return !g.via; }).length;
        bChiudi.textContent = "Chiudi il voto (" + n + " su " + tot + ")";
        if (n < 1) { if (bChiudi.parentNode) bChiudi.parentNode.removeChild(bChiudi); } else if (!bChiudi.parentNode) s._piede.appendChild(bChiudi);   // (compare solo quando ha votato qualcuno)
      };
      if (hoVotato || !dentro) {
        s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-top:20px",
          text: hoVotato ? ("Hai votato. Aspetta gli altri… (" + vm.hannoVotato.length + " su " + vm.giocatori.length + ")") : "Stai guardando la partita" }));
        var mancano = vm.giocatori.filter(function (g) { return vm.hannoVotato.indexOf(g.id) < 0 && !g.via; }).map(function (g) { return g.nome; });
        if (mancano.length) s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-top:8px", text: "Mancano: " + mancano.join(", ") }));
        if (vm.restaVoto > 0) {   // il voto si chiude da solo: «Si va avanti tra 42…»
          var pc = el("p", { class: "as-msg", style: "margin-top:8px" });
          s._contenuto.appendChild(pc);
          if (t.contoAvanti) t.contoAvanti(pc, secVoto, null, kConto);
        }
        var fa = t.faccine ? t.faccine() : null;   // intanto si fanno le faccine agli altri
        if (fa) s._contenuto.appendChild(el("div", { style: "display:flex;justify-content:center;margin-top:14px" }, [ fa ]));
        if (bChiudi) aggChiudi(vm);
      } else {
        var voti = cb._voti;
        var conferma = el("button", { class: "btn btn-primario", text: "Conferma i voti", onclick: function () { if (!conferma.disabled) cb.onVoto(voti); } });
        var opp = [];
        vm.giocatori.forEach(function (g) { if (g.id !== myId) opp.push({ key: g.id, g: g }); });
        var sez = sezioneVoto(el, opp, budgetVoti(vm.giocatori.length), voti, function (ok) { conferma.disabled = !ok; });
        sez.nodi.forEach(function (n) { s._contenuto.appendChild(n); });
        s._piede.appendChild(conferma);
        if (bChiudi) aggChiudi(vm);
        // il tempo del voto sul tasto: poco prima che l'host chiuda, le stelle messe partono da sole (se sono tutte date)
        if (vm.restaVoto > 0 && t.contoAvanti) t.contoAvanti(conferma, Math.max(1, secVoto - 3), function () {
          if (!cb._uscito && sez.valido() && document.body.contains(conferma)) cb.onVoto(voti);
        }, kConto + "|tasto");
        cb._voto = { k: kVoto, s: s, agg: aggChiudi };
      }
    }

    t.mostra(s);
  }

  // la barra del tempo che si accorcia (solo transform): parte già al punto giusto anche se la foto arriva a metà
  function barraTempo(el, resta, durata) {
    var i = el("i"); durata = Math.max(resta, durata || resta);
    i.style.animation = "asAuto " + durata + "ms linear " + (resta - durata) + "ms forwards";
    return el("div", { class: "as-tbar" }, [ i ]);
  }
  // (online, temi) inizio round, esito e kit vanno avanti da soli (il tempo lo tiene l'host): l'host ha il tasto col numero
  // che conta (toccandolo si va subito), gli altri leggono «Si va avanti tra N…». La chiave tiene il conto se si ridisegna.
  function piedeAuto(t, s, vm, cb, testo, attesa) {
    var el = t.el, resta = vm.restaAuto || 0, sec = Math.max(1, Math.ceil(resta / 1000));
    var k = ["asta", vm.codice, vm.sessione, vm.fase, vm.roundIdx, vm.nScelta, vm.esito && vm.esito.carta ? vm.esito.chiNome + "|" + vm.esito.carta.nome : ""].join("|");
    if (cb.sonoHost) {
      var b = el("button", { class: "btn btn-primario", text: testo, onclick: cb.onAvanti });
      s._piede.appendChild(b);
      if (resta > 0 && t.contoAvanti) t.contoAvanti(b, sec, null, k);   // (a zero va avanti il tempo dell'host)
    } else {
      var p = el("p", { class: "as-msg", text: attesa });
      s._piede.appendChild(p);
      if (resta > 0 && t.contoAvanti) t.contoAvanti(p, sec, null, k);
    }
  }

  function titoloFaseAsta(vm, myId) {
    if (vm.fase === "round") return vm.roundNome || "Round";
    if (vm.fase === "scelta") return vm.sceglieId === myId ? "Scegli tu" : ("Sceglie " + vm.sceglieNome);
    if (vm.fase === "asta") return "Asta in corso";
    if (vm.fase === "esito") return "Aggiudicata!";
    if (vm.fase === "kit") return "I kit completi";
    if (vm.fase === "voto") return "Vota i kit";
    return "L'Asta";
  }

  function avatarOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function lobbyAsta(t, vm, cb) {
    var el = t.el, info = el("div");
    if (vm.formato === "fanta") {
      info.appendChild(el("div", { class: "etichetta", text: "Modalità" }));
      info.appendChild(el("p", { class: "as-msg", text: "⚽ Mini asta Fantacalcio — rosa da 5 (1 P, 1 D, 2 C, 1 A), 20 crediti a testa. Vince la rosa che vale di più (quotazioni vere, svelate alla fine)." }));
    } else {   // tutte le regole si cambiano da "⚙️ Regole" (l'host); qui tutti vedono come si gioca
      var cr = (vm.giocatori && vm.giocatori[0] && vm.giocatori[0].crediti) || 15;
      info.appendChild(el("div", { class: "etichetta", text: "Si gioca così" }));
      info.appendChild(el("p", { class: "as-msg", text: "🎁 Temi classici · " + vm.temaIcona + " " + vm.temaNome + " · 💰 " + cr + " crediti a testa" }));
    }
    t.lobby({ host: cb.sonoHost, codice: vm.codice, min: 2,
      giocatori: vm.giocatori.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [info], attesa: "Aspetta che l'host cominci l'asta: tieni pronti i crediti! 💰",
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function schermataFineAsta(t, vm, cb) {
    var el = t.el;
    salvaTrofeiAsta(t, vm, cb && cb.myId, true);
    var etichetta = vm.formato === "fanta" ? "Mini asta Fantacalcio" : ("L'Asta · " + (vm.temaNome || ""));
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: etichetta });
    s.classList.add("as-fissa");   // (alta come lo schermo: "Nuova partita" si vede sempre, le fasce svelate scorrono nel centro)
    s._contenuto.appendChild(el("div", { class: "tl-coriandoli", text: "🎉🥳🎉" }));
    var ol = el("ol", { class: "classifica" });
    var med = ["🥇", "🥈", "🥉"], gruppo = 0, ultimaPos = null;
    (vm.classifica || []).forEach(function (r, i) {
      var pos = r.pos || i + 1;
      if (pos !== ultimaPos) { gruppo++; ultimaPos = pos; }   // a pari merito stessa medaglia, e dopo viene la medaglia successiva (oro, oro, argento)
      var li = el("li", { class: pos === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[gruppo - 1] || pos + "°" }),
        el("span", { class: "nome", text: r.nome }),
        el("span", { class: "punti", text: r.punti })
      ]);
      li.style.animationDelay = (i * 0.12) + "s";
      ol.appendChild(li);
    });
    s._contenuto.appendChild(ol);
    // Fasce svelate: ora che si è votato, si scopre il vero valore delle carte
    if (vm.formato !== "fanta" && vm.giocatori && vm.giocatori.some(function (g) { return g.kit && g.kit.length; })) {
      s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:14px", text: "🃏 Fasce svelate" }));
      if (vm.giocatori.length > 2) s.classList.add("as-kits");
      vm.giocatori.forEach(function (g) { s._contenuto.appendChild(nodoKitVm(el, g, true)); });
    }
    var fa = t.faccine ? t.faccine() : null;   // le faccine della saletta: si festeggia (o si sfotte) tutti insieme
    if (fa) s._piede.appendChild(el("div", { style: "display:flex;justify-content:center" }, [ fa ]));
    // i tasti di fine uguali per tutti (Rivincita, Cambia gioco, Ci sto…) li mette il core; se no quelli di sempre
    if (t.tastiFine && t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) { /* fatto dal core */ }
    else if (cb.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: vm.formato === "fanta" ? "🔄 Nuova partita" : "🔄 Nuova partita (cambia argomento)", onclick: cb.onNuova }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    } else {
      s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa dell'host per un'altra partita…" }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
  }
  // =========================================================
  //  MODALITÀ "MINI ASTA FANTACALCIO"
  //  Rosa da 5 (1 P, 1 D, 2 C, 1 A), 20 crediti a testa.
  //  Le carte escono dal mazzo una alla volta; chi ha già quel
  //  ruolo pieno non punta; se nessuno offre, la carta va in
  //  fondo (accollo) e si ripesca più avanti.
  //  Le fasce A/B/C servono solo a costruire il mazzo: mai a schermo.
  // =========================================================
  var FANTA_BUDGET = 20;
  var FANTA_SLOT = { P: 1, D: 1, C: 2, A: 1 };
  var FANTA_ORD = ["P", "D", "C", "A"];
  var FANTA_RUOLI = {
    P: { nome: "Portiere", plurale: "portieri", breve: "POR", emoji: "🧤" },
    D: { nome: "Difensore", plurale: "difensori", breve: "DIF", emoji: "🛡️" },
    C: { nome: "Centrocampista", plurale: "centrocampisti", breve: "CEN", emoji: "🎽" },
    A: { nome: "Attaccante", plurale: "attaccanti", breve: "ATT", emoji: "⚽" }
  };
  // Chi nessuno vuole torna in fondo al mazzo e intanto escono gli altri: MAI a caso al primo giro (magari aspetti quello dopo).
  // Solo quando TUTTI i calciatori rimasti di quel ruolo sono stati rifiutati 2 volte, quello che esce va a caso, per 1 credito,
  // a uno di quelli che ne hanno ancora bisogno (se no l'asta non finirebbe mai). Prima c'è l'avviso "ultima chiamata".
  var RIFIUTI_MAX = 2;
  function rifiutatiTutti(mazzo, ruolo) {
    var l = mazzo.filter(function (c) { return c.ruolo === ruolo; });
    return l.length > 0 && l.every(function (c) { return (c.rifiuti || 0) >= RIFIUTI_MAX; });
  }
  function ultimaChiamata(mazzo, carta) {   // se nessuno prende questo, la prossima volta decide il caso
    return (carta.rifiuti || 0) + 1 >= RIFIUTI_MAX && mazzo.every(function (c) { return c === carta || c.ruolo !== carta.ruolo || (c.rifiuti || 0) >= RIFIUTI_MAX; });
  }
  function avvisoFanta(duello, ultima, ruolo) {
    if (duello && ultima) return "⚠️ Ultimo duello e ultima chiamata: se nessuno lo prende, decide il caso!";
    if (duello) return "⚠️ Ultimo duello: chi NON se lo aggiudica si accolla l'altro rimasto!";
    if (ultima) return "⚠️ Ultima chiamata: se nessuno lo prende, i " + ((FANTA_RUOLI[ruolo] || {}).plurale || "calciatori") + " rimasti andranno a caso a chi ne ha bisogno";
    return "";
  }

  function splitCalc(s) {
    var m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(String(s || ""));
    return m ? { nome: m[1].trim(), squadra: m[2].trim() } : { nome: String(s || ""), squadra: "" };
  }
  function slotVuoti(g) { var v = 0; FANTA_ORD.forEach(function (r) { v += FANTA_SLOT[r] - (g.conta[r] || 0); }); return v; }
  function maxFanta(g) { return g.crediti - (slotVuoti(g) - 1); }   // tiene 1 credito per ogni slot che resta
  function ruoloPieno(g, r) { return (g.conta[r] || 0) >= FANTA_SLOT[r]; }
  function ordinaRosa(kit) { return kit.slice().sort(function (a, b) { return FANTA_ORD.indexOf(a.ruolo) - FANTA_ORD.indexOf(b.ruolo); }); }

  // pesca N calciatori di un ruolo mescolando le fasce (A/B/C) di nascosto
  function pescaRuolo(dbRuolo, n, ruolo) {
    var id = "fanta_" + ruolo, visti = elencoVisti(id);
    function fresco(lista) {
      var nuove = [], viste = [];
      (lista || []).forEach(function (s) { var c = splitCalc(s); (visti.indexOf(c.nome) < 0 ? nuove : viste).push(c); });
      return mischia(nuove).concat(mischia(viste));
    }
    var pool = { A: fresco(dbRuolo.A), B: fresco(dbRuolo.B), C: fresco(dbRuolo.C) };
    var q = { A: Math.max(1, Math.floor(n / 3)), C: Math.max(1, Math.floor(n / 3)) };
    q.B = n - q.A - q.C;
    if (q.B < 0) { q.B = 0; q.A = Math.min(q.A, n); q.C = n - q.A; }
    var out = [];
    ["A", "B", "C"].forEach(function (tk) {
      for (var i = 0; i < q[tk] && pool[tk].length; i++) {
        var c = pool[tk].shift(); out.push({ nome: c.nome, squadra: c.squadra, ruolo: ruolo, tier: tk });
      }
    });
    var giro = 0;
    while (out.length < n && giro < 300) {
      var t2 = ["B", "C", "A"][giro % 3];
      if (pool[t2].length) { var c2 = pool[t2].shift(); out.push({ nome: c2.nome, squadra: c2.squadra, ruolo: ruolo, tier: t2 }); }
      giro++;
    }
    segnaVisti(id, out.map(function (c) { return c.nome; }));
    return out;
  }

  // il mazzo: i calciatori escono in un ordine TUTTO a caso (forti e scarsi mescolati, nessun ordine nascosto)
  function costruisciMazzoFanta(n) {
    var db = window.SG_FANTA_CALCIATORI || {};
    var need = { P: n, D: n, C: 2 * n, A: n }, tutti = [];
    FANTA_ORD.forEach(function (r) {
      if (!db[r]) return;
      tutti = tutti.concat(pescaRuolo(db[r], need[r], r));
    });
    return mischia(tutti);
  }

  function assegnaFanta(g, carta, prezzo) {
    g.crediti -= prezzo; g.kit.push(carta); g.conta[carta.ruolo] = (g.conta[carta.ruolo] || 0) + 1;
  }

  // ---------- SINGOLO TELEFONO ----------
  function avviaFanta(t) {
    var st = {
      formato: "fanta", sessione: nuovaSessione(), asta: null, giriVuoti: 0,
      giocatori: t.giocatori.map(function (n) { return { nome: n, crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0 }; })
    };
    st.mazzo = costruisciMazzoFanta(st.giocatori.length);
    introFanta(t, st);
  }

  function introFanta(t, st) {
    var el = t.el; FX.round();
    var s = t.schermata({});
    s._contenuto.appendChild(el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:12px" }, [
      el("div", { style: "font-size:4rem;line-height:1", text: "⚽" }),
      el("div", { class: "as-round" }, [
        el("div", { class: "n", text: "Mini asta Fantacalcio" }),
        el("div", { class: "t", text: "Costruisci la rosa" })
      ]),
      el("p", { class: "as-msg", text: "Ognuno parte con " + FANTA_BUDGET + " 💰. Rosa da 5: 1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante." }),
      el("p", { class: "as-msg", text: "I calciatori escono uno alla volta dal mazzo. Chi ha quel ruolo già pieno non punta. Se nessuno offre, la carta torna in fondo al mazzo e ripasserà: decide il caso solo se tutti quelli rimasti di un ruolo vengono rifiutati 2 volte." })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Comincia l'asta ▶", onclick: function () { prossimaFanta(t, st); } }));
    t.mostra(s);
  }

  function eleggibiliFanta(st, ruolo) {
    var out = []; st.giocatori.forEach(function (g, i) { if (!ruoloPieno(g, ruolo)) out.push(i); }); return out;
  }

  function prossimaFanta(t, st) {
    if (st.finita) return;
    if (!st.mazzo.length) return finePartita(t, st);   // finito il mazzo: si scoprono i valori delle rose
    var carta = st.mazzo[0], elegg = eleggibiliFanta(st, carta.ruolo);
    if (!elegg.length) { st.mazzo.shift(); return prossimaFanta(t, st); }        // carta di troppo: la salto
    st.nCarta = (st.nCarta || 0) + 1;
    if (elegg.length === 1 || rifiutatiTutti(st.mazzo, carta.ruolo)) {           // uno solo ne ha bisogno, o tutti quelli del ruolo rifiutati 2 volte: d'ufficio a 1
      var i = elegg[Math.floor(Math.random() * elegg.length)]; st.mazzo.shift(); assegnaFanta(st.giocatori[i], carta, 1);
      st.giriVuoti = 0; FX.aggiudicato();
      return esitoFanta(t, st, i, carta, 1, "forzata", elegg.length === 1 ? "unico" : "ufficio");
    }
    st.asta = { carta: carta, ruolo: carta.ruolo, offerta: 1, leader: null, passati: {}, bar: null };
    tempoAsta(st.asta, function () { scadeFanta(t, st); }, FANTA_VUOTO_MS);   // finché nessuno offre, il tempo è più corto
    disegnaAstaFanta(t, st);
  }

  // (stesso telefono) lo stadio: tocchi il tuo avatar per offrire; il campetto mostra la squadra di chi ha appena offerto
  function disegnaAstaFanta(t, st, esito) {
    var a = st.asta, carta = a ? a.carta : esito.carta, ru = FANTA_RUOLI[carta.ruolo] || {};
    var prezzo = a ? (a.leader === null ? a.offerta : a.offerta + 1) : 0;
    var eleggN = eleggibiliFanta(st, carta.ruolo).length, carteRuolo = st.mazzo.filter(function (c) { return c.ruolo === carta.ruolo; }).length;
    var persone = st.giocatori.map(function (g, i) {
      var pieno = !!a && ruoloPieno(g, a.ruolo), pass = !!a && !!a.passati[i];
      return { id: i, nome: g.nome, omino: g.omino || null, num: i + 1, crediti: g.crediti, kit: g.kit, stato: pieno ? "fuori" : pass ? "passato" : "gara",
        nota: pieno ? notaPieno(a.ruolo) : pass ? "ha passato" : g.crediti + " 💰", puo: !!a && !pieno && !pass && a.leader !== i && maxFanta(g) >= prezzo };
    });
    stadio(t, { chiave: "f|" + st.sessione, fase: a ? "asta" : "esito",
      info: (a ? ru.nome + " all'asta · " : esito.tipo === "accollo" ? "Nessuno lo vuole · " : "Aggiudicato! · ") + postiPresi(st.giocatori),
      carta: { nome: carta.nome, squadra: carta.squadra, ruolo: carta.ruolo }, giroCarta: st.nCarta, prezzo: a ? a.offerta : esito.prezzo, base: !!a && a.leader === null,
      leader: a ? a.leader : esito.chiId, persone: persone, io: null, giro: a ? a.giro : null, resta: a ? a.scadenza - Date.now() : 0, durata: a ? a.durata : FANTA_RILANCIO_MS, puoPassare: !!a,
      esito: esito || null,
      avviso: a ? avvisoFanta(eleggN === 2 && carteRuolo === 2, ultimaChiamata(st.mazzo, carta), carta.ruolo) : "",
      nota: !a ? "" : a.leader === null ? "Tocca il tuo avatar per prenderlo a " + a.offerta + ". Se nessuno lo vuole torna in fondo al mazzo." : "Tocca il tuo avatar per rilanciare di 1.",
      onRilancia: function (i) { rilanciaFanta(t, st, i); }, onPassa: function (i) { passaFanta(t, st, i); }, onIndietro: function () { esciAsta(t, st); },
      extra: { testo: "👕 Tutte", apri: function () { formazioni(t, st.giocatori); } } });
  }

  function rilanciaFanta(t, st, i) {
    var a = st.asta; if (!a || a.leader === i) return;   // chi ha già l'offerta più alta non rilancia contro sé stesso
    var g = st.giocatori[i];
    if (ruoloPieno(g, a.ruolo)) return;
    var prezzo = (a.leader === null) ? a.offerta : a.offerta + 1;
    if (maxFanta(g) < prezzo) return;
    a.offerta = prezzo; a.leader = i; delete a.passati[i];
    FX.rilancio();
    if (verificaFanta(t, st)) return;   // se sono già tutti passati, chiudo subito
    tempoAsta(a, function () { scadeFanta(t, st); }, FANTA_RILANCIO_MS);
    disegnaAstaFanta(t, st);
  }
  function passaFanta(t, st, i) {
    var a = st.asta; if (!a || a.leader === i) return;
    a.passati[i] = true;
    if (!verificaFanta(t, st)) disegnaAstaFanta(t, st);   // passare non fa ripartire il tempo
  }
  function verificaFanta(t, st) {
    var a = st.asta; if (!a) return true;
    // chi ha passato, o non ha i crediti per rilanciare, è fuori
    var attivi = eleggibiliFanta(st, a.ruolo).filter(function (i) { return !a.passati[i] && (i === a.leader || maxFanta(st.giocatori[i]) >= (a.leader === null ? a.offerta : a.offerta + 1)); });
    if (a.leader === null) {
      if (attivi.length === 0) { accolloFanta(t, st); return true; }   // nessuno la vuole
      return false;
    }
    var altri = attivi.filter(function (i) { return i !== a.leader; });
    if (altri.length === 0) { chiudiFanta(t, st, a.leader, a.offerta); return true; }
    return false;
  }
  function scadeFanta(t, st) {
    var a = st.asta; if (!a || st.finita) return;
    if (a.leader !== null) chiudiFanta(t, st, a.leader, a.offerta);
    else accolloFanta(t, st);
  }
  function chiudiFanta(t, st, i, prezzo) {
    var a = st.asta; if (!a) return;
    if (a.bar && a.bar._stop) a.bar._stop();
    var carta = st.mazzo.shift();
    assegnaFanta(st.giocatori[i], carta, prezzo);
    st.giocatori[i].asteVinte = (st.giocatori[i].asteVinte || 0) + 1;
    st.giriVuoti = 0; st.asta = null; FX.aggiudicato();
    esitoFanta(t, st, i, carta, prezzo, "vinta");
  }
  function accolloFanta(t, st) {
    var a = st.asta; if (a && a.bar && a.bar._stop) a.bar._stop();
    var carta = st.mazzo.shift(); carta.rifiuti = (carta.rifiuti || 0) + 1; st.mazzo.push(carta); st.giriVuoti++;   // torna in fondo: conta quante volte è stato rifiutato
    st.asta = null;
    esitoFanta(t, st, null, carta, 0, "accollo");
  }
  // l'esito resta nello stadio: timbro sul maxischermo, la maglia che vola nel campetto; poi da solo il prossimo calciatore
  function esitoFanta(t, st, chi, carta, prezzo, tipo, motivo) {
    if (st.finita) return;
    st.nEsiti = (st.nEsiti || 0) + 1;
    disegnaAstaFanta(t, st, { n: st.nEsiti, tipo: tipo, motivo: motivo || "", chiId: chi, chiNome: chi != null ? st.giocatori[chi].nome : "", carta: carta, prezzo: prezzo });
    st.pausa = setTimeout(function () { prossimaFanta(t, st); }, tipo === "accollo" ? 2300 : 3100);
  }

  // ---------- ONLINE — L'HOST ----------
  var ESITO_MS = 3100, ACCOLLO_MS = 2300;   // quanto resta a schermo l'esito prima del prossimo calciatore
  function hostFanta(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var IO = t.mioId || "host";   // io che tengo la partita ("host", o l'amico che ha preso il posto dell'host)
    var st = {
      formato: "fanta", crediti: FANTA_BUDGET, sessione: null, mazzo: [], asta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, codice: "…", scadenza: null, _to: null, giriVuoti: 0, giro: 0, nCarta: 0, nEsiti: 0,
      giocatori: [{ id: IO, nome: (t.giocatori && t.giocatori[0]) || "Host", crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0, omino: t.mioOmino ? t.mioOmino() : null }]
    };
    // la partita di prima (l'host ha ricaricato: t.ripresa): stesse rose, stessi crediti, stesso mazzo (vedi riprendi)
    var R0 = prendiRipresa(t, "fanta"), ripresa = !!R0, attesi = {}, tAttesi = null;
    if (ripresa) {
      ripristina(st, R0);
      st.giocatori.forEach(function (g) { if (g.id !== IO && !g.via) attesi[g.id] = 1; });
    }
    var TM = timerHost(st, function () { return !cb._uscito && !st.morto; });   // (al risveglio del telefono recupera i tempi scaduti)
    function stopTo() { TM.ferma(); }
    // "⚙️ Regole" in saletta: se torni ai Temi classici cambia motore (stessa stanza, stessi amici)
    t.onRegole = function (im) { if (!st.iniziata && (im.formato || "temi") !== "fanta") { st.morto = true; TM.smetti(); avviaAsta(t); } };
    t.onRivincita = function () { if (st.fase === "fine" && !st.morto) nuovaInLobby(); };   // la Rivincita: tutti di nuovo nella saletta

    var cbRete = {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        delete attesi[id];
        var g = perId(st, id); if (!g) return;
        if (!st.iniziata) { st.giocatori = st.giocatori.filter(function (x) { return x.id !== id; }); return bd(); }
        // a partita cominciata chi perde la connessione tiene la sua rosa: passa da solo finché non rientra
        g.via = true;
        if (st.fase === "asta" && verifica()) return;
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          delete attesi[id];   // (dopo una ripresa: è tornato)
          var gj = perId(st, id);
          if (gj) gj.via = false;   // chi rientra (stesso id) riprende il suo posto e la sua rosa
          else if (!st.iniziata && st.giocatori.length < MAX_GIOCATORI && (!t.puoSedersi || t.puoSedersi(id, m.nome)))   // (chi non è tra chi gioca guarda)
            st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0, omino: avatarOk(m.omino) });
          bd();
        }
        else if (m.t === "rilancia") rilanciaO(id, m);
        else if (m.t === "passa") passaO(id, m);
      },
      onErrore: function (e) {
        // un errore di rete passeggero: la rete si ricollega da sola e rimanda l'ultima foto, quindi la partita NON si ferma
        if (st.iniziata || st.pronta) return;
        if (e && e.type === "no-mqtt") return senzaRete(t);
        erroreSchermo(t, "Non riesco ad aprire la stanza. Controlla la connessione e riprova.");
      }
    };
    var rete = ospitaAsta(cbRete, { ripresa: ripresa });   // (con la ripresa gli amici non tornano in saletta)

    function invia() { rete.invia({ t: "vm", vm: vmFanta(st) }); ricorda(); }
    // la partita com'è adesso, per riprenderla se ricarico la pagina (in saletta niente)
    function ricorda() { if (!st.morto) t.ricorda(st.iniziata && st.fase !== "lobby" ? statoDaRicordare(st, "fanta") : null); }
    var dopoTM = TM.dopo; TM.dopo = function (fn, ms) { dopoTM(fn, ms); ricorda(); };   // (anche l'ora del prossimo passo)
    function bd() { invia(); disegna(); }
    // la ripresa: rose e crediti restano; il calciatore all'asta riparte da capo (nessuno l'ha ancora pagato),
    // l'esito resta il tempo che gli restava (almeno 5 secondi)
    function riprendi() {
      tAttesi = setTimeout(function () { Object.keys(attesi).forEach(function (id) { cbRete.onAddio(id); }); }, 10000);
      var f = st.fase, ms = Math.max(5000, ((t.ripresa.ora(R0.toAt) || 0) - Date.now()));
      st.scadenza = null;
      if (f === "esito") { bd(); return TM.dopo(prossima, ms); }
      if (f === "asta" && st.mazzo.length) {
        var carta = st.mazzo[0];
        st.nCarta++; st.esito = null;
        st.asta = { carta: carta, ruolo: carta.ruolo, offerta: 1, leader: null, passati: {} };
        if (!verifica()) riparti(FANTA_VUOTO_MS);
        return;
      }
      if (f === "asta") return prossima();
      bd();   // (la classifica: si resta lì)
    }

    function comincia() {
      if (st.iniziata || st.giocatori.length < 2) return;
      st.iniziata = true; st.sessione = nuovaSessione(); st.mazzo = costruisciMazzoFanta(st.giocatori.length); FX.round(); prossima();
    }
    function prossima() {
      stopTo();
      if (!st.mazzo.length) return fine();
      var carta = st.mazzo[0];
      var elegg = st.giocatori.filter(function (g) { return !ruoloPieno(g, carta.ruolo); });
      if (!elegg.length) { st.mazzo.shift(); return prossima(); }
      st.nCarta++;
      // uno solo ne ha bisogno, o tutti i rimasti del ruolo sono stati rifiutati 2 volte: d'ufficio a 1 (a caso tra chi ne ha bisogno)
      if (elegg.length === 1 || rifiutatiTutti(st.mazzo, carta.ruolo)) {
        var g = elegg[Math.floor(Math.random() * elegg.length)]; st.mazzo.shift(); assegnaFanta(g, carta, 1); st.giriVuoti = 0;
        FX.aggiudicato(); return esito({ chiId: g.id, chiNome: g.nome, carta: carta, prezzo: 1, tipo: "forzata", motivo: elegg.length === 1 ? "unico" : "ufficio" });
      }
      st.asta = { carta: carta, ruolo: carta.ruolo, offerta: 1, leader: null, passati: {} };
      st.esito = null; st.fase = "asta";
      if (!verifica()) riparti(FANTA_VUOTO_MS);   // (se nessuno può offrire si chiude subito; finché nessuno offre il tempo è più corto)
    }
    function riparti(ms) { st.giro++; st.durata = ms; st.scadenza = Date.now() + ms; TM.dopo(scade, ms); bd(); }
    function scade() { if (st.fase !== "asta" || !st.asta) return; if (st.asta.leader !== null) chiudi(); else accollo(); }
    function tardi(id) {   // chi ha offerto quando il prezzo era già cambiato: glielo dico (non paga niente)
      if (id === IO) { cb._tardi = Date.now(); return disegna(); }
      rete.inviaVeloce({ t: "tardi", a: id, prezzo: st.asta ? st.asta.offerta : 0 });
    }
    // m: { n (quale calciatore), prezzo (quello che ha visto) }: un'offerta arrivata in ritardo o doppia non conta
    function rilanciaO(id, m) {
      if (st.fase !== "asta" || !st.asta || !m || m.n !== st.nCarta) return;
      var g = perId(st, id); if (!g || ruoloPieno(g, st.asta.ruolo) || st.asta.leader === id) return;   // non si rilancia contro sé stessi
      var prezzo = (st.asta.leader === null) ? st.asta.offerta : st.asta.offerta + 1;
      if (m.prezzo !== prezzo) return tardi(id);
      if (maxFanta(g) < prezzo) return;
      st.asta.offerta = prezzo; st.asta.leader = id; delete st.asta.passati[id];
      FX.rilancio(id === IO);
      if (!verifica()) riparti(FANTA_RILANCIO_MS);   // se nessun altro può più offrire, aggiudico subito
    }
    function passaO(id, m) {
      if (st.fase !== "asta" || !st.asta || !m || m.n !== st.nCarta || st.asta.leader === id) return;
      var g = perId(st, id); if (!g || ruoloPieno(g, st.asta.ruolo)) return;
      st.asta.passati[id] = true;
      if (!verifica()) bd();   // passare non fa ripartire il tempo
    }
    function verifica() {   // si chiude subito se non resta nessuno che possa offrire (chi non c'è o non ha i crediti conta come passato)
      var a = st.asta; if (!a) return false;
      var prezzo = a.leader === null ? a.offerta : a.offerta + 1;
      var attivi = st.giocatori.filter(function (g) { return !ruoloPieno(g, a.ruolo) && !a.passati[g.id] && (g.id === a.leader || (!g.via && maxFanta(g) >= prezzo)); });
      if (a.leader === null) { if (attivi.length === 0) { accollo(); return true; } return false; }
      if (!attivi.some(function (g) { return g.id !== a.leader; })) { chiudi(); return true; }
      return false;
    }
    function chiudi() {
      if (st.fase !== "asta" || !st.asta) return;
      stopTo();
      var a = st.asta; if (a.leader === null) return accollo();
      var g = perId(st, a.leader); if (!g) { st.asta = null; return prossima(); }
      var carta = st.mazzo.shift(); assegnaFanta(g, carta, a.offerta); g.asteVinte = (g.asteVinte || 0) + 1; st.giriVuoti = 0;
      FX.aggiudicato(); esito({ chiId: g.id, chiNome: g.nome, carta: carta, prezzo: a.offerta, tipo: "vinta" });
    }
    function accollo() {
      stopTo();
      var carta = st.mazzo.shift(); carta.rifiuti = (carta.rifiuti || 0) + 1; st.mazzo.push(carta); st.giriVuoti++;   // torna in fondo: conta quante volte è stato rifiutato
      esito({ chiId: null, chiNome: "", carta: carta, prezzo: 0, tipo: "accollo" });
    }
    function esito(e) {   // l'esito resta a schermo un attimo (la maglia vola nel campetto), poi da solo il prossimo calciatore
      e.n = ++st.nEsiti; e.nCarta = st.nCarta;
      st.esito = e; st.asta = null; st.scadenza = null; st.fase = "esito";
      bd();
      TM.dopo(prossima, e.tipo === "accollo" ? ACCOLLO_MS : ESITO_MS);
    }
    function fine() {   // finito il mazzo: la classifica per valore delle rose (le quotazioni si scoprono solo ora)
      st.asta = null; st.esito = null; st.scadenza = null;
      st.classifica = classificaFanta(st.giocatori);
      st.fase = "fine"; bd();
      if (t.risultato) t.risultato(st.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));   // per il torneo online
    }
    function nuovaInLobby() {
      stopTo();
      st.iniziata = false; st.fase = "lobby"; st.mazzo = []; st.asta = null; st.esito = null; st.classifica = null; st.scadenza = null; st.giriVuoti = 0;
      st.giocatori = st.giocatori.filter(function (g) { return !g.via; });   // chi non c'è più esce dalla stanza
      st.giocatori.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });   // (chi tiene la partita è il primo: in saletta ha la corona)
      st.giocatori.forEach(function (g) { g.crediti = FANTA_BUDGET; g.kit = []; g.conta = { P: 0, D: 0, C: 0, A: 0 }; g.stelle = 0; g.asteVinte = 0; });
      bd();
    }
    var cb = {
      myId: IO, sonoHost: true,
      onComincia: comincia, onNuova: nuovaInLobby,
      onRilancia: function (x) { rilanciaO(IO, x); }, onPassa: function (x) { passaO(IO, x); },
      onEsci: function () { stopTo(); clearTimeout(tAttesi); t.ricorda(null); TM.smetti(); cb._uscito = true; fermaTutto(); rete.chiudi(); t.esci(); }
    };
    function disegna() { if (!st.morto && !cb._uscito) disegnaFantaVM(t, vmFanta(st), cb); }
    if (ripresa) riprendi(); else disegna();
  }

  function vmFanta(st) {
    var a = st.asta, e = st.esito;
    return {
      formato: "fanta", fase: st.fase, codice: st.codice, sessione: st.sessione,
      giocatori: st.giocatori.map(function (g) {
        return { id: g.id, nome: g.nome, omino: g.omino || null, crediti: g.crediti, conta: { P: g.conta.P, D: g.conta.D, C: g.conta.C, A: g.conta.A },
          vuoti: slotVuoti(g), max: maxFanta(g), asteVinte: g.asteVinte || 0, via: !!g.via, creditiSpesi: FANTA_BUDGET - g.crediti, stelle: 0,
          kit: g.kit.map(function (c) { return { nome: c.nome, squadra: c.squadra, ruolo: c.ruolo }; }) };   // (i valori restano nascosti fino alla fine)
      }),
      asta: a ? {
        carta: { nome: a.carta.nome, squadra: a.carta.squadra, ruolo: a.carta.ruolo }, nCarta: st.nCarta,
        ruolo: a.ruolo, offerta: a.offerta, leaderId: a.leader, leaderNome: a.leader ? nomeDi(st, a.leader) : "",
        passati: Object.keys(a.passati || {}), giro: st.giro, durata: st.durata || FANTA_RILANCIO_MS, resta: st.scadenza ? st.scadenza - Date.now() : 0,   // il tempo che resta (non l'ora: gli orologi dei telefoni non sono uguali)
        ultimaChiamata: ultimaChiamata(st.mazzo, a.carta),
        ultimoDuello: (st.giocatori.filter(function (g) { return !ruoloPieno(g, a.ruolo); }).length === 2 &&
          st.mazzo.filter(function (c) { return c.ruolo === a.ruolo; }).length === 2)
      } : null,
      esito: e ? { n: e.n, nCarta: e.nCarta, tipo: e.tipo, motivo: e.motivo || "", chiId: e.chiId, chiNome: e.chiNome, prezzo: e.prezzo, carta: { nome: e.carta.nome, squadra: e.carta.squadra, ruolo: e.carta.ruolo, rifiuti: e.carta.rifiuti || 0 } } : null,
      restano: st.mazzo ? st.mazzo.length : 0, presi: postiPresi(st.giocatori),
      classifica: st.classifica || null
    };
  }

  // ---------- DISEGNO CONDIVISO FANTACALCIO (host e ospiti) ----------
  function disegnaFantaVM(t, vm, cb) {
    if (vm.fase === "lobby") { fermaConta(STADIO); STADIO = null; return lobbyAsta(t, vm, cb); }
    if (vm.fase === "fine") {
      salvaTrofeiAsta(t, vm, cb.myId, true);
      return rivelaFanta(t, vm.classifica || [], { chiave: "ro|" + (vm.codice || "") + "|" + vm.sessione,
        onEsci: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); },
        bottoni: function () {
          var el = t.el, fa = t.faccine ? t.faccine() : null;   // (le faccine della saletta, sul podio)
          fa = fa ? el("div", { style: "width:100%;display:flex;justify-content:center" }, [ fa ]) : null;
          // i tasti di fine uguali per tutti li mette il core (in una riga a tutta larghezza); se no quelli di sempre
          var riga = el("div", { style: "width:100%" });
          if (t.tastiFine && t.tastiFine(riga, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) return [ fa, riga ];
          return [ fa ].concat(cb.sonoHost ? [ el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }), el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }) ]
            : [ el("p", { class: "sa-nota", text: cb._chiusa ? "🚪 L'host ha chiuso la stanza" : "In attesa dell'host per un'altra partita…" }), el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }) ]);
        } });
    }
    stadioVM(t, vm, cb);   // asta ed esito: lo stadio
  }

  SG.registra(gioco);
})();
