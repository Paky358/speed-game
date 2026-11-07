/* =========================================================
   SPeeD GAME — AVATAR «ILLUSTRATO» (strada A, 5 nov 2026)
   Lo stesso avatar di ognuno (stessa configurazione salvata), disegnato come un'illustrazione vera:
   proporzioni di una persona, occhi naso e bocca veri, capelli a ciocche, luce morbida e volumi
   (braccia e gambe come cilindri: luce a sinistra, ombra a destra). SVG col codice, niente immagini.
   Si accende con SGOmino.stile("illustrato") (lo decide core.js, interruttore AVATAR_A).
   Il disegno sta nello stesso riquadro di sempre (200×264, piedi a y 252): i giochi non cambiano.
   Le pose che non sono ancora ridisegnate (seduto, di spalle) le fa ancora il disegno di prima.

   I PEZZI (capelli, cappelli, vestiti, scarpe, bocche, barbe…) si registrano qui sotto e nei file
   dei pezzi con SGOminoA.pezzo("capelli", "corti", function (K) { … }). K = tutto quello che serve
   per disegnare (colori, misure del corpo e della testa, aiuti). Un pezzo che non c'è ancora prende
   quello «simile» (SGOminoA.SIMILI), così ognuno resta riconoscibile finché non arriva il suo.

   PIÙ LEGGERO (5 nov 2026): stesso disegno scritto con meno testo e meno elementi (−22% di testo, schermata −11%).
   - K.cr / K.limb / K.liscio scrivono la prima curva assoluta e le altre RELATIVE («c», «s» quando il punto di controllo
     è il riflesso del precedente): stessi punti di prima. Nei pezzi: non spostare i numeri di quei percorsi con un replace.
   - K.soft(col, op) è un segnaposto: dentro K.El / K.ElR diventa un gradiente per colore + fill-opacity (un gradiente solo
     per colore invece di uno per colore e intensità). Usato altrove funziona lo stesso (si aggiunge il gradiente di prima).
   - stroke-linejoin='round' sta UNA volta sull'<svg> (si eredita): K.St non lo ripete (stroke-linecap='round' sì).
     Un tratto che vuole spigoli vivi lo scrive: stroke-linejoin='miter'.
   - ritagli e gradienti uguali si scrivono una volta sola; numeri corti (".5", "10-4"); un pezzo solo di dipingi = un elemento.

   TERZO TEMPO (6 nov 2026). Il proprietario: «troppo secchi e lunghi», «la mano che tiene il microfono è tutta strana».
   - LE PROPORZIONI: A.PROPORZIONE = "attuale" (com'era) | "A" | "B" | "C" (vedi PROPORZIONI più sotto). I pezzi non cambiano:
     il motore allarga (BUILD), ingrandisce e abbassa la testa (HT), allunga le braccia, accorcia le gambe a FASCE (<use>, come
     la posa seduta) e ingrandisce tutto intorno ai piedi. I gesti portano le mani dove erano nel riquadro (taglio «vita» e tavoli
     dei giochi invariati); busto e viso tengono la testa al posto di prima. SGOmino.svg(cfg, { proporzione: "B" }) per un disegno solo.
   - LA MANO CHE IMPUGNA («impugna»): il pugno che stringe davvero un manico (il manico passa DENTRO: si vede sopra il pollice e
     sotto il mignolo). Per i pezzi «inmano» che lo dichiarano: A.impugna[voce] = { inclina: gradi, posa: "davanti"|"petto"|"alto"|"fianco" }
     (letto PRIMA di disegnare: la posa del braccio) e K.presa = { x, y, k, inclina, qui(svg, inclina?), foro, alto, posa, ang }:
     il pezzo disegna nelle coordinate della presa con K.presa.qui(svg) (0,0 = centro del pugno, manico lungo y, la cima verso
     y negativi, unità della mano) e restituisce { dietro (prima della mano: il manico e la cosa), davanti (sopra le dita), inclina? }.
     I pezzi di prima (senza A.impugna e senza inclina) restano come erano (pugno e dita loro).
   - BRACCIA E MANI PIÙ VIVE: a riposo il gomito appena piegato e il braccio un po' staccato, la mano rilassata con le dita
     piegate; le mani appoggiate (tavolo, cosce) con le dita unite e della misura giusta; un braccio che passa davanti al corpo
     va sopra collane, sciarpe e tracolle.
   - RITOCCHI DOPO IL CRITICO (6 nov 2026, notte). Le proporzioni B non cambiano.
     · CORPORATURE (BUILD, GAMBA): lui a V (spalle larghe, anche strette), lei a clessidra (spalle strette, vita stretta, anche e cosce
       più piene); snello davvero sottile, medio un filo più pieno; robusto con le braccia che si assottigliano verso il polso.
       I pezzi leggono K.B: si adattano da soli.
     · LE MANI DEI GESTI (maniNuove): pugno con le nocche, le dita piegate e il pollice che le chiude (esulta, leva, batte, carte, canna);
       indice teso (preme); mano aperta con le dita affusolate e un po' aperte (saluta, su); «dorso» = la mano distesa vista dal dorso con
       le unghie (posa, tavolo); «piatta» = la stessa più corta (seduto, cose appoggiate); «batti» = la mano di lato (applaude: le punte si
       toccano, i polsi non si incrociano più). La mano lungo il fianco ha il pollice staccato, le nocche e l unghia.
     · IL PONTE DEL POLSO (manoSvg): dalla fine dell avambraccio alla mano, largo come il braccio all inizio e come la mano alla fine:
       niente più gradino a «polsino» né spigoli quando il polso si piega. Ogni forma comincia stretta (mezza larghezza 10 a y -2).
       Contratto delle forme: p (riempimenti; il contorno è lo stesso senza la chiusura in alto), l (pieghe), b (linee col colore del
       bordo, sopra), n (luci delle nocche), u (unghie), w8 (mezza larghezza a y 8, per il ponte).
     · GESTI: leva col gomito giù e l avambraccio dritto in su (campo «ang» = angoli invece del punto, come la canna); tavolo con la mano
       che segue l avambraccio; carte della misura di una mano (prima una volta e mezza).
   - GIRO 3 DOPO IL SECONDO CRITICO (6 nov 2026). Le proporzioni B non cambiano.
     · CORPORATURE PIÙ DISTANTI (BUILD): snello sottile davvero, medio più pieno, robusto più largo; lui a V, lei a clessidra.
       La mano segue il polso ma meno (B.km, radice): lo snello non ha le mani minuscole.
     · IL GOMITO PIEGATO FORTE (più di 100°): braccio e avambraccio sono due pezzi sovrapposti (PIEGA), l avambraccio sopra col suo
       bordo; prima l interno del gomito si tagliava: cuneo vuoto tra braccio e avambraccio (il microfono al petto), leva storta.
     · MANI: il pugno con quattro dita vere (gobbe, incavi, righe tra le dita «s», la piega delle punte, il pollice con l unghia);
       la mano appoggiata (Black Jack, seduti) col dorso corto e le dita separate con le unghie (non più una paletta).
     · POSA «petto» (microfono, telefono, libro) più giù e più avanti: il microfono non tocca più il mento.
     · IL BRACCIO STACCATO GIRATO: il bordo sfuma verso la spalla (maschera tonda sul perno) e la luce della spalla è tonda e centrata:
       girando, la manica resta attaccata alla spalla (prima c era una riga che la staccava e una «palla» sulla spalla); gli orli delle
       maniche della maglietta passano da suManica (nel corpo senza quel braccio restava una riga per aria).
     · IL BRACCIO STACCATO (parte: "braccio"): prende del vestito solo la manica (agioBr = agio + svasa della manica più larga di quel
       braccio, segnata da K.manica); senza maniche niente vestito sul braccio. Prima un contorno largo 46 si portava dietro un pezzo
       del busto (spalline, scollo, bretelle del top) che girando il braccio si spostava: si vedeva il salto.
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGOminoA = { capelli: {}, cappelli: {}, capo: {}, sotto: {}, scarpe: {}, bocca: {}, barba: {}, segno: {}, stampa: {}, extra: {}, inmano: {},
    occhiali: {}, orecchini: {}, collo: {}, borsa: {}, mano: {}, schiena: {}, animale: {}, pittura: {}, impugna: {} };
  A.pezzo = function (tipo, nome, fn) { (A[tipo] = A[tipo] || {})[nome] = fn; };
  // I RITOCCHI DEI VESTITI (6 nov 2026, chat «👕 Avatar: vestiti e mani», dopo le 4 tavole): ogni cambio di disegno che tocca gli avatar già salvati
  // sta dietro una chiave. Con tutte a 0 il disegno è IDENTICO a prima, byte per byte (la prova costruzione/identici.js); una chiave a 0 = la sicura.
  //   vestito: col «vestito» e il «vestito lungo» non si disegna il sotto (gambe nude: prima i jeans restavano sotto e sembrava un errore);
  //            col cappotto i pantaloni restano. In piedi, seduto, di spalle.
  //   scarpe:  scarpe più grandi e leggibili sul fondo scuro (pianta più grande, punta più piena, suola più chiara) e l'orlo dei pantaloni lunghi
  //            più su, sopra la scarpa (prima la copriva fino ai lacci). Tutti i 13 modelli, tutte le pose.
  //   collo:   collane, perle, ciondolo, catena, medaglia, papillon, foulard, sciarpa, fischietto, orecchini più grandi e leggibili a corpo intero.
  //   mani:    le mani nuove a 5 dita (Tavola 4, serie B): ogni dito è un pezzo vero, tondo in punta, con l'unghia; il pollice più corto e più
  //            grosso, attaccato vicino al polso. Tutte le mani (a riposo, aperta, saluta, pugno, indica, sul tavolo, che batte, che impugna),
  //            di spalle, il braccio staccato; sulla pelle scura le dita si separano con un filo di luce. Saluta e applaude cambiano un poco posto.
  //   cravatta: la cravatta lunga fino alla fibbia della cintura (Tavola 4, D): nodo piccolo, ali del colletto sopra, lama che si allarga;
  //            col gilet e col cappotto passa sotto; la giacca si apre a V fino al bottone e la cravatta si vede solo lì (K.cravattaV).
  //   moda:    i capi «gemelli» rifatti in stile Moda (Tavola 1, colonna «Moda»): felpa col cappuccio vero, maglione da pescatore, camicia
  //            infilata con le maniche arrotolate, giacca sartoriale, il bomber diventa il CHIODO di pelle (la voce salvata resta «bomber»),
  //            jeans col risvolto, classici a sigaretta, cargo con le tasche a soffietto. Le voci sono quelle di sempre (in omino-a-pezzi.js,
  //            sezione «I CAPI MODA»): a 0 tornano i disegni di prima.
  A.RITOCCHI = { scarpe: 1, collo: 1, vestito: 1, mani: 1, cravatta: 1, moda: 1 };

  // ---------- aiuti ----------
  var H2R = {}, HEX = [];
  for (var i0 = 0; i0 < 256; i0++) HEX.push(("0" + i0.toString(16)).slice(-2));
  function h2r(h) { var k = H2R[h]; if (k) return k; var h0 = h; h = String(h).replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return (H2R[h0] = [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]); }   // (non modificare l'array: è in memoria)
  function hx(v) { v = Math.round(v); return v >= 0 && v <= 255 ? HEX[v] : ("0" + Math.max(0, Math.min(255, v)).toString(16)).slice(-2); }
  function r2h(r) { return "#" + hx(r[0]) + hx(r[1]) + hx(r[2]); }
  function mix(a, b, t) { var X = h2r(a), Y = h2r(b); return "#" + hx(X[0] + (Y[0] - X[0]) * t) + hx(X[1] + (Y[1] - X[1]) * t) + hx(X[2] + (Y[2] - X[2]) * t); }
  function lum(h) { var c = h2r(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function rnd(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function n1(v) { return Math.round(v * 10) / 10; }
  // (leggero, 5 nov 2026) gli stessi numeri di n1 scritti corti: ".5" invece di "0.5", "-.5" invece di "-0.5";
  // N(v) li mette in fila nei percorsi con lo spazio solo dove serve ("10-4", "1.5.5"); N(v, 1) = il primo dopo una lettera
  // (con i numeri interi: più veloce che scrivere un numero con la virgola)
  function q(v) { var k = Math.round(v * 10), neg = k < 0, a = neg ? -k : k, r = a % 10, i = (a - r) / 10; return r ? (neg ? "-" : "") + (i ? i : "") + "." + r : (neg ? "-" : "") + i; }
  var qP = false;   // l ultimo numero scritto da N aveva il punto
  function T(k, primo) { var neg = k < 0, a = neg ? -k : k, r = a % 10, i = (a - r) / 10, sp = primo || neg || (!i && r && qP) ? "" : " "; qP = r !== 0; return sp + (r ? (neg ? "-" : "") + (i ? i : "") + "." + r : (neg ? "-" : "") + i); }   // k = decimi interi
  function N(v, primo) { return T(Math.round(v * 10), primo); }
  // curva liscia che passa per i punti (Catmull-Rom → Bézier)
  function cr(p) {
    var s = "", px = 0, py = 0, qx = 0, qy = 0;   // (in decimi) il punto dove si è e l'ultimo punto di controllo
    for (var i = 0; i < p.length - 1; i++) {
      var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c;
      var x1 = Math.round((b[0] + (c[0] - a[0]) / 6) * 10), y1 = Math.round((b[1] + (c[1] - a[1]) / 6) * 10), x2 = Math.round((c[0] - (d[0] - b[0]) / 6) * 10), y2 = Math.round((c[1] - (d[1] - b[1]) / 6) * 10), x = Math.round(c[0] * 10), y = Math.round(c[1] * 10);
      if (!i) s += "C" + T(x1, 1) + T(y1) + T(x2) + T(y2) + T(x) + T(y);
      else if (2 * px - qx === x1 && 2 * py - qy === y1) s += "s" + T(x2 - px, 1) + T(y2 - py) + T(x - px) + T(y - py);
      else s += "c" + T(x1 - px, 1) + T(y1 - py) + T(x2 - px) + T(y2 - py) + T(x - px) + T(y - py);
      px = x; py = y; qx = x2; qy = y2;
    }
    return s;
  }
  // forma rastremata lungo una linea: n = [[x, y, larghezza], …]; bulge = punta arrotondata
  function limb(n, bulge) {
    var L = [], R = [];
    for (var i = 0; i < n.length; i++) {
      var a = n[Math.max(0, i - 1)], b = n[Math.min(n.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = n[i][2] / 2;
      L.push([n[i][0] + nx * w, n[i][1] + ny * w]); R.push([n[i][0] - nx * w, n[i][1] - ny * w]);
    }
    var Rr = R.slice().reverse(), e = L.length - 1;
    var s0 = "M" + N(L[0][0], 1) + N(L[0][1]) + cr(L);   // (in ordine: N ricorda l'ultimo numero scritto)
    s0 += bulge ? "Q" + N((L[e][0] + Rr[0][0]) / 2 + (n[e][0] - n[e - 1][0]) * bulge, 1) + N((L[e][1] + Rr[0][1]) / 2 + (n[e][1] - n[e - 1][1]) * bulge) + N(Rr[0][0]) : "L" + N(Rr[0][0], 1);
    return s0 + N(Rr[0][1]) + cr(Rr) + "Z";
  }
  // (ritocchi) i due lati di una forma di limb (per il contorno senza i bordi in cima e in fondo)
  function latiLimb(n) {
    var L = [], R = [];
    for (var i = 0; i < n.length; i++) {
      var a = n[Math.max(0, i - 1)], b = n[Math.min(n.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = n[i][2] / 2;
      L.push([n[i][0] + nx * w, n[i][1] + ny * w]); R.push([n[i][0] - nx * w, n[i][1] - ny * w]);
    }
    return [L, R];
  }
  function poli(p) { var s = "M", px = 0, py = 0; for (var i = 0; i < p.length; i++) { var x = Math.round(p[i][0] * 10), y = Math.round(p[i][1] * 10); s += i ? "l" + T(x - px, 1) + T(y - py) : T(x, 1) + T(y); px = x; py = y; } return s + "Z"; }
  function liscio(p) { return "M" + N(p[0][0], 1) + N(p[0][1]) + cr(p); }   // linea liscia aperta
  function lisciaChiusa(p) { var z = p.concat([p[0]]); return "M" + N(p[0][0], 1) + N(p[0][1]) + cr(z) + "Z"; }
  var DEG = Math.PI / 180;

  // ---------- le tabelle (stesse voci dell'editor di sempre) ----------
  // corporature (mezze larghezze, mondo 400×1000): collo, attaccatura delle spalle, spalla, ascella, petto, vita, fianchi; braccio [spalla, gomito, avambraccio, polso]; lw = gambe
  // (ritocchi del terzo tempo, 6 nov 2026) le corporature più diverse: lui a V (spalle larghe, anche strette), lei a clessidra (spalle
  // strette, vita stretta, anche larghe); snello davvero sottile (spalle, vita, braccia, gambe), medio un filo più pieno; robusto con le
  // braccia che si assottigliano verso il polso (prima erano grosse uguali fino in fondo, «a sacco») e mani non più enormi.
  // (giro3, 6 nov 2026, dopo il critico: «snello e medio quasi identici, lui e lei poco») le distanze tra le corporature allargate:
  // snello sottile davvero (petto, vita, fianchi, braccia e gambe; le spalle un po' meno, se no la testa sembra un lecca-lecca),
  // medio più pieno, robusto più largo; lui a V (spalle larghe, vita e anche strette, braccia più grosse), lei a clessidra
  // (spalle strette, vita sottile, anche e cosce piene, braccia sottili). Le mani crescono MENO delle braccia (kMano).
  var BUILD = {
    uomo: { snello: { nk: 23, shx: 64, sho: 85, ap: 62, ch: 57, wt: 46, hp: 52, aw: [30.5, 23.5, 25.5, 21.5], lw: 0.72 },
            medio: { nk: 30.5, shx: 85, sho: 113, ap: 91, ch: 90, wt: 76, hp: 74, aw: [49, 39.5, 41.5, 30.5], lw: 1.02 },
            robusto: { nk: 36, shx: 97, sho: 129, ap: 108, ch: 112, wt: 114, hp: 106, aw: [68, 53, 56, 35.5], aws: 57, lw: 1.3, pancia: 1 } },
    donna: { snello: { nk: 16.5, shx: 47, sho: 64, ap: 50, ch: 52, wt: 36, hp: 63, aw: [23, 18.5, 20, 17], lw: 0.72, seno: 0.7 },
             medio: { nk: 19.5, shx: 55, sho: 75, ap: 61, ch: 70, wt: 48, hp: 83, aw: [31, 24.5, 26.5, 21.5], lw: 1.1, seno: 1.12 },
             robusto: { nk: 24, shx: 66, sho: 89, ap: 79, ch: 95, wt: 75, hp: 105, aw: [56, 43, 46, 28.5], aws: 41, lw: 1.3, seno: 1.42, pancia: 0.6 } }
  };
  // (g5, 6 nov 2026, dopo il critico: «lei medio coi pantaloncini ha i fianchi a campana e le gambe sottili», «seduta: le cosce sono due
  // palloni più larghi del busto», «lei robusto ha le braccia sottili rispetto al busto») lei resta a clessidra ma meno esagerata: fianchi
  // un po' più stretti (medio 89 → 83, robusto 112 → 105) e le cosce che non escono più dai fianchi (gambeDi); lei robusto con le braccia
  // più piene come lui robusto (il polso e la spalla tonda restano quelli di prima: aws, e la mano della stessa misura). Lui non cambia.
  ["uomo", "donna"].forEach(function (s) { for (var k in BUILD[s]) { var a = BUILD[s][k].aw; BUILD[s][k].aw = [a[0] * 1.1, a[1] * 1.1, a[2] * 1.1, a[3] * 1.15]; } });   // (secondo tempo) braccia più piene
  // (g4, 6 nov 2026, dopo il critico: «robusto: le braccia escono larghe dal corpo e sono sottili rispetto al busto») il robusto ha le braccia
  // più grosse (braccio e avambraccio pieni, il polso un po meno: la mano segue il polso con la radice, kMano). aws = la larghezza del braccio
  // alla spalla per la spalla tonda (rc): resta quella di prima, così la spalla e i vestiti sulla spalla (giro manica della canotta, spallina)
  // non si spostano; sotto la spalla il braccio si allarga piano fino ad aw[0].
  ["uomo", "donna"].forEach(function (s) { for (var k in BUILD[s]) if (BUILD[s][k].aws) BUILD[s][k].aws *= 1.1; });
  // (giro3) la misura della mano (medio come prima: lui 1,206, lei 0,965): segue il polso ma MENO (radice): lo snello non ha le mani minuscole, il robusto non le ha enormi
  ["uomo", "donna"].forEach(function (s) { var K0 = s === "uomo" ? 1.206 : 0.965, m3 = BUILD[s].medio.aw[3]; for (var k in BUILD[s]) BUILD[s][k].km = K0 * Math.pow(BUILD[s][k].aw[3] / m3, 0.55); });
  // gambe: [y, distanza del centro della gamba dal centro, mezza larghezza fuori, mezza larghezza dentro]
  var GAMBA = {
    uomo: [[548, 35, 45, 36], [610, 35, 43, 34], [670, 36, 37, 29], [722, 37, 30, 25], [748, 38, 28, 24], [790, 39, 31, 27], [834, 40, 28, 28], [884, 42, 21, 20], [938, 44, 17, 16]],
    donna: [[548, 38.5, 49, 36], [610, 37.5, 46, 33], [670, 35, 38, 27], [722, 34, 28, 23], [748, 34, 26, 22], [790, 35, 29, 25], [834, 36, 26, 24], [884, 38, 19, 18], [938, 40, 15, 14]]
  };
  // (g5) le gambe di una corporatura: [y, centro, fuori, dentro] (la usano il disegno e la geometria).
  // - lei: la coscia non esce più dai fianchi (prima scendendo dai fianchi la linea si allargava ancora: «fianchi a campana»);
  // - seduti (sed): per tutti la coscia mai più larga dei fianchi, la coscia quasi dritta fino al ginocchio (vista da davanti viene verso
  //   chi guarda: il ginocchio, più vicino, non è più stretto della coscia) e sotto il ginocchio lo stinco che non si allarga più (prima il
  //   polpaccio schiacciato faceva un nodo: «ginocchia a bolla»). In piedi lui resta identico.
  var GAMBA_LIM = { 548: 1, 610: 0.97, 670: 0.93 }, GAMBA_SED = { 548: 1, 610: 0.98, 670: 0.96 };
  function gambeDi(m, B, sed) {
    var lw = B.lw, GN = GAMBA[m ? "uomo" : "donna"].map(function (q) { return [q[0], q[1] * (1 + (lw - 1) * 0.75), q[2] * lw, q[3] * lw]; });
    function lim(T) { GN.forEach(function (g) { var f = T[g[0]]; if (f && g[1] + g[2] > B.hp * f) g[2] = B.hp * f - g[1]; }); }
    if (!m) lim(GAMBA_LIM);
    if (!sed) return GN;
    lim(GAMBA_SED);
    var r = {}; GN.forEach(function (g) { r[g[0]] = g; });
    var g6 = r[610], g7 = r[670], g72 = r[722], gK = r[748], fo = function (g) { return g[1] + g[2]; };
    var kO = Math.max(fo(gK), fo(g6) * 0.9), kI = gK[1] - gK[3];   // il ginocchio: fuori e dentro
    gK[2] = kO - gK[1];
    g72[2] = Math.max(g72[2], (fo(g7) + kO) / 2 - g72[1]);
    GN.forEach(function (g) { if (g[0] > 748) { g[2] = Math.min(g[2], kO - 3 - g[1]); g[3] = Math.min(g[3], g[1] - kI - 2); } });
    return GN;
  }
  // forme del viso (testa: origine al mento, guance a y -78): cw guance, jx/jy angolo della mascella, cx mento, L altezza della fronte
  var FACCIA = {
    tondo: { cw: 56, jx: 48, jy: -27, cx: 23, L: 0.95 }, ovale: { cw: 53, jx: 42, jy: -23, cx: 16, L: 1 },
    squadrato: { cw: 55, jx: 51, jy: -19, cx: 25, L: 0.98, k1: 4 }, cuore: { cw: 57, jx: 35, jy: -21, cx: 9, L: 1.02 },
    lungo: { cw: 50, jx: 42, jy: -20, cx: 16, L: 1.1 }, paffuto: { cw: 59, jx: 54, jy: -30, cx: 28, L: 0.94 }
  };
  // occhi: sx/sy misura, tilt gradi (in su verso fuori), lid palpebra (0-0.6), lower = palpebra sotto
  var OCCHI = {
    tondi: { sx: 0.97, sy: 1.22 }, dolci: { sx: 1, sy: 1.08, tilt: -5, lid: 0.08 }, grandi: { sx: 1.16, sy: 1.3 },
    mandorla: { sx: 1.1, sy: 0.82, tilt: 7 }, felici: { felice: 1 }, furbi: { sx: 1.04, sy: 0.74, tilt: 5, lid: 0.26 },
    assonnati: { lid: 0.48, sy: 1 }, puntini: { sx: 0.8, sy: 0.86, piccola: 1 }, occhiolino: { occhiolino: 1 },
    ciglia: { ciglia: 2, sy: 1.08 }, felini: { tilt: 13, sy: 0.84, sx: 1.08, linea: 1 }, tristi: { tilt: -11, lid: 0.12 },
    stelline: { sx: 1.08, sy: 1.18, stelle: 1 }, chiusi: { chiusi: 1 }
  };
  // sopracciglia: w spessore, arc arco, dy alzate, iu interno in su (+) o in giù (-), picco (0-1)
  var SOPRA = {
    morbide: { w: 6, arc: 6 }, decise: { w: 8.4, arc: 5, iu: -1 }, alzate: { w: 6, arc: 9, dy: -6 }, sottili: { w: 3.6, arc: 6 },
    folte: { w: 11, arc: 4 }, arcuate: { w: 5.4, arc: 11, picco: 0.66 }, preoccupate: { w: 6.4, arc: 2, iu: 8 }, dritte: { w: 7, arc: 1 },
    unite: { w: 7.6, arc: 4, unite: 1 }, fini: { w: 2.4, arc: 7 }, arrabbiate: { w: 7.6, arc: 1, iu: -9 }, tagliate: { w: 7.4, arc: 5, taglio: 1 }
  };
  // naso: w larghezza, l lunghezza, punta, insu, gobba
  var NASO = {
    piccolo: { w: 0.86, l: 0.86, punta: 0.9 }, tondo: { w: 1.05, punta: 1.35 }, punta: { w: 0.86, l: 1.04, punta: 0.75, aguzzo: 1 },
    largo: { w: 1.3, punta: 1.15 }, insu: { insu: 1, l: 0.9 }, aquilino: { gobba: 1, l: 1.08 }, puntino: { w: 0.66, l: 0.62, punta: 0.7 },
    patata: { w: 1.24, punta: 1.6 }, lungo: { l: 1.22, w: 0.95 }, dritto: {}
  };

  // i pezzi non ancora ridisegnati: quello più simile (si aggiorna man mano che arrivano i pezzi veri)
  A.SIMILI = {
    capelli: { trecce: "treccia", codebasse: "codini", chignondoppio: "chignon", frangialunghi: "frangia", bobfrangia: "frangia", cresta: "undercut", surfista: "mossi", spike: "spettinati", banana: "ciuffo", treccine: "riccicorti", afroalto: "afrocorto", riccioletti: "riccicorti", ricciciuffo: "riccicorti",
      spazzola: "sfumato", caesar: "corti", codinouomo: "indietro", scodella: "corti", mullet: "spettinati",
      emo: "ciuffo", codinobasso: "indietro", anime: "spettinati", arruffati: "spettinati", dread: "riccicorti", rocker: "spettinati", afrocorto: "riccicorti",
      tendina: "caschetto", caschettolungo: "caschetto", ciuffolaterale: "pixie", scalati: "mossi", boccolimedi: "riccilunghi",
      riccibob: "caschetto", riccifrangia: "riccilunghi", bobasimmetrico: "caschetto", sfilato: "pixie",
      mezzacoda: "lunghi", chignonspettinato: "chignon", ricci: "riccilunghi", afro: "riccilunghi", lunghissimi: "lunghi", codalaterale: "coda",
      boccoli: "riccilunghi", rigalato: "lunghi", hime: "lunghi", tendinalunghi: "lunghi" },
    // vestiti
    capo: { lunga: "maglietta", felpa: "lunga", camicia: "lunga", canotta: "maglietta", polo: "maglietta", dolcevita: "lunga", giacca: "lunga", bomber: "lunga",
      calcio: "maglietta", gilet: "lunga", sportiva: "lunga", cappotto: "lunga", grembiule: "maglietta", supereroe: "lunga", crop: "maglietta", top: "maglietta",
      camicetta: "maglietta", cardigan: "lunga", maglione: "lunga", vestito: "maglietta", vestitolungo: "maglietta" },
    sotto: { strappati: "jeans", cargo: "pantaloni", mimetici: "pantaloni", tuta: "pantaloni", pantaloncini: "jeans", bermuda: "jeans", gonna: "jeans", gonnalunga: "jeans",
      leggings: "pantaloni", zampa: "jeans", shortsjeans: "jeans", minigonna: "jeans", gonnapieghe: "jeans", gonnatubino: "pantaloni" },
    scarpe: {}, cappelli: { tiara: "cerchietto", mago: "festa" }, bocca: {}, barba: {}
  };
  // il pezzo da disegnare per quella voce (il suo, o il più simile; per le scarpe e le bocche si ripiega sulla prima)
  var RIPIEGO = { capelli: "corti", capo: "maglietta", sotto: "jeans", scarpe: "sneakers", bocca: "neutro", barba: "accenno" };
  function pezzoDi(tipo, v) {
    var T = A[tipo] || {};
    if (T[v]) return { fn: T[v], nome: v };
    var s = (A.SIMILI[tipo] || {})[v], giri = 0;
    while (s && !T[s] && giri++ < 4) s = (A.SIMILI[tipo] || {})[s];
    if (s && T[s]) return { fn: T[s], nome: s };
    return RIPIEGO[tipo] && T[RIPIEGO[tipo]] ? { fn: T[RIPIEGO[tipo]], nome: RIPIEGO[tipo] } : null;
  }
  A.pezzoDi = pezzoDi;
  // c'è il disegno vero di questa voce? (l'editor nasconde quelle che non ci sono ancora)
  var VOCE_TIPO = { capelli: "capelli", capo: "capo", sotto: "sotto", modScarpe: "scarpe", cappello: "cappelli", bocca: "bocca", barba: "barba", segno: "segno", stampa: "stampa",
    occhiali: "occhiali", orecchini: "orecchini", collo: "collo", borsa: "borsa", mano: "inmano", schiena: "schiena", animale: "animale", pittura: "pittura" };
  A.disegnato = function (voce, v) {
    var t = VOCE_TIPO[voce]; if (!t) return true;
    if (v === "nessuno" || v === "nessuna" || v === "no") return true;
    if (voce === "capelli" && v === "calvo") return !!A.capelli.calvo;
    return !!(A[t] && A[t][v]);
  };
  // pose che il disegno nuovo sa fare (le altre: disegno di prima)
  A.puo = function (opts) { return true; };

  // ---------- i gesti (secondo tempo): dove va la mano, quanto si accorcia il braccio che viene avanti, che mano ----------
  // t(G) = [distanza dal centro dalla parte del braccio, quota] del polso; f = accorciamento (braccio e avambraccio che vengono
  // verso chi guarda); davanti = il braccio passa davanti al corpo. «uno» = solo il braccio di opts.lato (1 = a destra nel
  // disegno, di partenza), «due» = tutte e due.
  var GESTI = {
    // (le mani restano dentro il taglio «vita»: dalla testa alla vita, viewBox 46 11 108 118)
    saluta:   { uno: { t: function (G) { return [G.Jd + 56, G.Jy - 128]; }, mano: "aperta" } },
    // (ritocchi) le mani che battono si toccano in mezzo con la punta delle dita, i polsi restano separati (prima si incrociavano)
    applaude: { due: { t: function (G) { return [20, G.Y.petto - 4]; }, f: [0.96, 0.84], mano: "batti", davanti: 1, dirMano: 185 } },
    esulta:   { due: { t: function (G) { return [G.Jd + 56, G.Jy - 168]; }, mano: "pugno" } },
    posa:     { uno: { t: function (G) { return [24, G.Y.vita - 10]; }, f: [0.88, 0.76], mano: "dorso", davanti: 1 } },
    preme:    { uno: { t: function (G) { return [G.Jd * 0.42, G.Y.vita - 16]; }, f: [0.88, 0.8], mano: "indica", davanti: 1, dirMano: 8 } },
    // (ritocchi) la leva: il braccio di lato col gomito in giù e l avambraccio dritto in su, il pugno all altezza della spalla (tira una leva,
    // gira una ruota); prima il gomito andava in fuori e l avambraccio tornava indietro piegato. ang = gli angoli invece del punto (come la canna)
    leva:     { uno: { ang: [24, 162], f: [0.96, 0.84], mano: "pugno" } },
    batte:    { uno: { t: function (G) { return [G.Jd * 0.62, G.Y.vita - 30]; }, f: [0.9, 0.7], mano: "pugno", davanti: 1, dirMano: 0 } },
    // al tavolo (il tavolo copre dalla vita in giù): le due mani appoggiate davanti, e le carte tenute davanti al petto
    // (ritocchi) la mano vista dal dorso (dita unite, unghie) segue l avambraccio appoggiato e si piega appena in avanti, verso chi guarda
    // (prima il polso girava di colpo e la mano col pollice in fuori sembrava rovesciata)
    tavolo:   { due: { t: function (G) { return [G.Jd * 0.9, G.Y.vita - 24]; }, f: [0.94, 0.62], mano: "dorso", davanti: 1, polso: 30, schiaccia: 0.74 } },
    carte:    { due: { t: function (G) { return [24, G.Y.petto + 34]; }, f: [0.94, 0.76], mano: "pugno", davanti: 1, dirMano: 160, carte: 1 } }
  };
  A.GESTI = GESTI;
  // (6 nov 2026, ritocco «mani») con le mani nuove due gesti cambiano un poco: la mano che saluta (aperta, a 5 dita) più in alto e più in fuori,
  // le mani che battono un po' più giù e più girate. A.geometria li prende al posto di quelli sopra solo col ritocco acceso.
  var GESTI_MANI = {
    saluta:   { uno: { t: function (G) { return [G.Jd + 64, G.Jy - 160]; }, mano: "saluta" } },
    applaude: { due: { t: function (G) { return [25, G.Y.petto + 2]; }, f: [0.96, 0.84], mano: "batti", davanti: 1, dirMano: 192 } }
  };
  // (ritocchi del terzo tempo, 6 nov 2026) LE MANI DEI GESTI RIDISEGNATE: il pugno con le nocche, le dita piegate e il pollice che le
  // chiude; la mano aperta con le dita affusolate e un po' aperte; la mano appoggiata vista dal dorso (il pollice lungo il fianco, le
  // unghie); la mano che batte vista di lato. Coordinate della mano come in MANI (polso in 0,0, dita verso +y, +x = verso il corpo
  // col braccio giù). La cima di ogni forma è stretta (mezza larghezza 10 a y -2): il polso la copre col «ponte» (manoSvg), niente
  // più gradino tra braccio e mano. f = la forma piena (riempimento), il contorno è lo stesso percorso senza la chiusura in alto;
  // b = linee col colore del bordo (il pollice sopra le dita), l = pieghe, u = unghie (luce), n = nocche (luce), w8 = mezza larghezza a y 8.
  var MANI3 = null;
  function maniNuove() {
    if (MANI3) return MANI3;
    function aperto(pts) { return liscio(pts) + "Z"; }
    function dito(n, b) { return limb(n, b == null ? 0.75 : b); }
    // il pugno visto dal palmo: in fondo le quattro dita piegate (ognuna la sua gobba, con l incavo tra l una e l altra), il pollice
    // che parte dal lato esterno (-x) e le chiude passandoci sopra. (giro3) Il critico: «pugni senza forma come manopole, tondi senza
    // dita»: le dita ora sono quattro gobbe vere con le righe scure tra l una e l altra fin quasi al pollice, le punte piegate dentro il
    // palmo (la piega), il pollice col suo bordo e l unghia.
    var pugnoF = [[10, -2], [14.6, 6], [16.8, 16], [17.4, 25], [17.2, 31.4], [16.4, 35.8], [14.4, 39], [11.4, 40.4], [8.6, 39.6],
      [7.4, 41.6], [5, 43.4], [1.8, 43.6], [-0.4, 42],
      [-1.8, 44.2], [-4.8, 45.8], [-8, 45.2], [-9.8, 43.2],
      [-11.4, 45], [-14.6, 45.2], [-17, 42.6], [-18, 37.6], [-18.2, 30], [-17.8, 21], [-16.2, 10], [-13.8, 3], [-10, -2]];
    var pollN = [[-12.2, 9.4, 11.2], [-17.4, 15.4, 11], [-15.6, 21.8, 10.4], [-8.4, 25.6, 9.6], [-0.6, 25.8, 8.6], [4.2, 23.8, 7]];
    var polliceP = dito(pollN, 0.85), pollL = latiLimb(pollN);
    var polliceB = liscio(pollL[0].slice(1));
    // l indice teso (preme un tasto): il pugno senza la gobba dell indice, e il dito lungo
    var indicaF = [[10, -2], [14.4, 6], [16.4, 16], [16.8, 26], [16, 32.6], [13.6, 36.4], [10.8, 37.6], [8.6, 37], [6.4, 39.8], [3.6, 41.2], [0.6, 40.6],
      [-1.8, 42.4], [-5, 43], [-8.2, 42], [-8.8, 52], [-9.4, 63], [-10.8, 69.4], [-13.4, 71.2], [-15.8, 69.4], [-17, 62], [-17.4, 50], [-17.6, 36], [-17.6, 21], [-16, 10], [-13.6, 3], [-10, -2]];
    // la mano aperta (il palmo verso chi guarda, il pollice in fuori a -x)
    var palmoF = [[10, -2], [14.4, 6], [16.4, 16], [16.8, 25], [16.2, 30.4], [8, 31.6], [-2, 32], [-11.4, 31.2], [-15.6, 27], [-16.4, 18], [-15.4, 9], [-13, 3], [-10, -2]];
    var apertaP = [aperto(palmoF),
      dito([[13.2, 26.4, 8.2], [15.2, 38, 7.4], [16.8, 48.6, 6.4]]),
      dito([[5.6, 27.2, 8.8], [6.8, 43, 8], [7.8, 56.6, 6.8]]),
      dito([[-2.6, 27.6, 9.2], [-2.9, 45, 8.2], [-3.2, 60.6, 7]]),
      dito([[-10.6, 26.8, 8.8], [-12, 42, 7.8], [-13.4, 55, 6.8]]),
      dito([[-11.6, 7, 11.4], [-18.4, 17.4, 9.6], [-24, 27, 8.2], [-26.6, 32.6, 7]])];
    // la mano appoggiata vista dal dorso (BJ, seduto): (giro3) il critico: «palette senza dita leggibili con i polsi lunghi». Ora il dorso
    // è corto e le quattro dita sono dita vere (separate, con l incavo tra le punte, le righe scure e le unghie), lunghe quasi quanto il dorso
    // (le dita vengono verso chi guarda, si vedono un po' accorciate); il pollice lungo il fianco (+x)
    var piattaF = [[-10, -2], [-14.6, 6], [-16.8, 14], [-17.4, 22], [-16.6, 27.6], [-8, 28.6], [0, 29], [8, 28.6], [13.8, 26.6], [14.6, 16], [13.6, 6], [10, -2]];
    var piattaP = [aperto(piattaF), dito([[-13, 24, 8], [-13.5, 33, 7.6], [-13.8, 39.4, 7]]), dito([[-4.6, 25, 8.8], [-4.9, 36, 8.4], [-5.1, 43.6, 7.6]]),
      dito([[3.8, 25, 9], [3.9, 37, 8.6], [4, 45.4, 7.8]]), dito([[11.6, 24, 8.6], [12.2, 34, 8.2], [12.6, 41.2, 7.4]]), dito([[9.8, 7, 11], [15.6, 17, 9.4], [17.6, 25.6, 8.2], [17.4, 31.6, 7]], 0.8)];
    // la mano che batte, vista di lato (il pollice davanti, +x): stretta e lunga
    var battiF = [[-8.6, -2], [-11.4, 8], [-12.4, 22], [-12, 38], [-10.4, 52], [-7.6, 61.4], [-4.2, 64.6], [-1, 62.6], [0.8, 54], [2.6, 42], [5, 30], [8, 16], [10, 6], [9, -2]];
    var polliceL = dito([[6.4, 6, 10], [11.4, 17, 8.6], [13, 27, 7.2], [12.4, 32, 6.2]], 0.8);
    // la mano distesa vista dal dorso (appoggiata sulla pancia o sul tavolo): le dita unite, le unghie in fondo, il pollice lungo il fianco (+x)
    var dorsoF = [[-10, -2], [-14.4, 6], [-16.4, 16], [-16.8, 26], [-15.6, 32], [-8, 33], [0, 33.4], [8, 33], [14.6, 30], [15.4, 18], [14.2, 7], [10, -2]];
    var dorsoP = [aperto(dorsoF), dito([[-12.4, 28, 7.8], [-13, 40, 7.4], [-13.4, 48.6, 6.6]]), dito([[-4.4, 29, 8.6], [-4.6, 44, 8.2], [-4.8, 55.6, 7.2]]),
      dito([[3.8, 29, 8.8], [3.8, 45, 8.4], [3.8, 58.8, 7.4]]), dito([[11.4, 28, 8.4], [11.8, 42, 8], [12, 53.4, 7]]), dito([[10.6, 6, 11], [16.6, 16, 9.4], [19, 26.6, 8.2], [19.2, 33.6, 7]], 0.8)];
    MANI3 = {
      // (giro3) s = le righe tra le dita (col colore del bordo, più marcate delle pieghe: si leggono anche piccole)
      dorso: { p: dorsoP, b: [liscio([[12.6, 12], [15.2, 20], [16.2, 28], [16.2, 33.4]])],
        s: ["M-8.6 31.4C-8.6 37 -8.8 42 -9.2 46.6", "M-.4 32C-.4 39 -.6 46 -.8 52.6", "M7.8 31.8C7.8 39 7.9 45 8 50.6"], l: [],
        n: [[-12.4, 29.6], [-4.4, 30.8], [3.8, 31.2], [11.4, 30]], u: [[-13.4, 46, 2.3, 2.6], [-4.8, 52.8, 2.6, 2.9], [3.8, 55.8, 2.7, 3], [12, 50.8, 2.5, 2.8]], w8: 15 },
      pugno: { p: [aperto(pugnoF), polliceP], b: [polliceB],
        s: ["M8 40.6C8 36.4 8.1 32.6 8.6 28.4", "M-1.1 43.2C-1.1 38.6 -1 34.6 -.6 31", "M-10.6 44C-10.6 40.4 -10.5 36.4 -10.2 31.8"],
        l: ["M16.8 28.6C13.4 26.6 9.4 26.6 6 28"],
        n: [[12.6, 36.2], [3.4, 39.6], [-5, 41.4], [-14, 40.4]], u: [[2.6, 23.6, 2.3, 3]], w8: 15 },
      indica: { p: [aperto(indicaF), polliceP], b: [polliceB],
        s: ["M8.6 37.4C8.3 33.4 8.2 30.8 8.4 28.6", "M.6 41C.4 37 .4 33.6 .7 31"], l: ["M-9.6 55.6C-12 56.6 -14.6 56.6 -17 55.6"],
        n: [[12.4, 34.6], [3.8, 38.4], [-4.8, 40.2]], u: [[-13.2, 67, 2.4, 2.8], [2.6, 23.6, 2.3, 3]], w8: 15 },
      aperta: { p: apertaP, l: ["M16 21.6C9.6 18.6 2.4 18.8 -4.6 22.4", "M-8.8 5.6C-6.2 11.4 -6.6 17.6 -9.8 24.6", "M14.6 27.4C8 25.6 0 25.6 -8.2 27.4"], w8: 15 },
      piatta: { p: piattaP, b: [liscio([[11.4, 12], [13.8, 19], [14.8, 26], [14.6, 30.6]])],
        s: ["M-8.8 39.4C-8.9 34.6 -8.9 30.4 -8.8 26.4", "M-.4 43.4C-.4 37.6 -.4 32.4 -.4 27", "M7.9 42.4C8 36.8 8 31.6 7.8 26.6"], l: [],
        n: [[-13, 25.4], [-4.6, 26.6], [3.8, 26.8], [11.6, 25.6]], u: [[-13.8, 40.4, 2.4, 2.6], [-5.1, 44.6, 2.7, 2.9], [4, 46.4, 2.8, 3], [12.6, 42.2, 2.6, 2.8], [17.6, 32.4, 2.2, 2.4]], w8: 15 },
      batti: { p: [aperto(battiF), polliceL], b: [liscio([[7.2, 14], [10.2, 22], [11.4, 30], [11, 33.6]])],
        l: ["M-7.6 28C-5.6 38 -4.6 48 -4.6 58", "M-11.4 20C-6 22.4 0 21.4 4.4 18.6"], u: [[-3.6, 60.6, 2.2, 2.8]], w8: 11.5 }
    };
    return MANI3;
  }
  A.maniNuove = maniNuove;
  // (6 nov 2026, ritocco «mani») LE MANI NUOVE A 5 DITA (Tavola 4, serie B; il proprietario: «metti le 5 dita»). Stanno sopra quelle di
  // maniNuove (le voci che non hanno restano quelle di prima) e si usano solo con A.RITOCCHI.mani acceso (maniDi).
  // Stesso contratto: coordinate della mano = polso in (0, 0), dita verso +y, +x = verso il corpo col braccio giù; la cima di ogni forma è
  // stretta (mezza larghezza 10 a y -2) e il «ponte» del polso la copre. cartone = forma nuova (i dettagli li disegna dettagliMano).
  // p = riempimenti (girano tutti nello stesso verso: il riempimento è l unione e il contorno sta dietro), b = righe scure tra le dita,
  // r = fili di luce sul bordo delle dita (sulla pelle scura separano le dita al posto delle righe scure), l = pieghe leggere,
  // n = luci [x, y, rx, ry], o = ombre morbide, u = unghie [x, y, rx, ry, angolo], v = volumi [x1, y1, x2, y2, larghezza],
  // f = pezzi DAVANTI (il pollice che passa sopra): { d: forma, h: la sua ombra, e: il suo bordo, g: direzione della luce [x1, y1, x2, y2] },
  // w8 = mezza larghezza a y 8, spalle = la stessa mano vista da dietro (il dorso: niente righe del palmo; le unghie).
  // Le dita sono «tubi»: una linea di nodi [x, y, raggio] con le due punte tonde; le righe tra un dito e l altro sono il lato vero del dito.
  // PUGNO = la mano che impugna (coordinate della presa come PUGNO in manoImpugna: 0,0 = centro del pugno, il manico lungo y, +x = le nocche).
  var MANI5 = null;
  // (controllo del 6 nov, ritocco «mani») la mano appoggiata sulle cosce da seduti («piatta»; anche le mani sul tavolo del Black Jack):
  // con la pelle scura e l avatar piccolo era una macchia piena e un po grossa. Ora: dorso più corto e dita più lunghe dello stesso (su),
  // la mano un po più piccola (k), e solo sulla pelle scura (il segno «forte» della forma) righe tra le dita più marcate (mB = quanto
  // nero, wB larghezza, oB), il filo di luce più sottile e un po più dentro il dito (wR, oR, ri: accanto alla riga scura, da piccola, la
  // spegneva), le righe che partono appena sotto la nocca (t0), unghie un po più grandi e chiare (uk, u) e le luci sulle nocche (n).
  // La pelle chiara cambia solo di forma (dita più lunghe, mano un po più piccola). Prove in costruzione/fix12 (sed.html).
  var PIATTA = { su: 4, k: 0.95, mB: 0.55, wB: 2, oB: 0.95, wR: 1, oR: 0.55, ri: 1.6, u: 0.4, t0: 0.12, n: 0.5, uk: 1.2 };
  function maniDi() {
    if (!A.RITOCCHI.mani) return maniNuove();
    if (MANI5) return MANI5;
    var v = maniNuove(), nn = formeMani(), r = {}, k;
    for (k in v) r[k] = v[k];
    for (k in nn) r[k] = cortaForma(nn[k]);
    return (MANI5 = r);
  }
  A.maniDi = maniDi;
  // (leggero) un percorso delle mani nuove (scritto in assoluto: M L C Q A Z, numeri a un decimale) riscritto in relativo coi numeri corti
  // di T: stesso identico disegno (i salti si contano in decimi interi, niente errori che si sommano), un quarto di caratteri in meno
  function corto(d) {
    var tk = d.match(/[MLCQAZ]|-?(\d+\.?\d*|\.\d+)/g), i = 0, s = "", x = 0, y = 0, x0 = 0, y0 = 0, c, primo = true;
    function nm() { return Math.round(parseFloat(tk[i++]) * 10); }
    function altro() { return i < tk.length && !/^[MLCQAZ]$/.test(tk[i]); }
    while (i < tk.length) {
      c = tk[i++];
      if (c === "Z") { s += "z"; x = x0; y = y0; continue; }
      do {
        if (c === "M" || c === "L") {
          var X = nm(), Y = nm();
          if (primo) { s += "M" + T(X, 1) + T(Y); primo = false; } else s += (c === "M" ? "m" : "l") + T(X - x, 1) + T(Y - y);
          x = X; y = Y; if (c === "M") { x0 = X; y0 = Y; c = "L"; }
        } else if (c === "C" || c === "Q") {
          var n = c === "C" ? 3 : 2, ps = [];
          for (var j = 0; j < n; j++) ps.push(nm(), nm());
          s += c.toLowerCase();
          for (j = 0; j < n; j++) s += T(ps[2 * j] - x, !j) + T(ps[2 * j + 1] - y);
          x = ps[2 * n - 2]; y = ps[2 * n - 1];
        } else if (c === "A") {
          var rx = nm(), ry = nm(), rot = tk[i++], f1 = tk[i++], f2 = tk[i++], X2 = nm(), Y2 = nm();
          s += "a" + T(rx, 1) + T(ry) + " " + rot + " " + f1 + " " + f2 + (X2 - x < 0 ? "" : " ") + T(X2 - x, 1) + T(Y2 - y);
          x = X2; y = Y2;
        }
      } while (altro());
    }
    return s;
  }
  function cortaForma(F) {
    if (!F || typeof F !== "object") return F;
    var o = {}, k, L = function (a) { return a.map(corto); };
    for (k in F) o[k] = F[k];
    ["p", "pp", "b", "r", "l"].forEach(function (q2) { if (F[q2]) o[q2] = L(F[q2]); });
    if (F.f) o.f = F.f.map(function (z) { return { d: corto(z.d), h: corto(z.h), e: corto(z.e), g: z.g }; });
    if (F.spalle) o.spalle = cortaForma(F.spalle);
    return o;
  }
  function formeMani() {
    function r1(v) { return Math.round(v * 10) / 10; }
    function nu(v) { var t = String(r1(v)); return t === "-0" ? "0" : t.replace(/^(-?)0\./, "$1."); }
    function P(p) { var y = nu(p[1]); return nu(p[0]) + (y.charAt(0) === "-" ? "" : " ") + y; }
    // curva liscia chiusa (Catmull-Rom) e aperta
    function crv(pts, chiusa) {
      var n = pts.length, s = "M" + P(pts[0]), m = chiusa ? n : n - 1;
      for (var i = 0; i < m; i++) {
        var a = pts[chiusa ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[i], c = pts[(i + 1) % n], d = pts[chiusa ? (i + 2) % n : Math.min(n - 1, i + 2)];
        s += "C" + P([b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6]) + " " + P([c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6]) + " " + P(c);
      }
      return s + (chiusa ? "Z" : "");
    }
    function area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
    function chiusa(p) { return crv(area(p) > 0 ? p.slice().reverse() : p, true); }   // tutte nello stesso verso (area negativa)
    function arco(w, sw, Q) { return "A" + nu(w) + " " + nu(w) + " 0 0 " + sw + " " + P(Q); }
    // un lato (punti) come continuazione di un percorso: dritto con 2 punti, curva liscia con di più
    function seg(pts) { return pts.length === 2 ? "L" + P(pts[1]) : crv(pts, false).replace(/^M[^C]*/, ""); }
    // un tubo: nodi [x, y, raggio]; lato L = a sinistra della direzione; le punte tonde sono archi (un dito dritto è «M L A L A Z»)
    function tubo(nodi) {
      var L = [], R = [], n = nodi.length;
      function dir(i) { var a = nodi[Math.max(0, i - 1)], b = nodi[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
      for (var i = 0; i < n; i++) { var u = dir(i), nx = -u[1], ny = u[0], w = nodi[i][2]; L.push([nodi[i][0] + nx * w, nodi[i][1] + ny * w]); R.push([nodi[i][0] - nx * w, nodi[i][1] - ny * w]); }
      var u1 = dir(n - 1), cima = nodi[n - 1], w1 = cima[2], w0 = nodi[0][2];
      var d = "M" + P(L[0]) + seg(L) + arco(w1, 0, R[n - 1]) + seg(R.slice().reverse()) + arco(w0, 0, L[0]) + "Z";
      return { nodi: nodi, L: L, R: R, d: d, u: u1, tip: [cima[0] + u1[0] * w1, cima[1] + u1[1] * w1], cima: cima };
    }
    function dito(a, b, ra, rb, curva) {   // dito dritto (o appena piegato verso +x di «curva»)
      var m = [(a[0] + b[0]) / 2 + (curva || 0) * 0.35, (a[1] + b[1]) / 2, (ra + rb) / 2];
      return tubo(curva ? [[a[0], a[1], ra], m, [b[0] + (curva || 0), b[1], rb]] : [[a[0], a[1], ra], [b[0], b[1], rb]]);
    }
    function suLato(S, t) { var n = S.length, f = t * (n - 1), i = Math.min(n - 2, Math.floor(f)), g = f - i; return [S[i][0] + (S[i + 1][0] - S[i][0]) * g, S[i][1] + (S[i + 1][1] - S[i][1]) * g]; }
    function tratto(S, t0, t1) { var n = S.length, pts = [suLato(S, t0)]; for (var i = 1; i < n - 1; i++) { var ti = i / (n - 1); if (ti > t0 && ti < t1) pts.push(S[i]); } pts.push(suLato(S, t1)); return pts; }
    // un lato di un tubo, da t0 a t1 (0 = base, 1 = dove comincia la punta), con o senza il giro della punta
    function lato(T, q, t0, t1, conPunta) {
      var pts = tratto(T[q], t0, t1), s = "M" + P(pts[0]) + seg(pts), n = T.L.length, w = T.cima[2];
      if (conPunta) s += q === "L" ? arco(w, 0, T.R[n - 1]) : arco(w, 1, T.L[n - 1]);
      return s;
    }
    // il bordo di un dito piegato visto di fronte: un lato dall alto, il giro in fondo (la punta ripiegata), l altro lato fino in alto
    function bordoBase(T, t1) {
      var a = tratto(T.L, 0, t1).reverse(), b = tratto(T.R, 0, t1), w0 = T.nodi[0][2];
      return "M" + P(a[0]) + seg(a) + arco(w0, 1, b[0]) + seg(b);
    }
    function rientra(T, d) { return tubo(T.nodi.map(function (q) { return [q[0], q[1], Math.max(1, q[2] - d)]; })); }   // lo stesso dito più sottile (per i fili di luce)
    function forma(T) { return T.d; }
    // luce sulla punta e unghia di un dito (u = direzione del dito)
    function luceP(T, f) { var c = T.cima, u = T.u, w = c[2]; return [r1(c[0] - u[0] * w * 0.15 - 0.6), r1(c[1] - u[1] * w * 0.15), r1(w * (f || 0.42)), r1(w * (f || 0.42) * 0.8)]; }
    function unghia(T) { var c = T.cima, u = T.u, w = c[2]; return [r1(c[0] + u[0] * w * 0.22), r1(c[1] + u[1] * w * 0.22), r1(w * 0.44), r1(w * 0.6), r1(Math.atan2(u[1], u[0]) / DEG - 90)]; }
    function nocca(T) { var a = T.nodi[0], u = T.u; return [r1(a[0] - 0.8 + u[0] * 1.5), r1(a[1] + u[1] * 1.5), r1(a[2] * 0.6), r1(a[2] * 0.36)]; }
    function piegaDito(T, t, quanto) {   // una piega di traverso sul dito (la falange), lunga «quanto» della larghezza
      var n = T.nodi, a = n[0], b = n[n.length - 1], x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, w = (a[2] + (b[2] - a[2]) * t) * (quanto || 0.55), u = T.u, nx = -u[1], ny = u[0];
      return "M" + P([x + nx * w, y + ny * w]) + "Q" + P([x + u[0] * 1.2, y + u[1] * 1.2]) + " " + P([x - nx * w, y - ny * w]);
    }
    // un pezzo davanti (il pollice): la forma, la sua ombra (la stessa forma più grossa e spostata), il bordo (senza la radice)
    function davanti(T, dx, dy, g, tA) {
      var om = tubo(T.nodi.map(function (q) { return [q[0] + dx, q[1] + dy, q[2] + 1.3]; }));
      var ta = tA == null ? 0.25 : tA, rr = tratto(T.R, ta, 1).reverse();
      return { d: T.d, h: om.d, e: lato(T, "L", ta, 1, true) + seg([T.R[T.R.length - 1]].concat(rr.slice(1))), g: g || [0, 0, 1, 0] };
    }
    function unghiaPollice(T) { var c = T.cima, u = T.u, w = c[2]; return [r1(c[0] - u[0] * w * 0.05 + u[1] * w * 0.12), r1(c[1] - u[1] * w * 0.05 - u[0] * w * 0.12), r1(w * 0.56), r1(w * 0.44), r1(Math.atan2(u[1], u[0]) / DEG)]; }

    // ---- la mano APERTA (palmo verso chi guarda, il pollice in fuori a -x): le dita a ventaglio regolare (gli assi si incontrano in
    // «centro»), il medio il più lungo; il pollice più corto e più grosso, attaccato in basso vicino al polso, aperto di «ap» gradi
    var palmoA = [[10, -2], [13.8, 4.4], [15.9, 12], [16.6, 20], [16.2, 26], [13.6, 30.6], [9.4, 33.4], [8.2, 36.4], [4.2, 34.4], [0, 37.2], [-4.2, 34.4], [-8.2, 36.4],
      [-9.6, 33.4], [-12.4, 30.6], [-16.2, 26], [-18, 19], [-18.4, 12.6], [-16.4, 6], [-13.2, 1.6], [-10, -2]];
    function aperta(centro, ap) {
      var basi = [[-12.1, 27.4], [-4.1, 29], [4.1, 29], [11.9, 27.2]], lun = [19.6, 22.4, 20.8, 16], rag = [[4.6, 4.1], [4.7, 4.2], [4.6, 4.1], [4.1, 3.6]];
      var F = basi.map(function (b, i) { var dx = b[0] - centro[0], dy = b[1] - centro[1], d = Math.hypot(dx, dy); return dito(b, [b[0] + dx / d * lun[i], b[1] + dy / d * lun[i]], rag[i][0], rag[i][1]); });
      var a = ap * DEG, pb = [-12, 11.4], pl = 15.6, pt = [pb[0] - Math.sin(a) * pl, pb[1] + Math.cos(a) * pl];
      var po = tubo([[pb[0], pb[1], 6.7], [(pb[0] + pt[0]) / 2, (pb[1] + pt[1]) / 2, 6.2], [pt[0], pt[1], 5.3]]);
      var p = [chiusa(palmoA)].concat(F.map(forma), [po.d]), b = [], rr = [];
      for (var i = 1; i < F.length; i++) { b.push(lato(F[i], "L", 0.02, 0.62)); rr.push(lato(rientra(F[i - 1], 0.95), "R", 0.1, 0.45)); }
      var palmo = { cartone: 1, p: p, b: b, r: rr,
        // la linea della vita intorno al cuscinetto del pollice, la linea del cuore corta
        l: [crv([[-11.4, 27.6], [-8.2, 22], [-7.4, 15], [-8.6, 7.6]], false), crv([[15.4, 23.4], [8, 22.2], [1.4, 24.2]], false)],
        n: F.map(function (T) { return luceP(T); }).concat([[-14, 14, 4.6, 3.2]]), o: [[-9.4, 22, 4.8, 3.4], [2, 30.4, 10, 2.6]], v: [[pb[0], pb[1], pt[0], pt[1], 12]], u: [], w8: 15.4 };
      // vista da dietro (di spalle): il dorso, le unghie, le nocche; niente righe del palmo
      palmo.spalle = { cartone: 1, p: p, b: b, r: rr, l: [], n: F.map(nocca), u: F.map(unghia).concat([unghia(po)]), v: palmo.v, w8: 15.4 };
      return palmo;
    }

    // ---- il PUGNO visto dal palmo (esulta, leva, batte, carte): sopra le nocche tonde ben staccate (le dita piegate), sotto la fila delle
    // punte ripiegate con le righe curve, il pollice pieno con la sua ombra che passa davanti alle dita dalla sua parte
    var palmoP = [[10, -2], [14.8, 5], [17.2, 13], [17.8, 21], [17.6, 27], [12, 29], [0, 29.4], [-12, 29], [-17.8, 27], [-19.4, 20.4], [-19.8, 13.4], [-17.4, 5.4], [-10, -2]];
    function pugnoDita(indiceTeso) {
      var xs = [-13.1, -4.3, 4.4, 13], cima = [35.4, 37.2, 36.2, 33], rr = [4.85, 4.95, 4.8, 4.35], fondo = 21.6;
      return xs.map(function (x, i) {
        if (indiceTeso && i === 0) return dito([x + 0.2, 20], [x - 0.3, 59.5], rr[0] - 0.2, rr[0] - 0.9);
        return dito([x, fondo + (i === xs.length - 1 ? 0.8 : 0)], [x, cima[i]], rr[i], rr[i]);
      });
    }
    function pugnoForma(indiceTeso) {
      var D2 = pugnoDita(indiceTeso), fine = indiceTeso ? 2.6 : -0.6;
      // il pollice: dalla base in basso a -x sale lungo il fianco e passa di traverso sulle dita
      var pol = tubo(indiceTeso ? [[-16.8, 15.2, 5.6], [-11.4, 20.4, 5.5], [-3, 22.6, 5.3], [fine, 22.9, 5.1]] : [[-17.2, 15.2, 5.7], [-12.4, 20.4, 5.6], [-4.6, 22.6, 5.4], [fine, 22.9, 5.2]]);
      var p = [chiusa(palmoP)].concat(D2.map(forma)), b = [], rr = [], l = [], n = [], v = [];
      D2.forEach(function (T, i) {
        if (indiceTeso && i === 0) { b.push(lato(T, "R", 0.06, 0.5)); n.push(luceP(T, 0.5)); l.push(piegaDito(T, 0.5, 0.6), piegaDito(T, 0.78, 0.55)); v.push([T.nodi[0][0], T.nodi[0][1] + 8, T.cima[0], T.cima[1], 11]); return; }
        b.push(bordoBase(T, 0.86));   // il bordo del dito piegato: i due lati dall alto, il giro della punta ripiegata in fondo
        // la piega del dito (riga curva che segue la nocca): divide la falange di mezzo dalla punta ripiegata
        var c = T.nodi[0], w = c[2], yP = c[1] + (T.cima[1] - c[1]) * 0.42;
        l.push("M" + P([c[0] - w * 0.78, yP + 1.6]) + "Q" + P([c[0], yP - 2.2]) + " " + P([c[0] + w * 0.78, yP + 1.6]));
        n.push([r1(c[0] - w * 0.25), r1(T.cima[1] + w * 0.35), r1(w * 0.5), r1(w * 0.3)]);   // la luce sulla nocca
        n.push([r1(c[0] - w * 0.15), r1(c[1] - w * 0.25), r1(w * 0.42), r1(w * 0.26)]);       // la luce sulla punta ripiegata
        rr.push(lato(rientra(T, 0.9), "L", 0.1, 0.95));
      });
      return { cartone: 1, p: p, b: b, r: rr, l: l, n: n.concat([[r1(pol.cima[0] - 4), r1(pol.cima[1] + 2.4), 4, 2]]), o: [[0, 13, 13, 4]], u: [unghiaPollice(pol)],
        f: [davanti(pol, 0.3, -1, [0, 1, 0, 0], 0.1)], v: v, w8: 15.2 };
    }

    // ---- il DORSO (a riposo, sul tavolo, in posa, seduto): il pollice a +x, davanti. Le dita toccano ma la sagoma ha la tacca tra una
    // punta e l altra; la riga va dalla tacca fino alla nocca; il medio più lungo; unghie, luce sulle punte e sulle nocche
    var dorsoA = [[-10, -2], [-14.6, 6], [-16.6, 15], [-16.8, 23], [-15.6, 29], [-8, 31], [2, 31.4], [10, 30], [14, 25.4], [15, 15], [14, 6], [10, -2]];
    // corto = (solo la mano appoggiata sulle cosce, «piatta») quanto si accorcia il dorso: le basi delle dita salgono di tanto e le dita
    // si allungano dello stesso, così la mano resta lunga uguale ma è fatta più di dita che di dorso (controllo del 6 nov: da seduto, con la
    // pelle scura e l avatar piccolo, il dorso lungo con le dita corte si leggeva come una macchia piena)
    function dorso(lu, curva, polliceLungo, corto) {
      var fy = corto ? (25.4 - corto) / 25.4 : 1;
      function cy(q) { return corto && q[1] > 6 ? [q[0], r1(6 + (q[1] - 6) * fy)].concat(q.slice(2)) : q; }   // dal polso in giù (y oltre 6) la mano si accorcia
      var basi = [[-12, 26.4], [-4, 27.6], [4, 27.8], [11.8, 26.8]].map(cy), lun = [lu * 0.78, lu * 0.96, lu, lu * 0.93], rag = [[4.2, 3.7], [4.6, 4.1], [4.6, 4.1], [4.5, 4]];
      var F = basi.map(function (b, i) { return dito(b, [b[0] + (curva || 0) * 0.5, b[1] + lun[i]], rag[i][0], rag[i][1], curva ? curva * (0.7 + i * 0.15) : 0); });
      var p = [chiusa(dorsoA.map(cy))].concat(F.map(forma)), b = [], rr = [];
      for (var i = 1; i < F.length; i++) { b.push(lato(F[i], "L", corto ? PIATTA.t0 : 0, 0.96)); rr.push(lato(rientra(F[i], corto ? PIATTA.ri : 0.9), "L", 0.12, 0.9)); }
      var m = { cartone: 1, p: p, b: b, r: rr, l: [], n: F.map(nocca).concat(F.map(function (T) { return luceP(T, 0.32); })), u: F.map(unghia), o: [], v: [], w8: 15 };
      if (corto) m.u = m.u.map(function (q) { return [q[0], q[1], r1(q[2] * PIATTA.uk), r1(q[3] * PIATTA.uk), q[4]]; });
      if (corto) m.forte = 1;   // (vedi dettagliMano) sulla pelle scura le righe tra le dita più marcate
      var sp = { cartone: 1, p: p, b: b, r: rr, l: [], n: F.map(function (T) { return luceP(T); }), u: [], w8: 15 };
      if (polliceLungo) {   // a riposo: il pollice davanti, pieno, con la sua ombra
        var pol = tubo([[10.2, 4.8, 5.8], [13.6, 16.4, 5.4], [15.4, 27.6, 4.8]]);
        m.f = [davanti(pol, -1.4, 0.6, [0, 0, 1, 0], 0.2)];
        m.u.push(unghiaPollice(pol));
        m.n.push([r1(pol.nodi[1][0] - 2), r1(pol.nodi[1][1]), 2.2, 6]);
      } else {   // sul tavolo: il pollice appoggiato di lato, SOTTO l indice (spunta fuori dal fianco), con l ombra dell indice
        var pt = tubo([[11.6, 4.6, 5.8], [15.6, 14.6, 5.4], [17.6, 24.2, 4.8]].map(cy)), ix = F[F.length - 1];
        m.p.splice(1, 0, pt.d);
        m.b.push(lato(ix, "R", 0, 0.8));
        m.r.push(lato(rientra(ix, 0.9), "R", 0.05, 0.75));
        m.o.push([r1(ix.nodi[0][0] + ix.nodi[0][2] + 0.6), r1(ix.nodi[0][1] - 4), 2.4, 7]);
        m.u.push(unghiaPollice(pt));
        m.n.push([r1(pt.nodi[1][0] + 1.6), r1(pt.nodi[1][1]), 1.8, 5]);
      }
      m.spalle = sp;
      return m;
    }

    // ---- la mano che BATTE (applaude): vista un po di sbieco, le dita separate, il pollice davanti (+x)
    var battiF = [[-8.6, -2], [-11.6, 7], [-12.6, 18], [-12.4, 26], [-10.6, 31.6], [-4, 33.6], [3, 33.4], [8.4, 30.4], [10.4, 20], [10.2, 8], [9, -2]];
    function batti() {
      var basi = [[-8.8, 28.6], [-3.2, 30.2], [2.4, 30.4], [7.6, 29.2]], lun = [18, 23, 23.6, 21], rag = [[3.6, 3.2], [3.8, 3.4], [3.8, 3.4], [3.7, 3.3]];
      var F = basi.map(function (b, i) { var a = (i - (basi.length - 1) / 2) * 4.5 * DEG; return dito(b, [b[0] + Math.sin(a) * lun[i], b[1] + Math.cos(a) * lun[i]], rag[i][0], rag[i][1]); });
      var pol = tubo([[4.4, 5, 4.6], [7, 13.6, 4.2], [8.2, 21, 3.7]]), b = [], rr = [];
      for (var i = 1; i < F.length; i++) { b.push(lato(F[i], "L", 0, 0.96)); rr.push(lato(rientra(F[i], 0.85), "L", 0.12, 0.9)); }
      return { cartone: 1, p: [chiusa(battiF)].concat(F.map(forma)), b: b, r: rr, l: [], n: F.map(function (T) { return luceP(T, 0.32); }), u: F.map(unghia).concat([unghiaPollice(pol)]),
        f: [davanti(pol, -1.2, 0.6, [0, 0, 1, 0], 0.2)], v: [], w8: 12 };
    }

    // ---- IMPUGNA: le dita a gradino arrotolate sul manico, le punte tonde davanti, il pollice che chiude sopra l indice
    // (il manico passa lungo y dentro il pugno: si vede sopra il pollice e sotto l ultimo dito)
    function impugna() {
      var G = [[-10.4, 14.4, -9.4, 4.7, 4.5], [-1.6, 15.2, -9.2, 4.8, 4.6], [7, 14.6, -7.8, 4.6, 4.4], [15.2, 12.2, -5.2, 4.1, 3.9]];
      var F = G.map(function (g) { return tubo([[g[1], g[0], g[3]], [(g[1] + g[2]) / 2, g[0] + 0.4, (g[3] + g[4]) / 2], [g[2], g[0] + 0.2, g[4]]]); });
      var pol = tubo([[12.4, -11.4, 6], [5, -14.6, 5.8], [-2.4, -15.2, 5.4], [-7, -14.4, 5]]);
      var dorsoI = chiusa([[5, -15], [13.6, -15.4], [18.6, -11], [20.4, -2.4], [21, 7], [20.4, 15], [17.4, 21], [11, 24.4], [3.4, 24.2], [-3, 21], [-2, 12], [2, 0], [2, -10]]);
      var pp = [dorsoI].concat(F.map(forma)), b = [], rr = [], n = [], l = [];
      F.forEach(function (T, i) {
        if (i) b.push(lato(T, "L", 0, 0.98, false));   // il lato di sopra (verso il dito sopra)
        var c = T.cima;   // la punta tonda davanti (verso il corpo)
        l.push("M" + P([c[0] + 4.6, c[1] - c[2] * 0.85]) + "Q" + P([c[0] + 2.4, c[1]]) + " " + P([c[0] + 4.6, c[1] + c[2] * 0.85]));
        n.push([r1(c[0] - 0.6), r1(c[1] - c[2] * 0.35), r1(c[2] * 0.42), r1(c[2] * 0.32)], [r1(T.nodi[0][0] - 3), r1(T.nodi[0][1] - T.nodi[0][2] * 0.4), 3.4, 1.6]);
        rr.push(lato(rientra(T, 0.9), "L", 0.05, 0.95));
      });
      return { pp: pp, b: b, r: rr, l: l, n: n, f: [davanti(pol, 0.4, 1.6, [0, 0, 0, 1], 0.12)], u: [unghiaPollice(pol)], v: [] };
    }

    return {
      aperta: aperta([0, -18], 44), saluta: aperta([0, -8], 50),
      pugno: pugnoForma(false), indica: pugnoForma(true),
      rilassata: dorso(20, 2.2, true), dorso: dorso(19.6, 0, false), piatta: dorso(14 + PIATTA.su, 0, false, PIATTA.su),
      batti: batti(), PUGNO: impugna()
    };
  }
  // (terzo tempo) le pose del braccio che tiene una cosa (A.impugna[voce].posa): dove va il polso, quanto si accorcia il braccio che viene avanti
  // davanti = il pugno davanti al fianco, l avambraccio che viene verso chi guarda (come chi tiene una torcia); petto = il pugno al petto
  // (il microfono verso la bocca); alto = il braccio alzato (la bandiera, la coppa); fianco = il braccio giù (posa di riposo)
  var POSE_PRESA = {
    davanti: { t: function (G) { return [G.Jd + 2, G.Y.vita + 30]; }, f: [1, 0.5] },
    // (giro3) più giù e più avanti: il microfono arrivava a toccare il mento (l avambraccio, più corto, viene verso chi guarda)
    petto: { t: function (G) { return [G.Jd * 0.46, G.Y.petto + 34]; }, f: [0.92, 0.48], davanti: 1 },
    alto: { t: function (G) { return [G.Jd + 52, G.Jy - 112]; }, f: [1, 0.86] }
  };
  A.POSE_PRESA = POSE_PRESA;
  // SEDUTO (front): il busto scende di dy; le cosce (da yAB a yBC) si accorciano (vengono verso chi guarda), gli stinchi pure,
  // i piedi restano a terra. Il sedere tocca la seduta a y 784 del mondo (198 nel riquadro, come prima).
  var SED = { dy: 188, yAB: 596, yBC: 748, sB: 0.4, yCD: 930, kx: 1 };
  SED.yA = SED.yAB + SED.dy; SED.yK = SED.yA + (SED.yBC - SED.yAB) * SED.sB; SED.sC = (SED.yCD - SED.yK) / (SED.yCD - SED.yBC);
  A.SEDUTO = SED;
  // =========================================================
  //  LE PROPORZIONI (terzo tempo, 6 nov 2026). Il proprietario: «sembrano troppo secchi e lunghi».
  //  A.PROPORZIONE = "attuale" (com'era: lo stesso disegno, carattere per carattere) | "A" | "B" | "C" (proposte).
  //  Si può chiedere anche per un disegno solo: SGOmino.svg(cfg, { proporzione: "B" }).
  //  I pezzi NON cambiano: disegnano sempre nel mondo 400×1000 di prima (le quote fisse 560, 748, 938, 944, 999…).
  //  Il motore poi: - allarga spalle, petto, braccia e gambe (moltiplica la tabella BUILD: i pezzi leggono K.B);
  //   - abbassa e ingrandisce la testa (collo più corto, testa più grande: HT);
  //   - allunga un po' le braccia (L1, L2);
  //   - accorcia le gambe A FASCE come nella posa seduta: il disegno del corpo si usa tre volte con <use>
  //     (sopra yL0 solo spostato giù di «gambe», da yL0 a 930 schiacciato, i piedi fermi); mani e cose in mano
  //     sono disegnate a parte e solo spostate (non si schiacciano);
  //   - poi tutto si ingrandisce di S intorno ai piedi (200, 999), così la figura riempie il riquadro come prima:
  //     i piedi restano a terra in basso e la cima della testa torna circa dov'era (alto).
  //  Seduti: niente fasce nuove (le gambe sono già piegate); il busto si ingrandisce di S intorno al sedere (200, 784),
  //  le gambe solo in larghezza: il sedere resta a y 784 (198 nel riquadro).
  //  Tutte le pose in piedi (anche vita, busto, viso e il braccio staccato) usano lo stesso S e lo stesso spostamento:
  //  i giochi che mettono un braccio staccato sopra una figura «vita» trovano tutto allineato come prima.
  // =========================================================
  var PROPORZIONI = {
    // gambe = quanto si accorciano (mondo); collo = quanto scende la testa; testa = ingrandimento della testa;
    // spalle/petto/vita/fianchi/nk/braccia/cosce = larghezze (BUILD); lungBraccia = lunghezza delle braccia; alto = la cima della testa dopo
    A: { nome: "Un po' più pieno", gambe: 34, collo: 8, testa: 1.04, spalle: 1.04, petto: 1.03, vita: 1.02, fianchi: 1.02, nk: 1.05, braccia: 1.05, lungBraccia: 1.06, cosce: 1.04, alto: 78 },
    B: { nome: "Simpatico", gambe: 62, collo: 14, testa: 1.08, spalle: 1.05, petto: 1.04, vita: 1.03, fianchi: 1.03, nk: 1.08, braccia: 1.08, lungBraccia: 1.12, cosce: 1.07, alto: 72 },
    C: { nome: "Cartoon", gambe: 90, collo: 19, testa: 1.15, spalle: 1.07, petto: 1.06, vita: 1.05, fianchi: 1.04, nk: 1.1, braccia: 1.1, lungBraccia: 1.16, cosce: 1.1, alto: 68 }
  };
  var PROP_L0 = 600, PROP_L1 = 930;   // la fascia delle gambe che si accorcia (sotto il cavallo, sopra le caviglie)
  (function () {
    for (var k in PROPORZIONI) {
      var P = PROPORZIONI[k], top = 214 + P.gambe + P.collo - 148 * 0.9 * P.testa;
      P.S = (999 - P.alto) / (999 - top);   // l ingrandimento intorno ai piedi
      P.sL = (PROP_L1 - PROP_L0 - P.gambe) / (PROP_L1 - PROP_L0);   // quanto si schiacciano le gambe
      P.teste = Math.round((999 - P.alto) / (148 * 0.9 * P.testa * P.S) * 10) / 10;   // quante teste è alta la figura (dal mento alla cima della testa)
    }
  })();
  A.PROPORZIONI = PROPORZIONI;
  A.PROPORZIONE = "B";
  function propDi(opts) { var n = opts && opts.proporzione ? opts.proporzione : A.PROPORZIONE; return PROPORZIONI[n] || null; }
  var BUILD_P = {};
  function buildDi(m, corpo, P) {
    var B0 = BUILD[m ? "uomo" : "donna"][corpo] || BUILD[m ? "uomo" : "donna"].medio;
    if (!P) return B0;
    var k = (m ? "u" : "d") + (BUILD[m ? "uomo" : "donna"][corpo] ? corpo : "medio") + P.nome;
    if (BUILD_P[k]) return BUILD_P[k];
    var B = {}; for (var x in B0) B[x] = B0[x];
    B.nk = B0.nk * P.nk; B.shx = B0.shx * P.spalle; B.sho = B0.sho * P.spalle; B.ap = B0.ap * (P.spalle + P.petto) / 2; B.ch = B0.ch * P.petto;
    B.wt = B0.wt * P.vita; B.hp = B0.hp * P.fianchi; B.aw = B0.aw.map(function (v) { return v * P.braccia; }); B.lw = B0.lw * P.cosce; B.km = B0.km * P.braccia; if (B0.aws) B.aws = B0.aws * P.braccia;
    return (BUILD_P[k] = B);
  }
  // dove va un punto del busto (coordinate dei pezzi) nel disegno finito (mondo 400×1000): in piedi e seduti
  function vistaSu(P, seduto) {
    if (!P) return seduto ? function (x, y) { return [x, y + SED.dy]; } : function (x, y) { return [x, y]; };
    var S = P.S;
    return seduto ? function (x, y) { return [200 + S * (x - 200), 784 + S * (y + SED.dy - 784)]; }
      : function (x, y) { return [200 + S * (x - 200), 999 - S * (999 - y - P.gambe)]; };
  }
  // due ossa (braccio e avambraccio) che portano il polso su T: il gomito sta verso fuori
  function ik(J, T, l1, l2, lato) {
    var dx = T[0] - J[0], dy = T[1] - J[1], d = Math.hypot(dx, dy) || 1, dd = Math.max(Math.abs(l1 - l2) + 2, Math.min(l1 + l2 - 2, d));
    var W = [J[0] + dx / d * dd, J[1] + dy / d * dd], ca = (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), An = Math.acos(Math.max(-1, Math.min(1, ca))), b = Math.atan2(dy, dx);
    var E1 = [J[0] + l1 * Math.cos(b + An), J[1] + l1 * Math.sin(b + An)], E2 = [J[0] + l1 * Math.cos(b - An), J[1] + l1 * Math.sin(b - An)];
    return { E: (E1[0] - J[0]) * lato > (E2[0] - J[0]) * lato ? E1 : E2, W: W };
  }
  // la geometria del corpo (la usano il disegno, A.mano e i giochi): misure, gambe, braccia nella posa chiesta
  A.geometria = function (c, opts) {
    opts = opts || {};
    var PP = propDi(opts), m = c.forma !== "donna", B = buildDi(m, c.corpo, PP), C = 200;
    var Y = { collo: 246, spalla: 268, delt: 296, ascella: 336, petto: m ? 372 : 382, vita: m ? 452 : 442, fianchi: 528, cavallo: 572 };
    var GN = gambeDi(m, B, !!opts.seduto && !opts.busto && !opts.viso && !opts.gambe);
    function gIn(y) {
      if (y <= GN[0][0]) return [GN[0][1], GN[0][2], GN[0][3]];
      for (var i = 1; i < GN.length; i++) if (y <= GN[i][0]) { var a = GN[i - 1], b = GN[i], t = (y - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; }
      var z = GN[GN.length - 1]; return [z[1], z[2], z[3]];
    }
    var pancia = B.pancia ? (m ? 4 : 3) : 0, rc = (B.aws || B.aw[0]) * 0.56, Jd = B.sho - rc, Jy = Y.delt - 4, kb = (m ? 1 : 0.94) * (PP ? PP.lungBraccia : 1), L1 = 142 * kb, L2 = 126 * kb;
    // mezza larghezza del corpo a quella quota (per tenere le braccia un po' staccate dal fianco)
    var LT = [[Y.ascella, B.ap], [Y.petto, B.ch], [Y.vita, B.wt + pancia], [Y.fianchi, B.hp], [560, gIn(560)[0] + gIn(560)[1]], [640, gIn(640)[0] + gIn(640)[1]]];
    function largTronco(y) { if (y <= LT[0][0]) return LT[0][1]; for (var i = 1; i < LT.length; i++) if (y <= LT[i][0]) { var t = (y - LT[i - 1][0]) / (LT[i][0] - LT[i - 1][0]); return LT[i - 1][1] + (LT[i][1] - LT[i - 1][1]) * t; } return LT[LT.length - 1][1]; }
    var gesto = opts.gesto && (A.RITOCCHI.mani && GESTI_MANI[opts.gesto] || GESTI[opts.gesto]), latoG = opts.lato === -1 ? -1 : 1, GG = { Jd: Jd, Jy: Jy, Y: Y, B: B, C: C, m: m, P: PP };
    var ROB = !!B.pancia;   // (g4) il robusto: braccia lungo la pancia, a riposo e seduto
    // (terzo tempo) la cosa in mano col contratto nuovo (A.impugna[voce]): il braccio la tiene davanti, al petto, in alto o lungo il fianco
    var regO = c.mano && c.mano !== "nessuno" && !opts.busto && !opts.viso && A.inmano[c.mano] && A.impugna[c.mano] ? A.impugna[c.mano] : null;
    function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
    // (terzo tempo) con le proporzioni nuove un gesto porta la mano DOVE ERA PRIMA nel riquadro (così nel taglio «vita» le mani restano
    // dentro e i giochi che mettono le braccia sul tavolo le trovano allo stesso posto); sopra la spalla il braccio, più lungo, si allunga
    // anche in fuori (resta disteso come prima), ma la mano non va più in alto di prima
    function bersaglio(J, T) {
      if (!PP) return T;
      var yv = 999 - PP.gambe - (999 - T[1]) / PP.S;   // la quota che nel disegno finito cade dove cadeva prima
      if (T[1] >= J[1]) return [T[0], yv];
      return [J[0] + (T[0] - J[0]) * PP.lungBraccia, Math.max(yv, J[1] + (T[1] - J[1]) * PP.lungBraccia)];
    }
    function braccio(lato) {
      var J = [C + lato * Jd, Jy], br = opts.braccia, E, W, mano = "rilassata", polso = 0, davanti = false, dirMano = null, schiaccia = 1, tiene = false;
      var su = br === "su" || (br === "uno" && lato === -1), canna = br === "canna" && lato === 1;
      var gd = gesto && !su && !canna ? (gesto.due || (lato === latoG ? gesto.uno : null)) : null;
      if (su || canna) {
        var a1, a2;
        if (su) { a1 = 128; a2 = 152; mano = "aperta"; if (PP) { var yS = 999 - PP.gambe - (999 - (Jy + 142 * Math.cos(128 * DEG) + 126 * Math.cos(152 * DEG))) / PP.S, eS = Jy + L1 * Math.cos(a1 * DEG); a2 = cl(Math.acos(cl((yS - eS) / L2, -1, 1)) / DEG, 120, 152); } } else { var an = cl(+opts.angolo || 0, -30, 175); a1 = Math.max(4, an - 14); a2 = Math.max(10, an + 10); mano = "pugno"; }
        E = [J[0] + lato * L1 * Math.sin(a1 * DEG), J[1] + L1 * Math.cos(a1 * DEG)]; W = [E[0] + lato * L2 * Math.sin(a2 * DEG), E[1] + L2 * Math.cos(a2 * DEG)];
      } else if (gd) {
        var f = gd.f || [1, 1], T = gd.t ? gd.t(GG) : null, r = T ? ik(J, bersaglio(J, [C + lato * T[0], T[1]]), L1 * f[0], L2 * f[1], lato) : null;
        if (gd.ang) {   // (ritocchi) un gesto che dice gli angoli (come la canna): braccio e avambraccio, gradi da giù verso fuori
          var e1 = [J[0] + lato * L1 * f[0] * Math.sin(gd.ang[0] * DEG), J[1] + L1 * f[0] * Math.cos(gd.ang[0] * DEG)];
          r = { E: e1, W: [e1[0] + lato * L2 * f[1] * Math.sin(gd.ang[1] * DEG), e1[1] + L2 * f[1] * Math.cos(gd.ang[1] * DEG)] };
        }
        E = r.E; W = r.W; mano = gd.mano || mano; polso = gd.polso || 0; davanti = !!gd.davanti; dirMano = gd.dirMano; schiaccia = gd.schiaccia || 1;
      } else if (lato === 1 && regO && !opts.seduto && POSE_PRESA[regO.posa || "davanti"]) {   // tiene una cosa: la posa del braccio la sceglie il pezzo
        var PO = POSE_PRESA[regO.posa || "davanti"], TP = PO.t(GG), rp = ik(J, bersaglio(J, [C + lato * TP[0], TP[1]]), L1 * PO.f[0], L2 * PO.f[1], lato);
        E = rp.E; W = rp.W; mano = "impugna"; davanti = !!PO.davanti || (ROB && (regO.posa || "davanti") === "davanti"); tiene = true;
      } else if (opts.seduto) {   // seduto: ogni mano appoggiata sulla SUA coscia
        // (g5, dopo il critico: «le mani pendono giunte davanti al cavallo, gli avambracci sembrano bastoncini storti») il polso sta sulla
        // coscia un po' verso fuori (le mani staccate tra loro), appena sotto la piega dell anca, e la mano scende lungo la coscia verso il
        // ginocchio (non più verso il cavallo); il braccio sempre un po' piegato col gomito in fuori (mai dritto e rigido: se la coscia è
        // troppo lontana per la lunghezza del braccio il polso si ferma un po' prima) e l avambraccio intero, largo come in piedi
        var gS = gIn(650), PS = [C + lato * (gS[0] + gS[1] * 0.4), SED.yAB - 18], dS = Math.hypot(PS[0] - J[0], PS[1] - J[1]), dM = (L1 + L2) * 0.972;
        if (dS > dM) PS = [J[0] + (PS[0] - J[0]) * dM / dS, J[1] + (PS[1] - J[1]) * dM / dS];
        var rs = ik(J, PS, L1, L2, lato);
        E = rs.E; W = rs.W; mano = "piatta"; davanti = true; dirMano = -6;
      } else {   // a riposo: le braccia un po' staccate dal fianco
        // (terzo tempo) più vive: il braccio un po' più staccato, il gomito appena piegato (l avambraccio viene un po' avanti:
        // visto da davanti è più corto e torna verso il fianco), la mano che segue l avambraccio
        var rob = ROB, gE = rob ? (m ? 0 : 4) : 14, gW = rob ? (m ? 0 : 4) : 11;
        var yE = J[1] + L1 * 0.99, ar = Math.asin(cl((largTronco(yE) + gE + B.aw[1] / 2 - Jd) / L1, 0.06, 0.55));
        E = [J[0] + lato * L1 * Math.sin(ar), J[1] + L1 * Math.cos(ar)];
        var L2v = L2 * (rob ? 0.92 : 0.95), yW = E[1] + L2v * 0.99, aw2 = Math.asin(cl((largTronco(yW) + gW + B.aw[3] / 2 - (E[0] - C) * lato) / L2v, -0.3, 0.55));
        if (!rob) aw2 = Math.max(ar - 10 * DEG, aw2);
        W = [E[0] + lato * L2v * Math.sin(aw2), E[1] + L2v * Math.cos(aw2)];
        dirMano = aw2 / DEG - 5;
        if (lato === 1 && regO && !opts.seduto) { mano = "impugna"; tiene = true; dirMano = null; }   // (posa «fianco»: la cosa lungo il fianco)
      }
      var l1 = Math.hypot(E[0] - J[0], E[1] - J[1]), l2 = Math.hypot(W[0] - E[0], W[1] - E[1]);
      var d1 = [(E[0] - J[0]) / l1, (E[1] - J[1]) / l1], aw = B.aw, S0 = [J[0] - d1[0] * 16, J[1] - d1[1] * 16];
      function at(P, Q, t) { return [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]; }
      var nodi = [[S0[0], S0[1], aw[0] * 0.86], [J[0], J[1], aw[0]], at(J, E, 0.14).concat([aw[0]]), at(J, E, 0.5).concat([aw[0] * 0.9]), [E[0], E[1], aw[1]], at(E, W, 0.22).concat([aw[2]]), at(E, W, 0.6).concat([aw[2] * 0.86]), [W[0], W[1], aw[3]]];
      return { lato: lato, J: J, E: E, W: W, l1: l1, l2: l2, a1: Math.atan2(lato * (E[0] - J[0]), E[1] - J[1]) / DEG, a2: Math.atan2(lato * (W[0] - E[0]), W[1] - E[1]) / DEG,
        su: su, canna: canna, nodi: nodi, mano: mano, polso: polso, davanti: davanti, dirMano: dirMano, schiaccia: schiaccia, tiene: tiene, due: !!(gd && gesto && gesto.due) };
    }
    var sedV = !!opts.seduto && !opts.busto && !opts.viso && !opts.gambe, vs = vistaSu(PP, sedV);
    // vedi(P) = dove sta nel riquadro 200×264 un punto del busto, delle braccia o delle mani (coordinate dei pezzi)
    return { m: m, B: B, Y: Y, C: C, GN: GN, gIn: gIn, pancia: pancia, rob: ROB, rc: rc, Jd: Jd, Jy: Jy, L1: L1, L2: L2, largTronco: largTronco, BR: { "-1": braccio(-1), "1": braccio(1) },
      P: PP, vedi: function (P) { var v = vs(P[0], P[1]); return [v[0] * 0.25 + 50, v[1] * 0.25 + 2]; } };
  };

  var cnt = 0, PREF = "oa" + Math.random().toString(36).slice(2, 5);

  // =========================================================
  //  IL DISEGNO
  // =========================================================
  A.svg = function (c, opts, OPZ) {
    opts = opts || {};
    var m = c.forma !== "donna";
    var p = PREF + (cnt++).toString(36) + "_";
    var D = [];   // definizioni (gradienti, ritagli)
    function col(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }
    function stops(st) { return st.map(function (s) { return "<stop" + (+s[0] ? " offset='" + s[0] + "'" : "") + " stop-color='" + s[1] + "'" + (s[2] != null && +s[2] !== 1 ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join(""); }
    var gradC = {}, gradA = {};
    function gradUno(id, t) { var sp = t.indexOf(" "), k = t.slice(1, sp) + t.slice(sp + p.length + id.length + 6); if (gradC[k]) { gradA[id] = gradC[k]; return gradC[k]; } D.push(t); return (gradC[k] = "url(#" + p + id + ")"); }
    function LG(id, x1, y1, x2, y2, st, us) { return gradUno(id, "<linearGradient id='" + p + id + "'" + (us || +x1 ? " x1='" + x1 + "'" : "") + (us || +y1 ? " y1='" + y1 + "'" : "") + (us || +x2 !== 1 ? " x2='" + x2 + "'" : "") + (us || +y2 ? " y2='" + y2 + "'" : "") + (us ? " gradientUnits='userSpaceOnUse'" : "") + ">" + stops(st) + "</linearGradient>"); }
    function RG(id, st, extra) { return gradUno(id, "<radialGradient id='" + p + id + "' " + (extra || "") + ">" + stops(st) + "</radialGradient>"); }
    var nSoft = 0;
    var softC = {};
    // (leggero, 5 nov 2026) K.soft dà un segnaposto; El/ElR lo scrivono come gradiente del colore (uno per colore) + fill-opacity:
    // stesso disegno, molti meno gradienti. Se un segnaposto finisce altrove, fine() aggiunge il gradiente di prima.
    var softI = {}, softB = {}, nSB = 0, nSC = 0, nSR = 0;   // nSC = ombre chieste, nSR = ombre scritte da El/ElR
    function soft(col, op) { nSC++; op = Math.round(op * 100) / 100; var k = col + op; if (softC[k]) return softC[k]; var id = p + "z" + (nSoft++).toString(36); softI["url(#" + id + ")"] = [col, op, id]; return (softC[k] = "url(#" + id + ")"); }
    function opz(v) { var t = "" + v; return v > 0 && v < 1 ? t.slice(1) : t; }
    function fine(sv) {
      if (nSR >= nSC || sv.indexOf("url(#" + p + "z") < 0) return sv;   // (se ogni K.soft è finita in un'ellisse non serve cercare)
      var g = ""; for (var k in softI) if (sv.indexOf(k) >= 0) { var si = softI[k]; g += "<radialGradient id='" + si[2] + "'><stop stop-color='" + si[0] + "' stop-opacity='" + opz(si[1]) + "'/><stop offset='1' stop-color='" + si[0] + "' stop-opacity='0'/></radialGradient>"; }
      var i = sv.indexOf("<defs>"); return i < 0 ? sv : sv.slice(0, i + 6) + g + sv.slice(i + 6);
    }
    function U(id) { return gradA[id] || "url(#" + p + id + ")"; }
    function Pa(d, f, x) { return "<path d='" + d + "' fill='" + f + "'" + (x || "") + "/>"; }
    function St(d, c2, w, op, x) { return "<path d='" + d + "' fill='none' stroke='" + c2 + "' stroke-width='" + w + "' stroke-linecap='round'" + (op != null ? " opacity='" + op + "'" : "") + (x ? tolto(x) : "") + "/>"; }
    // (un pezzo che passa ancora stroke-linecap/linejoin in x: valeva già il round scritto prima (la seconda copia è ignorata);
    //  la si toglie perché un attributo doppio rompe l'SVG come immagine)
    var RX_TOLTO = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
    function tolto(x) { return x.indexOf("stroke-line") < 0 ? x : x.replace(RX_TOLTO, ""); }
    function El(cx, cy, rx, ry, f, x) { return "<ellipse cx='" + q(cx) + "' cy='" + q(cy) + "' rx='" + q(rx) + "' ry='" + q(ry) + "' " + riempi(f) + (x || "") + "/>"; }
    function riempi(f) {
      var si = softI[f]; if (!si) return "fill='" + f + "'"; nSR++;
      var b = softB[si[0]]; if (!b) { b = softB[si[0]] = p + "b" + (nSB++).toString(36); D.push("<radialGradient id='" + b + "'><stop stop-color='" + si[0] + "'/><stop offset='1' stop-color='" + si[0] + "' stop-opacity='0'/></radialGradient>"); }
      return "fill='url(#" + b + ")' fill-opacity='" + opz(si[1]) + "'";
    }
    var nClip = 0;
    var clipC = {};
    function clip(d) { var kc = Array.isArray(d) ? d.join("|") : d; if (clipC[kc]) return clipC[kc]; return (clipC[kc] = clip0(d)); }
    function clip0(d) { var id = "c" + (nClip++); D.push("<clipPath id='" + p + id + "'>" + (Array.isArray(d) ? d : [d]).map(function (x) { return "<path d='" + x + "'/>"; }).join("") + "</clipPath>"); return "url(#" + p + id + ")"; }
    // un cilindro: luce a sinistra, ombra a destra (sulla forma intera: braccia, gambe, maniche)
    var cilCache = {};
    function cil(colore, forza) {
      forza = forza == null ? 1 : forza;
      var k = colore + "|" + forza; if (cilCache[k]) return cilCache[k];
      var L = lum(colore), chiaro = mix(colore, "#ffffff", (0.22 + 0.16 * (1 - L)) * forza), scuro = mix(colore, "#1a0c14", (0.28 + 0.1 * L) * forza), bordo = mix(colore, "#12060c", (0.46 + 0.1 * L) * forza);
      return (cilCache[k] = LG("cy" + Object.keys(cilCache).length, 0, 0, 1, 0, [[0, mix(colore, scuro, 0.35)], [0.12, mix(colore, chiaro, 0.7)], [0.3, chiaro], [0.55, colore], [0.82, scuro], [1, bordo]]));
    }

    // ---------- colori ----------
    var sk = col(OPZ.pelle, c.pelle), Lsk = lum(sk);
    var skL = mix(sk, "#fff3e8", 0.2 + 0.22 * Lsk), skD = mix(sk, Lsk < 0.35 ? "#3a160c" : "#b4583a", Lsk < 0.35 ? 0.3 : 0.3), skDD = mix(sk, "#4a1a10", Lsk < 0.35 ? 0.42 : 0.55);
    var hc = col(OPZ.colCap, c.colCap), Lh = lum(hc);
    var hL = mix(hc, Lh < 0.18 ? "#8a7a70" : (Lh > 0.7 ? "#ffffff" : "#fff1dc"), Lh < 0.18 ? 0.3 : 0.36), hD = mix(hc, "#120a05", 0.45), hDD = mix(hc, "#0a0503", Lh < 0.18 ? 0.5 : 0.7);
    var iris = col(OPZ.iride, c.iride);
    var mg = col(OPZ.maglia, c.maglia), pt = col(OPZ.pantaloni, c.pantaloni), sc = col(OPZ.scarpe, c.scarpe), ac = col(OPZ.colAcc, c.colAcc == null ? mg : c.colAcc);   // (senza colore il cappello prende quello della maglia, anche dei colori nuovi)
    var cc = col(OPZ.colCollo, c.colCollo);
    // (tappa 3) il secondo colore del capo e dei pantaloni (null = non c'è: tutto come prima)
    var m2 = c.maglia2 != null ? col(OPZ.maglia, c.maglia2) : null, p2 = c.pant2 != null ? col(OPZ.pantaloni, c.pant2) : null;
    var labbro = m ? mix(sk, "#b5594f", Lsk < 0.35 ? 0.3 : 0.48) : mix(sk, "#c4566a", Lsk < 0.35 ? 0.35 : 0.55);
    var rossetto = c.rossetto && c.rossetto !== "nessuno" ? col(OPZ.colRossetto, c.colRossetto) : null;
    if (rossetto) labbro = mix(labbro, rossetto, c.rossetto === "tinta" ? 0.5 : 0.88);

    // ---------- misure ----------
    var PP = propDi(opts), B = buildDi(m, c.corpo, PP);
    var C = 200, Y = { collo: 246, spalla: 268, delt: 296, ascella: 336, petto: m ? 372 : 382, vita: m ? 452 : 442, fianchi: 528, cavallo: 572 };
    var HT = PP ? "translate(200 " + (214 + PP.collo) + ") rotate(-1.5) scale(" + n1(900 * PP.testa) / 1000 + ")" : "translate(200 214) rotate(-1.5) scale(.9)";
    var F = FACCIA[c.viso] || FACCIA.ovale;
    F = { cw: F.cw, jx: F.jx * (m ? 1 : 0.88), jy: F.jy, cx: F.cx * (m ? 1 : 0.8), L: F.L, k1: F.k1 || 0 };
    var top = -(78 + 70 * F.L);
    var faceD = "M" + (-F.cw) + " -78C" + (-F.cw - 1) + " " + n1(-78 - 40 * F.L) + " " + n1(-F.cw * 0.63) + " " + n1(top + 2) + " 0 " + n1(top) +
      "C" + n1(F.cw * 0.63) + " " + n1(top + 2) + " " + (F.cw + 1) + " " + n1(-78 - 40 * F.L) + " " + F.cw + " -78" +
      "C" + F.cw + " -56 " + (F.cw - 2) + " -40 " + n1(F.jx) + " " + n1(F.jy) +
      "C" + n1(F.jx - 10 + F.k1 * 1.5) + " " + n1(F.jy + 14 + F.k1) + " " + n1(F.cx) + " 0 0 0" +
      "C" + n1(-F.cx) + " 0 " + n1(-F.jx + 10 - F.k1 * 1.5) + " " + n1(F.jy + 14 + F.k1) + " " + n1(-F.jx) + " " + n1(F.jy) +
      "C" + (-F.cw + 2) + " -40 " + (-F.cw) + " -56 " + (-F.cw) + " -78Z";

    // gambe: i punti veri di questa corporatura
    var GN = gambeDi(m, B, !!opts.seduto && !opts.busto && !opts.viso && !opts.gambe);
    function gIn(y) {   // [cx, fuori, dentro] alla quota y
      if (y <= GN[0][0]) return [GN[0][1], GN[0][2], GN[0][3]];
      for (var i = 1; i < GN.length; i++) if (y <= GN[i][0]) { var a = GN[i - 1], b = GN[i], t = (y - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; }
      var z = GN[GN.length - 1]; return [z[1], z[2], z[3]];
    }
    // il contorno di una gamba (lato -1 sinistra, 1 destra) da y0 a y1, con agio (stoffa larga) e opzioni dei pantaloni
    function gamba(lato, o) {
      o = o || {};
      var e = o.agio || 0, ei = o.agioI != null ? o.agioI : e * 0.75, y0 = o.da != null ? o.da : GN[0][0] - 8, y1 = o.a != null ? o.a : 940;
      var ys = [y0]; GN.forEach(function (q) { if (q[0] > y0 + 6 && q[0] < y1 - 6) ys.push(q[0]); }); ys.push(y1);
      var dr = o.dritto, rif = dr ? gIn(dr) : null;
      var pts = ys.map(function (y) {
        var g = gIn(y), cx = g[0], fo = g[1] + e, di = g[2] + ei;
        if (dr && y > dr) { var t = Math.min(1, (y - dr) / Math.max(1, (o.orlo || 940) - dr)), fo2 = rif[1] + e + ((o.orloL != null ? o.orloL : rif[1] + e) - (rif[1] + e)) * t, di2 = rif[2] + ei + ((o.orloL != null ? o.orloL * 0.85 : rif[2] + ei) - (rif[2] + ei)) * t; fo = Math.max(fo * (o.segue ? 1 : 0), fo2); di = Math.max(di * (o.segue ? 1 : 0), di2); }
        if (o.svasa && y > 760) { var s2 = (y - 760) / 180 * o.svasa; fo += s2; di += s2 * 0.8; }
        return [y, cx, fo, di];
      });
      var out = pts.map(function (q) { return [C + lato * (q[1] + q[2]), q[0]]; }), inn = pts.map(function (q) { return [C + lato * (q[1] - q[3]), q[0]]; }).reverse();
      var ol = out[out.length - 1], ir = inn[0], cv = o.curvaOrlo != null ? o.curvaOrlo : 5;
      return "M" + q(out[0][0]) + " " + q(out[0][1]) + cr(out) + "Q" + q((ol[0] + ir[0]) / 2) + " " + q((ol[1] + ir[1]) / 2 + cv) + " " + q(ir[0]) + " " + q(ir[1]) + cr(inn) + "Z";
    }
    // il bacino (la parte dei pantaloni o della gonna dalla vita al cavallo)
    function bacino(o) {
      o = o || {}; var e = o.agio || 4, v = o.vita || (m ? 456 : 448), wv = Math.max(B.wt, m ? B.wt : B.wt) + e, wh = B.hp + e, yc = o.cavallo || 600;
      var gl = gIn(560);
      return "M" + q(C - wv) + " " + v + "L" + q(C + wv) + " " + v + "C" + q(C + wv + 4) + " " + (v + 30) + " " + q(C + wh + 2) + " " + (Y.fianchi - 30) + " " + q(C + wh) + " " + Y.fianchi +
        "L" + q(C + gl[0] + gl[1] + e) + " 566L" + q(C + 4) + " " + yc + "L" + q(C - 4) + " " + yc + "L" + q(C - gl[0] - gl[1] - e) + " 566L" + q(C - wh) + " " + Y.fianchi +
        "C" + q(C - wh - 2) + " " + (Y.fianchi - 30) + " " + q(C - wv - 4) + " " + (v + 30) + " " + q(C - wv) + " " + v + "Z";
    }
    // =========================================================
    //  IL CORPO COME UN PEZZO UNICO (secondo tempo, 5 nov 2026)
    //  Una sagoma sola: collo → trapezio → spalla tonda (il deltoide) → fianco → anca → gambe.
    //  Le braccia sono UN contorno (spalla tonda, braccio, gomito tondo, avambraccio) che parte dentro la
    //  spalla tonda: con qualunque angolo la spalla resta piena, senza buchi né «palline».
    //  Pelle e vestiti si colorano a tinta unita su tutta la sagoma e si ombreggiano SOPRA (luci e ombre
    //  morbide ritagliate sulla sagoma intera): le giunture non si vedono. I vestiti sono la stessa linea
    //  allargata (agio) e tagliata per zona: la stoffa non sporge mai.
    // =========================================================
    var G = A.geometria(c, opts), rc = G.rc, Jd = G.Jd, Jy = G.Jy, pancia = G.pancia, BR = G.BR;   // (pancia: vedi geometria)
    function dist(P, Q) { return Math.hypot(Q[0] - P[0], Q[1] - P[1]); }
    // punto di tangenza (in alto, lato destro, x = distanza dal centro) della retta da F alla spalla tonda di raggio r
    function tang(F, r) {
      var vx = F[0] - Jd, vy = F[1] - Jy, d = Math.max(r + 0.5, Math.hypot(vx, vy)), b = Math.atan2(vy, vx), a = Math.acos(r / d);
      var t1 = b - a, t2 = b + a, t = Math.sin(t1) < Math.sin(t2) ? t1 : t2;
      return { p: [Jd + r * Math.cos(t), Jy + r * Math.sin(t)], a: t };
    }
    function arcoPts(r, a0, a1, n, cx, cy) { var o = []; for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
    function fuoriGamba(y) { var g = gIn(y); return g[0] + g[1]; }
    // il fianco destro del tronco (x = distanza dal centro) dalla spalla in giù, allargato di e
    function lato(e, o) {
      var R = [], pz = o.pancia != null ? o.pancia : pancia;
      // (g4) sul robusto la maglia scende dritta dalla pancia (prima rientrava verso l orlo: sembrava corta e tirata sulla pancia)
      var xF = B.hp + e; if (G.rob && !o.pelle && (o.orlo || 508) < 560) xF = Math.max(xF, B.wt + e * 1.1 + pz - 6);
      R.push([B.ap + e, Y.ascella + 6], [B.ch + e, Y.petto], [B.wt + e * 1.1 + pz, Y.vita], [xF, Y.fianchi]);
      R.push([fuoriGamba(560) + e, 560], [fuoriGamba(600) + e * 0.9, 600]);
      return R;
    }
    // la spalla: dal punto F (fine del collo o della spallina) la retta tangente alla spalla tonda e l'arco fino sotto
    function spalla(F, e) {
      var r = rc + e * 0.55, T = tang(F, r), aF = 54 * DEG, R = [[(F[0] + T.p[0]) / 2, (F[1] + T.p[1]) / 2], T.p];
      return R.concat(arcoPts(r, T.a + (aF - T.a) / 4, aF, 3, Jd, Jy));
    }
    // il tronco. Pelle: { pelle: true }. Vestito: { agio, orlo, scollo: {tipo, prof, larg}, smanicato, spallina, svasa, curvaOrlo, pancia, orloLinea }
    function tronco(o) {
      o = o || {};
      var e = o.agio != null ? o.agio : (o.pelle ? 0 : 5), nk = B.nk, R;
      if (o.pelle) {
        R = [[nk - 3, 194], [nk - 1.5, 222], [nk + 2.5, 238], [nk + 13, 249]].concat(spalla([nk + 13, 249], 0)).concat(lato(0, o));
        var g6 = gIn(604);
        R.push([g6[0], 606]);
        var Rabs = R.map(function (p) { return [C + p[0], p[1]]; }), Labs = R.map(function (p) { return [C - p[0], p[1]]; }).reverse();
        return "M" + q(Labs[Labs.length - 1][0]) + " " + q(Labs[Labs.length - 1][1]) + "L" + q(Rabs[0][0]) + " " + q(Rabs[0][1]) + cr(Rabs) +
          "L" + q(C + 7) + " " + (Y.cavallo + 6) + "Q" + C + " " + (Y.cavallo + 12) + " " + q(C - 7) + " " + (Y.cavallo + 6) + "L" + q(Labs[0][0]) + " " + q(Labs[0][1]) + cr(Labs) + "Z";
      }
      var orlo = o.orlo || 508, sc2 = o.scollo || {}, prof = sc2.prof != null ? sc2.prof : 16, larg = sc2.larg != null ? sc2.larg : 3, sv = o.svasa || 0;
      var nl = B.nk + larg, ny = 240;
      R = [[nl, ny]];
      if (o.smanicato) {
        var sp = o.spallina != null ? o.spallina : 14;
        R.push([nl + sp, ny + 2], [B.ap - 6 + e * 0.3, Y.ascella - 20]);
      } else {
        var F = [nk + 13 + e * 0.3, 249 - e * 0.6];
        if (nl < F[0] - 4) R.push(F); else F = [nl + 2, ny + 3];
        R = R.concat(spalla(F, e));
      }
      // il fianco fino all'orlo (o oltre: cappotti e vestiti lunghi)
      var Ls = lato(e, o);
      if (o.smanicato) Ls[0] = [B.ap + e - 2, Y.ascella + 8];
      var tagliato = false;
      for (var i = 0; i < Ls.length; i++) {
        if (Ls[i][1] < orlo - 6) { R.push(Ls[i]); continue; }
        var P = i ? Ls[i - 1] : R[R.length - 1], Q = Ls[i], t = (orlo - P[1]) / Math.max(1, Q[1] - P[1]);
        R.push([P[0] + (Q[0] - P[0]) * Math.max(0, Math.min(1, t)) + sv, orlo]); tagliato = true; break;
      }
      if (!tagliato) {   // oltre le cosce: la stoffa scende e si allarga (svasa)
        var base = R[R.length - 1];
        if (orlo > 680) R.push([B.hp + e + sv * 0.6 + (orlo - Y.fianchi) * 0.05, (orlo + 600) / 2]);
        R.push([Math.max(base[0], B.hp + e) + sv + (orlo - Y.fianchi) * (orlo > 700 ? 0.1 : 0.04), orlo]);
      }
      var Rabs2 = R.map(function (p) { return [C + p[0], p[1]]; }), Labs2 = R.map(function (p) { return [C - p[0], p[1]]; }).reverse();
      var sc3 = sc2.tipo === "v" ? "L" + C + " " + (ny + prof) + "L" + q(C + nl) + " " + ny
        : (sc2.tipo === "quadro" ? "L" + q(C - nl + 4) + " " + (ny + prof) + "L" + q(C + nl - 4) + " " + (ny + prof) + "L" + q(C + nl) + " " + ny
        : "C" + q(C - nl + 2) + " " + q(ny + prof * 0.9) + " " + q(C - nl * 0.45) + " " + (ny + prof) + " " + C + " " + (ny + prof) + "C" + q(C + nl * 0.45) + " " + (ny + prof) + " " + q(C + nl - 2) + " " + q(ny + prof * 0.9) + " " + q(C + nl) + " " + ny);
      var hl = Labs2[0], fondo, giu = orlo;
      if (o.orloLinea) {   // (tappa 4, la camicia Moda) l orlo è una linea data, dal fianco destro verso il centro ([x dal centro, y]): specchiata a sinistra,
        // in mezzo un tratto dritto (le code della camicia fuori solo sui fianchi: una sagoma sola col tronco, non tre pezzi)
        var OL = o.orloLinea, Rr = [Rabs2[Rabs2.length - 1]].concat(OL.map(function (z) { return [C + z[0], z[1]]; })), Ll = OL.slice().reverse().map(function (z) { return [C - z[0], z[1]]; }).concat([hl]);
        fondo = cr(Rr) + "L" + N(Ll[0][0], 1) + N(Ll[0][1]) + cr(Ll);
        OL.forEach(function (z) { giu = Math.max(giu, z[1]); });
      } else fondo = "Q" + C + " " + q(orlo + (o.curvaOrlo != null ? o.curvaOrlo : 6)) + " " + q(hl[0]) + " " + q(hl[1]);
      var dT = "M" + q(C - nl) + " " + ny + sc3 + cr(Rabs2) + fondo + cr(Labs2) + "Z";
      orloT[dT] = giu;   // (tappa 3) dove finisce: le cuciture del jeans sull orlo
      return dT;
    }
    var orloT = {};
    function busto(o) { return tronco(o); }   // (nome di prima: lo usano i pezzi)

    // ---------- le braccia: un contorno solo ----------
    // larghezze intere lungo il braccio (s = distanza dalla spalla lungo braccio + avambraccio)
    function larghezze(b) {
      var aw = B.aw, l1 = b.l1, l2 = b.l2, tot = l1 + l2;
      var alz = Math.max(0, Math.min(1, (b.a1 - 50) / 80));
      // (g5, dopo il critico: «col braccio alzato l avambraccio del robusto è sottile rispetto al braccio e al busto») il braccio alzato
      // si allarga sulla spalla (alz): sul robusto si allarga anche l avambraccio (il polso resta quello: la mano non cambia)
      var fa = G.rob && alz ? 1 + 0.2 * alz : 1, fe = G.rob && alz ? 1 + 0.12 * alz : 1;
      return [[0, rc * 2], [l1 * 0.2, aw[0] * (1 + 0.28 * alz)], [l1 * 0.48, aw[0] * (m ? 0.98 : 0.94) * (1 + 0.1 * alz)], [l1 * 0.8, aw[1] * 1.02 * fe], [l1, aw[1] * 0.9 * fe], [l1 + l2 * 0.2, aw[2] * 1.08 * fa], [l1 + l2 * 0.45, aw[2] * 1.0 * fa], [l1 + l2 * 0.78, aw[2] * 0.8 * fe], [tot, aw[3]]];
    }
    function wAt(WS, s) { if (s <= 0) return WS[0][1]; for (var i = 1; i < WS.length; i++) if (s <= WS[i][0]) { var a = WS[i - 1], z = WS[i], t = (s - a[0]) / Math.max(0.01, z[0] - a[0]); return a[1] + (z[1] - a[1]) * t; } return WS[WS.length - 1][1]; }
    function ptAt(b, s) { if (s <= b.l1) { var t = s / b.l1; return [b.J[0] + (b.E[0] - b.J[0]) * t, b.J[1] + (b.E[1] - b.J[1]) * t]; } var u = Math.min(1, (s - b.l1) / b.l2); return [b.E[0] + (b.W[0] - b.E[0]) * u, b.E[1] + (b.W[1] - b.E[1]) * u]; }
    // il contorno chiuso del braccio fino a «fino» (0-1 della lunghezza), allargato di e (su tutta la larghezza: e/2 per lato);
    // svasa = stoffa in più all'orlo, curva = orlo curvo (maniche)
    var ultimiLati = null, manicaFino = {};
    // (giro3) IL GOMITO PIEGATO FORTE (più di 100°: microfono al petto, leva, applauso, braccia sul tavolo, pugni in alto): un contorno solo
    // tagliava l interno del gomito (il punto d angolo era limitato) e lasciava un cuneo vuoto tra braccio e avambraccio (si vedeva la
    // maglia, «un pezzo di manica fuori posto»), e l avambraccio sembrava storto. Ora sono DUE pezzi che si sovrappongono: il braccio con
    // il gomito tondo e l avambraccio che parte dal gomito tondo, nello stesso percorso (stesso verso: riempiti insieme come uno).
    // PIEGA[d] = { a: il braccio, b: l avambraccio, la, lb: i loro bordi senza i tagli dritti }: dipingi e pelleAvanti disegnano
    // l avambraccio SOPRA il braccio (col suo bordo), così il bordo del braccio sotto l avambraccio non si vede.
    var PIEGA = {}, PIEGA_MIN = 100 * DEG;
    function arco(cx, cy, r, a0, a1, n) { var o = []; for (var i = 1; i < n; i++) { var a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; }
    function piegato(b, WS, h, s0, fin, svasa, curva, da) {
      var l1 = b.l1, d1 = [(b.E[0] - b.J[0]) / l1, (b.E[1] - b.J[1]) / l1], d2 = [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2];
      var n1 = [-d1[1], d1[0]], n2 = [-d2[1], d2[0]], wE = wAt(WS, l1) / 2 + h;
      function lati(sa, sb, n) {   // i due lati di un tratto dritto da sa a sb (A = +n, B = -n)
        var S = WS.map(function (x) { return x[0]; }).filter(function (s) { return s > sa + 3 && s < sb - 3; }); S.unshift(sa); S.push(sb);
        var A2 = [], B2 = [];
        S.forEach(function (s) { var p = ptAt(b, Math.min(s, l1 + b.l2)), w = wAt(WS, s) / 2 + h + (s === fin && svasa ? svasa / 2 : 0); if (s === 0 && !da) w = rc + h * 0.7; if (Math.abs(s - l1) < 0.5) { p = b.E; w = wE; } A2.push([p[0] + n[0] * w, p[1] + n[1] * w]); B2.push([p[0] - n[0] * w, p[1] - n[1] * w]); });
        return [A2, B2];
      }
      // il braccio: dalla spalla (tonda) o da s0 (taglio dritto) fino al gomito tondo
      var L1 = lati(s0, l1, n1), aN = Math.atan2(n1[1], n1[0]), giro1 = arco(b.E[0], b.E[1], wE, aN, aN - Math.PI, 6), B1r = L1[1].slice().reverse();
      var bordo1 = L1[0].concat(giro1).concat(B1r), dA;
      if (da) dA = "M" + q(bordo1[0][0]) + " " + q(bordo1[0][1]) + cr(bordo1) + "Z";
      else {
        var r = rc + h * 0.7, na = Math.atan2(L1[0][0][1] - b.J[1], L1[0][0][0] - b.J[0]), nb = Math.atan2(B1r[B1r.length - 1][1] - b.J[1], B1r[B1r.length - 1][0] - b.J[0]), back = Math.atan2(-d1[1], -d1[0]);
        var x0 = nb, x1 = na; while (x1 < x0) x1 += 2 * Math.PI; var passa = back; while (passa < x0) passa += 2 * Math.PI;
        if (passa > x1) { x1 = na; while (x1 > x0) x1 -= 2 * Math.PI; }
        bordo1 = bordo1.concat(arco(b.J[0], b.J[1], r, x0, x1, 5)).concat([L1[0][0]]);
        dA = "M" + q(bordo1[0][0]) + " " + q(bordo1[0][1]) + cr(bordo1) + "Z";
      }
      // l avambraccio: dal gomito tondo fino a fin (l orlo come prima)
      var L2 = lati(l1, fin, n2), A2 = L2[0], B2r = L2[1].slice().reverse(), aM = Math.atan2(-n2[1], -n2[0]), giro2 = arco(b.E[0], b.E[1], wE, aM, aM - Math.PI, 6);
      var fA = A2[A2.length - 1], fB = B2r[0], cv = curva != null ? curva : 0;
      var orloD = cv ? "Q" + q((fA[0] + fB[0]) / 2 + d2[0] * cv) + " " + q((fA[1] + fB[1]) / 2 + d2[1] * cv) + " " + q(fB[0]) + " " + q(fB[1]) : "L" + q(fB[0]) + " " + q(fB[1]);
      var dB = "M" + q(A2[0][0]) + " " + q(A2[0][1]) + cr(A2) + orloD + cr(B2r.concat(giro2).concat([A2[0]])) + "Z";
      var d = dA + dB;
      PIEGA[d] = { a: dA, b: dB, la: bordo1, lb: B2r.concat(giro2).concat(A2) };
      ultimiLati = { A: bordo1, B: PIEGA[d].lb };
      return d;
    }
    // da (facoltativo, 0-1) = comincia lì con un taglio dritto, senza la spalla tonda (per ridisegnare l avambraccio che passa davanti)
    function contornoBraccio(lato2, e, fino, svasa, curva, da) {
      var b = BR[lato2], WS = larghezze(b), h = (e || 0) / 2, tot = b.l1 + b.l2, fin = tot * Math.max(0.03, Math.min(1, fino == null ? 1 : fino)), s0 = da ? tot * da : 0;
      var d1 = [(b.E[0] - b.J[0]) / b.l1, (b.E[1] - b.J[1]) / b.l1], d2 = [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2];
      var cosB = Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1])), bend = Math.acos(cosB);
      if (bend > PIEGA_MIN && fin > b.l1 + 4 && s0 < b.l1 - 4) return piegato(b, WS, h, s0, fin, svasa, curva, da);
      var S = larghezze(b).map(function (q) { return q[0]; }).filter(function (s) { return s > s0 + 3 && s < fin - 4; });
      S.unshift(s0); S.push(fin);
      var lati = [1, -1].map(function (sg) {
        var n1v = [-d1[1] * sg, d1[0] * sg], n2v = [-d2[1] * sg, d2[0] * sg], dentro = n1v[0] * d2[0] + n1v[1] * d2[1] > 0;
        var wE = wAt(WS, b.l1) / 2 + h, taglio = dentro && bend > 0.14 ? wE * Math.tan(bend / 2) + 2 : 0, P = [];
        S.forEach(function (s) {
          var w = wAt(WS, s) / 2 + h + (s === fin && svasa ? svasa / 2 : 0);
          if (s === 0 && !da) w = rc + h * 0.7;
          if (Math.abs(s - b.l1) < 0.5 && bend > 0.14) {   // il gomito
            if (dentro) { var bx = n1v[0] + n2v[0], by = n1v[1] + n2v[1], bl = Math.hypot(bx, by) || 1, md = Math.min(w / Math.cos(bend / 2), w * 1.7); P.push([b.E[0] + bx / bl * md, b.E[1] + by / bl * md]); }
            else { var a0 = Math.atan2(n1v[1], n1v[0]), a1 = Math.atan2(n2v[1], n2v[0]); while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; while (a0 - a1 > Math.PI) a1 += 2 * Math.PI; for (var k = 0; k <= 3; k++) { var a = a0 + (a1 - a0) * k / 3; P.push([b.E[0] + Math.cos(a) * w, b.E[1] + Math.sin(a) * w]); } }
            return;
          }
          if (taglio && Math.abs(s - b.l1) < taglio) return;
          var p = ptAt(b, s), n = s < b.l1 ? n1v : n2v;
          if (Math.abs(s - b.l1) < 0.5) n = [(n1v[0] + n2v[0]) / 2, (n1v[1] + n2v[1]) / 2];
          P.push([p[0] + n[0] * w, p[1] + n[1] * w]);
        });
        return P;
      });
      var A1 = lati[0], B1 = lati[1].slice().reverse();
      ultimiLati = { A: A1, B: B1 };
      if (da) { var fA0 = A1[A1.length - 1], fB0 = B1[0]; return "M" + q(A1[0][0]) + " " + q(A1[0][1]) + cr(A1) + "L" + q(fB0[0]) + " " + q(fB0[1]) + cr(B1) + "Z"; }
      // la spalla tonda dietro al perno (da B1 al primo punto di A1, girando dalla parte opposta al braccio)
      var r = rc + h * 0.7, aA = Math.atan2(-d1[0], d1[1]) /* normale +1 */, cap = [];
      var na = Math.atan2(A1[0][1] - b.J[1], A1[0][0] - b.J[0]), nb = Math.atan2(B1[B1.length - 1][1] - b.J[1], B1[B1.length - 1][0] - b.J[0]), back = Math.atan2(-d1[1], -d1[0]);
      // da nb a na passando per «back»
      var x0 = nb, x1 = na; while (x1 < x0) x1 += 2 * Math.PI; var passa = back; while (passa < x0) passa += 2 * Math.PI;
      if (passa > x1) { x1 = na; while (x1 > x0) x1 -= 2 * Math.PI; }
      for (var k2 = 1; k2 < 5; k2++) { var a2 = x0 + (x1 - x0) * k2 / 5; cap.push([b.J[0] + Math.cos(a2) * r, b.J[1] + Math.sin(a2) * r]); }
      var fA = A1[A1.length - 1], fB = B1[0], fd = s2p(fin), cv = curva != null ? curva : 0;
      function s2p(s) { return fin >= tot - 0.5 ? d2 : (s < b.l1 ? d1 : d2); }
      var orloD = cv ? "Q" + q((fA[0] + fB[0]) / 2 + fd[0] * cv) + " " + q((fA[1] + fB[1]) / 2 + fd[1] * cv) + " " + q(fB[0]) + " " + q(fB[1]) : "L" + q(fB[0]) + " " + q(fB[1]);
      return "M" + q(A1[0][0]) + " " + q(A1[0][1]) + cr(A1) + orloD + cr(B1.concat(cap).concat([A1[0]])) + "Z";
    }
    // (nomi di prima, li usano i pezzi) una manica: fino alla frazione lung del braccio, agio sulla larghezza, svasa all'orlo
    var agioBr = {};   // (ritocchi) quanto è larga la manica più larga (agio + svasa) di ogni braccio: il braccio staccato prende solo quella
    // (correzione della tappa 3, Tavola 2: «Hawaiana: maniche corte e fiori») la camicia (e la camicetta) hawaiana ha le maniche corte, a 0,38
    // del braccio come nella tavola: mentre si disegna quel capo manica e fineManica non vanno oltre manicaMax (i polsini diventano l orlo
    // della manica corta, la pelle del braccio si vede da lì in giù anche nei gesti). Gli altri capi e le altre fantasie: come prima.
    var manicaMax = 1, corteCapo = c.fant === "hawaiana" && /^(camicia|camicetta)$/.test(c.capo) ? 0.38 : 1;
    function manica(lato2, o) { o = o || {}; var lg = o.lung != null ? o.lung : 1; if (manicaMax < 1 && lg > manicaMax) lg = manicaMax; manicaFino[lato2] = Math.max(manicaFino[lato2] || 0, lg); agioBr[lato2] = Math.max(agioBr[lato2] || 0, (o.agio != null ? o.agio : 8) + (o.svasa || 0)); return contornoBraccio(lato2, o.agio != null ? o.agio : 8, lg, o.svasa || 0, o.tonda ? 6 : 0); }
    // dove finisce la manica: punto, direzione, larghezza (intera) del braccio lì
    function fineManica(lato2, lung) {
      var b = BR[lato2], tot = b.l1 + b.l2, s = tot * Math.max(0.03, Math.min(1, lung, manicaMax)), p = ptAt(b, s), d = s < b.l1 ? [(b.E[0] - b.J[0]) / b.l1, (b.E[1] - b.J[1]) / b.l1] : [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2];
      return { x: p[0], y: p[1], dx: d[0], dy: d[1], w: wAt(larghezze(b), s) };
    }

    // ---------- colorare una sagoma fatta di pezzi, senza giunture ----------
    // le scene grandi: «corpo» = l avatar senza il braccio LP, «braccio» = solo quel braccio (pelle, manica, mano), da far ruotare sulla spalla
    var SPALLE = !!opts.spalle;   // di spalle: niente viso, capelli che coprono la nuca, vestiti a tinta unita (il retro), tacchi delle scarpe
    var PARTE = opts.parte, LP = opts.latoParte === 0 ? 0 : (opts.latoParte === -1 ? -1 : 1);
    function tieni(lato2) { return !PARTE || (PARTE === "corpo" ? LP !== 0 && lato2 !== LP : LP === 0 || lato2 === LP); }
    // un ornamento che sta SOLO sulla manica (polsini, righe, toppe): nei pezzi va passato di qui, così segue il braccio staccato
    function suManica(lato2, svg) { return tieni(lato2) ? svg || "" : ""; }
    var luceG = null;
    function luceGlobale() {   // la luce da sinistra su tutta la figura (stessa per pelle e vestiti)
      if (!luceG) luceG = LG("luceG", C - B.sho - 24, 0, C + B.sho + 24, 0, [[0, "#ffffff", 0.18], [0.3, "#ffffff", 0.04], [0.52, "#ffffff", 0], [0.74, "#000000", 0.04], [1, "#000000", 0.17]], true);
      return luceG;
    }
    function ElR(cx, cy, rx, ry, ang, f) { return "<ellipse cx='" + q(cx) + "' cy='" + q(cy) + "' rx='" + q(rx) + "' ry='" + q(ry) + "' " + riempi(f) + " transform='rotate(" + q(ang) + " " + q(cx) + " " + q(cy) + ")'/>"; }
    // il volume di un tratto (P→Q, larghezza w): luce sul lato verso sinistra-alto, ombra dall'altro (ellissi morbide: niente bordi)
    function cilindro(P, Q, w, chiaro, scuro, forza) {
      var dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      if (nx * -0.8 + ny * -0.6 < 0) { nx = -nx; ny = -ny; }   // la normale verso la luce
      var cx = (P[0] + Q[0]) / 2, cy = (P[1] + Q[1]) / 2, ang = Math.atan2(dy, dx) / DEG - 90, f = forza == null ? 1 : forza;
      return ElR(cx + nx * w * 0.24, cy + ny * w * 0.24, w * 0.2, l * 0.56, ang, soft(chiaro, 0.34 * f)) +
        ElR(cx - nx * w * 0.42, cy - ny * w * 0.42, w * 0.3, l * 0.62, ang, soft(scuro, 0.4 * f));
    }
    // il volume del braccio fino a «fino»
    function volumeBraccio(lato2, fino, chiaro, scuro, e, forza) {
      var b = BR[lato2], tot = b.l1 + b.l2, fin = tot * (fino == null ? 1 : fino), WS = larghezze(b), s = "", h = e || 0;
      var a1 = Math.min(fin, b.l1), p1 = ptAt(b, a1 * 0.08);
      s += cilindro(p1, ptAt(b, a1), wAt(WS, a1 * 0.4) + h, chiaro, scuro, forza);
      if (fin > b.l1 + 6) s += cilindro(ptAt(b, b.l1), ptAt(b, fin), wAt(WS, b.l1 + (fin - b.l1) * 0.4) + h, chiaro, scuro, forza);
      return s;
    }
    var nNoSpalla = 0;
    // (giro3) il bordo del braccio staccato: invisibile vicino alla spalla, pieno da 2 raggi in là (una maschera tonda: girando resta uguale)
    var sfumaS = {};
    function sfumaSpalla(lato2, r) {
      var J = BR[lato2].J, k = lato2 + "|" + n1(r); if (sfumaS[k]) return sfumaS[k];
      var id = p + "ms" + Object.keys(sfumaS).length;
      D.push("<radialGradient id='" + id + "g' gradientUnits='userSpaceOnUse' cx='" + q(J[0]) + "' cy='" + q(J[1]) + "' r='" + q(r * 2.1) + "'><stop offset='.55' stop-color='#000'/><stop offset='1' stop-color='#fff'/></radialGradient>" +
        "<mask id='" + id + "' maskUnits='userSpaceOnUse' x='-400' y='-600' width='1200' height='2200'><rect x='-400' y='-600' width='1200' height='2200' fill='url(#" + id + "g)'/></mask>");
      return (sfumaS[k] = "url(#" + id + ")");
    }
    function senzaSpalla(lato2, r) {   // tutto tranne il disco della spalla (per il bordo delle braccia)
      var J = BR[lato2].J, id = "ns" + (nNoSpalla++);
      D.push("<clipPath id='" + p + id + "'><path clip-rule='evenodd' d='M0 0H400V1000H0Z" + "M" + q(J[0] - r) + " " + q(J[1]) + "a" + q(r) + " " + q(r) + " 0 1 0 " + q(2 * r) + " 0a" + q(r) + " " + q(r) + " 0 1 0 " + q(-2 * r) + " 0Z'/></clipPath>");
      return "url(#" + p + id + ")";
    }
    // pz = { tronco: [d, …], braccia: [{ d, lato, fino, e }, …], altro: [d, …] (gambe…) }
    // o = { bordo: colore del bordo (scuro), chiaro, scuro: colori delle luci e delle ombre, volume: false (niente ombre sopra), dentro: svg in più ritagliato (pieghe, stampe),
    //       fino: la quota dove finisce il capo (tappa 4: per un capo fatto di più pezzi, così la fantasia non si scrive nelle fasce sotto l orlo) }
    function dipingi(pz, colore, o) {
      o = o || {};
      var tr = pz.tronco || [], br = pz.braccia || [], al = pz.altro || [];
      br = br.filter(function (q) { return tieni(q.lato); });
      if (manicaMax < 1) br = br.map(function (q0) { return q0.fino == null || q0.fino > manicaMax ? { d: q0.d, lato: q0.lato, fino: manicaMax, e: q0.e } : q0; });   // (le maniche corte)
      if (PARTE === "braccio") { tr = []; al = []; }
      if (!tr.length && !al.length && !br.length) return { svg: "", clip: "none" };
      // (tappa 3) la stoffa del capo o dei pantaloni che si stanno disegnando: del capo SOLO le parti col colore della maglia
      // (la camicia bianca sotto la giacca o il gilet resta com'è), dei pantaloni tutto. La stoffa cambia anche luce e volume.
      var fb = fabOra && (fabOra.sotto || colore === mg) ? fabOra : null, SF = fb && fb.st ? STOFFE[fb.st] : null;
      if (SF) { var o2 = {}, k2, so = SF.o(colore); for (k2 in o) o2[k2] = o[k2]; for (k2 in so) o2[k2] = so[k2]; o = o2; }
      var tutti = tr.concat(al).concat(br.map(function (q) { return q.d; }));
      var bordo = o.bordo || mix(colore, "#12060c", 0.5), chiaro = o.chiaro || "#ffffff", scuro = o.scuro || mix(colore, "#14080c", 0.6);
      var bL = mix(colore, bordo, 0.45), rimG = LG("rim" + (nRim++), C - B.sho - 20, 0, C + B.sho + 20, 0, [[0, bL], [0.5, mix(bL, bordo, 0.5)], [1, bordo]], true);
      var s = "";
      if (tr.length + al.length === 1) s += "<path d='" + tr.concat(al)[0] + "' fill='" + colore + "' stroke='" + rimG + "' stroke-width='4.4' paint-order='stroke'/>";
      else {
        tr.concat(al).forEach(function (d) { s += "<path d='" + d + "' fill='none' stroke='" + rimG + "' stroke-width='4.4'/>"; });
        al.forEach(function (d) { s += Pa(d, colore); });
        tr.forEach(function (d) { s += Pa(d, colore); });
      }
      // (giro3) il gomito piegato forte: prima il braccio col suo bordo, poi l avambraccio sopra (il suo bordo dopo, con gli altri)
      // (giro3) nel braccio staccato il bordo sfuma verso la spalla (niente riga che stacca la manica dalla spalla quando il braccio gira)
      // (tappa 3) la fantasia e la trama sul busto (e sulle gambe): sopra la stoffa, sotto le maniche, la luce e le ombre
      var cl = fb ? clip(tutti) : null, LS = fb ? strati(fb, colore) : null;
      var finoA = fb && !fb.sotto ? (o.fino || (tr.length === 1 && !al.length ? orloT[tr[0]] || null : null)) : null;   // dove finisce il capo (se si sa; o.fino: lo dice il pezzo, tappa 4)
      if (fb && tr.length + al.length) s += "<g clip-path='" + cl + "'>" + LS.map(function (x) { return stratoBusto(x, finoA); }).join("") + (fb.f === "jeans" && !(fb.sotto && K.jeansSuo) ? (fb.sotto ? jeansGambe(colore) : jeansBusto(colore, tr[0])) : "") + "</g>";
      function bordoBr(d, q) { var r0 = rc + (q.e || 0) / 2 + 1.5; return "<path d='" + d + "' fill='none' stroke='" + rimG + "' stroke-width='2.2'" + (PARTE === "braccio" ? " mask='" + sfumaSpalla(q.lato, r0) + "'" : " clip-path='" + senzaSpalla(q.lato, r0) + "'") + "/>"; }
      br.forEach(function (q) { var pg = PIEGA[q.d]; s += fb ? manicaStoffa(q, pg, colore, LS, bordoBr) : (pg ? Pa(pg.a, colore) + bordoBr(pg.a, q) + Pa(pg.b, colore) : Pa(q.d, colore)); });
      br.forEach(function (q) { var pg = PIEGA[q.d]; s += bordoBr(pg ? pg.b : q.d, q); });
      cl = cl || clip(tutti);
      var dopo = fb ? dopoStoffa(fb, SF, colore, tr.length + al.length > 0, br) : "";
      if (o.volume !== false) {
        s += "<g clip-path='" + cl + "'><rect x='-200' y='-200' width='800' height='1400' fill='" + luceGlobale() + "'" + (o.luce != null ? " opacity='" + opz(n1(o.luce * 100) / 100) + "'" : "") + "/>";
        br.forEach(function (q) { s += volumeBraccio(q.lato, q.fino, chiaro, scuro, q.e, o.forza); });
        if (o.dentro) s += o.dentro;
        s += dopo + "</g>";
      } else if (o.dentro || dopo) s += "<g clip-path='" + cl + "'>" + (o.dentro || "") + dopo + "</g>";
      return { svg: s, clip: cl };
    }

    // =========================================================
    //  LE STOFFE (tappa 3 dei vestiti, 6 nov 2026, Tavola 2: «secondo colore, fantasie e stoffe»)
    //  Campi della configurazione, tutti facoltativi (senza: il disegno è IDENTICO a prima, carattere per carattere):
    //   maglia2 / pant2 = il secondo colore (posizione nella tavolozza della maglia / dei pantaloni): colletti, polsini, coste, bordi
    //                     (li disegnano i pezzi con K.secondo) e il colore della fantasia;
    //   fant / fantP    = la fantasia su tutta la stoffa del capo / dei pantaloni (OPZ.fant: righe, quadri, pois, mimetica, jeans, hawaiana);
    //   stoffa / stoffaP = la trama e la luce (OPZ.stoffa: lana opaca, pelle tesa, raso morbido, paillettes che brillano).
    //  Si disegnano DENTRO K.dipingi (non attorno ai pezzi): valgono per ogni capo e ogni sotto che usa K.dipingi, anche quelli nuovi.
    //  Ordine: la stoffa, la fantasia e la trama del busto (o delle gambe), poi le maniche con la LORO fantasia girata lungo il braccio
    //  e sfalsata (la manica si stacca dal busto: la cucitura sulla spalla), i bordi delle braccia, la luce, le ombre, i riflessi.
    //  Motivi, sfumature e forme si scrivono UNA volta per avatar (id col prefisso dell avatar) e si riusano: le maniche e le fasce
    //  usano «varianti» (<pattern href> con un patternTransform: poche decine di caratteri). Nelle FASCE (in piedi le gambe accorciate,
    //  seduto cosce e stinchi) il motivo si ricompone con una variante per fascia: non si schiaccia e non salta da una fascia all altra.
    //  Di spalle (chiama) i capi si ridipingono con la stessa fantasia e la stessa stoffa; il secondo colore lo dicono i pezzi con
    //  K.dietro2 = { orlo: [quota, altezza], pol: lunghezza dei polsini, collo: 1 }.
    //  Per un pezzo che dipinge a parte un pezzo di stoffa del capo (cappuccio, revers, collo alto): K.motivo(d) = fantasia e trama su d.
    //  (correzione) La camicia hawaiana ha le maniche corte (vedi manicaMax: K.manicaMax e K.manicaCorta per i pezzi).
    // =========================================================
    function tessuto(f, st, c2, sotto) {
      f = f && FANT_OK[f] ? f : null; st = st && STOFFE[st] ? st : null;
      return f || st ? { f: f, st: st, c2: c2, sotto: sotto } : null;
    }
    var FANT_OK = { righe: 1, quadri: 1, pois: 1, mimetica: 1, jeans: 1, hawaiana: 1 };
    var fabOra = null;   // la stoffa del pezzo che si sta disegnando (la mette chiama)
    // le fasce di questa posa: [fino a quota, quanto è alta lì un'unità del disegno rispetto al busto]
    var sedS = !!opts.seduto && !opts.busto && !opts.viso && !opts.gambe && PARTE !== "braccio", FASCE = null;
    if (sedS) { var R0 = PP ? PP.S : 1; FASCE = [[SED.yAB, 1], [SED.yBC, SED.sB / R0], [SED.yCD, SED.sC / R0], [null, 1 / R0]]; }
    else if (PP && PARTE !== "braccio" && !opts.vita && !opts.busto && !opts.viso) FASCE = [[PROP_L0, 1], [PROP_L1, PP.sL], [null, 1]];
    // il colore della fantasia senza secondo colore: più chiaro sui colori scuri, più scuro sui chiari
    function coloreFant(b) { return lum(b) > 0.65 ? mix(b, "#1a1420", 0.55) : mix(b, "#ffffff", 0.7); }
    var nMt = 0, motiviC = {}, variantiC = {}, formeC = {}, stratiC = {}, nMa = 0;
    function motivo(k, w, h, dentro) {
      if (motiviC[k]) return motiviC[k];
      var id = p + "mt" + (nMt++).toString(36);
      D.push("<pattern id='" + id + "' width='" + w + "' height='" + h + "' patternUnits='userSpaceOnUse'>" + dentro + "</pattern>");
      return (motiviC[k] = id);
    }
    // lo stesso motivo spostato, girato o ricomposto (eredita il disegno: niente copie)
    function variante(id, tr) {
      var k = id + "|" + tr; if (variantiC[k]) return variantiC[k];
      var v = p + "mv" + (nMt++).toString(36);
      D.push("<pattern id='" + v + "' href='#" + id + "' patternTransform='" + tr + "'/>");
      return (variantiC[k] = v);
    }
    // una forma usata da più motivi (anche del capo e dei pantaloni insieme): scritta una volta, col suo colore messo da chi la usa
    function forma(k, fn) { if (!formeC[k]) { formeC[k] = p + "mf" + (nMt++).toString(36); D.push("<path id='" + formeC[k] + "' d='" + fn().replace(/ -/g, "-") + "'/>"); } return formeC[k]; }
    function usaF(id, at) { return "<use href='#" + id + "'" + at + "/>"; }
    function pq(x, y) { return q(x) + " " + q(y); }
    // una forma nel motivo (riquadro w×w) e le sue copie SOLO dove passa oltre il bordo (bb = [x0, y0, x1, y1] attorno al suo punto)
    function copie(x, y, w, bb, fn) { for (var a = -1; a <= 1; a++) for (var b2 = -1; b2 <= 1; b2++) { var X = x + a * w, Y = y + b2 * w; if (X + bb[2] > 0 && X + bb[0] < w && Y + bb[3] > 0 && Y + bb[1] < w) fn(X, Y); } }
    function pi(x, y) { return Math.round(x) + " " + Math.round(y); }
    function tondo(x, y, r) { return "M" + pq(x - r, y) + "a" + q(r) + " " + q(r) + " 0 1 0 " + q(2 * r) + " 0a" + q(r) + " " + q(r) + " 0 1 0 " + q(-2 * r) + " 0"; }
    // ---------- le fantasie (b = il colore della stoffa, c2 = il secondo colore) ----------
    var MW = 250, HW = 132;
    function fantasia(f, b, c2) {
      if (f === "righe") return motivo("r" + c2, 20, 32, "<rect width='20' height='15' fill='" + c2 + "'/><rect y='15' width='20' height='1.6' opacity='.14'/>");   // da marinaio
      if (f === "quadri") {   // scozzesi (la flanella): bande del secondo colore che si incrociano, una riga scura e una chiara
        var dk = mix(b, "#0a0508", 0.55);
        return motivo("q" + b + c2, 68, 68, "<rect width='68' height='20' fill='" + c2 + "' opacity='.6'/><rect width='20' height='68' fill='" + c2 + "' opacity='.6'/>" +
          "<path d='M0 42h68v3.4H0zM42 0h3.4v68H42z' fill='" + dk + "' opacity='.5'/><path d='M0 54h68v1.6H0zM54 0h1.6v68H54z' fill='#fff' opacity='.3'/>");
      }
      if (f === "pois") return motivo("p" + c2, 52, 52, "<path d='" + tondo(13, 13, 9.5) + tondo(39, 39, 9.5) + "' fill='" + c2 + "'/>");
      if (f === "jeans") return motivo("j", 6, 6, "<path d='M0 6L6 0' stroke='#fff' stroke-width='1.2' opacity='.07'/><path d='M0 3L3 0M3 6L6 3' stroke='#000' stroke-width='.8' opacity='.06'/>");
      if (f === "mimetica") {   // tre toni, macchie grandi che passano oltre il bordo (niente stacchi)
        return motivo("m" + b, MW, MW, toniMimetica(b).map(function (t, l) { return usaF(formaMimetica(l), " fill='" + t + "'"); }).join(""));
      }
      if (f === "hawaiana") {   // fiori grandi e piccoli (il secondo colore, panna, giallo) e foglie verdi, fitti
        var g = formeHawaiana(), ink = function (x) { return " stroke='" + mix(x, "#7a1020", 0.35) + "' stroke-width='1.2'"; };
        return motivo("h" + c2, HW, HW, usaF(g[0], " fill='#1d6a33'") + usaF(g[1], " fill='#2f9a4a'") + usaF(g[2], " fill='none' stroke='#164a24' stroke-width='1'") +
          usaF(g[3], " fill='" + c2 + "'" + ink(c2)) + usaF(g[4], " fill='#fff3e0'" + ink("#fff3e0")) + usaF(g[5], " fill='#ffd23f'" + ink("#ffd23f")) + usaF(g[6], ""));
      }
      return null;
    }
    // la manica ha il motivo sfalsato rispetto al busto (la cucitura si vede)
    var SFALSA = { righe: [0, 16, 0], quadri: [34, 34, 0], pois: [26, 26, 0], mimetica: [125, 80, 40], hawaiana: [66, 66, 35], jeans: [0, 0, 0] };   // [dx, dy, gradi]
    // la trasformazione di un motivo scritta corta: matrix(a b c d e f)
    function mat(a, b2, c2, d, e, f) { var r3 = function (v) { var t = String(Math.round(v * 1000) / 1000); return t.replace(/^(-?)0./, "$1."); }; return "matrix(" + [r3(a), r3(b2), r3(c2), r3(d), q(e), q(f)].join(" ").replace(/ -/g, "-") + ")"; }
    // girato di ang gradi intorno a P, poi (dentro) spostato di S[0], S[1] e girato di S[2]
    function girato(ang, P, S) {
      var ca = Math.cos(ang * DEG), sa = Math.sin(ang * DEG), cb = Math.cos((S ? S[2] : 0) * DEG), sb = Math.sin((S ? S[2] : 0) * DEG), ox = S ? S[0] : 0, oy = S ? S[1] : 0;
      var re = P[0] - ca * P[0] + sa * P[1], rf = P[1] - sa * P[0] - ca * P[1];
      return mat(ca * cb - sa * sb, sa * cb + ca * sb, -ca * sb - sa * cb, -sa * sb + ca * cb, ca * ox - sa * oy + re, sa * ox + ca * oy + rf);
    }
    // (correzione della tappa 3) i toni della mimetica: sui colori «di terra» (verdi, kaki, marroni, gialli spenti) e sui grigi, bianchi e neri
    // quelli dell esercito della Tavola 2 (sabbia, marrone, verde scuro); sugli altri colori (blu, rossi, rosa, viola, bordeaux) la mimetica
    // è DEL colore del capo: un tono chiaro, uno scuro e uno scurissimo. Prima tutti tiravano verso il kaki: sul blu le macchie sembravano
    // velate e sporche (un velo kaki trasparente sopra il blu).
    function toniMimetica(b) {
      var c = h2r(b), mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), h = 0, sat = mx ? (mx - mn) / mx : 0;
      if (mx !== mn) h = (mx === c[0] ? ((c[1] - c[2]) / (mx - mn) + 6) % 6 : (mx === c[1] ? (c[2] - c[0]) / (mx - mn) + 2 : (c[0] - c[1]) / (mx - mn) + 4)) * 60;
      if (sat < 0.2 || (h >= 22 && h <= 150)) return [mix(b, "#c9bc84", 0.5), mix(b, "#5a4226", 0.62), mix(b, "#0d1408", 0.72)];
      return [mix(b, "#ffffff", lum(b) > 0.6 ? 0.55 : 0.4), mix(b, "#000000", 0.4), mix(b, "#05030a", 0.7)];
    }
    function formaMimetica(l) {
      return forma("mi" + l, function () {
        var R = rnd(7 + l * 13), cnt = [7, 8, 6][l], rad = [46, 35, 23][l], d = "";
        for (var i = 0; i < cnt; i++) {
          var cx = Math.round(R() * MW), cy = Math.round(R() * MW), bl = macchia(R, rad);
          copie(cx, cy, MW, bl[3], function (X, Y) { d += "M" + (X + bl[0]) + " " + (Y + bl[1]) + bl[2]; });
        }
        return d;
      });
    }
    function macchia(R, r) {   // una macchia morbida: 5 punti a caso intorno, la curva passa per i punti di mezzo (percorso relativo)
      var n = 5, P = [], i, bb = [0, 0, 0, 0];
      for (i = 0; i < n; i++) { var a = i / n * 6.2832 + R() * 0.6, rr = r * (0.42 + R() * 0.85); P.push([Math.round(Math.cos(a) * rr * 1.25), Math.round(Math.sin(a) * rr * 0.8)]); }
      P.forEach(function (z) { bb = [Math.min(bb[0], z[0]), Math.min(bb[1], z[1]), Math.max(bb[2], z[0]), Math.max(bb[3], z[1])]; });
      var M = P.map(function (z, j) { var w = P[(j + 1) % n]; return [Math.round((z[0] + w[0]) / 2), Math.round((z[1] + w[1]) / 2)]; });
      var s = "", x = M[n - 1][0], y = M[n - 1][1];
      for (i = 0; i < n; i++) { s += "q" + (P[i][0] - x) + " " + (P[i][1] - y) + " " + (M[i][0] - x) + " " + (M[i][1] - y); x = M[i][0]; y = M[i][1]; }
      return [M[n - 1][0], M[n - 1][1], s.replace(/ -/g, "-") + "z", bb];
    }
    function formeHawaiana() {
      if (formeC.hw) return formeC.hw;
      var LF = [[10, 40, 1, -30, 0], [66, 10, 0.9, 120, 1], [100, 70, 1.05, 30, 0], [40, 100, 0.95, 200, 1], [78, 120, 0.8, -70, 0], [124, 20, 0.8, 160, 1]];
      var FL = [[30, 30, 26, 15, 0], [92, 88, 24, -20, 1], [86, 28, 13, 40, 1], [18, 92, 12, 10, 0], [56, 64, 11, 70, 2], [118, 116, 13, 0, 0]];
      var dL = ["", ""], dN = "", dF = ["", "", ""], dC = ["", ""], FG = [[0, 0], [9, -13], [30, -15], [44, -3], [30, 8], [9, 10]];
      LF.forEach(function (f) {
        var a = f[3] * DEG, cc = Math.cos(a) * f[2], ss = Math.sin(a) * f[2], gx = function (x, y) { return x * cc - y * ss; }, gy = function (x, y) { return x * ss + y * cc; };
        var bb = [1e3, 1e3, -1e3, -1e3]; FG.forEach(function (z) { var x = gx(z[0], z[1]), y = gy(z[0], z[1]); bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x), Math.max(bb[3], y)]; });
        copie(f[0], f[1], HW, bb, function (X, Y) {
          var T = function (x, y) { return pi(X + gx(x, y), Y + gy(x, y)); };
          dL[f[4]] += "M" + T(0, 0) + "C" + T(9, -13) + " " + T(30, -15) + " " + T(44, -3) + "C" + T(30, 8) + " " + T(9, 10) + " " + T(0, 0) + "Z";
          dN += "M" + T(2, 0) + "C" + T(14, -1) + " " + T(28, -2) + " " + T(40, -3);
        });
      });
      FL.forEach(function (f) {
        var r0 = f[2] * 1.12;
        copie(f[0], f[1], HW, [-r0, -r0, r0, r0], function (X, Y) {
          var pt = function (an, r) { var a = (an - 90) * DEG; return pi(X + Math.cos(a) * r * f[2], Y + Math.sin(a) * r * f[2]); }, s = "";
          for (var i = 0; i < 5; i++) { var an = f[3] + i * 72; s += (i ? "" : "M" + pt(an - 36, 0.42)) + "C" + pt(an - 34, 1.42) + " " + pt(an + 34, 1.42) + " " + pt(an + 36, 0.42); }
          dF[f[4]] += s + "Z"; dC[f[2] > 20 ? 0 : 1] += "M" + pi(X, Y) + "h0";   // (il centro: un punto tondo, grande o piccolo)
        });
      });
      var L = [dL[0], dL[1], dN, dF[0], dF[1], dF[2]].map(function (d, i) { return forma("hw" + i, function () { return d; }); }), idc = p + "mf" + (nMt++).toString(36);
      D.push("<g id='" + idc + "' fill='none' stroke='#ffd23f' stroke-linecap='round'><path d='" + dC[0].replace(/ -/g, "-") + "' stroke-width='12'/><path d='" + dC[1].replace(/ -/g, "-") + "' stroke-width='6'/></g>");   // i centri dei fiori (il puntino arancio della tavola, sotto il pixel, non c è)
      return (formeC.hw = L.concat([idc]));
    }
    // ---------- le stoffe: o = luce e volume; pre = strati sopra la fantasia (trasparenti: la fantasia si vede); post = riflessi ----------
    // (correzione della tappa 3) i riflessi delle stoffe: tutti in un gruppo solo col loro gradiente (ogni ellisse ha solo la sua forza):
    // cfg.netto = lampi col bordo netto (la pelle: la luce resta piena fino a metà e poi cala in fretta), cfg.largo = più larghi (il raso)
    var rifC = {};
    function gradRif(col, netto) {
      var k = (netto ? "n" : "s") + col; if (rifC[k]) return rifC[k];
      var id = p + "rf" + Object.keys(rifC).length;
      D.push("<radialGradient id='" + id + "'><stop" + (netto ? " offset='.4'" : "") + " stop-color='" + col + "'/><stop offset='1' stop-color='" + col + "' stop-opacity='0'/></radialGradient>");
      return (rifC[k] = id);
    }
    function riflessi(hi, cfg, conT, br, gambe) {
      var s = "", sh = Math.abs(BR[1].J[0] - C), w = cfg.largo || 1;
      function E2(cx, cy, rx, ry, ang, op) { return "<ellipse cx='" + q(cx) + "' cy='" + q(cy) + "' rx='" + q(rx) + "' ry='" + q(ry) + "' fill-opacity='" + opz(Math.round(op * 100) / 100) + "'" + (ang ? " transform='rotate(" + q(ang) + " " + q(cx) + " " + q(cy) + ")'" : "") + "/>"; }
      if (gambe) [-1, 1].forEach(function (l) { var g = gIn(650); s += E2(C + l * g[0] - l * 3, 650, g[1] * 0.22 * w, 74, 0, (cfg.gambe || 0.35) * (l < 0 ? 1 : 0.6)); });
      else {
        if (conT) {
          (cfg.fianchi || []).forEach(function (f) { s += E2(C - sh * 0.86, f[0], 6.5 * w, f[1], 0, f[2]) + E2(C + sh * 0.86, f[0] + 16, 5 * w, f[1] * 0.8, 0, f[2] * 0.55); });
          if (cfg.spalle) [-1, 1].forEach(function (l) { s += E2(C + l * sh * 0.66, 272, 24, 7 * w, l * 14, cfg.spalle * (l < 0 ? 1 : 0.55)); });
          if (cfg.petto) s += E2(C - sh * 0.3, 360, 15 * w, 70, 32, cfg.petto);   // (il raso) la luce larga che scende in diagonale sul petto
        }
        br.forEach(function (b) {
          var r = BR[b.lato], J = r.J, E = r.E, ux = E[0] - J[0], uy = E[1] - J[1], ang = Math.atan2(-ux, uy) / DEG, vero = b.lato < 0 ? 1 : 0.6;
          (cfg.braccia || []).forEach(function (a) { var cx = J[0] + ux * a[0] - b.lato * 4, cy = J[1] + uy * a[0]; s += E2(cx, cy, 5.5 * w, a[1], ang, a[2] * vero); });
          if (cfg.gomiti && (b.fino == null || b.fino > 0.5)) s += E2(E[0] - b.lato * 3, E[1] - 4, 11, 9, 0, cfg.gomiti * vero);
          if (cfg.avamb && (b.fino == null || b.fino > 0.8)) { var W2 = r.W, vx = W2[0] - E[0], vy = W2[1] - E[1]; s += E2(E[0] + vx * 0.5 - b.lato * 4, E[1] + vy * 0.5, 5 * w, 30, Math.atan2(-vx, vy) / DEG, cfg.avamb * vero); }
        });
      }
      return s ? "<g fill='url(#" + gradRif(hi, cfg.netto) + ")'>" + s + "</g>" : "";
    }
    function stella(x, y, r, op) { return "<path transform='translate(" + q(x) + " " + q(y) + ") scale(" + r + ")' d='M0-9L1.8-1.8L9 0L1.8 1.8L0 9L-1.8 1.8L-9 0L-1.8-1.8Z' fill='#fff' opacity='" + op + "'/>"; }
    var STOFFE = {
      // (correzione della tappa 3) le stoffe si devono riconoscere anche piccole, nell avatar della partita e nelle anteprime dell editor:
      // la lana è opaca e con la spina ben visibile, la pelle più scura con lampi di luce netti, il raso coi bagliori larghi e chiari,
      // le paillettes con le squame che brillano (prima lana, pelle e raso sembravano quasi uguali alla stoffa normale)
      lana: {   // opaca (niente luce lucida), con una spina grossa che si vede anche piccola; sopra una fantasia la spina è più leggera
        o: function () { return { luce: 0, forza: 0.1 }; },
        pre: function (b, fb) { return [{ fill: "#8a8a8a", op: ".1" }, { pat: motivo("lana", 16, 18, "<path d='M1.2 1.5L8 15.5L14.8 1.5' fill='none' stroke='#0a0508' stroke-width='3' stroke-linecap='round' opacity='.3'/><path d='M3 .5L8 10L13 .5' fill='none' stroke='#fff' stroke-width='1.8' stroke-linecap='round' opacity='.17'/>"), op: fb && fb.f ? ".5" : null }]; }
      },
      pelle: {   // scura e tesa: più scura del colore, lampi di luce stretti e netti su spalle, braccia, gomiti e fianco, pieghe al gomito
        o: function (b) { return { forza: 1, chiaro: mix(b, "#ffffff", 0.45), scuro: mix(b, "#000000", 0.62), luce: 1 }; },
        pre: function () { return [{ fill: "#000", op: ".26" }]; },
        post: function (b, conT, br, gambe) {
          var sc = mix(b, "#000000", 0.62), s = riflessi(mix(b, "#ffffff", 0.62), { netto: 1, spalle: 0.9, fianchi: [[400, 60, 0.65]], gomiti: 0.8, braccia: [[0.3, 34, 0.8]], avamb: 0.6, gambe: 0.65 }, conT, br, gambe);
          br.forEach(function (b2) {
            if (b2.fino != null && b2.fino < 0.6) return;
            var r = BR[b2.lato], E = r.E, ux = r.W[0] - E[0], uy = r.W[1] - E[1], ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
            var pg = ""; for (var i = 0; i < 3; i++) { var cx = E[0] + ux * (i * 6 - 5), cy = E[1] + uy * (i * 6 - 5); pg += "M" + pi(cx + uy * 20, cy - ux * 20) + "Q" + pi(cx + ux * 5, cy + uy * 5) + " " + pi(cx - uy * 20, cy + ux * 20); }
            s += St(pg.replace(/ -/g, "-"), sc, 2.4, 0.55);   // le tre pieghe in un tratto
          });
          return s;
        }
      },
      raso: {   // luce morbida che scorre: bagliori larghi e chiari (in diagonale sul petto, lungo le braccia e i fianchi) e ombre morbide
        o: function () { return { luce: 0.8, forza: 1.1 }; },
        pre: function (b) { var hi = mix(b, "#ffffff", 0.55), sh = mix(b, "#000000", 0.4); return [{ fill: LG("rs" + b.slice(1), C - 120, 240, C + 120, 540, [[0, hi, 0.42], [0.45, sh, 0.3], [0.75, hi, 0.36], [1, sh, 0.26]], true) }]; },
        post: function (b, conT, br, gambe) { return riflessi(mix(b, "#ffffff", 0.6), { largo: 2, petto: 0.75, spalle: 0.5, fianchi: [[410, 90, 0.85]], braccia: [[0.42, 52, 0.95]], avamb: 0.65, gambe: 0.75 }, conT, br, gambe); }
      },
      paillettes: {   // squame tonde in file sfalsate col bordino scuro, qualche squama più chiara o più scura e qualche punto di luce a caso, qualche stella
        o: function () { return { luce: 0.6, forza: 0.6 }; },
        pre: function () {
          var id = formeC.pl || (formeC.pl = (function () {
            // (correzione) prima la tessera aveva 5 file: a ogni giro due file uguali si toccavano e le squame tagliate dal bordo facevano una
            // riga dritta (sul vestito lungo sembrava una maglia a righe), e le luminosità ripetute ogni 24 unità facevano un disegno.
            // Ora: la base sono tutte squame uguali che non si toccano (raggio 2,75 su un passo di 6 × 4,6), in una tessera piccola
            // (6 × 9,2: una fila diritta e una sfalsata; quella che sporge sotto ricompare sopra); sopra, in una tessera grande
            // (42 × 36,8: sette squame per otto file) qualche squama più chiara, qualche più scura e qualche punto di luce, a caso
            var R = rnd(11), g = ["", "", ""], P = [], sc = [[], []], x, r, cc, i, j, tmp;
            var tondo = function (x2, y2, r2) { return "<circle cx='" + q(x2) + "' cy='" + q(y2) + "' r='" + r2 + "'/>"; };
            var base = motivo("plb", 6, 9.2, "<g fill='#fff' fill-opacity='.1' stroke='#000' stroke-opacity='.3' stroke-width='.6'>" + tondo(3, 3.05, 2.75) + tondo(0, 7.65, 2.75) + tondo(6, 7.65, 2.75) + tondo(0, -1.55, 2.75) + tondo(6, -1.55, 2.75) + "</g>");
            for (r = 0; r < 7; r++) for (cc = 0; cc < 7; cc++) { x = cc * 6 + (r % 2 ? 0 : 3); if (x) P.push([x, 3.05 + r * 4.6]); }   // (solo le squame tutte dentro la tessera)
            for (i = P.length - 1; i > 0; i--) { j = Math.floor(R() * (i + 1)); tmp = P[i]; P[i] = P[j]; P[j] = tmp; }
            // mai due chiare (o due scure) vicine, anche a cavallo del bordo della tessera: se no fanno dei disegnini che si ripetono
            var lontano = function (L, a) { return L.every(function (b) { var dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]); dx = Math.min(dx, 42 - dx); dy = Math.min(dy, 36.8 - dy); return dx * dx + dy * dy > 50; }); };
            P.forEach(function (a) { if (sc[0].length < 11 && lontano(sc[0], a)) sc[0].push(a); else if (sc[1].length < 8 && lontano(sc[1], a)) sc[1].push(a); });
            // (le squame sopra sono punti tondi: un tratto lungo zero con la punta tonda, largo quanto la squama; pesano molto meno dei cerchi)
            var punto = function (x2, y2) { return "M" + q(x2) + " " + q(y2) + "h0"; }, tratto = function (d2, col, op, w2) { return "<path d='" + d2 + "' stroke='" + col + "' stroke-opacity='" + op + "' stroke-width='" + w2 + "'/>"; };
            sc[0].forEach(function (a, k) { g[1] += punto(a[0], a[1]); if (k % 2) g[2] += punto(a[0] - 1.1, a[1] - 1.1); });
            sc[1].forEach(function (a) { g[0] += punto(a[0], a[1]); });
            return motivo("pl", 42, 36.8, "<rect width='42' height='36.8' fill='url(#" + base + ")'/><g fill='none' stroke-linecap='round'>" + tratto(g[0], "#000", ".14", 5.5) + tratto(g[1], "#fff", ".26", 5.5) + tratto(g[2], "#fff", ".85", 1.8) + "</g>");
          })());
          return [{ pat: id }, { fill: LG("plL", C - 120, 0, C + 120, 0, [[0, "#ffffff", 0.2], [0.5, "#ffffff", 0], [1, "#000000", 0.3]], true) }];
        },
        post: function (b, conT, br, gambe) {
          if (!conT || !br.length || gambe) return "";
          var b0 = BR[-1], sh = Math.abs(BR[1].J[0] - C);
          return stella(C - sh * 0.9, 258, 0.8, 0.95) + stella(b0.E[0] + 5, b0.E[1] + 10, 0.7, 0.9) + stella(C + 66, 520, 0.6, 0.85);
        }
      }
    };
    var STF = { capo: tessuto(c.fant, c.stoffa, m2, false), sotto: tessuto(c.fantP, c.stoffaP, p2, true) };   // la stoffa del capo e dei pantaloni
    function strati(fb, b) {   // gli strati della stoffa: { pat: id del motivo } o { fill, op }
      var k = (fb.sotto ? "s" : "c") + b; if (stratiC[k]) return stratiC[k];
      var L = [];
      if (fb.f) L.push({ pat: fantasia(fb.f, b, fb.c2 || coloreFant(b)), f: fb.f });
      if (fb.st) STOFFE[fb.st].pre(b, fb).forEach(function (x) { L.push(x); });
      return (stratiC[k] = L);
    }
    var TUTTO = " x='-200' y='-200' width='800' height='1400'";
    // uno strato sul busto (o sulle gambe): nelle fasce il motivo si ricompone (una variante per fascia, la prima è il motivo stesso)
    function stratoBusto(x, finoA) {
      if (!x.pat) return "<rect" + TUTTO + " fill='" + x.fill + "'" + (x.op ? " opacity='" + x.op + "'" : "") + "/>";
      var op = x.op ? " opacity='" + x.op + "'" : "";   // (correzione) la trama più leggera sopra una fantasia
      if (!FASCE) return "<rect" + TUTTO + " fill='url(#" + x.pat + ")'" + op + "/>";
      var o = "", y0 = -200, a = -200;
      FASCE.forEach(function (fs, i) {
        if (finoA && y0 > finoA + 30) return;   // (il capo finisce prima: questa fascia non serve)
        // (la trama fitta, squame o spina, si ricompone solo dove si schiaccia tanto: seduto)
        var y1 = fs[0] == null ? 1200 : fs[0], f = fs[1], v = i && (x.f || f < 0.7 || f > 1.4) ? variante(x.pat, mat(1, 0, 0, 1 / f, 0, y0 - a / f)) : x.pat;
        o += "<rect x='-200' y='" + q(y0) + "' width='800' height='" + q(y1 - y0) + "' fill='url(#" + v + ")'" + op + "/>";
        a += (y1 - y0) * f; y0 = y1;
      });
      return o;
    }
    // un pezzo di manica: la stoffa, poi la fantasia girata lungo il braccio (da P verso Q) e sfalsata, e la trama (fitta: non serve girarla)
    // (id = la stessa manica già scritta: si ridipinge solo, senza riscriverla). Un fill scritto sulla forma vincerebbe su quello delle copie
    function pezzoManica(d, colore, LS, P, Q, id) {
      var nuovo = !id, ang = Math.atan2(-(Q[0] - P[0]), Q[1] - P[1]) / DEG;
      if (nuovo) id = p + "ma" + (nMa++).toString(36);
      var st = LS.map(function (x) { return "<use href='#" + id + "' fill='" + (x.pat ? "url(#" + (x.f ? variante(x.pat, girato(ang, P, SFALSA[x.f])) : x.pat) + ")" : x.fill) + "'" + (x.op ? " opacity='" + x.op + "'" : "") + "/>"; }).join("");
      // la forma senza colore suo (lo prende dal gruppo): così le copie la colorano col motivo
      return (nuovo ? "<g fill='" + colore + "'><path id='" + id + "' d='" + d + "'/></g>" : "<use href='#" + id + "' fill='" + colore + "'/>") + st;
    }
    function manicaStoffa(q0, pg, colore, LS, bordoBr) {
      var b = BR[q0.lato];
      if (pg) return pezzoManica(pg.a, colore, LS, b.J, b.E) + bordoBr(pg.a, q0) + pezzoManica(pg.b, colore, LS, b.E, b.W);
      var s2 = pezzoManica(q0.d, colore, LS, b.J, b.E);
      // il gomito piegato (non tanto da fare due pezzi): oltre la piega l avambraccio ha il motivo girato come lui
      var d1 = [b.E[0] - b.J[0], b.E[1] - b.J[1]], d2 = [b.W[0] - b.E[0], b.W[1] - b.E[1]], l1 = Math.hypot(d1[0], d1[1]) || 1, l2 = Math.hypot(d2[0], d2[1]) || 1;
      d1 = [d1[0] / l1, d1[1] / l1]; d2 = [d2[0] / l2, d2[1] / l2];
      if ((q0.fino == null || q0.fino > 0.55) && d1[0] * d2[0] + d1[1] * d2[1] < 0.9) {
        var n = [d1[0] + d2[0], d1[1] + d2[1]], nl = Math.hypot(n[0], n[1]) || 1; n = [n[0] / nl, n[1] / nl];
        var E = b.E, px = -n[1] * 400, py = n[0] * 400, oltre = clip("M" + pq(E[0] + px, E[1] + py) + "L" + pq(E[0] - px, E[1] - py) + "L" + pq(E[0] - px + n[0] * 600, E[1] - py + n[1] * 600) + "L" + pq(E[0] + px + n[0] * 600, E[1] + py + n[1] * 600) + "Z");
        s2 += "<g clip-path='" + oltre + "'>" + pezzoManica(q0.d, colore, LS, b.E, b.W, p + "ma" + (nMa - 1).toString(36)) + "</g>";
      }
      return s2;
    }
    // ---------- il jeans: sbiadito, baffi e cuciture arancio (dentro la stoffa, sotto la luce) ----------
    var CUC = " stroke='#f0a23a' stroke-dasharray='5 3.5'";
    function jeansGambe(b) {
      // (in pochi tratti: le cuciture di tutte e due le gambe in un percorso, i baffi in un altro)
      var s = "", v = m ? 456 : 448, chiaro = mix(b, "#eaf2ff", 0.75), l, baffi = "", cuc = "";
      for (var i = 0; i < 2; i++) {
        l = i ? 1 : -1;
        var g1 = gIn(640), g2 = gIn(770);
        s += El(C + l * g1[0] - l * 2, 650, g1[1] * 0.3, 84, soft(chiaro, 0.55)) + El(C + l * g2[0] - l * 2, 768, g2[1] * 0.3, 30, soft(chiaro, 0.4));
        for (var k = 0; k < 4; k++) baffi += "M" + pi(C + l * (11 + k * 2), v + 70 + k * 7) + "L" + pi(C + l * (30 + k * 3), v + 62 + k * 8);
        for (var y = v + 20; y <= 900; y += 80) { var g = gIn(y); cuc += (y === v + 20 ? "M" : "L") + pi(C + l * (g[0] + g[1] - 6), y); }
        var x1 = C + l * (B.wt + 2), x2 = C + l * 22;
        cuc += "M" + pi(x1, v + 12) + "C" + pi(x1 - l * 10, v + 50) + " " + pi(x2 + l * 18, v + 64) + " " + pi(x2, v + 72);
      }
      return s + "<path d='" + baffi + "' stroke='#fff' stroke-width='2' stroke-linecap='round' opacity='.15'/><path d='" + cuc.replace(/ -/g, "-") + "' fill='none'" + CUC + " stroke-width='1.9' opacity='.95'/>" +
        "<rect y='" + (v + 14) + "' width='400' height='1.6' fill='#f0a23a' opacity='.9'/>";
    }
    function jeansBusto(b, T) {
      var chiaro = mix(b, "#dbe8fa", 0.58), y = orloT[T] ? orloT[T] - 8 : null, s = El(C - 70, 282, 44, 20, soft(chiaro, 0.6)) + El(C + 70, 282, 44, 20, soft(chiaro, 0.5)) + El(C, 380, 54, 52, soft(chiaro, 0.4));
      if (y) s += "<path d='M0 " + y + "H400M" + (C - 24) + " 280V" + y + "M" + (C + 24) + " 280V" + y + "' fill='none'" + CUC + " stroke-width='1.8' opacity='.9'/>";
      return s;
    }
    // dopo la luce: i riflessi della stoffa e lo sbiadito del jeans sui gomiti
    function dopoStoffa(fb, SF, b, conT, br) {
      var s = SF && SF.post ? SF.post(b, conT, br, fb.sotto) : "";
      if (fb.f === "jeans" && !fb.sotto) { var chiaro = mix(b, "#dbe8fa", 0.58); br.forEach(function (q0) { if (q0.fino == null || q0.fino > 0.55) { var E = BR[q0.lato].E; s += El(E[0], E[1], 15, 20, soft(chiaro, 0.65)); } }); }
      return s;
    }
    var nRim = 0, fasceC = {}, sfumC = {}, nM = 0;


    // ---------- il contesto per i pezzi ----------
    var K = {
      m: m, donna: !m, c: c, opts: opts, C: C, Y: Y, B: B, HT: HT, F: F, faceD: faceD, top: top, GN: GN, BR: BR,
      pelle: sk, skL: skL, skD: skD, skDD: skDD, capelli: hc, hL: hL, hD: hD, hDD: hDD, iride: iris, maglia: mg, pantaloni: pt, scarpe: sc, acc: ac, collo: cc, labbro: labbro, rossetto: rossetto,
      mix: mix, lum: lum, rnd: rnd, n1: n1, cr: cr, limb: limb, poli: poli, liscio: liscio, lisciaChiusa: lisciaChiusa,
      LG: LG, RG: RG, soft: soft, U: U, Pa: Pa, St: St, El: El, clip: clip, cil: cil, D: D, id: p,
      gamba: gamba, gIn: gIn, bacino: bacino, busto: busto, manica: manica, fineManica: fineManica,
      scuro: function (c2, t) { return mix(c2, "#14080c", t == null ? 0.35 : t); }, chiaro: function (c2, t) { return mix(c2, "#ffffff", t == null ? 0.3 : t); }
    };
    K.suManica = suManica; K.parte = PARTE; K.spalle = SPALLE;
    // (tappa 3) il secondo colore: K.maglia2 / K.pant2 (null se non c'è). K.secondo(def, t) = il colore di colletti, polsini, coste e bordi:
    // def senza secondo colore (com'era), col secondo colore quello (t > 0: appena scurito verso l ombra della maglia, come le coste)
    K.maglia2 = m2; K.pant2 = p2;
    K.secondo = function (def, t) { return m2 ? (t ? mix(m2, mix(mg, "#14080c", 0.5), t * 0.35) : m2) : def; };
    // la fantasia del capo (o dei pantaloni) su un pezzo dipinto a parte dal pezzo (cappuccio, revers, collo alto): "" se non ce n'è
    // (dx: il pezzo è disegnato spostato di dx, per esempio centrato in 0: il motivo torna al suo posto e combacia col resto)
    K.motivo = function (d, dx) {
      var fb = fabOra; if (!fb) return "";
      // (solo la fantasia: revers, cappucci e colli restano lisci come nelle stoffe della Tavola 2, raso sulla giacca di paillettes)
      var LS = strati(fb, fb.sotto ? pt : mg).filter(function (x) { return x.f; }), sp = dx ? " transform='translate(" + q(-dx) + " 0)'" : ""; if (!LS.length) return "";
      return "<g clip-path='" + clip(d) + "'>" + LS.map(function (x) { return "<rect" + TUTTO + sp + " fill='" + (x.pat ? "url(#" + x.pat + ")" : x.fill) + "'" + (x.op ? " opacity='" + x.op + "'" : "") + "/>"; }).join("") + "</g>";
    };
    K.dipingi = dipingi; K.tronco = tronco; K.braccio = contornoBraccio; K.volumeBraccio = volumeBraccio; K.cilindro = cilindro; K.ElR = ElR; K.rc = rc; K.G = G; K.luce = luceGlobale;
    // (tappa 4 dei vestiti, i capi Moda, 7 nov 2026) aiuti per i capi che seguono il corpo più da vicino:
    //  K.largT(y, e, orlo): la mezza larghezza del tronco di un vestito alla quota y (la stessa linea di tronco allargata di e; oltre i
    //    fianchi segue le cosce fino a 700): fasce, tasche e orli che devono stare dentro il capo;
    //  K.gambaSu(lato, prof, y0, y1, curva): una gamba dei pantaloni su misura dalla quota y0 all orlo y1, prof(y, gIn(y)) = [fuori, dentro]
    //    (mezze larghezze dal centro della gamba); curva = quanto scende l orlo nel mezzo;
    //  K.sottoBraccia(svg, e): i dettagli del petto (tasche, cerniere, revers) NON passano sopra le braccia che vengono davanti (gesti): una
    //    maschera sola per avatar e per agio (il braccio come un tratto grosso spalla-gomito-polso: pesa poco); seduto e di spalle non serve;
    //  K.coperto(lato, fino, agio): il braccio è coperto fino a «fino» da un pezzo disegnato a parte (un polsino lungo): coi gesti la pelle
    //    dell avambraccio davanti al petto riparte da lì (prima ci voleva una manica finta);
    //  K.soloDietro: seduto, la prima chiamata del capo serve solo per «dietro» (il resto lo rifanno le due passate, K.parte «corpo» e
    //    «braccio»): il pezzo può non disegnare il resto, ma deve mettere lo stesso K.cravattaV (la cravatta lo legge subito dopo).
    //  E ancora: tronco({ orloLinea }) = un orlo su misura (le code della camicia), K.dipingi(…, { fino }) = dove finisce un capo fatto di
    //  più pezzi, un capo di spalle può rendere { spalle: svg } (sopra la stoffa vista da dietro: il cappuccio della felpa); i pantaloni Moda
    //  mettono K.orloP (la calza delle scarpe parte da lì) e il jeans K.jeansSuo (la fantasia «Jeans» non rifà le sue cuciture).
    K.largT = function (y, e, orlo) {
      var L = lato(e, { orlo: orlo, pancia: G.pancia || 0 }).map(function (z) { return [z[1], z[0]]; });
      L.push([700, fuoriGamba(700) + e * 0.8]);
      if (y <= L[0][0]) return L[0][1];
      for (var i = 1; i < L.length; i++) if (y <= L[i][0]) { var t = (y - L[i - 1][0]) / (L[i][0] - L[i - 1][0]); return L[i - 1][1] + (L[i][1] - L[i - 1][1]) * t; }
      return L[L.length - 1][1];
    };
    K.gambaSu = function (l, prof, y0, y1, curva) {
      var ys = [y0], y; for (y = y0 + 36; y < y1 - 18; y += 36) ys.push(y); ys.push(y1);
      var P = ys.map(function (y2) { var g = gIn(y2), w = prof(y2, g); return [y2, g[0], w[0], w[1]]; });
      var out = P.map(function (z) { return [C + l * (z[1] + z[2]), z[0]]; }), inn = P.map(function (z) { return [C + l * (z[1] - z[3]), z[0]]; }).reverse();
      var ol = out[out.length - 1], ir = inn[0];
      return "M" + N(out[0][0], 1) + N(out[0][1]) + cr(out) + "Q" + N((ol[0] + ir[0]) / 2, 1) + N((ol[1] + ir[1]) / 2 + (curva || 3)) + N(ir[0]) + N(ir[1]) + cr(inn) + "Z";
    };
    var sbC = {};
    K.sottoBraccia = function (svg, e) {
      if (!svg || sedS || SPALLE) return svg || "";
      e = e || 8;
      if (sbC[e] == null) {
        var buchi = "";
        [-1, 1].forEach(function (l) {
          var b = BR[l]; if (!b.davanti || !tieni(l)) return;
          buchi += "<path d='M" + N(b.J[0], 1) + N(b.J[1]) + "L" + N(b.E[0], 1) + N(b.E[1]) + "' stroke-width='" + q(B.aw[0] + e + 2) + "'/><path d='M" + N(b.E[0], 1) + N(b.E[1]) + "L" + N(b.W[0], 1) + N(b.W[1]) + "' stroke-width='" + q(B.aw[2] + e + 2) + "'/>";
        });
        sbC[e] = "";
        if (buchi) { var id = p + "sb" + (nClip++); D.push("<mask id='" + id + "' maskUnits='userSpaceOnUse'" + TUTTO + "><rect" + TUTTO + " fill='#fff'/><g stroke='#000' stroke-linecap='round'>" + buchi + "</g></mask>"); sbC[e] = "url(#" + id + ")"; }
      }
      return sbC[e] ? "<g mask='" + sbC[e] + "'>" + svg + "</g>" : svg;
    };
    K.coperto = function (l, fino, agio) { manicaFino[l] = Math.max(manicaFino[l] || 0, Math.min(fino, manicaMax)); agioBr[l] = Math.max(agioBr[l] || 0, agio || 0); };
    K.soloDietro = false;
    // i capelli in tre toni (gradiente obliquo) e le ciocche
    LG("hg1", 0, 0, 1, 1, [[0, hL], [0.45, hc], [1, hD]]);
    LG("hg2", 0, 0, 1, 1, [[0, mix(hL, hc, 0.45)], [0.5, mix(hc, hD, 0.35)], [1, hDD]]);
    LG("hg3", 0, 0, 1, 1, [[0, hc], [1, hDD]]);
    K.ciocche = function (list, ids, luce) {
      ids = ids || ["hg1", "hg2"];
      return list.map(function (Lc, i) {
        var g = ids[i % ids.length];
        return Pa(limb(Lc), U(g)) + (luce === false ? "" : Pa(limb(Lc.map(function (q, j) { return [q[0] - 1.5, q[1] - 2.5, Math.max(0.6, q[2] * 0.2) * (j === Lc.length - 1 ? 0.3 : 1)]; })), hL, " opacity='.5'"));
      }).join("");
    };
    // capelli corti «rasati»: una trama di puntini dentro un contorno (testa)
    K.rasatura = function (d, densita, op) {
      var R = rnd(11), s = "";
      for (var i = 0; i < (densita || 360); i++) { var x = (R() * 2 - 1) * 64, y = top - 10 + R() * 120; s += "M" + N(x, 1) + N(y) + "h.3"; }
      return "<g clip-path='" + clip(d) + "'>" + Pa(d, hc, " opacity='" + (op || 0.55) + "'") + "<path d='" + s + "' stroke='" + hDD + "' stroke-width='1.6' stroke-linecap='round' opacity='.35' fill='none'/></g>";
    };

    // ---------- la pelle: tronco e gambe in un pezzo solo; le braccia sopra (dopo i pantaloni), stesse luci ----------
    var luceSk = 0.35 + 0.65 * Math.min(1, Lsk * 1.15);   // pelle scura: meno luce bianca (se no diventa grigia)
    // (giro3) nel braccio staccato la luce della spalla è tonda e centrata sul perno: girando il braccio non si sposta (prima sembrava una palla)
    function luciSpalla(l) { var J = BR[l].J; if (PARTE === "braccio") return El(J[0], J[1], rc * 0.9, rc * 0.9, soft(skL, 0.14)); return El(J[0] - 8, J[1] - 9, rc * 0.62, rc * 0.5, soft(skL, 0.3)) + El(J[0] + l * 3, J[1] + rc * 0.75, rc * 0.8, rc * 0.42, soft(skDD, 0.16)); }
    function pelleBraccio(l) {
      var b = BR[l], d = contornoBraccio(l, 0, 1), dx = (b.W[0] - b.E[0]) / b.l2, dy2 = (b.W[1] - b.E[1]) / b.l2, wE = B.aw[1] * 0.45, inn = -l;
      var dentro = luciSpalla(l) + St(liscio([[b.E[0] + inn * wE * 0.15 - dx * 6, b.E[1] - dy2 * 6], [b.E[0] + inn * wE * 0.55 + dx * 2, b.E[1] + dy2 * 3], [b.E[0] + inn * wE * 0.85 + dx * 7, b.E[1] + dy2 * 6]]), skD, 2, 0.45) +
        El(b.E[0] - inn * wE * 0.55, b.E[1] - 2, wE * 0.35, wE * 0.5, soft(skL, 0.25));
      return dipingi({ braccia: [{ d: d, lato: l, fino: 1, e: 0 }] }, sk, { bordo: mix(sk, skDD, 0.8), chiaro: skL, scuro: skDD, dentro: dentro, forza: 0.85, luce: luceSk }).svg;
    }
    // l avambraccio che passa DAVANTI al corpo (gesti): si ridisegna sopra il vestito, dalla fine della manica (o da sopra il gomito)
    function pelleAvanti(l) {
      var b = BR[l], da = manicaFino[l] != null ? manicaFino[l] : 0.06;
      if (da > 0.97) return "";
      var d = contornoBraccio(l, 0, 1, 0, 0, da), L = ultimiLati, bordo = mix(sk, skDD, 0.8), pg = PIEGA[d];
      var luci = "<rect x='-200' y='-200' width='800' height='1400' fill='" + luceGlobale() + "' opacity='" + n1(luceSk * 100) / 100 + "'/>" + volumeBraccio(l, 1, skL, skDD, 0, 0.85);
      if (A.RITOCCHI.moda) {   // (tappa 4, leggero: le maniche arrotolate della camicia Moda lasciano l avambraccio nudo davanti al petto) stesso disegno,
        // la sagoma scritta una volta (in defs) e usata per l ombra e per la pelle; i due bordi in un tratto solo
        var una = function (dd) { var id = p + "pa" + (nClip++); D.push("<path id='" + id + "' d='" + dd + "'/>"); return "<use href='#" + id + "'"; };
        if (pg) {
          var ua = una(pg.a), ub = una(pg.b);
          return "<g opacity='.2' transform='translate(5 9)'>" + ua + " fill='#000000'/>" + ub + " fill='#000000'/></g>" + ua + " fill='" + sk + "'/><g clip-path='" + clip(pg.a) + "'>" + luci + "</g>" + St(liscio(pg.la), bordo, 2.2, 0.9) +
            ub + " fill='#000000' opacity='.12' transform='translate(3 5)'/>" + ub + " fill='" + sk + "'/><g clip-path='" + clip(pg.b) + "'>" + luci + "</g>" + St(liscio(pg.lb), bordo, 2.2, 0.9);
        }
        var u = una(d);
        return u + " fill='#000000' opacity='.2' transform='translate(5 9)'/>" + u + " fill='" + sk + "'/><g clip-path='" + clip(d) + "'>" + luci + "</g>" + St(liscio(L.A) + liscio(L.B), bordo, 2.2, 0.9);
      }
      if (pg) {   // (giro3) il gomito piegato forte: il braccio, poi l avambraccio sopra col suo bordo (niente cuneo vuoto tra i due)
        return "<path d='" + d + "' fill='#000000' opacity='.2' transform='translate(5 9)'/>" + Pa(pg.a, sk) + "<g clip-path='" + clip(pg.a) + "'>" + luci + "</g>" + St(liscio(pg.la), bordo, 2.2, 0.9) +
          "<path d='" + pg.b + "' fill='#000000' opacity='.12' transform='translate(3 5)'/>" + Pa(pg.b, sk) + "<g clip-path='" + clip(pg.b) + "'>" + luci + "</g>" + St(liscio(pg.lb), bordo, 2.2, 0.9);
      }
      return "<path d='" + d + "' fill='#000000' opacity='.2' transform='translate(5 9)'/>" + Pa(d, sk) + "<g clip-path='" + clip(d) + "'>" + luci + "</g>" + St(liscio(L.A), bordo, 2.2, 0.9) + St(liscio(L.B), bordo, 2.2, 0.9);
    }
    function pelleCorpo(soloSu) {
      var nk = B.nk, tr = tronco({ pelle: true }), gl = soloSu ? [] : [gamba(-1, { da: 540, a: 948, curvaOrlo: 2 }), gamba(1, { da: 540, a: 948, curvaOrlo: 2 })];
      var br = [];
      var dentro = luciSpalla(-1) + luciSpalla(1);
      // collo: ombra del mento, lato in ombra, clavicole
      dentro += El(C + 4, 224, nk * 1.25, 18, soft(skDD, 0.5)) + El(C + nk * 0.7, 232, nk * 0.5, 24, soft(skDD, 0.3));
      dentro += St("M" + n1(C - nk - 4) + " 252C" + n1(C - nk - 22) + " 256 " + n1(C - Jd + 30) + " 258 " + n1(C - Jd + 6) + " 262", skD, 2.6, 0.32) + St("M" + n1(C + nk + 4) + " 252C" + n1(C + nk + 22) + " 256 " + n1(C + Jd - 30) + " 258 " + n1(C + Jd - 6) + " 262", skD, 2.6, 0.36);
      dentro += El(C, 266, nk * 0.5, 7, soft(skDD, 0.35));
      if (m) dentro += St("M" + (C - B.ch + 14) + " " + (Y.petto + 6) + "C" + (C - 40) + " " + (Y.petto + 18) + " " + (C - 14) + " " + (Y.petto + 14) + " " + (C - 2) + " " + (Y.petto - 2), skD, 3, 0.35) + St("M" + (C + B.ch - 14) + " " + (Y.petto + 6) + "C" + (C + 40) + " " + (Y.petto + 18) + " " + (C + 14) + " " + (Y.petto + 14) + " " + (C + 2) + " " + (Y.petto - 2), skD, 3, 0.4) +
        El(C - 32, Y.petto - 18, 26, 16, soft("#ffffff", 0.14)) + St("M" + C + " " + (Y.petto + 30) + "L" + C + " " + (Y.vita - 10), skD, 2, 0.2) + El(C, Y.vita + 4, 4, 3, skDD, " opacity='.35'");
      else { var bs = B.seno || 1; dentro += El(C - 30 * bs, Y.petto + 8, 24 * bs, 22 * bs, soft("#ffffff", 0.12)) + St("M" + (C - B.ch + 10) + " " + (Y.petto + 18 * bs) + "C" + (C - 40) + " " + (Y.petto + 30 * bs) + " " + (C - 14) + " " + (Y.petto + 30 * bs) + " " + (C - 4) + " " + (Y.petto + 12), skD, 3, 0.3) + St("M" + (C + B.ch - 10) + " " + (Y.petto + 18 * bs) + "C" + (C + 40) + " " + (Y.petto + 30 * bs) + " " + (C + 14) + " " + (Y.petto + 30 * bs) + " " + (C + 4) + " " + (Y.petto + 12), skD, 3, 0.35) + St("M" + C + " " + (Y.petto - 10) + "L" + C + " " + (Y.petto + 8), skD, 2.2, 0.3) + El(C, Y.vita + 10, 3.4, 2.6, skDD, " opacity='.35'"); }
      if (SPALLE) {
        dentro = luciSpalla(-1) + luciSpalla(1) + El(C, 238, nk * 1.15, 14, soft(skDD, 0.28)) + St("M" + C + " 266C" + (C - 1) + " 330 " + (C + 1) + " 400 " + C + " " + (Y.vita + 12), skD, 2.4, 0.28);
        [-1, 1].forEach(function (l) { dentro += El(C + l * B.ch * 0.46, Y.ascella + 6, B.ch * 0.3, 36, soft(l < 0 ? "#ffffff" : skDD, l < 0 ? 0.12 : 0.22)) + St("M" + (C + l * 16) + " 300C" + (C + l * 30) + " 318 " + (C + l * 40) + " 340 " + (C + l * 36) + " 362", skD, 2.2, 0.22); });
      }
      // ascelle e fianchi
      dentro += El(C - B.ap + 4, Y.ascella + 4, 10, 18, soft(skDD, 0.3)) + El(C + B.ap - 4, Y.ascella + 4, 10, 18, soft(skDD, 0.36)) + El(C + B.wt - 6, Y.vita + 10, 16, 80, soft(skDD, 0.18));
      // le gambe: coscia, ginocchio, polpaccio
      if (!soloSu) [-1, 1].forEach(function (l) {
        var g0 = gIn(560), g1 = gIn(748), g2 = gIn(930), k0 = [C + l * g0[0], 560], k1 = [C + l * g1[0], 748], k2 = [C + l * g2[0], 930];
        dentro += cilindro(k0, k1, g0[1] + g0[2], skL, skDD, 0.8) + cilindro(k1, k2, g1[1] + g1[2], skL, skDD, 0.8);
        dentro += El(k1[0] - 4, 742, 14, 11, soft("#ffffff", 0.1)) + St("M" + (k1[0] - 12) + " 764C" + (k1[0] - 4) + " 770 " + (k1[0] + 6) + " 770 " + (k1[0] + 12) + " 762", skD, 1.8, 0.2);
      });
      dentro += El(C, Y.cavallo - 4, 30, 22, soft(skDD, 0.3));
      if (!SPALLE) dentro += El(C - B.wt * 0.42, Y.vita - 6, B.wt * 0.34, 46, soft("#ffffff", 0.09)) + El(C + B.wt * 0.62, Y.vita, B.wt * 0.3, 52, soft(skDD, 0.16));   // la pancia non piatta
      return dipingi({ tronco: [tr], altro: gl, braccia: br }, sk, { bordo: mix(sk, skDD, 0.8), chiaro: skL, scuro: skDD, dentro: dentro, forza: 0.85, luce: luceSk }).svg;
    }

    // ---------- le mani ----------
    // forme in coordinate della mano: polso in (0, 0), dita verso +y, +x = verso il corpo (col braccio giù)
    var MANI = {
      // (terzo tempo) rilassata: le dita un po' piegate verso il corpo, le punte raccolte (non più a paletta)
      rilassata: { p: ["M-11 -2C-14.8 6 -16.4 17 -16.6 27C-16.8 36 -16 43 -13.8 48.4C-12.6 51.4 -10.4 53.4 -7.6 53.6C-6.4 56 -4 57.6 -1.4 57.4C.6 58.8 3.6 58.6 5.4 56.8C7.8 56.2 9.4 54.4 9.8 51.8C10.6 48.8 10.4 46 11 42.4C12 36 14 30 14.5 22C14.9 14 14.4 6 11 -2Z",
          "M8.5 9C14.8 12.8 19.4 20.6 20 29C20.4 35 18.4 40.2 15.2 41C12.6 41.6 11.4 39.4 11.8 36C12.2 30.6 10.8 25.2 6 19.8Z"],
        l: ["M-1.6 31C-.6 38 1.6 45 5 55.4", "M-7.4 31.6C-6.8 39 -4.6 47 -1.6 56", "M-12.6 33C-12.4 40 -10.6 46.4 -7.6 52.6", "M-15 27.4C-9 29.6 -1 30 6 28.4"],
        // (ritocchi) il pollice si stacca dalle dita (il suo bordo), le nocche e l unghia del pollice: la mano lungo il fianco si legge anche piccola
        b: ["M6.6 20.4C10.6 25.2 12.2 30.6 11.8 36C11.6 39 12.8 41.4 15.2 41"], n: [[-12, 29.4], [-5.6, 30.6], [.6, 31], [6.4, 30]], u: [[16.4, 37.4, 2, 2.6]] },
      pugno: { p: ["M-14.5 -6C-15.5 6 -16.5 17 -15.5 28C-14.5 38 -8.5 45 0.5 45C8.5 45 14.5 40 15.5 30C16.5 20 15 8 14.5 -6Z",
          "M12.5 11C19 15 20.5 25.5 15.5 32C11.5 35 6 33 4 28.5C8 26.5 10.5 22 10.5 17.5Z"],
        l: ["M-13 24C-6 27 3 27 9 24", "M-12.5 31.5C-6 34.5 2 34.5 7 32", "M-10 38.5C-5 41 1 41 5 39.5"] },
      aperta: { p: ["M-15 -6C-16 6 -16.5 18 -16 30L16 30C16.5 18 15.5 6 15 -6Z",
          "M-16 28L-19 50C-19.5 54.5 -13 55.5 -12 51L-8.5 31Z", "M-9 30L-9.5 59C-9.5 64 -2.5 64 -2 59L-1 30Z", "M-1.5 30L0 61C0 66 7 66 7 61L6.5 30Z", "M6 29L9.5 55C10 59.5 16.5 59 16.5 54.5L14.5 28Z",
          "M-14 9C-21 13 -26 21 -28 30C-29 34.5 -23.5 36.5 -21.5 32.5C-19 26 -16 22 -11.5 20Z"],
        l: ["M-11 27C-4 29 4 29 11 27"] },
      batti: { p: ["M-14 -6C-15 8 -15.5 22 -14.5 36C-14 48 -11 58 -6 64C-3 67.5 2 67.5 3.5 63C5 56 5.5 46 6.5 36C7.5 24 9 10 10 -6Z",
          "M8 8C14 12 18 22 17 32C16.5 37 13 39 10.5 36C9.5 30 8 22 4.5 16Z"],
        l: ["M-11 38C-9 48 -6.5 56 -3.5 61"] },
      tiene: { p: ["M-11 -2C-15 6 -16.5 17 -16 28C-15.5 40 -11 50 -4 55C1 58.5 7 57.5 9.5 53C11.5 49 10 45 7.5 43C10.5 38 13.5 33 14.5 26C15 18 14.6 7 11 -2Z",
          "M9.5 9C16 13 21 23 21 34C21 40 17.5 44.5 13 43C11 37 9 27 5 20Z"],
        l: ["M-12.5 30C-5 33.5 3 33 9 30", "M-8 43C-3 47.5 2 48.5 6 47"] },
      indica: { p: ["M-14.5 -6C-15.5 6 -16.5 17 -15.5 28C-14.5 38 -8.5 45 0.5 45C8.5 45 14.5 40 15.5 30C16.5 20 15 8 14.5 -6Z",
          "M-3.5 32L-4.5 72C-4.5 78.5 5.5 78.5 5.5 72L6.5 32Z", "M12.5 11C19 15 20.5 25.5 15.5 32C11.5 35 6 33 4 28.5C8 26.5 10.5 22 10.5 17.5Z"],
        l: ["M-13 24C-6 27 0 27 3 25", "M-12 32C-8 34.5 -4 35 -2 34"] },
      // (terzo tempo) piatta = appoggiata sul tavolo o sulle cosce: dita unite e un po' piegate in giù (si vedono corte), il pollice lungo il fianco
      piatta: { p: ["M-15.5 -6C-16.5 6 -17.8 16 -18 26C-18.2 35 -17.4 42.4 -15.4 47.4C-14.2 50.6 -11 51.6 -9.2 49.6C-7.8 52.4 -4.2 53.2 -2.4 50.8C-.8 53.4 3 53.6 4.6 51.2C6.2 53.4 9.6 52.8 10.8 49.8C13.2 45.6 15.2 39.6 16.2 31.4C17 22 16.5 8 15.5 -6Z",
          "M13.2 6C19.4 9.4 23.8 15.4 25 22.2C25.6 26.8 21.8 29.2 19.8 25.8C18.2 22 16.2 18.8 12 16.2Z"],
        l: ["M-9.2 49.6C-9.5 43.4 -9.8 38.6 -10.2 34", "M-2.4 50.8C-2.5 44.4 -2.6 39.6 -2.8 35", "M4.6 51.2C4.8 44.8 4.8 40 4.6 35.4", "M-15.4 30.4C-7 33.2 4 33.2 12.4 30"] }
    };
    var tipiMano = {};
    // (terzo tempo) IMPUGNA: il pugno che stringe davvero un manico. Coordinate della presa: (0, 0) = il centro del pugno, il manico passa
    // lungo l asse y (la cima della cosa verso y negativi) DENTRO il pugno: si vede sopra il pollice (y < -21) e sotto il mignolo (y > 21);
    // +x = verso fuori (le nocche), -x = verso il corpo (le punte delle dita che girano intorno al manico). Il manico ci sta se è largo fino a 13.
    var PUGNO = {
      p: "M-11 -15C-14 -13.5 -14.5 -8 -12.5 -5.5C-15 -3.5 -15.2 2 -12.8 3.6C-14.6 6 -14.4 10.5 -11.8 12C-12.8 14.6 -11.6 19 -8 19.6C-2 21 6 21.5 11 19.5C15 18 16.5 14.5 16 11.6C18.6 10 19 5 17.4 3C19.6 .6 19.6 -4 17.6 -5.8C19.8 -8.6 19.2 -13.8 16 -15.4C9 -18 -5 -18 -11 -15Z",
      pollice: "M17.5 -12C14.6 -19.4 4.6 -22.4 -3.6 -20.6C-9.4 -19.4 -12.8 -16.4 -11.6 -13.2C-10.6 -10.6 -7 -10.6 -3.6 -11.6C2 -13 9 -12.6 14.4 -9.6Z",
      l: ["M-12.6 -5.2C-4 -4 6 -4.4 13.8 -5.8", "M-12.4 3.8C-4 5 6 4.6 13.6 3.2", "M-11.2 12.2C-3 13.4 5 13 12.4 11.8"],
      sotto: "M-11.6 -13.2C-10.6 -10.6 -7 -10.6 -3.6 -11.6C2 -13 9 -12.6 14.4 -9.6"
    };
    function kImpugna() { return B.km * 1.1; }
    function manoImpugna(lato2) {
      var b = BR[lato2], P = K.presa, k = n1(P.k * 100) / 100, O = [P.x, P.y], inc = +P.inclina || 0, dF = [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2];
      var tr = "translate(" + n1(O[0]) + " " + n1(O[1]) + ") rotate(" + n1(lato2 * inc) + ") scale(" + n1(lato2 * k * 100) / 100 + " " + k + ")";
      var bordo = mix(sk, skDD, 0.8), linea = mix(skDD, "#2a0f08", 0.25), ww = B.aw[3];
      var PG = A.RITOCCHI.mani ? maniDi().PUGNO : null;
      if (PG) {   // (ritocco «mani») il pugno a 5 dita: quattro dita arrotolate sul manico e il pollice sopra, STESSO punto di presa (pp = riempimenti)
        var ponteN = limb([[b.W[0] - dF[0] * 6, b.W[1] - dF[1] * 6, ww], [(b.W[0] + O[0]) / 2, (b.W[1] + O[1]) / 2, ww * 0.86], [O[0], O[1], ww * 0.7]], 0.4), swN = n1(3.2 / k);
        var sN = "<path d='" + ponteN + "' fill='none' stroke='" + bordo + "' stroke-width='3.2'/><g transform='" + tr + "'>";
        var tuttoN = PG.pp.concat((PG.f || []).map(function (x) { return x.d; })).join("");   // tutte le forme in un percorso solo (stesso verso: il riempimento è l unione)
        var idH = p + "h" + (nClip++);   // (leggero) la sagoma una volta sola, usata tre volte
        D.push("<path id='" + idH + "' d='" + tuttoN + "'/>");
        sN += "<use href='#" + idH + "' fill='none' stroke='" + bordo + "' stroke-width='" + swN + "'/>";
        sN += "</g>" + Pa(ponteN, sk) + "<g transform='" + tr + "'><use href='#" + idH + "' fill='" + sk + "'/>";
        var idN = "c" + (nClip++);
        sN += dettagliMano(PG, k, tr, idN) + "</g>";
        D.push("<clipPath id='" + p + idN + "'><path d='" + ponteN + "'/><use href='#" + idH + "' transform='" + tr + "'/></clipPath>");
        var aN = lato2 * inc * DEG, caN = Math.cos(aN), saN = Math.sin(aN);
        var qN = function (x, y) { return [O[0] + (x * lato2 * caN - y * saN) * k, O[1] + (x * lato2 * saN + y * caN) * k]; };
        var luN = "";
        (PG.v || []).forEach(function (v) { luN += cilindro(qN(v[0], v[1]), qN(v[2], v[3]), v[4] * k, skL, skDD, Lsk < 0.35 ? 0.5 : 0.8); });
        (PG.n || []).forEach(function (nn) { var Q = qN(nn[0], nn[1]); luN += El(Q[0], Q[1], (nn[2] || 4) * k, (nn[3] || 3) * k, soft(skL, Lsk < 0.35 ? 0.4 : 0.5)); });
        var Lo = qN(-2, 14);
        return sN + "<g clip-path='url(#" + p + idN + ")'><rect x='" + n1(O[0] - 90) + "' y='" + n1(O[1] - 90) + "' width='180' height='180' fill='" + luceGlobale() + "' opacity='" + n1(luceSk * 100) / 100 + "'/>" +
          luN + El(Lo[0], Lo[1], 12 * k, 6 * k, soft(skDD, 0.22)) + "</g>";
      }
      // il ponte dal polso al pugno (mondo): copre la fine dell avambraccio in qualunque direzione arrivi
      var ponte = limb([[b.W[0] - dF[0] * 6, b.W[1] - dF[1] * 6, ww], [(b.W[0] + O[0]) / 2, (b.W[1] + O[1]) / 2, ww * 1.04], [O[0], O[1], ww * 0.9]], 0.4);
      var sw = n1(3.2 / k);
      var s = "<path d='" + ponte + "' fill='none' stroke='" + bordo + "' stroke-width='3.2'/><g transform='" + tr + "'><path d='" + PUGNO.p + "' fill='none' stroke='" + bordo + "' stroke-width='" + sw + "'/><path d='" + PUGNO.pollice + "' fill='none' stroke='" + bordo + "' stroke-width='" + sw + "'/></g>";
      s += Pa(ponte, sk) + "<g transform='" + tr + "'>" + Pa(PUGNO.p, sk) + Pa(PUGNO.pollice, sk);
      PUGNO.l.forEach(function (d) { s += St(d, linea, 1.3, 0.6); });
      s += St(PUGNO.sotto, bordo, 1.6, 0.85) + "</g>";
      var idc = "c" + (nClip++);
      D.push("<clipPath id='" + p + idc + "'><path d='" + ponte + "'/><path d='" + PUGNO.p + "' transform='" + tr + "'/><path d='" + PUGNO.pollice + "' transform='" + tr + "'/></clipPath>");
      // le luci: quella da sinistra di tutta la figura, una luce morbida sulle nocche in alto e l ombra sotto il mignolo
      var a = lato2 * inc * DEG, ca = Math.cos(a), sa = Math.sin(a);
      function q2(x, y) { return [O[0] + (x * lato2 * ca - y * sa) * k, O[1] + (x * lato2 * sa + y * ca) * k]; }
      var L1p = q2(4, -6), L2p = q2(6, 16);
      return s + "<g clip-path='url(#" + p + idc + ")'><rect x='" + n1(O[0] - 90) + "' y='" + n1(O[1] - 90) + "' width='180' height='180' fill='" + luceGlobale() + "' opacity='" + n1(luceSk * 100) / 100 + "'/>" +
        El(L1p[0], L1p[1], 14 * k, 9 * k, soft(skL, 0.45)) + El(L2p[0], L2p[1], 16 * k, 8 * k, soft(skDD, 0.4)) + "</g>";
    }
    // (ritocco «mani») i dettagli delle mani nuove, DENTRO il gruppo della mano (tr): pieghe, righe tra le dita (sulla pelle scura più sottili:
    // a separare le dita è il filo di luce), il pollice davanti con la sua ombra (ritagliata nella sagoma: idc) e la sua luce, le unghie
    function dettagliMano(F, k, tr, idc) {
      var scura = Lsk < 0.35, s = "", bordo = mix(sk, skDD, 0.8);
      var linea = scura ? mix(sk, "#000000", 0.5) : mix(skDD, "#2a0f08", 0.25);
      function righe(L, c2, w, o) { return L && L.length ? St(L.join(""), c2, w, o) : ""; }   // (leggero) le righe dello stesso tipo in un percorso solo (non si toccano)
      s += righe(F.l, linea, n1(1.3 / k), scura ? 0.5 : 0.42);
      var forte = scura && F.forte;
      var cB = scura ? mix(sk, "#000000", forte ? PIATTA.mB : 0.42) : bordo, wB = n1((forte ? PIATTA.wB : scura ? 1.5 : 1.8) / k), oB = forte ? PIATTA.oB : scura ? 0.75 : 0.92;
      var cR = scura ? mix(sk, "#ffe6cf", 0.4) : mix(sk, "#ffffff", 0.55), wR = n1((forte ? PIATTA.wR : scura ? 1.4 : 1.1) / k), oR = forte ? PIATTA.oR : scura ? 0.9 : 0.45;
      s += righe(F.b, cB, wB, oB) + righe(F.r, cR, wR, oR);
      var FZ = F.f || [];
      if (FZ.length) {
        s += "</g><g clip-path='url(#" + p + idc + ")'><g transform='" + tr + "'>";
        FZ.forEach(function (f) { s += Pa(f.h, skDD, " opacity='" + (scura ? 0.5 : 0.3) + "'"); });
        s += "</g></g><g transform='" + tr + "'>";
        FZ.forEach(function (f) {
          var g = f.g || [0, 0, 1, 0];
          s += Pa(f.d, LG("mf" + (nClip++), g[0], g[1], g[2], g[3], [[0, mix(sk, skL, 0.9)], [0.55, sk], [1, mix(sk, skDD, scura ? 0.32 : 0.4)]]));
          s += St(f.e, cB, wB, oB);
        });
      }
      // (leggero) le unghie senza bordo, tutte in un percorso solo: ogni unghia è un ovale fatto di due archi, girato solo se serve
      var dU = "";
      (F.u || []).forEach(function (u) {
        var g = Math.abs(u[4] || 0) > 6 ? Math.round(u[4]) : 0, ca = Math.cos(g * DEG), sa = Math.sin(g * DEG), a = q(u[2]) + " " + q(u[3]) + " " + g + " 0 1 ";
        var P1 = q(u[0] - u[2] * ca) + " " + q(u[1] - u[2] * sa), P2 = q(u[0] + u[2] * ca) + " " + q(u[1] + u[2] * sa);
        dU += "M" + P1 + "A" + a + P2 + "A" + a + P1 + "Z";
      });
      if (dU) s += Pa(dU, mix(sk, "#ffffff", forte ? PIATTA.u : scura ? 0.24 : 0.42), " opacity='.75'");
      return s;
    }
    function manoSvg(lato2) {
      var b = BR[lato2];
      // (ritocco «mani», leggero) nei tondini e nelle faccine (busto, viso) le mani a riposo stanno molto sotto il riquadro: non si disegnano
      // (non si vedevano comunque). Quelle alzate (saluta, carte, tavolo) restano: il polso sta sopra 470.
      if (A.RITOCCHI.mani && (opts.busto || opts.viso) && b.W[1] > 470) return "";
      if (b.mano === "impugna") return manoImpugna(lato2);
      // (ritocchi) le mani dei gesti ridisegnate (maniNuove; col ritocco «mani» quelle a 5 dita, maniDi); il pugno non è più ingrandito (era una palla), quella che viene avanti appena
      var M3 = maniDi(), nuova = M3[b.mano];
      var k = B.km * (b.davanti && b.mano !== "piatta" ? 1.06 : 1) * ({ pugno: 1.02, indica: 1.02, piatta: 0.98, dorso: 0.96, batti: 1, aperta: 1.02, saluta: 1.02 }[b.mano] || 1.04), forma = nuova || MANI[b.mano] || MANI.rilassata;
      if (nuova && nuova.forte) k *= PIATTA.k;
      if (SPALLE && forma.spalle) forma = forma.spalle;   // (ritocco «mani») di spalle la mano nuova vista dal dorso, senza il pollice davanti
      else if (SPALLE && forma === MANI.rilassata) forma = { p: [MANI.rilassata.p[0]], l: MANI.rilassata.l.slice(0, 2) };   // il polso della mano largo come il polso del braccio
      var rot = -lato2 * (b.dirMano != null ? b.dirMano : b.a2) + (b.polso || 0) * -lato2, mir = -lato2, sch = b.schiaccia || 1;
      // (giro3) col polso piegato forte (preme, batte: la mano scende ad angolo dalla fine dell avambraccio) la mano si sposta un po in avanti
      // lungo l avambraccio: pende dalla fine della manica invece di coprirne metà (prima la manica spuntava sopra la mano come un morso)
      var raH = rot * DEG, dH = [-Math.sin(raH), Math.cos(raH)], dF0 = [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2], beta = Math.acos(Math.max(-1, Math.min(1, dH[0] * dF0[0] + dH[1] * dF0[1])));
      var sposta = !b.due && beta > 45 * DEG ? (forma.w8 || 15) * k * 0.62 * Math.sin(beta) : 0, Wm = [b.W[0] + dF0[0] * sposta, b.W[1] + dF0[1] * sposta];
      var tr = "translate(" + n1(Wm[0]) + " " + n1(Wm[1]) + ") rotate(" + n1(rot) + ") scale(" + n1(mir * k) + " " + n1(k * sch) + ")";
      var bordo = mix(sk, skDD, 0.8), scura = Lsk < 0.35, linea = scura ? mix(sk, "#000000", 0.5) : mix(skDD, "#2a0f08", 0.25);
      // (ritocchi) il PONTE dal polso alla mano (mondo): parte dalla fine dell avambraccio, largo come lui, e arriva dentro la mano
      // larga come lei: la mano (stretta in cima) ci sta sopra, niente gradino né spigoli quando la mano si piega
      var ra = rot * DEG, cs = Math.cos(ra), sn = Math.sin(ra);
      function hw(x, y) { return [Wm[0] + mir * k * x * cs - k * sch * y * sn, Wm[1] + mir * k * x * sn + k * sch * y * cs]; }
      var dF = [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2], ww = B.aw[3], P1 = hw(0, 9), wEnd = 2 * (forma.w8 || 15) * k * 0.9;
      // (i primi due punti lungo l avambraccio: l inizio del ponte combacia con la fine del braccio anche quando il polso si piega)
      // (giro3) il ponte finisce DRITTO lungo la mano (due punti sull asse della mano): col polso piegato (preme, batte) prima finiva di sbieco e
      // lasciava scoperti gli angoli in cima alla mano (un morso tra la mano e la manica)
      var P0 = hw(0, 3), wMid = (ww * 1.01 + wEnd) / 2;
      var nodiP = [[b.W[0] - dF[0] * 4, b.W[1] - dF[1] * 4, ww], [b.W[0] + dF[0] * 1.5, b.W[1] + dF[1] * 1.5, ww * 1.01], [P0[0], P0[1], wMid], [P1[0], P1[1], wEnd], [hw(0, 13)[0], hw(0, 13)[1], wEnd * 0.98]];
      var ponte = limb(nodiP, 0), lp = latiLimb(nodiP);
      // (giro3) il polso tondo: mezzo disco davanti alla fine dell avambraccio (largo come il polso). Col polso dritto sta dentro il ponte
      // e non si vede; col polso piegato fa l angolo tondo del dorso del polso (prima lì restava un morso)
      var nF = [-dF[1], dF[0]], C0 = [b.W[0] + dF[0], b.W[1] + dF[1]], rW = ww * 0.5, pdisco = [];
      for (var iD = 0; iD <= 10; iD++) { var tD = Math.PI * iD / 10; pdisco.push([C0[0] + rW * (Math.cos(tD) * nF[0] + Math.sin(tD) * dF[0]), C0[1] + rW * (Math.cos(tD) * nF[1] + Math.sin(tD) * dF[1])]); }
      var disco = liscio(pdisco) + "Z";
      var s = St(liscio(lp[0]), bordo, 3.2) + St(liscio(lp[1]), bordo, 3.2) + St(liscio(pdisco), bordo, 3.2) + "<g transform='" + tr + "'>";
      // il bordo dietro (solo il contorno esterno, non al polso), poi la pelle, poi luci e pieghe
      if (forma.cartone) {   // (ritocco «mani») le mani nuove: tutte le forme in un percorso solo (stesso verso: il riempimento è l unione),
        // scritto una volta sola nei defs e usato tre volte (contorno, pelle, ritaglio): pesano meno di quelle di prima
        var idp = p + "h" + (nClip++), idc5 = "c" + (nClip++), F5 = forma;
        D.push("<path id='" + idp + "' d='" + F5.p.concat((F5.f || []).map(function (x) { return x.d; })).join("") + "'/>");
        s += "<use href='#" + idp + "' fill='none' stroke='" + bordo + "' stroke-width='" + n1(3.2 / k) + "'/></g>" + Pa(ponte, sk) + Pa(disco, sk) + "<g transform='" + tr + "'><use href='#" + idp + "' fill='" + sk + "'/>";
        s += dettagliMano(F5, k, tr, idc5);
        D.push("<clipPath id='" + p + idc5 + "'><path d='" + ponte + "'/><path d='" + disco + "'/><use href='#" + idp + "' transform='" + tr + "'/></clipPath>");
        var ar5 = (rot + 90) * DEG, dm5 = [Math.cos(ar5), Math.sin(ar5)], Hm5 = [Wm[0] + dm5[0] * 60 * k, Wm[1] + dm5[1] * 60 * k], luci5 = "";
        (F5.n || []).forEach(function (nn) { var P = hw(nn[0], nn[1]); luci5 += El(P[0], P[1], (nn[2] || 3.6) * k, (nn[3] || 2.6) * k, soft(skL, scura ? (F5.forte ? PIATTA.n : 0.3) : 0.36)); });
        (F5.v || []).forEach(function (v) { luci5 += cilindro(hw(v[0], v[1]), hw(v[2], v[3]), v[4] * k, skL, skDD, scura ? 0.5 : 0.8); });   // ogni dito col suo volume
        (F5.o || []).forEach(function (nn) { var P = hw(nn[0], nn[1]); luci5 += El(P[0], P[1], nn[2] * k, nn[3] * k, soft(skDD, scura ? 0.3 : 0.34)); });   // ombre morbide (tra il pollice e le dita)
        return s + "</g><g clip-path='url(#" + p + idc5 + ")'><rect x='" + n1(b.W[0] - 90) + "' y='" + n1(b.W[1] - 90) + "' width='180' height='180' fill='" + luceGlobale() + "' opacity='" + n1(luceSk * 100) / 100 + "'/>" +
          cilindro([Wm[0] - dm5[0] * 8, Wm[1] - dm5[1] * 8], Hm5, 30 * k, skL, skDD, (scura ? 0.45 : 0.7) * 0.6) + luci5 + "</g>";
      }
      forma.p.forEach(function (d) { s += "<path d='" + d.replace(/Z$/, "") + "' fill='none' stroke='" + bordo + "' stroke-width='" + n1(3.2 / k) + "' stroke-linecap='butt'/>"; });
      s += "</g>" + Pa(ponte, sk) + Pa(disco, sk) + "<g transform='" + tr + "'>";
      forma.p.forEach(function (d) { s += Pa(d, sk); });
      (forma.u || []).forEach(function (u) { s += El(u[0], u[1], u[2], u[3], mix(sk, "#ffffff", scura ? 0.22 : 0.38), " opacity='.7'"); });
      // (giro3) righe più decise: tra le dita (s) col colore del bordo, così le dita si contano anche nelle figure piccole
      forma.l.forEach(function (d) { s += St(d, linea, 1.5, scura ? 0.8 : 0.66); });
      var sep = scura ? mix(sk, "#000000", 0.55) : mix(bordo, "#3a1408", 0.18);
      (forma.s || []).forEach(function (d) { s += St(d, sep, 2.1, 0.95); });
      (forma.b || []).forEach(function (d) { s += St(d, bordo, 2, 0.95); });
      var idc = "c" + (nClip++);
      D.push("<clipPath id='" + p + idc + "'><path d='" + ponte + "'/><path d='" + disco + "'/>" + forma.p.map(function (d) { return "<path d='" + d + "' transform='" + tr + "'/>"; }).join("") + "</clipPath>");
      // le luci della mano sono quelle del braccio (luce da sinistra e volume lungo la mano), in coordinate del mondo: niente salto al polso
      var ar = (rot + 90) * DEG, dm = [Math.cos(ar), Math.sin(ar)], Hm = [Wm[0] + dm[0] * 60 * k, Wm[1] + dm[1] * 60 * k];
      var luci = "";
      (forma.n || []).forEach(function (nn) { var P = hw(nn[0], nn[1]); luci += El(P[0], P[1], 3.6 * k, 2.6 * k, soft(skL, scura ? 0.5 : 0.6)); });
      return s + "</g><g clip-path='url(#" + p + idc + ")'><rect x='" + n1(b.W[0] - 90) + "' y='" + n1(b.W[1] - 90) + "' width='180' height='180' fill='" + luceGlobale() + "' opacity='" + n1(luceSk * 100) / 100 + "'/>" +
        cilindro([Wm[0] - dm[0] * 8, Wm[1] - dm[1] * 8], Hm, 30 * k, skL, skDD, scura ? 0.45 : 0.7) + luci + "</g>";
    }


    function ventaglio() {
      // (ritocchi) le carte della misura giusta: una carta è larga più o meno quanto la mano (prima erano grandi una volta e mezza)
      var a = BR["-1"].W, b2 = BR["1"].W, cx = (a[0] + b2[0]) / 2, cy = Math.min(a[1], b2[1]) - 34, s ="<g transform='translate(" + n1(cx) + " " + n1(cy) + ") scale(.86) translate(" + n1(-cx) + " " + n1(-cy) + ")'>";
      var dorso = LG("cdorso", 0, 0, 1, 1, [[0, "#e04a4a"], [1, "#9c1f2c"]]);
      [-30, -15, 0, 15, 30].forEach(function (g) {
        s += "<g transform='rotate(" + g + " " + n1(cx) + " " + n1(cy + 40) + ")'><rect x='" + n1(cx - 26) + "' y='" + n1(cy - 62) + "' width='52' height='78' rx='6' fill='#fbf7ef' stroke='#7a6a5a' stroke-width='1.6'/>" +
          "<rect x='" + n1(cx - 21) + "' y='" + n1(cy - 57) + "' width='42' height='68' rx='4' fill='" + dorso + "'/><path d='M" + n1(cx - 21) + " " + n1(cy - 23) + "L" + n1(cx) + " " + n1(cy - 50) + "L" + n1(cx + 21) + " " + n1(cy - 23) + "L" + n1(cx) + " " + n1(cy + 4) + "Z' fill='#ffffff' opacity='.22'/></g>";
      });
      return s + "</g>";
    }
    // ---------- la testa ----------
    var OC = OCCHI[c.occhi] || OCCHI.tondi, kOcc = 1 + 0.07 * (+c.occG || 0), dxOcc = 26 + 2 * (+c.occD || 0), yOcc = -72 - 2.5 * (+c.occA || 0);
    K.occhiPos = { dx: dxOcc, y: yOcc, k: kOcc };   // dove stanno gli occhi (per gli occhiali)
    function occhio(side, chiuso) {
      // side: -1 a sinistra nel disegno, 1 a destra; dentro il gruppo x positivo = verso l'esterno
      var o = OC, sx = (o.sx || 1) * kOcc * (m ? 1 : 1.02), sy = (o.sy || 1) * kOcc, tilt = o.tilt || 0, lid = o.lid || 0;
      var ht = 8.2 * sy, hb = 5.2 * sy, Ix = -12.5 * sx, Ox = 12.5 * sx;
      var s = "<g transform='translate(" + n1(side * dxOcc) + " " + n1(yOcc) + ") scale(" + side + " 1) rotate(" + (-tilt) + ")'>";
      var linea = m ? hDD : "#1a0e0a", lw2 = m ? 2.1 : 2.4;
      if (o.chiusi || chiuso) {
        var d = chiuso === "felice" ? "M" + n1(Ix) + " 2C" + n1(Ix + 7) + " -6 " + n1(Ox - 8) + " -7 " + n1(Ox) + " 0" : "M" + n1(Ix) + " -1C" + n1(Ix + 7) + " 5 " + n1(Ox - 7) + " 5 " + n1(Ox) + " -2";
        s += St("M" + n1(Ix) + " -6C" + n1(Ix + 7) + " -12 " + n1(Ox - 5) + " -13 " + n1(Ox + 2) + " -8", skDD, 1, 0.4) + St(d, linea, lw2);
        if (!m || o.ciglia) for (var q = 0; q < 4; q++) { var tx = Ix + 6 + q * 5.4 * sx; s += St("M" + n1(tx) + " " + (chiuso === "felice" ? -4 : 3) + "l" + n1(1 + q * 0.6) + " " + (chiuso === "felice" ? -3 : 3.6), linea, 1); }
        return s + "</g>";
      }
      var felice = !!o.felice;
      var htv = ht * (1 - lid), eye = "M" + n1(Ix) + " 1C" + n1(Ix + 5.5) + " " + n1(1 - htv - 0.2) + " " + n1(Ox - 8.5) + " " + n1(-2 - htv * 0.8) + " " + n1(Ox) + " -2" +
        (felice ? "C" + n1(Ox - 6) + " " + n1(-2 - ht * 0.15) + " " + n1(Ix + 7) + " " + n1(1 - ht * 0.15) + " " + n1(Ix) + " 1Z"
                : "C" + n1(Ox - 6.5) + " " + n1(-2 + hb + 0.8) + " " + n1(Ix + 7.5) + " " + n1(1 + hb) + " " + n1(Ix) + " 1Z");
      var top0 = "M" + n1(Ix - 0.3) + " 1.2C" + n1(Ix + 5.5) + " " + n1(1 - htv - 0.4) + " " + n1(Ox - 8.5) + " " + n1(-2 - htv * 0.8 - 0.2) + " " + n1(Ox + 0.3) + " -2.2";
      var ce = clip(eye), rI = 5.4 * Math.min(1.25, Math.max(sx, sy)) * (o.piccola ? 0.92 : 1) * (felice ? 0.95 : 1), iy = felice ? -2.2 : -1.2 - lid * 2;
      s += "<g clip-path='" + ce + "'>" + Pa(eye, U("scl")) +
        "<circle cx='.6' cy='" + n1(iy) + "' r='" + n1(rI) + "' fill='" + U("iri") + "'/><circle cx='.6' cy='" + n1(iy) + "' r='" + n1(rI * 0.46) + "' fill='#120a08'/>" +
        (o.stelle ? Pa("M-1.4 " + n1(iy - 5) + "l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z", "#ffffff") + "<circle cx='3.6' cy='" + n1(iy + 2.4) + "' r='1.1' fill='#fff' opacity='.9'/>"
                  : "<circle cx='-1.5' cy='" + n1(iy - 2) + "' r='1.8' fill='#fff' opacity='.95'/><circle cx='2.9' cy='" + n1(iy + 2.1) + "' r='.9' fill='#fff' opacity='.45'/>") +
        Pa("M" + n1(Ix - 1) + " 3C-7 " + n1(-3 - htv * 0.4) + " 4 " + n1(-5 - htv * 0.4) + " " + n1(Ox + 1) + " -.8L" + n1(Ox + 1) + " -6C4 -12 -7 -12 " + n1(Ix - 1) + " -1Z", "#1a0f0c", " opacity='.26'") + "</g>";
      // piega della palpebra, palpebra sotto, riga delle ciglia
      s += St("M" + n1(Ix) + " " + n1(-1.5 - ht * 0.35 - lid * 2) + "C" + n1(Ix + 6.5) + " " + n1(-10 - ht * 0.2) + " " + n1(Ox - 7) + " " + n1(-11.5 - ht * 0.15) + " " + n1(Ox + 2.5) + " " + n1(-5 - ht * 0.1), skDD, 1.1, 0.5);
      s += St(felice ? "M" + n1(Ix + 1) + " 5C-4 " + n1(1 - ht * 0.1) + " 6 " + n1(-0.5 - ht * 0.1) + " " + n1(Ox - 1) + " 1" : "M" + n1(Ix + 1) + " 4C-4 " + n1(4 + hb * 0.62) + " 6 " + n1(3 + hb * 0.55) + " " + n1(Ox - 0.5) + " -.4", skDD, 0.9, felice ? 0.45 : 0.3);
      // trucco: ombretto (sopra l'occhio), eyeliner, ciglia
      if (c.ombretto && c.ombretto !== "nessuno") {
        var co = col(OPZ.colOmbretto, c.colOmbretto), opo = { leggero: 0.32, sfumato: 0.42, intenso: 0.62, glitter: 0.5 }[c.ombretto] || 0.4;
        s += Pa("M" + n1(Ix - 1) + " 0C" + n1(Ix + 3) + " -13 " + n1(Ox - 4) + " -16 " + n1(Ox + 5) + " -6C" + n1(Ox - 4) + " " + n1(-3 - htv) + " " + n1(Ix + 6) + " " + n1(-2 - htv) + " " + n1(Ix - 1) + " 0Z", co, " opacity='" + opo + "'");
        if (c.ombretto === "glitter") s += "<circle cx='-4' cy='-7' r='.9' fill='#fff'/><circle cx='4' cy='-8.5' r='.7' fill='#fff'/><circle cx='9' cy='-6' r='.8' fill='#fff'/>";
      }
      s += St(top0, linea, lw2);
      var elC = c.eyeliner && c.eyeliner !== "nessuno" ? col(OPZ.colEyeliner, c.colEyeliner) : null;
      if (elC && c.eyeliner !== "matita") s += St(top0, elC, c.eyeliner === "grafico" ? 3.6 : 2.8) + (c.eyeliner !== "sottile" ? St("M" + n1(Ox - 1) + " -2.4C" + n1(Ox + 2) + " -4 " + n1(Ox + 4.5) + " -6 " + n1(Ox + 6) + " -9", elC, 2) : "");
      if (elC && c.eyeliner === "matita") s += St("M" + n1(Ix + 2) + " 4C-4 " + n1(4 + hb * 0.6) + " 6 " + n1(3 + hb * 0.5) + " " + n1(Ox - 0.5) + " -.4", elC, 1.5, 0.85);
      if (o.linea && !elC) s += St("M" + n1(Ox - 1) + " -2.4C" + n1(Ox + 2) + " -4 " + n1(Ox + 4) + " -6 " + n1(Ox + 5) + " -8", linea, 1.6);
      var nC = (!m ? 1 : 0) + (o.ciglia ? 1 : 0) + (c.mascara === "volume" || c.mascara === "finte" ? 1 : 0), lungC = 1 + (o.ciglia ? 0.4 : 0) + (c.mascara === "finte" ? 0.5 : (c.mascara === "volume" ? 0.25 : (c.mascara === "naturale" ? 0.1 : 0)));
      if (nC || (c.mascara && c.mascara !== "nessuno")) {
        s += St("M" + n1(Ox - 1.5) + " -2.4C" + n1(Ox + 1.1) + " -3.8 " + n1(Ox + 3.1) + " -5.6 " + n1(Ox + 3.9) + " -8", "#1a0e0a", 1.4);
        [[-0.5, -0.3], [-0.15, -0.55], [0.2, -0.6], [0.5, -0.45], [0.78, -0.3]].forEach(function (f) {
          var x = Ox * f[0] * 1.6 * 0.5 + (Ix + Ox) / 2 + f[0] * 4, y = -2 - htv * (1 + f[1]) * 0.75 + 0.6, lx = x + (f[0] + 0.3) * 3 * lungC, ly = y - 3.2 * lungC;
          s += St("M" + n1(x) + " " + n1(y) + "Q" + n1(lx - 1) + " " + n1(ly + 2) + " " + n1(lx) + " " + n1(ly), "#1a0e0a", 1 + (nC > 1 ? 0.3 : 0));
        });
      }
      return s + "</g>";
    }
    function sopracciglio(side) {
      var o = SOPRA[c.sopracc] || SOPRA.morbide, w = o.w * (m ? 1 : 0.8), arc = o.arc, dy = (o.dy || 0) - 2.5 * (+c.soprA || 0) + (OC.felice ? -2 : 0), iu = o.iu || 0, pk = o.picco || 0.55;
      var x0 = o.unite ? 2 : 10, x1 = 46, yb = -89 + dy;
      var pts = [[x0, yb - iu * 0.5, w * 0.95], [x0 + (x1 - x0) * 0.28, yb - arc * 0.75 - iu * 0.25, w], [x0 + (x1 - x0) * pk, yb - arc, w * 0.88], [x1 - 4, yb - arc * 0.35 + 1.5, w * 0.5], [x1 + 1, yb + 2.5, w * 0.2]];
      var colS = m || o.w > 9 ? U("hg3") : mix(hc, "#000000", 0.25);
      var s = "<g transform='scale(" + side + " 1)'>" + Pa(limb(pts), colS);
      if (w > 5) s += St(liscio(pts.slice(0, 4).map(function (q) { return [q[0] + 2, q[1] - w * 0.15]; })), hL, 0.8, 0.3);
      if (o.taglio) s += Pa("M" + n1(x0 + (x1 - x0) * 0.62) + " " + n1(yb - arc - w) + "l3 0 -2 " + n1(w * 2.2) + "-3 0z", sk);
      return s + "</g>";
    }
    function naso() {
      var o = NASO[c.naso] || NASO.dritto, w = (o.w || 1) * (1 + 0.1 * (+c.nasoG || 0)), l = (o.l || 1) * (1 + 0.06 * (+c.nasoG || 0)), pu = (o.punta || 1);
      var s = "<g transform='translate(0 -40) scale(" + n1(w) + " " + n1(l) + ") translate(0 40)'>";
      if (o.gobba) s += St("M6 -84C9 -74 12 -66 10 -60C9 -56 11 -52 12.5 -49", skDD, 3.6, 0.26);
      else s += St("M6 -84C8.5 -70 10 -58 12.5 -49", skDD, 3.4, 0.22);
      s += St("M-5 -82C-8 -70 -9 -58 -11.5 -49", "#ffffff", 2, 0.12);
      var ty = o.insu ? -46.5 : -44.5;
      s += El(0, ty, 10.5 * pu, 7.5 * pu, soft(skL, 0.55));
      if (o.aguzzo) s += St("M-2 -49C0 -46 2 -46 3.5 -48", skDD, 1.1, 0.45);
      var wx = 11.5;
      s += St("M-" + wx + " -47C-" + (wx + 2.5) + " -41 -9 -37.4 -5 -39.6", skDD, 1.5, 0.6) + St("M" + wx + " -47C" + (wx + 2.5) + " -41 9 -37.4 5 -39.6", skDD, 1.5, 0.6);
      var nr = o.insu ? 1.8 : 1.3;
      s += El(-4.6, -39.6, 2.3, nr, "#5a2418", " opacity='.55'") + El(4.6, -39.6, 2.3, nr, "#5a2418", " opacity='.55'");
      s += El(0, -36, 11, 3.6, soft(skDD, 0.3)) + El(-2.2, ty - 2.9, 3 * pu, 1.8 * pu, "#ffffff", " opacity='.4'");
      return s + "</g>";
    }
    function orecchie() {
      var t = c.orecchie, k = t === "piccole" ? 0.82 : (t === "grandi" ? 1.22 : 1), px = F.cw - 5;
      var e = "M0 -6C13 -13 22 0 18 14C16 24 10 31 1 33Z";
      if (t === "punta") e = "M0 -6C10 -16 26 -34 30 -36C26 -20 22 2 18 14C16 24 10 31 1 33Z";
      var one = "<g transform='translate(" + px + " -78) scale(" + k + ")'>" + Pa(e, mix(sk, skD, 0.3)) +
        St("M5 0C12 -2.5 14.5 7 12.5 14.5C11.5 19.5 8.5 22 5 23", skD, 1.6, 0.75) + Pa("M8 12C11 10 12.5 14 11 17C9 17 8 15 8 12Z", skDD, " opacity='.35'") + "</g>";
      return one + "<g transform='scale(-1 1)'>" + one + "</g>";
    }
    var CALVI = { calvo: 1 }, RASATI = { rasato: 1, sfumato: 1 }, PELATI_SOPRA = { stempiato: 1, chierica: 1 };
    function testaDietro(capF, capD) {
      var nkH = B.nk / 0.9 * 1.08, cw = F.cw;
      var nuca = "M" + (-cw) + " -78C" + (-cw - 1) + " " + n1(-78 - 40 * F.L) + " " + n1(-cw * 0.63) + " " + n1(top + 2) + " 0 " + n1(top) + "C" + n1(cw * 0.63) + " " + n1(top + 2) + " " + (cw + 1) + " " + n1(-78 - 40 * F.L) + " " + cw + " -78" +
        "C" + cw + " -50 " + n1(cw * 0.82) + " -24 " + n1(nkH) + " -4L" + n1(-nkH) + " -4C" + n1(-cw * 0.82) + " -24 " + (-cw) + " -50 " + (-cw) + " -78Z";
      var s = orecchie(), nome = pcap ? pcap.nome : "calvo";
      if (capF && !CALVI[nome]) s += "<g transform='scale(-1 1)'>" + capF + "</g>";   // il volume dei capelli intorno alla testa (girato: di spalle destra e sinistra si scambiano)
      var cn = clip(nuca);
      if (CALVI[nome] || RASATI[nome] || PELATI_SOPRA[nome] || !pcap) {
        s += Pa(nuca, U("face")) + "<g clip-path='" + cn + "'>" + El(-14, top + 30, 26, 20, soft("#ffffff", 0.22)) + El(cw * 0.5, -40, cw * 0.6, 50, soft(skDD, 0.3));
        if (RASATI[nome]) s += K.rasatura(nuca, 900, 0.6);
        if (PELATI_SOPRA[nome]) s += Pa("M-80 -96C-40 -84 40 -84 80 -96L80 20L-80 20Z", U("hg3")) + K.ciocche([[[-40, -92, 3], [-42, -60, 10], [-36, -20, 3]], [[0, -88, 3], [0, -50, 12], [0, -10, 3]], [[40, -92, 3], [42, -60, 10], [36, -20, 3]]], ["hg1", "hg2"]);
        s += "</g>";
      } else {
        s += Pa(nuca, U("hg3")) + "<g clip-path='" + cn + "'>";
        var str = [];
        for (var i = -3; i <= 3; i++) { var x0 = i * cw / 3.6; str.push([[x0 * 0.5, top + 10, 4], [x0 * 1.05, -112, 15], [x0 * 1.1, -60, 14], [x0 * 0.92, -14, 6], [x0 * 0.8, 0, 2]]); }
        s += K.ciocche(str, ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2", "hg1"]) + El(cw * 0.45, -40, cw * 0.7, 70, soft(hDD, 0.35)) + El(-cw * 0.3, top + 30, cw * 0.6, 26, soft(hL, 0.25)) + "</g>";
      }
      if (capD) s += "<g transform='scale(-1 1)'>" + capD + "</g>";   // i capelli lunghi che scendono sulla schiena: di spalle stanno davanti
      return s;
    }
    function testa(capFronte, barba, ombraFronte) {
      var s = orecchie();
      s += Pa(faceD, U("face"));
      var fc = clip(faceD);
      s += "<g clip-path='" + fc + "'>";
      s += "<rect x='14' y='-160' width='52' height='164' fill='" + LG("rs", 0, 0, 1, 0, [[0, skD, 0], [1, skD, 0.55]]) + "'/>";
      s += El(0, -3, 40, 12, soft(skDD, 0.3));
      s += El(-dxOcc, yOcc, 20, 12, soft(skDD, 0.2)) + El(dxOcc, yOcc, 20, 12, soft(skDD, 0.24));
      var gC = m ? "#e0806a" : "#ec7f8a", gO = m ? 0.2 : 0.3;
      if (c.guance === "rosse") { gC = "#f0606e"; gO = 0.45; } else if (c.guance === "leggere") gO += 0.1;
      if (c.blush && c.blush !== "nessuno") { gC = col(OPZ.colBlush, c.colBlush); gO = c.blush === "intenso" ? 0.55 : 0.38; }
      s += El(-34, -42, 17, 12, soft(gC, gO)) + El(34, -42, 17, 12, soft(gC, gO * 0.9));
      s += El(-30, -62, 13, 8, soft("#ffffff", 0.2)) + El(-10, top + 32, 30, 16, soft("#ffffff", 0.16));
      if (ombraFronte !== false) s += El(0, top + 24, 44, 6, soft(hDD, m ? 0.16 : 0.08));
      if (barba && barba.dentro) s += barba.dentro;
      if (pittura) s += pittura;
      if (c.guance === "lentiggini") { var R = rnd(5); for (var i = 0; i < 26; i++) { var x = (i % 2 ? 1 : -1) * (14 + R() * 26), y = -58 + R() * 18; s += "<circle cx='" + n1(x) + "' cy='" + n1(y) + "' r='" + n1(0.8 + R() * 0.8) + "' fill='" + skDD + "' opacity='.45'/>"; } }
      s += "</g>";
      s += naso();
      // bocca
      var pb = pezzoDi("bocca", c.bocca);
      var yb = -2.2 * (+c.boccaA || 0);
      s += "<g transform='translate(0 " + n1(yb) + ")'>" + (pb ? pb.fn(K) : "") + "</g>";
      if (barba && barba.sopra) s += barba.sopra;
      // occhi e sopracciglia
      var occh = c.occhi === "occhiolino";
      s += "<g class='om-occhi'>" + occhio(-1) + occhio(1, occh ? "felice" : null) + "</g>" + sopracciglio(-1) + sopracciglio(1);
      if (SOPRA[c.sopracc] && SOPRA[c.sopracc].unite) s += Pa("M-12 " + n1(-90 + (SOPRA[c.sopracc].dy || 0)) + "C-5 -93 5 -93 12 " + n1(-90 + (SOPRA[c.sopracc].dy || 0)) + "L12 -85C5 -88 -5 -88 -12 -85Z", U("hg3"), " opacity='.85'");
      // segni sul viso
      var sg = A.segno[c.segno]; if (sg) s += sg(K);
      return s;
    }

    // ---------- i pezzi di questa configurazione ----------
    LG("face", 0.2, 0, 0.85, 1, [[0, mix(skL, sk, 0.35)], [0.4, sk], [0.8, mix(sk, skD, 0.6)], [1, skD]]);
    LG("scl", 0, 0, 0, 1, [[0, "#c9bfb8"], [0.35, "#f7f2ed"], [1, "#e4dbd4"]]);
    RG("iri", [[0, mix(iris, "#ffffff", 0.35)], [0.55, iris], [1, mix(iris, "#000000", 0.55)]], "cx='.5' cy='.6' r='.55'");
    var capTipo = c.capelli, pcap = capTipo === "calvo" && !A.capelli.calvo ? null : pezzoDi("capelli", capTipo);
    var cap = pcap ? (pcap.fn(K) || {}) : {};
    var pCapp = c.cappello && c.cappello !== "nessuno" ? pezzoDi("cappelli", c.cappello) : null, capp = pCapp ? (pCapp.fn(K) || {}) : null;
    // ---------- gli extra (secondo tempo): al collo, sulla schiena, la borsa, in mano, l'animaletto, la pittura sul viso ----------
    // collo: { sopra, dietro } · schiena: { dietro, sopra (spallacci) } · borsa: { sotto (la borsa, prima delle braccia), sopra (la tracolla) }
    // inmano: { dietro (prima della mano: il manico dentro il pugno), davanti } · animale: svg (a terra, accanto) · pittura: svg in coordinate della testa (ritagliata sul viso)
    function extra(tipo, v, vuoto) { var f = v && v !== vuoto && A[tipo] ? A[tipo][v] : null; return f ? f(K) : null; }
    var bR = BR["1"], dR = [(bR.W[0] - bR.E[0]) / bR.l2, (bR.W[1] - bR.E[1]) / bR.l2], kM = B.km / 1.06;
    var conOgg = !!(c.mano && c.mano !== "nessuno" && (!bR.davanti || bR.tiene) && !bR.canna && !opts.busto && !opts.viso && A.inmano[c.mano]);   // nei tondini niente cose in mano (si vedevano a pezzi sul bordo)
    var regO = conOgg && A.impugna[c.mano] ? A.impugna[c.mano] : null;
    if (conOgg) { bR.mano = regO ? "impugna" : "pugno"; if (!regO) bR.dirMano = null; }   // (i pezzi di prima: il pugno segue l avambraccio, come prima)
    K.presa = { x: bR.W[0] + dR[0] * 20 * kM, y: bR.W[1] + dR[1] * 20 * kM, ang: Math.atan2(dR[0], dR[1]) / DEG, k: kM };   // dove stringe il pugno a destra nel disegno (mondo); ang = la direzione dell'avambraccio
    // (terzo tempo) il contratto nuovo: K.presa = { x, y: il centro del pugno · k: la misura della mano · inclina: il manico (gradi, 0 = dritto in su,
    // + = la cima verso fuori, - = verso il corpo) · qui(svg, inclina?): mette un disegno nelle coordinate della presa · foro: quanto può essere
    // largo il manico · alto: quanto è alto il pugno (coordinate della presa) · posa · ang (direzione dell avambraccio, come prima) }
    function presaNuova(inc0, kI) {
      var Oc = [bR.W[0] + dR[0] * 17 * kI, bR.W[1] + dR[1] * 17 * kI];
      K.presa = { x: Oc[0], y: Oc[1], ang: Math.atan2(dR[0], dR[1]) / DEG, k: kI, inclina: inc0, foro: 13, alto: 42, lato: 1, posa: regO ? regO.posa || "davanti" : "fianco",
        qui: function (s2, inc) { return "<g transform='translate(" + n1(Oc[0]) + " " + n1(Oc[1]) + ") rotate(" + n1(inc != null ? +inc : K.presa.inclina) + ") scale(" + n1(kI * 100) / 100 + ")'>" + s2 + "</g>"; } };
    }
    if (regO) presaNuova(+regO.inclina || 0, kImpugna());
    // (ritocco «cravatta») la cravatta si chiede DOPO il capo: un capo che le passa sopra (giacca, gilet, cappotto) le lascia in K.cravattaV dove si vede
    var colloDopo = A.RITOCCHI.cravatta && c.collo === "cravatta";
    var xCollo = colloDopo ? null : extra("collo", c.collo, "nessuno"), xSch = extra("schiena", c.schiena, "nessuna"), xBor = extra("borsa", c.borsa, "nessuna"), xAni = soloSu ? null : extra("animale", c.animale, "nessuno"), xOgg = conOgg ? A.inmano[c.mano](K) : null;
    var pittura = extra("pittura", c.pittura, "nessuna");
    if (typeof xOgg === "string") xOgg = { davanti: xOgg };
    if (xOgg && conOgg && xOgg.inclina != null) { if (!regO) presaNuova(+xOgg.inclina, kImpugna()); else K.presa.inclina = +xOgg.inclina; bR.mano = "impugna"; }   // il pezzo dice l inclinazione: il pugno la segue if (typeof xCollo === "string") xCollo = { sopra: xCollo }; if (typeof xSch === "string") xSch = { dietro: xSch }; if (typeof xBor === "string") xBor = { sopra: xBor };
    xOgg = xOgg || {}; xCollo = xCollo || {}; xSch = xSch || {}; xBor = xBor || {};
    var pBarba = m && c.barba && c.barba !== "no" ? pezzoDi("barba", c.barba) : null, barba = pBarba ? (pBarba.fn(K) || {}) : null;
    if (typeof barba === "string") barba = { dentro: barba };
    // (tappa 3) tipo = "capo" | "sotto": mentre il pezzo disegna, K.dipingi sa di chi è la stoffa (fantasia e trama)
    function chiama(pz, tipo) {
      if (!pz) return null;
      var f0 = fabOra, m0 = manicaMax; fabOra = tipo ? STF[tipo] : null; K.dietro2 = null;
      manicaMax = tipo === "capo" ? corteCapo : 1; K.manicaMax = manicaMax; K.manicaCorta = manicaMax < 1;   // (le maniche corte della camicia hawaiana)
      try { return chiama0(pz, tipo); } finally { fabOra = f0; manicaMax = m0; K.manicaMax = 1; K.manicaCorta = false; }
    }
    function chiama0(pz, tipo) {
      if (!SPALLE) return pz.fn(K);
      var rec = [], vero = K.dipingi, r2;
      K.dipingi = function (q, col2, o2) { rec.push([q, col2, o2 || {}]); return { svg: "", clip: "none" }; };
      try { r2 = pz.fn(K); } finally { K.dipingi = vero; }
      if (!rec.length) return r2;
      var s2 = rec.map(function (x) { var o3 = x[2]; return dipingi(x[0], x[1], { bordo: o3.bordo, chiaro: o3.chiaro, scuro: o3.scuro, forza: o3.forza, volume: o3.volume, fino: o3.fino,
        dentro: El(C - B.ch * 0.4, Y.ascella + 20, B.ch * 0.36, 60, soft("#ffffff", 0.12)) + St("M" + (C - 30) + " " + (Y.petto + 10) + "C" + (C - 10) + " " + (Y.petto + 26) + " " + (C + 10) + " " + (Y.petto + 26) + " " + (C + 30) + " " + (Y.petto + 10), mix(x[1], "#000000", 0.4), 3, 0.14) }).svg; }).join("");
      if (tipo === "capo" && m2 && K.dietro2) s2 += bordiDietro(K.dietro2, rec);   // (tappa 3) il secondo colore visto da dietro
      // (tappa 4) un capo può dare qualcosa da mettere sopra la stoffa vista da dietro (r.spalle: il cappuccio della felpa Moda, solo i bordi e le ombre)
      if (tipo === "capo" && r2 && typeof r2.spalle === "string" && PARTE !== "braccio") s2 += r2.spalle;
      return { corpo: s2 };
    }
    // (tappa 3) di spalle il pezzo non disegna i suoi dettagli: il secondo colore dove il pezzo l ha detto (K.dietro2 = { fasce: [[da, a], …]
    // (orlo a coste, cintura), pol: lunghezza dei polsini, collo: 1 }). Si disegna sopra la stoffa, con la stessa luce
    function bordiDietro(R2, rec) {
      var s = "", cd = mix(m2, "#14080c", 0.45);
      rec.forEach(function (x) {
        if (x[1] !== mg) return;
        var q0 = x[0];
        if (R2.pol) (q0.braccia || []).forEach(function (b) {
          if (!tieni(b.lato)) return;
          var f = fineManica(b.lato, b.fino == null ? 1 : b.fino), w = f.w + (b.e || 0), xs = f.x - f.dx * R2.pol, ys = f.y - f.dy * R2.pol, px = -f.dy * w * 0.47, py = f.dx * w * 0.47;
          s += suManica(b.lato, Pa(limb([[xs, ys, w * 0.98], [f.x, f.y, w * 0.94]]), m2) + St("M" + pq(xs + px, ys + py) + "L" + pq(xs - px, ys - py), cd, 1.6, 0.5));
        });
        if (R2.fasce && q0.tronco && q0.tronco[0] && PARTE !== "braccio") R2.fasce.forEach(function (fz) {   // [da quota, a quota]: l orlo a coste, la cintura
          s += "<g clip-path='" + clip(q0.tronco) + "'><rect x='0' y='" + q(fz[0]) + "' width='400' height='" + q(fz[1] - fz[0]) + "' fill='" + m2 + "'/><rect x='-200' y='" + q(fz[0]) + "' width='800' height='" + q(fz[1] - fz[0]) + "' fill='" + luceGlobale() + "'/>" +
            St("M0 " + q(fz[0]) + "H400", cd, 2, 0.5) + St("M0 " + q(fz[0] + 2.5) + "H400", "#ffffff", 1.2, 0.3) + "</g>";
        });
      });
      if (R2.collo && PARTE !== "braccio") s += St("M" + pq(C - B.nk - 7, 243) + "Q" + pq(C, 251) + " " + pq(C + B.nk + 7, 243), cd, 10, 0.5) + St("M" + pq(C - B.nk - 6, 242) + "Q" + pq(C, 250) + " " + pq(C + B.nk + 6, 242), m2, 7.5, 1);
      return s;
    }
    K.soloDietro = sedS;   // (tappa 4) seduto: da questa chiamata serve solo «dietro» (corpo e braccia li rifà seduto())
    var pCapo = pezzoDi("capo", c.capo), capo = pCapo ? (chiama(pCapo, "capo") || {}) : {};
    K.soloDietro = false;
    if (typeof capo === "string") capo = { corpo: capo };
    if (colloDopo) {
      xCollo = extra("collo", c.collo, "nessuno") || {}; if (typeof xCollo === "string") xCollo = { sopra: xCollo };
      // la cravatta lunga arriva alla cintura: le braccia che passano DAVANTI al corpo (carte, applaude, tavolo, posa, preme, batte) la coprono
      // con la manica (le maniche stanno nel capo, disegnato prima: senza questa maschera la cravatta ci passava sopra); basta dal gomito in giù
      var avanti = SPALLE || !xCollo.sopra ? [] : [-1, 1].filter(function (l) { return BR[l].davanti && !(PARTE === "corpo" && LP === l); });   // (nel corpo senza un braccio quel braccio non c è: niente buco)
      if (avanti.length) {
        var idCm = p + "cm" + (nClip++);
        D.push("<mask id='" + idCm + "' maskUnits='userSpaceOnUse' x='-200' y='0' width='800' height='1200'><rect x='-200' y='0' width='800' height='1200' fill='#fff'/>" +
          avanti.map(function (l) { return "<path d='" + contornoBraccio(l, (agioBr[l] || 0) + 4, 1, 0, 0, 0.45) + "'/>"; }).join("") + "</mask>");
        xCollo.sopra = "<g mask='url(#" + idCm + ")'>" + xCollo.sopra + "</g>";
      }
    }
    var intero = /^(vestito|vestitolungo)$/.test(c.capo) && (A.RITOCCHI.vestito || !/^(leggings|jeans|pantaloni|strappati|zampa|tuta|cargo|mimetici)$/.test(c.sotto));   // l'abito copre gonne e pantaloncini (ritocco «vestito»: anche i pantaloni)
    var soloSu = !!(opts.busto || opts.viso);   // primo piano: gambe, pantaloni e scarpe non si vedono (non si disegnano: l'avatar pesa meno)
    var pSotto = intero || soloSu ? null : pezzoDi("sotto", c.sotto), sotto = pSotto ? chiama(pSotto, "sotto") : "";
    if (typeof sotto === "string") sotto = { corpo: sotto };
    var alte = /^(stivali|anfibi|pattini|stivaletti|stivalialti)$/.test(c.modScarpe);
    var pScarpe = soloSu ? null : pezzoDi("scarpe", c.modScarpe), scarpe = pScarpe ? pScarpe.fn(K) : "";
    if (typeof scarpe === "string") scarpe = { corpo: scarpe };

    // col cappello i capelli si vedono solo sotto la sua linea (coordinate della testa)
    function sottoCappello(sv) {
      if (!sv || !capp || capp.linea == null) return sv || "";
      return "<g clip-path='" + clip("M-200 " + capp.linea + "L200 " + capp.linea + "L200 400L-200 400Z") + "'>" + sv + "</g>";
    }

    // ---------- composizione ----------
    var vb = opts.busto ? "66 13 68 69.6" : (opts.vita ? "46 11 108 118" : (opts.gambe ? "40 110 120 146" : (opts.viso ? "82 14 36 36" : "0 0 200 264")));
    var px = opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * (opts.busto ? 182 / 178 : (opts.vita ? 118 / 108 : 1.32))) + "'" : "";
    var seduto = !!opts.seduto && !opts.busto && !opts.viso && !opts.gambe && PARTE !== "braccio" ? seduto : null;
    var body = "";
    // (terzo tempo) con le proporzioni nuove: in piedi il disegno si mette insieme a pezzi (PZ): «F» = a fasce (le gambe si accorciano:
    // corpo, vestiti, scarpe, mantello), «T» = solo spostato e ingrandito (braccia, mani, cose in mano, testa: non si schiacciano),
    // «0» = fermo (l animaletto a terra, che resta dentro il riquadro). Vita, busto e viso: tutto «T» (le gambe non si vedono).
    var PZ = PP && !seduto && PARTE !== "braccio" && !opts.vita && !soloSu ? [] : null;
    function metti(tipo, s) { if (!s) return; if (!PZ) { body += s; return; } var u = PZ[PZ.length - 1]; if (u && u[0] === tipo) u[1] += s; else PZ.push([tipo, s]); }
    var S4 = PP ? Math.round(PP.S * 10000) / 10000 : 1, sx0 = PP ? n1(200 * (1 - PP.S)) : 0, sy0 = PP ? 999 * (1 - PP.S) : 0;
    var matT = PP ? "matrix(" + S4 + " 0 0 " + S4 + " " + sx0 + " " + n1(sy0 + PP.S * PP.gambe) + ")" : "";
    var piedi = opts.busto || opts.viso ? "" : El(200, 996, 120, 13, soft("#000000", 0.38));
    if (PZ && xAni) metti("0", xAni);
    metti("F", piedi);
    if (!SPALLE) metti("F", xSch.dietro || "");
    if (!SPALLE) metti("F", (capo.dietro || "") + (xCollo.dietro || ""));
    if (!SPALLE) metti("F", "<g transform='" + HT + "'>" + sottoCappello(cap.dietro) + (capp && capp.dietro ? capp.dietro : "") + "</g>");
    if (SPALLE && scarpe.corpo) { var gT = gIn(938); scarpe.corpo = "<g clip-path='" + clip(["M" + n1(C - gT[0] - 30) + " 880H" + n1(C - gT[0] + 30) + "V1010H" + n1(C - gT[0] - 30) + "Z", "M" + n1(C + gT[0] - 30) + " 880H" + n1(C + gT[0] + 30) + "V1010H" + n1(C + gT[0] - 30) + "Z"]) + "'>" + scarpe.corpo + "</g>"; }
    var cam = opts.cammina && !opts.busto;
    if (PARTE === "braccio") {
      // (ritocchi) il vestito del braccio staccato: solo la manica (prima un contorno largo 46 prendeva anche un pezzo del busto intorno alla
      // spalla, spalline e scollo compresi: girando il braccio quel pezzo si spostava e si vedeva il salto). La spalla tonda resta un cerchio
      // intorno al perno: girando, la manica resta attaccata alla spalla del corpo. Senza maniche (canotta, top) niente vestito sul braccio.
      var zona = agioBr[LP] != null ? clip(contornoBraccio(LP, Math.max(14, agioBr[LP] + 10), 1, 30)) : null;
      var sB = pelleBraccio(LP) + (zona ? "<g clip-path='" + zona + "'>" + (capo.corpo || "") + "</g>" : "") + (BR[LP].davanti ? pelleAvanti(LP) : "") + (LP === 1 ? xOgg.dietro || "" : "") + manoSvg(LP) + (LP === 1 ? xOgg.davanti || "" : "");
      if (PP) sB = "<g transform='" + matT + "'>" + sB + "</g>";
      return fine("<svg xmlns='http://www.w3.org/2000/svg' stroke-linejoin='round' viewBox='0 0 200 264'" + (opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * 1.32) + "'" : "") + " class='omino omino-a omino-braccio'><defs>" + D.join("") + "</defs><g transform='matrix(.25 0 0 .25 50 2)'>" + sB + "</g></svg>");
    }
    if (PARTE === "corpo") opts = (function () { var o = {}; for (var k in opts) o[k] = opts[k]; o.senzaBraccio = LP; return o; })();
    if (seduto) return fine(seduto());
    metti("F", pelleCorpo(soloSu));
    if (!alte) metti("F", "<g class='om-scarpe'>" + (scarpe.corpo || "") + "</g>");
    metti("F", sotto.corpo || "");
    if (alte) metti("F", "<g class='om-scarpe'>" + (scarpe.corpo || "") + "</g>");
    if (sotto.sopra) metti("F", sotto.sopra);
    metti("T", xBor.sotto || ""); if (!PZ) body += xAni || "";
    var bS = function (lato) { return opts.senzaBraccio === lato ? "" : "<g class='" + (cam ? (lato === -1 ? "om-b1" : "om-b2") : "") + "'>" + pelleBraccio(lato) + "</g>"; };
    metti("T", bS(-1) + bS(1));
    metti("F", capo.corpo || "");
    // (terzo tempo) un braccio che passa DAVANTI al corpo (gesti, il microfono al petto) va sopra collane, sciarpe, tracolle e spallacci:
    // prima le mani lungo i fianchi, poi quello che sta sul petto, poi le braccia davanti con le loro mani e le cose in mano
    var manoDi = function (l) { return opts.senzaBraccio === l ? "" : (l === 1 ? (xOgg.dietro || "") + manoSvg(1) + (xOgg.davanti || "") : manoSvg(-1)); };
    var davanti = function (l) { return BR[l].davanti && !SPALLE; }, sulPetto = "";
    [-1, 1].forEach(function (l) { if (!davanti(l)) metti("T", manoDi(l)); });
    [-1, 1].forEach(function (l) { if (davanti(l) && opts.senzaBraccio !== l) sulPetto += pelleAvanti(l); });
    if (opts.gesto === "carte" && !SPALLE) sulPetto += ventaglio();
    [-1, 1].forEach(function (l) { if (davanti(l)) sulPetto += manoDi(l); });
    if (capo.sopra && !SPALLE) metti("F", capo.sopra);
    if (!SPALLE) metti("T", (xCollo.sopra || "") + (xSch.sopra || "") + (xBor.sopra || "") + sulPetto);
    else metti("F", (xSch.dietro || "") + (xCollo.spalle || xCollo.dietro || ""));   // di spalle lo zaino, le ali e il mantello stanno davanti; al collo la sciarpa vista da dietro
    if (SPALLE) {
      var pOreS = c.orecchini && c.orecchini !== "nessuno" ? A.orecchini[c.orecchini] : null;
      metti("T", "<g transform='" + HT + "'>" + testaDietro(sottoCappello(cap.fronte), sottoCappello(cap.dietro)) + (pOreS ? pOreS(K) : "") + (capp && capp.dietro ? capp.dietro : "") + (capp ? capp.svg || "" : "") + "</g>");
      return fine(avvolgi(fasce()));
    }
    // occhiali e orecchini (coordinate della testa): gli orecchini sotto i capelli, gli occhiali sopra i capelli e sotto il cappello
    var pOcc = c.occhiali && c.occhiali !== "nessuno" ? A.occhiali[c.occhiali] : null, pOre = c.orecchini && c.orecchini !== "nessuno" ? A.orecchini[c.orecchini] : null;
    metti("T", "<g transform='" + HT + "'>" + testa(cap.fronte, barba, cap.ombraFronte) + (pOre ? pOre(K) : "") + sottoCappello(cap.fronte) + (pOcc ? pOcc(K) : "") + (capp ? capp.svg || "" : "") + "</g>");
    if (A.extra.dopo) metti("T", A.extra.dopo(K));

    // (terzo tempo) le fasce si disegnano dal basso in alto; quella sopra finisce SFUMATA (5 unità) sopra quella sotto: un taglio netto
    // lasciava una riga sottile dove le gambe si accorciano (il bordo del ritaglio). Sotto ogni fascia, un ritaglio netto ma coperto.

    function sfuma(y) {
      var k = n1(y); if (sfumC[k]) return sfumC[k];
      var gid = p + "fg" + nM, mid = p + "fm" + nM; nM++;
      D.push("<linearGradient id='" + gid + "' gradientUnits='userSpaceOnUse' x1='0' y1='" + n1(y - 2.5) + "' x2='0' y2='" + n1(y + 2.5) + "'><stop stop-color='#fff'/><stop offset='1' stop-color='#000'/></linearGradient>" +
        "<mask id='" + mid + "' maskUnits='userSpaceOnUse' x='-400' y='-600' width='1200' height='2200'><rect x='-400' y='-600' width='1200' height='2200' fill='url(#" + gid + ")'/></mask>");
      return (sfumC[k] = "url(#" + mid + ")");
    }
    function fasciaNetta(y0, y1) { var k = y0 + "|" + y1; if (fasceC[k]) return fasceC[k]; var id = "c" + (nClip++); D.push("<clipPath id='" + p + id + "'><path d='M-400 " + n1(y0) + "H800V" + n1(y1) + "H-400Z'/></clipPath>"); return (fasceC[k] = "url(#" + p + id + ")"); }
    // i pezzi messi insieme: le fasce (il disegno una volta sola, usato tre volte: sopra le gambe solo spostato, le gambe schiacciate, i piedi fermi)
    function fasce() {
      // busto e viso (tondini, ritratti): la testa resta grande e al posto di prima (il riquadro è fatto per lei), il corpo sotto segue le proporzioni
      if (!PZ && PP && soloSu) { var ik2 = 1 / PP.testa; return "<g transform='matrix(" + n1(ik2 * 10000) / 10000 + " 0 0 " + n1(ik2 * 10000) / 10000 + " " + n1(200 - 200 * ik2) + " " + n1(214 - (214 + PP.collo) * ik2) + ")'>" + body + "</g>"; }
      if (!PZ) return PP ? "<g transform='" + matT + "'>" + body + "</g>" : body;
      var S = PP.S, Y1 = S * (PROP_L0 + PP.gambe) + sy0, Y2 = S * PROP_L1 + sy0, nF = 0;
      var fc = fasciaNetta;   // (dal basso in alto: le gambe sotto, il busto sopra)
      var bande = [[fc(Y2 - 4, 1600), "matrix(" + S4 + " 0 0 " + S4 + " " + sx0 + " " + n1(sy0) + ")"],
        [fc(Y1 - 4, 1600), "matrix(" + S4 + " 0 0 " + Math.round(S * PP.sL * 10000) / 10000 + " " + sx0 + " " + n1(sy0 + S * (PROP_L0 + PP.gambe - PROP_L0 * PP.sL)) + ")"],
        [null, matT]];
      var sf = [null, sfuma(Y2), sfuma(Y1)];
      var o = "";
      PZ.forEach(function (z) {
        if (z[0] === "0") { o += z[1]; return; }
        if (z[0] === "T") { o += "<g transform='" + matT + "'>" + z[1] + "</g>"; return; }
        var id = p + "fz" + (nF++); D.push("<g id='" + id + "'>" + z[1] + "</g>");
        bande.forEach(function (b, i) { var u = "<use href='#" + id + "' xlink:href='#" + id + "' transform='" + b[1] + "'/>"; if (sf[i]) u = "<g mask='" + sf[i] + "'>" + u + "</g>"; o += b[0] ? "<g clip-path='" + b[0] + "'>" + u + "</g>" : u; });
      });
      return o;
    }
    function avvolgi(b2) { return "<svg xmlns='http://www.w3.org/2000/svg' stroke-linejoin='round' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='" + vb + "'" + px + " class='omino omino-a'><defs>" + D.join("") + "</defs><g transform='matrix(.25 0 0 .25 50 2)'><g class='om-tutto'>" + b2 + "</g></g></svg>"; }
    // seduto: il corpo (pelle, pantaloni, scarpe, tronco del vestito) si disegna una volta e si usa 4 volte a fasce: busto spostato giù,
    // cosce e stinchi accorciati, piedi fermi a terra. Braccia, maniche, mani e testa solo spostati giù.
    // (terzo tempo) con le proporzioni nuove il busto si ingrandisce di S intorno al sedere (200, 784) e le gambe solo in larghezza
    function seduto() {
      var nB = "sd" + (cnt++), dy = SED.dy, ini = PARTE, ilp = LP;
      // (6 nov 2026) anche K.parte dice la passata giusta (il corpo, poi solo le braccia): un capo può lasciare fuori dalle braccia i dettagli del petto
      PARTE = "corpo"; LP = 0; K.parte = PARTE; var cC = pCapo ? (chiama(pCapo, "capo") || {}) : {}; if (typeof cC === "string") cC = { corpo: cC };
      PARTE = "braccio"; LP = 0; K.parte = PARTE; var cB = pCapo ? (chiama(pCapo, "capo") || {}) : {}; if (typeof cB === "string") cB = { corpo: cB };
      PARTE = ini; LP = ilp; K.parte = PARTE;
      var giu = pelleCorpo(false) + (!alte ? scarpe.corpo || "" : "") + (sotto.corpo || "") + (alte ? scarpe.corpo || "" : "") + (sotto.sopra || "") + (cC.corpo || "");
      D.push("<g id='" + p + nB + "'>" + giu + "</g>");
      var u = function (tr2) { return "<use href='#" + p + nB + "' xlink:href='#" + p + nB + "' transform='" + tr2 + "'/>"; };
      var fascia = PP ? function (y0, y1) { return fasciaNetta(n1(y0), n1(y1)); } : function (y0, y1) { return clip("M-200 " + n1(y0) + "H600V" + n1(y1) + "H-200Z"); };
      var trSu = PP ? "matrix(" + S4 + " 0 0 " + S4 + " " + sx0 + " " + n1(SED.yA - PP.S * SED.yAB) + ")" : "translate(0 " + dy + ")";
      var o = piedi + (xAni || "");
      if (!SPALLE) o += "<g transform='" + trSu + "'>" + (xSch.dietro || "") + (capo.dietro || "") + (xCollo.dietro || "") + "<g transform='" + HT + "'>" + sottoCappello(cap.dietro) + (capp && capp.dietro ? capp.dietro : "") + "</g></g>";
      var kx = PP ? S4 : SED.kx, tx = PP ? sx0 : n1(200 * (1 - kx)), sf = [];
      var mk = function (y, x) { return "<g mask='" + sfuma(y) + "'>" + x + "</g>"; };   // (anche com'era: niente riga dove le fasce si toccano)
      sf.push(mk(SED.yA, u(trSu)));
      sf.push("<g clip-path='" + fascia(SED.yA - 4, 1400) + "'>" + mk(SED.yK, u("matrix(" + kx + " 0 0 " + SED.sB + " " + tx + " " + n1(SED.yA - SED.yAB * SED.sB) + ")")) + "</g>");
      sf.push("<g clip-path='" + fascia(SED.yK - 4, 1400) + "'>" + mk(SED.yCD, u("matrix(" + kx + " 0 0 " + n1(SED.sC * 1000) / 1000 + " " + tx + " " + n1(SED.yK - SED.yBC * SED.sC) + ")")) + "</g>");
      sf.push("<g clip-path='" + fascia(SED.yCD - 4, 1400) + "'>" + u("matrix(" + kx + " 0 0 1 " + tx + " 0)") + "</g>");
      o += sf.reverse().join("");   // dal basso in alto: ogni fascia copre sfumando quella sotto
      // il grembo: ombra sotto la pancia, luce sopra le ginocchia, ombra sotto (gli stinchi vanno indietro)
      var gK = gIn(748);
      o += El(C, SED.yA + 5, B.hp * 0.95 * kx, 8, soft("#000000", 0.24));
      // (g5) più morbide: prima l ombra sotto il ginocchio, più larga della gamba, faceva le ginocchia «a bolla»
      [-1, 1].forEach(function (l) { var kx2 = C + l * (gK[0] + (gK[1] - gK[2]) / 2) * kx, kw = (gK[1] + gK[2]) / 2 * kx; o += El(kx2 - 3, SED.yK - 12, kw * 0.7, 9, soft("#ffffff", 0.16)) + El(kx2 + l * 2, SED.yK + 9, kw * 0.85, 8, soft("#000000", 0.22)); });
      var su = xBor.sotto || "";
      [-1, 1].forEach(function (l) { if (opts.senzaBraccio !== l) su += pelleBraccio(l); });
      su += cB.corpo || "";
      var cravPrima = colloDopo && !SPALLE;   // (ritocco «cravatta») come in piedi: la cravatta sopra il vestito e sotto le braccia e le mani davanti
      if (cravPrima) su += (cC.sopra || "") + (xCollo.sopra || "");
      [-1, 1].forEach(function (l) { if (BR[l].davanti && opts.senzaBraccio !== l && !SPALLE) su += pelleAvanti(l); });
      su += (opts.senzaBraccio === -1 ? "" : manoSvg(-1)) + (opts.senzaBraccio === 1 ? "" : (xOgg.dietro || "") + manoSvg(1) + (xOgg.davanti || ""));
      if (!cravPrima) su += cC.sopra || "";
      su += SPALLE ? xSch.dietro || "" : (cravPrima ? "" : xCollo.sopra || "") + (xSch.sopra || "") + (xBor.sopra || "");
      var pOcc2 = c.occhiali && c.occhiali !== "nessuno" ? A.occhiali[c.occhiali] : null, pOre2 = c.orecchini && c.orecchini !== "nessuno" ? A.orecchini[c.orecchini] : null;
      su += "<g transform='" + HT + "'>" + (SPALLE ? testaDietro(sottoCappello(cap.fronte), sottoCappello(cap.dietro)) + (pOre2 ? pOre2(K) : "") + (capp && capp.dietro ? capp.dietro : "") + (capp ? capp.svg || "" : "")
        : testa(cap.fronte, barba, cap.ombraFronte) + (pOre2 ? pOre2(K) : "") + sottoCappello(cap.fronte) + (pOcc2 ? pOcc2(K) : "") + (capp ? capp.svg || "" : "")) + "</g>";
      if (A.extra.dopo) su += A.extra.dopo(K);
      return avvolgi(o + "<g transform='" + trSu + "'>" + su + "</g>");
    }
    // inquadrature (coordinate del riquadro 200×264)
    var passo = "";
    if (cam) {
      var jx = BR["-1"].J, jv = PP ? vistaSu(PP, false)(jx[0], jx[1]) : jx;
      passo = "<style>.om-b1{transform-origin:" + n1(jv[0] * 0.25 + 50) + "px " + n1(jv[1] * 0.25 + 2) + "px;animation:omBr .42s ease-in-out infinite alternate}" +
        ".om-b2{transform-origin:" + n1(400 - jv[0]) * 0.25 + 50 + "px " + n1(jv[1] * 0.25 + 2) + "px;animation:omBr .42s ease-in-out infinite alternate-reverse}@keyframes omBr{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}</style>";
    }
    body = fasce();
    return fine("<svg xmlns='http://www.w3.org/2000/svg' stroke-linejoin='round'" + (PZ ? " xmlns:xlink='http://www.w3.org/1999/xlink'" : "") + " viewBox='" + vb + "'" + px + " class='omino omino-a'>" + passo + "<defs>" + D.join("") + "</defs><g transform='matrix(.25 0 0 .25 50 2)'><g class='om-tutto'>" + body + "</g></g></svg>");
  };

  // dove sta la mano a destra nel disegno (coordinate 200×264): per la canna il centro del pugno
  // dove sta la spalla (perno del braccio) nel riquadro 200×264
  A.perno = function (c, opts) {
    var G = A.geometria(c, opts || {}), J = G.BR[(opts && opts.latoParte === -1) ? "-1" : "1"].J;
    if (G.P) J = vistaSu(G.P, false)(J[0], J[1]);   // (il braccio staccato è sempre in piedi)
    return { x: +(J[0] * 0.25 + 50).toFixed(2), y: +(J[1] * 0.25 + 2).toFixed(2) };
  };
  A.mano = function (c, opts) {
    opts = opts || {};
    var G = A.geometria(c, opts), b = G.BR["1"], d = [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2], k = opts.braccia === "canna" ? 20 : 16;
    if (G.P) { var v = G.vedi([b.W[0] + d[0] * k, b.W[1] + d[1] * k]); return { x: +v[0].toFixed(2), y: +v[1].toFixed(2) }; }
    var sy = opts.seduto && !opts.busto ? SED.dy : 0;
    return { x: +((b.W[0] + d[0] * k) * 0.25 + 50).toFixed(2), y: +((b.W[1] + d[1] * k + sy) * 0.25 + 2).toFixed(2) };
  };

  // =========================================================
  //  I PEZZI DI BASE (dalla prova A che il proprietario ha visto)
  // =========================================================
  // ---- bocche: neutra e sorriso (le altre nei pezzi) ----
  A.pezzo("bocca", "neutro", function (K) {
    var lip = K.labbro, mw = K.m ? 15 : 14.5, s = "";
    s += K.St("M-4 -36C-4 -33 -3.5 -31 -3 -30", K.skDD, 1, 0.22) + K.St("M4 -36C4 -33 3.5 -31 3 -30", K.skDD, 1, 0.22);
    s += K.Pa("M-" + mw + " -24.2C-9 -30 -4.5 -32 0 -29.6C4.5 -32 9 -30 " + mw + " -24.2C8 -22.6 -8 -22.6 -" + mw + " -24.2Z", K.mix(lip, "#000000", 0.12));
    s += K.Pa("M-" + (mw - 2) + " -23.4C-6 -21.2 6 -21.2 " + (mw - 2) + " -23.4C10 -14 -10 -14 -" + (mw - 2) + " -23.4Z", lip);
    s += K.El(-1, -18.8, 5.5, 1.6, "#ffffff", " opacity='" + (K.rossetto && K.c.rossetto === "lucido" ? 0.75 : (K.m ? 0.22 : 0.45)) + "'");
    s += K.St("M-" + (mw + 0.5) + " -24.6C-6 -22.2 6 -22.2 " + (mw + 0.5) + " -24.6", K.mix(lip, "#2a0c0a", 0.62), 1.2);
    s += K.St("M" + (mw + 0.5) + " -24.6C" + (mw + 2) + " -26 " + (mw + 2.6) + " -26.6 " + (mw + 3) + " -27", K.skDD, 1, 0.45) + K.St("M-" + (mw + 0.5) + " -24.6C-" + (mw + 2) + " -26 -" + (mw + 2.6) + " -26.6 -" + (mw + 3) + " -27", K.skDD, 1, 0.45);
    s += K.El(0, -10.6, 9, 2.6, K.soft(K.skDD, 0.3));
    return s;
  });
  A.pezzo("bocca", "sorriso", function (K) {
    var lip = K.labbro, mw = K.m ? 16 : 15.5, s = "";
    s += K.St("M-4 -36C-4 -33 -3.5 -31 -3 -30", K.skDD, 1, 0.22) + K.St("M4 -36C4 -33 3.5 -31 3 -30", K.skDD, 1, 0.22);
    s += K.Pa("M-" + mw + " -27C-9 -30.5 -4.5 -32 0 -30C4.5 -32 9 -30.5 " + mw + " -27C8 -23.5 -8 -23.5 -" + mw + " -27Z", K.mix(lip, "#000000", 0.12));
    s += K.Pa("M-" + (mw - 1.5) + " -25.6C-6 -22.6 6 -22.6 " + (mw - 1.5) + " -25.6C10 -15 -10 -15 -" + (mw - 1.5) + " -25.6Z", lip);
    s += K.El(-1, -19.2, 5.5, 1.5, "#ffffff", " opacity='" + (K.rossetto && K.c.rossetto === "lucido" ? 0.75 : (K.m ? 0.22 : 0.45)) + "'");
    s += K.St("M-" + (mw + 1) + " -27.6C-8 -22.6 8 -22.6 " + (mw + 1) + " -27.6", K.mix(lip, "#2a0c0a", 0.62), 1.3);
    s += K.St("M" + (mw + 1) + " -27.6C" + (mw + 3) + " -29.4 " + (mw + 4) + " -30.6 " + (mw + 4.4) + " -31.6", K.skDD, 1.1, 0.5) + K.St("M-" + (mw + 1) + " -27.6C-" + (mw + 3) + " -29.4 -" + (mw + 4) + " -30.6 -" + (mw + 4.4) + " -31.6", K.skDD, 1.1, 0.5);
    s += K.St("M" + (mw + 8) + " -44C" + (mw + 11) + " -36 " + (mw + 10) + " -30 " + (mw + 7) + " -25", K.skD, 1.6, 0.25) + K.St("M-" + (mw + 8) + " -44C-" + (mw + 11) + " -36 -" + (mw + 10) + " -30 -" + (mw + 7) + " -25", K.skD, 1.6, 0.22);
    s += K.El(0, -10.6, 9, 2.6, K.soft(K.skDD, 0.3));
    return s;
  });
  // ---- barba di un giorno ----
  A.pezzo("barba", "accenno", function (K) {
    var hDD = K.hDD;
    var clipB = K.clip("M-62 -66L-46 -62C-36 -53 -25 -46 -13 -46C-6 -49 6 -49 13 -46C25 -46 36 -53 46 -62L62 -66L62 10L-62 10Z");
    var R = K.rnd(7), d = "";
    for (var i = 0; i < 380; i++) { var x = (R() * 2 - 1) * 56, y = -60 + Math.pow(R(), 0.55) * 66; d += "M" + K.n1(x) + " " + K.n1(y) + "h.2"; }
    return { dentro: "<g clip-path='" + clipB + "'><rect x='-60' y='-70' width='120' height='80' fill='" + K.LG("bdg", 0, 0, 0, 1, [[0, hDD, 0], [0.3, hDD, 0.12], [0.6, hDD, 0.24], [1, hDD, 0.36]]) + "'/>" +
      "<path d='" + d + "' stroke='" + hDD + "' stroke-width='1.25' stroke-linecap='round' opacity='.4' fill='none'/></g>" };
  });
  // ---- capelli: corti col ciuffo (uomo) e lunghi mossi (donna) ----
  A.pezzo("capelli", "corti", function (K) {
    var s = K.Pa("M-55 -84C-66 -118 -58 -160 -22 -171C8 -181 46 -174 60 -148C68 -128 62 -104 56 -84L53 -100C44 -118 22 -128 -2 -126C-26 -125 -44 -114 -53 -98Z", K.U("hg3"));
    s += "<g clip-path='" + K.clip("M-55 -84C-66 -118 -58 -160 -22 -171C8 -181 46 -174 60 -148C68 -128 62 -104 56 -84L53 -100C44 -118 22 -128 -2 -126C-26 -125 -44 -114 -53 -98Z") + "'>";
    s += K.ciocche([
      [[-50, -98, 14], [-55, -128, 18], [-42, -156, 16], [-14, -170, 10], [14, -174, 2]],
      [[-38, -114, 14], [-38, -142, 18], [-18, -162, 16], [14, -173, 10], [42, -170, 2]],
      [[-20, -122, 14], [-12, -146, 18], [8, -164, 16], [34, -172, 10], [58, -160, 2]],
      [[2, -124, 14], [12, -146, 18], [30, -160, 14], [52, -161, 8], [64, -148, 2]],
      [[26, -120, 12], [40, -134, 14], [55, -144, 10], [64, -132, 2]],
      [[-8, -128, 6], [4, -144, 6], [18, -154, 4], [30, -158, 1]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1", "hg1"]) + "</g>";
    s += K.Pa(K.limb([[51, -106, 9], [56, -98, 9], [56, -82, 5]]), K.U("hg2")) + K.Pa(K.limb([[-51, -106, 9], [-56, -98, 9], [-56, -82, 5]]), K.U("hg2"));
    return { fronte: s };
  });
  A.pezzo("capelli", "lunghi", function (K) {
    var back = "M-58 -92C-76 -40 -86 30 -90 90C-93 124 -88 146 -80 158C-70 166 -62 152 -50 160C-34 166 -22 150 0 154C22 150 34 166 50 160C62 152 70 166 80 158C88 146 93 124 90 90C86 30 76 -40 58 -92C48 -150 -52 -150 -58 -92Z";
    var dietro = K.Pa(back, K.U("hg3")) + K.Pa("M-70 20C-72 70 -76 110 -74 150C-60 160 -52 152 -40 158L-40 40Z", K.hD, " opacity='.45'");
    var s = K.Pa("M-57 -80C-68 -130 -50 -170 -6 -174C42 -178 68 -140 60 -84L56 -96C48 -118 30 -134 -12 -142C-36 -128 -50 -112 -54 -92Z", K.U("hg3"));
    var LA = [[-14, -150, 8], [-34, -148, 16], [-50, -128, 20], [-57, -98, 22], [-60, -60, 24], [-66, -14, 26], [-60, 34, 28], [-70, 84, 26], [-62, 126, 20], [-70, 160, 10], [-66, 176, 3]];
    var LB = [[-16, -156, 8], [-32, -162, 14], [-52, -150, 20], [-64, -122, 22], [-68, -84, 24], [-72, -30, 26], [-80, 26, 28], [-70, 84, 26], [-82, 130, 20], [-72, 162, 10], [-78, 178, 3]];
    var RA = [[-12, -152, 8], [10, -154, 16], [36, -144, 20], [52, -122, 22], [58, -96, 16], [60, -84, 6]];
    var RB = [[54, -112, 12], [70, -86, 18], [76, -34, 22], [70, 18, 26], [78, 70, 28], [68, 120, 22], [76, 160, 10], [72, 176, 3]];
    var RC = [[56, -104, 8], [76, -70, 14], [82, -20, 18], [76, 40, 22], [86, 100, 18], [78, 150, 8], [84, 172, 2]];
    s += K.ciocche([LB, LA, RC, RB, RA, [[-12, -152, 8], [-26, -170, 14], [-46, -164, 16], [-62, -140, 12]]], ["hg2", "hg1", "hg2", "hg1", "hg2", "hg1"]);
    return { dietro: dietro, fronte: s };
  });
  // ---- vestiti: maglietta e maniche lunghe; jeans; sneakers ----
  function maglia(K, lung) {
    var mg = K.maglia, mdd = K.scuro(mg, 0.5), C = K.C, B = K.B, Y = K.Y, ea = lung < 0.5 ? 10 : 7;
    // la stoffa è la sagoma del corpo allargata: tronco + maniche colorati insieme (K.dipingi), niente giunture alla spalla
    var T = K.busto({ agio: 6, orlo: 512, scollo: { prof: 18, larg: 4 }, pancia: B.pancia ? 6 : 0 });
    var br = [-1, 1].map(function (l) { return { d: K.manica(l, { lung: lung, agio: ea }), lato: l, fino: lung, e: ea }; });
    var p = K.El(C - 40, Y.petto - 30, 30, 40, K.soft("#ffffff", 0.16)) + K.El(C, 272, 40, 14, K.soft(mdd, 0.3));
    if (K.donna) { var bs = B.seno || 1; p += K.El(C - 22 * bs, Y.petto + 24 * bs, 30 * bs, 8, K.soft(mdd, 0.2)) + K.El(C + 22 * bs, Y.petto + 24 * bs, 30 * bs, 8, K.soft(mdd, 0.24)) + K.El(C - 26 * bs, Y.petto - 2, 20 * bs, 15 * bs, K.soft("#ffffff", 0.16)); }
    if (B.pancia) p += K.St("M" + (C - B.wt + 10) + " " + (Y.vita + 26) + "C" + (C - 30) + " " + (Y.vita + 44) + " " + (C + 30) + " " + (Y.vita + 44) + " " + (C + B.wt - 10) + " " + (Y.vita + 26), mdd, 4, 0.25);
    p += K.St("M" + (C - B.wt + 4) + " 470C" + (C - B.wt + 24) + " 478 " + (C - B.wt + 44) + " 472 " + (C - B.wt + 64) + " 482", mdd, 5, 0.13);
    p += K.St("M" + (C + B.wt - 6) + " 442C" + (C + B.wt - 26) + " 454 " + (C + B.wt - 40) + " 452 " + (C + B.wt - 62) + " 464", mdd, 4, 0.15);
    p += K.St("M" + (C - 24) + " 420C" + (C - 12) + " 440 " + (C - 10) + " 470 " + (C - 18) + " 498", mdd, 4, 0.1);
    p += K.St("M" + (C - B.hp + 2) + " 502C" + (C - 20) + " 510 " + (C + 20) + " 510 " + (C + B.hp - 2) + " 502", mdd, 2, 0.35);
    // le pieghe dove la manica si attacca (ombra morbida sotto la spalla)
    [-1, 1].forEach(function (l) { var J = K.BR[l].J; p += K.El(J[0] + l * 4, J[1] + K.rc + 10, 14, 20, K.soft(mdd, 0.22)); });
    var V = K.dipingi({ tronco: [T], braccia: br }, mg, { dentro: p });
    var s = V.svg;
    // l orlo delle maniche e lo scollo a costine
    [-1, 1].forEach(function (lato) {
      var f = K.fineManica(lato, lung), w = (f.w + ea) * 0.5 - 1.5;
      s += K.suManica(lato, K.St("M" + K.n1(f.x - f.dy * w - f.dx * 6) + " " + K.n1(f.y + f.dx * w - f.dy * 6) + "L" + K.n1(f.x + f.dy * w - f.dx * 6) + " " + K.n1(f.y - f.dx * w - f.dy * 6), mdd, 1.4, 0.4));   // (giro3) suManica: nel corpo senza quel braccio restava una riga per aria
    });
    var nk = B.nk, m2 = K.maglia2;   // (tappa 3) col secondo colore: il collo e le fasce delle maniche (anche corte: la maglietta «ringer»)
    s += K.St("M" + (C - nk - 5) + " 241C" + (C - nk + 2) + " 263 " + (C + nk - 2) + " 263 " + (C + nk + 5) + " 241", m2 ? K.mix(m2, "#000000", 0.08) : K.mix(mg, "#000000", 0.22), 7, 0.95);
    s += K.St("M" + (C - nk - 3) + " 238C" + (C - nk + 4) + " 259 " + (C + nk - 4) + " 259 " + (C + nk + 3) + " 238", K.chiaro(m2 || mg, 0.35), 1.8, 0.45);
    if (lung > 0.9 || m2) [-1, 1].forEach(function (lato) { var f = K.fineManica(lato, lung); s += K.suManica(lato, K.Pa(K.limb([[f.x - f.dx * 14, f.y - f.dy * 14, f.w + ea * 0.8], [f.x, f.y, f.w + ea * 0.75]]), m2 ? K.cil(m2, 0.7) : K.scuro(mg, 0.15), " opacity='.9'")); });
    if (m2 && K.spalle) K.dietro2 = { collo: 1, pol: 14 };
    // la stampa sulla maglia (solo sul tronco)
    var st = A.stampa[K.c.stampa]; if (st) s += "<g clip-path='" + K.clip(T) + "'>" + st(K, T) + "</g>";
    return { corpo: s };
  }
  A.pezzo("capo", "maglietta", function (K) { return maglia(K, 0.3); });
  A.pezzo("capo", "lunga", function (K) { return maglia(K, 1); });
  A.maglia = maglia;   // per i pezzi che partono da una maglietta
  function jeans(K, classici) {
    var jn = K.pantaloni, jl = K.chiaro(jn, K.m ? 0.2 : 0.26), jd = K.scuro(jn, 0.38), C = K.C, B = K.B;
    var x0 = C - B.hp - 10, x1 = C + B.hp + 10;
    var jg = K.LG("jg", x0, 0, x1, 0, [[0, jl], [0.45, jn], [1, K.mix(jn, jd, 0.7)]], true);
    var Ln = K.gamba(-1, { agio: 7, agioI: 5, da: 548, a: 944, dritto: 760, orlo: 944, orloL: classici ? 30 : 27, segue: true });
    var Rn = K.gamba(1, { agio: 7, agioI: 5, da: 548, a: 944, dritto: 760, orlo: 944, orloL: classici ? 30 : 27, segue: true });
    var wp = K.bacino({ agio: 5 });
    var s = K.Pa(Ln, jg) + K.Pa(Rn, jg) + K.Pa(wp, jg);
    s += "<g clip-path='" + K.clip([Ln, Rn, wp]) + "'>";
    s += "<rect x='198' y='575' width='4' height='130' fill='" + K.LG("cr", 0, 0, 0, 1, [[0, "#000000", 0.45], [1, "#000000", 0]]) + "'/>";
    s += K.El(200, 588, 22, 26, K.soft("#000000", 0.4));
    [-1, 1].forEach(function (l) {
      var g = K.gIn(700), cx = C + l * g[0];
      s += K.El(cx - l * 4 - g[1] * 0.3, 700, 15, 150, K.soft("#ffffff", K.m ? 0.2 : 0.24)) + K.El(cx + g[1] * 0.8, 720, 12, 190, K.soft("#000000", 0.3)) + K.El(cx - g[2] * 0.85, 700, 8, 170, K.soft("#000000", 0.26));
      var k = K.gIn(748), kx = C + l * k[0];
      s += K.St("M" + (kx - 26) + " 742C" + (kx - 12) + " 750 " + (kx + 10) + " 750 " + (kx + 24) + " 740", jd, 3, 0.25) + K.St("M" + (kx - 22) + " 754C" + (kx - 10) + " 760 " + (kx + 10) + " 760 " + (kx + 22) + " 752", jl, 1.5, 0.22);
      if (!classici) s += K.St("M" + (kx - 26) + " 908C" + (kx - 12) + " 916 " + (kx + 10) + " 918 " + (kx + 26) + " 908", jd, 3, 0.28) + K.St("M" + (kx - 24) + " 924C" + (kx - 10) + " 930 " + (kx + 10) + " 930 " + (kx + 24) + " 922", jd, 2.4, 0.3);
      s += K.St("M" + (cx - l * 3) + " 606C" + (cx + 8 * l) + " 612 " + (cx + 22 * l) + " 610 " + (cx + 32 * l) + " 602", jd, 3, 0.2);
    });
    var st = " stroke-dasharray='3.5 3'", scu = classici ? K.scuro(jn, 0.2) : K.mix(jn, "#e8c070", 0.75);
    var wl = C - B.wt - 5, wr = C + B.wt + 5, v = K.m ? 456 : 448;
    if (!classici) {
      s += K.St("M" + (wl + 2) + " " + (v + 4) + "C" + (wl + 8) + " " + (v + 42) + " " + (wl + 24) + " " + (v + 58) + " " + (wl + 46) + " " + (v + 64), scu, 1.1, 0.8, st) + K.St("M" + (wr - 2) + " " + (v + 4) + "C" + (wr - 8) + " " + (v + 42) + " " + (wr - 24) + " " + (v + 58) + " " + (wr - 46) + " " + (v + 64), scu, 1.1, 0.8, st);
      s += K.St("M205 " + (v + 12) + "L205 " + (v + 62) + "C205 " + (v + 68) + " 198 " + (v + 70) + " 193 " + (v + 66), scu, 1.1, 0.8, st);
      [-1, 1].forEach(function (l) { var g = K.gIn(760); s += K.St("M" + K.n1(C + l * (g[0] + g[1] + 2)) + " 620L" + K.n1(C + l * (g[0] + 26)) + " 930", scu, 1, 0.4, st); });
    } else {
      [-1, 1].forEach(function (l) { var g = K.gIn(700); s += K.St("M" + K.n1(C + l * g[0]) + " 590L" + K.n1(C + l * (g[0] + 1)) + " 930", K.chiaro(jn, 0.25), 1.6, 0.35) + K.St("M" + K.n1(C + l * (g[0] + 2)) + " 590L" + K.n1(C + l * (g[0] + 3)) + " 930", jd, 1.4, 0.3); });
      s += K.St("M" + (wl + 6) + " " + (v + 12) + "C" + (wl + 14) + " " + (v + 40) + " " + (wl + 18) + " " + (v + 50) + " " + (wl + 22) + " " + (v + 60), jd, 1.4, 0.45) + K.St("M" + (wr - 6) + " " + (v + 12) + "C" + (wr - 14) + " " + (v + 40) + " " + (wr - 18) + " " + (v + 50) + " " + (wr - 22) + " " + (v + 60), jd, 1.4, 0.45);
    }
    s += K.Pa("M" + wl + " " + v + "L" + wr + " " + v + "L" + (wr + 1) + " " + (v + 16) + "L" + (wl - 1) + " " + (v + 16) + "Z", K.mix(jn, "#000000", 0.18), " opacity='.55'");
    s += K.St("M" + wl + " " + (v + 16) + "L" + wr + " " + (v + 16), scu, 1, 0.7, classici ? "" : st);
    [wl + 14, wr - 14, C - 16, C + 16].forEach(function (b) { s += "<rect x='" + (b - 3) + "' y='" + v + "' width='6' height='20' rx='1.5' fill='" + K.mix(jn, "#000000", 0.2) + "' opacity='.55'/>"; });
    s += "</g>";
    if (!classici) s += "<circle cx='200' cy='" + (v + 13) + "' r='4.4' fill='#c9ccd2' stroke='#6e7078' stroke-width='1'/><circle cx='199' cy='" + (v + 12) + "' r='1.5' fill='#ffffff' opacity='.8'/>";
    else s += K.Pa("M196 " + (v + 4) + "h8v14h-8z", K.mix(jn, "#000", 0.3), " opacity='.6'");
    return s;
  }
  A.pezzo("sotto", "jeans", function (K) { return jeans(K, false); });
  A.pezzo("sotto", "pantaloni", function (K) { return jeans(K, true); });
  A.pantaloni = jeans;
  A.pezzo("scarpe", "sneakers", function (K) {
    var sc = K.scarpe, s = "";
    var sl = K.LG("shoe", 0, 0, 1, 1, [[0, K.chiaro(sc, 0.5)], [0.5, sc], [1, K.scuro(sc, 0.25)]]);
    var so = K.LG("sole", 0, 0, 0, 1, [[0, "#f6f6f2"], [0.6, "#dcdcd8"], [1, "#a4a4a1"]]);
    var sd = "M140 926L190 926C193 944 196 954 204 962C210 970 209 984 200 988L150 990C130 990 116 986 114 976C113 966 124 960 136 958C142 954 142 940 140 926Z";
    var cs = K.clip(sd);
    var lacci = K.lum(sc) > 0.7 ? "#8c8c8a" : "#ffffff";
    var one = K.Pa(sd, sl) + "<g clip-path='" + cs + "'>" + K.El(196, 960, 16, 34, K.soft("#000000", 0.22)) + K.El(130, 972, 16, 10, K.soft("#ffffff", 0.5)) + "</g>" +
      K.Pa("M142 927C150 935 182 935 190 927C190 931 184 937 166 937C148 937 142 931 142 927Z", K.scuro(sc, 0.4), " opacity='.55'") +
      K.St("M118 980C120 970 132 964 144 966C150 968 152 976 150 989", K.scuro(sc, 0.25), 1.3, 0.75) +
      K.St("M147 941L174 948M145 948L178 955M145 955L181 962", lacci, 1.6, 0.9) +
      K.St("M190 944C198 951 203 960 205 972", K.scuro(sc, 0.3), 3, 0.45) +
      K.Pa("M114 978C112 991 124 999 146 999L200 999C212 999 214 988 208 979C206 985 202 989 196 989L148 991C130 991 118 987 114 978Z", so);
    return A.duePiedi(K, one);
  });
  // ---- le stampe sulla maglia (dentro il ritaglio del busto: si piegano coi volumi della maglia) ----
  function inchiostro(K) { return K.lum(K.maglia) > 0.6 ? K.scuro(K.maglia, 0.55) : K.chiaro(K.maglia, 0.8); }
  A.pezzo("stampa", "righe", function (K) { var s = "", col = inchiostro(K); for (var y = 262; y < 560; y += 26) s += "<rect x='60' y='" + y + "' width='280' height='11' fill='" + col + "' opacity='.75'/>"; return s; });
  A.pezzo("stampa", "pois", function (K) { var s = "", col = inchiostro(K); for (var y = 270, r = 0; y < 560; y += 24, r++) for (var x = 70 + (r % 2) * 12; x < 340; x += 24) s += "<circle cx='" + x + "' cy='" + y + "' r='4.6' fill='" + col + "' opacity='.8'/>"; return s; });
  A.pezzo("stampa", "quadri", function (K) { var s = "", col = inchiostro(K); for (var y = 250; y < 560; y += 30) s += "<rect x='60' y='" + y + "' width='280' height='12' fill='" + col + "' opacity='.35'/>"; for (var x = 64; x < 340; x += 30) s += "<rect x='" + x + "' y='240' width='12' height='330' fill='" + col + "' opacity='.35'/>"; return s; });
  function alPetto(K, d, col) { return "<g transform='translate(" + K.C + " " + (K.Y.petto + 14) + ") scale(1.55)'>" + K.Pa(d, col, " opacity='.92'") + "</g>"; }
  A.pezzo("stampa", "stella", function (K) { return alPetto(K, "M0 -26L7.6 -9.5 25.6 -8.3 11.8 3.6 16 21.2 0 11.6 -16 21.2 -11.8 3.6 -25.6 -8.3 -7.6 -9.5Z", inchiostro(K)); });
  A.pezzo("stampa", "cuore", function (K) { return alPetto(K, "M0 20C-6 14 -26 2 -26 -10C-26 -20 -18 -26 -10 -26C-5 -26 -2 -23 0 -19C2 -23 5 -26 10 -26C18 -26 26 -20 26 -10C26 2 6 14 0 20Z", K.lum(K.maglia) > 0.6 ? "#e03158" : inchiostro(K)); });
  A.pezzo("stampa", "fulmine", function (K) { return alPetto(K, "M6 -28L-14 4H-1L-8 28L16 -6H3L12 -28Z", K.lum(K.maglia) > 0.6 ? "#f5b80f" : inchiostro(K)); });
  A.pezzo("stampa", "numero", function (K) { return "<text x='" + K.C + "' y='" + (K.Y.petto + 30) + "' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='58' fill='" + inchiostro(K) + "' opacity='.92'>10</text>"; });
  // due scarpe disegnate di lato (tacco a sinistra x 114, caviglia x 140-190, punta a destra x 210, suola a y 999):
  // messe sotto le caviglie con la punta un po' in fuori e accorciate (si vedono di tre quarti)
  A.duePiedi = function (K, one) {
    var gl = K.gIn(938), s = "";
    [-1, 1].forEach(function (l) { s += "<g transform='translate(" + K.n1(K.C + l * (gl[0] + 3)) + " 935) rotate(" + (l * 8) + ") scale(" + (l * 0.6) + " 1.04) translate(-163 -935)'>" + one + "</g>"; });
    return s;
  };
  // ---- il cappellino (dalla prova A) ----
  A.pezzo("cappelli", "cappellino", function (K) {
    var capC = K.acc, cl = K.mix(capC, "#ffffff", 0.3), cd = K.mix(capC, "#000000", 0.45);
    var cp = K.LG("cp", 0.05, 0, 0.95, 1, [[0, cl], [0.38, capC], [1, cd]]), cb = K.LG("cb", 0, 0, 0, 1, [[0, cl], [0.55, capC], [1, K.mix(capC, "#000000", 0.22)]]);
    var s = "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(0, -92, 50, 12, K.soft("#000000", 0.5)) + "</g><g transform='translate(0 -16)'>";
    var dome = "M-58 -104C-60 -134 -42 -160 0 -162C42 -160 60 -134 58 -104C38 -98 -38 -98 -58 -104Z";
    s += K.Pa(dome, cp) + "<g clip-path='" + K.clip(dome) + "'>";
    s += K.St("M0 -162L0 -96", cd, 1.5, 0.5) + K.St("M-2 -167C-20 -152 -32 -128 -34 -98", cd, 1.4, 0.5) + K.St("M2 -167C20 -152 32 -128 34 -98", cd, 1.4, 0.5);
    s += K.St("M-26 -148C-34 -156 -28 -162 -12 -164", "#ffffff", 6, 0.25) + K.El(32, -132, 22, 46, K.soft("#000000", 0.35)) + "</g>";
    s += "<circle cx='0' cy='-162' r='4.4' fill='" + cp + "'/>" + K.St("M-56 -101C-36 -95 36 -95 56 -101", cl, 0.9, 0.55, " stroke-dasharray='2.4 2.4'");
    var brim = "M-58 -104C-36 -97 36 -97 58 -104C70 -100 72 -88 54 -84C26 -74 -26 -74 -54 -84C-72 -88 -70 -100 -58 -104Z";
    s += K.Pa(brim, cb) + "<g clip-path='" + K.clip(brim) + "'>" + K.El(36, -90, 40, 10, K.soft("#000000", 0.35)) + K.Pa("M-54 -84C-26 -74 26 -74 54 -84C54 -81 26 -69 0 -69C-26 -69 -54 -81 -54 -84Z", cd, " opacity='.8'") + "</g>";
    s += K.St("M-52 -88C-26 -80 26 -80 52 -88", cl, 0.9, 0.6, " stroke-dasharray='2.4 2.4'");
    return { linea: -112, svg: s + "</g>" };
  });
})();
