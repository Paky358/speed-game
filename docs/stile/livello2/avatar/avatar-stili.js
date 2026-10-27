/* =========================================================
   SPeeD GAME — PROVE DI STILE PER GLI AVATAR (livello 2)
   Solo disegni da confrontare: il gioco NON usa questo file.
   Legge l'avatar di oggi (SGOmino.casuale + norm) e lo ridisegna in un altro stile:
     AV.disegna(nome, stile, vista, p) -> stringa SVG
       stile: "A" Mii rifinito · "B" 3D morbido · "C" Illustrazione da rivista · "D" Fumetto moderno
       vista: "intero" (in piedi, viewBox 200×264 come oggi) o "busto" (la faccina tonda)
       p: prefisso degli id (più disegni nella stessa pagina non si pestano i piedi)
   Copre le voci usate da Paky, Luca e Giulia (berretto, pescatore, codini, occhiali, barba, polo, gilet…):
   è una prova di direzione, non il generatore completo.
   ========================================================= */
(function () {
  "use strict";

  // ---------- numeri e colori ----------
  function f(n) { return (Math.round(n * 10) / 10).toString(); }
  function pt(q) { return f(q[0]) + "," + f(q[1]); }
  function rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function hex(c) { return "#" + c.map(function (x) { x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? "0" : "") + x.toString(16); }).join(""); }
  function tono(h, a) { return hex(rgb(h).map(function (x) { return a > 0 ? x + (255 - x) * a : x * (1 + a); })); }   // a > 0 schiarisce, a < 0 scurisce
  function misto(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function hsl(h) {
    var c = rgb(h).map(function (v) { return v / 255; }), mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), l = (mx + mn) / 2, s = 0, H = 0, d = mx - mn;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); H = mx === c[0] ? (c[1] - c[2]) / d + (c[1] < c[2] ? 6 : 0) : (mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4); H /= 6; }
    return [H, s, l];
  }
  function dahsl(H, s, l) {
    function k(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 0.5) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return hex([k(p, q, H + 1 / 3), k(p, q, H), k(p, q, H - 1 / 3)].map(function (v) { return v * 255; }));
  }
  function vivo(h, ds, dl) { var c = hsl(h); return dahsl(c[0], Math.max(0, Math.min(1, c[1] + ds)), Math.max(0, Math.min(1, c[2] + (dl || 0)))); }
  function rnd(seme) { var s = seme >>> 0 || 1; return function () { s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0; s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0; s ^= s >>> 16; return (s >>> 0) / 4294967296; }; }   // caso "fisso"

  // ---------- forme ----------
  function segs(q) {   // curva morbida che passa per tutti i punti (Catmull-Rom): solo i tratti "C", dal primo punto
    var s = "";
    for (var i = 0; i < q.length - 1; i++) {
      var p0 = q[Math.max(0, i - 1)], p1 = q[i], p2 = q[i + 1], p3 = q[Math.min(q.length - 1, i + 2)];
      s += " C" + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + " " + pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + " " + pt(p2);
    }
    return s;
  }
  // tubo morbido lungo una linea (braccia, gambe, sopracciglia): ws = mezze larghezze; fine/inizio "piatto" = taglio dritto (orli)
  function tubo(q, ws, fine, inizio) {
    var L = [], R = [];
    for (var i = 0; i < q.length; i++) {
      var a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      L.push([q[i][0] + nx * ws[i], q[i][1] + ny * ws[i]]); R.push([q[i][0] - nx * ws[i], q[i][1] - ny * ws[i]]);
    }
    var Rr = R.slice().reverse(), r1 = ws[ws.length - 1], r0 = ws[0];
    return "M" + pt(L[0]) + segs(L) + (fine === "piatto" ? " L" + pt(Rr[0]) : " A" + f(r1) + "," + f(r1) + " 0 0,0 " + pt(Rr[0])) + segs(Rr) +
      (inizio === "piatto" ? " Z" : " A" + f(r0) + "," + f(r0) + " 0 0,0 " + pt(L[0]) + " Z");
  }
  function chiusa(q) { return "M" + pt(q[0]) + segs(q.concat([q[0]])) + " Z"; }   // forma chiusa morbida per i punti
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function specchio(q) { return q.map(function (v) { return [-v[0], v[1]]; }); }

  // ---------- l'avatar di oggi, letto dal generatore vero ----------
  function leggi(nome) {
    var O = window.SGOmino, c = O.norm(O.casuale(nome)), K = O.OPZ;
    function col(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }
    return {
      nome: nome, donna: c.forma === "donna", corpo: c.corpo, pelle: col(K.pelle, c.pelle), viso: c.viso,
      capelli: c.capelli, colCap: col(K.colCap, c.colCap), cappello: c.cappello, colAcc: col(K.colAcc, c.colAcc),
      occhiali: c.occhiali, occhi: c.occhi, iride: col(K.iride, c.iride), sopracc: c.sopracc, naso: c.naso, bocca: c.bocca,
      barba: c.barba, segno: c.segno, orecchini: c.orecchini, collo: c.collo, capo: c.capo, maglia: col(K.maglia, c.maglia),
      stampa: c.stampa, sotto: c.sotto, pantaloni: col(K.pantaloni, c.pantaloni), modScarpe: c.modScarpe, scarpe: col(K.scarpe, c.scarpe),
      ombretto: c.ombretto, colOmbretto: col(K.colOmbretto, c.colOmbretto), blush: c.blush, colBlush: col(K.colBlush, c.colBlush)
    };
  }

  // ---------- i quattro stili: proporzioni, testa, colori, ritocchi della faccia ----------
  var STILI = {
    A: {   // Mii rifinito: stesse forme di oggi, senza contorni neri, occhi piccoli e naturali, luce morbida
      G: { hcy: 88, hs: 0.8, nw: 10, shY: 146, shw: 34, shwD: 31, waY: 190, waw: 30, wawD: 27, hiY: 202, hiw: 31, hiwD: 33, kneeY: 222, ankY: 241,
           legX: 15, tw: 12, kw: 11.4, aw: 10.6, armU: 8.6, armF: 8.2, armW: 7.8, hand: 8.6, armOut: 9, scW: 13, scH: 11 },
      T: { top: -58, cw: 52, jw: 47, jy: 30, chin: 55, chw: 21, eyY: 9, ex: 19, my: 37, ny: 25 },
      F: { rx: 7.4, ry: 6.2, ir: 0.8, lw: 1.5, crease: false, socket: false, riflessi: 1, naso: "morbido", bocca: "volume", sopr: 0.85 },
      colore: function (c) { return vivo(c, 0.06); },
      busto: { y: -0.02, z: 1.7 }
    },
    B: {   // 3D morbido (tipo Memoji): volumi tondi, luce dall'alto, riflessi, testa meno grande
      G: { hcy: 73, hs: 0.62, nw: 9.5, shY: 124, shw: 36, shwD: 30.5, waY: 166, waw: 28, wawD: 22, hiY: 181, hiw: 29, hiwD: 31.5, kneeY: 214, ankY: 241,
           legX: 13.4, tw: 12.6, kw: 10, aw: 8, armU: 9, armF: 7.8, armW: 6.4, hand: 7.6, armOut: 4, scW: 12.5, scH: 10.5 },
      T: { top: -60, cw: 49, jw: 42, jy: 36, chin: 60, chw: 15, eyY: 6, ex: 19, my: 39, ny: 26 },
      F: { rx: 10.6, ry: 8.9, ir: 0.66, lw: 1.8, crease: true, socket: true, riflessi: 2, naso: "volume", bocca: "volume", sopr: 1 },
      colore: function (c) { return vivo(c, 0.1); },
      busto: { y: -0.02, z: 1.7 }
    },
    C: {   // Illustrazione da rivista: proporzioni quasi vere, forme piatte e pulite, una sola ombra
      G: { hcy: 45, hs: 0.4, nw: 5.6, shY: 80, shw: 30, shwD: 26, waY: 127, waw: 18.5, wawD: 15, hiY: 146, hiw: 21.5, hiwD: 24, kneeY: 196, ankY: 243,
           legX: 10, tw: 9.4, kw: 6.4, aw: 4.4, armU: 5, armF: 4.1, armW: 3.1, hand: 4.2, armOut: 2.5, scW: 6.6, scH: 6.2, posa: 7 },
      T: { top: -62, cw: 44, jw: 37, jy: 36, chin: 62, chw: 11, eyY: 3, ex: 17, my: 37, ny: 23 },
      F: { semplice: true, naso: "piatto", bocca: "piatto", sopr: 1 },
      colore: function (c) { return vivo(c, 0.16, -0.02); },
      busto: { y: -0.1, z: 1.7 }
    },
    D: {   // Fumetto moderno (tipo Bitmoji): linea sottile del colore della cosa, ombre nette, faccia più vera
      G: { hcy: 56, hs: 0.47, nw: 6.6, shY: 96, shw: 33, shwD: 28, waY: 142, waw: 22, wawD: 18, hiY: 158, hiw: 24, hiwD: 27, kneeY: 203, ankY: 243,
           legX: 10.6, tw: 10, kw: 7.2, aw: 5.2, armU: 6, armF: 5.2, armW: 4.3, hand: 6, armOut: 3, scW: 8, scH: 7.4 },
      T: { top: -61, cw: 45, jw: 38, jy: 36, chin: 62, chw: 12, eyY: 2, ex: 17.5, my: 37, ny: 22 },
      F: { rx: 7.8, ry: 5.4, ir: 0.62, lw: 1.9, crease: true, socket: false, riflessi: 1, naso: "linea", bocca: "cel", sopr: 1 },
      colore: function (c) { return vivo(c, 0.12); },
      busto: { y: -0.02, z: 1.7 }
    }
  };

  // ---------- il pittore: come si colora una forma in ogni stile ----------
  function pittore(st, p) {
    var defs = [], cache = {}, n = 0;
    function stops(a) { return a.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join(""); }
    function lin(key, x1, y1, x2, y2, st0) {
      if (!cache[key]) { var id = p + "g" + (n++); cache[key] = id; defs.push("<linearGradient id='" + id + "' x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "'>" + stops(st0) + "</linearGradient>"); }
      return "url(#" + cache[key] + ")";
    }
    function rad(key, cx, cy, r, fx, fy, st0) {
      if (!cache[key]) { var id = p + "g" + (n++); cache[key] = id; defs.push("<radialGradient id='" + id + "' cx='" + cx + "' cy='" + cy + "' r='" + r + "' fx='" + fx + "' fy='" + fy + "'>" + stops(st0) + "</radialGradient>"); }
      return "url(#" + cache[key] + ")";
    }
    function clip(d) { var id = p + "c" + (n++); defs.push("<clipPath id='" + id + "'><path d='" + d + "'/></clipPath>"); return "url(#" + id + ")"; }
    function bordoLuce(d, dd, sd) {   // maschera: resta solo una striscia sfumata lungo il bordo a destra
      var id = p + "m" + (n++);
      defs.push("<mask id='" + id + "'><path d='" + d + "' fill='#fff'/><path d='" + d + "' fill='#000' transform='translate(" + f(-dd) + "," + f(dd * 0.35) + ")' filter='" + filtro(sd) + "'/></mask>");
      return "url(#" + id + ")";
    }
    function filtro(sd) { var key = "blur" + sd; if (!cache[key]) { var id = p + "f" + (n++); cache[key] = id; defs.push("<filter id='" + id + "' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='" + sd + "'/></filter>"); } return "url(#" + cache[key] + ")"; }
    var ombraC = function (b) { return misto(tono(b, -0.2), "#5b2d8a", 0.1); };   // l'ombra piatta: un po' più fredda (rivista)
    // una forma colorata nello stile. tipo: pelle, stoffa, capelli, lucido, oro; o.k = scala del gruppo (per linee e ombre); o.dx/o.dy = verso dell'ombra
    function parte(d, b, tipo, o) {
      o = o || {}; var k = o.k || 1, out = "";
      if (tipo === "oro") return "<path d='" + d + "' fill='" + rad("oro" + st, 0.35, 0.3, 0.8, 0.3, 0.25, [[0, "#fff6c8"], [0.35, "#f4c84a"], [0.75, "#c98f12"], [1, "#8a5a06"]]) + "'" + (st === "D" ? " stroke='#7a4c05' stroke-width='" + f(0.9 / k) + "'" : "") + "/>";
      if (st === "A") {
        var gA = tipo === "pelle" ? [[0, misto(tono(b, 0.22), "#fff3e6", 0.2)], [0.55, b], [1, misto(tono(b, -0.16), "#cf6e58", 0.14)]]
          : (tipo === "capelli" ? [[0, tono(b, 0.3)], [0.5, b], [1, tono(b, -0.3)]] : [[0, tono(b, 0.2)], [0.55, b], [1, tono(b, -0.22)]]);
        out = "<path d='" + d + "' fill='" + lin("A" + tipo + b, 0.15, 0, 0.55, 1, gA) + "'/>" +
          "<path d='" + d + "' fill='" + rad("Ar", 0.45, 0.4, 0.72, 0.45, 0.4, [[0, "#000", 0], [0.72, "#000", 0], [1, "#3a1d10", 0.13]]) + "'/>";
        if (o.bordo !== false) out += "<path d='" + d + "' fill='none' stroke='" + tono(b, -0.3) + "' stroke-opacity='.45' stroke-width='" + f(0.9 / k) + "' stroke-linejoin='round'/>";
        return out;
      }
      if (st === "B") {
        var gB = tipo === "pelle" ? [[0, misto(tono(b, 0.34), "#fff4e2", 0.3)], [0.42, b], [0.8, misto(tono(b, -0.15), "#d35a40", 0.22)], [1, misto(tono(b, -0.28), "#9a3a2c", 0.24)]]
          : tipo === "capelli" ? [[0, tono(b, 0.42)], [0.4, b], [1, tono(b, -0.46)]]
          : tipo === "lucido" ? [[0, tono(b, 0.5)], [0.32, b], [1, misto(tono(b, -0.55), "#1a1030", 0.2)]]
          : (hsl(b)[2] > 0.85 ? [[0, "#ffffff"], [0.5, b], [1, misto(tono(b, -0.26), "#3a3a78", 0.18)]] : [[0, tono(b, 0.3)], [0.45, b], [1, misto(tono(b, -0.42), "#24164a", 0.2)]]);
        out = "<path d='" + d + "' fill='" + rad("B" + tipo + b + (o.luceDx ? "d" : ""), o.luceDx ? 0.64 : 0.36, 0.26, 0.95, o.luceDx ? 0.7 : 0.3, 0.18, gB) + "'/>" +
          "<path d='" + d + "' fill='" + rad("Br", 0.48, 0.42, 0.66, 0.48, 0.42, [[0, "#000", 0], [0.7, "#000", 0], [1, "#2a1020", 0.17]]) + "'/>";
        if (o.rim !== false && !o.luceDx) out += "<path d='" + d + "' fill='" + (tipo === "pelle" ? "#ffe9dc" : (tipo === "capelli" ? tono(b, 0.6) : tono(b, 0.55))) + "' opacity='" + (tipo === "pelle" ? 0.55 : 0.45) + "' mask='" + bordoLuce(d, 2.6 / k, 0.9 / k) + "'/>";
        if (o.luce) out += "<path d='" + o.luce + "' fill='#fff' opacity='.5'/>";
        return out;
      }
      // C e D: colore pieno + ombra netta (la forma stessa spostata verso la luce copre tutto tranne il bordo in ombra)
      var dx = (o.dx != null ? o.dx : 2.6) / k, dy = (o.dy != null ? o.dy : 2.1) / k, ombra = st === "C" ? ombraC(b) : tono(b, -0.2);
      if (tipo === "lucido" && st === "D") ombra = tono(b, -0.3);
      var cl = clip(d);
      out = "<g clip-path='" + cl + "'><path d='" + d + "' fill='" + ombra + "'/><path d='" + d + "' fill='" + b + "' transform='translate(" + f(-dx) + "," + f(-dy) + ")'/>" + (o.luce ? "<path d='" + o.luce + "' fill='#fff' opacity='" + (st === "C" ? 0.22 : 0.35) + "'/>" : "") + "</g>";
      if (st === "D" && o.bordo !== false) out += "<path d='" + d + "' fill='none' stroke='" + tono(b, tipo === "pelle" ? -0.42 : -0.5) + "' stroke-width='" + f(1 / k) + "' stroke-linejoin='round'/>";
      return out;
    }
    return { parte: parte, lin: lin, rad: rad, clip: clip, filtro: filtro, defs: function () { return "<defs>" + defs.join("") + "</defs>"; } };
  }

  // ---------- il corpo ----------
  function corpo(o, L, G, PT, S, st) {
    var cx = 100, d = L.donna, km = L.corpo === "snello" ? 0.9 : (L.corpo === "robusto" ? 1.12 : 1);
    var shw = (d ? G.shwD : G.shw) * km, waw = (d ? G.wawD : G.waw) * km, hiw = (d ? G.hiwD : G.hiw) * km;
    var P = L.pelle, M = S.colore(L.maglia), Tn = S.colore(L.pantaloni), Sc = S.colore(L.scarpe), fl = 250;
    var flat = st === "C" || st === "D", linea = st === "D";
    var lx = G.legX * (d ? 0.95 : 1) * (0.9 + 0.1 * km), tw = G.tw * km, kw = G.kw * (0.95 + 0.05 * km), aw = G.aw;
    var gonna = /gonna/.test(L.sotto), corti = /bermuda|pantaloncini/.test(L.sotto), alti = /stivali|anfibi/.test(L.modScarpe);
    function gamba(s, add, y1, fine) {
      var fu = s > 0 ? (G.posa || 0) : 0, y0 = G.waY + 3, q = [[cx + s * lx * 0.8, y0], [cx + s * lx, G.hiY + 2], [cx + s * (lx + 0.4) + fu * 0.45, G.kneeY], [cx + s * (lx + 1) + fu, G.ankY]], w = [tw * 0.86 + add * 0.6, tw + add, kw + add, aw + add];
      if (y1 != null && y1 < G.kneeY + 0.1) { var t = (y1 - (G.hiY + 2)) / (G.kneeY - (G.hiY + 2)); q = [q[0], q[1], lerp(q[1], q[2], t)]; w = [w[0], w[1], w[1] + (w[2] - w[1]) * t + (fine || 0)]; }
      else if (y1 != null) { q[3] = lerp(q[2], q[3], (y1 - G.kneeY) / (G.ankY - G.kneeY)); }
      return tubo(q, w, "piatto", "piatto");
    }
    // --- gambe (pelle) se si vedono
    if (gonna || corti) [-1, 1].forEach(function (s) { o.push(PT.parte(gamba(s, 0), P, "pelle", { dx: 1.6, dy: 0.4 })); });
    // --- scarpe
    [-1, 1].forEach(function (s) {
      var x = cx + s * (lx + 1.4) + (s > 0 ? (G.posa || 0) : 0), w = G.scW, h = G.scH, base = Sc, out = [];
      var dome = "M" + f(x - w) + "," + fl + " C" + f(x - w) + "," + f(fl - h * 0.95) + " " + f(x - w * 0.5) + "," + f(fl - h * 1.2) + " " + f(x) + "," + f(fl - h * 1.2) +
        " C" + f(x + w * 0.5) + "," + f(fl - h * 1.2) + " " + f(x + w) + "," + f(fl - h * 0.95) + " " + f(x + w) + "," + fl + " Q" + f(x + w) + "," + f(fl + 2) + " " + f(x + w - 2.5) + "," + f(fl + 2) +
        " L" + f(x - w + 2.5) + "," + f(fl + 2) + " Q" + f(x - w) + "," + f(fl + 2) + " " + f(x - w) + "," + fl + " Z";
      out.push("<g transform='rotate(" + (s * 7 + (s > 0 && G.posa ? 6 : 0)) + " " + f(x) + " " + fl + ")'>");
      if (alti) {   // stivali: il gambale sale fin sotto il ginocchio
        var gy = G.kneeY + (G.ankY - G.kneeY) * 0.18, gw = aw * 1.38 + 0.6;
        out.push(PT.parte(tubo([[x - s * 0.6 - (s > 0 ? (G.posa || 0) * 0.42 : 0), gy], [x - s * 0.3, fl - h]], [gw + 0.8, gw], "piatto", "piatto"), base, "lucido"));
        if (!flat) out.push("<path d='M" + f(x - gw - 0.8) + "," + f(gy + 2.4) + " L" + f(x + gw + 0.8) + "," + f(gy + 2.4) + "' stroke='" + tono(base, 0.25) + "' stroke-width='1' opacity='.6'/>");
      }
      out.push(PT.parte(dome, base, "lucido", { luce: "M" + f(x - w * 0.6) + "," + f(fl - h * 0.7) + " Q" + f(x - w * 0.2) + "," + f(fl - h * 1.12) + " " + f(x + w * 0.2) + "," + f(fl - h * 1.05) + " Q" + f(x - w * 0.2) + "," + f(fl - h * 0.85) + " " + f(x - w * 0.6) + "," + f(fl - h * 0.7) + " Z" }));
      if (L.modScarpe === "sneakers") {
        out.push(PT.parte("M" + f(x - w - 0.4) + "," + f(fl - 2.6) + " L" + f(x + w + 0.4) + "," + f(fl - 2.6) + " L" + f(x + w + 0.4) + "," + f(fl + 0.6) + " Q" + f(x + w) + "," + f(fl + 2.4) + " " + f(x + w - 2.5) + "," + f(fl + 2.4) + " L" + f(x - w + 2.5) + "," + f(fl + 2.4) + " Q" + f(x - w) + "," + f(fl + 2.4) + " " + f(x - w - 0.4) + "," + f(fl + 0.6) + " Z", "#f6f1ea", "stoffa", { dx: 0.6, dy: 0.8 }));
        out.push("<path d='M" + f(x - w * 0.35) + "," + f(fl - h * 0.95) + " l" + f(w * 0.7) + ",0 M" + f(x - w * 0.32) + "," + f(fl - h * 0.72) + " l" + f(w * 0.64) + ",0' stroke='#fbf7f0' stroke-width='" + (st === "C" ? 0.9 : 1.2) + "' stroke-linecap='round' opacity='.9'/>");
      }
      if (L.modScarpe === "eleganti" && !flat) out.push("<ellipse cx='" + f(x - w * 0.25) + "' cy='" + f(fl - h * 0.82) + "' rx='" + f(w * 0.28) + "' ry='" + f(h * 0.14) + "' fill='#fff' opacity='.55'/>");
      out.push("</g>");
      o.push(out.join(""));
    });
    // --- pantaloni
    var sottoD;   // la forma di pantaloni o gonna (serve per ritagliare le ombre morbide)
    if (!gonna) {
      var seat = "M" + f(cx + waw + 0.5) + "," + f(G.waY) + " L" + f(cx - waw - 0.5) + "," + f(G.waY) + " L" + f(cx - lx - tw - 2) + "," + f(G.hiY + 2) +
        " L" + f(cx) + "," + f(G.hiY + 6) + " L" + f(cx + lx + tw + 2) + "," + f(G.hiY + 2) + " Z";
      var gambe = [-1, 1].map(function (s) { return corti ? gamba(s, 2.4, G.kneeY + 4, 1.2) : gamba(s, 2.2, G.ankY + 1); });
      var tutto = seat + " " + gambe.join(" "); sottoD = tutto;
      if (flat) {   // nello stile piatto i pantaloni sono un pezzo solo (niente cuciture tra le parti)
        o.push(PT.parte(tutto, Tn, "stoffa"));
      } else { o.push(PT.parte(gambe[0], Tn, "stoffa"), PT.parte(gambe[1], Tn, "stoffa"), PT.parte(seat, Tn, "stoffa", { bordo: false })); }
      // la riga in mezzo e le cuciture
      o.push("<path d='M" + f(cx) + "," + f(G.waY + 6) + " L" + f(cx) + "," + f(G.hiY + 5) + "' stroke='" + tono(Tn, -0.35) + "' stroke-width='" + (st === "C" ? 0.8 : 1) + "' opacity='.6'/>");
      if (L.sotto === "jeans" && st !== "C") [-1, 1].forEach(function (s) {
        o.push("<path d='M" + f(cx + s * (lx + tw + 0.6)) + "," + f(G.hiY + 2) + " Q" + f(cx + s * (lx + kw + 2.6)) + "," + f(G.kneeY) + " " + f(cx + s * (lx + aw + 3)) + "," + f(G.ankY - 1) + "' stroke='#e0a64a' stroke-width='.9' stroke-dasharray='2 1.6' fill='none' opacity='.85'/>");
      });
      if (corti) [-1, 1].forEach(function (s) {   // tasca del bermuda
        o.push("<path d='M" + f(cx + s * (lx + tw - 1)) + "," + f(G.hiY - 2) + " q" + f(s * 2) + ",6 0,12' stroke='" + tono(Tn, -0.35) + "' stroke-width='1' fill='none' opacity='.6'/>");
      });
    } else {   // gonna a tubino
      var hem = G.kneeY + 5, gw = hiw - 1.5;
      var gd = "M" + f(cx - waw) + "," + f(G.waY) + " L" + f(cx + waw) + "," + f(G.waY) + " C" + f(cx + hiw + 2) + "," + f(G.waY + 8) + " " + f(cx + hiw + 2) + "," + f(G.hiY + 6) + " " + f(cx + gw) + "," + f(hem) +
        " Q" + f(cx) + "," + f(hem + 2.5) + " " + f(cx - gw) + "," + f(hem) + " C" + f(cx - hiw - 2) + "," + f(G.hiY + 6) + " " + f(cx - hiw - 2) + "," + f(G.waY + 8) + " " + f(cx - waw) + "," + f(G.waY) + " Z";
      o.push(PT.parte(gd, Tn, "stoffa")); sottoD = gd;
      o.push("<path d='M" + f(cx + 0.5) + "," + f(hem - 9) + " L" + f(cx + 0.5) + "," + f(hem + 2) + "' stroke='" + tono(Tn, -0.4) + "' stroke-width='1' opacity='.7'/>");
      if (st !== "C") o.push("<path d='M" + f(cx - waw - 1) + "," + f(G.waY + 2.5) + " Q" + f(cx) + "," + f(G.waY + 4.5) + " " + f(cx + waw + 1) + "," + f(G.waY + 2.5) + "' stroke='" + tono(Tn, -0.3) + "' stroke-width='1' fill='none' opacity='.5'/>");
    }
    // --- collo
    var cy0 = G.hcy + 50 * G.hs;
    o.push(PT.parte("M" + f(cx - G.nw) + "," + f(cy0 - 6) + " L" + f(cx + G.nw) + "," + f(cy0 - 6) + " L" + f(cx + G.nw + 1) + "," + f(G.shY + 4) + " L" + f(cx - G.nw - 1) + "," + f(G.shY + 4) + " Z", P, "pelle", { bordo: false }));
    if (!flat) o.push("<ellipse cx='" + cx + "' cy='" + f(cy0 + 4) + "' rx='" + f(G.nw + 2) + "' ry='" + f(G.nw * 0.55) + "' fill='" + tono(P, -0.45) + "' opacity='.35' filter='" + PT.filtro(1.6) + "'/>");
    else o.push("<path d='M" + f(cx - G.nw) + "," + f(cy0 - 2) + " Q" + f(cx) + "," + f(cy0 + G.nw * 1.1) + " " + f(cx + G.nw) + "," + f(cy0 - 2) + " L" + f(cx + G.nw) + "," + f(cy0 - 6) + " L" + f(cx - G.nw) + "," + f(cy0 - 6) + " Z' fill='" + misto(tono(P, -0.2), "#5b2d8a", st === "C" ? 0.1 : 0) + "'/>");
    // --- busto (la maglia)
    var shY = G.shY, gilet = L.capo === "gilet", lunga = gilet || /lunga|felpa|camicia|maglione|dolcevita/.test(L.capo);
    var fondo = gilet ? G.waY + 4 : G.hiY + 4, MS = gilet ? "#fbf9f6" : M;
    function bustoD(w0, fondoY, scollo) {
      return "M" + f(cx - G.nw - 2) + "," + f(shY - 4) + " Q" + f(cx - w0 + 1) + "," + f(shY - 4) + " " + f(cx - w0 - 1.5) + "," + f(shY + 9) +
        " C" + f(cx - w0 - 1) + "," + f(shY + 22) + " " + f(cx - waw - 1) + "," + f(G.waY - 14) + " " + f(cx - waw - 0.5) + "," + f(G.waY) +
        " L" + f(cx - Math.max(waw, hiw * 0.98)) + "," + f(fondoY) + " Q" + f(cx) + "," + f(fondoY + 2) + " " + f(cx + Math.max(waw, hiw * 0.98)) + "," + f(fondoY) +
        " L" + f(cx + waw + 0.5) + "," + f(G.waY) + " C" + f(cx + waw + 1) + "," + f(G.waY - 14) + " " + f(cx + w0 + 1) + "," + f(shY + 22) + " " + f(cx + w0 + 1.5) + "," + f(shY + 9) +
        " Q" + f(cx + w0 - 1) + "," + f(shY - 4) + " " + f(cx + G.nw + 2) + "," + f(shY - 4) + " Q" + f(cx) + "," + f(shY + (scollo || 4)) + " " + f(cx - G.nw - 2) + "," + f(shY - 4) + " Z";
    }
    // --- braccia (dietro le maniche) e mani
    var bracci = [-1, 1].map(function (s) {
      var S0 = [cx + s * (shw - 4), shY + 12], E = [cx + s * (shw + G.armOut * 0.45 + 1.5), (shY + G.hiY) / 2 + 2], W = [cx + s * (shw + G.armOut + 2), G.hiY + 1];
      return { s: s, S0: S0, E: E, W: W };
    });
    bracci.forEach(function (b) {
      b.d = tubo([b.S0, b.E, b.W], [G.armU, G.armF, G.armW]);
      o.push(PT.parte(b.d, P, "pelle", { dx: 1.5, dy: 0.5, luceDx: b.s < 0 }));
      // la mano
      var dir = [b.W[0] - b.E[0], b.W[1] - b.E[1]], l = Math.hypot(dir[0], dir[1]); dir = [dir[0] / l, dir[1] / l];
      var hc = [b.W[0] + dir[0] * G.hand * 0.75, b.W[1] + dir[1] * G.hand * 0.75];
      if (st === "A") o.push(PT.parte("M" + f(hc[0] - G.hand) + "," + f(hc[1]) + " a" + f(G.hand) + "," + f(G.hand) + " 0 1,0 " + f(2 * G.hand) + ",0 a" + f(G.hand) + "," + f(G.hand) + " 0 1,0 " + f(-2 * G.hand) + ",0 Z", P, "pelle"));
      else {   // la mano lungo il fianco, vista di lato: le dita piegate verso la coscia, il pollice davanti
        var hw = G.hand * 0.66, hh = G.hand * 1.22, x = hc[0] + b.s * G.hand * 0.08, y = hc[1] + G.hand * 0.15, s = b.s;
        var mano = "M" + f(x - s * hw) + "," + f(y - hh * 0.62) + " C" + f(x - s * hw * 1.12) + "," + f(y + hh * 0.2) + " " + f(x - s * hw * 0.55) + "," + f(y + hh * 1.02) + " " + f(x + s * hw * 0.2) + "," + f(y + hh * 0.98) +
          " C" + f(x + s * hw * 0.95) + "," + f(y + hh * 0.9) + " " + f(x + s * hw * 1.1) + "," + f(y + hh * 0.2) + " " + f(x + s * hw * 0.92) + "," + f(y - hh * 0.62) + " Q" + f(x) + "," + f(y - hh * 0.95) + " " + f(x - s * hw) + "," + f(y - hh * 0.62) + " Z";
        o.push(PT.parte(mano, P, "pelle", { luceDx: s < 0 }));
        if (st !== "C") {   // il pollice, dalla parte della pancia
          var th = "M" + f(x - s * hw * 0.95) + "," + f(y - hh * 0.35) + " C" + f(x - s * hw * 1.45) + "," + f(y - hh * 0.05) + " " + f(x - s * hw * 1.3) + "," + f(y + hh * 0.45) + " " + f(x - s * hw * 0.85) + "," + f(y + hh * 0.5) +
            " C" + f(x - s * hw * 0.55) + "," + f(y + hh * 0.48) + " " + f(x - s * hw * 0.6) + "," + f(y + hh * 0.1) + " " + f(x - s * hw * 0.5) + "," + f(y - hh * 0.2) + " Z";
          o.push(PT.parte(th, P, "pelle", { luceDx: s < 0, dx: 0.8, dy: 0.8 }));
          o.push("<path d='M" + f(x + s * hw * 0.15) + "," + f(y + hh * 0.35) + " q" + f(s * hw * 0.35) + "," + f(hh * 0.22) + " " + f(s * hw * 0.55) + "," + f(hh * 0.5) + "' stroke='" + tono(P, -0.4) + "' stroke-width='.6' fill='none' opacity='.4'/>");
        }
      }
    });
    // le maniche
    bracci.forEach(function (b) {
      var s = b.s, top = [b.S0[0] - s * 1, b.S0[1] - 1.5];
      if (lunga) {
        var m = tubo([top, b.E, b.W], [G.armU + 2.4, G.armF + 2.2, G.armW + 2.2], "piatto");
        o.push(PT.parte(m, gilet ? "#fbf9f6" : M, "stoffa", { luceDx: s < 0 }));
        o.push(PT.parte(tubo([lerp(b.E, b.W, 0.84), b.W], [G.armW + 2.5, G.armW + 2.4], "piatto", "piatto"), tono(gilet ? "#fbf9f6" : M, -0.04), "stoffa"));   // il polsino
      } else {
        var mE = lerp(b.S0, b.E, st === "A" ? 0.8 : 0.62);
        if (!flat) o.push("<g clip-path='" + PT.clip(b.d) + "'><ellipse cx='" + f(mE[0]) + "' cy='" + f(mE[1] + 2.5) + "' rx='" + f(G.armU + 1) + "' ry='2.6' fill='#3a1d14' opacity='" + (st === "B" ? 0.3 : 0.18) + "' filter='" + PT.filtro(1.4) + "'/></g>");   // l'ombra della manica sul braccio
        o.push(PT.parte(tubo([top, mE], [G.armU + 2.8, G.armU + 3], "piatto"), M, "stoffa", { luceDx: s < 0 }));
        if (L.capo === "polo") o.push(PT.parte(tubo([lerp(top, mE, 0.82), mE], [G.armU + 3, G.armU + 3.05], "piatto", "piatto"), tono(M, -0.14), "stoffa", { bordo: false }));
      }
    });
    // l'ombra della maglia sui pantaloni (o sulla gonna)
    if (!flat) o.push("<g clip-path='" + PT.clip(sottoD) + "'><ellipse cx='" + cx + "' cy='" + f(fondo + 2.5) + "' rx='" + f(Math.max(waw, hiw) + 1) + "' ry='3.2' fill='#1d1020' opacity='" + (st === "B" ? 0.32 : 0.2) + "' filter='" + PT.filtro(1.6) + "'/></g>");
    // il busto sopra le maniche: la cucitura della spalla viene da sé
    var dB = bustoD(shw, fondo);
    o.push(PT.parte(dB, MS, "stoffa"));
    if (!flat) o.push("<g clip-path='" + PT.clip(dB) + "'><ellipse cx='" + cx + "' cy='" + f(shY + 5) + "' rx='" + f(G.nw + 9) + "' ry='4.5' fill='#1d1020' opacity='" + (st === "B" ? 0.2 : 0.12) + "' filter='" + PT.filtro(2.2) + "'/></g>");   // l'ombra della testa sul petto
    if (st === "B" || st === "A") o.push("<path d='M" + f(cx - waw + 3) + "," + f(G.waY - 2) + " Q" + f(cx - 4) + "," + f(G.waY + 3) + " " + f(cx + waw * 0.3) + "," + f(G.waY - 1) + " M" + f(cx + 3) + "," + f(fondo - 7) + " Q" + f(cx + waw * 0.5) + "," + f(fondo - 3) + " " + f(cx + waw - 2) + "," + f(fondo - 8) + "' stroke='" + tono(MS, -0.3) + "' stroke-width='1.6' fill='none' opacity='.22' filter='" + PT.filtro(0.8) + "'/>");   // due pieghe morbide
    // --- dettagli della maglia
    var petto = shY + (G.waY - shY) * 0.42, u = shw / 33;
    if (L.capo === "polo") {
      // colletto a punte e abbottonatura
      // lo scollo aperto (si vede il collo), l'abbottonatura e il colletto a punte appoggiato sulle spalle
      o.push(PT.parte("M" + f(cx - G.nw - 1) + "," + f(shY - 4) + " L" + f(cx + G.nw + 1) + "," + f(shY - 4) + " L" + f(cx + 2.4 * u) + "," + f(shY + 9 * u) + " L" + f(cx - 2.4 * u) + "," + f(shY + 9 * u) + " Z", L.pelle, "pelle", { bordo: false, dx: 1, dy: 1 }));
      o.push("<path d='M" + f(cx - 2.6 * u) + "," + f(shY + 8 * u) + " L" + f(cx - 2.6 * u) + "," + f(shY + 19 * u) + " L" + f(cx + 2.6 * u) + "," + f(shY + 19 * u) + " L" + f(cx + 2.6 * u) + "," + f(shY + 8 * u) + "' fill='none' stroke='" + tono(M, -0.35) + "' stroke-width='.9' opacity='.6'/>");
      [12, 16.5].forEach(function (yy) { o.push("<circle cx='" + cx + "' cy='" + f(shY + yy * u) + "' r='" + f(1.15 * u) + "' fill='" + tono(M, 0.6) + "' stroke='" + tono(M, -0.35) + "' stroke-width='.4'/>"); });
      [-1, 1].forEach(function (s) {
        var X = function (v) { return f(cx + s * v); };
        o.push(PT.parte("M" + X(G.nw + 1.5) + "," + f(shY - 6) + " Q" + X(G.nw + 8 * u) + "," + f(shY - 3) + " " + X(G.nw + 9.5 * u) + "," + f(shY + 1) + " L" + X(3.2 * u) + "," + f(shY + 10.5 * u) + " Q" + X(G.nw * 0.6) + "," + f(shY + 1) + " " + X(G.nw + 1.5) + "," + f(shY - 6) + " Z", tono(M, 0.1), "stoffa", { dx: 1.2, dy: 1.4, luceDx: s < 0 }));
      });
    }
    if (L.stampa === "pallone") {   // il pallone stampato sulla maglietta
      var br = 7.4 * u, bx = cx, by = petto + 7 * u, inchiostro = st === "C" ? "#22202a" : "#2a2a33";
      o.push("<circle cx='" + bx + "' cy='" + f(by) + "' r='" + f(br) + "' fill='#fff'/>");
      var pent = []; for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * Math.PI * 2 / 5; pent.push([bx + Math.cos(a) * br * 0.36, by + Math.sin(a) * br * 0.36]); }
      o.push("<path d='M" + pent.map(pt).join(" L") + " Z' fill='" + inchiostro + "'/>");
      for (var j = 0; j < 5; j++) { var a2 = -Math.PI / 2 + j * Math.PI * 2 / 5, q1 = pent[j], q2 = [bx + Math.cos(a2) * br * 0.72, by + Math.sin(a2) * br * 0.72]; o.push("<path d='M" + pt(q1) + " L" + pt(q2) + "' stroke='" + inchiostro + "' stroke-width='" + f(0.8 * u) + "'/>"); }
      o.push("<g clip-path='" + PT.clip("M" + f(bx - br) + "," + f(by) + " a" + f(br) + "," + f(br) + " 0 1,0 " + f(2 * br) + ",0 a" + f(br) + "," + f(br) + " 0 1,0 " + f(-2 * br) + ",0 Z") + "'>");
      for (var m2 = 0; m2 < 5; m2++) {   // i mezzi pentagoni sul bordo
        var a3 = -Math.PI / 2 + m2 * Math.PI * 2 / 5, qc = [bx + Math.cos(a3) * br * 1.0, by + Math.sin(a3) * br * 1.0], pp = [];
        for (var v = 0; v < 5; v++) { var a4 = a3 + Math.PI + v * Math.PI * 2 / 5; pp.push([qc[0] + Math.cos(a4) * br * 0.3, qc[1] + Math.sin(a4) * br * 0.3]); }
        o.push("<path d='M" + pp.map(pt).join(" L") + " Z' fill='" + inchiostro + "'/>");
      }
      o.push("</g><circle cx='" + bx + "' cy='" + f(by) + "' r='" + f(br) + "' fill='none' stroke='" + inchiostro + "' stroke-width='" + f(0.9 * u) + "'/>");
    }
    if (gilet) {   // il gilet sopra la camicia bianca: scollo a V, bottoni, punte in fondo
      var V = shY + (G.waY - shY) * 0.5, gw2 = shw - 5, fo = G.waY + 7;
      var vd = "M" + f(cx - G.nw - 3) + "," + f(shY - 3) + " Q" + f(cx - gw2 + 2) + "," + f(shY - 1) + " " + f(cx - gw2) + "," + f(shY + 7) + " Q" + f(cx - gw2 + 4) + "," + f(shY + 18) + " " + f(cx - waw - 0.5) + "," + f(shY + 26) +
        " C" + f(cx - waw - 1) + "," + f(G.waY - 8) + " " + f(cx - waw - 1.5) + "," + f(G.waY) + " " + f(cx - waw - 1) + "," + f(fo - 3) + " L" + f(cx - 4) + "," + f(fo + 3) + " L" + f(cx) + "," + f(fo - 1) +
        " L" + f(cx + 4) + "," + f(fo + 3) + " L" + f(cx + waw + 1) + "," + f(fo - 3) + " C" + f(cx + waw + 1.5) + "," + f(G.waY) + " " + f(cx + waw + 1) + "," + f(G.waY - 8) + " " + f(cx + waw + 0.5) + "," + f(shY + 26) +
        " Q" + f(cx + gw2 - 4) + "," + f(shY + 18) + " " + f(cx + gw2) + "," + f(shY + 7) + " Q" + f(cx + gw2 - 2) + "," + f(shY - 1) + " " + f(cx + G.nw + 3) + "," + f(shY - 3) + " L" + f(cx) + "," + f(V) + " Z";
      var colG = st === "C" ? "#f2ede6" : "#f3f1ee";
      o.push(PT.parte(vd, colG, "stoffa"));
      if (!flat) o.push("<path d='" + vd + "' fill='none' stroke='#b9b4ac' stroke-width='.8' opacity='.7'/>");
      [0.3, 0.62, 0.92].forEach(function (t) { var yy = V + (fo - 2 - V) * t; o.push("<circle cx='" + cx + "' cy='" + f(yy) + "' r='" + f(1.25 * u) + "' fill='#d9d3ca' stroke='#a39d93' stroke-width='.4'/>"); });
      [-1, 1].forEach(function (s) {   // le punte del colletto della camicia
        o.push(PT.parte("M" + f(cx + s * (G.nw + 1)) + "," + f(shY - 5) + " L" + f(cx + s * 1) + "," + f(shY + 7) + " L" + f(cx + s * (G.nw + 5)) + "," + f(shY + 2) + " Z", "#ffffff", "stoffa", { dx: 0.8, dy: 0.8 }));
      });
    }
    if (L.collo === "catena") {   // catena d'oro col medaglione
      var c0 = [cx - G.nw - 3, shY - 3], c1 = [cx, shY + 17 * u], c2 = [cx + G.nw + 3, shY - 3], nn = st === "C" ? 9 : 12;
      for (var ci = 0; ci <= nn; ci++) {
        var t2 = ci / nn, qx = (1 - t2) * (1 - t2) * c0[0] + 2 * (1 - t2) * t2 * c1[0] + t2 * t2 * c2[0], qy = (1 - t2) * (1 - t2) * c0[1] + 2 * (1 - t2) * t2 * c1[1] + t2 * t2 * c2[1];
        var ang = Math.atan2(2 * (1 - t2) * (c1[1] - c0[1]) + 2 * t2 * (c2[1] - c1[1]), 2 * (1 - t2) * (c1[0] - c0[0]) + 2 * t2 * (c2[0] - c1[0])) * 180 / Math.PI;
        o.push("<ellipse cx='" + f(qx) + "' cy='" + f(qy) + "' rx='" + f((ci % 2 ? 1.5 : 2.2) * u) + "' ry='" + f((ci % 2 ? 1.05 : 1.5) * u) + "' transform='rotate(" + Math.round(ang) + " " + f(qx) + " " + f(qy) + ")' fill='none' stroke='" + (ci % 2 ? "#d9a21b" : "#f2c443") + "' stroke-width='" + f(1.15 * u) + "'/>");
      }
      var mr = 3.4 * u, my = c1[1] * 0.5 + (shY - 3) * 0.5 + mr * 1.1;
      o.push(PT.parte("M" + f(cx - mr) + "," + f(my) + " a" + f(mr) + "," + f(mr) + " 0 1,0 " + f(2 * mr) + ",0 a" + f(mr) + "," + f(mr) + " 0 1,0 " + f(-2 * mr) + ",0 Z", "#e8b432", "oro"));
      o.push("<circle cx='" + f(cx - mr * 0.3) + "' cy='" + f(my - mr * 0.35) + "' r='" + f(mr * 0.3) + "' fill='#fff' opacity='.75'/>");
    }
  }

  // ---------- la testa (coordinate locali: centro 0,0; cranio da -60; larghezza 100) ----------
  function pathTesta(T) {
    var t = T.top, cw = T.cw, jw = T.jw, jy = T.jy, ch = T.chin, cc = T.chw, ty = 2;
    return "M0," + f(t) +
      " C" + f(cw * 0.58) + "," + f(t) + " " + f(cw) + "," + f(t * 0.58) + " " + f(cw) + "," + f(ty) +
      " C" + f(cw) + "," + f(ty + (jy - ty) * 0.5) + " " + f(jw + (cw - jw) * 0.45) + "," + f(jy - 5) + " " + f(jw) + "," + f(jy) +
      " C" + f(jw - (jw - cc) * 0.3) + "," + f(jy + (ch - jy) * 0.72) + " " + f(cc) + "," + f(ch) + " 0," + f(ch) +
      " C" + f(-cc) + "," + f(ch) + " " + f(-jw + (jw - cc) * 0.3) + "," + f(jy + (ch - jy) * 0.72) + " " + f(-jw) + "," + f(jy) +
      " C" + f(-jw - (cw - jw) * 0.45) + "," + f(jy - 5) + " " + f(-cw) + "," + f(ty + (jy - ty) * 0.5) + " " + f(-cw) + "," + f(ty) +
      " C" + f(-cw) + "," + f(t * 0.58) + " " + f(-cw * 0.58) + "," + f(t) + " 0," + f(t) + " Z";
  }

  function testa(o, L, G, PT, S, st) {
    var T = {}; for (var k0 in S.T) T[k0] = S.T[k0];
    if (L.viso === "squadrato") { T.jw += 4; T.chw += 7; T.jy -= 2; }
    if (L.viso === "paffuto") { T.cw += 2; T.jw += 4; T.jy -= 3; T.chw += 3; }
    var k = G.hs, P = L.pelle, H = L.colCap, A = S.colore(L.colAcc), F = S.F, flat = st === "C" || st === "D";
    var kx = T.cw / 50, ky = -T.top / 60, gH = "<g transform='scale(" + f(kx * 100) / 100 + "," + f(ky * 100) / 100 + ")'>";
    o.push("<g transform='translate(100," + f(G.hcy) + ") scale(" + k + ")'>");
    // --- capelli dietro
    var hairB = [];
    if (L.capelli === "arruffati") hairB.push(PT.parte("M-50,-34 C-58,-12 -60,14 -60,34 L-54,30 L-55,42 L-46,34 L-44,46 L-36,36 L36,36 L44,46 L46,34 L55,42 L54,30 L60,34 C60,14 58,-12 50,-34 Z", H, "capelli", { k: k }));
    if (L.capelli === "codini") [-1, 1].forEach(function (s) {
      var X = function (v) { return f(s * v); };
      hairB.push(PT.parte("M" + X(46) + ",-22 C" + X(72) + ",-30 " + X(84) + ",4 " + X(76) + ",38 C" + X(72) + ",54 " + X(62) + ",62 " + X(56) + ",56 C" + X(52) + ",50 " + X(60) + ",40 " + X(62) + ",28 C" + X(66) + ",8 " + X(58) + ",-6 " + X(44) + ",-10 Z", H, "capelli", { k: k, luceDx: s < 0 }));
      if (!flat) hairB.push("<path d='M" + X(58) + ",-14 Q" + X(74) + ",8 " + X(66) + ",44 M" + X(52) + ",-12 Q" + X(66) + ",10 " + X(60) + ",40' stroke='" + tono(H, -0.4) + "' stroke-width='1.2' opacity='.35' fill='none'/>");
      else hairB.push("<path d='M" + X(60) + ",-10 Q" + X(72) + ",10 " + X(66) + ",40' stroke='" + tono(H, 0.45) + "' stroke-width='2.2' opacity='.7' fill='none' stroke-linecap='round'/>");
    });
    if (hairB.length) o.push(gH + hairB.join("") + "</g>");
    // --- orecchie
    [-1, 1].forEach(function (s) {
      var ex = s * (T.cw - 1.5), ey = T.eyY + 7, r = L.capelli === "codini" ? 6.8 : 7.6;
      o.push(PT.parte("M" + f(ex) + "," + f(ey - r * 1.5) + " C" + f(ex + s * r * 1.3) + "," + f(ey - r * 1.6) + " " + f(ex + s * r * 1.3) + "," + f(ey + r * 1.3) + " " + f(ex) + "," + f(ey + r * 1.4) + " Z", P, "pelle", { k: k, luceDx: s < 0 }));
      if (st !== "C") o.push("<path d='M" + f(ex + s * 1.5) + "," + f(ey - r * 0.9) + " Q" + f(ex + s * r * 0.95) + "," + f(ey - r * 0.2) + " " + f(ex + s * 2) + "," + f(ey + r * 0.8) + "' stroke='" + tono(P, -0.38) + "' stroke-width='" + f(1.2) + "' fill='none' opacity='.5'/>");
    });
    // --- la testa
    var dT = pathTesta(T);
    o.push(PT.parte(dT, P, "pelle", { k: k, dx: 3.2, dy: 1.6 }));
    // ombre morbide sotto i capelli e il cappello (solo negli stili con il volume)
    if (!flat) {
      var cl = PT.clip(dT);
      var ombraTop = L.cappello === "berretto" ? -12 : (L.cappello === "pescatore" ? -16 : -35);
      o.push("<g clip-path='" + cl + "'><ellipse cx='0' cy='" + ombraTop + "' rx='60' ry='" + (L.capelli === "arruffati" ? 14 : (L.cappello === "nessuno" ? 5.5 : 9)) + "' fill='" + misto(tono(P, -0.45), "#8a3020", 0.25) + "' opacity='" + (st === "B" ? 0.26 : 0.18) + "' filter='" + PT.filtro(4) + "'/>" +
        (L.capelli === "arruffati" ? "<path d='M-56,-20 L-40,-18 L-44,30 L-56,30 Z M56,-20 L40,-18 L44,30 L56,30 Z' fill='" + tono(P, -0.55) + "' opacity='.3' filter='" + PT.filtro(3) + "'/>" : "") + "</g>");
    }
    faccia(o, L, T, PT, S, st, k);
    // --- capelli davanti e cappelli (scalati sulla testa dello stile)
    var hf = [];
    if (L.capelli === "spike") [-1, 1].forEach(function (s) {   // sotto il berretto si vedono le basette
      var X = function (v) { return f(s * v); };
      hf.push(PT.parte("M" + X(39) + ",-24 L" + X(51) + ",-22 C" + X(51) + ",-10 " + X(49) + ",-2 " + X(47) + ",8 L" + X(44) + ",-3 L" + X(41) + ",4 Z", H, "capelli", { k: k }));
    });
    if (L.capelli === "arruffati") {
      [-1, 1].forEach(function (s) {
        var X = function (v) { return f(s * v); };
        hf.push(PT.parte("M" + X(30) + ",-32 C" + X(46) + ",-34 " + X(56) + ",-22 " + X(57) + ",-4 C" + X(58) + ",10 " + X(57) + ",22 " + X(54) + ",34 L" + X(50) + ",26 L" + X(47) + ",36 L" + X(44) + ",22 C" + X(46) + ",8 " + X(46) + ",-6 " + X(41) + ",-14 C" + X(38) + ",-20 " + X(32) + ",-22 " + X(26) + ",-22 Z", H, "capelli", { k: k, luceDx: s < 0 }));
        if (!flat) hf.push("<path d='M" + X(50) + ",-14 Q" + X(53) + ",6 " + X(50) + ",26 M" + X(45) + ",-18 Q" + X(49) + ",2 " + X(47) + ",20' stroke='" + tono(H, -0.42) + "' stroke-width='1.1' opacity='.4' fill='none'/>");
      });
      // ciuffi spettinati sotto la falda
      hf.push(PT.parte("M-38,-28 Q-33,-14 -27,-12 Q-25,-19 -19,-21 Q-15,-12 -9,-11 Q-7,-19 -1,-21 Q3,-13 9,-12 Q11,-19 16,-21 Q21,-13 27,-13 Q29,-20 33,-22 Q37,-17 40,-15 L40,-28 Z", H, "capelli", { k: k, dx: 1.2, dy: 1.2 }));
    }
    if (L.capelli === "codini") {
      hf.push(PT.parte("M-51,6 C-55,-48 -30,-65 0,-65 C30,-65 55,-48 51,6 C50,-12 44,-25 30,-31 C17,-36 6,-36 0,-33 C-6,-36 -17,-36 -30,-31 C-44,-25 -50,-12 -51,6 Z", H, "capelli", { k: k }));
      hf.push("<path d='M0,-65 L0,-34' stroke='" + tono(H, -0.38) + "' stroke-width='" + (st === "C" ? 1.6 : 1.3) + "' opacity='.6'/>");
      if (!flat) hf.push("<path d='M-6,-60 Q-30,-56 -44,-22 M6,-60 Q30,-56 44,-22 M-14,-62 Q-36,-52 -46,-30' stroke='" + tono(H, -0.35) + "' stroke-width='1' opacity='.3' fill='none'/>",
        "<path d='M-30,-54 Q-12,-63 6,-61' stroke='#fff' stroke-width='5' opacity='" + (st === "B" ? 0.35 : 0.22) + "' fill='none' stroke-linecap='round'/>");
      else hf.push("<path d='M-28,-52 Q-14,-60 -2,-60' stroke='" + tono(H, 0.5) + "' stroke-width='3' opacity='.8' fill='none' stroke-linecap='round'/>");
      [-1, 1].forEach(function (s) {   // gli elastici rosa
        hf.push(PT.parte("M" + f(s * 51 - 6) + ",-17 a6,6.5 0 1,0 12,0 a6,6.5 0 1,0 -12,0 Z", vivo("#ff5c93", st === "C" ? 0.05 : 0), "lucido", { k: k, dx: 1.4, dy: 1.4 }));
      });
    }
    if (L.cappello === "berretto") {   // berretto di lana col pompon
      var dome = "M-55,-14 C-60,-66 -32,-86 0,-86 C32,-86 60,-66 55,-14 Z";
      hf.push(PT.parte(dome, A, "stoffa", { k: k }));
      var cl2 = PT.clip(dome), cos = [];
      for (var r = -48; r <= 48; r += 8) cos.push("M" + f(r * 0.3) + ",-88 Q" + f(r * 1.12) + ",-60 " + f(r * 1.08) + ",-20");
      hf.push("<g clip-path='" + cl2 + "'><path d='" + cos.join(" ") + "' stroke='" + tono(A, -0.35) + "' stroke-width='" + (st === "C" ? 1.6 : 1.4) + "' opacity='" + (st === "C" ? 0.35 : 0.3) + "' fill='none'/></g>");
      var band = "M-58,-36 Q0,-50 58,-36 L58,-10 Q0,-24 -58,-10 Z";
      hf.push(PT.parte(band, tono(A, -0.08), "stoffa", { k: k, dx: 1.6, dy: 1.6 }));
      var cl3 = PT.clip(band), cos2 = [];
      for (var r2 = -56; r2 <= 56; r2 += 5.2) cos2.push("M" + f(r2) + ",-52 L" + f(r2) + ",-6");
      hf.push("<g clip-path='" + cl3 + "'><path d='" + cos2.join(" ") + "' stroke='" + tono(A, -0.38) + "' stroke-width='1.4' opacity='.35'/><path d='" + cos2.join(" ") + "' stroke='" + tono(A, 0.3) + "' stroke-width='1' opacity='.25' transform='translate(2,0)'/></g>");
      // il pompon
      var pr = rnd(7), bord = [];
      for (var i = 0; i < 18; i++) { var a = i / 18 * Math.PI * 2, rr = 11.5 + (pr() - 0.5) * 3; bord.push([Math.cos(a) * rr, -93 + Math.sin(a) * rr]); }
      hf.push(PT.parte(chiusa(bord), A, st === "B" ? "capelli" : "stoffa", { k: k, dx: 2, dy: 2 }));
      if (!flat) hf.push("<path d='M-40,-54 Q-26,-76 4,-80' stroke='#fff' stroke-width='6' opacity='" + (st === "B" ? 0.1 : 0.12) + "' fill='none' stroke-linecap='round'/>");
    }
    if (L.cappello === "pescatore") {   // cappello da pescatore
      var crown = "M-43,-34 C-42,-54 -38,-72 -27,-77 Q0,-84 27,-77 C38,-72 42,-54 43,-34 Z";
      var brim = "M-68,-15 Q0,-40 68,-15 Q66,-28 47,-37 Q0,-47 -47,-37 Q-66,-28 -68,-15 Z";
      hf.push(PT.parte(crown, A, "stoffa", { k: k }));
      hf.push("<path d='M-42,-44 Q0,-52 42,-44' stroke='" + tono(A, -0.3) + "' stroke-width='1.3' fill='none' opacity='.5'/>");
      hf.push(PT.parte(brim, tono(A, -0.06), "stoffa", { k: k, dx: 1.8, dy: 2.2 }));
      if (st !== "C") hf.push("<path d='M-60,-20 Q0,-40 60,-20 M-54,-26 Q0,-43 54,-26' stroke='" + tono(A, 0.4) + "' stroke-width='1' stroke-dasharray='2.6 2' fill='none' opacity='.75'/>");
      if (!flat) hf.push("<path d='M-26,-70 Q-10,-78 10,-78' stroke='#fff' stroke-width='5' opacity='" + (st === "B" ? 0.16 : 0.14) + "' fill='none' stroke-linecap='round'/>");
    }
    if (hf.length) o.push(gH + hf.join("") + "</g>");
    // --- occhiali (sopra i capelli)
    occhiali(o, L, T, PT, st, k);
    // --- orecchini
    [-1, 1].forEach(function (s) {
      var x = s * (T.cw - 0.5), y = T.eyY + 17;
      if (L.orecchini === "punti") o.push("<circle cx='" + f(x) + "' cy='" + f(y) + "' r='2.6' fill='" + (st === "C" ? "#e9edf5" : "#f2f5fa") + "' stroke='" + (st === "D" ? "#8a93a6" : "none") + "' stroke-width='.8'/>" + (st === "C" ? "" : "<circle cx='" + f(x - 0.8) + "' cy='" + f(y - 0.8) + "' r='.9' fill='#fff'/>"));
      if (L.orecchini === "cuori") {
        o.push("<path d='M" + f(x) + "," + f(y - 1) + " L" + f(x) + "," + f(y + 4) + "' stroke='#d9a21b' stroke-width='1.2'/>");
        var hy = y + 8.5, hx = x;
        o.push(PT.parte("M" + f(hx) + "," + f(hy + 4.6) + " C" + f(hx - 6.2) + "," + f(hy) + " " + f(hx - 4.2) + "," + f(hy - 5.2) + " " + f(hx) + "," + f(hy - 2.4) + " C" + f(hx + 4.2) + "," + f(hy - 5.2) + " " + f(hx + 6.2) + "," + f(hy) + " " + f(hx) + "," + f(hy + 4.6) + " Z", vivo("#f0437c", 0.05), "lucido", { k: k, dx: 1, dy: 1 }));
      }
    });
    o.push("</g>");
  }

  // ---------- la faccia ----------
  function faccia(o, L, T, PT, S, st, k) {
    var F = S.F, P = L.pelle, H = L.colCap, flat = st === "C" || st === "D";
    var colS = tono(H, H === "#f3e3a8" ? -0.42 : -0.3);   // sopracciglia: un po' più scure dei capelli (le bionde chiarissime di più)
    // trucco: ombretto e guance (sotto gli occhi)
    if (L.ombretto && L.ombretto !== "nessuno") [-1, 1].forEach(function (s) {
      o.push("<ellipse cx='" + f(s * T.ex) + "' cy='" + f(T.eyY - 4.5) + "' rx='" + f((F.rx || 7) + 3.5) + "' ry='" + f((F.ry || 5) * 0.85) + "' fill='" + L.colOmbretto + "' opacity='" + (flat ? 0.4 : 0.5) + "'" + (flat ? "" : " filter='" + PT.filtro(2.2) + "'") + "/>");
    });
    var blushOn = L.blush && L.blush !== "nessuno";
    [-1, 1].forEach(function (s) {
      var a = blushOn ? (flat ? 0.38 : 0.42) : (st === "C" ? 0.2 : 0.14);
      var col = blushOn ? L.colBlush : "#ff7b6b";
      o.push("<ellipse cx='" + f(s * (T.ex + 6)) + "' cy='" + f(T.eyY + 17) + "' rx='" + (st === "C" ? 8 : 10) + "' ry='" + (st === "C" ? 5.5 : 6.5) + "' fill='" + col + "' opacity='" + a + "'" + (st === "C" ? "" : " filter='" + PT.filtro(st === "D" ? 1.5 : 3) + "'") + "/>");
    });
    if (st === "B") {   // la luce sugli zigomi e sulla fronte: la pelle sembra tonda
      [-1, 1].forEach(function (s) { o.push("<ellipse cx='" + f(s * (T.ex + 3) - 2) + "' cy='" + f(T.eyY + 13) + "' rx='7' ry='3.6' fill='#fff' opacity='.2' filter='" + PT.filtro(2) + "'/>"); });
      o.push("<ellipse cx='-10' cy='" + f(T.eyY - 26) + "' rx='16' ry='7' fill='#fff' opacity='.16' filter='" + PT.filtro(3) + "'/>");
    }
    // occhi
    [-1, 1].forEach(function (s) { occhio(o, L, T, PT, S, st, s, k); });
    // sopracciglia
    sopracciglia(o, L, T, st, colS);
    naso(o, L, T, PT, S, st, k);
    // barba (prima della bocca: i baffi stanno sopra il labbro)
    if (L.barba === "ancora") barba(o, L, T, PT, st, k);
    bocca(o, L, T, PT, S, st, k);
    if (L.barba === "ancora") baffi(o, L, T, PT, st, k);
    // il cerotto sulla guancia
    if (L.segno === "cerotto") {
      var x = T.ex + 9, y = T.eyY + 19;
      o.push("<g transform='rotate(-24 " + f(x) + " " + f(y) + ")'>" +
        PT.parte("M" + f(x - 11) + "," + f(y - 3.8) + " h22 a3.8,3.8 0 0 1 0,7.6 h-22 a3.8,3.8 0 0 1 0,-7.6 Z", "#f1c9a1", "stoffa", { k: k, dx: 0.8, dy: 0.8 }) +
        "<rect x='" + f(x - 4) + "' y='" + f(y - 3) + "' width='8' height='6' rx='1.2' fill='#f9ddbf'/>" +
        (st === "C" ? "" : "<circle cx='" + f(x - 7.5) + "' cy='" + f(y - 1.2) + "' r='.55' fill='#c79a70'/><circle cx='" + f(x - 7.5) + "' cy='" + f(y + 1.4) + "' r='.55' fill='#c79a70'/><circle cx='" + f(x + 7.5) + "' cy='" + f(y - 1.2) + "' r='.55' fill='#c79a70'/><circle cx='" + f(x + 7.5) + "' cy='" + f(y + 1.4) + "' r='.55' fill='#c79a70'/>") + "</g>");
    }
  }

  function occhio(o, L, T, PT, S, st, s, k) {
    var F = S.F, ex = s * T.ex, ey = T.eyY, I = L.iride, tipo = L.occhi, donna = L.donna;
    var scuro = "#2a1912";
    if (F.semplice) {   // rivista: occhio a mandorla scuro, una lucina, la ciglia per lei
      var rx = 6.2, ry = tipo === "furbi" ? 2.5 : (tipo === "stelline" ? 3.8 : 3.2);
      var d0 = "M" + f(ex - rx) + "," + f(ey + 0.4) + " Q" + f(ex) + "," + f(ey - ry * 2 + (tipo === "furbi" ? 2 : 0)) + " " + f(ex + rx) + "," + f(ey - (tipo === "mandorla" ? 1 : 0.3)) + " Q" + f(ex) + "," + f(ey + ry * 1.5) + " " + f(ex - rx) + "," + f(ey + 0.4) + " Z";
      o.push("<path d='" + d0 + "' fill='" + misto(I, "#1a1210", 0.55) + "'/>");
      if (tipo === "stelline") o.push("<circle cx='" + f(ex - 1.6) + "' cy='" + f(ey - 1) + "' r='1' fill='#fff'/>", stella(ex + 1.4, ey + 0.3, 1.5, "#fff"));
      else o.push("<circle cx='" + f(ex - 1.3) + "' cy='" + f(ey - 0.6) + "' r='.95' fill='#fff' opacity='.9'/>");
      if (tipo === "furbi") o.push("<path d='M" + f(ex - rx - 0.5) + "," + f(ey - 1) + " Q" + f(ex) + "," + f(ey - 3) + " " + f(ex + rx + 0.5) + "," + f(ey - 1.6) + "' stroke='" + scuro + "' stroke-width='1.3' fill='none' stroke-linecap='round'/>");
      if (donna) o.push("<path d='M" + f(ex + s * rx * 0.8) + "," + f(ey - 1.6) + " q" + f(s * 2.2) + ",-1.4 " + f(s * 3.4) + ",-3.2' stroke='" + scuro + "' stroke-width='1.1' fill='none' stroke-linecap='round'/>");
      return;
    }
    var rx2 = F.rx, ry2 = F.ry;
    if (tipo === "mandorla") ry2 *= 0.84;
    if (tipo === "stelline") { rx2 *= 1.06; ry2 *= 1.12; }
    var xi = ex - s * rx2, xo = ex + s * rx2, yi = ey + 0.6, yo = ey - (tipo === "mandorla" ? 1.8 : 0.6);
    var top = "M" + f(xi) + "," + f(yi) + " C" + f(xi + s * rx2 * 0.45) + "," + f(ey - ry2 * 1.32) + " " + f(xo - s * rx2 * 0.42) + "," + f(ey - ry2 * 1.28) + " " + f(xo) + "," + f(yo);
    var d = top + " C" + f(xo - s * rx2 * 0.38) + "," + f(ey + ry2 * 0.98) + " " + f(xi + s * rx2 * 0.45) + "," + f(ey + ry2 * 0.98) + " " + f(xi) + "," + f(yi) + " Z";
    if (F.socket) o.push("<ellipse cx='" + f(ex + s * 0.5) + "' cy='" + f(ey - 3) + "' rx='" + f(rx2 + 4) + "' ry='" + f(ry2 + 3) + "' fill='" + tono(L.pelle, -0.4) + "' opacity='.2' filter='" + PT.filtro(2.4) + "'/>");
    var cl = PT.clip(d);
    var sclera = st === "D" ? "#fbf8f5" : PT.lin("scl", 0, 0, 0, 1, [[0, "#e4d9d3"], [0.45, "#ffffff"], [1, "#f3ece8"]]);
    o.push("<path d='" + d + "' fill='" + sclera + "'/>");
    var ir = ry2 * (tipo === "stelline" ? 0.98 : 0.86) * (F.ir / 0.62) * 0.95, icx = ex + s * 0.2, icy = ey + 0.4;
    var g = "<g clip-path='" + cl + "'>";
    if (st === "D") g += "<circle cx='" + f(icx) + "' cy='" + f(icy) + "' r='" + f(ir) + "' fill='" + tono(I, 0.08) + "'/><path d='M" + f(icx - ir) + "," + f(icy) + " a" + f(ir) + "," + f(ir) + " 0 0,1 " + f(2 * ir) + ",0 Z' fill='" + tono(I, -0.3) + "'/><circle cx='" + f(icx) + "' cy='" + f(icy) + "' r='" + f(ir) + "' fill='none' stroke='" + tono(I, -0.55) + "' stroke-width='.9'/>";
    else g += "<circle cx='" + f(icx) + "' cy='" + f(icy) + "' r='" + f(ir) + "' fill='" + PT.rad("ir" + I, 0.5, 0.62, 0.6, 0.5, 0.7, [[0, tono(I, 0.55)], [0.55, I], [1, tono(I, -0.6)]]) + "'/>";
    g += "<circle cx='" + f(icx) + "' cy='" + f(icy) + "' r='" + f(ir * 0.46) + "' fill='#120b08'/>";
    // l'ombra della palpebra sull'occhio
    if (st !== "D") g += "<path d='M" + f(ex - rx2 - 2) + "," + f(ey - ry2 * 1.4) + " L" + f(ex + rx2 + 2) + "," + f(ey - ry2 * 1.4) + " L" + f(ex + rx2 + 2) + "," + f(ey - ry2 * 0.35) + " Q" + f(ex) + "," + f(ey - ry2 * 0.05) + " " + f(ex - rx2 - 2) + "," + f(ey - ry2 * 0.35) + " Z' fill='#3a1e14' opacity='.16'/>";
    // i riflessi (la stellina per gli occhi luccicanti)
    if (tipo === "stelline") g += "<circle cx='" + f(icx - ir * 0.36) + "' cy='" + f(icy - ir * 0.4) + "' r='" + f(ir * 0.26) + "' fill='#fff'/>" + stella(icx + ir * 0.34, icy + ir * 0.18, ir * 0.42, "#fff") + stella(icx - ir * 0.05, icy + ir * 0.55, ir * 0.2, "#fff");
    else {
      g += "<circle cx='" + f(icx - ir * 0.35) + "' cy='" + f(icy - ir * 0.38) + "' r='" + f(ir * 0.3) + "' fill='#fff' opacity='.95'/>";
      if (F.riflessi > 1) g += "<circle cx='" + f(icx + ir * 0.38) + "' cy='" + f(icy + ir * 0.36) + "' r='" + f(ir * 0.13) + "' fill='#fff' opacity='.8'/>";
    }
    // occhi furbi: la palpebra cala a metà
    var lid = null;
    if (tipo === "furbi") {
      lid = "M" + f(xi - s * 2) + "," + f(ey - ry2 * 1.6) + " L" + f(xo + s * 2) + "," + f(ey - ry2 * 1.6) + " L" + f(xo + s * 2) + "," + f(ey - ry2 * 0.12) + " Q" + f(ex) + "," + f(ey - ry2 * 0.32) + " " + f(xi - s * 2) + "," + f(ey + ry2 * 0.05) + " Z";
      g += "<path d='" + lid + "' fill='" + (st === "D" ? tono(L.pelle, -0.06) : PT.lin("lid" + L.pelle, 0, 0, 0, 1, [[0, tono(L.pelle, 0.1)], [1, tono(L.pelle, -0.14)]])) + "'/>";
    }
    g += "</g>";
    o.push(g);
    var lw = F.lw;
    if (tipo === "furbi") o.push("<path d='M" + f(xi - s * 0.5) + "," + f(ey + ry2 * 0.02) + " Q" + f(ex) + "," + f(ey - ry2 * 0.36) + " " + f(xo + s * 0.5) + "," + f(ey - ry2 * 0.14) + "' stroke='" + scuro + "' stroke-width='" + f(lw) + "' fill='none' stroke-linecap='round'/>");
    else o.push("<path d='" + top + "' stroke='" + scuro + "' stroke-width='" + f(lw) + "' fill='none' stroke-linecap='round'/>");
    // la piega della palpebra e la riga sotto
    if (F.crease) o.push("<path d='M" + f(xi + s * 1) + "," + f(ey - ry2 * 1.05) + " Q" + f(ex) + "," + f(ey - ry2 * 1.75) + " " + f(xo - s * 0.5) + "," + f(ey - ry2 * 1.0) + "' stroke='" + tono(L.pelle, -0.42) + "' stroke-width='" + (st === "D" ? 1 : 0.9) + "' fill='none' opacity='" + (st === "D" ? 0.75 : 0.45) + "' stroke-linecap='round'/>");
    o.push("<path d='M" + f(xi + s * 1.5) + "," + f(ey + ry2 * 0.7) + " Q" + f(ex) + "," + f(ey + ry2 * 1.08) + " " + f(xo - s * 1.2) + "," + f(ey + ry2 * 0.55) + "' stroke='" + tono(L.pelle, -0.4) + "' stroke-width='.8' fill='none' opacity='" + (st === "D" ? 0.55 : 0.32) + "'/>");
    // ciglia (lei): tre ciuffetti all'angolo fuori
    if (donna) [0, 1, 2].forEach(function (i) {
      var bx = xo - s * (i * 2.4), by = yo - ry2 * 0.32 * i - 0.4;
      o.push("<path d='M" + f(bx) + "," + f(by) + " q" + f(s * 1.6) + "," + f(-1.4 - i * 0.4) + " " + f(s * (3.2 - i * 0.6)) + "," + f(-3.4 - i * 0.6) + "' stroke='" + scuro + "' stroke-width='" + f(lw * 0.7) + "' fill='none' stroke-linecap='round'/>");
    });
  }
  function stella(x, y, r, col) {   // stellina a quattro punte (il riflesso degli occhi luccicanti)
    var a = r * 0.28;
    return "<path d='M" + f(x) + "," + f(y - r) + " Q" + f(x + a) + "," + f(y - a) + " " + f(x + r) + "," + f(y) + " Q" + f(x + a) + "," + f(y + a) + " " + f(x) + "," + f(y + r) + " Q" + f(x - a) + "," + f(y + a) + " " + f(x - r) + "," + f(y) + " Q" + f(x - a) + "," + f(y - a) + " " + f(x) + "," + f(y - r) + " Z' fill='" + col + "'/>";
  }

  function sopracciglia(o, L, T, st, col) {
    var y = T.eyY - (st === "A" ? 12.5 : 14), ex = T.ex;
    if (L.occhiali === "grandi") y = Math.min(y, T.eyY - 19.5);
    var w = st === "C" ? 0.8 : (st === "A" ? 0.85 : 1), t = L.sopracc;
    if (t === "unite") {
      var q = [[-ex - 11, y + 2.5], [-ex, y - 1], [-7, y + 0.6], [0, y + 1.6], [7, y + 0.6], [ex, y - 1], [ex + 11, y + 2.5]];
      o.push("<path d='" + tubo(q, [1.2, 2.5, 2.3, 1.7, 2.3, 2.5, 1.2].map(function (v) { return v * w; })) + "' fill='" + col + "'/>");
      return;
    }
    [-1, 1].forEach(function (s) {
      var q = t === "dritte" ? [[s * (ex - 9.5), y + 0.8], [s * ex, y - 0.2], [s * (ex + 10.5), y + 0.4]]
        : [[s * (ex - 9.5), y + 1.4], [s * (ex - 1), y - 2.6], [s * (ex + 10.5), y + 0.9]];
      if (s > 0) q = q.reverse();
      o.push("<path d='" + tubo(q, (s > 0 ? [1.1, 2.2, 2.4] : [2.4, 2.2, 1.1]).map(function (v) { return v * w; })) + "' fill='" + col + "'/>");
    });
  }

  function naso(o, L, T, PT, S, st, k) {
    var P = L.pelle, ny = T.ny, t = L.naso, sc = t === "lungo" ? 1.18 : (t === "piccolo" ? 0.85 : 0.92), ombra = tono(P, -0.42);
    if (t === "lungo") ny += 2.5;
    if (t === "insu") ny -= 1.5;
    if (S.F.naso === "piatto") {   // rivista: un'ombra sola sul lato e la punta
      o.push("<path d='M2," + f(T.eyY + 5) + " C3," + f(ny - 8) + " " + f(6 * sc) + "," + f(ny - 3) + " " + f(5 * sc) + "," + f(ny) + " C" + f(4 * sc) + "," + f(ny + 2.5) + " 0," + f(ny + 2.5) + " " + f(-2.5 * sc) + "," + f(ny + 1) + " C0," + f(ny + 0.5) + " " + f(2 * sc) + "," + f(ny) + " " + f(2.5 * sc) + "," + f(ny - 2) + " C2.5," + f(ny - 7) + " 1," + f(T.eyY + 9) + " 2," + f(T.eyY + 5) + " Z' fill='" + misto(tono(P, -0.22), "#5b2d8a", 0.1) + "'/>");
      return;
    }
    if (S.F.naso === "linea") {   // fumetto: la linea del naso da un lato e le narici
      o.push("<path d='M-3," + f(T.eyY + 4) + " C-2," + f(ny - 10) + " " + f(-5.5 * sc) + "," + f(ny - 4) + " " + f(-5.2 * sc) + "," + f(ny) + "' stroke='" + tono(P, -0.4) + "' stroke-width='1.1' fill='none' stroke-linecap='round' opacity='.7'/>",
        "<path d='M" + f(-5.2 * sc) + "," + f(ny + 0.6) + " C" + f(-4 * sc) + "," + f(ny + 3.2) + " " + f(-1.5 * sc) + "," + f(ny + 2) + " 0," + f(ny + 2.8) + " C" + f(1.5 * sc) + "," + f(ny + 2) + " " + f(4 * sc) + "," + f(ny + 3.2) + " " + f(5.2 * sc) + "," + f(ny + 0.6) + "' stroke='" + tono(P, -0.45) + "' stroke-width='1.2' fill='none' stroke-linecap='round'/>",
        "<path d='M" + f(1 * sc) + "," + f(ny - 2) + " C" + f(4.5 * sc) + "," + f(ny - 5) + " " + f(6 * sc) + "," + f(ny) + " " + f(3 * sc) + "," + f(ny + 1.8) + " L" + f(5.2 * sc) + "," + f(ny + 0.6) + " C" + f(4 * sc) + "," + f(ny + 3.2) + " " + f(1.5 * sc) + "," + f(ny + 2) + " 0," + f(ny + 2.8) + " Z' fill='" + tono(P, -0.16) + "' opacity='.8'/>");
      return;
    }
    // A e B: il naso è fatto solo di luce e ombra (niente contorno): ombra del lato, sotto la punta, le ali, le narici, la lucina
    var blur = PT.filtro(st === "B" ? 1.3 : 1.7), forte = st === "B" ? 1 : 0.7;
    o.push("<path d='M2.4," + f(T.eyY + 3) + " C3.6," + f(ny - 9) + " " + f(6.4 * sc) + "," + f(ny - 4) + " " + f(6.2 * sc) + "," + f(ny + 0.5) + "' stroke='" + ombra + "' stroke-width='2.6' fill='none' opacity='" + f(0.3 * forte * 100) / 100 + "' filter='" + blur + "' stroke-linecap='round'/>");
    o.push("<ellipse cx='0.8' cy='" + f(ny + 4) + "' rx='" + f(6.6 * sc) + "' ry='2' fill='" + ombra + "' opacity='" + f(0.45 * forte * 100) / 100 + "' filter='" + blur + "'/>");
    [-1, 1].forEach(function (s2) {   // le ali del naso
      o.push("<path d='M" + f(s2 * 3 * sc) + "," + f(ny - 2.6) + " C" + f(s2 * 6.6 * sc) + "," + f(ny - 2.4) + " " + f(s2 * 7 * sc) + "," + f(ny + 2.2) + " " + f(s2 * 4 * sc) + "," + f(ny + 2.6) + "' stroke='" + tono(P, -0.38) + "' stroke-width='1' fill='none' opacity='" + f((s2 > 0 ? 0.5 : 0.3) * forte * 100) / 100 + "' stroke-linecap='round'/>");
      o.push("<ellipse cx='" + f(s2 * 2.6 * sc) + "' cy='" + f(ny + 2.1) + "' rx='" + f(1.5 * sc) + "' ry='" + f(t === "insu" ? 1.15 : 0.85) + "' transform='rotate(" + (s2 * 18) + " " + f(s2 * 2.6 * sc) + " " + f(ny + 2.1) + ")' fill='" + tono(P, -0.6) + "' opacity='" + f(0.5 * forte * 100) / 100 + "'/>");
    });
    o.push("<ellipse cx='" + f(-0.8 * sc) + "' cy='" + f(ny - 1.6) + "' rx='" + f(2.3 * sc) + "' ry='1.5' fill='#fff' opacity='" + (st === "B" ? 0.5 : 0.3) + "' filter='" + PT.filtro(0.5) + "'/>");
    if (st === "B") o.push("<path d='M-0.6," + f(T.eyY + 7) + " Q0.2," + f(ny - 8) + " -0.6," + f(ny - 4.5) + "' stroke='#fff' stroke-width='1.4' opacity='.16' fill='none' stroke-linecap='round'/>");
  }

  function bocca(o, L, T, PT, S, st, k) {
    var my = T.my, P = L.pelle, t = L.bocca, piatto = S.F.bocca === "piatto", cel = S.F.bocca === "cel";
    var labbro = L.donna ? misto(P, "#d45a6e", 0.5) : misto(P, "#b65450", 0.38), scuroB = "#4a1418", linea = tono(labbro, -0.45);
    if (t === "dentoni") {   // sorriso aperto con i due dentoni davanti
      var d = "M-12,-2 C-6,0.5 6,0.5 12,-2 C10,7.5 -10,7.5 -12,-2 Z".replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, function (m, a, b) { return a + "," + f(+b + my); });
      o.push("<path d='" + d + "' fill='" + (piatto ? "#5a1d24" : PT.lin("bocc", 0, 0, 0, 1, [[0, "#3a0f14"], [1, "#7a2a30"]])) + "'/>");
      var cl = PT.clip(d);
      o.push("<g clip-path='" + cl + "'><ellipse cx='0' cy='" + f(my + 6.4) + "' rx='7' ry='3' fill='#d9636e'/>" +
        "<rect x='-5.4' y='" + f(my - 2) + "' width='5.1' height='7' rx='1.4' fill='#fffdf8' stroke='" + (cel ? "#a89c90" : "#d8cfc4") + "' stroke-width='.5'/>" +
        "<rect x='0.3' y='" + f(my - 2) + "' width='5.1' height='7' rx='1.4' fill='#fffdf8' stroke='" + (cel ? "#a89c90" : "#d8cfc4") + "' stroke-width='.5'/></g>");
      o.push("<path d='M-12.5,-2.2 C-6,0 6,0 12.5,-2.2'".replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, function (m, a, b) { return a + "," + f(+b + my); }) + " stroke='" + (piatto ? labbro : linea) + "' stroke-width='" + (piatto ? 1.6 : 1.2) + "' fill='none' stroke-linecap='round' opacity='.8'/>");
      if (!piatto) o.push("<path d='M-6," + f(my + 7.6) + " Q0," + f(my + 9.4) + " 6," + f(my + 7.6) + "' stroke='" + tono(P, -0.3) + "' stroke-width='1' fill='none' opacity='.35'/>");
      return;
    }
    if (t === "sorrisetto") {   // sorrisetto storto: un angolo sale
      o.push("<path d='M-11," + f(my + 0.8) + " C-5," + f(my + 2.8) + " 3," + f(my + 2.4) + " 11.5," + f(my - 3.2) + " C7," + f(my + 5.8) + " -5," + f(my + 5.4) + " -11," + f(my + 0.8) + " Z' fill='" + labbro + "' opacity='" + (piatto ? 1 : 0.85) + "'/>");
      o.push("<path d='M-11," + f(my + 0.8) + " C-5," + f(my + 2.8) + " 3," + f(my + 2.4) + " 11.5," + f(my - 3.2) + "' stroke='" + (piatto ? tono(labbro, -0.35) : scuroB) + "' stroke-width='" + (cel ? 1.4 : 1.3) + "' fill='none' stroke-linecap='round' opacity='.85'/>");
      if (!piatto) o.push("<path d='M11.2," + f(my - 4.8) + " q1.4,1.6 .6,3.6' stroke='" + tono(P, -0.38) + "' stroke-width='1' fill='none' opacity='.55' stroke-linecap='round'/>",
        "<ellipse cx='-2' cy='" + f(my + 3.6) + "' rx='4' ry='1' fill='#fff' opacity='" + (st === "B" ? 0.35 : 0.2) + "'/>");
      return;
    }
    if (t === "nervoso") {   // nervoso: denti stretti, la riga in mezzo che trema
      var d2 = "M-12.5," + f(my) + " C-7," + f(my - 3.2) + " 7," + f(my - 3.2) + " 12.5," + f(my) + " C7," + f(my + 4.6) + " -7," + f(my + 4.6) + " -12.5," + f(my) + " Z";
      o.push("<path d='" + d2 + "' fill='#fffdf8' stroke='" + (piatto ? labbro : linea) + "' stroke-width='" + (piatto ? 1.8 : 1.3) + "'/>");
      o.push("<path d='M-10," + f(my + 0.4) + " L-6.5," + f(my - 0.9) + " L-3," + f(my + 1.2) + " L0.5," + f(my - 0.9) + " L4," + f(my + 1.2) + " L7.5," + f(my - 0.9) + " L10.4," + f(my + 0.4) + "' stroke='" + (piatto ? "#9d8f88" : "#8c7f78") + "' stroke-width='.9' fill='none' stroke-linejoin='round'/>");
      if (!piatto) o.push("<path d='M-5," + f(my + 5.8) + " Q0," + f(my + 7.2) + " 5," + f(my + 5.8) + "' stroke='" + labbro + "' stroke-width='1.6' fill='none' opacity='.55' stroke-linecap='round'/>");
      return;
    }
    // le altre: sorriso semplice
    o.push("<path d='M-10," + f(my) + " Q0," + f(my + 6) + " 10," + f(my) + "' stroke='" + scuroB + "' stroke-width='1.4' fill='none' stroke-linecap='round'/>");
  }

  function baffi(o, L, T, PT, st, k) {
    var my = T.my - 5.2, H = L.colCap;
    var d = "M-15.5," + f(my + 3) + " C-13," + f(my - 2.6) + " -5," + f(my - 3.6) + " 0," + f(my - 1.6) + " C5," + f(my - 3.6) + " 13," + f(my - 2.6) + " 15.5," + f(my + 3) + " C11," + f(my + 1.2) + " 5," + f(my + 2) + " 0," + f(my + 1.6) + " C-5," + f(my + 2) + " -11," + f(my + 1.2) + " -15.5," + f(my + 3) + " Z";
    o.push(PT.parte(d, H, "capelli", { k: k, dx: 0.8, dy: 1 }));
    if (st === "A" || st === "B") o.push("<path d='M-11," + f(my - 0.6) + " l1.6,2.6 M-7," + f(my - 1.4) + " l1.2,2.8 M-3," + f(my - 1) + " l.8,2.4 M3," + f(my - 1) + " l-.8,2.4 M7," + f(my - 1.4) + " l-1.2,2.8 M11," + f(my - 0.6) + " l-1.6,2.6' stroke='" + tono(H, -0.38) + "' stroke-width='.7' opacity='.5'/>");
  }
  function barba(o, L, T, PT, st, k) {
    var by = T.my + 6.5, ch = T.chin, H = L.colCap;
    var d = "M-10.5," + f(by) + " C-6," + f(by + 2.4) + " 6," + f(by + 2.4) + " 10.5," + f(by) + " C11.5," + f(by + 9) + " 6," + f(ch + 2) + " 0," + f(ch + 7) + " C-6," + f(ch + 2) + " -11.5," + f(by + 9) + " -10.5," + f(by) + " Z";
    o.push(PT.parte(d, H, "capelli", { k: k, dx: 1.2, dy: 1.2 }));
    if (st === "A" || st === "B") {
      var cl = PT.clip(d), r = rnd(31), s = [];
      for (var i = 0; i < 26; i++) { var x = -9 + r() * 18, y = by + 1 + r() * (ch + 4 - by); s.push("M" + f(x) + "," + f(y) + " l" + f((r() - 0.5) * 1.2 - x * 0.04) + "," + f(2.2 + r() * 1.2)); }
      o.push("<g clip-path='" + cl + "'><path d='" + s.join(" ") + "' stroke='" + tono(H, -0.4) + "' stroke-width='.7' opacity='.45'/></g>");
    }
  }

  function occhiali(o, L, T, PT, st, k) {
    var t = L.occhiali; if (!t || t === "nessuno") return;
    var ey = T.eyY + 0.5, ex = T.ex, big = t === "grandi", r = big ? 15.8 : 12.6, ex2 = ex + (big ? 0.6 : 0);
    var cornice = big ? (st === "C" ? "#7a3f1c" : "#6b3a1d") : "#1d1a1f", w = big ? 3.2 : 2.1;
    if (st === "C") w *= 1.25;
    // asticelle verso le orecchie e il ponte
    [-1, 1].forEach(function (s) { o.push("<path d='M" + f(s * (ex2 + r - 0.5)) + "," + f(ey - 2) + " L" + f(s * (T.cw - 1)) + "," + f(ey - 4) + "' stroke='" + cornice + "' stroke-width='" + f(w * 0.8) + "' stroke-linecap='round'/>"); });
    o.push("<path d='M" + f(-ex2 + r - 0.5) + "," + f(ey - 1.5) + " Q0," + f(ey - 5.5) + " " + f(ex2 - r + 0.5) + "," + f(ey - 1.5) + "' stroke='" + cornice + "' stroke-width='" + f(w * 0.85) + "' fill='none'/>");
    [-1, 1].forEach(function (s) {
      var x = s * ex2;
      if (big) o.push("<circle cx='" + f(x) + "' cy='" + f(ey) + "' r='" + f(r) + "' fill='#b46a2c' fill-opacity='" + (st === "C" ? 0.22 : 0.26) + "'/>");
      else o.push("<circle cx='" + f(x) + "' cy='" + f(ey) + "' r='" + f(r) + "' fill='#dfe9f5' fill-opacity='.12'/>");
      o.push("<circle cx='" + f(x) + "' cy='" + f(ey) + "' r='" + f(r) + "' fill='none' stroke='" + cornice + "' stroke-width='" + f(w) + "'/>");
      if (big && st !== "C") o.push("<circle cx='" + f(x) + "' cy='" + f(ey) + "' r='" + f(r) + "' fill='none' stroke='#c98a50' stroke-width='" + f(w * 0.35) + "' stroke-dasharray='3 5' opacity='.6'/>");   // la tartaruga
      if (st !== "C") o.push("<path d='M" + f(x - r * 0.55) + "," + f(ey - r * 0.45) + " Q" + f(x - r * 0.2) + "," + f(ey - r * 0.75) + " " + f(x + r * 0.2) + "," + f(ey - r * 0.68) + "' stroke='#fff' stroke-width='" + (st === "B" ? 1.8 : 1.2) + "' opacity='" + (st === "B" ? 0.55 : 0.4) + "' fill='none' stroke-linecap='round'/>");
      if (st === "B") o.push("<circle cx='" + f(x) + "' cy='" + f(ey) + "' r='" + f(r - w * 0.3) + "' fill='none' stroke='#fff' stroke-width='.6' opacity='.25' transform='translate(-.6,-.6)'/>");
    });
  }

  // ---------- il disegno intero ----------
  function disegna(nome, st, vista, p) {
    var L = typeof nome === "string" ? leggi(nome) : nome, S = STILI[st], G = S.G, PT = pittore(st, p || ("av" + st + Math.random().toString(36).slice(2, 6)));
    var o = [];
    if (vista !== "busto") o.push("<ellipse cx='100' cy='251' rx='" + (st === "C" ? 34 : 50) + "' ry='" + (st === "C" ? 5 : 7.5) + "' fill='#000' opacity='.15'" + (st === "C" ? "" : " filter='" + PT.filtro(2.5) + "'") + "/>");
    corpo(o, L, G, PT, S, st);
    testa(o, L, G, PT, S, st);
    var vb = "0 0 200 264";
    if (vista === "busto") {   // la faccina: la testa riempie il tondo, si vedono le spalle
      var z = 120 * G.hs * S.busto.z, cy = G.hcy + 60 * G.hs * S.busto.y;
      vb = [100 - z / 2, cy - z / 2, z, z].map(f).join(" ");
    }
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='" + vb + "' class='av av-" + st + "'>" + PT.defs() + o.join("") + "</svg>";
  }

  window.AV = { disegna: disegna, leggi: leggi, STILI: STILI, vivo: vivo, tono: tono };
})();
