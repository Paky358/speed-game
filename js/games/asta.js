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
  var AUTO_ROUND_TIPO_MS = 7500, AUTO_BUSTE_MS = 6500;   // un round speciale da spiegare; l'esito con le buste aperte una alla volta
  // «🧨 La carta maledetta» (regola dell'host, solo nell'asta a temi): una volta a partita, in un round a caso tra il 2° e il 3°,
  // esce una carta che nessuno vuole. A turno si paga per scansarla o ce la si prende: il tempo per decidere, poi te la prendi.
  var MAL_MS = 8000, MAL_MS_TEL = 10000, MAL_MS_FORZATO = 3000;   // online / sullo stesso telefono / chi non ha più crediti per pagare
  var AUTO_MAL_MS = 6000;   // l'esito della carta maledetta resta un attimo, poi si va avanti da soli
  var MALUS = 0.5;          // chi ce l'ha nel kit perde mezza stella nel voto finale
  // il voto finale: esce la carta-scenario ("Arrivano gli zombie: chi sopravvive?") e ognuno dà la sua ⭐ al kit migliore
  // (non il suo) con un tocco. Online ha un tempo per tutti; chi non vota non dà la stella.
  // (il voto a un tocco: 20 secondi fino a 4 giocatori, 3 in più per ognuno dopo, al massimo 40)
  function votoMs(n) { return Math.min(40000, 20000 + Math.max(0, n - 4) * 3000); }
  // rilanci a salto: nei temi +1 e +3, nel fantacalcio +1, +2 e +5 (un salto grosso fa parlare il banditore)
  var SALTI_TEMI = [1, 3], SALTI_FANTA = [1, 2, 5];
  // i 4 round dei temi, uno diverso dall'altro (come in Modern Art): si spengono nel ⚙️ con «🔨 Tutti normali»
  var TIPI_ROUND = ["normale", "busta", "doppio", "pacco"];
  var INFO_TIPO = {
    normale: { icona: "🔨", nome: "Asta normale", spiega: "Si rilancia a voce alta: allo scadere del tempo vince chi offre di più." },
    busta: { icona: "✉️", nome: "Busta chiusa", spiega: "Ognuno scrive in segreto quanto offre: si aprono le buste insieme e vince l'offerta più alta (a pari offerta, chi ha chiuso prima)." },
    doppio: { icona: "📦", nome: "Lotto doppio", spiega: "Un lotto ha 2 carte insieme: chi lo vince se le porta a casa tutte e due." },
    pacco: { icona: "🎁", nome: "Pacco a sorpresa", spiega: "Una carta è coperta: nessuno sa cosa c'è dentro finché qualcuno non la vince." }
  };
  var BUSTA_MS = 15000;   // (online) busta chiusa: 15 secondi per scrivere l'offerta (sullo stesso telefono si va a turno passando il telefono)
  var VALORE_FASCIA = { A: 3, B: 2, C: 1 };   // a pari stelle vince il kit che vale di più (le fasce svelate), poi chi ha più crediti
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
    ".as-top{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 2px 8px;margin:0 -2px 10px;}",
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
    ".schermata.as-fissa>.contenuto{min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}",
    // (online) chi si aggiudica il lotto su un telefono basso: tutto in uno schermo, senza scorrere (il 🔨 grande sta già nel titolo)
    "@media (max-height:760px){.as-esito .as-martello{display:none;}.as-esito .as-big{padding:10px 14px 12px;margin-bottom:6px;}.as-esito .as-big .em{width:60px;height:60px;font-size:2.1rem;margin:0 auto 4px;}.as-esito .as-big .nm{font-size:1.18rem;}.as-esito .as-testa-round>:not(:first-child),.as-esito .as-buste-tit{display:none;}.as-esito .as-buste .r{padding-top:3px;padding-bottom:3px;}.as-esito .as-buste~.as-big .em{width:44px;height:44px;font-size:1.6rem;}}",
    // chi guarda col link: in basso la targhetta del core "👀 Guardi · 😂 · ✕" (la schermata le lascia il posto)
    ".schermata.as-targa,.schermata.sa-sala.as-targa{padding-bottom:calc(60px + env(safe-area-inset-bottom));}",
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
    // 🧨 la carta maledetta: sempre col bordo nero (nel kit, nel voto, nelle fasce svelate) e il badge 🧨 al posto della fascia
    ".tier-M{background:#0b0b0f;color:#fff;box-shadow:0 0 0 1px rgba(255,255,255,.35);font-size:.8rem;}",
    ".as-kit .riga.maled,.as-rose-riga.maled{border:2px solid #000;border-radius:9px;background:linear-gradient(135deg,#3b3b46,#202027);box-shadow:0 0 0 1px rgba(255,255,255,.28);padding-left:6px;padding-right:4px;margin:2px 0;}",
    ".as-kits .as-kit .riga.maled{grid-column:1/-1;}",
    ".as-mal-in{display:inline-block;border:2px solid #000;border-radius:7px;padding:0 4px;background:#2b2b33;box-shadow:0 0 0 1px rgba(255,255,255,.28);color:var(--testo);}",
    ".as-malus{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:7px;background:#0b0b0f;color:#ff8787;font-size:.72rem;font-weight:900;vertical-align:1px;box-shadow:0 0 0 1px rgba(255,255,255,.25);}",
    ".as-kv.maled{box-shadow:0 0 0 2px #000,0 0 0 3px rgba(255,255,255,.22),var(--ombra);}",
    // l'asta al contrario della carta maledetta: tutto in uno schermo (anche in 10), si aggiorna solo quello che cambia
    ".schermata.as-mal{flex:0 0 auto;height:var(--alt,100dvh);max-height:var(--alt,100dvh);min-height:0;overflow:hidden;background:radial-gradient(130% 70% at 50% 0%,#3a1020 0%,var(--sfondo) 62%);}",
    ".as-mal>.contenuto{flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;overflow:hidden;}",
    ".as-mal-testa{display:flex;align-items:center;justify-content:center;gap:8px;min-height:34px;padding:0 38px;flex:none;font-size:.78rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#ff8787;}",
    ".as-mal-carta{display:flex;align-items:center;gap:12px;background:linear-gradient(150deg,#26262e,#0b0b0f);border:3px solid #000;box-shadow:0 0 0 2px rgba(255,255,255,.3),0 10px 26px rgba(0,0,0,.5);border-radius:18px;padding:10px 12px;color:#fff;}",
    ".as-mal-carta .em{font-size:2.4rem;width:62px;height:62px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#4a4a55,#15151b);}",
    ".as-mal-carta .nm{font-size:1.12rem;font-weight:900;line-height:1.18;}",
    ".as-mal-carta .sm{font-size:.74rem;font-weight:800;color:#ff8787;margin-top:2px;}",
    ".as-mal.entra .as-mal-carta{animation:asMalEntra .7s cubic-bezier(.2,1.4,.4,1);}",
    "@keyframes asMalEntra{0%{transform:scale(1.35) rotate(-4deg);opacity:0}45%{transform:scale(.96) rotate(2deg);opacity:1}70%{transform:rotate(-1.5deg)}100%{transform:none}}",
    ".as-mal-regola{margin:0;text-align:center;font-size:.8rem;line-height:1.3;color:var(--testo-tenue);font-weight:700;}",
    ".as-mal-prezzo{text-align:center;line-height:1.1;}",
    ".as-mal-prezzo small{display:block;font-size:.72rem;font-weight:800;color:var(--testo-tenue);}",
    ".as-mal-prezzo b{font-size:1.9rem;font-weight:900;color:var(--accento);}",
    ".as-mal-tempo{position:relative;height:8px;border-radius:99px;background:var(--carta);overflow:hidden;flex:none;}",
    ".as-mal-tempo i{position:absolute;left:0;top:0;bottom:0;width:100%;transform-origin:left center;background:linear-gradient(90deg,#ff6b6b,var(--accento),var(--verde));}",
    ".as-mal-conta{height:1.3em;text-align:center;font-weight:900;font-size:1.05rem;color:#ff6b6b;}",
    ".as-mal-gente{display:grid;grid-template-columns:1fr 1fr;gap:5px;min-height:0;}",
    ".as-mal-p{display:flex;align-items:center;gap:6px;min-width:0;background:var(--carta);border:2px solid transparent;border-radius:12px;padding:5px 8px;font-size:.85rem;}",
    ".as-mal-p b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".as-mal-p span{flex:none;font-weight:800;color:var(--testo-tenue);font-size:.78rem;}",
    ".as-mal-p.ora{border-color:var(--accento);background:linear-gradient(150deg,var(--carta-2),#2a2550);}",
    ".as-mal-p.ora span{color:var(--accento);}",
    ".as-mal-p.via{opacity:.4;}",
    ".as-mal-p.mio b{color:#ffe066;}",
    ".as-mal-piede{display:flex;flex-direction:column;gap:6px;}",
    ".as-mal-piede .sa-nota{color:var(--testo);text-shadow:none;font-size:.86rem;}",
    ".as-mal-tasti{display:flex;gap:8px;}.as-mal-tasti .btn{flex:1;min-width:0;margin:0;padding-left:6px;padding-right:6px;}",
    ".as-mal-fitta .as-mal-carta{padding:6px 10px;}.as-mal-fitta .as-mal-carta .em{width:46px;height:46px;font-size:1.8rem;}.as-mal-fitta .as-mal-p{padding:3px 7px;font-size:.78rem;}",
    ".as-mal-fitta .as-mal-prezzo b{font-size:1.5rem;}.as-mal-fitta .as-mal-regola{font-size:.74rem;}",
    // l'esito della carta maledetta
    ".as-big.as-maled{background:linear-gradient(150deg,#3b3b46,#0b0b0f);color:#fff;border:3px solid #000;box-shadow:0 0 0 2px rgba(255,255,255,.3),0 12px 30px rgba(0,0,0,.5);}",
    ".as-big.as-maled{padding:8px 12px 10px;margin-bottom:6px;}.as-big.as-maled .em{width:54px;height:54px;font-size:2rem;margin-bottom:4px;background:radial-gradient(circle at 35% 30%,#55555f,#15151b);}.as-big.as-maled .nm{font-size:1.15rem;}",
    ".as-big.as-maled .as-fascia-x{color:#ff8787;opacity:1;}",
    ".as-mal-conti{display:flex;flex-direction:column;gap:3px;font-size:.88rem;font-weight:700;text-align:center;}",
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
    ".sa-testa,.sa-pannello,.st-board,.sa-avviso,.sa-tempo,.sa-platea,.st-palco,.st-griglia,.st-panchina,.st-podio,.sa-basso,.sa-piede{position:relative;z-index:2;}",
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
    // (il fumetto a lato, quando sopra la testa coprirebbe un giocatore: la punta guarda a sinistra, verso il banditore)
    ".sa-bolla.lato{left:80%;bottom:52%;max-width:calc(100vw - 100% - 16px);}.sa-bolla.lato::after{left:-7px;bottom:10px;border:7px solid transparent;border-right-color:#fff;border-left:0;}",
    ".sa-bolla.lato.conta::after{border-top-color:transparent;border-right-color:#c92a2a;}",
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
    // (telefoni bassi) la scelta della carta sta tutta in uno schermo anche col 🎁 pacco o il 📦 lotto doppio
    "@media (max-height:700px){.as-griglia.tante:not(.molte) .as-carta{padding:7px 6px;gap:4px;}.as-griglia.tante:not(.molte) .as-carta .em{width:42px;height:42px;font-size:1.5rem;}}",
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
    ".sa-campo{position:relative;height:178px;border-radius:8px;background:repeating-linear-gradient(180deg,#3fa34d 0 15px,#37944a 15px 30px);box-shadow:inset 0 0 0 2px rgba(255,255,255,.6);}",
    ".sa-gioc{position:absolute;display:flex;flex-direction:column;align-items:center;width:30%;transform:translate(-50%,-50%);}",
    ".sa-maglia{width:30px;height:30px;font-style:normal;font-size:8px;font-weight:900;color:#fff;display:flex;align-items:center;justify-content:center;}",
    ".sa-gioc.vuoto .sa-maglia{border:2px dashed rgba(255,255,255,.75);border-radius:50%;width:24px;height:24px;}",
    ".sa-gioc .sa-gioc-nome{padding:0 4px;border-radius:5px;text-shadow:none;box-shadow:0 1px 3px rgba(0,0,0,.4);}.sa-gioc span{font-size:9px;font-weight:800;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    // ---- lo stadio: maxischermo, campo grande con l'allenatore, panchina ----
    ".schermata.st-stadio{background:linear-gradient(180deg,#06112b 0%,#0c2150 30%,#1a2f3e 52%,#1d5a2b 60%,#226b31 100%);}",
    ".st-board{flex:none;margin:4px 12px 0;padding:5px;border-radius:12px;background:linear-gradient(180deg,#444a54,#1d2026);box-shadow:0 0 0 2px #0b0c0f,0 14px 30px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.2);}",
    ".st-schermo{position:relative;overflow:hidden;border-radius:7px;height:clamp(92px,calc(var(--alt,100dvh)*.155),146px);background:#0c1424;}",
    ".st-colori{position:absolute;inset:0;}",
    ".st-led{position:absolute;inset:0;pointer-events:none;z-index:3;background-image:radial-gradient(circle,rgba(0,0,0,0) 52%,rgba(0,0,0,.26) 56%);background-size:4px 4px;}",
    ".st-dentro{position:absolute;z-index:2;left:0;right:0;top:0;bottom:24px;display:flex;align-items:center;gap:8px;padding:6px 10px;transition:opacity .2s;}",
    ".st-schermo.vuoto .st-dentro{opacity:0;}",
    ".st-schermo.entra .st-dentro{animation:stEntra .5s cubic-bezier(.2,1.3,.4,1);}",
    "@keyframes stEntra{from{transform:translateX(26%);opacity:0}to{transform:none;opacity:1}}",
    ".st-magliabox{flex:0 0 27%;height:100%;display:flex;align-items:center;justify-content:center;}",
    ".st-maglia{max-height:100%;max-width:100%;}",
    ".st-dati{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;padding:4px 8px;border-radius:8px;background:rgba(0,0,0,.34);text-shadow:0 2px 4px rgba(0,0,0,.7);}",
    ".st-tiri{display:flex;align-items:center;gap:6px;min-width:0;}.st-dati .st-riga{display:flex;flex-wrap:nowrap;align-items:center;gap:6px;min-width:0;margin-top:0;}",   // (st-riga c'è anche nelle statistiche dell'app, che la mandano a capo: qui sempre su una riga)
    ".st-ruolo{flex:none;font-size:.62rem;font-weight:900;letter-spacing:.04em;padding:3px 7px;border-radius:6px;color:#0d1230;text-shadow:none;}",
    ".st-ruolo-classifica{background:#ffd43b;color:#3a2200;}",
    ".st-rig,.st-pun{flex:none;font-size:.62rem;font-weight:900;letter-spacing:.03em;padding:2px 6px;border-radius:6px;background:#ffd43b;color:#3a2200;text-shadow:none;white-space:nowrap;}.st-rig:empty,.st-pun:empty{display:none;}.st-pun{background:#a5d8ff;color:#06263f;}.st-ang{background:#b2f2bb;color:#0b3d17;}.st-rig.stretta,.st-pun.stretta{font-size:.54rem;padding:2px 4px;letter-spacing:0;}",
    ".st-squadra{min-width:0;font-size:.76rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-nome{font-size:clamp(1.2rem,6vw,1.75rem);font-weight:900;line-height:1.05;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-prezzo{display:flex;align-items:baseline;gap:8px;min-width:0;}",
    ".st-prezzo b{font-size:clamp(1.45rem,7vw,2rem);color:#ffe066;line-height:1;white-space:nowrap;}",
    ".st-prezzo span{font-size:.72rem;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-contatore b{font-size:clamp(2rem,10vw,2.9rem);font-variant-numeric:tabular-nums;}",
    ".st-ticker{position:absolute;z-index:2;left:0;right:0;bottom:0;height:24px;line-height:24px;padding:0 10px;background:rgba(0,0,0,.6);color:#ffd43b;font-weight:900;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.02em;}",
    ".st-ticker.via{animation:stTicker .35s ease-out;}",
    "@keyframes stTicker{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}",
    ".st-ticker.conta{color:#fff;background:#c92a2a;font-size:.95rem;text-align:center;}",
    ".st-board{position:relative;}.st-stadio.ultimi .st-board::after{content:\"\";position:absolute;inset:0;border-radius:12px;box-shadow:0 0 0 3px #ff6b6b;pointer-events:none;animation:stBordo .5s ease-in-out infinite alternate;}",   // (il bordo rosso degli ultimi secondi: si accende e si spegne con la sola trasparenza, senza ridisegnare il maxischermo)
    "@keyframes stBordo{from{opacity:0}to{opacity:1}}",
    // 📺 il maxischermo con le scritte pulite (29 ott 2026, il proprietario: «le scritte sono pixelose, a quadretti come un tabellone a led…
    // le voglio normali e pulite, col carattere dell'app, ben leggibili anche sul telefono piccolo»): i puntini del led restano solo sul fondo
    // coi colori della squadra, SOTTO le scritte; sopra un riflesso leggero di vetro. Calciatore, squadra, ruolo, 🎯 🦶 🚩, prezzo e tempo
    ".st-led{z-index:1;opacity:.7;}",
    ".st-schermo::before{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,0) 42%);}",
    ".st-schermo,.st-schermo b,.st-schermo span,.st-schermo div{font-family:var(--o-tit);}",
    ".st-dati{background:rgba(5,9,22,.52);text-shadow:0 1px 2px rgba(0,0,0,.6);}",
    ".st-nome{font-weight:800;letter-spacing:-.01em;}.st-squadra{font-size:.8rem;font-weight:800;letter-spacing:.06em;}",
    ".st-ruolo{font-size:.68rem;font-weight:800;letter-spacing:.03em;}.st-rig,.st-pun{font-size:.68rem;font-weight:800;letter-spacing:.02em;}",
    ".st-rig.stretta,.st-pun.stretta{font-size:.62rem;padding:2px 5px;letter-spacing:0;}",
    ".st-prezzo b{font-weight:800;}.st-prezzo span{font-size:.78rem;font-weight:700;}.st-ticker{font-weight:800;font-size:.82rem;letter-spacing:.01em;}",
    // il palco (la classifica finale delle rose): il campo grande con la formazione e, a bordo campo, l'avatar in piedi (l'allenatore).
    // Le misure delle maglie (--mg) e dell'allenatore (--all) le mette misuraPalco, dalla grandezza vera del campo
    ".st-palco{flex:1 1 0;min-height:calc(var(--alt,100dvh)*.37);display:flex;flex-direction:column;margin:6px 8px 0;}",
    ".st-campo-testa{flex:none;display:flex;align-items:center;gap:6px;margin-bottom:4px;}",
    ".st-freccia{flex:none;border:0;width:36px;height:28px;border-radius:14px;background:rgba(255,255,255,.92);color:#16351f;font-weight:900;font-size:18px;line-height:1;font-family:inherit;}",
    ".st-campo-nome{flex:1;min-width:0;text-align:center;font-weight:900;font-size:.86rem;text-shadow:0 1px 3px rgba(0,0,0,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-campo-wrap{position:relative;flex:1;min-height:0;}",
    ".st-campo{position:absolute;inset:0;border-radius:12px;background:repeating-linear-gradient(180deg,#3d9b49 0 18px,#358a41 18px 36px);box-shadow:inset 0 0 0 2px rgba(255,255,255,.7),0 10px 24px rgba(0,0,0,.45);overflow:hidden;}",
    ".st-campo.dipinto{background-size:100% 100%;box-shadow:0 0 0 2px rgba(0,0,0,.35),0 10px 24px rgba(0,0,0,.45);}",
    ".st-slot{position:absolute;z-index:1;width:calc(var(--mg,52px)*1.9);transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;}",
    ".st-slot-fig{position:relative;width:var(--mg,52px);height:var(--mg,52px);}",
    ".st-slot-maglia,.st-slot-ombra{position:absolute;left:0;top:0;width:100%;height:100%;transition:opacity .2s;}",
    ".st-slot.vuoto .st-slot-maglia{opacity:0;}",
    ".st-slot-ombra{opacity:0;}.st-slot.cerca .st-slot-ombra{opacity:.5;}",   // dove andrebbe il calciatore all'asta: la sua maglia in trasparenza
    ".st-slot-vuoto{position:absolute;left:6%;top:6%;width:88%;height:88%;box-sizing:border-box;border:2px dashed rgba(255,255,255,.75);border-radius:50%;font-style:normal;font-size:calc(var(--mg,52px)*.2);font-weight:900;color:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;}",
    ".st-slot:not(.vuoto) .st-slot-vuoto{display:none;}",
    ".st-slot.cerca .st-slot-vuoto{border-color:#ffe066;color:transparent;background:rgba(255,224,102,.14);animation:stCerca .8s ease-in-out infinite alternate;}",
    "@keyframes stCerca{from{transform:scale(.92)}to{transform:scale(1.1)}}",
    // sotto la maglia il nome sui colori della sua squadra; nell'angolo quanto è stato pagato
    ".st-slot span{display:block;max-width:100%;margin-top:-1px;padding:1px 6px;border-radius:7px;border:1.5px solid rgba(255,255,255,.5);background:#2b3550;color:#fff;font-size:clamp(.56rem,calc(var(--mg,52px)*.19),.84rem);font-weight:900;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 5px rgba(0,0,0,.45);}",
    ".st-slot.vuoto span{visibility:hidden;}",
    ".st-paga{position:absolute;right:-22%;bottom:4%;padding:0 4px;border-radius:7px;background:rgba(10,14,30,.86);color:#ffe066;font-style:normal;font-weight:900;font-size:clamp(.5rem,calc(var(--mg,52px)*.17),.74rem);line-height:1.45;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.5);}",
    ".st-slot.vuoto .st-paga,.st-paga:empty{display:none;}",
    ".st-slot.arriva .st-slot-fig{animation:stArriva .45s cubic-bezier(.2,1.6,.4,1);}",
    "@keyframes stArriva{from{transform:scale(1.5)}to{transform:none}}",
    ".st-campo.cambia .st-slot:not(.vuoto) .st-slot-fig{animation:stCambia .3s ease-out;}",   // si guarda un'altra squadra: le sue maglie spuntano
    "@keyframes stCambia{from{transform:scale(.6);opacity:.3}to{transform:none;opacity:1}}",
    ".st-val{position:absolute;top:-12%;right:-24%;min-width:24px;padding:1px 5px;border-radius:9px;background:#ffd43b;color:#3a2200;font-style:normal;font-weight:900;font-size:clamp(.66rem,calc(var(--mg,52px)*.2),.9rem);text-align:center;box-shadow:0 2px 5px rgba(0,0,0,.4);opacity:0;transform:scale(.4);transition:transform .25s cubic-bezier(.2,1.6,.4,1),opacity .15s;}",
    ".st-val.su{opacity:1;transform:none;}",
    // l'allenatore: in piedi sulla linea laterale, in basso a destra; alza il cartellino col prezzo quando l'offerta più alta è sua
    ".st-mister{position:absolute;z-index:3;right:-2px;bottom:-4px;height:var(--all,40%);aspect-ratio:200/264;pointer-events:none;}",
    ".st-mister img{position:absolute;left:0;top:0;width:100%;height:100%;}",
    ".st-mister.entra{animation:stMEntra .38s cubic-bezier(.2,1.3,.4,1);}",
    "@keyframes stMEntra{from{transform:translateX(30%);opacity:0}to{transform:none;opacity:1}}",
    ".st-mister.esulta{animation:stEsulta .5s ease-out 3;}",
    "@keyframes stEsulta{0%,100%{transform:none}40%{transform:translateY(-12%)}}",
    ".st-pal{position:absolute;width:40%;aspect-ratio:1;transform:translate(-50%,-112%) rotate(8deg) scale(.3);opacity:0;transition:transform .25s cubic-bezier(.3,1.6,.5,1),opacity .15s;}",
    ".st-pal span{position:absolute;inset:0;border-radius:50%;background:#fff;border:3px solid #c92a2a;color:#c92a2a;font-weight:900;font-size:calc(var(--all,150px)*.095);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 6px rgba(0,0,0,.35);}",
    ".st-pal::after{content:'';position:absolute;left:50%;top:94%;width:10%;height:62%;margin-left:-5%;border-radius:3px;background:#8b5a2b;z-index:-1;}",
    ".st-mister.alza .st-pal{opacity:1;transform:translate(-50%,-112%) rotate(8deg) scale(1);}",
    ".st-pal.batte span{animation:stPal .3s ease-out;}",
    "@keyframes stPal{from{transform:scale(1.35)}to{transform:none}}",
    // le squadre nello stadio: 4 alla volta, ognuna nel suo riquadro (faccina, nome, crediti, il campetto); la misura delle maglie (--mg) la mette misuraGriglia
    ".st-griglia{flex:1 1 0;min-height:calc(var(--alt,100dvh)*.3);display:flex;flex-direction:column;margin:6px 6px 0;}",
    ".st-gr-carte{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6px;}.st-gr-carte.due{grid-template-rows:1fr;}.st-gr-carte.uno{grid-template-columns:1fr;grid-template-rows:1fr;}",
    ".st-sq{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;padding:4px;border-radius:12px;background:rgba(6,12,30,.8);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.14),0 6px 14px rgba(0,0,0,.4);}",
    ".st-sq-testa{flex:none;display:flex;align-items:center;gap:5px;min-width:0;padding:0 2px 4px;}",
    ".st-sq-faccia{flex:none;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.16);}",
    ".st-sq-nomi{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15;}",
    ".st-sq-nomi b{font-size:.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.st-sq-nomi small{font-size:.62rem;font-weight:800;opacity:.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-sq-pal{flex:none;position:relative;width:30px;height:30px;margin:-2px 2px 0 0;transform:scale(0);opacity:0;transition:transform .22s cubic-bezier(.3,1.6,.5,1),opacity .15s;}",
    ".st-sq-pal span{position:absolute;inset:0;border-radius:50%;background:#fff;border:2.5px solid #c92a2a;color:#c92a2a;font-weight:900;font-size:.8rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,.4);}",
    ".st-sq.guida .st-sq-pal{transform:rotate(8deg);opacity:1;}",
    ".st-sq-campo{position:relative;flex:1;min-height:0;border-radius:8px;overflow:hidden;background:repeating-linear-gradient(180deg,#3d9b49 0 14px,#358a41 14px 28px);}.st-sq-campo.dipinto{background-size:100% 100%;}",
    ".st-sq-campo .st-slot span{padding:0 4px;border-width:1px;border-radius:5px;}",
    ".st-sq.guida{background:linear-gradient(180deg,rgba(255,212,59,.42),rgba(6,12,30,.82) 34%);box-shadow:inset 0 0 0 2.5px #ffd43b,0 0 16px rgba(255,212,59,.5);}",
    ".st-sq.fuori .st-sq-testa{opacity:.55;}.st-sq.via{opacity:.5;}.st-sq.mio .st-sq-nomi b{color:#ffe066;}",
    ".st-sq.batte{animation:stSqBatte .35s ease-out;}@keyframes stSqBatte{from{transform:scale(1.04)}to{transform:none}}",
    ".st-sq.festa{animation:stSqFesta .5s ease-out 2;}@keyframes stSqFesta{0%,100%{transform:none}40%{transform:translateY(-3%)}}",
    // la panchina (solo sullo stesso telefono): le faccine di tutti, da toccare per offrire, e «passo»; chi ha l'offerta più alta alza il cartellino
    ".st-panchina{flex:0 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;margin:6px 6px 0;padding:4px;border-radius:14px;background:linear-gradient(180deg,rgba(14,20,44,.82),rgba(6,10,24,.9));box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 6px 16px rgba(0,0,0,.4);}",
    ".st-pp-file{display:grid;grid-template-columns:repeat(var(--col,4),minmax(0,96px));justify-content:center;gap:4px;}",
    ".st-panchina .sa-pers{width:auto;max-width:none;min-width:0;padding:4px 2px 3px;border-radius:11px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.1);}",
    ".st-panchina .sa-figura{width:min(52%,40px);aspect-ratio:178/182;}",
    ".st-busto{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;}",
    ".st-panchina .sa-pers.puo{box-shadow:inset 0 0 0 2px rgba(105,219,124,.7);}",
    ".st-panchina .sa-pers.puo .sa-figura::before{content:none;}",
    ".st-panchina .sa-pers.guida{background:linear-gradient(180deg,rgba(255,212,59,.42),rgba(255,212,59,.12));box-shadow:inset 0 0 0 2px #ffd43b;}",
    ".st-panchina .sa-paletta{left:92%;top:42%;width:50%;}",
    ".st-panchina .sa-paletta span{font-size:.66rem;border-width:2px;}",
    ".st-panchina .sa-pers b{font-size:.68rem;}",
    ".st-panchina .sa-passo{min-height:24px;margin-top:3px;padding:2px 8px;font-size:.68rem;}",
    ".st-panchina.fitta .st-pp-file{gap:3px;}.st-panchina.fitta .sa-figura{width:min(84%,32px);}.st-panchina.fitta .sa-passo{min-width:0;min-height:20px;margin-top:2px;padding:1px 5px;font-size:.58rem;}.st-panchina.fitta .sa-pers{padding:3px 1px 2px;}.st-panchina.fitta .sa-pers b{font-size:.58rem;}",
    ".st-volo{position:absolute;z-index:7;pointer-events:none;}",
    // in basso: la riga d'aiuto e i tasti, sempre alti uguali (così il campo non cambia misura a ogni offerta)
    ".st-piede{flex:none;flex-direction:row;flex-wrap:wrap;justify-content:center;align-content:flex-end;padding:6px 12px calc(8px + env(safe-area-inset-bottom));}",
    ".st-piede.loc{min-height:calc(96px + env(safe-area-inset-bottom));}.st-piede.onl{min-height:calc(150px + env(safe-area-inset-bottom));}",
    ".st-piede .sa-nota{width:100%;}.st-piede .btn{flex:1;width:auto;}",
    ".st-stadio .sa-aggiudicato{top:14%;font-size:1.6rem;}",
    // la classifica finale del fantacalcio: il contatore che sale, poi il podio
    ".st-rivela .st-palco{margin-top:10px;margin-bottom:10px;}",
    // ⚽ la giornata: la classifica dal vivo (le righe si scambiano di posto solo con transform; --gh = l'altezza di una riga)
    ".st-gio{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;margin:10px 8px 10px;padding:8px;border-radius:16px;background:rgba(4,8,22,.6);box-shadow:inset 0 1px 0 rgba(255,255,255,.12);}",
    ".st-gio-tab{position:relative;width:100%;flex:none;margin-bottom:6px;}",
    ".st-az-box{position:relative;flex:none;margin-bottom:8px;border-radius:12px;overflow:hidden;box-shadow:0 0 0 2px rgba(0,0,0,.35),0 6px 16px rgba(0,0,0,.45);}",
    ".st-az{position:absolute;left:0;top:0;width:100%;height:100%;}",
    ".st-ris{flex:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-bottom:6px;}",
    ".st-ris-p{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3px 0 2px;border-radius:8px;background:rgba(255,255,255,.08);line-height:1.1;white-space:nowrap;overflow:hidden;}",
    ".st-ris-p span{font-size:.6rem;font-weight:800;opacity:.85;letter-spacing:.02em;}",
    ".st-ris-p b{font-size:1.05rem;font-weight:900;color:#ffe066;font-variant-numeric:tabular-nums;}",
    ".st-ris-p.ora{box-shadow:inset 0 0 0 2px #ffd43b;background:rgba(255,212,59,.18);}",
    ".st-rivela.gio .st-board{display:none;}.st-rivela.gio .st-gio{margin:6px 6px 8px;padding:6px 8px;}",
    ".st-bar{flex:none;display:flex;align-items:center;gap:8px;height:38px;margin-bottom:6px;padding:0 8px;border-radius:10px;background:rgba(0,0,0,.42);overflow:hidden;}",
    ".st-bar-min{flex:none;min-width:40px;white-space:nowrap;padding:3px 6px;border-radius:7px;background:#ffd43b;color:#3a2200;font-weight:900;font-size:.85rem;text-align:center;font-variant-numeric:tabular-nums;}",
    ".st-bar-in{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:7px;font-weight:900;font-size:.88rem;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap;}",
    ".st-bar-in.entra{animation:stEntra .45s cubic-bezier(.2,1.3,.4,1);}.st-bar-in span{min-width:0;overflow:hidden;text-overflow:ellipsis;}",
    ".st-bar-in img{flex:none;width:26px;height:26px;object-fit:contain;}.st-bar-sc{flex:none;color:#ffe066;font-size:1.1rem;font-variant-numeric:tabular-nums;}",
    ".st-msg{position:absolute;z-index:3;left:50%;width:max-content;max-width:94%;display:flex;align-items:center;gap:8px;padding:7px 14px;border-radius:14px;background:rgba(6,12,30,.88);box-shadow:0 0 0 2px rgba(255,212,59,.55),0 8px 22px rgba(0,0,0,.5);opacity:0;transform:translate(-50%,-50%) scale(.82);transition:opacity .35s,transform .35s cubic-bezier(.2,1.3,.4,1);pointer-events:none;}",
    ".st-msg.on{opacity:1;transform:translate(-50%,-50%) scale(1);}",
    ".st-prova{position:absolute;z-index:9;left:8px;bottom:6px;padding:3px 8px;border-radius:8px;background:rgba(0,0,0,.72);color:#9ef01a;font:700 12px/1.3 ui-monospace,Menlo,Consolas,monospace;pointer-events:none;letter-spacing:.02em;}",   // 🧪 solo per il proprietario
    ".st-bar-vel.sola{cursor:default;opacity:.8;}",
    ".st-msg-maglia{flex:none;width:34px;height:34px;object-fit:contain;}",
    ".st-msg-tx{display:flex;flex-direction:column;align-items:center;text-align:center;line-height:1.2;min-width:0;}",
    ".st-msg-tx b{font-size:clamp(.9rem,4.4vw,1.08rem);font-weight:900;color:#ffe066;letter-spacing:.02em;text-wrap:balance;}.st-msg-tx span{font-size:.84rem;font-weight:800;}",
    ".st-msg-tx span.pt{margin-top:4px;padding:2px 8px;border-radius:8px;background:rgba(255,255,255,.14);}",
    ".st-msg.sq .st-msg-maglia{width:44px;height:44px;}.st-msg.sq.stretto{gap:6px;padding:6px 10px;}.st-msg.sq.stretto .st-msg-maglia{width:30px;height:30px;}.st-msg.sq .st-msg-tx span.az{font-size:.8rem;font-weight:900;color:#ffe066;letter-spacing:.03em;}",
    ".st-msg.sq .st-msg-tx b.sq{margin-top:3px;padding:2px 12px 3px;border-radius:10px;font-size:clamp(1.15rem,6.2vw,1.55rem);font-weight:900;letter-spacing:.02em;text-transform:uppercase;line-height:1.15;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);text-wrap:balance;}",
    ".st-pag{position:absolute;z-index:4;left:8px;right:8px;bottom:8px;display:flex;flex-direction:column;gap:7px;padding:8px;border-radius:12px;background:rgba(4,8,22,.96);box-shadow:0 0 0 2px rgba(255,255,255,.12);opacity:0;pointer-events:none;transition:opacity .4s;overflow:hidden;}",
    ".st-bar-vel{flex:none;min-width:40px;height:28px;padding:0 8px;border:0;border-radius:8px;background:rgba(255,255,255,.14);color:#fff;font-weight:900;font-size:.85rem;}.st-bar-vel.on{background:#ffd43b;color:#3a2200;}",
    ".st-pag-av{pointer-events:auto;flex:none;margin:auto auto 2px;min-width:62%;width:auto;}",
    ".st-pv-num{display:flex;align-items:stretch;justify-content:center;width:100%;margin-top:2px;}.st-pv-c{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;}",
    ".st-pv-c+.st-pv-c{border-left:1.5px solid rgba(255,255,255,.28);}.st-pv .st-pv-c b{font-size:1.08rem;line-height:1.05;}.st-pv .st-pv-c.fv b{color:#ffe066;}",
    ".st-pv .st-pv-c small{min-height:0;font-size:.5rem;font-weight:800;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.03em;}.st-pv-ic{min-height:1.05em;font-style:normal;font-size:.62rem;line-height:1.3;}",
    ".st-pag-attesa{flex:none;margin:auto auto 6px;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.1);font-weight:800;font-size:.92rem;text-align:center;}",
    ".st-pag:not(.on),.st-pag:not(.on) *{pointer-events:none!important;}",   // (le pagelle nascoste non prendono i tocchi)
    "@media (max-width:380px){.st-bar-in{font-size:.76rem;gap:5px;letter-spacing:0}.st-bar-in img{width:22px;height:22px}.st-bar-sc{font-size:.98rem}}",
    ".st-pag.on{opacity:1;}.st-pag-tit{flex:none;text-align:center;font-weight:900;font-size:.95rem;color:#ffe066;}",
    ".st-pag-p{flex:none;display:flex;flex-direction:column;gap:3px;animation:stSale .5s cubic-bezier(.2,1.3,.4,1) both;}",
    ".st-pag-testa{display:flex;align-items:center;gap:7px;font-weight:900;font-size:.88rem;}.st-pag-testa img{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.16);}",
    ".st-pag-testa span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.st-pag-testa b{color:#ffe066;font-size:1rem;font-variant-numeric:tabular-nums;}",
    ".st-pag-voti{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;}",
    ".st-pv{position:relative;display:flex;flex-direction:column;align-items:center;padding:5px 2px 3px;border-radius:7px;background:rgba(255,255,255,.09);overflow:hidden;min-width:0;line-height:1.1;}",
    ".st-pv i{position:absolute;left:0;right:0;top:0;height:3px;}",
    ".st-pv span{max-width:100%;font-size:.6rem;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-pv b{font-size:1.15rem;font-weight:900;font-variant-numeric:tabular-nums;}.st-pv small{min-height:1.1em;font-size:.6rem;font-weight:800;color:#ffe066;white-space:nowrap;}",
    ".st-pv.v7 b,.st-pf-v.v7 b{color:#69db7c;}.st-pv.v65 b,.st-pf-v.v65 b{color:#c0eb75;}.st-pv.v6 b,.st-pf-v.v6 b{color:#fff;}.st-pv.v55 b,.st-pf-v.v55 b{color:#ffc078;}.st-pv.v5 b,.st-pf-v.v5 b{color:#ff6b6b;}",
    ".st-pf-testa{flex:none;display:flex;align-items:center;gap:10px;font-weight:900;font-size:1.1rem;padding:2px 4px 4px;}",
    ".st-pf-testa img{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.16);}.st-pf-testa span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-pf-tot{font-size:1.6rem;color:#ffe066;font-variant-numeric:tabular-nums;}.st-pf-tot.batte{animation:stPal .3s ease-out;}",
    ".st-pf{flex:none;display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,.07);opacity:0;transform:translateX(-14%);transition:opacity .35s,transform .35s cubic-bezier(.2,1.3,.4,1);}",
    ".st-pf.on{opacity:1;transform:none;}.st-pf .as-rb{padding:3px 6px;font-size:.6rem;}.st-pag.uno .st-pf{flex:1 1 0;min-height:0;max-height:76px;}",
    ".st-pf-nome{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15;}.st-pf-nome b{font-size:1.02rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-pf-nome small{font-size:.68rem;font-weight:700;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".st-pf-v,.st-pf-fv{flex:none;display:flex;flex-direction:column;align-items:center;min-width:46px;line-height:1.05;}",
    ".st-pf-v small,.st-pf-fv small{font-size:.52rem;font-weight:800;opacity:.75;text-transform:uppercase;}.st-pf-v b{font-size:1.45rem;font-weight:900;}.st-pf-fv b{font-size:1.45rem;font-weight:900;color:#ffe066;}",
    ".st-ris-p.gol{animation:stRisGol .9s ease-out;}@keyframes stRisGol{from{background:rgba(255,224,102,.75);color:#1b1b1b}to{background:rgba(255,255,255,.08)}}",
    ".st-gio-riga{position:absolute;left:0;top:0;width:calc((100% - (var(--cols,4) - 1) * 5px) / var(--cols,4));height:var(--qh,44px);display:flex;align-items:center;gap:5px;padding:0 5px 0 4px;border-radius:10px;background:rgba(6,12,30,.84);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.14),0 3px 8px rgba(0,0,0,.35);transition:transform .45s cubic-bezier(.3,1.2,.5,1),background-color .25s;}",
    ".st-gio-riga.piu{background-color:rgba(47,158,68,.75);}.st-gio-riga.meno{background-color:rgba(201,42,42,.6);}",
    ".st-gio-faccia{flex:none;width:calc(var(--qh,44px)*.62);height:calc(var(--qh,44px)*.62);max-width:36px;max-height:36px;border-radius:50%;background:rgba(255,255,255,.16);}",
    ".st-gio-nomi{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.12;}",
    ".st-gio-nome{font-weight:900;font-size:.74rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.st-gio-riga.mio .st-gio-nome{color:#ffe066;}",
    ".st-gio-ev{font-size:.66rem;white-space:nowrap;overflow:hidden;letter-spacing:-.04em;}",
    // ⏳ la Zona Cesarini (30 ott 2026): la barra rossa che pulsa, la cornice del campo che si scalda, la striscia della radio e del sorpasso,
    // la 👑 su chi è in testa, la scritta di cosa serve al posto delle icone, la freccina del voto (solo transform e opacità)
    ".st-bar{position:relative;}.st-radio{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;padding:0 10px;border-radius:10px;background:#0b3550;color:#fff;font-family:var(--o-tit);font-weight:800;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;transform:translateY(-115%);transition:opacity .25s,transform .3s cubic-bezier(.2,1.2,.4,1);pointer-events:none;}",
    ".st-radio.on{opacity:1;transform:none;}.st-radio.radio{background:linear-gradient(90deg,#0b3550,#14506f);box-shadow:inset 0 0 0 1.5px #4fd8ff;}.st-radio.sorp{background:var(--o-tasto);box-shadow:0 6px 16px rgba(224,34,90,.45);}",
    ".st-rivela.zona .st-bar::after{content:'';position:absolute;inset:0;border-radius:10px;box-shadow:inset 0 0 0 2px #ff3d5e;pointer-events:none;animation:stZona 1s ease-in-out infinite alternate;}",
    ".st-rivela.zona .st-az-box::before{content:'';position:absolute;inset:0;z-index:2;border-radius:12px;box-shadow:inset 0 0 22px 3px rgba(255,61,94,.55);pointer-events:none;animation:stZona 1.3s ease-in-out infinite alternate;}",
    "@keyframes stZona{from{opacity:.35}to{opacity:1}}",
    ".st-az-box.attesa canvas{opacity:.5;transition:opacity .5s;}",
    ".st-gio-riga.capo::before{content:'👑';position:absolute;left:2px;top:-3px;font-size:.66rem;line-height:1;transform:rotate(-14deg);z-index:2;}",
    ".st-gio-zona{flex:none;display:none;font-size:.62rem;font-weight:800;white-space:nowrap;overflow:hidden;color:#ff9fbb;}.st-rivela.zona .st-gio-tab.fitto .st-gio-pt{font-size:.92rem;}.st-rivela.zona .st-gio-tab.fittissimo .st-gio-pt{font-size:.86rem;}.st-rivela.zona .st-gio-zona{display:inline;}.st-rivela.zona .st-gio-ev{display:none;}",
    ".st-gio-zona.entra{animation:stEntra .45s cubic-bezier(.2,1.3,.4,1);}",
    ".st-gio-fr{flex:none;font-size:.8rem;font-weight:900;opacity:0;}.st-gio-fr.su{color:#34d17a;}.st-gio-fr.giu{color:#ff6b78;}.st-gio-fr.on{animation:stFreccia 1.6s ease-out;}",
    "@keyframes stFreccia{0%{opacity:0;transform:translateY(4px)}15%{opacity:1;transform:none}70%{opacity:1}100%{opacity:0}}",
    ".st-gio-pt{flex:none;font-size:1.12rem;font-weight:900;color:#ffe066;font-variant-numeric:tabular-nums;}",
    ".st-gio-pt.batte{animation:stPal .3s ease-out;transform-origin:left center;}",   // (il punteggio che salta cresce verso destra: non si taglia)
    ".st-gio-riga{border-left:5px solid var(--pc,#ffe066);cursor:pointer;}.st-gio-riga .st-gio-nome,.st-gio-riga.mio .st-gio-nome{color:var(--pc,#fff);}",
    ".st-gio-riga .st-gio-faccia{box-shadow:0 0 0 2.5px var(--pc,transparent);}",
    ".st-gio-riga.incampo{box-shadow:inset 0 0 0 2px var(--pc),0 0 14px var(--pc);z-index:1;}",
    ".st-gio-riga.incampo::after{content:'👟';position:absolute;right:3px;top:3px;font-size:.68rem;line-height:1;}.st-gio-riga.incampo .st-gio-nome{padding-right:13px;}",   // (un suo calciatore è in campo adesso)
    ".st-gio-sotto{display:flex;align-items:baseline;gap:3px;min-width:0;}.st-gio-sotto .st-gio-ev{flex:1;min-width:0;}",
    ".st-gio-tab.fitto .st-gio-riga{gap:3px;padding:0 3px 0 3px;}.st-gio-tab.fitto .st-gio-faccia{width:20px;height:20px;}.st-gio-tab.fitto .st-gio-pt{font-size:1.04rem;}",
    ".st-gio-tab.fittissimo .st-gio-faccia{display:none;}.st-gio-tab.fittissimo .st-gio-riga{padding-left:5px;}",
    ".st-gio-in{display:none;}",
    ".st-pag.live{pointer-events:auto;cursor:pointer;}.st-pag-nota{flex:none;text-align:center;font-size:.72rem;font-weight:700;opacity:.7;}",
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
    ".st-altri{margin-top:6px;padding:6px 10px;border-radius:10px;background:rgba(0,0,0,.35);font-size:.76rem;font-weight:800;line-height:1.5;text-align:center;}",
    // sotto ogni avatar: i crediti e fin dove può arrivare; nel fantacalcio anche i posti che gli mancano (🧤🛡️🎽⚽)
    ".sa-pers .sa-manca{font-style:normal;font-size:.6rem;line-height:1.1;white-space:nowrap;text-align:center;letter-spacing:-.04em;text-shadow:0 1px 2px rgba(0,0,0,.8);}",
    // i rilanci a salto: il tasto grande (+1) e accanto i salti (+3, o +2 e +5) e «Passo»
    ".as-salti{display:flex;gap:6px;width:100%;}.as-salti .btn{flex:1 1 0;min-width:0;padding-left:4px;padding-right:4px;font-size:.92rem;}",
    ".as-salti .btn small{display:block;font-size:.68rem;font-weight:800;opacity:.85;line-height:1.05;}",
    ".st-piede .as-salti{flex:1 1 100%;}",
    // (stesso telefono) di quanto rilancia chi tocca il suo avatar
    ".as-sel{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:nowrap;width:100%;}",
    ".as-sel span{font-size:.72rem;font-weight:800;text-shadow:0 1px 3px rgba(0,0,0,.7);white-space:nowrap;}",
    ".as-sel button{border:0;border-radius:12px;min-height:38px;min-width:46px;padding:0 10px;font-family:inherit;font-weight:900;font-size:.95rem;background:rgba(255,255,255,.22);color:#fff;}",
    ".as-sel button.on{background:linear-gradient(135deg,#4fe895,#1faf60);color:#04321c;box-shadow:0 0 0 2px #fff;}",
    // il tipo di round: nella striscia dei round e all'inizio del round
    ".as-step .st2{font-size:.7rem;line-height:1;}",
    ".as-tipo{display:inline-flex;align-items:center;gap:6px;margin:2px auto 0;padding:6px 12px;border-radius:99px;background:linear-gradient(135deg,#2a2550,#3b2f7a);border:1px solid rgba(255,255,255,.18);font-weight:900;font-size:.95rem;}",
    ".as-tipo-spiega{font-size:.9rem;line-height:1.35;color:var(--testo);max-width:30ch;margin:4px auto 0;}",
    // lotto doppio e pacco a sorpresa nelle carte da scegliere
    ".as-carta{position:relative;}.as-carta .bx{position:absolute;top:4px;right:6px;font-size:.62rem;font-weight:900;padding:2px 6px;border-radius:8px;background:#ffd43b;color:#3a2200;}",
    ".as-carta.pacco{background:linear-gradient(160deg,#5a1e6e,#2a1240);}.as-carta.doppio{box-shadow:0 0 0 2px #ffd43b,var(--ombra);}",
    ".as-em2{position:relative;}.as-em2 .b{position:absolute;right:-6px;bottom:-6px;font-size:.55em;width:1.6em;height:1.6em;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fffdf6;box-shadow:0 2px 5px rgba(0,0,0,.35);}",
    ".as-kit .riga .pk,.as-rose-riga .pk{font-size:.7rem;margin-left:2px;}",
    // ✉️ la busta chiusa: tutto in uno schermo, si aggiorna solo quello che cambia
    ".schermata.as-bus{flex:0 0 auto;height:var(--alt,100dvh);max-height:var(--alt,100dvh);min-height:0;overflow:hidden;background:radial-gradient(130% 70% at 50% 0%,#14324a 0%,var(--sfondo) 62%);}",
    ".as-bus>.contenuto{flex:1;min-height:0;display:flex;flex-direction:column;gap:7px;overflow:hidden;}",
    ".as-bus-testa{display:flex;align-items:center;justify-content:center;gap:8px;min-height:34px;padding:0 38px;flex:none;font-size:.78rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8fd3ff;}",
    ".as-bus-carta{display:flex;align-items:center;gap:12px;background:linear-gradient(150deg,#fffdf6,#f1e6cc);color:#2b2b2b;border-radius:18px;padding:10px 12px;box-shadow:0 10px 26px rgba(0,0,0,.45);}",
    ".as-bus-carta .em{font-size:2.3rem;width:60px;height:60px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffe7ab);}",
    ".as-bus-carta .em svg{width:60%;height:60%;}",
    ".as-bus-carta .nm{font-size:1.1rem;font-weight:900;line-height:1.18;}.as-bus-carta .sm{font-size:.74rem;font-weight:800;color:#7a5a00;margin-top:2px;}",
    ".as-bus-regola{margin:0;text-align:center;font-size:.8rem;line-height:1.3;color:var(--testo-tenue);font-weight:700;}",
    ".as-bus-gente{display:grid;grid-template-columns:1fr 1fr;gap:5px;min-height:0;}",
    ".as-bus-p{display:flex;align-items:center;gap:6px;min-width:0;background:var(--carta);border:2px solid transparent;border-radius:12px;padding:5px 8px;font-size:.85rem;}",
    ".as-bus-p b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".as-bus-p span{flex:none;font-weight:800;color:var(--testo-tenue);font-size:.78rem;}",
    ".as-bus-p.chiusa{border-color:#8fd3ff;}.as-bus-p.chiusa span{color:#8fd3ff;}.as-bus-p.via,.as-bus-p.fuori{opacity:.4;}.as-bus-p.mio b{color:#ffe066;}",
    ".as-bus-piede{display:flex;flex-direction:column;gap:6px;}",
    ".as-bus-piede .sa-nota{color:var(--testo);text-shadow:none;font-size:.86rem;}",
    ".as-bst{display:flex;align-items:center;justify-content:center;gap:10px;}",
    ".as-bst .v{min-width:92px;text-align:center;font-size:1.9rem;font-weight:900;color:var(--accento);font-variant-numeric:tabular-nums;}",
    ".as-bst button{width:50px;height:50px;border-radius:50%;border:0;font-size:1.6rem;font-weight:900;font-family:inherit;background:var(--carta-2);color:var(--testo);}",
    ".as-bst button.p3{width:auto;border-radius:25px;padding:0 12px;font-size:1rem;}",
    ".as-bst button:disabled{opacity:.3;}",
    // la busta di carta (sullo stesso telefono, in mezzo allo schermo): il lembo a V in alto, l'offerta scritta sopra
    ".as-env{position:relative;width:100%;max-width:330px;margin:auto;aspect-ratio:1.55;border-radius:16px;box-shadow:0 14px 30px rgba(0,0,0,.45);" +
      "background:linear-gradient(to bottom left,#e8d3a0 50%,transparent 50%) left top/50% 52% no-repeat,linear-gradient(to bottom right,#e8d3a0 50%,transparent 50%) right top/50% 52% no-repeat,linear-gradient(170deg,#fbf0d6,#f0dfb4);}",
    ".as-env::after{content:'🤫';position:absolute;left:50%;top:50%;transform:translate(-50%,-62%);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;" +
      "background:radial-gradient(circle at 38% 32%,#ef5a6c,#a3162a 70%);box-shadow:0 3px 6px rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,255,255,.12);}",   // il sigillo di ceralacca
    ".as-env .as-bst{position:absolute;left:0;right:0;bottom:12%;}",
    ".as-env .as-bst .v{color:#5a3b00;text-shadow:none;}.as-env .as-bst button{background:rgba(90,59,0,.14);color:#4a3000;}",
    ".as-env-tx{position:absolute;left:0;right:0;bottom:13%;text-align:center;font-size:1.9rem;font-weight:900;color:#5a3b00;}",
    ".as-env.chiusa::after{content:'🔒';}",   // (busta chiusa: il sigillo col lucchetto)
    ".as-bus .as-env{flex:none;max-width:290px;}.as-bus-fitta .as-env{max-width:200px;}.as-bus-fitta .as-env-tx{font-size:1.4rem;}",
    ".as-bus-fitta .as-env .as-bst{gap:6px;bottom:8%;}.as-bus-fitta .as-env .as-bst button{width:40px;height:40px;font-size:1.3rem;}.as-bus-fitta .as-env .as-bst .v{min-width:64px;font-size:1.5rem;}",
    ".as-bus-fitta .as-bus-carta{padding:6px 10px;}.as-bus-fitta .as-bus-carta .em{width:46px;height:46px;font-size:1.8rem;}.as-bus-fitta .as-bus-p{padding:3px 7px;font-size:.78rem;}",
    // le buste aperte (nell'esito): una alla volta, dalla più bassa alla più alta
    ".as-buste{display:flex;flex-direction:column;gap:4px;margin:2px auto 0;width:100%;max-width:340px;}",
    ".as-buste .r{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:10px;background:var(--carta);font-weight:800;font-size:.9rem;opacity:0;animation:asBusta .35s ease-out forwards;}",
    ".as-buste .r b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.as-buste .r.vince{background:linear-gradient(135deg,#ffe58a,var(--accento));color:#2a2400;}",
    "@keyframes asBusta{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}",
    ".as-sorpresa{animation:asSorpresa .6s cubic-bezier(.2,1.5,.4,1);}",
    "@keyframes asSorpresa{0%{transform:scale(.3) rotate(-12deg);opacity:0}60%{transform:scale(1.08) rotate(3deg);opacity:1}100%{transform:none}}",
    // ⭐ il voto a un tocco: la carta-scenario in alto, sotto i kit degli altri (tocchi quello che se la cava meglio)
    ".schermata.as-vt{flex:0 0 auto;height:var(--alt,100dvh);max-height:var(--alt,100dvh);min-height:0;}",
    ".as-vt>.contenuto{min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}",
    ".as-vt .as-scen{margin-left:40px;}",   // (spazio per il ‹ in alto a sinistra)
    ".as-scen{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#3b1f6e,#1f2a6e);border:2px solid rgba(255,255,255,.18);border-radius:16px;padding:9px 12px;margin:0 0 8px;box-shadow:0 8px 22px rgba(0,0,0,.35);}",
    ".as-scen .e{font-size:2.2rem;line-height:1;flex:none;}.as-scen .x{flex:1;min-width:0;}",
    ".as-scen small{display:block;font-size:.66rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#c9b8ff;}",
    ".as-scen b{display:block;font-size:1.02rem;line-height:1.22;}",
    ".as-scen.entra{animation:asSorpresa .6s cubic-bezier(.2,1.5,.4,1);}",
    ".as-vk{display:block;width:100%;text-align:left;border:2px solid transparent;font-family:inherit;color:inherit;background:var(--carta);border-radius:14px;padding:7px 10px;margin-bottom:6px;box-shadow:var(--ombra);cursor:pointer;}",
    ".as-vk .n{display:flex;align-items:center;gap:6px;font-weight:900;font-size:.98rem;}.as-vk .n span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".as-vk .n i{font-style:normal;font-size:1.25rem;filter:grayscale(1);opacity:.35;}",
    ".as-vk .k{font-size:.78rem;line-height:1.35;color:var(--testo-tenue);margin-top:2px;}.as-vk .k .em{display:inline-flex;vertical-align:-2px;margin-right:2px;}.as-vk .k .em svg{width:1em;height:1em;}",
    ".as-vk.scelto{border-color:var(--accento);background:linear-gradient(150deg,var(--carta-2),#3a3060);}.as-vk.scelto .n i{filter:none;opacity:1;}",
    ".as-vk.mio{opacity:.55;cursor:default;}.as-vk:disabled{color:inherit;}",
    ".as-vk.fitto{padding:4px 9px;margin-bottom:4px;}.as-vk.fitto .k{font-size:.72rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
    ".as-vk.mini{padding:3px 9px;margin-bottom:3px;border-radius:11px;}.as-vk.mini .n{font-size:.88rem;}.as-vk.mini .n i{font-size:1.05rem;}.as-vk.mini .k{-webkit-line-clamp:1;margin-top:0;}",
    ".as-vk.due{display:inline-block;vertical-align:top;width:calc(50% - 3px);}.as-vk.due:nth-of-type(odd){margin-right:6px;}.as-vk.due .k{font-size:0;line-height:1.2;}.as-vk.due .k .em{font-size:1.05rem;margin-right:3px;}",
    // 🏅 i titoli scherzosi di fine partita (non sono trofei)
    ".as-titoli{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 4px;}",
    ".as-tit{background:linear-gradient(150deg,var(--carta-2),#2a2550);border-radius:12px;padding:6px 8px;min-width:0;}",
    ".as-tit .t{font-size:.72rem;font-weight:900;color:var(--accento);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".as-tit .c{font-size:.95rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".as-tit .d{font-size:.68rem;font-weight:700;color:var(--testo-tenue);line-height:1.2;}",
    ".as-foto{display:flex;gap:6px;justify-content:center;margin:6px 0 2px;}.as-foto .btn{margin:0;flex:1;max-width:320px;}",
    ".as-foto-riga{align-items:center;margin:0;}.as-foto-riga .btn{flex:none;width:auto;min-height:40px;padding:6px 14px;font-size:.92rem;border-radius:999px;}",
    ".as-voti-da{font-size:.72rem;font-weight:800;color:var(--accento);margin:-4px 0 4px;}",
    // 🌙 Notte vivace: le schermate di servizio (classifica finale, fasce svelate, titoli) hanno la classe .oro: qui i pezzi del gioco coi colori dell'app
    ".oro .as-scen{background:var(--o-carta-viva);border:1px solid var(--o-filo-oro);box-shadow:var(--o-ombra);}",   // (lo scenario: era viola)
    ".oro .as-scen small{color:var(--o-oro-testo);}",
    ".oro .as-tit{background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo);}",   // (i titoli scherzosi: vetro come il resto, non viola)
    ".oro .tier-A{background:linear-gradient(135deg,var(--o-m-oro-i),var(--n-monete));color:var(--o-m-oro-a);}",   // (la fascia A resta d'oro: col lampone diventava salmone)
    // 🌙 Notte vivace: SOLO la sala dei temi (.sa-sala senza lo stadio del fantacalcio, che resta com'era). Gli avatar, le sedie e il banditore non cambiano; il banco resta marrone. Niente animazioni nuove.
    ".sa-sala:not(.st-stadio){background:var(--o-fondo);}",
    ".sa-sala:not(.st-stadio) .sa-sfondo{filter:grayscale(.8) brightness(1.1) contrast(1.12);}",   // (lo sfondo è fermo: il filtro si calcola una volta sola)
    ".sa-sala:not(.st-stadio)::before{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(60% 26% at 50% 17%,rgba(255,200,130,.30),transparent 72%),radial-gradient(54% 20% at 22% 97%,rgba(255,178,96,.40),transparent 72%),radial-gradient(76% 34% at 50% 62%,rgba(255,196,130,.15),transparent 76%),linear-gradient(180deg,rgba(14,20,74,.58) 0%,rgba(44,58,190,.46) 34%,rgba(18,24,92,.48) 68%,rgba(10,12,34,.76) 100%);}",
    ".sa-sala:not(.st-stadio)::after{background:radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 46%,rgba(4,6,16,.62) 100%);}",
    ".sa-sala:not(.st-stadio) .sa-tasto{background:rgba(21,26,46,.82);color:var(--o-testo);font-weight:700;box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 0 0 1px rgba(255,255,255,.14),0 6px 16px rgba(0,0,0,.45);}",
    // 🌙 nello stadio del fanta i tasti in alto («Salta ⏭», «📸 Foto») in vetro scuro come quelli della sala (erano bianchi); campo e spalti restano
    ".st-stadio .sa-tasto{background:rgba(21,26,46,.82);color:var(--o-testo);font-weight:700;box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 0 0 1px rgba(255,255,255,.14),0 6px 16px rgba(0,0,0,.45);}",
    ".sa-sala:not(.st-stadio) .sa-info{color:var(--o-testo);font-weight:700;letter-spacing:.02em;}",
    ".sa-sala:not(.st-stadio) .sa-pannello{gap:10px;padding:9px;border-radius:20px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0) 46%),rgba(21,26,46,.84);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 18px 36px -12px rgba(0,0,0,.8),0 0 0 1px rgba(0,0,0,.35);}",
    ".sa-sala:not(.st-stadio) .sa-lotto{background:rgba(255,255,255,.06);color:var(--o-testo);border-radius:14px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09);}",
    ".sa-sala:not(.st-stadio) .sa-carta-in .nm{font-weight:800;}",
    ".sa-sala:not(.st-stadio) .sa-sotto{color:var(--o-tenue);opacity:1;font-weight:600;}",
    ".sa-sala:not(.st-stadio) .sa-prezzo small{color:var(--o-tenue);font-weight:800;}",
    ".sa-sala:not(.st-stadio) .sa-prezzo b{color:var(--n-monete);text-shadow:0 0 18px rgba(255,194,71,.35);}",
    ".sa-sala:not(.st-stadio) .sa-prezzo span{margin-top:3px;padding:2px 10px;border-radius:99px;background:var(--n-lampone);color:#fff;font-weight:800;font-size:.72rem;opacity:1;box-shadow:0 4px 12px rgba(224,34,90,.45);}",
    ".sa-sala:not(.st-stadio) .sa-avviso{background:rgba(21,26,46,.88);color:var(--n-monete);box-shadow:inset 0 0 0 1px rgba(255,194,71,.45);}",
    ".sa-sala:not(.st-stadio) .sa-tempo{background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);}",
    ".sa-sala:not(.st-stadio) .sa-tempo i{background:linear-gradient(90deg,var(--n-lampone),var(--o-oro-chiaro));}",
    ".sa-sala.ultimi:not(.st-stadio) .sa-tempo i{background:var(--o-oro);}",
    ".sa-sala:not(.st-stadio) .sa-paletta span{border-color:var(--n-lampone);color:var(--n-lampone);box-shadow:0 4px 12px rgba(0,0,0,.5),0 0 0 3px rgba(224,34,90,.25);}",
    ".sa-sala:not(.st-stadio) .sa-nuvola{background:var(--n-lampone);color:#fff;box-shadow:0 6px 14px rgba(224,34,90,.5);}",
    ".sa-sala:not(.st-stadio) .sa-num{background:rgba(21,26,46,.92);color:var(--o-testo);box-shadow:0 0 0 1px rgba(255,255,255,.22),0 2px 5px rgba(0,0,0,.5);}",
    ".sa-sala:not(.st-stadio) .sa-pers b{font-weight:700;letter-spacing:.01em;}",
    ".sa-sala:not(.st-stadio) .sa-pers small{color:#d6d9ea;opacity:1;font-weight:600;}",
    ".sa-sala:not(.st-stadio) .sa-pers.guida b{padding:1px 9px;border-radius:99px;background:var(--n-lampone);color:#fff;text-shadow:none;box-shadow:0 4px 12px rgba(224,34,90,.45);}",
    ".sa-sala:not(.st-stadio) .sa-pers.guida .sa-num{background:var(--n-lampone);color:#fff;}",
    ".sa-sala:not(.st-stadio) .sa-pers.mio b{color:#fff;}",
    ".sa-sala:not(.st-stadio) .sa-pers.mio .sa-num{background:var(--o-testo);color:var(--o-fondo);}",
    ".sa-sala:not(.st-stadio) .sa-pers.puo .sa-figura::before{background:radial-gradient(ellipse,rgba(255,170,90,.75),rgba(255,170,90,0) 70%);}",
    ".sa-sala:not(.st-stadio) .sa-passo{background:rgba(21,26,46,.82);color:var(--o-testo);font-weight:700;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);}",
    ".sa-sala:not(.st-stadio) .sa-bolla{background:var(--o-carta-piena);color:var(--o-testo);font-weight:700;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),0 8px 20px rgba(0,0,0,.55);}",
    ".sa-sala:not(.st-stadio) .sa-bolla::after{border-top-color:var(--o-carta-piena);}",
    ".sa-sala:not(.st-stadio) .sa-bolla.conta{background:var(--n-lampone);color:#fff;box-shadow:0 8px 20px rgba(224,34,90,.5);}",
    ".sa-sala:not(.st-stadio) .sa-bolla.conta::after{border-top-color:var(--n-lampone);}",
    ".sa-sala:not(.st-stadio) .sa-bolla.lato::after{border-top-color:transparent;border-right-color:var(--o-carta-piena);}.sa-sala:not(.st-stadio) .sa-bolla.lato.conta::after{border-top-color:transparent;border-right-color:var(--n-lampone);}",
    ".sa-sala:not(.st-stadio) .sa-nota{color:#d6d9ea;opacity:1;font-weight:600;}",
    ".sa-sala:not(.st-stadio) .as-sel span{color:var(--o-testo);font-weight:700;}",
    ".sa-sala:not(.st-stadio) .as-sel button{background:rgba(21,26,46,.84);color:var(--o-testo);font-weight:800;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);}",
    ".sa-sala:not(.st-stadio) .as-sel button.on{background:var(--o-tasto);color:var(--o-tasto-testo);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 8px 18px rgba(224,34,90,.45);}",
    ".sa-sala:not(.st-stadio) .sa-aggiudicato{background:var(--n-lampone);border-color:var(--o-testo);}",
    // 🌙 la giornata del fanta di notte (29 ott 2026, il proprietario: «nella giornata del fanta vesti di notte riquadri, scritte e tasti attorno
    // al campo; campo, spalti e calciatori restano come sono»): vetro scuro col filo di luce, testo chiaro, il lampone per il minuto, il ⏩ acceso
    // e «Avanti ▶» (l'unico tasto pieno), il carattere dell'app. I colori di ognuno (quadretti, nomi) e delle squadre restano
    ".st-rivela .sa-testa .sa-tasto{background:var(--o-carta-piena);color:var(--o-testo);font-family:var(--o-tit);font-weight:800;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px var(--o-filo-oro),0 8px 18px -6px rgba(0,0,0,.7);}",
    ".st-rivela .sa-info{color:var(--o-testo);font-family:var(--o-tit);font-weight:800;}",
    ".st-gio-tab,.st-gio-tab *,.st-bar,.st-bar *,.st-ris,.st-ris *,.st-msg,.st-msg *{font-family:var(--o-tit);}",
    ".st-gio{background:rgba(13,16,32,.66);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),inset 0 0 0 1px var(--o-filo),0 14px 30px -14px rgba(0,0,0,.8);}",
    ".st-gio-riga{background-color:rgba(21,26,46,.92);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),inset 0 0 0 1px var(--o-filo);}",
    ".st-gio-riga.piu{background-color:rgba(52,209,122,.42);}.st-gio-riga.meno{background-color:rgba(214,60,74,.5);}",
    ".st-gio-riga.incampo{box-shadow:inset 0 0 0 2px var(--pc),0 0 14px var(--pc);}",
    ".st-gio-pt{color:var(--o-testo);}.st-gio-ev{color:var(--o-tenue);}",
    ".st-bar{background:rgba(10,12,24,.72);box-shadow:inset 0 0 0 1px var(--o-filo);}",
    ".st-bar-min{background:var(--n-lampone);color:#fff;}.st-bar-in{color:var(--o-testo);}.st-bar-sc{color:var(--o-testo);}",
    ".st-bar-vel{background:rgba(255,255,255,.08);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro);}.st-bar-vel.on{background:var(--o-tasto);color:#fff;box-shadow:0 6px 14px -4px rgba(224,34,90,.6);}",
    ".st-msg{background:rgba(21,26,46,.95);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 1.5px rgba(255,79,134,.6),0 10px 26px rgba(0,0,0,.55);}",
    ".st-msg-tx b{color:var(--o-testo);}.st-msg-tx span{color:var(--o-tenue);}.st-msg.sq .st-msg-tx span.az{color:var(--o-oro-testo);}",
    ".st-msg-tx span.pt{background:rgba(255,255,255,.1);color:var(--o-testo);}",
    ".st-ris-p{background:rgba(21,26,46,.82);box-shadow:inset 0 0 0 1px var(--o-filo);}.st-ris-p span{color:var(--o-tenue);opacity:1;}.st-ris-p b{color:var(--o-testo);}",
    ".st-ris-p.ora{background:rgba(224,34,90,.18);box-shadow:inset 0 0 0 2px var(--n-lampone);}",
    ".st-ris-p.gol{animation:stRisGolN .9s ease-out;}@keyframes stRisGolN{from{background:rgba(255,79,134,.8)}to{background:rgba(21,26,46,.82)}}",
    ".st-pag{background:rgba(16,20,36,.97);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),inset 0 0 0 1px var(--o-filo-oro),0 18px 40px -16px rgba(0,0,0,.9);}",
    ".st-pag,.st-pag *{font-family:var(--o-tit);}.st-pag-tit{color:var(--o-testo);}.st-pag-testa b{color:var(--o-testo);}.st-pag-nota{color:var(--o-tenue);opacity:1;}",
    ".st-pag-attesa{background:rgba(255,255,255,.07);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro);}",
    ".st-rivela .st-pag-av{background:var(--o-tasto);color:var(--o-tasto-testo);font-family:var(--o-tit);font-weight:800;border:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 8px 18px rgba(224,34,90,.45);}"
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
    festa: function () { beep([660, 880, 1046, 1318], 0.2, "triangle"); },
    maledetta: function () { beep([392, 311, 233], 0.24, "sawtooth"); },                // 🧨 esce la carta maledetta (tre note che scendono)
    gong: function () { beep([110, 220, 165], 0.5, "sine"); },                          // ⏳ il 75': la Zona Cesarini
    sorpasso: function () { beep([520, 660, 990], 0.1, "triangle"); },                  // 🔁 chi passa in testa
    radio: function () { beep([1800, 1500], 0.05, "square"); },                         // 📻 «Interrompo!»
    recupero: function () { beep([1200, 1200], 0.09, "square"); }                       // ⏱️ il cartello del recupero
  };

  // ⚽ i suoni dello stadio, creati al momento (niente file da scaricare): il colpo al pallone, il palo, la rete che si gonfia,
  // l'«ooh» della folla, il boato del gol, il fischietto dell'arbitro. Un suono che non parte non deve mai fermare il gioco
  var RUMORE = null;
  function rumore(c) { if (RUMORE) return RUMORE; var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (RUMORE = b); }
  function folla(c, t0, picco, durata, freq, vol) {   // la folla: un fruscio filtrato che sale e poi scende piano
    var so = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    so.buffer = rumore(c); so.loop = true; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + picco); g.gain.exponentialRampToValueAtTime(0.0001, t0 + durata);
    so.connect(f); f.connect(g); g.connect(c.destination); so.start(t0); so.stop(t0 + durata + 0.05);
    return f;
  }
  var SUONI = {
    calcio: function (forza) {   // il colpo al pallone: un tonfo basso e uno schiocco
      var c = ctx(); if (!c) return;
      try {
        var t = c.currentTime, o = c.createOscillator(), g = c.createGain(), so = c.createBufferSource(), f = c.createBiquadFilter(), gg = c.createGain();
        o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 + 0.35 * forza, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.16);
        so.buffer = rumore(c); f.type = "highpass"; f.frequency.value = 2500; gg.gain.setValueAtTime(0.04 + 0.12 * forza, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        so.connect(f); f.connect(gg); gg.connect(c.destination); so.start(t); so.stop(t + 0.05);
      } catch (e) {}
    },
    palo: function () {   // il palo: un «deng» di metallo
      var c = ctx(); if (!c) return;
      try { var t = c.currentTime; [880, 1763, 2647].forEach(function (fr, i) { var o = c.createOscillator(), g = c.createGain(); o.frequency.value = fr; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18 / (i + 1), t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7 - i * 0.15); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.75); }); } catch (e) {}
    },
    rete: function () {   // la rete che si gonfia: uno «sciaff»
      var c = ctx(); if (!c) return;
      try { var t = c.currentTime, so = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); so.buffer = rumore(c); f.type = "bandpass"; f.frequency.value = 4200; f.Q.value = 0.8; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); so.connect(f); f.connect(g); g.connect(c.destination); so.start(t); so.stop(t + 0.45); } catch (e) {}
    },
    ooh: function () {   // l'«ooh» della folla sul tiro che non entra
      var c = ctx(); if (!c) return;
      try { var t = c.currentTime, f = folla(c, t, 0.35, 1.3, 600, 0.22); f.frequency.setValueAtTime(620, t); f.frequency.exponentialRampToValueAtTime(330, t + 1.2); } catch (e) {}
    },
    boato: function (forza) {   // il boato dello stadio sul gol
      var c = ctx(); if (!c) return;
      try { var t = c.currentTime, v = 0.28 + 0.2 * (forza == null ? 1 : forza); folla(c, t, 0.25, 3.2, 900, v); folla(c, t + 0.05, 0.4, 2.6, 2200, v * 0.45); folla(c, t, 0.3, 2.4, 380, v * 0.6); } catch (e) {}
    },
    fischio: function (volte, lungo) {   // il fischietto dell'arbitro: volte fischi brevi (l'ultimo lungo se lungo)
      var c = ctx(); if (!c) return;
      try {
        var t = c.currentTime, n = volte || 1;
        for (var i = 0; i < n; i++) {
          var d = lungo && i === n - 1 ? 0.8 : 0.22, s0 = t + i * 0.34, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
          o.frequency.value = 2950; lfo.frequency.value = 38; lg.gain.value = 70; lfo.connect(lg); lg.connect(o.frequency);
          g.gain.setValueAtTime(0.0001, s0); g.gain.exponentialRampToValueAtTime(0.13, s0 + 0.02); g.gain.setValueAtTime(0.13, s0 + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, s0 + d);
          o.connect(g); g.connect(c.destination); o.start(s0); o.stop(s0 + d + 0.02); lfo.start(s0); lfo.stop(s0 + d + 0.02);
        }
      } catch (e) {}
    }
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
    if (tier === "M") return el("span", { class: "tier tier-M", text: "🧨", title: "Carta maledetta" });   // la carta maledetta si vede sempre
    return rivela ? el("span", { class: "tier tier-" + tier, text: tier }) : null;
  }

  // ---- 🧨 la carta maledetta ----
  function cartaMaledetta() {
    var l = window.SG_ASTA_MALEDETTE || []; if (!l.length) return null;
    var c = l[Math.floor(Math.random() * l.length)];
    return { nome: c.nome, emoji: c.emoji, tier: "M", maledetta: true };
  }
  // quando esce: in un round a caso tra il 2° e il 3°, e in un momento a caso di quel round
  // (quando restano senza carta "quando" giocatori: da subito dopo la prima asta fino alla fine del round)
  function pianoMaledetta(n) {
    var P = window.__astaMalProva;   // (solo per le prove nel browser: il round e il momento scelti a mano)
    if (P) return { round: P.round, quando: Math.min(P.quando, Math.max(0, n - 1)), fatta: false };
    return { round: 1 + Math.floor(Math.random() * 2), quando: Math.floor(Math.random() * Math.max(1, n)), fatta: false }; }
  function haMaledetta(g) { return !!(g && g.kit && g.kit.some(function (c) { return c && c.maledetta; })); }
  // alla fine del voto: chi ha la carta maledetta perde mezza stella (le stelle non vanno sotto zero)
  function malusVoto(giocatori) {
    giocatori.forEach(function (g) {
      g.malus = 0;
      if (!haMaledetta(g)) return;
      g.malus = MALUS;
      g.stelle = Math.max(0, mezzo(g.stelle - g.malus));
    });
  }

  // ---- i round diversi dei temi: 📦 lotto doppio e 🎁 pacco a sorpresa (la ✉️ busta chiusa cambia solo come si offre) ----
  function tipoDi(tipi, r) { return (tipi && tipi[r]) || "normale"; }
  function tipiPartita(imp) { return imp && imp.round === "normali" ? ["normale", "normale", "normale", "normale"] : TIPI_ROUND.slice(); }
  function tavoloRound(r, n, temaId, tipo) {
    var carte = carteDelRound(r, n + (tipo === "doppio" && n >= 2 ? 1 : 0), temaId);
    if (tipo === "doppio" && carte.length > n) {   // una carta in più, attaccata a un'altra: il lotto doppio
      var extra = carte.pop();
      carte[Math.floor(Math.random() * carte.length)].bonus = { nome: extra.nome, emoji: extra.emoji, tier: extra.tier };
    }
    if (tipo === "pacco" && carte.length >= 2) carte[Math.floor(Math.random() * carte.length)].pacco = true;
    return carte;
  }
  // come la vedono tutti: il pacco resta coperto (nome, emoji e fascia) finché qualcuno non lo vince
  function vistaCarta(c) {
    if (!c) return null;
    if (c.pacco) return { nome: "Pacco a sorpresa", emoji: "🎁", tier: "x", pacco: true };
    var v = { nome: c.nome, emoji: c.emoji, tier: c.tier };
    if (c.bonus) v.bonus = { nome: c.bonus.nome, emoji: c.bonus.emoji };
    return v;
  }
  function nomeLotto(c) { return c.bonus ? c.nome + " + " + c.bonus.nome : c.nome; }
  // le carte che vanno nel kit: il lotto doppio ne dà due, il pacco si scopre (col segno 🎁); il prezzo resta sulla prima
  function carteVinte(c, prezzo) {
    var a = { nome: c.nome, emoji: c.emoji, tier: c.tier, prezzo: prezzo || 0 };
    if (c.pacco) a.pacco = true;
    var out = [a];
    if (c.bonus) out.push({ nome: c.bonus.nome, emoji: c.bonus.emoji, tier: c.bonus.tier, prezzo: 0, bonus: true });
    return out;
  }
  function emLotto(el, cls, c) {   // l'emoji della carta; nel lotto doppio con la seconda emoji piccola nell'angolo
    var n = el("span", icoAttr(cls, c.emoji));
    if (c.bonus) { n.classList.add("as-em2"); n.appendChild(el("span", icoAttr("b", c.bonus.emoji))); }
    return n;
  }
  function segnoKit(el, c) { return c.pacco ? el("span", { class: "pk", text: "🎁" }) : c.bonus ? el("span", { class: "pk", text: "📦" }) : null; }

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
  function strisciaRound(el, rounds, idx, tipi) {
    var box = el("div", { class: "as-steps" });
    (rounds || []).forEach(function (r, i) {
      var tipo = tipoDi(tipi, i);
      box.appendChild(el("div", { class: "as-step" + (i === idx ? " ora" : (i < idx ? " fatto" : "")) }, [
        (i < idx ? el("span", { class: "sk", text: "✓" }) : null),
        el("span", { class: "si", text: r.icona || "" }),
        el("span", { class: "sn", text: r.nome || "" }),
        tipo !== "normale" ? el("span", { class: "st2", text: INFO_TIPO[tipo].icona, title: INFO_TIPO[tipo].nome }) : null   // ✉️ 📦 🎁
      ]));
    });
    return box;
  }
  // la presentazione del tipo di round (all'inizio del round, uguale sullo stesso telefono e online)
  function nodoTipo(el, tipo) {
    if (!tipo || tipo === "normale") return null;
    var I = INFO_TIPO[tipo];
    return el("div", {}, [ el("div", { class: "as-tipo", text: I.icona + " " + I.nome }), el("p", { class: "as-tipo-spiega", text: I.spiega }) ]);
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
      c = vistaCarta(c);
      var ora = (c.nome === nomeCorrente);
      box.appendChild(el("div", { class: "pr" + (ora ? " ora-c" : "") }, [
        emLotto(el, "em", c),
        el("span", { class: "nm", text: nomeLotto(c) + (ora ? " · all'asta ora" : "") }),
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
    wrap.appendChild(strisciaRound(el, st.tema.round, st.roundIdx, st.tipi));
    return wrap;
  }

  // 🔨 L'ASTA e ⚽ LA MINI ASTA FANTACALCIO: due tessere, due giochi (29 ott 2026, il proprietario: «due giochi separati in prima
  // schermata… il motore dell'asta non va copiato due volte»). Stesso motore, stesse coppe e statistiche (sotto «asta»); la stanza del
  // fantacalcio si apre col nome «astafanta» (il codice porta al gioco giusto) e un link vecchio «gioco=asta» del fanta apre il fanta
  // lo stesso (la foto dell'host dice il formato)
  var REGOLE_TEMI = [
      "Un solo telefono <b>appoggiato al tavolo</b>: tutti vedono le carte e ognuno tocca il proprio tasto.",
      "Si giocano <b>4 round</b> a tema. In ogni round sul tavolo ci sono tante carte quanti sono i giocatori e <b>ognuno se ne aggiudica una</b>.",
      "A turno uno sceglie quale carta mettere all'asta: parte da <b>1 credito</b>. Gli altri possono <b>rilanciare</b> o <b>passare</b>. Si rilancia <b>a salto</b>: <b>+1</b> o <b>+3</b> (sullo stesso telefono scegli il salto e tocchi il tuo avatar).",
      "Dopo ogni rilancio partono <b>10 secondi</b>: allo scadere la carta va a chi ha l'offerta più alta. <b>Paga solo il vincitore.</b> Chi ha già l'offerta più alta <b>può rialzare da solo</b> (tocca di nuovo il suo avatar): è strategia, così chi ha pochi crediti non ci arriva più.",
      "Attenzione: devi tenere <b>almeno 1 credito per ogni round che resta</b>, altrimenti rimani a piedi. Sotto ogni avatar si leggono i crediti e <b>fin dove può arrivare</b>.",
      "<b>🎭 Quattro round diversi</b> (si spengono nel ⚙️): 1° <b>🔨 normale</b>; 2° <b>✉️ busta chiusa</b> (tutti scrivono in segreto quanto offrono e si aprono le buste insieme: vince l'offerta più alta, a pari offerta chi ha chiuso prima; chi ha scelto la carta offre almeno 1); 3° <b>📦 lotto doppio</b> (un lotto ha 2 carte: chi lo vince le prende tutte e due); 4° <b>🎁 pacco a sorpresa</b> (una carta è coperta: si scopre solo quando qualcuno la vince).",
      "Alla fine esce la <b>carta-scenario</b> (per esempio «Gli zombie sfondano la porta: chi arriva vivo a domani?»): ognuno dà con un tocco la sua <b>⭐ al kit che se la cava meglio</b> (non il suo). Vince chi raccoglie più stelle; a pari stelle il kit che <b>vale di più</b> (le fasce svelate: A 3, B 2, C 1), poi chi ha <b>più crediti avanzati</b>.",
      "<b>🧨 La carta maledetta</b> (se l'host la accende): una volta a partita, nel 2° o nel 3° round, esce una carta che <b>nessuno vuole</b>. A turno ognuno sceglie: <b>💸 paga</b> 1 credito in più dell'ultimo per scansarla, oppure <b>😩 se la prende</b>. Chi non decide in tempo se la prende. Il <b>primo che se la prende</b> la mette nel kit e non paga niente; <b>tutti gli altri pagano</b> quello che hanno offerto. Nel voto finale chi ce l'ha perde <b>mezza stella</b> (🧨 −0,5 ⭐).",
      "A fine partita i <b>titoli scherzosi</b> (non sono trofei): 💸 lo sprecone, 🧊 il braccino corto, 🎯 il cecchino dell'ultimo secondo… e con <b>📸</b> mandi la foto del tuo kit nel gruppo."
  ];
  var REGOLE_FANTA = [
      "Un solo telefono <b>appoggiato al tavolo</b>: tutti vedono il maxischermo e ognuno offre toccando <b>la sua faccina</b> in panchina. Online ognuno offre dal suo telefono.",
      "<b>20 crediti</b> a testa per una rosa da 5 (1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante). I calciatori escono a caso uno alla volta e partono da <b>1 credito</b>; si offre a salto: <b>+1</b>, <b>+2</b> o <b>+5</b>. Ci sono <b>6 secondi</b> per la prima offerta e <b>8</b> dopo ogni rilancio, poi chi offre di più se lo prende. Se nessuno lo vuole <b>torna in fondo al mazzo</b> e si va avanti; solo quando tutti quelli rimasti di un ruolo sono stati rifiutati <b>2 volte</b>, vanno a caso a chi ne ha ancora bisogno.",
      "Chi ha già l'offerta più alta <b>può rialzare da solo</b> (tocca di nuovo la sua faccina, o il tasto): è strategia, così chi ha pochi crediti non ci arriva più. Sotto ogni squadra si leggono i crediti e <b>fin dove può arrivare</b>.",
      "Sul maxischermo, accanto al calciatore all'asta: <b>🎯 RIGORISTA</b> (anche 2° o 3°), <b>🦶 BATTITORE</b> (punizioni) e <b>🚩 ANGOLI</b>, quelli veri di quest'anno.",
      "Alla fine si scoprono le <b>quotazioni vere</b> dei calciatori, dalla rosa che vale meno a quella che vale di più. Poi si gioca <b>⚽ una giornata di Serie A finta</b>, come nel fantacalcio vero: i vostri calciatori non giocano tra di loro, ognuno gioca con la sua squadra contro chi capita (le 20 squadre si sorteggiano; i risultati dipendono da attacco e difesa veri dell'anno scorso). I gol li segnano soprattutto i più quotati e gli attaccanti; i rigori li tirano i <b>🎯 rigoristi</b> di quest'anno (all'asta c'è la scritta sul maxischermo); i cartellini dipendono da quanti ne ha presi davvero ognuno. Chi comprate gioca sempre. Tutti partono da 6 in pagella (il portiere di solito resta a 6), poi voti e bonus come nel fantacalcio: <b>gol +3</b>, <b>assist +1</b>, <b>giallo −0,5</b>, <b>rosso −1</b>, <b>rigore sbagliato −3</b>, <b>autogol −2</b>; per il portiere <b>gol subito −1</b>, <b>porta inviolata +1</b>, <b>rigore parato +3</b>. Sul campo si vedono con calma i momenti dei vostri calciatori (anche i pali e le parate), col nome e la faccina di chi li ha comprati; a fine primo tempo e al fischio finale arrivano le pagelle. Vince chi fa <b>più fantapunti</b> (a pari punti la rosa che vale di più, poi chi ha più crediti avanzati).",
      "La giornata si spegne nel ⚙️: allora vince la rosa che <b>vale di più</b> (a pari valore chi ha <b>più crediti avanzati</b>).",
      "A fine partita i <b>titoli scherzosi</b> (non sono trofei): 💸 lo sprecone, 🧊 il braccino corto, 🎯 il cecchino dell'ultimo secondo… e con <b>📸</b> mandi la foto della tua rosa nel gruppo."
  ];
  function giocoAsta(f) { return {
    id: f === "fanta" ? "astafanta" : "asta",
    nome: f === "fanta" ? "Mini Asta Fantacalcio" : "L'Asta",
    icona: f === "fanta" ? "⚽" : "🔨",
    descrizione: f === "fanta" ? "Compra all'asta 5 calciatori veri di Serie A, poi gioca la giornata: vince chi fa più fantapunti."
      : "Compra all'asta le carte migliori e costruisci il kit che gli altri voteranno.",
    giocatoriMin: 2,
    provaDaSolo: true,   // il proprietario (IL PAPPONE) la prova da solo sullo stesso telefono
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: f === "fanta" ? "In mezzo al tavolo: ognuno tocca la sua faccina" : "Vi passate il telefono per rilanciare", amici: true }],
    giocatoriMax: MAX_GIOCATORI,
    postiOnline: MAX_GIOCATORI,   // posti online (10)
    ritardatari: "partita",   // chi arriva ad asta cominciata la guarda ed entra alla prossima partita
    riprende: true,   // se l'host ricarica a metà partita, la partita riprende (il lotto all'asta riparte da capo, nessuno paga niente)
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    // le regole in una riga, per la saletta: "🎁 Temi classici · Vacanze · 15 crediti" o "⚽ Mini asta Fantacalcio · 20 crediti" (di partenza: quello della tessera)
    riassunto: function (imp) {
      imp = imp || {};
      if ((imp.formato || f) === "fanta") return "⚽ Mini asta Fantacalcio · " + FANTA_BUDGET + " crediti · rosa da 5 · rilanci +1 +2 +5" + (imp.giornata === false ? " · vince la rosa che vale di più" : " · poi la giornata ⚽");
      var temi = window.SG_ASTA_TEMI || [], tm = temi.filter(function (x) { return x.id === imp.tema; })[0] || temi[0];
      return "🎁 Temi classici" + (tm ? " · " + tm.icona + " " + tm.nome : "") + " · " + (imp.crediti || 15) + " crediti" +
        (imp.round === "normali" ? " · 🔨 round tutti normali" : " · 🎭 round ✉️ 📦 🎁") + (imp.maledetta ? " · 🧨 carta maledetta" : "");
    },
    difficolta: 3,   // Difficile — vale di più nel torneo (1 facile, 2 media, 3 difficile)

    regole: f === "fanta" ? REGOLE_FANTA : REGOLE_TEMI,

    impostazioni: function (box, dove, aiuti) {   // (f: "temi" per L'Asta, "fanta" per la Mini Asta Fantacalcio)
      var el = aiuti.el;
      dove.modo = "telefono";
      dove.formato = f;
      dove.crediti = f === "fanta" ? FANTA_BUDGET : 15;
      dove._creditiTemi = 15;

      dove.maledetta = dove.maledetta === true;   // (riaprendo «⚙️ Regole» resta com'era; di base No)
      dove.round = dove.round === "normali" ? "normali" : "misti";   // (di base i 4 round diversi)
      dove.giornata = dove.giornata !== false;   // ⚽ la giornata dopo l'asta (fantacalcio): di base sì
      // contenitori che compaiono/spariscono in base alla modalità scelta
      var wrapCrediti = el("div", {}), wrapTema = el("div", {}), wrapFanta = el("div", { hidden: "hidden" }), wrapMal = el("div", {}), wrapRound = el("div", {});

      // --- 🔨 L'Asta e ⚽ la Mini Asta Fantacalcio sono due giochi (29 ott 2026): qui si vede solo quello che serve al gioco della tessera ---
      function scegliFormato(f) {
        wrapCrediti.hidden = (f !== "temi");
        wrapTema.hidden = (f !== "temi");
        wrapMal.hidden = (f !== "temi");
        wrapRound.hidden = (f !== "temi");
        wrapFanta.hidden = (f !== "fanta");
      }

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
        if (f === "temi") dove.crediti = v;
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

      // --- 🎭 I round (solo Temi classici): 4 round diversi (normale, busta chiusa, lotto doppio, pacco a sorpresa) o tutti normali ---
      wrapRound.appendChild(el("div", { class: "etichetta", text: "🎭 I round" }));
      var bMisti, bNormali;
      function scegliRound(v) {
        dove.round = v;
        bMisti.className = "modo-chip" + (v === "misti" ? " attiva" : "");
        bNormali.className = "modo-chip" + (v === "normali" ? " attiva" : "");
      }
      bMisti = el("button", { class: "modo-chip", onclick: function () { scegliRound("misti"); } }, [
        el("span", { class: "mi", text: "🎭" }), el("div", {}, [
          el("div", { class: "mt", text: "Tutti diversi" }), el("div", { class: "ms", text: "✉️ busta chiusa · 📦 lotto doppio · 🎁 pacco" })])]);
      bNormali = el("button", { class: "modo-chip", onclick: function () { scegliRound("normali"); } }, [
        el("span", { class: "mi", text: "🔨" }), el("div", {}, [
          el("div", { class: "mt", text: "Tutti normali" }), el("div", { class: "ms", text: "Sempre l'asta a rilanci" })])]);
      wrapRound.appendChild(el("div", { class: "modo-griglia" }, [bMisti, bNormali]));
      scegliRound(dove.round);
      box.appendChild(wrapRound);

      // --- 🧨 La carta maledetta (solo Temi classici): una carta che nessuno vuole, si paga per scansarla ---
      wrapMal.appendChild(el("div", { class: "etichetta", text: "🧨 La carta maledetta" }));
      var bMalSi, bMalNo;
      function scegliMal(v) {
        dove.maledetta = v;
        bMalSi.className = "modo-chip" + (v ? " attiva" : "");
        bMalNo.className = "modo-chip" + (!v ? " attiva" : "");
      }
      bMalSi = el("button", { class: "modo-chip", onclick: function () { scegliMal(true); } }, [
        el("span", { class: "mi", text: "🧨" }), el("div", {}, [
          el("div", { class: "mt", text: "Sì" }), el("div", { class: "ms", text: "Una volta: si paga per scansarla" })])]);
      bMalNo = el("button", { class: "modo-chip attiva", onclick: function () { scegliMal(false); } }, [
        el("span", { class: "mi", text: "🙂" }), el("div", {}, [
          el("div", { class: "mt", text: "No" }), el("div", { class: "ms", text: "Solo carte buone" })])]);
      wrapMal.appendChild(el("div", { class: "modo-griglia" }, [bMalSi, bMalNo]));
      scegliMal(dove.maledetta);
      box.appendChild(wrapMal);

      // --- Nota Fantacalcio e ⚽ la giornata dopo l'asta (solo modalità Fantacalcio) ---
      wrapFanta.appendChild(el("div", { class: "link-avviso",
        text: "⚽ 20 crediti a testa · rosa da 5 (1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante). I calciatori escono dal mazzo uno alla volta, in ordine tutto a caso, e si rilancia di +1, +2 o +5. Alla fine si scoprono le quotazioni vere." }));
      wrapFanta.appendChild(el("div", { class: "etichetta", text: "⚽ La giornata dopo l'asta" }));
      var bGioSi, bGioNo;
      function scegliGio(v) {
        dove.giornata = v;
        bGioSi.className = "modo-chip" + (v ? " attiva" : "");
        bGioNo.className = "modo-chip" + (!v ? " attiva" : "");
      }
      bGioSi = el("button", { class: "modo-chip", onclick: function () { scegliGio(true); } }, [
        el("span", { class: "mi", text: "⚽" }), el("div", {}, [
          el("div", { class: "mt", text: "Sì" }), el("div", { class: "ms", text: "Vince chi fa più fantapunti" })])]);
      bGioNo = el("button", { class: "modo-chip", onclick: function () { scegliGio(false); } }, [
        el("span", { class: "mi", text: "💎" }), el("div", {}, [
          el("div", { class: "mt", text: "No" }), el("div", { class: "ms", text: "Vince la rosa che vale di più" })])]);
      wrapFanta.appendChild(el("div", { class: "modo-griglia" }, [bGioSi, bGioNo]));
      scegliGio(dove.giornata);
      box.appendChild(wrapFanta);
      scegliFormato(f);
    },

    avvia: function (t) {
      t._formato = f;   // (il gioco della tessera: le regole di prima, se dicono altro, vincono)
      // Chi entra da un link è sempre un ospite: la modalità (temi o
      // fantacalcio) la decide l'host e arriva dentro la "foto" (vm).
      if (t.linkParams && t.linkParams.stanza) return ospiteAsta(t, t.linkParams.stanza);
      PONTE = null;   // stanza nuova
      avviaAsta(t);
    }
  }; }
  var gioco = giocoAsta("temi"), giocoFanta = giocoAsta("fanta");

  // ⏱️ L'OROLOGIO DI CHI TIENE LA PARTITA (29 ott 2026, il proprietario: «gli amici sugli iPhone vedevano la giornata in ritardo
  // rispetto a me»). Gli orologi dei telefoni sono diversi: ogni amico misura di quanto il suo è avanti o indietro rispetto a quello
  // dell'host con un botta e risposta ({ t: "ora", c } → { t: "ora", a, c, h }) e tiene il viaggio più corto (il più preciso).
  var OROLOGIO = { off: 0, misurato: false, campioni: [], di: null, rtt: null, da: 0 };
  function oraHost() { return Date.now() + OROLOGIO.off; }
  function azzeraOrologio(di) { OROLOGIO = { off: 0, misurato: false, campioni: [], di: di || null, rtt: null, da: Date.now() }; }   // (da: le risposte a domande fatte prima non valgono: erano per l'orologio di prima)
  function campioneOra(c, h) {   // c: quando ho chiesto (ora mia), h: l'ora dell'host quando ha risposto
    var ora = Date.now(), rtt = ora - c; if (!(rtt >= 0 && rtt < 8000) || typeof h !== "number" || c < OROLOGIO.da) return;
    OROLOGIO.campioni.push({ rtt: rtt, off: h + rtt / 2 - ora });
    if (OROLOGIO.campioni.length > 16) OROLOGIO.campioni.shift();
    var b = OROLOGIO.campioni.reduce(function (a, x) { return !a || x.rtt < a.rtt ? x : a; }, null);
    OROLOGIO.off = b.off; OROLOGIO.rtt = b.rtt; OROLOGIO.misurato = true;
  }
  function stimaOra(h) {   // (prima del botta e risposta: l'ora scritta nella foto; una foto vecchia, come quella trattenuta che arriva per prima, è più indietro: si tiene la più avanti)
    if (OROLOGIO.misurato || typeof h !== "number") return;
    var o = h - Date.now(); if (OROLOGIO.stima == null || o > OROLOGIO.stima) { OROLOGIO.stima = o; OROLOGIO.off = o; }
  }
  function proprietario(t) { return !!(t && t.nomeProfilo && String(t.nomeProfilo() || "").trim().toUpperCase() === "IL PAPPONE"); }   // (la scritta di prova la vede solo lui)
  // ⏱️ IL PIANO DOPO L'ASTA: tutto quello che si vede (le rose che si scoprono, la giornata, le pagelle) ha un'ora precisa, scritta
  // sull'orologio di chi tiene la partita: cron = { t0: quando comincia, seg: [[h, g, v]] (da h si corre a velocità v: 1, o 2 col ⏩;
  // g = il «tempo di gioco» in quel momento), salta: (chi tiene la partita ha saltato le rose) }. Ogni telefono fa ogni cosa quando
  // arriva la sua ora (sul tempo di gioco, uguale per tutti): chi è in ritardo (rete lenta, iPhone che rallenta, pagina ricaricata)
  // recupera da solo, in silenzio, e nessuno vede come va a finire prima degli altri, host compreso.
  var PARTENZA_MS = 2000, ANTICIPO_PASSO = 700;   // (la classifica parte 2 s dopo la fine dell'asta; un «Avanti ▶», il ⏩ e «Salta» valgono per tutti 0,7 s dopo il tocco)
  function velPref() { try { return localStorage.getItem("sg-asta-veloce") === "1" ? 2 : 1; } catch (e) { return 1; } }
  function pianoNuovo(h, v) { return { t0: h, seg: [[h, 0, v || 1]] }; }
  function segDi(cron, h) { var s = cron.seg, x = s[0]; for (var i = 1; i < s.length; i++) if (s[i][0] <= h) x = s[i]; return x; }
  function tempoGioco(cron, h) { var x = segDi(cron, h); return x[1] + (h - x[0]) * x[2]; }
  function aggiungiVel(cron, h, v) { var g = tempoGioco(cron, h); cron.seg = cron.seg.filter(function (x) { return x[0] < h; }).concat([[h, g, v]]); }
  function spostaPiano(st, f) {   // (il vice che prende il posto: le ore scritte col telefono di prima diventano ore sue)
    var c = st.cron; c.t0 = f(c.t0); c.seg.forEach(function (x) { x[0] = f(x[0]); }); if (c.salta) c.salta = f(c.salta);
    var H = st.passi && st.passi.h; if (H) Object.keys(H).forEach(function (k) { H[k].forEach(function (x) { x[1] = f(x[1]); }); });
  }
  function cercaPasso(R, quale, n) {   // l'ora del primo passo di chi tiene la partita che arriva fino a n (le pagine cambiano coi telefoni: si conta)
    var l = (((R.opz.passi || {}).h) || {})[quale] || [];
    for (var i = 0; i < l.length; i++) if (l[i][0] >= n) return l[i][1];
    return null;
  }
  function avviaPiano(R) {   // il «direttore» del piano: un orologio solo che fa ogni cosa quando arriva la sua ora
    R.coda = []; R.pt = 0; R.attese = {};
    R.ora = R.opz.cron ? oraHost : function () { return Date.now(); };
    R.cron = R.opz.cron || pianoNuovo(Date.now(), velPref());
    R.g = function () { return tempoGioco(R.cron, R.ora()); };
    function metti(g, fn) { var i = R.coda.length; while (i > 0 && R.coda[i - 1].g > g) i--; R.coda.splice(i, 0, { g: g, fn: fn }); }
    R.dopo = function (ms, fn) { metti(R.pt + ms, fn); };   // (ms dopo l'ora di quello che sto facendo adesso: mai dopo «adesso»)
    R.alleOra = function (h, fn) { metti(tempoGioco(R.cron, h), fn); };   // (a un'ora dell'host: un «Avanti ▶», «Salta»)
    R.nato = Date.now();
    R.tic = function () {
      if (!vivoRivela(R)) { if (R.dir) clearInterval(R.dir); R.dir = null; return; }
      if (R.opz.cron && !R.opz.onSalta && !OROLOGIO.misurato && Date.now() - R.nato < 3000) return;   // (amico appena arrivato: prima si misura l'orologio, al massimo 3 secondi)
      var g = R.g(), giri = 0;
      while (R.coda.length && R.coda[0].g <= g && giri++ < 4000) { var x = R.coda.shift(); R.pt = x.g; try { x.fn(); } catch (e) { if (window.console) console.error(e); } }
      var v = segDi(R.cron, R.ora())[2];
      if (v !== R.velVista && R.velB) { R.velVista = v; R.velB.textContent = v === 2 ? "⏩ ×2" : "⏩"; R.velB.classList.toggle("on", v === 2); }
      if (R.provaN && (!R.provaT || Date.now() - R.provaT > 90)) { R.provaT = Date.now(); scrittaProva(R); }
    };
    R.dir = setInterval(R.tic, 25);
  }
  function inRitardo(R, ms) { return R.g() - R.pt > (ms || 900); }   // (sto recuperando: niente suoni né vibrazioni)
  function provaPiano(R, cosa) { try { if (window.SG_PROVA_PIANO) window.SG_PROVA_PIANO(cosa, R.g(), { off: OROLOGIO.off, rtt: OROLOGIO.rtt, mis: OROLOGIO.misurato, di: OROLOGIO.di, host: !!R.opz.onSalta }); } catch (e) {} }   // (solo le prove nel browser)
  // 🧪 la scritta di prova (solo per IL PAPPONE): il tempo di gioco e il momento, uguali su tutti i telefoni; accanto lo scarto dell'orologio
  function scrittaProva(R) {
    var g = Math.max(0, R.g()), m = Math.floor(g / 60000), sec = (g % 60000) / 1000;
    R.provaN.textContent = "⏱ " + m + ":" + (sec < 10 ? "0" : "") + sec.toFixed(1).replace(".", ",") + " · " + (R.provaM || "–") + " · " +
      (!R.opz.cron ? "un telefono" : R.opz.onSalta ? "host" : OROLOGIO.misurato ? "orologio ±" + Math.round((OROLOGIO.rtt || 0) / 2) + " ms" : "orologio…");
  }
  // ---- la stanza dell'host resta la stessa anche se in saletta cambi modalità (temi <-> fantacalcio):
  //      il nuovo "motore" riceve la stessa stanza e chi era già entrato, senza che gli amici escano ----
  var PONTE = null;   // { vera, cb, codice, pronta, entrati: [{ id, m }], maniglia }
  // (opz: { ripresa } la prima volta, quando la partita riprende dopo una ricarica dell'host)
  function ospitaAsta(cb, opz, gid) {
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
    P.vera = SGNet.ospita(gid || "asta", {
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

  // 🔨 L'Asta (i temi) e ⚽ la Mini Asta Fantacalcio sono due giochi (29 ott 2026) con lo stesso motore: il gioco lo dicono le regole
  // (formato, anche quelle ricordate da prima, quando era un gioco solo), se no la tessera da cui si è partiti (t._formato)
  function formatoDi(t, im) { var f = im && im.formato; return f === "fanta" || f === "temi" ? f : (t && t._formato) || "temi"; }

  function avviaAsta(t) {
      pulisciCache();
      var formato = formatoDi(t, t.impostazioni);
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
        tipi: tipiPartita(t.impostazioni), salto: 1,   // 🎭 i round diversi; di quanto rilancia chi tocca il suo avatar
        malPiano: t.impostazioni && t.impostazioni.maledetta ? pianoMaledetta(t.giocatori.length) : null,   // 🧨 la carta maledetta (regola dell'host)
        giocatori: t.giocatori.map(function (n) { return { nome: n, crediti: crediti, kit: [], stelle: 0, asteVinte: 0, st: statNuove(), omino: ominoLocale(n) }; })
      };
      iniziaRound(t, st);
  }
  // i numeri per i titoli scherzosi di fine partita
  function statNuove() { return { rilanci: 0, salti: 0, cecchino: 0, affari: 0, maxPrezzo: 0, maxCarta: "" }; }
  function segnaRilancio(g, salto, grosso, ultimoSec) { if (!g) return; g.st = g.st || statNuove(); g.st.rilanci++; if (salto >= grosso) g.st.salti++; }
  function segnaVinta(g, prezzo, carta, cecchino, automatica) {
    if (!g) return; g.st = g.st || statNuove();
    if (cecchino) g.st.cecchino++;
    if (prezzo === 1 && !automatica) g.st.affari++;
    if (prezzo > g.st.maxPrezzo) { g.st.maxPrezzo = prezzo; g.st.maxCarta = carta ? (carta.pacco ? "il pacco a sorpresa" : carta.nome) : ""; }
  }

  // ---- il banditore (e lo speaker dello stadio) che sfotte ----
  function aCaso(l) { return l[Math.floor(Math.random() * l.length)]; }
  // un rilancio: rialzo da solo, follia (oltre metà dei crediti di partenza), salto grosso; null = la frase di sempre
  function battutaOfferta(chi, prezzo, prima, stesso, budget, grosso) {
    if (prima == null) return null;
    var salto = prezzo - prima;
    if (budget && prezzo > budget / 2 && prima <= budget / 2) return aCaso(["Follia! " + prezzo + " da " + chi + "!", prezzo + "?! " + chi + " ha perso la testa!", "Follia pura: " + prezzo + " a " + chi + "!"]);
    if (stesso) return aCaso([chi + " rialza da solo: " + prezzo + "! Lo vuole proprio!", chi + " rilancia su se stesso: " + prezzo + "! 😂", "Ancora " + chi + "! " + prezzo + ", chi lo ferma?"]);
    if (salto >= grosso) return aCaso(["Salto di " + salto + "! " + chi + " non scherza: " + prezzo + "!", "Boom! +" + salto + " da " + chi + ": " + prezzo + "!"]);
    return null;
  }
  function battutaAggiudica(chi, prezzo, budget) {
    if (prezzo === 1) return aCaso(["Regalato! A " + chi + " per 1!", "Un affare! " + chi + " lo porta via per 1!"]);
    if (budget && prezzo > budget / 2) return aCaso(["Follia! Aggiudicato a " + chi + " per " + prezzo + "!", "Aggiudicato a " + chi + " per " + prezzo + ": che follia!"]);
    return "Aggiudicato a " + chi + " per " + prezzo + "!";
  }
  // fantacalcio: due della stessa squadra nella stessa rosa, o il derby della città
  var DERBY = [["Inter", "Milan"], ["Roma", "Lazio"], ["Juventus", "Torino"], ["Genoa", "Sampdoria"]];
  function battutaRosa(chi, kit, carta) {
    if (!carta || !kit) return null;
    var stessa = kit.filter(function (c) { return c.squadra === carta.squadra; }).length;
    if (stessa >= 2) return "Doppietta " + carta.squadra + "! " + chi + " ne ha " + stessa + "!";
    for (var i = 0; i < DERBY.length; i++) {
      var d = DERBY[i], k = d.indexOf(carta.squadra);
      if (k >= 0 && kit.some(function (c) { return c.squadra === d[1 - k]; })) return "Derby in casa " + chi + ": " + d[0] + " e " + d[1] + "!";
    }
    return null;
  }

  function niente(t, msg) {
    var s = t.schermata({ chiara: true, icona: "🔨", titolo: "L'Asta", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: msg, style: "font-size:1.05rem;margin-top:44px" }));   // (senza titolo: sotto il ‹ in alto a sinistra)
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---- inizio round ----
  function iniziaRound(t, st) {
    var el = t.el;
    var r = st.tema.round[st.roundIdx], tipo = tipoDi(st.tipi, st.roundIdx);
    st.tavolo = tavoloRound(r, st.giocatori.length, st.tema.id, tipo);
    st.senzaCarta = st.giocatori.map(function (_, i) { return i; });
    st.chooserPtr = st.roundIdx; // ruota chi sceglie per primo a ogni round
    FX.round();

    var s = t.schermata({}), ms = tipo === "normale" ? AUTO_ROUND_MS : AUTO_ROUND_TIPO_MS;   // (un round speciale resta di più: c'è da leggere come si gioca)
    var box = el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:10px" }, [
      el("div", { style: "font-size:4rem;line-height:1", text: r.icona }),
      el("div", { class: "as-round" }, [
        el("div", { class: "n", text: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND }),
        el("div", { class: "t", text: r.nome })
      ]),
      nodoTipo(el, tipo),
      el("p", { class: "as-msg", text: "Sul tavolo " + st.tavolo.length + (st.tavolo.length === 1 ? " lotto" : " lotti") + ": ognuno se ne aggiudica uno." })
    ]);
    s._contenuto.appendChild(box);
    s._contenuto.appendChild(strisciaRound(el, st.tema.round, st.roundIdx, st.tipi));
    var vai = autoAvanti(st, s, function () { prossimaAsta(t, st); }, ms);
    s._piede.appendChild(tastoAuto(el, "Vedi le carte ▶", ms, vai));
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
    if (st.finita) return;
    if (devoMaledetta(st)) return apriMaledetta(t, st);   // 🧨 tocca alla carta maledetta (una volta a partita)
    if (st.senzaCarta.length === 0) return fineRound(t, st);
    if (st.senzaCarta.length === 1 && st.tavolo.length === 1) {
      var i = st.senzaCarta[0], carta = st.tavolo[0];
      st.giocatori[i].crediti -= 1;
      Array.prototype.push.apply(st.giocatori[i].kit, carteVinte(carta, 1));
      st.tavolo = []; st.senzaCarta = [];
      return esitoAsta(t, st, i, carta, 1, { automatica: true });
    }
    schermataScelta(t, st);
  }

  // ---- 🧨 la carta maledetta (stesso telefono): i giocatori sono gli indici 0, 1, 2… ----
  function devoMaledetta(st) { var P = st.malPiano; return !!(P && !P.fatta && st.roundIdx === P.round && st.senzaCarta.length <= P.quando); }
  // quanto può offrire per scansarla: tiene 1 credito per ogni round che resta e, se non ha ancora la carta di questo round, 1 anche per quella
  function maxMal(st, i) { return maxPuntata(st, i) - (st.senzaCarta.indexOf(i) >= 0 ? 1 : 0); }
  function chiMal(st) { var M = st.malA; return M.ordine[M.turno % M.ordine.length]; }
  function apriMaledetta(t, st) {
    st.malPiano.fatta = true;
    var carta = cartaMaledetta(); if (!carta) return prossimaAsta(t, st);
    var n = st.giocatori.length, da = Math.floor(Math.random() * n), ordine = [];
    for (var i = 0; i < n; i++) ordine.push((da + i) % n);   // si comincia da uno a caso
    st.malA = { carta: carta, ordine: ordine, turno: 0, offerte: {}, prezzo: 0, giro: 0 };
    FX.maledetta();
    turnoMal(t, st);
  }
  function turnoMal(t, st) {
    var M = st.malA; if (!M || st.finita) return;
    var k = chiMal(st), forz = maxMal(st, k) < M.prezzo + 1, ms = forz ? MAL_MS_FORZATO : MAL_MS_TEL;
    M.giro++; M.scad = Date.now() + ms; M.durata = ms; M.forzato = forz;
    clearTimeout(st.malTo);
    st.malTo = setTimeout(function () { if (st.malA === M && !st.finita) prendeMal(t, st, k, true); }, ms);   // tempo scaduto: se la prende
    var persone = st.giocatori.map(function (g, i) { return { id: i, nome: g.nome, offerta: M.offerte[i] || 0, crediti: g.crediti }; });
    salaMal(t, { chiave: "tm|" + st.sessione, info: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND, carta: M.carta, prezzo: M.prezzo,
      persone: persone, turnoId: k, forzato: forz, giro: M.giro, resta: ms, durata: ms, io: null,
      onPaga: function (i) { pagaMal(t, st, i); }, onPrendo: function (i) { prendeMal(t, st, i, false); }, onIndietro: function () { esciAsta(t, st); } });
  }
  function pagaMal(t, st, k) {
    var M = st.malA; if (!M || chiMal(st) !== k || M.forzato || maxMal(st, k) < M.prezzo + 1) return;
    M.prezzo++; M.offerte[k] = M.prezzo; M.turno++;
    FX.rilancio(false);
    turnoMal(t, st);
  }
  function prendeMal(t, st, k, scaduto) {
    var M = st.malA; if (!M || chiMal(st) !== k) return;
    clearTimeout(st.malTo); st.malTo = null; st.malA = null;
    var paga = [];
    st.giocatori.forEach(function (g, i) { var q = M.offerte[i] || 0; if (i !== k && q > 0) { g.crediti -= q; paga.push({ id: i, nome: g.nome, quanto: q }); } });   // gli altri pagano quello che hanno offerto
    st.giocatori[k].kit.push(M.carta);   // chi se la prende non paga niente
    fermaMal();
    var el = t.el, s = t.schermata({});
    s._contenuto.appendChild(intestazioneRound(el, st));
    s._contenuto.appendChild(strisciaCrediti(el, st, k));
    nodiEsitoMal(el, { chiNome: st.giocatori[k].nome, carta: M.carta, paga: paga, ripresa: M.offerte[k] || 0, scaduto: scaduto }, null).forEach(function (n) { s._contenuto.appendChild(n); });
    FX.aggiudicato(); vibra([40, 60, 40]);   // un momento che conta
    var vai = autoAvanti(st, s, function () { prossimaAsta(t, st); }, AUTO_MAL_MS);
    s._piede.appendChild(tastoAuto(el, "Avanti ▶", AUTO_MAL_MS, vai));
    t.mostra(s);
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
    st.tavolo.forEach(function (c, idx) { g.appendChild(bottoneCarta(el, vistaCarta(c), function () { apriAsta(t, st, chi, idx); })); });
    s._contenuto.appendChild(g);
    t.mostra(s);
  }
  // una carta da scegliere (c è già "vista": il pacco è coperto); il lotto doppio ha il contorno giallo e «📦 2 carte»
  function bottoneCarta(el, c, onclick) {
    return el("button", { class: "as-carta" + (c.pacco ? " pacco" : c.bonus ? " doppio" : ""), onclick: onclick }, [
      emLotto(el, "em", c),
      el("span", { class: "nm", text: nomeLotto(c) }),
      c.pacco ? el("span", { class: "bx", text: "🎁 ?" }) : c.bonus ? el("span", { class: "bx", text: "📦 2 carte" }) : null,
      cellaTier(el, c.tier, false)
    ]);
  }

  // ---- asta su una carta ----
  function apriAsta(t, st, chooser, idxCarta) {
    if (tipoDi(st.tipi, st.roundIdx) === "busta") return bustaLocale(t, st, chooser, idxCarta);   // ✉️ busta chiusa: si offre in segreto
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
  // sullo stesso telefono chi ha il nome del profilo ha il SUO avatar (29 ott 2026, il proprietario: «il mio avatar è diverso da quello
  // del mio profilo»); gli altri quello che nasce dal nome, sempre uguale
  function ominoLocale(nome) {
    try { var p = window.SGNube && SGNube.profilo && SGNube.profilo(); if (p && p.omino && String(p.nome || "").trim().toLowerCase() === String(nome || "").trim().toLowerCase()) return p.omino; } catch (e) {}
    return null;
  }
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
  var LEGGIO_RIS = SVG0 + "viewBox='0 0 200 150'><path d='M10 20h180l-8 130H18z' fill='#5a2e16' stroke='#2e160a' stroke-width='5'/><rect x='4' y='6' width='192' height='18' rx='5' fill='#7a4423' stroke='#2e160a' stroke-width='4'/><rect x='30' y='44' width='140' height='70' rx='6' fill='#3e1f0e'/></svg>";
  function magliaRis(sq) {   // la maglia di riserva: i due colori della squadra
    var c = coloriSquadra(sq) || ["#adb5bd", "#868e96"];
    return SVG0 + "viewBox='0 0 100 100'><defs><linearGradient id='mr' x1='0' x2='1'><stop offset='.5' stop-color='" + c[0] + "'/><stop offset='.5' stop-color='" + c[1] + "'/></linearGradient></defs>" +
      "<path d='M35 12L10 26l8 19 10-5v50h44V40l10 5 8-19-25-14q-6 8-15 8t-15-8z' fill='url(#mr)' stroke='#1b1b1b' stroke-width='3.5' stroke-linejoin='round'/></svg>";
  }
  function maglia(sq) { return arte("maglia", magliaRis(sq), sq || "?"); }
  var PALLONE_RIS = SVG0 + "viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='#fff' stroke='#1b1b1b' stroke-width='3'/><path d='M50 34l14 10-5 16H41l-5-16z' fill='#1b1b1b'/><path d='M50 11v23M86 40l-22 4M73 83l-14-23M27 83l14-23M14 40l22 4' stroke='#1b1b1b' stroke-width='3'/></svg>";   // (il pallone della giornata)
  function banditore() {
    if (BANDITORE || !window.SGOmino) return BANDITORE;
    var c = SGOmino.casuale("Banditore d'asta");
    c.forma = "uomo"; c.capelli = "corti"; c.colCap = 1; c.capo = "giacca"; c.maglia = 7; c.collo = "papillon"; c.colCollo = 0; c.cappello = "nessuno"; c.occhiali = "tondi"; c.barba = "baffi";
    c.mano = "nessuno"; c.schiena = "nessuna"; c.animale = "nessuno"; c.stampa = "nessuna";
    try { c = SGOmino.norm(c); } catch (e) {}
    return (BANDITORE = c);
  }
  function trova(lista, id) { if (id == null) return null; for (var i = 0; i < (lista || []).length; i++) if (lista[i].id === id) return lista[i]; return null; }
  // fa ripartire un'animazione: la classe si toglie subito e torna due fotogrammi dopo (così l'animazione riparte da capo) senza
  // costringere il telefono a ricalcolare tutta la pagina a ogni rilancio (era il punto più pesante dell'asta)
  function rianima(n, cls, testo) {
    if (testo != null) n.textContent = testo;
    n.classList.remove(cls); var tok = n.__rianima = (n.__rianima || 0) + 1;
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (n.__rianima === tok) n.classList.add(cls); }); });
  }
  function svuotaNodo(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  // ---- pezzi in comune tra la sala e lo stadio ----
  // quanti nella fila davanti e in quella dietro: nella sala dai 3 in su c'è chi sta più avanti e chi più indietro
  function fileSala(n) { if (n <= 2) return [n]; var d = Math.ceil(n / 2); return [d, n - d]; }
  // una persona del pubblico: la sedia dietro, l'avatar seduto, la paletta col numero, la nuvoletta dell'offerta
  function personaAsta(el, S, p, sedia) {
    var cfg = cfgDi(p.nome, p.omino), m = manoAlzata(cfg);
    var paletta = el("div", { class: "sa-paletta", style: "left:" + (m.x / 2) + "%;top:" + (m.y / 2.64) + "%" }, [ el("span", { text: String(p.num) }) ]);
    var nuvola = el("div", { class: "sa-nuvola" }), nota = el("small"), manca = el("i", { class: "sa-manca" });
    var passo = tastoPasso(el, S, p);
    var nodo = el("div", { class: "sa-pers", role: "button", onclick: function () { toccaPersona(S, p.id); } }, [
      el("div", { class: "sa-figura" }, [ el("img", { class: "sa-sedia", src: sedia, alt: "" }), el("img", { class: "sa-av", src: srcAv(cfg, GIU), alt: "" }),
        el("img", { class: "sa-av sa-su", src: srcAv(cfg, SU), alt: "" }), paletta, nuvola, el("i", { class: "sa-num", text: String(p.num) }) ]),
      el("b", { text: p.nome.length > 9 ? p.nome.slice(0, 9) + "…" : p.nome }), nota, manca, passo
    ]);
    S.pers[p.id] = { nodo: nodo, nota: nota, manca: manca, passo: passo, nuvola: nuvola, puo: false };
    return nodo;
  }
  function tastoPasso(el, S, p) { return el("button", { class: "sa-passo", text: "passo", onclick: function (e) { e.stopPropagation(); S.ultimiDati.onPassa(p.id); } }); }
  function toccaPersona(S, id) {   // tocco sul proprio avatar: offro (sullo stesso telefono tutti, online solo il mio)
    var dd = S.ultimiDati, q = S.pers[id]; if ((dd.io == null || dd.io === id) && q && q.puo) dd.onRilancia(id);
  }
  function pubblico(el, S, persone, sedia, cls) {   // le file del pubblico: davanti i primi numeri, dietro (più piccoli) gli altri
    var file = el("div", { class: "sa-file" }), box = el("div", { class: cls }, [ file ]), k = 0;
    fileSala(persone.length).map(function (quanti, r) {
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
  window.addEventListener("resize", function () { if (SALA) adattaPubblico(SALA.pubblico); if (STADIO) { adattaPubblico(STADIO.pubblico); misuraGriglia(STADIO); } if (RIVELA) misuraPalco(RIVELA); });
  function pulisciCache() { Object.keys(CACHE_AV).forEach(function (k) { if (k.indexOf("arte|") !== 0) delete CACHE_AV[k]; }); }   // le pose degli avatar della partita prima (i disegni fissi restano)
  function fermaTutto() { fermaConta(SALA); fermaConta(STADIO); fermaRivela(RIVELA); fermaMal(); fermaBus(); SALA = null; STADIO = null; RIVELA = null; }   // si esce dalla partita: niente più timer che ridisegnano
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
      var cls = "sa-pers" + (guida ? " guida" : "") + (fuori ? " fuori" : "") + (p.via ? " via" : "") + (mio ? " mio" : "") + (q.puo && (d.io == null || mio) ? " puo" : "");
      if (q.nodo.className.replace(/ salta/, "") !== cls) q.nodo.className = cls + (q.nodo.classList.contains("salta") ? " salta" : "");   // (si cambia solo quello che cambia)
      var nt = p.via ? "non c'è" : (p.nota || ""), mn = p.via ? "" : (p.manca || "");   // sotto: fin dove può arrivare (e nel fanta i posti che gli mancano)
      if (q.nota && q.nota.textContent !== nt) q.nota.textContent = nt;   // (nella panchina dello stadio ci sono solo le faccine)
      if (q.manca && q.manca.textContent !== mn) q.manca.textContent = mn;
      var conPasso = !fuori && !guida && d.puoPassare !== false;   // (stesso telefono: il posto del tasto resta, così le file non ballano)
      if (d.io == null) { q.passo.style.display = ""; q.passo.style.visibility = conPasso ? "" : "hidden"; } else q.passo.style.display = "none";
    });
  }
  function nuovaOfferta(S, d, dice) {   // chi ha appena rilanciato salta con la nuvoletta, e il banditore (o lo speaker) lo dice
    var capo = trova(d.persone, d.leader), chi = capo ? capo.nome : "";
    if (S.prezzo === undefined) dice(capo ? chi + " parte da " + d.prezzo + "! Chi offre di più?" : "Si parte da " + d.prezzo + "! Chi offre?");
    else if (d.leader != null && (d.leader !== S.leader || d.prezzo !== S.prezzo)) {
      var q = S.pers[d.leader];
      if (q) { rianima(q.nuvola, "via", (S.prezzo != null && d.prezzo - S.prezzo > 1 ? "+" + (d.prezzo - S.prezzo) + " → " : "") + d.prezzo + "!"); rianima(q.nodo, "salta"); }
      // il banditore sfotte: chi rialza da solo, la follia (oltre metà dei crediti), il salto grosso
      var b = S.leader != null ? battutaOfferta(chi, d.prezzo, S.prezzo, d.leader === S.leader, d.budget, d.grosso || 3) : null;
      dice(b || (S.leader == null ? chi + " lo prende a " + d.prezzo + "! Chi offre di più?"
        : [d.prezzo + " a " + chi + "!", d.prezzo + " da " + chi + "! Chi offre di più?", "Ho " + d.prezzo + " da " + chi + "!", d.prezzo + " a " + chi + ", e chi rilancia?"][d.prezzo % 4]));
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
  function piedeAsta(S, d) {   // la riga d'aiuto e i tasti (online solo per chi gioca da questo telefono; sullo stesso telefono il salto del rilancio)
    // i tasti si rifanno solo se cambiano (stessa chiave: cambia solo la scritta), così niente lampeggio
    if (d.kPiede != null && d.kPiede === S.kPiede && S.notaP && S.notaP.parentNode === S.piede) {
      if (S.notaP.textContent !== (d.nota || "")) S.notaP.textContent = d.nota || "";
      if (S.mie && S.mie._agg && d.mie && d.mie._o) S.mie._agg(d.mie._o);   // (online) stessi tasti, prezzi nuovi
      return;
    }
    S.kPiede = d.kPiede; S.mie = d.io != null ? d.mie : null;
    svuotaNodo(S.piede);
    var n = S.notaP = document.createElement("p"); n.className = "sa-nota"; n.textContent = d.nota || "";
    if (d.nota || d.kPiede != null) S.piede.appendChild(n);
    if (d.io == null && d.sel) S.piede.appendChild(d.sel);
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
    S.radice = el("div", { class: "schermata sa-sala" + (t.guarda ? " as-targa" : "") }, [ sfondo, testaAsta(el, S, d), S.pannello, S.avviso, el("div", { class: "sa-tempo" }, [ S.tempo ]),
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
    S.bolla.classList.toggle("conta", !!conta);
    // sul telefono piccolo il fumetto sopra la testa copriva il «passo» di chi siede in basso (29 ott 2026): se tocca un giocatore,
    // il fumetto va a destra della testa del banditore, nello spazio libero appena sopra la spiegazione
    S.bolla.classList.remove("lato"); S.bolla.style.bottom = ""; S.bolla.textContent = testo;
    var b = S.bolla.getBoundingClientRect();
    if (b.width && [].some.call(S.radice.querySelectorAll(".sa-pers"), function (p) { var r = p.getBoundingClientRect(); return r.width && b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top; })) {
      S.bolla.classList.add("lato");
      var ban = S.ban.getBoundingClientRect(), primo = [].filter.call(S.piede.children, function (c) { return c.getClientRects().length; })[0];
      if (primo && ban.height) S.bolla.style.bottom = Math.max(0, ban.bottom - primo.getBoundingClientRect().top + 4) + "px";
    }
    rianima(S.bolla, "via", testo);
  }
  function aggiudica(testo, poi, scritta) {   // il martello batte: "Aggiudicato!" (o un'altra scritta), poi si va avanti
    var S = SALA; if (!S || !document.body.contains(S.radice)) { SALA = null; return poi(); }   // (sala non a vista: niente martello, e niente giro senza fine)
    fermaConta(S); S.martello.classList.add("batte"); rianima(S.ban, "batte"); parlaBanditore(testo);
    S.radice.appendChild(timbro(scritta || "AGGIUDICATO!")); S.radice.classList.add("chiusa");
    SALA = null;
    setTimeout(poi, 1500);
  }

  // =========================================================
  //  🧨 LA CARTA MALEDETTA — l'asta al contrario (come in High Society), sullo stesso telefono e online.
  //  A turno: «💸 Pago N» (1 credito in più dell'ultima offerta) oppure «😩 Me la prendo»; chi non decide in tempo se la prende
  //  (negli ultimi 2 secondi «Uno… due…»). Il primo che se la prende la mette nel kit e si riprende la sua offerta;
  //  tutti gli altri pagano quello che hanno offerto. La schermata si fa una volta per carta e poi cambia solo quello che serve.
  // =========================================================
  var MAL = null;
  function fermaMal() { if (MAL) { MAL.conta.forEach(function (x) { clearTimeout(x); }); MAL.conta = []; } MAL = null; }
  // d: { chiave, info, carta, prezzo (l'ultima offerta), persone: [{ id, nome, offerta, crediti, via }], turnoId, forzato, giro, resta, durata,
  //      io (online: il mio id, "—" se guardo; null = stesso telefono: tocca chi è di turno), onPaga(id), onPrendo(id), onIndietro }
  function salaMal(t, d) {
    if (MAL && MAL.chiave === d.chiave && document.body.contains(MAL.s)) return aggMal(d);
    fermaMal();
    var el = t.el, M = { chiave: d.chiave, d: d, pers: {}, conta: [], giro: null, kPiede: null };
    var s = M.s = t.schermata({ indietro: function () { M.d.onIndietro(); } });
    s.classList.add("as-mal", "entra");
    if (d.persone.length > 6) s.classList.add("as-mal-fitta");
    M.info = el("span");
    s._contenuto.appendChild(el("div", { class: "as-mal-testa" }, [ el("span", { text: "🧨 Carta maledetta" }), M.info ]));
    s._contenuto.appendChild(el("div", { class: "as-mal-carta" }, [ el("span", icoAttr("em", d.carta.emoji)),
      el("div", {}, [ el("div", { class: "nm", text: d.carta.nome }), el("div", { class: "sm", text: "Nessuno la vuole! Nel voto finale: −0,5 ⭐" }) ]) ]));
    s._contenuto.appendChild(el("p", { class: "as-mal-regola", text: "A turno: paghi per scansarla o te la prendi. Chi se la prende non paga niente: gli altri pagano quello che hanno offerto." }));
    M.prezzo = el("b");
    s._contenuto.appendChild(el("div", { class: "as-mal-prezzo" }, [ el("small", { text: "Per scansarla ora si paga" }), M.prezzo ]));
    M.barra = el("i");
    s._contenuto.appendChild(el("div", { class: "as-mal-tempo" }, [ M.barra ]));
    M.uno = el("div", { class: "as-mal-conta" });
    s._contenuto.appendChild(M.uno);
    var gente = el("div", { class: "as-mal-gente" });
    d.persone.forEach(function (p) {
      var off = el("span"), nodo = el("div", { class: "as-mal-p" }, [ el("b", { text: p.nome }), off ]);
      M.pers[p.id] = { nodo: nodo, off: off };
      gente.appendChild(nodo);
    });
    s._contenuto.appendChild(gente);
    M.piede = el("div", { class: "as-mal-piede" });
    s._piede.appendChild(M.piede);
    MAL = M;
    t.mostra(s);
    aggMal(d);
  }
  function aggMal(d) {
    var M = MAL; if (!M) return; M.d = d;
    var el = document.createElement.bind(document);
    if (M.info.textContent !== (d.info ? "· " + d.info : "")) M.info.textContent = d.info ? "· " + d.info : "";
    var tx = (d.prezzo + 1) + " 💰"; if (M.prezzo.textContent !== tx) M.prezzo.textContent = tx;
    d.persone.forEach(function (p) {
      var q = M.pers[p.id]; if (!q) return;
      var cls = "as-mal-p" + (p.id === d.turnoId ? " ora" : "") + (p.via ? " via" : "") + (d.io != null && p.id === d.io ? " mio" : "");
      if (q.nodo.className !== cls) q.nodo.className = cls;
      var o = p.via ? "non c'è" : p.offerta ? "offre " + p.offerta + " 💰" : p.id === d.turnoId ? "⏳" : "—";
      if (q.off.textContent !== o) q.off.textContent = o;
    });
    // il tempo: riparte a ogni turno (giro nuovo)
    if (d.giro !== M.giro) {
      M.giro = d.giro;
      M.conta.forEach(function (x) { clearTimeout(x); }); M.conta = [];
      var resta = Math.max(0, +d.resta || 0), tot = Math.max(resta, d.durata || resta || 1);
      M.barra.style.transition = "none"; M.barra.style.transform = "scaleX(" + (tot ? resta / tot : 0) + ")"; void M.barra.offsetWidth;
      M.barra.style.transition = "transform " + resta + "ms linear"; M.barra.style.transform = "scaleX(0)";
      M.uno.textContent = "";
      ["Uno…", "Due…"].forEach(function (parola, i) {
        var quando = resta - (2 - i) * 1000; if (quando < 0) return;
        M.conta.push(setTimeout(function () { if (MAL !== M || !document.body.contains(M.s)) return; M.uno.textContent = parola; FX.conta(i); }, quando));
      });
    }
    // in basso: chi è di turno sceglie (stesso telefono: chiunque sia di turno; online: solo lui)
    var turno = trova(d.persone, d.turnoId), nome = turno ? turno.nome : "", mio = d.io == null || d.io === d.turnoId;
    var kP = [d.turnoId, d.giro, d.forzato ? 1 : 0, mio ? 1 : 0, d.prezzo].join("|");
    if (kP === M.kPiede) return;
    M.kPiede = kP;
    svuotaNodo(M.piede);
    var nota = el("p"); nota.className = "sa-nota";
    nota.textContent = d.forzato ? (d.io === d.turnoId ? "Non hai più crediti per pagare: te la prendi tu 😩" : nome + " non ha più crediti per pagare: se la prende 😩")
      : d.io == null ? "Tocca a " + nome + " (" + (turno ? turno.crediti : 0) + " 💰): paghi " + (d.prezzo + 1) + " 💰 o te la prendi?"
      : d.io === d.turnoId ? "Tocca a te! Paghi " + (d.prezzo + 1) + " 💰 o te la prendi?"
      : d.io === "—" ? "Stai guardando: tocca a " + nome
      : "Tocca a " + nome + ": paga o se la prende?";
    M.piede.appendChild(nota);
    if (!mio) return;
    var giro = d.giro, fatto = false, chi = d.turnoId;
    function una(fn) { return function () { if (fatto || !MAL || MAL.d.giro !== giro) return; fatto = true; vibra(20); fn(chi); }; }
    var bPaga = el("button"); bPaga.className = "btn btn-verde"; bPaga.textContent = "💸 Pago " + (d.prezzo + 1) + " 💰"; bPaga.onclick = una(function (k) { MAL.d.onPaga(k); });
    if (d.forzato) bPaga.disabled = true;
    var bPrendo = el("button"); bPrendo.className = "btn btn-rosso"; bPrendo.textContent = "😩 Me la prendo"; bPrendo.onclick = una(function (k) { MAL.d.onPrendo(k); });
    var riga = el("div"); riga.className = "as-mal-tasti"; riga.appendChild(bPaga); riga.appendChild(bPrendo);
    M.piede.appendChild(riga);
  }
  // l'esito: chi se l'è presa, chi ha pagato e quanto (uguale sullo stesso telefono e online)
  function nodiEsitoMal(el, e, myId) {
    var tu = myId != null && e.chiId === myId, righe = el("div", { class: "as-mal-conti" });
    if (e.scaduto) righe.appendChild(el("div", { text: "⏱ " + (tu ? "Non hai" : e.chiNome + " non ha") + " deciso in tempo" }));
    righe.appendChild(el("div", { text: e.paga && e.paga.length ? "💸 " + e.paga.map(function (p) { return (myId != null && p.id === myId ? "Tu paghi " : p.nome + " paga ") + p.quanto + " 💰"; }).join(" · ") : "Nessuno ha pagato niente" }));
    if (e.ripresa) righe.appendChild(el("div", { text: "↩️ " + (tu ? "Ti riprendi" : e.chiNome + " si riprende") + " i suoi " + e.ripresa + " 💰" }));
    return [
      el("div", { style: "text-align:center;font-size:1.2rem;font-weight:900;margin-top:0", text: tu ? "😩 Te la prendi tu!" : "😩 " + e.chiNome + " se la prende!" }),
      el("div", { class: "as-big as-maled", style: "margin:6px 0" }, [ el("div", icoAttr("em", e.carta.emoji)), el("div", { class: "nm", text: e.carta.nome }),
        el("div", { class: "as-fascia-x", text: "🧨 Va nel kit · nel voto finale −0,5 ⭐" }) ]),
      righe
    ];
  }

  // =========================================================
  //  LO STADIO (asta del fantacalcio, sullo stesso telefono e online).
  //  In alto il maxischermo col calciatore all'asta (lo sfondo prende i colori della sua squadra, la maglia, il prezzo, e lo
  //  speaker che conta "12 e uno… 12 e due…"); in mezzo le squadre, 4 alla volta, ognuna col suo campetto (quella di chi ha
  //  l'offerta più alta col cartellino); sotto, sullo stesso telefono, la panchina con le faccine (si tocca la propria per offrire).
  //  Quando un calciatore è aggiudicato la sua maglia vola dal maxischermo al suo posto nel campetto di chi l'ha preso.
  //  Si costruisce una volta per partita: poi cambia solo quello che serve (niente lampeggio).
  // =========================================================
  var STADIO = null;
  var POSTI_CAMPO = [ { r: "A", x: 50, y: 14 }, { r: "C", x: 25, y: 36 }, { r: "C", x: 75, y: 36 }, { r: "D", x: 50, y: 58 }, { r: "P", x: 50, y: 85 } ];
  function nomeCampo(n) {   // "Martinez L." → "Martinez" (via le iniziali)
    var s = String(n || ""), p = s.split(" ").filter(function (x) { return !/^[A-Za-zÀ-ÿ]{1,3}\.$/.test(x); });
    return p.join(" ") || s;
  }
  function slotRosa(kit) {   // i 5 posti del campetto (nell'ordine di POSTI_CAMPO) col calciatore che ci va, o null
    var per = { P: [], D: [], C: [], A: [] }, usati = { P: 0, D: 0, C: 0, A: 0 };
    (kit || []).forEach(function (c) { if (per[c.ruolo]) per[c.ruolo].push(c); });
    return POSTI_CAMPO.map(function (p) { return per[p.r][usati[p.r]++] || null; });
  }
  // i 5 posti di un campo (grande o piccolo): la maglia, il nome sotto, la maglia in trasparenza del calciatore all'asta, il prezzo pagato, il valore
  function postiCampo(el) {
    return POSTI_CAMPO.map(function (p) {
      var img = el("img", { class: "st-slot-maglia", alt: "" }), ombra = el("img", { class: "st-slot-ombra", alt: "" }), nm = el("span"),
        val = el("em", { class: "st-val" }), paga = el("em", { class: "st-paga" });
      var n = el("div", { class: "st-slot vuoto", style: "left:" + p.x + "%;top:" + p.y + "%" }, [
        el("div", { class: "st-slot-fig" }, [ el("i", { class: "st-slot-vuoto", text: (FANTA_RUOLI[p.r] || {}).breve }), ombra, img, paga, val ]), nm ]);
      return { nodo: n, img: img, ombra: ombra, nome: nm, val: val, paga: paga, ruolo: p.r, k: null };
    });
  }
  function riempiCampo(slot, kit, salta, cerca, ombra) {   // la formazione su un campo (salta: un posto lasciato vuoto, ci arriva la maglia in volo; cerca: il ruolo all'asta)
    var posti = slotRosa(kit), segnato = false;
    slot.forEach(function (s, i) {
      var c = i === salta ? null : posti[i], qui = !c && !segnato && cerca === s.ruolo;
      riempiSlot(s, c);
      if (qui) { segnato = true; if (s.ombra.getAttribute("src") !== ombra) s.ombra.src = ombra; }
      if (s.nodo.classList.contains("cerca") !== qui) s.nodo.classList.toggle("cerca", qui);   // il posto dove andrebbe il calciatore all'asta (la sua maglia in trasparenza)
    });
  }
  // il palco della classifica finale: in alto il nome della squadra, sotto il campo grande con i 5 posti in formazione e, a bordo campo,
  // l'avatar in piedi di chi ha la squadra (l'allenatore)
  function palco(el, S) {
    S.campoNome = el("div", { class: "st-campo-nome" });
    S.slot = postiCampo(el);
    S.campo = el("div", { class: "st-campo" }, S.slot.map(function (s) { return s.nodo; }));
    S.misterImg = el("img", { alt: "" }); S.palN = el("span");
    S.pal = el("div", { class: "st-pal" }, [ S.palN ]);
    S.mister = el("div", { class: "st-mister" }, [ S.misterImg, S.pal ]);
    S.wrap = el("div", { class: "st-campo-wrap" }, [ S.campo, S.mister ]);
    if (window.ResizeObserver) { try { new ResizeObserver(function () { misuraPalco(S); }).observe(S.wrap); } catch (e) {} }
    return (S.palco = el("div", { class: "st-palco" }, [ el("div", { class: "st-campo-testa" }, [ S.campoNome ]), S.wrap ]));
  }
  // le maglie e l'allenatore crescono col campo; il disegno del campo si rifà con le sue proporzioni (cerchi tondi)
  function misuraPalco(S) {
    if (!S || !S.wrap || !document.body.contains(S.wrap)) return;
    var w = S.wrap.clientWidth, h = S.wrap.clientHeight; if (!w || !h) return;
    var mg = 2 * Math.round(Math.max(30, Math.min(w * 0.19, h * 0.175, 96)) / 2), al = Math.round(Math.min(h * 0.5, w * 0.34 * 264 / 200));
    if (mg !== S.mg) { S.mg = mg; S.wrap.style.setProperty("--mg", mg + "px"); }
    if (al !== S.al) { S.al = al; S.wrap.style.setProperty("--all", al + "px"); }
    var rap = (Math.round(w / h * 20) / 20).toFixed(2);
    if (rap !== S.rap) { S.rap = rap; var fondo = arte("campo", "", rap); if (fondo) { S.campo.style.backgroundImage = "url(\"" + fondo + "\")"; S.campo.classList.add("dipinto"); } }
  }
  function chiaro(hex) { var n = parseInt(String(hex || "#000").slice(1), 16) || 0; return ((n >> 16) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 1000 > 150; }
  function riempiSlot(s, c, valore) {   // un posto del campo: la maglia, il nome sui colori della squadra e quanto è stato pagato (o vuoto col ruolo)
    var k = c ? c.nome + "|" + c.squadra + "|" + (c.prezzo || "") : "";
    if (k !== s.k) {
      s.k = k; s.nodo.classList.toggle("vuoto", !c);
      if (c) {
        var col = coloriSquadra(c.squadra) || ["#2b3550", "#9aa5bd"];
        s.img.src = maglia(c.squadra); s.nome.textContent = nomeCampo(c.nome);
        s.nome.style.background = col[0]; s.nome.style.borderColor = col[1]; s.nome.style.color = chiaro(col[0]) ? "#141414" : "#fff";
        s.paga.textContent = c.prezzo ? c.prezzo + " 💰" : "";
      } else { s.img.removeAttribute("src"); s.nome.textContent = ""; s.paga.textContent = ""; }
      s.val.classList.remove("su"); s.val.textContent = "";
    }
    if (valore != null) { s.val.textContent = valore; s.val.classList.add("su"); }
  }
  // l'allenatore: la persona che ha la squadra che si guarda, in piedi a bordo campo. posa: "giu", "paletta" (il cartellino alzato col
  // prezzo: l'offerta più alta è sua) o "esulta" (il calciatore è suo: salta col cartellino ancora su). Quando cambia squadra entra da destra
  var IN_PIEDI_SU = { braccia: "canna", angolo: ANG_PALETTA };
  function allenatore(S, g, posa, prezzo) {
    var cfg = g ? cfgDi(g.nome, g.omino) : null, chi = g ? g.nome + JSON.stringify(g.omino || "") : "";
    S.mister.style.visibility = cfg ? "" : "hidden";
    if (!cfg) { S.misterChi = S.misterK = ""; return; }
    if (chi !== S.misterChi) {
      S.misterChi = chi; rianima(S.mister, "entra");
      var m = { x: 155, y: 110 }; try { m = SGOmino.mano(cfg, IN_PIEDI_SU); } catch (e) {}
      S.pal.style.left = (m.x / 2) + "%"; S.pal.style.top = (m.y / 2.64) + "%";
    }
    if (chi + "|" + posa !== S.misterK) {
      S.misterK = chi + "|" + posa;
      S.misterImg.src = srcAv(cfg, posa === "giu" ? {} : IN_PIEDI_SU);
      S.mister.classList.toggle("alza", posa !== "giu"); S.mister.classList.toggle("esulta", posa === "esulta");
    }
    var p = posa !== "giu" && prezzo != null ? String(prezzo) : "";
    if (p !== S.palN.textContent) { S.palN.textContent = p; if (p) rianima(S.pal, "batte"); }
  }
  function etichetteTiri(S, rn, pn, an) {   // «🎯 2° RIGORISTA», «🦶 BATTITORE» (le punizioni), «🚩 ANGOLI» (il proprietario: mai «rigori», mai «punizioni»): per esteso se c'è posto,
    // se no più piccole, poi solo il simbolo di battitore e angoli (RIGORISTA resta per intero), poi tutti simboli
    function o(n) { return n > 1 ? n + "° " : ""; }
    function solo(ic, n) { return n ? ic + (n > 1 ? " " + n + "°" : "") : ""; }
    var rig = rn ? "🎯 " + o(rn) + "RIGORISTA" : "", pun = pn ? "🦶 " + o(pn) + "BATTITORE" : "", ang = an ? "🚩 " + o(an) + "ANGOLI" : "";
    var forme = [[rig, pun, ang, 0], [rig, pun, ang, 1], [rig, pun, solo("🚩", an), 1], [rig, solo("🦶", pn), solo("🚩", an), 1], [solo("🎯", rn), solo("🦶", pn), solo("🚩", an), 1], [rn ? "🎯" : "", pn ? "🦶" : "", an ? "🚩" : "", 1]];
    var riga = S.ruolo.parentNode, dati = riga && riga.parentNode, dentro = dati && dati.parentNode, badge = [S.rig, S.pun, S.ang];
    function metti(dove) { badge.forEach(function (b) { if (b.parentNode !== dove) dove.appendChild(b); }); if (S.tiri) S.tiri.style.display = dove === S.tiri ? "" : "none"; }
    function prova(dove, usato) {   // la prima forma che ci sta in quella riga (usato: lo spazio già preso da ruolo e squadra)
      for (var i = 0; i < forme.length; i++) {
        S.rig.textContent = forme[i][0]; S.pun.textContent = forme[i][1]; S.ang.textContent = forme[i][2];
        badge.forEach(function (b) { b.classList.toggle("stretta", !!forme[i][3]); });
        if (!dove.clientWidth) return true;
        var vis = badge.filter(function (b) { return b.offsetWidth > 0; });
        if (usato + vis.reduce(function (t, b) { return t + b.offsetWidth; }, 0) + 6 * vis.length <= dove.clientWidth) return true;
      }
      return false;
    }
    if (!riga) return;
    if ((rn || pn || an) && S.tiri) {   // se il tabellone è alto abbastanza: una riga tutta per loro, sotto la squadra (le scritte per intero)
      metti(S.tiri); S.rig.textContent = forme[0][0]; S.pun.textContent = forme[0][1]; S.ang.textContent = forme[0][2];   // (si misura con le scritte del calciatore nuovo)
      var pv = S.prezzoN && !S.prezzoN.textContent; if (pv) S.prezzoN.textContent = "1 💰";   // (e col prezzo al suo posto: arriva subito dopo)
      var ci = function () { return dentro && dati.offsetHeight <= dentro.clientHeight - 2; };
      var sta = ci() && prova(S.tiri, 0) && ci(); if (pv) S.prezzoN.textContent = "";
      if (sta) return;
    }
    metti(riga); prova(riga, S.ruolo.offsetWidth + 6 + 56);   // (se no accanto alla squadra: 56 = quanto resta almeno al suo nome)
  }
  function maxischermo(el, S, conContatore) {   // il maxischermo: due strati di colore che sfumano, la maglia, i dati, lo speaker in basso
    S.colA = el("div", { class: "st-colori" }); S.colB = el("div", { class: "st-colori" });
    S.magliaImg = el("img", { class: "st-maglia", alt: "" });
    S.ruolo = el("span", { class: "st-ruolo" }); S.squadra = el("span", { class: "st-squadra" }); S.rig = el("span", { class: "st-rig" }); S.pun = el("span", { class: "st-pun" }); S.ang = el("span", { class: "st-pun st-ang" });   // (🎯 se tira i rigori, 🦶 se batte le punizioni, 🚩 se batte gli angoli)
    S.nome = el("div", { class: "st-nome" });
    S.prezzoN = el("b"); S.chi = el("span");
    S.ticker = el("div", { class: "st-ticker" });
    S.schermo = el("div", { class: "st-schermo vuoto" }, [ S.colA, S.colB,
      el("div", { class: "st-dentro" }, [
        el("div", { class: "st-magliabox" }, [ S.magliaImg ]),
        el("div", { class: "st-dati" }, [ el("div", { class: "st-riga" }, [ S.ruolo, S.squadra, S.rig, S.pun, S.ang ]), (S.tiri = el("div", { class: "st-tiri", style: "display:none" })), S.nome, el("div", { class: conContatore ? "st-prezzo st-contatore" : "st-prezzo" }, [ S.prezzoN, S.chi ]) ])
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
    S.piede = el("div", { class: "sa-piede st-piede" + (d.piedeAlto ? " " + d.piedeAlto : "") });
    var board = maxischermo(el, S, false);
    S.radice = el("div", { class: "schermata sa-sala st-stadio" + (d.persone.length > 5 ? " fitta" : "") + (t.guarda ? " as-targa" : "") }, [ sfondo, testaAsta(el, S, d), board, S.avviso, el("div", { class: "sa-tempo" }, [ S.tempo ]),
      griglia(el, S, d.persone), d.io == null ? panchina(el, S, d.persone) : null, S.piede ]);   // (online si offre coi tasti: niente panchina)
    S.ultimiDati = d; STADIO = S;
    t.mostra(S.radice);
    aggiornaStadio(d);
    adattaPubblico(S.pubblico); misuraGriglia(S);
  }
  // le squadre: 4 alla volta (2 sopra e 2 sotto; in 2 una accanto all'altra), ognuna col suo campetto, la faccina, il nome e i crediti.
  // Quella di chi ha l'offerta più alta si illumina col cartellino del prezzo. Da 5 in su si cambia pagina con le frecce (e la pagina
  // va da sola dove c'è chi ha appena offerto). Ogni riquadro si fa una volta: poi cambia solo quello che serve
  var PER_PAGINA = 4;
  function griglia(el, S, persone) {
    var n = persone.length;
    S.pagine = Math.ceil(n / PER_PAGINA); S.pagina = 0; S.sq = {};
    S.carte = el("div", { class: "st-gr-carte" + (n === 1 ? " uno" : n <= 2 ? " due" : "") }, persone.map(function (p) {
      var palN = el("span"), nota = el("small"), slot = postiCampo(el), campo = el("div", { class: "st-sq-campo" }, slot.map(function (s) { return s.nodo; }));
      var nodo = el("div", { class: "st-sq" }, [
        el("div", { class: "st-sq-testa" }, [ el("img", { class: "st-sq-faccia", src: srcAv(cfgDi(p.nome, p.omino), { busto: true }), alt: "" }),
          el("div", { class: "st-sq-nomi" }, [ el("b", { text: p.nome }), nota ]), el("div", { class: "st-sq-pal" }, [ palN ]) ]),
        campo ]);
      S.sq[p.id] = { nodo: nodo, nota: nota, palN: palN, campo: campo, slot: slot, k: "" };
      return nodo;
    }));
    S.pagN = el("div", { class: "st-campo-nome" });
    S.grTesta = el("div", { class: "st-campo-testa st-gr-testa" }, [
      el("button", { class: "st-freccia", text: "‹", "aria-label": "Le squadre prima", onclick: function () { giraPagina(S, -1); } }), S.pagN,
      el("button", { class: "st-freccia", text: "›", "aria-label": "Le squadre dopo", onclick: function () { giraPagina(S, 1); } }) ]);
    if (S.pagine < 2) S.grTesta.style.display = "none";
    if (window.ResizeObserver) { try { new ResizeObserver(function () { misuraGriglia(S); }).observe(S.carte); } catch (e) {} }
    mostraPagina(S, 0, persone);
    return el("div", { class: "st-griglia" }, [ S.grTesta, S.carte ]);
  }
  function paginaDi(persone, id) { for (var i = 0; i < persone.length; i++) if (persone[i].id === id) return Math.floor(i / PER_PAGINA); return -1; }
  function mostraPagina(S, pg, persone) {
    S.pagina = pg;
    persone.forEach(function (p, i) { var q = S.sq[p.id]; if (!q) return; var su = Math.floor(i / PER_PAGINA) === pg; if ((q.nodo.style.display !== "none") !== su) q.nodo.style.display = su ? "" : "none"; });
    var da = pg * PER_PAGINA + 1, a = Math.min(persone.length, da + PER_PAGINA - 1);
    S.pagN.textContent = "Squadre " + (da === a ? da : da + "–" + a) + " di " + persone.length;
  }
  function giraPagina(S, dir) {
    var d = S.ultimiDati; if (!d || S.pagine < 2) return;
    mostraPagina(S, (S.pagina + dir + S.pagine) % S.pagine, d.persone);
    S.ultimoLeader = d.leader;   // (non si torna da soli sulla pagina di chi guida finché non offre qualcun altro)
    misuraGriglia(S);
  }
  // le maglie crescono coi campetti; il disegno del campo si rifà con le loro proporzioni (cerchi tondi)
  function misuraGriglia(S) {
    if (!S || !S.carte || !document.body.contains(S.carte)) return;
    var c = null; for (var id in S.sq) if (S.sq[id].nodo.style.display !== "none") { c = S.sq[id].campo; break; }
    var w = c ? c.clientWidth : 0, h = c ? c.clientHeight : 0; if (!w || !h) return;
    var mg = 2 * Math.round(Math.max(22, Math.min(w * 0.23, h * 0.19, 84)) / 2);
    if (mg !== S.mg) { S.mg = mg; S.carte.style.setProperty("--mg", mg + "px"); }
    var rap = (Math.round(w / h * 20) / 20).toFixed(2);
    if (rap !== S.rap) { S.rap = rap; var fondo = arte("campo", "", rap); if (fondo) for (var k in S.sq) { S.sq[k].campo.style.backgroundImage = "url(\"" + fondo + "\")"; S.sq[k].campo.classList.add("dipinto"); } }
  }
  // la panchina (solo sullo stesso telefono): le faccine di tutti, da toccare per offrire, e «passo»; chi ha l'offerta più alta alza il
  // cartellino col prezzo. Fino a 8 su una fila (da 6 in su più strette), in 9 o 10 su due
  function panchina(el, S, persone) {
    var n = persone.length, col = n <= 8 ? n : Math.ceil(n / 2);
    var file = el("div", { class: "sa-file st-pp-file", style: "--col:" + col }, persone.map(function (p) {
      var pal = el("span"), nuvola = el("div", { class: "sa-nuvola" }), passo = tastoPasso(el, S, p);
      var nodo = el("div", { class: "sa-pers", role: "button", onclick: function () { toccaPersona(S, p.id); } }, [
        el("div", { class: "sa-figura" }, [ el("img", { class: "st-busto", src: srcAv(cfgDi(p.nome, p.omino), { busto: true }), alt: "" }), el("div", { class: "sa-paletta" }, [ pal ]), nuvola ]),
        el("b", { text: p.nome.length > 9 ? p.nome.slice(0, 9) + "…" : p.nome }), passo ]);
      S.pers[p.id] = { nodo: nodo, passo: passo, nuvola: nuvola, pal: pal, puo: false };
      return nodo;
    }));
    return (S.pubblico = el("div", { class: "st-panchina" + (n > 5 ? " fitta" : "") }, [ file ]));
  }
  function aggiornaStadio(d) {
    var S = STADIO; if (!S) return; S.ultimiDati = d;
    S.info.textContent = d.info || "";
    d.persone.forEach(function (p) { S.squadre[p.id] = p; });
    // il calciatore sul maxischermo: cambia solo quando ne esce uno nuovo
    var c = d.carta, k = c ? c.nome + "|" + c.squadra + "|" + (d.giroCarta || "") : "";
    if (k !== S.carta) {
      S.carta = k; S.prezzo = undefined; S.leader = undefined; S.giro = undefined; S.fine = 0; S.festa = false;   // calciatore nuovo: il conto alla rovescia riparte comunque
      if (d.io != null && d.fase === "asta") { var pgIo = paginaDi(d.persone, d.io); if (pgIo >= 0 && pgIo !== S.pagina) mostraPagina(S, pgIo, d.persone); S.ultimoLeader = null; }   // (online) si torna alla pagina della propria squadra
      var vecchio = S.radice.querySelector(".sa-aggiudicato"); if (vecchio) vecchio.parentNode.removeChild(vecchio);
      S.radice.classList.remove("chiusa");
      coloriSchermo(S, c ? coloriSquadra(c.squadra) : null);
      S.schermo.classList.toggle("vuoto", !c);
      if (c) {
        var ru = FANTA_RUOLI[c.ruolo] || {};
        S.magliaImg.src = maglia(c.squadra); S.ruolo.textContent = ru.breve || ""; S.ruolo.className = "st-ruolo as-rb-" + c.ruolo;
        S.squadra.textContent = c.squadra || ""; S.nome.textContent = c.nome; rianima(S.schermo, "entra");
        etichetteTiri(S, rigoristaN(c), tiroN(c, "punizioni"), tiroN(c, "angoli"));   // i rigoristi e chi batte le punizioni quest'anno: all'asta lo sanno tutti, come nel fantacalcio vero
      }
    }
    S.prezzoN.textContent = !c ? "" : d.esito && d.esito.tipo === "accollo" && !d.prezzo ? "—" : d.prezzo + " 💰";   // (nessuno lo vuole: niente "0 💰")
    var capo = trova(d.persone, d.leader);
    S.chi.textContent = !c ? "" : capo ? (d.io != null && capo.id === d.io ? "👑 l'offerta è tua" : "offerta di " + capo.nome) : (d.base ? "prezzo di partenza" : "");
    S.avviso.textContent = d.avviso || ""; S.avviso.style.display = d.avviso ? "" : "none";
    aggiornaPubblico(S, d);
    d.persone.forEach(function (p) { var q = S.pers[p.id]; if (q && q.pal && p.id === d.leader && q.pal.textContent !== String(d.prezzo)) q.pal.textContent = d.prezzo; });   // in panchina il cartellino col prezzo
    // la pagina delle squadre va da sola dove c'è chi ha appena offerto (con le frecce si guardano le altre)
    if (d.fase === "asta" && d.leader != null && d.leader !== S.ultimoLeader) { var pgL = paginaDi(d.persone, d.leader); if (pgL >= 0 && pgL !== S.pagina) mostraPagina(S, pgL, d.persone); }
    S.ultimoLeader = d.leader;
    var offerta = d.fase === "asta" && d.leader != null && S.prezzo !== undefined && (d.leader !== S.leader || d.prezzo !== S.prezzo);   // (un'offerta nuova: il riquadro di chi offre sobbalza)
    if (d.fase === "asta") {
      nuovaOfferta(S, d, speaker);
      tempoDa(S, d, speaker);
    } else fermaConta(S);
    if (d.esito && d.esito.n !== S.esitoN) { S.esitoN = d.esito.n; return esitoStadio(S, d); }
    disegnaSquadre(S, d, S.volo);   // (se la maglia sta ancora volando, il suo posto resta vuoto)
    if (offerta && S.sq[d.leader]) rianima(S.sq[d.leader].nodo, "batte");
    piedeAsta(S, d);
  }
  // tutte le squadre (anche quelle delle altre pagine: così cambiando pagina sono già pronte). volo: { chi, slot } la maglia in volo
  function disegnaSquadre(S, d, volo) {
    var e = d.esito, cerca = d.fase === "asta" && d.carta ? d.carta.ruolo : null, ombra = cerca ? maglia(d.carta.squadra) : "";
    d.persone.forEach(function (p) {
      var q = S.sq[p.id]; if (!q) return;
      var vince = !!e && e.tipo !== "accollo" && p.id === e.chiId, guida = d.fase === "asta" ? p.id === d.leader : vince;
      var cls = "st-sq" + (guida ? " guida" : "") + (d.fase === "asta" && p.stato !== "gara" ? " fuori" : "") + (p.via ? " via" : "") +
        (d.io != null && p.id === d.io ? " mio" : "") + (vince && S.festa ? " festa" : "");
      if (q.nodo.className.replace(/ batte/, "") !== cls) q.nodo.className = cls + (q.nodo.classList.contains("batte") ? " batte" : "");
      var nt = p.via ? "non c'è" : (p.nota || p.crediti + " 💰"), pr = guida ? String(d.prezzo) : "";
      if (q.nota.textContent !== nt) q.nota.textContent = nt;
      if (q.palN.textContent !== pr) q.palN.textContent = pr;
      riempiCampo(q.slot, p.kit, volo && volo.chi === p.id ? volo.slot : -1, cerca && p.stato === "gara" ? cerca : null, ombra);   // (la maglia in trasparenza solo a chi è ancora in gara)
    });
  }
  function esitoStadio(S, d) {   // aggiudicato: timbro sul maxischermo e la maglia vola nel campetto di chi l'ha preso; nessuno: torna in fondo al mazzo
    var e = d.esito;
    S.radice.appendChild(timbro(e.tipo === "accollo" ? "NESSUNO!" : "AGGIUDICATO!")); S.radice.classList.add("chiusa");
    piedeAsta(S, d);
    if (e.tipo === "accollo") { speaker("Nessuno lo vuole" + (e.carta && e.carta.rifiuti ? " (" + e.carta.rifiuti + "ª volta)" : "") + ": torna in fondo al mazzo"); disegnaSquadre(S, d); return; }
    var g = S.squadre[e.chiId];
    // lo speaker sfotte: due della stessa squadra, il derby, l'affare da 1, la follia
    speaker(e.tipo !== "forzata" ? (battutaRosa(e.chiNome, g && g.kit, e.carta) || battutaAggiudica(e.chiNome, e.prezzo, d.budget))
      : e.motivo === "ufficio" ? "Nessuno li ha voluti per 2 volte: questo va a caso a " + e.chiNome + " per " + e.prezzo
      : "Solo " + e.chiNome + " cerca un " + ((FANTA_RUOLI[e.carta.ruolo] || {}).nome || "").toLowerCase() + ": è suo per " + e.prezzo + "!");
    if (e.tipo === "vinta" && (d.io == null || d.io === e.chiId)) vibra(35);   // il martello per chi l'ha vinto (sullo stesso telefono, per tutti)
    var pg = paginaDi(d.persone, e.chiId); if (pg >= 0 && pg !== S.pagina) mostraPagina(S, pg, d.persone);   // (si va alla pagina di chi l'ha preso)
    var posti = g ? slotRosa(g.kit) : [], i = -1, q = S.sq[e.chiId];
    posti.forEach(function (c, j) { if (c && c.nome === e.carta.nome && c.squadra === e.carta.squadra) i = j; });
    if (i < 0 || !q) return disegnaSquadre(S, d);
    var n = S.esitoN; S.volo = { slot: i, chi: e.chiId };
    disegnaSquadre(S, d, S.volo);
    setTimeout(function () {
      if (STADIO !== S || S.esitoN !== n) return;
      volo(S, q.slot[i], function () { if (STADIO !== S) return; S.volo = null; S.festa = S.esitoN === n; disegnaSquadre(S, S.ultimiDati); rianima(q.slot[i].nodo, "arriva"); FX.pop(); });   // (arrivata la maglia, la sua squadra fa festa)
    }, 450);
  }
  function volo(S, s, poi) {   // la maglia vola dal maxischermo al suo posto (s) nel campetto (solo transform: niente scatti)
    var da = S.magliaImg.getBoundingClientRect(), a = s.img.getBoundingClientRect(), base = S.radice.getBoundingClientRect();
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
      var posti = slotRosa(g.kit), campo = el("div", { class: "sa-campo" }), fondo = arte("campo", "", "0.95");
      if (fondo) { campo.style.backgroundImage = "url(\"" + fondo + "\")"; campo.style.backgroundSize = "100% 100%"; campo.style.boxShadow = "0 1px 4px rgba(0,0,0,.3)"; }   // (lo stesso campo dello stadio)
      posti.forEach(function (c, i) {
        var p = POSTI_CAMPO[i], col = c ? coloriSquadra(c.squadra) || ["#2b3550", "#9aa5bd"] : null;
        campo.appendChild(el("div", { class: "sa-gioc" + (c ? "" : " vuoto"), style: "left:" + p.x + "%;top:" + p.y + "%" }, [
          c ? el("img", { class: "sa-maglia", src: maglia(c.squadra), alt: "" }) : el("i", { class: "sa-maglia", text: (FANTA_RUOLI[p.r] || {}).breve }),
          c ? el("span", { class: "sa-gioc-nome", text: nomeCampo(c.nome), style: "background:" + col[0] + ";color:" + (chiaro(col[0]) ? "#141414" : "#fff") }) : el("span")   // il nome sui colori della squadra
        ]));
      });
      box.appendChild(el("div", { class: "sa-squadra" }, [ el("div", { class: "sa-sq-nome", text: g.nome + " · " + g.crediti + " 💰" }), campo ]));
    });
    foglioSala(t, "👕 Le formazioni", box);
  }
  function esciAsta(t, st) { t.conferma("Uscire dalla partita?", null, "Esci", function () { esciAstaOra(t, st); }); }   // la finestra dell'app
  function esciAstaOra(t, st) {
    if (st) { st.finita = true; if (st.asta && st.asta.bar && st.asta.bar._stop) st.asta.bar._stop(); if (st.pausa) clearTimeout(st.pausa); clearTimeout(st.malTo); st.malA = null; }
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
  function chiaveVM(vm, carta) { return "vm|" + (vm.codice || "") + "|" + (vm.roundIdx != null ? vm.roundIdx : "") + "|" + (carta ? carta.nome : ""); }
  // (online, temi) la sala d'asta vista da questo telefono: il tuo avatar ha il numero giallo, i tuoi tasti in basso
  function salaAstaVM(t, vm, cb) {
    var el = t.el, myId = cb.myId, a = vm.asta, io = trova(vm.giocatori, myId);
    cb._vmA = vm;
    var v = vistaTocchi(cb, a.n, a);   // l'offerta come la vedo io: coi miei tocchi ancora per strada è già mia (due tocchi = +2)
    var hoPassato = a.passati.indexOf(myId) >= 0, guido = v.leader === myId, prezzi = prezziSalto(v.offerta, false, SALTI_TEMI), prezzo = prezzi[0];
    var inGara = io && !io.haCarta, max = io ? io.crediti - ((vm.totRound - 1) - vm.roundIdx) : 0;
    // ogni tocco è una mossa a sé (vedi mandaTocco): parte dall'offerta come la vedo io adesso, anche se la foto nuova non è ancora arrivata
    var ridisegna = function () { var x = cb._vmA; if (x && x.fase === "asta" && x.asta && x.asta.n === a.n && !cb._uscito) disegnaAstaVM(t, x, cb); };
    var offri = function (p, i) {
      var x = cb._vmA, aa = x && x.fase === "asta" && x.asta; if (!aa || aa.n !== a.n) return;
      var da = vistaTocchi(cb, aa.n, aa), pr = prezziSalto(da.offerta, false, SALTI_TEMI)[i || 0];
      if (pr == null || max < pr) return;   // (non ci arrivo coi miei crediti)
      mandaTocco(cb, aa.n, da, pr, ridisegna);
    };
    var mie = tastiOfferta(el, { prezzi: prezzi, salti: SALTI_TEMI, max: max, guido: guido, primo: false, inGara: inGara && !hoPassato,
      offri: offri, passa: function () { cb.onPassa({ n: a.n }); } });
    var tardi = cb._tardi && Date.now() - cb._tardi < 3000;
    var persone = vm.giocatori.map(function (g, i) {
      var pass = a.passati.indexOf(g.id) >= 0, gm = g.max != null ? g.max : g.crediti - ((vm.totRound - 1) - vm.roundIdx);
      return { id: g.id, nome: g.nome, omino: g.omino || null, num: i + 1, via: !!g.via, stato: g.haCarta ? "fuori" : pass ? "passato" : "gara",
        nota: g.haCarta ? "✔ ha la carta" : pass ? "ha passato" : notaCrediti(g.crediti, gm), manca: "",
        puo: g.id === myId && inGara && !hoPassato && max >= prezzo };
    });
    salaAsta(t, {
      chiave: chiaveVM(vm, a.carta), info: "Round " + (vm.roundIdx + 1) + " di " + vm.totRound + " · stanza " + (vm.codice || ""),
      carta: cartaLotto(el, a.carta), sotto: sottoLotto(a.carta), budget: vm.budget, grosso: 3,
      prezzo: v.offerta, leader: v.leader, persone: persone, io: myId || "—", mie: mie,
      kPiede: [a.n, hoPassato ? 1 : 0, inGara ? 1 : 0, max].join("|"),   // (prezzi e «Passo» cambiano al loro posto, anche quando divento io il capo: vedi tastiOfferta)
      giro: a.giro, resta: a.resta, durata: SECONDI * 1000,
      nota: !io ? "Stai guardando la partita" : !inGara ? "Hai già la tua carta di questo round" : hoPassato ? "Hai passato: aspetti il risultato" : guido ? (max >= prezzo ? "👑 L'offerta più alta è tua: tocca ancora per rialzare" : "👑 L'offerta più alta è tua")
        : tardi ? "⏱ Troppo tardi di un soffio: qualcuno ha offerto prima di te. Ora è " + a.offerta + " 💰" : "Hai " + io.crediti + " 💰 · puoi arrivare a " + Math.max(0, max),
      onRilancia: function () { offri(null, 0); }, onPassa: function () { cb.onPassa({ n: a.n }); },
      onIndietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); },
      extra: { testo: "🃏 Carte", apri: function () { var b = el("div", {}), pal = dettaglioPalio(el, vm.tavolo, a.carta.nome); if (pal) b.appendChild(pal); b.appendChild(pannelloKit(el, vm.giocatori)); foglioSala(t, "🃏 Le carte", b); } }
    });
  }
  // (online) i miei tasti per offrire: il primo grande (+1, o «Lo prendo a 1»), accanto i salti (+3, o +2 e +5) e «Passo».
  // Un salto che supera il massimo che posso offrire è spento. Chi guida rialza (non passa).
  // o: { prezzi, salti, max, guido, primo (fanta: nessuno ha ancora offerto), inGara, offri(prezzo, quale salto), passa() }
  // I tasti restano gli stessi per tutta l'asta (finché sono in gara): a ogni offerta nuova cambiano solo i prezzi scritti e «Passo» (via quando guido)
  // (out._agg), così due tocchi fulminei cadono sempre sullo stesso tasto e niente lampeggia.
  function tastiOfferta(el, o) {
    if (!o.inGara) return [];
    var out = [];
    var b0 = el("button", { class: "btn btn-verde sa-grande", onclick: function () { o.offri(null, 0); } });
    out.push(b0);
    var riga = el("div", { class: "as-salti" }), salti = [];
    o.salti.forEach(function (s, i) {
      if (!i) return;
      var sm = el("small"), b = el("button", { class: "btn btn-verde", onclick: function () { o.offri(null, i); } }, [ document.createTextNode("+" + s), sm ]);
      salti.push({ b: b, sm: sm, i: i });
      riga.appendChild(b);
    });
    var pb = el("button", { class: "btn btn-rosso", text: "Passo", onclick: function () { o.passa(); } });   // (chi guida non passa: il tasto c'è solo per gli altri)
    out.push(riga);
    out._o = o;
    out._agg = function (x) {   // i prezzi di adesso (x: lo stesso tipo di o)
      var p0 = x.prezzi[0], tx = x.primo ? "🙋 Lo prendo a " + p0 + " 💰" : (x.guido ? "🙋 Rialzo: " : "🙋 Rilancio: ") + p0 + " 💰";
      if (b0.textContent !== tx) b0.textContent = tx;
      if (b0.disabled !== (x.max < p0)) b0.disabled = x.max < p0;
      salti.forEach(function (z) { var p = x.prezzi[z.i], st = p + " 💰"; if (z.sm.textContent !== st) z.sm.textContent = st; if (z.b.disabled !== (x.max < p)) z.b.disabled = x.max < p; });
      if (x.guido && pb.parentNode) riga.removeChild(pb); else if (!x.guido && !pb.parentNode) riga.appendChild(pb);
    };
    out._agg(o);
    return out;
  }
  // (online, fantacalcio) lo stadio visto da questo telefono
  function stadioVM(t, vm, cb) {
    var el = t.el, myId = cb.myId, a = vm.fase === "asta" ? vm.asta : null, e = vm.fase === "esito" ? vm.esito : null, io = trova(vm.giocatori, myId);
    var carta = a ? a.carta : e ? e.carta : null; if (!carta) return;
    var ru = FANTA_RUOLI[carta.ruolo] || {};
    cb._vmA = vm;
    var v = a ? vistaTocchi(cb, a.nCarta, a) : null;   // l'offerta come la vedo io: coi miei tocchi ancora per strada è già mia (due tocchi = +2)
    var hoPassato = !!a && a.passati.indexOf(myId) >= 0, guido = !!v && v.leader === myId;
    var prezzi = a ? prezziSalto(v.offerta, !v.leader, SALTI_FANTA) : [0], prezzo = prezzi[0];
    var inGara = !!(a && io && (io.conta[a.ruolo] || 0) < FANTA_SLOT[a.ruolo]), max = io ? io.max : 0;
    // ogni tocco è una mossa a sé (vedi mandaTocco): parte dall'offerta come la vedo io adesso, anche se la foto nuova non è ancora arrivata
    var ridisegna = function () { var x = cb._vmA; if (a && x && x.fase === "asta" && x.asta && x.asta.nCarta === a.nCarta && !cb._uscito) disegnaFantaVM(t, x, cb); };
    var offri = function (p, i) {
      var x = cb._vmA, aa = x && x.fase === "asta" && x.asta; if (!a || !aa || aa.nCarta !== a.nCarta) return;
      var da = vistaTocchi(cb, aa.nCarta, aa), pr = prezziSalto(da.offerta, !da.leader, SALTI_FANTA)[i || 0];
      if (pr == null || max < pr) return;   // (non ci arrivo coi miei crediti)
      mandaTocco(cb, aa.nCarta, da, pr, ridisegna);
    };
    var mie = a ? tastiOfferta(el, { prezzi: prezzi, salti: SALTI_FANTA, max: max, guido: guido, primo: !v.leader, inGara: inGara && !hoPassato,
      offri: offri, passa: function () { cb.onPassa({ n: a.nCarta }); } }) : [];
    var tardi = cb._tardi && Date.now() - cb._tardi < 3000;
    var persone = vm.giocatori.map(function (g, i) {
      var pieno = a ? (g.conta[a.ruolo] || 0) >= FANTA_SLOT[a.ruolo] : false, pass = !!a && a.passati.indexOf(g.id) >= 0;
      return { id: g.id, nome: g.nome, omino: g.omino || null, num: i + 1, crediti: g.crediti, kit: g.kit || [], via: !!g.via, stato: pieno ? "fuori" : pass ? "passato" : "gara",
        nota: pieno ? notaPieno(a.ruolo) : pass ? "ha passato" : notaCrediti(g.crediti, g.max), manca: iconeMancano(g.conta),
        puo: g.id === myId && inGara && !hoPassato && max >= prezzo };
    });
    stadio(t, {
      chiave: "fo|" + (vm.codice || "") + "|" + (vm.sessione || ""), fase: a ? "asta" : "esito",
      info: (a ? ru.nome + " all'asta" : e.tipo === "accollo" ? "Nessuno lo vuole" : "Aggiudicato!") + " · " + (vm.presi || (vm.restano + " in mazzo")),
      carta: carta, giroCarta: a ? a.nCarta : e.nCarta, prezzo: a ? v.offerta : e.prezzo, base: !!a && !v.leader, leader: a ? v.leader : (e.chiId || null),
      budget: FANTA_BUDGET, grosso: 5, piedeAlto: io ? "onl" : "",
      persone: persone, io: myId || "—", mie: mie, giro: a ? a.giro : null, resta: a ? a.resta : 0, durata: a ? (a.durata || FANTA_RILANCIO_MS) : FANTA_RILANCIO_MS, puoPassare: false,
      kPiede: a ? [a.nCarta, hoPassato ? 1 : 0, inGara ? 1 : 0, max].join("|") : null,   // (prezzi e «Passo» cambiano al loro posto, anche quando divento io il capo: vedi tastiOfferta)
      esito: e ? { n: e.n, nCarta: e.nCarta, tipo: e.tipo, motivo: e.motivo || "", chiId: e.chiId, chiNome: e.chiNome, carta: e.carta, prezzo: e.prezzo } : null,
      avviso: a ? avvisoFanta(a.ultimoDuello, a.ultimaChiamata, a.ruolo) : "",
      nota: !a ? "" : !io ? "Stai guardando la partita" : !inGara ? "Hai già " + (a.ruolo === "C" ? "i 2 centrocampisti" : "il " + ru.nome.toLowerCase()) + " in rosa" : hoPassato ? "Hai passato: aspetti il risultato" : guido ? (max >= prezzo ? "👑 L'offerta più alta è tua: tocca ancora per rialzare" : "👑 L'offerta più alta è tua")
        : tardi ? "⏱ Troppo tardi di un soffio: qualcuno ha offerto prima di te. Ora è " + a.offerta + " 💰" : "Hai " + io.crediti + " 💰 · puoi arrivare a " + Math.max(0, max),
      onRilancia: function () { offri(null, 0); }, onPassa: function () { if (a) cb.onPassa({ n: a.nCarta }); },
      onIndietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); },
      extra: { testo: "👕 Tutte", apri: function () { formazioni(t, vm.giocatori); } }
    });
  }
  // sotto l'avatar nel fantacalcio: i crediti e fin dove può arrivare; sotto ancora i posti che gli mancano (🧤🛡️🎽⚽)
  function notaCrediti(crediti, max) { return crediti + " 💰" + (max != null && max < crediti ? " · max " + Math.max(0, max) : ""); }   // sotto l'avatar: i crediti e fin dove può arrivare (nel fanta sotto ancora i posti che gli mancano)
  function iconeMancano(conta) {
    var s = ""; FANTA_ORD.forEach(function (r) { for (var k = (conta && conta[r]) || 0; k < FANTA_SLOT[r]; k++) s += FANTA_RUOLI[r].emoji; });
    return s;
  }

  // =========================================================
  //  FINE DEL FANTACALCIO: si scoprono i valori. Le rose si svelano una alla volta, dalla meno preziosa alla più preziosa:
  //  il contatore sale (ti-ti-ti) fino al valore della rosa (la somma delle quotazioni ufficiali) e a ogni calciatore che passa
  //  spunta il suo valore sulla maglia. Poi (se c'è) la giornata, poi il podio. Senza giornata vince la rosa che vale di più
  //  (a pari valore chi ha più crediti avanzati).
  // =========================================================
  var RIVELA = null;
  function valoreCalc(c) { var V = (window.SG_FANTA_QUOTAZIONI || {}).valori || {}, v = +V[c.nome + " (" + c.squadra + ")"]; return v > 0 ? v : 1; }
  // serieA: un oggetto da riempire se si gioca anche la giornata (vedi giornataSerieA): allora la classifica va per fantapunti.
  // r.posV = il posto per valore
  function classificaFanta(giocatori, serieA) {
    var righe = giocatori.map(function (g, i) {
      var kit = ordinaRosa(g.kit || []).map(function (c) { return { nome: c.nome, squadra: c.squadra, ruolo: c.ruolo, valore: valoreCalc(c), prezzo: c.prezzo || 0 }; }), tot = 0;
      kit.forEach(function (c) { tot += c.valore; });
      return { id: g.id != null ? g.id : i, nome: g.nome, omino: g.omino || null, crediti: g.crediti, kit: kit, totale: tot };
    });
    righe.sort(function (a, b) { return (b.totale - a.totale) || (b.crediti - a.crediti); });
    righe.forEach(function (r, i) { var p = righe[i - 1]; r.pos = r.posV = p && p.totale === r.totale && p.crediti === r.crediti ? p.pos : i + 1; r.punti = "valore " + r.totale; });
    if (!serieA) return righe;
    giornataSerieA(righe, serieA);
    righe.sort(function (a, b) { return (b.gio.punti - a.gio.punti) || (b.totale - a.totale) || (b.crediti - a.crediti); });
    righe.forEach(function (r, i) { var p = righe[i - 1]; r.pos = p && p.gio.punti === r.gio.punti && p.totale === r.totale && p.crediti === r.crediti ? p.pos : i + 1; r.punti = numFanta(r.gio.punti) + " fantapunti"; });
    return righe;
  }

  // =========================================================
  //  ⚽ LA GIORNATA DOPO L'ASTA (accesa di partenza; si spegne nel ⚙️): una giornata di Serie A finta, come nel fantacalcio
  //  vero. I vostri calciatori non giocano tra di loro: ognuno gioca con la sua squadra contro chi capita.
  //  - Le 20 squadre si sorteggiano in 10 partite. Il risultato dipende da attacco e difesa veri (gol fatti e subiti a partita
  //    l'anno scorso, data/fanta-squadre.js; le neopromosse un po' sotto la media) e dal fattore campo.
  //  - I gol li segna un calciatore della squadra (più è quotato e più gioca avanti, più è facile; ogni tanto uno che nel
  //    gioco non c'è), 7 volte su 10 con l'assist di un compagno. Ogni squadra prende un rigore circa una partita su 7: lo tira
  //    il primo rigorista di quest'anno 3 volte su 4 (il secondo 1 su 5, il terzo raramente), con la sua percentuale vera.
  //    Ogni tanto un autogol. Per chi avete comprato anche i cartellini (le statistiche vere di ognuno) e le occasioni mancate
  //    (palo, fuori, parata: non danno punti, solo il brivido).
  //  - Chi avete comprato gioca sempre (se una squadra ha due portieri nel gioco, giocano tutti e due) e prende i punti del
  //    fantacalcio: voto in pagella + gol +3, assist +1, giallo −0,5, rosso −1, rigore sbagliato −3, autogol −2; il portiere
  //    gol subito −1, porta inviolata +1, rigore parato +3. Vince chi fa più fantapunti (a pari punti la rosa che vale di più).
  //  La gioca chi tiene la partita (online l'host): va a tutti dentro la foto e la vedono tutti uguale.
  // =========================================================
  var MEDIA_QUOT = { P: 9, D: 8, C: 11, A: 13 };   // la quotazione "di metà" di ogni ruolo, tra i calciatori del gioco
  var EV_GIO = { gol: "⚽", ass: "👟", amm: "🟨", esp: "🟥", sub: "🥅", par: "🧤", inv: "🔒", rig: "❌", aut: "🙈", rec: "👏" };
  var VOTO_EV = { gol: 0.75, ass: 0.35, esp: -1.25, rig: -0.5, aut: -0.5, sub: -0.25, par: 0.75, inv: 0, rec: 0.4 };   // quanto cambia il voto (oltre ai bonus; la porta inviolata è solo il +1)
  var RIG_A_PARTITA = 0.14;   // rigori a partita per squadra (Serie A 2025/26: 106 rigori in 380 partite)
  var RIG_CHI = [0.75, 0.2, 0.05];   // chi tira il rigore: il primo della lista 3 volte su 4, il secondo 1 su 5, il terzo raramente
  var PESO_GOL = { A: 1, C: 0.32, D: 0.09, P: 0 }, PESO_ASS = { A: 0.55, C: 1, D: 0.35, P: 0.02 };
  function lim(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function numFanta(x) { return String(Math.round(x * 2) / 2).replace(".", ","); }   // 32,5
  function caso01() { return Math.random(); }
  function gauss() { return Math.sqrt(-2 * Math.log(caso01() || 1e-9)) * Math.cos(2 * Math.PI * caso01()); }
  function morbido(l) { return Math.max(0, Math.round(l + gauss() * Math.sqrt(l) * 0.8)); }   // (i gol di una squadra: come il caso del calcio vero, ma con meno risultati pazzi)
  function poisson(l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= caso01(); } while (p > L); return k - 1; }
  // il minuto di un momento: come nel calcio vero il finale è più fitto (30 ott 2026, la «⏳ Zona Cesarini»: in Serie A negli ultimi 15'
  // arriva circa un gol su cinque e il recupero è il pezzo con più gol al minuto): 7 momenti su 10 tra l'1' e il 74', 2 dal 75' al 89',
  // 1 nel recupero (91-95 = 90'+1…+5)
  function minuto() { var z = caso01(); return z < 0.7 ? 1 + Math.floor(caso01() * 74) : z < 0.9 ? 75 + Math.floor(caso01() * 15) : 91 + Math.floor(caso01() * 5); }
  function aCaso(l) { return l[Math.floor(caso01() * l.length)]; }
  // come nasce un gol (la scena che si vede): con l'assist di un compagno o da solo; le rarità (rovesciata, da centrocampo, dal
  // calcio d'angolo) capitano più o meno una volta ogni 20-40 giornate a testa
  var SCENE_ASS = [["cross", 26], ["angolo", 14], ["unodue", 16], ["contro", 14], ["pallonetto", 10], ["rovesciata", 0.9]];
  var SCENE_SOLO = [["fuori", 26], ["slalom", 14], ["punizione", 12], ["tapin", 22], ["centrocampo", 0.35], ["olimpico", 0.45]];
  var SCENE_OCC = ["cross", "angolo", "unodue", "contro", "pallonetto", "fuori", "slalom", "punizione", "tapin"];
  function scenaGol(conAss) { return pescaPeso(conAss ? SCENE_ASS : SCENE_SOLO, function (x) { return x[1]; })[0]; }
  function chiaveCalc(c) { return c.nome + " (" + c.squadra + ")"; }
  function normNome(n) { return String(n || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z. ]/g, "").trim(); }
  function pescaPeso(l, peso) {   // uno della lista, a caso secondo il suo peso (null se non c'è nessuno)
    var tot = 0; l.forEach(function (x) { tot += peso(x); }); if (tot <= 0) return null;
    var z = caso01() * tot; for (var i = 0; i < l.length; i++) { z -= peso(l[i]); if (z <= 0) return l[i]; } return l[l.length - 1];
  }
  function cartelliniDi(c) {   // [giallo, rosso] a giornata: le statistiche vere del calciatore, se no la media del suo ruolo
    var D = window.SG_FANTA_STATISTICHE || {}, v = (D.valori || {})[chiaveCalc(c)] || (D.media || {})[c.ruolo] || [10, 0.5];
    return [v[0] / 100, v[1] / 100];
  }
  var ROSE_SA = null;
  function roseSerieA() {   // i calciatori del gioco squadra per squadra: { "Inter": [{ k: "Martinez L. (Inter)", nome, squadra, ruolo, q }] }
    if (ROSE_SA) return ROSE_SA;
    var DB = window.SG_FANTA_CALCIATORI || {}, out = {};
    FANTA_ORD.forEach(function (r) { ["A", "B", "C"].forEach(function (t) { ((DB[r] || {})[t] || []).forEach(function (s) {
      var c = splitCalc(s); c.ruolo = r; (out[c.squadra] = out[c.squadra] || []).push({ k: chiaveCalc(c), nome: c.nome, squadra: c.squadra, ruolo: r, q: valoreCalc(c) });
    }); }); });
    return (ROSE_SA = out);
  }
  function infoSquadra(sq) { return (((window.SG_FANTA_SQUADRE || {}).squadre) || {})[sq] || null; }
  function rigoristiDi(sq) {   // i rigoristi di quest'anno in ordine: [{ nome, k (se è nel gioco), conv: la percentuale (con poche prove si avvicina al 76%) }]
    var S = infoSquadra(sq), rosa = roseSerieA()[sq] || [];
    return ((S && S.rigori) || []).map(function (x) {
      var c = rosa.filter(function (y) { return normNome(y.nome) === normNome(x[0]); })[0];
      return { nome: x[0], k: c ? c.k : null, conv: ((x[1] || 0) + 0.76 * 4) / ((x[2] || 0) + 4) };
    });
  }
  function tiratoriDi(sq, tipo) {   // chi batte le punizioni (tipo "punizioni") o gli angoli ("angoli") quest'anno, in ordine: [{ nome, c: il calciatore se è nel gioco }]
    var S = infoSquadra(sq), rosa = roseSerieA()[sq] || [], l = (S && S[tipo]) || [];
    if (!l.length && tipo === "angoli" && S) l = S.punizioni || [];   // (se non si sa chi batte gli angoli: chi batte le punizioni)
    return l.map(function (n) { return { nome: n, c: rosa.filter(function (y) { return normNome(y.nome) === normNome(n); })[0] || null }; });
  }
  function tiroN(c, tipo) {   // 1, 2, 3 se batte le punizioni (o gli angoli) per la sua squadra (per la scritta all'asta), se no 0
    var l = tiratoriDi(c.squadra, tipo);
    for (var i = 0; i < l.length; i++) if (normNome(l[i].nome) === normNome(c.nome)) return i + 1;
    return 0;
  }
  function battitore(sq, tipo) {   // chi batte questa punizione (o questo angolo): il primo 3 volte su 4, il secondo 1 su 5, il terzo raramente; undefined = la squadra non ha la lista
    var l = tiratoriDi(sq, tipo), x = 0, z = caso01(); if (!l.length) return undefined;
    while (x < l.length - 1 && z > RIG_CHI[x]) { z -= RIG_CHI[x]; x++; }
    return l[x].c;   // (null: uno che nel gioco non c'è)
  }
  function tiriPiazzati(sq, v, m, as) {   // [chi segna, chi fa l'assist] secondo la scena: la punizione la segna chi batte le punizioni, il gol direttamente dall'angolo chi batte gli angoli, l'assist sull'angolo è di chi lo batte
    var b;
    if (v === "punizione" || v === "olimpico") { b = battitore(sq, v === "punizione" ? "punizioni" : "angoli"); if (b !== undefined) return [b, as && as !== b ? as : null]; }
    else if (v === "angolo" && as) {
      b = battitore(sq, "angoli");
      if (b !== undefined && b && b === m) b = (tiratoriDi(sq, "angoli").filter(function (x) { return x.c !== m; })[0] || { c: null }).c;   // (chi batte l'angolo non può fare l'assist a sé stesso: lo batte il prossimo)
      if (b !== undefined) return [m, b !== m ? b : null];
    }
    return [m, as];
  }
  function rigoristaN(c) {   // 1, 2, 3 se il calciatore è nella lista dei rigoristi della sua squadra (per la scritta all'asta), se no 0
    var l = rigoristiDi(c.squadra), k = chiaveCalc(c);
    for (var i = 0; i < l.length; i++) if (l[i].k === k || normNome(l[i].nome) === normNome(c.nome)) return i + 1;
    return 0;
  }
  function marcatore(rosa, peso, tranne) {   // chi segna (o fa l'assist) tra i calciatori del gioco di quella squadra; null = uno che nel gioco non c'è
    if (caso01() < 0.15) return null;
    return pescaPeso(rosa.filter(function (y) { return y !== tranne; }), function (y) { return peso[y.ruolo] * Math.pow(y.q + 2, 2); });   // (più è quotato, più segna: 30 ott 2026, la rosa più forte vince un po' più spesso)
  }
  // una partita: { c: squadra di casa, f: fuori casa, gc, gf: i gol, ev: [{ m: minuto (91-95 = recupero), t: "gol"|"rig"|"rigP"|"rigF"|"aut"|
  //   "amm"|"esp"|"occ"|"ann" (gol annullato dal VAR), s: "c"|"f" (la squadra di chi fa la cosa), chi: chiave del calciatore (o nome, o
  //   null), ass, v: la scena ("cross", "fuori", "rovesciata"…), fin: com'entra o come esce ("palo", "dev", "traversa"…), esito
  //   (occasione: "palo"|"fuori"|"alto"|"parata"|"traversa"|"linea"), come (rigore: "fallo"|"mano"|"var"; cartellino: "entrata"|
  //   "tattico"|"proteste"|"simula"|"ultimo"), rip (rigore da ripetere), rib (ribattuta parata), dg (secondo giallo), perche (VAR),
  //   r: [gc, gf] il risultato dopo questo momento }] }
  // le squadre con lo stesso stadio non giocano mai in casa tutte e due nella stessa giornata (il derby tra loro sì)
  var STADI_COMUNI = [["Inter", "Milan"], ["Roma", "Lazio"]];   // San Siro, l'Olimpico
  function stadiGiusti(coppie) {   // coppie: [[casa, fuori]]; se due «coinquiline» sono in casa, una delle due partite si gira
    for (var giro = 0; giro < 30; giro++) {
      var ok = true;
      STADI_COMUNI.forEach(function (st) {
        var a = coppie.filter(function (c) { return c[0] === st[0]; })[0], b = coppie.filter(function (c) { return c[0] === st[1]; })[0];
        if (a && b && a !== b) { ok = false; var c = caso01() < 0.5 ? a : b, x = c[0]; c[0] = c[1]; c[1] = x; }
      });
      if (ok) return;
    }
  }
  function partitaSA(casa, fuori, med, rose, comprati) {
    var P = { c: casa, f: fuori, gc: 0, gf: 0, ev: [] }, lato = { c: casa, f: fuori };
    ["c", "f"].forEach(function (s) {
      var io = infoSquadra(lato[s]) || med, lui = infoSquadra(lato[s === "c" ? "f" : "c"]) || med, rosa = rose[lato[s]] || [], k;
      var att = io.gf * (lui.gs / med.gs) * (s === "c" ? 1.08 : 0.92), gol = morbido(lim(att - RIG_A_PARTITA * 0.76, 0.12, 4));
      for (k = 0; k < gol; k++) {
        var mm = minuto(), m = marcatore(rosa, PESO_GOL), as = caso01() < 0.7 ? marcatore(rosa, PESO_ASS, m) : null, v = scenaGol(!!as), tp = tiriPiazzati(lato[s], v, m, as);
        m = tp[0]; as = tp[1];
        if (mm > 88 && caso01() < 0.008) { var pr = rosa.filter(function (y) { return y.ruolo === "P"; })[0]; if (pr) { m = pr; v = "portiere"; var bp = battitore(lato[s], "angoli"); if (bp !== undefined) as = bp !== pr ? bp : null; } }   // 🧤 il portiere sale per l'ultimo assalto e segna di testa
        var eg = { m: mm, t: "gol", s: s, chi: m ? m.k : null, ass: as ? as.k : null, v: v };
        if (caso01() < 0.1) eg.fin = "palo";   // (palo e dentro)
        else if ((v === "fuori" || v === "punizione") && caso01() < 0.2) eg.fin = "dev";   // (deviato da un difensore)
        P.ev.push(eg);
      }
      if (caso01() < 0.07) {   // 📺 un gol annullato dal VAR: non conta, solo il brivido
        var ma = marcatore(rosa, PESO_GOL), aa = caso01() < 0.6 ? marcatore(rosa, PESO_ASS, ma) : null, va = scenaGol(!!aa), ta = tiriPiazzati(lato[s], va, ma, aa);
        ma = ta[0]; aa = ta[1];
        P.ev.push({ m: minuto(), t: "ann", s: s, chi: ma ? ma.k : null, ass: aa ? aa.k : null, v: va, perche: aCaso(["fuorigioco", "fuorigioco", "fallo", "mano"]) });
      }
      if (caso01() < RIG_A_PARTITA) {   // 🎯 un rigore
        var l = rigoristiDi(lato[s]), x = 0, z = caso01();
        while (x < l.length - 1 && z > RIG_CHI[x]) { z -= RIG_CHI[x]; x++; }
        var tir = l[x] || null, dentro = caso01() < (tir ? tir.conv : 0.76);
        var er = { m: minuto(), t: dentro ? "rig" : caso01() < 0.65 ? "rigP" : "rigF", s: s, chi: tir ? (tir.k || tir.nome) : null, come: aCaso(["fallo", "fallo", "fallo", "mano", "var", "var"]) };
        if (er.t === "rig" && caso01() < 0.06) er.v = "cucchiaio";
        if (er.t === "rigF") er.fin = aCaso(["fuori", "fuori", "palo", "traversa", "alto"]);
        if (caso01() < 0.06) er.rip = 1;   // (il portiere si era mosso prima: si tira due volte)
        P.ev.push(er);
        if (er.t === "rigP" && caso01() < 0.4) {   // la ribattuta: qualcuno ci arriva (anche lo stesso rigorista) o il portiere para anche quella
          if (caso01() < 0.55) { var rb = marcatore(rosa, PESO_GOL); P.ev.push({ m: er.m, t: "gol", s: s, chi: rb ? rb.k : null, ass: null, v: "ribattuta" }); }
          else er.rib = 1;
        }
      }
      if (caso01() < 0.05) {   // 🙈 un autogol (il gol va agli altri)
        var dif = pescaPeso(rosa.filter(function (y) { return y.ruolo === "D"; }), function (y) { return y.q + 2; });
        P.ev.push({ m: minuto(), t: "aut", s: s, chi: dif ? dif.k : null, v: aCaso(["cross", "angolo", "fuori"]) });
      }
      rosa.forEach(function (y) {   // i vostri calciatori: cartellini e occasioni mancate
        if (!comprati[y.k] || y.ruolo === "P") return;
        var ca = cartelliniDi(y);
        if (caso01() < ca[1]) P.ev.push({ m: minuto(), t: "esp", s: s, chi: y.k, come: caso01() < 0.4 ? "ultimo" : "entrata" });
        else if (caso01() < ca[0]) {
          var m1 = minuto();
          P.ev.push({ m: m1, t: "amm", s: s, chi: y.k, come: y.ruolo === "A" && caso01() < 0.2 ? "simula" : aCaso(["entrata", "entrata", "tattico", "proteste"]) });
          if (m1 < 85 && caso01() < 0.07) P.ev.push({ m: m1 + 1 + Math.floor(caso01() * (89 - m1)), t: "esp", s: s, chi: y.k, dg: 1, come: "entrata" });   // 🟨🟨 il secondo giallo
        }
        if (caso01() < ca[0] * 0.5 + ca[1]) P.ev.push({ m: minuto(), t: "rec", s: s, chi: y.k });   // 👏 un'entrata dura… pulita: così «entrata dura» non vuol dire per forza giallo (circa una volta su due)
        var occ = y.ruolo === "A" ? 0.25 + 0.012 * y.q : y.ruolo === "C" ? 0.1 + 0.006 * y.q : 0, vo = aCaso(SCENE_OCC);
        if (vo === "punizione" && !tiroN(y, "punizioni")) vo = aCaso(SCENE_OCC.filter(function (x) { return x !== "punizione"; }));   // (la punizione la tira chi la batte)
        var ao = caso01() < 0.6 ? marcatore(rosa, PESO_ASS, y) : null;   // (anche le occasioni hanno chi passa, come i gol: il nome di chi passa non svela niente)
        if (caso01() < occ) P.ev.push({ m: minuto(), t: "occ", s: s, chi: y.k, ass: ao ? ao.k : null, esito: aCaso(["palo", "fuori", "fuori", "alto", "parata", "parata", "traversa", "linea"]), v: vo });
      });
      // contro un vostro portiere ogni tanto anche un tiro che non entra (se no «azione pericolosa» contro di lui voleva dire sempre gol)
      if ((rose[lato[s === "c" ? "f" : "c"]] || []).some(function (y) { return y.ruolo === "P" && comprati[y.k]; })) {
        for (var o2 = poisson(0.9); o2 > 0; o2--) { var tz = marcatore(rosa, PESO_GOL), vz = aCaso(SCENE_OCC); if (vz === "punizione") { var bz = battitore(lato[s], "punizioni"); if (bz !== undefined) tz = bz; } P.ev.push({ m: minuto(), t: "occ", s: s, chi: tz ? tz.k : null, esito: aCaso(["parata", "parata", "parata", "fuori", "alto", "palo", "traversa", "linea"]), v: vz }); }
      }
    });
    P.ev.sort(function (a, b) { return a.m - b.m; });
    // chi è espulso non gioca più: i gol, gli assist, i rigori dopo il rosso li fa un compagno (che nel gioco non c'è); occasioni e gialli dopo il rosso spariscono
    var rossi = {}; P.ev.forEach(function (e) { if (e.t === "esp" && e.chi && rossi[e.chi] == null) rossi[e.chi] = e.m; });
    P.ev = P.ev.filter(function (e) {
      var dopo = function (k) { return k && rossi[k] != null && e.m > rossi[k]; };
      if ((e.t === "occ" || e.t === "amm" || e.t === "esp" || e.t === "rec") && dopo(e.chi)) return false;
      if ((e.t === "occ" || e.t === "rec") && e.chi && rossi[e.chi] === e.m) return false;   // (nemmeno nello stesso minuto del rosso)
      if (dopo(e.chi)) e.chi = null;
      if (dopo(e.ass)) e.ass = null;
      return true;
    });
    rifaiRisultati(P);
    return P;
  }
  function rifaiRisultati(P) {   // il risultato dopo ogni momento (e.r) e quello finale
    P.gc = 0; P.gf = 0;
    P.ev.forEach(function (e) {
      if (e.t === "gol" || e.t === "rig") { if (e.s === "c") P.gc++; else P.gf++; }
      else if (e.t === "aut") { if (e.s === "c") P.gf++; else P.gc++; }
      e.r = [P.gc, P.gf];
    });
  }
  // la giornata: A.partite (le 10 partite) e, per ogni rosa, r.gio = { voti, bonus, punti, cal: [per ogni calciatore della rosa
  // { v: voto, fv: fantavoto, ev: [{ m, t, d: punti, p: la partita, e: il momento (−1 = a fine partita) }] }] }
  function giornataSerieA(righe, A) {
    var med = (window.SG_FANTA_SQUADRE || {}).media || { gf: 1.25, gs: 1.25 }, rose = roseSerieA(), comprati = {}, punti = {};
    righe.forEach(function (r) { r.kit.forEach(function (c) { comprati[chiaveCalc(c)] = 1; }); });
    var sq = Object.keys(((window.SG_FANTA_SQUADRE || {}).squadre) || {}); if (sq.length < 2) sq = Object.keys(COLORI_SQUADRE);
    sq = mischia(sq); A.partite = [];
    var coppie = []; for (var i = 0; i + 1 < sq.length; i += 2) coppie.push([sq[i], sq[i + 1]]);
    stadiGiusti(coppie);
    coppie.forEach(function (c) { A.partite.push(partitaSA(c[0], c[1], med, rose, comprati)); });
    // ⏳ la Zona Cesarini (30 ott 2026): dal 75' almeno 3 momenti dei vostri calciatori (se mancano si aggiungono occasioni senza punti:
    // pali, parate, salvataggi), e una volta su due una in più. Non cambiano né i punti né i risultati
    var tardi = 0, cand = [];
    A.partite.forEach(function (P) {
      P.ev.forEach(function (e) { if (e.m >= 75 && ((e.chi && comprati[e.chi]) || (e.ass && comprati[e.ass]))) tardi++; });
      ["c", "f"].forEach(function (s) { (rose[s === "c" ? P.c : P.f] || []).forEach(function (y) { if (comprati[y.k] && y.ruolo !== "P") cand.push({ P: P, s: s, y: y }); }); });
    });
    for (var vz = Math.max(0, 3 - tardi) + (caso01() < 0.5 ? 1 : 0); vz > 0 && cand.length;) {
      var cq = pescaPeso(cand, function (x) { return x.y.ruolo === "A" ? 3 : x.y.ruolo === "C" ? 2 : 1; }), mz = caso01() < 0.75 ? 75 + Math.floor(caso01() * 15) : 91 + Math.floor(caso01() * 4);
      if (cq.P.ev.some(function (e) { return e.t === "esp" && e.chi === cq.y.k && e.m <= mz; })) { cand.splice(cand.indexOf(cq), 1); continue; }   // (chi è espulso non tira più)
      var sz = aCaso(SCENE_OCC); if (sz === "punizione" && !tiroN(cq.y, "punizioni")) sz = "fuori";
      var aq = caso01() < 0.6 ? marcatore(rose[cq.s === "c" ? cq.P.c : cq.P.f] || [], PESO_ASS, cq.y) : null;
      cq.P.ev.push({ m: mz, t: "occ", s: cq.s, chi: cq.y.k, ass: aq ? aq.k : null, esito: aCaso(["palo", "parata", "parata", "traversa", "linea", "fuori"]), v: sz });
      cq.P.ev.sort(function (a, b) { return a.m - b.m; }); rifaiRisultati(cq.P); vz--;
    }
    // 🎬 le scene da finale (30 ott 2026, tappa 2): dal 75' i momenti dei vostri calciatori diventano spesso mischie, assedi, tiri
    // all'incrocio, doppie parate, colpi di testa su palla lunga e (dall'85', per chi perde o pareggia) l'ultimo
    // assalto col portiere in area. Cambia solo la scena: chi segna, chi fa l'assist e i punti restano quelli. In una giornata nessuna si ripete
    var usate = {};
    A.partite.forEach(function (P) {
      P.ev.forEach(function (e, ei) {
        if (e.m < 75 || !(e.t === "gol" || e.t === "occ" || e.t === "ann") || /^(punizione|olimpico|portiere|ribattuta|centrocampo|rovesciata)$/.test(e.v || "")) return;
        var difende = rose[e.s === "c" ? P.f : P.c] || [], nostro = (e.chi && comprati[e.chi]) || (e.ass && comprati[e.ass]) || difende.some(function (y) { return y.ruolo === "P" && comprati[y.k]; });
        if (!nostro || caso01() < 0.3) return;   // (non tutte: restano anche le scene di sempre)
        var r0 = ei > 0 ? P.ev[ei - 1].r : [0, 0], mio = r0[e.s === "c" ? 0 : 1], suo = r0[e.s === "c" ? 1 : 0];
        // (la STESSA lista per gol e occasioni, qualunque cosa succeda: la scena non deve dire come finisce; dall'85' chi perde o pareggia, guardando
        // il risultato di PRIMA, si butta avanti col portiere)
        var l = ["mischia", "testa", "assedio", "incrocio", "miracolo"];
        if (e.m >= 85 && mio <= suo) l.push("ultimo", "ultimo");
        l = l.filter(function (x) { return !usate[x]; }); if (!l.length) return;
        e.v = aCaso(l); usate[e.v] = 1;
      });
    });
    var maxM = 90; A.partite.forEach(function (P) { P.ev.forEach(function (e) { if (e.m > maxM) maxM = e.m; }); });
    A.rec = Math.min(6, Math.max(3 + Math.floor(caso01() * 3), maxM - 90 + 1));   // ⏱️ il recupero annunciato al 90' (sempre almeno 3': non dice se succederà ancora qualcosa)
    function dai(k, m, t, d, p, e) { if (k && comprati[k]) (punti[k] = punti[k] || []).push({ m: m, t: t, d: d, p: p, e: e }); }
    A.partite.forEach(function (P, pi) {
      var por = { c: (rose[P.c] || []).filter(function (y) { return y.ruolo === "P"; }), f: (rose[P.f] || []).filter(function (y) { return y.ruolo === "P"; }) }, presi = { c: 0, f: 0 };
      P.ev.forEach(function (e, ei) {
        var avv = e.s === "c" ? "f" : "c";
        if (e.t === "gol" || e.t === "rig") { dai(e.chi, e.m, "gol", 3, pi, ei); dai(e.ass, e.m, "ass", 1, pi, ei); por[avv].forEach(function (y) { dai(y.k, e.m, "sub", -1, pi, ei); }); presi[avv]++; }
        else if (e.t === "rigP") { dai(e.chi, e.m, "rig", -3, pi, ei); por[avv].forEach(function (y) { dai(y.k, e.m, "par", 3, pi, ei); }); }
        else if (e.t === "rigF") dai(e.chi, e.m, "rig", -3, pi, ei);
        else if (e.t === "aut") { dai(e.chi, e.m, "aut", -2, pi, ei); por[e.s].forEach(function (y) { dai(y.k, e.m, "sub", -1, pi, ei); }); presi[e.s]++; }
        else if (e.t === "amm") dai(e.chi, e.m, "amm", -0.5, pi, ei);
        else if (e.t === "esp") dai(e.chi, e.m, "esp", e.dg ? -0.5 : -1, pi, ei);
        else if (e.t === "rec") dai(e.chi, e.m, "rec", 0, pi, ei);   // (l'entrata pulita: niente bonus, ma il voto sale)
        else if (e.t === "ann") { dai(e.chi, e.m, "ann", 0, pi, ei); dai(e.ass, e.m, "ann", 0, pi, ei); por[avv].forEach(function (y) { dai(y.k, e.m, "ann", 0, pi, ei); }); }
        else if (e.t === "occ") { dai(e.chi, e.m, "occ", 0, pi, ei); por[avv].forEach(function (y) { dai(y.k, e.m, "occ", 0, pi, ei); }); }   // (anche il portiere che difende vede il momento)
      });
      ["c", "f"].forEach(function (s) { if (!presi[s]) por[s].forEach(function (y) { dai(y.k, 90, "inv", 1, pi, -1); }); });
    });
    righe.forEach(function (r) {
      var cal = r.kit.map(function (c) {
        // il voto in pagella: tutti partono da 6, poi come gioca (primo tempo z1, secondo tempo z2), quanto è forte, se la
        // squadra vince o perde e quello che fa (un gol alza il voto, un rosso lo abbassa: oltre ai bonus e malus)
        var l = (punti[chiaveCalc(c)] || []).sort(function (a, b) { return a.m - b.m; }), d = c.valore - (MEDIA_QUOT[c.ruolo] || 10), b = 0;
        var por = c.ruolo === "P", z1 = gauss() * (por ? 0.15 : 0.45), z2 = gauss() * (por ? 0.12 : 0.3), forte = d * (por ? 0.02 : 0.035);   // (il portiere di solito prende 6: si muove poco)
        var P = A.partite.filter(function (x) { return x.c === c.squadra || x.f === c.squadra; })[0], casa = P && P.c === c.squadra;
        // 📈 il voto di adesso (30 ott 2026, i voti in diretta): arriva un po' alla volta (il primo tempo z1, il secondo z2, quanto è forte),
        // col risultato di quel minuto e coi suoi momenti già successi. Solo quello che è già successo: niente spoiler. A fine partita è il voto vero
        function adesso(m, ei) {   // (ei: il posto del momento nella sua partita: si conta solo fino a lui, nello stesso minuto ne possono venire altri dopo)
          var x = 6 + z1 * Math.min(m, 45) / 45 + z2 * lim((m - 45) / 45, 0, 1) + forte * Math.min(m, 90) / 90, r = [0, 0];
          if (P) P.ev.forEach(function (e, j) { if (ei != null ? j <= ei : e.m <= m) r = e.r; });
          var mio = r[casa ? 0 : 1], suo = r[casa ? 1 : 0];
          x += (mio > suo ? 0.25 : mio < suo ? -0.25 : 0) * Math.min(m, 90) / 90 * (por ? 0.4 : 1);
          l.forEach(function (e) { if (ei != null ? e.e >= 0 && e.e <= ei : e.m <= m) x += VOTO_EV[e.t] || 0; });
          return Math.round(lim(x, 4, 8.5) * 2) / 2;
        }
        l.forEach(function (e) { b += e.d; e.vv = e.e < 0 ? adesso(99) : adesso(e.m, e.e); });   // (vv: il suo voto subito dopo quel momento, per i quadretti in alto; la porta inviolata si vede dopo il fischio: il voto vero)
        var v = adesso(99);
        return { v: v, v1: adesso(45), v75: adesso(74.9), fv: v + b, ev: l };   // (v1: il voto a fine primo tempo; v75: all'inizio della Zona Cesarini)
      }), voti = 0, bonus = 0;
      cal.forEach(function (x) { voti += x.v; x.ev.forEach(function (e) { bonus += e.d; }); });
      r.gio = { voti: voti, bonus: bonus, punti: voti + bonus, cal: cal };
    });
  }
  // opz: { chiave, onEsci, mio (online: il mio id), bottoni: function () → i tasti da mettere in fondo quando appare il podio }
  function rivelaFanta(t, righe, opz) {
    if (RIVELA && RIVELA.chiave === opz.chiave && document.body.contains(RIVELA.radice)) {
      RIVELA.opz = opz; if (opz.cron && RIVELA.cron) RIVELA.cron = opz.cron;   // (la foto nuova: il piano col ⏩ e i passi di chi tiene la partita)
      nuoviPassi(RIVELA); if (RIVELA.finito) piedeRivela(RIVELA); return;
    }
    fermaRivela(RIVELA);
    var el = t.el, R = { el: el, chiave: opz.chiave, opz: opz, righe: righe, timer: [], iv: null, finito: false, conta: [] }, sfondo = el("div", { class: "sa-sfondo" }), quadro = arte("stadio", "");
    if (quadro) sfondo.style.backgroundImage = "url(\"" + quadro + "\")";
    var board = maxischermo(el, R, true), conGio = !!(righe[0] && righe[0].gio);
    R.campoBox = palco(el, R);
    R.gioTab = el("div", { class: "st-gio-tab" });
    R.azBox = el("div", { class: "st-az-box" });   // 🎬 il campetto delle azioni
    R.ris = el("div", { class: "st-ris" });   // i risultati delle 10 partite
    R.barMin = el("span", { class: "st-bar-min" }); R.barIn = el("div", { class: "st-bar-in" });
    // ⏩ (×2): sullo stesso telefono come sempre; online lo tocca chi tiene la partita e vale per tutti (gli altri lo vedono acceso)
    R.velB = el("button", { class: "st-bar-vel" + (opz.cron && !opz.onVel ? " sola" : ""), text: "⏩", "aria-label": "Veloce", onclick: function () {
      if (R.opz.cron && !R.opz.onVel) return;
      var v = segDi(R.cron, R.ora())[2] === 2 ? 1 : 2;
      try { localStorage.setItem("sg-asta-veloce", v === 2 ? "1" : "0"); } catch (e) {}
      if (R.opz.onVel) R.opz.onVel(v); else aggiungiVel(R.cron, R.ora(), v);
      R.tic();
    } });
    R.radio = el("div", { class: "st-radio" });   // 📻 la striscia della radio e del sorpasso (sopra la barra, per un attimo)
    R.bar = el("div", { class: "st-bar" }, [ R.barMin, R.barIn, R.velB, R.radio ]);   // il minuto, la partita del momento e il tasto ⏩ Veloce
    R.msg = el("div", { class: "st-msg" }); R.azBox.appendChild(R.msg);   // l'annuncio e l'esito, sul campo
    R.pag = el("div", { class: "st-pag" });   // le pagelle (a fine primo tempo e al fischio finale)
    R.gio = el("div", { class: "st-gio", style: "display:none" }, [ R.gioTab, R.bar, R.azBox, R.ris, R.pag ]);   // ⚽ la giornata: i punteggi di ognuno, il minuto, le azioni e sotto i risultati delle partite
    R.podio = el("div", { class: "st-podio", style: "display:none" });
    R.piede = el("div", { class: "sa-piede st-piede" });
    R.salta = el("button", { class: "sa-tasto", text: "Salta ⏭", onclick: function () {
      if (conGio && R.fase !== "giornata") {   // (le rose: si salta alla giornata; online tutti insieme, quando lo dice chi tiene la partita)
        if (R.saltato) { R.alPodio = true; return; }   // (un secondo «Salta» prima che parta la giornata: dritti al podio, come prima)
        var h = R.opz.cron ? (R.opz.onSalta ? R.opz.onSalta() : null) : R.ora(); if (h == null) return;
        R.saltato = true; fermaTempi(R); R.alleOra(h, function () { giornataRivela(R); }); return R.tic();
      }
      if (conGio && R.opz.capo !== false && R.opz.onPasso && !R.finito) R.opz.onPasso("libero", 1);   // (chi tiene la partita salta: gli amici non lo aspettano più nelle pagelle)
      podioRivela(R);
    } });
    R.radice = el("div", { class: "schermata sa-sala st-stadio st-rivela" + (t.guarda ? " as-targa" : "") }, [ sfondo,
      el("div", { class: "sa-testa" }, [ el("button", { class: "sa-tasto", text: "‹", "aria-label": "Esci", onclick: function () { R.opz.onEsci(); } }),
        (R.info = el("div", { class: "sa-info", text: "La classifica delle rose" })), R.salta ]),
      board, R.campoBox, R.gio, R.podio, R.piede ]);
    R.ruolo.className = "st-ruolo st-ruolo-classifica"; R.ruolo.textContent = "CLASSIFICA";
    coloriSchermo(R, ["#1b2a4a", "#0c1424"]);
    if (opz.cron && !opz.onSalta) R.salta.style.visibility = "hidden";   // (online lo «Salta» delle rose e della giornata è di chi tiene la partita)
    if (opz.prova) { R.provaN = el("div", { class: "st-prova" }); R.radice.appendChild(R.provaN); }   // 🧪 la scritta di prova del proprietario
    RIVELA = R; t.mostra(R.radice); misuraPalco(R);
    avviaPiano(R);
    var ordine = righe.slice().sort(function (a, b) { return (b.posV || b.pos) - (a.posV || a.pos); }), j = 0;   // dalla rosa che vale meno
    rianima(R.ticker, "via", "Si scoprono le quotazioni vere: dalla rosa che vale meno a quella che vale di più!" + (conGio ? " Poi si gioca la giornata ⚽" : ""));
    function avanti() {
      if (!vivoRivela(R)) return;
      if (j >= ordine.length) return conGio ? giornataRivela(R) : podioRivela(R);
      R.provaM = "rosa " + (j + 1); provaPiano(R, "rosa" + j);
      svelaRosa(R, ordine[j], j === ordine.length - 1, function () { j++; R.dopo(700, avanti); });
    }
    R.dopo(1400, avanti);
    nuoviPassi(R); R.tic();
  }
  // (amici) quello che ha deciso chi tiene la partita: il salto delle rose, «Mostra tutta ▶»: si fa all'ora che dice la foto
  function nuoviPassi(R) {
    if (!R.coda) return;
    var c = R.opz.cron;
    if (c && c.salta && !R.saltato && R.fase !== "giornata" && !R.finito) { R.saltato = true; fermaTempi(R); R.alleOra(c.salta, function () { giornataRivela(R); }); }
    Object.keys(R.attese).forEach(function (k) {
      var p = k.split("|"), h = cercaPasso(R, p[0], +p[1]); if (h == null) return;
      var fn = R.attese[k]; delete R.attese[k]; R.alleOra(h, fn);
    });
  }
  function vivoRivela(R) { return R && RIVELA === R && document.body.contains(R.radice); }
  function fermaTempi(R) { R.timer.forEach(function (x) { clearTimeout(x); }); R.timer = []; if (R.iv) { clearInterval(R.iv); R.iv = null; } if (R.tit) { clearInterval(R.tit); R.tit = null; } if (R.coda) R.coda = []; }   // (il direttore resta acceso)
  function fermaRivela(R) { if (!R) return; if (R.az) R.az.ferma(); fermaTempi(R); if (R.dir) { clearInterval(R.dir); R.dir = null; } }
  function svelaRosa(R, r, ultima, poi) {
    R.campoNome.textContent = "La rosa di " + r.nome + " · " + r.crediti + " 💰 avanzati";
    allenatore(R, r, "giu");
    var posti = slotRosa(r.kit);
    R.slot.forEach(function (s, i) { riempiSlot(s, posti[i]); s.nodo.classList.remove("cerca"); });
    R.magliaImg.src = srcAv(cfgDi(r.nome, r.omino), {}); R.squadra.textContent = ""; R.nome.textContent = r.nome; R.prezzoN.textContent = "0"; R.chi.textContent = "valore della rosa";
    R.schermo.classList.remove("vuoto"); rianima(R.schermo, "entra");
    var pari = R.righe.filter(function (o) { return o !== r && o.totale === r.totale; });
    rianima(R.ticker, "via", "La rosa di " + r.nome + "…");
    // le soglie: portiere, difensore, centrocampisti, attaccante; quando il contatore le passa, spunta il valore sulla maglia
    var soglie = [], somma = 0;
    r.kit.forEach(function (c) { somma += c.valore; soglie.push({ fino: somma, i: posti.indexOf(c), v: c.valore }); });
    var durata = Math.max(1800, Math.min(4200, 1200 + r.totale * 26)), ultimoTic = 0, mostrato = -1, k = 0;
    function conta(p) {
      var v = Math.round(r.totale * (1 - (1 - p) * (1 - p)));
      if (v !== mostrato) { mostrato = v; R.prezzoN.textContent = v; var ora = Date.now(); if (ora - ultimoTic > 55 && !inRitardo(R, 400)) { ultimoTic = ora; FX.tic(p); } }
      while (k < soglie.length && v >= soglie[k].fino) { var s = R.slot[soglie[k].i]; if (s) { s.val.textContent = soglie[k].v; s.val.classList.add("su"); } k++; }
    }
    R.dopo(600, function () {   // (il contatore sale col tempo di gioco: uguale su tutti i telefoni)
      if (!vivoRivela(R)) return;
      var g0 = R.pt;
      R.iv = setInterval(function () { if (!vivoRivela(R)) { clearInterval(R.iv); return; } conta(Math.max(0, Math.min(1, (R.g() - g0) / durata))); }, 40);
      R.dopo(durata, function () {
        if (R.iv) { clearInterval(R.iv); R.iv = null; }
        conta(1);
        var pv = r.posV || r.pos;   // (con la giornata: il posto per valore, la classifica vera la fa la giornata)
        R.chi.textContent = r.gio ? pv + "° per valore" + (pv === 1 ? " 💎" : "") : pv + "° posto" + (pv === 1 ? "! 🏆" : "");
        rianima(R.ticker, "via", pari.length ? "Stesso valore di " + pari.map(function (o) { return o.nome; }).join(", ") + (r.gio ? "" : ": conta chi ha più crediti avanzati") : r.nome + ": " + r.totale + " punti di valore");
        if (!inRitardo(R)) { if (ultima && !r.gio) FX.festa(); else FX.posto(); }
        if (pv === 1) allenatore(R, r, "esulta", r.totale);   // (il primo: l'allenatore salta col valore della rosa sul cartellino)
        R.dopo(ultima ? 1700 : 1300, poi);
      });
    });
  }
  // ⚽ la giornata sullo schermo (il maxischermo si spegne: tutto lo spazio al campo). In alto i risultati di tutte e 10 le
  // partite (i gol di chi non ha nessuno cambiano solo quelli, in silenzio), poi la partita del momento e il campo, dove si
  // vedono SOLO i momenti dei calciatori che avete comprato, con calma e in tre tempi: l'annuncio che non dice come finisce
  // («⚡ Azione pericolosa per il Napoli», «🎯 Rigore per il Napoli»), l'azione, l'esito che resta un po'. Sul campo i nomi (con
  // la faccina di chi li ha comprati) di TUTTI i vostri calciatori delle due squadre, e nessun altro nome: se due di voi hanno
  // il Napoli, fino al tiro non si sa chi segna. Sotto la classifica dal vivo: tutti partono da 6 in pagella, poi bonus e
  // malus; a fine primo tempo le pagelle di tutti, al fischio finale le pagelle vere, da chi ha fatto meno a chi ha fatto di più
  var TEMPI_AZ = {   // [annuncio, pausa, azione, esito] in millisecondi
    gol: [1800, 300, 4200, 900], ann: [1800, 300, 4200, 1500], occ: [1800, 300, 4200, 1400], aut: [1800, 300, 4200, 900], rig: [2000, 300, 4000, 1300],
    amm: [1500, 300, 2900, 800], esp: [1500, 300, 2900, 900], rec: [1500, 300, 2900, 800], inv: [1100, 200, 1700, 700] };   // (l'esito si vede già durante l'esultanza: dopo resta poco)
  var COLORI_PERSONE = ["#ffd43b", "#4dabf7", "#f783ac", "#69db7c", "#ff922b", "#b197fc", "#3bc9db", "#e9ecef", "#a9e34b", "#ff8787"];   // il colore di ognuno (in classifica e sul campo)
  var DURATA_GIORNATA = 120000;   // (tutti i momenti insieme: se sono di più, saltano prima le occasioni mancate, poi si va un po' più svelti)
  var SQ_FEMM = { Juventus: 1, Lazio: 1, Roma: 1, Fiorentina: 1, Atalanta: 1, Udinese: 1, Inter: 1 };
  function conArt(sq, di) {   // "l'Inter", "la Roma", "il Milan" (di: "dell'Inter", "della Roma", "del Milan")
    var voc = /^[AEIOU]/.test(sq), f = SQ_FEMM[sq];
    return (di ? (voc ? "dell'" : f ? "della " : "del ") : (voc ? "l'" : f ? "la " : "il ")) + sq;
  }
  function coloriVicini(a, b) {   // due colori che sul campetto si confondono
    var x = parseInt(String(a).slice(1), 16), y = parseInt(String(b).slice(1), 16);
    return Math.sqrt(Math.pow((x >> 16) - (y >> 16), 2) + Math.pow((x >> 8 & 255) - (y >> 8 & 255), 2) + Math.pow((x & 255) - (y & 255), 2)) < 120;
  }
  function sigla(sq) { return String(sq || "?").slice(0, 3).toUpperCase(); }
  function segnoFanta(x) { return x > 0 ? "+" + numFanta(x) : x < 0 ? "−" + numFanta(-x) : "0"; }
  function tempiAz(t) { return TEMPI_AZ[t === "rigP" || t === "rigF" ? "rig" : t] || TEMPI_AZ.occ; }
  function totGio(g) { var s = 0; g.vv.forEach(function (v, k) { s += v + g.bon[k]; }); return s; }   // i voti di adesso + bonus e malus
  function listaGio(R) { return Object.keys(R.gr).map(function (k) { return R.gr[k]; }); }
  function perTotale(a, b) { return (totGio(b) - totGio(a)) || (a.ord - b.ord); }
  function giornataRivela(R) {
    if (!vivoRivela(R) || R.fase === "giornata" || R.finito) return;
    var A = R.opz.serieA; if (!A || !A.partite) return podioRivela(R);
    if (R.alPodio) { if (R.opz.capo !== false && R.opz.onPasso) R.opz.onPasso("libero", 1); return podioRivela(R); }   // (chi tiene la partita ha toccato «Salta» due volte)
    fermaTempi(R); R.fase = "giornata"; R.saltato = true; provaPiano(R, "giornata");
    var el = R.el, righe = R.righe, n = righe.length;
    R.campoBox.style.display = "none"; R.radice.classList.add("gio"); R.gio.style.display = ""; R.info.textContent = "⚽ La giornata di Serie A";
    // i risultati delle 10 partite
    svuotaNodo(R.ris); R.risN = A.partite.map(function (P) {
      var tx = el("b", { text: "0-0" }), nodo = el("div", { class: "st-ris-p" }, [ el("span", { text: sigla(P.c) + " " + sigla(P.f) }), tx ]);
      R.ris.appendChild(nodo); return { nodo: nodo, tx: tx, g: [0, 0] };
    });
    barraTesto(R, "0'", "⚽ Fischio d'inizio");
    // lo spazio: in alto i punteggi di ognuno a quadrettini (una fila fino a 4, poi due), il campo il più grande possibile (in verticale,
    // come lo schermo), sotto i risultati delle 10 partite
    var cols = n <= 4 ? n : Math.ceil(n / 2), file = Math.ceil(n / cols), qh = file > 1 ? 42 : 46;
    var tot = R.gio.clientHeight - R.ris.offsetHeight - R.bar.offsetHeight - 40, w = R.gio.clientWidth - 16, hc = tot - file * qh - (file - 1) * 5;
    if (hc > w * 1.6) { qh = Math.min(file > 1 ? 50 : 56, qh + Math.floor((hc - w * 1.6) / file)); hc = Math.round(Math.min(w * 1.6, tot - file * qh - (file - 1) * 5)); }   // (avanza posto: quadrettini un po' più grandi)
    hc = Math.max(140, hc);
    var lc = hc < w * 1.2 && hc >= w * 0.84 ? Math.round(hc / 1.2) : 0;   // (poca altezza, telefono piccolo e tanti: il campo un po' più stretto, ma sempre in verticale)
    R.azBox.style.height = hc + "px"; R.azBox.style.width = lc ? lc + "px" : ""; R.azBox.style.margin = lc ? "0 auto 8px" : "";
    R.az = R.az || campoAzioni(el, R.azBox);
    R.az.misura();
    svuotaNodo(R.gioTab);
    R.gioTab.style.height = (file * qh + (file - 1) * 5) + "px"; R.gioTab.style.setProperty("--qh", qh + "px"); R.gioTab.style.setProperty("--cols", cols);
    var qw = (w - (cols - 1) * 5) / cols; R.gioTab.classList.toggle("fitto", qw < 100); R.gioTab.classList.toggle("fittissimo", qw < 84);   // (quadrettini stretti: faccina piccola, o niente faccina)
    R.gioCols = cols; R.gioQh = qh; R.gr = {}; R.facce = {}; R.busti = {}; R.colP = {};
    righe.slice().sort(function (a, b) { return (a.posV || a.pos) - (b.posV || b.pos); }).forEach(function (r, i) {
      var fr = el("span", { class: "st-gio-fr" }), zn = el("span", { class: "st-gio-zona" });   // (la freccina del voto che cambia; nella Zona Cesarini: cosa ti serve)
      var pt = el("b", { class: "st-gio-pt", text: numFanta(6 * r.kit.length) }), ev = el("span", { class: "st-gio-ev" }), inC = el("span", { class: "st-gio-in" }), src = srcAv(cfgDi(r.nome, r.omino), { busto: true }), pc = COLORI_PERSONE[i % COLORI_PERSONE.length];
      var nodo = el("div", { class: "st-gio-riga" + (R.opz.mio != null && r.id === R.opz.mio ? " mio" : ""), style: "--pc:" + pc + ";transform:" + posQ(R, i), onclick: function () { schedaLive(R, R.gr[r.id]); } }, [
        el("img", { class: "st-gio-faccia", src: src, alt: "" }), el("div", { class: "st-gio-nomi" }, [ el("span", { class: "st-gio-nome", text: r.nome }), el("div", { class: "st-gio-sotto" }, [ pt, fr, ev, zn, inC ]) ]) ]);
      R.colP[r.id] = pc;
      R.gioTab.appendChild(nodo);
      // vv: il voto di adesso di ogni calciatore (tutti partono da 6), bon: i suoi bonus e malus, ic: le loro icone
      R.gr[r.id] = { r: r, nodo: nodo, pt: pt, ev: ev, inC: inC, fr: fr, zn: zn, ord: i, vv: r.kit.map(function () { return 6; }), bon: r.kit.map(function () { return 0; }), ic: r.kit.map(function () { return ""; }) };
      var img = new Image(); img.onload = (function (id, im) { return function () { var c = document.createElement("canvas"); c.width = c.height = 96; c.getContext("2d").drawImage(im, 0, 0, 96, 96); R.facce[id] = c; }; })(r.id, img);
      img.src = src; R.facce[r.id] = img; R.busti[r.id] = src;   // (la faccina sul campo, accanto al nome dei suoi calciatori)
    });
    R.pag.style.top = R.azBox.offsetTop + "px";   // (le pagelle coprono il campo e la classifica)
    // chi c'entra in ogni momento: "partita|momento" → [{ r: la rosa, c: il calciatore, k: il suo posto nella rosa, t, d }]
    var chi = {};
    righe.forEach(function (r) { r.gio.cal.forEach(function (x, k) { x.ev.forEach(function (e) { var key = e.p + "|" + e.e; (chi[key] = chi[key] || []).push({ r: r, c: r.kit[k], k: k, t: e.t, d: e.d, vv: e.vv }); }); }); });
    // i momenti in ordine di minuto: quelli dei vostri calciatori sul campo, i gol degli altri solo nei risultati; al 45' l'intervallo
    // i momenti speciali (sp): l'intervallo, ⏳ la Zona Cesarini al 75', ⏱️ il recupero al 90', 🏁 il fischio finale (prima delle porte inviolate)
    var lista = [{ intervallo: true, sp: 1, m: 45.5 }, { zona: true, sp: 1, m: 74.9 }, { recupero: true, sp: 1, m: 90.5 }, { fischio: true, sp: 1, m: 98 }];
    R.golDi = {}; R.belli = []; R.zona = false; R.fischiato = false; R.capi = []; R.capoId = null; R.rec = A.rec || 4;
    A.partite.forEach(function (P, pi) {
      P.ev.forEach(function (e, ei) {
        var q = chi[pi + "|" + ei] || [], dopo = P.ev[ei + 1], prima = P.ev[ei - 1];
        var rib = e.t === "gol" && e.v === "ribattuta" && prima && prima.t === "rigP" && (chi[pi + "|" + (ei - 1)] || []).length > 0;   // (dopo un rigore parato che si è visto, si vede anche la ribattuta)
        if (e.t === "rigP" && dopo && dopo.t === "gol" && dopo.v === "ribattuta") e.ribGol = 1;
        if (q.length || rib || e.t === "gol" || e.t === "rig" || e.t === "aut") lista.push({ P: P, p: pi, e: e, chi: q, m: e.m, focus: q.length > 0 || rib });
      });
      if (chi[pi + "|-1"]) lista.push({ P: P, p: pi, e: { m: 90, t: "inv", s: null, r: [P.gc, P.gf] }, chi: chi[pi + "|-1"], m: 99, focus: true });   // (dopo il recupero)
    });
    lista.sort(function (a, b) { return a.m - b.m; }); lista.forEach(function (x, k) { x.ord = k; }); R.risOrd = {};
    function durata() { var d = 0; lista.forEach(function (x) { if (x.sp || !x.focus) return; tempiAz(x.e.t).forEach(function (v) { d += v; }); }); return d; }   // (i gol degli altri non prendono tempo)
    while (durata() > DURATA_GIORNATA) {
      var contaP = {}, subP = {};   // (per ogni vostro portiere: quante occasioni gli restano e se prende gol)
      lista.forEach(function (x) { (x.chi || []).forEach(function (q) { if (q.c.ruolo !== "P") return; var kp = chiaveCalc(q.c); if (q.t === "sub") subP[kp] = 1; if (x.focus && x.e.t === "occ") contaP[kp] = (contaP[kp] || 0) + 1; }); });
      var os = lista.filter(function (x) { return x.focus && x.m < 75 && (x.e.t === "occ" || x.e.t === "rec") && !(x.chi || []).some(function (q) { var kp = chiaveCalc(q.c); return q.c.ruolo === "P" && subP[kp] && (contaP[kp] || 0) <= 1; }); }); if (!os.length) break;
      lista.splice(lista.indexOf(os[Math.floor(os.length / 2)]), 1);
    }
    R.gioVel = Math.max(0.72, Math.min(1, DURATA_GIORNATA / Math.max(1, durata())));
    var i = 0;
    // i gol delle partite dove nessuno di voi ha giocatori non fermano niente: i loro risultati si aggiornano in alto mentre si guarda
    // l'azione dopo (quelli della stessa partita dell'azione subito, così il risultato nella barra è già giusto); all'intervallo e al
    // fischio finale quelli che restano tutti insieme
    function aggiorna(y) { if (y.fatto || !vivoRivela(R)) return; y.fatto = true; risultatoGiornata(R, y); }
    function tuttiMuti(k) { for (var z = 0; z < k; z++) if (!lista[z].focus && !lista[z].sp) aggiorna(lista[z]); }   // (quelli rimasti indietro, in ordine)
    function prossimo() {
      if (!vivoRivela(R)) return;
      var muti = [];
      while (i < lista.length && !lista[i].sp && !lista[i].focus) muti.push(lista[i++]);
      if (i >= lista.length) { tuttiMuti(i); return fischioFinale(R); }
      var x = lista[i++];
      if (x.intervallo) { tuttiMuti(i); return intervallo(R, prossimo); }
      if (x.zona) { tuttiMuti(i); return zonaCesarini(R, prossimo); }
      if (x.recupero) { tuttiMuti(i); return cartelloRecupero(R, prossimo); }
      if (x.fischio) { tuttiMuti(i); return fischioSospeso(R, prossimo); }
      muti.filter(function (y) { return y.p === x.p; }).forEach(aggiorna);
      var altri = muti.filter(function (y) { return y.p !== x.p; }), passo = Math.min(700, 3600 / Math.max(1, altri.length));
      // 📻 nella Zona Cesarini i gol degli altri campi si annunciano come alla radio («Interrompo! Gol a San Siro»), una striscia sola
      var radio = R.zona ? altri.filter(function (y) { var t0 = y.e.t; return t0 === "gol" || t0 === "rig" || t0 === "aut"; }) : [];
      if (radio.length) R.dopo(900, function () { if (!vivoRivela(R)) return; radio.forEach(aggiorna); interrompo(R, radio); });
      altri.forEach(function (y, k) { R.dopo(900 + k * passo, function () { aggiorna(y); }); });
      momentoSerieA(R, x, i, prossimo);
    }
    avvisoCampo(R, 50, ["⚽ FISCHIO D'INIZIO!", "tutti i vostri calciatori partono da 6", "tocca il tuo quadretto per vedere i tuoi calciatori"]); if (!inRitardo(R)) SUONI.fischio(1, true);
    R.dopo(2000, function () { if (!vivoRivela(R)) return; viaAvviso(R); R.dopo(400, prossimo); });
  }
  // la barra sopra il campo: il minuto e la partita del momento (o una scritta)
  function orologio(R, m, proprio) { if (!proprio) { m = Math.max(m, R.minMax || 0); R.minMax = m; } R.barMin.textContent = minTxt(m); }   // (proprio: il gol della giornata, che torna indietro apposta)
  // ⏱️ nella Zona Cesarini il minuto corre fino a quello del momento (76', 77', 78'…), come un cronometro (passi del piano: uguale su tutti)
  function orologioCorre(R, m) {
    var da = Math.round(R.minMax || 0), a = Math.round(m);
    if (!R.zona || a - da < 2 || inRitardo(R)) return orologio(R, m);
    var n = Math.min(6, a - da);
    orologio(R, da + Math.max(1, Math.round((a - da) / n)));
    for (var j = 2; j <= n; j++) (function (j) { R.dopo((j - 1) * 80, function () { if (vivoRivela(R)) orologio(R, j === n ? m : da + Math.round((a - da) * j / n)); }); })(j);
  }
  function barraTesto(R, min, testo) { R.barP = null; svuotaNodo(R.barIn); R.barIn.appendChild(R.el("span", { text: testo })); R.barMin.textContent = min; rianima(R.barIn, "entra"); }
  function barraPartita(R, x) {
    var P = x.P, g = R.risN[x.p].g, el = R.el; R.barP = P;
    R.barSc = el("b", { class: "st-bar-sc", text: g[0] + " - " + g[1] });
    svuotaNodo(R.barIn);
    [el("img", { src: maglia(P.c), alt: "" }), el("span", { text: P.c }), R.barSc, el("span", { text: P.f }), el("img", { src: maglia(P.f), alt: "" })].forEach(function (nd) { R.barIn.appendChild(nd); });
    orologioCorre(R, x.e.m); rianima(R.barIn, "entra");
    R.risN.forEach(function (q, i) { q.nodo.classList.toggle("ora", i === x.p); });
  }
  // la scritta sul campo (l'annuncio, l'esito): pos = dove sta il centro, in % dell'altezza; righe = [titolo, sotto, punti]
  function avvisoCampo(R, pos, righe, mg, sq) {   // (sq: la squadra dell'azione: la seconda riga diventa grande, sul colore della sua maglia)
    var m = R.msg, tx = R.el("div", { class: "st-msg-tx" });
    var bw = R.azBox.clientWidth || 360;   // (la scritta grande si adatta alla larghezza del campo)
    svuotaNodo(m); m.className = "st-msg" + (sq ? " sq" + (bw < 330 ? " stretto" : "") : "");
    if (mg) m.appendChild(R.el("img", { class: "st-msg-maglia", src: mg, alt: "" }));
    if (sq) {
      var cs = coloriSquadra(sq) || ["#2b3550", "#9aa5bd"], n = parseInt(cs[0].slice(1), 16), luce = 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255);
      if (righe[0]) tx.appendChild(R.el("span", { class: "az", text: righe[0] }));
      tx.appendChild(R.el("b", { class: "sq", text: righe[1], style: "font-size:" + Math.round(Math.max(13, Math.min(25, bw * 0.062, (bw * 0.94 - (bw < 330 ? 66 : 82) - 24) / (String(righe[1]).length * 0.68)))) + "px;background:" + cs[0] + ";color:" + (luce > 150 ? "#14171f" : "#fff") + ";box-shadow:inset 0 -3px 0 rgba(0,0,0,.25),0 0 0 2px " + cs[1] }));
    } else righe.forEach(function (t, i) { if (t) tx.appendChild(R.el(i ? "span" : "b", { class: i === 2 ? "pt" : "", text: t })); });
    m.appendChild(tx); m.style.top = pos + "%";
    m.classList.remove("on"); void m.offsetWidth; m.classList.add("on");
  }
  function viaAvviso(R) { R.msg.classList.remove("on"); }
  function risultatoGiornata(R, x) {   // un gol cambia il risultato della sua partita (quelli di chi non ha nessuno: solo questo, in silenzio)
    var e = x.e; if (e.t !== "gol" && e.t !== "rig" && e.t !== "aut") return;
    if (x.ord != null && R.risOrd) { if (R.risOrd[x.p] != null && R.risOrd[x.p] > x.ord) return; R.risOrd[x.p] = x.ord; }   // (un risultato più vecchio non torna mai sopra uno più nuovo)
    var q = R.risN[x.p]; q.g = e.r; q.tx.textContent = e.r[0] + "-" + e.r[1]; rianima(q.nodo, "gol");
    if (e.t !== "aut" && e.chi) R.golDi[e.chi] = (R.golDi[e.chi] || 0) + 1;   // (per la doppietta e la tripletta)
    if (R.barP === x.P && R.barSc) R.barSc.textContent = e.r[0] + " - " + e.r[1];
  }
  // le parole: annunci che NON dicono come finisce, poi l'esito con frasi sempre diverse (scelte col "seme" del momento: uguali su tutti i telefoni)
  var ANNUNCI = { cross: "⚡ CROSS IN AREA", angolo: "🚩 CALCIO D'ANGOLO", unodue: "⚡ UNO-DUE AL LIMITE", contro: "⚡ CONTROPIEDE!", pallonetto: "⚡ LANCIO IN PROFONDITÀ",
    fuori: "⚡ CI PROVA DA FUORI", slalom: "⚡ PARTE IN SLALOM", punizione: "🎯 PUNIZIONE DAL LIMITE", tapin: "⚡ TIRO IN AREA", rovesciata: "⚡ CROSS IN AREA",
    centrocampo: "⚡ CI PROVA DA FUORI", olimpico: "🚩 CALCIO D'ANGOLO", portiere: "🚩 CALCIO D'ANGOLO", ribattuta: "😱 RIBATTUTA!",
    mischia: "⚡ MISCHIA IN AREA", testa: "⚡ PALLA LUNGA IN AREA", incrocio: "🌀 CI PROVA A GIRO", miracolo: "⚡ PALLA GOL IN AREA", assedio: "🔥 ASSEDIO IN AREA", ultimo: "⏱ ULTIMO ASSALTO" };
  var FRASI_GOL = {
    cross: ["Di testa, su cross dalla fascia!", "Incornata perfetta sul cross!", "Cross al bacio e testa vincente!"],
    angolo: ["Di testa su calcio d'angolo!", "Svetta più in alto di tutti!", "Stacco imperioso sull'angolo!"],
    unodue: ["Dopo un uno-due al limite!", "Triangolo perfetto e gol!", "Scambio stretto e via!"],
    contro: ["In contropiede, scarta anche il portiere!", "Contropiede micidiale!", "Ripartenza da manuale!"],
    pallonetto: ["Pallonetto delizioso sul portiere!", "Lo scavalca con un pallonetto!"],
    fuori: ["Un missile da fuori area!", "Botta da lontano, imprendibile!", "Tiro da fuori, che gol!"],
    slalom: ["Slalom tra i difensori e gol!", "Ne salta due e la mette dentro!"],
    punizione: ["Punizione a giro sopra la barriera!", "Calcio di punizione magistrale!"],
    tapin: ["Sulla respinta del portiere!", "Tap-in da due passi!", "Il più lesto di tutti sulla respinta!"],
    ribattuta: ["Il portiere para, ma sulla ribattuta è gol!", "Sulla ribattuta del rigore!"],
    rovesciata: ["IN ROVESCIATA! Gol da cineteca!"], centrocampo: ["DA CENTROCAMPO! Incredibile!"], olimpico: ["DIRETTAMENTE DAL CALCIO D'ANGOLO!"], portiere: ["IL PORTIERE! Di testa all'ultimo respiro!"],
    rig: ["Dal dischetto, spiazza il portiere!", "Rigore perfetto!", "Freddo dal dischetto!"], cucchiaio: ["Col cucchiaio! Che coraggio!"],
    mischia: ["Batti e ribatti in area: alla fine la spinge dentro!", "Nella mischia è il più lesto di tutti!", "Un flipper in area… e la butta dentro!"],
    testa: ["Palla lunga e stacco di testa vincente!", "Svetta più in alto di tutti e la mette dentro!", "Vince il duello aereo: gol di testa!"],
    incrocio: ["Tiro a giro, dritto all'incrocio!", "Una parabola perfetta sotto l'incrocio dei pali!", "Il pallone gira e si infila all'incrocio!"],
    miracolo: ["Il portiere fa il miracolo, ma sulla ribattuta è gol!", "Prima parata strepitosa, poi la ribattuta vincente!", "Non basta il miracolo del portiere!"],
    assedio: ["Dopo una mischia infinita, la butta dentro!", "Ci provano in tutti i modi: alla fine è gol!", "L'assedio è premiato!"],
    ultimo: ["All'ultimo assalto, di testa sul calcio d'angolo!", "Salgono tutti, anche il portiere: ed è gol!", "All'ultimo respiro, di testa!"]
  };
  var FRASI_OCC = { palo: ["😱 PALO!", "😱 CHE SFORTUNA, IL PALO!"], traversa: ["😱 TRAVERSA!", "😱 COLPISCE LA TRAVERSA!"], fuori: ["💨 FUORI DI POCO!", "💨 SFIORA IL PALO!"],
    alto: ["💨 ALTO SOPRA LA TRAVERSA!", "💨 TROPPO ALTO!"], parata: ["🧤 CHE PARATA!", "🧤 PARATA!", "🧤 IL PORTIERE DICE DI NO!"], linea: ["🦵 SALVATAGGIO SULLA LINEA!"] };
  var BELLEZZA = { rovesciata: 10, centrocampo: 10, olimpico: 9, portiere: 9, cucchiaio: 7, punizione: 6, fuori: 5, slalom: 5, pallonetto: 5, contro: 4, unodue: 3, cross: 3, angolo: 3, ribattuta: 2, tapin: 1, rig: 1, incrocio: 7, ultimo: 6, testa: 4, assedio: 4, miracolo: 3, mischia: 2 };
  function frase(l, seme) { return l && l.length ? l[Math.abs(seme) % l.length] : ""; }
  function minTxt(m) { return m > 90 ? "90'+" + (Math.round(m) - 90) : Math.round(m) + "'"; }   // (il recupero: 90'+3)
  function semeDi(x) { return Math.round(x.e.m * 131 + x.p * 17 + (x.e.t || "").length * 7 + ((x.e.chi || "").length * 3)); }
  // un momento con i vostri calciatori, in passi: 1) l'annuncio (col VAR prima, se il rigore arriva dal VAR), col campo fermo e i vostri
  // in formazione; 2) l'azione (due volte, se il rigore si ripete); 3) l'esito che resta coi punti (col gol annullato: il VAR e poi «annullato»)
  function momentoSerieA(R, x, n, poi) {
    var e = x.e, P = x.P, t = e.t === "rigP" || e.t === "rigF" ? "rig" : e.t, T = tempiAz(e.t), vv = R.gioVel, seme = semeDi(x);   // (vv: uguale su tutti i telefoni)
    // ⏳ nella Zona Cesarini il ritmo è serrato, ma UGUALE fino al tiro per tutto quello che si annuncia allo stesso modo (gol, gol annullato,
    // autogol, occasione; i cartellini tra loro): la durata non deve dire come finisce. Cambia solo quanto resta l'esito. I rigori no
    var zona = e.m >= 75, pausa = zona ? 200 : 450;
    if (zona && t !== "rig" && t !== "inv") T = [T[0] * 0.6, T[1] * 0.5, T[2] * 0.9, t === "gol" || t === "ann" || t === "aut" ? T[3] : T[3] * 0.7];
    var lato = e.s || (x.chi[0] && x.chi[0].c.squadra === P.f ? "f" : "c"), sqA = lato === "c" ? P.c : P.f, sqB = lato === "c" ? P.f : P.c;   // sqA: la squadra del momento
    var K = {}; K[P.c] = kitDi(P.c, false); K[P.f] = kitDi(P.f, coloriVicini(K[P.c].a, (coloriSquadra(P.f) || ["#adb5bd"])[0]));   // (maglie simili: chi è in trasferta gioca in bianco)
    // i vostri calciatori di queste due squadre (chi è stato espulso prima non c'è più)
    var noti = [];
    R.righe.forEach(function (r) { r.kit.forEach(function (c) { var k = chiaveCalc(c); if ((c.squadra === P.c || c.squadra === P.f) && !(R.fuori && R.fuori[k] < e.m)) noti.push({ k: k, nome: nomeCampo(c.nome), faccia: R.facce[r.id], pc: R.colP[r.id], ruolo: c.ruolo, sq: c.squadra, r: r }); }); });
    function tag(k) { var q = noti.filter(function (y) { return y.k === k; })[0]; if (!q) return null; q.usato = true; return { nome: q.nome, faccia: q.faccia, pc: q.pc }; }
    function portiere(sq) { var q = noti.filter(function (y) { return y.sq === sq && y.ruolo === "P" && !y.usato; })[0]; return q ? tag(q.k) : null; }
    var et, ann, mg = sqA, sqAtt = sqA, esito = "gol", v = e.v || null, di = "per " + conArt(sqA);
    if (t === "gol" || t === "ann") { et = { tira: e.chi ? tag(e.chi) : null, passa: e.ass ? tag(e.ass) : null, para: portiere(sqB) }; v = v || "cross"; ann = [ANNUNCI[v] || "⚡ AZIONE PERICOLOSA", di]; }
    else if (t === "occ") { et = { tira: tag(e.chi), passa: e.ass ? tag(e.ass) : null, para: portiere(sqB) }; v = v || "fuori"; esito = e.esito; ann = [ANNUNCI[v] || "⚡ AZIONE PERICOLOSA", di]; }
    else if (t === "rig") {
      et = { tira: e.chi ? tag(e.chi) : null, para: portiere(sqB) };
      esito = e.t === "rig" ? (e.v === "cucchiaio" ? "cucchiaio" : "gol") : e.t === "rigP" ? "parata" : (e.fin || "fuori");
      ann = e.come === "mano" ? ["✋ FALLO DI MANO: RIGORE!", di] : ["🎯 RIGORE!", di];
    }
    else if (t === "aut") { et = { fallo: e.chi ? tag(e.chi) : null, para: portiere(sqA) }; v = e.v || "cross"; ann = [ANNUNCI[v] || "⚡ AZIONE PERICOLOSA", "per " + conArt(sqB)]; mg = sqB; sqAtt = sqB; }   // (non si dice che sarà un autogol)
    else if (t === "amm" || t === "esp" || t === "rec") {   // (l'entrata pulita si annuncia uguale: l'annuncio non dice se arriva il giallo)
      et = { fallo: tag(e.chi) };
      var c0 = e.dg ? "dg" : e.come || "entrata";
      ann = [{ entrata: "😤 ENTRATA DURA", tattico: "✋ FALLO TATTICO", proteste: "🗣️ PROTESTE CON L'ARBITRO", simula: "🤿 SI BUTTA IN AREA…", ultimo: "🏃 FALLO DA ULTIMO UOMO", dg: "😬 ANCORA UN FALLO… ERA GIÀ AMMONITO!" }[c0] || "😤 ENTRATA DURA",
        c0 === "proteste" || c0 === "simula" ? "un giocatore " + conArt(sqA, true) : "di un giocatore " + conArt(sqA, true)];
    }
    else { et = { para: tag(chiaveCalc(x.chi[0].c)) }; ann = ["🔒 PORTA INVIOLATA", "finisce " + P.c + " " + e.r[0] + "-" + e.r[1] + " " + P.f]; sqAtt = sqB; }
    // il rallentatore prima del tiro: deciso dal minuto e dal seme, MAI da come finisce (prima partiva solo sui non-gol: era uno spoiler).
    // Sempre sui rigori e dal 75', prima un tiro su tre
    if (e.v === "assedio" || e.v === "ultimo") T = [T[0], T[1], T[2] * 1.3, T[3]];
    var op = { verso: (Math.round(e.m) + x.p) % 2 === 1 ? -1 : 1, lato: seme % 2 ? 1 : -1, seme: seme, rib: e.rib, ribGol: e.ribGol, come: e.come, lento: t === "rig" || zona || semeRnd(seme + 11)() < 0.33 };   // (stessa partita e stesso minuto: stessa metà campo)
    if (e.ribGol || (e.t === "gol" && e.v === "ribattuta")) op.lato = (Math.round(e.m) + x.p) % 2 ? 1 : -1;   // (il rigore e la sua ribattuta: anche lo stesso lato)
    function prepara(sc) {   // le maglie e i vostri che non c'entrano (al posto del loro ruolo)
      sc.kA = K[sqAtt]; sc.kD = K[sqAtt === P.c ? P.f : P.c]; sc.pA = kitPortiere(sc.kA, sc.kD); sc.pD = kitPortiere(sc.kA, sc.kD, sc.pA.a);
      sc.noti = noti.filter(function (y) { return !y.usato; }).map(function (y) { return { sq: y.sq === sqAtt ? "A" : "D", nome: y.nome, faccia: y.faccia, pc: y.pc, ruolo: y.ruolo }; });
      return sc;
    }
    var sc = prepara(scena(t, v, esito, e.fin || null, et, op));
    x.sc = sc;
    barraPartita(R, x); segnaInCampo(R, noti);
    var pos = R.az.lontano(sc), passi = [];   // (le scritte stanno nella metà campo lontana dall'azione)
    if (t === "rig" && e.come === "var") passi.push({ avviso: ["📺 IL VAR RICHIAMA L'ARBITRO…", "va a rivedere l'azione al monitor"], ms: 2600, fermo: sc });
    passi.push({ avviso: ann, mg: maglia(mg), sq: t === "amm" || t === "esp" || t === "rec" || t === "inv" ? null : mg, ms: T[0], fermo: sc });   // (l'azione: di chi è, in grande)
    passi.push({ ms: T[1] });
    if (t === "rig" && e.rip) {   // il portiere si era mosso prima: si tira di nuovo
      passi.push({ sc: prepara(scena("rig", null, "parata", null, et, { verso: op.verso, lato: op.lato, seme: seme + 5 })), dur: T[2] * 0.8 });
      passi.push({ avviso: ["🔁 SI RIPETE!", "il portiere si era mosso prima"], ms: 2400, fermo: sc });
      passi.push({ ms: 400 });
    }
    passi.push({ sc: sc, dur: T[2], dunque: function () { dunqueSerieA(R, x, t, esito, sqA, pos, seme); } });
    if (t === "ann") {
      passi.push({ ms: 900, resta: true });
      passi.push({ avviso: ["📺 IL VAR CONTROLLA…", "un attimo di attesa"], ms: 2600 });
      passi.push({ avviso: ["❌ GOL ANNULLATO!", { fuorigioco: "per fuorigioco", fallo: "c'era un fallo in attacco", mano: "per un tocco di mano" }[e.perche] || "dal VAR", "niente punti"], ms: T[3], resta: true });
    } else passi.push({ ms: T[3], resta: true });   // (l'esito resta un po')
    function esegui(i) {
      if (!vivoRivela(R)) return;
      if (i >= passi.length) { viaAvviso(R); segnaInCampo(R, []); R.dopo(pausa, poi); return; }
      var q = passi[i];
      if (q.sc) { R.az.giocaPiano(q.sc, Math.round(q.dur * vv), R, q.dunque || function () {}, function () { esegui(i + 1); }); return; }
      if (q.avviso) { if (q.fermo) R.az.fermo(q.fermo); avvisoCampo(R, pos, q.avviso, q.mg, q.sq); if (!inRitardo(R)) FX.tic(0.3); }
      R.dopo(q.ms * vv, function () { if (!vivoRivela(R)) return; if (q.avviso && !q.resta) viaAvviso(R); esegui(i + 1); });
    }
    // ⏱️ quanto dura tutto il momento: se chi recupera è già oltre la sua fine, contano solo punti e risultati (niente scene né suoni)
    var lungo = pausa; passi.forEach(function (q) { lungo += q.sc ? R.az.durata(q.sc, Math.round(q.dur * vv)) : q.ms * vv; });
    R.provaM = "momento " + n;
    if (R.g() > R.pt + lungo + 250) { dunqueSerieA(R, x, t, esito, sqA, pos, seme, true); segnaInCampo(R, []); return R.dopo(lungo, poi); }
    provaPiano(R, "m" + n);
    esegui(0);
  }
  function dunqueSerieA(R, x, t, esito, sqA, pos, seme, muto) {   // l'azione è arrivata al dunque: i punti di chi c'entra, il risultato, l'esito sul campo, il suono
    if (!vivoRivela(R)) return;   // (muto: chi recupera un momento già passato: solo punti e risultati)
    var e = x.e, chi = [], somma = {}, icone = {}, buono = false;
    if (!muto) provaPiano(R, "d" + (x.ord != null ? x.ord : ""));
    if (t === "ann") {   // il gol c'è… per ora: niente punti finché il VAR non ha deciso
      if (!muto) { avvisoCampo(R, pos, ["⚽ GOL " + conArt(sqA, true).toUpperCase() + "!", "…ma l'arbitro si tocca l'orecchio"]); if (!inRitardo(R)) FX.tic(0.6); }
      return;
    }
    x.chi.forEach(function (q) {
      var g = R.gr[q.r.id];
      if (g && q.vv != null && g.vv[q.k] !== q.vv) { frecciaVoto(g, q.vv - g.vv[q.k]); g.vv[q.k] = q.vv; g.pt.textContent = numFanta(totGio(g)); }   // 📈 il voto in diretta
      if (g && q.t === "rec") {   // (l'entrata pulita: niente punti, il voto sale; si vede il 👏)
        g.ic[q.k] += EV_GIO.rec; g.ev.appendChild(R.el("span", { text: EV_GIO.rec }));
        if (!(q.r.id in somma)) { somma[q.r.id] = 0; icone[q.r.id] = ""; chi.push(q.r); }
        icone[q.r.id] += EV_GIO.rec; return;
      }
      if (!g || !q.d) return;
      g.bon[q.k] += q.d; g.ic[q.k] += EV_GIO[q.t] || ""; g.pt.textContent = numFanta(totGio(g)); rianima(g.pt, "batte");
      g.ev.appendChild(R.el("span", { text: EV_GIO[q.t] || "" }));
      g.nodo.classList.remove("piu", "meno"); void g.nodo.offsetWidth; g.nodo.classList.add(q.d > 0 ? "piu" : "meno");
      (function (nd) { R.timer.push(setTimeout(function () { nd.classList.remove("piu", "meno"); }, 900)); })(g.nodo);
      if (!(q.r.id in somma)) { somma[q.r.id] = 0; icone[q.r.id] = ""; chi.push(q.r); }
      somma[q.r.id] += q.d; icone[q.r.id] += EV_GIO[q.t] || "";
      if (q.d > 0 && (R.opz.mio == null || R.opz.mio === q.r.id) && (q.t === "gol" || q.t === "par")) buono = true;
      if (q.t === "esp") { R.fuori = R.fuori || {}; R.fuori[chiaveCalc(q.c)] = e.m; }
    });
    risultatoGiornata(R, x);
    var kind = t === "rig" ? (esito === "cucchiaio" ? "cucchiaio" : "rig") : (e.v || "cross"), tit, sotto = "", nGol = e.chi ? (R.golDi[e.chi] || 0) : 0;
    var vostro = x.chi.some(function (q) { return q.t === "gol"; });
    if (t === "gol" || (t === "rig" && (esito === "gol" || esito === "cucchiaio"))) {
      tit = vostro && nGol >= 4 ? "🃏 POKER!" : vostro && nGol === 3 ? "🎩 TRIPLETTA!" : vostro && nGol === 2 ? "⚽ DOPPIETTA!" : "⚽ GOL " + conArt(sqA, true).toUpperCase() + "!";
      sotto = x.sc && x.sc.paloDentro ? "Palo e dentro!" : x.sc && x.sc.deviato ? "Deviazione decisiva di un difensore!" : frase(FRASI_GOL[kind], seme);   // (solo se si è visto davvero)
      if (vostro && e.chi) R.belli.push({ x: x, b: (BELLEZZA[kind] || 1) + (x.sc && x.sc.paloDentro ? 1 : 0) + (nGol > 1 ? 1 : 0) });
    }
    else if (t === "rig") { tit = esito === "parata" ? (e.rib ? "🧤 PARA IL RIGORE E ANCHE LA RIBATTUTA!" : "🧤 RIGORE PARATO!") : { palo: "😱 RIGORE SUL PALO!", traversa: "😱 RIGORE SULLA TRAVERSA!", alto: "❌ RIGORE ALTO!" }[esito] || "❌ RIGORE SBAGLIATO!"; sotto = x.P.c + " " + e.r[0] + "-" + e.r[1] + " " + x.P.f; }
    else if (t === "aut") { tit = "🙈 AUTOGOL!"; sotto = frase(["Sfortunata deviazione nella propria porta!", "Beffa: la mette nella sua porta!"], seme); }
    else if (t === "amm") tit = e.come === "simula" ? "🟨 GIALLO PER SIMULAZIONE!" : e.come === "proteste" ? "🟨 GIALLO PER PROTESTE!" : "🟨 AMMONITO!";
    else if (t === "esp") tit = e.dg ? "🟥 SECONDO GIALLO: ESPULSO!" : e.come === "ultimo" ? "🟥 ROSSO DIRETTO!" : "🟥 ESPULSO!";
    else if (t === "occ") { tit = frase(FRASI_OCC[esito], seme); sotto = "niente gol"; }
    else if (t === "rec") { tit = "👏 ENTRATA PULITA!"; sotto = frase(["Prende solo il pallone!", "Tutto regolare: solo pallone!", "Intervento perfetto, si gioca!"], seme); }
    else { tit = "🔒 PORTA INVIOLATA!"; sotto = x.P.c + " " + e.r[0] + "-" + e.r[1] + " " + x.P.f; }
    if (!muto) avvisoCampo(R, pos, [tit, sotto, chi.map(function (r) { return r.nome + " " + icone[r.id] + " " + (t === "rec" ? "voto ↑" : segnoFanta(somma[r.id])); }).join(" · ")]);
    if (muto || inRitardo(R)) {}
    else if (buono) { FX.posto(); vibra(30); }
    else if (chi.length) FX.tic(chi.some(function (r) { return somma[r.id] > 0; }) ? 0.8 : 0.1);
    riordinaGiornata(R, x, muto);
  }
  // la freccina accanto ai punti quando il voto di un calciatore cambia (↑ verde, ↓ rossa), per un attimo
  function frecciaVoto(g, d) { if (!d || !g.fr) return; var tok = g.frTok = (g.frTok || 0) + 1; g.fr.textContent = d > 0 ? "↑" : "↓"; g.fr.className = "st-gio-fr " + (d > 0 ? "su" : "giu"); rianima(g.fr, "on"); setTimeout(function () { if (g.frTok === tok) g.fr.textContent = ""; }, 1700); }   // (poi sparisce: nei quadretti stretti serve il posto)
  // i quadretti in ordine, la 👑 su chi è in testa e (nella Zona Cesarini) il sorpasso e le scritte di cosa serve a ognuno
  function riordinaGiornata(R, x, muto) {
    ordinaGiornata(R, perTotale);
    var l = listaGio(R).sort(perTotale), primo = l[0], tot = primo ? totGio(primo) : 0, pari = l.filter(function (g) { return totGio(g) === tot; });
    var capo = pari.length > 1 && R.capoId != null && pari.some(function (g) { return g.r.id === R.capoId; }) ? R.capoId : primo && primo.r.id;   // (a pari punti la corona resta dov'era)
    if (l.length > 1 && capo !== R.capoId) {
      var prima = R.capoId; R.capoId = capo; R.capi.push({ x: x || null, id: capo, m: x && x.e ? x.e.m : 0 });
      if (prima != null && R.zona && !muto && !inRitardo(R)) {   // 🔁 il sorpasso in testa: la striscia, il suono, la vibrazione solo per chi c'entra
        striscia(R, "🔁 SORPASSO! " + String(R.gr[capo].r.nome).toUpperCase() + " IN TESTA", "sorp");
        FX.sorpasso(); if (R.opz.mio == null || R.opz.mio === capo || R.opz.mio === prima) vibra(30);
      }
    }
    listaGio(R).forEach(function (g) { g.nodo.classList.toggle("capo", l.length > 1 && g.r.id === R.capoId); });
    if (R.zona) scritteZona(R);
  }
  // ⏳ cosa serve a ognuno, guardando SOLO i punti di adesso (mai «hai perso»: anche il miracolo è possibile). Un gol vale circa 3,5
  function scritteZona(R) {
    var l = listaGio(R).sort(perTotale), top = l.length ? totGio(l[0]) : 0, terzo = l.length >= 4 ? totGio(l[2]) : null, cols = R.gioCols || 4;
    l.forEach(function (g, i) {
      var gap = top - totGio(g), n = gap <= 0 ? 0 : terzo != null && i >= 3 && gap >= 3.5 && terzo - totGio(g) < 3.5 ? -1 : gap < 3.5 ? 1 : gap < 7 ? 2 : 3;
      var tx = (cols <= 2 ? ["📌 resisti", "🔥 1 gol", "💪 2 gol", "🙏 miracolo", "🥉 1 gol"] : cols <= 4 ? ["📌", "🔥1", "💪2", "🙏", "🥉1"] : ["📌", "🔥", "💪", "🙏", "🥉"])[n < 0 ? 4 : n];   // (quadretti stretti: la forma corta)
      if (g.zn.textContent !== tx) { g.zn.textContent = tx; rianima(g.zn, "entra"); }
    });
  }
  // la striscia sopra la barra: 📻 i gol degli altri campi, 🔁 il sorpasso (una alla volta: quella nuova prende il posto)
  function striscia(R, testo, tipo) {
    if (!R.radio) return;
    var tok = (R.radioTok || 0) + 1; R.radioTok = tok;
    R.radio.textContent = testo; R.radio.className = "st-radio " + (tipo || ""); void R.radio.offsetWidth; R.radio.classList.add("on");
    R.timer.push(setTimeout(function () { if (R.radioTok === tok) R.radio.classList.remove("on"); }, 2000));
  }
  // 📻 «Interrompo! Gol a San Siro» (dove si gioca, mai chi ha segnato)
  var STADI = { Atalanta: "a Bergamo", Bologna: "al Dall'Ara", Cagliari: "a Cagliari", Como: "al Sinigaglia", Fiorentina: "al Franchi", Frosinone: "a Frosinone", Genoa: "a Marassi",
    Inter: "a San Siro", Juventus: "allo Stadium", Lazio: "all'Olimpico", Lecce: "al Via del Mare", Milan: "a San Siro", Monza: "a Monza", Napoli: "al Maradona", Parma: "al Tardini",
    Roma: "all'Olimpico", Sassuolo: "a Reggio Emilia", Torino: "al Grande Torino", Udinese: "a Udine", Venezia: "a Venezia" };
  function interrompo(R, l) {
    if (inRitardo(R)) return;
    var dove = [], y = l[l.length - 1];
    l.forEach(function (z) { var d = STADI[z.P.c] || ("a " + z.P.c); if (dove.indexOf(d) < 0) dove.push(d); });
    striscia(R, l.length === 1 ? "📻 Interrompo! Gol " + dove[0] + " · " + sigla(y.P.c) + " " + y.e.r[0] + "-" + y.e.r[1] + " " + sigla(y.P.f) : "📻 Interrompo! Gol " + dove.slice(0, 2).join(" e ") + "!", "radio");
    FX.radio();
  }
  // ⏳ il 75': la Zona Cesarini (sempre, in ogni giornata: non dice niente di quello che succederà). I voti di adesso nei quadretti
  function zonaCesarini(R, poi) {
    if (!vivoRivela(R)) return;
    R.zona = true; R.radice.classList.add("zona"); R.provaM = "zona cesarini";
    listaGio(R).forEach(function (g) { var d = 0; g.r.gio.cal.forEach(function (c, k) { if (c.v75 != null) { d += c.v75 - g.vv[k]; g.vv[k] = c.v75; } }); if (d) frecciaVoto(g, d); g.pt.textContent = numFanta(totGio(g)); });
    var dur = 2600;
    if (R.g() > R.pt + dur + 250) { riordinaGiornata(R, null, true); orologio(R, 75); return R.dopo(dur + 200, poi); }   // (chi recupera: solo lo stato, e lo stesso tempo)
    provaPiano(R, "zona");
    R.az.fermo(null); R.risN.forEach(function (q) { q.nodo.classList.remove("ora"); });
    barraTesto(R, "75'", "⏳ Zona Cesarini"); orologio(R, 75);
    avvisoCampo(R, 50, ["⏳ ZONA CESARINI", "dal 75' ogni momento può cambiare tutto", "📌 in testa · 🔥 vi serve 1 gol · 💪 2 · 🙏 un miracolo"]);
    if (!inRitardo(R)) FX.gong();
    riordinaGiornata(R, null, false);
    R.dopo(dur, function () { if (!vivoRivela(R)) return; viaAvviso(R); R.dopo(200, poi); });
  }
  // ⏱️ al 90' il cartello del recupero (sempre, anche se poi non succede più niente)
  function cartelloRecupero(R, poi) {
    if (!vivoRivela(R)) return;
    var dur = 1900;
    if (R.g() > R.pt + dur + 250) { orologio(R, 90); return R.dopo(dur + 200, poi); }
    provaPiano(R, "recupero"); R.provaM = "recupero";
    R.az.fermo(null); R.risN.forEach(function (q) { q.nodo.classList.remove("ora"); });
    barraTesto(R, "90'", "⏱️ Recupero: +" + R.rec + "'"); orologio(R, 90);
    avvisoCampo(R, 50, ["⏱️ RECUPERO", "+" + R.rec + " minuti"]);
    if (!inRitardo(R)) FX.recupero();
    R.dopo(dur, function () { if (!vivoRivela(R)) return; viaAvviso(R); R.dopo(200, poi); });
  }
  // 🏁 il fischio finale sospeso: il campo si ferma, un attimo di silenzio, poi il triplice fischio (poi le porte inviolate e le pagelle)
  function fischioSospeso(R, poi) {
    if (!vivoRivela(R)) return;
    var dur = 3500;   // (1,4 s di attesa + 1,9 s col fischio + 0,2 s)
    R.fischiato = true;
    if (R.g() > R.pt + dur + 250) { R.zona = false; R.radice.classList.remove("zona"); orologio(R, 90 + R.rec); return R.dopo(dur, poi); }
    provaPiano(R, "fischio"); R.provaM = "fischio finale";
    R.az.fermo(null); R.risN.forEach(function (q) { q.nodo.classList.remove("ora"); });
    barraTesto(R, minTxt(90 + R.rec), "⏱️ Ultimi secondi…"); orologio(R, 90 + R.rec); R.azBox.classList.add("attesa");
    R.dopo(1400, function () {
      if (!vivoRivela(R)) return;
      R.azBox.classList.remove("attesa"); R.zona = false; R.radice.classList.remove("zona");
      barraTesto(R, minTxt(90 + R.rec), "🏁 Fischio finale");
      avvisoCampo(R, 50, ["🏁 FISCHIO FINALE!", "è finita!"]);
      if (!inRitardo(R)) { SUONI.fischio(3, true); vibra(60); }
      R.dopo(1900, function () { if (!vivoRivela(R)) return; viaAvviso(R); R.dopo(200, poi); });
    });
  }

  // 🎬 il gol della giornata: al fischio finale si rivede il gol più bello dei vostri calciatori, da vicino e al rallentatore
  function golDellaGiornata(R, poi) {
    var b = null; (R.belli || []).forEach(function (c) { if (!b || c.b > b.b || (c.b === b.b && c.x.e.m > b.x.e.m)) b = c; });
    // 🎬 se chi vince è passato in testa nella Zona Cesarini, si rivede QUEL momento (l'ultimo in cui è passato davanti)
    // (solo quello che si è visto: l'ultimo cambio di testa, se è arrivato dal 75' con un momento da rivedere; mai le pagelle che verranno)
    var w = R.capoId, dec = null, ult = (R.capi || [])[(R.capi || []).length - 1];
    if (ult && ult.id === w && ult.x && ult.x.sc && ult.m >= 75 && /^(gol|rig|aut|occ)$/.test(ult.x.sc.tipo || "")) dec = ult;
    if (dec) b = { x: dec.x, dec: true };
    if (!b || !b.x.sc || !vivoRivela(R)) return poi();
    var x = b.x, e = x.e, q = x.chi.filter(function (y) { return y.t === "gol"; })[0], sc = {};
    for (var k in x.sc) sc[k] = x.sc[k];
    sc.replay = true; sc.zoomFine = Math.max(sc.zoomFine || 0, 0.5); sc.tz = Math.min(sc.tz || 0.55, 0.4); sc.lento = sc.lento || [Math.max(0, sc.dunque - 0.2), Math.min(1, sc.dunque + 0.12), 0.42];
    barraPartita(R, x); orologio(R, e.m, true); if (R.barSc && e.r) R.barSc.textContent = e.r[0] + " - " + e.r[1];
    var lungo = 1400 + R.az.durata(sc, 4200) + 2200 + 400;
    if (R.g() > R.pt + lungo + 250) return R.dopo(lungo, poi);   // (chi recupera: il replay è già passato)
    R.provaM = "gol della giornata"; provaPiano(R, "replay");
    avvisoCampo(R, 50, [b.dec ? "🎬 IL MOMENTO CHE HA DECISO" : "🎬 IL GOL DELLA GIORNATA", x.P.c + " – " + x.P.f + " · " + minTxt(e.m)]);
    R.az.fermo(sc);
    R.dopo(1400, function () {
      if (!vivoRivela(R)) return;
      viaAvviso(R);
      R.az.giocaPiano(sc, 4200, R, function () {}, function () {
        if (!vivoRivela(R)) return;
        if (b.dec && !q) avvisoCampo(R, 50, ["🔁 " + String(R.gr[w].r.nome).toUpperCase() + " PASSA IN TESTA", minTxt(e.m), "e resta in testa fino al fischio!"]);
        else avvisoCampo(R, 50, [q ? "⚽ " + nomeCampo(q.c.nome) + " (" + q.c.squadra + ")" : "⚽ Che gol!", q ? "di " + q.r.nome : "", b.dec ? "🔁 " + R.gr[w].r.nome + " passa in testa e ci resta fino al fischio!" : frase(FRASI_GOL[e.v || (e.t === "rig" ? "rig" : "cross")], semeDi(x))]);
        if (q && !inRitardo(R)) { FX.posto(); vibra(25); }
        R.dopo(2200, function () { if (!vivoRivela(R)) return; viaAvviso(R); R.risN.forEach(function (z) { z.nodo.classList.remove("ora"); }); R.dopo(400, poi); });
      });
    });
  }
  function segnaInCampo(R, noti) {   // nei punteggi: chi ha calciatori in campo in questo momento (il quadrettino si accende col 👟)
    listaGio(R).forEach(function (g) {
      var miei = noti.filter(function (y) { return y.r === g.r; }).map(function (y) { return y.nome; });
      g.inC.textContent = miei.length ? "👟 in campo: " + miei.join(", ") : "";
      g.nodo.classList.toggle("incampo", miei.length > 0);
    });
  }
  // toccando una riga della classifica: i 5 calciatori di quella rosa coi voti e i bonus di adesso (si chiude da sola, o toccandola)
  function schedaLive(R, g) {
    if (!vivoRivela(R) || R.fase !== "giornata" || R.pagFissa || !g) return;
    var pag = R.pag, el = R.el, r = g.r, tok = (R.pagTok || 0) + 1; R.pagTok = tok;
    svuotaNodo(pag); pag.className = "st-pag uno live";
    pag.appendChild(el("div", { class: "st-pag-tit", text: "📋 I calciatori di " + r.nome + " · adesso" }));
    pag.appendChild(el("div", { class: "st-pf-testa" }, [ el("img", { src: R.busti[r.id], alt: "" }), el("span", { text: r.nome, style: "color:" + R.colP[r.id] }), el("b", { class: "st-pf-tot", text: numFanta(totGio(g)) }) ]));
    r.kit.forEach(function (cp, k) {
      pag.appendChild(el("div", { class: "st-pf on" }, [ el("span", { class: "as-rb as-rb-" + cp.ruolo, text: (FANTA_RUOLI[cp.ruolo] || {}).breve || "" }),
        el("div", { class: "st-pf-nome" }, [ el("b", { text: nomeCampo(cp.nome) }), el("small", { text: cp.squadra + (g.ic[k] ? " · " + g.ic[k] : "") }) ]),
        el("div", { class: "st-pf-v " + classeVoto(g.vv[k]) }, [ el("small", { text: "voto" }), el("b", { text: numFanta(g.vv[k]) }) ]),
        el("div", { class: "st-pf-fv" }, [ el("small", { text: "fantavoto" }), el("b", { text: numFanta(g.vv[k] + g.bon[k]) }) ]) ]));
    });
    pag.appendChild(el("div", { class: "st-pag-nota", text: "tocca per chiudere" }));
    pag.onclick = function () { chiudiLive(R, tok); };
    void pag.offsetWidth; pag.classList.add("on");
    R.timer.push(setTimeout(function () { chiudiLive(R, tok); }, 6000));
  }
  function chiudiLive(R, tok) { if (R.pagTok !== tok || R.pagFissa) return; R.pag.classList.remove("on", "live"); R.pag.onclick = null; }
  function pagFissa(R) { R.pagFissa = true; R.pagTok = (R.pagTok || 0) + 1; R.pag.onclick = null; R.pag.classList.remove("on", "live"); segnaInCampo(R, []); }   // (intervallo e fischio finale: le pagelle le mostra il gioco)
  // ⏸️ fine primo tempo: le pagelle di tutti, coi voti di adesso (tutti erano partiti da 6) e i bonus e malus presi finora
  function intervallo(R, poi) {
    if (!vivoRivela(R)) return;
    R.az.fermo(null); R.risN.forEach(function (q) { q.nodo.classList.remove("ora"); }); pagFissa(R);
    barraTesto(R, "45'", "⏸️ Fine primo tempo");
    avvisoCampo(R, 50, ["⏸️ FINE PRIMO TEMPO", "arrivano le pagelle"]); if (!inRitardo(R)) SUONI.fischio(2, true);
    R.provaM = "intervallo"; provaPiano(R, "intervallo");
    R.dopo(1500, function () {
      if (!vivoRivela(R)) return;
      viaAvviso(R);
      listaGio(R).forEach(function (g) { g.r.gio.cal.forEach(function (c, k) { g.vv[k] = c.v1 != null ? c.v1 : 6; }); g.pt.textContent = numFanta(totGio(g)); });
      riordinaGiornata(R, null, true);   // (la 👑 segue i voti del primo tempo)
      pagelle(R, "📋 Le pagelle del primo tempo", function () {
        R.pagFissa = false;
        barraTesto(R, "46'", "▶️ Secondo tempo");
        avvisoCampo(R, 50, ["▶️ SI RIPARTE!", "secondo tempo"]); if (!inRitardo(R)) SUONI.fischio(1, true);
        provaPiano(R, "ripresa");
        R.dopo(1100, function () { if (!vivoRivela(R)) return; viaAvviso(R); R.dopo(400, poi); });
      });
    });
  }
  // ⏯️ un passo delle pagelle che aspetta chi tiene la partita (sullo stesso telefono: chi ha il telefono). Lui ha «Avanti ▶» (col
  // conto: a zero si va avanti da soli, così non resta mai ferma); online gli altri leggono «⏳ Aspettiamo Paky…» e vanno avanti quando
  // va avanti lui (R.opz.passi, dalla foto dell'host), o da soli se l'host sparisce. quale: "int" (l'intervallo) o "fin" (il fischio finale);
  // n: il numero di questo passo (1, 2, 3…); vai(): cosa fare dopo
  function guidoIo(R) { return R.opz.capo !== false || !!(R.opz.passi || {}).libero; }   // (tengo io la partita, o chi la teneva non guida più le pagelle)
  function passoCapo(R, nodo, quale, n, secondi, vai, minimo, ultimaPag) {   // (minimo: quanto resta almeno una pagina, se chi tiene la partita è già più avanti; ultimaPag: dopo questa si riparte, sempre all'ora sua)
    var capo = guidoIo(R), mio = (R.passoTok = (R.passoTok || 0) + 1), resta = secondi + (capo ? 0 : 10), fatto = false, t0 = Date.now(), ultimo = t0, visto = (R.opz.passi || {})[quale] || 0;
    // ⏱️ la pagina gira all'ora decisa da chi tiene la partita (uguale per tutti, anche per lui): online ANTICIPO_PASSO dopo il tocco
    function giraAlle(h) {
      var ul = R.ultimoGiro, hh = h;
      if (!ultimaPag && ul && ul.quale === quale && ul.h === h) hh = Math.max(h, ul.hh + Math.max(1500, minimo || 0));   // (con le pagine più corte di chi tiene la partita: un po' di tempo per leggere)
      R.ultimoGiro = { quale: quale, h: h, hh: hh };
      if (R.provaM !== undefined) provaPiano(R, "p" + quale + n);
      R.alleOra(hh, vai); R.tic();
    }
    function avanti(daMe) {
      if (fatto || mio !== R.passoTok) return; fatto = true; R.passoTok++;
      var h = daMe && R.opz.capo !== false && R.opz.onPasso ? R.opz.onPasso(quale, n) : null;
      giraAlle(h != null ? h : R.ora());
    }
    var gia = cercaPasso(R, quale, n);   // (è già deciso: chi recupera, o chi tiene la partita dopo una ricarica)
    if (gia != null && R.opz.cron && !(R.opz.passi || {}).libero) { fatto = true; R.passoTok++; return giraAlle(gia); }
    if (capo) {
      var b = R.el("button", { class: "btn st-pag-av", text: "Avanti ▶ (" + resta + ")", onclick: function () { avanti(true); } });
      nodo.appendChild(b);
      (function conta() { R.timer.push(setTimeout(function () { if (fatto || mio !== R.passoTok || !vivoRivela(R)) return; resta--; b.textContent = "Avanti ▶ (" + resta + ")"; if (resta <= 0) avanti(true); else conta(); }, 1000)); })();
      return;
    }
    var minimoMs = Math.max(1500, minimo || 0), gia = ((R.opz.passi || {})[quale] || 0) >= n;   // (gia: lui è già più avanti)
    var chi = R.opz.nomeCapo || "chi tiene la partita", w = R.el("div", { class: "st-pag-attesa", text: gia ? "▶ Si va avanti tra " + Math.ceil(minimoMs / 1000) + "…" : "⏳ Aspettiamo " + chi + "… (" + resta + ")" });
    nodo.appendChild(w);
    (function guarda() { R.timer.push(setTimeout(function () {
      if (fatto || mio !== R.passoTok || !vivoRivela(R)) return;
      var ora = (R.opz.passi || {})[quale] || 0, letto = Date.now() - t0, hP = cercaPasso(R, quale, n);
      if (hP != null) { fatto = true; R.passoTok++; return giraAlle(hP); }   // (è andato avanti lui: la pagina gira alla sua ora, per tutti insieme)
      if (ora >= n) {   // (una partita senza ore: un po' di tempo per leggere, poi avanti)
        if (letto >= minimoMs) return avanti(false);
        w.textContent = "▶ Si va avanti tra " + Math.max(1, Math.ceil((minimoMs - letto) / 1000)) + "…"; return guarda();
      }
      if (ora > visto) { visto = ora; resta = secondi + 10; ultimo = Date.now(); w.textContent = "⏳ Aspettiamo " + chi + "… (" + resta + ")"; }   // (lui c'è e sta sfogliando: il conto riparte)
      if ((R.opz.passi || {}).libero) { fatto = true; R.passoTok++; if (w.parentNode) w.parentNode.removeChild(w); return passoCapo(R, nodo, quale, n, secondi, vai); }   // (non guida più lui: «Avanti ▶» mio)
      if (Date.now() - ultimo >= 1000) { ultimo += 1000; resta--; w.textContent = "⏳ Aspettiamo " + chi + "… (" + Math.max(0, resta) + ")"; if (resta <= 0) return avanti(false); }
      guarda();
    }, 250)); })();
  }
  function classeVoto(v) { return v >= 7 ? "v7" : v >= 6.5 ? "v65" : v >= 6 ? "v6" : v >= 5.5 ? "v55" : "v5"; }
  function pagelle(R, titolo, poi) {   // tutte le rose in pagina (a gruppi, se non ci stanno): ogni calciatore col suo voto
    var gs = listaGio(R).sort(perTotale), pag = R.pag, el = R.el, per = Math.max(2, Math.floor((pag.clientHeight - 96) / 102)), pagine = [], k = 0;
    per = Math.ceil(gs.length / Math.ceil(gs.length / per));   // (gruppi pari: 4 e 4, non 7 e 1)
    for (var i = 0; i < gs.length; i += per) pagine.push(gs.slice(i, i + per));
    function mostra() {
      if (!vivoRivela(R)) return;
      if (k >= pagine.length) { pag.classList.remove("on"); R.dopo(450, poi); return; }
      var pg = pagine[k++]; svuotaNodo(pag); pag.className = "st-pag";
      pag.appendChild(el("div", { class: "st-pag-tit", text: titolo + (pagine.length > 1 ? " · " + k + "/" + pagine.length : "") }));
      pg.forEach(function (g, j) {
        var voti = g.r.kit.map(function (c, kk) {
          var vv = g.vv[kk], b = g.bon[kk];
          return el("div", { class: "st-pv " + classeVoto(vv) }, [ el("i", { class: "as-rb-" + c.ruolo }), el("span", { text: nomeCampo(c.nome) }),
            el("div", { class: "st-pv-num" }, [ el("div", { class: "st-pv-c" }, [ el("b", { text: numFanta(vv) }), el("small", { text: "voto" }) ]),   // (il voto e, accanto, il fantavoto: grandi uguali)
              el("div", { class: "st-pv-c fv" }, [ el("b", { text: numFanta(vv + b) }), el("small", { text: "fanta" }) ]) ]),
            el("em", { class: "st-pv-ic", text: g.ic[kk] || "" }) ]);
        });
        pag.appendChild(el("div", { class: "st-pag-p", style: "animation-delay:" + (j * 0.15) + "s" }, [
          el("div", { class: "st-pag-testa" }, [ el("img", { src: R.busti[g.r.id], alt: "" }), el("span", { text: g.r.nome, style: "color:" + R.colP[g.r.id] }), el("b", { text: numFanta(totGio(g)) }) ]),
          el("div", { class: "st-pag-voti" }, voti) ]));
      });
      // «Avanti ▶» di chi tiene la partita (al massimo dopo 25 secondi si va avanti da soli)
      // (prima si accende la pagina, poi il passo: se chi tiene la partita è già più avanti la pagina può chiudersi subito, e non deve
      // riaccendersi dopo. 30 ott 2026: su un telefono più piccolo di quello dell'host le pagelle del primo tempo restavano aperte sul campo)
      void pag.offsetWidth; pag.classList.add("on");
      passoCapo(R, pag, "int", Math.min(gs.length, k * per), 25, mostra, Math.min(8000, pg.length * 2500), k >= pagine.length);   // (le rose mostrate fin qui: uguali su tutti i telefoni, le pagine no)
    }
    mostra();
  }
  // 🎬 i copioni delle azioni. Coordinate del "mezzo campo" di chi attacca: hx di traverso (0-1; la porta tra 0,444 e 0,556), hy verso
  // la porta (0 = metà campo, 0,948 = la linea di porta, 0,75 = il dischetto, 0,65 = il limite dell'area), z = l'altezza del pallone in
  // metri. Ogni attore: sq ("A" chi attacca, "D" chi difende, "pA"/"pD" i portieri, "arb" l'arbitro), chi ({ nome, faccia, pc } se è
  // vostro), pts [[t, hx, hy]] (t da 0 a 1), pose [[t, { salto, tuffo, cade, capriola, braccia, carta }]] (tuffo e cade: verso ±hx).
  // op: { verso (±1: la porta attaccata), lato (±1: l'azione da destra o da sinistra), seme (le scelte a caso, uguali su tutti i
  // telefoni), rib (rigore: para anche la ribattuta) }. Le scene: cross, angolo, unodue, contro, pallonetto, fuori, slalom, punizione,
  // tapin, ribattuta e le rarità rovesciata, centrocampo, olimpico, portiere; i rigori (anche col cucchiaio), l'autogol, i cartellini
  // (entrata, fallo tattico, proteste, simulazione, ultimo uomo), la porta inviolata
  var GL = 0.948, NET = 0.98;   // (la porta è più grande del vero: i pali a 0,5 ± 0,084)
  function semeRnd(s) { var x = (Math.abs(Math.floor(s)) % 2147483646) + 1, r = function () { x = x * 16807 % 2147483647; return (x - 1) / 2147483646; }; r(); return r; }   // (il primo numero si butta: era quasi sempre lo stesso)
  function scena(tipo, v, esito, fin, et, op) {
    var sc = { tipo: tipo, v: v, attori: [], palla: [], scritte: [], rete: null, dunque: 0.7, verso: op.verso || 1, zoomFine: 0, tz: 0.55, lento: null }, L = op.lato || 1, rnd = semeRnd(op.seme || 7);
    et = et || {};
    function X(hx) { return 0.5 + (hx - 0.5) * L; }
    function muovi(a, t, hx, hy) { a.pts.push([t, X(hx), hy]); }
    function posa(a, t, o) { var q = {}; for (var k in o) q[k] = (k === "tuffo" || k === "cade") ? o[k] * L : o[k]; a.pose.push([t, q]); }
    function att(sq, chi, pts, pose) { var a = { sq: sq, chi: chi || null, pts: [], pose: [] }; pts.forEach(function (p) { muovi(a, p[0], p[1], p[2]); }); (pose || []).forEach(function (q) { posa(a, q[0], q[1]); }); sc.attori.push(a); return a; }
    function palla(l) { l.forEach(function (p) { sc.palla.push([p[0], X(p[1]), p[2], p[3] || 0]); }); }
    function scritta(t, testo, col) { sc.scritte.push({ t: t, testo: testo, col: col || "#ffe066" }); }
    function festa(a, t) {   // chi segna corre a esultare verso la bandierina, le braccia al cielo, e salta di gioia
      if (!a || t > 0.93) return;
      a.pose = a.pose.filter(function (q) { return q[0] <= t; });
      var u = a.pts[a.pts.length - 1], dx = u[1] >= 0.5 ? 1 : -1, t1 = Math.min(1, t + 0.24); sc.fest = a;
      a.pts.push([t + 0.03, u[1], u[2]]); a.pts.push([t1, 0.5 + dx * 0.26, 0.87]);
      a.pose.push([t, {}], [t + 0.06, { braccia: 1 }], [t1, { braccia: 1 }], [t1 + 0.04, { braccia: 1, salto: 0.45 }], [t1 + 0.09, { braccia: 1 }], [t1 + 0.13, { braccia: 1, salto: 0.45 }], [t1 + 0.18, { braccia: 1 }]);
    }
    function calcia(a, t) {   // il gesto del calcio: la gamba va indietro, colpisce, torna (circa un terzo di secondo)
      if (!a) return;
      posa(a, Math.max(0, t - 0.06), { calcio: 0 }); posa(a, Math.max(0, t - 0.03), { calcio: -1 }); posa(a, t + 0.01, { calcio: 1 }); posa(a, t + 0.08, { calcio: 0 });
    }
    var por = att("pD", et.para, [[0, 0.5, 0.935]]);
    // il rallentatore (e la telecamera un po' più vicina) da poco prima del tiro a poco dopo: parate, pali, salvataggi si capiscono
    function rallenta(t0, t1) { sc.lento = [Math.max(0, t0 - 0.04), Math.min(1, t1), 0.36]; sc.zoomFine = Math.max(sc.zoomFine || 0, 0.35); sc.tz = Math.max(0.15, t0 - 0.16); }
    // il tiro: dal punto da (alto z0) al momento t0 verso la porta; come finisce lo dicono esito e fin; torna quando arriva
    function tiro(t0, da, z0, q) {
      q = q || {};
      if (z0 < 1 && tira) calcia(tira, t0);   // (di piede: si vede il calcio; di testa no)
      var lt = q.lato || (rnd() < 0.5 ? 1 : -1), zq = q.quota != null ? q.quota : (rnd() < 0.4 ? 1.9 : 0.35), d = q.dur || 0.11, tA = t0 + d, pX = 0.5 + lt * 0.054, es = esito, td = t0 + d * 0.4;
      palla([[t0, da[0], da[1], z0]]); sc.lt = lt;
      function tuffa(dove, quanto, tempo) { muovi(por, td, 0.5, 0.935); muovi(por, tempo, 0.5 + dove * 0.068 * quanto, 0.935); posa(por, td, { tuffo: 0 }); posa(por, tempo, { tuffo: dove * quanto, salto: 0.35 * quanto, braccia: 1 }); posa(por, tempo + 0.09, { tuffo: dove * quanto, salto: 0, braccia: 1 });
        if (es !== "gol" && es !== "cucchiaio" && !op.rib && !op.ribGol) { posa(por, tempo + 0.22, { tuffo: dove * quanto * 0.5 }); posa(por, tempo + 0.38, {}); }   // (se non è gol si rialza: prima seduto, poi in piedi)
      }
      if (q.fermo) tuffa = function () {};   // (il portiere resta dov'è: è uscito o è a terra)
      else if (por.pts.length === 1) { muovi(por, Math.max(0.04, t0 - 0.3), 0.5 - lt * 0.02, 0.935); muovi(por, Math.max(0.06, t0 - 0.12), 0.5 + lt * 0.014, 0.935); }   // (prima del tiro un passettino di qua e di là, sulle punte)
      if (op.lento && !q.senzaLento) rallenta(t0, tA + 0.14);   // (uguale per gol e non gol: il rallentatore non dice come finisce)
      if (es === "gol" && fin === "dev") {   // deviato da un difensore: cambia strada a metà, il portiere va dall'altra parte
        var mx = da[0] + (pX - da[0]) * 0.55, my = da[1] + (GL - da[1]) * 0.55;
        att("D", null, [[0, mx + 0.04, my + 0.06], [t0 + d * 0.5, mx, my]], [[t0 + d * 0.45, {}], [t0 + d * 0.55, { cade: 0.35, salto: 0.15 }], [t0 + d * 0.55 + 0.14, {}]]);
        palla([[t0 + d * 0.55, mx, my, Math.min(z0 + 0.5, 1)], [tA + 0.03, 0.5 - lt * 0.053, GL, 0.6], [tA + 0.07, 0.5 - lt * 0.05, NET, 0.3], [1, 0.5 - lt * 0.05, NET, 0]]);
        tuffa(lt, 1, tA + 0.03); sc.rete = tA + 0.03; scritta(tA + 0.03, "GOL!"); sc.deviato = true; return (sc.dunque = tA + 0.03);
      }
      if (es === "gol") {
        if (fin === "palo") palla([[tA, 0.5 + lt * 0.084, GL, 0.9], [tA + 0.05, 0.5 + lt * 0.023, NET, 0.4], [1, 0.5 + lt * 0.023, NET, 0]]);   // palo e dentro
        else palla([[tA, pX, GL, zq], [tA + 0.04, pX + lt * 0.004, NET, zq * 0.6], [1, pX + lt * 0.004, NET, 0]]);
        tuffa(-lt, 0.9, tA);   // (spiazzato: si tuffa dall'altra parte, mai proprio sul pallone)
        if (fin === "palo") sc.paloDentro = true; var tg = fin === "palo" ? tA + 0.05 : tA;
        sc.rete = tg; scritta(tg, "GOL!"); return (sc.dunque = tg);
      }
      if (es === "cucchiaio") {   // il rigore a cucchiaio: piano, sotto la traversa, col portiere già a terra
        palla([[t0 + 0.13, 0.5, 0.86, 1.7], [t0 + 0.25, 0.5, GL, 1.0], [t0 + 0.3, 0.5, NET, 0.4], [1, 0.5, NET, 0]]);
        tuffa(lt, 1, t0 + 0.08); sc.rete = t0 + 0.25; scritta(t0 + 0.25, "CUCCHIAIO!"); return (sc.dunque = t0 + 0.25);
      }
      if (es === "parata") {
        palla([[tA - 0.01, 0.5 + lt * 0.048, 0.935, zq], [tA + 0.13, 0.5 + lt * 0.26, 1.0, 0.6], [1, 0.5 + lt * 0.3, 1.02, 0]]);
        tuffa(lt, 1, tA - 0.01); scritta(tA, "PARATA!", "#69db7c"); return (sc.dunque = tA);
      }
      if (es === "palo") {
        palla([[tA, 0.5 + lt * 0.084, GL, 0.9], [tA + 0.13, 0.5 + lt * 0.22, 0.84, 0], [1, 0.5 + lt * 0.3, 0.78, 0]]);
        tuffa(lt, 0.7, tA); scritta(tA, "PALO!", "#ffffff"); return (sc.dunque = tA);
      }
      if (es === "traversa") {
        palla([[tA, 0.5 + lt * 0.03, GL, 2.44], [tA + 0.07, 0.5 + lt * 0.045, 0.86, 1.2], [tA + 0.15, 0.5 + lt * 0.075, 0.78, 0], [1, 0.5 + lt * 0.12, 0.7, 0]]);
        tuffa(lt, 0.5, tA); scritta(tA, "TRAVERSA!", "#ffffff"); return (sc.dunque = tA);
      }
      if (es === "alto") {
        palla([[tA, 0.5 + lt * 0.023, GL + 0.004, 3.3], [tA + 0.08, 0.5 + lt * 0.03, 1.0, 3.6], [1, 0.5 + lt * 0.03, 1.03, 0]]);
        tuffa(lt, 0.3, tA); scritta(tA, "ALTO!", "#ffffff"); return (sc.dunque = tA);
      }
      if (es === "linea") {   // un difensore la toglie sulla linea, col portiere battuto
        att("D", et.linea || null, [[0, 0.5 + lt * 0.15, 0.9], [t0, 0.5 + lt * 0.165, 0.92], [tA, 0.5 + lt * 0.039, 0.942]], [[tA - 0.03, {}], [tA, { cade: -lt * 0.5, salto: 0.2 }], [tA + 0.12, { cade: -lt * 0.5 }], [tA + 0.3, {}]]);
        palla([[tA, 0.5 + lt * 0.036, 0.938, 0.3], [tA + 0.14, 0.5 + lt * 0.3, 0.74, 2.6], [tA + 0.26, 0.5 + lt * 0.36, 0.62, 0], [1, 0.5 + lt * 0.4, 0.55, 0]]);
        tuffa(-lt, 0.6, tA - 0.02); scritta(tA, "SULLA LINEA!", "#69db7c"); return (sc.dunque = tA);
      }
      palla([[tA, 0.5 + lt * 0.128, GL + 0.004, zq], [tA + 0.08, 0.5 + lt * 0.165, 1.0, zq * 0.5], [1, 0.5 + lt * 0.18, 1.03, 0]]);   // fuori
      tuffa(lt, 0.4, tA); scritta(tA, "FUORI!", "#ffffff"); return (sc.dunque = tA);
    }
    var tira, tg;
    if (tipo === "gol" || tipo === "occ" || tipo === "ann") {
      if (v === "cross" || v === "rovesciata") {
        var pc0 = att("A", et.passa, [[0, 0.84, 0.5], [0.3, 0.9, 0.82], [0.4, 0.89, 0.84]]); calcia(pc0, 0.32);
        palla([[0, 0.83, 0.51, 0], [0.3, 0.89, 0.83, 0], [0.33, 0.9, 0.845, 0.2], [0.43, 0.7, 0.84, 4.2]]);
        att("A", null, [[0, 0.62, 0.62], [0.5, 0.6, 0.8]]);
        att("D", null, [[0, 0.44, 0.7], [0.53, 0.485, 0.835]], [[0.47, {}], [0.53, { salto: 0.4 }], [0.6, {}]]);
        att("D", null, [[0, 0.66, 0.74], [0.5, 0.62, 0.86]]);
        att("D", null, [[0, 0.78, 0.66], [0.3, 0.86, 0.78], [0.45, 0.84, 0.8]]);
        if (v === "rovesciata") {   // la rovesciata: il pallone arriva alto alle spalle, lui si gira in aria a testa in giù
          tira = att("A", et.tira, [[0, 0.42, 0.62], [0.44, 0.49, 0.78], [0.55, 0.5, 0.8]], [[0.44, {}], [0.5, { salto: 0.6, capriola: 0.35 }], [0.56, { salto: 0.9, capriola: 0.8 }], [0.66, { salto: 0.2, capriola: 0.62 }], [0.71, { capriola: 0.6 }], [0.78, { capriola: 0.6 }]]);   // (atterra sulla schiena)
          palla([[0.55, 0.5, 0.8, 2.3]]); tg = tiro(0.56, [0.5, 0.8], 2.3, { quota: 1.9, dur: 0.12 });
          sc.zoomFine = 0.55; sc.tz = 0.38; sc.lento = [0.42, 0.72, 0.38];
        } else {
          tira = att("A", et.tira, [[0, 0.38, 0.6], [0.42, 0.47, 0.74], [0.53, 0.51, 0.815]], [[0.43, {}], [0.48, { salto: 0.5, inclina: -1 }], [0.53, { salto: 0.55, inclina: 1 }], [0.6, { salto: 0.1, inclina: 0.3 }], [0.66, {}]]);   // (carica indietro e colpisce di testa)
          palla([[0.53, 0.52, 0.82, 1.9]]); tg = tiro(0.53, [0.52, 0.82], 1.9, { dur: 0.1 });
        }
        if (pc0 && et.passa) festa(pc0, tg + 0.05);
      } else if (v === "angolo" || v === "olimpico" || v === "portiere") {
        var batte = att("A", v === "olimpico" ? et.tira : et.passa, [[0, 1.0, 0.944], [0.24, 0.995, 0.94], [0.28, 0.99, 0.935]]); calcia(batte, 0.28);
        palla([[0, 1.0, 0.946, 0], [0.28, 1.0, 0.946, 0]]);
        [[0.42, 0.84, 0.47, 0.83], [0.58, 0.86, 0.55, 0.88], [0.5, 0.9, 0.5, 0.91], [0.62, 0.8, 0.6, 0.83]].forEach(function (q, i) { att(i % 2 ? "D" : "A", null, [[0, q[0], q[1]], [0.45, q[2], q[3]]], [[0.42, {}], [0.48, { salto: i === 1 ? 0.35 : 0 }], [0.56, {}]]); });
        att("D", null, [[0, 0.46, 0.79], [0.47, 0.51, 0.83]], [[0.44, {}], [0.49, { salto: 0.4 }], [0.56, {}]]);
        if (v === "olimpico") {   // direttamente dal calcio d'angolo: il pallone gira e si infila sul primo palo
          palla([[0.38, 0.72, 0.92, 2.8], [0.47, 0.578, GL, 1.6], [0.51, 0.56, NET, 0.7], [1, 0.56, NET, 0]]);
          muovi(por, 0.4, 0.51, 0.935); posa(por, 0.42, {}); posa(por, 0.47, { salto: 0.5, braccia: 1 }); posa(por, 0.56, {});
          sc.rete = 0.47; scritta(0.47, "GOL!"); tg = sc.dunque = 0.47; sc.zoomFine = 0.5; sc.tz = 0.3; sc.lento = [0.34, 0.55, 0.4]; tira = batte;
        } else {
          tira = att(v === "portiere" ? "pA" : "A", et.tira, [[0, 0.62, 0.76], [0.47, 0.53, 0.84]], [[0.42, {}], [0.46, { salto: 0.5, inclina: -1 }], [0.48, { salto: 0.55, inclina: 1 }], [0.56, {}]]);
          palla([[0.38, 0.76, 0.87, 4.6], [0.48, 0.53, 0.84, 2.0]]); tg = tiro(0.48, [0.53, 0.84], 2.0, { dur: 0.08 });
          if (v === "portiere") { sc.zoomFine = 0.45; sc.tz = 0.4; sc.lento = [0.4, 0.62, 0.45]; }
        }
      } else if (v === "unodue") {
        tira = att("A", et.tira, [[0, 0.44, 0.42], [0.2, 0.48, 0.52], [0.46, 0.53, 0.7]]);
        calcia(tira, 0.2); calcia(att("A", et.passa, [[0, 0.68, 0.52], [0.26, 0.63, 0.58], [0.45, 0.61, 0.6]]), 0.36);   // (l'uno-due: passa e gliela ridà)
        palla([[0, 0.43, 0.42, 0], [0.2, 0.48, 0.53, 0], [0.29, 0.62, 0.585, 0], [0.36, 0.62, 0.59, 0], [0.46, 0.53, 0.695, 0]]);
        att("D", null, [[0, 0.55, 0.64], [0.46, 0.56, 0.74]]); att("D", null, [[0, 0.38, 0.66], [0.46, 0.45, 0.76]], [[0.44, {}], [0.48, { salto: 0.25 }], [0.54, {}]]);
        tg = tiro(0.47, [0.53, 0.7], 0.2, { dur: 0.12 });
      } else if (v === "contro") {
        calcia(att("A", et.passa, [[0, 0.35, 0.08], [0.12, 0.36, 0.12]]), 0.12);
        tira = att("A", et.tira, [[0, 0.64, 0.16], [0.42, 0.6, 0.62], [0.56, 0.55, 0.8]]);
        palla([[0, 0.35, 0.09, 0], [0.12, 0.36, 0.125, 0], [0.27, 0.5, 0.4, 8], [0.42, 0.6, 0.625, 0], [0.56, 0.55, 0.805, 0]]);
        att("D", null, [[0, 0.56, 0.3], [0.56, 0.56, 0.72]]); att("D", null, [[0, 0.44, 0.36], [0.56, 0.5, 0.7]]);
        if (esito === "gol" && !fin) {   // scarta anche il portiere e la mette nella porta vuota
          if (op.lento) rallenta(0.57, 0.8);   // (come il tiro del non-gol)
          muovi(por, 0.46, 0.5, 0.92); muovi(por, 0.56, 0.535, 0.86); posa(por, 0.55, {}); posa(por, 0.6, { tuffo: 1, salto: 0.15, braccia: 1 }); posa(por, 0.7, { tuffo: 1, braccia: 1 });
          muovi(tira, 0.63, 0.46, 0.87); palla([[0.63, 0.455, 0.872, 0], [0.7, 0.49, NET, 0.3], [1, 0.49, NET, 0]]); calcia(tira, 0.63);
          sc.rete = 0.7; scritta(0.7, "GOL!"); tg = sc.dunque = 0.7;
        } else { muovi(por, 0.5, 0.52, 0.9); tg = tiro(0.57, [0.55, 0.81], 0.3, { dur: 0.09 }); }
      } else if (v === "pallonetto") {
        calcia(att("A", et.passa, [[0, 0.48, 0.38], [0.2, 0.49, 0.42]]), 0.2);
        tira = att("A", et.tira, [[0, 0.62, 0.5], [0.4, 0.56, 0.72], [0.5, 0.54, 0.76]]); calcia(tira, 0.5);   // (il pallonetto: lo tocca sotto)
        palla([[0, 0.48, 0.39, 0], [0.2, 0.49, 0.43, 0], [0.4, 0.55, 0.715, 0], [0.5, 0.54, 0.755, 0]]);
        att("D", null, [[0, 0.5, 0.6], [0.5, 0.52, 0.7]]);
        muovi(por, 0.3, 0.5, 0.93); muovi(por, 0.5, 0.53, 0.84); posa(por, 0.48, {}); posa(por, 0.55, { salto: 0.5, braccia: 1 }); posa(por, 0.64, {});
        if (op.lento) rallenta(0.5, 0.68);   // (uguale per gol e non gol)
        if (esito === "gol") { palla([[0.6, 0.52, 0.85, 4.2], [0.7, 0.51, GL, 1.6], [0.74, 0.505, NET, 0.5], [1, 0.505, NET, 0]]); sc.rete = 0.7; scritta(0.7, "GOL!"); tg = sc.dunque = 0.7; }
        else if (esito === "parata") { palla([[0.56, 0.535, 0.815, 2.6], [0.68, 0.62, 0.9, 1], [1, 0.75, 0.97, 0]]); scritta(0.56, "PARATA!", "#69db7c"); tg = sc.dunque = 0.56; }
        else { palla([[0.6, 0.53, 0.85, 4.2]]); tg = tiro(0.6, [0.53, 0.85], 4.2, { dur: 0.1, quota: 1.6, fermo: true, senzaLento: true }); }   // (il portiere è uscito: resta lì)
      } else if (v === "slalom") {
        tira = att("A", et.tira, [[0, 0.72, 0.42], [0.18, 0.62, 0.55], [0.3, 0.68, 0.65], [0.42, 0.58, 0.74], [0.5, 0.55, 0.78]]);
        palla([[0, 0.71, 0.44, 0], [0.18, 0.61, 0.565, 0], [0.3, 0.675, 0.66, 0], [0.42, 0.575, 0.75, 0], [0.5, 0.55, 0.79, 0]]);
        att("D", null, [[0, 0.58, 0.62], [0.17, 0.61, 0.57]], [[0.14, {}], [0.2, { cade: 1 }], [0.4, { cade: 1 }], [0.5, {}]]);
        att("D", null, [[0, 0.62, 0.74], [0.3, 0.67, 0.68]], [[0.27, {}], [0.33, { cade: -1 }], [0.5, { cade: -1 }], [0.6, {}]]);
        att("D", null, [[0, 0.48, 0.8], [0.48, 0.52, 0.8]], [[0.45, {}], [0.5, { salto: 0.2 }], [0.56, {}]]);
        tg = tiro(0.5, [0.55, 0.79], 0.2, { dur: 0.09 });
      } else if (v === "punizione") {
        [0.455, 0.485, 0.515, 0.545].forEach(function (hx, i) { var dt = [0, 0.012, 0.004, 0.016][i]; att("D", null, [[0, hx, 0.625]], [[0.33 + dt, {}], [0.375 + dt, { salto: [0.4, 0.5, 0.45, 0.35][i], braccia: i % 3 ? 1 : 0 }], [0.46 + dt, {}]]); });   // (la barriera: ognuno salta a modo suo)
        tira = att("A", et.tira, [[0, 0.36, 0.44], [0.2, 0.37, 0.46], [0.3, 0.42, 0.51]]); calcia(tira, 0.3);
        att("arb", null, [[0, 0.28, 0.62]]);
        palla([[0, 0.43, 0.52, 0], [0.3, 0.43, 0.52, 0], [0.39, 0.47, 0.64, 3.4]]);
        tg = tiro(0.39, [0.47, 0.64], 3.4, { dur: 0.11, quota: 1.9 });
      // 🎬 le scene da finale (30 ott 2026, tappa 2 della Zona Cesarini; scritte e provate su migliaia di casi: prima del tiro finale tutto è
      // identico qualunque sia l'esito, il colpo finale è sempre tiro())
      } else if (v === "mischia") {   // la mischia: cross dal fondo (o calcio d'angolo), un tiro respinto da un difensore, uno che sbatte addosso a un altro, poi il colpo da vicino
        if (fin === "dev") fin = null;   // (niente deviazione: il difensore che devia comparirebbe in area fin dall'inizio, e solo nel gol)
        rnd(); var daAngM = rnd() < 0.5, ltM = rnd() < 0.5 ? 1 : -1, crM;   // (il primo numero del seme si scarta: coi semi veri è sempre tra 0,08 e 0,10. ltM: da che parte va il tiro finale, deciso prima: serve al difensore sul palo)
        if (daAngM) {   // dal calcio d'angolo
          crM = att("A", et.passa, [[0, 0.985, 0.93], [0.06, 0.995, 0.94], [0.08, 0.997, 0.942]]); calcia(crM, 0.08);
          palla([[0, 1.0, 0.946, 0], [0.08, 1.0, 0.946, 0], [0.18, 0.8, 0.9, 4.0]]);
        } else {   // il cross dal fondo
          crM = att("A", et.passa, [[0, 0.84, 0.68], [0.1, 0.872, 0.79], [0.16, 0.885, 0.81]]); calcia(crM, 0.12);
          palla([[0, 0.835, 0.69, 0], [0.12, 0.876, 0.8, 0], [0.2, 0.75, 0.83, 3.4]]);
        }
        palla([[0.27, 0.615, 0.842, 0.7], [0.3, 0.6, 0.893, 0.9], [0.355, 0.57, 0.84, 1.8], [0.41, 0.535, 0.79, 0.3], [0.435, 0.517, 0.83, 0.6], [0.49, 0.495, 0.842, 2.1]]);   // (la volée respinta, il tiro di prima che sbatte addosso, il pallone che schizza in alto e ricade)
        calcia(att("A", null, [[0, 0.68, 0.76], [0.2, 0.64, 0.815], [0.26, 0.625, 0.835]]), 0.27);   // (il primo: al volo sul primo palo…)
        att("D", null, [[0, 0.62, 0.92], [0.2, 0.605, 0.905], [0.29, 0.6, 0.9], [0.45, 0.61, 0.91]], [[0.28, {}], [0.3, { salto: 0.12, cade: 0.25 }], [0.38, { cade: 0.15 }], [0.46, {}]]);   // (…e il difensore che la respinge col corpo e barcolla)
        calcia(att("A", null, [[0, 0.55, 0.7], [0.3, 0.535, 0.765], [0.4, 0.53, 0.783], [0.52, 0.525, 0.8]]), 0.41);   // (il secondo: di prima sul rimpallo…)
        att("D", null, [[0, 0.48, 0.905], [0.3, 0.495, 0.88], [0.42, 0.512, 0.84], [0.44, 0.515, 0.836]], [[0.41, {}], [0.44, { cade: 0.55, salto: 0.15 }], [0.52, { cade: 0.6 }], [0.7, { cade: 0.6 }], [0.82, {}]]);   // (…e il difensore che si butta: gli sbatte addosso)
        att("A", null, [[0, 0.57, 0.8], [0.3, 0.555, 0.86], [0.5, 0.55, 0.875]]);
        att("D", null, [[0, 0.41, 0.8], [0.3, 0.425, 0.84], [0.5, 0.432, 0.868], [0.56, 0.435, 0.875]], [[0.55, {}], [0.6, { cade: 0.5, salto: 0.1 }], [0.72, { cade: 0.5 }], [0.86, {}]]);   // (chi marca il nostro: si allunga tardi)
        var paloM = att("D", null, [[0, 0.5 + ltM * 0.15, 0.9], [0.55, 0.5 + ltM * 0.165, 0.92], [0.55 + 0.065, 0.5 + ltM * 0.165, 0.942]]);   // (il difensore sul palo: gli stessi punti di chi la salva sulla linea in tiro())
        tira = att("A", et.tira, [[0, 0.37, 0.72], [0.3, 0.41, 0.79], [0.48, 0.462, 0.838], [0.54, 0.47, 0.843]]);   // (il nostro: arriva dal secondo palo)
        muovi(por, 0.22, 0.53, 0.932); muovi(por, 0.3, 0.535, 0.93); muovi(por, 0.41, 0.515, 0.928); muovi(por, 0.5, 0.5, 0.935);   // (segue il pallone e torna in mezzo prima del tiro)
        posa(por, 0.42, {}); posa(por, 0.445, { salto: 0.12, braccia: 0.6 }); posa(por, 0.49, {});
        tg = tiro(0.55, [0.478, 0.85], 0.4, { dur: 0.065, lato: ltM, senzaLento: true });
        if (esito === "linea") sc.attori[sc.attori.indexOf(paloM)] = sc.attori.pop();   // (sulla linea la toglie proprio lui: stesso posto e stesso aspetto fino al tiro)
        if (op.lento) { rallenta(0.46, 0.55 + 0.065 + 0.14); sc.zoomFine = 0.45; }   // (uguale per gol e non gol: già dal tiro che sbatte addosso, un po' più vicino)
        if ((tipo === "gol" || tipo === "ann") && et.passa) festa(crM, tg + 0.05);   // (chi ha crossato va a festeggiare; poi la telecamera segue chi ha segnato)
      } else if (v === "testa") {   // la palla lunga: lancio da centrocampo (o dalla trequarti), il nostro e il suo difensore saltano insieme, la prende di testa
        if (fin === "dev") fin = null;   // (niente deviazione: il difensore che devia comparirebbe fin dall'inizio, e solo nel gol)
        rnd(); var y0T = 0.12 + rnd() * 0.26, ltT = rnd() < 0.5 ? 1 : -1, lanT;   // (il primo numero del seme si scarta: coi semi veri è sempre tra 0,08 e 0,10. y0T: da dove parte il lancio; ltT: da che parte va il colpo di testa, deciso prima)
        lanT = att("A", et.passa, [[0, 0.33, y0T - 0.05], [0.06, 0.345, y0T - 0.01], [0.12, 0.35, y0T], [0.6, 0.37, y0T + 0.1]]); calcia(lanT, 0.06);   // (poi accompagna piano l'azione)
        palla([[0, 0.335, y0T - 0.04, 0], [0.06, 0.348, y0T - 0.005, 0], [0.25, 0.44, (y0T + 0.792) / 2, 4 + (0.797 - y0T) * 7]]);   // (il lancio: sale (7-9 metri) e scende sulla testa)
        att("D", null, [[0, 0.44, y0T + 0.1], [0.12, 0.39, y0T + 0.04], [0.6, 0.41, y0T + 0.13]]);   // (chi va a chiudere il lancio: arriva tardi)
        att("A", null, [[0, 0.5, y0T + 0.06], [0.44, 0.49, Math.min(0.64, y0T + 0.3)]]);   // (chi accompagna: pronto sulla seconda palla)
        att("A", null, [[0, 0.38, 0.56], [0.44, 0.425, 0.8], [0.56, 0.44, 0.84]]); att("D", null, [[0, 0.41, 0.66], [0.44, 0.41, 0.835]]);   // (il secondo palo, col suo marcatore)
        att("A", null, [[0, 0.72, 0.52], [0.44, 0.665, 0.745]]); att("D", null, [[0, 0.69, 0.66], [0.44, 0.645, 0.8]]);   // (il primo palo, col suo marcatore)
        att("D", null, [[0, 0.67, 0.6], [0.25, 0.615, 0.705], [0.4, 0.565, 0.795], [0.44, 0.558, 0.805]], [[0.37, {}], [0.41, { salto: 0.42 }], [0.45, { salto: 0.48, braccia: 0.4 }], [0.5, { salto: 0.05, cade: 0.3 }], [0.58, { cade: 0.3 }], [0.68, {}]]);   // (il difensore che salta con lui: un attimo dopo, un po' più basso)
        var paloT = att("D", null, [[0, 0.5 + ltT * 0.15, 0.9], [0.44, 0.5 + ltT * 0.165, 0.92], [0.44 + 0.11, 0.5 + ltT * 0.165, 0.942]]);   // (il difensore sul palo: gli stessi punti di chi la salva sulla linea in tiro())
        tira = att("A", et.tira, [[0, 0.63, 0.56], [0.25, 0.585, 0.69], [0.4, 0.538, 0.785], [0.44, 0.532, 0.792]], [[0.36, {}], [0.4, { salto: 0.45, inclina: -1 }], [0.44, { salto: 0.6, inclina: 1 }], [0.5, { salto: 0.1, inclina: 0.3 }], [0.56, {}]]);   // (carica indietro e colpisce di testa)
        muovi(por, 0.25, 0.51, 0.928); muovi(por, 0.4, 0.5, 0.935);   // (un passo avanti sul lancio, poi in mezzo alla porta)
        tg = tiro(0.44, [0.535, 0.797], 2.0, { dur: 0.11, lato: ltT });
        if (esito === "linea") sc.attori[sc.attori.indexOf(paloT)] = sc.attori.pop();   // (sulla linea la toglie proprio lui: stesso posto e stesso aspetto fino al colpo)
        if ((tipo === "gol" || tipo === "ann") && et.passa) { posa(lanT, tg, {}); posa(lanT, tg + 0.06, { braccia: 1 }); posa(lanT, tg + 0.3, { braccia: 1 }); posa(lanT, tg + 0.36, {}); }   // (chi ha lanciato alza le braccia da lontano, solo dopo il gol)
      } else if (v === "incrocio") {   // il tiro a giro da fuori: lo sistema, calcia d'interno, la palla gira lunga verso l'incrocio lontano
        var sca = att("A", et.passa, [[0, 0.17, 0.43], [0.1, 0.175, 0.435], [0.3, 0.22, 0.49]]); calcia(sca, 0.1);   // (lo scarico dalla fascia)
        tira = att("A", et.tira, [[0, 0.44, 0.47], [0.26, 0.364, 0.54], [0.3, 0.372, 0.553], [0.36, 0.36, 0.553], [0.43, 0.378, 0.566], [0.56, 0.4, 0.6]]); calcia(tira, 0.43);   // (stop, tocco, passo indietro e calcio)
        att("D", null, [[0, 0.43, 0.68], [0.4, 0.405, 0.615], [0.5, 0.41, 0.622]], [[0.42, {}], [0.45, { salto: 0.3 }], [0.52, {}]]);   // (esce sul tiratore e salta: il pallone gli passa accanto)
        att("D", null, [[0, 0.45, 0.8], [0.6, 0.465, 0.86]]);
        att("A", null, [[0, 0.72, 0.74], [0.62, 0.69, 0.85]]); att("D", null, [[0, 0.7, 0.79], [0.62, 0.675, 0.875]]);   // (larghi sul secondo palo, lontani dalla strada del pallone)
        palla([[0, 0.18, 0.445, 0], [0.1, 0.185, 0.448, 0], [0.26, 0.367, 0.546, 0], [0.3, 0.38, 0.565, 0], [0.34, 0.386, 0.574, 0], [0.43, 0.386, 0.574, 0],
          [0.48, 0.486, 0.664, 2.9], [0.54, 0.545, 0.772, 2.9]]);   // (la curva: parte larga, sale e rientra verso il palo lontano)
        muovi(por, 0.2, 0.5, 0.935); muovi(por, 0.41, 0.474, 0.932); muovi(por, 0.54, 0.488, 0.935);   // (copre il primo palo, poi segue il pallone che gira)
        if (op.lento) rallenta(0.45, 0.78);   // (dal calcio d'interno a dopo l'arrivo: uguale per gol e non gol)
        tg = tiro(0.54, [0.545, 0.772], 2.9, { lato: 1, quota: 2.3, dur: 0.12, senzaLento: true });
        if (sca && et.passa && (tipo === "gol" || tipo === "ann")) festa(sca, tg + 0.06);
// ---- DA AGGIUNGERE (accanto alle altre scene) ----
      } else if (v === "miracolo") {   // la botta da due passi, il miracolo del portiere, la ribattuta
        var ala = att("A", et.passa, [[0, 0.8, 0.7], [0.2, 0.855, 0.855], [0.26, 0.85, 0.87]]); calcia(ala, 0.22);   // (scende sul fondo e la mette indietro)
        var mc1 = att("A", null, [[0, 0.62, 0.7], [0.32, 0.575, 0.79], [0.36, 0.57, 0.8], [0.5, 0.55, 0.835]], [[0.4, {}], [0.44, { braccia: 1 }], [0.53, {}]]); calcia(mc1, 0.34);   // (la botta di prima… e le mani nei capelli)
        tira = att("A", et.tira, [[0, 0.3, 0.72], [0.3, 0.34, 0.79], [0.47, 0.385, 0.85], [0.51, 0.394, 0.856]]);   // (arriva da dietro, il più lesto di tutti)
        att("D", null, [[0, 0.74, 0.66], [0.22, 0.81, 0.82], [0.4, 0.785, 0.85]]);   // (insegue l'ala, in ritardo)
        att("D", null, [[0, 0.64, 0.76], [0.33, 0.615, 0.795]], [[0.31, {}], [0.35, { cade: -0.6, salto: 0.15 }], [0.5, { cade: -0.6 }], [0.62, {}]]);   // (prova a murare in scivolata)
        att("D", null, [[0, 0.46, 0.76], [0.45, 0.475, 0.82], [0.52, 0.465, 0.83]]);
        palla([[0, 0.805, 0.705, 0], [0.2, 0.86, 0.86, 0], [0.22, 0.862, 0.866, 0], [0.33, 0.578, 0.798, 0], [0.34, 0.574, 0.8, 0],
          [0.4, 0.452, 0.928, 0.5], [0.405, 0.452, 0.928, 0.5], [0.44, 0.42, 0.885, 1.8]]);   // (la respinta: si impenna e ricade in area)
        muovi(por, 0.12, 0.5, 0.935); muovi(por, 0.22, 0.535, 0.933); muovi(por, 0.34, 0.512, 0.935); muovi(por, 0.4, 0.484, 0.935); muovi(por, 0.47, 0.486, 0.935); muovi(por, 0.51, 0.49, 0.935);
        posa(por, 0.35, {}); posa(por, 0.4, { tuffo: -1, salto: 0.35, braccia: 1 }); posa(por, 0.46, { tuffo: -1, braccia: 1 }); posa(por, 0.51, { tuffo: -0.5 });   // (il volo, a terra, si rialza)
        if (op.lento) rallenta(0.4, 0.73);   // (dalla prima botta a dopo la ribattuta: uguale per tutti)
        tg = tiro(0.51, [0.402, 0.86], 0.2, { lato: 1, dur: 0.09, senzaLento: true });
        if (esito === "parata") sc.scritte[sc.scritte.length - 1].testo = "PARA ANCHE QUELLA!";
        if (et.passa && (tipo === "gol" || tipo === "ann")) festa(ala, tg + 0.06);
// ---- DA AGGIUNGERE (accanto alle altre scene) ----
      } else if (v === "assedio") {   // 🔥 l'assedio: tutti nell'area avversaria, il cross respinto, la botta murata, il tiro parato (o sul palo), la sponda e il tiro finale
        if (fin === "dev") fin = null;   // (niente deviazione: il difensore di tiro() partirebbe dentro la porta. Il gol resta un gol)
        var asL = rnd() < 0.5 ? 1 : -1, asPalo = rnd() < 0.4, asT = 0.65, asD = 0.09;   // (asL: dove va il tiro finale; asPalo: il terzo colpo prende il palo)
        // 1) il cross dalla destra: il difensore la respinge di testa
        var asC = att("A", null, [[0, 0.835, 0.752], [0.05, 0.848, 0.772], [0.35, 0.82, 0.78], [asT, 0.8, 0.79]]); calcia(asC, 0.05);
        att("D", null, [[0, 0.78, 0.81], [0.09, 0.81, 0.797], [asT, 0.77, 0.81]], [[0.03, {}], [0.07, { salto: 0.2 }], [0.13, {}]]);   // (arriva tardi sul cross)
        att("A", null, [[0, 0.46, 0.77], [0.22, 0.525, 0.83], [asT, 0.47, 0.875]], [[0.17, {}], [0.22, { salto: 0.4 }], [0.29, {}]]);   // (salta col difensore, non ci arriva)
        att("D", null, [[0, 0.6, 0.86], [0.22, 0.552, 0.848], [asT, 0.6, 0.865]], [[0.17, {}], [0.215, { salto: 0.5, inclina: -1 }], [0.235, { salto: 0.5, inclina: 1 }], [0.31, {}]]);
        // 2) la respinta cade al limite: botta al volo, un difensore si butta davanti e la mura (resta a terra, poi si rialza)
        var asV = att("A", null, [[0, 0.42, 0.6], [0.33, 0.497, 0.668], [asT, 0.5, 0.69]]); calcia(asV, 0.33);
        att("D", null, [[0, 0.44, 0.8], [0.35, 0.5, 0.736], [asT, 0.5, 0.742]], [[0.32, {}], [0.355, { salto: 0.25 }], [0.4, { cade: -0.8 }], [0.53, { cade: -0.8 }], [0.61, {}]]);
        // 3) la palla schizza sulla destra: tiro di prima sul primo palo, il portiere para (o il palo)
        var asR = att("A", null, [[0, 0.72, 0.68], [0.435, 0.604, 0.758], [asT, 0.62, 0.78]]); calcia(asR, 0.435);
        att("D", null, [[0, 0.68, 0.84], [0.445, 0.655, 0.8], [asT, 0.67, 0.81]], [[0.4, {}], [0.455, { salto: 0.25 }], [0.51, {}]]);
        // 4) la sponda di testa (l'assist, se c'è) per chi arriva da dietro
        var asS = att("A", et.passa, [[0, 0.37, 0.79], [0.51, 0.443, 0.85], [asT, 0.44, 0.852]], [[0.515, {}], [0.555, { salto: 0.45, inclina: -1 }], [0.575, { salto: 0.45, inclina: 1 }], [0.635, {}]]);
        att("D", null, [[0, 0.35, 0.82], [0.51, 0.405, 0.878], [asT, 0.405, 0.878]], [[0.535, {}], [0.57, { salto: 0.3 }], [0.625, {}]]);
        tira = att("A", et.tira, [[0, 0.6, 0.62], [0.435, 0.59, 0.69], [asT, 0.55, 0.795]]);
        // gli altri: tutti su, fino al limite dell'area
        att("A", null, [[0, 0.27, 0.68], [asT, 0.3, 0.72]]); att("A", null, [[0, 0.68, 0.6], [asT, 0.71, 0.64]]); att("D", null, [[0, 0.29, 0.76], [asT, 0.32, 0.79]]);
        palla([[0, 0.845, 0.765, 0], [0.05, 0.855, 0.78, 0], [0.135, 0.7, 0.82, 4.2], [0.22, 0.552, 0.85, 2.3], [0.27, 0.52, 0.76, 3.4], [0.33, 0.5, 0.675, 0.5], [0.355, 0.5, 0.728, 0.6], [0.435, 0.6, 0.765, 0]]);
        palla(asPalo ? [[0.505, 0.584, GL, 0.7], [0.575, 0.445, 0.857, 1.8]] : [[0.505, 0.566, 0.93, 0.6], [0.575, 0.445, 0.857, 1.8]]);
        // il portiere: segue il cross, si tuffa sul tiro dalla destra, si rialza e torna in mezzo prima del tiro finale
        muovi(por, 0.135, 0.525, 0.93); muovi(por, 0.3, 0.5, 0.935); muovi(por, 0.435, 0.515, 0.935); muovi(por, 0.505, asPalo ? 0.55 : 0.565, 0.935); muovi(por, 0.565, asPalo ? 0.55 : 0.565, 0.935); muovi(por, 0.625, 0.5, 0.935);
        posa(por, 0.445, {}); posa(por, 0.505, { tuffo: asPalo ? 0.7 : 1, salto: 0.3, braccia: 1 }); posa(por, 0.545, { tuffo: asPalo ? 0.7 : 1, braccia: 1 }); posa(por, 0.575, { tuffo: 0.4 }); posa(por, 0.615, {});
        // il difensore sul palo: la stessa strada del difensore che tiro() aggiunge per il salvataggio sulla linea (DEVE essere l'ultimo attore prima del tiro)
        if (esito !== "linea") att("D", et.linea || null, [[0, 0.5 + asL * 0.15, 0.9], [asT, 0.5 + asL * 0.165, 0.92], [asT + asD, 0.5 + asL * 0.165, 0.942]]);
        tg = tiro(asT, [0.55, 0.8], 0.3, { dur: asD, lato: asL });
        if ((tipo === "gol" || tipo === "ann") && et.passa) festa(asS, tg + 0.05);
        sc.zoomFine = 0.35; sc.tz = 0.12;   // (la telecamera resta stretta sull'area per tutta l'azione: uguale per tutti gli esiti)
      } else if (v === "ultimo") {   // ⏱ l'ultimo assalto: calcio d'angolo, in area salgono tutti, anche il portiere che arriva di corsa dalla sua metà campo
        if (fin === "dev") fin = null;   // (niente deviazione: il difensore di tiro() partirebbe dentro la porta. Il gol resta un gol)
        var ulL = rnd() < 0.5 ? 1 : -1, ulT = 0.6, ulD = 0.08;   // (ulL: dove va il colpo di testa)
        var ulB = att("A", et.passa, [[0, 1.0, 0.944], [0.38, 0.995, 0.94], [0.42, 0.99, 0.935]], [[0, { braccia: 1 }], [0.28, { braccia: 1 }], [0.34, {}]]); calcia(ulB, 0.42);   // (chiama tutti in area, poi batte)
        palla([[0, 1.0, 0.946, 0], [0.42, 1.0, 0.946, 0], [0.52, 0.77, 0.87, 4.4]]);
        // il portiere di chi attacca: arriva di corsa dalla sua metà campo, salta anche lui sul cross ma la prende un altro
        var ulP = att("pA", null, [[-0.14, 0.44, -0.13], [0.44, 0.5, 0.67], [0.56, 0.47, 0.78], [ulT, 0.465, 0.795], [ulT + ulD, 0.465, 0.795]],
          [[0.52, {}], [0.57, { salto: 0.45, braccia: 0.5 }], [0.64, {}], [ulT + ulD, {}]]);
        att("D", null, [[0, 0.47, 0.74], [0.42, 0.47, 0.75], [0.56, 0.45, 0.79], [ulT, 0.44, 0.8]], [[0.54, {}], [0.58, { salto: 0.35 }], [0.65, {}]]);   // (lo marca)
        tira = att("A", et.tira, [[0, 0.64, 0.74], [0.3, 0.62, 0.76], [0.5, 0.57, 0.8], [ulT, 0.53, 0.83]], [[0.54, {}], [0.58, { salto: 0.5, inclina: -1 }], [0.6, { salto: 0.55, inclina: 1 }], [0.67, { salto: 0.1, inclina: 0.3 }], [0.72, {}]]);   // (carica indietro e colpisce di testa)
        att("D", null, [[0, 0.6, 0.79], [0.3, 0.6, 0.81], [0.5, 0.59, 0.83], [ulT, 0.56, 0.84]], [[0.55, {}], [0.59, { salto: 0.35 }], [0.66, {}]]);
        // tutti gli altri in area, ognuno col suo uomo (chi difende sta tra l'uomo e la porta), due al limite per la seconda palla
        [[0.4, 0.82, 0.42, 0.872, 0.39, 0.85, 0.405, 0.893], [0.68, 0.8, 0.6, 0.88, 0.665, 0.83, 0.615, 0.9], [0.3, 0.76, 0.34, 0.8, 0.315, 0.79, 0.355, 0.83], [0.74, 0.76, 0.7, 0.8, 0.725, 0.79, 0.69, 0.83]].forEach(function (q, i) {
          att("A", null, [[0, q[0], q[1]], [0.55, q[2], q[3]]], [[0.53, {}], [0.58, { salto: i < 2 ? 0.3 : 0 }], [0.64, {}]]);
          att("D", null, [[0, q[4], q[5]], [0.55, q[6], q[7]]], [[0.53, {}], [0.58, { salto: i < 2 ? 0.25 : 0 }], [0.64, {}]]);
        });
        att("A", null, [[0, 0.42, 0.66], [ulT, 0.44, 0.68]]); att("A", null, [[0, 0.6, 0.65], [ulT, 0.58, 0.68]]);
        att("D", null, [[0, 0.5 - ulL * 0.15, 0.9], [ulT, 0.5 - ulL * 0.165, 0.92]]);   // (un difensore per palo)
        muovi(por, 0.3, 0.53, 0.93); muovi(por, 0.52, 0.5, 0.935);   // (il portiere che difende va verso il primo palo e torna in mezzo)
        // il difensore sull'altro palo: la stessa strada di quello che tiro() aggiunge per il salvataggio sulla linea (DEVE essere l'ultimo attore prima del tiro)
        if (esito !== "linea") att("D", et.linea || null, [[0, 0.5 + ulL * 0.15, 0.9], [ulT, 0.5 + ulL * 0.165, 0.92], [ulT + ulD, 0.5 + ulL * 0.165, 0.942]]);
        tg = tiro(ulT, [0.53, 0.83], 2.0, { dur: ulD, lato: ulL });
        if (esito === "gol") {   // il portiere esulta e corre dietro a chi ha segnato
          muovi(ulP, 0.92, 0.68, 0.85); [0, 0.04, 0.08, 0.12, 0.16, 0.2].forEach(function (d, i) { posa(ulP, tg + 0.04 + d, i % 2 ? { braccia: 1, salto: 0.4 } : { braccia: 1 }); });
          if (et.passa) festa(ulB, tg + 0.05);
        } else { muovi(ulP, tg + 0.06, 0.475, 0.76); muovi(ulP, 1, 0.5, 0.45); }   // (non è gol: si gira e torna di corsa verso la sua porta)
        sc.zoomFine = 0.35; sc.tz = 0.42;   // (dal corner in poi la telecamera si stringe sull'area: uguale per tutti gli esiti)
      } else if (v === "tapin") {
        calcia(att("A", null, [[0, 0.36, 0.58], [0.28, 0.4, 0.625]]), 0.28);
        tira = att("A", et.tira, [[0, 0.64, 0.7], [0.5, 0.565, 0.85]]);
        palla([[0, 0.35, 0.575, 0], [0.28, 0.4, 0.63, 0], [0.4, 0.47, 0.925, 0.5], [0.5, 0.56, 0.86, 0]]);
        muovi(por, 0.36, 0.5, 0.935); muovi(por, 0.4, 0.47, 0.935); posa(por, 0.34, {}); posa(por, 0.4, { tuffo: -1, salto: 0.3, braccia: 1 }); posa(por, 0.5, { tuffo: -1, braccia: 1 });
        att("D", null, [[0, 0.62, 0.78], [0.5, 0.6, 0.86]]);
        if (esito === "gol") { if (op.lento) rallenta(0.52, 0.74); calcia(tira, 0.5); palla([[0.55, 0.53, NET, 0.3], [1, 0.53, NET, 0]]); sc.rete = 0.55; scritta(0.55, "GOL!"); tg = sc.dunque = 0.55; }
        else tg = tiro(0.52, [0.565, 0.855], 0, { dur: 0.08, fermo: esito !== "parata" });
      } else if (v === "ribattuta") {   // il portiere ha parato il rigore: il pallone torna in area e qualcuno ci arriva prima di tutti
        posa(por, 0, { tuffo: -1, braccia: 1 }); posa(por, 0.3, { tuffo: -1, braccia: 1 }); posa(por, 0.42, { tuffo: -0.4 }); muovi(por, 0.3, 0.47, 0.935); muovi(por, 0.42, 0.49, 0.93);
        tira = att("A", et.tira, [[0, 0.45, 0.72], [0.3, 0.43, 0.82]]); calcia(tira, 0.3);
        att("D", null, [[0, 0.56, 0.72], [0.3, 0.5, 0.8]]); att("A", null, [[0, 0.6, 0.7], [0.32, 0.56, 0.8]]); att("D", null, [[0, 0.38, 0.72], [0.3, 0.4, 0.8]]);
        palla([[0, 0.47, 0.93, 0.5], [0.3, 0.43, 0.83, 0], [0.36, 0.5, NET, 0.4], [1, 0.5, NET, 0]]);
        sc.rete = 0.36; scritta(0.36, "GOL!"); tg = sc.dunque = 0.36;
      } else if (v === "centrocampo") {   // da centrocampo: vede il portiere fuori dai pali e la tira da lontanissimo
        tira = att("A", et.tira, [[0, 0.52, 0.0], [0.22, 0.5, 0.03]]); calcia(tira, 0.22);
        palla([[0, 0.53, 0.0, 0], [0.22, 0.5, 0.035, 0], [0.45, 0.5, 0.5, 13], [0.7, 0.5, GL, 1.6], [0.73, 0.5, NET, 0.6], [1, 0.5, NET, 0]]);
        muovi(por, 0.2, 0.5, 0.82); muovi(por, 0.68, 0.5, 0.92); posa(por, 0.6, {}); posa(por, 0.69, { salto: 0.5, braccia: 1 }); posa(por, 0.78, { cade: 1 });
        att("D", null, [[0, 0.45, 0.08], [0.22, 0.48, 0.06]]);
        sc.rete = 0.7; scritta(0.7, "GOL!"); tg = sc.dunque = 0.7; sc.zoomFine = 0.35; sc.tz = 0.6; sc.lento = [0.55, 0.75, 0.45];
      } else {   // fuori: il tiro da fuori area (anche un missile all'incrocio)
        calcia(att("A", null, [[0, 0.2, 0.45], [0.2, 0.24, 0.47]]), 0.2);
        tira = att("A", et.tira, [[0, 0.52, 0.44], [0.3, 0.47, 0.49], [0.42, 0.48, 0.53]]);
        palla([[0, 0.21, 0.46, 0], [0.2, 0.25, 0.47, 0], [0.32, 0.45, 0.5, 0], [0.42, 0.48, 0.535, 0]]);
        att("D", null, [[0, 0.5, 0.66], [0.44, 0.485, 0.59]], [[0.42, {}], [0.46, { salto: 0.25 }], [0.52, {}]]);
        att("D", null, [[0, 0.62, 0.72], [0.44, 0.58, 0.7]]);
        tg = tiro(0.45, [0.48, 0.54], 0.3, { dur: 0.15, quota: rnd() < 0.6 ? 1.9 : 0.4 });
      }
      if ((tipo === "gol" || tipo === "ann") && tira && et.tira) festa(tira, tg + (v === "rovesciata" ? 0.16 : 0.04));   // (dalla rovesciata prima si rialza)
      if (tipo === "gol" || tipo === "ann") sc.gol = true;
    } else if (tipo === "rig") {   // il rigore: la rincorsa, il tiro, il tuffo; con la ribattuta parata (rib) anche il secondo tiro
      tira = att("A", et.tira, [[0, 0.44, 0.66], [0.3, 0.45, 0.68], [0.42, 0.494, 0.741]]);
      att("arb", null, [[0, 0.3, 0.74]]); sc.fischi = [0.3];   // (l'arbitro fischia: si può tirare)
      palla([[0, 0.5, 0.75, 0], [0.42, 0.5, 0.75, 0]]);
      tg = tiro(0.43, [0.5, 0.75], 0, { dur: 0.09, quota: rnd() < 0.3 ? 1.9 : 0.3, lato: op.ribGol ? -1 : 0 });
      if (esito === "parata" && op.ribGol) { sc.palla.splice(sc.palla.length - 2, 2); palla([[0.62, 0.43, 0.84, 0], [1, 0.43, 0.84, 0]]); }   // (il pallone resta in area: c'è la ribattuta)
      if (esito === "parata" && op.rib) {
        var lr = sc.lt || 1;
        sc.palla.splice(sc.palla.length - 2, 2);   // (il pallone resta in area, dalla parte del primo tuffo)
        palla([[0.6, 0.5 + lr * 0.08, 0.86, 0], [0.7, 0.5 + lr * 0.08, 0.86, 0], [0.78, 0.5 - lr * 0.03, 0.93, 0.4], [1, 0.5 - lr * 0.22, 0.98, 0]]);
        muovi(tira, 0.68, 0.5 + lr * 0.075, 0.845); calcia(tira, 0.7);
        muovi(por, 0.64, 0.5 + lr * 0.068, 0.935); muovi(por, 0.74, 0.5 + lr * 0.005, 0.935);   // (si rialza e torna verso il centro)
        posa(por, 0.64, { tuffo: lr * 0.6 }); posa(por, 0.72, { tuffo: 0 }); posa(por, 0.77, { tuffo: -lr, salto: 0.3, braccia: 1 }); posa(por, 0.86, { tuffo: -lr, braccia: 1 });
        scritta(0.78, "PARA ANCHE QUELLA!", "#69db7c"); sc.dunque = 0.78; rallenta(0.42, 0.86);
      }
      if (esito === "gol" || esito === "cucchiaio") { festa(tira, tg + 0.05); sc.gol = true; }
      if (esito === "cucchiaio") { sc.zoomFine = 0.4; sc.tz = 0.35; sc.lento = [0.42, 0.72, 0.4]; }
    } else if (tipo === "aut") {   // l'autogol: un difensore (D) la devia nella sua porta
      if (op.lento) rallenta(v === "fuori" ? 0.45 : v === "angolo" ? 0.48 : 0.53, v === "fuori" ? 0.74 : v === "angolo" ? 0.7 : 0.77);   // (come le occasioni con la stessa scena)
      if (v === "fuori") {
        calcia(att("A", null, [[0, 0.5, 0.44], [0.4, 0.48, 0.53]]), 0.4);
        palla([[0, 0.5, 0.45, 0], [0.4, 0.48, 0.535, 0], [0.5, 0.49, 0.72, 0.6]]);
        tira = att("D", et.fallo, [[0, 0.46, 0.75], [0.5, 0.49, 0.72]], [[0.47, {}], [0.5, { salto: 0.2 }], [0.6, { cade: -0.4 }], [0.76, {}], [0.82, { braccia: 0.5 }]]);   // (si rialza e allarga le braccia: ma che ho fatto?)
      } else if (v === "angolo") {
        calcia(att("A", null, [[0, 1.0, 0.944], [0.26, 0.99, 0.935]]), 0.28);
        palla([[0, 1.0, 0.946, 0], [0.28, 1.0, 0.946, 0], [0.4, 0.74, 0.88, 4.2], [0.5, 0.52, 0.875, 0.8]]);
        att("A", null, [[0, 0.44, 0.8], [0.5, 0.48, 0.84]], [[0.45, {}], [0.5, { salto: 0.4 }], [0.56, {}]]);
        tira = att("D", et.fallo, [[0, 0.58, 0.8], [0.5, 0.525, 0.87]], [[0.46, {}], [0.5, { salto: 0.4 }], [0.6, { cade: 0.6 }], [0.76, {}], [0.82, { braccia: 0.5 }]]);
      } else {
        calcia(att("A", null, [[0, 0.84, 0.5], [0.3, 0.9, 0.82]]), 0.32);
        palla([[0, 0.83, 0.51, 0], [0.3, 0.89, 0.83, 0], [0.33, 0.9, 0.845, 0.2], [0.43, 0.7, 0.86, 2.5], [0.5, 0.52, 0.875, 0.8]]);
        att("A", null, [[0, 0.4, 0.62], [0.5, 0.48, 0.82]]);
        tira = att("D", et.fallo, [[0, 0.58, 0.8], [0.5, 0.525, 0.87]], [[0.46, {}], [0.5, { cade: 0.5 }], [0.6, { cade: 0.6 }], [0.76, {}], [0.82, { braccia: 0.5 }]]);
      }
      var pb = sc.palla[sc.palla.length - 1];
      sc.palla.push([0.58, 0.5 - (pb[1] - 0.5) * 0.2 - 0.045 * L, NET, 0.6]); sc.palla.push([1, 0.5 - 0.045 * L, NET, 0]);
      muovi(por, 0.48, 0.5, 0.935); muovi(por, 0.56, 0.54, 0.935); posa(por, 0.5, {}); posa(por, 0.56, { tuffo: 1, salto: 0.3, braccia: 1 }); posa(por, 0.66, { tuffo: 1 });
      sc.rete = 0.58; scritta(0.58, "AUTOGOL", "#ffe066"); sc.dunque = 0.58; sc.gol = true;
    } else if (tipo === "amm" || tipo === "esp") {   // il fallo e il cartellino (giallo o rosso) alzato dall'arbitro
      var col = tipo === "esp" ? "#e03131" : "#ffd43b", come = op.come || "entrata";
      if (come === "simula") {   // si butta in area senza che nessuno lo tocchi: giallo a lui
        tira = att("A", et.fallo, [[0, 0.42, 0.56], [0.45, 0.5, 0.8], [0.6, 0.53, 0.84]], [[0.5, {}], [0.56, { cade: 1, salto: 0.25 }], [0.66, { cade: 1 }], [0.86, {}]]);
        palla([[0, 0.43, 0.565, 0], [0.45, 0.51, 0.805, 0], [0.62, 0.56, 0.86, 0], [1, 0.58, 0.88, 0]]);
        att("D", null, [[0, 0.6, 0.86], [0.5, 0.55, 0.82]]);
        att("arb", null, [[0, 0.3, 0.6], [0.6, 0.66, 0.84]], [[0.6, {}], [0.62, { carta: col }], [0.68, { braccia: 1, carta: col }]]);
      } else if (come === "proteste") {   // va a protestare dall'arbitro con le braccia alzate
        att("D", null, [[0, 0.5, 0.55], [0.4, 0.5, 0.6]], [[0.3, {}], [0.36, { cade: 1 }], [0.6, { cade: 1 }], [0.75, {}]]);
        palla([[0, 0.48, 0.52, 0], [0.38, 0.5, 0.6, 0], [1, 0.52, 0.62, 0]]);
        att("arb", null, [[0, 0.4, 0.48], [0.4, 0.36, 0.57]], [[0.72, {}], [0.74, { carta: col }], [0.8, { braccia: 1, carta: col }]]);
        tira = att("A", et.fallo, [[0, 0.62, 0.66], [0.5, 0.48, 0.58], [0.7, 0.46, 0.57]], [[0.4, {}], [0.45, { braccia: 1 }], [0.55, {}], [0.6, { braccia: 1 }], [0.7, {}]]);
      } else {   // l'entrata: in scivolata (o il fallo tattico, o l'ultimo uomo lanciato verso la porta)
        var hy0 = come === "ultimo" ? 0.78 : 0.45, hy1 = come === "ultimo" ? 0.72 : 0.55;
        var tat = come === "tattico";
        att("D", null, [[0, 0.3, hy0 - 0.1], [0.5, 0.48, hy1]], [[0.54, {}], [0.6, { cade: 1, salto: 0.2 }], [0.72, { cade: 1 }], [0.88, {}]]);
        palla(tat ? [[0, 0.31, hy0 - 0.09, 0], [0.5, 0.49, hy1 + 0.005, 0], [0.62, 0.56, hy1 + 0.06, 0], [1, 0.6, hy1 + 0.08, 0]] : [[0, 0.31, hy0 - 0.09, 0], [0.5, 0.49, hy1 + 0.005, 0], [0.6, 0.41, hy1 + 0.07, 0], [1, 0.37, hy1 + 0.09, 0]]);
        tira = att("A", et.fallo, tat ? [[0, 0.66, hy1 + 0.06], [0.5, 0.51, hy1 + 0.01]] : [[0, 0.66, hy1 + 0.06], [0.44, 0.535, hy1 + 0.02], [0.66, 0.44, hy1 - 0.01]],
          tat ? [[0.46, {}], [0.52, { braccia: 1 }], [0.62, {}]] : [[0.43, {}], [0.49, { cade: 0.8 }], [0.74, { cade: 0.8 }], [0.82, {}]]);   // (in scivolata: i piedi avanti, scivola ancora un po' dopo il contatto)
        att("arb", null, [[0, 0.75, hy1 - 0.25], [0.6, 0.62, hy1 + 0.01]], [[0.6, {}], [0.62, { carta: col }], [0.68, { braccia: 1, carta: col }]]);
      }
      sc.dunque = come === "proteste" ? 0.82 : 0.7; sc.fischi = [come === "proteste" ? 0.45 : 0.55];   // (niente scritta grande: si vede il cartellino in mano all'arbitro; il fischio al fallo)
    } else if (tipo === "rec") {   // l'entrata dura… pulita: prende solo il pallone, l'avversario salta e resta in piedi, niente cartellino
      var ry0 = 0.45, ry1 = 0.55;
      att("D", null, [[0, 0.3, ry0 - 0.1], [0.5, 0.48, ry1], [0.66, 0.53, ry1 + 0.05]], [[0.47, {}], [0.52, { salto: 0.45 }], [0.6, { cade: 0.2 }], [0.7, {}]]);
      palla([[0, 0.31, ry0 - 0.09, 0], [0.49, 0.48, ry1 + 0.005, 0], [0.62, 0.42, ry1 + 0.04, 0], [0.8, 0.37, ry1 + 0.02, 0], [1, 0.35, ry1, 0]]);
      tira = att("A", et.fallo, [[0, 0.66, ry1 + 0.06], [0.44, 0.535, ry1 + 0.02], [0.66, 0.44, ry1 - 0.01], [0.86, 0.4, ry1]], [[0.43, {}], [0.49, { cade: 0.8 }], [0.68, { cade: 0.8 }], [0.78, {}]]);
      att("arb", null, [[0, 0.75, ry1 - 0.25], [0.6, 0.64, ry1 - 0.02]], [[0.62, {}], [0.68, { braccia: 0.5 }], [0.82, {}]]);   // (l'arbitro allarga le braccia: si gioca)
      sc.dunque = 0.62;
    } else {   // porta inviolata: il portiere esce alto su un cross e la blocca
      palla([[0, 0.85, 0.8, 0], [0.2, 0.87, 0.84, 0], [0.24, 0.87, 0.845, 0.2], [0.42, 0.56, 0.9, 3.6], [0.5, 0.52, 0.915, 2.2], [1, 0.52, 0.915, 1.3]]);
      calcia(att("A", null, [[0, 0.84, 0.76], [0.2, 0.86, 0.83]]), 0.23); att("A", null, [[0, 0.42, 0.74], [0.48, 0.5, 0.86]], [[0.44, {}], [0.5, { salto: 0.4 }], [0.58, {}]]);
      muovi(por, 0.38, 0.5, 0.935); muovi(por, 0.5, 0.52, 0.915); posa(por, 0.42, {}); posa(por, 0.5, { salto: 0.6, braccia: 1 }); posa(por, 0.62, { braccia: 1 });
      sc.dunque = 0.5;
    }
    function inOrdine(a, b) { return a[0] - b[0]; }
    sc.attori.forEach(function (a) { a.pts.sort(inOrdine); a.pose.sort(inOrdine); }); sc.palla.sort(inOrdine);   // (in ordine di tempo: qualche punto si aggiunge dopo)
    var pl = sc.palla, nn = pl.length, ua = pl[nn - 2], ub = pl[nn - 1];
    if (nn > 1 && ub[0] - ua[0] > 0.22 && ub[3] === 0) {   // (l'ultimo tratto: il pallone arriva in 0,19 e, se cade da più di mezzo metro, fa un rimbalzino)
      var pt = function (f, t, z) { return [ua[0] + t, ua[1] + (ub[1] - ua[1]) * f, ua[2] + (ub[2] - ua[2]) * f, z]; };
      pl.splice.apply(pl, [nn - 1, 0].concat(ua[3] > 0.5 ? [pt(0.6, 0.09, 0), pt(0.85, 0.14, ua[3] * 0.22), pt(1, 0.19, 0)] : [pt(1, 0.19, 0)]));
    }
    sc.parti = tipo === "rig" ? 0.14 : (v === "angolo" || v === "olimpico" || v === "portiere") ? 0.12 : v === "punizione" ? 0.1 : 0;   // (rigori e piazzati: si parte già pronti a battere)
    return sc;
  }
  // 🎬 il campo delle azioni (canvas): il campo intero, 11 contro 11 omini in piedi coi colori veri delle squadre (le righe di Inter,
  // Milan, Juve…), il pallone con la sua ombra (più è alto, più l'ombra si stacca), la telecamera che segue l'azione (e si avvicina
  // nelle rarità, col rallentatore). I vostri calciatori hanno come testa la faccina di chi li ha comprati e il nome su un'etichetta
  // del suo colore, con la punta sulla testa. Si ridisegna a ogni fotogramma solo mentre c'è un'azione
  var BASE_ATT = [[.05, .5], [.3, .18], [.32, .4], [.32, .6], [.3, .82], [.55, .25], [.52, .5], [.55, .75], [.72, .3], [.74, .5], [.72, .7]];   // chi attacca (a destra), il portiere per primo
  var BASE_DIF = [[.965, .5], [.86, .2], [.84, .4], [.84, .6], [.86, .8], [.72, .25], [.7, .5], [.72, .75], [.58, .32], [.56, .5], [.58, .68]];   // chi difende la porta di destra
  var BASE_RIG_ATT = [[.05, .5], [.4, .3], [.4, .7], [.79, .22], [.8, .34], [.81, .66], [.79, .78], [.76, .44], [.76, .56], [.66, .4], [.66, .6]];   // sul rigore: tutti fuori dall'area
  var BASE_RIG_DIF = [[.965, .5], [.8, .26], [.81, .4], [.81, .6], [.8, .74], [.77, .3], [.77, .7], [.75, .5], [.68, .3], [.68, .7], [.55, .5]];
  var RIGHE_SQ = { Inter: 1, Milan: 1, Juventus: 1, Atalanta: 1, Udinese: 1, Bologna: 1, Sassuolo: 1, Lecce: 1 };
  var PANT_SQ = { Milan: "#f4f4f4", Juventus: "#f4f4f4", Udinese: "#f4f4f4", Napoli: "#f4f4f4", Lazio: "#f4f4f4", Roma: "#f4f4f4", Bologna: "#f4f4f4", Monza: "#f4f4f4", Torino: "#f4f4f4", Fiorentina: "#f4f4f4", Como: "#f4f4f4",
    Inter: "#111111", Atalanta: "#111111", Sassuolo: "#111111", Venezia: "#111111", Parma: "#1a1a1a", Lecce: "#1b2f5c", Cagliari: "#0b2559", Genoa: "#0a2240", Frosinone: "#0b46a6" };
  var MAGLIE_POR = ["#f5c518", "#2fb344", "#ff8c1a", "#8e44ad", "#00b8d9", "#e64980"];
  var ARBITRO = { a: "#1b1b1b", b: "#1b1b1b", righe: false, pant: "#1b1b1b", calz: "#1b1b1b" };
  var CAPELLI = ["#3b2a1e", "#1b1b1b", "#c9a15a", "#6b3e1f", "#2b2b2b", "#8a5a2b"], PELLI = ["#e7b58c", "#c68a5e", "#8d5a3b", "#f1c9a5", "#d9a37b"];
  function kitDi(sq, bianco) {   // la maglia di una squadra (bianco: in trasferta, quando i colori si confondono)
    var c = coloriSquadra(sq) || ["#2b3550", "#9aa5bd"];
    if (bianco) return { a: "#f4f4f4", b: c[0], righe: false, pant: c[0], calz: "#f4f4f4" };
    return { a: c[0], b: c[1], righe: !!RIGHE_SQ[sq], pant: PANT_SQ[sq] || c[1], calz: c[0] };
  }
  function kitPortiere(k1, k2, tranne) {   // il portiere: un colore che non si confonde con nessuna delle due squadre
    for (var i = 0; i < MAGLIE_POR.length; i++) { var c = MAGLIE_POR[i]; if (c !== tranne && !coloriVicini(c, k1.a) && !coloriVicini(c, k2.a)) return { a: c, b: c, righe: false, pant: "#1b1b1b", calz: c }; }
    return { a: "#f5c518", b: "#f5c518", righe: false, pant: "#1b1b1b", calz: "#f5c518" };
  }
  function scuro(c, f) { var n = parseInt(String(c).slice(1), 16) || 0; return "rgb(" + Math.round((n >> 16) * f) + "," + Math.round((n >> 8 & 255) * f) + "," + Math.round((n & 255) * f) + ")"; }
  function liscio(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function campoAzioni(el, box) {
    var cv = el("canvas", { class: "st-az" }), ctx = cv.getContext("2d"), A = { raf: 0, sc: null };
    box.appendChild(cv);
    A.misura = function () {
      var w = box.clientWidth, h = box.clientHeight, d = Math.min(2, window.devicePixelRatio || 1); if (!w || !h) return;
      cv.width = Math.round(w * d); cv.height = Math.round(h * d); A.w = w; A.h = h; A.d = d; A.vert = h > w * 1.05;   // (schermo alto: il campo in verticale)
      A.m = (A.vert ? h * 0.92 : w) * 0.94 / 105;   // (quanti pixel fa un metro, lungo il campo)
      A.u = Math.max(4.6, Math.min(w, h) * 0.019);   // (la misura degli omini)
      var q = d * 1.8, vero = ctx; A.fondo = document.createElement("canvas"); A.fondo.width = Math.round(w * q); A.fondo.height = Math.round(h * q);
      ctx = A.fondo.getContext("2d"); ctx.setTransform(q, 0, 0, q, 0, 0); campo(); ctx = vero;   // (il campo si disegna una volta sola)
      disegna(A.sc || null, 0);
    };
    // dal campo intero (X lungo il campo, Y di traverso, 0-1) ai pixel; in verticale con un po' di margine sopra e sotto per le porte
    function base(X, Y) { return A.vert ? [(1 - Y) * A.w, (0.04 + X * 0.92) * A.h] : [X * A.w, Y * A.h]; }
    function pieno(sc, hx, hy) { var X = 0.5 + hy * 0.496, Y = 0.08 + hx * 0.84; return [sc.verso < 0 ? 1 - X : X, Y]; }
    function P(sc, hx, hy) { var f = pieno(sc, hx, hy); return base(f[0], f[1]); }
    A.lontano = function (sc) { return A.vert ? (sc.verso > 0 ? 18 : 82) : 24; };   // dove vanno le scritte: nella metà campo lontana dall'azione (in %)
    function lungo(pts, p, palla) {   // dove si trova lungo la strada al tempo p: si parte e si arriva piano solo dove ci si ferma, i punti in mezzo si passano di corsa
      if (!pts || !pts.length) return null;
      if (p <= pts[0][0]) return pts[0];
      var n = pts.length;
      function vel(q, r) { var dt = r[0] - q[0]; return dt > 1e-4 ? Math.sqrt(Math.pow(r[1] - q[1], 2) + Math.pow(r[2] - q[2], 2)) / dt : 0; }
      for (var i = 1; i < n; i++) if (p <= pts[i][0]) {
        var a = pts[i - 1], b = pts[i], h = Math.max(1e-6, b[0] - a[0]), x = (p - a[0]) / h, o = [p], k, x2 = x * x, x3 = x2 * x;
        var calcio = palla && vel(a, b) > 1.1;   // (il pallone calciato: parte forte e rallenta un po')
        var prima = i > 1 && a[0] - pts[i - 2][0] > 1e-4 && !(palla && vel(pts[i - 2], a) > 1.1), dopo = i < n - 1 && pts[i + 1][0] - b[0] > 1e-4 && !(palla && vel(b, pts[i + 1]) > 1.1);
        for (k = 1; k < a.length; k++) {
          if (b[k] === a[k]) { o.push(a[k]); continue; }   // (fermo: esatto)
          var d = (b[k] - a[k]) / h, v, m0 = 0, m1 = 0, dp, dn;
          if (palla && k === 3) v = a[3] + (b[3] - a[3]) * (b[3] > a[3] ? 1 - (1 - x) * (1 - x) : x * x);   // (l'altezza: sale piano, scende sempre più svelto)
          else if (calcio) v = a[k] + (b[k] - a[k]) * x * (1.25 - 0.25 * x);
          else {
            if (prima) { dp = (a[k] - pts[i - 2][k]) / (a[0] - pts[i - 2][0]); if (dp * d > 0) m0 = 2 * dp * d / (dp + d); }
            else if (palla && i > 1) m0 = d;   // (subito dopo un calcio il pallone rotola, non riparte da fermo)
            if (dopo) { dn = (pts[i + 1][k] - b[k]) / (pts[i + 1][0] - b[0]); if (dn * d > 0) m1 = 2 * dn * d / (dn + d); }
            else if (palla && i < n - 1) m1 = d;   // (e arriva sul piede di chi calcia senza fermarsi)
            v = (2 * x3 - 3 * x2 + 1) * a[k] + (x3 - 2 * x2 + x) * h * m0 + (3 * x2 - 2 * x3) * b[k] + (x3 - x2) * h * m1;
          }
          o.push(v);
        }
        return o;
      }
      return pts[n - 1];
    }
    function strada(sc, a, p) {   // quanta strada ha fatto (pixel del campo) fino al tempo p: le gambe vanno a tempo coi metri, mai a vuoto
      var K = A.w + "x" + A.h + "x" + sc.verso, j;
      if (a._sk !== K) {
        a._sk = K; a._sd = [0];
        var q = lungo(a.pts, 0), pr = P(sc, q[1], q[2]), tot = 0;
        for (j = 1; j <= 120; j++) { q = lungo(a.pts, j / 120); var s2 = P(sc, q[1], q[2]); tot += Math.sqrt(Math.pow(s2[0] - pr[0], 2) + Math.pow(s2[1] - pr[1], 2)); pr = s2; a._sd.push(tot); }
      }
      var f = Math.max(0, Math.min(1, p)) * 120; j = Math.floor(f);
      return j >= 120 ? a._sd[120] : a._sd[j] + (a._sd[j + 1] - a._sd[j]) * (f - j);
    }
    function guarda(sc, a, t) {   // da che parte guarda al tempo t: dove corre (se corre di lato), se no verso il pallone
      var q = lungo(a.pts, t), q2 = lungo(a.pts, Math.min(1, t + 0.015)), s1 = P(sc, q[1], q[2]), s2 = P(sc, q2[1], q2[2]), dx = s2[0] - s1[0], dy = s2[1] - s1[1];
      if (Math.abs(dx) > 0.3 + Math.abs(dy) * 0.4) return dx > 0 ? 1 : -1;
      var b = lungo(sc.palla, t, true) || [t, 0.5, 0.5, 0], g = P(sc, b[1], b[2]);
      if (Math.abs(g[0] - s1[0]) < 0.5) { b = lungo(sc.palla, Math.min(1, t + 0.04), true) || b; g = P(sc, b[1], b[2]); if (Math.abs(g[0] - s1[0]) < 0.5) return 1; }   // (il pallone proprio sopra o sotto: guarda dove sta andando)
      return g[0] >= s1[0] ? 1 : -1;
    }
    function folla(sc, p) {   // la strada fatta dagli altri fino a p (pixel): seguono il pallone di 0,14 per lungo e 0,12 di traverso
      var K = A.w + "x" + A.h + "x" + sc.verso, j;
      if (sc._fk !== K) {
        sc._fk = K; sc._fd = [0];
        var q = lungo(sc.palla, 0, true) || [0, 0.5, 0.5, 0], f0 = pieno(sc, q[1], q[2]), tot = 0;
        for (j = 1; j <= 120; j++) {
          q = lungo(sc.palla, j / 120, true) || q; var f1 = pieno(sc, q[1], q[2]), a0 = base(f0[0] * 0.14, f0[1] * 0.12), a1 = base(f1[0] * 0.14, f1[1] * 0.12);
          tot += Math.sqrt(Math.pow(a1[0] - a0[0], 2) + Math.pow(a1[1] - a0[1], 2)); f0 = f1; sc._fd.push(tot);
        }
      }
      var f = Math.max(0, Math.min(1, p)) * 120; j = Math.floor(f);
      return j >= 120 ? sc._fd[120] : sc._fd[j] + (sc._fd[j + 1] - sc._fd[j]) * (f - j);
    }
    function staccato(a, po, p) {   // in aria (salto o capriola) non si rigira: guarda dove guardava quando si è staccato da terra
      if (!(po.salto > 0.05 || po.capriola > 0.05)) return p;
      for (var j = a.pose.length - 1; j >= 0; j--) { var w = a.pose[j]; if (w[0] <= p && !((w[1].salto || 0) > 0.05 || (w[1].capriola || 0) > 0.05)) return w[0]; }
      return 0;
    }
    function posa(l, p) {   // la posa al tempo p: i numeri passano piano dall'una all'altra (anche le braccia), il cartellino a scatto
      var o = { salto: 0, tuffo: 0, cade: 0, capriola: 0, braccia: 0, calcio: 0, inclina: 0, carta: null }; if (!l || !l.length || p < l[0][0]) return o;
      var a = l[0], b = null, i;
      for (i = 0; i < l.length; i++) { if (l[i][0] <= p) a = l[i]; else { b = l[i]; break; } }
      var u = b ? liscio((p - a[0]) / Math.max(1e-6, b[0] - a[0])) : 0;
      ["salto", "tuffo", "cade", "capriola", "braccia", "calcio", "inclina"].forEach(function (k) { var x = a[1][k] || 0, y = b ? (b[1][k] || 0) : x; o[k] = x + (y - x) * u; });
      o.carta = a[1].carta || null;
      return o;
    }
    // ---- il campo: l'erba a strisce, le linee, le aree, le porte con la rete (disegnato nei pixel del campo intero)
    function poli(l, chiudi) { ctx.beginPath(); l.forEach(function (p, i) { var s = base(p[0], p[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); if (chiudi) ctx.closePath(); }
    function arco(cx, cy, rx, ry, a0, a1) { var l = []; for (var i = 0; i <= 28; i++) { var a = a0 + (a1 - a0) * i / 28; l.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } poli(l, false); ctx.stroke(); }
    function campo() {
      ctx.fillStyle = "#2f7a37"; ctx.fillRect(-A.w, -A.h, A.w * 3, A.h * 3);
      ctx.fillStyle = "#36873f"; for (var i = 1; i < 18; i += 2) { poli([[0.03 + 0.94 * i / 18, -0.2], [0.03 + 0.94 * (i + 1) / 18, -0.2], [0.03 + 0.94 * (i + 1) / 18, 1.2], [0.03 + 0.94 * i / 18, 1.2]], true); ctx.fill(); }
      var mx = 0.94 / 105, my = 0.88 / 68, lw = Math.max(1, A.u * 0.17);
      ctx.strokeStyle = "rgba(246,250,242,.9)"; ctx.lineWidth = lw;
      poli([[0.03, 0.06], [0.97, 0.06], [0.97, 0.94], [0.03, 0.94]], true); ctx.stroke();
      poli([[0.5, 0.06], [0.5, 0.94]]); ctx.stroke();
      arco(0.5, 0.5, 9.15 * mx, 9.15 * my, 0, Math.PI * 2);
      var pt = function (X, Y) { var s = base(X, Y); ctx.beginPath(); ctx.arc(s[0], s[1], lw * 1.3, 0, Math.PI * 2); ctx.fillStyle = "rgba(246,250,242,.95)"; ctx.fill(); };
      pt(0.5, 0.5);
      [[0.03, 1], [0.97, -1]].forEach(function (q) {
        var x = q[0], s = q[1], ap = Math.acos(5.5 / 9.15);
        poli([[x, 0.5 - 20.16 * my], [x + s * 16.5 * mx, 0.5 - 20.16 * my], [x + s * 16.5 * mx, 0.5 + 20.16 * my], [x, 0.5 + 20.16 * my]]); ctx.stroke();
        poli([[x, 0.5 - 9.16 * my], [x + s * 5.5 * mx, 0.5 - 9.16 * my], [x + s * 5.5 * mx, 0.5 + 9.16 * my], [x, 0.5 + 9.16 * my]]); ctx.stroke();
        arco(x + s * 11 * mx, 0.5, 9.15 * mx, 9.15 * my, s > 0 ? -ap : Math.PI - ap, s > 0 ? ap : Math.PI + ap);   // (la lunetta, fuori dall'area)
        pt(x + s * 11 * mx, 0.5);
        var gx = x - s * 3.2 * mx, y0 = 0.5 - 5.5 * my, y1 = 0.5 + 5.5 * my, k;   // la porta, con la rete (più grande del vero, come gli omini)
        poli([[x, y0], [gx, y0], [gx, y1], [x, y1]], true); ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fill();
        ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = lw * 0.4;
        for (k = 1; k < 12; k++) { poli([[x, y0 + (y1 - y0) * k / 12], [gx, y0 + (y1 - y0) * k / 12]]); ctx.stroke(); }
        for (k = 1; k < 3; k++) { poli([[x + (gx - x) * k / 3, y0], [x + (gx - x) * k / 3, y1]]); ctx.stroke(); }
        ctx.restore(); ctx.lineWidth = lw * 1.5; ctx.strokeStyle = "#ffffff"; poli([[x, y0], [gx, y0], [gx, y1], [x, y1]]); ctx.stroke(); ctx.lineWidth = lw; ctx.strokeStyle = "rgba(246,250,242,.9)";
      });
    }
    // ---- la telecamera: segue il pallone (un po' di media, così non trema) tenendo d'occhio la porta; nelle rarità si avvicina
    function camera(sc, p) {
      if (!sc) return { cx: A.w / 2, cy: A.h / 2, z: 1 };
      var z = (A.vert ? 1.6 : 1.35) + (sc.zoomFine || 0) * liscio((p - (sc.tz || 0.55)) / Math.max(0.05, 1 - (sc.tz || 0.55)) * 1.6) + (sc.replay ? 0.25 : 0);
      var bx = 0, by = 0, k, q, s;
      for (k = 0; k < 5; k++) { q = lungo(sc.palla, Math.max(0, p - k * 0.025), true) || [0, 0.5, 0.5, 0]; s = P(sc, q[1], q[2]); bx += s[0]; by += s[1]; }
      var g = P(sc, 0.5, 0.88), cx = bx / 5 * 0.72 + g[0] * 0.28, cy = by / 5 * 0.72 + g[1] * 0.28, hw = A.w / (2 * z), hh = A.h / (2 * z);
      if (sc.fest && sc.rete != null && p > sc.rete) { var qf = lungo(sc.fest.pts, p), sf = P(sc, qf[1], qf[2]), wf = liscio((p - sc.rete - 0.04) / 0.2) * 0.75; cx += (sf[0] - cx) * wf; cy += (sf[1] - cy) * wf; }   // (dopo il gol: su chi esulta)
      return { cx: Math.max(hw, Math.min(A.w - hw, cx)), cy: Math.max(hh, Math.min(A.h - hh, cy)), z: z };
    }
    // ---- un omino in piedi: x, y = i piedi (pixel del campo); u = la misura; dir 1 guarda a destra, -1 a sinistra
    // o: { sw, sv: il passo (apertura delle gambe e quale va avanti), vr: quanto corre su e giù per lo schermo, salto (0-1), ruota (giro del corpo), giu (0 in piedi,
    //      1 disteso: le anche vanno a terra), calcio (-1 la gamba indietro, 1 il colpo), braccia (0-1), carta (il colore del cartellino), testa: niente se è vostro (la faccina la mette chi chiama) }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function omino(x, y, u, dir, kit, o) {
      var h = o.salto || 0, lift = h * u * 2.4, sw = o.sw || 0, sv = o.sv || 0, kk = 1 + h * 0.25, gi = o.giu || 0, rt = o.ruota || 0, vr = o.vr || 0;
      var anca = 1.15 * u * (1 - 0.68 * gi * (1 - Math.min(1, h * 3))), hh = Math.max(0, h - 0.05);   // (disteso a terra le anche scendono; in aria le gambe si raccolgono)
      ctx.fillStyle = "rgba(0,0,0," + (0.3 - h * 0.12).toFixed(2) + ")"; ctx.beginPath(); ctx.ellipse(x + Math.sin(rt) * 0.65 * u * gi, y, u * (0.72 - h * 0.15 + gi), u * (0.22 + 0.08 * gi), 0, 0, Math.PI * 2); ctx.fill();   // l'ombra resta a terra (lunga quanto lui, se è disteso)
      ctx.save(); ctx.translate(x, y - lift - anca); ctx.rotate(rt); ctx.scale(dir * kk, kk); ctx.translate(0, 1.15 * u);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      sw *= 1 - Math.min(1, hh * 1.3) * 0.7;
      var pr = o.pronto || 0; if (pr) sw = sw * (1 - pr) - 0.2 * pr;   // (il portiere che aspetta: gambe larghe)
      [[1, scuro(kit.calz, 0.75)], [-1, kit.calz]].forEach(function (g) {   // le gambe: coscia, calzettone, scarpa (il piede che va avanti si alza; la destra calcia)
        var a = g[0], kc = a < 0 ? (o.calcio || 0) : 0, lv = Math.max(0, -a * sv);
        var fx = a * 0.12 * u - a * sw * u * (1 - 0.55 * vr) + kc * 0.55 * u, fy = -u * 0.06 - lv * u * (0.25 + 0.15 * vr) - Math.abs(kc) * u * 0.22 - hh * u * 0.5;
        var mx = (a * 0.14 * u + fx) / 2 + lv * u * 0.22 + hh * u * 0.2, my = (fy - u * 0.9) / 2 - u * 0.07;
        ctx.strokeStyle = "#e3ad85"; ctx.lineWidth = u * 0.22; ctx.beginPath(); ctx.moveTo(a * 0.14 * u, -u * 0.9); ctx.lineTo(mx, my); ctx.stroke();
        ctx.strokeStyle = g[1]; ctx.lineWidth = u * 0.24; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = "#141414"; ctx.beginPath(); ctx.ellipse(fx + u * 0.08, fy + u * 0.02, u * 0.17, u * 0.09, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = kit.pant; rr(-u * 0.33, -u * 1.12, u * 0.66, u * 0.34, u * 0.09); ctx.fill();   // i pantaloncini
      var braccio = function (a, pelle) {
        var kb = o.braccia || 0, fa = o.testa ? 1 : 0; if (o.carta && a > 0) kb = 0;   // (l'arbitro alza solo la mano col cartellino)
        var hx = a * u * (o.carta ? 0.3 - 0.15 * kb : 0.3 + (fa ? 0.8 : 0.25) * kb), hy = -u * (1.22 + (o.carta ? 1.58 : fa ? 1.35 : 0.9) * kb);
        if (gi) { hx += (a * u * (0.3 - 0.1 * kb) - hx) * gi; hy += (-u * (1.22 + (fa ? 1.55 : 1.5) * kb) - hy) * gi; }
        hx += (1 - kb) * a * sw * u * 0.7;
        if (pr) { hx += (a * 0.62 * u - hx) * pr * (1 - kb); hy += (-u * 1.5 - hy) * pr * (1 - kb); }   // (le mani avanti, aperte)
        var ex = a * 0.33 * u + (hx - a * 0.33 * u) * 0.35, ey = -u * 1.72 + (hy + u * 1.72) * 0.35;
        ctx.strokeStyle = a > 0 ? scuro(kit.a, 0.8) : kit.a; ctx.lineWidth = u * 0.2; ctx.beginPath(); ctx.moveTo(a * 0.3 * u, -u * 1.72); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = pelle; ctx.lineWidth = u * 0.17; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
        if (o.guanti) { ctx.fillStyle = "#f4f4f4"; ctx.beginPath(); ctx.arc(hx, hy, u * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = u * 0.04; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.stroke(); }
        if (o.carta && a < 0) { ctx.fillStyle = o.carta; ctx.fillRect(hx - u * 0.3, hy - u * 0.95, u * 0.6, u * 0.85); ctx.lineWidth = u * 0.06; ctx.strokeStyle = "#1b1b1b"; ctx.strokeRect(hx - u * 0.3, hy - u * 0.95, u * 0.6, u * 0.85); }
      };
      braccio(1, scuro(o.pelle || "#e7b58c", 0.88));
      ctx.save(); rr(-u * 0.38, -u * 1.86, u * 0.76, u * 0.8, u * 0.2); ctx.fillStyle = kit.a; ctx.fill(); ctx.clip();   // la maglia (a righe se serve)
      if (kit.righe) { ctx.fillStyle = kit.b; ctx.fillRect(-u * 0.24, -u * 2, u * 0.16, u); ctx.fillRect(u * 0.08, -u * 2, u * 0.16, u); }
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(-u * 0.38, -u * 1.86, u * 0.76, u * 0.16);
      ctx.restore(); rr(-u * 0.38, -u * 1.86, u * 0.76, u * 0.8, u * 0.2); ctx.lineWidth = u * 0.05; ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.stroke();
      braccio(-1, o.pelle || "#e7b58c");
      if (!o.testa) {   // la testa normale: pelle e capelli
        ctx.fillStyle = o.pelle || "#e7b58c"; ctx.beginPath(); ctx.arc(0, -u * 2.2, u * 0.33, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = o.capelli || "#3b2a1e"; ctx.beginPath(); ctx.arc(0, -u * 2.24, u * 0.34, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(-u * 0.22, -u * 2.26, u * 0.12, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function testaDi(x, y, u, o, faccia) {   // dove sta la testa (pixel del campo) e il punto più alto dell'omino (per il nome)
      var h = o.salto || 0, k = 1 + h * 0.25, t = o.ruota || 0, gi = o.giu || 0, px = x, py = y - h * u * 2.4 - 1.15 * u * (1 - 0.68 * gi * (1 - Math.min(1, h * 3))), d = (faccia ? 1.3 + 0.2 * gi : 1.05) * k;
      var rot = function (lx, ly) { return [px + lx * Math.cos(t) - ly * Math.sin(t), py + lx * Math.sin(t) + ly * Math.cos(t)]; };
      var testa = rot(0, -d * u), alto = [testa[0], testa[1] - u * (faccia ? 0.94 * k : 0.4)];
      [rot(0.2 * u * k, 1.12 * u * k), rot(-0.2 * u * k, 1.12 * u * k)].forEach(function (q) { if (q[1] < alto[1]) alto = q; });
      return { testa: testa, alto: alto, r: u * 0.8 * k * (1 - 0.22 * gi) };   // (disteso, la faccina un po' più piccola e più in là: si vedono maglia e braccia)
    }
    function faccia(img, x, y, r, pc) {   // la faccina di chi l'ha comprato, al posto della testa, sempre dritta, con l'alone del suo colore
      ctx.beginPath(); ctx.arc(x, y, r * 1.17, 0, Math.PI * 2); ctx.fillStyle = pc || "#ffe066"; ctx.fill();
      if (!img || !(img.tagName === "CANVAS" || (img.complete && img.naturalWidth))) return;
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.clip(); ctx.drawImage(img, x - r, y - r * 1.02, r * 2, r * 2); ctx.restore();
    }
    function etichetta(testo, x, ybasso, col, fs) {   // l'etichetta col nome (pixel dello schermo): centrata in x, il bordo di sotto a ybasso, la punta verso la testa
      ctx.font = "900 " + fs + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var w = ctx.measureText(testo).width + fs * 0.9, h = fs * 1.45, k = h / 2, y = ybasso - k, punta = x;
      x = Math.max(w / 2 + 2, Math.min(A.w - w / 2 - 2, x)); y = Math.max(k + 2, y);
      ctx.beginPath(); ctx.moveTo(x - w / 2 + k, y - k); ctx.lineTo(x + w / 2 - k, y - k); ctx.arc(x + w / 2 - k, y, k, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x - w / 2 + k, y + k); ctx.arc(x - w / 2 + k, y, k, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.stroke();
      var pp = Math.max(x - w / 2 + k, Math.min(x + w / 2 - k, punta)); ctx.beginPath(); ctx.moveTo(pp - 4, y + k - 0.5); ctx.lineTo(pp + 4, y + k - 0.5); ctx.lineTo(pp, y + k + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#14171f"; ctx.fillText(testo, x, y + 0.5); ctx.textBaseline = "alphabetic";
    }
    function scritta(testo, x, y, fs, col) {
      ctx.font = "900 " + fs + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = Math.max(3, fs * 0.18); ctx.strokeStyle = "rgba(0,0,0,.85)";
      ctx.strokeText(testo, x, y); ctx.fillStyle = col; ctx.fillText(testo, x, y);
    }
    function kitDiSq(sc, sq) { return sq === "A" ? sc.kA : sq === "D" ? sc.kD : sq === "pA" ? sc.pA : sq === "pD" ? sc.pD : ARBITRO; }
    // gli altri 22 meno chi c'entra: la formazione delle due squadre (si tolgono i posti più vicini a chi fa l'azione); i vostri che non
    // c'entrano vanno al posto del loro ruolo (0 portiere, 1-4 difesa, 5-7 centrocampo, 8-10 attacco). Se i posti del suo ruolo li ha
    // presi chi fa l'azione, un attaccante va in un posto libero più avanti o a centrocampo, MAI in difesa (22 ott, il proprietario:
    // «il mio Thuram sta proprio in difesa mentre l'Inter attacca»)
    var ORDINE_POSTI = { P: [0], D: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], C: [5, 6, 7, 8, 9, 10, "su", 1, 2, 3, 4], A: [8, 9, 10, "su", 5, 6, 7] };
    function postoNuovo(occ, xs) {   // un posto nella zona xs (lungo il campo), il più lontano da tutti quelli che ci sono già
      var best = null, bd = -1;
      xs.forEach(function (x) { [0.18, 0.3, 0.42, 0.58, 0.7, 0.82].forEach(function (y) {
        var d = 9; occ.forEach(function (p) { d = Math.min(d, Math.pow(p[0] - x, 2) + Math.pow(p[1] - y, 2) * 0.5); });
        if (d > bd) { bd = d; best = { x: x, y: y }; }
      }); });
      return best;
    }
    function comparse(sc) {
      var rig = sc.tipo === "rig" || sc.v === "ribattuta", out = [];
      [["A", rig ? BASE_RIG_ATT : BASE_ATT], ["D", rig ? BASE_RIG_DIF : BASE_DIF]].forEach(function (q) {
        var posti = q[1].map(function (b, i) { return { x: b[0], y: b[1], gk: i === 0 }; });
        sc.attori.forEach(function (a) {
          if (a.sq === "p" + q[0]) { posti[0].via = true; return; }
          if (a.sq !== q[0]) return;
          var s = pieno({ verso: 1 }, a.pts[0][1], a.pts[0][2]), best = null, bd = 9;
          posti.forEach(function (o) { if (o.via) return; var dd = Math.pow(o.x - s[0], 2) + Math.pow(o.y - s[1], 2) * 0.5; if (o.gk) dd += 5; if (dd < bd) { bd = dd; best = o; } });
          if (best) best.via = true;
        });
        (sc.noti || []).forEach(function (nt) {
          if (nt.sq !== q[0]) return;
          var ord = ORDINE_POSTI[nt.ruolo] || [0], o = null, i;
          for (i = 0; i < ord.length && !o; i++) {
            if (ord[i] === "su") {   // (i posti del suo ruolo sono presi: uno nuovo più avanti, lontano da tutti)
              var occ = posti.filter(function (z) { return !z.via; }).map(function (z) { return [z.x, z.y]; });
              sc.attori.forEach(function (a) { [a.pts[0], a.pts[a.pts.length - 1]].forEach(function (pt) { occ.push(pieno({ verso: 1 }, pt[1], pt[2])); }); });
              var nu = postoNuovo(occ, q[0] === "A" ? [0.6, 0.64, 0.68] : [0.5, 0.54, 0.58]); if (nu) { posti.push(nu); o = nu; }
            } else if (posti[ord[i]] && !posti[ord[i]].via && !posti[ord[i]].nome) o = posti[ord[i]];
          }
          if (o) { o.nome = nt.nome; o.faccia = nt.faccia; o.pc = nt.pc; }
        });
        posti.forEach(function (o, i) { if (!o.via) out.push({ sq: i === 0 ? "p" + q[0] : q[0], x: o.x, y: o.y, k: i * 1.7 + (q[0] === "A" ? 0 : 0.9), nome: o.nome || "", faccia: o.faccia || null, pc: o.pc || null, n: i + (q[0] === "A" ? 0 : 11) }); });
      });
      return out;
    }
    function disegna(sc, p) {
      var w = A.w, h = A.h, d = A.d; if (!w) return;
      A.p = p;
      var cam = camera(sc, p), u = A.u;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.cx, -cam.cy);
      if (cam.z < 1.01) { ctx.fillStyle = "#2f7a37"; ctx.fillRect(0, 0, w, h); }
      if (A.fondo) ctx.drawImage(A.fondo, 0, 0, w, h);
      if (sc && sc.rete != null && p >= sc.rete) {   // la rete che si gonfia al gol
        var xr = sc.verso < 0 ? 0.03 : 0.97, gr = xr + (sc.verso < 0 ? -1 : 1) * 3.2 * 0.94 / 105, yr = 5.5 * 0.88 / 68;
        poli([[xr, 0.5 - yr], [gr, 0.5 - yr], [gr, 0.5 + yr], [xr, 0.5 + yr]], true); ctx.fillStyle = "rgba(255,255,255," + (0.55 * Math.max(0, 1 - (p - sc.rete) * 3)).toFixed(2) + ")"; ctx.fill();
        var tt = p - sc.rete;
        if (tt < 0.3) {   // (il fondo della rete si spinge dove entra il pallone e ondeggia due volte)
          var qb = lungo(sc.palla, sc.rete + 0.03, true) || [0, 0.5, 0.5, 0], yb = pieno(sc, qb[1], qb[2])[1], amp = 0.012 * Math.exp(-tt * 9) * Math.sin(tt * 55), dr = sc.verso < 0 ? -1 : 1;
          ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = Math.max(1, A.u * 0.07);
          for (var jr = 0; jr <= 12; jr++) { var yy = 0.5 - yr + 2 * yr * jr / 12; poli([[xr, yy], [gr + dr * amp * Math.exp(-Math.pow((yy - yb) / 0.035, 2)), yy]]); ctx.stroke(); }
        }
      }
      if (!sc) { ctx.restore(); return; }
      var pb = lungo(sc.palla, p, true) || [p, 0.5, 0.5, 0], gp = P(sc, pb[1], pb[2]), ff = pieno(sc, pb[1], pb[2]);
      // la direzione "+hx" sullo schermo: serve per far tuffare e cadere gli omini dalla parte giusta
      var e1 = P(sc, 0.6, 0.8), e0 = P(sc, 0.4, 0.8), ex = e1[0] - e0[0], ey = e1[1] - e0[1], el = Math.sqrt(ex * ex + ey * ey) || 1, tP = Math.atan2(ex / el, -ey / el), tM = Math.atan2(-ex / el, ey / el);
      if (!A.vert) { tP = Math.PI / 2; tM = -Math.PI / 2; }   // (campo orizzontale: chi si tuffa verso il basso si stende a destra, verso l'alto a sinistra)
      var figure = [];
      var fd = folla(sc, p), fv = Math.max(0, folla(sc, Math.min(1, p + 0.015)) - fd);   // (quanta strada fanno gli altri: tutti la stessa, seguono il pallone)
      (sc.folla || []).forEach(function (o, j) {   // gli altri: seguono un po' il pallone, a passi veri (fermi se il pallone è fermo)
        var bx = sc.verso < 0 ? 1 - o.x : o.x, X = bx + (ff[0] - bx) * 0.14, Y = o.y + (ff[1] - o.y) * 0.12;
        var s = base(X, Y), cr = Math.min(1, fv / (u * 0.25)), ph = (fd / (u * 2.4) + o.k) * Math.PI * 2, gk = o.sq === "pA" || o.sq === "pD";
        if (!o.dir || Math.abs(gp[0] - s[0]) > u * 0.8) o.dir = gp[0] >= s[0] ? 1 : -1;   // (si girano solo quando il pallone è passato davvero dall'altra parte)
        figure.push({ x: s[0], y: s[1], kit: kitDiSq(sc, o.sq), o: { sw: Math.sin(ph) * 0.45 * cr, sv: Math.cos(ph) * cr, guanti: gk, pronto: gk ? 1 - cr : 0, pelle: PELLI[o.n % PELLI.length], capelli: CAPELLI[(o.n * 7) % CAPELLI.length] }, dir: o.dir, chi: o.faccia ? o : null });
      });
      sc.attori.forEach(function (a, i) {
        var q = lungo(a.pts, p), q2 = lungo(a.pts, Math.min(1, p + 0.015)), s = P(sc, q[1], q[2]), s2 = P(sc, q2[1], q2[2]), dx = s2[0] - s[0], dy = s2[1] - s[1], vel = Math.sqrt(dx * dx + dy * dy);
        var po = posa(a.pose, p), dir = guarda(sc, a, staccato(a, po, p));
        var ruota = (po.tuffo >= 0 ? tP * po.tuffo : tM * -po.tuffo) + (po.cade >= 0 ? tP * po.cade : tM * -po.cade) - dir * po.capriola * Math.PI * 0.85, giu = Math.min(1, Math.abs(Math.sin(ruota)));   // (la capriola all'indietro, rispetto a dove guarda)
        var corre = Math.min(1, vel / (u * 0.25)) * (1 - Math.min(1, giu * 1.6)), ph = strada(sc, a, p) / (u * 2.4) * Math.PI * 2, lato = vel > 0.01 ? Math.abs(dx) / vel : 0, n = i + 30;   // (un passo ogni 1,2 omini di strada)
        figure.push({ x: s[0], y: s[1], kit: kitDiSq(sc, a.sq), dir: dir,
          o: { sw: Math.sin(ph) * 0.45 * corre, sv: Math.cos(ph) * corre, vr: vel > 0.01 ? Math.abs(dy) / vel : 0, salto: po.salto + corre * 0.03 * Math.abs(Math.sin(ph)), ruota: ruota + dir * (corre * 0.1 * lato + po.inclina * 0.28), giu: giu,
            calcio: po.calcio, braccia: Math.max(po.braccia, Math.min(0.6, giu)), carta: po.carta, guanti: a.sq === "pA" || a.sq === "pD",
            pronto: (a.sq === "pA" || a.sq === "pD") && giu < 0.05 && po.salto < 0.05 && po.braccia < 0.05 ? 1 - corre : 0, pelle: PELLI[n % PELLI.length], capelli: CAPELLI[(n * 7) % CAPELLI.length] },
          chi: a.chi && a.chi.faccia ? a.chi : null });
      });
      figure.sort(function (a, b) { return a.y - b.y; });
      var nomi = [];
      figure.forEach(function (f) {
        if (f.chi) f.o.testa = true;
        omino(f.x, f.y, u, f.dir, f.kit, f.o);
        if (f.chi) { var td = testaDi(f.x, f.y, u, f.o, true); faccia(f.chi.faccia, td.testa[0], td.testa[1], td.r, f.chi.pc); nomi.push({ chi: f.chi, alto: td.alto }); }
      });
      // il pallone: l'ombra a terra e lui in aria (più è alto, più si stacca); la scia quando va forte
      var zpx = (pb[3] || 0) * u * 1.3, rs = Math.max(1.6, u * 0.3), rb = rs * (1 + (pb[3] || 0) / 14), k;
      var pv = lungo(sc.palla, Math.max(0, p - 0.012), true) || pb, sv = P(sc, pv[1], pv[2]), vb = Math.sqrt(Math.pow(gp[0] - sv[0], 2) + Math.pow(gp[1] - zpx - sv[1] + (pv[3] || 0) * u * 1.3, 2));
      if (vb > u * 0.5) for (k = 7; k >= 1; k--) {   // (la scia: anche nei tiri)
        var qq = lungo(sc.palla, Math.max(0, p - k * 0.005), true) || pb, ss = P(sc, qq[1], qq[2]);
        ctx.beginPath(); ctx.arc(ss[0], ss[1] - (qq[3] || 0) * u * 1.3 - rb * 0.6, rb * (1 - k * 0.08), 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255," + (0.36 - k * 0.045).toFixed(2) + ")"; ctx.fill();
      }
      ctx.beginPath(); ctx.ellipse(gp[0], gp[1], rs * 1.05, rs * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0," + (0.34 / (1 + (pb[3] || 0) * 0.25)).toFixed(2) + ")"; ctx.fill();   // (l'ombra: più chiara se il pallone è alto)
      ctx.beginPath(); ctx.arc(gp[0], gp[1] - zpx - rb * 0.6, rb, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = Math.max(0.8, rb * 0.25); ctx.strokeStyle = "#1b1b1b"; ctx.stroke();
      ctx.beginPath(); ctx.arc(gp[0] - rb * 0.1, gp[1] - zpx - rb * 0.7, rb * 0.36, 0, Math.PI * 2); ctx.fillStyle = "#222"; ctx.fill();
      ctx.restore();
      A.dove = [w / 2 + (gp[0] - cam.cx) * cam.z, h / 2 + (gp[1] - zpx - cam.cy) * cam.z];   // (dov'è il pallone sullo schermo: per le prove)
      // sopra a tutto, nei pixel dello schermo: i nomi dei vostri (con la punta sulla testa), le scritte, il replay
      var fs = Math.round(Math.max(9, Math.min(12, Math.min(w, h) * 0.032)));
      nomi.forEach(function (n) { var sx = w / 2 + (n.alto[0] - cam.cx) * cam.z, sy = h / 2 + (n.alto[1] - cam.cy) * cam.z; if (sx < -8 || sx > w + 8 || sy < 0 || sy > h + 40) return; etichetta(n.chi.nome, sx, sy - 6, n.chi.pc || "#ffe066", fs); });
      if (sc.replay) {
        ctx.fillStyle = "rgba(6,12,30,.78)"; ctx.fillRect(0, 0, w, 34); scritta("🎬 IL GOL DELLA GIORNATA", w / 2, 23, Math.round(Math.min(17, w * 0.045)), "#ffe066");
        ctx.fillStyle = "#e03131"; ctx.beginPath(); ctx.arc(14, 48, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.font = "900 11px system-ui,sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.fillText("REPLAY · RALLENTATORE", 23, 52);
      }
      var ultima = null; sc.scritte.forEach(function (s) { if (p >= s.t && (!ultima || s.t >= ultima.t)) ultima = s; });
      [ultima].forEach(function (s) {   // GOL!, PARATO!… che entrano grandi (solo l'ultima)
        if (!s) return;
        var z = 1 + 0.6 * Math.max(0, 1 - (p - s.t) * 7);
        var fz = Math.round(Math.min(w * 0.11, h * 0.16) * z); ctx.font = "900 " + fz + "px system-ui,sans-serif"; var lz = ctx.measureText(s.testo).width;
        if (lz > w * 0.92) fz = Math.floor(fz * w * 0.92 / lz);   // (le scritte lunghe più piccole: stanno sempre dentro lo schermo)
        scritta(s.testo, w / 2, h * (A.vert ? (sc.verso > 0 ? 0.5 : 0.56) : 0.6), fz, s.col);
      });
    }
    function suoniDi(sc) {   // quando suonano il pallone, il palo, la rete, la folla e il fischietto in questa azione
      var l = [], pp = sc.palla, ts = sc.scritte.map(function (x) { return x.t; }).concat(sc.rete != null ? [sc.rete] : []), i;
      function vel(a, b) { var dt = b[0] - a[0]; return dt < 1e-4 ? 0 : Math.sqrt(Math.pow(b[1] - a[1], 2) + Math.pow(b[2] - a[2], 2) + Math.pow((b[3] - a[3]) / 40, 2)) / dt; }
      for (i = 0; i + 1 < pp.length; i++) {
        var v1 = vel(pp[i], pp[i + 1]), v0 = i > 0 ? vel(pp[i - 1], pp[i]) : 0, t = pp[i][0];
        if (v1 > 1.1 && v1 > v0 * 1.3 && !ts.some(function (x) { return Math.abs(x - t) < 0.02; })) (function (t, f) { l.push({ t: t, f: function () { SUONI.calcio(f); } }); })(t, Math.min(1, v1 / 5));
      }
      (sc.fischi || []).forEach(function (t) { l.push({ t: t, f: function () { SUONI.fischio(1); } }); });
      sc.scritte.forEach(function (x) {
        var w = x.testo;
        l.push({ t: x.t, f: /GOL|CUCCHIAIO/.test(w) ? function () { SUONI.rete(); SUONI.boato(1); } : /PALO|TRAVERSA/.test(w) ? function () { SUONI.palo(); SUONI.ooh(); } :
          /PARAT|PARA ANCHE|LINEA/.test(w) ? function () { SUONI.calcio(0.5); SUONI.ooh(); } : function () { SUONI.ooh(); } });
      });
      return l.sort(function (a, b) { return a.t - b.t; });
    }
    A.vel = 1;   // (⏩ Veloce: 2)
    // gioca un'azione: dur ms (più lunga se c'è il rallentatore); alDunque() quando arriva al momento clou; poi() alla fine
    // il tempo dell'azione col rallentatore che entra ed esce piano: T.tab[k] = quanto tempo vero (in «dur») per arrivare a k/N
    function tempi(sc) {
      var lw = sc.lento, N = 80, tab = [0], k;
      function velo(p) { if (!lw) return 1; var s = liscio((p - lw[0] + 0.05) / 0.05) * liscio((lw[1] + 0.05 - p) / 0.05); return 1 - (1 - lw[2]) * s; }
      for (k = 1; k <= N; k++) tab.push(tab[k - 1] + 1 / N / velo((k - 0.5) / N));
      return { tab: tab, N: N, tot: tab[N] };
    }
    function pDiT(T, x) { var i = 0; while (i < T.N - 1 && T.tab[i + 1] < x) i++; return Math.max(0, Math.min(1, (i + (x - T.tab[i]) / (T.tab[i + 1] - T.tab[i])) / T.N)); }
    A.durata = function (sc, dur) { return Math.max(0, dur * (tempi(sc).tot - (sc.parti || 0))); };   // (quanto dura l'azione, col rallentatore)
    // l'azione col piano della giornata: ogni fotogramma si calcola dal tempo di gioco (uguale su tutti i telefoni) e la fine ha la sua ora
    A.giocaPiano = function (sc, dur, R, alDunque, poi) {
      A.ferma(); A.sc = sc; if (!sc.folla) sc.folla = comparse(sc);
      var T = tempi(sc), g0 = R.pt, inizio = (sc.parti || 0) * dur, lungo = A.durata(sc, dur), fatto = false, finita = false, suoni = suoniDi(sc), sentiti = 0;
      while (sentiti < suoni.length && suoni[sentiti].t < (sc.parti || 0)) sentiti++;
      function dunque() { if (fatto) return; fatto = true; var pt = R.pt; R.pt = Math.min(R.g(), g0 + lungo); alDunque(); R.pt = pt; }   // (puntuale: niente «ritardo»)
      function passo() {
        if (finita || !document.body.contains(cv)) { A.raf = 0; return; }
        var dg = R.g() - g0, p = pDiT(T, (Math.max(0, dg) + inizio) / dur), tardi = dg > lungo + 300;
        while (sentiti < suoni.length && p >= suoni[sentiti].t) { if (!tardi && p - suoni[sentiti].t < 0.06) suoni[sentiti].f(); sentiti++; }   // (chi recupera non sente i suoni già passati)
        disegna(sc, p);
        if (p >= sc.dunque) dunque();
        A.raf = p < 1 ? requestAnimationFrame(passo) : 0;
      }
      A.raf = requestAnimationFrame(passo);
      R.dopo(lungo, function () { finita = true; if (A.raf) cancelAnimationFrame(A.raf); A.raf = 0; if (document.body.contains(cv)) disegna(sc, 1); if (!fatto) { fatto = true; alDunque(); } poi(); });
    };
    A.gioca = function (sc, dur, alDunque, poi) {
      A.ferma(); A.sc = sc;
      if (!sc.folla) sc.folla = comparse(sc);
      var T = tempi(sc), tab = T.tab, N = T.N, prima = 0, passato = (sc.parti || 0) * dur, fatto = false, suoni = suoniDi(sc), sentiti = 0;
      var tot = T.tot;
      while (sentiti < suoni.length && suoni[sentiti].t < (sc.parti || 0)) sentiti++;
      function pDi(r) { return pDiT(T, r * tot); }   // (dal tempo vero al tempo dell'azione: nel rallentatore scorre più piano)
      function passo(ora) {
        if (!document.body.contains(cv)) { A.raf = 0; return; }   // (la schermata non c'è più: niente fotogrammi a vuoto)
        if (prima) passato += Math.min(100, ora - prima) * (A.vel || 1); prima = ora;   // (dopo una pausa dell'app si riprende da dove era)   // (col ⏩ il tempo corre il doppio)
        var r = Math.min(1, passato / (dur * tot)), p = Math.min(1, pDi(r));
        while (sentiti < suoni.length && p >= suoni[sentiti].t) { suoni[sentiti].f(); sentiti++; }
        disegna(sc, p);
        if (!fatto && p >= sc.dunque) { fatto = true; alDunque(); }
        if (r < 1) A.raf = requestAnimationFrame(passo);
        else { A.raf = 0; poi(); }
      }
      A.raf = requestAnimationFrame(passo);
    };
    A.ferma = function () { if (A.raf) cancelAnimationFrame(A.raf); A.raf = 0; };
    A.fermo = function (sc) { A.ferma(); A.sc = sc; if (sc && !sc.folla) sc.folla = comparse(sc); disegna(sc, sc ? sc.parti || 0 : 0); };   // la scena ferma (prima dell'azione), o il campo intero vuoto
    A.foto = function (sc, p) { A.ferma(); A.sc = sc; if (!sc.folla) sc.folla = comparse(sc); disegna(sc, p); };   // un istante dell'azione, fermo
    return A;
  }
  if (window.SG_PROVA) window.SG_PROVA.asta = { campoAzioni: campoAzioni, scena: scena, kitDi: kitDi, kitPortiere: kitPortiere, giornataSerieA: giornataSerieA, roseSerieA: roseSerieA, tiroN: tiroN, rigoristaN: rigoristaN };   // (solo per le prove nel browser)
  function posQ(R, i) { var c = i % R.gioCols, f = Math.floor(i / R.gioCols); return "translate(calc(" + c + " * (100% + 5px))," + f * (R.gioQh + 5) + "px)"; }   // (il quadrettino al posto i: da sinistra a destra, poi la fila sotto)
  function ordinaGiornata(R, f) {   // i quadrettini al loro posto (solo transform: niente scatti)
    var l = Object.keys(R.gr).map(function (k) { return R.gr[k]; }).sort(f);
    l.forEach(function (g, i) { var tr = posQ(R, i); if (g.tr !== tr) { g.tr = tr; g.nodo.style.transform = tr; } });
  }
  function fischioFinale(R) {   // 90': le pagelle vere, una rosa alla volta, da chi ha fatto meno a chi ha fatto di più; poi il podio
    if (!vivoRivela(R)) return;
    R.az.fermo(null); R.risN.forEach(function (q) { q.nodo.classList.remove("ora"); }); pagFissa(R);
    barraTesto(R, R.fischiato ? minTxt(90 + R.rec) : "90'", "🏁 Fischio finale");
    if (R.fischiato) avvisoCampo(R, 50, ["📋 LE PAGELLE", "arrivano i voti veri"]);   // (il triplice fischio c'è già stato)
    else { avvisoCampo(R, 50, ["🏁 FISCHIO FINALE!", "arrivano i voti in pagella"]); if (!inRitardo(R)) SUONI.fischio(3, true); }
    R.provaM = "fischio finale"; provaPiano(R, "finale");
    var ordine = listaGio(R).sort(function (a, b) { return (b.r.pos - a.r.pos) || (b.ord - a.ord); }), j = 0, pag = R.pag, el = R.el;
    R.dopo(1700, function () {   // (prima il gol della giornata, poi le pagelle)
      if (!vivoRivela(R)) return; viaAvviso(R);
      golDellaGiornata(R, function () { barraTesto(R, "90'", "🏁 Fischio finale"); R.az.fermo(null); R.dopo(300, prossima); });
    });
    function prossima() {
      if (!vivoRivela(R)) return;
      if (j >= ordine.length) {
        pag.classList.remove("on");
        ordinaGiornata(R, function (a, b) { return (a.r.pos - b.r.pos) || (a.ord - b.ord); });
        listaGio(R).forEach(function (g) { g.nodo.classList.toggle("capo", R.righe.length > 1 && g.r.pos === 1); });   // (la 👑 su chi vince davvero)
        var w = R.righe[0], primi = R.righe.filter(function (r) { return r.pos === 1; });
        avvisoCampo(R, 50, [primi.length > 1 ? "🏆 PARI MERITO!" : "🏆 " + w.nome.toUpperCase() + " VINCE!", numFanta(w.gio.punti) + " fantapunti" + (primi.length > 1 ? ": " + primi.map(function (r) { return r.nome; }).join(" e ") : "")]);
        if (!inRitardo(R)) FX.festa();
        R.dopo(2800, function () { podioRivela(R); });
        return;
      }
      var g = ordine[j++], r = g.r, ultima = j === ordine.length, somma = 0, k = 0, mia = R.carta = (R.carta || 0) + 1;
      var tot = el("b", { class: "st-pf-tot", text: "0" }), righe = [];
      svuotaNodo(pag); pag.className = "st-pag uno";
      pag.appendChild(el("div", { class: "st-pag-tit", text: "📋 La pagella" }));
      pag.appendChild(el("div", { class: "st-pf-testa" }, [ el("img", { src: R.busti[r.id], alt: "" }), el("span", { text: r.nome, style: "color:" + R.colP[r.id] }), tot ]));
      r.gio.cal.forEach(function (c, kk) {
        var cp = r.kit[kk], ic = c.ev.map(function (e) { return EV_GIO[e.t] || ""; }).join("");
        var riga = el("div", { class: "st-pf" }, [ el("span", { class: "as-rb as-rb-" + cp.ruolo, text: (FANTA_RUOLI[cp.ruolo] || {}).breve || "" }),
          el("div", { class: "st-pf-nome" }, [ el("b", { text: nomeCampo(cp.nome) }), el("small", { text: cp.squadra + (ic ? " · " + ic : "") }) ]),
          el("div", { class: "st-pf-v " + classeVoto(c.v) }, [ el("small", { text: "voto" }), el("b", { text: numFanta(c.v) }) ]),
          el("div", { class: "st-pf-fv" }, [ el("small", { text: "fantavoto" }), el("b", { text: numFanta(c.fv) }) ]) ]);
        pag.appendChild(riga); righe.push(riga);
      });
      R.provaM = "pagella " + j;
      // «Mostra tutta ▶» (chi tiene la partita): tutta la pagella subito, per tutti alla stessa ora
      function tutta() { if (mia !== R.carta) return; while (k < righe.length) { righe[k].classList.add("on"); somma += r.gio.cal[k].fv; k++; } tot.textContent = numFanta(somma); scopri(); }
      var capo = guidoIo(R), idx = j, svela = capo ? el("button", { class: "btn st-pag-av", text: "Mostra tutta ▶", onclick: function () {
        if (mia !== R.carta || svela.disabled) return; svela.disabled = true;
        var h = R.opz.cron && R.opz.onPasso && !(R.opz.passi || {}).libero ? R.opz.onPasso("mt", idx) : null;
        R.alleOra(h != null ? h : R.ora(), tutta); R.tic();
      } }) : null;
      if (R.opz.cron && !capo) R.attese["mt|" + idx] = tutta;   // (gli amici: quando lo tocca lui)
      if (svela) pag.appendChild(svela);
      void pag.offsetWidth; pag.classList.add("on");
      if (!capo && !R.opz.cron && ((R.opz.passi || {}).fin || 0) >= idx) { while (k < righe.length) { righe[k].classList.add("on"); somma += r.gio.cal[k].fv; k++; } tot.textContent = numFanta(somma); }
      nuoviPassi(R);
      function scopri() {   // un calciatore alla volta: il voto, il fantavoto, il totale che sale
        if (!vivoRivela(R) || mia !== R.carta) return;
        if (k >= righe.length) {
          r.gio.cal.forEach(function (c, kk) { g.vv[kk] = c.v; g.bon[kk] = c.fv - c.v; }); g.pt.textContent = numFanta(r.gio.punti);
          pag.firstChild.textContent = "📋 La pagella · " + r.pos + "° posto" + (r.pos === 1 ? " 🏆" : "");
          if (inRitardo(R)) {} else if (ultima) { FX.posto(); vibra(30); } else FX.tic(0.9);
          R.carta++; if (svela && svela.parentNode) svela.parentNode.removeChild(svela);
          passoCapo(R, pag, "fin", idx, 20, prossima);   // (ora si guarda con calma: avanti quando lo dice chi tiene la partita)
          return;
        }
        var c = r.gio.cal[k]; righe[k].classList.add("on"); somma += c.fv; tot.textContent = numFanta(somma); rianima(tot, "batte");
        if (!inRitardo(R)) FX.tic(0.3 + k * 0.12);
        k++; R.dopo(900, scopri);
      }
      R.dopo(800, scopri);
    }
  }
  function podioRivela(R) {   // il podio: i primi tre sui gradini (il primo con le braccia alzate), sotto gli altri
    if (!vivoRivela(R) || R.finito) return;
    fermaRivela(R); R.finito = true;
    // il tasto in alto diventa «📸 Foto» (la rosa da mandare nel gruppo); se non c'è la foto, sparisce
    if (R.opz.foto) { R.salta.textContent = "📸 Foto"; R.salta.onclick = function () { R.opz.foto(); }; R.salta.style.visibility = ""; } else R.salta.style.visibility = "hidden";   // (online gli amici non hanno «Salta», ma «📸 Foto» sì)
    var el = document.createElement.bind(document), w = R.righe[0], gio = !!(w && w.gio);
    R.radice.classList.remove("gio"); R.info.textContent = "La classifica delle rose";
    R.campoBox.style.display = "none"; R.gio.style.display = "none"; R.podio.style.display = "";
    var primi = R.righe.filter(function (r) { return r.pos === 1; });   // (a pari punti (o valore) e pari crediti vincono insieme)
    if (w) { R.magliaImg.src = srcAv(cfgDi(w.nome, w.omino), {}); R.nome.textContent = primi.map(function (r) { return r.nome; }).join(" e "); R.prezzoN.textContent = gio ? numFanta(w.gio.punti) : w.totale; R.chi.textContent = (gio ? "fantapunti · " : "") + (primi.length > 1 ? "pari merito! 🏆" : "vince! 🏆"); R.squadra.textContent = ""; rianima(R.schermo, "entra"); }
    R.ruolo.className = "st-ruolo st-ruolo-classifica"; R.ruolo.textContent = "CLASSIFICA";
    rianima(R.ticker, "via", gio ? "Vince chi fa più fantapunti nella giornata! A pari punti, la rosa che vale di più." : "Vince la rosa che vale di più! A pari valore, chi ha più crediti avanzati.");
    // 🏅 poi sul maxischermo girano i titoli scherzosi, uno ogni 3 secondi
    var tl = (R.opz.titoli || []).map(function (x) { return x.icona + " " + x.titolo + ": " + x.chi; }), k = 0;
    if (tl.length) R.tit = setInterval(function () { if (!vivoRivela(R)) { clearInterval(R.tit); R.tit = null; return; } rianima(R.ticker, "via", tl[k++ % tl.length]); }, 3200);
    var gradini = el("div"); gradini.className = "st-gradini";
    [1, 0, 2].forEach(function (i) {
      var r = R.righe[i]; if (!r) return;
      var g = el("div"); g.className = "st-gradino p" + (i + 1); g.style.animationDelay = (i === 0 ? 0.5 : i === 1 ? 0.25 : 0) + "s";
      var img = el("img"); img.src = srcAv(cfgDi(r.nome, r.omino), i === 0 ? { braccia: "su" } : {}); img.alt = "";
      var b = el("b"); b.textContent = r.nome; var sm = el("small"); sm.textContent = gio ? numFanta(r.gio.punti) + " punti" : r.totale + " · " + r.crediti + " 💰";
      var blocco = el("div"); blocco.className = "blocco"; blocco.textContent = r.pos;
      g.appendChild(img); g.appendChild(b); g.appendChild(sm); g.appendChild(blocco);
      gradini.appendChild(g);
    });
    R.podio.appendChild(gradini);
    if (R.righe.length > 3) {
      var altri = el("div"); altri.className = "st-altri";
      R.righe.slice(3).forEach(function (r) { var riga = el("div"); riga.textContent = r.pos + "° " + r.nome + (gio ? " · " + numFanta(r.gio.punti) + " fantapunti" : "") + " · valore " + r.totale + (gio ? "" : " · " + r.crediti + " 💰"); altri.appendChild(riga); });
      R.podio.appendChild(altri);
    }
    FX.festa();
    piedeRivela(R);
  }
  function piedeRivela(R) { svuotaNodo(R.piede); (R.opz.bottoni ? R.opz.bottoni() : []).forEach(function (b) { if (b) R.piede.appendChild(b); }); }
  function disegnaAsta(t, st) {   // (stesso telefono) l'asta nella sala: tocchi il tuo avatar per rilanciare (il tempo riparte solo coi rilanci)
    var el = t.el, a = st.asta, vc = vistaCarta(a.carta);
    var persone = st.giocatori.map(function (g, i) {
      var inGara = st.senzaCarta.indexOf(i) >= 0, pass = !!a.passati[i], max = maxPuntata(st, i);
      return { id: i, nome: g.nome, omino: g.omino || null, num: i + 1, stato: !inGara ? "fuori" : pass ? "passato" : "gara",
        nota: !inGara ? "✔ ha la carta" : pass ? "ha passato" : notaCrediti(g.crediti, max), manca: "",
        puo: inGara && !pass && max >= a.offerta + 1 };
    });
    salaAsta(t, { chiave: "t|" + st.sessione + "|" + st.roundIdx + "|" + a.idxCarta + "|" + a.carta.nome, info: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND,
      carta: cartaLotto(el, vc), sotto: sottoLotto(vc), prezzo: a.offerta, base: false, leader: a.leader, budget: st.crediti, grosso: 3,
      persone: persone, io: null, giro: a.giro, resta: a.scadenza - Date.now(), durata: SECONDI * 1000,
      nota: "Scegli il salto e tocca il tuo avatar per rilanciare (chi ha l'offerta può rialzare). Allo scadere la carta va a chi offre di più.",
      sel: selettoreSalti(el, st, SALTI_TEMI), kPiede: "sel",
      onRilancia: function (i) { rilancia(t, st, i); }, onPassa: function (i) { passa(t, st, i); }, onIndietro: function () { esciAsta(t, st); },
      extra: { testo: "🃏 Carte", apri: function () { var b = el("div", {}), pal = dettaglioPalio(el, st.tavolo, vc.nome); if (pal) b.appendChild(pal); b.appendChild(pannelloKit(el, st.giocatori)); foglioSala(t, "🃏 Le carte", b); } } });
  }
  // la carta sul pannello della sala: il lotto doppio con le due emoji, il pacco coperto
  function cartaLotto(el, c) { return el("div", { class: "sa-carta-in" }, [ emLotto(el, "em", c), el("div", { class: "nm", text: nomeLotto(c) }) ]); }
  function sottoLotto(c) { return c.pacco ? "🎁 Cosa ci sarà dentro? 🤫" : c.bonus ? "📦 Lotto doppio: 2 carte!" : "Fascia ancora segreta 🤫"; }
  // (stesso telefono) di quanto rilancia chi tocca il suo avatar: +1 (di base) o il salto scelto; dopo ogni rilancio torna +1
  function selettoreSalti(el, st, salti) {
    if (!st.selNodo) {
      var box = el("div", { class: "as-sel" }, [ el("span", { text: "Rilancio di" }) ]);
      st.selBtn = salti.map(function (s) {
        var b = el("button", { type: "button", text: "+" + s, onclick: function (e) { e.stopPropagation(); if (st.salto !== s) vibra(10); st.salto = s; aggSel(st); } });
        box.appendChild(b); return { s: s, b: b };
      });
      st.selNodo = box;
    }
    aggSel(st);
    return st.selNodo;
  }
  function aggSel(st) { (st.selBtn || []).forEach(function (x) { var c = x.s === (st.salto || 1) ? "on" : ""; if (x.b.className !== c) x.b.className = c; }); }

  function rilancia(t, st, i) {
    var a = st.asta;
    // anche chi ha già l'offerta più alta può rialzare da solo (è strategia: chi ha pochi crediti non ci arriva più)
    var max = maxPuntata(st, i);
    if (!a || st.senzaCarta.indexOf(i) < 0 || max < a.offerta + 1) return;
    var prezzo = Math.min(a.offerta + (st.salto || 1), max);   // il salto scelto (se non ci arriva, fin dove può)
    segnaRilancio(st.giocatori[i], prezzo - a.offerta, 3);
    a.ultimoSec = a.scadenza && a.scadenza - Date.now() < 2000 ? i : null;   // 🎯 all'ultimo secondo
    a.offerta = prezzo; a.leader = i;
    delete a.passati[i];
    st.salto = 1; aggSel(st);
    FX.rilancio();
    if (restaSoloLeader(st)) { disegnaAsta(t, st); return chiudiAsta(t, st); }   // nessun altro può più rilanciare: è subito sua (prima il tabellone mostra l'offerta nuova, poi il martello)
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
    assegnaTemi(st, vincitore, carta, prezzo, a.ultimoSec === vincitore);
    st.asta = null;
    esitoAsta(t, st, vincitore, carta, prezzo, {});
  }
  // (stesso telefono) la carta (o il lotto) va a chi ha vinto: paga, la mette nel kit, e il prossimo sceglie
  function assegnaTemi(st, i, carta, prezzo, cecchino) {
    var g = st.giocatori[i], idx = st.tavolo.indexOf(carta);
    g.crediti -= prezzo;
    Array.prototype.push.apply(g.kit, carteVinte(carta, prezzo));
    g.asteVinte = (g.asteVinte || 0) + 1;
    segnaVinta(g, prezzo, carta, cecchino, false);
    if (idx >= 0) st.tavolo.splice(idx, 1);
    st.senzaCarta = st.senzaCarta.filter(function (x) { return x !== i; });
    st.chooserPtr++;
  }

  // opz: { automatica (l'ultima carta rimasta), buste ([{ nome, q }]: la busta chiusa), dopo (il martello ha già battuto) }
  function esitoAsta(t, st, chi, carta, prezzo, opz) {
    if (st.finita) return;
    opz = opz || {};
    var nome = st.giocatori[chi].nome;
    if (!opz.dopo) { opz.dopo = true; return aggiudica(battutaAggiudica(nome, prezzo, st.crediti), function () { esitoAsta(t, st, chi, carta, prezzo, opz); }); }   // prima il martello
    var el = t.el;
    FX.aggiudicato(); vibra(30);   // il martello: un momento che conta
    var s = t.schermata({}), ms = opz.buste ? AUTO_BUSTE_MS : AUTO_ESITO_MS;
    s._contenuto.appendChild(el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:8px" },
      nodiEsitoTemi(el, { chiNome: nome, carta: carta, prezzo: prezzo, automatica: opz.automatica, buste: opz.buste }, null).concat([
      el("p", { class: "as-msg", text: st.giocatori[chi].crediti === 1 ? "Gli resta 1 credito." : "Gli restano " + st.giocatori[chi].crediti + " crediti." }) ])));
    var vai = autoAvanti(st, s, function () { prossimaAsta(t, st); }, ms);
    s._piede.appendChild(tastoAuto(el, "Avanti ▶", ms, vai));
    t.mostra(s);
  }
  // l'esito di una carta dei temi (uguale sullo stesso telefono e online): le buste aperte una alla volta, il pacco che si scopre, il lotto doppio
  // e: { chiId, chiNome, carta (vera), prezzo, automatica, buste: [{ id, nome, q }] dalla più alta }
  function nodiEsitoTemi(el, e, myId) {
    var c = e.carta || {}, tu = myId != null && e.chiId === myId, out = [];
    if (e.buste && e.buste.length) {
      out.push(el("div", { class: "as-buste-tit", style: "font-size:1.05rem;font-weight:900", text: "✉️ Si aprono le buste!" }));
      var box = el("div", { class: "as-buste" }), dal = e.buste.slice().reverse();   // dalla più bassa alla più alta
      dal.forEach(function (b, i) {
        var vince = i === dal.length - 1, r = el("div", { class: "r" + (vince ? " vince" : "") }, [ el("span", { text: vince ? "🏆" : "✉️" }),
          el("b", { text: myId != null && b.id === myId ? "Tu" : b.nome }), el("span", { text: b.q ? b.q + " 💰" : "niente" }) ]);
        r.style.animationDelay = (0.35 + i * 0.45) + "s";
        box.appendChild(r);
      });
      out.push(box);
    } else out.push(el("div", { class: "as-martello", style: "font-size:3rem;line-height:1", text: "🔨" }));
    out.push(el("div", { style: "font-size:1.45rem;font-weight:900", text: tu ? "Te lo aggiudichi tu!" : e.chiNome + " si aggiudica" }));
    if (c.pacco) out.push(el("div", { style: "font-weight:900;color:#e4b5ff", text: "🎁 Dentro il pacco c'era…" }));
    var big = el("div", { class: "as-big" + (c.pacco ? " as-sorpresa" : ""), style: "margin-top:4px" }, [
      emLotto(el, "em", c),
      el("div", { class: "nm", text: nomeLotto(c) }),
      el("div", { class: "as-fascia-x", text: c.bonus ? "📦 Lotto doppio: tutte e due nel kit!" : "Fascia ancora segreta 🤫" })
    ]);
    if (e.buste && e.buste.length) { big.style.animation = "asBusta .4s ease-out " + (0.35 + e.buste.length * 0.45) + "s both"; big.style.padding = "10px 14px 12px"; }
    out.push(big);
    out.push(el("div", { style: "font-size:1.3rem;font-weight:900;color:var(--accento)", text: "per " + e.prezzo + " 💰" }));
    if (e.automatica) out.push(el("p", { class: "as-msg", text: "Ultimo lotto rimasto: assegnato automaticamente." }));
    return out;
  }

  // ---- ✉️ la busta chiusa sullo stesso telefono: si passa il telefono, ognuno scrive in segreto la sua offerta ----
  function bustaLocale(t, st, chooser, idx) {
    var carta = st.tavolo[idx], k0 = st.senzaCarta.indexOf(chooser), ordine = [];
    for (var k = 0; k < st.senzaCarta.length; k++) ordine.push(st.senzaCarta[(k0 + k) % st.senzaCarta.length]);   // si comincia da chi ha scelto
    var B = st.busta = { carta: carta, chooser: chooser, ordine: ordine, offerte: {}, k: 0 };
    avanti();
    function avanti() {
      if (st.finita || st.busta !== B) return;
      if (B.k >= ordine.length) return apriBusteLocale(t, st);
      var i = ordine[B.k];
      t.passaA(st.giocatori[i].nome, function () {
        schermoBustaLocale(t, st, i, function (q) { if (st.busta !== B || B.offerte[i]) return; B.offerte[i] = { q: q, ord: B.k }; B.k++; avanti(); });
      });
    }
  }
  function schermoBustaLocale(t, st, i, fatto) {
    var el = t.el, B = st.busta, g = st.giocatori[i], min = i === B.chooser ? 1 : 0, max = Math.max(min, maxPuntata(st, i)), q = min;
    var s = t.schermata({ indietro: function () { esciAsta(t, st); } });
    s.classList.add("as-bus");
    var vc = vistaCarta(B.carta);
    s._contenuto.appendChild(el("div", { class: "as-bus-testa" }, [ el("span", { text: "✉️ Busta chiusa · " + g.nome }) ]));
    s._contenuto.appendChild(el("div", { class: "as-bus-carta" }, [ emLotto(el, "em", vc), el("div", {}, [ el("div", { class: "nm", text: nomeLotto(vc) }), el("div", { class: "sm", text: sottoLotto(vc) }) ]) ]));
    s._contenuto.appendChild(el("p", { class: "as-bus-regola", text: i === B.chooser ? "Hai scelto tu la carta: offri almeno 1. Se nessuno offre di più, è tua." : "Scrivi in segreto quanto offri (0 = non la vuoi). Vince l'offerta più alta; a pari offerta chi ha scritto prima." }));
    s._contenuto.appendChild(el("p", { class: "as-bus-regola", style: "color:var(--testo)", text: "Hai " + g.crediti + " 💰 · puoi offrire fino a " + max }));
    var v = el("div", { class: "v" }), meno, piu, piu3;
    function agg() { v.textContent = q + " 💰"; meno.disabled = q <= min; piu.disabled = q >= max; piu3.disabled = q >= max; ok.textContent = q ? "✉️ Chiudo la busta: " + q + " 💰" : "✉️ Non offro niente"; }
    meno = el("button", { type: "button", text: "−", onclick: function () { if (q > min) { q--; agg(); } } });
    piu = el("button", { type: "button", text: "+", onclick: function () { if (q < max) { q++; agg(); } } });
    piu3 = el("button", { type: "button", class: "p3", text: "+3", onclick: function () { q = Math.min(max, q + 3); agg(); } });
    s._contenuto.appendChild(el("div", { class: "as-env" }, [ el("div", { class: "as-bst" }, [ meno, v, piu, piu3 ]) ]));   // (la busta di carta, col numero sopra)
    var ok = el("button", { class: "btn btn-primario", onclick: function () { if (ok.disabled) return; ok.disabled = true; vibra(20); FX.rilancio(false); fatto(q); } });
    s._piede.appendChild(ok);
    agg();
    t.mostra(s);
  }
  // tutti hanno scritto: si aprono le buste. Vince la più alta; a pari offerta chi ha scritto prima (chi ha scelto la carta è il primo)
  function apriBusteLocale(t, st) {
    var B = st.busta; if (!B) return; st.busta = null;
    var lista = B.ordine.map(function (i) { return { id: i, nome: st.giocatori[i].nome, q: (B.offerte[i] || {}).q || 0, ord: (B.offerte[i] || {}).ord || 0 }; });
    lista.sort(function (x, y) { return (y.q - x.q) || (x.ord - y.ord); });
    var w = lista[0], prezzo = Math.max(1, w.q);
    assegnaTemi(st, w.id, B.carta, prezzo, false);
    FX.round();
    esitoAsta(t, st, w.id, B.carta, prezzo, { dopo: true, buste: lista.map(function (x) { return { id: x.id, nome: x.nome, q: x.q }; }) });
  }

  function fineRound(t, st) {
    st.roundIdx++;
    if (st.roundIdx < TOT_ROUND) return iniziaRound(t, st);
    riepilogo(t, st);
  }

  // ---- dopo l'ultimo round (stesso telefono): esce la carta-scenario, si guardano i kit, poi ognuno vota con un tocco ----
  function riepilogo(t, st) {
    var el = t.el;
    st.scenario = st.scenario || scenarioDi(st.tema);
    st.votiLocali = {};
    FX.round();
    var s = t.schermata({ indietro: function () { esciAsta(t, st); } });
    s.classList.add("as-vt");
    s._contenuto.appendChild(nodoScenario(el, st.scenario, true));
    s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin:0 0 8px;font-size:.9rem", text: "Guardate i kit: poi ognuno dà la sua ⭐ a quello che se la cava meglio (non il suo)." }));
    var kits = el("div", { class: st.giocatori.length > 2 ? "as-kits" : "" });
    st.giocatori.forEach(function (g) { kits.appendChild(nodoKit(el, g, st)); });
    s._contenuto.appendChild(kits);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Si vota ⭐", onclick: function () { votazione(t, st, 0); } }));
    t.mostra(s);
  }
  // la carta-scenario del tema (una a caso tra quelle del tema; se il tema non ne ha, una uguale per tutti)
  function scenarioDi(tema) {
    var l = (tema && tema.scenari) || [];
    if (!l.length) return { emoji: (tema && tema.icona) || "🏆", testo: "Chi ha messo insieme il kit migliore?" };
    var c = l[Math.floor(Math.random() * l.length)];
    return { emoji: c.emoji || "🎬", testo: c.testo || "" };
  }
  function nodoScenario(el, sc, entra) {
    sc = sc || { emoji: "🏆", testo: "Chi ha il kit migliore?" };
    return el("div", { class: "as-scen" + (entra ? " entra" : "") }, [ el("div", { class: "e", text: sc.emoji }),
      el("div", { class: "x" }, [ el("small", { text: "🎬 Lo scenario" }), el("b", { text: sc.testo }) ]) ]);
  }

  function nodoKit(el, g, st, rivela) {
    var fanta = st && st.formato === "fanta";
    var box = el("div", { class: "as-kit" });
    box.appendChild(el("h3", { text: g.nome + " · " + g.crediti + " 💰 avanzati" }));
    if (rivela && g.votiDa) box.appendChild(el("div", { class: "as-voti-da", text: g.votiDa.length ? "⭐ da " + g.votiDa.join(", ") : "nessuna ⭐" }));   // chi ha votato chi
    (fanta ? ordinaRosa(g.kit) : g.kit).forEach(function (c) {
      box.appendChild(el("div", { class: "riga" + (c.maledetta ? " maled" : "") }, fanta ? [
        el("span", { class: "em", text: (FANTA_RUOLI[c.ruolo] || {}).emoji }),
        el("span", { style: "flex:1", text: c.nome + (c.squadra ? " · " + c.squadra : "") }),
        el("span", { class: "as-rb as-rb-" + c.ruolo, text: (FANTA_RUOLI[c.ruolo] || {}).breve })
      ] : [
        el("span", icoAttr("em", c.emoji)),
        el("span", { style: "flex:1", text: c.nome }), segnoKit(el, c),
        cellaTier(el, c.tier, rivela)
      ]));
    });
    return box;
  }

  // ---- il voto a un tocco: si passa il telefono, ognuno tocca il kit che se la cava meglio (non il suo) ----
  function votazione(t, st, votante) {
    if (votante >= st.giocatori.length || st.giocatori.length < 2) {   // (da solo, per provare: niente voto)
      contaVotiLocali(st);
      return finePartita(t, st);
    }
    var nome = st.giocatori[votante].nome;
    t.passaA(nome, function () { schermoVoto(t, st, votante); });
  }
  function schermoVoto(t, st, votante) {
    var el = t.el, fatto = false;
    var s = t.schermata({ indietro: function () { esciAsta(t, st); } });
    s.classList.add("as-vt");
    s._contenuto.appendChild(nodoScenario(el, st.scenario, false));
    s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin:0 0 8px", text: "⭐ " + nomeBreve(st.giocatori[votante].nome) + ", a chi dai la tua stella? Un tocco." }));
    var fitto = fittoVoto(st.giocatori.length);
    st.giocatori.forEach(function (g, i) {
      if (i === votante) return;
      var b = nodoVotoKit(el, g, fitto, function () {
        if (fatto) return; fatto = true;
        st.votiLocali[votante] = i; vibra(20); FX.rilancio(false);
        b.classList.add("scelto");
        setTimeout(function () { if (!st.finita) votazione(t, st, votante + 1); }, 450);
      });
      s._contenuto.appendChild(b);
    });
    t.mostra(s);
    stringiVoto(s._contenuto, [].slice.call(s._contenuto.querySelectorAll(".as-vk")), fitto);
  }
  // quanto stretti i kit da votare, perché stiano tutti nello schermo senza scorrere: da 5 giocatori si parte con le carte su
  // 2 righe; se ancora non ci stanno (schermo basso, kit lunghi, tanti giocatori) si stringe da solo: carte su una riga sola
  // (i nomi finiscono coi puntini), poi i kit su due colonne con le sole figurine delle carte
  var FITTI = ["", " fitto", " fitto mini", " fitto mini due"];
  function fittoVoto(n) { return n >= 5 ? " fitto" : ""; }
  function stringiVoto(cont, kit, liv) {
    var i = Math.max(0, FITTI.indexOf(liv || ""));
    if (!cont || !document.body.contains(cont)) return FITTI[i];
    while (cont.scrollHeight > cont.clientHeight + 1 && i < FITTI.length - 1) {
      i++;
      kit.forEach(function (b) { b.classList.remove("fitto", "mini", "due"); FITTI[i].split(" ").forEach(function (c) { if (c) b.classList.add(c); }); });
    }
    return FITTI[i];
  }
  // un kit da votare: il nome con la ⭐ e le carte in breve (uguale sullo stesso telefono e online)
  function nodoVotoKit(el, g, fitto, onclick) {
    var carte = el("div", { class: "k" });
    (g.kit || []).forEach(function (c, i) {
      if (i) carte.appendChild(document.createTextNode(" · "));
      if (c.maledetta) { carte.appendChild(el("span", { class: "as-mal-in" }, [ el("span", icoAttr("em", c.emoji)), document.createTextNode(c.nome) ])); return; }   // col bordo nero
      carte.appendChild(el("span", icoAttr("em", c.emoji)));
      carte.appendChild(document.createTextNode(c.nome));
    });
    var mal = haMaledetta(g);
    return el("button", { type: "button", class: "as-vk" + (fitto || "") + (mal ? " maled" : ""), onclick: onclick }, [
      el("div", { class: "n" }, [ el("span", { text: g.nome }), mal ? el("span", { class: "as-malus", style: "flex:none", text: "🧨 −0,5 ⭐" }) : null, el("i", { text: "⭐" }) ]),
      carte ]);
  }
  function contaVotiLocali(st) {
    if (st.votiContati) return; st.votiContati = true;
    st.giocatori.forEach(function (g) { g.stelle = 0; g.votiDa = []; });
    Object.keys(st.votiLocali || {}).forEach(function (k) {
      var da = st.giocatori[+k], a = st.giocatori[st.votiLocali[k]];
      if (da && a && da !== a) { a.stelle += 1; a.votiDa.push(da.nome); }
    });
  }

  function nomeBreve(n) { return n.length > 12 ? n.slice(0, 12) + "…" : n; }

  function finePartita(t, st) {
    if (st && st.formato === "fanta") {   // fantacalcio: si scoprono le quotazioni, dalla rosa che vale meno a quella che vale di più
      if (!st.classifica) { st.serieA = st.giornata ? {} : null; st.classifica = classificaFanta(st.giocatori, st.serieA); }   // (⚽ la giornata si gioca una volta sola)
      var righe = st.classifica;
      st.titoli = titoliFine(st.giocatori, FANTA_BUDGET, righe);
      return rivelaFanta(t, righe, { chiave: "rl|" + st.sessione, onEsci: function () { esciAsta(t, st); }, titoli: st.titoli, serieA: st.serieA,
        foto: function () { fotoRose(righe, null); },
        bottoni: function () { return [t.el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: function () { titoliFanta(t, st, righe); } })]; } });
    }
    FX.fine();
    if (!st.malusFatto) { st.malusFatto = true; malusVoto(st.giocatori); }   // 🧨 chi ha la carta maledetta: −0,5 ⭐
    st.titoli = st.titoli || titoliFine(st.giocatori, st.crediti, null);
    svelaFasce(t, st);   // le fasce restano nascoste per tutta la partita: si svelano solo ORA
  }
  // (stesso telefono, fantacalcio) dopo il podio: i titoli scherzosi e la foto delle rose, poi la classifica
  function titoliFanta(t, st, righe) {
    var el = t.el, s = t.schermata({ chiara: true, icona: "🏅", titolo: "I titoli della serata", sotto: "Non sono trofei: sono sfottò" });
    s.classList.add("as-fissa");
    var tit = nodoTitoli(el, st.titoli);
    if (tit) s._contenuto.appendChild(tit);
    else s._contenuto.appendChild(el("p", { class: "as-msg", text: "Partita tirata: nessuno si è preso un titolo! 😄" }));
    var box = el("div", { class: "as-kits" });
    righe.forEach(function (r) { box.appendChild(nodoKit(el, { nome: r.pos + "° " + r.nome + (r.gio ? " · " + numFanta(r.gio.punti) + " fantapunti" : "") + " · valore " + r.totale, crediti: r.crediti, kit: r.kit }, st)); });
    s._contenuto.appendChild(box);
    s._piede.appendChild(el("div", { class: "as-foto" }, [ el("button", { class: "btn btn-fantasma", text: "📸 Foto delle rose", onclick: function () { fotoRose(righe, null); } }) ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Classifica finale 🏆", onclick: function () { classificaFinale(t, st, righe); } }));
    t.mostra(s);
  }
  // le posizioni in classifica: a pari punti, stessa posizione
  function conPosizioni(righe, uguali) { righe.forEach(function (r, i) { r.pos = i > 0 && uguali(righe[i - 1], r) ? righe[i - 1].pos : i + 1; }); return righe; }
  // il valore di un kit secondo le fasce (A 3, B 2, C 1; la carta maledetta 0): lo spareggio a pari stelle
  function valoreKit(g) { var v = 0; (g.kit || []).forEach(function (c) { v += VALORE_FASCIA[c.tier] || 0; }); return v; }
  // temi: vince chi ha più stelle; a pari stelle il kit che vale di più (le fasce), poi chi ha più crediti avanzati
  function classificaStelle(giocatori) {
    var righe = giocatori.slice().sort(function (a, b) { return (b.stelle - a.stelle) || (valoreKit(b) - valoreKit(a)) || (b.crediti - a.crediti); });
    return conPosizioni(righe.map(function (g) {
      var v = valoreKit(g);
      var pari = righe.some(function (o) { return o !== g && o.stelle === g.stelle; });                       // a pari stelle si vede lo spareggio
      var pari2 = pari && righe.some(function (o) { return o !== g && o.stelle === g.stelle && valoreKit(o) === v; });
      return { id: g.id, nome: g.nome, stelle: g.stelle, crediti: g.crediti, valore: v,
        punti: fmtMezzi(g.stelle) + " ⭐" + (g.malus ? " · 🧨 −0,5" : "") + (pari ? " · carte " + v : "") + (pari2 ? " · " + g.crediti + " 💰" : "") };
    }), function (a, b) { return a.stelle === b.stelle && a.valore === b.valore && a.crediti === b.crediti; });
  }

  function svelaFasce(t, st) {
    var el = t.el;
    var s = t.schermata({ chiara: true, icona: "🃏", titolo: "Fasce svelate!", sotto: "Ecco il vero valore delle carte" });
    s.classList.add("as-fissa");
    var tit = nodoTitoli(el, st.titoli);
    if (tit) s._contenuto.appendChild(tit);
    var kits = el("div", { class: st.giocatori.length > 2 ? "as-kits" : "" });
    st.giocatori.forEach(function (g) { kits.appendChild(nodoKit(el, g, st, true)); });
    s._contenuto.appendChild(kits);
    s._piede.appendChild(el("div", { class: "as-foto" }, [ el("button", { class: "btn btn-fantasma", text: "📸 Foto dei kit", onclick: function () { fotoKit(st.giocatori, st.tema, null); } }) ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Classifica finale 🏆",
      onclick: function () { classificaFinale(t, st); } }));
    t.mostra(s);
  }

  function classificaFinale(t, st, righe) {
    var classifica = st.formato === "fanta" && righe
      ? righe.map(function (r) { return { nome: r.nome, punti: (r.gio ? numFanta(r.gio.punti) + " fantapunti · valore " + r.totale : "valore " + r.totale + " · " + r.crediti + " 💰"), pos: r.pos }; })
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
  //  🏅 I TITOLI SCHERZOSI di fine partita (non sono trofei): chi ha speso di più, chi ha tenuto i crediti in tasca,
  //  chi ha vinto all'ultimo secondo… Un titolo va solo a chi è primo da solo; al massimo 4, se si può a persone diverse.
  //  righe (fantacalcio): la classifica coi valori veri, per l'affare d'oro e il bidone.
  // =========================================================
  function titoliFine(giocatori, budget, righe) {
    var L = (giocatori || []).map(function (g) {
      var r = righe ? righe.filter(function (x) { return x.nome === g.nome; })[0] : null;
      return { nome: g.nome, spesi: Math.max(0, budget - g.crediti), avanzo: g.crediti, s: g.st || statNuove(), kit: r ? r.kit : (g.kit || []) };
    });
    function primo(f) {   // { x, v } del primo da solo (a pari merito niente titolo)
      var top = null, pari = false;
      L.forEach(function (x) { var v = f(x); if (v == null) return; if (!top || v > top.v) { top = { x: x, v: v, d: x._d }; pari = false; } else if (v === top.v) pari = true; });
      return top && !pari ? top : null;
    }
    function migliorCarta(x, f) { var best = null; x.kit.forEach(function (c) { var v = f(c); if (v != null && (!best || v > best.v)) best = { v: v, c: c }; }); x._d = best; return best ? best.v : null; }
    var cand = [];
    function prova(icona, titolo, f, min, dett) { var p = primo(f); if (p && p.v >= min) cand.push({ icona: icona, titolo: titolo, chi: p.x.nome, dett: dett(p.v, p.x, p.d) }); }
    if (righe) prova("💎", "L'affare d'oro", function (x) { return migliorCarta(x, function (c) { return c.valore != null && c.prezzo ? c.valore - c.prezzo : null; }); }, 5,
      function (v, x, d) { return nomeCampo(d.c.nome) + " a " + d.c.prezzo + " 💰 (vale " + d.c.valore + ")"; });
    if (righe && righe[0] && righe[0].gio) {   // ⚽ la giornata: chi ha in rosa il bomber (il calciatore con più gol, da solo)
      var bomber = null, pariB = false;
      righe.forEach(function (r) { r.gio.cal.forEach(function (x, k) {
        var g = x.ev.filter(function (e) { return e.t === "gol"; }).length; if (!g) return;
        if (!bomber || g > bomber.g) { bomber = { g: g, r: r, c: r.kit[k] }; pariB = false; } else if (g === bomber.g) pariB = true;
      }); });
      if (bomber && !pariB) cand.push({ icona: "⚽", titolo: "Il bomber", chi: bomber.r.nome, dett: nomeCampo(bomber.c.nome) + (bomber.g >= 4 ? " poker" : bomber.g === 3 ? " tripletta" : bomber.g === 2 ? " doppietta" : " in gol") });
    }
    prova("🎯", "Il cecchino dell'ultimo secondo", function (x) { return x.s.cecchino; }, 1, function (v) { return v === 1 ? "ha vinto un'asta all'ultimo secondo" : v + " aste vinte all'ultimo secondo"; });
    prova("💸", "Lo sprecone", function (x) { return x.spesi; }, 2, function (v) { return "ha speso " + v + " 💰"; });
    prova("🧊", "Il braccino corto", function (x) { return x.avanzo; }, 2, function (v) { return v === 1 ? "gli resta 1 💰" : "gli restano " + v + " 💰"; });
    if (righe) prova("🤡", "Il bidone", function (x) { return migliorCarta(x, function (c) { return c.valore != null && c.prezzo ? c.prezzo - c.valore : null; }); }, 3,
      function (v, x, d) { return nomeCampo(d.c.nome) + " pagato " + d.c.prezzo + " 💰 (vale " + d.c.valore + ")"; });
    if (!righe) {   // temi: chi ha preso il pacco a sorpresa (fortuna o sfortuna)
      L.forEach(function (x) { x.kit.forEach(function (c) {
        if (c.pacco && c.tier === "A") cand.push({ icona: "🍀", titolo: "Il fortunello", chi: x.nome, dett: "nel pacco c'era " + c.nome });
        if (c.pacco && c.tier === "C") cand.push({ icona: "🤡", titolo: "Il pacco", chi: x.nome, dett: "nel pacco c'era " + c.nome });
      }); });
    }
    prova("🔥", "Il colpo di testa", function (x) { return x.s.maxPrezzo; }, 3, function (v, x) { return v + " 💰 per " + (righe ? nomeCampo(x.s.maxCarta) : x.s.maxCarta); });
    prova("🛍️", "Il re degli affari", function (x) { return x.s.affari; }, 2, function (v) { return v + (righe ? " calciatori" : " carte") + " a 1 💰"; });
    prova("🚀", "Il saltatore", function (x) { return x.s.salti; }, 2, function (v) { return v + " salti grossi"; });
    prova("📣", "Il chiacchierone", function (x) { return x.s.rilanci; }, 6, function (v) { return v + " rilanci"; });
    // al massimo 4, prima a persone diverse
    var out = [], usati = {};
    cand.forEach(function (c) { if (out.length < 4 && !usati[c.chi]) { out.push(c); usati[c.chi] = 1; } });
    cand.forEach(function (c) { if (out.length < Math.min(3, cand.length) && out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  function nodoTitoli(el, titoli) {
    if (!titoli || !titoli.length) return null;
    var box = el("div", {}, [ el("div", { class: "etichetta", style: "margin-top:2px", text: "🏅 I titoli della serata" }) ]);
    var g = el("div", { class: "as-titoli" });
    titoli.forEach(function (x) { g.appendChild(el("div", { class: "as-tit" }, [ el("div", { class: "t", text: x.icona + " " + x.titolo }), el("div", { class: "c", text: x.chi }), el("div", { class: "d", text: x.dett }) ])); });
    box.appendChild(g);
    return box;
  }

  // =========================================================
  //  📸 LA FOTO DA MANDARE NEL GRUPPO: la rosa sul campetto (o il kit) disegnata su un'immagine, col nome dell'app.
  //  Le maglie si disegnano a mano coi colori della squadra (niente immagini esterne: la foto si può sempre salvare).
  //  Sul telefono si apre la condivisione (WhatsApp…); se non c'è, l'immagine si scarica.
  // =========================================================
  var SITO = "paky358.github.io/speed-game";
  function tela(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function rett(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function testoCorto(ctx, s, max) { s = String(s || ""); if (ctx.measureText(s).width <= max) return s; while (s.length > 1 && ctx.measureText(s + "…").width > max) s = s.slice(0, -1); return s + "…"; }
  var FONT = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  function magliaTela(ctx, cx, cy, size, sq) {   // la maglia coi due colori della squadra (stesso disegno della maglia di riserva)
    var c = coloriSquadra(sq) || ["#adb5bd", "#868e96"], s = size / 100;
    ctx.save(); ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(s, s);
    var p = new Path2D("M35 12L10 26l8 19 10-5v50h44V40l10 5 8-19-25-14q-6 8-15 8t-15-8z");
    var gr = ctx.createLinearGradient(10, 0, 90, 0); gr.addColorStop(0.5, c[0]); gr.addColorStop(0.5, c[1]);
    ctx.fillStyle = gr; ctx.fill(p); ctx.lineWidth = 3.5; ctx.strokeStyle = "#1b1b1b"; ctx.lineJoin = "round"; ctx.stroke(p);
    ctx.restore();
  }
  function pieTela(ctx, W, H) {
    ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "900 34px " + FONT; ctx.fillText("🔨 L'Asta · SPeeD GAME", W / 2, H - 70);
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "700 26px " + FONT; ctx.fillText("Giocate con noi: " + SITO, W / 2, H - 32);
  }
  // un campetto con la rosa (x, y, w: la larghezza; l'altezza è w × 25/36)
  function campoTela(ctx, x, y, w, kit, grande) {
    var h = w * 25 / 36;
    rett(ctx, x, y, w, h, w * 0.03); ctx.save(); ctx.clip();
    for (var i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? "#358a41" : "#3d9b49"; ctx.fillRect(x, y + i * h / 10, w, h / 10 + 1); }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = Math.max(2, w / 220); rett(ctx, x + w * 0.03, y + h * 0.04, w * 0.94, h * 0.92, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w * 0.03, y + h / 2); ctx.lineTo(x + w * 0.97, y + h / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.09, 0, Math.PI * 2); ctx.stroke();
    var posti = slotRosa(kit), ms = w * (grande ? 0.16 : 0.15);
    POSTI_CAMPO.forEach(function (p, i) {
      var c = posti[i], cx = x + w * p.x / 100, cy = y + h * p.y / 100 - ms * 0.15;
      if (!c) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(cx, cy, ms * 0.35, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); return; }
      magliaTela(ctx, cx, cy, ms, c.squadra);
      ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 6;
      ctx.font = "900 " + Math.round(ms * 0.24) + "px " + FONT; ctx.fillText(testoCorto(ctx, nomeCampo(c.nome), w * 0.3), cx, cy + ms * 0.66);
      var info = (c.prezzo ? c.prezzo + " 💰" : "") + (c.valore != null ? (c.prezzo ? " · " : "") + "vale " + c.valore : "");
      if (info) { ctx.font = "800 " + Math.round(ms * 0.19) + "px " + FONT; ctx.fillStyle = "#ffe066"; ctx.fillText(info, cx, cy + ms * 0.9); }
      ctx.shadowBlur = 0;
    });
    return h;
  }
  // righe: [{ nome, kit (con valore), totale, pos, crediti }]; mio: il nome della rosa da mettere in grande (null = tutte)
  function fotoRose(righe, mio) {
    try {
      var una = mio ? righe.filter(function (r) { return r.nome === mio; })[0] : (righe.length === 1 ? righe[0] : null);
      var W = 1080, H = 1350, cv = tela(W, H), ctx = cv.getContext("2d");
      var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#06112b"); bg.addColorStop(0.45, "#0c2150"); bg.addColorStop(1, "#1d5a2b");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      if (una) {
        ctx.font = "900 64px " + FONT; ctx.fillText(testoCorto(ctx, "⚽ La rosa di " + una.nome, W - 80), W / 2, 120);
        ctx.font = "800 38px " + FONT; ctx.fillStyle = "#ffe066";
        ctx.fillText((una.pos ? una.pos + "° posto · " : "") + (una.gio ? numFanta(una.gio.punti) + " fantapunti · " : "") + "valore " + una.totale + (una.crediti != null && !una.gio ? " · " + una.crediti + " 💰 avanzati" : ""), W / 2, 185);
        var hc = campoTela(ctx, 110, 215, W - 220, una.kit || [], true), yl = 215 + hc + 28;
        // sotto il campetto la rosa in lista: ruolo, nome, squadra, quanto l'hai pagato e quanto vale
        ordinaRosa(una.kit || []).forEach(function (c, i) {
          var y = yl + i * 66, ru = FANTA_RUOLI[c.ruolo] || {};
          rett(ctx, 60, y, W - 120, 58, 14); ctx.fillStyle = i % 2 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.14)"; ctx.fill();
          ctx.textAlign = "left"; ctx.fillStyle = "#ffe066"; ctx.font = "900 26px " + FONT; ctx.fillText(ru.breve || "", 80, y + 41);
          ctx.fillStyle = "#fff"; ctx.font = "800 32px " + FONT; ctx.fillText(testoCorto(ctx, c.nome + (c.squadra ? " · " + c.squadra : ""), W - 520), 160, y + 42);
          ctx.textAlign = "right"; ctx.font = "800 28px " + FONT; ctx.fillStyle = "#ffe066";
          var gk = una.gio ? una.gio.cal[(una.kit || []).indexOf(c)] : null;   // (⚽ con la giornata: anche il fantavoto)
          ctx.fillText((c.prezzo ? c.prezzo + " 💰" : "") + (c.valore != null ? "  vale " + c.valore : "") + (gk ? "  ⚽ " + numFanta(gk.fv) : ""), W - 80, y + 41);
        });
      } else {
        ctx.font = "900 60px " + FONT; ctx.fillText("⚽ Le rose della serata", W / 2, 110);
        var n = Math.min(righe.length, 10), col = n <= 1 ? 1 : 2, rows = Math.ceil(n / col), gap = 24, top = 160, bottom = H - 130;
        var cw = (W - 60 - gap * (col - 1)) / col, chMax = (bottom - top - gap * (rows - 1)) / rows, cwFit = Math.min(cw, (chMax - 46) * 36 / 25);
        righe.slice(0, n).forEach(function (r, i) {
          var cx = 30 + (i % col) * (cw + gap) + (cw - cwFit) / 2, cy = top + Math.floor(i / col) * (chMax + gap);
          ctx.textAlign = "center"; ctx.fillStyle = r.pos === 1 ? "#ffe066" : "#fff"; ctx.font = "900 " + Math.round(Math.min(34, cwFit / 11)) + "px " + FONT;
          ctx.fillText(testoCorto(ctx, (r.pos === 1 ? "🏆 " : r.pos + "° ") + r.nome + " · " + (r.gio ? numFanta(r.gio.punti) + " punti" : r.totale), cwFit), cx + cwFit / 2, cy + 32);
          campoTela(ctx, cx, cy + 44, cwFit, r.kit || [], false);
        });
      }
      pieTela(ctx, W, H);
      condividiTela(cv, "asta-rosa.png", una ? "La mia rosa all'asta del fanta 🔨⚽" : "Le nostre rose all'asta del fanta 🔨⚽");
    } catch (e) {}
  }
  // il kit dei temi (uno in grande, o tutti a griglia): le carte con la fascia svelata e le stelle prese
  function fotoKit(giocatori, tema, mio) {
    try {
      var lista = giocatori.slice().sort(function (a, b) { return (b.stelle || 0) - (a.stelle || 0); });
      var una = mio ? lista.filter(function (g) { return g.nome === mio; })[0] : null;
      var W = 1080, H = 1350, cv = tela(W, H), ctx = cv.getContext("2d");
      var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#3d1620"); bg.addColorStop(0.5, "#5c2331"); bg.addColorStop(1, "#2c160b");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      var titolo = (tema ? (tema.icona || "🎁") + " " + (tema.nome || tema.temaNome || "") : "🎁 L'Asta");
      ctx.font = "800 40px " + FONT; ctx.fillStyle = "#ffe08a"; ctx.fillText(testoCorto(ctx, titolo, W - 80), W / 2, 80);
      var em = function (e) { return String(e || "").indexOf("svg:") === 0 ? "🔫" : (e || "•"); };   // (le icone disegnate diventano l'emoji)
      function scatola(g, x, y, w, h, big) {
        rett(ctx, x, y, w, h, 26); ctx.fillStyle = "#fff8e6"; ctx.fill();
        ctx.textAlign = "left"; ctx.fillStyle = "#2b1a10"; var fs = big ? 52 : Math.max(24, Math.min(36, w / 13));
        ctx.font = "900 " + fs + "px " + FONT; ctx.fillText(testoCorto(ctx, g.nome, w - 40 - fs * 3.2), x + 24, y + fs + 14);
        ctx.textAlign = "right"; ctx.fillStyle = "#c08400"; ctx.fillText(fmtMezzi(g.stelle || 0) + " ⭐", x + w - 22, y + fs + 14);
        var rh = Math.min(big ? 130 : 92, (h - fs - 40) / Math.max(1, g.kit.length)), yy = y + fs + 34;
        g.kit.forEach(function (c) {
          ctx.textAlign = "left"; ctx.font = Math.round(rh * 0.62) + "px " + FONT; ctx.fillStyle = "#2b2b2b"; ctx.fillText(em(c.emoji), x + 22, yy + rh * 0.68);
          ctx.font = "800 " + Math.round(rh * 0.36) + "px " + FONT; ctx.fillText(testoCorto(ctx, c.nome + (c.pacco ? " 🎁" : ""), w - rh * 2.2 - 40), x + 26 + rh * 0.9, yy + rh * 0.62);
          var t = c.tier === "M" ? "🧨" : c.tier; ctx.textAlign = "center";
          ctx.fillStyle = c.tier === "A" ? "#e0a90a" : c.tier === "B" ? "#5468c7" : c.tier === "M" ? "#0b0b0f" : "#adb5bd";
          ctx.beginPath(); ctx.arc(x + w - 22 - rh * 0.32, yy + rh * 0.48, rh * 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "900 " + Math.round(rh * 0.3) + "px " + FONT; ctx.fillText(t || "", x + w - 22 - rh * 0.32, yy + rh * 0.59);
          yy += rh;
        });
      }
      if (una) {
        ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 64px " + FONT; ctx.fillText(testoCorto(ctx, "🎒 Il kit di " + una.nome, W - 80), W / 2, 165);
        var hb = Math.min(H - 380, 150 + una.kit.length * 130); scatola(una, 70, Math.max(220, (220 + H - 150 - hb) / 2), W - 140, hb, true);
      } else {
        ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 58px " + FONT; ctx.fillText("🎒 I kit della serata", W / 2, 150);
        var n = Math.min(lista.length, 10), col = n <= 2 ? 1 : 2, rows = Math.ceil(n / col), gap = 20, top = 190, bottom = H - 130;
        var cw = (W - 60 - gap * (col - 1)) / col, ch = (bottom - top - gap * (rows - 1)) / rows;
        lista.slice(0, n).forEach(function (g, i) { scatola(g, 30 + (i % col) * (cw + gap), top + Math.floor(i / col) * (ch + gap), cw, ch, false); });
      }
      pieTela(ctx, W, H);
      condividiTela(cv, "asta-kit.png", una ? "Il mio kit all'Asta 🔨" : "I nostri kit all'Asta 🔨");
    } catch (e) {}
  }
  // la condivisione si apre subito, dentro il tocco (l'immagine è già pronta): se il telefono non la sa fare, si scarica
  function condividiTela(cv, nomeFile, testo) {
    var url = cv.toDataURL("image/png");
    try {
      var bin = atob(url.split(",")[1]), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var file = typeof File === "function" ? new File([arr], nomeFile, { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: testo + " · " + SITO }).catch(function () {});
        return;
      }
    } catch (e) {}
    try { var a = document.createElement("a"); a.href = url; a.download = nomeFile; document.body.appendChild(a); a.click(); a.parentNode.removeChild(a); } catch (e2) {}
  }
  window.__astaFoto = { rose: fotoRose, kit: fotoKit };   // (per le prove nel browser)



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
    var B = st.fase === "busta" ? st.busta : null;
    return {
      fase: st.fase, codice: st.codice, sessione: st.sessione, formato: "temi",
      temaNome: st.tema.nome, temaIcona: st.tema.icona, temaId: st.tema.id,
      temi: (window.SG_ASTA_TEMI || []).map(function (x) { return { id: x.id, nome: x.nome, icona: x.icona }; }),
      roundIdx: st.roundIdx, roundNome: r.nome, roundIcona: r.icona, totRound: TOT_ROUND,
      rounds: (st.tema.round || []).map(function (x) { return { nome: x.nome, icona: x.icona }; }),
      tipi: st.tipi.slice(), tipo: tipoDi(st.tipi, st.roundIdx), budget: st.crediti,   // 🎭 i round diversi; i crediti di partenza (per il banditore)
      giocatori: st.giocatori.map(function (g) {
        return { id: g.id, nome: g.nome, omino: g.omino || null, crediti: g.crediti, creditiSpesi: st.crediti - g.crediti, max: maxPuntataG(st, g),
          asteVinte: g.asteVinte || 0, stelle: g.stelle || 0, malus: g.malus || 0, haCarta: st.senzaCarta.indexOf(g.id) < 0, via: !!g.via, kit: g.kit.slice(),
          votiDa: st.fase === "fine" ? (g.votiDa || []) : undefined };
      }),
      maledetta: !!st.maledetta,   // 🧨 la regola (per la saletta)
      round: st.tipi.some(function (x) { return x !== "normale"; }) ? "misti" : "normali",
      mal: st.fase === "maledetta" && st.mal ? { n: st.mal.n, carta: st.mal.carta, ordine: st.mal.ordine.slice(), offerte: st.mal.offerte, prezzo: st.mal.prezzo,
        turnoId: st.mal.ordine[st.mal.turno % st.mal.ordine.length], giro: st.mal.giro, forzato: !!st.mal.forzato,
        resta: st.mal.scad ? Math.max(0, st.mal.scad - ora) : 0, durata: st.mal.durata || MAL_MS } : null,   // (il tempo che resta, non l'ora)
      malEsito: st.fase === "malEsito" ? st.malEsito : null,
      tavolo: st.tavolo.map(vistaCarta),   // (il pacco a sorpresa resta coperto)
      sceglieId: sceglie, sceglieNome: sceglie ? nomeDi(st, sceglie) : "",
      nScelta: st.nScelta, restaScelta: st.fineScelta ? Math.max(0, st.fineScelta - ora) : 0, durataScelta: st.durataScelta || SCELTA_MS,
      restaAuto: st.fineAuto ? Math.max(0, st.fineAuto - ora) : 0, durataAuto: st.durataAuto || 0,   // (esito e inizio round vanno avanti da soli)
      restaVoto: st.fase === "voto" && st.fineVoto ? Math.max(0, st.fineVoto - ora) : 0, durataVoto: st.durataVoto || 0,   // (il voto si chiude da solo)
      scenario: st.fase === "voto" || st.fase === "fine" ? st.scenario : null,
      asta: st.asta ? {
        n: st.nAsta, carta: vistaCarta(st.asta.carta), offerta: st.asta.offerta,
        leaderId: st.asta.leader, leaderNome: nomeDi(st, st.asta.leader),
        passati: Object.keys(st.asta.passati), tk: st.asta.tk || {}, giro: st.giro, resta: st.scadenza ? st.scadenza - ora : 0   // il tempo che resta (non l'ora: gli orologi dei telefoni non sono uguali)
      } : null,
      // ✉️ la busta chiusa: si vede solo CHI ha chiuso la busta, mai quanto ha offerto (le offerte le tiene l'host)
      busta: B ? { n: B.n, carta: vistaCarta(B.carta), chooserId: B.chooser, gara: B.gara.slice(), chiusi: Object.keys(B.offerte),
        resta: Math.max(0, B.fine - ora), durata: BUSTA_MS } : null,
      esito: st.esito || null,
      hannoVotato: Object.keys(st.voti || {}),
      classifica: st.classifica || null,
      titoli: st.fase === "fine" ? (st.titoli || []) : null
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
  // la ripresa (Passo 5): lo stato dell'host da ricordare è tutto st tranne i timer (campi con "_") e il tema (si ricorda solo
  // il suo id); toAt = l'ora del prossimo passo che va avanti da solo (esito, round, voto…). Le offerte segrete della ✉️ busta
  // chiusa NON si ricordano (la copia va anche al telefono del vice): se la partita riprende, la busta si riapre da capo.
  function statoDaRicordare(st, formato) {
    var s = { formato: formato, toAt: st._toFn ? st._toAt : null, temaId: st.tema ? st.tema.id : null };
    Object.keys(st).forEach(function (k) { if (k.charAt(0) !== "_" && k !== "tema" && k !== "morto" && k !== "pronta") s[k] = st[k]; });
    if (s.busta) s.busta = { n: s.busta.n, carta: s.busta.carta, chooser: s.busta.chooser, gara: s.busta.gara, offerte: {}, ord: 0, fine: s.busta.fine };
    return s;
  }
  function ripristina(st, R0) {
    Object.keys(R0).forEach(function (k) { if (k !== "formato" && k !== "toAt" && k !== "temaId") st[k] = R0[k]; });
    st.pronta = false;
  }
  // la partita di prima da riprendere (t.ripresa), una volta sola per partita (se poi in saletta si cambia modalità, il motore nuovo parte da zero)
  var RIP_USATA = null;
  function prendiRipresa(t, formato) {
    var s = t.ripresa && t.ripresa.stato;
    if (RIP_USATA === t || !s || s.formato !== formato || !s.fase || s.fase === "lobby" || !s.giocatori) return null;
    RIP_USATA = t; return s;
  }
  // ---- (online) ogni tocco su «Rilancio»/«Rialzo» è una mossa a sé: due tocchi = +2, anche fulminei e con la rete lenta ----
  // Il telefono tiene la coda dei suoi tocchi che l'host non ha ancora visto (cb._coda): il tocco nuovo parte dall'ultima
  // offerta che ha mandato lui (sarà sua, se l'host la accetta), non da quella della foto. Ogni tocco ha un numero che sale
  // (tk): l'host scarta un tocco già visto (lo stesso messaggio arrivato due volte) e scrive nella foto l'ultimo tocco visto
  // di ognuno (asta.tk), così il telefono sa quali suoi tocchi sono già arrivati.
  var ATTESA_TOCCO_MS = 4000;   // un tocco che dopo 4 secondi l'host non ha ancora visto si è perso: si torna alla foto
  // a: l'asta della foto ({ offerta, leaderId, tk }), n: quale asta. Torna l'offerta come la vedo io: { offerta, leader, inArrivo }
  function vistaTocchi(cb, n, a) {
    var c = cb._coda, vera = { offerta: a.offerta, leader: a.leaderId || null };
    if (!c || c.n !== n || !cb.myId) { cb._coda = null; return vera; }
    var visto = (a.tk && a.tk[cb.myId]) || 0;
    c.tocchi = c.tocchi.filter(function (x) { return x.tk > visto; });
    var primo = c.tocchi[0], ultimo = c.tocchi[c.tocchi.length - 1];
    // il primo tocco ancora per strada parte da quello che mostra la foto? Se no qualcuno è arrivato prima (o un tocco si è perso)
    if (!primo || primo.vista !== vera.offerta || primo.vl !== String(vera.leader || "") || Date.now() - ultimo.ora > ATTESA_TOCCO_MS) { cb._coda = null; return vera; }
    return { offerta: ultimo.prezzo, leader: cb.myId, inArrivo: true };
  }
  // manda un tocco: da: { offerta, leader } (l'offerta come la vedo io), prezzo: dove voglio arrivare
  function mandaTocco(cb, n, da, prezzo, ridisegna) {
    // il numero sale sempre, anche dopo una ricarica con l'orologio del telefono tornato indietro: mai sotto l'ultimo tocco
    // mio che l'host ha già visto (asta.tk nella foto), se no l'host lo scarterebbe come un doppione
    var fa = cb._vmA && cb._vmA.asta, visto = (fa && fa.tk && +fa.tk[cb.myId]) || 0;
    var ora = Date.now(), tk = Math.max((cb._tk || 0) + 1, ora, visto + 1); cb._tk = tk;
    var c = cb._coda && cb._coda.n === n ? cb._coda : (cb._coda = { n: n, tocchi: [] });
    c.tocchi.push({ tk: tk, vista: da.offerta, vl: String(da.leader || ""), prezzo: prezzo, ora: ora });
    cb.onRilancia({ n: n, prezzo: prezzo, vista: da.offerta, vl: String(da.leader || ""), tk: tk });
    if (ridisegna) {
      ridisegna();   // il mio tabellone mostra subito l'offerta in arrivo
      clearTimeout(cb._toTocco);   // (se il tocco si perde, tra poco si torna alla foto)
      cb._toTocco = setTimeout(function () { if (cb._coda && !cb._uscito) ridisegna(); }, ATTESA_TOCCO_MS + 100);
    }
  }
  // (host) un tocco arrivato. Torna il prezzo buono, "doppio" (tocco già visto: niente), "attesa" (il seguito di un suo tocco
  // che non è ancora arrivato: lo tengo da parte in a.attesa), "tardi" (partiva da un'offerta che non c'è più) o null
  function toccoArrivato(a, id, m, senzaCapo, salti) {
    if (m.tk == null) return prezzoOfferto(m, a.offerta, senzaCapo, salti);   // (telefoni di prima)
    var tk = +m.tk; a.tk = a.tk || {};
    if (!(tk > (a.tk[id] || 0))) return "doppio";
    if (m.vista !== a.offerta || String(m.vl || "") !== String(a.leader || "")) {
      // partiva da una mia offerta che non c'è ancora (più alta di quella di adesso, o uguale ma di un altro): è il seguito di
      // un mio tocco ancora per strada. Vale anche se l'offerta più alta è già mia: coi tocchi arrivati in disordine il terzo
      // può arrivare prima del secondo (si tiene da parte, se no il secondo sembrerebbe un doppione e si perderebbero tutti e due)
      if (m.vl === String(id) && m.vista >= a.offerta) { a.attesa = a.attesa || {}; (a.attesa[id] = a.attesa[id] || []).push(m); return "attesa"; }
      a.tk[id] = tk; return "tardi";
    }
    a.tk[id] = tk;
    return prezziSalto(a.offerta, senzaCapo, salti).indexOf(m.prezzo) >= 0 ? m.prezzo : null;
  }
  function inAttesa(a, id) { var l = a && a.attesa && a.attesa[id]; if (!l || !l.length) return []; delete a.attesa[id]; return l.sort(function (x, y) { return x.tk - y.tk; }); }
  // i prezzi che si possono offrire adesso coi salti: base = l'offerta (o, nel fanta senza offerte, una in meno: il primo +1 la prende al prezzo di partenza)
  function prezziSalto(offerta, senzaCapo, salti) { var base = senzaCapo ? offerta - 1 : offerta; return salti.map(function (s) { return base + s; }); }
  // (host) un'offerta arrivata: { prezzo, vista (l'offerta che vedeva) }. Torna il prezzo buono, "tardi" (ha visto un prezzo vecchio) o null.
  // Senza "vista" (telefoni di prima) vale solo il +1, come sempre.
  function prezzoOfferto(m, offerta, senzaCapo, salti) {
    var p = prezziSalto(offerta, senzaCapo, salti);
    if (m.vista == null) return m.prezzo === p[0] ? m.prezzo : "tardi";
    if (m.vista !== offerta) return "tardi";
    return p.indexOf(m.prezzo) >= 0 ? m.prezzo : null;
  }

  // ---------- L'HOST ----------
  function hostAsta(t, tema, crediti) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var IO = t.mioId || "host";   // io che tengo la partita ("host", o l'amico che ha preso il posto dell'host)
    var st = {
      tema: tema, crediti: crediti, sessione: null, roundIdx: 0, chooserPtr: 0,
      tavolo: [], senzaCarta: [], asta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, codice: "…", scadenza: null, _to: null, voti: {}, giro: 0,
      nAsta: 0, nScelta: 0, fineScelta: null, fineAuto: null,
      tipi: tipiPartita(t.impostazioni), busta: null, nBusta: 0, scenario: null, titoli: null,   // 🎭 i round diversi, ✉️ la busta chiusa, 🎬 lo scenario del voto
      maledetta: !!(t.impostazioni && t.impostazioni.maledetta), malPiano: null, mal: null, malEsito: null, nMal: 0,   // 🧨 la carta maledetta
      giocatori: [{ id: IO, nome: (t.giocatori && t.giocatori[0]) || "Host", crediti: crediti, kit: [], stelle: 0, asteVinte: 0, st: statNuove(), omino: t.mioOmino ? t.mioOmino() : null }]
    };
    // la partita di prima (l'host ha ricaricato, o un amico ha preso il suo posto: t.ripresa): stessi crediti, stesse carte, stessa fase (vedi riprendi)
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
      if (formatoDi(t, im) === "fanta") { st.morto = true; TM.smetti(); return avviaAsta(t); }
      var temi = window.SG_ASTA_TEMI || [];
      st.tema = temi.filter(function (x) { return x.id === im.tema; })[0] || st.tema;
      st.crediti = im.crediti || 15;
      st.maledetta = !!im.maledetta;
      st.tipi = tipiPartita(im);
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
        if (st.fase === "busta" && bustaPiena()) return apriBuste();   // ✉️ gli altri hanno già chiuso la busta: si aprono
        if (st.fase === "scelta" && chiSceglie() === g) tempoScelta();   // tocca a lui scegliere: tra un attimo una carta a caso
        if (st.fase === "maledetta" && st.mal) {   // 🧨 era il suo turno: tocca al prossimo (tiene l'offerta che aveva); se resta uno solo, se la prende lui
          if (malDi() === g) { st.mal.turno++; return turnoMalO(); }
          if (attiviMal().length <= 1) return turnoMalO();
        }
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
            st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), crediti: st.crediti, kit: [], stelle: 0, asteVinte: 0, st: statNuove(), omino: avatarOk(m.omino) });
          bd();
          if (gj) {   // (dopo la foto) i suoi segreti: la ✉️ busta che aveva già chiuso e il ⭐ kit che aveva votato
            var mia = st.fase === "busta" && st.busta && st.busta.offerte[id];
            if (mia) rete.inviaA(id, { t: "tuaBusta", a: id, n: st.busta.n, q: mia.q });   // (va a tutti: lo legge solo lui, «a»)
            if (st.fase === "voto" && st.voti[id] != null) rete.inviaA(id, { t: "tuoVoto", a: id, s: st.sessione, per: st.voti[id] });
          }
        }
        else if (m.t === "scegli") scegli(id, m);
        else if (m.t === "rilancia") rilanciaO(id, m);
        else if (m.t === "passa") passaO(id, m);
        else if (m.t === "busta") bustaO(id, m);
        else if (m.t === "voto") voto(id, m);
        else if (m.t === "mal") malMossa(id, m);
      },
      onErrore: function (e) {
        // un errore di rete passeggero: la rete si ricollega da sola e rimanda l'ultima foto, quindi la partita NON si ferma
        if (st.iniziata || st.pronta) return;
        if (e && e.type === "no-mqtt") return senzaRete(t);
        erroreSchermo(t, "Non riesco ad aprire la stanza. Controlla la connessione e riprova.");
      }
    };
    var rete = ospitaAsta(cbRete, { ripresa: ripresa }, "asta");   // (con la ripresa gli amici non tornano in saletta)

    function invia() {
      rete.invia({ t: "vm", vm: vmAsta(st) }); ricorda();
      if (t.aCheSiamo && st.iniziata && ["round", "scelta", "asta", "esito", "busta", "maledetta", "malEsito"].indexOf(st.fase) >= 0) t.aCheSiamo("round " + (st.roundIdx + 1) + " di " + TOT_ROUND);   // (nella Sala, per chi è fuori)
      else if (t.aCheSiamo && st.iniziata && st.fase === "voto") t.aCheSiamo("si votano i kit");
    }
    // la partita com'è adesso, per riprenderla se ricarico la pagina o se un amico prende il mio posto (in saletta niente)
    function ricorda() { if (!st.morto && t.ricorda) t.ricorda(st.iniziata && st.fase !== "lobby" ? statoDaRicordare(st, "temi") : null); }
    var dopoTM = TM.dopo; TM.dopo = function (fn, ms) { dopoTM(fn, ms); ricorda(); };   // (anche l'ora del prossimo passo)
    function bd() { invia(); disegna(); }
    // la ripresa: si ricomincia dalla stessa fase coi secondi che restavano (almeno 5). Il lotto all'asta riparte da capo a 1
    // credito da chi l'aveva scelto (i crediti si pagano solo all'aggiudicazione); la ✉️ busta chiusa si riapre da capo (le offerte
    // segrete restano solo sul telefono di prima); la 🧨 carta maledetta riprende dal turno di chi doveva decidere; il voto continua
    // coi secondi che mancano e coi voti già dati
    function riprendi() {
      tAttesi = setTimeout(function () { Object.keys(attesi).forEach(function (id) { cbRete.onAddio(id); }); }, 10000);
      var f = st.fase, ms = Math.max(5000, ((t.ripresa.ora(R0.toAt) || 0) - Date.now()));
      st.scadenza = null;
      if (f === "round" || f === "esito" || f === "malEsito") { avantiDaSolo(ms); return bd(); }
      if (f === "scelta") { tempoScelta(Math.max(8000, ms)); return bd(); }
      if (f === "voto") { st.fineVoto = Date.now() + ms; TM.dopo(function () { verificaVoti(true); }, ms); bd(); return verificaVoti(); }
      if (f === "maledetta" && st.mal) return turnoMalO();
      if (f === "busta" && st.busta) {
        var B = st.busta, idx = -1;
        st.tavolo.forEach(function (c, i) { if (idx < 0 && c.nome === B.carta.nome) idx = i; });
        st.busta = null; st.fase = "scelta";
        return idx >= 0 ? apriBusta(B.chooser, idx) : prossima();
      }
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
      st.iniziata = true; st.sessione = nuovaSessione(); st.roundIdx = 0;
      st.malPiano = st.maledetta ? pianoMaledetta(st.giocatori.length) : null; st.mal = null; st.malEsito = null;   // 🧨 quando uscirà la carta maledetta
      nuovoRound();
    }
    function avantiDaSolo(ms, fn) {   // l'esito e l'inizio del round restano un attimo, poi si va avanti da soli
      st.fineAuto = Date.now() + ms; st.durataAuto = ms;
      TM.dopo(fn || prossima, ms);
    }
    function nuovoRound() {
      stopTo();
      var r = st.tema.round[st.roundIdx], tipo = tipoDi(st.tipi, st.roundIdx);
      st.tavolo = tavoloRound(r, st.giocatori.length, st.tema.id, tipo);
      st.senzaCarta = st.giocatori.map(function (g) { return g.id; });
      st.chooserPtr = st.roundIdx;
      st.asta = null; st.esito = null; st.scadenza = null; st.fineScelta = null; st.busta = null;
      st.fase = "round";
      avantiDaSolo(tipo === "normale" ? AUTO_ROUND_MS : AUTO_ROUND_TIPO_MS);   // (un round speciale resta di più: c'è da leggere come si gioca)
      FX.round(); bd();
    }
    function prossima() {
      stopTo(); st.fineAuto = null;
      if (devoMal()) return apriMalO();   // 🧨 tocca alla carta maledetta (una volta a partita)
      if (st.senzaCarta.length === 0) return fineRoundO();
      if (st.senzaCarta.length === 1 && st.tavolo.length === 1) {
        var g = perId(st, st.senzaCarta[0]), carta = st.tavolo[0];
        g.crediti -= 1; Array.prototype.push.apply(g.kit, carteVinte(carta, 1));
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
    // m: { idx, n (quale scelta), nome (della carta, come la vede lui) }: una scelta arrivata in ritardo (rete lenta) non tocca un tavolo diverso
    function scegli(id, m, aCaso) {
      if (st.fase !== "scelta" || !st.senzaCarta.length) return;
      var ch = chiSceglie(); if (!ch || id !== ch.id) return;
      var idx = aCaso != null ? aCaso : (m ? m.idx : null);
      if (idx == null || idx < 0 || idx >= st.tavolo.length) return;
      if (aCaso == null && (!m || (m.n != null && (m.n !== st.nScelta || vistaCarta(st.tavolo[idx]).nome !== m.nome)))) return;
      stopTo(); st.fineScelta = null;
      if (tipoDi(st.tipi, st.roundIdx) === "busta") return apriBusta(id, idx);   // ✉️ busta chiusa: tutti offrono in segreto
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
    // m: { n (quale asta), prezzo, vista + vl (l'offerta e chi l'aveva, come le vedeva lui), tk (il numero del tocco) }:
    // ogni tocco conta una volta sola (lo stesso tocco arrivato due volte no) e un tocco partito da un'offerta che non c'è più
    // non conta; il secondo tocco di chi ha appena preso l'offerta è un rialzo da solo (due tocchi = +2). I salti +1 e +3
    function rilanciaO(id, m) {
      if (st.fase !== "asta" || !st.asta || !m || (m.n != null && m.n !== st.nAsta)) return;
      var g = perId(st, id); if (!g) return;
      if (st.senzaCarta.indexOf(id) < 0) return;   // (anche chi ha già l'offerta più alta può rialzare da solo: è strategia)
      var a = st.asta, p = toccoArrivato(a, id, m, false, SALTI_TEMI);
      if (p === "tardi") { if (a.leader !== id) tardi(id); if (m.tk != null) bd(); return; }   // (un tocco vecchio di chi guida non conta, senza "troppo tardi"; la foto dice al suo telefono che è arrivato)
      if (p === "doppio" || p === "attesa") return;
      if (p == null || maxPuntataG(st, g) < p) { if (m.tk != null) bd(); return; }   // (la foto dice al suo telefono che il tocco è arrivato)
      segnaRilancio(g, p - a.offerta, 3);
      a.ultimoSec = st.scadenza && st.scadenza - Date.now() < 2000 ? id : null;   // 🎯 all'ultimo secondo
      a.offerta = p; a.leader = id;
      delete a.passati[id];
      FX.rilancio(id === IO);
      if (!verificaPassati()) riparti();   // se nessun altro può più offrire, è subito sua
      inAttesa(st.asta, id).forEach(function (x) { rilanciaO(id, x); });   // i suoi tocchi arrivati prima di questo
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
    // il lotto va a chi ha vinto (anche dalla busta chiusa): paga, lo mette nel kit, il prossimo sceglie
    function assegna(g, carta, prezzo, cecchino) {
      g.crediti -= prezzo; Array.prototype.push.apply(g.kit, carteVinte(carta, prezzo));
      g.asteVinte = (g.asteVinte || 0) + 1;
      segnaVinta(g, prezzo, carta, cecchino, false);
      var idx = st.tavolo.indexOf(carta); if (idx >= 0) st.tavolo.splice(idx, 1);
      st.senzaCarta = st.senzaCarta.filter(function (x) { return x !== g.id; });
      st.chooserPtr++;
    }
    function chiudi() {
      if (st.fase !== "asta" || !st.asta) return;
      stopTo();
      var a = st.asta, g = perId(st, a.leader);
      if (!g) { st.asta = null; return prossima(); }
      assegna(g, a.carta, a.offerta, a.ultimoSec === g.id);
      st.esito = { chiId: g.id, chiNome: g.nome, carta: a.carta, prezzo: a.offerta, automatica: false };
      st.asta = null; st.scadenza = null; st.fase = "esito";
      avantiDaSolo(AUTO_ESITO_MS);
      FX.aggiudicato(); bd();
    }
    // ---- ✉️ la busta chiusa (online): le offerte arrivano solo all'host; tutti vedono solo chi ha chiuso la busta ----
    function apriBusta(chooser, idx) {
      st.nBusta++;
      st.busta = { n: st.nBusta, carta: st.tavolo[idx], chooser: chooser, gara: st.senzaCarta.slice(), offerte: {}, ord: 0, fine: Date.now() + BUSTA_MS };
      st.fase = "busta"; st.asta = null; st.esito = null; st.scadenza = null;
      TM.dopo(apriBuste, BUSTA_MS);
      if (bustaPiena()) return apriBuste();
      FX.round(); bd();
    }
    function bustaPiena() { var B = st.busta; return !!B && B.gara.every(function (id) { var g = perId(st, id); return B.offerte[id] || !g || g.via; }); }
    // m: { n (quale busta), q (l'offerta) }: una busta sola a testa, che non si cambia
    function bustaO(id, m) {
      var B = st.busta; if (st.fase !== "busta" || !B || !m || m.n !== B.n || B.gara.indexOf(id) < 0 || B.offerte[id]) return;
      var g = perId(st, id); if (!g) return;
      var min = id === B.chooser ? 1 : 0, q = Math.max(min, Math.min(Math.floor(+m.q || 0), Math.max(min, maxPuntataG(st, g))));
      B.offerte[id] = { q: q, ord: ++B.ord };
      if (id === IO) cb._busta = { n: B.n, q: q, chiusa: true };
      FX.rilancio(id === IO);
      if (bustaPiena()) return apriBuste();
      bd();
    }
    function apriBuste() {
      var B = st.busta; if (st.fase !== "busta" || !B) return;
      stopTo();
      // chi non ha chiuso la busta in tempo non offre niente (chi ha scelto la carta offre 1); a pari offerta vince chi ha chiuso prima
      var lista = B.gara.map(function (id) { var g = perId(st, id), o = B.offerte[id]; return { id: id, nome: g ? g.nome : "", q: o ? o.q : (id === B.chooser ? 1 : 0), ord: o ? o.ord : 999 + (id === B.chooser ? 0 : 1) }; });
      lista.sort(function (x, y) { return (y.q - x.q) || (x.ord - y.ord); });
      var w = lista[0], g = perId(st, w.id), prezzo = Math.max(1, w.q);
      st.busta = null;
      if (!g) return prossima();
      assegna(g, B.carta, prezzo, false);
      st.esito = { chiId: g.id, chiNome: g.nome, carta: B.carta, prezzo: prezzo, automatica: false, buste: lista.map(function (x) { return { id: x.id, nome: x.nome, q: x.q }; }) };
      st.fase = "esito";
      avantiDaSolo(AUTO_BUSTE_MS);
      FX.aggiudicato(); bd();
    }
    // ---- 🧨 la carta maledetta (online): il tempo e i turni li tiene l'host ----
    function devoMal() { var P = st.malPiano; return !!(P && !P.fatta && st.roundIdx === P.round && st.senzaCarta.length <= P.quando); }
    function maxMalG(g) { return maxPuntataG(st, g) - (st.senzaCarta.indexOf(g.id) >= 0 ? 1 : 0); }   // (tiene anche 1 credito per la carta di questo round, se non ce l'ha)
    function malDi() { var M = st.mal; return M ? perId(st, M.ordine[M.turno % M.ordine.length]) : null; }
    function attiviMal() { return st.mal ? st.mal.ordine.filter(function (id) { var g = perId(st, id); return g && !g.via; }) : []; }
    function apriMalO() {
      st.malPiano.fatta = true;
      var carta = cartaMaledetta(); if (!carta) return prossima();
      var ids = st.giocatori.map(function (g) { return g.id; }), da = Math.floor(Math.random() * ids.length);
      st.nMal++;
      st.mal = { n: st.nMal, carta: carta, ordine: ids.slice(da).concat(ids.slice(0, da)), turno: 0, offerte: {}, prezzo: 0, giro: 0 };   // si comincia da uno a caso
      st.fase = "maledetta"; st.asta = null; st.esito = null; st.malEsito = null; st.scadenza = null;
      FX.maledetta();
      turnoMalO();
    }
    function turnoMalO() {
      var M = st.mal; if (st.fase !== "maledetta" || !M) return;
      stopTo();
      // chi non c'è salta il turno (tiene l'offerta che aveva fatto); se resta uno solo, se la prende lui
      var att = attiviMal();
      if (att.length <= 1) return prendeMalO(att.length ? att[0] : M.ordine[M.turno % M.ordine.length], true);
      for (var i = 0; i < M.ordine.length && (!malDi() || malDi().via); i++) M.turno++;
      var g = malDi(), forz = maxMalG(g) < M.prezzo + 1, ms = forz ? MAL_MS_FORZATO : MAL_MS, gi;
      M.giro++; gi = M.giro; M.scad = Date.now() + ms; M.durata = ms; M.forzato = forz;
      TM.dopo(function () { if (st.mal === M && M.giro === gi) prendeMalO(g.id, true); }, ms);   // tempo scaduto: se la prende
      bd();
    }
    // m: { n (quale carta maledetta), a: "paga" (prezzo: quello che ha visto + 1) | "prendo" (g: il turno che ha visto) }
    function malMossa(id, m) {
      var M = st.mal; if (st.fase !== "maledetta" || !M || !m || m.n !== M.n) return;
      var g = malDi(); if (!g || g.id !== id) return;   // solo chi è di turno
      if (m.a === "prendo") { if (m.g != null && m.g !== M.giro) return; return prendeMalO(id, false); }
      if (m.a === "paga") {
        if (M.forzato || m.prezzo !== M.prezzo + 1 || maxMalG(g) < m.prezzo) return;
        M.prezzo = m.prezzo; M.offerte[id] = m.prezzo; M.turno++;
        FX.rilancio(id === IO);
        turnoMalO();
      }
    }
    function prendeMalO(id, scaduto) {
      var M = st.mal; if (st.fase !== "maledetta" || !M) return;
      stopTo();
      var chi = perId(st, id) || perId(st, M.ordine[0]), paga = [];
      st.giocatori.forEach(function (g) { var q = M.offerte[g.id] || 0; if (g.id !== chi.id && q > 0) { g.crediti -= q; paga.push({ id: g.id, nome: g.nome, quanto: q }); } });   // gli altri pagano quello che hanno offerto
      chi.kit.push(M.carta);   // chi se la prende non paga niente (si riprende la sua offerta)
      st.malEsito = { n: M.n, chiId: chi.id, chiNome: chi.nome, carta: M.carta, paga: paga, ripresa: M.offerte[chi.id] || 0, scaduto: !!scaduto };
      st.mal = null; st.fase = "malEsito";
      avantiDaSolo(AUTO_MAL_MS);
      FX.aggiudicato(); bd();
    }
    function avanti() {
      if (st.fase === "esito" || st.fase === "round" || st.fase === "malEsito") return prossima();
    }
    // finito l'ultimo round: esce la carta-scenario e si vota a un tocco (il tempo per tutti, poi si chiude da solo)
    function fineRoundO() {
      st.roundIdx++;
      if (st.roundIdx < TOT_ROUND) return nuovoRound();
      stopTo(); st.fineAuto = null;
      var ms = votoMs(st.giocatori.length);
      st.scenario = scenarioDi(st.tema);
      st.fase = "voto"; st.voti = {}; st.fineVoto = Date.now() + ms; st.durataVoto = ms;
      TM.dopo(function () { verificaVoti(true); }, ms);
      FX.round(); bd();
    }
    // m: { per (l'id del kit votato), s (la partita) }: si può cambiare idea finché il voto è aperto; il proprio kit non vale.
    // (i telefoni di prima mandano { voti: {…} }: conta come "ha votato", senza stella)
    function voto(id, m) {
      if (st.fase !== "voto" || !m || (m.s != null && m.s !== st.sessione)) return;   // (un voto rimasto indietro dalla partita prima non conta)
      if (!perId(st, id)) return;
      var per = m.per != null ? m.per : null;
      if (per != null && (per === id || !perId(st, per))) return;
      if (per == null && st.voti[id] != null) return;
      st.voti[id] = per;
      bd(); verificaVoti();
    }
    // si chiude quando hanno votato tutti quelli che ci sono, oppure allo scadere del tempo (o quando l'host la chiude):
    // ogni voto è una ⭐ per quel kit; poi la 🧨 e la classifica (a pari stelle: il kit che vale di più, poi i crediti)
    function verificaVoti(forza) {
      if (st.fase !== "voto") return;
      var tutti = st.giocatori.every(function (g) { return st.voti[g.id] !== undefined || g.via; });   // chi non c'è non blocca la votazione
      if (!tutti && !forza) return;
      stopTo(); st.fineVoto = null;
      st.giocatori.forEach(function (g) { g.stelle = 0; g.votiDa = []; });
      st.giocatori.forEach(function (chi) {
        var g = perId(st, st.voti[chi.id]);
        if (g && g !== chi) { g.stelle += 1; g.votiDa.push(chi.nome); }
      });
      malusVoto(st.giocatori);   // 🧨 chi ha la carta maledetta: −0,5 ⭐
      st.classifica = classificaStelle(st.giocatori);
      st.titoli = titoliFine(st.giocatori, st.crediti, null);
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
      st.fineScelta = null; st.fineAuto = null; st.fineVoto = null; st.busta = null; st.scenario = null; st.titoli = null;
      st.mal = null; st.malEsito = null; st.malPiano = null;
      st.giocatori = st.giocatori.filter(function (g) { return !g.via; });   // chi non c'è più esce dalla stanza
      st.giocatori.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });   // (chi tiene la partita è il primo: in saletta ha la corona)
      st.giocatori.forEach(function (g) { g.crediti = st.crediti; g.kit = []; g.stelle = 0; g.asteVinte = 0; g.malus = 0; g.votiDa = []; g.st = statNuove(); });
      cb._busta = null;
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
      onBusta: function (x) { bustaO(IO, x); },
      onAvanti: avanti,
      onVoto: function (x) { voto(IO, { per: x.per, s: st.sessione }); },
      onMal: function (x) { malMossa(IO, x); },
      onChiudiVoti: function () { if (st.fase === "voto") t.conferma("Chiudere il voto?", "Chi non ha votato non dà la sua stella.", "Chiudi", function () { if (st.fase === "voto") verificaVoti(true); }); },
      onEsci: function () { stopTo(); clearTimeout(tAttesi); if (t.ricorda) t.ricorda(null); TM.smetti(); cb._uscito = true; fermaTutto(); rete.chiudi(); t.esci(); }
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
    // ⏱️ il botta e risposta con l'orologio dell'host: 5 subito, poi uno ogni 4 secondi (e 3 quando il telefono si risveglia)
    azzeraOrologio(null);
    function chiediOra(n) { for (var k = 0; k < n; k++) setTimeout(function () { if (!cb._uscito && S.rete) manda({ t: "ora", c: Date.now() }); }, k * 300); }
    var ivOra = setInterval(function () { if (cb._uscito) return clearInterval(ivOra); if (S.vm && S.vm.formato === "fanta") chiediOra(1); }, 4000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden && !cb._uscito && S.vm && S.vm.formato === "fanta") chiediOra(3); });
    var cb = {
      myId: null, sonoHost: false,
      onScegli: function (x) { manda({ t: "scegli", idx: x.idx, n: x.n, nome: x.nome }); },
      onRilancia: function (x) { manda({ t: "rilancia", n: x.n, prezzo: x.prezzo, vista: x.vista, vl: x.vl, tk: x.tk }); },   // (ogni tocco col suo numero: vedi mandaTocco)
      onPassa: function (x) { manda({ t: "passa", n: x.n }); },
      onBusta: function (x) { manda({ t: "busta", n: x.n, q: x.q }); },
      onAvanti: function () {},
      onVoto: function (x) { manda({ t: "voto", per: x.per, s: S.vm && S.vm.sessione }); },
      onMal: function (x) { manda({ t: "mal", n: x.n, a: x.a, prezzo: x.prezzo, g: x.g }); },
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
      var s = t.schermata({ chiara: true, icona: "🔨", titolo: "Entra all'asta", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
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
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null }); chiediOra(5);
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (!m) return;
          if (m.t === "vm") {
            if (m.vm && m.vm.oraDi && m.vm.oraDi !== OROLOGIO.di) { azzeraOrologio(m.vm.oraDi); chiediOra(5); }   // (chi tiene la partita è cambiato: si rimisura)
            if (m.vm) stimaOra(m.vm.ora);
            S.vm = m.vm; disegna();
          }
          else if (m.t === "ora" && m.a === S.myId) campioneOra(m.c, m.h);   // ⏱️ la risposta dell'host
          else if (m.t === "tardi" && m.a === S.myId) { cb._tardi = Date.now(); disegna(); }   // il mio rilancio è arrivato quando il prezzo era già salito
          else if (m.t === "tuaBusta" && m.a === S.myId && m.n != null) { cb._busta = { n: m.n, q: m.q, chiusa: true }; disegna(); }   // ✉️ (rientrato) la busta che avevo già chiuso
          else if (m.t === "tuoVoto" && m.a === S.myId && m.s === (S.vm && S.vm.sessione)) { cb._mioVoto = { s: m.s, per: m.per }; disegna(); }   // ⭐ (rientrato) il kit che avevo votato
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
    var s = t.schermata({ chiara: true, icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ chiara: true, icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---------- DISEGNO CONDIVISO (host e ospiti) ----------
  function mezzo(x) { return Math.round((x || 0) * 2) / 2; }
  function fmtMezzi(x) { x = mezzo(x); return (x % 1 === 0) ? String(x) : x.toFixed(1).replace(".", ","); }

  // pannello coi kit di tutti (Asta classica): si apre dal tasto «🃏 Carte» durante l'asta
  function pannelloKit(el, giocatori) {
    var box = el("div", { class: "as-rose" });
    box.appendChild(el("div", { class: "etichetta", style: "margin-top:6px", text: "I kit finora" }));
    (giocatori || []).forEach(function (g) {
      var card = el("div", { class: "as-rose-p" });
      card.appendChild(el("div", { class: "as-rose-nome", text: g.nome + " · " + g.crediti + "💰" }));
      if (!g.kit || !g.kit.length) card.appendChild(el("div", { class: "as-rose-vuota", text: "ancora niente" }));
      else g.kit.forEach(function (c) {
        card.appendChild(el("div", { class: "as-rose-riga" + (c.maledetta ? " maled" : "") }, [
          el("span", icoAttr("as-rose-em", c.emoji)),
          el("span", { class: "as-rose-txt", text: c.nome }), segnoKit(el, c),
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
    var wrap = el("div", { class: "as-testa-round" });
    wrap.appendChild(el("div", { class: "as-round", style: "margin:6px 0 4px" }, [
      el("div", { class: "n", text: "Round " + (vm.roundIdx + 1) + " di " + vm.totRound })
    ]));
    if (vm.rounds && vm.rounds.length) wrap.appendChild(strisciaRound(el, vm.rounds, vm.roundIdx, vm.tipi));
    else wrap.appendChild(el("div", { class: "as-round" }, [ el("div", { class: "t", text: (vm.roundIcona || "") + " " + (vm.roundNome || "") }) ]));
    return wrap;
  }
  function nodoKitVm(el, g, rivela) {
    var box = el("div", { class: "as-kit" });
    box.appendChild(el("h3", { text: g.nome + " · " + g.crediti + " 💰 avanzati" }));
    if (rivela && g.votiDa) box.appendChild(el("div", { class: "as-voti-da", text: g.votiDa.length ? "⭐ da " + g.votiDa.join(", ") : "nessuna ⭐" }));   // chi ha votato chi
    g.kit.forEach(function (c) {
      box.appendChild(el("div", { class: "riga" + (c.maledetta ? " maled" : "") }, [
        el("span", icoAttr("em", c.emoji)),
        el("span", { style: "flex:1", text: c.nome }), segnoKit(el, c),
        cellaTier(el, c.tier, rivela)
      ]));
    });
    return box;
  }

  function disegnaAstaVM(t, vm, cb) {
    cb._vmA = vm;   // (l'ultima foto: un tocco in arrivo si ridisegna solo se si è ancora in quell'asta)
    var el = t.el, myId = cb.myId;
    if (vm.fase === "lobby") { cb._busta = null; cb._mioVoto = null; return lobbyAsta(t, vm, cb); }
    if (vm.fase === "fine") return schermataFineAsta(t, vm, cb);
    // (online) l'asta si gioca nella sala; finita, il martello batte prima di mostrare chi l'ha presa
    var M = cb._martello;   // la stessa foto rimandata mentre batte il martello (qualcuno rientra): la tengo per dopo, il martello finisce
    if (M && Date.now() < M.fino && vm.fase === "esito" && vm.esito && vm.esito.carta && M.k === chiaveVM(vm, vistaCarta(vm.esito.carta))) { M.vm = vm; return; }
    var ver = cb._ver = (cb._ver || 0) + 1;
    if (vm.fase === "maledetta" && vm.mal) return salaMalVM(t, vm, cb);   // 🧨 l'asta al contrario della carta maledetta
    if (MAL) fermaMal();
    if (vm.fase === "busta" && vm.busta) return salaBustaVM(t, vm, cb);   // ✉️ la busta chiusa
    if (BUS) fermaBus();
    if (vm.fase === "asta") return salaAstaVM(t, vm, cb);
    if (vm.fase === "voto") return votoVM(t, vm, cb);                     // ⭐ il voto a un tocco
    cb._voto = null;
    if (vm.fase === "esito" && vm.esito && vm.esito.carta && SALA && SALA.chiave === chiaveVM(vm, vistaCarta(vm.esito.carta))) {
      var e0 = vm.esito, m = cb._martello = { k: chiaveVM(vm, vistaCarta(e0.carta)), fino: Date.now() + 1600, vm: vm };
      return aggiudica(battutaAggiudica(e0.chiNome, e0.prezzo, vm.budget), function () { cb._martello = null; if (cb._ver === ver && !cb._uscito) disegnaAstaVM(t, m.vm, cb); }, "AGGIUDICATO!");
    }

    var esci = function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); };
    var s = vm.fase === "scelta" ? t.schermata({ indietro: esci })   // la scelta della carta: il tavolo prima di tutto (niente titolo)
      : t.schermata({ sotto: "Stanza " + (vm.codice || ""), icona: "🔨", titolo: titoloFaseAsta(vm, myId), indietro: esci });
    s.classList.add("as-fissa");   // (alta come lo schermo: «Avanti ▶» sempre a vista anche a 360x640, se serve scorre solo il centro)

    s._contenuto.appendChild(testaRound(el, vm));
    s._contenuto.appendChild(strisciaOnline(el, vm, myId));
    if (t.guarda) s.classList.add("as-targa");   // chi guarda col link: in basso il posto della targhetta del core

    if (vm.fase === "round") {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:3.4rem;line-height:1;margin:10px 0", text: vm.roundIcona }));
      var nt = nodoTipo(el, vm.tipo);
      if (nt) { nt.style.textAlign = "center"; s._contenuto.appendChild(nt); }
      s._contenuto.appendChild(el("p", { class: "as-msg", text: "Sul tavolo " + vm.tavolo.length + " lotti: ognuno se ne aggiudica uno." }));
      piedeAuto(t, s, vm, cb, "Vedi le carte ▶", "Tra poco le carte…");
    }

    else if (vm.fase === "scelta") {
      var mio = vm.sceglieId === myId, scelta = false;
      s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-bottom:6px",
        text: (vm.tipo === "busta" ? "✉️ " : "🔨 ") + (mio ? "Scegli tu la carta da mettere all'asta" : vm.sceglieNome + " sta scegliendo la carta") + (vm.tipo === "busta" ? " (busta chiusa)" : "") }));
      if (vm.restaScelta > 0) s._contenuto.appendChild(barraTempo(el, vm.restaScelta, vm.durataScelta));   // allo scadere ne esce una a caso
      var g1 = el("div", { class: "as-griglia" + (vm.tavolo.length > 6 ? " tante molte" : vm.tavolo.length > 3 ? " tante" : "") });
      if (vm.tavolo.length > 6) s.classList.add("as-stretto");
      vm.tavolo.forEach(function (c, idx) {
        var nodo = bottoneCarta(el, c, mio ? function () { if (scelta) return; scelta = true; vibra(15); cb.onScegli({ idx: idx, n: vm.nScelta, nome: c.nome }); } : null);
        if (!mio) nodo.disabled = true;
        g1.appendChild(nodo);
      });
      s._contenuto.appendChild(g1);
    }

    else if (vm.fase === "esito") {
      var e2 = vm.esito || {}; s.classList.add("as-esito");
      s._contenuto.appendChild(el("div", { style: "display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px" }, nodiEsitoTemi(el, e2, myId)));
      var kV = vm.sessione + "|" + vm.roundIdx + "|" + (e2.carta && e2.carta.nome);
      if (e2.chiId === myId && cb._vibEsito !== kV) { cb._vibEsito = kV; vibra(35); }   // l'hai vinta tu: il martello si sente
      piedeAuto(t, s, vm, cb, "Avanti ▶", "Si va avanti da soli…");
    }

    else if (vm.fase === "malEsito" && vm.malEsito) {   // 🧨 chi si è presa la carta maledetta e chi ha pagato
      var em = vm.malEsito; s.classList.add("as-esito");
      nodiEsitoMal(el, em, myId).forEach(function (n) { s._contenuto.appendChild(n); });
      if (em.chiId === myId && cb._vibMal !== vm.sessione + "|" + em.n) { cb._vibMal = vm.sessione + "|" + em.n; vibra([40, 60, 40]); }   // è toccata a te: un momento che conta
      piedeAuto(t, s, vm, cb, "Avanti ▶", "Si va avanti da soli…");
    }

    t.mostra(s);
  }

  // la barra del tempo che si accorcia (solo transform): parte già al punto giusto anche se la foto arriva a metà
  function barraTempo(el, resta, durata) {
    var i = el("i"); durata = Math.max(resta, durata || resta);
    i.style.animation = "asAuto " + durata + "ms linear " + (resta - durata) + "ms forwards";
    return el("div", { class: "as-tbar" }, [ i ]);
  }
  // (online, temi) inizio round ed esito vanno avanti da soli (il tempo lo tiene l'host): l'host ha il tasto col numero
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

  // (online) 🧨 l'asta al contrario della carta maledetta vista da questo telefono: i tasti solo a chi è di turno
  function salaMalVM(t, vm, cb) {
    var M = vm.mal, myId = cb.myId, io = trova(vm.giocatori, myId);
    salaMal(t, { chiave: "vm|" + (vm.codice || "") + "|" + vm.sessione + "|" + M.n, info: "Round " + (vm.roundIdx + 1) + " di " + vm.totRound, carta: M.carta, prezzo: M.prezzo,
      persone: vm.giocatori.map(function (g) { return { id: g.id, nome: g.nome, offerta: (M.offerte || {})[g.id] || 0, crediti: g.crediti, via: !!g.via }; }),
      turnoId: M.turnoId, forzato: M.forzato, giro: M.giro, resta: M.resta, durata: M.durata, io: io ? myId : "—",
      onPaga: function () { cb.onMal({ n: M.n, a: "paga", prezzo: M.prezzo + 1 }); },
      onPrendo: function () { cb.onMal({ n: M.n, a: "prendo", g: M.giro }); },
      onIndietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); } });
  }

  // =========================================================
  //  ✉️ LA BUSTA CHIUSA (online): il lotto in alto, il tempo, chi ha già chiuso la busta (mai quanto ha offerto),
  //  e in basso il mio numero da scegliere e «✉️ Chiudo la busta». Si fa una volta per busta, poi cambia solo quello che serve.
  //  Allo scadere, se non l'ho chiusa, parte da sola col numero che avevo scelto.
  // =========================================================
  var BUS = null;
  function fermaBus() { BUS = null; }
  function salaBustaVM(t, vm, cb) {
    var B = vm.busta, myId = cb.myId, io = trova(vm.giocatori, myId), el = t.el;
    var inGara = !!io && B.gara.indexOf(myId) >= 0, chooser = B.chooserId === myId, min = chooser ? 1 : 0;
    var max = io ? Math.max(min, io.max != null ? io.max : io.crediti - ((vm.totRound - 1) - vm.roundIdx)) : 0;
    var giaChiusa = B.chiusi.indexOf(myId) >= 0;
    if (!cb._busta || cb._busta.n !== B.n) cb._busta = { n: B.n, q: giaChiusa ? null : min, chiusa: giaChiusa };   // (rientrato: quanto avevo offerto me lo ridice l'host)
    var mia = cb._busta; if (giaChiusa) mia.chiusa = true;
    var chiave = "bus|" + (vm.codice || "") + "|" + vm.sessione + "|" + B.n;
    if (!BUS || BUS.chiave !== chiave || !document.body.contains(BUS.s)) {
      var U = BUS = { chiave: chiave, pers: {}, kP: null };
      var s = U.s = t.schermata({ indietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); } });
      s.classList.add("as-bus");
      if (vm.giocatori.length > 6) s.classList.add("as-bus-fitta");
      s._contenuto.appendChild(el("div", { class: "as-bus-testa" }, [ el("span", { text: "✉️ Busta chiusa · round " + (vm.roundIdx + 1) + "/" + vm.totRound }) ]));
      s._contenuto.appendChild(el("div", { class: "as-bus-carta" }, [ emLotto(el, "em", B.carta),
        el("div", {}, [ el("div", { class: "nm", text: nomeLotto(B.carta) }), el("div", { class: "sm", text: "Scelta da " + nomeDi({ giocatori: vm.giocatori }, B.chooserId) + " · " + sottoLotto(B.carta) }) ]) ]));
      s._contenuto.appendChild(el("p", { class: "as-bus-regola", text: "Tutti scrivono in segreto quanto offrono: si aprono le buste insieme. Vince l'offerta più alta, a pari offerta chi ha chiuso prima." }));
      U.barra = el("i");
      s._contenuto.appendChild(el("div", { class: "as-mal-tempo" }, [ U.barra ]));
      var resta = Math.max(0, +B.resta || 0), tot = Math.max(resta, B.durata || resta || 1);
      U.barra.style.transition = "none"; U.barra.style.transform = "scaleX(" + (tot ? resta / tot : 0) + ")"; void U.barra.offsetWidth;
      U.barra.style.transition = "transform " + resta + "ms linear"; U.barra.style.transform = "scaleX(0)";
      var gente = el("div", { class: "as-bus-gente" });
      vm.giocatori.forEach(function (g) {
        var st2 = el("span"), nodo = el("div", { class: "as-bus-p" }, [ el("b", { text: g.nome }), st2 ]);
        U.pers[g.id] = { nodo: nodo, st: st2 }; gente.appendChild(nodo);
      });
      s._contenuto.appendChild(gente);
      U.env = el("div", { class: "as-env" });   // la busta di carta in mezzo: dentro il mio numero (o com'è andata)
      s._contenuto.appendChild(U.env);
      U.piede = el("div", { class: "as-bus-piede" });
      s._piede.appendChild(U.piede);
      t.mostra(s);
      FX.round();
    }
    var U2 = BUS;
    vm.giocatori.forEach(function (g) {
      var q = U2.pers[g.id]; if (!q) return;
      var dentro = B.gara.indexOf(g.id) >= 0, chiusa = B.chiusi.indexOf(g.id) >= 0;
      var cls = "as-bus-p" + (chiusa ? " chiusa" : "") + (!dentro ? " fuori" : "") + (g.via ? " via" : "") + (g.id === myId ? " mio" : "");
      if (q.nodo.className !== cls) q.nodo.className = cls;
      var tx = g.via ? "non c'è" : !dentro ? "✔ ha la carta" : chiusa ? "✉️ chiusa" : "✍️ scrive…";
      if (q.st.textContent !== tx) q.st.textContent = tx;
    });
    // in basso: il mio numero e il tasto (solo se gioco e non ho ancora chiuso); se no una riga che dice cosa succede
    var kP = [B.n, inGara ? 1 : 0, mia.chiusa ? "c" + mia.q : 0, max, io ? 1 : 0].join("|");
    if (kP === U2.kP) return;
    U2.kP = kP;
    svuotaNodo(U2.piede); svuotaNodo(U2.env);
    var nota = el("p", { class: "sa-nota" });
    U2.piede.appendChild(nota);
    var scritta = function (tx) { U2.env.classList.add("chiusa"); U2.env.appendChild(el("div", { class: "as-env-tx", text: tx })); };
    if (!io) { nota.textContent = "Stai guardando: le buste si aprono tutte insieme"; scritta("👀"); return; }
    if (!inGara) { nota.textContent = "Hai già la tua carta di questo round: guardi le buste degli altri"; scritta("✔"); return; }
    if (mia.chiusa) { nota.textContent = "✉️ Busta chiusa" + (mia.q != null ? ": " + mia.q + " 💰" : "") + ". Aspetta gli altri…"; scritta(mia.q != null ? mia.q + " 💰" : "✉️"); return; }
    U2.env.classList.remove("chiusa");
    nota.textContent = (chooser ? "Hai scelto tu la carta: offri almeno 1. " : "0 = non la vuoi. ") + "Hai " + io.crediti + " 💰 · puoi offrire fino a " + max;
    var v = el("div", { class: "v" }), meno, piu, piu3, ok;
    function agg() { mia.q = Math.max(min, Math.min(max, mia.q || 0)); v.textContent = mia.q + " 💰"; meno.disabled = mia.q <= min; piu.disabled = piu3.disabled = mia.q >= max;
      var tx = mia.q ? "✉️ Chiudo la busta: " + mia.q + " 💰" : "✉️ Non offro niente", nt = ok.firstChild; if (nt && nt.nodeType === 3) nt.nodeValue = tx; else ok.insertBefore(document.createTextNode(tx), ok.firstChild); }
    meno = el("button", { type: "button", text: "−", onclick: function () { mia.q--; agg(); } });
    piu = el("button", { type: "button", text: "+", onclick: function () { mia.q++; agg(); } });
    piu3 = el("button", { type: "button", class: "p3", text: "+3", onclick: function () { mia.q += 3; agg(); } });
    U2.env.appendChild(el("div", { class: "as-bst" }, [ meno, v, piu, piu3 ]));
    function chiudi() {
      if (mia.chiusa) return; mia.chiusa = true; vibra(20); cb.onBusta({ n: B.n, q: mia.q });
      if (BUS === U2 && document.body.contains(U2.s)) { U2.kP = null; salaBustaVM(t, vm, cb); }   // (se le buste si sono già aperte, c'è già l'esito)
    }
    ok = el("button", { class: "btn btn-primario", onclick: chiudi });
    U2.piede.appendChild(ok);
    agg();
    // il tempo sul tasto: un attimo prima della fine la busta parte da sola col numero scelto
    var sec = Math.max(1, Math.ceil((+B.resta || 0) / 1000) - 1);
    if (t.contoAvanti) t.contoAvanti(ok, sec, function () { if (!cb._uscito && BUS === U2 && document.body.contains(ok)) chiudi(); }, chiave + "|tasto");
  }

  // =========================================================
  //  ⭐ IL VOTO A UN TOCCO (online): la carta-scenario e i kit degli altri; tocchi quello che se la cava meglio.
  //  Si può cambiare idea finché il voto è aperto. Le foto che arrivano dopo cambiano solo i numeri e la mia scelta.
  // =========================================================
  function votoVM(t, vm, cb) {
    var el = t.el, myId = cb.myId, io = trova(vm.giocatori, myId);
    var k = "voto|" + (vm.codice || "") + "|" + vm.sessione + "|" + vm.giocatori.map(function (g) { return g.id; }).join(",");
    if (cb._mioVoto && cb._mioVoto.s !== vm.sessione) cb._mioVoto = null;
    if (cb._voto && cb._voto.k === k && document.body.contains(cb._voto.s)) return cb._voto.agg(vm);
    var V = cb._voto = { k: k, bott: {} };
    var s = V.s = t.schermata({ indietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); } });
    s.classList.add("as-vt");
    if (t.guarda) s.classList.add("as-targa");   // chi guarda col link: in basso il posto della targhetta del core
    s._contenuto.appendChild(nodoScenario(el, vm.scenario, true));
    V.cosa = el("p", { class: "as-msg", style: "margin:0 0 8px" });
    s._contenuto.appendChild(V.cosa);
    var fitto = fittoVoto(vm.giocatori.length);
    vm.giocatori.forEach(function (g) {
      if (g.id === myId) return;   // (il mio kit non si vota)
      var b = nodoVotoKit(el, g, fitto, io ? function () {
        if (!document.body.contains(b)) return;
        if (cb._mioVoto && cb._mioVoto.per === g.id) return;
        cb._mioVoto = { s: vm.sessione, per: g.id }; vibra(20);
        cb.onVoto({ per: g.id });
        V.agg(V.vm);
      } : null);
      if (!io) b.disabled = true;
      V.bott[g.id] = b; s._contenuto.appendChild(b);
    });
    if (io) {   // il mio kit, in fondo e spento: così lo confronto con gli altri
      var mioK = nodoVotoKit(el, io, fitto, null); mioK.classList.add("mio"); mioK.disabled = true;
      mioK.querySelector(".n span").textContent = "Il tuo kit"; s._contenuto.appendChild(mioK);
    }
    var fa = t.faccine && !t.guarda ? t.faccine() : null;   // (chi guarda col link: le faccine stanno nella targhetta)
    if (fa && !io) s._contenuto.appendChild(el("div", { style: "display:flex;justify-content:center;margin-top:10px" }, [ fa ]));
    V.conto = el("p", { class: "as-msg", style: "margin:0" });
    s._piede.appendChild(V.conto);
    if ((vm.restaVoto || 0) > 0 && t.contoAvanti) t.contoAvanti(V.conto, Math.max(1, Math.ceil(vm.restaVoto / 1000)), null, k + "|conto");
    V.chiudi = cb.sonoHost && cb.onChiudiVoti ? el("button", { class: "btn btn-fantasma", onclick: cb.onChiudiVoti }) : null;
    V.agg = function (v) {
      V.vm = v;
      var mio = cb._mioVoto && cb._mioVoto.s === v.sessione ? cb._mioVoto.per : null, n = (v.hannoVotato || []).length, tot = v.giocatori.filter(function (g) { return !g.via; }).length;
      Object.keys(V.bott).forEach(function (id) { var c = "as-vk" + (fitto || "") + (id === mio ? " scelto" : "") + (V.bott[id].classList.contains("maled") ? " maled" : ""); if (V.bott[id].className !== c) V.bott[id].className = c; });
      var nm = mio ? (trova(v.giocatori, mio) || {}).nome : null;
      var tx = !io ? "👀 Stai guardando: votano gli altri (" + n + " su " + tot + ")"
        : nm ? "✅ La tua ⭐ va a " + nm + " · puoi cambiare finché il voto è aperto (" + n + " su " + tot + ")"
        : (v.hannoVotato || []).indexOf(myId) >= 0 ? "✅ Hai votato (" + n + " su " + tot + ")"
        : "⭐ A chi dai la tua stella? Un tocco sul kit che se la cava meglio (" + n + " su " + tot + ")";
      if (V.cosa.textContent !== tx) V.cosa.textContent = tx;
      if (V.chiudi) {   // l'host può chiudere il voto prima, quando ha votato almeno uno
        V.chiudi.textContent = "Chiudi il voto (" + n + " su " + tot + ")";
        if (n < 1) { if (V.chiudi.parentNode) V.chiudi.parentNode.removeChild(V.chiudi); } else if (!V.chiudi.parentNode) V.s._piede.appendChild(V.chiudi);
      }
      // (il tasto «Chiudi il voto» dell'host toglie spazio: se i kit non ci stanno più, si stringono)
      if (document.body.contains(V.s)) fitto = stringiVoto(V.s._contenuto, [].slice.call(V.s._contenuto.querySelectorAll(".as-vk")), fitto);
    };
    V.agg(vm);
    t.mostra(s);
    fitto = stringiVoto(s._contenuto, [].slice.call(s._contenuto.querySelectorAll(".as-vk")), fitto);
  }

  function titoloFaseAsta(vm, myId) {
    if (vm.fase === "malEsito") return "🧨 Carta maledetta";
    if (vm.fase === "round") return vm.roundNome || "Round";
    if (vm.fase === "scelta") return vm.sceglieId === myId ? "Scegli tu" : ("Sceglie " + vm.sceglieNome);
    if (vm.fase === "asta") return "Asta in corso";
    if (vm.fase === "esito") return vm.esito && vm.esito.buste ? "✉️ Buste aperte!" : "Aggiudicata!";
    if (vm.fase === "voto") return "Vota il kit migliore";
    return "L'Asta";
  }

  function avatarOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function lobbyAsta(t, vm, cb) {
    var el = t.el, info = el("div");
    if (vm.formato === "fanta") {
      info.appendChild(el("div", { class: "etichetta", text: "Modalità" }));
      info.appendChild(el("p", { class: "as-msg", text: "⚽ Mini asta Fantacalcio — rosa da 5 (1 P, 1 D, 2 C, 1 A), 20 crediti a testa, rilanci +1 +2 +5. Vince la rosa che vale di più (quotazioni vere, svelate alla fine)." }));
    } else {   // tutte le regole si cambiano da "⚙️ Regole" (l'host); qui tutti vedono come si gioca
      var cr = (vm.giocatori && vm.giocatori[0] && vm.giocatori[0].crediti) || 15;
      info.appendChild(el("div", { class: "etichetta", text: "Si gioca così" }));
      info.appendChild(el("p", { class: "as-msg", text: "🎁 Temi classici · " + vm.temaIcona + " " + vm.temaNome + " · 💰 " + cr + " crediti a testa" +
        (vm.round === "normali" ? " · 🔨 round tutti normali" : " · 🎭 round ✉️ 📦 🎁") + (vm.maledetta ? " · 🧨 carta maledetta" : "") }));
    }
    t.lobby({ host: cb.sonoHost, codice: vm.codice, min: 2, spettatore: t.guarda ? "👀 Guardi soltanto" : false,   // (chi guarda col link)
      giocatori: vm.giocatori.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [info], attesa: "Aspetta che l'host cominci l'asta: tieni pronti i crediti! 💰",
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function schermataFineAsta(t, vm, cb) {
    var el = t.el;
    salvaTrofeiAsta(t, vm, cb && cb.myId, true);
    var etichetta = vm.formato === "fanta" ? "Mini asta Fantacalcio" : ("L'Asta · " + (vm.temaNome || ""));
    var s = t.schermata({ chiara: true, icona: "🏆", titolo: "Classifica finale", sotto: etichetta });
    s.classList.add("as-fissa");   // (alta come lo schermo: "Nuova partita" si vede sempre, le fasce svelate scorrono nel centro)
    if (vm.scenario) { var sc = nodoScenario(el, vm.scenario, false); sc.style.marginTop = "2px"; s._contenuto.appendChild(sc); }
    var ol = el("ol", { class: "classifica" + ((vm.classifica || []).length > 5 ? " fitta" : "") });   // (da 6 in su su due colonne: si vede tutta)
    if (t.guarda) s.classList.add("as-targa");   // chi guarda col link: in basso il posto della targhetta del core
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
    var tit = nodoTitoli(el, vm.titoli);   // 🏅 i titoli scherzosi
    if (tit) s._contenuto.appendChild(tit);
    // 📸 la foto del mio kit (chi guarda: tutti i kit) da mandare nel gruppo: in basso accanto alle faccine, così si vede sempre
    var fotoB = null;
    if (vm.formato !== "fanta" && vm.giocatori && vm.giocatori.length) {
      var io = trova(vm.giocatori, cb.myId);
      fotoB = el("button", { class: "btn btn-fantasma", text: "📸 Foto", title: io ? "Manda il tuo kit nel gruppo" : "Manda i kit nel gruppo", "aria-label": io ? "Manda il tuo kit nel gruppo" : "Manda i kit nel gruppo",
        onclick: function () { fotoKit(vm.giocatori, { icona: vm.temaIcona, nome: vm.temaNome }, io ? io.nome : null); } });
    }
    // Fasce svelate: ora che si è votato, si scopre il vero valore delle carte (e chi ha votato chi)
    if (vm.formato !== "fanta" && vm.giocatori && vm.giocatori.some(function (g) { return g.kit && g.kit.length; })) {
      s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:14px", text: "🃏 Fasce svelate" }));
      var kits = el("div", { class: vm.giocatori.length > 2 ? "as-kits" : "" });
      vm.giocatori.forEach(function (g) { kits.appendChild(nodoKitVm(el, g, true)); });
      s._contenuto.appendChild(kits);
    }
    var fa = t.faccine && !t.guarda ? t.faccine() : null;   // le faccine della saletta: si festeggia (o si sfotte) tutti insieme
    if (fa || fotoB) s._piede.appendChild(el("div", { class: "as-foto as-foto-riga" }, [ fa, fotoB ]));
    // chi guarda col link: faccine e uscita nella targhetta del core; alla prossima partita entra da solo
    if (t.guarda) s._piede.appendChild(el("p", { class: "as-msg", text: "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." }));
    // i tasti di fine uguali per tutti (Rivincita, Cambia gioco, Ci sto…) li mette il core; se no quelli di sempre
    else if (t.tastiFine && t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) { /* fatto dal core */ }
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
    g.crediti -= prezzo; g.kit.push({ nome: carta.nome, squadra: carta.squadra, ruolo: carta.ruolo, tier: carta.tier, prezzo: prezzo }); g.conta[carta.ruolo] = (g.conta[carta.ruolo] || 0) + 1;
  }

  // ---------- SINGOLO TELEFONO ----------
  function avviaFanta(t) {
    var st = {
      formato: "fanta", sessione: nuovaSessione(), asta: null, giriVuoti: 0, salto: 1, giornata: !(t.impostazioni && t.impostazioni.giornata === false),   // ⚽ la giornata dopo l'asta (di partenza sì)
      giocatori: t.giocatori.map(function (n) { return { nome: n, crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0, st: statNuove(), omino: ominoLocale(n) }; })
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
      st.giornata ? el("p", { class: "as-msg", text: "⚽ Alla fine si scoprono le quotazioni vere e si gioca una giornata di Serie A finta: ognuno dei tuoi calciatori gioca con la sua squadra (🎯 i rigoristi tirano i rigori). Vince chi fa più fantapunti." }) : null,
      el("p", { class: "as-msg", text: "I calciatori escono uno alla volta dal mazzo: scegli il salto (+1, +2 o +5) e tocca il tuo avatar per offrire. Chi ha quel ruolo già pieno non punta. Se nessuno offre, il calciatore torna in fondo al mazzo e ripasserà: decide il caso solo se tutti quelli rimasti di un ruolo vengono rifiutati 2 volte." })
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
    if ((elegg.length === 1 && st.giocatori.length > 1) || rifiutatiTutti(st.mazzo, carta.ruolo)) {   // uno solo ne ha bisogno, o tutti quelli del ruolo rifiutati 2 volte: d'ufficio a 1 (da solo, per provare, si fa l'asta lo stesso)
      var i = elegg[Math.floor(Math.random() * elegg.length)]; st.mazzo.shift(); assegnaFanta(st.giocatori[i], carta, 1);
      st.giriVuoti = 0; FX.aggiudicato();
      return esitoFanta(t, st, i, carta, 1, "forzata", elegg.length === 1 ? "unico" : "ufficio");
    }
    st.asta = { carta: carta, ruolo: carta.ruolo, offerta: 1, leader: null, passati: {}, bar: null };
    st.salto = 1;
    tempoAsta(st.asta, function () { scadeFanta(t, st); }, FANTA_VUOTO_MS);   // finché nessuno offre, il tempo è più corto
    disegnaAstaFanta(t, st);
  }

  // (stesso telefono) lo stadio: scegli il salto e tocchi il tuo avatar per offrire; il campetto mostra la squadra di chi ha appena offerto
  function disegnaAstaFanta(t, st, esito) {
    var a = st.asta, carta = a ? a.carta : esito.carta, ru = FANTA_RUOLI[carta.ruolo] || {};
    var prezzo = a ? (a.leader === null ? a.offerta : a.offerta + 1) : 0;
    var eleggN = eleggibiliFanta(st, carta.ruolo).length, carteRuolo = st.mazzo.filter(function (c) { return c.ruolo === carta.ruolo; }).length;
    var persone = st.giocatori.map(function (g, i) {
      var pieno = !!a && ruoloPieno(g, a.ruolo), pass = !!a && !!a.passati[i];
      return { id: i, nome: g.nome, omino: g.omino || null, num: i + 1, crediti: g.crediti, kit: g.kit, stato: pieno ? "fuori" : pass ? "passato" : "gara",
        nota: pieno ? notaPieno(a.ruolo) : pass ? "ha passato" : notaCrediti(g.crediti, maxFanta(g)), manca: iconeMancano(g.conta),
        puo: !!a && !pieno && !pass && maxFanta(g) >= prezzo };
    });
    stadio(t, { chiave: "f|" + st.sessione, fase: a ? "asta" : "esito",
      info: (a ? ru.nome + " all'asta · " : esito.tipo === "accollo" ? "Nessuno lo vuole · " : "Aggiudicato! · ") + postiPresi(st.giocatori),
      carta: { nome: carta.nome, squadra: carta.squadra, ruolo: carta.ruolo }, giroCarta: st.nCarta, prezzo: a ? a.offerta : esito.prezzo, base: !!a && a.leader === null,
      leader: a ? a.leader : esito.chiId, persone: persone, io: null, giro: a ? a.giro : null, resta: a ? a.scadenza - Date.now() : 0, durata: a ? a.durata : FANTA_RILANCIO_MS, puoPassare: !!a,
      budget: FANTA_BUDGET, grosso: 5, piedeAlto: "loc",
      esito: esito || null,
      avviso: a ? avvisoFanta(eleggN === 2 && carteRuolo === 2, ultimaChiamata(st.mazzo, carta), carta.ruolo) : "",
      nota: !a ? "" : a.leader === null ? "Scegli il salto e tocca il tuo avatar: +1 lo prende a " + a.offerta + ". Se nessuno lo vuole torna in fondo al mazzo." : "Scegli il salto e tocca il tuo avatar per rilanciare (chi ha l'offerta può rialzare).",
      sel: a ? selettoreSalti(t.el, st, SALTI_FANTA) : null, kPiede: a ? "sel|" + (a.leader === null ? 0 : 1) : null,
      onRilancia: function (i) { rilanciaFanta(t, st, i); }, onPassa: function (i) { passaFanta(t, st, i); }, onIndietro: function () { esciAsta(t, st); },
      extra: { testo: "👕 Tutte", apri: function () { formazioni(t, st.giocatori); } } });
  }

  function rilanciaFanta(t, st, i) {
    var a = st.asta; if (!a) return;   // (anche chi ha già l'offerta più alta può rialzare da solo: è strategia)
    var g = st.giocatori[i];
    if (ruoloPieno(g, a.ruolo)) return;
    var base = a.leader === null ? a.offerta - 1 : a.offerta, max = maxFanta(g);
    if (max < base + 1) return;
    var prezzo = Math.min(base + (st.salto || 1), max);   // il salto scelto (se non ci arriva, fin dove può)
    segnaRilancio(g, prezzo - base, 5);
    a.ultimoSec = a.scadenza && a.scadenza - Date.now() < 2000 ? i : null;   // 🎯 all'ultimo secondo
    a.offerta = prezzo; a.leader = i; delete a.passati[i];
    st.salto = 1; aggSel(st);
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
    segnaVinta(st.giocatori[i], prezzo, carta, a.ultimoSec === i, false);
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
      giornata: !(t.impostazioni && t.impostazioni.giornata === false),   // ⚽ la giornata dopo l'asta (di partenza sì)
      fase: "lobby", iniziata: false, codice: "…", scadenza: null, _to: null, giriVuoti: 0, giro: 0, nCarta: 0, nEsiti: 0,
      giocatori: [{ id: IO, nome: (t.giocatori && t.giocatori[0]) || "Host", crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0, st: statNuove(), omino: t.mioOmino ? t.mioOmino() : null }]
    };
    // la partita di prima (t.ripresa): stesse rose, stessi crediti, stesso mazzo (vedi riprendi)
    var R0 = prendiRipresa(t, "fanta"), ripresa = !!R0, attesi = {}, tAttesi = null;
    if (ripresa) {
      ripristina(st, R0);
      st.giocatori.forEach(function (g) { if (g.id !== IO && !g.via) attesi[g.id] = 1; });
    }
    // ⏱️ l'orologio della partita adesso è il mio (il vice che prende il posto porta sul suo orologio le ore scritte da quello di prima)
    if (ripresa && st.cron && t.ripresa && t.ripresa.daRiserva) spostaPiano(st, OROLOGIO.misurato ? function (h) { return h - OROLOGIO.off; } : t.ripresa.ora);
    azzeraOrologio(IO); st.oraDi = IO;
    var TM = timerHost(st, function () { return !cb._uscito && !st.morto; });   // (al risveglio del telefono recupera i tempi scaduti)
    function stopTo() { TM.ferma(); }
    // "⚙️ Regole" in saletta: se torni ai Temi classici cambia motore (stessa stanza, stessi amici)
    t.onRegole = function (im) {
      if (!st.iniziata && formatoDi(t, im) !== "fanta") { st.morto = true; TM.smetti(); avviaAsta(t); return; }
      if (!st.iniziata) st.giornata = im.giornata !== false;   // ⚽ la giornata: si decide in saletta
    };
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
            st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0, st: statNuove(), omino: avatarOk(m.omino) });
          bd();
        }
        else if (m.t === "rilancia") rilanciaO(id, m);
        else if (m.t === "passa") passaO(id, m);
        else if (m.t === "ora") rete.inviaVeloce({ t: "ora", a: id, c: m.c, h: Date.now() });   // ⏱️ il botta e risposta dell'orologio
      },
      onErrore: function (e) {
        // un errore di rete passeggero: la rete si ricollega da sola e rimanda l'ultima foto, quindi la partita NON si ferma
        if (st.iniziata || st.pronta) return;
        if (e && e.type === "no-mqtt") return senzaRete(t);
        erroreSchermo(t, "Non riesco ad aprire la stanza. Controlla la connessione e riprova.");
      }
    };
    var rete = ospitaAsta(cbRete, { ripresa: ripresa }, "astafanta");   // (il codice della stanza porta alla Mini Asta Fantacalcio)   // (con la ripresa gli amici non tornano in saletta)

    function invia() { rete.invia({ t: "vm", vm: vmFanta(st) }); ricorda(); }
    // la partita com'è adesso, per riprenderla se ricarico la pagina o se un amico prende il mio posto (in saletta niente)
    function ricorda() { if (!st.morto && t.ricorda) t.ricorda(st.iniziata && st.fase !== "lobby" ? statoDaRicordare(st, "fanta") : null); }
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
      if (f === "fine" && st.serieA) {
        st.passi = st.passi || {}; st.nomeCapo = nomeDi(st, IO);
        if (!st.cron) st.passi.libero = 1;   // (una partita di prima, senza piano: rivedo la giornata da capo e gli amici non mi aspettano; col piano si riprende tutti insieme)
      }
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
    // m: { n (quale calciatore), prezzo, vista + vl (l'offerta e chi l'aveva, come le vedeva lui), tk (il numero del tocco) }:
    // ogni tocco conta una volta sola e un tocco partito da un'offerta che non c'è più non conta; il secondo tocco di chi
    // ha appena preso l'offerta è un rialzo da solo (due tocchi = +2, +2 poi +5 = +7). I salti +1, +2 e +5
    function rilanciaO(id, m) {
      if (st.fase !== "asta" || !st.asta || !m || m.n !== st.nCarta) return;
      var g = perId(st, id); if (!g || ruoloPieno(g, st.asta.ruolo)) return;   // (anche chi ha già l'offerta più alta può rialzare da solo: è strategia)
      var a = st.asta, senza = a.leader === null, prezzo = toccoArrivato(a, id, m, senza, SALTI_FANTA);
      if (prezzo === "tardi") { if (a.leader !== id) tardi(id); if (m.tk != null) bd(); return; }   // (un tocco vecchio di chi guida non conta, senza "troppo tardi"; la foto dice al suo telefono che è arrivato)
      if (prezzo === "doppio" || prezzo === "attesa") return;
      if (prezzo == null || maxFanta(g) < prezzo) { if (m.tk != null) bd(); return; }   // (la foto dice al suo telefono che il tocco è arrivato)
      segnaRilancio(g, prezzo - (senza ? a.offerta - 1 : a.offerta), 5);
      a.ultimoSec = st.scadenza && st.scadenza - Date.now() < 2000 ? id : null;   // 🎯 all'ultimo secondo
      a.offerta = prezzo; a.leader = id; delete a.passati[id];
      FX.rilancio(id === IO);
      if (!verifica()) riparti(FANTA_RILANCIO_MS);   // se nessun altro può più offrire, aggiudico subito
      inAttesa(st.asta, id).forEach(function (x) { rilanciaO(id, x); });   // i suoi tocchi arrivati prima di questo
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
      segnaVinta(g, a.offerta, carta, a.ultimoSec === g.id, false);
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
      st.serieA = st.giornata ? {} : null;
      st.classifica = classificaFanta(st.giocatori, st.serieA);   // (⚽ con la giornata: la gioca l'host e la vedono tutti uguale)
      st.titoli = titoliFine(st.giocatori, FANTA_BUDGET, st.classifica);   // 🏅 i titoli scherzosi
      st.passi = {}; st.nomeCapo = nomeDi(st, IO);   // (le pagelle: fin dove sono arrivato, e il mio nome per «Aspettiamo…»)
      st.cron = pianoNuovo(Date.now() + PARTENZA_MS, velPref());   // ⏱️ il piano: tutti i telefoni (anche il mio) cominciano tra 2 secondi, insieme
      st.fase = "fine"; bd();
      if (t.risultato) t.risultato(st.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));   // per il torneo online
    }
    function nuovaInLobby() {
      stopTo();
      st.iniziata = false; st.fase = "lobby"; st.mazzo = []; st.asta = null; st.esito = null; st.classifica = null; st.serieA = null; st.passi = null; st.cron = null; st.scadenza = null; st.giriVuoti = 0;
      st.giocatori = st.giocatori.filter(function (g) { return !g.via; });   // chi non c'è più esce dalla stanza
      st.giocatori.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });   // (chi tiene la partita è il primo: in saletta ha la corona)
      st.giocatori.forEach(function (g) { g.crediti = FANTA_BUDGET; g.kit = []; g.conta = { P: 0, D: 0, C: 0, A: 0 }; g.stelle = 0; g.asteVinte = 0; g.st = statNuove(); });
      st.titoli = null;
      bd();
    }
    var cb = {
      myId: IO, sonoHost: true,
      onComincia: comincia, onNuova: nuovaInLobby,
      onRilancia: function (x) { rilanciaO(IO, x); }, onPassa: function (x) { passaO(IO, x); },
      // (le pagelle: sono andato avanti) torna l'ora dell'host in cui la pagina gira per tutti (anche per me): ANTICIPO_PASSO dopo il tocco
      onPasso: function (quale, n) {
        st.passi = st.passi || {}; st.passi.h = st.passi.h || {};
        var l = st.passi.h[quale] = st.passi.h[quale] || [], c0 = l.filter(function (x) { return x[0] === n; })[0];
        if (c0) return c0[1];
        var h = Date.now() + ANTICIPO_PASSO; l.push([n, h]);
        if ((st.passi[quale] || 0) < n) st.passi[quale] = n;
        invia(); return h;
      },
      onVel: function (v) { if (!st.cron) return; aggiungiVel(st.cron, Date.now() + ANTICIPO_PASSO, v); invia(); },   // ⏩ vale per tutti
      onSalta: function () { if (!st.cron) return null; if (!st.cron.salta) { st.cron.salta = Date.now() + ANTICIPO_PASSO; invia(); } return st.cron.salta; },   // ⏭ le rose: si salta tutti insieme
      onEsci: function () { if (st.fase === "fine" && st.serieA) { st.passi = st.passi || {}; st.passi.libero = 1; invia(); }   // (gli amici non mi aspettano più nelle pagelle)
        stopTo(); clearTimeout(tAttesi); if (t.ricorda) t.ricorda(null); TM.smetti(); cb._uscito = true; fermaTutto(); rete.chiudi(); t.esci(); }
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
          kit: g.kit.map(function (c) { return { nome: c.nome, squadra: c.squadra, ruolo: c.ruolo, prezzo: c.prezzo || 0 }; }) };   // (i valori restano nascosti fino alla fine)
      }),
      asta: a ? {
        carta: { nome: a.carta.nome, squadra: a.carta.squadra, ruolo: a.carta.ruolo }, nCarta: st.nCarta,
        ruolo: a.ruolo, offerta: a.offerta, leaderId: a.leader, leaderNome: a.leader ? nomeDi(st, a.leader) : "",
        passati: Object.keys(a.passati || {}), tk: a.tk || {}, giro: st.giro, durata: st.durata || FANTA_RILANCIO_MS, resta: st.scadenza ? st.scadenza - Date.now() : 0,   // il tempo che resta (non l'ora: gli orologi dei telefoni non sono uguali)
        ultimaChiamata: ultimaChiamata(st.mazzo, a.carta),
        ultimoDuello: (st.giocatori.filter(function (g) { return !ruoloPieno(g, a.ruolo); }).length === 2 &&
          st.mazzo.filter(function (c) { return c.ruolo === a.ruolo; }).length === 2)
      } : null,
      esito: e ? { n: e.n, nCarta: e.nCarta, tipo: e.tipo, motivo: e.motivo || "", chiId: e.chiId, chiNome: e.chiNome, prezzo: e.prezzo, carta: { nome: e.carta.nome, squadra: e.carta.squadra, ruolo: e.carta.ruolo, rifiuti: e.carta.rifiuti || 0 } } : null,
      restano: st.mazzo ? st.mazzo.length : 0, presi: postiPresi(st.giocatori),
      classifica: st.classifica || null,
      serieA: st.fase === "fine" ? (st.serieA || null) : null,   // ⚽ la giornata di Serie A finta (la vedono tutti uguale)
      titoli: st.fase === "fine" ? (st.titoli || []) : null,
      passi: st.fase === "fine" ? (st.passi || {}) : null,   // ⏯️ fin dove è arrivato chi tiene la partita nelle pagelle (gli altri lo aspettano), con l'ora di ogni passo
      cron: st.fase === "fine" ? (st.cron || null) : null, ora: Date.now(), oraDi: st.oraDi || null,   // ⏱️ il piano dopo l'asta, l'ora di adesso e di chi è l'orologio
      nomeCapo: st.fase === "fine" ? (st.nomeCapo || "") : ""
    };
  }

  // ---------- DISEGNO CONDIVISO FANTACALCIO (host e ospiti) ----------
  function disegnaFantaVM(t, vm, cb) {
    cb._vmA = vm;   // (l'ultima foto: un tocco in arrivo si ridisegna solo se si è ancora in quell'asta)
    if (vm.fase === "lobby") { fermaConta(STADIO); STADIO = null; return lobbyAsta(t, vm, cb); }
    if (vm.fase === "fine") {
      salvaTrofeiAsta(t, vm, cb.myId, true);
      var io = trova(vm.giocatori, cb.myId);
      return rivelaFanta(t, vm.classifica || [], { chiave: "ro|" + (vm.codice || "") + "|" + vm.sessione, titoli: vm.titoli || [], mio: io ? io.id : null, serieA: vm.serieA || null,
        capo: !!cb.sonoHost, onPasso: cb.onPasso || null, passi: vm.passi || {}, nomeCapo: vm.nomeCapo || ((vm.giocatori || [])[0] || {}).nome || "",
        cron: vm.cron || null, onVel: cb.onVel || null, onSalta: cb.onSalta || null, prova: proprietario(t),
        foto: function () { fotoRose(vm.classifica || [], io ? io.nome : null); },   // 📸 la mia rosa (chi guarda: tutte)
        onEsci: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); },
        bottoni: function () {
          var el = t.el, fa = t.faccine && !t.guarda ? t.faccine() : null;   // (le faccine della saletta, sul podio)
          fa = fa ? el("div", { style: "width:100%;display:flex;justify-content:center" }, [ fa ]) : null;
          // chi guarda col link: faccine e uscita nella targhetta del core; alla prossima partita entra da solo
          if (t.guarda) return [ el("p", { class: "sa-nota", text: "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." }) ];
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
  SG.registra(giocoFanta);   // (dopo L'Asta: nella lista dei giochi arriva in fondo)
})();
