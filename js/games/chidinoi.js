/* =========================================================
   «CHI DI NOI?» (id "chidinoi") — il nostro «Dimmi chi sei!» (That's You!) migliorato.
   Solo online, da 3 a 10 amici, ognuno dal suo telefono. Si gira per tanti POSTI buffi
   (In prigione, Nel bosco, Al calcetto del giovedì…): in ogni posto uno di voi è SOTTO TORCHIO,
   arriva vestito per il posto e le domande sono su di lui. I round:
   - 🖼️ Immagini: 4 carte (personaggi fatti con gli avatar, cose con le emoji, o lui stesso): scegli quella giusta per lui;
   - ✍️ Scrivi: tutti scrivono una battuta, la vetrina le mostra una alla volta, poi si vota la più divertente;
   - 🎨 Disegna: col dito e con gli adesivi (si trascinano, girano, ingrandiscono), sulla scena o sul suo ritratto, poi si vota;
   - 👆 Chi di noi: si tocca la faccia di un amico.
   PUNTI (decisione del proprietario): sempre VOTANDO COME GLI ALTRI, 100 per ogni amico che sceglie come te
   (nello Scrivi e nel Disegna il voto di chi è sotto torchio vale doppio); +100 all'autore della battuta o del disegno
   più votato; 3 jolly a testa che raddoppiano; TUTTI D'ACCORDO = +100 a tutti.
   Gran finale «Passa il ritratto!», titoli (🎯 Il Bersaglio, 🧠 Mente del Gruppo, 🃏 Il Cecchino + i titoli dei posti),
   podio e figurina da salvare. Memoria delle domande già uscite (telefono e profilo dell'host, e quelle viste dagli amici).
   Partito dal modello dei giochi online (saletta, rientri, uscite, fine partita, Sala).
   Contenuti: data/chidinoi-1…5.js (window.SG_CHIDINOI). Disegni: js/chidinoi-arte.js (window.SG_CDN_ARTE).
   LA FACCIA di un giocatore passa SEMPRE da faccia() qui sotto (→ SG_CDN_ARTE.faccia): è lì che si attacca la foto vera.
   ========================================================= */
(function () {
  "use strict";

  var ID = "chidinoi";
  var MIN = 3, MAX = 10;
  var TEMPI = { normali: { sc: 15, scr: 60, dis: 90 }, calma: { sc: 20, scr: 80, dis: 120 }, veloci: { sc: 12, scr: 45, dis: 60 } };
  var T_ARRIVO = 6, T_RIEP = 10, T_VOTA = 20, T_VOTAD = 25, T_CLASS = 9, T_PASSA = 30, T_FVOTA = 25, T_FINTRO = 5, T_NESSUNO = 5;
  var REAZ = ["😂", "🔥", "❤️", "🍅", "💀"];
  var COLORI = ["#1b1b1f", "#ffffff", "#e03131", "#f59f00", "#ffd43b", "#2f9e44", "#1c7ed6", "#e64980"];
  var GOMMA = 8, PUNTE = [7, 18];
  var LW = 750, LH = 1000;          // la tavola da disegno (3:4), in coordinate fisse
  var MAX_PUNTI = 2600, MAX_ADESIVI = 30;
  var ARTE = function () { return window.SG_CDN_ARTE || {}; };

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }   // 1.000
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function mescola(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function caso(a) { return a[Math.floor(Math.random() * a.length)]; }
  function lim(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p || 10); } catch (e) {} }
  function nuovoId() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function tx(n, s) { s = s == null ? "" : String(s); if (n && n.textContent !== s) n.textContent = s; }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function oggi() { return Math.floor(Date.now() / 86400000); }
  function pulisci(s, max) { return String(s || "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max || 40); }
  function punti(n) { return fmtN(n) + (Math.abs(n) === 1 ? " punto" : " punti"); }
  function maiuscolo(s) { return String(s || "").toUpperCase(); }

  // =========================================================
  //  CONTENUTI
  // =========================================================
  function dati() { return window.SG_CHIDINOI || { posti: [], comuni: [] }; }
  var POSTI_ORD = ["prigione", "bosco", "treno", "villa", "isola", "matrimonio", "pranzo", "condominio", "sagra", "pronto",
    "crociera", "reality", "gita", "spiaggia", "appuntamento", "calcetto", "sabato", "ufficio", "compleanno", "macchina"];
  function posti() {
    var D = dati(), m = {};
    (D.posti || []).forEach(function (p) { m[p.id] = p; });
    return POSTI_ORD.filter(function (id) { return m[id]; }).map(function (id) { return m[id]; }).concat((D.posti || []).filter(function (p) { return POSTI_ORD.indexOf(p.id) < 0; }));
  }
  function posto(id) { var l = posti(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function nomeCorto(p) { return String(p.nome || "").replace(/^(In|Nel|Nella|Sul|Su un'|Su una|Al|Alla|Il|Dentro un|In una|In un) /i, "").replace(/^\w/, function (c) { return c.toUpperCase(); }); }
  function comuni(tipo) { return (dati().comuni || []).filter(function (c) { return c.tipo === tipo; }); }
  // {P} = nome di chi è sotto torchio, {o|a} = finale secondo il suo avatar (lui/lei); senza nessuno: «o/a»
  function accorda(s, nome, donna) {
    s = String(s || "");
    s = s.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, function (_, m, f) { return donna == null ? (m + "/" + f) : (donna ? f : m); });
    return nome != null ? s.replace(/\{P\}/g, nome) : s;
  }
  function eDonna(om) { return !!(om && om.forma === "donna"); }
  // gli adesivi di una stringa di emoji (le emoji composte restano intere)
  function spezzaEmoji(s) {
    s = String(s || "");
    try { if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter("it", { granularity: "grapheme" }).segment(s), function (x) { return x.segment; }).filter(function (x) { return x.trim(); }); } catch (e) {}
    var out = [], re = /(\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}️?)*)/gu, m;
    try { while ((m = re.exec(s))) out.push(m[0]); } catch (e) { out = s.split(""); }
    return out;
  }

  // ---------- la memoria delle domande già uscite ----------
  // sul telefono: { id: giorno } ; nel profilo: stat.chidinoi.visti = "pri:i1.4.7,s2|bos:…" (senza giorno)
  var LS_VISTI = "sg_chidinoi_visti", LS_POSTI = "sg_chidinoi_posti", LS_TORCHIO = "sg_chidinoi_torchio";
  function leggiJ(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" ? v : d; } catch (e) { return d; } }
  function scriviJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function compatta(ids) {
    var g = {};
    ids.forEach(function (id) { var m = /^([a-z]{3})-([a-z])(\d+)$/.exec(id); if (!m) return; var p = g[m[1]] || (g[m[1]] = {}); (p[m[2]] || (p[m[2]] = [])).push(+m[3]); });
    return Object.keys(g).map(function (c) { return c + ":" + Object.keys(g[c]).map(function (t) { return t + g[c][t].sort(function (a, b) { return a - b; }).join("."); }).join(","); }).join("|");
  }
  function scompatta(s) {
    var out = [];
    String(s || "").split("|").forEach(function (blocco) {
      var a = blocco.split(":"); if (a.length !== 2 || !/^[a-z]{3}$/.test(a[0])) return;
      a[1].split(",").forEach(function (pz) {
        var t = pz.charAt(0); if (!/[a-z]/.test(t)) return;
        pz.slice(1).split(".").forEach(function (n) { n = parseInt(n, 10); if (n > 0 && n < 1000) out.push(a[0] + "-" + t + (n < 10 ? "0" + n : n) + ""); });
      });
    });
    return out;
  }
  function vistiMiei() {
    var v = leggiJ(LS_VISTI, {}), o = {};
    Object.keys(v).forEach(function (k) { o[k] = +v[k] || 1; });
    try {
      var st = window.SGNube && SGNube.profilo && SGNube.profilo() && SGNube.statGioco ? SGNube.statGioco(ID) : null;
      if (st && st.visti) scompatta(st.visti).forEach(function (id) { if (!o[id]) o[id] = 1; });
    } catch (e) {}
    return o;
  }
  // a fine partita: le domande uscite si segnano sul telefono e nel profilo
  function segnaVisti(ids) {
    if (!ids || !ids.length) return;
    var v = leggiJ(LS_VISTI, {}), g = oggi();
    ids.forEach(function (id) { if (typeof id === "string" && id.length < 12) v[id] = g; });
    var k = Object.keys(v); if (k.length > 2400) { k.sort(function (a, b) { return v[a] - v[b]; }).slice(0, k.length - 2400).forEach(function (x) { delete v[x]; }); }
    scriviJ(LS_VISTI, v);
    try {
      if (window.SGNube && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi) {
        var tutti = Object.keys(vistiMiei()).filter(function (id) { return /^[a-z]{3}-[isdc]\d+$/.test(id); });
        SGNube.salvaProgressi(null, ID, [["partite", 1]], null, [["visti", compatta(tutti)]]);
      }
    } catch (e) {}
  }

  // =========================================================
  //  SUONI (sintetizzati; sul computer di prova sono spenti)
  // =========================================================
  function suono(tipo) {
    var ac = null; try { ac = SG.audioCtx && SG.audioCtx(); } catch (e) {}
    if (!ac) return;
    try {
      var ora = ac.currentTime;
      var nota = function (f, t0, dur, forma, vol, f2) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = forma || "sine"; o.frequency.setValueAtTime(f, ora + t0);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, ora + t0 + dur);
        g.gain.setValueAtTime(0.0001, ora + t0); g.gain.exponentialRampToValueAtTime(vol || 0.12, ora + t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, ora + t0 + dur);
        o.connect(g); g.connect(ac.destination); o.start(ora + t0); o.stop(ora + t0 + dur + 0.05);
      };
      if (tipo === "tic") nota(1100, 0, 0.05, "square", 0.04);
      else if (tipo === "pop") nota(520, 0, 0.09, "triangle", 0.1, 900);
      else if (tipo === "voto") nota(760, 0, 0.07, "sine", 0.08, 1040);
      else if (tipo === "boing") { nota(220, 0, 0.25, "triangle", 0.12, 660); nota(330, 0.12, 0.2, "sine", 0.06, 880); }
      else if (tipo === "evviva") [523, 659, 784, 1047].forEach(function (f, i) { nota(f, i * 0.09, 0.22, "triangle", 0.11); });
      else if (tipo === "tutti") [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { nota(f, i * 0.07, 0.3, "triangle", 0.12); });
      else if (tipo === "zero") nota(180, 0, 0.35, "sawtooth", 0.06, 110);
      else if (tipo === "sfilata") { nota(392, 0, 0.12, "square", 0.05); nota(587, 0.1, 0.18, "square", 0.05, 784); }
      else if (tipo === "arrivo") { [392, 494, 587, 784].forEach(function (f, i) { nota(f, i * 0.11, 0.26, "sine", 0.09); }); }
      else if (tipo === "lancia") nota(300, 0, 0.18, "sine", 0.1, 1200);
    } catch (e) {}
  }

  // =========================================================
  //  LA FACCIA (punto unico: oggi l'avatar, domani la foto col filtro — vedi js/chidinoi-arte.js)
  // =========================================================
  var OMINI = {};   // id → avatar (le foto lo mandano una volta: si tiene qui)
  function ricordaOmini(players) { (players || []).forEach(function (p) { if (p && p.id && p.omino) OMINI[p.id] = p.omino; }); }
  function faccia(id, nome, o) {
    var A = ARTE();
    if (!A.faccia) return "";
    return A.faccia({ id: id, nome: nome, omino: OMINI[id] || null }, o || {});
  }
  // un'immagine con la faccia di un giocatore: si ricorda di chi è, così quando arriva (o cambia) la sua foto si aggiorna da sola
  function imgF(t, id, nome, o, classe) { var i = img(t, faccia(id, nome, o), classe); i._cnf = { id: id, nome: nome, o: o || {} }; return i; }
  function aggiornaFacce(id) {
    [].forEach.call(document.querySelectorAll("img"), function (im) {
      var c = im._cnf; if (!c || (id && c.id !== id)) return;
      var s = faccia(c.id, c.nome, c.o); if (s && im.getAttribute("src") !== s) im.src = s;
    });
    if (FB && FB.agg) FB.agg();
  }

  // =========================================================
  //  LA FOTO VERA (js/chidinoi-foto.js). La chiave sta SOLO nel link della stanza, dopo il # (SG.chiaveFoto):
  //  ogni foto viaggia cifrata (AES-GCM) a pezzi, come mossa normale (mai trattenuta, mai nella vm);
  //  nella vm solo { f: numero della foto, x: filtro, h: l'host ce l'ha intera } e kf (l'impronta della chiave).
  //  Le foto degli altri restano solo in memoria e si buttano quando si esce dal gioco; la mia resta in questa scheda
  //  (sessionStorage) finché dura il gioco, per non rifarla se la pagina si ricarica.
  // =========================================================
  var FX = function () { return window.SG_CDN_FOTO || null; };
  var SS_MIA = "sg-cn-mia", PEZZO = 6000;
  function nuovoFT() { return { key: null, kf: null, pronta: false, mia: null, enc: null, rx: {}, chiesti: {}, visti: {}, male: {}, ultR: 0, ultP: 0, chiesto: false, vm: null, cb: null, t: null }; }
  var FT = nuovoFT();
  function nuovoF() { var s = ""; while (s.length < 8) s += Math.random().toString(36).slice(2); return s.slice(0, 8); }
  function miaLeggi(cb) {
    var o = null; try { o = JSON.parse(sessionStorage.getItem(SS_MIA) || "null"); } catch (e) {}
    if (!o) return cb(null);
    if (o.u && Date.now() - o.u > 30 * 60000) { miaScrivi(null); return cb(null); }   // (fuori dal gioco da più di mezz'ora: si butta)
    if (o.av) return cb({ av: true });
    if (!o.f || !o.j || !FX()) return cb(null);
    try { FX().daJpeg(FX().daB64(o.j), function (cv) { cb(cv ? { f: o.f, x: o.x | 0, cv: cv, j: o.j } : null); }); } catch (e) { cb(null); }
  }
  function miaScrivi(m) { try { if (!m) sessionStorage.removeItem(SS_MIA); else sessionStorage.setItem(SS_MIA, JSON.stringify(m.av ? { av: 1 } : { f: m.f, j: m.j, x: m.x })); } catch (e) {} }
  // all'inizio: la chiave (dal link, o fatta adesso dall'host) e la mia foto di prima (pagina ricaricata)
  function fotoInizia(codice, crea, myId, fatto) {
    var F = FX(), n = 2;
    function fine() { if (--n === 0) { FT.pronta = true; if (fatto) fatto(); } }
    if (!F) { FT.pronta = true; if (fatto) fatto(); return; }
    var k = null; try { k = window.SG && SG.chiaveFoto ? SG.chiaveFoto(codice, crea) : null; } catch (e) {}
    F.importa(k).then(function (r) { if (r) { FT.key = r.key; FT.kf = r.kf; } fine(); });
    miaLeggi(function (m) { if (m) { FT.mia = m; miaScrivi(m); if (m.cv) F.metti(myId, m.f, m.cv, m.x); } fine(); });   // (di nuovo in gioco: niente più scadenza)
  }
  function fotoOk(vm) { return !!(FT.key && vm && vm.kf && vm.kf === FT.kf); }
  function validoPezzo(m) {
    return typeof m.f === "string" && /^[a-z0-9]{4,16}$/.test(m.f) && typeof m.iv === "string" && m.iv.length <= 24 && typeof m.c === "string" && m.c.length <= PEZZO + 8 &&
      (m.di | 0) >= 1 && (m.di | 0) <= 16 && (m.pz | 0) >= 0 && (m.pz | 0) < (m.di | 0) && /^[A-Za-z0-9+/=]*$/.test(m.c);
  }
  function xDi(id, f) { var v = FT.vm, l = v ? (v.players || []).concat(v.guarda || []) : []; for (var i = 0; i < l.length; i++) if (l[i].id === id && l[i].fo && l[i].fo.f === f) return l[i].fo.x | 0; return 0; }
  // la mia faccia all'host: quale foto e quale filtro (o nessuna: avatar), poi i pezzi cifrati
  function mandaRitratto(cb) {
    var m = FT.mia, ok = fotoOk(FT.vm) && !(FX() && FX().spente) && m && !m.av && m.f;
    FT.ultR = Date.now();
    cb.invia({ t: "ritratto", f: ok ? m.f : null, x: m && !m.av ? m.x | 0 : 0 });
  }
  function mandaMia(cb, forza) {
    var m = FT.mia, F = FX(); if (!m || m.av || !m.j || !FT.key || !F || !fotoOk(FT.vm)) return;
    var ora = Date.now(); if (!forza && ora - FT.ultP < 5000) return; FT.ultP = ora;
    function via(E) { for (var i = 0; i < E.pz.length; i++) cb.invia({ t: "foto", f: E.f, iv: E.iv, pz: i, di: E.pz.length, c: E.pz[i] }); }
    if (FT.enc && FT.enc.f === m.f) return via(FT.enc);
    F.cifra(FT.key, F.daB64(m.j), m.f).then(function (r) {
      if (FT.mia !== m) return;
      var pz = []; for (var i = 0; i < r.c.length; i += PEZZO) pz.push(r.c.slice(i, i + PEZZO));
      FT.enc = { f: m.f, iv: r.iv, pz: pz }; via(FT.enc);
    });
  }
  // a ogni foto dell'host (e ogni secondo): i filtri degli altri, le foto che mancano (si chiedono), la mia (si rimanda se l'host non ce l'ha)
  function fotoVm(t, vm, cb) {
    FT.vm = vm; FT.cb = cb; FT.t = t;
    var F = FX(); if (!F) return;
    var sp = !!(vm.imp && vm.imp.foto === false);
    if (F.spente !== sp) { F.spente = sp; setTimeout(function () { aggiornaFacce(null); }, 0); }
    var ok = fotoOk(vm), ora = Date.now(), io = null;
    (vm.players || []).concat(vm.guarda || []).forEach(function (p) {
      if (p.id === cb.myId) { io = p; return; }
      var fo = p.fo;
      if (!fo || !fo.f) { if (F.ha(p.id)) F.togli(p.id); return; }
      if (F.ha(p.id, fo.f)) { F.filtro(p.id, fo.x); return; }
      if (F.ha(p.id)) F.togli(p.id);   // (una foto vecchia: l'ha rifatta)
      if (!ok || !fo.h || cb.sonoHost) return;
      // arriva da sola (l'host la manda a tutti appena ce l'ha); se tarda o è andata persa, la chiedo
      var R = FT.rx[p.id], kv = p.id + "|" + fo.f;
      if (R && R.f === fo.f && ora - R.t < 6000) return;
      if (!FT.visti[kv]) { FT.visti[kv] = ora; return; }
      if (ora - FT.visti[kv] < 2500 || ora - (FT.chiesti[p.id] || 0) < 6000 || FT.male[kv]) return;
      FT.chiesti[p.id] = ora; cb.invia({ t: "dammiFoto", id: p.id });
    });
    if (!io || !FT.pronta) return;
    var m = FT.mia, f = m && !m.av && ok && !sp ? m.f : null, x = m && !m.av ? m.x | 0 : 0, fo = io.fo || null;
    if ((fo ? fo.f : null) !== f || (f && (fo.x | 0) !== x)) { if (ora - FT.ultR > 2500) setTimeout(function () { mandaRitratto(cb); }, 0); }
    else if (f && !fo.h) setTimeout(function () { mandaMia(cb); }, 0);
  }
  // un pezzo di una foto (dall'host, per tutti o solo per me): quando ci sono tutti si decifra e si mostra
  function fotoPezzo(m, cb) {
    var F = FX(); if (!F || !FT.key || !m.id || m.id === cb.myId || !validoPezzo(m) || F.ha(m.id, m.f)) return;
    var R = FT.rx[m.id];
    if (!R || R.f !== m.f || R.iv !== m.iv || R.di !== (m.di | 0)) R = FT.rx[m.id] = { f: m.f, iv: m.iv, di: m.di | 0, pz: {}, n: 0, t: 0 };
    R.t = Date.now();
    if (R.pz[m.pz] == null) { R.pz[m.pz] = m.c; R.n++; }
    if (R.n < R.di || R.lavora) return;
    R.lavora = true;
    var c = ""; for (var i = 0; i < R.di; i++) c += R.pz[i];
    function male() { if (FT.rx[m.id] === R) delete FT.rx[m.id]; FT.male[m.id + "|" + R.f] = 1; }
    F.decifra(FT.key, R.iv, c, R.f).then(function (bytes) {
      F.daJpeg(bytes, function (cv) {
        if (!cv) return male();
        if (FT.rx[m.id] === R) delete FT.rx[m.id];
        if (FT.key) F.metti(m.id, R.f, cv, xDi(m.id, R.f));
      });
    }).catch(male);
  }
  // il camerino (js/chidinoi-foto.js): selfie, galleria o avatar, poi il filtro
  function apriCamerino(t, cb, soloFiltri) {
    var F = FX(); if (!F || F.aperto() || !cb.myId) return;
    var m = FT.mia;
    setTimeout(function () { cb.invia({ t: "cam", on: 1 }); }, 0);
    var nome = t.nomeProfilo ? t.nomeProfilo() : "";
    F.camerino({ base: m && m.cv ? m.cv : null, x: m && m.cv ? m.x : 0, filtri: !!soloFiltri,
      avatar: ARTE().faccia ? ARTE().faccia({ id: "__avatar", nome: nome, omino: OMINI[cb.myId] || t.mioOmino(nome) }, {}) : "",
      onFatto: function (r) { scegliMia(r, cb); cb.invia({ t: "cam", on: 0 }); },
      onChiudi: function () { cb.invia({ t: "cam", on: 0 }); if (FB && FB.agg) FB.agg(); } });
  }
  function scegliMia(r, cb) {
    var F = FX(); if (!F) return;
    var nuova = false;
    if (r.avatar) { FT.mia = { av: true }; FT.enc = null; F.togli(cb.myId); }
    else if (FT.mia && FT.mia.cv && FT.mia.cv === r.base) { FT.mia.x = r.x | 0; F.filtro(cb.myId, r.x); }   // solo il filtro
    else {
      var j = ""; try { j = F.aB64(F.jpeg(r.base)); } catch (e) { return; }
      FT.mia = { f: nuovoF(), x: r.x | 0, cv: r.base, j: j }; FT.enc = null; nuova = true;
      F.metti(cb.myId, FT.mia.f, r.base, r.x);
    }
    miaScrivi(FT.mia);
    if (FB && FB.agg) FB.agg();
    setTimeout(function () { mandaRitratto(cb); if (nuova) mandaMia(cb, true); }, 0);   // (solo il filtro: viaggia il nome, la foto no)
  }
  // il riquadro della foto nella saletta (uno solo, aggiornato a pezzi): la mia faccia, «📸 Rifai», «🎭 Filtro», chi si sta facendo la foto
  var FB = null;
  function boxFoto(t, vm, cb) {
    var F = FX(); if (!F) return null;
    if (!FB || FB.t !== t || FB.my !== cb.myId) {
      var faccina = imgF(t, cb.myId, "", {}, "cn-fb-f");
      var testo = t.el("span", { class: "cn-fb-tx" }), sotto = t.el("small", { class: "cn-fb-sotto" });
      var bRifai = tasto(t, "cn-fb-b", "📸 Foto", function () { apriCamerino(t, FB.cb); });
      var bFiltro = tasto(t, "cn-fb-b", "🎭 Filtro", function () { apriCamerino(t, FB.cb, true); });
      var tondo = t.el("span", { class: "cn-fb-w" }, [faccina]);
      var el = t.el("div", { class: "cn-fb" }, [t.el("div", { class: "cn-fb-riga" }, [tondo, t.el("span", { class: "cn-fb-col" }, [testo, sotto]), bRifai, bFiltro])]);
      FB = { t: t, my: cb.myId, el: el, cb: cb, vm: vm, agg: function () {
        var v = FB.vm, ok = fotoOk(v), m = FT.mia, foto = !!(m && !m.av && m.cv), f0 = F.FILTRI[(m && m.x) | 0] || F.FILTRI[0];
        stile(); FB.el.style.display = FT.pronta ? "" : "none";
        var s = faccia(cb.myId, ""); if (s && faccina.getAttribute("src") !== s) faccina.src = s;
        var tx0, sot = "", puo = ok && !F.spente;
        if (F.spente) tx0 = "🙂 Stasera foto spente: si gioca con gli avatar";
        else if (!FT.key) tx0 = "📸 Le foto si vedono solo entrando dal link dell'host";
        else if (!ok) tx0 = "📸 Il tuo link è vecchio: le foto non si vedono";
        else if (foto) { tx0 = "📸 La tua faccia"; sot = f0.e + " " + f0.nome; }
        else tx0 = "🙂 Giochi con l'avatar";
        var cam = (v.cam || []).filter(function (id) { return id !== cb.myId; }).map(function (id) { return nomeVm(v, id); });
        if (cam.length) sot = (sot ? sot + " · " : "") + "📸 Si fanno la foto: " + cam.join(", ");
        tx(testo, tx0); tx(sotto, sot); sotto.style.display = sot ? "" : "none";
        tondo.style.display = puo || foto ? "" : "none";
        bRifai.style.display = puo ? "" : "none"; tx(bRifai, foto ? "📸 Rifai" : "📸 Foto");
        bFiltro.style.display = puo && foto ? "" : "none";
      } };
    }
    FB.cb = cb; FB.vm = vm; FB.agg();
    return FB.el;
  }
  // chi esce dal gioco (Esci, Cambia gioco, Sala…): le foto degli altri si buttano, e anche la mia
  var SCHERMI = [], GUARDIA = null, ASSENTE = 0;
  function mio(s) { if (s && SCHERMI.indexOf(s) < 0) { SCHERMI = SCHERMI.filter(function (x) { return document.body.contains(x); }); SCHERMI.push(s); } guardia(); return s; }
  function guardia() {
    if (GUARDIA) return;
    ASSENTE = 0;
    GUARDIA = setInterval(function () {
      if (SCHERMI.some(function (s) { return document.body.contains(s); })) { ASSENTE = 0; if (FT.vm && FT.cb) fotoVm(FT.t, FT.vm, FT.cb); return; }
      if (++ASSENTE >= 8) pulisciFoto(false, true);   // (8 secondi fuori: non è un cambio di schermata del core)
    }, 1000);
  }
  // anchemia: via anche la mia (Esci); fuori: uscito senza dirlo (Cambia gioco, Sala…): la mia resta mezz'ora in questa scheda, poi si butta
  function pulisciFoto(anchemia, fuori) {
    clearInterval(GUARDIA); GUARDIA = null; SCHERMI = [];
    var F = FX(); if (F) { F.chiudiCamerino(false); F.svuota(); F.spente = false; }
    if (anchemia) miaScrivi(null);
    else if (fuori) try { var o = JSON.parse(sessionStorage.getItem(SS_MIA) || "null"); if (o && !o.u) { o.u = Date.now(); sessionStorage.setItem(SS_MIA, JSON.stringify(o)); } } catch (e) {}
    FT = nuovoFT(); FB = null;
  }
  if (FX()) FX().onCambio = aggiornaFacce;

  // =========================================================
  //  I DISEGNI: tratti compressi e adesivi, una tavola fissa 750×1000
  //  dis = { s: [[colore, punta, "x,y,dx,dy,…"], …], a: [[emoji, x, y, scala×100, gradi], …] }
  // =========================================================
  function codTratto(pts) {   // pts = [x0, y0, x1, y1, …] interi
    var o = [pts[0], pts[1]];
    for (var i = 2; i < pts.length; i += 2) o.push(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    return o.join(",");
  }
  function decTratto(s) {
    var a = String(s || "").split(",").map(function (x) { return parseInt(x, 10) || 0; }), o = [];
    if (a.length < 2) return o;
    o.push(a[0], a[1]);
    for (var i = 2; i + 1 < a.length; i += 2) o.push(o[i - 2] + a[i], o[i - 1] + a[i + 1]);
    return o;
  }
  function disValido(d) {
    if (!d || typeof d !== "object") return null;
    var s = Array.isArray(d.s) ? d.s.filter(function (t) { return Array.isArray(t) && t.length === 3 && typeof t[2] === "string" && t[2].length < 20000; }).slice(0, 400) : [];
    var a = Array.isArray(d.a) ? d.a.filter(function (x) { return Array.isArray(x) && x.length === 5 && typeof x[0] === "string" && x[0].length <= 16; }).slice(0, MAX_ADESIVI) : [];
    return { s: s.map(function (t) { return [lim(t[0] | 0, 0, GOMMA), t[1] ? 1 : 0, t[2]]; }), a: a.map(function (x) { return [x[0], lim(x[1] | 0, -200, LW + 200), lim(x[2] | 0, -200, LH + 200), lim(x[3] | 0, 25, 600), (x[4] | 0) % 360]; }) };
  }
  function disVuoto(d) { return !d || (!(d.s && d.s.length) && !(d.a && d.a.length)); }
  // disegna i tratti di un disegno su un contesto (scala k = larghezza/750); la gomma cancella solo i tratti di questo strato
  function rendiTratti(c, d, k) {
    (d.s || []).forEach(function (t) {
      var p = decTratto(t[2]); if (p.length < 2) return;
      c.globalCompositeOperation = t[0] === GOMMA ? "destination-out" : "source-over";
      c.strokeStyle = t[0] === GOMMA ? "#000" : COLORI[t[0]] || "#000";
      c.lineWidth = PUNTE[t[1] ? 1 : 0] * (t[0] === GOMMA ? 2.2 : 1) * k; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); c.moveTo(p[0] * k, p[1] * k);
      if (p.length === 2) c.lineTo(p[0] * k + 0.1, p[1] * k);
      for (var i = 2; i < p.length; i += 2) c.lineTo(p[i] * k, p[i + 1] * k);
      c.stroke();
    });
    c.globalCompositeOperation = "source-over";
  }
  function rendiAdesivi(c, d, k) {
    (d.a || []).forEach(function (x) { ARTE().emoji && ARTE().emoji(c, x[0], x[1] * k, x[2] * k, 120 * (x[3] / 100) * k, (x[4] || 0) * Math.PI / 180); });
  }
  // un disegno intero (sfondo + strati) su un canvas w×h. sfondo = canvas/immagine o null (bianco)
  function rendiTutto(cv, sfondo, strati) {
    var c = cv.getContext("2d"), w = cv.width, h = cv.height, k = w / LW;
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h);
    if (sfondo) try { c.drawImage(sfondo, 0, 0, w, h); } catch (e) {}
    var tmp = document.createElement("canvas"); tmp.width = w; tmp.height = h;
    var tc = tmp.getContext("2d");
    (strati || []).forEach(function (d) {
      if (!d) return;
      tc.clearRect(0, 0, w, h); rendiTratti(tc, d, k);
      c.drawImage(tmp, 0, 0); rendiAdesivi(c, d, k);
    });
  }
  // lo sfondo della tavola: la scena del posto, il ritratto di chi è sotto torchio (grande, sul suo colore), o bianco.
  // cb(canvas) arriva quando l'immagine è pronta (il ritratto è un'immagine da caricare)
  var SFONDI = {};
  function sfondoTavola(su, idPosto, prot, nomeProt, cb) {
    var k = su + "|" + idPosto + "|" + prot + "|" + (OMINI[prot] ? JSON.stringify(OMINI[prot]).length : 0) + "|" + (su === "ritratto" && FX() && !FX().spente ? FX().ver(prot) : 0);
    if (SFONDI[k] && SFONDI[k].pronto) return cb(SFONDI[k].cv);
    if (SFONDI[k]) { SFONDI[k].attesa.push(cb); return; }
    var cv = document.createElement("canvas"); cv.width = LW / 2; cv.height = LH / 2;
    var c = cv.getContext("2d"), S = SFONDI[k] = { cv: cv, pronto: false, attesa: [cb] };
    function fatto() { S.pronto = true; S.attesa.forEach(function (f) { try { f(cv); } catch (e) {} }); S.attesa = []; }
    if (su === "scena") { try { c.drawImage(ARTE().scena(idPosto, LW / 2, LH / 2), 0, 0); } catch (e) {} return fatto(); }
    if (su !== "ritratto") { c.fillStyle = "#fffdf6"; c.fillRect(0, 0, cv.width, cv.height); return fatto(); }
    var g = c.createRadialGradient(cv.width / 2, cv.height * 0.4, 10, cv.width / 2, cv.height * 0.45, cv.height * 0.7);
    g.addColorStop(0, "#fff6d8"); g.addColorStop(1, "#ffc76b"); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
    var img = new Image();
    img.onload = function () { var w = cv.width * 0.98, h = w * 182 / 178; try { c.drawImage(img, (cv.width - w) / 2, cv.height - h, w, h); } catch (e) {} fatto(); };
    img.onerror = fatto;
    // con la foto: si aspetta un attimo il ritratto giusto (col costume), al massimo 3 secondi
    var o = { posto: idPosto }, p = { id: prot, nome: nomeProt, omino: OMINI[prot] || null }, prove = 0;
    (function carica() {
      if (FX() && !FX().pronta(prot, o, p) && ++prove < 30) return setTimeout(carica, 100);
      img.src = faccia(prot, nomeProt, o);
    })();
  }

  // =========================================================
  //  LE REGOLE DELL'HOST (sempre valide)
  // =========================================================
  function impNorm(i) {
    i = i || {};
    var tutti = posti().map(function (p) { return p.id; });
    var acc = Array.isArray(i.posti) ? i.posti.filter(function (x) { return tutti.indexOf(x) >= 0; }) : tutti.slice();
    if (acc.length < 3) acc = tutti.slice();
    var n = [3, 4, 5, 6, 7, 8, 10].indexOf(+i.nPosti) >= 0 ? +i.nPosti : 5;
    return { posti: acc, nPosti: Math.min(n, acc.length), nDom: [3, 4, 5].indexOf(+i.nDom) >= 0 ? +i.nDom : 4, tempi: TEMPI[i.tempi] ? i.tempi : "normali", foto: i.foto !== false };
  }
  // il ritmo dentro un posto: con 3 o 4 domande il Disegna c'è un posto sì e uno no (posti 1°, 3°, 5°…)
  function pianoDomande(nDom, iPosto) {
    var dis = iPosto % 2 === 0;
    if (nDom === 3) return ["i", "s", dis ? "d" : "i"];
    if (nDom === 4) return ["i", "c", "s", dis ? "d" : "i"];
    return ["i", "c", "s", "i", "d"];
  }
  function stimaMinuti(imp, n) {
    var T = TEMPI[imp.tempi] || TEMPI.normali, sec = n * 2 + 6, i;
    for (i = 0; i < imp.nPosti; i++) pianoDomande(imp.nDom, i).forEach(function (tp) {
      sec += tp === "i" ? T.sc + 12 : tp === "c" ? T.sc + 10 : tp === "s" ? T.scr * 0.75 + n * 2.4 + T_VOTA * 0.6 + 12 : T.dis * 0.85 + T_VOTAD * 0.6 + 12;
    });
    sec += imp.nPosti * 14 + 3 * T_PASSA + T_FVOTA + 40;
    return Math.max(10, Math.round(sec / 60));
  }

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    pulisciFoto(false);   // (una partita nuova: le foto di prima si buttano; la mia resta in questa scheda)
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, pid: null, imp: impNorm(t.impostazioni),
      players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0, jolly: 3 }],
      guarda: [],   // { id, nome, omino, tardi }: chi guarda (tardi = arrivato a partita cominciata: entra alla prossima)
      passo: null, t0: 0, dur: 0, scade: 0, grazia: 0, anim: 0, avanti: {},
      scaletta: [], iP: 0, piano: [], iD: 0, dom: null, item: null, usate: [],
      risp: {}, testi: {}, voci: null, disegni: {}, fatti: {}, gal: null, esito: null, classif: null, fin: null, premi: null, fine: null,
      stat: {}, titoli: {}, verdetti: {}, battute: {}, posPrima: {}, ultReaz: {},
      foto: {}, cam: {}, dati: {} };   // le foto (cifrate, solo in memoria: per rimandarle a chi rientra), chi è nel camerino
    var fotoAvviata = false;
    function avviaFoto() { if (fotoAvviata || !H.codice || H.codice === "…") return; fotoAvviata = true; fotoInizia(H.codice, true, "host", function () { bd(); }); }
    var VISTI = vistiMiei();      // le domande già uscite (questo telefono + profilo), più quelle che mandano gli amici
    var rete = null, tic = null;
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function attivi() { return H.players.filter(function (p) { return !p.via && !p.forse; }); }
    function inGuarda(id) { return H.guarda.some(function (x) { return x.id === id; }); }
    function nomeDi(id) { var p = pById(id); return p ? p.nome : "…"; }
    function st(id) { return H.stat[id] || (H.stat[id] = { magg: 0, scelte: 0, votiChi: 0, jollyOk: 0, ptJolly: 0, votiDis: 0, votiBat: 0 }); }
    function chiave(extra) { return H.pid + "|" + H.iP + "|" + H.iD + "|" + (extra || H.passo) + (H.passo === "passa" && H.fin && !extra ? "|" + H.fin.k : ""); }

    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.imp = impNorm(im); bd(); };

    rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); avviaFoto(); },
      onConnesso: function () { H.pronta = true; bd(true); },
      onErrore: function () {
        if (H.pronta) return;
        ferma(); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      onForse: function (id) { var p = pById(id); if (!p || p.forse) return; p.forse = true; bd(); controllaFatto(); },
      onTornato: function (id) { var p = pById(id); if (!p || !p.forse) return; p.forse = false; bd(); },
      onAddio: function (id) {
        if (inGuarda(id)) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
        var p = pById(id); if (!p) return;
        p.forse = false; delete H.cam[id];
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); delete H.foto[id]; bd(); return; }
        p.via = true;   // a partita iniziata resta in classifica, ma non gioca più (se torna, ritrova il suo posto)
        if (H.fase !== "gioco") return bd();
        if (presenti().length < 2) return fine();
        bd(); controllaFatto();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p = pById(id), nome = String(m.nome || "Amico").trim().slice(0, 16) || "Amico";
          // chi rientra (pagina ricaricata, telefono riacceso) ha lo STESSO id: ritrova il suo posto, i suoi punti e quello che aveva già mandato
          if (p) { p.forse = false; if (p.via && H.fase === "gioco") p.via = false; bd(true); privati(id); return; }
          if (inGuarda(id)) { bd(true); privati(id); return; }
          if (!t.puoSedersi(id, nome)) { H.guarda.push({ id: id, nome: nome, omino: avatarValido(m.omino) }); bd(true); return; }
          if (H.fase === "lobby" && H.players.length < MAX) { H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino), punti: 0, jolly: 3 }); bd(true); return; }
          // partita cominciata (o stanza piena): guarda ed entra alla prossima
          H.guarda.push({ id: id, nome: nome, omino: avatarValido(m.omino), tardi: H.fase !== "lobby" });
          bd(true); privati(id); return;
        }
        mossa(id, m);
      }
    });
    if (!rete) return senzaRete(t);

    // ----- la "foto" per tutti: SEMPRE con gli id e con "fase"; MAI le battute prima della vetrina né i disegni -----
    function resta() { return H.scade ? Math.max(0, Math.ceil((H.scade - H.grazia - Date.now()) / 1000)) : 0; }
    function vm(conOmini) {
      var om = conOmini || H.fase === "lobby";
      var v = { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, pid: H.pid, imp: H.imp,
        players: H.players.map(function (p) { var x = { id: p.id, nome: p.nome, punti: p.punti, jolly: p.jolly, via: !!p.via, forse: !!p.forse }; if (om) x.omino = p.omino || null; if (H.foto[p.id]) x.fo = foVm(p.id); return x; }),
        guarda: H.guarda.map(function (g) { var x = { id: g.id, nome: g.nome, tardi: !!g.tardi }; if (om) x.omino = g.omino || null; if (H.foto[g.id]) x.fo = foVm(g.id); return x; }) };
      // la foto: solo quale (numero e filtro) e l'impronta della chiave. MAI la foto (va a pezzi cifrati, fuori dalla vm)
      if (FT.kf) v.kf = FT.kf;
      var cam = Object.keys(H.cam); if (cam.length && H.fase === "lobby") v.cam = cam;
      if (H.fase === "gioco") {
        var sc = H.scaletta[H.iP] || {};
        Object.assign(v, { passo: H.passo, k: chiave(), resta: resta(), dur: H.dur, el: Date.now() - H.t0, anim: H.anim,
          iP: H.iP, nP: H.scaletta.length, iD: H.iD, nD: H.piano.length, posto: sc.posto || null, prot: sc.prot || null, scaletta: H.scaletta,
          dom: H.dom, risposto: Object.keys(H.fatti), avanti: Object.keys(H.avanti), serve: serveAvanti(),
          voci: H.voci ? H.voci.map(function (x) { return { k: x.k, tx: x.tx }; }) : null,
          nGal: H.gal ? H.gal.length : 0, kGal: H.gal ? H.kGal : null,
          esito: H.esito, classif: H.classif, premi: H.premi,
          fin: H.fin ? { K: H.fin.K, k: H.fin.k, bersagli: H.fin.fogli.map(function (f) { return { n: f.n, target: f.target, miss: f.miss }; }) } : null });
      }
      if (H.fase === "fine") v.fine = H.fine;
      return v;
    }
    function bd(conOmini) { var v = vm(conOmini); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); }
    function foVm(id) { var P = H.foto[id]; return { f: P.f, x: P.x, h: P.ok ? 1 : 0 }; }
    // ----- le foto: «ritratto» (quale foto e quale filtro), i pezzi cifrati, «dammiFoto» (chi non l'ha ricevuta), «cam» (nel camerino) -----
    function fotoMossa(id, m) {
      if (!pById(id) && !inGuarda(id)) return;
      if (m.t === "cam") { var c0 = !!H.cam[id]; if (m.on) H.cam[id] = 1; else delete H.cam[id]; if (c0 !== !!m.on && H.fase === "lobby") bd(); return; }
      if (m.t === "ritratto") {
        var f = typeof m.f === "string" && /^[a-z0-9]{4,16}$/.test(m.f) ? m.f : null, x = lim(m.x | 0, 0, 9), P = H.foto[id];
        if (!f) { if (P) { delete H.foto[id]; bd(); } return; }
        if (P && P.f === f) { if (P.x !== x) { P.x = x; bd(); } return; }
        H.foto[id] = { f: f, x: x, iv: null, di: 0, pz: {}, n: 0, ok: false };
        return bd();
      }
      if (m.t === "foto") {
        var Q = H.foto[id];
        if (!Q || !validoPezzo(m) || Q.f !== m.f || (Q.ok && Q.iv === m.iv)) return;   // (prima il «ritratto», poi i pezzi)
        if (Q.iv !== m.iv || Q.di !== (m.di | 0)) { Q.iv = m.iv; Q.di = m.di | 0; Q.pz = {}; Q.n = 0; Q.ok = false; }
        if (Q.pz[m.pz] == null) { Q.pz[m.pz] = m.c; Q.n++; }
        if (Q.n < Q.di) return;
        Q.ok = true;
        mandaFoto(null, id);   // a tutti (prima dei pezzi, poi la vm che dice che c'è)
        return bd();
      }
      if (m.t === "dammiFoto") {
        var chi = String(m.id || ""), kd = id + ">" + chi, ora = Date.now();
        if (ora - (H.dati[kd] || 0) < 3000) return;
        H.dati[kd] = ora; mandaFoto(id, chi);
      }
    }
    function mandaFoto(a, id) {
      var Q = H.foto[id]; if (!Q || !Q.ok) return;
      for (var i = 0; i < Q.di; i++) { var m = { t: "foto", id: id, f: Q.f, iv: Q.iv, pz: i, di: Q.di, c: Q.pz[i] }; if (a) privato(a, m); else veloce(m); }
    }
    function veloce(m) { rete.inviaVeloce(m); ricevi(t, m, cbHost); }
    function privato(id, m) { if (id === "host") { ricevi(t, m, cbHost); return; } m.to = id; rete.inviaVeloce(m); }
    function ferma() { if (tic) { clearInterval(tic); tic = null; } }
    function serveAvanti() { return Math.floor(attivi().length / 2) + 1; }

    // ----- a chi rientra: quello che aveva già mandato, la galleria, il foglio del finale -----
    function privati(id) {
      if (H.fase !== "gioco") return;
      var k = chiave();
      if ((H.passo === "scegli" || H.passo === "vota" || H.passo === "fvota") && H.risp[id]) privato(id, { t: "tua", k: k, x: H.risp[id].x, j: H.risp[id].j });
      if (H.passo === "scrivi" && H.testi[id] != null) privato(id, { t: "tua", k: k, tx: H.testi[id] });
      if ((H.passo === "disegna" || H.passo === "passa") && H.disegni[id]) privato(id, { t: "tua", k: k, dis: H.disegni[id], fine: !!H.fatti[id] });
      if (H.passo === "passa") mandaFoglio(id);
      if (H.passo === "vota" && H.voci) mandaMie(id);
      if (H.gal && (H.passo === "vota" || H.passo === "svela" || H.passo === "fvota" || H.passo === "fsvela" || H.passo === "premi")) mandaGalleria(id);
    }
    function mandaGalleria(id) {
      if (!H.gal) return;
      H.gal.forEach(function (g) {
        var m = { t: "gal", k: H.kGal, n: g.n, tot: H.gal.length, dis: g.dis || null, strati: g.strati || null, target: g.target || null, su: g.su || null };
        if (id) privato(id, m); else veloce(m);
      });
      var mieiDi = function (pid) { return H.gal.filter(function (g) { return g.a === pid || (g.autori && g.autori.indexOf(pid) >= 0); }).map(function (g) { return g.n; }); };
      (id ? [id] : H.players.map(function (p) { return p.id; })).forEach(function (pid) { privato(pid, { t: "mio", k: H.kGal, n: mieiDi(pid) }); });
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.fase = "gioco"; H.partita++; H.pid = nuovoId();
      H.players.forEach(function (p) { p.punti = 0; p.jolly = 3; });
      H.stat = {}; H.titoli = {}; H.verdetti = {}; H.battute = {}; H.usate = []; H.fine = null; H.premi = null; H.fin = null; H.gal = null; H.cam = {};
      H.scaletta = creaScaletta(); H.iP = 0; H.iD = 0; H.piano = [];
      if (!tic) tic = setInterval(orologio, 250);
      var n = presenti().length;
      vai("sfilata", n * (n <= 4 ? 2.6 : n <= 7 ? 2.1 : 1.7) + 3.4, { conOmini: true });
    }
    // i posti: tra quelli accesi, prima quelli che non si giocano da più tempo (mai lo stesso due volte); chi va sotto torchio: a giro giusto
    function creaScaletta() {
      var ult = leggiJ(LS_POSTI, {}), acc = mescola(H.imp.posti.slice());
      acc.sort(function (a, b) { return (ult[a] || 0) - (ult[b] || 0); });
      var scelti = acc.slice(0, H.imp.nPosti);
      // mescolati di nuovo tra quelli "vecchi uguali", così l'ordine non è sempre lo stesso
      scelti = mescola(scelti);
      var T = leggiJ(LS_TORCHIO, null), ora = Date.now();
      if (!T || !T.t || ora - T.t > 12 * 3600 * 1000) T = { t: ora, c: {} };
      var fila = mescola(presenti()).sort(function (a, b) {
        var A = T.c[a.nome] || { n: 0, u: 0 }, B = T.c[b.nome] || { n: 0, u: 0 };
        return A.n - B.n || A.u - B.u;
      });
      var out = scelti.map(function (pid, i) { return { posto: pid, prot: fila[i % fila.length].id }; });
      out.forEach(function (s, i) { var p = pById(s.prot); if (p) { var c = T.c[p.nome] || (T.c[p.nome] = { n: 0, u: 0 }); c.n++; c.u = ora + i; } });
      scriviJ(LS_TORCHIO, T);
      scelti.forEach(function (pid) { ult[pid] = ora; }); scriviJ(LS_POSTI, ult);
      return out;
    }
    function vai(passo, durata, o) {
      o = o || {};
      H.passo = passo; H.t0 = Date.now(); H.dur = durata || 0; H.grazia = o.grazia || 0;
      H.scade = durata ? H.t0 + durata * 1000 + H.grazia : 0; H.anim = o.anim || 0;
      H.avanti = {};
      if (o.pulisci !== false) { H.risp = {}; H.fatti = {}; }
      bd(!!o.conOmini);
    }
    function arrivo() {
      H.piano = pianoDomande(H.imp.nDom, H.iP); H.iD = 0; H.dom = null; H.esito = null; H.voci = null; H.gal = null; H.classif = null;
      H.posPrima = {}; H.players.forEach(function (p) { H.posPrima[p.id] = p.punti; });
      // chi doveva andare sotto torchio se n'è andato: ci va chi c'è stato meno volte in questa partita
      var pr0 = pById(H.scaletta[H.iP].prot);
      if (!pr0 || pr0.via) {
        var conta = function (id) { return H.scaletta.slice(0, H.iP).filter(function (s) { return s.prot === id; }).length; };
        var cand = presenti().slice().sort(function (a, b) { return conta(a.id) - conta(b.id); });
        if (cand.length) H.scaletta[H.iP].prot = cand[0].id;
      }
      var P = posto(H.scaletta[H.iP].posto), prot = pById(H.scaletta[H.iP].prot);
      H.dom = { tipo: "arrivo", q: accorda(caso((P && P.entrata) || ["Benvenuti!"]), prot ? prot.nome : "", prot ? eDonna(prot.omino) : null) };
      vai("arrivo", T_ARRIVO);
    }
    // pesca la domanda: prima quelle mai viste da nessuno, poi le viste meno di recente (a caso a parità)
    function pesca(P, tipo) {
      var campo = { i: "immagini", s: "scrivi", d: "disegna", c: "chi" }[tipo];
      var l = (P[campo] || []).filter(function (q) { return H.usate.indexOf(q.id) < 0; });
      if (!l.length) l = P[campo] || [];
      if (!l.length) return null;
      var min = Infinity; l.forEach(function (q) { var v = VISTI[q.id] || 0; if (v < min) min = v; });
      var buoni = l.filter(function (q) { return (VISTI[q.id] || 0) === min; });
      return caso(buoni);
    }
    function domanda() {
      var sc = H.scaletta[H.iP], P = posto(sc.posto), prot = pById(sc.prot), tipo = H.piano[H.iD];
      var it = pesca(P, tipo);
      if (!it && tipo !== "i") { tipo = "i"; it = pesca(P, "i"); }
      if (!it) return dopoDomanda();
      H.usate.push(it.id); H.item = it;
      var nomeP = prot ? prot.nome : "…", donna = prot ? eDonna(prot.omino) : null;
      var d = { id: it.id, tipo: tipo, q: accorda(it.q, nomeP, tipo === "c" ? null : donna) };
      if (tipo === "c") d.q = accorda(it.q, nomeP, null);
      if (tipo === "i") d.carte = (it.carte || []).slice(0, 4).map(function (c, j) {
        var x = { t: accorda(c.t, nomeP, donna) };
        if (c.e) x.e = String(c.e); else if (c.chi) { x.chi = c.chi; x.f = c.f || null; x.faccia = c.faccia || null; x.piu = c.piu || null; x.s = it.id + "#" + j; }
        else { x.lui = c.lui || "felice"; x.piu = c.piu || null; }
        return x;
      });
      if (tipo === "s") d.lui = it.voto === "lui";
      if (tipo === "d") { d.su = ["scena", "ritratto", "bianco"].indexOf(it.su) >= 0 ? it.su : "scena"; d.ad = spezzaEmoji(P.adesivi).concat(spezzaEmoji(it.adesivi || "")).filter(function (e, i, a) { return a.indexOf(e) === i; }).slice(0, 18); }
      if (tipo === "c") d.titolo = it.titolo;
      H.dom = d; H.esito = null; H.voci = null; H.gal = null; H.testi = {}; H.disegni = {};
      var T = TEMPI[H.imp.tempi] || TEMPI.normali;
      if (tipo === "i" || tipo === "c") vai("scegli", T.sc);
      else if (tipo === "s") vai("scrivi", T.scr, { grazia: 1500 });
      else vai("disegna", T.dis, { grazia: 2500 });
    }
    function dopoDomanda() {
      H.iD++;
      if (H.iD < H.piano.length) return domanda();
      // fine del posto: la classifica lampo
      var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      var prossimo = H.scaletta[H.iP + 1] || null;
      H.classif = { ord: ord.map(function (p) { return { id: p.id, punti: p.punti, prima: H.posPrima[p.id] || 0 }; }), prossimo: prossimo };
      H.dom = null; H.esito = null; H.voci = null; H.gal = null;
      vai("classifica", T_CLASS);
    }
    // mosse di tutti (anche dell'host, con id "host")
    function mossa(id, m) {
      if (m.t === "reaz") return reazione(id, m.e);
      if (m.t === "ritratto" || m.t === "foto" || m.t === "dammiFoto" || m.t === "cam") return fotoMossa(id, m);
      if (m.t === "visti") { if (typeof m.s === "string" && m.s.length < 20000) scompatta(m.s).forEach(function (q) { if (!VISTI[q]) VISTI[q] = 1; }); return; }
      var p = pById(id);
      if (H.fase !== "gioco" || !p || p.via) return;   // chi guarda soltanto non fa mosse
      if (m.k !== chiave()) { if (m.t === "dammi") privati(id); return; }   // mossa di un passo vecchio
      if (m.t === "dammi") return privati(id);
      if (m.t === "avanti") { if (RIEPILOGHI[H.passo]) { H.avanti[id] = 1; if (Object.keys(H.avanti).filter(function (x) { var q = pById(x); return q && !q.via; }).length >= serveAvanti()) return avanti(); bd(); } return; }
      if (m.t === "scelta" && (H.passo === "scegli" || H.passo === "vota" || H.passo === "fvota")) {
        if (H.risp[id]) return;
        var x = m.x;
        if (H.passo === "scegli") { if (H.dom.tipo === "i") { x = x | 0; if (x < 0 || x > 3) return; } else if (!pById(x)) return; }
        else if (H.passo === "vota") {
          var voce = H.voci ? H.voci.filter(function (v) { return v.k === x; })[0] : (H.gal || []).filter(function (g) { return g.n === x; })[0];
          if (!voce || voce.a === id) return;
        } else { var g = (H.gal || []).filter(function (q) { return q.n === x; })[0]; if (!g || g.autori.indexOf(id) >= 0) return; }
        var j = !!m.j && p.jolly > 0;
        if (j) p.jolly--;
        H.risp[id] = { x: x, j: j }; H.fatti[id] = 1;
        bd(); return controllaFatto();
      }
      if (m.t === "testo" && H.passo === "scrivi") {
        if (H.fatti[id]) return;
        var s = pulisci(m.tx, 40); if (!s) return;
        H.testi[id] = s; H.fatti[id] = 1; bd(); return controllaFatto();
      }
      if (m.t === "dis" && (H.passo === "disegna" || H.passo === "passa")) {
        if (H.fatti[id]) return;
        var d = disValido(m.dis); if (!d) return;
        if (JSON.stringify(d).length > 60000) return;
        H.disegni[id] = d;
        if (m.fine) { H.fatti[id] = 1; bd(); return controllaFatto(); }
        return;
      }
    }
    function reazione(id, e) {
      if (REAZ.indexOf(e) < 0 || (!pById(id) && !inGuarda(id))) return;
      var ora = Date.now(); if (ora - (H.ultReaz[id] || 0) < 900) return; H.ultReaz[id] = ora;
      veloce({ t: "reaz", id: id, e: e });
    }
    // chi deve rispondere adesso (presenti e collegati); quando hanno finito tutti si va avanti subito
    function devono() {
      var a = attivi();
      if (H.passo === "passa" && H.fin) return a.filter(function (p) { return H.fin.tiene[p.id] != null; });
      if (H.passo === "vota" && H.voci) return a.filter(function (p) { return H.voci.some(function (v) { return v.a !== p.id; }); });
      if (H.passo === "vota" && H.gal) return a.filter(function (p) { return H.gal.some(function (g) { return g.a !== p.id; }); });
      if (H.passo === "fvota" && H.gal) return a.filter(function (p) { return H.gal.some(function (g) { return g.autori.indexOf(p.id) < 0; }); });
      return a;
    }
    var tFatto = null;
    function controllaFatto() {
      if (H.fase !== "gioco" || !RISPOSTE[H.passo]) return;
      var d = devono();
      if (d.length && d.some(function (p) { return !H.fatti[p.id]; })) return;
      if (!d.length) return;   // nessuno collegato: aspetta il tempo
      var k = chiave(); clearTimeout(tFatto);
      tFatto = setTimeout(function () { if (chiave() === k) scaduto(); }, 700);   // un attimo: l'ultimo tocco si vede
    }
    var RISPOSTE = { scegli: 1, scrivi: 1, vota: 1, disegna: 1, passa: 1, fvota: 1 };
    var RIEPILOGHI = { sfilata: 1, arrivo: 1, svela: 1, classifica: 1, fintro: 1, fsvela: 1, premi: 1 };
    function scaduto() {
      H.scade = 0;
      var ps = H.passo;
      if (RIEPILOGHI[ps]) return avanti();
      if (ps === "scegli") return svelaScelta();
      if (ps === "scrivi") return vetrina();
      if (ps === "vetrina") return votaBattute();
      if (ps === "disegna") return galleria();
      if (ps === "vota") return svelaVoto();
      if (ps === "passa") return finePassaggio();
      if (ps === "fvota") return svelaFinale();
    }
    function avanti() {
      if (H.fase !== "gioco") return;
      var ps = H.passo; H.scade = 0;
      if (ps === "sfilata") return arrivo();
      if (ps === "arrivo") return domanda();
      if (ps === "svela") return dopoDomanda();
      if (ps === "classifica") { H.iP++; if (H.iP < H.scaletta.length) return arrivo(); return finaleIntro(); }
      if (ps === "fintro") return passaggio(1);
      if (ps === "fsvela") return titoli();
      if (ps === "premi") return fine();
    }
    function orologio() {
      if (H.fase !== "gioco" || !H.scade) return;
      if (Date.now() >= H.scade) scaduto();
    }

    // ----- 🖼️ Immagini e 👆 Chi di noi: lo svelamento -----
    function svelaScelta() {
      var tipo = H.dom.tipo, prot = H.scaletta[H.iP].prot;
      var E = punteggio(H.risp, function () { return 1; }, tipo);
      if (tipo === "i") {
        var top = E.vinc;
        if (top.length) {
          var c = H.dom.carte[caso(top)];
          E.verdetto = c.t;
          (H.verdetti[prot] || (H.verdetti[prot] = [])).push({ q: H.dom.q, t: c.t });
          var sc = H.risp[prot]; if (sc) E.lui = sc.x;
          if (sc && top.length === 1 && sc.x === top[0] && Object.keys(H.risp).length >= 3) E.sintonia = true;
          if (sc && Object.keys(H.risp).filter(function (x) { return H.risp[x].x === sc.x; }).length === 1 && Object.keys(H.risp).length >= 3) E.solo = true;
        }
      } else {
        // 👆 il più votato vince il titolo (a pari voti tutti e due)
        Object.keys(H.risp).forEach(function (v) { st(H.risp[v].x).votiChi++; });
        E.titolo = E.vinc.map(function (id) {
          var w = pById(id), ti = accorda(H.dom.titolo, w ? w.nome : "", w ? eDonna(w.omino) : null);
          (H.titoli[id] || (H.titoli[id] = [])).push({ t: ti, e: (posto(H.scaletta[H.iP].posto) || {}).emoji || "🏷️" });
          return { id: id, t: ti };
        });
      }
      E.voce = voce(E, prot);
      chiudi(E);
    }
    // i punti: 100 (o quanto dice peso) per ogni ALTRO che ha scelto come te; jolly ×2; TUTTI D'ACCORDO +100 a tutti
    function punteggio(risp, peso, tipo, molt) {
      molt = molt || 1;
      var ids = Object.keys(risp), conti = {}, E = { tipo: tipo, scelte: {}, jolly: [], guad: {}, bonus: {}, conti: {}, vinc: [] };
      ids.forEach(function (id) { var x = risp[id].x; E.scelte[id] = x; conti[x] = (conti[x] || 0) + peso(id); if (risp[id].j) E.jolly.push(id); });
      E.conti = conti;
      var max = 0; Object.keys(conti).forEach(function (x) { if (conti[x] > max) max = conti[x]; });
      E.vinc = max > 0 ? Object.keys(conti).filter(function (x) { return conti[x] === max; }).map(function (x) { return /^\d+$/.test(x) ? +x : x; }) : [];
      ids.forEach(function (id) {
        var x = risp[id].x, pt = 0;
        ids.forEach(function (o) { if (o !== id && risp[o].x === x) pt += 100 * molt * peso(o); });
        if (risp[id].j) { pt *= 2; if (pt > 0) { st(id).jollyOk++; st(id).ptJolly += pt / 2; } }
        E.guad[id] = pt;
        st(id).scelte++;
        if (E.vinc.length === 1 && String(E.vinc[0]) === String(x)) st(id).magg++;
      });
      var pres = presenti();
      var distinti = Object.keys(conti).length;
      if (ids.length >= (tipo === "i" || tipo === "c" ? 3 : 2) && distinti === 1) E.strisc = "tutti";
      else if (ids.length >= 3 && distinti === ids.length) E.strisc = "anarchia";
      var jx = {}; E.jolly.forEach(function (id) { var x = risp[id].x; jx[x] = (jx[x] || 0) + 1; });
      if (Object.keys(jx).some(function (x) { return jx[x] >= 3; })) E.full = true;
      E.pres = pres.length;
      return E;
    }
    // i punti in classifica, le statistiche, il passo "svela"
    function chiudi(E, durRiep) {
      if (E.strisc === "tutti" && E.tuttiOk !== false && Object.keys(E.scelte).length >= presenti().filter(function (p) { return !E.esclusi || E.esclusi.indexOf(p.id) < 0; }).length) {
        presenti().forEach(function (p) { E.bonus[p.id] = (E.bonus[p.id] || 0) + 100; });
        E.tuttiBonus = true;
      }
      Object.keys(E.guad).forEach(function (id) { var p = pById(id); if (p) p.punti += E.guad[id]; });
      Object.keys(E.bonus).forEach(function (id) { var p = pById(id); if (p) p.punti += E.bonus[id]; });
      var nV = Object.keys(E.scelte).length + (E.voci ? E.voci.length : 0);
      var A = E.vuoto ? 1.5 : 1.4 + 0.42 * Object.keys(E.scelte).length + (E.ordine ? 0.7 * E.ordine.length : 0) + 1.6;
      H.esito = E;
      vai("svela", A + (durRiep || T_RIEP), { anim: A, pulisci: false });
    }
    function voce(E, prot) {
      var q = null, P = pById(prot);
      if (E.vuoto) q = "vuoto"; else if (E.full) q = "jolly"; else if (E.strisc === "tutti") q = "tutti"; else if (E.strisc === "anarchia") q = "anarchia";
      else if (E.sintonia) q = "sintonia"; else if (E.solo) q = "solo";
      if (!q) return null;
      var l = comuni("voce").filter(function (v) { return v.quando === q; });
      return l.length ? accorda(caso(l).q, P ? P.nome : "", P ? eDonna(P.omino) : null) : null;
    }

    // ----- ✍️ Scrivi: vetrina, voto, svelamento -----
    function vetrina() {
      var entr = [];
      presenti().forEach(function (p) { if (H.testi[p.id]) entr.push({ tx: H.testi[p.id], a: p.id }); });
      var n = presenti().length, casa = n <= 3 ? 2 : n === 4 ? 1 : 0;
      casa = Math.max(casa, 4 - entr.length);
      mescola((H.item && H.item.riserve) || []).slice(0, Math.max(0, casa)).forEach(function (r) {
        var prot = pById(H.scaletta[H.iP].prot);
        entr.push({ tx: accorda(r, prot ? prot.nome : "", prot ? eDonna(prot.omino) : null), a: "casa" });
      });
      H.voci = mescola(entr).map(function (x, i) { x.k = i; return x; });
      var per = lim(15 / H.voci.length, 1.8, 3.2);
      H.dom.per = per;
      vai("vetrina", H.voci.length * per + 1.2, { anim: H.voci.length * per });
    }
    function votaBattute() { vai("vota", T_VOTA); presenti().forEach(function (p) { mandaMie(p.id); }); }
    // a ognuno, solo a lui: quali battute sono le sue (non si possono votare)
    function mandaMie(id) { if (H.voci) privato(id, { t: "mie", k: chiave(), n: H.voci.filter(function (v) { return v.a === id; }).map(function (v) { return v.k; }) }); }
    function svelaVoto() {
      var prot = H.scaletta[H.iP].prot, vociL = H.voci, galL = H.gal;
      var lista = vociL || galL || [];
      // nello Scrivi e nel Disegna il voto di chi è sotto torchio vale doppio
      var E = punteggio(H.risp, function (id) { return id === prot ? 2 : 1; }, H.dom.tipo);
      E.autori = {}; lista.forEach(function (v) { E.autori[vociL ? v.k : v.n] = v.a; });
      // +100 all'autore della battuta / del disegno più votato (a pari voti a tutti i pari; la casa non prende niente)
      E.vinc.forEach(function (x) {
        var a = E.autori[x];
        if (a && a !== "casa" && pById(a)) { E.bonus[a] = (E.bonus[a] || 0) + 100; E.premiato = (E.premiato || []).concat([a]); }
      });
      Object.keys(E.scelte).forEach(function (v) { var a = E.autori[E.scelte[v]]; if (a && a !== "casa") st(a)[vociL ? "votiBat" : "votiDis"]++; });
      if (E.vinc.some(function (x) { return E.autori[x] === "casa"; })) E.casa = true;
      if (vociL) {
        E.ordine = lista.map(function (v) { return v.k; }).sort(function (a, b) { return (E.conti[a] || 0) - (E.conti[b] || 0); });
        E.testi = {}; lista.forEach(function (v) { E.testi[v.k] = v.tx; });
        var best = E.vinc.length ? E.testi[E.vinc[0]] : null;
        if (best && E.autori[E.vinc[0]] !== "casa") (H.battute[prot] || (H.battute[prot] = [])).push(best);
      }
      // TUTTI D'ACCORDO: tutti quelli che potevano votarla l'hanno votata
      if (E.strisc === "tutti") { var x0 = Object.keys(E.conti)[0]; E.esclusi = [E.autori[x0]]; }
      E.voce = voce(E, prot);
      chiudi(E);
    }

    // ----- 🎨 Disegna: galleria -----
    function galleria() {
      var lista = [];
      presenti().forEach(function (p) { var d = H.disegni[p.id]; if (d && !disVuoto(d)) lista.push({ a: p.id, dis: d }); });
      H.fatti = {}; H.risp = {};
      if (!lista.length) {
        var E = { tipo: "d", vuoto: true, scelte: {}, jolly: [], guad: {}, bonus: {}, conti: {}, vinc: [] };
        E.voce = voce(E, H.scaletta[H.iP].prot) || "Nessuno ha avuto il coraggio di disegnare…";
        H.esito = E; return vai("svela", T_NESSUNO + 1.5, { anim: 1.5, pulisci: false });
      }
      H.gal = mescola(lista).map(function (g, i) { g.n = i; g.su = H.dom.su; return g; });
      H.kGal = chiave("g");
      vai("vota", T_VOTAD);
      mandaGalleria(null);
    }

    // ----- 🖼️ «Passa il ritratto!» -----
    function finaleIntro() {
      var pres = mescola(presenti()), n = pres.length, miss = mescola(comuni("missione").filter(function (m) { return H.usate.indexOf(m.id) < 0 && !VISTI[m.id]; }));
      if (miss.length < n) miss = miss.concat(mescola(comuni("missione")));
      var K = Math.max(1, Math.min(3, n - 1));
      H.fin = { K: K, k: 0, ordine: pres.map(function (p) { return p.id; }), tiene: {}, fogli: pres.map(function (p, j) {
        var m = miss[j] || { id: "x", q: "una star del cinema" };
        H.usate.push(m.id);
        return { n: j, target: p.id, miss: accorda(m.q, p.nome, eDonna(p.omino)), strati: [], autori: [] };
      }) };
      H.dom = { tipo: "f" }; H.esito = null; H.voci = null; H.gal = null; H.classif = null;
      vai("fintro", T_FINTRO);
    }
    function passaggio(k) {
      var F = H.fin, n = F.ordine.length;
      F.k = k; F.tiene = {}; H.disegni = {};
      F.fogli.forEach(function (f, j) { var chi = F.ordine[(j + k) % n]; F.tiene[chi] = j; });
      vai("passa", T_PASSA, { grazia: 2000 });
      Object.keys(F.tiene).forEach(function (id) { mandaFoglio(id); });
    }
    function mandaFoglio(id) {
      var F = H.fin; if (!F || F.tiene[id] == null) return;
      var f = F.fogli[F.tiene[id]];
      privato(id, { t: "foglio", k: chiave(), n: f.n, target: f.target, miss: f.miss, strati: f.strati.map(function (s) { return s.dis; }), pass: F.k, K: F.K });
    }
    function finePassaggio() {
      var F = H.fin;
      Object.keys(F.tiene).forEach(function (id) {
        var d = H.disegni[id], f = F.fogli[F.tiene[id]];
        if (d && !disVuoto(d)) { f.strati.push({ by: id, dis: d }); if (f.autori.indexOf(id) < 0) f.autori.push(id); }
      });
      if (F.k < F.K && presenti().length >= 2) return passaggio(F.k + 1);
      // la galleria dei ritratti trasformati
      H.gal = F.fogli.map(function (f) { return { n: f.n, a: null, autori: f.autori.slice(), target: f.target, miss: f.miss, strati: f.strati.map(function (s) { return s.dis; }), su: "ritratto" }; });
      H.kGal = chiave("fg"); H.fatti = {}; H.risp = {};
      vai("fvota", T_FVOTA);
      mandaGalleria(null);
    }
    function svelaFinale() {
      var E = punteggio(H.risp, function () { return 1; }, "f", 2);   // punti doppi
      E.autori = {}; H.gal.forEach(function (g) { E.autori[g.n] = g.autori; });
      E.vinc.forEach(function (x) { (E.autori[x] || []).forEach(function (a) { if (pById(a)) { E.bonus[a] = (E.bonus[a] || 0) + 200; } }); });
      E.tuttiOk = false;
      H.esito = E;
      chiudiFinale(E);
    }
    function chiudiFinale(E) {
      Object.keys(E.guad).forEach(function (id) { var p = pById(id); if (p) p.punti += E.guad[id]; });
      Object.keys(E.bonus).forEach(function (id) { var p = pById(id); if (p) p.punti += E.bonus[id]; });
      var A = 1.4 + 0.42 * Object.keys(E.scelte).length + 1.6;
      vai("fsvela", A + T_RIEP, { anim: A, pulisci: false });
    }
    // ----- i titoli della serata -----
    function titoli() {
      function migliori(k, min) {
        var max = min; presenti().forEach(function (p) { if (st(p.id)[k] > max) max = st(p.id)[k]; });
        return max > min ? presenti().filter(function (p) { return st(p.id)[k] === max; }).map(function (p) { return p.id; }) : [];
      }
      var on = [];
      var b = migliori("votiChi", 0); if (b.length) on.push({ e: "🎯", nome: "Il Bersaglio", ids: b, perche: punti0(st(b[0]).votiChi, "voto", "voti") + " nei «Chi di noi»" });
      var m = migliori("magg", 0); if (m.length) on.push({ e: "🧠", nome: "Mente del Gruppo", ids: m, perche: st(m[0]).magg + " volte con la maggioranza" });
      var c = migliori("jollyOk", 0); if (c.length) on.push({ e: "🃏", nome: "Il Cecchino", ids: c, perche: punti0(st(c[0]).jollyOk, "jolly andato", "jolly andati") + " a segno" });
      var ti = [];
      Object.keys(H.titoli).forEach(function (id) { if (pById(id)) H.titoli[id].forEach(function (x) { ti.push({ id: id, t: x.t, e: x.e }); }); });
      H.premi = { onori: on, titoli: ti.slice(0, 8) };
      H.dom = { tipo: "premi" }; H.esito = null; H.gal = H.gal;   // (la galleria del finale serve alle figurine)
      vai("premi", 4 + 1.3 * (on.length + Math.min(ti.length, 8)) + 6, { anim: 1 + 1.3 * (on.length + Math.min(ti.length, 8)) });
    }
    function punti0(n, uno, tanti) { return n + " " + (n === 1 ? uno : tanti); }
    function fine() {
      ferma(); clearTimeout(tFatto);
      H.scade = 0;
      var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      var cl = ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length, via: !!p.via }; });
      var fig = {};
      H.players.forEach(function (p) {
        var tt = (H.titoli[p.id] || []).map(function (x) { return x.e + " " + x.t; });
        ((H.premi && H.premi.onori) || []).forEach(function (o) { if (o.ids.indexOf(p.id) >= 0) tt.unshift(o.e + " " + o.nome); });
        var ver = H.verdetti[p.id] || [], bat = H.battute[p.id] || [];
        var f = H.fin ? H.fin.fogli.filter(function (x) { return x.target === p.id; })[0] : null;
        fig[p.id] = { titoli: tt.slice(0, 4), verdetto: ver.length ? caso(ver) : null, battuta: bat.length ? caso(bat) : null, foglio: f ? f.n : null };
      });
      H.fine = { classifica: cl, figurine: fig, ids: H.usate.slice(), kGal: H.fin ? H.kGal : null };
      H.fase = "fine"; H.passo = null;
      segnaVisti(H.usate.filter(function (x) { return /^[a-z]{3}-[a-z]\d+$/.test(x); }));
      H.usate.forEach(function (x) { VISTI[x] = oggi(); });
      bd(true);
      if (t.risultato) t.risultato(cl.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita" / Rivincita: stessa stanza, stessi amici (e stessi ritratti), tutti nella saletta; chi era arrivato tardi entra adesso
    function nuova() {
      if (H.fase !== "fine") return;
      ferma(); H.fase = "lobby"; H.passo = null; H.fine = null; H.scade = 0; H.fin = null; H.gal = null; H.esito = null; H.premi = null;
      H.players = presenti(); H.players.forEach(function (p) { p.punti = 0; p.jolly = 3; p.forse = false; });
      H.guarda = H.guarda.filter(function (g) {
        if (g.tardi && H.players.length < MAX && t.puoSedersi(g.id, g.nome)) { H.players.push({ id: g.id, nome: g.nome, omino: g.omino || null, punti: 0, jolly: 3 }); return false; }
        return true;
      });
      Object.keys(H.foto).forEach(function (id) { if (!pById(id) && !inGuarda(id)) delete H.foto[id]; });   // (le foto restano: chi è uscito no)
      bd(true);
    }
    t.onRivincita = nuova;

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova,
      invia: function (m) { mossa("host", m); },
      onEsci: function () {
        function via() { ferma(); rete.chiudi(); pulisciFoto(true); t.esci(); }
        // (dalla saletta il core ha già chiesto "Chiudere la stanza per tutti?")
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla Sala.", "Chiudi", via);
        via();
      } };
    bd(true);
    avviaFoto();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    pulisciFoto(false);
    var S = { rete: null, myId: null, nome: "", vm: null, vistiMandati: false };
    var cb = { sonoHost: false, myId: null,
      invia: function (m) { if (S.rete) S.rete.invia(m); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); pulisciFoto(true); t.esci(); }
        if (S.vm && S.vm.fase === "gioco") return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🫵", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(mio(s));
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) {
          S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) });
          if (!S.foto) { S.foto = true; fotoInizia(codice, false, id, function () { if (S.vm) disegna(t, S.vm, cb); }); }
        },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") {
            S.vm = m.vm;
            // le domande che ho già visto (telefono e profilo): all'host, una volta, così pesca quelle nuove
            if (!S.vistiMandati && m.vm.players && m.vm.players.some(function (p) { return p.id === S.myId; })) {
              S.vistiMandati = true;
              var v = Object.keys(vistiMiei()); if (v.length) S.rete.invia({ t: "visti", s: compatta(v) });
            }
            disegna(t, m.vm, cb);
          } else ricevi(t, m, cb);
        },
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "🫵", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(mio(s));
    }
  }

  // =========================================================
  //  I MESSAGGI VELOCI (uguali per host e ospiti): reazioni, galleria, foglio del finale, "la tua risposta"
  // =========================================================
  var GAL = { k: null, items: {}, tot: 0, mio: [] };
  var TUA = { k: null };
  var FOGLIO = { k: null };
  var MIE = { k: null, n: [] };
  function ricevi(t, m, cb) {
    if (m.t === "reaz") { if (U && U.t === t) volaReazione(U, m.id, m.e); return; }
    if (m.t === "foto") return fotoPezzo(m, cb);
    if (m.t === "gal") {
      if (GAL.k !== m.k) GAL = { k: m.k, items: {}, tot: m.tot || 0, mio: [] };
      GAL.tot = m.tot || GAL.tot;
      GAL.items[m.n] = { n: m.n, dis: disValido(m.dis), strati: Array.isArray(m.strati) ? m.strati.map(disValido) : null, target: m.target, su: m.su };
      if (U && U.cur && U.cur.galleria) U.cur.galleria();
      return;
    }
    if (m.t === "mio") { if (GAL.k !== m.k) GAL = { k: m.k, items: {}, tot: 0, mio: [] }; GAL.mio = m.n || []; if (U && U.cur && U.cur.galleria) U.cur.galleria(); return; }
    if (m.t === "mie") { MIE = { k: m.k, n: m.n || [] }; if (U && U.cur && U.cur.mie) U.cur.mie(); return; }
    if (m.t === "tua") { TUA = { k: m.k, x: m.x, j: m.j, tx: m.tx, dis: disValido(m.dis), fine: m.fine }; if (U && U.cur && U.cur.tua) U.cur.tua(); return; }
    if (m.t === "foglio") { FOGLIO = { k: m.k, n: m.n, target: m.target, miss: m.miss, strati: (m.strati || []).map(disValido), pass: m.pass, K: m.K }; if (U && U.cur && U.cur.foglio) U.cur.foglio(); return; }
  }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti): saletta, gioco, fine
  // =========================================================
  var U = null;    // la schermata di gioco: si costruisce UNA volta e poi si aggiorna a pezzi
  var FIN = null;  // la classifica finale già a schermo: le foto che arrivano dopo non la ridisegnano
  function disegna(t, vm, cb) {
    ricordaOmini(vm.players); ricordaOmini(vm.guarda);
    fotoVm(t, vm, cb);
    // si comincia mentre sono nel camerino: tengo la foto fatta (col filtro scelto), se no resto com'ero
    if (vm.fase !== "lobby" && FX() && FX().aperto()) FX().chiudiCamerino(true);
    if (vm.fase === "lobby") { chiudiU(); FIN = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      chiudiU();
      var kf = "fine|" + vm.partita + "|" + vm.pid;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: schermataFine(t, vm, cb) };
      return;
    }
    FIN = null;
    if (!U || U.t !== t || !document.body.contains(U.s)) { chiudiU(); U = creaSchermo(t, cb); }
    aggiorna(U, vm, cb);
  }
  function chiudiU() { if (U) { clearInterval(U.tic); (U.timeouts || []).forEach(clearTimeout); if (U.cur && U.cur.via) try { U.cur.via(); } catch (e) {} } U = null; }

  function lobby(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    var extra = [];
    var n = vm.players.length, imp = impNorm(vm.imp);
    extra.push(t.el("p", { class: "modulo-nota", text: "🫵 Uno alla volta sotto torchio, in " + imp.nPosti + " posti buffi. Si fanno punti votando come gli amici. Circa " + stimaMinuti(imp, Math.max(3, n)) + " minuti." }));
    if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    var fb = (dentro || guardo) ? boxFoto(t, vm, cb) : null;
    if (fb) extra.unshift(fb);
    mio(t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - n),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: extra,
      spettatore: guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && n >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci }));
    // la prima volta, prima di tutto: «📸 La tua faccia per stasera» (selfie, galleria o avatar), se si può
    if (!FT.chiesto && FT.pronta && (dentro || guardo) && fotoOk(vm) && imp.foto && !FT.mia && FX()) { FT.chiesto = true; apriCamerino(t, cb); }
  }

  // ---------- un tasto che risponde al primo tocco (pointerup) e vibra al tocco ----------
  function tasto(t, classe, testo, fn, nov) {
    var b = t.el("button", { class: "cn-btn " + (classe || ""), type: "button" }), giu = false;
    if (testo != null) b.textContent = testo;
    b.addEventListener("pointerdown", function (e) { if (b.disabled) return; giu = true; e.preventDefault(); });
    b.addEventListener("pointerup", function (e) { if (!giu || b.disabled) return; giu = false; e.preventDefault(); try { SG.audioCtx && SG.audioCtx(); } catch (_) {} if (!nov) vibra(10); fn(e); });
    b.addEventListener("pointercancel", function () { giu = false; });
    b.addEventListener("pointerleave", function () { giu = false; });
    b.addEventListener("click", function (e) { if (e.detail === 0 && !b.disabled) fn(e); });
    return b;
  }
  function img(t, src, classe) { var i = t.el("img", { class: classe || "", alt: "", draggable: "false" }); if (src) i.src = src; return i; }
  function miniFaccia(t, id, nome, classe) {
    var w = t.el("span", { class: "cn-mini " + (classe || "") }, [imgF(t, id, nome)]);
    w.title = nome || ""; w._id = id;
    return w;
  }
  function giocatore(vm, id) { var l = (vm.players || []).concat(vm.guarda || []); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function nomeVm(vm, id) { var p = giocatore(vm, id); return p ? p.nome : "…"; }
  function tuONome(vm, id, myId) { return id === myId ? "Tu" : nomeVm(vm, id); }

  // =========================================================
  //  LA SCHERMATA DI GIOCO (cornice fissa + palco che cambia a ogni passo)
  // =========================================================
  function creaSchermo(t, cb) {
    stile();
    var s = t.schermata({}); s.classList.add("cn-piena");
    var el = t.el;
    var u = { t: t, s: s, cb: cb, k: null, cur: null, vm: null, guardo: false, scade: 0, dur: 1, ultTic: -1, faces: {} };
    u.root = el("div", { class: "cn" });
    // la barra in alto: ‹ · posto e domanda · tempo · jolly · 🏆
    u.esci = el("button", { class: "cn-esci", type: "button", "aria-label": "Esci", text: "‹", onclick: function () { cb.onEsci(); } });
    u.dove = el("div", { class: "cn-dove" });
    u.timer = el("div", { class: "cn-timer spento" });
    u.timer.innerHTML = "<svg viewBox='0 0 36 36'><circle cx='18' cy='18' r='15.5' class='f'/><circle cx='18' cy='18' r='15.5' class='p'/></svg><b></b>";
    u.timerP = u.timer.querySelector(".p"); u.timerN = u.timer.querySelector("b");
    u.jolly = el("div", { class: "cn-jtappi", title: "I tuoi jolly" });
    u.coppa = el("button", { class: "cn-coppa", type: "button", "aria-label": "Classifica", text: "🏆", onclick: function () { apriClassifica(u); } });
    u.barra = el("div", { class: "cn-barra" }, [u.esci, u.dove, u.timer, u.jolly, u.coppa]);
    u.palco = el("div", { class: "cn-palco" });
    // in fondo: chi ha risposto (avatar grigi finché non rispondono) e le reazioni volanti
    u.chi = el("div", { class: "cn-chi" });
    u.reaz = el("div", { class: "cn-reaz" });
    REAZ.forEach(function (e) {
      var b = el("button", { class: "cn-rz", type: "button", text: e, "aria-label": "Reazione " + e });
      b.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        var ora = Date.now(); if (ora - (u.ultReaz || 0) < 1000) return; u.ultReaz = ora;
        b.classList.remove("boing"); void b.offsetWidth; b.classList.add("boing");
        cb.invia({ t: "reaz", e: e });
      });
      u.reaz.appendChild(b);
    });
    u.fondo = el("div", { class: "cn-fondo" }, [u.chi, u.reaz]);
    u.volo = el("div", { class: "cn-volo" });
    u.velo = el("div", { class: "cn-velo" });
    u.root.appendChild(u.barra); u.root.appendChild(u.palco); u.root.appendChild(u.fondo); u.root.appendChild(u.volo); u.root.appendChild(u.velo);
    s._contenuto.appendChild(u.root);
    t.mostra(mio(s));
    u.tic = setInterval(function () { orologioUI(u); }, 200);
    return u;
  }
  function orologioUI(u) {
    if (!u.vm) return;
    var resta = u.scade ? Math.max(0, u.scade - Date.now()) : 0, s = Math.ceil(resta / 1000);
    var conTimer = RISP_UI[u.vm.passo];
    if (!conTimer || !u.scade) { if (!u.timer.classList.contains("spento")) { u.timer.classList.add("spento"); tx(u.timerN, ""); } }
    else {
      u.timer.classList.remove("spento");
      tx(u.timerN, String(s));
      u.timerP.style.strokeDashoffset = (97.4 * (1 - lim(resta / (u.dur * 1000), 0, 1))).toFixed(1);
      u.timer.classList.toggle("rosso", s <= 5);
      var fatto = (u.vm.risposto || []).indexOf(u.cb.myId) >= 0;
      if (!u.guardo && !fatto && s <= 5 && s > 0 && u.ultTic !== s) { u.ultTic = s; suono("tic"); }
    }
    if (u.cur && u.cur.tic) try { u.cur.tic(resta); } catch (e) {}
  }
  var RISP_UI = { scegli: 1, scrivi: 1, vota: 1, disegna: 1, passa: 1, fvota: 1 };

  function aggiorna(u, vm, cb) {
    u.vm = vm;
    var io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    u.io = io; u.guardo = !io || io.via;
    u.root.classList.toggle("guardo", u.guardo);
    // il tempo: i secondi che mancano (mai l'ora: gli orologi dei telefoni sono diversi)
    if (vm.k !== u.kTempo || Math.abs((u.scade - Date.now()) / 1000 - vm.resta) > 1.2) { u.kTempo = vm.k; u.scade = vm.resta ? Date.now() + vm.resta * 1000 : 0; u.dur = Math.max(1, vm.dur || 1); u.ultTic = -1; }
    // la barra
    var P = vm.posto ? posto(vm.posto) : null;
    var dove = vm.passo === "sfilata" ? "🎬 Stasera giocano…" : vm.passo === "classifica" ? "🏆 Classifica" :
      FINALE[vm.passo] ? "🎨 Gran finale" : vm.passo === "premi" ? "🏅 I titoli" :
      P ? (P.emoji + " " + nomeCorto(P) + (vm.passo === "arrivo" ? "" : " · " + (vm.iD + 1) + "/" + vm.nD)) : "";
    tx(u.dove, (u.guardo ? "👀 " : "") + dove);
    var nj = io ? io.jolly : 0;
    if (u.nJolly !== nj) { u.nJolly = nj; svuota(u.jolly); for (var i = 0; i < 3; i++) u.jolly.appendChild(u.t.el("i", { class: i < nj ? "su" : "", text: "🃏" })); }
    u.jolly.style.visibility = u.guardo ? "hidden" : "";
    // il palco: si ricostruisce solo quando cambia il passo (chiave), poi si aggiorna a pezzi
    var k = vm.k + "|" + (u.guardo ? "g" : "p");
    if (k !== u.k) {
      if (u.cur && u.cur.via) try { u.cur.via(); } catch (e) {}
      u.k = k; svuota(u.palco); u.root.classList.remove("scrive");
      u.t0 = Date.now() - (vm.el || 0);   // quando è cominciato questo passo (per le animazioni uguali su tutti i telefoni)
      (u.timeouts || []).forEach(clearTimeout); u.timeouts = [];
      u.dopo = function (ms, fn) { if (ms <= 0) { fn(); return; } u.timeouts.push(setTimeout(fn, ms)); };
      var B = PASSI[vm.passo] || passoVuoto;
      u.cur = B(u, vm) || {};
      if (u.cur.el) { u.cur.el.classList.add("cn-entra"); u.palco.appendChild(u.cur.el); }
      chiudiVelo(u);
    }
    if (u.cur && u.cur.agg) u.cur.agg(vm);
    aggFondo(u, vm);
    if (u.classOpen) riempiClassifica(u);
  }
  var FINALE = { fintro: 1, passa: 1, fvota: 1, fsvela: 1 };
  // in fondo: chi ha risposto (nei passi in cui si risponde), altrimenti tutti con i punti
  function aggFondo(u, vm) {
    var rispondo = RISP_UI[vm.passo], risp = vm.risposto || [], visti = {};
    vm.players.forEach(function (p) {
      if (p.via) return;
      visti[p.id] = 1;
      var f = u.faces[p.id];
      if (!f) { f = u.faces[p.id] = miniFaccia(u.t, p.id, p.nome); u.chi.appendChild(f); }
      f.classList.toggle("ok", !rispondo || risp.indexOf(p.id) >= 0);
      f.classList.toggle("forse", !!p.forse);
      f.classList.toggle("tu", p.id === u.cb.myId);
    });
    Object.keys(u.faces).forEach(function (id) { if (!visti[id]) { var f = u.faces[id]; if (f.parentNode) f.parentNode.removeChild(f); delete u.faces[id]; } });
  }
  function volaReazione(u, id, e) {
    var p = giocatore(u.vm || { players: [] }, id), n = u.t.el("div", { class: "cn-vola" + (e === "🍅" ? " pomodoro" : "") }, [u.t.el("span", { class: "e", text: e }), imgF(u.t, id, p ? p.nome : "", {}, "f")]);
    n.style.left = (12 + Math.random() * 70) + "%";
    n.style.setProperty("--dx", ((Math.random() - 0.5) * 80).toFixed(0) + "px");
    u.volo.appendChild(n);
    suono("pop");
    setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 2600);
  }
  // 🏆 la classifica, sempre a portata (un velo sopra il gioco)
  function apriClassifica(u) {
    if (u.classOpen) return chiudiVelo(u);
    u.classOpen = true; u.velo.classList.add("su"); riempiClassifica(u);
  }
  function chiudiVelo(u) { u.classOpen = false; u.velo.classList.remove("su"); svuota(u.velo); }
  function riempiClassifica(u) {
    var vm = u.vm, t = u.t; svuota(u.velo);
    var ord = vm.players.slice().sort(function (a, b) { return b.punti - a.punti; });
    var box = t.el("div", { class: "cn-class-box" }, [t.el("div", { class: "cn-class-tit", text: "🏆 Classifica" })]);
    var ol = t.el("div", { class: "cn-class" + (ord.length > 6 ? " due" : "") });
    ord.forEach(function (p) {
      var pos = 1 + ord.filter(function (q) { return q.punti > p.punti; }).length;
      ol.appendChild(t.el("div", { class: "cn-riga" + (p.id === u.cb.myId ? " tu" : "") + (p.via ? " via" : "") }, [
        t.el("b", { text: pos + "°" }), miniFaccia(t, p.id, p.nome), t.el("span", { class: "n", text: p.id === u.cb.myId ? "Tu" : p.nome }), t.el("span", { class: "pt", text: fmtN(p.punti) })]));
    });
    box.appendChild(ol);
    box.appendChild(tasto(t, "chiaro", "Chiudi", function () { chiudiVelo(u); }));
    u.velo.appendChild(box);
  }

  // ---------- pezzi comuni dei passi ----------
  // la carta della domanda: si rimpicciolisce da sola se è lunga
  function cartaDomanda(t, testo, extra) {
    var c = t.el("div", { class: "cn-domanda" });
    var q = t.el("div", { class: "q" }); q.textContent = testo;
    var L = String(testo || "").length;
    q.style.fontSize = (L > 100 ? 15 : L > 75 ? 16.5 : L > 50 ? 18 : 20) + "px";
    c.appendChild(q);
    if (extra) c.appendChild(t.el("div", { class: "x", text: extra }));
    return c;
  }
  // la striscia della scena col protagonista vestito per il posto
  function strisciaScena(t, vm) {
    var P = posto(vm.posto), w = t.el("div", { class: "cn-striscia" });
    var bg = img(t, ARTE().scenaSrc ? ARTE().scenaSrc(vm.posto, 480, 200) : "", "bg");
    w.appendChild(bg);
    w.appendChild(imgF(t, vm.prot, nomeVm(vm, vm.prot), { posto: vm.posto }, "prot"));
    w.appendChild(t.el("div", { class: "cn-sotto" }, [t.el("small", { text: "Sotto torchio" }), t.el("b", { text: maiuscolo(nomeVm(vm, vm.prot)) })]));
    if (P) w.appendChild(t.el("span", { class: "cn-em", text: P.emoji }));
    return w;
  }
  // la riga dei tasti: jolly + invio
  function rigaAzione(u, testoInvio, onInvio) {
    var t = u.t, R = { j: false };
    R.bJ = tasto(t, "jolly", "🃏 Jolly ×2", function () {
      if (!u.io || u.io.jolly <= 0) return;
      R.j = !R.j; R.bJ.classList.toggle("on", R.j); suono(R.j ? "boing" : "pop");
    });
    R.bInv = tasto(t, "vai", testoInvio, function () { onInvio(R.j); });
    R.el = t.el("div", { class: "cn-azione" }, [R.bJ, R.bInv]);
    R.agg = function (pronto, inviato) {
      R.bInv.disabled = !pronto || inviato;
      R.bJ.disabled = inviato || !u.io || u.io.jolly <= 0 && !R.j;
      R.el.classList.toggle("inviato", !!inviato);
    };
    if (u.guardo) R.el.style.visibility = "hidden";
    return R;
  }
  // in fondo ai riepiloghi: il conto alla rovescia (t.contoAvanti) e «⏩ Avanti» (se lo tocca più di metà si parte subito)
  function rigaAvanti(u, vm) {
    var t = u.t, R = {};
    R.conto = t.el("span", { class: "cn-conto" });
    R.b = tasto(t, "avanti", "⏩ Avanti", function () {
      if (R.toccato || u.guardo) return; R.toccato = true; R.b.classList.add("on");
      u.cb.invia({ t: "avanti", k: vm.k });
    });
    R.el = t.el("div", { class: "cn-riga-avanti" }, [R.conto, R.b]);
    if (u.guardo) R.b.style.display = "none";
    t.contoAvanti(R.conto, vm.resta || 1, null, "cn|" + vm.k);
    R.agg = function (v) {
      var n = (v.avanti || []).length;
      tx(R.b, (R.toccato ? "✓ " : "⏩ ") + "Avanti" + (n ? " " + n + "/" + v.serve : ""));
    };
    R.agg(vm);
    return R;
  }
  function passoVuoto(u) { return { el: u.t.el("div", { class: "cn-centro" }, [u.t.el("p", { text: "…" })]) }; }
  function trascorso(u) { return Date.now() - u.t0; }   // ms da quando è cominciato il passo

  // =========================================================
  //  I PASSI (ognuno costruisce il suo palco una volta e poi si aggiorna)
  // =========================================================
  var PASSI = {};

  // ----- 🎬 la sfilata dei giocatori, poi «Pronti a giocare…» 3-2-1 -----
  PASSI.sfilata = function (u, vm) {
    var t = u.t, gente = vm.players.filter(function (p) { return !p.via; }), n = gente.length;
    var per = Math.max(1.2, ((vm.dur || 10) - 3.4) / Math.max(1, n));
    var cornice = t.el("div", { class: "cn-sf-cornice" }), foto = img(t, "", "cn-sf-foto"), nome = t.el("div", { class: "cn-sf-nome" });
    var piccoli = t.el("div", { class: "cn-sf-fila" });
    gente.forEach(function (p) { var m = miniFaccia(t, p.id, p.nome); m._pid = p.id; piccoli.appendChild(m); });
    var pronti = t.el("div", { class: "cn-sf-pronti" }), av = rigaAvanti(u, vm);
    var el = t.el("div", { class: "cn-sf" }, [t.el("div", { class: "cn-sf-tit", text: "Stasera giocano…" }), t.el("div", { class: "cn-sf-palco" }, [cornice, nome]), pronti, piccoli, av.el]);
    cornice.appendChild(foto);
    var ultimo = -2;
    function tic() {
      var s = trascorso(u) / 1000, i = Math.floor(s / per);
      if (i < n) {
        if (i === ultimo) return; ultimo = i;
        var p = gente[i];
        foto.src = faccia(p.id, p.nome); foto._cnf = { id: p.id, nome: p.nome, o: {} }; tx(nome, maiuscolo(p.id === u.cb.myId ? p.nome + " (tu)" : p.nome));
        cornice.classList.remove("su"); nome.classList.remove("su"); void cornice.offsetWidth; cornice.classList.add("su"); nome.classList.add("su");
        [].forEach.call(piccoli.children, function (m, j) { m.classList.toggle("ok", j <= i); });
        suono("sfilata");
        pronti.classList.remove("su");
      } else {
        var c = Math.max(1, 3 - Math.floor(s - n * per));
        if (ultimo === n + c) return; ultimo = n + c;
        cornice.classList.remove("su"); nome.classList.remove("su");
        tx(pronti, "Pronti a giocare… " + c); pronti.classList.remove("su"); void pronti.offsetWidth; pronti.classList.add("su");
        [].forEach.call(piccoli.children, function (m) { m.classList.add("ok"); });
        suono("tic");
      }
    }
    tic();
    return { el: el, tic: tic, agg: function (v) { av.agg(v); } };
  };

  // ----- 🔒 l'arrivo nel posto: la scena, il protagonista col costume, la Voce -----
  PASSI.arrivo = function (u, vm) {
    var t = u.t, P = posto(vm.posto) || { emoji: "📍", nome: "" }, io = vm.prot === u.cb.myId;
    var av = rigaAvanti(u, vm);
    var scena = t.el("div", { class: "cn-arr-scena" }, [
      img(t, ARTE().scenaSrc ? ARTE().scenaSrc(vm.posto, 480, 640) : "", "bg"),
      imgF(t, vm.prot, nomeVm(vm, vm.prot), { posto: vm.posto, intero: true, faccia: "felice" }, "cn-arr-prot"),
      t.el("div", { class: "cn-arr-titolo" }, [t.el("span", { class: "e", text: P.emoji }), t.el("span", { text: P.nome })]),
      t.el("div", { class: "cn-arr-sotto" }, [t.el("small", { text: "Sotto torchio" }), t.el("b", { text: io ? "TU! 😱" : maiuscolo(nomeVm(vm, vm.prot)) })]),
      vm.dom && vm.dom.q ? t.el("div", { class: "cn-arr-voce", text: "🎙️ " + vm.dom.q }) : null
    ]);
    var el = t.el("div", { class: "cn-arr" }, [scena, t.el("div", { class: "cn-arr-info", text: "Posto " + (vm.iP + 1) + " di " + vm.nP + " · " + vm.nD + " domande su " + (io ? "di te" : nomeVm(vm, vm.prot)) }), av.el]);
    if (trascorso(u) < 1500) { suono("arrivo"); if (io) vibra([30, 40, 30]); }
    return { el: el, agg: function (v) { av.agg(v); } };
  };

  // la figura di una carta-immagine: cose (emoji), personaggi pronti (avatar vestiti), o lui stesso con la faccia (e la faccina che la dice)
  function figCarta(t, vm, c) {
    if (c.e) return t.el("div", { class: "fig em" + (spezzaEmoji(c.e).length > 1 ? " due" : ""), text: c.e });
    if (c.chi) return t.el("div", { class: "fig" }, [img(t, ARTE().persona ? ARTE().persona(c, c.s) : "")]);
    return t.el("div", { class: "fig" }, [imgF(t, vm.prot, nomeVm(vm, vm.prot), { posto: vm.posto, faccia: c.lui, piu: c.piu }),
      t.el("span", { class: "smorfia", text: (ARTE().FACCE_EMOJI || {})[c.lui] || "" })]);
  }

  // ----- 🖼️ Immagini / 👆 Chi di noi: scegli -----
  PASSI.scegli = function (u, vm) {
    var t = u.t, d = vm.dom || {}, sel = null, inviato = false, el, scelte = [];
    var R = rigaAzione(u, "Lancia ⬆", function (j) { lancia(j); });
    function lancia(j) {
      if (inviato || sel == null || u.guardo) return;
      inviato = true; suono("lancia");
      var c = scelte.filter(function (x) { return x._x === sel; })[0]; if (c) c.classList.add("lanciata");
      u.cb.invia({ t: "scelta", k: vm.k, x: sel, j: !!j });
      agg();
    }
    function scegli(x) {
      if (inviato || u.guardo) return;
      sel = x; vibra(12); suono("pop");
      scelte.forEach(function (c) { c.classList.toggle("sel", c._x === sel); });
      agg();
    }
    // (come nell'originale: trascinare la carta scelta verso l'alto la lancia)
    function tocco(c) {
      var y0 = null;
      c.addEventListener("pointerdown", function (e) { if (inviato || u.guardo) return; y0 = e.clientY; e.preventDefault(); });
      c.addEventListener("pointerup", function (e) {
        if (y0 == null) return; var dy = e.clientY - y0; y0 = null;
        if (sel !== c._x) scegli(c._x);
        if (dy < -45) lancia(R.j);
      });
      c.addEventListener("pointercancel", function () { y0 = null; });
    }
    if (d.tipo === "i") {
      var griglia = t.el("div", { class: "cn-carte" });
      (d.carte || []).forEach(function (c, i) {
        var fig = figCarta(t, vm, c);
        var b = t.el("div", { class: "cn-carta" + (c.lui ? " lui" : ""), role: "button" }, [fig, t.el("div", { class: "cap", text: c.t })]);
        b._x = i; tocco(b); scelte.push(b); griglia.appendChild(b);
      });
      el = t.el("div", { class: "cn-sc" }, [strisciaScena(t, vm), cartaDomanda(t, d.q), griglia, R.el]);
    } else {
      var volti = t.el("div", { class: "cn-volti n" + Math.min(10, vm.players.filter(function (p) { return !p.via; }).length) });
      vm.players.filter(function (p) { return !p.via; }).forEach(function (p) {
        var b = t.el("div", { class: "cn-volto", role: "button" }, [imgF(t, p.id, p.nome), t.el("span", { text: p.id === u.cb.myId ? "Tu" : p.nome })]);
        b._x = p.id; tocco(b); scelte.push(b); volti.appendChild(b);
      });
      el = t.el("div", { class: "cn-sc chi" }, [cartaDomanda(t, d.q, "👆 Tocca la faccia di un amico (anche la tua)"), volti, R.el]);
    }
    function agg() {
      R.agg(sel != null, inviato);
      el.classList.toggle("inviato", inviato);
    }
    function tua() {
      if (TUA.k !== vm.k || TUA.x == null) return;
      sel = TUA.x; inviato = true; scelte.forEach(function (c) { c.classList.toggle("sel", c._x === sel); });
      if (TUA.j) R.bJ.classList.add("on");
      agg();
    }
    tua(); agg();
    return { el: el, agg: function (v) { if (!inviato && (v.risposto || []).indexOf(u.cb.myId) >= 0) { inviato = true; agg(); } }, tua: tua };
  };

  // ----- ✍️ Scrivi -----
  PASSI.scrivi = function (u, vm) {
    var t = u.t, d = vm.dom || {}, inviato = false;
    var campo = t.el("textarea", { class: "cn-campo", maxlength: "40", rows: "2", placeholder: "Scrivi qui la tua battuta…", enterkeyhint: "send" });
    var conta = t.el("span", { class: "cn-conta", text: "0/40" });
    var fatto = t.el("div", { class: "cn-fatto" });
    var bMan = tasto(t, "vai", "Manda ⬆", function () { manda(); });
    var chiave = "cn-tx|" + vm.k;
    try { var bz = sessionStorage.getItem(chiave); if (bz) campo.value = bz; } catch (e) {}
    function manda() {
      var s = pulisci(campo.value, 40); if (!s || inviato || u.guardo) return;
      inviato = true; suono("lancia"); campo.blur();
      TUA = { k: vm.k, tx: s };
      u.cb.invia({ t: "testo", k: vm.k, tx: s });
      mostraFatto(s);
    }
    function mostraFatto(s) { inviato = true; tx(fatto, "✓ Mandata: «" + s + "»"); el.classList.add("inviato"); campo.disabled = true; bMan.disabled = true; }
    campo.addEventListener("input", function () {
      if (campo.value.length > 40) campo.value = campo.value.slice(0, 40);
      tx(conta, campo.value.length + "/40"); bMan.disabled = !campo.value.trim();
      try { sessionStorage.setItem(chiave, campo.value); } catch (e) {}
    });
    campo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); manda(); } });
    campo.addEventListener("focus", function () { u.root.classList.add("scrive"); setTimeout(function () { try { window.scrollTo(0, 0); } catch (e) {} }, 60); });
    campo.addEventListener("blur", function () { setTimeout(function () { if (document.activeElement !== campo) u.root.classList.remove("scrive"); }, 150); });
    bMan.disabled = !campo.value.trim(); tx(conta, campo.value.length + "/40");
    var el = t.el("div", { class: "cn-scr" }, [strisciaScena(t, vm), cartaDomanda(t, String(d.q || "").replace(/_{3,}/g, "______"), "✍️ Tutti scrivono una battuta (anche " + (vm.prot === u.cb.myId ? "tu" : nomeVm(vm, vm.prot)) + ")"),
      t.el("div", { class: "cn-scr-box" }, [campo, t.el("div", { class: "cn-scr-riga" }, [conta, bMan])]), fatto]);
    if (u.guardo) { campo.disabled = true; bMan.style.visibility = "hidden"; campo.placeholder = "👀 Gli altri stanno scrivendo…"; }
    function tua() { if (TUA.k === vm.k && TUA.tx) { campo.value = TUA.tx; mostraFatto(TUA.tx); } }
    tua();
    return { el: el, tua: tua, agg: function () {},
      tic: function (resta) { if (!inviato && !u.guardo && resta <= 300 && pulisci(campo.value)) manda(); } };   // allo scadere parte quello che hai scritto
  };

  // ----- 📜 la vetrina delle battute: una alla volta, senza nomi -----
  PASSI.vetrina = function (u, vm) {
    var t = u.t, voci = vm.voci || [], per = (vm.dom && vm.dom.per) || 2.5;
    var carta = t.el("div", { class: "cn-vt-carta" }), num = t.el("div", { class: "cn-vt-num" });
    var el = t.el("div", { class: "cn-vt" }, [cartaDomanda(t, String((vm.dom || {}).q || "").replace(/_{3,}/g, "______")), t.el("div", { class: "cn-vt-tit", text: "📜 Le vostre battute…" }), carta, num]);
    var ultimo = -1;
    function tic() {
      var i = Math.min(voci.length - 1, Math.floor(trascorso(u) / 1000 / per));
      if (i === ultimo || i < 0) return; ultimo = i;
      tx(carta, "«" + voci[i].tx + "»"); tx(num, (i + 1) + " di " + voci.length);
      carta.classList.remove("su"); void carta.offsetWidth; carta.classList.add("su"); suono("pop");
    }
    tic();
    return { el: el, tic: tic };
  };

  // ----- 🗳️ il voto: battute (Scrivi) o galleria (Disegna) -----
  PASSI.vota = function (u, vm) {
    if (!vm.voci) return passoGalleria(u, vm, false);
    var t = u.t, d = vm.dom || {}, sel = null, inviato = false, righe = [], io = u.cb.myId;
    var R = rigaAzione(u, "Vota ⬆", function (j) {
      if (inviato || sel == null || u.guardo) return; inviato = true; suono("lancia");
      u.cb.invia({ t: "scelta", k: vm.k, x: sel, j: !!j }); agg();
    });
    var mia = TUA.k && TUA.k.split("|").slice(0, 3).join("|") === vm.k.split("|").slice(0, 3).join("|") ? TUA.tx : null;
    function eMia(v) { return MIE.k === vm.k ? MIE.n.indexOf(v.k) >= 0 : (mia != null && v.tx === mia); }
    var lista = t.el("div", { class: "cn-voti n" + Math.min(12, (vm.voci || []).length) });
    (vm.voci || []).forEach(function (v) {
      var b = t.el("div", { class: "cn-voce", role: "button" }, [t.el("span", { text: "«" + v.tx + "»" }), t.el("i", { text: "la tua" })]);
      b._x = v.k; b._v = v;
      b.addEventListener("pointerup", function () { if (inviato || u.guardo || eMia(v)) return; sel = v.k; vibra(12); suono("pop"); righe.forEach(function (r) { r.classList.toggle("sel", r._x === sel); }); agg(); });
      righe.push(b); lista.appendChild(b);
    });
    function mie() { righe.forEach(function (r) { r.classList.toggle("mia", eMia(r._v)); }); }
    mie();
    var titolo = d.lui ? "Vota la più da " + maiuscolo(nomeVm(vm, vm.prot)) : "Vota la più divertente";
    var nota = vm.prot === io ? "👑 Il tuo voto vale doppio" : "Punti se voti come gli altri";
    var el = t.el("div", { class: "cn-vota" }, [t.el("div", { class: "cn-vota-tit" }, [t.el("b", { text: titolo }), t.el("small", { text: nota })]), lista, R.el]);
    function agg() { R.agg(sel != null, inviato); el.classList.toggle("inviato", inviato); }
    function tua() { if (TUA.k === vm.k && TUA.x != null) { sel = TUA.x; inviato = true; righe.forEach(function (r) { r.classList.toggle("sel", r._x === sel); }); agg(); } }
    tua(); agg();
    return { el: el, tua: tua, mie: mie, agg: function (v) { if (!inviato && (v.risposto || []).indexOf(io) >= 0) { inviato = true; agg(); } } };
  };
  PASSI.fvota = function (u, vm) { return passoGalleria(u, vm, true); };

  // la galleria dei disegni (voto del Disegna e del finale)
  function sfondoDi(vm, it, finale) {
    return function (cb) {
      if (finale) return sfondoTavola("ritratto", null, it.target, nomeVm(vm, it.target), cb);
      return sfondoTavola(it.su || (vm.dom || {}).su || "scena", vm.posto, vm.prot, nomeVm(vm, vm.prot), cb);
    };
  }
  function disegnaMini(cv, vm, it, finale) {
    sfondoDi(vm, it, finale)(function (bg) { rendiTutto(cv, bg, it.strati || [it.dis]); });
  }
  function passoGalleria(u, vm, finale) {
    var t = u.t, sel = null, inviato = false, celle = {}, io = u.cb.myId, n = vm.nGal || 0, chiesto = 0;
    var R = rigaAzione(u, "Vota ⬆", function (j) {
      if (inviato || sel == null || u.guardo) return; inviato = true; suono("lancia");
      u.cb.invia({ t: "scelta", k: vm.k, x: sel, j: !!j }); agg();
    });
    var gr = t.el("div", { class: "cn-gal" });
    var titolo = finale ? "Il ritratto più bello?" : "Il disegno più bello?";
    var nota = finale ? "Non puoi votare quelli a cui hai lavorato" : (vm.prot === io ? "👑 Il tuo voto vale doppio" : "Tocca per guardarlo da vicino");
    var el = t.el("div", { class: "cn-vota" }, [t.el("div", { class: "cn-vota-tit" }, [t.el("b", { text: titolo }), t.el("small", { text: nota })]), gr, R.el]);
    for (var i = 0; i < n; i++) (function (i) {
      var cv = t.el("canvas", { width: "240", height: "320" }), tag = t.el("i", { class: "tag" }), sotto = t.el("small", { class: "sotto" });
      var c = t.el("div", { class: "cn-cella vuota", role: "button" }, [cv, tag, sotto]);
      c._x = i; c._cv = cv; c._tag = tag; c._sotto = sotto;
      c.addEventListener("pointerup", function () { if (!GAL.items[i]) return; zoom(i); });
      celle[i] = c; gr.appendChild(c);
    })(i);
    function mia(i) { return (GAL.mio || []).indexOf(i) >= 0; }
    function galleria() {
      if (GAL.k !== vm.kGal) return;
      Object.keys(celle).forEach(function (k) {
        var c = celle[k], it = GAL.items[k];
        if (it && !c._fatto) { c._fatto = true; c.classList.remove("vuota"); disegnaMini(c._cv, vm, it, finale); }
        if (finale && it) tx(c._sotto, nomeVm(vm, it.target));
        c.classList.toggle("mia", mia(+k)); tx(c._tag, mia(+k) ? (finale ? "ci hai lavorato" : "il tuo") : "");
      });
      misura();
    }
    function zoom(i) {
      var it = GAL.items[i]; if (!it) return;
      var cv = t.el("canvas", { width: "600", height: "800", class: "cn-zoom-cv" });
      disegnaMini(cv, vm, it, finale);
      var puo = !inviato && !u.guardo && !mia(i);
      var box = t.el("div", { class: "cn-zoom" }, [cv,
        finale ? t.el("div", { class: "cn-zoom-miss", text: "Trasforma " + nomeVm(vm, it.target) + " in: " + (findBers(vm, i) || "") }) : null,
        t.el("div", { class: "cn-zoom-tasti" }, [
          puo ? tasto(t, "vai", "👍 Voto questo", function () { sel = i; vibra(12); suono("pop"); Object.keys(celle).forEach(function (k) { celle[k].classList.toggle("sel", +k === sel); }); agg(); chiudiVelo(u); }) : null,
          tasto(t, "chiaro", "Chiudi", function () { chiudiVelo(u); })])]);
      svuota(u.velo); u.velo.appendChild(box); u.velo.classList.add("su"); u.classOpen = false;
    }
    function misura() {
      var W = gr.clientWidth, Hh = gr.clientHeight; if (!W || !Hh || !n) return;
      var col = n <= 2 ? 2 : n <= 4 ? 2 : n <= 6 ? 3 : 4, rows = Math.ceil(n / col), gap = 8;
      var w = Math.min((W - gap * (col - 1)) / col, ((Hh - gap * (rows - 1)) / rows) * 0.75);
      gr.style.setProperty("--cw", Math.floor(w) + "px"); gr.style.setProperty("--col", col);
    }
    function agg() { R.agg(sel != null, inviato); el.classList.toggle("inviato", inviato); }
    function tua() { if (TUA.k === vm.k && TUA.x != null) { sel = TUA.x; inviato = true; Object.keys(celle).forEach(function (k) { celle[k].classList.toggle("sel", +k === sel); }); agg(); } }
    var ro = window.ResizeObserver ? new ResizeObserver(misura) : null; if (ro) ro.observe(gr);
    setTimeout(misura, 30);
    tua(); agg(); galleria();
    return { el: el, tua: tua, galleria: galleria,
      agg: function (v) { if (!inviato && (v.risposto || []).indexOf(io) >= 0) { inviato = true; agg(); } },
      tic: function () {   // un disegno che non è arrivato (rete lenta): lo richiedo
        misura();
        if (Object.keys(GAL.items).length >= n && GAL.k === vm.kGal) return;
        if (Date.now() - chiesto > 2500) { chiesto = Date.now(); u.cb.invia({ t: "dammi", k: vm.k }); }
      },
      via: function () { if (ro) ro.disconnect(); } };
  }
  function findBers(vm, n) { var b = vm.fin && vm.fin.bersagli ? vm.fin.bersagli.filter(function (x) { return x.n === n; })[0] : null; return b ? b.miss : ""; }

  // ----- 🎉 lo svelamento: i voti arrivano uno alla volta con le facce di chi ha votato, poi i punti -----
  var STRISCE = { tutti: "🎉 TUTTI D'ACCORDO! +100 a tutti", anarchia: "🌪️ ANARCHIA!" };
  // la parte comune: alla fine dell'animazione striscione, i miei punti, la Voce e le vibrazioni
  function finaleSvela(u, vm, box, E) {
    var t = u.t, io = u.cb.myId, mio = (E.guad || {})[io], bon = (E.bonus || {})[io] || 0, ho = E.scelte && E.scelte[io] != null;
    var str = t.el("div", { class: "cn-strisc" + (E.strisc ? " " + E.strisc : "") }), pt = t.el("div", { class: "cn-mioesito" }), vc = t.el("div", { class: "cn-voce-gioco" });
    box.appendChild(str); box.appendChild(pt); box.appendChild(vc);
    var resto = Math.max(0, (vm.anim || 0) * 1000 - trascorso(u)), tardi = resto <= 0;
    u.dopo(resto, function () {
      var s = E.strisc ? STRISCE[E.strisc] : E.full ? "🃏 FULL DI JOLLY!" : E.casa ? "🏠 Ha vinto la casa!" : "";
      if (E.strisc === "tutti" && !E.tuttiBonus) s = "🎉 TUTTI D'ACCORDO!";
      if (s) { tx(str, s); str.classList.add("su"); if (!tardi) suono(E.strisc === "tutti" ? "tutti" : "boing"); }
      if (!u.guardo && (ho || bon)) {
        var tot = (mio || 0) + bon, jj = (E.jolly || []).indexOf(io) >= 0;
        tx(pt, tot > 0 ? "+" + fmtN(tot) + (jj && mio > 0 ? "  🃏×2" : "") : "0 punti" + (jj ? " · 🃏 sprecato" : ""));
        pt.classList.add("su", tot > 0 ? "si" : "no");
        if (!tardi) { if (tot > 0 && (jj || tot >= 300)) { vibra([40, 60, 40]); suono("evviva"); } else if (tot > 0) suono("voto"); else { vibra(300); suono("zero"); } }
      }
      if (E.voce) { tx(vc, "🎙️ " + E.voce); vc.classList.add("su"); }
    });
  }
  // un mini avatar che "atterra" su una carta (o una battuta, un disegno)
  function atterra(u, dove, id, quando, mio, extra) {
    var m = miniFaccia(u.t, id, nomeVm(u.vm, id), "vola" + (extra || ""));
    m.style.opacity = "0";
    dove.appendChild(m);
    u.dopo(quando, function () { m.style.opacity = ""; m.classList.add("giu"); if (quando > 0) { suono("voto"); if (mio) vibra(8); } });
    return m;
  }
  PASSI.svela = function (u, vm) {
    var E = vm.esito || {}, t = u.t, d = vm.dom || {}, io = u.cb.myId;
    var av = rigaAvanti(u, vm), box, base = Math.max(0, -trascorso(u)), tardi = trascorso(u) > (vm.anim || 0) * 1000;
    function q(ms) { return tardi ? 0 : Math.max(0, ms - trascorso(u)); }
    var cur = 1000, mia = E.scelte ? E.scelte[io] : null;
    if (E.vuoto) {
      box = t.el("div", { class: "cn-svela vuoto" }, [t.el("div", { class: "cn-vuoto", text: "🫣" }), t.el("p", { text: E.voce || "Nessuno ha avuto il coraggio…" })]);
      box.appendChild(av.el);
      return { el: box, agg: function (v) { av.agg(v); } };
    }
    if (d.tipo === "i") {
      var gr = t.el("div", { class: "cn-carte piccole" }), carte = [];
      (d.carte || []).forEach(function (c, i) {
        var fig = figCarta(t, vm, c);
        var voti = t.el("div", { class: "voti" });
        var b = t.el("div", { class: "cn-carta" + (c.lui ? " lui" : "") + (i === mia ? " mia" : "") }, [fig, t.el("div", { class: "cap", text: c.t }), voti]);
        b._voti = voti; carte.push(b); gr.appendChild(b);
      });
      (d.carte || []).forEach(function (c, i) {
        Object.keys(E.scelte || {}).forEach(function (id) {
          if (E.scelte[id] !== i) return;
          atterra(u, carte[i]._voti, id, q(cur), mia === i, id === vm.prot ? " re" : (E.jolly || []).indexOf(id) >= 0 ? " jolly" : ""); cur += 420;
        });
      });
      u.dopo(q(cur), function () {
        (E.vinc || []).forEach(function (x) { if (carte[x]) carte[x].classList.add("vince"); });
        if (E.lui != null && carte[E.lui]) carte[E.lui].classList.add("dilui");
      });
      var ver = E.verdetto ? t.el("div", { class: "cn-verdetto" }, [t.el("small", { text: "Per voi, " + nomeVm(vm, vm.prot) + ":" }), t.el("b", { text: "«" + E.verdetto + "»" })]) : null;
      if (ver) { ver.style.opacity = "0"; u.dopo(q(cur), function () { ver.style.opacity = ""; ver.classList.add("su"); }); }
      box = t.el("div", { class: "cn-svela" }, [cartaDomanda(t, d.q), gr, ver]);
    } else if (d.tipo === "c") {
      var gente = vm.players.filter(function (p) { return !p.via; });
      var volti = t.el("div", { class: "cn-volti svela n" + Math.min(10, gente.length) }), celle = {};
      gente.forEach(function (p) {
        var voti = t.el("div", { class: "voti" });
        var c = t.el("div", { class: "cn-volto" + (p.id === mia ? " mia" : "") }, [imgF(t, p.id, p.nome), t.el("span", { text: p.id === io ? "Tu" : p.nome }), voti]);
        c._voti = voti; celle[p.id] = c; volti.appendChild(c);
      });
      Object.keys(E.scelte || {}).forEach(function (id) { var x = E.scelte[id]; if (!celle[x]) return; atterra(u, celle[x]._voti, id, q(cur), mia === x, (E.jolly || []).indexOf(id) >= 0 ? " jolly" : ""); cur += 420; });
      var tit = t.el("div", { class: "cn-verdetto titolo" });
      tit.style.opacity = "0";
      u.dopo(q(cur), function () {
        (E.vinc || []).forEach(function (x) { if (celle[x]) celle[x].classList.add("vince"); });
        if (E.titolo && E.titolo.length) {
          svuota(tit);
          tit.appendChild(t.el("small", { text: E.titolo.length > 1 ? "Il titolo va a tutti e due…" : "Il titolo va a…" }));
          tit.appendChild(t.el("b", { text: "🏷️ «" + E.titolo[0].t + "» → " + E.titolo.map(function (x) { return x.id === io ? "TE!" : nomeVm(vm, x.id); }).join(" e ") }));
          tit.style.opacity = ""; tit.classList.add("su");
          if (!tardi && E.titolo.some(function (x) { return x.id === io; })) vibra([30, 40, 30]);
        }
      });
      box = t.el("div", { class: "cn-svela" }, [cartaDomanda(t, d.q), volti, tit]);
    } else if (vm.voci) {
      // ✍️ dalla meno votata alla più votata, coi nomi di chi le ha scritte
      var lista = t.el("div", { class: "cn-voti svela n" + Math.min(12, vm.voci.length) }), ordine = E.ordine || vm.voci.map(function (v) { return v.k; });
      ordine.forEach(function (k, idx) {
        var a = (E.autori || {})[k], ultimo = idx === ordine.length - 1;
        var chi = a === "casa" ? t.el("span", { class: "aut casa", text: "🏠 della casa" }) : t.el("span", { class: "aut" }, [miniFaccia(t, a, nomeVm(vm, a)), t.el("b", { text: a === io ? "Tu" : nomeVm(vm, a) })]);
        var voti = t.el("div", { class: "voti" });
        var r = t.el("div", { class: "cn-voce rivela" + ((E.vinc || []).indexOf(k) >= 0 ? " vince" : "") + (mia === k ? " sel" : "") }, [t.el("span", { text: "«" + ((E.testi || {})[k] || "") + "»" }), chi, voti]);
        r.style.order = String(ordine.length - idx);   // la più votata in cima
        r.style.opacity = "0";
        u.dopo(q(cur), function () { r.style.opacity = ""; r.classList.add("su"); if (!tardi) suono(ultimo ? "evviva" : "pop"); });
        cur += 500;
        Object.keys(E.scelte || {}).forEach(function (id) { if (E.scelte[id] === k) { atterra(u, voti, id, q(cur), mia === k, id === vm.prot ? " re" : (E.jolly || []).indexOf(id) >= 0 ? " jolly" : ""); cur += 420; } });
        cur += 200;
      });
      var prem = t.el("div", { class: "cn-verdetto" }); prem.style.opacity = "0";
      u.dopo(q(cur), function () {
        if (E.premiato && E.premiato.length) { tx(prem, "🏆 Battuta del round: +100 a " + E.premiato.map(function (x) { return x === io ? "te" : nomeVm(vm, x); }).join(" e ")); prem.style.opacity = ""; prem.classList.add("su"); }
      });
      box = t.el("div", { class: "cn-svela" }, [t.el("div", { class: "cn-vota-tit" }, [t.el("b", { text: "Chi ha scritto cosa?" })]), lista, prem]);
    } else {
      // 🎨 la galleria con i voti e gli autori
      var g = passoGalleriaSvela(u, vm, E, false, q, cur);
      cur = g.cur; box = g.el;
    }
    finaleSvela(u, vm, box, E);
    box.appendChild(av.el);
    return { el: box, agg: function (v) { av.agg(v); }, galleria: box._galleria, tic: box._misura };
  };
  // la galleria svelata (Disegna e finale): autori sotto, voti sopra, il più votato in oro
  function passoGalleriaSvela(u, vm, E, finale, q, cur) {
    var t = u.t, io = u.cb.myId, n = vm.nGal || 0, celle = {}, mia = E.scelte ? E.scelte[io] : null;
    var gr = t.el("div", { class: "cn-gal svela" });
    for (var i = 0; i < n; i++) (function (i) {
      var cv = t.el("canvas", { width: "240", height: "320" }), voti = t.el("div", { class: "voti" });
      var aut = finale ? (E.autori || {})[i] || [] : [(E.autori || {})[i]];
      var nomi = finale ? nomeVm(vm, (GAL.items[i] || {}).target || findTarget(vm, i)) + (aut.length ? " · di " + aut.map(function (a) { return a === io ? "te" : nomeVm(vm, a); }).join(", ") : "")
        : (aut[0] === io ? "Tu" : nomeVm(vm, aut[0]));
      var c = t.el("div", { class: "cn-cella vuota" + (mia === i ? " sel" : "") }, [cv, voti, t.el("small", { class: "sotto", text: nomi })]);
      c._cv = cv; c._voti = voti; celle[i] = c; gr.appendChild(c);
    })(i);
    Object.keys(E.scelte || {}).forEach(function (id) { var x = E.scelte[id]; if (!celle[x]) return; atterra(u, celle[x]._voti, id, q(cur), mia === x, id === vm.prot && !finale ? " re" : (E.jolly || []).indexOf(id) >= 0 ? " jolly" : ""); cur += 420; });
    var prem = t.el("div", { class: "cn-verdetto" }); prem.style.opacity = "0";
    u.dopo(q(cur), function () {
      (E.vinc || []).forEach(function (x) { if (celle[x]) celle[x].classList.add("vince"); });
      var vinti = [];
      (E.vinc || []).forEach(function (x) { var a = (E.autori || {})[x]; (Array.isArray(a) ? a : [a]).forEach(function (y) { if (y && vinti.indexOf(y) < 0) vinti.push(y); }); });
      if (vinti.length) { tx(prem, (finale ? "🎨 Capolavoro finale: +200 a " : "🎨 Capolavoro del round: +100 a ") + vinti.map(function (x) { return x === io ? "te" : nomeVm(vm, x); }).join(", ")); prem.style.opacity = ""; prem.classList.add("su"); }
    });
    function galleria() {
      if (GAL.k !== vm.kGal) return;
      Object.keys(celle).forEach(function (k) { var c = celle[k], it = GAL.items[k]; if (it && !c._fatto) { c._fatto = true; c.classList.remove("vuota"); disegnaMini(c._cv, vm, it, finale); } });
    }
    function misura() {
      var W = gr.clientWidth, Hh = gr.clientHeight; if (!W || !Hh || !n) return;
      var col = n <= 4 ? 2 : n <= 6 ? 3 : 4, rows = Math.ceil(n / col), gap = 8;
      var w = Math.min((W - gap * (col - 1)) / col, ((Hh - gap * (rows - 1)) / rows) * 0.75);
      gr.style.setProperty("--cw", Math.floor(w) + "px"); gr.style.setProperty("--col", col);
    }
    setTimeout(misura, 30); setTimeout(misura, 300);
    if (window.ResizeObserver) { var ro = new ResizeObserver(misura); ro.observe(gr); }
    galleria();
    var el = t.el("div", { class: "cn-svela" }, [t.el("div", { class: "cn-vota-tit" }, [t.el("b", { text: finale ? "I ritratti trasformati" : "Chi ha disegnato cosa?" })]), gr, prem]);
    el._galleria = galleria; el._misura = misura;
    return { el: el, cur: cur };
  }
  function findTarget(vm, n) { var b = vm.fin && vm.fin.bersagli ? vm.fin.bersagli.filter(function (x) { return x.n === n; })[0] : null; return b ? b.target : null; }
  PASSI.fsvela = function (u, vm) {
    var E = vm.esito || {}, av = rigaAvanti(u, vm), tardi = trascorso(u) > (vm.anim || 0) * 1000;
    function q(ms) { return tardi ? 0 : Math.max(0, ms - trascorso(u)); }
    var g = passoGalleriaSvela(u, vm, E, true, q, 1000);
    finaleSvela(u, vm, g.el, E);
    g.el.appendChild(av.el);
    return { el: g.el, agg: function (v) { av.agg(v); }, galleria: g.el._galleria, tic: g.el._misura };
  };

  // ----- 🏆 la classifica lampo dopo ogni posto -----
  PASSI.classifica = function (u, vm) {
    var t = u.t, C = vm.classif || { ord: [] }, io = u.cb.myId, av = rigaAvanti(u, vm);
    var prima = C.ord.slice().sort(function (a, b) { return b.prima - a.prima; });
    function pos(l, id, k) { var me = l.filter(function (x) { return x.id === id; })[0]; return 1 + l.filter(function (x) { return x[k] > me[k]; }).length; }
    var lista = t.el("div", { class: "cn-class" + (C.ord.length > 5 ? " due" : "") });
    C.ord.forEach(function (r, i) {
      var p = giocatore(vm, r.id); if (!p) return;
      var a = pos(C.ord, r.id, "punti"), b = pos(prima, r.id, "prima"), d = r.punti - r.prima;
      var riga = t.el("div", { class: "cn-riga" + (r.id === io ? " tu" : "") + (p.via ? " via" : "") }, [
        t.el("b", { text: a + "°" }), miniFaccia(t, r.id, p.nome), t.el("span", { class: "n", text: r.id === io ? "Tu" : p.nome }),
        t.el("span", { class: "pt" }, [t.el("span", { text: fmtN(r.punti) }), d ? t.el("small", { text: " +" + fmtN(d) }) : null]),
        t.el("i", { class: "fr", text: a < b ? "▲" : a > b ? "▼" : "" })]);
      riga.style.animationDelay = (i * 80) + "ms";
      lista.appendChild(riga);
    });
    var pr = C.prossimo, P = pr ? posto(pr.posto) : null;
    var dopo = pr && P ? t.el("div", { class: "cn-prossima" }, [t.el("small", { text: "Prossima fermata" }), t.el("b", { text: P.emoji + " " + P.nome }),
      t.el("span", { class: "chi" }, [miniFaccia(t, pr.prot, nomeVm(vm, pr.prot)), t.el("span", { text: "Sotto torchio: " + (pr.prot === io ? "TU!" : maiuscolo(nomeVm(vm, pr.prot))) })])])
      : t.el("div", { class: "cn-prossima finale" }, [t.el("small", { text: "E adesso…" }), t.el("b", { text: "🎨 Il gran finale: «Passa il ritratto!»" })]);
    var el = t.el("div", { class: "cn-classif" }, [t.el("div", { class: "cn-vota-tit" }, [t.el("b", { text: "🏆 Classifica" }), t.el("small", { text: "dopo " + ((posto(vm.posto) || {}).emoji || "") + " " + String((posto(vm.posto) || { nome: "questo posto" }).nome).replace(/^\w/, function (c) { return c.toLowerCase(); }) })]), lista, dopo, av.el]);
    return { el: el, agg: function (v) { av.agg(v); } };
  };

  // ----- 🎨 il gran finale: presentazione -----
  PASSI.fintro = function (u, vm) {
    var t = u.t, av = rigaAvanti(u, vm), K = vm.fin ? vm.fin.K : 3;
    var el = t.el("div", { class: "cn-fin-intro" }, [
      t.el("div", { class: "cn-fin-gran", text: "🎨" }),
      t.el("h2", { text: "Gran finale: «Passa il ritratto!»" }),
      t.el("p", { text: "Ognuno riceve la faccia di un amico con una missione. Ci aggiungi qualcosa, poi passa al telefono dopo: " + K + (K === 1 ? " passaggio" : " passaggi") + " da " + T_PASSA + " secondi." }),
      t.el("p", { class: "doppi", text: "Poi si vota il più bello: PUNTI DOPPI!" }),
      av.el]);
    if (trascorso(u) < 1500) suono("arrivo");
    return { el: el, agg: function (v) { av.agg(v); } };
  };

  // =========================================================
  //  LA TAVOLA DA DISEGNO: dito (8 colori, 2 punte, gomma, ↶, 🗑️) e adesivi da trascinare, girare (↻) e ingrandire (⤢),
  //  anche con due dita; un adesivo trascinato sul cestino sparisce. Gli strati di prima (finale) restano fermi sotto.
  // =========================================================
  function creaTavola(u, o) {
    var t = u.t, el = t.el;
    var S = { c: 0, w: 0, tratti: [], ad: [], pila: [], sel: null, bloccata: false, nPunti: 0, k: 1, dpr: 1, sfondo: null };
    var cvB = el("canvas", { class: "b" }), cvT = el("canvas", { class: "tr" }), lay = el("div", { class: "ad" });
    var mRot = el("div", { class: "cn-man rot", text: "↻" }), mSca = el("div", { class: "cn-man sca", text: "⤢" });
    var foglio = el("div", { class: "cn-tav-foglio" }, [cvB, cvT, lay, mRot, mSca]);
    var area = el("div", { class: "cn-tav-area" }, [foglio]);
    var avviso = el("div", { class: "cn-tav-avviso" });
    area.appendChild(avviso);
    // gli strumenti
    var bCol = COLORI.map(function (c, i) { return tasto(t, "cn-col", null, function () { S.c = i; aggStr(); }, true); });
    bCol.forEach(function (b, i) { b.style.setProperty("--c", COLORI[i]); b.setAttribute("aria-label", "Colore"); });
    var bPunta = tasto(t, "cn-str punta", null, function () { S.w = S.w ? 0 : 1; if (S.c === GOMMA) S.c = 0; aggStr(); }, true); bPunta.appendChild(el("i"));
    var bGom = tasto(t, "cn-str", "🧽", function () { S.c = GOMMA; aggStr(); }, true);
    var bAnn = tasto(t, "cn-str", "↶", function () { annulla(); }, true);
    var bCest = tasto(t, "cn-str cest", "🗑️", function () { cestino(); }, true);
    var str = el("div", { class: "cn-tav-str" }, bCol.concat([bPunta, bGom, bAnn, bCest]));
    var vass = el("div", { class: "cn-tav-adesivi" });
    (o.ad || []).slice(0, 18).forEach(function (e) {
      var b = tasto(t, "cn-ades", e, function () { nuovoAdesivo(e); }, true);
      vass.appendChild(b);
    });
    var root = el("div", { class: "cn-tav" }, [area, str, vass]);
    function aggStr() {
      bCol.forEach(function (b, i) { b.classList.toggle("on", i === S.c); });
      bGom.classList.toggle("on", S.c === GOMMA); bPunta.classList.toggle("grossa", !!S.w);
      bPunta.style.setProperty("--c", S.c === GOMMA ? "#fff" : COLORI[S.c]);
    }
    aggStr();
    function dimmi(s) { tx(avviso, s); avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }

    // ----- misure: il foglio 3:4 più grande che entra -----
    function misura() {
      var W = area.clientWidth, Hh = area.clientHeight; if (!W || !Hh) return;
      var w = Math.floor(Math.min(W, Hh * 0.75)), h = Math.floor(w / 0.75);
      if (w === S.wPx && h === S.hPx) return;
      S.wPx = w; S.hPx = h; S.k = w / LW; S.dpr = Math.min(2, window.devicePixelRatio || 1);
      foglio.style.width = w + "px"; foglio.style.height = h + "px";
      [cvB, cvT].forEach(function (c) { c.width = Math.round(w * S.dpr); c.height = Math.round(h * S.dpr); c.style.width = w + "px"; c.style.height = h + "px"; });
      rifaiSfondo(); rifaiTratti(); S.ad.forEach(posiziona); maniglie();
    }
    function rifaiSfondo() { if (cvB.width) rendiTutto(cvB, S.sfondo, o.strati || []); }
    function rifaiTratti() {
      var c = cvT.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cvT.width, cvT.height);
      rendiTratti(c, { s: S.tratti.map(function (x) { return [x.c, x.w, codTratto(x.p)]; }) }, S.k * S.dpr);
    }
    if (o.sfondo) o.sfondo(function (bg) { S.sfondo = bg; rifaiSfondo(); });
    var ro = window.ResizeObserver ? new ResizeObserver(misura) : null; if (ro) ro.observe(area);
    setTimeout(misura, 20); setTimeout(misura, 250);
    var tMis = setInterval(misura, 600);   // (se il telefono gira o la tastiera si chiude: il foglio si rimisura)

    // ----- gli adesivi -----
    function posiziona(a) {
      var n = a.n;
      n.style.left = (a.x * S.k) + "px"; n.style.top = (a.y * S.k) + "px"; n.style.fontSize = (120 * S.k) + "px";
      n.style.transform = "translate(-50%,-50%) rotate(" + a.r + "deg) scale(" + a.s + ")";
    }
    function maniglie() {
      var a = S.sel;
      [mRot, mSca].forEach(function (m) { m.style.display = a && !S.bloccata ? "" : "none"; });
      if (!a) return;
      var R = 62 * a.s * S.k + 14, cx = a.x * S.k, cy = a.y * S.k;
      function metti(m, ang) { var r = (a.r + ang) * Math.PI / 180; m.style.transform = "translate(" + (cx + Math.cos(r) * R - 15).toFixed(1) + "px," + (cy + Math.sin(r) * R - 15).toFixed(1) + "px)"; }
      metti(mRot, -90); metti(mSca, 45);
    }
    function seleziona(a) { S.ad.forEach(function (x) { x.n.classList.toggle("sel", x === a); }); S.sel = a; maniglie(); }
    function nuovoAdesivo(e, dati, zitto) {
      if (S.bloccata && !zitto) return;
      if (S.ad.length >= MAX_ADESIVI) { if (!zitto) dimmi("✋ Massimo " + MAX_ADESIVI + " adesivi"); return; }
      var a = dati || { e: e, x: LW / 2 + (Math.random() - 0.5) * 160, y: LH / 2 + (Math.random() - 0.5) * 160, s: 1, r: 0 };
      a.n = el("div", { class: "cn-ad", text: a.e }); a.n._a = a;
      lay.appendChild(a.n); S.ad.push(a); posiziona(a);
      if (!zitto) { S.pila.push({ t: "a", a: a }); seleziona(a); vibra(8); suono("pop"); cambiato(); }
      return a;
    }
    function togli(a) { if (a.n.parentNode) a.n.parentNode.removeChild(a.n); S.ad = S.ad.filter(function (x) { return x !== a; }); S.pila = S.pila.filter(function (x) { return x.a !== a; }); if (S.sel === a) seleziona(null); }

    // ----- il dito sul foglio -----
    var P = {}, modo = null, cur = null, pinch = null;
    function pos(e) { var r = foglio.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * LW, y: (e.clientY - r.top) / r.height * LH }; }
    function sopraCestino(e) { var r = bCest.getBoundingClientRect(); return e.clientX >= r.left - 6 && e.clientX <= r.right + 6 && e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6; }
    foglio.addEventListener("pointerdown", function (e) {
      if (S.bloccata) return;
      e.preventDefault();
      try { foglio.setPointerCapture(e.pointerId); } catch (_) {}
      var p = pos(e); P[e.pointerId] = p;
      var ids = Object.keys(P);
      if (ids.length === 2 && S.sel) {   // due dita: gira e ingrandisci l'adesivo scelto
        if (modo === "tratto" && cur && cur.p.length < 8) { S.tratti.pop(); S.pila.pop(); rifaiTratti(); }
        var a = P[ids[0]], b = P[ids[1]];
        pinch = { d: Math.hypot(b.x - a.x, b.y - a.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), s: S.sel.s, r: S.sel.r };
        modo = "pinch"; cur = null; return;
      }
      if (ids.length > 1) return;
      var tg = e.target;
      if (tg === mRot && S.sel) { modo = "rot"; return; }
      if (tg === mSca && S.sel) { modo = "sca"; cur = { d0: Math.hypot(p.x - S.sel.x, p.y - S.sel.y) || 1, s0: S.sel.s }; return; }
      var n = tg && tg.closest ? tg.closest(".cn-ad") : null;
      if (n && n._a) { seleziona(n._a); modo = "sposta"; cur = { dx: p.x - n._a.x, dy: p.y - n._a.y }; lay.appendChild(n); S.ad = S.ad.filter(function (x) { return x !== n._a; }).concat([n._a]); return; }
      seleziona(null);
      if (S.nPunti >= MAX_PUNTI) { dimmi("✋ Il foglio è pieno: usa gli adesivi!"); modo = null; return; }
      modo = "tratto";
      cur = { c: S.c, w: S.w, p: [Math.round(p.x), Math.round(p.y)] };
      S.tratti.push(cur); S.pila.push({ t: "s" }); S.nPunti++;
      disegnaPezzo(cur, 0);
    });
    foglio.addEventListener("pointermove", function (e) {
      if (!P[e.pointerId] || S.bloccata) return;
      var lista = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (!lista.length) lista = [e];
      var p = pos(lista[lista.length - 1]); P[e.pointerId] = p;
      if (modo === "tratto" && cur) {
        lista.forEach(function (ev) {
          var q = pos(ev), n = cur.p.length, lx = cur.p[n - 2], ly = cur.p[n - 1];
          if (Math.hypot(q.x - lx, q.y - ly) < 5 || S.nPunti >= MAX_PUNTI) return;
          cur.p.push(Math.round(q.x), Math.round(q.y)); S.nPunti++;
          disegnaPezzo(cur, cur.p.length - 4);
        });
      } else if (modo === "sposta" && S.sel) {
        S.sel.x = lim(p.x - cur.dx, -40, LW + 40); S.sel.y = lim(p.y - cur.dy, -40, LH + 40); posiziona(S.sel); maniglie();
        bCest.classList.toggle("pronto", sopraCestino(e));
      } else if (modo === "rot" && S.sel) {
        S.sel.r = Math.round(Math.atan2(p.y - S.sel.y, p.x - S.sel.x) * 180 / Math.PI + 90); posiziona(S.sel); maniglie();
      } else if (modo === "sca" && S.sel) {
        S.sel.s = lim(cur.s0 * Math.hypot(p.x - S.sel.x, p.y - S.sel.y) / cur.d0, 0.3, 5); posiziona(S.sel); maniglie();
      } else if (modo === "pinch" && S.sel && pinch) {
        var ids = Object.keys(P); if (ids.length < 2) return;
        var a = P[ids[0]], b = P[ids[1]];
        S.sel.s = lim(pinch.s * (Math.hypot(b.x - a.x, b.y - a.y) || 1) / pinch.d, 0.3, 5);
        S.sel.r = Math.round(pinch.r + (Math.atan2(b.y - a.y, b.x - a.x) - pinch.ang) * 180 / Math.PI);
        posiziona(S.sel); maniglie();
      }
    });
    function fineDito(e) {
      if (!P[e.pointerId]) return;
      delete P[e.pointerId];
      if (modo === "sposta" && S.sel && sopraCestino(e)) { togli(S.sel); vibra(15); suono("zero"); }
      bCest.classList.remove("pronto");
      if (Object.keys(P).length === 0) { if (modo) cambiato(); modo = null; cur = null; pinch = null; }
    }
    foglio.addEventListener("pointerup", fineDito); foglio.addEventListener("pointercancel", fineDito);
    function disegnaPezzo(tr, da) {
      var c = cvT.getContext("2d"), k = S.k * S.dpr, p = tr.p;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = tr.c === GOMMA ? "destination-out" : "source-over";
      c.strokeStyle = tr.c === GOMMA ? "#000" : COLORI[tr.c]; c.lineWidth = PUNTE[tr.w] * (tr.c === GOMMA ? 2.2 : 1) * k; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath();
      da = Math.max(0, da);
      c.moveTo(p[da] * k, p[da + 1] * k);
      if (p.length === 2) c.lineTo(p[0] * k + 0.1, p[1] * k);
      for (var i = da + 2; i < p.length; i += 2) c.lineTo(p[i] * k, p[i + 1] * k);
      c.stroke(); c.globalCompositeOperation = "source-over";
    }
    function annulla() {
      if (S.bloccata) return;
      var x = S.pila.pop(); if (!x) return;
      if (x.t === "s") { var tr = S.tratti.pop(); if (tr) S.nPunti -= tr.p.length / 2; rifaiTratti(); }
      else if (x.a) togli(x.a);
      cambiato();
    }
    var sicuro = 0;
    function cestino() {
      if (S.bloccata) return;
      if (S.sel && Date.now() - sicuro > 2500) { togli(S.sel); cambiato(); return; }   // con un adesivo scelto: via quello
      if (Date.now() - sicuro > 2500) { sicuro = Date.now(); bCest.classList.add("sicuro"); dimmi("Tocca ancora 🗑️ per cancellare tutto"); setTimeout(function () { bCest.classList.remove("sicuro"); }, 2500); return; }
      sicuro = 0; bCest.classList.remove("sicuro");
      S.tratti = []; S.pila = []; S.nPunti = 0; S.ad.slice().forEach(togli); rifaiTratti(); cambiato();
    }
    function dis() {
      return { s: S.tratti.map(function (x) { return [x.c, x.w, codTratto(x.p)]; }),
        a: S.ad.map(function (a) { return [a.e, Math.round(a.x), Math.round(a.y), Math.round(a.s * 100), ((Math.round(a.r) % 360) + 360) % 360]; }) };
    }
    function carica(d) {
      d = disValido(d); if (!d) return;
      S.tratti = d.s.map(function (x) { return { c: x[0], w: x[1], p: decTratto(x[2]) }; });
      S.pila = S.tratti.map(function () { return { t: "s" }; });
      S.nPunti = S.tratti.reduce(function (n, x) { return n + x.p.length / 2; }, 0);
      S.ad.slice().forEach(togli);
      d.a.forEach(function (x) { var a = nuovoAdesivo(x[0], { e: x[0], x: x[1], y: x[2], s: x[3] / 100, r: x[4] }, true); if (a) S.pila.push({ t: "a", a: a }); });
      rifaiTratti();
    }
    var sporco = false;
    function cambiato() { sporco = true; if (o.chiave) try { sessionStorage.setItem(o.chiave, JSON.stringify(dis())); } catch (e) {} }
    if (o.chiave) try { var bz = JSON.parse(sessionStorage.getItem(o.chiave) || "null"); if (bz) carica(bz); } catch (e) {}
    return {
      el: root, dis: dis, carica: carica, misura: misura, vuoto: function () { return !S.tratti.length && !S.ad.length; },
      sporco: function () { var s = sporco; sporco = false; return s; },
      blocca: function () { S.bloccata = true; seleziona(null); root.classList.add("bloccata"); },
      via: function () { if (ro) ro.disconnect(); clearInterval(tMis); }
    };
  }

  // ----- 🎨 Disegna -----
  PASSI.disegna = function (u, vm) {
    var t = u.t, d = vm.dom || {}, inviato = false, ultBozza = Date.now();
    u.root.classList.add("disegno");
    var nota = d.su === "ritratto" ? "Disegna sopra " + (vm.prot === u.cb.myId ? "di te" : nomeVm(vm, vm.prot)) : d.su === "scena" ? "Disegna sulla scena del posto" : "Foglio bianco";
    var q = cartaDomanda(t, d.q, "🎨 " + nota + " · col dito e con gli adesivi");
    q.classList.add("corta");
    if (u.guardo) {
      var el0 = t.el("div", { class: "cn-dis" }, [q, t.el("div", { class: "cn-centro" }, [img(t, ARTE().scenaSrc ? ARTE().scenaSrc(vm.posto, 480, 640) : "", "cn-guarda-scena"), t.el("p", { text: "👀 Gli altri stanno disegnando…" })])]);
      return { el: el0, via: function () { u.root.classList.remove("disegno"); } };
    }
    var T = creaTavola(u, { ad: d.ad || [], chiave: "cn-dis|" + vm.k, sfondo: function (cb) { sfondoTavola(d.su, vm.posto, vm.prot, nomeVm(vm, vm.prot), cb); } });
    var bFatto = tasto(t, "vai", "✓ Fatto", function () { manda(true); });
    var stato = t.el("span", { class: "cn-dis-stato" });
    var el = t.el("div", { class: "cn-dis" }, [q, T.el, t.el("div", { class: "cn-azione" }, [stato, bFatto])]);
    function manda(fine) {
      if (inviato) return;
      var dd = T.dis();
      if (fine) { inviato = true; T.blocca(); bFatto.disabled = true; tx(bFatto, "✓ Mandato"); tx(stato, "Aspettiamo gli altri…"); suono("lancia"); el.classList.add("inviato"); TUA = { k: vm.k, dis: dd, fine: true }; }
      u.cb.invia({ t: "dis", k: vm.k, dis: dd, fine: !!fine });
    }
    function tua() { if (TUA.k === vm.k && TUA.dis) { if (T.vuoto()) T.carica(TUA.dis); if (TUA.fine) { inviato = true; T.blocca(); bFatto.disabled = true; tx(bFatto, "✓ Mandato"); el.classList.add("inviato"); } } }
    tua();
    return { el: el, tua: tua,
      tic: function (resta) {
        if (inviato) return;
        if (resta <= 300 && u.scade) return manda(true);   // allo scadere parte il disegno com'è
        if (Date.now() - ultBozza > 6000 && T.sporco()) { ultBozza = Date.now(); manda(false); }   // ogni tanto la bozza all'host (se il telefono si spegne, il disegno c'è)
      },
      via: function () { T.via(); u.root.classList.remove("disegno"); } };
  };

  // ----- 🖼️ «Passa il ritratto!»: un passaggio -----
  PASSI.passa = function (u, vm) {
    var t = u.t, inviato = false, T = null, ultBozza = Date.now(), K = vm.fin ? vm.fin.K : 3, k = vm.fin ? vm.fin.k : 1;
    u.root.classList.add("disegno");
    var testa = t.el("div", { class: "cn-domanda corta" }), corpo = t.el("div", { class: "cn-dis-corpo" });
    var bFatto = tasto(t, "vai", "✓ Fatto", function () { manda(true); }), stato = t.el("span", { class: "cn-dis-stato", text: "Passaggio " + k + " di " + K });
    var az = t.el("div", { class: "cn-azione" }, [stato, bFatto]);
    var el = t.el("div", { class: "cn-dis" }, [testa, corpo, az]);
    function aspetta(s) { svuota(corpo); corpo.appendChild(t.el("div", { class: "cn-centro" }, [t.el("p", { text: s })])); az.style.visibility = "hidden"; }
    function foglio() {
      if (T || FOGLIO.k !== vm.k) return;
      svuota(testa);
      testa.appendChild(t.el("div", { class: "q", style: "font-size:16px", text: "Trasforma " + (FOGLIO.target === u.cb.myId ? "TE" : maiuscolo(nomeVm(vm, FOGLIO.target))) + " in: " + FOGLIO.miss }));
      testa.appendChild(t.el("div", { class: "x", text: k === 1 ? "🎨 Comincia tu! Poi passa al prossimo" : "🎨 Aggiungi qualcosa a quello che c'è" }));
      svuota(corpo); az.style.visibility = "";
      T = creaTavola(u, { ad: spezzaEmoji(ARTE().FESTA || "👑🎩🕶️"), chiave: "cn-dis|" + vm.k, strati: FOGLIO.strati,
        sfondo: function (cb) { sfondoTavola("ritratto", null, FOGLIO.target, nomeVm(vm, FOGLIO.target), cb); } });
      corpo.appendChild(T.el);
      tua();
    }
    function manda(fine) {
      if (inviato || !T) return;
      var dd = T.dis();
      if (fine) { inviato = true; T.blocca(); bFatto.disabled = true; tx(bFatto, "✓ Passato"); tx(stato, "Aspettiamo gli altri…"); suono("lancia"); el.classList.add("inviato"); TUA = { k: vm.k, dis: dd, fine: true }; }
      u.cb.invia({ t: "dis", k: vm.k, dis: dd, fine: !!fine });
    }
    function tua() { if (T && TUA.k === vm.k && TUA.dis) { if (T.vuoto()) T.carica(TUA.dis); if (TUA.fine) { inviato = true; T.blocca(); bFatto.disabled = true; tx(bFatto, "✓ Passato"); el.classList.add("inviato"); } } }
    if (u.guardo) aspetta("👀 I ritratti passano di telefono in telefono…");
    else { aspetta("📨 Arriva il foglio…"); foglio(); }
    var chiesto = Date.now();
    return { el: el, foglio: foglio, tua: tua,
      tic: function (resta) {
        if (u.guardo) return;
        if (!T) { if (Date.now() - chiesto > 3000) { chiesto = Date.now(); u.cb.invia({ t: "dammi", k: vm.k }); } return; }
        if (inviato) return;
        if (resta <= 300 && u.scade) return manda(true);
        if (Date.now() - ultBozza > 6000 && T.sporco()) { ultBozza = Date.now(); manda(false); }
      },
      via: function () { if (T) T.via(); u.root.classList.remove("disegno"); } };
  };

  // ----- 🏅 i titoli della serata -----
  PASSI.premi = function (u, vm) {
    var t = u.t, Pm = vm.premi || { onori: [], titoli: [] }, av = rigaAvanti(u, vm), io = u.cb.myId, tardi = trascorso(u) > (vm.anim || 0) * 1000;
    var lista = t.el("div", { class: "cn-premi" }), cur = 900;
    function carta(e, nome, ids, perche, grande) {
      var c = t.el("div", { class: "cn-premio" + (grande ? " grande" : "") + (ids.indexOf(io) >= 0 ? " mio" : "") }, [
        t.el("span", { class: "e", text: e }),
        t.el("span", { class: "volti" }, ids.slice(0, 3).map(function (id) { return miniFaccia(t, id, nomeVm(vm, id)); })),
        t.el("span", { class: "tx" }, [t.el("b", { text: nome }), t.el("small", { text: ids.map(function (id) { return id === io ? "Tu" : nomeVm(vm, id); }).join(", ") + (perche ? " · " + perche : "") })])]);
      c.style.opacity = "0";
      var quando = tardi ? 0 : Math.max(0, cur - trascorso(u)); cur += 1300;
      u.dopo(quando, function () { c.style.opacity = ""; c.classList.add("su"); if (!tardi) { suono("evviva"); if (ids.indexOf(io) >= 0) vibra([30, 40, 30]); } });
      lista.appendChild(c);
    }
    Pm.onori.forEach(function (o) { carta(o.e, o.nome, o.ids, o.perche, true); });
    Pm.titoli.slice(0, 8).forEach(function (x) { carta(x.e, "«" + x.t + "»", [x.id], null, false); });
    if (!Pm.onori.length && !Pm.titoli.length) lista.appendChild(t.el("p", { text: "Nessun titolo stasera… si rimedia alla rivincita!" }));
    var el = t.el("div", { class: "cn-premi-box" }, [t.el("div", { class: "cn-vota-tit" }, [t.el("b", { text: "🏅 I titoli della serata" })]), lista, av.el]);
    return { el: el, agg: function (v) { av.agg(v); } };
  };

  // =========================================================
  //  LA FINE: podio, classifica, la mia figurina da salvare, faccine e tasti del core
  // =========================================================
  function medaglie(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; });
  }
  function schermataFine(t, vm, cb) {
    stile();
    var F = vm.fine || {}, cl = F.classifica || [], io = cb.myId, el = t.el;
    // le domande uscite: anche gli amici se le segnano (telefono e profilo), così la prossima volta sono nuove
    if (!cb.sonoHost && F.ids && SEGNATI !== vm.pid) { SEGNATI = vm.pid; segnaVisti(F.ids.filter(function (x) { return /^[a-z]{3}-[a-z]\d+$/.test(x); })); }
    var s = t.schermata({});
    s.classList.add("cn-fine-s");
    var med = medaglie(cl.map(function (r) { return r.pos; }));
    var podio = el("div", { class: "cn-podio" });
    [1, 0, 2].forEach(function (i) {
      var r = cl[i]; if (!r) return;
      podio.appendChild(el("div", { class: "cn-gradino g" + (i + 1) + (r.id === io ? " tu" : "") }, [
        imgF(t, r.id, r.nome, {}, "f"), el("b", { class: "n", text: r.id === io ? "Tu" : r.nome }), el("span", { class: "pt", text: fmtN(r.punti) }),
        el("div", { class: "base", text: med[i] })]));
    });
    s._contenuto.appendChild(podio);
    if (cl.length > 3) {
      var ol = el("ol", { class: "classifica fitta cn-resto" });
      cl.slice(3).forEach(function (r, j) {
        ol.appendChild(el("li", {}, [el("span", { class: "pos", text: med[j + 3] }), el("span", { class: "nome", text: r.id === io ? r.nome + " (tu)" : r.nome }), el("span", { class: "punti", text: fmtN(r.punti) })]));
      });
      s._contenuto.appendChild(ol);
    }
    if (cl.some(function (r) { return r.id === io; }) && F.figurine && F.figurine[io]) {
      s._contenuto.appendChild(t.el("button", { class: "btn btn-primario cn-fig-btn", text: "🖼️ La mia figurina", onclick: function () { figurina(t, vm, io); } }));
    } else s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin:8px 0", text: "Questa partita l'hai guardata." }));
    var fac = t.faccine();
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(mio(s));
    return s;
  }
  var SEGNATI = null;
  // la figurina: il mio ritratto (com'è uscito dal finale), i titoli, il verdetto degli amici; si salva o si manda (WhatsApp)
  function figurina(t, vm, io) {
    var F = vm.fine || {}, fg = (F.figurine || {})[io] || {}, me = (F.classifica || []).filter(function (r) { return r.id === io; })[0] || { nome: "", punti: 0, pos: 0 };
    var cv = document.createElement("canvas"); cv.width = 720; cv.height = 1080;
    var c = cv.getContext("2d");
    var g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, "#2a1458"); g.addColorStop(1, "#0d1b4a"); c.fillStyle = g; c.fillRect(0, 0, 720, 1080);
    c.strokeStyle = "#ffcf3f"; c.lineWidth = 14; c.strokeRect(22, 22, 676, 1036);
    c.fillStyle = "#ffcf3f"; c.font = "900 64px system-ui, sans-serif"; c.textAlign = "center"; c.fillText("CHI DI NOI?", 360, 112);
    function testo(s, y, font, col, max) { c.fillStyle = col; c.font = font; var parole = String(s).split(" "), riga = "", righe = []; parole.forEach(function (w) { var p = riga ? riga + " " + w : w; if (c.measureText(p).width > (max || 620) && riga) { righe.push(riga); riga = w; } else riga = p; }); if (riga) righe.push(riga); righe.slice(0, 3).forEach(function (r, i) { c.fillText(r, 360, y + i * (parseInt(font.replace(/\D+/, " ").trim().split(" ")[1] || "30", 10) + 8)); }); return y + righe.slice(0, 3).length * 40; }
    function chiudi2() {
      c.fillStyle = "#fff"; c.font = "900 54px system-ui, sans-serif"; c.fillText(maiuscolo(me.nome), 360, 700);
      c.fillStyle = "#cdd6ff"; c.font = "700 30px system-ui, sans-serif"; c.fillText(me.pos + "° posto · " + fmtN(me.punti) + " punti", 360, 745);
      var y = 805;
      (fg.titoli || []).slice(0, 3).forEach(function (ti) { c.fillStyle = "#ffcf3f"; c.font = "800 32px system-ui, sans-serif"; c.fillText(ti, 360, y); y += 46; });
      if (fg.verdetto) y = testo("Per gli amici: «" + fg.verdetto + "»", y + 6, "italic 700 28px system-ui, sans-serif", "#ffffff");
      else if (fg.battuta) y = testo("«" + fg.battuta + "»", y + 6, "italic 700 28px system-ui, sans-serif", "#ffffff");
      c.fillStyle = "#8fa0d8"; c.font = "700 24px system-ui, sans-serif"; c.fillText("Chi di Noi? · SPeeD GAME", 360, 1030);
      mostraFig();
    }
    // il ritratto: quello trasformato dal finale (se c'è), se no il mio avatar
    var it = fg.foglio != null && GAL.k === F.kGal ? GAL.items[fg.foglio] : null;
    sfondoTavola("ritratto", null, io, me.nome, function (bg) {
      var r = document.createElement("canvas"); r.width = 450; r.height = 600;
      rendiTutto(r, bg, it ? it.strati : []);
      c.save(); c.beginPath(); if (c.roundRect) c.roundRect(135, 150, 450, 500, 30); else c.rect(135, 150, 450, 500); c.clip();
      c.drawImage(r, 0, 25, 450, 550, 135, 150, 450, 500); c.restore();
      c.strokeStyle = "#ffffff"; c.lineWidth = 6; c.beginPath(); if (c.roundRect) c.roundRect(135, 150, 450, 500, 30); else c.rect(135, 150, 450, 500); c.stroke();
      chiudi2();
    });
    function mostraFig() {
      var velo = t.el("div", { class: "cn-fig-velo" });
      var im = t.el("img", { class: "cn-fig-img", alt: "La mia figurina", src: cv.toDataURL("image/png") });
      var bSalva = t.el("button", { class: "btn btn-primario", text: "📤 Salva o manda", onclick: function () { salva(); } });
      var bChiudi = t.el("button", { class: "btn btn-fantasma", text: "Chiudi", onclick: function () { if (velo.parentNode) velo.parentNode.removeChild(velo); } });
      velo.appendChild(t.el("div", { class: "cn-fig-box" }, [im, t.el("div", { class: "cn-fig-tasti" }, [bSalva, bChiudi])]));
      document.body.appendChild(velo);
    }
    function salva() {
      cv.toBlob(function (b) {
        if (!b) return;
        var nomeF = "chi-di-noi-" + String(me.nome || "io").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".png";
        try {
          var f = new File([b], nomeF, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: "Chi di Noi?", text: "La mia figurina di Chi di Noi? 🫵" }).catch(function () {}); return; }
        } catch (e) {}
        var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nomeF; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 1500);
      }, "image/png");
    }
  }

  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Questo gioco si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  LO STILE (prefisso cn-): animazioni solo transform/opacity
  // =========================================================
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.cn-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#140c33}",
      ".schermata.cn-piena>.testa,.schermata.cn-piena>.piede{display:none}",
      ".schermata.cn-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".cn{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(120% 70% at 50% -10%,#5a2ca0 0%,#2a1458 45%,#120a2e 100%);color:#fff;user-select:none;-webkit-user-select:none;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}",
      ".cn button{font-family:inherit}",
      ".cn-barra{flex:none;height:44px;display:flex;align-items:center;gap:6px;padding:4px 8px}",
      ".cn-esci,.cn-coppa{flex:none;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:1.15rem;font-weight:900;cursor:pointer;padding:0}",
      ".cn-dove{flex:1;min-width:0;font-weight:900;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cn-timer{flex:none;position:relative;width:32px;height:32px}.cn-timer svg{width:100%;height:100%;transform:rotate(-90deg)}",
      ".cn-timer circle{fill:none;stroke-width:4}.cn-timer .f{stroke:rgba(255,255,255,.15)}.cn-timer .p{stroke:#ffcf3f;stroke-dasharray:97.4;stroke-linecap:round}",
      ".cn-timer b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900}",
      ".cn-timer.rosso .p{stroke:#ff5d6c}.cn-timer.rosso b{color:#ff8a94}.cn-timer.spento{opacity:0}",
      ".cn-jtappi{flex:none;display:flex}.cn-jtappi i{font-style:normal;font-size:14px;opacity:.22;filter:grayscale(1);margin-left:-3px}.cn-jtappi i.su{opacity:1;filter:none}",
      ".cn-palco{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;padding:0 10px 6px}",
      ".cn-palco>*{flex:1;min-height:0}",
      ".cn-entra{animation:cnEntra .35s ease both}",
      ".cn-fondo{flex:none;height:44px;display:flex;align-items:center;gap:6px;padding:0 8px 2px}",
      ".cn.disegno .cn-fondo,.cn.scrive .cn-fondo,.cn.scrive .cn-striscia{display:none}",
      ".cn-chi{flex:1;min-width:0;display:flex;align-items:center;padding-left:5px;overflow:hidden}",
      ".cn-mini{position:relative;display:inline-block;width:26px;height:26px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.35);flex:none;box-sizing:border-box}",
      ".cn-mini img{position:absolute;width:150%;height:150%;left:-25%;top:-14%;object-fit:cover}",
      ".cn-chi .cn-mini{margin-left:-5px;filter:grayscale(1);opacity:.4;transition:opacity .2s}.cn-chi .cn-mini.ok{filter:none;opacity:1}.cn-chi .cn-mini.forse{border-style:dashed;opacity:.25}.cn-chi .cn-mini.tu{border-color:#ffcf3f}",
      ".cn-reaz{flex:none;display:flex;gap:3px}",
      ".cn-rz{width:32px;height:34px;border:0;border-radius:10px;background:rgba(255,255,255,.1);font-size:18px;padding:0;cursor:pointer}.cn-rz.boing{animation:cnBoing .4s}",
      ".cn-volo{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:30}",
      ".cn-vola{position:absolute;bottom:46px;display:flex;flex-direction:column;align-items:center;animation:cnVola 2.4s ease-out forwards}.cn-vola .e{font-size:34px;line-height:1}",
      ".cn-vola .f{width:26px;height:26px;border-radius:50%;object-fit:cover;object-position:50% 40%;border:2px solid #fff;margin-top:-6px;background:rgba(255,255,255,.3)}",
      ".cn-vola.pomodoro{animation:cnPomo 2.2s ease-out forwards}",
      ".cn-velo{position:absolute;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(8,4,24,.86);padding:14px}.cn-velo.su{display:flex}",
      ".cn-class-box{width:100%;max-width:440px;background:#2a1a5e;border-radius:18px;padding:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 10px 30px #0008}",
      ".cn-class-tit{font-weight:900;font-size:18px;text-align:center}",
      ".cn-class{display:grid;grid-template-columns:1fr;gap:5px;align-content:center}.cn-class.due{grid-template-columns:1fr 1fr}",
      ".cn-riga{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);border-radius:12px;padding:4px 8px;min-height:38px;font-weight:800;font-size:14px;animation:cnEntra .4s both;min-width:0}",
      ".cn-class.due .cn-riga{font-size:12.5px;padding:3px 6px;gap:4px}",
      ".cn-riga.tu{background:rgba(255,207,63,.2);box-shadow:inset 0 0 0 2px #ffcf3f}.cn-riga.via{opacity:.45}",
      ".cn-riga>b{flex:none;min-width:1.6em}.cn-riga .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cn-riga .pt{flex:none;font-variant-numeric:tabular-nums}",
      ".cn-riga .pt small{color:#7ff0a8;font-size:11px}.cn-riga .fr{font-style:normal;font-size:11px;width:10px;color:#7ff0a8}",
      ".cn-btn{border:0;border-radius:14px;font-weight:900;font-size:15px;min-height:46px;padding:0 14px;color:#fff;background:rgba(255,255,255,.14);cursor:pointer;touch-action:manipulation;transition:transform .12s,opacity .2s}",
      ".cn-btn:active{transform:scale(.96)}.cn-btn:disabled{opacity:.4}",
      ".cn-btn.vai{background:linear-gradient(#ffd75a,#f5a623);color:#2a1458;box-shadow:0 4px 0 #b3740f}",
      ".cn-btn.jolly{background:rgba(255,255,255,.08);border:2px dashed rgba(255,207,63,.6);color:#ffcf3f;flex:none}",
      ".cn-btn.jolly.on{background:#ffcf3f;color:#2a1458;border-style:solid;transform:rotate(-3deg)}",
      ".cn-btn.avanti.on{background:rgba(55,212,126,.3)}.cn-btn.chiaro{background:#fff;color:#2a1458}",
      ".cn-azione{flex:none;display:flex;gap:8px;align-items:center;padding-top:6px}.cn-azione .vai{flex:1}",
      ".cn-azione.inviato .vai{background:#37d47e;color:#fff;box-shadow:0 4px 0 #1f8a50;opacity:1}",
      ".cn-riga-avanti{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px;min-height:52px}",
      ".cn-conto{font-weight:700;opacity:.8;font-size:13px}",
      ".cn-domanda{flex:none;position:relative;z-index:2;background:#fff;color:#21124d;border-radius:16px;padding:9px 12px;box-shadow:0 5px 0 rgba(0,0,0,.25);transform:rotate(-.6deg);margin:4px 2px 8px}",
      ".cn-domanda .q{font-weight:900;line-height:1.22}.cn-domanda .x{font-size:12px;font-weight:700;color:#6b5aa6;margin-top:3px}",
      ".cn-domanda.corta{padding:6px 10px;margin:2px 2px 5px}.cn-domanda.corta .q{font-size:15px!important;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}",
      ".cn-striscia{flex:none;position:relative;height:82px;border-radius:16px;overflow:hidden;margin-top:2px}",
      ".cn-striscia .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}",
      ".cn-striscia .prot{position:absolute;left:6px;bottom:-4px;height:90px}",
      ".cn-sotto{position:absolute;left:96px;bottom:18px;background:rgba(0,0,0,.62);border-radius:10px;padding:3px 9px}",
      ".cn-sotto small{display:block;font-size:10px;opacity:.85;text-transform:uppercase;letter-spacing:.06em}.cn-sotto b{font-size:17px;font-weight:900}",
      ".cn-em{position:absolute;right:10px;top:6px;font-size:26px}",
      ".cn-striscia+.cn-domanda{margin-top:-12px}",
      ".cn-sc,.cn-scr,.cn-vota,.cn-svela,.cn-classif,.cn-dis,.cn-arr,.cn-premi-box{display:flex;flex-direction:column}",
      ".cn-carte{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px}",
      ".cn-carta{position:relative;min-height:0;background:#fffaf0;color:#2a1458;border-radius:16px;display:flex;flex-direction:column;align-items:center;overflow:hidden;box-shadow:0 5px 0 rgba(0,0,0,.3);transition:transform .15s,box-shadow .15s,opacity .2s;touch-action:none;cursor:pointer}",
      ".cn-carta .fig{flex:1;min-height:0;width:100%;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;background:radial-gradient(circle at 50% 70%,#ffe7a8,#ffc94d)}",
      ".cn-carta .fig img{height:100%;width:auto;max-width:100%;object-fit:contain;pointer-events:none}",
      ".cn-carta .fig.em{align-items:center;font-size:clamp(36px,12vw,62px);line-height:1}.cn-carta .fig.em.due{font-size:clamp(28px,9.5vw,48px)}",
      ".cn-carta.lui .fig{background:radial-gradient(circle at 50% 70%,#d6efff,#7fc4ff)}",
      ".cn-carta .fig{position:relative}.cn-carta .smorfia{position:absolute;right:6px;top:6px;font-size:24px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))}",
      ".cn-carta .cap{flex:none;width:100%;box-sizing:border-box;padding:4px 6px 6px;font-size:13px;font-weight:800;line-height:1.15;text-align:center;min-height:2.7em;display:flex;align-items:center;justify-content:center}",
      ".cn-carta.sel{box-shadow:0 0 0 4px #ffcf3f,0 9px 0 rgba(0,0,0,.35);transform:translateY(-4px) rotate(-1deg)}",
      ".cn-carta.lanciata{animation:cnLancia .5s ease both}",
      ".cn-sc.inviato .cn-carta:not(.sel),.cn-sc.inviato .cn-volto:not(.sel){opacity:.4}",
      ".cn-carte.piccole .cap{font-size:12px}",
      ".cn-carta .voti,.cn-volto .voti{position:absolute;top:4px;left:4px;right:4px;display:flex;flex-wrap:wrap;gap:2px;z-index:2}",
      ".cn-carta.vince{box-shadow:0 0 0 4px #37d47e,0 5px 0 rgba(0,0,0,.3)}.cn-carta.mia .cap{background:rgba(255,207,63,.35)}",
      ".cn-carta.dilui::after{content:'👑';position:absolute;right:4px;bottom:34px;font-size:22px;animation:cnPop .4s both}",
      ".cn-mini.vola{transition:opacity .2s}.cn-mini.giu{animation:cnGiu .35s ease}.cn-mini.re{border-color:#ffcf3f;box-shadow:0 0 0 2px #ffcf3f}.cn-mini.jolly{border-color:#ff8fd0;box-shadow:0 0 0 2px #ff8fd0}",
      ".cn-volti{flex:1;min-height:0;display:grid;gap:6px;align-content:center;grid-template-columns:repeat(3,1fr)}",
      ".cn-volti.n3,.cn-volti.n4{grid-template-columns:repeat(2,1fr)}.cn-volti.n7,.cn-volti.n8{grid-template-columns:repeat(4,1fr)}.cn-volti.n9,.cn-volti.n10{grid-template-columns:repeat(5,1fr)}",
      ".cn-volto{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border-radius:14px;background:rgba(255,255,255,.08);touch-action:none;cursor:pointer;min-width:0;transition:opacity .2s,transform .15s}",
      ".cn-volto img{width:100%;max-width:96px;aspect-ratio:1;border-radius:50%;object-fit:cover;object-position:50% 38%;background:rgba(255,255,255,.18);border:3px solid rgba(255,255,255,.3);box-sizing:border-box;pointer-events:none}",
      ".cn-volto span{font-size:12px;font-weight:800;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".cn-volto.sel{background:rgba(255,207,63,.25);transform:translateY(-3px)}.cn-volto.sel img{border-color:#ffcf3f}",
      ".cn-volto.vince{background:rgba(55,212,126,.25)}.cn-volto.vince img{border-color:#37d47e}.cn-volto.mia span{color:#ffcf3f}",
      ".cn-volti.svela .voti{top:2px}.cn-volti.n9 .cn-mini,.cn-volti.n10 .cn-mini,.cn-volti.n7 .cn-mini,.cn-volti.n8 .cn-mini{width:18px;height:18px}",
      ".cn-scr-box{flex:none;background:#fff;border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:6px}",
      ".cn-campo{width:100%;box-sizing:border-box;border:0;resize:none;font:inherit;font-size:18px;font-weight:800;color:#21124d;outline:none;background:transparent;min-height:52px;user-select:text;-webkit-user-select:text}",
      ".cn-scr-riga{display:flex;align-items:center;gap:8px;justify-content:space-between}.cn-scr-riga .vai{flex:0 0 55%}.cn-conta{color:#8a7cc4;font-weight:800;font-size:13px}",
      ".cn-fatto{flex:none;font-weight:800;color:#7ff0a8;text-align:center;padding:8px}.cn-scr.inviato .cn-scr-box{opacity:.6}",
      ".cn-vt{display:flex;flex-direction:column;align-items:stretch}.cn-vt-tit{flex:none;text-align:center;font-weight:900;font-size:16px;opacity:.85}",
      ".cn-vt-carta{flex:none;margin:auto 6px;background:#fff;color:#21124d;border-radius:22px;padding:24px 16px;font-size:24px;font-weight:900;text-align:center;box-shadow:0 8px 0 rgba(0,0,0,.3);transform:rotate(1deg)}",
      ".cn-vt-carta.su{animation:cnPop .45s cubic-bezier(.2,1.6,.4,1) both}.cn-vt-num{flex:none;text-align:center;font-weight:800;opacity:.7;padding-bottom:6px}",
      ".cn-vota-tit{flex:none;display:flex;flex-direction:column;align-items:center;padding:2px 0 8px;text-align:center}.cn-vota-tit b{font-size:18px;font-weight:900}.cn-vota-tit small{font-size:12px;opacity:.8}",
      ".cn-voti{flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;justify-content:center}",
      ".cn-voce{position:relative;flex:0 1 46px;min-height:32px;background:#fff;color:#21124d;border-radius:14px;padding:3px 12px;display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px;line-height:1.15;cursor:pointer;transition:opacity .25s,transform .15s}",
      ".cn-voti.n9 .cn-voce,.cn-voti.n10 .cn-voce,.cn-voti.n11 .cn-voce,.cn-voti.n12 .cn-voce{font-size:13px;padding:2px 10px}",
      ".cn-voce>span:first-child{flex:1;min-width:0}.cn-voce>i{display:none;font-style:normal;font-size:11px;color:#8a7cc4;flex:none}",
      ".cn-voce.mia{opacity:.5}.cn-voce.mia>i{display:inline}.cn-voce.sel{box-shadow:0 0 0 4px #ffcf3f;transform:scale(1.02)}",
      ".cn-voce .aut{flex:none;display:flex;align-items:center;gap:4px;font-size:12px}.cn-voce .aut.casa{color:#b07a00;font-weight:900}",
      ".cn-voce .voti{flex:none;display:flex;gap:1px;max-width:40%;flex-wrap:wrap;justify-content:flex-end}.cn-voce .voti .cn-mini{width:20px;height:20px}",
      ".cn-voce.rivela.vince{background:#fff3c4;box-shadow:0 0 0 3px #ffcf3f;font-size:16px}",
      ".cn-gal{flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--col,2),var(--cw,100px));justify-content:center;align-content:center;gap:8px}",
      ".cn-cella{position:relative;width:var(--cw,100px);aspect-ratio:3/4;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 4px 0 rgba(0,0,0,.3);cursor:pointer}",
      ".cn-cella canvas{width:100%;height:100%;display:block}.cn-cella.vuota{background:rgba(255,255,255,.15)}.cn-cella.vuota canvas{opacity:0}",
      ".cn-cella .tag{position:absolute;left:4px;bottom:4px;font-style:normal;font-size:10px;font-weight:800;background:rgba(0,0,0,.7);border-radius:6px;padding:1px 5px;color:#fff}.cn-cella .tag:empty{display:none}",
      ".cn-cella.mia{opacity:.55}.cn-cella.sel{box-shadow:0 0 0 4px #ffcf3f}.cn-cella.vince{box-shadow:0 0 0 4px #37d47e}",
      ".cn-cella .sotto{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.72);color:#fff;font-size:10px;font-weight:800;text-align:center;padding:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cn-cella .sotto:empty{display:none}",
      ".cn-cella .voti{position:absolute;top:3px;left:3px;right:3px;display:flex;flex-wrap:wrap;gap:2px}.cn-cella .cn-mini{width:20px;height:20px}",
      ".cn-zoom{display:flex;flex-direction:column;align-items:center;gap:10px;max-height:100%}",
      ".cn-zoom-cv{width:min(86vw,calc((var(--alt,100dvh) - 190px) * .75));height:auto;aspect-ratio:3/4;border-radius:16px;background:#fff}",
      ".cn-zoom-tasti{display:flex;gap:8px;width:100%;justify-content:center}.cn-zoom-miss{font-weight:800;text-align:center;font-size:14px}",
      ".cn-strisc{flex:none;text-align:center;font-weight:900;font-size:20px;color:#ffcf3f;opacity:0}.cn-strisc:empty{display:none}",
      ".cn-strisc.su{opacity:1;animation:cnPop .5s both}.cn-strisc.tutti{font-size:21px;color:#7ff0a8;text-shadow:0 0 12px rgba(127,240,168,.6)}",
      ".cn-mioesito{flex:none;align-self:center;font-weight:900;font-size:20px;padding:3px 16px;border-radius:999px;opacity:0;margin-top:4px}.cn-mioesito:empty{display:none}",
      ".cn-mioesito.su{opacity:1;animation:cnPop .5s both}.cn-mioesito.si{background:#37d47e}.cn-mioesito.no{background:rgba(255,255,255,.18)}",
      ".cn-voce-gioco{flex:none;text-align:center;font-style:italic;font-size:13px;opacity:0;padding-top:3px}.cn-voce-gioco:empty{display:none}.cn-voce-gioco.su{opacity:.9;transition:opacity .4s}",
      ".cn-verdetto{flex:none;text-align:center;padding:6px 0 2px;transition:opacity .3s}.cn-verdetto small{display:block;font-size:12px;opacity:.8}.cn-verdetto b{font-size:17px;font-weight:900;color:#ffcf3f}",
      ".cn-verdetto.su{animation:cnPop .45s both}.cn-verdetto:empty{display:none}",
      ".cn-svela .cn-domanda{margin-bottom:6px}.cn-svela .cn-domanda .q{font-size:15px!important}",
      ".cn-svela.vuoto{align-items:center;justify-content:center;text-align:center;font-weight:800}.cn-vuoto{font-size:80px}",
      ".cn-prossima{flex:none;background:rgba(255,255,255,.1);border-radius:16px;padding:8px 12px;margin-top:8px;display:flex;flex-direction:column;align-items:center;gap:3px;animation:cnPop .5s .5s both}",
      ".cn-prossima small{font-size:11px;text-transform:uppercase;letter-spacing:.08em;opacity:.8}.cn-prossima b{font-size:18px;font-weight:900}.cn-prossima .chi{display:flex;align-items:center;gap:6px;font-weight:800;font-size:14px;color:#ffcf3f}",
      ".cn-classif .cn-class{flex:1;min-height:0}",
      ".cn-sf{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:6px}",
      ".cn-sf-tit{flex:none;font-weight:900;font-size:15px;opacity:.85;letter-spacing:.1em;text-transform:uppercase;padding-top:4px}",
      ".cn-sf-palco{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:100%}",
      ".cn-sf-cornice{width:min(60vw,calc(var(--alt,100dvh) * .32),250px);aspect-ratio:1;border-radius:50%;background:radial-gradient(#fff6d8,#ffb84a);box-shadow:0 0 0 6px #ffcf3f,0 0 40px 12px rgba(255,207,63,.55);overflow:hidden;opacity:0;transform:scale(.6)}",
      ".cn-sf-cornice.su{animation:cnSfila .6s cubic-bezier(.2,1.5,.4,1) forwards}.cn-sf-foto{width:100%;height:100%;object-fit:cover;object-position:50% 40%;transform:scale(1.25) translateY(6%)}",
      ".cn-sf-nome{font-size:clamp(26px,9vw,44px);font-weight:900;letter-spacing:.04em;opacity:0;text-shadow:0 4px 0 rgba(0,0,0,.4);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cn-sf-nome.su{animation:cnNome .6s .15s both}",
      ".cn-sf-pronti{position:absolute;left:0;right:0;top:38%;text-align:center;font-size:30px;font-weight:900;color:#ffcf3f;opacity:0;pointer-events:none}.cn-sf-pronti.su{animation:cnPop .5s both}",
      ".cn-sf-fila{flex:none;display:flex;gap:4px;flex-wrap:wrap;justify-content:center}.cn-sf-fila .cn-mini{opacity:.3;transition:opacity .3s}.cn-sf-fila .cn-mini.ok{opacity:1}",
      ".cn-sf .cn-riga-avanti{width:100%}",
      ".cn-arr-scena{flex:1;min-height:0;position:relative;border-radius:20px;overflow:hidden;margin-top:2px}",
      ".cn-arr-scena .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}",
      ".cn-arr-prot{position:absolute;left:50%;bottom:0;height:60%;animation:cnArrProt .9s .3s cubic-bezier(.2,1.3,.4,1) both}",
      ".cn-arr-titolo{position:absolute;top:10px;left:10px;right:10px;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.62);border-radius:14px;padding:6px 12px;font-weight:900;font-size:19px;animation:cnEntra .5s both}.cn-arr-titolo .e{font-size:28px}",
      ".cn-arr-sotto{position:absolute;right:10px;bottom:14px;background:#ffcf3f;color:#2a1458;border-radius:12px;padding:4px 10px;text-align:right;animation:cnTimbro .5s 1s both}",
      ".cn-arr-sotto small{display:block;font-size:10px;font-weight:800;text-transform:uppercase}.cn-arr-sotto b{font-size:20px;font-weight:900}",
      ".cn-arr-voce{position:absolute;left:10px;right:10px;top:64px;background:#fff;color:#21124d;border-radius:14px;padding:8px 10px;font-weight:800;font-size:14px;line-height:1.25;animation:cnEntra .5s .6s both}",
      ".cn-arr-info{flex:none;text-align:center;font-size:12px;opacity:.85;padding-top:6px}",
      ".cn-fin-intro{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px}.cn-fin-gran{font-size:76px;animation:cnPop .6s both}",
      ".cn-fin-intro h2{margin:0;font-weight:900;font-size:22px}.cn-fin-intro p{margin:0;font-weight:700;opacity:.9;line-height:1.35}.cn-fin-intro p.doppi{color:#ffcf3f;font-weight:900}.cn-fin-intro .cn-riga-avanti{width:100%;margin-top:auto}",
      ".cn-premi{flex:1;min-height:0;display:flex;flex-direction:column;gap:5px;justify-content:center}",
      ".cn-premio{flex:0 1 auto;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border-radius:14px;padding:4px 10px;min-height:34px;opacity:0}",
      ".cn-premio.su{animation:cnPop .5s both}.cn-premio.grande{background:linear-gradient(90deg,rgba(255,207,63,.25),rgba(255,255,255,.06));padding:7px 10px}.cn-premio.mio{box-shadow:inset 0 0 0 2px #ffcf3f}",
      ".cn-premio .e{font-size:24px;flex:none}.cn-premio .volti{display:flex;flex:none}.cn-premio .volti .cn-mini{margin-right:-4px}.cn-premio .tx{display:flex;flex-direction:column;min-width:0;margin-left:4px}",
      ".cn-premio b{font-weight:900;font-size:14px}.cn-premio small{font-size:11px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cn-tav{flex:1;min-height:0;display:flex;flex-direction:column;gap:5px}",
      ".cn-tav-area{flex:1;min-height:0;position:relative;overflow:hidden}",
      ".cn-tav-foglio{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:10px;overflow:hidden;box-shadow:0 4px 0 rgba(0,0,0,.35);touch-action:none;background:#fff}",
      ".cn-tav-foglio canvas{position:absolute;left:0;top:0}.cn-tav-foglio .ad{position:absolute;inset:0}",
      ".cn-ad{position:absolute;line-height:1;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;white-space:nowrap}",
      ".cn-ad.sel{filter:drop-shadow(0 0 3px #1c7ed6)}",
      ".cn-man{position:absolute;left:0;top:0;width:30px;height:30px;border-radius:50%;background:#1c7ed6;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:16px;z-index:3;box-shadow:0 2px 6px rgba(0,0,0,.5);touch-action:none;cursor:pointer}",
      ".cn-tav-avviso{position:absolute;left:50%;top:8px;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;font-weight:800;font-size:13px;padding:4px 10px;border-radius:999px;opacity:0;pointer-events:none;white-space:nowrap;z-index:4}.cn-tav-avviso.su{animation:cnAvv 2.2s both}",
      ".cn-tav-str{flex:none;display:flex;gap:2px;padding:0 3px;align-items:center;justify-content:center}",
      ".cn-btn.cn-col{width:24px;height:24px;min-height:0;padding:0;border-radius:50%;background:var(--c);border:2px solid rgba(255,255,255,.5);box-shadow:none;flex:none}",
      ".cn-btn.cn-col.on{transform:scale(1.12);border-color:#ffcf3f;box-shadow:0 0 0 2px #ffcf3f}",
      ".cn-btn.cn-str{width:31px;height:31px;min-height:0;padding:0;border-radius:10px;font-size:17px;flex:none}.cn-btn.cn-str.on{background:rgba(255,207,63,.45)}",
      ".cn-str.punta i{display:block;width:8px;height:8px;border-radius:50%;background:var(--c,#000);margin:auto;border:1px solid rgba(255,255,255,.7)}.cn-str.punta.grossa i{width:18px;height:18px}",
      ".cn-btn.cest.pronto{background:#ff5d6c;transform:scale(1.2)}.cn-btn.cest.sicuro{background:rgba(255,93,108,.6)}",
      ".cn-tav-adesivi{flex:none;display:grid;grid-template-columns:repeat(9,1fr);gap:3px}",
      ".cn-btn.cn-ades{min-height:0;height:34px;padding:0;font-size:21px;border-radius:9px;background:rgba(255,255,255,.12)}",
      ".cn-tav.bloccata .cn-tav-str,.cn-tav.bloccata .cn-tav-adesivi{opacity:.35;pointer-events:none}",
      ".cn-dis .cn-azione{min-height:46px}.cn-dis-stato{flex:1;font-size:12px;font-weight:800;opacity:.85}.cn-dis .cn-azione .vai{flex:0 0 46%}",
      ".cn-dis-corpo{flex:1;min-height:0;display:flex;flex-direction:column}",
      ".cn-centro{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;font-weight:800}.cn-guarda-scena{width:62%;border-radius:16px}",
      ".cn-fine-s .cn-podio{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:2px 0 8px}",
      ".cn-gradino{display:flex;flex-direction:column;align-items:center;width:31%;max-width:130px;min-width:0}",
      ".cn-gradino .f{width:56%;aspect-ratio:1;border-radius:50%;object-fit:cover;object-position:50% 38%;background:rgba(255,255,255,.2);border:3px solid #fff;animation:cnPop .6s both}",
      ".cn-gradino.g1 .f{width:72%;border-color:#ffcf3f;box-shadow:0 0 18px rgba(255,207,63,.6)}",
      ".cn-gradino .n{font-weight:900;font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}.cn-gradino.tu .n{color:#ffcf3f}.cn-gradino .pt{font-size:12px;opacity:.85}",
      ".cn-gradino .base{width:100%;border-radius:10px 10px 0 0;text-align:center;font-size:22px;padding-top:4px;margin-top:3px}",
      ".cn-gradino.g1 .base{height:46px;background:linear-gradient(#ffcf3f,#e0a90a)}.cn-gradino.g2 .base{height:34px;background:linear-gradient(#e9ecef,#adb5bd)}.cn-gradino.g3 .base{height:24px;background:linear-gradient(#f4a261,#c0763a)}",
      ".cn-resto{margin:0 0 6px!important}.cn-fig-btn{margin:4px 0 6px!important}",
      ".cn-fig-velo{position:fixed;inset:0;z-index:9999;background:rgba(8,4,24,.92);display:flex;align-items:center;justify-content:center;padding:12px}",
      ".cn-fig-box{display:flex;flex-direction:column;gap:10px;align-items:center;max-height:100%;width:100%;max-width:420px}",
      ".cn-fig-img{max-width:100%;max-height:calc(var(--alt,100dvh) - 110px);border-radius:14px}.cn-fig-tasti{display:flex;gap:8px;width:100%}.cn-fig-tasti .btn{flex:1;margin:0}",
      "@keyframes cnEntra{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
      "@keyframes cnPop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:none}}",
      "@keyframes cnBoing{40%{transform:scale(1.35)}100%{transform:none}}",
      "@keyframes cnVola{0%{opacity:0;transform:translate(0,20px) scale(.6)}12%{opacity:1;transform:translate(0,0) scale(1.15)}100%{opacity:0;transform:translate(var(--dx),-420px) scale(1)}}",
      "@keyframes cnPomo{0%{opacity:0;transform:translate(0,20px) scale(.6)}10%{opacity:1}55%{transform:translate(var(--dx),-300px) scale(1.3) rotate(200deg)}62%{transform:translate(var(--dx),-300px) scale(2.4,1.1)}85%{opacity:1;transform:translate(var(--dx),-290px) scale(2.2,1)}100%{opacity:0;transform:translate(var(--dx),-280px) scale(2.2,1)}}",
      "@keyframes cnGiu{from{transform:translateY(-40px) scale(1.6)}to{transform:none}}",
      "@keyframes cnLancia{50%{transform:translateY(-30px) scale(1.04)}100%{transform:translateY(-4px) rotate(-1deg)}}",
      "@keyframes cnSfila{0%{opacity:0;transform:scale(.5) rotate(-8deg)}100%{opacity:1;transform:none}}",
      "@keyframes cnNome{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}",
      "@keyframes cnArrProt{from{transform:translate(70%,0);opacity:0}to{transform:translate(-50%,0);opacity:1}}",
      "@keyframes cnTimbro{0%{opacity:0;transform:scale(2) rotate(-12deg)}100%{opacity:1;transform:rotate(-3deg)}}",
      "@keyframes cnAvv{0%{opacity:0}10%,80%{opacity:1}100%{opacity:0}}",
      // il riquadro della foto nella saletta
      ".cn-fb{border-radius:14px;background:linear-gradient(135deg,#3a1f78,#5a2ca0);color:#fff;padding:7px 8px;margin:0 0 8px;box-shadow:0 2px 10px rgba(0,0,0,.18)}",
      ".cn-fb-riga{display:flex;align-items:center;gap:7px;min-width:0}",
      ".cn-fb-w{flex:none;position:relative;width:42px;height:42px;border-radius:50%;overflow:hidden;background:radial-gradient(#fff6d8,#ffb84a);box-shadow:0 0 0 2px #ffcf3f}.cn-fb-f{position:absolute;width:150%;height:150%;left:-25%;top:-14%;object-fit:cover}",
      ".cn-fb-col{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}",
      ".cn-fb-tx{font-weight:900;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".cn-fb-sotto{font-size:11.5px;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".cn-btn.cn-fb-b{flex:none;min-height:38px;padding:0 10px;font-size:13.5px;border-radius:12px;background:rgba(255,255,255,.18)}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Chi di Noi?", icona: "🫵",
    descrizione: "A turno uno di voi è sotto torchio, in 20 posti buffi: scegliete l'immagine giusta per lui, scrivete la battuta, disegnate su di lui. Vince chi la pensa come gli amici!",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    modi: [], soloOnline: true,
    postiOnline: MAX,
    riassunto: function (imp) {
      var i = impNorm(imp), tutti = posti().length;
      return i.nPosti + " posti · " + i.nDom + " domande per posto · tempi " + (i.tempi === "calma" ? "con calma" : i.tempi) + (i.posti.length < tutti ? " · " + i.posti.length + " posti accesi su " + tutti : "") + (i.foto ? "" : " · solo avatar (niente foto)");
    },
    regole: [
      "📸 All'inizio ognuno si fa un <b>selfie</b> (o sceglie una foto, o usa l'avatar) e un <b>filtro buffo</b>: la foto la vede solo chi è entrato dal link della serata, e sparisce quando uscite.",
      "In ogni posto uno di voi è <b>sotto torchio</b>: le domande sono su di lui (anche lui gioca).",
      "🖼️ <b>Immagini</b>: scegli la carta giusta per lui. ✍️ <b>Scrivi</b> e 🎨 <b>Disegna</b>: tutti scrivono o disegnano, poi si vota. 👆 <b>Chi di noi</b>: tocca la faccia di un amico.",
      "<b>100 punti per ogni amico che sceglie come te</b> (il voto di chi è sotto torchio vale doppio). +100 a chi scrive la battuta o fa il disegno più votato.",
      "🃏 <b>3 jolly</b> a testa: raddoppiano i punti di una domanda. Se votate tutti uguale: <b>TUTTI D'ACCORDO</b>, +100 a tutti.",
      "Gran finale: <b>«Passa il ritratto!»</b>, la faccia di un amico passa di telefono in telefono. Punti doppi!"
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, i0 = impNorm(dove);
      dove.posti = i0.posti.slice(); dove.nPosti = i0.nPosti; dove.nDom = i0.nDom; dove.tempi = i0.tempi; dove.foto = i0.foto;
      var stima = el("div", { class: "modulo-nota", style: "margin-top:8px" });
      function aggStima() { var n = (aiuti.giocatori && aiuti.giocatori.length) || 6; tx(stima, "⏱️ In " + Math.max(3, n) + " circa " + stimaMinuti(impNorm(dove), Math.max(3, n)) + " minuti"); }
      function gruppo(etichetta, voci, prop) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: etichetta }));
        var g = el("div", { class: "modo-griglia", style: "display:grid;grid-template-columns:repeat(" + Math.min(4, voci.length) + ",1fr);gap:8px" });
        voci.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[prop] === v[0] ? " attiva" : ""), style: "justify-content:center;text-align:center;padding:11px 4px", onclick: function () {
            dove[prop] = v[0]; [].forEach.call(g.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva"); aggStima();
          } }, [el("div", { class: "mt", text: v[1] })]);
          g.appendChild(b);
        });
        box.appendChild(g);
        return g;
      }
      gruppo("Quanti posti (un round per posto)", [[3, "3"], [4, "4"], [5, "5"], [6, "6"], [7, "7"], [8, "8"], [10, "10"]], "nPosti");
      gruppo("Domande per posto", [[3, "3"], [4, "4"], [5, "5"]], "nDom");
      gruppo("Tempi", [["calma", "🐢 Con calma"], ["normali", "Normali"], ["veloci", "⚡ Veloci"]], "tempi");
      gruppo("Le facce", [[true, "📸 Foto vere"], [false, "🙂 Solo avatar"]], "foto");
      box.appendChild(stima); aggStima();
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Posti accesi (escono a caso tra questi)" }));
      var gP = el("div", { class: "cat-griglia" });
      var notaP = el("div", { class: "link-avviso", hidden: "hidden", text: "Lasciane accesi almeno 3." });
      posti().forEach(function (p) {
        var c = el("button", { class: "cat-chip" + (dove.posti.indexOf(p.id) >= 0 ? " attiva" : ""), onclick: function () {
          var k = dove.posti.indexOf(p.id);
          if (k >= 0 && dove.posti.length <= 3) { notaP.hidden = false; return; }
          notaP.hidden = true;
          if (k >= 0) dove.posti.splice(k, 1); else dove.posti.push(p.id);
          c.classList.toggle("attiva", dove.posti.indexOf(p.id) >= 0); aggStima();
        } }, [el("span", { class: "ci", text: p.emoji }), el("span", { text: nomeCorto(p) }), el("span", { class: "spunta", text: "✓" })]);
        gP.appendChild(c);
      });
      box.appendChild(gP); box.appendChild(notaP);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
})();
