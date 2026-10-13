/* =========================================================
   SPeeD GAME — L'ASTA: LA SALA vista dalle spalle del banditore (i disegni fissi)
   Il gioco li usa come immagini (data URL o background-image); quello che si muove (avatar, pannello
   con l'oggetto, palette, bottoni) è HTML e sta sopra.
     SGAstaArte.sala(p)   -> lo sfondo a tutto schermo, viewBox 0 0 400 800 (slice: le cose importanti in x 40–360).
                             Parete di damasco verde bottiglia, boiserie di mogano, due lampadari di cristallo, tende
                             di velluto rosso e due quadretti; in x 60–340, y 40–230 la parete è calma (lì va il pannello).
                             Da y 300 il parquet a spina ungherese in prospettiva, più scuro ai bordi e in basso.
     SGAstaArte.sedia(p)  -> la sedia Luigi XVI del pubblico, di fronte, nel riquadro dell'avatar (200×264):
                             va DIETRO all'avatar seduto (seduta a y 198, piedi a y 252).
     SGAstaArte.leggio(p) -> il leggio di mogano visto dalla parte del banditore (200×150): va DAVANTI al banditore,
                             dalla vita in giù, e lo taglia il bordo dello schermo.
   p = prefisso degli id (facoltativo, serve solo se si mettono più copie come SVG veri nella stessa pagina;
   gli si aggiunge S, C o L, così sala, sedia e leggio non si pestano i piedi neanche con lo stesso p).
   Niente filtri, niente testo, niente Math.random (le trame usano rnd(seme)): il disegno viene sempre uguale.
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGAstaArte = window.SGAstaArte || {};

  // ---------- attrezzi ----------
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function n(v) { return Math.round(v * 10) / 10; }   // un decimale basta
  function q(x, y) { return n(x) + "," + n(y); }
  function sfum(tipo, id, a, st) {
    return "<" + tipo + " id='" + id + "' " + a + ">" + st.map(function (s) {
      return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>";
    }).join("") + "</" + tipo + ">";
  }
  function lin(id, x1, y1, x2, y2, st, us) { return sfum("linearGradient", id, "x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "'" + (us ? " gradientUnits='userSpaceOnUse'" : ""), st); }
  function rad(id, cx, cy, r, st, us) { return sfum("radialGradient", id, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'" + (us ? " gradientUnits='userSpaceOnUse'" : ""), st); }
  function simm(x0, y0, segs) {   // tracciato simmetrico attorno a x 0: la metà destra (curve da x0,y0 fino all'asse) e la sua immagine allo specchio
    var d = "M" + q(x0, y0), pts = [[x0, y0]], i;
    segs.forEach(function (c) { d += " C" + q(c[0], c[1]) + " " + q(c[2], c[3]) + " " + q(c[4], c[5]); pts.push([c[4], c[5]]); });
    for (i = segs.length - 1; i >= 0; i--) { var c = segs[i], a = pts[i]; d += " C" + q(-c[2], c[3]) + " " + q(-c[0], c[1]) + " " + q(-a[0], a[1]); }
    return d + " Z";
  }
  function specchio(d, asse) { return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, function (m, x, y) { return n(2 * asse - x) + "," + y; }); }   // lo stesso tracciato (solo coppie x,y) allo specchio attorno a x = asse
  function bordo(c, w) { return " stroke='" + c + "' stroke-width='" + w + "'"; }   // gli angoli e le punte tonde li dà l'<svg> a tutti
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + (x || "") + "/>"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + w + "'" + (x || "") + "/>"; }
  function svg(vb, extra, defs, corpo) { return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='" + vb + "'" + (extra || "") + " stroke-linejoin='round' stroke-linecap='round'><defs>" + defs + "</defs>" + corpo + "</svg>"; }
  function u(p, id) { return "url(#" + p + id + ")"; }

  // i colori di casa
  var ORO = [[0, "#fff1bf"], [.32, "#e8bd5c"], [.7, "#b07b2c"], [1, "#6e4614"]];
  var ORO_L = "#4a2c0c", CRIS = "#7d93a8";

  // =========================================================
  //  LA SALA (400×800)
  // =========================================================
  function lampadario(p) {   // il lampadario di cristallo "a tenda e sacco": centro in x 0, appeso al soffitto (y 0); largo 54, alto 112
    var s = "", i, sopra = "", sotto = "", dietro = "", R = 26, YA = 57;   // R, YA: l'anello d'oro delle candele
    function goccia(x, y, l) { var w = l * .32; return "<path d='M" + q(x, y) + " C" + q(x + w, y + l * .42) + " " + q(x + w * .9, y + l * .86) + " " + q(x, y + l) + " C" + q(x - w * .9, y + l * .86) + " " + q(x - w, y + l * .42) + " " + q(x, y) + " Z' fill='" + u(p, "cr") + "' stroke='" + CRIS + "' stroke-width='.5'/>"; }
    function stella(x, y, r) { var a = r * .22; return "M" + q(x, y - r) + " L" + q(x + a, y - a) + " L" + q(x + r, y) + " L" + q(x + a, y + a) + " L" + q(x, y + r) + " L" + q(x - a, y + a) + " L" + q(x - r, y) + " L" + q(x - a, y - a) + " Z "; }
    function candela(a, k) {   // una candela sull'anello (a = angolo attorno all'asse: 0 davanti), k = più piccola se sta dietro
      var x = R * Math.sin(a), y = YA + 4.5 * Math.cos(a);
      return "<ellipse cx='" + n(x) + "' cy='" + n(y) + "' rx='" + n(3.4 * k) + "' ry='" + n(1.2 * k) + "' fill='" + u(p, "or") + "'" + bordo(ORO_L, .7) + "/>" +
        "<rect x='" + n(x - 1.1 * k) + "' y='" + n(y - 6.8 * k) + "' width='" + n(2.2 * k) + "' height='" + n(6.4 * k) + "' fill='#fbf5e6' stroke='#b9a37a' stroke-width='.5'/>" +
        "<circle cx='" + n(x) + "' cy='" + n(y - 9 * k) + "' r='" + n(9 * k) + "' fill='" + u(p, "lu") + "'/>" +
        pth("M" + q(x, y - 12.4 * k) + " Q" + q(x + 1.6 * k, y - 9.4 * k) + " " + q(x, y - 7.6 * k) + " Q" + q(x - 1.6 * k, y - 9.4 * k) + " " + q(x, y - 12.4 * k) + " Z", "#fff6d0");
    }
    for (i = -4; i <= 4; i++) {   // i fili di perline: la "tenda" dalla corona all'anello e il "sacco" che si chiude in basso
      var sn = Math.sin(i / 4 * Math.PI / 2);
      sopra += "M" + q(6.5 * sn, 19) + " Q" + q(16 * sn, 41) + " " + q(R * sn, YA - 1);
      sotto += "M" + q(R * sn, YA + 1.5) + " Q" + q(29 * sn, 86) + " " + q(3 * sn, 97);
      if (i > -4 && i < 4) dietro += "M" + q(6.5 * sn, 18) + " Q" + q(17 * sn, 39) + " " + q(R * sn * .7, YA - 3.5) + " Q" + q(24 * sn, 82) + " " + q(2.5 * sn, 96);
    }
    s += tratto("M0,0 V16", "#6e4b16", 2.8, " stroke-dasharray='2.6 1.2' stroke-linecap='butt'") + tratto("M-.4,0 V16", "#f3d58a", 1, " stroke-dasharray='2.6 1.2' stroke-linecap='butt'");   // la catena
    s += "<circle cx='0' cy='76' r='24' fill='" + u(p, "lu") + "' opacity='.55'/>";   // la luce dentro i cristalli
    s += tratto(dietro, "#dceeff", 1.1, " stroke-dasharray='0 2.3' opacity='.55'") + tratto("M0,18 V98", "#e6f4ff", 1.6, " opacity='.45'");   // i fili di dietro e il fusto di vetro
    s += "<path d='M" + q(-R, YA) + " A" + R + ",4.5 0 0 1 " + q(R, YA) + "' fill='none' stroke='#8a5e1c' stroke-width='2.2'/>";   // la metà di dietro dell'anello
    s += candela(Math.PI * .75, .8) + candela(-Math.PI * .75, .8);
    s += tratto(sopra + sotto, "#f4faff", 1.7, " stroke-dasharray='0 2.3'");
    for (i = -2; i <= 2; i++) { var cx = i * 3.2, h = 8 - Math.abs(i) * 1.6; s += pth("M" + q(cx - 1.3, 19) + " Q" + q(cx - 1.2, 19 - h * .6) + " " + q(cx, 19 - h) + " Q" + q(cx + 1.2, 19 - h * .6) + " " + q(cx + 1.3, 19) + " Z", u(p, "cr"), " stroke='" + CRIS + "' stroke-width='.5'"); }   // gli spilli della corona
    s += "<ellipse cx='0' cy='19' rx='7.5' ry='2.2' fill='" + u(p, "or") + "'" + bordo(ORO_L, 1) + "/>";
    s += "<path d='M" + q(-R, YA) + " A" + R + ",4.5 0 0 0 " + q(R, YA) + "' fill='none' stroke='#5a3a10' stroke-width='3.4'/><path d='M" + q(-R, YA) + " A" + R + ",4.5 0 0 0 " + q(R, YA) + "' fill='none' stroke='#e6bd62' stroke-width='1.8'/>";   // la metà davanti
    [-1.18, -.4, .4, 1.18].forEach(function (a) { s += goccia(R * Math.sin(a), YA + 4.5 * Math.cos(a) + 1, 7); });   // le gocce appese all'anello
    s += candela(-Math.PI / 2, 1) + candela(Math.PI / 2, 1) + candela(-Math.PI / 4, 1) + candela(Math.PI / 4, 1) + candela(0, 1);
    s += "<ellipse cx='0' cy='97.5' rx='4' ry='1.5' fill='" + u(p, "or") + "'" + bordo(ORO_L, .8) + "/>" + goccia(0, 98.5, 13);   // la goccia grande in fondo
    s += pth(stella(-20, 70, 3) + stella(11, 44, 2.4) + stella(0, 106, 3.2) + stella(23, 79, 2.6) + stella(-9, 31, 2) + stella(-26, 54, 2), "#fff");   // i lampi dei cristalli
    return s;
  }

  function tenda(p) {   // la tenda di velluto di sinistra col drappo e il cordone d'oro (quella di destra è la stessa allo specchio)
    var forma = "M-2,-2 L33,-2 L33,30 C33,112 23,182 12,206 C19,236 27,272 35,305 L-2,307 Z";
    var s = pth(forma, u(p, "te")), luci = "", ombre = "";
    [[5, 1.5, 3], [12, 4.5, 11], [19, 7.5, 19], [26, 10.5, 27]].forEach(function (f) {   // le pieghe: dall'alto si stringono al cordone e poi si riaprono
      function piega(a, m, b) { return "M" + q(a, -2) + " C" + q(a, 110) + " " + q(m + (a - m) * .45, 175) + " " + q(m, 206) + " C" + q(m + 2, 236) + " " + q(b - 3, 276) + " " + q(b, 307) + " "; }
      luci += piega(f[0], f[1], f[2]); ombre += piega(f[0] + 3.4, f[1] + 1.4, f[2] + 3.6);
    });
    s += "<g clip-path='" + u(p, "tc") + "'>" + tratto(luci, "#e8516a", 2.6, " opacity='.42'") + tratto(ombre, "#3e0410", 2.8, " opacity='.5'") +
      "<rect x='-2' y='272' width='40' height='36' fill='" + u(p, "tb") + "'/></g>";   // giù, sul pavimento, più in ombra
    s += pth(forma, "none", bordo("#2e0309", 1.6));
    var mant = "M-2,-2 L52,-2 L52,5 C50,21 39,34 23,34 C11,34 3,31 -2,28 Z";   // il drappo in alto, con la frangia
    s += pth(mant, u(p, "tm"), bordo("#2e0309", 1.6));
    s += tratto("M-2,9 C12,22 34,22 50,6 M-2,19 C10,29 30,30 46,16", "#e8516a", 2, " opacity='.38'") + tratto("M-2,14 C12,26 32,26 48,11", "#3e0410", 2, " opacity='.45'");
    s += tratto("M52,6.5 C50,22.5 39,36 23,36 C11,36 3,33 -2,30", "#b8862a", 5, " stroke-dasharray='1 1.3' stroke-linecap='butt'");
    s += tratto("M52,4.5 C50,20.5 39,33.5 23,33.5 C11,33.5 3,30.5 -2,27.5", "#f3d488", 1.4);
    s += tratto("M-2,201 C4,205 9,209 14.5,206.5", "#5a3a10", 5) + tratto("M-2,200.5 C4,204.5 9,208.5 14.5,206", "#efc867", 3, " stroke-dasharray='2.2 1' stroke-linecap='butt'");   // il cordone attorcigliato
    s += "<circle cx='15' cy='209' r='3' fill='" + u(p, "or") + "'" + bordo(ORO_L, .8) + "/>";   // la nappa
    s += pth("M12.6,212 L17.4,212 L19.6,228 C17,230 13,230 10.4,228 Z", u(p, "or"), bordo(ORO_L, .8)) + tratto("M13.5,214 L12.4,227.5 M15,214 L15,228.5 M16.5,214 L17.6,227.5", "#7a5216", .6);
    return s;
  }

  function quadro(p, x, y, w, h, tela) {   // un quadretto nella cornice dorata (la tela si disegna nel riquadro interno, da 0,0)
    var s = "<rect x='" + (x + 2) + "' y='" + (y + 3) + "' width='" + w + "' height='" + h + "' fill='#000' opacity='.4'/>";   // l'ombra sulla parete
    s += pth("M" + q(x + w / 2 - 6, y + 1) + " C" + q(x + w / 2 - 5, y - 5) + " " + q(x + w / 2 + 5, y - 5) + " " + q(x + w / 2 + 6, y + 1) + " Z", u(p, "oq"), bordo("#3e2608", 1.1));   // la conchiglia in cima
    s += "<rect x='" + x + "' y='" + y + "' width='" + w + "' height='" + h + "' fill='" + u(p, "oq") + "'" + bordo("#3e2608", 1.3) + "/>";
    s += "<rect x='" + (x + 2.2) + "' y='" + (y + 2.2) + "' width='" + (w - 4.4) + "' height='" + (h - 4.4) + "' fill='none' stroke='#fff2c0' stroke-width='.7' stroke-dasharray='0 1.8' stroke-linecap='round' opacity='.8'/>";   // le perline incise
    s += "<g transform='translate(" + (x + 4.5) + "," + (y + 4.5) + ")'>" + tela + "</g>";
    s += "<rect x='" + (x + 4.5) + "' y='" + (y + 4.5) + "' width='" + (w - 9) + "' height='" + (h - 9) + "' fill='none' stroke='#3a2206' stroke-width='1.1'/>";
    [[x + 1.8, y + 1.8], [x + w - 1.8, y + 1.8], [x + 1.8, y + h - 1.8], [x + w - 1.8, y + h - 1.8]].forEach(function (c) { s += "<circle cx='" + c[0] + "' cy='" + c[1] + "' r='2' fill='#fbe6a6' stroke='#7a5216' stroke-width='.6'/>"; });   // le rosette agli angoli
    return s;
  }
  function paesaggio(p) {   // la tela di sinistra: un paesaggio al tramonto (19×53)
    return "<rect width='19' height='53' fill='" + u(p, "ci") + "'/>" + tratto("M2,9 C5,7.5 8,8.5 10,9.5 M9,15 C12,13.5 15,14 17,15", "#fff", 1.4, " opacity='.35'") +
      "<circle cx='6' cy='31' r='3.2' fill='#fff2c4' opacity='.85'/>" +
      pth("M0,33 C4,30 7,31 10,32.5 C13,30.5 16,30 19,31.5 V40 H0 Z", "#7d9690") + pth("M0,39 C5,35.5 10,37 19,35 V53 H0 Z", "#5b7240") +
      pth("M0,46 C6,43 12,44.5 19,43 V53 H0 Z", "#3c4a26") + tratto("M3,53 C6,48 4,44 9,40.5", "#d6e8ea", 1.2, " opacity='.7'") +
      tratto("M14.6,46 L15,30", "#3a2a18", 1) + "<circle cx='14' cy='26' r='4.5' fill='#2f4a26'/><circle cx='16.6' cy='30' r='3.6' fill='#2f4a26'/><circle cx='12' cy='31' r='3.4' fill='#2a4222'/><circle cx='12.8' cy='24.6' r='1.7' fill='#6e8f45' opacity='.85'/>";
  }
  function ritratto(p) {   // la tela di destra: un ritratto antico, figura scura col colletto bianco (19×53)
    return "<rect width='19' height='53' fill='" + u(p, "rf") + "'/>" +
      pth("M1,53 C1,42 5,37 9.5,36 C14,37 18,42 18,53 Z", "#1d1a22") + tratto("M4,43 C5.5,39 7.6,37.8 9.5,37.6", "#5a5468", .9, " opacity='.8'") +
      "<ellipse cx='9.5' cy='35.6' rx='5.4' ry='2' fill='#efe9dc' stroke='#a59b88' stroke-width='.4'/>" + tratto("M6,35.2 L6.6,36.8 M8.2,34.6 L8.4,37.2 M10.6,34.6 L10.4,37.2 M12.8,35.2 L12.2,36.8", "#b5aa94", .4) +
      "<ellipse cx='9.5' cy='28' rx='3.8' ry='5' fill='" + u(p, "vi") + "'/>" +
      pth("M5.6,27 C5.4,21 8,19.5 9.6,19.5 C12,19.5 14,21.5 13.6,27 C12.8,24 11.5,22.8 9.6,22.8 C7.6,22.8 6.4,24 5.6,27 Z", "#3a2414");
  }

  function pavimento(p) {   // il parquet a spina ungherese: le file di listelli corrono verso il punto di fuga (200, YH)
    var YH = -170, K = 800 - YH, C = 70, dZc = .6 * C / K, dS = .6 * C * .62 / K, Zw = K / (300 - YH);
    function P(u, z) { return [200 + u / z, YH + K / z]; }   // dal pavimento allo schermo (u = scarto in fondo allo schermo, z = profondità: 1 in basso)
    function M(a) { return "M" + Math.round(a[0]) + " " + Math.round(a[1]); }
    function Lr(a) { return "L" + Math.round(a[0]) + " " + Math.round(a[1]); }
    var file = "", vicini = "", lontani = "", fasce = "", scuri = "", chiari = "", r = rnd(4127);
    var j0 = Math.floor(-200 * Zw / C) - 1, j1 = Math.ceil(200 * Zw / C), kMax = Math.ceil((Zw - 1) / dS) + 1;
    function fuori(a, b) { return (a[1] < 299 && b[1] < 299) || (a[1] > 801 && b[1] > 801) || (a[0] < -2 && b[0] < -2) || (a[0] > 402 && b[0] > 402); }
    for (var j = j0; j <= j1; j++) {
      var u0 = j * C, u1 = u0 + C, disp = (j & 1) === 1, o = disp ? dZc : 0, dz = disp ? -dZc : dZc, prima = null;
      var t0 = P(u0, Zw), b0 = P(u0, 1);
      if (!fuori(t0, b0) || j === j1) file += M(t0) + Lr(b0);
      if (disp) { var t1 = P(u1, Zw), b1 = P(u1, 1); fasce += M(t0) + Lr(t1) + Lr(b1) + Lr(b0) + "Z"; }   // le file con i listelli girati prendono la luce in un altro modo
      for (var k = -2; k <= kMax; k++) {
        var zl = 1 + k * dS + o, a = P(u0, zl), b = P(u1, zl + dz);
        if (!fuori(a, b)) { var seg = M(a) + Lr(b); if ((a[1] + b[1]) / 2 > 470) vicini += seg; else lontani += seg; }
        if (prima && !(fuori(a, b) && fuori(prima[0], prima[1]))) {   // qualche listello un po' più scuro o più chiaro
          var x = r(), lst = M(prima[0]) + Lr(prima[1]) + Lr(b) + Lr(a) + "Z";
          if (x < .2) scuri += lst; else if (x < .34) chiari += lst;
        }
        prima = [a, b];
      }
    }
    var s = "<g clip-path='" + u(p, "pc") + "'><rect y='300' width='400' height='500' fill='" + u(p, "pv") + "'/>";
    s += pth(fasce, "#ffe2b4", " opacity='.08'") + pth(scuri, "#2a1206", " opacity='.11'") + pth(chiari, "#ffe6c2", " opacity='.08'");
    s += tratto(lontani, "#2a1206", .7, " opacity='.32' stroke-linecap='butt'") + tratto(vicini, "#2a1206", 1, " opacity='.3' stroke-linecap='butt'") + tratto(file, "#2a1206", 1, " opacity='.38' stroke-linecap='butt'");
    s += "<ellipse cx='200' cy='350' rx='240' ry='120' fill='" + u(p, "pl") + "'/>";   // la luce dei lampadari e del pannello sul legno lucido
    s += "<ellipse cx='33' cy='326' rx='18' ry='34' fill='" + u(p, "lu") + "' opacity='.6'/><ellipse cx='367' cy='326' rx='18' ry='34' fill='" + u(p, "lu") + "' opacity='.6'/>";   // i riflessi dei lampadari
    s += "<rect y='300' width='400' height='500' fill='" + u(p, "pk") + "'/><rect y='540' width='400' height='260' fill='" + u(p, "pg") + "'/>";   // più scuro ai lati e in basso
    s += "<rect y='300' width='400' height='24' fill='" + u(p, "pw") + "'/></g>";   // l'ombra ai piedi della parete
    return s;
  }

  function sala(p) {
    var D = [], S = [], i;
    // --- le sfumature ---
    D.push(lin(p + "mu", 0, 0, 0, 1, [[0, "#163c30"], [.5, "#1d4a3b"], [1, "#133429"]]));   // la parete
    D.push(lin(p + "or", 0, 0, 0, 1, ORO), lin(p + "oq", 0, 0, 1, 1, ORO));   // l'oro (dall'alto e di sbieco)
    D.push(lin(p + "cr", 0, 0, 1, 1, [[0, "#ffffff"], [.4, "#e2f1ff"], [.75, "#a9c2da"], [1, "#6f88a2"]]));   // il cristallo
    D.push(rad(p + "lu", .5, .5, .5, [[0, "#ffe0a0", .75], [.35, "#ffc870", .3], [1, "#ffb84a", 0]]));   // il bagliore caldo
    D.push(rad(p + "gl", .5, .5, .5, [[0, "#ffd890", .42], [.5, "#ffc870", .14], [1, "#ffb84a", 0]]));   // l'alone grande dei lampadari
    D.push(rad(p + "sp", .5, .45, .5, [[0, "#ffe4ae", .26], [.6, "#ffd28a", .09], [1, "#ffd28a", 0]]));   // la luce sul pannello
    D.push(lin(p + "lati", 0, 0, 1, 0, [[0, "#000", .4], [.2, "#000", 0], [.8, "#000", 0], [1, "#000", .4]]));
    D.push(lin(p + "om", 0, 0, 0, 1, [[0, "#000", .5], [1, "#000", 0]]));   // ombra che sfuma verso il basso
    D.push(lin(p + "omg", 0, 0, 0, 1, [[0, "#000", 0], [1, "#000", .3]]));   // ombra che sfuma verso l'alto
    D.push(lin(p + "mo", 0, 0, 0, 1, [[0, "#6a2a14"], [1, "#3a150a"]]), lin(p + "pa", 0, 0, 1, 1, [[0, "#7a3418"], [1, "#4a1a0b"]]));   // il mogano
    D.push(lin(p + "te", -2, 0, 33, 0, [[0, "#5e0613"], [.35, "#a3142a"], [.62, "#b81c33"], [.88, "#7c0a1c"], [1, "#4a0410"]], true));   // il velluto della tenda
    D.push(lin(p + "tm", 0, 0, 0, 1, [[0, "#6e0716"], [.5, "#b01a30"], [1, "#7a0a1c"]]), lin(p + "tb", 0, 0, 0, 1, [[0, "#000", 0], [1, "#000", .45]]));
    D.push(lin(p + "ci", 0, 0, 0, 1, [[0, "#6f8fb4"], [.45, "#c9b48e"], [.62, "#f0c27c"]]), rad(p + "rf", .35, .3, .8, [[0, "#6e4c2a"], [1, "#1a1009"]]), rad(p + "vi", .35, .35, .7, [[0, "#f6d2ae"], [1, "#b47a52"]]));   // le due tele
    D.push(lin(p + "pv", 0, 0, 0, 1, [[0, "#a96f3b"], [.3, "#935c31"], [1, "#623a1d"]]));   // il parquet
    D.push(rad(p + "pl", .5, .5, .5, [[0, "#ffd99c", .26], [.6, "#ffcf88", .08], [1, "#ffcf88", 0]]));
    D.push(lin(p + "pk", 0, 0, 1, 0, [[0, "#140803", .5], [.24, "#140803", 0], [.76, "#140803", 0], [1, "#140803", .5]]), lin(p + "pg", 0, 0, 0, 1, [[0, "#140803", 0], [1, "#140803", .55]]), lin(p + "pw", 0, 0, 0, 1, [[0, "#000", .45], [1, "#000", 0]]));
    D.push("<clipPath id='" + p + "pc'><rect y='300' width='400' height='500'/></clipPath>");
    D.push("<clipPath id='" + p + "tc'><path d='M-2,-2 L33,-2 L33,30 C33,112 23,182 12,206 C19,236 27,272 35,305 L-2,307 Z'/></clipPath>");
    // il damasco: il motivo grande a mandorla con le volute, ripetuto a quinconce
    var ric = "M10.5,-6 C14,-9 18,-10 19.5,-6.5 C20.5,-4 18.5,-1.8 16.5,-3 C17.5,-4.5 16,-6.5 13.8,-5 C12.5,-4 11.6,-2.8 10.8,-1.5 Z M7,12 C11,12 14,15 13.5,18.5 C13,20.5 10.5,20.8 10,19 C11.5,18.5 11.6,16 9.6,15 Z";
    var mot = simm(0, -27, [[1.6, -25, 2.8, -22.5, 2.4, -19.5], [4.5, -21.5, 8.5, -22, 9.5, -18.5], [10.2, -15.8, 8, -14.2, 5.2, -14.6], [8.8, -11, 10.8, -5.5, 10.6, -.5], [10.4, 5.5, 7, 10, 3.2, 13], [5.8, 14.5, 8.8, 16.5, 9.4, 20], [9.8, 23, 6.5, 24.5, 4.2, 22.2], [3, 24, 1.5, 25.5, 0, 27.5]]);
    D.push("<path id='" + p + "dm' d='" + mot + " " + ric + " " + specchio(ric, 0) + "'/><path id='" + p + "db' d='" + simm(0, -8, [[3.5, -5, 4.5, -2, 4.5, .5], [4.5, 3.5, 2.8, 6.5, 0, 9]]) + " M0,-21 C1,-19.5 1,-18 0,-16.5 C-1,-18 -1,-19.5 0,-21 Z'/>");
    var pat = "<pattern id='" + p + "da' x='8' width='48' height='68' patternUnits='userSpaceOnUse'>", pos = [[24, 34], [0, 0], [48, 0], [0, 68], [48, 68]];
    pos.forEach(function (c) { pat += "<use href='#" + p + "dm' x='" + (c[0] + .9) + "' y='" + (c[1] + 1.1) + "' fill='#0b2219' opacity='.42'/>"; });
    pos.forEach(function (c) { pat += "<use href='#" + p + "dm' x='" + c[0] + "' y='" + c[1] + "' fill='#2f6c53' opacity='.48'/><use href='#" + p + "db' x='" + c[0] + "' y='" + c[1] + "' fill='#163c30' opacity='.8'/>"; });
    D.push(pat + "</pattern>");
    // il pannello rialzato della boiserie (6 uguali)
    D.push("<g id='" + p + "bp'><rect width='57.3' height='38' fill='#2a0e05'/>" + pth("M0,0 H57.3 L53.3,4 H4 V34 L0,38 Z", "#8c4222") + "<rect x='4' y='4' width='49.3' height='30' fill='" + u(p, "pa") + "'/><rect x='8.5' y='8.5' width='40.3' height='21' fill='none' stroke='#d8a64c' stroke-width='.8' opacity='.7'/></g>");
    D.push("<g id='" + p + "la'>" + lampadario(p) + "</g><g id='" + p + "ta'>" + tenda(p) + "</g>");

    // --- la parete ---
    S.push("<rect width='400' height='240' fill='" + u(p, "mu") + "'/><rect width='400' height='240' fill='" + u(p, "da") + "'/>");
    S.push("<ellipse cx='200' cy='130' rx='230' ry='150' fill='" + u(p, "sp") + "'/><rect width='400' height='240' fill='" + u(p, "lati") + "'/>");
    S.push("<rect y='20' width='400' height='28' fill='" + u(p, "om") + "'/><rect y='190' width='400' height='40' fill='" + u(p, "omg") + "'/>");
    // la cornice del soffitto coi dentelli
    S.push("<rect width='400' height='8' fill='#1e130c'/><rect y='7' width='400' height='8' fill='" + u(p, "or") + "'/><rect y='15' width='400' height='6' fill='#4a2e0e'/>");
    S.push(tratto("M0,17.8 H400", "#d8ae58", 5, " stroke-dasharray='4 3' stroke-linecap='butt'") + tratto("M0,15.7 H400", "#fbe7a8", .9, " stroke-dasharray='4 3' stroke-linecap='butt'") + tratto("M0,21.4 H400", "#e3b85e", 1.6, " stroke-dasharray='0 2.4'") + "<rect y='7' width='400' height='1' fill='#fff4cc' opacity='.6'/>");
    // la boiserie di mogano col corrimano dorato
    S.push("<rect y='232' width='400' height='70' fill='" + u(p, "mo") + "'/><rect y='227.5' width='400' height='4.5' fill='" + u(p, "or") + "'/><rect y='232' width='400' height='7' fill='#7a3418'/><rect y='232' width='400' height='1.2' fill='#c26a38' opacity='.8'/><rect y='239' width='400' height='7' fill='" + u(p, "om") + "'/>");
    S.push(tratto("M0,229.8 H400", "#fff2c4", 1, " stroke-dasharray='0 2.6'"));
    for (i = 0; i < 6; i++) S.push("<use href='#" + p + "bp' x='" + n(8 + i * 65.33) + "' y='247'/>");
    // il pavimento, poi il battiscopa sopra il suo bordo
    S.push(pavimento(p));
    S.push("<rect y='289' width='400' height='13' fill='#2a0d05'/><rect y='289' width='400' height='1.6' fill='#b25a2c' opacity='.7'/><rect y='292.4' width='400' height='.9' fill='#d8a64c' opacity='.55'/>");
    // i quadretti, le tende, gli aloni e i lampadari
    S.push(quadro(p, 28, 134, 28, 62, paesaggio(p)) + quadro(p, 344, 134, 28, 62, ritratto(p)));
    S.push("<use href='#" + p + "ta'/><use href='#" + p + "ta' transform='matrix(-1 0 0 1 400 0)'/>");
    S.push("<circle cx='33' cy='62' r='74' fill='" + u(p, "gl") + "'/><circle cx='367' cy='62' r='74' fill='" + u(p, "gl") + "'/>");
    S.push("<use href='#" + p + "la' x='33'/><use href='#" + p + "la' x='367'/>");
    return svg("0 0 400 800", " preserveAspectRatio='xMidYMid slice'", D.join(""), S.join(""));
  }

  // =========================================================
  //  LA SEDIA del pubblico (200×264, stesso riquadro dell'avatar seduto)
  // =========================================================
  function sedia(p) {
    var D = [], S = [], L = "#4a250c";
    D.push(lin(p + "o", 0, 0, 1, 0, ORO), lin(p + "ov", 0, 0, 0, 1, [[0, "#fff1bf"], [.35, "#e3b555"], [1, "#8a5a1c"]]));   // l'oro: luce da sinistra e dall'alto
    D.push(rad(p + "or", .38, .32, .7, [[0, "#fff6d0"], [.55, "#e0b252"], [1, "#8a5a1c"]]));
    D.push(lin(p + "v", 0, 0, 1, 1, [[0, "#da3c55"], [.45, "#a5142c"], [1, "#5a0614"]]));   // il velluto
    D.push(lin(p + "vt", 0, 0, 0, 1, [[0, "#7e0c20"], [1, "#c92a42"]]), lin(p + "vr", 0, 0, 0, 1, [[0, "#e44a62"], [.45, "#b0182f"], [1, "#5e0716"]]));
    D.push(rad(p + "lc", .5, .5, .5, [[0, "#fff", .22], [1, "#fff", 0]]));
    var gambaD = "M61,214 L67.5,214 L66,244.5 L62.5,244.5 Z";   // la gamba di dietro (in ombra sotto la seduta)
    S.push("<ellipse cx='100' cy='251.5' rx='58' ry='6' fill='#000' opacity='.15'/>");
    S.push(pth(gambaD + " " + specchio(gambaD, 100), "#8f5f1f", bordo(L, 1.5)));
    // lo schienale: il velluto nella cornice, la traversa a "cappello da gendarme", i montanti scanalati con le pigne
    S.push(pth("M57,111 C77,107 89,99.5 100,99.5 C111,99.5 123,107 143,111 L143,190 L57,190 Z", u(p, "v"), bordo(L, 2)));
    S.push("<ellipse cx='80' cy='143' rx='12' ry='27' fill='" + u(p, "lc") + "'/>");   // il riflesso morbido sul velluto
    S.push(tratto("M60.5,114.5 C79,110.5 90,103 100,103 C110,103 121,110.5 139.5,114.5 L139.5,186.5 L60.5,186.5 Z", "#e0b257", 1.3, " opacity='.95'"));
    S.push(pth("M43,106 C70,102 86,91.5 100,91.5 C114,91.5 130,102 157,106 L157,113.5 C130,109.5 114,99 100,99 C86,99 70,109.5 43,113.5 Z", u(p, "ov"), bordo(L, 2)));
    S.push(tratto("M46,110 C71,106 87,95.5 100,95.5 C113,95.5 129,106 154,110", "#fff2c4", 1, " stroke-dasharray='0 2.4' opacity='.9'"));
    var mont = "M43,104 C43,101.5 44.8,100 47.5,100 L52.5,100 C55.2,100 57,101.5 57,104 L57,201 L43,201 Z";
    S.push(pth(mont, u(p, "o"), bordo(L, 2)) + pth(specchio(mont, 100), u(p, "o"), bordo(L, 2)));
    S.push(tratto("M47.4,112 L47.4,194 M52.6,112 L52.6,194 M147.4,112 L147.4,194 M152.6,112 L152.6,194", "#8a5a1c", 1, " opacity='.75'") + tratto("M45.2,107 L45.2,196 M145.2,107 L145.2,196", "#fff2c4", .9, " opacity='.85'"));
    var pigna = "M50,84 C54.5,86 55.4,91 53.6,96.5 L46.4,96.5 C44.6,91 45.5,86 50,84 Z";
    S.push("<ellipse cx='50' cy='99.5' rx='7.4' ry='2.3' fill='" + u(p, "ov") + "'" + bordo(L, 1.4) + "/><ellipse cx='150' cy='99.5' rx='7.4' ry='2.3' fill='" + u(p, "ov") + "'" + bordo(L, 1.4) + "/>");
    S.push(pth(pigna + " " + specchio(pigna, 100), u(p, "or"), bordo(L, 1.6)) + tratto("M46.6,90 L53,95 M53.4,90 L47,95 M146.6,90 L153,95 M153.4,90 L147,95", "#8a5a1c", .6, " opacity='.7'"));
    S.push("<circle cx='50' cy='83.4' r='1.7' fill='" + u(p, "or") + "'" + bordo(L, 1) + "/><circle cx='150' cy='83.4' r='1.7' fill='" + u(p, "or") + "'" + bordo(L, 1) + "/>");
    // la seduta imbottita: il piano visto un po' dall'alto e il bordo tondo davanti
    S.push(pth("M56,186.5 L144,186.5 C150,186.5 154,190 155.5,197 L44.5,197 C46,190 50,186.5 56,186.5 Z", u(p, "vt"), bordo(L, 1.6)));
    S.push(pth("M43,196 L157,196 C159.4,196 160.6,198 160.6,201.5 C160.6,205 159.4,207.5 156.6,207.5 L43.4,207.5 C40.6,207.5 39.4,205 39.4,201.5 C39.4,198 40.6,196 43,196 Z", u(p, "vr"), bordo(L, 1.8)));
    S.push(tratto("M44,198.6 L156,198.6", "#ff9aae", 1.2, " opacity='.45'") + tratto("M42,206.4 L158,206.4", "#e0b257", 1.4));
    // la fascia dorata coi dadi e le rosette, poi le gambe affusolate e scanalate
    S.push("<rect x='41' y='207.5' width='118' height='11.5' fill='" + u(p, "ov") + "'" + bordo(L, 1.8) + "/>" + tratto("M59,215.8 L141,215.8", "#fff2c4", 1.1, " stroke-dasharray='0 2.6'"));
    S.push("<rect x='41' y='206' width='16' height='15.5' rx='1' fill='" + u(p, "ov") + "'" + bordo(L, 1.6) + "/><rect x='143' y='206' width='16' height='15.5' rx='1' fill='" + u(p, "ov") + "'" + bordo(L, 1.6) + "/>");
    S.push("<circle cx='49' cy='213.7' r='4.2' fill='" + u(p, "or") + "' stroke='#8a5a1c' stroke-width='.8'/><circle cx='151' cy='213.7' r='4.2' fill='" + u(p, "or") + "' stroke='#8a5a1c' stroke-width='.8'/><circle cx='49' cy='213.7' r='1.5' fill='#9a6a24'/><circle cx='151' cy='213.7' r='1.5' fill='#9a6a24'/>");
    var gamba = "M43.5,221.5 L54.5,221.5 L52.6,246 L45.4,246 Z", piede = "M45.4,246 L52.6,246 L51.4,251.5 C50.6,252.6 47.4,252.6 46.6,251.5 Z";
    S.push(pth(gamba, u(p, "o"), bordo(L, 1.8)) + pth(specchio(gamba, 100), u(p, "o"), bordo(L, 1.8)) + pth(piede + " " + specchio(piede, 100), u(p, "o"), bordo(L, 1.4)));
    S.push("<rect x='42.5' y='221.5' width='13' height='4' rx='1' fill='" + u(p, "ov") + "'" + bordo(L, 1.2) + "/><rect x='144.5' y='221.5' width='13' height='4' rx='1' fill='" + u(p, "ov") + "'" + bordo(L, 1.2) + "/>");
    S.push(tratto("M47.3,228 L47.7,243 M50.7,228 L50.3,243 M149.3,228 L149.7,243 M152.7,228 L152.3,243", "#8a5a1c", .9, " opacity='.75'") + tratto("M45.4,227 L46.8,244 M145.4,227 L146.8,244", "#fff2c4", .8, " opacity='.8'"));
    return svg("0 0 200 264", "", D.join(""), S.join(""));
  }

  // =========================================================
  //  IL LEGGIO del banditore, visto dalla sua parte (200×150)
  // =========================================================
  function leggio(p) {
    var D = [], S = [], L = "#2a0e06";
    D.push(lin(p + "m", 0, 0, 0, 1, [[0, "#7a3219"], [.5, "#5a2010"], [1, "#3a1208"]]), lin(p + "mh", 0, 0, 1, 0, [[0, "#9a4a26"], [.5, "#6e2c14"], [1, "#3e1408"]]));   // il mogano
    D.push(lin(p + "pa", 0, 0, 1, 1, [[0, "#7a3418"], [1, "#4a1a0b"]]), lin(p + "bu", 0, 0, 0, 1, [[0, "#0e0402"], [1, "#30140a"]]));
    D.push(lin(p + "pi", 0, 0, 0, 1, [[0, "#5e2410"], [1, "#8e4220"]]), lin(p + "pe", 0, 0, 1, 1, [[0, "#347558"], [1, "#163a2c"]]));   // il piano e la pelle verde
    D.push(lin(p + "lb", 0, 0, 0, 1, [[0, "#b0582c"], [.3, "#7a3219"], [1, "#2e0e05"]]), lin(p + "o", 0, 0, 0, 1, ORO), rad(p + "ce", .4, .35, .7, [[0, "#b0663a"], [1, "#4a1a0a"]]));
    D.push(lin(p + "sc", 0, 0, 0, 1, [[0, "#000", 0], [1, "#000", .45]]));
    D.push("<g id='" + p + "pn'><rect width='66' height='64' fill='#2a0e05'/>" + pth("M0,0 H66 L62,4 H4 V60 L0,64 Z", "#8c4222") + "<rect x='4' y='4' width='58' height='56' fill='" + u(p, "pa") + "'/><rect x='8.5' y='8.5' width='49' height='47' fill='none' stroke='#d8a64c' stroke-width='.8' opacity='.7'/></g>");
    // il mobile e il vano sotto il piano, col ripiano
    S.push("<rect x='10' y='30' width='180' height='124' fill='" + u(p, "m") + "'" + bordo(L, 2.5) + "/><rect x='24' y='38' width='152' height='35' fill='" + u(p, "bu") + "'/><rect x='24' y='67' width='152' height='6' fill='#5e2410'/>");
    // sul ripiano: i fogli, il catalogo, il bicchiere d'acqua
    S.push(pth("M32,66 L80.5,64.5 L80.5,69.5 L32,71 Z", "#e6dcc6", bordo("#a89a80", .7)) + pth("M33,58.5 L77,57 L80.5,64.5 L32,66 Z", "#f7f1e3", bordo("#a89a80", .7)));
    S.push(pth("M86,64.5 L139.5,63.5 L139.5,69.5 L86,70.5 Z", "#efe6cf", bordo("#8a7d62", .6)) + tratto("M32,67.7 L80.5,66.2 M86,66.5 L139.5,65.5 M86,68.5 L139.5,67.5", "#c3b28e", .5));
    S.push(pth("M88,57 L136,56 L139.5,63.5 L86,64.5 Z", "#1f3d70", bordo("#0c1a33", .9)) + tratto("M91.5,58.3 L133.5,57.4 L135.8,62.4 L90.2,63.2 Z", "#e3b555", .7) + pth("M106,59 L118,58.8 L118.6,61.6 L105.6,61.8 Z", "#e3b555"));
    var bic = "M148,43 L168,43 L166.4,69.6 C166.4,71.2 149.6,71.2 149.6,69.6 Z";
    S.push(pth(bic, "#fff", " opacity='.13'") + pth("M148.7,53 L167.3,53 L166.4,69.6 C166.4,71.2 149.6,71.2 149.6,69.6 Z", "#a8d8ef", " opacity='.42'") + "<ellipse cx='158' cy='53' rx='9.3' ry='1.6' fill='#e0f4fc' opacity='.75'/>");
    S.push(pth(bic + " M148,43 A10,2 0 1 0 168,43 A10,2 0 1 0 148,43", "none", bordo("#e2f2fa", 1) + " opacity='.92'") + tratto("M151.3,46 L152.2,68 M150.6,68 L165.4,68", "#fff", 1.4, " opacity='.55'"));
    S.push("<rect x='22' y='71.5' width='156' height='7' fill='" + u(p, "lb") + "'" + bordo(L, 1.4) + "/>");
    // sotto: due pannelli rialzati e i pilastrini scanalati
    S.push("<use href='#" + p + "pn' x='30' y='86'/><use href='#" + p + "pn' x='104' y='86'/>");
    var pil = "M10,32 L24,32 L24,154 L10,154 Z";
    S.push(pth(pil + " " + specchio(pil, 100), u(p, "mh"), bordo(L, 1.8)) + tratto("M14.6,48 V152 M19.4,48 V152 M180.6,48 V152 M185.4,48 V152", L, .9, " opacity='.7'"));
    S.push("<rect x='9' y='38' width='16' height='5' fill='" + u(p, "o") + "'" + bordo(L, 1) + "/><rect x='175' y='38' width='16' height='5' fill='" + u(p, "o") + "'" + bordo(L, 1) + "/>");
    S.push("<rect x='10' y='80' width='180' height='74' fill='" + u(p, "sc") + "'/>");
    // il piano inclinato con la pelle verde e il bordo che ferma i fogli
    S.push(pth("M14,4.5 L186,4.5 L197,24 L3,24 Z", u(p, "pi"), bordo(L, 2.2)) + pth("M24,8 L176,8 L184,21 L16,21 Z", u(p, "pe")) + tratto("M27,9.6 L173,9.6 L179.6,19.4 L20.4,19.4 Z", "#e3b555", .7, " opacity='.85'"));
    S.push(pth("M0,23.5 L200,23.5 L200,35.5 C200,37 199,38 197.5,38 L2.5,38 C1,38 0,37 0,35.5 Z", u(p, "lb"), bordo(L, 2.2)) + tratto("M2,25.6 H198", "#e08a54", 1, " opacity='.6'") + tratto("M2,30.5 H198", "#e3b555", .9, " opacity='.8'"));
    // sul piano: i fogli dell'asta, la base tonda e il martelletto
    S.push(pth("M33,9.5 L64,7.6 L67.5,20 L35,21.6 Z", "#f7f1e3", bordo("#a89a80", .7)) + tratto("M37,11.6 L61,10.2 M38,14 L62,12.6 M38.6,16.4 L54,15.6 M37,60 L72,59 M37,62 L74,61", "#8f8470", .5, " opacity='.55'"));
    S.push("<ellipse cx='162' cy='20.6' rx='15.5' ry='3' fill='#000' opacity='.3'/><ellipse cx='139' cy='19.6' rx='10' ry='2.4' fill='#000' opacity='.25' transform='rotate(28 139 19.6)'/>");   // le ombre della base e del martelletto sulla pelle
    S.push(pth("M146,14 L146,18 C146,21.2 174,21.2 174,18 L174,14 Z", "#4a1a0a", bordo(L, 1.2)) + "<ellipse cx='160' cy='14' rx='14' ry='4.4' fill='" + u(p, "ce") + "'" + bordo(L, 1.2) + "/>" + tratto("M150,12.6 C153,10.8 158,10.2 162,10.4", "#fff", 1, " opacity='.35'"));
    S.push(tratto("M121,31.5 L134.5,15", L, 4.4) + tratto("M121,31.5 L134.5,15", "#8e4a22", 2.6) + "<circle cx='120.6' cy='32' r='2.6' fill='#6e2c14'" + bordo(L, 1) + "/>");
    S.push("<g transform='rotate(39.3 135.5 13.8)'><rect x='124.5' y='9.3' width='22' height='9' rx='3' fill='" + u(p, "lb") + "'" + bordo(L, 1.3) + "/>" + tratto("M129.3,9.6 V18 M141.7,9.6 V18", L, 1.8, " opacity='.55' stroke-linecap='butt'") + tratto("M127,11.4 H144", "#f0b080", .9, " opacity='.6'") + "</g>");
    return svg("0 0 200 150", "", D.join(""), S.join(""));
  }

  // i disegni sono sempre uguali: si fanno una volta sola (per ogni prefisso)
  var FATTI = {};
  function una(nome, fn, pDef) { return function (p) { p = p ? p + pDef.slice(3) : pDef; var k = nome + "|" + p; return FATTI[k] || (FATTI[k] = fn(p)); }; }
  A.sala = una("sala", sala, "aslS");
  A.sedia = una("sedia", sedia, "aslC");
  A.leggio = una("leggio", leggio, "aslL");
})();
