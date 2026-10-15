/* =========================================================
   GIOCO — "Scarabocchio" (disegna e indovina, tipo Pinturillo)
   A turno uno disegna una parola segreta (sceglie tra 3) sulla
   lavagna; gli altri la vedono comparire in tempo reale e provano
   a indovinarla scrivendo in chat. La risposta giusta non si vede:
   compare solo "Marco ha indovinato!" (anche se la parola è dentro
   una frase). Punti: chi indovina prende tanti punti quanti secondi
   mancano (+10 al primo); chi disegna, per ogni risposta giusta, quei
   punti divisi per quanti possono indovinare (se indovinano tutti, la media).
   Quando ha indovinato più di metà del gruppo restano 20 secondi.
   Col tempo si scoprono alcune lettere; "ci sei quasi" lo sa solo
   chi l'ha scritto. Solo ONLINE (ognuno dal suo telefono):
   host-autoritativo come gli altri giochi. I tratti viaggiano a
   pezzetti (~14 al secondo, coordinate su una lavagna 1000x1200)
   e l'host li rimanda a tutti; chi arriva dopo chiede il disegno intero.
   ========================================================= */
(function () {
  "use strict";

  // ---------- le parole (tutte disegnabili) ----------
  // Una voce per "|". Dopo "/" le altre risposte che valgono uguale (sinonimi): la parola da disegnare è la prima.
  // Valgono anche il plurale e il singolare (gatti = gatto) e la parola scritta dentro una frase ("è un gatto").
  var FACILI_TESTO = [
    // animali
    "gatto/gattino|cane/cagnolino|cavallo|mucca/vacca|maiale/maialino|pecora|gallina|gallo|pulcino|papera/anatra/paperella|oca|coniglio/coniglietto|topo/topolino|" +
    "rana|pesce|pesce rosso|pesce palla|uccellino/uccello/passerotto|farfalla|ape|formica|ragno|lumaca/chiocciola|serpente/serpe|tartaruga|elefante|giraffa|leone|" +
    "tigre|zebra|scimmia|gorilla|orso/orsetto|orso polare|panda|pinguino|balena|delfino|squalo|polpo/polipo|granchio|aragosta|gambero|coccodrillo|" +
    "dinosauro/tirannosauro/t rex|gufo/civetta|volpe|lupo|cammello|canguro|koala|pappagallo|cigno|lucertola|riccio|pipistrello|medusa|stella marina|coccinella|" +
    "zanzara|mosca|bruco|lombrico/verme|capra|asino|toro|cervo|renna|alce|cinghiale|ippopotamo|rinoceronte|leopardo|aquila|corvo|piccione|gabbiano|cicogna|" +
    "libellula|grillo|scorpione|foca|tricheco|orca|criceto|talpa|ostrica|cozza",
    // personaggi e mestieri
    "drago/dragone|fantasma/spettro|robot|alieno/extraterrestre/marziano|sirena|unicorno|fata|elfo|gnomo|orco|gigante|zombie/zombi|angelo|diavolo/diavoletto|" +
    "mago/stregone|strega|befana|pirata|re|regina|principe|principessa|cavaliere|pagliaccio/clown|supereroe|astronauta|cuoco/chef|pompiere/vigile del fuoco|" +
    "poliziotto|dottore/medico|infermiera/infermiere|maestra/maestro|postino|cameriere|contadino|pescatore|marinaio|muratore|soldato|calciatore|ballerina|cantante|" +
    "arbitro|subacqueo/sub|vampiro/dracula|mummia|ninja|cowboy|neonato/bebè|nonno|nonna|sposa|pinocchio|cappuccetto rosso|biancaneve|cenerentola",
    // vestiti e accessori
    "ombrello|occhiali/occhiali da sole|cappello/cappellino/berretto|scarpa|stivale|ciabatta/pantofola|calzino/calza|maglietta/t shirt|maglione|pantaloni|gonna|" +
    "vestito|giacca|pigiama|mutande|costume da bagno/costume|cintura|guanto|sciarpa|cravatta|papillon|mantello|tutù|grembiule|casco|elmo|corona|anello|collana|" +
    "braccialetto|orecchini|borsa|zaino/zainetto|valigia|portafoglio|orologio",
    // in casa
    "sedia|tavolo|letto|divano|poltrona|armadio|scrivania|lampada|candela|chiave|porta|finestra|scala|specchio|quadro|vaso|tappeto|cuscino|coperta|culla|amaca|" +
    "camino/caminetto|sveglia|campanello|cassaforte|spazzolino/spazzolino da denti|dentifricio|pettine|spazzola|sapone/saponetta|asciugamano|" +
    "asciugacapelli/phon/fon|doccia|vasca da bagno/vasca|lavandino|rubinetto|water/gabinetto/wc|carta igienica|ferro da stiro|scopa|secchio|" +
    "bidone della spazzatura/pattumiera/spazzatura|cestino|frigorifero/frigo|forno|pentola|padella|teiera|mestolo|imbuto|barattolo|tazza|bicchiere|bottiglia|" +
    "forchetta|coltello|cucchiaio|piatto|scatola|lampadina",
    // oggetti, giochi e strumenti
    "telefono/cellulare/smartphone/telefonino|computer/pc/portatile|televisione/tv/televisore|tablet|radio|macchina fotografica/fotocamera|stampante|drone|antenna|" +
    "satellite|chitarra|pianoforte|tamburo|tromba|violino|flauto|arpa|sassofono/sax|fisarmonica|xilofono|maracas|nota musicale|microfono|cuffie/auricolari|" +
    "pallone/palla|racchetta|libro|quaderno|matita|pastello|penna|gomma|temperino|astuccio|righello|forbici|colla|pennello|tavolozza|lavagna|gessetto|banco|" +
    "mappamondo|martello|chiodo|vite|cacciavite|sega|trapano|pinza|chiave inglese|ascia|pala|rastrello|carriola|annaffiatoio|regalo/pacco regalo|palloncino|" +
    "aquilone|bambola|orsacchiotto/peluche|trottola|yo yo|girandola|fionda|pistola ad acqua|bolle di sapone|carte da gioco/carte|dado|birilli|frisbee|maschera|" +
    "parrucca|spada|scudo|arco|freccia|bandiera|mappa|tesoro|bussola|ancora|bomba|lucchetto|campana|fischietto|calamita/magnete|batteria/pila|binocolo|" +
    "lente d'ingrandimento/lente|cannocchiale|torcia|fiammifero|lanterna|catena|corda|ruota|siringa|pillola|cerotto|stampella|ciuccio|biberon|passeggino|" +
    "busta/lettera|francobollo|giornale|salvagente|pinne|ombrellone|sdraio|castello di sabbia|canna da pesca|amo|rete|gabbia|cuccia|osso|ciotola|guinzaglio|" +
    "ferro di cavallo|sella|trappola per topi|sacco a pelo|trofeo/coppa|medaglia",
    // natura e cielo
    "sole|luna|stella|stella cadente|nuvola|pioggia|neve|fiocco di neve|fulmine|arcobaleno|montagna|collina|vulcano|isola|spiaggia|mare|onda|fiume|lago|cascata|" +
    "grotta|scoglio|sasso/pietra|conchiglia|deserto|bosco/foresta|albero|tronco|fiore|tulipano|margherita|rosa|girasole|quadrifoglio|foglia|erba|fungo|cactus|" +
    "palma|pigna|ghianda|goccia|pozzanghera|pianeta|saturno|pupazzo di neve/pupazzo",
    // da mangiare e da bere
    "pizza|gelato/cono gelato|torta|crostata|mela|banana|pera|pesca|arancia|mandarino|limone|fragola|ciliegia|uva|anguria/cocomero|melone|ananas|kiwi|" +
    "cocco/noce di cocco|fico|castagna|noce|avocado|carota|pomodoro|peperoncino|peperone|melanzana|zucchina|cipolla|aglio|patata|pannocchia/mais|piselli|" +
    "insalata/lattuga|broccolo|uovo|uovo fritto/uovo al tegamino|formaggio|mozzarella|prosciutto|salame|salsiccia|wurstel|bistecca|coscia di pollo/pollo|" +
    "pane|panino|toast|hot dog|hamburger|patatine/patatine fritte/patate fritte|biscotto|caramella|lecca lecca|cioccolato/cioccolata|ciambella/donut|muffin|" +
    "pasticcino|panettone|cannolo|bombolone/krapfen|caffè/espresso/tazzina di caffè|cappuccino|tè/the|latte|succo di frutta/succo|miele|marmellata|burro|yogurt|" +
    "spaghetti/pasta|tortellini|ravioli|popcorn|oliva|ketchup|focaccia|grissino|piadina|arancino/arancina|frittata",
    // posti
    "casa|casetta sull'albero|castello|chiesa|scuola|ospedale|ponte|faro|torre|grattacielo|tenda|capanna|igloo|piramide|mulino/mulino a vento|stadio|fattoria|" +
    "stalla|recinto|pozzo|fontana|statua|panchina|lampione|cassetta delle lettere/buca delle lettere|cartello stradale/cartello|strisce pedonali|semaforo|" +
    "prigione/carcere|piscina|parco giochi|altalena|scivolo|giostra|zoo|porto|aeroporto",
    // veicoli
    "macchina/auto/automobile|bicicletta/bici|triciclo|moto/motocicletta|vespa/scooter/motorino|autobus/bus/pullman|taxi|camion|trattore|ruspa/escavatore|gru|" +
    "ambulanza|carro armato|treno|tram|aereo/aeroplano|elicottero|razzo/missile|astronave/navicella|disco volante/ufo|nave|barca|barca a vela/veliero|canoa/kayak|" +
    "zattera|gondola|sottomarino|monopattino|skateboard|pattini/pattini a rotelle|slitta|carrozza|mongolfiera",
    // il corpo
    "occhio|naso|bocca|orecchio|mano|piede|dito|gamba|braccio|pancia|dente|lingua|baffi|barba|cervello|cuore|muscoli/muscolo|scheletro|teschio|impronta|sorriso|" +
    "lacrima|ombelico",
    // sport, feste e Italia
    "calcio|tennis|basket/pallacanestro|pallavolo|rugby|ping pong/tennis da tavolo|nuoto|sci|snowboard|surf|golf|bowling|boxe/pugilato|karate|ciclismo|canestro|" +
    "albero di natale|babbo natale/santa claus|presepe|ghirlanda|zucca|ragnatela|calderone|pozione|uovo di pasqua|colosseo|torre di pisa|moka/caffettiera|mandolino"
  ].join("|");
  var DIFFICILI_TESTO = [
    // cielo, tempo e stagioni
    "tempesta/temporale/bufera|eclissi|terremoto|tsunami/maremoto|iceberg|meteorite/asteroide/meteora|cometa|galassia|aurora boreale|stalattite|tramonto|alba|" +
    "tornado/uragano/tromba d'aria|valanga|grandine|nebbia|incendio|notte|estate|inverno|autunno|primavera|sistema solare|buco nero|oasi|ghiacciaio|giungla|" +
    "barriera corallina",
    // posti e attrazioni
    "ascensore|scala mobile|montagne russe/ottovolante|ruota panoramica|trampolino|paracadute|luna park|parco acquatico|acquario|circo|museo|biblioteca|" +
    "supermercato|autolavaggio|farmacia|palestra|discoteca|mercato|bancarella|stazione|autostrada|galleria/tunnel|binari|passaggio a livello|diga|molo|" +
    "stazione spaziale|labirinto|edicola|ristorante|cinema|teatro|banca",
    // mestieri
    "giardiniere|idraulico|parrucchiere/barbiere|meccanico|fotografo|pittore|scienziato|detective/investigatore|benzinaio|dentista|veterinario|chirurgo|pilota|" +
    "autista|giudice|sarto|falegname|panettiere/fornaio|pasticciere|macellaio|fioraio|bagnino|spazzacamino|elettricista|direttore d'orchestra|mimo|" +
    "prestigiatore|giocoliere|acrobata|domatore|equilibrista|archeologo|esploratore|apicoltore|minatore|palombaro|cassiere/cassiera|giornalista|architetto",
    // cose che si fanno, momenti
    "sbadiglio|starnuto|abbraccio|selfie/autoscatto|matrimonio|picnic|campeggio|solletico|mal di denti|mal di pancia|febbre|singhiozzo|risata|bacio|" +
    "stretta di mano|applauso|inchino|capriola|verticale|spaccata|tuffo|braccio di ferro|tiro alla fune|nascondino|girotondo|caccia al tesoro|" +
    "bersaglio/tiro al bersaglio|palla di neve|castello di carte|karaoke|sfilata|trasloco|ingorgo/traffico|russare|arrampicata|pattinaggio|equitazione|scherma|" +
    "tiro con l'arco|sollevamento pesi|salto in alto|maratona|canottaggio",
    // oggetti difficili
    "aspirapolvere|frullatore|tostapane|termometro|stetoscopio|telecomando|joystick/controller|presa elettrica/spina|calcolatrice|bilancia|clessidra|" +
    "cavatappi|grattugia|mattarello|microscopio|telescopio|ventaglio|boomerang|catapulta|trampoli|ghiacciolo|spaventapasseri|graffetta|spillatrice|lavatrice|" +
    "ventilatore|periscopio|dirigibile|deltaplano|betoniera|spremiagrumi|schiaccianoci|scolapasta|macchina da cucire|macchina da scrivere|giradischi|" +
    "grammofono|proiettore|parchimetro|idrante|estintore|tombino|citofono|passaporto|scontrino|salvadanaio|portachiavi|carrucola|sedia a rotelle|radiografia|" +
    "ingessatura/gesso|termosifone|apriscatole|cassetto|attaccapanni/appendiabiti|zerbino|tosaerba/tagliaerba|motosega|tastiera|telecamera",
    // animali difficili
    "ornitorinco|camaleonte|fenicottero|bradipo|lama/alpaca|struzzo|tucano|pavone|cavalluccio marino|scoiattolo|castoro|armadillo|formichiere|istrice|lontra|" +
    "ghepardo|iena|bisonte|pellicano|picchio|colibrì|avvoltoio|airone|narvalo|manta|pesce spada|anguilla|piranha|millepiedi|scarabeo|lucciola|falena|" +
    "salamandra|iguana|cobra|pterodattilo|mammut",
    // cibo, monumenti e feste
    "lasagne/lasagna|sushi|zucchero filato|pancake/frittella|croissant/cornetto/brioche|kebab|tiramisù|risotto|minestra/zuppa|polenta|frullato|torre eiffel|" +
    "statua della libertà|big ben|sfinge|grande muraglia|fontana di trevi|vesuvio|trullo|fuochi d'artificio/fuochi|coriandoli|stelle filanti|puzzle|domino|" +
    "scacchi|podio"
  ].join("|");
  var SINONIMI = Object.create(null), TUTTE = Object.create(null);   // le altre risposte buone; tutte le parole (per non scambiare "pesca" con "pesce")
  function leggiParole(testo) {
    var lista = [];
    testo.split("|").forEach(function (voce) {
      var a = voce.split("/").map(function (x) { return x.trim(); }).filter(Boolean);
      if (!a.length || lista.indexOf(a[0]) >= 0) return;
      lista.push(a[0]);
      if (a.length > 1) SINONIMI[a[0]] = a.slice(1);
      a.forEach(function (x) { TUTTE[norm(x).replace(/ /g, "")] = 1; });
    });
    return lista;
  }
  var FACILI = leggiParole(FACILI_TESTO), DIFFICILI = leggiParole(DIFFICILI_TESTO);

  // ---------- costanti ----------
  var LW = 1000, LH = 1200;                                    // la lavagna "logica", un po' più alta che larga (sta meglio sul telefono): i punti viaggiano in queste coordinate
  // i colori principali (l'ultimo, bianco, è la gomma)
  var COLORI = ["#1d1d27", "#868e96", "#8b5a2b", "#e03131", "#fd7e14", "#fcc419", "#2f9e44", "#3bc9db", "#1971c2", "#7048e8", "#f06595", "#f5c6a0", "#ffffff"];
  var NOMI_COL = ["Nero", "Grigio", "Marrone", "Rosso", "Arancione", "Giallo", "Verde", "Azzurro", "Blu", "Viola", "Rosa", "Pelle", "Gomma"];
  var GOMMA = COLORI.length - 1;
  var SPESSORI = [6, 16, 36];                                  // sottile, medio, grosso (in unità della lavagna), anche per la gomma
  var BONUS_PRIMO = 10;                                        // a chi indovina per primo
  var SCELTA_MS = 12000, PUNTI_MS = 6000, MAX_CHAT = 40;
  var ULTIMI_MS = 20000;                                       // quando ha indovinato più di metà del gruppo, restano 20 secondi
  var PAUSA_MSG = 700;                                         // al massimo un messaggio ogni 0,7 secondi a testa
  var SESSIONE = Math.random().toString(36).slice(2, 6);       // per i nomi dei tratti: chi ricarica la pagina non riusa quelli vecchi
  var COL_GIOC = ["#ffd43b", "#74c0fc", "#ff8787", "#8ce99a", "#e599f7", "#ffa94d", "#66d9e8", "#fcc2d7", "#b197fc", "#d8f5a2"];
  var PARTITE_SALVATE = Object.create(null);
  var GALLERIA = { id: null, lista: [] };                      // le miniature dei disegni di questa partita (le fa ogni telefono da sé)

  function nuovaPartitaScara() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  function statVuoteScara() {
    return { turniDisegnati: 0, indovinate: 0, indovinatePrimo: 0, indovinateVeloci: 0, quasi: 0,
      disegniIndovinati: 0, disegniConTreIndovinatori: 0, indovinateDifficili: 0, paroleDifficiliDisegnate: 0,
      paroleDifficiliIndovinate: 0, puntiIndovinando: 0, vittorie: 0, vittorieDifficili: 0, vittorieGruppo: 0 };
  }
  function salvaTrofeiScara(t, vm, cb) {
    try {
      if (!vm || vm.fase !== "fine" || !vm.partitaId || t.guarda ||
          (t.linkParams && (t.linkParams.guarda || t.linkParams.prova)) ||
          (t.impostazioni && t.impostazioni.prova) ||
          !(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var profilo = SGNube.profilo(), id = cb.myId, me = (vm.players || []).filter(function (p) { return p.id === id; })[0];
      if (!me || !id || !String(profilo.nome || "").trim() || String(profilo.nome).trim().toLowerCase() !== String(me.nome || "").trim().toLowerCase()) return;
      var profiloId = String(profilo.uid || profilo.nome).trim().toLowerCase();
      var chiave = "scarabocchio|" + vm.partitaId + "|" + profiloId;
      if (PARTITE_SALVATE[chiave]) return;
      var chiaveLocale = "sg-scarabocchio-ultima-partita-" + profiloId;
      try { if (window.localStorage && localStorage.getItem(chiaveLocale) === String(vm.partitaId)) { PARTITE_SALVATE[chiave] = 1; return; } } catch (e) {}
      var s = (vm.statFine || {})[id] || {}, vittoria = (vm.classifica || []).some(function (p) { return p.id === id && p.pos === 1; });
      var inc = [["partite", 1]];
      Object.keys(s).forEach(function (k) { if (+s[k] > 0) inc.push([k, +s[k]]); });
      if (vittoria) inc.push(["vittorie", 1]);
      if (vittoria && vm.difficili && vm.paroleDifficiliDisegnate > 0) inc.push(["vittorieDifficili", 1]);
      if (vittoria && (vm.players || []).filter(function (p) { return !p.via; }).length >= 6) inc.push(["vittorieGruppo", 1]);
      PARTITE_SALVATE[chiave] = 1;
      try { if (window.localStorage) localStorage.setItem(chiaveLocale, String(vm.partitaId)); } catch (e) {}
      SGNube.salvaProgressi(null, "scarabocchio", inc,
        [], [["ultimaPartitaTrofei", vm.partitaId]]);
    } catch (e) {}
  }

  function fmtN(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function intIn(v, max) { v = Math.round(+v || 0); return v < 0 ? 0 : (v > max ? max : v); }
  function aCaso(a) { return a[Math.floor(Math.random() * a.length)]; }

  // risposte: minuscole, senza accenti né punteggiatura, senza l'articolo davanti
  function norm(s) {
    s = String(s || "").toLowerCase();
    try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {}
    s = s.replace(/[’'`]/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    return s.replace(/^(il|lo|la|i|gli|le|un|uno|una|l) /, "");
  }
  function distanza(a, b) {   // quante lettere cambiano da a a b (Levenshtein)
    if (Math.abs(a.length - b.length) > 2) return 9;
    var r = [], i, j;
    for (j = 0; j <= b.length; j++) r[j] = j;
    for (i = 1; i <= a.length; i++) {
      var prec = r[0]; r[0] = i;
      for (j = 1; j <= b.length; j++) { var t = r[j]; r[j] = Math.min(r[j] + 1, r[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1)); prec = t; }
    }
    return r[b.length];
  }
  // le risposte buone per una parola (lei e i sinonimi), senza spazi
  function risposte(parola) { return [parola].concat(SINONIMI[parola] || []).map(function (w) { return norm(w).replace(/ /g, ""); }); }
  // singolare <-> plurale: cambia solo la fine (gatto/gatti, mela/mele, fiore/fiori, granchio/granchi, fungo/funghi)
  function varianti(w) {
    var n = w.length, a = w.slice(0, -1), u = w[n - 1], out = [];
    if (u === "o") out.push(a + "i");
    if (u === "a") out.push(a + "e");
    if (u === "e") out.push(a + "i");
    if (/io$/.test(w)) out.push(a);
    if (/[cg]o$/.test(w)) out.push(a + "hi");
    if (/[cg]a$/.test(w)) out.push(a + "he");
    return out;
  }
  function plurale(g, r) {
    if (g.length < 4 || r.length < 4 || TUTTE[g]) return false;   // se è un'altra parola del gioco ("pesce" per "pesca") non vale
    return varianti(r).indexOf(g) >= 0 || varianti(g).indexOf(r) >= 0;
  }
  // i pezzi di un messaggio: ogni parola e ogni gruppo di parole vicine (fino a 4), senza spazi
  function pezzi(x) {
    var w = norm(x).split(" ").filter(Boolean), out = [];
    for (var i = 0; i < w.length; i++) for (var n = 1; n <= 4 && i + n <= w.length; n++) out.push(w.slice(i, i + n).join(""));
    return out;
  }
  // "giusta" se la parola (o un sinonimo, o il plurale) è nel messaggio, anche dentro una frase; "quasi" se ci manca poco
  function controlla(x, parola) {
    var rr = risposte(parola), pp = pezzi(x), i, j;
    for (i = 0; i < pp.length; i++) for (j = 0; j < rr.length; j++) if (pp[i] === rr[j] || plurale(pp[i], rr[j])) return "giusta";
    for (i = 0; i < pp.length; i++) for (j = 0; j < rr.length; j++) {
      var g = pp[i], r = rr[j];
      if (r.length >= 4 && Math.abs(g.length - r.length) <= 2 && distanza(g, r) <= (r.length >= 9 ? 2 : 1)) return "quasi";
    }
    return null;
  }
  // la parola con le lettere nascoste ("_"), tranne quelle già scoperte; gli spazi restano spazi
  function maschera(parola, scoperte) {
    var s = "";
    for (var i = 0; i < parola.length; i++) {
      var ch = parola[i];
      s += (ch === " " || ch === "'") ? ch : (scoperte.indexOf(i) >= 0 ? ch : "_");
    }
    return s;
  }

  // ---------- suoni ----------
  function bip(f1, f2, dur, tipo, vol) {
    var ctx = window.SG && SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo || "sine"; o.frequency.setValueAtTime(f1, t0);
      if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.14, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.03);
    } catch (e) {}
  }
  var FX = {
    turno: function () { bip(520, 880, 0.18, "sine", 0.12); },
    altri: function () { bip(700, 1050, 0.12, "triangle", 0.11); },
    mio: function () { [660, 880, 1175].forEach(function (f, i) { setTimeout(function () { bip(f, f, 0.14, "triangle", 0.16); }, i * 90); }); },   // niente vibrazione: arriva da sola, non da un tocco
    quasi: function () { bip(440, 520, 0.12, "sine", 0.1); },
    tic: function () { bip(900, 900, 0.05, "square", 0.04); },
    fine: function () { bip(440, 220, 0.3, "sawtooth", 0.08); }
  };

  // ---------- stile ----------
  var cssFatto = false;
  function iniettaCSS() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.sb-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#15123a}",
      ".schermata.sb-piena>.testa,.schermata.sb-piena>.piede{display:none}",
      ".schermata.sb-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".sb-scena{position:relative;height:var(--alt,100dvh);max-width:720px;margin:0 auto;display:flex;flex-direction:column;overflow:hidden;",
        "background:radial-gradient(120% 80% at 50% 0%,#2e2670,#15123a 70%);user-select:none;-webkit-user-select:none}",
      ".sb-barra{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:calc(4px + env(safe-area-inset-top)) 8px 4px}",
      ".sb-esci{flex:0 0 auto;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".sb-tempo{flex:0 0 auto;min-width:60px;text-align:center;font-weight:900;font-size:.95rem;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.12)}",
      ".sb-tempo.poco{background:#e03131;color:#fff;animation:sbPulsa .5s ease-in-out infinite alternate}",
      ".sb-tempo[hidden]{display:none}",
      ".sb-centro{flex:1 1 auto;min-width:0;text-align:center;font-weight:800;font-size:.92rem;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sb-centro b{color:#ffe066;font-size:1.15rem;letter-spacing:.04em;text-transform:uppercase}",
      ".sb-giro{flex:0 0 auto;font-size:.72rem;font-weight:800;opacity:.75;text-align:right;line-height:1.15}",
      ".sb-lettere{display:inline-flex;gap:3px;align-items:flex-end;justify-content:center}",
      ".sb-lettere i{display:inline-block;width:.8em;border-bottom:3px solid #fff;font-style:normal;font-weight:900;font-size:1.05rem;line-height:1.1;text-transform:uppercase;color:#ffe066;text-align:center}",
      ".sb-lettere i.sp{border:0;width:.45em}",
      ".sb-lettere small{margin-left:6px;opacity:.7;font-size:.72rem;align-self:center}",
      ".sb-lav{position:relative;flex:0 0 auto;display:flex;justify-content:center}",
      ".sb-cv{display:block;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.45);touch-action:none}",
      ".sb-cv.matita{cursor:crosshair}",
      ".sb-cv.matita.secchio{cursor:cell}",
      ".sb-sopra{position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;",
        "padding:12px;text-align:center;background:rgba(18,14,50,.9);border-radius:14px;color:#fff;overflow:hidden}",
      ".sb-sopra[hidden]{display:none}",
      ".sb-tit{font-size:1rem;font-weight:800;line-height:1.3}",
      ".sb-parola{font-size:clamp(1.4rem,7vw,2.1rem);font-weight:900;color:#ffe066;text-transform:uppercase;letter-spacing:.04em;line-height:1.1}",
      ".sb-scelte{display:flex;flex-direction:column;gap:8px;width:min(320px,92%)}",
      ".sb-scelte button{border:0;border-radius:14px;padding:11px;font:inherit;font-size:1.1rem;font-weight:900;background:linear-gradient(135deg,#ffe066,#f4b011);color:#3a2a00;cursor:pointer;text-transform:capitalize}",
      ".sb-righe{font-size:.9rem;line-height:1.45}",
      ".sb-righe b{color:#8ce99a}",
      ".sb-fig{width:64px;height:64px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.12)}",
      ".sb-fig svg,.sb-chip-fig svg{display:block;width:170%;height:auto;margin:-6% 0 0 -35%}",
      ".sb-riga{flex:0 0 auto;padding:5px 6px 2px}",
      ".sb-strumenti{display:flex;flex-direction:column;gap:6px;align-items:stretch}",
      ".sb-strumenti[hidden],.sb-gente[hidden]{display:none}",
      // i 12 colori in una riga, sotto gomma, 3 grandezze, annulla e cestino
      ".sb-tavolozza{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:4px;width:100%;max-width:440px;margin:0 auto}",
      ".sb-col{display:block;width:100%;max-width:32px;aspect-ratio:1/1;justify-self:center;border-radius:50%;border:2px solid rgba(255,255,255,.3);background:var(--c);cursor:pointer;padding:0;transition:transform .12s}",
      ".sb-col.on{border-color:#ffe066;transform:scale(1.22);box-shadow:0 0 0 2px rgba(255,224,102,.5)}",
      ".sb-attrezzi{display:flex;gap:6px;justify-content:center}",
      ".sb-spess,.sb-str{width:42px;height:36px;border-radius:12px;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:1.1rem;cursor:pointer;flex:0 0 auto;",
        "display:flex;align-items:center;justify-content:center;padding:0}",
      ".sb-spess.on,.sb-gomma.on,.sb-secchio.on{background:rgba(255,224,102,.28);box-shadow:inset 0 0 0 2px #ffe066}",
      ".sb-spess i{display:block;border-radius:50%;background:var(--c,#1d1d27);box-shadow:0 0 0 1.5px rgba(255,255,255,.75)}",
      ".sb-spess.s0 i{width:5px;height:5px}.sb-spess.s1 i{width:11px;height:11px}.sb-spess.s2 i{width:21px;height:21px}",
      ".sb-scena.scrive .sb-riga{display:none}",
      ".sb-gente{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}",
      ".sb-gente::-webkit-scrollbar{display:none}",
      ".sb-chip{flex:0 0 auto;display:flex;align-items:center;gap:5px;padding:3px 10px 3px 3px;border-radius:999px;background:rgba(255,255,255,.1);font-size:.78rem;font-weight:800;line-height:1.1}",
      ".sb-chip.dis{background:rgba(255,224,102,.2);box-shadow:inset 0 0 0 2px #ffe066}",
      ".sb-chip.ok{background:rgba(105,219,124,.2);box-shadow:inset 0 0 0 2px #69db7c}",
      ".sb-chip-fig{width:30px;height:30px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.15);flex:0 0 auto}",
      ".sb-chip-pt{font-size:.7rem;opacity:.8}",
      ".sb-chip.dis .sb-chip-nome:after{content:' ✏️'}",
      ".sb-chip.ok .sb-chip-nome:after{content:' ✅'}",
      ".sb-chat{flex:1 1 auto;min-height:0;overflow-y:auto;padding:6px 12px;display:flex;flex-direction:column;gap:3px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}",
      ".sb-msg{font-size:.92rem;line-height:1.3;word-break:break-word;user-select:text;-webkit-user-select:text}",
      ".sb-msg.sys{color:#b9b3ef;font-size:.8rem;text-align:center}",
      ".sb-msg.ok{color:#69db7c;font-weight:900;text-align:center}",
      ".sb-msg.quasi{color:#ffa94d;font-weight:800;text-align:center}",
      ".sb-scrivi{flex:0 0 auto;display:flex;gap:8px;padding:8px 8px calc(8px + env(safe-area-inset-bottom));background:rgba(0,0,0,.25)}",
      ".sb-inp{flex:1 1 auto;min-width:0;border:0;border-radius:999px;padding:12px 16px;font:inherit;font-size:16px;background:#fff;color:#1b1b24;outline:none}",
      ".sb-inp:disabled{background:rgba(255,255,255,.18);color:#fff}",
      ".sb-inp:disabled::placeholder{color:rgba(255,255,255,.8)}",
      ".sb-invia{flex:0 0 auto;width:48px;border:0;border-radius:50%;background:linear-gradient(135deg,#ffe066,#f4b011);color:#3a2a00;font-size:1.2rem;font-weight:900;cursor:pointer}",
      ".sb-invia:disabled{opacity:.35}",
      ".sb-evviva{position:absolute;left:50%;top:45%;z-index:5;pointer-events:none;white-space:nowrap;font-size:1.5rem;font-weight:900;color:#fff;background:linear-gradient(135deg,#40c057,#2f9e44);",
        "padding:10px 18px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.4);animation:sbPop 1.8s ease forwards}",
      ".sb-msg.sa{color:#8ce99a}",
      ".sb-msg.sa b{color:#8ce99a!important}",
      ".sb-basso{flex:0 0 auto;padding:6px 8px calc(6px + env(safe-area-inset-bottom));background:rgba(0,0,0,.25)}",
      ".sb-basso[hidden],.sb-scrivi[hidden]{display:none}",
      ".sb-sopra .sb-faccine{width:min(320px,92%);flex:0 0 auto}",
      ".sb-riga .sb-faccine{margin-top:4px}",
      ".sb-podio{font-size:2rem;text-align:center;margin:0 0 6px}",
      ".sb-perche{text-align:center;font-weight:800;margin:0 0 8px;color:#ffa94d}",
      ".sb-gal-tit{font-weight:900;margin:14px 0 6px}",
      ".sb-gal{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}",
      ".sb-gal::-webkit-scrollbar{display:none}",
      ".sb-gal button{flex:0 0 auto;width:92px;border:0;padding:0;background:none;color:inherit;font:inherit;cursor:pointer;text-align:center}",
      ".sb-gal img{display:block;width:92px;height:110px;object-fit:cover;border-radius:10px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.35)}",
      ".sb-gal span{display:block;font-size:.72rem;font-weight:800;line-height:1.2;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".sb-gal span:first-letter{text-transform:uppercase}",
      ".sb-grande{position:fixed;inset:0;z-index:50;background:rgba(10,8,30,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px}",
      ".sb-grande img{max-width:100%;max-height:calc(var(--alt,100dvh) - 120px);border-radius:14px;background:#fff}",
      ".sb-grande div{font-weight:900;font-size:1.2rem;text-align:center}",
      // schermi bassi: la classifica finale (con le faccine e la galleria) sta in uno schermo
      "@media (max-height:760px){.sb-podio{font-size:1.4rem;margin:0 0 2px}.sb-gal-tit{margin:8px 0 4px}.sb-gal button{width:66px}.sb-gal img{width:66px;height:80px}.sb-gal span{font-size:.66rem}}",
      "@keyframes sbPulsa{to{transform:scale(1.08)}}",
      "@keyframes sbPop{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}14%{transform:translate(-50%,-50%) scale(1.08);opacity:1}80%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-70%) scale(1);opacity:0}}"
    ].join("");
    document.head.appendChild(st);
  }

  // =========================================================
  //  LA VISTA DI GIOCO (uguale per host e ospiti)
  //  Si costruisce una volta sola e poi si aggiorna a pezzi (niente lampeggio).
  //  io = il mio id ("host" o quello dell'ospite)
  //  cb: onTratto(pezzo), onAnnulla(id), onPulisci(), onScegli(i), onProva(testo), onEsci()
  // =========================================================
  function creaVista(t, io, cb) {
    iniettaCSS();
    var el = t.el, s = t.schermata({});
    s.classList.add("sb-piena");
    var scena = el("div", { class: "sb-scena" });
    // barra in alto: esci · tempo · parola (o lettere) · giro
    var tempo = el("div", { class: "sb-tempo", hidden: "hidden" });
    var centro = el("div", { class: "sb-centro" });
    var giro = el("div", { class: "sb-giro" });
    var barra = el("div", { class: "sb-barra" }, [el("button", { class: "sb-esci", "aria-label": "Esci", text: "‹", onclick: function () { cb.onEsci(); } }), tempo, centro, giro]);
    // la lavagna, con sopra i messaggi (scelta della parola, punti del turno)
    var cv = el("canvas", { class: "sb-cv" });
    var sopra = el("div", { class: "sb-sopra", hidden: "hidden" });
    var lav = el("div", { class: "sb-lav" }, [cv, sopra]);
    // sotto la lavagna: gli strumenti (chi disegna) oppure chi gioca (chi indovina)
    var strumenti = el("div", { class: "sb-strumenti", hidden: "hidden" });
    var gente = el("div", { class: "sb-gente" });
    var riga = el("div", { class: "sb-riga" }, [strumenti, gente]);
    // la chat e il campo per scrivere, fisso in basso
    var chat = el("div", { class: "sb-chat" });
    var inp = el("input", { class: "sb-inp", type: "text", maxlength: "40", autocomplete: "off", autocorrect: "off", autocapitalize: "off", spellcheck: "false", enterkeyhint: "send", placeholder: "Scrivi in chat…" });
    var bInvia = el("button", { class: "sb-invia", type: "submit", "aria-label": "Invia", text: "➤" });
    var form = el("form", { class: "sb-scrivi" }, [inp, bInvia]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var x = inp.value.replace(/\s+/g, " ").trim();
      if (!x || inp.disabled) return;
      inp.value = ""; cb.onProva(x);
    });
    inp.addEventListener("focus", function () { setTimeout(function () { window.scrollTo(0, 0); misura(); }, 80); });   // iPhone: la tastiera non deve spingere su la lavagna
    inp.addEventListener("blur", function () { setTimeout(misura, 80); });
    // chi disegna non scrive: al posto del campo vede chi gioca (e chi ha già indovinato)
    var basso = el("div", { class: "sb-basso", hidden: "hidden" });
    [barra, lav, riga, chat, form, basso].forEach(function (n) { scena.appendChild(n); });
    s._contenuto.appendChild(scena);
    t.mostra(s);

    // ----- strumenti -----
    var scelta = { c: 0, w: 1, secchio: false };
    var tavolozza = el("div", { class: "sb-tavolozza" }), attrezzi = el("div", { class: "sb-attrezzi" });
    var bCol = COLORI.slice(0, GOMMA).map(function (c, i) {
      return el("button", { class: "sb-col", style: "--c:" + c, "aria-label": NOMI_COL[i], onclick: function () { scelta.c = i; aggStrumenti(); } });
    });
    var bGomma = el("button", { class: "sb-str sb-gomma", "aria-label": "Gomma", text: "🧽", onclick: function () { scelta.c = GOMMA; aggStrumenti(); } });
    var bSp = SPESSORI.map(function (_, i) {   // tre grandezze, per la matita e per la gomma
      return el("button", { class: "sb-spess s" + i, "aria-label": ["Sottile", "Medio", "Grosso"][i], onclick: function () { scelta.w = i; scelta.secchio = false; aggStrumenti(); } }, [el("i")]);
    });
    // l'icona del secchiello la disegno io (l'emoji 🪣 sui telefoni vecchi esce come un quadratino): la goccia ha il colore scelto
    var bSecchio = el("button", { class: "sb-str sb-secchio", "aria-label": "Secchiello: riempi una zona", onclick: function () { scelta.secchio = !scelta.secchio; aggStrumenti(); },
      html: "<svg viewBox='0 0 24 24' width='24' height='24' aria-hidden='true'><path d='M10 3 17 10 10 17 3 10Z' fill='none' stroke='#fff' stroke-width='2' stroke-linejoin='round'/>" +
        "<path d='M4.2 10.8h11.6L10 16.6z' fill='var(--c,#fcc419)'/><path d='M19.5 12.6c1.2 1.8 1.9 3 1.9 3.9a1.9 1.9 0 0 1-3.8 0c0-.9.7-2.1 1.9-3.9z' fill='var(--c,#fcc419)' stroke='#fff' stroke-width='.8'/></svg>" });
    var bAnn = el("button", { class: "sb-str", "aria-label": "Annulla", text: "↶", onclick: annullaMio });
    var bPul = el("button", { class: "sb-str", "aria-label": "Cancella tutto", text: "🗑️", onclick: pulisciMio });
    bCol.forEach(function (b) { tavolozza.appendChild(b); });
    [bGomma].concat(bSp, [bSecchio, bAnn, bPul]).forEach(function (b) { attrezzi.appendChild(b); });
    strumenti.appendChild(tavolozza); strumenti.appendChild(attrezzi);
    function aggStrumenti() {
      bCol.forEach(function (b, i) { b.classList.toggle("on", i === scelta.c); });
      bGomma.classList.toggle("on", scelta.c === GOMMA);
      bSecchio.classList.toggle("on", scelta.secchio);
      bSecchio.style.setProperty("--c", scelta.c === GOMMA ? "#fff" : COLORI[scelta.c]);
      bSp.forEach(function (b, i) { b.classList.toggle("on", !scelta.secchio && i === scelta.w); b.style.setProperty("--c", scelta.c === GOMMA ? "#fff" : COLORI[scelta.c]); });
      cv.classList.toggle("secchio", scelta.secchio);
    }
    aggStrumenti();

    // ----- la lavagna -----
    // Il disegno "vero" sta su una tela di misura fissa (come le coordinate, 1000x1200), uguale su tutti i telefoni:
    // così anche il secchiello riempie le stesse zone dappertutto. Sullo schermo se ne vede una copia in scala.
    var ctx = cv.getContext("2d"), tratti = [], mio = null, attesa = [], nTr = 0, puoi = false, cestinati = null;
    var mieiId = io + "." + SESSIONE + ".";   // i nomi dei miei tratti (con SESSIONE: chi ricarica la pagina non riusa quelli vecchi)
    var foto = [];   // "fotografie" della tela dopo gli ultimi secchielli: annullare riparte da lì invece che da zero
    var tela = document.createElement("canvas"); tela.width = LW; tela.height = LH;
    var tctx = tela.getContext("2d", { willReadFrequently: true });
    function copia(x0, y0, x1, y1) {   // un pezzo della tela sulla lavagna che si vede
      x0 = Math.max(0, Math.floor(x0) - 2); y0 = Math.max(0, Math.floor(y0) - 2); x1 = Math.min(LW, Math.ceil(x1) + 2); y1 = Math.min(LH, Math.ceil(y1) + 2);
      if (x1 <= x0 || y1 <= y0) return;
      var s = cv.width / LW;
      ctx.drawImage(tela, x0, y0, x1 - x0, y1 - y0, x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s);
    }
    function mostraTutto() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(tela, 0, 0, cv.width, cv.height); }
    function disegnaDa(tr, da, fermo) {   // da = da quale punto (indice nell'elenco x,y); fermo = non copiare ancora sullo schermo
      var p = tr.p; if (!p.length) return;
      if (tr.f) return riempi(p[0], p[1], COLORI[tr.c] || COLORI[0], fermo);
      // linea morbida: curve che passano per i punti di mezzo, usando i punti veri come "calamite"
      var lw = SPESSORI[tr.w] || SPESSORI[0], n = p.length / 2, s = Math.max(0, Math.floor(da / 2) - 1);
      var x0 = p[s * 2], y0 = p[s * 2 + 1], x1 = x0, y1 = y0;
      tctx.strokeStyle = tctx.fillStyle = COLORI[tr.c] || COLORI[0];
      tctx.lineWidth = lw; tctx.lineCap = "round"; tctx.lineJoin = "round";
      if (n === 1) { tctx.beginPath(); tctx.arc(p[0], p[1], lw / 2, 0, Math.PI * 2); tctx.fill(); }
      else {
        tctx.beginPath();
        if (s === 0) tctx.moveTo(p[0], p[1]); else tctx.moveTo((p[s * 2] + p[s * 2 + 2]) / 2, (p[s * 2 + 1] + p[s * 2 + 3]) / 2);
        for (var k = s + 1; k < n; k++) {
          var x = p[k * 2], y = p[k * 2 + 1];
          if (k < n - 1) tctx.quadraticCurveTo(x, y, (x + p[k * 2 + 2]) / 2, (y + p[k * 2 + 3]) / 2);
          else tctx.lineTo(x, y);
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        tctx.stroke();
      }
      if (!fermo) copia(x0 - lw, y0 - lw, x1 + lw, y1 + lw);
    }
    // il secchiello: riempie la zona toccata (i pixel simili attaccati),
    // più un pixel di bordo che copre la sfumatura delle linee
    function riempi(x, y, colore, fermo) {
      x = intIn(x, LW - 1); y = intIn(y, LH - 1);
      var img = tctx.getImageData(0, 0, LW, LH), d = img.data, W = LW, H = LH;
      var r = parseInt(colore.slice(1, 3), 16), g = parseInt(colore.slice(3, 5), 16), b = parseInt(colore.slice(5, 7), 16);
      var s0 = (y * W + x) * 4, r0 = d[s0], g0 = d[s0 + 1], b0 = d[s0 + 2];
      if (Math.abs(r0 - r) + Math.abs(g0 - g) + Math.abs(b0 - b) < 16) return;   // è già di quel colore
      var TOL = 100, zona = new Uint8Array(W * H), pila = [x, y], minX = x, maxX = x, minY = y, maxY = y;
      function simile(q) { var j = q * 4; return Math.abs(d[j] - r0) + Math.abs(d[j + 1] - g0) + Math.abs(d[j + 2] - b0) <= TOL; }
      while (pila.length) {
        var py = pila.pop(), px = pila.pop(), q = py * W + px;
        while (px > 0 && !zona[q - 1] && simile(q - 1)) { px--; q--; }   // fino al bordo a sinistra
        var su = false, giu = false;
        for (; px < W && !zona[q] && simile(q); px++, q++) {
          zona[q] = 1;
          if (px < minX) minX = px; if (px > maxX) maxX = px;
          if (py > 0) { var u = q - W; if (!zona[u] && simile(u)) { if (!su) { pila.push(px, py - 1); su = true; } } else su = false; }
          if (py < H - 1) { var v = q + W; if (!zona[v] && simile(v)) { if (!giu) { pila.push(px, py + 1); giu = true; } } else giu = false; }
        }
        if (py < minY) minY = py; if (py > maxY) maxY = py;
      }
      var ax = Math.max(0, minX - 1), bx = Math.min(W - 1, maxX + 1), ay = Math.max(0, minY - 1), by = Math.min(H - 1, maxY + 1);
      for (var yy = ay; yy <= by; yy++) for (var xx = ax; xx <= bx; xx++) {
        var kk = yy * W + xx;
        if (zona[kk] || (xx > 0 && zona[kk - 1]) || (xx < W - 1 && zona[kk + 1]) || (yy > 0 && zona[kk - W]) || (yy < H - 1 && zona[kk + W])) {
          var j = kk * 4; d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
        }
      }
      tctx.putImageData(img, 0, 0, ax, ay, bx - ax + 1, by - ay + 1);
      if (!fermo) copia(ax, ay, bx + 1, by + 1);
    }
    // dopo un secchiello mi tengo una fotografia della tela (al massimo le ultime 3)
    function scatta(j) {
      try { foto.push({ pre: tratti.slice(0, j + 1), img: tctx.getImageData(0, 0, LW, LH) }); } catch (e) { return; }
      if (foto.length > 3) foto.shift();
    }
    function fotoBuona(f) {   // i tratti fino alla fotografia sono ancora quelli?
      if (f.pre.length > tratti.length) return false;
      for (var k = 0; k < f.pre.length; k++) if (tratti[k] !== f.pre[k]) return false;
      return true;
    }
    function ridisegna() {
      var f = null, da = 0;
      for (var i = foto.length - 1; i >= 0; i--) if (fotoBuona(foto[i])) { f = foto[i]; break; }
      foto = f ? foto.slice(0, foto.indexOf(f) + 1) : [];
      if (f) { tctx.putImageData(f.img, 0, 0); da = f.pre.length; }
      else { tctx.fillStyle = "#fff"; tctx.fillRect(0, 0, LW, LH); }
      for (var j = da; j < tratti.length; j++) { disegnaDa(tratti[j], 0, true); if (tratti[j].f) scatta(j); }
      mostraTutto();
    }
    function nuovoPieno(tr) { if (tr.f && tratti[tratti.length - 1] === tr) scatta(tratti.length - 1); }
    function coord(e) {
      var r = cv.getBoundingClientRect();
      return [intIn((e.clientX - r.left) / r.width * LW, LW), intIn((e.clientY - r.top) / r.height * LH, LH)];
    }
    function aggiungi(pt) {
      var p = mio.p, n = p.length;
      if (n && Math.abs(p[n - 2] - pt[0]) + Math.abs(p[n - 1] - pt[1]) < 3) return;   // troppo vicino all'ultimo: non serve
      p.push(pt[0], pt[1]); attesa.push(pt[0], pt[1]);
      disegnaDa(mio, Math.max(0, p.length - 4));
    }
    function spedisci() { if (!mio || !attesa.length) return; cb.onTratto({ id: mio.id, c: mio.c, w: mio.w, p: attesa }); attesa = []; }
    function stacca() { if (!mio) return; spedisci(); mio = null; }
    cv.addEventListener("pointerdown", function (e) {
      if (!puoi) return;
      e.preventDefault();
      cestinati = null;   // dopo un tratto nuovo il cestino non si annulla più
      if (scelta.secchio) {   // secchiello: riempie la zona toccata col colore scelto
        var pt = coord(e), op = { id: mieiId + (++nTr), c: scelta.c, w: 0, f: 1, p: [Math.min(pt[0], LW - 1), Math.min(pt[1], LH - 1)] };
        tratti.push(op); disegnaDa(op, 0); nuovoPieno(op);
        cb.onTratto({ id: op.id, c: op.c, w: 0, f: 1, p: op.p });
        return;
      }
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      mio = { id: mieiId + (++nTr), c: scelta.c, w: scelta.w, p: [] }; tratti.push(mio);
      aggiungi(coord(e));
    });
    cv.addEventListener("pointermove", function (e) {
      if (!mio) return;
      e.preventDefault();
      var ev = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!ev.length) ev = [e];
      ev.forEach(function (x) { aggiungi(coord(x)); });
    });
    cv.addEventListener("pointerup", stacca); cv.addEventListener("pointercancel", stacca); cv.addEventListener("lostpointercapture", stacca);
    var tSped = setInterval(spedisci, 70);   // mentre disegni, i pezzi partono ~14 volte al secondo
    function annullaMio() {
      if (!puoi) return;
      stacca();
      if (!tratti.length && cestinati) { tratti = cestinati; cestinati = null; ridisegna(); cb.onRipristina(); return; }   // annulla il cestino: torna tutto com'era
      if (!tratti.length) return;
      var tr = tratti.pop(); ridisegna(); cb.onAnnulla(tr.id);
    }
    function pulisciMio() { if (!puoi || !tratti.length) return; stacca(); cestinati = tratti; tratti = []; ridisegna(); cb.onPulisci(); }

    // ----- misure: la lavagna più grande possibile, lasciando spazio alla chat -----
    function misura() {
      if (!document.body.contains(scena)) return;
      var W = scena.clientWidth, Ht = scena.clientHeight; if (!W || !Ht) return;
      var scrive = document.activeElement === inp && !inp.disabled;
      scena.classList.toggle("scrive", scrive);   // tastiera aperta: via le figurine, la chat al minimo
      var fisso = barra.offsetHeight + riga.offsetHeight + form.offsetHeight + basso.offsetHeight;
      var hMax = Ht - fisso - (scrive ? 44 : (puoi ? 40 : 84)) - 8;   // chi disegna non scrive: a lui basta meno chat
      var cw = Math.min(W - 10, 720), ch = Math.round(cw * LH / LW);
      if (ch > hMax) { ch = Math.max(110, hMax); cw = Math.round(ch * LW / LH); }
      var dpr = Math.min(2.5, window.devicePixelRatio || 1);
      cv.style.width = cw + "px"; cv.style.height = ch + "px"; lav.style.height = ch + "px"; sopra.style.width = cw + "px";
      cv.width = Math.round(cw * dpr); cv.height = Math.round(cw * dpr * LH / LW);
      mostraTutto();   // basta ricopiare la tela: il disegno non cambia
    }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { misura(); }) : null;
    if (ro) ro.observe(scena);
    window.addEventListener("resize", misura);
    requestAnimationFrame(misura);
    var tMisura = setInterval(function () { if (cv.style.width) clearInterval(tMisura); else misura(); }, 300);   // pagina ancora nascosta: riprovo finché ho le misure

    // ----- tempo -----
    var scad = 0, faseOra = null, ultimoTic = -1;
    var tTempo = setInterval(function () {
      if (!scad) return;
      var r = Math.max(0, Math.ceil((scad - Date.now()) / 1000));
      tempo.textContent = "⏱ " + r;
      tempo.classList.toggle("poco", faseOra === "disegno" && r <= 10);
      if (faseOra === "disegno" && r <= 5 && r > 0 && r !== ultimoTic) { ultimoTic = r; FX.tic(); }
    }, 250);

    // ----- chi gioca (sotto la lavagna, per chi indovina) -----
    var chips = {}, omini = {};
    function aggGente(vm) {
      var visti = {};
      vm.players.forEach(function (p) {
        if (p.via) return;
        var c = chips[p.id];
        if (!c) {
          c = chips[p.id] = { n: el("div", { class: "sb-chip" }), fig: el("div", { class: "sb-chip-fig" }), nome: el("div", { class: "sb-chip-nome" }), pt: el("div", { class: "sb-chip-pt" }) };
          c.n.appendChild(c.fig); c.n.appendChild(el("div", {}, [c.nome, c.pt])); gente.appendChild(c.n);
          c.cfg = omini[p.id] || null;
          var cfg = omini[p.id] || (window.SGOmino ? SGOmino.casuale(p.nome) : null);
          if (cfg && window.SGOmino) c.fig.innerHTML = SGOmino.svg(cfg);
        }
        c.nome.textContent = p.id === io ? "Tu" : p.nome;
        c.pt.textContent = fmtN(p.punti) + " pt";
        c.n.classList.toggle("dis", p.id === vm.disegnatore && vm.fase !== "fine");
        c.n.classList.toggle("ok", !!p.ok);
        visti[p.id] = 1;
      });
      Object.keys(chips).forEach(function (id) { if (!visti[id]) { if (chips[id].n.parentNode) chips[id].n.parentNode.removeChild(chips[id].n); delete chips[id]; } });
    }

    // ----- chat -----
    var ultimoMsg = 0, avviata = false;
    function riga1(testo, classe) { var n = el("div", { class: "sb-msg " + classe, text: testo }); chat.appendChild(n); return n; }
    function inFondoChat() { while (chat.childNodes.length > 70) chat.removeChild(chat.firstChild); chat.scrollTop = chat.scrollHeight; }
    function aggChat(vm) {
      var inFondo = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 50;
      (vm.chat || []).forEach(function (m) {
        if (m.i <= ultimoMsg) return;
        ultimoMsg = m.i;
        if (m.k === "msg") chat.appendChild(el("div", { class: "sb-msg" }, [el("b", { style: "color:" + (m.c || "#ffd43b"), text: m.n + ": " }), document.createTextNode(m.x)]));
        else riga1(m.x, m.k);
        if (avviata && m.k === "ok" && m.id !== io) FX.altri();
      });
      while (chat.childNodes.length > 70) chat.removeChild(chat.firstChild);
      if (inFondo || !avviata) chat.scrollTop = chat.scrollHeight;
    }
    function evviva(testo) { var n = el("div", { class: "sb-evviva", text: testo }); lav.appendChild(n); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1900); }

    // ----- aggiornamento da una "foto" (vm) della partita -----
    var ultimaFase = null, turnoVisto = null, chiaveCentro = "", mioOkPrima = false, mieiPunti = null, chiaveSopra = "", dove = "";
    function nomeDi(vm, id) { var p = vm.players.filter(function (x) { return x.id === id; })[0]; return p ? (id === io ? "Tu" : p.nome) : "…"; }
    // a fine turno mi tengo una miniatura del disegno (per la galleria della classifica finale)
    function salvaFoto(vm) {
      if (!vm.partitaId || !vm.ultimo || !tratti.length) return;
      if (GALLERIA.id !== vm.partitaId) { GALLERIA.id = vm.partitaId; GALLERIA.lista = []; }
      if (GALLERIA.lista.some(function (g) { return g.turno === vm.turno; })) return;
      try {
        var c = document.createElement("canvas"); c.width = 300; c.height = 360;
        c.getContext("2d").drawImage(tela, 0, 0, 300, 360);
        GALLERIA.lista.push({ turno: vm.turno, parola: vm.ultimo.parola, nome: nomeDi(vm, vm.disegnatore), img: c.toDataURL("image/jpeg", 0.75) });
      } catch (e) {}
    }
    function aggiorna(vm, priv) {
      priv = priv || {};
      var dis = vm.disegnatore === io, me = vm.players.filter(function (p) { return p.id === io && !p.via; })[0];
      faseOra = vm.fase;
      if (vm.turno !== turnoVisto) {   // turno nuovo: lavagna pulita
        turnoVisto = vm.turno; tratti = []; mio = null; attesa = []; cestinati = null; mioOkPrima = false; ultimoTic = -1; ridisegna();
        if (avviata) FX.turno();
      }
      if (vm.fase === "punti" && ultimaFase === "disegno") salvaFoto(vm);
      // tempo
      scad = (vm.fase === "scelta" || vm.fase === "disegno") ? Date.now() + (vm.rimMs || 0) : 0;
      tempo.hidden = !scad;
      var ok = vm.fase === "disegno" && me && me.ok;
      // barra: cosa si vede al centro
      var chiave, html;
      if (vm.fase === "disegno" && dis) { chiave = "d|" + priv.parola; html = "✏️ Disegna: <b>" + esc(priv.parola || "…") + "</b>"; }
      else if (ok && priv.parola) { chiave = "k|" + priv.parola; html = "✅ <b>" + esc(priv.parola) + "</b>"; }   // chi ha indovinato vede la parola
      else if (vm.fase === "disegno") {
        chiave = "i|" + vm.indizio;
        var lett = String(vm.indizio || "").split("").map(function (ch) { return ch === " " ? "<i class='sp'></i>" : "<i>" + (ch === "_" ? "&nbsp;" : esc(ch)) + "</i>"; }).join("");
        var lung = String(vm.indizio || "").split(" ").map(function (w) { return w.length; }).join(", ");
        html = "<span class='sb-lettere'>" + lett + "<small>(" + lung + ")</small></span>";
      }
      else if (vm.fase === "scelta") { chiave = "s|" + dis + vm.disegnatore; html = dis ? "Scegli cosa disegnare!" : "✏️ " + esc(nomeDi(vm, vm.disegnatore)) + " sceglie…"; }
      else if (vm.fase === "punti" && vm.ultimo) { chiave = "p|" + vm.ultimo.parola; html = "Era: <b>" + esc(vm.ultimo.parola) + "</b>"; }
      else { chiave = "x"; html = ""; }
      if (chiave !== chiaveCentro) { chiaveCentro = chiave; centro.innerHTML = html; }
      var g = "Giro<br>" + vm.giro + "/" + vm.giri; if (giro.innerHTML !== g) giro.innerHTML = g;
      // chi disegna ha gli strumenti e, al posto del campo per scrivere, chi gioca; gli altri vedono chi gioca sotto la lavagna
      var primaPuoi = puoi;
      puoi = vm.fase === "disegno" && dis;
      cv.classList.toggle("matita", puoi);
      var dv = (dis && (vm.fase === "scelta" || vm.fase === "disegno")) ? "basso" : "riga";
      var cambiato = dv !== dove;
      if (cambiato) {
        dove = dv;
        if (dv === "basso") { basso.appendChild(gente); form.hidden = true; basso.hidden = false; if (document.activeElement === inp) inp.blur(); }
        else { riga.appendChild(gente); form.hidden = false; basso.hidden = true; }
      }
      strumenti.hidden = !puoi; gente.hidden = false;
      // chi aspetta mentre gli altri indovinano (ha già indovinato, o è appena arrivato): sotto chi gioca, le faccine
      var conFac = vm.fase === "disegno" && !dis && (ok || !me), fRiga = conFac ? faccine() : null, faccineMosse = false;
      if (fRiga && fRiga.parentNode !== riga) { riga.appendChild(fRiga); faccineMosse = true; }
      else if (!conFac && fac && fac.parentNode === riga) { riga.removeChild(fac); faccineMosse = true; }
      if (puoi !== primaPuoi || cambiato || faccineMosse) misura();   // gli strumenti (o le faccine) prendono più posto delle figurine: rifaccio le misure
      aggGente(vm);
      // sopra la lavagna
      var chiaveS = vm.fase + "|" + vm.turno + "|" + (dis ? (priv.opzioni || []).join(",") : "") + "|" + (vm.fase === "punti" ? JSON.stringify(vm.ultimo) : "");
      if (chiaveS !== chiaveSopra) { chiaveSopra = chiaveS; disegnaSopra(vm, dis, priv); }
      // la chat e il campo per scrivere (chi disegna non scrive, neanche mentre sceglie)
      aggChat(vm);
      inp.disabled = !!(!me || (dis && (vm.fase === "scelta" || vm.fase === "disegno")));
      bInvia.disabled = inp.disabled;
      var ph = !me ? "Aspetta il prossimo turno…" : ok ? "Hai indovinato! ✅ Scrivi a chi la sa" : (vm.fase === "disegno" ? "Scrivi qui la tua risposta…" : "Scrivi in chat…");
      if (inp.placeholder !== ph) inp.placeholder = ph;
      // ho appena indovinato?
      if (ok && !mioOkPrima && avviata) { FX.mio(); evviva("🎉 Hai indovinato! +" + Math.max(0, (me.punti || 0) - (mieiPunti || 0))); }
      mioOkPrima = !!ok;
      mieiPunti = me ? me.punti : 0;
      if (vm.fase === "punti" && ultimaFase === "disegno" && avviata) FX.fine();
      ultimaFase = vm.fase;
      avviata = true;
    }
    function disegnaSopra(vm, dis, priv) {
      sopra.innerHTML = "";
      if (vm.fase === "scelta") {
        sopra.hidden = false;
        if (dis) {
          sopra.appendChild(el("div", { class: "sb-tit", text: "Tocca a te! Scegli cosa disegnare" }));
          var sc = el("div", { class: "sb-scelte" });
          (priv.opzioni || []).forEach(function (w, i) { sc.appendChild(el("button", { text: w, onclick: function () { cb.onScegli(i); } })); });
          if (!(priv.opzioni || []).length) sc.appendChild(el("div", { class: "sb-tit", text: "…" }));
          sopra.appendChild(sc);
          sopra.appendChild(el("div", { class: "sb-righe", text: "Gli altri non vedono la parola: disegnala senza scrivere!" }));
        } else {
          var cfg = omini[vm.disegnatore];
          if (cfg && window.SGOmino) sopra.appendChild(el("div", { class: "sb-fig", html: SGOmino.svg(cfg) }));
          sopra.appendChild(el("div", { class: "sb-tit", html: "✏️ <b>" + esc(nomeDi(vm, vm.disegnatore)) + "</b> sta scegliendo cosa disegnare…" }));
          sopra.appendChild(el("div", { class: "sb-righe", text: "Preparati a indovinare: scrivi le risposte qui sotto!" }));
        }
      } else if (vm.fase === "punti" && vm.ultimo) {
        sopra.hidden = false;
        sopra.appendChild(el("div", { class: "sb-tit", text: vm.ultimo.tutti ? "Avete indovinato tutti! 🎉" : "La parola era" }));
        sopra.appendChild(el("div", { class: "sb-parola", text: vm.ultimo.parola }));
        var righe = (vm.ultimo.righe || []).map(function (r) { return esc(r.id === io ? "Tu" : r.nome) + " <b>+" + fmtN(r.pts) + "</b>" + (r.dis ? " ✏️" : ""); });
        sopra.appendChild(el("div", { class: "sb-righe", html: righe.length ? righe.join(" · ") : "Nessuno l'ha indovinata 😅" }));
        if (vm.ultimo.prossimo) sopra.appendChild(el("div", { class: "sb-righe", html: "Adesso disegna: <b>" + esc(vm.ultimo.prossimo === io ? "tu!" : vm.ultimo.prossimoNome) + "</b>" }));
      } else sopra.hidden = true;
      // mentre si aspetta (chi disegna sceglie la parola, i punti del turno): le faccine sulla lavagna
      if ((vm.fase === "scelta" && !dis) || (vm.fase === "punti" && vm.ultimo)) { var f = faccine(); if (f) sopra.appendChild(f); }
    }
    // la fila delle faccine (una sola, si sposta dove serve)
    var fac;
    function faccine() { if (fac === undefined) { fac = t.faccine ? t.faccine() : null; if (fac) fac.classList.add("sb-faccine"); } return fac; }
    function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

    return {
      aggiorna: aggiorna,
      omini: function (m) {
        for (var id in m) if (m[id]) omini[id] = m[id];
        Object.keys(chips).forEach(function (id) { var c = chips[id], cfg = omini[id]; if (cfg && c.cfg !== cfg && window.SGOmino) { c.cfg = cfg; c.fig.innerHTML = SGOmino.svg(cfg); } });
      },
      // un pezzo di tratto arrivato da chi disegna
      tratto: function (m) {
        var tr = null;
        if (!m.f) for (var j = tratti.length - 1; j >= 0; j--) if (tratti[j].id === m.id) { tr = tratti[j]; break; }
        if (!tr) { tr = { id: m.id, c: m.c, w: m.w, f: m.f ? 1 : 0, p: [] }; tratti.push(tr); }
        var da = tr.p.length;
        Array.prototype.push.apply(tr.p, m.p || []);
        disegnaDa(tr, Math.max(0, da - 2));
        nuovoPieno(tr);
      },
      annulla: function (id) { tratti = tratti.filter(function (tr) { return tr.id !== id; }); ridisegna(); },
      pulisci: function () { tratti = []; ridisegna(); },
      // il disegno intero (chi entra a metà, chi rientra, il cestino annullato); i miei tratti più nuovi restano
      tutti: function (lista) {
        var visti = {};
        var nuovi = (lista || []).map(function (tr) { visti[tr.id] = 1; return { id: tr.id, c: tr.c, w: tr.w, f: tr.f ? 1 : 0, p: (tr.p || []).slice() }; });
        tratti.forEach(function (tr) { if (!visti[tr.id] && String(tr.id).indexOf(mieiId) === 0) nuovi.push(tr); });
        nuovi.forEach(function (tr) { var m = /\.(\d+)$/.exec(tr.id); if (String(tr.id).indexOf(mieiId) === 0 && m && +m[1] > nTr) nTr = +m[1]; });
        tratti = nuovi; ridisegna();
      },
      quasi: function (x) { riga1("🔥 «" + x + "»: ci sei quasi!", "quasi"); inFondoChat(); FX.quasi(); },
      avviso: function (x) { riga1(x, "sys"); inFondoChat(); },
      // la chat "tra chi sa" (chi ha indovinato e chi disegna): la vedono solo loro
      sa: function (m) { chat.appendChild(el("div", { class: "sb-msg sa" }, [el("b", { text: (m.id === io ? "Tu" : m.nome) + " 🤫: " }), document.createTextNode(m.x)])); inFondoChat(); },
      chiudi: function () { clearInterval(tSped); clearInterval(tTempo); clearInterval(tMisura); if (ro) ro.disconnect(); window.removeEventListener("resize", misura); }
    };
  }

  // ---------- la saletta d'attesa (uguale per tutti i giochi) ----------
  function lobbyScara(t, vm, cb) {
    var el = t.el;
    cb._chiaveFine = null;
    [].forEach.call(document.querySelectorAll(".sb-grande"), function (n) { n.parentNode.removeChild(n); });
    var info = el("div", {}, [
      el("div", { class: "etichetta", text: "Si gioca così" }),
      el("p", { class: "modulo-nota", style: "margin-top:2px", text: "✏️ " + vm.giri + (vm.giri === 1 ? " giro (ognuno disegna una volta)" : " giri (ognuno disegna " + vm.giri + " volte)") +
        " · ⏱ " + vm.secondi + " secondi a disegno · " + (vm.difficili ? "🤔 parole anche difficili" : "🙂 parole facili") })
    ]);
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2,
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [info], attesa: "Aspetta che l'host cominci: a turno disegnerete tutti! 🎨",
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  // ---------- la classifica finale ----------
  // (si ricostruisce solo se cambia qualcosa: chi entra a partita finita non la fa ridisegnare)
  function finale(t, vm, cb) {
    salvaTrofeiScara(t, vm, cb);
    var cl = vm.classifica || [], gioco = cl.some(function (r) { return r.id === cb.myId; });
    var chiave = vm.partitaId + "|" + JSON.stringify(cl) + "|" + vm.perche + "|" + gioco;
    if (cb._chiaveFine === chiave) return;
    cb._chiaveFine = chiave;
    var el = t.el;
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale" });
    s._contenuto.appendChild(el("div", { class: "sb-podio", text: "🎨🏆🎨" }));
    if (vm.perche === "soli") s._contenuto.appendChild(el("div", { class: "sb-perche", text: "Sono usciti tutti gli altri: partita finita." }));
    // classifica, faccine e galleria in uno schermo: con tanti giocatori (o schermo basso) righe basse su due colonne
    var conGal = GALLERIA.id === vm.partitaId && GALLERIA.lista.length > 0;
    var fitta = cl.length > 6 || cl.length * 71 + 262 + (t.faccine ? 56 : 0) + (conGal ? 170 : 0) > (window.innerHeight || 640);
    var ol = el("ol", { class: "classifica" + (fitta ? " fitta" : "") }), med = ["🥇", "🥈", "🥉"];
    cl.forEach(function (r) {
      ol.appendChild(el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[r.pos - 1] || (r.pos + "°") }),
        el("span", { class: "nome", text: r.nome + (r.id === cb.myId ? " (tu)" : "") + (r.via ? " (ha lasciato)" : "") }),
        el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    var fac = t.faccine ? t.faccine() : null;   // le faccine della saletta: si festeggia (o si sfotte) tutti insieme
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    // la galleria degli scarabocchi della partita: si tocca per vederli grandi
    var gal = GALLERIA.id === vm.partitaId ? GALLERIA.lista : [];
    if (gal.length) {
      s._contenuto.appendChild(el("div", { class: "sb-gal-tit", text: "🖼️ I vostri scarabocchi" }));
      var riga = el("div", { class: "sb-gal" });
      gal.forEach(function (g) {
        riga.appendChild(el("button", { "aria-label": g.parola, onclick: function () {
          try { navigator.vibrate && navigator.vibrate(10); } catch (e) {}
          var o = el("div", { class: "sb-grande", onclick: function () { if (o.parentNode) o.parentNode.removeChild(o); } }, [
            el("img", { src: g.img, alt: g.parola }), el("div", { text: g.parola.toUpperCase() + " · ✏️ " + g.nome }), el("p", { class: "modulo-nota", text: "Tocca per chiudere" }) ]);
          document.body.appendChild(o);
        } }, [el("img", { src: g.img, alt: g.parola }), el("span", { text: g.parola }), el("span", { style: "opacity:.7;font-weight:700", text: "✏️ " + g.nome })]));
      });
      s._contenuto.appendChild(riga);
    }
    // i tasti di fine uguali per tutti (Rivincita, Cambia gioco, Ci sto…) li mette il core; se no quelli di sempre
    cb._notaFine = null;
    var notaFuori = (vm.guardano || []).indexOf(cb.myId) >= 0 ? "Questa partita l'hai guardata 👀" : "La partita è appena finita: entri nella prossima! 🎨";
    if (!(t.tastiFine && t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci }))) {
      if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(cb._notaFine = el("p", { class: "modulo-nota", style: "text-align:center", text: gioco ? "Se l'host fa un'altra partita, torni da solo nella saletta." : notaFuori }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    } else if (!cb.sonoHost && !gioco) s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: notaFuori }));
    t.mostra(s);
  }
  // la finestrella "Sei sicuro?" (con lo stile delle conferme dell'app); il "sì" si attiva dopo un attimo
  function conferma(t, domanda, siTesto, siFn) {
    if (document.querySelector(".conferma-sfondo")) return;
    var el = t.el, sfondo;
    function chiudi() { if (sfondo.parentNode) sfondo.parentNode.removeChild(sfondo); }
    var si = el("button", { class: "btn btn-rosso", text: siTesto, disabled: "disabled", onclick: function () { chiudi(); siFn(); } });
    sfondo = el("div", { class: "conferma-sfondo", onclick: function (e) { if (e.target === sfondo) chiudi(); } }, [
      el("div", { class: "conferma-box", role: "dialog" }, [
        el("div", { class: "conferma-domanda", text: domanda }),
        el("div", { class: "conferma-tasti" }, [el("button", { class: "btn btn-primario", text: "Resta", onclick: chiudi }), si]) ]) ]);
    document.body.appendChild(sfondo);
    setTimeout(function () { si.removeAttribute("disabled"); }, 600);
  }

  // =========================================================
  //  HOST — tiene la partita, controlla le risposte, rimanda i tratti
  // =========================================================
  function hostScara(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, secondi: imp.secondi || 80, giri: imp.giri || 2, difficili: !!imp.difficili,
      players: [{ id: "host", nome: nomeHost, omino: mioAvatar(nomeHost), punti: 0, col: COL_GIOC[0] }],
      giro: 0, idx: -1, ordine: [], turno: 0, disegnatore: null, parola: null, opzioni: null, usate: {},
      scadenza: 0, indovinati: [], scoperte: [], guad: {}, tratti: [], chat: [], nMsg: 0, ultimo: null, classifica: null, to: null, toInd: [],
      partitaId: null, statGiocatori: Object.create(null), paroleDifficiliDisegnate: 0, prossimi: [], perche: null, cestino: null, disegnato: false,
      guardano: [] };   // chi non è tra chi gioca (scelti nella Sala): guarda il disegno e la chat, non gioca
    var vista = null;
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function statP(id) { return H.statGiocatori[id] || (H.statGiocatori[id] = statVuoteScara()); }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } H.toInd.forEach(clearTimeout); H.toInd = []; }
    function msg(k, x, p) {
      H.chat.push({ i: ++H.nMsg, k: k, x: x, n: p ? p.nome : null, c: p ? p.col : null, id: p ? p.id : null });
      if (H.chat.length > MAX_CHAT) H.chat.splice(0, H.chat.length - MAX_CHAT);
    }
    // "⚙️ Regole" in saletta
    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      H.secondi = im.secondi || 80; H.giri = im.giri || 2; H.difficili = !!im.difficili;
      bd();
    };
    t.onRivincita = function () { if (H.fase === "fine") nuova(); };   // la Rivincita: tutti di nuovo nella saletta

    var rete = SGNet.ospita("scarabocchio", {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        if (H.guardano.indexOf(id) >= 0) H.guardano.splice(H.guardano.indexOf(id), 1);
        var p = pById(id); if (!p || p.via) return;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); ricolora(); bd(); return; }
        p.via = true; msg("sys", "👋 " + p.nome + " ha lasciato la partita");
        if (H.fase === "fine") return bd();
        if (presenti().length < 2) { H.perche = "soli"; return fine(); }
        if (id === H.disegnatore && (H.fase === "scelta" || H.fase === "disegno")) return fineTurno("via");
        if (H.fase === "disegno" && tuttiOk()) return fineTurno("tutti");
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") return join(id, m);
        else if (m.t === "tr") tratto(id, m);
        else if (m.t === "annulla") annulla(id, m.id);
        else if (m.t === "pulisci") pulisci(id);
        else if (m.t === "ripristina") ripristina(id);
        else if (m.t === "scegli") scegli(id, m.i);
        else if (m.t === "prova") prova(id, m.x);
        else if (m.t === "sync") sync(id);
      },
      onErrore: function () { senzaRete(t); }
    });
    // chi entra (o rientra con lo stesso id: pagina ricaricata, telefono riacceso)
    function join(id, m) {
      var p = pById(id);
      if (p) {
        if (p.via) {   // era stato dato per uscito: torna in partita (o nella prossima, se è finita)
          p.via = false;
          if (H.fase !== "fine") { msg("sys", "👋 " + p.nome + " è di nuovo qui"); if (H.ordine.indexOf(id) < 0) H.ordine.push(id); }
          if (avatarValido(m.omino)) p.omino = avatarValido(m.omino);
          bd();
        } else rete.invia({ t: "vm", vm: vm() });   // ha solo bisogno della foto (niente da ridisegnare qui)
        if (H.fase !== "lobby" && H.fase !== "fine") sync(id);   // il disegno fin qui e i suoi segreti (la parola, se disegna o l'ha indovinata)
        return;
      }
      var nome = String(m.nome || "Amico").slice(0, 16), omino = avatarValido(m.omino);
      if (t.puoSedersi && !t.puoSedersi(id, nome)) {   // non è tra chi gioca: riceve le foto e il disegno, e guarda
        if (H.guardano.indexOf(id) < 0) H.guardano.push(id);
        rete.invia({ t: "vm", vm: vm() });
        if (H.fase !== "lobby" && H.fase !== "fine") sync(id);
        return;
      }
      if (H.fase === "fine") {   // partita finita: entra nella prossima (intanto vede la classifica)
        if (!H.prossimi.some(function (x) { return x.id === id; })) {
          if (presenti().length + H.prossimi.length >= 10) return privato(id, { t: "piena" });
          H.prossimi.push({ id: id, nome: nome, omino: omino });
        }
        return rete.invia({ t: "vm", vm: vm() });
      }
      if (presenti().length >= 10) return privato(id, { t: "piena" });   // contano solo quelli rimasti
      p = { id: id, nome: nome, omino: omino, punti: 0, col: COL_GIOC[H.players.length % COL_GIOC.length] };
      H.players.push(p);
      statP(id);
      if (H.fase !== "lobby") { H.ordine.push(id); msg("sys", "👋 Entra in partita " + p.nome); if (vista) vista.omini(mappaOmini()); }
      bd();
    }
    function ricolora() { H.players.forEach(function (p, i) { p.col = COL_GIOC[i % COL_GIOC.length]; }); }
    function mappaOmini() { var o = {}; H.players.forEach(function (p) { o[p.id] = p.omino || null; }); return o; }
    // a un telefono solo (parola da disegnare, "ci sei quasi"…): gli altri la ignorano
    function privato(id, m) {
      if (id === "host") {
        if (!vista) return;
        if (m.t === "quasi") vista.quasi(m.x); else if (m.t === "avviso") vista.avviso(m.x); else if (m.t === "sa") vista.sa(m);
        return;
      }
      m.to = id; m.n = H.turno; rete.inviaVeloce(m);
    }
    function sa(id) { return H.fase === "disegno" && H.indovinati.indexOf(id) >= 0; }   // ha indovinato la parola di questo turno?
    function priv() {   // quello che vedo solo io: la parola se disegno (o se l'ho indovinata), le 3 scelte
      if (H.disegnatore === "host") return { parola: H.parola, opzioni: H.fase === "scelta" ? H.opzioni : null };
      if (sa("host")) return { parola: H.parola };
      return null;
    }

    function vm() {
      var o = { fase: H.fase, codice: H.codice, pronta: H.pronta, giro: H.giro, giri: H.giri, secondi: H.secondi, difficili: H.difficili,
        turno: H.turno, disegnatore: H.disegnatore, chat: H.chat.slice(), partitaId: H.partitaId,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, ok: H.indovinati.indexOf(p.id) >= 0, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }) };
      if (H.fase === "scelta" || H.fase === "disegno") o.rimMs = Math.max(0, H.scadenza - Date.now());
      if (H.fase === "disegno") o.indizio = maschera(H.parola, H.scoperte);
      if (H.fase === "punti") o.ultimo = H.ultimo;
      if (H.fase === "fine") {
        o.classifica = H.classifica; o.statFine = H.statGiocatori; o.paroleDifficiliDisegnate = H.paroleDifficiliDisegnate; o.perche = H.perche || null;
        o.prossimi = H.prossimi.map(function (x) { return x.id; });   // chi è arrivato a partita finita (entra nella prossima)
      }
      if (H.guardano.length) o.guardano = H.guardano.slice();
      return o;
    }
    function bd() {
      var v = vm();
      rete.invia({ t: "vm", vm: v });
      if (v.fase === "lobby") { chiudiVista(); lobbyScara(t, v, cbH); }
      else if (v.fase === "fine") { chiudiVista(); finale(t, v, cbH); }
      else {
        if (!vista) { cbH._chiaveFine = null; vista = creaVista(t, "host", cbH); vista.omini(mappaOmini()); }
        vista.aggiorna(v, priv());
      }
    }
    function chiudiVista() { if (vista) { vista.chiudi(); vista = null; } }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < 2) return;
      H.players = presenti(); ricolora();
      H.players.forEach(function (p) { p.punti = 0; });
      var ids = H.players.map(function (p) { return p.id; });
      H.giro = 1; H.idx = -1; H.turno = 0; H.ordine = t.mischia ? t.mischia(ids) : ids;   // chi disegna per primo: a caso
      H.chat = []; H.usate = {}; H.classifica = null; H.perche = null; H.prossimi = []; H.partitaId = nuovaPartitaScara(); H.statGiocatori = Object.create(null); H.paroleDifficiliDisegnate = 0;
      H.players.forEach(function (p) { H.statGiocatori[p.id] = statVuoteScara(); });
      msg("sys", "🎨 Si comincia! Chi disegna non può scrivere, gli altri indovinano in chat.");
      prossimoTurno();
    }
    function pesca() {
      var pool = FACILI.filter(function (w) { return !H.usate[w]; }), dif = DIFFICILI.filter(function (w) { return !H.usate[w]; });
      if (pool.length < 3) { H.usate = {}; pool = FACILI.slice(); dif = DIFFICILI.slice(); }
      var scelte = [];
      function una(lista) { var w; do { w = aCaso(lista); } while (scelte.indexOf(w) >= 0); scelte.push(w); }
      una(pool); una(pool);
      una(H.difficili && dif.length ? dif : pool);   // con le parole difficili: 2 facili e 1 difficile
      return scelte;
    }
    function prossimoTurno() {
      ferma();
      for (;;) {   // il prossimo che disegna (chi è uscito si salta)
        H.idx++;
        if (H.idx >= H.ordine.length) { H.idx = 0; H.giro++; }
        if (H.giro > H.giri) return fine();
        var d = pById(H.ordine[H.idx]); if (d && !d.via) break;
      }
      H.turno++; H.disegnatore = H.ordine[H.idx];
      H.opzioni = pesca(); H.parola = null; H.tratti = []; H.q = 0; H.indovinati = []; H.scoperte = []; H.guad = {}; H.ultimo = null;
      H.cestino = null; H.disegnato = false; H.corti = false;
      H.attesi = Math.max(1, presenti().length - 1);   // quanti possono indovinare in questo turno
      H.fase = "scelta"; H.scadenza = Date.now() + SCELTA_MS;
      bd();
      privato(H.disegnatore, { t: "priv", opzioni: H.opzioni });
      H.to = setTimeout(function () { scegli(H.disegnatore, Math.floor(Math.random() * 3)); }, SCELTA_MS);
    }
    function scegli(id, i) {
      if (H.fase !== "scelta" || id !== H.disegnatore) return;
      i = intIn(i, 2);
      ferma();
      H.parola = H.opzioni[i]; H.usate[H.parola] = 1;
      statP(id).turniDisegnati++;
      if (DIFFICILI.indexOf(H.parola) >= 0) { statP(id).paroleDifficiliDisegnate++; H.paroleDifficiliDisegnate++; }
      H.fase = "disegno"; H.scadenza = Date.now() + H.secondi * 1000;
      var d = pById(H.disegnatore);
      msg("sys", "✏️ " + (d ? d.nome : "…") + " sta disegnando");
      // col passare del tempo si scoprono alcune lettere (mai tutte)
      var lettere = []; for (var j = 0; j < H.parola.length; j++) if (/[a-zà-ù]/i.test(H.parola[j])) lettere.push(j);
      var quante = lettere.length >= 8 ? 3 : (lettere.length >= 5 ? 2 : (lettere.length >= 3 ? 1 : 0));
      [0.45, 0.65, 0.82].slice(0, quante).forEach(function (f) {
        H.toInd.push(setTimeout(function () {
          var restano = lettere.filter(function (x) { return H.scoperte.indexOf(x) < 0; });
          if (restano.length > 1) { H.scoperte.push(aCaso(restano)); bd(); }
        }, H.secondi * 1000 * f));
      });
      // chi disegna è distratto? dopo 20 secondi con la lavagna ancora vuota si passa al prossimo
      H.toInd.push(setTimeout(function () { if (H.fase === "disegno" && !H.disegnato && !H.indovinati.length) fineTurno("vuoto"); }, 20000));
      H.to = setTimeout(function () { fineTurno("tempo"); }, H.secondi * 1000);
      bd();
      privato(H.disegnatore, { t: "priv", parola: H.parola });
    }
    function tuttiOk() { return presenti().every(function (p) { return p.id === H.disegnatore || H.indovinati.indexOf(p.id) >= 0; }); }
    function prova(id, x) {
      var p = pById(id); if (!p || p.via) return;
      x = String(x || "").replace(/\s+/g, " ").trim().slice(0, 40); if (!x) return;
      var gioca = H.fase === "scelta" || H.fase === "disegno";
      if (gioca && id === H.disegnatore) return;   // chi disegna non scrive (neanche mentre sceglie): non si svela niente
      // niente raffiche: al massimo un messaggio ogni 0,7 secondi (e chi esagera lo sa)
      var ora = Date.now();
      if (ora - (p.ultMsg || 0) < PAUSA_MSG) {
        if (ora - (p.ultAvviso || 0) > 3000) { p.ultAvviso = ora; privato(id, { t: "avviso", x: "Piano! 🙂 «" + x + "» non è partito: un messaggio alla volta" }); }
        return;
      }
      p.ultMsg = ora;
      if (H.fase === "disegno") {
        if (sa(id)) {   // ha già indovinato: parla solo con chi la sa (chi ha indovinato e chi disegna)
          var m = { t: "sa", id: id, nome: p.nome, x: x };
          H.indovinati.concat([H.disegnatore]).forEach(function (q) { var pq = pById(q); if (pq && !pq.via) privato(q, { t: "sa", id: m.id, nome: m.nome, x: m.x }); });
          return;
        }
        var esito = controlla(x, H.parola);   // la parola può essere anche dentro una frase ("è un gatto!")
        if (esito === "giusta") return indovina(p);
        if (esito === "quasi") { statP(id).quasi++; return privato(id, { t: "quasi", x: x }); }   // "ci sei quasi" lo sa solo lui: agli altri non si svela niente
      }
      msg("msg", x, p); bd();
    }
    function indovina(p) {
      var primo = H.indovinati.length === 0, veloci = H.scadenza - Date.now() >= H.secondi * 1000 * 0.6;
      H.indovinati.push(p.id);
      var pts = Math.max(1, Math.ceil((H.scadenza - Date.now()) / 1000));   // tanti punti quanti secondi mancano
      if (primo) pts += BONUS_PRIMO;   // chi indovina per primo: +10
      p.punti += pts; H.guad[p.id] = (H.guad[p.id] || 0) + pts;
      var sp = statP(p.id); sp.indovinate++; sp.puntiIndovinando += pts;
      if (primo) sp.indovinatePrimo++;
      if (veloci) sp.indovinateVeloci++;
      if (DIFFICILI.indexOf(H.parola) >= 0) sp.indovinateDifficili++;
      // chi disegna: la sua parte di ogni risposta giusta (se indovinano tutti, prende quanto la media di chi indovina)
      var d = pById(H.disegnatore), pd = Math.max(1, Math.round(pts / H.attesi));
      if (d) { d.punti += pd; H.guad[d.id] = (H.guad[d.id] || 0) + pd; }
      msg("ok", "🎉 " + p.nome + " ha indovinato!" + (primo ? " Per primo! ⚡" : ""), p);
      privato(p.id, { t: "priv", parola: H.parola });   // adesso la parola la può vedere anche lui
      if (tuttiOk()) {   // l'hanno indovinata tutti: il turno finisce subito
        ferma(); bd();
        H.to = setTimeout(function () { fineTurno("tutti"); }, 1200);
        return;
      }
      // l'ha indovinata più di metà del gruppo: restano 20 secondi (se ne mancavano di più).
      // "Più di metà": in 3 il secondo che indovina non deve trovarsi il tempo già tagliato
      var possono = presenti().length - 1;
      if (!H.corti && possono >= 3 && H.indovinati.length * 2 > possono &&H.scadenza - Date.now() > ULTIMI_MS + 2000) {
        H.corti = true; H.scadenza = Date.now() + ULTIMI_MS;
        if (H.to) clearTimeout(H.to);
        H.to = setTimeout(function () { fineTurno("tempo"); }, ULTIMI_MS);
        msg("sys", "⏩ Ultimi 20 secondi!");
      }
      bd();
    }
    function fineTurno(motivo) {
      if (H.fase !== "scelta" && H.fase !== "disegno") return;
      ferma();
      if (!H.parola) { msg("sys", "Si passa al prossimo."); return prossimoTurno(); }   // uscito prima di scegliere la parola
      var d = pById(H.disegnatore), parola = H.parola;
      if (d && H.indovinati.length) {
        statP(d.id).disegniIndovinati++;
        if (H.indovinati.length >= 3) statP(d.id).disegniConTreIndovinatori++;
        if (DIFFICILI.indexOf(parola) >= 0) statP(d.id).paroleDifficiliIndovinate++;
      }
      var righe = H.indovinati.map(function (id) { var p = pById(id); return { id: id, nome: p ? p.nome : "…", pts: H.guad[id] || 0 }; });
      if (d && H.guad[d.id]) righe.push({ id: d.id, nome: d.nome, pts: H.guad[d.id], dis: true });
      if (motivo === "tempo") msg("sys", "⏰ Tempo scaduto! La parola era «" + parola + "»");
      else if (motivo === "via") msg("sys", "La parola era «" + parola + "»");
      else if (motivo === "vuoto") msg("sys", "😴 Nessun disegno: si passa al prossimo. Era «" + parola + "»");
      else msg("sys", "Indovinata da tutti! Era «" + parola + "»");
      // chi disegna dopo (per dirlo a tutti)
      var prossimo = null, gi = H.giro, ix = H.idx;
      for (var n = 0; n < H.ordine.length + 1; n++) {
        ix++; if (ix >= H.ordine.length) { ix = 0; gi++; }
        if (gi > H.giri) break;
        var q = pById(H.ordine[ix]); if (q && !q.via) { prossimo = q; break; }
      }
      H.ultimo = { parola: parola, righe: righe, tutti: motivo === "tutti", prossimo: prossimo ? prossimo.id : null, prossimoNome: prossimo ? prossimo.nome : null };
      H.fase = "punti"; H.parola = parola;
      bd();
      H.to = setTimeout(prossimoTurno, PUNTI_MS);
    }
    function fine() {
      ferma();
      // chi è rimasto fino alla fine prima, per punti; chi è uscito in fondo
      var restati = presenti(), usciti = H.players.filter(function (p) { return p.via; });
      function ordina(l) { return l.slice().sort(function (a, b) { return b.punti - a.punti; }); }
      var ro = ordina(restati), uo = ordina(usciti);
      H.classifica = ro.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ro.filter(function (q) { return q.punti > p.punti; }).length }; })
        .concat(uo.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: true, pos: 1 + ro.length + uo.filter(function (q) { return q.punti > p.punti; }).length }; }));
      H.fase = "fine"; H.disegnatore = null; H.prossimi = [];
      bd();
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));   // per il torneo online
    }
    function nuova() {   // "Nuova partita": tutti tornano nella saletta, stessi amici
      ferma();
      H.players = presenti();
      H.prossimi.forEach(function (x) { if (!pById(x.id) && H.players.length < 10) { H.players.push({ id: x.id, nome: x.nome, omino: x.omino, punti: 0 }); statP(x.id); } });   // chi è arrivato a partita finita
      H.prossimi = []; ricolora();
      H.players.forEach(function (p) { p.punti = 0; });
      H.fase = "lobby"; H.giro = 0; H.disegnatore = null; H.indovinati = []; H.tratti = []; H.chat = []; H.classifica = null; H.perche = null;
      bd();
    }

    // ----- la lavagna: i pezzi arrivano da chi disegna e ripartono per tutti -----
    function trova(id) { for (var j = H.tratti.length - 1; j >= 0; j--) if (H.tratti[j].id === id) return H.tratti[j]; return null; }
    function tratto(da, m) {
      if (H.fase !== "disegno" || da !== H.disegnatore || !m || typeof m.id !== "string") return;
      var p = Array.isArray(m.p) ? m.p : [];
      if (!p.length || p.length > 400 || p.length % 2) return;
      var pieno = m.f ? 1 : 0;
      if (pieno && p.length !== 2) return;   // il secchiello è un tocco solo
      var pul = [];
      for (var i = 0; i < p.length; i += 2) pul.push(intIn(p[i], LW), intIn(p[i + 1], LH));
      var tr = pieno ? null : trova(m.id);
      if (!tr) {
        if (H.tratti.length >= 900) return;
        tr = { id: String(m.id).slice(0, 24), c: intIn(m.c, COLORI.length - 1), w: intIn(m.w, SPESSORI.length - 1), f: pieno, p: [] };
        H.tratti.push(tr);
      }
      if (tr.p.length + pul.length > 8000) return;
      Array.prototype.push.apply(tr.p, pul);
      H.disegnato = true; H.cestino = null;
      rete.inviaVeloce({ t: "tr", da: da, n: H.turno, q: ++H.q, id: tr.id, c: tr.c, w: tr.w, f: tr.f, p: pul });
      if (da !== "host" && vista) vista.tratto({ id: tr.id, c: tr.c, w: tr.w, f: tr.f, p: pul });
    }
    function annulla(da, id) {
      if (H.fase !== "disegno" || da !== H.disegnatore) return;
      var tr = trova(id) || H.tratti[H.tratti.length - 1]; if (!tr) return;
      H.tratti = H.tratti.filter(function (x) { return x !== tr; });
      rete.inviaVeloce({ t: "annulla", da: da, n: H.turno, q: ++H.q, id: tr.id });
      if (da !== "host" && vista) vista.annulla(tr.id);
    }
    function pulisci(da) {
      if (H.fase !== "disegno" || da !== H.disegnatore) return;
      if (H.tratti.length) H.cestino = H.tratti;   // per poterlo annullare
      H.tratti = [];
      rete.inviaVeloce({ t: "pulisci", da: da, n: H.turno, q: ++H.q });
      if (da !== "host" && vista) vista.pulisci();
    }
    // "Annulla" subito dopo il cestino: torna il disegno com'era
    function ripristina(da) {
      if (H.fase !== "disegno" || da !== H.disegnatore || !H.cestino || H.tratti.length) return;
      H.tratti = H.cestino; H.cestino = null;
      rete.inviaVeloce({ t: "disegno", da: da, turno: H.turno, q: ++H.q, tratti: H.tratti });
      if (da !== "host" && vista) vista.tutti(H.tratti);
    }
    // chi arriva a disegno iniziato (o si ricollega) chiede tutto il disegno
    function sync(id) {
      if (!pById(id) && H.guardano.indexOf(id) < 0) return;
      rete.inviaVeloce({ t: "disegno", to: id, turno: H.turno, q: H.q || 0, tratti: H.fase === "disegno" ? H.tratti : [], omini: mappaOmini() });
      if (id === H.disegnatore) privato(id, H.fase === "scelta" ? { t: "priv", opzioni: H.opzioni } : { t: "priv", parola: H.parola });
      else if (sa(id)) privato(id, { t: "priv", parola: H.parola });   // l'aveva già indovinata
    }

    var cbH = {
      sonoHost: true, myId: "host",
      onComincia: comincia, onNuova: nuova,
      onEsci: function () {
        function via() { ferma(); chiudiVista(); rete.chiudi(); t.esci(); }
        if (H.fase !== "lobby" && H.fase !== "fine") return conferma(t, "Chiudere la partita per tutti?", "🚪 Chiudi", via);
        via();
      },
      onTratto: function (m) { tratto("host", m); },
      onAnnulla: function (id) { annulla("host", id); },
      onPulisci: function () { pulisci("host"); },
      onRipristina: function () { ripristina("host"); },
      onScegli: function (i) { scegli("host", i); },
      onProva: function (x) { prova("host", x); }
    };
    bd();
  }

  // =========================================================
  //  OSPITE — disegna e indovina dal suo telefono
  // =========================================================
  function ospiteScara(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el;
    var S = { rete: null, myId: null, nome: "", vista: null, vm: null, omini: {}, priv: { turno: null, parola: null, opzioni: null }, sincro: null, piena: false, ultJoin: 0 };
    function chiudiVista() { if (S.vista) { S.vista.chiudi(); S.vista = null; } }
    function esci() { chiudiVista(); if (S.rete) S.rete.chiudi(); t.esci(); }
    var cb = {
      sonoHost: false, myId: null,
      onEsci: function () {   // a partita in corso si chiede prima (la "‹" sta vicino al tempo: è facile toccarla per sbaglio)
        if (S.vm && (S.vm.fase === "scelta" || S.vm.fase === "disegno" || S.vm.fase === "punti")) return conferma(t, "Vuoi lasciare la partita?", "🚪 Esci", esci);
        esci();
      },
      onTratto: function (m) { if (S.rete) S.rete.invia({ t: "tr", id: m.id, c: m.c, w: m.w, f: m.f ? 1 : 0, p: m.p }); },
      onAnnulla: function (id) { if (S.rete) S.rete.invia({ t: "annulla", id: id }); },
      onPulisci: function () { if (S.rete) S.rete.invia({ t: "pulisci" }); },
      onRipristina: function () { if (S.rete) S.rete.invia({ t: "ripristina" }); },
      onScegli: function (i) { if (S.rete) S.rete.invia({ t: "scegli", i: i }); },
      onProva: function (x) { if (S.rete) S.rete.invia({ t: "prova", x: x }); }
    };
    function mandaJoin() { S.ultJoin = Date.now(); S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : mioAvatar(S.nome) }); }
    // sono nella foto? se no (dato per uscito, tolto alla "Nuova partita"…) richiedo di entrare, al massimo ogni 2 secondi
    function ciSono(vm) {
      var id = S.myId, io = (vm.players || []).filter(function (p) { return p.id === id; })[0];
      if (!io && (vm.guardano || []).indexOf(id) >= 0) return true;   // non sono tra chi gioca: guardo e basta
      if (vm.fase === "fine") return !!io || (vm.prossimi || []).indexOf(id) >= 0 || (vm.classifica || []).some(function (r) { return r.id === id; });
      return !!io && !io.via;
    }
    function privDi(vm) {
      if (!vm || S.priv.turno !== vm.turno) return null;
      if (vm.disegnatore === S.myId) return S.priv;
      var io = vm.players.filter(function (p) { return p.id === S.myId; })[0];
      return io && io.ok ? { parola: S.priv.parola } : null;   // chi ha indovinato vede la parola
    }
    function mostra(vm) {
      if (vm.fase === "lobby") { chiudiVista(); lobbyScara(t, vm, cb); return; }
      if (vm.fase === "fine") { chiudiVista(); finale(t, vm, cb); return; }
      var nuova = !S.vista;
      if (nuova) { cb._chiaveFine = null; S.vista = creaVista(t, S.myId, cb); S.vista.omini(S.omini); }
      S.vista.aggiorna(vm, privDi(vm));
      if (nuova) chiediTutto();   // appena entro in partita (anche a turno iniziato) chiedo il disegno intero
    }
    function chiediTutto() { S.ultimaSync = Date.now(); S.rete.invia({ t: "sync" }); }
    // i pezzi di disegno sono numerati: se ne manca uno (la rete ha fatto un salto) chiedo il disegno intero
    function controllaNumero(m) {
      if (!S.vm || m.n !== S.vm.turno) return;
      if (S.qN !== m.n) { S.qN = m.n; S.q = 0; }
      if (m.q !== S.q + 1 && Date.now() - (S.ultimaSync || 0) > 2000) chiediTutto();
      S.q = m.q;
    }
    function schermaNome() {
      var s = t.schermata({ icona: "🎨", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      var msgN = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(msgN);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; msgN.textContent = "Collegamento in corso…"; collega();
      } }));
      t.mostra(s);
    }
    function attesa() {
      var s = t.schermata({ icona: "🎨", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: esci });
      S.msg = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg); t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) {
          S.myId = id; cb.myId = id;
          mandaJoin();
          attesa();
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita: controlla il codice o aspetta l'host…"; }, 8000);
        },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;   // messaggio per un altro telefono
          if (m.t === "piena") {   // stanza piena: lo dico chiaro invece di lasciarlo a guardare
            S.piena = true; chiudiVista(); errore(t, "La stanza è piena (10 giocatori). Aspetta che si liberi un posto o apri una partita nuova.");
            return;
          }
          if (m.t === "vm") {
            if (S.piena) return;
            S.vm = m.vm;
            if (m.vm.fase === "lobby") m.vm.players.forEach(function (p) { if (p.omino) S.omini[p.id] = p.omino; });
            if (!ciSono(m.vm) && Date.now() - S.ultJoin > 2000) mandaJoin();
            mostra(m.vm);
          } else if (!S.vista) return;
          else if (m.da === S.myId && (m.t === "tr" || m.t === "annulla" || m.t === "pulisci" || m.t === "disegno")) return;   // il mio disegno: ce l'ho già
          else if ((m.t === "tr" || m.t === "annulla" || m.t === "pulisci") && S.vm && m.n < S.vm.turno) return;   // un pezzo del turno prima arrivato tardi
          else if (m.t === "tr") { controllaNumero(m); S.vista.tratto(m); }
          else if (m.t === "annulla") { controllaNumero(m); S.vista.annulla(m.id); }
          else if (m.t === "pulisci") { controllaNumero(m); S.vista.pulisci(); }
          else if (m.t === "disegno") {   // il disegno intero (anche per chi disegna e ha ricaricato la pagina)
            if (m.omini) { for (var id in m.omini) if (m.omini[id]) S.omini[id] = m.omini[id]; S.vista.omini(S.omini); }
            if (S.vm && m.turno === S.vm.turno) { S.vista.tutti(m.tratti); S.qN = m.turno; S.q = m.q || 0; }
          }
          else if (m.t === "avviso") S.vista.avviso(m.x);
          else if (m.t === "sa") S.vista.sa(m);
          else if (m.t === "priv") {
            if (S.priv.turno !== m.n) S.priv = { turno: m.n, parola: null, opzioni: null };
            if (m.opzioni) S.priv.opzioni = m.opzioni;
            if (m.parola) S.priv.parola = m.parola;
            if (S.vm) S.vista.aggiorna(S.vm, privDi(S.vm));
          }
          else if (m.t === "quasi") S.vista.quasi(m.x);
        },
        // chiusa apposta dall'host (se sparisce lo dice il core): sulla classifica finale la classifica resta
        onChiuso: function () {
          if (S.vm && S.vm.fase === "fine") { if (cb._notaFine && document.body.contains(cb._notaFine)) cb._notaFine.textContent = "🚪 L'host ha chiuso la stanza."; return; }
          chiudiVista(); errore(t, "La partita è stata chiusa dall'host.");
        },
        // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
        onErrore: function () { chiudiVista(); errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); }   // col profilo si entra da soli
    else schermaNome();
  }

  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Scarabocchio si gioca online, ognuno dal suo telefono: funziona quando il gioco è aperto dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  SG.registra({
    id: "scarabocchio",
    nome: "Scarabocchio",
    icona: "🎨",
    descrizione: "Uno disegna una parola segreta, gli altri la indovinano scrivendo in chat: prendi tanti punti quanti secondi mancano. Si gioca online, ognuno dal suo telefono. Da 2 a 10.",
    giocatoriMin: 2, giocatoriMax: 10, difficolta: 1,
    postiOnline: 10,   // posti online
    modi: [],            // solo online: ognuno ha bisogno del suo schermo (la parola la vede solo chi disegna)
    soloOnline: true,
    etichettaGiocatori: "🔗 Online · 2–10",
    regole: [
      "A turno uno di voi <b>disegna</b>: sceglie una parola tra 3 e la disegna sulla lavagna. Gli altri vedono il disegno comparire in tempo reale.",
      "Chi indovina <b>scrive la risposta in chat</b> (vale anche dentro una frase, al plurale o con un sinonimo: «è un'auto!»). Se è giusta non la vede nessuno: compare solo «Marco ha indovinato!». Se ci sei quasi, il gioco lo dice solo a te.",
      "Punti: chi indovina prende <b>tanti punti quanti secondi mancano</b> (indovini con 57 secondi sul timer? +57), e il primo <b>+10</b>. Chi disegna prende una parte di ogni risposta giusta: <b>più amici indovinano, più punti</b>.",
      "Quando ha indovinato più di metà del gruppo, restano <b>20 secondi</b>. Chi ha già indovinato vede la parola e può chiacchierare con chi la sa.",
      "Chi disegna ha 12 colori, la gomma, 3 grandezze e il <b>secchiello</b> per riempire una zona chiusa con un tocco. Il cestino si può annullare.",
      "Il tempo è poco: mentre passa si scoprono alcune lettere della parola. Chi disegna non può scrivere lettere o parole sulla lavagna!",
      "Dopo tutti i giri vince chi ha <b>più punti</b>."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "online"; dove.secondi = 80; dove.giri = 2; dove.difficili = false;
      function riga(titolo, valori, chiave) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + valori.length + ",1fr)" });
        valori.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v[0] ? " attiva" : ""), style: "justify-content:center;text-align:center", onclick: function () {
            dove[chiave] = v[0]; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [el("div", {}, [el("div", { class: "mt", text: v[1] })])]);
          g.appendChild(b);
        });
        box.appendChild(g);
      }
      riga("Tempo per disegnare", [[60, "60 secondi"], [80, "80 secondi"], [100, "100 secondi"]], "secondi");
      riga("Quanti giri (ognuno disegna una volta a giro)", [[1, "1 giro"], [2, "2 giri"], [3, "3 giri"]], "giri");
      riga("Parole", [[false, "🙂 Facili"], [true, "🤔 Anche difficili"]], "difficili");
      if (!(window.SGNet && SGNet.disponibile())) box.appendChild(el("div", { class: "link-avviso", text: "Si gioca online: funziona quando il gioco è aperto dal sito pubblicato." }));
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteScara(t, t.linkParams.stanza);
      return hostScara(t);
    }
  });
})();
