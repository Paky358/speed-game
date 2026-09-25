/* =========================================================
   GIOCO — "Horto Muso" (corsa di cavalli, tipo Derby Dash)
   Corsie DRITTE (stessa distanza per tutti), ma con la TELECAMERA
   che segue la corsa come in TV: i cavalli restano grandi, prato,
   staccionata, tribuna e cartelli dei metri scorrono. In alto la
   minimappa del percorso a mezzo ovale. Si parte dai cancelletti.
   Meccanica: velocità di base costante; tasto FRUSTA = boost per un
   istante ma consuma energia; se non frusti si ricarica; a 0 =
   SFINIMENTO (rallenta e frusta bloccata 3s). Vince il primo al traguardo.
   Modalità: contro i bot (1–7) oppure ONLINE (host-autoritativo: l'host
   simula tutto e trasmette le posizioni ~15 volte al secondo; gli ospiti
   mandano solo le frustate). I posti liberi online li giocano i bot.
   Cavalli disegnati in SVG (zampe snodate che galoppano con il CSS) con
   l'avatar di ogni giocatore in sella; si aggiorna solo la posizione.
   ========================================================= */
(function () {
  "use strict";

  var COLORI = ["#ffd43b", "#ff6b6b", "#4dabf7", "#51cf66", "#cc5de8", "#ff922b", "#20c997", "#f783ac"];
  var MAXN = 8;                          // massimo cavalli al via
  var METRI = 1000;                      // lunghezza della corsa (solo per i cartelli e la minimappa)
  var LUNGH = 4.5;                       // la pista è lunga 4,5 schermate: la telecamera la percorre
  function altezze(N) {                  // righe del photo finish: più cavalli = più basse
    if (N <= 4) return { ff: 100 };
    if (N <= 6) return { ff: 76 };
    return { ff: 56 };
  }
  var V_BASE = 0.055, V_BOOST = 0.165, V_SFIN = 0.018;
  var BOOST_MS = 280, COST = 13, REGEN = 16, REGEN_SFIN = 22, SFIN_MS = 3000, STAM_MAX = 100;
  function botParam(diff) { return { S: diff === "facile" ? 42 : diff === "difficile" ? 18 : 28, I: diff === "facile" ? 520 : diff === "difficile" ? 290 : 350 }; }

  // ---------- fantini: gli avatar dei giocatori, i bot con la loro faccia fissa ----------
  var BOT_NOMI = ["Matt", "Sara", "Leo", "Nina", "Giulia", "Toni", "Rosa"];   // il primo bot è sempre Matt
  function nomeBot(i) { return BOT_NOMI[(i - 1) % BOT_NOMI.length]; }
  var MATT = { forma: "uomo", corpo: "medio", pelle: 2, capelli: "ciuffo", colCap: 1, barba: "corta", capo: "felpa", maglia: 1,
    cappello: "cappellino", colAcc: 0, sopracc: "decise", occhi: "furbi", bocca: "ghigno" };
  var BOT_DONNA = { Sara: "lunghi", Nina: "caschetto", Giulia: "coda", Rosa: "riccilunghi" }, BOT_UOMO = { Leo: "corti", Toni: "spettinati" };
  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function facciaDi(nome, cfg) {
    if (avatarValido(cfg)) return cfg;
    if (nome === "Matt") return MATT;
    if (!window.SGOmino) return null;
    var c = SGOmino.casuale(nome);   // faccia fissa dal nome, donna o uomo come il nome
    if (BOT_DONNA[nome]) { c.forma = "donna"; c.barba = "no"; c.capelli = BOT_DONNA[nome]; }
    if (BOT_UOMO[nome]) { c.forma = "uomo"; c.capelli = BOT_UOMO[nome]; c.orecchini = "nessuno"; c.cappello = "nessuno"; c.ombretto = c.eyeliner = c.mascara = c.rossetto = c.blush = "nessuno"; if (/gonna/.test(c.sotto)) c.sotto = "jeans"; }
    return c;
  }
  function avatariPer(nomi, cfgs) { return nomi.map(function (n, i) { return facciaDi(n, cfgs && cfgs[i]); }); }
  var ultimiAv = [];   // gli avatar della corsa in corso (servono anche a photo finish e podio)
  function busto(cfg) { try { return cfg && window.SGOmino ? SGOmino.svg(cfg, { busto: true }) : ""; } catch (e) { return ""; } }

  // ---------- il cavallo (SVG di profilo, verso destra) ----------
  // mantello: [pelo, criniera, segni bianchi: 0 niente / 1 stella+calzini / 2 lista+balzane]
  var MANTI = [["#9a5b2e", "#241509", 1], ["#2f2a27", "#0d0b0a", 0], ["#cfc9bf", "#7b766f", 0], ["#dcab5c", "#f6ecd6", 2],
    ["#b8642a", "#8a3f15", 2], ["#6e4a33", "#1d130c", 1], ["#e9e4dc", "#b9b3aa", 0], ["#7a3b22", "#2a120a", 1]];
  function tono(h, k) {
    var n = parseInt(h.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k))); }
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  var NUMCAV = 0;
  function cavalloSVG(i, fantino) {
    var manto = MANTI[i % MANTI.length], col = COLORI[i % COLORI.length], num = i + 1;
    var id = "hoc" + (NUMCAV++), P = manto[0], C = manto[1], segni = manto[2];
    var S = tono(P, -.32), SS = tono(P, -.5), L = tono(P, .22), LL = tono(P, .4), CL = tono(C, .25), Z = "#2a2420";
    function u(n) { return "url(#" + id + n + ")"; }
    var defs = "<defs>" +
      "<linearGradient id='" + id + "b' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + L + "'/><stop offset='.45' stop-color='" + P + "'/><stop offset='1' stop-color='" + S + "'/></linearGradient>" +
      "<linearGradient id='" + id + "g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + P + "'/><stop offset='1' stop-color='" + S + "'/></linearGradient>" +
      "<linearGradient id='" + id + "gl' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + S + "'/><stop offset='1' stop-color='" + SS + "'/></linearGradient>" +
      "<radialGradient id='" + id + "m' cx='.4' cy='.35' r='.6'><stop offset='0' stop-color='" + LL + "' stop-opacity='.75'/><stop offset='1' stop-color='" + LL + "' stop-opacity='0'/></radialGradient>" +
      "<linearGradient id='" + id + "c' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + CL + "'/><stop offset='1' stop-color='" + C + "'/></linearGradient>" +
      "<linearGradient id='" + id + "s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + tono(col, .25) + "'/><stop offset='1' stop-color='" + tono(col, -.2) + "'/></linearGradient>" +
      "</defs>";
    // zampa anteriore: avambraccio (ruota alla spalla) + stinco (ruota al ginocchio) + zoccolo
    function anteriore(x, y, rit, lontana, calza) {
      var f = lontana ? u("gl") : u("g"), cz = calza && !lontana;
      return "<g class='za-s' style='transform-origin:" + x + "px " + y + "px;animation-delay:" + rit + "s'>" +
        "<path d='M" + (x - 10) + "," + (y - 6) + " C" + (x - 11) + "," + (y + 8) + " " + (x - 7) + "," + (y + 18) + " " + (x - 5) + "," + (y + 27) + " L" + (x + 5) + "," + (y + 27) + " C" + (x + 7) + "," + (y + 16) + " " + (x + 11) + "," + (y + 4) + " " + (x + 9) + "," + (y - 8) + " Z' fill='" + f + "'/>" +
        (lontana ? "" : "<path d='M" + (x - 6) + "," + (y + 2) + " Q" + (x - 7) + "," + (y + 14) + " " + (x - 4) + "," + (y + 22) + "' stroke='" + SS + "' stroke-width='1.2' fill='none' opacity='.35'/>") +
        "<g class='za-i' style='transform-origin:" + x + "px " + (y + 27) + "px;animation-delay:" + rit + "s'>" +
          "<ellipse cx='" + x + "' cy='" + (y + 27) + "' rx='5' ry='4' fill='" + f + "'/>" +
          "<path d='M" + (x - 4) + "," + (y + 27) + " L" + (x - 3.5) + "," + (y + 45) + " Q" + (x - 5) + "," + (y + 49) + " " + (x - 3) + "," + (y + 52) + " L" + (x + 5.5) + "," + (y + 52) + " Q" + (x + 5) + "," + (y + 48) + " " + (x + 3.5) + "," + (y + 45) + " L" + (x + 4) + "," + (y + 27) + " Z' fill='" + (cz ? "#f4f1ea" : f) + "'/>" +
          "<path d='M" + (x - 4) + "," + (y + 51) + " L" + (x + 6) + "," + (y + 51) + " L" + (x + 8) + "," + (y + 58) + " L" + (x - 4.5) + "," + (y + 58) + " Z' fill='" + Z + "'/>" +
        "</g></g>";
    }
    // zampa posteriore: gamba (ruota alla grassella) + garretto che piega all'indietro + stinco
    function posteriore(x, y, rit, lontana, calza) {
      var f = lontana ? u("gl") : u("g"), cz = calza && !lontana, hx = x - 9, hy = y + 26;
      return "<g class='zp-s' style='transform-origin:" + x + "px " + y + "px;animation-delay:" + rit + "s'>" +
        "<path d='M" + (x - 12) + "," + (y - 8) + " C" + (x - 17) + "," + (y + 6) + " " + (x - 16) + "," + (y + 18) + " " + (hx - 4) + "," + hy + " L" + (hx + 5) + "," + (hy + 1) + " C" + (x + 1) + "," + (y + 14) + " " + (x + 8) + "," + (y + 4) + " " + (x + 11) + "," + (y - 6) + " Z' fill='" + f + "'/>" +
        "<g class='zp-i' style='transform-origin:" + hx + "px " + hy + "px;animation-delay:" + rit + "s'>" +
          "<ellipse cx='" + (hx - 1) + "' cy='" + hy + "' rx='4.5' ry='4.5' fill='" + f + "'/>" +
          "<path d='M" + (hx - 4) + "," + hy + " L" + (hx - 2) + "," + (hy + 22) + " Q" + (hx - 3) + "," + (hy + 26) + " " + (hx - 1) + "," + (hy + 28) + " L" + (hx + 7) + "," + (hy + 28) + " Q" + (hx + 6) + "," + (hy + 24) + " " + (hx + 5) + "," + (hy + 21) + " L" + (hx + 4) + "," + (hy + 1) + " Z' fill='" + (cz ? "#f4f1ea" : f) + "'/>" +
          "<path d='M" + (hx - 2) + "," + (hy + 27) + " L" + (hx + 8) + "," + (hy + 27) + " L" + (hx + 10) + "," + (hy + 34) + " L" + (hx - 2.5) + "," + (hy + 34) + " Z' fill='" + Z + "'/>" +
        "</g></g>";
    }
    var fant = fantino ? fantino.replace("<svg ", "<svg x='69' y='-16' width='76' height='78' ") : "";
    var corpo = "M58,50 C78,44 96,56 116,52 C127,50 133,44 140,38 C150,28 157,19 165,13 C169,10 175,10 179,13 C189,21 199,29 206,37 C210,42 208,48 202,49 C196,50 190,47 184,45 C178,44 174,46 170,50 C164,58 158,66 157,78 C156,85 150,91 140,92 C124,95 100,95 84,92 C72,90 58,89 51,81 C43,72 44,56 58,50 Z";
    return "<svg class='ho-svg' viewBox='0 0 220 150' xmlns='http://www.w3.org/2000/svg'>" + defs +
      "<ellipse cx='110' cy='143' rx='66' ry='6.5' fill='rgba(0,0,0,.28)'/>" +
      "<g class='ho-corpo'>" +
      posteriore(80, 86, -.12, 1, 0) + anteriore(146, 84, -.32, 1, 0) +   // zampe lontane (più scure)
      "<g class='ho-coda'>" +
        "<path d='M54,56 C38,54 28,66 26,84 C24,100 30,112 38,120 C36,104 40,92 46,82 C50,74 55,68 58,64 Z' fill='" + u("c") + "'/>" +
        "<path d='M52,60 C40,62 34,76 34,92 C34,104 38,112 44,118' stroke='" + CL + "' stroke-width='1.5' fill='none' opacity='.6'/>" +
        "<path d='M50,64 C44,72 40,86 42,100' stroke='" + tono(C, -.3) + "' stroke-width='1.3' fill='none' opacity='.5'/>" +
      "</g>" +
      posteriore(84, 86, 0, 0, segni) + anteriore(150, 84, -.2, 0, segni === 2) +   // zampe vicine: l'attacco resta sotto la pancia
      "<path d='" + corpo + "' fill='" + u("b") + "'/>" +
      "<ellipse cx='70' cy='66' rx='22' ry='17' fill='" + u("m") + "'/>" +
      "<ellipse cx='140' cy='66' rx='16' ry='15' fill='" + u("m") + "'/>" +
      "<path d='M60,58 C66,74 74,86 86,92' stroke='" + SS + "' stroke-width='1.3' fill='none' opacity='.28'/>" +
      "<path d='M130,52 C136,64 140,76 146,88' stroke='" + SS + "' stroke-width='1.3' fill='none' opacity='.25'/>" +
      "<path d='M92,91 C104,93 120,93 132,91' stroke='" + SS + "' stroke-width='2' fill='none' opacity='.25'/>" +
      "<path d='M150,40 C158,32 166,24 172,18' stroke='" + LL + "' stroke-width='2' fill='none' opacity='.35'/>" +
      "<path d='M178,26 C188,30 198,36 204,42' stroke='" + LL + "' stroke-width='1.6' fill='none' opacity='.35'/>" +
      (segni === 1 ? "<path d='M180,20 l3,-3 l3,3 l-3,4 Z' fill='#f7f4ee'/>" : "") +
      (segni === 2 ? "<path d='M178,18 C184,20 196,30 204,40 C204,44 202,46 199,46 C194,38 186,28 176,21 Z' fill='#f7f4ee'/>" : "") +
      "<path d='M168,14 C167,6 169,1 172,-1 C175,4 175,9 174,14 Z' fill='" + S + "'/>" +
      "<path d='M170,12 C170,7 171,4 172,2 C173,6 173,9 172,12 Z' fill='" + SS + "' opacity='.6'/>" +
      "<path d='M173,14 C174,7 177,3 180,2 C181,7 180,11 178,15 Z' fill='" + P + "'/>" +
      "<ellipse cx='183' cy='23' rx='3.6' ry='3' fill='#1a1210'/>" +
      "<circle cx='184.3' cy='22' r='1.1' fill='#fff'/>" +
      "<path d='M179,21 Q183,18.5 187,21' stroke='" + SS + "' stroke-width='1.2' fill='none'/>" +
      "<path d='M201,40 q3,-2 4,1 q-2,2 -4,-1 Z' fill='#1a1210' opacity='.75'/>" +
      "<path d='M196,47 Q200,48 204,47' stroke='" + SS + "' stroke-width='1' fill='none' opacity='.7'/>" +
      "<path d='M174,12 L190,42' stroke='#3b2a1a' stroke-width='2' fill='none'/>" +
      "<path d='M188,33 Q196,32 204,36' stroke='#3b2a1a' stroke-width='2.2' fill='none'/>" +
      "<path d='M171,15 Q176,12 181,14' stroke='" + col + "' stroke-width='2.4' fill='none'/>" +
      "<circle cx='192' cy='43' r='2.2' fill='none' stroke='#d8d8d8' stroke-width='1.3'/>" +
      "<path d='M165,12 C160,16 154,24 148,32 C142,40 138,46 134,50 C140,50 144,46 146,42 C148,46 152,44 152,40 C156,40 158,34 158,30 C162,30 164,24 164,20 C168,18 168,14 165,12 Z' fill='" + u("c") + "'/>" +
      "<path d='M163,16 C158,22 152,30 146,38' stroke='" + CL + "' stroke-width='1.2' fill='none' opacity='.7'/>" +
      "<path d='M170,10 C174,12 178,16 178,20 C175,18 172,17 170,16 Z' fill='" + u("c") + "'/>" +
      "<path d='M84,52 Q106,46 126,51 L130,84 Q106,90 82,84 Z' fill='" + u("s") + "'/>" +
      "<path d='M84,52 Q106,46 126,51 L130,84 Q106,90 82,84 Z' fill='none' stroke='#fff' stroke-width='2' opacity='.85'/>" +
      "<text x='106' y='76' text-anchor='middle' font-size='18' font-weight='900' fill='#fff' stroke='rgba(0,0,0,.45)' stroke-width='3' paint-order='stroke' font-family='system-ui,sans-serif'>" + num + "</text>" +
      "<g class='ho-fantino'>" + fant + "<path d='M126,44 Q160,40 191,43' stroke='#3b2a1a' stroke-width='1.6' fill='none'/></g>" +
      "</g></svg>";
  }

  function assicuraStile() {
    if (document.getElementById("sg-horto-css")) return;
    var s = document.createElement("style"); s.id = "sg-horto-css";
    s.textContent = [
      // scena a tutto schermo
      ".schermata.ho-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#3c8e37}",
      ".schermata.ho-piena>.testa,.schermata.ho-piena>.piede{display:none}",
      ".schermata.ho-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".ho-scena{position:relative;height:var(--alt,100dvh);display:flex;flex-direction:column;overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".ho-esci{position:absolute;left:8px;top:calc(8px + env(safe-area-inset-top));z-index:20;width:38px;height:38px;border-radius:50%;border:0;",
        "background:rgba(0,0,0,.35);color:#fff;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      // cielo, tribuna, minimappa
      ".ho-cielo{position:relative;flex:0 0 auto;height:112px;background:linear-gradient(#5db8ff,#bfe6ff 70%,#e8f6ff);overflow:hidden}",
      ".ho-sole{position:absolute;right:22px;top:10px;width:30px;height:30px;border-radius:50%;background:#fff6c9;box-shadow:0 0 28px 10px rgba(255,240,170,.8)}",
      ".ho-nuv{position:absolute;height:14px;border-radius:9px;background:#fff;opacity:.9;animation:hoNuv 40s linear infinite}",
      ".ho-nuv:before{content:'';position:absolute;left:9px;top:-8px;width:20px;height:20px;border-radius:50%;background:#fff}",
      "@keyframes hoNuv{from{transform:translateX(640px)}to{transform:translateX(-120px)}}",
      ".ho-tribuna{position:absolute;left:0;right:0;bottom:0;height:46px;background:linear-gradient(#c9483e,#9b2f2a)}",
      ".ho-tribuna:before{content:'';position:absolute;left:-10px;right:-10px;top:-12px;height:14px;background:repeating-linear-gradient(90deg,#fff 0 18px,#e04b3f 18px 36px)}",
      ".ho-folla{position:absolute;left:0;right:0;top:5px;bottom:6px;background-image:radial-gradient(circle at 6px 7px,#ffd6a8 4px,transparent 5px),",
        "radial-gradient(circle at 17px 5px,#6b4a2f 4px,transparent 5px),radial-gradient(circle at 11px 15px,#f0c090 4px,transparent 5px);background-size:22px 19px;animation:hoTifo .5s steps(2) infinite}",
      "@keyframes hoTifo{50%{transform:translateY(-2px)}}",
      ".ho-mappa{position:absolute;left:54px;top:calc(6px + env(safe-area-inset-top));width:128px;height:54px;border-radius:12px;background:rgba(10,30,20,.55);padding:3px;z-index:3}",
      ".ho-mappa svg{width:100%;height:100%;display:block;overflow:visible}",
      ".ho-hud{position:absolute;right:10px;top:calc(8px + env(safe-area-inset-top));z-index:3;text-align:right;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.45);line-height:1}",
      ".ho-hud b{display:block;font-size:1.9rem;font-weight:900}",
      ".ho-hud span{font-size:.8rem;font-weight:800}",
      ".ho-stacc{flex:0 0 auto;height:16px;background:linear-gradient(#fff 0 3px,transparent 3px 8px,#fff 8px 11px,transparent 11px),repeating-linear-gradient(90deg,#fff 0 4px,transparent 4px 44px),#3f8f3a}",
      // pista
      ".ho-pista{position:relative;flex:1 1 auto;overflow:hidden;background:repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 36px,rgba(0,0,0,.05) 36px 72px),linear-gradient(#4aa244,#3c8e37)}",
      ".ho-corsia{position:absolute;left:0;right:0;border-bottom:2px solid rgba(255,255,255,.35)}",
      ".ho-corsia.mia{background:rgba(255,215,60,.13);box-shadow:inset 0 0 0 3px rgba(255,202,58,.85)}",
      ".ho-mondo{position:absolute;left:0;top:0;bottom:0;width:0;will-change:transform}",
      ".ho-cancelli{position:absolute;top:0;bottom:0;left:0;width:20px;display:flex;flex-direction:column;background:#1f5d2c;box-shadow:3px 0 6px rgba(0,0,0,.3);z-index:4}",
      ".ho-porta{flex:1;border-bottom:3px solid #1f5d2c;background:repeating-linear-gradient(0deg,#fff 0 6px,#e03131 6px 12px);transform-origin:0 50%;transition:transform .35s ease-out,opacity .35s}",
      ".ho-cancelli.aperti .ho-porta{transform:scaleX(.12);opacity:.7}",
      ".ho-cartello{position:absolute;top:0;bottom:0;width:3px;background:rgba(255,255,255,.4)}",
      ".ho-cartello b{position:absolute;top:4px;left:50%;transform:translateX(-50%);background:#fff;color:#1c3a1c;border-radius:6px;padding:1px 6px;font-size:.72rem;font-weight:900;white-space:nowrap}",
      ".ho-arrivo{position:absolute;top:0;bottom:0;width:12px;background:repeating-linear-gradient(45deg,#fff 0 6px,#111 6px 12px);z-index:1}",
      ".ho-arrivo b{position:absolute;top:4px;left:18px;background:#e03131;color:#fff;border-radius:6px;padding:1px 7px;font-size:.75rem;font-weight:900;white-space:nowrap}",
      // cavalli
      ".ho-cav{position:absolute;left:0;aspect-ratio:220/150;will-change:transform;z-index:2}",
      ".ho-cav .ho-svg{width:100%;height:100%;display:block;overflow:visible}",
      ".ho-cav.dietro,.ho-cav.avanti{opacity:.55}",
      ".ho-targa{position:absolute;left:44%;top:-20%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;white-space:nowrap;z-index:3;",
        "background:rgba(0,0,0,.45);color:#fff;border-radius:10px;padding:1px 7px 1px 1px;font-weight:800;font-size:.72rem}",
      ".ho-targa i{font-style:normal;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#111;font-size:.66rem;font-weight:900}",
      ".ho-cav.mio .ho-targa{background:rgba(255,202,58,.95);color:#241f00}",
      ".ho-polv{position:absolute;bottom:4%;left:0;width:26%;height:30%;pointer-events:none;opacity:0;transition:opacity .3s}",
      ".ho-corre .ho-polv{opacity:1}",
      ".ho-polv b{position:absolute;bottom:0;width:13px;height:13px;border-radius:50%;background:rgba(214,186,140,.75);animation:hoPuf .5s linear infinite}",
      ".ho-polv b:nth-child(2){animation-delay:.17s;left:30%}.ho-polv b:nth-child(3){animation-delay:.33s;left:55%}",
      "@keyframes hoPuf{from{transform:translate(40px,0) scale(.4);opacity:.9}to{transform:translate(-18px,-16px) scale(1.5);opacity:0}}",
      ".ho-vento{position:absolute;left:-30%;top:22%;width:40%;height:50%;opacity:0;transition:opacity .15s;",
        "background:repeating-linear-gradient(0deg,transparent 0 7px,rgba(255,255,255,.75) 7px 9px);-webkit-mask:linear-gradient(90deg,transparent,#000);mask:linear-gradient(90deg,transparent,#000)}",
      ".ho-cav.boost .ho-vento{opacity:1}",
      // galoppo (solo quando si corre; più veloce con la frusta, lento se sfinito)
      ".za-s,.za-i,.zp-s,.zp-i,.ho-corpo,.ho-coda,.ho-fantino{animation:.42s linear infinite;animation-play-state:paused;transform-box:view-box}",
      ".za-s{animation-name:hoZas}.za-i{animation-name:hoZai}.zp-s{animation-name:hoZps}.zp-i{animation-name:hoZpi}",
      ".ho-corpo{animation-name:hoBob;animation-timing-function:ease-in-out}.ho-fantino{animation-name:hoFbob;animation-timing-function:ease-in-out}",
      ".ho-coda{animation-name:hoCoda;animation-timing-function:ease-in-out;transform-origin:52px 64px}",
      ".ho-corre .za-s,.ho-corre .za-i,.ho-corre .zp-s,.ho-corre .zp-i,.ho-corre .ho-corpo,.ho-corre .ho-coda,.ho-corre .ho-fantino{animation-play-state:running}",
      ".ho-cav.boost .za-s,.ho-cav.boost .za-i,.ho-cav.boost .zp-s,.ho-cav.boost .zp-i,.ho-cav.boost .ho-corpo,.ho-cav.boost .ho-coda,.ho-cav.boost .ho-fantino{animation-duration:.28s}",
      ".ho-cav.sfin .za-s,.ho-cav.sfin .za-i,.ho-cav.sfin .zp-s,.ho-cav.sfin .zp-i,.ho-cav.sfin .ho-corpo,.ho-cav.sfin .ho-coda,.ho-cav.sfin .ho-fantino{animation-duration:.8s}",
      ".ho-cav.sfin .ho-svg{filter:saturate(.4) brightness(.85)}",
      ".ho-cav.arr .za-s,.ho-cav.arr .za-i,.ho-cav.arr .zp-s,.ho-cav.arr .zp-i,.ho-cav.arr .ho-corpo,.ho-cav.arr .ho-coda,.ho-cav.arr .ho-fantino{animation-duration:.7s}",
      "@keyframes hoZas{0%{transform:rotate(-30deg)}45%{transform:rotate(24deg)}100%{transform:rotate(-30deg)}}",
      "@keyframes hoZai{0%{transform:rotate(-6deg)}42%{transform:rotate(0deg)}58%{transform:rotate(45deg)}76%{transform:rotate(80deg)}94%{transform:rotate(8deg)}100%{transform:rotate(-6deg)}}",
      "@keyframes hoZps{0%{transform:rotate(-24deg)}50%{transform:rotate(24deg)}100%{transform:rotate(-24deg)}}",
      "@keyframes hoZpi{0%{transform:rotate(0deg)}45%{transform:rotate(12deg)}66%{transform:rotate(-42deg)}86%{transform:rotate(-26deg)}100%{transform:rotate(0deg)}}",
      "@keyframes hoBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}",
      "@keyframes hoFbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}",
      "@keyframes hoCoda{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(10deg)}}",
      // conto alla rovescia
      ".ho-conto{position:absolute;left:0;right:0;top:38%;text-align:center;font-size:4.5rem;font-weight:900;color:#fff;z-index:10;pointer-events:none;",
        "text-shadow:0 4px 0 rgba(0,0,0,.35),0 0 24px rgba(0,0,0,.35);transition:transform .2s,opacity .3s}",
      ".ho-conto.via{color:#ffe066}",
      ".ho-conto.via.sparisci{opacity:0;transform:scale(1.4)}",
      // comandi
      ".ho-sotto{flex:0 0 auto;padding:8px 12px calc(12px + env(safe-area-inset-bottom));background:#16204a;display:flex;flex-direction:column;gap:7px}",
      ".ho-info{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:.95rem;min-height:1.3em}",
      ".ho-stam{height:12px;border-radius:7px;background:rgba(0,0,0,.45);overflow:hidden;border:1px solid rgba(255,255,255,.25)}",
      ".ho-stam .fill{height:100%;width:100%;border-radius:7px;transition:width .1s linear}",
      ".ho-frusta{width:100%;min-height:72px;border:0;border-radius:18px;cursor:pointer;font-family:inherit;font-weight:900;",
        "font-size:1.5rem;color:#241f00;background:linear-gradient(135deg,#ffe58a,var(--accento) 60%,var(--accento-scuro));",
        "box-shadow:0 8px 22px rgba(224,169,10,.35);-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;}",
      ".ho-frusta:active{transform:scale(.98);}",
      ".ho-frusta:disabled{filter:grayscale(.6);opacity:.7;}",
      ".ho-frusta.sfin{background:linear-gradient(135deg,#ff8787,#c92a2a);color:#fff;}",
      // photo-finish (replay zoomato del traguardo prima della classifica)
      ".ho-ff{position:relative;border-radius:16px;overflow:hidden;margin:8px 0 4px;",
        "background:repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 30px,rgba(0,0,0,.05) 30px 60px),linear-gradient(#4aa244,#3c8e37)}",
      ".ho-ff-line{position:absolute;top:0;bottom:0;left:86%;width:9px;z-index:1;opacity:.95;",
        "background:repeating-linear-gradient(45deg,#fff 0 6px,#111 6px 12px);}",
      ".ho-ff-lane{position:absolute;left:0;right:0;border-bottom:1px solid rgba(255,255,255,.25)}",
      ".ho-ff-label{position:absolute;left:6px;top:4px;display:flex;align-items:center;gap:6px;z-index:4;max-width:52%;background:rgba(0,0,0,.4);border-radius:10px;padding:1px 8px 1px 1px}",
      ".ho-ff-num{width:18px;height:18px;border-radius:50%;font-size:.7rem;font-weight:900;color:#111;",
        "display:flex;align-items:center;justify-content:center;flex:0 0 auto;}",
      ".ho-ff-nome{font-size:.8rem;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".ho-ff-cav{position:absolute;bottom:2%;left:-15%;height:94%;aspect-ratio:220/150;transform:translateX(-50%);z-index:3;",
        "transition:left 2.6s cubic-bezier(.3,.55,.35,1);will-change:left;}",
      ".ho-ff-cav .ho-svg{width:100%;height:100%;display:block;overflow:visible}",
      ".ho-ff-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:6;transition:opacity .55s ease-out;}",
      ".ho-ff-flash.on{opacity:.92;transition:opacity .05s;}",
      ".ho-ff-big{text-align:center;font-size:1.5rem;font-weight:900;min-height:1.6em;margin-top:4px;",
        "opacity:0;transform:scale(.8);transition:opacity .3s,transform .3s;}",
      ".ho-ff-big.show{opacity:1;transform:scale(1);color:var(--accento);}",
      // podio
      ".ho-podio{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:4px 0 14px}",
      ".ho-gradino{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center}",
      ".ho-gradino .fac{width:72px;height:72px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1)}",
      ".ho-gradino.p1 .fac{width:92px;height:92px;box-shadow:0 0 0 3px #ffd43b,0 0 24px rgba(255,212,59,.5)}",
      ".ho-gradino .fac svg{width:100%;height:100%;display:block}",
      ".ho-gradino .nm{font-weight:800;font-size:.85rem;margin:4px 0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".ho-gradino .blocco{width:100%;border-radius:10px 10px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:6px;font-size:1.6rem;",
        "background:linear-gradient(#4055b0,#2c3a80)}",
      ".ho-gradino.p1 .blocco{height:84px;background:linear-gradient(#ffd75a,#c99a10)}",
      ".ho-gradino.p2 .blocco{height:62px;background:linear-gradient(#e6ebf2,#98a3b3)}",
      ".ho-gradino.p3 .blocco{height:46px;background:linear-gradient(#e8a866,#a8662a)}",
      ".ho-riga{display:flex;align-items:center;gap:10px;padding:6px 12px;border-radius:12px;background:rgba(255,255,255,.05)}",
      ".ho-riga.mia{background:rgba(255,202,58,.18);border:1px solid var(--accento)}",
      ".ho-riga .fac{width:40px;height:40px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
      ".ho-riga .fac svg{width:100%;height:100%;display:block}",
      "@media (prefers-reduced-motion:reduce){.ho-folla,.ho-nuv,.ho-polv b{animation:none}}"
    ].join("");
    document.head.appendChild(s);
  }

  function frustaFX() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = "square"; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.07); } catch (e) {} }
  function traguardoFX() { try { if (navigator.vibrate) navigator.vibrate([0, 40, 60, 40]); } catch (e) {}
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { [523, 659, 784, 1046].forEach(function (f, i) { var t = c.currentTime + i * 0.1, o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.2); }); } catch (e) {} }
  function scattoFoto() {   // "clack" dell'otturatore (due click ravvicinati)
    try { if (navigator.vibrate) navigator.vibrate(35); } catch (e) {}
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try {
      function click(at, dur, vol) {
        var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        var src = c.createBufferSource(); src.buffer = b;
        var hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1900;
        var g = c.createGain(); g.gain.value = vol;
        src.connect(hp); hp.connect(g); g.connect(c.destination); src.start(at); src.stop(at + dur + 0.01);
      }
      var t = c.currentTime; click(t, 0.035, 0.55); click(t + 0.075, 0.05, 0.4);
    } catch (e) {}
  }

  // ---------- fisica pura ----------
  function nuovoCav(umano, id) { return { pos: 0, stam: STAM_MAX, boostU: 0, sfin: false, sfinU: 0, umano: !!umano, id: id || null, nextClick: 0, arr: false }; }
  function frusta(h, now) { if (h.sfin || h.arr) return false; h.stam -= COST; h.boostU = now + BOOST_MS; if (h.stam <= 0) { h.stam = 0; h.sfin = true; h.sfinU = now + SFIN_MS; h.boostU = 0; } return true; }
  function botPensa(h, now, S, I) { if (h.sfin || h.arr || now < h.nextClick) return; if (h.stam <= S + Math.random() * 8) return; frusta(h, now); h.nextClick = now + I + Math.random() * 120; }
  function passoTutti(cav, now, dt, S, I, arrivi) {
    for (var k = 0; k < cav.length; k++) {
      var h = cav[k]; if (h.arr) continue;
      if (!h.umano) botPensa(h, now, S, I);
      if (h.sfin && now >= h.sfinU) h.sfin = false;
      var v = h.sfin ? V_SFIN : (now < h.boostU ? V_BOOST : V_BASE);
      h.pos += v * dt;
      if (h.sfin) h.stam = Math.min(STAM_MAX, h.stam + REGEN_SFIN * dt);
      else if (now >= h.boostU) h.stam = Math.min(STAM_MAX, h.stam + REGEN * dt);
      if (h.pos >= 1) { h.pos = 1; h.arr = true; arrivi.push(k); }
    }
  }
  function snap(cav, fase, conto, nomi) {
    var ora = performance.now();   // b = sta frustando (per il galoppo più veloce e le righe del vento)
    return { t: "snap", fase: fase, conto: conto, N: cav.length, nomi: nomi,
      cav: cav.map(function (h) { return { p: +h.pos.toFixed(4), s: Math.round(h.stam), f: h.sfin ? 1 : 0, a: h.arr ? 1 : 0, b: ora < h.boostU ? 1 : 0 }; }) };
  }
  function snapFermo(nomi, N, conto, fase) {   // cavalli fermi al via (per il countdown locale)
    var cv = []; for (var k = 0; k < N; k++) cv.push({ p: 0, s: 100, f: 0, a: 0 });
    return { fase: fase, conto: conto, N: N, nomi: nomi, cav: cv };
  }


  // ---------- minimappa: il percorso a mezzo ovale (rettilineo, curva, rettilineo) ----------
  var MAPPA = { x0: 14, x1: 100, yA: 8, yB: 46, r: 19 };
  function puntoMappa(p) {
    var m = MAPPA, dritto = m.x1 - m.x0, curva = Math.PI * m.r, tot = dritto * 2 + curva, d = Math.max(0, Math.min(1, p)) * tot;
    if (d <= dritto) return [m.x0 + d, m.yA];
    if (d <= dritto + curva) { var a = (d - dritto) / m.r; return [m.x1 + m.r * Math.sin(a), (m.yA + m.yB) / 2 - m.r * Math.cos(a)]; }
    return [m.x1 - (d - dritto - curva), m.yB];
  }

  // ---------- la corsa: scena a tutto schermo con la telecamera ----------
  function costruisci(t, N, nomi, io, cb, av) {
    assicuraStile(); var el = t.el;
    ultimiAv = av || avatariPer(nomi);
    var s = t.schermata({});
    s.classList.add("ho-piena");
    var scena = el("div", { class: "ho-scena" });
    scena.appendChild(el("button", { class: "ho-esci", text: "‹", "aria-label": "Esci dalla corsa", onclick: function () { if (window.confirm("Uscire dalla corsa?")) cb.onEsci(); } }));
    // cielo con tribuna, minimappa e posizione
    var folla = el("div", { class: "ho-folla" });
    var cielo = el("div", { class: "ho-cielo" }, [
      el("div", { class: "ho-sole" }),
      el("div", { class: "ho-nuv", style: "top:40px;width:56px" }),
      el("div", { class: "ho-nuv", style: "top:22px;width:40px;animation-delay:-20s" }),
      el("div", { class: "ho-tribuna" }, [folla])
    ]);
    var m = MAPPA, D = "M" + m.x0 + "," + m.yA + " H" + m.x1 + " A" + m.r + "," + m.r + " 0 0 1 " + m.x1 + "," + m.yB + " H" + m.x0;
    var svgM = "<svg viewBox='0 0 128 54'><path d='" + D + "' fill='none' stroke='#c9a77a' stroke-width='10' stroke-linecap='round'/>" +
      "<path d='" + D + "' fill='none' stroke='#fff' stroke-width='1' stroke-dasharray='3 3' opacity='.55'/>" +
      "<rect x='" + (m.x0 - 1) + "' y='" + (m.yA - 7) + "' width='3' height='14' fill='#51cf66'/>" +
      "<rect x='" + (m.x0 - 1) + "' y='" + (m.yB - 7) + "' width='3' height='14' fill='#fff'/><rect x='" + (m.x0 - 1) + "' y='" + (m.yB - 7) + "' width='3' height='3.5' fill='#111'/><rect x='" + (m.x0 - 1) + "' y='" + (m.yB) + "' width='3' height='3.5' fill='#111'/>";
    var ordineDisegno = []; for (var k = 0; k < N; k++) if (k !== io) ordineDisegno.push(k); ordineDisegno.push(io);   // il mio pallino sopra
    ordineDisegno.forEach(function (k) {
      svgM += "<circle data-k='" + k + "' cx='" + m.x0 + "' cy='" + m.yA + "' r='" + (k === io ? 4.6 : 3.4) + "' fill='" + COLORI[k % COLORI.length] + "' stroke='" + (k === io ? "#fff" : "rgba(0,0,0,.5)") + "' stroke-width='" + (k === io ? 1.6 : 1) + "'/>";
    });
    var mappa = el("div", { class: "ho-mappa", html: svgM + "</svg>" });
    var hudB = el("b", { text: "–" }), hudS = el("span", { text: METRI + " m" });
    cielo.appendChild(mappa); cielo.appendChild(el("div", { class: "ho-hud" }, [hudB, hudS]));
    scena.appendChild(cielo);
    var stacc = el("div", { class: "ho-stacc" }); scena.appendChild(stacc);
    // pista: corsie, "mondo" che scorre (cancelletti, cartelli dei metri, arrivo) e cavalli
    var pista = el("div", { class: "ho-pista" });
    for (k = 0; k < N; k++) pista.appendChild(el("div", { class: "ho-corsia" + (k === io ? " mia" : ""), style: "top:" + (k * 100 / N) + "%;height:" + (100 / N) + "%" }));
    var mondo = el("div", { class: "ho-mondo" });
    var cancelli = el("div", { class: "ho-cancelli" });
    for (k = 0; k < N; k++) cancelli.appendChild(el("div", { class: "ho-porta" }));
    mondo.appendChild(cancelli);
    var cartelli = [];
    for (var q = 1; q < 5; q++) { var ct = el("div", { class: "ho-cartello" }, [el("b", { text: (METRI - METRI * q / 5) + " m" })]); cartelli.push(ct); mondo.appendChild(ct); }
    var arrivo = el("div", { class: "ho-arrivo" }, [el("b", { text: "🏁 ARRIVO" })]); mondo.appendChild(arrivo);
    pista.appendChild(mondo);
    var cavEl = [];
    for (k = 0; k < N; k++) {
      var c = el("div", { class: "ho-cav" + (k === io ? " mio" : ""), style: "top:" + ((k + 0.16) * 100 / N) + "%;height:" + (0.8 * 100 / N) + "%" });
      c.appendChild(el("div", { class: "ho-targa" }, [ el("i", { style: "background:" + COLORI[k % COLORI.length], text: String(k + 1) }), el("span", { text: nomi[k] + (k === io ? " (tu)" : "") }) ]));
      c.insertAdjacentHTML("beforeend", "<div class='ho-polv'><b></b><b></b><b></b></div><div class='ho-vento'></div>" + cavalloSVG(k, busto(ultimiAv[k])));
      pista.appendChild(c); cavEl.push(c);
    }
    var conto = el("div", { class: "ho-conto", text: "" }); pista.appendChild(conto);
    scena.appendChild(pista);
    // comandi
    var info = el("span", { text: "Pronti…" });
    var fillEl = el("div", { class: "fill", style: "background:#51cf66" });
    var bFr = el("button", { class: "ho-frusta", text: "🚦 Pronti…", disabled: "disabled" });
    bFr.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onFrusta(); });
    scena.appendChild(el("div", { class: "ho-sotto" }, [ el("div", { class: "ho-info" }, [info]), el("div", { class: "ho-stam" }, [fillEl]), bFr ]));
    s._contenuto.appendChild(scena);
    function suTasto(e) { if (e.code === "Space" || e.key === " ") { e.preventDefault(); cb.onFrusta(); } }
    document.addEventListener("keydown", suTasto);
    t.mostra(s);
    var dots = [].slice.call(mappa.querySelectorAll("circle")).sort(function (a, b) { return a.getAttribute("data-k") - b.getAttribute("data-k"); });
    return { scena: scena, pista: pista, mondo: mondo, cancelli: cancelli, cartelli: cartelli, arrivo: arrivo, stacc: stacc, folla: folla,
      cavEl: cavEl, fillEl: fillEl, frusta: bFr, info: info, conto: conto, hudB: hudB, hudS: hudS, dots: dots, io: io, N: N,
      cam: null, W: 0, hw: 0, nMis: 0, tU: 0, arrT: [],
      rimuovi: function () { document.removeEventListener("keydown", suTasto); } };
  }
  function misura(ref) {
    ref.W = ref.pista.clientWidth || 360;
    // grandezza dei cavalli: l'altezza della corsia, ma mai più larghi di metà schermo (con 2 cavalli sarebbero enormi)
    var H = ref.pista.clientHeight || 400, N = ref.N, h = Math.min(H / N * 0.8, ref.W * 0.5 / (220 / 150));
    ref.cavEl.forEach(function (c, k) { c.style.height = h.toFixed(1) + "px"; c.style.top = ((k + 0.96) * H / N - h).toFixed(1) + "px"; });
    ref.hw = h * 220 / 150;
    var L = ref.W * LUNGH;
    ref.cartelli.forEach(function (c, i) { c.style.left = (L * (i + 1) / 5) + "px"; });
    ref.arrivo.style.left = L + "px";
  }
  function disegna(ref, sn) {
    var now = performance.now(), dt = ref.tU ? Math.min(0.1, (now - ref.tU) / 1000) : 0; ref.tU = now;
    if (!ref.W || ++ref.nMis > 45) { misura(ref); ref.nMis = 0; }
    var W = ref.W, L = W * LUNGH, hw = ref.hw, k, N = sn.N;
    var me = sn.cav[ref.io] || sn.cav[0], mx = 0;
    for (k = 0; k < N; k++) if (sn.cav[k].p > mx) mx = sn.cav[k].p;
    // TELECAMERA: segue chi è in testa, ma il mio cavallo resta sempre dentro l'inquadratura;
    // alla fine si ferma col traguardo a 3/4 dello schermo
    var target = Math.min(mx * L - 0.72 * W, me.p * L - hw * 1.1);
    target = Math.max(-0.72 * W, Math.min(target, L - 0.78 * W));
    ref.cam = (ref.cam == null || !dt) ? target : ref.cam + (target - ref.cam) * Math.min(1, dt * 5);
    var cam = ref.cam;
    ref.mondo.style.transform = "translate3d(" + (-cam).toFixed(1) + "px,0,0)";
    ref.pista.style.backgroundPosition = (-cam).toFixed(1) + "px 0,0 0";
    ref.stacc.style.backgroundPosition = "0 0," + (-cam).toFixed(1) + "px 0";
    ref.folla.style.backgroundPosition = (-cam * 0.3).toFixed(1) + "px 0";
    var corre = sn.fase === "corsa";
    ref.scena.classList.toggle("ho-corre", corre);
    for (k = 0; k < N; k++) {
      var c = sn.cav[k], e = ref.cavEl[k]; if (!e) continue;
      var x = c.p * L - cam - hw * 0.95;
      if (c.a) {   // arrivato: continua a trottare oltre il traguardo
        if (!ref.arrT[k]) ref.arrT[k] = now;
        x += Math.min(W * 0.5, (now - ref.arrT[k]) / 1000 * W * 0.16);
      } else ref.arrT[k] = 0;
      var cl = "";
      if (x < -hw * 0.35) { x = -hw * 0.35; cl = " dietro"; }
      else if (x > W - hw * 0.5) { x = W - hw * 0.5; cl = " avanti"; }   // chi è troppo avanti resta sul bordo, un po' trasparente
      e.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
      var nc = "ho-cav" + (k === ref.io ? " mio" : "") + cl + (c.f ? " sfin" : "") + (c.b ? " boost" : "") + (c.a ? " arr" : "");
      if (e.className !== nc) e.className = nc;
      var pm = puntoMappa(c.p), d = ref.dots[k];
      if (d) { d.setAttribute("cx", pm[0].toFixed(1)); d.setAttribute("cy", pm[1].toFixed(1)); }
    }
    // posizione e metri che mancano
    var davanti = 0; for (k = 0; k < N; k++) if (k !== ref.io && sn.cav[k].p > me.p) davanti++;
    ref.hudB.textContent = (davanti + 1) + "°";
    ref.hudS.textContent = me.a ? "🏁 arrivato" : "mancano " + Math.max(0, Math.round((1 - me.p) * METRI)) + " m";
    var fillEl = ref.fillEl, b = ref.frusta;
    if (fillEl) { fillEl.style.width = me.s + "%"; fillEl.style.background = me.f ? "#ff6b6b" : (me.s > 40 ? "#51cf66" : me.s > 18 ? "#ffd43b" : "#ff922b"); }
    if (sn.fase === "via") {
      b.disabled = true; b.className = "ho-frusta"; b.textContent = "🚦 Pronti…";
      ref.conto.className = "ho-conto" + (sn.conto > 0 ? "" : " via"); ref.conto.textContent = sn.conto > 0 ? String(sn.conto) : "VIA!";
      ref.info.textContent = "Ai cancelletti…";
      if (sn.conto <= 0) ref.cancelli.classList.add("aperti");
    } else if (corre) {
      ref.cancelli.classList.add("aperti");
      if (!ref.viaFatto) { ref.viaFatto = true; ref.conto.className = "ho-conto via"; ref.conto.textContent = "VIA!"; setTimeout(function () { ref.conto.className = "ho-conto via sparisci"; }, 350); }
      if (me.a) { b.disabled = true; b.className = "ho-frusta"; b.textContent = "🏁 Arrivato!"; }
      else if (me.f) { b.disabled = true; b.className = "ho-frusta sfin"; b.textContent = "😵 SFINITO!"; }
      else { b.disabled = false; b.className = "ho-frusta"; b.textContent = "🏇 FRUSTA! (" + me.s + "%)"; }
      ref.info.textContent = me.a ? "🏁 Traguardo!" : (davanti === 0 ? "🥇 Sei in testa!" : "Dai, frusta! 🏇");
    }
  }

  function classificaDa(cav, arrivi) {
    var resto = []; for (var k = 0; k < cav.length; k++) if (arrivi.indexOf(k) < 0) resto.push(k);
    resto.sort(function (a, b) { return cav[b].pos - cav[a].pos; });
    return arrivi.concat(resto);
  }
  // "filmatino" zoomato del traguardo: i primi arrivati scivolano oltre la linea,
  // il vincitore in evidenza; poi si passa alla classifica.
  function fotoFinish(t, ord, nomi, io, foto, poi) {
    assicuraStile();
    var el = t.el, fatto = false, scattato = false, tos = [], rafId = 0;
    var N = foto.length, vincitore = ord[0];
    var rowH = altezze(N).ff;
    var s = t.schermata({ icona: "📸", titolo: "Foto-finish", sotto: "Chi ha tagliato per primo" });
    var strip = el("div", { class: "ho-ff ho-corre", style: "height:" + (N * rowH + 8) + "px" });
    var lineEl = el("div", { class: "ho-ff-line" }); strip.appendChild(lineEl);
    var flash = el("div", { class: "ho-ff-flash" }); strip.appendChild(flash);
    var cavs = [], targetX = [];
    for (var k = 0; k < N; k++) {
      var vinc = (k === vincitore), mio = (k === io);
      // ZOOM sul traguardo: il vincitore sulla linea (86%); gli altri al distacco reale ma con un
      // distacco MINIMO garantito (max 78%), così si vede chi ha toccato per primo anche in volata.
      targetX[k] = vinc ? 86 : Math.max(6, Math.min(78, 86 - (1 - Math.min(1, foto[k])) * 280));
      var lane = el("div", { class: "ho-ff-lane" + (vinc ? " win" : ""), style: "top:" + (4 + k * rowH) + "px;height:" + rowH + "px" }, [
        el("div", { class: "ho-ff-label" }, [
          el("span", { class: "ho-ff-num", style: "background:" + COLORI[k % COLORI.length], text: String(k + 1) }),
          el("span", { class: "ho-ff-nome", text: nomi[k] + (mio ? " (tu)" : "") })
        ])
      ]);
      var cav = el("div", { class: "ho-ff-cav" });
      cav.innerHTML = cavalloSVG(k, busto(ultimiAv[k] || facciaDi(nomi[k])));
      lane.appendChild(cav); strip.appendChild(lane); cavs.push(cav);
    }
    s._contenuto.appendChild(strip);
    var big = el("div", { class: "ho-ff-big" }); s._contenuto.appendChild(big);
    function vai() { if (fatto) return; fatto = true; if (rafId) cancelAnimationFrame(rafId); tos.forEach(clearTimeout); poi(); }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "Vedi la classifica ▶", onclick: vai }));
    t.mostra(s);
    var winCav = cavs[vincitore];
    // Tutti partono affiancati e vanno alla STESSA velocità: il distacco che si vede è quello VERO
    // (in una gara tirata restano testa a testa e il musetto del vincitore emerge solo sulla linea).
    // Durata lunga = replay lento; ease-out = l'ultimo tratto rallenta (hype).
    tos.push(setTimeout(function () {
      for (var k = 0; k < N; k++) {
        cavs[k].style.transition = "left 4.0s cubic-bezier(.2,.62,.3,1)";
        cavs[k].style.left = targetX[k] + "%";
      }
      controlla();
    }, 90));
    // sicurezza: se rAF non gira (pannello nascosto), scatta quando il vincitore è arrivato alla linea
    tos.push(setTimeout(function () { if (!scattato) congela(); }, 4300));

    function controlla() {                 // rileva il tocco REALE: il muso del cavallo oltre la linea
      if (scattato || fatto) return;
      var lr = lineEl.getBoundingClientRect(), hr = winCav.getBoundingClientRect();
      if (hr.width && hr.right - hr.width * 0.05 >= lr.left + 1) { congela(); return; }
      rafId = requestAnimationFrame(controlla);
    }
    function congela() {                    // FERMA l'immagine dove sono (zampe comprese), poi la foto
      if (scattato || fatto) return; scattato = true;
      if (rafId) cancelAnimationFrame(rafId);
      cavs.forEach(function (c) { var L = getComputedStyle(c).left; c.style.transition = "none"; c.style.left = L; });
      strip.classList.remove("ho-corre");
      void strip.offsetWidth;
      scattoFoto(); flash.classList.add("on"); big.textContent = "📸"; big.classList.add("show");
      setTimeout(function () { flash.classList.remove("on"); }, 70);
      tos.push(setTimeout(riprendi, 1500)); // fermo immagine ~1,5s
      tos.push(setTimeout(vai, 7000));      // dallo scatto: max 7s di replay lento, poi la classifica
    }
    function riprendi() {                   // finisce il replay: TUTTI tagliano il traguardo (nell'ordine)
      var FINISH = 88, sr = strip.getBoundingClientRect();
      strip.classList.add("ho-corre");
      cavs.forEach(function (c) {
        var hr = c.getBoundingClientRect();
        var cur = sr.width ? ((hr.left + hr.width / 2) - sr.left) / sr.width * 100 : 80;
        var dur = Math.min(4.8, Math.max(0.6, (FINISH - cur) * 0.09));  // più lento; stessa velocità: tagliano nell'ordine
        c.style.transition = "left " + dur.toFixed(2) + "s linear";
        c.style.left = FINISH + "%";
      });
      tos.push(setTimeout(function () { big.textContent = "🏆 " + nomi[vincitore] + (vincitore === io ? " (tu)" : "") + " vince!"; traguardoFX(); }, 900));
    }
  }
  function finale(t, ord, nomi, io, foto, cb) {
    if (!foto || !foto.length) { foto = []; for (var k = 0; k < nomi.length; k++) foto[k] = (ord.indexOf(k) === 0 ? 1 : 0.9); }
    fotoFinish(t, ord, nomi, io, foto, function () { renderFine(t, ord, nomi, io, cb); });
  }

  // classifica finale: podio con gli avatar dei primi tre, poi tutti in fila
  function renderFine(t, ord, nomi, io, cb) {
    assicuraStile();
    var el = t.el, mioPosto = ord.indexOf(io) + 1, vinto = mioPosto === 1;
    var s = t.schermata({ icona: vinto ? "🏆" : "🏁", titolo: vinto ? "Hai vinto!" : "Arrivato " + mioPosto + "°", sotto: "Horto Muso" });
    function faccia(idx) { return busto(ultimiAv[idx] || facciaDi(nomi[idx])); }
    var podio = el("div", { class: "ho-podio" });
    [1, 0, 2].forEach(function (p) {
      var idx = ord[p]; if (idx == null) return;
      podio.appendChild(el("div", { class: "ho-gradino p" + (p + 1) }, [
        el("div", { class: "fac", html: faccia(idx) }),
        el("div", { class: "nm", text: nomi[idx] + (idx === io ? " (tu)" : "") }),
        el("div", { class: "blocco", text: ["🥇", "🥈", "🥉"][p] })
      ]));
    });
    s._contenuto.appendChild(podio);
    var box = el("div", { style: "display:flex;flex-direction:column;gap:6px" });
    ord.forEach(function (idx, p) {
      box.appendChild(el("div", { class: "ho-riga" + (idx === io ? " mia" : "") }, [
        el("span", { style: "font-size:1.2rem;font-weight:900;width:30px;text-align:center", text: p + 1 + "°" }),
        el("span", { class: "fac", html: faccia(idx) }),
        el("span", { style: "width:14px;height:14px;border-radius:50%;flex:0 0 auto;background:" + COLORI[idx % COLORI.length] }),
        el("span", { style: "flex:1;font-weight:800", text: nomi[idx] + (idx === io ? " (tu)" : "") })
      ]));
    });
    s._contenuto.appendChild(box);
    if (cb.sonoHost || cb.locale) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rigioca", onclick: cb.onRigioca }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per un'altra corsa…" }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
  }

  // ========================================================
  //  LOCALE — tu (corsia 0) contro 1–3 bot
  // ========================================================
  function corsa(t, nRivali, diff) {
    var N = Math.min(MAXN, 1 + Math.max(1, nRivali));
    var bp = botParam(diff), nomi = [(t.giocatori && t.giocatori[0]) || "Tu"], cav = [nuovoCav(true, "io")];
    for (var i = 1; i < N; i++) { cav.push(nuovoCav(false)); nomi.push(nomeBot(i)); }
    var av = avatariPer(nomi, [mioAvatar(nomi[0])]);
    var fase = "via", conto = 3, raf = null, toC = null, ultimo = 0, primoArr = 0, finito = false, arrivi = [], foto = null;
    var ref = costruisci(t, N, nomi, 0, {
      onFrusta: function () { if (fase === "corsa" && frusta(cav[0], performance.now())) frustaFX(); },
      onEsci: function () { stop(); t.esci(); }
    }, av);
    function stop() { finito = true; if (raf) cancelAnimationFrame(raf); if (toC) clearInterval(toC); ref.rimuovi(); }
    function frame(ts) {
      if (finito) return;
      if (!ultimo) ultimo = ts;
      var dt = Math.min(0.05, (ts - ultimo) / 1000); ultimo = ts; var now = performance.now();
      passoTutti(cav, now, dt, bp.S, bp.I, arrivi);
      if (arrivi.length && !primoArr) { primoArr = now; foto = cav.map(function (h) { return Math.min(1, h.pos); }); }
      disegna(ref, snap(cav, "corsa", 0, nomi));
      var tutti = cav.every(function (h) { return h.arr; });
      if (tutti || (cav[0].arr && now - primoArr > 4000)) return fine();
      raf = requestAnimationFrame(frame);
    }
    function fine() {
      stop();
      var ord = classificaDa(cav, arrivi);
      finale(t, ord, nomi, 0, foto, { locale: true, onRigioca: function () { corsa(t, nRivali, diff); }, onEsci: t.esci });
    }
    disegna(ref, snap(cav, "via", 3, nomi));
    toC = setInterval(function () {
      if (finito) { clearInterval(toC); return; }
      conto--;
      disegna(ref, snap(cav, "via", Math.max(0, conto), nomi));
      if (conto < 0) { clearInterval(toC); toC = null; fase = "corsa"; ultimo = 0; raf = requestAnimationFrame(frame); }
    }, 700);
  }

  // ========================================================
  //  ONLINE — host = corsia 0; gli ospiti prendono 1..3; i posti
  //  liberi li giocano i bot. Host-autoritativo: simula e trasmette.
  // ========================================================
  function hostHorto(t, diff, N) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    N = Math.max(2, Math.min(MAXN, N || 4));
    var bp = botParam(diff), codice = "…", pronta = false;
    var posti = {}, nomiU = {}, ominiU = {};   // ominiU = avatar di chi entra (posto -> cfg)
    for (var _s = 1; _s < N; _s++) { posti[_s] = null; nomiU[_s] = null; }
    var cav = null, nomi = null, ref = null, fase = "lobby", conto = 3, loop = null, toC = null, ultimo = 0, primoArr = 0, arrivi = [], ord = null, foto = null, rete = null;

    function seatDi(id) { for (var s = 1; s < N; s++) if (posti[s] === id) return s; return -1; }
    function postoLibero() { for (var s = 1; s < N; s++) if (!posti[s]) return s; return 0; }
    function quanti() { var n = 0; for (var s = 1; s < N; s++) if (posti[s]) n++; return n; }

    rete = SGNet.ospita("horto", {
      onCodice: function (c) { codice = c; aggiornaLobby(); },
      onConnesso: function () { pronta = true; aggiornaLobby(); },
      onAddio: function (id) {
        var s = seatDi(id); if (s < 0) return;
        posti[s] = null;
        if (fase === "lobby") { nomiU[s] = null; aggiornaLobby(); }
        else if (cav) { cav[s].umano = false; nomi[s] = nomeBot(s); }   // il posto passa al bot
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (fase === "lobby" && seatDi(id) < 0) { var p = postoLibero(); if (p > 0) { posti[p] = id; nomiU[p] = String(m.nome || "Amico").slice(0, 16); ominiU[p] = avatarValido(m.omino); } }
          aggiornaLobby();   // trasmette la lobby aggiornata a TUTTI (host + ospiti)
        } else if (m.t === "frusta" && fase === "corsa") {
          var sm = seatDi(id); if (sm > 0 && cav[sm] && cav[sm].umano) frusta(cav[sm], performance.now());
        }
      },
      onErrore: function () { senzaRete(t); }
    });

    function inizia() {
      fase = "via"; conto = 3; arrivi = []; primoArr = 0; ord = null; foto = null;
      nomi = [(t.giocatori && t.giocatori[0]) || "Host"]; cav = [nuovoCav(true, "host")]; var cfgs = [mioAvatar(nomi[0])];
      for (var s = 1; s < N; s++) {
        if (posti[s]) { cav.push(nuovoCav(true, posti[s])); nomi.push(nomiU[s] || ("Amico " + s)); cfgs[s] = ominiU[s]; rete.invia({ t: "seat", to: posti[s], seat: s }); }
        else { cav.push(nuovoCav(false)); nomi.push(nomeBot(s)); }
      }
      var av = avatariPer(nomi, cfgs);
      rete.invia({ t: "via", nomi: nomi, n: N, av: av });   // ogni telefono costruisce la corsa e fa il proprio countdown
      ref = costruisci(t, N, nomi, 0, {
        onFrusta: function () { if (fase === "corsa" && frusta(cav[0], performance.now())) frustaFX(); },
        onEsci: function () { chiudi(); t.esci(); }
      }, av);
      conto = 3; disegna(ref, snap(cav, "via", 3, nomi));
      toC = setInterval(function () {
        conto--; disegna(ref, snap(cav, "via", Math.max(0, conto), nomi));
        if (conto < 0) { clearInterval(toC); toC = null; fase = "corsa"; ultimo = performance.now(); nTick = 0; loop = setInterval(tick, 16); }
      }, 800);
    }
    function tick() {
      var now = performance.now(), dt = Math.min(0.1, (now - ultimo) / 1000); ultimo = now;
      passoTutti(cav, now, dt, bp.S, bp.I, arrivi);
      if (arrivi.length && !primoArr) { primoArr = now; foto = cav.map(function (h) { return Math.min(1, h.pos); }); }
      bcast();
      var tutti = cav.every(function (h) { return h.arr; });
      if (tutti || (primoArr && now - primoArr > 5000)) { clearInterval(loop); loop = null; fineCorsa(); }
    }
    // simula e disegna a ~60 al secondo (la telecamera resta liscia), ma trasmette 1 volta su 4 (~15 al secondo)
    var nTick = 0;
    function bcast() { var sn = snap(cav, fase, Math.max(0, conto), nomi); if (nTick++ % 4 === 0 || fase !== "corsa") rete.inviaVeloce(sn); if (ref) disegna(ref, sn); }
    function fineCorsa() {
      fase = "fine"; ord = classificaDa(cav, arrivi);
      if (!foto) foto = cav.map(function (h) { return Math.min(1, h.pos); });
      rete.invia({ t: "fine", ord: ord, nomi: nomi, foto: foto });
      if (ref) { ref.rimuovi(); ref = null; }
      finale(t, ord, nomi, 0, foto, { sonoHost: true, onRigioca: function () { inizia(); }, onEsci: function () { chiudi(); t.esci(); } });
    }
    function chiudi() { if (loop) clearInterval(loop); if (toC) clearInterval(toC); if (ref) ref.rimuovi(); if (rete) rete.chiudi(); }

    function seggi() {
      var a = [{ nome: (t.giocatori && t.giocatori[0]) || "Host", id: "host" }];
      for (var s = 1; s < N; s++) a.push(posti[s] ? { nome: nomiU[s], id: posti[s] } : null);
      return a;
    }
    function aggiornaLobby() {
      if (fase !== "lobby") return;
      rete.invia({ t: "lobby", codice: codice, pronta: pronta, seggi: seggi() }); // a tutti gli ospiti
      disegnaLobby();
    }
    function disegnaLobby() {
      if (fase !== "lobby") return;
      renderLobby(t, { codice: codice, pronta: pronta, sonoHost: true, myId: "host", seggi: seggi() },
        { onComincia: inizia, onEsci: function () { chiudi(); t.esci(); } });
    }
    disegnaLobby();
  }

  function ospiteHorto(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", mySeat: 0, ref: null, fase: null, nomi: null, N: 0, msg: null,
      buf: [], raf: null, lastP: [], delayMs: 120 };   // buffer per interpolare le posizioni (movimento liscio)
    schermaNome();

    // Calcola la vista da disegnare "adesso - delay" interpolando fra gli snapshot ricevuti.
    // Così, anche se i pacchetti arrivano a intervalli irregolari, il cavallo scorre liscio
    // invece di fermarsi e scattare. Se un pacchetto tarda, prosegue col suo passo (estrapola).
    function vistaOra(now) {
      var b = S.buf, last = b[b.length - 1];
      var out = { fase: last.fase, conto: last.conto, N: last.N, nomi: last.nomi, cav: [] };
      var rt = now - S.delayMs, k;
      if (b.length < 2 || rt <= b[0].rt) {
        for (k = 0; k < b[0].cav.length; k++) { var c0 = b[0].cav[k]; out.cav[k] = { p: c0.p, s: c0.s, f: c0.f, a: c0.a, b: c0.b }; }
      } else if (rt >= last.rt) {                 // pacchetto in ritardo: prosegui col passo attuale (max 100ms)
        var P = b[b.length - 2], span = Math.max(1, last.rt - P.rt), ex = Math.min(rt - last.rt, 100);
        for (k = 0; k < last.cav.length; k++) { var cl = last.cav[k], vp = (cl.p - P.cav[k].p) / span; out.cav[k] = { p: Math.min(1, cl.p + vp * ex), s: cl.s, f: cl.f, a: cl.a, b: cl.b }; }
      } else {                                    // caso normale: interpola fra i due snapshot che circondano rt
        var i = b.length - 2; while (i > 0 && b[i].rt > rt) i--;
        var A = b[i], B = b[i + 1], f = (rt - A.rt) / Math.max(1, B.rt - A.rt);
        for (k = 0; k < B.cav.length; k++) { var cb = B.cav[k]; out.cav[k] = { p: A.cav[k].p + (cb.p - A.cav[k].p) * f, s: cb.s, f: cb.f, a: cb.a, b: cb.b }; }
      }
      for (k = 0; k < out.cav.length; k++) {      // mai indietro: l'estrapolazione non deve far "rinculare" il cavallo
        if (S.lastP[k] != null && out.cav[k].p < S.lastP[k]) out.cav[k].p = S.lastP[k];
        S.lastP[k] = out.cav[k].p;
      }
      return out;
    }
    function giro(now) {
      S.raf = requestAnimationFrame(giro);
      if (!S.ref || !S.buf.length || S.fase === "fine") return;
      disegna(S.ref, vistaOra(now));
    }
    function avviaGiro() { if (!S.raf) S.raf = requestAnimationFrame(giro); }
    function fermaGiro() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = null; }
    function schermaNome() {
      var s = t.schermata({ icona: "🐎", titolo: "Entra nella corsa", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: mioAvatar(S.nome) }); attesa();
          setTimeout(function () { if (!S.ref && S.fase === null && S.msg2) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.t === "seat") { if (m.to === S.myId) { S.mySeat = m.seat; if (S.ref && S.ref.io !== m.seat) rebuild(); } }
          else if (m.t === "lobby") {
            for (var i = 0; i < (m.seggi || []).length; i++) if (m.seggi[i] && m.seggi[i].id === S.myId) S.mySeat = i;
            if (!S.ref) mostraLobby(m);   // l'ospite vede la stanza come l'host
          }
          else if (m.t === "via") {       // parte la corsa: costruisci e fai il countdown LOCALE (come l'host)
            S.nomi = m.nomi; S.N = m.n || (m.nomi ? m.nomi.length : 4); S.av = m.av || null;
            fermaGiro(); S.buf = []; S.lastP = [];   // corsa nuova (anche rivincita): riparto pulito
            build({ nomi: S.nomi, N: S.N }); S.fase = "via"; contoOspite();
          }
          else if (m.t === "snap") {
            if (S.contoTimer) { clearInterval(S.contoTimer); S.contoTimer = null; }
            if (!S.ref || S.fase === "fine") { build(m); S.buf = []; S.lastP = []; }
            S.fase = m.fase;
            var now = performance.now();
            S.buf.push({ rt: now, fase: m.fase, conto: m.conto, N: m.N, nomi: m.nomi, cav: m.cav });
            while (S.buf.length > 8 && S.buf[0].rt < now - 1500) S.buf.shift();
            avviaGiro();
          } else if (m.t === "fine") {
            if (S.contoTimer) { clearInterval(S.contoTimer); S.contoTimer = null; }
            fermaGiro(); S.buf = [];
            if (S.ref) { S.ref.rimuovi(); S.ref = null; } S.fase = "fine";
            finale(t, m.ord, m.nomi, S.mySeat, m.foto, { sonoHost: false, onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
          }
        },
        onChiuso: function () { fermaGiro(); errore(t, "Collegamento perso. L'host potrebbe aver chiuso la corsa."); },
        onErrore: function () { fermaGiro(); errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function build(sn) {
      if (S.ref) S.ref.rimuovi();
      S.nomi = sn.nomi; S.N = sn.N;
      S.ref = costruisci(t, sn.N, sn.nomi, S.mySeat || 0, {
        onFrusta: function () { if (S.fase === "corsa" && S.rete) S.rete.invia({ t: "frusta" }); },
        onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); }
      }, avatariPer(sn.nomi, S.av));
      // l'ospite guida il movimento a 60fps con l'interpolazione: niente transizione CSS
      // (si sommerebbe al ritardo e rifarebbe scattare). L'host invece la tiene, per smussare i suoi 15Hz.
      S.ref.cavEl.forEach(function (c) { c.style.transition = "none"; });
    }
    function rebuild() { if (S.nomi) build({ nomi: S.nomi, N: S.N }); }
    function contoOspite() {   // countdown locale dell'ospite (3-2-1-VIA), poi arrivano le posizioni
      if (S.contoTimer) clearInterval(S.contoTimer);
      var c = 3; disegna(S.ref, snapFermo(S.nomi, S.N, 3, "via"));
      S.contoTimer = setInterval(function () {
        if (!S.ref || S.fase !== "via") { clearInterval(S.contoTimer); S.contoTimer = null; return; }
        c--; disegna(S.ref, snapFermo(S.nomi, S.N, Math.max(0, c), "via"));
        if (c < 0) { clearInterval(S.contoTimer); S.contoTimer = null; }
      }, 800);
    }
    function mostraLobby(m) {
      renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, seggi: m.seggi },
        { onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); } });
    }
    function attesa() {   // placeholder finché non arriva la lobby dall'host
      if (S.ref) return;
      var s = t.schermata({ icona: "🐎", titolo: "Horto Muso · Sala", sotto: "Stanza " + codice.toUpperCase(),
        indietro: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg2); t.mostra(s);
    }
  }

  // lobby uguale per host e ospite: mostra tutti i posti (bot inclusi), evidenzia il proprio.
  function renderLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🐎", titolo: "Horto Muso · Sala", sotto: "Ognuno dal suo telefono",
      indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
    if (vm.sonoHost) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
      s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
      if (vm.codice && vm.codice !== "…") {
        var link = SG.creaLink({ gioco: "horto", stanza: vm.codice });
        var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
        s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
          onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
        s._contenuto.appendChild(campo);
      }
      s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (vm.pronta ? "#69db7c" : "#ffd43b"),
        text: vm.pronta ? "🟢 Stanza pronta — manda il codice" : "🟡 Sto aprendo la stanza…" }));
    } else {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin-bottom:2px", text: "✅ Sei nella stanza " + (vm.codice || "").toUpperCase() }));
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "Cavalli (i posti liberi li giocano i bot)" }));
    (vm.seggi || []).forEach(function (sg, i) {
      var mio = sg && sg.id && sg.id === vm.myId;
      var testo = sg ? ((i === 0 ? "👑 " : "") + sg.nome + (mio ? " (tu)" : "")) : "🤖 bot";
      s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:" + (mio ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)") + (mio ? ";border:1px solid var(--accento)" : "") }, [
        el("span", { style: "width:16px;height:16px;border-radius:50%;flex:0 0 auto;background:" + COLORI[i % COLORI.length] }),
        el("span", { style: "flex:1;font-weight:700", text: "🐎 " + testo })
      ]));
    });
    if (vm.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Comincia la corsa ▶", onclick: cb.onComincia }));
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "Puoi cominciare quando vuoi: i posti vuoti diventano bot." }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci la corsa…" }));
    }
    t.mostra(s);
  }

  function errore(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto corri contro i bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  SG.registra({
    id: "horto",
    nome: "Horto Muso",
    icona: "🐎",
    descrizione: "Corsa di cavalli: frusta per accelerare, ma occhio all'energia! Contro i bot o online, ognuno dal suo telefono.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 1,
    etichettaGiocatori: "👥 1–8 giocatori",   // 1 da solo vs bot, fino a 8 online (i cavalli in gara)
    regole: [
      "Si parte dai <b>cancelletti</b>: corsie dritte, stessa distanza per tutti (1000 m). La telecamera segue la corsa e in alto la minimappa mostra dove siete sul percorso.",
      "In sella c'è il tuo <b>avatar</b>; i bot sono Matt e i suoi amici.",
      "I cavalli corrono già da soli a una <b>velocità minima</b>. Tu hai il tasto <b>FRUSTA</b>: ogni click dà una spinta.",
      "Ogni frustata consuma <b>energia</b> (la barra sopra il tuo cavallo). Se non frusti, l'energia si <b>ricarica</b>.",
      "Se l'energia arriva a <b>zero</b> vai in <b>sfinimento</b>: rallenti e per <b>3 secondi</b> non puoi frustare.",
      "Vince il <b>primo</b> che taglia il traguardo. Dosa le frustate!",
      "Da <b>2 a 8 cavalli</b>: <b>contro i bot</b> oppure <b>online</b> (ognuno dal suo telefono; i posti liberi li giocano i bot)."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.cavalli = 4; dove.difficolta = "medio";
      var bBot, bOnl, notaOnline;
      function selM(m) { dove.modo = m; bBot.className = "modo-chip" + (m === "bot" ? " attiva" : ""); bOnl.className = "modo-chip" + (m === "online" ? " attiva" : ""); notaOnline.hidden = (m !== "online"); }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { selM("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro i bot" }), el("div", { class: "ms", text: "Da solo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { selM("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Quanti cavalli in gara" }));
      var wR = el("div", { style: "display:flex;gap:8px" });
      [2, 4, 6, 8].forEach(function (n) {
        var b = el("button", { class: "modo-chip" + (n === 4 ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.cavalli = n; [].forEach.call(wR.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: String(n) })]);
        b.style.flex = "1"; wR.appendChild(b);
      });
      box.appendChild(wR);
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:6px", text: "Online: i posti liberi li riempiono i bot fino a questo numero." }));
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
      var wD = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(wD.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; wD.appendChild(b);
      });
      box.appendChild(wD);
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri una stanza e manda il codice: gli altri corrono dal loro telefono. I posti liberi li giocano i bot."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteHorto(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostHorto(t, imp.difficolta || "medio", imp.cavalli || 4);
      return corsa(t, (imp.cavalli || 4) - 1, imp.difficolta || "medio");
    }
  });
})();
