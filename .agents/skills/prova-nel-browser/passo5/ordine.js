// PROVE DEL PASSO 5, pezzo p5-o: Parola d'ordine passa alla ripresa e all'host di riserva del core (riprende, riserva).
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo5/ordine.js"); await COPIONE.prova(580)      (580, 581, 582)
// 580 L'host si spegne a metà partita (e non torna): entro 8 s Giulia (la prima arrivata) tiene la partita, stesso tabellone,
//     Luca e Sara leggono «👑 Ora la partita la tiene Giulia» e si continua a giocare; poi Paky riapre l'app e rientra
//     come giocatore nella sua squadra, senza pubblicare niente sulla stanza di Giulia (come la 106 di prima).
// 581 L'host ricarica la pagina a metà partita: la partita la riprende LUI (prima rientrava come ospite e la passava a un
//     amico): stesso codice, stesso tabellone, stesso indizio e stesse parole segnate, nessuno in saletta, nessun 👑, gli
//     amici leggono «🔁 Paky è tornato: la partita riprende da dove era»; poi si gira una parola.
// 582 I capi ritrovano la chiave del tabellone dopo il subentro: Giulia (capo dei Blu) che ora tiene la partita e Paky (capo
//     dei Rossi) che rientra come giocatore vedono di chi è ogni parola, giusta; Luca e Sara no, e nella foto non c'è.
// Il gioco: finché core.js ha ancora HOST_DI_RISERVA = { ordine: 1 } (lo svuota p5-z, correzione 5-8), riaprendo la stanza
// l'host rientrerebbe da ospite: allora le prove usano una COPIA di ordine.js con id "ordine5" (provaOnline), che il core
// tratta come tratterà "ordine" dopo la 5-8. Quando la riga non c'è più si usa Parola d'ordine vera.
// 21 ott 2026 («Segnare e girare»): ritoccare una parola segnata ora toglie il segno; per girarla c'è il tasto «👆 Gira …»
// (aiuto giraCarta, usato nella 580 e nella 581 al posto del secondo tocco sulla carta).
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, pill = A.pill;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- il gioco da provare (vedi sopra) ----
  var GIOCO = null, SRC = null;
  async function prepara() {
    var core = await (await fetch("/js/core.js?" + Date.now())).text();
    if (!/HOST_DI_RISERVA\s*=\s*\{\s*ordine/.test(core)) { GIOCO = "ordine"; SRC = null; return; }
    var s = await (await fetch("/js/games/ordine.js?" + Date.now())).text();
    var s2 = s.replace('var ID = "ordine";', 'var ID = "ordine5";').replace("id: ID, nome:", "id: ID, provaOnline: true, nome:");
    if (s2.indexOf('var ID = "ordine5"') < 0 || s2.indexOf("provaOnline: true") < 0) no("non riesco a preparare la copia di Parola d'ordine");
    SRC = s2; GIOCO = "ordine5";
  }
  function prima() { var src = SRC; return src ? function (w) { w.eval(src); } : undefined; }

  // ---- aiuti ----
  function giocatore(v, id) { return ((v.players || []).filter(function (p) { return p.id === id; }))[0] || null; }
  function chiDi(v, nome) { return ((v.players || []).filter(function (p) { return p.nome === nome; }))[0] || null; }
  function parole(v) { return (v.tab || []).map(function (c) { return c.w; }).join(","); }
  function inSaletta(w) { return !!(w && w.document.querySelector(".saletta-schermo")); }
  function chiusa(w) { return !!(w && /La stanza è chiusa|chiusa dall'host|Problema di collegamento/.test(T(w))); }
  // qualcuno legge la pillola re mentre si aspetta ms? "" = nessuno
  async function senza(nomi, re, ms) {
    var fine = Date.now() + ms;
    while (Date.now() < fine) {
      for (var i = 0; i < nomi.length; i++) { var f = W.finestra(nomi[i]), p = f ? pill(f) : ""; if (re.test(p)) return nomi[i] + ": «" + p + "»"; }
      await W.dorme(200);
    }
    return "";
  }
  // le carte del tabellone sullo schermo di un telefono: [{ c: colore che vede ("0", "1", "n", "x" o null), chiave: la vede da capo }]
  function carteDi(w) {
    return [].slice.call((w && w.document.querySelectorAll(".or-carta")) || []).map(function (b) {
      var m = / c([01nx2])(\s|$)/.exec(" " + b.className + " ");
      return { c: m ? m[1] : null, chiave: b.classList.contains("chiave"), g: b.classList.contains("g") };
    });
  }
  // la chiave vera (dalla partita che l'host ricorda): ["0", "n", "x", …]
  function chiaveVera(nome) {
    var r = null; try { r = JSON.parse(W.BR.mem[nome].l["sg-ripresa"] || "null"); } catch (e) {}
    return r && r.stato && r.stato.tab ? r.stato.tab.map(function (c) { return String(c.c); }) : null;
  }
  // il telefono vede la chiave giusta? "" = sì, se no il motivo
  function vedeChiave(nome, chiave) {
    var cs = carteDi(W.finestra(nome));
    if (cs.length !== chiave.length) return nome + " non ha il tabellone (" + cs.length + " carte)";
    var coperte = cs.filter(function (c) { return !c.g; });
    if (!coperte.length || coperte.some(function (c) { return !c.chiave; })) return nome + " non vede la chiave";
    for (var i = 0; i < cs.length; i++) if (cs[i].c !== chiave[i]) return nome + " vede la carta " + i + " come " + cs[i].c + " invece di " + chiave[i];
    return "";
  }
  function senzaChiave(nome) { return !carteDi(W.finestra(nome)).some(function (c) { return c.chiave; }); }

  // Paky apre Parola d'ordine (percorso di prima: link del gioco → «🔗 Apri la stanza»); gli amici entrano UNO ALLA VOLTA
  // (Giulia per prima: è la prima vice). Squadre fisse: Rossi = Paky e Luca, Blu = Giulia e Sara (capi: Paky e Giulia, o
  // Luca con o.lucaCapo). Si comincia. Restituisce { C, w, ids, amici }
  async function apriPartita(o) {
    o = o || {};
    await prepara();
    var w = {}, ids = { Paky: "host" }, amici = ["Giulia", "Luca", "Sara"];
    w.Paky = await W.apriTel("Paky", { x: 0, hash: "gioco=" + GIOCO, prima: prima() });
    var aperta = await W.aspetta(function () { return W.clicca(w.Paky, /Apri la stanza/) || (W.clicca(w.Paky, /apro io/) && false); }, 8000, 200);
    if (!aperta) no("non trovo «🔗 Apri la stanza» («" + T(w.Paky).slice(0, 80) + "»)");
    var C = await W.aspetta(function () { return A.codiceSaletta(w.Paky) || A.codiceTestata(w.Paky); }, 6000);
    if (!C) no("la stanza non ha il codice");
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i], quanti = i + 2;
      w[n] = await W.apriTel(n, { hash: "gioco=" + GIOCO + "&stanza=" + C, x: 185 * (i + 1), prima: prima() });
      if (!await W.aspetta(function () { return (vm(C).players || []).length >= quanti; }, 8000)) no(n + " non entra");
      ids[n] = A.mioId(n);
    }
    // squadre: Luca con Paky (Rossi, 0), Sara con Giulia (Blu, 1)
    W.reteDi("Luca").invia({ t: "squadra", s: 0 }); W.reteDi("Sara").invia({ t: "squadra", s: 1 }); W.reteDi("Giulia").invia({ t: "squadra", s: 1 });
    if (!await W.aspetta(function () { var v = vm(C); return ["Paky", "Luca"].every(function (x) { var p = chiDi(v, x); return p && p.team === 0; }) && ["Giulia", "Sara"].every(function (x) { var p = chiDi(v, x); return p && p.team === 1; }); }, 5000))
      no("le squadre non si sistemano: " + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome + p.team; })));
    if (o.lucaCapo) W.reteDi("Luca").invia({ t: "capo" });
    W.reteDi("Giulia").invia({ t: "capo" });
    var capi = o.lucaCapo ? [ids.Luca, ids.Giulia] : ["host", ids.Giulia];
    if (!await W.aspetta(function () { return (vm(C).capo || []).join() === capi.join(); }, 5000)) no("i capi non sono quelli giusti: " + JSON.stringify(vm(C).capo));
    if (!await W.aspetta(function () { return W.clicca(w.Paky, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 10000)) no("non comincia (" + vm(C).fase + ")");   // (c'è il 3-2-1-Via!)
    await W.dorme(1500);   // (la copia ai vice: subito quando cambia la fase, poi al massimo una al secondo)
    return { C: C, w: w, ids: ids, amici: amici, nome: function (id) { for (var k in ids) if (ids[k] === id) return k; return null; } };
  }
  // la squadra di turno dà l'indizio dal telefono del suo capo (un amico) e un compagno segna una parola sua:
  // { capo, indovino, parola }. Restituisce l'indice della parola segnata (-1 se non si è potuto)
  // tocca la carta i sullo schermo di un telefono
  async function toccaCarta(nome, i) {
    var w = W.finestra(nome), b = await W.aspetta(function () { var x = w.document.querySelectorAll(".or-carta")[i]; return x && x.classList.contains("attiva") && x; }, 5000);
    if (!b) no(nome + " non può toccare la carta " + i + " («" + T(w).slice(0, 80) + "»)");
    b.click();
  }
  // gira la parola i col tasto «👆 Gira …» (dal 21 ott 2026 ritoccare una parola segnata toglie il segno: per girare c'è il tasto)
  async function giraCarta(nome, i, C) {
    var w = W.finestra(nome), parola = (vm(C).tab || [])[i] ? vm(C).tab[i].w : "";
    var b = await W.aspetta(function () { var x = w.document.querySelector(".or-gira"); return x && !x.disabled && x.textContent.indexOf(parola) >= 0 && x; }, 5000);
    if (!b) no(nome + " non ha «👆 Gira " + parola + "» («" + T(w).slice(-80) + "»)");
    b.click();
  }
  // il capo dà l'indizio «QUOKKA 2» dal suo schermo (campo e «Invia»: vale per chi tiene la partita e per gli altri)
  async function indizioDa(capo, C) {
    var w = W.finestra(capo), inp = await W.aspetta(function () { return w.document.querySelector(".or-input"); }, 5000);
    if (!inp) no(capo + " (capo di turno) non ha il campo dell'indizio («" + T(w).slice(0, 80) + "»)");
    inp.value = "QUOKKA";
    var due = [].slice.call(w.document.querySelectorAll(".or-num")).filter(function (b) { return b.textContent === "2"; })[0]; if (due) due.click();
    if (!W.clicca(w, /^Invia$/)) no(capo + ": niente «Invia»");
    if (!await W.aspetta(function () { return vm(C).passo === "indovina" && vm(C).indizio && vm(C).indizio.parola === "QUOKKA"; }, 4000)) no("l'indizio di " + capo + " non arriva");
  }
  async function indizioESegno(r, chiave) {
    var C = r.C, v = vm(C), k = v.turno, capo = r.nome(v.capo[k]);
    if (!capo) return -1;
    var compagno = r.nome(((v.players || []).filter(function (p) { return p.team === k && p.id !== v.capo[k] && !p.via; })[0] || {}).id);
    await indizioDa(capo, C);
    if (!compagno) return -1;
    var i = -1; (chiave || []).forEach(function (c, j) { if (i < 0 && c === String(k) && !vm(C).tab[j].g) i = j; });
    if (i < 0) i = 0;
    await toccaCarta(compagno, i);   // (primo tocco: la segna)
    if (!await W.aspetta(function () { return (vm(C).prop[r.ids[compagno]] || []).indexOf(i) >= 0; }, 4000)) no("il segno di " + compagno + " non arriva");
    r.indovino = compagno; r.capoTurno = capo;
    return i;
  }

  // 580 -----------------------------------------------------------------------------------------------------------------
  aggiungi(580, { nome: "Parola d'ordine: l'host si spegne, Giulia porta avanti la partita; Paky riapre e rientra come giocatore", fai: async function () {
    var r = await apriPartita({ lucaCapo: true }), C = r.C, v0 = vm(C), tab0 = parole(v0), t0 = Date.now();
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 8000))
      no("dopo 8 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1), v = vm(C);
    if (v.fase !== "gioco" || parole(v) !== tab0 || v.turno !== v0.turno || v.bid !== v0.bid) no("la partita non è quella di prima (fase " + v.fase + ", turno " + v.turno + "/" + v0.turno + ")");
    if (v.gen != null || v.vici != null) no("nella foto ci sono ancora gen/vici del gioco");
    var pg = await A.pilloleDi(["Giulia"], /porti avanti tu/, 2000), pa = await A.pilloleDi(["Luca", "Sara"], /Ora la partita la tiene Giulia/, 3000);
    if (!pg.Giulia) no("Giulia non legge «… la porti avanti tu» («" + pill(r.w.Giulia) + "»)");
    if (!pa.Luca || !pa.Sara) no("Luca e Sara non leggono «Ora la partita la tiene Giulia» (" + JSON.stringify(pa) + ")");
    var p = chiDi(vm(C), "Paky"); if (!p || !p.via) no("Paky non risulta uscito");
    // gli altri rientrano da soli (nessuno resta «via»), nessuno in saletta o con la stanza chiusa
    if (!await W.aspetta(function () { return ["Giulia", "Luca", "Sara"].every(function (n) { var q = chiDi(vm(C), n); return q && !q.via; }); }, 8000))
      no("non tornano tutti in gioco: " + JSON.stringify(vm(C).players.map(function (q) { return q.nome + (q.via ? "(via)" : ""); })));
    var male = r.amici.filter(function (n) { return inSaletta(W.finestra(n)) || chiusa(W.finestra(n)); });
    if (male.length) no("dopo il cambio: " + male.map(function (n) { return n + ": " + T(W.finestra(n)).slice(0, 50); }).join("; "));
    // si gioca: tocca ai Blu → Giulia (che ora tiene la partita) dà l'indizio dal suo schermo e Sara segna una parola;
    // tocca ai Rossi → Luca è rimasto senza compagni: si aspetta Paky («⏳ Aspettiamo Paky»)
    var chiave = chiaveVera("Giulia"), i = -1, mossa = "";
    if (!chiave) no("Giulia non ricorda la partita che porta avanti (sg-ripresa)");
    if (vm(C).turno === 1) { i = await indizioESegno(r, chiave); mossa = "Giulia dà l'indizio e Sara segna"; }
    else if (!await W.aspetta(function () { var a = vm(C).attesa; return a && /Paky/.test(a.chi || ""); }, 4000)) no("tocca ai Rossi ma non si aspetta Paky (" + JSON.stringify(vm(C).attesa) + ")");
    else mossa = "i Rossi aspettano Paky";
    // Paky riapre l'app: guarda prima, trova la partita di Giulia e rientra come giocatore (niente foto sue sulla stanza)
    var t1 = Date.now();
    await W.chiudiApp("Paky");
    var pp = await A.pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 8000);
    if (!pp.Paky) no("riaprendo Paky non legge «👋 Bentornato…» («" + pill(W.finestra("Paky")) + "», «" + T(W.finestra("Paky")).slice(0, 60) + "»)");
    if (!await W.aspetta(function () { var q = chiDi(vm(C), "Paky"); return q && !q.via && q.team === 0 && q.id === "host"; }, 8000)) no("Paky non rientra nella sua squadra");
    if (!await W.aspetta(function () { var P = W.finestra("Paky"); return !inSaletta(P) && P.document.querySelector(".or-carta"); }, 6000)) no("Paky non vede il tabellone («" + T(W.finestra("Paky")).slice(0, 60) + "»)");
    // si va avanti con Paky dentro: la parola segnata si gira, oppure i Rossi giocano (indizio di Luca, Paky segna)
    if (i >= 0) {
      await giraCarta("Sara", i, C);
      if (!await W.aspetta(function () { return vm(C).tab[i].g; }, 6000)) no("la parola segnata da Sara non si gira");
      mossa += ", poi la gira";
    } else {
      var j = await indizioESegno(r, chiave); if (j < 0) no("i Rossi non riescono a giocare");
      mossa += ", poi Luca dà l'indizio e " + r.indovino + " segna";
    }
    var mie = A.fotoDa(C, t1).filter(function (x) { return x.da === "Paky"; });
    if (mie.length) no("riaprendo Paky ha pubblicato " + mie.length + " foto sulla stanza di Giulia");
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== r.ids.Giulia) no("la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" | "));
    return "[" + GIOCO + "] Giulia tiene la partita in " + dt + " s (stesso tabellone); «" + pg.Giulia + "» / «" + pa.Luca + "»; Paky riapre: «" + pp.Paky + "», rientra nei Rossi; " + mossa;
  } });

  // 581 -----------------------------------------------------------------------------------------------------------------
  aggiungi(581, { nome: "Parola d'ordine: l'host ricarica a metà partita e la riprende lui", fai: async function () {
    var r = await apriPartita({ lucaCapo: true }), C = r.C;
    var chiave = chiaveVera("Paky"); if (!chiave) no("Paky non ricorda la partita (sg-ripresa)");
    var i = await indizioESegno(r, chiave);
    await W.dorme(800);   // (il salvataggio: al massimo ogni mezzo secondo)
    var v0 = vm(C), t0 = Date.now();
    var P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._r && s.vm && s.vm.pronta && (W.BR.storia || []).some(function (x) { return x.ms >= t0 && x.topic.indexOf("/" + C + "/stato") >= 0 && x.da === "Paky"; }); }, 10000))
      no("la stanza non si riapre con la partita ripresa (" + JSON.stringify(A.chiTiene(C)) + ")");
    var v = vm(C), c = A.chiTiene(C);
    if (c.g !== 1 || c.h !== "host") no("la partita la tiene " + JSON.stringify(c) + " (doveva riprenderla Paky)");
    if (v.fase !== "gioco" || parole(v) !== parole(v0) || v.turno !== v0.turno || v.bid !== v0.bid) no("non è la partita di prima (fase " + v.fase + ")");
    if (i >= 0 && (!v.indizio || v.indizio.parola !== "QUOKKA" || v.passo !== "indovina")) no("l'indizio di prima è sparito");
    if (i >= 0 && ((v.prop || {})[r.ids[r.indovino]] || []).indexOf(i) < 0) no("la parola segnata da " + r.indovino + " è sparita");
    if (!await W.aspetta(function () { return !inSaletta(P) && P.document.querySelector(".or-carta"); }, 6000)) no("Paky non è sul tabellone («" + T(P).slice(0, 60) + "»)");
    var ph = await A.pilloleDi(["Paky"], /Partita ripresa/, 4000);
    var pa = await A.pilloleDi(["Giulia", "Luca", "Sara"], /tornato: la partita riprende/, 5000);
    if (!ph.Paky) no("Paky non legge «🔁 Partita ripresa!» («" + pill(P) + "»)");
    if (!pa.Giulia || !pa.Luca || !pa.Sara) no("gli amici non leggono «🔁 Paky è tornato: la partita riprende…» (" + JSON.stringify(pa) + ")");
    var sal = r.amici.filter(function (n) { return inSaletta(W.finestra(n)) || chiusa(W.finestra(n)); });
    if (sal.length) no("passano dalla saletta o leggono «chiusa»: " + sal.join(", "));
    var re = await senza(["Paky"].concat(r.amici), /👑/, 7000);   // (il vice non deve prendere il posto)
    if (re) no("pillola 👑 dopo la ricarica: " + re);
    c = A.chiTiene(C); if (c.g !== 1 || c.h !== "host") no("dopo 7 s la partita la tiene " + JSON.stringify(c));
    if (!(vm(C).players || []).every(function (p) { return !p.via; })) no("qualcuno è rimasto «via»: " + JSON.stringify(vm(C).players.map(function (p) { return p.nome + (p.via ? "(via)" : ""); })));
    // si va avanti: chi aveva segnato la parola la gira
    if (i >= 0) {
      await giraCarta(r.indovino, i, C);   // (il segno di prima è rimasto: «👆 Gira …» la gira)
      if (!await W.aspetta(function () { return vm(C).tab[i].g; }, 6000)) no("la parola segnata non si gira dopo la ripresa");
    }
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" | "));
    return "[" + GIOCO + "] Paky riprende la partita (_g 1, stesso tabellone" + (i >= 0 ? ", stesso indizio e stesso segno; poi la parola si gira" : "") + "); «" + ph.Paky + "» / «" + pa.Luca + "»; nessun 👑";
  } });

  // 582 -----------------------------------------------------------------------------------------------------------------
  aggiungi(582, { nome: "Parola d'ordine: dopo il subentro i capi ritrovano la chiave del tabellone", fai: async function () {
    var r = await apriPartita(), C = r.C;
    var chiave = chiaveVera("Paky"); if (!chiave) no("Paky non ricorda la partita (sg-ripresa)");
    // prima: i due capi vedono la chiave, gli altri no, nella foto non c'è
    var e = vedeChiave("Paky", chiave) || vedeChiave("Giulia", chiave); if (e) no("prima del subentro: " + e);
    if (!senzaChiave("Luca") || !senzaChiave("Sara")) no("Luca o Sara vedono la chiave");
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 8000)) no("Giulia non prende la partita");
    if (!await W.aspetta(function () { return !vedeChiave("Giulia", chiave); }, 4000)) no("Giulia, che ora tiene la partita: " + vedeChiave("Giulia", chiave));
    await W.dorme(1500);
    A.torna("Paky");   // (l'app era solo in secondo piano)
    var pp = await A.pilloleDi(["Paky"], /Bentornato.*Giulia/, 8000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato…» («" + pill(W.finestra("Paky")) + "»)");
    if (!await W.aspetta(function () { var q = chiDi(vm(C), "Paky"); return q && !q.via && q.id === "host"; }, 8000)) no("Paky non rientra");
    if ((vm(C).capo || [])[0] !== "host") no("Paky non è più il capo dei Rossi: " + JSON.stringify(vm(C).capo));
    if (!await W.aspetta(function () { return !vedeChiave("Paky", chiave); }, 6000)) no("Paky, rientrato da giocatore: " + vedeChiave("Paky", chiave));
    if (!senzaChiave("Luca") || !senzaChiave("Sara")) no("dopo il subentro Luca o Sara vedono la chiave");
    var foto = vm(C); if ((foto.tab || []).some(function (x) { return !x.g && x.c != null; })) no("nella foto c'è la chiave");
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== r.ids.Giulia) no("la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" | "));
    return "[" + GIOCO + "] Giulia (che tiene la partita) e Paky (rientrato) vedono la chiave giusta; Luca e Sara no, la foto non ce l'ha";
  } });

  // 583 / 584: il CAPO di turno esce (20 ott 2026, deciso dal proprietario: «mi devono aspettare e basta»).
  // 583: il capo di turno si spegne: tutti leggono «⏳ … aspettiamo il capo, X»; dopo più di un minuto (prima a 60 s il capo
  //      lo faceva un compagno da solo) il capo è sempre lui, niente «👑 Faccio io il capo»; torna e dà l'indizio lui.
  // 584: in 2 contro 2 il capo di turno non torna: si aspetta 3 minuti (a 70 s ancora lui, niente turno saltato), poi tocca
  //      all'altra squadra (in squadra non c'è nessuno che possa fare il capo e indovinare).
  async function capoDiTurnoVia(o) {
    var r = await apriPartita(o), C = r.C, v = vm(C), k = v.turno, idCapo = v.capo[k], capo = r.nome(idCapo);
    if (!capo || capo === "Paky") no("il capo di turno è " + capo + " (serve un amico)");
    A.muore(capo);
    if (!await W.aspetta(function () { var a = vm(C).attesa; return a && a.capo && a.k === k; }, 45000)) no("spento " + capo + ", non si aspetta il capo (" + JSON.stringify(vm(C).attesa) + ")");
    var altri = ["Paky"].concat(r.amici).filter(function (n) { return n !== capo; });
    if (!await W.aspetta(function () { return altri.every(function (n) { return new RegExp("aspettiamo il capo, " + capo).test(T(W.finestra(n))); }); }, 5000))
      no("non tutti leggono «aspettiamo il capo, " + capo + "» (" + altri.map(function (n) { return n + ": " + (/aspettiamo[^…]*/.exec(T(W.finestra(n))) || [""])[0]; }).join("; ") + ")");
    return { r: r, C: C, k: k, idCapo: idCapo, capo: capo, altri: altri, t0: Date.now() };
  }
  function bottoneCapo(nomi) { return nomi.filter(function (n) { return /Faccio io il capo/.test(T(W.finestra(n))); }); }
  aggiungi(583, { nome: "Parola d'ordine: il capo di turno esce: lo si aspetta (niente capo nuovo da solo), torna e dà l'indizio lui", fai: async function () {
    var X = await capoDiTurnoVia({ lucaCapo: true }), C = X.C;
    await W.dorme(70000);
    var v = vm(C);
    if (v.capo[X.k] !== X.idCapo) no("dopo 70 s il capo è cambiato da solo (" + JSON.stringify(v.capo) + ")");
    if (!v.attesa || !v.attesa.capo) no("dopo 70 s non si aspetta più il capo (" + JSON.stringify(v.attesa) + ", turno " + v.turno + ")");
    if (v.turno !== X.k) no("dopo 70 s il turno è passato all'altra squadra");
    var b = bottoneCapo(X.altri); if (b.length) no("prima dei 3 minuti c'è «👑 Faccio io il capo» per " + b.join(", "));
    A.torna(X.capo);
    if (!await W.aspetta(function () { var q = chiDi(vm(C), X.capo); return q && !q.via && !vm(C).attesa; }, 15000)) no(X.capo + " torna ma non rientra (" + JSON.stringify(vm(C).attesa) + ")");
    if (vm(C).capo[X.k] !== X.idCapo) no("tornato " + X.capo + ", il capo non è più lui");
    await indizioDa(X.capo, C);
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" | "));
    return "spento " + X.capo + " (capo di turno): «aspettiamo il capo, " + X.capo + "» su tutti; a 70 s ancora capo lui, niente «Faccio io il capo»; torna e dà l'indizio";
  } });
  aggiungi(584, { nome: "Parola d'ordine: 2 contro 2, il capo di turno non torna: 3 minuti di attesa, poi tocca all'altra squadra", fai: async function () {
    var X = await capoDiTurnoVia({ lucaCapo: true }), C = X.C;
    await W.dorme(70000);
    if (vm(C).turno !== X.k || !vm(C).attesa) no("a 70 s non si aspetta più il capo (turno " + vm(C).turno + ")");
    if (!await W.aspetta(function () { return vm(C).turno !== X.k; }, 150000)) no("dopo 3 minuti e mezzo il turno non passa");
    var dt = Math.round((Date.now() - X.t0) / 1000);
    if (dt < 150) no("il turno è passato dopo " + dt + " s (doveva aspettare 3 minuti)");
    var v = vm(C), capo2 = X.r.nome(v.capo[v.turno]);
    if (vm(C).capo[X.k] !== X.idCapo) no("il capo della squadra che aspettava è cambiato");
    await indizioDa(capo2, C);
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" | "));
    return "spento " + X.capo + ": dopo " + dt + " s (3 minuti dall'uscita vista) tocca all'altra squadra, " + capo2 + " dà l'indizio; " + X.capo + " resta capo";
  } });
})();
