// PROVE del pezzo p3-u (Passo 3): js/compagnia.js — memoria delle compagnie, link fisso, tessere della home,
// "Le tue compagnie", foglio "nome ed emoji", "Giocato di recente". Scenari 361-367.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   const t = await (await fetch("/.agents/skills/prova-nel-browser/passo3/tessere.js?" + Date.now())).text(); (0, eval)(t);
//   await COPIONE.prova(361)   …   await COPIONE.prova(367)
// Finché il core non chiama SGCompagnia.collega (p3-a) gli aiuti del core li passa la prova (api finta), e finché
// net.js non ha SGNet.sbircia (p3-n) c'è una sbirciata finta che risponde quello che si mette in W.__sbResp.
// La lista "compagnie" del profilo si salva in W.__cmpNube[uid] (due telefoni con lo stesso uid la vedono uguale).
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window;
  function no(perche) { throw new Error(perche); }
  var aggiungi = (W.COPIONE && W.COPIONE.aggiungi) ? W.COPIONE.aggiungi.bind(W.COPIONE) : function (n, s) { W.COPIONE.scenari[n] = s; };

  // ---- i telefoni della compagnia: lista del profilo condivisa per uid, sbirciata finta, pagina "in vista" ----
  function uidDi(w) { var u = w.SGNube && w.SGNube.utente && w.SGNube.utente(); return (u && u.uid) || "?"; }
  function preparaTel(w) {
    w.__giri = 0; w.__nascosto = false;
    try { Object.defineProperty(w.document, "hidden", { configurable: true, get: function () { return !!w.__nascosto; } }); } catch (e) {}
    try { Object.defineProperty(w.document, "visibilityState", { configurable: true, get: function () { return w.__nascosto ? "hidden" : "visible"; } }); } catch (e) {}
    if (w.SGNube) {
      w.SGNube.lista = function (nome) { var l = ((W.__cmpNube[uidDi(w)] || {})[nome]) || []; return JSON.parse(JSON.stringify(l)); };
      w.SGNube.salvaLista = function (nome, lista) { var u = uidDi(w); W.__cmpNube[u] = W.__cmpNube[u] || {}; W.__cmpNube[u][nome] = JSON.parse(JSON.stringify(lista)); };
    }
    // la sbirciata finta (al posto di quella di net.js): risponde dopo 60 ms con W.__sbResp[C] (se manca: "vuota")
    w.SGNet.sbircia = function (codici, cb) {
      w.__giri++;
      setTimeout(function () {
        var es = {};
        codici.forEach(function (c) { var r = W.__sbResp[c] || { stato: "vuota", msg: null }; es[c] = { stato: r.stato, msg: r.msg || null, gen: (r.msg && r.msg.gen) || 0 }; });
        cb(es);
      }, 60);
    };
  }
  // gli aiuti del core (finti finché p3-a non chiama collega lui): registra quello che il modulo chiede al core
  function apiFinta(w) {
    var d = w.document, rec = w.__rec = { apri: [], rinominata: [], chiedi: [], pill: [], home: 0 };
    w.__mia = {}; w.__rap = {};
    function el(t, c, txt) { var e = d.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
    return {
      el: w.SG._util.el, svuota: w.SG._util.svuota,
      schermata: function (o) {
        var s = el("div", "schermata"), testa = el("div", "testa"), cont = el("div", "contenuto"), piede = el("div", "piede");
        if (o.indietro) { var b = el("button", "btn btn-fantasma btn-piccolo", "‹"); b.onclick = o.indietro; testa.appendChild(b); }
        var ti = el("div"); ti.appendChild(el("h1", null, o.titolo || "")); testa.appendChild(ti);
        s.appendChild(testa); s.appendChild(cont); s.appendChild(piede); s._contenuto = cont; s._piede = piede; return s;
      },
      mostra: function (s) { var a = d.getElementById("app"); while (a.firstChild) a.removeChild(a.firstChild); a.appendChild(s); },
      home: function () { rec.home++; },
      conferma: function (q, n, si, fn) { w.SG.conferma(q, n, si, fn); },
      pillola: function (k, t) { if (t) rec.pill.push(t); },
      cifre: function (n) { return String(n); },
      profilo: function () { return w.SGNube.profilo(); },
      omino: function (cfg, o) { return w.SGOmino.svg(cfg, o); },
      apri: function (C) { rec.apri.push(C); },
      entra: function () {},
      mia: function (C) { return w.__mia[C] || null; },
      chiedi: function (uid, nome, fatto) { rec.chiedi.push(uid); w.__rap[uid] = "inviata"; return Promise.resolve().then(function () { fatto("📨 Richiesta mandata a " + nome + "."); }); },
      rapporto: function (uid) { return w.__rap[uid] || "nessuno"; },
      rinominata: function (C, comp) { rec.rinominata.push([C, comp]); },
      nomeGioco: function (gid) { return { tris: "Tris", scopa: "Scopa" }[gid] || null; }
    };
  }
  // apre un telefono già col profilo, aspetta la home e collega SGCompagnia con l'api finta
  async function telComp(nome, opz) {
    opz = opz || {};
    var prima0 = opz.prima;
    var w = await W.apriTel(nome, Object.assign({}, opz, { prima: function (x) { preparaTel(x); if (prima0) prima0(x); } }));
    if (!await W.aspetta(function () { return w.document.querySelector(".home .contenuto"); }, 5000)) no(nome + ": niente home");
    if (!w.SGCompagnia) no(nome + ": SGCompagnia non c'è (index.html non carica js/compagnia.js?)");
    w.SGCompagnia.collega(apiFinta(w));
    return w;
  }
  // la scatola delle tessere in home (al posto di quella che metterà p3-d)
  function scatola(w) {
    var d = w.document, b = d.querySelector(".home-comp");
    if (!b) { b = d.createElement("div"); b.className = "home-comp"; var c = d.querySelector(".home .contenuto"); c.insertBefore(b, c.children[1] || null); }
    return b;
  }
  function inizio() { W.__cmpNube = {}; W.__sbResp = {}; }
  var nomiStato = function (w) { return [].map.call(w.document.querySelectorAll(".cmp-tessera"), function (t) { return t.querySelector(".cmp-stato").textContent + " | " + t.querySelector(".cmp-entra").textContent; }); };
  var avatarVisti = function (t) { return [].filter.call(t.querySelectorAll(".cmp-av"), function (a) { return !a.hidden; }).length; };
  // un telefono a misura (senza animazioni): restituisce la finestra
  async function misura(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata,.sl-velo,.conferma-sfondo{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(350);
  }
  // niente esce di lato: nessun elemento oltre il bordo destro e la pagina non scorre di lato
  function fuoriDiLato(w, sel, larg) {
    var d = w.document;
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato (" + d.documentElement.scrollWidth + " px)";
    var x = [].find.call(d.querySelectorAll(sel), function (n) { var r = n.getBoundingClientRect(); return r.width && (r.right > larg + 0.5 || r.left < -0.5); });
    return x ? "«" + (x.className || x.tagName) + "» esce di lato (" + Math.round(x.getBoundingClientRect().right) + " px)" : "";
  }

  // 361. Memoria: salva / trova / togli / lapide; due telefoni con lo stesso uid; al massimo 8
  aggiungi(361, { nome: "Compagnie: memoria, lista del profilo su due telefoni, lapide, massimo 8", fai: async function () {
    inizio();
    var P = await telComp("Paky", { x: 0 }), C = P.SGCompagnia;
    if (C.elenco().length) no("all'inizio c'è già qualcosa");
    var v = C.salva({ c: "kfrtpq", n: "Quelli del giovedì", e: "🍻", rv: 1000 });
    if (!v || v.c !== "KFRTPQ" || v.n !== "Quelli del giovedì" || v.e !== "🍻") no("salva: " + JSON.stringify(v));
    if (!C.trova("KFRTPQ")) no("trova non la trova");
    // il nome passa solo con un rv più nuovo
    if (C.aggiorna("KFRTPQ", { nome: "Vecchio", emoji: "🎲", rv: 500 })) no("aggiorna ha preso un nome più vecchio");
    if (!C.aggiorna("KFRTPQ", { nome: "Quelli del venerdì", emoji: "🍕", rv: 2000 }) || C.trova("KFRTPQ").n !== "Quelli del venerdì") no("aggiorna non ha preso il nome più nuovo");
    var loc = JSON.parse(P.localStorage.getItem("sg-compagnie") || "[]");
    if (!loc.some(function (x) { return x.c === "KFRTPQ"; })) no("non è in sg-compagnie");
    var nube = (W.__cmpNube["finto-Paky"] || {}).compagnie || [];
    if (!nube.some(function (x) { return x.c === "KFRTPQ" && x.n === "Quelli del venerdì"; })) no("non è nella lista del profilo: " + JSON.stringify(nube));
    // secondo telefono, stesso profilo: la vede subito (sincronizza a collega)
    var P2 = await telComp("Paky2", { x: 185, profilo: { nome: "Paky", uid: "finto-Paky" } });
    if (!P2.SGCompagnia.trova("KFRTPQ")) no("Paky2 (stesso profilo) non la vede");
    // Paky2 la toglie: lapide nel profilo; Paky dopo sincronizza non la vede più (e non torna su)
    P2.SGCompagnia.togli("KFRTPQ");
    if (P2.SGCompagnia.trova("KFRTPQ")) no("Paky2: tolta ma c'è ancora");
    var lap = ((W.__cmpNube["finto-Paky"] || {}).compagnie || []).filter(function (x) { return x.c === "KFRTPQ"; })[0];
    if (!lap || !lap.via) no("nel profilo non c'è la lapide: " + JSON.stringify(lap));
    C.sincronizza();
    if (C.trova("KFRTPQ")) no("Paky dopo sincronizza la vede ancora");
    if (P2.SGCompagnia.elenco().length || C.elenco().length) no("elenco non vuoto dopo togli");
    // riaperta (salva di nuovo): torna su tutti e due
    C.salva({ c: "KFRTPQ", n: "Quelli del venerdì", e: "🍕", rv: 2000 });
    P2.SGCompagnia.sincronizza();
    if (!P2.SGCompagnia.trova("KFRTPQ")) no("riaperta: Paky2 non la rivede");
    // lapide più vecchia di 60 giorni: si butta
    var vecchia = { c: "ZZZZZZ", via: 1, u: Date.now() - 61 * 864e5 };
    P.localStorage.setItem("sg-compagnie", JSON.stringify(JSON.parse(P.localStorage.getItem("sg-compagnie")).concat([vecchia])));
    C.sincronizza();
    if (JSON.parse(P.localStorage.getItem("sg-compagnie")).some(function (x) { return x.c === "ZZZZZZ"; })) no("la lapide di 61 giorni non è stata buttata");
    // al massimo 8 (la nona: avviso)
    for (var i = 0; i < 7; i++) if (!C.salva({ c: "ABCDE" + "FGHJKLM"[i], n: "Gruppo " + i, e: "🎲", rv: 1 })) no("non salva la " + (i + 2) + "ª");
    if (C.elenco().length !== 8) no("dovevano essere 8: " + C.elenco().length);
    var nona = C.salva({ c: "QWERTY", n: "Nona", e: "🔥" });
    if (nona || C.trova("QWERTY")) no("ha salvato la nona");
    if (!P.__rec.pill.some(function (t) { return /Hai già 8 compagnie: togline una/.test(t); })) no("niente avviso per la nona: " + P.__rec.pill.join(","));
    // ordine: dalla più usata di recente
    await W.dorme(5); C.usata("ABCDEF");
    if (C.elenco()[0].c !== "ABCDEF") no("usata non la mette in cima");
    return "salva/trova/aggiorna (rv)/togli con lapide su due telefoni, lapide vecchia buttata, nona rifiutata con avviso";
  } });

  // 362. Link: codifica di nome ed emoji, letto dal core come parametri del link (gruppo, n, e)
  aggiungi(362, { nome: "Link fisso della compagnia: nome ed emoji tornano uguali", fai: async function () {
    inizio();
    var P = await telComp("Paky", { x: 0 }), C = P.SGCompagnia;
    C.salva({ c: "KFRTPQ", n: "Giovedì & co=1", e: "🍻", rv: 5 });
    var l = C.link("KFRTPQ");
    if (!/#gruppo=KFRTPQ&n=/.test(l)) no("link: " + l);
    if (!/^gruppo=KFRTPQ&n=[^&= ]+&e=[^&= ]+$/.test(l.split("#")[1])) no("link non codificato: " + l);
    var m = C.messaggio("KFRTPQ");
    if (m.indexOf("«🍻 Giovedì & co=1»") < 0 || m.indexOf("scrivi KFRTPQ") < 0 || m.indexOf("Ho un codice") < 0) no("messaggio: " + m);
    // un altro telefono apre il link: il core lo legge (e lo toglie dall'indirizzo) e salva la compagnia con nome ed emoji
    // uguali (l'entrata vera nella Sala la prova la 311b di compagnia.js)
    var L = await W.apriTel("Luca", { x: 185, hash: l.split("#")[1] });
    var pl = await W.aspetta(function () { return L.SGCompagnia && L.SGCompagnia.trova("KFRTPQ"); }, 6000);
    if (!pl || pl.n !== "Giovedì & co=1" || pl.e !== "🍻") no("salvata dal core: " + JSON.stringify(pl));
    return "link " + l.split("#")[1].slice(0, 60) + "… letto dal core e salvato: " + pl.e + " " + pl.n;
  } });

  // 363. Tessere: i testi giusti per ogni stato e aggiornate sugli stessi nodi
  aggiungi(363, { nome: "Tessere della home: stati giusti, aggiornate al loro posto", fai: async function () {
    inizio();
    var P = await telComp("Paky", { x: 0 }), C = P.SGCompagnia;
    C.salva({ c: "KFRTPQ", n: "Quelli del giovedì", e: "🍻", rv: 1 });
    await W.dorme(5); C.salva({ c: "ABCDEF", n: "Calcetto", e: "⚽", rv: 1 });
    await W.dorme(5); C.salva({ c: "GHJKLM", n: "Cugini", e: "🏠", rv: 1 });
    var om = P.SGOmino.casuale("Luca");
    W.__sbResp = {
      ABCDEF: { stato: "viva", msg: { t: "sala", gen: 1, gioco: "tris", membri: [{ id: "host", nome: "Paky", omino: om }, { id: "g1", nome: "Luca", emoji: "🐱" }] } },
      GHJKLM: { stato: "ferma", msg: { t: "__hostgone" } }
    };
    var box = scatola(P), n = C.tessere(box);
    if (n !== 3) no("tessere() dice " + n + " invece di 3");
    var tess = box.querySelectorAll(".cmp-tessera");
    if (tess.length !== 2) no("tessere: " + tess.length + " invece di 2");
    if (!/📌 Le tue compagnie \(3\) ›/.test(box.textContent)) no("manca «📌 Le tue compagnie (3) ›»");
    // la più usata di recente è la prima (Cugini, poi Calcetto)
    if (tess[0].querySelector(".cmp-nome").textContent !== "Cugini") no("ordine: " + tess[0].textContent);
    if (!await W.aspetta(function () { return P.__giri === 1 && !/…/.test(nomiStato(P).join()); }, 2000)) no("dopo la sbirciata: " + nomiStato(P).join(" / ") + " (giri " + P.__giri + ")");
    var s = nomiStato(P);
    if (s[0] !== "Nessuno ancora | Apri la serata ›") no("ferma: " + s[0]);
    if (s[1] !== "🟢 Paky e Luca sono dentro · giocano a Tris | Entra ›") no("viva: " + s[1]);
    if (avatarVisti(tess[1]) !== 2 || !tess[1].querySelector(".cmp-av svg")) no("avatar della tessera viva: " + avatarVisti(tess[1]));
    // da qui: nessun nodo nuovo nella struttura (solo testi e avatar cambiano)
    var strutt = 0, attenti = [box.firstChild].concat([].slice.call(box.querySelectorAll(".cmp-tessera, .cmp-mezzo, .cmp-dx, .cmp-avatar")));
    var mo = new P.MutationObserver(function (l) { l.forEach(function (m) { if (m.type === "childList" && attenti.indexOf(m.target) >= 0) strutt++; }); });
    mo.observe(box, { childList: true, subtree: true });
    var primi = [].slice.call(tess);
    // seconda sbirciata (forzata): 4 membri + boh + vuota
    W.__sbResp = {
      ABCDEF: { stato: "viva", msg: { t: "sala", gen: 1, membri: [{ id: "host", nome: "Paky" }, { id: "g1", nome: "Luca" }, { id: "g2", nome: "Sara" }, { id: "g3", nome: "Gino" }, { id: "g4", nome: "Ada" }] } },
      GHJKLM: { stato: "boh" }
    };
    await new Promise(function (r) { C.sbircia(["GHJKLM", "ABCDEF"], r, true); });
    s = nomiStato(P);
    if (s[0] !== "… | Entra ›") no("boh: " + s[0]);
    if (s[1] !== "🟢 Paky, Luca e altri 3 sono dentro | Entra ›") no("viva con 5: " + s[1]);
    if (avatarVisti(tess[1]) !== 4) no("avatar con 5 dentro: " + avatarVisti(tess[1]) + " invece di 4");
    W.__sbResp = { ABCDEF: { stato: "viva", msg: { t: "sala", membri: [{ id: "host", nome: "Paky" }, { id: "g1", nome: "Luca" }, { id: "g2", nome: "Sara" }] } }, GHJKLM: { stato: "vuota" } };
    await new Promise(function (r) { C.sbircia(["GHJKLM", "ABCDEF"], r, true); });
    s = nomiStato(P);
    if (s[0] !== "Nessuno ancora | Apri la serata ›") no("vuota: " + s[0]);
    if (s[1] !== "🟢 Paky, Luca e Sara sono dentro | Entra ›") no("viva con 3: " + s[1]);
    // la Sala è mia (host) / sono dentro da ospite
    P.__mia.GHJKLM = { host: true, membri: [{ id: "host", nome: "Paky" }, { id: "g1", nome: "Luca" }, { id: "g2", nome: "Sara" }, { id: "g3", nome: "Gino" }] };
    P.__mia.ABCDEF = { host: false, membri: [{ id: "host", nome: "Luca" }, { id: "g1", nome: "Paky" }] };
    C.aggiornaTessere();
    s = nomiStato(P);
    if (s[0] !== "👑 La Sala è aperta · ci sono 3 amici | Torna ›") no("mia: " + s[0]);
    if (s[1] !== "🟢 Sei dentro | Torna ›") no("ospite: " + s[1]);
    // un nome nuovo arrivato dalla Sala: cambia al suo posto
    C.aggiorna("ABCDEF", { nome: "Calcetto del lunedì", emoji: "🔥", rv: 99 });
    if (tess[1].querySelector(".cmp-nome").textContent !== "Calcetto del lunedì" || tess[1].querySelector(".cmp-em").textContent !== "🔥") no("rinomina non arrivata sulla tessera");
    await W.dorme(50); mo.disconnect();
    var ora = [].slice.call(box.querySelectorAll(".cmp-tessera"));
    if (strutt || ora.length !== 2 || ora[0] !== primi[0] || ora[1] !== primi[1]) no("la tessera è stata rifatta (" + strutt + " cambi di struttura)");
    // senza profilo: "Entra e aspetta"
    delete P.__mia.GHJKLM; var pr = P.SGNube.profilo; P.__api_prof = pr;
    var api = apiFinta(P); api.profilo = function () { return null; }; C.collega(api); C.aggiornaTessere();
    if (nomiStato(P)[0] !== "Nessuno ancora | Entra e aspetta ›") no("senza profilo: " + nomiStato(P)[0]);
    // il tocco: api.apri(C)
    C.collega(apiFinta(P));
    tess[0].click();
    if (P.__rec.apri.join() !== "GHJKLM") no("tocco: apri(" + P.__rec.apri.join() + ")");
    return "ferma/viva(Tris)/boh/vuota/viva 3 e 5/mia/ospite/senza profilo: testi giusti; stessi nodi, " + avatarVisti(tess[1]) + " avatar; tocco → apri";
  } });

  // 364. Sbirciata al massimo ogni 30 s (home aperta 70 s: al massimo 3 giri); pagina nascosta: nessun giro
  aggiungi(364, { nome: "Sbirciata: al massimo una ogni 30 s, niente con l'app nascosta", fai: async function () {
    inizio();
    var P = await telComp("Paky", { x: 0 }), S = await telComp("Sara", { x: 185 });
    [P, S].forEach(function (w) { w.SGCompagnia.salva({ c: "KFRTPQ", n: "Giovedì", e: "🍻", rv: 1 }); });
    S.__nascosto = true; S.document.dispatchEvent(new S.Event("visibilitychange"));
    P.SGCompagnia.tessere(scatola(P)); S.SGCompagnia.tessere(scatola(S));
    // altre richieste nello stesso momento (es. la home ridisegnata): non fanno giri in più
    await W.dorme(300); P.SGCompagnia.tessere(scatola(P)); P.SGCompagnia.sbircia(["KFRTPQ"]);
    var t0 = Date.now(), giriP = [];
    while (Date.now() - t0 < 70000) { await W.dorme(1000); if (giriP[giriP.length - 1] !== P.__giri) giriP.push(P.__giri); }
    if (P.__giri < 2 || P.__giri > 3) no("Paky in 70 s: " + P.__giri + " giri (attesi 2-3)");
    if (S.__giri) no("Sara con l'app nascosta: " + S.__giri + " giri");
    // Sara torna nell'app: subito un giro
    S.__nascosto = false; S.document.dispatchEvent(new S.Event("visibilitychange"));
    if (!await W.aspetta(function () { return S.__giri === 1; }, 1500)) no("Sara tornata nell'app: " + S.__giri + " giri");
    // la home sparita: il timer si ferma da solo
    var g = P.__giri; scatola(P).remove(); await W.dorme(31500);
    if (P.__giri !== g) no("tessera tolta dalla pagina ma la sbirciata continua");
    return "Paky " + P.__giri + " giri in 70 s, Sara nascosta 0 giri e 1 al ritorno, timer fermo senza tessere";
  } });

  // 365. "Le tue compagnie": ricondividi, rinomina (foglio), togli con la conferma
  aggiungi(365, { nome: "Le tue compagnie: ricondividi, rinomina, togli", fai: async function () {
    inizio();
    var P = await telComp("Paky", { x: 0 }), C = P.SGCompagnia;
    C.salva({ c: "KFRTPQ", n: "Quelli del giovedì", e: "🍻", rv: 1 });
    await W.dorme(5); C.salva({ c: "ABCDEF", n: "Calcetto", e: "⚽", rv: 1 });
    C.tessere(scatola(P));
    if (!W.clicca(P, /Le tue compagnie \(2\)/)) no("non trovo «📌 Le tue compagnie (2) ›»");
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".cmp-g-voce").length === 2; }, 1500)) no("la schermata non ha 2 compagnie");
    if (!/codice\s*KFRTPQ/.test(W.testo(P))) no("manca «codice KFRTPQ»");
    if (!/Il link fisso vale sempre/.test(W.testo(P))) no("manca la nota");
    var voce = function (c) { return P.document.querySelector('.cmp-g-voce[data-codice="' + c + '"]'); };
    // ricondividi col menu del telefono (navigator.share)
    P.navigator.share = function (d) { P.__share = d; return Promise.resolve(); };
    voce("KFRTPQ").querySelector(".cmp-g-ricond").click();
    var sh = P.__share || {};
    if (!/#gruppo=KFRTPQ&n=Quelli%20del%20gioved%C3%AC&e=%F0%9F%8D%BB$/.test(sh.url || "")) no("url: " + sh.url);
    if (!/«🍻 Quelli del giovedì»/.test(sh.text) || !/scrivi KFRTPQ/.test(sh.text)) no("testo: " + sh.text);
    // senza menu: appunti e "✅ Link copiato!"
    P.navigator.share = undefined;
    try { Object.defineProperty(P.navigator, "clipboard", { configurable: true, value: { writeText: function (t) { P.__appunti = t; return Promise.resolve(); } } }); } catch (e) {}
    var bR = voce("KFRTPQ").querySelector(".cmp-g-ricond"); bR.click();
    if (!await W.aspetta(function () { return /Link copiato/.test(bR.textContent); }, 1000)) no("niente «✅ Link copiato!»");
    if (!/scrivi KFRTPQ\.\n.*#gruppo=KFRTPQ/.test(P.__appunti || "")) no("appunti: " + P.__appunti);
    if (!await W.aspetta(function () { return /Ricondividi/.test(bR.textContent); }, 2500)) no("il tasto non torna «📤 Ricondividi»");
    // rinomina col foglio
    voce("ABCDEF").querySelector(".cmp-g-nome").click();
    var campo = await W.aspetta(function () { return P.document.querySelector(".cmp-velo .cmp-campo"); }, 1000);
    if (!campo || campo.value !== "Calcetto") no("foglio del nome: " + (campo && campo.value));
    if (P.document.querySelectorAll(".cmp-velo .cmp-e").length !== 12) no("emoji nel foglio: " + P.document.querySelectorAll(".cmp-velo .cmp-e").length);
    campo.value = ""; campo.dispatchEvent(new P.Event("input"));
    if (!P.document.querySelector(".cmp-velo .cmp-ok").disabled) no("col nome vuoto il tasto è acceso");
    campo.value = "Calcetto del lunedì sera tardi e oltre"; campo.dispatchEvent(new P.Event("input"));
    [].find.call(P.document.querySelectorAll(".cmp-velo .cmp-e"), function (b) { return b.textContent === "🔥"; }).click();
    P.document.querySelector(".cmp-velo .cmp-ok").click();
    if (P.document.querySelector(".cmp-velo")) no("il foglio non si chiude");
    var x = C.trova("ABCDEF");
    if (!x || x.n !== "Calcetto del lunedì sera tardi e oltre".slice(0, 24) || x.e !== "🔥") no("rinomina: " + JSON.stringify(x));
    if (voce("ABCDEF").querySelector(".cmp-nome").textContent !== x.n || voce("ABCDEF").querySelector(".cmp-em").textContent !== "🔥") no("la riga non mostra il nome nuovo");
    var rn = P.__rec.rinominata[0];
    if (!rn || rn[0] !== "ABCDEF" || rn[1].nome !== x.n || rn[1].emoji !== "🔥" || !(rn[1].rv > 1)) no("api.rinominata: " + JSON.stringify(rn));
    // togli: la conferma dell'app (i telefoni finti la toccano da soli)
    voce("KFRTPQ").querySelector(".cmp-g-togli").click();
    if (!await W.aspetta(function () { return /Togliere «🍻 Quelli del giovedì» dalla lista\?/.test(W.testo(P)); }, 800)) no("niente domanda di conferma");
    if (!await W.aspetta(function () { return !voce("KFRTPQ"); }, 2500)) no("dopo la conferma la riga c'è ancora");
    if (C.trova("KFRTPQ")) no("tolta ma è ancora in memoria");
    if (!voce("ABCDEF")) no("ha tolto anche l'altra");
    return "ricondividi (menu e appunti), rinomina a 24 caratteri con 🔥 e api.rinominata, togli con la conferma";
  } });

  // 366. Giocato di recente: 25 → 20, niente doppioni, ultimo in cima; ➕ e segni; la riga a fine partita
  aggiungi(366, { nome: "Giocato di recente: 20 al massimo, niente doppioni, ➕", fai: async function () {
    inizio();
    var P = await telComp("Paky", { x: 0 }), C = P.SGCompagnia;
    for (var i = 0; i < 25; i++) C.segnaRecenti([{ nome: "Amico" + i, uid: "u" + i }], "tris");
    var r = C.recenti();
    if (r.length !== 20) no("recenti: " + r.length + " invece di 20");
    if (r[0].n !== "Amico24" || r[19].n !== "Amico5") no("ordine: " + r[0].n + " … " + r[19].n);
    // doppioni: stesso uid (anche con nome cambiato) e stesso nome senza uid
    C.segnaRecenti([{ nome: "Amico7 nuovo", uid: "u7" }, { nome: "Gino" }], "scopa");
    C.segnaRecenti([{ nome: "Gino" }], "tris");
    r = C.recenti();
    if (r.length !== 20) no("dopo i doppioni: " + r.length);
    if (r[0].n !== "Gino" || r[1].n !== "Amico7 nuovo") no("in cima: " + r[0].n + ", " + r[1].n);
    if (r.filter(function (x) { return x.u === "u7"; }).length !== 1 || r.filter(function (x) { return x.n === "Gino"; }).length !== 1) no("doppioni rimasti");
    // io non mi segno
    C.segnaRecenti([{ nome: "Paky", uid: P.SGNube.profilo().uid || "finto-Paky" }], "tris");
    if (C.recenti().some(function (x) { return x.n === "Paky"; })) no("si è segnato anche me");
    // la riga in home, con ➕ / ✓ / ⏳
    P.__rap.u24 = "amico"; P.__rap.u23 = "inviata";
    var box = scatola(P);
    var n = C.rigaRecenti(box, { conPiu: true });
    if (!/👥 Giocato di recente/.test(box.textContent)) no("manca il titolo");
    var chip = function (nome) { return [].find.call(box.querySelectorAll(".cmp-chip"), function (c) { return c.querySelector(".cmp-chip-t").textContent.indexOf(nome + " ·") === 0 || c.querySelector(".cmp-chip-t").textContent === nome; }); };
    if (!chip("Amico22") || chip("Amico22").querySelector(".cmp-chip-t").textContent !== "Amico22 · Tris") no("chip: " + (chip("Amico22") || {}).textContent);
    if (!chip("Amico24").querySelector(".cmp-segno") || chip("Amico24").textContent.indexOf("✓") < 0) no("amico senza ✓");
    if (chip("Amico23").textContent.indexOf("⏳") < 0) no("richiesta mandata senza ⏳");
    if (chip("Gino").querySelector(".cmp-piu")) no("Gino (senza profilo) ha il ➕");
    var piu = chip("Amico22").querySelector(".cmp-piu"); piu.click();
    if (P.__rec.chiedi.join() !== "u22" || piu.textContent !== "⏳") no("➕: chiedi(" + P.__rec.chiedi.join() + "), segno " + piu.textContent);
    // senza conPiu niente ➕
    C.rigaRecenti(box, { conPiu: false });
    if (box.querySelector(".cmp-piu")) no("senza conPiu c'è il ➕");
    // riga di fine partita: solo chi ha uid, non amici, al massimo 3
    var fine = P.document.createElement("div"); P.document.body.appendChild(fine);
    var k = C.rigaFine(fine, [{ nome: "Luca", uid: "a1" }, { nome: "Sara", uid: "u24" }, { nome: "Gino" }, { nome: "Ada", uid: "a2" }, { nome: "Rita", uid: "a3" }, { nome: "Pia", uid: "a4" }]);
    var tf = fine.textContent;
    if (k !== 3 || !/^👥Avetegiocatocon:Luca➕·Ada➕·Rita➕$/.test(tf.replace(/\s+/g, ""))) no("riga di fine: " + k + " «" + tf + "»");
    if (fine.firstChild.getBoundingClientRect().height > 30.5) no("riga di fine alta " + fine.firstChild.getBoundingClientRect().height);
    if (C.rigaFine(fine, [{ nome: "Gino" }, { nome: "Sara", uid: "u24" }]) !== 0 || fine.textContent) no("riga di fine senza nessuno da mostrare: «" + fine.textContent + "»");
    fine.remove();
    return n + " chip, ultimo in cima, doppioni tolti, ✓/⏳/➕ giusti; fine partita: Luca, Ada, Rita";
  } });

  // 367. Misure: foglio del nome e due tessere a 360x640 e 412x915; foglio con la tastiera (alto 360)
  aggiungi(367, { nome: "Misure: tessere, Le tue compagnie e foglio del nome (anche con la tastiera)", fai: async function () {
    inizio();
    var P = await telComp("Paky", { x: 0 }), C = P.SGCompagnia, esiti = [];
    C.salva({ c: "KFRTPQ", n: "Quelli del giovedì sera tardi", e: "🍻", rv: 1 });
    await W.dorme(5); C.salva({ c: "ABCDEF", n: "Calcettooooooooooooooooo", e: "⚽", rv: 1 });
    await W.dorme(5); C.salva({ c: "GHJKLM", n: "Cugini", e: "🏠", rv: 1 });
    var om = P.SGOmino.casuale("Luca");
    W.__sbResp = { GHJKLM: { stato: "viva", msg: { t: "sala", gioco: "scopa", membri: [{ id: "host", nome: "Massimiliano", omino: om }, { id: "g1", nome: "Bartolomeo", omino: om }, { id: "g2", nome: "Sara", omino: om }, { id: "g3", nome: "Gino", omino: om }, { id: "g4", nome: "Ada" }] } } };
    var box = scatola(P); C.tessere(box);
    await W.aspetta(function () { return /Massimiliano/.test(box.textContent); }, 2000);
    for (var mis of [[360, 640], [412, 915]]) {
      await misura(P, "Paky", mis[0], mis[1]);
      var e = fuoriDiLato(P, ".cmp-tessere, .cmp-tessere *", mis[0]); if (e) no(mis.join("x") + " tessere: " + e);
      [].forEach.call(box.querySelectorAll(".cmp-tessera"), function (t) { if (t.getBoundingClientRect().height > 64.5) no(mis.join("x") + " tessera alta " + t.getBoundingClientRect().height); });
      var st = box.querySelector(".cmp-tessera .cmp-stato").getBoundingClientRect(), tt = box.querySelector(".cmp-tessera").getBoundingClientRect();
      if (st.bottom > tt.bottom + 0.5) no(mis.join("x") + " lo stato esce dalla tessera");
      esiti.push(mis.join("x") + " tessere alte " + Math.round(tt.height));
    }
    // "Le tue compagnie"
    for (var mis2 of [[360, 640], [412, 915]]) {
      await misura(P, "Paky", mis2[0], mis2[1]);
      C.gestione(); await W.dorme(100);
      var e2 = fuoriDiLato(P, ".cmp-g-voce, .cmp-g-voce *", mis2[0]); if (e2) no(mis2.join("x") + " Le tue compagnie: " + e2);
      [].forEach.call(P.document.querySelectorAll(".cmp-g-tasti .btn"), function (b) { if (b.scrollWidth > b.clientWidth + 1) no(mis2.join("x") + " il tasto «" + b.textContent + "» è tagliato"); });
    }
    // il foglio del nome: 360x640, 412x915 e con la tastiera aperta (finestra alta 360)
    for (var mis3 of [[360, 640], [412, 915], [360, 360], [412, 430]]) {
      await misura(P, "Paky", mis3[0], mis3[1]);
      var f = C.foglioNome({ titolo: "📌 La vostra compagnia", nome: "Quelli del giovedì", emoji: "🍻" });
      await W.dorme(120);
      var e3 = fuoriDiLato(P, ".cmp-velo, .cmp-velo *", mis3[0]); if (e3) no(mis3.join("x") + " foglio: " + e3);
      var ok = P.document.querySelector(".cmp-velo .cmp-ok").getBoundingClientRect(), campo = P.document.querySelector(".cmp-velo .cmp-campo").getBoundingClientRect();
      if (ok.bottom > mis3[1] + 0.5 || campo.top < 0) no(mis3.join("x") + " il tasto del foglio non si vede (fondo " + Math.round(ok.bottom) + ")");
      esiti.push(mis3.join("x") + " foglio fino a " + Math.round(ok.bottom));
      f.chiudi();
    }
    return esiti.join("; ");
  } });
})();
