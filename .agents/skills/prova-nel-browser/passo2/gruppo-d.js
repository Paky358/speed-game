// PROVE DEL PASSO 2, GRUPPO D (parole e quiz): Linea del tempo, Nomi Cose e Città, Balla Colossale, Taboo, Parola d'ordine,
// Patata Bollente. Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/gruppo-d.js"); await COPIONE.prova(231)
//
// 231-236 (aggiornati da p2-z: la fine è quella del core e «↻ Rivincita» riparte con gli stessi), uno per gioco. Sala (salaSempre): Paky apre il gioco dalla tessera
//   ("Online con gli amici"), gli amici arrivano dal link della Sala. Nel telefono di Paky "gioca solo chi è scelto" è finto
//   (w.__scelti): Giulia entra per prima ma GUARDA (nella saletta "👀 Questa volta guardi", fuori dai giocatori), gli altri giocano.
//   Telefoni: 3 (Paky, Giulia, Luca); Balla 4 (ne servono 3 a giocare); Taboo e Parola d'ordine 5 (4 giocano, Giulia guarda).
//   1ª partita fino alla fine: col contratto neutro la fine è quella di sempre (host "Nuova partita", gli altri senza).
//   Poi la "Nuova partita" di sempre → saletta con gli stessi → 2ª partita coi tasti di fine del core FINTI (w.__tfFinto):
//   i giochi li mettono al posto dei loro (all'host e a chi ha giocato, non a chi guarda) e "↻" (o.nuova) riporta tutti
//   nella saletta. Taboo: anche le misure della saletta dell'host (360x640 e 412x915).
// 231f-236f (DOPO p2-f, le fa girare p2-z): la fine vera del core: Paky "↻ Rivincita" e "🎮 Cambia gioco", Luca "👍 Ci sto!"
//   e "🏠 Torna in Sala"; Ci sto → "👍 1"; Rivincita → si gioca senza altri tocchi (3-2-1); "Cambia gioco" porta tutti in Sala.
// 237: le impostazioni dei 6 giochi col box fuori dalla pagina (come le prepara la Sala); postiOnline e riassunto.
// Le mosse: quelle degli amici partono dai loro telefoni (reteDi(nome).invia), quelle dell'host entrano dalla sua stanza
// come se le mandasse lui (id "host": come i suoi tocchi). Regole accorciate per la prova (w.__imp): Linea del tempo 1 carta,
// Nomi Cose e Città e Balla 1 giro, Patata 10 secondi; Taboo: l'orologio di Taboo sul telefono dell'host va avanti di un
// turno (w.__salto, solo per taboo.js), così un turno dura un attimo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var GRUPPO = ["timeline", "nomicose", "balla", "taboo", "ordine", "patata"];
  var NOMI = { timeline: "La linea del tempo", nomicose: "Nomi, Cose e Città", balla: "La Balla Colossale", taboo: "Taboo", ordine: "Parola d'ordine", patata: "La Patata Bollente" };
  var FILE = { nomicose: "nomicoseecitta" };
  var IMP = { timeline: { carte: 1 }, nomicose: { round: 1 }, balla: { round: 1 }, taboo: { tempo: 60, giri: 1 }, patata: { tempo: 10 } };
  var AMICI = { timeline: ["Luca"], nomicose: ["Luca"], balla: ["Luca", "Sara"], taboo: ["Luca", "Sara", "Marco"], ordine: ["Luca", "Sara", "Marco"], patata: ["Luca"] };

  // ---- la "spia" dei giochi del gruppo D (solo con apriTel(nome, { fintiD: true })) ----
  // w.__tfFinto = true: t.tastiFine disegna tasti finti; w.__scelti = ["Paky", …]: si siede solo chi è in lista;
  // w.__imp = { … }: regole cambiate per la prova (solo l'host le legge)
  if (!W.__prepGruppoD) {
    W.__prepGruppoD = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepGruppoD(w, nome, opz);
      if (!opz || !opz.fintiD) return;
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
      w.__t = t;
      return avvia.apply(this, arguments);
    };
  }
  // l'host: le sue stanze (per mandare le sue mosse come se toccasse lui) e le chiavi di Parola d'ordine mandate ai capi
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
    // Taboo: l'orologio di taboo.js (e solo quello) va avanti di w.__salto millisecondi
    var ora = w.Date.now.bind(w.Date); w.__salto = 0;
    w.Date.now = function () { if (w.__salto && /taboo\.js/.test(new Error().stack || "")) return ora() + w.__salto; return ora(); };
  }

  // ---- aiuti ----
  function tf(w) { return w.document.querySelector(".tf-finto"); }
  function giocDi(gid, v) { return (v && (gid === "timeline" || gid === "taboo" ? v.giocatori : v.players)) || []; }
  function idsGioc(gid, v) { return giocDi(gid, v).map(function (p) { return p.id; }); }
  function guardaDi(gid, v) { return gid === "patata" ? ((v && v.fuori) || []).map(function (a) { return a.id; }) : ((v && v.guarda) || []); }
  function finita(gid, v) { return !!v && v.fase === "fine"; }
  function inSaletta(gid, v) { return !!v && v.fase === "lobby"; }
  var RIV = /Nuova partita/;
  function bottoni(w, re) { return [].filter.call(w.document.querySelectorAll("button"), function (b) { return re.test(b.textContent) && !b.closest(".tf-finto"); }); }
  // un tocco col dito (pointerdown + pointerup) e il click
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  // una mossa: dell'host (entra nella sua stanza col suo id, come i suoi tocchi) o di un amico (dal suo telefono)
  function manda(X, id, m) {
    if (id === "host") { var cb = X.P.__cbH[X.gid]; if (!cb) no("non trovo la stanza dell'host"); cb.onMsg("host", m); return; }
    var n = X.nomeDi[id]; if (!n) return;
    var h = W.reteDi(n); if (h) h.invia(m);
  }

  // la Sala con Paky, Giulia (guarda) e gli amici che giocano
  async function salaD(gid) {
    var amici = AMICI[gid], scelti = ["Paky"].concat(amici);
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, fintiD: true, prima: function (w) { w.__scelti = scelti; w.__imp = IMP[gid] || null; } });
    spiaHost(P);
    var X0 = await A.salaDaGioco("Paky", NOMI[gid]), S = X0.S, C = X0.C;
    var X = { gid: gid, P: P, S: S, C: C, amici: amici, tel: {}, nomeDi: { host: "Paky" }, id: {} };
    X.G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true, fintiD: true });
    var idG = await W.aspetta(function () { var i = A.mioId("Giulia"); return i && guardaDi(gid, vm(C)).indexOf(i) >= 0 ? i : null; }, 8000);
    if (!idG) no("Giulia (non scelta) non è tra chi guarda (guarda: " + JSON.stringify(guardaDi(gid, vm(C))) + ", giocatori: " + idsGioc(gid, vm(C)).join(",") + ")");
    if (idsGioc(gid, vm(C)).indexOf(idG) >= 0) no("Giulia (non scelta) è tra i giocatori");
    if (!await W.aspetta(function () { return /Questa volta guardi/.test(T(X.G)); }, 4000)) no("nella saletta Giulia non legge «👀 Questa volta guardi» («" + T(X.G).slice(0, 100) + "»)");
    X.idG = idG; X.nomeDi[idG] = "Giulia";
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i];
      X.tel[n] = await W.apriTel(n, { hash: "sala=" + S, x: 185 * (i + 2), salaSempre: true, fintiD: true });
      var idN = await W.aspetta(function () { var x = A.mioId(n); return x && idsGioc(gid, vm(C)).indexOf(x) >= 0 ? x : null; }, 8000);
      if (!idN) no(n + " (scelto) non entra tra i giocatori (" + giocDi(gid, vm(C)).map(function (p) { return p.nome; }).join(",") + ")");
      X.id[n] = idN; X.nomeDi[idN] = n;
    }
    X.L = X.tel[amici[0]];
    return X;
  }
  async function comincia(X) {
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia|Via ▶|Continua ▶/); }, 8000)) no("Paky non trova «Comincia» («" + T(X.P).slice(0, 100) + "»)");
    if (!await W.aspetta(function () { return !inSaletta(X.gid, vm(X.C)); }, 6000)) no("la partita non comincia");
  }

  // ---- le partite a copione, fino alla fine ----
  var MOSSE = {
    timeline: async function (X) {
      var C = X.C, fino = Date.now() + 300000, fatto = "";
      while (Date.now() < fino && !finita("timeline", vm(C))) {
        var v = vm(C), k = v.fase + "|" + v.n, chi = v.turnoId;
        if (k !== fatto && chi) {
          if (v.fase === "turno") { manda(X, chi, { t: "scelta", gap: 0 }); fatto = k; }
          else if (v.fase === "votazione") { (v.giocatori || []).forEach(function (g) { if (g.id !== chi) manda(X, g.id, { t: "voto", d: true }); }); fatto = k; }
          else if (v.fase === "esito") { manda(X, chi, { t: "avanti" }); fatto = k; }
        }
        await W.dorme(300);
      }
    },
    nomicose: async function (X) {
      var C = X.C, fino = Date.now() + 240000, fatti = {};
      while (Date.now() < fino && !finita("nomicose", vm(C))) {
        var v = vm(C);
        (v.players || []).forEach(function (p) {
          if (p.via) return;
          var k = v.fase + "|" + v.giro + "|" + v.ci + "|" + p.id;
          if (fatti[k]) return;
          if (v.fase === "scrittura" && (v.fatti || []).indexOf(p.id) < 0) { manda(X, p.id, { t: "risposte", r: [] }); fatti[k] = 1; }
          if (v.fase === "tabellone" && (v.pronti || []).indexOf(p.id) < 0) { manda(X, p.id, { t: "pronto", ci: v.ci }); fatti[k] = 1; }
        });
        await W.dorme(400);
      }
    },
    balla: async function (X) {
      var C = X.C, fino = Date.now() + 300000, fatti = {}, prova = {};
      while (Date.now() < fino && !finita("balla", vm(C))) {
        var v = vm(C);
        (v.players || []).forEach(function (p, i) {
          if (p.via || (v.fatti || []).indexOf(p.id) >= 0) return;
          if (v.fase === "scrittura") { var k = "s|" + v.giro + "|" + p.id; if (!fatti[k]) { fatti[k] = 1; manda(X, p.id, { t: "balla", testo: "una balla inventata da " + p.nome }); } }
          if (v.fase === "voto" && v.scelte && v.scelte.length) { prova[p.id] = (prova[p.id] || 0) + 1; manda(X, p.id, { t: "voto", k: prova[p.id] % v.scelte.length }); }
        });
        await W.dorme(500);
      }
    },
    taboo: async function (X) {
      var C = X.C, fino = Date.now() + 240000, fatto = "";
      while (Date.now() < fino && !finita("taboo", vm(C))) {
        var v = vm(C), k = v.fase + "|" + v.turno + "|" + v.attivo;
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
      while (Date.now() < fino && !finita("ordine", vm(C))) {
        var v = vm(C);
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
      while (Date.now() < fino && !finita("patata", vm(C))) {
        if (vm(C).fase === "voto") W.clicca(X.P, /Via! ▶/);
        await W.dorme(400);
      }
    }
  };

  // la fine di sempre (contratto neutro): l'host ha la sua "Nuova partita", gli altri no; niente tasti finti
  function fineOggi(X) {
    if (!bottoni(X.P, RIV).length) no("a fine partita Paky non ha «Nuova partita» («" + T(X.P).slice(-140) + "»)");
    X.amici.concat(["Giulia"]).forEach(function (n) { if (bottoni(W.finestra(n), RIV).length) no(n + " ha il tasto «Nuova partita» dell'host"); });
    ["Paky", "Giulia"].concat(X.amici).forEach(function (n) { if (tf(W.finestra(n))) no(n + ": tasti finti senza averli chiesti"); });
    if (!/guardato|Hai guardato/.test(T(X.G))) no("a fine partita Giulia (ha guardato) non legge «Questa volta hai guardato» («" + T(X.G).slice(-140) + "»)");
  }
  async function finePartita(X, cosa) {
    await MOSSE[X.gid](X);
    if (!finita(X.gid, vm(X.C))) no("la " + cosa + " partita non finisce (fase " + vm(X.C).fase + ")");
  }

  function scenario(gid) {
    return { nome: NOMI[gid] + " nella Sala (gruppo D): chi non è scelto guarda, tasti di fine del core, Rivincita con gli stessi", fai: async function () {
      var X = await salaD(gid), C = X.C, note = [];
      // Taboo: la saletta dell'host (con le squadre) sta in uno schermo
      if (gid === "taboo") {
        for (var q = 0; q < 2; q++) {
          var M = [[360, 640], [412, 915]][q];
          // (con la finestra nascosta la stanza si rimette a misura solo quando la saletta si aggiorna: l'host sposta
          //  Luca nell'altra squadra e lo rimette dov'era, poi si misura)
          ["Paky", X.amici[0]].forEach(function (n) { var f = document.getElementById("tel-" + n); f.style.width = M[0] + "px"; f.style.height = M[1] + "px"; W.finestra(n).dispatchEvent(new (W.finestra(n).Event)("resize")); });
          await W.dorme(300);
          for (var z = 0; z < 2; z++) {
            var bL = [].find.call(X.P.document.querySelectorAll(".tb-scelta"), function (b) { return b.textContent === X.amici[0]; });
            if (!bL) no("nella saletta di Taboo l'host non ha il nome di " + X.amici[0] + " nelle squadre");
            bL.click(); await W.dorme(500);
          }
          var e1 = await A.controllaSchermo(X.P, "Paky", M[0], M[1], 4); if (e1) no("saletta di Taboo dell'host a " + M[0] + "x" + M[1] + ": " + e1);
          var e2 = await A.controllaSchermo(X.L, X.amici[0], M[0], M[1], 4); if (e2) no("saletta di Taboo di " + X.amici[0] + " a " + M[0] + "x" + M[1] + ": " + e2);
        }
        ["Paky", X.amici[0]].forEach(function (n) { var f = document.getElementById("tel-" + n); f.style.width = "360px"; f.style.height = "740px"; W.finestra(n).dispatchEvent(new (W.finestra(n).Event)("resize")); });
        note.push("saletta in uno schermo (360x640, 412x915)");
      }
      // (p2-z, 15 ott) dopo p2-f la fine nella Sala è quella del core: a chi ha giocato «↻ Rivincita»/«👍 Ci sto!», a Giulia
      // (ha guardato) niente; i tasti stanno fermi; «↻ Rivincita» riparte con gli stessi e Giulia guarda ancora
      var fineC = function (w) { return w.document.querySelector(".fine-tasti"); };
      await comincia(X);
      await finePartita(X, "1ª");
      var giocano = ["Paky"].concat(X.amici);
      if (!await W.aspetta(function () { return giocano.every(function (n) { return fineC(W.finestra(n)); }); }, 40000))
        no("a fine partita i tasti del core non ci sono (" + giocano.map(function (n) { return n + " " + !!fineC(W.finestra(n)); }).join(", ") + ")");
      await W.dorme(800);
      if (!/Rivincita/.test(fineC(X.P).textContent)) no("Paky non ha «↻ Rivincita» («" + fineC(X.P).textContent + "»)");
      if (bottoni(X.P, RIV).filter(function (b) { return !b.closest(".fine-tasti"); }).length) no("Paky ha i tasti del core e anche la sua «Nuova partita»");
      X.amici.forEach(function (n) { if (!/Ci sto/.test(fineC(W.finestra(n)).textContent)) no(n + " non ha «👍 Ci sto!»"); if (/Aspetta l'host/.test(T(W.finestra(n)))) no(n + " ha i tasti del core e anche «Aspetta l'host»"); });
      if (/Ci sto/.test(T(X.G))) no("Giulia (ha guardato) ha «Ci sto»");
      var nodo = fineC(X.P);
      await W.dorme(1500);
      if (fineC(X.P) !== nodo) no("i tasti di fine si ridisegnano da soli");
      note.push("1ª: tasti del core a chi ha giocato, non a Giulia");
      var ids0 = ["host"].concat(X.amici.map(function (n) { return X.id[n]; }));
      X.amici.forEach(function (n) { W.clicca(W.finestra(n), /Ci sto/); });
      W.clicca(X.P, /Rivincita/, ".fine-tasti button");
      if (!await W.aspetta(function () { var v = vm(C); return v.fase && !finita(gid, v); }, 12000)) no("dopo «↻ Rivincita» non si riparte (fase " + vm(C).fase + ")");
      await W.dorme(500);
      if (!ids0.every(function (i) { return idsGioc(gid, vm(C)).indexOf(i) >= 0; })) no("nella rivincita mancano dei giocatori (" + idsGioc(gid, vm(C)).join(",") + ")");
      if (idsGioc(gid, vm(C)).indexOf(X.idG) >= 0) no("nella rivincita Giulia gioca (doveva guardare)");
      note.push("↻ Rivincita → gli stessi, Giulia guarda ancora");
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
      return note.join("; ");
    } };
  }

  // ---- DOPO p2-f (le fa girare p2-z): la fine vera del core ----
  function scenarioF(gid) {
    return { nome: "(dopo p2-f) " + NOMI[gid] + " nella Sala: Ci sto, Rivincita col 3-2-1, Cambia gioco", fai: async function () {
      var X = await salaD(gid), C = X.C;
      await comincia(X);
      await finePartita(X, "1ª");
      if (!await W.aspetta(function () { return X.P.document.querySelector(".fine-tasti"); }, 40000)) no("serve p2-f: a fine partita il core non disegna i tasti («" + T(X.P).slice(-80) + "»)");
      await W.aspetta(function () { return X.L.document.querySelector(".fine-tasti") && /Ci sto/.test(T(X.L)); }, 15000);   // (la fine degli amici arriva dopo lo show)
      if (!/Rivincita/.test(T(X.P)) || !/Cambia gioco/.test(T(X.P))) no("Paky non ha «↻ Rivincita» e «🎮 Cambia gioco» («" + T(X.P).slice(-120) + "»)");
      if (!/Ci sto/.test(T(X.L)) || !/Torna in Sala/.test(T(X.L))) no(X.amici[0] + " non ha «👍 Ci sto!» e «🏠 Torna in Sala» («" + T(X.L).slice(-120) + "»)");
      if (/Ci sto/.test(T(X.G))) no("Giulia (guarda) ha «Ci sto»");
      W.clicca(X.L, /Ci sto/);
      if (!await W.aspetta(function () { return /Rivincita · 👍 1/.test(T(X.P)); }, 4000)) no("sul tasto di Paky non compare «👍 1»");
      W.clicca(X.P, /Rivincita/);
      var t0 = Date.now();
      if (!await W.aspetta(function () { var v = vm(C); return v.fase && !inSaletta(gid, v) && !finita(gid, v); }, 12000)) no("dopo «Rivincita» la partita non riparte da sola col 3-2-1");
      var dt = ((Date.now() - t0) / 1000).toFixed(1);
      await finePartita(X, "2ª");
      if (!await W.aspetta(function () { return W.clicca(X.P, /Cambia gioco/); }, 40000)) no("alla 2ª fine Paky non trova «Cambia gioco»");
      var inSala = function (w) { return /Sala/.test(W.testo(w)) && w.document.querySelector(".saletta-schermo, .tessera"); };
      if (!await W.aspetta(function () { return !vm(X.S).gioco && inSala(X.L) && inSala(X.G); }, 6000)) no("«Cambia gioco» non porta tutti nella Sala");
      return "Ci sto → 👍 1; Rivincita → si gioca in " + dt + " s senza altri tocchi; Cambia gioco → tutti nella Sala";
    } };
  }

  GRUPPO.forEach(function (gid, k) {
    COPIONE.aggiungi(231 + k, scenario(gid));
    COPIONE.aggiungi((231 + k) + "f", scenarioF(gid));
  });

  // 237. Le impostazioni dei 6 giochi con il box fuori dalla pagina (come le prepara la Sala): niente errori, le scelte ci sono
  COPIONE.aggiungi(237, { nome: "Impostazioni del gruppo D col box fuori dalla pagina, posti online e riassunto", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
    var presi = {}, reg = P.SG.registra;
    // (i giochi sono già registrati: si ricaricano i loro file in questa finestra per avere gli oggetti)
    P.SG.registra = function (g) { presi[g.id] = g; };
    for (var i = 0; i < GRUPPO.length; i++) { var src = await (await fetch("/js/games/" + (FILE[GRUPPO[i]] || GRUPPO[i]) + ".js?" + Date.now())).text(); P.eval(src); }
    P.SG.registra = reg;
    var POSTI = { timeline: 10, nomicose: 10, balla: 8, taboo: 16, ordine: 12, patata: 10 };
    var aiuti = [{ sala: true, modo: "online" }, { modo: "online" }, { modo: "telefono" }, { torneo: true }], esiti = [];
    GRUPPO.forEach(function (id) {
      var g = presi[id]; if (!g) no("non trovo " + id);
      if (g.postiOnline !== POSTI[id]) no(id + ": postiOnline " + g.postiOnline + " invece di " + POSTI[id]);
      aiuti.forEach(function (a) {
        var box = P.document.createElement("div"), imp = {};
        try { g.impostazioni(box, imp, Object.assign({ el: elDi(P), giocatori: ["Paky", "Giulia"] }, a)); }
        catch (e) { no(id + " (" + JSON.stringify(a) + "): " + e.message); }
        if (!box.children.length) no(id + " (" + JSON.stringify(a) + "): il box è vuoto");
        if (g.riassunto) { var rs = g.riassunto(imp); if (typeof rs !== "string" || !rs) no(id + ": riassunto vuoto"); }
      });
      esiti.push(id + " " + g.postiOnline + (g.riassunto ? " («" + g.riassunto({}) + "»)" : ""));
    });
    var rt = presi.timeline.riassunto({ carte: 5, categorie: ["storia", "cinema"] });
    if (!/^5 carte a testa · /.test(rt)) no("riassunto della Linea del tempo strano: «" + rt + "»");
    return "impostazioni fuori pagina senza errori; posti: " + esiti.join(", ") + "; timeline con 2 categorie: «" + rt + "»";
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

  // le prove di questo file in fila: await COPIONE.gruppoD()          (231-237)
  //                                  await COPIONE.gruppoD(true)      (anche 231f-236f: dopo p2-f)
  COPIONE.gruppoD = async function (tutte) {
    var r = [];
    for (var k = 0; k < GRUPPO.length; k++) {
      r.push(await COPIONE.prova(231 + k));
      if (tutte) r.push(await COPIONE.prova((231 + k) + "f"));
    }
    r.push(await COPIONE.prova(237));
    return r;
  };
})();
