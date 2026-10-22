// PROVE DEL PASSO 6, GRUPPO 5 (parole e quiz, chi guarda): Linea del tempo, Taboo, Parola d'ordine, Patata Bollente.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo6/g5.js"); await COPIONE.prova(694)      (oppure await COPIONE.gruppo6g5(): 694-699 in fila)
// 694 Linea del tempo · 695 Taboo · 696 Parola d'ordine · 697 Patata. Ognuno (stanza di un gioco solo, percorso di prima):
//   Paky apre, gli amici entrano dal link, si comincia; Bea apre il link con guarda=1. Bea: niente nome da scrivere, una
//   sola targhetta "👀 Guardi", non è tra i giocatori, dal suo telefono passano solo messaggi "__" (mai un "join"), nessun
//   "🏠 Esci"/✕ del gioco né la fila delle faccine del gioco (c'è il 😂 della targhetta: la faccina arriva a un giocatore
//   col nome di Bea), nessun tasto per giocare (voto, Avanti, BUZZ, passa…) e nessun segreto (Taboo: né la parola né le
//   vietate; Parola d'ordine: niente chiave, nessun messaggio per lei); a 360x640 e 412x915 la pagina non scorre e la
//   targhetta non copre la barra in basso. Si gioca fino alla fine (a copione); a fine partita ancora niente uscite doppie;
//   Paky "Nuova partita" → Bea in meno di 5 s è nella saletta, tra i giocatori, senza toccare niente.
// 698 Parola d'ordine: Marco arriva a partita cominciata → entra subito nella squadra più piccola e legge «🎉 Sei dentro!
//     Giochi già da adesso» (fino al 22 ott 2026 «dal prossimo turno», che non era vero).
// 699 Taboo: la saletta dell'host con le squadre (6 giocatori) a 360x640 e 412x915 non scorre.
// Regole corte per fare presto (solo sui telefoni con opz.g5imp, solo l'host le legge): Linea del tempo 1 carta, Taboo 60 s
// e 1 giro (l'orologio di taboo.js dell'host salta avanti a fine turno), Patata 10 secondi. Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, vm = A.vm, no = A.no, pill = A.pill;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  var GRUPPO = ["timeline", "taboo", "ordine", "patata"];
  var NOMI = { timeline: "La linea del tempo", taboo: "Taboo", ordine: "Parola d'ordine", patata: "La Patata Bollente" };
  var IMP = { timeline: { carte: 1 }, taboo: { tempo: 60, giri: 1 }, patata: { tempo: 10 } };
  var AMICI = { timeline: ["Giulia"], taboo: ["Giulia", "Luca", "Sara"], ordine: ["Giulia", "Luca", "Sara"], patata: ["Giulia"] };
  // la barra in basso di chi guarda (la targhetta non la deve coprire)
  var BARRA = { timeline: ".st-barra.on > *", taboo: ".tb-tasti > *, .tb-corpo", ordine: ".st-barra.on > *", patata: ".st-barra.on > *" };
  // i tasti per giocare che chi guarda non deve avere
  var TASTI = /Giusto|👎 No|Avanti ▶|Mettila qui|Tocca dove va|BUZZ|Indovinata|Passo \d|Pronti, via|Via! ▶|Faccio io il capo|Vengo qui|Invia|Nuova partita/;

  // ---- i telefoni con le regole corte e la spia dell'host (solo con opz.g5imp) ----
  if (!W.__prepG5p6) {
    W.__prepG5p6 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG5p6(w, nome, opz);
      if (!opz || !opz.g5imp) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GRUPPO.indexOf(g.id) >= 0) {
            var av = g.avvia;
            g.avvia = function (t) {
              if (IMP[g.id] && t.impostazioni && !(t.linkParams && t.linkParams.stanza)) Object.keys(IMP[g.id]).forEach(function (k) { t.impostazioni[k] = IMP[g.id][k]; });
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  function tel(nome, o) { return W.apriTel(nome, Object.assign({ g5imp: true }, o || {})); }
  // l'host: le sue stanze (per mandare le sue mosse come se toccasse lui), le chiavi di Parola d'ordine, l'orologio di Taboo
  function spiaHost(w) {
    if (w.__spiaHost) return;
    w.__spiaHost = true; w.__cbH = {};
    var osp = w.SGNet.ospita;
    w.SGNet.ospita = function (gid, cb) {
      var h = osp.apply(this, arguments);
      w.__cbH[gid] = cb;
      if (h && h.inviaVeloce) { var iv = h.inviaVeloce; h.inviaVeloce = function (m) { if (m && m.t === "chiave" && m.col) w.__chiave = m.col; return iv.apply(this, arguments); }; }
      return h;
    };
    var ora = w.Date.now.bind(w.Date); w.__salto = 0;
    w.Date.now = function () { if (w.__salto && /taboo\.js/.test(new Error().stack || "")) return ora() + w.__salto; return ora(); };
  }

  // ---- aiuti ----
  function visibile(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.ownerDocument.defaultView.getComputedStyle(e).visibility !== "hidden"; }
  function logDa(nome, C) { return W.BR.log.filter(function (l) { return l.indexOf(nome + " → " + C + "/") === 0 && l.indexOf("[u2]") < 0; }); }
  function giocDi(gid, v) { return (v && (gid === "timeline" || gid === "taboo" ? v.giocatori : v.players)) || []; }
  function idsGioc(gid, v) { return giocDi(gid, v).map(function (p) { return p.id; }); }
  function finita(v) { return !!v && v.fase === "fine"; }
  // i tasti "Esci"/✕ del gioco che si vedono (quelli della targhetta e delle finestre del core no)
  function esciDelGioco(w) {
    return [].filter.call(w.document.querySelectorAll("button"), function (b) {
      return (/Esci|^✕$/.test(b.textContent.trim()) || /Esci/.test(b.title || "")) && !b.closest(".sg-guardo, .sg-guardo-fila, .sl-velo, .conferma-velo") && visibile(b);
    }).map(function (b) { return b.textContent.trim() || b.title; });
  }
  function tastiPerGiocare(w) {
    return [].filter.call(w.document.querySelectorAll("button"), function (b) { return TASTI.test(b.textContent) && !b.disabled && !b.closest(".sg-guardo, .sg-guardo-fila") && visibile(b); }).map(function (b) { return b.textContent.trim(); });
  }
  // la fila delle faccine del gioco (non quella della targhetta)
  function faccineDelGioco(w) { return [].filter.call(w.document.querySelectorAll(".sl-fa"), function (x) { return !x.closest(".sg-guardo-fila") && visibile(x); }).length; }
  function controllaGuarda(gid, w, nome, quando) {
    var g = w.document.querySelectorAll(".sg-guardo");
    if (g.length !== 1) no(nome + " (" + quando + ") ha " + g.length + " targhette");
    var e = esciDelGioco(w); if (e.length) no(nome + " (" + quando + ") ha anche l'uscita del gioco: " + e.join(", "));
    var tp = tastiPerGiocare(w); if (tp.length) no(nome + " (" + quando + ") ha tasti per giocare: " + tp.join(", "));
    if (faccineDelGioco(w)) no(nome + " (" + quando + ") ha anche la fila delle faccine del gioco (c'è il 😂 della targhetta)");
    if (/Tocca a te|\(tu\)|spieghi tu/.test(T(w))) no(nome + " (" + quando + ") legge «Tocca a te» o «(tu)»");
  }
  // a misura (larg x alt): la pagina non scorre e la targhetta non copre la barra in basso. "" = tutto bene
  async function misuraGuarda(w, nome, larg, alt, sel) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; } .st-barra{ transition:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(700); w.scrollTo(0, 0);
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato";
    var g = d.querySelector(".sg-guardo"); if (!g) return "non c'è la targhetta";
    var rg = g.getBoundingClientRect();
    var cose = [].filter.call(d.querySelectorAll(sel), visibile);
    for (var i = 0; i < cose.length; i++) {
      var r = cose[i].getBoundingClientRect();
      if (r.bottom > alt + 1) return "«" + (cose[i].className || sel) + "» esce dallo schermo (" + Math.round(r.bottom) + ")";
      if (r.left < rg.right - 1 && rg.left < r.right - 1 && r.top < rg.bottom - 1 && rg.top < r.bottom - 1) return "la targhetta copre «" + (cose[i].className || cose[i].textContent.slice(0, 30)) + "» (" + Math.round(r.bottom) + " > " + Math.round(rg.top) + ")";
    }
    return "";
  }
  async function misureGuarda(w, nome, sel) {
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) { var e = await misuraGuarda(w, nome, M[k][0], M[k][1], sel); if (e) no(nome + " a " + M[k].join("x") + ": " + e); fatte.push(M[k].join("x")); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(300);
    return fatte.join(" e ");
  }
  // il 😂 della targhetta: la faccina arriva sul telefono di "a" col nome di chi guarda
  async function faccinaDa(w, nome, a) {
    var b = w.document.querySelector(".sg-guardo-fa"); if (!b) no(nome + ": la targhetta non ha il 😂");
    b.click();
    var fa = await W.aspetta(function () { return [].find.call(w.document.querySelectorAll(".sg-guardo-fila .sl-fa"), function (x) { return x.textContent === "👏"; }); }, 2000);
    if (!fa) no(nome + ": il 😂 non apre la fila delle faccine");
    fa.click();
    var wa = W.finestra(a);
    if (!await W.aspetta(function () { return [].some.call(wa.document.querySelectorAll(".sg-fa-volante"), function (x) { return /👏/.test(x.textContent) && x.textContent.indexOf(nome) >= 0; }); }, 4000))
      no(a + " non vede «👏 " + nome + "»");
    b.click();   // (si richiude)
  }
  // una mossa: dell'host (entra nella sua stanza col suo id, come i suoi tocchi) o di un amico (dal suo telefono)
  function manda(X, id, m) {
    if (id === "host") { var cb = X.P.__cbH[X.gid]; if (!cb) no("non trovo la stanza dell'host"); cb.onMsg("host", m); return; }
    var n = X.nomeDi[id]; if (!n) return;
    var h = W.reteDi(n); if (h) h.invia(m);
  }

  // ---- le partite a copione, fino alla fine (dal gruppo D del Passo 2) ----
  var MOSSE = {
    timeline: async function (X) {
      var C = X.C, fino = Date.now() + 240000, fatto = "";
      while (Date.now() < fino && !finita(vm(C))) {
        var v = vm(C), k = v.fase + "|" + v.n, chi = v.turnoId;
        if (k !== fatto && chi) {
          if (v.fase === "turno") { manda(X, chi, { t: "scelta", gap: 0 }); fatto = k; }
          else if (v.fase === "votazione") { (v.giocatori || []).forEach(function (g) { if (g.id !== chi) manda(X, g.id, { t: "voto", d: true }); }); fatto = k; }
          else if (v.fase === "esito") { manda(X, chi, { t: "avanti" }); fatto = k; }
        }
        if (X.ogni) await X.ogni(v);
        await W.dorme(300);
      }
    },
    taboo: async function (X) {
      var C = X.C, fino = Date.now() + 240000, fatto = "";
      while (Date.now() < fino && !finita(vm(C))) {
        var v = vm(C), k = v.fase + "|" + v.turno + "|" + v.attivo;
        if (X.ogni) await X.ogni(v);
        if (k !== fatto && v.attivo) {
          if (v.fase === "pronto" && !v.avviso && !v.pausa) { manda(X, v.attivo, { t: "pronto" }); fatto = k; }
          else if (v.fase === "turno" && v.carta) {
            manda(X, v.attivo, { t: "indovinata", chiave: v.chiaveCarta });
            fatto = k;
            await W.dorme(600);
            X.P.__salto += ((v.durata || 60) + 2) * 1000;   // il turno finisce adesso (solo l'orologio di Taboo dell'host)
          }
        }
        await W.dorme(300);
      }
    },
    ordine: async function (X) {
      var C = X.C, fino = Date.now() + 180000, fatto = "";
      while (Date.now() < fino && !finita(vm(C))) {
        var v = vm(C);
        if (X.ogni) await X.ogni(v);
        if (v.fase === "gioco" && !v.sospeso && !v.attesa) {
          var k = v.passo + "|" + v.turno + "|" + (v.storia || []).length, capo = v.capo[v.turno];
          if (k !== fatto && v.passo === "indizio" && capo) { manda(X, capo, { t: "indizio", parola: "ZIGOMAR", n: 1 }); fatto = k; }
          else if (k !== fatto && v.passo === "indovina" && X.P.__chiave) {
            var nera = X.P.__chiave.indexOf("x"), chi = (v.players || []).filter(function (p) { return p.team === v.turno && p.id !== capo && !p.via; })[0];
            if (nera >= 0 && chi) { manda(X, chi.id, { t: "gira", i: nera }); fatto = k; }
          }
        }
        await W.dorme(300);
      }
    },
    patata: async function (X) {
      var C = X.C, fino = Date.now() + 120000;
      while (Date.now() < fino && !finita(vm(C))) {
        if (X.ogni) await X.ogni(vm(C));
        if (vm(C).fase === "voto") W.clicca(X.P, /Via! ▶/);
        await W.dorme(400);
      }
    }
  };
  // la partita è davvero cominciata (non più in saletta né al voto della categoria)
  function inGioco(gid, v) {
    if (!v || !v.fase || v.fase === "lobby") return false;
    if (gid === "taboo") return v.fase === "turno" || v.fase === "pronto";
    if (gid === "patata") return v.fase === "voto" || v.fase === "gioco";
    return true;
  }

  // ---- Paky apre, gli amici entrano, si comincia ----
  async function apriPartita(gid) {
    var P = await tel("Paky", { x: 0 });
    spiaHost(P);
    var C = await W.apriStanza(P, NOMI[gid]);
    var X = { gid: gid, P: P, C: C, nomeDi: { host: "Paky" }, id: {}, amici: AMICI[gid] };
    for (var i = 0; i < X.amici.length; i++) {
      var n = X.amici[i];
      await tel(n, { hash: "gioco=" + gid + "&stanza=" + C, x: 150 * (i + 1) });
      var idN = await W.aspetta(function () { var x = A.mioId(n); return x && idsGioc(gid, vm(C)).indexOf(x) >= 0 ? x : null; }, 8000);
      if (!idN) no(n + " non entra nella partita (" + giocDi(gid, vm(C)).map(function (p) { return p.nome; }).join(",") + ")");
      X.id[n] = idN; X.nomeDi[idN] = n;
    }
    await W.dorme(600);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia|Continua ▶/); }, 8000)) no("Paky non trova «Comincia» («" + T(P).slice(0, 100) + "»)");
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 12000)) no("la partita non comincia");
    return X;
  }

  // ---- i segreti che chi guarda non deve vedere, gioco per gioco (v = la foto dell'host di adesso) ----
  function segreti(gid, X, w, nome, v) {
    if (gid === "taboo" && v.fase === "turno" && v.carta && v.carta.p) {
      var tx = T(w), parole = [v.carta.p].concat(v.carta.v || []);
      var vista = parole.filter(function (p) { return tx.indexOf(p) >= 0; });
      if (vista.length) no(nome + " guarda e vede la carta di Taboo: " + vista.join(", "));
      X.carteViste = (X.carteViste || 0) + 1;
    }
    if (gid === "ordine" && v.fase === "gioco") {
      if (w.document.querySelector(".or-carta.chiave")) no(nome + " guarda e vede la chiave del tabellone");
      X.tabViste = (X.tabViste || 0) + 1;
    }
    if (gid === "patata" && v.fase === "voto") {
      var vivi = [].filter.call(w.document.querySelectorAll(".pt-catbtn"), function (b) { return !b.disabled && visibile(b); });
      if (vivi.length) no(nome + " guarda e può votare la categoria (" + vivi.length + " tasti)");
      X.votiVisti = (X.votiVisti || 0) + 1;
    }
  }

  function scenario(gid) {
    return { nome: NOMI[gid] + ": chi guarda col link (guarda=1) fino alla fine, senza tasti né segreti, poi entra da solo", fai: async function () {
      var X = await apriPartita(gid), C = X.C, P = X.P;
      var B = await W.apriTel("Bea", { hash: "gioco=" + gid + "&stanza=" + C + "&guarda=1", x: 600, g5imp: true });
      if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo"); }, 8000)) no("Bea non ha la targhetta («" + T(B).slice(0, 100) + "»)");
      if (/Il tuo nome|Entra ▶/.test(T(B))) no("Bea vede la schermata del nome");
      if (!await W.aspetta(function () { return inGioco(gid, vm(C)) && !B.document.querySelector(".sl-av"); }, 12000)) no("la partita non arriva al gioco");
      await W.dorme(1500);
      var idB = A.mioId("Bea");
      if (!idB) no("Bea non ha un id");
      if (idsGioc(gid, vm(C)).indexOf(idB) >= 0) no("Bea (guarda) è tra i giocatori");
      controllaGuarda(gid, B, "Bea", "in partita");
      segreti(gid, X, B, "Bea", vm(C));
      await faccinaDa(B, "Bea", X.amici[0]);
      var mis = await misureGuarda(B, "Bea", BARRA[gid]);
      // durante la partita: ogni tanto i controlli di chi guarda (tasti, segreti)
      var giri = 0;
      X.ogni = async function (v) {
        if (++giri % 4) return;
        if (!B.document.querySelector(".sg-guardo")) return;
        controllaGuarda(gid, B, "Bea", "fase " + v.fase);
        segreti(gid, X, B, "Bea", vm(C));
      };
      await MOSSE[gid](X);
      X.ogni = null;
      if (!finita(vm(C))) no("la partita non finisce (fase " + vm(C).fase + ")");
      var FS = { timeline: ".tl-fine", taboo: ".tb-fine", ordine: ".or-stato", patata: ".pt-podio" }[gid];
      if (!await W.aspetta(function () { return B.document.querySelector(FS) && (gid !== "ordine" || /Vincono/.test(T(B))); }, 20000)) no("Bea non arriva alla fine («" + T(B).slice(-120) + "»)");
      await W.dorme(1500);
      controllaGuarda(gid, B, "Bea", "a fine partita");
      var mf = await misureGuarda(B, "Bea", gid === "taboo" ? ".tb-tasti > *" : (gid === "ordine" ? ".st-barra.on > *" : ".schermata .modulo-nota, .schermata .tl-nota-fine"));
      // dal telefono di Bea passano solo messaggi del core ("__"); all'host nessun messaggio per lei
      var altri = logDa("Bea", C).filter(function (l) { return !/"t":"__/.test(l); });
      if (altri.length) no("dal telefono di Bea passano messaggi del gioco: " + altri.slice(0, 2).join(" / "));
      var perLei = logDa("Paky", C).filter(function (l) { return l.indexOf('"to":"' + idB + '"') >= 0; });
      if (perLei.length) no("l'host manda messaggi per Bea: " + perLei.slice(0, 2).join(" / "));
      // la nuova partita: Bea entra da sola nella saletta
      if (!await W.aspetta(function () { return W.clicca(P, /Nuova partita|Rivincita/); }, 15000)) no("Paky non trova «Nuova partita» («" + T(P).slice(-120) + "»)");
      var dentro = await W.aspetta(function () { var v = vm(C); return v.fase === "lobby" && idsGioc(gid, v).indexOf(A.mioId("Bea")) >= 0; }, 6000);
      if (!dentro) no("alla nuova partita Bea non entra da sola (giocatori: " + giocDi(gid, vm(C)).map(function (p) { return p.nome; }).join(",") + ")");
      await W.dorme(800);
      if (B.document.querySelector(".sg-guardo")) no("nella saletta Bea ha ancora la targhetta");
      if (!W.finestra("Bea").document.querySelector(".sl-av")) no("Bea non è nella saletta («" + T(W.finestra("Bea")).slice(0, 100) + "»)");
      var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
      var visto = gid === "taboo" ? ", carte nascoste " + (X.carteViste || 0) + " volte" : gid === "ordine" ? ", tabellone senza chiave " + (X.tabViste || 0) + " volte" : gid === "patata" ? ", voto spento " + (X.votiVisti || 0) + " volte" : "";
      return "Bea guarda (una targhetta, niente uscite né tasti del gioco" + visto + ", 👏 a " + X.amici[0] + ", solo messaggi «__», misure " + mis + "; fine " + mf + ") e alla nuova partita è nella saletta";
    } };
  }
  GRUPPO.forEach(function (gid, k) { aggiungi(694 + k, scenario(gid)); });

  // 698. Parola d'ordine: chi arriva a metà entra subito nella squadra più piccola e gioca già da adesso (dal 22 ott 2026:
  //      ritardatari "subito"; prima la pillola diceva «dal prossimo turno», ma Marco poteva già giocare: c20)
  aggiungi(698, { nome: "Parola d'ordine: Marco arriva a partita cominciata → squadra più piccola e «🎉 Sei dentro! Giochi già da adesso»", fai: async function () {
    var X = await apriPartita("ordine"), C = X.C;
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    var conta = function (v) { var n = [0, 0, 0]; (v.players || []).forEach(function (p) { if (p.team >= 0) n[p.team]++; }); return n; };
    var prima = conta(vm(C));
    var M = await tel("Marco", { hash: "gioco=ordine&stanza=" + C, x: 600 }), visti = "";
    var ok = await W.aspetta(function () { var p = pill(M); if (/Sei dentro! Giochi già da adesso/.test(p)) visti = p; return visti; }, 10000, 100);
    if (!ok) no("Marco non legge «🎉 Sei dentro! Giochi già da adesso» (" + pill(M) + ")");
    var idM = A.mioId("Marco"), pm = (vm(C).players || []).filter(function (p) { return p.id === idM; })[0];
    if (!pm) no("Marco non è tra i giocatori");
    var piccola = prima.slice(0, vm(C).nsq || 2).indexOf(Math.min.apply(null, prima.slice(0, vm(C).nsq || 2)));
    if (pm.team !== piccola) no("Marco è nella squadra " + pm.team + " invece che nella più piccola (" + piccola + ", squadre " + prima.join("/") + ")");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Marco nella squadra " + pm.team + " (squadre prima " + prima.slice(0, 2).join("/") + "), pillola «" + visti + "»";
  } });

  // 699. Taboo: la saletta dell'host con le squadre (6 giocatori) sta in uno schermo
  aggiungi(699, { nome: "Taboo: la saletta dell'host con le squadre (6 giocatori) a 360x640 e 412x915 senza scorrere", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await W.apriStanza(P, "Taboo");
    var amici = ["Giulia", "Luca", "Sara", "Marco", "Bea"];
    for (var i = 0; i < amici.length; i++) await tel(amici[i], { hash: "gioco=taboo&stanza=" + C, x: 120 * (i + 1) });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 6; }, 12000)) no("non entrano in 6 (" + (vm(C).giocatori || []).length + ")");
    await W.dorme(1200);
    var d = P.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{animation:none!important} .sl-av,.sl-nome{transition:none!important}"; d.head.appendChild(st); }
    var f = document.getElementById("tel-Paky"), M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) {
      f.style.width = M[k][0] + "px"; f.style.height = M[k][1] + "px"; void d.documentElement.offsetHeight; P.dispatchEvent(new P.Event("resize"));
      await W.dorme(700); P.scrollTo(0, 0);
      var sc = d.scrollingElement || d.documentElement, alto = Math.max(sc.scrollHeight, d.body.scrollHeight);
      [].forEach.call(d.querySelectorAll(".schermata, .schermata *"), function (x) { if (x.scrollHeight > x.clientHeight + 2 && /auto|scroll/.test(P.getComputedStyle(x).overflowY)) alto = Math.max(alto, M[k][1] + (x.scrollHeight - x.clientHeight)); });
      if (alto > M[k][1] + 1) no("a " + M[k].join("x") + " la saletta di Taboo scorre (" + alto + " px)");
      var com = [].find.call(d.querySelectorAll("button"), function (b) { return /Comincia/.test(b.textContent); });
      if (!com || com.getBoundingClientRect().bottom > M[k][1] + 1) no("a " + M[k].join("x") + " «Comincia» non si vede");
      if (!d.querySelector(".tb-squadre, .tb-sq, .tb-squadra")) { /* (il riquadro delle squadre ha i suoi nomi di classe) */ }
      fatte.push(M[k].join("x"));
    }
    f.style.width = "360px"; f.style.height = "740px"; P.dispatchEvent(new P.Event("resize"));
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "saletta con 6 e le squadre: " + fatte.join(" e ") + " senza scorrere";
  } });

  COPIONE.gruppo6g5 = async function () { var out = []; for (var n = 694; n <= 699; n++) out.push(await COPIONE.prova(n)); return out; };
})();
