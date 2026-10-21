// PROVE DEL PASSO 2, GRUPPO C (carte e feste): Black Jack, Poker, L'Asta, Sì... però, Scarabocchio, Gara di pesca.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/gruppo-c.js"); await COPIONE.prova(221)
//
// 221-226 (aggiornati da p2-z: la 1ª fine è quella del core, «↻ Rivincita»/«👍 Ci sto!»; ripiego: i tasti di sempre), uno per gioco. Sala con 3 telefoni (salaSempre; Sì... però con 4):
//   Paky apre il gioco dalla tessera ("Online con gli amici"), gli amici arrivano dal link della Sala.
//   Sui telefoni "gioca solo chi è scelto" è finto (w.__scelti): l'ultimo amico entra ma GUARDA (niente posto, niente
//   join ripetuti, vede la partita senza errori).
//   1ª partita fino alla fine: col contratto neutro la fine è quella di sempre (i tasti del gioco); misure a 360x640 e
//   412x915 (niente scorre, i tasti si vedono). Poi la "Nuova partita" di sempre → 2ª partita.
//   Nella 2ª partita i tasti di fine del core sono FINTI (w.__tfFinto, li disegna questo file): il gioco li deve mettere
//   al posto dei suoi; "FINTO ↻" (o.nuova) riporta tutti nella saletta (Black Jack: una serie nuova allo stesso tavolo).
//   In più: t.onRivincita c'è (funzione) sull'host; "🎮 Cambia gioco" si prova solo se c'è (arriva con p2-f).
// 223f: L'Asta nel formato Fantacalcio (stessa prova, fino al podio con "Salta ⏭").
// 227: le impostazioni di ognuno dei 6 giochi con il box fuori dalla pagina (Sala, online, sullo stesso telefono, torneo);
//   postiOnline c'è, riassunto (Poker, Asta) non vuoto.
// 228: percorso di prima: a fine partita l'host esce e chi è sulla classifica la tiene (Poker, Gara di pesca).
// Regole accorciate solo per la prova (w.__imp): Black Jack 1 mano, Scarabocchio 1 giro, Gara di pesca 12 secondi.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var GRUPPO = ["blackjack", "poker", "asta", "sipero", "scarabocchio", "garapesca"];

  // ---- la "spia" dei giochi del gruppo C (solo con apriTel(nome, { fintiC: true })) ----
  // w.__tfFinto = true: t.tastiFine disegna tasti finti; w.__scelti = ["Paky", …]: si siede solo chi è in lista;
  // w.__imp = { … }: regole cambiate per la prova (solo l'host le legge); w.__t = il tavolo del gioco
  if (!W.__prepGruppoC) {
    W.__prepGruppoC = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepGruppoC(w, nome, opz);
      if (!opz || !opz.fintiC) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && GRUPPO.indexOf(g.id) >= 0) spia(w, g); return reg.apply(this, arguments); };
      } });
    };
  }
  function spia(w, g) {
    var avvia = g.avvia;
    g.avvia = function (t) {
      w.__t = t;
      if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
      var tf = t.tastiFine, ps = t.puoSedersi;
      t.tastiFine = function (piede, o) {
        if (!w.__tfFinto) return tf ? tf.apply(this, arguments) : false;
        w.__tf = (w.__tf || []).concat([{ host: !!o.host, nuova: !!o.nuova, esci: !!o.esci }]);
        var box = w.document.createElement("div"); box.className = "tf-finto";
        if (o.host) { var b = w.document.createElement("button"); b.className = "btn btn-primario"; b.textContent = "FINTO ↻"; b.onclick = function () { (o.nuova || t.onRivincita)(); }; box.appendChild(b); }
        else { var c = w.document.createElement("button"); c.className = "btn btn-primario"; c.textContent = "FINTO 👍"; box.appendChild(c); }
        var e = w.document.createElement("button"); e.className = "btn btn-fantasma"; e.textContent = "FINTO 🏠"; e.onclick = function () { if (o.esci) o.esci(); }; box.appendChild(e);
        piede.appendChild(box);
        return true;
      };
      t.puoSedersi = function (id, nome) {
        if (!w.__scelti) return ps ? ps.apply(this, arguments) : true;
        return w.__scelti.indexOf(String(nome || "").trim()) >= 0;
      };
      return avvia.apply(this, arguments);
    };
  }

  // ---- aiuti ----
  var note = [];
  function nota(x) { note.push(x); }
  // controlla ogni 50 ms che nessun telefono mostri schermate d'errore
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Problema di collegamento|Collegamento perso|Ops|La stanza è chiusa|non risponde|è ferma|stanza è piena|tavolo è pieno/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 50);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  function tf(w) { return w.document.querySelector(".tf-finto"); }
  // conta i "join" che un telefono manda alla stanza del gioco (chi guarda non li deve ripetere)
  function contaJoin(nome) {
    var h = W.reteDi(nome), c = { n: 0 };
    if (!h) return c;
    var inv = h.invia;
    h.invia = function (m) { if (m && m.t === "join") c.n++; return inv.apply(this, arguments); };
    return c;
  }
  // la schermata di fine a 360x640 e 412x915: niente scorre e i tasti (i finti o quelli del gioco) si vedono tutti
  async function misuraFine(nome) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, esiti = [];
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata, .schermata *{ animation:none !important; transition:none !important; }"; d.head.appendChild(st); }
    var M = [[360, 640], [412, 915]];
    for (var k = 0; k < M.length; k++) {
      f.style.width = M[k][0] + "px"; f.style.height = M[k][1] + "px";
      void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(450);
      if (d.documentElement.scrollHeight > M[k][1] + 1) no(nome + " a " + M[k].join("x") + ": la fine scorre (" + d.documentElement.scrollHeight + " px)");
      var tasti = [].filter.call(d.querySelectorAll(".tf-finto button, .piede button, .bj-azioni button, .st-piede button"), function (b) { return b.offsetParent; });
      if (!tasti.length) no(nome + " a " + M[k].join("x") + ": alla fine non c'è nessun tasto");
      tasti.forEach(function (b) { var r = b.getBoundingClientRect(); if (r.bottom > M[k][1] + 1 || r.right > M[k][0] + 1) no(nome + " a " + M[k].join("x") + ": «" + b.textContent.trim() + "» esce dallo schermo"); });
      esiti.push(M[k].join("x"));
    }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return esiti;
  }
  // l'id di un telefono nella stanza ("host" per chi ospita)
  function idDi(nome, host) { return nome === host ? "host" : A.mioId(nome); }
  function nomeDiId(id, nomi, host) { for (var i = 0; i < nomi.length; i++) if (idDi(nomi[i], host) === id) return nomi[i]; return null; }

  // ---- i giochi: chi è seduto (dalla foto), le partite a copione, i tasti di fine di sempre ----
  var G = {
    blackjack: { nome: "Black Jack", imp: { mani: 1 },
      seduti: function (v) { return (v.giocatori || []).map(function (g) { return g.nome; }); },
      inGioco: function (v) { return ["punta", "assic", "gioca", "banco", "esito"].indexOf(v.fase) >= 0; },
      guarda: function (w) { return !!w.document.querySelector("[class*='bj-']") && !w.document.querySelector(".saletta-schermo"); },
      vecchiHost: /Gioca ancora/, vecchiOsp: /Mi alzo/, nuovaVecchia: /Gioca ancora/,
      dopoNuova: function (v) { return v.fase === "punta" && v.mano <= 1; },   // (serie nuova allo stesso tavolo, niente saletta)
      gioca: async function (C, umani) {
        var fatto = {}, fino = Date.now() + 90000;
        while (Date.now() < fino && vm(C).fase !== "fine") {
          var v = vm(C), P = W.finestra("Paky"), k = v.mano + "|" + v.fase + "|" + v.turno;
          var seat = function (n) { return (v.giocatori || []).findIndex(function (g) { return g.nome === n; }); };
          if (v.fase === "punta") {
            umani.forEach(function (n) { if (n === "Paky") return; var g = v.giocatori[seat(n)]; if (g && !g.puntata && !fatto[k + n]) { W.reteDi(n).invia({ t: "mossa", kind: "punta", val: 10 }); fatto[k + n] = 1; } });
            if (v.giocatori[0] && !v.giocatori[0].puntata) W.clicca(P, /^Punta /);
          } else if (v.fase === "assic") {
            umani.forEach(function (n) { if (n !== "Paky" && !fatto[k + n]) { W.reteDi(n).invia({ t: "mossa", kind: "assic", si: false }); fatto[k + n] = 1; } });
            W.clicca(P, /^No$/);
          } else if (v.fase === "gioca") {
            if (v.turno === 0) W.clicca(P, /^Stai$/);
            else umani.forEach(function (n) { var g = v.giocatori[v.turno]; if (n !== "Paky" && seat(n) === v.turno && !fatto[k + n + g.attiva]) { W.reteDi(n).invia({ t: "mossa", kind: "azione", mossa: "stai" }); fatto[k + n + g.attiva] = 1; } });
          } else if (v.fase === "esito") W.clicca(P, /Classifica ▶|Basta così/);
          await W.dorme(300);
        }
        if (vm(C).fase !== "fine") no("il Black Jack non arriva alla classifica (fase " + vm(C).fase + ")");
      } },
    poker: { nome: "Poker", profilo: { fiches: { blackjack: 2000 } },
      seduti: function (v) { return (v.players || []).filter(function (p) { return !p.bot; }).map(function (p) { return p.nome; }); },
      inGioco: function (v) { return v.fase === "gioco"; },
      guarda: function (w) { return /Guardi la partita/.test(W.testo(w)); },
      vecchiHost: /Nuova partita \(stessi amici\)/, vecchiOsp: /Esci/, nuovaVecchia: /Nuova partita \(stessi amici\)/,
      dopoNuova: function (v) { return v.fase === "lobby"; },
      gioca: async function (C, umani) {
        // una mano: gli amici lasciano, Paky passa o chiama; poi Paky chiude il tavolo (🏁) e c'è la classifica
        var fino = Date.now() + 60000, n0 = null;
        while (Date.now() < fino) {
          var v = vm(C), P = W.finestra("Paky");
          if (v.fase !== "gioco") { await W.dorme(200); continue; }
          if (n0 == null && v.n) n0 = v.n;
          if (v.stato === "finemano" || (n0 != null && v.n > n0)) break;
          if (v.turno === "host") { var b = P.document.querySelector(".pk-btn.passa"); if (b) b.click(); }
          else umani.forEach(function (n) { if (n !== "Paky" && A.mioId(n) === v.turno) W.reteDi(n).invia({ t: "azione", tipo: "lascia", tot: 0, n: v.n, st: v.stato, dc: v.daChiamare }); });
          await W.dorme(400);
        }
        var bF = W.finestra("Paky").document.querySelector("[aria-label='Fine partita']");
        if (!bF) no("Paky non ha 🏁 per chiudere il tavolo");
        bF.click();
        if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("toccato 🏁 non c'è la classifica del Poker");
      } },
    asta: { nome: "L'Asta",
      seduti: function (v) { return (v.giocatori || []).map(function (g) { return g.nome; }); },
      inGioco: function (v) { return v.fase && v.fase !== "lobby" && v.fase !== "fine"; },
      guarda: function (w) { return !w.document.querySelector(".saletta-schermo") && /Stai guardando la partita|ROUND 1/i.test(W.testo(w)); },
      vecchiHost: /Nuova partita \(cambia argomento\)/, vecchiOsp: /In attesa dell'host/, nuovaVecchia: /Nuova partita \(cambia argomento\)/,
      dopoNuova: function (v) { return v.fase === "lobby"; },
      gioca: async function (C, umani) {
        // il pilota automatico (come lo scenario 2): chi sceglie prende la prima carta, tutti passano; poi il voto
        var fino = Date.now() + 200000, P = W.finestra("Paky");
        while (Date.now() < fino && vm(C).fase !== "voto" && vm(C).fase !== "fine") {
          var v = vm(C);
          umani.forEach(function (n) {
            if (n === "Paky") return;
            var h = W.reteDi(n), id = A.mioId(n); if (!h) return;
            if (v.fase === "scelta" && v.sceglieId === id) h.invia({ t: "scegli", idx: 0 });
            if (v.fase === "asta") h.invia({ t: "passa" });
          });
          if (v.fase === "scelta" && v.sceglieId === "host") { var carta = P.document.querySelector(".as-carta:not([disabled])"); if (carta) carta.click(); }
          if (v.fase === "asta") W.clicca(P, /^\s*Passo\s*$/);
          W.clicca(P, /Vedi le carte|Avanti|Si vota/);
          await W.dorme(500);
        }
        if (vm(C).fase !== "voto") no("l'Asta non arriva al voto (fase " + vm(C).fase + ")");
        umani.forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "voto", voti: {}, s: vm(C).sessione }); });
        if (!await W.aspetta(function () { return vm(C).fase === "fine" || W.clicca(P, /Chiudi il voto/); }, 8000)) no("il voto dell'Asta non si chiude");
        if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("dopo il voto non c'è la classifica dell'Asta");
      } },
    astaFanta: { nome: "L'Asta", imp: { formato: "fanta" },
      seduti: function (v) { return (v.giocatori || []).map(function (g) { return g.nome; }); },
      inGioco: function (v) { return v.fase === "asta" || v.fase === "esito"; },
      guarda: function (w) { return !w.document.querySelector(".saletta-schermo") && !!w.document.querySelector(".st-stadio"); },
      vecchiHost: /🔄 Nuova partita/, vecchiOsp: /In attesa dell'host|Esci/, nuovaVecchia: /🔄 Nuova partita/,
      dopoNuova: function (v) { return v.fase === "lobby"; },
      gioca: async function (C, umani) {
        // il primo che può lo prende a 1, l'altro passa; alla fine "Salta ⏭" fino al podio
        var fino = Date.now() + 120000, P = W.finestra("Paky"), osp = umani.filter(function (n) { return n !== "Paky"; })[0], fatto = {};
        while (Date.now() < fino && vm(C).fase !== "fine") {
          var v = vm(C), a = v.asta;
          if (v.fase === "asta" && a) {
            var k = a.nCarta + "|" + a.leaderId;
            if (!a.leaderId && !W.clicca(P, /Lo prendo a/) && !fatto[k]) { fatto[k] = 1; W.reteDi(osp).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta }); }
            else if (a.leaderId === "host" && !fatto[k]) { fatto[k] = 1; W.reteDi(osp).invia({ t: "passa", n: a.nCarta }); }
            else if (a.leaderId && a.leaderId !== "host") W.clicca(P, /^Passo$/);
          }
          await W.dorme(300);
        }
        if (vm(C).fase !== "fine") no("il Fantacalcio non arriva alla classifica (fase " + vm(C).fase + ")");
        await W.dorme(600);
        umani.forEach(function (n) { W.clicca(W.finestra(n), /Salta/); });
        await W.dorme(500); umani.forEach(function (n) { W.clicca(W.finestra(n), /Salta/); });   // (il secondo «Salta»: dalla ⚽ giornata al podio)
      } },
    sipero: { nome: "Sì... però", quattro: true,
      seduti: function (v) { return (v.giocatori || []).map(function (g) { return g.nome; }); },
      inGioco: function (v) { return v.fase && v.fase !== "lobby" && v.fase !== "fine"; },
      guarda: function (w) { return /tu guardi|Intanto guardi|Stai guardando/.test(W.testo(w)); },
      vecchiHost: /Nuova partita \(stessi amici\)/, vecchiOsp: /Esci/, nuovaVecchia: /Nuova partita \(stessi amici\)/,
      dopoNuova: function (v) { return v.fase === "lobby"; },
      gioca: async function (C, umani) {
        // coi tocchi veri su ogni telefono: chi tocca gioca le prime carte, poi arringa, verdetto, prossimo round
        var fino = Date.now() + 150000;
        while (Date.now() < fino && vm(C).fase !== "fine") {
          var v = vm(C);
          umani.forEach(function (n) {
            var w = W.finestra(n), d = w.document;
            if (v.fase === "gioco" && v.step) {
              var bOk = [].find.call(d.querySelectorAll("button"), function (b) { return /^Gioca ▶/.test(b.textContent); });
              if (bOk && bOk.disabled) { var cc = d.querySelectorAll(".sp-carta[role=button]"); for (var i = 0; i < v.step.n && i < cc.length; i++) if (!cc[i].classList.contains("su")) cc[i].click(); }
              if (bOk && !bOk.disabled) bOk.click();
            } else if (v.fase === "arringa") W.clicca(w, /Tocca alla|Al verdetto/);
            else if (v.fase === "giudizio") { var b = d.querySelector(".sp-vota:not([disabled])"); if (b) b.click(); }
            else if (v.fase === "esito" && n === "Paky") W.clicca(w, /Prossimo round|Classifica finale/);
          });
          await W.dorme(400);
        }
        if (vm(C).fase !== "fine") no("Sì... però non arriva alla classifica (fase " + vm(C).fase + ", round " + vm(C).round + ")");
      } },
    scarabocchio: { nome: "Scarabocchio", imp: { giri: 1 },
      seduti: function (v) { return (v.players || []).filter(function (p) { return !p.via; }).map(function (p) { return p.nome; }); },
      inGioco: function (v) { return ["scelta", "disegno", "punti"].indexOf(v.fase) >= 0; },
      guarda: function (w) { return !!w.document.querySelector(".sb-chat") && !w.document.querySelector(".saletta-schermo"); },
      vecchiHost: /Nuova partita \(stessi amici\)/, vecchiOsp: /Esci/, nuovaVecchia: /Nuova partita \(stessi amici\)/,
      dopoNuova: function (v) { return v.fase === "lobby"; },
      gioca: async function (C, umani) {
        // chi disegna sceglie la prima parola; gli altri la scrivono (l'host nella sua chat, gli amici col messaggio)
        var fino = Date.now() + 150000, parola = {}, detto = {};
        while (Date.now() < fino && vm(C).fase !== "fine") {
          var v = vm(C), chi = nomeDiId(v.disegnatore, umani, "Paky");
          if (v.fase === "scelta" && chi) { var b = W.finestra(chi).document.querySelector(".sb-scelte button"); if (b && !parola[v.turno]) { parola[v.turno] = b.textContent; b.click(); } }
          if (v.fase === "disegno" && parola[v.turno]) umani.forEach(function (n) {
            if (n === chi || detto[v.turno + n]) return;
            detto[v.turno + n] = 1;
            if (n === "Paky") { var w = W.finestra(n), inp = w.document.querySelector(".sb-inp"), f = w.document.querySelector(".sb-scrivi"); if (inp && f) { inp.value = parola[v.turno]; f.dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true })); } }
            else W.reteDi(n).invia({ t: "prova", x: parola[v.turno] });
          });
          await W.dorme(300);
        }
        if (vm(C).fase !== "fine") no("lo Scarabocchio non arriva alla classifica (fase " + vm(C).fase + ")");
      } },
    garapesca: { nome: "Gara di pesca", imp: { durata: 12 },
      seduti: function (v) { return (v.players || []).map(function (p) { return p.nome; }); },
      inGioco: function (v) { return v.fase === "gioco"; },
      guarda: function (w) { return !w.document.querySelector(".saletta-schermo") && !/Ops/.test(W.testo(w)); },
      vecchiHost: /Nuova gara/, vecchiOsp: /Esci/, nuovaVecchia: /Nuova gara/,
      dopoNuova: function (v) { return v.fase === "lobby"; },
      gioca: async function (C) {
        if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 30000)) no("la Gara di pesca non finisce (fase " + vm(C).fase + ")");
      } }
  };

  // ---- uno scenario: Sala, chi guarda, due partite intere (fine di sempre, poi fine coi tasti finti) ----
  async function partitaDallaSala(gid) {
    note = [];
    var g = G[gid], nomi = g.quattro ? ["Paky", "Giulia", "Luca", "Marco"] : ["Paky", "Giulia", "Luca"];
    var guarda = nomi[nomi.length - 1], umani = nomi.slice(0, -1), ospiti = nomi.slice(1);
    var opz = function (x) { return Object.assign({ x: x, salaSempre: true, fintiC: true }, g.profilo ? { profilo: g.profilo } : {}); };
    var P = await W.apriTel("Paky", opz(0));
    P.__scelti = umani.slice(); if (g.imp) P.__imp = g.imp;
    var r = await A.salaDaGioco("Paky", g.nome), S = r.S, C = r.C;
    for (var i = 0; i < ospiti.length; i++) {
      var o = Object.assign(opz(185 * (i + 1)), { hash: "sala=" + S });
      var w = await W.apriTel(ospiti[i], o); w.__scelti = umani.slice();
      if (ospiti[i] !== guarda) { var n = ospiti[i]; if (!await W.aspetta(function () { return A.dentro(W.finestra(n)) && g.seduti(vm(C)).indexOf(n) >= 0; }, 8000)) no(n + " non si siede (" + g.seduti(vm(C)).join(", ") + ")"); }
    }
    await W.dorme(1500);
    if (g.seduti(vm(C)).indexOf(guarda) >= 0) no(guarda + " non è tra chi gioca ma ha preso un posto");
    if (!W.finestra(guarda).document.querySelector(".saletta-schermo")) no(guarda + " non è nella saletta («" + T(W.finestra(guarda)).slice(0, 60) + "»)");
    if (typeof P.__t.onRivincita !== "function") no("t.onRivincita dell'host non c'è");
    var sent = sentinella(nomi), joinG = contaJoin(guarda);
    // 1ª partita: dopo p2-f nella Sala la fine è quella del core («↻ Rivincita» / «👍 Ci sto!»); i tasti di sempre solo come ripiego
    var core1 = function (w) { var b = w.document.querySelector(".fine-tasti"); return !!b && /Rivincita|Ci sto/.test(b.textContent); };
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return g.inGioco(vm(C)) || vm(C).fase === "fine"; }, 8000)) no("la partita non comincia (fase " + vm(C).fase + ")");
    if (!await W.aspetta(function () { return g.guarda(W.finestra(guarda)); }, 6000)) no(guarda + " non vede la partita («" + T(W.finestra(guarda)).slice(0, 80) + "»)");
    await g.gioca(C, umani);
    await W.dorme(2500);   // (la Gara di pesca mostra ancora un attimo il lago)
    if (!await W.aspetta(function () { return core1(P) || g.vecchiHost.test(W.testo(P)); }, 6000)) no("alla fine Paky non ha i tasti di fine (" + T(P).slice(-80) + ")");
    var conCore = core1(P);
    for (var k = 1; k < umani.length; k++) { var wk = W.finestra(umani[k]); if (!await W.aspetta(function () { return conCore ? core1(wk) : g.vecchiOsp.test(W.testo(wk)); }, 6000)) no("alla fine " + umani[k] + " non ha i tasti di fine (" + T(wk).slice(-80) + ")"); }
    // (qui chi guarda è finto, w.__scelti: il core non lo sa e gli dà «Ci sto». Chi guarda davvero, scelto in «Chi gioca?», no: 211, 212, 215)
    nota("1ª partita fino alla fine coi tasti " + (conCore ? "del core" : "di sempre"));
    var mis = await misuraFine("Paky"); await misuraFine(umani[1]);
    nota("fine a " + mis.join(" e ") + " senza scorrere");
    if (joinG.n > 1) no(guarda + " (che guarda) ha mandato " + joinG.n + " «join» durante la partita");
    // la Rivincita del core (col 3-2-1 quando ci sono tutti) o la Nuova partita di sempre
    if (conCore) { for (var q = 1; q < umani.length; q++) W.clicca(W.finestra(umani[q]), /Ci sto/); if (!W.clicca(P, /Rivincita/, ".fine-tasti button")) no("Paky non trova «↻ Rivincita»"); }
    else if (!W.clicca(P, g.nuovaVecchia)) no("Paky non trova la Nuova partita di sempre");
    if (!await W.aspetta(function () { return g.dopoNuova(vm(C)) || g.inGioco(vm(C)); }, 12000)) no("dopo la Rivincita non si riparte (fase " + vm(C).fase + ")");
    // 2ª partita: i tasti di fine del core (finti)
    nomi.forEach(function (n) { W.finestra(n).__tfFinto = true; });
    if (vm(C).fase === "lobby") {
      if (!await W.aspetta(function () { return umani.every(function (n) { return n === "Paky" || A.dentro(W.finestra(n)); }); }, 6000)) no("gli amici non tornano nella saletta");
      W.clicca(P, /Comincia/);
    }
    if (!await W.aspetta(function () { return g.inGioco(vm(C)); }, 8000)) no("la 2ª partita non comincia (fase " + vm(C).fase + ")");
    await g.gioca(C, umani);
    await W.dorme(2500);
    if (!await W.aspetta(function () { return tf(P) && /FINTO ↻/.test(tf(P).textContent); }, 6000)) no("alla fine Paky non ha i tasti del core (" + T(P).slice(-80) + ")");
    if (g.vecchiHost.test(W.testo(P))) no("coi tasti del core Paky vede ancora quelli del gioco");
    for (var j = 1; j < umani.length; j++) {
      var wj = W.finestra(umani[j]);
      if (!tf(wj) || !/FINTO 👍/.test(tf(wj).textContent)) no(umani[j] + " non ha i tasti del core per chi entra (" + T(wj).slice(-80) + ")");
      if (wj.__tf.some(function (x) { return x.host; })) no(umani[j] + " ha chiesto i tasti da host");
    }
    var tfP = P.__tf[P.__tf.length - 1]; if (!tfP.host || !tfP.esci) no("Paky ha chiesto i tasti del core senza host o senza uscita (" + JSON.stringify(tfP) + ")");
    await misuraFine("Paky");
    nota("2ª partita: tasti del core al posto di quelli del gioco (host " + (tfP.nuova ? "con" : "senza") + " «nuova»)");
    // ↻ (la Rivincita del core) → si riparte con gli stessi amici
    tf(P).querySelector("button").click();
    if (!await W.aspetta(function () { return g.dopoNuova(vm(C)) || g.inGioco(vm(C)); }, 12000)) no("toccato «↻» non si riparte (fase " + vm(C).fase + ")");
    if (vm(C).fase === "lobby" && !await W.aspetta(function () { return umani.every(function (n) { return g.seduti(vm(C)).indexOf(n) >= 0; }) && g.seduti(vm(C)).indexOf(guarda) < 0; }, 6000)) no("dopo «↻» nella saletta non ci sono gli stessi (" + g.seduti(vm(C)).join(", ") + ")");
    nota("«↻» riparte con " + g.seduti(vm(C)).join(", ") + " (" + guarda + " guarda)");
    // 🎮 Cambia gioco: c'è solo quando è unito p2-f (qui i tasti sono finti)
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    nota("«Cambia gioco» si prova con p2-f (201f…)");
    return note.join(" · ");
  }

  COPIONE.aggiungi(221, { nome: "Black Jack dalla Sala: chi guarda, fine della serie, serie nuova", fai: function () { return partitaDallaSala("blackjack"); } });
  COPIONE.aggiungi(222, { nome: "Poker dalla Sala: chi guarda, classifica, di nuovo in saletta", fai: function () { return partitaDallaSala("poker"); } });
  COPIONE.aggiungi(223, { nome: "L'Asta coi temi dalla Sala: chi guarda, voto e classifica, di nuovo in saletta", fai: function () { return partitaDallaSala("asta"); } });
  COPIONE.aggiungi("223f", { nome: "L'Asta Fantacalcio dalla Sala: chi guarda, podio, di nuovo in saletta", fai: function () { return partitaDallaSala("astaFanta"); } });
  COPIONE.aggiungi(224, { nome: "Sì... però dalla Sala (in 4): chi guarda, classifica, di nuovo in saletta", fai: function () { return partitaDallaSala("sipero"); } });
  COPIONE.aggiungi(225, { nome: "Scarabocchio dalla Sala: chi guarda, classifica, di nuovo in saletta", fai: function () { return partitaDallaSala("scarabocchio"); } });
  COPIONE.aggiungi(226, { nome: "Gara di pesca dalla Sala: chi guarda, classifica, di nuovo in saletta", fai: function () { return partitaDallaSala("garapesca"); } });

  // 228. Percorso di prima (senza Sala): a fine partita l'host esce e chi è sulla classifica la tiene (Poker e Gara di pesca;
  //      prima compariva una schermata d'errore che copriva la classifica)
  COPIONE.aggiungi(228, { nome: "Fine partita: l'host esce, la classifica resta a chi è entrato (Poker, Gara di pesca)", fai: async function () {
    var esiti = [], prove = [["poker", "Poker", /Classifica del tavolo/], ["garapesca", "Gara di pesca", /Classifica della gara/]];
    for (var i = 0; i < prove.length; i++) {
      A.pulisci();
      var gid = prove[i][0], g = G[gid], prof = { fiches: { blackjack: 2000 } };
      var P = await W.apriTel("Paky", { x: 0, fintiC: true, profilo: prof }); if (g.imp) P.__imp = g.imp;
      var C = await W.apriStanza(P, prove[i][1]);
      var Gw = await W.apriTel("Giulia", { hash: "gioco=" + gid + "&stanza=" + C, x: 185, profilo: prof });
      if (!await W.aspetta(function () { return A.dentro(Gw) && g.seduti(vm(C)).indexOf("Giulia") >= 0; }, 8000)) no(gid + ": Giulia non entra");
      W.clicca(P, /Comincia/);
      await g.gioca(C, ["Paky", "Giulia"]);
      if (!await W.aspetta(function () { return prove[i][2].test(W.testo(Gw)); }, 6000)) no(gid + ": Giulia non vede la classifica");
      W.clicca(P, /Esci/);
      await W.dorme(2500);
      if (!prove[i][2].test(W.testo(Gw))) no(gid + ": uscito l'host, Giulia non vede più la classifica («" + T(Gw).slice(0, 80) + "»)");
      if (/Ops|è stat[ao] chius[ao] dall'host\.$/.test(W.testo(Gw).trim())) no(gid + ": a Giulia compare l'errore");
      esiti.push(gid + " ok (" + (T(Gw).match(/🚪[^.]*\.?/) || ["classifica intatta"])[0] + ")");
    }
    return esiti.join(" · ");
  } });

  // 227. Le impostazioni dei 6 giochi con il box fuori dalla pagina (come le prepara la Sala): niente errori, le scelte ci sono
  COPIONE.aggiungi(227, { nome: "Impostazioni del gruppo C col box fuori dalla pagina", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, fintiC: true, profilo: { fiches: { blackjack: 2000 } } });
    var presi = {}, reg = P.SG.registra;
    // (i giochi sono già registrati: si ricaricano i loro file in questa finestra per avere gli oggetti)
    P.SG.registra = function (g) { presi[g.id] = g; };
    for (var i = 0; i < GRUPPO.length; i++) { var src = await (await fetch("/js/games/" + GRUPPO[i] + ".js?" + Date.now())).text(); P.eval(src); }
    P.SG.registra = reg;
    var aiuti = [{ sala: true, modo: "online" }, { modo: "online" }, { modo: "locale" }, { torneo: true }], esiti = [];
    GRUPPO.forEach(function (id) {
      var g = presi[id]; if (!g) no("non trovo " + id);
      if (!g.postiOnline) no(id + " non dice postiOnline");
      aiuti.forEach(function (a) {
        var box = P.document.createElement("div"), imp = {};
        try { g.impostazioni(box, imp, Object.assign({ el: elDi(P), giocatori: ["Paky", "Giulia"] }, a)); }
        catch (e) { no(id + " (" + JSON.stringify(a) + "): " + e.message); }
        if (!box.children.length && id !== "poker") no(id + " (" + JSON.stringify(a) + "): il box è vuoto");
        if (g.riassunto) { var rs = g.riassunto(imp); if (typeof rs !== "string" || !rs) no(id + ": riassunto vuoto"); }
      });
      esiti.push(id + " " + g.postiOnline + (g.riassunto ? " («" + g.riassunto({}) + "»)" : ""));
    });
    return "impostazioni fuori pagina senza errori; posti: " + esiti.join(", ");
  } });
  // una funzione el come quella dell'app (per fare i pezzi delle impostazioni)
  function elDi(w) {
    var d = w.document;
    return function el(tag, attrs, figli) {
      var n = d.createElement(tag);
      if (attrs) Object.keys(attrs).forEach(function (k) {
        var v = attrs[k]; if (v == null) return;
        if (k === "text") n.textContent = v; else if (k === "html") n.innerHTML = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v);
      });
      [].concat(figli || []).forEach(function (f) { if (f == null) return; n.appendChild(typeof f === "string" ? d.createTextNode(f) : f); });
      return n;
    };
  }
})();
