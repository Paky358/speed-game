// Prove del controllore del Passo 2 (301-306): i casi cattivi del Torneo a eliminazione nella Sala
// (ricariche, chi esce mentre ci si siede, il Bot quando chi gli sta davanti ricarica).
// Si carica dopo il copione: await COPIONE.carica("passo2/controllo.js"); await COPIONE.prova(301)
(function () {
  var A = COPIONE.aiuti, W = window, T = A.T, no = A.no, vm = A.vm, tn = A.tn;
  function posto(w, n, i) { var p = w.document.querySelectorAll(".sl-tab .tb-posti")[n - 1]; return p ? p.querySelectorAll(".tb-posto")[i] : null; }
  async function siede(S, w, nome, n, i) {
    var b = await W.aspetta(function () { return posto(w, n, i); }, 4000);
    if (!b) no(nome + " non vede la Partita " + n);
    b.click();
    if (!await W.aspetta(function () { return (tn(S).gironi || {})[A.idInSala(S, nome)] === n; }, 4000)) no(nome + " tocca la Partita " + n + " ma non si siede");
  }
  async function coppieScelte(P, S) {
    await A.apriSceltaTn(P);
    A.chipTn(P, "Scegliete voi");
    if (!W.clicca(P, /Via al torneo/, ".piede button")) no("non c'è «⚔️ Via al torneo»");
    var E = await W.aspetta(function () { var e = tn(S); return e && e.scade && !e.iniziato ? e : null; }, 5000);
    if (!E) no("non si apre la scelta delle coppie");
    return E;
  }
  function insieme(t0, a, b) { return t0.some(function (p) { return (p.a === a && p.b === b) || (p.a === b && p.b === a); }); }

  // 301. Coppie scelte in 4: Giulia si siede, l'host RICARICA la pagina mentre ci si siede. Dopo: i posti ci sono ancora,
  //      Luca si siede accanto a Giulia, il conto alla rovescia c'è e il torneo parte DA SOLO allo scadere (niente Sala ferma)
  COPIONE.aggiungi(301, { nome: "Coppie scelte: l'host ricarica mentre ci si siede, i posti restano e si parte da soli", fai: async function () {
    var R = await A.salaConAmici(["Giulia", "Luca", "Marco"]), S = R.S, P = R.w.Paky;
    var E = await coppieScelte(P, S);
    await siede(S, R.w.Giulia, "Giulia", 1, 0);
    await W.ricarica("Paky"); P = W.finestra("Paky");
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-tab .tb-posto").length === 4; }, 15000)) no("dopo la ricarica Paky non ha i posti («" + T(P).slice(0, 100) + "»)");
    var g = A.idInSala(S, "Giulia"), l = A.idInSala(S, "Luca");
    if ((tn(S).gironi || {})[g] !== 1) no("dopo la ricarica dell'host Giulia non è più seduta");
    await siede(S, R.w.Luca, "Luca", 1, 1);
    if (!await W.aspetta(function () { var c = P.document.querySelector(".tb-conto"); return c && /\d+ s/.test(c.textContent) && !/ 0 s/.test(c.textContent); }, 3000)) no("dopo la ricarica il conto alla rovescia non c'è (o è a 0)");
    var E1 = await W.aspetta(function () { var e = tn(S); return e && e.iniziato ? e : null; }, Math.max(0, E.scade - Date.now()) + 12000);
    if (!E1) no("scaduto il tempo, dopo la ricarica dell'host il torneo non parte da solo («" + T(P).slice(0, 80) + "»)");
    if (!insieme(E1.turni[0], g, l)) no("Giulia e Luca non giocano insieme: " + JSON.stringify(E1.turni[0]));
    return "posti rimasti dopo la ricarica, Giulia–Luca insieme, partito da solo (" + E1.turni[0].length + " partite)";
  } });

  // 302. In 5 col Bot: chi gioca col Bot RICARICA a metà partita: ritrova la sua partita col Bot (non persa a tavolino),
  //      chi guarda la vede ancora, e il torneo arriva in fondo
  COPIONE.aggiungi(302, { nome: "Torneo in 5 col Bot: chi gioca col Bot ricarica a metà e ritrova la partita", fai: async function () {
    var R = await A.salaConAmici(["Giulia", "Luca", "Marco", "Bea"]), S = R.S, P = R.w.Paky;
    await A.apriSceltaTn(P);
    A.chipTn(P, "Gioca col Bot");
    var E = await A.viaTn(P, S);
    var pb = E.turni[0].filter(function (p) { return p.b === "bot"; })[0];
    if (!pb) no("non c'è la partita col Bot");
    var chi = A.nomeTn(E, pb.a), wC = W.finestra(chi);
    if (!await W.aspetta(function () { return wC.document.querySelectorAll(".tr-cella").length === 9; }, 10000)) no(chi + " non ha la partita col Bot");
    // una mossa, se tocca a lui
    var libera = [].find.call(wC.document.querySelectorAll(".tr-cella"), function (c) { return !c.textContent.trim(); });
    if (libera) libera.click();
    await W.dorme(1500);
    await W.ricarica(chi); wC = W.finestra(chi); P = W.finestra("Paky");
    if (!await W.aspetta(function () { return wC.document.querySelectorAll(".tr-cella").length === 9; }, 15000)) no(chi + " ha ricaricato e non ritrova la partita col Bot («" + T(wC).slice(0, 100) + "»)");
    if (A.partitaTn(S, pb.k).vince) no("chi ha ricaricato ha perso col Bot a tavolino");
    if (!await W.aspetta(function () { var v = vm(pb.stanza); return v && v.board; }, 8000)) no("dopo la ricarica la partita col Bot non si trasmette più");
    var Ef = await A.finoAllaFineTn(P, S);
    return chi + " ricarica contro " + Ef.bot.nome + " e ritrova la partita; torneo finito (vince " + A.nomeTn(Ef, Ef.campione) + ")";
  } });

  // 303. Coppie scelte in 5: Marco si siede e poi ESCE dalla Sala prima del Via: nessuno gioca contro Marco,
  //      in 4 si è pari (niente Bot) e chi era seduto con lui gioca lo stesso
  COPIONE.aggiungi(303, { nome: "Coppie scelte in 5: uno seduto esce prima del Via, nessuno gioca contro un fantasma", fai: async function () {
    var R = await A.salaConAmici(["Giulia", "Luca", "Marco", "Bea"]), S = R.S, P = R.w.Paky;
    await coppieScelte(P, S);
    await siede(S, R.w.Marco, "Marco", 3, 0);
    await siede(S, R.w.Giulia, "Giulia", 3, 1);
    var m = A.idInSala(S, "Marco"), g = A.idInSala(S, "Giulia");
    R.w.Marco.__reti.filter(function (h) { return h.__sala; }).forEach(function (h) { h.chiudi(); });
    if (!await W.aspetta(function () { return (vm(S).membri || []).length === 4; }, 8000)) no("Marco è uscito ma nella Sala sono ancora " + (vm(S).membri || []).length);
    if (!await W.aspetta(function () { return /Seduti \d su 4/.test(T(P)); }, 4000)) no("Paky non legge «Seduti N su 4» («" + T(P).slice(0, 120) + "»)");
    if (!W.clicca(P, /Via al torneo/, ".sl-go")) no("Paky non ha «Via al torneo»");
    var E1 = await W.aspetta(function () { var e = tn(S); return e && e.iniziato ? e : null; }, 5000);
    if (!E1) no("il torneo non parte");
    var t0 = E1.turni[0], dentro = {};
    t0.forEach(function (p) { dentro[p.a] = 1; if (p.b) dentro[p.b] = 1; });
    if (dentro[m]) no("Marco è uscito ma è nel tabellone: " + JSON.stringify(t0));
    if (dentro.bot) no("in 4 c'è il Bot: " + JSON.stringify(t0));
    if (t0.length !== 2 || t0.some(function (p) { return !p.b; })) no("primo turno sbagliato: " + JSON.stringify(t0));
    if (!dentro[g]) no("Giulia (seduta con Marco) non gioca");
    var Ef = await A.finoAllaFineTn(P, S);
    return "Marco esce, in 4 due partite vere (" + t0.map(function (p) { return A.nomeTn(E1, p.a) + "–" + A.nomeTn(E1, p.b); }).join(", ") + "), vince " + A.nomeTn(Ef, Ef.campione);
  } });

  // 304. In 4: l'HOST (che gioca una semifinale) ricarica a torneo in corso: il tabellone c'è ancora per tutti,
  //      la sua partita non è persa a tavolino e il torneo arriva in fondo
  COPIONE.aggiungi(304, { nome: "Torneo in 4: l'host ricarica a torneo in corso, il tabellone resta e si arriva in fondo", fai: async function () {
    var R = await A.salaConAmici(["Giulia", "Luca", "Marco"]), S = R.S, P = R.w.Paky;
    await A.apriSceltaTn(P);
    var E = await A.viaTn(P, S);
    var mia = E.turni[0].filter(function (p) { return p.a === "host" || p.b === "host"; })[0];
    if (!await W.aspetta(function () { return vm(mia.stanza).avvId; }, 12000)) no("la partita di Paky non si apre");
    await W.ricarica("Paky"); P = W.finestra("Paky");
    if (!await W.aspetta(function () { var e = tn(S); return e && e.iniziato && !e.finito && e.turni.length === 1; }, 15000)) no("dopo la ricarica dell'host il torneo non c'è più (" + JSON.stringify(vm(S).elim || null).slice(0, 120) + ")");
    if (A.partitaTn(S, mia.k).vince) no("l'host ha ricaricato e la sua partita è decisa a tavolino");
    if (!await W.aspetta(function () { return ["Giulia", "Luca", "Marco"].every(function (n) { var w = R.w[n]; return w.document.querySelector(".sl-tab, .tr-cella, .saletta-schermo"); }); }, 8000)) no("dopo la ricarica dell'host qualcuno non vede più il torneo");
    var Ef = await A.finoAllaFineTn(P, S);
    var letti = {};
    if (!await W.aspetta(function () { return ["Paky", "Giulia", "Luca", "Marco"].every(function (n) { letti[n] = T(W.finestra(n)); return /Hai vinto tu|Ha vinto /.test(letti[n]); }); }, 10000))
      no("a fine torneo non tutti leggono chi ha vinto (" + Object.keys(letti).map(function (n) { return n + ": «" + letti[n].slice(0, 60) + "»"; }).join("; ") + ")");
    return "l'host ricarica in semifinale, il torneo resta (vince " + A.nomeTn(Ef, Ef.campione) + ")";
  } });

  // 305. Fuori dalla Sala: saletta del Tris con 5 (percorso di prima), «⚔️ Fate il torneo in 5», tutti dentro col Bot
  COPIONE.aggiungi(305, { nome: "Saletta del Tris con 5 (fuori dalla Sala): «Fate il torneo in 5», tutti dentro, c'è il Bot", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris"), amici = ["Giulia", "Luca", "Marco", "Bea"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=tris&stanza=" + C, x: 185 * (i + 1) });
    var b = await W.aspetta(function () { var x = P.document.querySelector(".sl-torneino"); return x && !x.hidden && /in 5/.test(x.textContent) ? x : null; }, 12000);
    if (!b) no("Paky non vede «⚔️ Fate il torneo in 5» («" + T(P).slice(0, 100) + "»)");
    b.click();
    var S = await W.aspetta(function () { return A.codiceSala(); }, 5000); if (!S) no("non si apre la Sala del torneo");
    var E = await W.aspetta(function () { var e = tn(S); return e && e.iniziato ? e : null; }, 12000);
    if (!E) no("il torneo non parte («" + T(P).slice(0, 80) + "»)");
    if (Object.keys(E.nomi).length !== 5) no("nel torneo non ci sono tutti e 5 (" + JSON.stringify(E.nomi) + ")");
    if (!E.bot || !E.turni[0].some(function (p) { return p.b === "bot"; })) no("in 5 non c'è il Bot al primo turno: " + JSON.stringify(E.turni[0]));
    var ok = await W.aspetta(function () { return ["Paky"].concat(amici).every(function (n) { return W.finestra(n).document.querySelector(".tr-cella, .sl-tab, .tab-elim"); }); }, 12000);
    if (!ok) no("non tutti passano nel torneo (" + ["Paky"].concat(amici).map(function (n) { return n + ": «" + T(W.finestra(n)).slice(0, 40) + "»"; }).join("; ") + ")");
    if (["Giulia", "Luca", "Marco", "Bea"].some(function (n) { return /Collegamento perso|La stanza è chiusa/.test(T(W.finestra(n))); })) no("qualcuno legge «Collegamento perso»");
    var Ef = await A.finoAllaFineTn(P, S);
    return "«Fate il torneo in 5»: tutti e 5 nel torneo col Bot " + E.bot.nome + ", vince " + A.nomeTn(Ef, Ef.campione);
  } });

  // 307. Primo avvio: creato il profilo, chiude l'app su «Sei lui o lei?» senza scegliere: riaprendo l'app (anche dal
  //      link di un amico) torna «Sei lui o lei?»; scelto il look si va avanti e poi non lo chiede più
  COPIONE.aggiungi(307, { nome: "Primo avatar: chi chiude l'app prima di sceglierlo se lo ritrova alla riapertura", fai: async function () {
    var N = await W.apriTel("Nina", { x: 0, profilo: false });
    var b = await W.aspetta(function () { return N.document.querySelector(".benvenuto-profilo input.link-campo"); }, 5000);
    if (!b) no("niente benvenuto");
    var campi = N.document.querySelectorAll(".benvenuto-profilo input.link-campo");
    campi[0].value = "Nina"; campi[0].dispatchEvent(new N.Event("input", { bubbles: true })); campi[1].value = "segreto1";
    W.clicca(N, /^Avanti/);
    if (!await W.aspetta(function () { return N.document.querySelector(".primo-avatar .pa-forma"); }, 5000)) no("non si apre «Sei lui o lei?»");
    N = await W.chiudiApp("Nina");
    if (!await W.aspetta(function () { return N.document.querySelector(".primo-avatar .pa-forma"); }, 6000)) no("riaprendo l'app l'avatar non è più da scegliere («" + T(N).slice(0, 80) + "»)");
    await A.primoAvatar(N, 1, 2);
    if (!await W.aspetta(function () { return A.home(N); }, 4000)) no("scelto l'avatar non si arriva alla home");
    N = await W.chiudiApp("Nina");
    if (!await W.aspetta(function () { return A.home(N); }, 4000) || N.document.querySelector(".primo-avatar")) no("scelto l'avatar, riaprendo lo chiede ancora");
    return "chiusa l'app su «Sei lui o lei?», riaprendo lo richiede; scelto il look, poi non più";
  } });

  // 306. Sullo stesso telefono non si è rotto niente: ogni gioco, ogni modo locale (Contro il Bot, Su questo telefono, Da solo…)
  //      dalla home fino al tavolo, qualche secondo di gioco, nessun errore. opz.solo = ["tris"] per provarne solo alcuni
  COPIONE.aggiungi(306, { nome: "Stesso telefono: ogni gioco e ogni modo locale parte senza errori", fai: async function (opz) {
    A.spiaTavolo();
    var sempre = { indexOf: function () { return 0; } }, fatti = [], rotti = [];
    var P = await W.apriTel("Paky", { x: 0, spiaTav: sempre });
    await W.aspetta(function () { return P.__reg && Object.keys(P.__reg).length > 15; }, 6000);
    var reg = P.__reg || {}, ids = Object.keys(reg).filter(function (id) { return !opz || !opz.solo || opz.solo.indexOf(id) >= 0; });
    if (!ids.length) no("non vedo i giochi registrati");
    for (var i = 0; i < ids.length; i++) {
      var g = reg[ids[i]], modi = (g.modi || []).filter(function (m) { return !m.soloPer; });
      for (var j = 0; j < modi.length; j++) {
        var m = modi[j], nomeP = g.id + "/" + m.modo;
        await W.ricarica("Paky"); P = W.finestra("Paky");
        var err0 = (P.__err || []).length;
        try {
          var tess = await W.aspetta(function () { return A.tessera(P, g.nome); }, 6000);
          if (!tess) throw new Error("non trovo la tessera in home");
          tess.click(); await W.dorme(500);
          // (un gioco con un modo solo e senza online salta «Come giocate?»: si va dritti agli amici o alle impostazioni)
          var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return b.textContent.indexOf(m.nome) >= 0; }) || (P.__tav || !/Come giocate/.test(T(P)) ? "via" : null); }, 4000);
          if (!bm) throw new Error("in «Come giocate?» non c'è «" + m.nome + "» («" + T(P).slice(0, 60) + "»)");
          if (bm !== "via") bm.click();
          // gli amici sullo stesso telefono: quanti ne servono (almeno 2, 4 per i giochi a squadre)
          var serve = Math.max(m.min || 2, g.giocatoriMin || 2, 2);
          if (m.amici && await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 2500)) {
            var nomi = ["Paky", "Giulia", "Luca", "Marco", "Bea", "Nino"];
            while (P.document.querySelectorAll(".sala-riga input").length < serve) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
            [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k] || ("Amico " + k); c.dispatchEvent(new P.Event("input", { bubbles: true })); });
          }
          for (var k = 0; k < 6 && !P.__tav; k++) {
            await W.dorme(300);
            if (P.__tav) break;
            var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|Pronti|Partiamo|▶/.test(x.textContent) && !x.disabled; });
            if (b) b.click();
          }
          if (!await W.aspetta(function () { return P.__tav; }, 3000)) throw new Error("non parte («" + T(P).slice(0, 70) + "»)");
          await W.dorme(2500);
          var err = (P.__err || []).slice(err0);
          if (err.length) throw new Error("errori: " + err.slice(0, 2).join(" / "));
          fatti.push(nomeP);
        } catch (e) { rotti.push(nomeP + ": " + (e && e.message || e)); }
        P.__tav = null;
      }
    }
    if (rotti.length) no(rotti.length + " rotti: " + rotti.join(" | ") + " (ok: " + fatti.join(", ") + ")");
    return fatti.length + " modi locali ok: " + fatti.join(", ");
  } });
})();
