// PROVE DEL PASSO 6, GRUPPO 4 (voto e parole): La Balla Colossale, Nomi Cose e Città, Scarabocchio.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo6/g4.js"); await COPIONE.prova(687)      (oppure await COPIONE.gruppo6g4(): 687-692 in fila)
// (Il premio del pubblico NON c'è: deciso dal proprietario il 16 ott. Le prove 689-690 del piano sono diventate "chi guarda".)
// 687 Balla: Marco arriva mentre si scrive il round 1 → è nella foto tra i "prossimi" (non tra i giocatori), legge «✋ Giochi
//     dal prossimo round» e, sulla classifica del round, «✋ Al prossimo round giochi anche tu!» (a 360x640 e 412x915 senza
//     scorrere); i punti del round 1 sono solo dei 3 che giocavano e giusti; al round 2 Marco è dentro con 0 punti, il suo
//     studio ha 4 leggii, gli si apre il foglio e la sua balla arriva; partita fino alla fine, Marco in classifica.
// 688 Nomi Cose Città: lo stesso col giro ("✋ Giochi dal prossimo giro"), i trofei di Marco ripartono da zero.
// 689 Balla e 690 Nomi Cose Città con Bea che guarda col link (guarda=1): niente nome da scrivere, una sola targhetta
//     "👀 Guardi", niente uscita né faccine del gioco, nessun foglio, non è tra i giocatori, dal suo telefono passano solo
//     messaggi "__"; a 360x640 e 412x915 niente scorre e la targhetta non copre la barra in basso; fino alla fine (ancora
//     niente uscite doppie); «Nuova partita» → Bea in meno di 6 s è nella saletta, tra i giocatori.
// 691 Scarabocchio: Marco entra (col link) mentre si disegna → è nella partita subito, non trova la parola né nella chat né
//     sullo schermo (neanche dopo che Luca l'ha indovinata); Bea guarda col link a disegno iniziato → l'host le manda il
//     disegno intero UNA volta (kf), sulla sua lavagna c'è il tratto, niente campo per scrivere, una targhetta, misure; si
//     gioca fino alla fine (anche il turno di Marco); «Nuova partita» → Bea nella saletta.
// 692 Balla nella Sala: Bea arriva dal link della Sala a partita in corso → «▶ Entra · giochi dal prossimo turno» e
//     «👀 Guarda»; «Entra» → aspetta il round dopo ("prossimi"), al round 2 gioca con 0 punti.
// Regole corte: w.__imp sul telefono dell'host (opz.g4: true), le legge solo l'host all'avvio. Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, pill = A.pill;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  var GRUPPO = ["balla", "nomicose", "scarabocchio"];
  var NOMI = { balla: "La Balla Colossale", nomicose: "Nomi, Cose e Città", scarabocchio: "Scarabocchio" };
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- la spia (solo con opz.g4): w.__imp = regole corte, w.__cbH[gid] = la stanza dell'host (per le sue mosse) ----
  if (!W.__prepG4p6) {
    W.__prepG4p6 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG4p6(w, nome, opz);
      if (!opz || !opz.g4) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GRUPPO.indexOf(g.id) >= 0 && !g.__g4) {
            g.__g4 = true; var av = g.avvia;
            g.avvia = function (t) {
              if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
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
  function tel(nome, o) { return W.apriTel(nome, Object.assign({ g4: true }, o || {})); }

  // ---- aiuti ----
  function visibile(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.ownerDocument.defaultView.getComputedStyle(e).visibility !== "hidden"; }
  function logDa(nome, C) { return W.BR.log.filter(function (l) { return l.indexOf(nome + " → " + C + "/") === 0 && l.indexOf("[u2]") < 0; }); }
  function ids(v) { return (v.players || []).map(function (p) { return p.id; }); }
  function pDi(v, id) { return (v.players || []).filter(function (p) { return p.id === id; })[0] || null; }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  // una mossa: dell'host (nella sua stanza, col suo id) o di un amico (dal suo telefono)
  function manda(X, id, m) {
    if (id === "host") { var cb = X.P.__cbH && X.P.__cbH[X.gid]; if (!cb) no("non trovo la stanza dell'host"); cb.onMsg("host", m); return; }
    var n = X.nomeDi[id]; if (!n) return;
    var h = W.reteDi(n); if (h) h.invia(m);
  }
  function esciDelGioco(w) {
    return [].filter.call(w.document.querySelectorAll("button"), function (b) {
      return (/Esci|^✕$/.test(b.textContent.trim()) || /Esci/.test(b.title || "")) && !b.closest(".sg-guardo, .sg-guardo-fila, .sl-velo, .conferma-velo") && visibile(b);
    }).map(function (b) { return b.textContent.trim() || b.title; });
  }
  function faccineDelGioco(w) { return [].filter.call(w.document.querySelectorAll(".sl-fa"), function (x) { return !x.closest(".sg-guardo-fila") && visibile(x); }).length; }
  // i fogli e i tasti per giocare che chi guarda non deve avere
  function perGiocare(w) {
    var d = w.document, l = [];
    if (d.querySelector(".bc-velo.on:not(.via)")) l.push("foglio della Balla");
    if (d.querySelector(".nc-foglio.on:not(.via)")) l.push("foglio di Nomi Cose Città");
    [].forEach.call(d.querySelectorAll("button"), function (b) { if (/⏩ Avanti|Ho votato|👍 Vale|👎 No|Nuova partita|Comincia/.test(b.textContent) && !b.disabled && visibile(b) && !b.closest(".sg-guardo, .sg-guardo-fila")) l.push(b.textContent.trim()); });
    var f = d.querySelector(".sb-scrivi"); if (f && visibile(f)) l.push("campo della chat");
    return l;
  }
  function controllaGuarda(w, nome, quando) {
    var g = w.document.querySelectorAll(".sg-guardo");
    if (g.length !== 1) no(nome + " (" + quando + ") ha " + g.length + " targhette");
    var e = esciDelGioco(w); if (e.length) no(nome + " (" + quando + ") ha anche l'uscita del gioco: " + e.join(", "));
    if (faccineDelGioco(w)) no(nome + " (" + quando + ") ha anche la fila delle faccine del gioco (c'è il 😂 della targhetta)");
    var pg = perGiocare(w); if (pg.length) no(nome + " (" + quando + ") ha cose per giocare: " + pg.join(", "));
    if (/\(tu\)|Tocca a te/.test(T(w))) no(nome + " (" + quando + ") legge «(tu)» o «Tocca a te»");
  }
  // a misura: la pagina non scorre; con la targhetta, la targhetta non copre "sel". "" = tutto bene
  async function misura(w, nome, larg, alt, sel) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; } .st-barra{ transition:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(700); w.scrollTo(0, 0);
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato";
    var g = d.querySelector(".sg-guardo"), rg = g && g.getBoundingClientRect();
    var cose = sel ? [].filter.call(d.querySelectorAll(sel), visibile) : [];
    for (var i = 0; i < cose.length; i++) {
      var r = cose[i].getBoundingClientRect();
      if (r.bottom > alt + 1) return "«" + (cose[i].className || sel) + "» esce dallo schermo (" + Math.round(r.bottom) + ")";
      if (rg && r.left < rg.right - 1 && rg.left < r.right - 1 && r.top < rg.bottom - 1 && rg.top < r.bottom - 1) return "la targhetta copre «" + (cose[i].className || cose[i].textContent.slice(0, 30)) + "»";
    }
    return "";
  }
  async function misure(w, nome, sel) {
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) { var e = await misura(w, nome, M[k][0], M[k][1], sel); if (e) no(nome + " a " + M[k].join("x") + ": " + e); fatte.push(M[k].join("x")); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(300);
    return fatte.join(" e ");
  }

  // ---- Paky apre (percorso di prima), gli amici entrano dal link, si comincia ----
  async function apriPartita(gid, imp, amici) {
    var P = await tel("Paky", { x: 0, prima: function (w) { w.__imp = imp; } });
    var C = await W.apriStanza(P, NOMI[gid]);
    var X = { gid: gid, P: P, C: C, nomeDi: { host: "Paky" }, id: { Paky: "host" }, aMano: {} };
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i];
      await tel(n, { hash: "gioco=" + gid + "&stanza=" + C, x: 185 * (i + 1) });
      var idN = await W.aspetta(function () { var x = A.mioId(n); return x && ids(vm(C)).indexOf(x) >= 0 ? x : null; }, 8000);
      if (!idN) no(n + " non entra nella partita");
      X.id[n] = idN; X.nomeDi[idN] = n;
    }
    await W.dorme(600);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia|Via ▶/); }, 8000)) no("Paky non trova «Comincia» («" + T(P).slice(0, 100) + "»)");
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 12000)) no("la partita non comincia (fase " + vm(C).fase + ", giocatori " + ids(vm(C)).length + ", tasti: " + [].map.call(P.document.querySelectorAll("button"), function (b) { return b.textContent.trim() + (b.disabled ? "(spento)" : ""); }).join(" | ").slice(0, 300) + ")");
    return X;
  }
  // chi entra dopo (col join): il suo id
  async function entraTardi(X, nome, x) {
    var w = await tel(nome, { hash: "gioco=" + X.gid + "&stanza=" + X.C, x: x });
    var id = await W.aspetta(function () { return A.mioId(nome); }, 8000);
    if (!id) no(nome + " non si collega");
    X.id[nome] = id; X.nomeDi[id] = nome;
    return { w: w, id: id };
  }

  // ---- le partite a copione ----
  // Balla: tutti scrivono una balla, votano la prima risposta che non è la loro, alla classifica del round «⏩ Avanti».
  // Si ferma quando fino(v) è vero (prima di fare le mosse di quella foto). X.aMano[id]: quello scrive e vota da solo
  async function giocaBalla(X, fino, ogni) {
    var C = X.C, tempo = Date.now() + 240000, fatti = {};
    while (Date.now() < tempo) {
      var v = vm(C);
      if (fino(v)) return v;
      (v.players || []).forEach(function (p) {
        if (p.via || X.aMano[p.id]) return;
        var k = v.fase + "|" + v.giro + "." + (v.rif || 0) + "|" + p.id, mia = "balla di " + p.nome + " " + v.giro;
        if (fatti[k]) return;
        if (v.fase === "scrittura" && (v.fatti || []).indexOf(p.id) < 0) { fatti[k] = 1; manda(X, p.id, { t: "balla", testo: mia }); }
        else if (v.fase === "voto" && (v.fatti || []).indexOf(p.id) < 0) {
          var kk = (v.scelte || []).map(function (s) { return s.testo; }).findIndex(function (tx) { return tx !== mia; });
          if (kk >= 0) { fatti[k] = 1; manda(X, p.id, { t: "voto", k: kk }); }
        }
        else if (v.fase === "punti" && (v.avanti || []).indexOf(p.id) < 0) { fatti[k] = 1; manda(X, p.id, { t: "avanti" }); }
      });
      if (ogni) await ogni(v);
      await W.dorme(300);
    }
    no("la Balla non arriva dove serve (fase " + vm(C).fase + ", round " + vm(C).giro + ")");
  }
  // Nomi Cose Città: tutti consegnano il foglio, al tabellone "pronto" su ogni categoria, alla classifica del giro «⏩ Avanti»
  async function giocaNcc(X, fino, ogni) {
    var C = X.C, tempo = Date.now() + 240000, fatti = {};
    while (Date.now() < tempo) {
      var v = vm(C);
      if (fino(v)) return v;
      (v.players || []).forEach(function (p) {
        if (p.via || X.aMano[p.id]) return;
        var k = v.fase + "|" + v.giro + "|" + (v.ci || 0) + "|" + p.id;
        if (fatti[k]) return;
        if (v.fase === "scrittura" && (v.fatti || []).indexOf(p.id) < 0) { fatti[k] = 1; manda(X, p.id, { t: "risposte", r: (v.cats || []).map(function (c, i) { return v.lettera + "ccio" + i + p.nome.charAt(0); }) }); }
        else if (v.fase === "tabellone" && (v.pronti || []).indexOf(p.id) < 0) { fatti[k] = 1; manda(X, p.id, { t: "pronto", ci: v.ci }); }
        else if (v.fase === "punti" && (v.avanti || []).indexOf(p.id) < 0) { fatti[k] = 1; manda(X, p.id, { t: "avanti", g: v.giro }); }
      });
      if (ogni) await ogni(v);
      await W.dorme(300);
    }
    no("Nomi Cose Città non arriva dove serve (fase " + vm(C).fase + ", giro " + vm(C).giro + ")");
  }

  // ===================== 687 / 688: chi arriva a partita cominciata entra dal round/giro dopo =====================
  function tardi(gid) {
    var balla = gid === "balla", gioca = balla ? giocaBalla : giocaNcc, parola = balla ? "round" : "giro";
    return { nome: NOMI[gid] + ": chi arriva mentre si scrive entra dal " + parola + " dopo con 0 punti (i punti del " + parola + " in corso restano giusti)", fai: async function () {
      var X = await apriPartita(gid, balla ? { round: 2, amici: "no", ride: false } : { round: 2, secondi: 40 }, ["Luca", "Sara"]), C = X.C;
      if (!await W.aspetta(function () { return vm(C).fase === "scrittura" && vm(C).giro === 0; }, 30000)) no("non si arriva a scrivere (fase " + vm(C).fase + ")");
      var M = await entraTardi(X, "Marco", 555), wM = M.w, idM = M.id;
      if (!await W.aspetta(function () { return (vm(C).prossimi || []).indexOf(idM) >= 0; }, 8000)) no("Marco non è tra i «prossimi» della foto (" + JSON.stringify(vm(C).prossimi) + ")");
      if (ids(vm(C)).indexOf(idM) >= 0) no("Marco è subito tra i giocatori (il " + parola + " in corso si sballa)");
      var re = new RegExp("Giochi dal prossimo " + parola);
      if (!await W.aspetta(function () { return re.test(T(wM)); }, 10000)) no("Marco non legge «✋ Giochi dal prossimo " + parola + "» («" + T(wM).slice(-120) + "»)");
      var pillola = await W.aspetta(function () { var p = pill(wM); return /Sei dentro/.test(p) ? p : null; }, 3000, 100);
      if (/Partita in corso: la guardi/.test(pill(wM))) no("Marco legge ancora la pillola «la guardi ed entri alla prossima»");
      // il primo round/giro fino alla classifica: i punti solo dei 3 che giocavano
      var v1 = await gioca(X, function (v) { return v.fase === "punti" && v.giro === 0 && v.ultimo; });
      var ult = balla ? v1.ultimo : (v1.ultimo && v1.ultimo.tot) || {};
      var chi = Object.keys(ult).sort().join(","), attesi = ["host", X.id.Luca, X.id.Sara].sort().join(",");
      if (chi !== attesi) no("i punti del primo " + parola + " sono di «" + chi + "» invece di «" + attesi + "»");
      (v1.players || []).forEach(function (p) { if (p.punti !== (ult[p.id] || 0)) no(p.nome + " ha " + p.punti + " punti ma nel " + parola + " ne ha fatti " + ult[p.id]); });
      if (ids(v1).indexOf(idM) >= 0) no("alla classifica del primo " + parola + " Marco è già tra i giocatori");
      var re2 = new RegExp("Al prossimo " + parola + " giochi anche tu");
      if (!await W.aspetta(function () { return re2.test(T(wM)); }, 15000)) no("sulla classifica Marco non legge «✋ Al prossimo " + parola + " giochi anche tu!» («" + T(wM).slice(-120) + "»)");
      var mis = await misure(wM, "Marco", ".st-barra.on > *");
      // il secondo: Marco è dentro con 0 punti
      var v2 = await gioca(X, function (v) { return v.giro === 1 && v.fase !== "punti"; });
      var pm = pDi(v2, idM);
      if (!pm || pm.via || pm.punti !== 0) no("al " + parola + " 2 Marco non è dentro con 0 punti (" + JSON.stringify(pm) + ")");
      if ((v2.prossimi || []).length) no("al " + parola + " 2 ci sono ancora dei «prossimi»");
      if (!await W.aspetta(function () { return wM.document.querySelectorAll(".st-leggio").length === 4; }, 8000)) no("lo studio di Marco ha " + wM.document.querySelectorAll(".st-leggio").length + " leggii invece di 4");
      X.aMano[idM] = 1;   // (Marco scrive dal suo foglio)
      if (!await W.aspetta(function () { return vm(C).fase === "scrittura" && vm(C).giro === 1; }, 30000)) no("il " + parola + " 2 non arriva a scrivere");
      var foglio = await W.aspetta(function () { return wM.document.querySelector(balla ? ".bc-velo.on:not(.via)" : ".nc-foglio.on:not(.via)"); }, 15000);
      if (!foglio) no("a Marco non si apre il foglio al " + parola + " 2 («" + T(wM).slice(-100) + "»)");
      if (balla) {
        var ta = foglio.querySelector(".bc-penna"), ok = foglio.querySelector(".bc-ok");
        ta.value = "la balla di Marco"; ta.dispatchEvent(new wM.Event("input", { bubbles: true })); ok.click();
      } else W.reteDi("Marco").invia({ t: "risposte", r: (vm(C).cats || []).map(function (c, i) { return vm(C).lettera + "osso" + i; }) });
      if (!await W.aspetta(function () { return (vm(C).fatti || []).indexOf(idM) >= 0; }, 6000)) no("il foglio di Marco non arriva all'host");
      delete X.aMano[idM];
      var vf = await gioca(X, function (v) { return v.fase === "fine"; });
      var cl = balla ? (vf.classifica || []) : (vf.players || []);
      if (!cl.some(function (r) { return r.id === idM; })) no("a fine partita Marco non è in classifica");
      if (!balla) { var tr = (pDi(vf, idM) || {}).trofei; if (!tr) no("Marco non ha i suoi trofei della partita"); }
      errori();
      return "Marco: «prossimi» → «✋ Giochi dal prossimo " + parola + "»" + (pillola ? " (pillola «" + pillola + "»)" : "") + ", punti del primo " + parola + " giusti (" + chi.split(",").length + " giocatori), classifica " + mis + " senza scorrere, al " + parola + " 2 dentro con 0 punti e 4 leggii, il suo foglio arriva, in classifica a fine partita";
    } };
  }
  aggiungi(687, tardi("balla"));
  aggiungi(688, tardi("nomicose"));

  // ===================== 689 / 690: chi guarda col link fino alla fine =====================
  function guarda(gid) {
    var balla = gid === "balla", gioca = balla ? giocaBalla : giocaNcc;
    return { nome: NOMI[gid] + ": chi guarda col link (guarda=1) fino alla fine, senza fogli né uscite doppie, poi entra da solo", fai: async function () {
      var X = await apriPartita(gid, balla ? { round: 1, amici: "no", ride: false } : { round: 1, secondi: 40 }, ["Luca", "Sara"]), C = X.C, P = X.P;
      if (!await W.aspetta(function () { return vm(C).fase === "scrittura"; }, 30000)) no("non si arriva a scrivere");
      var B = await W.apriTel("Bea", { hash: "gioco=" + gid + "&stanza=" + C + "&guarda=1", x: 555, g4: true });
      if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo"); }, 8000)) no("Bea non ha la targhetta («" + T(B).slice(0, 100) + "»)");
      if (/Il tuo nome/.test(T(B))) no("Bea vede la schermata del nome");
      if (!await W.aspetta(function () { return B.document.querySelector(".st-vista.st-con-targa"); }, 8000)) no("lo studio di Bea non lascia il posto alla targhetta");
      await W.dorme(2500);
      var idB = A.mioId("Bea");
      if (ids(vm(C)).indexOf(idB) >= 0 || (vm(C).prossimi || []).indexOf(idB) >= 0) no("Bea (guarda) è tra i giocatori o i prossimi");
      if (!/Stai guardando/.test(T(B))) no("Bea non legge «👀 Stai guardando…» («" + T(B).slice(-100) + "»)");
      controllaGuarda(B, "Bea", "mentre si scrive");
      var mis = await misure(B, "Bea", ".st-barra.on > *");
      var giri = 0, fasi = {};
      await gioca(X, function (v) { return v.fase === "fine"; }, async function (v) {
        if (++giri % 4) return;
        fasi[v.fase] = 1; controllaGuarda(B, "Bea", "fase " + v.fase);
      });
      if (!await W.aspetta(function () { return B.document.querySelector(balla ? ".bc-cl" : ".nc-cl") && /punti/.test(T(B)) && !B.document.querySelector(".st-vista"); }, 30000)) no("Bea non arriva alla classifica finale («" + T(B).slice(-120) + "»)");
      await W.dorme(1200);
      controllaGuarda(B, "Bea", "a fine partita");
      if (!/Hai guardato/.test(T(B))) no("a fine partita Bea non legge «👀 Hai guardato…»");
      var mf = await misure(B, "Bea", ".schermata .modulo-nota");
      var altri = logDa("Bea", C).filter(function (l) { return !/"t":"__/.test(l); });
      if (altri.length) no("dal telefono di Bea passano messaggi del gioco: " + altri.slice(0, 2).join(" / "));
      if (!await W.aspetta(function () { return W.clicca(P, /Nuova partita|Rivincita/); }, 20000)) no("Paky non trova «Nuova partita» («" + T(P).slice(-120) + "»)");
      if (!await W.aspetta(function () { var v = vm(C); return v.fase === "lobby" && ids(v).indexOf(A.mioId("Bea")) >= 0; }, 6000)) no("alla nuova partita Bea non entra da sola");
      await W.dorme(800);
      if (W.finestra("Bea").document.querySelector(".sg-guardo")) no("nella saletta Bea ha ancora la targhetta");
      errori();
      return "Bea guarda (fasi " + Object.keys(fasi).join(", ") + ": una targhetta, niente fogli né uscite né faccine del gioco, solo «__»; misure " + mis + ", fine " + mf + ") e alla nuova partita è nella saletta";
    } };
  }
  aggiungi(689, guarda("balla"));
  aggiungi(690, guarda("nomicose"));

  // ===================== 691: Scarabocchio, chi entra mentre si disegna =====================
  // la parola di chi disegna (dal suo schermo: «✏️ Disegna: gatto»)
  function parolaDi(X, v) { var n = X.nomeDi[v.disegnatore], w = n && W.finestra(n), b = w && w.document.querySelector(".sb-centro b"); return b ? b.textContent : null; }
  // quanti pixel scuri sulla riga di mezzo della lavagna di un telefono (il tratto di prova è orizzontale, a metà altezza)
  function scuri(w) {
    var cv = w.document.querySelector(".sb-cv"); if (!cv || !cv.width) return 0;
    var y = Math.round(cv.height * 0.5), d = cv.getContext("2d").getImageData(0, y - 3, cv.width, 7).data, n = 0;
    for (var i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 200 && d[i + 3] > 200) n++;
    return n;
  }
  function kfDi(C) { return logDa("Paky", C).filter(function (l) { return /"t":"disegno","kf":1/.test(l); }).length; }
  aggiungi(691, { nome: "Scarabocchio: chi entra mentre si disegna non trova la parola; chi guarda col link riceve il disegno intero una volta", fai: async function () {
    var X = await apriPartita("scarabocchio", { giri: 1, secondi: 60 }, ["Luca"]), C = X.C, P = X.P;
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 15000)) no("non si arriva alla scelta della parola");
    var v = vm(C), dis = v.disegnatore, altro = dis === "host" ? X.id.Luca : "host";
    manda(X, dis, { t: "scegli", i: 0 });
    if (!await W.aspetta(function () { return vm(C).fase === "disegno"; }, 8000)) no("non si comincia a disegnare");
    var parola = await W.aspetta(function () { return parolaDi(X, vm(C)); }, 5000);
    if (!parola) no("non leggo la parola sullo schermo di chi disegna");
    manda(X, dis, { t: "tr", id: "prova.1", c: 0, w: 2, f: 0, p: [100, 600, 500, 600, 900, 600] });
    await W.dorme(400);
    manda(X, altro, { t: "prova", x: "uffa che difficile" });
    // Marco entra col link: subito nella partita, la parola non c'è
    var M = await entraTardi(X, "Marco", 370), wM = M.w, idM = M.id;
    if (!await W.aspetta(function () { return ids(vm(C)).indexOf(idM) >= 0 && wM.document.querySelector(".sb-cv"); }, 8000)) no("Marco non entra subito nella partita");
    if ((vm(C).ordine || []).length && vm(C).ordine.indexOf(idM) < 0) no("Marco non è nel giro di chi disegna");
    await W.dorme(1500);
    var pw = parola.toLowerCase();
    function senzaParola(quando) {
      if ((vm(C).chat || []).some(function (m) { return String(m.x || "").toLowerCase().indexOf(pw) >= 0; })) no("la parola «" + parola + "» è nella chat della foto (" + quando + ")");
      if (T(wM).toLowerCase().indexOf(pw) >= 0) no("Marco trova la parola «" + parola + "» sullo schermo (" + quando + ")");
    }
    senzaParola("appena entrato");
    if (!wM.document.querySelector(".sb-lettere")) no("Marco non vede le lettere nascoste");
    if (scuri(wM) < 20) no("Marco non ha il disegno fatto prima che entrasse");
    // Bea guarda col link: l'host le manda il disegno intero (una volta)
    var kf0 = kfDi(C);
    var B = await W.apriTel("Bea", { hash: "gioco=scarabocchio&stanza=" + C + "&guarda=1", x: 555, g4: true });
    if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo") && B.document.querySelector(".sb-cv"); }, 8000)) no("Bea non guarda la lavagna («" + T(B).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return kfDi(C) > kf0; }, 7000)) no("l'host non manda il disegno intero a chi guarda");
    if (!await W.aspetta(function () { return scuri(B) >= 20; }, 3000)) no("sulla lavagna di Bea non c'è il tratto fatto prima (" + scuri(B) + " pixel)");
    await W.dorme(5000);
    var kf1 = kfDi(C) - kf0;
    if (kf1 !== 1) no("il disegno intero è partito " + kf1 + " volte invece di una");
    controllaGuarda(B, "Bea", "durante il disegno");
    var mis = await misure(B, "Bea", ".sb-chat, .sb-gente");
    // chi indovina: «ha indovinato», la parola non compare
    manda(X, altro, { t: "prova", x: parola });
    if (!await W.aspetta(function () { return (pDi(vm(C), altro) || {}).ok; }, 5000)) no("la risposta giusta non vale");
    await W.dorme(800);
    senzaParola("dopo la risposta giusta");
    if (!/ha indovinato/.test(T(wM))) no("Marco non legge «… ha indovinato!»");
    // fino alla fine (anche il turno di Marco): chi disegna sceglie la prima, gli altri la indovinano
    var tempo = Date.now() + 200000, fatto = {};
    while (Date.now() < tempo && vm(C).fase !== "fine") {
      v = vm(C);
      if (v.fase === "scelta" && !fatto["s" + v.turno]) { fatto["s" + v.turno] = 1; manda(X, v.disegnatore, { t: "scegli", i: 0 }); }
      if (v.fase === "disegno") {
        var pp = parolaDi(X, v);
        if (pp) (v.players || []).forEach(function (p) { if (p.id !== v.disegnatore && !p.ok && !fatto[v.turno + p.id]) { fatto[v.turno + p.id] = 1; manda(X, p.id, { t: "prova", x: pp }); } });
      }
      if (B.document.querySelector(".sb-scrivi") && visibile(B.document.querySelector(".sb-scrivi"))) no("Bea ha il campo per scrivere");
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("lo Scarabocchio non finisce (fase " + vm(C).fase + ")");
    if (!await W.aspetta(function () { return /Classifica finale/.test(T(B)); }, 8000)) no("Bea non vede la classifica");
    await W.dorme(800);
    controllaGuarda(B, "Bea", "a fine partita");
    var altri = logDa("Bea", C).filter(function (l) { return !/"t":"__/.test(l); });
    if (altri.length) no("dal telefono di Bea passano messaggi del gioco: " + altri.slice(0, 2).join(" / "));
    if (!await W.aspetta(function () { return W.clicca(P, /Nuova partita|Rivincita/); }, 10000)) no("Paky non trova «Nuova partita»");
    if (!await W.aspetta(function () { var vv = vm(C); return vv.fase === "lobby" && ids(vv).indexOf(A.mioId("Bea")) >= 0; }, 6000)) no("alla nuova partita Bea non entra da sola");
    errori();
    return "parola «" + parola + "» mai vista da Marco (entrato e nel giro), Bea: disegno intero 1 volta, tratto sulla lavagna, niente campo, misure " + mis + ", alla nuova partita nella saletta";
  } });

  // ===================== 692: Balla nella Sala, arriva a partita in corso =====================
  aggiungi(692, { nome: "Balla nella Sala: chi arriva a partita in corso tocca «▶ Entra» e gioca dal round dopo con 0 punti", fai: async function () {
    var P = await tel("Paky", { x: 0, salaSempre: true, prima: function (w) { w.__imp = { round: 2, amici: "no", ride: false }; } });
    var S = await A.apriSalaNuova("Paky");
    var amici = ["Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) {
      await tel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
      var q = i + 2;
      if (!await W.aspetta(function () { return (vm(S).membri || []).length === q; }, 10000)) no(amici[i] + " non entra nella Sala");
    }
    var C = await A.lanciaDallaSala("Paky", S, NOMI.balla);
    if (!await W.aspetta(function () { return ids(vm(C)).length === 3; }, 12000)) no("nella Balla non sono in 3");
    await W.dorme(600);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 8000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "scrittura"; }, 30000)) no("non si arriva a scrivere (fase " + vm(C).fase + ", Paky: " + T(P).slice(0, 160) + ")");
    var X = { gid: "balla", P: P, C: C, nomeDi: { host: "Paky" }, id: { Paky: "host" }, aMano: {} };
    amici.forEach(function (n) { var id = (vm(C).players || []).filter(function (p) { return p.nome === n; }).map(function (p) { return p.id; })[0]; X.id[n] = id; X.nomeDi[id] = n; });
    var B = await tel("Bea", { hash: "sala=" + S, x: 555, salaSempre: true });
    var riga = await W.aspetta(function () { var n = B.document.querySelector(".saletta-schermo .sl-incorso:not(.sl-duello)"); return n && n.querySelectorAll("button").length === 2 ? n : null; }, 10000);
    if (!riga) no("Bea non vede il riquadro della partita con due tasti («" + T(B).slice(0, 100) + "»)");
    var tasti = [].map.call(riga.querySelectorAll("button"), function (b) { return b.textContent; });
    if (tasti[0] !== "▶ Entra · giochi dal prossimo turno" || !/👀 Guarda/.test(tasti[1] || "")) no("i tasti sono " + JSON.stringify(tasti));
    var testo = riga.innerText.replace(/\s+/g, " ");
    if (!/Si gioca a La Balla Colossale|Si gioca alla Balla/.test(testo)) no("la riga dice «" + testo + "»");
    W.clicca(B, /Entra · giochi/, ".sl-incorso button");
    var idB = await W.aspetta(function () { var id = A.mioId("Bea"); return id && (vm(C).prossimi || []).indexOf(id) >= 0 ? id : null; }, 10000);
    if (!idB) no("con «Entra» Bea non aspetta il round dopo (prossimi " + JSON.stringify(vm(C).prossimi) + ")");
    X.nomeDi[idB] = "Bea";
    if (!await W.aspetta(function () { return /Giochi dal prossimo round/.test(T(B)); }, 10000)) no("Bea non legge «✋ Giochi dal prossimo round»");
    var v2 = await giocaBalla(X, function (v) { return v.giro === 1 && v.fase !== "punti"; });
    var pb = pDi(v2, idB);
    if (!pb || pb.punti !== 0) no("al round 2 Bea non gioca con 0 punti (" + JSON.stringify(pb) + ")");
    errori();
    return "Bea nella Sala: «" + testo + "», tasti " + tasti.join(" / ") + "; «Entra» → aspetta il round dopo, al round 2 gioca con 0 punti";
  } });

  COPIONE.gruppo6g4 = async function () { var out = []; for (var n = 687; n <= 692; n++) out.push(await COPIONE.prova(n)); return out; };
  // (per la serata di prova 633 del copione: la Balla a copione, coi telefoni con la spia { g4: true })
  COPIONE.g4p6 = { giocaBalla: giocaBalla, pDi: pDi, controllaGuarda: controllaGuarda };
})();
