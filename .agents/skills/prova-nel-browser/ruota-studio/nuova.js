// 🎡 PROVE DELLA RUOTA RIFATTA (19 nov 2026, chat «🪟 Saletta di vetro»; scelta del proprietario sui fogli t1-t3). Profili finti.
// rn1: contro i Bot, Paky gioca davvero: tabellone e punteggi SEMPRE nello stesso posto e della stessa misura in ogni fase;
//      quando Paky sceglie la lettera c'è la tastiera ALFABETICA (7 per riga) sotto i punteggi e la ruota non c'è; quando risolve
//      la QWERTY (nostra); le lettere già chiamate spente e non toccabili; la ruota media quando si aspetta il giro, intera quando
//      gira, lo zoom sulla lancetta SEMPRE a 1,5 s dalla fine (si misura); la luce sullo spicchio vinto esatta (pixel della luce);
//      i giri dei Bot più corti (al massimo 4,8 s); la Bancarotta con «💥 −…» sul punteggio; la fine manche col riquadro.
//      Foto: lo zoom fermato a metà (si ferma il disegno un attimo), la tastiera alfabetica, la QWERTY, la fine manche.
// rn2: la categoria lunga va a capo e non sposta il tabellone (360×640 e 412×915), niente esce dallo schermo.
// Uso: await COPIONE.carica("ruota-studio/nuova.js"); await COPIONE.prova("rn1")
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error(p); }
  async function foto(nome) { if (!W.__foto) return; W.__fotoOra = nome; await W.aspetta(function () { return W.__fotoFatta === nome; }, 60000); }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".ru-azioni button, button"), function (b) { return re.test(b.textContent) && !b.disabled && !b.hidden && b.getClientRects().length; }) || null; }
  function lettera(w, L) { return [].find.call(w.document.querySelectorAll(".ru-qwerty .ru-btn.lettera, .ru-qv .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled && b.getClientRects().length; }) || null; }
  function base(ch) { return { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" }[ch] || ch; }
  var CONS = "BCDFGHJKLMNPQRSTVWXYZ";
  function rot(n) { var m = n && /rotate\(([-\d.]+)deg\)/.exec(n.style.transform); return m ? +m[1] : null; }
  async function trascina(w, gradi, ms) {
    var R = w.document.querySelector(".ru-alto .ru-piatto-alto"); if (!R) return false;
    var r = R.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rr = r.width * 0.36, a0 = -90, Ev = w.PointerEvent || w.MouseEvent, n = 8;
    function ev(t, a) { var x = cx + rr * Math.cos(a * Math.PI / 180), y = cy + rr * Math.sin(a * Math.PI / 180); R.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, pointerId: 9, pointerType: "touch", isPrimary: true, clientX: x, clientY: y })); }
    ev("pointerdown", a0); for (var k = 1; k <= n; k++) { await W.dorme(ms / n); ev("pointermove", a0 + gradi * k / n); } ev("pointerup", a0 + gradi);
    return true;
  }
  async function scrivi(w, frase, tab) {
    for (var i = 0; i < tab.length; i++) { if (tab.charAt(i) !== "_") continue; var b = lettera(w, base(frase.charAt(i))); if (!b) return "manca la lettera " + base(frase.charAt(i)) + " sulla QWERTY"; tocca(w, b); await W.dorme(40); }
    var ok = tasto(w, /✓ Risolvi/); if (!ok) return "niente «✓ Risolvi»"; tocca(w, ok); return "";
  }
  function posto(w, sel) { var e = w.document.querySelector(sel); if (!e) return null; var r = e.getBoundingClientRect(); return Math.round(r.top) + "/" + Math.round(r.height) + "/" + Math.round(r.width); }

  COPIONE.aggiungi("rn1", { nome: "Ruota rifatta: tabellone e punteggi fissi, tastiere alfabetica e QWERTY, ruota media/intera/zoom a 1,5 s, luce esatta, Bot veloci", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), L = [];
    var tess = await W.aspetta(function () { return A.tessera(w, "La Ruota della Fortuna"); }, 6000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(300);
    if (!W.clicca(w, /Contro i Bot/, ".modo-grande")) no("non c'è «Contro i Bot»");
    await W.dorme(300); if (!W.clicca(w, /Comincia/)) no("non trovo «Comincia»");
    var Rr = w.__RUOTA;
    if (!await W.aspetta(function () { var Q = Rr.ultima; return Q && Rr.H && !Rr.H.sigla && w.document.querySelector(".ru-tab.alta"); }, 60000)) no("la partita non comincia");
    var posti = {}, fasiViste = {}, alfa = false, qwerty = false, zoom = [], luci = 0, botMs = [], banca = false, fm = false, medio = false, intero = false, fotoZ = false, fotoA = false, fotoQ = false, fotoF = false;
    var t0 = Date.now(), giroN = -1, kz = "";
    while (Date.now() - t0 < 300000) {
      var Q = Rr.ultima, ui = Rr.ui && Rr.ui();
      if (!Q || !ui) { await W.dorme(150); continue; }
      if (Q.fase === "fine" || w.document.querySelector(".classifica")) break;
      // tabellone e punteggi: stessa posizione e misura in ogni fase
      var pt = posto(w, ".ru-tab"), pp = posto(w, ".ru-punti"), k = pt + "|" + pp;
      if (pt && !w.document.querySelector(".ru-sopra.sigla")) { posti[k] = posti[k] || []; if (posti[k].indexOf(Q.fase) < 0) posti[k].push(Q.fase); }
      fasiViste[Q.fase] = 1;
      var p = Q.giocatori[Q.turno], mio = p && !p.bot;
      // il giro: misuro intera, zoom e luce
      if (Q.fase === "girando" && Q.giroN !== giroN) {
        giroN = Q.giroN; var fineV = null, zAt = null, ms = Q.giroMs;
        if (p && p.bot) botMs.push(ms);
        var tg = Date.now();
        while (Date.now() - tg < ms + 3000) {
          var u2 = Rr.ui();
          if (u2 && u2.girando && !intero) { var pa = w.document.querySelector(".ru-alto.on .ru-piatto-alto"); if (pa) intero = parseFloat(pa.style.getPropertyValue("--s")) > 0; }
          if (!zAt && w.document.querySelector(".ru-alto.on.vicino")) {
            zAt = performance.now();
            if (!fotoZ && W.__foto) {   // la foto dello zoom (provavera con FAST=1 la scatta subito, una misura sola)
              fotoZ = true; await W.dorme(250); await foto("z1-zoom"); zAt = null; zoom.push("foto");
              continue;
            }
          }
          if (u2 && !u2.rafGiro && !w.document.querySelector(".ru-alto.gira") && Date.now() - tg > 500) { fineV = performance.now(); break; }
          await W.dorme(20);
        }
        if (zAt && fineV) zoom.push(Math.round(fineV - zAt));
        // la luce: accesa sullo spicchio sotto la lancetta (e non su quelli accanto)
        await W.dorme(120);
        var lu = w.document.querySelector(".ru-luce"), disco = w.document.querySelector(".ru-alto .ru-disco"), a = rot(disco);
        if (lu && a != null && lu.classList.contains("on")) {
          var c = lu.getContext("2d"), sotto = Math.floor(((((-a) % 360) + 360) % 360) / 15) % 24, off = ((((sotto + 0.5) * 15 + a) % 360) + 540) % 360 - 180;
          function alfaA(gr) { var an = (-90 + gr) * Math.PI / 180, x = Math.round(300 + Math.cos(an) * 262), y = Math.round(300 + Math.sin(an) * 262); return c.getImageData(x, y, 1, 1).data[3]; }
          var dentro = alfaA(off), fuori1 = alfaA(off + 13), fuori2 = alfaA(off - 13);
          if (!(dentro > 60 && fuori1 < 30 && fuori2 < 30)) no("la luce non è sullo spicchio vinto (dentro " + dentro + ", accanto " + fuori1 + "/" + fuori2 + ", scarto " + off.toFixed(1) + "°)");
          luci++;
          if (!W.__fotoZ2 && W.__foto && zoom.length) { W.__fotoZ2 = 1; await foto("z2-ferma"); }
        }
        continue;
      }
      if (Q.fase === "gira") {
        var al = w.document.querySelector(".ru-alto.on .ru-piatto-alto");
        if (al && !(Rr.ui().girando)) { var sm = parseFloat(al.style.getPropertyValue("--s")); if (sm > 0 && sm < 0.8) medio = true; }
      }
      try {
        if (mio && Q.fase === "gira") {
          var vis = Q.frase.split("").filter(function (ch) { return /[A-ZÀÈÉÌÒÙ]/.test(ch); }), quota = vis.filter(function (ch) { return Q.rivelate[base(ch)]; }).length / vis.length;
          if (quota > 0.6 || !Q.consonantiNascoste()) { var br = tasto(w, /💡 Risolvi/); if (br) tocca(w, br); }
          else { await W.dorme(400); if (!(await trascina(w, 100, 120))) { var bg = tasto(w, /🎡 Gira/); if (bg) tocca(w, bg); } await W.dorme(800); }
        } else if (mio && Q.fase === "consonante") {
          await W.dorme(300);
          var kb = w.document.querySelector(".ru-qwerty");
          if (!kb.classList.contains("alfa")) no("per scegliere la consonante non c'è la tastiera alfabetica");
          var righeA = [].filter.call(kb.querySelectorAll(".ru-qr.a"), function (x) { return x.getClientRects().length; });
          if (righeA.length !== 4 || righeA[0].querySelectorAll(".ru-btn").length !== 7) no("la tastiera alfabetica non ha 4 righe da 7");
          if (w.document.querySelector(".ru-alto.on") && !w.document.querySelector(".ru-alto.on.nascosta")) no("mentre si sceglie la lettera si vede ancora la ruota");
          var pb = w.document.querySelector(".ru-punti").getBoundingClientRect().bottom, kt = kb.getBoundingClientRect().top;
          if (kt < pb || kt - pb > 90) no("la tastiera non sta subito sotto i punteggi (" + Math.round(kt - pb) + " px)");
          // le lettere già chiamate: spente e non si toccano
          Object.keys(Q.chiamate).forEach(function (Lc) { var b = [].find.call(kb.querySelectorAll(".ru-qr.a .ru-btn"), function (x) { return x.textContent === Lc; }); if (b && !b.disabled) no("la lettera già chiamata " + Lc + " si può ancora toccare"); });
          alfa = true;
          if (!fotoA) { fotoA = true; await foto("a1-alfabetica"); }
          var giuste = Q.frase.split("").map(base).filter(function (ch) { return CONS.indexOf(ch) >= 0 && !Q.chiamate[ch]; });
          var cc = giuste[0] || "BCDFGHLMNPRSTVZ".split("").filter(function (ch) { return !Q.chiamate[ch]; })[0];
          var bc = lettera(w, cc); if (bc) { tocca(w, bc); await W.dorme(250); var b2 = lettera(w, cc); if (b2) tocca(w, b2); }
        } else if (mio && Q.fase === "risolvi") {
          await W.dorme(400);
          var kq = w.document.querySelector(".ru-qwerty");
          if (kq.classList.contains("alfa")) no("per risolvere c'è la tastiera alfabetica invece della QWERTY");
          var rq = [].filter.call(kq.querySelectorAll(".ru-qr.q"), function (x) { return x.getClientRects().length; });
          if (rq.length !== 3 || rq[0].textContent.indexOf("QWERTYUIOP") !== 0) no("la QWERTY non c'è");
          Object.keys(Q.chiamate).forEach(function (Lc) { var b = [].find.call(kq.querySelectorAll(".ru-qr.q .ru-btn"), function (x) { return x.textContent === Lc; }); if (b && !b.disabled) no("risolvendo, la lettera già chiamata " + Lc + " si può toccare"); });
          qwerty = true;
          if (!fotoQ) { fotoQ = true; await foto("q1-qwerty"); }
          var e = await scrivi(w, Q.frase, Q.vista().tab); if (e) no(e);
        } else if (mio && Q.fase === "vocale") { var v = Q.frase.split("").map(base).filter(function (ch) { return "AEIOU".indexOf(ch) >= 0 && !Q.chiamate[ch]; })[0] || "U"; var bv = lettera(w, v); if (bv) { tocca(w, bv); await W.dorme(200); var bv2 = lettera(w, v); if (bv2) tocca(w, bv2); } }
        else if (mio && Q.fase === "sceltaexp") { var bx = tasto(w, /Gioco/); if (bx) tocca(w, bx); }
        else if (mio && Q.fase === "express") { var bm = tasto(w, /Mi fermo/); if (bm) tocca(w, bm); }
        else if (mio && Q.fase === "mistero") { var bmi = tasto(w, /Mi tengo/); if (bmi) tocca(w, bmi); }
        else if (Q.fase === "lampo" && Q.lampo && !Q.lampo.chi && Q.lampo.n >= 3) { var bp = tasto(w, /PRENOTO/); if (bp) tocca(w, bp); }
        else if (Q.fase === "lampo" && Q.lampo && Q.lampo.chi === "host") { await W.dorme(300); var e2 = await scrivi(w, Q.lampo.frase, Q.lampoTab()); if (e2) no("frase lampo: " + e2); }
        else if (mio && Q.fase === "vlettera") { var x = Q.frase.split("").map(base).filter(function (ch) { return /[A-Z]/.test(ch) && !Q.chiamate[ch]; })[0]; var bl = x && lettera(w, x); if (bl) { tocca(w, bl); await W.dorme(200); var bl2 = lettera(w, x); if (bl2) tocca(w, bl2); } }
        else if (mio && Q.fase === "vdecidi") { var bd = tasto(w, /Risolvo/); if (bd) tocca(w, bd); }
        else if (Q.fase === "finemanche" && !fm) {
          await W.dorme(500);
          var box = w.document.querySelector(".ru-fm");
          if (!box || box.hidden || !/RISOLTA DA/.test(box.textContent)) no("a fine manche non c'è il riquadro di chi ha risolto");
          fm = true; if (!fotoF) { fotoF = true; await foto("f1-finemanche"); }
        }
        if (Q.ev && Q.ev.t === "bancarotta" && !banca) { await W.dorme(200); var chB = [].find.call(w.document.querySelectorAll(".ru-chip small.banca"), function (x) { return /💥/.test(x.textContent); }); if (chB) banca = true; }
        if (Q.fase === "fbusta" || Q.fase === "flettere" || Q.fase === "ftempo") break;   // (la finale non è cambiata: basta così)
      } catch (err) { if (/^la |^per |^mentre |^risolvendo|^a fine|^frase|^manca|^niente/.test(err.message)) throw err; }
      await W.dorme(150);
    }
    var kk = Object.keys(posti);
    if (kk.length !== 1) no("il tabellone o i punteggi si spostano: " + kk.map(function (x) { return x + " (" + posti[x].join(",") + ")"; }).join(" · "));
    if (!alfa) no("non ho visto la tastiera alfabetica"); if (!qwerty) no("non ho visto la QWERTY");
    var mis = zoom.filter(function (x) { return typeof x === "number"; });
    if (!mis.length) no("non ho visto lo zoom sulla lancetta");
    mis.forEach(function (m) { if (m < 1100 || m > 1900) no("lo zoom non parte a 1,5 s dalla fine (" + m + " ms)"); });
    if (!medio) no("non ho visto la ruota media quando si aspetta il giro"); if (!intero) no("non ho visto la ruota intera mentre gira");
    if (!luci) no("non ho controllato la luce");
    botMs.forEach(function (m) { if (m > 4800) no("un Bot gira per " + m + " ms (più di 4,8 s)"); });
    if (!fm) no("non ho visto la fine manche");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "tabellone e punteggi fermi in " + posti[kk[0]].length + " fasi · alfabetica e QWERTY · zoom a " + mis.join(", ") + " ms dalla fine · luce esatta " + luci + " volte · giri dei Bot " + botMs.join(", ") + " ms" + (banca ? " · Bancarotta col 💥" : "");
  } });

  COPIONE.aggiungi("rn2", { nome: "Ruota rifatta: categoria lunga su due righe, il tabellone non si sposta, niente fuori schermo (360×640, 412×915)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), f = document.getElementById("tel-Paky"), out = [];
    var tess = await W.aspetta(function () { return A.tessera(w, "La Ruota della Fortuna"); }, 6000); tess.click(); await W.dorme(300);
    W.clicca(w, /Contro i Bot/, ".modo-grande"); await W.dorme(300); W.clicca(w, /Comincia/);
    var Rr = w.__RUOTA;
    if (!await W.aspetta(function () { return Rr.ultima && Rr.H && !Rr.H.sigla && w.document.querySelector(".ru-tab.alta"); }, 60000)) no("la partita non comincia");
    for (var M of [[360, 640], [390, 844], [412, 915]]) {
      f.style.width = M[0] + "px"; f.style.height = M[1] + "px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(700);
      var cat = w.document.querySelector(".ru-cat"), t1 = posto(w, ".ru-tab"), vecchio = cat.innerHTML;
      for (var lunga of ["SCIENZA E NATURA", "CITTÀ E PAESI DEL MONDO DA VISITARE", "🌍 GIRAMONDO · INDONESIA: «NGOBROL» VUOL DIRE…"]) {
        cat.innerHTML = "<span class='t'>" + lunga + "</span><span class='m'>manche 1/4</span>"; w.__RUOTA.fitCat(); await W.dorme(250);
        var t2 = posto(w, ".ru-tab"), r = cat.getBoundingClientRect(), tt = cat.querySelector(".t").getBoundingClientRect(), mm = cat.querySelector(".m").getBoundingClientRect();
        if (t1 !== t2) out.push(M.join("×") + " «" + lunga + "»: il tabellone si sposta (" + t1 + " → " + t2 + ")");
        if (cat.scrollWidth > cat.clientWidth + 2 || cat.scrollHeight > cat.clientHeight + 1 || r.right > w.innerWidth + 1) out.push(M.join("×") + " «" + lunga + "»: la categoria esce");
        var lh = parseFloat(w.getComputedStyle(cat.querySelector(".m")).fontSize) * 2.2;   // (una riga sola, col suo bordino)
        if (mm.height > lh) out.push(M.join("×") + " «" + lunga + "»: «manche 1/4» va a capo");
        if (mm.left < tt.right - 1 || mm.top > tt.bottom || mm.bottom < tt.top) out.push(M.join("×") + " «" + lunga + "»: «manche 1/4» non sta sulla riga della categoria");
      }
      cat.innerHTML = vecchio; w.__RUOTA.fitCat();
      var se = w.document.scrollingElement; if (se.scrollHeight > w.innerHeight + 2) out.push(M.join("×") + ": la pagina scorre");
      [".ru-tab", ".ru-punti"].forEach(function (s) { var e = w.document.querySelector(s).getBoundingClientRect(); if (e.right > w.innerWidth + 1 || e.bottom > w.innerHeight + 1) out.push(M.join("×") + ": " + s + " esce dallo schermo"); });
    }
    if (out.length) no(out.join(" · "));
    return "categoria lunga su due righe senza spostare il tabellone, a 360×640 e 412×915";
  } });
})();
