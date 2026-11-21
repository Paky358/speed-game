// 📸 LA LINEA DEL TEMPO FOTOGRAFATA (21 nov 2026, caccia ai difetti chiesta dal Cervello). Si carica dopo preferiti/timeline.js.
// Con lo strumento delle foto (prezzo/difetti/foto.js) W.scatta fa la foto; con prova.js non fa niente (le scene restano prove).
// lfo: una partita online intera nella Sala, fotografata. W.__pfOpz = { nome: "o2", amici: ["Giulia"], misure: { Paky: [360, 640] },
//      foto: ["Paky", "Giulia"], guarda: "Bea" (entra a guardare al turno 2), tardi: "Mario" (arriva col link al turno 3),
//      regole: { gara: "turno" | "insieme", linee: true, vinci: 5, meno: 2 (tocchi su − delle carte), ruba: /…/, epoca: /…/ },
//      giusto: 0.6 (quante volte si mette giusta), ruba: 0.4 (quante volte si prova a rubare), ritardi: { Paky: 3000 }, ms, extraEsito: 3 }
// lfs: la stessa cosa sullo stesso telefono. W.__pfOpz = { nome, nomi: ["Paky", "Giulia"], misura: [360, 640], regole: {…}, … }
// Le foto: ogni telefono di «foto» a ogni momento nuovo (dopo 0,9 s) e nei risultati anche 3,6 s dopo. Il diario (W.__pfLog):
// per ogni foto il momento, la barra in basso, il testo dello schermo e i guai trovati da soli (pagina che scorre, tasti fuori).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, vm = A.vm;
  if (!W.scatta) W.scatta = async function () {};
  if (!W.misuraTel) W.misuraTel = function (nome, L, Al, x) {
    var f = document.getElementById("tel-" + nome); if (!f) return;
    f.style.transform = "none"; f.style.width = L + "px"; f.style.height = Al + "px"; f.style.left = (x || 0) + "px"; f.style.top = "0px";
    try { f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); } catch (e) {}
  };
  function log(s) { try { console.log("[pf] " + s); } catch (e) {} }
  // il caso sempre uguale (così le partite si rifanno uguali)
  var seme = 12345; function caso() { seme = (seme * 16807) % 2147483647; return (seme - 1) / 2147483646; }

  function annoDi(w, tit) {
    var cats = w.SG_CATEGORIE || [];
    for (var i = 0; i < cats.length; i++) for (var j = 0; j < (cats[i].eventi || []).length; j++) if (cats[i].eventi[j].titolo === tit) return cats[i].eventi[j].anno;
    return null;
  }
  function vis(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function tasto(w, re, dove) { return [].filter.call(w.document.querySelectorAll((dove || ".st-barra.on") + " button"), function (b) { return re.test(b.textContent) && !b.disabled && vis(b); })[0] || null; }
  // i posti della linea che si vede: per ognuno se è giusto per l'anno Y (con le carte della linea, la carta per prova esclusa)
  function posti(w, Y) {
    var asse = w.document.querySelector(".st-sch-in .tl-asse"); if (!asse) return [];
    var figli = [].slice.call(asse.children), anni = [], out = [];
    figli.forEach(function (c) { if (c.classList.contains("tl-ev") && !c.classList.contains("tent")) { var s = c.querySelector(".tit span:last-child") || c.querySelector(".tit"); anni.push(s ? annoDi(w, s.textContent) : null); } });
    var prima = 0;
    figli.forEach(function (c) {
      if (c.classList.contains("tl-ev") && !c.classList.contains("tent")) { prima++; return; }
      if (!c.classList.contains("tl-slot")) return;
      var a = prima > 0 ? anni[prima - 1] : null, b = prima < anni.length ? anni[prima] : null;
      out.push({ el: c, ok: Y == null || ((a == null || a <= Y) && (b == null || Y <= b)) });
    });
    return out;
  }
  function titoloMano(w) { var t = w.document.querySelector(".st-sch-in .tl-mano .tit"); return t ? t.textContent : ""; }

  // il giocatore automatico di un telefono: fa UNA cosa (se c'è da fare), come col dito. Torna cosa ha fatto o ""
  var FATTO = {};
  async function agisci(nome, o) {
    var w = W.finestra(nome); if (!w || !w.document) return "";
    var d = w.document;
    // sullo stesso telefono: il telefono passa di mano
    var b = tasto(w, /tocca a me|📱 Sono /i, "body");
    if (b) { b.click(); return "tocca a me"; }
    // ✋ rubare sullo stesso telefono, tutti insieme: nessuno ruba (o uno prova), poi avanti
    var nr = tasto(w, /Nessuno la ruba/);
    if (nr) { nr.click(); return "nessuno ruba"; }
    // ✋ Rubala / 👍 Passo
    var passo = tasto(w, /👍 Passo/);
    if (passo) {
      var kR = nome + "|r|" + titoloMano(w) + "|" + d.querySelectorAll(".st-sch-in .tl-slot").length + "|" + (o.C ? (vm(o.C) || {}).n : T(w).replace(/\d+/g, "").slice(0, 140));
      if (FATTO[kR]) return ""; FATTO[kR] = 1;
      if (caso() < (o.ruba != null ? o.ruba : 0.4)) {
        var tit = (d.querySelector(".st-sch-in .tl-asse > .tl-ev.tent .tit span:last-child") || d.querySelector(".st-sch-in .tl-asse > .tl-ev.tent .tit") || {}).textContent;
        var Y = tit ? annoDi(w, tit) : null, pp = posti(w, Y), giusti = pp.filter(function (p) { return p.ok; }), sb = pp.filter(function (p) { return !p.ok; });
        var scelto = (caso() < 0.6 && giusti.length ? giusti : sb.length ? sb : giusti)[0];
        if (scelto) { scelto.el.click(); await W.dorme(300); var rb = tasto(w, /Rubala: va qui/); if (rb) { rb.click(); return "ruba " + (scelto.ok ? "giusto" : "sbagliato"); } }
      }
      passo.click(); return "passo";
    }
    // mettere la carta: un posto (giusto o sbagliato) e «Mettila qui»
    var conf = d.querySelector(".tl-conferma"), sl = d.querySelectorAll(".st-sch-in .tl-slot");
    if (conf && sl.length && vis(sl[0])) {
      var tm = titoloMano(w), k = nome + "|m|" + tm + "|" + sl.length + "|" + (o.C ? (vm(o.C) || {}).n : T(w).replace(/\d+/g, "").slice(0, 140));
      if (FATTO[k]) { if (!conf.disabled && vis(conf)) { conf.click(); return "conferma"; } return ""; }
      FATTO[k] = 1;
      var Y2 = annoDi(w, tm), pp2 = posti(w, Y2), g2 = pp2.filter(function (p) { return p.ok; }), s2 = pp2.filter(function (p) { return !p.ok; });
      var vuole = caso() < (o.giusto != null ? o.giusto : 0.6), sc = (vuole && g2.length ? g2 : s2.length ? s2 : g2);
      var p2 = sc[Math.floor(caso() * sc.length)] || pp2[0];
      if (!p2) return "";
      p2.el.click(); await W.dorme(350);
      if (o.anno && caso() < o.anno) { var inp = d.querySelector(".st-barra .tl-anno .v"); if (inp && Y2 != null) { inp.focus(); inp.value = String(Y2 + (caso() < 0.5 ? 0 : 3)); inp.dispatchEvent(new w.Event("input")); inp.blur(); await W.dorme(200); } }
      var c2 = d.querySelector(".tl-conferma"); if (c2 && !c2.disabled) c2.click();
      return "mette " + (p2.ok ? "giusto" : "sbagliato");
    }
    return "";
  }
  W.TLagisci = agisci;

  function testoBarra(w) { var b = w.document.querySelector(".st-barra.on"); return b ? b.innerText.replace(/\s+/g, " ").trim().slice(0, 140) : ""; }
  // i guai che si vedono da soli: pagina che scorre, tasti fuori dallo schermo, scritte tagliate
  function guaiDi(w) {
    var d = w.document, L = w.innerWidth, H = w.innerHeight, g = [];
    if (d.documentElement.scrollHeight > H + 1) g.push("la pagina scorre (" + d.documentElement.scrollHeight + " su " + H + ")");
    if (d.documentElement.scrollWidth > L + 1) g.push("la pagina scorre di lato");
    [].forEach.call(d.querySelectorAll("button"), function (b) {
      var r = b.getBoundingClientRect(); if (!r.width || b.closest(".tl-spia .gr, .stp-riga, .tl-hud, .tl-scroll, .st-barra:not(.on)")) return;   // (la linea scorre; la barra spenta sta sotto apposta)
      if (r.bottom > H + 1 || r.right > L + 1 || r.left < -1) g.push("tasto «" + b.textContent.trim().slice(0, 30) + "» fuori dallo schermo");
    });
    [].forEach.call(d.querySelectorAll(".st-sch-in .tl-mano .tit, .st-sch-in .tl-esito *, .st-barra.on .tit, .st-barra.on p"), function (e) {
      if (e.children.length) return;
      if (e.scrollWidth > e.clientWidth + 2 && w.getComputedStyle(e).overflow === "hidden") g.push("scritta tagliata «" + e.textContent.trim().slice(0, 30) + "»");
    });
    return g;
  }

  async function regoleTL(P, r) {
    if (!r) return;
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 5000)) no("non trovo ⚙️ Regole");
    await W.dorme(400);
    var f = P.document.querySelector(".sl-foglio"); if (!f) no("il foglio delle regole non si apre");
    if (r.foto) await r.foto(f);
    function chip(re) { if (typeof re === "string") re = new RegExp(re.replace(/^__/, "")); var b = [].find.call(f.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent) && vis(x); }); if (!b) no("nel ⚙️ non trovo " + re); b.click(); }
    if (r.linee) chip(/Ognuno la sua linea/);
    if (r.gara === "insieme") chip(/Tutti insieme/); else if (r.gara === "turno") chip(/^🎯?\s*A turno/);
    if (r.ruba) chip(r.ruba);
    if (r.epoca) chip(r.epoca);
    await W.dorme(150);
    if (r.vinci) { var sl = f.querySelector(".tl-vinci .sl"); if (sl) { sl.value = String(r.vinci); sl.dispatchEvent(new P.Event("input", { bubbles: true })); } }
    for (var i = 0; i < (r.meno || 0); i++) { var m = [].find.call(f.querySelectorAll(".stepper button"), vis); if (m) m.click(); await W.dorme(60); }
    if (r.dopo) await r.dopo(f);
    W.clicca(P, /Fatto/, ".sl-foglio button"); await W.dorme(500);
  }

  // ===================== lfo: la partita online intera, fotografata =====================
  COPIONE.aggiungi("lfo", { nome: "Foto: la Linea del tempo online", fai: async function () {
    var o = W.__pfOpz || {}, nomeRun = o.nome || "o", amici = o.amici || ["Giulia"], misure = o.misure || { Paky: [360, 640] };
    var fotoDi = o.foto || Object.keys(misure), rit = Object.assign({ Paky: 2500, Giulia: 4000, Luca: 3000, Sara: 5000, Gina: 3500, Ugo: 2000, Tea: 4500, Mario: 3000, Bea: 3000 }, o.ritardi || {});
    seme = o.seme || 12345; W.__pfLog = [];
    var xFoto = 1150, nf = 0, t0 = Date.now();
    function metti(nome) { var m = misure[nome]; if (!m) return; W.misuraTel(nome, m[0], m[1], xFoto); xFoto += m[0] + 20; }
    var Z = await A.salaConAmici(amici);
    var C = await A.lanciaDallaSala("Paky", Z.S, "La linea del tempo"), P = W.finestra("Paky");
    o.C = C;
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === amici.length + 1; }, 15000)) no("nella saletta non arrivano tutti (" + (vm(C).giocatori || []).length + ")");
    fotoDi.forEach(function (n) { if (n !== o.guarda && n !== o.tardi) metti(n); });
    await W.dorme(1500);
    for (var q0 = 0; q0 < fotoDi.length; q0++) if (W.finestra(fotoDi[q0]) && fotoDi[q0] !== o.guarda && fotoDi[q0] !== o.tardi) await foto(fotoDi[q0], "saletta");
    await regoleTL(P, Object.assign({ foto: async function () { await W.dorme(500); await foto("Paky", "regole"); } }, o.regole || {}));
    await W.dorme(900);
    for (var q1 = 0; q1 < fotoDi.length; q1++) if (W.finestra(fotoDi[q1]) && fotoDi[q1] !== o.guarda && fotoDi[q1] !== o.tardi && fotoDi[q1] !== "Paky") await foto(fotoDi[q1], "saletta-regole");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 6000)) no("Paky non trova «Comincia»");
    var giocano = ["Paky"].concat(amici), ult = {}, visto = {}, entrati = {}, fino = Date.now() + (o.ms || 900000), turni = 0, kTurno = "";
    async function foto(nome, cosa) {
      var w = W.finestra(nome); if (!w || !w.document) return;
      var v = vm(C) || {}, file = nomeRun + "-" + String(++nf).padStart(3, "0") + "-" + nome + "-" + (cosa || v.fase || "");
      var guai = []; try { guai = guaiDi(w); } catch (e) { guai = ["(controllo: " + e.message + ")"]; }
      W.__pfLog.push({ file: file, nome: nome, t: Math.round((Date.now() - t0) / 100) / 10, fase: v.fase, n: v.n, turno: v.turnoNome || null, barra: testoBarra(w), testo: T(w).replace(/\s+/g, " ").slice(0, 500), guai: guai });
      await W.scatta(nome, file);
    }
    while (Date.now() < fino) {
      var v = vm(C) || {};
      if (v.fase === "fine") { await W.dorme(3000); for (var q of fotoDi) if (W.finestra(q)) await foto(q, "fine"); await W.dorme(4000); await foto("Paky", "fine2"); break; }
      var kt = (v.fase || "") + "|" + (v.turnoId || "") + "|" + (v.carta ? v.carta.titolo : "");
      if ((v.fase === "turno" || v.fase === "tutti" || v.fase === "lp") && kt !== kTurno) { kTurno = kt; turni++; }
      if (o.guarda && !entrati[o.guarda] && turni >= (o.guardaDa || 2)) { entrati[o.guarda] = 1; await W.apriTel(o.guarda, { hash: "gioco=timeline&stanza=" + C + "&guarda=1", x: 950, salaSempre: true }); metti(o.guarda); }
      if (o.tardi && !entrati[o.tardi] && turni >= (o.tardiDa || 3)) { entrati[o.tardi] = 1; await W.apriTel(o.tardi, { hash: "gioco=timeline&stanza=" + C, x: 1000, salaSempre: true }); metti(o.tardi); giocano.push(o.tardi); }
      // (le proposte da far vedere al proprietario: uno stile in più sui telefoni scelti, o.css = { Paky: "…" })
      if (o.css && turni >= 1) Object.keys(o.css).forEach(function (nm) { var w = W.finestra(nm); if (w && !w.document.getElementById("pf-css")) { var st = w.document.createElement("style"); st.id = "pf-css"; st.textContent = o.css[nm]; w.document.body.appendChild(st); } });
      var chiave = (v.fase || "") + "|" + v.n;
      var nRis =/esito|lEsito|tEsito/i.test(v.fase || "") ? (o.extraEsito || 1) : (o.extra || 0);   // (extraEsito: più foto sul risultato, per vedere quello che compare dopo)
      for (var i = 0; i < fotoDi.length; i++) {
        var n = fotoDi[i]; if (!W.finestra(n)) continue;
        var u = ult[n] || {};
        if (u.chiave !== chiave) { ult[n] = { chiave: chiave, quante: 0, prossima: Date.now() + 900 }; continue; }
        if (Date.now() >= u.prossima && u.quante < 1 + nRis) { u.quante++; u.prossima = Date.now() + 2700; await foto(n); }
      }
      for (var j = 0; j < giocano.length; j++) {
        var g = giocano[j], kk = chiave + "|" + g;
        if (!visto[kk]) visto[kk] = Date.now();
        if (Date.now() - visto[kk] < (rit[g] || 3000)) continue;
        try { var fatto = await agisci(g, o); if (fatto) log(g + ": " + fatto); } catch (e) { log(g + " errore: " + e.message); }
      }
      await W.dorme(200);
    }
    if ((vm(C) || {}).fase !== "fine") no("la partita non arriva alla fine (fase " + (vm(C) || {}).fase + ")");
    return nf + " foto, " + turni + " turni · " + (W.erroriTel().length ? "ERRORI: " + W.erroriTel().slice(0, 4).join(" / ") : "nessun errore");
  } });

  // ===================== lfs: sullo stesso telefono =====================
  COPIONE.aggiungi("lfs", { nome: "Foto: la Linea del tempo sullo stesso telefono", fai: async function () {
    var o = W.__pfOpz || {}, nomeRun = o.nome || "s", nomi = o.nomi || ["Paky", "Giulia"], mis = o.misura || [360, 640];
    seme = o.seme || 777; W.__pfLog = [];
    var P = await W.apriTel("Paky", { x: 0 }); W.misuraTel("Paky", mis[0], mis[1], 1150);
    var nf = 0, t0 = Date.now();
    async function foto(cosa) {
      var file = nomeRun + "-" + String(++nf).padStart(3, "0") + "-" + (cosa || "");
      W.__pfLog.push({ file: file, t: Math.round((Date.now() - t0) / 100) / 10, barra: testoBarra(P), testo: T(P).replace(/\s+/g, " ").slice(0, 500), guai: guaiDi(P) });
      await W.scatta("Paky", file);
    }
    var tess = await W.aspetta(function () { return A.tessera(P, "La linea del tempo"); }, 8000); if (!tess) no("non trovo la tessera");
    tess.click(); await W.dorme(900); await foto("come-giocate");
    if (!await W.aspetta(function () { return W.clicca(P, /Su questo telefono/); }, 8000)) no("non c'è «Su questo telefono»");
    await W.dorme(700);
    if (await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) {
      while (P.document.querySelectorAll(".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
      [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k] || c.value; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
      await foto("nomi");
    }
    for (var k = 0; k < 6; k++) {
      if (P.document.querySelector(".stepper") || P.document.querySelector(".tl-vinci")) {
        await foto("impostazioni");
        var r = o.regole || {}, f = P.document;
        function chip(re) { if (typeof re === "string") re = new RegExp(re.replace(/^__/, "")); var b = [].find.call(f.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent) && vis(x); }); if (!b) no("nelle impostazioni non trovo " + re); b.click(); }
        if (r.linee) chip(/Ognuno la sua linea/);
        if (r.ruba) chip(r.ruba);
        if (r.epoca) chip(r.epoca);
        await W.dorme(200);
        if (r.vinci) { var sl = f.querySelector(".tl-vinci .sl"); if (sl) { sl.value = String(r.vinci); sl.dispatchEvent(new P.Event("input", { bubbles: true })); } }
        for (var i = 0; i < (r.meno || 0); i++) { var m = [].find.call(f.querySelectorAll(".stepper button"), vis); if (m) m.click(); await W.dorme(60); }
        await W.dorme(300); await foto("impostazioni-scelte");
        var bb = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Comincia|Gioca|Inizia|▶/.test(x.textContent) && !x.disabled; });
        if (!bb) no("non trovo il tasto per cominciare"); bb.click(); await W.dorme(400); break;
      }
      var b2 = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Pronti|▶/.test(x.textContent) && !x.disabled; });
      if (!b2) break; b2.click(); await W.dorme(500);
    }
    var fino = Date.now() + (o.ms || 600000), kV = "", da = Date.now(), quante = 0, azioni = 0;
    while (Date.now() < fino) {
      if (/Classifica finale/.test(T(P))) { await W.dorme(2500); await foto("fine"); break; }
      // il momento: la barra in basso e il pezzo principale dello schermo (senza numeri: i conti alla rovescia cambiano)
      var es = P.document.querySelector(".st-sch-in .tl-esito"), kk = (testoBarra(P) + "|" + (es ? "esito" : "") + "|" + titoloMano(P)).replace(/\d+/g, "");
      if (kk !== kV) { kV = kk; da = Date.now(); quante = 0; }
      var nMax = es ? 2 : 1;
      if (quante < nMax && Date.now() - da > 900 + quante * 2700) { quante++; await foto(es ? "esito" : "gioco"); }
      // sullo stesso telefono il risultato aspetta un tocco («Prossima carta ▶», «Avanti ▶»): dopo le due foto
      var pross = tasto(P, /Prossima carta|La classifica|^Avanti ▶$/);
      if (pross && Date.now() - da > 4800) { pross.click(); azioni++; log("avanti"); }
      else if (Date.now() - da > (o.attesa || 2200)) { var fa = await agisci("Paky", o); if (fa) { azioni++; log(fa); } }
      await W.dorme(200);
    }
    if (!/Classifica finale/.test(T(P))) no("la partita non finisce («" + T(P).slice(0, 160) + "»)");
    return nf + " foto, " + azioni + " mosse · " + (W.erroriTel().length ? "ERRORI: " + W.erroriTel().slice(0, 4).join(" / ") : "nessun errore");
  } });
})();
