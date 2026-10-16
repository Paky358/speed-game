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
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  // ---------- fantini: gli avatar dei giocatori, i bot con la loro faccia fissa ----------
  // i bot sono quelli del gruppo fisso (SG.bot: sempre gli stessi nomi e avatar in tutti i giochi), scelti per la bravura;
  // i nomi già usati dalle persone in gara si saltano (sennò XP e vittorie andrebbero alla persona sbagliata). Ognuno { nome, omino }
  function prendiBot(usati, quanti, diff) {
    var b = null;
    try { if (window.SG && SG.bot && SG.bot.prendi) b = SG.bot.prendi(quanti, { livello: diff, escludi: usati }); } catch (e) {}
    if (!b || b.length < quanti) { b = []; for (var i = 0; i < quanti; i++) b.push({ nome: "Bot " + (i + 1), omino: null }); }   // (di sicurezza)
    return b;
  }
  function stessoNome(a, b) { return String(a || "").trim().toLowerCase().slice(0, 16) === String(b || "").trim().toLowerCase().slice(0, 16); }
  // i nomi dei cavalli (in targa nel photo finish e sul podio)
  var NOMI_CAVALLI = ["Fulmine", "Tortellino", "Zoccolo d'Oro", "Saetta", "Polpetta", "Uragano", "Biscotto", "Furia", "Cometa",
    "Brontolo", "Mozzarella", "Tornado", "Peperoncino", "Trottolino", "Bufera", "Cannolo", "Freccia Rossa", "Pistacchio",
    "Nuvola", "Ciclone", "Gnocco", "Scheggia", "Ravanello", "Lampo Blu", "Tiramisù", "Vento del Sud", "Babà", "Missile",
    "Crostino", "Pegaso", "Mortadella", "Turbo", "Arancino", "Stella Cadente", "Pandoro", "Razzo", "Ciabatta", "Tempesta",
    "Meringa", "Bolide"];
  function nomiCavalli(n) {
    var a = NOMI_CAVALLI.slice(), out = [];
    for (var i = 0; i < n; i++) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
    return out;
  }
  function mioAvatar(t, nome) {
    if (t && t.mioOmino) { try { var o = t.mioOmino(nome); if (o) return o; } catch (e) {} }
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // le corse già contate nei trofei (ricordate anche se la pagina si ricarica: chi rientra non le conta due volte)
  var GARE_SALVATE = [];
  try { GARE_SALVATE = JSON.parse(localStorage.getItem("sg-horto-gare") || "[]") || []; } catch (e) { GARE_SALVATE = []; }
  function idGara() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  function salvaTrofeiHorto(t, gara, ord, io) {
    if (!gara || !gara.id || !ord || io == null || io < 0 || io >= ord.length || t.guarda || t.prova ||
        (t.linkParams && t.linkParams.prova) || (t.impostazioni && t.impostazioni.prova)) return;
    if (GARE_SALVATE.indexOf(gara.id) >= 0) return;
    GARE_SALVATE.push(gara.id); if (GARE_SALVATE.length > 32) GARE_SALVATE.shift();
    try { localStorage.setItem("sg-horto-gare", JSON.stringify(GARE_SALVATE)); } catch (e) {}
    if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo())) return;
    var posizione = ord.indexOf(io) + 1, vinta = posizione === 1, online = !!gara.online, n = gara.n || ord.length, diff = gara.diff || "medio";
    var vittoriaValida = vinta && (diff !== "facile" || (online && gara.umani > 1));
    var c = { partite: 1, podi: posizione <= 3 && n >= 4 && (diff !== "facile" || (online && gara.umani > 1)) ? 1 : 0,
      vittorie: vittoriaValida ? 1 : 0, vinteOnline: online && gara.umani > 1 && vinta ? 1 : 0,
      vinteMedio: vinta && diff === "medio" ? 1 : 0, vinteDifficile: vinta && diff === "difficile" ? 1 : 0,
      vinte4: vittoriaValida && n >= 4 ? 1 : 0, vinte8NonFacile: vittoriaValida && n >= 8 && diff !== "facile" ? 1 : 0 };
    var incr = []; for (var k in c) if (c[k]) incr.push([k, c[k]]);
    SGNube.salvaProgressi(null, "horto", incr, []);
  }
  function facciaDi(nome, cfg) {
    if (avatarValido(cfg)) return cfg;
    return window.SGOmino ? SGOmino.casuale(nome || "Bot") : null;   // (di sicurezza: i bot arrivano già col loro avatar)
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
      // la folla è uno strato più largo dello schermo, spostato con transform (la telecamera non ridisegna niente)
      ".ho-folla{position:absolute;left:0;top:5px;bottom:6px;width:calc(100% + 44px);will-change:transform}",
      ".ho-folla i{position:absolute;inset:0;background-image:radial-gradient(circle at 6px 7px,#ffd6a8 4px,transparent 5px),",
        "radial-gradient(circle at 17px 5px,#6b4a2f 4px,transparent 5px),radial-gradient(circle at 11px 15px,#f0c090 4px,transparent 5px);background-size:22px 19px;animation:hoTifo .5s steps(2) infinite}",
      "@keyframes hoTifo{50%{transform:translateY(-2px)}}",
      ".ho-mappa{position:absolute;left:54px;top:calc(6px + env(safe-area-inset-top));width:128px;height:54px;border-radius:12px;background:rgba(10,30,20,.55);padding:3px;z-index:3}",
      ".ho-mappa svg{width:100%;height:100%;display:block;overflow:visible}",
      ".ho-hud{position:absolute;right:10px;top:calc(8px + env(safe-area-inset-top));z-index:3;text-align:right;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.45);line-height:1}",
      ".ho-hud b{display:block;font-size:1.9rem;font-weight:900}",
      ".ho-hud span{font-size:.8rem;font-weight:800}",
      ".ho-stacc{position:relative;flex:0 0 auto;height:16px;overflow:hidden;background:#3f8f3a}",
      ".ho-stacc:after{content:'';position:absolute;inset:0;background:linear-gradient(#fff 0 3px,transparent 3px 8px,#fff 8px 11px,transparent 11px)}",
      ".ho-pali{position:absolute;left:0;top:0;bottom:0;width:calc(100% + 88px);background:repeating-linear-gradient(90deg,#fff 0 4px,transparent 4px 44px);will-change:transform}",
      // pista
      ".ho-pista{position:relative;flex:1 1 auto;overflow:hidden;background:linear-gradient(#4aa244,#3c8e37)}",
      ".ho-erba{position:absolute;left:0;top:0;bottom:0;width:calc(100% + 144px);background:repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 36px,rgba(0,0,0,.05) 36px 72px);will-change:transform}",
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
      // righe del vento: un disegno con la sfumatura già dentro (niente maschere mentre la telecamera si muove)
      ".ho-vento{position:absolute;left:-30%;top:22%;width:40%;height:50%;opacity:0;transition:opacity .15s;background-size:100% 100%;",
        "background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' preserveAspectRatio='none'%3E%3ClinearGradient id='v'%3E%3Cstop offset='0' stop-color='%23fff' stop-opacity='0'/%3E%3Cstop offset='1' stop-color='%23fff' stop-opacity='.8'/%3E%3C/linearGradient%3E%3Cg fill='url(%23v)'%3E%3Crect y='3' width='100' height='2'/%3E%3Crect y='12' width='100' height='2'/%3E%3Crect y='21' width='100' height='2'/%3E%3Crect y='30' width='100' height='2'/%3E%3Crect y='38' width='100' height='2'/%3E%3C/g%3E%3C/svg%3E\")}",
      ".ho-cav.boost .ho-vento{opacity:1}",
      // galoppo (solo quando si corre; più veloce con la frusta, lento se sfinito)
      ".za-s,.za-i,.zp-s,.zp-i,.ho-corpo,.ho-coda,.ho-fantino{animation:.42s linear infinite;animation-play-state:paused;transform-box:view-box}",
      ".za-s{animation-name:hoZas}.za-i{animation-name:hoZai}.zp-s{animation-name:hoZps}.zp-i{animation-name:hoZpi}",
      ".ho-corpo{animation-name:hoBob;animation-timing-function:ease-in-out}.ho-fantino{animation-name:hoFbob;animation-timing-function:ease-in-out}",
      ".ho-coda{animation-name:hoCoda;animation-timing-function:ease-in-out;transform-origin:52px 64px}",
      ".ho-corre .za-s,.ho-corre .za-i,.ho-corre .zp-s,.ho-corre .zp-i,.ho-corre .ho-corpo,.ho-corre .ho-coda,.ho-corre .ho-fantino{animation-play-state:running}",
      ".ho-cav.boost .za-s,.ho-cav.boost .za-i,.ho-cav.boost .zp-s,.ho-cav.boost .zp-i,.ho-cav.boost .ho-corpo,.ho-cav.boost .ho-coda,.ho-cav.boost .ho-fantino{animation-duration:.28s}",
      ".ho-cav.sfin .za-s,.ho-cav.sfin .za-i,.ho-cav.sfin .zp-s,.ho-cav.sfin .zp-i,.ho-cav.sfin .ho-corpo,.ho-cav.sfin .ho-coda,.ho-cav.sfin .ho-fantino{animation-duration:.8s}",
      ".ho-cav.sfin .ho-svg{opacity:.6}",
      ".ho-cav.sfin:after{content:'😵';position:absolute;left:78%;top:-6%;font-size:1.3rem;z-index:4}",
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
      ".ho-stam .fill{height:100%;width:100%;border-radius:7px;transform-origin:0 50%;transition:transform .1s linear}",
      ".ho-sotto.guardo .ho-stam{visibility:hidden}",
      ".ho-frusta{width:100%;min-height:72px;border:0;border-radius:18px;cursor:pointer;font-family:inherit;font-weight:900;",
        "font-size:1.5rem;color:#241f00;background:linear-gradient(135deg,#ffe58a,var(--accento) 60%,var(--accento-scuro));",
        "box-shadow:0 8px 22px rgba(224,169,10,.35);-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;}",
      ".ho-frusta:active{transform:scale(.98);}",
      ".ho-frusta:disabled{filter:grayscale(.6);opacity:.7;}",
      ".ho-frusta.sfin{background:linear-gradient(135deg,#ff8787,#c92a2a);color:#fff;}",
      // durante la spinta il tasto si "abbassa": toccare adesso spreca energia (insegna il ritmo)
      ".ho-frusta.spinta{background:linear-gradient(135deg,#d8c56f,#b8900f);box-shadow:0 3px 8px rgba(0,0,0,.25);color:rgba(36,31,0,.75)}",
      ".ho-info .presto{color:#ffa94d}",
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
      ".ho-ff-cav{position:absolute;bottom:2%;left:0;height:94%;aspect-ratio:220/150;transform:translate3d(-200%,0,0);z-index:3;will-change:transform}",
      ".ho-ff-cav .ho-svg{width:100%;height:100%;display:block;overflow:visible}",
      ".ho-ff-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:6;transition:opacity .55s ease-out;}",
      ".ho-ff-flash.on{opacity:.92;transition:opacity .05s;}",
      ".ho-ff-big{text-align:center;font-size:1.5rem;font-weight:900;min-height:1.6em;margin-top:4px;",
        "opacity:0;transform:scale(.8);transition:opacity .3s,transform .3s;}",
      ".ho-ff-big.show{opacity:1;transform:scale(1);color:var(--accento);}",
      ".ho-ff-big small{display:block;font-size:1rem;font-weight:800;color:var(--testo,#fff);opacity:.85}",
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
      ".ho-gradino .cv{font-size:.7rem;font-weight:700;opacity:.75;margin:-3px 0 4px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      // dal 4° in giù: righe basse, su due colonne se sono tante (il tasto Rigioca resta sempre in vista)
      ".ho-resto{display:grid;grid-template-columns:1fr;gap:5px}",
      ".ho-resto.due{grid-template-columns:1fr 1fr}",
      ".ho-riga{display:flex;align-items:center;gap:7px;padding:3px 8px;border-radius:12px;background:rgba(255,255,255,.05);min-width:0}",
      ".ho-riga.mia{background:rgba(255,202,58,.18);border:1px solid var(--accento)}",
      ".ho-riga .pos{font-size:1rem;font-weight:900;width:26px;text-align:center;flex:0 0 auto}",
      ".ho-riga .nm{flex:1;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".ho-riga .fac{width:32px;height:32px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
      ".ho-piede2{display:flex;gap:8px}.ho-piede2>.btn{flex:1}",
      ".ho-riga .fac svg{width:100%;height:100%;display:block}",
      // Gran Premio: la classifica a punti tra le corse (righe basse: 8 cavalli stanno in 360x640 senza scorrere)
      ".ho-gp-lista{display:flex;flex-direction:column;gap:4px}",
      ".ho-gp-testa{display:flex;justify-content:flex-end;gap:10px;font-size:.66rem;font-weight:800;opacity:.65;padding:0 8px}.ho-gp-testa span:first-child{flex:1}",
      ".ho-gp-testa span:nth-child(2){width:62px;text-align:right}.ho-gp-testa span:nth-child(3){width:44px;text-align:right}",
      ".ho-gp-riga{padding:2px 8px}.ho-gp-riga .fac{width:28px;height:28px}",
      ".ho-gp-piu{width:62px;text-align:right;font-weight:900;color:#69db7c;flex:0 0 auto}",
      ".ho-gp-tot{width:44px;text-align:right;font-weight:900;font-size:1.05rem;flex:0 0 auto}",
      ".ho-resto .ho-gp-piu{display:none}.ho-resto .ho-gp-tot{width:auto}",
      ".ho-gp-podio .ho-gradino .cv{opacity:1;font-weight:900;font-size:.8rem;color:var(--accento,#ffd43b)}",
      ".ho-gp-conto{text-align:center;margin:0}",
      ".ho-gp-quanti{font-weight:800;opacity:.85}",
      // al via di ogni corsa del Gran Premio: "Corsa 2 di 3" / "🔥 Ultima corsa: punti doppi!"
      ".ho-gp-via{position:absolute;left:50%;top:14%;z-index:11;pointer-events:none;white-space:nowrap;transform:translate(-50%,0);background:rgba(10,20,50,.82);color:#fff;",
        "font-weight:900;font-size:1.15rem;border-radius:16px;padding:6px 16px;border:2px solid #ffd43b;box-shadow:0 6px 18px rgba(0,0,0,.4);animation:hoGpVia .45s cubic-bezier(.3,1.5,.5,1);transition:opacity .4s}",
      ".ho-gp-via.doppi{background:linear-gradient(135deg,#c92a2a,#e8590c);border-color:#ffe066;font-size:1.25rem}",
      ".ho-gp-via.via{opacity:0}",
      "@keyframes hoGpVia{from{transform:translate(-50%,0) scale(.4);opacity:0}}",
      "@media (prefers-reduced-motion:reduce){.ho-folla,.ho-nuv,.ho-polv b{animation:none}}"
    ].join("");
    document.head.appendChild(s);
  }

  function frustaFX() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}   // parte dal tocco: qui la vibrazione va bene
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = "square"; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.07); } catch (e) {} }
  // (i suoni qui sotto partono da soli: niente vibrazione)
  function traguardoFX() {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { [523, 659, 784, 1046].forEach(function (f, i) { var t = c.currentTime + i * 0.1, o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.2); }); } catch (e) {} }
  function bip(f, dur, vol, tipo) {   // i bip del 3-2-1-VIA e la campanella
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = tipo || "sine"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02); } catch (e) {} }
  function campanaFX() { bip(1320, 0.35, 0.16, "triangle"); setTimeout(function () { bip(1320, 0.45, 0.16, "triangle"); }, 220); }
  function follaFX() {   // il boato della folla che si alza nel finale (un soffio filtrato)
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try {
      var dur = 2.6, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      var src = c.createBufferSource(); src.buffer = b;
      var fl = c.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = 900; fl.Q.value = 0.7;
      var g = c.createGain(), t = c.currentTime;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(fl); fl.connect(g); g.connect(c.destination); src.start(t); src.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function scattoFoto() {   // "clack" dell'otturatore (due click ravvicinati)
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
  function nuovoCav(umano, id) { return { pos: 0, stam: STAM_MAX, boostU: 0, sfin: false, sfinU: 0, umano: !!umano, id: id || null, nextClick: 0, arr: false, ai: null, prev: 0, v: 0, fr: 0, sorte: 0 }; }
  function frusta(h, now) { if (h.sfin || h.arr) return false; h.stam -= COST; h.boostU = now + BOOST_MS; if (h.stam <= 0) { h.stam = 0; h.sfin = true; h.sfinU = now + SFIN_MS; h.boostU = 0; } return true; }
  // I bot: a ogni corsa ognuno ha un carattere. "razzo" parte forte (da Facile a volte si sfinisce),
  // "rimonta" tiene l'energia per il finale, "regolare" va del suo passo. La bravura decide quanta energia
  // lasciano inutilizzata, quanto spesso frustano a vuoto (durante la spinta), lo scatto finale e la forma del cavallo.
  var BRAVURA = {
    // (tarati con corse simulate contro 3 bot: chi tocca una volta al secondo batte i Facili circa 1 volta su 2 e mai i Medi;
    //  chi tocca ogni 0,7 s usando quasi tutta l'energia batte sempre i Medi e 3 volte su 4 i Difficili;
    //  se si tiene da parte troppa energia (sopra il 30%) i Medi vincono quasi sempre. A raffica non si vince mai)
    facile:    { S: [45, 65], I: [700, 1100], err: 0.35, sprint: 0.15, forma: [0.91, 0.95] },
    medio:     { S: [20, 30], I: [380, 520], err: 0.1, sprint: 0.6, forma: [0.945, 0.97] },
    difficile: { S: [14, 18], I: [270, 340], err: 0.03, sprint: 0.9, forma: [0.975, 0.995] }
  };
  function tra(a) { return a[0] + Math.random() * (a[1] - a[0]); }
  function nuovoBot(diff) {
    var b = BRAVURA[diff] || BRAVURA.medio, r = Math.random();
    return { stile: r < 0.3 ? "razzo" : r < 0.6 ? "rimonta" : "regolare", S: tra(b.S), I: tra(b.I), err: b.err, esagera: diff === "facile" && Math.random() < 0.5,
      sprintDa: Math.random() < b.sprint ? 0.7 + Math.random() * 0.16 : 2, forma: tra(b.forma) };
  }
  function botCav(diff) { var h = nuovoCav(false); h.ai = nuovoBot(diff); return h; }
  function botPensa(h, now) {
    var a = h.ai; if (!a || h.sfin || h.arr || now < h.nextClick) return;
    var soglia = a.S, razzo = a.stile === "razzo" && h.pos < (a.esagera ? 0.6 : 0.35) && h.pos < a.sprintDa;
    if (h.pos >= a.sprintDa) soglia = COST + 1;                                         // scatto finale: quasi tutta l'energia
    else if (razzo) soglia = a.esagera ? -10 : COST + 3;                                // parte a razzo (il Facile a volte esagera e si sfinisce)
    else if (a.stile === "rimonta" && h.pos < 0.55) soglia = Math.min(85, a.S * 1.9);   // tiene da parte per il finale
    if (h.stam <= soglia + Math.random() * 6) { h.nextClick = now + 60; return; }
    if (now < h.boostU && Math.random() >= a.err) { h.nextClick = h.boostU; return; }   // i bravi aspettano la fine della spinta
    frusta(h, now); h.nextClick = now + a.I * (razzo ? 0.45 : 1) * (0.8 + Math.random() * 0.4);
  }
  // un passo di simulazione. Chi taglia il traguardo nello stesso passo: conta di quanto l'ha superato
  // (i pari veri, a sorte). Ritorna la "foto": dove sono tutti nell'istante esatto in cui il primo tocca la linea.
  function passoTutti(cav, now, dt, arrivi) {
    var nuovi = [], k, h;
    for (k = 0; k < cav.length; k++) {
      h = cav[k]; h.prev = h.pos; h.v = 0; if (h.arr) continue;
      if (!h.umano) botPensa(h, now);
      if (h.sfin && now >= h.sfinU) h.sfin = false;
      var v = (h.sfin ? V_SFIN : (now < h.boostU ? V_BOOST : V_BASE)) * (!h.umano && h.ai ? h.ai.forma : 1);
      h.v = v; h.pos += v * dt;
      if (h.sfin) h.stam = Math.min(STAM_MAX, h.stam + REGEN_SFIN * dt);
      else if (now >= h.boostU) h.stam = Math.min(STAM_MAX, h.stam + REGEN * dt);
      if (h.pos >= 1) { h.fr = (1 - h.prev) / Math.max(1e-9, v * dt); h.sorte = Math.random(); h.pos = 1; h.arr = true; nuovi.push(k); }
    }
    if (!nuovi.length) return null;
    nuovi.sort(function (a, b) { return (cav[a].fr - cav[b].fr) || (cav[a].sorte - cav[b].sorte); });
    var foto = null;
    if (!arrivi.length) {
      var fw = cav[nuovi[0]].fr;
      foto = cav.map(function (x, i) { return i === nuovi[0] ? 1 : Math.min(0.99999, x.prev + x.v * dt * fw); });
    }
    for (k = 0; k < nuovi.length; k++) arrivi.push(nuovi[k]);
    return foto;
  }
  // simula da t0 a t1 (ms) a passi piccoli: la corsa è la stessa su un telefono veloce o lento,
  // e se l'app dell'host torna dal sottofondo recupera il tempo passato (al massimo qualche secondo)
  var PASSO = 1000 / 60;
  function avanza(cav, t0, t1, arrivi) {
    var n = Math.max(1, Math.ceil((t1 - t0) / PASSO - 1e-6)), st = (t1 - t0) / n, foto = null;
    for (var i = 1; i <= n; i++) {
      var f = passoTutti(cav, t0 + st * i, st / 1000, arrivi); if (f) foto = f;
      if (arrivi.length === cav.length) break;
    }
    return foto;
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
  // io = la mia corsia (-1 = guardo soltanto: entro alla prossima corsa)
  function costruisci(t, N, nomi, io, cb, av) {
    assicuraStile(); var el = t.el;
    ultimiAv = av || avatariPer(nomi);
    var s = t.schermata({});
    s.classList.add("ho-piena");
    var scena = el("div", { class: "ho-scena" });
    scena.appendChild(el("button", { class: "ho-esci", text: "‹", "aria-label": "Esci dalla corsa", onclick: function () {
      // la finestra al centro dell'app (window.confirm solo se manca)
      var dom = cb.conferma || "Uscire dalla corsa?";
      if (t.conferma) t.conferma(dom, null, "Esci", function () { cb.onEsci(); }); else if (window.confirm(dom)) cb.onEsci();
    } }));
    // cielo con tribuna, minimappa e posizione
    var folla = el("div", { class: "ho-folla" }, [el("i")]);
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
    var ordineDisegno = []; for (var k = 0; k < N; k++) if (k !== io) ordineDisegno.push(k); if (io >= 0 && io < N) ordineDisegno.push(io);   // il mio pallino sopra
    ordineDisegno.forEach(function (k) {
      svgM += "<circle data-k='" + k + "' cx='" + m.x0 + "' cy='" + m.yA + "' r='" + (k === io ? 4.6 : 3.4) + "' fill='" + COLORI[k % COLORI.length] + "' stroke='" + (k === io ? "#fff" : "rgba(0,0,0,.5)") + "' stroke-width='" + (k === io ? 1.6 : 1) + "'/>";
    });
    var mappa = el("div", { class: "ho-mappa", html: svgM + "</svg>" });
    var hudB = el("b", { text: "–" }), hudS = el("span", { text: cifre(METRI) + " m" });
    cielo.appendChild(mappa); cielo.appendChild(el("div", { class: "ho-hud" }, [hudB, hudS]));
    scena.appendChild(cielo);
    var pali = el("div", { class: "ho-pali" });
    scena.appendChild(el("div", { class: "ho-stacc" }, [pali]));
    // pista: prato a strisce, corsie, "mondo" che scorre (cancelletti, cartelli dei metri, arrivo) e cavalli
    var pista = el("div", { class: "ho-pista" });
    var erba = el("div", { class: "ho-erba" }); pista.appendChild(erba);
    for (k = 0; k < N; k++) pista.appendChild(el("div", { class: "ho-corsia" + (k === io ? " mia" : ""), style: "top:" + (k * 100 / N) + "%;height:" + (100 / N) + "%" }));
    var mondo = el("div", { class: "ho-mondo" });
    var cancelli = el("div", { class: "ho-cancelli" });
    for (k = 0; k < N; k++) cancelli.appendChild(el("div", { class: "ho-porta" }));
    mondo.appendChild(cancelli);
    var cartelli = [];
    for (var q = 1; q < 5; q++) { var ct = el("div", { class: "ho-cartello" }, [el("b", { text: cifre(METRI - METRI * q / 5) + " m" })]); cartelli.push(ct); mondo.appendChild(ct); }
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
    var gpEl = null;   // Gran Premio: al via la scritta "Corsa 2 di 3" (all'ultima: punti doppi)
    if (cb.gp) { gpEl = el("div", { class: "ho-gp-via" + (cb.gp.doppi ? " doppi" : ""), text: cb.gp.doppi ? "🔥 Ultima corsa: punti doppi!" : "🏆 Gran Premio · corsa " + cb.gp.corsa + " di " + cb.gp.di }); pista.appendChild(gpEl); }
    scena.appendChild(pista);
    // comandi
    var info = el("span", { text: "Pronti…" });
    var fillEl = el("div", { class: "fill", style: "background:#51cf66" });
    var bFr = el("button", { class: "ho-frusta", text: "🚦 Pronti…", disabled: "disabled" });
    bFr.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onFrusta(); });
    scena.appendChild(el("div", { class: "ho-sotto" + (io < 0 ? " guardo" : "") }, [ el("div", { class: "ho-info" }, [info]), el("div", { class: "ho-stam" }, [fillEl]), bFr ]));
    s._contenuto.appendChild(scena);
    function suTasto(e) { if (e.code === "Space" || e.key === " ") { e.preventDefault(); cb.onFrusta(); } }
    document.addEventListener("keydown", suTasto);
    t.mostra(s);
    var dots = [].slice.call(mappa.querySelectorAll("circle")).sort(function (a, b) { return a.getAttribute("data-k") - b.getAttribute("data-k"); });
    return { scena: scena, pista: pista, mondo: mondo, cancelli: cancelli, cartelli: cartelli, arrivo: arrivo, erba: erba, pali: pali, folla: folla,
      cavEl: cavEl, fillEl: fillEl, frusta: bFr, info: info, conto: conto, hudB: hudB, hudS: hudS, dots: dots, io: io, N: N, cavallo: cb.cavallo || "", gpEl: gpEl,
      cam: null, W: 0, hw: 0, nMis: 0, tU: 0, arrT: [], prestoU: 0,
      rimuovi: function () { document.removeEventListener("keydown", suTasto); } };
  }
  // "troppo presto": si è frustato mentre la spinta di prima durava ancora (energia sprecata)
  function segnalaPresto(ref) { if (ref) ref.prestoU = performance.now() + 900; }
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
  function scrivi(e, txt) { if (e._t !== txt) { e._t = txt; e.textContent = txt; } }   // tocca la pagina solo se il testo cambia
  function giroDi(x, m) { return ((x % m) + m) % m; }
  function disegna(ref, sn) {
    var now = performance.now(), dt = ref.tU ? Math.min(0.1, (now - ref.tU) / 1000) : 0; ref.tU = now;
    if (!ref.W || ++ref.nMis > 45) { misura(ref); ref.nMis = 0; }
    var W = ref.W, L = W * LUNGH, hw = ref.hw, k, N = Math.min(sn.N, sn.cav.length);
    var capo = 0; for (k = 1; k < N; k++) if (sn.cav[k].p > sn.cav[capo].p) capo = k;
    var guardo = !(ref.io >= 0 && sn.cav[ref.io]), me = guardo ? sn.cav[capo] : sn.cav[ref.io], mx = sn.cav[capo].p;
    // TELECAMERA: segue chi è in testa, ma il mio cavallo resta sempre dentro l'inquadratura;
    // alla fine si ferma col traguardo a 3/4 dello schermo
    var target = Math.min(mx * L - 0.72 * W, me.p * L - hw * 1.1);
    target = Math.max(-0.72 * W, Math.min(target, L - 0.78 * W));
    ref.cam = (ref.cam == null || !dt) ? target : ref.cam + (target - ref.cam) * Math.min(1, dt * 5);
    var cam = ref.cam;
    // tutto si sposta con transform: prato, staccionata e folla sono strati più larghi che "girano"
    ref.mondo.style.transform = "translate3d(" + (-cam).toFixed(1) + "px,0,0)";
    ref.erba.style.transform = "translate3d(" + (-giroDi(cam, 72)).toFixed(1) + "px,0,0)";
    ref.pali.style.transform = "translate3d(" + (-giroDi(cam, 44)).toFixed(1) + "px,0,0)";
    ref.folla.style.transform = "translate3d(" + (-giroDi(cam * 0.3, 22)).toFixed(1) + "px,0,0)";
    var corre = sn.fase === "corsa";
    if (ref.corre !== corre) { ref.corre = corre; ref.scena.classList.toggle("ho-corre", corre); }
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
    // suoni: bip del 3-2-1-VIA, campanella agli ultimi 200 m, folla nel finale
    if (sn.fase === "via" && sn.conto !== ref.ultConto) { ref.ultConto = sn.conto; if (sn.conto > 0) bip(660, 0.18, 0.18); else bip(990, 0.45, 0.22); }
    if (corre && !ref.campana && mx >= 0.8) { ref.campana = true; campanaFX(); }
    if (corre && !ref.boato && mx >= 0.86) { ref.boato = true; follaFX(); }
    // posizione e metri che mancano
    var davanti = 0; for (k = 0; k < N; k++) if (k !== ref.io && sn.cav[k].p > me.p) davanti++;
    scrivi(ref.hudB, guardo ? "👀" : (davanti + 1) + "°");
    scrivi(ref.hudS, me.a ? "🏁 arrivato" : "mancano " + cifre(Math.max(0, Math.round((1 - me.p) * METRI))) + " m");
    var b = ref.frusta, stato, testo, info, presto = false;
    if (!guardo) {
      ref.fillEl.style.transform = "scaleX(" + (Math.max(0, Math.min(100, me.s)) / 100).toFixed(3) + ")";
      var col = me.f ? "#ff6b6b" : (me.s > 40 ? "#51cf66" : me.s > 18 ? "#ffd43b" : "#ff922b");
      if (ref.colFill !== col) { ref.colFill = col; ref.fillEl.style.background = col; }
    }
    if (sn.fase === "via") {
      stato = "via"; testo = "🚦 Pronti…";
      if (sn.conto !== ref.contoScritto) { ref.contoScritto = sn.conto; ref.conto.className = "ho-conto" + (sn.conto > 0 ? "" : " via"); ref.conto.textContent = sn.conto > 0 ? String(sn.conto) : "VIA!"; }
      info = guardo ? "👀 Guardi la corsa: entri alla prossima!" : (ref.cavallo ? "🐴 " + ref.cavallo + " · tocca a ritmo!" : "Tocca a ritmo, non a raffica!");
      if (sn.conto <= 0) ref.cancelli.classList.add("aperti");
    } else if (corre) {
      ref.cancelli.classList.add("aperti");
      if (ref.gpEl && !ref.gpVia) { ref.gpVia = true; ref.gpEl.classList.add("via"); }   // (la scritta del Gran Premio sparisce al via)
      if (!ref.viaFatto) { ref.viaFatto = true; ref.conto.className = "ho-conto via"; ref.conto.textContent = "VIA!"; setTimeout(function () { ref.conto.className = "ho-conto via sparisci"; }, 350); }
      presto = !guardo && now < ref.prestoU && !me.a && !me.f;
      if (guardo) { stato = "guardo"; testo = "👀 Entri alla prossima corsa"; info = "👀 Guardi la corsa"; }
      else if (me.a) { stato = "arr"; testo = "🏁 Arrivato!"; info = "🏁 Traguardo!"; }
      else if (me.f) { stato = "sfin"; testo = "😵 SFINITO!"; info = "😵 Sfinito: aspetta che si riprenda"; }
      else {
        stato = me.b ? "spinta" : "frusta"; testo = me.b ? "💨 spinta…" : "🏇 FRUSTA!";
        info = presto ? "⚠️ Troppo presto: aspetta la fine della spinta" : (me.s <= COST ? "⚡ Ancora una frustata e sei sfinito!" : (davanti === 0 ? "🥇 Sei in testa!" : "Dai, frusta! 🏇"));
      }
    }
    if (stato && ref.stTasto !== stato) {
      ref.stTasto = stato;
      b.disabled = !(stato === "frusta" || stato === "spinta");
      b.className = "ho-frusta" + (stato === "sfin" ? " sfin" : stato === "spinta" ? " spinta" : "");
      b.textContent = testo;
    }
    if (info) { scrivi(ref.info, info); if (ref.presto !== presto) { ref.presto = presto; ref.info.className = presto ? "presto" : ""; } }
  }

  function classificaDa(cav, arrivi) {
    var resto = []; for (var k = 0; k < cav.length; k++) if (arrivi.indexOf(k) < 0) resto.push(k);
    resto.sort(function (a, b) { return cav[b].pos - cav[a].pos; });
    return arrivi.concat(resto);
  }
  // di quanto ha vinto: la distanza vera del secondo nell'istante in cui il primo tocca la linea
  // (un cavallo è lungo circa 10 m nel disegno)
  function distaccoTesto(foto, ord) {
    if (!foto || ord.length < 2 || foto[ord[1]] == null) return "";
    var m = (1 - Math.min(1, foto[ord[1]])) * METRI;
    if (m < 1) return "per un muso!";
    if (m < 5) return "per mezza lunghezza";
    if (m < 13) return "per una lunghezza";
    if (m < 45) return "per " + Math.max(2, Math.round(m / 10)) + " lunghezze";
    return "in solitaria!";
  }
  // "filmatino" zoomato del traguardo: i cavalli arrivano alla linea alle distanze VERE dell'istante
  // in cui il primo la tocca (foto); scatto, fermo immagine, poi tutti tagliano nell'ordine della classifica.
  // Si muove solo con transform. Ritorna { annulla } (serve se intanto parte un'altra corsa).
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
      // il vincitore sulla linea (86%); gli altri al distacco vero (1 m = 3,4% della striscia),
      // con un minimo di 1,2% così si vede sempre chi ha toccato per primo
      targetX[k] = vinc ? 86 : Math.max(4, 86 - Math.max(1.2, (1 - Math.min(1, foto[k])) * METRI * 3.4));
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
    // niente tasto per saltarlo: il photo finish si guarda sempre tutto, poi la classifica arriva da sola
    t.mostra(s);
    var W = strip.clientWidth || 340, cw = (cavs[0] && cavs[0].offsetWidth) || rowH * 0.94 * 220 / 150;
    function posa(c, perc) { c.style.transform = "translate3d(" + (perc * W / 100 - cw / 2).toFixed(1) + "px,0,0)"; }
    cavs.forEach(function (c) { c.style.transition = "none"; posa(c, -15); });
    void strip.offsetWidth;
    var winCav = cavs[vincitore];
    // Tutti partono affiancati e arrivano insieme alla loro posizione: in una gara tirata restano
    // testa a testa e il musetto del vincitore emerge solo sulla linea. Lento, con l'ultimo tratto che rallenta.
    tos.push(setTimeout(function () {
      for (var k = 0; k < N; k++) { cavs[k].style.transition = "transform 4s cubic-bezier(.2,.62,.3,1)"; posa(cavs[k], targetX[k]); }
      controlla();
    }, 90));
    // sicurezza: se il disegno non gira (schermo nascosto), scatta quando il vincitore è arrivato alla linea
    tos.push(setTimeout(function () { if (!scattato) congela(); }, 4300));

    function controlla() {                 // rileva il tocco VERO: il muso del cavallo oltre la linea
      if (scattato || fatto) return;
      var lr = lineEl.getBoundingClientRect(), hr = winCav.getBoundingClientRect();
      if (hr.width && hr.right - hr.width * 0.05 >= lr.left + 1) { congela(); return; }
      rafId = requestAnimationFrame(controlla);
    }
    function xAdesso(c) {                   // dove si trova adesso il cavallo (anche a metà della transizione)
      var m = getComputedStyle(c).transform, v = /matrix(3d)?\(([^)]+)\)/.exec(m || "");
      if (!v) return 0;
      var n = v[2].split(","); return parseFloat(n[v[1] ? 12 : 4]) || 0;
    }
    function congela() {                    // FERMA l'immagine dove sono (zampe comprese), poi la foto
      if (scattato || fatto) return; scattato = true;
      if (rafId) cancelAnimationFrame(rafId);
      cavs.forEach(function (c) { var x = xAdesso(c); c.style.transition = "none"; c.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)"; });
      strip.classList.remove("ho-corre");
      void strip.offsetWidth;
      scattoFoto(); flash.classList.add("on"); big.textContent = "📸"; big.classList.add("show");
      tos.push(setTimeout(function () { flash.classList.remove("on"); }, 70));
      tos.push(setTimeout(riprendi, 1500)); // fermo immagine ~1,5s
      tos.push(setTimeout(vai, 7000));      // dallo scatto: max 7s di replay lento, poi la classifica
    }
    function riprendi() {                   // finisce il replay: TUTTI tagliano il traguardo, nell'ordine della classifica
      var FINISH = 88, sr = strip.getBoundingClientRect(), prima = 0;
      strip.classList.add("ho-corre");
      ord.forEach(function (k, r) {
        var c = cavs[k]; if (!c) return;
        var hr = c.getBoundingClientRect();
        var cur = sr.width ? ((hr.left + hr.width / 2) - sr.left) / sr.width * 100 : 80;
        var dur = Math.min(4.8, Math.max(0.6, (FINISH - cur) * 0.09));
        if (r > 0) dur = Math.max(dur, prima + 0.22);   // chi è dietro in classifica taglia dopo
        prima = dur;
        c.style.transition = "transform " + dur.toFixed(2) + "s linear";
        posa(c, FINISH);
      });
      tos.push(setTimeout(function () {
        var d = distaccoTesto(foto, ord);
        big.textContent = "🏆 " + nomi[vincitore] + (vincitore === io ? " (tu)" : "") + " vince!";
        if (d) big.appendChild(el("small", { text: d }));
        traguardoFX();
      }, 900));
    }
    return { annulla: function () { fatto = true; if (rafId) cancelAnimationFrame(rafId); tos.forEach(clearTimeout); } };
  }
  function finale(t, ord, nomi, io, foto, cn, cb) {
    if (!foto || !foto.length) { foto = []; for (var k = 0; k < nomi.length; k++) foto[k] = (ord.indexOf(k) === 0 ? 1 : 0.99); }
    return fotoFinish(t, ord, nomi, io, foto, function () { if (cb.dopoFoto) cb.dopoFoto(); else renderFine(t, ord, nomi, io, cn, cb); });   // (Gran Premio: la classifica a punti)
  }

  // ========================================================
  //  GRAN PREMIO: 3 corse di fila, punti per il posto (10, 6, 4, 3, 2, 1), l'ultima vale doppio.
  //  Tra una corsa e l'altra la classifica a punti: si va avanti col conto alla rovescia,
  //  o subito se «⏩ Avanti» lo tocca più di metà di chi corre. Vince chi ha più punti alla fine.
  // ========================================================
  var GP_CORSE = 3, GP_PUNTI = [10, 6, 4, 3, 2, 1], GP_ATTESA = 12;
  var FOTO_MS = 11500;   // quanto dura al massimo il photo finish (fotoFinish: 0,1 s + al più 4,3 s alla linea + 7 s)
  function gpNuovo() { return { corsa: 0, di: GP_CORSE, tot: {}, nomi: {}, ult: {}, posUlt: {}, bot: {}, finito: false, bots: {}, cn: null }; }
  function gpDoppi(G) { return G.corsa >= G.di; }   // l'ultima corsa: punti doppi
  // i punti della corsa appena finita. chiavi[s] = chi c'era sulla corsia s (l'id di chi gioca, o "bot:" + nome)
  function gpSegna(G, ord, chiavi, nomi, bot) {
    var x2 = gpDoppi(G) ? 2 : 1; G.ult = {}; G.posUlt = {};
    ord.forEach(function (s, p) {
      var k = chiavi[s]; if (!k) return;
      var pt = (GP_PUNTI[p] || 0) * x2;
      G.tot[k] = (G.tot[k] || 0) + pt; G.ult[k] = pt; G.posUlt[k] = p + 1; G.nomi[k] = nomi[s]; G.bot[k] = !!(bot && bot[s]);
    });
    if (G.corsa >= G.di) G.finito = true;
  }
  // la classifica: più punti davanti; a parità decide l'ultima corsa (chi non l'ha corsa sta dietro)
  function gpClassifica(G) {
    var r = Object.keys(G.tot).map(function (k) { return { k: k, nome: G.nomi[k], tot: G.tot[k], ult: G.ult[k] || 0, posUlt: G.posUlt[k] || 99, bot: !!G.bot[k] }; });
    r.sort(function (a, b) { return (b.tot - a.tot) || (a.posUlt - b.posUlt); });
    r.forEach(function (x, i) { x.pos = i + 1; });
    return r;
  }
  // la foto della classifica per tutti i telefoni (s = la corsia nell'ultima corsa: serve per l'avatar)
  function gpVista(G, chiavi) {
    return { corsa: G.corsa, di: G.di, finito: G.finito, righe: gpClassifica(G).map(function (r) { r.s = chiavi.indexOf(r.k); return r; }) };
  }
  // la scritta grande al via: "Corsa 2 di 3" / "🔥 Ultima corsa: punti doppi!"
  function gpVia(G) { return G ? { corsa: G.corsa, di: G.di, doppi: gpDoppi(G) } : null; }

  // la classifica del Gran Premio (tra le corse e alla fine). o = { mia: chiave mia, av: avatar per corsia, nomiCav,
  //  sonoHost, locale, online, chiaveConto, secondi, onAvanti (il mio «⏩ Avanti»), onConto (host/locale: a zero si parte),
  //  onRigioca, onSaletta, onEsci }. Ritorna { avanti(lista, servono) } per aggiornare solo il contatore (niente lampeggio)
  function renderGP(t, gp, o) {
    assicuraStile();
    var el = t.el, righe = gp.righe || [], mio = null;
    righe.forEach(function (r) { if (r.k === o.mia) mio = r; });
    var titolo = gp.finito ? (mio ? (mio.pos === 1 ? "Hai vinto il Gran Premio!" : "Gran Premio: " + mio.pos + "°") : "Gran Premio finito!")
      : "Gran Premio · corsa " + gp.corsa + " di " + gp.di;
    var sotto = gp.finito ? "Horto Muso · classifica a punti" : (gp.corsa + 1 >= gp.di ? "🔥 La prossima è l'ultima: punti doppi!" : "Prossima: corsa " + (gp.corsa + 1) + " di " + gp.di);
    var s = t.schermata({ icona: gp.finito ? "🏆" : "🏁", titolo: titolo, sotto: sotto });
    s.classList.add("ho-gp-s");
    function faccia(r) { var cfg = (o.av && r.s >= 0 && o.av[r.s]) || facciaDi(r.nome); return busto(cfg); }
    function riga(r) {
      return el("div", { class: "ho-riga ho-gp-riga" + (r.k === o.mia ? " mia" : "") }, [
        el("span", { class: "pos", text: r.pos <= 3 && gp.finito ? ["🥇", "🥈", "🥉"][r.pos - 1] : r.pos + "°" }),
        el("span", { class: "fac", html: faccia(r) }),
        el("span", { class: "nm", text: r.nome + (r.k === o.mia ? " (tu)" : "") }),
        el("span", { class: "ho-gp-piu", text: r.ult ? "+" + r.ult : "" }),
        el("span", { class: "ho-gp-tot", text: cifre(r.tot) }) ]);
    }
    if (gp.finito) {   // il podio coi primi tre, poi gli altri
      var podio = el("div", { class: "ho-podio ho-gp-podio" });
      [1, 0, 2].forEach(function (p) {
        var r = righe[p]; if (!r) return;
        podio.appendChild(el("div", { class: "ho-gradino p" + (p + 1) }, [
          el("div", { class: "fac", html: faccia(r) }),
          el("div", { class: "nm", text: r.nome + (r.k === o.mia ? " (tu)" : "") }),
          el("div", { class: "cv", text: cifre(r.tot) + " punti" }),
          el("div", { class: "blocco", text: ["🥇", "🥈", "🥉"][p] }) ]));
      });
      s._contenuto.appendChild(podio);
      var resto = righe.slice(3);
      if (resto.length) { var box = el("div", { class: "ho-resto" + (resto.length > 2 ? " due" : "") }); resto.forEach(function (r) { box.appendChild(riga(r)); }); s._contenuto.appendChild(box); }
    } else {
      var lista = el("div", { class: "ho-gp-lista" });
      lista.appendChild(el("div", { class: "ho-gp-testa" }, [ el("span", { text: "" }), el("span", { text: "questa corsa" }), el("span", { text: "totale" }) ]));
      righe.forEach(function (r) { lista.appendChild(riga(r)); });
      s._contenuto.appendChild(lista);
    }
    var R = { s: s, bAv: null, quanti: null };
    if (gp.finito) {
      if (!o.locale) { var fac = t.faccine && t.faccine(); if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); } }
      if (!o.locale && t.tastiFine && t.tastiFine(s._piede, { host: !!o.sonoHost, nuova: o.sonoHost ? o.onRigioca : null, esci: o.onEsci })) { /* i tasti del core */ }
      else if (o.sonoHost || o.locale) {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏆 Un altro Gran Premio", onclick: o.onRigioca }));
        s._piede.appendChild(el("div", { class: "ho-piede2" }, [
          o.onSaletta ? el("button", { class: "btn btn-fantasma", text: "🛋️ Saletta", onclick: o.onSaletta }) : null,
          el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: o.onEsci }) ]));
      } else {
        s._piede.appendChild(el("p", { class: "modulo-nota", text: "Aspetta l'host: un altro Gran Premio o di nuovo in saletta…" }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: o.onEsci }));
      }
      t.mostra(s);
      return R;
    }
    // tra le corse: "Si va avanti tra 12…" per tutti (il tempo lo tiene l'host) e «⏩ Avanti» a chi corre
    var conto = el("p", { class: "modulo-nota ho-gp-conto" });
    s._piede.appendChild(conto);
    if (o.onAvanti) {
      R.bAv = el("button", { class: "btn btn-primario", onclick: function () {
        if (R.bAv.disabled) return; R.mio = true; aggiornaAv(); o.onAvanti();
      } }, [ el("span", { class: "tx", text: "⏩ Avanti" }), el("span", { class: "ho-gp-quanti" }) ]);
      s._piede.appendChild(R.bAv);
    }
    s._piede.appendChild(el("div", { class: "ho-piede2" }, [
      o.onSaletta ? el("button", { class: "btn btn-fantasma", text: "🛋️ Saletta", onclick: o.onSaletta }) : null,
      el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: o.onEsci }) ]));
    t.mostra(s);
    // il conto alla rovescia: l'host (o chi gioca contro i Bot) lo fa partire subito; chi entra quando arriva il tempo dall'host
    R.avviaConto = function (sec) { if (R.contoFatto) return; R.contoFatto = true; t.contoAvanti(conto, Math.max(1, sec), o.onConto || null, o.chiaveConto); };
    if (o.secondi) R.avviaConto(o.secondi);
    var lista2 = [], servono = 1;
    function aggiornaAv() {
      if (!R.bAv) return;
      var io = R.mio || lista2.indexOf(o.mioId) >= 0, n = lista2.length + (R.mio && lista2.indexOf(o.mioId) < 0 ? 1 : 0);
      var q = R.bAv.querySelector(".ho-gp-quanti"), tx = servono > 1 ? " · " + n + " su " + servono : "";
      if (q.textContent !== tx) q.textContent = tx;
      var t0 = io ? "✅ Avanti" : "⏩ Avanti", sp = R.bAv.querySelector(".tx");
      if (sp.textContent !== t0) sp.textContent = t0;
      R.bAv.disabled = io;
    }
    R.avanti = function (l, sv) { lista2 = l || []; servono = sv || 1; aggiornaAv(); };
    aggiornaAv();
    return R;
  }

  // classifica finale: podio con gli avatar dei primi tre, poi gli altri in righe basse (su due colonne se sono tanti)
  function renderFine(t, ord, nomi, io, cn, cb) {
    assicuraStile();
    var el = t.el, guardo = io == null || io < 0, mioPosto = guardo ? 0 : ord.indexOf(io) + 1, vinto = mioPosto === 1;
    var s = t.schermata({ icona: guardo ? "🏁" : vinto ? "🏆" : "🏁", titolo: guardo ? "Classifica della corsa" : vinto ? "Hai vinto!" : "Arrivato " + mioPosto + "°", sotto: "Horto Muso" });
    function faccia(idx) { return busto(ultimiAv[idx] || facciaDi(nomi[idx])); }
    var podio = el("div", { class: "ho-podio" });
    [1, 0, 2].forEach(function (p) {
      var idx = ord[p]; if (idx == null) return;
      podio.appendChild(el("div", { class: "ho-gradino p" + (p + 1) }, [
        el("div", { class: "fac", html: faccia(idx) }),
        el("div", { class: "nm", text: nomi[idx] + (idx === io ? " (tu)" : "") }),
        cn && cn[idx] ? el("div", { class: "cv", text: "🐴 " + cn[idx] }) : null,
        el("div", { class: "blocco", text: ["🥇", "🥈", "🥉"][p] })
      ]));
    });
    s._contenuto.appendChild(podio);
    var resto = ord.slice(3);
    if (resto.length) {
      var box = el("div", { class: "ho-resto" + (resto.length > 2 ? " due" : "") });
      resto.forEach(function (idx, p) {
        box.appendChild(el("div", { class: "ho-riga" + (idx === io ? " mia" : "") }, [
          el("span", { class: "pos", text: (p + 4) + "°" }),
          el("span", { class: "fac", html: faccia(idx) }),
          el("span", { class: "nm", text: nomi[idx] + (idx === io ? " (tu)" : "") })
        ]));
      });
      s._contenuto.appendChild(box);
    }
    if (!cb.locale) { var fac = t.faccine && t.faccine(); if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); } }   // online: le faccine anche sulla classifica
    // online: i tasti di fine uguali per tutti i giochi (Rivincita, Ci sto…); se il core non li mette, quelli di sempre
    if (!cb.locale && t.tastiFine && t.tastiFine(s._piede, { host: !!cb.sonoHost, nuova: cb.sonoHost ? cb.onRigioca : null, esci: cb.onEsci })) { /* fatto dal core */ }
    else if (cb.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rigioca", onclick: cb.onRigioca }));
      s._piede.appendChild(el("div", { class: "ho-piede2" }, [
        el("button", { class: "btn btn-fantasma", text: "🛋️ Saletta", onclick: cb.onSaletta }),
        el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }) ]));
    } else if (cb.locale) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Rigioca", onclick: cb.onRigioca }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: guardo ? "Entri alla prossima corsa! 🐎" : "Aspetta l'host: un'altra corsa o di nuovo in saletta…" }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
  }

  // ========================================================
  //  CONTRO I BOT — tu (corsia 0) contro 1–7 bot
  // ========================================================
  // G = il Gran Premio in corso (null = una corsa sola): stessi Bot e stessi cavalli in tutte e tre le corse
  function corsa(t, nRivali, diff, G) {
    var N = Math.min(MAXN, 1 + Math.max(1, nRivali));
    var mioNome = (t.giocatori && t.giocatori[0]) || "Tu";
    if (G) G.corsa++;
    var bots = G && G.botsL ? G.botsL : prendiBot([mioNome], N - 1, diff);   // i bot del gruppo fisso, col loro avatar in sella
    var nomi = [mioNome].concat(bots.map(function (b) { return b.nome; })), cav = [nuovoCav(true, "io")];
    for (var i = 1; i < N; i++) cav.push(botCav(diff));
    var cn = G && G.cn ? G.cn : nomiCavalli(N), av = avatariPer(nomi, [mioAvatar(t, mioNome)].concat(bots.map(function (b) { return b.omino; })));
    if (G) { G.botsL = bots; G.cn = cn; }
    var fase = "via", conto = 3, raf = null, toC = null, ultimo = 0, primoArr = 0, finito = false, arrivi = [], foto = null, garaId = idGara();
    var ref = costruisci(t, N, nomi, 0, {
      cavallo: cn[0], gp: gpVia(G),
      onFrusta: function () {
        if (fase !== "corsa") return;
        var now = performance.now(); if (cav[0].boostU > now && !cav[0].sfin && !cav[0].arr) segnalaPresto(ref);
        if (frusta(cav[0], now)) frustaFX();
      },
      onEsci: function () { stop(); t.esci(); }
    }, av);
    function stop() { finito = true; if (raf) cancelAnimationFrame(raf); if (toC) clearInterval(toC); ref.rimuovi(); }
    function frame() {
      if (finito) return;
      var now = performance.now(), da = Math.max(ultimo || now, now - 250); ultimo = now;   // dopo una pausa lunga si riprende da dov'era
      var f = avanza(cav, da, now, arrivi); if (f && !foto) foto = f;
      if (arrivi.length && !primoArr) primoArr = now;
      disegna(ref, snap(cav, "corsa", 0, nomi));
      if (arrivi.length === cav.length || (cav[0].arr && now - primoArr > 4000)) return fine();
      raf = requestAnimationFrame(frame);
    }
    function fine() {
      stop();
      var ord = classificaDa(cav, arrivi);
      salvaTrofeiHorto(t, { id: garaId, n: N, diff: diff, online: false, umani: 1 }, ord, 0);
      if (G) {   // Gran Premio: i punti della corsa, poi la classifica a punti (alla terza corsa quella finale)
        var chiavi = nomi.map(function (n, s) { return s === 0 ? "io" : "bot:" + n; });
        gpSegna(G, ord, chiavi, nomi, nomi.map(function (n, s) { return s > 0; }));
        var gp = gpVista(G, chiavi);
        if (G.finito) { var mia = gp.righe.filter(function (r) { return r.k === "io"; })[0]; try { if (t.risultato) t.risultato([{ nome: mioNome, pos: mia ? mia.pos : 1 }]); } catch (e) {} }
        var dopo = function () {
          var partita = false, avanti = function () { if (partita) return; partita = true; corsa(t, nRivali, diff, G); };   // (tocco e conto a zero: una volta sola)
          renderGP(t, gp, { mia: "io", mioId: "io", av: av, locale: true, chiaveConto: "ho-gp|" + garaId, secondi: GP_ATTESA,
            onAvanti: avanti, onConto: avanti,
            onRigioca: function () { corsa(t, nRivali, diff, gpNuovo()); }, onEsci: t.esci });
        };
        finale(t, ord, nomi, 0, foto, cn, { locale: true, dopoFoto: dopo });
        return;
      }
      // XP e statistiche: solo io, col mio posto vero (i bot non vanno in classifica: un loro nome uguale a quello
      // di una persona le darebbe XP non suoi). Un intoppo qui non deve bloccare la fine
      try { if (t.risultato) t.risultato([{ nome: mioNome, pos: ord.indexOf(0) + 1 }]); } catch (e) {}
      finale(t, ord, nomi, 0, foto, cn, { locale: true, onRigioca: function () { corsa(t, nRivali, diff); }, onEsci: t.esci });
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
  //  ONLINE — host = corsia 0; gli amici prendono le altre; i posti
  //  liberi li corrono i bot. Host-autoritativo: simula e trasmette.
  //  Chi rientra ritrova il suo cavallo; chi arriva a corsa partita la guarda
  //  ed entra alla prossima; a fine corsa l'host rigioca o torna in saletta.
  // ========================================================
  var segnaCavalli = null;   // aggiorna la scelta "Quanti cavalli" nelle Regole (se entrano più amici, i cavalli aumentano)
  function hostHorto(t, diff, N) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    N = Math.max(2, Math.min(MAXN, N || 4));
    var nomeHost = String((t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Host").slice(0, 16);
    var codice = "…", pronta = false;
    var posti = {}, nomiU = {}, ominiU = {}, usciti = {}, attesa = [], visti = [];   // posto -> id/nome/avatar; usciti: andati via a corsa iniziata; visti: i nomi di tutti quelli passati dalla stanza
    for (var _s = 1; _s < N; _s++) { posti[_s] = null; nomiU[_s] = null; }
    var cav = null, nomi = null, ids = null, cn = null, ref = null, fase = "lobby", conto = 3, loop = null, toC = null, ultimo = 0, primoArr = 0,
      arrivi = [], ord = null, foto = null, rete = null, garaId = null, umaniGara = 1, msgVia = null, msgFine = null, nTick = 0;
    // Gran Premio (regola dell'host): G = punti e corsa a cui siamo; avanti = chi ha toccato «⏩ Avanti» sulla classifica;
    // ffHost = il photo finish dell'host (si ferma se intanto parte la corsa dopo); gpR = la classifica sullo schermo dell'host
    var gpOn = !!imp.gp, G = null, avantiGP = {}, gpScade = 0, ffHost = null, gpR = null, avCorsa = null;

    function seatDi(id) { for (var s = 1; s < N; s++) if (posti[s] === id) return s; return -1; }
    function postoLibero() { for (var s = 1; s < N; s++) if (!posti[s]) return s; return 0; }
    function quanti() { var n = 0; for (var s = 1; s < N; s++) if (posti[s]) n++; return n; }
    function segnaN(n) { N = n; imp.cavalli = n; if (segnaCavalli) segnaCavalli(n); }
    function nomiUmani() { var a = [nomeHost]; for (var s = 1; s < N; s++) if (posti[s]) a.push(nomiU[s]); attesa.forEach(function (x) { a.push(x.nome); }); return a; }
    function nomeLibero(nome) {   // due persone con lo stesso nome: alla seconda un numero (XP e vittorie si danno per nome)
      var usati = nomiUmani(), n = nome, i = 2;
      while (usati.some(function (u) { return stessoNome(u, n); })) n = nome.slice(0, 13) + " " + (i++);
      return n;
    }
    function siediti(id, nome, om) {   // un posto libero; se non c'è, un cavallo in più (fino a 8)
      var p = postoLibero();
      if (!p && N < MAXN) { p = N; segnaN(N + 1); }
      if (!p) return false;
      posti[p] = id; nomiU[p] = nome; ominiU[p] = om; return true;
    }
    function inAttesa(id) { for (var i = 0; i < attesa.length; i++) if (attesa[i].id === id) return attesa[i]; return null; }
    // prima di ogni corsa (e tornando in saletta): chi è uscito lascia il posto, chi aspettava entra
    function sistemaPosti() {
      for (var s = 1; s < N; s++) if (posti[s] && usciti[posti[s]]) { delete usciti[posti[s]]; posti[s] = null; nomiU[s] = null; ominiU[s] = null; }
      attesa = attesa.filter(function (a) { return a.fuori || !siediti(a.id, a.nome, a.om); });   // (chi non è stato scelto nella Sala resta a guardare)
    }
    function fuori() { return attesa.filter(function (a) { return a.fuori; }).map(function (a) { return { id: a.id, nome: a.nome }; }); }
    // "⚙️ Regole" in saletta: bravura dei bot e cavalli in gara. Chi è dentro resta
    // (se i cavalli calano, chi era oltre passa a un posto libero; mai meno cavalli delle persone)
    t.onRegole = function (im) {
      if (fase !== "lobby") return;
      diff = im.difficolta || "medio"; gpOn = !!im.gp;
      var dentro = [], s;
      for (s = 1; s < N; s++) if (posti[s]) dentro.push({ id: posti[s], nome: nomiU[s], om: ominiU[s], vecchio: s });
      var nuovoN = Math.max(2, dentro.length + 1, Math.min(MAXN, im.cavalli || 4));
      var p2 = {}, n2 = {}, o2 = {};
      for (s = 1; s < nuovoN; s++) { p2[s] = null; n2[s] = null; }
      dentro.forEach(function (d) { if (d.vecchio < nuovoN) { p2[d.vecchio] = d.id; n2[d.vecchio] = d.nome; o2[d.vecchio] = d.om; d.fatto = true; } });
      dentro.forEach(function (d) { if (d.fatto) return; for (var k = 1; k < nuovoN; k++) if (!p2[k]) { p2[k] = d.id; n2[k] = d.nome; o2[k] = d.om; return; } });
      posti = p2; nomiU = n2; ominiU = o2; segnaN(nuovoN);   // la scelta mostra il numero vero
      attesa = attesa.filter(function (a) { return a.fuori || !siediti(a.id, a.nome, a.om); });
      aggiornaLobby();
    };

    rete = SGNet.ospita("horto", {
      onCodice: function (c) { codice = c; aggiornaLobby(); },
      onConnesso: function () { pronta = true; aggiornaLobby(); },
      onAddio: function (id) {
        attesa = attesa.filter(function (a) { return a.id !== id; });
        var s = seatDi(id); if (s < 0) return;
        if (fase === "lobby") { posti[s] = null; nomiU[s] = null; ominiU[s] = null; aggiornaLobby(); return; }
        usciti[id] = true;   // resta in classifica col suo nome; il suo cavallo lo porta al traguardo un bot
        if (cav && cav[s] && fase !== "fine") { cav[s].umano = false; cav[s].ai = nuovoBot(diff); cav[s].nextClick = 0; }
        if (fase === "fine") contaAvanti();   // (Gran Premio: chi resta può essere già più di metà)
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var s = seatDi(id);
          if (s >= 0) {   // è già dentro (pagina ricaricata, app riaperta): gli rimando la corsa com'è adesso
            if (usciti[id]) { delete usciti[id]; if (cav && cav[s] && (fase === "via" || fase === "corsa")) { cav[s].umano = true; cav[s].ai = null; } }
            if ((fase === "via" || fase === "corsa") && msgVia) rete.inviaVeloce(Object.assign({}, msgVia, { to: id }));
            else if (fase === "fine" && msgFine) { rete.inviaVeloce(Object.assign({}, msgFine, { to: id })); if (gpScade) rete.inviaVeloce(Object.assign(msgConto(), { to: id })); }
            else aggiornaLobby();
            return;
          }
          var ia = inAttesa(id);
          if (ia) { if (ia.fuori && fase === "lobby") aggiornaLobby(); else rete.inviaVeloce({ t: "aspetta", to: id, pieno: fase === "lobby", guardi: !!ia.fuori }); return; }
          var nomeVero = String(m.nome || "Amico").trim().slice(0, 16) || "Amico";
          var nome = nomeLibero(nomeVero), om = avatarValido(m.omino);
          visti.push(nome);   // anche se poi esce, nessun bot prenderà il suo nome (sennò, se rientra, prenderebbe XP non suoi)
          // nella Sala corre solo chi è stato scelto ("Chi gioca?"): gli altri guardano (anche alle corse dopo)
          if (t.puoSedersi && !t.puoSedersi(id, nomeVero)) {
            attesa.push({ id: id, nome: nome, om: om, fuori: true });
            if (fase === "lobby") aggiornaLobby(); else rete.inviaVeloce({ t: "aspetta", to: id, guardi: true });
            return;
          }
          if (fase === "lobby" && siediti(id, nome, om)) { aggiornaLobby(); return; }
          attesa.push({ id: id, nome: nome, om: om });   // corsa già partita (o 8 cavalli già pieni): entra alla prossima
          rete.inviaVeloce({ t: "aspetta", to: id, pieno: fase === "lobby" });
        } else if (m.t === "frusta" && fase === "corsa") {
          var sm = seatDi(id); if (sm > 0 && cav[sm] && cav[sm].umano) frusta(cav[sm], performance.now());
        } else if (m.t === "avanti" && fase === "fine" && m.garaId === garaId) votoAvanti(id);   // Gran Premio: «⏩ Avanti» sulla classifica
      },
      onErrore: function () { chiudi(); errore(t, "Problema di collegamento: la stanza non si apre. Riprova."); }   // (solo se il primo collegamento non riesce)
    });

    function inizia() {
      if (fase === "via" || fase === "corsa") return;
      // Gran Premio: dalla saletta (o finito quello di prima) se ne comincia uno nuovo; se no è la corsa dopo
      if (!gpOn) G = null;
      else if (fase === "lobby" || !G || G.finito) G = gpNuovo();
      if (G) G.corsa++;
      if (ffHost && ffHost.annulla) ffHost.annulla();   // (il mio photo finish, se intanto si parte)
      ffHost = null; gpR = null; avantiGP = {}; gpScade = 0;
      sistemaPosti();
      fase = "via"; conto = 3; arrivi = []; primoArr = 0; ord = null; foto = null; msgFine = null; garaId = idGara();
      nomi = [nomeHost]; ids = ["host"]; cav = [nuovoCav(true, "host")];
      var cfgs = [mioAvatar(t, nomeHost)], liberi = [];
      for (var s = 1; s < N; s++) {
        if (posti[s]) { cav.push(nuovoCav(true, posti[s])); nomi.push(nomiU[s] || ("Amico " + s)); ids.push(posti[s]); cfgs[s] = ominiU[s]; }
        else { cav.push(botCav(diff)); nomi.push(null); ids.push(null); liberi.push(s); }
      }
      // nel Gran Premio sulla stessa corsia c'è lo stesso Bot in tutte le corse (se nel frattempo non ci si è seduto qualcuno)
      var giaBot = G ? Object.keys(G.bots).map(function (k) { return G.bots[k].nome; }) : [];
      var nb = prendiBot(nomiUmani().concat(visti).concat(giaBot), liberi.length, diff);
      liberi.forEach(function (s, i) {
        var b = G && G.bots[s] && !nomiUmani().some(function (n) { return stessoNome(n, G.bots[s].nome); }) ? G.bots[s] : nb[i];
        nomi[s] = b.nome; cfgs[s] = b.omino; if (G) G.bots[s] = b;
      });
      umaniGara = 1 + quanti(); cn = G && G.cn && G.cn.length === N ? G.cn : nomiCavalli(N);
      if (G) G.cn = cn;
      var av = avCorsa = avatariPer(nomi, cfgs);
      // ogni telefono costruisce la corsa e fa il suo 3-2-1. Resta in stanza: chi rientra ritrova il suo posto (ids)
      msgVia = { t: "via", nomi: nomi, n: N, av: av, ids: ids, cn: cn, garaId: garaId, diff: diff, umani: umaniGara, gp: gpVia(G) };
      rete.invia(msgVia);
      if (ref) ref.rimuovi();
      ref = costruisci(t, N, nomi, 0, {
        cavallo: cn[0], conferma: "Chiudere la corsa per tutti?", gp: gpVia(G),
        onFrusta: function () {
          if (fase !== "corsa") return;
          var now = performance.now(); if (cav[0].boostU > now && !cav[0].sfin && !cav[0].arr) segnalaPresto(ref);
          if (frusta(cav[0], now)) frustaFX();
        },
        onEsci: function () { chiudi(); t.esci(); }
      }, av);
      disegna(ref, snap(cav, "via", 3, nomi));
      toC = setInterval(function () {
        conto--; if (ref) disegna(ref, snap(cav, "via", Math.max(0, conto), nomi));
        if (conto < 0) { clearInterval(toC); toC = null; fase = "corsa"; ultimo = performance.now(); nTick = 0; loop = setInterval(tick, 16); }
      }, 800);
    }
    function tick() {
      // tutto il tempo passato davvero, a passi piccoli (con l'app in sottofondo il timer rallenta: si recupera, max 3 s)
      var now = performance.now(), da = Math.max(ultimo, now - 3000); ultimo = now;
      var f = avanza(cav, da, now, arrivi); if (f && !foto) foto = f;
      if (arrivi.length && !primoArr) primoArr = now;
      bcast();
      if (arrivi.length === cav.length || (primoArr && now - primoArr > 5000)) { clearInterval(loop); loop = null; fineCorsa(); }
    }
    // simula e disegna a ~60 al secondo (la telecamera resta liscia), ma trasmette 1 volta su 4 (~15 al secondo)
    function bcast() { var sn = snap(cav, fase, Math.max(0, conto), nomi); if (nTick++ % 4 === 0 || fase !== "corsa") rete.inviaVeloce(sn); if (ref) disegna(ref, sn); }
    function fineCorsa() {
      fase = "fine"; ord = classificaDa(cav, arrivi);
      if (!foto) foto = cav.map(function (h) { return Math.min(1, h.pos); });
      salvaTrofeiHorto(t, { id: garaId, n: N, diff: diff, online: true, umani: umaniGara }, ord, 0);
      msgFine = { t: "fine", ord: ord, nomi: nomi, ids: ids, cn: cn, foto: foto, garaId: garaId, diff: diff, n: N, umani: umaniGara };
      var gp = null;
      if (G) {   // Gran Premio: i punti di questa corsa (chi gioca col suo id, i Bot col nome)
        var chiavi = ids.map(function (id, s) { return id || "bot:" + nomi[s]; });
        gpSegna(G, ord, chiavi, nomi, ids.map(function (id) { return !id; }));
        gp = msgFine.gp = gpVista(G, chiavi); msgFine.av = avCorsa;
      }
      rete.invia(msgFine);
      // XP e torneo: solo le persone, col loro posto vero. I bot restano fuori: chi entra a corsa
      // partita può chiamarsi come uno di loro, e prenderebbe XP e vittorie non sue
      // (Gran Premio: alla Classifica della serata va solo la classifica a punti, alla fine della terza corsa)
      var cl = [];
      if (!G) ord.forEach(function (s, p) { if (ids[s]) cl.push({ nome: nomi[s], pos: p + 1 }); });
      else if (G.finito) gp.righe.forEach(function (r) { if (!r.bot) cl.push({ nome: r.nome, pos: r.pos }); });
      try { if (cl.length && t.risultato) t.risultato(cl); } catch (e) {}
      if (ref) { ref.rimuovi(); ref = null; }
      var esci = function () { chiudi(); t.esci(); };
      // Gran Premio: il conto alla rovescia è lo stesso per tutti e parte da adesso (photo finish, al massimo
      // FOTO_MS, più i secondi della classifica): così anche un telefono lento ha i suoi 12 secondi per guardarla
      if (gp && !gp.finito) { gpScade = Date.now() + FOTO_MS + GP_ATTESA * 1000; mandaConto(); }
      ffHost = finale(t, ord, nomi, 0, foto, cn, { sonoHost: true, onRigioca: inizia, onSaletta: tornaInSaletta, onEsci: esci,
        dopoFoto: gp ? function () {
          ffHost = null;
          var g0 = garaId;
          gpR = renderGP(t, gp, { mia: "host", mioId: "host", av: avCorsa, sonoHost: true, chiaveConto: "ho-gp|" + garaId,
            secondi: gp.finito ? 0 : Math.max(3, Math.round((gpScade - Date.now()) / 1000)), onConto: function () { if (fase === "fine" && garaId === g0) inizia(); },
            onAvanti: gp.finito ? null : function () { votoAvanti("host"); },
            onRigioca: inizia, onSaletta: tornaInSaletta, onEsci: esci });
          if (!gp.finito) mandaConto();   // (anche sul mio schermo: chi ha già toccato «⏩ Avanti»)
        } : null });
    }
    // Gran Premio, sulla classifica tra le corse: chi corre e ha toccato «⏩ Avanti» (più di metà: si parte subito)
    function presentiGP() { return (ids || []).filter(function (id) { return id && !usciti[id]; }); }
    function msgConto() {
      var pr = presentiGP();
      return { t: "gpconto", garaId: garaId, ms: Math.max(0, gpScade - Date.now()), avanti: pr.filter(function (id) { return avantiGP[id]; }), servono: pr.length };
    }
    function mandaConto() {
      var m = msgConto();
      rete.inviaVeloce(m);
      if (gpR && gpR.avanti) gpR.avanti(m.avanti, m.servono);
    }
    function votoAvanti(id) {
      if (fase !== "fine" || !G || G.finito || presentiGP().indexOf(id) < 0) return;
      avantiGP[id] = 1;
      contaAvanti();
    }
    function contaAvanti() {
      if (fase !== "fine" || !G || G.finito) return;
      var pr = presentiGP(), n = pr.filter(function (id) { return avantiGP[id]; }).length;
      if (n && n * 2 > pr.length) return inizia();   // più di metà: si parte subito
      if (gpScade) mandaConto();
    }
    // di nuovo in saletta: stessa stanza, stessi amici, l'host può cambiare le regole e chi aspettava entra (il Gran Premio finisce lì)
    function tornaInSaletta() { if (fase !== "fine") return; fase = "lobby"; G = null; gpScade = 0; gpR = null; sistemaPosti(); aggiornaLobby(); }
    t.onRivincita = inizia;   // la Rivincita della Sala (la "Rigioca" dell'host)
    function chiudi() { if (loop) clearInterval(loop); if (toC) clearInterval(toC); loop = toC = null; if (ref) ref.rimuovi(); if (rete) rete.chiudi(); }

    function seggi() {
      var a = [{ nome: nomeHost, id: "host", omino: mioAvatar(t, nomeHost) }];
      for (var s = 1; s < N; s++) a.push(posti[s] ? { nome: nomiU[s], id: posti[s], omino: ominiU[s] || null } : null);
      return a;
    }
    function aggiornaLobby() {
      if (fase !== "lobby") return;
      rete.invia({ t: "lobby", codice: codice, pronta: pronta, seggi: seggi(), fuori: fuori() }); // a tutti gli ospiti
      disegnaLobby();
    }
    function disegnaLobby() {
      if (fase !== "lobby") return;
      renderLobby(t, { codice: codice, pronta: pronta, sonoHost: true, myId: "host", seggi: seggi(), fuori: fuori() },
        { onComincia: inizia, onEsci: function () { chiudi(); t.esci(); } });
    }
    disegnaLobby();
  }

  function ospiteHorto(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", mySeat: -1, ref: null, fase: null, nomi: null, N: 0, garaId: null, diff: "medio", umani: 1,
      av: null, cn: null, ff: null, contoTimer: null, buf: [], raf: null, lastP: [], delayMs: 120 };   // buf: le posizioni ricevute, per un movimento liscio
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else schermaNome();   // col profilo si entra da soli

    // Calcola la vista da disegnare "adesso - delay" interpolando fra le posizioni ricevute.
    // Così, anche se i pacchetti arrivano a intervalli irregolari, il cavallo scorre liscio
    // invece di fermarsi e scattare. Se un pacchetto tarda, prosegue col suo passo.
    function vistaOra(now) {
      var b = S.buf, last = b[b.length - 1];
      var out = { fase: last.fase, conto: last.conto, N: last.N, nomi: last.nomi, cav: [] };
      var rt = now - S.delayMs, k;
      if (b.length < 2 || rt <= b[0].rt) {
        for (k = 0; k < b[0].cav.length; k++) { var c0 = b[0].cav[k]; out.cav[k] = { p: c0.p, s: c0.s, f: c0.f, a: c0.a, b: c0.b }; }
      } else if (rt >= last.rt) {                 // pacchetto in ritardo: prosegui col passo attuale (max 100ms)
        var P = b[b.length - 2], span = Math.max(1, last.rt - P.rt), ex = Math.min(rt - last.rt, 100);
        for (k = 0; k < last.cav.length; k++) { var cl = last.cav[k], vp = (cl.p - P.cav[k].p) / span; out.cav[k] = { p: Math.min(1, cl.p + vp * ex), s: cl.s, f: cl.f, a: cl.a, b: cl.b }; }
      } else {                                    // caso normale: interpola fra i due pacchetti che circondano rt
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
    function annullaFine() { if (S.ff && S.ff.annulla) S.ff.annulla(); S.ff = null; }
    function chiudiCorsa() {   // toglie la corsa disegnata (o il photo finish): parte un'altra corsa o si torna in saletta
      if (S.contoTimer) { clearInterval(S.contoTimer); S.contoTimer = null; }
      fermaGiro(); S.buf = []; S.lastP = [];
      if (S.ref) { S.ref.rimuovi(); S.ref = null; }
      annullaFine();
    }
    function esci() { chiudiCorsa(); if (S.rete) S.rete.chiudi(); t.esci(); }
    function mioCav() { var b = S.buf[S.buf.length - 1]; return b && S.mySeat >= 0 ? b.cav[S.mySeat] : null; }
    function schermaNome() {
      var s = t.schermata({ icona: "🐎", titolo: "Entra nella corsa", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: mioAvatar(t, S.nome) }); },   // (se la stanza non risponde lo dice il core)
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;   // era per un altro telefono
          if (m.t === "lobby") {
            S.mySeat = -1;
            for (var i = 0; i < (m.seggi || []).length; i++) if (m.seggi[i] && m.seggi[i].id === S.myId) S.mySeat = i;
            chiudiCorsa(); S.fase = "lobby"; mostraLobby(m);   // l'ospite vede la stanza come l'host
          } else if (m.t === "via") {       // parte la corsa: costruisci e fai il 3-2-1 qui (come l'host)
            var seat = m.ids ? m.ids.indexOf(S.myId) : S.mySeat;   // -1 = non corro: guardo ed entro alla prossima
            if (m.garaId && m.garaId === S.garaId && (S.fase === "fine" || (S.ref && S.ref.io === seat))) return;   // la stessa corsa, rimandata a chi rientra
            chiudiCorsa();
            S.mySeat = seat; S.nomi = m.nomi; S.N = m.n || (m.nomi ? m.nomi.length : 4); S.av = m.av || null; S.cn = m.cn || null;
            S.garaId = m.garaId; S.diff = m.diff || "medio"; S.umani = m.umani || 1; S.gp = m.gp || null; S.gpR = null;
            build({ nomi: S.nomi, N: S.N }); S.fase = "via"; contoOspite();
          } else if (m.t === "snap") {
            if (S.fase === "fine" || S.fase === "lobby") return;   // pacchetti in ritardo di una corsa già finita
            if (S.contoTimer) { clearInterval(S.contoTimer); S.contoTimer = null; }
            if (!S.ref) { if (!m.nomi) return; build(m); S.buf = []; S.lastP = []; }
            S.fase = m.fase;
            var now = performance.now();
            S.buf.push({ rt: now, fase: m.fase, conto: m.conto, N: m.N, nomi: m.nomi, cav: m.cav });
            while (S.buf.length > 8 && S.buf[0].rt < now - 1500) S.buf.shift();
            avviaGiro();
          } else if (m.t === "fine") {
            // già vista (ma se sto rivedendo il photo finish della foto trattenuta e l'host mi manda la classifica del Gran Premio, vado lì)
            if (m.garaId && m.garaId === S.garaId && S.fase === "fine" && !(m.to && m.gp && S.ff)) return;
            var io = m.ids ? m.ids.indexOf(S.myId) : S.mySeat;
            chiudiCorsa(); S.fase = "fine"; S.garaId = m.garaId || S.garaId;
            if (io >= 0) salvaTrofeiHorto(t, { id: m.garaId || S.garaId, n: m.n || S.N, diff: m.diff || S.diff, online: true, umani: m.umani || S.umani }, m.ord, io);
            S.gpR = null;
            var gp = m.gp || null, gid = m.garaId, avF = m.av || S.av;
            // Gran Premio: dopo il photo finish la classifica a punti (tra le corse col «⏩ Avanti», alla fine il podio)
            var classificaGP = function () {
              S.ff = null;
              S.gpR = renderGP(t, gp, { mia: S.myId, mioId: S.myId, av: avF, chiaveConto: "ho-gp|" + gid, onEsci: esci,
                onAvanti: !gp.finito && io >= 0 ? function () { if (S.rete) S.rete.invia({ t: "avanti", garaId: gid }); } : null });
              S.gpR.gara = gid;
              mostraConto();
            };
            // chi rientra (pagina ricaricata) mentre c'è la classifica del Gran Premio: dritto lì, senza rivedere il photo finish
            if (gp && m.to) classificaGP();
            else S.ff = finale(t, m.ord, m.nomi, io, m.foto, m.cn, { sonoHost: false, onEsci: esci, dopoFoto: gp ? classificaGP : null });
          } else if (m.t === "gpconto") {   // Gran Premio: il tempo che manca e chi ha già toccato «⏩ Avanti»
            S.gpConto = { garaId: m.garaId, fine: Date.now() + (+m.ms || 0), avanti: m.avanti || [], servono: m.servono || 1 };
            mostraConto();
          } else if (m.t === "aspetta") {   // la corsa è già partita: entro alla prossima (guardi: nella Sala non sono tra gli scelti)
            if (!S.ref && S.fase !== "fine") schermaAspetta(m.pieno, m.guardi);
          }
        },
        onChiuso: function () { chiudiCorsa(); errore(t, "La corsa è stata chiusa dall'host."); },   // (chiusa apposta: se l'host sparisce, "La stanza è chiusa" lo dice il core)
        onErrore: function () { chiudiCorsa(); errore(t, "Problema di collegamento. Riprova."); }   // (solo se il primo collegamento non riesce)
      });
    }
    // Gran Premio: sulla classifica tra le corse il conto alla rovescia (lo tiene l'host) e quanti hanno toccato «⏩ Avanti»
    function mostraConto() {
      var R = S.gpR, C = S.gpConto;
      if (!R || !C || C.garaId !== R.gara || !R.s.isConnected) return;
      if (R.avviaConto) R.avviaConto(Math.round((C.fine - Date.now()) / 1000));
      if (R.avanti) R.avanti(C.avanti, C.servono);
    }
    function build(sn) {
      if (S.ref) S.ref.rimuovi();
      annullaFine();
      S.nomi = sn.nomi; S.N = sn.N;
      S.ref = costruisci(t, sn.N, sn.nomi, S.mySeat, {
        cavallo: S.cn && S.mySeat >= 0 ? S.cn[S.mySeat] : "", gp: S.gp,
        onFrusta: function () {
          if (S.fase !== "corsa" || !S.rete || S.mySeat < 0) return;
          var io = mioCav(); if (io && (io.f || io.a)) return;
          if (io && io.b) segnalaPresto(S.ref);
          S.rete.invia({ t: "frusta" }); frustaFX();   // lo schiocco subito, senza aspettare la rete
        },
        onEsci: esci
      }, avatariPer(sn.nomi, S.av));
      // l'ospite guida il movimento a 60fps con l'interpolazione: niente transizione CSS
      S.ref.cavEl.forEach(function (c) { c.style.transition = "none"; });
    }
    function contoOspite() {   // 3-2-1-VIA dell'ospite, poi arrivano le posizioni
      if (S.contoTimer) clearInterval(S.contoTimer);
      var c = 3; disegna(S.ref, snapFermo(S.nomi, S.N, 3, "via"));
      S.contoTimer = setInterval(function () {
        if (!S.ref || S.fase !== "via") { clearInterval(S.contoTimer); S.contoTimer = null; return; }
        c--; disegna(S.ref, snapFermo(S.nomi, S.N, Math.max(0, c), "via"));
        if (c < 0) { clearInterval(S.contoTimer); S.contoTimer = null; }
      }, 800);
    }
    function mostraLobby(m) {
      renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, seggi: m.seggi, fuori: m.fuori }, { onEsci: esci });
    }
    function attesa() {   // finché non arriva la saletta dall'host
      var s = t.schermata({ icona: "🐎", titolo: "⏳ Sto entrando…", sotto: "Horto Muso · stanza " + String(codice).toUpperCase(), indietro: esci });
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
    function schermaAspetta(pieno, guardi) {
      var s = t.schermata({ icona: "🐎", titolo: guardi ? "👀 Questa volta guardi" : pieno ? "La corsa è piena" : "👀 Corsa già partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: esci });
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px",
        text: guardi ? "Corrono gli amici scelti: alla prossima corsa la guardi dall'inizio! 🐎" : pieno ? "Ci sono già 8 cavalli: entri appena si libera un posto." : "Entri alla prossima corsa! 🐎" }));
      var f = t.faccine && t.faccine(); if (f) { f.style.margin = "16px auto 0"; f.style.maxWidth = "320px"; s._contenuto.appendChild(f); }   // si aspetta: le faccine
      t.mostra(s);
    }
  }

  // saletta uguale per host e ospite: mostra chi c'è (i posti liberi li corrono i bot), evidenzia il proprio.
  function renderLobby(t, vm, cb) {
    var gio = [], vuoti = 0;
    (vm.seggi || []).forEach(function (sg, i) { if (sg) gio.push({ id: sg.id, nome: sg.nome, omino: sg.omino || null, host: i === 0, tu: sg.id === vm.myId }); else vuoti++; });
    // nella Sala: chi non è stato scelto guarda la corsa (niente cavallo e niente "Sono pronto")
    var fuori = vm.fuori || [], guardo = !gio.some(function (g) { return g.tu; }) && fuori.some(function (g) { return g.id === vm.myId; });
    t.lobby({ host: vm.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 1, puoiDaSolo: true, vuoti: vuoti, giocatori: gio, testoComincia: "Comincia la corsa ▶",
      nota: vm.sonoHost ? "Puoi cominciare quando vuoi: i posti liberi li corrono i bot." : null,
      extra: fuori.length ? [t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + fuori.map(function (g) { return g.id === vm.myId ? "tu" : g.nome; }).join(", ") })] : null,
      spettatore: guardo ? "👀 Questa volta guardi" : null,
      attesa: guardo ? "Corrono gli amici scelti: questa corsa la guardi! 🐎" : "Aspetta che l'host dia il via alla corsa! 🐎", onComincia: cb.onComincia, onEsci: cb.onEsci });
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
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro i Bot", sotto: "Corri da solo contro i cavalli dei Bot" }],
    nome: "Horto Muso",
    icona: "🐎",
    descrizione: "Corsa di cavalli: frusta a ritmo per accelerare, ma occhio all'energia! Contro i bot o online, ognuno dal suo telefono.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 1,
    etichettaGiocatori: "👥 1–8 giocatori",   // 1 da solo contro i bot, fino a 8 online (i cavalli in gara)
    postiOnline: 8,   // 8 cavalli al massimo: nella Sala, se siete di più, corre chi sceglie l'host e gli altri guardano
    // le regole in una riga, per la saletta ("📜 Si gioca così")
    riassunto: function (imp) {
      imp = imp || {};
      var liv = { facile: "Bot facili", medio: "Bot medi", difficile: "Bot difficili" }[imp.difficolta] || "Bot medi";
      return (imp.gp ? "🏆 Gran Premio: 3 corse a punti, l'ultima vale doppio · " : "Una corsa · ") + (imp.cavalli || 4) + " cavalli · " + liv;
    },
    regole: [
      "Si parte dai <b>cancelletti</b>: corsie dritte, 1.000 m per tutti. La telecamera segue la corsa e in alto la minimappa mostra dove siete.",
      "In sella c'è il tuo <b>avatar</b>; sugli altri cavalli ci sono i <b>Bot</b>, sempre gli stessi personaggi, e a ogni corsa ognuno ha il suo carattere: c'è chi parte a razzo e chi rimonta nel finale.",
      "I cavalli corrono da soli a una <b>velocità minima</b>. Ogni tocco su <b>FRUSTA</b> dà una spinta di un attimo.",
      "Tocca <b>a ritmo, non a raffica</b>: toccare di nuovo mentre la spinta dura spreca energia (vedi ⚠️ Troppo presto).",
      "Ogni frustata consuma <b>energia</b> (la barra sopra il tasto). Se non frusti, l'energia si <b>ricarica</b>.",
      "Se l'energia arriva a <b>zero</b> il cavallo è <b>sfinito</b>: rallenta e per <b>3 secondi</b> non puoi frustare. Tieni qualcosa per lo <b>scatto finale</b>!",
      "Vince il <b>primo</b> che taglia il traguardo: se è testa a testa decide il <b>photo finish</b>.",
      "Da <b>2 a 8 cavalli</b>: <b>contro i bot</b> oppure <b>online</b> (ognuno dal suo telefono; i posti liberi li corrono i bot).",
      "<b>🏆 Gran Premio</b> (si sceglie nelle regole): 3 corse di fila, <b>10, 6, 4, 3, 2, 1 punti</b> per il posto, e l'<b>ultima corsa vale doppio</b>. Tra una corsa e l'altra la classifica: si riparte da soli, o subito se più di metà tocca «⏩ Avanti»."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = aiuti.modo || "bot"; dove.cavalli = 4; dove.difficolta = "medio";
      var bBot = null, bOnl = null, notaOnline, notaPosti;
      function selM(m) {
        dove.modo = m;
        if (bBot) { bBot.className = "modo-chip" + (m === "bot" ? " attiva" : ""); bOnl.className = "modo-chip" + (m === "online" ? " attiva" : ""); }
        notaPosti.hidden = m !== "online"; notaOnline.hidden = m !== "online" || !!aiuti.modo;
      }
      if (!aiuti.modo && !aiuti.sala) {   // (se "Come giocate?" l'avete già scelto prima, qui non si sceglie)
        bBot = el("button", { class: "modo-chip attiva", onclick: function () { selM("bot"); } }, [
          el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro i Bot" }), el("div", { class: "ms", text: "Da solo" })])]);
        bOnl = el("button", { class: "modo-chip", onclick: function () { selM("online"); } }, [
          el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
        box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
        box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      }
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Quanti cavalli in gara" }));
      var wR = el("div", { style: "display:flex;gap:5px" }), chip = {};
      function segna(n) { dove.cavalli = n; for (var k in chip) chip[k].className = "modo-chip" + (+k === n ? " attiva" : ""); }
      [2, 3, 4, 5, 6, 7, 8].forEach(function (n) {
        chip[n] = el("button", { class: "modo-chip", style: "flex:1;justify-content:center;text-align:center;padding-left:0;padding-right:0;min-width:0", onclick: function () { segna(n); } },
          [el("div", { class: "mt", text: String(n) })]);
        wR.appendChild(chip[n]);
      });
      segna(4);
      segnaCavalli = segna;   // online: se entrano più amici dei cavalli scelti, qui si vede il numero vero
      box.appendChild(wR);
      notaPosti = el("p", { class: "modulo-nota", style: "margin-top:6px", text: "Online: i posti liberi li corrono i bot; se entrano più amici, i cavalli aumentano da soli." });
      box.appendChild(notaPosti);
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei Bot" }));
      var wD = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(wD.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        wD.appendChild(b);
      });
      box.appendChild(wD);
      // il Gran Premio: 3 corse a punti (10, 6, 4, 3, 2, 1), l'ultima vale doppio
      dove.gp = false;
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "🏆 Gran Premio" }));
      var wG = el("div", { style: "display:flex;gap:8px" }), notaGp = el("p", { class: "modulo-nota", style: "margin-top:6px;display:none",
        text: "3 corse di fila: punti 10, 6, 4, 3, 2, 1 per il posto, e l'ultima corsa vale doppio. Vince chi ha più punti alla fine." });
      [[false, "Una corsa"], [true, "3 corse a punti"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] ? "" : " attiva"), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.gp = d[0]; [].forEach.call(wG.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
          notaGp.style.display = d[0] ? "" : "none";
        } }, [el("div", { class: "mt", text: d[1] })]);
        wG.appendChild(b);
      });
      box.appendChild(wG); box.appendChild(notaGp);
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri la stanza e invita gli amici col tasto 📤: gli altri corrono dal loro telefono. I posti liberi li corrono i bot."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
      selM(aiuti.sala ? "online" : dove.modo);
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteHorto(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostHorto(t, imp.difficolta || "medio", imp.cavalli || 4);
      return corsa(t, (imp.cavalli || 4) - 1, imp.difficolta || "medio", imp.gp ? gpNuovo() : null);
    }
  });
})();
