// PROVE DEL PASSO 6, GRUPPO 2 (posti contati e tempo reale, chi guarda): Scalinata, Palla Matta, Ruota, Scopa 2 vs 2,
// Palla a Pendolo, Horto Muso.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo6/g2.js"); await COPIONE.prova(670)      (oppure await COPIONE.gruppo6g2(): 670-675 in fila)
// 670 Scalinata · 671 Palla Matta · 672 Ruota · 673 Scopa 2 vs 2 · 674 Pendolo · 675 Horto.
// Ogni scenario (percorso di prima, stanza di un gioco solo): Paky apre, Giulia entra e si comincia; Bea apre il link con
// guarda=1. Bea: niente nome da scrivere, una sola targhetta "👀 Guardi", vede la partita (la vista di chi guarda del gioco),
// mai "Tocca a te" né "(tu)", nessun "🏠 Esci" del gioco e nessuna fila di faccine del gioco (le ha nella targhetta: il suo 😂
// parte); a 360x640 e 412x915 la pagina non scorre e la targhetta non copre il tavolo. Si gioca fino alla fine: Bea vede come
// è finita. Dal telefono di Bea passano SOLO "__guardo" e "__faccina". Alla "Nuova partita" dell'host Bea è nella saletta
// (entra anche lei, senza targhetta; in Horto la «Nuova partita» è la corsa dopo, subito: Bea la guarda ancora). Nessun
// errore sui telefoni. Le righe di Bea si raccolgono ogni 50 ms (BR.log tiene solo le ultime righe).
// Regole corte per fare presto (solo l'host le legge, w.__imp): Ruota una manche senza round speciali, Scopa 2 vs 2 una mano.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, dentro = A.dentro;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  var GRUPPO = ["scalinata", "pallamatta", "ruota", "scopa2v2", "pendolo", "horto"];
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- la spia (solo con apriTel(nome, { spiaG2: true })): w.__imp = regole per la prova (solo l'host), w.__cbH[gid] =
  //      la stanza dell'host (per mandare le sue mosse senza toccare lo schermo) ----
  if (!W.__prepG2p6) {
    W.__prepG2p6 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG2p6(w, nome, opz);
      if (!opz || !opz.spiaG2) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GRUPPO.indexOf(g.id) >= 0 && !g.__spiaG2) {
            g.__spiaG2 = true; var av = g.avvia;
            g.avvia = function (t) {
              if (w.__imp && t.impostazioni && !t.linkParams.stanza) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              w.__t = t;
              if (!w.__cbH) {
                w.__cbH = {};
                var osp = w.SGNet.ospita;
                w.SGNet.ospita = function (gid, cb) { w.__cbH[gid] = cb; return osp.apply(this, arguments); };
              }
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- aiuti ----
  function visibile(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.ownerDocument.defaultView.getComputedStyle(e).visibility !== "hidden"; }
  function logDa(nome, C) { return W.BR.log.filter(function (l) { return l.indexOf(nome + " → " + C + "/") === 0; }); }
  // i tipi dei messaggi partiti da quel telefono verso la stanza ("__guardo", "__faccina"…)
  // (BR.log tiene solo le ultime 300-400 righe: con le corse se ne perdono. Il raccoglitore le legge ogni 50 ms e le tiene tutte)
  function raccogli(nome) {
    var R = { visti: new Set(), tm: null };
    R.tm = setInterval(function () { W.BR.log.forEach(function (l) { if (l.indexOf(nome + " → ") === 0) R.visti.add(l); }); }, 50);
    R.stop = function () { clearInterval(R.tm); W.BR.log.forEach(function (l) { if (l.indexOf(nome + " → ") === 0) R.visti.add(l); }); return R; };
    return R;
  }
  function tipiDa(R, nome, C) {
    var k = {};
    Array.from(R.visti).filter(function (l) { return l.indexOf(nome + " → " + C + "/") === 0; }).forEach(function (l) { var m = l.match(/"t":"([^"]+)"/); var t = m ? m[1] : "(senza t)"; k[t] = (k[t] || 0) + 1; });
    return k;
  }
  // i "🏠 Esci" (o "Esci") del gioco che si vedono (quelli della targhetta del core e delle finestre di conferma no)
  function esciDelGioco(w) {
    return [].filter.call(w.document.querySelectorAll("button"), function (b) { return /Esci/.test(b.textContent) && !b.closest(".sg-guardo") && !b.closest(".sl-velo, .conferma-velo") && visibile(b); }).map(function (b) { return b.textContent; });
  }
  // le faccine del gioco (fuori dalla fila della targhetta)
  function filaDelGioco(w) { return [].filter.call(w.document.querySelectorAll(".sl-fa"), function (b) { return !b.closest(".sg-guardo-fila") && visibile(b); }).length; }
  // la sentinella di chi guarda: mai "Tocca a te", mai "(tu)", mai un "🏠 Esci" del gioco, una targhetta sola (mentre c'è la partita)
  function sentinella(nome) {
    var visti = [];
    var tm = setInterval(function () {
      var w = W.finestra(nome); if (!w || !w.document || !w.document.body) return;
      var tx = W.testo(w), segna = function (x) { if (visti.indexOf(x) < 0) visti.push(x); };
      if (/Tocca a te/.test(tx)) segna("«Tocca a te»");
      if (/\(tu\)/.test(tx)) segna("«(tu)»");
      if (w.document.querySelectorAll(".sg-guardo").length > 1) segna("due targhette");
      if (w.document.querySelector(".sg-guardo")) { var e = esciDelGioco(w); if (e.length) segna("«" + e[0] + "» del gioco"); }
      var m = tx.match(/Problema di collegamento|Collegamento perso|Ops|La stanza è chiusa|Il tuo nome|Come ti chiami/); if (m) segna("«" + m[0] + "»");
    }, 150);
    return { stop: function () { clearInterval(tm); return visti; } };
  }
  // a misura: la pagina non scorre, la targhetta c'è (alta al massimo 44 px) e non copre quello che conta (sel). "" = bene
  async function misura(w, nome, larg, alt, sel) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(650);
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre in giù (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato";
    var g = d.querySelector(".sg-guardo"); if (!g) return "non c'è la targhetta";
    var rg = g.getBoundingClientRect();
    if (rg.height > 44.5 || rg.bottom > alt + 1) return "la targhetta non sta nello schermo";
    var cose = sel ? [].filter.call(d.querySelectorAll(sel), visibile) : [];
    for (var i = 0; i < cose.length; i++) {
      var r = cose[i].getBoundingClientRect();
      if (r.bottom > rg.top + 1 && r.top < rg.bottom - 1 && r.left < rg.right - 1 && rg.left < r.right - 1) return "la targhetta copre «" + (cose[i].textContent || cose[i].className).replace(/\s+/g, " ").slice(0, 30) + "»";
    }
    return "";
  }
  async function misure(w, nome, sel) {
    var M = [[360, 640], [412, 915]];
    for (var k = 0; k < M.length; k++) { var e = await misura(w, nome, M[k][0], M[k][1], sel); if (e) no(nome + " a " + M[k].join("x") + ": " + e); }
    return "360x640 e 412x915";
  }
  function rimetti(w, nome) { var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); }
  // il 😂 della targhetta: la fila si apre, il tocco parte (sul broker c'è un "__faccina" di Bea)
  async function faccinaDi(w, nome, C) {
    var chip = w.document.querySelector(".sg-guardo"); if (!chip) no(nome + " non ha la targhetta");
    var n0 = logDa(nome, C).filter(function (l) { return l.indexOf('"__faccina"') >= 0; }).length;
    chip.querySelector(".sg-guardo-fa").click();
    var b = await W.aspetta(function () { return w.document.querySelector(".sg-guardo-fila .sl-fa"); }, 2000);
    if (!b) no("il 😂 della targhetta non apre la fila delle faccine");
    b.click();
    if (!await W.aspetta(function () { return logDa(nome, C).filter(function (l) { return l.indexOf('"__faccina"') >= 0; }).length > n0; }, 2500)) no("la faccina di " + nome + " non parte");
    chip.querySelector(".sg-guardo-fa").click();
  }
  // percorso di prima: l'host apre la stanza, gli amici entrano dal link
  async function stanza(nomeTessera, gid, imp, amici) {
    var P = await W.apriTel("Paky", { x: 0, spiaG2: true, prima: function (w) { w.__imp = imp || null; } });
    var C = await W.apriStanza(P, nomeTessera);
    var G = {};
    for (var i = 0; i < amici.length; i++) G[amici[i]] = await W.apriTel(amici[i], { hash: "gioco=" + gid + "&stanza=" + C, x: 185 * (i + 1), spiaG2: true });
    if (!await W.aspetta(function () { return A.contaDentro(vm(C)) === amici.length + 1 || (amici.every(function (n) { return dentro(G[n]); })); }, 10000)) no("nella saletta non sono entrati tutti");
    await W.dorme(400);
    return { P: P, C: C, G: G };
  }
  function comincia(P) { return W.aspetta(function () { return W.clicca(P, /Comincia la corsa|^\s*(▶\s*)?Comincia/); }, 6000); }
  async function apriGuarda(gid, C) {
    var B = await W.apriTel("Bea", { hash: "gioco=" + gid + "&stanza=" + C + "&guarda=1", x: 370 });
    if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo"); }, 8000)) no("Bea non ha la targhetta «👀 Guardi» («" + T(B).slice(0, 80) + "»)");
    return B;
  }
  // la parte comune: Bea guarda, poi a fine partita la Nuova partita la porta in saletta
  // o = { gid, C, P, B, sent, vista(): true se Bea vede la partita, sel: cosa la targhetta non deve coprire, fine(B): true se Bea
  //       vede la fine, finoAllaFine(): async, reNuova: il tasto dell'host }
  async function guardaFinoAllaFine(o) {
    var B = o.B, C = o.C, nota = [];
    if (!await W.aspetta(function () { return o.vista(B); }, 10000)) no("Bea non vede la partita («" + T(B).slice(0, 100) + "»)");
    if (B.document.querySelectorAll(".sg-guardo").length !== 1) no("Bea ha " + B.document.querySelectorAll(".sg-guardo").length + " targhette");
    if (filaDelGioco(B)) no("Bea ha anche la fila delle faccine del gioco (c'è già quella della targhetta)");
    nota.push("vede la partita, misure ok a " + await misure(B, "Bea", o.sel));
    if (o.foto || W.__fotoG2) await (o.foto || W.__fotoG2)(B);   // (per le foto a mano: W.__fotoG2 = async function (B) { … })
    rimetti(B, "Bea");
    await faccinaDi(B, "Bea", C);
    await o.finoAllaFine();
    if (!await W.aspetta(function () { return o.fine(B); }, 15000)) no("Bea non vede la fine della partita («" + T(B).slice(0, 100) + "»)");
    await W.dorme(800);
    if (filaDelGioco(B)) no("a fine partita Bea ha la fila delle faccine del gioco");
    if (!B.document.querySelector(".sg-guardo")) no("a fine partita Bea non ha più la targhetta");
    var eF = esciDelGioco(B); if (eF.length) no("a fine partita Bea ha «" + eF[0] + "» del gioco (una sola uscita: il ✕ della targhetta)");
    var e2 = await misura(B, "Bea", 360, 640, null); if (e2) no("la fine di Bea a 360x640: " + e2);
    rimetti(B, "Bea");
    // dal telefono di Bea solo "__guardo" e "__faccina"
    var tp = tipiDa(o.racc.stop(), "Bea", C), altri = Object.keys(tp).filter(function (k) { return k !== "__guardo" && k !== "__faccina"; });
    if (altri.length) no("dal telefono di Bea è partito anche " + altri.map(function (k) { return k + "×" + tp[k]; }).join(", "));
    if (!tp.__guardo) no("Bea non ha mandato «__guardo»");
    nota.push("da Bea solo " + Object.keys(tp).map(function (k) { return k + "×" + tp[k]; }).join(", "));
    var vs = o.sent.stop(); if (vs.length) no("Bea ha visto: " + vs.join(", "));
    // Nuova partita: Bea entra nella saletta
    if (!await W.aspetta(function () { return W.clicca(o.P, o.reNuova); }, 6000)) no("Paky non ha «" + o.reNuova.source + "» («" + T(o.P).slice(-120) + "»)");
    var t0 = Date.now();
    if (o.dopoNuova) nota.push(await o.dopoNuova(B));   // (un gioco che riparte senza saletta)
    else {
      if (!await W.aspetta(function () { return B.document.querySelector(".saletta-schermo") && dentro(B) && !B.document.querySelector(".sg-guardo"); }, 8000))
        no("alla Nuova partita Bea non è nella saletta («" + T(B).slice(0, 100) + "»)");
      nota.push("Nuova partita → Bea in saletta in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
    }
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    return nota.join("; ");
  }

  // 670. Scalinata
  aggiungi(670, { nome: "Scalinata guardata col link: niente nome, la scala senza tasti, fino al podio, poi in saletta", fai: async function () {
    var X = await stanza("La Scalinata", "scalinata", null, ["Giulia"]), C = X.C, P = X.P;
    if (!await comincia(P)) no("Paky non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 6000)) no("la Scalinata non comincia");
    var racc = raccogli("Bea"), sent = sentinella("Bea"), B = await apriGuarda("scalinata", C);
    return await guardaFinoAllaFine({ C: C, P: P, B: B, sent: sent, racc: racc, reNuova: /Nuova partita/,
      vista: function (b) { return b.document.querySelector(".sc-scena.con-targa") && /Stai guardando/.test(W.testo(b)) && !b.document.querySelector(".sc-tasto"); },
      sel: ".sc-pann .sc-msg, .sc-corsie",
      finoAllaFine: async function () {
        if (A.ids(C).indexOf(A.mioId("Bea")) >= 0 || A.ids(C, "guarda").indexOf(A.mioId("Bea")) >= 0) no("Bea è nella foto della Scalinata");
        if (!await A.scalinataFinoAllaFine(C, ["Giulia"], "Paky")) no("la Scalinata non finisce");
      },
      fine: function (b) { return /In cima alla scalinata/.test(W.testo(b)) && /entri anche tu/.test(W.testo(b)); } });
  } });

  // 671. Palla Matta: Bea vede il tavolo e i tiri (senza poter tirare); fine veloce: Giulia se ne va, Paky «Finisci ora»
  aggiungi(671, { nome: "Palla Matta guardata col link: il tavolo e i tiri, niente mira; la classifica, poi in saletta", fai: async function () {
    var X = await stanza("Palla Matta", "pallamatta", null, ["Giulia"]), C = X.C, P = X.P;
    if (!await comincia(P)) no("Paky non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("Palla Matta non comincia");
    var racc = raccogli("Bea"), sent = sentinella("Bea"), B = await apriGuarda("pallamatta", C);
    return await guardaFinoAllaFine({ C: C, P: P, B: B, sent: sent, racc: racc, reNuova: /Altra partita|Nuova partita/,
      vista: function (b) { return b.document.querySelector(".pm-scena.pm-targa canvas") && !/Sto entrando/.test(W.testo(b)); },
      sel: ".pm-gioc, .pm-testa",
      finoAllaFine: async function () {
        // un tiro di Paky: Bea lo vede (il suo tavolo si muove)
        var tP = P.__PMpartita; if (tP) tP.tira();
        await W.dorme(1500);
        if ((vm(C).players || []).some(function (p) { return p.id === A.mioId("Bea"); })) no("Bea è tra i giocatori");
        W.spegni("Giulia");
        if (!await W.aspetta(function () { return W.clicca(P, /Finisci ora/); }, 45000)) no("andata via Giulia, Paky non ha «Finisci ora»");
        if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 8000)) no("Palla Matta non finisce");
      },
      fine: function (b) { return /Palline finite|Partita chiusa|Vince|Pareggio/.test(W.testo(b)) && /entri anche tu/.test(W.testo(b)); } });
  } });

  // 672. Ruota (una manche, senza round speciali): Bea guarda lo studio, niente tasti; chi tocca risolve con la frase vera
  function ripresaDi(nome) { try { return JSON.parse(W.BR.mem[nome].l["sg-ripresa"]); } catch (e) { return null; } }
  function nomeDi(v, id) { var p = ((v.giocatori || []).filter(function (x) { return x.id === id; }))[0]; return p ? p.nome : null; }
  function manda(gid, nome, msg) {
    if (nome === "Paky") { var w = W.finestra("Paky"), cb = w && w.__cbH && w.__cbH[gid]; if (cb) cb.onMsg("host", msg); }
    else { var h = W.reteDi(nome); if (h) h.invia(msg); }
  }
  aggiungi(672, { nome: "Ruota guardata col link: lo studio senza tasti né faccine nella barra, fino alla classifica, poi in saletta", fai: async function () {
    var X = await stanza("La Ruota della Fortuna", "ruota", { manche: 1, prenota: false, express: false, veloce: false, finale: false }, ["Giulia"]), C = X.C, P = X.P;
    if (!await comincia(P)) no("Paky non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).giocoFase === "gioco"; }, 8000)) no("la Ruota non comincia");
    var racc = raccogli("Bea"), sent = sentinella("Bea"), B = await apriGuarda("ruota", C);
    var nTasti = 0;
    return await guardaFinoAllaFine({ C: C, P: P, B: B, sent: sent, racc: racc, reNuova: /Nuova partita/,
      vista: function (b) { return b.document.querySelector(".ru-studio.ru-targa"); },
      sel: ".st-barra .ru-stato",
      finoAllaFine: async function () {
        var fatti = {}, fino = Date.now() + 90000;
        while (Date.now() < fino) {
          var v = vm(C);
          if (v.fase === "fine") break;
          if (B.document.querySelector(".st-barra .ru-btn")) nTasti++;
          var R = ripresaDi("Paky"), Pz = R && R.stato && R.stato.P, chi = nomeDi(v, v.turno), k = v.fase + "|" + v.turno + "|" + v.giroN;
          if (Pz && chi && !v.sigla && !fatti[k]) {
            if (v.fase === "gira") { fatti[k] = 1; manda("ruota", chi, { t: "azione", a: "risolvi" }); }
            else if (v.fase === "risolvi") { fatti[k] = 1; manda("ruota", chi, { t: "azione", a: "soluzione", x: Pz.frase }); }
          }
          await W.dorme(300);
        }
        if (vm(C).fase !== "fine") no("la Ruota non finisce (fase " + vm(C).fase + ")");
        if (nTasti) no("Bea ha avuto dei tasti nella barra dello studio");
      },
      fine: function (b) { return /entri anche tu/.test(W.testo(b)); } });
  } });

  // 673. Scopa 2 vs 2 (una mano): Bea vede il tavolo senza le carte in mano di nessuno (il tavolo "g" nel "partita in corso" dell'host)
  // le mosse a copione: chi ha «Tocca a te» (Paky e Giulia) gioca la prima carta (e se serve prende); i Bot da soli
  async function scopa2FinoAllaFine(C, nomi) {
    var sg = function () { var s = W.statoStanza(C) || {}; return s.g ? s.g.fase : s.fase; };
    var fino = Date.now() + 150000;
    while (Date.now() < fino) {
      if (sg() === "fine") return true;
      for (var i = 0; i < nomi.length; i++) {
        var w = W.finestra(nomi[i]), d = w && w.document;
        if (!d || !d.querySelector(".sc-prese .s2-tocca")) continue;
        var mano = [].slice.call(d.querySelectorAll(".sc-mano-riga .sc-carta"));
        if (!mano.length) continue;
        mano[0].click(); await W.dorme(150);
        if (mano[0].classList.contains("sel")) [].forEach.call(d.querySelectorAll(".sc-terra .sc-carta"), function (c) { if (c.classList.contains("cap")) c.click(); });
        await W.dorme(400);
      }
      if (sg() === "fineround") W.clicca(W.finestra("Paky"), /Continua/);
      await W.dorme(250);
    }
    return sg() === "fine";
  }
  aggiungi(673, { nome: "Scopa 2 vs 2 guardata col link: il tavolo senza carte in mano, niente segreti; fine mano, poi in saletta", fai: async function () {
    var X = await stanza("Scopa 2 vs 2", "scopa2v2", { traguardo: 0 }, ["Giulia"]), C = X.C, P = X.P;
    if (!await comincia(P)) no("Paky non ha «Comincia»");
    // sul server resta "partita in corso" col tavolo per chi guarda (g): senza carte in mano
    var gS = function () { return (W.statoStanza(C) || {}).g || null; };
    if (!await W.aspetta(function () { var g = gS(); return g && g.spett && g.fase === "gioco"; }, 8000)) no("sul server non c'è il tavolo per chi guarda (" + JSON.stringify(W.statoStanza(C) || {}).slice(0, 80) + ")");
    if ((gS().mano || []).length) no("nel tavolo per chi guarda ci sono delle carte in mano");
    var racc = raccogli("Bea"), sent = sentinella("Bea"), B = await apriGuarda("scopa2v2", C);
    return await guardaFinoAllaFine({ C: C, P: P, B: B, sent: sent, racc: racc, reNuova: /Nuova partita/,
      vista: function (b) { var d = b.document; return d.querySelector(".schermata.sc-con-targa .sc-mensola") && !d.querySelector(".sc-mano-riga .sc-carta") && d.querySelector(".sc-mano-riga .sc-dorso") && /👀|👉/.test(W.testo(b)); },
      sel: ".sc-mensola",
      finoAllaFine: async function () {
        // nessun segreto: nessun messaggio per Bea (to = il suo id) sul broker, e nella foto per chi guarda niente mani
        var idB = A.mioId("Bea");
        if (!await scopa2FinoAllaFine(C, ["Paky", "Giulia"])) no("la mano di Scopa 2 vs 2 non finisce");
        if (W.BR.log.some(function (l) { return l.indexOf('"to":"' + idB + '"') >= 0; })) no("sul broker c'è un messaggio solo per Bea");
      },
      fine: function (b) { return /Vincono|Pareggio/.test(W.testo(b)) && /entri anche tu/.test(W.testo(b)); } });
  } });

  // 674. Pendolo: Bea vede il lancio (niente comandi); la partita finisce da sola
  aggiungi(674, { nome: "Pendolo guardato col link: il lancio senza comandi, la lobby senza ruolo; la fine, poi in saletta", fai: async function () {
    var X = await stanza("Palla a Pendolo", "pendolo", null, ["Giulia"]), C = X.C, P = X.P;
    // in saletta: Bea non ha la scelta del ruolo
    var racc = raccogli("Bea"), sent = sentinella("Bea"), B = await apriGuarda("pendolo", C);
    if (!await W.aspetta(function () { return B.document.querySelector(".saletta-schermo") && /Guardi la partita/.test(W.testo(B)); }, 6000)) no("nella saletta Bea non legge «Guardi la partita»");
    if (/Lancio io|Sto sulla trave/.test(W.testo(B))) no("nella saletta Bea ha la scelta del ruolo");
    if (!await comincia(P)) no("Paky non ha «Comincia»");
    return await guardaFinoAllaFine({ C: C, P: P, B: B, sent: sent, racc: racc, reNuova: /Nuova partita|Rigioca/,
      vista: function (b) { return b.document.querySelector(".pd-campo canvas") && !b.document.querySelector(".pd-comandi") && !b.document.querySelector(".pd-guarda"); },
      sel: null,
      finoAllaFine: async function () {
        if (!await W.aspetta(function () { return (W.statoStanza(C) || {}).t === "fine"; }, 100000, 300)) no("la partita del Pendolo non finisce");
      },
      fine: function (b) { return /Partita finita/.test(W.testo(b)) && /entri anche tu/.test(W.testo(b)); } });
  } });

  // 675. Horto: Bea vede la corsa in tempo reale, senza frusta né energia; la classifica, poi «🛋️ Saletta» la porta in saletta
  aggiungi(675, { nome: "Horto guardato col link: la corsa in tempo reale senza frusta; la classifica, poi la corsa dopo (Bea guarda ancora)", fai: async function () {
    var X = await stanza("Horto Muso", "horto", null, ["Giulia"]), C = X.C, P = X.P;
    if (!await comincia(P)) no("Paky non ha «Comincia la corsa»");
    var racc = raccogli("Bea"), sent = sentinella("Bea"), B = await apriGuarda("horto", C);
    return await guardaFinoAllaFine({ C: C, P: P, B: B, sent: sent, racc: racc, reNuova: /Nuova partita|Saletta/,
      vista: function (b) { var s = b.document.querySelector(".ho-sotto.solo-guardo"); return s && !visibile(s.querySelector(".ho-frusta")) && /Guardi la corsa/.test(W.testo(b)); },
      sel: ".ho-info, .ho-pista",
      finoAllaFine: async function () {
        if (!await W.aspetta(function () { return (W.statoStanza(C) || {}).t === "fine"; }, 100000, 300)) no("la corsa non finisce");
      },
      fine: function (b) { return /Classifica della corsa/.test(W.testo(b)) && /entri anche tu/.test(W.testo(b)); },
      // «Nuova partita» di Horto è la corsa dopo, subito (senza saletta): chi guarda soltanto la guarda ancora (in saletta ci
      // va quando l'host torna in saletta; nella Sala lo porta dentro la Sala)
      dopoNuova: async function (b) {
        if (!await W.aspetta(function () { return (W.statoStanza(C) || {}).t === "via" && b.document.querySelector(".ho-sotto.solo-guardo") && b.document.querySelector(".sg-guardo"); }, 8000)) no("alla corsa dopo Bea non la guarda («" + T(b).slice(0, 100) + "»)");
        if (((W.statoStanza(C) || {}).ids || []).indexOf(A.mioId("Bea")) >= 0) no("Bea corre nella corsa dopo");
        return "Nuova partita → la corsa dopo parte subito e Bea la guarda";
      } });
  } });

  // tutte in fila
  COPIONE.gruppo6g2 = async function () {
    var esiti = {};
    for (var n of [670, 671, 672, 673, 674, 675]) esiti[n] = await COPIONE.prova(n);
    return esiti;
  };
})();
