// PROVA «LA RIGA DI METÀ CAMPO A METÀ» NEI CAMPETTI DELLA MINI ASTA (25 nov 2026, il proprietario: «la linea di centrocampo non è a
// centrocampo, sta più vicino alla porta che all'attacco»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-campetto.js"); await COPIONE.prova("cm1")
// Con Edge invisibile: prova.js --porta 8995 --carica preferiti/asta.js,preferiti/asta-campetto.js --prova cm1
//
// cm1 Online in 2, 4 e 6, su 360x640, 360x740 e 412x915: nei campetti delle squadre all'asta la riga bianca di metà campo DISEGNATA a metà
//     (cercata nei pixel del disegno) e nessun posto (vuoto o pieno: maglia e nome) sopra la riga o con la maglia fuori dal campetto.
//     Dal 26 nov 2026 (il proprietario: «il difensore tutto a sinistra o a destra non va bene… la stessa distanza tra tutti i ruoli»): la
//     formazione a 4 file ALLA STESSA DISTANZA (attaccante, centrocampisti, difensore, portiere), attaccante, difensore e portiere al centro,
//     i centrocampisti uguali ai due lati, nessun posto addosso a un altro, l'attaccante mai sopra la linea di fondo degli altri. Il cerchio
//     di centrocampo non è più un guaio (dove le maglie sono grandi il difensore lo tocca): si conta e basta.
// cm0 (solo misure) Le misure dei campetti delle squadre all'asta: in 2, 3, 4 e 6, su 360x640, 360x740 e 412x915.
// Foto: D:/SG-asta-prove/campo (foto-campetti.js, foto-tutte.js, foto-whatsapp.js; con «prima» il gioco di prima).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function vm(C) { return W.vmDi(C) || {}; }
  function pulisci() {   // via i telefoni della partita di prima (come fra uno scenario e l'altro)
    Object.keys(W.BR.tel).forEach(function (n) { (W.BR.perNome[n] || []).forEach(function (c) { c.morto = true; c.connected = false; }); var f = document.getElementById("tel-" + n); if (f) f.remove(); });
    W.BR.clients = []; W.BR.retained = {}; W.BR.log = []; W.BR.perNome = {}; W.BR.mem = {}; W.BR.tel = {}; W.BR.conti = {}; W.BR.pubblici = {}; W.BR.nube = {}; W.BR.amicizie = []; W.BR.storia = []; W.BR.congelati = {}; W.BR.spenti = {};
  }
  var NOMI = ["Paky", "Giulia", "Luca", "Sara", "Bea", "Ugo"];
  async function partita(n) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "fanta" }; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < n; i++) await W.apriTel(NOMI[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === n; }, 15000)) no("non sono entrati in " + n);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "asta" && q(P, ".st-sq-campo"); }, 10000)) no("l'asta non comincia in " + n);
    return { P: P, C: C };
  }
  async function misura(P, wh) {
    var fr = document.getElementById("tel-Paky"); fr.style.width = wh[0] + "px"; fr.style.height = wh[1] + "px"; P.dispatchEvent(new P.Event("resize")); await W.dorme(700);
    var c = qa(P, ".st-sq-campo").filter(function (e) { return e.getClientRects().length; })[0];
    return c ? { w: c.clientWidth, h: c.clientHeight, rap: +(c.clientWidth / c.clientHeight).toFixed(2), mg: parseFloat(P.getComputedStyle(c.closest(".st-gr-carte")).getPropertyValue("--mg")) || 0, basso: !!c.closest(".st-gr-carte.basso") } : null;
  }
  // dove sta davvero la riga di metà campo nel disegno: il fondo del campetto disegnato su una tela, la colonna a 27 m dal centro (lontana da aree e
  // cerchio), tra il 20% e l'80% dell'altezza la riga più chiara (la riga bianca è sottile: nei campetti bassi meno di un pixel, si vede più chiara del prato)
  async function rigaDisegno(w, c) {
    var bg = w.getComputedStyle(c).backgroundImage, m = /url\("?(.*?)"?\)$/.exec(bg); if (!m) return null;
    var img = new w.Image(); img.src = m[1]; await new Promise(function (ok) { img.onload = ok; img.onerror = ok; setTimeout(ok, 3000); });
    var W2 = c.clientWidth, H2 = c.clientHeight, cv = w.document.createElement("canvas"); cv.width = W2; cv.height = H2;
    var cx = cv.getContext("2d"); cx.drawImage(img, 0, 0, W2, H2);
    var G = w.SGAstaArte.campoGeo(Math.round(W2 / H2 * 20) / 20), x = Math.round(W2 * (150 - 27 * G.sx) / 300), d = cx.getImageData(x, 0, 1, H2).data;   // (a 27 m dal centro: tra la linea laterale e l'area)
    var lum = [], y0 = Math.round(H2 * 0.2); for (var y = y0; y < H2 * 0.8; y++) { var i = y * 4; lum.push((d[i] + d[i + 1] + d[i + 2]) / 3); }
    var ord = lum.slice().sort(function (a, b) { return a - b; }), med = ord[ord.length >> 1], max = ord[ord.length - 1], su = []; if (max - med < 25) return null; lum.forEach(function (v, k) { if (v > max - 12) su.push(k + y0); }); return (su[0] + su[su.length - 1] + 1) / 2 / H2;
  }
  // i posti di un campetto: niente sopra la riga di metà campo, niente sul cerchio di centrocampo, niente fuori dal campetto
  function guardaPosti(w, c, dove) {
    var ko = [], r = c.getBoundingClientRect(), rap = Math.round(c.clientWidth / c.clientHeight * 20) / 20, G = w.SGAstaArte.campoGeo(rap);
    var midY = r.top + r.height / 2, cx = r.left + r.width / 2, rx = (9.15 + 0.5) * G.sx / 300 * r.width, ry = (9.15 + 0.5) * G.sy / 300 * r.height;
    var fondo = r.top + (150 - 52.5 * G.sy) / 300 * r.height, scat = [], ctr = [], ruoli = ["ATT", "CEN sx", "CEN dx", "DIF", "POR"];
    [].forEach.call(c.querySelectorAll(".st-slot"), function (s, i) { var b = s.getBoundingClientRect(); ctr[i] = [b.left + b.width / 2, b.top + b.height / 2]; });
    if (ctr.length === 5) {
      var gA = ctr[1][1] - ctr[0][1], gC = ctr[3][1] - ctr[1][1], gD = ctr[4][1] - ctr[3][1];
      if (Math.abs(ctr[1][1] - ctr[2][1]) > 1) ko.push(dove + ": i due centrocampisti non sono alla stessa altezza");
      if (Math.max(gA, gC, gD) - Math.min(gA, gC, gD) > 1.5) ko.push(dove + ": le file non sono alla stessa distanza (" + [gA, gC, gD].map(Math.round).join(", ") + " px)");
      if (!(gA > 0 && gC > 0 && gD > 0)) ko.push(dove + ": le file non sono in ordine (attaccante, centrocampisti, difensore, portiere)");
      [0, 3, 4].forEach(function (i) { if (Math.abs(ctr[i][0] - cx) > 1) ko.push(dove + ": " + ruoli[i] + " non è al centro (" + Math.round(ctr[i][0] - cx) + " px)"); });
      if (Math.abs((ctr[1][0] + ctr[2][0]) / 2 - cx) > 1) ko.push(dove + ": i centrocampisti non sono uguali ai due lati");
    }
    W.__cerchio = (W.__cerchio || 0);
    [].forEach.call(c.querySelectorAll(".st-slot"), function (s, i) {
      var pezzi = [s.querySelector(".st-slot-vuoto"), s.querySelector(".st-slot-fig"), s.querySelector("span")].filter(function (e) { return e && e.getClientRects().length && w.getComputedStyle(e).visibility !== "hidden" && w.getComputedStyle(e).display !== "none"; });
      var nome = ["ATT", "CEN sx", "CEN dx", "DIF", "POR"][i] + (s.classList.contains("vuoto") ? " (vuoto)" : " (" + (s.querySelector("span") || {}).textContent + ")");
      pezzi.forEach(function (e) {
        var b = e.getBoundingClientRect(); if (b.width < 2 || b.height < 2) return;
        var cosa = e.tagName === "SPAN" ? "il nome" : "la maglia";
        if (b.top < midY - 0.5 && b.bottom > midY + 0.5) ko.push(dove + ": " + nome + ", " + cosa + " sopra la riga di metà campo");
        var nx = Math.max(b.left, Math.min(cx, b.right)) - cx, ny = Math.max(b.top, Math.min(midY, b.bottom)) - midY;
        if (nx * nx / (rx * rx) + ny * ny / (ry * ry) < 1) W.__cerchio++;   // (sul cerchio: si conta)
        if (cosa === "la maglia" && (b.top < r.top - 1 || b.bottom > r.bottom + 1 || b.left < r.left - 1 || b.right > r.right + 1)) ko.push(dove + ": " + nome + ", la maglia esce dal campetto");
        if (cosa === "la maglia" && i === 0 && b.top < fondo - 3) ko.push(dove + ": l'attaccante sale oltre la linea di fondo degli altri (" + Math.round(fondo - b.top) + " px)");
        scat.forEach(function (x) { if (x.i !== i && b.left < x.b.right - 0.5 && x.b.left < b.right - 0.5 && b.top < x.b.bottom - 0.5 && x.b.top < b.bottom - 0.5) ko.push(dove + ": " + nome + " addosso a " + ruoli[x.i]); });
        scat.push({ i: i, b: b });
      });
    });
    return ko;
  }
  function riempi(c, piene) {   // per guardare anche i posti pieni: maglia e nome (lunghi) come quando un calciatore è comprato
    var nomi = ["Lautaro", "Calhanoglu", "Mkhitaryan", "Bastoni", "Sommer"];
    [].forEach.call(c.querySelectorAll(".st-slot"), function (s, i) {
      var im = s.querySelector(".st-slot-maglia"), mx = c.ownerDocument.querySelector(".st-maglia");
      if (piene) { s.dataset.era = s.className; s.classList.remove("vuoto"); var sp = s.querySelector("span"); if (sp) { sp.dataset.era = sp.textContent; sp.textContent = nomi[i]; } if (im && !im.getAttribute("src") && mx && mx.src) { im.src = mx.src; im.dataset.finta = 1; } }
      else if (s.dataset.era != null) { s.className = s.dataset.era; delete s.dataset.era; var sp2 = s.querySelector("span"); if (sp2) sp2.textContent = sp2.dataset.era || ""; if (im && im.dataset.finta) { im.removeAttribute("src"); delete im.dataset.finta; } }
    });
  }
  // cm1 Online in 2, 4 e 6 (Paky tiene la partita), su 360x640, 360x740 e 412x915, i campetti delle squadre all'asta: la riga bianca di
  //     metà campo DISEGNATA a metà dell'altezza (cercata nei pixel), e nessun posto (vuoto o con la maglia e il nome) sopra la riga, sul
  //     cerchio o fuori dal campetto. Più il campo grande della fine (quando non c'è la giornata) e il foglio «👕 Tutte» (formazioni).
  COPIONE.aggiungi("cm1", { nome: "Mini Asta: nei campetti la riga di metà campo è a metà, nessuno sulla riga, 4 file alla stessa distanza e il difensore al centro", fai: async function () {
    var ko = [], fatti = []; W.__cerchio = 0;
    for (var n of [2, 4, 6]) {
      pulisci();
      var o = await partita(n);
      for (var wh of [[360, 640], [360, 740], [412, 915]]) {
        await misura(o.P, wh);
        var campi = qa(o.P, ".st-sq-campo").filter(function (e) { return e.getClientRects().length; }), dove = n + " in " + wh.join("x");
        if (!campi.length) { ko.push(dove + ": non vedo i campetti"); continue; }
        var c = campi[0], meta = await rigaDisegno(o.P, c);
        if (meta == null) ko.push(dove + ": nel disegno non trovo la riga di metà campo");
        else if (Math.abs(meta - 0.5) > 0.008) ko.push(dove + ": la riga di metà campo è al " + Math.round(meta * 1000) / 10 + "% dell'altezza");
        campi.forEach(function (cc) { ko = ko.concat(guardaPosti(o.P, cc, dove + " (vuoti)")); });
        campi.forEach(function (cc) { riempi(cc, true); }); await W.dorme(60);
        campi.forEach(function (cc) { ko = ko.concat(guardaPosti(o.P, cc, dove + " (pieni)")); });
        campi.forEach(function (cc) { riempi(cc, false); });
        fatti.push(dove + " " + c.clientWidth + "x" + c.clientHeight + (meta != null ? " riga " + Math.round(meta * 1000) / 10 + "%" : ""));
      }
    }
    var visti = {}; ko = ko.filter(function (k) { if (visti[k]) return false; visti[k] = 1; return true; });
    W.__campetto = ko;
    if (ko.length) no(ko.length + " cose: " + ko.slice(0, 10).join(" | "));
    return fatti.join(" · ") + " · pezzi sul cerchio di centrocampo (si contano e basta): " + (W.__cerchio || 0);
  } });
  W.campettoProva = { partita: partita, misura: misura, pulisci: pulisci, riempi: riempi };   // (per le foto)
  COPIONE.aggiungi("cm0", { nome: "Mini Asta: le misure dei campetti delle squadre (solo misure)", fai: async function () {
    var out = [];
    for (var n of [2, 3, 4, 6]) {
      pulisci();
      var o = await partita(n);
      for (var wh of [[360, 640], [360, 740], [412, 915]]) { var m = await misura(o.P, wh); out.push(n + " in " + wh.join("x") + ": " + (m ? m.w + "x" + m.h + " rap " + m.rap + " mg " + m.mg + (m.basso ? " basso" : "") : "?")); }
    }
    return out.join(" | ");
  } });
})();
