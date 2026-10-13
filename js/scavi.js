/* =========================================================
   SPeeD GAME — GLI SCAVI ANTICHI (fuori città, oltre il parco)
   Si gioca in due momenti, come la pesca:
   1. IL CAMPO: un terreno 9×9 diviso coi picchetti e lo spago. Tocchi un quadrato: il tuo avatar ci va e scava.
      Niente intorno → ❌ su tutto il quadrato attorno (come in Pet Society); qualcosa vicino → la bandierina ✅.
      6 colpi al giorno (altri si comprano). Il campo resta com'è anche i giorni dopo, finché non trovi i 3 reperti:
      allora ne arriva subito uno nuovo. A volte un coccio in superficie fa da indizio.
   2. L'ESTRAZIONE (presa dal Sotterraneo di Pokémon): la terra a quadretti e a strati, il piccone (veloce, ma fa
      franare e crepa il reperto) e il pennello (piano e sicuro). Se frana, tieni solo quello che è già fuori.
   Poi la carta del reperto: lo vendi o lo tieni nello zaino. Il museo raccoglie tutti i pezzi, epoca per epoca.
   Più è raro, più è in fondo e più è fragile. La maschera d'oro del faraone è leggendaria.
   SGScavi.crea({ omino, dati, salva(dati), monete(), cambia(n), audio(), seme, indietro }) -> schermata (poi ._monta())
   ========================================================= */
(function () {
  "use strict";

  var N = 9, COLPI_GIORNO = 6, NASCOSTI = 3, PACCO = { n: 5, prezzo: 500 }, ZAINO_MAX = 40, PREMIO_EPOCA = 2000;
  var EPOCHE = [
    { id: "preistoria", nome: "Preistoria", ico: "🦴" }, { id: "egitto", nome: "Antico Egitto", ico: "🔺" },
    { id: "grecia", nome: "Antica Grecia", ico: "🏛️" }, { id: "roma", nome: "Antica Roma", ico: "🛡️" }
  ];
  var RARITA = ["", "Comune", "Non comune", "Rara", "Epica", "Leggendaria"], COL_R = ["", "#868e96", "#2f9e44", "#1c7ed6", "#9c36b5", "#f59f00"];
  // i reperti: r = rarità (1 comune … 5 leggendaria), m = la forma sotto terra (X = un quadretto occupato)
  var REPERTI = [
    // storia = la scheda del museo: due righe vere, dette semplici
    { id: "freccia", nome: "Punta di freccia", epoca: "preistoria", quando: "8.000 a.C.", r: 1, v: 300, m: ["X", "X"],
      storia: "Scheggiata colpo dopo colpo nella selce, una pietra che si rompe con i bordi taglienti come il vetro. Legata a un bastoncino con tendini e resina, serviva per cacciare cervi e cinghiali con l'arco." },
    { id: "amigdala", nome: "Amigdala", epoca: "preistoria", quando: "500.000 anni fa", r: 1, v: 260, m: ["XX", "XX"],
      storia: "Il primo attrezzo \"tuttofare\" della storia: una pietra lavorata su tutti e due i lati fino alla forma di una mandorla (in greco amigdala vuol dire proprio mandorla). Si teneva in mano per tagliare carne, legno e pelli." },
    { id: "dente", nome: "Molare di mammut", epoca: "preistoria", quando: "20.000 a.C.", r: 2, v: 700, m: ["XX", "XX"],
      storia: "Grande come un mattone, era fatto di lamine di smalto per macinare l'erba dura della steppa ghiacciata. Il mammut lanoso cambiava i molari sei volte nella vita: quando uno si consumava, ne spuntava uno nuovo." },
    { id: "ammonite", nome: "Ammonite fossile", epoca: "preistoria", quando: "150 milioni di anni fa", r: 2, v: 650, m: ["XX", "XX"],
      storia: "Una lontana cugina del polpo che viveva in mare dentro questo guscio a spirale, diviso in stanzette piene d'aria per stare a galla. Le ammoniti sono sparite insieme ai dinosauri, 66 milioni di anni fa." },
    { id: "zanna", nome: "Zanna di mammut", epoca: "preistoria", quando: "15.000 a.C.", r: 3, v: 1700, m: ["..XX", "XXX."],
      storia: "Le zanne erano denti che crescevano per tutta la vita, fino a 4 metri. Il mammut le usava per spazzare via la neve e trovare l'erba; gli uomini delle caverne con l'avorio facevano statuette, aghi e collane." },
    { id: "ambra", nome: "Ambra con insetto", epoca: "preistoria", quando: "40 milioni di anni fa", r: 3, v: 1800, m: ["XX", "XX"],
      storia: "Una goccia di resina appiccicosa è colata da un albero e ha intrappolato questa zanzara. Col passare del tempo la resina è diventata dura come una pietra, e l'insetto è rimasto lì dentro intatto per milioni di anni." },
    { id: "pittura", nome: "Pittura rupestre", epoca: "preistoria", quando: "15.000 a.C.", r: 4, v: 3000, m: ["XXX", "XXX"],
      storia: "Sulle pareti delle grotte si dipingevano bisonti e cacciatori con terra rossa e carbone. Per l'impronta della mano si appoggiava il palmo alla roccia e si soffiava il colore tutto intorno, con la bocca o con un osso cavo." },
    // il T-rex in 4 pezzi (dino: "trex"): uno su sette reperti sepolti è un pezzo di dinosauro; con tutti e 4 lo scheletro va nel museo
    { id: "teschio", nome: "Cranio di T-rex", epoca: "preistoria", quando: "68 milioni di anni fa", r: 4, v: 1500, lv: 1, dino: "trex", m: ["XXXX", "XXXX", "XXX."],
      storia: "Lungo un metro e mezzo, con una sessantina di denti grandi come banane. Il T-rex aveva il morso più forte di tutti gli animali di terra mai esistiti: poteva spezzare le ossa." },
    { id: "trex_torace", nome: "Costole e braccine del T-rex", epoca: "preistoria", quando: "68 milioni di anni fa", r: 4, v: 1500, lv: 1, dino: "trex", m: ["XXXX", "XXXX", ".XX."],
      storia: "Le famose braccine erano lunghe come quelle di un uomo, con due sole dita, ma abbastanza forti da sollevare quasi 200 chili. Le costole proteggevano polmoni con sacche d'aria, come quelli degli uccelli." },
    { id: "trex_zampa", nome: "Bacino e zampa del T-rex", epoca: "preistoria", quando: "68 milioni di anni fa", r: 4, v: 1500, lv: 1, dino: "trex", m: ["XXX", "XXX", ".X.", "XX."],
      storia: "Su queste zampe camminava un animale di 8 tonnellate, più pesante di un elefante. Toccava terra con tre grosse dita, proprio come gli uccelli: sono loro i parenti di oggi dei dinosauri." },
    { id: "trex_coda", nome: "Coda del T-rex", epoca: "preistoria", quando: "68 milioni di anni fa", r: 4, v: 1500, lv: 1, dino: "trex", m: ["XXXXX", "XXX.."],
      storia: "La coda lunga e pesante faceva da contrappeso alla testa enorme, come l'asta di un equilibrista: senza, il T-rex sarebbe caduto in avanti. Dalla testa alla coda era lungo 12 metri, quanto un autobus." },
    { id: "scarabeo", nome: "Scarabeo sacro", epoca: "egitto", quando: "1.500 a.C.", r: 2, v: 600, m: ["X"],
      storia: "Gli Egizi vedevano lo scarabeo spingere la sua pallina di terra e pensavano che così il dio Khepri facesse rotolare il sole nel cielo. Questi amuleti si portavano addosso per avere fortuna e protezione." },
    { id: "gatto", nome: "Statuetta del gatto", epoca: "egitto", quando: "1.200 a.C.", r: 4, v: 3200, m: ["X.", "XX", "XX"],
      storia: "In Egitto i gatti erano sacri alla dea Bastet, protettrice della casa e della famiglia. Facevano la guardia ai granai contro i topi e, quando morivano, venivano mummificati come le persone." },
    { id: "maschera", nome: "Maschera d'oro del faraone", epoca: "egitto", quando: "1.300 a.C.", r: 5, v: 12000, m: ["XXX", "XXX", ".X."],
      storia: "D'oro e di pietre blu, copriva il volto della mummia perché il faraone fosse riconosciuto nell'aldilà. La più famosa è quella di Tutankhamon, la cui tomba fu scoperta quasi intatta nel 1922." },
    { id: "civetta", nome: "Moneta con la civetta", epoca: "grecia", quando: "450 a.C.", r: 2, v: 500, m: ["X"],
      storia: "La moneta d'argento di Atene: da un lato la dea Atena, dall'altro la sua civetta, simbolo di saggezza. La stessa civetta oggi è disegnata sulla moneta greca da 1 euro." },
    { id: "vaso", nome: "Vaso greco dipinto", epoca: "grecia", quando: "500 a.C.", r: 3, v: 1600, m: ["XX", "XX", "XX"],
      storia: "Sui vasi i Greci dipingevano eroi, dèi e atleti, con figure nere su fondo rosso o rosse su fondo nero. Servivano per vino, olio e acqua, e si vendevano in tutto il Mediterraneo." },
    { id: "elmo", nome: "Elmo corinzio", epoca: "grecia", quando: "600 a.C.", r: 4, v: 3000, m: ["XX", "XX"],
      storia: "L'elmo degli opliti, i soldati greci: un solo pezzo di bronzo battuto a mano che copriva tutta la testa, con una fessura per gli occhi e la bocca. In cima spesso c'era una cresta di crine di cavallo." },
    { id: "chiodo", nome: "Chiodo arrugginito", epoca: "roma", quando: "80 d.C.", r: 1, v: 90, m: ["X", "X"],
      storia: "I chiodi romani li faceva il fabbro a mano, uno per uno. In un forte in Scozia ne hanno trovati quasi un milione, sepolti dai soldati prima di andarsene perché i nemici non potessero usare il ferro." },
    { id: "coccio", nome: "Coccio di vaso", epoca: "roma", quando: "200 d.C.", r: 1, v: 120, m: ["XX"],
      storia: "A Roma c'è una collina fatta solo di cocci: il Monte Testaccio, alta come un palazzo di dieci piani. È nata buttando via, per secoli, milioni di anfore rotte che avevano portato l'olio." },
    { id: "moneta", nome: "Moneta d'argento", epoca: "roma", quando: "50 a.C.", r: 2, v: 300, m: ["X"],
      storia: "Il denario, la moneta d'argento dei Romani: con uno si pagava più o meno una giornata di lavoro. Dal suo nome latino, denarius, viene la nostra parola \"denaro\"." },
    { id: "lucerna", nome: "Lucerna a olio", epoca: "roma", quando: "100 d.C.", r: 2, v: 550, m: ["XX"],
      storia: "La lampada di tutte le case romane: si riempiva d'olio d'oliva e si accendeva lo stoppino che usciva dal beccuccio. Sopra c'erano disegni di gladiatori, animali e dèi." },
    { id: "anfora", nome: "Anfora romana", epoca: "roma", quando: "100 d.C.", r: 3, v: 1500, m: [".X.", "XXX", "XXX", ".X."],
      storia: "Il grande vaso di terracotta per portare vino, olio e salsa di pesce sulle navi. La punta in fondo serviva per piantarla nella sabbia o incastrarla tra le altre anfore nella stiva." },
    { id: "gladio", nome: "Gladio del legionario", epoca: "roma", quando: "50 d.C.", r: 3, v: 1900, m: ["X", "X", "X"],
      storia: "La spada corta dei legionari, lunga più o meno come un braccio: si colpiva di punta, stando stretti dietro il grande scudo. Dal suo nome latino, gladius, viene la parola \"gladiatore\"." }
  ];
  var PER_ID = {}; REPERTI.forEach(function (x) { PER_ID[x.id] = x; });
  var PICCOLI = ["moneta", "civetta", "scarabeo", "coccio"];   // le sorprese in più nella buca
  var DINO = { trex: { nome: "T-rex", pezzi: ["teschio", "trex_torace", "trex_zampa", "trex_coda"], premio: 8000,
    storia: "Il suo nome vuol dire \"re delle lucertole tiranne\". Visse in America del Nord alla fine dell'epoca dei dinosauri, poco prima che un enorme asteroide li facesse sparire. Gli scheletri quasi completi sono rarissimi: nel mondo si contano sulle dita di due mani." } }, CHANCE_DINO = .14;
  function etichettaR(R) { return R.dino ? "Fossile" : RARITA[R.r]; }
  function coloreR(R) { return R.dino ? "#8d6e3f" : COL_R[R.r]; }

  // ---------- attrezzi ----------
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function hash(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function oggi() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function fase() { try { return window.SGCitta ? SGCitta.fase(new Date()) : "giorno"; } catch (e) { return "giorno"; } }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }   // solo quando si tocca
  function valoreDi(id, integro) { return Math.round(PER_ID[id].v * (0.4 + 0.6 * (integro == null ? 100 : integro) / 100)); }
  function datiIniziali() { return { v: 1, album: {}, zaino: [], colpi: { g: oggi(), usati: 0 }, extra: 0, campo: null, inCorso: null, premi: {}, tot: 0 }; }

  // ---------- i suoni ----------
  var AUDIO = null, CHIAVE_SUONI = "sg-sv-suoni";
  function suoniOn() { try { return localStorage.getItem(CHIAVE_SUONI) !== "0"; } catch (e) { return true; } }
  function tono(f, quando, dur, tipo, vol, fine) {
    if (!suoniOn()) return; var c = AUDIO && AUDIO(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), a = c.currentTime + (quando || 0);
      o.type = tipo || "sine"; o.frequency.setValueAtTime(f, a); if (fine) o.frequency.exponentialRampToValueAtTime(fine, a + dur);
      g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(vol || 0.1, a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + dur);
      o.connect(g); g.connect(c.destination); o.start(a); o.stop(a + dur + 0.05);
    } catch (e) {}
  }
  function suonoPala() { tono(130, 0, .14, "triangle", .22, 60); tono(240, .02, .08, "sawtooth", .03, 120); }
  function suonoX() { tono(300, 0, .09, "triangle", .06, 200); }
  function suonoSi() { tono(660, 0, .1, "triangle", .1); tono(880, .09, .16, "triangle", .1); }
  function suonoTrovato() { [0, 4, 7, 12].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * .08, .3, "triangle", .1); }); }
  function suonoTerra() { tono(220, 0, .08, "sawtooth", .045, 110); }
  function suonoPennello() { tono(900, 0, .06, "sine", .025, 600); }
  function suonoTok() { tono(700, 0, .05, "square", .07); tono(500, .05, .08, "square", .05); }
  function suonoCrepa() { tono(1800, 0, .04, "square", .07); tono(1200, .04, .06, "square", .05); }
  function suonoFrana() { tono(90, 0, .8, "sawtooth", .16, 40); }
  function suonoMonete() { [0, 7, 12].forEach(function (k, i) { tono(1046 * Math.pow(2, k / 12), i * .06, .15, "triangle", .07); }); }
  function suonoCarta(r) { [0, 4, 7, 12, 16].slice(0, 1 + r).forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * .08, .3, "triangle", .09); }); }

  // =========================================================
  //  I DISEGNI "BELLI" (SVG): il T-rex in 4 pezzi e lo scheletro montato. Ossa fossili color avorio con le sfumature,
  //  i bordi scuri, le macchie del fossile e i riflessi. Ogni pezzo ha il riquadro della sua forma sotto terra (4×3 → 400×300).
  //  ARTE[id](p) = il corpo del disegno (p = prefisso per gli id dei gradienti, così più disegni stanno nella stessa pagina)
  // =========================================================
  var OSSO_LINEA = "#5a4528", OSSO_BUCO = "#3a2c1c";
  function defsOsso(p) {
    return "<linearGradient id='" + p + "o' x1='0' y1='0' x2='.35' y2='1'><stop offset='0' stop-color='#f6edd6'/><stop offset='.5' stop-color='#e0cfa8'/><stop offset='1' stop-color='#b99d6d'/></linearGradient>" +
      "<radialGradient id='" + p + "b' cx='.5' cy='.4' r='.7'><stop offset='0' stop-color='#2a1f13'/><stop offset='1' stop-color='#4d3a24'/></radialGradient>";
  }
  function osso(d, p, w) { return "<path d='" + d + "' fill='url(#" + p + "o)' stroke='" + OSSO_LINEA + "' stroke-width='" + (w || 4) + "' stroke-linejoin='round'/>"; }
  function buco(d, p) { return "<path d='" + d + "' fill='url(#" + p + "b)' stroke='" + OSSO_LINEA + "' stroke-width='2.5' stroke-linejoin='round'/>"; }
  function macchie(d, p, n, x0, y0, x1, y1, seme) {   // le macchie scure del fossile, solo dentro l'osso
    var r = rnd(seme), s = "<clipPath id='" + p + "m" + seme + "'><path d='" + d + "'/></clipPath><g clip-path='url(#" + p + "m" + seme + ")'>";
    for (var i = 0; i < n; i++) s += "<ellipse cx='" + (x0 + r() * (x1 - x0)).toFixed(1) + "' cy='" + (y0 + r() * (y1 - y0)).toFixed(1) + "' rx='" + (1.5 + r() * 5).toFixed(1) + "' ry='" + (1 + r() * 3).toFixed(1) + "' fill='#8a6a3e' opacity='" + (.15 + r() * .25).toFixed(2) + "'/>";
    return s + "</g>";
  }
  function riflesso(d, w, op) { return "<path d='" + d + "' fill='none' stroke='#fffaf0' stroke-width='" + (w || 4) + "' stroke-linecap='round' opacity='" + (op || .55) + "'/>"; }
  // per le pietre scheggiate (freccia, amigdala): il bordo a punti, il filo seghettato, le scaglie tra il bordo e la costola
  function curvaQ(a, c, b, t) { var u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; }
  function percorso(pts) { return "M" + pts.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" L") + " Z"; }
  function seghetta(pts, amp, centro) {   // tra un punto e l'altro del bordo, un morso verso l'interno
    var o = [pts[0]];
    for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], my = (a[1] + b[1]) / 2, cx = typeof centro === "function" ? centro(my) : centro, mx = (a[0] + b[0]) / 2; o.push([mx + (mx < cx ? amp : -amp), my]); o.push(b); }
    return o;
  }
  function scaglie(bordo, cresta, obliqua, yMax, seme) {   // ogni scaglia: chiara o scura, con le onde lasciate dal colpo
    var s = "", r = rnd(seme);
    function R(e) { var y = Math.min(e[1] + obliqua, yMax); return [cresta(y), y]; }
    for (var i = 0; i < bordo.length - 1; i++) {
      var a = bordo[i], b = bordo[i + 1], ra = R(a), rb = R(b), lum = r(), c = function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); };
      s += "<path d='M" + c(a) + " L" + c(b) + " L" + c(rb) + " L" + c(ra) + " Z' fill='" + (lum > .5 ? "#fff" : "#1e140c") + "' opacity='" + (.05 + Math.abs(lum - .5) * .34).toFixed(2) + "' stroke='#1e140c' stroke-width='1' stroke-opacity='.4' stroke-linejoin='round'/>";
      [.32, .62].forEach(function (f) {   // le onde del colpo, parallele al bordo
        var p1 = [a[0] + (ra[0] - a[0]) * f, a[1] + (ra[1] - a[1]) * f], p2 = [b[0] + (rb[0] - b[0]) * f, b[1] + (rb[1] - b[1]) * f], m = [(p1[0] + p2[0]) / 2 + (a[0] - ra[0]) * .08, (p1[1] + p2[1]) / 2 + (a[1] - ra[1]) * .08];
        s += "<path d='M" + c(p1) + " Q" + c(m) + " " + c(p2) + "' fill='none' stroke='#1e140c' stroke-width='.8' opacity='.22'/>";
      });
    }
    return s;
  }
  function bastone(d, w, col) {   // un osso lungo e sottile (costola, falange): il bordo scuro sotto, l'osso sopra, il riflesso
    return "<path d='" + d + "' fill='none' stroke='" + OSSO_LINEA + "' stroke-width='" + (w + 4) + "' stroke-linecap='round' stroke-linejoin='round'/>" +
      "<path d='" + d + "' fill='none' stroke='" + (col || "#e2d0a8") + "' stroke-width='" + w + "' stroke-linecap='round' stroke-linejoin='round'/>" +
      "<path d='" + d + "' fill='none' stroke='#fffaf0' stroke-width='" + Math.max(1.5, w * .25) + "' stroke-linecap='round' opacity='.45' transform='translate(-1.5,-1.5)'/>";
  }
  function dente(x, y, l, giu) { var t = giu ? y + l : y - l; return "<path d='M" + (x - l * .28).toFixed(1) + "," + y + " Q" + (x - l * .1).toFixed(1) + "," + ((y + t) / 2).toFixed(1) + " " + x + "," + t + " Q" + (x + l * .22).toFixed(1) + "," + ((y + t) / 2).toFixed(1) + " " + (x + l * .28).toFixed(1) + "," + y + " Z' fill='#fbf5e3' stroke='" + OSSO_LINEA + "' stroke-width='2' stroke-linejoin='round'/>"; }
  function vertebra(x, y, w, h, spina, p) {   // una vertebra col processo spinoso in alto
    var s = "";
    if (spina) s += osso("M" + (x - w * .18).toFixed(1) + "," + (y - h * .3).toFixed(1) + " L" + (x - w * .1).toFixed(1) + "," + (y - h * .5 - spina).toFixed(1) + " Q" + x + "," + (y - h * .58 - spina).toFixed(1) + " " + (x + w * .14).toFixed(1) + "," + (y - h * .48 - spina).toFixed(1) + " L" + (x + w * .2).toFixed(1) + "," + (y - h * .3).toFixed(1) + " Z", p, 3);
    s += osso("M" + (x - w / 2).toFixed(1) + "," + (y - h * .32).toFixed(1) + " Q" + x + "," + (y - h * .62).toFixed(1) + " " + (x + w / 2).toFixed(1) + "," + (y - h * .32).toFixed(1) + " L" + (x + w * .46).toFixed(1) + "," + (y + h * .38).toFixed(1) + " Q" + x + "," + (y + h * .6).toFixed(1) + " " + (x - w * .46).toFixed(1) + "," + (y + h * .38).toFixed(1) + " Z", p, 3);
    return s + "<ellipse cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' rx='" + (w * .16).toFixed(1) + "' ry='" + (h * .14).toFixed(1) + "' fill='#8a6a3e' opacity='.35'/>";
  }
  var ARTE = {
    teschio: function (p) {   // il cranio del T-rex, di profilo, a bocca un po' aperta
      var su = "M18,150 C18,132 42,120 72,114 C104,108 124,96 154,88 C188,78 216,58 252,52 C294,45 342,52 366,74 C392,98 398,136 382,164 C372,178 352,182 336,176 L300,166 C250,164 200,166 150,168 C100,170 62,172 36,170 C22,168 18,160 18,150 Z";
      var giu = "M42,196 C92,200 170,198 250,192 C300,188 340,192 362,206 C372,218 364,236 342,238 C292,244 222,242 152,234 C102,230 62,222 46,214 C36,208 36,200 42,196 Z";
      var s = "<ellipse cx='200' cy='262' rx='170' ry='14' fill='#000' opacity='.12'/>", i;
      [44, 66, 90, 114, 140, 166, 192, 218].forEach(function (x, k) { s += dente(x, 168, 26 - Math.abs(k - 2) * 2, true); });   // i denti di sopra
      [56, 80, 104, 128, 154, 180, 206, 232].forEach(function (x, k) { s += dente(x, 200, 20 - Math.abs(k - 2) * 1.6, false); });   // quelli di sotto
      s += osso(giu, p) + macchie(giu, p, 18, 40, 190, 370, 240, 11) + buco("M282,212 C292,204 312,204 322,212 C314,220 292,220 282,212 Z", p);
      s += osso(su, p) + macchie(su, p, 34, 18, 45, 398, 180, 7);
      s += osso("M236,58 L248,36 Q254,34 258,40 L262,56 Z", p, 3);   // il cornetto sopra l'occhio
      for (i = 0; i < 6; i++) s += "<ellipse cx='" + (88 + i * 16) + "' cy='" + (108 - i * 4) + "' rx='6' ry='3.4' fill='#c4ad80' stroke='" + OSSO_LINEA + "' stroke-width='1.2' opacity='.9'/>";   // le bozze del muso
      s += buco("M46,136 C52,126 70,124 78,130 C74,140 56,144 46,136 Z", p) +   // la narice
        buco("M152,126 C176,108 208,96 232,100 C238,124 226,148 204,158 C182,160 160,148 152,126 Z", p) +   // la grande finestra davanti all'occhio
        buco("M262,82 C276,80 284,94 282,108 C280,122 272,132 266,146 C262,132 252,120 250,106 C248,92 252,84 262,82 Z", p) +   // l'orbita a buco di serratura
        buco("M298,104 C318,94 344,104 352,122 C350,146 334,160 318,160 C302,148 296,124 298,104 Z", p) +
        buco("M308,74 C318,66 340,66 348,74 C338,82 318,82 308,74 Z", p);
      return s + riflesso("M40,128 C90,112 150,98 200,74 C240,58 300,52 352,68", 5, .5) + riflesso("M70,206 C140,212 230,208 330,214", 3, .35);
    },
    trex_torace: function (p) {   // la colonna con le costole e le braccine minuscole
      var s = "<ellipse cx='200' cy='288' rx='150' ry='10' fill='#000' opacity='.12'/>", i;
      for (i = 0; i < 7; i++) { var x = 66 + i * 44, l = 150 - i * 12; s += bastone("M" + x + ",86 C" + (x + 24) + "," + (100 + l * .3) + " " + (x + 14) + "," + (86 + l * .75) + " " + (x - 12) + "," + (86 + l), 10 - i * .5); }   // le costole, più corte verso la coda
      s += bastone("M50,232 C120,244 220,238 330,214", 5, "#d6c398") + bastone("M70,250 C140,258 200,256 260,246", 4, "#d6c398");   // le ossa della pancia
      for (i = 0; i < 9; i++) { var vx = 36 + i * 41, vy = 76 - Math.sin(i / 8 * Math.PI) * 14; s += vertebra(vx, vy, 34, 28, 30 - i * 1.8, p); }
      // la braccina (piccolissima!) con le due dita
      s += bastone("M176,196 L198,244", 11) + bastone("M198,244 L184,272", 9) + bastone("M184,272 L172,288", 4) + bastone("M186,274 L188,292", 4);
      s += "<path d='M168,286 Q164,296 172,298' fill='none' stroke='#3a2c1c' stroke-width='3' stroke-linecap='round'/><path d='M186,290 Q184,300 192,300' fill='none' stroke='#3a2c1c' stroke-width='3' stroke-linecap='round'/>";
      return s;
    },
    trex_zampa: function (p) {   // il bacino e la zampa possente con le tre dita
      var s = "<ellipse cx='170' cy='388' rx='120' ry='9' fill='#000' opacity='.12'/>";
      var ileo = "M10,72 C14,56 44,48 96,46 C150,36 232,38 278,52 C296,58 296,76 282,86 C264,96 228,98 198,98 C182,100 168,106 150,112 C132,106 118,100 100,98 C58,98 18,94 10,82 Z";   // l'ileo: lungo e basso
      s += osso("M118,108 C100,136 72,168 48,196 C32,206 28,222 44,228 C72,234 104,228 114,214 C106,206 94,204 84,202 C102,176 124,146 144,120 Z", p) +   // il pube, col grosso "stivale" in fondo
        osso("M176,114 C196,136 220,162 244,184 C254,194 244,208 232,200 C210,186 188,160 166,128 Z", p);   // l'ischio, sottile verso dietro
      s += osso(ileo, p) + macchie(ileo, p, 26, 12, 20, 296, 118, 21) + riflesso("M28,62 C80,48 170,40 266,54", 4, .5) +
        "<path d='M60,70 C110,62 190,60 250,70' fill='none' stroke='#8a6a3e' stroke-width='2' opacity='.35'/>";
      s += "<g transform='translate(300 0) scale(-1 1)'>";   // la gamba e il piede guardano avanti (a sinistra), come la testa
      var femore = "M134,112 C152,104 172,116 168,134 C166,170 160,200 160,226 C168,238 160,254 144,254 C128,254 120,240 130,228 C132,198 132,168 130,136 C122,126 124,114 134,112 Z";
      s += osso(femore, p) + macchie(femore, p, 10, 120, 104, 172, 254, 22) + riflesso("M140,132 C144,170 142,200 140,226", 3, .45);
      s += buco("M136,104 C146,96 162,98 166,106 C158,114 142,114 136,104 Z", p);   // l'incavo dell'anca
      s += bastone("M154,254 C150,280 154,304 160,326", 15) + bastone("M136,258 C134,284 138,304 146,322", 6, "#d6c398");   // tibia e fibula
      s += bastone("M156,330 C180,340 200,352 222,360", 11) + bastone("M152,334 C168,350 178,364 190,372", 10) + bastone("M160,326 C190,330 222,338 252,350", 9);   // le ossa del piede
      s += bastone("M222,360 L246,372", 7) + bastone("M190,372 L204,386", 7) + bastone("M252,350 L274,358", 7);   // le dita
      s += "<path d='M246,370 Q262,372 268,384 Q254,382 244,378 Z' fill='#4a3826'/><path d='M204,384 Q214,392 214,398 Q202,394 198,390 Z' fill='#4a3826'/><path d='M274,356 Q288,358 294,368 Q282,368 272,364 Z' fill='#4a3826'/></g>";   // gli artigli
      return s;
    },
    trex_coda: function (p) {   // la coda: vertebre sempre più piccole, con le "V" sotto
      var s = "<ellipse cx='250' cy='186' rx='230' ry='9' fill='#000' opacity='.12'/>", i;
      for (i = 0; i < 8; i++) { var x = 34 + i * 32, y = 84 - i * 2; s += bastone("M" + (x + 2) + "," + (y + 12) + " L" + (x + 12) + "," + (y + 58 - i * 5), 6 - i * .4, "#d6c398"); }   // le "V" sotto la coda
      for (i = 0; i < 14; i++) { var vx = 30 + i * 33, vy = 82 - i * 2.4 + Math.sin(i * .6) * 4, w = 32 - i * 1.5, h = 28 - i * 1.4; s += vertebra(vx, vy, w, h, i < 9 ? 22 - i * 2.2 : 0, p); }
      return s + riflesso("M20,62 C120,52 260,44 470,38", 3, .35);
    },
    // ---------------- la Preistoria ----------------
    freccia: function (p) {   // punta di freccia in selce: alette e codolo per legarla, il bordo seghettato, le scaglie oblique dei ritocchi
      var sx = [], dx = [];
      for (var i = 0; i <= 10; i++) { var a = curvaQ([50, 4], [15, 64], [9, 136], i / 10); sx.push(a); dx.push([100 - a[0], a[1]]); }
      var giro = [].concat(seghetta(sx, 2.2, 50), [[11, 158], [35, 146], [37, 150], [38, 178], [50, 187], [62, 178], [63, 150], [65, 146], [89, 158]], seghetta(dx.slice().reverse(), 2.2, 50));
      var f = percorso(giro);
      var s = "<defs><linearGradient id='" + p + "se' x1='0' y1='0' x2='.9' y2='1'><stop offset='0' stop-color='#b4ab9e'/><stop offset='.45' stop-color='#7d7366'/><stop offset='1' stop-color='#3f3731'/></linearGradient><clipPath id='" + p + "fc'><path d='" + f + "'/></clipPath></defs>";
      s += "<ellipse cx='50' cy='193' rx='32' ry='5' fill='#000' opacity='.15'/><path d='" + f + "' fill='url(#" + p + "se)'/><g clip-path='url(#" + p + "fc)'>";
      s += scaglie(sx, function (y) { return 50; }, 12, 150, 11) + scaglie(dx, function (y) { return 50; }, 12, 150, 23);
      s += "<path d='M50,12 L50,148' stroke='#efe8dc' stroke-width='2' opacity='.35'/><path d='M38,150 L62,150' stroke='#2e2722' stroke-width='1.2' opacity='.35'/>";   // la costola in mezzo e l'attacco del codolo
      s += "<path d='M44,152 C42,162 44,172 48,182 M56,152 C58,162 56,172 52,182' fill='none' stroke='#2e2722' stroke-width='1' opacity='.3'/>";
      s += "<path d='" + f + "' fill='none' stroke='#f2ece0' stroke-width='3' opacity='.3'/></g>";   // il filo traslucido
      s += "<path d='" + f + "' fill='none' stroke='#2e2722' stroke-width='2.4' stroke-linejoin='round'/>";
      return s + "<path d='M45,26 C40,50 32,80 24,108' fill='none' stroke='#fff' stroke-width='3' stroke-linecap='round' opacity='.35'/>";
    },
    amigdala: function (p) {   // l'amigdala, l'ascia a mano: a forma di mandorla, scheggiata a grandi scaglie su tutti e due i lati, la base ancora grezza
      var sx = [], dx = [], i;
      for (i = 0; i <= 5; i++) sx.push(curvaQ([100, 6], [60, 40], [40, 122], i / 5));
      for (i = 1; i <= 4; i++) sx.push(curvaQ([40, 122], [44, 188], [100, 195], i / 4));
      for (i = 0; i <= 5; i++) dx.push(curvaQ([100, 6], [142, 42], [160, 124], i / 5));
      for (i = 1; i <= 4; i++) dx.push(curvaQ([160, 124], [158, 188], [100, 195], i / 4));
      var cresta = function (y) { return 100 + 7 * Math.sin(y / 19) + 3 * Math.sin(y / 7); };
      var giro = [].concat(seghetta(sx, 2.6, cresta), seghetta(dx.slice().reverse(), 2.6, cresta).slice(1));
      var f = percorso(giro);
      var s = "<defs><linearGradient id='" + p + "am' x1='0' y1='0' x2='.8' y2='1'><stop offset='0' stop-color='#d9bd92'/><stop offset='.5' stop-color='#9d7b52'/><stop offset='1' stop-color='#5c4430'/></linearGradient>" +
        "<radialGradient id='" + p + "cx' cx='.5' cy='1' r='.7'><stop offset='0' stop-color='#e9dec4'/><stop offset='.7' stop-color='#ddd0b0' stop-opacity='.85'/><stop offset='1' stop-color='#ddd0b0' stop-opacity='0'/></radialGradient><clipPath id='" + p + "ac'><path d='" + f + "'/></clipPath></defs>";
      s += "<ellipse cx='100' cy='196' rx='58' ry='5' fill='#000' opacity='.15'/><path d='" + f + "' fill='url(#" + p + "am)'/><g clip-path='url(#" + p + "ac)'>";
      s += scaglie(sx.slice(0, 9), cresta, 16, 176, 37) + scaglie(dx.slice(0, 9), cresta, 16, 176, 53);
      s += "<path d='M50,168 C62,158 80,166 96,160 C112,154 132,164 152,160 L160,200 L40,200 Z' fill='url(#" + p + "cx)'/>";   // la parte grezza, dove si teneva in mano
      var r = rnd(61); for (i = 0; i < 30; i++) s += "<circle cx='" + (60 + r() * 80).toFixed(1) + "' cy='" + (172 + r() * 22).toFixed(1) + "' r='" + (.7 + r() * 1.5).toFixed(1) + "' fill='#8a7458' opacity='.55'/>";
      s += "<path d='" + f + "' fill='none' stroke='#fff3dc' stroke-width='3' opacity='.25'/></g>";
      s += "<path d='" + f + "' fill='none' stroke='#3b2a1a' stroke-width='2.6' stroke-linejoin='round'/>";
      return s + "<path d='M90,26 C76,50 64,80 56,108' fill='none' stroke='#fff' stroke-width='4' stroke-linecap='round' opacity='.3'/>";
    },
    dente: function (p) {   // il molare di mammut, un "mattone" visto un po' dall'alto: sopra la suola di lamine di smalto (la grattugia per l'erba), sul fianco le piastre che finiscono a onde
      var X0 = 22, X1 = 178, Y0 = 38, Y1 = 98, RR = 24, N = 12, i, f2 = function (n) { return n.toFixed(1); };
      var sopra = "M" + (X0 + RR) + "," + Y0 + " L" + (X1 - RR) + "," + Y0 + " Q" + X1 + "," + Y0 + " " + X1 + "," + (Y0 + RR) + " L" + X1 + "," + (Y1 - RR) + " Q" + X1 + "," + Y1 + " " + (X1 - RR) + "," + Y1 + " L" + (X0 + RR) + "," + Y1 + " Q" + X0 + "," + Y1 + " " + X0 + "," + (Y1 - RR) + " L" + X0 + "," + (Y0 + RR) + " Q" + X0 + "," + Y0 + " " + (X0 + RR) + "," + Y0 + " Z";
      var passo = (X1 - X0 - 16) / N, corpo = "M" + X0 + "," + (Y0 + RR) + " L" + (X0 + 4) + ",142";
      for (i = 0; i < N; i++) { var xa = X0 + 8 + i * passo, ya = 150 + 6 * Math.sin(i * 1.7); corpo += " Q" + f2(xa + passo / 2) + "," + f2(ya + 12) + " " + f2(xa + passo) + "," + f2(ya); }   // il fondo a onde: ogni piastra finisce con la sua punta
      corpo += " L" + (X1 - 4) + ",142 L" + X1 + "," + (Y0 + RR) + " Z";
      var s = "<defs><linearGradient id='" + p + "fi' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a08058'/><stop offset='1' stop-color='#4f3a26'/></linearGradient>" +
        "<linearGradient id='" + p + "su' x1='0' y1='0' x2='.3' y2='1'><stop offset='0' stop-color='#c2a174'/><stop offset='1' stop-color='#8e6d45'/></linearGradient>" +
        "<clipPath id='" + p + "dc'><path d='" + corpo + "'/></clipPath><clipPath id='" + p + "sc'><path d='" + sopra + "'/></clipPath></defs>";
      s += "<ellipse cx='100' cy='184' rx='80' ry='7' fill='#000' opacity='.15'/><g transform='rotate(-5 100 100)'>";
      s += "<path d='" + corpo + "' fill='url(#" + p + "fi)'/><g clip-path='url(#" + p + "dc)'>";
      for (i = 0; i <= N; i++) {   // le piastre sul fianco, chiare e scure alternate
        var x = X0 + 8 + i * passo, bend = (x - 100) * .05;
        if (i < N && i % 2 === 0) s += "<path d='M" + f2(x) + ",90 Q" + f2(x + bend) + ",130 " + f2(x) + ",170 L" + f2(x + passo) + ",170 Q" + f2(x + passo + bend) + ",130 " + f2(x + passo) + ",90 Z' fill='#f3e3c0' opacity='.13'/>";
        s += "<path d='M" + f2(x) + ",90 Q" + f2(x + bend) + ",130 " + f2(x) + ",170' fill='none' stroke='#2e2014' stroke-width='1.3' opacity='.45'/>";
      }
      s += macchie(corpo, p, 14, X0, 100, X1, 165, 31) + "<path d='M28,104 L30,140' stroke='#fff3dc' stroke-width='3' opacity='.25' stroke-linecap='round'/></g>";
      s += "<path d='" + corpo + "' fill='none' stroke='" + OSSO_LINEA + "' stroke-width='2.8' stroke-linejoin='round'/>";
      s += "<path d='" + sopra + "' fill='url(#" + p + "su)'/><g clip-path='url(#" + p + "sc)'>";   // la superficie che macina
      for (i = 0; i < N; i++) {   // le lamine: anelli di smalto chiaro, ondulati, con la dentina scura dentro, da un bordo all'altro
        var cx = X0 + 8 + (i + .5) * passo, w = passo * .3, t = Y0 + 4, b = Y1 - 4, k, sxp = "", dxp = "";
        for (k = 0; k <= 10; k++) { var yy = t + (b - t) * k / 10, ond = (k % 2 ? .75 : -.75); sxp += (k ? " L" : "M") + f2(cx - w + ond) + "," + f2(yy); dxp = " L" + f2(cx + w - ond) + "," + f2(yy) + dxp; }
        s += "<path d='" + sxp + dxp + " Z' fill='#4a301a' stroke='#f6ead0' stroke-width='2' stroke-linejoin='round'/>";
      }
      s += "</g><path d='" + sopra + "' fill='none' stroke='" + OSSO_LINEA + "' stroke-width='2.8'/>";
      s += "<path d='M" + (X0 + RR) + "," + (Y0 + 3) + " L" + (X1 - RR) + "," + (Y0 + 3) + "' stroke='#fff8e6' stroke-width='2.5' stroke-linecap='round' opacity='.45'/>";
      return s + "</g>";
    },
    ammonite: function (p) {   // l'ammonite: la spirale coi giri sempre più piccoli, le costole, il riflesso di madreperla
      var s = "<defs><radialGradient id='" + p + "an' cx='.45' cy='.45' r='.65'><stop offset='0' stop-color='#f1d3a0'/><stop offset='.7' stop-color='#c58a4c'/><stop offset='1' stop-color='#8a5426'/></radialGradient>" +
        "<linearGradient id='" + p + "mp' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ffb3d9' stop-opacity='.35'/><stop offset='.35' stop-color='#b3ffe0' stop-opacity='.2'/><stop offset='.65' stop-color='#a5c8ff' stop-opacity='.25'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></linearGradient></defs>";
      s += "<ellipse cx='100' cy='192' rx='70' ry='6' fill='#000' opacity='.15'/>";
      var C = [], k, j, R0 = 88;
      for (k = 0; k < 6; k++) { var f = 1 - Math.pow(.6, k); C.push({ x: 100 + 10 * f, y: 100 - 7 * f, r: R0 * Math.pow(.6, k) }); }
      for (k = 0; k < 5; k++) {   // un giro alla volta, dal più grande
        var a = C[k], b = C[k + 1], n = 26 - k * 3;
        s += "<circle cx='" + a.x.toFixed(1) + "' cy='" + a.y.toFixed(1) + "' r='" + a.r.toFixed(1) + "' fill='url(#" + p + "an)' stroke='#4a2e14' stroke-width='" + (3 - k * .35).toFixed(1) + "'/>";
        for (j = 0; j < n; j++) {
          var an = j / n * 6.283, i1 = { x: b.x + b.r * Math.cos(an), y: b.y + b.r * Math.sin(an) }, o1 = { x: a.x + a.r * .97 * Math.cos(an + .14), y: a.y + a.r * .97 * Math.sin(an + .14) }, mm = { x: (i1.x + o1.x) / 2 + Math.cos(an + 1.6) * a.r * .05, y: (i1.y + o1.y) / 2 + Math.sin(an + 1.6) * a.r * .05 };
          s += "<path d='M" + i1.x.toFixed(1) + "," + i1.y.toFixed(1) + " Q" + mm.x.toFixed(1) + "," + mm.y.toFixed(1) + " " + o1.x.toFixed(1) + "," + o1.y.toFixed(1) + "' fill='none' stroke='#5a3518' stroke-width='" + (2.4 - k * .3).toFixed(1) + "' opacity='.5' stroke-linecap='round'/>";
        }
      }
      s += "<circle cx='" + C[5].x.toFixed(1) + "' cy='" + C[5].y.toFixed(1) + "' r='" + C[5].r.toFixed(1) + "' fill='#5a3518'/>";   // il centro

      s += "<circle cx='100' cy='100' r='88' fill='url(#" + p + "mp)'/>";   // la madreperla
      return s + riflesso("M36,72 C46,44 70,24 100,18", 5, .5) + "<circle cx='60' cy='46' r='4' fill='#fff' opacity='.55'/>";
    },
    zanna: function (p) {   // la zanna di mammut: l'avorio lungo e curvo, le venature, la base spezzata con gli anelli
      var f = "M24,112 C90,96 190,104 270,84 C320,70 356,46 382,16 C388,10 394,14 390,22 C368,58 330,96 280,120 C200,152 100,164 30,160 C18,150 16,124 24,112 Z";
      var s = "<defs><linearGradient id='" + p + "zv' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#c49c64'/><stop offset='.35' stop-color='#ead8b0'/><stop offset='.8' stop-color='#f7edd6'/><stop offset='1' stop-color='#fffaf0'/></linearGradient>" +
        "<linearGradient id='" + p + "zo' x1='0' y1='0' x2='0' y2='1'><stop offset='.45' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.25'/></linearGradient><clipPath id='" + p + "zc'><path d='" + f + "'/></clipPath></defs>";
      s += "<ellipse cx='200' cy='184' rx='170' ry='8' fill='#000' opacity='.15'/>";
      s += "<path d='" + f + "' fill='url(#" + p + "zv)'/><g clip-path='url(#" + p + "zc)'><rect x='0' y='0' width='400' height='200' fill='url(#" + p + "zo)'/>";
      ["M26,124 C100,112 196,116 272,96 C320,82 354,56 382,22", "M28,138 C104,128 200,130 276,108 C322,92 356,64 384,30", "M30,150 C110,144 204,142 278,118"].forEach(function (d) { s += "<path d='" + d + "' fill='none' stroke='#8a6a3e' stroke-width='1.4' opacity='.45'/>"; });   // le venature dell'avorio
      s += macchie(f, p, 30, 18, 100, 160, 165, 41);
      ["M70,108 l5,10 l-4,8 l6,12", "M140,104 l-3,12 l5,9", "M210,98 l4,9 l-3,8"].forEach(function (d) { s += "<path d='" + d + "' fill='none' stroke='#4a3420' stroke-width='1.5' opacity='.6'/>"; });   // le crepe dell'avorio
      s += "</g><path d='" + f + "' fill='none' stroke='" + OSSO_LINEA + "' stroke-width='3' stroke-linejoin='round'/>";
      s += "<ellipse cx='25' cy='136' rx='10' ry='24' fill='#d8c39a' stroke='" + OSSO_LINEA + "' stroke-width='2.5'/><ellipse cx='25' cy='136' rx='6.5' ry='16' fill='none' stroke='#a8875a' stroke-width='1.4'/><ellipse cx='25' cy='136' rx='3.5' ry='8' fill='#6b5030'/>";   // la base spezzata: gli anelli di crescita
      return s + riflesso("M60,104 C140,98 220,98 290,76 C330,62 360,40 380,18", 3.5, .55);
    },
    ambra: function (p) {   // l'ambra con dentro la zanzara: dorata, trasparente, con le bollicine e il riflesso
      var f = "M38,98 C30,62 58,30 98,26 C140,22 172,48 176,86 C182,126 160,166 116,174 C74,182 44,150 38,98 Z";
      var s = "<defs><radialGradient id='" + p + "ab' cx='.45' cy='.4' r='.7'><stop offset='0' stop-color='#ffe6a8'/><stop offset='.45' stop-color='#f6a93a'/><stop offset='.82' stop-color='#c2620f'/><stop offset='1' stop-color='#7a3a08'/></radialGradient>" +
        "<radialGradient id='" + p + "al' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='#fff6cf' stop-opacity='.55'/><stop offset='1' stop-color='#fff6cf' stop-opacity='0'/></radialGradient><clipPath id='" + p + "ac'><path d='" + f + "'/></clipPath></defs>";
      s += "<ellipse cx='108' cy='186' rx='66' ry='6' fill='#000' opacity='.15'/>";
      s += "<path d='" + f + "' fill='url(#" + p + "ab)'/><g clip-path='url(#" + p + "ac)'><ellipse cx='104' cy='96' rx='50' ry='44' fill='url(#" + p + "al)'/>";
      var I = "rgba(58,26,6,.85)";   // la zanzara
      s += "<g stroke='" + I + "' stroke-width='1.3' fill='none' stroke-linecap='round'><path d='M98,104 L82,122 L74,138'/><path d='M104,106 L100,128 L96,146'/><path d='M110,106 L120,126 L126,142'/><path d='M96,98 L78,94 L64,104'/><path d='M100,96 L92,80 L80,72'/><path d='M108,98 L122,84 L134,80'/></g>";
      s += "<ellipse cx='94' cy='80' rx='16' ry='6' transform='rotate(-30 94 80)' fill='#fff8e0' opacity='.35' stroke='" + I + "' stroke-width='.8'/><ellipse cx='114' cy='80' rx='16' ry='6' transform='rotate(25 114 80)' fill='#fff8e0' opacity='.35' stroke='" + I + "' stroke-width='.8'/>";   // le ali
      for (var sg = 0; sg < 6; sg++) s += "<ellipse cx='" + (113 + sg * 5.2).toFixed(1) + "' cy='" + (103 + sg * 2.4).toFixed(1) + "' rx='4' ry='" + (4.4 - sg * .45).toFixed(1) + "' transform='rotate(25 " + (113 + sg * 5.2).toFixed(1) + " " + (103 + sg * 2.4).toFixed(1) + ")' fill='" + I + "' stroke='#f6a93a' stroke-width='.6'/>";   // la pancia a anelli
      s += "<path d='M89,91 C82,84 76,80 68,79' stroke='" + I + "' stroke-width='.9' fill='none'/><path d='M90,90 C87,81 84,75 78,69' stroke='" + I + "' stroke-width='.9' fill='none'/>" + "<ellipse cx='104' cy='98' rx='9' ry='7' fill='" + I + "'/><circle cx='91' cy='94' r='5' fill='" + I + "'/><path d='M87,94 L68,98' stroke='" + I + "' stroke-width='1.4'/>";
      [[60, 128, 4], [140, 60, 3], [150, 132, 5], [72, 66, 2.5], [130, 150, 2]].forEach(function (b) { s += "<circle cx='" + b[0] + "' cy='" + b[1] + "' r='" + b[2] + "' fill='none' stroke='#fff6cf' stroke-width='1.2' opacity='.7'/><circle cx='" + (b[0] - b[2] * .35) + "' cy='" + (b[1] - b[2] * .35) + "' r='" + (b[2] * .3) + "' fill='#fff' opacity='.8'/>"; });   // le bollicine
      s += "</g><path d='" + f + "' fill='none' stroke='#7a3a08' stroke-width='2.5'/>";
      return s + "<path d='M54,84 C58,62 76,46 98,42' fill='none' stroke='#fff' stroke-width='6' stroke-linecap='round' opacity='.6'/><circle cx='112' cy='40' r='4' fill='#fff' opacity='.7'/><path d='M150,150 C162,136 168,120 168,104' fill='none' stroke='#ffe6a8' stroke-width='3' stroke-linecap='round' opacity='.4'/>";
    },
    pittura: function (p) {   // la pittura delle caverne: il bisonte rosso, i cacciatori con le lance, l'impronta della mano
      var f = "M14,40 L46,16 L120,10 L196,18 L262,12 L290,44 L286,120 L292,170 L248,190 L160,186 L84,192 L24,180 L8,128 Z";
      var s = "<defs><linearGradient id='" + p + "pr' x1='0' y1='0' x2='.6' y2='1'><stop offset='0' stop-color='#e2d2b2'/><stop offset='1' stop-color='#b49a74'/></linearGradient>" +
        "<radialGradient id='" + p + "sp' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='#b3412a' stop-opacity='.8'/><stop offset='.7' stop-color='#b3412a' stop-opacity='.45'/><stop offset='1' stop-color='#b3412a' stop-opacity='0'/></radialGradient><clipPath id='" + p + "pc'><path d='" + f + "'/></clipPath></defs>";
      s += "<ellipse cx='150' cy='194' rx='130' ry='6' fill='#000' opacity='.18'/>";
      s += "<path d='" + f + "' fill='url(#" + p + "pr)'/><g clip-path='url(#" + p + "pc)'>";
      var r = rnd(97); for (var i = 0; i < 60; i++) s += "<circle cx='" + (r() * 300).toFixed(1) + "' cy='" + (r() * 200).toFixed(1) + "' r='" + (r() * 2.2 + .5).toFixed(1) + "' fill='#7d6548' opacity='" + (.15 + r() * .25).toFixed(2) + "'/>";
      // l'impronta della mano (al negativo: il colore soffiato tutto intorno)
      s += "<circle cx='60' cy='74' r='40' fill='url(#" + p + "sp)'/><g fill='#ddcba8'><ellipse cx='60' cy='88' rx='15' ry='17'/><rect x='44' y='50' width='7' height='26' rx='3.5' transform='rotate(-18 47 70)'/><rect x='53' y='44' width='7' height='30' rx='3.5' transform='rotate(-5 56 70)'/><rect x='62' y='46' width='7' height='29' rx='3.5' transform='rotate(6 65 70)'/><rect x='70' y='52' width='7' height='24' rx='3.5' transform='rotate(16 73 72)'/><rect x='72' y='80' width='7' height='20' rx='3.5' transform='rotate(55 75 90)'/></g>";
      // il bisonte, col contorno a carboncino
      var bis = "M138,118 C130,104 136,88 150,84 C160,72 182,64 204,68 C228,72 246,86 252,104 C256,118 252,132 244,138 L242,160 L234,160 L232,142 C220,146 204,146 192,144 L188,162 L180,162 L178,142 C168,140 158,138 152,134 L148,154 L140,154 L144,130 C140,126 138,122 138,118 Z";
      s += "<path d='" + bis + "' fill='#b3412a' opacity='.82'/><path d='M140,112 C130,108 120,114 118,124 C116,134 124,142 134,140 C142,138 146,130 146,122 Z' fill='#8e2f1c' opacity='.9'/>";
      s += "<g fill='none' stroke='#21140c' stroke-linecap='round' stroke-linejoin='round'><path d='M150,84 C160,72 182,64 204,68 C228,72 246,86 252,104 C256,118 252,132 244,138' stroke-width='3.2'/><path d='M152,134 C166,142 196,146 232,142' stroke-width='2'/><path d='M126,110 C120,100 126,92 134,94' stroke-width='2.4'/><path d='M118,124 C116,134 124,142 134,140' stroke-width='2.2'/><path d='M244,138 L242,160 M232,142 L234,160 M188,146 L188,162 M178,142 L180,162 M148,136 L148,154 M144,130 L140,154' stroke-width='2'/><path d='M252,104 C262,108 266,118 262,126' stroke-width='1.8'/></g>";
      s += "<circle cx='131' cy='120' r='1.8' fill='#21140c'/>";
      // due cacciatori con le lance
      [[64, 150], [92, 158]].forEach(function (h) { var x = h[0], y = h[1]; s += "<g stroke='#21140c' stroke-width='2.4' stroke-linecap='round' fill='none'><circle cx='" + x + "' cy='" + (y - 24) + "' r='4' fill='#21140c'/><path d='M" + x + "," + (y - 20) + " L" + (x + 2) + "," + (y - 4) + " M" + (x + 2) + "," + (y - 4) + " L" + (x - 4) + "," + (y + 10) + " M" + (x + 2) + "," + (y - 4) + " L" + (x + 8) + "," + (y + 10) + " M" + (x + 1) + "," + (y - 15) + " L" + (x + 10) + "," + (y - 18) + "'/><path d='M" + (x - 4) + "," + (y - 10) + " L" + (x + 34) + "," + (y - 26) + "' stroke='#7a2a18'/></g>"; });
      for (i = 0; i < 6; i++) s += "<circle cx='" + (214 + i * 11) + "' cy='" + (38 + (i % 2) * 6) + "' r='3.4' fill='#b3412a' opacity='.8'/>";   // i puntini, un segno misterioso
      s += "<path d='M196,18 l-6,20 l8,14 l-4,18' fill='none' stroke='#6b5638' stroke-width='1.6' opacity='.6'/><path d='M84,192 l6,-16 l-5,-10' fill='none' stroke='#6b5638' stroke-width='1.6' opacity='.6'/>";   // le crepe della roccia
      s += "</g><path d='" + f + "' fill='none' stroke='#5a4630' stroke-width='3' stroke-linejoin='round'/>";
      return s + "<path d='" + f + "' fill='none' stroke='#fff8e6' stroke-width='1.5' opacity='.35' transform='translate(1.5,1.5)'/>";
    },
    trex: function (p) {   // lo scheletro intero, montato sul piedistallo del museo (600×360)
      function pezzo(id, tx, ty, k) { return "<g transform='translate(" + tx + " " + ty + ") scale(" + k + ")'>" + ARTE[id](p) + "</g>"; }
      var s = "<rect x='40' y='326' width='520' height='22' rx='6' fill='#8a6a46' stroke='#4a3420' stroke-width='3'/><rect x='60' y='320' width='480' height='10' rx='4' fill='#a8865a'/>" +
        "<path d='M230,322 L232,150 M380,322 L378,120' stroke='#6b7280' stroke-width='5'/><path d='M230,322 L232,150 M380,322 L378,120' stroke='#cbd2d9' stroke-width='2'/>";
      return s + pezzo("trex_coda", 336, 54, .54) + pezzo("trex_torace", 128, 60, .6) + pezzo("trex_zampa", 288, 92, .6) + pezzo("teschio", 0, 44, .46);
    }
  };
  var ARTE_VB = { teschio: [400, 300], trex_torace: [400, 300], trex_zampa: [300, 400], trex_coda: [500, 200], trex: [600, 360],
    freccia: [100, 200], amigdala: [200, 200], dente: [200, 200], ammonite: [200, 200], zanna: [400, 200], ambra: [200, 200], pittura: [300, 200] };
  function crepeSvg(w, h, integro) {   // le crepe sul disegno (più crepe = meno intatto): sottili, frastagliate, con un ramo; il chiaro sotto fa la profondità
    if (integro == null || integro >= 100) return "";
    var s = "", n = Math.ceil((100 - integro) / 15), k = Math.min(w, h) / 40;
    function ramo(x, y, a, passi, q, z) {
      var d = "M" + x.toFixed(1) + "," + y.toFixed(1);
      for (var j = 1; j <= passi; j++) { var an = a + (seme01(q * 7 + j + z, 13) - .5) * 1.3, l = (2.5 + 3 * seme01(q * 5 + j + z, 17)) * k; x += Math.cos(an) * l; y += Math.sin(an) * l; d += " L" + x.toFixed(1) + "," + y.toFixed(1); }
      return d;
    }
    for (var q = 0; q < n; q++) {
      var cx = w * (.3 + .4 * seme01(q, 3)), cy = h * (.25 + .5 * seme01(q, 7)), a = seme01(q, 11) * 6.283;
      var d = ramo(cx, cy, a, 5, q, 0) + " " + ramo(cx, cy, a + Math.PI, 3, q, 20) + " " + ramo(cx + Math.cos(a) * 6 * k, cy + Math.sin(a) * 6 * k, a + .9, 2, q, 40);
      s += "<path d='" + d + "' fill='none' stroke='#fff6e0' stroke-width='" + (.7 * k).toFixed(1) + "' opacity='.35' stroke-linejoin='round' stroke-linecap='round' transform='translate(" + (.5 * k).toFixed(1) + "," + (.5 * k).toFixed(1) + ")'/>" +
        "<path d='" + d + "' fill='none' stroke='#1a0e06' stroke-width='" + (.75 * k).toFixed(1) + "' opacity='.8' stroke-linejoin='round' stroke-linecap='round'/>";
    }
    return s;
  }
  var nArte = 0;
  function svgArte(id, integro, ombra) {
    var vb = ARTE_VB[id], p = "sva" + (++nArte) + "_", sil = ombra ? "<filter id='" + p + "sil'><feFlood flood-color='#3a2a1c' flood-opacity='.5'/><feComposite in2='SourceAlpha' operator='in'/></filter>" : "";
    var crepe = ombra ? "" : crepeSvg(vb[0], vb[1], integro), maschera = "";
    if (crepe) {   // le crepe stanno solo sul reperto: la maschera è il disegno stesso, tutto bianco
      var pm = p + "m";
      maschera = defsOsso(pm) + "<filter id='" + p + "bi'><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><mask id='" + p + "cm'><g filter='url(#" + p + "bi)'>" + ARTE[id](pm) + "</g></mask>";
      crepe = "<g mask='url(#" + p + "cm)'>" + crepe + "</g>";
    }
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + vb[0] + " " + vb[1] + "' width='" + vb[0] + "' height='" + vb[1] + "'><defs>" + defsOsso(p) + sil + maschera + "</defs>" +
      (ombra ? "<g filter='url(#" + p + "sil)'>" + ARTE[id](p) + "</g>" : ARTE[id](p) + crepe) + "</svg>";
  }
  var cacheArte = {};
  function immagineArte(id) {   // per la fossa: il disegno intero (le crepe le fa il canvas sopra)
    if (!cacheArte[id]) { var im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgArte(id, 100, false)); cacheArte[id] = im; }
    return cacheArte[id];
  }

  // ---------- il disegno dei reperti (per la fossa, la carta e il museo): x,y,w,h = il riquadro; integro = le crepe ----------
  function seme01(i, k) { var s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }
  function disegnaReperto(c, id, x, y, w, h, integro, ombra) {
    if (ARTE[id] && !ombra) {   // i reperti col disegno nuovo: l'immagine, e sopra le crepe
      var im = immagineArte(id); if (im.complete && im.naturalWidth) c.drawImage(im, x, y, w, h);
      if (integro != null && integro < 100) { c.save(); c.translate(x, y); c.strokeStyle = "rgba(20,10,5,.85)"; c.lineWidth = 1.6; var nc = Math.ceil((100 - integro) / 15), kc = Math.min(w, h) / 40; for (var qc = 0; qc < nc; qc++) { var xc = w * (.25 + .5 * seme01(qc, 3)), yc = h * (.2 + .6 * seme01(qc, 7)); c.beginPath(); c.moveTo(xc, yc); c.lineTo(xc + 6 * kc, yc + 5 * kc); c.lineTo(xc + 3 * kc, yc + 10 * kc); c.lineTo(xc + 8 * kc, yc + 15 * kc); c.stroke(); } c.restore(); }
      return;
    }
    c.save(); c.translate(x, y); c.lineJoin = "round"; c.lineCap = "round";
    var S = function (f, s, lw) { c.fillStyle = ombra ? "rgba(30,20,12,.55)" : f; c.strokeStyle = ombra ? "rgba(30,20,12,.7)" : s; c.lineWidth = lw || 2; };
    function forma(fn) { c.beginPath(); fn(); c.fill(); c.stroke(); }
    var g;
    if (id === "anfora") {
      S("#c8673a", "#6b2f14");
      forma(function () { c.ellipse(w / 2, h * .55, w * .42, h * .33, 0, 0, 6.29); });
      forma(function () { c.rect(w * .38, h * .08, w * .24, h * .2); });
      c.lineWidth = Math.max(3, w * .05); c.beginPath(); c.moveTo(w * .38, h * .14); c.quadraticCurveTo(w * .12, h * .15, w * .2, h * .36); c.moveTo(w * .62, h * .14); c.quadraticCurveTo(w * .88, h * .15, w * .8, h * .36); c.stroke(); c.lineWidth = 2;
      forma(function () { c.moveTo(w * .42, h * .86); c.lineTo(w / 2, h * .97); c.lineTo(w * .58, h * .86); });
      if (!ombra) { c.fillStyle = "#2b1a10"; c.fillRect(w * .12, h * .5, w * .76, h * .05); c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.ellipse(w * .35, h * .42, w * .06, h * .12, 0, 0, 6.29); c.fill(); }
    } else if (id === "gatto") {
      S("#2d2a35", "#0f0d14");
      forma(function () { c.moveTo(w * .25, h * .98); c.quadraticCurveTo(w * .1, h * .55, w * .35, h * .38); c.lineTo(w * .3, h * .05); c.lineTo(w * .45, h * .2); c.lineTo(w * .6, h * .05); c.lineTo(w * .58, h * .38); c.quadraticCurveTo(w * .95, h * .6, w * .85, h * .98); c.closePath(); });
      if (!ombra) { c.fillStyle = "#e6b84a"; c.beginPath(); c.arc(w * .38, h * .28, Math.max(1.5, w * .04), 0, 6.29); c.arc(w * .52, h * .28, Math.max(1.5, w * .04), 0, 6.29); c.fill(); c.strokeStyle = "#e6b84a"; c.lineWidth = Math.max(2, w * .05); c.beginPath(); c.moveTo(w * .32, h * .45); c.quadraticCurveTo(w * .47, h * .52, w * .62, h * .45); c.stroke(); c.beginPath(); c.arc(w * .6, h * .12, w * .05, 0, 6.29); c.stroke(); }
    } else if (id === "moneta" || id === "civetta") {
      S(id === "civetta" ? "#d8dbe0" : "#c9ccd2", "#6c7078");
      forma(function () { c.arc(w / 2, h / 2, Math.min(w, h) * .38, 0, 6.29); });
      if (!ombra) {
        c.lineWidth = 1; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) * .28, 0, 6.29); c.stroke();
        c.fillStyle = "#7d828b";
        if (id === "civetta") { c.beginPath(); c.ellipse(w / 2, h * .54, w * .1, h * .13, 0, 0, 6.29); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(w * .46, h * .48, w * .03, 0, 6.29); c.arc(w * .54, h * .48, w * .03, 0, 6.29); c.fill(); }
        else { c.beginPath(); c.arc(w * .47, h * .45, w * .1, 0, 6.29); c.fill(); }
      }
    } else if (id === "coccio") {
      S("#c8673a", "#6b2f14");
      forma(function () { c.moveTo(w * .08, h * .3); c.lineTo(w * .55, h * .12); c.lineTo(w * .92, h * .38); c.lineTo(w * .7, h * .88); c.lineTo(w * .42, h * .7); c.lineTo(w * .18, h * .86); c.closePath(); });
      if (!ombra) { c.strokeStyle = "#2b1a10"; c.lineWidth = Math.max(2, h * .06); c.beginPath(); c.moveTo(w * .2, h * .45); c.quadraticCurveTo(w * .5, h * .3, w * .8, h * .5); c.stroke(); }
    } else if (id === "chiodo") {
      S("#8a4b25", "#4a240f");
      forma(function () { c.ellipse(w / 2, h * .1, w * .3, h * .06, 0, 0, 6.29); });
      forma(function () { c.moveTo(w * .42, h * .14); c.lineTo(w * .58, h * .14); c.lineTo(w * .54, h * .82); c.lineTo(w / 2, h * .96); c.lineTo(w * .46, h * .82); c.closePath(); });
      if (!ombra) { c.fillStyle = "#b8662f"; c.beginPath(); c.arc(w * .5, h * .4, w * .06, 0, 6.29); c.arc(w * .52, h * .62, w * .05, 0, 6.29); c.fill(); }
    } else if (id === "maschera") {
      if (!ombra) { g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffe9a0"); g.addColorStop(.5, "#e2b13a"); g.addColorStop(1, "#a8761a"); }
      S("#1f4f9a", "#14233d");
      forma(function () { c.moveTo(w * .05, h * .2); c.lineTo(w * .3, h * .05); c.lineTo(w * .7, h * .05); c.lineTo(w * .95, h * .2); c.lineTo(w * .88, h * .62); c.lineTo(w * .12, h * .62); c.closePath(); });
      if (!ombra) { c.strokeStyle = "#e2b13a"; c.lineWidth = Math.max(2, w * .025); for (var sr = 0; sr < 5; sr++) { c.beginPath(); c.moveTo(w * (.1 + sr * .04), h * (.25 + sr * .04)); c.lineTo(w * (.18 + sr * .04), h * .6); c.moveTo(w * (.9 - sr * .04), h * (.25 + sr * .04)); c.lineTo(w * (.82 - sr * .04), h * .6); c.stroke(); } }
      c.fillStyle = ombra ? "rgba(30,20,12,.55)" : g; c.strokeStyle = ombra ? "rgba(30,20,12,.7)" : "#6e4a0c"; c.lineWidth = 2;
      forma(function () { c.ellipse(w / 2, h * .42, w * .26, h * .32, 0, 0, 6.29); });
      forma(function () { c.moveTo(w * .44, h * .7); c.lineTo(w * .56, h * .7); c.lineTo(w * .53, h * .98); c.lineTo(w * .47, h * .98); c.closePath(); });
      if (!ombra) { c.fillStyle = "#14233d"; c.beginPath(); c.ellipse(w * .4, h * .36, w * .06, h * .03, 0, 0, 6.29); c.ellipse(w * .6, h * .36, w * .06, h * .03, 0, 0, 6.29); c.fill(); c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.ellipse(w * .4, h * .24, w * .05, h * .08, -.4, 0, 6.29); c.fill(); }
    } else if (id === "scarabeo") {
      S("#2f9e8f", "#11524a");
      forma(function () { c.ellipse(w / 2, h * .55, w * .3, h * .34, 0, 0, 6.29); });
      forma(function () { c.ellipse(w / 2, h * .2, w * .16, h * .12, 0, 0, 6.29); });
      if (!ombra) { c.strokeStyle = "#e2b13a"; c.lineWidth = Math.max(1.5, w * .04); c.beginPath(); c.moveTo(w / 2, h * .25); c.lineTo(w / 2, h * .88); c.stroke(); c.beginPath(); c.moveTo(w * .2, h * .45); c.lineTo(w * .08, h * .35); c.moveTo(w * .8, h * .45); c.lineTo(w * .92, h * .35); c.moveTo(w * .22, h * .7); c.lineTo(w * .08, h * .8); c.moveTo(w * .78, h * .7); c.lineTo(w * .92, h * .8); c.stroke(); }
    } else if (id === "vaso") {
      S("#d9822b", "#4a2810");
      forma(function () { c.moveTo(w * .3, h * .05); c.lineTo(w * .7, h * .05); c.lineTo(w * .62, h * .18); c.quadraticCurveTo(w * 1.02, h * .4, w * .72, h * .9); c.lineTo(w * .28, h * .9); c.quadraticCurveTo(-w * .02, h * .4, w * .38, h * .18); c.closePath(); });
      forma(function () { c.rect(w * .3, h * .9, w * .4, h * .07); });
      if (!ombra) { c.fillStyle = "#1b1b1b"; c.fillRect(w * .12, h * .38, w * .76, h * .2); c.fillStyle = "#d9822b"; c.beginPath(); c.arc(w * .4, h * .46, w * .05, 0, 6.29); c.fill(); c.fillRect(w * .38, h * .5, w * .04, h * .07); c.beginPath(); c.arc(w * .6, h * .46, w * .05, 0, 6.29); c.fill(); c.fillRect(w * .58, h * .5, w * .04, h * .07); c.strokeStyle = "#1b1b1b"; c.lineWidth = Math.max(1, w * .02); c.beginPath(); for (var zx = 0; zx < 6; zx++) { c.moveTo(w * (.22 + zx * .1), h * .68); c.lineTo(w * (.27 + zx * .1), h * .74); c.lineTo(w * (.32 + zx * .1), h * .68); } c.stroke(); }
    } else if (id === "elmo") {
      if (!ombra) { g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#8c5a2b"); g.addColorStop(.5, "#d9a85a"); g.addColorStop(1, "#7a4a20"); }
      c.fillStyle = ombra ? "rgba(30,20,12,.55)" : g; c.strokeStyle = ombra ? "rgba(30,20,12,.7)" : "#4a2a10"; c.lineWidth = 2;
      forma(function () { c.moveTo(w * .12, h * .95); c.quadraticCurveTo(w * .02, h * .1, w * .5, h * .08); c.quadraticCurveTo(w * .98, h * .1, w * .88, h * .95); c.lineTo(w * .64, h * .95); c.lineTo(w * .6, h * .62); c.lineTo(w * .4, h * .62); c.lineTo(w * .36, h * .95); c.closePath(); });
      if (!ombra) { c.fillStyle = "#1b1b1b"; c.beginPath(); c.moveTo(w * .22, h * .45); c.lineTo(w * .45, h * .42); c.lineTo(w * .45, h * .6); c.lineTo(w * .3, h * .7); c.closePath(); c.moveTo(w * .78, h * .45); c.lineTo(w * .55, h * .42); c.lineTo(w * .55, h * .6); c.lineTo(w * .7, h * .7); c.closePath(); c.fill(); c.fillStyle = "#c92a2a"; c.fillRect(w * .44, 0, w * .12, h * .1); }
    } else if (id === "lucerna") {
      S("#b5652f", "#5a2d12");
      forma(function () { c.ellipse(w * .42, h * .58, w * .32, h * .3, 0, 0, 6.29); });
      forma(function () { c.moveTo(w * .66, h * .45); c.lineTo(w * .95, h * .5); c.lineTo(w * .95, h * .66); c.lineTo(w * .66, h * .7); c.closePath(); });
      if (!ombra) { c.fillStyle = "#3a1d0b"; c.beginPath(); c.arc(w * .42, h * .52, w * .07, 0, 6.29); c.fill(); c.beginPath(); c.arc(w * .9, h * .58, w * .03, 0, 6.29); c.fill(); c.fillStyle = "#ffd43b"; c.beginPath(); c.moveTo(w * .9, h * .5); c.quadraticCurveTo(w * .96, h * .38, w * .9, h * .28); c.quadraticCurveTo(w * .85, h * .4, w * .9, h * .5); c.fill(); }
    } else if (id === "gladio") {
      S("#adb5bd", "#495057");
      forma(function () { c.moveTo(w / 2, h * .02); c.lineTo(w * .68, h * .12); c.lineTo(w * .66, h * .64); c.lineTo(w * .34, h * .64); c.lineTo(w * .32, h * .12); c.closePath(); });
      S("#c9a227", "#6e5509"); forma(function () { c.rect(w * .1, h * .64, w * .8, h * .06); });
      S("#6b3f1f", "#3a200d"); forma(function () { c.rect(w * .38, h * .7, w * .24, h * .22); });
      S("#c9a227", "#6e5509"); forma(function () { c.arc(w / 2, h * .95, w * .16, 0, 6.29); });
    } else {   // (una gemma, per sicurezza)
      S("#3cc8d8", "#11707a"); forma(function () { c.moveTo(w / 2, h * .14); c.lineTo(w * .84, h * .4); c.lineTo(w / 2, h * .88); c.lineTo(w * .16, h * .4); c.closePath(); });
    }
    if (!ombra && integro != null && integro < 100) {   // le crepe
      c.strokeStyle = "rgba(20,10,5,.85)"; c.lineWidth = 1.6; var n = Math.ceil((100 - integro) / 15), k2 = Math.min(w, h) / 40;
      for (var q = 0; q < n; q++) { var cx = w * (.25 + .5 * seme01(q, 3)), cy = h * (.2 + .6 * seme01(q, 7)); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 6 * k2, cy + 5 * k2); c.lineTo(cx + 3 * k2, cy + 10 * k2); c.lineTo(cx + 8 * k2, cy + 15 * k2); c.stroke(); }
    }
    c.restore();
  }
  function tela(id, px, integro, ombra) {   // un reperto disegnato in un riquadro px×px (per la carta e il museo)
    if (ARTE[id]) { var img = el("img", "sv-arte"); img.alt = ""; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgArte(id, integro, ombra)); img.style.width = img.style.height = px + "px"; return img; }
    var dpr = Math.min(2, window.devicePixelRatio || 1), cv = el("canvas"), R = PER_ID[id], w = R.m[0].length, h = R.m.length, k = px * .78 / Math.max(w, h);
    cv.width = px * dpr; cv.height = px * dpr; cv.style.width = cv.style.height = px + "px";
    var c = cv.getContext("2d"); c.scale(dpr, dpr); disegnaReperto(c, id, px / 2 - w * k / 2, px / 2 - h * k / 2, w * k, h * k, integro, ombra); return cv;
  }

  // =========================================================
  //  LA SCHERMATA DEGLI SCAVI
  // =========================================================
  function crea(opts) {
    stile();
    AUDIO = opts.audio || null;
    var D = opts.dati && opts.dati.v ? opts.dati : datiIniziali();
    D.album = D.album || {}; D.zaino = D.zaino || []; D.colpi = D.colpi || { g: oggi(), usati: 0 }; D.extra = D.extra || 0; D.premi = D.premi || {}; D.tot = D.tot || 0;
    function salva() { if (opts.salva) opts.salva(D); }
    function monete() { return opts.monete ? opts.monete() : 0; }
    function colpi() { if (opts.illimitati) return 99; if (D.colpi.g !== oggi()) D.colpi = { g: oggi(), usati: 0 }; return Math.max(0, COLPI_GIORNO - D.colpi.usati) + D.extra; }
    function usaColpo() { if (opts.illimitati) return; colpi(); if (D.colpi.usati < COLPI_GIORNO) D.colpi.usati++; else D.extra = Math.max(0, D.extra - 1); }

    // ---- il campo: resta com'è (anche nei giorni dopo) finché non trovi tutti e 3 i reperti; allora la professoressa ne prepara uno nuovo ----
    function sorteggia(r) {   // quasi sempre roba comune; i pezzi rari sono rari davvero
      if (r() < CHANCE_DINO) { var dp = DINO.trex.pezzi; return dp[Math.floor(r() * dp.length)]; }   // un pezzo di dinosauro
      var x = r(), rar = x < .02 ? 5 : x < .08 ? 4 : x < .2 ? 3 : x < .5 ? 2 : 1, l = REPERTI.filter(function (p) { return p.r === rar && !p.dino; });
      if (!l.length) l = REPERTI.filter(function (p) { return p.r === 1 && !p.dino; });
      return l[Math.floor(r() * l.length)].id;
    }
    var nascosti = [], indizio = null;
    function preparaCampo(nuovo) {
      if (nuovo || !D.campo || D.campo.seme == null || !D.campo.stato || D.campo.stato.length !== N * N) {
        D.campo = { seme: 1 + Math.floor(Math.random() * 2e9), stato: [] }; for (var q0 = 0; q0 < N * N; q0++) D.campo.stato.push(0); D.inCorso = null;
      }
      var R0 = rnd(D.campo.seme);
      nascosti = []; indizio = null;
      while (nascosti.length < NASCOSTI) { var rr = Math.floor(R0() * N), cc = Math.floor(R0() * N); if (nascosti.every(function (p) { return Math.max(Math.abs(p.r - rr), Math.abs(p.c - cc)) >= 3; })) nascosti.push({ r: rr, c: cc, id: sorteggia(R0) }); }
      if (R0() < .4) { var pn = nascosti[Math.floor(R0() * NASCOSTI)], ds = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1]].filter(function (d) { var a = pn.r + d[0], b = pn.c + d[1]; return a >= 0 && b >= 0 && a < N && b < N; }); var d0 = ds[Math.floor(R0() * ds.length)]; indizio = { r: pn.r + d0[0], c: pn.c + d0[1] }; }
    }
    preparaCampo(false);
    function campoNuovo() {   // trovati tutti e 3: si ricomincia subito con un campo nuovo
      preparaCampo(true); salva(); suonoSi(); dimmi("Campo nuovo! 🏺");
      parla("Bravo, hai trovato tutto! Ho preparato un campo nuovo: buona caccia.");
    }
    // stato di un quadrato: 0 = da scavare, 1 = ❌ (visto vuoto), 2 = scavato con la bandierina ✅, 4 = scavato, c'era un reperto, 5 = scavato e vuoto (❌)
    function st(r, c) { return D.campo.stato[r * N + c]; }
    function metti(r, c, v) { D.campo.stato[r * N + c] = v; }
    function nascostoIn(r, c) { return nascosti.filter(function (p) { return p.r === r && p.c === c && st(r, c) !== 4; })[0]; }
    function vicini(r, c) { var n = 0; for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) if ((dr || dc) && nascostoIn(r + dr, c + dc)) n++; return n; }
    function rimasti() { return nascosti.filter(function (p) { return st(p.r, p.c) !== 4; }).length; }

    // ---- la struttura ----
    var s = el("div", "schermata sv-vista"), cv = el("canvas", "sv-tela"), ctx = cv.getContext("2d");
    var testa = el("div", "sv-testa"), bInd = el("button", "sv-tasto", "‹"), nome = el("div", "sv-nome", "🏺 Scavi antichi"), cColpi = el("div", "sv-chip"), cMonete = el("div", "sv-chip");
    bInd.setAttribute("aria-label", "Indietro"); bInd.onclick = function () { esci(); };
    var bSuoni = el("button", "sv-tasto", suoniOn() ? "🔊" : "🔇"); bSuoni.setAttribute("aria-label", "Suoni");
    bSuoni.onclick = function () { var on = !suoniOn(); try { localStorage.setItem(CHIAVE_SUONI, on ? "1" : "0"); } catch (e) {} bSuoni.textContent = on ? "🔊" : "🔇"; };
    [bInd, bSuoni, nome, cColpi, cMonete].forEach(function (n) { testa.appendChild(n); });
    var giu = el("div", "sv-giu"), bMuseo = el("button", "sv-bott", "🏛️ Museo"), bZaino = el("button", "sv-bott"), bColpi = el("button", "sv-bott", "⛏️ Colpi");
    bMuseo.onclick = function () { museo(); }; bZaino.onclick = function () { zaino(); }; bColpi.onclick = function () { compraColpi(); };
    [bMuseo, bZaino, bColpi].forEach(function (b) { giu.appendChild(b); });
    var prof = el("div", "sv-prof"), avviso = el("div", "sv-avviso"), sopra = el("div", "sv-sopra"), fossa = el("div", "sv-fossa");
    [cv, testa, giu, prof, avviso, fossa, sopra].forEach(function (n) { s.appendChild(n); });
    function aggTesta() { cColpi.textContent = "⛏️ " + (opts.illimitati ? "∞" : colpi()); cMonete.textContent = "🪙 " + cifre(monete()); bZaino.textContent = "🎒 Zaino" + (D.zaino.length ? " (" + D.zaino.length + ")" : ""); }
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    var profUltimo = "";
    function parla(t) { if (t === profUltimo) return; profUltimo = t; prof.innerHTML = ""; prof.appendChild(el("b", null, "Prof. Ida")); prof.appendChild(document.createTextNode(t)); prof.classList.remove("su"); void prof.offsetWidth; prof.classList.add("su"); }
    function vivo() { return document.body.contains(cv); }

    // ---- le misure: il campo visto dall'alto (un po' inclinato, come in Pokémon e Stardew): tutti i quadrati grandi uguali ----
    //      in alto, tra l'intestazione e il campo, le rovine, la tenda e la professoressa (in piedi); in basso i consigli e i tasti
    var cw = 360, ch = 640, dpr = 1, G = {}, sfondo = null;
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      cw = s.clientWidth || 360; ch = s.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      var giu = ch - 140, su = 50 + Math.max(78, ch * .13), INC = .9;   // INC: quanto il campo è schiacciato (la vista inclinata)
      var cell = Math.min((cw - 20) / N, (giu - su) / (N * INC)), cellH = cell * INC;
      G = { cell: cell, cellH: cellH, x0: (cw - N * cell) / 2, y0: giu - N * cellH };
      G.yH = Math.max(40, G.y0 - Math.max(70, (G.y0 - 50) * .8)); G.av = cell * 1.95; sfondo = null;
    }
    window.addEventListener("resize", misura);
    function proj(u, v) { return { x: G.x0 + u * G.cell, y: G.y0 + v * G.cellH, k: G.cell / 44 }; }

    // ---- gli avatar: il tuo (col badile) e la professoressa vicino alla tenda ----
    function immagine(cfg, o) { var im = new Image(); try { im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, o || {})); } catch (e) {} return im; }
    var mio = opts.omino && window.SGOmino ? opts.omino : (window.SGOmino ? SGOmino.casuale("Esploratore") : null);
    var imFermo = mio ? immagine(mio) : null, imPasso = mio ? immagine(mio, { cammina: true }) : null;
    var cfgProf = null, imProf = null;
    if (window.SGOmino) { cfgProf = SGOmino.casuale("Ida"); cfgProf.cappello = "cowboy"; cfgProf.occhiali = "tondi"; cfgProf.colCap = 6; cfgProf = SGOmino.norm(cfgProf); imProf = immagine(cfgProf); }
    var av = { u: N / 2, v: N - .25, tu: 0, tv: 0, stato: "fermo", t: 0, lato: 1, cella: null, colpo: 0 };
    var particelle = [], scossa = 0, occupato = false, tLuce = 0;

    // ---- toccare il campo ----
    function cellaIn(x, y) { var c = Math.floor((x - G.x0) / G.cell), r = Math.floor((y - G.y0) / G.cellH); return r >= 0 && c >= 0 && r < N && c < N ? { r: r, c: c } : null; }
    cv.addEventListener("pointerdown", function (e) {
      if (occupato || fossa.classList.contains("su") || sopra.classList.contains("su")) return;
      var b = cv.getBoundingClientRect(), q = cellaIn(e.clientX - b.left, e.clientY - b.top); if (!q) return;
      var v = st(q.r, q.c);
      if (v === 1) { dimmi("Qui hai già visto che non c'è niente ❌"); vibra(8); return; }
      if (v) return;
      if (colpi() <= 0) { finitiColpi(); return; }
      if (!rimasti()) { campoNuovo(); return; }
      vibra(12); vaiAScavare(q);
    });
    function vaiAScavare(q) {
      occupato = true; av.cella = q;
      av.lato = q.c >= N - 1 ? -1 : 1;   // si mette a destra del quadrato (a sinistra se è l'ultimo)
      av.tu = q.c + .5 + av.lato * .95; av.tv = q.r + .62; av.stato = "cammina"; av.t = 0;
    }
    function colpoDiPala() {   // il badile entra nella terra: polvere, scossa, suono
      var p = proj(av.cella.c + .5, av.cella.r + .5); suonoPala(); scossa = 4;
      for (var i = 0; i < 14; i++) particelle.push({ x: p.x, y: p.y, vx: (Math.random() - .5) * 3.4 * p.k * 2, vy: -Math.random() * 3.6 - 1.2, v: 1, r: (1.5 + Math.random() * 2.6) * p.k * 1.6, col: Math.random() < .5 ? "#c7955c" : "#e6c08a" });
    }
    function esitoScavo() {   // finito di scavare: cosa c'era?
      var q = av.cella, r = q.r, c = q.c, p = nascostoIn(r, c);
      usaColpo(); aggTesta();
      if (p) {
        metti(r, c, 4); D.inCorso = { r: r, c: c, id: p.id }; salva(); suonoTrovato(); vibra(25);
        parla(PER_ID[p.id].r >= 4 ? "Incredibile… questo sembra un pezzo importantissimo! Pennello e tanta calma." : "C'è qualcosa! Ora tiralo fuori con calma: il piccone fa franare la terra.");
        setTimeout(function () { apriFossa(p.id); }, 700);
        return;
      }
      if (vicini(r, c) === 0) {   // niente qui intorno: le ❌ su tutto il quadrato attorno
        metti(r, c, 5); var k = 0;
        for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { var a = r + dr, b = c + dc; if ((dr || dc) && a >= 0 && b >= 0 && a < N && b < N && st(a, b) === 0) { (function (a, b, k) { setTimeout(function () { metti(a, b, 1); suonoX(); }, 60 + k * 50); })(a, b, k++); } }
        parla("Niente qui intorno. Cambia zona: lontano dalle ❌.");
      } else { metti(r, c, 2); suonoSi(); parla("Fuochino! In uno degli 8 quadrati attorno alla bandierina c'è qualcosa."); }
      salva(); occupato = false;
      if (colpi() <= 0 && rimasti()) setTimeout(finitiColpi, 900);
    }

    // ---- l'animazione: avatar che cammina e scava, polvere ----
    function aggiorna(dt) {
      tLuce += dt;
      if (av.stato === "cammina") {
        var du = av.tu - av.u, dv = av.tv - av.v, d = Math.sqrt(du * du + dv * dv), passo = 5.5 * dt;
        av.t += dt;
        if (d <= passo) { av.u = av.tu; av.v = av.tv; av.stato = "scava"; av.t = 0; av.colpo = 0; }
        else { av.u += du / d * passo; av.v += dv / d * passo; }
      } else if (av.stato === "scava") {
        av.t += dt;
        if (av.colpo === 0 && av.t > .34) { av.colpo = 1; colpoDiPala(); }
        if (av.colpo === 1 && av.t > .72) { av.colpo = 2; colpoDiPala(); }
        if (av.t > 1.0) { av.stato = "fermo"; av.t = 0; esitoScavo(); }
      }
      particelle.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .32; p.v -= .03; });
      particelle = particelle.filter(function (p) { return p.v > 0; });
      scossa = Math.max(0, scossa - dt * 18);
    }

    // ---- il paesaggio fermo: cielo, colline, rovine, la tenda (si disegna una volta) ----
    var FASE = fase();
    var PAL = {
      giorno: { c0: "#5aa9e6", c1: "#bfe3f5", c2: "#fbe9c6", coll: "#d9b77e", coll2: "#c79d5e", terra0: "#e8cd98", terra1: "#cfa565", campo: "#b9874d", pietra: "#efe4cc", tenda: "#f4ead2", buio: 0 },
      tramonto: { c0: "#4a3a8a", c1: "#e98a6e", c2: "#ffcf8a", coll: "#b98761", coll2: "#9a6a4a", terra0: "#d9a876", terra1: "#b9824f", campo: "#a5723f", pietra: "#e6c9a8", tenda: "#f1d2b0", buio: .1 },
      notte: { c0: "#070b24", c1: "#1b2550", c2: "#3a3f6e", coll: "#3b3550", coll2: "#2c2840", terra0: "#8a7f86", terra1: "#6b5e5c", campo: "#6a5644", pietra: "#a9a4bb", tenda: "#c4bfd2", buio: .18 }
    };
    function pal() { return PAL[FASE] || PAL.giorno; }
    function disegnaSfondo() {
      var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height;
      var x = c.getContext("2d"), P = pal(), r = rnd(777), i, yH = G.yH, y0 = G.y0, fw = N * G.cell, fh = N * G.cellH, x0 = G.x0, k = G.cell / 44;
      x.scale(dpr, dpr); x.lineJoin = "round"; x.lineCap = "round";
      // il cielo in cima (dietro l'intestazione), il sole o la luna, le colline lontane
      var g = x.createLinearGradient(0, 0, 0, yH + 10); g.addColorStop(0, P.c0); g.addColorStop(.7, P.c1); g.addColorStop(1, P.c2); x.fillStyle = g; x.fillRect(0, 0, cw, yH + 20);
      if (FASE === "notte") { x.fillStyle = "#fff"; for (i = 0; i < 40; i++) { x.globalAlpha = .3 + r() * .7; x.beginPath(); x.arc(r() * cw, r() * yH * .95, r() * 1.2 + .3, 0, 6.29); x.fill(); } x.globalAlpha = 1; x.fillStyle = "#f8f3d4"; x.beginPath(); x.arc(cw * .82, yH * .45, 12, 0, 6.29); x.fill(); }
      else { x.fillStyle = FASE === "tramonto" ? "#ffb35c" : "#fff4c2"; x.globalAlpha = .9; x.beginPath(); x.arc(cw * .82, yH * (FASE === "tramonto" ? .85 : .45), FASE === "tramonto" ? 20 : 15, 0, 6.29); x.fill(); x.globalAlpha = 1; }
      function colline(yb, amp, f, ph, col) { x.fillStyle = col; x.beginPath(); x.moveTo(0, yb + 40); for (var xx = 0; xx <= cw; xx += 4) x.lineTo(xx, yb - Math.abs(Math.sin(xx / f + ph)) * amp - Math.sin(xx / (f * .43) + ph) * amp * .3); x.lineTo(cw, ch); x.lineTo(0, ch); x.closePath(); x.fill(); }
      colline(yH, 14, 70, .8, P.coll); colline(yH + 6, 8, 45, 2.4, P.coll2);
      // la sabbia: un po' più chiara lontano, più calda vicino, con sassolini sparsi
      g = x.createLinearGradient(0, yH + 6, 0, ch); g.addColorStop(0, P.terra0); g.addColorStop(1, P.terra1); x.fillStyle = g; x.fillRect(0, yH + 8, cw, ch);
      for (i = 0; i < 70; i++) { var sx = r() * cw, sy = yH + 14 + r() * (ch - yH - 14); x.fillStyle = "rgba(90,60,30," + (.08 + r() * .12) + ")"; x.beginPath(); x.ellipse(sx, sy, 2 + r() * 4, 1 + r() * 2, 0, 0, 6.29); x.fill(); }
      // tra il cielo e il campo: le rovine in piedi, i cipressi, il tavolo coi cocci e la tenda degli archeologi
      var base = y0 - 10 * k, alto = Math.max(30, base - yH - 4);
      function colonna(px, h, w, rotta) {
        x.fillStyle = "rgba(60,40,20,.18)"; x.beginPath(); x.ellipse(px + w * .3, base + 2, w * 1.1, w * .35, 0, 0, 6.29); x.fill();
        x.fillStyle = P.pietra; x.strokeStyle = "rgba(80,60,40,.5)"; x.lineWidth = 1.2;
        x.fillRect(px - w * .7, base - w * .35, w * 1.4, w * .35); x.strokeRect(px - w * .7, base - w * .35, w * 1.4, w * .35);
        x.beginPath(); x.moveTo(px - w / 2, base - w * .35); x.lineTo(px - w / 2, base - h); if (rotta) { x.lineTo(px - w * .1, base - h - w * .5); x.lineTo(px + w * .15, base - h + w * .3); } x.lineTo(px + w / 2, base - h + (rotta ? w * .2 : 0)); x.lineTo(px + w / 2, base - w * .35); x.closePath(); x.fill(); x.stroke();
        for (var f = -1; f <= 1; f++) { x.beginPath(); x.moveTo(px + f * w * .22, base - w * .4); x.lineTo(px + f * w * .22, base - h + w * .4); x.stroke(); }
        if (!rotta) { x.fillRect(px - w * .75, base - h - w * .3, w * 1.5, w * .3); x.strokeRect(px - w * .75, base - h - w * .3, w * 1.5, w * .3); }
      }
      function cipresso(px, h) { x.fillStyle = FASE === "notte" ? "#1c2a22" : "#3d6b3a"; x.beginPath(); x.moveTo(px, base - h); x.quadraticCurveTo(px + h * .18, base - h * .45, px + h * .07, base); x.lineTo(px - h * .07, base); x.quadraticCurveTo(px - h * .18, base - h * .45, px, base - h); x.fill(); }
      var cs2 = Math.max(8, cw * .025);
      cipresso(cw * .05, alto * .95); cipresso(cw * .955, alto * .85);
      colonna(cw * .13, alto * .82, cs2, false); colonna(cw * .22, alto * .5, cs2 * .9, true); colonna(cw * .31, alto * .7, cs2 * .85, false);
      // l'arco
      x.fillStyle = P.pietra; x.strokeStyle = "rgba(80,60,40,.5)"; var ax = cw * .47, aw = Math.min(cw * .15, alto * 1.2), ah = alto * .6;
      x.beginPath(); x.moveTo(ax - aw / 2, base); x.lineTo(ax - aw / 2, base - ah); x.lineTo(ax + aw / 2, base - ah); x.lineTo(ax + aw / 2, base); x.lineTo(ax + aw * .28, base); x.lineTo(ax + aw * .28, base - ah * .55); x.arc(ax, base - ah * .55, aw * .28, 0, Math.PI, true); x.lineTo(ax - aw * .28, base); x.closePath(); x.fill(); x.stroke();
      // la tenda a righe, con la bandierina
      var tx = cw * .8, tw = Math.min(cw * .24, alto * 1.5), th = Math.min(tw * .62, alto * .85);
      x.fillStyle = "rgba(0,0,0,.15)"; x.beginPath(); x.ellipse(tx, base + 2, tw * .62, 6, 0, 0, 6.29); x.fill();
      x.fillStyle = P.tenda; x.strokeStyle = "#8a6a3a"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(tx - tw / 2, base); x.lineTo(tx, base - th); x.lineTo(tx + tw / 2, base); x.closePath(); x.fill(); x.stroke();
      x.globalAlpha = .55; x.fillStyle = "#c4452f"; for (i = 0; i < 3; i++) { var a1 = (i * 2 + 1) / 6, a2 = (i * 2 + 2) / 6; x.beginPath(); x.moveTo(tx - tw / 2 + tw * a1 / 2, base - th * a1); x.lineTo(tx - tw / 2 + tw * a2 / 2, base - th * a2); x.lineTo(tx - tw / 2 + tw * a2 / 2 + 3, base); x.lineTo(tx - tw / 2 + tw * a1 / 2 + 3, base); x.closePath(); x.fill(); } x.globalAlpha = 1;
      x.fillStyle = "#4a2e18"; x.beginPath(); x.moveTo(tx - tw * .14, base); x.lineTo(tx, base - th * .62); x.lineTo(tx + tw * .14, base); x.closePath(); x.fill();
      x.strokeStyle = "#5a3a22"; x.lineWidth = 2; x.beginPath(); x.moveTo(tx, base - th); x.lineTo(tx, base - th - 10); x.stroke(); x.fillStyle = "#e03131"; x.beginPath(); x.moveTo(tx, base - th - 10); x.lineTo(tx + 9, base - th - 7); x.lineTo(tx, base - th - 4); x.fill();
      // il tavolino coi cocci e il setaccio, a sinistra del campo
      var mx = Math.max(24, x0 + 18), mb = base; x.fillStyle = "#8b5a2b"; x.fillRect(mx - 16, mb - 12, 32, 4); x.fillRect(mx - 13, mb - 8, 3, 8); x.fillRect(mx + 10, mb - 8, 3, 8);
      x.fillStyle = "#c8673a"; x.beginPath(); x.ellipse(mx - 6, mb - 16, 4, 5, 0, 0, 6.29); x.fill(); x.fillStyle = "#adb5bd"; x.beginPath(); x.ellipse(mx + 6, mb - 14, 7, 2.5, 0, 0, 6.29); x.fill();
      // il campo: più basso della sabbia intorno (il bordo in ombra in alto, la luce in basso)
      x.fillStyle = "rgba(70,40,15,.35)"; x.fillRect(x0 - 7, y0 - 7, fw + 14, fh + 14);
      x.fillStyle = P.campo; x.fillRect(x0 - 3, y0 - 3, fw + 6, fh + 6);
      g = x.createLinearGradient(0, y0 - 3, 0, y0 + 12); g.addColorStop(0, "rgba(40,20,5,.45)"); g.addColorStop(1, "rgba(40,20,5,0)"); x.fillStyle = g; x.fillRect(x0 - 3, y0 - 3, fw + 6, 15);
      x.fillStyle = "rgba(255,240,210,.35)"; x.fillRect(x0 - 7, y0 + fh + 3, fw + 14, 4);
      for (var rr2 = 0; rr2 < N; rr2++) for (var cc2 = 0; cc2 < N; cc2++) {   // ogni quadrato un po' diverso, con qualche sassolino
        var qx = x0 + cc2 * G.cell, qy = y0 + rr2 * G.cellH;
        x.fillStyle = (rr2 + cc2) % 2 ? "rgba(255,240,210,.07)" : "rgba(70,40,15,.07)"; x.fillRect(qx, qy, G.cell, G.cellH);
        for (var t2 = 0; t2 < 2; t2++) if (r() < .55) { x.fillStyle = "rgba(80,50,25," + (.2 + r() * .2) + ")"; x.beginPath(); x.ellipse(qx + G.cell * (.15 + r() * .7), qy + G.cellH * (.15 + r() * .7), (1.4 + r() * 1.8) * k * 1.4, (.9 + r()) * k * 1.4, 0, 0, 6.29); x.fill(); }
      }
      // lo spago e i picchetti
      x.strokeStyle = FASE === "notte" ? "rgba(230,220,200,.55)" : "rgba(255,248,230,.85)"; x.lineWidth = 1.3;
      for (i = 0; i <= N; i++) { x.beginPath(); x.moveTo(x0 + i * G.cell, y0); x.lineTo(x0 + i * G.cell, y0 + fh); x.moveTo(x0, y0 + i * G.cellH); x.lineTo(x0 + fw, y0 + i * G.cellH); x.stroke(); }
      for (i = 0; i <= N; i += 3) [[i, 0], [i, N], [0, i], [N, i]].forEach(function (t) {
        var p = proj(t[0], t[1]), h = 12 * k * 1.4, w = 3.2 * k * 1.4;
        x.fillStyle = "rgba(40,20,5,.3)"; x.beginPath(); x.ellipse(p.x + 2, p.y + 1, w * 1.2, w * .5, 0, 0, 6.29); x.fill();
        x.fillStyle = "#7a4a22"; x.fillRect(p.x - w / 2, p.y - h, w, h); x.fillStyle = "#e03131"; x.fillRect(p.x - w * .65, p.y - h, w * 1.3, w);
      });
      return c;
    }

    // ---- il disegno di ogni fotogramma ----
    function disegna() {
      if (!sfondo) sfondo = disegnaSfondo();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      var sx = scossa ? (Math.random() - .5) * scossa : 0, sy = scossa ? (Math.random() - .5) * scossa : 0;
      ctx.setTransform(dpr, 0, 0, dpr, dpr * sx, dpr * sy); ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.drawImage(sfondo, 0, 0, cw, ch);
      var spr = [], r, c;   // le cose in piedi (bandierine, avatar, professoressa): si disegnano dalla più lontana
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        var v = st(r, c), a = proj(c, r), b = proj(c + 1, r), cc = proj(c + 1, r + 1), d = proj(c, r + 1), m = proj(c + .5, r + .5);
        if (v === 2 || v === 4 || v === 5) {   // la buca
          var bw = (b.x - a.x + cc.x - d.x) / 4 * .62, bh = (d.y - a.y) * .32;
          ctx.fillStyle = "rgba(40,22,10,.85)"; ctx.beginPath(); ctx.ellipse(m.x, m.y + bh * .1, bw, bh, 0, 0, 6.29); ctx.fill();
          ctx.strokeStyle = "rgba(255,230,190,.35)"; ctx.lineWidth = 1.5 * m.k * 1.5; ctx.beginPath(); ctx.ellipse(m.x, m.y + bh * .1, bw, bh, 0, Math.PI * .1, Math.PI * .9); ctx.stroke();
          ctx.fillStyle = "#a8763f"; ctx.beginPath(); ctx.ellipse(m.x + bw * 1.15, m.y - bh * .2, bw * .45, bh * .55, 0, 0, 6.29); ctx.fill();   // il mucchietto di terra
        }
        if (v === 1 || v === 5) {   // la ❌ dipinta per terra
          ctx.strokeStyle = "#d9412b"; ctx.lineWidth = Math.max(2, 4.2 * m.k); var t = .3;
          ctx.beginPath(); ctx.moveTo(a.x + (cc.x - a.x) * t, a.y + (cc.y - a.y) * t); ctx.lineTo(a.x + (cc.x - a.x) * (1 - t), a.y + (cc.y - a.y) * (1 - t));
          ctx.moveTo(b.x + (d.x - b.x) * t, b.y + (d.y - b.y) * t); ctx.lineTo(b.x + (d.x - b.x) * (1 - t), b.y + (d.y - b.y) * (1 - t)); ctx.stroke();
        }
        if (v === 4) {   // qui c'era un reperto: luccica
          ctx.fillStyle = "rgba(255,224,102," + (.5 + .3 * Math.sin(tLuce * 4 + r + c)) + ")"; ctx.beginPath(); ctx.arc(m.x, m.y - 2 * m.k, 4 * m.k * 1.6, 0, 6.29); ctx.fill();
        }
        if (v === 2) spr.push({ v: r + .5, f: bandierina.bind(null, m) });
        if (!v && indizio && indizio.r === r && indizio.c === c) {   // il coccio che spunta: un indizio
          ctx.fillStyle = "#c8673a"; ctx.strokeStyle = "#6b2f14"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(m.x - 6 * m.k * 1.5, m.y); ctx.lineTo(m.x - 1 * m.k, m.y - 5 * m.k * 1.5); ctx.lineTo(m.x + 6 * m.k * 1.5, m.y - 1); ctx.lineTo(m.x + 2 * m.k, m.y + 3 * m.k); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
      if (imProf) spr.push({ v: -1, f: function () { var k = G.cell / 44; figura(imProf, { x: cw * .64, y: G.y0 - 9 * k, k: k * .9 }, false, 0); } });   // la professoressa davanti alle rovine
      spr.push({ v: av.v, f: disegnaMio });
      spr.sort(function (x1, x2) { return x1.v - x2.v; }).forEach(function (o) { o.f(); });
      particelle.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.v); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill(); });
      ctx.globalAlpha = 1;
      if (pal().buio) { ctx.fillStyle = "rgba(10,14,40," + pal().buio + ")"; ctx.fillRect(-10, -10, cw + 20, ch + 20); var lp = { x: cw * .8, y: G.y0 }; var gl = ctx.createRadialGradient(lp.x, lp.y - 20, 4, lp.x, lp.y - 20, 120); gl.addColorStop(0, "rgba(255,210,120,.35)"); gl.addColorStop(1, "rgba(255,210,120,0)"); ctx.fillStyle = gl; ctx.fillRect(lp.x - 130, lp.y - 150, 260, 260); }
    }
    function bandierina(m) {
      var h = 30 * m.k * 1.6, w2 = 16 * m.k * 1.6;
      ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = Math.max(1.5, 2.2 * m.k); ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x, m.y - h); ctx.stroke();
      ctx.fillStyle = "#2f9e44"; ctx.beginPath(); ctx.moveTo(m.x, m.y - h); ctx.lineTo(m.x + w2, m.y - h + w2 * .35); ctx.lineTo(m.x, m.y - h + w2 * .7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.2, 1.8 * m.k); ctx.beginPath(); ctx.moveTo(m.x + w2 * .18, m.y - h + w2 * .36); ctx.lineTo(m.x + w2 * .32, m.y - h + w2 * .5); ctx.lineTo(m.x + w2 * .55, m.y - h + w2 * .16); ctx.stroke();
    }
    function figura(im, p, specchio, giu) {   // un avatar in piedi in quel punto del campo (giu: quanto si piega)
      if (!im || !im.complete || !im.naturalWidth) return;
      var h = G.av * p.k, w = h / 1.32;
      ctx.fillStyle = "rgba(40,25,10,.25)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, w * .32, w * .1, 0, 0, 6.29); ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y + (giu || 0) * h); if (specchio) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h * .96, w, h); ctx.restore();
    }
    function disegnaMio() {
      var p = proj(av.u, av.v), h = G.av * p.k, im = imFermo, giu = 0;
      if (av.stato === "cammina") { im = Math.floor(av.t * 6) % 2 ? imPasso : imFermo; p.y -= Math.abs(Math.sin(av.t * 18)) * h * .02; }
      var lato = av.lato, mano = { x: p.x + lato * h * .2, y: p.y - h * .42 }, riposo = { x: p.x + lato * h * .36, y: p.y - h * .02 }, punta = riposo;
      if (av.stato === "scava" && av.cella) {   // su… e giù dentro la terra, due volte
        var dove = proj(av.cella.c + .5, av.cella.r + .5), su = { x: p.x + lato * h * .42, y: p.y - h * .32 }, t = av.t;
        function tra(A, B, k) { k = Math.max(0, Math.min(1, k)); k = k * k * (3 - 2 * k); return { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k }; }
        punta = t < .26 ? tra(riposo, su, t / .26) : t < .36 ? tra(su, dove, (t - .26) / .1) : t < .55 ? tra(dove, su, (t - .36) / .19) : t < .74 ? tra(su, dove, (t - .55) / .19) : tra(dove, riposo, (t - .74) / .26);
        giu = (t > .3 && t < .45) || (t > .68 && t < .82) ? .035 : 0;
        mano = { x: mano.x + (punta.x - mano.x) * .25, y: p.y - h * (.42 - giu) };
      }
      figura(im, p, lato < 0, giu);
      // il badile: il manico dalla mano alla punta, e la lama di ferro
      var dx = punta.x - mano.x, dy = punta.y - mano.y, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, lw = Math.max(1.6, h * .028);
      var top = { x: mano.x - ux * h * .12, y: mano.y - uy * h * .12 };
      ctx.strokeStyle = "#3b2414"; ctx.lineWidth = lw + 2; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(punta.x - ux * h * .08, punta.y - uy * h * .08); ctx.stroke();
      ctx.strokeStyle = "#a0652b"; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(punta.x - ux * h * .08, punta.y - uy * h * .08); ctx.stroke();
      var bl = h * .1, bw = h * .055, px = -uy, py = ux, base = { x: punta.x - ux * bl, y: punta.y - uy * bl };
      ctx.fillStyle = "#adb5bd"; ctx.strokeStyle = "#495057"; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(base.x + px * bw, base.y + py * bw); ctx.lineTo(base.x - px * bw, base.y - py * bw); ctx.lineTo(punta.x - px * bw * .6, punta.y - py * bw * .6); ctx.quadraticCurveTo(punta.x + ux * bw * .4, punta.y + uy * bw * .4, punta.x + px * bw * .6, punta.y + py * bw * .6); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    var anim = 0, ult = 0;
    function giro(o) {
      if (!vivo()) return;
      var dt = Math.min(.05, (o - ult) / 1000 || 0); ult = o;
      aggiorna(dt); disegna(); anim = requestAnimationFrame(giro);
    }

    // =========================================================
    //  L'ESTRAZIONE: la terra a quadretti, piccone e pennello, la frana
    // =========================================================
    var W = 12, H = 9, cs = 30, strati = [], sassi = [], ogg = [], frana = 0, attrezzo = "piccone", finita = true, schegge = [], tremo = 0, fragile = 14, peso = 1, animF = 0;
    var fTela = el("canvas", "sv-ftela"), fx = fTela.getContext("2d"), fTesta = el("div", "sv-fintesta"), fFaccia = el("img", "sv-faccia"), fTit = el("div", "sv-ftit");
    var fBarre = el("div", "sv-barre"), bFrana = el("i"), bInt = el("i"), fAttr = el("div", "sv-attrezzi"), tPicc = el("button", "sv-attrezzo"), tPenn = el("button", "sv-attrezzo"), fBasta = el("button", "sv-basta", "Basta così: porto via quello che è già fuori");
    fFaccia.alt = ""; fTesta.appendChild(fFaccia); fTesta.appendChild(fTit);
    (function () {
      var a = el("div", "sv-barra sv-frana"); a.appendChild(document.createTextNode("Frana")); var ia = el("span"); ia.appendChild(bFrana); a.appendChild(ia);
      var b = el("div", "sv-barra sv-intatto"); b.appendChild(document.createTextNode("Reperto intatto")); var ib = el("span"); ib.appendChild(bInt); b.appendChild(ib);
      fBarre.appendChild(a); fBarre.appendChild(b);
      tPicc.innerHTML = "<span>⛏️</span><b>Piccone</b><small>veloce, ma fa franare</small>"; tPenn.innerHTML = "<span>🖌️</span><b>Pennello</b><small>piano e sicuro</small>";
      fAttr.appendChild(tPicc); fAttr.appendChild(tPenn);
    })();
    [fTesta, fTela, fBarre, fAttr, fBasta].forEach(function (n) { fossa.appendChild(n); });
    var facce = {};
    function faccia(k) {   // la tua faccia mentre scavi: tranquilla, contenta, preoccupata
      if (!mio || !window.SGOmino) return;
      if (!facce[k]) { var c2 = JSON.parse(JSON.stringify(mio)); if (k === "si") c2.bocca = "risata"; if (k === "no") c2.bocca = "nervoso"; try { facce[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(c2, { busto: true })); } catch (e) { facce[k] = ""; } }
      if (fFaccia.getAttribute("src") !== facce[k]) fFaccia.src = facce[k];
    }
    function scegliAttrezzo(t) { attrezzo = t; tPicc.classList.toggle("on", t === "piccone"); tPenn.classList.toggle("on", t === "pennello"); vibra(8); }
    tPicc.onclick = function () { scegliAttrezzo("piccone"); }; tPenn.onclick = function () { scegliAttrezzo("pennello"); };
    fBasta.onclick = function () { if (!finita) chiudiFossa(false); };
    function liberi(o) { return o.celle.every(function (q) { return strati[q[1] * W + q[0]] <= 0; }); }
    function principale() { return ogg.filter(function (o) { return o.princ; })[0]; }
    function oggettoIn(x, y) { return ogg.filter(function (o) { return o.celle.some(function (q) { return q[0] === x && q[1] === y; }); })[0]; }
    function sasso(x, y) { return sassi.some(function (z) { return z[0] === x && z[1] === y; }); }
    function apriFossa(id) {
      var lv = PER_ID[id].lv != null ? PER_ID[id].lv : PER_ID[id].r - 1, R = rnd(hash(oggi() + id + Math.random()));
      fragile = 10 + lv * 5; peso = 1 + lv * .12; frana = 0; schegge = []; finita = false;
      fTit.innerHTML = "<b>Tira fuori il reperto</b><small>Vicino ai pezzi usa il pennello</small>";
      var largo = Math.min(cw - 24, 440); cs = Math.floor(largo / W);
      var d2 = Math.min(2, window.devicePixelRatio || 1); fTela.width = W * cs * d2; fTela.height = H * cs * d2; fTela.style.width = W * cs + "px"; fTela.style.height = H * cs + "px"; fx.setTransform(d2, 0, 0, d2, 0, 0);
      strati = []; for (var i = 0; i < W * H; i++) strati.push(Math.min(4, 2 + Math.floor(R() * 3) - (R() < .25 ? 1 : 0) + (lv >= 3 && R() < .5 ? 1 : 0)));
      sassi = []; ogg = [];
      function libero(x, y, w, h) { for (var yy = y - 1; yy <= y + h; yy++) for (var xx = x - 1; xx <= x + w; xx++) { if (oggettoIn(xx, yy) || sasso(xx, yy)) return false; } return true; }
      function piazza(t, princ) {
        var m = PER_ID[t].m, h = m.length, w = m[0].length;
        for (var k = 0; k < 300; k++) {
          var x = (princ ? 2 : 0) + Math.floor(R() * (W - w - (princ ? 4 : 0) + 1)), y = (princ ? 1 : 0) + Math.floor(R() * (H - h - (princ ? 2 : 0) + 1));
          if (!libero(x, y, w, h)) continue;
          var cel = []; m.forEach(function (riga, yy) { riga.split("").forEach(function (ch2, xx) { if (ch2 === "X") cel.push([x + xx, y + yy]); }); });
          ogg.push({ id: t, x: x, y: y, w: w, h: h, celle: cel, integro: 100, princ: princ, fuori: false }); return;
        }
      }
      piazza(id, true); if (R() < .45) piazza(PICCOLI[Math.floor(R() * PICCOLI.length)], false);
      for (var s2 = 0; s2 < 3 + lv; s2++) for (var t2 = 0; t2 < 60; t2++) { var sx = Math.floor(R() * W), sy = Math.floor(R() * H); if (libero(sx, sy, 1, 1)) { sassi.push([sx, sy]); if (R() < .6 && sx + 1 < W && libero(sx + 1, sy, 1, 1)) sassi.push([sx + 1, sy]); break; } }
      ogg.forEach(function (o) { o.celle.forEach(function (q) { strati[q[1] * W + q[0]] = Math.max(strati[q[1] * W + q[0]], lv >= 2 ? 3 : 2); }); });   // i reperti non stanno mai in superficie
      scegliAttrezzo("piccone"); faccia("ok"); aggBarre();
      fossa.classList.add("su"); cancelAnimationFrame(animF); animF = requestAnimationFrame(disegnaFossa);
    }
    function aggBarre() { bFrana.style.width = Math.min(100, frana) + "%"; var p = principale(); bInt.style.width = (p ? p.integro : 0) + "%"; }
    function colpisci(x, y) {
      if (finita || x < 0 || y < 0 || x >= W || y >= H) return;
      var forte = attrezzo === "piccone";
      if (sasso(x, y)) { suonoTok(); frana += forte ? 6 : 2; tremo = 4; scheggia(x, y, "#9a968e", 6); dimmi("Tok! È un sasso: non si rompe, giraci intorno"); return fine2(); }
      function togli(xx, yy, n) {
        if (xx < 0 || yy < 0 || xx >= W || yy >= H || sasso(xx, yy)) return;
        var i = yy * W + xx, o = oggettoIn(xx, yy);
        if (strati[i] <= 0) { if (o && forte && n >= 2) { o.integro = Math.max(0, o.integro - fragile); suonoCrepa(); vibra(30); faccia("no"); dimmi("Crack! Col piccone hai crepato il reperto"); } return; }
        strati[i] = Math.max(0, strati[i] - n);
      }
      togli(x, y, forte ? 2 : 1);
      if (forte) { togli(x + 1, y, 1); togli(x - 1, y, 1); togli(x, y + 1, 1); togli(x, y - 1, 1); }
      frana += (forte ? 4.2 : 1.4) * peso; tremo = forte ? 3 : 0;
      if (forte) suonoTerra(); else suonoPennello();
      vibra(forte ? 10 : 5); scheggia(x, y, forte ? "#c7955c" : "#e3c08e", forte ? 9 : 4);
      ogg.forEach(function (o) { if (!o.fuori && liberi(o)) { o.fuori = true; suonoSi(); faccia("si"); if (!o.princ) dimmi("Sorpresa! Nella buca c'era anche: " + PER_ID[o.id].nome); } });
      if (frana > 75 && !finita) faccia("no");
      fine2();
    }
    function fine2() {
      aggBarre();
      if (ogg.every(function (o) { return liberi(o); })) return chiudiFossa(false);
      if (frana >= 100) { suonoFrana(); tremo = 14; vibra(80); return chiudiFossa(true); }
    }
    function scheggia(x, y, col, n) { for (var i = 0; i < n; i++) schegge.push({ x: (x + .5) * cs, y: (y + .5) * cs, vx: (Math.random() - .5) * 5, vy: -Math.random() * 4 - 1, v: 1, col: col, r: 1.5 + Math.random() * 2.5 }); }
    fTela.addEventListener("pointerdown", function (e) { var b = fTela.getBoundingClientRect(); colpisci(Math.floor((e.clientX - b.left) / cs), Math.floor((e.clientY - b.top) / cs)); });
    var TERRA = ["#5a3a22", "#8a5a33", "#a8733f", "#c48f55", "#d9aa6c"];
    function disegnaFossa() {
      if (!fossa.classList.contains("su") || !vivo()) return;
      var ox2 = tremo ? (Math.random() - .5) * tremo : 0, oy2 = tremo ? (Math.random() - .5) * tremo : 0; tremo = Math.max(0, tremo - .6);
      fx.save(); fx.clearRect(0, 0, W * cs, H * cs); fx.translate(ox2, oy2);
      var g = fx.createLinearGradient(0, 0, 0, H * cs); g.addColorStop(0, "#4a2f1a"); g.addColorStop(1, "#2f1d10"); fx.fillStyle = g; fx.fillRect(-10, -10, W * cs + 20, H * cs + 20);
      ogg.forEach(function (o) { disegnaReperto(fx, o.id, o.x * cs, o.y * cs, o.w * cs, o.h * cs, o.integro); });
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        var i = y * W + x, sv = strati[i];
        if (sasso(x, y)) {
          fx.fillStyle = "#8d8a84"; fx.strokeStyle = "#55524c"; fx.lineWidth = 2; fx.beginPath(); if (fx.roundRect) fx.roundRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4, 7); else fx.rect(x * cs + 2, y * cs + 2, cs - 4, cs - 4); fx.fill(); fx.stroke();
          fx.fillStyle = "rgba(255,255,255,.25)"; fx.beginPath(); fx.arc(x * cs + cs * .35, y * cs + cs * .35, cs * .12, 0, 6.29); fx.fill(); continue;
        }
        if (sv <= 0) continue;
        fx.fillStyle = TERRA[Math.min(4, sv)]; fx.fillRect(x * cs, y * cs, cs + .5, cs + .5);
        fx.fillStyle = "rgba(0,0,0,.12)"; for (var k = 0; k < 3; k++) { fx.beginPath(); fx.arc(x * cs + cs * seme01(i, k), y * cs + cs * seme01(i, k + 5), 1.4 + seme01(i, k + 9) * 1.6, 0, 6.29); fx.fill(); }
        fx.fillStyle = "rgba(255,255,255,.08)"; fx.fillRect(x * cs, y * cs, cs, 2);
      }
      schegge.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .35; p.v -= .035; fx.globalAlpha = Math.max(0, p.v); fx.fillStyle = p.col; fx.beginPath(); fx.arc(p.x, p.y, p.r, 0, 6.29); fx.fill(); });
      fx.globalAlpha = 1; schegge = schegge.filter(function (p) { return p.v > 0; });
      if (frana >= 100) { fx.fillStyle = "rgba(90,58,33,.6)"; fx.fillRect(0, 0, W * cs, H * cs); }
      fx.restore();
      animF = requestAnimationFrame(disegnaFossa);
    }
    function chiudiFossa(franata) {
      finita = true; aggBarre();
      var presi = ogg.filter(function (o) { return liberi(o); });
      D.inCorso = null; salva();
      setTimeout(function () { fossa.classList.remove("su"); cancelAnimationFrame(animF); occupato = false; cartaReperto(presi, franata); }, franata ? 1000 : 550);
    }

    // ---- la carta del reperto: lo vendi o lo tieni ----
    function svuota() { while (sopra.firstChild) sopra.removeChild(sopra.firstChild); }
    function chiudiSopra() { sopra.classList.remove("su"); }
    function finestra(titolo, nodi, tasti, cls) {
      svuota(); var box = el("div", "sv-carta" + (cls ? " " + cls : "")); if (titolo) box.appendChild(el("h2", null, titolo));
      nodi.forEach(function (n) { if (n) box.appendChild(n); });
      var tt = el("div", "sv-tasti"); tasti.forEach(function (x) { var b = el("button", "btn " + (x.cls || "btn-fantasma"), x.testo); b.onclick = x.fn; if (x.off) b.disabled = true; tt.appendChild(b); }); box.appendChild(tt);
      sopra.appendChild(box); sopra.classList.add("su");
    }
    function nelMuseo(o) {   // il primo di ogni tipo entra nel museo; si ricorda il più intatto
      var a = D.album[o.id], nuovo = !a;
      D.album[o.id] = { n: (a ? a.n : 0) + 1, top: Math.max(a ? a.top : 0, o.integro) };
      D.tot++;
      EPOCHE.forEach(function (ep) {   // epoca completa: il premio, una volta sola
        if (D.premi[ep.id]) return;
        if (REPERTI.filter(function (x) { return x.epoca === ep.id; }).every(function (x) { return D.album[x.id]; })) { D.premi[ep.id] = 1; if (opts.cambia) opts.cambia(PREMIO_EPOCA); setTimeout(function () { dimmi("🏛️ " + ep.nome + " completa! +🪙 " + cifre(PREMIO_EPOCA)); suonoMonete(); }, 900); }
      });
      Object.keys(DINO).forEach(function (k) {   // tutti i pezzi del dinosauro: lo scheletro va nel museo (e il premio, una volta sola)
        var dn = DINO[k]; if (D.premi[k] || !dn.pezzi.every(function (id) { return D.album[id]; })) return;
        D.premi[k] = 1; scheletroNuovo = k; if (opts.cambia) opts.cambia(dn.premio);
      });
      return nuovo;
    }
    var scheletroNuovo = null;
    function cartaScheletro(k) {   // la carta grande: lo scheletro intero montato
      var dn = DINO[k], fig = el("div", "sv-fig sv-scheletro"), im = el("img", "sv-arte"); im.alt = ""; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgArte(k, 100, false)); fig.appendChild(im);
      suonoCarta(5); vibra(40);
      finestra("🦖 Scheletro del " + dn.nome + " completo!", [fig, el("p", "sv-frase", "Hai trovato tutti e " + dn.pezzi.length + " i pezzi: ora lo scheletro è montato nel museo."), el("p", "sv-storia", dn.storia), el("div", "sv-nuovo", "+🪙 " + cifre(dn.premio))],
        [{ testo: "Evviva! 🎉", cls: "btn-primario", fn: function () { chiudiSopra(); aggTesta(); dopoCarta(); } }]);
    }
    function pezziTrovati(k) { return DINO[k].pezzi.filter(function (id) { return D.album[id]; }).length; }
    function cartaReperto(presi, franata) {
      var p = presi.filter(function (o) { return o.princ; })[0], extra = presi.filter(function (o) { return !o.princ; });
      var nodi = [], nuovi = {};
      presi.forEach(function (o) { nuovi[o.id] = nelMuseo(o); });
      if (p) {
        var R = PER_ID[p.id], fig = el("div", "sv-fig r" + R.r); fig.appendChild(tela(p.id, 150, p.integro)); nodi.push(fig);
        var rar = el("span", "sv-rar", etichettaR(R)); rar.style.background = coloreR(R); nodi.push(rar);
        nodi.push(el("div", "sv-epoca", EPOCHE.filter(function (e) { return e.id === R.epoca; })[0].nome + " · " + R.quando));
        if (R.storia) nodi.push(el("p", "sv-storia", R.storia));
        nodi.push(el("p", "sv-stato", p.integro >= 100 ? "Intatto! Perfetto per il museo 🏛️" : p.integro >= 60 ? "Un po' crepato (" + p.integro + "%)" : "Molto crepato (" + p.integro + "%): vale meno"));
        if (nuovi[p.id]) nodi.push(el("div", "sv-nuovo", "✨ Nuovo nel museo!"));
        if (R.dino) nodi.push(el("div", "sv-dino", "🦖 Scheletro del " + DINO[R.dino].nome + ": " + pezziTrovati(R.dino) + "/" + DINO[R.dino].pezzi.length + " pezzi"));
        suonoCarta(R.r);
      } else nodi.push(el("p", "sv-frase", franata ? "La terra è franata e il reperto è rimasto sepolto. Col pennello la frana sale più piano." : "Il reperto è rimasto sotto terra."));
      if (extra.length) { var l = el("div", "sv-extra"); extra.forEach(function (o) { l.appendChild(el("span", null, "🎁 " + PER_ID[o.id].nome)); }); nodi.push(l); }
      if (franata && p) nodi.push(el("p", "sv-nota", "È franato tutto: hai tenuto quello che era già fuori."));
      var tot = presi.reduce(function (a, o) { return a + valoreDi(o.id, o.integro); }, 0);
      var tasti = [];
      if (presi.length) {
        tasti.push({ testo: "🪙 Vendi tutto · " + cifre(tot), cls: "btn-primario", fn: function () { if (opts.cambia) opts.cambia(tot); suonoMonete(); vibra(10); chiudiSopra(); salva(); aggTesta(); dopoCarta(); } });
        tasti.push({ testo: "🎒 Tieni nello zaino", off: D.zaino.length + presi.length > ZAINO_MAX, fn: function () { presi.forEach(function (o) { D.zaino.push({ id: o.id, integro: o.integro }); }); chiudiSopra(); salva(); aggTesta(); dopoCarta(); } });
      } else tasti.push({ testo: "Va bene", cls: "btn-primario", fn: function () { chiudiSopra(); dopoCarta(); } });
      finestra(p ? PER_ID[p.id].nome : "Sepolto!", nodi, tasti);
      salva();
    }
    function dopoCarta() {
      if (scheletroNuovo) { var k = scheletroNuovo; scheletroNuovo = null; return cartaScheletro(k); }
      if (!rimasti()) campoNuovo();
      else if (colpi() <= 0) finitiColpi();
      else parla((opts.illimitati ? "Colpi illimitati ⛏️." : "Ti restano " + colpi() + " colpi.") + " Ci sono ancora " + rimasti() + " cose sepolte qui.");
    }

    // ---- museo, zaino, colpi ----
    var scrollMuseo = 0;
    function scheda(id) {   // tocchi un reperto del museo: il disegno grande e la sua storia
      var cc = sopra.firstChild; scrollMuseo = cc ? cc.scrollTop : 0;
      var dn = DINO[id], R = PER_ID[id], a = D.album[id], nodi = [], fig;
      if (dn) { fig = el("div", "sv-fig sv-scheletro"); var im = el("img", "sv-arte"); im.alt = ""; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgArte(id, 100, false)); fig.appendChild(im); nodi.push(fig, el("div", "sv-epoca", "Preistoria · 68 milioni di anni fa"), el("p", "sv-storia", dn.storia)); }
      else {
        fig = el("div", "sv-fig r" + R.r); fig.appendChild(tela(id, 150, a.top)); nodi.push(fig);
        var rar = el("span", "sv-rar", etichettaR(R)); rar.style.background = coloreR(R); nodi.push(rar);
        nodi.push(el("div", "sv-epoca", EPOCHE.filter(function (e) { return e.id === R.epoca; })[0].nome + " · " + R.quando), el("p", "sv-storia", R.storia));
        nodi.push(el("p", "sv-nota", "Trovato " + (a.n === 1 ? "1 volta" : cifre(a.n) + " volte") + " · " + (a.top >= 100 ? "il più bello è intatto" : "il più bello è al " + a.top + "%")));
      }
      finestra(dn ? "🦖 Scheletro del " + dn.nome : R.nome, nodi, [{ testo: "↩ Torna al museo", cls: "btn-primario", fn: museo }]);
    }
    function museo() {
      var nodi = [el("p", "sv-frase", "Il primo di ogni reperto entra nel museo. Completa un'epoca: +🪙 " + cifre(PREMIO_EPOCA) + ". Tocca un reperto per leggere la sua storia.")], tot = 0;
      EPOCHE.forEach(function (ep) {
        var lista = REPERTI.filter(function (x) { return x.epoca === ep.id; }), presi = lista.filter(function (x) { return D.album[x.id]; }).length; tot += presi;
        nodi.push(el("div", "sv-sottot", ep.ico + " " + ep.nome + " · " + presi + "/" + lista.length + (D.premi[ep.id] ? " ✓" : "")));
        Object.keys(DINO).forEach(function (k) {   // lo scheletro: montato se è completo, se no in ombra coi pezzi che mancano
          var dn = DINO[k]; if (PER_ID[dn.pezzi[0]].epoca !== ep.id) return;
          var fatto = !!D.premi[k], box = el("div", "sv-voce sv-grande" + (fatto ? "" : " buio")), im = el("img", "sv-arte"); im.alt = "";
          im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgArte(k, 100, !fatto)); box.appendChild(im);
          box.appendChild(el("b", null, "🦖 Scheletro del " + dn.nome)); box.appendChild(el("small", null, fatto ? "Completo! Montato nel museo" : pezziTrovati(k) + "/" + dn.pezzi.length + " pezzi · premio 🪙 " + cifre(dn.premio)));
          if (fatto) { box.classList.add("tocca"); box.onclick = function () { scheda(k); }; }
          nodi.push(box);
        });
        var g = el("div", "sv-album");
        lista.forEach(function (x) {
          var a = D.album[x.id], v = el("div", "sv-voce r" + x.r + (a ? "" : " buio"));
          v.appendChild(tela(x.id, 54, a ? a.top : null, !a)); v.appendChild(el("b", null, a ? x.nome : "???")); v.appendChild(el("small", null, a ? etichettaR(x) + (a.top < 100 ? " · " + a.top + "%" : " · intatto") : etichettaR(x)));
          if (a) { v.classList.add("tocca"); v.onclick = function () { scheda(x.id); }; }
          g.appendChild(v);
        });
        nodi.push(g);
      });
      finestra("🏛️ Museo · " + tot + "/" + REPERTI.length, nodi, [{ testo: "Chiudi", cls: "btn-primario", fn: chiudiSopra }], "sv-lista");
      if (scrollMuseo && sopra.firstChild) { sopra.firstChild.scrollTop = scrollMuseo; scrollMuseo = 0; }   // tornando dalla scheda, il museo è dove l'avevi lasciato
    }
    function zaino() {
      var nodi = [];
      if (!D.zaino.length) nodi.push(el("p", "sv-frase", "Lo zaino è vuoto. I reperti che tieni finiscono qui: li puoi vendere quando vuoi."));
      var l = el("div", "sv-zaino"), tot = 0;
      D.zaino.forEach(function (o, i) {
        var v = valoreDi(o.id, o.integro); tot += v;
        var r = el("div", "sv-riga"); r.appendChild(tela(o.id, 34, o.integro)); r.appendChild(el("span", null, PER_ID[o.id].nome + (o.integro < 100 ? " (" + o.integro + "%)" : "")));
        var b = el("button", "sv-vendi", "🪙 " + cifre(v)); b.onclick = function () { D.zaino.splice(i, 1); if (opts.cambia) opts.cambia(v); suonoMonete(); vibra(10); salva(); aggTesta(); zaino(); }; r.appendChild(b);
        l.appendChild(r);
      });
      nodi.push(l);
      finestra("🎒 Zaino" + (D.zaino.length ? " · " + D.zaino.length + "/" + ZAINO_MAX : ""), nodi, [
        { testo: "Vendi tutto · 🪙 " + cifre(tot), cls: "btn-primario", off: !D.zaino.length, fn: function () { if (opts.cambia) opts.cambia(tot); D.zaino = []; suonoMonete(); salva(); aggTesta(); chiudiSopra(); dimmi("Venduto tutto! +🪙 " + cifre(tot)); } },
        { testo: "Chiudi", fn: chiudiSopra }], "sv-lista");
    }
    function compraColpi() {
      var ok = monete() >= PACCO.prezzo;
      finestra("⛏️ Colpi", [el("p", "sv-frase", "Ogni giorno hai " + COLPI_GIORNO + " colpi gratis (tornano a mezzanotte). Ne hai ancora " + colpi() + ".")],
        [{ testo: "Compra " + PACCO.n + " colpi · 🪙 " + cifre(PACCO.prezzo), cls: "btn-primario", off: !ok, fn: function () { if (monete() < PACCO.prezzo) return; if (opts.cambia) opts.cambia(-PACCO.prezzo); D.extra += PACCO.n; salva(); suonoMonete(); aggTesta(); chiudiSopra(); dimmi("+" + PACCO.n + " colpi ⛏️"); } },
         { testo: "Chiudi", fn: chiudiSopra }]);
    }
    function finitiColpi() {
      var ok = monete() >= PACCO.prezzo;
      finestra("Colpi finiti ⛏️", [el("p", "sv-frase", "Per oggi i " + COLPI_GIORNO + " colpi gratis sono finiti: tornano a mezzanotte. Il campo resta così, lo ritrovi domani." + (rimasti() ? " Qui sotto ci sono ancora " + rimasti() + " cose sepolte…" : ""))],
        [{ testo: "Compra " + PACCO.n + " colpi · 🪙 " + cifre(PACCO.prezzo), cls: "btn-primario", off: !ok, fn: function () { if (monete() < PACCO.prezzo) return; if (opts.cambia) opts.cambia(-PACCO.prezzo); D.extra += PACCO.n; salva(); suonoMonete(); aggTesta(); chiudiSopra(); } },
         { testo: "Va bene", fn: chiudiSopra }]);
    }

    function chiudi() { cancelAnimationFrame(anim); cancelAnimationFrame(animF); window.removeEventListener("resize", misura); }
    function esci() {
      if (fossa.classList.contains("su") && !finita) { dimmi("Finisci prima di tirare fuori il reperto (o tocca \"Basta così\")"); return; }
      chiudi(); salva(); if (opts.indietro) opts.indietro();
    }
    s._monta = function () {
      misura(); aggTesta();
      if (D.inCorso && st(D.inCorso.r, D.inCorso.c) === 4) { occupato = true; parla("Avevi lasciato un reperto a metà: tiriamolo fuori!"); setTimeout(function () { apriFossa(D.inCorso.id); }, 500); }
      else if (!rimasti()) campoNuovo();
      else if (!D.tot) parla("Tocca un quadrato e il tuo avatar scava. ❌ = niente intorno, ✅ = qualcosa vicino.");
      else parla(colpi() > 0 ? "Bentornato! " + (opts.illimitati ? "Per te i colpi sono illimitati. " : "Hai " + colpi() + " colpi. ") + (indizio && !st(indizio.r, indizio.c) ? "Vedi quel coccio per terra? Lì vicino c'è qualcosa." : "Scava dove vuoi.") : "Colpi finiti per oggi: tornano a mezzanotte.");
      anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
    };
    s._chiudi = chiudi;
    window.__scavi = { D: D, get nascosti() { return nascosti; }, av: av, scava: function (r, c) { vaiAScavare({ r: r, c: c }); }, colpisci: colpisci, fossa: function (id) { apriFossa(id); }, ogg: function () { return ogg; }, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); } };   // (per le prove)
    return s;
  }

  // ---------- lo stile (una volta sola, prefisso sv-) ----------
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.sv-vista{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;position:relative;background:#e8cd98;user-select:none;-webkit-user-select:none}",
      ".sv-tela{position:absolute;inset:0;width:100%;height:100%;touch-action:none}",
      ".sv-testa{position:absolute;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:3;display:flex;align-items:center;gap:6px}",
      ".sv-tasto{flex:none;width:38px;height:38px;border:0;border-radius:12px;cursor:pointer;font:inherit;font-size:1.3rem;font-weight:900;color:#fff;background:rgba(58,38,22,.55)}",
      ".sv-nome{flex:1;min-width:0;font-weight:900;font-size:1.02rem;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sv-chip{flex:none;height:34px;padding:0 10px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.92rem;color:#fff;background:rgba(58,38,22,.6)}",
      ".sv-giu{position:absolute;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:3;display:flex;gap:8px;justify-content:center}",
      ".sv-bott{flex:1;max-width:160px;height:44px;border:0;border-radius:14px;cursor:pointer;font:inherit;font-weight:900;font-size:.92rem;color:#fff;background:rgba(58,38,22,.66);box-shadow:inset 0 0 0 1.5px rgba(255,236,200,.35)}",
      ".sv-prof{position:absolute;left:10px;right:10px;bottom:calc(62px + env(safe-area-inset-bottom));z-index:3;margin:0 auto;max-width:420px;padding:6px 12px 7px;border-radius:14px;font-weight:800;font-size:.8rem;line-height:1.28;color:#3a2616;background:rgba(255,248,234,.94);box-shadow:0 4px 12px rgba(0,0,0,.2),inset 0 0 0 2px #c9a46e;pointer-events:none}",
      ".sv-prof b{display:block;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:#9a6a3c}",
      ".sv-prof.su{animation:svProf .35s cubic-bezier(.3,1.5,.5,1)}@keyframes svProf{from{transform:scale(.92);opacity:.4}}",
      ".sv-avviso{position:absolute;left:50%;top:calc(54px + env(safe-area-inset-top));z-index:5;transform:translateX(-50%);max-width:92%;padding:8px 14px;border-radius:999px;text-align:center;font-weight:900;font-size:.88rem;color:#3a2200;background:#ffe066;box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;pointer-events:none}",
      ".sv-avviso.su{animation:svAvv 2.6s ease forwards}@keyframes svAvv{0%{opacity:0;transform:translate(-50%,8px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}82%{opacity:1}100%{opacity:0}}",
      ".sv-fossa{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:calc(12px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));background:radial-gradient(ellipse at 50% 30%,#6b4a2c,#2b1a0e);opacity:0;pointer-events:none;transition:opacity .3s}",
      ".sv-fossa.su{opacity:1;pointer-events:auto}",
      ".sv-fintesta{display:flex;align-items:center;gap:10px;width:100%;max-width:440px;color:#fff3d6}",
      ".sv-faccia{width:52px;height:52px;border-radius:50%;background:#f6e7c8;box-shadow:0 0 0 3px #c9a46e;object-fit:cover}",
      ".sv-ftit b{display:block;font-weight:900;font-size:1.05rem}.sv-ftit small{font-weight:700;font-size:.78rem;color:#e9c98e}",
      ".sv-ftela{display:block;border-radius:10px;box-shadow:0 0 0 3px #4a2e18,0 6px 0 #1f130a,inset 0 0 20px rgba(0,0,0,.4);touch-action:manipulation}",
      ".sv-barre{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:440px}",
      ".sv-barra{padding:6px 8px;border-radius:10px;background:#fff8ea;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#3a2616}",
      ".sv-barra span{display:block;height:10px;margin-top:4px;border-radius:6px;background:#e3d3b4;overflow:hidden}.sv-barra i{display:block;height:100%;width:0;border-radius:6px;transition:width .2s}",
      ".sv-frana i{background:linear-gradient(90deg,#e3b23c,#d4572e)}.sv-intatto i{background:linear-gradient(90deg,#6cbf5a,#3f9c4a)}",
      ".sv-attrezzi{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:440px}",
      ".sv-attrezzo{display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 6px;border:3px solid #5b3a21;border-radius:14px;cursor:pointer;font:inherit;color:#3a2616;background:#fff8ea;box-shadow:0 4px 0 #5b3a21}",
      ".sv-attrezzo span{font-size:1.5rem;line-height:1}.sv-attrezzo b{font-size:.95rem}.sv-attrezzo small{font-size:.68rem;font-weight:700;color:#9a6a3c}",
      ".sv-attrezzo.on{background:#ffe08a;transform:translateY(2px);box-shadow:0 2px 0 #5b3a21}",
      ".sv-basta{border:0;background:none;cursor:pointer;font:inherit;font-weight:800;font-size:.85rem;color:#f6e7c8;text-decoration:underline}",
      ".sv-sopra{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(30,18,8,.55);opacity:0;pointer-events:none;transition:opacity .25s}",
      ".sv-sopra.su{opacity:1;pointer-events:auto}",
      ".sv-carta{width:100%;max-width:340px;max-height:calc(var(--alt,100dvh) - 40px);overflow:auto;padding:16px 14px;border-radius:20px;text-align:center;color:#3a2616;background:#fff8ea;box-shadow:0 10px 0 #5b3a21,0 18px 40px rgba(0,0,0,.45),inset 0 0 0 3px #c9a46e;animation:svGira .5s cubic-bezier(.3,1.4,.5,1)}",
      "@keyframes svGira{from{transform:rotateY(80deg) scale(.85);opacity:.3}}",
      ".sv-carta h2{margin:4px 0 6px;font-size:1.3rem;font-weight:900}",
      ".sv-fig{display:flex;justify-content:center;padding:6px 0;border-radius:50%;margin:0 auto;width:170px;background:radial-gradient(circle,#fff3d6,#ead2a4 70%,rgba(234,210,164,0) 72%)}",
      ".sv-fig.r4{background:radial-gradient(circle,#f3d9fa,#d0a4e6 70%,rgba(208,164,230,0) 72%)}.sv-fig.r5{background:radial-gradient(circle,#fff3bf,#f6c84c 70%,rgba(246,200,76,0) 72%)}",
      ".sv-rar{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:999px;font-weight:900;font-size:.75rem;color:#fff}",
      ".sv-epoca{margin-top:6px;font-weight:800;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#9a6a3c}",
      ".sv-stato{margin:8px 0 0;font-weight:800;font-size:.92rem}",
      ".sv-nuovo{margin-top:6px;font-weight:900;color:#2f9e44}",
      ".sv-extra{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px}.sv-extra span{padding:4px 9px;border-radius:999px;font-size:.78rem;font-weight:800;background:#f1e3c2}",
      ".sv-frase{margin:6px 0 0;font-size:.92rem;line-height:1.4;font-weight:700}",
      ".sv-nota{margin:8px 0 0;font-size:.78rem;font-weight:700;color:#9a6a3c}",
      ".sv-tasti{display:flex;flex-direction:column;gap:8px;margin-top:14px}",
      ".sv-carta .btn-fantasma{color:#5b3a21;background:#f6ead0;box-shadow:inset 0 0 0 2px #c9a46e}",
      ".sv-lista{max-width:380px}",
      ".sv-sottot{margin:12px 0 4px;font-weight:900;font-size:.85rem;color:#9a6a3c;text-align:left}",
      ".sv-album{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}",
      ".sv-voce{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 3px;border-radius:12px;background:#f6ead0;min-height:96px}",
      ".sv-voce.r3{box-shadow:inset 0 0 0 1.5px #1c7ed6}.sv-voce.r4{box-shadow:inset 0 0 0 1.5px #9c36b5}.sv-voce.r5{box-shadow:inset 0 0 0 2px #f59f00}",
      ".sv-arte{display:block;object-fit:contain}",
      ".sv-grande{margin:4px 0 6px;padding:8px}.sv-grande .sv-arte{width:100%!important;height:auto!important;aspect-ratio:600/360}",
      ".sv-scheletro{width:100%!important;border-radius:16px!important;background:radial-gradient(ellipse,#fff3d6,#ead2a4 75%)!important}.sv-scheletro .sv-arte{width:100%;height:auto}",
      ".sv-storia{margin:10px 0 2px;padding:9px 11px;border-radius:12px;text-align:left;font-size:.86rem;line-height:1.42;font-weight:600;color:#4a3220;background:#f3e3c2;box-shadow:inset 0 0 0 1.5px #d9bb88}.sv-storia::before{content:\"📜 \"}",
      ".sv-voce.tocca,.sv-grande.tocca{cursor:pointer;transition:transform .12s}.sv-voce.tocca:active,.sv-grande.tocca:active{transform:scale(.95)}",
      ".sv-dino{margin-top:6px;padding:4px 10px;display:inline-block;border-radius:999px;font-weight:900;font-size:.8rem;color:#fff;background:#8d6e3f}",
      ".sv-voce b{font-size:.68rem;line-height:1.15}.sv-voce small{font-size:.6rem;line-height:1.2;color:#9a6a3c}.sv-voce.buio{opacity:.8}",
      ".sv-zaino{display:flex;flex-direction:column;gap:6px;margin-top:8px;text-align:left}",
      ".sv-riga{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:12px;background:#f6ead0;font-size:.85rem;font-weight:800}",
      ".sv-riga span{flex:1;min-width:0}",
      ".sv-vendi{flex:none;height:32px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;font:inherit;font-weight:900;font-size:.8rem;color:#3a2200;background:#ffe066}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function stato(d) {   // i colpi gratis di oggi, solo dai dati salvati (per gli avvisi in città, senza aprire gli scavi)
    var c = d && d.colpi; return { max: COLPI_GIORNO, gratis: c && c.g === oggi() ? Math.max(0, COLPI_GIORNO - (c.usati || 0)) : COLPI_GIORNO, extra: (d && d.extra) || 0 };
  }
  window.SGScavi = { crea: crea, stato: stato, REPERTI: REPERTI, disegnaReperto: disegnaReperto, tela: tela };
})();
