/* =========================================================
   GIOCO — "Scarabocchio" (disegna e indovina, tipo Pinturillo)
   A turno uno disegna una parola segreta (sceglie tra 3) sulla
   lavagna; gli altri la vedono comparire in tempo reale e provano
   a indovinarla scrivendo in chat. La risposta giusta non si vede:
   compare solo "Marco ha indovinato!". Punti: chi indovina prende
   tanti punti quanti secondi mancano; chi disegna 25 per ognuno che indovina.
   Col tempo si scoprono alcune lettere; "ci sei quasi" lo sa solo
   chi l'ha scritto. Solo ONLINE (ognuno dal suo telefono):
   host-autoritativo come gli altri giochi. I tratti viaggiano a
   pezzetti (~14 al secondo, coordinate su una lavagna 1000x1200)
   e l'host li rimanda a tutti; chi arriva dopo chiede il disegno intero.
   ========================================================= */
(function () {
  "use strict";

  // ---------- le parole (tutte disegnabili) ----------
  var FACILI = ("gatto|cane|cavallo|mucca|maiale|pecora|gallina|papera|coniglio|topo|rana|pesce|uccellino|farfalla|ape|formica|ragno|lumaca|serpente|" +
    "tartaruga|elefante|giraffa|leone|tigre|zebra|scimmia|orso|pinguino|balena|delfino|squalo|polpo|granchio|coccodrillo|dinosauro|gufo|volpe|lupo|" +
    "cammello|canguro|koala|pappagallo|cigno|lucertola|riccio|pipistrello|medusa|stella marina|coccinella|zanzara|bruco|" +
    "drago|fantasma|robot|alieno|sirena|unicorno|mago|strega|pirata|re|regina|principessa|cavaliere|pagliaccio|astronauta|cuoco|pompiere|poliziotto|" +
    "dottore|vampiro|mummia|ninja|cowboy|" +
    "ombrello|occhiali|cappello|scarpa|calzino|maglietta|pantaloni|guanto|sciarpa|cravatta|borsa|zaino|orologio|telefono|computer|televisione|chitarra|" +
    "pianoforte|tamburo|tromba|violino|pallone|racchetta|libro|matita|forbici|penna|righello|tazza|bicchiere|bottiglia|forchetta|coltello|cucchiaio|" +
    "piatto|pentola|sedia|tavolo|letto|divano|lampada|candela|chiave|porta|finestra|scala|specchio|spazzolino|pettine|doccia|frigorifero|forno|" +
    "martello|chiodo|ascia|pala|secchio|annaffiatoio|regalo|palloncino|aquilone|corona|spada|scudo|arco|freccia|bandiera|mappa|tesoro|bussola|ancora|" +
    "bomba|dado|lucchetto|campana|fischietto|microfono|cuffie|lampadina|batteria|calamita|" +
    "sole|luna|stella|nuvola|pioggia|neve|fulmine|arcobaleno|montagna|vulcano|isola|spiaggia|mare|onda|fiume|lago|cascata|deserto|albero|fiore|" +
    "foglia|erba|fungo|cactus|palma|rosa|girasole|pupazzo di neve|" +
    "pizza|gelato|torta|mela|banana|pera|arancia|limone|fragola|ciliegia|uva|anguria|ananas|carota|pomodoro|peperoncino|cipolla|patata|uovo|" +
    "formaggio|pane|panino|hamburger|patatine|biscotto|caramella|lecca lecca|cioccolato|caffè|latte|spaghetti|popcorn|ciambella|" +
    "casa|castello|chiesa|scuola|ospedale|ponte|faro|torre|grattacielo|tenda|igloo|piramide|mulino|stadio|fattoria|" +
    "macchina|bicicletta|moto|autobus|camion|trattore|ambulanza|treno|aereo|elicottero|razzo|nave|barca|sottomarino|monopattino|skateboard|mongolfiera|" +
    "occhio|naso|bocca|orecchio|mano|piede|dente|cuore|scheletro|" +
    "calcio|tennis|basket|nuoto|sci|golf|bowling|boxe|albero di natale|babbo natale|zucca|uovo di pasqua|gondola|vespa|moka|colosseo|torre di pisa").split("|");
  var DIFFICILI = ("tempesta|eclissi|terremoto|tsunami|iceberg|meteorite|cometa|galassia|aurora boreale|stalattite|tramonto|alba|vento|ombra|" +
    "semaforo|ascensore|scala mobile|montagne russe|ruota panoramica|altalena|scivolo|trampolino|paracadute|" +
    "giardiniere|idraulico|parrucchiere|meccanico|fotografo|pittore|scienziato|detective|benzinaio|" +
    "sbadiglio|starnuto|abbraccio|selfie|compleanno|matrimonio|vacanza|picnic|campeggio|solletico|mal di denti|sonnambulo|musica|" +
    "aspirapolvere|frullatore|tostapane|termometro|stetoscopio|telecomando|joystick|presa elettrica|calcolatrice|bilancia|clessidra|cavatappi|" +
    "grattugia|mattarello|microscopio|telescopio|ventaglio|boomerang|catapulta|trampoli|ghiacciolo|spaventapasseri|graffetta|spillatrice|lavatrice|ventilatore|" +
    "ornitorinco|camaleonte|fenicottero|bradipo|lama|struzzo|tucano|pavone|cavalluccio marino|scoiattolo|castoro|" +
    "torre eiffel|statua della libertà|lasagne|sushi|zucchero filato|pancake|croissant|kebab|" +
    "fuochi d'artificio|labirinto|puzzle|domino|scacchi|trofeo|medaglia|podio|acquario|circo|museo|biblioteca|supermercato|autolavaggio").split("|");

  // ---------- costanti ----------
  var LW = 1000, LH = 1200;                                    // la lavagna "logica", un po' più alta che larga (sta meglio sul telefono): i punti viaggiano in queste coordinate
  // i colori principali (l'ultimo, bianco, è la gomma)
  var COLORI = ["#1d1d27", "#868e96", "#8b5a2b", "#e03131", "#fd7e14", "#fcc419", "#2f9e44", "#3bc9db", "#1971c2", "#7048e8", "#f06595", "#f5c6a0", "#ffffff"];
  var NOMI_COL = ["Nero", "Grigio", "Marrone", "Rosso", "Arancione", "Giallo", "Verde", "Azzurro", "Blu", "Viola", "Rosa", "Pelle", "Gomma"];
  var GOMMA = COLORI.length - 1;
  var SPESSORI = [6, 16, 36];                                  // sottile, medio, grosso (in unità della lavagna), anche per la gomma
  var PUNTI_DISEGNO = 25;                                      // a chi disegna, per ognuno che indovina
  var SCELTA_MS = 12000, PUNTI_MS = 6000, MAX_CHAT = 40;
  var COL_GIOC = ["#ffd43b", "#74c0fc", "#ff8787", "#8ce99a", "#e599f7", "#ffa94d", "#66d9e8", "#fcc2d7", "#b197fc", "#d8f5a2"];

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
  function giusta(x, parola) { var a = norm(x), b = norm(parola); return a === b || a.replace(/ /g, "") === b.replace(/ /g, ""); }
  function quasi(x, parola) {
    var a = norm(x).replace(/ /g, ""), b = norm(parola).replace(/ /g, "");
    if (b.length < 4 || !a) return false;
    return distanza(a, b) <= (b.length >= 9 ? 2 : 1);
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
    mio: function () { [660, 880, 1175].forEach(function (f, i) { setTimeout(function () { bip(f, f, 0.14, "triangle", 0.16); }, i * 90); }); try { navigator.vibrate && navigator.vibrate([0, 30, 40, 30]); } catch (e) {} },
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
      ".sb-podio{font-size:2.4rem;text-align:center;margin:4px 0 8px}",
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
    [barra, lav, riga, chat, form].forEach(function (n) { scena.appendChild(n); });
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
    var ctx = cv.getContext("2d"), tratti = [], mio = null, attesa = [], nTr = 0, puoi = false;
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
      var lw = SPESSORI[tr.w] || SPESSORI[0], i = Math.max(0, da - (da % 2)), x0 = p[i], y0 = p[i + 1], x1 = x0, y1 = y0;
      tctx.strokeStyle = tctx.fillStyle = COLORI[tr.c] || COLORI[0];
      tctx.lineWidth = lw; tctx.lineCap = "round"; tctx.lineJoin = "round";
      if (p.length === 2) { tctx.beginPath(); tctx.arc(p[0], p[1], lw / 2, 0, Math.PI * 2); tctx.fill(); }
      else {
        tctx.beginPath(); tctx.moveTo(p[i], p[i + 1]);
        for (i += 2; i < p.length; i += 2) {
          tctx.lineTo(p[i], p[i + 1]);
          if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1];
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
    function ridisegna() {
      tctx.fillStyle = "#fff"; tctx.fillRect(0, 0, LW, LH);
      tratti.forEach(function (tr) { disegnaDa(tr, 0, true); });
      mostraTutto();
    }
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
      if (scelta.secchio) {   // secchiello: riempie la zona toccata col colore scelto
        var pt = coord(e), op = { id: io + "." + (++nTr), c: scelta.c, w: 0, f: 1, p: [Math.min(pt[0], LW - 1), Math.min(pt[1], LH - 1)] };
        tratti.push(op); disegnaDa(op, 0);
        cb.onTratto({ id: op.id, c: op.c, w: 0, f: 1, p: op.p });
        return;
      }
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      mio = { id: io + "." + (++nTr), c: scelta.c, w: scelta.w, p: [] }; tratti.push(mio);
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
    function annullaMio() { if (!puoi || !tratti.length) return; stacca(); var tr = tratti.pop(); ridisegna(); cb.onAnnulla(tr.id); }
    function pulisciMio() { if (!puoi || !tratti.length) return; stacca(); tratti = []; ridisegna(); cb.onPulisci(); }

    // ----- misure: la lavagna più grande possibile, lasciando spazio alla chat -----
    function misura() {
      if (!document.body.contains(scena)) return;
      var W = scena.clientWidth, Ht = scena.clientHeight; if (!W || !Ht) return;
      var scrive = document.activeElement === inp && !inp.disabled;
      scena.classList.toggle("scrive", scrive);   // tastiera aperta: via le figurine, la chat al minimo
      var fisso = barra.offsetHeight + riga.offsetHeight + form.offsetHeight;
      var hMax = Ht - fisso - (scrive ? 44 : (puoi ? 52 : 84)) - 8;   // chi disegna non scrive: a lui basta meno chat
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
    var ultimaFase = null, turnoVisto = null, chiaveCentro = "", mioOkPrima = false, mieiPunti = null, chiaveSopra = "";
    function nomeDi(vm, id) { var p = vm.players.filter(function (x) { return x.id === id; })[0]; return p ? (id === io ? "Tu" : p.nome) : "…"; }
    function aggiorna(vm, priv) {
      priv = priv || {};
      var dis = vm.disegnatore === io, me = vm.players.filter(function (p) { return p.id === io; })[0];
      faseOra = vm.fase;
      if (vm.turno !== turnoVisto) {   // turno nuovo: lavagna pulita
        turnoVisto = vm.turno; tratti = []; mio = null; attesa = []; mioOkPrima = false; ridisegna();
        if (avviata) FX.turno();
      }
      // tempo
      scad = (vm.fase === "scelta" || vm.fase === "disegno") ? Date.now() + (vm.rimMs || 0) : 0;
      tempo.hidden = !scad; ultimoTic = -1;
      // barra: cosa si vede al centro
      var chiave, html;
      if (vm.fase === "disegno" && dis) { chiave = "d|" + priv.parola; html = "✏️ Disegna: <b>" + esc(priv.parola || "…") + "</b>"; }
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
      giro.innerHTML = "Giro<br>" + vm.giro + "/" + vm.giri;
      // chi disegna ha gli strumenti; gli altri vedono chi gioca
      var primaPuoi = puoi;
      puoi = vm.fase === "disegno" && dis;
      cv.classList.toggle("matita", puoi);
      strumenti.hidden = !puoi; gente.hidden = puoi;
      if (puoi !== primaPuoi) misura();   // gli strumenti prendono più posto delle figurine: rifaccio le misure
      aggGente(vm);
      // sopra la lavagna
      var chiaveS = vm.fase + "|" + vm.turno + "|" + (dis ? (priv.opzioni || []).join(",") : "") + "|" + (vm.fase === "punti" ? JSON.stringify(vm.ultimo) : "");
      if (chiaveS !== chiaveSopra) { chiaveSopra = chiaveS; disegnaSopra(vm, dis, priv); }
      // la chat e il campo per scrivere
      aggChat(vm);
      var ok = vm.fase === "disegno" && me && me.ok;
      inp.disabled = !!(puoi || ok || !me);
      bInvia.disabled = inp.disabled;
      inp.placeholder = puoi ? "Stai disegnando: niente suggerimenti! 🤐" : ok ? "Hai indovinato! ✅ Aspetta gli altri" : (vm.fase === "disegno" ? "Scrivi qui la tua risposta…" : "Scrivi in chat…");
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
    }
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
      },
      annulla: function (id) { tratti = tratti.filter(function (tr) { return tr.id !== id; }); ridisegna(); },
      pulisci: function () { tratti = []; ridisegna(); },
      tutti: function (lista) { tratti = (lista || []).map(function (tr) { return { id: tr.id, c: tr.c, w: tr.w, f: tr.f ? 1 : 0, p: (tr.p || []).slice() }; }); ridisegna(); },
      quasi: function (x) { riga1("🔥 «" + x + "»: ci sei quasi!", "quasi"); chat.scrollTop = chat.scrollHeight; FX.quasi(); },
      chiudi: function () { clearInterval(tSped); clearInterval(tTempo); clearInterval(tMisura); if (ro) ro.disconnect(); window.removeEventListener("resize", misura); }
    };
  }

  // ---------- la saletta d'attesa (uguale per tutti i giochi) ----------
  function lobbyScara(t, vm, cb) {
    var el = t.el;
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
  function finale(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale" });
    var cl = vm.classifica || [];
    s._contenuto.appendChild(el("div", { class: "sb-podio", text: "🎨🏆🎨" }));
    var ol = el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    cl.forEach(function (r, i) {
      ol.appendChild(el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[r.pos - 1] || (r.pos + "°") }),
        el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(s);
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
      scadenza: 0, indovinati: [], scoperte: [], guad: {}, tratti: [], chat: [], nMsg: 0, ultimo: null, classifica: null, to: null, toInd: [] };
    var vista = null;
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
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

    var rete = SGNet.ospita("scarabocchio", {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        var p = pById(id); if (!p || p.via) return;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); ricolora(); bd(); return; }
        p.via = true; msg("sys", "👋 " + p.nome + " è uscito");
        if (H.fase === "fine") return bd();
        if (presenti().length < 2) return fine();
        if (id === H.disegnatore && (H.fase === "scelta" || H.fase === "disegno")) return fineTurno("via");
        if (H.fase === "disegno" && tuttiOk()) return fineTurno("tutti");
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (!pById(id) && H.players.length < 10 && H.fase !== "fine") {
            var p = { id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino), punti: 0, col: COL_GIOC[H.players.length % COL_GIOC.length] };
            H.players.push(p);
            if (H.fase !== "lobby") { H.ordine.push(id); msg("sys", "👋 È arrivato " + p.nome); if (vista) vista.omini(mappaOmini()); }
          }
          bd();
        }
        else if (m.t === "tr") tratto(id, m);
        else if (m.t === "annulla") annulla(id, m.id);
        else if (m.t === "pulisci") pulisci(id);
        else if (m.t === "scegli") scegli(id, m.i);
        else if (m.t === "prova") prova(id, m.x);
        else if (m.t === "sync") sync(id);
      },
      onErrore: function () { senzaRete(t); }
    });
    function ricolora() { H.players.forEach(function (p, i) { p.col = COL_GIOC[i % COL_GIOC.length]; }); }
    function mappaOmini() { var o = {}; H.players.forEach(function (p) { o[p.id] = p.omino || null; }); return o; }
    // a un telefono solo (parola da disegnare, "ci sei quasi"…): gli altri la ignorano
    function privato(id, m) {
      if (id === "host") { if (m.t === "quasi" && vista) vista.quasi(m.x); return; }
      m.to = id; m.n = H.turno; rete.inviaVeloce(m);
    }
    function priv() {   // quello che vede solo chi disegna, se sono io
      if (H.disegnatore !== "host") return null;
      return { parola: H.parola, opzioni: H.fase === "scelta" ? H.opzioni : null };
    }

    function vm() {
      var o = { fase: H.fase, codice: H.codice, pronta: H.pronta, giro: H.giro, giri: H.giri, secondi: H.secondi, difficili: H.difficili,
        turno: H.turno, disegnatore: H.disegnatore, chat: H.chat.slice(),
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, ok: H.indovinati.indexOf(p.id) >= 0, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }) };
      if (H.fase === "scelta" || H.fase === "disegno") o.rimMs = Math.max(0, H.scadenza - Date.now());
      if (H.fase === "disegno") o.indizio = maschera(H.parola, H.scoperte);
      if (H.fase === "punti") o.ultimo = H.ultimo;
      if (H.fase === "fine") o.classifica = H.classifica;
      return o;
    }
    function bd() {
      var v = vm();
      rete.invia({ t: "vm", vm: v });
      if (v.fase === "lobby") { chiudiVista(); lobbyScara(t, v, cbH); }
      else if (v.fase === "fine") { chiudiVista(); finale(t, v, cbH); }
      else {
        if (!vista) { vista = creaVista(t, "host", cbH); vista.omini(mappaOmini()); }
        vista.aggiorna(v, priv());
      }
    }
    function chiudiVista() { if (vista) { vista.chiudi(); vista = null; } }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < 2) return;
      H.players = presenti(); ricolora();
      H.players.forEach(function (p) { p.punti = 0; });
      H.giro = 1; H.idx = -1; H.turno = 0; H.ordine = H.players.map(function (p) { return p.id; });
      H.chat = []; H.usate = {}; H.classifica = null;
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
      H.to = setTimeout(function () { fineTurno("tempo"); }, H.secondi * 1000);
      bd();
      privato(H.disegnatore, { t: "priv", parola: H.parola });
    }
    function tuttiOk() { return presenti().every(function (p) { return p.id === H.disegnatore || H.indovinati.indexOf(p.id) >= 0; }); }
    function prova(id, x) {
      var p = pById(id); if (!p || p.via) return;
      x = String(x || "").replace(/\s+/g, " ").trim().slice(0, 40); if (!x) return;
      if (H.fase === "disegno") {
        if (id === H.disegnatore || H.indovinati.indexOf(id) >= 0) return;   // chi disegna o ha già indovinato non scrive (non si svela niente)
        if (giusta(x, H.parola)) return indovina(p);
        if (quasi(x, H.parola)) return privato(id, { t: "quasi", x: x });   // "ci sei quasi" lo sa solo lui: agli altri non si svela niente
      }
      msg("msg", x, p); bd();
    }
    function indovina(p) {
      H.indovinati.push(p.id);
      var pts = Math.max(1, Math.ceil((H.scadenza - Date.now()) / 1000));   // tanti punti quanti secondi mancano
      p.punti += pts; H.guad[p.id] = (H.guad[p.id] || 0) + pts;
      var d = pById(H.disegnatore); if (d) { d.punti += PUNTI_DISEGNO; H.guad[d.id] = (H.guad[d.id] || 0) + PUNTI_DISEGNO; }
      msg("ok", "🎉 " + p.nome + " ha indovinato!", p);
      if (tuttiOk()) {   // l'hanno indovinata tutti: il turno finisce subito
        ferma(); bd();
        H.to = setTimeout(function () { fineTurno("tutti"); }, 1200);
        return;
      }
      bd();
    }
    function fineTurno(motivo) {
      if (H.fase !== "scelta" && H.fase !== "disegno") return;
      ferma();
      if (!H.parola) { msg("sys", "Si passa al prossimo."); return prossimoTurno(); }   // uscito prima di scegliere la parola
      var d = pById(H.disegnatore), parola = H.parola;
      var righe = H.indovinati.map(function (id) { var p = pById(id); return { id: id, nome: p ? p.nome : "…", pts: H.guad[id] || 0 }; });
      if (d && H.guad[d.id]) righe.push({ id: d.id, nome: d.nome, pts: H.guad[d.id], dis: true });
      if (motivo === "tempo") msg("sys", "⏰ Tempo scaduto! La parola era «" + parola + "»");
      else if (motivo === "via") msg("sys", "La parola era «" + parola + "»");
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
      var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      H.classifica = ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
      H.fase = "fine"; H.disegnatore = null;
      bd();
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));   // per il torneo online
    }
    function nuova() {   // "Nuova partita": tutti tornano nella saletta, stessi amici
      ferma();
      H.players = presenti(); ricolora();
      H.players.forEach(function (p) { p.punti = 0; });
      H.fase = "lobby"; H.giro = 0; H.disegnatore = null; H.indovinati = []; H.tratti = []; H.chat = []; H.classifica = null;
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
      H.tratti = [];
      rete.inviaVeloce({ t: "pulisci", da: da, n: H.turno, q: ++H.q });
      if (da !== "host" && vista) vista.pulisci();
    }
    // chi arriva a disegno iniziato (o si ricollega) chiede tutto il disegno
    function sync(id) {
      if (!pById(id)) return;
      rete.inviaVeloce({ t: "disegno", to: id, turno: H.turno, q: H.q || 0, tratti: H.fase === "disegno" ? H.tratti : [], omini: mappaOmini() });
      if (id === H.disegnatore) privato(id, H.fase === "scelta" ? { t: "priv", opzioni: H.opzioni } : { t: "priv", parola: H.parola });
    }

    var cbH = {
      sonoHost: true, myId: "host",
      onComincia: comincia, onNuova: nuova,
      onEsci: function () {
        if (H.fase !== "lobby" && H.fase !== "fine" && !window.confirm("Chiudere la partita per tutti?")) return;
        ferma(); chiudiVista(); rete.chiudi(); t.esci();
      },
      onTratto: function (m) { tratto("host", m); },
      onAnnulla: function (id) { annulla("host", id); },
      onPulisci: function () { pulisci("host"); },
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
    var S = { rete: null, myId: null, nome: "", vista: null, vm: null, omini: {}, priv: { turno: null, parola: null, opzioni: null }, sincro: null };
    function chiudiVista() { if (S.vista) { S.vista.chiudi(); S.vista = null; } }
    function esci() { chiudiVista(); if (S.rete) S.rete.chiudi(); t.esci(); }
    var cb = {
      sonoHost: false, myId: null,
      onEsci: esci,
      onTratto: function (m) { if (S.rete) S.rete.invia({ t: "tr", id: m.id, c: m.c, w: m.w, f: m.f ? 1 : 0, p: m.p }); },
      onAnnulla: function (id) { if (S.rete) S.rete.invia({ t: "annulla", id: id }); },
      onPulisci: function () { if (S.rete) S.rete.invia({ t: "pulisci" }); },
      onScegli: function (i) { if (S.rete) S.rete.invia({ t: "scegli", i: i }); },
      onProva: function (x) { if (S.rete) S.rete.invia({ t: "prova", x: x }); }
    };
    function privDi(vm) { return (vm && S.priv.turno === vm.turno && vm.disegnatore === S.myId) ? S.priv : null; }
    function mostra(vm) {
      if (vm.fase === "lobby") { chiudiVista(); lobbyScara(t, vm, cb); return; }
      if (vm.fase === "fine") { chiudiVista(); finale(t, vm, cb); return; }
      var nuova = !S.vista;
      if (nuova) { S.vista = creaVista(t, S.myId, cb); S.vista.omini(S.omini); }
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
          S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : mioAvatar(S.nome) });
          attesa();
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita: controlla il codice o aspetta l'host…"; }, 8000);
        },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;   // messaggio per un altro telefono
          if (m.t === "vm") {
            S.vm = m.vm;
            if (m.vm.fase === "lobby") m.vm.players.forEach(function (p) { if (p.omino) S.omini[p.id] = p.omino; });
            mostra(m.vm);
          } else if (!S.vista) return;
          else if (m.da === S.myId && (m.t === "tr" || m.t === "annulla" || m.t === "pulisci")) return;   // il mio disegno: ce l'ho già
          else if (m.t === "tr") { controllaNumero(m); S.vista.tratto(m); }
          else if (m.t === "annulla") { controllaNumero(m); S.vista.annulla(m.id); }
          else if (m.t === "pulisci") { controllaNumero(m); S.vista.pulisci(); }
          else if (m.t === "disegno") {
            if (m.omini) { for (var id in m.omini) if (m.omini[id]) S.omini[id] = m.omini[id]; S.vista.omini(S.omini); }
            if (S.vm && m.turno === S.vm.turno && S.vm.disegnatore !== S.myId) { S.vista.tutti(m.tratti); S.qN = m.turno; S.q = m.q || 0; }
          }
          else if (m.t === "priv") {
            if (S.priv.turno !== m.n) S.priv = { turno: m.n, parola: null, opzioni: null };
            if (m.opzioni) S.priv.opzioni = m.opzioni;
            if (m.parola) S.priv.parola = m.parola;
            if (S.vm) S.vista.aggiorna(S.vm, privDi(S.vm));
          }
          else if (m.t === "quasi") S.vista.quasi(m.x);
        },
        onChiuso: function () { chiudiVista(); errore(t, "La partita è stata chiusa dall'host."); },
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
    modi: [],            // solo online: ognuno ha bisogno del suo schermo (la parola la vede solo chi disegna)
    soloOnline: true,
    etichettaGiocatori: "🔗 Online · 2–10",
    regole: [
      "A turno uno di voi <b>disegna</b>: sceglie una parola tra 3 e la disegna sulla lavagna. Gli altri vedono il disegno comparire in tempo reale.",
      "Chi indovina <b>scrive la risposta in chat</b>. Se è giusta non la vede nessuno: compare solo «Marco ha indovinato!». Se ci sei quasi, il gioco lo dice solo a te.",
      "Punti: chi indovina prende <b>tanti punti quanti secondi mancano</b> (indovini con 57 secondi sul timer? +57). Chi disegna prende <b>25 punti</b> per ognuno che indovina.",
      "Chi disegna ha 12 colori, la gomma, 3 grandezze e il <b>secchiello</b> per riempire una zona chiusa con un tocco.",
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
