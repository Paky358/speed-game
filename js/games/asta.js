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
    ".st-altri{margin-top:6px;padding:6px 10px;border-radius:10px;background:rgba(0,0,0,.35);font-size:.76rem;font-weight:800;line-height:1.5;text-align:center;}",
    // sotto ogni avatar: i crediti e fin dove può arrivare; nel fantacalcio anche i posti che gli mancano (🧤🛡️🎽⚽)
    ".sa-pers .sa-manca{font-style:normal;font-size:.6rem;line-height:1.1;white-space:nowrap;text-align:center;letter-spacing:-.04em;text-shadow:0 1px 2px rgba(0,0,0,.8);}",
    ".st-tribuna .sa-pers .sa-manca{min-height:1.15em;}.st-tribuna .sa-fila1 .sa-pers .sa-manca,.st-tribuna .sa-fila1 ~ .sa-fila0 .sa-pers .sa-manca{font-size:.5rem;}",
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
    ".as-vt>.contenuto{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}",
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
    // 🏅 i titoli scherzosi di fine partita (non sono trofei)
    ".as-titoli{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 4px;}",
    ".as-tit{background:linear-gradient(150deg,var(--carta-2),#2a2550);border-radius:12px;padding:6px 8px;min-width:0;}",
    ".as-tit .t{font-size:.72rem;font-weight:900;color:var(--accento);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".as-tit .c{font-size:.95rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".as-tit .d{font-size:.68rem;font-weight:700;color:var(--testo-tenue);line-height:1.2;}",
    ".as-foto{display:flex;gap:6px;justify-content:center;margin:6px 0 2px;}.as-foto .btn{margin:0;flex:1;max-width:320px;}",
    ".as-foto-riga{align-items:center;margin:0;}.as-foto-riga .btn{flex:none;width:auto;min-height:40px;padding:6px 14px;font-size:.92rem;border-radius:999px;}",
    ".as-voti-da{font-size:.72rem;font-weight:800;color:var(--accento);margin:-4px 0 4px;}"
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
    maledetta: function () { beep([392, 311, 233], 0.24, "sawtooth"); }                 // 🧨 esce la carta maledetta (tre note che scendono)
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

  var gioco = {
    id: "asta",
    nome: "L'Asta",
    icona: "🔨",
    descrizione: "Compra all'asta le carte migliori e costruisci il kit che gli altri voteranno.",
    giocatoriMin: 2,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono per rilanciare", amici: true }],
    giocatoriMax: MAX_GIOCATORI,
    postiOnline: MAX_GIOCATORI,   // posti online (10)
    // le regole in una riga, per la saletta: "🎁 Temi classici · Vacanze · 15 crediti" o "⚽ Mini asta Fantacalcio · 20 crediti"
    riassunto: function (imp) {
      imp = imp || {};
      if (imp.formato === "fanta") return "⚽ Mini asta Fantacalcio · " + FANTA_BUDGET + " crediti · rosa da 5 · rilanci +1 +2 +5";
      var temi = window.SG_ASTA_TEMI || [], tm = temi.filter(function (x) { return x.id === imp.tema; })[0] || temi[0];
      return "🎁 Temi classici" + (tm ? " · " + tm.icona + " " + tm.nome : "") + " · " + (imp.crediti || 15) + " crediti" +
        (imp.round === "normali" ? " · 🔨 round tutti normali" : " · 🎭 round ✉️ 📦 🎁") + (imp.maledetta ? " · 🧨 carta maledetta" : "");
    },
    difficolta: 3,   // Difficile — vale di più nel torneo (1 facile, 2 media, 3 difficile)

    regole: [
      "Un solo telefono <b>appoggiato al tavolo</b>: tutti vedono le carte e ognuno tocca il proprio tasto.",
      "Si giocano <b>4 round</b> a tema. In ogni round sul tavolo ci sono tante carte quanti sono i giocatori e <b>ognuno se ne aggiudica una</b>.",
      "A turno uno sceglie quale carta mettere all'asta: parte da <b>1 credito</b>. Gli altri possono <b>rilanciare</b> o <b>passare</b>. Si rilancia <b>a salto</b>: <b>+1</b> o <b>+3</b> (sullo stesso telefono scegli il salto e tocchi il tuo avatar).",
      "Dopo ogni rilancio partono <b>10 secondi</b>: allo scadere la carta va a chi ha l'offerta più alta. <b>Paga solo il vincitore.</b> Chi ha già l'offerta più alta <b>può rialzare da solo</b> (tocca di nuovo il suo avatar): è strategia, così chi ha pochi crediti non ci arriva più.",
      "Attenzione: devi tenere <b>almeno 1 credito per ogni round che resta</b>, altrimenti rimani a piedi. Sotto ogni avatar si leggono i crediti e <b>fin dove può arrivare</b>.",
      "<b>🎭 Quattro round diversi</b> (si spengono nel ⚙️): 1° <b>🔨 normale</b>; 2° <b>✉️ busta chiusa</b> (tutti scrivono in segreto quanto offrono e si aprono le buste insieme: vince l'offerta più alta, a pari offerta chi ha chiuso prima; chi ha scelto la carta offre almeno 1); 3° <b>📦 lotto doppio</b> (un lotto ha 2 carte: chi lo vince le prende tutte e due); 4° <b>🎁 pacco a sorpresa</b> (una carta è coperta: si scopre solo quando qualcuno la vince).",
      "Alla fine esce la <b>carta-scenario</b> (per esempio «Gli zombie sfondano la porta: chi arriva vivo a domani?»): ognuno dà con un tocco la sua <b>⭐ al kit che se la cava meglio</b> (non il suo). Vince chi raccoglie più stelle; a pari stelle il kit che <b>vale di più</b> (le fasce svelate: A 3, B 2, C 1), poi chi ha <b>più crediti avanzati</b>.",
      "<b>🧨 La carta maledetta</b> (se l'host la accende): una volta a partita, nel 2° o nel 3° round, esce una carta che <b>nessuno vuole</b>. A turno ognuno sceglie: <b>💸 paga</b> 1 credito in più dell'ultimo per scansarla, oppure <b>😩 se la prende</b>. Chi non decide in tempo se la prende. Il <b>primo che se la prende</b> la mette nel kit e non paga niente; <b>tutti gli altri pagano</b> quello che hanno offerto. Nel voto finale chi ce l'ha perde <b>mezza stella</b> (🧨 −0,5 ⭐).",
      "<b>Mini asta Fantacalcio</b>: 20 crediti a testa per una rosa da 5 (1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante). I calciatori escono a caso uno alla volta e partono da <b>1 credito</b>; si offre a salto: <b>+1</b>, <b>+2</b> o <b>+5</b>. Ci sono <b>6 secondi</b> per la prima offerta e <b>8</b> dopo ogni rilancio, poi chi offre di più se lo prende. Se nessuno lo vuole <b>torna in fondo al mazzo</b> e si va avanti; solo quando tutti quelli rimasti di un ruolo sono stati rifiutati <b>2 volte</b>, vanno a caso a chi ne ha ancora bisogno.",
      "Nel fantacalcio alla fine si scoprono le <b>quotazioni vere</b> dei calciatori: vince la rosa che <b>vale di più</b>. A pari valore vince chi ha <b>più crediti avanzati</b>.",
      "A fine partita i <b>titoli scherzosi</b> (non sono trofei): 💸 lo sprecone, 🧊 il braccino corto, 🎯 il cecchino dell'ultimo secondo… e con <b>📸</b> mandi la foto della tua rosa (o del tuo kit) nel gruppo."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "telefono";
      dove.formato = "temi";
      dove.crediti = 15;
      dove._creditiTemi = 15;

      dove.maledetta = dove.maledetta === true;   // (riaprendo «⚙️ Regole» resta com'era; di base No)
      dove.round = dove.round === "normali" ? "normali" : "misti";   // (di base i 4 round diversi)
      // contenitori che compaiono/spariscono in base alla modalità scelta
      var wrapCrediti = el("div", {}), wrapTema = el("div", {}), wrapFanta = el("div", { hidden: "hidden" }), wrapMal = el("div", {}), wrapRound = el("div", {});

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
        wrapMal.hidden = (f !== "temi");
        wrapRound.hidden = (f !== "temi");
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

      // --- Nota Fantacalcio (solo modalità Fantacalcio) ---
      wrapFanta.appendChild(el("div", { class: "link-avviso",
        text: "⚽ 20 crediti a testa · rosa da 5 (1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante). I calciatori escono dal mazzo uno alla volta, in ordine tutto a caso, e si rilancia di +1, +2 o +5. Alla fine vince la rosa che vale di più." }));
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
        tipi: tipiPartita(t.impostazioni), salto: 1,   // 🎭 i round diversi; di quanto rilancia chi tocca il suo avatar
        malPiano: t.impostazioni && t.impostazioni.maledetta ? pianoMaledetta(t.giocatori.length) : null,   // 🧨 la carta maledetta (regola dell'host)
        giocatori: t.giocatori.map(function (n) { return { nome: n, crediti: crediti, kit: [], stelle: 0, asteVinte: 0, st: statNuove() }; })
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
    var s = t.schermata({ icona: "🔨", titolo: "L'Asta", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: msg, style: "font-size:1.05rem" }));
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
    var nuvola = el("div", { class: "sa-nuvola" }), nota = el("small"), manca = el("i", { class: "sa-manca" });
    var passo = el("button", { class: "sa-passo", text: "passo", onclick: function (e) { e.stopPropagation(); S.ultimiDati.onPassa(p.id); } });
    var nodo = el("div", { class: "sa-pers", role: "button", onclick: function () {
      var dd = S.ultimiDati, q = S.pers[p.id]; if ((dd.io == null || dd.io === p.id) && q && q.puo) dd.onRilancia(p.id); } }, [
      el("div", { class: "sa-figura" }, [ el("img", { class: "sa-sedia", src: sedia, alt: "" }), el("img", { class: "sa-av", src: srcAv(cfg, GIU), alt: "" }),
        el("img", { class: "sa-av sa-su", src: srcAv(cfg, SU), alt: "" }), paletta, nuvola, el("i", { class: "sa-num", text: String(p.num) }) ]),
      el("b", { text: p.nome.length > 9 ? p.nome.slice(0, 9) + "…" : p.nome }), nota, manca, passo
    ]);
    S.pers[p.id] = { nodo: nodo, nota: nota, manca: manca, passo: passo, nuvola: nuvola, puo: false };
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
      if (q.nota.textContent !== nt) q.nota.textContent = nt;
      if (q.manca.textContent !== mn) q.manca.textContent = mn;
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
    if (d.kPiede != null && d.kPiede === S.kPiede && S.notaP && S.notaP.parentNode === S.piede) { if (S.notaP.textContent !== (d.nota || "")) S.notaP.textContent = d.nota || ""; return; }
    S.kPiede = d.kPiede;
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
    var g = S.squadre[e.chiId];
    // lo speaker sfotte: due della stessa squadra, il derby, l'affare da 1, la follia
    speaker(e.tipo !== "forzata" ? (battutaRosa(e.chiNome, g && g.kit, e.carta) || battutaAggiudica(e.chiNome, e.prezzo, d.budget))
      : e.motivo === "ufficio" ? "Nessuno li ha voluti per 2 volte: questo va a caso a " + e.chiNome + " per " + e.prezzo
      : "Solo " + e.chiNome + " cerca un " + ((FANTA_RUOLI[e.carta.ruolo] || {}).nome || "").toLowerCase() + ": è suo per " + e.prezzo + "!");
    if (e.tipo === "vinta" && (d.io == null || d.io === e.chiId)) vibra(35);   // il martello per chi l'ha vinto (sullo stesso telefono, per tutti)
    S.vista = e.chiId;
    var posti = g ? slotRosa(g.kit) : [], i = -1;
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
    var hoPassato = a.passati.indexOf(myId) >= 0, guido = a.leaderId === myId, prezzi = prezziSalto(a.offerta, false, SALTI_TEMI), prezzo = prezzi[0];
    var inGara = io && !io.haCarta, max = io ? io.crediti - ((vm.totRound - 1) - vm.roundIdx) : 0;
    // il rilancio porta con sé quale asta e quale offerta ho visto: se nel frattempo è cambiata, non conta (e niente doppi tocchi)
    var offri = function (p) { if (unTocco(cb)) cb.onRilancia({ n: a.n, prezzo: p, vista: a.offerta }); };
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
      prezzo: a.offerta, leader: a.leaderId || null, persone: persone, io: myId || "—", mie: mie,
      kPiede: [a.n, a.offerta, guido ? 1 : 0, hoPassato ? 1 : 0, inGara ? 1 : 0, max].join("|"),
      giro: a.giro, resta: a.resta, durata: SECONDI * 1000,
      nota: !io ? "Stai guardando la partita" : !inGara ? "Hai già la tua carta di questo round" : hoPassato ? "Hai passato: aspetti il risultato" : guido ? (max >= prezzo ? "👑 L'offerta più alta è tua: tocca ancora per rialzare" : "👑 L'offerta più alta è tua")
        : tardi ? "⏱ Troppo tardi di un soffio: qualcuno ha offerto prima di te. Ora è " + a.offerta + " 💰" : "Hai " + io.crediti + " 💰 · puoi arrivare a " + Math.max(0, max),
      onRilancia: function () { offri(prezzo); }, onPassa: function () { cb.onPassa({ n: a.n }); },
      onIndietro: function () { t.conferma("Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); },
      extra: { testo: "🃏 Carte", apri: function () { var b = el("div", {}), pal = dettaglioPalio(el, vm.tavolo, a.carta.nome); if (pal) b.appendChild(pal); b.appendChild(pannelloKit(el, vm.giocatori)); foglioSala(t, "🃏 Le carte", b); } }
    });
  }
  // (online) i miei tasti per offrire: il primo grande (+1, o «Lo prendo a 1»), accanto i salti (+3, o +2 e +5) e «Passo».
  // Un salto che supera il massimo che posso offrire è spento. Chi guida rialza (non passa).
  // o: { prezzi, salti, max, guido, primo (fanta: nessuno ha ancora offerto), inGara, offri(prezzo), passa() }
  function tastiOfferta(el, o) {
    if (!o.inGara) return [];
    var out = [], p0 = o.prezzi[0];
    var b0 = el("button", { class: "btn btn-verde sa-grande", text: o.primo ? "🙋 Lo prendo a " + p0 + " 💰" : (o.guido ? "🙋 Rialzo: " : "🙋 Rilancio: ") + p0 + " 💰", onclick: function () { o.offri(p0); } });
    if (o.max < p0) b0.disabled = true;
    out.push(b0);
    var riga = el("div", { class: "as-salti" });
    o.salti.forEach(function (s, i) {
      if (!i) return;
      var p = o.prezzi[i], b = el("button", { class: "btn btn-verde", onclick: function () { o.offri(p); } }, [ document.createTextNode("+" + s), el("small", { text: p + " 💰" }) ]);
      if (o.max < p) b.disabled = true;
      riga.appendChild(b);
    });
    if (!o.guido) riga.appendChild(el("button", { class: "btn btn-rosso", text: "Passo", onclick: o.passa }));
    out.push(riga);
    return out;
  }
  // (online, fantacalcio) lo stadio visto da questo telefono
  function stadioVM(t, vm, cb) {
    var el = t.el, myId = cb.myId, a = vm.fase === "asta" ? vm.asta : null, e = vm.fase === "esito" ? vm.esito : null, io = trova(vm.giocatori, myId);
    var carta = a ? a.carta : e ? e.carta : null; if (!carta) return;
    var ru = FANTA_RUOLI[carta.ruolo] || {};
    var hoPassato = !!a && a.passati.indexOf(myId) >= 0, guido = !!a && a.leaderId === myId;
    var prezzi = a ? prezziSalto(a.offerta, !a.leaderId, SALTI_FANTA) : [0], prezzo = prezzi[0];
    var inGara = !!(a && io && (io.conta[a.ruolo] || 0) < FANTA_SLOT[a.ruolo]), max = io ? io.max : 0;
    // l'offerta porta con sé quale calciatore e quale offerta ho visto: se nel frattempo è cambiata, non conta (e niente doppi tocchi)
    var offri = function (p) { if (a && unTocco(cb)) cb.onRilancia({ n: a.nCarta, prezzo: p, vista: a.offerta }); };
    var mie = a ? tastiOfferta(el, { prezzi: prezzi, salti: SALTI_FANTA, max: max, guido: guido, primo: !a.leaderId, inGara: inGara && !hoPassato,
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
      carta: carta, giroCarta: a ? a.nCarta : e.nCarta, prezzo: a ? a.offerta : e.prezzo, base: !!a && !a.leaderId, leader: a ? (a.leaderId || null) : (e.chiId || null),
      budget: FANTA_BUDGET, grosso: 5,
      persone: persone, io: myId || "—", mie: mie, giro: a ? a.giro : null, resta: a ? a.resta : 0, durata: a ? (a.durata || FANTA_RILANCIO_MS) : FANTA_RILANCIO_MS, puoPassare: false,
      kPiede: a ? [a.nCarta, a.offerta, a.leaderId ? 1 : 0, guido ? 1 : 0, hoPassato ? 1 : 0, inGara ? 1 : 0, max].join("|") : null,
      esito: e ? { n: e.n, nCarta: e.nCarta, tipo: e.tipo, motivo: e.motivo || "", chiId: e.chiId, chiNome: e.chiNome, carta: e.carta, prezzo: e.prezzo } : null,
      avviso: a ? avvisoFanta(a.ultimoDuello, a.ultimaChiamata, a.ruolo) : "",
      nota: !a ? "" : !io ? "Stai guardando la partita" : !inGara ? "Hai già " + (a.ruolo === "C" ? "i 2 centrocampisti" : "il " + ru.nome.toLowerCase()) + " in rosa" : hoPassato ? "Hai passato: aspetti il risultato" : guido ? (max >= prezzo ? "👑 L'offerta più alta è tua: tocca ancora per rialzare" : "👑 L'offerta più alta è tua")
        : tardi ? "⏱ Troppo tardi di un soffio: qualcuno ha offerto prima di te. Ora è " + a.offerta + " 💰" : "Hai " + io.crediti + " 💰 · puoi arrivare a " + Math.max(0, max),
      onRilancia: function () { offri(prezzo); }, onPassa: function () { if (a) cb.onPassa({ n: a.nCarta }); },
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
  //  spunta il suo valore sulla maglia. Poi il podio. A pari valore vince chi ha più crediti avanzati.
  // =========================================================
  var RIVELA = null;
  function valoreCalc(c) { var V = (window.SG_FANTA_QUOTAZIONI || {}).valori || {}, v = +V[c.nome + " (" + c.squadra + ")"]; return v > 0 ? v : 1; }
  function classificaFanta(giocatori) {
    var righe = giocatori.map(function (g, i) {
      var kit = ordinaRosa(g.kit || []).map(function (c) { return { nome: c.nome, squadra: c.squadra, ruolo: c.ruolo, valore: valoreCalc(c), prezzo: c.prezzo || 0 }; }), tot = 0;
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
  function fermaRivela(R) { if (!R) return; R.timer.forEach(function (x) { clearTimeout(x); }); R.timer = []; if (R.iv) { clearInterval(R.iv); R.iv = null; } if (R.tit) { clearInterval(R.tit); R.tit = null; } }
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
    fermaRivela(R); R.finito = true;
    // il tasto in alto diventa «📸 Foto» (la rosa da mandare nel gruppo); se non c'è la foto, sparisce
    if (R.opz.foto) { R.salta.textContent = "📸 Foto"; R.salta.onclick = function () { R.opz.foto(); }; } else R.salta.style.visibility = "hidden";
    var el = document.createElement.bind(document), w = R.righe[0];
    R.campoBox.style.display = "none"; R.podio.style.display = "";
    var primi = R.righe.filter(function (r) { return r.pos === 1; });   // (a pari valore e pari crediti vincono insieme)
    if (w) { R.magliaImg.src = srcAv(cfgDi(w.nome, w.omino), {}); R.nome.textContent = primi.map(function (r) { return r.nome; }).join(" e "); R.prezzoN.textContent = w.totale; R.chi.textContent = primi.length > 1 ? "pari merito! 🏆" : "vince! 🏆"; R.squadra.textContent = ""; rianima(R.schermo, "entra"); }
    rianima(R.ticker, "via", "Vince la rosa che vale di più! A pari valore, chi ha più crediti avanzati.");
    // 🏅 poi sul maxischermo girano i titoli scherzosi, uno ogni 3 secondi
    var tl = (R.opz.titoli || []).map(function (x) { return x.icona + " " + x.titolo + ": " + x.chi; }), k = 0;
    if (tl.length) R.tit = setInterval(function () { if (!vivoRivela(R)) { clearInterval(R.tit); R.tit = null; return; } rianima(R.ticker, "via", tl[k++ % tl.length]); }, 3200);
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
      out.push(el("div", { style: "font-size:1.05rem;font-weight:900", text: "✉️ Si aprono le buste!" }));
      var box = el("div", { class: "as-buste" }), dal = e.buste.slice().reverse();   // dalla più bassa alla più alta
      dal.forEach(function (b, i) {
        var vince = i === dal.length - 1, r = el("div", { class: "r" + (vince ? " vince" : "") }, [ el("span", { text: vince ? "🏆" : "✉️" }),
          el("b", { text: myId != null && b.id === myId ? "Tu" : b.nome }), el("span", { text: b.q ? b.q + " 💰" : "niente" }) ]);
        r.style.animationDelay = (0.35 + i * 0.45) + "s";
        box.appendChild(r);
      });
      out.push(box);
    } else out.push(el("div", { style: "font-size:3rem;line-height:1", text: "🔨" }));
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
    if (votante >= st.giocatori.length) {
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
    var fitto = st.giocatori.length > 5;
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
    return el("button", { type: "button", class: "as-vk" + (fitto ? " fitto" : "") + (mal ? " maled" : ""), onclick: onclick }, [
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
      var righe = classificaFanta(st.giocatori);
      st.titoli = titoliFine(st.giocatori, FANTA_BUDGET, righe);
      return rivelaFanta(t, righe, { chiave: "rl|" + st.sessione, onEsci: function () { esciAsta(t, st); }, titoli: st.titoli,
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
    var el = t.el, s = t.schermata({ icona: "🏅", titolo: "I titoli della serata", sotto: "Non sono trofei: sono sfottò" });
    s.classList.add("as-fissa");
    var tit = nodoTitoli(el, st.titoli);
    if (tit) s._contenuto.appendChild(tit);
    else s._contenuto.appendChild(el("p", { class: "as-msg", text: "Partita tirata: nessuno si è preso un titolo! 😄" }));
    var box = el("div", { class: "as-kits" });
    righe.forEach(function (r) { box.appendChild(nodoKit(el, { nome: r.pos + "° " + r.nome + " · valore " + r.totale, crediti: r.crediti, kit: r.kit }, st)); });
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
    var s = t.schermata({ icona: "🃏", titolo: "Fasce svelate!", sotto: "Ecco il vero valore delle carte" });
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
        ctx.fillText((una.pos ? una.pos + "° posto · " : "") + "valore " + una.totale + (una.crediti != null ? " · " + una.crediti + " 💰 avanzati" : ""), W / 2, 185);
        var hc = campoTela(ctx, 110, 215, W - 220, una.kit || [], true), yl = 215 + hc + 28;
        // sotto il campetto la rosa in lista: ruolo, nome, squadra, quanto l'hai pagato e quanto vale
        ordinaRosa(una.kit || []).forEach(function (c, i) {
          var y = yl + i * 66, ru = FANTA_RUOLI[c.ruolo] || {};
          rett(ctx, 60, y, W - 120, 58, 14); ctx.fillStyle = i % 2 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.14)"; ctx.fill();
          ctx.textAlign = "left"; ctx.fillStyle = "#ffe066"; ctx.font = "900 26px " + FONT; ctx.fillText(ru.breve || "", 80, y + 41);
          ctx.fillStyle = "#fff"; ctx.font = "800 32px " + FONT; ctx.fillText(testoCorto(ctx, c.nome + (c.squadra ? " · " + c.squadra : ""), W - 520), 160, y + 42);
          ctx.textAlign = "right"; ctx.font = "800 28px " + FONT; ctx.fillStyle = "#ffe066";
          ctx.fillText((c.prezzo ? c.prezzo + " 💰" : "") + (c.valore != null ? "  vale " + c.valore : ""), W - 80, y + 41);
        });
      } else {
        ctx.font = "900 60px " + FONT; ctx.fillText("⚽ Le rose della serata", W / 2, 110);
        var n = Math.min(righe.length, 10), col = n <= 1 ? 1 : 2, rows = Math.ceil(n / col), gap = 24, top = 160, bottom = H - 130;
        var cw = (W - 60 - gap * (col - 1)) / col, chMax = (bottom - top - gap * (rows - 1)) / rows, cwFit = Math.min(cw, (chMax - 46) * 36 / 25);
        righe.slice(0, n).forEach(function (r, i) {
          var cx = 30 + (i % col) * (cw + gap) + (cw - cwFit) / 2, cy = top + Math.floor(i / col) * (chMax + gap);
          ctx.textAlign = "center"; ctx.fillStyle = r.pos === 1 ? "#ffe066" : "#fff"; ctx.font = "900 " + Math.round(Math.min(34, cwFit / 11)) + "px " + FONT;
          ctx.fillText(testoCorto(ctx, (r.pos === 1 ? "🏆 " : r.pos + "° ") + r.nome + " · " + r.totale, cwFit), cx + cwFit / 2, cy + 32);
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
        passati: Object.keys(st.asta.passati), giro: st.giro, resta: st.scadenza ? st.scadenza - ora : 0   // il tempo che resta (non l'ora: gli orologi dei telefoni non sono uguali)
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
  // un tocco alla volta: un doppio tocco (entro mezzo secondo) conta una volta sola
  function unTocco(cb) { var ora = Date.now(); if (ora - (cb._tocco || 0) < 500) return false; cb._tocco = ora; return true; }
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
      if ((im.formato || "temi") === "fanta") { st.morto = true; TM.smetti(); return avviaAsta(t); }
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
    var rete = ospitaAsta(cbRete, { ripresa: ripresa });   // (con la ripresa gli amici non tornano in saletta)

    function invia() { rete.invia({ t: "vm", vm: vmAsta(st) }); ricorda(); }
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
    // m: { n (quale asta), prezzo, vista (l'offerta che vedeva) }: un'offerta vecchia o doppia non conta; i salti +1 e +3
    function rilanciaO(id, m) {
      if (st.fase !== "asta" || !st.asta || !m || (m.n != null && m.n !== st.nAsta)) return;
      var g = perId(st, id); if (!g) return;
      if (st.senzaCarta.indexOf(id) < 0) return;   // (anche chi ha già l'offerta più alta può rialzare da solo: è strategia)
      var p = prezzoOfferto(m, st.asta.offerta, false, SALTI_TEMI);
      if (p === "tardi") { if (st.asta.leader !== id) tardi(id); return; }   // (un doppio tocco di chi guida non conta, senza "troppo tardi")
      if (p == null || maxPuntataG(st, g) < p) return;
      segnaRilancio(g, p - st.asta.offerta, 3);
      st.asta.ultimoSec = st.scadenza && st.scadenza - Date.now() < 2000 ? id : null;   // 🎯 all'ultimo secondo
      st.asta.offerta = p; st.asta.leader = id;
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
    var cb = {
      myId: null, sonoHost: false,
      onScegli: function (x) { manda({ t: "scegli", idx: x.idx, n: x.n, nome: x.nome }); },
      onRilancia: function (x) { manda({ t: "rilancia", n: x.n, prezzo: x.prezzo, vista: x.vista }); },
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
    var wrap = el("div", {});
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

    s._contenuto.appendChild(testaRound(el, vm));
    s._contenuto.appendChild(strisciaOnline(el, vm, myId));

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
      var e2 = vm.esito || {};
      s._contenuto.appendChild(el("div", { style: "display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px" }, nodiEsitoTemi(el, e2, myId)));
      var kV = vm.sessione + "|" + vm.roundIdx + "|" + (e2.carta && e2.carta.nome);
      if (e2.chiId === myId && cb._vibEsito !== kV) { cb._vibEsito = kV; vibra(35); }   // l'hai vinta tu: il martello si sente
      piedeAuto(t, s, vm, cb, "Avanti ▶", "Si va avanti da soli…");
    }

    else if (vm.fase === "malEsito" && vm.malEsito) {   // 🧨 chi si è presa la carta maledetta e chi ha pagato
      var em = vm.malEsito;
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
    s._contenuto.appendChild(nodoScenario(el, vm.scenario, true));
    V.cosa = el("p", { class: "as-msg", style: "margin:0 0 8px" });
    s._contenuto.appendChild(V.cosa);
    var fitto = vm.giocatori.length > 5;
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
    var fa = t.faccine ? t.faccine() : null;
    if (fa && !io) s._contenuto.appendChild(el("div", { style: "display:flex;justify-content:center;margin-top:10px" }, [ fa ]));
    V.conto = el("p", { class: "as-msg", style: "margin:0" });
    s._piede.appendChild(V.conto);
    if ((vm.restaVoto || 0) > 0 && t.contoAvanti) t.contoAvanti(V.conto, Math.max(1, Math.ceil(vm.restaVoto / 1000)), null, k + "|conto");
    V.chiudi = cb.sonoHost && cb.onChiudiVoti ? el("button", { class: "btn btn-fantasma", onclick: cb.onChiudiVoti }) : null;
    V.agg = function (v) {
      V.vm = v;
      var mio = cb._mioVoto && cb._mioVoto.s === v.sessione ? cb._mioVoto.per : null, n = (v.hannoVotato || []).length, tot = v.giocatori.filter(function (g) { return !g.via; }).length;
      Object.keys(V.bott).forEach(function (id) { var c = "as-vk" + (fitto ? " fitto" : "") + (id === mio ? " scelto" : "") + (V.bott[id].classList.contains("maled") ? " maled" : ""); if (V.bott[id].className !== c) V.bott[id].className = c; });
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
    };
    V.agg(vm);
    t.mostra(s);
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
    if (vm.scenario) { var sc = nodoScenario(el, vm.scenario, false); sc.style.marginTop = "2px"; s._contenuto.appendChild(sc); }
    var ol = el("ol", { class: "classifica" + ((vm.classifica || []).length > 5 ? " fitta" : "") });   // (da 6 in su su due colonne: si vede tutta)
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
    var fa = t.faccine ? t.faccine() : null;   // le faccine della saletta: si festeggia (o si sfotte) tutti insieme
    if (fa || fotoB) s._piede.appendChild(el("div", { class: "as-foto as-foto-riga" }, [ fa, fotoB ]));
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
    g.crediti -= prezzo; g.kit.push({ nome: carta.nome, squadra: carta.squadra, ruolo: carta.ruolo, tier: carta.tier, prezzo: prezzo }); g.conta[carta.ruolo] = (g.conta[carta.ruolo] || 0) + 1;
  }

  // ---------- SINGOLO TELEFONO ----------
  function avviaFanta(t) {
    var st = {
      formato: "fanta", sessione: nuovaSessione(), asta: null, giriVuoti: 0, salto: 1,
      giocatori: t.giocatori.map(function (n) { return { nome: n, crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0, st: statNuove() }; })
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
    if (elegg.length === 1 || rifiutatiTutti(st.mazzo, carta.ruolo)) {           // uno solo ne ha bisogno, o tutti quelli del ruolo rifiutati 2 volte: d'ufficio a 1
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
      budget: FANTA_BUDGET, grosso: 5,
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
      fase: "lobby", iniziata: false, codice: "…", scadenza: null, _to: null, giriVuoti: 0, giro: 0, nCarta: 0, nEsiti: 0,
      giocatori: [{ id: IO, nome: (t.giocatori && t.giocatori[0]) || "Host", crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0, st: statNuove(), omino: t.mioOmino ? t.mioOmino() : null }]
    };
    // la partita di prima (t.ripresa): stesse rose, stessi crediti, stesso mazzo (vedi riprendi)
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
            st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0, asteVinte: 0, st: statNuove(), omino: avatarOk(m.omino) });
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
    // m: { n (quale calciatore), prezzo, vista (l'offerta che vedeva) }: un'offerta arrivata in ritardo o doppia non conta; i salti +1, +2 e +5
    function rilanciaO(id, m) {
      if (st.fase !== "asta" || !st.asta || !m || m.n !== st.nCarta) return;
      var g = perId(st, id); if (!g || ruoloPieno(g, st.asta.ruolo)) return;   // (anche chi ha già l'offerta più alta può rialzare da solo: è strategia)
      var senza = st.asta.leader === null, prezzo = prezzoOfferto(m, st.asta.offerta, senza, SALTI_FANTA);
      if (prezzo === "tardi") { if (st.asta.leader !== id) tardi(id); return; }   // (un doppio tocco di chi guida non conta, senza "troppo tardi")
      if (prezzo == null || maxFanta(g) < prezzo) return;
      segnaRilancio(g, prezzo - (senza ? st.asta.offerta - 1 : st.asta.offerta), 5);
      st.asta.ultimoSec = st.scadenza && st.scadenza - Date.now() < 2000 ? id : null;   // 🎯 all'ultimo secondo
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
      st.classifica = classificaFanta(st.giocatori);
      st.titoli = titoliFine(st.giocatori, FANTA_BUDGET, st.classifica);   // 🏅 i titoli scherzosi
      st.fase = "fine"; bd();
      if (t.risultato) t.risultato(st.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));   // per il torneo online
    }
    function nuovaInLobby() {
      stopTo();
      st.iniziata = false; st.fase = "lobby"; st.mazzo = []; st.asta = null; st.esito = null; st.classifica = null; st.scadenza = null; st.giriVuoti = 0;
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
      onEsci: function () { stopTo(); clearTimeout(tAttesi); if (t.ricorda) t.ricorda(null); TM.smetti(); cb._uscito = true; fermaTutto(); rete.chiudi(); t.esci(); }
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
        passati: Object.keys(a.passati || {}), giro: st.giro, durata: st.durata || FANTA_RILANCIO_MS, resta: st.scadenza ? st.scadenza - Date.now() : 0,   // il tempo che resta (non l'ora: gli orologi dei telefoni non sono uguali)
        ultimaChiamata: ultimaChiamata(st.mazzo, a.carta),
        ultimoDuello: (st.giocatori.filter(function (g) { return !ruoloPieno(g, a.ruolo); }).length === 2 &&
          st.mazzo.filter(function (c) { return c.ruolo === a.ruolo; }).length === 2)
      } : null,
      esito: e ? { n: e.n, nCarta: e.nCarta, tipo: e.tipo, motivo: e.motivo || "", chiId: e.chiId, chiNome: e.chiNome, prezzo: e.prezzo, carta: { nome: e.carta.nome, squadra: e.carta.squadra, ruolo: e.carta.ruolo, rifiuti: e.carta.rifiuti || 0 } } : null,
      restano: st.mazzo ? st.mazzo.length : 0, presi: postiPresi(st.giocatori),
      classifica: st.classifica || null,
      titoli: st.fase === "fine" ? (st.titoli || []) : null
    };
  }

  // ---------- DISEGNO CONDIVISO FANTACALCIO (host e ospiti) ----------
  function disegnaFantaVM(t, vm, cb) {
    if (vm.fase === "lobby") { fermaConta(STADIO); STADIO = null; return lobbyAsta(t, vm, cb); }
    if (vm.fase === "fine") {
      salvaTrofeiAsta(t, vm, cb.myId, true);
      var io = trova(vm.giocatori, cb.myId);
      return rivelaFanta(t, vm.classifica || [], { chiave: "ro|" + (vm.codice || "") + "|" + vm.sessione, titoli: vm.titoli || [],
        foto: function () { fotoRose(vm.classifica || [], io ? io.nome : null); },   // 📸 la mia rosa (chi guarda: tutte)
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
