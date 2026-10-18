// PROVE DEL PASSO 5: L'OSPITE CHE RICARICA A PARTITA IN CORSO (18 ott 2026, visto coi telefoni veri in Palla Matta)
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo5/rientro-ospite.js"); await COPIONE.prova("5ro1")
// Nella Sala Paky e Giulia giocano a Palla Matta (un tiro a testa). Giulia:
// 5ro1 ricarica dopo 5 s (prima che l'host la tolga) → torna nella partita, al suo posto, coi suoi punti e palline;
// 5ro2 ha il telefono spento 25 s (l'host la toglie: «Aspettiamo Giulia…») e poi RICARICA → torna nella partita, l'avviso
//      all'host sparisce subito, si va avanti a tirare;
// 5ro3 ha il telefono spento 25 s e poi lo riaccende (senza ricaricare) → stessa cosa.
// 5ro4-5ro9: lo stesso caso di 5ro2 (spenta 25 s, poi ricarica a partita in corso) nei giochi a due della Sala:
// Tris, Drop 4, Battaglia Navale, Scopa, Calcio Biliardo, Pendolo (torna nella partita, non in saletta, un posto solo).
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function vm(C) { return W.vmDi(C) || {}; }
  function mioId(n) { return A.mioId(n); }
  function inSaletta(w) { return !!(w && w.document.querySelector(".saletta-schermo")); }
  function giocG(C) { return (vm(C).players || []).filter(function (p) { return p.id !== "host"; }); }

  // Paky apre la Sala, Giulia entra; Palla Matta per tutti e si comincia. Restituisce { S, C, P }
  async function pallaMatta() {
    var X = await A.salaConAmici(["Giulia"]), S = X.S, P = X.w.Paky;
    var C = await A.lanciaDallaSala("Paky", S, "Palla Matta");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 2; }, 8000)) no("Giulia non entra in Palla Matta");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("Palla Matta non comincia");
    return { S: S, C: C, P: P };
  }
  // chi è di turno tira (dal suo telefono); aspetta che il turno passi
  async function unTiro(C) {
    var v = vm(C), g = v.players[v.turno], w = W.finestra(g.id === "host" ? "Paky" : "Giulia"), seq = v.seq;
    if (!await W.aspetta(function () { var x = vm(C); return x.fs === "mira" && w.__PMpartita && w.__PMpartita.st().fase === "mira"; }, 8000)) no("il tiro di " + g.nome + " non si può fare (" + vm(C).fs + ")");
    w.__PMpartita.tira();
    if (!await W.aspetta(function () { return vm(C).seq !== seq || vm(C).fase === "fine"; }, 30000)) no("il tiro di " + g.nome + " non finisce");
    return g.nome;
  }
  function riga(C) { return (vm(C).players || []).map(function (p) { return p.nome + " " + p.punti + "p/" + p.palline + "⚪" + (p.via ? " via" : ""); }).join(", "); }
  // l'avviso «Aspettiamo Giulia…» che si VEDE (la finestra chiusa resta nella pagina, trasparente)
  function avvisoHost(P) { var s = P.document.querySelector(".pm-sopra.su"); return !!s && /Aspettiamo/.test(s.textContent); }

  async function rientro(come) {
    var X = await pallaMatta(), C = X.C, P = X.P, idG = mioId("Giulia");
    await unTiro(C); await unTiro(C);   // un tiro a testa: punti e palline cambiano
    var prima = vm(C).players.map(function (p) { return p.id + ":" + p.punti + ":" + p.palline; }).join("|");
    var r0 = riga(C), visto = "";
    if (come === "ricarica5") { await W.dorme(5000); await W.ricarica("Giulia"); }
    else {
      W.spegni("Giulia");
      if (!await W.aspetta(function () { return avvisoHost(P); }, 40000)) no("spenta Giulia, Paky non legge «Aspettiamo» (" + T(P).slice(0, 80) + ")");
      visto = T(P).slice(0, 60);
      if (come === "ricarica25") { await W.dorme(2000); await W.ricarica("Giulia"); } else W.riaccendi("Giulia");
    }
    var G = W.finestra("Giulia");
    var ok = await W.aspetta(function () { G = W.finestra("Giulia"); return G && G.__PMpartita && G.document.querySelector(".pm-scena canvas") && !inSaletta(G) && !/Sto entrando|partita in corso/.test(W.testo(G)); }, 15000);
    if (!ok) no("Giulia non torna nella partita: «" + T(G).slice(0, 100) + "» · in saletta: " + inSaletta(G));
    if (!await W.aspetta(function () { return !avvisoHost(P); }, 4000)) no("a Paky resta «Aspettiamo…» («" + T(P).slice(0, 80) + "»)");
    var gg = giocG(C);
    if (gg.length !== 1 || gg[0].id !== mioId("Giulia")) no("Giulia è entrata due volte o con un altro posto: " + riga(C));
    if (mioId("Giulia") !== idG) no("Giulia ha un id nuovo (" + idG + " → " + mioId("Giulia") + ")");
    if (gg[0].via) no("Giulia è ancora «via» nella foto");
    var dopo = vm(C).players.map(function (p) { return p.id + ":" + p.punti + ":" + p.palline; }).join("|");
    if (dopo !== prima) no("punti o palline cambiati: prima " + r0 + " · dopo " + riga(C));
    var a = await unTiro(C), b = await unTiro(C);   // la partita va avanti: tirano tutti e due
    return (visto ? "Paky leggeva «" + visto + "»; " : "") + "Giulia torna al suo posto (" + r0 + "), l'avviso sparisce; poi tirano " + a + " e " + b + " (" + riga(C) + ")";
  }
  aggiungi("5ro1", { nome: "Palla Matta nella Sala: Giulia ricarica dopo 5 s → torna al suo posto", fai: function () { return rientro("ricarica5"); } });
  aggiungi("5ro2", { nome: "Palla Matta nella Sala: Giulia spenta 25 s («Aspettiamo»), poi ricarica → torna, l'avviso sparisce", fai: function () { return rientro("ricarica25"); } });
  aggiungi("5ro3", { nome: "Palla Matta nella Sala: Giulia spenta 25 s, poi riaccende → torna, l'avviso sparisce", fai: function () { return rientro("riaccendi"); } });

  // ---- 5ro4-5ro9: i giochi a due (e il Pendolo) nella Sala, Giulia spenta 25 s e poi ricarica a partita in corso ----
  var NOMI = { tris: "Tris", drop4: "Drop 4", navale: "Battaglia Navale", scopa: "Scopa", calciobiliardo: "Calcio Biliardo", pendolo: "Palla a Pendolo" };
  var PEZZI = { tris: ".tr-cella", drop4: ".d4-tav", navale: ".nav-board", scopa: ".sc-mensola, .sc-terra, .sc-mano-riga", calciobiliardo: ".cb-scena", pendolo: "canvas" };
  function avvDi(gid, v) {
    if (gid === "navale") return (v.ids || {}).avv || null;
    if (gid === "scopa") return v.avvId || v.idB || null;
    if (gid === "calciobiliardo") return ((v.players || [])[1] || {}).id || null;
    return v.avvId || (v.avv && v.avv.id) || null;
  }
  function inGioco(gid, v) {
    if (gid === "scopa") return v.t !== "lobby" && !!v.mano;
    if (gid === "navale") return v.fase === "piazza" || v.fase === "battaglia";
    return v.fase === "gioco";
  }
  // le righe del broker partite da quel telefono (BR.log tiene solo le ultime: si raccolgono ogni 50 ms)
  function raccogli(nome) {
    var R = { righe: new Set() };
    R.tm = setInterval(function () { W.BR.log.forEach(function (l) { if (l.indexOf(nome + " → ") === 0) R.righe.add(l); }); }, 50);
    R.stop = function () { clearInterval(R.tm); return Array.from(R.righe); };
    return R;
  }
  function aDue(gid) {
    return { nome: NOMI[gid] + " nella Sala: Giulia spenta 25 s, poi ricarica a partita in corso → torna nella partita, un posto solo", fai: async function () {
      var X = await A.salaConAmici(["Giulia"]), S = X.S, P = X.w.Paky;
      var C = await A.lanciaDallaSala("Paky", S, NOMI[gid]), idG = A.idInSala(S, "Giulia");
      if (gid === "pendolo") {
        if (!await W.aspetta(function () { return mioId("Giulia") && W.reteDi("Giulia"); }, 8000)) no("Giulia non entra nel Pendolo");
        await W.dorme(800);
      } else if (!await W.aspetta(function () { return avvDi(gid, vm(C)) === idG; }, 9000)) no("Giulia non diventa l'avversaria (" + avvDi(gid, vm(C)) + ")");
      if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 6000)) no("Paky non ha «Comincia»");
      if (gid === "pendolo") { if (!await W.aspetta(function () { return W.BR.log.some(function (l) { return l.indexOf("Paky → " + C + "/") === 0 && /"t":"via"/.test(l); }); }, 8000)) no("il Pendolo non comincia"); }
      else if (!await W.aspetta(function () { return inGioco(gid, vm(C)); }, 8000)) no("la partita non comincia");
      if (gid === "navale") W.reteDi("Giulia").invia({ t: "pronto", navi: [{ x: 0, y: 0, o: 1 }, { x: 0, y: 2, o: 1 }, { x: 0, y: 4, o: 1 }, { x: 0, y: 6, o: 1 }, { x: 0, y: 8, o: 1 }] });
      await W.dorme(1500);
      var prima = JSON.stringify(gid === "tris" || gid === "drop4" ? vm(C).board : null);
      W.spegni("Giulia"); await W.dorme(25000);
      var dopo25 = gid === "pendolo" ? "" : (vm(C).fase || vm(C).t) + " avv " + avvDi(gid, vm(C));
      var R = raccogli("Paky"), t0 = Date.now();
      await W.ricarica("Giulia");
      var G = W.finestra("Giulia");
      var ok = await W.aspetta(function () {
        G = W.finestra("Giulia"); var h = W.reteDi("Giulia");
        if (!h || mioId("Giulia") !== idG) return false;
        if (gid === "tris") return vm(C).avvId === idG && A.codiceSaletta(G) === C;   // (il Tris torna nella sua saletta con la partita a metà tenuta per lei)
        if (!G.document.querySelector(PEZZI[gid])) return false;
        if (gid === "pendolo") return true;
        return avvDi(gid, vm(C)) === idG && inGioco(gid, vm(C)) && !G.document.querySelector(".saletta-schermo");
      }, 15000);
      await W.dorme(1500);
      var righe = R.stop();
      if (!ok) no("Giulia ricaricata non torna nella partita: «" + T(G).slice(0, 100) + "» · in saletta: " + inSaletta(G) + " · dopo 25 s: " + dopo25);
      if ((W.reteDi("Giulia") || {}).codice !== C) no("Giulia non è collegata alla stanza del gioco («" + T(G).slice(0, 80) + "»)");
      var nota = "";
      if (gid === "tris") {
        if (!vm(C).sospesa) no("Tris: la partita a metà non è tenuta (sospesa) per Giulia");
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia|Riprendi/, ".sl-go"); }, 5000)) no("Tris: Paky non ha «Comincia» per riprendere");
        if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).avvId === idG; }, 6000)) no("Tris: la partita non riprende con Giulia");
        nota = " (Tris: saletta con la partita tenuta, poi si riprende)";
      }
      if ((gid === "tris" || gid === "drop4") && JSON.stringify(vm(C).board) !== prima) no("il tavolo è cambiato: " + prima + " → " + JSON.stringify(vm(C).board));
      if (gid === "calciobiliardo" && (vm(C).players || []).length !== 2) no("Calcio Biliardo: giocatori " + (vm(C).players || []).length);
      if (gid === "pendolo") {
        var gu = righe.filter(function (l) { return /"t":"guardi"/.test(l) && l.indexOf(idG) >= 0; });
        if (gu.length) no("Pendolo: Giulia rientrata guarda invece di giocare (" + gu[0].slice(0, 90) + ")");
        if (!righe.some(function (l) { return /"t":"via"/.test(l); })) no("Pendolo: a Giulia non è stata rimandata la partita");
        nota = " (Pendolo: riprende il suo personaggio dal Bot)";
      }
      return "dopo 25 s: " + (dopo25 || "-") + "; Giulia ricarica e torna nella partita in " + ((Date.now() - t0) / 1000).toFixed(1) + " s, stesso id" + nota;
    } };
  }
  ["tris", "drop4", "navale", "scopa", "calciobiliardo", "pendolo"].forEach(function (gid, k) { aggiungi("5ro" + (4 + k), aDue(gid)); });
})();
