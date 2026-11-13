/* =========================================================
   PEZZO DEL CUORE — 🤖 I BOT
   Il gruppo fisso dei Bot uguali in tutti i giochi (BOT_PARTENZA: Matt e gli altri), come si
   prendono (SG.bot.prendi / tutti / daId), come si caricano dalla scheda pubblica del proprietario
   e l'editor «🤖 I Bot» che vede solo IL PAPPONE nel suo profilo. BOT_LIVELLI resta nel cuore.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var el = cuore.el, svuota = cuore.svuota, chiediConferma = cuore.chiediConferma, mischia = cuore.mischia, schermata = cuore.schermata,
      mostra = cuore.mostra, pillola = cuore.pillola, eProprietario = cuore.eProprietario, BOT_LIVELLI = cuore.BOT_LIVELLI,
      BOT_MAX_NOME = cuore.BOT_MAX_NOME, BOT_MAX_FRASE = cuore.BOT_MAX_FRASE, schedaDelProprietario = cuore.schedaDelProprietario,
      stessoNome = cuore.stessoNome;

  var BOT_LIV = { facile: "🟢 Facile", medio: "🟡 Medio", difficile: "🔴 Difficile" };
  var BOT_PARTENZA = [
    { id: "matt", nome: "Matt", livello: "difficile", frase: "Il campione: vince sempre, e lo sa.",
      omino: { forma: "uomo", corpo: "snello", pelle: 1, viso: "squadrato", occhi: "furbi", iride: 2, sopracc: "decise", naso: "dritto", bocca: "ghigno",
        capelli: "ciuffo", colCap: 4, barba: "accenno", capo: "giacca", maglia: 7, sotto: "pantaloni", pantaloni: 1, modScarpe: "eleganti", scarpe: 0,
        occhiali: "sole", collo: "catena", mano: "trofeo", cappello: "nessuno" } },
    { id: "angela", nome: "Angela", livello: "difficile", frase: "La professoressa: pensa a ogni mossa, e non sbaglia.",
      omino: { forma: "donna", corpo: "snello", pelle: 0, viso: "ovale", occhi: "mandorla", iride: 3, sopracc: "arcuate", naso: "piccolo", bocca: "sorrisetto",
        capelli: "chignon", colCap: 0, capo: "camicetta", maglia: 4, sotto: "gonnatubino", pantaloni: 1, modScarpe: "tacchi", scarpe: 0,
        occhiali: "felina", orecchini: "perla", collo: "perle", eyeliner: "sottile", rossetto: "pieno", colRossetto: 0, mano: "libro", colMano: 4, cappello: "nessuno" } },
    { id: "rosa", nome: "Rosa", livello: "facile", frase: "Allegra e chiacchierona: gioca d'istinto.",
      omino: { forma: "donna", corpo: "medio", pelle: 2, viso: "tondo", occhi: "felici", iride: 1, sopracc: "morbide", naso: "insu", bocca: "sorrisone", guance: "lentiggini",
        capelli: "riccilunghi", colCap: 3, capo: "vestito", maglia: 5, stampa: "pois", sotto: "gonna", pantaloni: 5, modScarpe: "ballerine", scarpe: 2,
        cappello: "fiori", orecchini: "cuori", blush: "leggero", mano: "palloncino", colMano: 0, occhiali: "nessuno" } },
    { id: "peppe", nome: "Peppe", livello: "medio", frase: "Il furbo del bar: bluffa, ride e ti frega.",
      omino: { forma: "uomo", corpo: "robusto", pelle: 3, viso: "paffuto", occhi: "occhiolino", iride: 0, sopracc: "folte", naso: "patata", bocca: "sorrisetto",
        capelli: "stempiato", colCap: 6, barba: "baffoni", capo: "gilet", maglia: 3, sotto: "pantaloni", pantaloni: 2, modScarpe: "eleganti", scarpe: 5,
        cappello: "coppola", colAcc: 7, mano: "tazza", colMano: 8, occhiali: "nessuno" } },
    { id: "gina", nome: "Gina", livello: "medio", frase: "La cuoca: ti serve la sconfitta su un piatto.",
      omino: { forma: "donna", corpo: "robusto", pelle: 5, viso: "paffuto", occhi: "dolci", iride: 1, sopracc: "morbide", naso: "tondo", bocca: "sorrisone",
        capelli: "ricciraccolti", colCap: 0, capo: "grembiule", maglia: 8, sotto: "gonnalunga", pantaloni: 0, modScarpe: "sneakers", scarpe: 1,
        cappello: "chef", orecchini: "cerchioni", rossetto: "tinta", colRossetto: 1, mano: "pizza", occhiali: "nessuno" } },
    { id: "toto", nome: "Totò", livello: "medio", frase: "Il nonno saggio: lento, ma non perde un colpo.",
      omino: { forma: "uomo", corpo: "medio", pelle: 1, viso: "lungo", occhi: "assonnati", iride: 4, sopracc: "folte", naso: "aquilino", bocca: "sorriso", segno: "rughe",
        capelli: "chierica", colCap: 6, barba: "barbalunga", capo: "cardigan", maglia: 2, sotto: "pantaloni", pantaloni: 0, modScarpe: "pantofole", scarpe: 5,
        cappello: "borsalino", colAcc: 7, occhiali: "tondi", animale: "cane", colAnimale: 4 } },
    { id: "ciro", nome: "Ciro", livello: "facile", frase: "Tifoso scatenato: attacca sempre, anche quando non deve.",
      omino: { forma: "uomo", corpo: "snello", pelle: 4, viso: "lungo", occhi: "grandi", iride: 0, sopracc: "alzate", naso: "largo", bocca: "risata",
        capelli: "riccicorti", colCap: 0, capo: "calcio", maglia: 6, stampa: "numero", sotto: "pantaloncini", pantaloni: 7, modScarpe: "sneakers", scarpe: 1,
        collo: "sciarpa", colCollo: 6, mano: "bandiera", colMano: 6, pittura: "sportivo", cappello: "nessuno", occhiali: "nessuno" } },
    { id: "lella", nome: "Lella", livello: "facile", frase: "La sognatrice: a volte si distrae e regala punti.",
      omino: { forma: "donna", corpo: "snello", pelle: 7, viso: "cuore", occhi: "stelline", iride: 7, sopracc: "sottili", naso: "puntino", bocca: "micio", guance: "rosse",
        capelli: "codini", colCap: 10, capo: "felpa", maglia: 4, stampa: "arcobaleno", sotto: "gonnapieghe", pantaloni: 8, modScarpe: "stivaletti", scarpe: 1,
        occhiali: "cuore", animale: "gatto", colAnimale: 3, cappello: "nessuno" } }
  ];
  // 😀 i gettoni dei Bot (13 nov 2026, avatar spenti: GETTONI in core.js): emoji e colore fissi, sempre uguali, così si riconoscono
  var BOT_GETTONE = {
    matt: { g: 1, e: "🦁", c: ["oro", "arancio", "rosso"] }, angela: { g: 1, e: "🔮", c: ["viola", "blu", "lilla"] },
    rosa: { g: 1, e: "🌺", c: ["magenta", "lampone", "rosso"] }, peppe: { g: 1, e: "🦊", c: ["verde", "lime", "acqua"] },
    gina: { g: 1, e: "🍕", c: ["arancio", "oro", "rosso"] }, toto: { g: 1, e: "🦉", c: ["blu", "ciano", "viola"] },
    ciro: { g: 1, e: "⚽", c: ["ciano", "acqua", "blu"] }, lella: { g: 1, e: "🦄", c: ["lampone", "magenta", "viola"] }
  };
  function gtOn() { return !!(cuore.GETTONI && window.SGGettone); }
  function gettoneBot(id, salvato) {
    var G = window.SGGettone; if (!G) return null;
    var g = G.eGettone(salvato) ? G.norm(salvato) : (BOT_GETTONE[id] ? G.norm(BOT_GETTONE[id]) : G.riserva(id));
    if (g) { delete g.r; if (g.c && g.c[0]) g.k = g.c[0]; }   // (il colore del Bot è sempre il suo 1°)
    return g;
  }
  var botCast = null, botSalvatoA = 0;
  // i bot salvati (dalla scheda del proprietario o da questo telefono) sopra quelli di partenza: per id, con ogni campo controllato
  function botDaSalvati(lista) {
    lista = Array.isArray(lista) ? lista : [];
    return BOT_PARTENZA.map(function (b) {
      var s = lista.filter(function (x) { return x && x.id === b.id; })[0] || {};
      var nome = typeof s.nome === "string" ? s.nome.replace(/\s+/g, " ").trim().slice(0, BOT_MAX_NOME) : "";
      var frase = typeof s.frase === "string" ? s.frase.replace(/\s+/g, " ").trim().slice(0, BOT_MAX_FRASE) : "";
      return { id: b.id, nome: nome.length >= 2 ? nome : b.nome, livello: BOT_LIVELLI.indexOf(s.livello) >= 0 ? s.livello : b.livello,
        frase: frase || b.frase, omino: s.omino && typeof s.omino === "object" ? s.omino : b.omino, gettone: gettoneBot(b.id, s.gettone) };
    });
  }
  function botTutti() {
    if (!botCast) { var m = null; try { m = JSON.parse(localStorage.getItem("sg-bot") || "null"); } catch (e) {} botCast = botDaSalvati(m); }
    return botCast;
  }
  function copiaBot(b) {
    if (gtOn()) return { id: b.id, nome: b.nome, livello: b.livello, frase: b.frase, bot: true, omino: gettoneBot(b.id, b.gettone) };   // 😀
    return { id: b.id, nome: b.nome, livello: b.livello, frase: b.frase, bot: true,
      omino: window.SGOmino ? SGOmino.norm(b.omino) : JSON.parse(JSON.stringify(b.omino || null)) };
  }
  // n bot diversi, sempre gli stessi nello stesso ordine: prima quelli del livello chiesto, poi i più vicini (facile ↔ difficile per ultimi).
  // escludi: id o nomi da non usare (es. i nomi delle persone in partita, così nessun bot si chiama come uno di loro).
  // caso: true = a sorte (es. il Bot del torneino), sempre preferendo il livello chiesto. Più di 8: "Bot 9", "Bot 10"…
  function botPrendi(n, o) {
    o = o || {}; n = Math.max(0, Math.floor(+n) || 0);
    var via = [].concat(o.escludi || []).map(function (x) { return x && typeof x === "object" ? (x.id || x.nome) : x; }).filter(function (x) { return x != null; }).map(String);
    var fuori = function (id, nome) { return via.some(function (x) { return x === id || stessoNome(x, nome); }); };
    var lv = BOT_LIVELLI.indexOf(o.livello), lista = botTutti().filter(function (b) { return !fuori(b.id, b.nome); });
    if (o.caso) lista = mischia(lista);
    if (lv >= 0) lista = lista.map(function (b, i) { return { b: b, d: Math.abs(BOT_LIVELLI.indexOf(b.livello) - lv) * 100 + i }; })
      .sort(function (x, y) { return x.d - y.d; }).map(function (x) { return x.b; });
    var out = lista.slice(0, n).map(copiaBot);
    for (var k = BOT_PARTENZA.length + 1; out.length < n && k < 99; k++) {
      var nome = "Bot " + k; if (fuori("bot" + k, nome)) continue;
      out.push({ id: "bot" + k, nome: nome, livello: lv >= 0 ? BOT_LIVELLI[lv] : "medio", frase: "", bot: true, omino: window.SGOmino ? SGOmino.norm(SGOmino.casuale(nome)) : null });
    }
    return out;
  }
  function botDaId(id) { var b = botTutti().filter(function (x) { return x.id === id; })[0]; return b ? copiaBot(b) : null; }
  // salva i bot (solo il proprietario): su questo telefono e nella sua scheda pubblica, dove li leggono tutti
  function salvaBot(lista) {
    botCast = botDaSalvati(lista); botSalvatoA = Date.now(); cuore.schedaProp = null;   // (la scheda letta prima ha i bot vecchi)
    try { localStorage.setItem("sg-bot", JSON.stringify(botCast)); } catch (e) {}
    var N = window.SGNube;
    if (N && N.pubblica && eProprietario()) try { Promise.resolve(N.pubblica({ bot: botCast })).catch(function () {}); } catch (e) {}
  }
  // i bot del proprietario dalla sua scheda pubblica (all'avvio e aprendo "🤖 I Bot"). poi(cambiati)
  function caricaBot(poi) {
    var N = window.SGNube, t0 = Date.now();
    function fine(c) { if (poi) try { poi(c); } catch (e) {} }
    if (!(N && N.cercaNome)) return fine(false);
    try {
      schedaDelProprietario().then(function (sch) {
        if (!sch || !Array.isArray(sch.bot) || t0 < botSalvatoA) return fine(false);   // (salvati qui nel frattempo: valgono quelli)
        var nuovi = botDaSalvati(sch.bot);
        if (JSON.stringify(nuovi) === JSON.stringify(botTutti())) return fine(false);
        botCast = nuovi;
        try { localStorage.setItem("sg-bot", JSON.stringify(nuovi)); } catch (e) {}
        fine(true);
      }).catch(function () { fine(false); });
    } catch (e) { fine(false); }
  }
  // "🤖 I Bot" (solo il proprietario, dal suo profilo): gli 8 bot in una griglia, un tocco apre la scheda di uno
  function schermataBot(indietro) {
    var s = schermata({ icona: "🤖", titolo: "I Bot", sotto: "Uguali per tutti, in tutti i giochi", indietro: indietro });
    s.classList.add("bot-cast");
    var griglia = el("div", { class: "bc-griglia" });
    function disegna() {
      svuota(griglia);
      botTutti().forEach(function (b) {
        griglia.appendChild(el("button", { class: "bc-bot liv-" + b.livello, type: "button", onclick: function () { schermataUnBot(b.id, function () { schermataBot(indietro); }); } }, [
          el("span", { class: "bc-av", "aria-hidden": "true", html: gtOn() ? SGGettone.svg(gettoneBot(b.id, b.gettone), { quadrato: true }) : window.SGOmino ? SGOmino.svg(b.omino, { busto: true }) : "🤖" }),
          el("b", { text: b.nome }), el("small", { text: BOT_LIV[b.livello] }) ]));
      });
    }
    s._contenuto.appendChild(griglia);
    s._contenuto.appendChild(el("p", { class: "modulo-nota bc-nota", text: "Tocca un bot per cambiargli avatar, nome, frase e livello. Li vedono tutti così, in tutti i giochi. Nei tasti resta scritto solo «Bot»." }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", type: "button", text: "↺ Tutti come all'inizio", onclick: function () {
      chiediConferma("Rimettere tutti i bot come all'inizio?", "Nomi, avatar, frasi e livelli tornano quelli di partenza, per tutti.", "↺ Rimetti", function () { salvaBot([]); disegna(); });
    } }));
    mostra(s); disegna();
    caricaBot(function (c) { if (c && s.isConnected) disegna(); });   // (cambiati da un altro telefono del proprietario)
  }
  // la scheda di un bot: avatar (col camerino), nome, frase e livello. b = la bozza (resta mentre si cambia l'avatar)
  function schermataUnBot(id, indietro, b) {
    var orig = botDaId(id); if (!orig) return indietro();
    var origG = (botTutti().filter(function (x) { return x.id === id; })[0] || {}).gettone || gettoneBot(id);
    b = b || { nome: orig.nome, frase: orig.frase, livello: orig.livello, omino: orig.omino, gettone: origG };
    var disegnoBot = function () { return gtOn() ? SGGettone.svg(b.gettone || gettoneBot(id), { quadrato: true }) : SGOmino.svg(b.omino); };
    var parti = BOT_PARTENZA.filter(function (x) { return x.id === id; })[0];
    var cambiato = function () { return b.nome !== orig.nome || b.frase !== orig.frase || b.livello !== orig.livello || (gtOn() ? JSON.stringify(b.gettone) !== JSON.stringify(origG) : JSON.stringify(SGOmino.norm(b.omino)) !== JSON.stringify(orig.omino)); };
    var s = schermata({ icona: "🤖", titolo: orig.nome, sotto: "Come lo vedono tutti", indietro: function () {
      leggi();
      if (cambiato()) chiediConferma("Uscire senza salvare?", "Le modifiche a " + orig.nome + " si perdono.", "Esci", indietro); else indietro();
    } });
    s.classList.add("bot-scheda");
    var palco = el("div", { class: "bc-palco", "aria-hidden": "true", html: disegnoBot() });
    var tAv = el("button", { class: "btn btn-fantasma bc-cambia", type: "button", text: gtOn() ? "✏️ Cambia emoji e colore" : "✏️ Cambia avatar", onclick: function () {
      leggi();
      if (gtOn()) {   // 😀 la stessa scelta delle persone: emoji e 3 colori (il Bot usa sempre il 1°)
        var bz = { gettone: b.gettone, nome: b.nome };
        return cuore.schermataGettone(function () { b.gettone = gettoneBot(id, bz.gettone); schermataUnBot(id, indietro, b); }, function () { schermataUnBot(id, indietro, b); }, { bozza: bz });
      }
      var bozza = { nome: b.nome, omino: b.omino, omini: null };
      cuore.schermataOmino(function () { b.omino = bozza.omino || b.omino; schermataUnBot(id, indietro, b); }, bozza);
    } });
    var nome = el("input", { class: "link-campo bc-campo", type: "text", maxlength: String(BOT_MAX_NOME), placeholder: "Nome del bot", autocomplete: "off", autocapitalize: "words" });
    var frase = el("input", { class: "link-campo bc-campo", type: "text", maxlength: String(BOT_MAX_FRASE), placeholder: "Il suo carattere in una frase", autocomplete: "off" });
    nome.value = b.nome; frase.value = b.frase;
    var livelli = el("div", { class: "bc-livelli", role: "group", "aria-label": "Livello preferito" });
    function disegnaLivelli() {
      svuota(livelli);
      BOT_LIVELLI.forEach(function (lv) {
        livelli.appendChild(el("button", { class: "bc-liv liv-" + lv + (b.livello === lv ? " on" : ""), type: "button", text: BOT_LIV[lv], onclick: function () { b.livello = lv; aggLivelli(); } }));
      });
    }
    function aggLivelli() { [].forEach.call(livelli.children, function (x, i) { x.classList.toggle("on", BOT_LIVELLI[i] === b.livello); }); }   // (solo la classe: niente lampeggio)
    disegnaLivelli();
    var avviso = el("div", { class: "link-avviso bc-avviso", "aria-live": "polite" });
    function leggi() { b.nome = nome.value.replace(/\s+/g, " ").trim().slice(0, BOT_MAX_NOME); b.frase = frase.value.replace(/\s+/g, " ").trim().slice(0, BOT_MAX_FRASE); }
    s._contenuto.appendChild(el("div", { class: "bc-testa" }, [ palco, el("div", { class: "bc-lato" }, [ tAv,
      el("button", { class: "btn btn-fantasma bc-cambia", type: "button", text: "↺ Come all'inizio", onclick: function () {
        if (!parti) return;
        b.nome = parti.nome; b.frase = parti.frase; b.livello = parti.livello; b.omino = parti.omino; b.gettone = gettoneBot(id);
        nome.value = b.nome; frase.value = b.frase; aggLivelli(); palco.innerHTML = disegnoBot(); avviso.textContent = "";
      } }) ]) ]));
    s._contenuto.appendChild(el("label", { class: "bc-etich", text: "Nome" })); s._contenuto.appendChild(nome);
    s._contenuto.appendChild(el("label", { class: "bc-etich", text: "Carattere" })); s._contenuto.appendChild(frase);
    s._contenuto.appendChild(el("label", { class: "bc-etich", text: "Livello preferito" })); s._contenuto.appendChild(livelli);
    s._contenuto.appendChild(avviso);
    s._piede.appendChild(el("button", { class: "btn btn-primario", type: "button", text: "💾 Salva", onclick: function () {
      leggi();
      if (b.nome.length < 2) { avviso.textContent = "Il nome deve avere almeno 2 lettere."; nome.focus(); return; }
      if (/^bot\b/i.test(b.nome)) { avviso.textContent = "«Bot» resta per i tasti: dagli un nome vero."; nome.focus(); return; }
      if (botTutti().some(function (x) { return x.id !== id && stessoNome(x.nome, b.nome); })) { avviso.textContent = "C'è già un bot che si chiama così."; nome.focus(); return; }
      salvaBot(botTutti().map(function (x) { return x.id === id ? { id: id, nome: b.nome, frase: b.frase || (parti && parti.frase) || "", livello: b.livello, omino: (SGOmino.__avatar && SGOmino.__avatar.norm ? SGOmino.__avatar.norm(b.omino) : SGOmino.norm(b.omino)), gettone: b.gettone || null } : x; }));
      pillola("bot", "🤖 " + b.nome + " salvato: lo vedono tutti così", "verde", 2500);
      indietro();
    } }));
    mostra(s);
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.botDaId = botDaId; cuore.botPrendi = botPrendi; cuore.botTutti = botTutti; cuore.caricaBot = caricaBot; cuore.copiaBot = copiaBot;
  cuore.schermataBot = schermataBot;
})();
