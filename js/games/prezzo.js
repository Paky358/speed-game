/* =========================================================
   GIOCO — «Il Prezzo è Giusto!» (il nome per ora: prima di un lancio pubblico va cambiato)
   Nello studio del game show (js/studio.js). Prima di tutto ONLINE (ognuno dal suo telefono, nella Sala, da 2 a 8:
   tutti giocano sempre insieme), poi sullo stesso telefono (a turno) e «🤖 Contro il Bot».
   Due formati, li sceglie chi ospita (regola «Formato»):
   - 📺 Come in TV: sigla, L'Offerta (sipario, 20 secondi, vince chi va più vicino SENZA superare; a vista col «+1 €»
     cattivo o segrete; se sforano tutti si rifà una volta), chi vince l'Offerta sceglie il gioco a premi (si gioca tutti
     insieme), la Ruota del 100 e la Vetrina finale con «VINCI TUTTO!»; alla fine il carrello dei premi e la classifica.
   - 🎯 Solo il prezzo: esce un oggetto, 20 secondi, vince chi va più vicino (sopra o sotto; «Senza sforare» è una regola),
     chi lo indovina preciso prende il bonus del PREZZO GIUSTO; 10 oggetti (6 Veloce, 15 Serata lunga), l'ultimo vale doppio.
   Come è fatto:
   - le regole senza grafica (esitoOfferta, esitoRuota, piano…) in fondo sono anche in window.__prezzo per le prove;
   - UN motore solo (motore): tiene la partita e manda a tutti la "foto" (vm) con fase, sotto e la chiave del passo k.
     Online è l'host; contro il Bot e sullo stesso telefono gira sul telefono e basta (i Bot giocano da soli col tempo,
     sullo stesso telefono la regia passa il telefono a turno e le fasi non hanno scadenza);
   - OGNI telefono fa la sua regia dello studio guardando la foto (regiaPasso): un passo non si rifà due volte;
   - i giochi a premi sono oggetti registrati da file a parte (window.SG_PREZZO_PREMI, vedi js/games/prezzo-premi-piu.js);
   - i pezzi da vedere e i suoni stanno in js/games/prezzo-scena.js (window.SGPrezzoScena);
   - i prodotti: window.SG_PREZZO = { anno, prodotti: [...], vetrine: [...] } dai file data/prezzo-*.js (quanti siano).
   ========================================================= */
(function () {
  "use strict";

  var ID = "prezzo", NOME = "Il Prezzo è Giusto!", LOGO = ["IL PREZZO", "È GIUSTO!"];
  var ST = window.SGStudio;
  function Z() { return window.SGPrezzoScena; }
  function E(v) { return Z().fmtE(v); }
  function N(v) { return Z().fmtN(v); }

  var MIN_ON = 2, MAX_ON = 8;
  // i tempi (ms). Online (e contro il Bot) per tutti insieme; sullo stesso telefono (TL) a testa
  // (scegli e intro: il tempo per leggere le regole dei giochi a premi, anche per chi non li conosce)
  var T = { prodotto: 4800, offri: 20000, rifai: 12000, sopra: 4400, scegli: 15000, intro: 10000, punti: 10000, vetScegli: 12000, vetOffri: 30000, giro: 15000, decidi: 10000 };
  var TL = { offri: 25000, vetScegli: 15000, vetOffri: 35000, giro: 20000, decidi: 15000, scegli: 15000 };
  // I punti (22 ott 2026, rifatti con decine di migliaia di puntate simulate: .agents/skills/prova-nel-browser/prezzo/simulazione). Prima la
  // fortuna e la Vetrina pesavano troppo (CENTO +1.000, giro bonus +1.000/+500, Vetrina ×3 e VINCI TUTTO +1.500 entro il 5%):
  // chi era primo dopo le manche vinceva una volta su due e un CENTO cambiava il vincitore una volta su quattro.
  // Ora la Ruota (quasi tutta fortuna) dà 200 a chi vince e +300 per CENTO, la Vetrina una volta e mezza un'Offerta e VINCI
  // TUTTO è più raro (entro il 3%): scelti tra 50 combinazioni provate (.agents/skills/prova-nel-browser/prezzo/simulazione/cerca.js).
  var SCALA = [300, 150, 75], SCALA_R = [200, 100, 50], SCALA_V = [450, 225, 110];
  var BONUS_GIUSTO = 500, BONUS_TUTTO = 1000, TUTTO_PCT = 0.03, BONUS_CENTO = 300, GIRO_100 = 300, GIRO_VERDE = 150;
  var N_OGG = { veloce: 6, puntata: 10, lunga: 15 }, N_GIRI = { veloce: 2, puntata: 3, lunga: 4 };
  // i passi della rivelazione (li usa l'host per sapere quanto aspettare e la regia per andare a tempo)
  var RV = { cam: 650, rullo: 1300, cifra: 280, dopoConta: 450, riga: 420, banner: 2000, cattivo: 2500, leggii: 2700 };
  var RVET = { pezzo: 2300, prezzo: 850, cifra: 240, riga: 600, banner: 2100, tutto: 3900, mist: 1700, pezzoB: 450, riass: 900 };
  var RRU = { riga: 650, cento: 2700, banner: 2100 };
  var RU_FERMA = 6500;   // dopo l'ultima spinta della Ruota: la ruota frena (fino a ~5,5 s) e il numero resta un attimo

  // =========================================================
  //  LE REGOLE (senza grafica)
  // =========================================================
  function tondo2(v) { return Math.round((+v || 0) * 100) / 100; }
  function mescola(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = b[i]; b[i] = b[j]; b[j] = x; } return b; }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  // i posti a pari merito: [{ id, d }] (d = distanza: più piccola = meglio) → { id: posto }
  function posizioni(lista) {
    var out = {};
    lista.forEach(function (x) { out[x.id] = 1 + lista.filter(function (y) { return y.d < x.d - 1e-9; }).length; });
    return out;
  }
  // punti per posto: 1° e 2° sempre, il 3° solo con almeno 4 giocatori
  // (24 ott 2026, il proprietario: «quando perdo una manche leggo +… sul mio personaggio, ma non capisco perché se ho perso»: in due
  //  il secondo è chi ha perso; il secondo posto vale da 3 giocatori in su, il terzo da 4)
  function puntiPos(pos, n, scala) { return pos === 1 ? scala[0] : (pos === 2 && n >= 3) ? scala[1] : (pos === 3 && n >= 4) ? scala[2] : 0; }
  // L'Offerta (e la Vetrina): off = { id: valore }.
  // o = { senzaSforare (chi supera oltre il margine non vale), pct (margine: 2%, la Vetrina 3%), scala, bonus (PREZZO GIUSTO),
  //       molt (l'ultimo oggetto vale doppio), ordine (chi ha offerto prima: serve al «+1 €»), n (quanti giocano) }
  function esitoOfferta(prezzo, off, o) {
    o = o || {};
    var mg = Z().margine(prezzo, o.pct), ids = Object.keys(off || {}), molt = o.molt || 1, n = o.n || ids.length;
    var righe = ids.map(function (id) {
      var v = tondo2(off[id]);
      return { id: id, v: v, d: Math.abs(v - prezzo), sopra: v > prezzo + mg + 1e-9, giusto: Math.abs(v - prezzo) <= mg + 1e-9 };
    });
    var cand = righe.filter(function (r) { return !(o.senzaSforare && r.sopra); });
    var pos = posizioni(cand);
    righe.forEach(function (r) {
      r.pos = pos[r.id] || 0;
      r.punti = r.pos ? puntiPos(r.pos, n, o.scala || SCALA) * molt : 0;
      if (r.giusto && r.pos) r.punti += (o.bonus == null ? BONUS_GIUSTO : o.bonus) * molt;
    });
    righe.sort(function (a, b) { return a.v - b.v; });
    var vince = righe.filter(function (r) { return r.pos === 1; }).map(function (r) { return r.id; });
    var e = { prezzo: prezzo, righe: righe, vince: vince, giusti: righe.filter(function (r) { return r.giusto && r.pos; }).map(function (r) { return r.id; }),
      tuttiSopra: !!(o.senzaSforare && righe.length && !cand.length), nessuno: !righe.length, cattivo: null };
    // «😈 Che cattiveria!»: chi vince ha detto esattamente 1 € (o un passo dei centesimi) più di uno che aveva offerto prima di lui
    if (vince.length === 1 && o.ordine) {
      var w = righe.filter(function (r) { return r.id === vince[0]; })[0], pz = Z().passo(prezzo);
      righe.forEach(function (r) {
        if (e.cattivo || r.id === w.id || r.sopra) return;
        var diff = tondo2(w.v - r.v), io = o.ordine.indexOf(w.id), lui = o.ordine.indexOf(r.id);
        if ((Math.abs(diff - 1) < 1e-9 || (pz < 1 && Math.abs(diff - pz) < 1e-9)) && lui >= 0 && io > lui) e.cattivo = { chi: w.id, a: r.id, piu: diff };
      });
    }
    return e;
  }
  // La Vetrina finale, anche con la misteriosa: off = { id: valore }, sc = { id: "a" | "b" } (la vetrina di ognuno: «a» quella
  // vista da tutti, «b» la misteriosa), totA e totB i loro totali, n quanti giocano. Le vetrine sono diverse, quindi vince chi
  // si avvicina di più IN PERCENTUALE senza superare (fino al 3% sopra vale ancora): con una vetrina sola è la stessa classifica
  // di sempre. Entro il 3% «VINCI TUTTO!» (+1.000).
  function esitoVetrina(off, sc, totA, totB, n) {
    var ids = Object.keys(off || {});
    var righe = ids.map(function (id) {
      var w = sc && sc[id] === "b" && totB > 0 ? "b" : "a", tot = w === "b" ? totB : totA, v = tondo2(off[id]);
      return { id: id, w: w, tot: tot, v: v, d: Math.abs(v - tot) / tot, sopra: v > tot + Z().margine(tot, 0.03) + 1e-9 };
    });
    var cand = righe.filter(function (r) { return !r.sopra; }), pos = posizioni(cand), tutti = [];
    righe.forEach(function (r) {
      r.pos = pos[r.id] || 0;
      r.punti = r.pos ? puntiPos(r.pos, n || ids.length, SCALA_V) : 0;
      if (!r.sopra && r.v >= r.tot * (1 - TUTTO_PCT)) { r.tutto = true; r.punti += BONUS_TUTTO; tutti.push(r.id); }
    });
    righe.sort(function (a, b) { return a.d - b.d; });
    return { prezzo: totA, totB: totB, righe: righe, vince: righe.filter(function (r) { return r.pos === 1; }).map(function (r) { return r.id; }), tutti: tutti,
      tuttiSopra: !!(righe.length && !cand.length), nessuno: !righe.length,
      ordine: righe.slice().sort(function (a, b) { return (b.sopra - a.sopra) || (b.d - a.d); }).map(function (r) { return r.id; }) };   // dalla più lontana alla più vicina
  }
  // La Ruota del 100: g = { id: { v1, v2 } }. Vince chi va più vicino a 100 senza superarlo; 100 esatto +300 (BONUS_CENTO)
  function esitoRuota(g, ids) {
    var righe = ids.map(function (id) {
      var x = g[id] || {}, tot = (x.v1 || 0) + (x.v2 || 0);
      return { id: id, v1: x.v1 || 0, v2: x.v2 || 0, tot: tot, out: tot > 100, cento: tot === 100 };
    });
    var cand = righe.filter(function (r) { return !r.out && r.tot > 0; }).map(function (r) { return { id: r.id, d: 100 - r.tot }; });
    var pos = posizioni(cand), n = ids.length;
    righe.forEach(function (r) { r.pos = pos[r.id] || 0; r.punti = r.pos ? puntiPos(r.pos, n, SCALA_R) : 0; if (r.cento) r.punti += BONUS_CENTO; });
    righe.sort(function (a, b) { return (a.out - b.out) || (b.tot - a.tot); });
    return { righe: righe, vince: righe.filter(function (r) { return r.pos === 1; }).map(function (r) { return r.id; }), cento: righe.filter(function (r) { return r.cento; }).map(function (r) { return r.id; }) };
  }
  function puntiBonus(b) { return b === 100 ? GIRO_100 : (b === 5 || b === 15) ? GIRO_VERDE : 0; }
  // la puntata: l'ordine dei passi. nPremi = quanti giochi a premi ci sono (0 = niente giochi a premi)
  function piano(formato, durata, nPremi) {
    var p = ["apertura"], i;
    if (formato === "solo") {
      var n = N_OGG[durata] || 10;
      for (i = 1; i <= n; i++) {
        p.push("oggetto");
        if (i < n && (i % 3 === 0 || i === n - 1)) p.push("punti");   // la classifica ogni 3 oggetti e prima dell'ultimo
      }
      if (p[p.length - 2] === "punti" && p[p.length - 3] === "punti") p.splice(p.length - 2, 1);
    } else {
      var giri = N_GIRI[durata] || 3;
      for (i = 0; i < giri; i++) {
        p.push("offerta"); if (nPremi) p.push("premio"); p.push("punti");
        if (durata === "lunga" && i === 1) p.push("ruota", "punti");   // in Serata lunga la Ruota anche a metà, come in America
      }
      p.push("ruota", "punti", "vetrina");
    }
    p.push("carrello", "fine");
    return p;
  }
  // il Bot: il prezzo vero con un errore a caso (facile ±45%, medio ±25%, difficile ±12%); prudente = tende a stare sotto
  var ERR = { facile: 0.45, medio: 0.25, difficile: 0.12 };
  function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function stimaBot(prezzo, liv, prudente) {
    var e = ERR[liv] || 0.25, f = Math.exp(Math.max(-2.5, Math.min(2.5, gauss())) * e * 0.85);
    if (prudente) f *= 1 - e * 0.4;
    return Math.max(Z().passo(prezzo), Z().arrotonda(prezzo * f, prezzo));
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }

  // ---------------- i prodotti ----------------
  // la foto vera (data/prezzo-foto.js: id → "percorso su Commons|larghezza"; i pezzi delle vetrine sono "idVetrina#n")
  function conFoto(o, id) { if (o && o.f === undefined) o.f = (window.SG_PREZZO_FOTO || {})[id] || null; return o; }
  // i prodotti senza una foto controllata restano, con l'emoji, finché il proprietario non manda la foto (deciso il 23 ott 2026)
  function prodotti() {
    var d = window.SG_PREZZO || {};
    return (d.prodotti || []).filter(function (p) { return p && p.id && p.nome && +p.prezzo > 0 && Z().CAT[p.cat]; }).map(function (p) { return conFoto(p, p.id); });
  }
  function vetrine() {
    var d = window.SG_PREZZO || {};
    return (d.vetrine || []).filter(function (v) { return v && v.titolo && v.pezzi && v.pezzi.length >= 2 && v.pezzi.every(function (x) { return x && x.nome && +x.prezzo > 0; }); })
      .map(function (v) { v.pezzi.forEach(function (x, i) { conFoto(x, (v.id || v.titolo) + "#" + i); }); return v; });
  }
  function annoDati() { return (window.SG_PREZZO || {}).anno || 2026; }
  var CH_VISTI = "sg-prezzo-visti", CH_VETR = "sg-prezzo-vetrine";
  function leggiLS(k) { try { var v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function scriviLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // il cesto della partita: i prodotti delle categorie accese, mai due volte nella partita e (finché ce ne sono) mai quelli
  // usciti nelle ultime serate su questo telefono (gli ultimi 300). usati = { id: 1 } dei prodotti già usciti nella partita:
  // sta nello stato della partita (H.usati), così dopo una ripresa non tornano gli stessi
  function Cesto(cats, usati) {
    usati = usati || {}; var visti = {};
    leggiLS(CH_VISTI).forEach(function (id) { visti[id] = 1; });
    function nuovo(p) { return !visti[p.id]; }
    function pesca(filtro, n) {
      n = n || 1;
      var tutti = prodotti().filter(function (p) { return !usati[p.id]; });
      var acc = tutti.filter(function (p) { return cats.indexOf(p.cat) >= 0; });
      var liste = [acc.filter(nuovo), acc, tutti.filter(nuovo), tutti], out = [];
      for (var q = 0; q < liste.length && out.length < n; q++) {
        var l = mescola(liste[q].filter(function (p) { return out.indexOf(p) < 0 && (!filtro || filtro(p)); }));
        out = out.concat(l.slice(0, n - out.length));
      }
      if (out.length) {
        out.forEach(function (p) { usati[p.id] = 1; visti[p.id] = 1; });
        var ids = out.map(function (p) { return p.id; });
        scriviLS(CH_VISTI, leggiLS(CH_VISTI).filter(function (id) { return ids.indexOf(id) < 0; }).concat(ids).slice(-300));
      }
      return out.map(copia);
    }
    return { pesca: pesca };
  }
  // nonSegnare: la vetrina misteriosa, che conta come «già uscita» solo se qualcuno la scopre (segnaVista)
  function pescaVetrina(escludi, nonSegnare) {
    var tutte = vetrine().filter(function (v) { return !escludi || escludi.indexOf(v.id || v.titolo) < 0; }); if (!tutte.length) return null;
    var viste = leggiLS(CH_VETR), nuove = tutte.filter(function (v) { return viste.indexOf(v.id || v.titolo) < 0; });
    var v = mescola(nuove.length ? nuove : tutte)[0];
    if (!nonSegnare) segnaVista(v);
    return copia(v);
  }
  function segnaVista(v) { var k = v.id || v.titolo; scriviLS(CH_VETR, leggiLS(CH_VETR).filter(function (x) { return x !== k; }).concat([k]).slice(-40)); }
  function pubProd(p) { return p ? { id: p.id, e: p.e, f: p.f || null, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat, cent: Z().conCent(p.prezzo) } : null; }

  // ---------------- i giochi a premi registrati ----------------
  function premi() { return window.SG_PREZZO_PREMI || {}; }
  function premioDi(tipo) { var g = premi()[tipo]; return g && typeof g.prepara === "function" && typeof g.fine === "function" ? g : null; }
  function infoPremio(tipo) { var g = premioDi(tipo) || {}; return { tipo: tipo, nome: g.nome || tipo, icona: g.icona || "🎁", regola: g.regola || "", spiega: g.spiega || g.regola || "" }; }

  // ---------------- le impostazioni ----------------
  function leggiImp(imp, modo) {
    imp = imp || {};
    var cats = (imp.categorie || []).filter(function (c) { return Z().CAT[c]; });
    if (cats.length < 3) cats = Z().ORDINE_CAT.slice();
    return { formato: imp.formato === "solo" ? "solo" : "tv", durata: N_GIRI[imp.durata] ? imp.durata : "puntata",
      offerte: imp.offerte === "segrete" || imp.offerte === "vista" ? imp.offerte : (modo === "telefono" ? "segrete" : "vista"),
      sforare: imp.sforare === true, cats: cats, liv: ERR[imp.liv] ? imp.liv : "medio", nBot: [1, 3, 5].indexOf(imp.nBot) >= 0 ? imp.nBot : 3 };
  }

  // =========================================================
  //  IL MOTORE: tiene la partita (online sul telefono dell'host; col Bot e sullo stesso telefono su questo telefono)
  // =========================================================
  function motore(t, modo) {
    var online = modo === "online";
    if (online && !(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    if (!prodotti().length) return niente(t);
    var imp = leggiImp(t.impostazioni, modo);
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    // io che tengo la partita: "host", oppure (host di riserva) l'id da amico di chi ha preso il posto dell'host sparito
    var IO = (online && t.mioId) || "host";
    var H = { modo: modo, fase: "lobby", sotto: null, k: 0, partita: 0, codice: online ? "…" : "", pronta: !online, imp: imp,
      players: [], guarda: [], arrivi: [], scadenza: 0, piano: [], ip: -1, avanti: [], ultimo: {} };
    if (modo === "telefono") H.players = (t.giocatori || []).map(function (n, i) { return { id: "p" + i, nome: n, omino: null, punti: 0, carrello: [] }; });
    else {
      H.players = [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0, carrello: [] }];
      if (modo === "bot") {
        var cast = (window.SG && SG.bot && SG.bot.prendi) ? SG.bot.prendi(imp.nBot, { livello: imp.liv, escludi: [nomeHost] }) : [];
        cast.forEach(function (b, i) { H.players.push({ id: "b" + i, nome: b.nome, omino: b.omino || null, punti: 0, carrello: [], bot: true }); });
      }
    }
    // la partita di prima (online: l'host ha ricaricato la pagina o riaperto l'app, oppure, con t.ripresa.daRiserva, l'host
    // è sparito e la porta avanti questo telefono). Gli amici non si danno per usciti: si aspettano ("attesi") e rientrano
    // da soli col loro join (stesso id); chi non torna entro 10 secondi esce, come chi se ne va (vedi riprendi)
    var R0 = online && t.ripresa && t.ripresa.stato, riprendo = !!(R0 && R0.fase && R0.fase !== "lobby" && R0.players), attesi = {}, tAttesi = null;
    if (riprendo) {
      H = R0; H.modo = modo; H.pronta = false; H.codice = H.codice || "…";
      H.guarda = H.guarda || []; H.arrivi = H.arrivi || []; H.avanti = H.avanti || []; H.ultimo = H.ultimo || {}; H.usati = H.usati || {};
      H.cesto = Cesto(H.imp.cats, H.usati);
      H.players.forEach(function (p) {
        p.forse = false;
        if (p.id === IO) { p.via = false; p.omino = t.mioOmino(p.nome) || p.omino || null; }
        else if (!p.via) attesi[p.id] = 1;
      });
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function nome(id) { var p = pById(id); return p ? p.nome : "?"; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function bots() { return H.players.filter(function (p) { return p.bot && !p.via; }); }
    function umani() { return H.players.filter(function (p) { return !p.bot && !p.via; }); }
    function servono() { return online ? Math.floor(umani().length / 2) + 1 : 1; }
    var to = null, toBot = [];
    function ferma() { clearTimeout(to); to = null; toBot.forEach(clearTimeout); toBot = []; }
    // il gioco è stato portato via dal core (Sala passata a un amico, Cambia gioco): niente più timer né Bot
    function vivo() { if (H.fase === "lobby" || H.fase === "fine") return true; return !(R && R.t === t && R.S && !R.S.vivo() && !R.fineFatta); }
    function dopo(ms, f) { clearTimeout(to); to = setTimeout(function () { to = null; if (!vivo()) return ferma(); f(); }, ms); }
    function botDopo(ms, f) { toBot.push(setTimeout(function () { if (vivo()) f(); }, ms)); }
    // un passo nuovo: fase, sotto, chiave k (la regia di ogni telefono fa ogni passo una volta sola) e quanto dura
    function vai(fase, sotto, ms, poi) {
      H.fase = fase; H.sotto = sotto || null; H.k++; H.scadenza = ms ? Date.now() + ms : 0;
      bd();
      if (online && t.aCheSiamo) t.aCheSiamo(aCheSiamo());
      if (ms && poi) dopo(ms, poi); else clearTimeout(to);
    }

    // una riga per la Sala: a che punto è la puntata (al massimo 40 lettere)
    function aCheSiamo() {
      var f = H.fase;
      if (f === "offerta") return (H.imp.formato === "solo" ? "🏷️ Oggetto " : "🏷️ L'Offerta ") + (H.iOff || 1) + " di " + (H.nOff || 1);
      if (f === "scegli" || f === "premio") return "🎁 Gioco a premi" + (f === "premio" && H.premio ? ": " + infoPremio(H.premio.tipo).nome : "");
      if (f === "ruota") return "🎡 La Ruota del 100";
      if (f === "vetrina") return "🛍️ La Vetrina finale";
      if (f === "punti") return "🏁 Classifica";
      if (f === "carrello" || f === "fine") return "🏆 Fine della puntata";
      return "📺 Si comincia";
    }
    // "⚙️ Regole" nella saletta
    t.onRegole = function (im) { if (H.fase !== "lobby") return; var old = H.imp; H.imp = leggiImp(im, modo); if (!online) H.imp.nBot = old.nBot; bd(); };

    var rete = null;
    if (online) {
      rete = SGNet.ospita(ID, {
        onCodice: function (c) { H.codice = c; bd(); },
        onConnesso: function () { H.pronta = true; bd(); },
        onErrore: function () { if (H.pronta) return; ferma(); if (rete) rete.chiudi(); erroreRete(t, "Non riesco ad aprire la stanza.", function () { motore(t, modo); }); },
        onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
        onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
        onAddio: addio,
        onMsg: function (id, m) {
          if (!m || !m.t) return;
          if (m.t === "join") {
            delete attesi[id];   // (dopo una ripresa: è tornato)
            var p0 = pById(id), nomeJ = String(m.nome || "Amico").slice(0, 16);
            if (p0 && !p0.omino) p0.omino = avatarValido(m.omino);
            // nella Sala gioca solo chi è stato scelto in «Chi gioca?»: gli altri guardano (col loro id nella foto)
            if (!p0 && (H.guarda.indexOf(id) >= 0 || (t.puoSedersi && !t.puoSedersi(id, nomeJ)))) { if (H.guarda.indexOf(id) < 0) H.guarda.push(id); bd(); return; }
            if (!p0 && H.fase === "lobby" && H.players.length < MAX_ON) H.players.push({ id: id, nome: nomeJ, omino: avatarValido(m.omino), punti: 0, carrello: [] });
            // arrivato a partita cominciata: entra al prossimo oggetto (intanto guarda, col suo id nella foto)
            else if (!p0 && H.fase !== "lobby" && H.fase !== "fine" && presenti().length + H.arrivi.length < MAX_ON && !H.arrivi.some(function (a) { return a.id === id; }))
              H.arrivi.push({ id: id, nome: nomeJ, omino: avatarValido(m.omino) });
            else if (p0) { p0.forse = false; if (p0.via && H.fase !== "fine") { p0.via = false; controlla(); } }   // è tornato (stesso id): riprende coi suoi punti
            bd();
            if (p0 && H.fase !== "lobby") rimandaSegreti(id);
            return;
          }
          mossa(id, m);
        }
      }, { ripresa: riprendo });   // (con la partita ripresa gli amici non tornano in saletta)
      if (!rete) return senzaRete(t);
      if (riprendo && rete.codice) H.codice = rete.codice;
    }
    // chi se ne va (o, dopo una ripresa, non è tornato in tempo)
    function addio(id) {
      delete attesi[id];
      if (H.guarda.indexOf(id) >= 0) { H.guarda.splice(H.guarda.indexOf(id), 1); bd(); return; }
      if (H.arrivi.some(function (a) { return a.id === id; })) { H.arrivi = H.arrivi.filter(function (a) { return a.id !== id; }); bd(); return; }
      var p = pById(id); if (!p || (p.via && H.fase !== "lobby")) return;
      p.forse = false;
      if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
      p.via = true;   // a partita iniziata resta in classifica, ma non gioca più (se torna, riprende)
      controlla(); bd();
    }

    // ----- la foto per tutti: MAI il prezzo prima della rivelazione, MAI le offerte segrete -----
    function vm() {
      var f = H.fase, s = H.sotto, o = { fase: f, sotto: s, k: H.k, partita: H.partita, tiene: IO, sessione: H.sessione || "", codice: H.codice, pronta: H.pronta,
        formato: H.imp.formato, durata: H.imp.durata, offerte: H.imp.offerte, sforare: H.imp.sforare, nCat: H.imp.cats.length, anno: annoDati(),
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino || null, punti: p.punti, via: !!p.via, forse: !!p.forse, bot: p.bot ? 1 : 0 }; }),
        guarda: H.guarda.slice(), arrivi: H.arrivi.map(function (a) { return { id: a.id, nome: a.nome }; }),
        restaMs: H.scadenza ? Math.max(0, H.scadenza - Date.now()) : 0 };
      if (f === "lobby") return o;
      o.iOff = H.iOff || 0; o.nOff = H.nOff || 0; o.iPremio = H.iPremio || 0; o.nPremio = H.nPremio || 0; o.nRuota = H.nRuota || 0; o.ruoteTot = H.ruoteTot || 0;
      o.doppio = !!H.doppio; o.ultimo = H.ultimo;
      if (f === "offerta") {
        o.prod = pubProd(H.prod); o.rifai = H.rifai || 0; o.limite = H.limite == null ? null : H.limite;
        if (s === "offri" && H.imp.offerte === "segrete") { o.offFatti = Object.keys(H.off); }
        else { o.off = copia(H.off); o.ord = H.ord.slice(); }
        o.passati = Object.keys(H.passati || {});
        if (s === "rivela") { o.esito = H.esito; }
      }
      if (f === "scegli" && H.scelta) o.scelta = { chi: H.scelta.chi, opz: H.scelta.opz.map(infoPremio), fatta: H.scelta.fatta };
      if (f === "premio" && H.premio) {
        var g = premioDi(H.premio.tipo), inf = infoPremio(H.premio.tipo);
        o.premio = { tipo: H.premio.tipo, nome: inf.nome, icona: inf.icona, regola: inf.regola, spiega: inf.spiega, da: H.premio.da || null, sec: H.premio.sec || 0,
          fatti: Object.keys(H.premio.fatti) };
        if (s === "gioca" && g && g.pubblico) { try { o.premio.pub = g.pubblico(H.premio.st, apiPremio()); } catch (e) { o.premio.pub = {}; } }
        if (s === "riv") { o.premio.riv = H.premio.riv; o.premio.punti = H.premio.punti; }
        if (s === "intro") { o.avanti = H.avanti.slice(); o.servono = servono(); }
      }
      if (f === "punti") {
        o.avanti = H.avanti.slice(); o.servono = servono(); o.dopo = H.piano[H.ip + 1] || "";
        // (il respiro dopo una ripresa: la classifica, poi si rifà il passo a metà)
        if (H.respiro) { o.rip = 1; o.dopo = H.respiro.poi === "vetrina" || H.respiro.poi === "ruota" ? H.respiro.poi : ""; }
      }
      if (f === "ruota" && H.ruota) {
        var mostraSi = s !== "giro1" && s !== "decidi" || modo === "telefono", gr = {};
        Object.keys(H.ruota.g).forEach(function (id) { var x = H.ruota.g[id]; gr[id] = { v1: x.v1, v2: x.v2, b: x.b, cento: !!x.cento, si: mostraSi ? x.si : (x.si == null ? null : "?") }; });
        o.ruota = { g: gr, esito: s === "riv" || s === "rivb" || s === "bonus" ? H.ruota.esito : null, esitoB: s === "rivb" ? H.ruota.esitoB : null, indizio: H.ruota.indizio || null };
      }
      if (f === "vetrina" && H.vet) {
        o.vet = { titolo: H.vet.v.titolo, e: H.vet.v.e || "🛍️", pezzi: H.vet.v.pezzi.map(function (x) { return { e: x.e, f: x.f || null, nome: x.nome, desc: x.desc || "", dove: x.dove || "" }; }),
          fatti: Object.keys(H.vet.off).concat(Object.keys(H.vpassati || {})) };
        if (H.vet.b && (s === "mostra" || s === "scegli")) { o.vet.mist = 1; o.vet.bFoto = H.vet.b.pezzi.map(function (x) { return { f: x.f || null }; }); }   // (le foto si scaricano già, ma senza nomi)
        if (s === "scegli") o.vet.sFatti = Object.keys(H.vet.sc);
        if (H.vet.b && (s === "offri" || (s === "riv" && H.vet.esito && H.vet.esito.prezziB))) { var B = H.vet.b; o.vet.b = { titolo: B.titolo, e: B.e || "🎁", pezzi: B.pezzi.map(function (x) { return { e: x.e, f: x.f || null, nome: x.nome, desc: x.desc || "", dove: x.dove || "" }; }) }; o.vet.sc = copia(H.vet.sc); }
        if (s === "riv") o.vet.esito = H.vet.esito;
      }
      if (f === "carrello" || f === "fine") { o.carrello = {}; H.players.forEach(function (p) { o.carrello[p.id] = p.carrello; }); }
      if (f === "fine") o.classifica = H.classifica;
      return o;
    }
    function bd() { var v = vm(); if (rete) rete.invia({ t: "vm", vm: v }); ricorda(); disegnaVM(t, v, cbHost); vici(); }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda (non gioca: i prezzi e le offerte
    // segrete che stanno nella copia non gli servono a niente)
    var viciK = "";
    function vici() { if (!online || !t.vici) return; var k = H.guarda.join(","); if (k !== viciK) { viciK = k; t.vici(H.guarda.length ? H.guarda.slice() : null); } }
    // la partita com'è adesso, per riprenderla se ricarico la pagina (o se la porta avanti un amico): tutto H tranne il cesto
    // (si rifà da H.usati); in saletta niente. Gli avatar ci stanno (al massimo 3.000 caratteri l'uno: sotto i 60 KB anche
    // in 8); se mai la copia fosse troppo grossa, gli avatar restano solo su questo telefono (soloQui)
    function ricorda() {
      if (!online || !t.ricorda) return;
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {}; Object.keys(H).forEach(function (k) { if (k !== "cesto") s[k] = H[k]; });
      var qui = null;
      try {
        if (JSON.stringify(s).length > 50000) {
          qui = { omini: {} };
          s.players = H.players.map(function (p) { qui.omini[p.id] = p.omino || null; var c = {}; Object.keys(p).forEach(function (k) { if (k !== "omino") c[k] = p[k]; }); return c; });
        }
      } catch (e) {}
      t.ricorda(s, qui);
    }
    // un messaggio per un telefono solo (inviaVeloce con "to": così non resta in stanza)
    function privato(id, m) {
      var p = pById(id); if (p && p.bot) return;
      m.per = id;
      if (!online || id === IO) return privatoR(m);
      m.to = id; rete.inviaVeloce(m);
    }
    function rimandaSegreti(id) {
      var f = H.fase, s = H.sotto;
      if (f === "offerta" && s === "offri" && H.off[id] != null) privato(id, { t: "priv", k: "mia", v: H.off[id], kk: H.k });
      if (f === "premio" && s === "gioca" && H.premio) { var g = premioDi(H.premio.tipo); if (g && g.privatoDi) try { var m = g.privatoDi(H.premio.st, id, apiPremio()); if (m) privato(id, { t: "priv", k: "premio", m: m, kk: H.k }); } catch (e) {} }
      if (f === "vetrina" && H.vet && H.vet.off[id] != null) privato(id, { t: "priv", k: "miaV", v: H.vet.off[id], kk: H.k });
      if (f === "vetrina" && s === "offri" && H.indizio && (H.indizio.ids || []).indexOf(id) >= 0) mandaIndizio(id);
      if (f === "ruota" && s === "decidi" && H.ruota && H.ruota.g[id] && H.ruota.g[id].si != null) privato(id, { t: "priv", k: "miaR", si: H.ruota.g[id].si, kk: H.k });
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby") return;
      if (online && presenti().length < MIN_ON) return;
      H.partita++; H.sessione = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); H.respiro = null;
      H.players = presenti(); H.players.forEach(function (p) { p.punti = 0; p.carrello = []; });
      H.usati = {}; H.cesto = Cesto(H.imp.cats, H.usati); H.ultimo = {}; H.avanti = []; H.premiUsati = []; H.indizio = null; H.vetUsate = [];
      var nPremi = Object.keys(premi()).filter(function (k) { return premioDi(k); }).length;
      H.piano = piano(H.imp.formato, H.imp.durata, nPremi); H.ip = -1;
      H.iOff = 0; H.nOff = H.piano.filter(function (x) { return x === "offerta" || x === "oggetto"; }).length;
      H.iPremio = 0; H.nPremio = H.piano.filter(function (x) { return x === "premio"; }).length;
      H.nRuota = 0; H.ruoteTot = H.piano.filter(function (x) { return x === "ruota"; }).length;
      H.catPrec = null;
      prossimo();
    }
    function prossimo() {
      ferma();
      H.ip++;
      var s = H.piano[H.ip];
      if (s === "apertura") return vai("apertura", null, ST.durataApertura(H.players.length), prossimo);
      if (s === "offerta" || s === "oggetto") return nuovaOfferta();
      if (s === "premio") return nuovoPremio();
      if (s === "punti") { H.avanti = []; return vai("punti", null, T.punti, function () { H.ultimo = {}; prossimo(); }); }
      if (s === "ruota") return nuovaRuota();
      if (s === "vetrina") return nuovaVetrina();
      if (s === "carrello") return vai("carrello", null, durCarrello(presenti().length), fine);
      return fine();
    }
    // chi è arrivato a partita cominciata entra adesso (all'inizio di un oggetto, della Ruota o della Vetrina)
    function entranoNuovi() {
      H.arrivi.forEach(function (a) { if (!pById(a.id) && H.players.length < MAX_ON) H.players.push({ id: a.id, nome: a.nome, omino: a.omino || null, punti: 0, carrello: [] }); });
      H.arrivi = [];
    }
    function aggiungiPunti(id, n) { var p = pById(id); if (!p || !n) return; p.punti += n; H.ultimo[id] = (H.ultimo[id] || 0) + n; }
    function nelCarrello(id, cosa) { var p = pById(id); if (p && cosa) p.carrello.push({ e: cosa.e || "🎁", f: cosa.f || null, nome: cosa.nome, prezzo: tondo2(cosa.prezzo) }); }

    // ---------- L'OFFERTA (anche ogni oggetto di «Solo il prezzo») ----------
    function nuovaOfferta() {
      entranoNuovi();
      H.iOff++;
      var caro = H.iOff % 2 === 0, prec = H.catPrec;   // uno economico e uno caro, mai due della stessa categoria di fila
      H.prod = H.cesto.pesca(function (x) { return (caro ? x.prezzo >= 100 : x.prezzo < 100) && x.cat !== prec; }, 1)[0]
        || H.cesto.pesca(function (x) { return x.cat !== prec; }, 1)[0] || H.cesto.pesca(null, 1)[0];
      if (!H.prod) return prossimo();
      H.catPrec = H.prod.cat;
      H.rifai = 0; H.limite = null; H.off = {}; H.ord = []; H.passati = {}; H.esito = null; H.vincOff = null;
      H.doppio = H.imp.formato === "solo" && H.iOff === H.nOff && H.nOff > 1;
      vai("offerta", "prodotto", T.prodotto, apriOfferte);
    }
    function apriOfferte() {
      H.off = {}; H.ord = []; H.passati = {};
      vai("offerta", "offri", modo === "telefono" ? 0 : (H.rifai ? T.rifai : T.offri), chiudiOfferte);
      if (modo === "bot") botOfferte();
    }
    function offerta(id, v) {
      var p = pById(id);
      if (H.fase !== "offerta" || H.sotto !== "offri" || !p || p.via || H.off[id] != null) return;
      v = tondo2(+v); if (!(v > 0 && v < 1e7)) return;
      if (H.limite != null && v >= H.limite) return privato(id, { t: "priv", k: "sotto", lim: H.limite, kk: H.k });
      // a vista un prezzo già detto non si può ridire (come in TV)
      if (H.imp.offerte === "vista") { var gia = Object.keys(H.off).filter(function (x) { return Math.abs(H.off[x] - v) < 1e-9; })[0]; if (gia) return privato(id, { t: "priv", k: "preso", da: nome(gia), kk: H.k }); }
      H.off[id] = v; H.ord.push(id); delete H.passati[id];
      privato(id, { t: "priv", k: "mia", v: v, kk: H.k });
      bd(); controlla();
    }
    function chiudiOfferte() {
      if (H.fase !== "offerta" || H.sotto !== "offri") return;
      ferma();
      var tv = H.imp.formato === "tv";
      var e = esitoOfferta(H.prod.prezzo, H.off, { senzaSforare: tv || H.imp.sforare, molt: H.doppio ? 2 : 1, ordine: H.ord, n: presenti().length });
      // sforano tutti: si rifà una volta sola, tutti sotto l'offerta più bassa (il prezzo resta segreto)
      if (e.tuttiSopra && !H.rifai) {
        H.rifai = 1; H.limite = Math.min.apply(null, Object.keys(H.off).map(function (id) { return H.off[id]; }));
        return vai("offerta", "sopra", T.sopra, apriOfferte);
      }
      e.cur = H.prod.cur || ""; e.wow = !!H.prod.wow;
      H.esito = e;
      e.righe.forEach(function (r) { aggiungiPunti(r.id, r.punti); });
      e.vince.forEach(function (id) { nelCarrello(id, H.prod); });   // chi vince l'Offerta si porta a casa il prodotto
      H.vincOff = e.vince.length ? e.vince[Math.floor(Math.random() * e.vince.length)] : null;
      vai("offerta", "rivela", durRivela(e), prossimo);
    }
    function botOfferte() {
      var tempo = H.rifai ? T.rifai : T.offri;
      bots().forEach(function (b) {
        var ms = H.imp.liv === "difficile" ? 6000 + Math.random() * (tempo - 9000) : 2500 + Math.random() * (tempo - 6000);
        botDopo(Math.max(1500, ms), function () { offertaBot(b); });
      });
    }
    function offertaBot(b) {
      if (H.fase !== "offerta" || H.sotto !== "offri" || H.off[b.id] != null) return;
      var p = H.prod.prezzo, prudente = H.imp.formato === "tv" || H.imp.sforare, v = stimaBot(p, H.imp.liv, prudente), pz = Z().passo(p);
      if (H.limite != null && v >= H.limite) v = Z().arrotonda(H.limite * (0.62 + Math.random() * 0.3), p);
      // il Bot cattivo: «+1 €» sull'offerta più alta che pensa sia sotto
      if (H.imp.offerte === "vista" && H.imp.liv !== "facile" && Math.random() < (H.imp.liv === "difficile" ? 0.6 : 0.25)) {
        var sotto = Object.keys(H.off).map(function (id) { return H.off[id]; }).filter(function (x) { return x < v * 1.05; }).sort(function (a, c) { return c - a; })[0];
        if (sotto != null) v = tondo2(sotto + (p < 20 ? 0.1 : 1));
      }
      if (H.limite != null && v >= H.limite) v = Math.max(pz, tondo2(H.limite - pz));
      var giri = 0;
      while (H.imp.offerte === "vista" && Object.keys(H.off).some(function (id) { return Math.abs(H.off[id] - v) < 1e-9; }) && giri++ < 50) v = tondo2(v + pz * (Math.random() < 0.5 ? 1 : -1));
      offerta(b.id, Math.max(pz, v));
    }

    // ---------- IL GIOCO A PREMI ----------
    // gli aiuti per i giochi a premi, sul telefono dell'host (vedi interfaccia in js/games/prezzo-premi-piu.js)
    function apiPremio() {
      return {
        ids: presenti().map(function (p) { return p.id; }), n: presenti().length, modo: modo, locale: modo !== "online",
        nome: nome, rnd: Math.random, mescola: mescola,
        pesca: function (filtro, n) { return H.cesto.pesca(filtro, n); },
        passo: Z().passo, margine: Z().margine, arrotonda: Z().arrotonda, fmtE: Z().fmtE, tondo2: tondo2,
        privato: function (id, msg) { privato(id, { t: "priv", k: "premio", m: msg, kk: H.k }); },
        fatto: function (id) { if (H.premio && !H.premio.fatti[id]) { H.premio.fatti[id] = 1; } }
      };
    }
    function nuovoPremio() {
      H.iPremio++;
      var n = presenti().length;
      var disp = Object.keys(premi()).filter(function (k) {
        var g = premioDi(k); if (!g) return false;
        if (g.min && n < g.min) return false; if (g.max && n > g.max) return false;
        if (modo === "telefono" && g.locale === false) return false;
        return true;
      });
      if (!disp.length) return prossimo();
      var nuovi = disp.filter(function (k) { return H.premiUsati.indexOf(k) < 0; });
      if (!nuovi.length) { H.premiUsati = []; nuovi = disp; }   // usciti tutti: possono tornare
      var opz = mescola(nuovi).slice(0, 2), chi = H.vincOff && pById(H.vincOff) && !pById(H.vincOff).via ? H.vincOff : null;
      if (opz.length < 2 || !chi) return avviaPremio(opz[0], null);
      // chi ha vinto l'Offerta sceglie tra due (come in TV: sale sul palco); se non sceglie, il primo
      H.scelta = { chi: chi, opz: opz, fatta: null };
      vai("scegli", null, modo === "telefono" ? 0 : T.scegli, function () { scegli(chi, opz[0]); });
      var b = pById(chi); if (b && b.bot) botDopo(1800 + Math.random() * 2200, function () { scegli(chi, opz[Math.floor(Math.random() * opz.length)]); });
    }
    function scegli(id, tipo) {
      if (H.fase !== "scegli" || !H.scelta || id !== H.scelta.chi || H.scelta.fatta || H.scelta.opz.indexOf(tipo) < 0) return;
      H.scelta.fatta = tipo; bd();
      dopo(1500, function () { avviaPremio(tipo, id); });
    }
    function avviaPremio(tipo, da) {
      var g = premioDi(tipo); if (!g) return prossimo();
      H.premiUsati.push(tipo);
      var st = null;
      try { st = g.prepara(apiPremio()); } catch (e) { try { console.error("[prezzo] prepara " + tipo, e); } catch (x) {} return prossimo(); }
      H.premio = { tipo: tipo, st: st, fatti: {}, riv: null, punti: null, da: da || null, sec: 30 };
      H.avanti = [];   // (la regola si salta con «⏩ Avanti», come le classifiche: 23 ott 2026)
      vai("premio", "intro", T.intro, giocaPremio);
    }
    function giocaPremio() {
      var g = premioDi(H.premio.tipo), sec = 30;
      try { sec = Math.max(5, +g.tempo(H.premio.st, apiPremio()) || 30); } catch (e) {}
      H.premio.sec = sec;
      vai("premio", "gioca", modo === "telefono" ? 0 : sec * 1000 + 800, fineGioco);
      if (modo === "bot" && g.bot) bots().forEach(function (b) {
        var mosse = [];
        try { mosse = g.bot(H.premio.st, { id: b.id, nome: b.nome, livello: H.imp.liv }, apiPremio()) || []; } catch (e) {}
        mosse.forEach(function (x) { if (x && x.m) botDopo(Math.min(sec * 1000, Math.max(300, +x.ms || 0)), function () { var m = copia(x.m); if (m.ms == null) m.ms = +x.ms || 0; mossaPremio(b.id, m); }); });
      });
    }
    function mossaPremio(id, m) {
      if (H.fase !== "premio" || H.sotto !== "gioca" || !H.premio) return;
      var p = pById(id); if (!p || p.via || H.premio.fatti[id]) return;
      var g = premioDi(H.premio.tipo);
      try { g.mossa(H.premio.st, id, m || {}, apiPremio()); } catch (e) { try { console.error("[prezzo] mossa", e); } catch (x) {} }
      bd(); controlla();
    }
    function fineGioco() {
      if (H.fase !== "premio" || H.sotto !== "gioca") return;
      ferma();
      var g = premioDi(H.premio.tipo), r = null;
      try { r = g.fine(H.premio.st, apiPremio()) || {}; } catch (e) { r = {}; try { console.error("[prezzo] fine", e); } catch (x) {} }
      var punti = r.punti || {};
      Object.keys(punti).forEach(function (id) { punti[id] = Math.max(0, Math.round(+punti[id] || 0)); aggiungiPunti(id, punti[id]); });
      Object.keys(r.carrello || {}).forEach(function (id) { (r.carrello[id] || []).forEach(function (c) { nelCarrello(id, c); }); });
      H.premio.riv = r.riv || {}; H.premio.punti = punti;
      vai("premio", "riv", durPremioRiv(), prossimo);
    }
    function durPremioRiv() {
      var g = premioDi(H.premio.tipo), dur = 6000;
      try { dur = Math.max(2500, Math.min(30000, +g.durata(H.premio.riv, apiPremio()) || 6000)); } catch (e) {}
      return RV.cam + 400 + dur + RV.leggii;
    }

    // ---------- LA RUOTA DEL 100 ----------
    function tira() { return Z().SPICCHI[Math.floor(Math.random() * Z().SPICCHI.length)]; }
    function nuovaRuota() {
      entranoNuovi();
      H.nRuota++;
      H.ruota = { g: {}, esito: null, esitoB: null, indizio: null };
      presenti().forEach(function (p) { H.ruota.g[p.id] = { v1: null, si: null, v2: null, b: null, cento: false }; });
      if (modo === "telefono") return vai("ruota", "turni", 0);   // a turno, come in TV: la regia passa il telefono
      vai("ruota", "giro1", T.giro, function () { autoGiri("v1"); dopo(2900, decidi); });
      botRuota("v1");
    }
    function decidi() {
      presenti().forEach(function (p) { var x = H.ruota.g[p.id]; if (x && x.v1 >= 100) x.si = false; });
      vai("ruota", "decidi", T.decidi, function () { presenti().forEach(function (p) { var x = H.ruota.g[p.id]; if (x && x.si == null) x.si = false; }); giro2(); });
      bots().forEach(function (b) {
        var x = H.ruota.g[b.id]; if (!x || x.si != null) return;
        var soglia = H.imp.liv === "difficile" ? 65 : H.imp.liv === "medio" ? 55 : 45 + Math.random() * 15;
        botDopo(1500 + Math.random() * 4000, function () { ancora(b.id, x.v1 <= soglia); });
      });
      controlla();
    }
    function giro2() {
      if (!presenti().some(function (p) { return (H.ruota.g[p.id] || {}).si === true; })) return rivRuota();
      vai("ruota", "giro2", T.giro, function () { autoGiri("v2"); dopo(2900, rivRuota); });
      botRuota("v2");
    }
    function rivRuota() {
      if (H.fase !== "ruota" || H.sotto === "riv") return;
      ferma();
      var e = esitoRuota(H.ruota.g, presenti().map(function (p) { return p.id; }).filter(function (id) { return H.ruota.g[id]; }));
      H.ruota.esito = e;
      e.righe.forEach(function (r) { aggiungiPunti(r.id, r.punti); });
      e.cento.forEach(function (id) { H.ruota.g[id].cento = true; });
      // l'indizio per la Vetrina va a chi vince la Ruota (con due Ruote, solo la seconda); a pari merito a tutti (23 ott 2026, il
      // proprietario: «se due persone fanno 100… l'indizio lo dà solamente ad una persona»)
      if (e.vince.length && H.nRuota >= H.ruoteTot) { H.indizio = { ids: e.vince.slice(), x: {} }; H.ruota.indizio = e.vince.slice(); }
      vai("ruota", "riv", durRuotaRiv(e), dopoRivRuota);
    }
    function dopoRivRuota() { if (H.ruota && H.ruota.esito && H.ruota.esito.cento.length) giroBonus(); else prossimo(); }
    function giroBonus() {
      if (modo === "telefono") return vai("ruota", "bonus", 0);
      vai("ruota", "bonus", T.giro, function () { autoGiri("b"); dopo(2900, rivBonus); });
      botRuota("b");
    }
    function rivBonus() {
      if (H.fase !== "ruota" || H.sotto === "rivb") return;
      ferma();
      var righe = presenti().filter(function (p) { return H.ruota.g[p.id] && H.ruota.g[p.id].cento; }).map(function (p) {
        var b = H.ruota.g[p.id].b || 0, pt = puntiBonus(b); aggiungiPunti(p.id, pt); return { id: p.id, b: b, punti: pt };
      });
      H.ruota.esitoB = { righe: righe };
      vai("ruota", "rivb", RV.cam + 600 + righe.length * 1500 + 1600 + RV.leggii, prossimo);
    }
    function autoGiri(campo) {
      presenti().forEach(function (p) {
        var x = H.ruota.g[p.id]; if (!x) return;
        if (campo === "v1" && x.v1 == null) x.v1 = tira();
        if (campo === "v2" && x.si === true && x.v2 == null) x.v2 = tira();
        if (campo === "b" && x.cento && x.b == null) x.b = tira();
      });
      bd();
    }
    function botRuota(campo) {
      bots().forEach(function (b) {
        var x = H.ruota.g[b.id]; if (!x) return;
        if (campo === "v2" && x.si !== true) return;
        if (campo === "b" && !x.cento) return;
        botDopo(1200 + Math.random() * 3500, function () { spinta(b.id, 0.3 + Math.random() * 0.7); });
      });
    }
    function spinta(id, f) {
      if (H.fase !== "ruota" || !H.ruota) return;
      var x = H.ruota.g[id], p = pById(id), s = H.sotto; if (!x || !p || p.via) return;
      var campo = null;
      if (s === "giro1" && x.v1 == null) campo = "v1";
      else if (s === "giro2" && x.si === true && x.v2 == null) campo = "v2";
      else if (s === "bonus" && x.cento && x.b == null) campo = "b";
      else if (s === "turni") campo = x.v1 == null ? "v1" : (x.si === true && x.v2 == null ? "v2" : null);
      if (!campo) return;
      x[campo] = tira();
      if (s === "turni" && campo === "v1" && x.v1 >= 100) x.si = false;
      bd(); controlla();
    }
    function ancora(id, si) {
      if (H.fase !== "ruota" || (H.sotto !== "decidi" && H.sotto !== "turni")) return;
      var x = H.ruota.g[id]; if (!x || x.v1 == null || x.si != null || x.v1 >= 100) return;
      x.si = !!si;
      if (modo === "online") privato(id, { t: "priv", k: "miaR", si: x.si, kk: H.k });
      bd(); controlla();
    }

    // ---------- LA VETRINA FINALE ----------
    // La Vetrina misteriosa (23 ott 2026; in «OK, il prezzo è giusto!» il primo in classifica poteva tenere la vetrina vista o
    // scambiarla con una misteriosa; il proprietario ha scelto «scelgono tutti, in segreto»): tutti vedono la prima vetrina,
    // poi ognuno decide in segreto se tenerla («a») o prendere la misteriosa («b»), che scopre solo dopo aver scelto; ognuno
    // offre sulla sua (esitoVetrina: classifica in percentuale) e «VINCI TUTTO!» porta a casa anche l'altra. Chi non sceglie in
    // tempo tiene la prima. Sullo stesso telefono si sceglie al proprio turno, prima di offrire. Senza una seconda vetrina
    // (non dovrebbe succedere) si gioca come prima, tutti sulla stessa.
    function nuovaVetrina() {
      entranoNuovi();
      var v = pescaVetrina(); if (!v) return prossimo();
      H.vet = { v: v, b: pescaVetrina([v.id || v.titolo], true) || null, sc: {}, off: {}, esito: null }; H.vpassati = {};
      vai("vetrina", "mostra", durVetMostra(v.pezzi.length, !!H.vet.b), dopoMostra);
    }
    function dopoMostra() { return H.vet.b && modo !== "telefono" ? scegliVetrina() : apriVetrina(); }
    function scegliVetrina() {
      vai("vetrina", "scegli", T.vetScegli, apriVetrina);
      if (modo === "bot") bots().forEach(function (b) { botDopo(1500 + Math.random() * 5500, function () { sceltaVet(b.id, Math.random() < 0.4); }); });
    }
    function sceltaVet(id, mist) {
      var p = pById(id), s = H.sotto;
      if (H.fase !== "vetrina" || !H.vet || !H.vet.b || !p || p.via || H.vet.sc[id]) return;
      if (s !== "scegli" && !(s === "offri" && modo === "telefono")) return;
      H.vet.sc[id] = mist ? "b" : "a";
      if (s === "offri") preparaIndizio(id);   // (sullo stesso telefono si sceglie al proprio turno: l'indizio arriva adesso)
      bd(); controlla();
    }
    function vetDi(id) { return H.vet.b && H.vet.sc[id] === "b" ? H.vet.b : H.vet.v; }
    function totale(V) { return tondo2(V.pezzi.reduce(function (a, x) { return a + x.prezzo; }, 0)); }
    // l'indizio di chi ha vinto la Ruota: il prezzo di uno dei due pezzi più cari della vetrina che ha scelto (uno a testa)
    function preparaIndizio(soloPer) {
      if (!H.indizio || !H.indizio.ids) return;
      H.indizio.ids.forEach(function (id) {
        if (soloPer && id !== soloPer) return;
        var V = vetDi(id), ord = V.pezzi.map(function (x, i) { return i; }).sort(function (a, b) { return V.pezzi[b].prezzo - V.pezzi[a].prezzo; });
        H.indizio.x[id] = { w: H.vet.b && H.vet.sc[id] === "b" ? "b" : "a", i: ord[Math.floor(Math.random() * Math.min(2, ord.length))] };
        mandaIndizio(id);
      });
    }
    function indizioDi(id) { return H.indizio && H.indizio.x && H.indizio.x[id] || null; }
    function apriVetrina() {
      if (modo !== "telefono") presenti().forEach(function (p) { if (!H.vet.sc[p.id]) H.vet.sc[p.id] = "a"; });   // non ha scelto: tiene la prima
      vai("vetrina", "offri", modo === "telefono" ? 0 : T.vetOffri, chiudiVetrina);
      if (H.indizio) { H.indizio.x = {}; if (modo !== "telefono" || !H.vet.b) preparaIndizio(); }
      if (modo === "bot") bots().forEach(function (b) {
        botDopo(4000 + Math.random() * (T.vetOffri - 9000), function () {
          if (H.fase !== "vetrina" || H.sotto !== "offri") return;
          var tot = 0;
          vetDi(b.id).pezzi.forEach(function (x, i) { tot += (indizioDi(b.id) && indizioDi(b.id).i === i) ? x.prezzo : stimaBot(x.prezzo, H.imp.liv, false); });
          // (un'idea sbagliata sul totale, uguale per tutti i pezzi: se no gli errori si compensano e il Bot fa «VINCI TUTTO» troppo spesso)
          tot *= Math.exp(Math.max(-2.5, Math.min(2.5, gauss())) * (ERR[H.imp.liv] || 0.25) * 0.7);
          offVetrina(b.id, Z().arrotonda(tot * (1 - (ERR[H.imp.liv] || 0.25) * 0.25), tot));
        });
      });
    }
    function mandaIndizio(id) {
      var I = indizioDi(id); if (!I || I.i == null || !H.vet) return;
      var x = vetDi(id).pezzi[I.i]; if (!x) return;
      privato(id, { t: "priv", k: "indizio", i: I.i, e: x.e, nome: x.nome, desc: [x.desc, x.dove].filter(Boolean).join(" · "), prezzo: x.prezzo, kk: H.k });
    }
    function offVetrina(id, v) {
      var p = pById(id);
      if (H.fase !== "vetrina" || H.sotto !== "offri" || !p || p.via || H.vet.off[id] != null) return;
      v = Math.round(+v); if (!(v > 0 && v < 1e7)) return;
      if (H.vet.b && !H.vet.sc[id]) H.vet.sc[id] = "a";
      H.vet.off[id] = v; delete H.vpassati[id];
      privato(id, { t: "priv", k: "miaV", v: v, kk: H.k });
      bd(); controlla();
    }
    function chiudiVetrina() {
      if (H.fase !== "vetrina" || H.sotto !== "offri") return;
      ferma();
      var A = H.vet.v, B = H.vet.b;
      var e = esitoVetrina(H.vet.off, H.vet.sc, totale(A), B ? totale(B) : 0, presenti().length);
      // (23 ott 2026, il proprietario: «non ha senso far vedere tutte e due le vetrine, solo se sono state scelte entrambe»):
      // si scoprono solo le vetrine che qualcuno ha preso; una misteriosa che nessuno ha preso resta un mistero e non si
      // «brucia» (potrà uscire in un'altra partita), tranne quando un VINCI TUTTO la vince come premio
      var scelte = Object.keys(H.vet.sc).map(function (id) { return H.vet.sc[id]; });
      e.usaA = !B || !scelte.length || scelte.some(function (w) { return w !== "b"; });
      e.usaB = !!B && scelte.some(function (w) { return w === "b"; });
      e.prezzi = A.pezzi.map(function (x) { return x.prezzo; });
      if (B && (e.usaB || e.tutti.length)) { e.prezziB = B.pezzi.map(function (x) { return x.prezzo; }); segnaVista(B); }
      e.righe.forEach(function (r) { aggiungiPunti(r.id, r.punti); });
      e.vince.forEach(function (id) { vetDi(id).pezzi.forEach(function (x) { nelCarrello(id, x); }); });
      // VINCI TUTTO: anche l'altra vetrina (senza la misteriosa: una seconda pescata adesso)
      if (e.tutti.length && B) e.tutti.forEach(function (id) {
        var mia = vetDi(id);
        if (e.vince.indexOf(id) < 0) mia.pezzi.forEach(function (x) { nelCarrello(id, x); });   // (nel 3% ma non il primo: anche la sua)
        (mia === B ? A : B).pezzi.forEach(function (x) { nelCarrello(id, x); });
      });
      else if (e.tutti.length) {
        var v2 = pescaVetrina([H.vet.v.id || H.vet.v.titolo]);
        if (v2) {
          e.seconda = { titolo: v2.titolo, e: v2.e || "🛍️", pezzi: v2.pezzi.map(function (x) { return { e: x.e, f: x.f || null, nome: x.nome, prezzo: x.prezzo }; }), tot: tondo2(v2.pezzi.reduce(function (a, x) { return a + x.prezzo; }, 0)) };
          e.tutti.forEach(function (id) { v2.pezzi.forEach(function (x) { nelCarrello(id, x); }); });
        }
      }
      H.vet.esito = e;
      vai("vetrina", "riv", durVetRiv(e), prossimo);
    }

    // ---------- chi ha finito: si va avanti senza aspettare il tempo ----------
    function controlla() {
      var f = H.fase, s = H.sotto;
      if (f === "lobby" || f === "fine") return;
      if (online && presenti().length < 2) return fine();   // è rimasto uno solo: finisce qui
      if (H.respiro) return;   // (il respiro dopo una ripresa: decide finisciRespiro)
      var pres = presenti(), pausa = online ? 900 : 380;
      if (f === "offerta" && s === "offri" && pres.every(function (p) { return H.off[p.id] != null || H.passati[p.id]; })) return dopo(pausa, chiudiOfferte);
      if (f === "scegli" && H.scelta && !H.scelta.fatta) { var c = pById(H.scelta.chi); if (!c || c.via) return scegli(H.scelta.chi, H.scelta.opz[0]); }
      if (f === "premio" && s === "gioca" && H.premio && pres.every(function (p) { return H.premio.fatti[p.id]; })) return dopo(online ? 1100 : 700, fineGioco);
      if (f === "ruota" && H.ruota) {
        var x = function (id) { return H.ruota.g[id] || {}; }, conta = pres.filter(function (p) { return H.ruota.g[p.id]; });
        // (dopo l'ultima spinta si aspetta che la sua ruota si fermi: frena fino a ~5 s, e il numero si vede solo allora)
        if (s === "giro1" && conta.every(function (p) { return x(p.id).v1 != null; })) return dopo(RU_FERMA, decidi);
        if (s === "decidi" && conta.every(function (p) { return x(p.id).si != null; })) return dopo(700, giro2);
        if (s === "giro2" && conta.every(function (p) { return x(p.id).si !== true || x(p.id).v2 != null; })) return dopo(RU_FERMA, rivRuota);
        // (sullo stesso telefono la ruota la chiude la regia quando l'ultimo ha visto fermarsi la sua: «finiti»)
        if (s === "bonus" && modo !== "telefono" && conta.every(function (p) { return !x(p.id).cento || x(p.id).b != null; })) return dopo(RU_FERMA, rivBonus);
      }
      if (f === "vetrina" && s === "scegli" && pres.every(function (p) { return H.vet.sc[p.id]; })) return dopo(pausa, apriVetrina);
      if (f === "vetrina" && s === "offri" && pres.every(function (p) { return H.vet.off[p.id] != null || H.vpassati[p.id]; })) return dopo(pausa, chiudiVetrina);
      if ((f === "punti" || (f === "premio" && s === "intro")) && H.avanti.length >= servono()) return oltre();
    }
    // «⏩ Avanti» sulle classifiche: si parte subito se lo tocca più di metà (sullo stesso telefono e col Bot basta il tuo)
    function avanti(id) {
      if (H.fase !== "punti" && !(H.fase === "premio" && H.sotto === "intro")) return;
      if (!online) return oltre();
      var p = pById(id); if (!p || p.via || p.bot || H.avanti.indexOf(id) >= 0) return;
      H.avanti.push(id);
      if (H.avanti.length >= servono()) return oltre();
      bd();
    }
    function oltre() {
      if (H.fase === "premio" && H.sotto === "intro") { ferma(); return giocaPremio(); }
      if (H.fase !== "punti") return;
      // (il respiro dopo una ripresa dura almeno RESPIRO anche se toccano tutti «Avanti»: intanto gli amici rientrano)
      if (H.respiro) { var resta = H.respiro.fino - Date.now(); return resta > 50 ? dopo(resta, finisciRespiro) : finisciRespiro(); }
      ferma(); H.ultimo = {}; prossimo();
    }

    // ---------- LA RIPRESA (online: l'host ha ricaricato o riaperto l'app, o un amico porta avanti la partita) ----------
    // Mai punti dati due volte: le rivelazioni (punti già dati) si rivedono con lo stesso esito; i passi a metà (offerte,
    // scelta del gioco a premi, gioco a premi, Ruota, Vetrina: nessun punto ancora) si rifanno da capo dopo un respiro di
    // almeno 6 secondi con la classifica; la classifica col tempo che restava (almeno 5 s); il carrello si rivede; sulla
    // classifica finale si resta lì (t.risultato l'aveva già dato chi teneva la partita)
    var RESPIRO = 6000;
    function riprendi() {
      var f = H.fase, s = H.sotto, R1 = t.ripresa;
      ferma();
      tAttesi = setTimeout(function () { Object.keys(attesi).forEach(addio); }, 10000);
      if (f === "fine") return bd();
      if (f === "carrello") return vai("carrello", null, durCarrello(presenti().length), fine);
      if (f === "apertura" || !H.piano || !H.piano.length) return vai("apertura", null, ST.durataApertura(H.players.length), prossimo);
      if (f === "punti") {
        if (H.respiro) return respiro(H.respiro.poi);
        var resta = Math.max(5000, ((R1 && R1.ora ? R1.ora(H.scadenza) : H.scadenza) || 0) - Date.now());
        H.avanti = [];
        return vai("punti", null, resta, function () { H.ultimo = {}; prossimo(); });
      }
      if (f === "offerta") {
        if (s === "rivela" && H.esito) return vai("offerta", "rivela", durRivela(H.esito), prossimo);
        return respiro(H.rifai ? "sopra" : "offerta");
      }
      if (f === "scegli") return respiro("scegli");
      if (f === "premio" && H.premio) {
        if (s === "riv" && H.premio.riv) return vai("premio", "riv", durPremioRiv(), prossimo);
        return respiro("premio");
      }
      if (f === "ruota" && H.ruota) {
        if (s === "riv" && H.ruota.esito) return vai("ruota", "riv", durRuotaRiv(H.ruota.esito), dopoRivRuota);
        if (s === "rivb" && H.ruota.esitoB) return vai("ruota", "rivb", RV.cam + 600 + H.ruota.esitoB.righe.length * 1500 + 1600 + RV.leggii, prossimo);
        return respiro(s === "bonus" ? "bonus" : "ruota");
      }
      if (f === "vetrina" && H.vet) {
        if (s === "riv" && H.vet.esito) return vai("vetrina", "riv", durVetRiv(H.vet.esito), prossimo);
        return respiro("vetrina");
      }
      respiro("prossimo");
    }
    // il respiro: la classifica (fase "punti" con vm.rip), poi il passo che era a metà
    function respiro(poi) {
      H.respiro = { poi: poi, fino: Date.now() + RESPIRO };
      H.avanti = []; H.ultimo = {};
      vai("punti", null, RESPIRO, finisciRespiro);
    }
    function finisciRespiro() {
      if (H.fase !== "punti" || !H.respiro) return;
      ferma();
      var poi = H.respiro.poi; H.respiro = null;
      if (online && presenti().length < 2) return fine();   // non è tornato nessuno: si chiude coi punti che c'erano
      if (poi === "offerta" && H.prod) { H.rifai = 0; H.limite = null; H.esito = null; return vai("offerta", "prodotto", T.prodotto, apriOfferte); }
      if (poi === "sopra" && H.prod) return vai("offerta", "sopra", T.sopra, apriOfferte);
      if (poi === "scegli") { H.iPremio = Math.max(0, (H.iPremio || 1) - 1); H.scelta = null; return nuovoPremio(); }
      if (poi === "premio" && H.premio) {
        var i = H.premiUsati.lastIndexOf(H.premio.tipo); if (i >= 0) H.premiUsati.splice(i, 1);
        return avviaPremio(H.premio.tipo, H.premio.da);
      }
      if (poi === "ruota") { H.nRuota = Math.max(0, (H.nRuota || 1) - 1); return nuovaRuota(); }
      if (poi === "bonus" && H.ruota) { presenti().forEach(function (p) { var x = H.ruota.g[p.id]; if (x && x.cento) x.b = null; }); H.ruota.esitoB = null; return giroBonus(); }
      if (poi === "vetrina" && H.vet) {
        H.vet.off = {}; H.vet.sc = {}; H.vet.esito = null; H.vpassati = {};
        return vai("vetrina", "mostra", durVetMostra(H.vet.v.pezzi.length, !!H.vet.b), dopoMostra);
      }
      prossimo();
    }
    // sullo stesso telefono: il tempo di chi è di turno è finito (o non c'è): vale quello che c'è
    function passa(id) {
      if (modo !== "telefono") return;
      var f = H.fase, s = H.sotto, p = pById(id); if (!p) return;
      if (f === "offerta" && s === "offri") { if (H.off[id] == null) { H.passati[id] = 1; bd(); controlla(); } return; }
      if (f === "premio" && s === "gioca" && H.premio) { H.premio.fatti[id] = 1; bd(); controlla(); return; }
      if (f === "vetrina" && s === "offri") { if (H.vet.off[id] == null) { if (H.vet.b && !H.vet.sc[id]) { H.vet.sc[id] = "a"; preparaIndizio(id); } H.vpassati[id] = 1; bd(); controlla(); } return; }
      if (f === "scegli" && H.scelta) return scegli(H.scelta.chi, H.scelta.opz[0]);
      if (f === "ruota" && H.ruota) {
        var x = H.ruota.g[id]; if (!x) return;
        if (s === "bonus") { if (x.cento && x.b == null) { x.b = tira(); bd(); controlla(); } return; }
        if (x.v1 == null) return spinta(id, 0.5);
        if (x.si == null && x.v1 < 100) return ancora(id, false);
        if (x.si === true && x.v2 == null) return spinta(id, 0.5);
      }
    }
    // tutte le mosse passano da qui (online dai telefoni degli amici, qui dai tasti di questo telefono)
    function mossa(id, m) {
      if (!m || !m.t || H.fase === "lobby" || H.fase === "fine") return;
      if (m.k != null && m.k !== H.k) return;   // una mossa di un passo vecchio (arrivata in ritardo): non vale
      var p = pById(id); if (p && p.via && online) { p.via = false; }   // si è rifatto vivo
      if (m.t === "avanti") return avanti(id);
      if (m.t === "offerta") return offerta(id, m.v);
      if (m.t === "scelta") return scegli(id, m.g);
      if (m.t === "premio") return mossaPremio(id, m.m);
      if (m.t === "spinta") return spinta(id, m.f);
      if (m.t === "ancora") return ancora(id, m.si);
      if (m.t === "vetrina") return offVetrina(id, m.v);
      if (m.t === "vscelta") return sceltaVet(id, !!m.b);
      if (m.t === "passa") return passa(id);
      if (m.t === "finiti") return finiti();
    }
    // sullo stesso telefono: hanno girato tutti (e la ruota dell'ultimo si è fermata): si scopre com'è andata
    function finiti() {
      if (modo !== "telefono" || H.fase !== "ruota" || !H.ruota) return;
      var x = function (id) { return H.ruota.g[id] || {}; }, conta = presenti().filter(function (p) { return H.ruota.g[p.id]; });
      if (H.sotto === "turni" && conta.every(function (p) { return x(p.id).v1 != null && (x(p.id).si === false || x(p.id).v2 != null); })) return dopo(300, rivRuota);
      if (H.sotto === "bonus" && conta.every(function (p) { return !x(p.id).cento || x(p.id).b != null; })) return dopo(300, rivBonus);
    }
    function fine() {
      ferma();
      var perPunti = function (a, b) { return b.punti - a.punti; };
      var dentro = presenti().sort(perPunti), fuori = H.players.filter(function (p) { return p.via; }).sort(perPunti);
      var riga = function (gr, base) { return function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, bot: !!p.bot,
        pos: base + 1 + gr.filter(function (q) { return q.punti > p.punti; }).length }; }; };
      H.classifica = dentro.map(riga(dentro, 0)).concat(fuori.map(riga(fuori, dentro.length)));
      H.fase = "fine"; H.sotto = null; H.k++; H.scadenza = 0;
      bd();
      // la Classifica della serata e gli XP: i NOMI dei giocatori col loro posto (sullo stesso telefono e col Bot lo fa t.fine)
      if (online && t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, tutti tornano nella saletta (MAI chiudere e riaprire la stanza)
    function nuova() {
      if (H.fase !== "fine") return;
      ferma(); clearTimeout(tAttesi); attesi = {}; H.fase = "lobby"; H.sotto = null; H.k++; H.scadenza = 0; H.classifica = null; H.respiro = null;
      H.players = presenti();
      // chi tiene la partita è il primo (in saletta ha la corona); se l'ha presa guardando (host di riserva), si siede
      if (online && !pById(IO)) { H.guarda = H.guarda.filter(function (x) { return x !== IO; }); H.players.unshift({ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0, carrello: [] }); }
      H.players.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });
      H.players.forEach(function (p) { p.punti = 0; p.carrello = []; });
      H.arrivi.forEach(function (a) { if (!pById(a.id) && H.players.length < MAX_ON) H.players.push({ id: a.id, nome: a.nome, omino: a.omino || null, punti: 0, carrello: [] }); });
      H.arrivi = [];
      bd();
    }
    t.onRivincita = function () { if (H.fase === "fine") nuova(); };

    var cbHost = { sonoHost: true, myId: modo === "telefono" ? null : IO, locale: online ? null : modo,
      onComincia: comincia, onNuova: nuova,
      mossa: function (m, id) { mossa(modo === "telefono" ? id : IO, m); },
      onAvanti: function () { mossa(IO, { t: "avanti", k: H.k }); },
      onEsci: function (giaChiesto) {
        function via() { ferma(); clearTimeout(tAttesi); if (online && t.ricorda) t.ricorda(null); if (rete) rete.chiudi(); t.esci(); }
        // (dallo studio la domanda l'ha già fatta lui; dalla saletta il core)
        if (giaChiesto !== true && online && H.fase !== "lobby" && H.fase !== "fine") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla Sala.", "Chiudi", via);
        via();
      } };
    window.__prezzoH = H;   // (per le prove)
    if (online) { if (riprendo) riprendi(); else bd(); }
    else comincia();
  }

  // durate dei passi (le usano l'host per aspettare e la regia per andare a tempo)
  function durRivela(e) { return RV.cam + RV.rullo + Z().durataConta(e.prezzo, RV.cifra) + RV.dopoConta + e.righe.length * RV.riga + RV.banner + (e.cattivo ? RV.cattivo : 0) + RV.leggii + 700; }
  function durVetMostra(n, mist) { return 700 + 900 + n * RVET.pezzo + 1500 + (mist ? RVET.mist : 0); }
  // (con la misteriosa: prima i prezzi della vetrina vista, poi «…e la misteriosa era» coi suoi pezzi e i suoi prezzi)
  function durVetRiv(e) {
    var nA = e.usaA === false ? 0 : e.prezzi.length, nB = e.prezziB && e.usaB !== false ? e.prezziB.length : 0;
    return RV.cam + (nA ? RV.rullo + nA * RVET.prezzo + Z().durataConta(e.prezzo, RVET.cifra) + 400 : 0) +
      (nB ? RVET.mist + nB * (RVET.pezzoB + RVET.prezzo) + Z().durataConta(e.totB, RVET.cifra) + 400 + (nA ? RVET.riass : 0) + 900 : 0) +   // (+900: i telefoni non restano indietro)
      e.righe.length * RVET.riga + RVET.banner + (e.tutti && e.tutti.length ? RVET.tutto : 0) + RV.leggii + 700;
  }
  function durRuotaRiv(e) { return RV.cam + 400 + e.righe.length * RRU.riga + (e.cento.length ? RRU.cento : 0) + RRU.banner + RV.leggii + 600; }
  function durCarrello(n) { return 700 + 900 + n * 900 + 2800; }

  // =========================================================
  //  OSPITE: entra nella stanza, disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var G = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null, locale: null,
      mossa: function (m) { if (G.rete) G.rete.invia(m); },
      onAvanti: function () { if (G.rete && G.vm) G.rete.invia({ t: "avanti", k: G.vm.k }); },
      onEsci: function (giaChiesto) {
        function via() { if (G.rete) G.rete.chiudi(); t.esci(); }
        if (t.guarda && giaChiesto !== true) return t.conferma("Smetti di guardare?", null, "Esci", via);   // (chi guarda soltanto: non lascia un posto)
        if (giaChiesto !== true && G.vm && G.vm.fase !== "lobby" && G.vm.fase !== "fine") return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { G.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ chiara: true, icona: "🏷️", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        G.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      var s = t.schermata({ chiara: true, icona: "🏷️", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
      G.rete = SGNet.entra(codice, {
        onAperto: function (id) { G.myId = id; cb.myId = id; G.rete.invia({ t: "join", nome: G.nome, omino: t.mioOmino(G.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== G.myId) return;   // era per un altro telefono
          if (m.t === "vm") { G.vm = m.vm; disegnaVM(t, m.vm, cb); }
          else if (m.t === "priv") privatoR(m);
        },
        // l'host ha chiuso apposta: sulla classifica finale resta la classifica (lo dice il core); altrimenti si esce
        onChiuso: function (perche) {
          if (G.vm && G.vm.fase === "fine") return;
          errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "🚪 L'host ha chiuso la partita.");
        },
        // (solo se il primo collegamento non riesce)
        onErrore: function () { if (G.rete) G.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!G.rete) senzaRete(t);
    }
  }

  // =========================================================
  //  LA REGIA DI OGNI TELEFONO: saletta, poi lo studio
  // =========================================================
  var R = null;   // la regia di questo telefono (una per partita)
  function idxDi(vm, id) { for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return i; return -1; }
  function gDi(vm, id) { var i = idxDi(vm, id); return i >= 0 ? vm.players[i] : null; }
  function nomeDi(vm, id) { var p = gDi(vm, id); return p ? p.nome : "?"; }
  function fac(el, g, faccia) { return el("span", { class: "fac", html: ST.avatarDi(g || { nome: "?" }, faccia) }); }
  function mio(R) { var p = gDi(R.vm, R.cb.myId); return p && !p.via ? p : null; }
  // chi guarda soltanto ha la targhetta del core con le faccine e l'uscita: il gioco non mette le sue (sarebbero doppie)
  function conTarga(t) { return !!(t && t.guarda && !t.eliminazione); }
  function faccine(R) { return conTarga(R.t) ? null : R.t.faccine(); }
  function vivoK(R, k) { return R.S.vivo() && R.vm.k === k && !R.fineFatta; }
  function medaglia(p) { return ["🥇", "🥈", "🥉"][p - 1] || p + "°"; }
  // «Vince Luca», «Vinci tu», «Vincono Luca e Sara», «Vincete tu e Sara»
  function chiVince(vince, me, vm) {
    var io = vince.indexOf(me) >= 0, l = vince.filter(function (id) { return id !== me; }).map(function (id) { return nomeDi(vm, id); });
    if (io) l.unshift("tu");
    return (vince.length > 1 ? (io ? "Vincete " : "Vincono ") : (io ? "Vinci " : "Vince ")) + nomi(l);
  }
  // «Ti porti», «Luca si porta», «Tu e Sara vi portate», «Luca e Sara si portano»
  function chiPorta(ids, me, vm) {
    var io = ids.indexOf(me) >= 0, l = ids.filter(function (id) { return id !== me; }).map(function (id) { return nomeDi(vm, id); });
    if (io && !l.length) return "Ti porti";
    if (io) l.unshift("Tu");
    return nomi(l) + (io ? " vi portate" : l.length > 1 ? " si portano" : " si porta");
  }
  function nomi(lista) { return lista.length < 2 ? lista.join("") : lista.slice(0, -1).join(", ") + " e " + lista[lista.length - 1]; }

  // le foto si scaricano appena il prodotto è nella foto della partita (mentre il sipario è ancora chiuso)
  // (grande per la scheda e i riquadri, piccola per le righe e il carrello: sono due misure diverse)
  function precaricaFoto(vm) {
    if (vm.prod) { Z().precarica(vm.prod, 500); Z().precarica(vm.prod, 330); }
    if (vm.vet && vm.vet.pezzi) vm.vet.pezzi.forEach(function (x) { Z().precarica(x, 500); Z().precarica(x, 330); });
    if (vm.vet) (vm.vet.bFoto || (vm.vet.b || {}).pezzi || []).forEach(function (x) { Z().precarica(x, 500); Z().precarica(x, 330); });
    var pp = vm.premio && vm.premio.pub && vm.premio.pub.prod;
    if (pp) (Array.isArray(pp) ? pp : [pp]).forEach(function (x) { Z().precarica(x, 500); Z().precarica(x, 330); });
  }
  function disegnaVM(t, vm, cb) {
    Z().stile();
    if (vm.fase === "lobby") { if (R) { try { R.pan.giu(); } catch (e) {} } R = null; return lobbyP(t, vm, cb); }
    if (!R || R.t !== t) R = nuovaRegia(t, vm, cb);
    else if (!R.S.vivo() && !R.fineFatta) return;   // il core ha portato via il gioco: la regia si ferma
    R.vm = vm; R.cb = cb; R.vmTs = Date.now();
    if (R.fineFatta) return;
    stimaFine(R, vm);
    window.__prezzoR = R;   // (per le prove: il tempo del telefono)
    precaricaFoto(vm);
    sincronizzaLeggii(R);
    leggii(R);
    if (R.kFatto === vm.k) aggiornaFase(R);
    R.attese = R.attese.filter(function (a) { try { if (a.cond(vm)) { a.ok(vm); return false; } } catch (e) {} return true; });
    regiaTick(R);
  }
  // ---------------- il tempo sul telefono (24 ott 2026, il proprietario: un tocco all'ultimissimo istante può non arrivare) ----------------
  // Online il tempo del telefono finisce ANTICIPO ms prima di quello di chi tiene la partita: la mossa dell'ultimo istante
  // (e quella che il pannello manda da solo allo scadere) fa in tempo ad arrivare. E della fine si tiene la stima più corta
  // tra le foto dello stesso passo: una foto vecchia (come quella trattenuta che riceve per prima chi ricarica) crede che
  // manchi più tempo; quando arriva quella nuova, la barra già aperta si accorcia.
  var ANTICIPO = 1000;
  function stimaFine(R, vm) {
    if (!vm.restaMs) return;
    var f = R.vmTs + vm.restaMs, s = R.stima;
    if (!s || s.k !== vm.k) { R.stima = { k: vm.k, f: f }; return; }
    if (f >= s.f - 150) return;
    var d = s.f - f; s.f = f;
    if (R.cb.locale) return;
    [R.tempoPan, R.tempoAttesa].forEach(function (tb) { if (tb && tb._k === vm.k && !tb.finito()) tb.allunga(tb.fine() - d); });
  }
  // quando finisce il tempo di questo passo sul telefono
  function fineVM(R) {
    var vm = R.vm, f = R.stima && R.stima.k === vm.k ? R.stima.f : R.vmTs + (vm.restaMs || 0);
    return f - (R.cb.locale ? 0 : ANTICIPO);
  }
  // la barra del pannello, legata al passo in cui si apre (solo quella si accorcia)
  function barraDi(R, tb) { tb._k = R.vm.k; return tb; }
  function nuovaRegia(t, vm, cb) {
    var S = ST.crea(t, vm.players.map(function (p) { return { nome: p.nome, omino: p.omino }; }), { io: idxDi(vm, cb.myId), esci: function () { cb.onEsci(true); }, titolo: NOME, logo: LOGO });
    var X = { t: t, cb: cb, S: S, vm: vm, vmTs: Date.now(), pan: Z().pannello(S), kFatto: null, ui: {}, mie: {}, usciti: {}, attese: [],
      ids: vm.players.map(function (p) { return p.id; }).join("|") };
    vm.players.forEach(function (p, i) { ST.puntiLeggio(S, i, p.punti, 0); });
    if (conTarga(t)) S.vista.classList.add("st-con-targa");   // chi guarda soltanto: in basso la targhetta del core («👀 Guardi · 😂 · ✕»)
    return X;
  }
  // chi è arrivato a partita cominciata entra: i leggii si rifanno (succede solo all'inizio di un oggetto)
  function sincronizzaLeggii(R) {
    var ids = R.vm.players.map(function (p) { return p.id; }).join("|");
    if (ids === R.ids) return;
    R.ids = ids; R.usciti = {};
    R.S.impostaGiocatori(R.vm.players.map(function (p) { return { nome: p.nome, omino: p.omino }; }), idxDi(R.vm, R.cb.myId));
    R.vm.players.forEach(function (p, i) { ST.puntiLeggio(R.S, i, p.punti, 0); });
  }
  // il display dei leggii: punti, oppure l'offerta / la spunta / il numero della ruota mentre si gioca
  function leggii(R) {
    var vm = R.vm, S = R.S, f = vm.fase, s = vm.sotto; if (!S.vivo()) return;
    var fermi = (f === "offerta" && s === "rivela") || (f === "premio" && s === "riv") || (f === "ruota" && (s === "riv" || s === "rivb")) || (f === "vetrina" && s === "riv") || f === "fine";
    vm.players.forEach(function (p, i) {
      if (p.via) { if (!R.usciti[p.id]) { R.usciti[p.id] = 1; ST.fuori(S, i, true); } ST.testoLeggio(S, i, "👋 uscito", true); return; }
      if (R.usciti[p.id]) { delete R.usciti[p.id]; ST.fuori(S, i, false); }
      if (p.forse) return ST.testoLeggio(S, i, "📶 …");
      if (f === "offerta" && s === "offri") { var v = (vm.off || {})[p.id], ok = v != null || (vm.offFatti || []).indexOf(p.id) >= 0; return ST.testoLeggio(S, i, v != null ? E(v) : ok ? "✅" : (vm.passati || []).indexOf(p.id) >= 0 ? "😶" : "🤔"); }
      if (f === "vetrina" && (s === "offri" || s === "scegli")) return ST.testoLeggio(S, i, ((s === "scegli" ? vm.vet.sFatti : vm.vet.fatti) || []).indexOf(p.id) >= 0 ? "✅" : "🤔");
      if (f === "premio" && s === "gioca") return ST.testoLeggio(S, i, ((vm.premio || {}).fatti || []).indexOf(p.id) >= 0 ? "✅" : "🎮");
      if (f === "ruota" && !fermi && vm.ruota) {
        var x = vistaRuota(R, p.id); if (!x) return ST.puntiLeggio(S, i, p.punti, 0);
        var tot = (x.v1 || 0) + (x.v2 || 0);
        return ST.testoLeggio(S, i, x.v1 == null ? "🎡" : tot > 100 ? "💥 " + tot : String(tot), tot > 100);
      }
      if (fermi) return;   // la rivelazione mostra lei i punti, con l'animazione
      ST.puntiLeggio(S, i, p.punti, 0);
    });
  }
  async function regiaTick(R) {
    if (R.corre) { R.ancora = true; return; }
    R.corre = true;
    try {
      for (var giri = 0; giri < 40; giri++) {
        R.ancora = false;
        var fatto = await regiaPasso(R);
        if (!fatto && !R.ancora) break;
      }
    } catch (e) { try { console.error("[prezzo] regia", e); } catch (x) {} } finally { R.corre = false; }
  }
  // aspetta che la foto dica qualcosa (es. il numero della mia ruota): Promise
  function aspettaVm(R, cond) { return new Promise(function (ok) { try { if (cond(R.vm)) return ok(R.vm); } catch (e) {} R.attese.push({ cond: cond, ok: ok }); }); }
  async function regiaPasso(R) {
    var vm = R.vm; if (!R.S.vivo() || R.fineFatta) return false;
    if (R.kFatto === vm.k) return false;
    var k = vm.k; R.kFatto = k; R.ui = {};
    chiudiInput(R);
    var f = vm.fase, s = vm.sotto;
    try {
      if (f === "apertura") await apertura(R);
      else if (f === "offerta") await (s === "prodotto" ? fProdotto : s === "offri" ? fOffri : s === "sopra" ? fSopra : fRivela)(R);
      else if (f === "scegli") await fScegli(R);
      else if (f === "premio") await (s === "intro" ? fIntro : s === "gioca" ? fGioca : fPremioRiv)(R);
      else if (f === "punti") await fPunti(R);
      else if (f === "ruota") await fRuota(R);
      else if (f === "vetrina") await (s === "mostra" ? fVetMostra : s === "scegli" ? fVetScegli : s === "offri" ? fVetOffri : fVetRiv)(R);
      else if (f === "carrello") await fCarrello(R);
      else if (f === "fine") await fFine(R);
    } catch (e) { try { console.error("[prezzo] passo " + f + "/" + s, e); } catch (x) {} }
    return true;
  }
  // si cambia passo: giù il pannello e via i tasti di prima
  function chiudiInput(R) {
    clearTimeout(R.toAttesa);
    if (R.tempoPan) { R.tempoPan.ferma(); R.tempoPan = null; }
    if (R.ruotaUI && R.ruotaUI.ru) R.ruotaUI.ru.attiva(false);
    R.tast = null; R.premioPan = null; R.ruotaUI = null; R.bAvanti = null;
    R.pan.giu(); ST.viaBarra(R.S); ST.viaTerzo(R.S);
  }
  // in basso, per chi aspetta o guarda: una riga e le faccine
  function attesa(R, testo) {
    var el = R.t.el, vm = R.vm; R.pan.giu();
    // i secondi che mancano (niente attesa senza tempo): una barretta muta sotto la riga
    var resta = vm.restaMs ? fineVM(R) - Date.now() : 0, tb = null;   // (la stessa fine della barra del pannello: dopo un tocco il conto continua uguale)
    if (R.cb.locale !== "telefono" && resta > 1500 && vm.fase !== "punti") tb = barraDi(R, Z().barraTempo(el, Date.now() + resta, null, { muto: true, cls: "mini" }));
    R.tempoAttesa = tb;
    ST.barra(R.S, [ el("p", { class: "pz-attesa", text: testo }), tb ? tb.el : null, faccine(R) ]);
  }
  function guardaTesto(R) {
    var vm = R.vm, id = R.cb.myId;
    if (R.t.guarda) return "👀 Guardi la puntata";
    if ((vm.guarda || []).indexOf(id) >= 0) return "👀 Questa volta guardi: gioca chi è stato scelto.";
    if ((vm.arrivi || []).some(function (a) { return a.id === id; })) return "👋 Ci sei! Entri al prossimo oggetto.";
    return "👀 Stai guardando: alla prossima partita giochi anche tu.";
  }
  function fumetto(S, testo) { S.fumetto.textContent = testo; S.fumetto.classList.remove("on"); void S.fumetto.offsetWidth; S.fumetto.classList.add("on"); }
  // il maxischermo: si svuota e si riempie (una volta per passo)
  function schermo(R, nodi, cls) {
    ST.fermaTimer(R.S); ST.vuota(R.S.sch); R.schKey = null;
    if (R.oss) { R.oss.disconnect(); R.oss = null; }
    var box = R.t.el("div", { class: "pz-sch" + (cls ? " " + cls : "") }, nodi);
    R.S.sch.appendChild(box); return box;
  }
  // Riempire lo schermo (23 ott 2026, il proprietario: «ci sono tanti spazi vuoti», «le immagini un po' più grandi»): le
  // schermate sono fatte per i telefoni piccoli; su quelli alti foto, scritte e righe si ingrandiscono finché lo spazio c'è.
  // Si prova dalla misura più grande alla più piccola e si tiene la prima che ci sta tutta (in alto e di lato); «stretta»
  // (la lista della Vetrina) all'ultimo passa a «fitta». Si rifà quando il pannello in basso sale o scende e quando qualcosa
  // dentro cambia misura. Quello che compare dopo deve essere già al suo posto, nascosto: se no a metà schermata tutto si
  // rimpicciolirebbe di colpo.
  var ZOOM = [1.5, 1.38, 1.26, 1.15, 1.06, 1], LARGO_MIN = 250;
  function riempi(R, stretta) {
    var sch = R.S.sch.querySelector(".pz-sch"); if (!sch) return;
    function ci() { return sch.scrollHeight <= sch.clientHeight + 1 && sch.scrollWidth <= sch.clientWidth + 1; }
    function prova() {
      if (!sch.isConnected) return;
      if (stretta) stretta.classList.remove("fitta");
      // (mai più largo di così: le righe devono avere posto per i nomi; nella vista larga dello studio non si ingrandisce)
      var max = Math.max(1, sch.clientWidth / LARGO_MIN);
      // («alto»: ingrandita, la schermata arriva fino in cima e lascia posto ai tasti tondi; alla misura normale com'era prima)
      for (var i = 0; i < ZOOM.length; i++) { if (ZOOM[i] > max + 0.001) continue; sch.classList.toggle("alto", ZOOM[i] > 1); sch.style.setProperty("--pz-z", ZOOM[i]); if (ci()) return; }
      if (stretta) stretta.classList.add("fitta");
    }
    sch.classList.add("riempi"); prova();
    if (R.oss) R.oss.disconnect(); R.oss = null;
    // (la misura si rifà al fotogramma dopo, mai dentro l'avviso del browser: se no «ResizeObserver loop»)
    if (window.ResizeObserver) {
      var misura = function () { return sch.clientHeight + "x" + sch.clientWidth + "|" + [].map.call(sch.children, function (c) { return c.offsetHeight; }).join(","); };
      var ult = misura(), pend = false;
      R.oss = new ResizeObserver(function () {
        if (pend) return; pend = true;
        requestAnimationFrame(function () { pend = false; if (!sch.isConnected) return; var m = misura(); if (m === ult) return; prova(); ult = misura(); });
      });
      R.oss.observe(sch); [].forEach.call(sch.children, function (c) { R.oss.observe(c); });
    }
  }
  // nascosto ma al suo posto (per riempi): si scopre dopo, con l'animazione d'entrata
  function nascondi(n) { n.style.visibility = "hidden"; n.style.animation = "none"; return n; }
  function scopri(n) {
    n.style.visibility = ""; n.style.animation = "";
    [].forEach.call(n.querySelectorAll("*"), function (c) { if (!c.getAttribute("style") && getComputedStyle(c).animationName !== "none") { c.style.animation = "none"; void c.offsetWidth; c.removeAttribute("style"); } });
    return n;
  }
  function testa(R, testo) {
    var vm = R.vm, el = R.t.el;
    if (testo == null) testo = vm.formato === "solo" ? "🏷️ Oggetto " + vm.iOff + " di " + vm.nOff : "🏷️ L'Offerta · " + vm.iOff + " di " + vm.nOff;
    return el("div", { class: "pz-testa" }, [ el("span", { text: testo }), vm.doppio && vm.fase === "offerta" ? el("span", { class: "x2", text: "🔥 ×2" }) : null ]);
  }
  function miniProd(el, p) { return Z().miniprod(el, p); }
  function testaPan(R, chi, testo, tb) {
    var el = R.t.el;
    return el("div", { class: "pz-pan-testa" }, [ chi ? fac(el, chi) : null, el("span", { class: "tx", text: testo }), tb ? tb.el : null ]);
  }
  // i punti scorrono sui leggii (inquadratura larga), con le facce
  async function leggiiDelta(R, k, delta) {
    var S = R.S, vm = R.vm;
    await ST.largo(S, 900); if (!vivoK(R, k)) return;
    vm.players.forEach(function (p, i) {
      if (p.via) return;
      var d = delta[p.id] || 0;
      ST.puntiLeggio(S, i, p.punti, d);
      if (d > 0) ST.faccia(S, i, "esulta");
    });
    await ST.dorme(1700); if (!vivoK(R, k)) return;
    ST.tutteNormali(S);
  }
  // le voci della classifica (punti, a pari punti stesso posto)
  function classificaDi(vm) {
    var l = vm.players.filter(function (p) { return !p.via; }).sort(function (a, b) { return b.punti - a.punti; });
    return l.map(function (p) { return { p: p, pos: 1 + l.filter(function (q) { return q.punti > p.punti; }).length }; });
  }

  // ---------------- la saletta ----------------
  function lobbyP(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; }), guardo = (vm.guarda || []).indexOf(cb.myId) >= 0;
    var riga = vm.formato === "solo" ? "🎯 Solo il prezzo: esce un oggetto, scrivete il prezzo e vince chi ci va più vicino." :
      "📺 Come in TV: l'Offerta, i giochi a premi, la Ruota del 100 e la Vetrina finale. Ognuno dal suo telefono, tutti insieme.";
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN_ON,
      vuoti: Math.max(0, MIN_ON - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota", style: "margin:0;font-size:14px;line-height:1.45", text: riga })],
      spettatore: t.guarda ? "👀 Guardi soltanto" : guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX_ON ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  // ---------------- la sigla: «Paky, vieni giù!» ----------------
  async function apertura(R) {
    var S = R.S, vm = R.vm, k = vm.k, n = vm.players.length;
    ST.logoSchermo(S);
    if (S.pubPronto) await S.pubPronto;
    if (!vivoK(R, k)) return;
    await ST.suPubblico(S, 0, 0);
    ST.terzo(S, null, "In diretta dallo studio", vm.formato === "solo" ? "🎯 Solo il prezzo" : "📺 Come in TV", "📺");
    ST.pubblico(S, "applauso");
    await ST.dorme(600); if (!vivoK(R, k)) return;
    await ST.suSchermo(S, 1600); if (!vivoK(R, k)) return;
    ST.terzo(S, null, "I concorrenti di stasera sono…", "", "🎤"); Z().FX.tada();
    await ST.dorme(400); await ST.suPubblico(S, 1, 1600); ST.viaTerzo(S);
    await ST.largo(S, 1300); await ST.dorme(400);
    if (n <= 4) {
      for (var i = 0; i < n; i++) {
        if (!vivoK(R, k)) return;
        await ST.suLeggio(S, i, 850); ST.accendiSolo(S, i); ST.faccia(S, i, "esulta");
        ST.terzo(S, i, vm.players[i].nome + ", vieni giù!", i === S.io ? "Sei tu! In bocca al lupo" : "Concorrente n° " + (i + 1));
        ST.pubblico(S, "piano");
        await ST.dorme(700); ST.faccia(S, i, null); ST.viaTerzo(S);
      }
      ST.accendiSolo(S, -1);
    } else {
      for (var fl = 0; fl < S.file; fl++) {
        if (!vivoK(R, k)) return;
        var chi = []; S.posti.forEach(function (p, j) { if (p.fila === fl && vm.players[j]) chi.push(vm.players[j].nome); });
        ST.terzo(S, null, nomi(chi) + ", venite giù!", fl ? "…e in seconda fila!" : "Ecco i concorrenti!", "🎤");
        ST.pubblico(S, "applauso");
        await ST.panFila(S, fl, 2600, function (j) { ST.accendi(S, j, true); ST.faccia(S, j, "esulta"); setTimeout(function () { ST.accendi(S, j, false); ST.faccia(S, j, null); }, 900); });
      }
      ST.viaTerzo(S);
    }
    await ST.largo(S, 1000); await ST.dorme(300);
  }

  // ---------------- L'OFFERTA ----------------
  function schOfferta(R, aperto) {
    var vm = R.vm, el = R.t.el, key = "off|" + vm.iOff;
    if (R.schKey === key && R.schOff && R.schOff.box.isConnected) { if (aperto) R.schOff.sip.aperto(); return R.schOff; }
    var sk = Z().scheda(el, vm.prod, {}), sip = Z().sipario(el, sk);
    if (aperto) sip.aperto();
    var nota = el("div", { class: "pz-sotto" }), tab = el("div", { class: "pz-tab" + (vm.players.length > 5 ? " fitto" : "") });
    var box = schermo(R, [ testa(R), sip.el, nota, tab ]);
    R.schKey = key; R.schOff = { box: box, sip: sip, nota: nota, tab: tab, chips: {} };
    return R.schOff;
  }
  // il tabellone delle offerte: a vista i prezzi (dal più basso), segrete solo chi ha già offerto
  function aggiornaTab(R) {
    var U = R.schOff, vm = R.vm, el = R.t.el;
    if (!U || !U.tab.isConnected || vm.fase !== "offerta") return;
    var vista = !!vm.off, off = vm.off || {}, fatti = vm.offFatti || Object.keys(off);
    var lista = vm.players.filter(function (p) { return !p.via; });
    // a vista, appena arriva un «+1 €» su un altro: il pubblico fischia subito (la prima foto dopo una ricarica non conta)
    if (vista && vm.sotto === "offri") {
      if (U.rif !== (vm.rifai || 0)) { U.rif = vm.rifai || 0; U.visti = null; }
      var ord = vm.ord || Object.keys(off), prima = !U.visti;
      U.visti = U.visti || {};
      ord.forEach(function (id, i) {
        if (U.visti[id] || off[id] == null) return; U.visti[id] = 1;
        if (prima) return;
        Z().FX.toc(760);
        var su = ord.slice(0, i).filter(function (a) { var d = Math.round((off[id] - off[a]) * 100) / 100; return a !== id && (d === 1 || (vm.prod && vm.prod.cent && d === 0.1)); })[0];
        if (su) { Z().FX.buu(); fumetto(R.S, "Buuu! 😈 +" + E(off[id] - off[su])); }
      });
    }
    if (vista) lista.sort(function (a, b) { var x = off[a.id], y = off[b.id]; return (x == null) - (y == null) || (x || 0) - (y || 0); });
    lista.forEach(function (p) {
      var c = U.chips[p.id];
      if (!c) { c = U.chips[p.id] = el("div", { class: "pz-och" }, [ fac(el, p), el("span", { class: "nm", text: p.id === R.cb.myId ? "Tu" : p.nome.slice(0, 8) }), el("span", { class: "v" }) ]); setTimeout(function () { c.style.animation = "none"; }, 500); }
      var ha = vista ? off[p.id] != null : fatti.indexOf(p.id) >= 0, tx = vista ? (ha ? E(off[p.id]) : "…") : (ha ? "✅" : "…");
      var v = c.querySelector(".v"); if (v.textContent !== tx) v.textContent = tx;
      c.classList.toggle("aspetta", !ha); c.classList.toggle("ok", ha && !vista);
      if (U.tab.lastChild !== c || c.parentNode !== U.tab) U.tab.appendChild(c);
    });
  }
  async function fProdotto(R) {
    var S = R.S, vm = R.vm, k = vm.k;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 700); if (!vivoK(R, k)) return;
    var U = schOfferta(R, false);
    U.nota.textContent = "";
    await ST.dorme(450); if (!vivoK(R, k)) return;
    U.sip.apri(); Z().FX.tada();
    ST.pubblico(S, "piano"); fumetto(S, "Ooooh! 😮");
    if (vm.doppio) ST.terzo(S, null, "🔥 Ultimo oggetto!", "Vale doppio", "🔥");
    await ST.dorme(2700); ST.viaTerzo(S);
  }
  async function fOffri(R) {
    var S = R.S, vm = R.vm, k = vm.k;
    var U = schOfferta(R, true); aggiornaTab(R);
    // la regola sempre sotto gli occhi: senza superarlo (o sopra o sotto) e come sono le offerte
    var senza = vm.formato !== "solo" || vm.sforare;
    U.nota.textContent = vm.rifai ? "😬 Si rifà! Tutti sotto i " + E(vm.limite) : (senza ? "⬇️ Senza superarlo!" : "↕️ Sopra o sotto") + (vm.offerte === "vista" ? " · 👀 occhio al «+1 €»" : " · 🤫 offerte segrete");
    if (vm.rifai) ST.terzo(S, null, "Tutti sotto i " + E(vm.limite) + "!", "Si rifà una volta sola", "😬");
    await ST.suSchermo(S, 300); if (!vivoK(R, k)) return;
    if (R.cb.locale === "telefono") return turniOfferte(R, k);
    apriOfferta(R);
  }
  function offertaDi(R, id) { var vm = R.vm; if (vm.off && vm.off[id] != null) return vm.off[id]; if (R.mie["o" + vm.k] != null && R.mie.oId === id) return R.mie["o" + vm.k]; if ((vm.offFatti || []).indexOf(id) >= 0) return true; return null; }
  function apriOfferta(R) {
    var vm = R.vm, me = mio(R);
    if (!me) return attesa(R, guardaTesto(R));
    var gia = offertaDi(R, me.id);
    if (gia != null) return attesa(R, gia === true ? "✅ Hai fatto la tua offerta · aspettiamo gli altri…" : "✅ Hai offerto " + E(gia) + " · aspettiamo gli altri…");
    pannelloOfferta(R, me, fineVM(R), function (v) { R.cb.mossa({ t: "offerta", k: vm.k, v: v }); }, {});
  }
  function listaOfferte(R, mioId) { var off = R.vm.off || {}; return Object.keys(off).map(function (id) { return { nome: id === mioId ? "Tu" : nomeDi(R.vm, id), v: off[id], mia: id === mioId }; }); }
  // il tastierino nel pannello: per l'Offerta e per la Vetrina (opz.vetrina)
  function pannelloOfferta(R, chi, fine, manda, opz) {
    var vm = R.vm, el = R.t.el, k = vm.k, vista = vm.offerte === "vista" && !opz.vetrina && vm.fase === "offerta";
    var tast = Z().tastierino(el, {
      cent: opz.vetrina ? false : !!(vm.prod && vm.prod.cent), limite: opz.vetrina ? null : vm.limite,
      testoOk: opz.vetrina ? "🛍️ Offro per tutto!" : "🏷️ Offro!",
      preso: vista ? function (v) { var off = R.vm.off || {}; for (var id in off) if (id !== chi.id && Math.abs(off[id] - v) < 1e-9) return nomeDi(R.vm, id); return null; } : null,
      offerte: vista ? listaOfferte(R, chi.id) : [],
      sopra: opz.sopra || [],
      onOk: function (v) {
        manda(v);
        R.mie.oId = chi.id;
        // accettata: dopo un attimo il pannello scende (resta la riga in basso). Se l'host dice «già preso», si riapre
        if (R.cb.locale !== "telefono") { clearTimeout(R.toAttesa); R.toAttesa = setTimeout(function () { if (R.tast === tast && vivoK(R, k)) attesa(R, "✅ Hai offerto " + E(v) + " · aspettiamo gli altri…"); }, 1300); }
      }
    });
    R.tast = tast; R.tastChi = chi.id; R.tastK = k;
    var tb = Z().barraTempo(el, fine, function () { if (R.tast === tast) tast.blocca("⏰ Tempo scaduto"); if (opz.allaFine) opz.allaFine(); });
    R.tempoPan = barraDi(R, tb);
    var tit = opz.titolo || (R.cb.locale === "telefono" ? chi.nome + ", il tuo prezzo" : opz.vetrina ? "🛍️ Il totale" : "🏷️ Il tuo prezzo");
    R.pan.metti([ testaPan(R, chi, tit, tb), tast.el ]).su();
    return tast;
  }
  // sullo stesso telefono: a turno (l'ordine gira a ogni oggetto); segrete = si passa il telefono
  async function turniOfferte(R, k) {
    var vm = R.vm, pres = vm.players.filter(function (p) { return !p.via; }), n = pres.length, start = ((vm.iOff || 1) - 1) % Math.max(1, n);
    var ordine = []; for (var q = 0; q < n; q++) ordine.push(pres[(start + q) % n]);
    var segrete = vm.offerte === "segrete";
    for (q = 0; q < ordine.length; q++) {
      var g = ordine[q];
      if (!vivoK(R, k)) return;
      if (offertaDi(R, g.id) != null || (R.vm.passati || []).indexOf(g.id) >= 0) continue;
      await turno(R, k, g, segrete ? "Passa il telefono a " + g.nome : "Guarda le offerte e fai la tua", function () {
        pannelloOfferta(R, g, Date.now() + TL.offri, function (v) { R.cb.mossa({ t: "offerta", k: k, v: v }, g.id); },
          { allaFine: function () { R.cb.mossa({ t: "passa", k: k }, g.id); } });
      }, function (vm2) { return (vm2.off && vm2.off[g.id] != null) || (vm2.offFatti || []).indexOf(g.id) >= 0 || (vm2.passati || []).indexOf(g.id) >= 0; });
    }
  }
  // un turno sullo stesso telefono: stacco sul leggio, «Sono Luca», il pannello; finisce quando la foto dice che ha fatto
  async function turno(R, k, g, sotto, apri, fatto) {
    var S = R.S, i = idxDi(R.vm, g.id);
    R.pan.giu(); ST.viaBarra(S);
    await ST.stacco(S, i, sotto); if (!vivoK(R, k)) return;
    await ST.aspettaTasto(S, "📱 Sono " + g.nome + ", tocca a me ▶"); if (!vivoK(R, k)) return;
    ST.accendiSolo(S, i); await ST.suSchermo(S, 500); if (!vivoK(R, k)) return;
    apri();
    await aspettaVm(R, function (vm) { return vm.k !== k || fatto(vm); });
    await ST.dorme(650);
    if (R.tempoPan) { R.tempoPan.ferma(); R.tempoPan = null; }
    if (vivoK(R, k)) R.pan.giu();
  }
  async function fSopra(R) {
    var S = R.S, vm = R.vm, el = R.t.el, k = vm.k, off = vm.off || {};
    await ST.suSchermo(S, 400); if (!vivoK(R, k)) return;
    var tab = el("div", { class: "pz-tab" + (vm.players.length > 5 ? " fitto" : "") });
    Object.keys(off).sort(function (a, b) { return off[a] - off[b]; }).forEach(function (id) {
      tab.appendChild(el("div", { class: "pz-och" }, [ fac(el, gDi(vm, id), "triste"), el("span", { class: "nm", text: id === R.cb.myId ? "Tu" : nomeDi(vm, id).slice(0, 8) }), el("span", { class: "v", text: E(off[id]) }) ]));
    });
    schermo(R, [ testa(R), el("div", { class: "pz-banner no", text: "😱 Tutti sopra!" }), miniProd(el, vm.prod), tab,
      el("div", { class: "pz-sotto", text: "Avete superato tutti il prezzo. Si rifà una volta sola: tutti sotto i " + E(vm.limite) + "!" }) ]);
    Z().FX.trombone(); ST.pubblico(S, "ohh");
    vm.players.forEach(function (p, i) { if (off[p.id] != null) ST.faccia(S, i, "triste"); });
    await ST.dorme(3000); ST.tutteNormali(S);
  }
  function rigaOfferta(el, R, r, sforareOk, corto) {
    var p = gDi(R.vm, r.id) || { nome: "?" }, cls = r.giusto && r.pos ? "giusto" : (r.sopra && !sforareOk) ? "sopra" : "sotto";
    // (in due colonne, con tanti giocatori, solo l'emoji: così il nome si legge)
    var bd = corto ? (r.giusto && r.pos ? "🎯" : r.sopra ? (sforareOk ? "⬆️" : "❌") : r.v > R.vm.esito.prezzo ? "👌" : (sforareOk ? "⬇️" : "✅")) :
      r.giusto && r.pos ? "🎯 GIUSTO" : r.sopra ? (sforareOk ? "⬆️ sopra" : "SFORATO") : r.v > R.vm.esito.prezzo ? "👌 di poco" : (sforareOk ? "⬇️ sotto" : "✅ sotto");
    var n = el("div", { class: "pz-riga " + cls }, [ fac(el, p), el("span", { class: "nm", text: r.id === R.cb.myId ? "Tu" : p.nome }), el("span", { class: "v", text: E(r.v) }), el("span", { class: "bd", text: bd }) ]);
    n._r = r; return n;
  }
  async function fRivela(R) {
    var S = R.S, vm = R.vm, el = R.t.el, e = vm.esito, k = vm.k; if (!e) return;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, RV.cam); if (!vivoK(R, k)) return;
    var sforareOk = vm.formato === "solo" && !vm.sforare;
    var conta = Z().contachilometri(el, e.prezzo, { grande: true });
    var giusti = e.giusti || [], vince = e.vince || [], me = R.cb.myId;
    var banner = nascondi(giusti.length ? el("div", { class: "pz-banner oro", text: "🎯 PREZZO GIUSTO!" }) : vince.length ? el("div", { class: "pz-banner", text: "🏆 " + chiVince(vince, me, vm) + "!" }) :
      !e.nessuno ? el("div", { class: "pz-banner no", text: "😱 Sforato da tutti: niente punti" }) : el("div", { class: "pz-sotto" }));
    var righe = el("div", { class: "pz-righe" + (e.righe.length > 4 ? " due" : "") });
    var nodi = e.righe.map(function (r) { return rigaOfferta(el, R, r, sforareOk, e.righe.length > 4); });
    nodi.forEach(function (n) { righe.appendChild(n); });
    if (!nodi.length) righe.appendChild(el("div", { class: "pz-sotto", text: "😶 Nessuno ha fatto un'offerta" }));
    var cur = el("div");
    if (e.cur) cur.appendChild(nascondi(el("div", { class: "pz-curiosita", text: "💡 " + e.cur })));
    schermo(R, [ testa(R), miniProd(el, vm.prod), conta.el, el("div", { class: "pz-anno", text: "prezzo medio in Italia, " + (vm.anno || 2026) }), righe, banner, cur ], "riv");
    riempi(R);
    ST.FX.rullo(1.2); await ST.dorme(RV.rullo); if (!vivoK(R, k)) return;
    await conta.via(RV.cifra); if (!vivoK(R, k)) return;
    ST.pubblico(S, e.wow ? "ovazione" : "piano"); if (e.wow) fumetto(S, "Cosaaa?! 😱");
    await ST.dorme(RV.dopoConta);
    for (var q = 0; q < nodi.length; q++) {
      if (!vivoK(R, k)) return;
      nodi[q].classList.add("su"); Z().FX.toc(520 + q * 50);
      await ST.dorme(RV.riga);
    }
    // chi vince: PREZZO GIUSTO!, oppure il più vicino
    nodi.forEach(function (n) { var r = n._r; if (r.pos === 1) n.classList.add("vince"); if (r.punti) n.appendChild(el("span", { class: "pt", text: "+" + N(r.punti) })); });
    if (giusti.length) {
      scopri(banner);
      Z().FX.din(); ST.pubblico(S, "ovazione"); ST.coriandoli(); ST.lampo(S);
      if (giusti.indexOf(me) >= 0) Z().vibra([30, 40, 70]);
      giusti.forEach(function (id) { var i = idxDi(vm, id); if (i >= 0) ST.faccia(S, i, "evviva"); });
    } else if (vince.length) {
      scopri(banner);
      ST.pubblico(S, "applauso");
      vince.forEach(function (id) { var i = idxDi(vm, id); if (i >= 0) ST.faccia(S, i, "esulta"); });
    } else if (!e.nessuno) {
      scopri(banner);
      Z().FX.trombone(); ST.pubblico(S, "ohh");
    }
    if (me && e.righe.some(function (r) { return r.id === me && r.sopra && !sforareOk; })) Z().vibra([20, 40, 20]);
    if (cur.firstChild) scopri(cur.firstChild);
    await ST.dorme(RV.banner); if (!vivoK(R, k)) return;
    // «😈 Che cattiveria!»: il «+1 €» fischiato dal pubblico
    if (e.cattivo) {
      var ic = idxDi(vm, e.cattivo.chi);
      ST.terzo(S, ic, "😈 " + (e.cattivo.chi === me ? "Hai" : nomeDi(vm, e.cattivo.chi) + " ha") + " fatto +" + E(e.cattivo.piu) + " a " + (e.cattivo.a === me ? "te" : nomeDi(vm, e.cattivo.a)) + "!", "Che cattiveria!");
      Z().FX.buu(); fumetto(S, "Buuuu! 👎");
      if (ic >= 0) ST.faccia(S, ic, "evviva");
      var ia = idxDi(vm, e.cattivo.a); if (ia >= 0) ST.faccia(S, ia, "arrabbiato");
      await ST.dorme(RV.cattivo); ST.viaTerzo(S); if (!vivoK(R, k)) return;
    }
    var d = {}; e.righe.forEach(function (r) { if (r.punti) d[r.id] = r.punti; });
    await leggiiDelta(R, k, d);
  }

  // ---------------- chi vince l'Offerta sceglie il gioco a premi ----------------
  async function fScegli(R) {
    var S = R.S, vm = R.vm, el = R.t.el, sc = vm.scelta, k = vm.k; if (!sc) return;
    var chi = gDi(vm, sc.chi) || { nome: "?" }, io = sc.chi === R.cb.myId, ic = idxDi(vm, sc.chi);
    await ST.suSchermo(S, 600); if (!vivoK(R, k)) return;
    // (25 ott 2026, il proprietario: «abbiamo la scritta sopra con i due giochi, ma per cliccarli devi cliccare sotto»: chi sceglie
    //  li vede una volta sola, grandi e da toccare nel pannello; sul maxischermo li vede chi aspetta, e dopo la scelta tutti)
    var carte = sc.opz.map(function (o) { var c = el("div", { class: "pz-gioco" }, [ el("span", { class: "i", text: o.icona }), el("b", { text: o.nome }), el("small", { text: o.spiega || o.regola }) ]); c._tipo = o.tipo; return c; });
    R.ui.carte = carte;
    schermo(R, [ el("div", { class: "pz-testa", text: "🎁 Gioco a premi" }),
      el("div", { class: "pz-titolo", text: io ? "Hai vinto l'Offerta: scegli tu!" : chi.nome + " sceglie il gioco a premi" }),
      el("div", { class: "pz-giochi pz-solo-giu" }, carte), el("div", { class: "pz-sotto pz-solo-giu", text: "Poi si gioca tutti insieme" }) ]);
    if (ic >= 0) { ST.accendiSolo(S, ic); ST.faccia(S, ic, "pensa"); }
    aggiornaScelta(R);
    if (sc.fatta) return;
    var tocca = R.cb.locale === "telefono" || io;
    if (!tocca) return attesa(R, (chi.bot ? "🤖 " : "") + chi.nome + " sta scegliendo…");
    var fine = R.cb.locale === "telefono" ? Date.now() + TL.scegli : fineVM(R);
    var bottoni = sc.opz.map(function (o) {
      var b = el("button", { class: "pz-sc pz-scgioco", type: "button" }, [ el("span", { class: "i", text: o.icona }), el("b", { text: o.nome }), el("small", { text: o.spiega || o.regola }) ]);
      b.addEventListener("click", function () {
        if (b.disabled) return;
        bottoni.forEach(function (x) { x.disabled = true; }); b.classList.add("sel"); Z().vibra(12);
        R.cb.mossa({ t: "scelta", k: k, g: o.tipo }, sc.chi);
      });
      return b;
    });
    var tb = Z().barraTempo(el, fine, function () { if (R.cb.locale === "telefono") R.cb.mossa({ t: "passa", k: k }, sc.chi); else bottoni.forEach(function (b) { b.disabled = true; }); });
    R.tempoPan = barraDi(R, tb);
    R.pan.metti([ testaPan(R, chi, R.cb.locale === "telefono" ? chi.nome + ", scegli tu!" : "🎁 Scegli tu!", tb), el("div", { class: "pz-scelte pz-giochi-pan" }, bottoni) ]).su();
  }
  function aggiornaScelta(R) {
    var sc = R.vm.scelta; if (!sc || !sc.fatta || !R.ui.carte || R.ui.sceltaVista) return;
    R.ui.sceltaVista = true;
    R.ui.carte.forEach(function (c) { c.classList.toggle("sel", c._tipo === sc.fatta); c.classList.toggle("via", c._tipo !== sc.fatta); });
    Z().FX.toc(880); ST.pubblico(R.S, "applauso");
    R.pan.giu(); if (R.tempoPan) { R.tempoPan.ferma(); R.tempoPan = null; }
  }

  // ---------------- il gioco a premi ----------------
  async function fIntro(R) {
    var S = R.S, vm = R.vm, el = R.t.el, pr = vm.premio, k = vm.k; if (!pr) return;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 600); if (!vivoK(R, k)) return;
    schermo(R, [ el("div", { class: "pz-testa", text: "🎁 Gioco a premi" + (vm.nPremio > 1 ? " · " + vm.iPremio + " di " + vm.nPremio : "") }),
      el("div", { class: "pz-intro" }, [ el("span", { class: "i", text: pr.icona }), el("b", { text: pr.nome }), el("p", { text: pr.spiega || pr.regola }) ]),
      el("div", { class: "pz-sotto", text: (pr.da ? "Scelto da " + (pr.da === R.cb.myId ? "te" : nomeDi(vm, pr.da)) + " · " : "") + "si gioca tutti insieme!" }) ]);
    // quanto manca per leggere la regola: «Si comincia tra 7…» e «⏩ Avanti» (si parte appena lo tocca più di metà; col Bot basta il tuo)
    barraAvanti(R, k, T.intro, "Si comincia tra ");
    Z().FX.tada(); ST.pubblico(S, "applauso");
  }
  // gli aiuti per i giochi a premi su ogni telefono (vedi interfaccia in js/games/prezzo-premi-piu.js)
  function apiTel(R, o) {
    o = o || {};
    var vm = R.vm, pr = vm.premio || {}, t0 = Date.now(), k = vm.k, me = mio(R);
    return {
      el: R.t.el, ST: ST, Z: Z(), S: R.S, sch: o.sch || null, pan: o.pan || null,
      pub: pr.pub || {}, riv: pr.riv || null, punti: pr.punti || {},
      io: o.io != null ? o.io : (me ? me.id : null),
      locale: R.cb.locale || null, fine: o.fine || 0,
      giocatori: vm.players.filter(function (p) { return !p.via; }).map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino || null }; }),
      nome: function (id) { return id === R.cb.myId && !R.cb.locale ? "Tu" : nomeDi(R.vm, id); },
      fac: function (id, faccia) { return fac(R.t.el, gDi(R.vm, id), faccia); },
      invia: function (m) { m = m || {}; if (m.ms == null) m.ms = Date.now() - t0; R.cb.mossa({ t: "premio", k: k, m: m }, o.io); },
      dorme: ST.dorme, vivo: function () { return vivoK(R, k); },
      fmtE: Z().fmtE, fmtN: Z().fmtN, FX: Z().FX, vibra: Z().vibra, scheda: function (p, opz) { return Z().scheda(R.t.el, p, opz); },
      tessere: function (prods, opz) { return Z().tessere(R.t.el, prods, opz); }, miniprod: function (p) { return Z().miniprod(R.t.el, p); },
      contachilometri: function (v, opz) { return Z().contachilometri(R.t.el, v, opz); },
      tastierino: function (opz) { return Z().tastierino(R.t.el, opz); }
    };
  }
  async function fGioca(R) {
    var S = R.S, vm = R.vm, el = R.t.el, pr = vm.premio, k = vm.k; if (!pr) return;
    var g = premioDi(pr.tipo);
    await ST.suSchermo(S, 300); if (!vivoK(R, k)) return;
    var box = schermo(R, [], "pz-premio-sch");
    if (!g) { box.appendChild(el("div", { class: "pz-titolo", text: pr.icona + " " + pr.nome })); return; }
    try { R.ui.premioSch = g.schermo ? g.schermo(apiTel(R, { sch: box })) || null : null; } catch (e) { try { console.error("[prezzo] schermo", e); } catch (x) {} }
    if (R.cb.locale === "telefono") return turniPremio(R, g, k);
    var me = mio(R);
    if (!me) return attesa(R, guardaTesto(R));
    if ((pr.fatti || []).indexOf(me.id) >= 0) return attesa(R, "✅ Fatto! Aspettiamo gli altri…");
    apriPremio(R, g, me, fineVM(R), null);
  }
  function apriPremio(R, g, chi, fine, allaFine) {
    var vm = R.vm, el = R.t.el, pr = vm.premio, cont = el("div", { class: "pz-premio-pan" });
    var tb = Z().barraTempo(el, fine, function () { if (R.premioPan && R.premioPan.tempo) try { R.premioPan.tempo(); } catch (e) {} if (allaFine) allaFine(); });
    R.tempoPan = barraDi(R, tb);
    R.pan.metti([ testaPan(R, chi, (R.cb.locale === "telefono" ? chi.nome + " · " : "") + pr.icona + " " + pr.nome, tb), cont ]).su();
    var P = {};
    // (al gioco la fine vera di chi tiene la partita: È troppo! e il Mirino ci regolano i prezzi che scorrono e la finestrella;
    //  la barra, e con lei il «tempo scaduto» del pannello, finisce ANTICIPO prima)
    try { P = (g.pannello && g.pannello(apiTel(R, { pan: cont, io: chi.id, fine: fine + (R.cb.locale ? 0 : ANTICIPO) }))) || {}; } catch (e) { try { console.error("[prezzo] pannello", e); } catch (x) {} }
    R.premioPan = P; R.premioChi = chi.id;
    var pv = R.premioPriv && R.premioPriv.k === vm.k ? R.premioPriv.l.filter(function (m) { return m.per == null || m.per === chi.id; }) : [];
    pv.forEach(function (m) { if (P.privato) try { P.privato(m.m); } catch (e) {} });
    R.pan.misura();
  }
  async function turniPremio(R, g, k) {
    var lista = R.vm.players.filter(function (p) { return !p.via; });
    for (var q = 0; q < lista.length; q++) {
      var p = lista[q];
      if (!vivoK(R, k)) return;
      if (((R.vm.premio || {}).fatti || []).indexOf(p.id) >= 0) continue;
      await turno(R, k, p, "Passa il telefono a " + p.nome, function () {
        apriPremio(R, g, p, Date.now() + ((R.vm.premio || {}).sec || 30) * 1000, function () { R.cb.mossa({ t: "passa", k: k }, p.id); });
      }, function (vm2) { return ((vm2.premio || {}).fatti || []).indexOf(p.id) >= 0; });
    }
  }
  function aggiornaPremio(R) {
    var pr = R.vm.premio || {}, pub = pr.pub || {};
    if (R.ui.premioSch && R.ui.premioSch.aggiorna) try { R.ui.premioSch.aggiorna(pub); } catch (e) {}
    if (R.premioPan && R.premioPan.aggiorna) try { R.premioPan.aggiorna(pub); } catch (e) {}
    // ho finito (online): dopo un attimo il pannello scende
    var me = mio(R);
    if (!R.cb.locale && me && R.premioPan && (pr.fatti || []).indexOf(me.id) >= 0 && !R.ui.fattoVisto) {
      R.ui.fattoVisto = true; var k = R.vm.k;
      clearTimeout(R.toAttesa); R.toAttesa = setTimeout(function () { if (vivoK(R, k)) { R.premioPan = null; if (R.tempoPan) { R.tempoPan.ferma(); R.tempoPan = null; } attesa(R, "✅ Fatto! Aspettiamo gli altri…"); } }, 1800);
    }
  }
  async function fPremioRiv(R) {
    var S = R.S, vm = R.vm, el = R.t.el, pr = vm.premio, k = vm.k; if (!pr) return;
    var g = premioDi(pr.tipo);
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, RV.cam); if (!vivoK(R, k)) return;
    var box = schermo(R, []);
    await ST.dorme(400);
    if (g && g.rivela) { try { await g.rivela(apiTel(R, { sch: box })); } catch (e) { try { console.error("[prezzo] rivela", e); } catch (x) {} } }
    if (!vivoK(R, k)) return;
    await leggiiDelta(R, k, pr.punti || {});
  }

  // ---------------- la classifica tra un passo e l'altro (⏩ Avanti) ----------------
  async function fPunti(R) {
    var S = R.S, vm = R.vm, el = R.t.el, k = vm.k;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 700); if (!vivoK(R, k)) return;
    var lista = classificaDi(vm), due = lista.length > 5, box = el("div", { class: "pz-clas" + (due ? " due" : "") });
    lista.forEach(function (x, i) {
      var d = (vm.ultimo || {})[x.p.id] || 0;
      var r = el("div", { class: "pz-cl" + (x.pos === 1 ? " primo" : "") }, [ el("span", { class: "pos", text: medaglia(x.pos) }), fac(el, x.p),
        el("span", { class: "nm", text: x.p.nome + (x.p.id === R.cb.myId ? " (tu)" : "") }), el("span", { class: "pt", text: N(x.p.punti) }), el("span", { class: "pi", text: d ? "+" + N(d) : "" }) ]);
      r.style.animationDelay = (i * 0.08) + "s"; box.appendChild(r);
    });
    var dopo = vm.dopo === "vetrina" ? "Poi: 🛍️ la Vetrina finale!" : vm.dopo === "ruota" ? "Poi: 🎡 la Ruota del 100!" : vm.dopo === "carrello" ? "Poi: 🛒 cosa vi portate a casa" : vm.dopo === "oggetto" && vm.iOff + 1 === vm.nOff && vm.formato === "solo" ? "Poi: 🔥 l'ultimo oggetto, vale doppio!" : "";
    schermo(R, [ el("div", { class: "pz-testa", text: vm.rip ? "🔁 Si riprende! · Classifica" : "🏁 Classifica" + (vm.formato === "solo" ? " dopo " + vm.iOff + " oggetti" : "") }), box, dopo ? el("div", { class: "pz-sotto", text: dopo }) : null ]);
    riempi(R);
    barraAvanti(R, k);
  }
  // in basso: «Si va avanti tra 8…» e «⏩ Avanti» (si parte subito se lo tocca più di metà)
  function barraAvanti(R, k, tempo, testoConto) {
    var vm = R.vm, el = R.t.el, sec = Math.max(1, Math.round(((vm.restaMs || tempo || T.punti) - (Date.now() - R.vmTs)) / 1000)), chiave = "pz|" + vm.sessione + "|" + k;
    var conto = el("p", { class: "pz-attesa" }), me = mio(R), b = null;
    if (R.cb.locale || me) {
      b = el("button", { class: "btn btn-primario pz-avanti", type: "button" }, [ el("span", { class: "tx", text: R.cb.locale ? "Avanti ▶" : "⏩ Avanti" }), R.cb.locale ? null : el("span", { class: "quanti" }) ]);
      b.addEventListener("click", function () { if (b.disabled) return; R.avantiMio = chiave; b.disabled = true; aggiornaAvanti(R); Z().vibra(10); R.cb.onAvanti(); });
    }
    R.bAvanti = b; R.kAvanti = chiave;
    ST.barra(R.S, [ conto, b, faccine(R) ]);
    R.t.contoAvanti(conto, sec, null, chiave, testoConto);
    aggiornaAvanti(R);
  }
  function aggiornaAvanti(R) {
    var b = R.bAvanti, vm = R.vm; if (!b || !b.isConnected || !(vm.fase === "punti" || (vm.fase === "premio" && vm.sotto === "intro")) || R.cb.locale) return;
    var l = vm.avanti || [], mio1 = l.indexOf(R.cb.myId) >= 0 || R.avantiMio === R.kAvanti, n = l.length + (mio1 && l.indexOf(R.cb.myId) < 0 ? 1 : 0);
    var q = b.querySelector(".quanti"), tx = n + " su " + (vm.servono || 1);
    if (q && q.textContent !== tx) q.textContent = tx;
    var s = b.querySelector(".tx"), t0 = mio1 ? "✅ Avanti" : "⏩ Avanti"; if (s.textContent !== t0) s.textContent = t0;
    b.disabled = mio1;
  }

  // ---------------- LA RUOTA DEL 100 ----------------
  function altRuota() { var h = (window.innerHeight || 640); return Math.max(48, Math.min(66, Math.round(h * 0.085))); }
  // Il maxischermo della Ruota (23 ott 2026, il proprietario: «tutti possano vedere le ruote di tutti mentre girano in tempo
  // reale», «4 per ogni schermata come le rose della mini asta»): ogni giocatore ha la sua ruota piccola che gira dal vivo
  // quando lui spinge; il suo numero si vede (anche sul leggio) solo quando la ruota si è fermata. In 5 o più: pagine da 4,
  // con le frecce, e la pagina va da sola su chi sta girando. Chi si è fermato guarda girare quelle degli altri.
  var RUOTE_PAG = 4;
  function altMini() { var h = (window.innerHeight || 640); return Math.max(20, Math.min(30, Math.round(h * 0.036))); }
  function schRuota(R) {
    var vm = R.vm, el = R.t.el, key = "ruota|" + vm.nRuota;
    if (R.schKey === key && R.schRu && R.schRu.box.isConnected) return R.schRu;
    var grid = el("div", { class: "pz-rgriglia" }), nota = el("div", { class: "pz-sotto" });
    var U = { grid: grid, nota: nota, celle: {}, ordine: [], pagina: 0 };
    var indietro = el("button", { type: "button", text: "◀" }), avanti = el("button", { type: "button", text: "▶" }), quali = el("span");
    var pag = el("div", { class: "pz-rpag" }, [ indietro, quali, avanti ]); pag.hidden = true;
    indietro.addEventListener("click", function () { vaiPagina(U, U.pagina - 1, true); });
    avanti.addEventListener("click", function () { vaiPagina(U, U.pagina + 1, true); });
    U.pag = pag; U.quali = quali;
    U.box = schermo(R, [ el("div", { class: "pz-testa", text: "🎡 La Ruota del 100" + (vm.ruoteTot > 1 ? " · " + vm.nRuota + " di " + vm.ruoteTot : "") }),
      el("div", { class: "pz-titolo", text: "Più vicino a 100, senza superarlo!" }), grid, pag, nota ]);
    R.schKey = key; R.schRu = U;
    return U;
  }
  // le pagine da 4 ruote (manuale: la pagina resta lì per un po' anche se gira qualcun altro)
  function vaiPagina(U, n, aMano) {
    var tot = Math.max(1, Math.ceil(U.ordine.length / RUOTE_PAG));
    U.pagina = (n + tot) % tot;
    if (aMano) U.aMano = Date.now();
    U.ordine.forEach(function (id, i) { var C = U.celle[id]; if (C) C.c.hidden = Math.floor(i / RUOTE_PAG) !== U.pagina; });
    U.pag.hidden = tot < 2;
    var da = U.pagina * RUOTE_PAG + 1, a = Math.min(U.ordine.length, da + RUOTE_PAG - 1);
    U.quali.textContent = "Ruote " + da + "-" + a + " di " + U.ordine.length;
  }
  function cartaRuota(R, p) {
    var el = R.t.el, ru = Z().ruota(el, { alt: altMini(), mini: true });
    var val = el("span", { class: "val", text: "—" }), st = el("span", { class: "st" });
    var c = el("div", { class: "pz-rcard" }, [ ru.el, el("div", { class: "info" }, [ el("div", { class: "chi" }, [ fac(el, p), el("span", { class: "nm", text: p.id === R.cb.myId ? "Tu" : p.nome }) ]), val, st ]) ]);
    return { c: c, ru: ru, val: val, st: st, visto: {}, gira: null };
  }
  // la ruota grande di questo telefono sta girando per quel numero (lo si scopre quando si ferma lei)
  function ruotaGrande(R, id, campo) { var RU = R.ruotaUI; return RU && RU.chi === id && RU.campo === campo ? RU : null; }
  // il numero che si vede di id: solo quello delle ruote già ferme
  function vistaRuota(R, id) {
    var x = R.vm.ruota && R.vm.ruota.g[id], C = R.schRu && R.schRu.celle[id];
    if (!x) return x;
    var y = {}; for (var k in x) y[k] = x[k];
    ["v1", "v2", "b"].forEach(function (f) { if (y[f] != null && (C ? C.visto[f] == null : (ruotaGrande(R, id, f) && !R.ruotaUI.fermo))) y[f] = null; });
    return y;
  }
  function statoCarta(C, x, s, gira) {
    var v = C.visto, tot = (v.v1 || 0) + (v.v2 || 0);
    if (gira) return "🎡 Gira…";
    if (v.b != null) return "🎁 Bonus " + v.b + (puntiBonus(v.b) ? ": +" + N(puntiBonus(v.b)) : "");
    if (v.v1 == null) return s === "giro1" || s === "turni" ? "👆 Deve girare" : "";
    if (tot > 100) return "💥 Sballato!";
    if (tot === 100) return x.cento && s === "bonus" ? "🎁 Giro bonus…" : "💯 CENTO!";
    if (s === "decidi") return x.si != null ? "✅ Ha deciso" : "🤔 Ci pensa…";
    if (v.v2 != null) return "Totale " + tot;
    if (x.si === false) return "✋ Si ferma";
    if (x.si === true) return "🎡 Gira ancora…";
    return s === "giro1" ? "Aspetta gli altri" : "";
  }
  function aggiornaRuota(R) {
    var vm = R.vm, U = R.schRu; if (!vm.ruota) return;
    if (U && U.grid.isConnected) {
      var lista = vm.players.filter(function (p) { return !p.via && vm.ruota.g[p.id]; });
      lista.forEach(function (p) {
        var C = U.celle[p.id], x = vm.ruota.g[p.id];
        if (!C) {
          C = U.celle[p.id] = cartaRuota(R, p); U.ordine.push(p.id); U.grid.appendChild(C.c);
          // i numeri che c'erano già (chi arriva a metà o ricarica): si vedono subito, senza girare
          ["v1", "v2", "b"].forEach(function (f) { if (x[f] != null && !ruotaGrande(R, p.id, f)) C.visto[f] = x[f]; });
          var ult = C.visto.b != null ? C.visto.b : C.visto.v2 != null ? C.visto.v2 : C.visto.v1;
          if (ult != null) C.ru.mostra(ult);
          vaiPagina(U, U.pagina);
        }
        // un numero nuovo: la ruota piccola gira e si ferma lì; solo allora si vede (la mia la scopre la ruota grande)
        if (!C.gira) {
          var f = ["v1", "v2", "b"].filter(function (q) { return x[q] != null && C.visto[q] == null; })[0], RG = f && ruotaGrande(R, p.id, f);
          if (f && RG && RG.fermo) { C.visto[f] = x[f]; C.ru.mostra(x[f]); }
          else if (f && !RG) {
            C.gira = f; C.c.classList.add("gira");
            var i = U.ordine.indexOf(p.id), pg = Math.floor(i / RUOTE_PAG);
            var occupata = U.ordine.some(function (id, j) { return Math.floor(j / RUOTE_PAG) === U.pagina && U.celle[id] && U.celle[id].gira && id !== p.id; });
            if (pg !== U.pagina && !occupata && !(U.aMano && Date.now() - U.aMano < 6000)) vaiPagina(U, pg);
            (function (C, f, val) {
              C.ru.arriva(val).then(function () {
                C.gira = null; C.visto[f] = val; C.c.classList.remove("gira");
                if (!R.S.vivo()) return;   // (uscito intanto: niente suoni sulla home)
                var v = C.visto, tot = f === "b" ? 0 : (v.v1 || 0) + (v.v2 || 0);
                if ((f === "b" && val === 100) || (f !== "b" && tot === 100)) { Z().FX.cento(); fumetto(R.S, "CENTO! CENTO! CENTO!"); ST.pubblico(R.S, "ovazione"); }
                else if (f !== "b" && tot > 100) ST.pubblico(R.S, "ohh");
                else Z().FX.toc(640);
                if (R.vm.fase === "ruota") { aggiornaRuota(R); leggii(R); }
              });
            })(C, f, x[f]);
          }
        }
        // (la mia la sta girando la ruota grande del pannello: anche la mia carta dice «Gira…»)
        var RU0 = R.ruotaUI, grande = !!(RU0 && RU0.chi === p.id && RU0.mandato && !RU0.fermo), gira = !!C.gira || grande;
        var v = C.visto, tot = (v.v1 || 0) + (v.v2 || 0);
        var tx = v.v1 == null ? (gira ? "…" : "—") : v.v2 != null ? v.v1 + " + " + v.v2 : String(v.v1);
        if (C.val.textContent !== tx) C.val.textContent = tx;
        var st = statoCarta(C, x, vm.sotto, gira); if (C.st.textContent !== st) C.st.textContent = st;
        C.c.classList.toggle("gira", gira);
        // (prima del primo giro la ruota piccola mostra «?»: ferma su una casella sembrerebbe un numero già uscito)
        C.c.classList.toggle("nuova", v.v1 == null && !C.gira);
        C.c.classList.toggle("fuori", tot > 100); C.c.classList.toggle("cento", tot === 100);
      });
      var s = vm.sotto, tx2 = s === "giro1" ? "👇 Tutti girano insieme: guardate le ruote!" : s === "decidi" ? "🤔 Giro ancora o mi fermo? Si decide in segreto" : s === "giro2" ? "🎡 Chi ha detto «ancora» gira di nuovo" : s === "bonus" ? "🎁 Giro bonus per chi ha fatto 100!" : s === "turni" ? "A turno, come in TV" : "";
      if (U.nota.textContent !== tx2) U.nota.textContent = tx2;
    }
    // la mia ruota: il numero dell'host è arrivato, frena e si ferma lì
    var RU = R.ruotaUI; if (!RU || RU.arrivato) return;
    var mx = vm.ruota.g[RU.chi]; if (!mx || mx[RU.campo] == null) return;
    RU.arrivato = true;
    var val = mx[RU.campo];
    if (RU.tb) RU.tb.ferma();
    RU.atterra = RU.ru.arriva(val).then(function () {
      // la ruota si è fermata: solo adesso il numero va sul maxischermo e sul leggio
      RU.fermo = true; aggiornaRuota(R); leggii(R);
      var tot = RU.campo === "b" ? val : (mx.v1 || 0) + (RU.campo === "v2" ? (mx.v2 || 0) : 0);
      RU.nota.textContent = RU.campo === "b" ? "🎁 " + val + (puntiBonus(val) ? "! +" + N(puntiBonus(val)) : "") : tot > 100 ? "💥 " + tot + ": sballato!" : tot === 100 ? "💯 CENTO!" : "🎡 " + val + (RU.campo === "v2" ? " · totale " + tot : "");
      if (tot === 100 || (RU.campo === "b" && val === 100)) { Z().FX.cento(); fumetto(R.S, "CENTO! CENTO! CENTO!"); Z().vibra([40, 50, 90]); ST.pubblico(R.S, "ovazione"); }
      else if (tot > 100 && RU.campo !== "b") { ST.pubblico(R.S, "ohh"); Z().vibra([20, 40, 20]); }
      else Z().FX.toc(700);
    });
  }
  function apriRuota(R, chi, campo, fine, allaFine) {
    var el = R.t.el, k = R.vm.k;
    var nota = el("p", { class: "pz-nota forte", text: campo === "b" ? "🎁 Giro bonus! Trascina la ruota su o giù ↕️" : "↕️ Trascina la ruota su o giù per girarla!" });
    var RU = { campo: campo, chi: chi.id, nota: nota, arrivato: false, mandato: false, fermo: false };
    RU.ru = Z().ruota(el, { alt: altRuota(),
      onSpinta: function (f) { if (RU.mandato || !vivoK(R, k)) return false; RU.mandato = true; RU.ru.attiva(false); R.cb.mossa({ t: "spinta", k: k, f: f }, chi.id); nota.textContent = "🎡 Gira…"; },
      debole: function () { nota.textContent = "💪 Più forte! Trascina più veloce"; fumetto(R.S, "Più forte! 💪"); } });
    RU.ru.attiva(true);
    var mx = (R.vm.ruota.g || {})[chi.id]; if (mx && mx.v1 != null && campo !== "v1") RU.ru.mostra(campo === "b" ? 100 : mx.v1);
    RU.tb = Z().barraTempo(el, fine, function () { RU.ru.attiva(false); if (allaFine) allaFine(); });
    R.tempoPan = barraDi(R, RU.tb);
    var tit = campo === "v1" ? "🎡 Il tuo giro" : campo === "v2" ? "🎡 Secondo giro: hai " + (mx ? mx.v1 : "") : "🎁 Giro bonus";
    R.pan.metti([ testaPan(R, chi, (R.cb.locale === "telefono" ? chi.nome + " · " : "") + tit, RU.tb), RU.ru.el, nota ]).su();
    R.ruotaUI = RU;
    aggiornaRuota(R);
    return RU;
  }
  function apriDecidi(R, chi, x, fine, allaFine) {
    var el = R.t.el, k = R.vm.k, fatto = false;
    function vota(si) {
      if (fatto) return; fatto = true; bott.forEach(function (b) { b.disabled = true; }); (si ? b1 : b2).classList.add("sel"); Z().vibra(12);
      R.mie["r" + k] = si; R.cb.mossa({ t: "ancora", k: k, si: si }, chi.id);
      if (!R.cb.locale) { clearTimeout(R.toAttesa); R.toAttesa = setTimeout(function () { if (vivoK(R, k)) attesa(R, si ? "🎡 Giri ancora: aspettiamo gli altri…" : "✋ Ti fermi a " + x.v1 + ": aspettiamo gli altri…"); }, 900); }
    }
    var b1 = el("button", { class: "pz-sc", type: "button" }, [ el("span", { class: "i", text: "🎡" }), el("b", { text: "Giro ancora" }), el("small", { text: "Si somma. Sopra 100 sei fuori!" }) ]);
    var b2 = el("button", { class: "pz-sc", type: "button" }, [ el("span", { class: "i", text: "✋" }), el("b", { text: "Mi fermo" }), el("small", { text: "Tieni " + x.v1 }) ]);
    var bott = [b1, b2];
    b1.addEventListener("click", function () { vota(true); }); b2.addEventListener("click", function () { vota(false); });
    var tb = Z().barraTempo(el, fine, function () { bott.forEach(function (b) { b.disabled = true; }); if (allaFine) allaFine(); });
    R.tempoPan = barraDi(R, tb);
    R.pan.metti([ testaPan(R, chi, (R.cb.locale === "telefono" ? chi.nome + ": " : "") + "Hai fatto " + x.v1 + ". E adesso?", tb), el("div", { class: "pz-scelte" }, bott) ]).su();
  }
  async function fRuota(R) {
    var S = R.S, vm = R.vm, s = vm.sotto, k = vm.k; if (!vm.ruota) return;
    if (s === "riv" || s === "rivb") return ruotaRiv(R);
    ST.accendiSolo(S, -1);
    if (s === "giro1" || s === "turni") { await ST.suSchermo(S, 600); if (!vivoK(R, k)) return; }
    schRuota(R); aggiornaRuota(R);
    if (s === "giro1" || s === "turni") { ST.pubblico(S, "applauso"); }
    if (R.cb.locale === "telefono") return turniRuota(R, k);
    var me = mio(R); if (!me || !vm.ruota.g[me.id]) return attesa(R, guardaTesto(R));
    var x = vm.ruota.g[me.id], fine = fineVM(R);
    if (s === "giro1") { if (x.v1 == null) apriRuota(R, me, "v1", fine); else attesa(R, "🎡 Hai fatto " + x.v1 + " · aspettiamo gli altri…"); }
    else if (s === "decidi") {
      if (x.v1 >= 100) attesa(R, "💯 Hai fatto 100! Ti fermi lì");
      else if (x.si == null && R.mie["r" + k] == null) apriDecidi(R, me, x, fine);
      else attesa(R, "✅ Hai deciso · aspettiamo gli altri…");
    }
    else if (s === "giro2") { if (x.si === true && x.v2 == null) apriRuota(R, me, "v2", fine); else attesa(R, x.si === true ? "🎡 Hai fatto " + x.v1 + " + " + x.v2 : "✋ Ti sei fermato a " + x.v1); }
    else if (s === "bonus") { if (x.cento && x.b == null) apriRuota(R, me, "b", fine); else attesa(R, "🎁 Giro bonus per chi ha fatto 100!"); }
  }
  // sullo stesso telefono: a turno come in TV (chi gira dopo sa quanto deve fare)
  async function turniRuota(R, k) {
    var lista = R.vm.players.filter(function (p) { return !p.via && R.vm.ruota.g[p.id]; }), bonus = R.vm.sotto === "bonus";
    function x(id) { return (R.vm.ruota.g || {})[id] || {}; }
    for (var q = 0; q < lista.length; q++) {
      var p = lista[q];
      if (!vivoK(R, k)) return;
      if (bonus ? (!x(p.id).cento || x(p.id).b != null) : (x(p.id).v1 != null && (x(p.id).si === false || x(p.id).v2 != null))) continue;
      await turno(R, k, p, bonus ? "🎁 Giro bonus!" : "Tocca a te alla ruota", function () { giroDiTurno(R, k, p, bonus); },
        function () { var y = x(p.id); return bonus ? y.b != null && R.giroFinito === p.id + "|" + k : y.v1 != null && (y.si === false || y.v2 != null) && R.giroFinito === p.id + "|" + k; });
    }
    if (vivoK(R, k)) R.cb.mossa({ t: "finiti", k: k }, null);
  }
  async function giroDiTurno(R, k, p, bonus) {
    function x() { return (R.vm.ruota.g || {})[p.id] || {}; }
    async function gira(campo) {
      var RU = apriRuota(R, p, campo, Date.now() + TL.giro, function () { R.cb.mossa({ t: "passa", k: k }, p.id); });
      await aspettaVm(R, function (vm) { return vm.k !== k || x()[campo] != null; });
      await ST.dorme(60);
      if (RU.atterra) await RU.atterra;
      await ST.dorme(900);
    }
    if (bonus) { await gira("b"); }
    else {
      if (x().v1 == null) await gira("v1");
      if (!vivoK(R, k)) return;
      if (x().v1 != null && x().v1 < 100 && x().si == null) {
        apriDecidi(R, p, x(), Date.now() + TL.decidi, function () { R.cb.mossa({ t: "passa", k: k }, p.id); });
        await aspettaVm(R, function (vm) { return vm.k !== k || x().si != null; });
        await ST.dorme(500);
      }
      if (vivoK(R, k) && x().si === true && x().v2 == null) await gira("v2");
    }
    R.giroFinito = p.id + "|" + k;
    // (la foto non cambia più: sblocco l'attesa del turno da qui)
    R.attese = R.attese.filter(function (a) { try { if (a.cond(R.vm)) { a.ok(R.vm); return false; } } catch (e) {} return true; });
  }
  async function ruotaRiv(R) {
    var S = R.S, vm = R.vm, el = R.t.el, k = vm.k, bonus = vm.sotto === "rivb";
    var e = bonus ? vm.ruota.esitoB : vm.ruota.esito; if (!e) return;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, RV.cam); if (!vivoK(R, k)) return;
    var righe = el("div", { class: "pz-righe" + (e.righe.length > 4 ? " due" : "") }), banner = el("div", { class: "pz-sotto" }), cento = el("div");
    schermo(R, [ el("div", { class: "pz-testa", text: bonus ? "🎁 Il giro bonus" : "🎡 La Ruota del 100" }), cento, righe, banner ]);
    await ST.dorme(400);
    var me = R.cb.myId, delta = {};
    for (var q = 0; q < e.righe.length; q++) {
      if (!vivoK(R, k)) return;
      var r = e.righe[q], p = gDi(vm, r.id) || { nome: "?" };
      var corto = e.righe.length > 4;   // in due colonne: l'essenziale
      var tx = bonus ? (r.b ? String(r.b) : "—") : (r.v2 && !corto ? r.v1 + " + " + r.v2 + " = " + r.tot : String(r.tot));
      var bdTx = bonus ? (r.punti ? "+" + N(r.punti) : "niente") : r.out ? (corto ? "💥" : "SBALLATO") : r.cento ? (corto ? "💯" : "💯 CENTO") : r.pos === 1 ? (corto ? "🏆" : "🏆 1°") : r.pos ? r.pos + "°" : "";
      var n = el("div", { class: "pz-riga su " + (r.out ? "sopra" : r.cento || (bonus && r.punti) ? "giusto" : r.pos === 1 ? "vince" : "sotto") }, [ fac(el, p, r.out ? "triste" : null), el("span", { class: "nm", text: r.id === me ? "Tu" : p.nome }), el("span", { class: "v", text: tx }), el("span", { class: "bd", text: bdTx }) ]);
      if (r.punti) n.appendChild(el("span", { class: "pt", text: "+" + N(r.punti) }));
      righe.appendChild(n); Z().FX.toc(500 + q * 60);
      if (r.punti) delta[r.id] = r.punti;
      await ST.dorme(bonus ? 1500 : RRU.riga);
    }
    var cents = bonus ? e.righe.filter(function (r) { return r.b === 100; }) : (e.cento || []);
    if (!bonus && cents.length || bonus && cents.length) {
      cento.className = "pz-big100"; cento.textContent = "CENTO! CENTO! CENTO!";
      Z().FX.cento(); ST.pubblico(S, "ovazione"); ST.coriandoli(); ST.lampo(S);
      if ((bonus ? cents.map(function (r) { return r.id; }) : cents).indexOf(me) >= 0) Z().vibra([40, 50, 90]);
      if (!bonus) await ST.dorme(RRU.cento);
    }
    if (!vivoK(R, k)) return;
    if (!bonus) {
      var vince = e.vince || [];
      banner.className = vince.length ? "pz-banner" : "pz-banner no";
      banner.textContent = vince.length ? "🏆 " + chiVince(vince, me, vm) + " la Ruota!" : "😱 Sballati tutti!";
      if (vince.length) ST.pubblico(S, "applauso"); else ST.pubblico(S, "ohh");
      var li = [].concat(vm.ruota.indizio || []), ioI = li.indexOf(me) >= 0, altriI = li.filter(function (id) { return id !== me; }).map(function (id) { return nomeDi(vm, id); });
      if (li.length) cento.appendChild(el("div", { class: "pz-sotto", text: "🔎 " + (ioI ? (altriI.length ? "Tu e " + nomi(altriI) + " avrete" : "Avrai") : nomi(altriI) + (altriI.length > 1 ? " avranno" : " avrà")) + " un indizio sulla Vetrina!" }));
      if (e.cento && e.cento.length) cento.appendChild(el("div", { class: "pz-sotto", text: "🎁 Chi ha fatto 100 fa il giro bonus!" }));
    } else banner.className = "pz-sotto";
    await ST.dorme(RRU.banner); if (!vivoK(R, k)) return;
    await leggiiDelta(R, k, delta);
  }

  // ---------------- LA VETRINA FINALE ----------------
  // i pezzi della vetrina in riquadri grandi, sempre con la descrizione (24 ott 2026, il proprietario: «la descrizione
  // secondo me è obbligatoria», es. l'ombrellone a Rimini è per una settimana intera). prezzi: i cartellini, nascosti
  // finché non si scoprono (riquadro._tag); pacco: [titolo, sotto] = un riquadro in più per la vetrina misteriosa
  function vetrinaTes(el, X, prezzi, pacco, fermo) {
    var lista = X.pezzi.concat(pacco ? [ { e: "🎁", nome: pacco[0], desc: pacco[1], cls: "mist" } ] : []);
    return Z().tessere(el, lista, { cls: "pz-vet", fermo: !!fermo, extra: prezzi ? function (p, i, t) {
      if (i >= X.pezzi.length) return null;
      t._tag = Z().cartellino(el, prezzi[i] != null ? E(prezzi[i]) : "? €"); return t._tag;
    } : null });
  }
  async function fVetMostra(R) {
    var S = R.S, vm = R.vm, el = R.t.el, V = vm.vet, k = vm.k; if (!V) return;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 700); if (!vivoK(R, k)) return;
    // (tutti i pezzi, e il pacco della misteriosa, già al loro posto ma nascosti: così i riquadri sanno quanto spazio c'è)
    var lista = vetrinaTes(el, V, null, V.mist ? ["…e c'è una vetrina misteriosa!", "Nessuno sa cosa c'è dentro"] : null), nodi = lista.tessere.map(nascondi);
    var pacco = V.mist ? nodi.pop() : null;
    schermo(R, [ el("div", { class: "pz-testa", text: "🛍️ La Vetrina finale" }), el("div", { class: "pz-vtit", text: V.e + " " + V.titolo }), lista ], "con-terzo");
    lista.adatta();
    ST.terzo(S, null, "E per voi…", V.titolo, "🛍️"); Z().FX.tada();
    await ST.dorme(900);
    for (var i = 0; i < V.pezzi.length; i++) {
      if (!vivoK(R, k)) return;
      scopri(nodi[i]);
      ST.terzo(S, null, (i === 0 ? "E per voi… " : i === V.pezzi.length - 1 ? "…e per finire " : "…ma non è finita! ") + (V.pezzi[i].e || ""), V.pezzi[i].nome, "🛍️");
      ST.pubblico(S, i === V.pezzi.length - 1 ? "applauso" : "piano"); fumetto(S, "Ooooh! 😮");
      await ST.dorme(RVET.pezzo);
    }
    // (con la misteriosa: si annuncia che ce n'è un'altra, che nessuno ha visto)
    if (pacco && vivoK(R, k)) {
      scopri(pacco);
      ST.terzo(S, null, "…ma attenzione: c'è anche", "una vetrina misteriosa!", "🎁"); Z().FX.tada(); fumetto(S, "Uuuuh! 🎁");
      await ST.dorme(RVET.mist);
    }
    ST.viaTerzo(S);
  }
  // la scelta in segreto (Vetrina misteriosa): sul maxischermo la vetrina vista e il pacco misterioso, nel pannello i due tasti
  async function fVetScegli(R) {
    var S = R.S, vm = R.vm, el = R.t.el, V = vm.vet, k = vm.k; if (!V) return;
    await ST.suSchermo(S, 300); if (!vivoK(R, k)) return;
    var lista = vetrinaTes(el, V, null, ["La vetrina misteriosa", "La scopre solo chi la prende"], true), fatti = el("div", { class: "pz-tab" + (vm.players.length > 5 ? " fitto" : ""), "data-sacr": "2" });
    schermo(R, [ el("div", { class: "pz-vtit", text: V.e + " " + V.titolo }), lista, el("div", { class: "pz-sotto", text: "Tieni questa o prendi la misteriosa? Si sceglie in segreto", "data-sacr": "1" }), fatti ]);
    R.ui.vetFatti = fatti; aggiornaVet(R);
    lista.adatta();
    var me = mio(R); if (!me) return attesa(R, guardaTesto(R));
    var gia = R.mie["s" + k];
    if (gia != null || (V.sFatti || []).indexOf(me.id) >= 0) return attesa(R, testoScelta(gia));
    apriSceltaVet(R, me, fineVM(R) - (R.cb.locale ? 500 : 0), function (m) {   // (col Bot i tasti si spengono mezzo secondo prima, come sempre)
      R.mie["s" + k] = m; R.cb.mossa({ t: "vscelta", k: k, b: m }, me.id);
      clearTimeout(R.toAttesa); R.toAttesa = setTimeout(function () { if (vivoK(R, k)) attesa(R, testoScelta(m)); }, 700);
    });
  }
  function testoScelta(m) { return m == null ? "✅ Hai scelto · aspettiamo gli altri…" : m ? "🎁 Hai preso la misteriosa! Aspettiamo gli altri…" : "🛍️ Tieni questa vetrina · aspettiamo gli altri…"; }
  // «Tengo questa» o «La misteriosa» (fatto(true) = la misteriosa). Allo scadere: online decide chi tiene la partita (tiene la
  // prima), sullo stesso telefono si tiene la prima e si va a offrire
  function apriSceltaVet(R, chi, fine, fatto) {
    var el = R.t.el, V = R.vm.vet, finito = false;
    function vota(m) {
      if (finito) return; finito = true; bott.forEach(function (b) { b.disabled = true; }); (m ? b2 : b1).classList.add("sel"); Z().vibra(12);
      if (R.tempoPan === tb) { tb.ferma(); R.tempoPan = null; }
      fatto(m);
    }
    var b1 = el("button", { class: "pz-sc", type: "button" }, [ el("span", { class: "i", text: V.e || "🛍️" }), el("b", { text: "Tengo questa" }), el("small", { text: "«" + V.titolo + "»" }) ]);
    var b2 = el("button", { class: "pz-sc mist", type: "button" }, [ el("span", { class: "i", text: "🎁" }), el("b", { text: "La misteriosa" }), el("small", { text: "La scopri solo dopo" }) ]);
    var bott = [b1, b2];
    b1.addEventListener("click", function () { vota(false); }); b2.addEventListener("click", function () { vota(true); });
    var tb = Z().barraTempo(el, fine, function () { if (R.cb.locale === "telefono") vota(false); else bott.forEach(function (b) { b.disabled = true; }); });
    R.tempoPan = barraDi(R, tb);
    R.pan.metti([ testaPan(R, chi, (R.cb.locale === "telefono" ? chi.nome + ": " : "") + "🎁 Tieni o cambi?", tb), el("div", { class: "pz-scelte" }, bott) ]).su();
  }
  // la vetrina sul maxischermo: "a" quella vista da tutti, "b" la misteriosa (nuova: i pezzi della misteriosa saltano fuori uno dopo l'altro)
  function mostraVetrina(R, box, w, nuova) {
    var el = R.t.el, V = R.vm.vet, X = w === "b" && V.b ? V.b : V, entra = X !== V && nuova, lista = vetrinaTes(el, X, null, null, !entra);
    if (!box || !box.isConnected) return;
    ST.vuota(box);
    box.appendChild(el("div", { class: "pz-vtit" + (X !== V ? " mist" : ""), text: (X !== V ? "🎁 " : "") + X.e + " " + X.titolo }));
    box.appendChild(lista);
    if (entra) lista.tessere.forEach(function (t, i) { t.style.animationDelay = (0.3 + i * 0.3) + "s"; });
    lista.adatta();
    if (X !== V && nuova) { Z().FX.tada(); fumetto(R.S, "Ecco la misteriosa! 🎁"); }
  }
  async function fVetOffri(R) {
    var S = R.S, vm = R.vm, el = R.t.el, V = vm.vet, k = vm.k; if (!V) return;
    await ST.suSchermo(S, 300); if (!vivoK(R, k)) return;
    var box = el("div", { class: "pz-vbox" }), fatti = el("div", { class: "pz-tab" + (vm.players.length > 5 ? " fitto" : ""), "data-sacr": "2" });
    schermo(R, [ box, el("div", { class: "pz-sotto", text: V.b ? "Quanto vale TUTTA la tua vetrina? Offerte segrete" : "Quanto vale TUTTA la vetrina? Offerte segrete", "data-sacr": "1" }), fatti ]);
    R.ui.vetFatti = fatti; R.ui.vetBox = box; aggiornaVet(R);
    if (R.cb.locale === "telefono") { mostraVetrina(R, box, "a", false); return turniVetrina(R, k); }
    var me = mio(R);
    mostraVetrina(R, box, me && V.b && (V.sc || {})[me.id] === "b" ? "b" : "a", true);
    // (aveva toccato «La misteriosa» proprio allo scadere: per chi tiene la partita era già tardi)
    if (me && V.b && R.mie["s" + (k - 1)] === true && (V.sc || {})[me.id] !== "b") fumetto(S, "⏰ Troppo tardi: tieni la prima vetrina");
    if (!me) return attesa(R, guardaTesto(R));
    var gia = R.mie["v" + k];
    if (gia != null || (V.fatti || []).indexOf(me.id) >= 0) return attesa(R, gia != null ? "✅ Hai offerto " + E(gia) + " per la vetrina" : "✅ Hai fatto la tua offerta");
    apriVetrina(R, me, fineVM(R), null);
  }
  function rigaIndizio(R, chiId) {
    var I = (R.indizi || {})[chiId]; if (!I || I.kk == null || I.kk !== R.vm.k) return null;
    return R.t.el("div", { class: "pz-indizio" }, [ R.t.el("span", { text: "🔎 Il tuo indizio (hai vinto la Ruota): " + (I.e || "") + " " + I.nome + " costa " + E(I.prezzo) }), I.desc ? R.t.el("small", { text: I.desc }) : null ]);
  }
  function apriVetrina(R, chi, fine, allaFine) {
    var k = R.vm.k;
    var tast = pannelloOfferta(R, chi, fine, function (v) { R.mie["v" + k] = v; R.cb.mossa({ t: "vetrina", k: k, v: v }, chi.id); },
      { vetrina: true, sopra: [rigaIndizio(R, chi.id)].filter(Boolean), allaFine: allaFine,
        titolo: (R.cb.locale === "telefono" ? chi.nome + ": " : "") + "🛍️ Il totale" });
    R.vetChi = chi.id;
    return tast;
  }
  async function turniVetrina(R, k) {
    var lista = R.vm.players.filter(function (p) { return !p.via; });
    for (var q = 0; q < lista.length; q++) {
      var p = lista[q];
      if (!vivoK(R, k)) return;
      if ((R.vm.vet.fatti || []).indexOf(p.id) >= 0) continue;
      await turno(R, k, p, "Passa il telefono a " + p.nome, function () {
        // (con la misteriosa: prima si sceglie, poi si offre sulla vetrina scelta)
        var V = R.vm.vet, gia = (V.sc || {})[p.id];
        function offri(w) {
          mostraVetrina(R, R.ui.vetBox, w, w === "b");
          apriVetrina(R, p, Date.now() + TL.vetOffri, function () { R.cb.mossa({ t: "passa", k: k }, p.id); });
        }
        if (!V.b || gia) return offri(gia || "a");
        mostraVetrina(R, R.ui.vetBox, "a", false);
        apriSceltaVet(R, p, Date.now() + TL.vetScegli, function (m) { R.cb.mossa({ t: "vscelta", k: k, b: m }, p.id); setTimeout(function () { if (vivoK(R, k)) offri(m ? "b" : "a"); }, 450); });
      }, function (vm2) { return ((vm2.vet || {}).fatti || []).indexOf(p.id) >= 0; });
      if (vivoK(R, k)) mostraVetrina(R, R.ui.vetBox, "a", false);   // (il prossimo non vede la vetrina di chi ha appena offerto)
    }
  }
  function aggiornaVet(R) {
    var vm = R.vm, el = R.t.el, box = R.ui.vetFatti; if (!box || !box.isConnected || !vm.vet) return;
    var fatti = (vm.sotto === "scegli" ? vm.vet.sFatti : vm.vet.fatti) || [], tx = vm.players.filter(function (p) { return !p.via; }).map(function (p) { return p.id + (fatti.indexOf(p.id) >= 0 ? "1" : "0"); }).join("|");
    if (R.ui.vetK === tx) return; R.ui.vetK = tx;
    ST.vuota(box);
    vm.players.forEach(function (p) {
      if (p.via) return; var ok = fatti.indexOf(p.id) >= 0;
      var c = el("div", { class: "pz-och" + (ok ? " ok" : " aspetta") }, [ fac(el, p), el("span", { class: "nm", text: p.id === R.cb.myId ? "Tu" : p.nome.slice(0, 8) }), el("span", { class: "v", text: ok ? "✅" : "…" }) ]);
      c.style.animation = "none"; box.appendChild(c);
    });
  }
  async function fVetRiv(R) {
    var S = R.S, vm = R.vm, el = R.t.el, V = vm.vet, k = vm.k, e = V && V.esito; if (!e) return;
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, RV.cam); if (!vivoK(R, k)) return;
    // si scoprono solo le vetrine scelte da qualcuno (B c'è anche se la misteriosa la vince solo un VINCI TUTTO)
    var B = e.prezziB && V.b ? V.b : null, usaA = e.usaA !== false, usaB = !!B && e.usaB !== false, due = usaA && usaB;
    var me = R.cb.myId, perId = {}; e.righe.forEach(function (r) { perId[r.id] = r; });
    // (le offerte, il cartello e «VINCI TUTTO» si preparano subito, nascosti, e si mettono sotto quando servono: così
    //  riempi sa lo spazio che prenderanno; con la misteriosa prima ci sono solo le vetrine)
    var nodiR = e.ordine.map(function (id) {
      var r = perId[id], p = gDi(vm, r.id) || { nome: "?" };
      var n = el("div", { class: "pz-riga " + (r.sopra ? "sopra" : r.tutto ? "giusto" : r.pos === 1 ? "vince" : "sotto") }, [ fac(el, p), el("span", { class: "nm", text: (due ? (r.w === "b" ? "🎁 " : V.e + " ") : "") + (r.id === me ? "Tu" : p.nome) }), el("span", { class: "v", text: E(r.v) }),
        el("span", { class: "bd", text: e.righe.length > 4 ? (r.sopra ? "❌" : r.tutto ? "⭐" : r.pos ? r.pos + "°" : "") : r.sopra ? "SFORATO" : r.tutto ? "⭐ TUTTO" : r.pos ? r.pos + "°" : "" }) ]);
      if (r.punti) n.appendChild(el("span", { class: "pt", text: "+" + N(r.punti) }));
      return n;
    });
    var tutto = null;
    if (e.tutti && e.tutti.length) {
      tutto = nascondi(el("div", {}, [ el("div", { class: "pz-tutto", text: "⭐ VINCI TUTTO! ⭐" }) ]));
      // «VINCI TUTTO!» porta a casa anche l'altra vetrina
      if (B) e.tutti.slice(0, 3).forEach(function (id) {
        var altra = perId[id] && perId[id].w === "b" ? { e: V.e, titolo: V.titolo, tot: e.prezzo } : { e: (usaB ? "" : "la vetrina misteriosa ") + "🎁", titolo: B.titolo, tot: e.totB };
        tutto.appendChild(el("div", { class: "pz-sotto", text: (e.vince.indexOf(id) >= 0 ? chiPorta([id], me, vm) + " a casa anche " + altra.e + " «" + altra.titolo + "» (" + E(altra.tot) + ")" :
          chiPorta([id], me, vm) + " a casa tutte e due le vetrine (" + E(Math.round(e.prezzo + e.totB)) + ")") }));
      });
      else if (e.seconda) tutto.appendChild(el("div", { class: "pz-sotto", text: chiPorta(e.tutti, me, vm) + " a casa anche " + e.seconda.e + " «" + e.seconda.titolo + "» (" + E(e.seconda.tot) + ")" }));
    }
    var box = el("div", { class: "pz-vbox" }), righe = el("div", { class: "pz-righe" + (e.righe.length > 4 ? " due" : "") });
    var vince = e.vince || [], banner = nascondi(el("div", { class: vince.length ? "pz-banner" : "pz-banner no", text: vince.length ? "🏆 " + chiVince(vince, me, vm) + " la Vetrina!" : "😱 Sforato da tutti!" })), extra = el("div", {}, [ tutto ]);
    function sotto() { nodiR.forEach(function (n) { righe.appendChild(n); }); banner.style.display = ""; extra.style.display = ""; }
    banner.style.display = "none"; extra.style.display = "none";
    schermo(R, [ box, righe, banner, extra ], "riv");
    if (!due) sotto();   // (una vetrina sola da scoprire: le offerte sotto la lista, come sempre)
    // una vetrina: i suoi pezzi, i prezzi che saltano fuori uno alla volta e il totale che gira (la misteriosa: prima i pezzi)
    async function svela(X, prezzi, tot, mist) {
      ST.vuota(box);
      var lista = vetrinaTes(el, X, prezzi, null, !mist), nodi = lista.tessere, conta = Z().contachilometri(el, tot, {});
      if (mist) nodi.forEach(nascondi);
      box.style.flex = "";
      box.appendChild(el("div", { class: "pz-vtit" + (mist ? " mist" : ""), text: (mist ? "🎁 " : "") + X.e + " " + X.titolo }));
      box.appendChild(lista);
      box.appendChild(el("div", { class: "pz-tot" }, [ el("span", { text: "Totale" }), conta.el ]));
      lista.adatta();
      if (mist) { for (var j = 0; j < nodi.length; j++) { scopri(nodi[j]); Z().FX.toc(500 + j * 60); await ST.dorme(RVET.pezzoB); if (!vivoK(R, k)) return false; } }
      else { ST.FX.rullo(1.2); await ST.dorme(RV.rullo); if (!vivoK(R, k)) return false; }
      for (var i = 0; i < nodi.length; i++) { nodi[i]._tag.classList.add("su"); Z().FX.toc(600 + i * 80); await ST.dorme(RVET.prezzo); if (!vivoK(R, k)) return false; }
      await conta.via(RVET.cifra); if (!vivoK(R, k)) return false;
      ST.pubblico(S, "piano"); await ST.dorme(400);
      return vivoK(R, k);
    }
    if (usaA && !await svela(V, e.prezzi, e.prezzo, false)) return;
    if (usaB) {
      ST.terzo(S, null, usaA ? "…e la vetrina misteriosa era" : "🎁 La vetrina misteriosa era", B.titolo, "🎁"); Z().FX.tada(); fumetto(S, "Ooooh! 🎁");
      await ST.dorme(RVET.mist); if (!vivoK(R, k)) return;
      ST.viaTerzo(S);
      if (!await svela(B, e.prezziB, e.totB, true)) return;
      // tutte e due scelte: le due vetrine in breve; nelle offerte l'emoji della prima = chi l'ha tenuta, 🎁 = la misteriosa
      if (due) {
        ST.vuota(box); box.style.flex = "0 0 auto";
        box.appendChild(el("div", { class: "pz-due" }, [ rigaTotVet(el, V.e, V.titolo, e.prezzo), rigaTotVet(el, "🎁", B.titolo, e.totB) ]));
        sotto(); riempi(R);
        await ST.dorme(RVET.riass); if (!vivoK(R, k)) return;
      }
    }
    // le offerte: dalla più lontana alla più vicina
    for (var q = 0; q < nodiR.length; q++) {
      if (!vivoK(R, k)) return;
      nodiR[q].classList.add("su"); Z().FX.toc(520 + q * 50);
      await ST.dorme(RVET.riga);
    }
    scopri(banner);
    ST.pubblico(S, vince.length ? "ovazione" : "ohh");
    vince.forEach(function (id) { var i2 = idxDi(vm, id); if (i2 >= 0) ST.faccia(S, i2, "evviva"); });
    await ST.dorme(RVET.banner); if (!vivoK(R, k)) return;
    // «VINCI TUTTO!»: vicinissimo (entro il 3%, TUTTO_PCT)
    if (tutto) {
      scopri(tutto);
      ST.coriandoli(); ST.FX.fanfara(); ST.lampo(S); ST.pubblico(S, "ovazione");
      if (e.tutti.indexOf(me) >= 0) Z().vibra([80, 40, 160]);
      await ST.dorme(RVET.tutto); if (!vivoK(R, k)) return;
    }
    var d = {}; e.righe.forEach(function (r) { if (r.punti) d[r.id] = r.punti; });
    await leggiiDelta(R, k, d);
  }

  function rigaTotVet(el, icona, titolo, tot) { return el("div", { class: "pz-vt" }, [ el("span", { class: "i", text: icona }), el("span", { class: "t", text: titolo }), el("b", { text: E(tot) }) ]); }

  // ---------------- IL CARRELLO DEI PREMI ----------------
  function quanti(n) { return n === 1 ? "" : ["", "", "due ", "tre ", "quattro ", "cinque "][n] || n + " "; }
  async function fCarrello(R) {
    var S = R.S, vm = R.vm, el = R.t.el, k = vm.k, car = vm.carrello || {};
    ST.accendiSolo(S, -1); ST.tutteNormali(S);
    await ST.suSchermo(S, 700); if (!vivoK(R, k)) return;
    var lista = vm.players.filter(function (p) { return !p.via; }).map(function (p) {
      var c = car[p.id] || [], tot = c.reduce(function (a, x) { return a + (+x.prezzo || 0); }, 0);
      return { p: p, c: c, tot: tot };
    }).sort(function (a, b) { return b.tot - a.tot; });
    var box = el("div", { class: "pz-cars" + (lista.length > 5 ? " due" : "") });
    schermo(R, [ el("div", { class: "pz-testa", text: "🛒 Cosa vi portate a casa" }), box, el("div", { class: "pz-anno", text: "(euro finti, solo per ridere: la classifica vera è quella dei punti)" }) ]);
    var righe = lista.map(function (x) {
      var cosa;
      if (!x.c.length) cosa = [ el("b", { text: x.p.id === R.cb.myId ? "Tu" : x.p.nome }), el("span", { text: "🧽" }), el("small", { text: "una spugna, premio di consolazione" }) ];
      else {
        var raggr = []; x.c.forEach(function (c) { var g = raggr.filter(function (y) { return y.nome === c.nome; })[0]; if (g) g.n++; else raggr.push({ e: c.e, nome: c.nome, n: 1 }); });
        cosa = [ el("b", { text: x.p.id === R.cb.myId ? "Tu" : x.p.nome }), el("span", { class: "figs" }, x.c.slice(0, 12).map(function (c) { return Z().figura(el, c, "e"); })),
          el("small", { text: raggr.map(function (g) { return quanti(g.n) + g.nome; }).join(", ") }) ];
      }
      return box.appendChild(nascondi(el("div", { class: "pz-car" }, [ fac(el, x.p, x.c.length ? "esulta" : "triste"), el("div", { class: "cosa" }, cosa), el("span", { class: "tot", text: x.c.length ? E(Math.round(x.tot)) : "" }) ])));
    });
    riempi(R);
    await ST.dorme(900);
    for (var q = 0; q < lista.length; q++) {
      if (!vivoK(R, k)) return;
      scopri(righe[q]);
      if (lista[q].c.length) Z().FX.cassa(); else ST.pubblico(S, "piano");
      await ST.dorme(900);
    }
    ST.pubblico(S, "applauso");
  }

  // ---------------- LA FINE ----------------
  async function fFine(R) {
    var S = R.S, vm = R.vm, t = R.t, el = t.el, cb = R.cb, clas = vm.classifica || [];
    R.fineFatta = true;
    var primi = clas.filter(function (r) { return r.pos === 1 && !r.via; });
    if (primi.length === 1) await ST.finale(S, idxDi(vm, primi[0].id), N(primi[0].punti) + " punti");
    else {
      await ST.finale(S, -1);
      if (primi.length > 1 && S.vivo()) {
        primi.forEach(function (r) { ST.faccia(S, idxDi(vm, r.id), "esulta"); });
        ST.terzo(S, null, "Pareggio!", "Vincono " + nomi(primi.map(function (r) { return r.nome; })) + " · " + N(primi[0].punti) + " punti", "🏆");
        ST.pubblico(S, "ovazione"); ST.coriandoli(); ST.FX.fanfara();
        await ST.dorme(3000); ST.viaTerzo(S);
      }
    }
    if (!S.vivo()) return;
    // sullo stesso telefono e col Bot: la fine del core (Serata a punti, rivincita)
    if (cb.locale) return t.fine(clas.map(function (r) { var x = { nome: r.nome, punti: r.punti, pos: r.pos }; if (r.bot) x.bot = true; return x; }));
    var titolo = !primi.length ? "Fine partita" : primi.length === 1 ? "Vince " + primi[0].nome + "!" : "Pareggio!";
    var s = t.schermata({ chiara: true, icona: "🏆", titolo: titolo, sotto: NOME });
    var fitta = clas.length > 6 || clas.length * 64 + 300 > (window.innerHeight || 640);
    var ol = el("ol", { class: "classifica" + (fitta ? " fitta" : "") }), med = medaglieDi(clas.map(function (r) { return r.pos; })), car = vm.carrello || {};
    clas.forEach(function (r, i) {
      var tot = (car[r.id] || []).reduce(function (a, x) { return a + (+x.prezzo || 0); }, 0);
      ol.appendChild(el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] }),
        el("span", { class: "nome", text: r.nome + (r.id === cb.myId ? " (tu)" : "") + (r.via ? " (uscito)" : "") + (tot && !fitta ? " · 🛒 " + E(Math.round(tot)) : "") }),
        el("span", { class: "punti", text: N(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    var targa = conTarga(t), fa = targa ? null : t.faccine(); if (fa) { fa.classList.add("fine-faccine"); s._contenuto.appendChild(fa); }
    var haGiocato = cb.sonoHost || clas.some(function (r) { return r.id === cb.myId; });
    if (!haGiocato) s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: targa ? "👀 Hai guardato: se l'host fa un'altra partita, entri anche tu." : "Questa partita l'hai guardata." }));
    if (targa) s._piede.style.paddingBottom = "calc(62px + env(safe-area-inset-bottom))";   // (il posto della targhetta in basso)
    // I TASTI DI FINE LI METTE IL CORE (Rivincita col 3-2-1, Cambia gioco, Ci sto): solo se torna false i tasti di sempre
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      if (!targa) s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));   // (chi guarda: c'è il ✕ della targhetta)
    }
    t.mostra(s);
  }
  function medaglieDi(posti) { var gruppi = 0, prec = null; return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; }); }

  // ---------------- le cose che cambiano dentro lo stesso passo ----------------
  function aggiornaFase(R) {
    var f = R.vm.fase, s = R.vm.sotto;
    if (f === "offerta" && s === "offri") {
      aggiornaTab(R);
      if (R.tast && R.vm.off && R.cb.locale !== "telefono") { R.tast.offerte(listaOfferte(R, R.tastChi)); R.tast.aggiorna(); }
      else if (R.tast && R.vm.off) { R.tast.offerte(listaOfferte(R, R.tastChi)); R.tast.aggiorna(); }
    }
    else if (f === "scegli") aggiornaScelta(R);
    else if (f === "premio" && s === "gioca") aggiornaPremio(R);
    else if (f === "premio" && s === "intro") aggiornaAvanti(R);
    else if (f === "punti") aggiornaAvanti(R);
    else if (f === "ruota") aggiornaRuota(R);
    else if (f === "vetrina" && (s === "offri" || s === "scegli")) aggiornaVet(R);
  }
  // i messaggi solo per questo telefono
  function privatoR(m) {
    if (!R || !m) return;
    if (m.k === "mia" || m.k === "miaV") {
      if (m.k === "mia") { R.mie["o" + m.kk] = m.v; R.mie.oId = m.per; } else R.mie["v" + m.kk] = m.v;
      // (chi ha ricaricato la pagina e ha già offerto: il tastierino si chiude da solo, col prezzo che aveva detto)
      if (R.tast && R.tastK === m.kk && R.vm.k === m.kk && R.cb.locale !== "telefono") {
        var k0 = m.kk, v0 = m.v; R.tast.fatto(v0);
        if (!R.toAttesa || R.toAttesaK !== k0) { clearTimeout(R.toAttesa); R.toAttesaK = k0; R.toAttesa = setTimeout(function () { if (vivoK(R, k0) && R.tast) attesa(R, m.k === "miaV" ? "✅ Hai offerto " + E(v0) + " per la vetrina" : "✅ Hai offerto " + E(v0) + " · aspettiamo gli altri…"); }, 1300); }
      }
      return;
    }
    if (m.k === "preso" || m.k === "sotto") {
      if (R.tast && R.tastK === m.kk) {
        clearTimeout(R.toAttesa);
        if (!R.pan.aperto() && R.tastChi) apriOfferta(R);
        else { R.tast.svuota(); R.tast.riapri(); }   // il prezzo non va: si riscrive da capo
        fumetto(R.S, m.k === "preso" ? "Già preso da " + m.da + "! 😬" : "Sotto i " + E(m.lim) + "!");
      }
      return;
    }
    if (m.k === "premio") {
      if (!R.premioPriv || R.premioPriv.k !== m.kk) R.premioPriv = { k: m.kk, l: [] };
      R.premioPriv.l.push(m);
      if (R.premioPan && R.premioPan.privato && (m.per == null || m.per === R.premioChi)) try { R.premioPan.privato(m.m); } catch (e) {}
      return;
    }
    if (m.k === "indizio") {
      (R.indizi = R.indizi || {})[m.per] = m;   // (sullo stesso telefono ne arrivano anche due)
      if (R.tast && R.tast.el && R.vetChi === m.per && R.tastChi === m.per && R.vm.fase === "vetrina" && !R.tast.el.querySelector(".pz-indizio")) {
        var ri = rigaIndizio(R, m.per); if (ri) { R.tast.el.insertBefore(ri, R.tast.el.firstChild); if (R.pan.aperto()) R.pan.su(); }
      }
      return;
    }
    if (m.k === "miaR") { R.mie["r" + m.kk] = m.si; return; }
  }

  // ---------------- schermate di servizio ----------------
  function errore(t, testo) {
    var s = t.schermata({ chiara: true, icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ chiara: true, icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ chiara: true, icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online si gioca quando l'app è aperta dal sito pubblicato. Intanto potete giocare «Su questo telefono» o «Contro il Bot»." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  function niente(t) {
    var s = t.schermata({ chiara: true, icona: "🏷️", titolo: "Mancano i prodotti", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "I prodotti del gioco non sono stati caricati." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  REGISTRAZIONE
  // =========================================================
  SG.registra({
    id: ID, nome: NOME, icona: "🏷️",
    descrizione: "Quanto costa? Come nel programma della TV: l'Offerta col sipario, i giochi a premi, la Ruota del 100 e la Vetrina finale. Oppure solo il prezzo, un oggetto dopo l'altro. Ognuno dal suo telefono, tutti insieme.",
    giocatoriMin: 2, giocatoriMax: 8, difficolta: 2,
    postiOnline: MAX_ON,   // fino a 8 nello studio: nella Sala, se siete di più, l'host sceglie chi gioca
    riprende: true,   // online: se l'host ricarica o riapre l'app, la partita riprende da dove era (t.ripresa)
    riserva: true,    // online: se l'host sparisce del tutto, un amico porta avanti la partita (gioco lungo, da 2 a 8, non a due né in tempo reale)
    // (23 ott 2026) chi arriva a partita cominciata entra all'inizio del prossimo oggetto, della Ruota o della Vetrina, con 0
    // punti (H.arrivi, col suo id nella foto); chi vuole solo guardare («👀 Guarda» nella Sala, link con &guarda=1) guarda
    ritardatari: "turno",
    modi: [
      { modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Da 2 a 8, a turno", amici: true, min: 2 },
      // diretto: si parte subito (due tocchi dalla home) con le regole di partenza di impostazioni(): 📺 Come in TV, Puntata,
      // 3 Bot medi, offerte a vista, tutte le categorie
      { modo: "bot", icona: "🤖", nome: "Contro il Bot", sotto: "Tu contro 3 Bot, come in TV", min: 1, diretto: true }
    ],
    regole: [
      "Si indovina il <b>prezzo</b> di cose vere: la spesa, il caffè al bar, lo smartphone, la Vespa, una settimana al mare… Sono prezzi medi in Italia.",
      "📺 <b>Come in TV</b>: si apre il sipario, compare un prodotto e avete <b>20 secondi</b> per scrivere il prezzo. Vince chi ci va <b>più vicino senza superarlo</b> (se superi di pochissimo, entro il 2%, vale ancora).",
      "👀 Con le offerte <b>a vista</b> si vedono arrivare: un prezzo già detto non si può ridire, e chi aspetta può fare il <b>«+1 €»</b> cattivo. Con le offerte <b>segrete</b> si scoprono tutte alla fine.",
      "Se <b>sforate tutti</b>, si rifà una volta sola, tutti sotto l'offerta più bassa.",
      "Punti: <b>300</b> al primo, <b>150</b> al secondo, <b>75</b> al terzo (con almeno 4 giocatori). <b>PREZZO GIUSTO!</b> (praticamente preciso): <b>+500</b>.",
      "Chi vince l'Offerta sceglie il <b>gioco a premi</b>, e si gioca tutti insieme.",
      "🎡 <b>La Ruota del 100</b>: girate tutti, poi decidete in segreto se girare ancora (si somma). Vince chi va più vicino a 100 senza superarlo: <b>200</b> al primo, 100 al secondo, 50 al terzo (con almeno 4 giocatori). 100 esatto: <b>+300</b> e il giro bonus (100 ancora +300, uno spicchio verde +150). Chi vince la Ruota ha un <b>indizio</b> sulla Vetrina.",
      "🛍️ <b>La Vetrina finale</b>: tanti premi insieme. Poi ognuno sceglie in segreto: <b>la tengo</b> o prendo la <b>🎁 vetrina misteriosa</b> (la scopri solo dopo averla scelta). Offerta segreta sul totale della tua: vince chi ci va più vicino (in percentuale) senza superarlo. Punti: <b>450</b> al primo, 225 al secondo, 110 al terzo (con almeno 4 giocatori) e, se ci vai vicinissimo (entro il 3%), <b>VINCI TUTTO!</b> (+1.000) e ti porti a casa anche l'altra vetrina.",
      "🎯 <b>Solo il prezzo</b>: esce un oggetto, 20 secondi, vince chi va più vicino (sopra o sotto, a meno che chi ospita scelga «Senza sforare»). Preciso: +500. <b>L'ultimo oggetto vale doppio.</b>",
      "Alla fine il <b>carrello</b>: cosa vi portate a casa (euro finti, solo per ridere). Vince chi ha più punti.",
      "<b>Sullo stesso telefono</b> si gioca a turno: con le offerte segrete vi passate il telefono."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, modo = aiuti.modo;
      if (["tv", "solo"].indexOf(dove.formato) < 0) dove.formato = "tv";
      if (!N_GIRI[dove.durata]) dove.durata = "puntata";
      if (["vista", "segrete"].indexOf(dove.offerte) < 0) dove.offerte = modo === "telefono" ? "segrete" : "vista";
      if (typeof dove.sforare !== "boolean") dove.sforare = false;
      if (!ERR[dove.liv]) dove.liv = "medio";
      if ([1, 3, 5].indexOf(dove.nBot) < 0) dove.nBot = 3;
      if (!Array.isArray(dove.categorie) || dove.categorie.length < 3) dove.categorie = Z().ORDINE_CAT.slice();
      var gruppi = {};
      function gruppo(etichetta, chiave, voci, due) {
        var tit = el("div", { class: "etichetta", text: etichetta }), g = el("div", { class: "modo-griglia", style: due ? "display:grid;grid-template-columns:1fr 1fr;gap:8px" : "" }), bb = [];
        voci.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v.v ? " attiva" : ""), type: "button", onclick: function () {
            dove[chiave] = v.v; bb.forEach(function (x) { x.b.className = "modo-chip" + (x.v === v.v ? " attiva" : ""); });
            if (chiave === "formato") mostraSolo();
          } }, [ el("div", {}, [ el("div", { class: "mt", text: v.mt }), v.ms ? el("div", { class: "ms", text: v.ms }) : null ]) ]);
          bb.push({ b: b, v: v.v }); g.appendChild(b);
        });
        box.appendChild(tit); box.appendChild(g);
        gruppi[chiave] = [tit, g];
      }
      gruppo("Formato", "formato", [ { v: "tv", mt: "📺 Come in TV", ms: "Offerte, giochi a premi, Ruota e Vetrina" }, { v: "solo", mt: "🎯 Solo il prezzo", ms: "Un oggetto dopo l'altro, vince il più vicino" } ]);
      gruppo("Quanto dura", "durata", [ { v: "veloce", mt: "⚡ Veloce", ms: "TV: 2 offerte · Solo: 6 oggetti" }, { v: "puntata", mt: "📺 Puntata", ms: "TV: 3 offerte · Solo: 10 oggetti" }, { v: "lunga", mt: "🌙 Serata lunga", ms: "TV: 4 offerte e 2 Ruote · Solo: 15 oggetti" } ]);
      gruppo("Le offerte", "offerte", [ { v: "vista", mt: "👀 A vista", ms: modo === "telefono" ? "A turno, come in TV: occhio al «+1 €»" : "Si vedono arrivare: occhio al «+1 €»" }, { v: "segrete", mt: "🤫 Segrete", ms: modo === "telefono" ? "Vi passate il telefono" : "Si scoprono alla fine" } ], true);
      gruppo("Si può sforare? (🎯 Solo il prezzo)", "sforare", [ { v: false, mt: "↕️ Sì", ms: "Vince il più vicino, sopra o sotto" }, { v: true, mt: "⬇️ Senza sforare", ms: "Come in TV: chi supera non vale" } ], true);
      function mostraSolo() { (gruppi.sforare || []).forEach(function (n) { n.style.display = dove.formato === "solo" ? "" : "none"; }); }
      mostraSolo();
      // le categorie (almeno 3 accese)
      box.appendChild(el("div", { class: "etichetta", text: "Le categorie" }));
      var cg = el("div", { class: "cat-griglia" });
      Z().ORDINE_CAT.forEach(function (c) {
        var C = Z().CAT[c];
        var b = el("button", { class: "cat-chip" + (dove.categorie.indexOf(c) >= 0 ? " attiva" : ""), type: "button", onclick: function () {
          var i = dove.categorie.indexOf(c);
          if (i >= 0) { if (dove.categorie.length <= 3) return; dove.categorie.splice(i, 1); } else dove.categorie.push(c);
          b.className = "cat-chip" + (dove.categorie.indexOf(c) >= 0 ? " attiva" : "");
        } }, [ el("span", { class: "ci", text: C.ic }), el("span", { text: C.corto }), el("span", { class: "spunta", text: "✓" }) ]);
        cg.appendChild(b);
      });
      box.appendChild(cg);
      if (modo === "bot") {
        gruppo("Quanti Bot", "nBot", [ { v: 1, mt: "1 Bot" }, { v: 3, mt: "3 Bot" }, { v: 5, mt: "5 Bot" } ], false);
        gruppi.nBot[1].style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px";
        gruppo("Bravura del Bot", "liv", [ { v: "facile", mt: "🟢 Facile" }, { v: "medio", mt: "🟡 Medio" }, { v: "difficile", mt: "🔴 Difficile" } ], false);
        gruppi.liv[1].style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px";
      }
      box.appendChild(el("p", { class: "modulo-nota", text: modo === "online" ? "Online ognuno gioca dal suo telefono, tutti insieme: 20 secondi per ogni offerta." : modo === "bot" ? "Tu contro i Bot, tutti insieme: 20 secondi per ogni offerta." : "Sullo stesso telefono si gioca a turno." }));
    },
    // la riga «📜 Si gioca così» che leggono gli amici in saletta
    riassunto: function (imp) {
      imp = imp || {};
      var solo = imp.formato === "solo", d = imp.durata || "puntata";
      var nCat = Array.isArray(imp.categorie) && imp.categorie.length >= 3 && imp.categorie.length < 10 ? imp.categorie.length + " categorie su 10" : "tutte le categorie";
      return (solo ? "🎯 Solo il prezzo · " + (N_OGG[d] || 10) + " oggetti · " + (imp.sforare ? "senza sforare" : "sopra o sotto") :
        "📺 Come in TV · " + ({ veloce: "⚡ Veloce", lunga: "🌙 Serata lunga" }[d] || "📺 Puntata")) + " · offerte " + (imp.offerte === "segrete" ? "segrete" : "a vista") + " · " + nCat;
    },
    avvia: function (t) {
      Z().stile();
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      var modo = (t.impostazioni || {}).modo;
      if (modo === "online") return motore(t, "online");
      if (modo === "bot") return motore(t, "bot");
      return motore(t, "telefono");
    }
  });

  // per le prove: le regole senza grafica
  window.__prezzo = { esitoOfferta: esitoOfferta, esitoVetrina: esitoVetrina, esitoRuota: esitoRuota, piano: piano, posizioni: posizioni, puntiPos: puntiPos, stimaBot: stimaBot, leggiImp: leggiImp, prodotti: prodotti, vetrine: vetrine, puntiBonus: puntiBonus };
})();
