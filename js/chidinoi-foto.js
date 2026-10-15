/* =========================================================
   «Chi di Noi?» — LA FOTO VERA (il cuore del gioco)
   window.SG_CDN_FOTO:
   - FILTRI: i 10 filtri del proprietario (Originale, Sdoppiamento, Specchio, Occhioni Anime, Mascellone Gigachad,
     Faccia Liquida, Testa a Cono, Faccia da Uovo, Nasone da Strega, Testa Schiacciata), fatti su canvas sul telefono
   - camerino(o): la finestra «📸 La tua faccia» (selfie con la sagoma ovale, foto dalla galleria, avatar, filtri)
   - metti(id, f, canvas, x) / filtro(id, x) / togli(id) / svuota() / ha(id, f): le foto, SOLO in memoria
   - importa(chiave) / cifra / decifra: AES-GCM con WebCrypto (la chiave sta solo nel link, dopo il #)
   - jpeg(canvas) / daJpeg(bytes, cb): la foto piccola (240×300, JPEG leggero) e ritorno
   e riempie SG_CDN_ARTE.foto(id, o, p): la faccia di un giocatore con la sua foto, nel corpo del suo avatar
   (stessa inquadratura del busto dell'avatar: così ogni schermata del gioco la mostra come l'avatar).
   La sagoma ovale dice dove stanno occhi, naso e bocca: i filtri non devono "riconoscere" la faccia.
   ========================================================= */
(function () {
  "use strict";

  // ---------- la foto: 240×300, l'ovale della faccia e i punti fissi della sagoma ----------
  var FW = 240, FH = 300;
  var OV = { x: 120, y: 152, rx: 98, ry: 122 };              // l'ovale della sagoma (dove si mette la faccia)
  var OCCHI = 140, OCC_DX = 36, NASO = 178, BOCCA = 212, MENTO = 268;
  // la testa dell'avatar (coordinate del disegno dell'avatar 200×264, prima della scala della testa): lì va l'ovale della foto
  var AV = { x: 100, y: 92, rx: 57, ry: 66 }, KT = 0.85;
  // dove il cappello si appoggia sulla testa (come in omino.js): sopra quella riga il cappello si ridisegna sopra la foto
  var LINEA = { cappellino: 73, berretto: 73, cilindro: 53, cowboy: 58, pescatore: 63, basco: 52, paglia: 58, coppola: 72, borsalino: 60, pirata: 62, mago: 60, chef: 64, babbo: 70, vichingo: 76 };

  var FILTRI = [
    { id: "orig", nome: "Originale", e: "🙂" },
    { id: "sdoppia", nome: "Sdoppiamento", e: "👯" },
    { id: "specchio", nome: "Specchio", e: "🪞" },
    { id: "anime", nome: "Occhioni Anime", e: "🥺" },
    { id: "giga", nome: "Mascellone Gigachad", e: "🗿" },
    { id: "liquida", nome: "Faccia Liquida", e: "🫠" },
    { id: "cono", nome: "Testa a Cono", e: "🍦" },
    { id: "uovo", nome: "Faccia da Uovo", e: "🥚" },
    { id: "strega", nome: "Nasone da Strega", e: "🧙" },
    { id: "schiaccia", nome: "Testa Schiacciata", e: "🥞" }
  ];
  var IDX = {}; FILTRI.forEach(function (f, i) { IDX[f.id] = i; });
  // le facce delle carte "lui": la foto non cambia espressione, quindi la fa un filtro (più la faccina che mette il gioco)
  var ESPR = { terrore: "anime", sorpreso: "anime", estasi: "anime", innamorato: "anime", disgusto: "schiaccia", sonno: "schiaccia",
    furbo: "liquida", linguaccia: "strega", esulta: "giga", arrabbiato: "giga", triste: "uovo", finto: "specchio" };
  // dove finiscono gli occhi dopo il filtro (per gli occhiali del costume): [y, quanto si allargano]
  var OCCHI_F = { cono: [173.3, 0.74], schiaccia: [144.8, 1.32] };

  function lim(v, a, b) { return v < a ? a : v > b ? b : v; }
  function liscio(t) { t = lim(t, 0, 1); return t * t * (3 - 2 * t); }
  function tela(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p || 10); } catch (e) {} }

  // =========================================================
  //  I FILTRI: per ogni punto della faccia nuova si cerca da dove "pescarlo" nella foto (mappa inversa)
  // =========================================================
  function lente(x, y, cx, cy, r, s) {
    var dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy) / r;
    if (d >= 1) return null;
    var f = 1 - s * (1 - d * d);
    return [cx + dx * f, cy + dy * f, d];
  }
  var MAPPE = {
    specchio: function (x, y) { return [x > FW / 2 ? FW - x : x, y]; },
    anime: function (x, y) {
      var p = lente(x, y, FW / 2 - OCC_DX, OCCHI, 36, 0.74) || lente(x, y, FW / 2 + OCC_DX, OCCHI, 36, 0.74);
      if (p) return p;
      var t = liscio((y - 190) / 80);   // il mento si stringe un poco (faccia da cartone)
      return [FW / 2 + (x - FW / 2) * (1 + 0.24 * t), y];
    },
    giga: function (x, y) {
      var sx = x, sy = y;
      if (y > 175) { var t = liscio((y - 175) / 70); sx = FW / 2 + (x - FW / 2) / (1 + 0.85 * t); }       // mascella larga
      if (y < 120) { var t2 = liscio((120 - y) / 90); sx = FW / 2 + (x - FW / 2) / (1 - 0.24 * t2); }     // fronte stretta
      if (y > 196) sy = 196 + (y - 196) * 0.62;                                                          // mento lungo
      return [sx, sy];
    },
    liquida: function (x, y) {
      var cx = FW / 2, cy = 170, dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy) / 140, sx = x, sy = y;
      if (d < 1) { var a = 1.15 * (1 - d) * (1 - d), co = Math.cos(a), si = Math.sin(a); sx = cx + dx * co - dy * si; sy = cy + dx * si + dy * co; }
      return [sx + 7 * Math.sin(y / 14), sy + 6 * Math.sin(x / 19) + 5 * Math.sin(x / 9 + y / 31)];
    },
    cono: function (x, y) {
      var S = 0.74, e = MENTO - (MENTO - OCCHI) * S, k = (e - (MENTO - (MENTO - 30) * S)) / e, xs = x, ys = y;
      if (y < e) { var t = (e - y) / e; ys = e - (e - y) * k; xs = FW / 2 + (x - FW / 2) / Math.max(0.06, 1 - 0.95 * Math.pow(t, 0.9)); }
      return [FW / 2 + (xs - FW / 2) / S, MENTO - (MENTO - ys) / S];
    },
    uovo: function (x, y) {
      var p = lente(x, y, FW / 2, 96, 120, 0.42), sx = p ? p[0] : x, sy = p ? p[1] : y;
      if (y > 165) { var t = liscio((y - 165) / 100); sx = FW / 2 + (sx - FW / 2) * (1 + 1.1 * t); }
      return [sx, sy];
    },
    strega: function (x, y) {
      var p = lente(x, y, FW / 2, NASO + 6, 64, 0.66), sx = x, sy = y;
      if (p) { sx = p[0]; sy = p[1] - 40 * (1 - p[2]) * (1 - p[2]); }   // il naso si allunga in giù
      if (y > 232) sy = 232 + (sy - 232) * 0.76;                          // mento a punta
      return [sx, sy];
    },
    schiaccia: function (x, y) { return [FW / 2 + (x - FW / 2) / 1.32, OV.y + (y - OV.y) / 0.6]; }
  };
  // un punto della foto, con la media dei 4 vicini (bordi tenuti)
  function pesca(d, x, y, out, o) {
    x = lim(x, 0, FW - 1.001); y = lim(y, 0, FH - 1.001);
    var x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = (y0 * FW + x0) * 4, j = i + FW * 4;
    for (var c = 0; c < 3; c++) {
      var a = d[i + c] + (d[i + 4 + c] - d[i + c]) * fx, b = d[j + c] + (d[j + 4 + c] - d[j + c]) * fx;
      out[o + c] = a + (b - a) * fy;
    }
    out[o + 3] = 255;
  }
  // la foto (240×300) col filtro: una tela nuova
  function filtra(base, x) {
    var F = FILTRI[x] || FILTRI[0], cv = tela(FW, FH), c = cv.getContext("2d");
    if (F.id === "orig") { c.drawImage(base, 0, 0, FW, FH); return cv; }
    var src = base.getContext("2d").getImageData(0, 0, FW, FH).data, img = c.createImageData(FW, FH), o = img.data, xx, yy, k;
    if (F.id === "sdoppia") {   // la vista doppia: due facce sovrapposte, una rossa e una azzurra (4 occhi!)
      var A = new Float32Array(4), B = new Float32Array(4);
      for (yy = 0; yy < FH; yy++) for (xx = 0; xx < FW; xx++) {
        k = (yy * FW + xx) * 4;
        pesca(src, xx + 21, yy + 3, A, 0); pesca(src, xx - 21, yy - 3, B, 0);
        o[k] = A[0] * 0.66 + B[0] * 0.34; o[k + 1] = A[1] * 0.36 + B[1] * 0.64; o[k + 2] = A[2] * 0.42 + B[2] * 0.58; o[k + 3] = 255;
      }
    } else {
      var M = MAPPE[F.id];
      for (yy = 0; yy < FH; yy++) for (xx = 0; xx < FW; xx++) { var p = M(xx + 0.5, yy + 0.5); pesca(src, p[0] - 0.5, p[1] - 0.5, o, (yy * FW + xx) * 4); }
    }
    if (F.id === "giga") {   // bianco e nero, tanto contrasto: il meme
      for (k = 0; k < o.length; k += 4) { var g = lim((0.3 * o[k] + 0.59 * o[k + 1] + 0.11 * o[k + 2] - 128) * 1.6 + 128 + 6, 0, 255); o[k] = g; o[k + 1] = g; o[k + 2] = g * 1.02; }
    }
    if (F.id === "strega") {   // pelle verde
      for (k = 0; k < o.length; k += 4) { o[k] = o[k] * 0.7; o[k + 1] = lim(o[k + 1] * 1.06 + 20, 0, 255); o[k + 2] = o[k + 2] * 0.6; }
    }
    c.putImageData(img, 0, 0);
    if (F.id === "anime") {   // i riflessi negli occhi e le guance rosa
      [-1, 1].forEach(function (s) {
        var ex = FW / 2 + s * OCC_DX;
        c.fillStyle = "rgba(255,120,160,.33)"; c.beginPath(); c.ellipse(ex + s * 8, 196, 17, 8, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(255,255,255,.95)"; c.beginPath(); c.arc(ex - 9, OCCHI - 10, 7, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(ex + 8, OCCHI + 6, 3.4, 0, Math.PI * 2); c.fill();
      });
    }
    if (F.id === "uovo") {   // il lucido del guscio
      var gl = c.createRadialGradient(96, 84, 2, 96, 84, 34); gl.addColorStop(0, "rgba(255,255,255,.55)"); gl.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gl; c.beginPath(); c.ellipse(96, 84, 34, 20, -0.45, 0, Math.PI * 2); c.fill();
    }
    if (F.id === "strega") {   // il porro sul naso
      c.fillStyle = "#5b3a1e"; c.beginPath(); c.arc(140, 214, 6.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(138, 212, 2.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#2b1a0c"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(141, 209); c.lineTo(144, 203); c.moveTo(143, 211); c.lineTo(149, 208); c.stroke();
    }
    return cv;
  }
  // l'ovale della faccia ritagliato (angoli trasparenti), grande w×h
  function ovale(cv, w, h, bordo) {
    w = w || FW; h = h || FH;
    var o = tela(w, h), c = o.getContext("2d"), kx = w / FW, ky = h / FH;
    c.save(); c.beginPath(); c.ellipse(OV.x * kx, OV.y * ky, OV.rx * kx, OV.ry * ky, 0, 0, Math.PI * 2); c.clip();
    c.drawImage(cv, 0, 0, w, h); c.restore();
    if (bordo) { c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = Math.max(1.5, 3 * kx); c.beginPath(); c.ellipse(OV.x * kx, OV.y * ky, OV.rx * kx - 1, OV.ry * ky - 1, 0, 0, Math.PI * 2); c.stroke(); }
    return o;
  }

  // =========================================================
  //  LE FOTO DEI GIOCATORI (solo in memoria: mai salvate per gli altri)
  // =========================================================
  var FOTO = {};   // id → { f, base, x, ver, filt: { x: tela }, comp: { chiave: src }, pend: {} }
  var VER = 0;
  function metti(id, f, base, x) {
    var b = tela(FW, FH); b.getContext("2d").drawImage(base, 0, 0, FW, FH);
    FOTO[id] = { f: f, base: b, x: lim(x | 0, 0, FILTRI.length - 1), ver: ++VER, filt: {}, comp: {}, pend: {} };
    avvisa(id);
  }
  function filtro(id, x) { var F = FOTO[id]; x = lim(x | 0, 0, FILTRI.length - 1); if (!F || F.x === x) return; F.x = x; F.ver = ++VER; avvisa(id); }
  function togli(id) { if (FOTO[id]) { delete FOTO[id]; avvisa(id); } }
  function svuota() { var ids = Object.keys(FOTO); FOTO = {}; ids.forEach(avvisa); }
  function ha(id, f) { return !!(FOTO[id] && (f == null || FOTO[id].f === f)); }
  function ver(id) { return FOTO[id] ? FOTO[id].ver : 0; }
  function filtrata(F, x) { return F.filt[x] || (F.filt[x] = filtra(F.base, x)); }
  // chi usa le facce viene avvisato quando una foto (o un suo ritratto) è pronta: aggiorna solo le immagini di quel giocatore
  var daAvvisare = {}, tAvv = null;
  function avvisa(id) {
    daAvvisare[id] = 1;
    if (tAvv) return;
    tAvv = setTimeout(function () { var l = Object.keys(daAvvisare); daAvvisare = {}; tAvv = null; l.forEach(function (i) { try { if (API.onCambio) API.onCambio(i); } catch (e) {} }); }, 30);
  }

  // ---------- il ritratto: il corpo dell'avatar (col costume del posto) e la foto al posto della testa ----------
  function copia(o) { var c = {}; for (var k in o) c[k] = o[k]; return c; }
  var PIU_OK = { cappello: 1, occhiali: 1, collo: 1, mano: 1, schiena: 1, animale: 1, pittura: 1, stampa: 1 };
  function cfgDi(p, o) {
    var cfg = copia(p && p.omino && typeof p.omino === "object" ? p.omino : (window.SGOmino ? SGOmino.casuale((p && (p.nome || p.id)) || "?") : {}));
    var A = window.SG_CDN_ARTE || {}, cs = o.posto && A.COSTUMI && A.COSTUMI[o.posto];
    var occhiali = null, segno = null;
    cfg.cappello = "nessuno";   // (il cappello dell'avatar no: si vede la testa vera, e i filtri come la Testa a Cono; quello del costume sì)
    if (cs) { cs = copia(cs); occhiali = cs.occhiali || null; segno = cs.segno || null; delete cs.occhiali; delete cs.segno; for (var k in cs) cfg[k] = cs[k]; }
    if (o.piu) for (var q in o.piu) if (PIU_OK[q] && window.SGOmino && SGOmino.OPZ[q] && SGOmino.OPZ[q].indexOf(o.piu[q]) >= 0) { if (q === "occhiali") occhiali = o.piu[q]; else cfg[q] = o.piu[q]; }
    cfg.occhiali = "nessuno";   // gli occhiali li mette la foto (sopra i suoi occhi veri)
    return { cfg: cfg, occhiali: occhiali, segno: segno };
  }
  // la scala del disegno: busto (178×182 attorno alla testa) o intero (200×264)
  function geo(intero, w, h) {
    if (intero) {
      var sx = w / 200, sy = h / 264, X = function (x) { return (100 + (x - 100) * KT) * sx; }, Y = function (y) { return (150 + (y - 150) * KT) * sy; };
      return { x: X(AV.x), y: Y(AV.y), rx: AV.rx * KT * sx, ry: AV.ry * KT * sy, Y: Y };
    }
    var bx = w / 178, by = h / 182, Yb = function (y) { return (y + 6) * by; };
    return { x: (AV.x - 11) * bx, y: Yb(AV.y), rx: AV.rx * bx, ry: AV.ry * by, Y: Yb };
  }
  var IMG_SVG = {};   // le immagini dei corpi già caricate (per non ricaricarle)
  function svgImg(src, cb) {
    var I = IMG_SVG[src];
    if (I && I.ok) return cb(I.img);
    if (I) { I.attesa.push(cb); return; }
    if (Object.keys(IMG_SVG).length > 80) IMG_SVG = {};
    I = IMG_SVG[src] = { img: new Image(), ok: false, attesa: [cb] };
    I.img.onload = function () { I.ok = true; var a = I.attesa; I.attesa = []; a.forEach(function (f) { f(I.img); }); };
    I.img.onerror = function () { var a = I.attesa; delete IMG_SVG[src]; a.forEach(function (f) { f(null); }); };
    I.img.src = src;
  }
  function emojiSu(c, e, x, y, s, rot) {
    c.save(); c.translate(x, y); if (rot) c.rotate(rot);
    c.font = Math.round(s) + "px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(e, 0, 0); c.restore();
  }
  function componi(F, x, p, o, cb) {
    if (!window.SGOmino) return cb(null);
    var intero = !!o.intero, d = cfgDi(p, o), opz = intero ? {} : { busto: true };
    if (intero && o.braccia) opz.braccia = o.braccia;
    var src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(d.cfg, opz));
    svgImg(src, function (im) {
      if (!im) return cb(null);
      var w = intero ? 300 : 356, h = intero ? 396 : 364, cv = tela(w, h), c = cv.getContext("2d"), G = geo(intero, w, h);
      try { c.drawImage(im, 0, 0, w, h); } catch (e) {}
      // la foto nell'ovale della testa, con un bordino chiaro (come una faccia ritagliata e incollata)
      var ph = filtrata(F, x), kx = G.rx / OV.rx, ky = G.ry / OV.ry;
      c.save(); c.beginPath(); c.ellipse(G.x, G.y, G.rx, G.ry, 0, 0, Math.PI * 2); c.clip();
      c.drawImage(ph, G.x - OV.x * kx, G.y - OV.y * ky, FW * kx, FH * ky); c.restore();
      c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = Math.max(2, w / 120); c.beginPath(); c.ellipse(G.x, G.y, G.rx, G.ry, 0, 0, Math.PI * 2); c.stroke();
      // il cappello del costume torna sopra la foto
      var cap = d.cfg.cappello;
      if (cap && cap !== "nessuno") {
        var riga = LINEA[cap] != null ? G.Y(LINEA[cap] + 4) : G.Y(AV.y - AV.ry + 2);
        c.save(); c.beginPath(); c.rect(0, 0, w, riga); c.clip(); try { c.drawImage(im, 0, 0, w, h); } catch (e) {} c.restore();
      }
      // gli occhiali del costume (o della carta) sugli occhi veri, e il cerotto
      var oc = OCCHI_F[FILTRI[x].id] || [OCCHI, 1], ey = G.y + (oc[0] - OV.y) * ky, edx = OCC_DX * oc[1] * kx;
      var occ = { sole: "🕶️", aviatore: "🕶️", quadrati: "👓", tondi: "👓", stelle: "⭐", cuore: "❤️" }[d.occhiali];
      if (d.occhiali === "stelle" || d.occhiali === "cuore") { emojiSu(c, occ, G.x - edx, ey, edx * 1.5); emojiSu(c, occ, G.x + edx, ey, edx * 1.5); }
      else if (d.occhiali === "mascherina") { var my = ey - edx * 1.45; c.fillStyle = "#3b2f6b"; c.beginPath(); c.ellipse(G.x, my, edx * 2.1, edx * 0.6, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#fff"; c.font = "bold " + Math.round(edx * 0.5) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("z z z", G.x, my); }   // (la mascherina tirata su, sulla fronte)
      else if (occ) emojiSu(c, occ, G.x, ey, edx * 2.5);
      if (d.segno === "cerotto") emojiSu(c, "🩹", G.x + edx * 1.2, ey + edx * 1.5, edx * 0.9, 0.5);
      var url = ""; try { url = cv.toDataURL("image/png"); } catch (e) {}
      cb(url || null);
    });
  }
  // il punto unico (chiamato da SG_CDN_ARTE.faccia): src del ritratto con la foto, o null (allora si usa l'avatar)
  function variante(F, o, p) {
    var x = o.faccia && ESPR[o.faccia] != null ? IDX[ESPR[o.faccia]] : F.x;
    var br = o.intero && o.faccia && window.SG_CDN_ARTE && SG_CDN_ARTE.FACCE && SG_CDN_ARTE.FACCE[o.faccia] ? SG_CDN_ARTE.FACCE[o.faccia].braccia || "" : "";
    return { x: x, br: br, k: [x, o.posto || "", o.intero ? 1 : 0, br, o.piu ? JSON.stringify(o.piu) : "", p.omino ? JSON.stringify(p.omino).length : 0].join("|") };
  }
  // il ritratto esatto è già pronto? (se no lo prepara: chi aspetta riprova tra un attimo)
  function pronta(id, o, p) { var F = FOTO[id]; if (!F || API.spente) return true; o = o || {}; p = p || { id: id }; if (F.comp[variante(F, o, p).k]) return true; fotoDi(id, o, p); return false; }
  function fotoDi(id, o, p) {
    var F = FOTO[id]; if (!F || API.spente) return null;
    o = o || {}; p = p || { id: id };
    var V = variante(F, o, p), x = V.x, br = V.br, k = V.k;
    if (F.comp[k]) return F.comp[k];
    if (!F.pend[k]) {
      F.pend[k] = 1;
      var f0 = F.f;
      componi(F, x, p, { posto: o.posto, intero: o.intero, braccia: br || null, piu: o.piu }, function (url) {
        delete F.pend[k];
        if (FOTO[id] !== F || F.f !== f0 || !url) return;
        F.comp[k] = url; avvisa(id);
      });
    }
    // intanto: il ritratto semplice, se c'è già (meglio della faccia dell'avatar)
    var k0 = [F.x, "", o.intero ? 1 : 0, "", "", k.split("|")[5]].join("|");
    return F.comp[k0] || null;
  }

  // =========================================================
  //  LA CHIAVE E LA CIFRATURA (AES-GCM, WebCrypto)
  // =========================================================
  function aB64(b) { var s = "", i, n = 0x8000; for (i = 0; i < b.length; i += n) s += String.fromCharCode.apply(null, b.subarray(i, i + n)); return btoa(s); }
  function daB64(s) { var t = atob(String(s).replace(/-/g, "+").replace(/_/g, "/")), b = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; }
  function puoCifrare() { try { return !!(window.crypto && crypto.subtle && crypto.getRandomValues && window.TextEncoder); } catch (e) { return false; } }
  // la chiave del link (22 caratteri) → { key, kf } (kf = l'impronta: 8 cifre, dice se due telefoni hanno la stessa chiave)
  function importa(kStr) {
    if (!kStr || !puoCifrare()) return Promise.resolve(null);
    var raw; try { raw = daB64(kStr + "=="); } catch (e) { return Promise.resolve(null); }
    if (raw.length !== 16) return Promise.resolve(null);
    return Promise.all([crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]), crypto.subtle.digest("SHA-256", raw)]).then(function (r) {
      var h = new Uint8Array(r[1]), kf = ""; for (var i = 0; i < 4; i++) kf += (h[i] < 16 ? "0" : "") + h[i].toString(16);
      return { key: r[0], kf: kf };
    }).catch(function () { return null; });
  }
  // cifra i byte (con un "iv" nuovo ogni volta; ad = il numero della foto, legato al testo cifrato)
  function cifra(key, bytes, ad) {
    var iv = new Uint8Array(12); crypto.getRandomValues(iv);
    return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, additionalData: new TextEncoder().encode("cn|" + ad) }, key, bytes).then(function (c) { return { iv: aB64(iv), c: aB64(new Uint8Array(c)) }; });
  }
  function decifra(key, iv, c, ad) {
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: daB64(iv), additionalData: new TextEncoder().encode("cn|" + ad) }, key, daB64(c)).then(function (b) { return new Uint8Array(b); });
  }
  // la foto piccola: JPEG leggero (byte) e ritorno (byte → tela 240×300)
  function jpeg(cv) { var s = cv.toDataURL("image/jpeg", 0.68); return daB64(s.slice(s.indexOf(",") + 1)); }
  function daJpeg(bytes, cb) {
    var url = null, im = new Image();
    try { url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" })); } catch (e) { return cb(null); }
    im.onload = function () { var cv = tela(FW, FH); try { cv.getContext("2d").drawImage(im, 0, 0, FW, FH); } catch (e) { cv = null; } URL.revokeObjectURL(url); cb(cv); };
    im.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    im.src = url;
  }

  // =========================================================
  //  IL CAMERINO: «📸 La tua faccia» (selfie con la sagoma, galleria, avatar, i 10 filtri)
  //  o = { base: tela (la foto di adesso) | null, x, avatar: src dell'avatar, filtri: true (apri sui filtri),
  //        onFatto({ base, x } | { avatar: true }), onChiudi() }
  //  → { chiudi(confermaSeCe) }
  // =========================================================
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".cnf{position:fixed;left:0;top:0;width:100%;height:var(--alt,100dvh);z-index:880;display:flex;flex-direction:column;background:radial-gradient(120% 70% at 50% -10%,#5a2ca0 0%,#2a1458 45%,#120a2e 100%);color:#fff;font-family:inherit;user-select:none;-webkit-user-select:none;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);box-sizing:border-box;overflow:hidden;touch-action:none}",
      ".cnf button{font-family:inherit}",
      ".cnf-testa{flex:none;display:flex;align-items:center;gap:8px;padding:8px 10px 4px}",
      ".cnf-testa b{flex:1;font-size:17px;font-weight:900;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cnf-x{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.15);color:#fff;font-size:17px;font-weight:900;cursor:pointer}",
      ".cnf-nota{flex:none;font-size:12.5px;opacity:.85;text-align:center;padding:0 14px;line-height:1.3}",
      ".cnf-palco{flex:1;min-height:0;position:relative;margin:6px 10px;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center}",
      ".cnf-palco.nero{background:#000}",
      ".cnf-palco video,.cnf-palco .cnf-sist{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}",
      ".cnf-palco video{transform:scaleX(-1)}",
      ".cnf-sagoma{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
      ".cnf-conto{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:110px;font-weight:900;text-shadow:0 4px 24px rgba(0,0,0,.6);pointer-events:none}",
      ".cnf-conto.su{animation:cnfConto .6s ease-out both}",
      ".cnf-lampo{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}.cnf-lampo.su{animation:cnfLampo .45s ease-out}",
      ".cnf-grande{height:min(100%,330px);max-width:100%;aspect-ratio:4/5;object-fit:contain;filter:drop-shadow(0 8px 22px rgba(0,0,0,.45))}",
      ".cnf-tondo{height:min(86%,250px);aspect-ratio:1;border-radius:50%;object-fit:cover;object-position:50% 38%;background:radial-gradient(#fff6d8,#ffb84a);box-shadow:0 0 0 5px #ffcf3f,0 0 34px 8px rgba(255,207,63,.45)}",
      ".cnf-nome{position:absolute;left:0;right:0;bottom:6px;text-align:center;font-weight:900;font-size:16px;text-shadow:0 2px 8px rgba(0,0,0,.6)}",
      ".cnf-filtri{flex:none;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:0 10px}",
      ".cnf-f{position:relative;border:0;border-radius:12px;background:rgba(255,255,255,.1);padding:3px 2px 2px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;min-width:0}",
      ".cnf-f canvas{width:100%;max-width:58px;aspect-ratio:4/5;height:auto}",
      ".cnf-f span{font-size:9.5px;font-weight:800;line-height:1.1;height:2.2em;overflow:hidden;text-align:center}",
      ".cnf-f.on{background:#ffcf3f;color:#2a1458;box-shadow:0 0 0 2px #fff inset}",
      ".cnf-piede{flex:none;display:flex;gap:8px;padding:8px 10px 10px}",
      ".cnf-piede.col{flex-direction:column}",
      ".cnf-piede .riga{display:flex;gap:8px}",
      ".cnf-b{flex:1;min-height:52px;border:0;border-radius:16px;font-weight:900;font-size:16px;color:#fff;background:rgba(255,255,255,.16);cursor:pointer;padding:6px 8px}",
      ".cnf-b.oro{background:linear-gradient(#ffd84d,#f2a900);color:#2a1458;box-shadow:0 4px 0 #b37d00}",
      ".cnf-b.verde{background:linear-gradient(#4be08a,#21a35a);box-shadow:0 4px 0 #13703b}",
      ".cnf-b:disabled{opacity:.45}",
      ".cnf-scatto{flex:none;width:78px;height:78px;border-radius:50%;border:6px solid #fff;background:#ff4d6d;box-shadow:0 0 0 4px rgba(255,77,109,.4);cursor:pointer;margin:0 6px;font-size:26px}",
      ".cnf-zoom{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px}",
      ".cnf-zoom button{width:44px;height:44px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;font-size:24px;font-weight:900}",
      "@keyframes cnfConto{0%{opacity:0;transform:scale(1.8)}30%{opacity:1}100%{opacity:.9;transform:scale(1)}}",
      "@keyframes cnfLampo{0%{opacity:.9}100%{opacity:0}}"
    ].join("");
    document.head.appendChild(st);
  }
  function el(tag, attrs, figli) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (attrs[k] == null) continue; if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (figli || []).forEach(function (f) { if (f) e.appendChild(f); });
    return e;
  }
  // un tasto che risponde al primo tocco e vibra (si sceglie qualcosa)
  function tasto(classe, testo, fn, novibra) {
    var b = el("button", { class: "cnf-b " + (classe || ""), type: "button", text: testo }), giu = false;
    b.addEventListener("pointerdown", function (e) { if (b.disabled) return; giu = true; e.preventDefault(); });
    b.addEventListener("pointerup", function (e) { if (!giu || b.disabled) return; giu = false; e.preventDefault(); if (!novibra) vibra(10); fn(e); });
    b.addEventListener("pointercancel", function () { giu = false; });
    b.addEventListener("pointerleave", function () { giu = false; });
    b.addEventListener("click", function (e) { if (e.detail === 0 && !b.disabled) fn(e); });
    return b;
  }

  var CAM = null;   // il camerino aperto (uno solo)
  function camerino(o) {
    o = o || {};
    if (CAM) CAM.chiudi(false);
    stile();
    var C = { stato: null, base: o.base || null, x: o.x | 0, stream: null, vivo: true, tm: [] };
    var root = el("div", { class: "cnf", role: "dialog" });
    var tit = el("b", { text: "📸 La tua faccia per stasera" });
    var bx = el("button", { class: "cnf-x", type: "button", "aria-label": "Chiudi", text: "✕" });
    bx.addEventListener("click", function () { chiudi(false); });
    var nota = el("div", { class: "cnf-nota" });
    var palco = el("div", { class: "cnf-palco" });
    var piede = el("div", { class: "cnf-piede" });
    root.appendChild(el("div", { class: "cnf-testa" }, [tit, bx])); root.appendChild(nota); root.appendChild(palco); root.appendChild(piede);
    var file = el("input", { type: "file", accept: "image/*", style: "display:none" });
    root.appendChild(file);
    file.addEventListener("change", function () { var f = file.files && file.files[0]; file.value = ""; if (f) daFile(f); });
    document.body.appendChild(root);
    function dopo(ms, fn) { C.tm.push(setTimeout(function () { if (C.vivo) fn(); }, ms)); }
    function pulisci() { if (C.griglia && C.griglia.parentNode) C.griglia.parentNode.removeChild(C.griglia); C.griglia = null; palco.className = "cnf-palco"; while (palco.firstChild) palco.removeChild(palco.firstChild); while (piede.firstChild) piede.removeChild(piede.firstChild); piede.className = "cnf-piede"; fermaCamera(); }
    function fermaCamera() { if (C.stream) { try { C.stream.getTracks().forEach(function (tr) { tr.stop(); }); } catch (e) {} C.stream = null; } }

    // ---- 1. la scelta: selfie, galleria o avatar ----
    function scelta(msg) {
      pulisci(); C.stato = "scelta"; tit.textContent = "📸 La tua faccia per stasera";
      nota.textContent = msg || "La vedono solo gli amici entrati dal link della serata, e sparisce quando uscite dal gioco.";
      var im = el("img", { class: "cnf-tondo", alt: "" });
      if (C.base) { im.src = ovale(filtrata({ base: C.base, filt: C.filt || (C.filt = {}) }, C.x), FW, FH, true).toDataURL("image/png"); im.className = "cnf-grande"; }
      else if (o.avatar) im.src = o.avatar;
      palco.appendChild(im);
      piede.className = "cnf-piede col";
      piede.appendChild(el("div", { class: "riga" }, [tasto("oro", "🤳 Selfie", function () { camera(); }), tasto("", "🖼️ Dalla galleria", function () { file.click(); })]));
      piede.appendChild(el("div", { class: "riga" }, [
        C.base ? tasto("verde", "✅ Tengo questa", function () { filtri(); }) : null,
        tasto("", "🙂 Uso l'avatar", function () { fatto(true); })].filter(Boolean)));
    }

    // ---- 2. la fotocamera frontale con la sagoma ovale (occhi, naso e bocca) ----
    function riquadro() {
      var r = palco.getBoundingClientRect(), W = r.width, H = r.height;
      var fh = Math.min(H * 0.9, W * 0.9 * 1.25), fw = fh * 0.8;
      return { W: W, H: H, x: (W - fw) / 2, y: (H - fh) / 2, w: fw, h: fh };
    }
    function sagoma(R) {
      var k = R.w / FW, cx = R.x + OV.x * k, cy = R.y + OV.y * k, rx = OV.rx * k, ry = OV.ry * k, ey = R.y + OCCHI * k, ed = OCC_DX * k;
      var ns = "http://www.w3.org/2000/svg", id = "cnfm" + Math.floor(Math.random() * 1e6);
      var s = '<svg xmlns="' + ns + '" class="cnf-sagoma" viewBox="0 0 ' + R.W + " " + R.H + '"><defs><mask id="' + id + '"><rect width="100%" height="100%" fill="#fff"/>' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#000"/></mask></defs>' +
        '<rect width="100%" height="100%" fill="rgba(18,10,46,.66)" mask="url(#' + id + ')"/>' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="12 8"/>' +
        '<g stroke="#ffcf3f" stroke-width="3" stroke-linecap="round" fill="none" opacity=".9">' +
        '<path d="M' + (cx - ed - 14 * k) + "," + ey + " h" + (28 * k) + " M" + (cx + ed - 14 * k) + "," + ey + " h" + (28 * k) + '"/>' +
        '<path d="M' + cx + "," + (R.y + (NASO - 18) * k) + " v" + (18 * k) + '" opacity=".7"/>' +
        '<path d="M' + (cx - 20 * k) + "," + (R.y + BOCCA * k) + " q" + (20 * k) + "," + (9 * k) + " " + (40 * k) + ',0" opacity=".7"/></g></svg>';
      var d = document.createElement("div"); d.innerHTML = s; return d.firstChild;
    }
    function camera() {
      pulisci(); C.stato = "camera"; tit.textContent = "🤳 Metti la faccia nell'ovale";
      nota.textContent = "Occhi sulle lineette gialle, naso in mezzo. Poi tocca il tasto rosso.";
      palco.classList.add("nero");
      var v = el("video", { autoplay: "", playsinline: "", muted: "" }); v.muted = true; v.playsInline = true;
      palco.appendChild(v);
      var conto = el("div", { class: "cnf-conto" }), lampo = el("div", { class: "cnf-lampo" });
      var scatto = el("button", { class: "cnf-scatto", type: "button", "aria-label": "Scatta" });
      var annulla = tasto("", "↩ Indietro", function () { scelta(); });
      piede.appendChild(annulla); piede.appendChild(scatto); piede.appendChild(tasto("", "🖼️ Galleria", function () { file.click(); }));
      scatto.disabled = true;
      var sag = null;
      function disegnaSagoma() { if (sag && sag.parentNode) sag.parentNode.removeChild(sag); sag = sagoma(riquadro()); palco.insertBefore(sag, conto.parentNode ? conto : null); }
      palco.appendChild(conto); palco.appendChild(lampo);
      disegnaSagoma(); dopo(80, disegnaSagoma);
      var md = navigator.mediaDevices;
      if (!md || !md.getUserMedia) return nienteCamera();
      md.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } }, audio: false }).then(function (s) {
        if (!C.vivo || C.stato !== "camera") { s.getTracks().forEach(function (tr) { tr.stop(); }); return; }
        C.stream = s; v.srcObject = s;
        var p = v.play(); if (p && p.catch) p.catch(function () {});
        scatto.disabled = false;
      }).catch(function () { nienteCamera(); });
      var giu = false;
      scatto.addEventListener("pointerdown", function (e) { if (!scatto.disabled) { giu = true; e.preventDefault(); } });
      scatto.addEventListener("pointerup", function (e) { if (!giu) return; giu = false; e.preventDefault(); scatta(); });
      scatto.addEventListener("click", function (e) { if (e.detail === 0) scatta(); });
      function scatta() {
        if (scatto.disabled || !C.stream) return;
        vibra(12); scatto.disabled = true;
        [3, 2, 1].forEach(function (n, i) { dopo(i * 620, function () { conto.textContent = String(n); conto.classList.remove("su"); void conto.offsetWidth; conto.classList.add("su"); }); });
        dopo(3 * 620, function () {
          conto.textContent = ""; lampo.classList.remove("su"); void lampo.offsetWidth; lampo.classList.add("su");
          var R = riquadro(), vw = v.videoWidth, vh = v.videoHeight;
          if (!vw || !vh) { scatto.disabled = false; return; }
          var s = Math.max(R.W / vw, R.H / vh), ox = (R.W - vw * s) / 2, oy = (R.H - vh * s) / 2;
          // (il video si vede a specchio: la foto resta come la vedi)
          var sx = (R.W - (R.x + R.w) - ox) / s, sy = (R.y - oy) / s, sw = R.w / s, sh = R.h / s;
          var cv = tela(FW, FH), c = cv.getContext("2d");
          c.translate(FW, 0); c.scale(-1, 1);
          try { c.drawImage(v, sx, sy, sw, sh, 0, 0, FW, FH); } catch (e) { scatto.disabled = false; return; }
          C.base = cv; C.filt = {}; vibra(20);
          dopo(260, function () { fermaCamera(); filtri(); });
        });
      }
    }
    function nienteCamera() {
      fermaCamera();
      if (!C.vivo) return;
      // niente fotocamera dal vivo (permesso negato o telefono che non la dà): si usa quella del telefono, o la galleria
      scelta("📷 La fotocamera non si apre qui: tocca «Dalla galleria» e scegli una foto (o scattala col telefono).");
    }

    // ---- 2b. una foto dalla galleria: si sposta e si ingrandisce dentro l'ovale ----
    function daFile(f) {
      var url = null; try { url = URL.createObjectURL(f); } catch (e) { return; }
      var im = new Image();
      im.onload = function () {
        // (le foto grandi si rimpiccioliscono subito: niente lentezza mentre si sposta)
        var m = Math.max(im.width, im.height), k = m > 1400 ? 1400 / m : 1, cv = tela(Math.round(im.width * k), Math.round(im.height * k));
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
        if (C.vivo) sistema(cv);
      };
      im.onerror = function () { URL.revokeObjectURL(url); if (C.vivo) scelta("Questa foto non si apre: provane un'altra."); };
      im.src = url;
    }
    function sistema(img) {
      pulisci(); C.stato = "sistema"; tit.textContent = "🖐️ Sistema la faccia nell'ovale";
      nota.textContent = "Trascina col dito e ingrandisci: occhi sulle lineette gialle.";
      palco.classList.add("nero");
      var cv = el("canvas", { class: "cnf-sist" }); palco.appendChild(cv);
      var R = null, z = 1, tx = 0, ty = 0, base = 1;
      function misura() {
        R = riquadro(); var dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(R.W * dpr); cv.height = Math.round(R.H * dpr);
        base = Math.max(R.w / img.width, R.h / img.height);   // la foto copre il riquadro
        var sg = sagoma(R); palco.appendChild(sg);
      }
      function disegna() {
        var c = cv.getContext("2d"), k = cv.width / R.W, s = base * z;
        c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "#000"; c.fillRect(0, 0, cv.width, cv.height);
        c.setTransform(k, 0, 0, k, 0, 0);
        c.drawImage(img, R.x + R.w / 2 - img.width * s / 2 + tx, R.y + R.h / 2 - img.height * s / 2 + ty, img.width * s, img.height * s);
      }
      misura(); disegna();
      var punti = {}, d0 = 0, z0 = 1;
      cv.addEventListener("pointerdown", function (e) { punti[e.pointerId] = [e.clientX, e.clientY]; try { cv.setPointerCapture(e.pointerId); } catch (_) {} var k = Object.keys(punti); if (k.length === 2) { d0 = dist(); z0 = z; } e.preventDefault(); });
      cv.addEventListener("pointermove", function (e) {
        var p = punti[e.pointerId]; if (!p) return;
        var k = Object.keys(punti);
        if (k.length === 1) { tx += e.clientX - p[0]; ty += e.clientY - p[1]; }
        punti[e.pointerId] = [e.clientX, e.clientY];
        if (k.length === 2 && d0) z = lim(z0 * dist() / d0, 0.5, 6);
        disegna();
      });
      function su(e) { delete punti[e.pointerId]; d0 = 0; }
      cv.addEventListener("pointerup", su); cv.addEventListener("pointercancel", su);
      function dist() { var k = Object.keys(punti), a = punti[k[0]], b = punti[k[1]]; return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)) || 1; }
      var zm = el("div", { class: "cnf-zoom" }, [el("button", { type: "button", text: "+" }), el("button", { type: "button", text: "−" })]);
      zm.children[0].addEventListener("click", function () { z = lim(z * 1.15, 0.5, 6); disegna(); });
      zm.children[1].addEventListener("click", function () { z = lim(z / 1.15, 0.5, 6); disegna(); });
      palco.appendChild(zm);
      piede.appendChild(tasto("", "↩ Un'altra", function () { scelta(); }));
      piede.appendChild(tasto("oro", "✅ Così", function () {
        var s = base * z, x0 = R.x + R.w / 2 - img.width * s / 2 + tx, y0 = R.y + R.h / 2 - img.height * s / 2 + ty;
        var out = tela(FW, FH), c = out.getContext("2d"); c.fillStyle = "#222"; c.fillRect(0, 0, FW, FH);
        c.drawImage(img, (R.x - x0) / s, (R.y - y0) / s, R.w / s, R.h / s, 0, 0, FW, FH);
        C.base = out; C.filt = {}; filtri();
      }));
    }

    // ---- 3. i filtri: la tua faccia grande e le 10 miniature (ognuna col suo filtro) ----
    function filtri() {
      pulisci(); C.stato = "filtri"; tit.textContent = "🎭 Scegli il filtro";
      nota.textContent = "Lo puoi cambiare quando vuoi, anche in saletta.";
      var F = { base: C.base, filt: C.filt || (C.filt = {}) };
      var grande = el("img", { class: "cnf-grande", alt: "" }), nome = el("div", { class: "cnf-nome" });
      palco.appendChild(grande); palco.appendChild(nome);
      function mostra() { grande.src = ovale(filtrata(F, C.x), FW, FH, true).toDataURL("image/png"); nome.textContent = FILTRI[C.x].e + " " + FILTRI[C.x].nome; }
      mostra();
      var griglia = el("div", { class: "cnf-filtri" }), tasti = [];
      FILTRI.forEach(function (f, i) {
        var mini = el("canvas"); mini.width = 58; mini.height = 72;
        var b = el("button", { class: "cnf-f" + (i === C.x ? " on" : ""), type: "button", "aria-label": f.nome }, [mini, el("span", { text: f.nome })]);
        var giu = false;
        b.addEventListener("pointerdown", function (e) { giu = true; e.preventDefault(); });
        b.addEventListener("pointerup", function (e) { if (!giu) return; giu = false; e.preventDefault(); scegli(i); });
        b.addEventListener("pointerleave", function () { giu = false; });
        b.addEventListener("click", function (e) { if (e.detail === 0) scegli(i); });
        b._mini = mini; tasti.push(b); griglia.appendChild(b);
      });
      root.insertBefore(griglia, piede);
      C.griglia = griglia;
      function scegli(i) { if (C.x === i) return; C.x = i; vibra(10); tasti.forEach(function (b, j) { b.classList.toggle("on", j === i); }); mostra(); }
      // le miniature una alla volta (il telefono non si blocca)
      var ordine = FILTRI.map(function (f, i) { return i; }), q = 0;
      (function una() {
        if (!C.vivo || C.stato !== "filtri" || q >= ordine.length) return;
        var i = ordine[q++], m = tasti[i]._mini;
        try { m.getContext("2d").drawImage(ovale(filtrata(F, i), 58, 72), 0, 0); } catch (e) {}
        dopo(16, una);
      })();
      piede.appendChild(tasto("", "📸 Rifai", function () { scelta(); }));
      piede.appendChild(tasto("verde", "✅ Fatto", function () { fatto(false); }));
    }

    function fatto(avatar) {
      var r = avatar || !C.base ? { avatar: true } : { base: C.base, x: C.x };
      chiudi(false, true);
      try { if (o.onFatto) o.onFatto(r); } catch (e) {}
    }
    // chiudi(conferma): se la foto è già fatta (sui filtri) e conferma, la si tiene così
    function chiudi(conferma, giaFatto) {
      if (!C.vivo) return;
      var tieni = conferma && C.base && C.stato === "filtri" && !giaFatto;
      C.vivo = false; fermaCamera(); C.tm.forEach(clearTimeout);
      if (C.griglia && C.griglia.parentNode) C.griglia.parentNode.removeChild(C.griglia);
      if (root.parentNode) root.parentNode.removeChild(root);
      if (CAM === ctrl) CAM = null;
      if (tieni) { try { if (o.onFatto) o.onFatto({ base: C.base, x: C.x }); } catch (e) {} }
      else if (!giaFatto) { try { if (o.onChiudi) o.onChiudi(); } catch (e) {} }
    }
    var ctrl = { chiudi: chiudi, aperto: function () { return C.vivo; }, stato: function () { return C.stato; } };
    CAM = ctrl;
    if (o.filtri && C.base) filtri(); else scelta();
    return ctrl;
  }

  var API = window.SG_CDN_FOTO = {
    FILTRI: FILTRI, W: FW, H: FH,
    filtra: filtra, ovale: ovale,
    metti: metti, filtro: filtro, togli: togli, svuota: svuota, ha: ha, ver: ver, pronta: pronta,
    importa: importa, cifra: cifra, decifra: decifra, puoCifrare: puoCifrare, jpeg: jpeg, daJpeg: daJpeg, aB64: aB64, daB64: daB64,
    camerino: camerino, aperto: function () { return !!(CAM && CAM.aperto()); }, chiudiCamerino: function (conferma) { if (CAM) CAM.chiudi(!!conferma); },
    spente: false,        // l'host ha spento le foto: tutti con l'avatar
    onCambio: null        // function (id): una foto (o un suo ritratto) è pronta o è cambiata
  };
  // il punto d'aggancio lasciato in js/chidinoi-arte.js
  function aggancia() { if (window.SG_CDN_ARTE) SG_CDN_ARTE.foto = fotoDi; }
  aggancia();
  if (!window.SG_CDN_ARTE) setTimeout(aggancia, 0);
})();
